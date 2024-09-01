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

//Report category where the separate semantic reports are stored
var gSemanticReportCategory = "ARCMExport-SemanticsReport";

var OCCURRENCE_INFINITE = 999999; // use for x .. n - relations

//***************************************************************************************
// Public ADMINISTRATION Attributes free for Customization 
//***************************************************************************************

var MANDATORY_FIELDS_USER =
	"AT_LOGIN," +
    "AT_FIRST_NAME," +
    "AT_LAST_NAME," +
    "AT_EMAIL_ADDR";

var MANDATORY_FIELDS_USERGROUP = 
    "AT_NAME";

var OCCURRENCE_MIN_USER_TO_GROUPS    = 0;
var OCCURRENCE_MAX_USER_TO_GROUPS    = OCCURRENCE_INFINITE;

var OCCURRENCE_MIN_HIERARCHYOWNERGROUPS_TO_HIERARCHY    = 0;
var OCCURRENCE_MAX_HIERARCHYOWNERGROUPS_TO_HIERARCHY    = 1;
var OCCURRENCE_MIN_TESTAUDITORGROUPS_TO_HIERARCHY       = 0;
var OCCURRENCE_MAX_TESTAUDITORGROUPS_TO_HIERARCHY       = OCCURRENCE_INFINITE;
var OCCURRENCE_MIN_SIGNOFFOWNERGROUPS_TO_HIERARCHY  	= 0;
var OCCURRENCE_MAX_SIGNOFFOWNERGROUPS_TO_HIERARCHY  	= 1;
var OCCURRENCE_MIN_TESTERGROUPS_TO_HIERARCHY        	= 0;
var OCCURRENCE_MAX_TESTERGROUPS_TO_HIERARCHY        	= OCCURRENCE_INFINITE;


//********************************************************************************************
// Public HIERARCHY and CHANGE Management Attributes free for Customization (Test management)
//********************************************************************************************
var MANDATORY_FIELDS_HIERARCHY_REGULATION                   	= "AT_NAME"
                                                                  + ",!AT_REVIEW_RELEVANT|AT_REVIEW_RELEVANT[AT_REVIEW_FREQUENCY_1]"
                                                                  + ",!AT_REVIEW_RELEVANT|AT_REVIEW_RELEVANT[AT_REVIEW_START_DATE]"
                                                                  + ",!AT_REVIEW_RELEVANT|AT_REVIEW_RELEVANT[AT_REVIEW_EXECUTION_TIME_LIMIT]";
var MANDATORY_FIELDS_HIERARCHY_PROCESS                          = "AT_NAME";
var MANDATORY_FIELDS_HIERARCHY_ORGANIZATION                     = "AT_NAME";
var MANDATORY_FIELDS_HIERARCHY_TESTER                           = "AT_NAME";

var MANDATORY_FIELDS_HIERARCHY_APPSYS                           = "AT_NAME";
var MANDATORY_FIELDS_HIERARCHY_RISKCAT                          = "AT_NAME";
var RM_MANDATORY_FIELDS_HIERARCHY_REGULATION              		= "AT_NAME";
var RM_MANDATORY_FIELDS_HIERARCHY_ORGANIZATION	                = "AT_NAME";


//***************************************************************************************
// Public COMPLIANCE Management Attributes free for Customization (Test management)
//***************************************************************************************
var MANDATORY_FIELDS_RISK = 
    "AT_NAME";
    
var MANDATORY_FIELDS_CONTROL =
    "AT_NAME";

var MANDATORY_FIELDS_CONTROL_EXECUTION_TASK =
    "AT_NAME," +
    "AT_CTRL_EXECUTION_TASK_FREQUENCY," +
    "AT_CTRL_EXECUTION_TASK_CTRL_PERIOD"
    //Only if frequency is "event-driven" -> handled internally in control execution task semantic report
    /*
     + ",AT_CTRL_EXECUTION_TASK_DURATION," +
    "AT_CTRL_EXECUTION_TASK_START_DATE"
    */
    ;
    
