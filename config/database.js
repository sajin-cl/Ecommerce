var mongodb = require('mongodb').MongoClient;
var client = new mongodb('mongodb://localhost:27017');

function Dbase() {
  return client.connect().then((contruct) => {
    var database = contruct.db('EShoppyDB');
    console.info('Database :Power House created');
    return database;
  });
};

module.exports = Dbase(); 
