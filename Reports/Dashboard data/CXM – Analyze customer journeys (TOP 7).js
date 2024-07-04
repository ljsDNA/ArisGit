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

function LANDSCAPE(p_oJourneyLandscapeModel, p_aJourneys) {
    this.oModel = p_oJourneyLandscapeModel;
    this.aJourneys = p_aJourneys;
}

function JOURNEY(p_oJourneyObjDef, p_aJourneyMaps) {
    this.oObjDef = p_oJourneyObjDef;
    this.aJourneyMaps = p_aJourneyMaps;
}

function JOURNEYMAP(p_oJourneyMapModel, p_aTouchpoints) {
    this.oModel = p_oJourneyMapModel;
    this.aTouchpoints = p_aTouchpoints;
}

function TOUCHPOINT(p_oTouchpointObjDef) {
    this.oObjDef = p_oTouchpointObjDef;
}

function JOURNEY_TP(p_oJourneyObjDef, p_aTouchpoints) {
    this.oObjDef = p_oJourneyObjDef;
    this.aTouchpoints = p_aTouchpoints;
}

var nLoc = Context.getSelectedLanguage();
var oFilter = ArisData.ActiveFilter();

const outputParameters = new OutputParameters("");
const output = createXmlOutput(outputParameters);

outHeader();

var aLandscapes = getData();

var mapGoodExp = new java.util.HashMap();
var mapBadExp =  new java.util.HashMap();
getExperienceOrder(aLandscapes, mapGoodExp, mapBadExp);

outData(aLandscapes, mapGoodExp, mapBadExp);

uploadXmlOutputToADS(output, outputParameters);

/**************************************************************************************************************/

function getExpKey(landscape, journey) {
    return landscape.oModel.GUID() + "###" + journey.oObjDef.GUID();
}

function getExperienceOrder(aLandscapes, mapGoodExp, mapBadExp) {
    var mapLandscapesWithJourneys = getLandscapesWithJourneys();

    var iter = mapLandscapesWithJourneys.keySet().iterator();
    while (iter.hasNext()) {
        var landscape = iter.next();
        var aAllJourneys = mapLandscapesWithJourneys.get(landscape);
        
        // Good experience
        fillMap(mapGoodExp, landscape, aAllJourneys.sort(sortGoodExperience));
        // Bad experience
        fillMap(mapBadExp, landscape, aAllJourneys.sort(sortBadExperience));
    }

    function fillMap(mapExp, landscape, aAllJourneysSorted) {
        var idx = Math.min(7, aAllJourneysSorted.length);

        for (var i in aAllJourneysSorted) {
            if (idx > 0) {
                mapExp.put(getExpKey(landscape, aAllJourneysSorted[i]), get2Digits(idx));
            }
            idx--;
        }
        
        function get2Digits(n){
            return (n > 9) ? "" + n : "0" + n;
        }
    }
    
    function sortGoodExperience(journeyA, journeyB) {
        return countPositiveCustomerFeelings(journeyB) - countPositiveCustomerFeelings(journeyA);   // sort descending
        
        function countPositiveCustomerFeelings(journey) {
            var aTouchpoints = journey.aTouchpoints;
            if (aTouchpoints.length == 0) return 0;
            
            var nCount = 0;
            for (var i in aTouchpoints) {
                var oAttrCF = aTouchpoints[i].oObjDef.Attribute(Constants.AT_CUSTOMER_FEELING, nLoc);
                if (oAttrCF.IsMaintained() && oAttrCF.MeasureUnitTypeNum() == Constants.AVT_POSITIVE){
                    nCount ++;
                }
            }
            return nCount / aTouchpoints.length;
        } 
    }
        
    function sortBadExperience(journeyA, journeyB) {
        return countPainpoints(journeyB) - countPainpoints(journeyA);   // sort descending
        
        function countPainpoints(journey) {
            var aTouchpoints = journey.aTouchpoints;
            if (aTouchpoints.length == 0) return 0;

            var nCount = 0;
            for (var i in aTouchpoints) {
                if (isboolattributetrue(aTouchpoints[i].oObjDef, Constants.AT_PAIN_POINT, nLoc)) {
                    nCount ++;
                }
            }
            return nCount / aTouchpoints.length;
        } 
    }
    
    function getLandscapesWithJourneys() {
        var mapLandscapesWithJourneys = new java.util.HashMap();
        
        for (var i in aLandscapes) {
            var landscape = aLandscapes[i];
            var aAllJourneys = new Array();
            
            var aJourneys = landscape.aJourneys;
            for (var j in aJourneys) {
                var journey = aJourneys[j];
                var aJourneyTouchpoints = new Array();                
                
                var aJourneyMaps = journey.aJourneyMaps;
                for (var k in aJourneyMaps) {
                    var journeyMap = aJourneyMaps[k];
                    var aTouchpoints = journeyMap.aTouchpoints;
                    
                    aJourneyTouchpoints = concatTouchPoints(aTouchpoints, aJourneyTouchpoints);
                }
                aAllJourneys.push(new JOURNEY_TP(journey.oObjDef, aJourneyTouchpoints));
            }
            mapLandscapesWithJourneys.put(landscape, aAllJourneys);
        }
        return mapLandscapesWithJourneys;

        function getIndexInList(item, aList) {
            for (var idx=0; idx < aList.length; idx++) {
                if (item.oObjDef.IsEqual(aList[idx].oObjDef)) return idx;
            }
            return -1;  // Not found in list
        }        
        
        function concatTouchPoints(aTouchpoints, aJourneyTouchpoints) {
            for (var i in aTouchpoints) {
                var touchpoint = aTouchpoints[i];
                
                if (getIndexInList(touchpoint, aJourneyTouchpoints) < 0) {
                    // Not in list -> new entry
                    aJourneyTouchpoints.push(touchpoint)
                }
            }
            return aJourneyTouchpoints;
        }
    }    
}

