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


ALLOWED_TYPE = function(p_allowedColTypes, p_allowedRowTypes, p_allowedAllocTypes) {
    this.nModelType     = PSM_MODEL_TYPE;    
    this.aPsuObjTypes   = UNIT_OBJ_TYPES;    
    this.aColObjTypes   = p_allowedColTypes;
    this.aRowObjTypes   = p_allowedRowTypes;
    this.aAllocObjTypes = p_allowedAllocTypes;
    this.aSymbols       = null;    
    this.aModelAttrs    = PSM_ATTR_TYPES;
    this.aPsuAttrs      = UNIT_ATTR_TYPES;
    this.aAllocCxnAttrs = ALLOC_CXN_ATTR_TYPES;
}

SYMBOL_TYPE = function(p_psuSymbolTypes, p_colSymbolTypes, p_rowSymbolTypes, p_allocSymbolTypes) {
    this.aPsuSymbolTypes   = p_psuSymbolTypes;
    this.aColSymbolTypes   = p_colSymbolTypes;
    this.aRowSymbolTypes   = p_rowSymbolTypes;
    this.aAllocSymbolTypes = p_allocSymbolTypes;
}    

var g_oPsmConfig = null;

main();

/*************************************************************************/

function main() {
    var aFilters = getFilters();
    if (aFilters == null) {
        outErrorMessage(getString("MSG_WRONG_FILTER_SELECTION"))
        return;
    }
    var oEntireMethod = aFilters[0];
    var oFilterToUpdate = aFilters[1];

    g_oPsmConfig = new psmConfig(null/*p_bMacro*/, oEntireMethod);
    
    var allowedData = Dialogs.showDialog(new getFilterDialog(oFilterToUpdate, oEntireMethod), Constants.DIALOG_TYPE_ACTION, getString("ALLOWED_FILTER_OBJECTS"));
    if (allowedData != null) {
        var updateResult = updateFilter(oFilterToUpdate, oEntireMethod, allowedData);
    }   
}

