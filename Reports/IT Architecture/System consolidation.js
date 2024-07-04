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

// BLUE-17650 - Import/Usage of 'convertertools.js' removed

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed" 

function ROW_ENTRY(p_oISFuncDef, p_oApplSysTypes_both, p_oApplSysTypes_onlyIs) {
    this.oISFuncDef = p_oISFuncDef;
    this.oApplSysTypes_both = p_oApplSysTypes_both;
    this.oApplSysTypes_onlyIs = p_oApplSysTypes_onlyIs;
    return this;
}

function SYMBOL(p_sName, p_nColor, p_bWithLines) {
    this.sName = p_sName;
    this.nColor = p_nColor;
    this.bWithLines = p_bWithLines;
    return this;
}

function COLUMN(p_sName, p_bApplSys, p_bBoth, p_bFunc) {
    this.sName = p_sName;
    this.bApplSys = p_bApplSys;
    this.bBoth = p_bBoth;
    this.bFunc = p_bFunc;
}

var TEXT_WIDTH  = 200;
var TEXT_HEIGHT = 70;
var TEXT_OFFSET = 25;

var COL_ISFUNC = getColorByRGB(204, 255, 204);
var COL_FUNC = Constants.C_GREEN;
var COL_APPLSYS = Constants.C_LIGHT_BLUE;
var COL_CROSS = Constants.C_RED;

var g_nLoc = Context.getSelectedLanguage(); 
var g_oOutfile = Context.createOutputObject();

// Set Landscape
var pageHeight = g_oOutfile.GetPageHeight();
var pageWidth = g_oOutfile.GetPageWidth();
if (pageHeight > pageWidth) {
    g_oOutfile.SetPageHeight(pageWidth);
    g_oOutfile.SetPageWidth(pageHeight);
}

main();
g_oOutfile.WriteReport();

/* ---------------------------------------------------------------------------- */

function main() {
    // out header/footer
    if ((Context.getSelectedFormat() != Constants.OutputXLS) && (Context.getSelectedFormat() != Constants.OutputXLSX)) {
        setReportHeaderFooter(g_oOutfile, g_nLoc, false, false, false);
    }
    
    // get selected FUNCs
    var oFuncDefs = getSelectedFunctions();
    oFuncDefs.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nLoc).compare);
    
    // get all connected IS FUNCs
    var oISFuncDefs = new Array();
    for (var i = 0 ; i < oFuncDefs.length ; i++) {
        oISFuncDefs = oISFuncDefs.concat(getSuppISFunctions(oFuncDefs[i]));
    }
    oISFuncDefs = ArisData.Unique(oISFuncDefs);
    oISFuncDefs.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nLoc).compare);
    
    // output matrix
    var nWidth = Math.round(100/(oISFuncDefs.length+1));
    g_oOutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    
    g_oOutfile.TableRow();
    g_oOutfile.TableCell("", nWidth, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_BOLD, 0);
    for (var j = 0 ; j < oISFuncDefs.length ; j++) {
        if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) {
            g_oOutfile.TableCell(oISFuncDefs[j].Name(g_nLoc), nWidth, getString("TEXT_1"), 10, Constants.C_BLACK, COL_ISFUNC, 0, Constants.FMT_CENTER, 0);
        } else {
            // Default
            outSymbol(oISFuncDefs[j], nWidth);   
        }       
    }
    
    for (var i = 0 ; i < oFuncDefs.length ; i++) {
        var oFuncDef = oFuncDefs[i];
        
        var oTableRowEntries = new Array();

        // Supporting ApplSysTypes of FUNC
        var oApplSysTypes_ofFunc = getSuppApplSysTypes(oFuncDef);
        oApplSysTypes_ofFunc.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nLoc).compare);                

        for (var j = 0 ; j < oISFuncDefs.length ; j++) {
            var oISFuncDef = oISFuncDefs[j];

            var oApplSysTypes_both = null;
            var oApplSysTypes_onlyIs = null;
            
            if (isSupported(oFuncDef, oISFuncDef)) {
                // Supporting ApplSysTypes of IS FUNC
                var oApplSysTypes_ofISFunc = getSuppApplSysTypes(oISFuncDef);
                oApplSysTypes_ofISFunc.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nLoc).compare);                

                if (oApplSysTypes_ofISFunc.length > 0) {
                    
                    for (var k = 0 ; k < oApplSysTypes_ofISFunc.length ; k++) {
                        var oApplSysType = oApplSysTypes_ofISFunc[k];
                        var bBoth = false;
                        
                        for (var m = 0 ; m < oApplSysTypes_ofFunc.length ; m++) {
                            if (oApplSysType.IsEqual(oApplSysTypes_ofFunc[m])) {
                                if (oApplSysTypes_both == null) {
                                    oApplSysTypes_both = new Array();
                                }
                                // ApplSysType supportes IS FUNC and FUNC
                                oApplSysTypes_both.push(oApplSysType);
                                bBoth = true;
                                break;
                            }
                        }
                        if (!bBoth) {
                                if (oApplSysTypes_onlyIs == null) {
                                    oApplSysTypes_onlyIs = new Array();
                                }
                            // ApplSysType supportes only IS FUNC
                            oApplSysTypes_onlyIs.push(oApplSysType);
                        }
                    }
                } else {
                    // --> Empty arrays !!!
                    oApplSysTypes_both = new Array();
                    oApplSysTypes_onlyIs = new Array();
                }
            } else {
                // --> Arrays = null !!!
                oApplSysTypes_both = null;
                oApplSysTypes_onlyIs = null;                
            }
            oTableRowEntries.push(new ROW_ENTRY(oISFuncDef, oApplSysTypes_both, oApplSysTypes_onlyIs)); 
        }
        if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) {
            outTextTable(oFuncDef, oTableRowEntries, nWidth)
        } else {
            // Default
            g_oOutfile.TableRow();
            outSymbol(oFuncDef, nWidth);
            outSymbolArray(oTableRowEntries, nWidth);
        }         
    }
    var sText = (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) ? getString("TEXT_2") : "";  
    g_oOutfile.EndTable(sText, 100, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
    
    outLegend();    
}   

