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
 
var OPTIONS = function(p_bDiffOnly, p_bModels, p_bObjs, p_bCxns, p_bSymbols, p_bCxnOccs, p_bAssigns, p_bAttrs, p_bAddTypeNum) {
    this.bDiffOnly   = p_bDiffOnly;
    this.bModels     = p_bModels;    
    this.bObjs       = p_bObjs;    
    this.bCxns       = p_bCxns;        
    this.bSymbols    = p_bSymbols;    
    this.bCxnOccs    = p_bCxnOccs;        
    this.bAssigns    = p_bAssigns;        
    this.bAttrs      = p_bAttrs;        
    this.bAddTypeNum = p_bAddTypeNum;
}

var TYPE = function(p_nTypeNum, p_sName, p_bRef, p_bCmp) {
    this.nTypeNum    = p_nTypeNum;
    this.sName       = p_sName;    
    this.bRef        = p_bRef;
    this.bCmp        = p_bCmp;    
}

var CXN_TYPE = function(p_nCxnTypeNum, p_nSrcSymbol, p_nTrgSymbol) {
    this.nCxnTypeNum = p_nCxnTypeNum;
    this.nSrcSymbol  = p_nSrcSymbol;
    this.nTrgSymbol  = p_nTrgSymbol;
    this.sCxnName    = "";
    this.sSrcName    = "";
    this.sTrgName    = "";
    this.bRef        = false;
    this.bCmp        = false;    
}

var cROW_MAX = 60000;

var g_oSelectedFilters = ArisData.getSelectedFilters();
var g_nLoc = Context.getSelectedLanguage();

main();


/*************************************************************************/

