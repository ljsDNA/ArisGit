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

// dialog y offsets
var gDialogLineY = 0;
const gHEADER = 50;
const gTEXT = 25;
const gINPUT = 15;
const gSAME = 0;
const gSTART = 15;
const gSMALL = 10;

const goValueAccess = Context.getParameterValueAccess();

// dimension key from PPM CTK
const gsDimensionKey = goValueAccess.getParameterValue("CLIENT");

// credentials
const gsUserName = goValueAccess.getParameterValue("USER");

// level of model generation
const gnLevel = goValueAccess.getParameterValue("LEVEL");
const gnEventLevel = goValueAccess.getParameterValue("EVENT_LEVEL");
const gnSubProcessLevel = goValueAccess.getParameterValue("SUBPROCESS_LEVEL");

// ARIS
const gsMatrixModelName = goValueAccess.getParameterValue("MATRIX_MODEL");
const gsProcessName = goValueAccess.getParameterValue("EPC_MODEL");

// PPM
const gsMatrixModelUrl = goValueAccess.getParameterValue("URL");

// PDF output file
const goOutfile = Context.createOutputObject();

// selected locale for report
const gnLocale = Context.getSelectedLanguage();      

// Only allowede symbol of functions in matrix model
const g_allowedFunctionSymbol = Constants.ST_FUNC;

const g_allowedGapSymbol = Constants.ST_GAP;

// Only allowed connection in matrix model
const g_allowedCxn = Constants.CT_SOLAR_CORRES;

const g_allowedGapCxn = Constants.CT_CONC_3;


// Marker for PPM functions is written to attribute AT_SRC    
const gsPPMMarker = "PPM";   

// Marker GAP is written to attribute AT_SRC    
const gsGapMarker = "PPM-Confirmation-Check";

// Map for checking if PPM function exists in ARIS      
var existingPPMfunctions = {};   

var existingPPMfunctionOccs = {};

// all ARIS function objdefs that are added to matrix model;
var usedARISColHeaders = []; 
var usedPPMRowHeader = {};  

// statistis of PPM functions
var statistic = {
    "mapping" : {
        "new" : [],   
        "old" : [],   
        "unused" : []
    }
}

// allowed BPMN models
var gBpmn = new java.util.HashSet();

var gBpmnCollaboraton = new java.util.HashSet();

var gEnterpriseBpmn = new java.util.HashSet();
var gNonEnterpriseBpmn = new java.util.HashSet();

// allowed EPC models
var gEpc = new java.util.HashSet();

// allowed process models
var gisProcess = new java.util.HashSet();

const points = [new java.awt.Point(10,10), new java.awt.Point(100,100)];
         
var SHOW_DIALOGS = Context.getProperty("INTERNAL_CALL") == null;
      
// ReadOnlyDB
var oSelectedModels = ArisData.getSelectedModels();
var sName = ArisData.getActiveDatabase().Name(-1);
var oReadOnlyDB = ArisData.openDatabase(sName, true);

// intermediate models
var gIntermediateModels = [];

var oldArisFunctions = new java.util.HashSet();
var oldPpmFunctions = new java.util.HashSet();
      
main();

/*
* Creating a matrix model from ARIS EPC's and PPM functions.
* Also create a EPC from PPM function flow
*/
function main() {
    ArisData.Save(Constants.SAVE_ONDEMAND);
    initHashSets();
    try {                
        var wizardResult;
        if (SHOW_DIALOGS) {
            wizardResult = Dialogs.showDialog(new optionsDialog(), Constants.DIALOG_TYPE_WIZARD, Context.getScriptInfo(Constants.SCRIPT_TITLE));
            if (!wizardResult.bOk) {
                // stop script if cancel was pressed
                Dialogs.MsgBox(getString("TEXT_MODEL_CANCELLED"));
                Context.setScriptError(Constants.ERR_CANCEL);
                return;                
            }
            var processTypeSelection = buildProcessTypeTree(wizardResult);
            if(processTypeSelection == null) {
                Dialogs.MsgBox(getString("TEXT_MODEL_CANCELLED"));
                Context.setScriptError(Constants.ERR_CANCEL);
                return;            
            }    
        } else {
            wizardResult = {
                "sUserName":Context.getProperty("sUserName"), 
                "sPassword":Context.getProperty("sPassword"), 
                "sUrl":Context.getProperty("sUrl"), 
                "sMatrixName":Context.getProperty("sMatrixName"), 
                "sClient":Context.getProperty("sClient"),  
                "sProcessName":Context.getProperty("sProcessName"), 
                "nLevel":Context.getProperty("nLevel"),
                "nSubProcessLevel":Context.getProperty("nSubProcessLevel"),
                "sPPMkeys":Context.getProperty("sPPMkeys"),
                "isProcessOverwrite":Context.getProperty("isProcessOverwrite"),
                "isMatrixOverwrite":Context.getProperty("isMatrixOverwrite"),
                "bOk": true
            };
            var processTypeSelection = buildProcessTypeTree(wizardResult);
        }

        wizardResult.sUrl =  processTypeSelection.href; 
        wizardResult.sPPMkeys = processTypeSelection.child;
                
        var dialogResult;
        
        var oSelectedGroup;
        
        if (SHOW_DIALOGS) {
            do {       
				var db = ArisData.getActiveDatabase();            
            	var sSelectedGroups = Dialogs.BrowseArisItems(getString("TEXT_SELECT_ONE_GROUP"), getString("TEXT_SELECT_ONE_GROUP_FOR_CREATION"), db.ServerName() , db.Name(Constants.AT_NAME), Constants.CID_GROUP);
                if(sSelectedGroups.length() == 0) {
                    Dialogs.MsgBox(getString("TEXT_MODEL_CANCELLED"));
                    return;                
                }
                var sOIDs = sSelectedGroups.split(";");
                if(sOIDs.length != 1) {
                    var dialogResult = Dialogs.MsgBox(getString("TEXT_ONLY_ONE_FOLDER"), Constants.MSGBOX_ICON_QUESTION | Constants.MSGBOX_BTN_RETRYCANCEL, getString("TEXT_MESSAGE"));
                    if(dialogResult == Constants.MSGBOX_RESULT_CANCEL) {
                        Dialogs.MsgBox(getString("TEXT_MODEL_CANCELLED"));
                        return;
                    }
                }                
                
                oSelectedGroup = ArisData.getActiveDatabase().FindOID(sOIDs[0]);
                if(!hasGroupWriteAccess(oSelectedGroup)) {
                    var dialogResult = Dialogs.MsgBox(commonUtils.attsall.formatString(getString("TEXT_FOLDER_HAS_NO_WRITE_ACCESS"), [oSelectedGroup.Name(gnLocale)]), Constants.MSGBOX_ICON_QUESTION | Constants.MSGBOX_BTN_RETRYCANCEL, getString("TEXT_MESSAGE"));
                    if(dialogResult == Constants.MSGBOX_RESULT_CANCEL) {
                        Dialogs.MsgBox(getString("TEXT_MODEL_CANCELLED"));
                        return;
                    }                    
                }
                
            }  while(dialogResult == Constants.MSGBOX_RESULT_RETRY);
       
            oSelectedGroup = ArisData.getActiveDatabase().FindOID(sOIDs[0]);

            if(modelExistMessageBox(wizardResult, getTypNumOfSelectedModel(), oSelectedGroup) == Constants.ERR_CANCEL) {
                Dialogs.MsgBox(getString("TEXT_MODEL_CANCELLED"));
                Context.setScriptError(Constants.ERR_CANCEL);                
                return;                
            }
    
            if(modelExistMessageBox(wizardResult, Constants.MT_MATRIX_MOD, oSelectedGroup) == Constants.ERR_CANCEL) {
                Dialogs.MsgBox(getString("TEXT_MODEL_CANCELLED"));
                Context.setScriptError(Constants.ERR_CANCEL);                
                return;                
            }
        } else {
            oSelectedGroup = ArisData.getActiveDatabase().FindOID(Context.getProperty("targetGroupOID_property"));
        }
                                                  
        var oPool = null;                                                             
        
        if(isCollaborationSelected())  {
            if(SHOW_DIALOGS) {
                var result = showPoolDlg()
                if(result == null) {
                    Dialogs.MsgBox(getString("TEXT_MODEL_CANCELLED"));
                    Context.setScriptError(Constants.ERR_CANCEL);                
                    return;                     
                }
                    
                oPool = result.obj;
            }
            else {
                var sPoolName = Context.getProperty("sPoolName");
                if(sPoolName == "no Pool") {
                    oPool = null;
                }
                else {
                    var oSelModel = ArisData.getSelectedModels()[0];
                    oPool = findPool(oSelModel, sPoolName);
                }
            }
        }
                                                             
        var oProcess = buildProcess(wizardResult.sProcessName, oSelectedGroup, wizardResult.isProcessOverwrite, wizardResult.nLevel, oPool, wizardResult.nSubProcessLevel);                
        var oMatrixModel = buildMatrix(wizardResult, oSelectedGroup, oProcess, wizardResult.isMatrixOverwrite);
        setPPMProceesTypToEPc(oProcess, wizardResult.sPPMkeys);
        setMatrixModelToEPc(oProcess, oMatrixModel);        
        if(hasModelNotAllowedProcessInterfaces(oProcess)) {
            throw new Exception(commonUtils.attsall.formatString(getString("TEXT_PROCESS_INTERFACES"), [wizardResult.sProcessName]));
        }
//        outputStatistic();

        if (SHOW_DIALOGS) {
            if(hasModelProcessInterfaces(oProcess)) {
                Dialogs.MsgBox(
                    commonUtils.attsall.formatString(getString("TEXT_PROCESS_INTERFACES"), [wizardResult.sProcessName]) 
                    + "\n" + commonUtils.attsall.formatString(getString("TEXT_MODEL_CREATED"), [oSelectedGroup.Name(gnLocale)]), 
                    Constants.MSGBOX_ICON_WARNING, 
                    ""
                );
            }
            else {
                Dialogs.MsgBox(commonUtils.attsall.formatString(getString("TEXT_MODEL_CREATED"), [oSelectedGroup.Name(gnLocale)]),  Constants.MSGBOX_ICON_INFORMATION, "");
            }
        }   
        Context.setProperty("reportstate", "successful");        
   }     
   catch(ex) {              
        Context.writeLog(ex.toString());   
         
        if(ex instanceof Exception) {  
            // expected exceptions
            var sDialogMessage = ex.iCode == undefined ?  ex.sMessage : commonUtils.attsall.formatString(getString("TEXT_ERROR_MESSAGE"), [ex.iCode, ex.sMessage]);
            if (SHOW_DIALOGS){
                Dialogs.MsgBox(sDialogMessage, Constants.MSGBOX_ICON_ERROR, getString("TEXT_ERROR.DBT"));
            }
            Context.setProperty("reportstate", sDialogMessage);
            return;            
        }
        // unexpected execptions
        Context.setProperty("reportstate", ex.message + "\n" + ex.lineNumber);
       
        throw ex;
    } 
    finally {
        oReadOnlyDB.close();

        for(var i = 0; i < gIntermediateModels.length; i++) {
            var oModel = gIntermediateModels[i];
            if(oModel.IsValid()) {
                oModel.Group().Delete(oModel);
            }
        }
        ArisData.Save(Constants.SAVE_NOW);
    }
}