function getSelectedFunctions() {
    var oSelFuncDefs = new Array();
    var oSelObjDefs = ArisData.getSelectedObjDefs();
    for (i = 0 ; i < oSelObjDefs.length ; i++) {
        var oObjDef = oSelObjDefs[i];
        if (oObjDef.TypeNum() == Constants.OT_FUNC) {
            oSelFuncDefs.push(oObjDef);
        }
    }
    return oSelFuncDefs;
}

function getSuppISFunctions(p_oFuncDef) {
    return p_oFuncDef.getConnectedObjs(Constants.OT_IS_FUNC);
}

function getSuppApplSysTypes(p_oFuncDefOrISFuncDef) {
    return p_oFuncDefOrISFuncDef.getConnectedObjs(Constants.OT_APPL_SYS_TYPE);
}

function isSupported(p_oFuncDef, p_oISFuncDef) {
    var oSuppISFunctions = getSuppISFunctions(p_oFuncDef);
    for (i = 0 ; i < oSuppISFunctions.length ; i++) {
        if (oSuppISFunctions[i].IsEqual(p_oISFuncDef)) {
            return true;
        }
    }
    return false;
}

function getNames(p_oObjDefs) {
    var sNames = "";
    for (var i = 0 ; i < p_oObjDefs.length ; i++) {
        if (sNames.length > 0) {
            sNames = sNames + "\n";
        }
        sNames = sNames + p_oObjDefs[i].Name(g_nLoc);
    }    
    return sNames;
}

/*************************************************************************/

// Functions for graphic output

