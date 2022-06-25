const data = require('./data.json');

const dailyData = require("./exmpledata/dailyData.json");

const fs= require("fs");


const ReportAggregatorBase = require("./helpers/reportHelper");

const ReportingHelper = new ReportAggregatorBase(data);

// var res = ReportingHelper.aggregateRawTotalsByAdUnit();

// // console.log(res);


var res2= ReportingHelper.getRevenueAggregateByHourOrDate()

fs.writeFileSync("revenue.json",JSON.stringify(res2,null,2),(err)=>{})

