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

        var oQuestionnaireTemplateExportInfoSet = getExportInfoSetByObjectMappingID("QUESTIONNAIRE_TEMPLATE");
        //iterate on the questionnaire templates
        var iter = oQuestionnaireTemplateExportInfoSet.iterator();
        while (iter.hasNext()) {

            var oQuestionnaireTemplateExportInfo = iter.next();
            var oQuestionnaireTemplate = oQuestionnaireTemplateExportInfo.getObjDef();
            var szInnerMsg = "";

            //---- questionnaire template itself
            var sQuestionnaireTemplateErrors = validateQuestionnaireTemplate(oQuestionnaireTemplateExportInfo, oQuestionnaireTemplate, SPC1);
            if (sQuestionnaireTemplateErrors != null && sQuestionnaireTemplateErrors.length > 0) {
                if (szInnerMsg.length > 0) {szInnerMsg += "\r\n" + "\r\n";}
                szInnerMsg += sQuestionnaireTemplateErrors;
            }

            //---- all sections and subsections
            var oFoundSectionsExportInfoSet = new Packages.java.util.HashSet();
            var oFoundQuestionsExportInfoSet = new Packages.java.util.HashSet();

            //determine all sections and questions belonging to the template directly or indirectly
            //search for section cycles
            var sOverallSectionStructureErrors = validateSectionStructure(oQuestionnaireTemplateExportInfo, oFoundSectionsExportInfoSet, oFoundQuestionsExportInfoSet, SPC1);

            //for all sections: output the cycle errors
            if ( (sOverallSectionStructureErrors != null && sOverallSectionStructureErrors.length > 0) ) {
                if (szInnerMsg.length > 0) {szInnerMsg += "\r\n" + "\r\n";}
                szInnerMsg += sOverallSectionStructureErrors;
            }

            //---- now the individual section checks
            for (var it = oFoundSectionsExportInfoSet.iterator(); it.hasNext();) {
                var oSectionExportInfo = it.next();
                var oSection = oSectionExportInfo.getObjDef();

                var sIndiviualCombinedSectionErrors = "";

                //do a check on linked subordinated objects and mandatory fields for each single section
                var sSectionErrors = validateSectionSubordinatesAndMandatoryFields(oSectionExportInfo, oSection, SPC1);
                if (sSectionErrors != null && sSectionErrors.length > 0) {
                    if (sIndiviualCombinedSectionErrors.length > 0) {sIndiviualCombinedSectionErrors += "\r\n" + "\r\n";}
                    sIndiviualCombinedSectionErrors += sSectionErrors;
                }

                //in case of errors at assigned subordinates or mandatory fields:
                //add also header with the section name
                if ( (sIndiviualCombinedSectionErrors != null && sIndiviualCombinedSectionErrors.length > 0) ) {
                    var sSectionHeader = getString("TEXT_4") + " \"" + oSection.Name(g_nLoc) + "\":";
                    sIndiviualCombinedSectionErrors = SPC1 + sSectionHeader + "\r\n"
                                                      + getUnderline(sSectionHeader, SPC1) + "\r\n"
                                                      + sIndiviualCombinedSectionErrors;

                    if (szInnerMsg.length > 0) {szInnerMsg += "\r\n" + "\r\n"}
                    szInnerMsg += sIndiviualCombinedSectionErrors;
                }

            }

            //---- all questions
            var sCombinedQuestionErrors = "";
            for (var it = oFoundQuestionsExportInfoSet.iterator(); it.hasNext();) {
                var oQuestionExportInfo = it.next();
                var sQuestionErrors = validateQuestion(oQuestionExportInfo, SPC1);
                if (sQuestionErrors != null && sQuestionErrors.length > 0) {
                    if (sCombinedQuestionErrors.length > 0) {sCombinedQuestionErrors += "\r\n" + "\r\n";}
                    sCombinedQuestionErrors += sQuestionErrors;
                }
            }
            if (sCombinedQuestionErrors.length > 0) {
                if (szInnerMsg.length > 0) {szInnerMsg += "\r\n" + "\r\n";}
                szInnerMsg += sCombinedQuestionErrors;
            }

            //---- all option sets
            var oFoundOptionSetsExportInfoSet = new Packages.java.util.HashSet();
            for (var it = oFoundQuestionsExportInfoSet.iterator(); it.hasNext();) {
                var oQuestionExportInfo = it.next();
                var aChildExportInfoArray = getChildExportInfoArrayByLink(oQuestionExportInfo, "optionSet");
                oFoundOptionSetsExportInfoSet.addAll(aChildExportInfoArray);
            }

            var sCombinedOptionSetErrors = "";
            for (var it = oFoundOptionSetsExportInfoSet.iterator(); it.hasNext();) {
                var oOptionSetExportInfo = it.next();
                var sOptionSetErrors = validateOptionSet(oOptionSetExportInfo, SPC1);
                if (sOptionSetErrors != null && sOptionSetErrors.length > 0) {
                    if (sCombinedOptionSetErrors.length > 0) {sCombinedOptionSetErrors += "\r\n" + "\r\n";}
                    sCombinedOptionSetErrors += sOptionSetErrors;
                }
            }
            if (sCombinedOptionSetErrors.length > 0) {
                if (szInnerMsg.length > 0) {szInnerMsg += "\r\n" + "\r\n";}
                szInnerMsg += sCombinedOptionSetErrors;
            }

            //---- all options
            var oFoundOptionsExportInfoSet = new Packages.java.util.HashSet();
            for (var it = oFoundOptionSetsExportInfoSet.iterator(); it.hasNext();) {
                var oOptionSetExportInfo = it.next();
                var aChildExportInfoArray = getChildExportInfoArrayByLink(oOptionSetExportInfo, "options");
                oFoundOptionsExportInfoSet.addAll(aChildExportInfoArray);
            }
            for (var it = oFoundQuestionsExportInfoSet.iterator(); it.hasNext();) {
                var oQuestionExportInfo = it.next();
                var aChildExportInfoArray = getChildExportInfoArrayByLink(oQuestionExportInfo, "options");
                oFoundOptionsExportInfoSet.addAll(aChildExportInfoArray);
            }

            var sCombinedOptionErrors = "";
            for (var it = oFoundOptionsExportInfoSet.iterator(); it.hasNext();) {
                var oOptionExportInfo = it.next();
                var sOptionErrors = validateOption(oOptionExportInfo, SPC1);
                if (sOptionErrors != null && sOptionErrors.length > 0) {
                    if (sCombinedOptionErrors.length > 0) {sCombinedOptionErrors += "\r\n" + "\r\n";}
                    sCombinedOptionErrors += sOptionErrors;
                }
            }
            if (sCombinedOptionErrors.length > 0) {
                if (szInnerMsg.length > 0) {szInnerMsg += "\r\n" + "\r\n";}
                szInnerMsg += sCombinedOptionErrors;
            }

            //---- all survey tasks
            var sCombinedSurveyTaskErrors = "";
            var aSurveyTaskExportInfoArray = getParentExportInfoArrayByLink(oQuestionnaireTemplateExportInfo, "questionnaireTemplate", "SURVEYTASK");
            for (var it = aSurveyTaskExportInfoArray.iterator(); it.hasNext(); ) {
                var sSurveyTaskErrors = validateSurveyTask(it.next(), SPC1);
                if (sSurveyTaskErrors != null && sSurveyTaskErrors.length > 0) {
                    if (sCombinedSurveyTaskErrors.length > 0) {sCombinedSurveyTaskErrors += "\r\n" + "\r\n";}
                    sCombinedSurveyTaskErrors += sSurveyTaskErrors;
                }
            }
            if (sCombinedSurveyTaskErrors.length > 0) {
                if (szInnerMsg.length > 0) {szInnerMsg += "\r\n" + "\r\n";}
                szInnerMsg += sCombinedSurveyTaskErrors;
            }


            //---- add header in case of errors
            if (!szInnerMsg.equals("")){
                var szQuestionnaireTemplateInfo = new java.lang.String(getString("TEXT_2") ).replaceFirst("%0", oQuestionnaireTemplate.Name(g_nLoc));
                var sCompleteSingleQuestionnaireTemplateOutput = addObjectValidationInfo(szQuestionnaireTemplateInfo, szInnerMsg, oQuestionnaireTemplate, SPC1);
                szOutput = addCompleteObjectValidationOutput(szOutput, sCompleteSingleQuestionnaireTemplateOutput);
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

//---------
function validateQuestionnaireTemplate(p_oQuestionnaireTemplateExportInfo, p_oQuestionnaireTemplate, p_sSPC) {

    var szMsg = "";

    //mandatory fields
    var sMandatoriesMsg = "";
    var aMandatories = getMandatoryFieldsForQuestionnaireTemplates();
    sMandatoriesMsg = validateMandatoryObjectAttributes(p_oQuestionnaireTemplate, aMandatories, p_sSPC);

    if (!sMandatoriesMsg.equals("")){
        szMsg = addSingleValidationOutput(sMandatoriesMsg, szMsg);
    }

    //linked sections
    var sLinkedSectionsMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oQuestionnaireTemplateExportInfo, "sections");
    sLinkedSectionsMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_QUESTIONNAIRE_TEMPLATE_TO_SECTION, SM_OCCURRENCE_MAX_QUESTIONNAIRE_TEMPLATE_TO_SECTION, p_oQuestionnaireTemplateExportInfo, aChildExportInfoArray, getString("TEXT_5"), SPC1);
    if (!sLinkedSectionsMsg.equals("")) {
        szMsg = addSingleValidationOutput(sLinkedSectionsMsg, szMsg);
    }

	//linked survey tasks
    var sLinkedSurveyTasksMsg = "";
    var aParentExportInfoArray = getParentExportInfoArrayByLink(p_oQuestionnaireTemplateExportInfo, "questionnaireTemplate", "SURVEYTASK");
    sLinkedSurveyTasksMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_QUESTIONNAIRE_TEMPLATE_TO_SURVEYTASK, SM_OCCURRENCE_MAX_QUESTIONNAIRE_TEMPLATE_TO_SURVEYTASK, p_oQuestionnaireTemplateExportInfo, aParentExportInfoArray, getString("TEXT_18"), SPC1);
    if (!sLinkedSurveyTasksMsg.equals("")) {
        szMsg = addSingleValidationOutput(sLinkedSurveyTasksMsg, szMsg);
    }

    if (szMsg.length > 0) {szMsg += "\r\n";}
    return szMsg;
}

