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

/**
 * BEWARE:
 * This report is executed when pressing the 'Generate Solution Design'-Button under the 'BPM'-ribbon in ARIS Architect. 
 * All changes made in this script will affect the behavior of the button.
 * Please also be aware that this report will be restored to its original state when performing an ARIS update.
 * It is recommended to regularly create a backup of this report before making any changes.
 */

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed" 

// ==========================================
// ========== CUSTOMIZABLE OPTIONS ==========
// ==========================================


// true (default): Specifies that the definitions are reused for satellites of a BPMN task placed in the Function allocation diagram model assigned.
// false: Specifies that a new definition is created for each satellite of a BPMN task placed in the Function allocation diagram model assigned.
var reuseDefinitions = true;


// true: Specifies that all objects that were placed in the Function allocation diagram model assigned to a function in the EPC are transferred to the BPMN diagram.
// false (default): Only the transformation relevant objects that were placed in the Function allocation diagram model assigned to a function
//     in the EPC are transferred to the BPMN diagram.
var transformAllFADObjects = false;


// true (default): Specifies that the semantic check that validates the EPC is performed before the EPC-to-BPMN transformation starts. If the semantic check finds errors,
//     the faulty models are skipped during the transformation. You are notified, which models contain errors. The default value is true.
// false: Disables the execution of the semantic check that validates the EPC. The EPC-to-BPMN transformation transforms all models, regardless whether the models are valid.
//     This is recommended if you modified the transformation without adapting the semantic check.
var semanticCheckEnabled = true;


// task generation options
// You can change the transformation rules. You can specify which satellites of a function in the EPC should generate which task types
// (User task, Service task, or Manual task) in the corresponding BPMN diagram.
// Note: When modifying the task generation, it is recommended to disable or adapt the semantic check

// The transformation converts satellites that are connected to functions with the following connections in the EPC to objects of the User task type in the BPMN diagram.
var satellitesCreatingUserTasks = [
    {cxn:Constants.CT_IS_REPR_BY, obj:Constants.OT_SCRN}
];

// The transformation converts satellites that are connected to functions with the following connections in the EPC to objects of the Manual task type in the BPMN diagram.
var satellitesCreatingManualTasks = [
    {cxn:Constants.CT_EXEC_2, obj:Constants.OT_PERS_TYPE},
    {cxn:Constants.CT_EXEC_2, obj:Constants.OT_ORG_UNIT_TYPE},
    {cxn:Constants.CT_EXEC_1, obj:Constants.OT_ORG_UNIT},
    {cxn:Constants.CT_EXEC_1, obj:Constants.OT_POS},
    {cxn:Constants.CT_EXEC_1, obj:Constants.OT_GRP}
];

// The transformation converts satellites that are connected to functions with the following connections in the EPC to objects of the Service task type in the BPMN diagram.
var satellitesCreatingServiceTasks = [
    {cxn:Constants.CT_CAN_SUPP_1, obj:Constants.OT_APPL_SYS_TYPE},
    {cxn:Constants.CT_CAN_SUPP_1, obj:Constants.OT_FUNC_CLUSTER}
];

// The transformation converts satellites that are connected to functions with the following connections in the EPC to objects of the Service task type in the BPMN diagram.
// This is an additional restriction of the satellitesCreatingServiceTasks above.
// If a symbol is listed here but its object type is not listed under satellitesCreatingServiceTasks, it will be ignored and vice versa.
var satelliteSymbolsCreatingServiceTasks = [
    {cxn:Constants.CT_CAN_SUPP_1, sym:Constants.ST_BUSINESS_SERVICE},
    {cxn:Constants.CT_CAN_SUPP_1, sym:Constants.ST_SW_SERVICE_TYPE}
];


// background color schemes used in report

// default color scheme
const COLOR_ERROR = Constants.C_RED;
const COLOR_WARNING = Constants.C_YELLOW;
const COLOR_SUCCESS = Constants.C_GREEN;

// black and white color scheme (for print)
// const COLOR_ERROR = Constants.C_WHITE;
// const COLOR_WARNING = Constants.C_WHITE;
// const COLOR_SUCCESS = Constants.C_WHITE;

// ARIS Connect color scheme (light colors, not suited for people with red-green deficiency)
// const COLOR_ERROR = new java.awt.Color(244/255.0 ,201/255.0, 202/255.0, 1).getRGB();
// const COLOR_WARNING = new java.awt.Color(255/255.0 ,224/255.0, 194/255.0, 1).getRGB();
// const COLOR_SUCCESS = new java.awt.Color(255/255.0 ,247/255.0, 177/255.0, 1).getRGB();


// ==========================================
// ====== END OF CUSTOMIZABLE OPTIONS =======
// ==========================================


const locale = Context.getSelectedLanguage();   // current locale ID
const activeDbFilter = ArisData.ActiveFilter();   // active database filter
const SHOW_DIALOGS = !propertyIsSet("INTERNAL_CALL");    // true: script was launched in debug mode, false: script was launched via GUI

var bpmnSupport;    // BPMN support component for target model
var defaultPool;    // default pool of target BPMN model
var defaultLane;    // default lane of target BPMN model

var logOutput; // text to be displayed when script execution ends

var userSelection_models = new Array();
var userSelection_groups = new Array();
var outputFile = Context.createOutputObject();

var transformationOptions;

var epcMap;     // mapping from EPC to BPMN objects
var bpmnMap;    // mapping from BPMN to EPC objects
var laneMap;    // mapping from organizational objects to lanes
var objLaneMap; // mapping of EPC objects to lanes
var fadMap;     // mapping of function occs to FADs
var fadObjSet;  // mapping of FADs to occs

const TRANSFORMATION_PATTERN_NAME = "EPC2BPMNTransformation";                       // transformation profile name
const TRANSFORMATION_PATTERN_ID = "2ffa8851-a1ee-11de-4531-00155882d57a";           // transformation ID
const TRANSFORMATION_PATTERN_PROFILE_ID = "304dd873-a1ee-11de-4531-00155882d57a";   // transformation profile ID
var TARGET_MODEL_TYPE = Constants.MT_BPMN_COLLABORATION_DIAGRAM;

const SEMANTIC_CHECK_GUID = "34ff4fc0-ad01-11e8-4ed0-f48e38b4e12b";

var sourceModel;
var sourceGroup = ArisData.getActiveDatabase().RootGroup();
var targetModel;
var targetGroup;

