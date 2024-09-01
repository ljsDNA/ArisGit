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

var gb_c_INFO_MARK_SET      = false;
var gb_c_WARNING_MARK_SET   = false;
var gb_c_ERROR_MARK_SET     = false;
var gb_DGRMS_OPEN_SET       = false;

INFO    = function(sErrors, sWarnings, sInfos, nType) {
    this.sErrors    = sErrors;
    this.sWarnings  = sWarnings;
    this.sInfos     = sInfos;
    this.nType      = nType;
}
var ERRORS = new java.lang.Integer(0);
var WARNINGS = new java.lang.Integer(1);
var INFOS = new java.lang.Integer(2);
var TYPE = new java.lang.Integer(3); 

var g_semCheckComponent = Context.getComponent("BPMNSemanticChecks");

var gn_Lang         = Context.getSelectedLanguage();
var g_oDB           = ArisData.getActiveDatabase();
var gs_Empty        = new java.lang.String("");
var gs_cEmpty       = new java.lang.String("-");
var gn_Err          = -1;

/*************************************************************************************************************************************/

function check_ModelForErrors( mapInfoMarks, aModels ){
    for(var i=0; i< aModels.length; i++){
        var bCycle = false;
        check_ManualTask( mapInfoMarks, aModels[i] );
        check_UserTask( mapInfoMarks, aModels[i] );
        var bPure_process = getBoolPropertyValueWithNull("PURE_PROCESS");
        if(bPure_process == null){
            var mode = g_oDB.Attribute(Constants.AT_M2E_SCENARIO_TYPE, gn_Lang);                           
            bPure_process = !(mode.MeasureUnitTypeNum() == Constants.AVT_M2E_SCENARIO_TYPE_WITH_SERVICES); 
        }
     
        if(!bPure_process){
            check_ServiceTask( mapInfoMarks, aModels[i] );
            check_SyncAgainstCentraSite( mapInfoMarks, aModels[i] );
        } else{
            check_ServiceTask_PureProcess( mapInfoMarks, aModels[i] );
        }
        check_AbstractTask( mapInfoMarks, aModels[i] );
        check_SpecialTaskRelations( mapInfoMarks, aModels[i] );
        check_AllOccInModel( mapInfoMarks, aModels[i] );            // contains checks against configuration, too
        check_TextAnnotations( mapInfoMarks, aModels[i] );
        check_MessageFlow( mapInfoMarks, aModels[i] );
        check_NestedLanes( mapInfoMarks, aModels[i] );
        check_CallActivitiesValid(mapInfoMarks, aModels[i]);
        check_AssignedFadModel( mapInfoMarks, aModels[i] );
        bCycle = checkTaskHierarchyCycle( mapInfoMarks, aModels[i] );
        checkTaskAssignment( mapInfoMarks, aModels[i] );

        check_Pools( mapInfoMarks, aModels[i] );
		check_wMChecks( mapInfoMarks, aModels[i] );
		check_error_handler(mapInfoMarks, aModels[i] );
		
        var aSubProcessModels   = getAssignedSubProcessModels( aModels[i] );
        if( !bCycle && aSubProcessModels.length > 0 ) { 
            check_ModelForErrors( mapInfoMarks, aSubProcessModels );
        }
    }
}

function check_Pools(mapInfoMarks, p_oModel){
    var objOccs = p_oModel.ObjOccListFilter(Constants.OT_BPMN_POOL,Constants.ST_BPMN_POOL_1);
    var database = p_oModel.Database();
    var internalPools = new Array();
    if(objOccs.length > 1) {
        for(var j=0; j<objOccs.length; j++) {
            var poolOcc = objOccs[j];
            var poolDef = poolOcc.ObjDef();
            var attribute = poolDef.Attribute(Constants.AT_EXTERNAL_POOL, database.getDbLanguage().LocaleId());
            if(attribute.IsValid()) {
				if(attribute.IsMaintained()){
					var value = attribute.getValue();
                    if(value == 0){
                        internalPools.add(poolOcc);
                    } 
                } else{
                    internalPools.add(poolOcc);
                }
            }
        }
		if(internalPools.length > 1) {
			for(var k=0; k<internalPools.length ;k++ ) {
				var pool = internalPools[k];
				setInfoMark(mapInfoMarks, pool, getString("ERR_MULTIPLE_INTERNAL_POOLS"), Constants.MODEL_INFO_ERROR);
			}   
		}                      
    }    
}


function check_error_handler(mapInfoMarks, p_oModel){
	check_error_handler_internal(mapInfoMarks, p_oModel, Constants.AT_ERROR_HANDLER, getString("ERR_MORE_THAN_ONE_ERROR_HANDLER_IN_MODEL"), getString("ERR_WRONG_SYMBOL_FOR_ERROR_HANDLER"));
    check_error_handler_internal(mapInfoMarks, p_oModel, Constants.AT_CANCELLATION_HANDLER, getString("ERR_MORE_THAN_ONE_CANCEL_HANDLER_IN_MODEL"), getString("ERR_WRONG_SYMBOL_FOR_CANCEL_HANDLER"));
    check_error_handler_internal(mapInfoMarks, p_oModel, Constants.AT_TIMEOUT_HANDLER, getString("ERR_MORE_THAN_ONE_TIMEOUT_HANDLER_IN_MODEL"), getString("ERR_WRONG_SYMBOL_FOR_TIMEOUT_HANDLER"));

    function check_error_handler_internal(mapInfoMarks, p_oModel, attrTypeNr, errorMessage,wrongSymbolErrorMessage){
		var types = new Array();
		types.add(Constants.OT_FUNC);
		var objDefTasks = p_oModel.ObjDefListByTypes(types);
		var database = p_oModel.Database();
		var tasks = new Array();
		if(objDefTasks.length > 1){
			for(var j=0; j<objDefTasks.length; j++){
				var task = objDefTasks[j];
				var attribute = task.Attribute(attrTypeNr, database.getDbLanguage().LocaleId());
				if(attribute.IsValid()){
					if(attribute.IsMaintained()){
						var value = attribute.getValue();
						if(value != 0){
							tasks.add(task);
                            var occs  = task.OccList(new Array(p_oModel));
                            for(var l = 0; l < occs.length; l++ ){
                                var occ = occs[l];
                                if(occ.SymbolNum() == Constants.ST_BPMN_RECEIVE_TASK 
                                || occ.SymbolNum() == Constants.ST_BPMN_CALL_ACTIVITY 
                                || occ.SymbolNum() == Constants.ST_BPMN_CALL_ACTIVITY_COLLAPSED
                                || occ.SymbolNum() == Constants.ST_BPMN_EVENT_SUBPROCESS
                                || occ.SymbolNum() == Constants.ST_BPMN_EVENT_SUBPROCESS
                                || occ.SymbolNum() == Constants.ST_BPMN_SUB_PROCESS_COLLAPSED
                                || occ.SymbolNum() == Constants.ST_BPMN_SUBPROCESS){
                                    setInfoMark(mapInfoMarks, occ, wrongSymbolErrorMessage, Constants.MODEL_INFO_ERROR);    
                                }
                            }
						} 
					}
				}
			}
			var model = new Array();
			model.add(p_oModel);
			if(tasks.length > 1){
				for(var k=0; k<tasks.length ;k++ ){
					var task = tasks[k];
					var occs = task.OccList(model);
					for(var i =0; i < occs.length; i++){
						setInfoMark(mapInfoMarks, occs[i], errorMessage, Constants.MODEL_INFO_ERROR);
					}
				}   
			}                      
		}    
    }
}


function check_CallActivitiesValid(mapInfoMarks, p_oModel){
    var callActivities = getCallActivitiesInModel(p_oModel)
    var database = p_oModel.Database();
    for(var j=0; j<callActivities.length; j++){ 
        var callActivity =callActivities[j];
        var callActivityObjDef = callActivity.ObjDef();
        var attribute =callActivityObjDef.Attribute(Constants.AT_BPMN_CALLED_ELEMENT, database.getDbLanguage().LocaleId());
        if(attribute.IsValid() && attribute.IsMaintained()){
            var value = attribute.MeasureUnitTypeNum();
            if(Constants.AVT_BPMN_GLOBAL_PROCESS == value){
                var assignedModels = callActivityObjDef.AssignedModels(Constants.MT_BPMN_COLLABORATION_DIAGRAM);
                if(assignedModels == null || assignedModels.length == 0){
                    setInfoMark(mapInfoMarks, callActivity, getString("ERR_CALL_ACTIVITY_ASSIGMENT"), Constants.MODEL_INFO_ERROR);
                }
            } 
        }
    }     
}

