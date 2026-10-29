module.exports = (RED) => {
    class AntennaGeniusActivateAntenna {
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

            emitter.on("connected", onConnected);
            emitter.on("closed", onClosed);

            node.on("close", () => {
                emitter.removeListener("connected", onConnected);
                emitter.removeListener("closed", onClosed);
            });

            node.on("input", (msg, send, done) => {
                if (msg.topic) {
                    if (this.server.info.name) {
                        this.status({
                            fill: "green",
                            shape: "dot",
                            text: this.server.info.name,
                        });
                    }

                    this.server.activate(msg.topic);
                } else {
                    this.status({
                        fill: "red",
                        shape: "ring",
                        text: "topic is not set",
                    });
                    this.server.resendStatus();
                }
                if (done) {
                    done();
                }
            });

            this.server.connect();
        }
    }
    RED.nodes.registerType(
        "antenna-genius-activate-antenna",
        AntennaGeniusActivateAntenna
    );
};
