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

var g_nLoc = Context.getSelectedLanguage();
               
try {           
    main();
}
catch(ex) {
    Context.setProperty("exception", ex.fileName + ":" + ex.lineNumber + ": " + ex);
}

function main() {
    
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
        var aPolicyDefinitionMandatories = getMandatoryFieldsForPolicyDefinition();
	    var aPolicyReviewTaskMandatories = getMandatoryFieldsForPolicyReviewTask();
        
        var oPolicyExportInfoSet = getExportInfoSetByObjectMappingID("RISK");
        //iterate on the policies
        var iter = oPolicyExportInfoSet.iterator();
        while (iter.hasNext()) {
            
            var oPolicyExportInfo = iter.next();
            var oPolicy = oPolicyExportInfo.getObjDef();
            var szInnerMsg = "";
            
            //policy definition attributes
            szInnerMsg = addSingleValidationOutput( validateMandatoryObjectAttributes(oPolicy, aPolicyDefinitionMandatories, SPC1), szInnerMsg );
            
            szInnerMsg = addSingleValidationOutput( validatePolicyOwnerApprovalStartEndDate(oPolicy, SPC1), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validatePolicyApproverApprovalStartEndDate(oPolicy, SPC1), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validatePolicyPublishingStartEndDate(oPolicy, SPC1), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validatePolicyReviewTaskStartEndDate(oPolicy, SPC1), szInnerMsg );
            
            szInnerMsg = addSingleValidationOutput( validateConnectedPolicyOwnerCount(oPolicyExportInfo, SPC1), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedPolicyAuditorCount(oPolicyExportInfo, SPC1), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedPolicyApproverCount(oPolicyExportInfo, SPC1), szInnerMsg );
            
            szInnerMsg = addSingleValidationOutput( validatePolicyTypeConfirmationRequiredConditions(oPolicyExportInfo, oPolicy, SPC1), szInnerMsg );
            
            szInnerMsg = addSingleValidationOutput( validatePublishingStartdateBeforeOwnerApprovalStartdate(oPolicy, SPC1), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateOwnerApprovalPeriodWithinApproverApprovalPeriod(oPolicy, SPC1), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateDatePeriod(oPolicy, Constants.AT_START_DATE_APPROVAL_PERIOD_OWNER, Constants.AT_END_DATE_APPROVAL_PERIOD_OWNER, SPC1), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateDatePeriod(oPolicy, Constants.AT_START_DATE_APPROVAL_PERIOD_APPROVER, Constants.AT_END_DATE_APPROVAL_PERIOD_APPROVER, SPC1), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateDatePeriod(oPolicy, Constants.AT_START_DATE_PUBLISHING_PERIOD, Constants.AT_END_DATE_PUBLISHING_PERIOD, SPC1), szInnerMsg );
            
            //policy review task attributes
            szInnerMsg = addSingleValidationOutput( validateMandatoryObjectAttributes(oPolicy, aPolicyReviewTaskMandatories, SPC1), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validatePolicyReviewTaskFrequencyDependentAttributes(oPolicy, SPC1), szInnerMsg );
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

function validatePolicyOwnerApprovalStartEndDate(p_oPolicyDefinition, p_sSPC) {
	return validateStartEndDate(p_oPolicyDefinition, Constants.AT_START_DATE_APPROVAL_PERIOD_OWNER, Constants.AT_END_DATE_APPROVAL_PERIOD_OWNER, p_sSPC);
}

function validatePolicyApproverApprovalStartEndDate(p_oPolicyDefinition, p_sSPC) {
	return validateStartEndDate(p_oPolicyDefinition, Constants.AT_START_DATE_APPROVAL_PERIOD_APPROVER, Constants.AT_END_DATE_APPROVAL_PERIOD_APPROVER, p_sSPC);
}

function validatePolicyPublishingStartEndDate(p_oPolicyDefinition, p_sSPC) {
	return validateStartEndDate(p_oPolicyDefinition, Constants.AT_START_DATE_PUBLISHING_PERIOD, Constants.AT_END_DATE_PUBLISHING_PERIOD, p_sSPC);
}

function validatePolicyReviewTaskStartEndDate(p_oPolicyDefinition, p_sSPC) {
	return validateStartEndDate(p_oPolicyDefinition, Constants.AT_START_DATE_OF_POLICY_REVIEWS, Constants.AT_END_DATE_OF_POLICY_REVIEWS, p_sSPC);
}

function validateConnectedPolicyOwnerCount(p_oPolicyDefinitionExportInfo, p_sSPC) {
   var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oPolicyDefinitionExportInfo, "owner_group");
   return getConnectionCountValidationOutput(PM_OCCURRENCE_MIN_POLICY_DEFINITION_TO_POLICYOWNER, PM_OCCURRENCE_MAX_POLICY_DEFINITION_TO_POLICYOWNER, p_oPolicyDefinitionExportInfo, aChildExportInfoArray, getString("TEXT_3"), SPC1);
}

function validateConnectedPolicyAuditorCount(p_oPolicyDefinitionExportInfo, p_sSPC) {
   var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oPolicyDefinitionExportInfo, "auditor_group");
   return getConnectionCountValidationOutput(PM_OCCURRENCE_MIN_POLICY_DEFINITION_TO_POLICYAUDITOR, PM_OCCURRENCE_MAX_POLICY_DEFINITION_TO_POLICYAUDITOR, p_oPolicyDefinitionExportInfo, aChildExportInfoArray, getString("TEXT_9"), SPC1);
}

