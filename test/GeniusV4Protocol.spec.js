const {
    GeniusV4Protocol,
    parseInfo,
    parsePort,
    parseAntennaList,
    parseBandList,
} = require("../GeniusV4Protocol.js");

describe("GeniusV4Protocol line handling", () => {
    let socket;
    let protocol;

    beforeEach(() => {
        socket = { write: jest.fn() };
        protocol = new GeniusV4Protocol(socket);
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    it("rejects with an error on a non-zero result code", async () => {
        const promise = protocol.sendCommand("bogus");
        protocol.handleData(Buffer.from("R1|1F|bad command\r\n"));
        await expect(promise).rejects.toThrow("Command error: 0x1F - bad command");
        expect(protocol.pending.size).toBe(0);
    });

    it("collects multi-line replies until the empty terminator", async () => {
        const promise = protocol.sendCommandMulti("antenna list");
        protocol.handleData(Buffer.from("R1|0|antenna 1\r\nR1|0|antenna 2\r\nR1|0|\r\n"));
        await expect(promise).resolves.toEqual(["antenna 1", "antenna 2"]);
    });

    it("rejects a multi-line command on error", async () => {
        const promise = protocol.sendCommandMulti("antenna list");
        protocol.handleData(Buffer.from("R1|2|nope\r\n"));
        await expect(promise).rejects.toThrow("Command error: 0x2 - nope");
    });

    it("reassembles lines split across chunks", async () => {
        const promise = protocol.sendCommand("info get");
        protocol.handleData(Buffer.from("R1|0|hel"));
        protocol.handleData(Buffer.from("lo\r\n"));
        await expect(promise).resolves.toBe("hello");
    });

    it("ignores empty lines, unknown sequence numbers and unknown prefixes", () => {
        const handler = jest.fn();
        protocol.onStatus(handler);
        protocol.handleData(Buffer.from("\r\nR99|0|x\r\nV4.0.22 AG\r\n"));
        expect(handler).not.toHaveBeenCalled();
    });

    it("handles status lines without a pipe or without a handler", () => {
        expect(() => protocol.handleData(Buffer.from("S0|port 1\r\n"))).not.toThrow();
        const handler = jest.fn();
        protocol.onStatus(handler);
        protocol.handleData(Buffer.from("S0\r\n"));
        expect(handler).toHaveBeenCalledWith("");
    });

    it("handles a reply with only a result code", async () => {
        const promise = protocol.sendCommand("x");
        protocol.handleData(Buffer.from("R1|0\r\n"));
        await expect(promise).resolves.toBe("");
    });

    it("wraps sequence numbers from 255 back to 1", () => {
        protocol.seq = 255;
        expect(protocol.nextSeq()).toBe(1);
    });
});

describe("GeniusV4Protocol parsers", () => {
    it("parseInfo parses fields and applies defaults", () => {
        expect(parseInfo("info v=4.0.22 serial=9A name=Test_AG ports=2 antennas=16")).toEqual({
            name: "Test AG",
            ports: 2,
            antennas: 16,
            firmware: "4.0.22",
            serial: "9A",
        });
        expect(parseInfo("info")).toEqual({ name: "", ports: 2, antennas: 8, firmware: "", serial: "" });
    });

    it("parsePort parses fields and applies defaults", () => {
        expect(parsePort("port 2 band=5 rxant=3 txant=4 tx=1 inhibit=1")).toEqual({
            portNum: 2, band: 5, rxant: 3, txant: 4, tx: 1, inhibit: 1,
        });
        expect(parsePort("port 1")).toEqual({ portNum: 1, band: 0, rxant: 0, txant: 0, tx: 0, inhibit: 0 });
    });

    it("parseAntennaList decodes the rx band mask", () => {
        const [a] = parseAntennaList(["antenna 3 name=Sky_Loop tx=0000 rx=0005 inband=0000"]);
        expect(a.index).toBe(3);
        expect(a.name).toBe("Sky Loop");
        expect(a.bands.slice(0, 4)).toEqual([1, 0, 1, 0]);
        expect(a.bands).toHaveLength(16);
        expect(parseAntennaList(["antenna 1"])[0].bands.every((b) => b === 0)).toBe(true);
    });

    it("parseBandList parses index and name", () => {
        expect(parseBandList(["band 5 name=20m freq_start=1 freq_stop=2", "band 6"])).toEqual([
            { index: 5, name: "20m" },
            { index: 6, name: "" },
        ]);
    });
});

describe("GeniusV4Protocol sendCommand", () => {
    let socket;
    let protocol;

    beforeEach(() => {
        socket = { write: jest.fn() };
        protocol = new GeniusV4Protocol(socket);
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it("rejects and clears the pending entry when no reply arrives in time", async () => {
        jest.useFakeTimers({ legacyFakeTimers: true });
        const promise = protocol.sendCommand("sub port all", 1000);
        expect(protocol.pending.size).toBe(1);
        jest.advanceTimersByTime(1000);
        await expect(promise).rejects.toMatchObject({ code: "ETIMEDOUT" });
        await expect(promise).rejects.toThrow(/Timeout waiting for reply to 'sub port all'/);
        expect(protocol.pending.size).toBe(0);
    });

    it("resolves before the timeout when a reply arrives", async () => {
        jest.useFakeTimers({ legacyFakeTimers: true });
        const promise = protocol.sendCommand("info get", 1000);
        protocol.handleData(Buffer.from("R1|0|ok\r\n"));
        await expect(promise).resolves.toBe("ok");
        jest.advanceTimersByTime(1000);
        expect(protocol.pending.size).toBe(0);
    });

    it("passes status lines to the status handler even with a command pending", () => {
        const handler = jest.fn();
        protocol.onStatus(handler);
        protocol.sendCommand("sub port all", 1000).catch(() => {});
        protocol.handleData(Buffer.from("S0|port 1 band=5\r\n"));
        expect(handler).toHaveBeenCalledWith("port 1 band=5");
    });
});