function initHashSets() {
    var nonEnterpriceProcesses = [
        Constants.MT_BPMN_PROCESS_DIAGRAM, 
        Constants.MT_BPMN_COLLABORATION_DIAGRAM        
    ];
    
    var bpmnProcesses = [
        Constants.MT_BPMN_PROCESS_DIAGRAM, 
        Constants.MT_ENTERPRISE_BPMN_PROCESS
    ];    
    var bpmnCollaborations = [
        Constants.MT_BPMN_COLLABORATION_DIAGRAM, 
        Constants.MT_ENTERPRISE_BPMN_COLLABORATION
    ];   
    
    var enterpriseBpmns = [
        Constants.MT_ENTERPRISE_BPMN_PROCESS,
        Constants.MT_ENTERPRISE_BPMN_COLLABORATION        
    ];
    
    var epcs = [
        Constants.MT_EEPC, 
        Constants.MT_EEPC_MAT, 
        Constants.MT_EEPC_COLUMN, 
        Constants.MT_EEPC_ROW, 
        Constants.MT_EEPC_TAB, 
        Constants.MT_EEPC_TAB_HORIZONTAL,
        Constants.MT_IND_PROC,
        Constants.MT_OFFICE_PROC
    ];

    for(var i = 0; i < nonEnterpriceProcesses.length; i++) {
        var nonEnterpriceProcesse = nonEnterpriceProcesses[i];
        addAllModelTypes(gNonEnterpriseBpmn, nonEnterpriceProcesse);
    }

    
    for(var i = 0; i < enterpriseBpmns.length; i++) {
        var enterpriseBpmn = enterpriseBpmns[i];
        addAllModelTypes(gEnterpriseBpmn, enterpriseBpmn);
    }

                      
    for(var i = 0; i < bpmnProcesses.length; i++) {
        var bpmnProcess = bpmnProcesses[i];
        addAllModelTypes(gBpmn, bpmnProcess);
        addAllModelTypes(gisProcess, bpmnProcess);
    }

    for(var i = 0; i < bpmnCollaborations.length; i++) {
        var bpmnCollaboration = bpmnCollaborations[i];
        addAllModelTypes(gBpmn, bpmnCollaboration);
        addAllModelTypes(gisProcess, bpmnCollaboration);
        addAllModelTypes(gBpmnCollaboraton, bpmnCollaboration);
    }

    for(var i = 0; i < epcs.length; i++) {
        var epc = epcs[i];
        addAllModelTypes(gEpc, epc);
        addAllModelTypes(gisProcess, epc);
    }        
}

function addAllModelTypes(set, nOrgModelTypeNum) {
    var types = getModelTypesIncludingUserDefined(nOrgModelTypeNum);
    for(var i = 0; i < types.length; i++) {
        var type = types[i];
        set.add(type)    
    }
}

function findPool(oModel, sPoolName) {
    var pools = oModel.ObjOccListBySymbol([Constants.ST_BPMN_POOL_1]);
    for(var i = 0; i < pools.length; i++) {
        var oPool = pools[i];
        if(StrComp(sPoolName, oPool.ObjDef().Name(-1)) == 0) {
            return oPool.ObjDef();
        }
    }
    return null;
}

function showPoolDlg() {
    var oPools = ArisData.getSelectedModels()[0].ObjOccListBySymbol([Constants.ST_BPMN_POOL_1]);
        
    var selection = [];
    
    if(isObjectOutsidePool(ArisData.getSelectedModels()[0])) {
        selection.push({"name" : getString("TEXT_OUTSIDE_POOL.DBI"), "obj" : null});
    }
    
    // sort oPools    
    ArisData.sort(oPools, Constants.AT_NAME, gnLocale);
    
    for(var i = 0; i < oPools.length; i++) {
        var oPool = oPools[i].ObjDef();
        selection.push({"name" : oPool.Attribute(Constants.AT_NAME, gnLocale, true).getValue(), "obj" : oPool});
    }

    if(selection.length > 1) {    
        return Dialogs.showDialog(new PoolSelectionDialog(selection), Constants.DIALOG_TYPE_ACTION, getString("TEXT_SELECT_POOL.DBT"));                
    }  
    return selection[0];
}

function isObjectOutsidePool(oModel) {
    var objOccs = oModel.ObjOccList();
    for(var i = 0; i < objOccs.length; i++) {
        var objOcc = objOccs[i];    
        var objDef = objOcc.ObjDef();
        var typeNum = objDef.TypeNum();        
        if(typeNum == Constants.OT_FUNC || typeNum == Constants.OT_RULE || typeNum == Constants.OT_EVT) {
            if(objOcc.SymbolNum() == Constants.ST_BPMN_POOL_1) {
                continue;
            }        
            if(getParentPool(objOcc) == null) {
                return true;
            }
        }
    }    
    return false;
}

function isBpmnSelected() {
    return gBpmn.contains(getTypNumOfSelectedModel());
}

function isCollaborationSelected() {
    return gBpmnCollaboraton.contains(getTypNumOfSelectedModel());
}

function getTypNumOfSelectedModel() {
    var oSelModels = ArisData.getSelectedModels();
    return oSelModels[0].TypeNum();
}

function hasGroupWriteAccess(oGroup) {
    return (ArisData.ActiveUser().AccessRights(oGroup) & Constants.AR_WRITE) == Constants.AR_WRITE;
}

function setPPMProceesTypToEPc(oEPC, sPPMkeys) {
    var attrs = {};
    attrs[Constants.AT_REFERENCED_PPM_PROCESS_TYPE] = sPPMkeys;
    oEPC.WriteAttributes(attrs, gnLocale);
}

function setMatrixModelToEPc(oEPC, oMatrixModel) {
    var attrs = {};
    attrs[Constants.AT_REFERENCED_MAPPING_MATRIX] = oMatrixModel.GUID();
    oEPC.WriteAttributes(attrs, gnLocale);
}

function checkModelIsWriteable(oModel) {
    if(!oModel.canWrite(true)) {
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_PLEASE_CLOSE"), [oModel.Name(-1)]));
    }    
}

/*
* Build flat process
* oGroup: ARIS group where the process and the objDefs are created.
* sProcessName: name of the process to create
*/
function buildProcess(sProcessName, oGroup, isProcessOverwrite, level, oPool, subprocessLevel) {       
   var oSelModels = ArisData.getSelectedModels(); //  Models 
   // todo only one selected process is allowed
   return buildFlatProcess(sProcessName, oGroup, oSelModels[0], isProcessOverwrite, level, oPool, subprocessLevel);
}

/*
* Build on flat epc via process interfaces.
* sProcessName: name of the flat process
* oGroup: target group ot flat process
* oProcess: source process
* isProcessOverwrite: overwrite process
* return: flat process 
*/
function buildFlatProcess(sProcessName, oGroup, oProcess, isProcessOverwrite, level, oPool, subprocessLevel) {  
    var oTrgProcess = createOrGetProcess(sProcessName, oGroup, isProcessOverwrite );
    if(!oTrgProcess.canWrite(true)) {
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_PLEASE_CLOSE"), [sProcessName]));
    }
    deleteModelContent(oTrgProcess);
    
    if(isBpmnSelected()) {
    
        var oCombinedModel = putBpmnModelTogether(oProcess, oGroup, level, oPool, subprocessLevel);
        replaceStartEventPairsWithIntermidiate(oCombinedModel);        
        var oMergedEpc = modelGeneration(oCombinedModel, oGroup);

        removeNotAllowedObjectFromEPC(oMergedEpc);                
        copyModelContent(oMergedEpc, oTrgProcess);        
        oGroup.Delete(oMergedEpc);        
        oGroup.Delete(oCombinedModel);                
        ArisData.Save(Constants.SAVE_NOW);

    } else {
        var oMergedEpc = mergeEpcsToFlatEpc(sProcessName, oGroup, oProcess, level); 
        removeNotAllowedObjectFromEPC(oMergedEpc);
        copyModelContent(oMergedEpc, oTrgProcess);
        oGroup.Delete(oMergedEpc);
        ArisData.Save(Constants.SAVE_NOW);
    }
    return oTrgProcess;
}

function replaceStartEventPairsWithIntermidiate(oCombinedModel) {
   var intermidiateEvents = [];
        // connect end with start events
    var endEvents = findEndEvents(oCombinedModel);
    for(var i = 0; i < endEvents.length; i++) {
        var event = endEvents[i];

        var oObj = getParentBpmnOcc(event);
        var occsInModels = event.ObjDef().OccList();
        for(var j = 0; j < occsInModels.length; j++) {
            var occInModel = occsInModels[j];
            if(occInModel.SymbolNum() == Constants.ST_BPMN_START_EVENT && occInModel.Model().GUID().equals(oCombinedModel.GUID())) {
                // relevant event
                // event is same as occInModel
                intermidiateEvents.push(occInModel);
                intermidiateEvents.push(event);
            }
        }
    }
    ArisData.Save(Constants.SAVE_NOW);

    for(var i = 0; i < intermidiateEvents.length; i++) {
        var event = intermidiateEvents[i];
        event.setSymbol(Constants.ST_BPMN_INTERMEDIATE_EVENT);                                    
    }
    ArisData.Save(Constants.SAVE_NOW);
}

function modelGeneration(oCombinedModel, oGroup) {
    var modelGeneration = Context.getComponent("ModelGeneration");
    var options = modelGeneration.createModelGenerationOptions();
    options.setExpandModelDepthForProcesInterfaces(0);
    options.hideProcessInterfaces(true);
    var oMergedEpc = modelGeneration.generateModelByModels([oCombinedModel], "merged", oCombinedModel.TypeNum(), oGroup, options);
    ArisData.Save(Constants.SAVE_NOW);
    return oMergedEpc;
}


