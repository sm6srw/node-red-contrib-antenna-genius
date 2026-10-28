module.exports = (RED) => {
    class AntennaGeniusBandLabels {
        constructor(config) {
            RED.nodes.createNode(this, config);

            let node = this;
            this.bandNameA = "";
            this.bandNameB = "";
            this.server = RED.nodes.getNode(config.server);

            if(this.server == null) {
                this.status({
                    fill: "red",
                    shape: "ring",
                    text: "disconnected",
                });
                return;
            }

            const emitter = this.server.updatesEventEmitter;

            const onConnected = () => {
                if (this.server.info.name) {
                    this.status({
                        fill: "green",
                        shape: "dot",
                        text: this.server.info.name,
                    });
                }
            };

            const onClosed = () => {
                this.status({
                    fill: "red",
                    shape: "ring",
                    text: "disconnected",
                });
            };

            const onStatus = (forceUpdate) => {
                let bandIndexA = this.server.status.portA_band;
                let bandIndexB = this.server.status.portB_band;

                if (bandIndexA === undefined || bandIndexB === undefined) {
                    return;
                }

                if (bandIndexA < 0 || bandIndexA >= this.server.bands.length) {
                    return;
                }

                if (bandIndexB < 0 || bandIndexB >= this.server.bands.length) {
                    return;
                }

                let bandNameA = this.server.bands[bandIndexA].name;
                let bandNameB = this.server.bands[bandIndexB].name;

                let changed = forceUpdate;
                if (bandNameA !== this.bandNameA) {
                    changed = true;
                    this.bandNameA = bandNameA;
                }
                if (bandNameB !== this.bandNameB) {
                    changed = true;
                    this.bandNameB = bandNameB;
                }
                if (changed) {
                    node.send({
                        payload: {
                            bandLabelA: bandNameA,
                            bandLabelB: bandNameB,
                        },
                    });
                    this.status({
                        fill: "green",
                        shape: "dot",
                        text:
                            this.server.info.name +
                            " - " +
                            bandNameA +
                            "/" +
                            bandNameB,
                    });
                }
            };

            emitter.on("connected", onConnected);
            emitter.on("closed", onClosed);
            emitter.on("status", onStatus);

            this.on("close", () => {
                emitter.removeListener("connected", onConnected);
                emitter.removeListener("closed", onClosed);
                emitter.removeListener("status", onStatus);
            });

            this.server.connect();
        }
    }
    RED.nodes.registerType(
        "antenna-genius-band-labels",
        AntennaGeniusBandLabels
    );
};
