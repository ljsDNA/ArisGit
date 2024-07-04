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

var g_datePeriodCache      = new java.util.HashMap();     // global cache of calculated date periods - Format: ObjDef | DatePeriodContainer
    
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
        
        var oAuditTemplateExportInfoSet = getExportInfoSetByObjectMappingID("AUDITTEMPLATE");
        //iterate on the audit templates
        var iter = oAuditTemplateExportInfoSet.iterator();
        while (iter.hasNext()) {
            
            var oAuditTemplateExportInfo = iter.next();
            var oAuditTemplate = oAuditTemplateExportInfo.getObjDef();
            var szInnerMsg = "";
            
            //---- audit template itself
            var sAuditTemplateErrors = validateAuditTemplate(oAuditTemplateExportInfo, SPC1);
            if (sAuditTemplateErrors != null && sAuditTemplateErrors.length > 0) {
                if (szInnerMsg.length > 0) {szInnerMsg += "\r\n" + "\r\n";}
                szInnerMsg += sAuditTemplateErrors;
            }
            
            //---- all steps and substeps
            var oFoundStepsExportInfoSet = new Packages.java.util.HashSet();
            //determine all steps beloning to the template directly or indirectly
            //and search for cycles
            var sOverallStepStructureErrors = validateStepStructure(oAuditTemplateExportInfo, oFoundStepsExportInfoSet, SPC1);
            if ( sOverallStepStructureErrors != null && sOverallStepStructureErrors.length > 0 ) {
                if (szInnerMsg.length > 0) {szInnerMsg += "\r\n" + "\r\n";}
                szInnerMsg += sOverallStepStructureErrors;
            }
            
            //now the individual step checks
            var sOverallStepParentErrors = "";
            for (var it = oFoundStepsExportInfoSet.iterator(); it.hasNext();) {
                var oStepExportInfo = it.next();
                
                //do a check on linked parents for each single step
                var sIndiviualCombinedStepErrors = "";
                
                var sStepParentErrors = validateStepParents(oStepExportInfo, SPC1);
                if (sStepParentErrors != null && sStepParentErrors.length > 0) {
                    if (sIndiviualCombinedStepErrors.length > 0) {sIndiviualCombinedStepErrors += "\r\n" + "\r\n";}
                    sIndiviualCombinedStepErrors += sStepParentErrors;
                    
                    sOverallStepParentErrors += sStepParentErrors;
                }
                
                //do a check on linked subordinated objects and mandatory fields for each single step
                var sStepErrors = validateStepSubordinatesAndMandatoryFields(oStepExportInfo, oAuditTemplateExportInfo, SPC1);
                if (sStepErrors != null && sStepErrors.length > 0) {
                    if (sIndiviualCombinedStepErrors.length > 0) {sIndiviualCombinedStepErrors += "\r\n" + "\r\n";}
                    sIndiviualCombinedStepErrors += sStepErrors;
                }
                
                
                //in case of errors at assigned parent, subordinates or mandatory fields:
                //add also header with the section name
                if ( (sIndiviualCombinedStepErrors != null && sIndiviualCombinedStepErrors.length > 0) ) {
                    var sStepHeader = getString("TEXT_2") + " \"" + oStepExportInfo.getObjDef().Name(g_nLoc) + "\":";
                    sIndiviualCombinedStepErrors = SPC1 + sStepHeader + "\r\n"
                                                      + getUnderline(sStepHeader, SPC1) + "\r\n"
                                                      + sIndiviualCombinedStepErrors;
                    
                    if (szInnerMsg.length > 0) {szInnerMsg += "\r\n" + "\r\n"}
                    szInnerMsg += sIndiviualCombinedStepErrors;
                }
            }
            
            //---- add header in case of errors
            if (!szInnerMsg.equals("")){
                var szAuditTemplateInfo = new java.lang.String(getString("TEXT_10")).replaceFirst("%", oAuditTemplate.Name(g_nLoc));
                var sCompleteSingleAuditTemplateOutput = addObjectValidationInfo(szAuditTemplateInfo, szInnerMsg, oAuditTemplate, SPC1);
                szOutput = addCompleteObjectValidationOutput(szOutput, sCompleteSingleAuditTemplateOutput);
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

//---------
function validateAuditTemplate(p_oAuditTemplateExportInfo, p_sSPC) {

    var szMsg = "";
    
    var oAuditTemplate = p_oAuditTemplateExportInfo.getObjDef();
    
    //mandatory fields
    var sMandatoriesMsg = "";
    var aMandatories = getMandatoryFieldsForAuditTemplates();
    sMandatoriesMsg = validateMandatoryObjectAttributes(oAuditTemplate, aMandatories, p_sSPC);
        
    if (!sMandatoriesMsg.equals("")){
        szMsg = sMandatoriesMsg;
    }
    
    //duration attribute AT_MAX_TL_TIME must be filled with an value different from 0000:00:00:00
    for (var i=0; i<aMandatories.length; i++) {
        if (aMandatories[i] != "AT_MAX_TL_TIME") {continue;}
        var oAttribute = oAuditTemplate.Attribute(Constants.AT_MAX_TL_TIME , g_nLoc);
        var durationValue = oAttribute.getValue();
        if (durationValue == "0000:00:00:00") {
            szMsg = p_sSPC + oAttribute.Type() + " " + getString("COMMON_10");
        }
    }
    
    //preparation start date must not lie within audit period
    var aModels = getProjectScheduleModelWithObjDefOccurrence(oAuditTemplate);
    if (aModels != null && aModels.length > 0) {
        var auditDatePeriodContainer = calculateDatePeriod(aModels[0], oAuditTemplate, oAuditTemplate.OccListInModel(aModels[0])[0] );
        if (auditDatePeriodContainer != null) {
			var auditPreparationStartDate = oAuditTemplate.Attribute(Constants.AT_START_DATE_OF_AUDIT_PREPARATION, g_nLoc).MeasureValue();
			if ((auditPreparationStartDate != null) && (auditDatePeriodContainer.startDate != null)) {
				if ( auditDatePeriodContainer.startDate.compareTo(auditPreparationStartDate) < 0) {
					if (szMsg.length > 0) {szMsg += "\r\n" + "\r\n";}
						szMsg += p_sSPC + getString("TEXT_16");
				}
			}
		}
    }      
    
	//control period start date must lie before control prtiod end date
	var sStartEndDateMessage = validateStartEndDate(oAuditTemplate, Constants.AT_START_DATE_OF_CONTROL_PERIOD, Constants.AT_END_DATE_OF_CONTROL_PERIOD, SPC1);
	if (!sStartEndDateMessage.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sStartEndDateMessage;
    }
    
    //linked subordinated objects
    var sLinkedTopStepsMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oAuditTemplateExportInfo, "steps");
    sLinkedTopStepsMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_AUDIT_TEMPLATE_TO_TOP_STEP, SM_OCCURRENCE_MAX_AUDIT_TEMPLATE_TO_TOP_STEP, p_oAuditTemplateExportInfo, aChildExportInfoArray, getString("TEXT_2"), SPC1);
    if (!sLinkedTopStepsMsg.equals("")) {
        if (szMsg.length > 0) {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedTopStepsMsg;
    }
    
    var sLinkedOwnersMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oAuditTemplateExportInfo, "owner_group");
    sLinkedOwnersMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_AUDIT_TEMPLATE_TO_AUDITOWNER, SM_OCCURRENCE_MAX_AUDIT_TEMPLATE_TO_AUDITOWNER, p_oAuditTemplateExportInfo, aChildExportInfoArray, getString("TEXT_3"), SPC1);
    if (!sLinkedOwnersMsg.equals("")) {
        if (szMsg.length > 0) {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedOwnersMsg;
    }
    
    var sLinkedReviewersMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oAuditTemplateExportInfo, "reviewer_group");
    sLinkedReviewersMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_AUDIT_TEMPLATE_TO_AUDITREVIEWER, SM_OCCURRENCE_MAX_AUDIT_TEMPLATE_TO_AUDITREVIEWER, p_oAuditTemplateExportInfo, aChildExportInfoArray, getString("TEXT_4"), SPC1);
    if (!sLinkedReviewersMsg.equals("")) {
        if (szMsg.length > 0) {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedReviewersMsg;
    }
    
    var sLinkedAuditorsMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oAuditTemplateExportInfo, "auditor_group");
    sLinkedAuditorsMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_AUDIT_TEMPLATE_TO_AUDITAUDITOR, SM_OCCURRENCE_MAX_AUDIT_TEMPLATE_TO_AUDITAUDITOR, p_oAuditTemplateExportInfo, aChildExportInfoArray, getString("TEXT_5"), SPC1);
    if (!sLinkedAuditorsMsg.equals("")) {
        if (szMsg.length > 0) {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedAuditorsMsg;
    }
    
    //linked scope
    var sLinkedScopesMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oAuditTemplateExportInfo, "scope");
    if (aChildExportInfoArray.size() > 1) {
        if (szMsg.length > 0) {szMsg += "\r\n" + "\r\n";}
        szMsg += p_sSPC + getString("TEXT_15");
        for (var i=0; i<aChildExportInfoArray.size(); i++) {
            szMsg += "\r\n" + p_sSPC + SPC1 + aChildExportInfoArray.get(i).getObjDef().Name(g_nLoc);
        }
    }
    
    return szMsg;
}

