const fs = require("fs")
class ReportAggregatorBase {

    constructor(reportingData) {
        this.data = reportingData;
    }

    aggregatedRevenueItem() {
        return {
          grvRevenue: 0,
          googleRevenue: 0,
          grvDirectRevenue: 0,
          totalRevenue: 0,
          totalRevenueWithoutGRV: 0
        };
    }

    aggregatedAdsItem() {
        return {
          totalImps: 0,
          totalEcpm: 0,
          grvImps: 0,
          grvEcpm: 0,
          grvDirectImps: 0,
          grvDirectEcpm: 0,
          googleImps: 0,
          googleEcpm: 0
        };
    }

    aggregatedPageItem(){
        return {
            rpm:0,
            pageViews:0,
            adImpsPerPage:0,
            totalEstRev:0
        }
    }

    aggregatedFillItem(){
        return {
            totalAvailableOmps: 0,
            totalOmps: 0,
            unfilledRequests:0,
            ompImps:0,
            fill:0,
            totalOeCpm:0
        }
    }

    aggregatedViewabilityItem(){
        return {
            viewability:0,
            totalEstRevenue:0
        }
    }

    revenueObject = () => {
        return {
            prop_programmatic_impressions: 0,
            prop_programmatic_revenue: 0,
            prop_programmatic_high_value_impressions: 0,
            prop_programmatic_high_value_revenue: 0,
            prop_direct_impressions: 0,
            prop_direct_revenue:0,
            google_impressions: 0,
            google_revenue: 0,
            unfilled_requests: 0,
            total_impressions: 0,
            total_revenue:0,
        }
    }
    gaObject = () => {
        return {
            pageviews: 0,
            sessions: 0,
            users: 0
        }
    }

    getContextByUnitId = (id) => {
        var didFind = null;
        Object.keys(this.data.ad_units.by_context).forEach((context)=>{
            const toSearchFrom = this.data.ad_units.by_context[context];
            toSearchFrom.forEach((item)=>{
                if(item == id){
                    didFind = context;
                }
            })        
        })
    return didFind;
}

