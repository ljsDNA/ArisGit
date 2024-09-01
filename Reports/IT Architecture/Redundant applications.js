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

function OPTIONS_TYPE() {
    this.bOut_Func    = false;
    this.bOut_IsFunc  = false;
    this.bOut_DataIn  = false;
    this.bOut_DataOut = false;
    this.bOut_RedOnly = false;    
}

function REDUNDANCY_TYPE(p_oCurrAWST, p_oConnObj, p_aRedObjList) {
    this.oCurrAWST    = p_oCurrAWST;
    this.oConnObj     = p_oConnObj;
    this.aRedObjList  = p_aRedObjList;
}

var g_nLoc = Context.getSelectedLanguage(); 
var g_oOutfile = Context.createOutputObject(Context.getSelectedFormat(), Context.getSelectedFile());
g_oOutfile.Init(g_nLoc);

main();

/* ---------------------------------------------------------------------------- */

function main() {
    var tOptions = new OPTIONS_TYPE();
    
    if (dlgSelectOptions(tOptions)) {
        setReportHeaderFooter(g_oOutfile, g_nLoc, false, false, false);
        
        var oApplSysTypes = ArisData.getSelectedObjDefs();
        oApplSysTypes.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nLoc).compare);
        
        if (tOptions.bOut_Func) {
            var aRedundancy_Func = getRedundancy(oApplSysTypes, 1);
            outRedundancy(aRedundancy_Func, tOptions.bOut_RedOnly, 1);
        }
        if (tOptions.bOut_IsFunc) {
            var aRedundancy_IsFunc = getRedundancy(oApplSysTypes, 2);
            outRedundancy(aRedundancy_IsFunc, tOptions.bOut_RedOnly, 2);
        }
        if (tOptions.bOut_DataIn) {
            var aRedundancy_DataIn = getRedundancy(oApplSysTypes, 3);
            outRedundancy(aRedundancy_DataIn, tOptions.bOut_RedOnly, 3);
        }
        if (tOptions.bOut_DataOut) {
            var aRedundancy_DataOut = getRedundancy(oApplSysTypes, 4);
            outRedundancy(aRedundancy_DataOut, tOptions.bOut_RedOnly, 4);
        }
        g_oOutfile.WriteReport();
    } else {
        Context.setScriptError(Constants.ERR_CANCEL);        
    }
}

function getRedundancy(p_oApplSysTypes, p_nCheckType) {
    var aRedundancy = new Array();

    for (var i = 0 ; i < p_oApplSysTypes.length ; i++ ) {
        var oApplSysType = p_oApplSysTypes[i];
    
        switch(p_nCheckType) {
            case 1:         // Functions
                var oFuncList = getConnectedObjects(oApplSysType, Constants.EDGES_OUT, Constants.CT_CAN_SUPP_1, Constants.OT_FUNC);
                oFuncList.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nLoc).compare);
                
                for (var j = 0 ; j < oFuncList.length ; j++ ) {
                    var oFunc = oFuncList[j];
                    var oRedObjList = getRedundantApplSysTypes(oApplSysType, oFunc, Constants.EDGES_IN, Constants.CT_CAN_SUPP_1);
                    aRedundancy.push(new REDUNDANCY_TYPE(oApplSysType, oFunc, oRedObjList));
                }
                break;
            case 2:         // IS Functions
                var oIsFuncList = getConnectedObjects(oApplSysType, Constants.EDGES_OUT, Constants.CT_CAN_SUPP_1, Constants.OT_IS_FUNC);
                oIsFuncList.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nLoc).compare);
                
                for (var j = 0 ; j < oIsFuncList.length ; j++ ) {
                    var oIsFunc = oIsFuncList[j];
                    var oRedObjList = getRedundantApplSysTypes(oApplSysType, oIsFunc, Constants.EDGES_IN, Constants.CT_CAN_SUPP_1);
                    aRedundancy.push(new REDUNDANCY_TYPE(oApplSysType, oIsFunc, oRedObjList));
                }
                break;
            case 3:         // Incoming Data
                var oDataList = new Array();
                oDataList = oDataList.concat(getConnectedObjects(oApplSysType, Constants.EDGES_IN, Constants.CT_IS_INP_FOR, Constants.OT_CLST));
                oDataList = oDataList.concat(getConnectedObjects(oApplSysType, Constants.EDGES_IN, Constants.CT_IS_INP_FOR, Constants.OT_CLS));                
                oDataList.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nLoc).compare);
                
                for (var j = 0 ; j < oDataList.length ; j++ ) {
                    var oData = oDataList[j];
                    var oRedObjList = getRedundantApplSysTypes(oApplSysType, oData, Constants.EDGES_OUT, Constants.CT_IS_INP_FOR);
                    aRedundancy.push(new REDUNDANCY_TYPE(oApplSysType, oData, oRedObjList));
                }
                break;
            case 4:         // Outgoing Data
                var oDataList = new Array();
                oDataList = oDataList.concat(getConnectedObjects(oApplSysType, Constants.EDGES_OUT, Constants.CT_HAS_OUT, Constants.OT_CLST));
                oDataList = oDataList.concat(getConnectedObjects(oApplSysType, Constants.EDGES_OUT, Constants.CT_HAS_OUT, Constants.OT_CLS));                
                oDataList.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nLoc).compare);
                
                for (var j = 0 ; j < oDataList.length ; j++ ) {
                    var oData = oDataList[j];
                    var oRedObjList = getRedundantApplSysTypes(oApplSysType, oData, Constants.EDGES_IN, Constants.CT_HAS_OUT);
                    aRedundancy.push(new REDUNDANCY_TYPE(oApplSysType, oData, oRedObjList));
                }
                break;
        }
    }
    return aRedundancy;

}

