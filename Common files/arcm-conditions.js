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

 /* --------------------------------------------------------------- caching --------------------------------------------------------------------------- */

var g_hm_exportInfoCheck2Result = new java.util.HashMap(); // p_oExportInfoToCheck.sArisGuid + p_oCondition | Boolean (Java! - done by the framework automatically...)
var g_hm_modelCheck2Result = new java.util.HashMap();      // p_oModelToCheck.GUID() + p_oCondition | Boolean (Java! - done by the framework automatically...)
var g_hm_cxnCheck2Result = new java.util.HashMap();        // p_oCxnDefToCheck.GUID() + p_oCondition | Boolean (Java! - done by the framework automatically...)

function getCachedExportInfoCheckResult(p_oExportInfo, p_oCondition, p_oComparisonExportInfoToCheck, p_oParentMappingObject) {
    var bStoredJavaResult = g_hm_exportInfoCheck2Result.get( createExportInfoCacheKey(p_oExportInfo, p_oCondition, p_oComparisonExportInfoToCheck, p_oParentMappingObject) );
    if (bStoredJavaResult == null) {
        return null;
    } else {
        return bStoredJavaResult == java.lang.Boolean.TRUE;
    }
}
function storeCachedExportInfoCheckResult(p_oExportInfo, p_oCondition, p_oComparisonExportInfoToCheck, p_oParentMappingObject, bResult) {
    return g_hm_exportInfoCheck2Result.put( createExportInfoCacheKey(p_oExportInfo, p_oCondition, p_oComparisonExportInfoToCheck, p_oParentMappingObject), bResult );
}

function getCachedModelCheckResult(p_oModel, p_oCondition) {
    var bStoredJavaResult = g_hm_modelCheck2Result.get( createModelCacheKey(p_oModel, p_oCondition) );
    if (bStoredJavaResult == null) {
        return null;
    } else {
        return bStoredJavaResult == java.lang.Boolean.TRUE;
    }
}
function storeCachedModelCheckResult(p_oModel, p_oCondition, bResult) {
    return g_hm_modelCheck2Result.put( createModelCacheKey(p_oModel, p_oCondition), bResult );
}

function getCachedCxnCheckResult(p_oCxnDef, p_oCondition) {
    var bStoredJavaResult = g_hm_cxnCheck2Result.get( createCxnCacheKey(p_oCxnDef, p_oCondition) );
    if (bStoredJavaResult == null) {
        return null;
    } else {
        return bStoredJavaResult == java.lang.Boolean.TRUE;
    }
}
function storeCachedCxnCheckResult(p_oCxnDef, p_oCondition, bResult) {
    return g_hm_cxnCheck2Result.put( createCxnCacheKey(p_oCxnDef, p_oCondition), bResult );
}

function createExportInfoCacheKey(p_oExportInfo, p_oCondition, p_oComparisonExportInfoToCheck, p_oParentMappingObject) {
    var sKey = p_oExportInfo.sArisGuid + "|" + p_oCondition.iMappingNodeInternalID;
    if (p_oComparisonExportInfoToCheck != null) {sKey += "|" + p_oComparisonExportInfoToCheck.sArisGuid;}
    if (p_oParentMappingObject != null) {sKey += "|" + p_oParentMappingObject.iMappingNodeInternalID;}
    return sKey;
}
function createModelCacheKey(p_oModel, p_oCondition) {
    return p_oModel.GUID() + "|" + p_oCondition.iMappingNodeInternalID;
}
function createCxnCacheKey(p_oCxnDef, p_oCondition) {
    return p_oCxnDef.GUID() + "|" + p_oCondition.iMappingNodeInternalID;
}

 /* --------------------------------------------------------------- Level 5 --------------------------------------------------------------------------- */

