class GeniusV4Protocol {
    constructor(socket) {
        this.socket = socket;
        this.seq = 0;
        this.pending = new Map();
        this.lineBuffer = "";
        this.statusHandler = null;
    }

    nextSeq() {
        this.seq = (this.seq % 255) + 1;
        return this.seq;
    }

    handleData(chunk) {
        this.lineBuffer += chunk.toString("utf8");
        const lines = this.lineBuffer.split("\n");
        this.lineBuffer = lines.pop();
        for (const line of lines) {
            this._handleLine(line.replace(/\r$/, ""));
        }
    }

    _handleLine(line) {
        if (!line) return;

        if (line.startsWith("S")) {
            const pipeIdx = line.indexOf("|");
            const msg = pipeIdx !== -1 ? line.substring(pipeIdx + 1) : "";
            if (this.statusHandler) {
                this.statusHandler(msg);
            }
            return;
        }

        if (line.startsWith("R")) {
            const pipeIdx1 = line.indexOf("|");
            const pipeIdx2 = line.indexOf("|", pipeIdx1 + 1);
            const seq = parseInt(line.substring(1, pipeIdx1));
            const hexResult = line.substring(pipeIdx1 + 1, pipeIdx2 !== -1 ? pipeIdx2 : undefined);
            const message = pipeIdx2 !== -1 ? line.substring(pipeIdx2 + 1) : "";

            const pending = this.pending.get(seq);
            if (!pending) return;

            if (parseInt(hexResult, 16) !== 0) {
                this.pending.delete(seq);
                pending.reject(new Error(`Command error: 0x${hexResult} - ${message}`));
                return;
            }

            if (pending.multi) {
                if (message === "") {
                    this.pending.delete(seq);
                    pending.resolve(pending.lines);
                } else {
                    pending.lines.push(message);
                }
            } else {
                this.pending.delete(seq);
                pending.resolve(message);
            }
        }
    }

    sendCommand(cmd) {
        const seq = this.nextSeq();
        return new Promise((resolve, reject) => {
            this.pending.set(seq, { resolve, reject, lines: null, multi: false });
            this.socket.write(`C${seq}|${cmd}\r`);
        });
    }

    sendCommandMulti(cmd) {
        const seq = this.nextSeq();
        return new Promise((resolve, reject) => {
            this.pending.set(seq, { resolve, reject, lines: [], multi: true });
            this.socket.write(`C${seq}|${cmd}\r`);
        });
    }

    onStatus(handler) {
        this.statusHandler = handler;
    }
}

const parseKeyValues = (tokens, startIndex) => {
    const kv = {};
    for (let i = startIndex; i < tokens.length; i++) {
        const eq = tokens[i].indexOf("=");
        if (eq !== -1) {
            kv[tokens[i].substring(0, eq)] = tokens[i].substring(eq + 1);
        }
    }
    return kv;
};

const parseInfo = (msg) => {
    // "info v=4.0.22 date=2023-08-22 btl=1.6 hw=2.0 serial=9A-3A-DC name=Antenna_Genius ports=2 antennas=8 mode=master uptime=3600"
    const tokens = msg.split(" ");
    const kv = parseKeyValues(tokens, 1);
    return {
        name: (kv.name || "").replace(/_/g, " "),
        ports: parseInt(kv.ports) || 2,
        antennas: parseInt(kv.antennas) || 8,
        firmware: kv.v || "",
        serial: kv.serial || "",
    };
};

const parsePort = (msg) => {
    // "port 1 auto=1 source=AUTO band=0 rxant=0 txant=0 tx=0 inhibit=0"
    const tokens = msg.split(" ");
    const portNum = parseInt(tokens[1]);
    const kv = parseKeyValues(tokens, 2);
    return {
        portNum,
        band: parseInt(kv.band) || 0,
        rxant: parseInt(kv.rxant) || 0,
        txant: parseInt(kv.txant) || 0,
        tx: parseInt(kv.tx) || 0,
        inhibit: parseInt(kv.inhibit) || 0,
    };
};

const parseAntennaList = (lines) => {
    // "antenna 1 name=Antenna_1 tx=0000 rx=0001 inband=0000"
    return lines.map((line) => {
        const tokens = line.split(" ");
        const index = parseInt(tokens[1]);
        const kv = parseKeyValues(tokens, 2);
        const rxMask = parseInt(kv.rx || "0", 16);
        const bands = [];
        for (let i = 0; i < 16; i++) {
            bands.push((rxMask >> i) & 1);
        }
        return {
            index,
            name: (kv.name || "").replace(/_/g, " "),
            bands,
        };
    });
};

const parseBandList = (lines) => {
    // "band 0 name=None freq_start=0.000000 freq_stop=0.000000"
    return lines.map((line) => {
        const tokens = line.split(" ");
        const index = parseInt(tokens[1]);
        const kv = parseKeyValues(tokens, 2);
        return {
            index,
            name: (kv.name || "").replace(/_/g, " "),
        };
    });
};

exports.GeniusV4Protocol = GeniusV4Protocol;
exports.parseInfo = parseInfo;
exports.parsePort = parsePort;
exports.parseAntennaList = parseAntennaList;
exports.parseBandList = parseBandList;
