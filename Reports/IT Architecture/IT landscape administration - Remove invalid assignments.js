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
 
var g_oFilter = ArisData.getActiveDatabase().ActiveFilter();
var g_oPsmConfig = new psmConfig(false);

var invalidCxns = getInvalidCxns();
if (invalidCxns.length > 0) {
    var doRemove = Dialogs.MsgBox(formatstring1(getString("MSG_REMOVE_ALLOCATION"), invalidCxns.length), Constants.MSGBOX_BTN_YESNO | Constants.MSGBOX_ICON_WARNING | 256, getString("MSG_TITLE")) == Constants.MSGBOX_RESULT_YES;

    var oOut = Context.createOutputObject();
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0);
    outHeader(oOut);
    
    for (var i = 0; i < invalidCxns.length; i++) {
        var invalidCxn = invalidCxns[i];
        
        outputInvalidCxn(oOut, invalidCxn, doRemove);
    }
    oOut.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT, 0);
    oOut.WriteReport();
} else {
    Dialogs.MsgBox(getString("MSG_NO_INVALID_ALLOCATIONS"), Constants.MSGBOX_BTN_OK, getString("MSG_TITLE"));
}

function getInvalidCxns() {
    var invalidCxns = new Array();
    // get all process support units
    var allUnitDefs = ArisData.getActiveDatabase().Find(Constants.SEARCH_OBJDEF, Constants.OT_PROCESS_SUPPORT_UNIT);
    for (var i = 0; i < allUnitDefs.length; i++) {
        var oUnitDef = allUnitDefs[i];
        // get assigned it systems
        var incomingCxns = oUnitDef.CxnListFilter(Constants.EDGES_IN, Constants.CT_BELONGS_TO_PROC_SUPPORT_UNIT);
        for (var j = 0; j < incomingCxns.length; j++) {
            var oCxn =  incomingCxns[j];
            if (oCxn.Attribute(Constants.AT_PROC_SUPPORT_STATUS, language).IsMaintained()){
                var oAstDef = oCxn.SourceObjDef();            
                if (!g_oPsmConfig.isValidAllocation(oAstDef)) invalidCxns.push(oCxn);
            }    
        }
    }
    return invalidCxns.sort(sortCxns);

    function sortCxns(a, b) {
        return SortByNameReport(a.SourceObjDef(), b.SourceObjDef());
    }
}

function removeInvalidCxn(invalidCxn) {
    var result = invalidCxn.Attribute(Constants.AT_PROC_SUPPORT_STATUS, language).Delete();
    if (result) invalidCxn.TargetObjDef().Touch();
    return result;
    //return invalidCxn.Attribute(Constants.AT_PROC_SUPPORT_STATUS, language).setValue(g_oFilter.AttrValueType(Constants.AVT_PHASED_IN));
}

function outputInvalidCxn(oOut, invalidCxn, doRemove) {
    var oUnitDef = invalidCxn.TargetObjDef();
    var oAstDef = invalidCxn.SourceObjDef();
    
    var sRowHeader = getRowHeader(oUnitDef);
    var sColumnHeader = getColumnHeader(oUnitDef);
    var sName = oAstDef.Name(language, true);
    var sType = oAstDef.Type(true);
    var sStatus = invalidCxn.Attribute(Constants.AT_PROC_SUPPORT_STATUS, language).getValue();
    // delete invalid cxn
    var isRemoved = doRemove ? removeInvalidCxn(invalidCxn) : false;    
    
    oOut.TableRow();
    oOut.TableCell(sRowHeader, 30, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VCENTER, 0);
    oOut.TableCell(sColumnHeader, 30, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VCENTER, 0);
    oOut.TableCell(sName, 30, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VCENTER, 0);
    oOut.TableCell(sType, 30, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VCENTER, 0);
    oOut.TableCell(sStatus, 30, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VCENTER, 0);
    oOut.TableCell(isRemoved ? "X" : "", 30, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
}

function outHeader(oOut) {
    oOut.TableRow();
    oOut.TableCell(getString("ROW_HEADER"), 30, getString("FONT"), 10, Constants.C_BLACK, Constants.C_GREY_80_PERCENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VCENTER, 0);
    oOut.TableCell(getString("COLUMN_HEADER"), 30, getString("FONT"), 10, Constants.C_BLACK, Constants.C_GREY_80_PERCENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VCENTER, 0);
    oOut.TableCell(getString("NAME_OF_ALLOCATION"), 30, getString("FONT"), 10, Constants.C_BLACK, Constants.C_GREY_80_PERCENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VCENTER, 0);
    oOut.TableCell(getString("TYPE_OF_ALLOCATION"), 30, getString("FONT"), 10, Constants.C_BLACK, Constants.C_GREY_80_PERCENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VCENTER, 0);
    oOut.TableCell(getString("PROCESS_SUPPORT_STATUS"), 30, getString("FONT"), 10, Constants.C_BLACK, Constants.C_GREY_80_PERCENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VCENTER, 0);
    oOut.TableCell(getString("REMOVED"), 10, getString("FONT"), 10, Constants.C_BLACK, Constants.C_GREY_80_PERCENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VCENTER, 0);
}

function getRowHeader(oUnitDef) {
    var allCxns = oUnitDef.CxnList();
    for (var i = 0; i < allCxns.length; i++) {
        var oCxn = allCxns[i];
        var oConnDef = (!oCxn.SourceObjDef().IsEqual(oUnitDef)) ? oCxn.SourceObjDef() : oCxn.TargetObjDef();
        
        if (isRowHeaderObj(oConnDef.TypeNum())) return oConnDef.Name(language, true);
    }
    return "";
}    

function getColumnHeader(oUnitDef) {
    var allCxns = oUnitDef.CxnList();
    for (var i = 0; i < allCxns.length; i++) {
        var oCxn = allCxns[i];
        var oConnDef = (!oCxn.SourceObjDef().IsEqual(oUnitDef)) ? oCxn.SourceObjDef() : oCxn.TargetObjDef();
    
        if (isColHeaderObj(oConnDef.TypeNum())) return oConnDef.Name(language, true);
    }
    return "";
}    