/*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * Evaluates one given condition for one single ExportInfo in combination with one single comparison ExportInfo.
 *
 * If the condition is a non-operator conditions then is is evaluated by directly calling evaluateSingleExportInfoCondition() and returns the boolean result.
 * If the condition is a operator then the sub conditions are evaluated by calling evaluateSingleExportInfoCondition() each and combining the results by AND or OR.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
function evaluateExportInfoCondition(   p_oExportInfoToCheck,
                                        p_oCondition,
                                        p_oComparisonExportInfoToCheck,
                                        p_oComparisonMappingObjectNode) {
    
    // ask cache first
    var bResult = getCachedExportInfoCheckResult(p_oExportInfoToCheck, p_oCondition, p_oComparisonExportInfoToCheck, p_oComparisonMappingObjectNode);
    if (bResult != null) {
        return bResult;
    }
    
    // set the result in the cache to 'false' until evaluation is completed in order to prevent infinity loops for cyclic conditions
    bResult = false;
    storeCachedExportInfoCheckResult(p_oExportInfoToCheck, p_oCondition, p_oComparisonExportInfoToCheck, p_oComparisonMappingObjectNode, bResult);
    // start evaluation
    var sOperator = p_oCondition.getAttributeValue("operator");
    if (sOperator == null) {
        bResult = evaluateSingleExportInfoCondition(    p_oExportInfoToCheck,
                                                        p_oCondition,
                                                        p_oComparisonExportInfoToCheck,
                                                        p_oComparisonMappingObjectNode);
    }
    else {
        var bContinueSubEvaluation = true;
        var iterator = p_oCondition.getChildren("condition").iterator();
        // for "AND" operator we start with "true", for OR operator we start with "false"
        var bResult = sOperator == "AND";
        while (iterator.hasNext() && bContinueSubEvaluation) {
            var subCondition = iterator.next();
            var bSubResult = evaluateExportInfoCondition(   p_oExportInfoToCheck,
                                                            subCondition,
                                                            p_oComparisonExportInfoToCheck,
                                                            p_oComparisonMappingObjectNode);
            if (sOperator == "OR" && bSubResult) {
                bResult = bResult ||  bSubResult;
                if (bResult) {bContinueSubEvaluation = false;}
            };
            if (sOperator == "AND" && !bSubResult) {
                bResult = bResult &&  bSubResult;
                if (!bResult) {bContinueSubEvaluation = false;}
            };
        }
    }
    
    // store the evaluated result in the cache and return it
    storeCachedExportInfoCheckResult(p_oExportInfoToCheck, p_oCondition, p_oComparisonExportInfoToCheck, p_oComparisonMappingObjectNode, bResult);
    return bResult;
}

/*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * Evaluates one given condition for one single model.
 *
 * If the condition is a non-operator conditions then is is evaluated by directly calling evaluateSingleModelCondition() and returns the boolean result.
 * If the condition is a operator then the sub conditions are evaluated by calling evaluateSingleModelCondition() each and combining the results by AND or OR.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
function evaluateModelCondition(    p_oModelToCheck,
                                    p_oCondition) {
    
    // ask cache first
    var bResult = getCachedModelCheckResult(p_oModelToCheck, p_oCondition);
    if (bResult != null) {
        return bResult;
    }
    
    // set the result in the cache to 'false' until evaluation is completed in order to prevent infinity loops for cyclic conditions
    bResult = false;
    storeCachedModelCheckResult(p_oModelToCheck, p_oCondition, bResult);
    // start evaluation
    var sOperator = p_oCondition.getAttributeValue("operator");
    if (sOperator == null) {
        bResult = evaluateSingleModelCondition( p_oModelToCheck,
                                                p_oCondition);
    }
    else {
        var bContinueSubEvaluation = true;
        var iterator = p_oCondition.getChildren("condition").iterator();
        // for "AND" operator we start with "true", for OR operator we start with "false"
        var bResult = sOperator == "AND";
        while (iterator.hasNext() && bContinueSubEvaluation) {
            var subCondition = iterator.next();
            var bSubResult = evaluateModelCondition(p_oModelToCheck,
                                                    subCondition);
            if (sOperator == "OR" && bSubResult) {
                bResult = bResult ||  bSubResult;
                if (bResult) {bContinueSubEvaluation = false;}
            };
            if (sOperator == "AND" && !bSubResult) {
                bResult = bResult &&  bSubResult;
                if (!bResult) {bContinueSubEvaluation = false;}
            };
        }
    }
    
    // store the evaluated result in the cache and return it
    storeCachedModelCheckResult(p_oModelToCheck, p_oCondition, bResult);
    return bResult;
}

/*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * Evaluates one given condition for one single CxnDef.
 *
 * If the condition is a non-operator conditions then is is evaluated by directly calling evaluateSingleConnectionCondition() and returns the boolean result.
 * If the condition is a operator then the sub conditions are evaluated by calling evaluateSingleConnectionCondition() each and combining the results by AND or OR.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
function evaluateConnectionCondition(   p_oCxnDefToCheck,
                                        p_oCondition) {
    
    // ask cache first
    var bResult = getCachedCxnCheckResult(p_oCxnDefToCheck, p_oCondition);
    if (bResult != null) {
        return bResult;
    }
    
    // set the result in the cache to 'false' until evaluation is completed in order to prevent infinity loops for cyclic conditions
    bResult = false;
    storeCachedCxnCheckResult(p_oCxnDefToCheck, p_oCondition, bResult);
    // start evaluation
    var sOperator = p_oCondition.getAttributeValue("operator");
    if (sOperator == null) {
        bResult = evaluateSingleConnectionCondition(p_oCxnDefToCheck,
                                                    p_oCondition);
    }
    else {
        var bContinueSubEvaluation = true;
        var iterator = p_oCondition.getChildren("condition").iterator();
        // for "AND" operator we start with "true", for OR operator we start with "false"
        var bResult = sOperator == "AND";
        while (iterator.hasNext() && bContinueSubEvaluation) {
            var subCondition = iterator.next();
            var bSubResult = evaluateConnectionCondition(   p_oCxnDefToCheck,
                                                            subCondition);
            if (sOperator == "OR" && bSubResult) {
                bResult = bResult ||  bSubResult;
                if (bResult) {bContinueSubEvaluation = false;}
            };
            if (sOperator == "AND" && !bSubResult) {
                bResult = bResult &&  bSubResult;
                if (!bResult) {bContinueSubEvaluation = false;}
            };
        }
    }
    
    // store the evaluated result in the cache and return it
    storeCachedCxnCheckResult(p_oCxnDefToCheck, p_oCondition, bResult);
    return bResult;
}

 /* --------------------------------------------------------------- Level 4 --------------------------------------------------------------------------- */

