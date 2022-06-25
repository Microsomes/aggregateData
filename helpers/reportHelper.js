

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

aggregateAdUnitObjectRevenue() {
    var aggregate = {};
    Object.keys(this.data.ad_units.by_context).forEach((context)=>{
        aggregate[context] = {
            Total:{
                val:this.aggregatedRevenueItem(),
                items:{}
            }
        }
    })
    
    aggregate["Total"] = {
        val:this.aggregatedRevenueItem(),
        items:{}
    }

    Object.keys(this.data.ad_units.by_type).forEach((contextType)=>{
        this.data.ad_units.by_type[contextType].forEach((unitId)=>{     
            var context = this.getContextByUnitId(unitId);
            const contextTypeUpped = contextType.toUpperCase();        
            if(aggregate[context][contextTypeUpped] === undefined){
                aggregate[context][contextTypeUpped] = {
                    val:this.aggregatedRevenueItem(),
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

getRevenueAggregateTotal(){
    var baseDataTotal = this.aggregate().byTotal
    const aggregateRevenue = this.aggregateAdUnitObjectRevenue();

    const grvRevenueKeys = [
        'prop_programmatic_revenue',
        'prop_programmatic_high_value_revenue'
    ]

    const gogoleRevenueKeys = [
        'google_revenue'
    ]

    const directRevenueKeys = [
        'prop_direct_revenue'
    ]

    const totalEstRevKeys = [
        'prop_programmatic_revenue',
        'prop_programmatic_high_value_revenue',
        'prop_direct_revenue',
        'google_revenue'
    ]
  
    Object.keys(baseDataTotal).forEach((context)=>{
        
        if(context === 'Total'){
            const totalRev = baseDataTotal.Total.val;        
        
            aggregateRevenue['Total'].val.grvRevenue = this.getRevenueTotals(grvRevenueKeys, totalRev);
            aggregateRevenue['Total'].val.googleRevenue = this.getRevenueTotals(gogoleRevenueKeys, totalRev);;
            aggregateRevenue['Total'].val.grvDirectRevenue = this.getRevenueTotals(directRevenueKeys, totalRev);
            aggregateRevenue['Total'].val.totalRevenue = this.getRevenueTotals(totalEstRevKeys, totalRev);;
        
            
            baseDataTotal.Total.items.forEach((adUnitRev)=>{

                const adUnit = this.getAdUnitById(adUnitRev.uid);

                if(aggregateRevenue['Total'].items[adUnitRev.uid] === undefined){
                    aggregateRevenue['Total'].items[adUnitRev.uid] = {
                        name:adUnit.name,
                        context: this.getContextByUnitId(adUnitRev.uid),
                        contextType: this.getTypeByUnitId(adUnitRev.uid),
                        rawUnit: adUnit,
                        ...this.aggregatedRevenueItem()
                    }
                }

                aggregateRevenue['Total'].items[adUnitRev.uid].grvRevenue = this.getRevenueTotals(grvRevenueKeys, adUnitRev)
                aggregateRevenue['Total'].items[adUnitRev.uid].googleRevenue = this.getRevenueTotals(gogoleRevenueKeys, adUnitRev)
                aggregateRevenue['Total'].items[adUnitRev.uid].grvDirectRevenue = this.getRevenueTotals(directRevenueKeys, adUnitRev)
                aggregateRevenue['Total'].items[adUnitRev.uid].totalRevenue = this.getRevenueTotals(totalEstRevKeys, adUnitRev)

            })

                
        } else{

            Object.keys(baseDataTotal[context]).forEach((contextType)=>{
                
                if(contextType === 'Total') {

                    const contextRevTotal = baseDataTotal[context].Total.val;

                    aggregateRevenue[context].Total.val.grvRevenue = this.getRevenueTotals(grvRevenueKeys, contextRevTotal)
                    aggregateRevenue[context].Total.val.googleRevenue = this.getRevenueTotals(gogoleRevenueKeys, contextRevTotal)
                    aggregateRevenue[context].Total.val.grvDirectRevenue = this.getRevenueTotals(directRevenueKeys, contextRevTotal)
                    aggregateRevenue[context].Total.val.totalRevenue = this.getRevenueTotals(totalEstRevKeys, contextRevTotal)


                    baseDataTotal[context].Total.items.forEach((adUnitContextRev)=>{
                        
                        const adUnit = this.getAdUnitById(adUnitContextRev.uid);
        
                        if(aggregateRevenue[context].Total.items[adUnitContextRev.uid] === undefined){
                            aggregateRevenue[context].Total.items[adUnitContextRev.uid] = {
                                name:adUnit.name,
                                context: this.getContextByUnitId(adUnitContextRev.uid),
                                contextType: this.getTypeByUnitId(adUnitContextRev.uid),
                                rawUnit: adUnit,
                                ...this.aggregatedRevenueItem()
                            }
                        }

                        aggregateRevenue[context].Total.items[adUnitContextRev.uid].grvRevenue = this.getRevenueTotals(grvRevenueKeys, adUnitContextRev)
                        aggregateRevenue[context].Total.items[adUnitContextRev.uid].googleRevenue = this.getRevenueTotals(gogoleRevenueKeys, adUnitContextRev)
                        aggregateRevenue[context].Total.items[adUnitContextRev.uid].grvDirectRevenue = this.getRevenueTotals(directRevenueKeys, adUnitContextRev)
                        aggregateRevenue[context].Total.items[adUnitContextRev.uid].totalRevenue = this.getRevenueTotals(totalEstRevKeys, adUnitContextRev)
        
                    })


                }else{

                    const contextRevTypeTotal = baseDataTotal[context][contextType].val;

                    aggregateRevenue[context][contextType].val.grvRevenue = this.getRevenueTotals(grvRevenueKeys, contextRevTypeTotal)
                    aggregateRevenue[context][contextType].val.googleRevenue = this.getRevenueTotals(gogoleRevenueKeys, contextRevTypeTotal)
                    aggregateRevenue[context][contextType].val.grvDirectRevenue = this.getRevenueTotals(directRevenueKeys, contextRevTypeTotal)
                    aggregateRevenue[context][contextType].val.totalRevenue = this.getRevenueTotals(totalEstRevKeys, contextRevTypeTotal)


                    baseDataTotal[context][contextType].items.forEach((adUnitContextTypeRev)=>{
                        
                        const adUnit = this.getAdUnitById(adUnitContextTypeRev.uid);
        
                        if(aggregateRevenue[context][contextType].items[adUnitContextTypeRev.uid] === undefined){
                            aggregateRevenue[context][contextType].items[adUnitContextTypeRev.uid] = {
                                name:adUnit.name,
                                context: this.getContextByUnitId(adUnitContextTypeRev.uid),
                                contextType: this.getTypeByUnitId(adUnitContextTypeRev.uid),
                                rawUnit: adUnit,
                                ...this.aggregatedRevenueItem()
                            }
                        }

                        aggregateRevenue[context][contextType].items[adUnitContextTypeRev.uid].grvRevenue = this.getRevenueTotals(grvRevenueKeys, adUnitContextTypeRev)
                        aggregateRevenue[context][contextType].items[adUnitContextTypeRev.uid].googleRevenue = this.getRevenueTotals(gogoleRevenueKeys, adUnitContextTypeRev)
                        aggregateRevenue[context][contextType].items[adUnitContextTypeRev.uid].grvDirectRevenue = this.getRevenueTotals(directRevenueKeys, adUnitContextTypeRev)
                        aggregateRevenue[context][contextType].items[adUnitContextTypeRev.uid].totalRevenue = this.getRevenueTotals(totalEstRevKeys, adUnitContextTypeRev)
                       
                    })

                }



            })

        }

    })

    return aggregateRevenue;

    // console.log(aggregateRevenue);

}

getRevenueAggregateByHourOrDate() {

    var baseDayHourly = this.aggregate().byHourDate;

    const aggregateRevenue = {};

    Object.keys(baseDayHourly).forEach((key)=>{
        aggregateRevenue[key] = this.aggregateAdUnitObjectRevenue();
    })

    


    return aggregateRevenue;
}



}

module.exports = ReportAggregatorBase;