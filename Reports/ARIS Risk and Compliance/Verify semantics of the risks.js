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

var OUTPUTFILENAME = Context.getSelectedFile();

// runtime improvement for attribute check
var g_aTestManagementAttributeConditions = new Array();
var g_aRiskManagementAttributeConditions = new Array();
var g_aReducedRiskManagementAttributeConditions = new Array();

var g_nLoc = Context.getSelectedLanguage();

try {
    main();
}
catch(ex) {
    Context.setProperty("exception", ex.fileName + ":" + ex.lineNumber + ": " + ex);
}

function main(){
    
    var szOutput = "";

    //ensure bottom up skip before calling startClassification()
    g_bSkipBottomUpRecursion = true;
    
    initMappingAndStartClassification();
    
    //in case of mapping errors no sub report execution can be done; output the mapping errors instead
    if (g_aMappingInitMessages.length > 0) {
        szOutput = g_aMappingInitMessages.join("\n");
    }
    //do the checks
    else {
        //determine the attribute conditions up front
        g_aTestManagementAttributeConditions = getMandatoryFieldsForRisk();
        g_aRiskManagementAttributeConditions = getMandatoryRiskManagementFieldsForRisk();
        g_aReducedRiskManagementAttributeConditions = getRemainingConditions(g_aRiskManagementAttributeConditions, g_aTestManagementAttributeConditions);
        
        var oRiskExportInfoSet = getExportInfoSetByObjectMappingID("RISK");
        //iterate on the risks
        var iter = oRiskExportInfoSet.iterator();
        while (iter.hasNext()) {
            
            var oRiskExportInfo = iter.next();
            var oRisk = oRiskExportInfo.getObjDef();
            var szInnerMsg = "";

            szInnerMsg = addSingleValidationOutput( validateRiskMandatoryAttributes(oRisk), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateReducedRiskManagementRiskMandatoryAttributes(oRisk), szInnerMsg );
            
            szInnerMsg = addSingleValidationOutput( validateConnectedFunctionsCount(oRiskExportInfo), szInnerMsg );   
            szInnerMsg = addSingleValidationOutput( validateConnectedRiskManagerCount(oRiskExportInfo), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedControlsCount(oRiskExportInfo), szInnerMsg );
            
            if ( isboolattributetrue(oRisk, Constants.AT_GRC_RISK_MANAGEMENT_RELEVANT , g_nLoc) ) {
                szInnerMsg = addSingleValidationOutput( validateRiskStartEndDate(oRisk), szInnerMsg );
                szInnerMsg = addSingleValidationOutput( validateRiskFrequencyDependentAttributes(oRisk), szInnerMsg );
                
                szInnerMsg = addSingleValidationOutput( validateConnectedRiskOwnerCount(oRiskExportInfo), szInnerMsg );
                szInnerMsg = addSingleValidationOutput( validateConnectedRiskReviewerCount(oRiskExportInfo), szInnerMsg );
            }
             
            //in case of error add the risk object info
            if (!szInnerMsg.equals("")){
                var szRiskInfo = new java.lang.String(getString("TEXT_2")).replaceFirst("%0", oRiskExportInfo.getObjDef().Name(g_nLoc));
                var sCompleteSingleRiskOutput = addObjectValidationInfo(szRiskInfo, szInnerMsg, oRiskExportInfo.getObjDef(), SPC1)
                szOutput = addCompleteObjectValidationOutput(szOutput, sCompleteSingleRiskOutput);
            }
        }
    }    
    
    if (szOutput.equals("")) {szOutput = NO_ERROR_FOUND;}
    szOutput = addOutputHeader(szOutput, getString("TEXT_1"));
    
    //combined execution by superior report
    if (Context.getProperty("combined_check") != null) {
        Context.setProperty("reportdata", szOutput);
    }
    //stand-alone execution
    else {
        writeErrorreport(szOutput, OUTPUTFILENAME);
    }
}