//---------
//checks for cycles in the section structure
function validateStepStructure(p_oAuditTemplateExportInfo, p_oFoundStepsExportInfoSet, p_sSPC) {

    var aStepCycleErrors = new Array();
    
    var aAssignedStepsExportInfoArray = getChildExportInfoArrayByLink(p_oAuditTemplateExportInfo, "steps");
    if (aAssignedStepsExportInfoArray.size() > 0) {
        var oFoundStepsExportInfoSet = new Packages.java.util.HashSet();
        var oStepExportInfoStack = new Packages.java.util.Stack();       
        for (var i=0; i<aAssignedStepsExportInfoArray.size(); i++) {
            checkStepCyclesRecursively(aAssignedStepsExportInfoArray.get(i), oFoundStepsExportInfoSet, oStepExportInfoStack, aStepCycleErrors);
        }
        p_oFoundStepsExportInfoSet.addAll(oFoundStepsExportInfoSet);
    }
    
    //if errors were found
    var sCycleErrorString = "";
    for (var i=0; i<aStepCycleErrors.length; i++) {
        if (sCycleErrorString.length > 0) {sCycleErrorString += "\r\n";}
        sCycleErrorString += p_sSPC + aStepCycleErrors[i];
    }
    if (sCycleErrorString.length > 0) {
        sCycleErrorString = p_sSPC + getString("TEXT_6") + "\r\n" + sCycleErrorString;
    }
    
    return sCycleErrorString;    
}
//---------
function checkStepCyclesRecursively(p_oStepExportInfo, p_oFoundStepsExportInfoSet, p_oStepExportInfoStack, p_aStepCycleErrors) {
    
    //if step is in the set of already handled steps then we have a cycle
    if (!p_oFoundStepsExportInfoSet.add(p_oStepExportInfo)) {
        var sCycleMessage = "";
        var bCycleBeginningReached = false;
        for (var it = p_oStepExportInfoStack.iterator(); it.hasNext(); ) {
            
            var oStackItem = it.next();
            bCycleBeginningReached = bCycleBeginningReached || oStackItem.equals(p_oStepExportInfo);
            if (!bCycleBeginningReached) {continue;}
            
            if (sCycleMessage.length > 0) {sCycleMessage += " - ";}
            sCycleMessage += oStackItem.Name(g_nLoc);
        }
        
        p_aStepCycleErrors.push(SPC1 + sCycleMessage);
        return;
    }
    
    //if not then put it on the stack...
    p_oStepExportInfoStack.push(p_oStepExportInfo);
    
    //...and check all children recursively...
    var aSubStepsExportInfoArray = getChildExportInfoArrayByLink(p_oStepExportInfo, "steps");
    for (var i=0; i<aSubStepsExportInfoArray.size(); i++) {
        checkStepCyclesRecursively(aSubStepsExportInfoArray.get(i), p_oFoundStepsExportInfoSet, p_oStepExportInfoStack, p_aStepCycleErrors);    
    }
    
    //...then remove from stack after recursion
    p_oStepExportInfoStack.pop();    
}

