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

var g_rowData = new Array();
var g_oDatabase = ArisData.getActiveDatabase();
var g_nLoc = Context.getSelectedLanguage(); 
var g_oOutfile = Context.createOutputObject(Context.getSelectedFormat(), Context.getSelectedFile());

initStyles(g_oOutfile, getString("FONT"));

outTitlePage(g_oOutfile, getString("FONT"), getString("TITLE"), getString("LABEL_DATE"));

outHeaderFooter(g_oOutfile, getString("FONT"), getString("FOOTER_RIGHT"));
    
g_oOutfile.BeginTable(100, convertToDoubles([20, 10, 20, 20, 30]), COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
g_oOutfile.TableRow();
g_oOutfile.TableCellF(getString("TEXT_3"), 1, 1, "TBL_HEAD");
g_oOutfile.TableCellF("↔", 1, 1, "TBL_HEAD");
g_oOutfile.TableCellF(getString("TEXT_4"), 1, 1, "TBL_HEAD");
g_oOutfile.TableCellF(getString("TEXT_6"), 1, 1, "TBL_HEAD");
g_oOutfile.TableCellF(getString("TEXT_5"), 1, 1, "TBL_HEAD");

var tableContent = Context.getProperty("DataFlow");
if (tableContent != null) {    
    outDataFlow_byMacro(tableContent);
} else {
    outDataFlow_byReport();
}    

g_oOutfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);        
g_oOutfile.WriteReport();

function outDataFlow_byReport() {
    g_rowData = new Array();

    // Application system types selected
    var oSelApplSystemList = getSelectedApplSystems();
    
    // only Dataflow between selected application systems?
    var bOnlyBetween = false;    
    if (oSelApplSystemList.length >= 2) {
        var sQuestion = getString("TEXT_8")
        if (Dialogs.MsgBox(sQuestion, Constants.MSGBOX_ICON_QUESTION | Constants.MSGBOX_BTN_YESNO, getString("TEXT_9")) == Constants.MSGBOX_RESULT_YES) {
            bOnlyBetween = true;
        }            
    }
    
    var aRowData = getTableContent(oSelApplSystemList, bOnlyBetween);
    var bColoredTableCell = false;        
    if (aRowData.length > 0) {
        var sSource, sDirection, sTarget, sProtocol, aoData, nRowSpan;
        
        for (var i = 0; i < aRowData.length; i++) {
            sSource = getName(aRowData[i].oSource);
            sDirection = aRowData[i].sDirection == DIRECTION_OUT ? "→" : "←";
            sTarget = getName(aRowData[i].oTarget);
            sProtocol = getName(aRowData[i].oProtocol);
            aoData = aRowData[i].oData;
            nRowSpan = aoData != null && aoData.length > 1 ? aoData.length : 1;
            
            g_oOutfile.TableRow();
            g_oOutfile.TableCellF(sSource, nRowSpan, 1, getStyleColored("TBL_STD", bColoredTableCell));
            g_oOutfile.TableCellF(sDirection, nRowSpan, 1, getStyleColored("TBL_STD", bColoredTableCell));
            g_oOutfile.TableCellF(sTarget, nRowSpan, 1, getStyleColored("TBL_STD", bColoredTableCell));
            g_oOutfile.TableCellF(sProtocol, nRowSpan, 1, getStyleColored("TBL_STD", bColoredTableCell));
            g_oOutfile.TableCellF(aoData != null && aoData.length > 0 ? getName(aoData[0]) : "", 1, 1, getStyleColored("TBL_STD", bColoredTableCell));
            if (aoData != null && aoData.length > 1) {
                for (j=1; j<aoData.length; j++) {
                    g_oOutfile.TableRow();
                    g_oOutfile.TableCellF(getName(aoData[j]), 1, 1, getStyleColored("TBL_STD", bColoredTableCell));
                }
            }
            bColoredTableCell = !bColoredTableCell;                    
        }
    } else {
            g_oOutfile.TableRow();        
            g_oOutfile.TableCellF("", 1, 5, getStyleColored("TBL_STD", bColoredTableCell));
    }
}

function outDataFlow_byMacro(p_tableContent) {
    var bColoredTableCell = false; 

    var rowTokenizer = new java.util.StringTokenizer(p_tableContent, ";");
    while(rowTokenizer.hasMoreTokens()) {
        g_oOutfile.TableRow();
        var rowContent = rowTokenizer.nextToken();
        var nCount = 0;    
        
        columnTokenizer = new java.util.StringTokenizer(rowContent, ",");
        while(columnTokenizer.hasMoreTokens()) {
            nCount++;
            var sTableEntry = "" + columnTokenizer.nextToken();
            if (nCount != 2) { // The second column contains the direction indicators
                sTableEntry = getNameByGuid(sTableEntry); // nextToken = Guid of object
            }
            g_oOutfile.TableCellF(sTableEntry, 1, 1, getStyleColored("TBL_STD", bColoredTableCell));
            bColoredTableCell = !bColoredTableCell;
        }
    }
}

function getNameByGuid(p_sGuid) {
    var sName = "";
    if (p_sGuid.length > 0) {
        var oItem = g_oDatabase.FindGUID(p_sGuid);
        if (oItem.IsValid()) {
            sName = oItem.Name(g_nLoc);
        }
    }
    return sName;
}

function getSelectedApplSystems() {
    var oSelObjDefs = ArisData.getSelectedObjDefs();
    var oSelectionByType = new Array();
    for (var i = 0; i < oSelObjDefs.length; i++) {
        var oObjDef = oSelObjDefs[i];
        if (oObjDef.TypeNum() == Constants.OT_APPL_SYS_TYPE) {
            oSelectionByType.push(oObjDef);
        }
    }
    oSelectionByType.sort(sortByName);
    return oSelectionByType;
}
