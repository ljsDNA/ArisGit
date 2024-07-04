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

var lang = Context.getSelectedLanguage();
var selectedDB = ArisData.getSelectedDatabases()[0];
var selectedModel = ArisData.getSelectedModels()[0];
var selectedGroup = ArisData.getSelectedGroups()[0];
var g_oComponentUMC = Context.getComponent("UMC");
var MT_MODELs = [Constants.MT_VAL_ADD_CHN_DGM, Constants.MT_ENTERPRISE_BPMN_COLLABORATION, Constants.MT_ENTERPRISE_BPMN_PROCESS, Constants.MT_EEPC];
var allProcessedModels = new Array();
var allProcessedSubProcessModels = new Array();
var allValidProcessModels = new Array();

var n_act_excel_row = 0;
var act_sheet = null;
var default_cell_style = null;
var first_cell_style = null;

function holder(sModelName, sFunctionName, sFunctionDesc, sModelOwner, sFunctionCriticality, sRiskName, sRiskDesc, sRiskOwner, sRiskImpact, sRiskProbability )
{
    this.modelName = sModelName;
    this.functionName = sFunctionName;
    this.functionDesc = sFunctionDesc;
    this.modelOwner = sModelOwner;
    this.functionCriticality = sFunctionCriticality;
    this.riskName = sRiskName;
    this.riskDesc = sRiskDesc;
    this.riskOwner = sRiskOwner;
    this.riskImpact = sRiskImpact;
    this.riskProbability = sRiskProbability;
}

var aHolderArray = [];

var excel_output_file = Context.createExcelWorkbook(getString("OUTPUT_NAME"));
act_sheet = excel_output_file.createSheet ( getString("SHEET_NAME") );

var red_font_style = excel_output_file.getFont(getString("FONT"), 10, RGBInt(255,0,0), true, false, false, false, Constants.XL_FONT_SS_NONE);
error_cell_style = excel_output_file.createCellStyle(red_font_style,  1, 1, 1, 1, 1, 1, 1, 1, 0, 2, Constants.C_WHITE, RGBInt(255, 255, 255), Constants.SOLID_FOREGROUND);

main();

excel_output_file.write();

function main() 
{
    
    if (selectedDB != null)  //Database is context
    {
        var mainGroup = selectedDB.RootGroup();
        var models = mainGroup.ModelList(true,MT_MODELs);
        if (models.length!=0)
        {
            gatherInformation(models);
            outputToExcel();
        }
        else
        {
            var sErrorText = formatstring3(getString("NO_MODELS_FOUND_IN_DB"),
                                            ArisData.ActiveFilter().ModelTypeName(Constants.MT_ENTERPRISE_BPMN_COLLABORATION),
                                            ArisData.ActiveFilter().ModelTypeName(Constants.MT_ENTERPRISE_BPMN_PROCESS),
                                            ArisData.ActiveFilter().ModelTypeName(Constants.MT_EEPC)); 
             Dialogs.MsgBox(sErrorText);
             act_sheet.cell(n_act_excel_row,0).setCellStyle(error_cell_style);
             act_sheet.cell(n_act_excel_row, 0).setCellValue(sErrorText);
        }
    }
    if (selectedModel != null)  //Model is context
    {
        var models = getProcessModelsRecursive(selectedModel);
        models.push(selectedModel);
        var uniqueModels = ArisData.Unique(models);
        gatherInformation(uniqueModels);
        outputToExcel();
    }
    
    if (selectedGroup != null)    //Group is context
    {
        var models = selectedGroup.ModelList(true,MT_MODELs);
        if (models.length!=0)
        {
            gatherInformation(models);
            outputToExcel();
        }
        else
        {
            var sErrorText = formatstring3(getString("NO_MODELS_FOUND_IN_GROUP"),             
                                            ArisData.ActiveFilter().ModelTypeName(Constants.MT_ENTERPRISE_BPMN_COLLABORATION),
                                            ArisData.ActiveFilter().ModelTypeName(Constants.MT_ENTERPRISE_BPMN_PROCESS),
                                            ArisData.ActiveFilter().ModelTypeName(Constants.MT_EEPC)); 
             Dialogs.MsgBox(sErrorText);
             act_sheet.cell(n_act_excel_row,0).setCellStyle(error_cell_style);
             act_sheet.cell(n_act_excel_row, 0).setCellValue(sErrorText);
        }
    }
    
}