//---------
function validateStepParents(oStepExportInfo, p_sSPC) {
    
    var szMsg = "";
    
    //linked questionnaire templates
    var aParentAuditTemplateExportInfoArray = getParentExportInfoArrayByLink(oStepExportInfo, "steps", "AUDITTEMPLATE");
    if (aParentAuditTemplateExportInfoArray.size() > 1) {
        szMsg = p_sSPC + getString("TEXT_7");
        for (var i=0; i<aParentAuditTemplateExportInfoArray.size(); i++) {
            szMsg += "\r\n" + p_sSPC + SPC1 + aParentAuditTemplateExportInfoArray.get(i).getObjDef().Name(g_nLoc);
        }
    }
    
    //linkes superior steps
    var aParentAuditStepTemplateExportInfoArray = getParentExportInfoArrayByLink(oStepExportInfo, "steps", "AUDITSTEPTEMPLATE");
    if (aParentAuditStepTemplateExportInfoArray.size() > 1) {
        szMsg = p_sSPC + getString("TEXT_8");
        for (var i=0; i<aParentAuditStepTemplateExportInfoArray.size(); i++) {
            szMsg += "\r\n" + p_sSPC + SPC1 + aParentAuditStepTemplateExportInfoArray.get(i).getObjDef().Name(g_nLoc);
        }
    }

    return szMsg;    
}

