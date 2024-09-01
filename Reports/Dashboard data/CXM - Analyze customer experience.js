/**
 * Copyright (C) 1992-2023 Software AG, Darmstadt, Germany and/or Software AG USA Inc., Reston, VA, USA,
 * and/or its subsidiaries and/or its affiliates and/or their licensors.
 *
 * Use, reproduction, transfer, publication or disclosure is prohibited
 * except as specifically provided for in your License Agreement with Software AG.
 *
 * Version: 10.0.22.0.3295151
 *
 * IMPORTANT NOTE:
 *     Please note that this is a standard script provided with the product.
 *     Any changes you make to this file will be overwritten during a product update and thus be irrecoverably lost.
 *     If you want to adapt this script according to your individual needs, we urgently recommend that you create a copy of this file
 *     and add your changes to the copy. The copied file will not be overwritten by a product update.
 *     After a product update, it is advisable that you check your copied file against the updated version of the original file
 *     and add all relevant changes or fixes to your copy.
 */

var nLoc = Context.getSelectedLanguage();
var oFilter = ArisData.ActiveFilter();

const outputParameters = new OutputParameters("");
const output = createXmlOutput(outputParameters);

var aProcessModelTypes = [Constants.MT_EEPC, Constants.MT_VAL_ADD_CHN_DGM];

outHeader();

var oJourneyLandscapeModels = ArisData.getActiveDatabase().Find(Constants.SEARCH_MODEL, Constants.MT_CUSTOMER_JOURNEY_LANDSCAPE);
for (var i in oJourneyLandscapeModels) {
    var oJourneyLandscapeModel = oJourneyLandscapeModels[i];

    var oJourneyObjDefs = oJourneyLandscapeModel.ObjDefListByTypes([Constants.OT_CUSTOMER_JOURNEY]);
    for (var j in oJourneyObjDefs) {
        var oJourneyObjDef = oJourneyObjDefs[j];
        
        var oJourneyMapModels = oJourneyObjDef.AssignedModels(Constants.MT_CUSTOMER_JOURNEY_MAP);
        if (oJourneyMapModels.length > 0) {
            for (var k in oJourneyMapModels) {
                var oJourneyMapModel = oJourneyMapModels[k];
  
                var oJourneyStepObjDefs = oJourneyMapModel.ObjDefListByTypes([Constants.OT_CUSTOMER_JOURNEY_STEP]);
                for (var m in oJourneyStepObjDefs) {
                    var oJourneyStepObjDef = oJourneyStepObjDefs[m];

                    var oTouchpointObjDefs = getConnectedTouchpoints(oJourneyMapModel, oJourneyStepObjDef);
                    for (var t in oTouchpointObjDefs) {
                        var oTouchpointObjDef = oTouchpointObjDefs[t];
                        var nProcessCount = getProcessCount(oTouchpointObjDef);
                        
                        output.addRow([oJourneyLandscapeModel.Name(nLoc),
                                       oJourneyLandscapeModel.GUID(),
                                       oJourneyObjDef.Name(nLoc),
                                       oJourneyObjDef.GUID(),
                                       getAttrValue(oJourneyObjDef, Constants.AT_BUSINESS_DRIVER),
                                       getAttrValue(oJourneyObjDef, Constants.AT_BUSINESS_DRIVER_IMPACT),
                                       getAttrValue(oJourneyObjDef, Constants.AT_OVERALL_CUSTOMER_EXPERIENCE),
                                       oJourneyMapModel.Name(nLoc),
                                       oJourneyMapModel.GUID(),
                                       oJourneyStepObjDef.Name(nLoc),
                                       getAttrValue(oJourneyStepObjDef, Constants.AT_BUSINESS_DRIVER),
                                       getAttrValue(oJourneyStepObjDef, Constants.AT_BUSINESS_DRIVER_IMPACT),
                                       getAttrValue(oJourneyStepObjDef, Constants.AT_OVERALL_CUSTOMER_EXPERIENCE),
                                       oTouchpointObjDef.Name(nLoc),
                                       oTouchpointObjDef.GUID(),                                       
                                       nProcessCount,
                                       getAttrValue(oTouchpointObjDef, Constants.AT_MOMENT_OF_TRUTH),
                                       getAttrValue(oTouchpointObjDef, Constants.AT_PAIN_POINT),
                                       getAttrValue(oTouchpointObjDef, Constants.AT_BEST_PRACTICE),
                                       getAttrValue(oTouchpointObjDef, Constants.AT_CUSTOMER_FEELING),
                                       getAttrValue(oTouchpointObjDef, Constants.AT_IMPORTANCE_TO_CUSTOMER),
                                       getAttrValue(oTouchpointObjDef, Constants.AT_BUSINESS_RISK),
                                       getAttrValue(oTouchpointObjDef, Constants.AT_MARKET_POTENTIAL),
                                       getAttrCurrency(oTouchpointObjDef, Constants.AT_MARKET_POTENTIAL),
                                       getAttrValue(oTouchpointObjDef, Constants.AT_TRANSFORMATION_COSTS),
                                       getAttrCurrency(oTouchpointObjDef, Constants.AT_TRANSFORMATION_COSTS)]);
                    }
                }
            }
        } else {
            output.addRow([oJourneyLandscapeModel.Name(nLoc),
                           oJourneyLandscapeModel.GUID(),
                           oJourneyObjDef.Name(nLoc),
                           oJourneyObjDef.GUID(),
                           getAttrValue(oJourneyObjDef, Constants.AT_BUSINESS_DRIVER),
                           getAttrValue(oJourneyObjDef, Constants.AT_BUSINESS_DRIVER_IMPACT),
                           getAttrValue(oJourneyObjDef, Constants.AT_OVERALL_CUSTOMER_EXPERIENCE),
                           "",
                           "",
                           "",
                           "",
                           "",
                           "",
                           "",                           
                           "",
                           "",
                           "",
                           "",
                           "",
                           "",
                           "",
                           "",
                           "",
                           "",
                           "",
                           ""]);
        }
    }
}
uploadXmlOutputToADS(output, outputParameters);


