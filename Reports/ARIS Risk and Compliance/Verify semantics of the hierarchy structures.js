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

//Stores all error messages for the hierarchy elements; reused for all hierarchy types - Format: ObjDef | JSArray <String>
var g_hierarchyElement2Messages = new java.util.HashMap();
var g_alreadyProcessedHierarchyGUIDs = new java.util.HashSet();

var HIERARCHYTYPE_ORGUNIT                   = "HIERARCHYTYPE_ORGUNIT";
var HIERARCHYTYPE_REGULATION                = "HIERARCHYTYPE_REGULATION";
var HIERARCHYTYPE_PROCESS                   = "HIERARCHYTYPE_PROCESS";
var HIERARCHYTYPE_TESTER                    = "HIERARCHYTYPE_TESTER";
var HIERARCHYTYPE_APPLICATIONSYSTEMTYPE     = "HIERARCHYTYPE_APPLICATIONSYSTEMTYPE";
var HIERARCHYTYPE_RISKCATEGORY              = "HIERARCHYTYPE_RISKCATEGORY";

//---------------------------------------------------------------
              
var HEADER_REGULATION     		= getString("TEXT_2");
var HEADER_PROCESS              = getString("TEXT_3");
var HEADER_ORGANIZATION         = getString("TEXT_4");
var HEADER_TESTER               = getString("TEXT_5");
var HEADER_APPSYS               = getString("TEXT_6");
var HEADER_RISKCAT              = getString("TEXT_7");

var HEADER_ERROR_PARENT         = getString("TEXT_8");
var HEADER_ERROR_MANDATORY      = getString("TEXT_9");
var HEADER_ERROR_MULTIPLEGROUPS = getString("TEXT_10");
var HEADER_ERROR_CYCLE          = getString("TEXT_13");

//---------------------------------------------------------------

try {
    main();
}
catch(ex) {
    Context.setProperty("exception", ex.fileName + ":" + ex.lineNumber + ": " + ex);
}