    getTypeByUnitId = (id) => {
        var didFind = null;
        Object.keys(this.data.ad_units.by_type).forEach((contextType)=>{
            const toSearchFrom = this.data.ad_units.by_type[contextType];
            toSearchFrom.forEach((item)=>{
                if(item == id){
                    didFind = contextType;
                }
            })
        })

    return didFind.toUpperCase();
}

getAdUnitById(id) {
    return this.data.ad_units.items.find((item)=> item.id == id);
}

getGaTotals(gaItems) {
    var total = this.gaObject();

    Object.keys(this.gaObject()).forEach((key)=>{
        
        gaItems.forEach((gaItem)=>{
            total[key] +=gaItem[key]
        })
    })

    return total;
   
}

getTotals(revItems){

    var total = this.revenueObject();

    Object.keys(this.revenueObject()).forEach((item)=>{
        revItems.forEach((item2)=>{

            if(item === "gaItems"){

            }else{
                total[item] += item2[item]
            }
        })
    })

    if(isNaN(parseInt(total.total_impressions)) ){
        total.total_impressions= (
            total.google_impressions+ 
            total.prop_direct_impressions+
            total.prop_programmatic_impressions+
            total.prop_programmatic_high_value_impressions
        )
    }

    if(isNaN(parseInt(total.total_revenue)) ){
        total.total_revenue= (
            total.google_revenue+
            total.prop_direct_revenue+
            total.prop_programmatic_revenue+
            total.prop_programmatic_high_value_revenue
        )
    }


    return total;
}

getGAContextById(contextId){
    var toReturn = null;
    Object.keys(this.data.ga_views.by_context).forEach((context)=>{
        const cur = this.data.ga_views.by_context[context];
        var found = cur.find(item => item == contextId);
        if(found){
            toReturn=context;
        }
    })
    return toReturn
}

aggregateRawTotalsByAdUnit() {
    var aggregate = this.aggregateAdUnitObject();

    Object.keys(this.data.totals.rollup.ad_unit_id).forEach((adUnitId)=>{
        const context = this.getContextByUnitId(adUnitId);
        const type = this.getTypeByUnitId(adUnitId);
        const current = this.data.totals.rollup.ad_unit_id[adUnitId];

        current.uid = adUnitId;

        //work out the total 
        aggregate['Total'].items.push(current);

        aggregate['Total'].val = this.getTotals(aggregate['Total'].items);

        //work put by context
        aggregate[context].Total.items.push(current);

        aggregate[context].Total.val = this.getTotals(aggregate[context].Total.items);

        //work put by ad iun
        aggregate[context][type].items.push(current);
        aggregate[context][type].val = this.getTotals(aggregate[context][type].items);
    });

    aggregate.Total.gaVal = this.data.ga_totals.total;

    Object.keys(this.data.ga_report).forEach((gaContextId)=>{
        const context = this.getGAContextById(gaContextId);

        Object.keys(this.data.ga_report[gaContextId]).forEach((hourOrDate)=>{
            const val = this.data.ga_report[gaContextId][hourOrDate];

            aggregate[context].Total.gaItems.push(val);
            aggregate[context].Total.gaVal = this.getGaTotals(aggregate[context].Total.gaItems);
        });

    })



    return aggregate;

}

aggregateAdUnitObject() {
    var aggregate = {};
    Object.keys(this.data.ad_units.by_context).forEach((context)=>{
        aggregate[context] = {
            Total:{
                items:[],
                gaItems:[],
                val:this.revenueObject(),
                gaVal: this.gaObject()
            }
        }
    })
    
    aggregate["Total"] = {
        items:[],
        gaItems:[],
        val:this.revenueObject(),
        gaVal: this.gaObject()

    }

    Object.keys(this.data.ad_units.by_type).forEach((contextType)=>{
        this.data.ad_units.by_type[contextType].forEach((unitId)=>{     
            var context = this.getContextByUnitId(unitId);
            const contextTypeUpped = contextType.toUpperCase();        
            if(aggregate[context][contextTypeUpped] === undefined){
                aggregate[context][contextTypeUpped] = {
                    items:[],
                    gaItems:[],
                    val: this.revenueObject(),
                    gaVal: this.gaObject()
                }
            }
        })
    })

    return aggregate;
}

aggregateRawTotalsByAdUnitHourOrDate(){
    var aggregate = {};

    Object.keys(this.data.report).forEach((reportUnitId)=>{
        const context = this.getContextByUnitId(reportUnitId);
        const type = this.getTypeByUnitId(reportUnitId);
        
        Object.keys(this.data.report[reportUnitId]).forEach((key)=>{
            if(aggregate[key] === undefined){
                aggregate[key] = this.aggregateAdUnitObject();
            }

            var currentHour = this.data.report[reportUnitId][key];

            //calculcate total_revenue and total_impressions
            const getTotalsImpRev = (vals,source)=>{
                var total_impressions = 0;
                var total_revenue = 0;

                total_impressions = (
                    vals.prop_programmatic_impressions+
                    vals.prop_programmatic_high_value_impressions+
                    vals.prop_direct_impressions+
                    vals.google_impressions
                )

                total_revenue = (
                    vals.prop_programmatic_revenue+
                    vals.prop_programmatic_high_value_revenue+
                    vals.prop_direct_revenue+
                    vals.google_revenue
                )

                source.total_impressions = total_impressions
                source.total_revenue = total_revenue
                
            }

            getTotalsImpRev(currentHour,currentHour)

            currentHour.uid = reportUnitId;
            
            
            aggregate[key].Total.items.push(currentHour);

            aggregate[key].Total.val = this.getTotals(aggregate[key].Total.items);

            aggregate[key][context].Total.items.push(currentHour);
            aggregate[key][context].Total.val = this.getTotals(aggregate[key][context].Total.items);

            aggregate[key][context][type].items.push(currentHour);
            aggregate[key][context][type].val = this.getTotals(aggregate[key][context][type].items);

        })
    })

    Object.keys(this.data.ga_report).forEach((gaContextId)=>{
        const gaContext = this.getGAContextById(gaContextId);
        const dataHD = this.data.ga_report[gaContextId];

        Object.keys((dataHD)).forEach((hour)=>{
            const curHour = dataHD[hour];

            aggregate[hour].Total.gaItems.push(curHour)
            aggregate[hour].Total.gaVal = this.getGaTotals(aggregate[hour]['Total'].gaItems) 

            aggregate[hour][gaContext].Total.gaItems.push(curHour)
            aggregate[hour][gaContext].Total.gaVal =  this.getGaTotals(aggregate[hour][gaContext].Total.gaItems) 

        })

        
    })
    

    return aggregate;
}
aggregate(){
    var byHourDate = this.aggregateRawTotalsByAdUnitHourOrDate()
    var byTotal = this.aggregateRawTotalsByAdUnit()
    return {
        byHourDate,
        byTotal
    }
}

aggregateAdUnitObjectGeneric(valObj) {
    var aggregate = {};
    Object.keys(this.data.ad_units.by_context).forEach((context)=>{
        aggregate[context] = {
            Total:{
                val:valObj(),
                items:{}
            }
        }
    })
    
    aggregate["Total"] = {
        val:valObj(),
        items:{}
    }

    Object.keys(this.data.ad_units.by_type).forEach((contextType)=>{
        this.data.ad_units.by_type[contextType].forEach((unitId)=>{     
            var context = this.getContextByUnitId(unitId);
            const contextTypeUpped = contextType.toUpperCase();        
            if(aggregate[context][contextTypeUpped] === undefined){
                aggregate[context][contextTypeUpped] = {
                    val:valObj(),
                    items:{}
                }
            }
        })
    })

    return aggregate;
}