function getAssignedSubProcessModels(p_oModel) {
    var aOccs   = getSubprocessesInModel(p_oModel);
    //aOccs = aOccs.concat(getCallActivitiesInModel(p_oModel));//ARHI: Recursion must also include assignments of call activities
    //ARHI: As call activities are only referenced, the recursion isn't needed anymore
    var aAssignedModels = new Array();
    for(var i=0; i<aOccs.length; i++){
        if ( !isNotAllowedSymbolWithAttribute( aOccs[i] ) ) {
            aAssignedModels = aAssignedModels.concat( aOccs[i].ObjDef().AssignedModels( [Constants.MT_BPMN_COLLABORATION_DIAGRAM, Constants.MT_BPMN_PROCESS_DIAGRAM] ) );
        }
    }
    aAssignedModels.clearDuplicities();
    return aAssignedModels;
}

function check_ManualTask(mapInfoMarks, oModel) {
    var oManualTaskOccs = getManualTasksInModel(oModel);
    for (var i = 0; i < oManualTaskOccs.length; i++) {
        var oManualTaskOcc      = oManualTaskOccs[i];
        
        // Manual Task is carried out by organizational element
        var oCxns2OrgElements   = getCxns2OrgElements(oManualTaskOcc);  
        var oCxns2SSTs          = getCxns2SSTs(oManualTaskOcc);  
        var oCxns2SSOTs         = getCxns2SSOTs(oManualTaskOcc);  
        var oCxns2Screens       = getCxns2Screens(oManualTaskOcc);  
        
        if (!(oCxns2OrgElements.length == 1 &&
              oCxns2SSTs.length == 0 && 
              oCxns2SSOTs.length == 0 &&
              oCxns2Screens.length == 0)) {                
            setInfoMark(mapInfoMarks, oManualTaskOcc, getString("WRG_MANUAL_TASK"), Constants.MODEL_INFO_WARNING);
        }
    }
}

function check_UserTask(mapInfoMarks, oModel) {
    var oUserTaskOccs = getUserTasksInModel(oModel);
    for (var i = 0; i < oUserTaskOccs.length; i++) {
        var oUserTaskOcc        = oUserTaskOccs[i];
        
        // User Task may have neither relations to services nor relations to organizational elements
        var oCxns2OrgElements   = getCxns2OrgElements(oUserTaskOcc);  
        var oCxns2SSTs          = getCxns2SSTs(oUserTaskOcc);  
        var oCxns2SSOTs         = getCxns2SSOTs(oUserTaskOcc);  
        
        if (!(oCxns2OrgElements.length <= 1 &&
              oCxns2SSTs.length == 0 &&
              oCxns2SSOTs.length == 0)) {                      
            setInfoMark(mapInfoMarks, oUserTaskOcc, getString("WRG_USER_TASK"), Constants.MODEL_INFO_WARNING);
        }
    }
}

function check_ServiceTask(mapInfoMarks, oModel) {
    var oServiceTaskOccs = getServiceTasksInModel(oModel);
    for (var i = 0; i < oServiceTaskOccs.length; i++) {
        var oServiceTaskOcc     = oServiceTaskOccs[i];
        
        // Service task is supported by software service type and software service operation type
        var oCxns2SSTs          = getCxns2SSTs(oServiceTaskOcc);  
        var oCxns2SSOTs         = getCxns2SSOTs(oServiceTaskOcc);  
        var oCxns2OrgElements   = getCxns2OrgElements(oServiceTaskOcc);  
        var oCxns2Screens       = getCxns2Screens(oServiceTaskOcc);                
        
        if (checkISService(oCxns2SSTs)){
            if (!(oCxns2SSTs.length == 1 &&
                  oCxns2SSOTs.length == 0 &&
                  oCxns2OrgElements.length == 0 &&
                  oCxns2Screens.length == 0)) {                                  
                setInfoMark(mapInfoMarks, oServiceTaskOcc, getString(getString("WRG_IS_SERVICE_TASK")), Constants.MODEL_INFO_WARNING);
            }
        } else {    
            if (!(oCxns2SSTs.length == 1 &&
                  oCxns2SSOTs.length == 1 &&
                  oCxns2OrgElements.length == 0 &&
                  oCxns2Screens.length == 0)) {                                  
                setInfoMark(mapInfoMarks, oServiceTaskOcc, getString("WRG_SERVICE_TASK"), Constants.MODEL_INFO_WARNING);
            } 
            if (oCxns2SSTs.length == 1 && oCxns2SSOTs.length == 1) {
                if (!checkSSOT2SST_Relation(oCxns2SSOTs,oCxns2SSTs)) {
                    setInfoMark(mapInfoMarks, oServiceTaskOcc, getString("ERR_SST_SSOT_NOT_RELATED"), Constants.MODEL_INFO_ERROR);
                } 
            }
        }    
    }
}

/**
* check if no services are connected in pure process scenario 
*/
function check_ServiceTask_PureProcess(mapInfoMarks, oModel) {
    var oServiceTaskOccs = getServiceTasksInModel(oModel);
    for (var i = 0; i < oServiceTaskOccs.length; i++) {
        var oServiceTaskOcc     = oServiceTaskOccs[i];
        // Service task is supported by software service type and software service operation type
        var oCxns2SSTs          = getCxns2SSTs(oServiceTaskOcc);            
        
        if (checkISService(oCxns2SSTs) || oCxns2SSTs.length > 0){                                     
                setInfoMark(mapInfoMarks, oServiceTaskOcc, getString("ERR_SERVICE_IN_SIMPLE_SCENARIO"), Constants.MODEL_INFO_ERROR);    
        } 
    }
}



function checkISService(oCxns2SSTs){    
    if (oCxns2SSTs.length==0) return false;
    var oSST = oCxns2SSTs[0].SourceObjDef();
    var oAttr =  oSST.Attribute(Constants.AT_SERVICE_TYPE, gn_Lang);
    if (oAttr!=null && oAttr.MeasureUnitTypeNum() == Constants.AVT_IS_SERVICE) return true;
    return false;
}
function checkSSOT2SST_Relation(oCxns2SSOTs,oCxns2SSTs){
    var oSSOT = oCxns2SSOTs[0].SourceObjDef();
    var oSST = oCxns2SSTs[0].SourceObjDef();
    var oSSTx = oSSOT.getConnectedObjs([Constants.OT_APPL_SYS_TYPE],Constants.EDGES_IN,[Constants.CT_CAN_SUBS_2]);
    return checkSSOT2SST_Relation2(oSSOT,oSST, []);
}
function checkSSOT2SST_Relation2(p_oSSOT,p_oSST, p_aVisited){    
    var oSSTx = p_oSSOT.getConnectedObjs([Constants.OT_APPL_SYS_TYPE],Constants.EDGES_IN,[Constants.CT_CAN_SUBS_2]);
    for (var i = 0; i < oSSTx.length; i++){
        var oObj = oSSTx[i];
        if (oObj.equals(p_oSST)) return true;
    }
    for (var i = 0; i < oSSTx.length; i++){
        var oObj = oSSTx[i];
        if (p_aVisited.indexOf(oObj)>=0) continue;
        p_aVisited.push(oObj);
        if (checkSSOT2SST_Relation2(oObj,p_oSST,p_aVisited)) return true
    }
    return false
}

function check_AbstractTask(mapInfoMarks, oModel) {
    var oAbstractTaskOccs = getAbstractTasksInModel(oModel);
    for (var i = 0; i < oAbstractTaskOccs.length; i++) {
        var oAbstractTaskOcc    = oAbstractTaskOccs[i];
        
        // Abstract task should be replaced by symbol manual task, user task or service task
        setInfoMark(mapInfoMarks, oAbstractTaskOcc, getString("WRG_ABSTRACT_TASK"), Constants.MODEL_INFO_WARNING);
        
        // Abstract task may neither be carried out by an organizational element nor be supported by a software service type or  a software service operation type
        if (!TaskHasNoRelations(oAbstractTaskOcc)) {                      
            setInfoMark(mapInfoMarks, oAbstractTaskOcc, getString("WRG_ABSTRACT_TASK_2"), Constants.MODEL_INFO_WARNING);
        }
    }
}

function check_SpecialTaskRelations(mapInfoMarks, oModel) {
    var oCallActivityOccs = getCallActivitiesInModel(oModel);         // Call Activities
    var oTaskOccs = oCallActivityOccs.concat(getSubprocessesInModel(oModel));   // Subprocesses

    for (var i = 0; i < oTaskOccs.length; i++) {
        var oTaskOcc = oTaskOccs[i];
        
        if (!TaskHasNoRelations(oTaskOcc)) {
            setInfoMark(mapInfoMarks, oTaskOcc, getString("ERR_WRONG_TASK_RELATIONS"), Constants.MODEL_INFO_ERROR);
        }
    }
    for (var i = 0; i < oCallActivityOccs.length; i++) {
        var oCallActivityOcc = oCallActivityOccs[i];
        
        if (CalledProcNotShared(oCallActivityOcc)) {
            setInfoMark(mapInfoMarks, oCallActivityOcc, getString(getString("WRG_CALLED_PROC_NOT_SHARED")), Constants.MODEL_INFO_WARNING);
        }
    }
}

