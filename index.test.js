var expect = require('chai').expect;
var Registrant = require('./lib/registrant');
var tools = require('./lib/tools');
var ProtoBuf = require("protobufjs");
var sinon = require('sinon');
var ByteBuffer = require('bytebuffer');
require('chai').use(require('sinon-chai'));


var slice1 = '0x1234000000000000000000000000000000000000000000000000000000004321';
var slice2 = '0x5678000000000000000000000000000000000000000000000000000000004321';
var total = '0x12340000000000000000000000000000000000000000000000000000000043215678000000000000000000000000000000000000000000000000000000004321';

var proto = "message Thing {    \
  repeated Identity identities = 1; \
  optional Data data = 2;           \
}                                   \
                                    \
message Identity {                  \
  required bytes pubKey = 1;        \
  optional string schema = 2;       \
}                                   \
message Data {                      \
  optional string MymeType = 1;     \
  optional string brandName = 2;    \
}";
var builder = ProtoBuf.loadJson(ProtoBuf.DotProto.Parser.parse(proto));
var Thing = builder.build("Thing");

describe('protobuf test', function() {

  it('should allow to serialize and deserialize Things.', function(done) {

    var ids = new Thing({ 
      identities: [ { 
        pubKey: ByteBuffer.fromHex('aabb'),
        schema: 'urn:test'
      } ],
      data: null
    });
    expect(ids.encodeHex()).to.eql('0a0e0a02aabb120875726e3a74657374');
    done();
  });

  it('should allow to split protobuf into 32byte parts.', function(done) {
    var registrant = new Registrant();
    var slices = tools.slice(total);
    expect(slices[0]).to.eql(slice1);
    expect(slices[1]).to.eql(slice2);
    done();
  });

  it('should allow to concatenate parts back together', function(done) {
    var registrant = new Registrant();
    var merged = tools.merge([slice1, slice2]);
    expect(merged).to.eql(total);
    done();
  });
});

var entry = { identities: [ { pubKey: ByteBuffer.fromHex('aabb'), schema: 'urn:test' } ], data: null };

var multiRefEntry = { identities: [ 
  { pubKey: ByteBuffer.fromHex('1233333333333333333333333333333333333333333333333333333333333321'), schema: 'urn:test' },
  { pubKey: ByteBuffer.fromHex('1234444444444444444444444444444444444444444444444444444444444321'), schema: 'urn:test' } ], data: null };

describe('registrant sdk', function() {

  it('should allow to read Thing and parse into object.', function(done) {

    var contract = { getThing: { call: function() {} } };
    sinon.stub(contract.getThing, 'call').yields(null, [
      proto,
      ['0x0a0e0a02aabb120875726e3a7465737400000000000000000000000000000000'],
      true
    ]);

    var registrant = new Registrant({ getRegistry: function() {return contract;}, getWeb3: function() {}, getAddress: function() {}});

    registrant.getThing('0xaabb').then(function(rv) {
      expect(rv.identities[0].pubKey.toString('hex')).to.eql('aabb');
      done();
    }).catch(done);
  });

  it('should allow to create Thing that is correctly serialized.', function(done) {

    var contract = { create: function() {} , schemas: { call: function() {} }};
    sinon.stub(contract, 'create').yields(null, '0x4321');
    sinon.stub(contract.schemas, 'call').yields(null, proto);

    var registrant = new Registrant({ getRegistry: function() {return contract;}, getWeb3: function() {}, getAddress: function() {}});

    registrant.createThing(entry).then(function(rv) {
      expect(contract.create).calledWith(sinon.match.any, ['0x0a0e0a02aabb120875726e3a74657374'], sinon.match.any, sinon.match.any);
      expect(rv).to.eql('0x4321');
      done();
    }).catch(done);
  });

  it('should allow to create Thing with reference for each id.', function(done) {

    var contract = { create: function() {} , schemas: { call: function() {} }};
    sinon.stub(contract, 'create').yields(null, '0x4321');
    sinon.stub(contract.schemas, 'call').yields(null, proto);

    var registrant = new Registrant({ getRegistry: function() {return contract;}, getWeb3: function() {}, getAddress: function() {}});

    registrant.createThing(multiRefEntry).then(function(rv) {
      expect(contract.create).calledWith(sinon.match.any, ["0x0a2c0a2012333333333333333333333333333333333333333333333333333333", "0x33333321120875726e3a746573740a2c0a201234444444444444444444444444", "0x444444444444444444444444444444444321120875726e3a74657374"], ["0x1233333333333333333333333333333333333333333333333333333333333321", "0x1234444444444444444444444444444444444444444444444444444444444321"], sinon.match.any);
      expect(rv).to.eql('0x4321');
      done();
    }).catch(done);
  });

  it('should allow to batch-create Things.', function(done) {
    var entries = [{
      identities: entry,
      reference: '0x1234'
    },{
      identities: entry,
      reference: '0x3456'
    }]

    var contract = { createMany: function() {} , schemas: { call: function() {} }};
    sinon.stub(contract, 'createMany').yields(null, [0, 1]);
    sinon.stub(contract.schemas, 'call').yields(null, proto);

    var registrant = new Registrant({ getRegistry: function() {return contract;}, getWeb3: function() {}, getAddress: function() {}});

    registrant.createMany(entries).then(function(rv) {
      expect(contract.createMany).calledWith(sinon.match.any, [1, 1],["0x0a0e0a02aabb120875726e3a74657374", "0x0a0e0a02aabb120875726e3a74657374"], ['0x1234', '0x3456'], sinon.match.any, sinon.match.any);
      expect(rv).to.eql([0, 1]);
      done();
    }).catch(done);
  });

});