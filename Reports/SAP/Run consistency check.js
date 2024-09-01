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

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"
 
var g_nLoc = Context.getSelectedLanguage();
var g_oMethod = ArisData.ActiveFilter();

//Symbols to be ignored
var g_a_IgnoreSymbols = [Constants.ST_PRCS_IF, Constants.ST_SOLAR_SL_VAC_OCC, Constants.ST_SOLAR_SL_OCC];

//Allowed model types 
var g_a_ModelType = [Constants.MT_EEPC, Constants.MT_EEPC_ROW, Constants.MT_EEPC_COLUMN, 
                     Constants.MT_VAL_ADD_CHN_DGM, 
                     Constants.MT_BPMN_COLLABORATION_DIAGRAM, Constants.MT_BPMN_PROCESS_DIAGRAM,
                     Constants.MT_ENTERPRISE_BPMN_COLLABORATION, Constants.MT_ENTERPRISE_BPMN_PROCESS]; // BLUE-9697

//Global array for error messages
var g_a_Errors = [];

/********************************
        Main Method
********************************/
function main(){
    //find user defined model types based on  allowed model
    g_a_ModelType = enrichModelTypes(g_a_ModelType);
    
    //find user defined symbols based on ignorable symbols
    g_a_IgnoreSymbols = enrichSymbolTypes(g_a_IgnoreSymbols);
    
    //Check for selected objects
    var a_Defs = ArisData.getSelectedObjDefs();
    if(a_Defs.length >0){
        for(var i=0; i<a_Defs.length; i++){
            var a_Occs = a_Defs[i].OccList();
            
            for(var nOcc=0; nOcc<a_Occs.length; nOcc++){
                //Ignore Symbols
                if(!checkSymbol(a_Occs[nOcc], g_a_IgnoreSymbols)){
                    if(checkModelTypeNum(a_Occs[nOcc].Model(), g_a_ModelType)){
                        checkObject(a_Occs[nOcc]);
                    }
                }
            }
        }    
    }else{
        //Check models
        var a_Models = ArisData.getSelectedModels();
        
        for(var i=0; i<a_Models.length; i++){
            checkModel(a_Models[i]);
        }
    }
    
    if(g_a_Errors.length >0){
        output_Errors_Excel();
    }
}

function enrichModelTypes(a_BaseModelTypes){
    var a_NewModelTypes =  new Array();
    
    for(var i=0; i<a_BaseModelTypes.length; i++){
        a_NewModelTypes.push(a_BaseModelTypes[i]);
        
        a_NewModelTypes = a_NewModelTypes.concat(g_oMethod.getUserDefinedModelTypes(a_BaseModelTypes[i]))
    }
    
    return a_NewModelTypes;
}

function enrichSymbolTypes(a_BaseSymbolTypes){
    var a_NewSymbolTypes =  new Array();
    
    for(var i=0; i<a_BaseSymbolTypes.length; i++){
        a_NewSymbolTypes.push(a_BaseSymbolTypes[i]);
        
        a_NewSymbolTypes = a_NewSymbolTypes.concat(g_oMethod.getUserDefinedSymbols(a_BaseSymbolTypes[i]))
    }
    
    return a_NewSymbolTypes;
}

/********************************
        Output 
********************************/
//Error Container
function Error(p_oModel, p_oObjOcc, p_sError){
    this.oModel = p_oModel;
    this.oObjOcc = p_oObjOcc;
    this.sError = p_sError;
}

function addError(p_oModel, p_oObjOcc, p_sError){
    g_a_Errors.push(new Error(p_oModel, p_oObjOcc, p_sError));
}

