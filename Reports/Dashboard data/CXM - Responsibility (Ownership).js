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

var aOwnerTypes = [Constants.OT_ORG_UNIT,
                   Constants.OT_ORG_UNIT_TYPE,
                   Constants.OT_PERS,
                   Constants.OT_PERS_TYPE,
                   Constants.OT_POS,
                   Constants.OT_GRP,
                   Constants.OT_SYS_ORG_UNIT,
                   Constants.OT_SYS_ORG_UNIT_TYPE];

function LANDSCAPE(p_oJourneyLandscapeModel, p_aJourneys) {
    this.oModel = p_oJourneyLandscapeModel;
    this.aJourneys = p_aJourneys;
}

function JOURNEY(p_oJourneyObjDef, p_aJourneyMaps) {
    this.oObjDef = p_oJourneyObjDef;
    this.aJourneyMaps = p_aJourneyMaps;
}

function JOURNEYMAP(p_oJourneyMapModel, p_aOwners) {
    this.oModel = p_oJourneyMapModel;
    this.aOwners = p_aOwners;
}
                   
function OWNER(p_oOwnerObjDef, p_aTouchpoints) {
    this.oObjDef = p_oOwnerObjDef;
    this.aTouchpoints = p_aTouchpoints;
}

function TOUCHPOINT(p_oTouchpointObjDef) {
    this.oObjDef = p_oTouchpointObjDef;
}
                   
var nLoc = Context.getSelectedLanguage();

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

function getExpKey(landscape, owner) {
    return landscape.oModel.GUID() + "###" + owner.oObjDef.GUID();
}

