const helper = require("node-red-node-test-helper");
const antennaStatusNode = require("../antenna-genius-antenna-status.js");
const serverNode = require("../antenna-genius-server.js");

const nodes = [antennaStatusNode, serverNode];

describe('antenna-genius-antenna-status Node', () => {
  const flow = [
    { id: "n1", type: "antenna-genius-server", name: "test name", hostname: "localhost", port: 9007, disabledColor: "Black", activeColor: "Green", selectedColor: "Blue", autoConnect: false},
    { id: "n2", type: "antenna-genius-antenna-status", name: "test name", server: "n1", antennaNb: 2, wires:[["n3"],["n4"]]},
    { id: "n3", type: "helper" },
    { id: "n4", type: "helper" }
  ];

  afterEach(() => {
    helper.unload();
  });

  it('should be loaded', done => {
    helper.load(nodes, flow, function () {
      var n2 = helper.getNode("n2");
      expect(n2).toBeDefined();
      done();
    });
  });

  it('should have properties', done => {
    helper.load(nodes, flow, function () {
      var n2 = helper.getNode("n2");
      expect(n2).toHaveProperty('name', 'test name');
      expect(n2).toHaveProperty('antennaNumber', 2);
      done();
    });
  });

  it('should not provide connected status', done => {
    helper.load(nodes, flow, function () {
      var n2 = helper.getNode("n2");
      n2.server.updatesEventEmitter.emit("connected");
      expect(n2.status.notCalled).toBeTruthy();
      done();
    });
  });

  it('should provide connected status', done => {
    helper.load(nodes, flow, function () {
      var n2 = helper.getNode("n2");
      n2.server.info = {name: "Name"};
      n2.server.updatesEventEmitter.emit("connected");
      expect(n2.status.calledOnceWithExactly({ fill: "green", shape: "dot", text: "Name"})).toBeTruthy();
      done();
    });
  });

  it('should provide disconnected status', done => {
    helper.load(nodes, flow, function () {
      var n2 = helper.getNode("n2");
      n2.server.info = {name: "Name"};
      n2.server.updatesEventEmitter.emit("closed");
      expect(n2.status.calledOnceWithExactly({ fill: "red", shape: "ring", text: "disconnected"})).toBeTruthy();
      done();
    });
  });

  it('should provide A port output with valid input', done => {
    helper.load(nodes, flow, function () {
      var n2 = helper.getNode("n2");
      n2.server.info = {name: "Name"};
      n2.server.status = {portA_antenna: 1, portA_band:0, portB_antenna: 2, portB_band: 1};
      n2.server.antennas = [{antenna_name: "Antenna0", antenna_bands: [1,1]},{antenna_name: "Antenna1", antenna_bands: [1,1]}];
      n2.server.updatesEventEmitter.emit("status");
      expect(n2.send.calledOnce).toBeTruthy();
      expect(n2.status.calledOnceWithExactly({ fill: "green", shape: "dot", text: "Name - Antenna1"})).toBeTruthy();

      var n3 = helper.getNode("n3");
      n3.on("input", function(msg) {
        try {
          console.log(msg);
          expect(msg).toHaveProperty("payload", {
            selected: false,
            enabled: true,
            name: 'Antenna1',
            background: 'Green'
          });
          expect(msg).toHaveProperty("enabled", true);
          expect(msg).toHaveProperty("topic", "1;2");
          done();
        } catch(err) {
          done(err);
        }
      });
    });
  });

  it('should provide B port output with valid input', done => {
    helper.load(nodes, flow, function () {
      var n2 = helper.getNode("n2");
      n2.server.info = {name: "Name"};
      n2.server.status = {portA_antenna: 1, portA_band:0, portB_antenna: 2, portB_band: 1};
      n2.server.antennas = [{antenna_name: "Antenna0", antenna_bands: [1,1]},{antenna_name: "Antenna1", antenna_bands: [1,1]}];
      n2.server.updatesEventEmitter.emit("status");
      expect(n2.send.calledOnce).toBeTruthy();
      expect(n2.status.calledOnceWithExactly({ fill: "green", shape: "dot", text: "Name - Antenna1"})).toBeTruthy();

      var n4 = helper.getNode("n4");
      n4.on("input", function(msg) {
        try {
          console.log(msg);
          expect(msg).toHaveProperty("payload", {
            selected: true,
            enabled: true,
            name: 'Antenna1',
            background: 'Blue'
          });
          expect(msg).toHaveProperty("enabled", true);
          expect(msg).toHaveProperty("topic", "2;2");
          done();
        } catch(err) {
          done(err);
        }
      });
    });
  });
});