 round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

getRevenueTotals(keys,data){
    var total = 0;
    keys.forEach((key)=>{
        const val = data[key];
        total += val;
    })

    return this.round((total/1000000),2)
}

grvRevenueKeys = [
    'prop_programmatic_revenue',
    'prop_programmatic_high_value_revenue'
]

googleRevenueKeys = [
    'google_revenue'
]

grvDirectRevenueKeys = [
    'prop_direct_revenue'
]

totalRevenueKeys = [
    'prop_programmatic_revenue',
    'prop_programmatic_high_value_revenue',
    'prop_direct_revenue',
    'google_revenue'
]

aggregateHelper = (keys,dataSource) => {
    var totals = {};
    keys.forEach((key)=> {
        var methodName = key+"Keys";
        var keys = eval(this[methodName])
        totals[key] = this.getRevenueTotals(keys,dataSource)

    })
    return totals;
}

applyAggregate = (source,data) => {
    Object.keys(data).forEach((key)=>{
        const val = data[key];
        source[key] = val;
    })
}

initAdUnitGeneric = (source,adUnitId, itemObj) =>{
    const adUnit = this.getAdUnitById(adUnitId);
    if(source[adUnitId] === undefined){
        source[adUnitId] = {
            name: adUnit.name,
            context: this.getContextByUnitId(adUnitId),
            contextType: this.getTypeByUnitId(adUnitId),
            rawUnit: adUnit,
            ...itemObj()
        }
    }
}


getRevenueAggregateTotal(){
    var baseDataTotal = this.aggregate().byTotal
    const aggregateRevenue = this.aggregateAdUnitObjectGeneric(this.aggregatedRevenueItem);

    Object.keys(baseDataTotal).forEach((context)=>{
        
        if(context === 'Total'){
            const totalRev = baseDataTotal.Total.val;        
        
            var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],totalRev)
            this.applyAggregate(aggregateRevenue['Total'].val, agg);
    
            baseDataTotal.Total.items.forEach((adUnitRev)=>{
                const adUnit = this.getAdUnitById(adUnitRev.uid);

                this.initAdUnitGeneric(aggregateRevenue['Total'].items,adUnitRev.uid, this.aggregatedRevenueItem);

                var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],adUnitRev)
                this.applyAggregate(aggregateRevenue['Total'].items[adUnitRev.uid], agg);
            })

                
        } else{

            Object.keys(baseDataTotal[context]).forEach((contextType)=>{
                
                if(contextType === 'Total') {

                    const contextRevTotal = baseDataTotal[context].Total.val;

                    var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],contextRevTotal)
                    this.applyAggregate(aggregateRevenue[context].Total.val, agg);

                    baseDataTotal[context].Total.items.forEach((adUnitContextRev)=>{
                                
                        this.initAdUnitGeneric(aggregateRevenue[context].Total.items,adUnitContextRev.uid,this.aggregatedRevenueItem);

                        var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],adUnitContextRev)
                        this.applyAggregate(aggregateRevenue[context].Total.items[adUnitContextRev.uid], agg);

                    })


                }else{

                    const contextRevTypeTotal = baseDataTotal[context][contextType].val;

                    var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],contextRevTypeTotal)
                    this.applyAggregate(aggregateRevenue[context][contextType].val, agg);

                    baseDataTotal[context][contextType].items.forEach((adUnitContextTypeRev)=>{
                                
                        this.initAdUnitGeneric(aggregateRevenue[context][contextType].items,adUnitContextTypeRev.uid,this.aggregatedRevenueItem);
                       
                        var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],adUnitContextTypeRev)
                        this.applyAggregate(aggregateRevenue[context][contextType].items[adUnitContextTypeRev.uid], agg);
                    })

                }

            })

        }

    })

    return aggregateRevenue;

}