var MANDATORY_FIELDS_TESTDEFINITION = 
    "AT_NAME," +
    "AT_AAM_TEST_TYPE_DESIGN|AT_AAM_TEST_TYPE_EFFECTIVENESS," +
    "AT_AAM_TEST_FREQUENCY," +
    "AT_AAM_TESTDEF_CTRL_PERIOD";
    //Only if frequency is "event-driven" -> handled internally in testdefinition semantic report
    /*
     + ",AT_AAM_TEST_DURATION[Range 1..365]," +
    "AT_AAM_TESTDEF_START_DATE"
    */

 
var RELEVANT_MODELS_RISK            = "MT_BUSY_CONTR_DGM";
var RELEVANT_MODELS_CONTROL         = "MT_BUSY_CONTR_DGM";
var RELEVANT_MODELS_TESTDEFINITION  = "MT_BUSY_CONTR_DGM";
var RELEVANT_MODELS_USER            = "MT_ORG_CHRT";
var RELEVANT_MODELS_USERGROUP       = "MT_ORG_CHRT";

var RELEVANT_MODELS_HIERARCHY_PROCESSES         = "MT_EEPC,MT_VAL_ADD_CHN_DGM,MT_FUNC_ALLOC_DGM";
var RELEVANT_MODELS_HIERARCHY_ORGAUNIT          = "MT_ORG_CHRT";  // also used for TESTER - Hierarchy
var RELEVANT_MODELS_HIERARCHY_REGULATION  		= "MT_TECH_TRM_MDL";

// definition of the relation kinds
var OCCURRENCE_MIN_RISK_TO_FUNCTION          = 0;
var OCCURRENCE_MAX_RISK_TO_FUNCTION          = OCCURRENCE_INFINITE;
var OCCURRENCE_MIN_RISK_TO_RISKMANAGER       = 0;
var OCCURRENCE_MAX_RISK_TO_RISKMANAGER       = 1;
var OCCURRENCE_MIN_RISK_TO_CONTROL           = 0;
var OCCURRENCE_MAX_RISK_TO_CONTROL           = OCCURRENCE_INFINITE;
//Only if risk type is "Regulation" -> handled internally in risk semantic report
var OCCURRENCE_MIN_RISK_TO_REGULATION     = 0;
var OCCURRENCE_MAX_RISK_TO_REGULATION     = OCCURRENCE_INFINITE;

var OCCURRENCE_MIN_CONTROL_TO_REGULATION     	= 0;
var OCCURRENCE_MAX_CONTROL_TO_REGULATION		= OCCURRENCE_INFINITE;
var OCCURRENCE_MIN_CONTROL_TO_FUNCTION          = 0;
var OCCURRENCE_MAX_CONTROL_TO_FUNCTION          = OCCURRENCE_INFINITE;

var OCCURRENCE_MIN_CONTROL_TO_TESTDEFINITIONS = 1;
var OCCURRENCE_MAX_CONTROL_TO_TESTDEFINITIONS = OCCURRENCE_INFINITE;
var OCCURRENCE_MIN_CONTROL_TO_CONTROLMANAGER  = 0;
var OCCURRENCE_MAX_CONTROL_TO_CONTROLMANAGER  = 1;

var OCCURRENCE_MIN_CONTROL_TO_RISKS           = 0;
var OCCURRENCE_MAX_CONTROL_TO_RISKS           = OCCURRENCE_INFINITE;


// Control management (control execution task)
var OCCURRENCE_MIN_CONTROLEXECUTIONTASK_TO_CONTROL  = 0;
var OCCURRENCE_MAX_CONTROLEXECUTIONTASK_TO_CONTROL  = 1;
var OCCURRENCE_MIN_CONTROLEXECUTIONTASK_TO_CONTROLEXECUTIONOWNER = 1;
var OCCURRENCE_MAX_CONTROLEXECUTIONTASK_TO_CONTROLEXECUTIONOWNER = 1;
var OCCURRENCE_MIN_CONTROLEXECUTIONTASK_TO_ORGUNIT = 1;
var OCCURRENCE_MAX_CONTROLEXECUTIONTASK_TO_ORGUNIT = 1;

