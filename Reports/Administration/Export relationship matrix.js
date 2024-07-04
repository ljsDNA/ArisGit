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

 // Report Configuration
const SHOW_DIALOGS_IN_CONNECT = false;   // Show dialogs in ARIS Connect - Default=false (BLUE-12274)

/****************************************************/

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

var c_sDefault = "x";
var c_sMulti = "*";
var c_nBlue = new java.awt.Color(0.6, 0.8, 1).getRGB();
var c_nDefaultWidth = 30; 
var c_nMaxCol = 254; 

// Dialog support depends on script runtime environment (STD resp. BP, TC)
var g_bDialogsSupported = isDialogSupported();

var g_nLoc = Context.getSelectedLanguage();
var g_oOutfile = Context.createOutputObject();
var g_oFilter = ArisData.getActiveDatabase().ActiveFilter();

var g_bIsDefaultUsed = false;

g_oOutfile.DefineF("HEAD", getString("TEXT_1"), 10, Constants.C_BLACK, c_nBlue, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VCENTER, 0, 0, 0, 0, 0, 1);
g_oOutfile.DefineF("COL_HEAD", getString("TEXT_1"), 10, Constants.C_BLACK, c_nBlue, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VCENTER, 0, 0, 0, 0, 0, 1);
g_oOutfile.DefineF("ROW_HEAD", getString("TEXT_1"), 10, Constants.C_BLACK, c_nBlue, Constants.FMT_BOLD | Constants.FMT_VERT_UP | Constants.FMT_VCENTER, 0, 0, 0, 0, 0, 1);
g_oOutfile.DefineF("CELL", getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0, 0, 0, 0, 0, 1);

main();

/********************************************************************/