getRevenueAggregateByHourOrDate() {

    var baseDayHourly = this.aggregate().byHourDate;

    const aggregateRevenue = {};

    Object.keys(baseDayHourly).forEach((key)=>{
        aggregateRevenue[key] = this.aggregateAdUnitObjectGeneric(this.aggregatedRevenueItem);
    })


    Object.keys(baseDayHourly).forEach((key)=>{
        const current = baseDayHourly[key];
        
        Object.keys(current).forEach((context)=>{
            if(context == 'Total'){
                const totalByDateHour =  current.Total.val;
                var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],totalByDateHour)
                this.applyAggregate(aggregateRevenue[key].Total.val, agg);

                baseDayHourly[key].Total.items.forEach((adUnitRev)=>{
                    this.initAdUnitGeneric(aggregateRevenue[key].Total.items,adUnitRev.uid,this.aggregatedRevenueItem);
                    var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],adUnitRev)
                    this.applyAggregate(aggregateRevenue[key].Total.items[adUnitRev.uid], agg);
                })

            }else{

                const totalByDateHourContext = current[context].Total.val;
                var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],totalByDateHourContext)
                this.applyAggregate(aggregateRevenue[key][context].Total.val, agg);


                baseDayHourly[key][context].Total.items.forEach((adUnitRevContext)=>{
                    this.initAdUnitGeneric(aggregateRevenue[key][context].Total.items,adUnitRevContext.uid,this.aggregatedRevenueItem);
                    var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],adUnitRevContext)
                    this.applyAggregate(aggregateRevenue[key][context].Total.items[adUnitRevContext.uid], agg);

                })

                
                Object.keys(current[context]).forEach((contextType)=>{
                    const totalByDateHourContextType = current[context][contextType].val;
                    var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],totalByDateHourContextType)
                    this.applyAggregate(aggregateRevenue[key][context][contextType].val, agg);
                })

                Object.keys(baseDayHourly[key][context]).forEach((contextType)=>{
                    if(contextType == 'Total'){
                    }else{
                        baseDayHourly[key][context][contextType].items.forEach((adUnitRevContextType)=>{
                            this.initAdUnitGeneric(aggregateRevenue[key][context][contextType].items,adUnitRevContextType.uid,this.aggregatedRevenueItem);
                            var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],adUnitRevContextType)
                            this.applyAggregate(aggregateRevenue[key][context][contextType].items[adUnitRevContextType.uid], agg);
                        })

                        
                    }
                })

            }
        })


    })



    


    return aggregateRevenue;
}