function CalledProcNotShared(oCallActivityOcc){
    var aIntegrStatesShared = [/***Transformed*/Constants.AVT_INTEGR_STATUS_TRANSFORMED,/***Transformed from business process*/Constants.AVT_INTEGR_STATUS_TRANSFORMED_FROM_BUSIN_PROC,
                               /***Ready for access by IT*/Constants.AVT_INTEGR_STATUS_READY_FOR_ACCESS_BY_IT,/***In development*/Constants.AVT_INTEGR_STATUS_IN_DEVELOPMENT,
                               /***Ready for import*/Constants.AVT_INTEGR_STATUS_READY_FOR_IMPORT,/***Implemented*/Constants.AVT_INTEGR_STATUS_IMPLEMENTED,
                               /***Revised*/Constants.AVT_INTEGR_STATUS_REVISED,/***Import to be reviewed*/Constants.AVT_INTEGR_STATUS_IMPORT_TO_BE_REVIEWED,
                               /***Imported*/Constants.AVT_INTEGR_STATUS_IMPORTED,/***Aborted*/Constants.AVT_INTEGR_STATUS_ABORTED,
                               /***Business process under review*/Constants.AVT_INTEGR_STATUS_BUSINESS_PROCESS_UNDER_REVIEW,/***Implementation finished*/Constants.AVT_INTEGR_STATUS_IMPLEMENTATION_FINISHED,
                               /***Process update requested*/Constants.AVT_INTEGR_STATUS_PROCESS_UPDATE_REQUESTED,/***Process updated*/Constants.AVT_INTEGR_STATUS_PROCESS_UPDATED,
                               /***Review requested*/Constants.AVT_INTEGR_STATUS_REVIEW_REQUESTED,/***Update by IT*/Constants.AVT_INTEGR_STATUS_UPDATE_BY_IT]
    var aAssignedColl = oCallActivityOcc.ObjDef().AssignedModels(Constants.MT_BPMN_COLLABORATION_DIAGRAM);
    if (aAssignedColl.length == 0) return false;    
    var oAttr = aAssignedColl[0].Attribute(Constants.AT_INTEGR_STATUS, gn_Lang);
    if (oAttr.IsValid() && oAttr.IsMaintained()) {
        return aIntegrStatesShared.indexOf(oAttr.MeasureUnitTypeNum()) == 0; 
    } else return true;  
}    
function TaskHasNoRelations(oTaskOcc) {
    var oCxns2OrgElements   = getCxns2OrgElements(oTaskOcc);  
    var oCxns2SSTs          = getCxns2SSTs(oTaskOcc);  
    var oCxns2SSOTs         = getCxns2SSOTs(oTaskOcc);  
    var oCxns2Screens       = getCxns2Screens(oTaskOcc);  
    
    return (oCxns2OrgElements.length == 0 &&
            oCxns2SSTs.length == 0 && 
            oCxns2SSOTs.length == 0 &&
            oCxns2Screens.length == 0);
}

function check_AllOccInModel( mapInfoMarks, oModel ){
    var setAllowedObjs = getAllowedObjListInConfig();
    var setAllowedCxnDefs = getAllowedCxnDefListInConfig();
    var mapAllowedSymbols = getAllowedSymbolListInConfig();
    var mapAllowedCxns = getAllowedCxnListInConfig();
    var mapAllowedObjAss = getAllowedObjAssListInConfig();
    
    var aOccs   = oModel.ObjOccList();
    var aRefOT  = [Constants.OT_FUNC, Constants.OT_EVT, Constants.OT_RULE];
    for(var i=0; i<aOccs.length; i++){
        check_NotAllowedSymbols( mapInfoMarks, oModel, aOccs[i], mapAllowedSymbols );
        check_NestedInLane( mapInfoMarks, oModel, aOccs[i] );

        check_NotSupportedObj( mapInfoMarks, oModel, aOccs[i], setAllowedObjs );
        check_NotSupportedCxn( mapInfoMarks, oModel, aOccs[i], setAllowedObjs );
        check_NotSupportedObjAss( mapInfoMarks, oModel, aOccs[i], setAllowedObjs );
    }

    function check_NotSupportedObj(p_mapInfoMarks, p_oModel, p_oOcc) {
        // Not supported object type which cause a warning
        var objTypeNum = p_oOcc.ObjDef().TypeNum();
        if (!isAllowedItemInConfig(setAllowedObjs, objTypeNum)) {
            setInfoMark( p_mapInfoMarks, p_oOcc, getString("WRG_NOT_SUPPORTED_OBJ"), Constants.MODEL_INFO_WARNING);
        }
    }

    function check_NotSupportedCxn(p_mapInfoMarks, p_oModel, p_oOcc) {
        var aOutCxnOccs = p_oOcc.Cxns(Constants.EDGES_OUT);
        for (var j = 0; j < aOutCxnOccs.length; j++) {
            var oCxnOcc = aOutCxnOccs[j];
            // Not supported Cxn def type which cause a warning
            var cxnTypeNum = oCxnOcc.Cxn().TypeNum();
            if (!isAllowedItemInConfig(setAllowedCxnDefs, cxnTypeNum)) {
                setInfoMark( p_mapInfoMarks, oCxnOcc, getString("WRG_NOT_SUPPORTED_CXNDEF"), Constants.MODEL_INFO_WARNING);
            }
            // Not supported Cxn type which cause a warning
            var orgModelTypeNum = p_oModel.OrgModelTypeNum();
            var cxnTypeNum = oCxnOcc.Cxn().TypeNum();
            var orgSrcSymbolNum =  oCxnOcc.SourceObjOcc().OrgSymbolNum();
            var orgTrgSymbolNum =  oCxnOcc.TargetObjOcc().OrgSymbolNum();
            if (!isAllowedCxnInConfig(mapAllowedCxns, orgModelTypeNum, cxnTypeNum, orgSrcSymbolNum, orgTrgSymbolNum)) {            
                setInfoMark( p_mapInfoMarks, oCxnOcc, getString("WRG_NOT_SUPPORTED_CXN"), Constants.MODEL_INFO_WARNING);
            }
        }
    }

    function check_NotSupportedObjAss(p_mapInfoMarks, p_oModel, p_oOcc) {
        var aAssignedModels = p_oOcc.ObjDef().AssignedModels();
        for (var j = 0; j < aAssignedModels.length; j++) {
            var oAssignedModel = aAssignedModels[j];
            // Not supported assigned model type which cause a warning
            var objTypeNum = p_oOcc.ObjDef().TypeNum();
            var orgModelTypeNum = oAssignedModel.OrgModelTypeNum();
            if (!isAllowedObjAssInConfig(mapAllowedObjAss, objTypeNum, orgModelTypeNum)) {
                var sText = formatstring1(getString("WRG_NOT_SUPPORTED_OBJASS"), oAssignedModel.Type());
                setInfoMark( p_mapInfoMarks, p_oOcc, sText, Constants.MODEL_INFO_WARNING);
            }
        }
    }
    
    function check_NotAllowedSymbols( p_mapInfoMarks, p_oModel, p_oOcc, p_mapAllowedSymbols ){
        // Not allowed symbols which cause an error
        if( isNotAllowedSymbol( p_oOcc )  ||                // Not allowed symbols (generally)
            isNotAllowedSymbolWithAttribute( p_oOcc ) ||    // Not allowed symbols with attribute
            isNotAllowedSymbolWithCxn( p_oOcc ) ) {         // Not allowed symbols with/without relationships
                
                setInfoMark( p_mapInfoMarks, p_oOcc, getString("ERR_NOT_ALLOWED_SYMBOLS"), Constants.MODEL_INFO_ERROR);
        } else {
            // Not supported symbols which cause a warning
            if ( isNotSupportedSymbol(p_oModel, p_oOcc, p_mapAllowedSymbols) ) {
                setInfoMark( p_mapInfoMarks, p_oOcc, getString("WRG_NOT_SUPPORTED_SYMBOLS"), Constants.MODEL_INFO_WARNING);
            }
        }
            
        function isNotAllowedSymbol( p_Occ ) {
            var notAllowedSymbols = [];        
            if (notAllowedSymbols.contains(p_Occ.OrgSymbolNum())) return true;
            return false;
        }
        
        function isNotAllowedSymbolWithCxn( p_Occ ){
            if( p_Occ.OrgSymbolNum() == Constants.ST_BPMN_TIMER_INTERMEDIATE_EVENT/*Timer intermediate event*/) {
                
                if (getTriggerCxns(p_Occ).length == 0) return true; // doesn't having a can be triggered by relationship towards a function
            } 
            /*if( p_Occ.OrgSymbolNum() == Constants.ST_BPMN_MESSAGE_INTERMEDIATE_CATCH) {
                
                if (getTriggerCxns(p_Occ).length != 0) return true; // having a can be trigger by relationship towards a function
            }*/
            return false;
            
            function getTriggerCxns(p_Occ) {
                var oTriggerCxns = new Array();
                var oCxns = p_Occ.InEdges(Constants.EDGES_ALL);
                for (var i = 0; i < oCxns.length; i++) {
                    var oCxn = oCxns[i];
                    if (oCxn.Cxn().TypeNum() == Constants.CT_BPMN_CAN_TRIGGER) oTriggerCxns.push(oCxn);
                }
                return oTriggerCxns;
            }
        }
        
        function isNotSupportedSymbol(p_oModel, p_oOcc, p_mapAllowedSymbols) {
            var orgModelTypeNum = p_oModel.OrgModelTypeNum();
            var orgSymbolNum =  p_oOcc.OrgSymbolNum();
            return (!isAllowedSymbolInConfig(p_mapAllowedSymbols, orgModelTypeNum, orgSymbolNum));
        }  
    }

    function check_NestedInLane( p_mapInfoMarks, p_oModel, p_oOcc ){
        // Tasks, gateways and events must be embedded in lane
        if (p_oModel.TypeNum() == Constants.MT_BPMN_PROCESS_DIAGRAM) return; // Check is not relevant for BPMN process diagrams
        if (isAttached(p_oOcc)) return; // UC: "... which is not attached to a function (Function CT_BPMN_CAN_TRIGGER event),..."  
        
        if( aRefOT.contains(p_oOcc.ObjDef().TypeNum()) == true ){
            var aCxns   = p_oOcc.CxnOccList();
            for(var j=0; j<aCxns.length; j++){
                if (aCxns[j].Cxn().TypeNum() == Constants.CT_BELONGS_TO_1){
                    var srcOcc  = aCxns[j].SourceObjOcc();
                    var trgOcc  = aCxns[j].TargetObjOcc();
                    if( p_oOcc.equals( srcOcc ) == false ){
                        if (isPool( trgOcc)) { 
                            nLine++; 
                            return;
                        }
                    }
                    if (isLane( trgOcc )) return; 
                    if (isEmbbededOcc(trgOcc)) return;    
                }    
            }
            setInfoMark( mapInfoMarks, p_oOcc, getString("ERR_TASK_GATEWAY_EVENT_NESTED"), Constants.MODEL_INFO_ERROR);
        }
                
        function isEmbbededOcc(p_oOcc) {
            if (p_oOcc.ObjDef().TypeNum() == Constants.OT_FUNC) return true;
            return false;
        }      
        function isAttached(p_oOcc) {
            if (p_oOcc.ObjDef().TypeNum() == Constants.OT_EVT) {
                var aInCxns = p_oOcc.InEdges(Constants.EDGES_ALL);
                for(var i=0; i<aInCxns.length; i++){
                    var aInCxnDef = aInCxns[i].Cxn();
                    if (aInCxnDef.TypeNum() == Constants.CT_BPMN_CAN_TRIGGER && aInCxnDef.SourceObjDef().TypeNum() == Constants.OT_FUNC) return true; 
                }
            }
            return false;
        }
    }
}