/*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * Evaluates one given single condition for one single ExportInfo in combination with one single comparison ExportInfo:
 *      - the given ExportInfoToCheck specifies what ExportInfo ObjDef the condition refers to
 *      - the given Condition XML element specified the kind of condition
 *      - the given comparison ExportInfoToCheck specifies where to read dynamic comparison values from in case the conditions specifies these
 *
 * Returns true if the condition is fulfilled, otherwise false.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
function evaluateSingleExportInfoCondition( p_oExportInfoToCheck,
                                            p_oCondition,
                                            p_oComparisonExportInfoToCheck,
                                            p_oComparisonMappingObjectNode) {
    
    var oExportInfo = p_oExportInfoToCheck;
    var oMappingObjectNode = getMappingObjectByID(oExportInfo.sMappingObjectID);
    
    var oComparisonExportInfo = null;
    var oComparisonMappingObjectNode = null;
    if (p_oComparisonExportInfoToCheck != null) {
        oComparisonExportInfo = p_oComparisonExportInfoToCheck;
        oComparisonMappingObjectNode = p_oComparisonMappingObjectNode;
    } else {
        oComparisonExportInfo = oExportInfo;
        oComparisonMappingObjectNode = oMappingObjectNode;
    }
    
    var sAttrID = p_oCondition.getAttributeValue("mapping_attribute_ref");
	var sAttrType = p_oCondition.getAttributeValue("type");
	var sAttrTypeNum = p_oCondition.getAttributeValue("aris_typenum");
    var sLinkID = p_oCondition.getAttributeValue("mapping_link_ref");
	var sMode = p_oCondition.getAttributeValue("mode");
	var sStaticComparisonValue = p_oCondition.getAttributeValue("value");
	var sStaticMinComparisonValue = p_oCondition.getAttributeValue("min_value");
	var sStaticMaxComparisonValue = p_oCondition.getAttributeValue("max_value");
	var sComparisonAttrID = p_oCondition.getAttributeValue("comparison_mapping_attribute_ref");
	var sComparisonAttrType = p_oCondition.getAttributeValue("comparison_type");
	var sComparisonAttrTypeNum = p_oCondition.getAttributeValue("comparison_aris_typenum");
	
    if (sMode != "COUNT" && sMode != "COUNT_BACK") {
        //evaluate the condition on a mapping attribute reference
        return evaluateSingleCondition( oExportInfo,
                                        null,
                                        null,
                                        sAttrID, sAttrType, sAttrTypeNum,
                                        oComparisonMappingObjectNode,
                                        sMode,
                                        sStaticComparisonValue, sStaticMinComparisonValue, sStaticMaxComparisonValue,
                                        oComparisonExportInfo,
                                        sComparisonAttrID, sComparisonAttrType, sComparisonAttrTypeNum);
    }
    else if (sMode == "COUNT" || sMode == "COUNT_BACK") {
        //evaluate the condition on a mapping link reference
        return evaluateSingleCondition( oExportInfo,
                                        null,
                                        null,
                                        sLinkID, null, null,
                                        oComparisonMappingObjectNode,
                                        sMode,
                                        sStaticComparisonValue, sStaticMinComparisonValue, sStaticMaxComparisonValue,
                                        oComparisonExportInfo,
                                        sComparisonAttrID, sComparisonAttrType, sComparisonAttrTypeNum);
    }
    
}


/*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * Evaluates one given single condition for one single model:
 *      - the given ModelToCheck specifies what ARIS Model the condition refers to
 *      - the given Condition XML element specified the kind of condition
 *
 * Returns true if the condition is fulfilled, otherwise false.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
function evaluateSingleModelCondition(  p_oModelToCheck,
                                        p_oCondition) {
    var sAttrType = p_oCondition.getAttributeValue("type");
	var sAttrTypeNum = p_oCondition.getAttributeValue("aris_typenum");
	var sMode = p_oCondition.getAttributeValue("mode");
	var sStaticComparisonValue = p_oCondition.getAttributeValue("value");
	var sStaticMinComparisonValue = p_oCondition.getAttributeValue("min_value");
	var sStaticMaxComparisonValue = p_oCondition.getAttributeValue("max_value");
	
    //compare to static values only
    return evaluateSingleCondition( null,
                                    p_oModelToCheck,
                                    null,
                                    null, sAttrType, sAttrTypeNum,
                                    null,
                                    sMode,
                                    sStaticComparisonValue, sStaticMinComparisonValue, sStaticMaxComparisonValue,
                                    null,
                                    null, null, null);
}


/*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * Evaluates one given single condition for one single CxnDef:
 *      - the given CxnDef specifies what ARIS Connection the condition refers to
 *      - the given Condition XML element specified the kind of condition
 *
 * Returns true if the condition is fulfilled, otherwise false.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
function evaluateSingleConnectionCondition( p_oCxnDefToCheck,
                                            p_oCondition) {

    var sAttrType = p_oCondition.getAttributeValue("type");
	var sAttrTypeNum = p_oCondition.getAttributeValue("aris_typenum");
	var sMode = p_oCondition.getAttributeValue("mode");
    var sStaticComparisonValue = p_oCondition.getAttributeValue("value");
	var sStaticMinComparisonValue = p_oCondition.getAttributeValue("min_value");
	var sStaticMaxComparisonValue = p_oCondition.getAttributeValue("max_value");
    
    //compare to static values only
    return evaluateSingleCondition( null,
                                    null,
                                    p_oCxnDefToCheck,
                                    null, sAttrType, sAttrTypeNum,
                                    null,
                                    sMode,
                                    sStaticComparisonValue, sStaticMinComparisonValue, sStaticMaxComparisonValue,
                                    null,
                                    null, null, null);                            
}

/* --------------------------------------------------------------- Level 3 --------------------------------------------------------------------------- */

/*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * Evaluates one single condition:
 *      - the given ExportInfoToCheck or the given ModelToCheck specify what ARIS item the condition refers to (ObjDef or Model)
 *      - the attribute ID or the combination of attribute type and type num specify which attribute is to check at the referred ARIS item
 *      - the parent MappingObject in case the attribute refers to an incoming MappingLink from this parent 
 *      - the mode specifies the comparison mode
 *      - the static comparison value or the combination of static comparison min/max value specify if the condition is evaluated against this fixed values
 *      - the comparison ExportInfo and the comparison inheritance model specify if condition is evaluated against dynamic values from another ARIS item (ObjDef or Model)
 *      - the comparison attribute ID or the combination of comparison attribute type and type num specify which attribute is to check at the referred comparison ARIS item
 *
 * Returns true if the condition is fulfilled, otherwise false.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/

function evaluateSingleCondition(p_oExportInfoToCheck,
                                 p_oModelToCheck,
                                 p_oCxnDefToCheck,
                                 p_sAttrOrLinkID, p_sAttrType, p_sAttrTypeNum,
                                 p_oComparisonMappingObjectNode,
                                 p_sMode,
                                 p_sStaticComparisonValue, p_sStaticMinComparisonValue, p_sStaticMaxComparisonValue,
                                 p_oComparisonExportInfo,
                                 p_sComparisonAttrID, p_sComparisonAttrType, p_sComparisonAttrTypeNum) {
    //---- read value
    var sAttrType = null;
    var sAttrTypeNum = null;
    var sAttrDefaultValue = null;
    if (p_oExportInfoToCheck != null) {
        var aResolvedAttrInfo = determineAttrTypeAndAttrTypeNum(p_oExportInfoToCheck, p_sAttrOrLinkID, p_sAttrType, p_sAttrTypeNum);
        sAttrType = aResolvedAttrInfo[0];
        sAttrTypeNum = aResolvedAttrInfo[1];
        sAttrDefaultValue = aResolvedAttrInfo[2];
    } else {
        sAttrType = p_sAttrType;
        sAttrTypeNum = p_sAttrTypeNum;
    }
    
    var oValue = readValueByAttributeParams(p_oExportInfoToCheck,
                                            p_oModelToCheck,
                                            p_oCxnDefToCheck,
                                            p_sAttrOrLinkID, sAttrType, sAttrTypeNum, sAttrDefaultValue,
                                            p_sMode); 
    
    //---- read comparison value
    var sComparisonAttrType = null;
    var sComparisonAttrTypeNum = null;
    var sComparisonAttrDefaultValue = null;
    if (p_oComparisonExportInfo != null) {
        aResolvedComparisonAttrInfo = determineAttrTypeAndAttrTypeNum(p_oComparisonExportInfo, p_sComparisonAttrID, p_sComparisonAttrType, p_sComparisonAttrTypeNum);
        sComparisonAttrType = aResolvedComparisonAttrInfo[0];
        sComparisonAttrTypeNum = aResolvedComparisonAttrInfo[1];
        sComparisonAttrDefaultValue = aResolvedComparisonAttrInfo[2];
    }

    var oComparisonValue = readComparisonValue(p_sMode,
                                               p_oComparisonMappingObjectNode,
                                               sAttrType, p_sStaticComparisonValue, p_sStaticMinComparisonValue, p_sStaticMaxComparisonValue,
                                               p_oComparisonExportInfo,
                                               p_sComparisonAttrID, sComparisonAttrType, sComparisonAttrTypeNum, sComparisonAttrDefaultValue);
    
    //---- perform base check and return result
    return performBaseCheck(oValue, p_sMode, oComparisonValue);
}

/* --------------------------------------------------------------- Level 2 --------------------------------------------------------------------------- */