function updateFilter(oFilterToUpdate, oEntireMethod, allowedData) {
    try {
        var filterInfo = ArisData.modifyConfigurationFilter("", oFilterToUpdate.GUID(), false);	// AGA-9618
    } catch(e) {
        outErrorMessage(getString("MSG_WRONG_USER"));
        return false;
    }

    allowedData.aSymbols = getRequiredSymbolTypes();

    var bSave = false;
    bSave = updateAllowedModels()       || bSave;
    bSave = updateAllowedObjDefs()      || bSave;
    bSave = updateAllowedCxnDefs()      || bSave;
    bSave = updateAllowedModelSymbols() || bSave;
    bSave = updateAllowedModelCxns()    || bSave;
    bSave = updateAllowedAttributes()   || bSave;
    
    if (bSave) return filterInfo.saveFilterInfos();
    return false;

    function updateAllowedModels() {
        var requiredTypes = getRequiredTypes();
        var allowedTypes = filterInfo.getAllowedModels();
        
        if (mustBeUpdated(requiredTypes, allowedTypes, true/*bIsSimpleType*/)) {
            var newAllowedTypes = getNewAllowedTypes(requiredTypes, allowedTypes, true/*bIsSimpleType*/);
            var result = filterInfo.setAllowedModels(newAllowedTypes);
            if (result) {
                // default attributes
                var defaultAttrs = [Constants.AT_NAME, Constants.AT_ID, Constants.AT_TYPE_6];
                for (var i = 0; i < newAllowedTypes.length; i++) {
                    updateAllowedItemAttributes(Constants.CID_MODEL, newAllowedTypes[i], defaultAttrs);
                }                    
            }
            return result;
        }
        return false;

        function getRequiredTypes() {
            var aModelTypes = [allowedData.nModelType];
            return aModelTypes;
        }
    }
    
    function updateAllowedObjDefs() {
        var requiredTypes = getRequiredTypes();
        var allowedTypes = filterInfo.getAllowedObjectDefs();

        if (mustBeUpdated(requiredTypes, allowedTypes, true/*bIsSimpleType*/)) {
            var newAllowedTypes = getNewAllowedTypes(requiredTypes, allowedTypes, true/*bIsSimpleType*/);
            var result = filterInfo.setAllowedObjectDefs(newAllowedTypes);    
            if (result) {
                for (var i = 0; i < newAllowedTypes.length; i++) {
                    // default attributes
                    var defaultAttrs;
                    if (newAllowedTypes[i] == Constants.OT_APPL_SYS_TYPE) {
                        defaultAttrs = [Constants.AT_NAME, Constants.AT_ID, Constants.AT_TYPE_6, Constants.AT_SYSTEM_TYPE]; // Anubis 519516
                    } else {
                        defaultAttrs = [Constants.AT_NAME, Constants.AT_ID, Constants.AT_TYPE_6];
                    }
                    updateAllowedItemAttributes(Constants.CID_OBJDEF, newAllowedTypes[i], defaultAttrs);
                }                    
            }
            return result;
        }
        return false;
        
        function getRequiredTypes() {
            var aPsuObjTypes   = allowedData.aPsuObjTypes;
            var aColObjTypes   = allowedData.aColObjTypes;
            var aRowObjTypes   = allowedData.aRowObjTypes;
            var aAllocObjTypes = allowedData.aAllocObjTypes;

            return aPsuObjTypes.concat(aColObjTypes).concat(aRowObjTypes).concat(aAllocObjTypes);
        }
    }
    
    function updateAllowedCxnDefs() {
        var requiredTypes = getRequiredTypes();
        var allowedTypes = filterInfo.getAllowedCxnDefs();

        if (mustBeUpdated(requiredTypes, allowedTypes, true/*bIsSimpleType*/)) {
            var newAllowedTypes = getNewAllowedTypes(requiredTypes, allowedTypes, true/*bIsSimpleType*/);
            var result = filterInfo.setAllowedCxnDefs(newAllowedTypes);   
            if (result) {
                // default attributes
                var defaultAttrs = [Constants.AT_ID, Constants.AT_TYPE_6];
                for (var i = 0; i < newAllowedTypes.length; i++) {
                    updateAllowedItemAttributes(Constants.CID_CXNDEF, newAllowedTypes[i], defaultAttrs);
                }                    
            }
            return result;
            
        }
        return false;
        
        function getRequiredTypes() {
            var psuSymbolTypes   = allowedData.aSymbols.aPsuSymbolTypes;
            var colSymbolTypes   = allowedData.aSymbols.aColSymbolTypes;
            var rowSymbolTypes   = allowedData.aSymbols.aRowSymbolTypes;
            var allocSymbolTypes = allowedData.aSymbols.aAllocSymbolTypes;
            
            var cxnTypes = new Array();
            cxnTypes = cxnTypes.concat(getCxnTypes(psuSymbolTypes, colSymbolTypes));
            cxnTypes = cxnTypes.concat(getCxnTypes(psuSymbolTypes, rowSymbolTypes));            
            cxnTypes = cxnTypes.concat(getCxnTypes(psuSymbolTypes, allocSymbolTypes));            
            cxnTypes = cxnTypes.concat(getCxnTypes(allocSymbolTypes, colSymbolTypes));
            cxnTypes = cxnTypes.concat(getCxnTypes(allocSymbolTypes, rowSymbolTypes));            
            
            var cxnTypeSet = new java.util.HashSet();
            for (var i = 0; i < cxnTypes.length; i++) {
                cxnTypeSet.add(cxnTypes[i]);
            }
            return cxnTypeSet.toArray();
        }
    }
    
    function updateAllowedModelSymbols() {
        var modelType = allowedData.nModelType;
        var requiredTypes = getRequiredTypes();
        var allowedTypes = filterInfo.getAllowedModelSymbols(modelType);

        if (mustBeUpdated(requiredTypes, allowedTypes, true/*bIsSimpleType*/)) {
            var newAllowedTypes = getNewAllowedTypes(requiredTypes, allowedTypes, true/*bIsSimpleType*/);
            var result = filterInfo.setAllowedModelSymbols(modelType, newAllowedTypes);    
            return result;
        }
        return false;
        
        function getRequiredTypes() {
            var psuSymbolTypes   = allowedData.aSymbols.aPsuSymbolTypes;
            var colSymbolTypes   = allowedData.aSymbols.aColSymbolTypes;
            var rowSymbolTypes   = allowedData.aSymbols.aRowSymbolTypes;
            var allocSymbolTypes = allowedData.aSymbols.aAllocSymbolTypes;
            
            return psuSymbolTypes.concat(colSymbolTypes).concat(rowSymbolTypes).concat(allocSymbolTypes);
        }
    }

    function updateAllowedModelCxns() {
        var modelType = allowedData.nModelType;
        var requiredCxnInfos = getRequiredCxnInfos();
        var allowedCxnInfos = filterInfo.getAllowedModelConnections(modelType);

        if (mustBeUpdated(requiredCxnInfos, allowedCxnInfos, false/*bIsSimpleType*/)) {
            var newAllowedCxnInfos = getNewAllowedTypes(requiredCxnInfos, allowedCxnInfos, false/*bIsSimpleType*/);
            var result = filterInfo.setAllowedModelConnections(modelType, newAllowedCxnInfos);
            return result;
        }
        return false;
        
        function getRequiredCxnInfos() {
            var psuSymbolTypes   = allowedData.aSymbols.aPsuSymbolTypes;
            var colSymbolTypes   = allowedData.aSymbols.aColSymbolTypes;
            var rowSymbolTypes   = allowedData.aSymbols.aRowSymbolTypes;
            var allocSymbolTypes = allowedData.aSymbols.aAllocSymbolTypes;
            
            var cxnInfos = new Array();
            cxnInfos = cxnInfos.concat(getCxnInfos(psuSymbolTypes, colSymbolTypes));
            cxnInfos = cxnInfos.concat(getCxnInfos(psuSymbolTypes, rowSymbolTypes));            
            cxnInfos = cxnInfos.concat(getCxnInfos(psuSymbolTypes, allocSymbolTypes));            
            cxnInfos = cxnInfos.concat(getCxnInfos(allocSymbolTypes, colSymbolTypes));
            cxnInfos = cxnInfos.concat(getCxnInfos(allocSymbolTypes, rowSymbolTypes));            
            
            return cxnInfos;
            
            function getCxnInfos(symbolTypesA, symbolTypesB) {
                var cxnInfos = new Array();
                for (var i = 0; i < symbolTypesA.length; i++) {
                    for (var j = 0; j < symbolTypesB.length; j++) {
                        // A -> B
                        var sourceSymbol = symbolTypesA[i];
                        var targetSymbol = symbolTypesB[j];
                        var cxnTypes = oEntireMethod.CxnTypes(modelType, sourceSymbol, targetSymbol);
                        for (var k = 0; k < cxnTypes.length; k++) {
                            cxnInfos.push(filterInfo.createCxnInfo(cxnTypes[k], sourceSymbol, targetSymbol));
                        }
                        // B -> A
                        var sourceSymbol = symbolTypesB[j];
                        var targetSymbol = symbolTypesA[i];
                        var cxnTypes = oEntireMethod.CxnTypes(modelType, sourceSymbol, targetSymbol);
                        for (var k = 0; k < cxnTypes.length; k++) {
                            cxnInfos.push(filterInfo.createCxnInfo(cxnTypes[k], sourceSymbol, targetSymbol));
                        }
                    }
                }
                return cxnInfos;
            }
        }        
    }    

    function updateAllowedAttributes() {
        var bUpdated = false;

        // model attributes
        var requiredAttrs = allowedData.aModelAttrs;
        var itemKind = Constants.CID_MODEL;
        var itemType = allowedData.nModelType;
        bUpdated = updateAllowedItemAttributes(itemKind, itemType, requiredAttrs) || bUpdated;

        // psu attributes
        var requiredAttrs = allowedData.aPsuAttrs;
        var itemKind = Constants.CID_OBJDEF;
        var aPsuObjTypes = allowedData.aPsuObjTypes;
        for (var i = 0; i < aPsuObjTypes.length; i++) {
            var itemType = aPsuObjTypes[i];
            bUpdated = updateAllowedItemAttributes(itemKind, itemType, requiredAttrs) || bUpdated;
        }
        
        // cxn attributes
        var requiredAttrs = allowedData.aAllocCxnAttrs;
        var itemKind = Constants.CID_CXNDEF;
        var aAllocCxnTypes = getAllocCxnTypes();
        for (var i = 0; i < aAllocCxnTypes.length; i++) {
            var itemType = aAllocCxnTypes[i];
            bUpdated = updateAllowedItemAttributes(itemKind, itemType, requiredAttrs) || bUpdated;
        }
        return bUpdated;
        
        function getAllocCxnTypes() {
            var psuSymbolTypes   = allowedData.aSymbols.aPsuSymbolTypes;
            var allocSymbolTypes = allowedData.aSymbols.aAllocSymbolTypes;
            
            var cxnTypes = getCxnTypes(psuSymbolTypes, allocSymbolTypes);
            
            var cxnTypeSet = new java.util.HashSet();
            for (var i = 0; i < cxnTypes.length; i++) {
                cxnTypeSet.add(cxnTypes[i]);
            }
            return cxnTypeSet.toArray();
        }
    }
    
    function updateAllowedItemAttributes(itemKind, itemType, requiredAttrs) {
        var allowedAttrs = filterInfo.getAllowedItemAttributes(itemKind, itemType);
        
        if (mustBeUpdated(requiredAttrs, allowedAttrs, true/*bIsSimpleType*/)) {
            var newAllowedAttrs = getNewAllowedTypes(requiredAttrs, allowedAttrs, true/*bIsSimpleType*/);
            newAllowedAttrs = filterAttributeGroups(newAllowedAttrs);
            return filterInfo.setAllowedItemAttributes(itemKind, itemType, newAllowedAttrs);    
        }
        return false;
        
        function filterAttributeGroups(aAttrs) {
            var aFilteredAttrs = new Array();
            for (var i = 0; i < aAttrs.length; i++) {
                var attrTypeNum = aAttrs[i];
                if (oEntireMethod.AttrBaseType(attrTypeNum) > 0 ) {
                    aFilteredAttrs.push(attrTypeNum);
                }
            }
            return aFilteredAttrs;
        }
    }    
    
    function getCxnTypes(symbolTypesA, symbolTypesB) {
        var modelType = allowedData.nModelType;
        var cxnTypes = new Array();
        for (var i = 0; i < symbolTypesA.length; i++) {
            for (var j = 0; j < symbolTypesB.length; j++) {
                // A -> B
                cxnTypes = cxnTypes.concat(oEntireMethod.CxnTypes(modelType, symbolTypesA[i], symbolTypesB[j]));
                // B -> A
                cxnTypes = cxnTypes.concat(oEntireMethod.CxnTypes(modelType, symbolTypesB[j], symbolTypesA[i]));
            }
        }
        return cxnTypes;
    }
        
    function getRequiredSymbolTypes() {
        var psuSymbolTypes   = getAllowedSymbolTypes(allowedData.aPsuObjTypes); 
        var colSymbolTypes   = getDefaultSymbolTypes(allowedData.aColObjTypes);
        var rowSymbolTypes   = getDefaultSymbolTypes(allowedData.aRowObjTypes);
        var allocSymbolTypes = getDefaultSymbolTypes(allowedData.aAllocObjTypes);

        return new SYMBOL_TYPE(psuSymbolTypes, colSymbolTypes, rowSymbolTypes, allocSymbolTypes);

        function getAllowedSymbolTypes(aObjTypes) {
            var modelType = allowedData.nModelType;
            var aSymbolTypes = new Array(); 
            for (var i = 0; i < aObjTypes.length; i++) {
                aSymbolTypes = aSymbolTypes.concat(oEntireMethod.Symbols(modelType, aObjTypes[i]));
            }
            return aSymbolTypes;
        }
        
        function getDefaultSymbolTypes(aObjTypes) {
            var aSymbolTypes = new Array(); 
            for (var i = 0; i < aObjTypes.length; i++) {
                //var symbolType = g_oPsmConfig.getDefaultSymbol(aObjTypes[i]);
                //if (symbolType != null) aSymbolTypes.push(symbolType);
                aSymbolTypes = aSymbolTypes.concat(g_oPsmConfig.getDefaultSymbols(aObjTypes[i]));
            }
            return aSymbolTypes;
        }
    }

   
    function getNewAllowedTypes(requiredTypes, allowedTypes, bIsSimpleType) {
        var newAllowedTypes = copyArray(allowedTypes);
        for (var i = 0; i < requiredTypes.length; i++) {
            var requiredType = requiredTypes[i];
            if (!isAllowedType(requiredTypes[i], newAllowedTypes, bIsSimpleType)) {
                newAllowedTypes.push(requiredType);
            }
        }
        return newAllowedTypes;
        
        function copyArray(aArray) {
            var aCopiedArray = new Array();
            for (var i = 0; i < aArray.length; i++) {            
                aCopiedArray[i] = aArray[i];
            }
            return aCopiedArray;
        }
    }
    
    function mustBeUpdated(requiredTypes, allowedTypes, bIsSimpleType) {
        for (var i = 0; i < requiredTypes.length; i++) {
            if (!isAllowedType(requiredTypes[i], allowedTypes, bIsSimpleType)) return true;
        }
        return false;
    }
    
    function isAllowedType(requiredType, allowedTypes, bIsSimpleType) {
        if (bIsSimpleType) {
            return allowedTypes.some(function(p_typeNum){return p_typeNum == requiredType});
        }
        // cmp. CxnInfo
        return allowedTypes.some(function(p_cxnInfo) {
            var bSameCxnType = p_cxnInfo.getCxnBaseType() == requiredType.getCxnBaseType();
            var bSameSource = p_cxnInfo.getSourceSymbol() == requiredType.getSourceSymbol();
            var bSameTarget = p_cxnInfo.getTargetSymbol() == requiredType.getTargetSymbol();
            
            return (bSameCxnType && bSameSource && bSameTarget)
        });
    }
}

