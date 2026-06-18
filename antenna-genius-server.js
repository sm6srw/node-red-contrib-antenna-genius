const Net = require("net");
const { PromiseSocket } = require("promise-socket");
const EventEmitter = require("events");
const Utils = require("./GeniusUtils");
const { GeniusV4Protocol, parseInfo, parsePort, parseAntennaList, parseBandList } = require("./GeniusV4Protocol");

class UpdatesEventEmitter extends EventEmitter {}

module.exports = (RED) => {
    class AntennaGeniusServerNode {
        constructor(n) {
            RED.nodes.createNode(this, n);
            this.host = n.host;
            this.port = n.port;
            this.disabledColor = n.disabledColor;
            this.activeColor = n.activeColor;
            this.selectedColor = n.selectedColor;
            this.autoConnect = n.autoConnect || false;

            this.status = {};
            this.info = {};
            this.antennas = [];
            this.bands = [];
            this.interval = null;
            this.timer = null;
            this.refresh = -1;
            this.apiVersion = null;
            this._v4 = null;
            this._v4DataHandler = null;

            this.updatesEventEmitter = new UpdatesEventEmitter();
            this.updatesEventEmitter.setMaxListeners(0);

            this.client = new Net.Socket();
            this.connected = false;

            this.client.on("close", () => {
                this.log("TCP connection disconnected with the server.");
                clearInterval(this.interval);
                clearTimeout(this.timer);
                this.connected = false;

                if (this._v4DataHandler) {
                    this.client.removeListener("data", this._v4DataHandler);
                    this._v4DataHandler = null;
                }
                this._v4 = null;

                if (this.updatesEventEmitter.listenerCount("closed") == 0) {
                    this.log(
                        "Stop retrying. No nodes are refering this connection anymore."
                    );
                    return;
                }

                if (this.autoConnect) {
                    this.log(
                        "TCP connection failed with the server. Will try to reconnect in 5 seconds"
                    );
                    this.timer = setTimeout(() => {
                        this.log("Reconnecting...");
                        this.connect();
                    }, 5000);
                    this.updatesEventEmitter.emit("closed");
                }
            });

            this.client.on("connect", async () => {
                this.log("TCP connection established with the server.");
                this.connected = true;

                // Detect API version from prologue banner.
                // V4 devices immediately send "V4.x.x AG\r\n" upon connection.
                // V3 devices send nothing and wait for commands.
                const banner = await new Promise((resolve) => {
                    let timer;
                    const handler = (data) => {
                        clearTimeout(timer);
                        resolve(data.toString());
                    };
                    timer = setTimeout(() => {
                        this.client.removeListener("data", handler);
                        resolve(null);
                    }, 300);
                    this.client.once("data", handler);
                });

                try {
                    if (banner && /^V4/.test(banner)) {
                        this.apiVersion = 4;
                        await this._connectV4();
                    } else {
                        this.apiVersion = 3;
                        await this._connectV3();
                    }
                } catch (err) {
                    this.warn("Connection setup failed: " + err.message);
                }
            });

            this.client.on("error", (err) => {
                this.warn(err);
            });

            this.on("close", (done) => {
                clearInterval(this.interval);
                clearTimeout(this.timer);
                this.autoConnect = false;
                this.connected = false;
                if (this._v4DataHandler) {
                    this.client.removeListener("data", this._v4DataHandler);
                    this._v4DataHandler = null;
                }
                this._v4 = null;
                this.client.end();
                this.forceUpdate();
                done();
            });
        }

        async _connectV3() {
            const promiseClient = new PromiseSocket(this.client);

            let command = Utils.encode(0, 0, 401, 0, "");
            await promiseClient.write(command);
            let packet = await promiseClient.read();
            this.status = Utils.decode(packet);

            command = Utils.encode(0, 0, 24, 0, "");
            await promiseClient.write(command);
            packet = await promiseClient.read();
            this.info = Utils.decode(packet);

            let numAntennas = 8 * this.status.stackReach;
            for (let index = 1; index <= numAntennas; ++index) {
                let command = Utils.encode(0, 0, 412, 0, index.toString());
                await promiseClient.write(command);
                let packet = await promiseClient.read();
                let data = Utils.decode(packet);
                this.antennas.push(data);
            }
            this.updatesEventEmitter.emit("antennas");

            for (let index = 0; index < 16; ++index) {
                let command = Utils.encode(0, 0, 82, 0, index.toString());
                await promiseClient.write(command);
                let packet = await promiseClient.read();
                let data = Utils.decode(packet);
                this.bands.push(data);
            }
            this.updatesEventEmitter.emit("bands");

            this.client.on("data", (packet) => {
                let decoded = Utils.decode(packet);
                if (decoded.command == 401) {
                    this.status = {
                        ...this.status,
                        ...Utils.decode(packet),
                    };
                    this.refresh = (this.refresh + 1) % 1500;
                    this.updatesEventEmitter.emit(
                        "status",
                        this.refresh == 0
                    );
                }
            });

            this.interval = setInterval(() => {
                let command = Utils.encode(0, 0, 401, 0, "");
                this.client.write(command);
            }, 400);

            this.forceUpdate();
            this.updatesEventEmitter.emit("connected");
        }

        async _connectV4() {
            const v4 = new GeniusV4Protocol(this.client);
            this._v4 = v4;

            const dataHandler = (chunk) => v4.handleData(chunk);
            this._v4DataHandler = dataHandler;
            this.client.on("data", dataHandler);

            const infoMsg = await v4.sendCommand("info get");
            this.info = parseInfo(infoMsg);

            const port1Msg = await v4.sendCommand("port get 1");
            const port2Msg = await v4.sendCommand("port get 2");
            const port1 = parsePort(port1Msg);
            const port2 = parsePort(port2Msg);
            this.status = {
                portA_band: port1.band,
                portA_antenna: port1.rxant,
                portA_tx: port1.tx,
                portA_inhibit: port1.inhibit,
                portB_band: port2.band,
                portB_antenna: port2.rxant,
                portB_tx: port2.tx,
                portB_inhibit: port2.inhibit,
                stackReach: Math.ceil(this.info.antennas / 8),
            };

            const antennaLines = await v4.sendCommandMulti("antenna list");
            this.antennas = parseAntennaList(antennaLines);
            this.updatesEventEmitter.emit("antennas");

            const bandLines = await v4.sendCommandMulti("band list");
            this.bands = parseBandList(bandLines);
            this.updatesEventEmitter.emit("bands");

            await v4.sendCommand("sub port all");

            v4.onStatus((msg) => {
                if (msg.startsWith("port ")) {
                    const portData = parsePort(msg);
                    if (portData.portNum === 1) {
                        this.status.portA_band = portData.band;
                        this.status.portA_antenna = portData.rxant;
                        this.status.portA_tx = portData.tx;
                        this.status.portA_inhibit = portData.inhibit;
                    } else if (portData.portNum === 2) {
                        this.status.portB_band = portData.band;
                        this.status.portB_antenna = portData.rxant;
                        this.status.portB_tx = portData.tx;
                        this.status.portB_inhibit = portData.inhibit;
                    }
                    this.refresh = (this.refresh + 1) % 1500;
                    this.updatesEventEmitter.emit("status", this.refresh === 0);
                } else if (msg === "antenna reload") {
                    this._reloadV4Antennas();
                }
            });

            this.updatesEventEmitter.emit("connected");
            // Emit initial status so consumer nodes produce output immediately.
            // In v3 the poll interval does this; in v4 we only get push updates
            // when something changes, so we trigger it manually here.
            this.refresh = 0;
            this.updatesEventEmitter.emit("status", true);
        }

        async _reloadV4Antennas() {
            if (!this._v4) return;
            try {
                const antennaLines = await this._v4.sendCommandMulti("antenna list");
                this.antennas = parseAntennaList(antennaLines);
                this.updatesEventEmitter.emit("antennas");
            } catch (err) {
                this.warn("Failed to reload antennas: " + err.message);
            }
        }

        activate(topic) {
            if (this.apiVersion === 4 && this._v4) {
                const [port, antenna] = topic.split(";");
                this._v4
                    .sendCommand(`port set ${port} rxant=${antenna} txant=${antenna}`)
                    .catch(() => {});
            } else {
                const command = Utils.encode(0, 0, 415, 0, topic);
                this.client.write(command);
            }
        }

        connect() {
            if (this.autoConnect && !this.connected & !this.client.connecting) {
                this.client.connect(this.port, this.host);
            }
        }

        forceUpdate() {
            this.refresh = -1;
        }
    }

    RED.nodes.registerType("antenna-genius-server", AntennaGeniusServerNode);
};