function getSymbols(p_oObjDefs, p_bColored) {
    var aSymbols = new Array();
    for (var i = 0; i < p_oObjDefs.length; i++) {
        var oObjDef = p_oObjDefs[i];
        var sName = oObjDef.Name(g_nLoc)
        var nColor = Constants.C_TRANSPARENT;
        var bWithLines = false;
        switch (oObjDef.TypeNum()) {
            case Constants.OT_FUNC:
            nColor = COL_FUNC;
            break;
            case Constants.OT_IS_FUNC:
            nColor = COL_ISFUNC;
            break;
            case Constants.OT_APPL_SYS_TYPE:
            if (p_bColored) {
                nColor = COL_APPLSYS;
            }
            bWithLines = true;
            break;
        }
        aSymbols.push(new SYMBOL(sName, nColor, bWithLines));
    }
    return aSymbols;
}                               
                           
function getSymbolPictures(p_aSymbols) {
    var oPic = Context.createPicture();
    oPic.SelectPen(Constants.PS_SOLID, 1, Constants.C_BLACK);
    oPic.SetTextColor(Constants.C_BLACK);
    oPic.SetBkMode(Constants.BKMODE_TRANSPARENT);
    oPic.SelectFont(250, getString("TEXT_1"), Constants.FMT_BOLD);    
    
    var x1 = 10;
    var y1 = 10;    

    for (var i = 0; i < p_aSymbols.length; i++) {
        var symbol = p_aSymbols[i]; 
        oPic.SelectBrush(symbol.nColor);
        var nHeight = oPic.DrawText(symbol.sName, 0, 0, TEXT_WIDTH, TEXT_HEIGHT, Constants.DT_CENTER | Constants.DT_CALCRECT | Constants.DT_WORDBREAK);

        var x2 = x1 + TEXT_WIDTH + 2*TEXT_OFFSET;
        var y2 = y1 + Math.max(TEXT_HEIGHT, nHeight) + 2*TEXT_OFFSET;

        oPic.Rectangle(x1, y1, x2, y2);
        
        if (symbol.bWithLines) {
            drawApplSysTypeLines(oPic, x1, y1, x2, y2);
        }
        oPic.DrawText(symbol.sName, x1 + TEXT_OFFSET, y1 + TEXT_OFFSET, x2 - TEXT_OFFSET, y2, Constants.DT_CENTER | Constants.DT_WORDBREAK);
        
        y1 = y2 + 10;
    }
    return oPic;
}

function drawApplSysTypeLines(p_oPic, x1, y1, x2, y2) {
    p_oPic.MoveTo(x1+10, y1);
    p_oPic.LineTo(x1+10, y2);
    p_oPic.MoveTo(x1+20, y1);
    p_oPic.LineTo(x1+20, y2);
    
    p_oPic.MoveTo(x2-10, y1);
    p_oPic.LineTo(x2-10, y2);
    p_oPic.MoveTo(x2-20, y1);
    p_oPic.LineTo(x2-20, y2);
}

function outSymbol(p_oObjDef, p_nWidth) {
    var aSymbols = getSymbols(new Array(p_oObjDef), true);
    var oPicture = getSymbolPictures(aSymbols);
    g_oOutfile.TableCell("", p_nWidth, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER, 0);
    g_oOutfile.OutGraphic(oPicture, -1, oPicture.getWidth(Constants.SIZE_LOMETRIC)/10, oPicture.getHeight(Constants.SIZE_LOMETRIC)/10);     // BLUE-15935
}