function isNotAllowedSymbolWithAttribute( p_Occ ){
    if ((p_Occ.OrgSymbolNum() == Constants.ST_BPMN_SUBPROCESS/*Subprocess*/) || 
    (p_Occ.OrgSymbolNum() == Constants.ST_BPMN_SUB_PROCESS_COLLAPSED/*Subprocess (collapsed)*/) ){
        
        var oAttr = p_Occ.ObjDef().Attribute(Constants.AT_BPMN_SUBPROCESS_TYPE, gn_Lang);
        if (oAttr.IsMaintained() && oAttr.MeasureUnitTypeNum() == Constants.AVT_BPMN_ADHOC_SUB_PROCESS)  return true;
    }
    return false;
}

function check_TextAnnotations( mapInfoMarks, oModel ){
    // Text annotations are only allowed for task, event subprocess and gateway 
    var aRef        = [Constants.OT_FUNC, Constants.OT_EVT, Constants.OT_RULE];
    var aTxtAnots   = oModel.ObjOccListBySymbol(getSymbolsIncludingUserDefined(Constants.ST_BPMN_ANNOTATION_1));
    for(var i=0; i<aTxtAnots.length; i++){
        var aCxns   = aTxtAnots[i].CxnOccList();
        for(var j=0; j<aCxns.length; j++){
            var srcOcc  = aCxns[j].SourceObjOcc();
            var trgOcc  = aCxns[j].TargetObjOcc();
            if( aTxtAnots[i].equals( srcOcc ) == false ){
                var oTmp    = srcOcc;
                srcOcc      = trgOcc;
                trgOcc      = oTmp;
            }
            if( (aRef.contains( trgOcc.ObjDef().TypeNum() ) == false) || (aCxns[j].CxnDef().TypeNum() != Constants.CT_BPMN_IS_ASSOCIATED) ){
                setInfoMark( mapInfoMarks, aTxtAnots[i], getString("ERR_TXT_ANNOTATIONS"), Constants.MODEL_INFO_ERROR);
            }
        }
    }
}

function check_MessageFlow( mapInfoMarks, oModel ){
    // Message flow is only allowed between task, subprocess and events
    var aRef    = [Constants.OT_FUNC, Constants.OT_EVT];
    var aCxns   = oModel.CxnOccListFilter( Constants.CT_BPMN_MESSAGE_FLOW );
    for(var j=0; j<aCxns.length; j++){
        var srcOcc  = aCxns[j].SourceObjOcc();
        var trgOcc  = aCxns[j].TargetObjOcc();
        if( (aRef.contains(srcOcc.ObjDef().TypeNum()) == false) || (aRef.contains(trgOcc.ObjDef().TypeNum()) == false) ){
            setInfoMark( mapInfoMarks, aCxns[j], getString("ERR_MESSAGE_FLOW"), Constants.MODEL_INFO_ERROR);
        }
        if( srcOcc.SymbolNum() == Constants.ST_BPMN_SUBPROCESS  || trgOcc.SymbolNum() == Constants.ST_BPMN_SUBPROCESS   ){
            setInfoMark( mapInfoMarks, aCxns[j], getString("ERR_MESSAGE_FLOW_SUB_PROCESS"), Constants.MODEL_INFO_ERROR);
        }
    }
}

function check_NestedLanes( mapInfoMarks, oModel ){
    // Nested lanes are not allowed
    var aLanes  = oModel.ObjOccListFilter( Constants.OT_BPMN_LANE );
    for(var i=0; i<aLanes.length; i++){
        if( isLane( aLanes[i] ) == true ){
            var aCxns   = aLanes[i].CxnOccList();
            var nPool   = 0;
            for(var j=0; j<aCxns.length; j++){
                var srcOcc  = aCxns[j].SourceObjOcc();
                var trgOcc  = aCxns[j].TargetObjOcc();
                if( aLanes[i].equals( srcOcc ) == false ){
                    var oTmp    = srcOcc;
                    srcOcc      = trgOcc;
                    trgOcc      = oTmp;
                }
                // Nested lanes are not allowed
                if( isLane( trgOcc ) == true ){
                    setInfoMark( mapInfoMarks, trgOcc, getString("ERR_NESTED_LANES"), Constants.MODEL_INFO_ERROR);
                }
                if( trgOcc.ObjDef().TypeNum() == Constants.OT_BPMN_POOL ) { nPool++; }
            }
            
            // Lanes must be embedded in pool
            if( nPool < 1 ){
                setInfoMark( mapInfoMarks, aLanes[i], getString("ERR_NESTED_LANE_IN_POOL"), Constants.MODEL_INFO_ERROR);
            }
        }
    }
}

function check_SyncAgainstCentraSite(mapInfoMarks, oModel) {
    // Synchronisation against CentraSite
    var wMComp = Context.getComponent("webMethodsIntegration");
    
    var oServiceTaskOccs = getServiceTasksInModel(oModel);
    
    for (var i = 0; i < oServiceTaskOccs.length; i++) {
        var oTaskOcc = oServiceTaskOccs[i];
        
        var oServiceDefs = getConnectedServices(oTaskOcc);
        for (var j = 0; j < oServiceDefs.length; j++) {
            var oServiceDef = oServiceDefs[j];
            var result = wMComp.isManagedByCentraSite(oServiceDef);
            if (result == 0) {
                // Service is not synchronized against CentraSite (= 0)
                var oServiceOccs = oServiceDef.OccList();
                for (var k = 0; k < oServiceOccs.length; k++) {
                    setInfoMark( mapInfoMarks, oServiceOccs[k], getString("ERR_SYNC_AGAINST_CS"), Constants.MODEL_INFO_ERROR);
                }
            }
            if (result == 2) {
                // Service is currently in the worklist (= 2)
                var oServiceOccs = oServiceDef.OccList();
                for (var k = 0; k < oServiceOccs.length; k++) {
                    setInfoMark( mapInfoMarks, oServiceOccs[k], getString("ERR_SYNC_AGAINST_CS_2"), Constants.MODEL_INFO_ERROR);
                }
            }
        }
    }

    function getConnectedServices(oTaskOcc) {
        var oServiceDefs = new Array();
        
        var oCxns2SSTs = getCxns2SSTs(oTaskOcc);
        for (var i = 0; i < oCxns2SSTs.length; i++) {
            oServiceDefs.push(getConnectedService(oCxns2SSTs[i], oTaskOcc));
        }
        
        var oCxns2SSOTs = getCxns2SSOTs(oTaskOcc);
        for (var i = 0; i < oCxns2SSOTs.length; i++) {
            oServiceDefs.push(getConnectedService(oCxns2SSOTs[i], oTaskOcc));
        }
        return oServiceDefs;
        
        function getConnectedService(oCxn, oTaskOcc) {
            if (oTaskOcc.ObjDef().IsEqual(oCxn.SourceObjDef())) {
                return oCxn.TargetObjDef();
            }
            return oCxn.SourceObjDef();
        }
    }
}

