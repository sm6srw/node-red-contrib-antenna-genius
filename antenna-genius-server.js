const Net = require('net');
const {PromiseSocket} = require("promise-socket");
const EventEmitter = require('events');
const Utils = require('./Utils');

class UpdatesEventEmitter extends EventEmitter {}

module.exports = (RED) => {
    class AntennaGeniusServerNode {
        constructor(n) {
            RED.nodes.createNode(this, n);
            this.host = n.host;
            this.port = n.port;

            this.status = {};
            this.antennas = [];
            this.bands = [];
            this.interval = null;

            this.updatesEventEmitter = new UpdatesEventEmitter();

            this.client = new Net.Socket();

            this.client.on('error', (err) => {
                clearInterval(this.interval);
                console.log('TCP connection failed with AG.');
            });

            this.on('close', (done) => {
                clearInterval(this.interval);
                this.client.end();
                console.log('Shutdown AG config node.');
                done();
            });

            this.client.connect(this.port, this.host, async () => {
                console.log('TCP connection established with the server.');

                const promiseClient = new PromiseSocket(this.client);

                let command = Utils.encode(0, 0, 401, 0, "");
                await promiseClient.write(command);
                let packet = await promiseClient.read();
                this.status = Utils.decode(packet);

                var numAntennas = 8 * this.status.stackReach;
                for (let index = 1; index <= numAntennas; ++index) {
                    let command = Utils.encode(0, 0, 412, 0, index.toString());
                    await promiseClient.write(command);
                    let packet = await promiseClient.read();
                    let data = Utils.decode(packet);
                    this.antennas.push(data);
                }
                this.updatesEventEmitter.emit("antennas");

                for (let index = 0; index < 16; ++index) {
                    let command = Utils.encode(0, 0, 82, 0, index.toString());
                    await promiseClient.write(command);
                    let packet = await promiseClient.read();
                    let data = Utils.decode(packet);
                    this.bands.push(data);
                }
                this.updatesEventEmitter.emit("bands");

                this.client.on('data', (packet) => {
                    this.status = { ...this.status, ...Utils.decode(packet) };
                    this.updatesEventEmitter.emit("status");
                });

                this.interval = setInterval(() => {
                    let command = Utils.encode(0, 0, 401, 0, "");
                    this.client.write(command);
                }, 400);
            });
        }
    }

    RED.nodes.registerType("antenna-genius-server",AntennaGeniusServerNode);
}