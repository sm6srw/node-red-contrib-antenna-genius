module.exports = function(RED) {
    function AntennaGeniusAntennaStatus(config) {
        RED.nodes.createNode(this,config);

        var node = this;
        this.antennaNumber = config.antennaNb;
        this.server = RED.nodes.getNode(config.server);

        this.server.client.on('connect', () => {
            this.status({fill:"green",shape:"dot",text:"connected"});
        });

        this.server.client.on('error', () => {
            this.status({fill:"red",shape:"ring",text:"disconnected"});        
        });

        this.server.updatesEventEmitter.on("status", () => {
            console.log('status');
            let anb = this.antennaNumber;
        });

        this.server.updatesEventEmitter.on("antennas", () => {
//            console.log('antennas');
        });

        this.server.updatesEventEmitter.on("bands", () => {
//            console.log('bands');
        });

        node.on('input', function(msg) {
            msg.payload = msg.payload.toLowerCase();
            node.send(msg);
        });
    }
    RED.nodes.registerType("antenna-genius-antenna-status",AntennaGeniusAntennaStatus);
}