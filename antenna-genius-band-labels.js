module.exports = (RED) => {
    class AntennaGeniusBandLabels {
        constructor(config) {
            RED.nodes.createNode(this, config);

            var node = this;
            this.bandNameA = "";
            this.bandNameB = "";
            this.server = RED.nodes.getNode(config.server);

            this.server.updatesEventEmitter.on("connected", () => {
                if(this.server.info.name) {
                    this.status({ fill: "green", shape: "dot", text: this.server.info.name });
                }
            });

            this.server.updatesEventEmitter.on('closed', () => {
                this.status({ fill: "red", shape: "ring", text: "disconnected" });
            });

            this.server.updatesEventEmitter.on("status", () => {
                let bandIndexA = this.server.status.portA_band;
                let bandIndexB = this.server.status.portB_band;

                if(bandIndexA === undefined || bandIndexB === undefined) {
                    return;
                }

                if(bandIndexA < 0 || bandIndexA >= this.server.bands.length)
                {
                    return;
                }

                if(bandIndexB < 0 || bandIndexB >= this.server.bands.length)
                {
                    return;
                }

                let bandNameA = this.server.bands[bandIndexA].band_name;
                let bandNameB = this.server.bands[bandIndexB].band_name;

                let changed = false;
                if (bandNameA !== this.bandNameA) {
                    changed = true;
                    this.bandNameA = bandNameA;
                }
                if (bandNameB !== this.bandNameB) {
                    changed = true;
                    this.bandNameB = bandNameB;
                }
                if (changed) {
                    node.send({ payload: { bandLabelA: bandNameA, bandLabelB: bandNameB } });
                    this.status({ fill: "green", shape: "dot", text: this.server.info.name + " - " + bandNameA + "/" + bandNameB });
                }
            });

            this.server.connect();
        }
    }
    RED.nodes.registerType("antenna-genius-band-labels", AntennaGeniusBandLabels);
}