getAdsImpsTotals(keys,data){
    var total = 0;
    keys.forEach((key)=>{
        const val = data[key];
        total += val;
    })

    return total;
}


grvImpressionKeys = [
    'prop_direct_impressions',
    'prop_programmatic_high_value_impressions',
    'prop_programmatic_impressions'
]

grvRevenueKeys = [
    'prop_programmatic_high_value_revenue',
    'prop_direct_revenue',
    'prop_programmatic_revenue'
]

grvDirectImpressionKeys = [
    'prop_direct_impressions',
]

grvDirectRevenueKeys = [
    'prop_direct_revenue',
]

googleImpressionKeys = [
    'google_impressions',
]

googleRevenueKeys = [
    'google_revenue'
]

getEcpm = (revenue,impressions)=>{;
    return this.round((revenue/impressions) *1000,2);
}

getRPM = (revenue,pageViews) =>{
    return this.round((revenue/pageViews) * 1000,2)
}

getAdsImpPerPage = (impression,pageviews) => {
    return this.round((impression/pageviews),2);
}

aggregateeAdsItemProcess = (dataSource,dest) => {

    dest.totalImps = dataSource.total_impressions
    dest.totalEcpm = this.getEcpm(dataSource.total_revenue/1000000,dataSource.total_impressions)
    
    dest.grvImps = this.getAdsImpsTotals(this.grvImpressionKeys, dataSource);
    dest.grvEcpm = this.getEcpm(this.getAdsImpsTotals(this.grvRevenueKeys, dataSource)/1000000,dest.grvImps)

    dest.grvDirectImps = this.getAdsImpsTotals(this.grvDirectImpressionKeys, dataSource);
    dest.grvDirectEcpm = this.getEcpm(this.getAdsImpsTotals(this.grvDirectRevenueKeys, dataSource)/1000000, dest.grvDirectImps)
    
    dest.googleImps = this.getAdsImpsTotals(this.googleImpressionKeys, dataSource);
    dest.googleEcpm = this.getEcpm(this.getAdsImpsTotals(this.googleRevenueKeys, dataSource)/1000000, dest.googleImps)


    }

getAdsAggregateTotal(){
    var baseDataTotal = this.aggregate().byTotal

    const aggregateAds = this.aggregateAdUnitObjectGeneric(this.aggregatedAdsItem);

    
    Object.keys(baseDataTotal).forEach((context)=>{
        if(context === 'Total'){
            
            const totalC = baseDataTotal[context].val;

            this.aggregateeAdsItemProcess(totalC, aggregateAds['Total'].val);


            baseDataTotal.Total.items.forEach((item)=>{

                this.initAdUnitGeneric(aggregateAds.Total.items, item.uid, this.aggregatedAdsItem);
                const totalUnit = baseDataTotal.Total.items.find((item=> item.uid = item.uid));
                this.aggregateeAdsItemProcess(totalUnit,aggregateAds.Total.items[item.uid])
            })

        }else{

           
            Object.keys(aggregateAds[context]).forEach((contextType)=>{
                
                if(contextType === 'Total'){
                    const totalContext = baseDataTotal[context].Total.val;

                    this.aggregateeAdsItemProcess(totalContext,aggregateAds[context].Total.val );

                    baseDataTotal[context].Total.items.forEach((item)=>{

                        this.initAdUnitGeneric(aggregateAds[context].Total.items, item.uid, this.aggregatedAdsItem);
                        const totalContextUnit = baseDataTotal[context].Total.items.find((item=> item.uid = item.uid));
                        this.aggregateeAdsItemProcess(totalContextUnit, aggregateAds[context].Total.items[item.uid])
                       
                    })
                    

                
                }else {
                    const totalContextType = baseDataTotal[context][contextType].val;

                    this.aggregateeAdsItemProcess(totalContextType, aggregateAds[context][contextType].val)

                    baseDataTotal[context][contextType].items.forEach((item)=>{

                        this.initAdUnitGeneric(aggregateAds[context][contextType].items, item.uid, this.aggregatedAdsItem);

                        const totalContextTypeUnit = baseDataTotal[context][contextType].items.find((item=> item.uid = item.uid));

                        this.aggregateeAdsItemProcess(totalContextTypeUnit, aggregateAds[context][contextType].items[item.uid])

                    })

                }

            })
        
        }

    });



    // console.log(aggregateRevenue)

    return aggregateAds;

}

