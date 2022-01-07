const Net = require('net');
const {PromiseSocket} = require("promise-socket");
const EventEmitter = require('events');
const Utils = require('./Utils');
const { connect } = require('http2');

class UpdatesEventEmitter extends EventEmitter {}

module.exports = (RED) => {
    class AntennaGeniusServerNode {
        constructor(n) {
            RED.nodes.createNode(this, n);
            this.host = n.host;
            this.port = n.port;
            this.disabledColor = n.disabledColor;
            this.activeColor = n.activeColor;
            this.selectedColor = n.selectedColor;
            this.autoConnect = n.autoConnect || false;

            this.status = {};
            this.info = {};
            this.antennas = [];
            this.bands = [];
            this.interval = null;
            this.timer = null;

            this.updatesEventEmitter = new UpdatesEventEmitter();
            this.updatesEventEmitter.setMaxListeners(0);

            this.client = new Net.Socket();
            this.connected = false;

            this.client.on('close', () => {
                this.log('TCP connection disconnected with the server.');
                clearInterval(this.interval);
                clearTimeout(this.timer);

                if(this.updatesEventEmitter.listenerCount('closed') == 0) {
                    this.log('Stop retrying. No nodes are refering this connection anymore.');
                    return;
                }

                if(this.autoConnect) {
                    this.log('TCP connection failed with the server. Will try to reconnect in 5 seconds');
                    this.timer = setTimeout(() => {
                        this.log('Reconnecting...');
                        this.connect();
                    }, 5000);
                    this.updatesEventEmitter.emit("closed");
                }
            });

            this.client.on('connect', async () => {
                this.log('TCP connection established with the server.');
                this.connected = true;
    
                const promiseClient = new PromiseSocket(this.client);

                let command = Utils.encode(0, 0, 401, 0, "");
                await promiseClient.write(command);
                let packet = await promiseClient.read();
                this.status = Utils.decode(packet);

                command = Utils.encode(0, 0, 24, 0, "");
                await promiseClient.write(command);
                packet = await promiseClient.read();
                this.info = Utils.decode(packet);

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
                    let decoded = Utils.decode(packet);
                    if(decoded.command == 401) {
                        this.status = { ...this.status, ...Utils.decode(packet) };
                        this.updatesEventEmitter.emit("status");
                    }
                });

                // Poll status
                this.interval = setInterval(() => {
                    let command = Utils.encode(0, 0, 401, 0, "");
                    this.client.write(command);
                }, 400);

                this.updatesEventEmitter.emit("connected");
            })

            this.client.on('error', (err) => {
                this.warn(err);
            });

            this.on('close', (done) => {
                clearInterval(this.interval);
                clearTimeout(this.timer);
                this.autoConnect = false;
                this.connected = false;
                this.client.end();
                this.log('Shutdown AG config node.');
                done();
            });
        }

        connect() {
            if(this.autoConnect && !this.connected & !this.client.connecting) {
                this.client.connect(this.port, this.host);
            }
            else {
                this.log('Autoconnect off');
            }
        }
    }

    RED.nodes.registerType("antenna-genius-server",AntennaGeniusServerNode);
}