/*
* Generate one BPMN model from severel BPMN models.
* To build one model from two models, occurrence copies of the events are evaluated. 
* An end event of the first model should be used as start event in second model and vice versa. 
* The start and end event have the same object definition which will occur as intermediate event in the final model.  
* All ARIS objects and connections are added to the new one model if they fit pool and event constrains. 
* This whole process is recursive.
* oProcess: selected BPMN model
* oGroup: target group of the process
* level: level of model generation
* oPool: null => no pool selected, otherwise pool that contains al intressted elements
* return generated BPMN model
*/
function putBpmnModelTogether(oProcess, oGroup, level, oPool, subprocessLevel) {
    
    var occs = [];
    var oUniqueModel = new java.util.HashSet();
    var oOrgModel = new java.util.HashSet();
    
//    var oMergeModel = oGroup.CreateModel(oProcess.TypeNum(), "bpmn", gnLocale);
    var oMergeModel = createIntermediateModel(oGroup, oProcess.TypeNum(), "bpmn");
        
    // merge all model 
    checkModelIsWriteable(oMergeModel);
    combineModelViaEvenTpye(oProcess, oUniqueModel, occs, oMergeModel, level, oPool, oOrgModel, subprocessLevel, oGroup);
    
    for(var i = 0; i < occs.length; i++) {
        var occ = occs[i];     
        var model = occ.Model();
        if(oOrgModel.contains(model.GUID())) {
            continue;
        }
        copyModelContent(model, oMergeModel, oPool);                 
    }     
    ArisData.Save(Constants.SAVE_NOW);
    return oMergeModel;
}

/*
* Generate one BPMN model from severel BPMN models.
* An end event of the first model should be used as start event in second model and vice versa. 
* The start and end event have the same object definition which will occur as intermediate event in the final model.  
* All ARIS objects and connections are added to the new one model if they fit pool and event constrains. 
* oProcess: selected BPMN model
* type: Constants.ST_BPMN_START_EVENT or Constants.ST_BPMN_END_EVENT
* oUniqueModel:
* occs: 
* oMergeModel:
* level: level of model generation
* oPoolFilter: null => no pool selected, otherwise pool that contains al intressted elements
*/
function combineModelViaEvenTpye(oProcess, oUniqueModel, occs, oMergeModel, level, oPoolFilter, oOrgModel, subProcessLevel, oGroup) {

    if(level < 1 && subProcessLevel < 1) {
        copyModelContent(oProcess, oMergeModel, oPoolFilter);        
        return;
    }

    var oGenModels = [];
    var sfoundModelGUID = oProcess.GUID();
    if(subProcessLevel > 0 && hasBpmnModelAssignedSubprocesses(oProcess, oMergeModel) && !oOrgModel.contains(sfoundModelGUID)/*&& !oUniqueModel.contains(sfoundModelGUID)*/) {        
        var oProcess = combineModelViaSubProcesses(oProcess, oPoolFilter, subProcessLevel, oGroup, oOrgModel, oGenModels);
    }  
    copyModelContent(oProcess, oMergeModel, oPoolFilter);  
    oProcess = oMergeModel;
    for(var i = 0; i < oGenModels.length; i++) {
        oGroup.Delete(oGenModels[i]);    
    }
    ArisData.Save(Constants.SAVE_NOW);    
    
    if(level <= 0) {
        return;
    }
    var events = [];

    var endEvents = findEndEvents(oProcess);
    for(var i = 0; i < endEvents.length; i++) {
        events.push(endEvents[i]);        
    }

    var oStartEvents = findStartEvents(oProcess);
    for(var i = 0; i < oStartEvents.length; i++) {
        events.push(oStartEvents[i]);        
    }
    
    for(var i = 0; i < events.length; i++) {        
        var event = events[i];

        var occsInModels = event.ObjDef().OccList();
        for(var j = 0; j < occsInModels.length; j++) {
            var occInModel = occsInModels[j];
            // occ is not in new created model
            var oModel = occInModel.Model();
            if(!gBpmn.contains(oModel.TypeNum())) {
                continue;
            }
            if(!isParentPool(occInModel, oPoolFilter)) {
                continue;
            }            
            var sfoundModelGUID = oModel.GUID();
            if(oOrgModel.contains(sfoundModelGUID)) {
                continue;
            }
            if(!sfoundModelGUID.equals(oMergeModel.GUID()) && (isStartEndCombination(event, occInModel) || isEndStartCombination(event, occInModel))) {
                // relevant event
                if(!oUniqueModel.contains(sfoundModelGUID)) {
                    oUniqueModel.add(sfoundModelGUID);
                    occs.push(occInModel);   
                    combineModelViaEvenTpye(oModel, oUniqueModel, occs, oMergeModel, level - 1, oPoolFilter, oOrgModel, subProcessLevel, oGroup);
                }
            }
        }     
    }     
}

function combineModelViaSubProcesses(oProcess, oPoolFilter, subProcessLevel, oGroup, oOrgModel, oGenModels) {
    if(subProcessLevel < 1) {
        return oProcess;
    }    
    var oModel = combineModelViaSubProcess(oProcess, oPoolFilter, oGroup, oOrgModel);
    oGenModels.push(oModel);
    return combineModelViaSubProcesses(oModel, oPoolFilter, subProcessLevel -1, oGroup, oOrgModel, oGenModels);
}


function combineModelViaSubProcess(oProcess, oPoolFilter, oGroup, oOrgModel) {

    var oSubProcesses = findSubprocess(oProcess);
    if(oSubProcesses.length < 1) {
        return oProcess;
    }
    
    if(oOrgModel.contains(oProcess.GUID())) {
        return oProcess;
    }
    
    oOrgModel.add(oProcess.GUID());                                     
            
    var oNewProcess = oProcess.Group().CreateModel(oProcess.TypeNum(), "SubProcessX", gnLocale);
    // use new model for further operations            
    copyModelContent(oProcess, oNewProcess, oPoolFilter); 
    
    var oAssignedModelList = [];
        
    var oSubProcesses = findSubprocess(oNewProcess);
    for(var i = 0; i < oSubProcesses.length; i++) {
        var oSubProcess = oSubProcesses[i];        
        var oAssignedModels = oSubProcess.ObjDef().AssignedModels(getAcceptedModel(oProcess.TypeNum()));
        for(var j = 0; j < oAssignedModels.length; j++) {
            var oAssignedModel = oAssignedModels[j]; 
            if(oOrgModel.contains(oAssignedModel.GUID())) {
                continue;
            }                        
            if(hasModelOneStartEvent(oAssignedModel) && hasModelOneEndEvent(oAssignedModel)) {
                oAssignedModelList.push(oAssignedModel);
                addEndEvent(oNewProcess, oAssignedModel, oSubProcess);
                addStartEvent(oNewProcess, oAssignedModel, oSubProcess);
                oNewProcess.deleteOcc(oSubProcess, false); 
            }
        }   
    }
    ArisData.Save(Constants.SAVE_NOW); 
                
    var oMergeModel = createIntermediateModel(oProcess.Group(), oProcess.TypeNum(), "MergeX");
    copyModelContent(oNewProcess, oMergeModel, oPoolFilter);

    oGroup.Delete(oNewProcess);         
            
    for(var i = 0; i < oAssignedModelList.length; i++) {
        var oAssignedModel = oAssignedModelList[i];
        copyModelContent(oAssignedModel, oMergeModel, oPoolFilter);
        oOrgModel.add(oAssignedModel.GUID());  
    }
    ArisData.Save(Constants.SAVE_NOW); 
    replaceStartEventPairsWithIntermidiate(oMergeModel);            

    var oModel = modelGeneration(oMergeModel, oGroup);    
    oGroup.Delete(oMergeModel);
    ArisData.Save(Constants.SAVE_NOW);      
    return oModel;
}

function hasModelOneStartEvent(oModel) {
    var oStartEvents = findStartEvents(oModel);    
    return oStartEvents.length == 1;
}

function hasModelOneEndEvent(oModel) {
    var oEndEvents = findEndEvents(oModel);    
    return oEndEvents.length == 1;
}

function getAcceptedModel(typeNum) {
    var models = [];    
    var it;
    if(gNonEnterpriseBpmn.contains(typeNum)) {        
        it = gNonEnterpriseBpmn.iterator();
    }
    else {
        it = gEnterpriseBpmn.iterator();
    }
    while(it.hasNext()){
        models.push(it.next());
    }            
    return models;        
}

function createIntermediateModel(oGroup, nTypeNum, sName) {
    var oModel = oGroup.CreateModel(nTypeNum, sName, gnLocale);
    gIntermediateModels.push(oModel);
    return oModel;
}

function hasBpmnModelAssignedSubprocesses(oProcess, oMergeModel) {
    var oSubProcesses = findSubprocess(oProcess);     
    for(var i = 0; i < oSubProcesses.length; i++) {
        var oSubProcess = oSubProcesses[i];        
        var oAssignedModels = oSubProcess.ObjDef().AssignedModels(getAcceptedModel(oProcess.TypeNum()));    
        if(oAssignedModels.length > 0) {
            return true;
        }
    }
    return false;
}

function addEndEvent(oNewProcess, oAssignedModel, oSubProcess) {
    var oStartEvents = findStartEvents(oAssignedModel);
    var oIncommingCnxs = oSubProcess.Cxns(Constants.EDGES_IN);
    
    var oSrcObject = oIncommingCnxs[0].getSource(); // start event occ
    var oTrgObject = oNewProcess.createObjOcc(Constants.ST_BPMN_END_EVENT, oStartEvents[0].ObjDef(), 0, 0, true);
    
    var cxnType = getCxnType(oNewProcess, oSrcObject, oTrgObject);
    
    oNewProcess.CreateCxnOcc(true, oSrcObject, oTrgObject, cxnType, points);      
}

function addStartEvent(oNewProcess, oAssignedModel, oSubProcess) {
    var oEndEvents = findEndEvents(oAssignedModel);
    var oOutgoingCnxs = oSubProcess.Cxns(Constants.EDGES_OUT);
    
    var oTrgObject = oOutgoingCnxs[0].getTarget(); // start event occ
    var oSrcObject = oNewProcess.createObjOcc(Constants.ST_BPMN_START_EVENT, oEndEvents[0].ObjDef(), 0, 0, true);
    
    var cxnType = getCxnType(oNewProcess, oSrcObject, oTrgObject);
    
    oNewProcess.CreateCxnOcc(true, oSrcObject, oTrgObject, cxnType, points);      
}


