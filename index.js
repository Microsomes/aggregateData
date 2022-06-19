const data = require('./data.json');

const ReportHelper = require("./helpers/reportHelper");

const ReportingHelper = new ReportHelper(data);

ReportingHelper.aggregateRawByAdUnit();