/*-------------------------------------------------------------------------------------------------------------------------------------------
 * Reads the value to check:
 *  - from a static value OR
 *  - from static min / max values OR
 *  - from the given ExportInfo, based on the attribute ID or the combination of attribute type and type num
 *
 * Returns a value whose type is based on the given attribute type:
 *      - "String", "Text" => original String
 *      - "Number", "Date" => Long by parsing the original String
 *      - "Double" => "Double" by parsing the original String
 *      - "Boolean" => "Boolean" by parsing the original String
 *      - "Enum..." => ArrayList<String> by splitting the comma-separated String of enum item IDs
 --------------------------------------------------------------------------------------------------------------------------------------------*/
function readValueByAttributeParams(p_oExportInfoToCheck,
                                    p_oModelToCheck,
                                    p_oCxnDefToCheck,
                                    p_sAttrOrLinkID, p_sResolvedAttrType, p_sResolvedAttrTypeNum, p_sAttrDefaultValue,
                                    p_sMode) {
    
    var oValue = null;
    
    if ((p_sMode == "COUNT" || p_sMode == "COUNT_BACK") && p_oExportInfoToCheck != null) {
        var oMappingObjectNode = getMappingObjectByID(p_oExportInfoToCheck.sMappingObjectID);
        var oMappingLinkNode = getMappingLink(oMappingObjectNode, p_sAttrOrLinkID);
        //"COUNT" 
        if (p_sMode == "COUNT") {
            oValue = getConnectedObjectsByMapping(p_oExportInfoToCheck.getObjDef(), oMappingLinkNode, false).length;
        }
        //"COUNT_BACK" 
        else {
            oValue = getConnectedObjectsByMapping(p_oExportInfoToCheck.getObjDef(), oMappingLinkNode, true).length;
        }
        
    } 
    //all others -> attr or mappingAttr
    else {
        var sValue = null;
        //---- read value from ExportInfo's ObjDef to check
        if (p_oExportInfoToCheck != null) {
            sValue = getAttrValue(p_oExportInfoToCheck, p_sResolvedAttrTypeNum, p_sResolvedAttrType, null, p_sAttrDefaultValue); //ignore MODELNAME and MODELGUID mappings...
        }
        //---- read value from model to check
        else if (p_oModelToCheck != null) {
            sValue = getAttrValue(p_oModelToCheck, p_sResolvedAttrTypeNum, p_sResolvedAttrType, null, p_sAttrDefaultValue); //ignore MODELNAME and MODELGUID mappings...
        }
        //---- read value from CxnDef to check
        else if (p_oCxnDefToCheck != null) {
            sValue = getAttrValue_Default(p_oCxnDefToCheck, p_sResolvedAttrTypeNum, p_sResolvedAttrType);
        }
        
        //---- parse String values
        oValue = convertStringValueForCondition(sValue, p_sResolvedAttrType);
    }
    
    return oValue;
}


/*-------------------------------------------------------------------------------------------------------------------------------------------
 * Reads the comparison value:
 *  - from a static value OR
 *  - from static min / max values OR
 *  - from the given conparison ExportInfo, based on the comparison attribute ID or the combination of comparison attribute type and type num
 *
 * For modes COUNT and COUNT_BACK the comparison value type is "Number", p_sAttrType is ignored in this case.
 * 
 * Returns a value whose type is based on the given attribute type:
 *      - "String", "Text" => original String
 *      - "Number", "Date" => Long by parsing the original String
 *      - "Double" => "Double" by parsing the original String
 *      - "Boolean" => "Boolean" by parsing the original String
 *      - "Enum..." => ArrayList<String> by splitting the comma-separated String of enum item IDs
 --------------------------------------------------------------------------------------------------------------------------------------------*/
