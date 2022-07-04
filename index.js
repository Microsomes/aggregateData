const data = require('./data.json');

const dailyData = require("./exmpledata/dailyData.json");

const fs= require("fs");


const ReportAggregatorBase = require("./helpers/reportHelper");

const ReportingHelper = new ReportAggregatorBase(dailyData);

// var res = ReportingHelper.aggregateRawTotalsByAdUnit();

// // console.log(res);


var res2= ReportingHelper.aggregateRawTotalsByAdUnit()
var res3 = ReportingHelper.aggregate()

fs.writeFileSync("ads2.json",JSON.stringify(res2,null,2),(err)=>{})

