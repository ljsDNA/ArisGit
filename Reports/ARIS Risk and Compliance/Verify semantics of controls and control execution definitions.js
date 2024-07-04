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
        var szControlOutput = "";
        
        var oControlExportInfoSet = getExportInfoSetByObjectMappingID("CONTROL");
        //iterate on the controls
        var iter = oControlExportInfoSet.iterator();
        while (iter.hasNext()) {
            
            var oControlExportInfo = iter.next();
            var oControl = oControlExportInfo.getObjDef();
            var szInnerMsg = ""; 
            
            szInnerMsg = addSingleValidationOutput( validateControlMandatoryAttributes(oControl), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedControlManagerGroupsCount(oControlExportInfo), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedRiskCount(oControlExportInfo), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedFunctionsCount(oControlExportInfo), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedRegulationCount(oControlExportInfo), szInnerMsg );
            
            //in case of error add the control object info
            if (!szInnerMsg.equals("")){            
                var szControlInfo = new java.lang.String(getString("TEXT_2")).replaceFirst("%0", oControl.Name(g_nLoc));
                var sCompleteSingleControlOutput = addObjectValidationInfo(szControlInfo, szInnerMsg, oControl, SPC1);
                szControlOutput = addCompleteObjectValidationOutput(szControlOutput, sCompleteSingleControlOutput); 
            }
        }
        
        if (szControlOutput.equals("")) {szControlOutput = NO_ERROR_FOUND;}
        szControlOutput = addOutputHeader(szControlOutput, getString("TEXT_1"));
    
        
        var szControlTaskOutput = "";
        
        var oControlExecutionTaskExportInfoSet = getExportInfoSetByObjectMappingID("CONTROLEXECUTIONTASK");
        //iterate on the control execution tasks
        iter = oControlExecutionTaskExportInfoSet.iterator();
        while (iter.hasNext()) {
            
            var oControlExecutionTaskExportInfo = iter.next();
            var oControlExecutionTask = oControlExecutionTaskExportInfo.getObjDef();
            var szInnerMsg = ""; 
            
            szInnerMsg = addSingleValidationOutput( validateControlExecutionTaskMandatoryAttributes(oControlExecutionTask), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateControlExecutionFrequency(oControlExecutionTask), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateControlExecutionFrequencyDependentAttributes(oControlExecutionTask), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateControlExecutionTaskStartEndDate(oControlExecutionTask, SPC1), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedControlCount(oControlExecutionTaskExportInfo), szInnerMsg );                            
            szInnerMsg = addSingleValidationOutput( validateConnectedControlExecutionOwnerGroupsCount(oControlExecutionTaskExportInfo), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedOrgUnitCount(oControlExecutionTaskExportInfo), szInnerMsg );
    
            //in case of error add the control execution task object info
            if (!szInnerMsg.equals("")){            
                var szControlInfo = new java.lang.String(getString("TEXT_9")).replaceFirst("%0", oControlExecutionTask.Name(g_nLoc));
                var sCompleteSingleControlOutput = addObjectValidationInfo(szControlInfo, szInnerMsg, oControlExecutionTask, SPC1);
                szControlTaskOutput = addCompleteObjectValidationOutput(szControlTaskOutput, sCompleteSingleControlOutput); 
            }
        }
        
        if (szControlTaskOutput.equals("")) {szControlTaskOutput = NO_ERROR_FOUND;}
        szControlTaskOutput = addOutputHeader(szControlTaskOutput, getString("TEXT_8"));
        
        szOutput += szControlOutput + "\r\n" + "\r\n" + "\r\n" + szControlTaskOutput;
    }
    
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
//-------------------------- Test management validates --------------------------------
function validateControlMandatoryAttributes(pControl){
    var szMsg = "";
    var aMandatories = getMandatoryFieldsForControl();   
    return validateMandatoryObjectAttributes(pControl, aMandatories, SPC1, getString("TEXT_4")); 
}


function validateConnectedControlManagerGroupsCount(pControlExportInfo) {
    var aChildExportInfoArray = getChildExportInfoArrayByLink(pControlExportInfo, "manager_group");
    return getConnectionCountValidationOutput(OCCURRENCE_MIN_CONTROL_TO_CONTROLMANAGER, OCCURRENCE_MAX_CONTROL_TO_CONTROLMANAGER, pControlExportInfo, aChildExportInfoArray, getString("TEXT_7"), SPC1);
}

function validateConnectedRiskCount(pControlExportInfo) {
    var aParentExportInfoArray = getParentExportInfoArrayByLink(pControlExportInfo, "controls", "RISK");
    return getConnectionCountValidationOutput(OCCURRENCE_MIN_CONTROL_TO_RISKS, OCCURRENCE_MAX_CONTROL_TO_RISKS, pControlExportInfo, aParentExportInfoArray, getString("TEXT_5"), SPC1);
}