getAdsAggregateHourDate(){
    var baseDayHourly = this.aggregate().byHourDate;

    const aggregateAds = {};

    Object.keys(baseDayHourly).forEach((key)=>{
        aggregateAds[key] = this.aggregateAdUnitObjectGeneric(this.aggregatedAdsItem);
    })

    Object.keys(baseDayHourly).forEach((hour)=>{
        const current = baseDayHourly[hour];
        Object.keys(current).forEach((context)=>{
            
            var tcLvl1 = current[context].val;

            if(tcLvl1 === undefined){
               Object.keys(current[context]).forEach((contextType)=>{
                tcLvl1 = current[context][contextType].val

                current[context][contextType].items.forEach((item)=>{
                    var tcLvl2 = current[context][contextType].items.find((item=> item.uid))
                    this.initAdUnitGeneric(aggregateAds[hour][context][contextType].items, item.uid, this.aggregatedAdsItem);
                    this.aggregateeAdsItemProcess(tcLvl2, aggregateAds[hour][context][contextType].items[item.uid])
                })

                this.aggregateeAdsItemProcess(tcLvl1, aggregateAds[hour][context][contextType].val)
               })

            }else{
                this.aggregateeAdsItemProcess(tcLvl1, aggregateAds[hour][context].val)
            }
        })
    });


    return aggregateAds;
}

aggregatePagesItemProcess(dateSource,dest) {
    dest.pageViews = dateSource.ga.pageviews;

    dest.rpm = this.getRPM((dateSource.data.total_revenue/1000000), dateSource.ga.pageviews)
    dest.adImpsPerPage = this.getAdsImpPerPage(dateSource.data.total_impressions, dateSource.ga.pageviews);
    dest.totalEstRev = this.round((dateSource.data.total_revenue/1000000),2)
}

