const Utils = require('./Utils');

module.exports = (RED) => {
    class AntennaGeniusActivateAntenna {
        constructor(config) {
            RED.nodes.createNode(this, config);

            var node = this;
            this.bandNameA = "";
            this.bandNameB = "";
            this.server = RED.nodes.getNode(config.server);

            this.server.client.on('connect', () => {
                this.status({ fill: "green", shape: "dot", text: "connected" });
            });

            this.server.client.on('error', () => {
                this.status({ fill: "red", shape: "ring", text: "disconnected" });
            });

            node.on('input', (msg, send, done) => {
                if(msg.topic) {
                    let command = Utils.encode(0, 0, 415, 0, msg.topic);

                    this.server.client.write(command);
                }
                else {
                    this.status({ fill: "red", shape: "ring", text: "topic is not set" });
                }
                if(done) {
                    done();
                }
        });

        }
    }
    RED.nodes.registerType("antenna-genius-activate-antenna", AntennaGeniusActivateAntenna);
}