//---------
//checks for cycles in the section structure
function validateSectionStructure(p_oQuestionnaireTemplateExportInfo, p_oFoundSectionsExportInfoSet, p_oFoundQuestionsExportInfoSet, p_sSPC) {

    var aSectionCycleErrors = new Array();

    var aTopSectionsExportInfos = getChildExportInfoArrayByLink(p_oQuestionnaireTemplateExportInfo, "sections");
    if (aTopSectionsExportInfos.size() > 0) {
        var oRecursiveFoundSectionsExportInfoSet = new Packages.java.util.HashSet();
        var oSectionExportInfoStack = new Packages.java.util.Stack();
        for (var it = aTopSectionsExportInfos.iterator(); it.hasNext(); ) {
             //recursice check for section cycles (and collecting the questions)
            checkSectionCyclesRecursively(it.next(), oRecursiveFoundSectionsExportInfoSet, p_oFoundQuestionsExportInfoSet, oSectionExportInfoStack, aSectionCycleErrors);
        }
    }

    //if cycle errors were found
    var sCycleErrorString = "";
    for (var i=0; i<aSectionCycleErrors.length; i++) {
        if (sCycleErrorString.length > 0) {sCycleErrorString += "\r\n";}
        sCycleErrorString += p_sSPC + aSectionCycleErrors[i];
    }
    if (sCycleErrorString.length > 0) {
        sCycleErrorString = p_sSPC + getString("TEXT_3") + "\r\n" + sCycleErrorString;
    }

    return sCycleErrorString;
}