var OCCURRENCE_MIN_TESTDEFINITION_TO_ORGAUNITS      = 1;
var OCCURRENCE_MAX_TESTDEFINITION_TO_ORGAUNITS      = 1;
var OCCURRENCE_MIN_TESTDEFINITION_TO_TESTMANAGER    = 0;
var OCCURRENCE_MAX_TESTDEFINITION_TO_TESTMANAGER    = 1;
var OCCURRENCE_MIN_TESTDEFINITION_TO_TESTER         = 1;
var OCCURRENCE_MAX_TESTDEFINITION_TO_TESTER         = 1;
var OCCURRENCE_MIN_TESTDEFINITION_TO_TESTREVIEWER   = 1;
var OCCURRENCE_MAX_TESTDEFINITION_TO_TESTREVIEWER   = 1;
var OCCURRENCE_MIN_TESTDEFINITION_TO_CONTROLS       = 1;
var OCCURRENCE_MAX_TESTDEFINITION_TO_CONTROLS       = 1;


// defined if assignment check between tester groups and tester hierarchy is performed or not
var TESTER_GROUPS_ASSIGNMENT_TESTER_HIERARCHY_PERFORM = true;



//***************************************************************************************
// Public RISK Management Attributes free for Customization 
//***************************************************************************************
var RM_MANDATORY_FIELDS_RISK = "AT_NAME";
var RM_OCCURRENCE_MIN_RISK_TO_RISKOWNER     = 1;
var RM_OCCURRENCE_MAX_RISK_TO_RISKOWNER     = 1;
var RM_OCCURRENCE_MIN_RISK_TO_RISKREVIEWER  = 1;
var RM_OCCURRENCE_MAX_RISK_TO_RISKREVIEWER  = 1;



//***************************************************************************************
// Public SURVEY Management Attributes free for Customization 
//***************************************************************************************
var SM_MANDATORY_FIELD_QUESTIONNAIRE_TEMPLATE = "AT_NAME";
var SM_MANDATORY_FIELD_SECTION = "AT_NAME";
var SM_MANDATORY_FIELD_QUESTION = "AT_DESC,AT_QUESTION_TYPE";
var SM_MANDATORY_FIELD_OPTIONSET = "AT_NAME";
var SM_MANDATORY_FIELD_OPTION = "AT_NAME";
var SM_MANDATORY_FIELD_SURVEYTASK = "AT_SURVEYTASK_FREQUENCY";
    //Only if frequency is "event-driven" -> handled internally in survey task semantic report
    /*
     + ",AT_SURVEYTASK_DURATION," +
    "AT_SURVEYTASK_START_DATE"
    */

var SM_OCCURRENCE_MIN_QUESTIONNAIRE_TEMPLATE_TO_SECTION = 0;
var SM_OCCURRENCE_MAX_QUESTIONNAIRE_TEMPLATE_TO_SECTION = OCCURRENCE_INFINITE;
var SM_OCCURRENCE_MIN_SECTION_TO_SUBSECTION = 0;
var SM_OCCURRENCE_MAX_SECTION_TO_SUBSECTION = OCCURRENCE_INFINITE;
var SM_OCCURRENCE_MIN_SECTION_TO_QUESTION = 0;
var SM_OCCURRENCE_MAX_SECTION_TO_QUESTION = OCCURRENCE_INFINITE;
//provided that the question type is single choice or multiple choice, this paremters are used for checks
var SM_OCCURRENCE_MIN_QUESTION_TO_OPTIONSET = 0;
var SM_OCCURRENCE_MAX_QUESTION_TO_OPTIONSET = 1;
//provided that the question type is single choice or multiple choice, this paremters are used for checks
var SM_OCCURRENCE_MIN_QUESTION_TO_OPTION = 0;
var SM_OCCURRENCE_MAX_QUESTION_TO_OPTION = OCCURRENCE_INFINITE;
var SM_OCCURRENCE_MIN_OPTIONSET_TO_OPTION = 1;
var SM_OCCURRENCE_MAX_OPTIONSET_TO_OPTION = OCCURRENCE_INFINITE;
var SM_OCCURRENCE_MIN_QUESTIONNAIRE_TEMPLATE_TO_SURVEYTASK = 0;
var SM_OCCURRENCE_MAX_QUESTIONNAIRE_TEMPLATE_TO_SURVEYTASK = OCCURRENCE_INFINITE;

