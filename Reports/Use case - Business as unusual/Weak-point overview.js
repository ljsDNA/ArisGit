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

//search by risk objdef in this model or the report will look for each function if a risk object is connected 
var search_by_risk_directry = false; //false go on definition level for Functions

Object.defineProperty(Array.prototype, 'contains', {
    enumerable: false,
    value: Array.prototype.contains = function(p_element)
        {
            for (var i=0; i<this.length; i++) {
                if(this[i].equals(p_element)){
                    return true;
                }
            }
            // not found
            return false;
        }
});

const gnLoc = Context.getSelectedLanguage();

var umc_comp = Context.getComponent("UMC");

var n_act_excel_row = 0;
var act_sheet = null;
var default_cell_style = null;
var first_cell_style = null

var a_output_objects = [];

var OUTPUT_WRAPPER = function(p_model, p_risk, p_func){
    this.model = p_model;
    this.risk = p_risk;
    this.func = p_func;
}

function main(){
    var a_models = getEPCandBPMNs();
    
    //search for risk
    for(var i = 0; i < a_models.length; i++){
        //todo get risk object in model
        if(search_by_risk_directry){
            var a_risks_in_model = a_models[i].ObjOccListFilter(Constants.OT_RISK);
            for(var j = 0; j < a_risks_in_model.length; j++){
                var a_connected_functions = a_risks_in_model[j].getConnectedObjOccs([
                    Constants.ST_FUNC, 
                    Constants.ST_BPMN_MANUAL_TASK_2, 
                    Constants.ST_BPMN_RECEIVE_TASK, 
                    Constants.ST_BPMN_BUSINESS_RULE_TASK, 
                    Constants.ST_BPMN_SCRIPT_TASK, 
                    Constants.ST_BPMN_RECEIVE_TASK]);//all occs 
                    
                for(var k = 0; k < a_connected_functions.length; k++){
                    
                    //output_risk_info(a_models[i], a_risks_in_model[j].ObjDef(), a_connected_functions[k].ObjDef());
                    a_output_objects.push(new OUTPUT_WRAPPER(a_models[i], a_risks_in_model[j].ObjDef(), a_connected_functions[k].ObjDef()));
                }
                
            }
        }else{
            //can be invisible satelite object, thats why it is objdef
            var a_func_in_model = a_models[i].ObjDefListByTypes([Constants.OT_FUNC]);
            for(var j = 0; j < a_func_in_model.length; j++){
                
                var a_connected_risk = a_func_in_model[j].getConnectedObjs([Constants.OT_RISK], Constants.EDGES_IN, [Constants.CT_OCCUR]);//get connected risks 
                    
                for(var k = 0; k < a_connected_risk.length; k++){
                    //if(a_connected_risk[k].OccListInModel(a_models[i]).length > 0){ // can be invisible satelite Object!
                        //output_risk_info(a_models[i], a_connected_risk[k], a_func_in_model[j]);
                        a_output_objects.push(new OUTPUT_WRAPPER(a_models[i], a_connected_risk[k], a_func_in_model[j]));
                    //}
                    
                }
                
            }
        }
        
        
    }
    
    //sort wrapper object
    a_output_objects.sort(function (a, b) {
        //sort by risk
        if (a.risk.Name(gnLoc) > b.risk.Name(gnLoc)) {
            return 1;
        }
        if (a.risk.Name(gnLoc) < b.risk.Name(gnLoc)) {
            return -1;
        }
        //if risk is equal
        //sort by model
        if (a.model.Name(gnLoc) > b.model.Name(gnLoc)) {
            return 1;
        }
        if (a.model.Name(gnLoc) < b.model.Name(gnLoc)) {
            return -1;
        }
        //is model is all so equal
        //sort by func
        if (a.func.Name(gnLoc) > b.func.Name(gnLoc)) {
            return 1;
        }
        if (a.func.Name(gnLoc) < b.func.Name(gnLoc)) {
            return -1;
        }
        //then equals
        return 0;
    });
    
    //create output
    var excel_output_file = Context.createExcelWorkbook(getString("OUTPUT_NAME"));
    act_sheet = excel_output_file.createSheet ( getString("SHEET_NAME") );
    
    //write header
    if(a_models.length > 0){
        writeHeader(excel_output_file);
        var font_style = excel_output_file.getFont(getString("FONT"), 10, RGBInt(0,0,0), false, false, false, false, Constants.XL_FONT_SS_NONE);
        default_cell_style = excel_output_file.createCellStyle(font_style,  1, 1, 1, 1, 1, 1, 1, 1, 0, 2, Constants.C_WHITE, RGBInt(255, 255, 255), Constants.SOLID_FOREGROUND);
        
        var font_style = excel_output_file.getFont(getString("FONT"), 10, RGBInt(0,0,0), true, false, false, false, Constants.XL_FONT_SS_NONE);
        first_cell_style = excel_output_file.createCellStyle(font_style,  1, 1, 1, 1, 1, 1, 1, 1, 0, 2, Constants.C_WHITE, RGBInt(255, 255, 255), Constants.SOLID_FOREGROUND);
    }
    
    //output all found risks
    for(var i = 0; i < a_output_objects.length; i++){
        output_risk_info(a_output_objects[i].model, a_output_objects[i].risk, a_output_objects[i].func);
    }
    
    //output if no elements found
    if(a_models.length == 0){
        act_sheet.cell(n_act_excel_row, 0).setCellValue(getString("NO_MODELS_FOUND"));
    }else if(a_output_objects.length == 0){
        act_sheet.cell(n_act_excel_row, 0).setCellValue(getString("MODELS_WITHOUT_RISKS"));
    }
    
    excel_output_file.write();
}

