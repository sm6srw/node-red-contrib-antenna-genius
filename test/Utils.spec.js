const { encode, decode } = require("../Utils.js");

describe("Utils", () => {
    it("should encode null input gracefully", (done) => {
        let data = encode();
        expect(data).toBeDefined();
        expect(data).toBe("!0007!000000!");
        done();
    });

    it("should encode input correctly", (done) => {
        let data = encode(7, 3, 4095, 31, "1");
        expect(data).toBeDefined();
        expect(data).toBe("!0008!fffffc!1");
        done();
    });

    it("should decode null input gracefully", (done) => {
        let data = decode();
        expect(data).toBeDefined();
        expect(data).toStrictEqual({
            command: 0,
            error: 0,
            length: "0007",
            method: 0,
            payload: "",
            protocol: 0,
            revision: 0,
        });
        done();
    });

    it("should decode 24 input correctly", (done) => {
        let command = encode(0, 0, 24, 0, "") + "1;2;Name";
        let data = decode(command);
        expect(data).toBeDefined();
        expect(data).toStrictEqual({
            command: 24,
            error: 0,
            length: "0007",
            method: 0,
            payload: "1;2;Name",
            protocol: 0,
            revision: 0,
            identification: 1,
            group: 2,
            name: "Name",
        });
        done();
    });

    it("should decode 82 input correctly", (done) => {
        let command = encode(0, 0, 82, 0, "") + "1;Name;2;3";
        let data = decode(command);
        expect(data).toBeDefined();
        expect(data).toStrictEqual({
            command: 82,
            cutoff_lower: 2,
            cutoff_upper: 3,
            error: 0,
            index: 1,
            length: "0007",
            method: 0,
            name: "Name",
            payload: "1;Name;2;3",
            protocol: 0,
            revision: 0,
        });
        done();
    });

    it("should decode 82 input correctly", (done) => {
        let command = encode(0, 0, 82, 0, "") + "1;Name;2;3";
        let data = decode(command);
        expect(data).toBeDefined();
        expect(data).toStrictEqual({
            command: 82,
            cutoff_lower: 2,
            cutoff_upper: 3,
            error: 0,
            index: 1,
            length: "0007",
            method: 0,
            name: "Name",
            payload: "1;Name;2;3",
            protocol: 0,
            revision: 0,
        });
        done();
    });

    it("should decode 401 input correctly", (done) => {
        let command =
            encode(0, 0, 401, 0, "") + "1;2;3;4;5;6;7;8;9;10;11;12;13";
        let data = decode(command);
        expect(data).toBeDefined();
        expect(data).toStrictEqual({
            command: 401,
            error: 0,
            length: "0007",
            method: 0,
            payload: "1;2;3;4;5;6;7;8;9;10;11;12;13",
            portA_antenna: 4,
            portA_band: 2,
            portA_inhibit: 3,
            portA_mode: 1,
            portA_profile: 5,
            portA_tx: 6,
            portB_antenna: 10,
            portB_band: 8,
            portB_inhibit: 9,
            portB_mode: 7,
            portB_profile: 11,
            portB_tx: 12,
            protocol: 0,
            revision: 0,
            stackReach: 13,
        });
        done();
    });

    it("should decode 412 input correctly", (done) => {
        let command = encode(0, 0, 412, 0, "") + "1;Name;3;FFFF";
        let data = decode(command);
        expect(data).toBeDefined();
        expect(data).toStrictEqual({
            bands: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            command: 412,
            error: 0,
            index: 1,
            length: "0007",
            method: 0,
            mode: 3,
            name: "Name",
            payload: "1;Name;3;FFFF",
            protocol: 0,
            revision: 0,
        });
        done();
    });
});