var SM_OCCURRENCE_MIN_SURVEYTASK_TO_QUESTIONNAIRE_TEMPLATE = 1;
var SM_OCCURRENCE_MAX_SURVEYTASK_TO_QUESTIONNAIRE_TEMPLATE = OCCURRENCE_INFINITE;
var SM_OCCURRENCE_MIN_SURVEYTASK_TO_QUESTIONNAIREOWNER = 1;
var SM_OCCURRENCE_MAX_SURVEYTASK_TO_QUESTIONNAIREOWNER = OCCURRENCE_INFINITE;
var SM_OCCURRENCE_MIN_SURVEYTASK_TO_SURVEYREVIEWER = 1;
var SM_OCCURRENCE_MAX_SURVEYTASK_TO_SURVEYREVIEWER = 1;
var SM_OCCURRENCE_MIN_SURVEYTASK_TO_SURVEYMANAGER = 0;
var SM_OCCURRENCE_MAX_SURVEYTASK_TO_SURVEYMANAGER = 1;

var SM_OCCURRENCE_MIN_SURVEYTASK_TO_RISK = 0;
var SM_OCCURRENCE_MAX_SURVEYTASK_TO_RISK = OCCURRENCE_INFINITE;
var SM_OCCURRENCE_MIN_SURVEYTASK_TO_CONTROL = 0;
var SM_OCCURRENCE_MAX_SURVEYTASK_TO_CONTROL = OCCURRENCE_INFINITE;
var SM_OCCURRENCE_MIN_SURVEYTASK_TO_TESTDEFINITION = 0;
var SM_OCCURRENCE_MAX_SURVEYTASK_TO_TESTDEFINITION = OCCURRENCE_INFINITE;

var SM_OCCURRENCE_MIN_SURVEYTASK_TO_APPSYS = 0;
var SM_OCCURRENCE_MAX_SURVEYTASK_TO_APPSYS = OCCURRENCE_INFINITE;
var SM_OCCURRENCE_MIN_SURVEYTASK_TO_REGULATION = 0;
var SM_OCCURRENCE_MAX_SURVEYTASK_TO_REGULATION = OCCURRENCE_INFINITE;
var SM_OCCURRENCE_MIN_SURVEYTASK_TO_ORGANIZATION = 0;
var SM_OCCURRENCE_MAX_SURVEYTASK_TO_ORGANIZATION = OCCURRENCE_INFINITE;
var SM_OCCURRENCE_MIN_SURVEYTASK_TO_PROCESS = 0;
var SM_OCCURRENCE_MAX_SURVEYTASK_TO_PROCESS = OCCURRENCE_INFINITE;
var SM_OCCURRENCE_MIN_SURVEYTASK_TO_RISKCAT = 0;
var SM_OCCURRENCE_MAX_SURVEYTASK_TO_RISKCAT = OCCURRENCE_INFINITE;



//***************************************************************************************
// Public AUDIT Management Attributes free for Customization 
//***************************************************************************************
//audit template attribute value 'auditenddate' is calculated during import therefore both AT_DATE_START and AT_MAX_TL_TIME must be filled
var SM_MANDATORY_FIELD_AUDIT_TEMPLATE = "AT_NAME,AT_START_DATE_OF_AUDIT_PREPARATION,AT_DATE_START,AT_MAX_TL_TIME,AT_START_DATE_OF_CONTROL_PERIOD,AT_END_DATE_OF_CONTROL_PERIOD";
//step template attribute value 'plannedenddate' is calculated during import therefore both AT_DATE_START and AT_MAX_TL_TIME must be filled
//'processingtime' is calculated from AT_DES_PROC_TIME therefore this ABA attribute must be filled too
var SM_MANDATORY_FIELD_AUDIT_STEP_TEMPLATE = "AT_NAME,AT_DATE_START,AT_MAX_TL_TIME,AT_DES_PROC_TIME";

var SM_OCCURRENCE_MIN_AUDIT_TEMPLATE_TO_TOP_STEP = 1;
var SM_OCCURRENCE_MAX_AUDIT_TEMPLATE_TO_TOP_STEP = OCCURRENCE_INFINITE;
var SM_OCCURRENCE_MIN_AUDIT_TEMPLATE_TO_AUDITOWNER = 1;
var SM_OCCURRENCE_MAX_AUDIT_TEMPLATE_TO_AUDITOWNER = 1;
var SM_OCCURRENCE_MIN_AUDIT_TEMPLATE_TO_AUDITREVIEWER = 1;
var SM_OCCURRENCE_MAX_AUDIT_TEMPLATE_TO_AUDITREVIEWER = 1;
var SM_OCCURRENCE_MIN_AUDIT_TEMPLATE_TO_AUDITAUDITOR = 0;
var SM_OCCURRENCE_MAX_AUDIT_TEMPLATE_TO_AUDITAUDITOR = 1;

