// Minimal promise wrapper around net.Socket, covering what this project needs.
class PromiseSocket {
    constructor(socket) {
        this.socket = socket;
    }

    setEncoding(encoding) {
        this.socket.setEncoding(encoding);
    }

    connect(port, host) {
        return new Promise((resolve, reject) => {
            const onError = (err) => {
                reject(err);
            };
            this.socket.once("error", onError);
            this.socket.connect(port, host, () => {
                this.socket.removeListener("error", onError);
                resolve();
            });
        });
    }

    write(data) {
        return new Promise((resolve, reject) => {
            this.socket.write(data, (err) => (err ? reject(err) : resolve()));
        });
    }

    // Resolves with the buffered data, or undefined if the socket ended.
    read() {
        return new Promise((resolve, reject) => {
            const socket = this.socket;
            const chunk = socket.read();
            if (chunk !== null) {
                resolve(chunk);
                return;
            }
            if (socket.destroyed || socket.readableEnded) {
                resolve(undefined);
                return;
            }

            const cleanup = () => {
                socket.removeListener("readable", onReadable);
                socket.removeListener("end", onEnd);
                socket.removeListener("close", onEnd);
                socket.removeListener("error", onError);
            };
            const onReadable = () => {
                const data = socket.read();
                if (data !== null) {
                    cleanup();
                    resolve(data);
                }
            };
            const onEnd = () => {
                cleanup();
                resolve(undefined);
            };
            const onError = (err) => {
                cleanup();
                reject(err);
            };

            socket.on("readable", onReadable);
            socket.once("end", onEnd);
            socket.once("close", onEnd);
            socket.once("error", onError);
        });
    }

    end() {
        return new Promise((resolve) => {
            if (this.socket.destroyed) {
                resolve();
                return;
            }
            this.socket.end(() => resolve());
        });
    }
}

module.exports = { PromiseSocket };