//---------
function validateStepSubordinatesAndMandatoryFields(oStepExportInfo, p_oAuditTemplateExportInfo, p_sSPC) {
    
    var szMsg = "";
    
    var oStep = oStepExportInfo.getObjDef();
    
    //mandatory fields
    var sMandatoriesMsg = "";
    var aMandatories = getMandatoryFieldsForAuditStepTemplates();
    sMandatoriesMsg = validateMandatoryObjectAttributes(oStep, aMandatories, p_sSPC);
        
    if (!sMandatoriesMsg.equals("")){
        szMsg = sMandatoriesMsg;
    }
    
    //duration attributes AT_MAX_TL_TIME and AT_DES_PROC_TIME must be filled with an value different from 00:00:00
    for (var i=0; i<aMandatories.length; i++) {
        if (aMandatories[i] != "AT_MAX_TL_TIME" && aMandatories[i] != "AT_DES_PROC_TIME") {continue;}
        var durationValue;
        if (aMandatories[i] == "AT_MAX_TL_TIME") {  
            var oAttribute = oStep.Attribute(Constants.AT_MAX_TL_TIME , g_nLoc);
            var durationValue = oAttribute.getValue();
            if (durationValue == "0000:00:00:00") {
                szMsg = p_sSPC + oAttribute.Type() + " " + getString("COMMON_10");
            }
        }
        if (aMandatories[i] == "AT_DES_PROC_TIME") {
            var oAttribute = oStep.Attribute(Constants.AT_DES_PROC_TIME , g_nLoc);
            var durationValue = oAttribute.getValue();
            if (durationValue == "0000:00:00:00") {
                szMsg = p_sSPC + oAttribute.Type() + " " + getString("COMMON_10");
            }
        }
    }
    
    //linked subordinated objects
    var sLinkedStepOwnersMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(oStepExportInfo, "owner_group");
    sLinkedStepOwnersMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_AUDIT_STEP_TEMPLATE_TO_AUDITSTEPOWNER, SM_OCCURRENCE_MAX_AUDIT_STEP_TEMPLATE_TO_AUDITSTEPOWNER, oStepExportInfo, aChildExportInfoArray, getString("TEXT_9"), SPC1);
    if (!sLinkedStepOwnersMsg.equals("")) {
        if (szMsg.length > 0) {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedStepOwnersMsg;
    }
    
    //step may have only one single occurence inside a project schedule model
    var aModels = getProjectScheduleModelWithObjDefOccurrence(oStep);
    var szOccurrenceMsg = validateObjectUniquenessOverModels( oStep, getString("TEXT_2"), aModels, SPC1 );
    if (!szOccurrenceMsg.equals("")) {
        if (szMsg.length > 0) {szMsg += "\r\n" + "\r\n";}
        szMsg += szOccurrenceMsg;
    }

    //if there is only one occurrence then check if the "Start date"/"End date" period lies within the period of the superior step template or audit template
    if (aModels.length == 1) {
        
        var oAuditTemplate = p_oAuditTemplateExportInfo.getObjDef();
        var auditTemplateDatePeriodContainer = calculateDatePeriod(aModels[0], oAuditTemplate, oAuditTemplate.OccListInModel(aModels[0])[0]);
        
        var szDatePeriodMsg = validateDatePeriods(aModels[0], oStep, auditTemplateDatePeriodContainer, SPC1);
        if (!szDatePeriodMsg.equals("")) { 
            if (szMsg.length > 0) {szMsg += "\r\n" + "\r\n";}
            szMsg += szDatePeriodMsg;
        }
    }
    
    //"Desired processing time" must not be greater than "Maximum total time"
    var datePeriodContainer = g_datePeriodCache.get(oStep); //cache was filled during execution of validateDatePeriods()
    if (oStep.Attribute( eval("Constants.AT_MAX_TL_TIME" ), g_nLoc).IsMaintained()
        && oStep.Attribute( eval("Constants.AT_DES_PROC_TIME" ), g_nLoc).IsMaintained() ) {
        
        var sDurationStringValue = oStep.Attribute( eval("Constants.AT_MAX_TL_TIME" ) , g_nLoc).GetValue(false);
        var lMaxTimeInMillis = getAttrValue_Duration(sDurationStringValue);
        
        var sDurationStringValue = oStep.Attribute( eval("Constants.AT_DES_PROC_TIME" ) , g_nLoc).GetValue(false);
        var lPlannedTimeInMillis = getAttrValue_Duration(sDurationStringValue);
        
        if (lPlannedTimeInMillis > lMaxTimeInMillis) {
            if (szMsg.length > 0) {szMsg += "\r\n" + "\r\n";}
            szMsg += p_sSPC + getString("TEXT_17");
        }
    }
    
    //linked scope
    var sLinkedScopesMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(oStepExportInfo, "scope");
    if (aChildExportInfoArray.size() > 1) {
        if (szMsg.length > 0) {szMsg += "\r\n" + "\r\n";}
        szMsg += p_sSPC + getString("TEXT_15");
        for (var i=0; i<aChildExportInfoArray.size(); i++) {
            szMsg += "\r\n" + p_sSPC + SPC1 + aChildExportInfoArray.get(i).getObjDef().Name(g_nLoc);
        }
    }
    
    return szMsg;    
}

