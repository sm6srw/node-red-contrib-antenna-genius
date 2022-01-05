module.exports = function(RED) {
    function AntennaGeniusAntennaStatus(config) {
        RED.nodes.createNode(this,config);

        var node = this;
        this.antennaNumber = config.antennaNb;
        this.radioA = {
            selected: false,
            enabled: false,
            name: "",
            background: ""
        }
        this.radioB = {
            selected: false,
            enabled: false,
            name: "",
            background: ""
        }
        this.server = RED.nodes.getNode(config.server);

        this.server.client.on('connect', () => {
            this.status({fill:"green",shape:"dot",text:"connected"});
        });

        this.server.client.on('error', () => {
            this.status({fill:"red",shape:"ring",text:"disconnected"});        
        });

        this.server.updatesEventEmitter.on("status", () => {
            let changed = false;
            // Selected?
            let radioAselected = this.antennaNumber == this.server.status.portA_antenna;
            if(radioAselected != this.radioA.selected) {
                changed = true;
                this.radioA.selected = radioAselected;
            }

            let radioBselected = this.antennaNumber == this.server.status.portB_antenna;
            if(radioBselected != this.radioB.selected) {
                changed = true;
                this.radioB.selected = radioBselected;
            }

            // Enabled?
            let radioAenabled = this.server.antennas[this.antennaNumber - 1].antenna_bands[this.server.status.portA_band] == 1;
            if(radioAenabled != this.radioA.enabled) {
                changed = true;
                this.radioA.enabled = radioAenabled;
            }

            let radioBenabled = this.server.antennas[this.antennaNumber - 1].antenna_bands[this.server.status.portB_band] == 1;
            if(radioBenabled != this.radioB.enabled) {
                changed = true;
                this.radioB.enabled = radioBenabled;
            }

            // Get name
            let name = this.server.antennas[this.antennaNumber - 1].antenna_name;
            if(this.radioA.name !== name) {
                changed = true;
                this.radioA.name = this.radioB.name = name;
            }

            if(radioAenabled) {
                if(radioAselected) {
                    this.radioA.background = "blue";
                }
                else {
                    this.radioA.background = "green";
                }
            } 
            else {
                this.radioA.background = "gray";
            }

            if(radioBenabled) {
                if(radioBselected) {
                    this.radioB.background = "blue";
                }
                else {
                    this.radioB.background = "green";
                }
            } 
            else {
                this.radioB.background = "gray";
            }

            let radioATopic = "1;" + this.antennaNumber;
            let radioBTopic = "2;" + this.antennaNumber;

            if(changed) {
                node.send([{payload: this.radioA, enabled: this.radioA.enabled, topic: radioATopic}, {payload: this.radioB, enabled: this.radioB.enabled, topic: radioBTopic}]);
            }
        });

        this.server.updatesEventEmitter.on("antennas", () => {
//            console.log('antennas');
        });

        this.server.updatesEventEmitter.on("bands", () => {
//            console.log('bands');
        });
    }
    RED.nodes.registerType("antenna-genius-antenna-status",AntennaGeniusAntennaStatus);
}