function check_Uniqueness(mapInfoMarks, aModels) {
    var aRefOT  = [Constants.OT_FUNC, Constants.OT_EVT, Constants.OT_RULE, Constants.OT_BPMN_LANE, Constants.OT_BPMN_POOL];

    for (var i = 0; i < aModels.length; i++) {
        var oSelModel = aModels[i];
        if (oSelModel.TypeNum() != Constants.MT_BPMN_COLLABORATION_DIAGRAM) continue;
        
        var aModelList = new Array();
        getRelevantAssignments(oSelModel, aModelList);
        
        for (var j = 0; j < aModelList.length; j++) {
            var oModel = aModelList[j];
            // check whether occurences in models are unique
            var oObjOccs = oModel.ObjOccList();
            for (var k = 0; k < oObjOccs.length; k++) {
                var oObjOcc = oObjOccs[k];
                
                if (aRefOT.contains(oObjOcc.ObjDef().TypeNum())) {
                    var oFurtherOccs = getFurtherOccs(oObjOcc, aModelList);
                    if (oFurtherOccs.length > 0) {
                        var sText = getString("ERR_NOT_UNIQUE_OBJECT") + getAdditionalText(oFurtherOccs);
                        setInfoMark(mapInfoMarks, oObjOcc, sText, Constants.MODEL_INFO_ERROR);
                    }
                }
            } 
            
            // check whether assignments of process models are unique
            if (oModel.TypeNum() != Constants.MT_BPMN_PROCESS_DIAGRAM) continue;
            var aOccsWithAssignment = getOccsWithAssignment(oModel, aModelList);
            if (aOccsWithAssignment == null) continue;
            
            for (var k = 0; k < aOccsWithAssignment.length; k++) {
                var oObjOcc = aOccsWithAssignment[k];
                var sText = formatstring1(getString("ERR_NOT_UNIQUE_ASSIGNMENT"), oModel.Name(gn_Lang)) + getAdditionalText2(oObjOcc, aOccsWithAssignment);
                setInfoMark(mapInfoMarks, oObjOcc, sText, Constants.MODEL_INFO_ERROR);
            }     
        }
    }
    
    function getRelevantAssignments(oModel, aModelList) {
        if (isItemInList(oModel, aModelList)) return;
        
        aModelList.push(oModel);
        var oFuncDefs = oModel.ObjDefListFilter(Constants.OT_FUNC);
        for (var i = 0; i < oFuncDefs.length; i++) {
            var oFuncDef = oFuncDefs[i];
            var oAssignedModels = oFuncDef.AssignedModels([Constants.MT_BPMN_COLLABORATION_DIAGRAM, Constants.MT_BPMN_PROCESS_DIAGRAM]);
            
            for (var j = 0; j < oAssignedModels.length; j++) {
                getRelevantAssignments(oAssignedModels[j], aModelList);
            }
        }
    }
    
    function getFurtherOccs(oObjOcc, aModelList) {
        var oFurtherOccs = new Array();

        for (var i = 0; i < aModelList.length; i++) {
            var oModel = aModelList[i];

            var oOccList = oObjOcc.ObjDef().OccListInModel(oModel);
            for (var j = 0; j < oOccList.length; j++) {
                var oCurrOcc = oOccList[j];
                if (!oCurrOcc.IsEqual(oObjOcc)) oFurtherOccs.push(oCurrOcc);
            }
        }
        return oFurtherOccs;
    }    
    
    function getOccsWithAssignment(p_oModel, aModelList) {
        var bNumberOfAssignments = 0;
        var oOccsWithAssignment = new Array();

        var superiorObjDefs = p_oModel.SuperiorObjDefs();
        if (superiorObjDefs.length > 1) {
            
            for (var i = 0; i < superiorObjDefs.length; i++) {
                var superiorObjDef = superiorObjDefs[i];

                for (var j = 0; j < aModelList.length; j++) {
                    var oModel = aModelList[j];
                    var oFuncDefList = oModel.ObjDefListFilter(Constants.OT_FUNC);

                    if (isItemInList(superiorObjDef, oFuncDefList)) {
                        bNumberOfAssignments++;
                        oOccsWithAssignment = oOccsWithAssignment.concat(superiorObjDef.OccListInModel(oModel));
                    }
                }
            }
        }
        if (bNumberOfAssignments > 1) return oOccsWithAssignment;
        return null;
    }    
    
    function getAdditionalText(oFurtherOccs) {
        var oModels = new Array();
        for (var i = 0; i < oFurtherOccs.length; i++) {
            oModels.push(oFurtherOccs[i].Model())
        }
        oModels = ArisData.Unique(oModels);
        oModels = ArisData.sort(oModels, Constants.AT_NAME, gn_Lang);
        
        var sText = "<ul>";
        for (var i = 0; i < oModels.length; i++) {
            sText += "<li>" + oModels[i].Name(gn_Lang) + "</li>";                
        }
        sText += "</ul>";
        return sText;
    }       

    function getAdditionalText2(oCurrOcc, oOccsWithAss) {
        var oObjDefs = new Array();
        for (var i = 0; i < oOccsWithAss.length; i++) {
            var oObjDefWithAss = oOccsWithAss[i].ObjDef()
            if(!oCurrOcc.ObjDef().IsEqual(oObjDefWithAss)) {
                oObjDefs.push(oObjDefWithAss)
            }
        }
        oObjDefs = ArisData.Unique(oObjDefs);
        oObjDefs = ArisData.sort(oObjDefs, Constants.AT_NAME, gn_Lang);
        
        var sText = "<ul>";
        for (var i = 0; i < oObjDefs.length; i++) {
            sText += "<li>" + oObjDefs[i].Name(gn_Lang) + "</li>";                
        }
        sText += "</ul>";
        return sText;
    }       
}

function check_AssignedFadModel(mapInfoMarks, oModel) {
    var oFuncOccs = oModel.ObjOccListFilter(Constants.OT_FUNC);
    for (var i = 0; i < oFuncOccs.length; i++) {
        var oFuncOcc = oFuncOccs[i];
        var oAssignedFadModels = oFuncOcc.ObjDef().AssignedModels(Constants.MT_FUNC_ALLOC_DGM);
        for (var j = 0; j < oAssignedFadModels.length; j++) {
            
            var oFadModel = oAssignedFadModels[j];
            var oAssFuncOccs = oFadModel.ObjOccListFilter(Constants.OT_FUNC);
            for (var k = 0; k < oAssFuncOccs.length; k++) {
                var oAssFuncOcc = oAssFuncOccs[k];
                
                if (!oAssFuncOcc.ObjDef().IsEqual(oFuncOcc.ObjDef())) {
                    setInfoMark(mapInfoMarks, oAssFuncOcc, getString("ERR_ASSIGNED_FAD"), Constants.MODEL_INFO_ERROR);
                }
            }
        }
    }
}

function checkTaskHierarchyCycle(mapInfoMarks, oModel) {
    var oTaskOccs = oModel.ObjOccListFilter(Constants.OT_FUNC);
    var bCycle = false;
    for (var i = 0; i < oTaskOccs.length; i++) {
        var oTaskOcc = oTaskOccs[i];
        var oHierarchyModels = new Array();

        if (isCycleInHierarchy(oTaskOcc, oHierarchyModels)) {
            setInfoMark(mapInfoMarks, oTaskOcc, getString("ERR_HIERARCHY_CYCLE"), Constants.MODEL_INFO_ERROR);
            bCycle = true;
        }
    }
    return bCycle;

    function isCycleInHierarchy(oObjOcc, oHierarchyModels) {
        var oAssignedModels = oObjOcc.ObjDef().AssignedModels([Constants.MT_BPMN_COLLABORATION_DIAGRAM, Constants.MT_BPMN_PROCESS_DIAGRAM]);
        if (oAssignedModels.length > 0) {
            for (var j = 0; j < oAssignedModels.length; j++) {
                var oModel = oAssignedModels[j];
                if (isItemInList(oModel, oHierarchyModels)) return true;
                
                var oNewHierarchyModels = getCopiedModelList(oHierarchyModels);
                oNewHierarchyModels.push(oModel);
                
                var oTaskOccs = oModel.ObjOccListFilter(Constants.OT_FUNC);
                for (var k = 0; k < oTaskOccs.length; k++) {
                    var oTaskOcc = oTaskOccs[k];
                    
                    if (isCycleInHierarchy(oTaskOcc, oNewHierarchyModels)) return true;
                }
            }
        }
        return false;
        
        function getCopiedModelList(oModelList) {
            var oCopiedModelList = new Array();
            for (var i = 0; i < oModelList.length; i++) {
                oCopiedModelList.push(oModelList[i]);
            }
            return oCopiedModelList;
        }
    }
    
}