getPagesAggregatesByTotal(){
    var baseDataTotal = this.aggregate().byTotal

    const aggregatePages = this.aggregateAdUnitObjectGeneric(this.aggregatedPageItem);

    Object.keys(baseDataTotal).forEach((context)=>{
        var lev1= baseDataTotal[context].val;

        if(lev1 !== undefined){
            // is total parent level

            lev1 = {
                data:baseDataTotal[context].val,
                ga:baseDataTotal[context].gaVal
            }

            this.aggregatePagesItemProcess(lev1, aggregatePages[context].val)

            baseDataTotal[context].items.forEach((adUnitItem)=> {
                
                this.initAdUnitGeneric(aggregatePages[context].items, adUnitItem.uid, this.aggregatedPageItem)
                const totalContextUnit= baseDataTotal[context].items.find(item => item.uid == adUnitItem.uid)

                const adUnitContext = this.getContextByUnitId(adUnitItem.uid);

                this.aggregatePagesItemProcess({
                    data: totalContextUnit,
                    ga: baseDataTotal[adUnitContext].Total.gaVal
                }, aggregatePages[context].items[adUnitItem.uid])

            })


        }else{

            Object.keys(baseDataTotal[context]).forEach((contextType)=>{
                lev1 = {
                    data:baseDataTotal[context][contextType].val,
                    ga:baseDataTotal[context][contextType].gaVal,   
                }

                if(baseDataTotal[context][contextType].gaVal.pageviews === 0){
                    lev1.ga = baseDataTotal[context].Total.gaVal
                }

                this.aggregatePagesItemProcess(lev1, aggregatePages[context][contextType].val)


                const contextItems = baseDataTotal[context][contextType].items;

                contextItems.forEach((adUnit)=>{
                    this.initAdUnitGeneric(aggregatePages[context][contextType].items, adUnit.uid, this.aggregatedPageItem);
                    
                    const adUnitContext = this.getContextByUnitId(adUnit.uid);

                    this.aggregatePagesItemProcess({
                        data: adUnit,
                        ga: baseDataTotal[adUnitContext].Total.gaVal
                    }, aggregatePages[context][contextType].items[adUnit.uid])

                })

            })

        }
        
    })


    return aggregatePages;
    
}


getPagesAggregatesByHourOrDate(){
    var baseDayHourly = this.aggregate().byHourDate;

    const aggregatePages= {};

    Object.keys(baseDayHourly).forEach((key)=>{
        aggregatePages[key] = this.aggregateAdUnitObjectGeneric(this.aggregatedPageItem);
    })

    Object.keys(baseDayHourly).forEach((hour)=>{
        const current = baseDayHourly[hour];

        Object.keys(current).forEach((ParentContext)=>{
            if(ParentContext == 'Total'){
                const totalByDateHour =  current.Total;
                this.aggregatePagesItemProcess({
                    data: totalByDateHour.val,
                    ga: totalByDateHour.gaVal
                }, aggregatePages[hour][ParentContext].val)

            }else{

                Object.keys(current[ParentContext]).forEach((contextType)=> {
                    

                    this.aggregatePagesItemProcess({
                        data: baseDayHourly[hour][ParentContext][contextType].val,
                        ga: baseDayHourly[hour][ParentContext].Total.gaVal,
                    }, aggregatePages[hour][ParentContext][contextType].val
                    )

                    const contextItems = baseDayHourly[hour][ParentContext][contextType].items;

                    contextItems.forEach((adUnit)=>{
                        this.initAdUnitGeneric(aggregatePages[hour][ParentContext][contextType].items, adUnit.uid, this.aggregatedPageItem);
                        const adUnitContext = this.getContextByUnitId(adUnit.uid);

                        this.aggregatePagesItemProcess({
                            data: adUnit,
                            ga: baseDayHourly[hour][ParentContext].Total.gaVal,
                        }, aggregatePages[hour][ParentContext][contextType].items[adUnit.uid]
                        )

                    });


                })

            }
        })

    });

    return aggregatePages;

}

aggregateFillItemProcess(dataSource,dest){
    dest.totalAvailableOmps = (dataSource.val.total_impressions + dataSource.val.unfilled_requests );
    dest.totalOmps = dataSource.val.total_impressions;
    dest.ompImps = dataSource.val.total_impressions;
    dest.unfilledRequests = dataSource.val.unfilled_requests;
    
    var totalRev = dataSource.val.total_revenue;

    totalRev-= dataSource.val.prop_direct_revenue;

    dest.totalOeCpm = this.getEcpm(totalRev/1000000, dest.totalAvailableOmps);

    dest.fill = this.round((dest.totalOmps / dest.totalAvailableOmps) * 100,2);

}

