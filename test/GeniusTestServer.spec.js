const Net = require("net");
const { PromiseSocket } = require("promise-socket");
const testServer = require("./GeniusTestServer.js");
const { encode, decode } = require("../GeniusUtils.js");

describe("Antenna Genius Test Server", () => {
    var port;
    var client;

    beforeEach(async () => {
        port = await testServer.start();
        client = new PromiseSocket(new Net.Socket());
        await client.connect(port, "localhost");
    });

    afterEach(async () => {
        await client.end();
        testServer.stop();
    });

    it("should load", async () => {});

    it("should respond to command 24 correctly", async () => {
        let command = encode(0, 0, 24, 0, "");
        await client.write(command);
        let response = await client.read();
        let data = decode(response);
        expect(data).toBeDefined();
        expect(data).toStrictEqual({
            command: 24,
            error: 0,
            length: "0015",
            method: 0,
            payload: "1;2;TestGenius",
            protocol: 0,
            revision: 0,
            identification: 1,
            group: 2,
            name: "TestGenius",
        });
    });

    it("should respond to command 82 correctly", async () => {
        let bands = [];

        for (let i = 0; i < 16; i++) {
            let command = encode(0, 0, 82, 0, i.toString());
            await client.write(command);
            let response = await client.read();
            let data = decode(response);
            expect(data).toBeDefined();
            bands.push(data);
        }
        expect(bands).toStrictEqual([
            {
                command: 82,
                cutoff_lower: 0,
                cutoff_upper: 0,
                error: 0,
                index: 0,
                length: "0011",
                method: 0,
                name: "None",
                payload: "0;None;0;0",
                protocol: 0,
                revision: 0,
            },
            {
                command: 82,
                cutoff_lower: 1600000,
                cutoff_upper: 2200000,
                error: 0,
                index: 1,
                length: "001d",
                method: 0,
                name: "160m",
                payload: "1;160m;1600000;2200000",
                protocol: 0,
                revision: 0,
            },
            {
                command: 82,
                cutoff_lower: 3300000,
                cutoff_upper: 4000000,
                error: 0,
                index: 2,
                length: "001c",
                method: 0,
                name: "80m",
                payload: "2;80m;3300000;4000000",
                protocol: 0,
                revision: 0,
            },
            {
                command: 82,
                cutoff_lower: 6800000,
                cutoff_upper: 7400000,
                error: 0,
                index: 3,
                length: "001c",
                method: 0,
                name: "40m",
                payload: "3;40m;6800000;7400000",
                protocol: 0,
                revision: 0,
            },
            {
                command: 82,
                cutoff_lower: 9900000,
                cutoff_upper: 10350000,
                error: 0,
                index: 4,
                length: "001d",
                method: 0,
                name: "30m",
                payload: "4;30m;9900000;10350000",
                protocol: 0,
                revision: 0,
            },
            {
                command: 82,
                cutoff_lower: 13800000,
                cutoff_upper: 14550000,
                error: 0,
                index: 5,
                length: "001e",
                method: 0,
                name: "20m",
                payload: "5;20m;13800000;14550000",
                protocol: 0,
                revision: 0,
            },
            {
                command: 82,
                cutoff_lower: 17868000,
                cutoff_upper: 18368000,
                error: 0,
                index: 6,
                length: "001e",
                method: 0,
                name: "17m",
                payload: "6;17m;17868000;18368000",
                protocol: 0,
                revision: 0,
            },
            {
                command: 82,
                cutoff_lower: 20800000,
                cutoff_upper: 21650000,
                error: 0,
                index: 7,
                length: "001e",
                method: 0,
                name: "15m",
                payload: "7;15m;20800000;21650000",
                protocol: 0,
                revision: 0,
            },
            {
                command: 82,
                cutoff_lower: 24690000,
                cutoff_upper: 25190000,
                error: 0,
                index: 8,
                length: "001e",
                method: 0,
                name: "12m",
                payload: "8;12m;24690000;25190000",
                protocol: 0,
                revision: 0,
            },
            {
                command: 82,
                cutoff_lower: 27800000,
                cutoff_upper: 29900000,
                error: 0,
                index: 9,
                length: "001e",
                method: 0,
                name: "10m",
                payload: "9;10m;27800000;29900000",
                protocol: 0,
                revision: 0,
            },
            {
                command: 82,
                cutoff_lower: 49800000,
                cutoff_upper: 54200000,
                error: 0,
                index: 0,
                length: "001d",
                method: 0,
                name: "6m",
                payload: "0;6m;49800000;54200000",
                protocol: 0,
                revision: 0,
            },
            {
                command: 82,
                cutoff_lower: 5000000,
                cutoff_upper: 6000000,
                error: 0,
                index: 11,
                length: "001d",
                method: 0,
                name: "60m",
                payload: "11;60m;5000000;6000000",
                protocol: 0,
                revision: 0,
            },
            {
                command: 82,
                cutoff_lower: 144000000,
                cutoff_upper: 148000000,
                error: 0,
                index: 12,
                length: "0020",
                method: 0,
                name: "2m",
                payload: "12;2m;144000000;148000000",
                protocol: 0,
                revision: 0,
            },
            {
                command: 82,
                cutoff_lower: 432000000,
                cutoff_upper: 436000000,
                error: 0,
                index: 13,
                length: "0022",
                method: 0,
                name: "70cm",
                payload: "13;70cm;432000000;436000000",
                protocol: 0,
                revision: 0,
            },
            {
                command: 82,
                cutoff_lower: 0,
                cutoff_upper: 0,
                error: 0,
                index: 14,
                length: "0016",
                method: 0,
                name: "Custom 3",
                payload: "14;Custom 3;0;0",
                protocol: 0,
                revision: 0,
            },
            {
                command: 82,
                cutoff_lower: 0,
                cutoff_upper: 0,
                error: 0,
                index: 15,
                length: "0016",
                method: 0,
                name: "Custom 4",
                payload: "15;Custom 4;0;0",
                protocol: 0,
                revision: 0,
            },
        ]);
    });

    it("should respond to command 412 correctly", async () => {
        let antennas = [];

        for (let i = 1; i <= 8; i++) {
            let command = encode(0, 0, 412, 0, i.toString());
            await client.write(command);
            let response = await client.read();
            let data = decode(response);
            expect(data).toBeDefined();
            antennas.push(data);
        }
        expect(antennas).toStrictEqual([
            {
                bands: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                command: 412,
                error: 0,
                index: 1,
                length: "0018",
                method: 0,
                mode: 3,
                name: "Antenna1",
                payload: "1;Antenna1;3;FFFF",
                protocol: 0,
                revision: 0,
            },
            {
                bands: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                command: 412,
                error: 0,
                index: 2,
                length: "0018",
                method: 0,
                mode: 3,
                name: "Antenna2",
                payload: "2;Antenna2;3;FFFF",
                protocol: 0,
                revision: 0,
            },
            {
                bands: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                command: 412,
                error: 0,
                index: 3,
                length: "0018",
                method: 0,
                mode: 3,
                name: "Antenna3",
                payload: "3;Antenna3;3;FFFF",
                protocol: 0,
                revision: 0,
            },
            {
                bands: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                command: 412,
                error: 0,
                index: 4,
                length: "0018",
                method: 0,
                mode: 3,
                name: "Antenna4",
                payload: "4;Antenna4;3;FFFF",
                protocol: 0,
                revision: 0,
            },
            {
                bands: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                command: 412,
                error: 0,
                index: 5,
                length: "0018",
                method: 0,
                mode: 3,
                name: "Antenna5",
                payload: "5;Antenna5;3;FFFF",
                protocol: 0,
                revision: 0,
            },
            {
                bands: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                command: 412,
                error: 0,
                index: 6,
                length: "0018",
                method: 0,
                mode: 3,
                name: "Antenna6",
                payload: "6;Antenna6;3;FFFF",
                protocol: 0,
                revision: 0,
            },
            {
                bands: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                command: 412,
                error: 0,
                index: 7,
                length: "0018",
                method: 0,
                mode: 3,
                name: "Antenna7",
                payload: "7;Antenna7;3;FFFF",
                protocol: 0,
                revision: 0,
            },
            {
                bands: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                command: 412,
                error: 0,
                index: 8,
                length: "0018",
                method: 0,
                mode: 3,
                name: "Antenna8",
                payload: "8;Antenna8;3;FFFF",
                protocol: 0,
                revision: 0,
            },
        ]);
    });

    it("should respond to command 401 correctly", async () => {
        let command = encode(0, 0, 401, 0, "");
        await client.write(command);
        let response = await client.read();
        let data = decode(response);
        expect(data).toBeDefined();
        expect(data).toStrictEqual({
            command: 401,
            error: 0,
            length: "0020",
            method: 0,
            payload: "3;1;0;2;0;0;3;2;0;4;0;0;1",
            portA_antenna: 2,
            portA_band: 1,
            portA_inhibit: 0,
            portA_mode: 3,
            portA_profile: 0,
            portA_tx: 0,
            portB_antenna: 4,
            portB_band: 2,
            portB_inhibit: 0,
            portB_mode: 3,
            portB_profile: 0,
            portB_tx: 0,
            protocol: 0,
            revision: 0,
            stackReach: 1,
        });
    });
});
