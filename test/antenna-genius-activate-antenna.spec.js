const helper = require("node-red-node-test-helper");
const activateAntennaNode = require("../antenna-genius-activate-antenna.js");
const serverNode = require("../antenna-genius-server.js");

const nodes = [activateAntennaNode, serverNode];

describe("antenna-genius-activate-antenna Node", () => {
    const flow = [
        {
            id: "n1",
            type: "antenna-genius-server",
            name: "test name",
            hostname: "localhost",
            port: 9007,
            disabledColor: "Black",
            activeColor: "Green",
            selectedColor: "Blue",
            autoConnect: false,
        },
        {
            id: "n2",
            type: "antenna-genius-activate-antenna",
            name: "test name",
            server: "n1",
            wires: [["n3"]],
        },
        { id: "n3", type: "helper" },
    ];

    beforeEach(() => {});

    afterEach(() => {
        helper.unload();
    });

    it("should be loaded", (done) => {
        helper.load(nodes, flow, () => {
            let n2 = helper.getNode("n2");
            expect(n2).toBeDefined();
            done();
        });
    });

    it("should remove its server listeners when closed", async () => {
        await new Promise((resolve) => helper.load(nodes, flow, resolve));
        let n2 = helper.getNode("n2");
        let emitter = n2.server.updatesEventEmitter;
        expect(emitter.listenerCount("connected")).toBe(1);
        expect(emitter.listenerCount("closed")).toBe(1);

        await n2.close();

        expect(emitter.listenerCount("connected")).toBe(0);
        expect(emitter.listenerCount("closed")).toBe(0);
    });

    it("should have properties", (done) => {
        helper.load(nodes, flow, () => {
            let n2 = helper.getNode("n2");
            expect(n2).toHaveProperty("name", "test name");
            done();
        });
    });

    it("should not provide connected status", (done) => {
        helper.load(nodes, flow, () => {
            let n2 = helper.getNode("n2");
            n2.server.updatesEventEmitter.emit("connected");
            expect(n2.status.notCalled).toBeTruthy();
            done();
        });
    });

    it("should provide connected status", (done) => {
        helper.load(nodes, flow, () => {
            let n2 = helper.getNode("n2");
            n2.server.info = { name: "Name" };
            n2.server.updatesEventEmitter.emit("connected");
            expect(
                n2.status.calledOnceWithExactly({
                    fill: "green",
                    shape: "dot",
                    text: "Name",
                })
            ).toBeTruthy();
            done();
        });
    });

    it("should provide disconnected status", (done) => {
        helper.load(nodes, flow, () => {
            let n2 = helper.getNode("n2");
            n2.server.info = { name: "Name" };
            n2.server.updatesEventEmitter.emit("closed");
            expect(
                n2.status.calledOnceWithExactly({
                    fill: "red",
                    shape: "ring",
                    text: "disconnected",
                })
            ).toBeTruthy();
            done();
        });
    });

    it("should provide for invalid input", (done) => {
        helper.load(nodes, flow, () => {
            let n2 = helper.getNode("n2");
            n2.server.info = { name: "Name" };
            n2.receive({ payload: true });
            n2.on("call:status", (call) => {
                expect(
                    n2.status.calledOnceWithExactly({
                        fill: "red",
                        shape: "ring",
                        text: "topic is not set",
                    })
                ).toBeTruthy();
                done();
            });
        });
    });

    it("should re-emit status immediately when topic is not set", (done) => {
        helper.load(nodes, flow, () => {
            let n2 = helper.getNode("n2");
            let server = n2.server;
            server.info = { name: "Name" };
            server.connected = true;
            server.status = { portA_band: 0, portB_band: 1 };
            server.antennas = [{ name: "Antenna1", bands: [1, 1] }];
            let forced = [];
            server.updatesEventEmitter.on("status", (force) => forced.push(force));

            n2.receive({ payload: true });

            expect(forced).toEqual([true]);
            server.connected = false;
            done();
        });
    });

    it("should not re-emit status when not connected", (done) => {
        helper.load(nodes, flow, () => {
            let n2 = helper.getNode("n2");
            let forced = [];
            n2.server.updatesEventEmitter.on("status", (force) => forced.push(force));

            n2.receive({ payload: true });

            expect(forced).toEqual([]);
            done();
        });
    });

    it("should provide for valid input", (done) => {
        helper.load(nodes, flow, () => {
            let n2 = helper.getNode("n2");
            n2.server.info = { name: "Name" };
            n2.receive({ payload: true, topic: "1;1" });
            expect(
                n2.status.calledOnceWithExactly({
                    fill: "green",
                    shape: "dot",
                    text: "Name",
                })
            ).toBeTruthy();
            done();
        });
    });
});
