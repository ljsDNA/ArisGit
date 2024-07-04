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

/*
 * Script: SWIT - Generate Solution Design
 */
 
FAD_TASK = function(oFadTaskOcc, nSuperiorSymbolNum) {
    this.oFadTaskOcc = oFadTaskOcc;
    this.nSuperiorSymbolNum = nSuperiorSymbolNum;
}
 
var nLoc = Context.getSelectedLanguage();
var oFilter = ArisData.ActiveFilter();

var oOut = Context.createOutputObject();
initOutput();
var g_bFirstPage = true;

var g_oAdditionalProcessModels = new Array();           // Assigned process models which have to be evaluated additionally
var g_oAdditionalServiceModels = new Array();           // Assigned service models which have to be evaluated additionally
var g_oAdditionalDataModels = new Array();              // Assigned screen models which have to be evaluated additionally
var g_oAdditionalScreenModels = new Array();            // Assigned screen models which have to be evaluated additionally

var g_oDoneProcessModels = new Array();


var oSelectedModels = ArisData.getSelectedModels();

// Processes
var oProcessModels = filterProcessModels(oSelectedModels);
outProcessModels(oProcessModels, true/*bHead*/);
outAdditionalProcessModels();

// Services
var oServiceModels = filterServiceModels(mergeModels(oSelectedModels, g_oAdditionalServiceModels));
outServiceModels(oServiceModels);

// Data
var oDataModels = filterDataModels(mergeModels(oSelectedModels, g_oAdditionalDataModels));
outDataModels(oDataModels);

// Screens
var oScreenModels = filterScreenModels(mergeModels(oSelectedModels, g_oAdditionalScreenModels));
outScreenModels(oScreenModels);

oOut.WriteReport();

/***********************************************************************************************************************/
/* PROCESS models                                                                                                      */
/***********************************************************************************************************************/

function outProcessModels(oProcessModels, bHead) {
    for (var i = 0; i < oProcessModels.length; i++) {
        outNewPage();
        
        if (bHead && i == 0) {
            oOut.OutputLnF(getString("PROCESSES"), "REPORT_HD1");
            oOut.OutputLnF("", "STD");
            oOut.OutputLnF("", "STD");
        }
                
        var oModel = oProcessModels[i];
        outProcessModel(oModel);
        
        outPools(oModel);
        outLanes(oModel);
        outTasks_common(oModel);
        outTasks_FAD(oModel);
        outGateways(oModel);
        outEvents(oModel);
        outMessages(oModel);
        outCallActivities(oModel);
        outProcessDataObjects(oModel);
        outSubprocesses(oModel);
    }
}

function outAdditionalProcessModels() {
    while (g_oAdditionalProcessModels.length > 0) {
        var nextProcessModels = copyModelList(g_oAdditionalProcessModels);
        g_oAdditionalProcessModels = new Array();
        
        for (var i = 0; i < nextProcessModels.length; i++) {
            var oProcessModel = nextProcessModels[i];
            if (isDoneModel(oProcessModel, g_oDoneProcessModels)) continue;
                
            outProcessModels([oProcessModel], false/*bHead*/);
        }
    }
}

function outProcessModel(oModel) {
    oOut.addLocalBookmark(getLink(oModel));
    oOut.OutputLnF(oModel.Name(nLoc), "REPORT_HD2");

    outModelAttributes();
    outModelGraphic(oModel);
    oOut.OutputLnF("", "STD");
    
    // List of Pools (Jump to pools)
    var oPoolOccs = oModel.ObjOccListBySymbol([Constants.ST_BPMN_POOL_1]).sort(sortName);
    if (oPoolOccs.length > 0) {
        oOut.OutputLnF(getString("LIST_OF_POOLS_"), "BOLD");
        oOut.BeginList(Constants.BULLET_DEFAULT);
        for each(var oPoolOcc in oPoolOccs) {
            oOut.OutputLinkF(oPoolOcc.ObjDef().Name(nLoc), getLink(oPoolOcc), "LINK");
            oOut.OutputLnF("", "STD");
        }
        oOut.EndList();    
    }
    oOut.OutputLnF("", "STD");
    
    function outModelAttributes() {
        openAttrTable();      
        var colorHolder = new __holder(false);
        outRow_Name(oModel, colorHolder, true);                                                     // Name
        outRow(getString("ARIS_DB"), ArisData.getActiveDatabase().Name(nLoc), colorHolder, true);   // ARIS database
        outRow(getString("GROUP_PATH"), oModel.Group().Path(nLoc), colorHolder, true);              // ARIS group path
        outRow_AttrIfMaint(oModel, Constants.AT_INTEGR_STATUS, colorHolder);                        // Integration status (if maintained) 
        outRow_AttrIfMaint(oModel, Constants.AT_CENTRASITE_ID, colorHolder);                        // CentraSite ID (if maintimated) 
        outRow_AttrIfMaint(oModel, Constants.AT_WEBMETHODS_DEVELOPER, colorHolder);                 // Developer (if maintimated) 
        outRow_Attr(oModel, Constants.AT_TIMEOUT_TYPE, colorHolder);                                // Time out type
        outRow_Attr(oModel, Constants.AT_STATIC_TIMEOUT_VALUE, colorHolder);                        // Static timeout value
        closeTable();
    }   
}