function getFilterDialog(oFilterToUpdate, oEntireMethod) {
    var myCOLHEAD_OBJ_TYPES = getHeaderTypes(oEntireMethod, true/*bIsColHeader*/);
    var myROWHEAD_OBJ_TYPES = getHeaderTypes(oEntireMethod, false/*bIsColHeader*/);
    var myALLOC_OBJ_TYPES   = ALLOC_OBJ_TYPES;
    
    var allowedColTypes = new Array();
    var allowedRowTypes = new Array();    
    var allowedAllocTypes = new Array();    
    
    var dY = 15;    
    this.getPages = function() {   
        var filterDialog = Dialogs.createNewDialogTemplate(0, 0, 500, 260);
        var yPos = 5; 
        var yHeight = (myCOLHEAD_OBJ_TYPES.length+1) * dY + 5;
        filterDialog.GroupBox(10, yPos, 480, yHeight, getString("ALLOWED_COLS"));
        yPos = createCheckBoxes(myCOLHEAD_OBJ_TYPES, "COL_CHECK_");
        
        yPos += dY + 10;
        var yHeight = (myROWHEAD_OBJ_TYPES.length+1) * dY + 5;
        filterDialog.GroupBox(10, yPos, 480, yHeight, getString("ALLOWED_ROWS"));
        yPos = createCheckBoxes(myROWHEAD_OBJ_TYPES, "ROW_CHECK_");

        yPos += dY + 10;
        var yHeight = (myALLOC_OBJ_TYPES.length+1) * dY + 5;
        filterDialog.GroupBox(10, yPos, 480, yHeight, getString("ALLOWED_ALLOCS"));
        yPos = createCheckBoxes(myALLOC_OBJ_TYPES, "ALLOC_CHECK_");

        return [filterDialog];
        
        function createCheckBoxes(aObjTypes, sPrefix) {
            for (var i = 0; i < aObjTypes.length; i++) {
                yPos += dY;
                filterDialog.CheckBox(20, yPos, 300, 15, oEntireMethod.ObjTypeName(aObjTypes[i]), sPrefix+parseInt(aObjTypes[i]), 0);
            }    
            return yPos;
        }        
    }
    //initialize dialog pages (are already created and pre-initialized with static data from XML or template)
    //parameter: Array of DialogPage
    //see Help: DialogPage
    //user can set control values
    //optional
    this.init = function(aPages) {
        var modelType = PSM_MODEL_TYPE;
        var aModelSymbols = oFilterToUpdate.Symbols(modelType);
        
        initCheckBoxes(myCOLHEAD_OBJ_TYPES, "COL_CHECK_");
        initCheckBoxes(myROWHEAD_OBJ_TYPES, "ROW_CHECK_");
        initCheckBoxes(myALLOC_OBJ_TYPES  , "ALLOC_CHECK_");        

        function initCheckBoxes(aObjTypes, sPrefix) {
            for (var i = 0; i < aObjTypes.length; i++) {
                var objType = aObjTypes[i];

                for (var j = 0; j < aModelSymbols.length; j++) {
                    if (oFilterToUpdate.SymbolObjType(aModelSymbols[j]) == objType) {
                        var checkBox = aPages[0].getDialogElement(sPrefix+parseInt(objType));
                        checkBox.setChecked(true);
                        checkBox.setEnabled(false);
                        break;
                    }
                }
            }
        }
    }
    // returns true if the page is in a valid state. In this case OK, Finish, or Next is enabled.
    // called each time a dialog value is changed by the user (button pressed, list selection, text field value, table entry, radio button,...)
    // pageNumber: the current page number, 0-based
    this.isInValidState = function(pageNumber) {
        return true;
    }
    // returns true if the "Finish" or "Ok" button should be visible on this page.
    // pageNumber: the current page number, 0-based
    // optional. if not present: always true
    this.canFinish = function(pageNumber) {
        return true;
    }
    // returns true if the user can switch to another page.
    // pageNumber: the current page number, 0-based
    // optional. if not present: always true
    this.canChangePage = function(pageNumber) {
        return true;
    }
    //called after ok/finish has been pressed and the current state data has been applied
    //can be used to update your data
    // pageNumber: the current page number
    // bOK: true=Ok/finish, false=cancel pressed
    //optional
    this.onClose = function(pageNumber, bOk) {
        var page = this.dialog.getPage(pageNumber);
        if (bOk) {
            allowedColTypes   = getAllowedTypes(myCOLHEAD_OBJ_TYPES, "COL_CHECK_");
            allowedRowTypes   = getAllowedTypes(myROWHEAD_OBJ_TYPES, "ROW_CHECK_");
            allowedAllocTypes = getAllowedTypes(myALLOC_OBJ_TYPES, "ALLOC_CHECK_");

        } else {
            allowedColTypes = null;
            allowedRowTypes = null;
            allowedAllocTypes = null;            
        }
        
        function getAllowedTypes(aObjTypes, sPrefix) {
            var allowedTypes = new Array();
            for (var i = 0; i < aObjTypes.length; i++) {
                var objType = aObjTypes[i];
                if (page.getDialogElement(sPrefix+parseInt(objType)).isChecked()) {
                    allowedTypes.push(objType);
                }
            }
            return allowedTypes;
        }
    }
    //the result of this function is returned as result of Dialogs.showDialog(). Can be any object.
    //optional    
    this.getResult = function() {
        if (allowedColTypes == null || allowedRowTypes == null || allowedAllocTypes == null) return null;
        return new ALLOWED_TYPE(allowedColTypes, allowedRowTypes, allowedAllocTypes);
    }
}

function getFilters() {
    var oSelectedFilters = ArisData.getSelectedFilters();
    if (oSelectedFilters.length == 2) {
        if (oSelectedFilters[0].IsFullMethod()) {
            return oSelectedFilters;
        } else if (oSelectedFilters[1].IsFullMethod()) {
            return [oSelectedFilters[1], oSelectedFilters[0]];  // reverse order
        }
    }
    return null;
}

function outErrorMessage(sMsgText) {
    sMsgText += "\n" + getString("MSG_REPORT_CANCELED");
    Dialogs.MsgBox(sMsgText, Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, Context.getScriptInfo(Constants.SCRIPT_NAME));
}
