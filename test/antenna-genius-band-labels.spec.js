const helper = require("node-red-node-test-helper");
const bandLabelsNode = require("../antenna-genius-band-labels.js");
const serverNode = require("../antenna-genius-server.js");

const nodes = [bandLabelsNode, serverNode];

describe('antenna-genius-band-labels Node', () => {
  afterEach(() => {
    helper.unload();
  });

  it('should be loaded', done => {
    var flow = [
      { id: "n1", type: "antenna-genius-server", name: "test name", hostname: "localhost", port: 9007, disabledColor: "Black", activeColor: "Green", selectedColor: "Blue", autoConnect: false},
      { id: "n2", type: "antenna-genius-band-labels", name: "test name", server: "n1"}
  ];
    helper.load(nodes, flow, function () {
      var n2 = helper.getNode("n2");
      expect(n2).toHaveProperty('name', 'test name');
      done();
    });
  });
});