function outPools(oModel) {
    var oPoolOccs = oModel.ObjOccListBySymbol([Constants.ST_BPMN_POOL_1]).sort(sortName);
    if (oPoolOccs.length == 0) return; 
    
    outNewPage();
    oOut.OutputLnF(getString("POOL"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    outPoolInfo();
    
    for each(var oPoolOcc in oPoolOccs) {
        outPool(oPoolOcc);
    }
    
    function outPoolInfo() {
        oOut.BeginList(Constants.BULLET_DEFAULT);
        oOut.OutputLnF(getString("POOL_INFO_1"), "STD");
        oOut.OutputLnF(getString("POOL_INFO_2"), "STD"); 
        oOut.OutputLnF(getString("POOL_INFO_3"), "STD");
        oOut.EndList();
        oOut.OutputLnF("", "STD");        
    }
}

function outPool(oPoolOcc) {   
    oOut.OutputLnF("", "STD");
    oOut.addLocalBookmark(getLink(oPoolOcc));
    oOut.OutputLnF(oPoolOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outPoolAttributes();
    
    // List of lanes in pool
    var oLaneOccs = oPoolOcc.getConnectedObjOccs(Constants.ST_BPMN_LANE_1).sort(sortName);
    if (oLaneOccs.length > 0) {
        oOut.OutputLnF(getString("LIST_OF_LANES_IN_POOL_"), "BOLD");    
        oOut.BeginList(Constants.BULLET_DEFAULT);
        for each(var oLaneOcc in oLaneOccs) {
            oOut.OutputLnF(oLaneOcc.ObjDef().Name(nLoc), "STD");    
        }
        oOut.EndList();
        oOut.OutputLnF("", "STD");
    }
        
    //  Incoming connection occurrences
    var cxnHolder = new __holder(0);
    var fExtFunc = outAdditionalPoolAndLaneIfTask;      // if source object is task than pool and lane of task (if existing)
    outCxnSource(oPoolOcc, Constants.CT_BPMN_MESSAGE_FLOW, cxnHolder, fExtFunc);    // message flow (from pool/ task)
    outCxnSource(oPoolOcc, Constants.CT_IS_RECEIVED, cxnHolder, null);              // is received from (from message)
    closeCxnTable(cxnHolder);
    
    // Outgoing connection occurrences
    var cxnHolder = new __holder(0);
    var fExtFunc = outAdditionalPoolAndLaneIfTaskOrEvent;   // if source object is task/event than pool and lane of target object (if existing)
    outCxnTarget(oPoolOcc, Constants.CT_BPMN_MESSAGE_FLOW, cxnHolder, fExtFunc);    // message flow (to pool/ task/ event)
    outCxnTarget(oPoolOcc, Constants.CT_SENDS_2, cxnHolder, null);                  // sends (to message)
    closeCxnTable(cxnHolder);
    
    function outPoolAttributes() {
        var oPoolDef = oPoolOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);
        outRow_Name(oPoolDef, colorHolder, true);                               // Name
        outRow_Attr(oPoolDef, Constants.AT_DESC, colorHolder);                  // Description
        outRow_BoolAttr(oPoolDef, Constants.AT_EXTERNAL_POOL, colorHolder);     // External Pool (only if set to true mark pool as external pool) 
        outRow(getString("GUID"), oPoolDef.GUID(), colorHolder, true);          // GUID
        closeTable();
    }
}

function outLanes(oModel) {
    var oLaneOccs = oModel.ObjOccListBySymbol([Constants.ST_BPMN_LANE_1]).sort(sortName);
    if (oLaneOccs.length == 0) return;
    
    outNewPage();
    oOut.OutputLnF(getString("LANE"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var oLaneOcc in oLaneOccs) {
        outLane(oLaneOcc);
    }
}

function outLane(oLaneOcc) {
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oLaneOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outLaneAttributes();
    
    outEmbeddedObjects(getTaskSymbols(), getString("LIST_OF_TASKS_IN_LANE_"));      // List of tasks (Function) in lane  (By symbol, e.g. Manual Task : Name ; Service Task : Name)
    outEmbeddedObjects(getEventSymbols(), getString("LIST_OF_EVENTS_IN_LANE_"));    // List of events in lane (By symbol, e.g. Start Event : Name)
    outEmbeddedObjects(getGatewaySymbols(), getString("LIST_OF_RULES_"));           // List of rules (gateways) (By symbol, e.g. Complex Gateway: Name) 
    
    function outLaneAttributes() {
        var oLaneDef = oLaneOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);
        outRow_Name(oLaneDef, colorHolder, true);                               // Name
        outRow_Attr(oLaneDef, Constants.AT_DESC, colorHolder);                  // Description
        outRow(getString("GUID"), oLaneDef.GUID(), colorHolder, true);          // GUID
        closeTable();
    }
    
    function outEmbeddedObjects(aSymbolTypes, sHeadline) {
        var oEmbeddedObjOccs = getFilteredObjOccsBySymbol(oLaneOcc.getEmbeddedObjOccs());
        if (oEmbeddedObjOccs.length == 0) return;

        oEmbeddedObjOccs.sort(sortSymbolAndName);
        oOut.OutputLnF(sHeadline, "BOLD");    
        oOut.BeginList(Constants.BULLET_DEFAULT);
        for each(var oObjOcc in oEmbeddedObjOccs) {
            oOut.OutputLnF(oObjOcc.SymbolName() + ": " + oObjOcc.ObjDef().Name(nLoc), "STD");    
        }
        oOut.EndList();
        oOut.OutputLnF("", "STD");
        
        function getFilteredObjOccsBySymbol(oObjOccs) {
            var oFilteredObjOccs = new Array();
            for each(var oObjOcc in oObjOccs) {
                if (isSymbolInList(oObjOcc.SymbolNum(), aSymbolTypes)) {
                    oFilteredObjOccs.push(oObjOcc);
                }
            }
            return oFilteredObjOccs;
        }
    }
}

function outTasks_common(oModel) {
    var oTaskOccs = oModel.ObjOccListBySymbol(getTaskSymbols()).sort(sortSymbolAndName);
    if (oTaskOccs.length == 0) return;

    outNewPage();
    oOut.OutputLnF(getString("TASK_COMMON"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var oTaskOcc in oTaskOccs) {
        outTask_common(oTaskOcc);
    }
}

function outTask_common(oTaskOcc) {
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oTaskOcc.SymbolName() + ": " + oTaskOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outTaskAttributes();
    
    // Incoming connection occurrences 
    var cxnHolder = new __holder(0);
    outCxnSource(oTaskOcc, Constants.CT_ACTIV_1, cxnHolder, null);                  // activates (from event and rule)	        
    outCxnSource(oTaskOcc, Constants.CT_IS_PREDEC_OF_1, cxnHolder, null);           // is predecessor of (function)              
    outCxnSource(oTaskOcc, Constants.CT_BPMN_CAN_TRIGGER, cxnHolder, null);         // Can be triggered by (event/ boundary event of task)
    outCxnSource(oTaskOcc, Constants.CT_IS_RECEIVED, cxnHolder, null);              // is received from(from message)
    var fExtFunc = outAdditionalPoolAndLane;    // containing pool and lane of source object if existing            
    outCxnSource(oTaskOcc, Constants.CT_BPMN_MESSAGE_FLOW, cxnHolder, fExtFunc);    // message flow( from pool/task/event)
    closeCxnTable(cxnHolder);
     
    // Outgoing connection occurrences 
    var cxnHolder = new __holder(0);
    outCxnTarget(oTaskOcc, Constants.CT_LEADS_TO_1, cxnHolder, null);               // leads to (rule)
    outCxnTarget(oTaskOcc, Constants.CT_CRT_1, cxnHolder, null);                    // creates (event)
    var fExtFunc = outAdditionalPoolAndLane;    // containing pool and lane of target object if existing
    outCxnTarget(oTaskOcc, Constants.CT_BPMN_MESSAGE_FLOW, cxnHolder, fExtFunc);    // message flow (to pool/ task /event)			
    outCxnTarget(oTaskOcc, Constants.CT_SENDS_2, cxnHolder, null);                  // sends (to message)				
    closeCxnTable(cxnHolder);
    
    function outTaskAttributes() {
        var oTaskDef = oTaskOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);        
        outRow_Name(oTaskDef, colorHolder, true);                                       // Name
        outRow_Attr(oTaskDef, Constants.AT_DESC, colorHolder);                          // Description
        outRow(getString("GUID"), oTaskDef.GUID(), colorHolder, true);                  // GUID         
        outRow_Attr(oTaskDef, Constants.AT_BPMN_COMPENSATION_ACTIVITY, colorHolder);    // compensation activity
        outRow_Attr(oTaskDef, Constants.AT_BPMN_LOOP_TYPE_2, colorHolder);              // Loop type
        outRow_Attr(oTaskDef, Constants.AT_BPMN_LOOP_CONDITION, colorHolder);           // Loop condition
        outRow_Attr(oTaskDef, Constants.AT_M2E_SERVICE_ATTACHED, colorHolder);          // Service connected
        outRow_Attr(oTaskDef, Constants.AT_WEBMETHODS_IS_SERVICE, colorHolder);         // IS service
        outRow_Attr(oTaskDef, Constants.AT_ERROR_HANDLER, colorHolder);                 // Error handler
        outRow_Attr(oTaskDef, Constants.AT_TIMEOUT_HANDLER, colorHolder);               // Timeout handler
        outRow_Attr(oTaskDef, Constants.AT_CANCELLATION_HANDLER, colorHolder);          // Cancellation handler         
        closeTable();
    }      
}

function outTasks_FAD(oModel) {
    var aFadTasks = getTasksInAssignedFadModel();
    if (aFadTasks.length == 0) return;

    outNewPage();
    oOut.OutputLnF(getString("TASK_FAD"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var fadTask in aFadTasks) {
        outTask_FAD(fadTask);
    }
    
    function getTasksInAssignedFadModel() {
        var oAssignedTaskOccs = new Array();

        var oTaskOccs = oModel.ObjOccListBySymbol(getTaskSymbols());
        for each(var oTaskOcc in oTaskOccs) {
            var oTaskDef = oTaskOcc.ObjDef();
            var oFadModels = oTaskDef.AssignedModels(Constants.MT_FUNC_ALLOC_DGM);
            for each(var oFadModel in oFadModels) {
                var oTaskOccsInFadModel = oTaskDef.OccListInModel(oFadModel);
                for each(var oTaskOccInFadModel in oTaskOccsInFadModel) {
                    
                    oAssignedTaskOccs.push(new FAD_TASK(oTaskOccInFadModel/*oFadTaskOcc*/, oTaskOcc.SymbolNum()/*nSuperiorSymbolNum*/));
                }
            }
        }
        return oAssignedTaskOccs.sort(sortTaskName);
    }
}

function outTask_FAD(fadTask) {
    var oTaskOcc = fadTask.oFadTaskOcc;
    var supSymbolNum = fadTask.nSuperiorSymbolNum;
    
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oTaskOcc.SymbolName() + ": " + oTaskOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    oOut.OutputLnF("", "STD");

    // Incoming connection occurrences 
    var cxnHolder = new __holder(0);

    if (supSymbolNum == Constants.ST_BPMN_SERVICE_TASK/*Service task*/) {
        // supports (from Application system type (symbol software service type))
        // supports (from IT Function type (symbol software service operation type)) 
        var fExtFunc = outAdditionalAttributes_TaskFad; // Additional attributes
        var oInCxns = outCxnSource(oTaskOcc, Constants.CT_CAN_SUPP_1, cxnHolder, fExtFunc);
        closeCxnTable(cxnHolder);
        
        // If source object has assignment to Application System Type diagram than Jump to service section 
        outSourceAssignments(oInCxns);
    }
    if (supSymbolNum == Constants.ST_BPMN_BUSINESS_RULE_TASK/*Business rule task*/) {
        outCxnSource(oTaskOcc, Constants.CT_DESCRIBES, cxnHolder, null);    // describes (from business rule set)
        closeCxnTable(cxnHolder);
    }
    if (supSymbolNum == Constants.ST_BPMN_USER_TASK/*User task*/) {
        var fExtFunc = outAdditionalAttributeDesc;  // Additional attribute: description
        outCxnSource(oTaskOcc, Constants.CT_EXEC_2, cxnHolder, fExtFunc);   // carries out (from organization/role/organizational unit /position /group /internal person/organizational unit type)
        closeCxnTable(cxnHolder);
    }
    if (supSymbolNum == Constants.ST_BPMN_MANUAL_TASK_2/*Manual task*/) {
        var fExtFunc = outAdditionalAttributeDesc;  // Additional attribute: description
        outCxnSource(oTaskOcc, Constants.CT_EXEC_2, cxnHolder, fExtFunc);   // carries out (from organization/role/organizational unit /position /group /internal person/organizational unit type)
        closeCxnTable(cxnHolder);
    }
     
    // Outgoing connection occurrences 
    var cxnHolder = new __holder(0);

    if (supSymbolNum == Constants.ST_BPMN_USER_TASK/*User task*/) {
        //  (Jump to screen section)
        outCxnTargetLinked(oTaskOcc, Constants.CT_IS_REPR_BY, cxnHolder);   // is represented by (to Screen(Solution Design))
        closeCxnTable(cxnHolder);
        
        getAssignedScreenModels();    // AME-1435
    }
    
    function getAssignedScreenModels() {
        var oOutCxns = getFilteredCxns(oTaskOcc.Cxns(Constants.EDGES_OUT), Constants.CT_IS_REPR_BY);
        for (var i in oOutCxns) {
            var oTrgObjOcc = oOutCxns[i].TargetObjOcc();
            if (oTrgObjOcc.ObjDef().TypeNum() != Constants.OT_SCREEN_SD) continue;
            
            var oAssignedScreenModels = oTrgObjOcc.ObjDef().AssignedModels(Constants.MT_SCREEN_DESIGN_SD);
            for (var j in oAssignedScreenModels) {
                g_oAdditionalScreenModels.push(oAssignedScreenModels[j]);
            }
        }
    }
    
    function outSourceAssignments(oInCxns) {
        var oAssignedModels = new Array();        
        for (var i = 0; i < oInCxns.length; i++) {
            var oSourceOcc = oInCxns[i].SourceObjOcc();
            oAssignedModels = oAssignedModels.concat(oSourceOcc.ObjDef().AssignedModels(Constants.MT_APPL_SYS_TYPE_DGM));
        }
        if (oAssignedModels.length == 0) return;

        oOut.OutputLnF("", "STD");        
        oOut.OutputLnF(getString("ASSIGNMENTS_OF_SOURCE_"), "BOLD");
        oOut.BeginList(Constants.BULLET_DEFAULT);
        for each(var oAssignedModel in oAssignedModels) {
            oOut.OutputLinkF(oAssignedModel.Name(nLoc), getLink(oAssignedModel), "LINK");
            oOut.OutputLnF("", "STD");
            
            g_oAdditionalServiceModels.push(oAssignedModel);
        }
        oOut.EndList();    
        oOut.OutputLnF("", "STD");        
    }
}

function outGateways(oModel) {
    var oGatewayOccs = oModel.ObjOccListFilter(Constants.OT_RULE).sort(sortName);
    if (oGatewayOccs.length == 0) return;
    
    outNewPage();
    oOut.OutputLnF(getString("GATEWAY"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var oGatewayOcc in oGatewayOccs) {
        outGateway(oGatewayOcc);
    }
}

function outGateway(oGatewayOcc) {
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oGatewayOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outGatewayAttributes();
    
    //  Incoming connection occurrences 
    var cxnHolder = new __holder(0);
    outCxnSource(oGatewayOcc, Constants.CT_LEADS_TO_1, cxnHolder, null);        // leads to (from task)
    outCxnSource(oGatewayOcc, Constants.CT_LNK_2, cxnHolder, null);             // links (from gateway)
    outCxnSource(oGatewayOcc, Constants.CT_IS_EVAL_BY_1, cxnHolder, null);      // is evaluated by (event/ boundary event of task)
    closeCxnTable(cxnHolder);
    
    // Outgoing connection occurrences 
    var cxnHolder = new __holder(0);
    var fExtFunc = outAdditionalAttributes_Gateway;     // Additional attributes: condition expression, Sequence flow condition
    outCxnTarget(oGatewayOcc, Constants.CT_ACTIV_1, cxnHolder, fExtFunc);       // activates (to task)
    outCxnTarget(oGatewayOcc, Constants.CT_LNK_2, cxnHolder, fExtFunc);         // links (to gateway)
    outCxnTarget(oGatewayOcc, Constants.CT_LEADS_TO_2, cxnHolder, fExtFunc);    // lead to (to event)
    closeCxnTable(cxnHolder);
    
    function outGatewayAttributes() {
        var oGatewayDef = oGatewayOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);        
        outRow_Name(oGatewayDef, colorHolder, true);                                // Name
        outRow_Attr(oGatewayDef, Constants.AT_DESC, colorHolder);                   // Description
        outRow(getString("GUID"), oGatewayDef.GUID(), colorHolder, true);           // GUID         
        outRow(getString("SYMBOL"), oGatewayOcc.SymbolName(), colorHolder, true);   // symbol          
        outRow_Attr(oGatewayDef, Constants.AT_IS_COMP, colorHolder);                // Condition
        closeTable();
    }
}

function outEvents(oModel) {
    var oEventOccs = oModel.ObjOccListFilter(Constants.OT_EVT).sort(sortName);
    if (oEventOccs.length == 0) return;
    
    outNewPage();
    oOut.OutputLnF(getString("EVENT"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var oEventOcc in oEventOccs) {
        outEvent(oEventOcc);
    }
}

function outEvent(oEventOcc) {
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oEventOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outEventAttributes();
    
    //  Incoming connections occurrences 
    var cxnHolder = new __holder(0);
    outCxnSource(oEventOcc, Constants.CT_CRT_1, cxnHolder, null);                   // creates (from task)
    outCxnSource(oEventOcc, Constants.CT_LEADS_TO_1, cxnHolder, null);              // leads to (from gateway)
    outCxnSource(oEventOcc, Constants.CT_SUCCEED, cxnHolder, null);                 // occurs before (event/ boundary event of task)
    outCxnSource(oEventOcc, Constants.CT_IS_RECEIVED, cxnHolder, null);             // is received from (from message)
    var fExtFunc = outAdditionalPoolAndLane;    // containing pool and lane of source object if existing
    outCxnSource(oEventOcc, Constants.CT_BPMN_MESSAGE_FLOW, cxnHolder, fExtFunc);   // message flow (from task/pool)
    closeCxnTable(cxnHolder);
    
    // Outgoing connection occurrences 
    var cxnHolder = new __holder(0);
    outCxnTarget(oEventOcc, Constants.CT_ACTIV_1, cxnHolder, null);                 // activates (to task)
    outCxnTarget(oEventOcc, Constants.CT_IS_EVAL_BY_1, cxnHolder, null);            // is evaluated by (to gateway)
    outCxnTarget(oEventOcc, Constants.CT_SUCCEED, cxnHolder, null);                 // occurs before(to event)
    closeCxnTable(cxnHolder);
    
    function outEventAttributes() {
        var oEventDef = oEventOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);        
        outRow_Name(oEventDef, colorHolder, true);                                  // Name
        outRow_Attr(oEventDef, Constants.AT_DESC, colorHolder);                     // Description
        outRow(getString("GUID"), oEventDef.GUID(), colorHolder, true);             // GUID        
        outRow(getString("SYMBOL"), oEventOcc.SymbolName(), colorHolder, true);     // symbol
        closeTable();
    }
}

function outMessages(oModel) {
    var oMessageOccs = oModel.ObjOccListFilter(Constants.OT_MSG_FLW).sort(sortName);
    if(oMessageOccs.length == 0) return;

    outNewPage();
    oOut.OutputLnF(getString("MESSAGE"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var oMessageOcc in oMessageOccs) {
        outMessage(oMessageOcc);
    }
}

function outMessage(oMessageOcc) {
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oMessageOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outMessageAttributes();
    
    //  Incoming connection occurrences 
    var cxnHolder = new __holder(0);
    var fExtFunc = outAdditionalPoolAndLane;    // containing pool and lane of source object if existing 
    outCxnSource(oMessageOcc, Constants.CT_SENDS_2, cxnHolder, fExtFunc);       // sends (from pool/task)
    closeCxnTable(cxnHolder);
    
    // Outgoing connection occurrences 
    var cxnHolder = new __holder(0);
    var fExtFunc = outAdditionalPoolAndLane;    // containing pool and lane of target object if existing 
    outCxnTarget(oMessageOcc, Constants.CT_IS_RECEIVED, cxnHolder, fExtFunc);   // is received from (to event/task/pool)
    closeCxnTable(cxnHolder);
    
    function outMessageAttributes() {
        var oMessageDef = oMessageOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);        
        outRow_Name(oMessageDef, colorHolder, true);                            // Name
        outRow_Attr(oMessageDef, Constants.AT_DESC, colorHolder);               // Description
        outRow(getString("GUID"), oMessageDef.GUID(), colorHolder, true);       // GUID
        closeTable();
    }
}

function outCallActivities(oModel) {
    var oActivityOccs = oModel.ObjOccListBySymbol(getCallActivitySymbols()).sort(sortName);
    if (oActivityOccs.length == 0) return;
    
    outNewPage();
    oOut.OutputLnF(getString("CALL_ACTIVITY"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var oActivityOcc in oActivityOccs) {
        outCallActivity(oActivityOcc);
    }
}

function outCallActivity(oActivityOcc) {
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oActivityOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outActivityAttributes(); 

    //  Incoming connections occurrences 
    var cxnHolder = new __holder(0);
    outCxnSource(oActivityOcc, Constants.CT_ACTIV_1, cxnHolder, null);                  // activates (from event and rule)
    outCxnSource(oActivityOcc, Constants.CT_IS_PREDEC_OF_1, cxnHolder, null);           // is predecessor of (function,call activity)
    outCxnSource(oActivityOcc, Constants.CT_BPMN_CAN_TRIGGER, cxnHolder, null);         // Can be triggered by (event/ boundary event of task)
    outCxnSource(oActivityOcc, Constants.CT_IS_RECEIVED, cxnHolder, null);              // is received from(from message)
    var fExtFunc = outAdditionalPoolAndLane;    // containing pool and lane of source object if existing
    outCxnSource(oActivityOcc, Constants.CT_BPMN_MESSAGE_FLOW, cxnHolder, fExtFunc);    // message flow( from pool/task/event)
    closeCxnTable(cxnHolder);
    
    // Outgoing connection occurrences 
    var cxnHolder = new __holder(0);
    outCxnTarget(oActivityOcc, Constants.CT_LEADS_TO_1, cxnHolder, null);               // leads to (rule)
    outCxnTarget(oActivityOcc, Constants.CT_CRT_1, cxnHolder, null);                    // creates (event)
    var fExtFunc = outAdditionalPoolAndLane;    // containing pool and lane of target object if existing
    outCxnTarget(oActivityOcc, Constants.CT_BPMN_MESSAGE_FLOW, cxnHolder, fExtFunc);    // message flow (to pool/ task /event/ call activity)
    outCxnTarget(oActivityOcc, Constants.CT_SENDS_2, cxnHolder, null);                  // sends (to message)
    closeCxnTable(cxnHolder);
    
    function outActivityAttributes() {
        var oActivityDef = oActivityOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);        
        outRow_Name(oActivityDef, colorHolder, true);                                       // Name
        outRow_Attr(oActivityDef, Constants.AT_DESC, colorHolder);                          // Description
        outRow(getString("GUID"), oActivityDef.GUID(), colorHolder, true);                  // GUID
        outRow_Attr(oActivityDef, Constants.AT_BPMN_COMPENSATION_ACTIVITY, colorHolder);    // compensation activity
        outRow_Attr(oActivityDef, Constants.AT_BPMN_LOOP_TYPE_2, colorHolder);              // Loop type
        outRow_Attr(oActivityDef, Constants.AT_BPMN_LOOP_CONDITION, colorHolder);           // Loop condition
        outRow_Attr(oActivityDef, Constants.AT_BPMN_CALLED_ELEMENT, colorHolder);           // Called element
        outRow_Attr(oActivityDef, Constants.AT_ERROR_HANDLER, colorHolder);                 // Error handler
        outRow_Attr(oActivityDef, Constants.AT_TIMEOUT_HANDLER, colorHolder);               // Timeout handler
        outRow_Attr(oActivityDef, Constants.AT_CANCELLATION_HANDLER, colorHolder);          // Cancellation handler
        outRow_Attr(oActivityDef, Constants.AT_REFERENCED_PROCESS_TYPE, colorHolder);       // Referenced process type
        closeTable();
    }  
}

function outProcessDataObjects(oModel) {
    var oDataObjectOccs = oModel.ObjOccListFilter(Constants.OT_CLST).sort(sortName);
    if (oDataObjectOccs.length == 0) return;
    
    outNewPage();
    oOut.OutputLnF(getString("DATA_OBJECT"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var oDataObjectOcc in oDataObjectOccs) {
        outProcessDataObject(oDataObjectOcc);
    }
}

function outProcessDataObject(oDataObjectOcc) {
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oDataObjectOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outDataObjectAttributes();
    
    //  Incoming connections occurrences
    var cxnHolder = new __holder(0);
    var fExtFunc = outAdditionalAttributeDesc;  // Additional attribute: description
    outCxnSourceBySymbol(oDataObjectOcc, Constants.CT_HAS_OUT, Constants.ST_BPMN_MESSAGE_START_EVENT, cxnHolder, fExtFunc, "");     // has as output [to message start event]
    closeCxnTable(cxnHolder);
    
    // Outgoing connection occurrences 
    var cxnHolder = new __holder(0);
    var fExtFunc = outAdditionalAttributeDesc;  // Additional attribute: description
    outCxnTargetBySymbol(oDataObjectOcc, Constants.CT_IS_INP_FOR, Constants.ST_BPMN_MESSAGE_END_EVENT, cxnHolder, fExtFunc, "");    // is input for [to message end event]
    closeCxnTable(cxnHolder);	
    
    outDataObjectAssignments();
    
    function outDataObjectAttributes() {
        var oDataObjectDef = oDataObjectOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);        
        outRow_Name(oDataObjectDef, colorHolder, true);                                 // Name
        outRow(getString("GUID"), oDataObjectDef.GUID(), colorHolder, true);            // GUID
        outRow_Attr(oDataObjectDef, Constants.AT_NAMESPACE_SD, colorHolder);            // Namespace
        outRow_Attr(oDataObjectDef, Constants.AT_LAST_EXPORT_DATE_SD, colorHolder);     // Date of the last solution export 
        closeTable();
    }
    
    function outDataObjectAssignments() {
        // Document structure (Solution design) --> Jump to data section
        var oAssignedModels = oDataObjectOcc.ObjDef().AssignedModels(Constants.MT_DOCUMENT_STRUCTURE_SD);
        if (oAssignedModels.length == 0) return;

        oOut.OutputLnF("", "STD");        
        oOut.OutputLnF(getString("ASSIGNMENTS_"), "BOLD");
        oOut.BeginList(Constants.BULLET_DEFAULT);
        for each(var oAssignedModel in oAssignedModels) {
            oOut.OutputLinkF(oAssignedModel.Name(nLoc), getLink(oAssignedModel), "LINK");
            oOut.OutputLnF("", "STD");
            
            g_oAdditionalDataModels.push(oAssignedModel);
        }
        oOut.EndList();    
        oOut.OutputLnF("", "STD");        
    }        
}

function outSubprocesses(oModel) {
    var oSubprocessOccs = oModel.ObjOccListBySymbol(getSubprocessSymbols()).sort(sortName);
    if (oSubprocessOccs.length == 0) return;
    
    outNewPage();
    oOut.OutputLnF(getString("SUB_PROCESS"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var oSubprocessOcc in oSubprocessOccs) {
        outSubprocess(oSubprocessOcc);
    }
}

function outSubprocess(oSubprocessOcc) {
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oSubprocessOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outSubprocessAttributes(); 

    outConnectedObjects(getEventSymbols(), getString("LIST_OF_EVENTS_"));   // List of Events
    outConnectedObjects(getTaskSymbols(), getString("LIST_OF_TASKS_"));     // List of Tasks
    
    // If collapsed than solution book export of assigned BPMN2 Process or BPMN2 Collaboration diagram
    if (isCollapsed()) outAssignedProcesses();

    //  Incoming connections occurrences 
    var cxnHolder = new __holder(0);
    outCxnSource(oSubprocessOcc, Constants.CT_ACTIV_1, cxnHolder, null);                    // activates (from event and rule)
    outCxnSource(oSubprocessOcc, Constants.CT_IS_PREDEC_OF_1, cxnHolder, null);             // is predecessor of (function,call activity)
    outCxnSource(oSubprocessOcc, Constants.CT_BPMN_CAN_TRIGGER, cxnHolder, null);           // Can be triggered by (event/ boundary event of task)
    outCxnSource(oSubprocessOcc, Constants.CT_IS_RECEIVED, cxnHolder, null);                // is received from(from message)
    var fExtFunc = outAdditionalPoolAndLane;    // containing pool and lane of source object if existing
    outCxnSource(oSubprocessOcc, Constants.CT_BPMN_MESSAGE_FLOW, cxnHolder, fExtFunc);      // message flow( from pool/task/event)
    closeCxnTable(cxnHolder);
    
    // Outgoing connection occurrences 
    var cxnHolder = new __holder(0);
    outCxnTarget(oSubprocessOcc, Constants.CT_LEADS_TO_1, cxnHolder, null);                 // leads to (rule)
    outCxnTarget(oSubprocessOcc, Constants.CT_CRT_1, cxnHolder, null);                      // creates (event)
    var fExtFunc = outAdditionalPoolAndLane;    // containing pool and lane of target object if existing
    outCxnTarget(oSubprocessOcc, Constants.CT_BPMN_MESSAGE_FLOW, cxnHolder, fExtFunc);      // message flow (to pool/ task /event/ call activity)
    outCxnTarget(oSubprocessOcc, Constants.CT_SENDS_2, cxnHolder, null);                    // sends (to message)
    closeCxnTable(cxnHolder);
    
    function outSubprocessAttributes() {
        var oSubprocessDef = oSubprocessOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);        
        outRow_Name(oSubprocessDef, colorHolder, true);                                     // Name
        outRow_Attr(oSubprocessDef, Constants.AT_DESC, colorHolder);                        // Description
        outRow(getString("GUID"), oSubprocessDef.GUID(), colorHolder, true);                // GUID
        outRow(getString("SYMBOL"), oSubprocessOcc.SymbolName(), colorHolder, true);        // symbol          
        outRow_Attr(oSubprocessDef, Constants.AT_BPMN_COMPENSATION_ACTIVITY, colorHolder);  // compensation activity
        outRow_Attr(oSubprocessDef, Constants.AT_BPMN_LOOP_TYPE_2, colorHolder);            // Loop type
        outRow_Attr(oSubprocessDef, Constants.AT_BPMN_LOOP_CONDITION, colorHolder);         // Loop condition
        outRow_Attr(oSubprocessDef, Constants.AT_BPMN_EVENT_SUBPROCESS, colorHolder);       // event sub process     
        outRow(getString("IS_COLLAPSED"), isCollapsed(), colorHolder, true);                // Boolean value if sub process is collapsed  
        
        if (isCollapsed()) {
            // If Collapsed then content of assigned model (BPMN Process model)
            var oAssignedModels = oSubprocessDef.AssignedModels(Constants.MT_BPMN_PROCESS_DIAGRAM);
            for each(var oAssignedModel in oAssignedModels) {
                
                outModelAttributes(oAssignedModel);
            }
        }
        closeTable();
        
        function outModelAttributes(oModel) {
            outRow_Name(oModel, colorHolder, true);                                                     // Name
            outRow(getString("ARIS_DB"), ArisData.getActiveDatabase().Name(nLoc), colorHolder, true);   // ARIS database
            outRow(getString("GROUP_PATH"), oModel.Group().Path(nLoc), colorHolder, true);              // ARIS group path
            outRow_AttrIfMaint(oModel, Constants.AT_INTEGR_STATUS, colorHolder);                        // Integration status (if maintained) 
            outRow_AttrIfMaint(oModel, Constants.AT_CENTRASITE_ID, colorHolder);                        // CentraSite ID (if maintimated) 
            outRow_AttrIfMaint(oModel, Constants.AT_WEBMETHODS_DEVELOPER, colorHolder);                 // Developer (if maintimated) 
            outRow_Attr(oModel, Constants.AT_TIMEOUT_TYPE, colorHolder);                                // Time out type
            outRow_Attr(oModel, Constants.AT_STATIC_TIMEOUT_VALUE, colorHolder);                        // Static timeout value
        }
    }  
    
    function outConnectedObjects(aSymbolTypes, sHeadline) {
        var oConnectedObjOccs = oSubprocessOcc.getConnectedObjOccs(aSymbolTypes).sort(sortSymbolAndName);
        if (oConnectedObjOccs.length == 0) return;

        oOut.OutputLnF(sHeadline, "BOLD");    
        oOut.BeginList(Constants.BULLET_DEFAULT);
        for each(var oObjOcc in oConnectedObjOccs) {
            oOut.OutputLnF(oObjOcc.SymbolName() + ": " + oObjOcc.ObjDef().Name(nLoc), "STD");    
        }
        oOut.EndList();
        oOut.OutputLnF("", "STD");
    }    
    
    function outAssignedProcesses() {
        var oAssignedModels = oSubprocessOcc.ObjDef().AssignedModels([Constants.MT_BPMN_COLLABORATION_DIAGRAM, Constants.MT_BPMN_PROCESS_DIAGRAM]);
        if (oAssignedModels.length == 0) return;

        oOut.OutputLnF("", "STD");        
        oOut.OutputLnF(getString("ASSIGNMENTS_"), "BOLD");
        oOut.BeginList(Constants.BULLET_DEFAULT);
        for each(var oAssignedModel in oAssignedModels) {
            oOut.OutputLinkF(oAssignedModel.Name(nLoc), getLink(oAssignedModel), "LINK");
            oOut.OutputLnF("", "STD");
            
            g_oAdditionalProcessModels.push(oAssignedModel);
        }
        oOut.EndList();    
        oOut.OutputLnF("", "STD");                
    }

    function isCollapsed() {
        if (oSubprocessOcc.OrgSymbolNum() == Constants.ST_BPMN_SUB_PROCESS_COLLAPSED) return getString("YES");
        return getString("NO");
    }
}

function outAdditionalPoolAndLaneIfTask(oObjOcc, colorHolder) {
    // if object is task than pool and lane of task (if existing)
    if (isTask(oObjOcc)) {
        outAdditionalPoolAndLane(oObjOcc, colorHolder)
    }
}

function outAdditionalPoolAndLaneIfTaskOrEvent(oObjOcc, colorHolder) {    
    // if object is task/event than pool and lane of target object (if existing)
    if (isTask(oObjOcc) || isEvent(oObjOcc)) {
        outAdditionalPoolAndLane(oObjOcc, colorHolder)
    }
}

function outAdditionalPoolAndLane(oObjOcc, colorHolder) {
    // containing pool and lane of source/target object if existing
    var oPoolOcc = getPool();
    if (oPoolOcc != null) {
        outRow_indent(getString("CONTAINING_POOL"), oPoolOcc.ObjDef().Name(nLoc), colorHolder);
    }
    var oLaneOcc = getLane();
    if (oLaneOcc != null) {
        outRow_indent(getString("CONTAINING_LANE"), oLaneOcc.ObjDef().Name(nLoc), colorHolder);
    }
    
    function getPool() {
        var oPoolOcc = getContainerOcc(oObjOcc, Constants.ST_BPMN_POOL_1);
        if (oPoolOcc == null) {
            oPoolOcc = getContainerOcc(getLane(), Constants.ST_BPMN_POOL_1);
        }
        return oPoolOcc;
    }
    
    function getLane() {
        return getContainerOcc(oObjOcc, Constants.ST_BPMN_LANE_1);
    }
    
    function getContainerOcc(oObjOcc, nSymbolType) {
        if (oObjOcc != null) {
            var oCxnOccs = oObjOcc.Cxns(Constants.EDGES_OUT);
            for each(var oCxnOcc in oCxnOccs) {
                if (oCxnOcc.CxnDef().TypeNum() != Constants.CT_BELONGS_TO_1) continue;
                    
                var oContainerOcc = oCxnOcc.TargetObjOcc();
                if (oContainerOcc.SymbolNum() == nSymbolType) return oContainerOcc;
            }
        }
        return null;
        
    }
}

function outAdditionalAttributes_Gateway(oObjOcc, colorHolder) {
    var oObjDef = oObjOcc.ObjDef();
    outRow_Attr_indent(oObjDef, Constants.AT_BPMN_CONDITION_EXPRESSION, colorHolder);   // condition expression
    outRow_Attr_indent(oObjDef, Constants.AT_BPMN_SEQ_FLOW_CONDITION, colorHolder);     // Sequence flow condition
}

function outAdditionalAttributes_TaskFad(oObjOcc, colorHolder) {
    var oObjDef = oObjOcc.ObjDef();
    outRow_Attr_indent(oObjDef, Constants.AT_CENTRASITE_NAME, colorHolder);                                 // CentraSite name
    outRow_Attr_indent(oObjDef, Constants.AT_CENTRASITE_DESCRIPTION, colorHolder);                          // CentraSite description
    outRow_Attr_indent(oObjDef, Constants.AT_CENTRASITE_ORGANIZATION, colorHolder);                         // CentraSite organization
    outRow_Attr_indent(oObjDef, Constants.AT_CENTRASITE_OWNER, colorHolder);                                // CentraSite owner
    outRow_Attr_indent(oObjDef, Constants.AT_CENTRASITE_VERSION, colorHolder);                              // CentraSite version
    outRow_Attr_indent(oObjDef, Constants.AT_CENTRASITE_LIFECYCLE_STATE, colorHolder);                      // CentraSite life cycle state
    outRow_Attr_indent(oObjDef, Constants.AT_DEPRECATED_OBJECT, colorHolder);                               // Deprecated object
    
    if (oObjDef.TypeNum() == Constants.OT_APPL_SYS_TYPE) {
        outRow_Attr_indent(oObjDef, Constants.AT_CENTRASITE_REQUESTS_RUNNING, colorHolder);                 // CentraSite request running
    }
    outRow_Attr_indent(oObjDef, Constants.AT_CENTRASITE_SYNCHRONIZATION, colorHolder);                      // CentraSite synchronization
    
    if (oObjDef.TypeNum() == Constants.OT_APPL_SYS_TYPE) {
        outRow_Attr_indent(oObjDef, Constants.AT_SERVICE_TYPE, colorHolder);                                // Service type
        outRow_Attr_indent(oObjDef, Constants.AT_WSDL_NAMESPACE, colorHolder);                              // WSDL Namespace
        outRow_Attr_indent(oObjDef, Constants.AT_WSDL_FILE_URL_IN_CENTRASITE_WITHOUT_LOGIN, colorHolder);   // WSDL file URL in CentraSite
        outRow_Attr_indent(oObjDef, Constants.AT_BPEL_IMPORT_LOCATION, colorHolder);                        // Import location
    }
    if (oObjDef.TypeNum() == Constants.OT_DP_FUNC_TYPE) {
        outRow_Attr_indent(oObjDef, Constants.AT_INPUT_MESSAGE, colorHolder);                               // Input message
        outRow_Attr_indent(oObjDef, Constants.AT_OUTPUT_MESSAGE, colorHolder);                              // Output message
        outRow_Attr_indent(oObjDef, Constants.AT_ERROR_MESSAGE, colorHolder);                               // Error massage
    }
}

function outAdditionalAttributeDesc(oObjOcc, colorHolder) {
    var oObjDef = oObjOcc.ObjDef();
    outRow_Attr_indent(oObjDef, Constants.AT_DESC, colorHolder);        // Description
}

function outAdditionalJumpToScreen(oObjOcc, colorHolder) {
    // TODO Jump to screen section
}

/***********************************************************************************************************************/
/* SERVICE models                                                                                                      */
/***********************************************************************************************************************/

function outServiceModels(oServiceModels) {
    for (var i = 0; i < oServiceModels.length; i++) {
        outNewPage();
        
        if (i == 0) {
            oOut.OutputLnF(getString("SERVICES"), "REPORT_HD1");
            oOut.OutputLnF("", "STD");
            oOut.OutputLnF("", "STD");
        }
        var oModel = oServiceModels[i];        
        oOut.addLocalBookmark(getLink(oModel));
        oOut.OutputLnF(oModel.Name(nLoc), "REPORT_HD2");
        
        outSoftwareServiceTypes(oModel);
        outSoftwareServiceOperationTypes(oModel);
    }
}

function outSoftwareServiceTypes(oModel) {
    var oSSTOccs = oModel.ObjOccListBySymbol([Constants.ST_SW_SERVICE_TYPE]).sort(sortName);
    if (oSSTOccs.length == 0) return;
    
    outNewPage();
    oOut.OutputLnF(getString("SST"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var oSSTOcc in oSSTOccs) {
        outSoftwareServiceType(oSSTOcc);
    }
}

function outSoftwareServiceType(oSSTOcc) {
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oSSTOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outSSTAttributes();  

    //  Incoming connection occurrences
    var cxnHolder = new __holder(0);
    outCxnSourceBySymbol(oSSTOcc, Constants.CT_CAN_SUBS_2, Constants.ST_SW_SERVICE_TYPE, cxnHolder, null, "");                  // encompasses (to Software service type )
    closeCxnTable(cxnHolder);

    // Outgoing connection occurrences
    var cxnHolder = new __holder(0);
    var sHead2 = getString("BASE_SERVICES");
    outCxnTargetBySymbol(oSSTOcc, Constants.CT_CAN_SUBS_2, Constants.ST_SW_SERVICE_TYPE, cxnHolder, null, sHead2);              // encompasses (to Software service type )
    sHead2 = getString("OPERATIONS_OF_SERVICES")
    outCxnTargetBySymbol(oSSTOcc, Constants.CT_CAN_SUBS_2, Constants.ST_SW_SERVICE_OPERATION_TYPE, cxnHolder, null, sHead2);    // encompasses (to Software service operations types )
    closeCxnTable(cxnHolder);    
    
    function outSSTAttributes() {
        var oSSTDef = oSSTOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);
        outRow_Attr(oSSTDef, Constants.AT_CENTRASITE_NAME, colorHolder);                             // CentraSite name
        outRow_Attr(oSSTDef, Constants.AT_CENTRASITE_DESCRIPTION, colorHolder);                      // CentraSite description
        outRow_Attr(oSSTDef, Constants.AT_CENTRASITE_ORGANIZATION, colorHolder);                     // CentraSite organization
        outRow_Attr(oSSTDef, Constants.AT_CENTRASITE_OWNER, colorHolder);                            // CentraSite owner
        outRow_Attr(oSSTDef, Constants.AT_CENTRASITE_VERSION, colorHolder);                          // CentraSite version
        outRow_Attr(oSSTDef, Constants.AT_CENTRASITE_LIFECYCLE_STATE, colorHolder);                  // CentraSite life cycle state
        outRow_Attr(oSSTDef, Constants.AT_DEPRECATED_OBJECT, colorHolder);                           // Deprecated object
        outRow_Attr(oSSTDef, Constants.AT_CENTRASITE_REQUESTS_RUNNING, colorHolder);                 // CentraSite request running
        outRow_Attr(oSSTDef, Constants.AT_CENTRASITE_SYNCHRONIZATION, colorHolder);                  // CentraSite synchronization
        outRow_Attr(oSSTDef, Constants.AT_SERVICE_TYPE, colorHolder);                                // Service type
        outRow_Attr(oSSTDef, Constants.AT_WSDL_NAMESPACE, colorHolder);                              // WSDL Namespace
        outRow_Attr(oSSTDef, Constants.AT_WSDL_FILE_URL_IN_CENTRASITE_WITHOUT_LOGIN, colorHolder);   // WSDL file URL in CentraSite
        outRow_Attr(oSSTDef, Constants.AT_BPEL_IMPORT_LOCATION, colorHolder);                        // Import location
        closeTable();
    }    
}

function outSoftwareServiceOperationTypes(oModel) {
    var oSSOTOccs = oModel.ObjOccListBySymbol([Constants.ST_SW_SERVICE_OPERATION_TYPE]).sort(sortName);
    if (oSSOTOccs.length == 0) return;
    
    outNewPage();
    oOut.OutputLnF(getString("SSOT"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var oSSOTOcc in oSSOTOccs) {
        outSoftwareServiceOperationType(oSSOTOcc);
    }
}

function outSoftwareServiceOperationType(oSSOTOcc) {
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oSSOTOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outSSOTAttributes(); 

    //  Incoming connection occurrences
    var cxnHolder = new __holder(0);
    outCxnSourceBySymbol(oSSOTOcc, Constants.CT_CAN_SUBS_2, Constants.ST_SW_SERVICE_TYPE, cxnHolder, null, "");         // encompasses (from Software service type) 
    closeCxnTable(cxnHolder);
    
    function outSSOTAttributes() {
        var oSSOTDef = oSSOTOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);
        outRow_Attr(oSSOTDef, Constants.AT_CENTRASITE_NAME, colorHolder);                             // CentraSite name
        outRow_Attr(oSSOTDef, Constants.AT_CENTRASITE_DESCRIPTION, colorHolder);                      // CentraSite description
        outRow_Attr(oSSOTDef, Constants.AT_CENTRASITE_ORGANIZATION, colorHolder);                     // CentraSite organization
        outRow_Attr(oSSOTDef, Constants.AT_CENTRASITE_OWNER, colorHolder);                            // CentraSite owner
        outRow_Attr(oSSOTDef, Constants.AT_CENTRASITE_VERSION, colorHolder);                          // CentraSite version
        outRow_Attr(oSSOTDef, Constants.AT_CENTRASITE_LIFECYCLE_STATE, colorHolder);                  // CentraSite life cycle state
        outRow_Attr(oSSOTDef, Constants.AT_DEPRECATED_OBJECT, colorHolder);                           // Deprecated object
        outRow_Attr(oSSOTDef, Constants.AT_CENTRASITE_SYNCHRONIZATION, colorHolder);                  // CentraSite synchronization
        outRow_Attr(oSSOTDef, Constants.AT_INPUT_MESSAGE, colorHolder);                               // Input message
        outRow_Attr(oSSOTDef, Constants.AT_OUTPUT_MESSAGE, colorHolder);                              // Output message
        outRow_Attr(oSSOTDef, Constants.AT_ERROR_MESSAGE, colorHolder);                               // Error massage
        closeTable();
    }    
}

/***********************************************************************************************************************/
/* DATA models                                                                                                         */
/***********************************************************************************************************************/

function outDataModels(oDataModels) {
    for (var i = 0; i < oDataModels.length; i++) {
        outNewPage();

        if (i == 0) {
            oOut.OutputLnF(getString("DATA"), "REPORT_HD1");
            oOut.OutputLnF("", "STD");
            oOut.OutputLnF("", "STD");
        }
        var oModel = oDataModels[i];        
        oOut.addLocalBookmark(getLink(oModel));
        oOut.OutputLnF(oModel.Name(nLoc), "REPORT_HD2");
        
        outDataObjects(oModel);
        outDAttributes(oModel);
        outRestrictions(oModel);
        outDataTypes(oModel);
    }
}

function outDataObjects(oModel) {
    var oDataObjectOccs = oModel.ObjOccListBySymbol([Constants.ST_BPMN_DATA_OBJECT]).sort(sortName);
    if (oDataObjectOccs.length == 0) return;
    
    outNewPage();
    oOut.OutputLnF(getString("DATA_OBJECT"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var oDataObjectOcc in oDataObjectOccs) {
        outDataObject(oDataObjectOcc);
    } 
}

function outDataObject(oDataObjectOcc) {
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oDataObjectOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outDataObjectAttributes();

    // Outgoing connection occurrences 
    var cxnHolder = new __holder(0);
    outCxnTarget(oDataObjectOcc, Constants.CT_CONS_OF_2, cxnHolder, null);              // consists of [ to D attribute (Solution design)] 
    closeCxnTable(cxnHolder);
     
    function outDataObjectAttributes() {
        var oDataObjectDef = oDataObjectOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);        
        outRow_Name(oDataObjectDef, colorHolder, true);                                 // Name
        outRow(getString("GUID"), oDataObjectDef.GUID(), colorHolder, true);            // GUID
        outRow_Attr(oDataObjectDef, Constants.AT_DESC, colorHolder);                    // Description
        outRow_Attr(oDataObjectDef, Constants.AT_NAMESPACE_SD, colorHolder);            // Namespace
        outRow_Attr(oDataObjectDef, Constants.AT_LAST_EXPORT_DATE_SD, colorHolder);     // Date of the last solution export 
        closeTable();
    }
}

function outDAttributes(oModel) {
    var oDAttrOccs = oModel.ObjOccListBySymbol([Constants.ST_DESC_ATTR_SD]).sort(sortName);
    if (oDAttrOccs.length == 0) return;
    
    outNewPage();
    oOut.OutputLnF(getString("D_ATTRIBUTE"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var oDAttrOcc in oDAttrOccs) {
        outDAttribute(oDAttrOcc);
    }
}

function outDAttribute(oDAttrOcc) {
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oDAttrOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outDAttrAttributes();

    // Incoming connection occurrences 
    var cxnHolder = new __holder(0);
    outCxnSource(oDAttrOcc, Constants.CT_CONS_OF_2, cxnHolder, null);                   // consists of to ( Cluster )
    outCxnSource(oDAttrOcc, Constants.CT_USES_SD, cxnHolder, null);                     // uses [ to  Restriction (Solution design)]
    closeCxnTable(cxnHolder);
    
    // Outgoing connection occurrences 
    var cxnHolder = new __holder(0);
    outCxnTarget(oDAttrOcc, Constants.CT_REFERENCES, cxnHolder, null);                  // references [to Data type (Solution design) / Restriction (Solution design)]
    closeCxnTable(cxnHolder);   
    
    function outDAttrAttributes() {
        var oDAttrDef = oDAttrOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);        
        outRow_Attr(oDAttrDef, Constants.AT_DESC, colorHolder);                         // Description
        outRow(getString("GUID"), oDAttrDef.GUID(), colorHolder, true);                 // GUID
        outRow_Attr(oDAttrDef, Constants.AT_DATA_TYPE, colorHolder);                    // Data type
        outRow_Attr(oDAttrDef, Constants.AT_LAST_EXPORT_DATE_SD, colorHolder);          // Date of last solution export 
        closeTable();
    }    
}

function outRestrictions(oModel) {
    var oRestrOccs = oModel.ObjOccListBySymbol([Constants.ST_RESTRICTION_SD]).sort(sortName);
    if (oRestrOccs.length == 0) return;
    
    outNewPage();
    oOut.OutputLnF(getString("RESTRICTION"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var oRestrOcc in oRestrOccs) {
        outRestriction(oRestrOcc);
    }
}

function outRestriction(oRestrOcc) {
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oRestrOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outRestrAttributes();

    // Outgoing connection occurrences 
    var cxnHolder = new __holder(0);
    outCxnTarget(oRestrOcc, Constants.CT_USES_SD, cxnHolder, null);                     // uses [to D attribute (Solution design) ]
    outCxnTarget(oRestrOcc, Constants.CT_IS_RESTRICTION_OF, cxnHolder, null);           // is restriction of [ to Data type (Solution design)]
    closeCxnTable(cxnHolder);   
    
    function outRestrAttributes() {
        var oRestrDef = oRestrOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);        
        outRow_Attr(oRestrDef, Constants.AT_DESC, colorHolder);                         // Description
        outRow(getString("GUID"), oRestrDef.GUID(), colorHolder, true);                 // GUID
        outRow_Attr(oRestrDef, Constants.AT_LAST_EXPORT_DATE_SD, colorHolder);          // Date of last solution export 
        closeTable();
    }    
}

function outDataTypes(oModel) {
    var oDataTypeOccs = oModel.ObjOccListBySymbol([Constants.ST_DATA_TYPE_SD]).sort(sortName);
    if (oDataTypeOccs.length == 0) return;
    
    outNewPage();
    oOut.OutputLnF(getString("DATA_TYPES"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var oDataTypeOcc in oDataTypeOccs) {
        outDataType(oDataTypeOcc);
    }
}

function outDataType(oDataTypeOcc) {
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oDataTypeOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outDataTypeAttributes();

    // Incoming connection occurrences 
    var cxnHolder = new __holder(0);
    outCxnSource(oDataTypeOcc, Constants.CT_IS_RESTRICTION_OF, cxnHolder, null);            // is restriction of [to Restriction (Solution design)]
    outCxnSource(oDataTypeOcc, Constants.CT_REFERENCES, cxnHolder, null);                   // references  [to D attribute (Solution design)]
    closeCxnTable(cxnHolder);
    
    var oDataTypeDef = oDataTypeOcc.ObjDef();

    // Incoming connection defs
    var cxnHolder = new __holder(0);
    outIncomingConnectedDefs(oDataTypeDef,  Constants.CT_IS_DESC_FOR_1, Constants.OT_ERM_ATTR, cxnHolder, true);        // is describing for [to ERM attribute]
    outIncomingConnectedDefs(oDataTypeDef,  Constants.CT_IS_PRIM_KEY_FOR_1, Constants.OT_ERM_ATTR, cxnHolder, true);    // is primary key for [to ERM attribute]
    outIncomingConnectedDefs(oDataTypeDef,  Constants.CT_IS_FRGN_KEY_FOR_1, Constants.OT_ERM_ATTR, cxnHolder, true);    // is foreign key for[to ERM attribute]
    outIncomingConnectedDefs(oDataTypeDef,  Constants.CT_HAS_REL_WITH, Constants.OT_ENT_TYPE, cxnHolder, false);        // has relationship [to Entity type]
    closeCxnTable(cxnHolder);
    
    // Outgoing connection defs
    var cxnHolder = new __holder(0);
    outOutgoingConnectedDefs(oDataTypeDef,  Constants.CT_HAS_REL_WITH, Constants.OT_ERM_ATTR, cxnHolder, false);        // has relationship [to Entity type]
    closeCxnTable(cxnHolder);
    
    function outDataTypeAttributes() {
        var oDataTypeDef = oDataTypeOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);        
        outRow_Attr(oDataTypeDef, Constants.AT_DESC, colorHolder);                      // Description
        outRow(getString("GUID"), oDataTypeDef.GUID(), colorHolder, true);              // GUID
        outRow_Attr(oDataTypeDef, Constants.AT_LAST_EXPORT_DATE_SD, colorHolder);       // Date of last solution export 
        closeTable();
    }    
}

/***********************************************************************************************************************/
/* SCREEN models                                                                                                       */
/***********************************************************************************************************************/

function outScreenModels(oScreenModels) {
    for (var i = 0; i < oScreenModels.length; i++) {
        outNewPage();
        
        var oModel = oScreenModels[i];  
        outScreenModel(oModel);
        
        outElements(oModel);
    }
}

function outScreenModel(oModel) {
    oOut.OutputLnF(getString("SCREENS"), "REPORT_HD1");
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(oModel.Name(nLoc), "REPORT_HD2");

    outModelAttributes();
    outModelGraphic(oModel);
    
    function outModelAttributes() {
        openAttrTable();      
        var colorHolder = new __holder(false);
        outRow_Name(oModel, colorHolder, true);                                         // Name
        outRow_Attr(oModel, Constants.AT_DESC, colorHolder);                            // Description
        outRow(getString("GUID"), oModel.GUID(), colorHolder, true);                    // GUID
        closeTable();
    }
}

function outElements(oModel) {
    var oElementOccs = getElementsSorted();
    if (oElementOccs.length == 0) return;
    
    outNewPage();
    oOut.OutputLnF(getString("UI_ELEMENTS"), "REPORT_HD3");
    oOut.OutputLnF("", "STD");
    
    for each(var oElementOcc in oElementOccs) {
        outElement(oElementOcc);
    }
    
    function getElementsSorted() {
        return oModel.ObjOccList().sort(sortIncomingContainsCxnsAndName);
        
        function sortIncomingContainsCxnsAndName(objOccA, objOccB) {
            var cxnCountA = getIncomingContainsCxns(objOccA).length;
            var cxnCountB = getIncomingContainsCxns(objOccB).length;
            
            var result = cxnCountA - cxnCountB;
            if (result == 0) {
                result = sortName(objOccA, objOccB);
            }
            return result;
        }
        
        function getIncomingContainsCxns(oObjOcc) {
            var oContainsCxns = new Array();
            var oCxns = oObjOcc.Cxns(Constants.EDGES_IN);
            for (var i = 0; i < oCxns.length; i++) {
                var oCxnOcc = oCxns[i];
                if (oCxnOcc.CxnDef().TypeNum() == Constants.CT_CONTAINS_2) {
                    oContainsCxns.push(oCxnOcc);
                }
            }
            return oContainsCxns;
        }        
    }
}

function outElement(oElementOcc) {
    oOut.OutputLnF("", "STD");
    if (oElementOcc.ObjDef().TypeNum() == Constants.OT_SCREEN_SD) 
        oOut.addLocalBookmark(getLink(oElementOcc.ObjDef()));
    oOut.OutputLnF(oElementOcc.ObjDef().Name(nLoc), "REPORT_HD4");
    outElementAttributes();
    
    function outElementAttributes() {
        var oElementDef = oElementOcc.ObjDef();
        openAttrTable();
        var colorHolder = new __holder(false);        
        outRow_Name(oElementDef, colorHolder, true);                                    // Name
        outRow(getString("GUID"), oElementDef.GUID(), colorHolder, true);               // GUID
        outRow_Attr(oElementDef, Constants.AT_DESC, colorHolder);                       // Description
        outRow(getString("SYMBOL"), oElementOcc.SymbolName(), colorHolder, true);       // symbol          
        closeTable();
    }
}
     

/***********************************************************************************************************************/
/* common                                                                                                              */
/***********************************************************************************************************************/

function outIncomingConnectedDefs(oObjDef,  nCxnType, nConnObjType, cxnHolder, bWithDataType) {
    outConnectedDefs(oObjDef,  nCxnType, nConnObjType, Constants.EDGES_IN, cxnHolder, bWithDataType);
}

function outOutgoingConnectedDefs(oObjDef,  nCxnType, nConnObjType, cxnHolder, bWithDataType) {
    outConnectedDefs(oObjDef,  nCxnType, nConnObjType, Constants.EDGES_OUT, cxnHolder, bWithDataType);
}

function outConnectedDefs(oObjDef,  nCxnType, nConnObjType, nDirection, cxnHolder, bWithDataType) {
    var oConnObjDefs = oObjDef.getConnectedObjs([nConnObjType], nDirection, [nCxnType]);
    if (oConnObjDefs.length == 0) return;

    var bEdgesIn = (nDirection == Constants.EDGES_IN) ? true : false;
    if (cxnHolder.value == 0) {
        oOut.OutputLnF(bEdgesIn ? getString("INCOMING_CXN_DEFS_") : getString("OUTGOING_CXN_DEFS_"), "BOLD");
        openTable();
        cxnHolder.value++;
    }
    
    outTableHead(oFilter.ActiveCxnTypeName(nCxnType), "");
    var colorHolder = new __holder(false);
    for (var i = 0; i < oConnObjDefs.length; i++) {
        var oConnObjDef = oConnObjDefs[i];

        outRow_Name(oConnObjDef, colorHolder, false);                                       // Name
        outRow_Attr_indent(oConnObjDef, Constants.AT_DESC, colorHolder);                    // Description 
        outRow_indent(getString("GUID"), oConnObjDef.GUID(), colorHolder);                  // GUID
        if (bWithDataType) {
            outRow_Attr_indent(oConnObjDef, Constants.AT_DATA_TYPE, colorHolder);           // Data type
        }
        outRow_Attr_indent(oConnObjDef, Constants.AT_LAST_EXPORT_DATE_SD, colorHolder);     // Date of last solution export 
    }
}

function outCxnSource(oObjOcc,  nCxnType, cxnHolder, fExtFunc) {
    var oInCxns = getFilteredCxns(oObjOcc.Cxns(Constants.EDGES_IN), nCxnType);
    if (oInCxns.length == 0) return;
    
    outCxnList(oInCxns, nCxnType, Constants.EDGES_IN, cxnHolder, fExtFunc, "", false/*bLink*/);
    return oInCxns;
}

function outCxnSourceBySymbol(oObjOcc, nCxnType, nSymbol, cxnHolder, fExtFunc, sHead2) {
    var oInCxns = getFilteredCxnsBySymbol(oObjOcc, nCxnType, nSymbol, Constants.EDGES_IN);
    if (oInCxns.length == 0) return;

    outCxnList(oInCxns, nCxnType, Constants.EDGES_IN, cxnHolder, fExtFunc, sHead2, false/*bLink*/);
}    
    
function outCxnTarget(oObjOcc, nCxnType, cxnHolder, fExtFunc) {
    var oOutCxns = getFilteredCxns(oObjOcc.Cxns(Constants.EDGES_OUT), nCxnType);
    if (oOutCxns.length == 0) return;
    
    outCxnList(oOutCxns, nCxnType, Constants.EDGES_OUT, cxnHolder, fExtFunc, "", false/*bLink*/);
    return oOutCxns;
}

function outCxnTargetLinked(oObjOcc, nCxnType, cxnHolder) {
    var oOutCxns = getFilteredCxns(oObjOcc.Cxns(Constants.EDGES_OUT), nCxnType);
    if (oOutCxns.length == 0) return;
    
    outCxnList(oOutCxns, nCxnType, Constants.EDGES_OUT, cxnHolder, null, "", true/*bLink*/);
}

function outCxnTargetBySymbol(oObjOcc, nCxnType, nSymbol, cxnHolder, fExtFunc, sHead2) {
    var oOutCxns = getFilteredCxnsBySymbol(oObjOcc, nCxnType, nSymbol, Constants.EDGES_OUT);
    if (oOutCxns.length == 0) return;

    outCxnList(oOutCxns, nCxnType, Constants.EDGES_OUT, cxnHolder, fExtFunc, sHead2, false/*bLink*/);
}    

function outCxnList(oCxnList, nCxnType, nDirection, cxnHolder, fExtFunc, sHead2, bLink) {
    var bEdgesIn = (nDirection == Constants.EDGES_IN) ? true : false;

    if (cxnHolder.value == 0) {
        oOut.OutputLnF(bEdgesIn ? getString("INCOMING_CXN_OCCS_") : getString("OUTGOING_CXN_OCCS_"), "BOLD");
        oOut.OutputLnF(bEdgesIn ? getString("INCOMING_CXN_INFO")  : getString("OUTGOING_CXN_INFO"), "STD");
        openTable();
        cxnHolder.value++;
    }    
    outTableHead(oFilter.ActiveCxnTypeName(nCxnType), sHead2);
    var colorHolder = new __holder(false);
    for (var i = 0; i < oCxnList.length; i++) {
        var oConnObjOcc = bEdgesIn ? oCxnList[i].SourceObjOcc() : oCxnList[i].TargetObjOcc();
        var oConnObjDef = oConnObjOcc.ObjDef();

        if (bLink) 
            outRow_NameLink(oConnObjDef, colorHolder, false);               // Name with Link
        else            
            outRow_Name(oConnObjDef, colorHolder, false);                   // Name
        outRow_indent(getString("GUID"), oConnObjDef.GUID(), colorHolder);  // GUID

        if (fExtFunc != null) {
            fExtFunc(oConnObjOcc, colorHolder);
        }
        colorHolder.value = !colorHolder.value;
    }    
}

function closeCxnTable(cxnHolder) {
    if (cxnHolder.value > 0) {
        closeTable();
    }
}

function sortName(objOccA, objOccB) {
    return StrComp(objOccA.ObjDef().Name(nLoc), objOccB.ObjDef().Name(nLoc));
}  

function sortSymbolAndName(objOccA, objOccB) {
    var result = StrComp(objOccA.SymbolName(), objOccB.SymbolName());
    if (result == 0) {
        result = sortName(objOccA, objOccB);
    }
    return result;
}

function sortTaskName(taskA, taskB) {
    return StrComp(taskA.oFadTaskOcc.ObjDef().Name(nLoc), taskB.oFadTaskOcc.ObjDef().Name(nLoc));
}

function getFilteredCxns(oCxnOccs, nCxnType) {  
    var oFilteredCxnOccs = new Array();
    for each(var oCxnOcc in oCxnOccs) {
        if (oCxnOcc.Cxn().TypeNum() == nCxnType) {
            oFilteredCxnOccs.push(oCxnOcc)
        }
    }
    return oFilteredCxnOccs;
}

function getFilteredCxnsBySymbol(oObjOcc, nCxnType, nSymbol, nDirection) {  
    var bEdgesIn = (nDirection == Constants.EDGES_IN) ? true : false;
    
    var oFilteredCxnOccs = new Array();
    var oCxnOccs = getFilteredCxns(oObjOcc.Cxns(nDirection), nCxnType);
    for (var i = 0; i  < oCxnOccs.length; i++) {
        var oCxnOcc = oCxnOccs[i];
        var oConnObjOcc = bEdgesIn ? oCxnOcc.SourceObjOcc() : oCxnOcc.TargetObjOcc();
        if (oConnObjOcc.SymbolNum() == nSymbol) {
            oFilteredCxnOccs.push(oCxnOcc);
        }
    }
    return oFilteredCxnOccs;
}

function mergeModels(oModelList1, oModelList2) {
    var oMergedList = oModelList1.concat(oModelList2);
    return ArisData.Unique(oMergedList);
}

function isDoneModel(oModel, oDoneModelList) {
    for (var i = 0; i < oDoneModelList.length; i++) {
        if (oModel.IsEqual(oDoneModelList[i])) return true;
    }
    oDoneModelList.push(oModel);
    return false;
}

function copyModelList(oModelList) {
    var oCopiedModelList = new Array(); 
    for (var i = 0; i < oModelList.length; i++) {
        oCopiedModelList.push(oModelList[i])
    }
    return oCopiedModelList;
}

function filterProcessModels(oModels) {
    return filterModels( oModels, [Constants.MT_BPMN_COLLABORATION_DIAGRAM] );
}

function filterServiceModels(oModels) {
    return filterModels( oModels, [Constants.MT_APPL_SYS_TYPE_DGM] );
}

function filterDataModels(oModels) {
    return filterModels( oModels, [Constants.MT_DOCUMENT_STRUCTURE_SD] );
}

function filterScreenModels(oModels) {
    return filterModels( oModels, [Constants.MT_SCREEN_DESIGN_SD] );
}

function filterModels(oModels, aModelTypes) {
    var oFilteredModels = new Array();

    for (var i = 0; i < oModels.length; i++) {
        var oModel = oModels[i];
        if (isInFilter(oModel)) oFilteredModels.push(oModel)
    }
    return ArisData.Unique(oFilteredModels);    

    function isInFilter(oModel) {
        for (var j = 0; j < aModelTypes.length; j++) {
            if (oModel.TypeNum() == aModelTypes[j]) return true;
        }
        return false;
    }
} 

function getTaskSymbols() {
    return [Constants.ST_BPMN_TASK,                     // Task
            Constants.ST_BPMN_MANUAL_TASK_2,            // Manual task
            Constants.ST_BPMN_USER_TASK,                // User task
            Constants.ST_BPMN_SCRIPT_TASK,              // Script task
            Constants.ST_BPMN_BUSINESS_RULE_TASK,       // Business rule task
            Constants.ST_BPMN_RECEIVE_TASK,             // Receive task
            Constants.ST_BPMN_SEND_TASK,                // Send task
            Constants.ST_BPMN_SERVICE_TASK];            // Service task
}

function getCallActivitySymbols() {    	
    return [Constants.ST_BPMN_CALL_ACTIVITY,            // Call activity
            Constants.ST_BPMN_CALL_ACTIVITY_COLLAPSED]; // Call activity (collapsed)
}

function getSubprocessSymbols() {    	
    return [Constants.ST_BPMN_SUBPROCESS,                   // Subprocess
            Constants.ST_BPMN_SUB_PROCESS_COLLAPSED,        // Subprocess (collapsed)
            Constants.ST_BPMN_ADHOC_SUBPROCESS,             // Adhoc subprocess
            Constants.ST_BPMN_ADHOC_SUBPROCESS_COLLAPSED,   // Adhoc subprocess (collapsed)
            Constants.ST_BPMN_EVENT_SUBPROCESS,             // Event subprocess
            Constants.ST_BPMN_EVENT_SUBPROCESS_COLLAPSED];  // Event subprocess (collapsed)
}

function getEventSymbols() {
    return ArisData.ActiveFilter().Symbols(Constants.MT_BPMN_COLLABORATION_DIAGRAM, Constants.OT_EVT);
}

function getGatewaySymbols() {
    return ArisData.ActiveFilter().Symbols(Constants.MT_BPMN_COLLABORATION_DIAGRAM, Constants.OT_RULE);
}

function isTask(oObjOcc) {
    return isSymbolInList(oObjOcc.SymbolNum(), getTaskSymbols());
}

function isEvent(oObjOcc) {
    return isSymbolInList(oObjOcc.SymbolNum(), getEventSymbols());
}

function isSymbolInList(nSymbolType, aSymbolTypes) {
    for (var i in aSymbolTypes) {
        if (nSymbolType == aSymbolTypes[i]) return true;
    }
    return false;
}

/**************************** Output ****************************/

function initOutput() {
    oOut.DefineF("HEAD_TOC", getString("FONT"), 16, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("HEAD2", getString("FONT"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("BOLD", getString("FONT"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("STD", getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("LINK", getString("FONT"), 10, Constants.C_BLUE, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("REPORT_HD1", getString("FONT"), 16, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_TOCENTRY0, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("REPORT_HD2", getString("FONT"), 16, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_TOCENTRY1, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("REPORT_HD3", getString("FONT"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_TOCENTRY2, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("REPORT_HD4", getString("FONT"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_TOCENTRY3, 0, 21, 0, 0, 0, 1);

    addTOC();
    setReportHeaderFooter(oOut, nLoc, false, false, false);

    function addTOC()  {
        // Output Index table
        oOut.BeginSection (false, Constants.SECTION_INDEX);
        setReportHeaderFooter(oOut, nLoc, false, false, false);
        oOut.SetAutoTOCNumbering(true);
        oOut.OutputLnF(" ","STD");
        oOut.OutputLnF(getString("TOC_HEADLINE"), "HEAD_TOC");    
        oOut.OutputLnF(" ","STD");
        oOut.OutputField(Constants.FIELD_TOC, getString("FONT"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_RIGHT);
        oOut.EndSection();
    }
}
    
function outModelGraphic(oModel) {
    oOut.OutputLnF(getString("MODEL_GRAPHIC_"), "BOLD");

    var bModelColor        = false;
    var nScaleOption       = 2;     // fit to page
    var bCutOfTheGraphic   = false;
    // most of the parameters are ignored!
    outputintoregistry(bModelColor, nScaleOption, bCutOfTheGraphic, 0, 0, 0, 0, 0, 0, 100);
    graphicout(new __holder(oOut), oModel);

    oOut.OutputLnF("", "STD");
    oOut.OutputLnF("", "STD");
}

function outNewPage() {
    if (!g_bFirstPage) 
        oOut.OutputField(Constants.FIELD_NEWPAGE, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT);
    g_bFirstPage = false;
}

function outRow_AttrIfMaint(oItem, nAttrType, colorHolder) {
    if (oItem.Attribute(nAttrType, nLoc).IsMaintained()) {
        outRow_Attr(oItem, nAttrType, colorHolder)
    }
}

function outRow_Attr(oItem, nAttrType, colorHolder) {
    var sName = oFilter.AttrTypeName(nAttrType);
    var sValue = getAttrValue(oItem, nAttrType);
    outRow(sName, sValue, colorHolder, true/*bChangeColor*/);
}

function outRow_Attr_indent(oItem, nAttrType, colorHolder) {
    var sName = oFilter.AttrTypeName(nAttrType);
    var sValue = getAttrValue(oItem, nAttrType);
    outRow_indent(sName, sValue, colorHolder);
}

function getAttrValue(oItem, nAttrType) {
    var oAttr = oItem.Attribute(nAttrType, nLoc);
    if (!oAttr.IsMaintained()) return "";
    return oAttr.getValue();
}

function outRow_BoolAttr(oItem, nAttrType, colorHolder) {
    var sName = oFilter.AttrTypeName(nAttrType);
    var sValue = getBoolAttrValue(oItem, nAttrType);
    outRow(sName, sValue, colorHolder, true/*bChangeColor*/);
    
    function getBoolAttrValue(oItem, nAttrType) {
        if (isboolattributetrue(oItem, nAttrType, nLoc)) return getString("YES");
        return getString("NO");
    }        
}

function outRow(sName, sValue, colorHolder, bChangeColor) {
    oOut.TableRow();        
    oOut.TableCell(sName, 40, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(colorHolder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOut.TableCell(sValue, 60, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(colorHolder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
    if (bChangeColor) colorHolder.value = !colorHolder.value;
}

function outRow_indent(sName, sValue, colorHolder) {
    oOut.TableRow();        
    oOut.TableCell(sName, 40, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(colorHolder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 5/*p_iIndent*/);
    oOut.TableCell(sValue, 60, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(colorHolder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}

function outRow_Name(oItem, colorHolder, bChangeColor) {
    oOut.TableRow();        
    oOut.TableCell(getString("NAME"), 40, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(colorHolder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOut.TableCell(oItem.Name(nLoc), 60, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(colorHolder.value), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
    if (bChangeColor) colorHolder.value = !colorHolder.value;
}

function outRow_NameLink(oItem, colorHolder, bChangeColor) {
    oOut.TableRow();        
    oOut.TableCell(getString("NAME"), 40, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(colorHolder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOut.TableCell("", 60, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(colorHolder.value), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOut.OutputLink(oItem.Name(nLoc), getLink(oItem));
    
    if (bChangeColor) colorHolder.value = !colorHolder.value;
}

function openAttrTable() {
    openTable();
    outTableHead(getString("ATTRIBUTES"), "");
}

function openTable() {
    oOut.OutputLnF("", "STD");
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
}

function outTableHead(sText, sText2) {
    oOut.TableRow();        
    oOut.TableCell(sText, 40, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOut.TableCell(sText2, 60, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}

function closeTable() {
    oOut.EndTable("", 100, getString("FONT"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOut.OutputLnF("", "STD");
}

function getLink(oItemOrOcc) {
    return "LINK_" + oItemOrOcc.ObjectID();
}