//---------
function checkSectionCyclesRecursively(p_oSectionExportInfo, p_oRecursiveFoundSectionsExportInfoSet, p_oFoundQuestionsExportInfoSet, p_oSectionExportInfoStack, p_aSectionCycleErrors) {

    //first collect all questions at the section - they are not important for cycle checks but are checked themselves later
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oSectionExportInfo, "questions");
    p_oFoundQuestionsExportInfoSet.addAll(aChildExportInfoArray);

    //if section is in the stack of already handled sections then we have a cycle
    if (p_oSectionExportInfoStack.contains(p_oSectionExportInfo)) {
        var sCycleMessage = createCycleMessage(p_oSectionExportInfo, p_oSectionExportInfoStack);
        p_aSectionCycleErrors.push(SPC1 + sCycleMessage);
        return;
    }

    //Add it to the set of found sections...
    p_oRecursiveFoundSectionsExportInfoSet.add(p_oSectionExportInfo);

    //...put it on the stack...
    var oSectionExportInfoStack = new Packages.java.util.Stack();
    oSectionExportInfoStack.addAll(p_oSectionExportInfoStack);
    oSectionExportInfoStack.push(p_oSectionExportInfo);

    //...check all sub sections recursively
    var aSubSectionExportInfos = getChildExportInfoArrayByLink(p_oSectionExportInfo, "subSections");
    for (var it = aSubSectionExportInfos.iterator(); it.hasNext();) {
        checkSectionCyclesRecursively(it.next(), p_oRecursiveFoundSectionsExportInfoSet, p_oFoundQuestionsExportInfoSet, oSectionExportInfoStack, p_aSectionCycleErrors);
    }
}