function gatherInformation(pModels, checkBPMNsubprocessIfSelectedModelIsBPMNcollDig)
{
    for (var h=0; h<pModels.length; h++)
    {
        var objOccList = pModels[h].ObjOccList();
        for (var i=0; i<objOccList.length; i++)
        {
            if (objOccList[i].ObjDef().TypeNum() == Constants.OT_FUNC && objOccList[i].SymbolNum() != Constants.ST_PRCS_IF)
            {
                var aFunctionObjDefs = objOccList[i].ObjDef();
                
                var aRiskObjDefs = aFunctionObjDefs.getConnectedObjs([Constants.OT_RISK], Constants.EDGES_IN, [Constants.CT_OCCUR]);
                if (aRiskObjDefs.length > 0)
                {
                    for (var j=0; j<aRiskObjDefs.length; j++)
                        aHolderArray.push(new holder(pModels[h].Name(lang), aFunctionObjDefs.Name(lang), aFunctionObjDefs.Attribute(Constants.AT_DESC, lang).getValue(), getUsersName(pModels[h].Attribute(Constants.AT_PERS_RESP, lang).getValue()), aFunctionObjDefs.Attribute(Constants.AT_CRITICALITY, lang).getValue(), aRiskObjDefs[j].Name(lang), aRiskObjDefs[j].Attribute(Constants.AT_DESC, lang).getValue(),getUsersName(aRiskObjDefs[j].Attribute(Constants.AT_PERS_RESP, lang).getValue()), aRiskObjDefs[j].Attribute(Constants.AT_AAM_IMPACT, lang).getValue(), aRiskObjDefs[j].Attribute(Constants.AT_AAM_PROBABILITY, lang).getValue()));
                }
                else
                {
                    aHolderArray.push(new holder(pModels[h].Name(lang), aFunctionObjDefs.Name(lang), aFunctionObjDefs.Attribute(Constants.AT_DESC, lang).getValue(), getUsersName(pModels[h].Attribute(Constants.AT_PERS_RESP, lang).getValue()), aFunctionObjDefs.Attribute(Constants.AT_CRITICALITY, lang).getValue(), "", "","", "", ""));
                }
            }
        }
    }
}

function outputToExcel()
{
    //write header
    
        writeHeader(excel_output_file);
        var font_style = excel_output_file.getFont(getString("FONT"), 10, RGBInt(0,0,0), false, false, false, false, Constants.XL_FONT_SS_NONE);
        default_cell_style = excel_output_file.createCellStyle(font_style,  1, 1, 1, 1, 1, 1, 1, 1, 0, 2, Constants.C_WHITE, RGBInt(255, 255, 255), Constants.SOLID_FOREGROUND);
        
        var font_style = excel_output_file.getFont(getString("FONT"), 10, RGBInt(0,0,0), true, false, false, false, Constants.XL_FONT_SS_NONE);
        first_cell_style = excel_output_file.createCellStyle(font_style,  1, 1, 1, 1, 1, 1, 1, 1, 0, 2, Constants.C_WHITE, RGBInt(255, 255, 255), Constants.SOLID_FOREGROUND);
    
    
     aHolderArray = aHolderArray.sort(sortHolderElements);
     //aHolderArray = aHolderArray.sort(sortByRiskObjName);
     
     for (var i=0; i<aHolderArray.length; i++)
     {
            var n_col = 0; 
            act_sheet.cell(n_act_excel_row, 0).setCellStyle(first_cell_style);
            act_sheet.cell(n_act_excel_row, n_col++).setCellValue(aHolderArray[i].modelName);
            act_sheet.cell(n_act_excel_row,n_col).setCellStyle(default_cell_style);
            act_sheet.cell(n_act_excel_row, n_col++).setCellValue(aHolderArray[i].modelOwner);
            act_sheet.cell(n_act_excel_row,n_col).setCellStyle(default_cell_style);
            act_sheet.cell(n_act_excel_row, n_col++).setCellValue(aHolderArray[i].functionName);
            act_sheet.cell(n_act_excel_row,n_col).setCellStyle(default_cell_style);
            act_sheet.cell(n_act_excel_row, n_col++).setCellValue(aHolderArray[i].functionDesc);
            act_sheet.cell(n_act_excel_row,n_col).setCellStyle(default_cell_style);
																								 
																				   
            act_sheet.cell(n_act_excel_row, n_col++).setCellValue(aHolderArray[i].functionCriticality);
            act_sheet.cell(n_act_excel_row,n_col).setCellStyle(default_cell_style);
            act_sheet.cell(n_act_excel_row, n_col++).setCellValue(aHolderArray[i].riskName);
            act_sheet.cell(n_act_excel_row,n_col).setCellStyle(default_cell_style);
            act_sheet.cell(n_act_excel_row, n_col++).setCellValue(aHolderArray[i].riskDesc);
            act_sheet.cell(n_act_excel_row,n_col).setCellStyle(default_cell_style);
            act_sheet.cell(n_act_excel_row, n_col++).setCellValue(aHolderArray[i].riskOwner);
            act_sheet.cell(n_act_excel_row,n_col).setCellStyle(default_cell_style);
            act_sheet.cell(n_act_excel_row, n_col++).setCellValue(aHolderArray[i].riskImpact);
            act_sheet.cell(n_act_excel_row,n_col).setCellStyle(default_cell_style);
            act_sheet.cell(n_act_excel_row, n_col++).setCellValue(aHolderArray[i].riskProbability);
            
            
            n_act_excel_row++;
     }
}

