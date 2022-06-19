

class ReportHelper {

    constructor(reportingData) {
        this.data = reportingData;
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
            total_revenue:0
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


aggregateRawByAdUnit() {
    var aggregate = this.aggregateAdUnitObject();
    
    Object.keys(this.data.totals.rollup.ad_unit_id).forEach((adUnitId)=>{
        const context = this.getContextByUnitId(adUnitId);
        const type = this.getTypeByUnitId(adUnitId);
        const current = this.data.totals.rollup.ad_unit_id[adUnitId];

        //work put by context
        aggregate[context].Total.push(current);
        //work put by ad iun
        aggregate[context][type].push(current);
        //work out the total 
        aggregate['Total'].push(current);


    });

    console.log(aggregate);

}

aggregateAdUnitObject(){
    var aggregate = {};
    Object.keys(this.data.ad_units.by_context).forEach((context)=>{
        aggregate[context] = {
            Total:[]
        }
    })
    
    aggregate["Total"] = []

    Object.keys(this.data.ad_units.by_type).forEach((contextType)=>{
        this.data.ad_units.by_type[contextType].forEach((unitId)=>{     
            var context = this.getContextByUnitId(unitId);
            const contextTypeUpped = contextType.toUpperCase();        
            if(aggregate[context][contextTypeUpped] === undefined){
                aggregate[context][contextTypeUpped] = []
            }
        })
    })

    return aggregate;
}


}

module.exports = ReportHelper;