function main() {
    var oModels = getRelevantModels();
    if (oModels.length > 0) {
        for (var i = 0; i < oModels.length; i++) {
            var oModel = oModels[i];
            var oMatrixModel = oModel.getMatrixModel();
            if (oMatrixModel != null) {
                var nIndex = 1;
                var mCxnAliases = oMatrixModel.getCxnAliases(g_nLoc);
                
                var colHeaderCells = getHeaderCells(oMatrixModel, false);
                var nVisibleCxnTypes = getVisibleCxnTypes(oMatrixModel);
                
                var nColStart = 0;
                var nColEnd = colHeaderCells.length;
                if (nColEnd > (nColStart + c_nMaxCol)) {
                    nColEnd = nColStart + c_nMaxCol;
                }
                
                if (colHeaderCells.length == 0) {
                    // Anubis 394018 - Output of empty model(s)
                    g_oOutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
                    g_oOutfile.EndTable(getExcelSheetName31(oModel.Name(g_nLoc), nIndex++), 100, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                }
                
                while (nColStart < colHeaderCells.length) {
                    g_oOutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
                    g_oOutfile.TableRow();
                    g_oOutfile.TableCellF(oMatrixModel.getHeader(true).getTitle(g_nLoc) + " - " + oMatrixModel.getHeader(false).getTitle(g_nLoc), 30, "HEAD");
                    
                    for (var j = nColStart; j < nColEnd; j++) {
                        g_oOutfile.TableCellF(getHeaderCellName(colHeaderCells[j]), 30, "ROW_HEAD");
                    }
                    
                    var rowHeaderCells = getHeaderCells(oMatrixModel, true);
                    for (var j = 0; j < rowHeaderCells.length; j++) {
                        g_oOutfile.TableRow();
                        g_oOutfile.TableCellF(getHeaderCellName(rowHeaderCells[j]), 30, "COL_HEAD");
                        
                        for (var k = nColStart; k < nColEnd; k++) {
                            g_oOutfile.TableCellF(getContentCellEntry(oMatrixModel, colHeaderCells[k], rowHeaderCells[j], nVisibleCxnTypes, mCxnAliases), 30, "CELL");
                        }
                    }
                    addLegend(mCxnAliases);
                    g_oOutfile.EndTable(getExcelSheetName31(oModel.Name(g_nLoc), nIndex++), 100, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    
                    nColStart = nColEnd;
                    nColEnd = colHeaderCells.length;
                    if (nColEnd > (nColStart + c_nMaxCol)) {
                        nColEnd = nColStart + c_nMaxCol;
                    }
                }
            }
        }
        g_oOutfile.WriteReport();
    } else {
        if (g_bDialogsSupported) {
            Dialogs.MsgBox(getString("TEXT_2"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, getString("TEXT_3"));
            Context.setScriptError(Constants.ERR_NOFILECREATED);
        } else {
            outEmptyResult();     // BLUE-10824 Output empty result in Connect
        }
    }
}

function outEmptyResult() {
    g_oOutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_oOutfile.TableRow();
    g_oOutfile.TableCell(getString("TEXT_7"), 100, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
    g_oOutfile.EndTable("", 100, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_oOutfile.WriteReport();
}

function getVisibleCxnTypes(p_oMatrixModel) {
    var nVisibleCxnTypes = new Array();
    
    var aCxnData = p_oMatrixModel.getCxnData();
    for (var i = 0; i < aCxnData.length; i++) {
        if (aCxnData[i].isVisible()) {
            nVisibleCxnTypes.push(aCxnData[i].getCxnType());
        }
    }
    return nVisibleCxnTypes;
}

function getContentCellEntry(p_oMatrixModel, p_colHeaderCell, p_rowHeaderCell, p_nVisibleCxnTypes, p_mCxnAliases) {
    var mCellEntry = new java.util.HashMap();
    
    if (p_colHeaderCell.getDefinition() == null || p_rowHeaderCell.getDefinition() == null) {
        return "";
    }
    
    var contentCell = p_oMatrixModel.getContentCell(p_colHeaderCell, p_rowHeaderCell);
    if (contentCell == null) return "";   
    
    var visibleCellCxns = new Array();              // Anubis 378725 
    
    var cellCxns = contentCell.getCxns();
    for (var i = 0; i < cellCxns.length; i++) {
        var nTypeNum = cellCxns[i].TypeNum();
        
        if (isVisibleType(nTypeNum, p_nVisibleCxnTypes)) {
            var sAlias = getAlias(nTypeNum, p_mCxnAliases);
            var nCount = 1;
            if (mCellEntry.containsKey(sAlias)) {
                nCount = nCount + Number(mCellEntry.get(sAlias));
            }
            mCellEntry.put(sAlias, nCount);
            visibleCellCxns.push(cellCxns[i]);
        }
    }
    if (mCellEntry.size() == 0) return "";          // Anubis 378725   
    
    var sCellEntry = "";
    var cellEntrySet = mCellEntry.keySet(); 
    var iter = cellEntrySet.iterator();
    while (iter.hasNext()) {
        var key = iter.next();
        var value = mCellEntry.get(key);    
        
        sCellEntry = sCellEntry + key;
        if (Number(value) > 1) {
            sCellEntry = sCellEntry + c_sMulti;
        }
    }
    if (isTargetObject(p_rowHeaderCell.getDefinition(), visibleCellCxns)) {
        sCellEntry = "< " + sCellEntry;
    }
    if (isTargetObject(p_colHeaderCell.getDefinition(), visibleCellCxns)) {
        sCellEntry = sCellEntry + " >";
    }
    return sCellEntry;
}

function isTargetObject(p_ObjDef, p_Cxns) {
    for (var i = 0; i < p_Cxns.length; i++) {
        if (p_ObjDef.IsEqual(p_Cxns[i].TargetObjDef())) {
            return true;
        }
    }
    return false;
}

function getAlias(p_nTypeNum, p_mCxnAliases) {
    var nTypeNum = new java.lang.Integer(p_nTypeNum);
    if (p_mCxnAliases != null && p_mCxnAliases.containsKey(nTypeNum)) {
        return p_mCxnAliases.get(nTypeNum);
    }
    g_bIsDefaultUsed = true;
    return c_sDefault;
}

function getHeaderCells(p_oMatrixModel, p_bRowHeader) {
    var nVisibleSymbolTypes = p_oMatrixModel.getVisibleObjectSymbolTypes(p_bRowHeader);
    var header = p_oMatrixModel.getHeader(p_bRowHeader);
    
    var visibleHeaderCells = new Array();
    var headerCells = header.getCells();
    for (var i = 0; i < headerCells.length; i++) {
        if (isVisibleType(headerCells[i].getSymbolNum(), nVisibleSymbolTypes)) {    
            visibleHeaderCells.push(headerCells[i]);
        }            
    }
    return visibleHeaderCells;
}

function isVisibleType(p_nTypeNum, p_nAllowedTypes) {
    for (var i = 0; i < p_nAllowedTypes.length; i++) {
        if (p_nTypeNum == p_nAllowedTypes[i]) {
            return true;
        }
    }
    return false;
}

function getHeaderCellName(p_headerCell) {
    if (p_headerCell.getDefinition() == null) {
        return "";
    }
    return p_headerCell.getDefinition().Name(g_nLoc);
}

function getRelevantModels() {
    var selectedModels = ArisData.getSelectedModels();
    if (selectedModels.length == 0) {
        var selectedGroups = ArisData.getSelectedGroups();
        for (var i = 0; i < selectedGroups.length; i++) {
            var oRelevantModels = selectedGroups[i].ModelList(false/* bRecursive*/, getModelTypesIncludingUserDefined(Constants.MT_MATRIX_MOD));
            if (oRelevantModels.length > 0) {
                selectedModels = selectedModels.concat(oRelevantModels);
            }
        }
    }
    return selectedModels;
}


function getExcelSheetName31(p_sName, p_nIndex) {
    var sIndex = "";
    if (p_nIndex > 1) sIndex = "" + p_nIndex + ". ";
    
    var sNewName = sIndex + p_sName;
    var nEndPos = 28;
    
    var nPos = serchforspecialchar(sNewName);
    if (nPos > 0 && nPos < nEndPos) {
        sNewName = sNewName.substring(0, nPos) + "...";
    } else {
        if (sNewName.length > 31) {
            sNewName = sNewName.substring(0, nEndPos) + "...";
        }
    }
    return sNewName;
}

function addLegend(p_mCxnAliases) {
    g_oOutfile.TableRow();
    g_oOutfile.TableRow();
    g_oOutfile.TableCellF(getString("TEXT_4"), 30, "HEAD");
    g_oOutfile.TableCellF(getString("TEXT_5"), 30, "HEAD");
    
    if (p_mCxnAliases != null) {
        var cxnAliasesSet = p_mCxnAliases.keySet(); 
        var iter = cxnAliasesSet.iterator();
        while (iter.hasNext()) {
            var key = new java.lang.Integer(iter.next());
            
            g_oOutfile.TableRow();
            g_oOutfile.TableCellF(g_oFilter.ActiveCxnTypeName(key), 30, "CELL");
            g_oOutfile.TableCellF(p_mCxnAliases.get(key), 30, "CELL");
        }
    }
    if (g_bIsDefaultUsed) {         // Anubis 536191
        g_oOutfile.TableRow();
        g_oOutfile.TableCellF(getString("TEXT_6"), 30, "CELL");
        g_oOutfile.TableCellF(c_sDefault, 30, "CELL");
    }
}

function isDialogSupported() {
    // Dialog support depends on script runtime environment (STD resp. BP, TC)
    var env = Context.getEnvironment();
    if (env.equals(Constants.ENVIRONMENT_STD)) return true;
    if (env.equals(Constants.ENVIRONMENT_TC)) return SHOW_DIALOGS_IN_CONNECT;
    return false;
}
