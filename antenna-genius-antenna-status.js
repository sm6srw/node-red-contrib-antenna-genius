module.exports = (RED) => {
    class AntennaGeniusAntennaStatus {
        constructor(config) {
            RED.nodes.createNode(this, config);

            let node = this;
            this.antennaNumber = config.antennaNb;
            this.radioA = {
                selected: false,
                enabled: false,
                name: "",
                background: "",
            };
            this.radioB = {
                selected: false,
                enabled: false,
                name: "",
                background: "",
            };
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
                let maxNumberOfAntennas = this.server.status.stackReach * 8;
                if (
                    this.antennaNumber < 1 ||
                    this.antennaNumber > maxNumberOfAntennas ||
                    this.antennaNumber > this.server.antennas.length
                ) {
                    this.status({
                        fill: "red",
                        shape: "ring",
                        text: "antenna number is out of range",
                    });
                    return;
                }

                let changed = forceUpdate;

                // Selected?
                let radioAselected =
                    this.antennaNumber == this.server.status.portA_antenna;
                if (radioAselected != this.radioA.selected) {
                    changed = true;
                    this.radioA.selected = radioAselected;
                }

                let radioBselected =
                    this.antennaNumber == this.server.status.portB_antenna;
                if (radioBselected != this.radioB.selected) {
                    changed = true;
                    this.radioB.selected = radioBselected;
                }

                // Enabled?
                let radioAenabled =
                    this.server.antennas[this.antennaNumber - 1].bands[
                        this.server.status.portA_band
                    ] == 1;
                if (radioAenabled != this.radioA.enabled) {
                    changed = true;
                    this.radioA.enabled = radioAenabled;
                }

                let radioBenabled =
                    this.server.antennas[this.antennaNumber - 1].bands[
                        this.server.status.portB_band
                    ] == 1;
                if (radioBenabled != this.radioB.enabled) {
                    changed = true;
                    this.radioB.enabled = radioBenabled;
                }

                // Get name
                let name = this.server.antennas[this.antennaNumber - 1].name;
                if (this.radioA.name !== name) {
                    changed = true;
                    this.radioA.name = this.radioB.name = name;
                    this.status({
                        fill: "green",
                        shape: "dot",
                        text: this.server.info.name + " - " + name,
                    });
                }

                if (radioAenabled) {
                    if (radioAselected) {
                        this.radioA.background = this.server.selectedColor;
                    } else {
                        this.radioA.background = this.server.activeColor;
                    }
                } else {
                    this.radioA.background = this.server.disabledColor;
                }

                if (radioBenabled) {
                    if (radioBselected) {
                        this.radioB.background = this.server.selectedColor;
                    } else {
                        this.radioB.background = this.server.activeColor;
                    }
                } else {
                    this.radioB.background = this.server.disabledColor;
                }

                let radioATopic = "1;" + this.antennaNumber;
                let radioBTopic = "2;" + this.antennaNumber;

                if (changed) {
                    // Send copies so downstream nodes can't mutate the cached state.
                    node.send([
                        {
                            payload: { ...this.radioA },
                            enabled: this.radioA.enabled,
                            topic: radioATopic,
                        },
                        {
                            payload: { ...this.radioB },
                            enabled: this.radioB.enabled,
                            topic: radioBTopic,
                        },
                    ]);
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
        "antenna-genius-antenna-status",
        AntennaGeniusAntennaStatus
    );
};
