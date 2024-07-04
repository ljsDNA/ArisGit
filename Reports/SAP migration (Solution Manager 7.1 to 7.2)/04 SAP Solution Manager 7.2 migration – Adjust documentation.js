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

var bAutoTouch = false;         // true: Date of last change is changed (= Standard behaviour)     
                                // false: Models get not touched -> Date of last change is not changed

/************************************************************************************************************************************/

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

function TYPE_SYMBOL() {
    this.nGeneralFrom;
    this.nGeneralTo;    
    this.nTrainingFrom;
    this.nTrainingTo;    
}

if ( checkEntireMethod() ) {
    
    var oDB = ArisData.getActiveDatabase();
    
    if (!bAutoTouch) oDB.setAutoTouch(false);     // No touch !!!
    ArisData.Save(Constants.SAVE_ONDEMAND);
    
    var oOut;
    var tSymbolMapping = getSymbolMapping(); 
    if (tSymbolMapping != null) {
        oOut = Context.createOutputObject();
        initOutput(oOut);
        oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
        outHeader();
        
        var oFADModels = getFADModels(tSymbolMapping);
        for (var i in oFADModels) {
    
            replaceSymbolsInModel(oFADModels[i], tSymbolMapping);
            ArisData.Save(Constants.SAVE_NOW);
        }
        oOut.EndTable(getString("PROTOCOL"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        oOut.WriteReport();    
    }
}

/************************************************************************************************************************************/

function replaceSymbolsInModel(oFADModel, tSymbolMapping) {
    if ( !canModelBeChanged(oFADModel) ) {
        outData(oFADModel, null, "", "", false, getString("ERROR_MSG_MODEL"));
        return;
    }        
        
    var oGeneralOccs = oFADModel.ObjOccListBySymbol([tSymbolMapping.nGeneralFrom]);
    replaceSymbols(oGeneralOccs, tSymbolMapping.nGeneralTo);

    var oTrainingOccs = oFADModel.ObjOccListBySymbol([tSymbolMapping.nTrainingFrom]);
    replaceSymbols(oTrainingOccs, tSymbolMapping.nTrainingTo);
    
    function replaceSymbols(oObjOccs, newSymbol) {
        for (var i in oObjOccs) {
            var oObjOcc = oObjOccs[i];
            var sOldSymbol = oObjOcc.SymbolName();
            
            var bResult = oObjOcc.setSymbol(newSymbol);
            var sErrorText = bResult ? "" : getString("ERROR_MSG_SYMBOL");
            outData(oFADModel, oObjOcc.ObjDef(), sOldSymbol, oObjOcc.SymbolName(), bResult, sErrorText);
        }
    }
}

function getFADModels() {
    var oRelevantFADModels = new Array();
    var oFADModels = oDB.Find(Constants.SEARCH_MODEL, extendModelTypes([Constants.MT_FUNC_ALLOC_DGM]));
    for (var i in oFADModels) {
        var oFADModel = oFADModels[i];
        if (!checkAssignments(oFADModel)) continue;
        if (oFADModel.ObjOccListBySymbol([tSymbolMapping.nGeneralFrom, tSymbolMapping.nTrainingFrom]).length == 0) continue;
        
        oRelevantFADModels.push(oFADModel);
    }
    return oRelevantFADModels;

    function checkAssignments(oModel) {
        var oSuperiorObjDefs = oModel.SuperiorObjDefs();
        for (var i in oSuperiorObjDefs) {
            var oSuperiorObjDef = oSuperiorObjDefs[i];
            if (oSuperiorObjDef.Attribute(Constants.AT_SAP_FUNC_TYPE, nLoc).IsMaintained()) return true;
        }
        return false;
    }
}

function getSymbolMapping() {
    var aFromSymbols = extendSymbols( [Constants.ST_SAP_GENERAL_DOC,  // General documentation
                                       Constants.ST_SAP_TEST_DOC,     // Test documentation
                                       Constants.ST_SAP_TRAINING_DOC, // Training documentation
                                       Constants.ST_SAP_PROJ_DOC] );  // Project documentation
    var aFromSymbolNames = getSymbolNames(aFromSymbols);

    var aToSymbols = extendSymbols( [Constants.ST_SAP_TEST_DOC,     // Test documentation
                                     Constants.ST_SAP_TRAINING_DOC, // Training documentation
                                     Constants.ST_SAP_PROJ_DOC] );  // Project documentation
    var aToSymbolNames = getSymbolNames(aToSymbols);

    return Dialogs.showDialog(new myDialog(), Constants.DIALOG_TYPE_ACTION, getString("DLG_TITLE"));    
    
    function myDialog() {
        var bDialogOk = true;
        
        // returns DialogTemplate[] (see help) or the dialog XML ID
        // non-optional
        this.getPages = function() {
            var iDialogTemplate = Dialogs.createNewDialogTemplate(650, 200, "");
            
            iDialogTemplate.Text(10, 12, 140, 15, getString("DLG_REPLACE_GENERAL"));  
            iDialogTemplate.ComboBox(150, 10, 220, 15, aFromSymbolNames, "COMBOBOX_GENERAL_FROM");
            iDialogTemplate.Text(385, 12, 20, 15, getString("DLG_TO"));  
            iDialogTemplate.ComboBox(410, 10, 220, 15, aToSymbolNames, "COMBOBOX_GENERAL_TO");

            iDialogTemplate.Text(10, 42, 140, 15, getString("DLG_REPLACE_TRAINING"));  
            iDialogTemplate.ComboBox(150, 40, 220, 15, aFromSymbolNames, "COMBOBOX_TRAINING_FROM");
            iDialogTemplate.Text(385, 42, 20, 15, getString("DLG_TO"));  
            iDialogTemplate.ComboBox(410, 40, 220, 15, aToSymbolNames, "COMBOBOX_TRAINING_TO");
            
            return [iDialogTemplate];
        }
        
        // optional
        this.init = function(aPages) {
            aPages[0].getDialogElement("COMBOBOX_GENERAL_FROM").setSelection( getIndex(aFromSymbols, Constants.ST_SAP_GENERAL_DOC));    // General documentation
            aPages[0].getDialogElement("COMBOBOX_GENERAL_TO").setSelection(   getIndex(aToSymbols,   Constants.ST_SAP_PROJ_DOC));       //Project documentation
            aPages[0].getDialogElement("COMBOBOX_TRAINING_FROM").setSelection(getIndex(aFromSymbols, Constants.ST_SAP_TRAINING_DOC));   // Training documentation
            aPages[0].getDialogElement("COMBOBOX_TRAINING_TO").setSelection(  getIndex(aToSymbols,  Constants.ST_SAP_PROJ_DOC));        //Project documentation
        }
        
        // mandatory
        this.isInValidState = function(pageNumber) {
            return true;
        }
        
        //optional - called after ok/finish has been pressed and the current state data has been applied
        this.onClose = function(pageNumber, bOk) {
            bDialogOk = bOk;
        }        
        
        // optional - the result of this function is returned as result of Dialogs.showDialog(). Can be any object.
        this.getResult = function() {
            if (bDialogOk) {
                var page = this.dialog.getPage(0);
                var tSymbolMapping = new TYPE_SYMBOL();
                tSymbolMapping.nGeneralFrom  = getSymbol(aFromSymbols, page, "COMBOBOX_GENERAL_FROM");
                tSymbolMapping.nGeneralTo    = getSymbol(aToSymbols,   page, "COMBOBOX_GENERAL_TO");
                tSymbolMapping.nTrainingFrom = getSymbol(aFromSymbols, page, "COMBOBOX_TRAINING_FROM");
                tSymbolMapping.nTrainingTo   = getSymbol(aToSymbols,   page, "COMBOBOX_TRAINING_TO");
                return tSymbolMapping;  
            }
            return null;
        }
        
        function getIndex(aSymbols, nSymbol) {
            for (var i=0; i < aSymbols.length; i++) {
                if (aSymbols[i] == nSymbol) return i;
            }
            return 0;
        }        
        
        function getSymbol(aSymbols, page, sDlgElement) {
            return aSymbols[page.getDialogElement(sDlgElement).getSelectedIndex()];
        }
    }
    
    function getSymbolNames(aSymbols) {
        var aSymbolNames = new Array();
        for (var i in aSymbols) {
            aSymbolNames.push(formatstring2("@1 (@2)", oFilter.SymbolName(aSymbols[i]), aSymbols[i]));
        }
        return aSymbolNames;
    }    
}

/************************************************************************************************************************************/
// Output

function outHeader() {
    oOut.TableRow();
    oOut.TableCellF(getString("OBJECT_NAME"),    40, "HEAD");
    oOut.TableCellF(getString("MODEL_NAME"),     40, "HEAD");
    oOut.TableCellF(getString("MODEL_SEARCHID"), 50, "HEAD");
    oOut.TableCellF(getString("SYMBOL_CHANGED"), 60, "HEAD");
    oOut.TableCellF(getString("RESULT"),         60, "HEAD");
}

function outData(oModel, oObjDef, sOldSymbol, sNewSymbol, bResult, sErrorText) {
    var styleSheet = bResult ? "STD" : "RED";
    oOut.TableRow();
    oOut.TableCellF(outName(oObjDef),                           40, styleSheet);
    oOut.TableCellF(outName(oModel),                            40, styleSheet);
    oOut.TableCellF(outSearchID(oModel),                        50, styleSheet);
    oOut.TableCellF(outChange(bResult, sOldSymbol, sNewSymbol), 60, styleSheet);
    oOut.TableCellF(outResult(bResult, sErrorText),             60, styleSheet);
}