function readComparisonValue(p_sMode,
                             p_oComparisonMappingObjectNode,
                             p_sAttrType, p_sStaticComparisonValue, p_sStaticMinComparisonValue, p_sStaticMaxComparisonValue,
                             p_oComparisonExportInfo,
                             p_sComparisonAttrID, p_sComparisonAttrType, p_sComparisonAttrTypeNum, p_sComparisonAttrDefaultValue) {

    var sAttrType = p_sAttrType;
    if (p_sMode == "COUNT" || p_sMode == "COUNT_BACK") {
        sAttrType = "Number";
    }
    var oComparisonValue = null;
    
    if (p_sMode == "PROCESSINGTIME" && p_oComparisonExportInfo != null) {
        
        var oMappingAttrStartDateNode = getMappingAttr(p_oComparisonMappingObjectNode, "plannedstartdate");
        var oMappingAttrEndDateNode = getMappingAttr(p_oComparisonMappingObjectNode, "plannedenddate");
        
        if (oMappingAttrStartDateNode != null && oMappingAttrEndDateNode != null) {
            var sStartAttrTypeNum = oMappingAttrStartDateNode.getAttributeValue("aris_typenum");
            var sStartAttrType = oMappingAttrStartDateNode.getAttributeValue("type");
            var sEndAttrTypeNum = oMappingAttrEndDateNode.getAttributeValue("aris_typenum");
            var sEndAttrType = oMappingAttrEndDateNode.getAttributeValue("type");
            
            if (sStartAttrTypeNum != null && sStartAttrType != null && sEndAttrTypeNum != null && sEndAttrType != null) { 
                var sStartDateValue = sStartDateValue = getAttrValue(p_oComparisonExportInfo, sStartAttrTypeNum, sStartAttrType, null, null);
                var oStartDateValue = null;
                var sEndDateValue = sEndDateValue = getAttrValue(p_oComparisonExportInfo, sEndAttrTypeNum, sEndAttrType, null, null);
                var oEndDateValue = null;

                if (sStartDateValue != "" && sEndDateValue != "") {
                    oStartDateValue = convertStringValueForCondition(sStartDateValue, sAttrType);
                    oEndDateValue = convertStringValueForCondition(sEndDateValue, sAttrType);
                    if (oStartDateValue != null && oEndDateValue != null) {
                        oComparisonValue = oEndDateValue - oStartDateValue;
                    }
                }
            }
        }
    }
    else if (p_sStaticComparisonValue != null) {
        oComparisonValue = convertStringValueForCondition(p_sStaticComparisonValue, sAttrType);
    }
    else if (p_sStaticMinComparisonValue != null || p_sStaticMaxComparisonValue != null) {
        oComparisonValue = new java.util.ArrayList();
        oComparisonValue.add( convertStringValueForCondition(p_sStaticMinComparisonValue, sAttrType) );
        oComparisonValue.add( convertStringValueForCondition(p_sStaticMaxComparisonValue, sAttrType) );
    }
    else if (p_oComparisonExportInfo != null) {
        oComparisonValue = readValueByAttributeParams(  p_oComparisonExportInfo,
                                                        null,
                                                        null,
                                                        p_sComparisonAttrID, p_sComparisonAttrType, p_sComparisonAttrTypeNum, p_sComparisonAttrDefaultValue,
                                                        p_sMode);
    }
 
    return oComparisonValue;
}


/*---------------------------------------------------------------------------------------------------   
    Converts the String results of the getAttrValue() call results based on the given attribute type:
        - "String", "Text" => original String
        - "Number", "Date" => Long by parsing the original String
        - "Double" => "Double" by parsing the original String
        - "Boolean" => "Boolean" by parsing the original String
        - "Enum..." => ArrayList<String> by splitting the comma-separated String of enum item IDs
/*---------------------------------------------------------------------------------------------------*/
function convertStringValueForCondition(p_sValue, p_sAttrType) { 
    var result = null;
    if (p_sValue == null || p_sValue == "" ||p_sAttrType == null) {
        return null;
    }
    
    if (valuesAreEqual(p_sAttrType, "String") || valuesAreEqual(p_sAttrType, "Text")) {
        result = new java.lang.String(p_sValue);
    }
    else if (valuesAreEqual(p_sAttrType, "Number") || valuesAreEqual(p_sAttrType, "Date")) {
        result = new java.lang.Long(p_sValue);
    } 
    else if (valuesAreEqual(p_sAttrType, "Double")) {
        result = new java.lang.Double(p_sValue);
    }
    else if (valuesAreEqual(p_sAttrType, "Boolean")) {
        result = new java.lang.Boolean(p_sValue);
    }
    else if (valuesAreEqual(new String(p_sAttrType).substring(0,4), "Enum")) {
        var aItems = p_sValue.split(",");
        result = new java.util.ArrayList();
        for (var s=0; s<aItems.length; s++) {
            result.add(aItems[s]);
        }
    }
    
    return result;
}


/*-------------------------------------------------------------------------------------------------------------------------
    Helper method to derive attr type, attr type num and default value from attribute mappings.
    Returns an JS Array with:
        - index 0: attrType as String
        - index 1: attrTypeNum as String
        - index 2: default value as String
-------------------------------------------------------------------------------------------------------------------------*/
function determineAttrTypeAndAttrTypeNum(p_oExportInfo, p_sAttrID, p_sAttrType, p_sAttrTypeNum) {
    var oMappingObjectNode = null;
    if (p_oExportInfo != null) {
        var sMappingObjectID = p_oExportInfo.sMappingObjectID;
        var oMappingObjectNode = getMappingObjectByID(sMappingObjectID);
    }
    return determineAttrTypeAndAttrTypeNumByObjectMapping(oMappingObjectNode, p_sAttrID, p_sAttrType, p_sAttrTypeNum);
}


/*-------------------------------------------------------------------------------------------------------------------------
    Helper method to derive attr type, attr type num and default value from attribute mappings.
    Returns an JS Array with:
        - index 0: attrType as String
        - index 1: attrTypeNum as String
        - index 2: default value as String
-------------------------------------------------------------------------------------------------------------------------*/
function determineAttrTypeAndAttrTypeNumByObjectMapping(p_oMappingObjectNode, p_sAttrID, p_sAttrType, p_sAttrTypeNum) {
    var sAttrType = p_sAttrType;
    var sAttrTypeNum = p_sAttrTypeNum;
    var sAttrDefaultValue = null;
    
    if (p_oMappingObjectNode != null) {
        if (sAttrType == null || sAttrTypeNum == null) {
            var oMappingAttrNode = getMappingAttr(p_oMappingObjectNode, p_sAttrID);
            if (oMappingAttrNode != null) {
                sAttrTypeNum = oMappingAttrNode.getAttributeValue("aris_typenum");
                sAttrType = oMappingAttrNode.getAttributeValue("type");
                sAttrDefaultValue = oMappingAttrNode.getAttributeValue("default_value");
            }
        }
    }
    
    var aResult = new Array();
    aResult.push(sAttrType);
    aResult.push(sAttrTypeNum);
    aResult.push(sAttrDefaultValue);
    return aResult;
}


