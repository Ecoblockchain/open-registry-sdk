var Promise = require('es6-promise').Promise;
var ProtoBuf = require("protobufjs");

var builder = ProtoBuf.loadJson(require('../schemas/registrant.proto.json'));
var Registrant = builder.build("Registrant").Registrant;
builder = ProtoBuf.loadJson(require('../schemas/schema.proto.json'));
var Schema = builder.build("Schema").Schema;

function Certifier (provider) {
  if (provider) {
    this.registrar = provider.getRegistrar();
    this.registrarAddress = provider.registrarAddress;
    this.address = provider.getAddress();
    this.web3 = provider.getWeb3();
  }
}

Certifier.prototype.addRegistrant = function (registrant, data) {
  var self = this;
  var regData = new Registrant({
    "name":data.name,
    "description":data.description,
    "contact":data.contact,
    "website":data.website,
    "legalName":data.legalName,
    "legalAddress":data.address
  });
  return new Promise(function (fulfill, reject) {
    self.registrar.add(registrant, regData.encodeHex(), {from: self.address, gas: 2000000}, function(err, tx) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      fulfill(tx);
    });
  });
}

Certifier.prototype.editRegistrant = function (registrant, data, isActive) {
  var self = this;
  var regData = new Registrant({
    "name":data.name,
    "description":data.description,
    "contact":data.contact,
    "website":data.website,
    "legalName":data.legalName,
    "legalAddress":data.address
  });
  return new Promise(function (fulfill, reject) {
    self.registrar.edit(registrant, regData.encodeHex(), isActive, {from: self.address, gas: 2000000}, function(err, tx) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      fulfill(tx);
    });
  });
}

Certifier.prototype.setRegistrar = function (registrarAddress) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registry.configure(registrarAddress, {from: self.address, gas: 2000000}, function(err, tx) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      fulfill(tx);
    });
  });
}

Certifier.prototype.createSchema = function (schema) {
  var self = this;
  var schemaData = new Schema({
    "name":schema.name,
    "description":schema.description,
    "definition":schema.definition
  });
  return new Promise(function (fulfill, reject) {
      self.registry.createSchema(schemaData.encodeHex(), {from: self.address, gas: 2000000}, function(err, tx) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        fulfill(tx);
      });
  });
}

module.exports = Certifier;