function getData() {
    var aLandscapes = new Array();
    var oJourneyLandscapeModels = ArisData.getActiveDatabase().Find(Constants.SEARCH_MODEL, Constants.MT_CUSTOMER_JOURNEY_LANDSCAPE);
    for (var i in oJourneyLandscapeModels) {
        var oJourneyLandscapeModel = oJourneyLandscapeModels[i];
        
        var aJourneys = new Array();
        var oJourneyObjDefs = oJourneyLandscapeModel.ObjDefListByTypes([Constants.OT_CUSTOMER_JOURNEY]);
        for (var j in oJourneyObjDefs) {
            var oJourneyObjDef = oJourneyObjDefs[j];
            
            var aJourneyMaps = new Array();
            var oJourneyMapModels = oJourneyObjDef.AssignedModels(Constants.MT_CUSTOMER_JOURNEY_MAP);
            for (var k in oJourneyMapModels) {
                var oJourneyMapModel = oJourneyMapModels[k];

                var aTouchpoints = new Array();
                var oTouchpointObjDefs = oJourneyMapModel.ObjDefListByTypes([Constants.OT_CUSTOMER_TOUCHPOINT]);
                for (var t in oTouchpointObjDefs) {
                    var oTouchpointObjDef = oTouchpointObjDefs[t];
                    
                    aTouchpoints.push(new TOUCHPOINT(oTouchpointObjDef))
                }
                aJourneyMaps.push(new JOURNEYMAP(oJourneyMapModel, aTouchpoints));
            }
            aJourneys.push(new JOURNEY(oJourneyObjDef, aJourneyMaps));
        }
        aLandscapes.push(new LANDSCAPE(oJourneyLandscapeModel, aJourneys));
    }
    return aLandscapes;
}
            
        
function outHeader() {
    output.setColumns([["Customer-journey-landscape","text"],
                       ["Customer-journey-landscape-Guid", "text"],
                       ["Customer-journey", "text"],
                       ["Customer-journey-Guid", "text"],
                       ["Good-experience-order", "text"],
                       ["Bad-experience-order", "text"],
                       ["Customer-journey-map", "text"],
                       ["Customer-journey-map-Guid", "text"],
                       ["Customer touchpoint", "text"],
                       ["Customer touchpoint-Guid", "text"],
                       ["Pain-point", "number"],
                       ["Customer-feeling", "text"]]);
}

function outData(aLandscapes, mapGoodExp, mapBadExp) {
    for (var i in aLandscapes) {
        var landscape = aLandscapes[i]
        var oJourneyLandscapeModel = landscape.oModel;
        var aJourneys = landscape.aJourneys;
        
        for (var j in aJourneys) {
            var journey = aJourneys[j];
            var oJourneyObjDef = journey.oObjDef;
            var aJourneyMaps = journey.aJourneyMaps;
            var bOut = false;
    
            for (var k in aJourneyMaps) {
                var journeyMap = aJourneyMaps[k];
                var oJourneyMapModel = journeyMap.oModel;
                var aTouchpoints = journeyMap.aTouchpoints;

                for (var t in aTouchpoints) {
                    touchpoint = aTouchpoints[t];
                    var oTouchpointObjDef = touchpoint.oObjDef;

                    output.addRow([oJourneyLandscapeModel.Name(nLoc),
                                   oJourneyLandscapeModel.GUID(),
                                   oJourneyObjDef.Name(nLoc),
                                   oJourneyObjDef.GUID(),
                                   getExperience(landscape, journey, mapGoodExp),
                                   getExperience(landscape, journey, mapBadExp),
                                   oJourneyMapModel.Name(nLoc),
                                   oJourneyMapModel.GUID(),
                                   oTouchpointObjDef.Name(nLoc),
                                   oTouchpointObjDef.GUID(),
                                   getAttrValue(oTouchpointObjDef, Constants.AT_PAIN_POINT),
                                   getAttrValue(oTouchpointObjDef, Constants.AT_CUSTOMER_FEELING)]);
                   bOut = true;
                }
            }
            if (!bOut) {
                output.addRow([oJourneyLandscapeModel.Name(nLoc),
                               oJourneyLandscapeModel.GUID(),
                               oJourneyObjDef.Name(nLoc),
                               oJourneyObjDef.GUID(),
                               getExperience(landscape, journey, mapGoodExp),
                               getExperience(landscape, journey, mapBadExp),
                               "",
                               "",
                               "",
                               "",                               
                               "",
                               ""]);
            
            }
        }
    }
    
    function getExperience(landscape, journey, mapExp) {
        var expKey = getExpKey(landscape, journey);
        
        if (!mapExp.containsKey(expKey)) return "";
        return mapExp.get(expKey);
    }
    
     function getAttrValue(oItem, nAttrType) {
        var oAttr = oItem.Attribute(nAttrType, nLoc);
        if (!oAttr.IsMaintained()) return "";
        
        return oAttr.getValue();
    }
}