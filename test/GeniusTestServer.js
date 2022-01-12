const net = require("net");
const { PromiseSocket } = require("promise-socket");
const { encode, decodeheader } = require("../GeniusUtils.js");

var server;

const bands = [
    "0;None;0;0",
    "1;160m;1600000;2200000",
    "2;80m;3300000;4000000",
    "3;40m;6800000;7400000",
    "4;30m;9900000;10350000",
    "5;20m;13800000;14550000",
    "6;17m;17868000;18368000",
    "7;15m;20800000;21650000",
    "8;12m;24690000;25190000",
    "9;10m;27800000;29900000",
    "0;6m;49800000;54200000",
    "11;60m;5000000;6000000",
    "12;2m;144000000;148000000",
    "13;70cm;432000000;436000000",
    "14;Custom 3;0;0",
    "15;Custom 4;0;0",
];

const antennas = [
    "1;Antenna1;3;FFFF",
    "2;Antenna2;3;FFFF",
    "3;Antenna3;3;FFFF",
    "4;Antenna4;3;FFFF",
    "5;Antenna5;3;FFFF",
    "6;Antenna6;3;FFFF",
    "7;Antenna7;3;FFFF",
    "8;Antenna8;3;FFFF",
];

const start = () => {
    server = net.createServer();
    server.on("connection", (conn) => {
        let connection = new PromiseSocket(conn);

        connection.setEncoding("utf8");

        conn.on("data", async (data) => {
            let command = decodeheader(data);
            const params = command.payload.split(";");

            switch (command.command) {
                case 24:
                    command.payload = "1;2;TestGenius";
                    break;
                case 82:
                    {
                        let index = parseInt(params[0]);
                        command.payload = bands[index];
                    }
                    break;
                case 401:
                    command.payload = "3;1;0;2;0;0;3;2;0;4;0;0;1";
                    break;
                case 412:
                    {
                        let index = parseInt(params[0]);
                        command.payload = antennas[index - 1];
                    }
                    break;
            }
            let ret = encode(
                command.protocol,
                command.method,
                command.command,
                command.revision,
                command.payload
            );
            await connection.write(ret);
        });
    });
    return new Promise((resolve) => {
        server.listen(0, "localhost", () => {
            return resolve(server.address().port);
        });
    });
};

const stop = () => {
    server.unref();
};

exports.start = start;
exports.stop = stop;