var SM_OCCURRENCE_MIN_AUDIT_STEP_TEMPLATE_TO_AUDITSTEPOWNER = 1;
var SM_OCCURRENCE_MAX_AUDIT_STEP_TEMPLATE_TO_AUDITSTEPOWNER = 1;



//***************************************************************************************
// Public POLICY Management Attributes free for Customization 
//***************************************************************************************
var PM_MANDATORY_FIELD_POLICY_DEFINITION =  "AT_NAME"
                                            + ",AT_POLICY_TYPE"
//Only if policy type is "Confirmation required" -> handled internally in policy semantic report
//                                            + ",AT_CONFIRMATION_TEXT"
//                                            + ",AT_CONFIRMATION_DURATION[Range 1..365]"
                                            + ",AT_START_DATE_APPROVAL_PERIOD_OWNER"
                                            + ",AT_END_DATE_APPROVAL_PERIOD_OWNER"
                                            + ",AT_START_DATE_APPROVAL_PERIOD_APPROVER"
                                            + ",AT_END_DATE_APPROVAL_PERIOD_APPROVER"
                                            + ",AT_END_DATE_PUBLISHING_PERIOD";                                          
                                            
var PM_MANDATORY_FIELD_POLICY_REVIEW_TASK = "";
    //Only if "review_relevant" is set and frequency is "event-driven" -> handled internally in policy review task semantic report
    /*
     + ",AT_CTRL_EXECUTION_TASK_DURATION," +
    "AT_CTRL_EXECUTION_TASK_START_DATE"
    */
 
var PM_OCCURRENCE_MIN_POLICY_DEFINITION_TO_POLICYOWNER = 1;
var PM_OCCURRENCE_MAX_POLICY_DEFINITION_TO_POLICYOWNER = 1;
var PM_OCCURRENCE_MIN_POLICY_DEFINITION_TO_POLICYAUDITOR = 0;
var PM_OCCURRENCE_MAX_POLICY_DEFINITION_TO_POLICYAUDITOR = 1;
var PM_OCCURRENCE_MIN_POLICY_DEFINITION_TO_POLICYAPPROVER = 0;
var PM_OCCURRENCE_MAX_POLICY_DEFINITION_TO_POLICYAPPROVER = OCCURRENCE_INFINITE;
//Only if policy type is "Confirmation required" -> handled internally in policy semantic report
var PM_OCCURRENCE_MIN_POLICY_DEFINITION_TO_POLICYADDRESSEE = 1;
var PM_OCCURRENCE_MAX_POLICY_DEFINITION_TO_POLICYADDRESSEE = OCCURRENCE_INFINITE;


//***************************************************************************************
// Constants for report layout
//***************************************************************************************
var WRITE_FULL_PATH = false;				
var MAX_CHARACTERS_IN_ROW = 100;    // defines how many characters are printed in one row
var SPC1 = "     ";
var SPC2 = SPC1+SPC1;
var SPC3 = SPC1+SPC1+SPC1+"  ";
var UDL = "-------------------------------------------------------------------------------------------\r\n\r\n";
var NO_ERROR_FOUND = getString("COMMON_15"); 
   
   
    