//-------------------------------------------------------------------------------------
//--------------------------------- Validates  ----------------------------------------

function validateRiskMandatoryAttributes(pRisk){   
    return validateMandatoryObjectAttributes(pRisk, g_aTestManagementAttributeConditions, SPC1, getString("TEXT_3")); 
}

function validateReducedRiskManagementRiskMandatoryAttributes(pRisk){
    return validateMandatoryObjectAttributes(pRisk, g_aReducedRiskManagementAttributeConditions, SPC1, getString("TEXT_3"));
}

function validateConnectedFunctionsCount(pRiskExportInfo) {
    var aChildExportInfoArray = getChildExportInfoArrayByLink(pRiskExportInfo, "process");
    return getConnectionCountValidationOutput(OCCURRENCE_MIN_RISK_TO_FUNCTION, OCCURRENCE_MAX_RISK_TO_FUNCTION, pRiskExportInfo, aChildExportInfoArray, getString("TEXT_5"), SPC1);
}

function validateConnectedRiskManagerCount(pRiskExportInfo) {
   var aChildExportInfoArray = getChildExportInfoArrayByLink(pRiskExportInfo, "manager_group");
   return getConnectionCountValidationOutput(OCCURRENCE_MIN_RISK_TO_RISKMANAGER, OCCURRENCE_MAX_RISK_TO_RISKMANAGER, pRiskExportInfo, aChildExportInfoArray, getString("TEXT_6"), SPC1);
    
}

function validateConnectedControlsCount(pRiskExportInfo){
   var aChildExportInfoArray = getChildExportInfoArrayByLink(pRiskExportInfo, "controls");
   return  getConnectionCountValidationOutput(OCCURRENCE_MIN_RISK_TO_CONTROL, OCCURRENCE_MAX_RISK_TO_CONTROL, pRiskExportInfo, aChildExportInfoArray, getString("TEXT_14"), SPC1);
}

function validateRiskStartEndDate(pRisk) {
	return validateStartEndDate(pRisk, Constants.AT_GRC_START_DATE_OF_RISK_ASSESSMENTS, Constants.AT_GRC_END_DATE_OF_RISK_ASSESSMENTS, SPC1);
}

function validateRiskFrequencyDependentAttributes(pRisk) {
    var szMsg = "";
    if ( pRisk.Attribute(Constants.AT_GRC_ASSESSMENT_FREQUENCY, g_nLoc).MeasureUnitTypeNum() != Constants.AVT_RM_ASSESSMENT_FREQUENCY_EVENT_DRIVEN ) { 
        var aMandatoryConditions = splitString('AT_GRC_RISK_ASSESSMENT_DURATION,AT_GRC_START_DATE_OF_RISK_ASSESSMENTS');
        szMsg = validateMandatoryObjectAttributes(pRisk, aMandatoryConditions, SPC1, null);
    }
    return szMsg;
}

function validateConnectedRiskOwnerCount(pRiskExportInfo) {
    var aChildExportInfoArray = getChildExportInfoArrayByLink(pRiskExportInfo, "owner_group");
    return  getConnectionCountValidationOutput(RM_OCCURRENCE_MIN_RISK_TO_RISKOWNER, RM_OCCURRENCE_MAX_RISK_TO_RISKOWNER, pRiskExportInfo, aChildExportInfoArray, getString("TEXT_8"), SPC1);
}

function validateConnectedRiskReviewerCount(pRiskExportInfo) {
    var aChildExportInfoArray = getChildExportInfoArrayByLink(pRiskExportInfo, "reviewer_group");
    return  getConnectionCountValidationOutput(RM_OCCURRENCE_MIN_RISK_TO_RISKREVIEWER, RM_OCCURRENCE_MAX_RISK_TO_RISKREVIEWER, pRiskExportInfo, aChildExportInfoArray, getString("TEXT_9"), SPC1);
}