function createCycleMessage(p_oSectionExportInfo, p_oSectionExportInfoStack) {
    //make sure that the cycle text starts and ends with the same element
    p_oSectionExportInfoStack.push(p_oSectionExportInfo);
    var sCycleMessage = "";
    var bCycleBeginningReached = false;
    for (var it = p_oSectionExportInfoStack.iterator(); it.hasNext(); ) {

        var oStackItem = it.next();
        bCycleBeginningReached = bCycleBeginningReached || oStackItem.getObjDef().equals(p_oSectionExportInfo.getObjDef());
        if (!bCycleBeginningReached) {continue;}

        if (sCycleMessage.length > 0) {sCycleMessage += " - ";}
        sCycleMessage += " " + getString("TEXT_5") + " '" + oStackItem.getObjDef().Name(g_nLoc) + "'";
    }
    return sCycleMessage;
}


//---------
function validateSectionSubordinatesAndMandatoryFields(p_oSectionExportInfo, p_oSection, p_sSPC) {

    var szMsg = "";

    //mandatory fields
    var sMandatoriesMsg = "";
    var aMandatories = getMandatoryFieldsForSections();
    sMandatoriesMsg = validateMandatoryObjectAttributes(p_oSection, aMandatories, p_sSPC);

    if (!sMandatoriesMsg.equals("")){
        szMsg = sMandatoriesMsg;
    }
    if (szMsg.length > 0) {szMsg += "\r\n";}

    //linked subordinated objects
    var sLinkedSectionsMsg = "";
    var aChildSectionExportInfoArray = getChildExportInfoArrayByLink(p_oSectionExportInfo, "subSections");
    sLinkedSectionsMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_SECTION_TO_SUBSECTION, SM_OCCURRENCE_MAX_SECTION_TO_SUBSECTION, p_oSectionExportInfo, aChildSectionExportInfoArray, getString("TEXT_5"), SPC1);
    if (!sLinkedSectionsMsg.equals("")) {
        szMsg += sLinkedSectionsMsg;
    }
    if (szMsg.length > 0) {szMsg += "\r\n";}

    var sLinkedQuestionsMsg = "";
    var aChildQuestionExportInfoArray = getChildExportInfoArrayByLink(p_oSectionExportInfo, "questions");
    sLinkedQuestionsMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_SECTION_TO_QUESTION, SM_OCCURRENCE_MAX_SECTION_TO_QUESTION, p_oSectionExportInfo, aChildQuestionExportInfoArray, getString("TEXT_7"), SPC1);
    if (!sLinkedQuestionsMsg.equals("")) {
        szMsg += sLinkedQuestionsMsg;
    }
    if (szMsg.length > 0) {szMsg += "\r\n";}

    return szMsg;
}