//***************************************************************************************
// Public Functions - do not change!
//***************************************************************************************
//Test management
function getMandatoryFieldsForHierarchyRegulation(){
    if (_MANDATORY_FIELDS_HIERARCHY_REGULATION == null){
        _MANDATORY_FIELDS_HIERARCHY_REGULATION = splitString(MANDATORY_FIELDS_HIERARCHY_REGULATION);   
    }  
    return _MANDATORY_FIELDS_HIERARCHY_REGULATION;
}
function getMandatoryFieldsForHierarchyProcess(){
    if (_MANDATORY_FIELDS_HIERARCHY_PROCESS == null){
        _MANDATORY_FIELDS_HIERARCHY_PROCESS = splitString(MANDATORY_FIELDS_HIERARCHY_PROCESS);   
    }  
    return _MANDATORY_FIELDS_HIERARCHY_PROCESS;
}
function getMandatoryFieldsForHierarchyOrganization(){
    if (_MANDATORY_FIELDS_HIERARCHY_ORGANIZATION == null){
        _MANDATORY_FIELDS_HIERARCHY_ORGANIZATION = splitString(MANDATORY_FIELDS_HIERARCHY_ORGANIZATION);   
    }  
    return _MANDATORY_FIELDS_HIERARCHY_ORGANIZATION;
}
function getMandatoryFieldsForHierarchyTester(){
    if (_MANDATORY_FIELDS_HIERARCHY_TESTER == null){
        _MANDATORY_FIELDS_HIERARCHY_TESTER = splitString(MANDATORY_FIELDS_HIERARCHY_TESTER);   
    }  
    return _MANDATORY_FIELDS_HIERARCHY_TESTER;
}
//Risk management
function getMandatoryRiskManagementFieldsForHierarchyRegulation(){
    if (_RM_MANDATORY_FIELDS_HIERARCHY_REGULATION == null){
        _RM_MANDATORY_FIELDS_HIERARCHY_REGULATION = splitString(RM_MANDATORY_FIELDS_HIERARCHY_REGULATION);   
    }  
    return _RM_MANDATORY_FIELDS_HIERARCHY_REGULATION;
}
function getMandatoryRiskManagementFieldsForHierarchyOrganization(){
    if (_RM_MANDATORY_FIELDS_HIERARCHY_ORGANIZATION == null){
        _RM_MANDATORY_FIELDS_HIERARCHY_ORGANIZATION = splitString(RM_MANDATORY_FIELDS_HIERARCHY_ORGANIZATION);   
    }  
    return _RM_MANDATORY_FIELDS_HIERARCHY_ORGANIZATION;
}
function getMandatoryFieldsForHierarchyAppSys(){
    if (_MANDATORY_FIELDS_HIERARCHY_APPSYS == null){
        _MANDATORY_FIELDS_HIERARCHY_APPSYS = splitString(MANDATORY_FIELDS_HIERARCHY_APPSYS);   
    }  
    return _MANDATORY_FIELDS_HIERARCHY_APPSYS;
}
function getMandatoryFieldsForHierarchyRiskCat() {
    if (_MANDATORY_FIELDS_HIERARCHY_RISKCAT == null){
        _MANDATORY_FIELDS_HIERARCHY_RISKCAT = splitString(MANDATORY_FIELDS_HIERARCHY_RISKCAT);   
    }  
    return _MANDATORY_FIELDS_HIERARCHY_RISKCAT;    
}


function getMandatoryFieldsForRisk(){
    if (_MANDATORY_FIELDS_RISK == null){
        _MANDATORY_FIELDS_RISK = splitString(MANDATORY_FIELDS_RISK);   
    }  
    return _MANDATORY_FIELDS_RISK;
}

function getMandatoryRiskManagementFieldsForRisk(){
    if (_RM_MANDATORY_FIELDS_RISK == null){
        _RM_MANDATORY_FIELDS_RISK = splitString(RM_MANDATORY_FIELDS_RISK);   
    }  
    return _RM_MANDATORY_FIELDS_RISK;
}

function getMandatoryFieldsForControl(){
    if (_MANDATORY_FIELDS_CONTROL == null){
        _MANDATORY_FIELDS_CONTROL = splitString(MANDATORY_FIELDS_CONTROL);   
    }  
    return _MANDATORY_FIELDS_CONTROL;
}
 
function getMandatoryFieldsForControlExecutionTask(){
    if (_MANDATORY_FIELDS_CONTROL_EXECUTION_TASK == null){
        _MANDATORY_FIELDS_CONTROL_EXECUTION_TASK = splitString(MANDATORY_FIELDS_CONTROL_EXECUTION_TASK);   
    }  
    return _MANDATORY_FIELDS_CONTROL_EXECUTION_TASK;
}

function getMandatoryFieldsForTestdefinition(){
    if (_MANDATORY_FIELDS_TESTDEFINITION == null){
        _MANDATORY_FIELDS_TESTDEFINITION = splitString(MANDATORY_FIELDS_TESTDEFINITION);   
    }  
    return _MANDATORY_FIELDS_TESTDEFINITION;
}  
   