function getCxnType(oNewProcess, oSrcObject, oTrgObject) {

    var src = oSrcObject.ObjDef().TypeNum();
    var trg = oTrgObject.ObjDef().TypeNum();
    
    if(src == Constants.OT_EVT) {
        if(trg == Constants.OT_EVT) {
            return Constants.CT_SUCCEED;        
        }
        if(trg == Constants.OT_FUNC) {
            return Constants.CT_ACTIV_1;        
        }
        if(trg == Constants.OT_RULE) {
            return Constants.CT_IS_EVAL_BY_1;        
        }
    }
    
    if(src == Constants.OT_FUNC) {
        if(trg == Constants.OT_EVT) {
            return Constants.CT_CRT_1;        
        }
        if(trg == Constants.OT_FUNC) {
            return Constants.CT_IS_PREDEC_OF_1;        
        }
        if(trg== Constants.OT_RULE) {
            return Constants.CT_LEADS_TO_1;        
        }
    }

    if(src == Constants.OT_RULE) {
        if(trg == Constants.OT_EVT) {
            return Constants.CT_LEADS_TO_2;        
        }
        if(trg == Constants.OT_FUNC) {
            return Constants.CT_LNK_2;        
        }
    }    
    
    var oFilter = ArisData.ActiveFilter();
    var cxnTypes = oFilter.CxnTypes(oNewProcess.TypeNum(), oSrcObject.SymbolNum(), oTrgObject.SymbolNum());
    if(cxnTypes.length > 0) {
        return cxnTypes[0];
    }
    return null;
}

function isStartEndCombination(event, occInModel) {
    return event.SymbolNum() == Constants.ST_BPMN_START_EVENT && occInModel.SymbolNum() == Constants.ST_BPMN_END_EVENT;
}
function isEndStartCombination(event, occInModel) {
    return event.SymbolNum() == Constants.ST_BPMN_END_EVENT && occInModel.SymbolNum() == Constants.ST_BPMN_START_EVENT;
}

function findSubprocess(oProcess) {
    return oProcess.ObjOccListBySymbol([Constants.ST_BPMN_SUB_PROCESS_COLLAPSED, Constants.ST_BPMN_SUBPROCESS]);
}

function findEndEvents(oProcess) {
    return oProcess.ObjOccListBySymbol([Constants.ST_BPMN_END_EVENT]);
}

function findStartEvents(oProcess) {
    return oProcess.ObjOccListBySymbol([Constants.ST_BPMN_START_EVENT]);
}

function isParentPool(oObjOcc, oPoolFilter) {
    var oPool = getParentPool(oObjOcc);
    if(oPool == null && oPoolFilter == null) {
        return true;
    }
    if(oPool == null) {
        return false;
    }
    return oPool.ObjDef().IsEqual(oPoolFilter);
}

function getParentPool(oObjOcc) {
    var oParent = getParentBpmnOcc(oObjOcc);
    if(oParent == null) {
        return null;
    }
    if(oParent.SymbolNum() == Constants.ST_BPMN_POOL_1) {
        return oParent;
    }
    return getParentPool(oParent);
}
    

function getParentBpmnOcc(oObjOcc) {
    var oBpmnComp = Context.getComponent("Designer");

    var oReadOnlyObjOcc = oReadOnlyDB.FindOID(oObjOcc.ObjectID());    
    obpmnSupport = oBpmnComp.getBPMNSupport(oReadOnlyObjOcc.Model());
    try {
        return  obpmnSupport.getBpmnParent(oReadOnlyObjOcc);
    }
    catch(ex) {
    }
    return null;
}

/*
* Contains epc a process interface
* oModel: epc
* return: has model valid process interfaces
*/
function hasModelNotAllowedProcessInterfaces(oModel) {
    var foundPifs = [];
    var pifs = oModel.ObjOccListBySymbol([Constants.ST_PRCS_IF]); 
    for(var i = 0; i < pifs.length; i++) {
        var pif = pifs[i];
        if(!(pif.Cxns(Constants.EDGES_IN).length > 0 && pif.Cxns(Constants.EDGES_OUT).length > 0)) {
            foundPifs.push(pif)
        }
    }
    return foundPifs.length > 0;
}

/*
* Contains epc a process interface
* oModel: epc
* return: has model process interfaces
*/
function hasModelProcessInterfaces(oModel) {
    var foundPifs = [];
    var pifs = oModel.ObjOccListBySymbol([Constants.ST_PRCS_IF]); 
    return pifs.length > 0;
}


/*
function deleteExistingEPC(settings, oGroup) {
    var oExistsModels = oGroup.ModelListFilter (settings.sProcessName, gnLocale, Constants.MT_EEPC);
    if(oExistsModels.length > 0) {
        if(!oGroup.Delete(oExistsModels[0])) {
            throw new Exception(commonUtils.attsall.formatString(getString("TEXT_PLEASE_CLOSE"), [settings.sProcessName]));           
        }
    }
}
*/
/*
* create or get existing process with name sProcessName in grozup oGroup
* sProcessName: name of the process
* oGroup: target group of the process
* isProcessOverwrite: overwrite process
* return: process
*/
function createOrGetProcess(sProcessName, oGroup, isProcessOverwrite) {
    if(isBpmnSelected()) {
        var typeNum = getTypNumOfSelectedModel();
        if(isProcessOverwrite) {
            var oExistsModels = oGroup.ModelListFilter (sProcessName, gnLocale, typeNum);
            if(oExistsModels.length == 0) {
                return oGroup.CreateModel(typeNum, sProcessName, gnLocale);
            }
            return oExistsModels[0];        
        }
        else {
            return oGroup.CreateModel(typeNum, sProcessName, gnLocale);
        }        
    }
    else {
        if(isProcessOverwrite) {
            var oExistsModels = oGroup.ModelListFilter (sProcessName, gnLocale, Constants.MT_EEPC);
            if(oExistsModels.length == 0) {
                return createEpc(sProcessName, oGroup);
            }
            return oExistsModels[0];        
        }
        else {
            return createEpc(sProcessName, oGroup);
        }
    }
}

/*
* create epc with sModelName into oGroup 
* sModelName: name of epc to create
* oGroup: target group for epc
* return: epc
*/
function createEpc(sModelName, oGroup) {
    return oGroup.CreateModel(Constants.MT_EEPC, sModelName, gnLocale);
}
/*
function copyModel(oEPC, oGroup) {
    var mergeCmp = Context.getComponent("Merge");
    var oResult = mergeCmp.createOccCopy ([oEPC],  oGroup); 
}
*/

/*
* Delete content of model
* oModel: model where the content is deleted
*/
function deleteModelContent(oModel) {
    // create objOcc
    var oObjOccs = oModel.ObjOccList();
    for(var i = 0; i < oObjOccs.length; i++) {
        var oObjOcc = oObjOccs[i];
        oModel.deleteOcc(oObjOcc, false);
    }
    ArisData.Save(Constants.SAVE_NOW);    
}

/*
* Copy content of epc oSrcEpc to target epc oTrgEpc. 
* oSrcEpc: source epc
* oTrgEpc: target epc
*/
function copyModelContent(oSrcEpc, oTrgEpc, oPoolFilter) {
    var oldNewMap = [];
    // create objOcc
    var oObjOccs = oSrcEpc.ObjOccList();
    if(isBpmnSelected()) {
        // enterpise BPMN and BMPN are total diffrent world. They can't combined.
        if(isEnterpriceBPMN(oSrcEpc) != isEnterpriceBPMN(oTrgEpc)) {
            return;
        }
        for(var i = 0; i < oObjOccs.length; i++) {
            var oObjOcc = oObjOccs[i];
    
            if(oObjOcc.getSymbol() == Constants.ST_BPMN_LANE_1) {
                continue;
            }
            if(oObjOcc.getSymbol() == Constants.ST_BPMN_POOL_1) {
                continue;
            }
            if(isParentPool(oObjOcc, oPoolFilter)) {
                var oNewObjOcc = oTrgEpc.createObjOcc(oObjOcc.getSymbol(), oObjOcc.ObjDef(), oObjOcc.X(), oObjOcc.Y(), true);  
                oldNewMap[oObjOcc] = oNewObjOcc;       
            }
        }
    }
    else {
        for(var i = 0; i < oObjOccs.length; i++) {
            var oObjOcc = oObjOccs[i];
            var oNewObjOcc = oTrgEpc.createObjOcc(oObjOcc.getSymbol(), oObjOcc.ObjDef(), oObjOcc.X(), oObjOcc.Y(), true);  
            oldNewMap[oObjOcc] = oNewObjOcc;            
        }
        
    }
    // create cxnOcc
    var oCxnOccs = oSrcEpc.CxnOccList();
    for(var i = 0; i < oCxnOccs.length; i++) {
        var oCxnOcc = oCxnOccs[i];
        var oSrc = oldNewMap[oCxnOcc.SourceObjOcc()];
        var oTrg = oldNewMap[oCxnOcc.TargetObjOcc()];
        if(oSrc != null && oTrg != null) {
            oTrgEpc.CreateCxnOcc(oSrc, oTrg, oCxnOcc.CxnDef(), oCxnOcc.PointList(), false);  
        }
    }    
    oTrgEpc.doLayout();
    oTrgEpc.ApplyTemplate();
    ArisData.Save(Constants.SAVE_NOW);
}

function isEnterpriceBPMN(oModel) {
    return  gEnterpriseBpmn.contains(oModel.TypeNum());
}

/*
* Merge EPC's via process interfaces to one flat EPC's
* sProcessName: name of the flat epc
* oGroup: target group ot flat epc
* oEPC: source epc
* return: one flat epc
*/
function mergeEpcsToFlatEpc(sProcessName, oGroup, oEPC, level) {
    var modelGeneration = Context.getComponent("ModelGeneration");
    var options = modelGeneration.createModelGenerationOptions();
    options.setExpandModelDepthForProcesInterfaces(level);
    options.hideProcessInterfaces(true);
    options.setUseOfModelDepthForProcessInterfaceAndStartEndEvent(1);
    return modelGeneration.generateModelByModels([oEPC], sProcessName, Constants.MT_EEPC, oGroup, options);
}

/*
* Removes all other type of occDefs as OT_FUNC, OT_from EPC and OT_RULE. 
* oEPC: EPC
*/
function removeNotAllowedObjectFromEPC(oEPC) {    
    var oObjOccs = oEPC.ObjOccList(); 
    for(var i = 0; i < oObjOccs.length; i++) {
        oObjOcc = oObjOccs[i];
        var typeNum = oObjOcc.ObjDef().TypeNum();
        if((typeNum != Constants.OT_FUNC && typeNum != Constants.OT_EVT && typeNum != Constants.OT_RULE)) {
            oEPC.deleteOcc(oObjOcc, false); 
        } 
    }    
    ArisData.Save(Constants.SAVE_NOW);  
}

/*
* Find or create "PPM" ObjDef. (Function marked with PPM in attribute AT_SRC) 
* oGroup: ARIS group where the EPC and the objDefs are created.
* sName: name of the function
*/
function findOrCreatePPMFuncObjDef(oGroup, sName, sKind) {
    var oFuncDef = existingPPMfunctions[sName];
    
    if(oFuncDef == null) {
        oFuncDef = oGroup.CreateObjDef(Constants.OT_FUNC, sName, gnLocale);        
        existingPPMfunctions[sName] = oFuncDef;
        markFunctionAsPPM(oFuncDef);
        statistic[sKind].new.push(sName);
    }
    else {
        statistic[sKind].old.push(sName);
    }
    return oFuncDef;
}

