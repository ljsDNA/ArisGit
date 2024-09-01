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

//==================================CLEAN OBJECT AND MODEL NAMES REPORT================================

var nloc = Context.getSelectedLanguage();
var outfile = Context.createOutputObject();
outfile.DefineF("HEAD", getString("TEXT_14"), 8, Constants.C_BLACK, 0xFF9912, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
outfile.DefineF("STD", getString("TEXT_14"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
outfile.DefineF("BOLD", getString("TEXT_14"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
outfile.DefineF("GREY", getString("TEXT_14"), 8, Constants.C_GREY_80_PERCENT, Constants.C_TRANSPARENT, Constants.FMT_CENTER | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);

var optionsDialog;
var cNames = new java.util.HashMap();
var options = {};

function main(){
    // Determine the context
    var groups = ArisData.getSelectedGroups();
    var objects = ArisData.getSelectedObjDefs();
    var isRunOnGroup = (groups != null && groups.length > 0)?true:false;
    // Get options from user. Options can be used like this: options.inclSubgroups
    options = showOptionsDialog(isRunOnGroup);
    // TODO Logic & logging
    if(options.Result==1){
        var outArr = new Array();
        var outHM = new java.util.HashMap();
        //Collecting objects in case of start on Group
        if(isRunOnGroup){
            var cGroups = new Array();
            if(options.inclSubgroups==1){
                for(var i=0; i<groups.length;i++){
                    objects = objects.concat(groups[i].ObjDefList(true));
                }
            }
            else{
                for(var i=0; i<groups.length;i++){
                    objects = objects.concat(groups[i].ObjDefList());
                }
            }
        }//:end collecting objects
        objects.sort(oSort);
        //iterating over objdefs
        for(var i=0; i<objects.length;i++){
            if(options.deleteDisturbing==1){
                objects[i]=clearName(objects[i]);
            }
            if((options.reportName==1)&&(options.syncronize!=1)){
                outHM.put(objects[i].GUID(),getInfo(objects[i],1));
            }
            else if(options.syncronize==1){
                outHM.put(objects[i].GUID(),getInfo(objects[i],2));
            }
        }//:end iterating over objects
        outputSet(options);
        if(options.syncronize==1){
            output_Ex(outHM,2);
            outfile.EndTable(getString("TEXT_1"), 100, getString("TEXT_14"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER, 0);
        }
        else if((options.reportName==1)&&(options.syncronize!=1)){
            output_Ex(outHM,1);
            outfile.EndTable(getString("TEXT_1"), 100, getString("TEXT_14"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER, 0);
        }
        outfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());     
    } else {
        // AGA-16766 - Do not create empty output because dialog was canceled
        Context.setProperty( Constants.PROPERTY_SHOW_OUTPUT_FILE, false );
        Context.setProperty( Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false );
    }
}

function getInfo(obj,param){
    var retArr = new java.util.HashMap();
    
    var oName = getString("TEXT_2");
    var oType = getString("TEXT_3");
    var oSymbol = getString("TEXT_4");
    var oPath = getString("TEXT_5");
    var amName;
    if(param==1){
        amName = getString("TEXT_6");
    }
    else if(param==2){
        amName = getString("TEXT_7");
    }
    var amType = getString("TEXT_8");
    var amPath = getString("TEXT_9");
    var oNameSync = getString("TEXT_10");
    
    retArr.put(oName,obj.Name(nloc));
    retArr.put(oType,obj.Type());
    
    //many occs - may be many symbols
    var occs = obj.OccList();
    var sTypes = new java.util.HashMap();
    for(var i=0;i<occs.length;i++){
        if(!sTypes.containsKey(occs[i].SymbolName())){
            sTypes.put(occs[i].SymbolName(),i.toString());
        }
    }
    retArr.put(oSymbol,sTypes.keySet().toArray().sort().join(","));
    
    retArr.put(oPath,obj.Group().Path(nloc));
    //Assigned models
    sTypes.clear();

    retArr.put(amType,new Array());
    retArr.put(amPath,new Array());
    retArr.put(amName,new Array());
    if(param==1) retArr.put(oNameSync,new Array());

    var aModel = obj.AssignedModels();
    for (var i = 0; i < aModel.length; i++) {
        var oModel = aModel[i];
        retArr.put(amType,addValue(retArr, amType, oModel.Type()));
        retArr.put(amPath,addValue(retArr, amPath, oModel.Group().Path(nloc)));
        
        if(param==1){
            var modelName = oModel.Name(nloc);
            retArr.put(amName,addValue(retArr, amName, modelName));
            retArr.put(oNameSync,addValue(retArr, oNameSync, (retArr.get(oName).equals(modelName)) ? getString("TEXT_27") : getString("TEXT_28")));
        }
        if(param==2){
            var modelName = oModel.Name(nloc);            
            if(!retArr.get(oName).equals(modelName)){
                if(!cNames.containsKey(oModel.GUID())){
                    retArr.put(amName,addValue(retArr, amName, modelName));
                    cNames.put(oModel.GUID(),modelName);
                    aModel[i].Attribute(Constants.AT_NAME,nloc).setValue(obj.Name(nloc));
                }
                else{
                    retArr.put(amName,addValue(retArr, amName, getString("TEXT_11")+ArisData.getActiveDatabase().FindGUID(oModel.GUID()).Name(nloc)+"\""));   
                }
            }
            else retArr.put(amName,addValue(retArr, amName, ""));
        }
    }
    return retArr;
    
    function addValue(retArr, key, value) {
        var aValues = retArr.get(key);
        aValues.push(value);
        return aValues;
    }
}
//Output Settings
function outputSet(options){
    
    outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    outfile.TableRow();
        outfile.TableCellF(getString("TEXT_12"), 50, "HEAD");
        outfile.TableCellF(getString("TEXT_13"), 50, "HEAD");

    outfile.TableRow();
        outfile.TableCellF(getString("TEXT_15"), 50, "BOLD");
        outfile.TableCellF(ArisData.getActiveUser().Name(nloc) , 50, "STD");
    
    outfile.TableRow();
        outfile.TableCellF(getString("TEXT_16"), 50, "BOLD");
        outfile.TableCellF(ArisData.getActiveDatabase().Name(nloc), 50, "STD");
    
    outfile.TableRow();
        outfile.TableCellF(getString("TEXT_17"), 50, "BOLD");
        outfile.TableCellF(Context.getScriptInfo(Constants.SCRIPT_NAME), 50, "STD");

        outfile.TableRow();
        outfile.TableCellF(getString("TEXT_18"), 50, "BOLD");
        
    var sett = new Array();
    if(options.inclSubgroups ==1) sett.push(getString("TEXT_19"));
    if(options.deleteDisturbing ==1) sett.push(getString("TEXT_20"));
    if(options.reportName ===1) sett.push(getString("TEXT_21"));
    if(options.syncronize ===1) sett.push(getString("TEXT_22"));
        
    outfile.TableCellF(sett.join(",\n"), 50, "STD");
    outfile.EndTable(getString("TEXT_23"), 100, getString("TEXT_14"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER, 0);
}

//Report output
function output_Ex(oHM,repType){
    var colHeadings = new Array();
    colHeadings.push(getString("TEXT_2"));      // 0
    colHeadings.push(getString("TEXT_3"));      // 1
    colHeadings.push(getString("TEXT_4"));      // 2
    colHeadings.push(getString("TEXT_5"));      // 3
    if(repType==1){
        colHeadings.push(getString("TEXT_6"));  // 4
    }
    else if(repType==2){
        colHeadings.push(getString("TEXT_7"));  // 4
    }
    colHeadings.push(getString("TEXT_8"));      // 5
    colHeadings.push(getString("TEXT_9"));      // 6
    if(repType==1){
        colHeadings.push(getString("TEXT_10")); // 7
    }
    
    var colWidth = 100/colHeadings.length;
    outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    outfile.TableRow();
    for(var i=0;i<colHeadings.length;i++){
        outfile.TableCellF(colHeadings[i], colWidth, "HEAD");
    }
    
    var aSet = oHM.keySet().toArray();
    var outputArr = new Array();
    
    for(var i=0;i<aSet.length;i++){
        outputArr.push(oHM.get(aSet[i].toString()));
    }
    outputArr.sort(sortHM);
    
    for(var i=0;i<outputArr.length;i++){
        outfile.TableRow();
        outfile.TableCellF(outputArr[i].get(colHeadings[0]), colWidth, "STD");
        outfile.TableCellF(outputArr[i].get(colHeadings[1]), colWidth, "STD");
        outfile.TableCellF(outputArr[i].get(colHeadings[2]), colWidth, "STD");
        outfile.TableCellF(outputArr[i].get(colHeadings[3]), colWidth, "STD");
        
        var entry = outputArr[i].get(colHeadings[4]);
        if (entry instanceof Array && entry.length > 1) {
            for (var k = 0; k < entry.length; k++) {
                if (k > 0) {
                    outfile.TableRow();
                    outfile.TableCellF(outputArr[i].get(colHeadings[0]), colWidth, "GREY");
                    outfile.TableCellF(outputArr[i].get(colHeadings[1]), colWidth, "GREY");
                    outfile.TableCellF(outputArr[i].get(colHeadings[2]), colWidth, "GREY");
                    outfile.TableCellF(outputArr[i].get(colHeadings[3]), colWidth, "GREY");
                }
                outfile.TableCellF(outputArr[i].get(colHeadings[4])[k], colWidth, "STD");
                outfile.TableCellF(outputArr[i].get(colHeadings[5])[k], colWidth, "STD");
                outfile.TableCellF(outputArr[i].get(colHeadings[6])[k], colWidth, "STD");
                if(repType==1){
                    outfile.TableCellF(outputArr[i].get(colHeadings[7])[k], colWidth, "STD");
                }
            }
        } else {
            outfile.TableCellF(outputArr[i].get(colHeadings[4]), colWidth, "STD");
            outfile.TableCellF(outputArr[i].get(colHeadings[5]), colWidth, "STD");
            outfile.TableCellF(outputArr[i].get(colHeadings[6]), colWidth, "STD");
            if(repType==1){
                outfile.TableCellF(outputArr[i].get(colHeadings[7]), colWidth, "STD");
            }
        }
    }
}
//sort function for HM
function sortHM(a,b){
    var val_1 = a.get(getString("TEXT_2"));   
    var val_2 = b.get(getString("TEXT_2"));      
    
    var bResult;
    bResult = val_1.compareTo(val_2);
    return bResult;    
}
//sort function for array of objects
function oSort(a,b){
    var val_1 = a.Name(nloc);   
    var val_2 = b.Name(nloc);      
    
    var bResult;
    bResult = val_1.compareTo(val_2);
    return bResult; 
}

//Deleting disturbig blanks in object names
function clearName(oDef){
    var sName = oDef.Attribute(Constants.AT_NAME,nloc).getValue();
    sName = sName.replaceAll("  ", " ");
    sName = sName.replaceAll(" \n", "\n");
    sName = sName.replaceAll(" \r", "\r");
    oDef.Attribute(Constants.AT_NAME,nloc).setValue(sName);

    return oDef;
}

//Options dialog
function showOptionsDialog(isRunOnGroup) {
    var optionsDialogTemplate = Dialogs.createNewDialogTemplate(100, 100,getString("TEXT_24"), "dialogListener");
    
    optionsDialogTemplate.GroupBox(10,10,430,70, getString("TEXT_25"), "groupObjectGroupBox");
        optionsDialogTemplate.CheckBox(35,25,400,20, getString("TEXT_19"), "inclSubgroupsCheckBox");
        optionsDialogTemplate.CheckBox(35,45,400,20, getString("TEXT_20"), "deleteDisturbingCheckBox");
        
    optionsDialogTemplate.GroupBox(10,90,430,70, getString("TEXT_26"), "assignmentGroupBox");
        optionsDialogTemplate.CheckBox(35,110,400,20, getString("TEXT_21"), "reportNameCheckBox");
        optionsDialogTemplate.CheckBox(35,130,400,20, getString("TEXT_22"), "syncronizeCheckBox");
    
    optionsDialogTemplate.OKButton();
    optionsDialogTemplate.CancelButton();
//    optionsDialogTemplate.HelpButton("HID_d22d4c20_9764_11dc_3aad_0013d40f32cd_dlg_01.hlp");

    optionsDialog = Dialogs.createUserDialog(optionsDialogTemplate);
    
    // Read dialog settings from config
    var sSection = "SCRIPT_d22d4c20_9764_11dc_3aad_0013d40f32cd";   
    ReadSettingsDlgValue(optionsDialog, sSection, "inclSubgroupsCheckBox", 0);
    ReadSettingsDlgValue(optionsDialog, sSection, "deleteDisturbingCheckBox", 0);
    ReadSettingsDlgValue(optionsDialog, sSection, "reportNameCheckBox", 0);
    ReadSettingsDlgValue(optionsDialog, sSection, "syncronizeCheckBox", 0);

    optionsDialog.setDlgEnable("inclSubgroupsCheckBox", isRunOnGroup);
    
    var dialogResult = Dialogs.show( __currentDialog = optionsDialog);
    
    options.inclSubgroups = optionsDialog.getDlgValue("inclSubgroupsCheckBox");    
    options.deleteDisturbing = optionsDialog.getDlgValue("deleteDisturbingCheckBox");
    options.reportName = optionsDialog.getDlgValue("reportNameCheckBox");
    options.syncronize = optionsDialog.getDlgValue("syncronizeCheckBox");
  
    // Write dialog settings to config  
    if (dialogResult != 0) {  
        WriteSettingsDlgValue(optionsDialog, sSection, "inclSubgroupsCheckBox");
        WriteSettingsDlgValue(optionsDialog, sSection, "deleteDisturbingCheckBox");
        WriteSettingsDlgValue(optionsDialog, sSection, "reportNameCheckBox");
        WriteSettingsDlgValue(optionsDialog, sSection, "syncronizeCheckBox");
    }    
    return options;
}

//Dialog listener
function dialogListener(dlgItem, action, suppValue){
    var result = false;
    var wasTicked = false;
    
    switch(action) {
    case 1: 
        if ((__currentDialog.getDlgValue("deleteDisturbingCheckBox") == 1) ||
            (__currentDialog.getDlgValue("reportNameCheckBox") == 1) ||
            (__currentDialog.getDlgValue("syncronizeCheckBox") == 1)) {
                __currentDialog.setDlgEnable("OK",true);
        } else {
                __currentDialog.setDlgEnable("OK",false);
        }
        if (__currentDialog.getDlgValue("syncronizeCheckBox") == 1) {
                __currentDialog.setDlgEnable("reportNameCheckBox",false);
        }
    case 2://CheckBox, DropListBox, ListBox or OptionGroup: value changed . CancelButton, OKButton or PushButton: button pressed
    {
        if (dlgItem.equals("syncronizeCheckBox")&&(suppValue)){
            
            wasTicked = optionsDialog.getDlgValue("reportNameCheckBox");//?true:false;
            
            optionsDialog.setDlgValue("reportNameCheckBox", true);
            
            optionsDialog.setDlgEnable("reportNameCheckBox", false);
            result = true;
        } else if (dlgItem.equals("syncronizeCheckBox")&&(!suppValue)){
            optionsDialog.setDlgEnable("reportNameCheckBox", true);
            if(!wasTicked){
                optionsDialog.setDlgValue("reportNameCheckBox", false);
            }
            if(wasTicked){
                optionsDialog.setDlgValue("reportNameCheckBox", true);
            }
            result = true;
        }
        if ((dlgItem.equals("deleteDisturbingCheckBox")&&(suppValue==1))
            ||(dlgItem.equals("reportNameCheckBox")&&(suppValue==1))
            ||(dlgItem.equals("syncronizeCheckBox")&&(suppValue==1))){
                
            optionsDialog.setDlgEnable("OK",true);
        }
        else if((optionsDialog.getDlgValue("reportNameCheckBox")!=1)
                 &&(optionsDialog.getDlgValue("deleteDisturbingCheckBox")!=1)
                 &&(optionsDialog.getDlgValue("syncronizeCheckBox")!=1)){
            optionsDialog.setDlgEnable("OK",false);
        }
        if(dlgItem.equals("OK")){
            options.Result = 1;
        }
    }
    case 3://ComboBox oder TextBox: Der Text des Dialogelements wurde geändert und das Element verliert den Focus. SuppValue enthält die Länge des Texts.
    case 4://Das Dialogelement DlgItem erhält den Focus. SuppValue ist das Element, das den Focus verliert (Index, 0-basiert)
    case 5://Idle processing.
    case 6://Funktionstaste (F1-F24) wurde gedrückt. DlgItem hat den Fokus. SuppValue enthält die Nummer der Funktionstaste und den Zustand der Umschalt- (+ 0x0100), Strg- (+ 0x0200) und Alt-Taste (+ 0x0400)
    case 7://Doppelklick auf einer Tabelle oder einem Listenelement (ohne Editor). Tabelle: Spalte=SuppValue/10000 Index der Zeile = SuppValue - column*10000
    case 8://TableEditChange: Der Anwender hat eine Tabellenzelle editiert. SuppValue enthält den Index der geänderten Spalte und Zeile
    break;
  }

  return result;    
}

main();