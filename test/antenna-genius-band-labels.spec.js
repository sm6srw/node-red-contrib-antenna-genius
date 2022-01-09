const helper = require("node-red-node-test-helper");
const bandLabelsNode = require("../antenna-genius-band-labels.js");
const serverNode = require("../antenna-genius-server.js");

const nodes = [bandLabelsNode, serverNode];

describe('antenna-genius-band-labels Node', () => {

  const flow = [
    { id: "n1", type: "antenna-genius-server", name: "test name", hostname: "localhost", port: 9007, disabledColor: "Black", activeColor: "Green", selectedColor: "Blue", autoConnect: false},
    { id: "n2", type: "antenna-genius-band-labels", name: "test name", server: "n1", wires:[["n3"]]},
    { id: "n3", type: "helper" }
  ];

  beforeEach(() => {
  });

  afterEach(() => {
    helper.unload();
  });

  it('should be loaded', done => {
    helper.load(nodes, flow, () => {
        let n2 = helper.getNode("n2");
        expect(n2).toBeDefined();
        done();
      });
  });

  it('should have properties', done => {
    helper.load(nodes, flow, () => {
        let n2 = helper.getNode("n2");
        expect(n2).toHaveProperty('name', 'test name');
        done();
      });
  });


  it('should provide no output with no input', done => {
    helper.load(nodes, flow, () => {
        let n2 = helper.getNode("n2");
        n2.server.updatesEventEmitter.emit("status", false);
        expect(n2.send.notCalled).toBeTruthy();
        done();
      });
  });

  it('should provide no output with no band definitions', done => {
    helper.load(nodes, flow, () => {
        let n2 = helper.getNode("n2");
        n2.server.status = { portA_band: 0, portB_band: 1 };
        n2.server.updatesEventEmitter.emit("status", false);
        expect(n2.send.notCalled).toBeTruthy();
        done();
      });
  });

  it('should provide output', done => {
    helper.load(nodes, flow, () => {
        let n2 = helper.getNode("n2");
        n2.server.status = { portA_band: 0, portB_band: 1 };
        n2.server.bands = [{ band_name: "bandA" }, { band_name: "bandB" }];
        n2.server.info = { name: "Name" };

        let n3 = helper.getNode("n3");
        n3.on("input", (msg) => {
            try {
              expect(msg).toHaveProperty("payload", { bandLabelA: "bandA", bandLabelB: "bandB" });
              expect(n2.send.calledOnce).toBeTruthy();
              expect(n2.status.calledOnceWithExactly({ fill: "green", shape: "dot", text: "Name - bandA/bandB" })).toBeTruthy();
              done();
            } catch (err) {
              done(err);
            }
          });

        n2.server.updatesEventEmitter.emit("status", false);
      });
  });

  it('should not provide connected status', done => {
    helper.load(nodes, flow, () => {
        let n2 = helper.getNode("n2");
        n2.server.updatesEventEmitter.emit("connected");
        expect(n2.status.notCalled).toBeTruthy();
        done();
      });
  });

  it('should provide connected status', done => {
    helper.load(nodes, flow, () => {
        let n2 = helper.getNode("n2");
        n2.server.info = { name: "Name" };
        n2.server.updatesEventEmitter.emit("connected");
        expect(n2.status.calledOnceWithExactly({ fill: "green", shape: "dot", text: "Name" })).toBeTruthy();
        done();
      });
  });

  it('should provide disconnected status', done => {
    helper.load(nodes, flow, () => {
        let n2 = helper.getNode("n2");
        n2.server.info = { name: "Name" };
        n2.server.updatesEventEmitter.emit("closed");
        expect(n2.status.calledOnceWithExactly({ fill: "red", shape: "ring", text: "disconnected" })).toBeTruthy();
        done();
      });
  });
});