/*
* Find or create Gap ObjDef. (Function marked with PPM Conformance Check in attribute AT_SRC) 
* oGroup: ARIS group where the EPC and the objDefs are created.
*/
function findOrCreateGapDef(oGroup) {
    var oGapDef = oGroup.ObjDefListFilter(gsGapMarker, gnLocale, Constants.OT_GAP, Constants.AT_SRC);  
    
    if(oGapDef.length == 0) {
        oGapDef = oGroup.CreateObjDef(Constants.OT_GAP, gsGapMarker, gnLocale);  
        markFunctionAsGap(oGapDef);
    }
    else {
        oGapDef = oGapDef[0];
    }
    var attrs = {};
    attrs[Constants.AT_NAME] = getString("TEXT_GAP.TRM");
    oGapDef.WriteAttributes(attrs, gnLocale); 
    
    return oGapDef;
}

/*
* Build matrix model from ARIS model selection and PPM restcall 
* settings: all parameter needed to create matrix model
* oSelGroup: ARIS group where the matrix model and the objDefs are created.
* isMatrixOverwrite: overwrite matrix model
* return: created matrix model
*/
function buildMatrix(settings, oSelGroup, oEPC, isMatrixOverwrite) {       
    return createMatrixModelWithContent(oSelGroup, settings, "ARIS", "PPM", oEPC, isMatrixOverwrite);
}

/*
* Create matrix model, where standard functions symbol is visible. Adding objDef from oSelModel to the matrix model as column header cells.
* oGroup: group in which the model is stored
* settings: all values needed to create matrix model
* sColHeaderName: name of the colume header
* sRowHeaderName: name of the row header
* oEpcModel: EPC from where the matrix model is be filled.
* isMatrixOverwrite: overwrite matrix model
* return: matrix model
*/

function createMatrixModelWithContent(oGroup, settings, sColHeaderName, sRowHeaderName, oEpcModel, isMatrixOverwrite) {    
    
    var sJsonContent = restCall(settings, settings.sUrl);
    var sPPMFuncNames = getFunctionsFromPPM(sJsonContent, settings);
    
    getPPMfunctionInGroup(oGroup);
    getGapObjectInGroup(oGroup);
    
    var oMatrixModel;
    if(sPPMFuncNames.errorCode == 0) {
      oMatrixModel = createMatrixModelOrGet(oGroup, settings.sMatrixName, sColHeaderName, sRowHeaderName, isMatrixOverwrite);   
      checkModelIsWriteable(oMatrixModel);
      deleteMatrixModelContent(oMatrixModel);  
      createModelContent(oMatrixModel, oEpcModel, oGroup);            
      createModelContentPPM(oMatrixModel, sPPMFuncNames.ppm, oGroup);
      connectARISfunctionsWithPPMfunctions(oMatrixModel);
    }
    else {
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_PPM_REQUEST_ERROR"), [sPPMFuncNames.errorMessage]));        
    }
    return oMatrixModel;
}

/*
* Delete content of model
* oMatrixModel: model whre the content is deleted
*/
function deleteMatrixModelContent(oMatrixModel) {
    oldArisFunctions = deleteAllCellHeaders(oMatrixModel, false);
    oldPpmFunctions = deleteAllCellHeaders(oMatrixModel, true);
}

/*
* Delete all cell header sof matrix model
* oMatrixModel: model where the content is deleted
*/
function deleteAllCellHeaders(oMatrixModel, rowHeader) {
    var functions = new java.util.HashSet()
    var header = oMatrixModel.getHeader(rowHeader);
  
    var cells = header.getCells(); 
     for(var i = 0; i < cells.length; i++) { 
         var cell = cells[i]; 
         oMatrixModel.deleteHeaderCell(cell); 
         if(cell.getDefinition().TypeNum() == Constants.OT_FUNC) {
             functions.add(cell.getDefinition());
         }
     }     
     return functions;
}

/*
* Create ARIS objDefs form Names of PPM functions and adding this to the column header of matrix model.
* oMatrixModel: matrix model to add PPM functions to columns header
* sPPMFuncNames: names of PPM functions as array of strings
* oGroup: ARIS group to add the created objDefs
*/
function createModelContentPPM(oMatrixModel, sPPMFuncNames, oGroup) {
    
    var oGapDef = findOrCreateGapDef(oGroup);      
    oMatrixModel.createHeaderCell(null, oGapDef, g_allowedGapSymbol, -1, true);    
    
    var neededFuncs = {};
    for(var i = 0; i < sPPMFuncNames.length; i++) {
        var sName = sPPMFuncNames[i];
        neededFuncs[sName] = sName;        
        var oFuncDef = findOrCreatePPMFuncObjDef(oGroup, sName, "mapping");
        
        addUsedPPMRowHeader(sName, oMatrixModel.createHeaderCell(null, oFuncDef, g_allowedFunctionSymbol, -1, true));
    }    
    var existis = Object.keys(existingPPMfunctions);
    for(var i = 0; i < existis.length; i++) {
        var exist = existis[i];
        if(neededFuncs[exist] == null) {
           statistic.mapping.unused.push(exist); 
        }
    }
}

/*
* Automatically connect PPM functions and ARIS function. The criteria is name of the function.
* oMatrixModel: matrix model where the functions were added.
*/
function connectARISfunctionsWithPPMfunctions(oMatrixModel) {
    for(var i = 0; i < usedARISColHeaders.length; i++) {
        var oARISColHeader = usedARISColHeaders[i];
        
        var oPPMRowHeaders = getUsedPPMRowHeader(oARISColHeader.getDefinition().Name(gnLocale).toLowerCase());
        
        if(oPPMRowHeaders != null) {  
            for(var y = 0; y < oPPMRowHeaders.length; y++) {
                var oPPMRowHeader = oPPMRowHeaders[y];
                var oConObjDefs = oPPMRowHeader.getDefinition().getConnectedObjs([Constants.OT_FUNC], Constants.EDGES_INOUT, [g_allowedCxn]);
                var isFound = false;
                for (var x = 0; x < oConObjDefs.length; x++) {
                    if (oConObjDefs[x].GUID() == oARISColHeader.getDefinition().GUID()) {
                        isFound = true;     
                    }
                }
                if(!isFound) {
                    if(!oldArisFunctions.contains(oARISColHeader.getDefinition()) || !oldPpmFunctions.contains(oPPMRowHeader.getDefinition())) {
                        oMatrixModel.createCxn(oPPMRowHeader, oARISColHeader, g_allowedCxn);    
                    }
                }
            }
        }
    }
}

/*
* Adding content to matrix model.
* oMatrixModel: matrix model to add content.
* oEpcModel: epc to fill functions intro matrix model.
* visitedModels: checking if ARIS epc is processed.
*/
function createModelContent(oMatrixModel, oEpcModel, oGroup /*, visitedModels*/) {  
    var oGapDef = findOrCreateGapDef(oGroup);      
    oMatrixModel.createHeaderCell(null, oGapDef, g_allowedGapSymbol, -1, false);
    
    // select all functions as objDef    
    var oFuncDefs = oEpcModel.ObjDefListFilter(Constants.OT_FUNC);
    for (var i=0; i < oFuncDefs.length; i++) {
        var oFuncDef = oFuncDefs[i]
        if(oFuncDef.SymbolNum != Constants.ST_PRCS_IF) {
            var oArisCell = oMatrixModel.createHeaderCell(null, oFuncDef, g_allowedFunctionSymbol, -1, false);
            usedARISColHeaders.push(oArisCell);
        }            
    }
}

/*
* Create matrix model, where standard functions symbol is visible.
* oGroup: ARIS where matrix model is created.
* sModelName: name of the matrix model
* sColHeaderName: name of the column header
* sRowHeaderName: name of the row header
* return MatrixModel
*/
function craeteMatrixModel(oGroup, sModelName, gnLocale, sColHeaderName, sRowHeaderName) {
    var oMatrixModel = oGroup.CreateModel(Constants.MT_MATRIX_MOD, sModelName, gnLocale);
    
    var oMatrix = setDefaultSettingsOfMatrixModel(oMatrixModel, gnLocale, sColHeaderName, sRowHeaderName);
    return oMatrixModel.getMatrixModel();    
}

function setDefaultSettingsOfMatrixModel(oMatrixModel, gnLocale, sColHeaderName, sRowHeaderName) {
    var oMatrix = oMatrixModel.getMatrixModel();     
    // reuse at delete content of matrix model
    oMatrix.getHeader(true).setTitle(sRowHeaderName, gnLocale);
    oMatrix.getHeader(false).setTitle(sColHeaderName, gnLocale);
    oMatrix.setVisibleObjectSymbolTypes([g_allowedFunctionSymbol, g_allowedGapSymbol], false);
    oMatrix.setVisibleObjectSymbolTypes([g_allowedFunctionSymbol, g_allowedGapSymbol], true);
    var oMatrixFctCxnFctData = oMatrix.createNewMatrixConnectionDataObject(g_allowedFunctionSymbol, g_allowedFunctionSymbol, g_allowedCxn, true, true, true);            
    var oMatrixFctCxnGapData = oMatrix.createNewMatrixConnectionDataObject(g_allowedFunctionSymbol, g_allowedGapSymbol, g_allowedGapCxn, null, true, true);            
    var oMatrixGapCxnFctData = oMatrix.createNewMatrixConnectionDataObject(g_allowedGapSymbol, g_allowedFunctionSymbol, g_allowedGapCxn, null, true, true);            
    oMatrix.setCxnData([oMatrixFctCxnFctData, oMatrixFctCxnGapData, oMatrixGapCxnFctData]);   
}

/*
* create or get existing matrix with name sModelName in grozup oGroup
* sModelName: name of the matrix model
* oGroup: target group of the matrix model
* sColHeaderName: name of the column header 
* sRowHeaderName: name of the row header
* isMatrixOverwrite: overwrite matrix model
* return: matrix model
*/
function createMatrixModelOrGet(oGroup, sModelName, sColHeaderName, sRowHeaderName, isMatrixOverwrite) {
    if(isMatrixOverwrite) {
        var oExistsModels = oGroup.ModelListFilter (sModelName, gnLocale, Constants.MT_MATRIX_MOD);
        if(oExistsModels.length == 0) {
            return craeteMatrixModel(oGroup, sModelName, gnLocale, sColHeaderName, sRowHeaderName);
        }
        setDefaultSettingsOfMatrixModel(oExistsModels[0].getMatrixModel(), gnLocale, sColHeaderName, sRowHeaderName);
        return oExistsModels[0].getMatrixModel();        
    }
    else {
        return craeteMatrixModel(oGroup, sModelName, gnLocale, sColHeaderName, sRowHeaderName);
    }
}