aggregateFillTotal() {
    var baseDataTotal = this.aggregate().byTotal

    const aggregateFill = this.aggregateAdUnitObjectGeneric(this.aggregatedFillItem);

    Object.keys(baseDataTotal).forEach((ParentContext)=>{
        if(ParentContext == 'Total'){
            const total = baseDataTotal.Total;

            this.aggregateFillItemProcess(total, aggregateFill[ParentContext].val);

            baseDataTotal[ParentContext].items.forEach((adUnit)=>{
                this.initAdUnitGeneric(aggregateFill[ParentContext].items, adUnit.uid, this.aggregatedFillItem);
                // const adUnitContext = this.getContextByUnitId(adUnit.uid);

                this.aggregateFillItemProcess({val:adUnit}, aggregateFill[ParentContext].items[adUnit.uid]);

            })

        }else{

            Object.keys(baseDataTotal[ParentContext]).forEach((contextType)=>{
                this.aggregateFillItemProcess(baseDataTotal[ParentContext][contextType], aggregateFill[ParentContext][contextType].val);

                const contextItems = baseDataTotal[ParentContext][contextType].items;

                contextItems.forEach((adUnit)=>{
                    this.initAdUnitGeneric(aggregateFill[ParentContext][contextType].items, adUnit.uid, this.aggregatedFillItem);
                    this.aggregateFillItemProcess({val:adUnit}, aggregateFill[ParentContext][contextType].items[adUnit.uid]);

                })

            })

        }
    });

    return aggregateFill
}

getFillAggregateHourDate(){
    var baseDayHourly = this.aggregate().byHourDate;

    const aggregateFill = {}

    Object.keys(baseDayHourly).forEach((key)=>{
        aggregateFill[key] = this.aggregateAdUnitObjectGeneric(this.aggregatedFillItem);
    })

    Object.keys(baseDayHourly).forEach((hour)=>{
        const current = baseDayHourly[hour];

        Object.keys(current).forEach((ParentContext)=>{
            if(ParentContext == 'Total'){
                const totalByDateHour =  current.Total;
                this.aggregateFillItemProcess({val:totalByDateHour.val}, aggregateFill[hour][ParentContext].val);
            }else{

                Object.keys(current[ParentContext]).forEach((innerContext)=>{
                    const totalByDateHourContext = current[ParentContext][innerContext];
                    
                    this.aggregateFillItemProcess({
                    val: totalByDateHourContext.val,
                }, aggregateFill[hour][ParentContext][innerContext].val)

                })
            }
        });
    });


    return aggregateFill;


}


aggregateViewabilityItemProcess(dataSource,dest){
    dest.viewability=30;

    console.log(dataSource.val)
    
    dest.totalEstRevenue = this.round((dataSource.val.total_revenue/1000000),2);
}

aggregateViewabilityTotal(){
    const aggregateViewability = this.aggregateAdUnitObjectGeneric(this.aggregatedViewabilityItem);
    
    var baseDataTotal = this.aggregate().byTotal;


    Object.keys(baseDataTotal).forEach((ParentContext)=>{
        if(ParentContext === "Total"){
            const total = baseDataTotal.Total;
            this.aggregateViewabilityItemProcess(total, aggregateViewability[ParentContext].val);
        }
    })



    return aggregateViewability;
}

revenueData() {
    return {
        Total: this.getRevenueAggregateTotal(),
        HourlyOrDay: this.getRevenueAggregateByHourOrDate()
    }
}

adsData() {
    return {
        Total: this.getAdsAggregateTotal(),
        HourlyOrDay: this.getAdsAggregateHourDate()
    }
}

pagesData() {
    return {
        Total: this.getPagesAggregatesByTotal(),
        HourlyOrDay: this.getPagesAggregatesByHourOrDate()
    }
}

fillData(){
    return {
        Total: this.aggregateFillTotal(),
        HourlyOrDay: this.getFillAggregateHourDate()
    }
}

viewabilityData(){
    return {
        Tota: this.aggregateViewabilityTotal(),
    }
}

allData(){
    return {
        revenue: this.revenueData(),
        ads: this.adsData(),
        pages: this.pagesData()
    }
}



}

module.exports = ReportAggregatorBase;