function output_Errors_Excel(){
    //init outputObject
    var oOutput = Context.createOutputObject(Context.getSelectedFormat(), Context.getSelectedFile()); 
    //Schriftformate anlegen
    oOutput.DefineF("TH", "Arial",12, Constants.C_BLACK, Constants.C_GREY_80_PERCENT, Constants.FMT_CENTER, 0, 0, 0, 0, 0, 0);
    oOutput.DefineF("TD", "Arial",10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 0);  
    
    oOutput.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    //Headder
    oOutput.TableRow();
    oOutput.TableCellF(getString("TEXT_13"), 30, "TH");
    oOutput.TableCellF(getString("TEXT_14"), 20, "TH");
    oOutput.TableCellF(getString("TEXT_15"), 30, "TH");
    oOutput.TableCellF(getString("TEXT_16"), 20, "TH");
    oOutput.TableCellF(getString("TEXT_17"), 40, "TH");
    
    for(var nError=0; nError < g_a_Errors.length; nError++){
        var error = g_a_Errors[nError];
        oOutput.TableRow();
        if(error.oModel != null){
            oOutput.TableCellF(error.oModel.Name(g_nLoc), 30, "TD");
            oOutput.TableCellF(error.oModel.Attribute(Constants.AT_SAP_MOD_TYPE, g_nLoc).GetValue(true), 20, "TD");
        }else{
            oOutput.TableCellF("", 30, "TD");
            oOutput.TableCellF("", 20, "TD");    
        }
        if(error.oObjOcc != null){
            oOutput.TableCellF(error.oObjOcc.ObjDef().Name(g_nLoc), 30, "TD");
            oOutput.TableCellF(error.oObjOcc.ObjDef().Attribute(Constants.AT_SAP_FUNC_TYPE, g_nLoc).GetValue(true), 20, "TD");
        }else{
            oOutput.TableCellF("", 30, "TD");
            oOutput.TableCellF("", 20, "TD");    
        }
        
        oOutput.TableCellF(error.sError, 40, "TD");    
    }
    
    oOutput.EndTable("Consistency Check", 100, "Arial", 12, Constants.C_RED, Constants.C_TRANSPARENT,0, Constants.FMT_CENTER, 0);
    
    oOutput.WriteReport();
}




/********************************
        Object Checks
********************************/
function checkObject(p_oOcc){
    var nSAPType = p_oOcc.ObjDef().Attribute(Constants.AT_SAP_FUNC_TYPE, g_nLoc).MeasureUnitTypeNum(); 
    switch(nSAPType){
        case Constants.AVT_SOLAR_PROJECT: //Project
            checkObject_Project(p_oOcc);
            break;
        case Constants.AVT_SCEN:    //Scenario
            checkObject_Scenario(p_oOcc);
            break;
        case Constants.AVT_PROC_1:    //Process
            checkObject_Process(p_oOcc);
            break;
        case Constants.AVT_SOLAR_PROCESS_STEP:    //Process Step
            checkObject_ProcessStep(p_oOcc);
            break;
        default:
            break;
    }
}

function checkObject_ProcessStep(p_oOcc){
    //Object only allowed in models of type process
    if(!checkModelType(p_oOcc, Constants.AVT_PROC_1)){
        addError(p_oOcc.Model(), p_oOcc, getString("TEXT_1"));
    }
}

function checkObject_Process(p_oOcc){
    //Only one model with type process assigned
    if(!checkAssignment(p_oOcc.ObjDef(), Constants.AVT_PROC_1)){
        addError(p_oOcc.Model(), p_oOcc, getString("TEXT_2"));
    }
    
    //Object only allowed in models of type scenario
    if(!checkModelType(p_oOcc, Constants.AVT_SCEN)){
        addError(p_oOcc.Model(), p_oOcc, getString("TEXT_3"));
    }
}


function checkObject_Scenario(p_oOcc){
    //Only one model with type scenario assigned
    if(!checkAssignment(p_oOcc.ObjDef(), Constants.AVT_SCEN)){   
        addError(p_oOcc.Model(), p_oOcc, getString("TEXT_4"));
    }
    
    //Object only allowed in models of type project
    if(!checkModelType(p_oOcc, Constants.AVT_SOLAR_PROJECT)){ 
        addError(p_oOcc.Model(), p_oOcc, getString("TEXT_5"));
    }
}


function checkObject_Project(p_oOcc){
    //Only one model with type project assigned
    checkAssignment_Project(p_oOcc, Constants.AVT_SOLAR_PROJECT, Constants.AVT_INTEGR) 
}