/*
* Returns a structure with following fields.
* sFunctionsNames: String array of PPM functins names
* nErrorCode: error code 
* sErrorMessage: error message
* Returns a structure with following fields.
*/
function createPPMData(sFunctionsNames, nErrorCode, sErrorMessage) {
    return {"ppm": sFunctionsNames, "errorCode" : nErrorCode, "errorMessage" : sErrorMessage};  
}

/*
* Get function names from PPM xml format
* sXmlContent: PPM json format
* settings: from settings only used identifier for CTK FUNCTION.
* return: function names as array of strings
*/
function getFunctionsFromPPM(sJsonContent, settings) {    
    // adapt to PPM process type
    var json = parseJson(sJsonContent);
    if(isJsonIsEmpty(json)) {
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_PPM_FUNCTIONS"), [settings.sPPMkeys]));        
    }
    var sFunctionsNames = json["functions"];
    
    return new createPPMData(sFunctionsNames, 0, "");           
}

/*
* Check if json is empty
*/
function isJsonIsEmpty(json) {
    return Object.keys(json).length === 0 && json.constructor === Object;
}

/*
* Parses JSON as string
* sXmlContent: JSON as string
* return: Map 
*/
function parseJson(sJsonContent) {
    return JSON.parse(sJsonContent);
}

/*
* Return the result of the rest call as string
* settings: parameter for the restcall
* return: result as string
*/
function restCall(settings, sUrl){
    var sResult = "";

    var oUrl;
    var protocol = sUrl.split(":");
    if(!sUrl.startsWith("http:") && !sUrl.startsWith("https:")) {
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_PROTOCOL.DBI"), [protocol[0]]));
    }        
    if(protocol.length < 3) {
        // port
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_PORT_URL.DBI"), [sUrl]));
    } 
/*    
    else {
        if(protocol[0].toLowerCase() != "http" && protocol[0].toLowerCase() != "https") {
            throw new Exception(commonUtils.attsall.formatString(getString("TEXT_PROTOCOL.DBI"), [protocol[0]]));
        }
    }
*/    
    try {
        oUrl = new java.net.URL(sUrl);
    }
    catch(ex) {        
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_MALFORMED_URL.DBI"), [sUrl]));
        
//        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_UNKNOWN_HOST.DBI"), [sUrl]));
    }
        
    var oConn = oUrl.openConnection();
    oConn.setRequestMethod("GET");
    oConn.setRequestProperty("Accept", "application/json");
    var sUerCredentials = settings.sUserName + ":"+ settings.sPassword;
    var sAuthorization = "Basic " + javax.xml.bind.DatatypeConverter.printBase64Binary(new java.lang.String(sUerCredentials).getBytes("UTF-8"));
    oConn.setRequestProperty("Authorization", sAuthorization);
    
    errorHandlingRestCall(oConn, settings);
    
    // now read the data   
    var inputStream = oConn.getResponseCode() == java.net.HttpURLConnection.HTTP_OK ? oConn.getInputStream() : oConn.getErrorStream();
    if(inputStream == null) {
        var iErrorCode = oConn.getResponseCode();
        if(iErrorCode == java.net.HttpURLConnection.HTTP_NOT_FOUND) {
            throw new Exception(commonUtils.attsall.formatString(getString("TEXT_REST_SERVICE_NOT_FOUND"), [sUrl]), oConn.getResponseCode());             
        }
        else {
            throw new Exception(commonUtils.attsall.formatString(getString("TEXT_COULD_NOT_CONNECT"), [sUrl]), oConn.getResponseCode());            
        }
    }
        
    var oReader = new java.io.BufferedReader(new java.io.InputStreamReader(inputStream, "UTF-8"));

    var sOutput;
    while((sOutput = oReader.readLine()) != null) {
        sResult += sOutput;
    }
    // disconnect again
    oConn.disconnect();
    
    return sResult;
}

/*
* Handling error that occurs via rest call.
* oConn: Rest call connection.
* settings: of the rest cal.
*/
function errorHandlingRestCall(oConn, settings) {
    var iCode;
    try {
        iCode = oConn.getResponseCode();
    }
    catch(ex) {
//       Dialogs.MsgBox(ex.toString());
       throw new Exception(commonUtils.attsall.formatString(getString("TEXT_COULD_NOT_CONNECT"), [ settings.sUrl, ex.toString]));        
    }
          
    // username or password wrong
    if (iCode == java.net.HttpURLConnection.HTTP_UNAUTHORIZED) {
        throw new Exception(getString("TEXT_LOGINFAILED"), iCode);					
    }
    if (iCode == java.net.HttpURLConnection.HTTP_BAD_REQUEST) {
        // Request parameter nout found
        throw new Exception(getString("TEXT_PARAMTER_NOT_FOUND"), iCode);
    }
    if (iCode == java.net.HttpURLConnection.HTTP_FORBIDDEN) {
        // No access previliges to favourite
       throw new Exception(getString("TEXT_NO_ACCESS_PRIVILAGES"), iCode);					
    }
    if (iCode == java.net.HttpURLConnection.HTTP_NOT_FOUND) {
        // Rest service not found. Please check URL part betweeb port and parameter.
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_WRONG_CLIENT"), [settings.sClient]), iCode);					
    }    
    if (iCode == java.net.HttpURLConnection.HTTP_UNAVAILABLE) {
        // Rest service not found. Please check URL part between port and parameter.
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_WRONG_CLIENT"), [settings.sClient]), iCode);					
    }   
    // something unexpected happened
    if (iCode != java.net.HttpURLConnection.HTTP_OK) {
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_COULD_NOT_CONNECT"), [settings.sUrl]), iCode);					
    }      
}

/*
* Automatically calculate nect row position in settings dialog.
*/
function nextLine(sKind) {
    gDialogLineY += sKind;
    return gDialogLineY;
}

/*
* Open settings dialog for PPM request data and ARIS
* Return all seetings for processing.
*/