function getMandatoryFieldsForUser(){
    if (_MANDATORY_FIELDS_USER == null){
        _MANDATORY_FIELDS_USER = splitString(MANDATORY_FIELDS_USER);   
    }  
    return _MANDATORY_FIELDS_USER;
} 

function getMandatoryFieldsForUserGroup(){
    if (_MANDATORY_FIELDS_USERGROUP == null){
        _MANDATORY_FIELDS_USERGROUP = splitString(MANDATORY_FIELDS_USERGROUP);   
    }  
    return _MANDATORY_FIELDS_USERGROUP;
}  

//Survey management
function getMandatoryFieldsForQuestionnaireTemplates(){
    if (_SM_MANDATORY_FIELD_QUESTIONNAIRE_TEMPLATE == null){
        _SM_MANDATORY_FIELD_QUESTIONNAIRE_TEMPLATE = splitString(SM_MANDATORY_FIELD_QUESTIONNAIRE_TEMPLATE);   
    }  
    return _SM_MANDATORY_FIELD_QUESTIONNAIRE_TEMPLATE;
}

function getMandatoryFieldsForSections(){
    if (_SM_MANDATORY_FIELD_SECTION == null){
        _SM_MANDATORY_FIELD_SECTION = splitString(SM_MANDATORY_FIELD_SECTION);   
    }  
    return _SM_MANDATORY_FIELD_SECTION;
}

function getMandatoryFieldsForQuestions(){
    if (_SM_MANDATORY_FIELD_QUESTION == null){
        _SM_MANDATORY_FIELD_QUESTION = splitString(SM_MANDATORY_FIELD_QUESTION);   
    }  
    return _SM_MANDATORY_FIELD_QUESTION;
}

function getMandatoryFieldsForOptionSets(){
    if (_SM_MANDATORY_FIELD_OPTIONSET == null){
        _SM_MANDATORY_FIELD_OPTIONSET = splitString(SM_MANDATORY_FIELD_OPTIONSET);   
    }  
    return _SM_MANDATORY_FIELD_OPTIONSET;
}

function getMandatoryFieldsForOptions(){
    if (_SM_MANDATORY_FIELD_OPTION == null){
        _SM_MANDATORY_FIELD_OPTION = splitString(SM_MANDATORY_FIELD_OPTION);   
    }  
    return _SM_MANDATORY_FIELD_OPTION;
}

function getMandatoryFieldsForSurveyTasks(){
    if (_SM_MANDATORY_FIELD_SURVEYTASK == null){
        _SM_MANDATORY_FIELD_SURVEYTASK = splitString(SM_MANDATORY_FIELD_SURVEYTASK);   
    }  
    return _SM_MANDATORY_FIELD_SURVEYTASK;
}

//Audit management
function getMandatoryFieldsForAuditTemplates(){
    if (_SM_MANDATORY_FIELD_AUDIT_TEMPLATE == null){
        _SM_MANDATORY_FIELD_AUDIT_TEMPLATE = splitString(SM_MANDATORY_FIELD_AUDIT_TEMPLATE);   
    }  
    return _SM_MANDATORY_FIELD_AUDIT_TEMPLATE;
}

function getMandatoryFieldsForAuditStepTemplates(){
    if (_SM_MANDATORY_FIELD_AUDIT_STEP_TEMPLATE == null){
        _SM_MANDATORY_FIELD_AUDIT_STEP_TEMPLATE = splitString(SM_MANDATORY_FIELD_AUDIT_STEP_TEMPLATE);   
    }  
    return _SM_MANDATORY_FIELD_AUDIT_STEP_TEMPLATE;
}

//Policy management
function getMandatoryFieldsForPolicyDefinition(){
    if (_PM_MANDATORY_FIELD_POLICY_DEFINITION == null) {
        _PM_MANDATORY_FIELD_POLICY_DEFINITION = splitString(PM_MANDATORY_FIELD_POLICY_DEFINITION);
    }
    return _PM_MANDATORY_FIELD_POLICY_DEFINITION;
}

function getMandatoryFieldsForPolicyReviewTask(){
    if (_PM_MANDATORY_FIELD_POLICY_REVIEW_TASK == null) {
        _PM_MANDATORY_FIELD_POLICY_REVIEW_TASK = splitString(PM_MANDATORY_FIELD_POLICY_REVIEW_TASK);
    }
    return _PM_MANDATORY_FIELD_POLICY_REVIEW_TASK;
}