function validateConnectedPolicyApproverCount(p_oPolicyDefinitionExportInfo, p_sSPC) {
   var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oPolicyDefinitionExportInfo, "approver_group");
   return getConnectionCountValidationOutput(PM_OCCURRENCE_MIN_POLICY_DEFINITION_TO_POLICYAPPROVER, PM_OCCURRENCE_MAX_POLICY_DEFINITION_TO_POLICYAPPROVER, p_oPolicyDefinitionExportInfo, aChildExportInfoArray, getString("TEXT_4"), SPC1);
}

/*
 These conditions are checked hard-coded here: if policy type "confirmation required"
 1. At least one Policy Addressee group must be assigned
 2.	Confirmation text must be maintained
 3.	Duration must be maintained (Range 1..365)

*/
function validatePolicyTypeConfirmationRequiredConditions(p_oPolicyDefinitionExportInfo, p_oPolicyDefinition, p_sSPC) {

    var szMsg = "";

    //nothing to check here if attribute type is not "Confirmation required"
    if ( p_oPolicyDefinition.Attribute(Constants.AT_POLICY_TYPE, g_nLoc).MeasureUnitTypeNum() != Constants.AVT_CONFIRMATION_REQUIRED ) {
        return szMsg;
    }
   
    var bValid = true;
    var sSubConditionsMsg = "";
    var sSingleCheckResult = "";
    
    //1.
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oPolicyDefinitionExportInfo, "addressee_group");
    sSingleCheckResult = getConnectionCountValidationOutput(PM_OCCURRENCE_MIN_POLICY_DEFINITION_TO_POLICYADDRESSEE, PM_OCCURRENCE_MAX_POLICY_DEFINITION_TO_POLICYADDRESSEE, p_oPolicyDefinitionExportInfo, aChildExportInfoArray, getString("TEXT_5"), SPC1);
    if (sSingleCheckResult != "") {
        if (szMsg.length > 0) {szMsg += "\r\n";}
        szMsg += sSingleCheckResult;
    }
       
    //2.
    aMandatories = new Array( new Array("AT_CONFIRMATION_DURATION[Range 1...]") );
    sSingleCheckResult = validateMandatoryObjectAttributes(p_oPolicyDefinition, aMandatories, p_sSPC + SPC1, null);
    szMsg = addSingleValidationOutput(sSingleCheckResult, szMsg);
    
    
    //construct error message if condition(s) are violated
    if (szMsg.length > 0) {
       var sConfirmationRequiredItemName = ArisData.ActiveFilter().AttrValueType(Constants.AT_POLICY_TYPE, Constants.AVT_CONFIRMATION_REQUIRED);
       szMsg = p_sSPC + new java.lang.String(getString("TEXT_10")).replaceFirst("%0", sConfirmationRequiredItemName)
               + "\r\n" + "\r\n" + p_sSPC + szMsg;
    }
    
    return szMsg;        
}