function optionsDialog() {
	var result = {
        "sUserName": null, 
        "sPassword": null, 
        "sUrl": null, 
        "sMatrixName": null, 
        "sClient" : null,  
        "sProcessName": null, 
        "level" : null,
        "subProcessLevel" : null,
        "bOk": false
    };
    
	var USER_TEXTBOX = "USER_TEXTBOX";
	var PASSWORD_TEXTBOX = "PASSWORD_TEXTBOX";

    var DETAILS_BUTTON = "DETAILS_BUTTON";
        
	var MATRIX_URL_TEXTBOX = "MATRIX_URL_TEXTBOX";
  	var MATRIX_NAME_TEXTBOX = "MATRIX_NAME_TEXTBOX";
	var DIMENSION_KEY_TEXTBOX = "DIMENSION_KEY_TEXTBOX";

  	var EPC_NAME_TEXTBOX = "EPC_NAME_TEXTBOX";
    
    var LEVEL_TEXTBOX = "LEVEL_TEXTBOX";
    var EVENT_LEVEL_TEXTBOX = "EVENT_LEVEL_TEXTBOX";       
    var SUBPROCESS_LEVEL_TEXTBOX = "SUBPROCESS_LEVEL_TEXTBOX";
    	    
	this.getPages = function () {
        
		var credentialDialogTemplate = Dialogs.createNewDialogTemplate(220, 60, getString("TEXT_PPM_CREDENTIALS"));	 
        gDialogLineY = 0;

		credentialDialogTemplate.Text(5, nextLine(gSTART), 500, 14, getString("TEXT_USERNAME"));				
		credentialDialogTemplate.TextBox(5, nextLine(gINPUT), 500, 20, USER_TEXTBOX);	  
		credentialDialogTemplate.Text(5, nextLine(gTEXT), 500, 14, getString("TEXT_PASSWORD"));
		credentialDialogTemplate.TextBox(5, nextLine(gINPUT), 500, 20,PASSWORD_TEXTBOX,-1);	
        if(Context.getEnvironment() == Constants.ENVIRONMENT_STD) {
            
            credentialDialogTemplate.HelpButton("HID_84ff5170-6309-11e7-3088-64006a3208fa_1.hlp");		
        }

		var matrixDialogTemplate = Dialogs.createNewDialogTemplate(220, 60, getString("TEXT_PPM_SETTINGS"));	 
        gDialogLineY = 0;
        
		matrixDialogTemplate.Text(5, nextLine(gSTART), 500, 14, getString("TEXT_SERVERURL"));	
		matrixDialogTemplate.TextBox(5, nextLine(gINPUT), 500, 20, MATRIX_URL_TEXTBOX);           
       	matrixDialogTemplate.Text(5, nextLine(gTEXT), 500, 14, getString("TEXT_CLIENT"));
    	matrixDialogTemplate.TextBox(5, nextLine(gINPUT), 500, 20, DIMENSION_KEY_TEXTBOX);			
        if(Context.getEnvironment() == Constants.ENVIRONMENT_STD) {        
            matrixDialogTemplate.HelpButton("HID_84ff5170-6309-11e7-3088-64006a3208fa_2.hlp");		
        }
        
    	var epcDialogTemplate = Dialogs.createNewDialogTemplate(220, 60, getString("TEXT_ARIS_SETTINGS"));	 
        gDialogLineY = 0;

       	epcDialogTemplate.Text(5, nextLine(gTEXT), 500, 14, getString("TEXT_EPC_MODELNAME"));
    	epcDialogTemplate.TextBox(5, nextLine(gINPUT), 500, 20, EPC_NAME_TEXTBOX);			
       	epcDialogTemplate.Text(5, nextLine(gTEXT), 500, 14, getString("TEXT_MODEL_NAME"));
    	epcDialogTemplate.TextBox(5, nextLine(gINPUT), 500, 20, MATRIX_NAME_TEXTBOX);	
		
        if(isBpmnSelected()) {
            epcDialogTemplate.Text(5, nextLine(gTEXT), 500, 14, getString("TEXT_EVENT_LEVEL_NAME.DBI"));
            epcDialogTemplate.TextBox(5, nextLine(gINPUT), 30, 20, EVENT_LEVEL_TEXTBOX);			
            epcDialogTemplate.Text(5, nextLine(gTEXT), 500, 14, getString("TEXT_SUBPROCESS_LEVEL_NAME.DBI"));
            epcDialogTemplate.TextBox(5, nextLine(gINPUT), 30, 20, SUBPROCESS_LEVEL_TEXTBOX);			
            if(Context.getEnvironment() == Constants.ENVIRONMENT_STD) { 
                epcDialogTemplate.HelpButton("HID_84ff5170-6309-11e7-3088-64006a3208fa_4.hlp");		
            }
        }
        else {
            epcDialogTemplate.Text(5, nextLine(gTEXT), 500, 14, getString("TEXT_LEVEL_NAME"));
            epcDialogTemplate.TextBox(5, nextLine(gINPUT), 30, 20, LEVEL_TEXTBOX);			
            if(Context.getEnvironment() == Constants.ENVIRONMENT_STD) { 
                epcDialogTemplate.HelpButton("HID_84ff5170-6309-11e7-3088-64006a3208fa_3.hlp");		            
            }
        }
		return [credentialDialogTemplate, matrixDialogTemplate, epcDialogTemplate];
	}
	
	this.init = function(dialog){		
		dialog[0].getDialogElement(USER_TEXTBOX).setText(gsUserName);
   		dialog[0].getDialogElement(PASSWORD_TEXTBOX).setText("");        

		dialog[0].setFocusedElement(PASSWORD_TEXTBOX);
        
		dialog[1].getDialogElement(MATRIX_URL_TEXTBOX).setText(gsMatrixModelUrl);
   		dialog[1].getDialogElement(DIMENSION_KEY_TEXTBOX).setText(gsDimensionKey);        

   		dialog[2].getDialogElement(EPC_NAME_TEXTBOX).setText(gsProcessName);                        
   		dialog[2].getDialogElement(MATRIX_NAME_TEXTBOX).setText(gsMatrixModelName);  
        if(isBpmnSelected()) {        
            dialog[2].getDialogElement(EVENT_LEVEL_TEXTBOX).setText(gnEventLevel);             
            dialog[2].getDialogElement(SUBPROCESS_LEVEL_TEXTBOX).setText(gnSubProcessLevel);             
        }
        else {
            dialog[2].getDialogElement(LEVEL_TEXTBOX).setText(gnLevel);             
        }        
	}	
        
	this.onClose = function (pageNumber, bOk) {
		result.bOk = bOk;
	}

	this.getResult = function () {
        result.sUserName = this.dialog.getPage(0).getDialogElement(USER_TEXTBOX).getText();
		result.sPassword = this.dialog.getPage(0).getDialogElement(PASSWORD_TEXTBOX).getText();
        
		result.sUrl =  this.dialog.getPage(1).getDialogElement(MATRIX_URL_TEXTBOX).getText();
   		result.sClient =  this.dialog.getPage(1).getDialogElement(DIMENSION_KEY_TEXTBOX).getText();
        
   		result.sProcessName = this.dialog.getPage(2).getDialogElement(EPC_NAME_TEXTBOX).getText();
   		result.sMatrixName =  this.dialog.getPage(2).getDialogElement(MATRIX_NAME_TEXTBOX).getText();  
        if(isBpmnSelected()) { 
            result.nLevel =  parseInt(this.dialog.getPage(2).getDialogElement(EVENT_LEVEL_TEXTBOX).getText());    
            result.nSubProcessLevel =  parseInt(this.dialog.getPage(2).getDialogElement(SUBPROCESS_LEVEL_TEXTBOX).getText());    
        }
        else {
            result.nLevel =  parseInt(this.dialog.getPage(2).getDialogElement(LEVEL_TEXTBOX).getText());    
        }
        return result;  
	}    
    
     // returns true if the page is in a valid state. In this case "Ok", "Finish", or "Next" is enabled.
     // called each time a dialog value is changed by the user (button pressed, list selection, text field value, table entry, radio button,...)
     // pageNumber: the current page number, 0-based
     this.isInValidState = function(pageNumber){
        if(pageNumber == 0) { 
            return isCredentialPageValid(this.dialog.getPage(pageNumber));
        }
        if(pageNumber == 1) {
            return isMappingPageValid(this.dialog.getPage(pageNumber));
        }
        if(pageNumber == 2) {
            return isEPCPageValid(this.dialog.getPage(pageNumber));
        }
     }    
        
     // returns true if the "Finish" or "Ok" button should be visible on this page.
     // pageNumber: the current page number, 0-based
     // optional. if not present: always true
     this.canFinish = function(pageNumber)
     {
        return isCredentialPageValid(this.dialog.getPage(0)) && isMappingPageValid(this.dialog.getPage(1)) && isEPCPageValid(this.dialog.getPage(2));
     }
    
     // returns true if the user can switch to another page.
     // pageNumber: the current page number, 0-based
     // optional. if not present: always true
     this.canChangePage = function(pageNumber)
     {
        return true;
     }
    
     // returns true if the user can switch to next page.
     // called when the "Next" button is pressed and thus not suitable for activation/deactivation of this button
     // can prevent the display of the next page
     // pageNumber: the current page number, 0-based
     // optional. if not present: always true
     this.canGotoNextPage = function(pageNumber)
     {
        return true;
     }
    
     // returns true if the user can switch to previous page.
     // called when the "Back" button is pressed and thus not suitable for activation/deactivation of this button
     // can prevent the display of the previous page
     // pageNumber: the current page number, 0-based
     // optional. if not present: always true
     this.canGotoPreviousPage = function(pageNumber)
     {
        return true;
     }    
     
     function isCredentialPageValid(page) {
        return isValidPage(page, [USER_TEXTBOX, PASSWORD_TEXTBOX]); 
     }
     
     function isMappingPageValid(page) {
        return isValidPage(page, [MATRIX_URL_TEXTBOX, DIMENSION_KEY_TEXTBOX]); 
     }
     
     function isEPCPageValid(page) {
        if(isBpmnSelected()) {
            if(!isValidPage(page, [EPC_NAME_TEXTBOX, MATRIX_NAME_TEXTBOX, EVENT_LEVEL_TEXTBOX, SUBPROCESS_LEVEL_TEXTBOX])) {
                return false;
            }
        }
        else {
            if(!isValidPage(page, [EPC_NAME_TEXTBOX, MATRIX_NAME_TEXTBOX, LEVEL_TEXTBOX])) {
                return false;                
            }
        }
        
        if(isBpmnSelected()) {
            var eventLevelString = page.getDialogElement(EVENT_LEVEL_TEXTBOX).getText();
            
            if(!isValidLevel(eventLevelString)) {
                return false;
            }     
            var subProcessLevelString = page.getDialogElement(SUBPROCESS_LEVEL_TEXTBOX).getText();
            
            if(!isValidLevel(subProcessLevelString)) {
                return false;
            }     
        }
        else {
            var levelString = page.getDialogElement(LEVEL_TEXTBOX).getText();
            
            if(!isValidLevel(levelString)) {
                return false;
            }     
        }        
        return true;
     }
     
     function isValidLevel(levelString) {
        var levelStr = levelString + "";
        if(isNaN(levelStr)) {
            return false;
        }        
        if(levelStr.length != 1) {
            return false;
        }         
        var level = parseInt(levelStr);               
        if(level < 0 || level > 5) {
            return false;
        }         
        return true; 
     }
          
     function isValidPage(page, fields) {
        for(var i = 0; i < fields.length; i++) {
            var sFieldId = fields[i];
            if(page.getDialogElement(sFieldId).getText().isEmpty()) {
                return false;
            }            
        }
        return true;         
     }        
}

/*
* Check if group does not contain functions which are marked as PPM
* oGroup: Group to check if empty
*/
function hasGroupPPMFunctions(oGroup) {                
    var ppmFunctionInGroup = getPPMfunctionInGroup(oGroup);    
    return ppmFunctionInGroup.length > 0;
}

/*
* Get all PPM functions from group and cache the functions.
* oGroup: Group
* Return: PPM functions
*/
function getPPMfunctionInGroup(oGroup) {
    var ppmFunctionInGroup = oGroup.ObjDefListFilter(gsPPMMarker, gnLocale, Constants.OT_FUNC, Constants.AT_SRC);    
    for(var i =  0; i < ppmFunctionInGroup.length; i++) {
        var oFunc = ppmFunctionInGroup[i];
        var sName = oFunc.Attribute(Constants.AT_NAME, gnLocale, true).getValue();
        existingPPMfunctions[sName] = oFunc;
    }
    return ppmFunctionInGroup;
}

function getGapObjectInGroup(oGroup) {
    var gapInGroup = oGroup.ObjDefListFilter(gsPPMMarker, gnLocale, Constants.OT_GAP, Constants.AT_SRC);    
    for(var i =  0; i < gapInGroup.length; i++) {
        var oFunc = gapInGroup[i];
        var sName = oFunc.Attribute(Constants.AT_NAME, gnLocale, true).getValue();
        existingPPMfunctions[sName] = oFunc;
    }
    return gapInGroup;
}

/*
* Mark a function as PPM
* oFuncDef: function
*/
function markFunctionAsPPM(oFuncDef){
    var attrs = {};
    attrs[Constants.AT_SRC] = gsPPMMarker;
    oFuncDef.WriteAttributes(attrs, gnLocale);
}


/*
* Mark a function as GAP
* oFuncDef: function
*/
function markFunctionAsGap(oGapDef) {
    var attrs = {};
    attrs[Constants.AT_SRC] = gsGapMarker;
    oGapDef.WriteAttributes(attrs, gnLocale);    
}