function checkTaskAssignment(mapInfoMarks, oModel) {
    var oCallActivityOccs = getCallActivitiesInModel(oModel);
    var oSubprocessOccs = getSubprocessesInModel(oModel);
    
    var oObjOccs = oModel.ObjOccListFilter(Constants.OT_FUNC);
    for (var i = 0; i < oObjOccs.length; i++) {
        var oObjOcc = oObjOccs[i];
        var wrongAssignments = new Array();

        // Assignment with 'Collaboration Diagram' or 'Process Diagram' - only allowed for call activities and subprocesses
        var oAssignedModels = oObjOcc.ObjDef().AssignedModels([Constants.MT_BPMN_COLLABORATION_DIAGRAM, Constants.MT_BPMN_PROCESS_DIAGRAM]);
        if (oAssignedModels.length > 0) {
            for (var j = 0; j < oAssignedModels.length; j++) {
                var oAssignedModel = oAssignedModels[j];
                if (oAssignedModel.TypeNum() == Constants.MT_BPMN_COLLABORATION_DIAGRAM) {
                    if (!isOccInList(oObjOcc, oCallActivityOccs)) wrongAssignments.push(oAssignedModel);
                }
                else if (oAssignedModel.TypeNum() == Constants.MT_BPMN_PROCESS_DIAGRAM) {
                    if (!isOccInList(oObjOcc, oSubprocessOccs)) wrongAssignments.push(oAssignedModel);
                }
            }
        }
        if (wrongAssignments.length > 0) {
            var sText = getString("ERR_TASK_ASSIGNMENT") + getAdditionalText(wrongAssignments);
            setInfoMark(mapInfoMarks, oObjOcc, sText, Constants.MODEL_INFO_ERROR);
        }
    }
    // Assignment with 'FAD' - NOT allowed for call activities and subprocesses
    oObjOccs = oCallActivityOccs.concat(oSubprocessOccs);
    for (var i = 0; i < oObjOccs.length; i++) {
        var oObjOcc  = oObjOccs[i];
        wrongAssignments = new Array();
        var oAssignedModels = oObjOcc.ObjDef().AssignedModels(Constants.MT_FUNC_ALLOC_DGM);
        if (oAssignedModels.length > 0) {
            for (var j = 0; j < oAssignedModels.length; j++) {
                var oAssignedModel = oAssignedModels[j];
                wrongAssignments.push(oAssignedModel);
            }
        }
        if (wrongAssignments.length > 0) {
            var sText = getString("ERR_TASK_ASSIGNMENT") + getAdditionalText(wrongAssignments);
            setInfoMark(mapInfoMarks, oObjOcc, sText, Constants.MODEL_INFO_ERROR);
        }
    }
    
    function isOccInList(oObjOcc, oOccList) {
        for (var i = 0; i < oOccList.length; i++) {
            if (oOccList[i].IsEqual(oObjOcc)) return true;
        }
        return false;
    }
    
    function getAdditionalText(oModels) {
        oModels = ArisData.Unique(oModels);
        oModels = ArisData.sort(oModels, Constants.AT_NAME, gn_Lang);
        
        var sText = "<ul>";
        for (var i = 0; i < oModels.length; i++) {
            sText += "<li>" + formatstring2(getString("NAME_TYPE"), oModels[i].Name(gn_Lang), oModels[i].Type()) + "</li>";                
        }
        sText += "</ul>";
        return sText;
    }               
}

function check_wMChecks(mapInfoMarks, oModel) {
    // This function runs the wM semantic checks, implemented in java class "ABPMNSemanticCheck"

    // Not supported activities, tasks, subprocesses
    runCheck("wMCheck_TransactionSubProcess", mapInfoMarks, oModel, getString("ERR_TRANSACTION_NOT_SUPPORTED"), Constants.MODEL_INFO_ERROR);
    runCheck("wMCheck_EventSubProcess", mapInfoMarks, oModel, getString("ERR_EVENT_SUBPROCESS_NOT_SUPPORTED"), Constants.MODEL_INFO_ERROR);
    runCheck("wMCheck_AdHocSubProcess", mapInfoMarks, oModel, getString("ERR_ADHOC_SUBPROCESS_NOT_SUPPORTED"), Constants.MODEL_INFO_ERROR);
    //ARHI Compensation will be supported in wM // runCheck("wMCheck_CompensationActivity", mapInfoMarks, oModel, getString("WRG_COMPENSATION_ACTIVITITY_NOT_SUPPORTED"), Constants.MODEL_INFO_WARNING);
    runCheck("wMCheck_TaskScript", mapInfoMarks, oModel, getString("WRG_SCRIPT_TASK_NOT_SUPPORTED"), Constants.MODEL_INFO_WARNING);
    runCheck("wMCheck_GatewayEventBased", mapInfoMarks, oModel, getString("ERR_EVENTBASED_GATEWAY_NOT_SUPPORTED"), Constants.MODEL_INFO_ERROR);
    runCheck("wMCheck_MultiInstanceParallelLoop", mapInfoMarks, oModel, getString("ERR_MULTIINSTANCE_PARALLEL_LOOP_NOT_SUPPORTED"), Constants.MODEL_INFO_ERROR);
    runCheck("wMCheck_MultiInstanceSequentialLoop", mapInfoMarks, oModel, getString("ERR_MULTIINSTANCESEQUENTIALLOOP_NOT_SUPPORTED"), Constants.MODEL_INFO_ERROR);
    runCheck("wMCheck_MessageObject", mapInfoMarks, oModel, getString("ERR_MESSAGE_OBJECT_NOT_SUPPORTED"), Constants.MODEL_INFO_ERROR);

    // Not supported start events
    runCheck_NotSupportedEvents("wMCheck_StartEventTimer_TopLevel");
    runCheck_NotSupportedEvents("wMCheck_StartEventConditional_TopLevel");
    runCheck_NotSupportedEvents("wMCheck_StartEventMultiple_TopLevel");
    runCheck_NotSupportedEvents("wMCheck_StartEventParallelMultiple_TopLevel");
    runCheck_NotSupportedEvents("wMCheck_StartEventMessage_EventSubProcessI");
    runCheck_NotSupportedEvents("wMCheck_StartEventTimer_EventSubProcessI");
    runCheck_NotSupportedEvents("wMCheck_StartEventError_EventSubProcessI");
    runCheck_NotSupportedEvents("wMCheck_StartEventEscalation_EventSubProcessI");
    runCheck_NotSupportedEvents("wMCheck_StartEventCompensation_EventSubProcessI");
    runCheck_NotSupportedEvents("wMCheck_StartEventConditional_EventSubProcessI");
    runCheck_NotSupportedEvents("wMCheck_StartEventSignal_EventSubProcessI");
    runCheck_NotSupportedEvents("wMCheck_StartEventMultiple_EventSubProcessI");
    runCheck_NotSupportedEvents("wMCheck_StartEventParallelMultiple_EventSubProcessI");
    runCheck_NotSupportedEvents("wMCheck_StartEventMessage_EventSubProcessNI");
    runCheck_NotSupportedEvents("wMCheck_StartEventTimer_EventSubProcessNI");
    runCheck_NotSupportedEvents("wMCheck_StartEventEscalation_EventSubProcessNI");
    runCheck_NotSupportedEvents("wMCheck_StartEventConditional_EventSubProcessNI");
    runCheck_NotSupportedEvents("wMCheck_StartEventSignal_EventSubProcessNI");
    runCheck_NotSupportedEvents("wMCheck_StartEventMultiple_EventSubProcessNI");
    runCheck_NotSupportedEvents("wMCheck_StartEventParallelMultiple_EventSubProcessNI");
    // Not supported intermediate events
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventTimer_Catching");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventConditional_Catching");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventLink_Catching");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventMultiple_Catching");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventParallelMultiple_Catching");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventEscalation_BoundaryI");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventCancel_BoundaryI");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventCompensation_BoundaryI");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventConditional_BoundaryI");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventMultiple_BoundaryI");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventParallelMultiple_BoundaryI");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventEscalation_BoundaryNI");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventConditional_BoundaryNI");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventMultiple_BoundaryNI");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventParallelMultiple_BoundaryNI");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventEscalation_Throwing");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventCompensation_Throwing");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventLink_Throwing");
    runCheck_NotSupportedEvents("wMCheck_IntermediateEventMultiple_Throwing");
    // Not supported end events
    runCheck_NotSupportedEvents("wMCheck_EndEventEscalation_TopLevel");
    runCheck_NotSupportedEvents("wMCheck_EndEventCancel_TopLevel");
    runCheck_NotSupportedEvents("wMCheck_EndEventCompensation_TopLevel");
    runCheck_NotSupportedEvents("wMCheck_EndEventMultiple_TopLevel");

    // Not supported events for task types
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_CallActivity_IntermediateMessageEventBoundaryI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_CallActivity_IntermediateTimerEventBoundaryI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_CallActivity_IntermediateSignalEventBoundaryI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_SubProcess_IntermediateMessageEventBoundaryI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_SubProcess_IntermediateTimerEventBoundaryI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_SubProcess_IntermediateSignalEventBoundaryI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_BusinessRuleTask_IntermediateMessageEventBoundaryI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_BusinessRuleTask_IntermediateTimerEventBoundaryI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_BusinessRuleTask_IntermediateSignalEventBoundaryI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_UserTask_IntermediateMessageEventBoundaryI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_UserTask_IntermediateTimerEventBoundaryI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_UserTask_IntermediateTimerEventBoundaryNI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_UserTask_IntermediateSignalEventBoundaryI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_ManualTask_IntermediateMessageEventBoundaryI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_ManualTask_IntermediateMessageEventBoundaryNI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_ManualTask_IntermediateTimerEventBoundaryI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_ManualTask_IntermediateTimerEventBoundaryNI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_ManualTask_IntermediateSignalEventBoundaryI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_ManualTask_IntermediateSignalEventBoundaryNI");
    runCheck_NotSupportedEventsForTaskTypes("wMCheck_ManualTask_IntermediateErrorEventBoundaryI");

    function runCheck_NotSupportedEvents(checkName) {
        runCheck(checkName, mapInfoMarks, oModel, getString("ERR_NOT_SUPPORTED_EVENTS"), Constants.MODEL_INFO_ERROR);
    }
    
    function runCheck_NotSupportedEventsForTaskTypes(checkName) {
        runCheck(checkName, mapInfoMarks, oModel, getString("ERR_NOT_SUPPORTED_EVENTS_FOR_TASKTYPES"), Constants.MODEL_INFO_ERROR);
    }
    
    function runCheck(checkName, mapInfoMarks, oModel, sText, nType) {
        var result = g_semCheckComponent.runCheck(checkName, oModel);
        handleResult(oModel, result, sText);
        
        function handleResult(oModel, result, sText) {
            if (result == null || !result.wasChecked()) {
                return;
            }
            var errors = result.getErrors();
            for (var i = 0; i < errors.length; i++) {
                var error = errors[i];
                var oObjOcc = error.getOcc();
                
                setInfoMark(mapInfoMarks, oObjOcc, sText, nType);
            }
        }         
    }
}