function outSymbolArray(p_oTableRowEntries, p_nWidth) {
    for (var n = 0 ; n < p_oTableRowEntries.length ; n++) {
        
        var oApplSysTypes_both = p_oTableRowEntries[n].oApplSysTypes_both;
        var oApplSysTypes_onlyIs = p_oTableRowEntries[n].oApplSysTypes_onlyIs;
        
        
        if (oApplSysTypes_both == null && oApplSysTypes_onlyIs == null) {
            g_oOutfile.TableCell("", p_nWidth, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER, 0);                 
            
        } else {
            if (oApplSysTypes_both != null && oApplSysTypes_both.length == 0 && 
            oApplSysTypes_onlyIs != null && oApplSysTypes_onlyIs.length == 0) {
                g_oOutfile.TableCell("X", p_nWidth, getString("TEXT_1"), 10, Constants.C_RED, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);                    
                
            } else {
                var aApplSysTypeSymbols = new Array();
                if (oApplSysTypes_both != null) {
                    var aApplSysTypeSymbols_both = getSymbols(oApplSysTypes_both, true);
                    aApplSysTypeSymbols = aApplSysTypeSymbols.concat(aApplSysTypeSymbols_both);
                }
                
                if (oApplSysTypes_onlyIs != null) {
                    var aApplSysTypeSymbols_onlyIs = getSymbols(oApplSysTypes_onlyIs, false);   // not colored!
                    aApplSysTypeSymbols = aApplSysTypeSymbols.concat(aApplSysTypeSymbols_onlyIs);
                }
                
                var oApplSysTypePicture = getSymbolPictures(aApplSysTypeSymbols);
                g_oOutfile.TableCell("", p_nWidth, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER, 0);
                g_oOutfile.OutGraphic(oApplSysTypePicture, -1, oApplSysTypePicture.getWidth(Constants.SIZE_LOMETRIC)/10, oApplSysTypePicture.getHeight(Constants.SIZE_LOMETRIC)/10)     // BLUE-15935
            }
        }
    }
}

// --- Functions for Excel output --- 

function outTextTable(p_oFuncDef, p_oTableRowEntries, p_nWidth) {
    var nRowCount = getRowCount(p_oTableRowEntries)
    var aTextTable = initTableArray(p_oTableRowEntries.length + 1, nRowCount);
    
    aTextTable[0][0].sName = p_oFuncDef.Name(g_nLoc);
    for (var i = 0 ; i < aTextTable[0].length ; i++) {    
        aTextTable[0][i].bFunc = true;
    }
    
    for (var i = 0 ; i < p_oTableRowEntries.length ; i++) {
        var oApplSysTypes_both = p_oTableRowEntries[i].oApplSysTypes_both;
        var oApplSysTypes_onlyIs = p_oTableRowEntries[i].oApplSysTypes_onlyIs;

        if (oApplSysTypes_both == null && oApplSysTypes_onlyIs == null) {
        } else {
            if (oApplSysTypes_both != null && oApplSysTypes_both.length == 0 && 
            oApplSysTypes_onlyIs != null && oApplSysTypes_onlyIs.length == 0) {
                aTextTable[i+1][0].sName = "X";
                
            } else {
                var nIndex = 0;
                if (oApplSysTypes_both != null) {
                    for (var j = 0 ; j < oApplSysTypes_both.length ; j++) {
                        aTextTable[i+1][nIndex].sName = oApplSysTypes_both[j].Name(g_nLoc);
                        aTextTable[i+1][nIndex].bApplSys = true;
                        aTextTable[i+1][nIndex].bBoth = true;
                        nIndex++;
                    }
                }
                if (oApplSysTypes_onlyIs != null) {
                    for (var j = 0 ; j < oApplSysTypes_onlyIs.length ; j++) {
                        aTextTable[i+1][nIndex].sName = oApplSysTypes_onlyIs[j].Name(g_nLoc);
                        aTextTable[i+1][nIndex].bApplSys = true;
                        nIndex++;
                    }
                }
            }
        }
    }
    
    var aTextTable_2 = initTableArray(nRowCount, p_oTableRowEntries.length);
    for (var i = 0 ; i < aTextTable.length ; i++) {
        for (var j = 0 ; j < aTextTable[i].length ; j++) {
            aTextTable_2[j][i] = aTextTable[i][j];
        }
    }
    
    for (var i = 0 ; i < aTextTable_2.length ; i++) {
        g_oOutfile.TableRow();
        for (var j = 0 ; j < aTextTable_2[i].length ; j++) {
            setCurrentFrameStyle(aTextTable_2, i, j);
            
            var sEntry = aTextTable_2[i][j].sName;
            var nBgColor = getBgColor(aTextTable_2[i][j]);
            var nTextColor = getTextColor(aTextTable_2[i][j]);

            g_oOutfile.TableCell(sEntry, p_nWidth, getString("TEXT_1"), 10, nTextColor, nBgColor, 0, Constants.FMT_CENTER, 0);                        
        }
    }
}

