var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var chalk = require('chalk');
var sql = require('mssql');

// configure app
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    //Enabling CORS 
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
    res.header("content-type: application/json");
    next();
});

//Make Connection 
var connection = require('./models/connections');

var port = process.env.PORT || 8080;

//Function to connect to database and execute query
var executeQuery = function (res, query, requesttype) {
    //create Request object
    var request = new sql.Request();
    //query to the database
    request.query(query, function (err, rs) {
        if (err) {
            console.log("Error while querying database :- " + err);
            res.send(err);
        }
        else {
            switch (requesttype) {
                case 'GET':
                    {
                        if (rs.recordset.length == 0)
                            res.status(200).send("No row found");
                        else
                            res.status(200).send(rs.recordset);
                    }
                case 'POST':
                    {
                        res.status(201).send(rs.rowsAffected);
                    }
                case 'DELETE':
                    {
                        res.status(200).send(rs.rowsAffected);
                    }
                case 'PUT':
                    {
                        res.status(204).send(rs.rowsAffected);
                    }
            }
        }
    });
}

var router = express.Router();
// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({ "error": message });
    next();
}

//var BudgetForeCast = require('./models/budgetforecast');
router.use(function (req, res, next) {
    var _send = res.send;
    var sent = false;
    res.send = function (data) {
        if (sent) return;
        _send.bind(res)(data);
        sent = true;
    };
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

// Create a budgetforecast row (accessed at POST http://localhost:8080/api/budgetforecast/create)
router.route('/budgetforecast/create')
    .post(function (req, res) {
        var query = " INSERT INTO [budgetforecast].[fact_budgetforecasts] (BudgetForecasts_key,station_call_letters,year,month,pricing_budget_group,budget_update_date,forecast_date,budget_amount,forecast_amount) " +
        " VALUES ((SELECT max(BudgetForecasts_key) + 1 FROM [budgetforecast].[fact_budgetforecasts]),'" + req.body.station_call_letters + "' , " +
            req.body.year + " , " +
            req.body.month + " , '" +
            req.body.pricing_budget_group + "' , '" +
            req.body.budget_update_date + "' , '" +
            req.body.forecast_date + "' , " +
            req.body.budget_amount + " , " +
            req.body.forecast_amount + ");"
        executeQuery(res, query, 'POST');
    });

//Delete BudgetForecast row by id (accessed at DELETE http://localhost:8080/api/budgetforecast/delete/:budgetforecastid)

router.route('/budgetforecast/delete/:budgetforecastid')
    .delete(function (req, res) {
        var query = "DELETE FROM [budgetforecast].[fact_budgetforecasts] WHERE BudgetForecasts_key=" + req.params.budgetforecastid;
        executeQuery(res, query, 'DELETE');
    });

// Get All BudgetForeCast rows (accessed at GET http://localhost:8080/api/budgetforecasts)
router.route('/budgetforecasts')
    .get(function (req, res) {
        var query = "SELECT BudgetForecasts_key,station_call_letters,year,month,pricing_budget_group,convert(varchar(10),budget_update_date,101) as budget_update_date,convert(varchar(10),forecast_date,101) AS forecast_date,budget_amount,forecast_amount FROM [budgetforecast].[fact_budgetforecasts] "
        executeQuery(res, query, 'GET');
    });

// Find BudgetForecast row by id (accessed at GET http://localhost:8080/api/budgetforecast/:budgetforecastid)
router.route('/budgetforecast/:budgetforecastid')
    .get(function (req, res) {
        var query = "SELECT BudgetForecasts_key,station_call_letters,year,month,pricing_budget_group,convert(varchar(10),budget_update_date,101) as budget_update_date,convert(varchar(10),forecast_date,101) AS forecast_date,budget_amount,forecast_amount FROM [budgetforecast].[fact_budgetforecasts] WHERE BudgetForecasts_key=" + req.params.budgetforecastid;
        executeQuery(res, query, 'GET');
    });

// Update budgetforecast row  by id (accessed at PUT http://localhost:8080/api/budgetforecast/update/:budgetforecastid)
router.route('/budgetforecast/update/:budgetforecastid')
    .put(function (req, res) {
        var query = "UPDATE [budgetforecast].[fact_budgetforecasts] " +
            "SET station_call_letters= '" + req.body.station_call_letters +
            "' , year=  " + req.body.year +
            ", month = " + req.body.month +
            ", pricing_budget_group = '" + req.body.pricing_budget_group +
            "', budget_update_date = '" + req.body.budget_update_date +
            "', budget_amount = " + req.body.budget_amount +
            ", forecast_date = '" + req.body.forecast_date +
            "', forecast_amount = " + req.body.forecast_amount +
            " WHERE BudgetForecasts_key=" + req.params.budgetforecastid;
        executeQuery(res, query, 'PUT');
    });


router.get('/', function (req, res) {
    res.json({ message: 'Welcome to our api!' });
});

app.use('/api', router);

app.use(function (error, req, res, next) {
    console.log(chalk.red("Error: 404"));
    res.status(404).render('404');
    next();
});

app.use(function (error, req, res, next) {
    console.log(chalk.red('Error : 500' + error))
    res.status(500).render('500');
    next();
});

// START THE SERVER
// =============================================================================
app.listen(port);
console.log(chalk.green('catch the action at : localhost:' + port));