/* --------------------------------------------------------------- Level 1 --------------------------------------------------------------------------- */

/*-------------------------------------------------------------------------------------------------------------------------
    Returns a boolen whether the check is fulfilled for the given value(s), compaorison mode and comparison value(s).
    If p_oValue is null or an empty ArrayList then the result is false for all modes.
    If p_oComparisonValue is null or an empty ArrayList then the result is false for all modes except ISNOTNULL.
    
    performBaseCheck: Accepted types and values
    -------------------------------------------
    
    type                                    -   mode            -   comparison type
    ---------------------------------------------------------------------------------
    String, Enum, Number, Double, Date      -   ISNOTNULL       -   <ignored>
    String, Number, Double, Date            -   EQ              -   String, Number, Double, Date
    String, Number, Double, Date            -   NEQ             -   String, Number, Double, Date
    Number, Double, Date                    -   GE              -   Number, Double, Date
    Number, Double, Date                    -   GT              -   Number, Double, Date
    Number, Double, Date                    -   LE              -   Number, Double, Date
    Number, Double, Date                    -   LT              -   Number, Double, Date
    String, Enum                            -   CONTAINS        -   String, Enum
    String, Enum                            -   CONTAINSNOT     -   String, Enum
    Number, Double, Date                    -   RANGE           -   Number, Double, Date (min_value, max_value)
    Number                                  -   COUNT           -   Number (min_value, max_value)     => correpsonds to RANGE
    Number                                  -   COUNT_BACK      -   Number (min_value, max_value)     => correpsonds to RANGE
    Number                                  -   PROCESSINGTIME  -   Number      => correpsonds to LE
    
    the values must be passed converted based on the types:
    -------------------------------------------------------
    String -> String
    Enum -> ArrayList<String>
    Number -> Long
    Date -> Long
    Double -> Double
-------------------------------------------------------------------------------------------------------------------------*/
function performBaseCheck(p_oValue, p_sMode, p_oComparisonValue) {
    if (p_oValue == null || (p_oValue instanceof java.util.ArrayList && p_oValue.size() == 0)) {
        return false;
    }
    if (p_sMode != "ISNOTNULL" && (p_oComparisonValue == null || (p_oComparisonValue instanceof java.util.ArrayList && p_oComparisonValue.size() == 0))) {
        return false;
    }
    
    var result = false;
    if (p_sMode == "ISNOTNULL") {
        result = p_oValue != null;
    } else if (p_sMode == "EQ") {
        //if lists: compare size and elements
        if (p_oValue instanceof java.util.ArrayList && p_oComparisonValue instanceof java.util.ArrayList) {
            result = p_oValue.size() == p_oComparisonValue.size() && p_oValue.containsAll(p_oComparisonValue);
        }
        //if no lists: compare values
        else if (!(p_oValue instanceof java.util.ArrayList) && !(p_oComparisonValue instanceof java.util.ArrayList)) {
            result = p_oValue == p_oComparisonValue;
        }
        //if one is list and the other not: invalid - result stays false
    } else if (p_sMode == "NEQ") {
        //if lists: compare size and elements
        if (p_oValue instanceof java.util.ArrayList && p_oComparisonValue instanceof java.util.ArrayList) {
            result = p_oValue.size() != p_oComparisonValue.size() || !p_oValue.containsAll(p_oComparisonValue);
        }
        //if no lists: compare values
        else if (!(p_oValue instanceof java.util.ArrayList) && !(p_oComparisonValue instanceof java.util.ArrayList)) {
            result = p_oValue != p_oComparisonValue;
        }
        //if one is list and the other not: invalid - result stays false
    } else if (p_sMode == "GE") {
        result = p_oValue >= p_oComparisonValue;
    } else if (p_sMode == "GT") {
        result = p_oValue > p_oComparisonValue;
    } else if (p_sMode == "LE") {
        result = p_oValue <= p_oComparisonValue;
    } else if (p_sMode == "LT") {
        result = p_oValue < p_oComparisonValue;
    } else if (p_sMode == "CONTAINS") {
        //if lists: compare size and elements
        if (p_oValue instanceof java.util.ArrayList && p_oComparisonValue instanceof java.util.ArrayList) {
            result = p_oValue.containsAll(p_oComparisonValue);
        }
        //if Strings: compare these Strings
        else if (p_oValue instanceof java.lang.String && p_oComparisonValue instanceof java.lang.String) {
            result = p_oValue.indexOf(p_oComparisonValue) != -1;
        }
        //if one is list and the other not: invalid - result stays false
    } else if (p_sMode == "CONTAINSNOT") {
        //if lists: compare size and elements
        if (p_oValue instanceof java.util.ArrayList && p_oComparisonValue instanceof java.util.ArrayList) {
            result = !p_oValue.containsAll(p_oComparisonValue);
        }
        //if Strings: compare these Strings
        else if (p_oValue instanceof java.lang.String && p_oComparisonValue instanceof java.lang.String) {
            result = p_oValue.indexOf(p_oComparisonValue) == -1;
        }
        //if one is list and the other not: invalid - result stays false
    } else if (p_sMode == "RANGE" || p_sMode == "COUNT" || p_sMode == "COUNT_BACK") {
        //comparison value must be list with 2 elements
        if (p_oComparisonValue instanceof java.util.ArrayList && (p_oComparisonValue.get(0) != null || p_oComparisonValue.get(1) != null)) {
            result = (p_oComparisonValue.get(0) == null || p_oValue >= p_oComparisonValue.get(0))
                    && (p_oComparisonValue.get(1) == null || p_oValue <= p_oComparisonValue.get(1))
        }
        //if comparison value is no such list: invalid - result stays false
    } else if (p_sMode == "PROCESSINGTIME") {
        result = p_oValue <= p_oComparisonValue;
    }

    return result;
}

/* --------------------------------------------------------- SearchItem creation --------------------------------------------------------------------- */

