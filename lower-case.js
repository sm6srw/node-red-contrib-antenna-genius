module.exports = function(RED) {
    function LowerCaseNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.server = RED.nodes.getNode(config.server);

        this.server.client.on('connect', () => {
            this.status({fill:"green",shape:"dot",text:"connected"});
        });

        this.server.client.on('error', () => {
            this.status({fill:"red",shape:"ring",text:"disconnected"});        
        });
        
        node.on('input', function(msg) {
            msg.payload = msg.payload.toLowerCase();
            node.send(msg);
        });
    }
    RED.nodes.registerType("lower-case",LowerCaseNode);
}