function writeHeader(o_wb){
    var font_style = o_wb.getFont(getString("FONT"), 10, RGBInt(255,255,255), true, false, false, false, Constants.XL_FONT_SS_NONE);
    var header_style = o_wb.createCellStyle(font_style,  1, 1, 1, 1, 1, 1, 1, 1, 0, 2, Constants.C_WHITE, RGBInt(0, 112, 150), Constants.SOLID_FOREGROUND);
    
    var n_col = 0; 
    
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("MODEL_NAME"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("MODEL_OWNER"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("ACTIVITY"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("ACTIVITY_DESC"));
																					   
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("CRITICALITY"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("RISK"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("RISK_DESC"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("RISK_OWNER"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("RISK_IMPACT"));
    act_sheet.cell(n_act_excel_row, n_col++).setCellValue(getString("RISK_PROB"));
    
    for(var i = n_col; i > 0; i--){
        act_sheet.cell(n_act_excel_row, i-1).setCellStyle(header_style);
        act_sheet.setColumnWidth( i-1, 6000 );
    }
    
    n_act_excel_row++;
}

function RGBInt(r, g, b){
    return (new java.awt.Color(r/255.0,g/255.0,b/255.0,1)).getRGB();
}


function sortByRiskObjName(a,b)
{
    if (a.riskName != "")
    {
    //var valA = a.modelName+a.riskName;
    //var valB = b.modelName+b.riskName;
    return a.modelName+a.riskName.compareToIgnoreCase(b.modelName+b.riskName);
    }
    return -100;
}


function sortHolderElements(a, b)
{
   var aSort = a.modelName+a.riskName;
   var bSort = b.modelName+b.riskName;
     
   if (aSort>bSort)
       return 1;
   if (aSort<bSort)
       return -1;
  
  return 0;
}


function getProcessModelsRecursive(pSelectedModel)
{
    var processModels= new Array();
    
    var objOccListFromSelectedModel = pSelectedModel.ObjOccList();
    
    for (var q=0; q<objOccListFromSelectedModel.length ; q++)
    {
        var objDefFromSelectedModel = objOccListFromSelectedModel[q].ObjDef();
        if (objOccListFromSelectedModel[q].SymbolNum() != Constants.ST_PRCS_IF && objDefFromSelectedModel.TypeNum() == Constants.OT_FUNC)
        {
                var assignedProcessModels = objDefFromSelectedModel.AssignedModels(MT_MODELs);
                for (var k=0; k<assignedProcessModels.length; k++)
                {
                    if (assignedProcessModels[k].GUID != pSelectedModel.GUID())
                    {
                        if (!inArray(assignedProcessModels[k], allValidProcessModels))
                        {
                            allValidProcessModels.push(assignedProcessModels[k]);
                            var temp = getProcessModelsRecursive(assignedProcessModels[k]);
                        }
                    }
                }
        }
    
    }
    
    return allValidProcessModels;
}


function inArray(oItem, aItems) 
{
     for (var i in aItems) 
     {
         if (aItems[i].equals(oItem)) return true;
     }
     return false;
}


function getUsersName(sLogin) {
    if (sLogin != null && sLogin != "") {
        var oUser = g_oComponentUMC.getUserByName(sLogin);
        if (isValidName(oUser)) {
            return oUser.getFirstName() +" "+oUser.getLastName();
        }
        else return sLogin;
    }
    return "";

    function isValidName(oUser) {
        return oUser != null && oUser.getFirstName() != "" && oUser.getLastName() != "";
    }
}