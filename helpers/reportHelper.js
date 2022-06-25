

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

            const currentHour = this.data.report[reportUnitId][key];

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
                val:valObj,
                items:{}
            }
        }
    })
    
    aggregate["Total"] = {
        val:valObj,
        items:{}
    }

    Object.keys(this.data.ad_units.by_type).forEach((contextType)=>{
        this.data.ad_units.by_type[contextType].forEach((unitId)=>{     
            var context = this.getContextByUnitId(unitId);
            const contextTypeUpped = contextType.toUpperCase();        
            if(aggregate[context][contextTypeUpped] === undefined){
                aggregate[context][contextTypeUpped] = {
                    val:valObj,
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

initAdUnit = (source,adUnitId) =>{
    const adUnit = this.getAdUnitById(adUnitId);
    if(source[adUnitId] === undefined){
        source[adUnitId] = {
            name: adUnit.name,
            context: this.getContextByUnitId(adUnitId),
            contextType: this.getTypeByUnitId(adUnitId),
            rawUnit: adUnit,
            ...this.aggregatedRevenueItem()
        }
    }
}


getRevenueAggregateTotal(){
    var baseDataTotal = this.aggregate().byTotal
    const aggregateRevenue = this.aggregateAdUnitObjectGeneric(this.aggregatedRevenueItem());

    Object.keys(baseDataTotal).forEach((context)=>{
        
        if(context === 'Total'){
            const totalRev = baseDataTotal.Total.val;        
        
            var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],totalRev)
            this.applyAggregate(aggregateRevenue['Total'].val, agg);
    
            baseDataTotal.Total.items.forEach((adUnitRev)=>{
                const adUnit = this.getAdUnitById(adUnitRev.uid);

                this.initAdUnit(aggregateRevenue['Total'].items,adUnitRev.uid);

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
                                
                        this.initAdUnit(aggregateRevenue[context].Total.items,adUnitContextRev.uid);

                        var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],adUnitContextRev)
                        this.applyAggregate(aggregateRevenue[context].Total.items[adUnitContextRev.uid], agg);

                    })


                }else{

                    const contextRevTypeTotal = baseDataTotal[context][contextType].val;

                    var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],contextRevTypeTotal)
                    this.applyAggregate(aggregateRevenue[context][contextType].val, agg);

                    baseDataTotal[context][contextType].items.forEach((adUnitContextTypeRev)=>{
                                
                        this.initAdUnit(aggregateRevenue[context][contextType].items,adUnitContextTypeRev.uid);
                       
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
        aggregateRevenue[key] = this.aggregateAdUnitObjectGeneric(this.aggregatedRevenueItem());
    })


    Object.keys(baseDayHourly).forEach((key)=>{
        const current = baseDayHourly[key];
        
        Object.keys(current).forEach((context)=>{
            if(context == 'Total'){
                const totalByDateHour =  current.Total.val;
                var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],totalByDateHour)
                this.applyAggregate(aggregateRevenue[key].Total.val, agg);

                baseDayHourly[key].Total.items.forEach((adUnitRev)=>{
                    this.initAdUnit(aggregateRevenue[key].Total.items,adUnitRev.uid);
                    var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],adUnitRev)
                    this.applyAggregate(aggregateRevenue[key].Total.items[adUnitRev.uid], agg);
                })

            }else{

                const totalByDateHourContext = current[context].Total.val;
                var agg = this.aggregateHelper(['grvRevenue','googleRevenue','grvDirectRevenue','totalRevenue'],totalByDateHourContext)
                this.applyAggregate(aggregateRevenue[key][context].Total.val, agg);


                baseDayHourly[key][context].Total.items.forEach((adUnitRevContext)=>{
                    this.initAdUnit(aggregateRevenue[key][context].Total.items,adUnitRevContext.uid);
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
                            this.initAdUnit(aggregateRevenue[key][context][contextType].items,adUnitRevContextType.uid);
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

revenueData() {
    return {
        Total: this.getRevenueAggregateTotal(),
        HourlyOrDay: this.getRevenueAggregateByHourOrDate()
    }
}



}

module.exports = ReportAggregatorBase;