function validatePublishingStartdateBeforeOwnerApprovalStartdate(p_oPolicyDefinition, p_sSPC) {
    
    var szMsg = "";
    var ownerApprovalStartdateAttribute = p_oPolicyDefinition.Attribute(Constants.AT_START_DATE_APPROVAL_PERIOD_OWNER, g_nLoc);
    var publishingStartdateAttribute = p_oPolicyDefinition.Attribute(Constants.AT_START_DATE_PUBLISHING_PERIOD, g_nLoc);
    if (!ownerApprovalStartdateAttribute.IsMaintained() || !publishingStartdateAttribute.IsMaintained()) {
        return szMsg;
    }
    
    var ownerApprovalStartdate = ownerApprovalStartdateAttribute.MeasureValue();
    var publishingStartdate = publishingStartdateAttribute.MeasureValue();
    if (publishingStartdate.compareTo(ownerApprovalStartdate) < 0) {
        szMsg = p_sSPC + getString("TEXT_6");
    }

    return szMsg;
}

function validateOwnerApprovalPeriodWithinApproverApprovalPeriod(p_oPolicyDefinition, p_sSPC) {
    
    var szMsg = "";
    var ownerApprovalStartdateAttribute = p_oPolicyDefinition.Attribute(Constants.AT_START_DATE_APPROVAL_PERIOD_OWNER, g_nLoc);
    var ownerApprovalEnddateAttribute = p_oPolicyDefinition.Attribute(Constants.AT_END_DATE_APPROVAL_PERIOD_OWNER, g_nLoc);
    var approverApprovalStartdateAttribute = p_oPolicyDefinition.Attribute(Constants.AT_START_DATE_APPROVAL_PERIOD_APPROVER, g_nLoc);
    var approverApprovalEnddateAttribute = p_oPolicyDefinition.Attribute(Constants.AT_END_DATE_APPROVAL_PERIOD_APPROVER, g_nLoc);
    if (!ownerApprovalStartdateAttribute.IsMaintained() || !ownerApprovalEnddateAttribute.IsMaintained()
        || !approverApprovalStartdateAttribute.IsMaintained() || !approverApprovalEnddateAttribute.IsMaintained()) {
        return szMsg;
    }
    
    var ownerApprovalStartdate = ownerApprovalStartdateAttribute.MeasureValue();
    var ownerApprovalEnddate = ownerApprovalEnddateAttribute.MeasureValue();
    var approverApprovalStartdate = approverApprovalStartdateAttribute.MeasureValue();
    var approverApprovalEnddate = approverApprovalEnddateAttribute.MeasureValue();
    if (approverApprovalStartdate.compareTo(ownerApprovalStartdate) < 0
        || approverApprovalEnddate.compareTo(ownerApprovalEnddate) > 0) {
        szMsg = p_sSPC + getString("TEXT_7");
    }
    
    return szMsg;
}

function validateDatePeriod(p_oObjDef, p_iStartDateTypeNum, p_iEndDateTypeNum, p_sSPC) {
    
    var szMsg = "";
    var oStartdateAttribute = p_oObjDef.Attribute(p_iStartDateTypeNum, g_nLoc);
    var oEnddateAttribute = p_oObjDef.Attribute(p_iEndDateTypeNum, g_nLoc);
    if (!oStartdateAttribute.IsMaintained() || !oEnddateAttribute.IsMaintained()) {
        return szMsg;
    }
    
    var oStartdate = oStartdateAttribute.MeasureValue();
    var oEnddate = oEnddateAttribute.MeasureValue();
    if (oEnddate.compareTo(oStartdate) < 0) {
        var sDatePeriodMsg = new java.lang.String(getString("TEXT_8") )
                                          .replaceFirst("%0", oEnddateAttribute.Type())
                                          .replaceFirst("%1", oStartdateAttribute.Type());
        szMsg = p_sSPC + sDatePeriodMsg;
    }
    
    return szMsg;
}

function validatePolicyReviewTaskFrequencyDependentAttributes(p_oPolicyDefinition, p_sSPC) {
    var szMsg = "";
    if ( isboolattributetrue(p_oPolicyDefinition, Constants.AT_REVIEW_RELEVANT, g_nLoc)
         && p_oPolicyDefinition.Attribute(Constants.AT_REVIEW_FREQUENCY, g_nLoc).MeasureUnitTypeNum() != Constants.AVT_RM_ASSESSMENT_FREQUENCY_EVENT_DRIVEN ) { 
        var aMandatoryConditions = splitString('AT_REVIEW_EXECUTION_TIME_LIMIT,AT_START_DATE_OF_POLICY_REVIEWS');
        szMsg = validateMandatoryObjectAttributes(p_oPolicyDefinition, aMandatoryConditions, p_sSPC, null);
    }
    return szMsg;
}