//---------
function validateQuestion(p_oQuestionExportInfo, p_sSPC) {

    var szMsg = "";

    var oQuestion = p_oQuestionExportInfo.getObjDef();

    //---- mandatory fields
    var sMandatoriesMsg = "";
    var aMandatories = getMandatoryFieldsForQuestions();
    sMandatoriesMsg = validateMandatoryObjectAttributes(oQuestion, aMandatories, p_sSPC);

    if (!sMandatoriesMsg.equals("")){
        szMsg = sMandatoriesMsg;
    }

    //linked objects
    var sLinkedOptionSetsMsg = "";
    var aChildOptionSetExportInfoArray = getChildExportInfoArrayByLink(p_oQuestionExportInfo, "optionSet");
    sLinkedOptionSetsMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_QUESTION_TO_OPTIONSET, SM_OCCURRENCE_MAX_QUESTION_TO_OPTIONSET, p_oQuestionExportInfo, aChildOptionSetExportInfoArray, getString("TEXT_9"), SPC1);
    if (!sLinkedOptionSetsMsg.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedOptionSetsMsg;
    }

    var sLinkedOptionsMsg = "";
    var aChildOptionExportInfoArray = getChildExportInfoArrayByLink(p_oQuestionExportInfo, "options");
    sLinkedOptionSetsMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_QUESTION_TO_OPTION, SM_OCCURRENCE_MAX_QUESTION_TO_OPTION, p_oQuestionExportInfo, aChildOptionExportInfoArray, getString("TEXT_11"), SPC1);
    if (!sLinkedOptionsMsg.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedOptionsMsg;
    }

    var oQuestionTypeAttribute = oQuestion.Attribute( Constants.AT_QUESTION_TYPE, g_nLoc);
    var iUnitTypeNum = oQuestionTypeAttribute.MeasureUnitTypeNum();
    var iSingleChoiceItemTypeNum =  Constants.AVT_SINGLE_CHOICE;
    var iMultipleChoiceItemTypeNum = Constants.AVT_MULTIPLE_CHOICE;

    //---- error if question is of type "single choice" or "multiple choice" but neither OptionSets nor Options are assigned
    if ( (iUnitTypeNum == iSingleChoiceItemTypeNum || iUnitTypeNum == iMultipleChoiceItemTypeNum)
        && aChildOptionSetExportInfoArray.size() == 0 && aChildOptionExportInfoArray.size() == 0) {

        szMsg = addSingleValidationOutput(getString("TEXT_16"), szMsg, p_sSPC);
    }

    //---- error if both OptionSets and Options are assigned
    if (aChildOptionSetExportInfoArray.size() > 0 && aChildOptionExportInfoArray.size() > 0) {

        szMsg = addSingleValidationOutput(getString("TEXT_12"), szMsg, p_sSPC);
    }

    var iReviewerRatesAnswerTypeNum = Constants.AT_REVIEWER_RATES_ANSWER;

    if (oQuestionTypeAttribute.IsMaintained()) {

        if ( (aChildOptionSetExportInfoArray.size() > 0 || aChildOptionExportInfoArray.size() > 0) ) {

            //---- "reviewer rates answer" is not allowed to be true if the question is of type "single choice" or "multiple choice"
            if ( isSingleOrMultiOptionType(oQuestion)
                && isboolattributetrue(oQuestion, iReviewerRatesAnswerTypeNum, g_nLoc) ) {

                szMsg = addSingleValidationOutput(getString("TEXT_13"), szMsg, p_sSPC);
            }

            //---- "reviewer rates answer" is not allowed to be false if the question type differs from "single choice" and "multiple choice"
            if ( !isSingleOrMultiOptionType(oQuestion)
                && !(isboolattributetrue(oQuestion, iReviewerRatesAnswerTypeNum, g_nLoc)) ) {

                szMsg = addSingleValidationOutput(getString("TEXT_13"), szMsg, p_sSPC);
            }
        }
        else {

            //if there are neither option set nor options assigned then "reviewer rates answer" is not allowed to be "true"
            if (isboolattributetrue(oQuestion, iReviewerRatesAnswerTypeNum, g_nLoc)) {
                szMsg = addSingleValidationOutput(getString("TEXT_17"), szMsg, p_sSPC);
            }
        }
    }

    //in case of errors add header with the question text in AT_DESC; if not maintained then use AT_NAME as fallback
    if (szMsg.length > 0) {
        var sQuestionIdentifier = oQuestion.Attribute(Constants.AT_DESC, g_nLoc).getValue();
		if (!oQuestion.Attribute(Constants.AT_DESC, g_nLoc).IsMaintained()) {
			sQuestionIdentifier = oQuestion.Attribute(Constants.AT_NAME, g_nLoc).getValue();
		}
        var sQuestionHeader = getString("TEXT_6") + " \"" + sQuestionIdentifier + "\":";
        szMsg = p_sSPC + sQuestionHeader + "\r\n"
                + getUnderline(sQuestionHeader, p_sSPC) + "\r\n"
                + szMsg + "\r\n";
    }

    return szMsg;
}

