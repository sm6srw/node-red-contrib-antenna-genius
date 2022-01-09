const helper = require("node-red-node-test-helper");
const serverNode = require("../antenna-genius-server.js");

describe('antenna-genius-server Node', () => {
  afterEach(() => {
    helper.unload();
  });

  it('should be loaded', done => {
    var flow = [
      { id: "n1", type: "antenna-genius-server", name: "test name", host: "localhost", port: 9007, disabledColor: "Black", activeColor: "Green", selectedColor: "Blue", autoConnect: false},
  ];
    helper.load(serverNode, flow, () => {
        var n1 = helper.getNode("n1");
        expect(n1).toBeDefined();
        done();
      });
  });

  it('should have properties', done => {
    var flow = [
      { id: "n1", type: "antenna-genius-server", name: "test name", host: "localhost", port: 9007, disabledColor: "Black", activeColor: "Green", selectedColor: "Blue", autoConnect: false},
  ];
    helper.load(serverNode, flow, () => {
        var n1 = helper.getNode("n1");
        expect(n1).toHaveProperty('name', 'test name');
        expect(n1).toHaveProperty('host', 'localhost');
        expect(n1).toHaveProperty('port', 9007);
        expect(n1).toHaveProperty('disabledColor', 'Black');
        expect(n1).toHaveProperty('activeColor', 'Green');
        expect(n1).toHaveProperty('selectedColor', 'Blue');
        expect(n1).toHaveProperty('autoConnect', false);
        done();
      });
  });
});