function validateConnectedFunctionsCount(pControlExportInfo) {
    var aChildExportInfoArray = getChildExportInfoArrayByLink(pControlExportInfo, "process");
    return getConnectionCountValidationOutput(OCCURRENCE_MIN_CONTROL_TO_FUNCTION, OCCURRENCE_MAX_CONTROL_TO_FUNCTION, pControlExportInfo, aChildExportInfoArray, getString("TEXT_16"), SPC1);
}

function validateConnectedRegulationCount(pControlExportInfo) {
    var aChildExportInfoArray = getChildExportInfoArrayByLink(pControlExportInfo, "finaccount");
    return getConnectionCountValidationOutput(OCCURRENCE_MIN_CONTROL_TO_REGULATION, OCCURRENCE_MAX_CONTROL_TO_REGULATION, pControlExportInfo, aChildExportInfoArray, getString("TEXT_17"), SPC1);
    
}

//-------------------------------------------------------------------------------------
//-------------------------- Control management validates --------------------------------
function validateControlExecutionTaskMandatoryAttributes(pControlExecutionTask){
    var szMsg = "";
    var aMandatories = getMandatoryFieldsForControlExecutionTask();   
    return validateMandatoryObjectAttributes(pControlExecutionTask, aMandatories, SPC1, getString("TEXT_11"));
}

function validateControlExecutionFrequency(pControlExecutionTask) {
    var szMsg = "";
    if ( (isboolattributefalse(pControlExecutionTask, Constants.AT_EVENT_DRIVEN_CTRL_EXECUTION_ALLOWED, g_nLoc) 
         && pControlExecutionTask.Attribute(Constants.AT_CTRL_EXECUTION_TASK_FREQUENCY, g_nLoc).MeasureUnitTypeNum() == Constants.AVT_EVENT_DRIVEN)
         ) { 
        szMsg = SPC1 + getString("TEXT_15");
    }
    return szMsg;
}

function validateControlExecutionFrequencyDependentAttributes(pControlExecutionTask) {
    var szMsg = "";
    if ( pControlExecutionTask.Attribute(Constants.AT_CTRL_EXECUTION_TASK_FREQUENCY, g_nLoc).MeasureUnitTypeNum() != Constants.AVT_EVENT_DRIVEN ) { 
        var aMandatoryConditions = splitString('AT_CTRL_EXECUTION_TASK_DURATION,AT_CTRL_EXECUTION_TASK_START_DATE');
        szMsg = validateMandatoryObjectAttributes(pControlExecutionTask, aMandatoryConditions, SPC1, null);
    }
    return szMsg;
}

function validateControlExecutionTaskStartEndDate(pControlExecutionTask, p_sSPC) {
	return validateStartEndDate(pControlExecutionTask, Constants.AT_CTRL_EXECUTION_TASK_START_DATE, Constants.AT_CTRL_EXECUTION_TASK_END_DATE, p_sSPC);
}

function validateConnectedControlCount(pControlExecutionTaskExportInfo) {
    var aParentExportInfoArray = getParentExportInfoArrayByLink(pControlExecutionTaskExportInfo, "controlexecutiontasks", "CONTROL");
    return getConnectionCountValidationOutput(OCCURRENCE_MIN_CONTROL_TO_FUNCTION, OCCURRENCE_MAX_CONTROL_TO_FUNCTION, pControlExecutionTaskExportInfo, aParentExportInfoArray, getString("TEXT_16"), SPC1);
}

function validateConnectedControlExecutionOwnerGroupsCount(pControlExecutionTaskExportInfo) {
    var aChildExportInfoArray = getChildExportInfoArrayByLink(pControlExecutionTaskExportInfo, "owner_group");
    return getConnectionCountValidationOutput(OCCURRENCE_MIN_CONTROLEXECUTIONTASK_TO_CONTROLEXECUTIONOWNER, OCCURRENCE_MAX_CONTROLEXECUTIONTASK_TO_CONTROLEXECUTIONOWNER, pControlExecutionTaskExportInfo, aChildExportInfoArray, getString("TEXT_13"), SPC1);
}

function validateConnectedOrgUnitCount(pControlExecutionTaskExportInfo) {
    var aChildExportInfoArray = getChildExportInfoArrayByLink(pControlExecutionTaskExportInfo, "affected_orgunit");
    return getConnectionCountValidationOutput(OCCURRENCE_MIN_CONTROLEXECUTIONTASK_TO_ORGUNIT, OCCURRENCE_MAX_CONTROLEXECUTIONTASK_TO_ORGUNIT, pControlExecutionTaskExportInfo, aChildExportInfoArray, getString("TEXT_14"), SPC1);      
}