function isSingleOrMultiOptionType(p_oQuestion) {
    var oQuestionTypeAttribute = p_oQuestion.Attribute( Constants.AT_QUESTION_TYPE, g_nLoc);
    var iUnitTypeNum = oQuestionTypeAttribute.MeasureUnitTypeNum();
    var iSingleChoiceItemTypeNum =  Constants.AVT_SINGLE_CHOICE;
    var iMultipleChoiceItemTypeNum = Constants.AVT_MULTIPLE_CHOICE;
    return iUnitTypeNum == iSingleChoiceItemTypeNum || iUnitTypeNum == iMultipleChoiceItemTypeNum;
}

//---------
function validateOptionSet(p_oOptionSetExportInfo, p_sSPC) {

    var szMsg = "";

    var p_oOptionSet = p_oOptionSetExportInfo.getObjDef();

    //mandatory fields
    var sMandatoriesMsg = "";
    var aMandatories = getMandatoryFieldsForOptionSets();
    sMandatoriesMsg = validateMandatoryObjectAttributes(p_oOptionSet, aMandatories, p_sSPC);

    if (!sMandatoriesMsg.equals("")){
        szMsg = sMandatoriesMsg;
    }

    //linked objects
    var sLinkedOptionsMsg = "";
    var aChildOptionExportInfoArray = getChildExportInfoArrayByLink(p_oOptionSetExportInfo, "options");
    sLinkedOptionsMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_OPTIONSET_TO_OPTION, SM_OCCURRENCE_MAX_OPTIONSET_TO_OPTION, p_oOptionSetExportInfo, aChildOptionExportInfoArray, getString("TEXT_11"), SPC1);
    if (!sLinkedOptionsMsg.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedOptionsMsg;
    }

    //in case of errors add header with the option set name
    if (szMsg.length > 0) {
        var sOptionSetHeader = getString("TEXT_8") + " \"" + p_oOptionSet.Name(g_nLoc) + "\":";
        szMsg = p_sSPC + sOptionSetHeader + "\r\n"
                + getUnderline(sOptionSetHeader, p_sSPC) + "\r\n"
                + szMsg + "\r\n";
    }

    return szMsg;
}

//---------
function validateOption(p_oOptionExportInfo, p_sSPC) {

    var szMsg = "";

    var oOption = p_oOptionExportInfo.getObjDef();

    //mandatory fields
    var sMandatoriesMsg = "";
    var aMandatories = getMandatoryFieldsForOptions();
    sMandatoriesMsg = validateMandatoryObjectAttributes(oOption, aMandatories, p_sSPC);

    if (!sMandatoriesMsg.equals("")){
        szMsg = sMandatoriesMsg;
    }

    //in case of errors add header with the option name
    if (szMsg.length > 0) {
        var sOptionHeader = getString("TEXT_10") + " \"" + oOption.Name(g_nLoc) + "\":";
        szMsg = p_sSPC + sOptionHeader + "\r\n"
                + getUnderline(sOptionHeader, p_sSPC) + "\r\n"
                + szMsg + "\r\n";
    }

    return szMsg;
}

