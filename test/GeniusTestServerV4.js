const net = require("net");

var server;

const bands = [
    "band 0 name=None freq_start=0.000000 freq_stop=0.000000",
    "band 1 name=160m freq_start=1.600000 freq_stop=2.200000",
    "band 2 name=80m freq_start=3.300000 freq_stop=4.000000",
    "band 3 name=40m freq_start=6.800000 freq_stop=7.400000",
    "band 4 name=30m freq_start=9.900000 freq_stop=10.350000",
    "band 5 name=20m freq_start=13.800000 freq_stop=14.550000",
    "band 6 name=17m freq_start=17.868000 freq_stop=18.368000",
    "band 7 name=15m freq_start=20.800000 freq_stop=21.650000",
    "band 8 name=12m freq_start=24.690000 freq_stop=25.190000",
    "band 9 name=10m freq_start=27.800000 freq_stop=29.900000",
    "band 10 name=6m freq_start=49.800000 freq_stop=54.200000",
    "band 11 name=60m freq_start=5.000000 freq_stop=6.000000",
    "band 12 name=Custom_1 freq_start=0.000000 freq_stop=0.000000",
    "band 13 name=Custom_2 freq_start=0.000000 freq_stop=0.000000",
    "band 14 name=Custom_3 freq_start=0.000000 freq_stop=0.000000",
    "band 15 name=Custom_4 freq_start=0.000000 freq_stop=0.000000",
];

const antennas = [
    "antenna 1 name=Antenna_1 tx=ffff rx=ffff inband=0000",
    "antenna 2 name=Antenna_2 tx=ffff rx=ffff inband=0000",
    "antenna 3 name=Antenna_3 tx=ffff rx=ffff inband=0000",
    "antenna 4 name=Antenna_4 tx=ffff rx=ffff inband=0000",
    "antenna 5 name=Antenna_5 tx=ffff rx=ffff inband=0000",
    "antenna 6 name=Antenna_6 tx=ffff rx=ffff inband=0000",
    "antenna 7 name=Antenna_7 tx=ffff rx=ffff inband=0000",
    "antenna 8 name=Antenna_8 tx=ffff rx=ffff inband=0000",
];

const start = () => {
    server = net.createServer();
    server.on("connection", (conn) => {
        let lineBuffer = "";
        let portSubscribed = false;

        // Send v4 banner immediately on connect
        conn.write("V4.0.22 AG\r\n");

        const sendResponse = (seq, message) => {
            conn.write(`R${seq}|0|${message}\r\n`);
        };

        const sendMultiResponse = (seq, lines) => {
            for (const line of lines) {
                conn.write(`R${seq}|0|${line}\r\n`);
            }
            conn.write(`R${seq}|0|\r\n`);
        };

        conn.on("data", (data) => {
            lineBuffer += data.toString();
            const lines = lineBuffer.split("\n");
            lineBuffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.replace(/\r$/, "").trim();
                if (!trimmed.startsWith("C")) continue;

                const pipeIdx = trimmed.indexOf("|");
                const seq = parseInt(trimmed.substring(1, pipeIdx));
                const cmd = trimmed.substring(pipeIdx + 1);

                if (cmd === "info get") {
                    sendResponse(seq, "info v=4.0.22 date=2023-08-22 btl=1.6 hw=2.0 serial=9A-3A-DC name=TestGenius ports=2 antennas=8 mode=master uptime=3600");
                } else if (cmd === "port get 1") {
                    sendResponse(seq, "port 1 auto=1 source=AUTO band=1 rxant=2 txant=2 tx=0 inhibit=0");
                } else if (cmd === "port get 2") {
                    sendResponse(seq, "port 2 auto=1 source=AUTO band=2 rxant=4 txant=4 tx=0 inhibit=0");
                } else if (cmd === "antenna list") {
                    sendMultiResponse(seq, antennas);
                } else if (cmd === "band list") {
                    sendMultiResponse(seq, bands);
                } else if (cmd === "sub port all") {
                    portSubscribed = true;
                    sendResponse(seq, "");
                } else if (cmd.startsWith("port set ")) {
                    sendResponse(seq, "");
                } else {
                    sendResponse(seq, "");
                }
            }
        });
    });

    return new Promise((resolve) => {
        server.listen(0, "localhost", () => {
            return resolve(server.address().port);
        });
    });
};

const stop = () => {
    server.unref();
};

exports.start = start;
exports.stop = stop;