function validateDatePeriods(p_oModel, p_oStep, p_auditTemplateDatePeriodContainer, p_sSPC) {
    
    var szMsg = "";
    
    if (p_auditTemplateDatePeriodContainer == null) {return szMsg;}
	if (p_auditTemplateDatePeriodContainer.startDate == null) {return szMsg;}
    if (p_auditTemplateDatePeriodContainer.endDate == null) {return szMsg;}
    
    var datePeriodContainer = calculateDatePeriod(p_oModel, p_oStep, p_oStep.OccListInModel(p_oModel)[0] );
    if (datePeriodContainer == null) {return szMsg;}
	if (datePeriodContainer.startDate == null) {return szMsg;}
    if (datePeriodContainer.endDate == null) {return szMsg;}
    
	//check the date periods for p_oStep and its superior ObjDef
    if ( datePeriodContainer.startDate.compareTo(p_auditTemplateDatePeriodContainer.startDate) < 0
         || datePeriodContainer.endDate.compareTo(p_auditTemplateDatePeriodContainer.endDate) > 0) {

        var dateFormatter = new java.text.SimpleDateFormat(getString("TEXT_14"));
        
        if (szMsg.length > 0) {szMsg += "\r\n" + "\r\n";}
        szMsg += p_sSPC + getString("TEXT_11");
        szMsg += "\r\n" + p_sSPC + getString("TEXT_12") + " " + dateFormatter.format(datePeriodContainer.startDate) + " - " + dateFormatter.format(datePeriodContainer.endDate);
        szMsg += "\r\n" + p_sSPC + getString("TEXT_13") + " " + dateFormatter.format(p_auditTemplateDatePeriodContainer.startDate) + " - " + dateFormatter.format(p_auditTemplateDatePeriodContainer.endDate);
    }
    
    return szMsg;
}

