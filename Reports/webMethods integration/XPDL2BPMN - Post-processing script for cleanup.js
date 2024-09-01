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

 
var notAllowedObjectSet = new Packages.java.util.HashSet();
        notAllowedObjectSet.add(Constants.OT_ORG_UNIT_TYPE);//org unit type
        notAllowedObjectSet.add(Constants.OT_ORG_UNIT); //org unit
        notAllowedObjectSet.add(Constants.OT_KPI); //KPI
        notAllowedObjectSet.add(Constants.OT_APPL_SYS_TYPE); //service
        notAllowedObjectSet.add(Constants.OT_DP_FUNC_TYPE); //service operation
        notAllowedObjectSet.add(Constants.OT_POS); //position
        notAllowedObjectSet.add(Constants.OT_PERS_TYPE); //person type
        notAllowedObjectSet.add(Constants.OT_GRP); // group 
 
 
main(); 
 
function main(){
    var g_oDB = ArisData.getActiveDatabase();
    
    //all touched models of the transformation 
    var trafoTouchedModelsSet = new Packages.java.util.HashSet();
    
    var guidString = Context.getProperty("ALL_GENEREATED_MODEL_GUIDS");
    if(guidString != null){
		var guids = java.util.StringTokenizer(guidString ,",")
		while(guids.hasMoreTokens()){
			trafoTouchedModelsSet.add(g_oDB.FindGUID(guids.nextToken()));
		}
	}
    
    
    //start cleaning of FADs
    cleanKPIsServicesAndOrgUnitsOutOfFADs(trafoTouchedModelsSet);
    
    //set BPMN symbols for tasks in FAD models
    setBPMNSymbolsInFADModels(trafoTouchedModelsSet);
    
}


function setBPMNSymbolsInFADModels(trafoTouchedModelsSet){
    
    var taskDefs = getAllTaskDefs(trafoTouchedModelsSet.toArray());
    for( var i = 0; i < taskDefs.length; i++){
        var taskDef = taskDefs[i];
        var occs = taskDef.OccList();
        var bpmnSymbol = -1;
        var bpmnSymbolWidth = -1;
        var bpmnSymbolHeight = -1;
        for( var j = 0; j < occs.length; j++){
            var occ = occs[j];
            var model = occ.Model();
            var modelType = model.TypeNum();
            if(modelType == Constants.MT_BPMN_COLLABORATION_DIAGRAM || modelType == Constants.MT_BPMN_PROCESS_DIAGRAM){
                bpmnSymbol = occ.getSymbol();  
                bpmnSymbolWidth = occ.Width();
                bpmnSymbolHeight = occ.Height();
            }
            
        }
        if(bpmnSymbol >= 0){
            for( var k = 0; k < occs.length; k++){
                var occ = occs[k];
                var model = occ.Model();
                var modelType = model.TypeNum();
                if(modelType == Constants.MT_FUNC_ALLOC_DGM && occ.getSymbol() != bpmnSymbol){
                     occ.setSymbol(bpmnSymbol); 
                     if(bpmnSymbolWidth >0 && bpmnSymbolWidth > 0)
                        occ.SetSize(bpmnSymbolWidth, bpmnSymbolHeight);
                }
            }
        }
    }
}
 
 
 


function getAllFADofTasks(allTaskDefsList){
    var FADofTasksList = new Array();
    
    for(var i=0; i< allTaskDefsList.length; i++){
        //get all assigned FADs
        var allAssignedFADs = allTaskDefsList[i].AssignedModels([Constants.MT_FUNC_ALLOC_DGM]);    
        
        FADofTasksList = FADofTasksList.concat(allAssignedFADs);
    }
    
    return FADofTasksList;
}
/*
 * Deletes all Services, KPIs and Org units from FAD which were not in the trafo result
 */
function cleanKPIsServicesAndOrgUnitsOutOfFADs(trafoTouchedModelsSet){
    
    var allTaskDefsList = getAllTaskDefs(trafoTouchedModelsSet.toArray());

    var FADofTasksList = getAllFADofTasks(allTaskDefsList);
    
    for(var i=0; i< FADofTasksList.length; i++){
        //model doesn't belongs to trafo models?
        if(!trafoTouchedModelsSet.contains(FADofTasksList[i])){
            cleanKPIsServicesAndOrgUnits(FADofTasksList[i]);    
        }
    }
}

function cleanKPIsServicesAndOrgUnits(FAD){
    var occs = FAD.ObjOccList();
    
    for(var i=0; i< occs.length; i++){
        if(isKPIServiceOrOrgUnit(occs[i].ObjDef())){
            //delete occ in FAD
            FAD.deleteOcc(occs[i],false);    
        }
    }
}

function isKPIServiceOrOrgUnit(def){
    if(notAllowedObjectSet.contains(def.TypeNum())){
        return true;    
    }
    return false;
}

//collects all task which are involved by the trafo
function getAllTaskDefs(selectedModelList){
    
    var allTaskDefsList = new Array(); 
    
    for(var i=0; i< selectedModelList.length; i++){
        //get all occs of abstract, manual and service task
        //collect only tasks of collaboration or process model
        if(selectedModelList[i].TypeNum() == Constants.MT_BPMN_COLLABORATION_DIAGRAM || selectedModelList[i].TypeNum() == Constants.MT_BPMN_PROCESS_DIAGRAM){
            var aDefs   = selectedModelList[i].ObjDefListFilter( [Constants.OT_FUNC] );
            allTaskDefsList = allTaskDefsList.concat(aDefs);
        }
    }
    
    return allTaskDefsList;
}