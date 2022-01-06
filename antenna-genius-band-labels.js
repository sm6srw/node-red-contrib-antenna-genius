module.exports = (RED) => {
    class AntennaGeniusBandLabels {
        constructor(config) {
            RED.nodes.createNode(this, config);

            var node = this;
            this.bandNameA = "";
            this.bandNameB = "";
            this.server = RED.nodes.getNode(config.server);

            this.server.client.on('connect', () => {
                this.status({ fill: "green", shape: "dot", text: "connected" });
            });

            this.server.client.on('close', () => {
                this.status({ fill: "red", shape: "ring", text: "disconnected" });
            });

            this.server.updatesEventEmitter.on("status", () => {
                let bandIndexA = this.server.status.portA_band;
                let bandIndexB = this.server.status.portB_band;

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
                }
            });

            this.server.updatesEventEmitter.on("antennas", () => {
                //            console.log('antennas');
            });

            this.server.updatesEventEmitter.on("bands", () => {
                //            console.log('bands');
            });
        }
    }
    RED.nodes.registerType("antenna-genius-band-labels", AntennaGeniusBandLabels);
}