/***
*   get int from r,g,b
*
*   @param r - red, number between 0 - 255
*   @param g - green, number between 0 - 255
*   @param b - blue, number between 0 - 255
*   @result INT als RGB value
*/
function RGBInt(r, g, b){
    return (new java.awt.Color(r/255.0,g/255.0,b/255.0,1)).getRGB();
}

/***
*   Write headers in the excel
*
*   @param o_wb - excel workbook
*/
function writeHeader(o_wb){
    var font_style = o_wb.getFont(getString("FONT"), 10, RGBInt(255,255,255), true, false, false, false, Constants.XL_FONT_SS_NONE);
    var header_style = o_wb.createCellStyle(font_style,  1, 1, 1, 1, 1, 1, 1, 1, 0, 2, Constants.C_WHITE, RGBInt(0, 112, 150), Constants.SOLID_FOREGROUND);
    
    var n_col = 0; 
    
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("RISK"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("RISK_DESC"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("RISK_OWNER"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("RISK_IMPACT"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("RISK_PROB"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("RISK_SOL_DESC"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("RISK_PRIO"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("IMPL_SOL_STATUS"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("IMPL_SOL_HORIZON"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("IMPL_SOL_COMPLEX"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("IMPL_SOL_COST"));
    
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("ACTIVITY"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("ACTIVITY_DESC"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("ACTIVITY_OWNER"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("ACTIVITY_CRIT"));
    
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("MODEL_NAME"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("MODEL_DESC"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("MODEL_CAT"));
    
    for(var i = n_col; i > 0; i--){
        act_sheet.cell(n_act_excel_row, i-1).setCellStyle(header_style);
        act_sheet.setColumnWidth( i-1, 6000 );
    }
    
    n_act_excel_row++;
}

/***
*   Write information from model, risk, and function object
*
*   @param o_model
*   @param o_risk - risk object
*   @param o_func - function object
*/
function output_risk_info(o_model, o_risk, o_func){
    
    var n_col = 0; 
    
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_risk.Attribute(Constants.AT_NAME, gnLoc).getValue());
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_risk.Attribute(Constants.AT_DESC, gnLoc).getValue());
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getResponsible_from_umc(o_risk));//o_risk.Attribute(Constants.AT_PERS_RESP, gnLoc).getValue()
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_risk.Attribute(Constants.AT_AAM_IMPACT, gnLoc).getValue());
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_risk.Attribute(Constants.AT_AAM_PROBABILITY, gnLoc).getValue());
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_risk.Attribute(Constants.AT_POSSIBLE_SOLUTION, gnLoc).getValue());
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_risk.Attribute(Constants.AT_PRIORITY_INTERNAL, gnLoc).getValue());
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_risk.Attribute(Constants.AT_IMPLEMENTATION_STATUS, gnLoc).getValue());
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_risk.Attribute(Constants.AT_IMPLEMENTATION_HORIZON, gnLoc).getValue());
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_risk.Attribute(Constants.AT_REALIZATION_CATEGORY, gnLoc).getValue());
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_risk.Attribute(Constants.AT_IMPLEMENTATION_COSTS, gnLoc).getValue());
    
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_func.Attribute(Constants.AT_NAME, gnLoc).getValue());
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_func.Attribute(Constants.AT_DESC, gnLoc).getValue());
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getResponsible_from_umc(o_model));//o_func.Attribute(Constants.AT_PERS_RESP, gnLoc).getValue()
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_func.Attribute(Constants.AT_CRITICALITY, gnLoc).getValue());
    
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_model.Attribute(Constants.AT_NAME, gnLoc).getValue());
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_model.Attribute(Constants.AT_DESC, gnLoc).getValue());
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(o_model.Attribute(Constants.AT_PROCESS_TYPE, gnLoc).getValue());
    
    for(var i = n_col; i > 0; i--){
        act_sheet.cell(n_act_excel_row, i-1).setCellStyle(default_cell_style);
    }
    act_sheet.cell(n_act_excel_row, 0).setCellStyle(first_cell_style);
    
    
    n_act_excel_row++;
}