function initTableArray(p_nColCount, p_nRowCount) {
    var aTable = new Array(p_nColCount);
    for (var i = 0 ; i < aTable.length ; i++) {
        aTable[i] = new Array(p_nRowCount);        
        
        for (var j = 0 ; j < aTable[i].length ; j++) {
            aTable[i][j] = new COLUMN("", false, false, false);
        }
    }
    return aTable;
}

function setCurrentFrameStyle(aTextTable_2, i, j) {
    g_oOutfile.ResetFrameStyle();
    
    if ((i < aTextTable_2.length - 1) && (aTextTable_2[i+1][j].sName.length == 0)) {
        g_oOutfile.SetFrameStyle(Constants.FRAME_BOTTOM, 0)    
    }
    if (i > 0) {
        g_oOutfile.SetFrameStyle(Constants.FRAME_TOP, 0);
    }
}

function getRowCount(p_oTableRowEntries) {
    var nRowCount = 1;
    
    for (var n = 0 ; n < p_oTableRowEntries.length ; n++) {
        var nCount_both = 0;
        var nCount_onlyIs = 0;        
        if (p_oTableRowEntries[n].oApplSysTypes_both != null) {
            nCount_both = p_oTableRowEntries[n].oApplSysTypes_both.length;
        }
        if (p_oTableRowEntries[n].oApplSysTypes_onlyIs != null) {
            nCount_onlyIs = p_oTableRowEntries[n].oApplSysTypes_onlyIs.length;
        }
        nRowCount = Math.max(nRowCount, nCount_both + nCount_onlyIs);    
    }
    return nRowCount;
}

function getBgColor(p_aTableEntry) {
    if (p_aTableEntry.bFunc) return COL_FUNC
    if (p_aTableEntry.bApplSys) {
        if (p_aTableEntry.bBoth) return COL_APPLSYS;
        return Constants.C_TRANSPARENT;
    }
    return Constants.C_TRANSPARENT;
}

function getTextColor(p_aTableEntry) {
    if (p_aTableEntry.sName == "X") return COL_CROSS;
    return Constants.C_BLACK;
}

function outLegend() {
    // because of problems with format PDF
    var tableWidth = (Context.getSelectedFormat() == Constants.OUTPDF) ? 100 : 50;
        
    if ( (Context.getSelectedFormat() != Constants.OutputXLS) && (Context.getSelectedFormat() != Constants.OutputXLSX) ) {    
        g_oOutfile.OutputLn("", getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);        
        g_oOutfile.OutputLn(getString("TEXT_3") + ": ", getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);        
    }    
    g_oOutfile.BeginTable(tableWidth, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_oOutfile.TableRow();
    g_oOutfile.TableCell("X", 40, getString("TEXT_1"), 10, Constants.C_RED, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);                    
    g_oOutfile.TableCell(getString("TEXT_4"), 60, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);                 
    g_oOutfile.TableRow();
    outLegendSymbol(COL_APPLSYS);
    g_oOutfile.TableCell(getString("TEXT_5"), 60, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);                 
    g_oOutfile.TableRow();
    outLegendSymbol(Constants.C_TRANSPARENT);
    g_oOutfile.TableCell(getString("TEXT_6"), 60, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);                 
    g_oOutfile.TableRow();
    g_oOutfile.TableCell("", 40, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER, 0);
    g_oOutfile.TableCell(getString("TEXT_7"), 60, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);                 
    var sText = (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) ? getString("TEXT_3") : "";  
    g_oOutfile.EndTable(sText, tableWidth, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
}

function outLegendSymbol(p_nColor) {
    var sName = getString("TEXT_8");
    if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX ) {
        g_oOutfile.TableCell(sName, 40, getString("TEXT_1"), 10, Constants.C_BLACK, p_nColor, 0, Constants.FMT_CENTER, 0);
    } else {
        var oPicture = getSymbolPictures(new Array(new SYMBOL(sName, p_nColor, true)));  
        g_oOutfile.TableCell("", 40, getString("TEXT_1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER, 0);
        g_oOutfile.OutGraphic(oPicture, -1, 18, 100);
    }       
}
