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

var sNamePrefix = "COPY_";      // This prefix is added to the name of the newly created function definition

/************************************************************************************************************************************/

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

const cEPC = "EPC";
const cVACD = "VACD";
const cBPMN = "BPMN";

if ( checkEntireMethod() ) {

    var oDB = ArisData.getActiveDatabase();
    var langList = oDB.LanguageList();  
    
    if (!bAutoTouch) oDB.setAutoTouch(false);     // No touch !!!
    ArisData.Save(Constants.SAVE_ONDEMAND);
    
    var aSymbols_EPC, aSymbols_VACD, aSymbols_BPMN;
    var aShortcutSymbols;
    
    init();
    
    var oOut;
    var mapNewSymbols = getSymbolMapping(); 
    if (mapNewSymbols != null) { 
        oOut = Context.createOutputObject();
        initOutput(oOut);
        oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
        outHeader();
        
        updateShortcuts();
        
        oOut.EndTable(getString("PROTOCOL"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        oOut.WriteReport();    
    }    
}

/************************************************************************************************************************************/

function updateShortcuts() {
    var mapObjDefs = new java.util.HashMap();
    
    var oModels = getModels().sort(sortModelName);
    for (var i in oModels) {
        var oModel = oModels[i];
        if ( isModelOfType_BPMN(oModel) ) {
            //BPMN models
            updateBPMN_CallActivities(oModel);
        } else {
            // EPC, VACD models            
            var oShortcutOccs = oModel.ObjOccListBySymbol(aShortcutSymbols).sort(sortObjDefName);
            if (oShortcutOccs.length == 0) continue;
            
            if ( !canModelBeChanged(oModel) ) {
                outData(oModel, null, false, getString("ERROR_MSG_MODEL"));
                continue;
            }
            
            for (var j in oShortcutOccs) {
                var oShortcutOcc = oShortcutOccs[j];
                var nNewSymbol = getSelectedSymbol(oShortcutOcc);
                
                // Copy object definition
                var oNewObjDef = copyObjDef(oShortcutOcc.ObjDef(), oModel, nNewSymbol);
                if (oNewObjDef == null) {
                    outData(oModel, null, false, getString("ERROR_MSG_CREATE_OBJECT"));
                    continue;
                }
                oShortcutOcc = oShortcutOcc.ReplaceObjDef(oNewObjDef);
                if (!oShortcutOcc.IsValid()) {
                    outData(oModel, null, false, getString("ERROR_MSG_REPLACE_OBJECT"));
                    continue;
                }
                var bResult = replaceSymbol(oShortcutOcc, nNewSymbol);
                var sErrorText = bResult ? "" : getString("ERROR_MSG_SYMBOL");
                outData(oModel, oShortcutOcc.ObjDef(), bResult, sErrorText);
            }
            ArisData.Save(Constants.SAVE_NOW);
        }
    }
    
    function sortModelName(modelA, modelB) {return StrComp(modelA.Name(nLoc), modelB.Name(nLoc))}
    function sortObjDefName(occA, occB) {return StrComp(occA.ObjDef().Name(nLoc), occB.ObjDef().Name(nLoc))}
    
    function replaceSymbol(oObjOcc, nNewSymbol) {
        if (nNewSymbol == null) return false;
        return oObjOcc.setSymbol(nNewSymbol);
    }
    
    function getSelectedSymbol(oObjOcc) {
        var sKey = "";
        var nModelType = oObjOcc.Model().TypeNum();
        if (isTypeInList(nModelType, g_aModelTypes_EPC))  sKey =  cEPC;
        if (isTypeInList(nModelType, g_aModelTypes_VACD)) sKey = cVACD;
        if (isTypeInList(nModelType, g_aModelTypes_BPMN)) sKey = cBPMN;
        
        return mapNewSymbols.get(sKey);
    }
    
    function updateBPMN_CallActivities(oModel) {
        var oShortcutOccs = getBPMNShortcuts(oModel).sort(sortObjDefName);
        if (oShortcutOccs.length == 0) return;
        
        if ( !canModelBeChanged(oModel) ) {
            outData(oModel, null, false, getString("ERROR_MSG_MODEL"));
            return;
        }
        
        for (var i in oShortcutOccs) {
            var sErrorText = "";
            
            var oShortcutOcc = oShortcutOccs[i];
            var oShortcutDef = oShortcutOcc.ObjDef();
            
            var nNewSymbol = replaceBPMNSymbol(oShortcutOcc);
            if (nNewSymbol != null) {
                if ( updateBPMNMasterData(oShortcutDef) ) {
                    if ( updateBPMNAttributes(oShortcutDef, nNewSymbol) ) {
                        
                    } else { sErrorText = getString("ERROR_MSG_BPMN_ATTRS")}
                } else     { sErrorText = getString("ERROR_MSG_BPMN_MASTER")}
            } else         { sErrorText = getString("ERROR_MSG_SYMBOL") }
            var bResult = (sErrorText == "");
            outData(oModel, oShortcutOcc.ObjDef(), bResult, sErrorText);
        }
        ArisData.Save(Constants.SAVE_NOW);
        
        function getBPMNShortcuts(oModel) {
            var oShortcutOccs = new Array();
            var oObjOccs = oModel.ObjOccListFilter(Constants.OT_FUNC);
            for (var i in oObjOccs) {
                var oObjOcc = oObjOccs[i];
                var oObjDef = oObjOcc.ObjDef();
                if ( checkAttrValue(oObjDef, Constants.AT_BPMN_CALLED_ELEMENT, Constants.AVT_BPMN_GLOBAL_TASK) &&   // Called element = Global task
                     checkAttrValue(oObjDef, Constants.AT_BPMN_ACTIVITY_TYPE,  Constants.AVT_BPMN_CALL_ACTIVITY) && // Activity type = Call activity
                     getShortcutMasterCxn(oObjDef) != null ) {                                                      // Master is assigned  
                
                    oShortcutOccs.push(oObjOcc);
                }
            }
            return oShortcutOccs;
            
            function checkAttrValue(item, nAT, nAVT) { return item.Attribute(nAT, nLoc).MeasureUnitTypeNum() == nAVT }
        }
        
        function getShortcutMasterCxn(oObjDef) {
            var oInvokesCxns = oObjDef.CxnListFilter(Constants.EDGES_OUT, Constants.CT_INVOKES); // invokes
            for (var i in oInvokesCxns) {
                var oInvokesCxn = oInvokesCxns[i];
                var oMasterDef = oInvokesCxn.TargetObjDef();
                if (getSapID(oMasterDef) != "") return oInvokesCxn;
            }
            return null;
        }
        
        function replaceBPMNSymbol(oObjOcc) {
            var nNewSymbol = getSelectedSymbol(oObjOcc);
            if (nNewSymbol == null) return false;
            
            var bOk = oObjOcc.setSymbol(nNewSymbol);
            return bOk ? nNewSymbol : null;
        }
        
        function updateBPMNAttributes(oObjDef, nNewSymbol) {
            if (nNewSymbol == Constants.ST_BPMN_SUBPROCESS) {
                // Subprocess
                var res1 = setActivityType(oObjDef, Constants.AVT_BPMN_SUB_PROCESS);
                var res2 = setSubprocType(oObjDef, Constants.AVT_BPMN_SUB_PROCESS);
                var res3 = deleteCalledElement(oObjDef);
                var res4 = deleteTaskType(item);
                return res1 && res2 && res3 && res4;
            
            } else {
                // Task
                var res1 = setActivityType(oObjDef, Constants.AVT_BPMN_TASK);
                var res2 = setTaskType(oObjDef, getTaskType(nNewSymbol));
                var res3 = deleteCalledElement(oObjDef);
                return res1 && res2 && res3;                    
            }
            
            function setActivityType(item, nAVT) { return item.Attribute(Constants.AT_BPMN_ACTIVITY_TYPE, nLoc).SetValue(nAVT) }
            function setSubprocType(item, nAVT)  { return item.Attribute(Constants.AT_BPMN_SUBPROCESS_TYPE, nLoc).SetValue(nAVT) }
            function setTaskType(item, nAVT)     { return (nAVT != null) ? item.Attribute(Constants.AT_BPMN_TASK_TYPE_2, nLoc).SetValue(nAVT) : false }
            function deleteCalledElement(item)   { return item.Attribute(Constants.AT_BPMN_CALLED_ELEMENT, nLoc).Delete() }
            function deleteTaskType(item)        { return item.Attribute(Constants.AT_BPMN_TASK_TYPE_2, nLoc).Delete() }
            
            function getTaskType(nSymbol) {
                var map = new java.util.HashMap();
                if (nSymbol == Constants.ST_BPMN_TASK)               return Constants.AVT_BPMN_TASK_TYPE_ABSTRACT;       // (Abstract) Task
                if (nSymbol == Constants.ST_BPMN_BUSINESS_RULE_TASK) return Constants.AVT_BPMN_TASK_TYPE_BUSINESS_RULE;  // Business rule task
                if (nSymbol == Constants.ST_BPMN_MANUAL_TASK_2)      return Constants.AVT_BPMN_TASK_TYPE_MANUAL;         // Manual task
                if (nSymbol == Constants.ST_BPMN_RECEIVE_TASK)       return Constants.AVT_BPMN_TASK_TYPE_RECEIVE;        // Receive task
                if (nSymbol == Constants.ST_BPMN_SCRIPT_TASK)        return Constants.AVT_BPMN_TASK_TYPE_SCRIPT;         // Script task
                if (nSymbol == Constants.ST_BPMN_SEND_TASK)          return Constants.AVT_BPMN_TASK_TYPE_SEND;           // Send task
                if (nSymbol == Constants.ST_BPMN_SERVICE_TASK)       return Constants.AVT_BPMN_TASK_TYPE_SERVICE;        // Service task
                if (nSymbol == Constants.ST_BPMN_USER_TASK)          return Constants.AVT_BPMN_TASK_TYPE_USER;           // User task
                return null;
            }
        }
        
        function updateBPMNMasterData(oShortcutDef) {
            var oInvokesCxn = getShortcutMasterCxn(oShortcutDef);
            var oMasterDef = oInvokesCxn.TargetObjDef();
            if (oInvokesCxn != null) {
                try {
                    copyAttrs_InAllLanguages(oMasterDef, oShortcutDef, false/*bSetPrefix*/);  
                    return oInvokesCxn.Delete(false/*delete occs and def (if possible)*/);
                } catch(e) {}
            }
            return false;
        }
    }
}

function getModels() {
    var aModelTypes = g_aModelTypes_EPC.concat(g_aModelTypes_VACD, g_aModelTypes_BPMN);
    var searchItem = getSearchItem(oDB, Constants.AT_SAP_MOD_TYPE, null);      // 'SAP model type' maintained

    return oDB.Find(Constants.SEARCH_MODEL, aModelTypes, searchItem);
}

function copyObjDef(oObjDef, oModel, nSymbolNum) {
    var oGroup = oModel.Group()
    var sParentID = oModel.Attribute(Constants.AT_SAP_ID2, nLoc).getValue();
    
    var oNewObjDef = oGroup.CreateObjDef(oObjDef.TypeNum(), oObjDef.Name(nLoc), nLoc);
    if (oNewObjDef.IsValid()) {
        if (nSymbolNum != null) oNewObjDef.SetDefaultSymbolNum(nSymbolNum, true/*bPropagate*/);
        
        copyAttrs_InAllLanguages(oObjDef, oNewObjDef, true/*bSetPrefix*/);  
        copyProperties(oObjDef, oNewObjDef);
        
        oNewObjDef.Attribute(Constants.AT_SAP_DOM, nLoc).setValue(sParentID);  // Write 'SAP ID' of model to attribute 'SAP dominant'
        
        return oNewObjDef;
    }
    return null;    // No valid ObjDef created
}

function copyAttrs_InAllLanguages(oItem, oNewItem, bSetPrefix) {
    for (var i in langList) {
        var loc = langList[i].LocaleId();
        var oAttrList = oItem.AttrList(loc);
        for (var j in oAttrList) {
            var oAttr = oAttrList[j];
            if (ignoreAttrType(oAttr.TypeNum())) continue;
            
            var oNewAttr = oNewItem.Attribute(oAttr.TypeNum(), loc);
            if (!oNewAttr.IsValid()) continue;
            
            switch(oFilter.AttrBaseType(oAttr.TypeNum())) {
                case Constants.ABT_BOOL:
                case Constants.ABT_COMBINED:
                case Constants.ABT_LONGTEXT:
                case Constants.ABT_VALUE:
                case Constants.ABT_BLOB:
                case Constants.ABT_FOREIGN_ID:
                    oNewAttr.SetValue(oAttr.MeasureValue(false), oAttr.MeasureUnitTypeNum());
                    break;
                default:
                    var sValue = oAttr.GetValue(false);
                    if (oAttr.TypeNum() == Constants.AT_NAME && bSetPrefix && sNamePrefix.length > 0) sValue = sNamePrefix + sValue;    // Add name prefix
                    oNewAttr.SetValue(sValue, oAttr.MeasureUnitTypeNum());
            }
        }
    }
    
    function ignoreAttrType(nAttrType) {
        var aIgnoredAttrTypes = [Constants.AT_TYPE_6, Constants.AT_CREAT_TIME_STMP, Constants.AT_CREATOR, Constants.AT_LAST_CHNG_2, Constants.AT_LUSER];
        return isTypeInList(nAttrType, aIgnoredAttrTypes);
    }
}    

function copyProperties(oItem, oNewItem) {
}

function getSymbolMapping() {
    return Dialogs.showDialog(new myDialog(), Constants.DIALOG_TYPE_ACTION, getString("DLG_TITLE"));    
    
    function myDialog() {
        var bDialogOk = true;
        
        // returns DialogTemplate[] (see help) or the dialog XML ID
        // non-optional
        this.getPages = function() {
            var iDialogTemplate = Dialogs.createNewDialogTemplate(650, 200, "");
            
            iDialogTemplate.Text(10, 13, 330, 15, getString("DLG_SYMBOL_IN_EPC_MODELS"));  
            iDialogTemplate.ComboBox(340, 10, 300, 21, getSymbolNames(aSymbols_EPC), "COMBOBOX_EPC");
            iDialogTemplate.Text(10, 43, 330, 15, getString("DLG_SYMBOL_IN_VACD_MODELS"));  
            iDialogTemplate.ComboBox(340, 40, 300, 21, getSymbolNames(aSymbols_VACD), "COMBOBOX_VACD");
            iDialogTemplate.Text(10, 73, 330, 15, getString("DLG_SYMBOL_IN_BPMN_MODELS"));  
            iDialogTemplate.ComboBox(340, 70, 300, 21, getSymbolNames(aSymbols_BPMN), "COMBOBOX_BPMN");
            
            return [iDialogTemplate];
        }
        
        // optional
        this.init = function(aPages) {
            aPages[0].getDialogElement("COMBOBOX_EPC").setSelection(getIndex(aSymbols_EPC, Constants.ST_SOLAR_FUNC));       // SAP function
            aPages[0].getDialogElement("COMBOBOX_VACD").setSelection(getIndex(aSymbols_VACD, Constants.ST_SOLAR_VAC));      // SAP function (value-added chain)
            aPages[0].getDialogElement("COMBOBOX_BPMN").setSelection(getIndex(aSymbols_BPMN, Constants.ST_BPMN_USER_TASK)); // User task
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
                var mapNewSymbols = new java.util.HashMap();
                mapNewSymbols.put(cEPC,  getSymbol(aSymbols_EPC,  page, "COMBOBOX_EPC"));
                mapNewSymbols.put(cVACD, getSymbol(aSymbols_VACD, page, "COMBOBOX_VACD"));
                mapNewSymbols.put(cBPMN, getSymbol(aSymbols_BPMN, page, "COMBOBOX_BPMN"));
                
                return mapNewSymbols;
            }
            return null;
        }
        
        function getIndex(aSymbols, nSymbol) {
            for (var i=0; i <aSymbols.length; i++) {
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
// Init

function init() {
    aShortcutSymbols = extendSymbols( [Constants.ST_SOLAR_FUNC_SHORTCUT, Constants.ST_SOLAR_VAC_SHORTCUT] );
    
    aSymbols_EPC  = getFunctionSymbols(g_aModelTypes_EPC);
    aSymbols_VACD = getFunctionSymbols(g_aModelTypes_VACD);
    aSymbols_BPMN = getBPMNSymbols();
    
    function getFunctionSymbols(aModelTypes) {
        var aAllSymbols = new Array();
        for (var i in aModelTypes) {
            var aSymbols = oFilter.Symbols(aModelTypes[i], Constants.OT_FUNC);
            for (var j in aSymbols) {
                var nSymbol = aSymbols[j];
                if (isTypeInList(nSymbol, aAllSymbols)) continue;       // Already listed
                if (isTypeInList(nSymbol, aShortcutSymbols)) continue;  // Ignore shortcut symbols
                
                aAllSymbols.push(nSymbol);
            }
        }
        return aAllSymbols.sort(sortSymbolName);
    }
    
    function getBPMNSymbols() {
        return [Constants.ST_BPMN_TASK,                 // (Abstract) Task
                Constants.ST_BPMN_BUSINESS_RULE_TASK,   // Business rule task
                Constants.ST_BPMN_MANUAL_TASK_2,        // Manual task
                Constants.ST_BPMN_RECEIVE_TASK,         // Receive task
                Constants.ST_BPMN_SCRIPT_TASK,          // Script task
                Constants.ST_BPMN_SEND_TASK,            // Send task
                Constants.ST_BPMN_SERVICE_TASK,         // Service task
                Constants.ST_BPMN_USER_TASK,            // User task
                Constants.ST_BPMN_SUBPROCESS]           // Subprocess    
    }

    function sortSymbolName(symbolA, symbolB) {
        return StrComp(oFilter.SymbolName(symbolA), oFilter.SymbolName(symbolB));
    }    
}

/************************************************************************************************************************************/
// Output

function outHeader() {
    oOut.TableRow();
    oOut.TableCellF(getString("OBJECT_NAME"),     40, "HEAD");
    oOut.TableCellF(getString("MODEL_NAME"),      40, "HEAD");
    oOut.TableCellF(getString("OBJECT_SEARCHID"), 50, "HEAD");
    oOut.TableCellF(getString("MODEL_SEARCHID"),  50, "HEAD");
    oOut.TableCellF(getString("RESULT"),          60, "HEAD");
}

function outData(oModel, oObjDef, bResult, sErrorText) {
    var styleSheet = bResult ? "STD" : "RED";
    oOut.TableRow();
    oOut.TableCellF(outName(oObjDef),               40, styleSheet);
    oOut.TableCellF(outName(oModel),                40, styleSheet);
    oOut.TableCellF(outSearchID(oObjDef),           50, styleSheet);
    oOut.TableCellF(outSearchID(oModel),            50, styleSheet);
    oOut.TableCellF(outResult(bResult, sErrorText), 60, styleSheet);
}