/**************************************************************************************************************/

function getConnectedTouchpoints(oJourneyMapModel, oJourneyStepObjDef) {
    var oTouchpointObjDefs = new Array();
    
    var oJourneyStepObjOccs = oJourneyStepObjDef.OccListInModel(oJourneyMapModel);
    for (var i in oJourneyStepObjOccs) {
        var oInCxns = oJourneyStepObjOccs[i].Cxns(Constants.EDGES_IN);
        for (var j in oInCxns) {
            var oInCxn = oInCxns[j];
            if (oInCxn.CxnDef().TypeNum() != Constants.CT_IS_RELATED_TO) continue;
            
            var oSrcObjOcc = oInCxn.SourceObjOcc();
            var oSrcObjDef = oSrcObjOcc.ObjDef();
            if (oSrcObjDef.TypeNum() != Constants.OT_CUSTOMER_TOUCHPOINT) continue;
            
            oTouchpointObjDefs.push(oSrcObjDef);
        }
    }
    return ArisData.Unique(oTouchpointObjDefs);
}

function getProcessCount(oTouchpointObjDef) {
/*    
    if (!isboolattributetrue(oTouchpointObjDef, Constants.AT_PAIN_POINT, nLoc)) {
        return 0;   // Only for Painpoints
    }
*/    
    var oModels = ArisData.createTypedArray(Constants.CID_MODEL);
    var oOccList = oTouchpointObjDef.OccList();
    for (var i in oOccList) {
        oModels.push(oOccList[i].Model());
    }
    return ArisData.Unique(filterProcessModels(oModels)).length;
    
    function filterProcessModels(oModels) {
        var oProcModels = ArisData.createTypedArray(Constants.CID_MODEL);
        for (var i in oModels) {
            if (isProcessModel(oModels[i])) {
                oProcModels.push(oModels[i]);
            }
        }
        return oProcModels;
        
        function isProcessModel(oModel) {
            for (var i in aProcessModelTypes) {
                if (oModel.TypeNum() == aProcessModelTypes[i]) return true;
            }
            return false;
        }
    }
}

function getAttrValue(oItem, nAttrType) {
    var oAttr = oItem.Attribute(nAttrType, nLoc);
    if (!oAttr.IsMaintained()) return "";

    if (oFilter.AttrBaseType(nAttrType) == Constants.ABT_COMBINED) return oAttr.MeasureValue();
    return oAttr.getValue();   // default
}

function getAttrCurrency(oItem, nAttrType) {
    var oAttr = oItem.Attribute(nAttrType, nLoc);
    if (!oAttr.IsMaintained()) return "";
    
    if (oFilter.AttrBaseType(nAttrType) == Constants.ABT_COMBINED) return oAttr.MeasureUnit();
    return "";   // default
}

function outHeader() {
    output.setColumns([["Customer-journey-landscape","text"],
                       ["Customer-journey-landscape-Guid", "text"],
                       ["Customer-journey", "text"],
                       ["Customer-journey-Guid", "text"],
                       ["Business-driver", "text"],
                       ["Business-driver-on-transformation", "text"],
                       ["Overall customer experience", "text"],
                       ["Customer-journey-map", "text"],
                       ["Customer-journey-map-Guid", "text"],
                       ["Customer-journey-step", "text"],
                       ["Step-Business-driver", "text"],
                       ["Step-Business-driver-on-transformation", "text"],
                       ["Step-Overall customer experience", "text"],
                       ["Customer touchpoint", "text"],
                       ["Customer touchpoint-Guid", "text"],                       
                       ["Affected-internal-processes", "number"],
                       ["Moment-of-truth", "number"],
                       ["Pain-point", "number"],
                       ["Best-practice", "number"],
                       ["Customer-feeling", "text"],
                       ["Importance to customer", "text"],
                       ["Business-risk", "text"],
                       ["Market-potential-value", "number"],
                       ["Market-potential-currency", "text"],                       
                       ["Transformation-costs-value", "number"],                       
                       ["Transformation-costs-currency", "text"]]);
}