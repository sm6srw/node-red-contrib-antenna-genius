const { GeniusV4Protocol } = require("../GeniusV4Protocol.js");

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