/*
* Write statistic as PDF
*/
function outputStatistic() {
    setReportHeaderFooter(goOutfile, gnLocale, false, false, false);
            
    goOutfile.OutputLn(getString("TEXT_MAPPING"), "Arial", 16, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    goOutfile.OutputLn("", "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    writePPMFunctoinTable(getString("TEXT_NEW_CREATED_FUNCTIONS"), "new", "mapping");
    writePPMFunctoinTable(getString("TEXT_REUSE_EXISTING_FUNCTIONS"), "old", "mapping");
    writePPMFunctoinTable(getString("TEXT_UNUSED_FUNCTIONS"), "unused", "mapping");
}

/*
* Write table of PPM Function statictic
* sTitle: title of the table is written in the table header
* sStatistic: collected statistic about all PPM functions
*/
function writePPMFunctoinTable(sTitle, sStatistic, sKind) {
    
    goOutfile.DefineF("ENTRY", "Arial", 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 0, 0, 0, 0);
    
    goOutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);

    var colHeadings = new Array(sTitle);
    writeTableHeaderWithColor(goOutfile, colHeadings, 12, getTableCellColor_Bk(true), Constants.C_WHITE);
    
    var sDatas = statistic[sKind][sStatistic];
    if(sKind == "flow") {
        // make names in flow unique
        var sUniqueMap = {};
        for(var i = 0; i < sDatas.length; i++) {
            var sData = sDatas[i];
            sUniqueMap[sData] = sData;
        }
        sDatas =  Object.keys(sUniqueMap);
    }
    for(var i = 0; i < sDatas.length; i++) {
        var sData = sDatas[i];
        goOutfile.TableRow();         
        goOutfile.TableCellF(sData, 100, "ENTRY");                   
    }
    if(sDatas.length == 0) {
        goOutfile.TableRow();         
        goOutfile.TableCellF("", 100, "ENTRY");                   
    }
    
    goOutfile.EndTable("", 100, "Arial", 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);    
    goOutfile.WriteReport();    
}

/*
* General excpetion "class"
* sMessage: exception message
* iCode: code of exception
*/
function Exception(sMessage, iCode) {
  this.sMessage = sMessage;
  this.iCode = iCode;    
}

/*
* get PPM row headers objDefs case insensitiv 
* sName: name of objdef
*/
function getUsedPPMRowHeader(sName) {
    return usedPPMRowHeader[sName.toLowerCase()];    
}

/*
* add PPM row headers objDefs case insensitiv 
* sName: name of objdef
* oObjDef: of the row header in matrix model
*/
function addUsedPPMRowHeader(sName, oObjDef) {
    var oObjDefs = usedPPMRowHeader[sName.toLowerCase()];
    if(oObjDefs == null) {
        oObjDefs = [];
        oObjDefs.push(oObjDef);    
        usedPPMRowHeader[sName.toLowerCase()] = oObjDefs;
    } 
    else {
        oObjDefs.push(oObjDef);    
    }
}

/*
* Create process type tree control.
* sProcessTypeTreeContent: process type type tree data 
* return: map
*/
function ProcessTypeDialog(sProcessTypeTreeContent) {
        
    var ppmProcessTypeTree = JSON.parse(sProcessTypeTreeContent);

    var cxn = [];
    var isOk = false;    
    this.getPages = function() {   
        var userDlg = Dialogs.createNewDialogTemplate(0, 0, 300, 300);
        userDlg.Tree(10, 10, 450, 300, "FIELD_TREE", 1);
        
        return [userDlg];
    }
    //initialize dialog pages (are already created and pre-initialized with static data from XML or template)
    //parameter: Array of DialogPage
    //see Help: DialogPage
    //user can set control values
    //optional
    this.init = function(aPages) {
        var tree = aPages[0].getDialogElement("FIELD_TREE");
        buildTree(tree);
    }
    
    function buildTree(tree) {
        var counter = 0;

        var parent = null;        

        cxn.push({"parent" : parent, "child" : ppmProcessTypeTree["key"], "name" : ppmProcessTypeTree["name"], "href" : ppmProcessTypeTree["href"]})
        
        processTreeNode(ppmProcessTypeTree);
        var parents = {};
        parents[cxn[0]["parent"]] = parent;
        for(var i = 0; i < cxn.length; i++) {
            var parent = parents[cxn[i]["parent"]];
            var child = cxn[i]["child"];
            
            var item = tree.addChild(parent, cxn[i]["name"], counter++);    
            parents[child] = item;
        }
    }
            
    function processTreeNode(json) {
        var key = json["key"];   
        var name = json["name"];   
        
        var groups = json["children"];   
        if(groups != null) {        
            for(var i = 0; i < groups.length; i++) { 
                cxn.push({"parent" : key, "child" : groups[i]["key"], "name" : groups[i]["name"], "href" : groups[i]["href"]});               
                processTreeNode(groups[i]);                
            }   
        }     
    }    

    // returns true if the page is in a valid state. In this case OK, Finish, or Next is enabled.
    // called each time a dialog value is changed by the user (button pressed, list selection, text field value, table entry, radio button,...)
    // pageNumber: the current page number, 0-based
    this.isInValidState = function(pageNumber) {        
        var selection = this.dialog.getPage(0).getDialogElement("FIELD_TREE").getSelection();
        return selection != null && selection.length == 1;
    }
    // returns true if the "Finish" or "Ok" button should be visible on this page.
    // pageNumber: the current page number, 0-based
    // optional. if not present: always true
    this.canFinish = function(pageNumber) {        
        return true;
    }
    // returns true if the user can switch to another page.
    // pageNumber: the current page number, 0-based
    // optional. if not present: always true
    this.canChangePage = function(pageNumber) {
        return true;
    }
    this.canGotoPage = function(pageNumber) {
        return true;
    }
    //called after ok/finish has been pressed and the current state data has been applied
    //can be used to update your data
    // pageNumber: the current page number
    // bOK: true=Ok/finish, false=cancel pressed
    //optional
    this.onClose = function(pageNumber, bOk) {
       isOk = bOk;
    }
    //other methods (all optional): on[ControlID]_pressed, _focusChanged(boolean lost=false, gained=true), _changed for edit and toggle buttons, _selChanged(int[] newSelection)
    //for editable tables: [ControlID]_cellEdited(row, column) row and column are 0-based
    this.FIELD_TREE_selChanged = function(newSelection) {
    }
        
    //the result of this function is returned as result of Dialogs.showDialog(). Can be any object.
    //optional    
    this.getResult = function() {
        if(!isOk) {
            return null;
        }
        else {
            var tree = this.dialog.getPage(0).getDialogElement("FIELD_TREE");
            var index = tree.getSelection()[0];
            return cxn[index];      
        }
    }
}


/*
* Create pool selection dialog.
* pools: list of pools 
* return: pool
*/
function PoolSelectionDialog(pools) {
        
    var isOk = false;    
    this.getPages = function() {   
        var userDlg = Dialogs.createNewDialogTemplate(0, 0, 300, 300);
        var poolList = [];
        
        for(var i = 0; i < pools.length; i++) {
            var pool = pools[i];
            poolList.push(pool.name);
        }     

        gDialogLineY = 0;

		userDlg.Text(5, nextLine(gSMALL), 450, 14, getString("TEXT_SELECT_POOL.DBI"));	                
        userDlg.ListBox(5, nextLine(gTEXT), 450, 300, poolList, "POOL_LIST", 0);
        return [userDlg];
    }

    this.init = function(aPages) {
        this.dialog.getPage(0).getDialogElement("POOL_LIST").setSelection(0);
    }

    // returns true if the page is in a valid state. In this case OK, Finish, or Next is enabled.
    // called each time a dialog value is changed by the user (button pressed, list selection, text field value, table entry, radio button,...)
    // pageNumber: the current page number, 0-based
    this.isInValidState = function(pageNumber) {        
        var selection = this.dialog.getPage(0).getDialogElement("POOL_LIST").getSelection();
        return selection != null && selection.length == 1;
    }
    // returns true if the "Finish" or "Ok" button should be visible on this page.
    // pageNumber: the current page number, 0-based
    // optional. if not present: always true
    this.canFinish = function(pageNumber) {        
        return true;
    }
    // returns true if the user can switch to another page.
    // pageNumber: the current page number, 0-based
    // optional. if not present: always true
    this.canChangePage = function(pageNumber) {
        return true;
    }
    this.canGotoPage = function(pageNumber) {
        return true;
    }
    //called after ok/finish has been pressed and the current state data has been applied
    //can be used to update your data
    // pageNumber: the current page number
    // bOK: true=Ok/finish, false=cancel pressed
    //optional
    this.onClose = function(pageNumber, bOk) {
       isOk = bOk;
    }
    //other methods (all optional): on[ControlID]_pressed, _focusChanged(boolean lost=false, gained=true), _changed for edit and toggle buttons, _selChanged(int[] newSelection)
    //for editable tables: [ControlID]_cellEdited(row, column) row and column are 0-based
    this.FIELD_TREE_selChanged = function(newSelection) {
    }
        
    //the result of this function is returned as result of Dialogs.showDialog(). Can be any object.
    //optional    
    this.getResult = function() {
        if(!isOk) {
            return null;
        }
        else {
            var list = this.dialog.getPage(0).getDialogElement("POOL_LIST");
            var index = list.getSelection()[0];
            return pools[index];      
        }
    }
}

/*
* Get the locale of the UI in form of a string like "en" or "de"
* return current locale as string like "en" or "de"
*/
function getLanguage() {               
    var languageList = ArisData.getActiveDatabase().LanguageList();
    for(var i = 0; i < languageList.length; i++) {
        var language = languageList[i];
        var localeInfo = language.LocaleInfo();
        if(language.LocaleId() == gnLocale) {
            return localeInfo.getLocale().getLanguage();
        }
    }        
    return null;
}

/*
* Build and show PPM process tree
* settings: settings from wizard
* return: process type selection
*/
function buildProcessTypeTree(settings) {
    // query process typ
    var language = getLanguage();
    var sUrl = (settings.sUrl + "/ppmserver/" + settings.sClient + "/rest/conformance/v1/processtypes") + (language == null ? "" : "?language=" + language);
    var sProcessTypeTreeContent = restCall(settings, sUrl);    
    if(SHOW_DIALOGS) {
        var result = Dialogs.showDialog(new ProcessTypeDialog(sProcessTypeTreeContent), Constants.DIALOG_TYPE_ACTION, getString("TEXT_SELECT_PROCESS_TYPE"));
    } else {
        var keys = settings.sPPMkeys.split("\\\\");
        var json = JSON.parse(sProcessTypeTreeContent);
        var children = json.children;
        for(var i = 0; i < children.length; i++) {
            var child = children[i];
            var key = child["key"];
            if(key == keys[0]) {
                for(var j = 0; j < child.children.length; j++) {
                    if(child.children[j]["key"] = key[1]) {
                        var href = child.children[j].href;
                        return { "child" : settings.sPPMkeys, "href" : href};
                    }
                }
            }
            
        }
    }
    return result;
}

/*
* Message for model type exists
* wizardResult: wizard settings
* type: Constants.MT_EEPC or Constants.MT_MATRIX_MOD
* oSelectedGroup: traget group
*/
function modelExistMessageBox(wizardResult, type, oSelectedGroup) {
    var sModelName = gisProcess.contains(type) ? wizardResult.sProcessName : wizardResult.sMatrixName
    var oExistsModels = oSelectedGroup.ModelListFilter(sModelName , gnLocale, type);

    var resultFlagName = gisProcess.contains(type) ? "isProcessOverwrite" : "isMatrixOverwrite";
    
    if(oExistsModels.length != 0) {
        var result = Dialogs.MsgBox(commonUtils.attsall.formatString(getString("TEXT_MODEL_OVERWRITE"), [sModelName]), Constants.MSGBOX_ICON_QUESTION | Constants.MSGBOX_BTN_YESNOCANCEL + 512, "Choose option");
                
        switch(result) {
            case Constants.MSGBOX_RESULT_YES:
                wizardResult[resultFlagName] = true;
                return Constants.ERR_NOERROR;
            case Constants.MSGBOX_RESULT_NO:
                wizardResult[resultFlagName] = false;
                return Constants.ERR_NOERROR;
            default:
                return Constants.ERR_CANCEL;    
        }
    }  
    wizardResult[resultFlagName] = true;
    return Constants.ERR_NOERROR;
}