function main() {
    Context.writeStatus(getString("COLLECTING_INPUT_DATA.PGR"), 0);
    
    outputFile.DefineF("REPORT1", "Arial", 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 0, 0, 0, 0, 1);
    outputFile.DefineF("REPORT2", "Arial", 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
    outputFile.DefineF("REPORT3", "Arial", 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
    setReportHeaderFooter(outputFile, -1, false, false, false);
    
    collectSource();
    collectTransformationOptions();
    
    if (SHOW_DIALOGS && (!buttonOkayPressed)) {
        Context.setScriptError(Constants.ERR_CANCEL);
        return;
    }
    
    var transformationSources = new Array();
    addToList(transformationSources, userSelection_models);
    addToList(transformationSources, findModelsInGroups(userSelection_groups, transformationOptions.includeSubgroups));
    
    if (transformationOptions.outputEBPMN) {
        TARGET_MODEL_TYPE = Constants.MT_ENTERPRISE_BPMN_COLLABORATION;
    }
    if (propertyIsSet("REUSE_DEFINITIONS")) {
        reuseDefinitions = transformationOptions.reuseDefinitions;
    }
    if (propertyIsSet("TRANSFORM_ALL_FAD_OBJECTS")) {
    transformAllFADObjects = transformationOptions.transformAllFADObjects;
    }
    if (propertyIsSet("SEMANTIC_CHECK_ENABLED")) {
        semanticCheckEnabled = transformationOptions.semanticCheckEnabled;
    }
    
    const SINGLE_TRANSFORMATION = transformationSources.length == 1;
    
    var transformationTime_summary = 0;
    var successfulTransformations = 0;
    var transformationWarnings = 0;
    for (var i = 0; i < transformationSources.length; i++) {
        outputFile.BeginTable(100, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT | Constants.FMT_ITALIC, 0);
        addLineToFile_bold(getString("CAPTION_MODEL_NAME"), getString("CAPTION_INFO"), getString("CAPTION_MESSAGE"));
        
        var transformationTime = 0;
        var START_TIME = Date.now();
        var errorLog = null;
        sourceModel = transformationSources[i];
        
        Context.writeStatus(getString("DIALOG_PROGRESS_PROCESSING") + " (" + (i + 1) + "/" + transformationSources.length + "): " + sourceModel.Name(-1, true), i / transformationSources.length * 100);
        
        try {
            if (semanticCheckEnabled) {
                var semanticCheckResult = semanticCheck(sourceModel);
            }
            
            if (semanticCheckEnabled && propertyIsSet_fromPool("SemanticCheck_Error", semanticCheckResult)) {
                if (SINGLE_TRANSFORMATION && SHOW_DIALOGS && (Context.getEnvironment() != Constants.ENVIRONMENT_TC)) {
                    outputSemanticCheckResults_asInfo(sourceModel, semanticCheckResult);
                    return;
                } else {
                    throw(getString("SEMANTIC_CHECK_THREW_ERROR"));
                }
            } else {
                if (semanticCheckEnabled && propertyIsSet_fromPool("SemanticCheck_Warning", semanticCheckResult)) {
                    transformationWarnings++;
                    
                    if (semanticCheckEnabled && SINGLE_TRANSFORMATION && SHOW_DIALOGS && (Context.getEnvironment() != Constants.ENVIRONMENT_TC)) {
                        const START_TIME_DIALOG = Date.now();
                        var answer = Dialogs.MsgBox(getString("DIALOG_SEMANTIC_CHECK_WARNING"), Constants.MSGBOX_BTN_YESNO, getString("DIALOG_SEMANTIC_CHECK_TITLE"));
                        transformationTime -= Date.now() - START_TIME_DIALOG;
                        
                        if (answer == Constants.MSGBOX_RESULT_YES) {
                            outputSemanticCheckResults_asInfo(sourceModel, semanticCheckResult);
                            return;
                        }
                    }
                }
                
                setTargetGroup(sourceModel, transformationOptions);
                
                transform(sourceModel);
                
                if (SHOW_DIALOGS) {
                    Context.addActionResult(Constants.ACTION_UPDATE, "", targetGroup);
                    Context.addActionResult(Constants.ACTION_UPDATE, "", sourceModel.Group());
                    if (transformationOptions.createSubgroups == true && targetGroup.Parent().IsValid()) {
                        Context.addActionResult(Constants.ACTION_UPDATE, "", targetGroup.Parent());
                    }
                }
            }
            
            successfulTransformations++;
        } catch (error) {
            errorLog = error;
        } finally {
            transformationTime = Date.now() - START_TIME;
            transformationTime_summary += transformationTime;
        }
        
        createLogOutput(transformationTime, errorLog, semanticCheckResult);
        outputSemanticCheckResults_asFile(sourceModel, semanticCheckResult);
        outputFile.EndTable(" ", 100, "Arial", 10,Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_ITALIC, 0);
    }
    
    Context.writeStatus(getString("DIALOG_PROGRESS_FINISHED"), 100);
    
    if (SINGLE_TRANSFORMATION && SHOW_DIALOGS && successfulTransformations == 1 && (Context.getEnvironment() != Constants.ENVIRONMENT_TC)) {
        transformationTime = Date.now() - START_TIME;
        
        // log output that is stored in a property
        logOutput = getString("TRANSFORMATION_SUCCESSFUL") + "\n\n"
        + formatTimeDuration(transformationTime) + "\n\n"
        + getString("BPMN_MODEL_WAS_CREATED_AT_LOCATION") + "\n" + targetGroup.Path(locale) 
        + "\\" + targetModel.Name(locale, true);
        
        Context.addActionResult(Constants.ACTION_OPEN_MODEL, "", targetModel);
        Dialogs.MsgBox(logOutput);
        
    } else {
        outputFile.BeginTable(100, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT | Constants.FMT_ITALIC, 0);
        var summaryTimeTransformation_text = formatTimeDuration(transformationTime_summary);
        var summaryText_transformations = formatstring2(getString("REPORT_SUMMARY_TRANSFORMATIONS"), successfulTransformations, transformationSources.length);
        if (transformationWarnings > 0) {
            summaryText_transformations += " " + formatstring1(getString("REPORT_SUMMARY_WARNINGS"), transformationWarnings);
            summaryText_transformations += "\n\n" + getString("RUN_SEMANTIC_CHECK_TO_INSPECT_MODELING_PROBLEMS");
        }
        if (!semanticCheckEnabled) {
            summaryText_transformations += " " + getString("NO_SEMANTIC_CHECKS_PERFORMED");
        }
        addLineToFile_bold(getString("REPORT_SUMMARY"), summaryTimeTransformation_text, summaryText_transformations);
        
        outputFile.EndTable(" ", 100, "Arial", 10,Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_ITALIC, 0);
        outputFile.WriteReport();
    }
}

function collectTransformationOptions() {
    if (SHOW_DIALOGS) {
        transformationOptions = Dialogs.showDialog(new optionsDialog(), Constants.DIALOG_TYPE_ACTION, getString("GENERATE_SOLUTION_DESIGN"));
    } else {
        var targetGroup;
        if (propertyIsSet(Constants.GROUP_GUID)){
            var guid = Context.getProperty(Constants.GROUP_GUID);
            assertNotNull("Group guid", guid);
            
            targetGroup = ArisData.getActiveDatabase().FindGUID(guid);
            assertNotNull("Target group", targetGroup);
        } else {
            targetGroup = null;
        }
        
        transformationOptions = {
            createSubgroups: propertyIsSet(Constants.CREATE_SUBGROUPS),
            includeSubgroups: propertyIsSet(Constants.INCLUDE_SUBGROUPS),
            targetGroup: targetGroup,
            outputEBPMN: propertyIsSet(Constants.OUTPUT_EBPMN),
            reuseDefinitions: getBooleanPropertyValue(Constants.REUSE_DEFINITIONS, true),
            transformAllFADObjects: getBooleanPropertyValue(Constants.TRANSFORM_ALL_FAD_OBJECTS, false),
            semanticCheckEnabled: getBooleanPropertyValue(Constants.SEMANTIC_CHECK_ENABLED, true)
        };
    }
}

function assertNotNull(variableName, variableValue) {
    if (variableValue == null) {
        throw "AssertNotNull-Exception: " + variableName + " is null!";
    }
}

function outputSemanticCheckResults_asInfo(sourceModel, semanticCheckResults) {
    var objOccs = sourceModel.ObjOccList().sort();
    
    for (var i = 0; i < objOccs.length; i++) {
        var objOcc = objOccs[i];
        
        var errorList = getSemanticCheckResultsForExtension(semanticCheckResults, objOcc, "_error");
        for (var j = 0; j < errorList.length; j++) {
            var currentText = addHtmlLinebreaks(errorList[j], 100);
            sourceModel.setTemporaryUserInfo(objOcc, Constants.MODEL_INFO_ERROR, currentText);
        }
        
        var warningList = getSemanticCheckResultsForExtension(semanticCheckResults, objOcc, "_warning");
        for (var j = 0; j < warningList.length; j++) {
            var currentText = addHtmlLinebreaks(warningList[j], 100);
            sourceModel.setTemporaryUserInfo(objOcc, Constants.MODEL_INFO_WARNING, currentText);
        }
    }
    
    Context.addActionResult(Constants.ACTION_OPEN_MODEL, "", sourceModel);
}

function addHtmlLinebreaks(text, lineLength) {
    var out = "";
    var line = "";
    
    var wordList = text.split(" ");
    for (var i = 0; i < wordList.length; i++) {
        line += wordList[i];
        
        if (line.length < lineLength) {
            line += " ";
        } else {
            out += line + "<br>";
            line = "";
        }
    }
    
    return out + line + "<br>";
}

/**
* Gets the semantic checks results from its object and writes them to the output file
*/
function outputSemanticCheckResults_asFile(sourceModel, semanticCheckResults) {
    if ((!semanticCheckEnabled) || semanticCheckResults == null) return;
    
    var objOccList = sourceModel.ObjOccList().sort();
    
    for (var i = 0; i < objOccList.length; i++) {
        var objOcc = objOccList[i];
        var errorList = getSemanticCheckResultsForExtension(semanticCheckResults, objOcc, "_error");
        outputSemanticCheckResultList(objOcc, errorList, COLOR_ERROR);
        
        var warningList = getSemanticCheckResultsForExtension(semanticCheckResults, objOcc, "_warning");
        outputSemanticCheckResultList(objOcc, warningList, COLOR_WARNING);
        
        var infoList = getSemanticCheckResultsForExtension(semanticCheckResults, objOcc, "_info");
        outputSemanticCheckResultList(objOcc, infoList, COLOR_SUCCESS);
    }
}

/**
* Gets the semantic checks results from a specific extension from its object
*/
function getSemanticCheckResultsForExtension(semanticCheckResults, objOcc, extension) {
    const SEPARATOR = "<SEPARATOR>";
    var properties = semanticCheckResults.getProperty(objOcc.ObjectID() + extension);
    var resultList = [];
    
    if (properties != null) {
        return properties.split(SEPARATOR);
    }
    
    return resultList;
}

/**
* Writes the given list as semantic check result to the output file
*/
function outputSemanticCheckResultList(objOcc, list, background) {
    for (var i = 0; i < list.length; i++) {
        var objInfo = "";
        var objName = objOcc.ObjDef().Name(-1, true);
        if ((objName != null) && (objName.length() > 0)) {
            objInfo += getString("CAPTION_SHOWN_NAME") + objName + "\n";
        }
        
        objInfo += getString("CAPTION_SYMBOL_NAME") + objOcc.SymbolName() + "\n";
        objInfo += getString("CAPTION_GUID") + objOcc.ObjDef().GUID();
        
        addlineToFile_withBackground("", objInfo, list[i], [Constants.C_WHITE, background, background]);
    }
}

/**
* Executes the EPC Semantic Check and returns the results
*/
function semanticCheck(model) {
    var reportComponent = Context.getComponent("Report");
    var executionData = reportComponent.createSemCheckExecInfo(SEMANTIC_CHECK_GUID, [model], -1, Constants.OutputXLSX, "EPC_Semantic_Check_Results.xlsx", "");
    return reportComponent.execute(executionData);
}

/**
* Sets the target group for the transformation
*/
function setTargetGroup(sourceModel, transformationOptions) {
    if (transformationOptions.targetGroup == null) {
        targetGroup = sourceModel.Group();
    } else {
        targetGroup = transformationOptions.targetGroup;
    }
    
    var appendix = formatstring1(getString("TRANSFORMED"), "");
    
    if (transformationOptions.createSubgroups == true) {
        var targetGroupName = truncate_string(sourceModel.Name(locale, true) + appendix, 250, "..." + appendix);
        targetGroup = targetGroup.CreateChildGroup(targetGroupName, -1);
    }
    
    // Check write access to target group
    var accessRights = ArisData.ActiveUser().AccessRights(targetGroup);    
    if ((accessRights & Constants.AR_WRITE) != Constants.AR_WRITE) {
        throw formatstring1(getString("TARGET_MODEL_COULD_NOT_BE_CREATED"), targetGroup.Path(locale, true));
    }
}

// ===== ================================= =====
// ===== ===== ACTUAL TRANSFORMATION ===== =====
// ===== ================================= =====

/**
* EPC to BPMN transformation
*
* @method main
* @return {null}
*/
function transform(sourceModel) {
    if (!activeDbFilter.IsValidModelType(TARGET_MODEL_TYPE)) {
        throw formatstring1(getString("ASSERTION_TYPE_NOT_ALLOWED"), activeDbFilter.ModelTypeName(TARGET_MODEL_TYPE));
    }
    targetModel = targetGroup.CreateModel(TARGET_MODEL_TYPE, sourceModel.Name(locale, true), locale);
    if (targetModel == null) {
        throw formatstring1(getString("TARGET_MODEL_COULD_NOT_BE_CREATED"), targetGroup.Name(-1, true));
    }
    
    // access BPMN 2 support component
    var bpmnComponent = Context.getComponent("Designer");
    bpmnSupport = bpmnComponent.getBPMNSupport(targetModel);
    
    bpmnMap = new java.util.HashMap();      // mapping from BPMN to EPC objects
    epcMap = new java.util.HashMap();       // mapping from EPC to BPMN objects
    laneMap = new java.util.HashMap();      // mapping of organizational element defintions to BPMN lane occurrences
    objLaneMap = new java.util.HashMap();   // mapping of EPC object occurrences to lane occurrences
    fadMap = new java.util.HashMap();       // mapping of objOccs to FAD models
    
    createDefaultPoolAndLane(); // create default pool and lane of BPMN model
    transformObjects(); // transform object occurrences from EPC tom BPMN
    lanePlacement(); // place rules, events and satellites in required lanes, based on the task types
    transformConnections(); // transform connection occurrences from EPC to BPMN
    transformRules(); // transform the target model according to join and split rules
    removeIntermediateEvents(); // remove intermediate events from BPMN model
    
    targetModel.doLayout(); // do layout of BPMN model
    setModelAttributes(); // set transformation specific attributes in source and target model
    
    ArisData.Save(Constants.SAVE_IMMEDIATELY);
}

/**
* creates a log output with success notification, duration and target model info
*
* @method createLogOutput
* @param {Int} duration - duration in ms
* @return {null}
*/
function createLogOutput(duration, errorLog, semanticCheckResult) {
    var background = COLOR_SUCCESS;
    
    var stateMessage = "";
    if (errorLog == null) {
        if (semanticCheckEnabled && semanticCheckResult.getProperty("SemanticCheck_Warning") != null) {
            background = COLOR_WARNING;
        }
        
        if (semanticCheckEnabled && semanticCheckResult.getProperty("SemanticCheck_Error") != null) {
            background = COLOR_ERROR;
        }
        
        stateMessage = getString("REPORT_SUCCESS") + "\"" + targetGroup.Path(-1) + "\\" + targetModel.Name(-1, true) + "\"";
    } else {
        stateMessage = getString("CAPTION_ERROR") + errorLog;
        background = COLOR_ERROR;
        Context.writeLog(stateMessage);
    }
    
    addlineToFile_withBackground(sourceModel.Name(-1, true), formatTimeDuration(duration), stateMessage, [background, background, background]);
}

/**
* takes a duration and returns a formatted duration string
*
* @method formatTimeDuration
* @param {Int} duration - the duration to format
* @return {String} the formatted duration string
*/
function formatTimeDuration(duration){
    var millSecs = Math.floor(duration % 1000);
    duration -= millSecs;
    duration /= 1000;
    
    var secs = Math.floor(duration % 60);
    duration -= secs;
    duration /= 60;
    
    var mins = Math.floor(duration % 60);
    duration -= mins;
    duration /= 1000;
    
    var hours = Math.floor(duration);
    
    return getString("CAPTION_TIME") + " "
    + (hours > 0 ? (hours + "h ") : "")
    + (((mins > 0) || (hours > 0)) ? (mins + "m ") : "")
    + (((mins > 0) || (hours > 0) || (secs > 0)) ? (secs + "s ") : "")
    + millSecs + "ms";
}

function addToList(jsList, javaSource) {
    for (var i = 0; i < javaSource.length; i++) {
        jsList.push(javaSource[i]);
    }
}

function collectSource() {
    userSelection_models = ArisData.getSelectedModels();
    userSelection_groups = ArisData.getSelectedGroups();
    
    if ((userSelection_groups.length + userSelection_models.length) == 0) {
        throw getString("NO_SOURCE_SELECTED");
    }
    
    if (numberOfModels(true) == 0) {
        throw getString("NO_EPC_SOURCE");
    }
}

function findModelsInGroups(groups, recursive) {
    var list = new Array();
    
    for (var i = 0; i < groups.length; i++) {
        
        var modelList = groups[i].ModelList(recursive);
        
        for (var j = 0; j < modelList.length; j++) {
            if (modelList[j].OrgModelTypeNum()==Constants.MT_EEPC) {
                addToList(list, [modelList[j]]);
            }
        }
    }
    
    return list;
}

function numberOfModels(recursive) {
    return findModelsInGroups(userSelection_groups, recursive).length + userSelection_models.length
}


/**
* creates a default pool and a default lane
*
* @method createDefaultPoolAndLane
* @return {null}
*/
function createDefaultPoolAndLane() {
    
    if (!activeDbFilter.IsValidSymbol(TARGET_MODEL_TYPE, Constants.ST_BPMN_POOL_1)) {
        throw formatstring1(getString("ASSERTION_TYPE_NOT_ALLOWED"), activeDbFilter.SymbolName(Constants.ST_BPMN_POOL_1));
    }
    if (!activeDbFilter.IsValidSymbol(TARGET_MODEL_TYPE, Constants.ST_BPMN_LANE_1)) {
        throw formatstring1(getString("ASSERTION_TYPE_NOT_ALLOWED"), activeDbFilter.SymbolName(Constants.ST_BPMN_LANE_1));
    }
    
    // create the default pool and the system lane
    var pool = targetGroup.CreateObjDef(Constants.OT_BPMN_POOL, truncate_string(sourceModel.Name(locale, true), 250, "...") , locale);
    defaultPool = bpmnSupport.createBpmnObject(pool, null, Constants.ST_BPMN_POOL_1);
    
    var appendix = formatstring1(getString("SYSTEM_LANE"), "");
    var lane = targetGroup.CreateObjDef(Constants.OT_BPMN_LANE, truncate_string(sourceModel.Name(locale, true) + appendix, 250, "..." + appendix), locale);
    defaultLane = bpmnSupport.createBpmnObject(lane, null, Constants.ST_BPMN_LANE_1);

    if ((defaultPool == null) || (defaultLane == null)) {
        throw getString("DEFAULT_POOL_AND_LANE_COULD_NOT_BE_CREATED");
    }
    
    bpmnSupport.setBpmnParent(defaultLane, defaultPool);
}

/**
* transform all object occurrences in the EPC model to appropriate objects in the BPMN model, if applicable
*
* @method transformObjects
* @return {null}
*/
function transformObjects() {
    // get a sorted list of all object occurrences from the input EPC model
    var objOccurrences = sourceModel.ObjOccList().sort();
    
    for (var k = 0; k < objOccurrences.length; k++) {
        var sourceOcc = objOccurrences[k]; // get current object occurrence
        var sourceDef = sourceOcc.ObjDef(); // get definition of current object occurrence
        
        switch (sourceDef.TypeNum()) {
            case Constants.OT_EVT: { // object of type 'event'
                transformObj(sourceOcc, Constants.OT_EVT, getEventSymbolType(sourceOcc), null);
                break;
            }
            
            case Constants.OT_FUNC: { // object of type 'function'
                
                fadObjSet = new java.util.HashSet(); // create new set to store FAD objects
                
                if (!isUsedInControlFlow(sourceOcc)) break;
                if (isActualProcessInterface(sourceOcc)) break;
                if (transformViaAttribute(sourceOcc)) break;
                
                attr = checkForUserTask(sourceOcc); // try to transform the function via an attached screen to a user task
                if (transformToServiceTask(sourceOcc, attr)) break;
                if (transformToManualTask(sourceOcc, attr)) break;
                
                transformObj(sourceOcc, Constants.OT_FUNC, attr, null); // if no rule applies, create abstract BPMN task
                break;
            }
            
            case Constants.OT_RULE: { // object of type 'rule'
                transformObj(sourceOcc, Constants.OT_RULE, getRuleSymbolType(sourceOcc), null); // create rule object
                break;
            }
            
            default: // object did not match the above types and was omitted
        } // end switch (sourceDef.TypeNum())
    } // end foreach objOccurrences
}


/**
* checks if the object occurrence is used inside a control flow
*
* @method isUsedInControlFlow
* @param objOcc the object occurrence to check
* @return true, if the function has at least one structure-forming connection, false otherwise
*/
function isUsedInControlFlow(objOcc) {
    return objOcc.Cxns(Constants.EDGES_INOUT, Constants.EDGES_STRUCTURE).length > 0;
}


/**
* get the rules and function objects that are the targets of an event
*
* @method getSuccessorRulesAndFunctions
* @param the event for which to get the target rules and functions
* @return {[ObjOcc[],ObjOcc[]]} - the list of target rule and function objects
*/
function getSuccessorRulesAndFunctions(event){
    // get the rule objects that follow the event
    var followingRuleList = event.getConnectedObjOccs([], Constants.EDGES_OUT);
    var followingRules = followingRuleList.filter(function (e) {
        return e.ObjDef().TypeNum() == Constants.OT_RULE;
    });
    
    // get the function objects that follow the event
    var followingFunctionList = event.getConnectedObjOccs([], Constants.EDGES_OUT);
    var followingFunctions = followingFunctionList.filter(function (e) {
        return (e.ObjDef().TypeNum() == Constants.OT_FUNC) && (e.OrgSymbolNum() != Constants.ST_PRCS_IF);
    });
    
    return [followingRules, followingFunctions];
}


/**
* transform the target model according to join and split rules
*
* @method transformRules
* @return {null}
*/
function transformRules() {
    var occList = targetModel.ObjOccList().sort(); // get a sorted list of all rule object occurrences in the target model
    var ruleOccurrences = occList.filter(function (e) {
        return e.ObjDef().TypeNum() == Constants.OT_RULE;
    });
    
    for (var k = 0; k < ruleOccurrences.length; k++) { // for all rule occurrences
        var ruleOcc = ruleOccurrences[k]; // get current object occurrence
        var outEdges = ruleOcc.OutEdges(Constants.EDGES_STRUCTURE);
        
        if (outEdges.length < 2) {
            continue;
        }
        
        // in case of multiple branches that contain only one event each, the condition expressions have to be merged to one single condition expression when the branches are merged
        var condExp = "";
        
        // in case of an opening and closing rule, remember the closing rule in order to create a connection later
        var closingRule = null;
        
        var eventCxns = outEdges.filter(function (e) {
            return e.getTarget().ObjDef().TypeNum() == Constants.OT_EVT;
        });
        
        for (var i = 0; i < eventCxns.length; i++) { // for all connections to events
            var curEvent = eventCxns[i].getTarget();
            var [followingRules, followingFunctions] = getSuccessorRulesAndFunctions(curEvent);
            
            // if the following event is an end event, set the connection attributes accordingly
            if (curEvent.OrgSymbolNum() == Constants.ST_BPMN_END_EVENT || followingRules.length != 1) {
                // get name of event and set the condition expression of the connection
                var exp = curEvent.ObjDef().Attribute(Constants.AT_NAME, locale).getValue();
                setConditionExpression(eventCxns[i], exp);
            }
            
            if (followingFunctions.length == 1) {
                // get name of event and create a new connection
                var exp = curEvent.ObjDef().Attribute(Constants.AT_NAME, locale).getValue();
                createConnection(ruleOcc, followingFunctions[0], exp);
            } else {
                if ((followingRules.length == 1) && (followingRules[0].OrgSymbolNum() == ruleOcc.OrgSymbolNum())) { // event is between two rules of same type
                    closingRule = followingRules[0]; // remember the closing rule
                    condExp = condExp + (condExp == "" ? "" : "\n") + curEvent.ObjDef().Attribute(Constants.AT_NAME, locale).getValue(); // append the current event name to the condition expression
                } else {
                    eventCxns[i] = null; // otherwise remove the event from the list
                }
            }
        }
        
        if ((closingRule != null) && (ruleOcc != closingRule)) {
            createConnection(ruleOcc, closingRule, condExp); // if two rules form a closed path, create a sequence flow connection
        }
    } // end foreach objOccurrences
}

/**
* checks if a BPMN successor exists
*
* @method successorExists
* @param {ObjOcc} obj1 - source object occurrence
* @param {ObjOcc} obj2 - target object occurrence
* @return {boolean} true if a BPMN successor exists, false otherwise
*/
function successorExists(obj1, obj2) {
    var successors = bpmnSupport.getBpmnSuccessors(obj1);
    
    if (successors.length >= 1) {
        for (var i = 0; i < successors.length; i++) {
            if (successors[i].ObjectID() == obj2.ObjectID()) {
                return true;
            }
        }
    }
    
    return false;
}


/**
* create a sequence flow connection between the two given objects
*
* @method createConnection
* @param {ObjOcc} obj1 - source object occurrence
* @param {ObjOcc} obj2 - target object occurrence
* @param {String} exp - condition expression, is only set if value != null
* @return {null}
*/
function createConnection(obj1, obj2, exp) {
    if (!successorExists(obj1, obj2)) {
        var cxn = bpmnSupport.setBpmnSuccessor(obj1, obj2);
        setDefaultLineStyle(cxn);
        
        if (exp != null) {
            setConditionExpression(cxn, exp);
        }
    }
}


/**
* sets the condition expression attribute of the connection, if applicable
*
* @method setConditionExpression
* @param {CxnOcc} cxn - connection
* @param {String} exp - condition expression to be set
* @return {null}
*/
function setConditionExpression(cxn, exp) {
    // only set the condition expression if the source object is a decision rule
    if ((cxn.getSource().OrgSymbolNum() == Constants.ST_BPMN_RULE_XOR_3) || (cxn.getSource().OrgSymbolNum() == Constants.ST_BPMN_RULE_OR_1)) {
        // set the attributes for the connection
        cxn.getDefinition().Attribute(Constants.AT_BPMN_SEQ_FLOW_CONDITION, locale).setValue(Constants.AVT_BPMN_SEQ_FLOW_CONDITION_EXPRESSION);
        cxn.getDefinition().Attribute(Constants.AT_BPMN_CONDITION_EXPRESSION, locale).setValue(exp);
    }
}


/**
* removes the intermediate events that are not relevant to a solution design
*
* @method removeIntermediateEvents
* @return {null}
*/
function removeIntermediateEvents() {
    var occList = targetModel.ObjOccList().sort(); // get a sorted list of all occurrences of intermediate events in the BPMN model
    var intEventOccList = occList.filter(function (e) {
        return e.OrgSymbolNum() == Constants.ST_BPMN_INTERMEDIATE_EVENT;
    });
    
    for (var i = 0; i < intEventOccList.length; i++) { // for all intermediate event occurrences
        var intEventOcc = intEventOccList[i];
        var inEdges = intEventOcc.InEdges(Constants.EDGES_STRUCTURE);
        var outEdges = intEventOcc.OutEdges(Constants.EDGES_STRUCTURE);
        
        if ((inEdges.length == 1) && (outEdges.length == 1)) { // if the intermediate event has exactly one structure forming in and one out edge
            // get source and target object
            var inObjOcc = inEdges[0].getSource();
            var outObjOcc = outEdges[0].getTarget();
            
            // check that both objects are not null
            if ((inObjOcc == null) || (outObjOcc == null)) {
                throw getString("OBJECT_MUST_NOT_BE_NULL");
            }
            
            createConnection(inObjOcc, outObjOcc, null); // create a new connection between the source and the target object
            
            // remove intermediate event from the mapping
            epcMap.remove(bpmnMap.get(intEventOcc));
            bpmnMap.remove(intEventOcc);
            targetModel.deleteOcc(intEventOcc, true); // delete intermediate event in the target model
        }
    } // end foreach intEventOccList
}


/**
* create either a default lane or a typed lane from an object definition
*
* @method createLane
* @param {Int} typeNum - type number of lane to be created
* @param {Int} symbolNum - symbol number of lane to be created
* @param {ObjDef} orgObjDef - organizational element for which to create a lane
* @param {Boolean} isTypedLane - true: a typed lane is created, false: a default lane is created
* @return {ObjOcc} occurrence of the created lane
*/
function createLane(typeNum, symbolNum, orgObjDef, isTypedLane) {
    
    var targetOcc;
    
    if (isTypedLane) {
        if (reuseDefinitions) {
            targetOcc = bpmnSupport.createBpmnObject(orgObjDef, defaultPool, symbolNum);
        } else {
                var mergeComponent = Context.getComponent("Merge");
                var mergeScriptResult = mergeComponent.createDefCopy([orgObjDef], targetGroup);
                if (mergeScriptResult.isSuccessful()) {
                    var mergeScriptResultPair = mergeScriptResult.getMapping();
                    
                    for (var k = 0; k < mergeScriptResultPair.length; k++) {
                        if (mergeScriptResultPair[k].getSourceObject().equals(orgObjDef)) {
                            var arisObject = mergeScriptResultPair[k].getTargetObject();
                            targetOcc = bpmnSupport.createBpmnObject(arisObject, defaultPool, symbolNum);
                        }
                    }
                }
        }
    } else {
        targetDef = targetGroup.CreateObjDef(getLaneObjectType(typeNum, orgObjDef.TypeNum()), orgObjDef.Name(locale, true), locale);
        targetOcc = bpmnSupport.createBpmnObject(targetDef, defaultPool, symbolNum);
    }
    
    // store lane in the map
    laneMap.put(orgObjDef,targetOcc);
    
    return targetOcc;
}


/**
* takes an EPC service type object definition as input and returns a transformed BPMN lane of the same type as output
*
* @method transformObj
* @param {Int} typeNum - object type number of resulting BPMN object definition
* @param {Int} symbolNum - symbol number of resulting BPMN object definition
* @param {ObjDef} sourceOcc - organizational element, if the object is an organizational lane, otherwise null
* @return {ObjOcc} transformed BPMN object occurrence
*/
function transformServiceObj(typeNum, symbolNum, serviceObjDef) {
    var targetOcc;

    // create new BPMN object definition
    targetDef = targetGroup.CreateObjDef(typeNum, serviceObjDef.Name(locale, true), locale);
    
    // copy all maintained attributes from source object to target object
    copyAttributes(serviceObjDef, targetDef);
    
    // set relation between source and target object with an attribute
    setReference(serviceObjDef, targetDef);
    
    if (!activeDbFilter.IsValidSymbol(TARGET_MODEL_TYPE, symbolNum)) {
        throw formatstring1(getString("ASSERTION_TYPE_NOT_ALLOWED"), activeDbFilter.SymbolName(symbolNum));
    }
    targetOcc = bpmnSupport.createBpmnObject(targetDef, null, symbolNum);
    
    return targetOcc;
}


/**
* takes an EPC object definition as input and returns a transformed BPMN object definition of the same type as output
*
* @method transformObj
* @param {ObjOcc} sourceOcc - source object occurrence to be transformed
* @param {Int} typeNum - object type number of resulting BPMN object definition
* @param {Int} symbolNum - symbol number of resulting BPMN object definition
* @param {ObjDef} sourceOcc - organizational element, if the object is an organizational lane, otherwise null
* @return {ObjOcc} transformed BPMN object occurrence
*/
function transformObj(sourceOcc, typeNum, symbolNum, orgObjDef) {
    var targetOcc;

    // create new BPMN object definition
    targetDef = targetGroup.CreateObjDef(typeNum, sourceOcc.ObjDef().Name(locale, true), locale);
    
    // copy all maintained attributes from source object to target object
    copyAttributes(sourceOcc.ObjDef(), targetDef);
    
    // set relation between source and target object with an attribute
    setReference(sourceOcc.ObjDef(), targetDef);
    
    if (!activeDbFilter.IsValidSymbol(TARGET_MODEL_TYPE, symbolNum)) {
        throw formatstring1(getString("ASSERTION_TYPE_NOT_ALLOWED"), activeDbFilter.SymbolName(symbolNum));
    }
    targetOcc = bpmnSupport.createBpmnObject(targetDef, null, symbolNum);
    
    createFAD(sourceOcc, targetOcc, [], [], true);
    
    // add the new object to mapping
    bpmnMap.put(targetOcc, sourceOcc);
    epcMap.put(sourceOcc,targetOcc);
    
    return targetOcc;
}

/**
* get type number of lane
*
* @method getLaneObjectType
* @param {int} typeNum - type number of object to be transformed
* @param {int} objTypeNum - typeNumber of org element to be transformed
* @return {int} type number of lane to be created
*/
function getLaneObjectType(typeNum, objTypeNum) {
    
    if (TARGET_MODEL_TYPE == Constants.MT_BPMN_COLLABORATION_DIAGRAM) {
        return Constants.OT_BPMN_LANE;
    } else {
        if (typeNum == Constants.OT_APPL_SYS_TYPE) {
            return typeNum;
        } else {
            return objTypeNum;
        }
    }
}


/**
* returns the occurrence of the function object from the provided FAD
*
* @method getFunctionOccurrenceFromFAD
* @param {Model} fadModel - model in which to search for a function occurrence
* @return {ObjOcc} the function occurrence, if one exists; null otherwise
*/
function getFunctionOccurrenceFromFAD(fadModel) {
    
    if (fadModel == null) {
        return null;
    }
    
    var funcOccs = fadModel.ObjOccListFilter(Constants.OT_FUNC);
    
    // if a function is found, return it; there should be exactly one
    if (funcOccs.length>0) {
        return funcOccs[0];
    }
    return null;
}


/**
* returns the FAD that already exists for this objects or creates a new one
*
* @method getOrCreateFAD
* @param {ObjOcc} sourceOcc - object occurrence in source model
* @param {ObjOcc} targetOcc - object occurrence in target model
* @return {Model} the obtained or created FAD model
*/
function getOrCreateFAD(sourceOcc, targetOcc) {
    
    // check if FAD already exists
    var fadModel = fadMap.get(targetOcc);
    
    if (fadModel == null) {
        // create new FAD and assign it to target object
        fadModel = targetGroup.CreateModel(Constants.MT_FUNC_ALLOC_DGM, sourceOcc.ObjDef().Name(locale, true), locale);
        targetOcc.ObjDef().CreateAssignment(fadModel);
        
        //store the fadModel in the map
        fadMap.put(targetOcc, fadModel);
    }
    
    return fadModel;
}


/**
* get the default symbol of an organizational element for FAD
*
* @method getSymbolForFAD
* @param {ObjDef[]} objDef - object definition for which to get the type number
* @return {Int} symbol type number to be used in FAD
*/
function getSymbolForFAD(objDef) {
    
    switch (objDef.TypeNum()) {
        case Constants.OT_PERS_TYPE:
            return Constants.ST_EMPL_TYPE;
        case Constants.OT_ORG_UNIT_TYPE:
            return Constants.ST_ORG_UNIT_TYPE_2;
        case Constants.OT_ORG_UNIT:
            return Constants.ST_ORG_UNIT_2;
        case Constants.OT_POS:
            return Constants.ST_POS;
        case Constants.OT_GRP:
            return Constants.ST_GRP;
        
        default: return objDef.getDefaultSymbolNum();
    }    
}


/**
* places the provided satellites inside the provided FAD model
*
* @method placeSatellitesInFADModel
* @param {Model} model - the target FAD model
* @param {ObjDef[]} satellites - object definitions for which to create occurrences in the FAD model
* @param {CxnOcc[]} connectionTypes - the connection types to be used (satellite[i] is connected to the function via connectionType[i])
* @param {ObjOcc} taskOcc - the occurrence of the function in the FAD model
* @return {null}
*/
function placeSatellitesInFADModel(model, satellites, connectionTypes, taskOcc) {
    
    for (i = 0; i < satellites.length; i++) {
        
        var symbolNum = getSymbolForFAD(satellites[i]);
        
        if (activeDbFilter.IsValidSymbol(Constants.MT_FUNC_ALLOC_DGM, symbolNum)) {
            
            var satOcc = createSatelliteObjOcc(satellites[i], model, symbolNum);
              
            if (satOcc == null) {
                continue;
            }
              
            // if the connection type is not yet determined (organizational element), get the connection type
            if (connectionTypes[i] == -1) {
                var cxnTypeNum = getConnectionTypeNum(satOcc);
                var cxn = model.CreateCxnOcc(true, satOcc, taskOcc, cxnTypeNum, new Array());
                setDefaultLineStyle(cxn);
            } else {
                var cxn = model.CreateCxnOcc(true, satOcc, taskOcc, connectionTypes[i], new Array());
                setDefaultLineStyle(cxn);
            }
        }
    }
}


/**
* copies the satellites from the source FAD model to the target FAD model
*
* @method copySatelliteObjects
* @param {Model} bpmnFadModel - the target FAD model
* @param {ObjOcc[]} connectedObjOccs - object occurrences for which to create occurrences in the FAD model
* @return {null}
*/
function copySatelliteObjects(bpmnFadModel, connectedObjOccs, funcOcc, taskOcc) {
    
    for (var j = 0; j < connectedObjOccs.length; j++) {
        
        // create satellite object in the FAD model
        var createdObjOcc = createSatelliteObjOcc(connectedObjOccs[j].ObjDef(), bpmnFadModel, connectedObjOccs[j].OrgSymbolNum());
        
        if (createdObjOcc == null) {
            continue;
        }
        
        // get all out edges of the object
        var edges = connectedObjOccs[j].OutEdges(Constants.EDGES_ALL);
        
        // get the edge pointing to the function
        var cxnType = null;
        for (var k = 0; k < edges.length; k++) {
            if (edges[k].TargetObjOcc().IsEqual(funcOcc)) {
                cxnType = edges[k];
            }
        }
        // create cxn between createdOcc and function in FAD
        var cxn = bpmnFadModel.CreateCxnOcc(true, createdObjOcc, taskOcc, cxnType.getDefinition().TypeNum(), new Array());
    }
}


/**
* creates an FAD model using the provided satellites
*
* @method createFAD
* @param {ObjOcc} sourceOcc - object occurrence in source model
* @param {ObjOcc} targetOcc - object occurrence in target model
* @param {ObjOcc[]} satellites - object occurrences for which to create occurrences in the FAD model
* @param {ObjOcc[]} connectionTypes - the connection types to be used (satellite[i] is connected to the function via connectionType[i])
* @param {boolean} copySatellites - copy satellites from original FAD model
* @return {null}
*/
function createFAD(sourceOcc, targetOcc, satellites, connectionTypes, copySatellites) {
    
    var assignedModels = sourceOcc.ObjDef().AssignedModels(Constants.MT_FUNC_ALLOC_DGM);
    var connectedObjOccs = new Array();
    var epcFadModel = assignedModels[0];
    var funcOcc = getFunctionOccurrenceFromFAD(epcFadModel);
    
    // if there exists an FAD, get the connected objects
    if (assignedModels.length > 0) {
        connectedObjOccs = funcOcc.getConnectedObjOccs([], Constants.EDGES_IN);
    }
    
    // if there are no transformation relevant satellite objects or no satellites in the source FAD, return
    if (satellites.length == 0 && (connectedObjOccs.length == 0 || !transformAllFADObjects)) {
        return;
    }
    
    if (connectedObjOccs.length > 0) {
        var counter = false;
        for (var i = 0; i < connectedObjOccs.length; i++) {
            if (!fadObjSet.contains(connectedObjOccs[i].ObjDef())) {
                counter = true;
            }
        }
        if (!counter && (satellites==null || satellites.length == 0)) {
            return;
        }
    }
    
    // get existing FAD or create empty FAD
    bpmnFadModel = getOrCreateFAD(sourceOcc, targetOcc);
    
    // get the function occurrence
    var taskOcc = getFunctionOccurrenceFromFAD(bpmnFadModel);
    
    // place the satellites in the FAD model
    placeSatellitesInFADModel(bpmnFadModel, satellites, connectionTypes, taskOcc);
    
    if (transformAllFADObjects && copySatellites) {
        copySatelliteObjects(bpmnFadModel, connectedObjOccs, funcOcc, taskOcc);
    }
    
    bpmnFadModel.doLayout();
}


/**
* transform all connection occurrences in the EPC model to appropriate connections in the BPMN model, if applicable
*
* @method transformConnections
* @return {null}
*/
function transformConnections() {
    // get a sorted list of all connection occurrences from the input EPC model
    var cxnOccurrences = sourceModel.CxnOccList().sort();
    for (var m = 0; m < cxnOccurrences.length; m++) { // foreach connection occurrences
        var cxnOcc = cxnOccurrences[m]; // get current connection occurrence
        
        // get source and target object occurrences of connection
        var sourceOcc = cxnOcc.SourceObjOcc();
        var targetOcc = cxnOcc.TargetObjOcc();
        
        // get BPMN equivalents of EPC objects
        var bpmnSourceOcc = epcMap.get(sourceOcc);
        var bpmnTargetOcc = epcMap.get(targetOcc);
        
        if ((bpmnSourceOcc != null) && (bpmnTargetOcc != null)) { // if both objects are also available in the BPMN model
            // create a connection between the two BPMN objects
            createConnection(bpmnSourceOcc, bpmnTargetOcc, null);
        }
    } // end foreach cxnOccurrences
}


/**
* place rules, events and satellites in correct lanes, depending on the connected task type
*
* @method lanePlacement
* @return {null}
*/
function lanePlacement() {
    // place the functions in the assigned lanes
    placeFunctionsInLanes();
    
    // place the rule objects in their lane depending on thier neighboring function objects
    placeRulesInLanes();
    
    // place the events in their lane, if applicable
    placeEventsInLanes();
    
    // if the default lane is not needed after applying the transformation rules, remove it from the model
    if (defaultLane.getEmbeddedObjOccs().length == 0) {
        bpmnSupport.setBpmnParent(defaultLane, null);
        targetModel.deleteOcc(defaultLane, true);
    }
}


/**
* places all functions in their respective lanes
*
* @method placeFunctionsInLanes
* @param {ObjOcc[]} funcOccs - the list of function object occurrences from the input model
* @return {null}
*/
function placeFunctionsInLanes() {
    // get a sorted list of all object occurrences of type 'function' from the EPC model
    var funcOccs = sourceModel.ObjOccListFilter(Constants.OT_FUNC);
    for (var u = 0; u < funcOccs.length; u++) { // for all occurrences in the input model
        // get the current object occurrence
        var curFuncOcc = funcOccs[u];
        var lane = objLaneMap.get(curFuncOcc);
        
        // put the 'function' object in its according lane
        placeObjectInLane(curFuncOcc, lane);
    }
}


/**
* places all rules in their respective lanes
*
* @method placeRulesInLanes
* @param {ObjOcc[]} ruleOccs - the list of rule type object occurrences from the input model
* @return {null}
*/
function placeRulesInLanes() {
    // get a sorted list of all object occurrences of type 'rule' from the EPC model
    var ruleOccs = sourceModel.ObjOccListFilter(Constants.OT_RULE);
    for (var v = 0; v < ruleOccs.length; v++) { // for all occurrences in the input model
        var curRuleOcc = ruleOccs[v]; // get the current object occurrence
        // get all incoming and outgoing function objects
        var outOccList = curRuleOcc.getConnectedObjOccs([], Constants.EDGES_OUT);
        var inOccList = curRuleOcc.getConnectedObjOccs([], Constants.EDGES_IN);
        
        var outOccs = outOccList.filter(function (e) {return (e.ObjDef().TypeNum() == Constants.OT_FUNC) && (e.OrgSymbolNum() != Constants.ST_PRCS_IF);});
        var inOccs = inOccList.filter(function (e) {return (e.ObjDef().TypeNum() == Constants.OT_FUNC) && (e.OrgSymbolNum() != Constants.ST_PRCS_IF);});
        
        if (outOccs.length == 0) {
            if (inOccs.length == 0) {
                // if the object has no incoming or outgoing edges to functions, place it in the default lane
                bpmnSupport.setBpmnParent(epcMap.get(curRuleOcc), defaultLane);
            } else { // inOccs.length > 0
                var lane = objLaneMap.get(curRuleOcc);
                checkIfObjectCanBePlacedInLane(curRuleOcc, lane, inOccs)
            }
        } else { // outOccs.length > 0
            var lane = objLaneMap.get(curRuleOcc);
            checkIfObjectCanBePlacedInLane(curRuleOcc, lane, outOccs)
        }
    } // end foreach ruleOcc
}


/**
* places all events in their respective lanes
*
* @method placeEventsInLanes
* @param {ObjOcc[]} eventOccs - the list of event type object occurrences from the input model
* @return {null}
*/
function placeEventsInLanes() {
    // get a sorted list of all object occurrences of type 'event' from the EPC model
    var eventOccs = sourceModel.ObjOccListFilter(Constants.OT_EVT);
    
    for (var w = 0; w < eventOccs.length; w++) { // for all occurrences in the input model
        var eventOcc = eventOccs[w];
        
        // get all incoming and outgoing function and rule objects
        var outOccList = eventOcc.getConnectedObjOccs([], Constants.EDGES_OUT);
        var inOccList = eventOcc.getConnectedObjOccs([], Constants.EDGES_IN);
        
        var outOccs = outOccList.filter(function (e) {
            return ([Constants.OT_FUNC, Constants.OT_RULE].indexOf(e.ObjDef().TypeNum()) >= 0) && (e.OrgSymbolNum() != Constants.ST_PRCS_IF);
        });
        
        var inOccs = inOccList.filter(function (e) {
            return ([Constants.OT_FUNC, Constants.OT_RULE].indexOf(e.ObjDef().TypeNum()) >= 0) && (e.OrgSymbolNum() != Constants.ST_PRCS_IF);
        });
        
        if (outOccs.length == 0) {
            if (inOccs.length == 0) {
                // if the object has no incoming or outgoing edges to functions, place it in the default lane
                bpmnSupport.setBpmnParent(epcMap.get(eventOcc), defaultLane);
            } else { // inOccs.length > 0
                var lane = objLaneMap.get(eventOcc);
                checkIfObjectCanBePlacedInLane(eventOcc, lane, inOccs);
            }
        } else { // outOccs.length > 0
            var lane = objLaneMap.get(eventOcc);
            checkIfObjectCanBePlacedInLane(eventOcc, lane, outOccs);
        }
    } // end foreach eventOcc
}


/**
* puts the occurrence in the specified lane, depending on the connected objects
*
* @method checkIfObjectCanBePlacedInLane
* @param {ObjOcc} occ - the object occurrence to be placed in the lane
* @param {ObjOcc} lane - the lane into which the occurrence should be placed
* @param {ObjOcc[]} connectedObjOccs - the list of connected object occurrences
* @return {null}
*/
function checkIfObjectCanBePlacedInLane(occ, lane, connectedObjOccs) {
    if (connectedObjOccs.length == 1) { // object has one relevant connected object
        // get the lane that is assigned to the connected object
        var lane = objLaneMap.get(connectedObjOccs[0]);
        
        // place the object in the provided lane
        placeObjectInLane(occ, lane);
    } else { // two relevant connected objects, lane assignment cannot be determined uniquely
        // place the object in the default lane
        bpmnSupport.setBpmnParent(epcMap.get(occ), defaultLane);
    }
}

/**
* places the given object in the given lane, if applicable
*
* @method placeObjectInLane
* @param {ObjOcc} occ - the object occurrence to be placed in the lane
* @param {ObjOcc} lane - the lane into which the occurrence should be placed
* @return {null}
*/
function placeObjectInLane(occ, lane) {
    if (lane != null) { // lane does exist
        // put the object in the provided lane
        bpmnSupport.setBpmnParent(lane, defaultPool);
        bpmnSupport.setBpmnParent(epcMap.get(occ), lane);
        
        // assign the object to the lane in the mapping
        objLaneMap.put(occ, lane);
    } else if (epcMap.get(occ) != null){ // lane does not exist
        // put the object in the default lane
        bpmnSupport.setBpmnParent(epcMap.get(occ), defaultLane);
    }
}


/**
* set transformation specific model attributes for a source and target model of an EPC to BPMN transformation
*
* @method setModelAttributes
* @return {null}
*/
function setModelAttributes() {
    // string withe transformation profile and reference to source model
    const TRANSFORM_PROVENIENCE = sourceModel.GUID() + "," + TRANSFORMATION_PATTERN_NAME + "," + TRANSFORMATION_PATTERN_ID + "," + TRANSFORMATION_PATTERN_PROFILE_ID;
    
    // set BPM project category attribute for BPMN model
    targetModel.Attribute(Constants.AT_BPM_PROJECT_CATEGORY, locale).setValue(Constants.AVT_SOLUTION_DESIGN);
    
    // set new integration status attribute for BPMN model
    targetModel.Attribute(Constants.AT_INTEGR_STATUS, locale).setValue(Constants.AVT_INTEGR_STATUS_TRANSFORMED_FROM_BUSIN_PROC);
    
    // store GUID of source model in attribute of the target model for switching between the two models
    targetModel.Attribute(Constants.AT_SOURCE_BUSINESS_PROCESS, locale).setValue(sourceModel.GUID()+";000001");
    
    // store GUID of target model in attribute of the source model for switching between the two models
    sourceModel.Attribute(Constants.AT_TARGET_BPMN_PROCESS, locale).setValue(targetModel.GUID());
    
    // store the source model in attribute for switching between the two models
    targetModel.Attribute(Constants.AT_MOD_TRANSFORM_PROVENIENCE, locale).setValue(TRANSFORM_PROVENIENCE);
}

/**
* detects the appropriate type of BPMN event when transforming an event from EPC to BPMN (start, end, intermediate)
*
* @method getEventSymbolType
* @param {ObjOcc} obj - EPC event object occurrence whose BPMN symbol type will be determined
* @return {Int} type - BPMN event symbol type number
*/
function getEventSymbolType(obj) {
    // get all incoming connections from structure forming objects
    var inCxns = obj.InEdges(Constants.EDGES_STRUCTURE);
    var isStartEvent = true;
    
    // if only one of the connected objects is not a process interface, the current object is not a start event
    for (var t = 0; t < inCxns.length; t++) {
        if (!isActualProcessInterface(inCxns[t].getSource())) {
            isStartEvent = false
        };
    }
    
    // get all outgoing connections to structure forming objects
    var outCxns = obj.OutEdges(Constants.EDGES_STRUCTURE);
    var isEndEvent = true;
    
    // if only one of the connected objects is not a process interface, the current object is not an end event
    for (var s = 0; s < outCxns.length; s++) {
        if (!isActualProcessInterface(outCxns[s].getTarget())) {
            isEndEvent = false;
        }
    }
    
    // return the appropriate event symbol type
    if (isStartEvent) {
        return Constants.ST_BPMN_START_EVENT;
    }
    
    if (isEndEvent) {
        return Constants.ST_BPMN_END_EVENT;
    }
    
    return Constants.ST_BPMN_INTERMEDIATE_EVENT;
}


/**
* check if the object occurrence occurs at the start or end of a control flow
*
* @method isActualProcessInterface
* @param {ObjOcc} occ - object occurrence for which to determine if it is used correctly as a process interface
* @return {Bool} true if the object is correclty placed in a control flow, false otherwise
*/
function isActualProcessInterface(occ) {
    // get the incoming and outgoing strucutre forming edges of the object
    var inCxns = occ.InEdges(Constants.EDGES_STRUCTURE);
    var outCxns = occ.OutEdges(Constants.EDGES_STRUCTURE);
    
    // if the object is a process interface and has either no incoming or outgoing structure-forming connections, return true
    return (((inCxns.length == 0) || (outCxns.length == 0)) && (occ.OrgSymbolNum() == Constants.ST_PRCS_IF));
}


/**
* return the appropriate rule symbol for the given input object
*
* @method getRuleSymbolType
* @param {ObjOcc} occ - object occurrence for which to determine the rule type
* @return {Int} type - rule type constant
*/
function getRuleSymbolType(occ) {
    const symbolNum = occ.OrgSymbolNum();
    switch (symbolNum) {
        case Constants.ST_OPR_XOR_1:
        case Constants.ST_XOR:
        return Constants.ST_BPMN_RULE_XOR_3;
        break;
        
        case Constants.ST_OPR_AND_1:
        case Constants.ST_AND:
        return Constants.ST_BPMN_RULE_AND_1;
        break;
        
        case Constants.ST_OPR_OR_1:
        case Constants.ST_OR:
        return Constants.ST_BPMN_RULE_OR_1;
        break;
        
        default: return Constants.ST_BPMN_RULE_1;
    }
}


/**
* if the 'IMPLEMENT_AS' attribute of a function is set, transform the function according to the provided value
*
* @method transformViaAttribute
* @param {ObjOcc} occ - the object occurrence for which to determine if it can be transformed via its attribute
* @return {bool} true if the function was successfully converted to a user task, false otherwise
*/
function transformViaAttribute(sourceOcc) {
    // get the new and the deprecated attribute
    var implementAsAttr = sourceOcc.ObjDef().Attribute(Constants.AT_IMPLEMENT_AS, locale);
    var implementAsUserTaskAttr = sourceOcc.ObjDef().Attribute(Constants.AT_IMPLEMENT_AS_USER_TASK, locale);
    
    var taskType;
    if (implementAsAttr!=null && implementAsAttr.getValue()!="") { // 'implement as' attribute is set
        switch (implementAsAttr.MeasureUnitTypeNum()) {
            case Constants.AVT_IMPLEMENT_AS_USER_TASK: {
                taskType = Constants.ST_BPMN_USER_TASK;
                break;
            }
            
            case Constants.AVT_IMPLEMENT_AS_SERVICE_TASK: {
                taskType = Constants.ST_BPMN_SERVICE_TASK;
                break;
            }
            
            case Constants.AVT_IMPLEMENT_AS_MANUAL_TASK: {
                taskType = Constants.ST_BPMN_MANUAL_TASK_2;
                break;
            }
            
            default: return false;
        }
    } else if ((implementAsUserTaskAttr != null) && (implementAsUserTaskAttr.getValue() != "")) { // fallback for deprecated attribute
        if (implementAsUserTaskAttr.getValue()) {
            taskType = Constants.ST_BPMN_USER_TASK;
            
            try { // set new attribute if user has write access
                sourceOcc.ObjDef().Attribute(Constants.AT_IMPLEMENT_AS, locale).setValue(Constants.AVT_IMPLEMENT_AS_USER_TASK);
            } catch (err) {
                // nothing
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
    
    transformObj(sourceOcc, Constants.OT_FUNC, taskType, null); //create task
    
    return true;
}


/**
* checks if the input object occurrence has an organizational element as satellite and returns it
*
* @method hasOrgElementAsSatellite
* @param {ObjOcc} objOcc - object occurrence for which to determine if it has organizational element as satellite
* @return {ObjDef} returns the objDef if an org element could be determined, null otherwise
*/
function hasOrgElementAsSatellite(objOcc) {
    // get all satellite organizational elements that are connected to the input object via the connection specified above
    var orgObjDefs = [];
    var cxnType = -1;
    
    for (var i=0; i < satellitesCreatingManualTasks.length; i++) {
        
        var connectedObjs = objOcc.ObjDef().getConnectedObjs([satellitesCreatingManualTasks[i].obj], Constants.EDGES_IN, [satellitesCreatingManualTasks[i].cxn]);
        if (connectedObjs.length == 1) {
            cxnType = satellitesCreatingManualTasks[i].cxn;
        }
        orgObjDefs = orgObjDefs.concat(connectedObjs);
    }
    
    if (orgObjDefs.length == 1) { // org element is unique on the definition level
        return [orgObjDefs[0], cxnType];
    } else if (orgObjDefs.length > 1) { // multiple org elements on the definition level
        
        var inEdges = objOcc.InEdges(Constants.EDGES_ALL);
        
        var filteredEdges = inEdges.filter(
        function (e) {
            for (var i=0; i < satellitesCreatingManualTasks.length; i++) {
                if (satellitesCreatingManualTasks[i].cxn == e.Cxn().TypeNum() 
                && satellitesCreatingManualTasks[i].obj == e.getSource().ObjDef().TypeNum()) {
                    return true;
                }
            }
            return false;
        });
        
        if (filteredEdges.length == 1) { // org element is unique on the occurrence level
            return [filteredEdges[0].getSource().ObjDef(), filteredEdges[0].Cxn().TypeNum()];
        }
    }
    
    // no org elements attached to the function and org elements not unique on both the defintion and occurrence level
    return null;
}


/**
* transforms the function to a manual task, places the function in an org lane and creates an FAD, if applicable
*
* @method transformToManualTask
* @param {ObjOcc} sourceOcc - occurrence of source object
* @param {Int} tasktype - current task type
* @return {bool} true if the function was successfully transformed to a manual task and placed in the correct lane, false otherwise
*/
function transformToManualTask(sourceOcc, tasktype) {
    var curTaskType = Constants.ST_BPMN_MANUAL_TASK_2;
    if (tasktype != Constants.ST_BPMN_TASK) {
        curTaskType = tasktype;
    }
    
    var orgObjDef = null;
    var cxnType = null;
    
    // check if the input object has an org element via incoming 'carries out' connection as satellite
    var result = hasOrgElementAsSatellite(sourceOcc, sourceModel);
    
    if (result == null) {
        return false;
    } // no organizational element found
    else {
        orgObjDef = result[0];
        cxnType = result[1];
        if (TARGET_MODEL_TYPE == Constants.MT_ENTERPRISE_BPMN_COLLABORATION) {
            fadObjSet.add(orgObjDef);
        }
    }
    
    var laneOcc;
    
    if (!laneMap.containsKey(orgObjDef)) { // create a new lane from the organizational element
        
        laneOcc = createLane(orgObjDef.TypeNum(), getLaneSymbolType(orgObjDef), orgObjDef, TARGET_MODEL_TYPE == Constants.MT_ENTERPRISE_BPMN_COLLABORATION); // create new lane
    } else { // use existing lane that belongs to the organizational element
        laneOcc = laneMap.get(orgObjDef); // get the available lane occ from the map
    }
    
    objLaneMap.put(sourceOcc, laneOcc);
    var targetOcc = transformObj(sourceOcc, Constants.OT_FUNC, curTaskType, null); // create manual task object
    
    if (!laneMap.containsKey(orgObjDef) || (TARGET_MODEL_TYPE == Constants.MT_BPMN_COLLABORATION_DIAGRAM)) {
        createFAD(sourceOcc, targetOcc, [orgObjDef], [cxnType], false);
    }
																												   
    return true;
}

/**
* get symbol type number of lane
*
* @method getLaneSymbolType
* @param {ObjDef} typeNum - organizational object definition, for which to get the lane symbol
* @return {int} lane symbol type number
*/
function getLaneSymbolType(def) {
    
    if (TARGET_MODEL_TYPE == Constants.MT_BPMN_COLLABORATION_DIAGRAM) {
        return Constants.ST_BPMN_LANE_1;
    }
    
    switch (def.TypeNum()) {
        case Constants.OT_PERS_TYPE:
            return Constants.ST_ROLE_LANE;
        case Constants.OT_ORG_UNIT_TYPE:
            return Constants.ST_ORGUNIT_TYPE_LANE;
        case Constants.OT_ORG_UNIT:
            return Constants.ST_ORGUNIT_LANE;
        case Constants.OT_POS:
            return Constants.ST_POSITION_LANE;
        case Constants.OT_GRP:
            return Constants.ST_GROUP_LANE;
        
        default: return Constants.ST_BPMN_LANE_1;
    }    
}

/**
* get the appropriate connection type number for the organizational element
*
* @method getConnectionTypeNum
* @param {ObjOcc} occ - object occurrence for which to get the connection type
* @return {Int} connection type number of this org element
*/
function getConnectionTypeNum(occ) {
    const objTypeNum = occ.ObjDef().TypeNum();
    
    for (var i=0; i < satellitesCreatingManualTasks.length; i++) {
        if (objTypeNum == satellitesCreatingManualTasks[i].obj) {
            return satellitesCreatingManualTasks[i].cxn;
        }
    }
}


/**
* sets the default linestyle and arrow for the connection
*
* @method setDefaultLineStyle
* @param {CxnOcc} cxn - the connection for which to set the linestyle
* @return {null}
*/
function setDefaultLineStyle(cxn) {
    if (cxn != null) {
        // set the line style to the default ARIS values
        cxn.SetLine(Constants.C_GREY_40_PERCENT, Constants.PS_SOLID, 10);
        cxn.setTargetArrow(Constants.ST_ARROW_FILLED_PNT);
    }
}


/**
* transforms the function to a service task and creates an FAD, if applicable
*
* @method transformToServiceTask
* @param {ObjOcc} sourceOcc - occurrence of source object (function)
* @return {bool} true if the function was successfully transformed via a service type, false otherwise
*/
function transformToServiceTask(sourceOcc, tasktype) {
    var curTaskType = Constants.ST_BPMN_SERVICE_TASK;
    
    if (tasktype != Constants.ST_BPMN_TASK) {
        curTaskType = tasktype; // if the task type was already set to user task, use the previously set value
    }
    
    // get all service and application system type objects that are connected to the input function via incoming 'supports' connection
    //var serviceObjs = sourceOcc.ObjDef().getConnectedObjs([Constants.OT_FUNC_CLUSTER, Constants.OT_APPL_SYS_TYPE], Constants.EDGES_IN, [Constants.CT_CAN_SUPP_1]).sort();
    
    var serviceObjs = [];
    var cxnType = -1;
    
    for (var i=0; i < satellitesCreatingServiceTasks.length; i++) {
        
        var connectedObjs = sourceOcc.ObjDef().getConnectedObjs([satellitesCreatingServiceTasks[i].obj], Constants.EDGES_IN, [satellitesCreatingServiceTasks[i].cxn]);
        if (connectedObjs.length == 1) {
            cxnType = satellitesCreatingServiceTasks[i].cxn;
        }
        serviceObjs = serviceObjs.concat(connectedObjs);
    }
    
    // filter the objects by symbol
    serviceObjs = serviceObjs.filter(function (obj) {
        return filterServiceObjBySymbol(obj);
    });
    
    if (serviceObjs.length == 1) { // one application system type or service type object is connected to the input object
        if (serviceObjs[0].TypeNum() == Constants.OT_APPL_SYS_TYPE) { // function is connected to one application system type object
            // create a service task
            createServiceTask(sourceOcc, serviceObjs[0], curTaskType);
            return true;
        } else { // function is connected to one service type object
            // get application system type objects that are connected to the service type object via incoming 'supports' connection
            var astObjs = serviceObjs[0].getConnectedObjs([Constants.OT_APPL_SYS_TYPE], Constants.EDGES_IN, [Constants.CT_CAN_SUPP_1]).sort();
            
            if (astObjs.length == 0) { // if no application system type object is connected to the service type object
                // create a service task
                createServiceTask(sourceOcc, serviceObjs[0], curTaskType);
                return true;
            } else if (astObjs.length == 1) { // one application system type object is connected to the service type object
                var itfuncObjs = astObjs[0].getConnectedObjs([Constants.OT_DP_FUNC_TYPE], Constants.EDGES_INOUT).sort();
                
                if (itfuncObjs.length == 0) { // application system type object does not contains any IT function type objects
                    
                    // create a service task with an assigned FAD
                    var targetOcc = createServiceTask(sourceOcc, serviceObjs[0], curTaskType);
                    createFAD(sourceOcc, targetOcc, [astObjs[0]], [Constants.CT_CAN_SUPP_1], false);
                } else if (itfuncObjs.length == 1) { // application system type contains exactly one IT function type object
                    // create a service task with an assigned FAD
                    var targetOcc = createServiceTask(sourceOcc, serviceObjs[0], curTaskType);
                    createFAD(sourceOcc, targetOcc, [astObjs[0], itfuncObjs[0]], [Constants.CT_CAN_SUPP_1, Constants.CT_SUPP_3], false);
                } else { // SST contains multiple SSOTs
                    // create a service task with an assigned FAD
                    var targetOcc = createServiceTask(sourceOcc, serviceObjs[0], curTaskType);
                    createFAD(sourceOcc, targetOcc, [astObjs[0]], [Constants.CT_CAN_SUPP_1], false);
                }
                
                return true;
            } else { // multiple application system type objects are connected to the service type object
                // create service task
                createServiceTask(sourceOcc, serviceObjs[0], curTaskType);
                return true;
            }
        }
    } // end if (serviceObjs.length == 1)
    
    return false; // zero or more than one service or application system type element connected to the input function
}

/**
* create a service task and place it in the appropriate lane, depending on the model type
*
* @method createServiceTask
* @param {ObjOcc} sourceOcc - occurrence of source object (function)
* @param {ObjDef} objDef - service type object definition
* @param {int} curTaskType - task type
* @return {ObjOcc} created object occurrence
*/
function createServiceTask(sourceOcc, objDef, curTaskType) {
    var laneOcc;

    if (TARGET_MODEL_TYPE == Constants.MT_ENTERPRISE_BPMN_COLLABORATION && objDef.TypeNum() == Constants.OT_APPL_SYS_TYPE) {
        if (!laneMap.containsKey(objDef)) { // create a new lane from the organizational element
            
            laneOcc = transformServiceObj(Constants.OT_APPL_SYS_TYPE, Constants.ST_AST_LANE, objDef); // create new lane
        } else { // use existing lane that belongs to the organizational element
            laneOcc = laneMap.get(objDef); // get the available lane occ from the map
        }
        
        // store lane in the map
        laneMap.put(objDef,laneOcc);
    
        objLaneMap.put(sourceOcc, laneOcc);
    }
    return transformObj(sourceOcc, Constants.OT_FUNC, curTaskType, null); // create service task object
}

/**
* filter ObjOccs by service type symbol
*
* @method filterServiceObjBySymbol
* @param {ObjDef} serviceObj - service type object to be filtered
* @param {String[]} symbolList - list of symbol types
* @return {bool} true if the service type object matches one of the symbols from the list, false otherwise
*/
function filterServiceObjBySymbol(serviceObj) {
    var occList = serviceObj.OccListInModel(sourceModel);
    
    for (var i = 0; i < occList.length; i++) {
        var resultList = occList.filter(function (obj) {
            
            for (var j = 0; j < satelliteSymbolsCreatingServiceTasks.length; j++) {
                if (obj.OrgSymbolNum() == satelliteSymbolsCreatingServiceTasks[j].sym) {
                    return true;
                }
            }
        });
        
        if (resultList.length > 0) {
            return true;
        }
    }
    
    return false;
}


/**
* creates an object occurrence of the provided object in the provided model
*
* @method createSatelliteObjOcc
* @param {ObjDef} object - object occurrence to be placed inside the model
* @param {Model} fadModel - model where the object occurrence shall be placed
* @return {null}
*/
function createSatelliteObjOcc(object, fadModel, symbolNum) {
    
    if (fadObjSet.contains(object)) {
        return;
    }
    
    if (reuseDefinitions) {
        //reuse the existing definition and create a new occurrence
        var createdObjOcc = fadModel.createObjOcc(symbolNum, object, 0, 0, true);
        fadObjSet.add(object);
        return createdObjOcc;
    } else {
        //create a new definition for the object occurrence
        var mergeComponent = Context.getComponent("Merge");
        var mergeScriptResult = mergeComponent.createDefCopy([object], targetGroup);
        if (mergeScriptResult.isSuccessful()) {
            var mergeScriptResultPair = mergeScriptResult.getMapping();
            
            for (var k = 0; k < mergeScriptResultPair.length; k++) {
                if (mergeScriptResultPair[k].getSourceObject().equals(object)) {
                    var arisObject = mergeScriptResultPair[k].getTargetObject();
                    var createdObjOcc = fadModel.createObjOcc(symbolNum, arisObject, 0, 0, true);
                    fadObjSet.add(object);
                    return createdObjOcc;
                }
            }
        }
    }
}


/**
* transforms the function to a user task and creates an FAD, if applicable
*
* @method checkForUserTask
* @param {ObjOcc} sourceOcc - occurrence of source object (function)
* @return {bool} true if the function was successfully transformed via a screen satellite, false otherwise
*/
function checkForUserTask(sourceOcc) {
    // get all object definitions of type screen which are connected to the provided object
    var screenObjDefs = [];
    
    for (var i=0; i < satellitesCreatingUserTasks.length; i++) {
        screenObjDefs = screenObjDefs.concat(sourceOcc.ObjDef().getConnectedObjs([satellitesCreatingUserTasks[i].obj], Constants.EDGES_INOUT, [satellitesCreatingUserTasks[i].cxn]));
    }
    
    // if no screen is attached to the object, return false
    if (screenObjDefs.length == 0) {
        return Constants.ST_BPMN_TASK;
    }
    
    return Constants.ST_BPMN_USER_TASK;
}


/**
* copy transformation relevant attributes from a source object to a target object
*
* @method copyAttributes
* @param {ObjDef} sourceObj - object from which the attributes are copied
* @param {ObjDef} targetObj - object to which the attributes are copied
* @return {null}
*/
function copyAttributes(sourceObj, targetObj) {
    var attrTypeNums = getCopyAttributeTypes(sourceObj);
    if (0 != attrTypeNums.length) {
        var langList = targetObj.Database().LanguageList();
        
        for (var i=0; i < langList.length; i++) {
            var currentlanguage = langList[i];
            copyAttributesForLanguageAndType(sourceObj, targetObj, currentlanguage.LocaleId(), attrTypeNums);
        }
    }
}


/**
* get all attribute types for the copy operation
*
* @method getCopyAttributeTypes
* @param {ObjDef} sourceObj - object from which the attributes are copied
* @return {int[]} all possible attribute types
*/
function getCopyAttributeTypes(sourceObj) {
    var attrTypeNums = activeDbFilter.AttrTypeInfo(sourceObj.KindNum(), 2 | 4 | 8 | 16 | 32 | 64);
    var copyAttrs = new java.util.HashSet();
    for (var i=0; i < attrTypeNums.length; i++){
        var attrTypeNum = attrTypeNums[i];
        
        if (!isIgnoreAttribute(attrTypeNum)) {
            copyAttrs.add(attrTypeNum);
        }
    }
    
    return [].concat(copyAttrs.toArray());
}


/**
* some attributes are virtual or not usable for a copy
*
* @method isIgnoreAttribute
* @param {int} typeNum - type number to check
* @return {boolean} can be used for a copy
*/
function isIgnoreAttribute(typeNum) {
    switch (typeNum) {
        case Constants.AT_LAST_CHNG_2:
        case Constants.AT_TYPE_6:
        case Constants.AT_CREATOR:
        case Constants.AT_LUSER:
        case Constants.AT_CREAT_TIME_STMP:
        return true;
        
        default: return false;
    }
}


/**
* copy transformation relevant attributes from a source object to a target object
*
* @method copyAttributes
* @param {ObjDef} sourceObj - object from which the attributes are copied
* @param {ObjDef} targetObj - object to which the attributes are copied
* @param {int} languageID - locale ID to copy the attributes
* @param {int[]} attrTypeNums - array of attr type nums to copy
* @return {null}
*/
function copyAttributesForLanguageAndType(sourceObj, targetObj, languageID, attrTypeNums) {
    var sourceAttrMap = sourceObj.AttrMap(languageID, attrTypeNums, false);
    if (!sourceAttrMap.isEmpty()) {
        var attributeMap = transformToAddableAttrMap(sourceAttrMap);
        // copy all maintained attributes from source object to target object
        targetObj.WriteAttributes(attributeMap, languageID);
    }
}


/**
* Transforms a HashMap got from .AttrMap(...) to a HashMap which can be written to an item
*
* @param originMap The Map gotten from .AttrMap(...)
* @return A HashMap that can be written to an item
*/
function transformToAddableAttrMap(originMap){
    var entrySet = originMap.entrySet().toArray();
    var newMap = {};
    for (var i = 0; i < entrySet.length; i++) {
        var key = entrySet[i].getKey();
        var attr = entrySet[i].getValue();
        
        if (canCopyAttribute(attr)) {
            newMap[key] = attr.getValue();
        }
    }
    return newMap;
}


/**
* some attributes can not be copies with the report interface --> filter these attributes!
*
* @method canCopyAttribute
* @param {IAttr} attribute to check
* @return {boolean} can be used for a copy
*/
function canCopyAttribute(attr) {
    switch (activeDbFilter.AttrBaseType(attr.TypeNum())) {
        case Constants.ABT_BITMAP:
        case Constants.ABT_BLOB:
        case Constants.ABT_TIMESTAMP:
        case Constants.ABT_TIMESPAN:
        return false;
        
        default: return true;
    }
}


/**
* set backward reference to identify the source element(from the EPC model) with the generated element(from the BPMN2 model)
*
* @method setReference
* @param {IObjDef} source object definition
* @param {IObjDef} target object definition
* @return {boolean} can be used for a copy
*/
function setReference(sourceDef, targetDef) {
    var sourceGUID = sourceDef.GUID();
    var transformAttr = targetDef.Attribute(Constants.AT_MOD_TRANSFORM_SRC_OBJ, locale);
    
    if (transformAttr.IsValid()) {
        transformAttr.setValue(sourceGUID);
    }
}


/**
* truncates a string that exceeds a given length and appends an ending
*
* @method truncate_string
* @param {String} str - the string to be truncated
* @param {int} length - length of the string after truncation
* @param {int} ending - the appended ending, if the string was truncated
* @return {String} the truncated string
*/
function truncate_string(str, length, ending) {
    if (length == null) {
        length = 250;
    }
    
    if (ending == null) {
        ending = '...';
    }
    
    if (str.length > length) {
        return str.substring(0, length - ending.length) + ending;
    } else {
        return str;
    }
};


// ===============================================================================
// ===============================================================================
// ===============================================================================


var treeGroupIndices = new Array();
var treeElementIndices = new Array();
var buttonOkayPressed = false;

function optionsDialog() {
    this.getPages = function() {
        var MoveOptionsDialog = Dialogs.createNewDialogTemplate(520, 340, getString("DIALOG_HEADER"), "ProcessMoveOptionsDlgEvents");
        MoveOptionsDialog.GroupBox(5, 10, 500, 330, getString("DIALOG_GROUP1_HEADER"));
        MoveOptionsDialog.OptionGroup("target_selection");
        MoveOptionsDialog.OptionButton(15, 20, 400, 15, getString("DIALOG_TARGET_GROUP_1"), "optBtn_sameGroup");
        MoveOptionsDialog.OptionButton(15, 40, 400, 15, getString("DIALOG_TARGET_GROUP_2"), "optBtn_followingGroup");
        MoveOptionsDialog.Tree(35, 60, 450, 250, "tree_panel", 1);
        MoveOptionsDialog.CheckBox(15, 315, 400, 15, getString("DIALOG_CREATE_SUBGROUPS"), "create_subgroups");
        
        MoveOptionsDialog.GroupBox(5, 350, 500, 55, getString("DIALOG_GROUP2_HEADER"));
        MoveOptionsDialog.CheckBox(15, 355, 400, 15, getString("DIALOG_SOURCE_RECURSIVE"), "subgroups_cb");
        MoveOptionsDialog.Text(15, 385, 280, 15, getString("DIALOG_NUMBER_OF_MODELS"), "modelnum_text");
        
        MoveOptionsDialog.GroupBox(5, 415, 500, 50, getString("OUTPUT_MODEL_TYPE"));
        MoveOptionsDialog.OptionGroup("model_type_selection");
        MoveOptionsDialog.OptionButton(15, 425, 380, 15, getString("ENTERPRISE_BPMN_COLLABORATION"), "optBtn_ebpmn");
        MoveOptionsDialog.OptionButton(15, 445, 380, 15, getString("BPMN_COLLABORATION"), "optBtn_bpmn");
        
        MoveOptionsDialog.OKButton();
        MoveOptionsDialog.CancelButton();
        MoveOptionsDialog.HelpButton("HID_d0940d90-6257-11e7-03a6-484d7eb790de_1");
        
        return MoveOptionsDialog;
    }
    
    this.target_selection_selChanged = function(index) {
        var treePanel = this.dialog.getPage(0).getDialogElement("tree_panel");
        
        if (index == 0) {
            treePanel.setSelection([0]);
            treePanel.setEnabled(false);
        } else {
            treePanel.setEnabled(true);
        }
    }
    
    this.subgroups_cb_selChanged = function(index) {
        var modelCount = findModelsInGroups(userSelection_groups, index == 1).length;
        modelCount += userSelection_models.length;
        
        this.dialog.getPage(0).getDialogElement("modelnum_text").setText(getString("DIALOG_NUMBER_OF_MODELS") + modelCount);
    }
    
    this.init = function(aPages) {        
        var tree = aPages[0].getDialogElement("tree_panel");
        var rootGroup = ArisData.getActiveDatabase().RootGroup();
        var page = this.dialog.getPage(0);
        
        // init options group
        page.getDialogElement("target_selection").setSelection(0);
		page.getDialogElement("create_subgroups").setChecked(true);
        
        // init check boxes
        if (userSelection_groups.length == 0) {
            page.getDialogElement("subgroups_cb").setEnabled(false);
        }
        
        // init tree panel
        treeGroupIndices.push(rootGroup);
        var rootItemTree = tree.addChild(null, rootGroup.Name(-1, true), treeGroupIndices.length);
        treeElementIndices.push(rootItemTree);
        buildGroupTree(rootGroup, rootItemTree, tree);
        var target_selection_index = page.getDialogElement("target_selection").getSelectedIndex();
        tree.setEnabled(target_selection_index == 1);
        
        // init model count
        var subgroups_cb_checked = page.getDialogElement("subgroups_cb").isChecked();
        var modelCount = numberOfModels(subgroups_cb_checked);
        page.getDialogElement("modelnum_text").setText(getString("DIALOG_NUMBER_OF_MODELS") + modelCount);
        
        // init model type selection
        page.getDialogElement("model_type_selection").setSelection(0);
    }
    
    this.isInValidState = function(pageNumber) {
        var page = this.dialog.getPage(0);
        
        // number of models
        var subgroups_cb_checked = page.getDialogElement("subgroups_cb").isChecked();
        if (numberOfModels(subgroups_cb_checked) == 0) {
            return false;
        }
        
        // tree panel selection
        var same_groups = page.getDialogElement("target_selection").getSelectedIndex() == 0;
        if (!same_groups) {
            var treeSelection = page.getDialogElement("tree_panel").getSelection();
            if (treeSelection == null) {
                return false;
            }
            
            if (treeSelection.length != 1) {
                return false;
            }
            
            if (treeSelection[0] == 0) {
                return false;
            }
        }
        
        return true;
    }
    
    this.canFinish = function(pageNumber) {
        return true;
    }
    
    this.onClose = function(pageNumber, bOk) {
        buttonOkayPressed = bOk;
    }
    
    this.getResult = function() {
        var page = this.dialog.getPage(0);
        var same_groups = page.getDialogElement("target_selection").getSelectedIndex() == 0;
        
        var targetGroup;
        if (!same_groups) {
            var treeSelection = page.getDialogElement("tree_panel").getSelection();
            if (treeSelection != null) {
                targetGroup = treeGroupIndices[treeSelection[0] - 1];
            } else {
                targetGroups = null;
            }
        } else {
            targetGroup = null;
        }
        
        var result = {
            createSubgroups: page.getDialogElement("create_subgroups").isChecked(),
            includeSubgroups: page.getDialogElement("subgroups_cb").isChecked(),
            targetGroup: targetGroup,
            outputEBPMN: page.getDialogElement("model_type_selection").getSelectedIndex() == 0
        };
        
        return result;
    }
}

/**
* Builds the group tree recursive in the dialog
* 
* @param rootGroup The group element whose children are added to the tree
* @param rootTreeItem The tree item which represents the rootGroup in the tree
* @param tree The tree where the new items are inserted
*/
function buildGroupTree(rootGroup, rootTreeItem, tree){
    var children = rootGroup.Childs().sort(function(group_a, group_b) {
        return (group_a.Name(locale, true).compareTo(group_b.Name(locale, true)));
    });
    
    for (var i = 0; i < children.length; i++){
        treeGroupIndices.push(children[i]);
        
        var currentTreeItem = tree.addChild(rootTreeItem, children[i].Name(locale, true), treeGroupIndices.length);
        treeElementIndices.push(currentTreeItem);
        buildGroupTree(children[i], currentTreeItem, tree);
    }
}

function propertyIsSet(name) {
    return Context.getProperty(name) != null;
}

function getBooleanPropertyValue(name, defaultValue) {
    if (propertyIsSet(name)) {
        return Context.getProperty(name);
    } else {
        return defaultValue;
    }
}

function propertyIsSet_fromPool(name, propertyPool) {
    return propertyPool.getProperty(name) != null;
}


// ===============================================================================
// ===============================================================================
// ===============================================================================


function addlineToFile_withBackground(sec1, sec2, sec3, backgroundArray) {
    addLineToFile_extended(sec1, sec2, sec3, backgroundArray, Constants.FMT_LEFT);
}

function addLineToFile_bold(sec1, sec2, sec3) {
    addLineToFile_extended(sec1, sec2, sec3, [Constants.C_WHITE, Constants.C_WHITE, Constants.C_WHITE], Constants.FMT_LEFT | Constants.FMT_BOLD);
}

function addLineToFile_extended(sec1, sec2, sec3, backgrounds, textKind) {
    outputFile.TableRow();
    outputFile.TableCell(sec1, 15, "Arial", 8 ,Constants.C_BLACK, backgrounds[0], 0, textKind, 0);
    outputFile.TableCell(sec2, 17, "Arial", 8, Constants.C_BLACK, backgrounds[1], 0, textKind, 0); // 17 for '59m 59s 999ms' to fit
    outputFile.TableCell(sec3, 68, "Arial", 8, Constants.C_BLACK, backgrounds[2], 0, textKind, 0);
}

main();
