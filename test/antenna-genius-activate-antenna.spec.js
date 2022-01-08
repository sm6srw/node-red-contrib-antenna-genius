const helper = require("node-red-node-test-helper");
const activateAntennaNode = require("../antenna-genius-activate-antenna.js");
const serverNode = require("../antenna-genius-server.js");

const nodes = [activateAntennaNode, serverNode];

describe('antenna-genius-activate-antenna Node', () => {
  afterEach(() => {
    helper.unload();
  });

  it('should be loaded', done => {
    var flow = [
      { id: "n1", type: "antenna-genius-server", name: "test name", hostname: "localhost", port: 9007, disabledColor: "Black", activeColor: "Green", selectedColor: "Blue", autoConnect: false},
      { id: "n2", type: "antenna-genius-activate-antenna", name: "test name", server: "n1"}
  ];
    helper.load(nodes, flow, function () {
      var n2 = helper.getNode("n2");
      expect(n2).toHaveProperty('name', 'test name');
      done();
    });
  });
});