function outRedundancy(p_aRedundancy, bRedundanciesOnly, p_nCheckType) {
    var sTitle1 = getString("TEXT_1");
    var sTitle2 = "";
    var sTitle3 = "";
    var sTitle4 = getString("TEXT_2");

    switch(p_nCheckType) {
        case 1:         // Functions
            sTitle2 = getString("TEXT_3");
            sTitle3 = getString("TEXT_4");
            break;    
        case 2:         // IS Functions
            sTitle2 = getString("TEXT_5");
            sTitle3 = getString("TEXT_4");
            break;    
        case 3:         // Incoming Data
            sTitle2 = getString("TEXT_6");
            sTitle3 = getString("TEXT_7");
            break;    
        case 4:         // Outgoing Data
            sTitle2 = getString("TEXT_8");
            sTitle3 = getString("TEXT_9");
            break;    
    }    
    g_oOutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    g_oOutfile.TableRow();
    g_oOutfile.TableCell(sTitle1, 28, getString("TEXT_10"), 10, Constants.C_BLACK, Constants.C_LIGHT_ORANGE, 0, Constants.FMT_CENTER | Constants.FMT_BOLD, 0);
    g_oOutfile.TableCell(sTitle2, 28, getString("TEXT_10"), 10, Constants.C_BLACK, Constants.C_LIGHT_ORANGE, 0, Constants.FMT_CENTER | Constants.FMT_BOLD, 0);
    g_oOutfile.TableCell(sTitle3, 28, getString("TEXT_10"), 10, Constants.C_BLACK, Constants.C_LIGHT_ORANGE, 0, Constants.FMT_CENTER | Constants.FMT_BOLD, 0);
    g_oOutfile.TableCell(sTitle4, 16, getString("TEXT_10"), 10, Constants.C_BLACK, Constants.C_LIGHT_ORANGE, 0, Constants.FMT_CENTER | Constants.FMT_BOLD, 0);

    var bColoredTableCell = false;
    for (var i = 0 ; i < p_aRedundancy.length ; i++ ) {
        var bOut = bRedundanciesOnly ? (p_aRedundancy[i].aRedObjList.length > 0) : true;
        
        if (bOut) {
            g_oOutfile.TableRow();
            g_oOutfile.TableCell(p_aRedundancy[i].oCurrAWST.Name(g_nLoc, true), 28, getString("TEXT_10"), 10, Constants.C_BLACK, getTablecellColor(bColoredTableCell), 0, Constants.FMT_LEFT, 0);
            g_oOutfile.TableCell(p_aRedundancy[i].oConnObj.Name(g_nLoc, true), 28, getString("TEXT_10"), 10, Constants.C_BLACK, getTablecellColor(bColoredTableCell), 0, Constants.FMT_LEFT, 0);
            var sRedObj = "";
            if (p_aRedundancy[i].aRedObjList.length > 0) {
                sRedObj = p_aRedundancy[i].aRedObjList[0].Name(g_nLoc, true);
            }
            g_oOutfile.TableCell(sRedObj, 28, getString("TEXT_10"), 10, Constants.C_BLACK, getTablecellColor(bColoredTableCell), 0, Constants.FMT_LEFT, 0);
            g_oOutfile.TableCell(Math.round(p_aRedundancy[i].aRedObjList.length), 16, getString("TEXT_10"), 10, Constants.C_BLACK, getTablecellColor(bColoredTableCell), 0, Constants.FMT_CENTER, 0);
            
            for (var j = 1 ; j < p_aRedundancy[i].aRedObjList.length ; j++ ) {            
                g_oOutfile.TableRow();
                g_oOutfile.TableCell("", 28, getString("TEXT_10"), 10, Constants.C_BLACK, getTablecellColor(bColoredTableCell), 0, Constants.FMT_LEFT, 0);
                g_oOutfile.TableCell("", 28, getString("TEXT_10"), 10, Constants.C_BLACK, getTablecellColor(bColoredTableCell), 0, Constants.FMT_LEFT, 0);
                g_oOutfile.TableCell(p_aRedundancy[i].aRedObjList[j].Name(g_nLoc, true), 28, getString("TEXT_10"), 10, Constants.C_BLACK, getTablecellColor(bColoredTableCell), 0, Constants.FMT_LEFT, 0);
                g_oOutfile.TableCell("", 16, getString("TEXT_10"), 10, Constants.C_BLACK, getTablecellColor(bColoredTableCell), 0, Constants.FMT_CENTER, 0);
            }
            bColoredTableCell = !bColoredTableCell;
        }
    }
    var sSheet = "";
    if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX)
        sSheet = sTitle2;
    g_oOutfile.EndTable(sSheet, 100, getString("TEXT_10"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);            
}