function isLane( p_Occ ){
    if( (p_Occ.ObjDef().TypeNum() == Constants.OT_BPMN_LANE) && (p_Occ.OrgSymbolNum() == Constants.ST_BPMN_LANE_1) ) { return true; }
    return false;
}

function isPool( p_Occ ){
    if( p_Occ.ObjDef().TypeNum() == Constants.OT_BPMN_POOL) { return true; }
    return false;
}
function getCxns2OrgElements(oTaskOcc){
    var oCxns2OrgElements = new Array();
    
    var oAssignedTaskOcc = getOccInAssignedModel(oTaskOcc.ObjDef());
    if (oAssignedTaskOcc == null) return oCxns2OrgElements;
    
    oCxns2OrgElements = oCxns2OrgElements.concat(getRelevantCxns(oAssignedTaskOcc, Constants.CT_EXEC_1, [Constants.ST_POS], Constants.EDGES_IN));
    oCxns2OrgElements = oCxns2OrgElements.concat(getRelevantCxns(oAssignedTaskOcc, Constants.CT_EXEC_2, [Constants.ST_EMPL_TYPE], Constants.EDGES_IN));
    oCxns2OrgElements = oCxns2OrgElements.concat(getRelevantCxns(oAssignedTaskOcc, Constants.CT_EXEC_1, [Constants.ST_ORG_UNIT_1, Constants.ST_ORG_UNIT_2], Constants.EDGES_IN));
    oCxns2OrgElements = oCxns2OrgElements.concat(getRelevantCxns(oAssignedTaskOcc, Constants.CT_EXEC_1, [Constants.ST_GRP], Constants.EDGES_IN));
    oCxns2OrgElements = oCxns2OrgElements.concat(getRelevantCxns(oAssignedTaskOcc, Constants.CT_EXEC_2, [Constants.ST_ORG_UNIT_TYPE_1, Constants.ST_ORG_UNIT_TYPE_2], Constants.EDGES_IN));
    return ArisData.Unique(oCxns2OrgElements);
}

function getCxns2SSTs(oTaskOcc){
    var oCxns2SSTs = new Array();
    
    var oAssignedTaskOcc = getOccInAssignedModel(oTaskOcc.ObjDef());
    if (oAssignedTaskOcc == null) return oCxns2SSTs;
    
    oCxns2SSTs = oCxns2SSTs.concat(getRelevantCxns(oAssignedTaskOcc, Constants.CT_CAN_SUPP_1, [Constants.ST_SW_SERVICE_TYPE], Constants.EDGES_IN));
    return ArisData.Unique(oCxns2SSTs);
}

function getCxns2SSOTs(oTaskOcc){
    var oCxns2SSOTs = new Array();
    
    var oAssignedTaskOcc = getOccInAssignedModel(oTaskOcc.ObjDef());
    if (oAssignedTaskOcc == null) return oCxns2SSOTs;
    
    oCxns2SSOTs = oCxns2SSOTs.concat(getRelevantCxns(oAssignedTaskOcc, Constants.CT_SUPP_3, [Constants.ST_SW_SERVICE_OPERATION_TYPE], Constants.EDGES_IN));
    return ArisData.Unique(oCxns2SSOTs);
}

function getCxns2Screens(oTaskOcc){
    var oCxns2Screens = new Array();
    
    var oAssignedTaskOcc = getOccInAssignedModel(oTaskOcc.ObjDef());
    if (oAssignedTaskOcc == null) return oCxns2Screens;
    
    oCxns2Screens = oCxns2Screens.concat(getRelevantCxns(oAssignedTaskOcc, Constants.CT_IS_REPR_BY, [Constants.ST_SCRN], Constants.EDGES_OUT));
    return ArisData.Unique(oCxns2Screens);
}

function getOccInAssignedModel(oObjDef){
    var oAssignedModels = oObjDef.AssignedModels([Constants.MT_FUNC_ALLOC_DGM]);
    if (oAssignedModels.length > 0) {
        var oOccsInAssignedModel = oObjDef.OccListInModel(oAssignedModels[0]);
        if (oOccsInAssignedModel.length > 0) {
            
            return oOccsInAssignedModel[0];
        }
    }
    return null;
}

function getRelevantCxns(oUserTaskOcc, nCxnType, aConnSymbols, nInOut) {
    var oRelevantCxns = new Array();
    var oCxnOccs = oUserTaskOcc.Cxns(nInOut);
    for (var i = 0; i < oCxnOccs.length; i++) {
        var oCxnOcc = oCxnOccs[i];
        if (oCxnOcc.Cxn().TypeNum() == nCxnType) {
            var oConnObjOcc = (nInOut == Constants.EDGES_IN) ? oCxnOcc.SourceObjOcc() : oCxnOcc.TargetObjOcc();
            for (var j = 0; j < aConnSymbols.length; j++) {                    
                if (oConnObjOcc.OrgSymbolNum() == aConnSymbols[j]) {
                    oRelevantCxns.push(oCxnOcc.Cxn());
                }
            }
        }
    }
    return oRelevantCxns;
}

function getSelectedBPMNModels(){
    return getFilteredModels(ArisData.getSelectedModels());
    
    // Filters the models with the specific type nums
    function getFilteredModels(selectedModels) {
        var aTypeNums = Context.getDefinedItemTypes(Constants.CID_MODEL);
        if (aTypeNums.length == 0 || (aTypeNums.length == 1 && aTypeNums[0] == -1)) {
            // All/None type nums selected
            return selectedModels;
        }
        var setTypeNums = new java.util.HashSet();
        for (var i = 0; i < aTypeNums.length; i++) {
            setTypeNums.add(java.lang.Integer.valueOf(aTypeNums[i]));
        }
        var filteredModels = new Array();
        for (var i = 0; i < selectedModels.length; i++) {
            var oModel = selectedModels[i];
            if (setTypeNums.contains(java.lang.Integer.valueOf(oModel.TypeNum()))) {
                filteredModels.push(oModel);
            }
        }
        return filteredModels;
    }
}

