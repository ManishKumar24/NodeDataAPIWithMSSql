var sql = require('mssql');

//Initiallising connection string
var dbConfig = {
    user:  "admintool",
    password: "Analytics99",
    server: "MANISHKU1",
    database: "wo_analytics_DICTEST"
};

var connection = sql.connect(dbConfig, function (err) {
    if (err)
        throw err; 
});

module.exports = connection;