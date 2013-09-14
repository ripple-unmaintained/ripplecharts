var _ = require('lodash'),
    winston = require('winston'),
    async = require('async'),
    knox = require('knox'),
    moment = require('moment');

var config = require('./config');
var client = knox.createClient({
    key: config.s3.key,
    secret: config.s3.secret,
    bucket: config.s3.bucket
});

var DATE_FORMAT = "YYYY-MM-DD";
var MAX_ITERATORS = 1;


// accepts two dates in the format DATE_FORMAT and updates
// the aggregates that include all of the ledgers between those two dates
handleCommandLineArgs(process.argv);

function handleCommandLineArgs(args) {

    if (args.length === 4) {

        var arg1 = args[2];
        var arg2 = args[3];

        var day1, day2;
        try {

            day1 = moment(arg1, DATE_FORMAT);
            day2 = moment(arg2, DATE_FORMAT);

        } catch (e) {
            winston.error("Please enter two dates of the form", DATE_FORMAT,
                "to update the aggregates including all of the ledgers from that date range");
            return;
        }

        updateAggregatesForDateRange(day1, day2);

    } else if (args.length <= 2) {

        // TODO
        // get first and last days in db
        // updateAggregatesForDateRange for that range

    }
}

function updateAggregatesForDateRange(day1, day2) {

    // ensure that day1 is the earlier date
    if (day1.isAfter(day2)) {
        var tempDay = day1;
        day1 = day2;
        day2 = tempDay;
    }

    var range = day2.diff(day1, 'days') + 1;
    var day_strings = _.map(_.range(0, range), function(delta) {
        var new_day = moment(day1);
        return new_day.add('days', delta).format(DATE_FORMAT);
    });

    getDailyLedgerFiles(day_strings, processDailyLedgerFile);

}


function getDailyLedgerFiles(day_strings, callback) {

    async.eachLimit(day_strings, MAX_ITERATORS, iterator, onBatchEnd);

    function iterator(day_str, onIteratorEnd) {
        getDailyLedgerFile(day_str, callback, onIteratorEnd);
    }

    function onBatchEnd(err) {
        if (err) {
            winston.error("Error in getDailyLedgerFiles", err);
        } else {
            winston.info("Downloaded all daily ledger files");
        }
    }
}

function getDailyLedgerFile(day_str, callback, onProcessFinished) {

    winston.info("getDailyLedgerFile", day_str);

    var data_buffer = '';

    try {
        client.get('dailyLedgers/' + day_str + '.json').on("response", function(res) {

            winston.info(res);

            res.on("error", function(err) {
                winston.error("Error while running getDailyLedgerFile for day", day_str, err);
                winston.info("Trying day", day_str, "again in 1 sec");
                getDailyLedgerFile(day_str, callback, onProcessFinished);
            });

            winston.info("statusCode:", res.statusCode);
            if (res.statusCode === 500) {
                winston.error("Got internal server error in getDailyLedgerFile for day", day_str);
                winston.info("Trying day", day_str, "again in 1 sec");
                getDailyLedgerFile(day_str, callback, onProcessFinished);
            }
            if (res.statusCode === 404) {
                winston.error("Error, there is no file for day", day_str);
                return;
            }

            res.setEncoding('utf8');
            res.on("data", function(chunk) {
                data_buffer += chunk;
            });

            res.end(function(err) {
                // called when the whole file is finished downloading
                if (err) {
                    winston.error("Error while running getDailyLedgerFile for day", day_str, err);
                    winston.info("Trying day", day_str, "again in 1 sec");
                    getDailyLedgerFile(day_str, callback, onProcessFinished);
                }
                if (typeof callback !== "undefined") {
                    callback(data_buffer, onProcessFinished);
                }
            });
        });

    } catch (e) {

        winston.error("Error trying to download daily ledger file for day:", day_str, err);
        winston.info("Trying again to download daily file for", day_str);
        setTimeout(function() {
            getDailyLedgerFile(day_str, callback, onProcessFinished);
        }, 1000);

    }
}

function processDailyLedgerFile(daily_obj, onProcessFinished) {

    var ledgers = daily_obj.ledgers;
    winston.info("processDailyLedgerFile got daily_obj with this many ledgers:", ledgers.length);

    onProcessFinished();
}

// download batches of daily ledger files
// for each, process ledgers using processor.js

// in the callback from the process ledger fn -- make this
// when the ledger is processed and in the db
// see if that ledger is in a new aggregation period
// if so, aggregate the previous period just by calling aggregator.js
// also run the aggregator on the very last ledger