function checkAssignment(p_oObjDef, p_nAttrValueNum){
    var a_AssignedModels = p_oObjDef.AssignedModels(g_a_ModelType);
    var nHits =0;
    var nWrongSapHits =0;
    var nNonSapHits =0;
    
    for(var nMod=0; nMod<a_AssignedModels.length; nMod++){
        if(a_AssignedModels[nMod].Attribute(Constants.AT_SAP_MOD_TYPE, g_nLoc).IsMaintained()){
            var nModelSapType = a_AssignedModels[nMod].Attribute(Constants.AT_SAP_MOD_TYPE, g_nLoc).MeasureUnitTypeNum();
            if(nModelSapType == p_nAttrValueNum){
                nHits ++;    
            }else{
                nWrongSapHits ++;
            }
        }else{
            nNonSapHits ++;
        }
    }
    if(nWrongSapHits > 0){
        return false;
    }else{
        if(nHits > 1){
            return false;
        }else{
            return true;
        }
    }
}

function checkAssignment_Project(p_oObjOcc, p_nAttrValueNum, p_nAttrValueNum_2){
    var a_AssignedModels = p_oObjOcc.ObjDef().AssignedModels(g_a_ModelType);
    var nHits =0;
    var nHits_2 =0;
    
    var nWrongSapHits =0;
    var nNonSapHits =0;
    
    for(var nMod=0; nMod<a_AssignedModels.length; nMod++){
        if(a_AssignedModels[nMod].Attribute(Constants.AT_SAP_MOD_TYPE, g_nLoc).IsMaintained()){
            var nModelSapType = a_AssignedModels[nMod].Attribute(Constants.AT_SAP_MOD_TYPE, g_nLoc).MeasureUnitTypeNum();
            if(nModelSapType == p_nAttrValueNum){
                nHits ++;    
            }else{
                if(nModelSapType == p_nAttrValueNum_2){
                    nHits_2 ++;    
                }else{
                    nWrongSapHits ++;
                }
            }
        }else{
            nNonSapHits ++;
        }
    }
    if(nWrongSapHits > 0){
        addError(p_oObjOcc.Model(), p_oObjOcc, getString("TEXT_18"));
    }
    if(nHits > 1){
        addError(p_oObjOcc.Model(), p_oObjOcc, getString("TEXT_19"));
    }
    if(nHits_2 > 1){
        addError(p_oObjOcc.Model(), p_oObjOcc, getString("TEXT_20"));
    }
}

function checkModelType(p_oOcc, p_nAttrValueNum){
    var oModel = p_oOcc.Model();
    var nModelType = oModel.Attribute(Constants.AT_SAP_MOD_TYPE, g_nLoc).MeasureUnitTypeNum();
    
    if(nModelType == p_nAttrValueNum){
        return true;
    }else{
        return false;
    }
}


/********************************
        Model Checks
********************************/
function checkModel(p_oModel){
    var nSAPModelType = p_oModel.Attribute(Constants.AT_SAP_MOD_TYPE, g_nLoc).MeasureUnitTypeNum();
    
    switch(nSAPModelType){
        case Constants.AVT_SOLAR_PROJECT: //Project
            checkModel_Project(p_oModel);
            break;
        case Constants.AVT_SCEN:    //Scenario
            checkModel_Scenario(p_oModel);
            break;
        case Constants.AVT_PROC_1:    //Process
            checkModel_Process(p_oModel);
            break;
    }
    
    //Check the function occs of the mdoel
    var a_Occs = p_oModel.ObjOccListFilter(Constants.OT_FUNC);
    if(a_Occs.length >0){
        for(var i=0; i<a_Occs.length; i++){
            //Ignore Symbols
            if(!checkSymbol(a_Occs[i], g_a_IgnoreSymbols)){
                checkObject(a_Occs[i]);
            }
        }    
    }
}
/*
Performs checks for models with SAP modeltype 'Project'
*/
function checkModel_Project(p_oModel){
    //Only occurences of type 'scenario'
    var a_Occs = p_oModel.ObjOccListFilter(Constants.OT_FUNC);
    for(var nOcc=0; nOcc<a_Occs.length; nOcc++){
        //Ignore definded symbols
        if(!checkSymbol(a_Occs[nOcc], g_a_IgnoreSymbols)){
            if(!checkObjectSapType(a_Occs[nOcc].ObjDef(), Constants.AVT_SCEN)){
                addError(p_oModel, a_Occs[nOcc], getString("TEXT_7"));
            }
        }
    }
    
    //Needs to be assigned to exactely one function of type 'project'
    if(!checkSuperiorObjectType(p_oModel, true, Constants.AVT_SOLAR_PROJECT)){
        addError(p_oModel, null, getString("TEXT_8"));
    }
}
/*
Performs checks for models with SAP modeltype 'Scenario'
*/
function checkModel_Scenario(p_oModel){
    //Only occurences of type 'process'
    var a_Occs = p_oModel.ObjOccListFilter(Constants.OT_FUNC);
    for(var nOcc=0; nOcc<a_Occs.length; nOcc++){
        //Ignore definded symbols
        if(!checkSymbol(a_Occs[nOcc], g_a_IgnoreSymbols)){
            if(!checkObjectSapType(a_Occs[nOcc].ObjDef(), Constants.AVT_PROC_1)){
                addError(p_oModel, a_Occs[nOcc], getString("TEXT_9"));
            }
        }
    }
    
    //Needs to be assigned to one function of type 'scenario'
    if(!checkSuperiorObjectType(p_oModel, false, Constants.AVT_SCEN)){
        addError(p_oModel, null, getString("TEXT_10"));
    }
}

