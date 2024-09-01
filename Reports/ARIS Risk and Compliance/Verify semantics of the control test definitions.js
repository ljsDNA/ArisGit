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
        var oTestdefinitionExportInfoSet = getExportInfoSetByObjectMappingID("TESTDEFINITION");
        //iterate on the test definitions
        var iter = oTestdefinitionExportInfoSet.iterator();
        while (iter.hasNext()) {
            
            var oTestdefinitionExportInfo = iter.next();
            var oTestdefinition = oTestdefinitionExportInfo.getObjDef();
            var szInnerMsg = "";
            
            szInnerMsg = addSingleValidationOutput( validateTestdefinitionMandatoryAttributes(oTestdefinition), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateTestdefinitionStartEndDate(oTestdefinition), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateTestdefinitionFrequency(oTestdefinition), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateTestdefinitionFrequencyDependentAttributes(oTestdefinition), szInnerMsg );
    
            szInnerMsg = addSingleValidationOutput( validateConnectedOrgUnitsCount(oTestdefinitionExportInfo), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedTestmanagerCount(oTestdefinitionExportInfo), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedTesterCount(oTestdefinitionExportInfo), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedTestReviewerCount(oTestdefinitionExportInfo), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedUsers(oTestdefinitionExportInfo), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedControlsCount(oTestdefinitionExportInfo), szInnerMsg );
            //additional check
            if (TESTER_GROUPS_ASSIGNMENT_TESTER_HIERARCHY_PERFORM == true) {
                szInnerMsg = addSingleValidationOutput( validateConnectedTesterGroupHierarchyAssignment(oTestdefinitionExportInfo), szInnerMsg );
            }
            
            //in case of error add the test definition object info
            if (!szInnerMsg.equals("")){
                var szTestDefInfo = new java.lang.String(getString("TEXT_2")).replaceFirst("%0", oTestdefinition.Name(g_nLoc));
                var sCompleteSingleTestDefOutput = addObjectValidationInfo(szTestDefInfo, szInnerMsg, oTestdefinition, SPC1)
                szOutput = addCompleteObjectValidationOutput(szOutput, sCompleteSingleTestDefOutput); 
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
//---------------------------------- Validates ----------------------------------------

function validateTestdefinitionMandatoryAttributes(pTestdefinition) {
    var szMsg = "";
    var aMandatories = getMandatoryFieldsForTestdefinition();
    return validateMandatoryObjectAttributes(pTestdefinition, aMandatories, SPC1, getString("TEXT_3")); 
}

function validateTestdefinitionStartEndDate(pTestdefinition) {
	return validateStartEndDate(pTestdefinition, Constants.AT_AAM_TESTDEF_START_DATE, Constants.AT_AAM_TESTDEF_END_DATE, SPC1);
}

function validateTestdefinitionFrequency(pTestdefinition) {
    var szMsg = "";
    //if flag "event driven generation allowed" is set to "true" then the frequency must be "event driven"...
    if ( (isboolattributetrue(pTestdefinition, Constants.AT_EVENT_DRIVEN_TESTS_ALLOWED, g_nLoc) 
         && pTestdefinition.Attribute(Constants.AT_AAM_TEST_FREQUENCY, g_nLoc).MeasureUnitTypeNum() != Constants.AVT_AAM_TEST_FREQUENCY_EVENT_DRIVEN) 
         ) { 
        szMsg = SPC1 + getString("TEXT_11");
    }
    //... and vice versa!
    if ( (isboolattributefalse(pTestdefinition, Constants.AT_EVENT_DRIVEN_TESTS_ALLOWED, g_nLoc) 
         && pTestdefinition.Attribute(Constants.AT_AAM_TEST_FREQUENCY, g_nLoc).MeasureUnitTypeNum() == Constants.AVT_AAM_TEST_FREQUENCY_EVENT_DRIVEN)
         ) { 
        szMsg = SPC1 + getString("TEXT_12");
    }
    return szMsg;
}

function validateTestdefinitionFrequencyDependentAttributes(pTestdefinition) {
    var szMsg = "";
    if ( pTestdefinition.Attribute(Constants.AT_AAM_TEST_FREQUENCY, g_nLoc).MeasureUnitTypeNum() != Constants.AVT_AAM_TEST_FREQUENCY_EVENT_DRIVEN ) { 
        var aMandatoryConditions = splitString('AT_AAM_TEST_DURATION,AT_AAM_TESTDEF_START_DATE');
        szMsg = validateMandatoryObjectAttributes(pTestdefinition, aMandatoryConditions, SPC1, null);
    }
    return szMsg;
}

function validateConnectedOrgUnitsCount(pTestdefinitionExportInfo) {
    var aChildExportInfoArray = getChildExportInfoArrayByLink(pTestdefinitionExportInfo, "orgunit");
    return getConnectionCountValidationOutput(OCCURRENCE_MIN_TESTDEFINITION_TO_ORGAUNITS, OCCURRENCE_MAX_TESTDEFINITION_TO_ORGAUNITS, pTestdefinitionExportInfo, aChildExportInfoArray, getString("TEXT_5"), SPC1);
}

function validateConnectedTestmanagerCount(pTestdefinitionExportInfo) {
    var aChildExportInfoArray = getChildExportInfoArrayByLink(pTestdefinitionExportInfo, "manager_group");
    return getConnectionCountValidationOutput(OCCURRENCE_MIN_TESTDEFINITION_TO_TESTMANAGER, OCCURRENCE_MAX_TESTDEFINITION_TO_TESTMANAGER, pTestdefinitionExportInfo, aChildExportInfoArray, getString("TEXT_15"), SPC1);
}

function validateConnectedTesterCount(pTestdefinitionExportInfo) {
    var aChildExportInfoArray = getChildExportInfoArrayByLink(pTestdefinitionExportInfo, "owner_group");
    return getConnectionCountValidationOutput(OCCURRENCE_MIN_TESTDEFINITION_TO_TESTER, OCCURRENCE_MAX_TESTDEFINITION_TO_TESTER, pTestdefinitionExportInfo, aChildExportInfoArray, getString("TEXT_6"), SPC1);
}

function validateConnectedTestReviewerCount(pTestdefinitionExportInfo) {
    var aChildExportInfoArray = getChildExportInfoArrayByLink(pTestdefinitionExportInfo, "reviewer_group");
    return getConnectionCountValidationOutput(OCCURRENCE_MIN_TESTDEFINITION_TO_TESTREVIEWER, OCCURRENCE_MAX_TESTDEFINITION_TO_TESTREVIEWER, pTestdefinitionExportInfo, aChildExportInfoArray, getString("TEXT_7"), SPC1);
}

/*---------------------------------------------------------------------------------------
    Checks the users which are connected via tester groups and test reviewer groups.
    It's not allowed to have any users assigned both as tester and test reviewer.
  ---------------------------------------------------------------------------------------*/
function validateConnectedUsers(pTestdefinitionExportInfo){
   
    var szMsg = "";
    
    var oTesterUsersExportInfoSet = new java.util.HashSet();
    var aTesterGroupsChildExportInfoArray = getChildExportInfoArrayByLink(pTestdefinitionExportInfo, "owner_group");
    for (t=0; t<aTesterGroupsChildExportInfoArray.size(); t++) {
        var aTesterUsersChildExportInfoArray = getChildExportInfoArrayByLink(aTesterGroupsChildExportInfoArray.get(t), "groupmembers");
        for (u=0; u<aTesterGroupsChildExportInfoArray.size(); u++) {
            oTesterUsersExportInfoSet.add(aTesterGroupsChildExportInfoArray.get(u).getObjDef());
        }
    }
    
    var oTestReviewersExportInfoSet = new java.util.HashSet();
    var aTestReviewerGroupsChildExportInfoArray = getChildExportInfoArrayByLink(pTestdefinitionExportInfo, "reviewer_group");
    for (r=0; r<aTestReviewerGroupsChildExportInfoArray.size(); r++) {
        var aTestReviewerUsersChildExportInfoArray = getChildExportInfoArrayByLink(aTestReviewerGroupsChildExportInfoArray.get(r), "groupmembers");
        for (v=0; v<aTestReviewerUsersChildExportInfoArray.size(); v++) {
            oTestReviewersExportInfoSet.add(aTestReviewerUsersChildExportInfoArray.get(v).getObjDef());
        }
    }
    
    var oIntersectionUsersExportInfoSet = new java.util.HashSet();
    oIntersectionUsersExportInfoSet.addAll(oTesterUsersExportInfoSet);
    oIntersectionUsersExportInfoSet.retainAll(oTestReviewersExportInfoSet);
    
    var aUsernames = new Array();
    var iter = oIntersectionUsersExportInfoSet.iterator();
    while (iter.hasNext()) {
        var oUser = iter.next().getObjDef();
        aUsernames.push(oUser.Name(g_nLoc));
    }

    if (aUsernames.length > 0) {
        szMsg = SPC1 + getString("TEXT_10") + "\r\n";
        for (var i=0; i<aUsernames.length; i++) {
            if (i < aUsernames.length - 1) {szMsg += "\r\n";}
            szMsg += SPC1 + SPC1 + aUsernames[i];
        }
    } 
    return szMsg;
}

function validateConnectedControlsCount(pTestdefinitionExportInfo){
    var aParentExportInfoArray = getParentExportInfoArrayByLink(pTestdefinitionExportInfo, "testdefinitions", "CONTROL");
    return getConnectionCountValidationOutput(OCCURRENCE_MIN_TESTDEFINITION_TO_CONTROLS, OCCURRENCE_MAX_TESTDEFINITION_TO_CONTROLS, pTestdefinitionExportInfo, aParentExportInfoArray, getString("TEXT_8"), SPC1);
}

/*---------------------------------------------------------------------------------------
    Checks if at least one tester group is assigned.
    For all such tester groups it checks if they are assigned to one tester hierarchy 
    element only.
  ---------------------------------------------------------------------------------------*/
function validateConnectedTesterGroupHierarchyAssignment(pTestdefinitionExportInfo){
    
    var szMsg = "";
    
    var aTesterGroupsExportInfoArray = getChildExportInfoArrayByLink(pTestdefinitionExportInfo, "owner_group");
    
    //check the tester group assignments to the tester hierarchy
    var bTesterHierarchyAssigned = false;
    for (var i=0; i<aTesterGroupsExportInfoArray.size(); i++) {
        var aTesterHierarchyExportInfoArray = getParentExportInfoArrayByLink(aTesterGroupsExportInfoArray.get(i), "tester", "HIERARCHY_TESTER");
        
        bTesterHierarchyAssigned = bTesterHierarchyAssigned || aTesterHierarchyExportInfoArray.size() > 0;
        //check if each assigned tester group is assigned to one tester hierarchy element only
        if (aTesterHierarchyExportInfoArray.size() > 1) {
            szMsg += SPC1 + new java.lang.String(getString("TEXT_14")).replaceFirst("%0", aTesterGroupsExportInfoArray.get(i).getObjDef().Name(g_nLoc));
            for (var j=0; j<aTesterHierarchyExportInfoArray.size(); j++){
                szMsg += "\r\n" + SPC2 + aTesterHierarchyExportInfoArray.get(j).getObjDef().Name(g_nLoc);
            }
        }
    }
    
    //check if there is at least one tester group which is assigned to a tester hierarchy element
    if (aTesterGroupsExportInfoArray.size() == 0 || !bTesterHierarchyAssigned) {
        szMsg += SPC1 + getString("TEXT_9");
        return szMsg;
    }
    
    return szMsg;
}

 