function initInfoMarks(oModels) {
    var mapInfoMarks = new java.util.HashMap();
    for (var i = 0; i < oModels.length; i++) {     
        var key1 = oModels[i].GUID();
        if (!mapInfoMarks.containsKey(key1)) {
            mapInfoMarks.put(key1, new java.util.HashMap());     
        }
    }
    return mapInfoMarks;
}

function setInfoMark(mapInfoMarks, oOcc, sText, nType) {

    sText = "<li>" + sText + "</li>";                
    
    var sErrors = "";
    var sWarnings = "";
    var sInfos = ""
    if(nType == Constants.MODEL_INFO_ERROR) {
        gb_c_ERROR_MARK_SET = true;
        sErrors = sText;
    }
    if(nType == Constants.MODEL_INFO_WARNING) {
        gb_c_WARNING_MARK_SET = true;
        sWarnings = sText;
    }
    if(nType == Constants.MODEL_INFO_INFORMATION) {
        gb_c_INFO_MARK_SET = true;
        sInfos = sText;
    }
    
    var key1 = oOcc.Model().GUID();
    var key2 = oOcc.ObjectID();
    
    var value1 = new java.util.HashMap(); // = inner HashMap
    
    if (mapInfoMarks.containsKey(key1)) {
        value1 = mapInfoMarks.get(key1);
        if (value1.containsKey(key2)) {
            var value2 = value1.get(key2);

            sErrors = value2.get(ERRORS) + sErrors;
            sWarnings = value2.get(WARNINGS) + sWarnings;
            sInfos = value2.get(INFOS) + sInfos;
        
            nType = Math.max(nType, value2.get(TYPE));
        } 
    }
    var value2 = new java.util.HashMap(); // = value HashMap
    
    value2.put(ERRORS,sErrors);
    value2.put(WARNINGS,sWarnings);
    value2.put(INFOS,sInfos);
    value2.put(TYPE,nType);
    
    
    value1.put(key2, value2);        
    mapInfoMarks.put(key1, value1); 
}

function outInfoMarks(mapInfoMarks) {
    if( gb_DGRMS_OPEN_SET == true ) {
        var modelSet = mapInfoMarks.keySet(); 
        var iter = modelSet.iterator();
        while (iter.hasNext()) {
            var key1 = iter.next();
            var value1 = mapInfoMarks.get(key1);
            
            var oModel = g_oDB.FindGUID(key1, Constants.CID_MODEL);
            if (value1.keySet().size() > 0) {
                oModel.openModel();
            }
            oModel.ClearError();
            
            var occSet = value1.keySet();
            var iter2 = occSet.iterator();
            while (iter2.hasNext()) {
                var key2 = iter2.next();
                var value2 = value1.get(key2);
                
                var sErrors = ""+value2.get(ERRORS);
                var sWarnings = ""+value2.get(WARNINGS);
                var sInfos = ""+value2.get(INFOS);
                
                var sText = "";
                if (sErrors.length > 0) {
                    sText += "<b>" + getString("ERRORS") + "</b><ul>" + sErrors + "</ul>";
                }
                if (sWarnings.length > 0) {
                    sText += "<b>" + getString("WARNINGS") + "</b><ul>" + sWarnings + "</ul>";            
                }
                if (sInfos.length > 0) {
                    sText += "<b>" + getString("INFOS") + "</b><ul>" + sInfos + "</ul>";                
                }            
                sText = "<html>" + sText.replace(/\n/g, "<br>") + "</html>";
                var nType = value2.get(TYPE);

                var oOcc = g_oDB.FindOID(key2);
                oModel.setTemporaryUserInfo(oOcc, nType, sText);
            }
        }      
    } else {
        // Clear errors if models are open
       var modelSet = mapInfoMarks.keySet(); 
        var iter = modelSet.iterator();
        while (iter.hasNext()) {
            var key1 = iter.next();            
            var oModel = g_oDB.FindGUID(key1, Constants.CID_MODEL);
            oModel.ClearError();        
        }        
    }
}    

function writeProperties( ){
    Context.setProperty("INFO_MARK_SET", gb_c_INFO_MARK_SET);
    Context.setProperty("WARNING_MARK_SET", gb_c_WARNING_MARK_SET);
    Context.setProperty("ERROR_MARK_SET", gb_c_ERROR_MARK_SET);
    Context.setProperty("DIAGRAMS_TO_BE_OPENED", gb_DGRMS_OPEN_SET);
}

function getBoolPropertyValue(p_sPropKey) {
    var property = Context.getProperty(p_sPropKey);
    if (property != null) {
        return (StrComp(property, "true") == 0);
    }
    return false;
}

function getBoolPropertyValueWithNull(p_sPropKey) {
    var property = Context.getProperty(p_sPropKey);
    if (property != null) {
        return (StrComp(property, "true") == 0);
    }
    return null;
}     

function isItemInList(oItem, oItemList) {
    for (var i = 0; i < oItemList.length; i++) {
        if (oItemList[i].IsEqual(oItem)) return true;
    }
    return false;
}
/*********************************************************************************************/ 

function getSubprocessesInModel(p_oModel) {
    return getOccsInModel_wMHelper("wMHelper_getSubprocesses", p_oModel);
}

function getCallActivitiesInModel(p_oModel) {
    return getOccsInModel_wMHelper("wMHelper_getCallActivities", p_oModel);
}

function getManualTasksInModel(p_oModel) {
    return getOccsInModel_wMHelper("wMHelper_getManualTasks", p_oModel);
}

function getUserTasksInModel(p_oModel) {
    return getOccsInModel_wMHelper("wMHelper_getUserTasks", p_oModel);
}

function getServiceTasksInModel(p_oModel) {
    return getOccsInModel_wMHelper("wMHelper_getServiceTasks", p_oModel);
}

function getAbstractTasksInModel(p_oModel) {
    return getOccsInModel_wMHelper("wMHelper_getAbstractTasks", p_oModel);
}

function getOccsInModel_wMHelper(checkName, oModel) {
    var result = g_semCheckComponent.runCheck(checkName, oModel);
    if (result == null || !result.wasChecked()) {
        return new Array();
    }
    var oOccList = new Array();

    var errors = result.getErrors();
    for (var i = 0; i < errors.length; i++) {
        var oObjOcc = errors[i].getOcc();
        oOccList.push(oObjOcc);
    }
    return oOccList;
}  

function checkOpenMergeConflicts(){
    var bModsOpened = false;
    var aModsChecked = [];
           
    this.getAllMods2Open = function(p_aMods2Check){
       if (aModsChecked.length == 0) aModsChecked = aModsChecked.concat(p_aMods2Check);
       for (var i=0; i<p_aMods2Check.length; i++){
           var oMod2Check = p_aMods2Check[i];
           if (mergeNotComplete(oMod2Check)){
                if(!isSilent())
                    oMod2Check.openModel();
                bModsOpened = true;
                
           }  
           this.getAllMods2Open(getAllUnCheckAssigments(oMod2Check));
       }
       return bModsOpened;
    }
    function mergeNotComplete(p_oMod2Check){        
       var oMergeState = p_oMod2Check.Attribute(Constants.AT_MOD_TRANS_RESOLVE_STATE ,-1);
       var bMergedNotCompleted = (oMergeState.IsMaintained()) ? oMergeState.MeasureUnitTypeNum ( ) != Constants.AVT_MOD_TRANSFORM_RESOLVE_COMPLETED : false;
       return  bMergedNotCompleted;
    }
    function getAllUnCheckAssigments(p_oMod2Check){
        var aMods2Check = [];
        var aFkts = p_oMod2Check.ObjDefListFilter(Constants.OT_FUNC);
        for (var i=0 ; i < aFkts.length; i++){
            var aAssignedMods = aFkts[i].AssignedModels([Constants.MT_BPMN_COLLABORATION_DIAGRAM, Constants.MT_BPMN_PROCESS_DIAGRAM, Constants.MT_FUNC_ALLOC_DGM]);
            for (var j=0; j < aAssignedMods.length; j++){
                if (aAssignedMods[j].TypeNum() == Constants.MT_FUNC_ALLOC_DGM){                    
                   if (mergeNotComplete(aAssignedMods[j])){
                        bModsOpened = true;
                        if(!isSilent())
                            aAssignedMods[j].openModel();
                   }  
                } else {
                    if (!aModsChecked.contains(aAssignedMods[j])){
                        aMods2Check.push(aAssignedMods[j]);
                    }    
                    aModsChecked.push(aAssignedMods[j]);                
                }
            }
        } 
        return aMods2Check;
    }
}  


function isSilent(){
    return getBoolPropertyValue("SILENT_MODE")
}