function getRedundantApplSysTypes(p_oCurrApplSysType, p_objDef, p_cxnKind, p_cxnTypeNum) {
    var oApplSysTypes_redundant = new Array();
    
    var oApplSysTypes_tmp = getConnectedObjects(p_objDef, p_cxnKind, p_cxnTypeNum, Constants.OT_APPL_SYS_TYPE);
    oApplSysTypes_tmp.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nLoc).compare);

    for (var i = 0 ; i < oApplSysTypes_tmp.length ; i++ ) {
        var oApplSysType_tmp = oApplSysTypes_tmp[i];
        if (!oApplSysType_tmp.IsEqual(p_oCurrApplSysType)) {
            oApplSysTypes_redundant.push(oApplSysType_tmp);
        }
    }
    return oApplSysTypes_redundant;
}

function getConnectedObjects(p_objDef, p_cxnKind, p_cxnTypeNum, p_connectObjTypeNum) {
    var aConnectObjDefs = new Array();

    var oCxns = p_objDef.CxnListFilter(p_cxnKind, p_cxnTypeNum);
    for (var i = 0; i < oCxns.length; i++ ) {
        var oConnectObjDef;
        if (p_cxnKind == Constants.EDGES_OUT) {
            oConnectObjDef = oCxns[i].TargetObjDef();
        } else {
            oConnectObjDef = oCxns[i].SourceObjDef();                
        }
        if (oConnectObjDef.TypeNum() == p_connectObjTypeNum) {
            aConnectObjDefs.push(oConnectObjDef);        
        }
    }    
    return aConnectObjDefs;
}