/***
*   Get the Last and First name of a user from the UMC. When the Attribute AT_PERS_RESP doesn't contains a umc user, the value of this attribute will be returned
*
*   @param o_obj - obj to check
*   @result string - name of the umc user or value of the attribute
*/
function getResponsible_from_umc(o_obj){
    var s_return_value = "";
    
    if(o_obj.Attribute(Constants.AT_PERS_RESP, gnLoc).IsMaintained()){
        s_return_value = o_obj.Attribute(Constants.AT_PERS_RESP, gnLoc).getValue();
        //go to Umc end try to find user!
        try{
            var umc_user = umc_comp.getUserByName(s_return_value);
            if (isValidName(umc_user)) { 
                s_return_value = umc_user.getLastName() + " " + umc_user.getFirstName();
            }
        }catch(ex){
            //do nothing
        }
    }
    
    return s_return_value;
    
    function isValidName(oUser) {
        return oUser != null && oUser.getFirstName() != "" && oUser.getLastName() != "";
    }     
}

/***
*   Determine BPMN and EPC models from the selected context.
*   When a VACD model is selected, all assigned BPMN and EPC will be returned.
*
*   @result array of bpmn/epc models
*/
function getEPCandBPMNs(){
    var a_selected_items = [];
    
    
    if(ArisData.getSelectedDatabases().length > 0){
        
        //go over database
        var o_database = ArisData.getSelectedDatabases()[0];
        a_selected_items = o_database.Find(Constants.SEARCH_MODEL, [Constants.MT_VAL_ADD_CHN_DGM, Constants.MT_EEPC, Constants.MT_ENTERPRISE_BPMN_COLLABORATION, Constants.MT_ENTERPRISE_BPMN_PROCESS]);
        
    }else if(ArisData.getSelectedGroups().length > 0){
        
        //go over groups
        var a_groups = ArisData.getSelectedGroups();
        for(var i = 0; i < a_groups.length; i++){
            a_selected_items = a_selected_items.concat(a_groups[i].ModelList(true, [Constants.MT_VAL_ADD_CHN_DGM, Constants.MT_EEPC, Constants.MT_ENTERPRISE_BPMN_COLLABORATION, Constants.MT_ENTERPRISE_BPMN_PROCESS]));
        }
        
    }else{
        
        //search for bpmn and epcs recursive
        var a_models = ArisData.getSelectedModels();
        for(var i = 0; i < a_models.length; i++){
            a_selected_items = a_selected_items.concat(getEPCandBPMNRecursive(a_models[i], []));
        }
        a_selected_items = ArisData.Unique(a_selected_items);
    }
    
    return a_selected_items;
}

/***
*   Determine recursive from an vacd all assigned epc and bpmn models  
*
*   @param o_model - model to check
*   @param blackbox - array of models
*   @result array of bpmn/epc models
*/
function getEPCandBPMNRecursive(o_model, blackbox){
    //if is epc or bpmn, dont go deeper!
    if(o_model.TypeNum() == Constants.MT_EEPC || 
        o_model.TypeNum() == Constants.MT_ENTERPRISE_BPMN_COLLABORATION ||
        o_model.TypeNum() == Constants.MT_ENTERPRISE_BPMN_PROCESS){
        return [o_model];
    }
    
    var a_models_found = [];
    
    //if is vacd go deeper!
    if(o_model.TypeNum() == Constants.MT_VAL_ADD_CHN_DGM){
        
        //go over each function in model
        var a_functions = o_model.ObjDefListByTypes([Constants.OT_FUNC]);
        for(var i = 0; i < a_functions.length; i++){
            
            //check assignments in function
            var a_assigned_models = a_functions[i].AssignedModels([Constants.MT_EEPC, Constants.MT_ENTERPRISE_BPMN_COLLABORATION, Constants.MT_ENTERPRISE_BPMN_PROCESS, Constants.MT_VAL_ADD_CHN_DGM]);
            for(var j = 0; j < a_assigned_models.length; j++){
                //go recursive
                if(!blackbox.contains(a_assigned_models[j])){
                    blackbox.push(a_assigned_models[j]);
                    a_models_found = a_models_found.concat(getEPCandBPMNRecursive(a_assigned_models[j], blackbox));
                }
               
            }
            
        }
        
        a_models_found = a_models_found.concat([o_model]);
        
    }
    
    return a_models_found;
}

main();