//***************************************************************************************
// Attributes and Functions for internal use ONLY - do not change!
//***************************************************************************************

var _MANDATORY_FIELDS_HIERARCHY_REGULATION 		 = null; 
var _MANDATORY_FIELDS_HIERARCHY_PROCESS          = null; 
var _MANDATORY_FIELDS_HIERARCHY_ORGANIZATION     = null; 
var _MANDATORY_FIELDS_HIERARCHY_TESTER           = null;
var _MANDATORY_FIELDS_HIERARCHY_APPSYS           = null;
var _MANDATORY_FIELDS_HIERARCHY_RISKCAT          = null;
var _MANDATORY_FIELDS_RISK           = null; 
var _MANDATORY_FIELDS_CONTROL        = null; 
var _MANDATORY_FIELDS_CONTROL_EXECUTION_TASK     = null; 
var _MANDATORY_FIELDS_TESTDEFINITION = null;
var _MANDATORY_FIELDS_USER           = null;
var _MANDATORY_FIELDS_USERGROUP      = null;

var _RM_MANDATORY_FIELDS_RISK        		    = null;
var _RM_MANDATORY_FIELDS_HIERARCHY_REGULATION 	= null;
var _RM_MANDATORY_FIELDS_HIERARCHY_ORGANIZATION	    = null;

var _SM_MANDATORY_FIELD_QUESTIONNAIRE_TEMPLATE  = null;
var _SM_MANDATORY_FIELD_SECTION                 = null;
var _SM_MANDATORY_FIELD_QUESTION                = null;
var _SM_MANDATORY_FIELD_OPTIONSET               = null;
var _SM_MANDATORY_FIELD_OPTION                  = null;
var _SM_MANDATORY_FIELD_SURVEYTASK              = null;

var _SM_MANDATORY_FIELD_AUDIT_TEMPLATE			= null;
var _SM_MANDATORY_FIELD_AUDIT_STEP_TEMPLATE		= null;

var _PM_MANDATORY_FIELD_POLICY_DEFINITION       = null;
var _PM_MANDATORY_FIELD_POLICY_REVIEW_TASK		= null;

function splitString(pFieldString){
    var aMandatoryFields = new Array();
    
    if (pFieldString.equals(""))
        return aMandatoryFields;
    
    var items = pFieldString.split(",");        
    for (var i=0; i<items.length; i++){
        if (items[i].indexOf("|") != -1){
            var subArray = items[i].split("|"); 
            aMandatoryFields.push(subArray); 
        }
        else{
            var tmp = new Array();
            tmp.push(items[i]);
            aMandatoryFields.push(tmp);
        }   
    }
    return aMandatoryFields;
}

function getRemainingConditions(aOriginalConditionGroups, aConditionGroupsToRemove) {
    
    var aRemainingConditionGroups = new Array();
   
    for (var i=0; i<aOriginalConditionGroups.length; i++) {
        var bMayRemain = true;
        for (var j=0; j<aConditionGroupsToRemove.length; j++) {
            //if the number of condition groups is different then compare the next pair
            if (aOriginalConditionGroups[i].length != aConditionGroupsToRemove[j].length) { continue; }
            
            var bAllConditionsIdentical = true;
            for (var k=0; k<aOriginalConditionGroups[i].length; k++) {
                if (aOriginalConditionGroups[i][k] != aConditionGroupsToRemove[j][k]) {
                    bAllConditionsIdentical = false;
                    break;
                } 
            }
            bMayRemain = !bAllConditionsIdentical;
            if (!bMayRemain) {break;}
        }
        
        if (bMayRemain) {
            aRemainingConditionGroups.push(aOriginalConditionGroups[i]);
        }
    }
    //Return the remaining condition groups only
    return aRemainingConditionGroups;
}

function recombineConditionGroup(aSeparateConditions) {
    if (aSeparateConditions == null) {return "";}
    sConditionGroup = "";
    for (var i=0; i<aSeparateConditions.length ;i++) {
        if (sConditionGroup.length > 0) {
            sConditionGroup += "|";
        }
        sConditionGroup += aSeparateConditions[i];
    }
    return sConditionGroup;
}