/*
Performs checks for models with SAP modeltype 'Process'
*/
function checkModel_Process(p_oModel){
    //Only occurences of type 'process step'
    var a_Occs = p_oModel.ObjOccListFilter(Constants.OT_FUNC);
    for(var nOcc=0; nOcc<a_Occs.length; nOcc++){
        //Ignore definded symbols
        if(!checkSymbol(a_Occs[nOcc], g_a_IgnoreSymbols)){
            if(!checkObjectSapType(a_Occs[nOcc].ObjDef(), Constants.AVT_SOLAR_PROCESS_STEP)){
                addError(p_oModel, a_Occs[nOcc], getString("TEXT_11"));
            }
        }
    }
    
    //Needs to be assigned to one function of type 'process'
    if(!checkSuperiorObjectType(p_oModel, false, Constants.AVT_PROC_1)){
        addError(p_oModel, null, getString("TEXT_12"));
    }
}



/*
Checks if the symbol of the an ObjOcc p_oOcc equals to one of the symbols in p_a_Symbols
*/
function checkSymbol(p_oOcc, p_a_Symbols){
    var nSymbolNum = p_oOcc.SymbolNum();
    
    var bHit = false;
    for(var nSym=0; nSym<p_a_Symbols.length; nSym++){
        if(nSymbolNum == p_a_Symbols[nSym]){
            bHit = true;
            break;
        }
    }
    return bHit;
}

/*
Checks if the attribute SAP-Functiontype has the correct value p_nAttrValue
*/
function checkObjectSapType(p_oObjDef, p_nAttrValue){
    var oAttr = p_oObjDef.Attribute(Constants.AT_SAP_FUNC_TYPE, g_nLoc);
    if(oAttr.IsMaintained()){
        var nValue = oAttr.MeasureUnitTypeNum();
        if(nValue == p_nAttrValue){
            return true;
        }else{
            return false;
        }
    }else{
        return true;
    }
}


/*
Checks the superior objdefs of the model have  the correct SAP Modeltype value p_nAttrValue
p_bExactelyOne: true= exactely one ; false=  at least one
*/
function checkSuperiorObjectType(p_oModel, p_bExactelyOne, p_nAttrValueNum){
    var nHits = 0;
    var a_SuperiorObjDefs = p_oModel.SuperiorObjDefs();
    
    for (var nDef=0; nDef<a_SuperiorObjDefs.length; nDef++){
        if(checkObjectSapType(a_SuperiorObjDefs[nDef], p_nAttrValueNum)){
            nHits ++;    
        }
    }
    
    if(p_bExactelyOne){
        return (nHits == 1);
    }else{
        return (nHits > 0);
    }
}

function checkModelTypeNum(p_oModel, a_AllowedModelTypes){
    var bHit = false;
    
    var nModelTypeNum = p_oModel.TypeNum();
    
    for(var i=0; i<a_AllowedModelTypes.length; i++){
        if(a_AllowedModelTypes[i] == nModelTypeNum){
            bHit =  true;
            break;
        }
    }
     
    return bHit;
}

main();
