const helper = require("node-red-node-test-helper");
const activateAntennaNode = require("../antenna-genius-activate-antenna.js");
const serverNode = require("../antenna-genius-server.js");

const nodes = [activateAntennaNode, serverNode];

describe('antenna-genius-activate-antenna Node', () => {
  const flow = [
    { id: "n1", type: "antenna-genius-server", name: "test name", hostname: "localhost", port: 9007, disabledColor: "Black", activeColor: "Green", selectedColor: "Blue", autoConnect: false},
    { id: "n2", type: "antenna-genius-activate-antenna", name: "test name", server: "n1", wires:[["n3"]]},
    { id: "n3", type: "helper" }
  ];

    beforeEach(() => {
  });

  afterEach(() => {
    helper.unload();
  });

  it('should be loaded', done => {
    helper.load(nodes, flow, () => {
        var n2 = helper.getNode("n2");
        expect(n2).toBeDefined();
        done();
      });
  });

  it('should have properties', done => {
    helper.load(nodes, flow, () => {
        var n2 = helper.getNode("n2");
        expect(n2).toHaveProperty('name', 'test name');
        done();
      });
  });

  it('should not provide connected status', done => {
    helper.load(nodes, flow, () => {
        var n2 = helper.getNode("n2");
        n2.server.updatesEventEmitter.emit("connected");
        expect(n2.status.notCalled).toBeTruthy();
        done();
      });
  });

  it('should provide connected status', done => {
    helper.load(nodes, flow, () => {
        var n2 = helper.getNode("n2");
        n2.server.info = { name: "Name" };
        n2.server.updatesEventEmitter.emit("connected");
        expect(n2.status.calledOnceWithExactly({ fill: "green", shape: "dot", text: "Name" })).toBeTruthy();
        done();
      });
  });

  it('should provide disconnected status', done => {
    helper.load(nodes, flow, () => {
        var n2 = helper.getNode("n2");
        n2.server.info = { name: "Name" };
        n2.server.updatesEventEmitter.emit("closed");
        expect(n2.status.calledOnceWithExactly({ fill: "red", shape: "ring", text: "disconnected" })).toBeTruthy();
        done();
      });
  });

  it('should provide for invalid input', done => {
    helper.load(nodes, flow, () => {
        var n2 = helper.getNode("n2");
        n2.server.info = { name: "Name" };
        n2.receive({ payload: true });
        n2.on("call:status", call => {
          expect(n2.status.calledOnceWithExactly({ fill: "red", shape: "ring", text: "topic is not set" })).toBeTruthy();
          done();
        });
      });
  });

  it('should provide for valid input', done => {
    helper.load(nodes, flow, () => {
        var n2 = helper.getNode("n2");
        n2.server.info = { name: "Name" };
        n2.receive({ payload: true, topic: "1;1" });
        expect(n2.status.calledOnceWithExactly({ fill: "green", shape: "dot", text: "Name" })).toBeTruthy();
        done();
      });
  });

});