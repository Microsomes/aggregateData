const data = require('./data.json');

const dailyData = require("./exmpledata/dailyData.json");

const fs= require("fs");


const ReportAggregatorBase = require("./helpers/reportHelper");

const ReportingHelper = new ReportAggregatorBase(data);

// var res = ReportingHelper.aggregateRawTotalsByAdUnit();

// // console.log(res);


var res2= ReportingHelper.getAdsAggregateHourDate()
var res3 = ReportingHelper.aggregate()

fs.writeFileSync("ads2.json",JSON.stringify(res3,null,2),(err)=>{})