/*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * Translates a group of condition into a single AND-combined SearchItem.
 * Only those SearchItems are considered which fulfill the requirements described at translateConditionToSearchItem(), all others are ignored.
 * Returns the combined SearchItem or null if either no conditions were passed or none of them qualified.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
function translateConditionsToSearchItem(p_oMappingObjectNode, p_oConditionNodesList, p_oDatabase) {
    if (p_oConditionNodesList == null) {return null;}
    var result = null;
    var iter = p_oConditionNodesList.iterator();
    while (iter.hasNext()) {
        var oConditionNode = iter.next();
        var oSearchItem = translateSingleConditionToSearchItem(p_oMappingObjectNode, oConditionNode, p_oDatabase);
        if (oSearchItem != null) {
            if (result == null) {
                result = oSearchItem;
            } else {
                result = result.and(oSearchItem);
            }
        }
    }
    return result;
}

/*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * Translates a condition into a SearchItem if:
 *  - the conditions references an ObjDef attribute ("mapping_attribute_ref" or "type"/"aris_typenum" are set - "mapping_link_ref" is not set)
 *  - the comparison value is static value ("value" or "min_value"/"max_value" are set)
 *  - the comparison value is not dynamic ("comparison_mapping_attribute_ref", "comparison_type", "comparison_aris_typenum" are not set)
 *  - the comparison mode is one of "ISNOTNULL", "EQ", "NEQ", "GT", "GE", "LT", "LE", "RANGE", "CONTAINS", "CONTAINSNOT"
 * Returns the SearchItem if the condition fulfills the requirements above, otherwise null.
 *
 * Also see: http://sbrgsaapp1.eur.ad.sag/abs/help/en/script/ba/index.htm#report_OBJECTS_Database_createsearchitem1.htm
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
function translateSingleConditionToSearchItem(p_oMappingObjectNode, p_oConditionNode, p_oDatabase) {
    
    var oSearchItem = null;
    
    var sAttrRef = p_oConditionNode.getAttributeValue("mapping_attribute_ref");
    var sAttrType = p_oConditionNode.getAttributeValue("type");
	var sAttrTypeNum = p_oConditionNode.getAttributeValue("aris_typenum");
    var sLinkRef = p_oConditionNode.getAttributeValue("mapping_link_ref");
	var sMode = p_oConditionNode.getAttributeValue("mode");
    var sStaticComparisonValue = p_oConditionNode.getAttributeValue("value");
	var sStaticMinComparisonValue = p_oConditionNode.getAttributeValue("min_value");
	var sStaticMaxComparisonValue = p_oConditionNode.getAttributeValue("max_value");
    var sComparisonAttrRef = p_oConditionNode.getAttributeValue("comparison_mapping_attribute_ref");
    var sComparisonType = p_oConditionNode.getAttributeValue("comparison_type");
    var sComparisonAttrTypeNum = p_oConditionNode.getAttributeValue("comparison_aris_typenum");
    
    var bAttrRefSet = sAttrRef != null || (sAttrType != null && sAttrTypeNum != null);
    var bLinkRefSet = sLinkRef != null;
    var bStaticValueSet = sStaticComparisonValue != null || sStaticMinComparisonValue != null || sStaticMaxComparisonValue != null;
    var bDynamicValueSet =  sComparisonAttrRef != null || sComparisonType != null || sComparisonAttrTypeNum != null;

    if (bAttrRefSet && !bLinkRefSet && !bDynamicValueSet) {
        
        var aResolvedAttrInfo = determineAttrTypeAndAttrTypeNumByObjectMapping(p_oMappingObjectNode, sAttrRef, sAttrType, sAttrTypeNum);
        var iAttrTypeNum = getAttributeTypeNum(aResolvedAttrInfo[1]);
         
        if (!bStaticValueSet && sMode == "ISNOTNULL") {
        
            //Enum
            if (valuesAreEqual(new String(aResolvedAttrInfo[0]).substring(0,5), "Enum_")) {
                var oMappingEnumNode = getMappingEnum(new String(aResolvedAttrInfo[0]).substring(5));
                //multi Enum
                if (oMappingEnumNode.getAttributeValue("is_multiple") == "true") {
                    var oEnumItemNodes = oMappingEnumNode.getChildren("enumItem");
                    var iterItems = oEnumItemNodes.iterator();
                    while (iterItems.hasNext()) {
                        var oEnumItemNode = iterItems.next();
                        var sTypeNum = oEnumItemNode.getAttributeValue("aris_typenum");
                        var iValueAttrValueTypeNum = getAttributeTypeNum(sTypeNum);
                        if (iValueAttrValueTypeNum == -1) {continue;}

                        // at least one of the multi enum boolean attributes must be filled
                        if (oSearchItem == null) {
                            oSearchItem = p_oDatabase.createSearchItem(iValueAttrValueTypeNum, g_nLoc, "true", Constants.SEARCH_CMP_EQUAL, true, false);
                            // oSearchItem = p_oDatabase.createSearchItem(iValueAttrValueTypeNum, g_nLoc, true);
                        } else {
                            oSearchItem = oSearchItem.or( p_oDatabase.createSearchItem(iValueAttrValueTypeNum, g_nLoc, "true", Constants.SEARCH_CMP_EQUAL, true, false) );
                            // oSearchItem = oSearchItem.or( p_oDatabase.createSearchItem(iValueAttrValueTypeNum, g_nLoc, true) );
                        }
                    }
                }
                //single Enum
                else {
                    //ignore the conditions for "ROLE" and "ROLELEVEL": return null i.e. consider them as fulfilled for all SearchItem based searches
                    if (aResolvedAttrInfo[1] != "ROLE" && aResolvedAttrInfo[1] != "ROLELEVEL") {
                        oSearchItem = p_oDatabase.createSearchItem(iAttrTypeNum, g_nLoc, true);
                    }
                }
            }
            //String, Number, Double, Date
            else {
                oSearchItem = p_oDatabase.createSearchItem(iAttrTypeNum, g_nLoc, true);
            }
            
        } else if (bStaticValueSet && (sMode == "EQ" || sMode == "NEQ" || sMode == "GE" || sMode == "GT" || sMode == "LE" || sMode == "LT")) {
            
            var iComparisonMode;
            if (sMode == "EQ") {
                iComparisonMode = Constants.SEARCH_CMP_EQUAL;
            } else if (sMode == "NEQ") {
                iComparisonMode = Constants.SEARCH_CMP_NOTEQUAL;
            } else if (sMode == "GE") {
                iComparisonMode = Constants.SEARCH_CMP_GREATEREQUAL;
            } else if (sMode == "GT") {
                iComparisonMode = Constants.SEARCH_CMP_GREATER;
            } else if (sMode == "LE") {
                iComparisonMode = Constants.SEARCH_CMP_LOWEREQUAL;
            } //sMode == "LT"
            else {
                iComparisonMode = Constants.SEARCH_CMP_LOWER;
            }

            //String, Number, Double, Date
            if (valuesAreEqual(new String(aResolvedAttrInfo[0]), "Date")) {
                sStaticComparisonValue = translateDateString(sStaticComparisonValue);
            }
            oSearchItem = p_oDatabase.createSearchItem(iAttrTypeNum, g_nLoc, sStaticComparisonValue, iComparisonMode, true, false);
           
        } else if (bStaticValueSet && sMode == "RANGE") {
            
            //Number, Double, Date
            if (valuesAreEqual(new String(aResolvedAttrInfo[0]), "Date")) {
                if (sStaticMinComparisonValue != null) {
                    sStaticMinComparisonValue = translateDateString(sStaticMinComparisonValue);
                }
                if (sStaticMaxComparisonValue != null) {
                    sStaticMaxComparisonValue = translateDateString(sStaticMaxComparisonValue);
                }
            }
            if (sStaticMinComparisonValue != null) {
                oSearchItem = p_oDatabase.createSearchItem(iAttrTypeNum, g_nLoc, sStaticMinComparisonValue, Constants.SEARCH_CMP_GREATEREQUAL, true, false);
            }
            if (sStaticMaxComparisonValue != null) {
                if (oSearchItem != null) {
                    oSearchItem = oSearchItem.and( p_oDatabase.createSearchItem(iAttrTypeNum, g_nLoc, sStaticMaxComparisonValue, Constants.SEARCH_CMP_LOWEREQUAL, true, false) );
                } else {
                    oSearchItem = p_oDatabase.createSearchItem(iAttrTypeNum, g_nLoc, sStaticMaxComparisonValue, Constants.SEARCH_CMP_LOWEREQUAL, true, false);
                }
            }
           
        } else if (bStaticValueSet && (sMode == "CONTAINS" || sMode == "CONTAINSNOT")) {
            
            var iComparisonMode;
            if (sMode == "CONTAINS") {
                iComparisonMode = Constants.SEARCH_CMP_EQUAL;
            } //sMode == "CONTAINSNOT"
            else {
                iComparisonMode = Constants.SEARCH_CMP_NOTEQUAL;
            }
            
            //Enum
            if (valuesAreEqual(new String(aResolvedAttrInfo[0]).substring(0,5), "Enum_")) {
                var oMappingEnumNode = getMappingEnum(new String(aResolvedAttrInfo[0]).substring(5));
                //single enum
                if (oMappingEnumNode.getAttributeValue("is_multiple") == "false") {
                    var oEnumItemNodes = oMappingEnumNode.getChildren("enumItem");
                    var iterItems = oEnumItemNodes.iterator();
                    while (iterItems.hasNext()) {
                        var oEnumItemNode = iterItems.next();
                        // find the enum node whose item ID matches the static comparison value...
                        var sItemID = oEnumItemNode.getAttributeValue("id");
                        if (valuesAreEqual(sItemID, sStaticComparisonValue)) {
                            //... translate the item type num string from mapping into the value type number...
                            var sTypeNum = oEnumItemNode.getAttributeValue("aris_typenum");
                            var iValueAttrValueTypeNum = getAttributeTypeNum(sTypeNum);
                            //... then translate the value type number back into the string which can be used for the search
                            var sValueAttrValueSearchString = ArisData.ActiveFilter().AttrValueType(iAttrTypeNum, iValueAttrValueTypeNum);
		                    oSearchItem = p_oDatabase.createSearchItem (Constants.AT_AAM_IMPACT, g_nLoc, sValueAttrValueSearchString, iComparisonMode, true, false);
                            break;
                        }
                    } 
                }
                //multi enum
                else {
                    var aEnumItemIDs = sStaticComparisonValue.split(",");
                    var aEnumItems = new Array();
                    for (var i=0; i<aEnumItemIDs.length; i++) {
                        var oEnumItemNode = getMappingEnumItemOfMappingEnum(oMappingEnumNode, aEnumItemIDs[i]);
                        if (oEnumItemNode != null) {
                            aEnumItems.push(oEnumItemNode);
                        }
                    }
                    //create an AND-combined search item for all multi enum item boolean attributes
                    if (aEnumItems.length > 0) {
                        var iBooleanItemAttrTypeNum = getAttributeTypeNum(aEnumItems[0].getAttributeValue("aris_typenum"));
                        oSearchItem = p_oDatabase.createSearchItem (iBooleanItemAttrTypeNum, g_nLoc, "true", iComparisonMode, true, false);
                        for (var j=1; j<aEnumItems.length; j++) {
                            iBooleanItemAttrTypeNum = getAttributeTypeNum(aEnumItems[j].getAttributeValue("aris_typenum"));
                            oSearchItem = oSearchItem.and( p_oDatabase.createSearchItem (iBooleanItemAttrTypeNum, g_nLoc, "true", iComparisonMode, true, false) );
                        }
                    }         
                }
            }
            //String
            else {
                oSearchItem = p_oDatabase.createSearchItem (iAttrTypeNum, g_nLoc, "*" + sStaticComparisonValue + "*", iComparisonMode, true, true);
            }
        }
    }
               
    return oSearchItem;
}

/*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * Translates the given mapping date string of format "yyyy.MM.dd" into the required search string of format "MM/dd/yyyy".
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
function translateDateString(p_sMappingDateString) {
    var aParts = p_sMappingDateString.split(".");
    return aParts[1]  + "/" + aParts[0] + "/" + aParts[2] + " 00:00:00";
}