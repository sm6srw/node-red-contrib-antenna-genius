module.exports = function(RED) {
    function AntennaGeniusServerNode(n) {
        RED.nodes.createNode(this,n);
        this.host = n.host;
        this.port = n.port;
    }
    RED.nodes.registerType("antenna-genius-server",AntennaGeniusServerNode);
}