function dlgSelectOptions(p_tOptions) {
    var nuserdlg = 0;   // Variable for the user dialog box
    
    var userdialog = Dialogs.createNewDialogTemplate(500, 120, getString("TEXT_11"), "dlgFuncSelectOptions");
    // %GRID:10,7,1,1
    userdialog.GroupBox(10, 10, 480, 130, "");    
    userdialog.Text(20, 20, 450, 28, getString("TEXT_12"));
    userdialog.CheckBox(20, 50, 440, 15, getString("TEXT_3"), "var_func");
    userdialog.CheckBox(20, 65, 440, 15, getString("TEXT_5"), "var_isfunc");
    userdialog.CheckBox(20, 80, 440, 15, getString("TEXT_13"), "var_data");
    userdialog.CheckBox(40, 95, 420, 15, getString("TEXT_6"), "var_dataIn");
    userdialog.CheckBox(40, 110, 420, 15, getString("TEXT_8"), "var_dataOut");
    userdialog.CheckBox(10, 150, 480, 15, getString("TEXT_14"), "var_redOnly");
    userdialog.OKButton();
    userdialog.CancelButton();
    userdialog.HelpButton("HID_ea61a690_16ed_11db_50fe_a7595c13ae66_dlg_01.hlp");
    
    var dlg = Dialogs.createUserDialog(userdialog);

    // Read dialog settings from config    
    var sSection = "SCRIPT_ea61a690_16ed_11db_50fe_a7595c13ae66";
    ReadSettingsDlgValue(dlg, sSection, "var_func", 0);
    ReadSettingsDlgValue(dlg, sSection, "var_isfunc", 0);
    ReadSettingsDlgValue(dlg, sSection, "var_dataIn", 0);
    ReadSettingsDlgValue(dlg, sSection, "var_dataOut", 0);
    ReadSettingsDlgValue(dlg, sSection, "var_redOnly", 0);

    nuserdlg = Dialogs.show( __currentDialog = dlg);    // Showing dialog and waiting for confirmation with OK
    
    p_tOptions.bOut_Func    = __currentDialog.getDlgValue("var_func") != 0;
    p_tOptions.bOut_IsFunc  = __currentDialog.getDlgValue("var_isfunc") != 0;
    p_tOptions.bOut_DataIn  = __currentDialog.getDlgValue("var_dataIn") != 0;
    p_tOptions.bOut_DataOut = __currentDialog.getDlgValue("var_dataOut") != 0;
    p_tOptions.bOut_RedOnly = __currentDialog.getDlgValue("var_redOnly") != 0;
    
    if (nuserdlg == 0) {
        return false;
    } else {
        // Write dialog settings to config    
        WriteSettingsDlgValue(dlg, sSection, "var_func");
        WriteSettingsDlgValue(dlg, sSection, "var_isfunc");
        WriteSettingsDlgValue(dlg, sSection, "var_dataIn");
        WriteSettingsDlgValue(dlg, sSection, "var_dataOut");
        WriteSettingsDlgValue(dlg, sSection, "var_redOnly");
    }
    return true;
}

function dlgFuncSelectOptions(dlgitem, action, suppvalue) {
    var result = false;
    
    switch(action) {
        case 1:
            // Init
            __currentDialog.setDlgEnable("var_data", false);
            
            if (__currentDialog.getDlgValue("var_dataIn") != 0 || __currentDialog.getDlgValue("var_dataOut")) {
                __currentDialog.setDlgValue("var_data", 1);
            }            
            break;
        case 2:
            switch(dlgitem) {
                case "var_dataIn":
                case "var_dataOut":
                     if (__currentDialog.getDlgValue("var_dataIn") != 0 || __currentDialog.getDlgValue("var_dataOut")) {
                        __currentDialog.setDlgValue("var_data", 1);
                    } else {
                        __currentDialog.setDlgValue("var_data", 0);
                    }
                    result = true;
                break;
            }
            break;
    }
    return result;
}

function getTablecellColor(p_bColored) {
    if (p_bColored)
        return Constants.C_LIGHT_YELLOW;
    
    return Constants.C_TRANSPARENT;    
}