function main() {
    
    // TODO refactor g_aTopologicalSortingMessages to be a HashMap of messages separated by *ARCM hierarchy enum type*
    // (because the mapping fur regulation hierarchy will compose them of 5 different mapping objects)
    // -> then they can be reused here
    
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
        sCheckResult = checkHierarchy(HIERARCHYTYPE_ORGUNIT, SPC1);
		szOutput = concatMessageStrings(szOutput, sCheckResult);
        
        sCheckResult = checkHierarchy(HIERARCHYTYPE_REGULATION, SPC1);
		szOutput = concatMessageStrings(szOutput, sCheckResult);
        
        sCheckResult = checkHierarchy(HIERARCHYTYPE_PROCESS, SPC1);
		szOutput = concatMessageStrings(szOutput, sCheckResult);
        
        sCheckResult = checkHierarchy(HIERARCHYTYPE_TESTER, SPC1);
        szOutput = concatMessageStrings(szOutput, sCheckResult);
        
        sCheckResult = checkHierarchy(HIERARCHYTYPE_APPLICATIONSYSTEMTYPE, SPC1);
		szOutput = concatMessageStrings(szOutput, sCheckResult);
        
        sCheckResult = checkHierarchy(HIERARCHYTYPE_RISKCATEGORY, SPC1);
        szOutput = concatMessageStrings(szOutput, sCheckResult);
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

function concatMessageStrings(pOverallString, pPartialString) {
    if (pPartialString == null || pPartialString.length == 0) {return pOverallString;}
    if (pOverallString == null) {return pPartialString;}
    if (pOverallString.length > 0) {pOverallString += "\r\n" + "\r\n" + "\r\n";}
    return pOverallString + pPartialString;
}


//-------------------------------------------------------------------------------------
//--------------------------------- Validates  ----------------------------------------

function checkHierarchy(pHierarchyType, pSPC) {

	//reset messages
	g_hierarchyElement2Messages = new java.util.HashMap();

	g_alreadyProcessedHierarchyGUIDs = new java.util.HashSet();
    
	sHeaderString = "";
	var oHierarchyElementExportInfoSet = new java.util.HashSet();
	if (pHierarchyType == HIERARCHYTYPE_REGULATION) {
        oHierarchyElementExportInfoSet.addAll(getExportInfoSetByObjectMappingID("HIERARCHY_REGULATION"));
		sHeaderString = HEADER_REGULATION;
	}
	if (pHierarchyType == HIERARCHYTYPE_ORGUNIT) {
        oHierarchyElementExportInfoSet.addAll(getExportInfoSetByObjectMappingID("HIERARCHY_ORGUNIT"));
		sHeaderString = HEADER_ORGANIZATION;
	}
	if (pHierarchyType == HIERARCHYTYPE_PROCESS) {
        oHierarchyElementExportInfoSet.addAll(getExportInfoSetByObjectMappingID("HIERARCHY_PROCESS"));
		sHeaderString = HEADER_PROCESS;
	}
	if (pHierarchyType == HIERARCHYTYPE_TESTER) {
        oHierarchyElementExportInfoSet.addAll(getExportInfoSetByObjectMappingID("HIERARCHY_TESTER"));
		sHeaderString = HEADER_TESTER;
	}
	if (pHierarchyType == HIERARCHYTYPE_APPLICATIONSYSTEMTYPE) {
        oHierarchyElementExportInfoSet.addAll(getExportInfoSetByObjectMappingID("HIERARCHY_APPSYSTYPE_TYPE"));
        oHierarchyElementExportInfoSet.addAll(getExportInfoSetByObjectMappingID("HIERARCHY_APPSYSTYPE_CLASS"));
		sHeaderString = HEADER_APPSYS;
	}
	if (pHierarchyType == HIERARCHYTYPE_RISKCATEGORY) {
		oHierarchyElementExportInfoSet.addAll(getExportInfoSetByObjectMappingID("HIERARCHY_RISKCAT"));
		sHeaderString = HEADER_RISKCAT;
	}
    
    //HIERARCHY_DATA was never checked...
	
	//check all elements and generate error messages
	var aHierarchyElementExportInfos = convertHashSetToJSArray(oHierarchyElementExportInfoSet);
	for (var i=0; i<aHierarchyElementExportInfos.length; i++) {
		checkHierarchyElement(aHierarchyElementExportInfos[i], pHierarchyType, new java.util.ArrayList(), pSPC);
	}
	
	//combine all element messages
	var sCompleteHierarchyMessage = "";
	//element messages
	for (var j=0; j<aHierarchyElementExportInfos.length; j++) {
		var aElementMessages = g_hierarchyElement2Messages.get(aHierarchyElementExportInfos[j].getObjDef());
        if (aElementMessages == null || aElementMessages.length == 0) {continue;}
        
        var sCompleteElementMessageString = "";
        for (var k=0; k<aElementMessages.length; k++) {
            if (sCompleteElementMessageString != "") {sCompleteElementMessageString += "\r\n" + "\r\n";}
            if (k == 0) {sCompleteElementMessageString += "\r\n";}
            sCompleteElementMessageString += aElementMessages[k]; 
        }
        
        if (sCompleteHierarchyMessage != "") {sCompleteHierarchyMessage += "\r\n" + "\r\n";}
        sCompleteHierarchyMessage += sCompleteElementMessageString;
	}

    if (!(sCompleteHierarchyMessage.length == 0)) {
        sCompleteHierarchyMessage = sHeaderString + sCompleteHierarchyMessage;
    }
	
	return sCompleteHierarchyMessage;
}

function checkHierarchyElement(pHierarchyElementExportInfo, pHierarchyType, pCycleList, pSPC) {
    
    var pHierarchyElement = pHierarchyElementExportInfo.getObjDef();
    
    var aHierarchyMessages = new Array();
    var bCycleDetected = false;
    //if already contained in cycle then generate a cycle error message
    if (pCycleList.contains(pHierarchyElement)) {
        
        var sCycleMessage = pSPC + HEADER_ERROR_CYCLE;
        var aCycleListArray = convertHashSetToJSArray(pCycleList);
        //start at the cycle beginning which must be the current pHierarchyElement
        while (!aCycleListArray[0].equals(pHierarchyElement)) {aCycleListArray.shift();}
        
        for (var i=0; i<aCycleListArray.length; i++) {
            sCycleMessage   += "\r\n" + pSPC + aCycleListArray[i].Type() + " - " + aCycleListArray[i].Name(g_nLoc);
            sCycleMessage   += "\r\n" + pSPC + SPC1 + getString("TEXT_11");
            sCycleMessage   += "\r\n" + pSPC + SPC2 + getString("TEXT_12") + " " + aCycleListArray[i].Group().Path(g_nLoc);                
        }
        aHierarchyMessages.push(sCycleMessage);
        bCycleDetected = true;
    }
    
    //skip already processed elements except there is a cycle
    if ( !bCycleDetected && g_alreadyProcessedHierarchyGUIDs.contains(pHierarchyElement.GUID()) ) {return;}
	
    //validate mandatory attributes
    var sAttributeMsg = validateMandatoryAttributes(pHierarchyElement, pHierarchyType, pSPC);
    if (sAttributeMsg.length > 0) {
        aHierarchyMessages.push(sAttributeMsg);
    }
    
    
	//change review start and end date (not maintained for other hierarchy types, therefore not checked by validateStartEndDate())
	var sStartEndDateMessage = validateStartEndDate(pHierarchyElement, Constants.AT_REVIEW_START_DATE, Constants.AT_REVIEW_END_DATE, pSPC);
	if (sStartEndDateMessage.length > 0) {
		aHierarchyMessages.push(sStartEndDateMessage);
	}

    //validate connected groups
	var sGroupMessage = checkConnectedGroups(pHierarchyElementExportInfo, pHierarchyType, pSPC);
    if (sGroupMessage.length > 0) {
        aHierarchyMessages.push(sGroupMessage);
    }

    //check direct parents
    var oParentExportInfoArray = getHierarchicalParentExportInfoArrayByLink(pHierarchyElementExportInfo, "children");
	if (oParentExportInfoArray.size() > 1) {
        var sParentsMessage = pSPC + HEADER_ERROR_PARENT;
        for (var j=0; j<oParentExportInfoArray.size(); j++) {
            if (j > 0) {sParentsMessage += "\r\n";}
            var oParent = oParentExportInfoArray.get(j).getObjDef();
            sParentsMessage   += pSPC + SPC1 + oParent.Type() + " - " + oParent.Name(g_nLoc);
            sParentsMessage   += "\r\n" + pSPC + SPC2 + getString("TEXT_11");
            sParentsMessage   += "\r\n" + pSPC + SPC3 + getString("TEXT_12") + " " + oParent.Group().Path(g_nLoc);
        }
        aHierarchyMessages.push(sParentsMessage);
    }
    
    //add the message which hierarchy element is meant
    if (aHierarchyMessages.length > 0) {
        var sElementTitleMessage    = pSPC + pHierarchyElement.Type() + " - " + pHierarchyElement.Name(g_nLoc);
        sElementTitleMessage        += "\r\n" + pSPC + "----------------------------------------";
        sElementTitleMessage        += "\r\n" + pSPC + getString("TEXT_11");
        sElementTitleMessage        += "\r\n" + pSPC + SPC1 + getString("TEXT_12") + " " + pHierarchyElement.Group().Path(g_nLoc);

        aHierarchyMessages.unshift(sElementTitleMessage);
        g_hierarchyElement2Messages.put(pHierarchyElement, aHierarchyMessages);
    }
    
    //store error messages and cycle info before processing the parents
    pCycleList.add(pHierarchyElement);
    g_alreadyProcessedHierarchyGUIDs.add(pHierarchyElement.GUID());
    
    //no recursion in case of an detected cycle
    if (bCycleDetected) {return;}
    
    //recursion for all direct parents
    for (var k=0; k<oParentExportInfoArray.size(); k++) {
		var recursionCycleList = new java.util.ArrayList(pCycleList);
		checkHierarchyElement(oParentExportInfoArray.get(k), pHierarchyType, recursionCycleList, pSPC);
	}
    
}

function checkConnectedGroups(pHierarchyElementExportInfo, pHierarchyType, pSPC) {
    var pHierarchyElement = pHierarchyElementExportInfo.getObjDef();
    
    var sMessage = "";
    var sConnectionMessage = "";
    var aConnectedGroups;
    
    //always check hierarchy owner groups
    var aChildExportInfoArray = getChildExportInfoArrayByLink(pHierarchyElementExportInfo, "owner_group");
	//for regulations where AT_REVIEW_RELEVANT is set to "true" there must be assigned at least one hierarchy owner group
	if ( pHierarchyType == HIERARCHYTYPE_REGULATION && isboolattributetrue(pHierarchyElement, Constants.AT_REVIEW_RELEVANT, g_nLoc) ) {
		sConnectionMessage = getConnectionCountValidationOutput(1, OCCURRENCE_MAX_HIERARCHYOWNERGROUPS_TO_HIERARCHY, pHierarchyElementExportInfo, aChildExportInfoArray, getString("TEXT_18"), pSPC);
		sMessage = addSingleValidationOutput( sConnectionMessage, sMessage );
	}
	//in all other cases use the defined min value from semantic properties
	else {
		sConnectionMessage = getConnectionCountValidationOutput(OCCURRENCE_MIN_HIERARCHYOWNERGROUPS_TO_HIERARCHY, OCCURRENCE_MAX_HIERARCHYOWNERGROUPS_TO_HIERARCHY, pHierarchyElementExportInfo, aChildExportInfoArray, getString("TEXT_18"), pSPC);
		sMessage = addSingleValidationOutput( sConnectionMessage, sMessage );
	}
    
    //always check assigned test auditor groups
    aChildExportInfoArray = getChildExportInfoArrayByLink(pHierarchyElementExportInfo, "testauditor");
    sConnectionMessage = getConnectionCountValidationOutput(OCCURRENCE_MIN_TESTAUDITORGROUPS_TO_HIERARCHY, OCCURRENCE_MAX_TESTAUDITORGROUPS_TO_HIERARCHY, pHierarchyElementExportInfo, aChildExportInfoArray, getString("TEXT_15"), pSPC);
    sMessage = addSingleValidationOutput( sConnectionMessage, sMessage );

    //always check signoff owner groups except for risk category hierarchy and application systme type hierarchy
    if (pHierarchyType != HIERARCHYTYPE_RISKCATEGORY && pHierarchyType != HIERARCHYTYPE_APPLICATIONSYSTEMTYPE) {
        aChildExportInfoArray = getChildExportInfoArrayByLink(pHierarchyElementExportInfo, "so_owner");
        sConnectionMessage = getConnectionCountValidationOutput(OCCURRENCE_MIN_SIGNOFFOWNERGROUPS_TO_HIERARCHY, OCCURRENCE_MAX_SIGNOFFOWNERGROUPS_TO_HIERARCHY, pHierarchyElementExportInfo, aChildExportInfoArray, getString("TEXT_16"), pSPC);
        sMessage = addSingleValidationOutput( sConnectionMessage, sMessage );
    }
    //check assigned tester groups only for tester hierarchy
    if (pHierarchyType == HIERARCHYTYPE_TESTER) {
        aChildExportInfoArray = getChildExportInfoArrayByLink(pHierarchyElementExportInfo, "tester");
        sConnectionMessage = getConnectionCountValidationOutput(OCCURRENCE_MIN_TESTERGROUPS_TO_HIERARCHY, OCCURRENCE_MAX_TESTERGROUPS_TO_HIERARCHY, pHierarchyElementExportInfo, aChildExportInfoArray, getString("TEXT_17"), pSPC);
        sMessage = addSingleValidationOutput( sConnectionMessage, sMessage );
    }

	return sMessage;
}

function validateMandatoryAttributes(pObject, pHierarchyType, pSPC){
    var szMsg = "";
    var aMandatories = null;
     //Test management
    if (pHierarchyType.equals("HIERARCHYTYPE_REGULATION")){
        aMandatories = getMandatoryFieldsForHierarchyRegulation();   
    }
    if (pHierarchyType.equals("HIERARCHYTYPE_PROCESS")){
        aMandatories = getMandatoryFieldsForHierarchyProcess();
    }
    else if (pHierarchyType.equals("HIERARCHYTYPE_ORGUNIT")){
        aMandatories = getMandatoryFieldsForHierarchyOrganization(); 
    }
    else if (pHierarchyType.equals("HIERARCHYTYPE_TESTER")){
        aMandatories = getMandatoryFieldsForHierarchyTester();  
    }
    else if (pHierarchyType.equals("HIERARCHYTYPE_APPLICATIONSYSTEMTYPE")){
        aMandatories = getMandatoryFieldsForHierarchyAppSys();  
    }
    else if (pHierarchyType.equals("HIERARCHYTYPE_RISKCATEGORY")){
        aMandatories = getMandatoryFieldsForHierarchyRiskCat();  
    }
    
    if (aMandatories != null) {       
        szMsg = validateMandatoryObjectAttributes(pObject, aMandatories, SPC1, HEADER_ERROR_MANDATORY);
    }
    return szMsg; 
}