function main() {
    if (g_oSelectedFilters.length != 2) {
        Dialogs.MsgBox(getString("MSG_TWO_FILTERS"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, Context.getScriptInfo(Constants.SCRIPT_NAME));
        return;
    }
    var options = selectOptions();
    if (options == null) return;

    doComparison(options);
    
}

function doComparison(p_options) {
    var output = Context.createOutputObject();

    var bAddTypeNum = p_options.bAddTypeNum;
    var bDiffOnly = p_options.bDiffOnly;
    
    var oRefFilter = g_oSelectedFilters[0];
    var oCmpFilter = g_oSelectedFilters[1];
    
    if (p_options.bModels)  compareTypes(Constants.CID_MODEL, getString("MODEL_TYPES"));
    if (p_options.bObjs)    compareTypes(Constants.CID_OBJDEF, getString("OBJECT_TYPES"));
    if (p_options.bCxns)    compareTypes(Constants.CID_CXNDEF, getString("CXN_TYPES")); 

    if (p_options.bSymbols) {
        compareTypes_2("SYMBOL", Constants.CID_MODEL, getString("MODEL_TYPES"), getString("SYMBOLS"));
    }
    if (p_options.bCxnOccs) {
        compareTypes_3(getString("MODEL_TYPES"), getString("CXNS_IN_MODELS"))    
    }
    if (p_options.bAssigns) {
        compareTypes_2("ASSIGNMENT", Constants.CID_OBJDEF, getString("OBJECT_TYPES"), getString("OBJECT_ASSIGNMENTS"));
        compareTypes_2("ASSIGNMENT", Constants.CID_CXNDEF, getString("CXN_TYPES"), getString("CXN_ASSIGNMENTS"));    
    }
    if (p_options.bAttrs) {
        compareTypes_2("ATTRIBUTE", Constants.CID_MODEL, getString("MODEL_TYPES"), getString("MODEL_ATTR_TYPES"));
        compareTypes_2("ATTRIBUTE", Constants.CID_OBJDEF, getString("OBJECT_TYPES"), getString("OBJECT_ATTR_TYPES"));
        compareTypes_2("ATTRIBUTE", Constants.CID_CXNDEF, getString("CXN_TYPES"), getString("CXN_ATTR_TYPES"));    
    }
    
    output.WriteReport();
    
    function compareTypes(p_nItemKindNum, p_sFooter) {
        var aItemTypes = getItemTypes(p_nItemKindNum);
        
        output.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        output.TableRow();
        output.TableCell(oRefFilter.Name(g_nLoc), 50, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);
        output.TableCell(oCmpFilter.Name(g_nLoc), 50, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);        

        var bColored = false;   // variable to change background color of table rows
        for (var i = 0; i < aItemTypes.length; i++) {
            var itemType = aItemTypes[i];

            if (bDiffOnly) {
                if (itemType.bRef && itemType.bCmp) continue;       // Show differences only
            }
            output.TableRow();
            output.TableCell((itemType.bRef) ? itemType.sName : "", 50, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            output.TableCell((itemType.bCmp) ? itemType.sName : "", 50, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);        
            bColored = !bColored; // Change background color
        }
        output.EndTable(p_sFooter, 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
    }

    function compareTypes_2(p_nCompareType, p_nItemKindNum, p_sHead, p_sFooter) {
        var nTableCount = 0;
        var nRowCount = 0;
        
        var aItemTypes = getItemTypes(p_nItemKindNum);
        startTable();

        var bColored = false;   // variable to change background color of table rows
        for (var i = 0; i < aItemTypes.length; i++) {
            var itemType = aItemTypes[i];
            var bFirst = true;
            
            var aCurrentTypes = getCurrentTypes(p_nCompareType, p_nItemKindNum, itemType);
            if (aCurrentTypes.length == 0) continue;
                
            if (nRowCount + aCurrentTypes.length >= cROW_MAX) {
                endTable();
                startTable();
                bColored = false;                
            }
            var bOut = false;
            for (var j = 0; j < aCurrentTypes.length; j++) {
                var currentType = aCurrentTypes[j];

                if (bDiffOnly) {
                    if (currentType.bRef && currentType.bCmp) continue;       // Show differences only
                }
                bOut = true;                
                output.TableRow();
                output.TableCell(itemType.sName, 40, getString("FONT"), 10, bFirst ? Constants.C_BLACK : Constants.C_GREY_80_PERCENT, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                output.TableCell((currentType.bRef) ? currentType.sName : "", 40, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                output.TableCell((currentType.bCmp) ? currentType.sName : "", 40, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);        
                nRowCount++;
                bFirst = false;
            }
            if (bOut) bColored = !bColored; // Change background color
        }
        endTable();

        function startTable() {
            nRowCount = 0;

            output.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            output.TableRow();
            output.TableCell("", 40, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);
            output.TableCell(oRefFilter.Name(g_nLoc), 40, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);
            output.TableCell(oCmpFilter.Name(g_nLoc), 40, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);        
            nRowCount++;

            output.TableRow();
            output.TableCell(p_sHead, 40, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);
            output.TableCell("", 40, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);
            output.TableCell("", 40, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);        
            nRowCount++;
            
            nTableCount++;
        }

        function endTable() {
            var sFooter = p_sFooter;
            if (nTableCount > 1) sFooter = formatstring2("@1. @2", nTableCount, sFooter);
            output.EndTable(sFooter, 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
        }
        
        function getCurrentTypes(p_nCompareType, p_nItemKindNum, p_currType) {
            var nRefTypeNums = new Array();
            if (p_currType.bRef) nRefTypeNums = nRefTypeNums.concat(getTypes(oRefFilter, p_currType.nTypeNum));
            
            var nCmpTypeNums = new Array();
            if (p_currType.bCmp) nCmpTypeNums = nCmpTypeNums.concat(getTypes(oCmpFilter, p_currType.nTypeNum)); 
            
            var nAllTypeNums = getAllTypeNums(nRefTypeNums, nCmpTypeNums);
            
            var aAllTypes = new Array();            
            for (var i = 0; i < nAllTypeNums.length; i++) {
                var nTypeNum = Number(nAllTypeNums[i]);
                var bRef = (nRefTypeNums.indexOf(nTypeNum) >= 0);
                var bCmp = (nCmpTypeNums.indexOf(nTypeNum) >= 0);            
                
                var sName = (bRef) ? getTypeName(oRefFilter, nTypeNum) : getTypeName(oCmpFilter, nTypeNum);
                if (bAddTypeNum) sName += formatstring1(" (@1)", nTypeNum);
                
                aAllTypes.push(new TYPE(nTypeNum, sName, bRef, bCmp));
            }
            return aAllTypes.sort(sortTypeName);
            
            function getTypes(p_oFilter, p_nTypeNum) {
                if (p_nCompareType == "ATTRIBUTE") return p_oFilter.AttrTypes(p_nItemKindNum, p_nTypeNum); 
                if (p_nCompareType == "ASSIGNMENT") return p_oFilter.Assignments(p_nItemKindNum, p_nTypeNum); 
                if (p_nCompareType == "SYMBOL") return p_oFilter.Symbols(p_nTypeNum); 
                return new Array(); // (never reached)
            }
            
            function getTypeName(p_oFilter, p_nTypeNum) {
                if (p_nCompareType == "ATTRIBUTE") return p_oFilter.AttrTypeName(p_nTypeNum); 
                if (p_nCompareType == "ASSIGNMENT") return p_oFilter.ModelTypeName(p_nTypeNum); 
                if (p_nCompareType == "SYMBOL") return p_oFilter.SymbolName(p_nTypeNum); 
                return ""; // (never reached)
            }
        }
    }

    function compareTypes_3(p_sHead, p_sFooter) {
        var nTableCount = 0;
        var nRowCount = 0;
        
        var aItemTypes = getItemTypes(Constants.CID_MODEL);
        startTable();

        var bColored = false;   // variable to change background color of table rows
        for (var i = 0; i < aItemTypes.length; i++) {
            var itemType = aItemTypes[i];
            var bFirst = true;
            
            var aConnectionTypes = getConnectionTypes(itemType);
            if (aConnectionTypes.length == 0) continue;
            
            if (nRowCount + aConnectionTypes.length >= cROW_MAX) {
                endTable();
                startTable();
                bColored = false;                
            }
            var bOut = false;
            for (var j = 0; j < aConnectionTypes.length; j++) {
                var connectionType = aConnectionTypes[j];

                if (bDiffOnly) {
                    if (connectionType.bRef && connectionType.bCmp) continue;       // Show differences only
                }
                bOut = true;
                output.TableRow();
                output.TableCell(itemType.sName, 25, getString("FONT"), 10, bFirst ? Constants.C_BLACK : Constants.C_GREY_80_PERCENT, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                output.TableCell((connectionType.bRef) ? connectionType.sCxnName : "", 25, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                output.TableCell((connectionType.bRef) ? connectionType.sSrcName : "", 25, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                output.TableCell((connectionType.bRef) ? connectionType.sTrgName : "", 25, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                output.TableCell((connectionType.bCmp) ? connectionType.sCxnName : "", 25, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                output.TableCell((connectionType.bCmp) ? connectionType.sSrcName : "", 25, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                output.TableCell((connectionType.bCmp) ? connectionType.sTrgName : "", 25, getString("FONT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                nRowCount++;
                bFirst = false;
            }
            if (bOut) bColored = !bColored; // Change background color
        }
        endTable();
        
        function startTable() {
            nRowCount = 0;
            
            output.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            output.TableRow();
            output.TableCell("", 25, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);
            output.TableCell(oRefFilter.Name(g_nLoc), 25, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);
            output.TableCell(oRefFilter.Name(g_nLoc), 25, getString("FONT"), 10, Constants.C_GREY_50_PERCENT, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);
            output.TableCell(oRefFilter.Name(g_nLoc), 25, getString("FONT"), 10, Constants.C_GREY_50_PERCENT, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);
            output.TableCell(oCmpFilter.Name(g_nLoc), 25, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);        
            output.TableCell(oCmpFilter.Name(g_nLoc), 25, getString("FONT"), 10, Constants.C_GREY_50_PERCENT, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);        
            output.TableCell(oCmpFilter.Name(g_nLoc), 25, getString("FONT"), 10, Constants.C_GREY_50_PERCENT, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);        
            nRowCount++;

            output.TableRow();
            output.TableCell(p_sHead, 25, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);
            output.TableCell(getString("CXN_TYPE"), 25, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);
            output.TableCell(getString("FROM"), 25, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);        
            output.TableCell(getString("TO"), 25, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);                
            output.TableCell(getString("CXN_TYPE"), 25, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);
            output.TableCell(getString("FROM"), 25, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);        
            output.TableCell(getString("TO"), 25, getString("FONT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VTOP, 0);                
            nRowCount++;
            
            nTableCount++;
        }

        function endTable() {
            var sFooter = p_sFooter;
            if (nTableCount > 1) sFooter = formatstring2("@1. @2", nTableCount, sFooter);
            output.EndTable(sFooter, 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
        }
        
        function getConnectionTypes(p_currType) {
            var nModelTypeNum = p_currType.nTypeNum;
            
            var aRefCxnTypes = (p_currType.bRef) ? getCxnTypes(oRefFilter) : new Array();
            var aCmpCxnTypes = (p_currType.bCmp) ? getCxnTypes(oCmpFilter) : new Array();

            var aAllCxnTypes = getAllCxnTypes(aRefCxnTypes, aCmpCxnTypes);
            return aAllCxnTypes.sort(sortCxnTypeName);

            function getCxnTypes(p_oFilter) {
                var aCxnTypes = new Array();
                var nSymbols = p_oFilter.Symbols(nModelTypeNum);
                for (var i = 0; i < nSymbols.length; i++) {
                    var nSrcSymbol = nSymbols[i];
                    for (var j = 0; j < nSymbols.length; j++) {
                        var nTrgSymbol = nSymbols[j];
                        var nCxnTypes = p_oFilter.CxnTypes(nModelTypeNum, nSrcSymbol, nTrgSymbol);
                        for (var k = 0; k < nCxnTypes.length; k++) {
                            aCxnTypes.push(new CXN_TYPE(nCxnTypes[k], nSrcSymbol, nTrgSymbol));
                        }
                    }
                }
                return aCxnTypes;
            }
            
            function getAllCxnTypes(p_aRefCxnTypes, p_aCmpCxnTypes) {
                var aCxnTypes = new Array();

                for (var i = 0; i < p_aRefCxnTypes.length; i++) {
                    var refCxnType = p_aRefCxnTypes[i];
                    aCxnTypes[i] = new CXN_TYPE(refCxnType.nCxnTypeNum, refCxnType.nSrcSymbol, refCxnType.nTrgSymbol);
                    aCxnTypes[i].sCxnName = getCxnName(oRefFilter, refCxnType.nCxnTypeNum);
                    aCxnTypes[i].sSrcName = getSymbolName(oRefFilter, refCxnType.nSrcSymbol);
                    aCxnTypes[i].sTrgName = getSymbolName(oRefFilter, refCxnType.nTrgSymbol);
                    aCxnTypes[i].bRef = true;
                }
                for (var i = 0; i < p_aCmpCxnTypes.length; i++) {
                    var cmpCxnType = p_aCmpCxnTypes[i];
                    var nIndex = getIndexInList(aCxnTypes, cmpCxnType);
                    if (nIndex < 0) {
                        nIndex = aCxnTypes.length;
                        aCxnTypes[nIndex] = new CXN_TYPE(cmpCxnType.nCxnTypeNum, cmpCxnType.nSrcSymbol, cmpCxnType.nTrgSymbol);
                        aCxnTypes[nIndex].sCxnName = getCxnName(oCmpFilter, cmpCxnType.nCxnTypeNum);
                        aCxnTypes[nIndex].sSrcName = getSymbolName(oCmpFilter, cmpCxnType.nSrcSymbol);
                        aCxnTypes[nIndex].sTrgName = getSymbolName(oCmpFilter, cmpCxnType.nTrgSymbol);
                    }
                    aCxnTypes[nIndex].bCmp = true;
                }
                return aCxnTypes;

                function getIndexInList(p_aCxnTypes, p_currCxnType) {
                    for (var i = 0; i < p_aCxnTypes.length; i++) {
                        if (cmpCxnTypes(p_aCxnTypes[i], p_currCxnType)) return i;
                    }
                    return -1;
                    
                    function cmpCxnTypes(p_cxnType1, p_cxnType2) {
                        return ((p_cxnType1.nCxnTypeNum == p_cxnType2.nCxnTypeNum) &&
                        (p_cxnType1.nSrcSymbol == p_cxnType2.nSrcSymbol) &&
                        (p_cxnType1.nTrgSymbol == p_cxnType2.nTrgSymbol));
                    }
                }
                
                function getCxnName(p_oFilter, p_nTypeNum) {
                    var sName = p_oFilter.ItemTypeName(Constants.CID_CXNDEF, p_nTypeNum);
                    if (bAddTypeNum) sName += formatstring1(" (@1)", p_nTypeNum);
                    return sName;
                }
                
                function getSymbolName(p_oFilter, p_nTypeNum) {
                    var sName = p_oFilter.SymbolName(p_nTypeNum);
                    if (bAddTypeNum) sName += formatstring1(" (@1)", p_nTypeNum);
                    return sName;
                }
                
            }
            
            function sortCxnTypeName(a, b) {
                var result = StrComp(a.sCxnName, b.sCxnName);
                if (result == 0) result = StrComp(a.sSrcName, b.sSrcName);
                if (result == 0) result = StrComp(a.sTrgName, b.sTrgName);
                return result;
            }
        }
    }
    
    function getItemTypes(p_nItemKindNum) {
        var nRefTypeNums = [].concat(oRefFilter.GetTypes(p_nItemKindNum)); 
        var nCmpTypeNums = [].concat(oCmpFilter.GetTypes(p_nItemKindNum)); 
        
        var nAllTypeNums = getAllTypeNums(nRefTypeNums, nCmpTypeNums);

        var aAllTypes = new Array();
        for (var i = 0; i < nAllTypeNums.length; i++) {
            var nTypeNum = Number(nAllTypeNums[i]);
            var bRef = (nRefTypeNums.indexOf(nTypeNum) >= 0);
            var bCmp = (nCmpTypeNums.indexOf(nTypeNum) >= 0);            
            
            var sName = (bRef) ? oRefFilter.ItemTypeName(p_nItemKindNum, nTypeNum) : oCmpFilter.ItemTypeName(p_nItemKindNum, nTypeNum);
            if (bAddTypeNum) sName += formatstring1(" (@1)", nTypeNum);
            
            aAllTypes.push(new TYPE(nTypeNum, sName, bRef, bCmp));
        }
        return aAllTypes.sort(sortTypeName);
    }    

    function getAllTypeNums(p_nRefTypeNums, p_nCmpTypeNums) {
        var nTypeNums = p_nRefTypeNums.concat(p_nCmpTypeNums);
        
        var typeSet = new java.util.HashSet();
        for (var i = 0; i < nTypeNums.length; i++) {
            typeSet.add(nTypeNums[i]);
        }
        return typeSet.toArray();
    }
    
    function sortTypeName(a, b) {
        return StrComp(a.sName, b.sName);
    }
}

function selectOptions() {
    var userdialog = Dialogs.createNewDialogTemplate(555, 220, Context.getScriptInfo(Constants.SCRIPT_NAME));
    // %GRID:10,7,1,0
    userdialog.GroupBox(10, 5, 540, 55, getString("OUTPUT_OPTIONS"));
    userdialog.OptionGroup("optGroupOutput");
    userdialog.OptionButton(25, 20, 520, 15, getString("SHOW_ALL"), "optShowAll");
    userdialog.OptionButton(25, 35, 520, 15, getString("SHOW_DIFFS"), "optShowDiffs");
    
    userdialog.GroupBox(10, 65, 540, 130, getString("COMP_OPTIONS"));
    userdialog.CheckBox(25, 80, 520, 15, getString("MODEL_TYPES"), "chkModels");
    userdialog.CheckBox(25, 95, 520, 15, getString("OBJECT_TYPES"), "chkObjs");  
    userdialog.CheckBox(25, 110, 520, 15, getString("CXN_TYPES"), "chkCxns");
    userdialog.CheckBox(25, 125, 520, 15, getString("SYMBOLS_IN_MODELS"), "chkSymbols");
    userdialog.CheckBox(25, 140, 520, 15, getString("CXNS_IN_MODELS"), "chkCxnOccs");  
    userdialog.CheckBox(25, 155, 520, 15, getString("ASSIGNMENTS_OBJECTS_CXNS"), "chkAssigns");
    userdialog.CheckBox(25, 170, 520, 15, getString("ATTRIBUTES_MODELS_OBJECTS_CXNS"), "chkAttrs");  
    
    userdialog.CheckBox(10, 200, 540, 15, getString("ADDITIONAL_OUTPUT"), "chkAddTypeNum");
    
    userdialog.OKButton();
    userdialog.CancelButton();
    userdialog.HelpButton("HID_a191e580_d3a6_11e0_728a_ace798052f32_dlg_01.hlp");  
    
    var dlg = Dialogs.createUserDialog(userdialog); 
    
    // Read dialog settings from config
    var sSection = "SCRIPT_a191e580_d3a6_11e0_728a_ace798052f32";  
    ReadSettingsDlgValue(dlg, sSection, "optGroupOutput", 1);
    ReadSettingsDlgValue(dlg, sSection, "chkModels", 1);
    ReadSettingsDlgValue(dlg, sSection, "chkObjs", 1);  
    ReadSettingsDlgValue(dlg, sSection, "chkCxns", 1);
    ReadSettingsDlgValue(dlg, sSection, "chkSymbols", 1);
    ReadSettingsDlgValue(dlg, sSection, "chkCxnOccs", 1);  
    ReadSettingsDlgValue(dlg, sSection, "chkAssigns", 1);
    ReadSettingsDlgValue(dlg, sSection, "chkAttrs", 1);  
    ReadSettingsDlgValue(dlg, sSection, "chkAddTypeNum", 1);
    
    if (isEntireMethodSelected()) {
        dlg.setDlgValue("optGroupOutput", 1);
        dlg.setDlgEnable("optShowAll", false);        
    }
    
    var nuserchoice = Dialogs.show( __currentDialog = dlg);
    if (nuserchoice == 0) return null;
    
    WriteSettingsDlgValue(dlg, sSection, "optGroupOutput");
    WriteSettingsDlgValue(dlg, sSection, "chkModels");
    WriteSettingsDlgValue(dlg, sSection, "chkObjs");  
    WriteSettingsDlgValue(dlg, sSection, "chkCxns");
    WriteSettingsDlgValue(dlg, sSection, "chkSymbols");
    WriteSettingsDlgValue(dlg, sSection, "chkCxnOccs");  
    WriteSettingsDlgValue(dlg, sSection, "chkAssigns");
    WriteSettingsDlgValue(dlg, sSection, "chkAttrs");  
    WriteSettingsDlgValue(dlg, sSection, "chkAddTypeNum");
    
    return new OPTIONS((dlg.getDlgValue("optGroupOutput")==1),
                       (dlg.getDlgValue("chkModels")==1),
                       (dlg.getDlgValue("chkObjs")==1),
                       (dlg.getDlgValue("chkCxns")==1),
                       (dlg.getDlgValue("chkSymbols")==1),
                       (dlg.getDlgValue("chkCxnOccs")==1),
                       (dlg.getDlgValue("chkAssigns")==1),
                       (dlg.getDlgValue("chkAttrs")==1),
                       (dlg.getDlgValue("chkAddTypeNum")==1));  
}

function isEntireMethodSelected() {
    for (var i = 0; i < g_oSelectedFilters.length; i++) {
        if (g_oSelectedFilters[i].IsFullMethod()) return true;
    }
    return false
}