//---------
function validateSurveyTask(p_oSurveyTaskExportInfo, p_sSPC) {

	var szMsg = "";

    var oSurveyTask = p_oSurveyTaskExportInfo.getObjDef();

	//mandatory fields
    var sMandatoriesMsg = "";
    var aMandatories = getMandatoryFieldsForSurveyTasks();
	sMandatoriesMsg = validateMandatoryObjectAttributes(oSurveyTask, aMandatories, p_sSPC);
    sMandatoriesMsg = addSingleValidationOutput( validateSurveyTaskFrequencyDependentAttributes(oSurveyTask, SPC1), sMandatoriesMsg );

    if (!sMandatoriesMsg.equals("")){
        szMsg = sMandatoriesMsg;
    }

	//check if end date is before start date
    var sStartEndDateMessage = validateStartEndDate(oSurveyTask, Constants.AT_SURVEYTASK_START_DATE, Constants.AT_SURVEYTASK_END_DATE, p_sSPC);
	if (!sStartEndDateMessage.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sStartEndDateMessage;
    }

	//linked objects
	var sLinkedQuestionnaireTemplatesMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oSurveyTaskExportInfo, "questionnaireTemplate");
    sLinkedQuestionnaireTemplatesMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_SURVEYTASK_TO_QUESTIONNAIRE_TEMPLATE, SM_OCCURRENCE_MAX_SURVEYTASK_TO_QUESTIONNAIRE_TEMPLATE, p_oSurveyTaskExportInfo, aChildExportInfoArray, getString("TEXT_19"), SPC1);
    if (!sLinkedQuestionnaireTemplatesMsg.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedQuestionnaireTemplatesMsg;
    }

    var sLinkedQuestionnaireOwnersMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oSurveyTaskExportInfo, "owner_group");
    sLinkedQuestionnaireOwnersMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_SURVEYTASK_TO_QUESTIONNAIREOWNER, SM_OCCURRENCE_MAX_SURVEYTASK_TO_QUESTIONNAIREOWNER, p_oSurveyTaskExportInfo, aChildExportInfoArray, getString("TEXT_20"), SPC1);
    if (!sLinkedQuestionnaireOwnersMsg.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedQuestionnaireOwnersMsg;
    }

    var sLinkedSurveyReviewersMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oSurveyTaskExportInfo, "reviewer_group");
    sLinkedSurveyReviewersMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_SURVEYTASK_TO_SURVEYREVIEWER, SM_OCCURRENCE_MAX_SURVEYTASK_TO_SURVEYREVIEWER, p_oSurveyTaskExportInfo, aChildExportInfoArray, getString("TEXT_21"), SPC1);
    if (!sLinkedSurveyReviewersMsg.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedSurveyReviewersMsg;
    }

	var sLinkedSurveyManagerMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oSurveyTaskExportInfo, "manager_group");
    sLinkedSurveyManagerMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_SURVEYTASK_TO_SURVEYMANAGER, SM_OCCURRENCE_MAX_SURVEYTASK_TO_SURVEYMANAGER, p_oSurveyTaskExportInfo, aChildExportInfoArray, getString("TEXT_31"), SPC1);
    if (!sLinkedSurveyManagerMsg.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedSurveyManagerMsg;
    }

	var sLinkedRisksMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oSurveyTaskExportInfo, "risks");
    sLinkedRisksMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_SURVEYTASK_TO_RISK, SM_OCCURRENCE_MAX_SURVEYTASK_TO_RISK, p_oSurveyTaskExportInfo, aChildExportInfoArray, getString("TEXT_22"), SPC1);
    if (!sLinkedRisksMsg.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedRisksMsg;
    }

	var sLinkedControlsMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oSurveyTaskExportInfo, "controls");
    sLinkedControlsMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_SURVEYTASK_TO_CONTROL, SM_OCCURRENCE_MAX_SURVEYTASK_TO_CONTROL, p_oSurveyTaskExportInfo, aChildExportInfoArray, getString("TEXT_23"), SPC1);
    if (!sLinkedControlsMsg.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedControlsMsg;
    }

	var sLinkedTestdefinitionsMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oSurveyTaskExportInfo, "test_definitions");
    sLinkedTestdefinitionsMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_SURVEYTASK_TO_TESTDEFINITION, SM_OCCURRENCE_MAX_SURVEYTASK_TO_TESTDEFINITION, p_oSurveyTaskExportInfo, aChildExportInfoArray, getString("TEXT_24"), SPC1);
    if (!sLinkedTestdefinitionsMsg.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedTestdefinitionsMsg;
    }

	var sLinkedAppSysTypesMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oSurveyTaskExportInfo, "relatedAppSystems");
    sLinkedAppSysTypesMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_SURVEYTASK_TO_APPSYS, SM_OCCURRENCE_MAX_SURVEYTASK_TO_APPSYS, p_oSurveyTaskExportInfo, aChildExportInfoArray, getString("TEXT_25"), SPC1);
    if (!sLinkedAppSysTypesMsg.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedAppSysTypesMsg;
    }

	var sLinkedRegulationsMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oSurveyTaskExportInfo, "relatedRegulations");
    sLinkedRegulationsMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_SURVEYTASK_TO_REGULATION, SM_OCCURRENCE_MAX_SURVEYTASK_TO_REGULATION, p_oSurveyTaskExportInfo, aChildExportInfoArray, getString("TEXT_26"), SPC1);
    if (!sLinkedRegulationsMsg.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedRegulationsMsg;
    }

	var sLinkedOrgUnitsMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oSurveyTaskExportInfo, "relatedOrgunits");
    sLinkedOrgUnitsMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_SURVEYTASK_TO_ORGANIZATION, SM_OCCURRENCE_MAX_SURVEYTASK_TO_ORGANIZATION, p_oSurveyTaskExportInfo, aChildExportInfoArray, getString("TEXT_27"), SPC1);
    if (!sLinkedOrgUnitsMsg.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedOrgUnitsMsg;
    }

	var sLinkedProcessesMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oSurveyTaskExportInfo, "relatedProcesses");
    sLinkedProcessesMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_SURVEYTASK_TO_PROCESS, SM_OCCURRENCE_MAX_SURVEYTASK_TO_PROCESS, p_oSurveyTaskExportInfo, aChildExportInfoArray, getString("TEXT_28"), SPC1);
    if (!sLinkedProcessesMsg.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedProcessesMsg;
    }

	var sLinkedRiskCategoriesMsg = "";
    var aChildExportInfoArray = getChildExportInfoArrayByLink(p_oSurveyTaskExportInfo, "relatedCategories");
    sLinkedRiskCategoriesMsg = getConnectionCountValidationOutput(SM_OCCURRENCE_MIN_SURVEYTASK_TO_RISKCAT, SM_OCCURRENCE_MAX_SURVEYTASK_TO_RISKCAT, p_oSurveyTaskExportInfo, aChildExportInfoArray, getString("TEXT_29"), SPC1);
    if (!sLinkedRiskCategoriesMsg.equals("")) {
        if (szMsg != "") {szMsg += "\r\n" + "\r\n";}
        szMsg += sLinkedRiskCategoriesMsg;
    }

	//in case of errors add header with the survey task name
    if (szMsg.length > 0) {
        var sOptionHeader = getString("TEXT_30") + " \"" + p_oSurveyTask.Name(g_nLoc) + "\":";
        szMsg = p_sSPC + sOptionHeader + "\r\n"
                + getUnderline(sOptionHeader, p_sSPC) + "\r\n"
                + szMsg + "\r\n";
    }

	return szMsg;
}

function validateSurveyTaskFrequencyDependentAttributes(p_oSurveyTask, p_sSPC) {
    var szMsg = "";
    if ( p_oSurveyTask.Attribute(Constants.AT_SURVEYTASK_FREQUENCY, g_nLoc).MeasureUnitTypeNum() != Constants.AVT_EVENT_DRIVEN ) {
        var aMandatoryConditions = splitString('AT_SURVEYTASK_DURATION,AT_SURVEYTASK_START_DATE');
        szMsg = validateMandatoryObjectAttributes(p_oSurveyTask, aMandatoryConditions, p_sSPC, null);
    }
    return szMsg;
}