//---------
function getProjectScheduleModelWithObjDefOccurrence(p_oObjDef) {
    var aObjOccs = p_oObjDef.OccList();
    var aModels = new Array();
    for (var i=0; i<aObjOccs.length; i++) {
        if ( aObjOccs[i].Model().TypeNum() == Constants.MT_PROJECT_SCHEDULE ) {
            aModels.push( aObjOccs[i].Model() );
        }
    }
    return aModels;
}

//---------
function DatePeriodContainer( startDate, endDate ) {    
    this.startDate = startDate;
    this.endDate = endDate;   
}

function calculateDatePeriod(oModel, oObjDef, oObjOcc) {
    
    if (oModel == null || oObjDef == null || oObjOcc == null) {
        return null;
    }
    
    //check if the calculation was already done for this oObjDef
    if (g_datePeriodCache.get(oObjDef) != null) {
        return g_datePeriodCache.get(oObjDef);
    }
    
    var aLanes = oModel.GetLanes(Constants.LANE_VERTICAL);
    var oOccLane = null;
    for (var i=0; i<aLanes.length; i++) {
        if (aLanes[i].IsObjOccOfLane(oObjOcc)) {
            oOccLane = aLanes[i];
            break;
        }
    }
    if (oOccLane == null) {
        return;
    }
    
    var iStartdateAttributeTypeNum = oOccLane.Attribute(Constants.AT_POSITION_ATTR, g_nLoc).MeasureValue(); //Date attribute       - 369 - Attribut AT_DATE_START ("Start date")
    var iDurationAttributeTypeNum     = oOccLane.Attribute(Constants.AT_SIZE_ATTR, g_nLoc).MeasureValue();  //Duration attribute   - 718 - Attribut AT_MAX_TL_TIME ("Maximum total time")
    
    var oStartDate = null; // Date object
    if (iStartdateAttributeTypeNum > 0) {
        oStartDate = oObjDef.Attribute(iStartdateAttributeTypeNum, g_nLoc).MeasureValue();   
    }
    var oEndDate = null;   // Calculated Date object
    if (iDurationAttributeTypeNum > 0) {
        oEndDate = oObjDef.getEndDate(iStartdateAttributeTypeNum, iDurationAttributeTypeNum, g_nLoc);
    }
    
    var datePeriodContainer = new DatePeriodContainer();
    datePeriodContainer.startDate = oStartDate;
    datePeriodContainer.endDate = oEndDate;
    
    //update cache
    g_datePeriodCache.put(oObjDef, datePeriodContainer);
    
    return datePeriodContainer;
}

function calculateEndDate(startDate, duration, durationUnit) {
    
    var calendar = java.util.Calendar.getInstance();
    calendar.setTime(startDate);
    
    var millis = duration;
    switch (durationUnit) {  
        case Constants.AVT_YEARS:
            millis = millis * 12; 
        case Constants.AVT_MON:
            millis = millis * 365;
        case Constants.AVT_DAYS:
            millis = millis * 24; 
        case Constants.AVT_HRS:
            millis = millis * 60;
        case Constants.AVT_MINS:
            millis = millis * 60;
        case Constants.AVT_SECS:
            millis = millis * 1000;
    }
    var millisSum = calendar.getTimeInMillis() + millis;
    calendar.setTimeInMillis(millisSum);
    return calendar.getTime();
}

/*---------------------------------------------------------------------------------------
    Reads the String attribute value of a duration attribute and converts it in
    timeInMillis since 1970 as String.
---------------------------------------------------------------------------------------*/
function getAttrValue_Duration(sDurationValue) {

    var mults = new Array(1, 60, 3600, 86400);
    
    sDurationValue = sDurationValue.trim();
    if (sDurationValue == null || sDurationValue.length() == 0) {return 0;}
    
    var timeInMillis = 0;
    var tokenList = java.util.Arrays.asList(sDurationValue.split(":"));
    if(tokenList.isEmpty()) {return 0;}
    java.util.Collections.reverse(tokenList);//seconds always first

    for(var i=0; i<Math.min(tokenList.size(), 4); i++) {
        timeInMillis += java.lang.Long.parseLong(tokenList.get(i)) * mults[i];
    }

    return timeInMillis * 1000;    
}