function getExperienceOrder(aLandscapes, mapGoodExp, mapBadExp) {
    var mapLandscapesWithOwners = getLandscapesWithOwners();

    var iter = mapLandscapesWithOwners.keySet().iterator();
    while (iter.hasNext()) {
        var landscape = iter.next();
        var aAllOwners = mapLandscapesWithOwners.get(landscape);
        
        // Good experience
        fillMap(mapGoodExp, landscape, aAllOwners.sort(sortGoodExperience));
        // Bad experience
        fillMap(mapBadExp, landscape, aAllOwners.sort(sortBadExperience));
    }

    function fillMap(mapExp, landscape, aAllOwnersSorted) {
        var idx = Math.min(7, aAllOwnersSorted.length);
      
        for (var i in aAllOwnersSorted) {
            if (idx > 0) {
                mapExp.put(getExpKey(landscape, aAllOwnersSorted[i]), get2Digits(idx));
            }
            idx--;
        }
        
        function get2Digits(n){
            return (n > 9) ? "" + n : "0" + n;
        }
    }
    
    function sortGoodExperience(ownerA, ownerB) {
        return countPositiveCustomerFeelings(ownerB) - countPositiveCustomerFeelings(ownerA);   // sort descending
        
        function countPositiveCustomerFeelings(owner) {
            var aTouchpoints = owner.aTouchpoints;
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
        
    function sortBadExperience(ownerA, ownerB) {
        return countPainpoints(ownerB) - countPainpoints(ownerA);   // sort descending
        
        function countPainpoints(owner) {
            var aTouchpoints = owner.aTouchpoints;
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
    
    function getLandscapesWithOwners() {
        var mapLandscapesWithOwners = new java.util.HashMap();
        
        for (var i in aLandscapes) {
            var landscape = aLandscapes[i];
            var aAllOwners = new Array();
            
            var aJourneys = landscape.aJourneys;
            for (var j in aJourneys) {
                var aJourneyMaps = aJourneys[j].aJourneyMaps;
                for (var k in aJourneyMaps) {
                    var aOwners = aJourneyMaps[k].aOwners;
                    for (var m in aOwners) {
                        var owner = aOwners[m];
                        var aTouchpoints = owner.aTouchpoints;

                        var idx = getIndexInList(owner, aAllOwners);
                        if (idx < 0) {
                            // Not in list -> new entry
                            var aOwnerTouchpoints = new Array();    // (Ensure to have new array-object)
                            aAllOwners.push(new OWNER(owner.oObjDef, concatTouchPoints(aTouchpoints, aOwnerTouchpoints)));
                        } else {
                            // Owner-entry already exists -> update/concat touchpoints
                            var aOwnerTouchpoints = aAllOwners[idx].aTouchpoints;
                            aAllOwners[idx].aTouchpoints = concatTouchPoints(aTouchpoints, aOwnerTouchpoints);
                        }                            
                    }
                }
            }
            mapLandscapesWithOwners.put(landscape, aAllOwners);
        }
        return mapLandscapesWithOwners;
        
        function getIndexInList(item, aList) {
            for (var idx=0; idx < aList.length; idx++) {
                if (item.oObjDef.IsEqual(aList[idx].oObjDef)) return idx;
            }
            return -1;  // Not found in list
        }
        
        function concatTouchPoints(aTouchpoints, aOwnerTouchpoints) {
            for (var i in aTouchpoints) {
                var touchpoint = aTouchpoints[i];
                
                if (getIndexInList(touchpoint, aOwnerTouchpoints) < 0) {
                    // Not in list -> new entry
                    aOwnerTouchpoints.push(touchpoint);
                }
            }
            return aOwnerTouchpoints;
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

                var aOwners = new Array();                
                var oOwnerObjDefs = oJourneyMapModel.ObjDefListByTypes(aOwnerTypes);
                for (var m in oOwnerObjDefs) {
                    var oOwnerObjDef = oOwnerObjDefs[m];

                    var aTouchpoints = new Array();
                    var oTouchpointObjDefs = getConnectedTouchpoints(oJourneyMapModel, oOwnerObjDef);
                    for (var n in oTouchpointObjDefs) {
                        var oTouchpointObjDef = oTouchpointObjDefs[n];
                        
                        aTouchpoints.push(new TOUCHPOINT(oTouchpointObjDef))
                    }
                    aOwners.push(new OWNER(oOwnerObjDef, aTouchpoints));
                }
                aJourneyMaps.push(new JOURNEYMAP(oJourneyMapModel, aOwners));
            }
            aJourneys.push(new JOURNEY(oJourneyObjDef, aJourneyMaps));
        }
        aLandscapes.push(new LANDSCAPE(oJourneyLandscapeModel, aJourneys));
    }
    return aLandscapes;
    
    function getConnectedTouchpoints(oJourneyMapModel, oOwnerObjDef) {
        var oTouchpointObjDefs = new Array();
        
        var oOwnerObjOccs = oOwnerObjDef.OccListInModel(oJourneyMapModel);
        for (var i in oOwnerObjOccs) {
            var oOutCxns = oOwnerObjOccs[i].Cxns(Constants.EDGES_OUT);
            for (var j in oOutCxns) {
                var oOutCxn = oOutCxns[j];
                if (oOutCxn.CxnDef().TypeNum() != Constants.CT_OWNS_3) continue;
                
                var oTrgObjOcc = oOutCxn.TargetObjOcc();
                var oTrgObjDef = oTrgObjOcc.ObjDef();
                if (oTrgObjDef.TypeNum() != Constants.OT_CUSTOMER_TOUCHPOINT) continue;
                
                oTouchpointObjDefs.push(oTrgObjDef);
            }
        }
        return ArisData.Unique(oTouchpointObjDefs);
    }
}

function outHeader() {
    output.setColumns([["Customer-journey-landscape","text"],
                       ["Customer-journey-landscape-Guid","text"],
                       ["Customer-journey", "text"],
                       ["Customer-journey-Guid", "text"],
                       ["Customer-journey-map", "text"],
                       ["Customer-journey-map-Guid", "text"],
                       ["Owner", "text"],
                       ["Owner-Guid", "text"],
                       ["Good-experience-order", "text"],
                       ["Bad-experience-order", "text"],
                       ["Customer-touchpoint", "text"],
                       ["Customer-touchpoint-Guid", "text"],                       
                       ["Moment-of-truth", "number"],
                       ["Pain-point", "number"],
                       ["Best-practice", "number"],
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
    
            for (var k in aJourneyMaps) {
                var journeyMap = aJourneyMaps[k];
                var oJourneyMapModel = journeyMap.oModel;
                var aOwners = journeyMap.aOwners;
                
                for (var m in aOwners) {
                    var owner = aOwners[m]
                    var oOwnerObjDef = owner.oObjDef;
                    var aTouchpoints = owner.aTouchpoints;

                    if (aTouchpoints.length > 0) {
                        for (var n in aTouchpoints) {
                            touchpoint = aTouchpoints[n];
                            var oTouchpointObjDef = touchpoint.oObjDef;
    
                            output.addRow([oJourneyLandscapeModel.Name(nLoc),
                                           oJourneyLandscapeModel.GUID(),
                                           oJourneyObjDef.Name(nLoc),
                                           oJourneyObjDef.GUID(),
                                           oJourneyMapModel.Name(nLoc),
                                           oJourneyMapModel.GUID(),                                   
                                           oOwnerObjDef.Name(nLoc),
                                           oOwnerObjDef.GUID(),
                                           getExperience(landscape, owner, mapGoodExp),
                                           getExperience(landscape, owner, mapBadExp),
                                           oTouchpointObjDef.Name(nLoc),
                                           oTouchpointObjDef.GUID(),                                           
                                           getAttrValue(oTouchpointObjDef, Constants.AT_MOMENT_OF_TRUTH),
                                           getAttrValue(oTouchpointObjDef, Constants.AT_PAIN_POINT),
                                           getAttrValue(oTouchpointObjDef, Constants.AT_BEST_PRACTICE),
                                           getAttrValue(oTouchpointObjDef, Constants.AT_CUSTOMER_FEELING)]);
                        }
                    } else {
                        output.addRow([oJourneyLandscapeModel.Name(nLoc),
                                       oJourneyLandscapeModel.GUID(),
                                       oJourneyObjDef.Name(nLoc),
                                       oJourneyObjDef.GUID(),
                                       oJourneyMapModel.Name(nLoc),
                                       oJourneyMapModel.GUID(),                                   
                                       oOwnerObjDef.Name(nLoc),
                                       oOwnerObjDef.GUID(),
                                       getExperience(landscape, owner, mapGoodExp),
                                       getExperience(landscape, owner, mapBadExp),
                                       "",
                                       "",
                                       "",                                       
                                       "",
                                       "",
                                       ""]);
                    }
                }
            }
        }
    }
    
    function getAttrValue(oItem, nAttrType) {
        var oAttr = oItem.Attribute(nAttrType, nLoc);
        if (!oAttr.IsMaintained()) return "";
        
        return oAttr.getValue();
    }
    
    function getExperience(landscape, owner, mapExp) {
        var expKey = getExpKey(landscape, owner);
        
        if (!mapExp.containsKey(expKey)) return "";
        return mapExp.get(expKey);
    }
}