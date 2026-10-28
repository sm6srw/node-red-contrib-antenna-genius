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

    it("connects when the device never replies to 'sub port all' (firmware 4.19)", async () => {
        testServer.stop();
        port = await testServer.start({ silentSub: true });
        const flow = [
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
        await new Promise((resolve) => {
            helper.load(serverNode, flow, () => {
                const n1 = helper.getNode("n1");
                n1.updatesEventEmitter.on("connected", () => {
                    expect(n1.connected).toBeTruthy();
                    expect(n1.status.portA_band).toBe(1);
                    resolve();
                });
                n1.connect();
            });
        });
    });

    it("does not connect when the subscription command fails", async () => {
        testServer.stop();
        port = await testServer.start({ subError: true });
        const flow = [
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
        const connected = jest.fn();
        const warning = await new Promise((resolve) => {
            helper.load(serverNode, flow, () => {
                const n1 = helper.getNode("n1");
                n1.updatesEventEmitter.on("connected", connected);
                jest.spyOn(n1, "warn").mockImplementation(resolve);
                n1.connect();
            });
        });
        expect(warning).toContain("Command error: 0x1 - subscription failed");
        expect(connected).not.toHaveBeenCalled();
    });

    it("does not connect if the socket closes during the subscription wait", async () => {
        testServer.stop();
        port = await testServer.start({ closeOnSub: true });
        const flow = [
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
        await new Promise((resolve) => {
            helper.load(serverNode, flow, () => {
                const n1 = helper.getNode("n1");
                const connected = jest.fn();
                n1.updatesEventEmitter.on("connected", connected);
                n1.client.once("close", () => {
                    setTimeout(() => {
                        expect(connected).not.toHaveBeenCalled();
                        expect(n1.connected).toBe(false);
                        resolve();
                    }, 1100);
                });
                n1.connect();
            });
        });
    });

    describe("after connecting", () => {
        const connectNode = () =>
            new Promise((resolve) => {
                    const flow = [
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
                        const n1 = helper.getNode("n1");
                        n1.updatesEventEmitter.once("connected", () => resolve(n1));
                        n1.connect();
                    });
            });

        const nextEvent = (n1, name) =>
            new Promise((resolve) => n1.updatesEventEmitter.once(name, resolve));

        it("updates port A and port B from pushed status lines", async () => {
            const n1 = await connectNode();
            let p = nextEvent(n1, "status");
            testServer.push("S0|port 1 band=5 rxant=3 txant=3 tx=1 inhibit=0");
            await p;
            expect(n1.status.portA_band).toBe(5);
            expect(n1.status.portA_antenna).toBe(3);
            expect(n1.status.portA_tx).toBe(1);

            p = nextEvent(n1, "status");
            testServer.push("S0|port 2 band=6 rxant=7 txant=7 tx=0 inhibit=1");
            await p;
            expect(n1.status.portB_band).toBe(6);
            expect(n1.status.portB_antenna).toBe(7);
            expect(n1.status.portB_inhibit).toBe(1);
        });

        it("reloads the antenna list on 'antenna reload'", async () => {
            const n1 = await connectNode();
            const p = nextEvent(n1, "antennas");
            testServer.push("S0|antenna reload");
            await p;
            expect(testServer.getReceived().filter((c) => c === "antenna list")).toHaveLength(2);
        });

        it("sends a port set command when activating an antenna", async () => {
            const n1 = await connectNode();
            n1.activate("1;4");
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(testServer.getReceived()).toContain("port set 1 rxant=4 txant=4");
        });
    });
});
