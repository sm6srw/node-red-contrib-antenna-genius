const helper = require("node-red-node-test-helper");
const serverNode = require("../antenna-genius-server.js");
const testServer = require("./GeniusTestServerV4.js");

describe("antenna-genius-server Node (v4)", () => {
    var port;

    beforeEach(async () => {
        port = await testServer.start();
    });

    afterEach(async () => {
        testServer.stop();
        helper.unload();
    });

    it("should be loaded", (done) => {
        let flow = [
            {
                id: "n1",
                type: "antenna-genius-server",
                name: "test name",
                host: "localhost",
                port: port,
                disabledColor: "Black",
                activeColor: "Green",
                selectedColor: "Blue",
                autoConnect: true,
            },
        ];
        helper.load(serverNode, flow, () => {
            let n1 = helper.getNode("n1");
            expect(n1).toBeDefined();
            done();
        });
    });

    it("can connect and detect v4", (done) => {
        let flow = [
            {
                id: "n1",
                type: "antenna-genius-server",
                name: "test name",
                host: "localhost",
                port: port,
                disabledColor: "Black",
                activeColor: "Green",
                selectedColor: "Blue",
                autoConnect: true,
            },
        ];
        helper.load(serverNode, flow, () => {
            let n1 = helper.getNode("n1");
            n1.updatesEventEmitter.on("connected", () => {
                expect(n1.connected).toBeTruthy();
                expect(n1.apiVersion).toBe(4);
                done();
            });
            n1.connect();
        });
    });

    it("parses info correctly", (done) => {
        let flow = [
            {
                id: "n1",
                type: "antenna-genius-server",
                name: "test name",
                host: "localhost",
                port: port,
                disabledColor: "Black",
                activeColor: "Green",
                selectedColor: "Blue",
                autoConnect: true,
            },
        ];
        helper.load(serverNode, flow, () => {
            let n1 = helper.getNode("n1");
            n1.updatesEventEmitter.on("connected", () => {
                expect(n1.info.name).toBe("TestGenius");
                expect(n1.info.ports).toBe(2);
                expect(n1.info.antennas).toBe(8);
                done();
            });
            n1.connect();
        });
    });

    it("parses port status correctly", (done) => {
        let flow = [
            {
                id: "n1",
                type: "antenna-genius-server",
                name: "test name",
                host: "localhost",
                port: port,
                disabledColor: "Black",
                activeColor: "Green",
                selectedColor: "Blue",
                autoConnect: true,
            },
        ];
        helper.load(serverNode, flow, () => {
            let n1 = helper.getNode("n1");
            n1.updatesEventEmitter.on("connected", () => {
                expect(n1.status.portA_band).toBe(1);
                expect(n1.status.portA_antenna).toBe(2);
                expect(n1.status.portB_band).toBe(2);
                expect(n1.status.portB_antenna).toBe(4);
                expect(n1.status.stackReach).toBe(1);
                done();
            });
            n1.connect();
        });
    });

    it("parses antenna list correctly", (done) => {
        let flow = [
            {
                id: "n1",
                type: "antenna-genius-server",
                name: "test name",
                host: "localhost",
                port: port,
                disabledColor: "Black",
                activeColor: "Green",
                selectedColor: "Blue",
                autoConnect: true,
            },
        ];
        helper.load(serverNode, flow, () => {
            let n1 = helper.getNode("n1");
            n1.updatesEventEmitter.on("connected", () => {
                expect(n1.antennas.length).toBe(8);
                expect(n1.antennas[0].index).toBe(1);
                expect(n1.antennas[0].name).toBe("Antenna 1");
                expect(n1.antennas[0].bands).toStrictEqual(
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
                );
                done();
            });
            n1.connect();
        });
    });

    it("parses band list correctly", (done) => {
        let flow = [
            {
                id: "n1",
                type: "antenna-genius-server",
                name: "test name",
                host: "localhost",
                port: port,
                disabledColor: "Black",
                activeColor: "Green",
                selectedColor: "Blue",
                autoConnect: true,
            },
        ];
        helper.load(serverNode, flow, () => {
            let n1 = helper.getNode("n1");
            n1.updatesEventEmitter.on("connected", () => {
                expect(n1.bands.length).toBe(16);
                expect(n1.bands[0].name).toBe("None");
                expect(n1.bands[1].name).toBe("160m");
                expect(n1.bands[5].name).toBe("20m");
                done();
            });
            n1.connect();
        });
    });
});
