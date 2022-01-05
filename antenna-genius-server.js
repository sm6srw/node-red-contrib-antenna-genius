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

            this.data = {};
            this.interval = null;

            this.updatesEventEmitter = new UpdatesEventEmitter();

            this.client = new Net.Socket();

            this.client.on('error', (err) => {
                clearInterval(this.interval);
                console.log('TCP connection failed with the server.');
            });

            this.on('close', (done) => {
                clearInterval(this.interval);
                this.client.end();
                console.log('Shutdown config node.');
                done();
            });

            this.client.connect(this.port, this.host, async () => {
                console.log('TCP connection established with the server.');

                const promiseClient = new PromiseSocket(this.client);

                let command = Utils.encode(0, 0, 401, 0, "");
                await promiseClient.write(command);
                let packet = await promiseClient.read();
                this.data = Utils.decode(packet);

                var numAntennas = 8 * this.data.stackReach;
                this.data.antennas = [];
                for (let index = 1; index <= numAntennas; ++index) {
                    let command = Utils.encode(0, 0, 412, 0, index.toString());
                    await promiseClient.write(command);
                    let packet = await promiseClient.read();
                    let data = Utils.decode(packet);
                    this.data.antennas.push(data);
                }

                this.data.bands = [];
                for (let index = 0; index < 16; ++index) {
                    let command = Utils.encode(0, 0, 82, 0, index.toString());
                    await promiseClient.write(command);
                    let packet = await promiseClient.read();
                    let data = Utils.decode(packet);
                    this.data.bands.push(data);
                }

                this.client.on('data', (packet) => {
                    console.log('Poll!');
                    this.data = { ...this.data, ...Utils.decode(packet) };
                    this.updatesEventEmitter.emit();
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