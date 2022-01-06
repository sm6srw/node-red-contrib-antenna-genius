const helper = require("node-red-node-test-helper");
const serverNode = require("../antenna-genius-server.js");

describe('antenna-genius-server Node', function () {
  afterEach(function () {
    helper.unload();
  });

  it('should be loaded', function (done) {
    var flow = [
      { id: "n1", type: "antenna-genius-server", name: "test name", host: "localhost", port: 9007, disabledColor: "Black", activeColor: "Green", selectedColor: "Blue", autoConnect: false},
  ];
    helper.load(serverNode, flow, function () {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'test name');
      n1.should.have.property('host', 'localhost');
      n1.should.have.property('port', 9007);
      n1.should.have.property('disabledColor', 'Black');
      n1.should.have.property('activeColor', 'Green');
      n1.should.have.property('selectedColor', 'Blue');
      n1.should.have.property('autoConnect', false);
      done();
    });
  });
});