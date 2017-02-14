var dataStore = require('nedb');
var dbName = './file_version.db';
nedbObj = new dataStore({filename: dbName, autoload: true});
nedbObj.find({}, function(e, docs) {
    console.log(docs.length);
});
