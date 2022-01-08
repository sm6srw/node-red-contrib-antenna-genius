const helper = require("node-red-node-test-helper");
const antennaStatusNode = require("../antenna-genius-antenna-status.js");
const serverNode = require("../antenna-genius-server.js");

const nodes = [antennaStatusNode, serverNode];

describe('antenna-genius-antenna-status Node', () => {
  afterEach(() => {
    helper.unload();
  });

  it('should be loaded', done => {
    var flow = [
      { id: "n1", type: "antenna-genius-server", name: "test name", hostname: "localhost", port: 9007, disabledColor: "Black", activeColor: "Green", selectedColor: "Blue", autoConnect: false},
      { id: "n2", type: "antenna-genius-antenna-status", name: "test name", server: "n1", antennaNb: 6}
  ];
    helper.load(nodes, flow, function () {
      var n2 = helper.getNode("n2");
      expect(n2).toHaveProperty('name', 'test name');
      expect(n2).toHaveProperty('antennaNumber', 6);
      done();
    });
  });
});