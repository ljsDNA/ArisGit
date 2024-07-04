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

__usertype_tType = function(ntypenum, sname) {
  this.ntypenum = ntypenum;
  this.sname = sname;
}

__usertype_tSymbolMap = function(objecttype, sourcesymboltype, targetsymboltype) {
  this.objecttype = objecttype;
  this.sourcesymboltype = sourcesymboltype;
  this.targetsymboltype = targetsymboltype;  
}

var g_nloc = Context.getSelectedLanguage(); 
var g_ofilter = ArisData.getActiveDatabase().ActiveFilter();
var g_oDB = ArisData.getActiveDatabase();

var g_aObjectTypes = new Array();           // List of (current) object types
var g_aSourceSymbolTypes = new Array();     // List of (current) source symbol types
var g_aTargetSymbolTypes = new Array();     // List of (current) target symbol types 
var g_aSymbolMap = new Array();             // List of object/symbol mappings
var g_bSetDefaultSymbol = false;

main();

/********************************************************************************************************/

function main() {
    
    ArisData.Save(Constants.SAVE_ONDEMAND);
    
    if (showDialog()) {
        var aSrcSymbols = getSourceSymbols();       // BLUE-14171              
        var oModels = getModels(aSrcSymbols);

        var mapReplacements = getReplacementMap();       
        var aUnchangedObjOccs = performChanges(oModels, ArisData.getSelectedObjDefs(), aSrcSymbols, mapReplacements);

        if (aUnchangedObjOccs.length > 0) {
            showDialog2(aUnchangedObjOccs);
        }
    }
}

function getSourceSymbols() {
    var aSrcSymbols = new Array();
    for (var i = 0; i < g_aSymbolMap.length; i++) {
        var srcSymbol = g_aSymbolMap[i].sourcesymboltype.ntypenum;
        if (srcSymbol != -1) {
            aSrcSymbols.push(srcSymbol);
        } else {
            var symbolSet = new java.util.HashSet();
            var objType = g_aSymbolMap[i].objecttype.ntypenum;
            var modelTypes = g_ofilter.ModelTypes(Constants.ARISVIEW_ALL);
            for (var j = 0; j < modelTypes.length; j++) {
                var aSymbols = g_ofilter.Symbols(modelTypes[j], objType);
                for (var k in aSymbols) {
                    symbolSet.add(aSymbols[k]);
                }
            }
            aSrcSymbols = aSrcSymbols.concat(symbolSet.toArray());
        }
    }
    return aSrcSymbols;
}

function getReplacementMap() {
    var mapReplacements = new java.util.HashMap();
    for (var i = 0; i < g_aSymbolMap.length; i++) {
        var key = buildKey(g_aSymbolMap[i].objecttype.ntypenum, g_aSymbolMap[i].sourcesymboltype.ntypenum);    // BLUE-14171
        var val = g_aSymbolMap[i].targetsymboltype.ntypenum;
        mapReplacements.put(key, val);
    }
    return mapReplacements;
}

function getModels(aSrcSymbols) {
    return g_oDB.Find(Constants.SEARCH_MODEL, getModelTypes());

    function getModelTypes() {
        var aFilteredModelTypes = new Array();
        
        var modeltypenums = g_ofilter.ModelTypes(Constants.ARISVIEW_ALL);
        for (var i = 0; i < modeltypenums.length; i++) {
            for (var j = 0; j < aSrcSymbols.length; j++) {
                if (g_ofilter.IsValidSymbol(modeltypenums[i], aSrcSymbols[j])) {
                    aFilteredModelTypes.push(modeltypenums[i]);
                    break;
                }
            }
        }
        return aFilteredModelTypes;
    }
}

function performChanges(oModels, oSelObjDefs, aSrcSymbols/*BLUE-14171*/, mapReplacements) {
    var oUnchangedObjOccs = new Array();                    // List of objOccs which couldn't be updated
    var mapObjDefOIDsToReplace = new java.util.HashMap();   // Map of objDef OIDs where default symbol have to be updated

    var modelCount = 0;
    for (var i = 0; i < oModels.length; i++) {
        var oModel = oModels[i];
        
        var oObjOccs = getObjOccsToReplace(oModel, oSelObjDefs, aSrcSymbols);
        if (oObjOccs.length == 0) continue;
        
        for (var j = 0; j < oObjOccs.length; j++) {
            var oObjOcc = oObjOccs[j];
            replaceSymbol(oObjOcc, mapReplacements, oUnchangedObjOccs, mapObjDefOIDsToReplace);
        }
        modelCount++;
        if (modelCount % 50 == 0) {                
            ArisData.Save(Constants.SAVE_NOW);    // Store every 50 models
            g_oDB.clearCaches();
        }
    }
    ArisData.Save(Constants.SAVE_NOW);
    g_oDB.clearCaches();

    if (mapObjDefOIDsToReplace.size() > 0) {
        var iter = mapObjDefOIDsToReplace.keySet().iterator();
        var objCount = 0;
        while (iter.hasNext()) {
            var sOID = iter.next();
            var trgSymbol = mapObjDefOIDsToReplace.get(sOID);
            var oObjDef = g_oDB.FindOID(sOID);
            try {
                oObjDef.setDefaultSymbolNum(trgSymbol, false/*bPropagate*/);  
            } catch(e) {} 
            
            objCount++;
            if (objCount % 100 == 0) {                
                ArisData.Save(Constants.SAVE_NOW);    // Store every 100 objDefs
            }
        }
        ArisData.Save(Constants.SAVE_NOW);
    }
    return oUnchangedObjOccs;    
}

function getObjOccsToReplace(oModel, oSelObjDefs, aSrcSymbols) {
    var oObjOccs = oModel.ObjOccListBySymbol(aSrcSymbols);
    if (oSelObjDefs.length == 0) return oObjOccs;
    
    var oSelObjOccs = new Array();
    for (var i = 0; i < oObjOccs.length; i++) {
        for (var j = 0; j < oSelObjDefs.length; j++) {
            var oObjOcc = oObjOccs[i]
            if (oObjOcc.ObjDef().IsEqual(oSelObjDefs[j])) {
                oSelObjOccs.push(oObjOcc);
                break;
            }
        }
    }
    return oSelObjOccs;
}

function replaceSymbol(oObjOcc, mapReplacements, oUnchangedObjOccs, mapObjDefOIDsToReplace) {  
    var srcObjType = oObjOcc.ObjDef().TypeNum();
    var srcSymbol = oObjOcc.SymbolNum();
    var trgSymbol = getTargetSymbol(srcObjType, srcSymbol);

    var bChanged = false;
    if (areChangesAllowed(oObjOcc, trgSymbol)) {
        try {
            bChanged = oObjOcc.setSymbol(trgSymbol);
        } catch(e) {}                   
        if (bChanged && g_bSetDefaultSymbol) mapObjDefOIDsToReplace.put(oObjOcc.ObjDef().ObjectID(), trgSymbol);
    }
    if (!bChanged) 
        oUnchangedObjOccs.push(oObjOcc);
    
    function getTargetSymbol(srcObjType, srcSymbol) {
        var trgSymbol = mapReplacements.get(buildKey(srcObjType, srcSymbol));
        if (trgSymbol == null) {
            // BLUE-14171 Current source symbol is not contained in list because user selected 'all symbols' (= -1)
            trgSymbol = mapReplacements.get(buildKey(srcObjType, -1));     
        }
        return trgSymbol;
    }
}    

function areChangesAllowed(oObjOcc, newsymbolnum) {
    var nmodeltype = oObjOcc.Model().TypeNum();

    // Check symbol num            
    if (!g_ofilter.IsValidSymbol(nmodeltype, newsymbolnum)) return false;
    
    // Check cxns
    var nsrcsymbolnum = newsymbolnum;
    var oOutCxns = oObjOcc.OutEdges(Constants.EDGES_ALL);
    for (var i = 0 ; i < oOutCxns.length; i++) {
        var ncxntypenum = oOutCxns[i].Cxn().TypeNum();
        var ntrgsymbolnum = oOutCxns[i].TargetObjOcc().SymbolNum();
        
        if (!isValidCxnType(nmodeltype, nsrcsymbolnum, ntrgsymbolnum, ncxntypenum)) return false;
    }
    var ntrgsymbolnum = newsymbolnum;        
    var oInCxns = oObjOcc.InEdges(Constants.EDGES_ALL);
    for (var i = 0 ; i < oInCxns.length; i++) {
        var ncxntypenum = oInCxns[i].Cxn().TypeNum();
        var nsrcsymbolnum = oInCxns[i].SourceObjOcc().SymbolNum();
        
        if (!isValidCxnType(nmodeltype, nsrcsymbolnum, ntrgsymbolnum, ncxntypenum)) return false;
    }
    return true;
    
    function isValidCxnType(nmodeltype, nsrcsymbolnum, ntrgsymbolnum, ncxntypenum) {
        var validCxnTypes = g_ofilter.CxnTypes(nmodeltype, nsrcsymbolnum, ntrgsymbolnum);
        for (var i = 0; i < validCxnTypes.length; i++) {
            if (isEqualTypeNum(validCxnTypes[i], ncxntypenum)) return true;
        }
        return false;
    }    
}     

function buildKey(objType, symbolType) {
    // BLUE-14171 Key contains object type and symbol to handle selection of 'all symbols' correctly
    return objType + "#" + symbolType;
}

/*****************************************************************************************************************/
// Dialog

function getObjectTypes() {
    var objecttypelist = new Array(); 

    var oSelectedObjDefs = ArisData.getSelectedObjDefs();
    if (oSelectedObjDefs.length > 0) {
        var objectTypesSet = new java.util.HashSet();
        for (var i = 0; i < oSelectedObjDefs.length; i++) {
            objectTypesSet.add(oSelectedObjDefs[i].TypeNum());
        }
        var objtypenums = objectTypesSet.toArray();
    } else {
        var objtypenums = g_ofilter.ObjTypes();
    }    
    
    for (var i = 0; i < objtypenums.length; i++) {
        objecttypelist.push(new __usertype_tType(objtypenums[i], getTypeName(objtypenums[i])));
    }
    return objecttypelist.sort(sortByType);
    
    function getTypeName(typeNum) {
        return g_ofilter.ObjTypeName(typeNum) + " (#" + typeNum + ")";
    }
}

function getSymbolTypes(objecttypenum, bIsSource) {
    var symboltypelist = new Array(); 

    var symbolSet = new java.util.HashSet();
    var modeltypenums = g_ofilter.ModelTypes(Constants.ARISVIEW_ORG | Constants.ARISVIEW_FUNC | Constants.ARISVIEW_DATA | Constants.ARISVIEW_CTRL);
    for (var i = 0; i < modeltypenums.length; i++) {
        var aSymbols = g_ofilter.Symbols(modeltypenums[i], objecttypenum);
        for (var j = 0; j < aSymbols.length; j++) {
            symbolSet.add(aSymbols[j]);
        }
    }
    
    var symboltypenums = symbolSet.toArray();
    for (var i = 0; i < symboltypenums.length; i++) {
        if (!isAlreadySelected(objecttypenum, symboltypenums[i], bIsSource)) {
            
            symboltypelist.push(new __usertype_tType(symboltypenums[i], getTypeName(symboltypenums[i])));
        }
    }
    
    if (bIsSource) {
        var symboltypenum = -1;
        if (!isAlreadySelected(objecttypenum, symboltypenum, bIsSource)) {
            symboltypelist.push(new __usertype_tType(symboltypenum, getString("ALL_SYMBOL_TYPES")));
        }
    }    
    return symboltypelist.sort(sortByType);
    
    function isAlreadySelected(objecttypenum, symboltypenum, bIsSource) {
        if (bIsSource) {
            for (var i = 0; i < g_aSymbolMap.length; i++) {

                if (checkObjectType(objecttypenum, i) && checkSourceSymbolType(symboltypenum, i)) return true;
            }
        }
        return false;
    }

    function getTypeName(typeNum) {
        return g_ofilter.SymbolName(typeNum) + " (#" + typeNum + ")";
    }
}

function addToSymbolMap(objecttype, sourcesymboltype, targetsymboltype) {
    if (isEqualTypeNum(sourcesymboltype.ntypenum, -1)) {
        var aTempSymbolMapping = new Array();
        for (var i = 0; i < g_aSymbolMap.length; i++) {
            
            if (g_aSymbolMap[i].objecttype.ntypenum != objecttype.ntypenum) aTempSymbolMapping.push(g_aSymbolMap[i]);
        }
        g_aSymbolMap = aTempSymbolMapping;
    }
    g_aSymbolMap.push(new __usertype_tSymbolMap(objecttype, sourcesymboltype, targetsymboltype));
    g_aSymbolMap = g_aSymbolMap.sort(sortSymbolMap);
}


function removeFromSymbolMap(idxmapping) {
    var aTempSymbolMap = new Array();
    for (var i = 0; i < g_aSymbolMap.length; i++) {
        if (idxmapping != i) aTempSymbolMap.push(g_aSymbolMap[i]);
    }
    g_aSymbolMap = aTempSymbolMap;
}

function getTypeNames(types) {
    var aTypeNames = new Array();
    
    for (var i = 0; i < types.length; i++) {
        aTypeNames.push(types[i].sname);
    }
    return aTypeNames;
}

function getSymbolMapTexts() {
    var result = new Array(); 
    for (var i = 0 ; i < g_aSymbolMap.length; i++ ){
        result[i] = g_aSymbolMap[i].objecttype.sname + ": " + g_aSymbolMap[i].sourcesymboltype.sname + " --> " + g_aSymbolMap[i].targetsymboltype.sname;
    }
    return result;
}

function isEqualTypeNum(tn1, tn2) {
    tn1 = new java.lang.Integer(tn1);
    tn2 = new java.lang.Integer(tn2);
    return tn1.equals(tn2);
}

function sortByType(a, b) {
    if (isEqualTypeNum(a.ntypenum, -1)) return -1;
    if (isEqualTypeNum(b.ntypenum, -1)) return 1;    
    return StrComp(a.sname, b.sname);
}

function sortSymbolMap(a, b) {
    var result = sortByType(a.objecttype, b.objecttype);
    if (result == 0) result = sortByType(a.sourcesymboltype, b.sourcesymboltype);
    return result;
}

function checkObjectType(objecttypenum, idxmapping) {
    return isEqualTypeNum(g_aSymbolMap[idxmapping].objecttype.ntypenum, objecttypenum);
}

function checkSourceSymbolType(symboltypenum, idxmapping) {
    return (isEqualTypeNum(g_aSymbolMap[idxmapping].sourcesymboltype.ntypenum, -1) ||
            isEqualTypeNum(g_aSymbolMap[idxmapping].sourcesymboltype.ntypenum, symboltypenum));
}

function showDialog() {
    g_string = "";
    g_aSymbolMap = new Array();

    g_aObjectTypes = getObjectTypes();

    if (g_aObjectTypes.length > 0) {
        g_aSourceSymbolTypes = getSymbolTypes(g_aObjectTypes[0].ntypenum, true);
        g_aTargetSymbolTypes = getSymbolTypes(g_aObjectTypes[0].ntypenum, false);        
    }
    
    var userdialog = Dialogs.createNewDialogTemplate(790, 360, getString("DLG_TITLE"), "dlgHandler");
    userdialog.Text(20, 14, 620, 14, getString("DLG_TEXT"));
    userdialog.Text(20, 35, 250, 14, getString("OBJ_TYPE"));
    userdialog.Text(280, 35, 250, 14, getString("SRC_SYMBOL_TYPE"));
    userdialog.Text(540, 35, 250, 14, getString("TRG_SYMBOL_TYPE"));
    userdialog.ListBox(20, 50, 250, 100, getTypeNames(g_aObjectTypes), "lstSourceObjects");
    userdialog.ListBox(280, 50, 250, 100, getTypeNames(g_aSourceSymbolTypes), "lstSourceSymbols");
    userdialog.ListBox(540, 50, 250, 100, getTypeNames(g_aTargetSymbolTypes), "lstTargetSymbols");
    userdialog.PushButton(20, 160, 150, 21, getString("BUTTON_ADD"), "butAdd");
    userdialog.Text(20, 200, 620, 14, getString("DLG_TEXT_2"));
    userdialog.ListBox(20, 215, 770, 100, getSymbolMapTexts(g_aSymbolMap), "lstMappings");
    userdialog.PushButton(20, 330, 150, 21, getString("BUTTON_DELETE"), "butRemove");
    userdialog.CheckBox(20, 370, 500, 21, getString("TEXT_1"), "checkDefaultSymbol");
    
    userdialog.OKButton();
    userdialog.CancelButton();
    userdialog.HelpButton("HID_8c6e29e0_7500_11d9_768f_a722316b722b_dlg_01.hlp");
    
    var dlg = Dialogs.createUserDialog(userdialog); 
    var nuserchoice = Dialogs.show( __currentDialog = dlg);
    if (nuserchoice == 0) return false;
    
    g_bSetDefaultSymbol = (__currentDialog.getDlgValue("checkDefaultSymbol") == 1);
    return true;
}

var g_sourceSymbol = null;
var g_targetSymbol = null;

function dlgHandler(dlgitem, action, suppvalue) { 
    switch(action) {
        case 1:
            g_sourceSymbol = __currentDialog.getDlgValue("lstSourceSymbols");
            g_targetSymbol = __currentDialog.getDlgValue("lstTargetSymbols");
            
            __currentDialog.setDlgValue("lstSourceObjects", 0); // BLUE-19383 - Inititial setting of object type selection
            __currentDialog.setDlgEnable("OK", false);
            __currentDialog.setDlgEnable("butAdd", true);
            __currentDialog.setDlgEnable("butRemove", false);
            return false;
        case 2:
            switch(dlgitem) {
                case "lstSourceObjects":
                    var idxobjecttype = __currentDialog.getDlgValue("lstSourceObjects");
                    
                    var objecttype = g_aObjectTypes[idxobjecttype];
                    g_aSourceSymbolTypes = getSymbolTypes(objecttype.ntypenum, true);
                    g_aTargetSymbolTypes = getSymbolTypes(objecttype.ntypenum, false);
                
                    __currentDialog.setDlgListBoxArray("lstSourceSymbols", getTypeNames(g_aSourceSymbolTypes));
                    __currentDialog.setDlgListBoxArray("lstTargetSymbols", getTypeNames(g_aTargetSymbolTypes));

                    g_sourceSymbol = null;
                    g_targetSymbol = null;                    
                    __currentDialog.setDlgEnable("butAdd", false);            
                    break;
                
                case "lstSourceSymbols":
                    g_sourceSymbol = __currentDialog.getDlgValue("lstSourceSymbols");
                     __currentDialog.setDlgEnable("butAdd", g_sourceSymbol != null && g_targetSymbol != null ); 
                    break;
                
                case "lstTargetSymbols":
                    g_targetSymbol = __currentDialog.getDlgValue("lstTargetSymbols");
                     __currentDialog.setDlgEnable("butAdd", g_sourceSymbol != null && g_targetSymbol != null ); 
                    break;

                case "butAdd":
                    var idxobjecttype = __currentDialog.getDlgValue("lstSourceObjects");
                    var idxsourcesymboltype = __currentDialog.getDlgValue("lstSourceSymbols");
                    var idxtargetsymboltype = __currentDialog.getDlgValue("lstTargetSymbols");            
        
                    var objecttype = g_aObjectTypes[idxobjecttype];
                    var sourcesymboltype = g_aSourceSymbolTypes[idxsourcesymboltype];
                    var targetsymboltype = g_aTargetSymbolTypes[idxtargetsymboltype];
        
                    addToSymbolMap(objecttype, sourcesymboltype, targetsymboltype);
                    var mappingtexts = getSymbolMapTexts(g_aSymbolMap);
                    __currentDialog.setDlgListBoxArray("lstMappings", mappingtexts);

                    var objecttype = g_aObjectTypes[idxobjecttype];
                    g_aSourceSymbolTypes = getSymbolTypes(objecttype.ntypenum, true);
                    __currentDialog.setDlgListBoxArray("lstSourceSymbols", getTypeNames(g_aSourceSymbolTypes));
                    __currentDialog.setDlgListBoxArray("lstTargetSymbols", getTypeNames(g_aTargetSymbolTypes));

                    g_sourceSymbol = null;
                    g_targetSymbol = null;                    
                    __currentDialog.setDlgEnable("butAdd", false);            
                    __currentDialog.setDlgEnable("OK", g_aSymbolMap.length > 0);
                    break;
                    
                case "lstMappings":
                    __currentDialog.setDlgEnable("butRemove", true);
                    break;

                case "butRemove":
                    var idxmapping = __currentDialog.getDlgValue("lstMappings");
                    removeFromSymbolMap(idxmapping);
                    var mappingtexts = getSymbolMapTexts(g_aSymbolMap);
                    __currentDialog.setDlgListBoxArray("lstMappings", mappingtexts);

                    var idxobjecttype = __currentDialog.getDlgValue("lstSourceObjects");
                    var objecttype = g_aObjectTypes[idxobjecttype];
                    g_aSourceSymbolTypes = getSymbolTypes(objecttype.ntypenum, true);
                    __currentDialog.setDlgListBoxArray("lstSourceSymbols", getTypeNames(g_aSourceSymbolTypes));
                    __currentDialog.setDlgListBoxArray("lstTargetSymbols", getTypeNames(g_aTargetSymbolTypes));
                    
                    __currentDialog.setDlgEnable("butRemove", false);
                    __currentDialog.setDlgEnable("OK", g_aSymbolMap.length > 0);
                    break;

                case "OK":
                case "Cancel":
                    return false;
            }
            return true;
    }
}

function showDialog2(oUnchangedObjOccs) {
    var userdialog = Dialogs.createNewDialogTemplate(500, 200, getString("DLG_TITLE"));
    userdialog.Text(20, 10, 500, 30, getString("DLG_2_HEADLINE"));
    
    var columnArray = [getString("DLG_2_MODEL"), getString("DLG_2_OBJECTNAME")];
    var editorInfo = [Constants.TABLECOLUMN_DEFAULT, Constants.TABLECOLUMN_DEFAULT] ;
    userdialog.Table(20, 40, 500, 180, columnArray, editorInfo, [], "TABLE_CTRL", Constants.TABLE_STYLE_DEFAULT);
        
    userdialog.OKButton();
    //userdialog.HelpButton("HID_8c6e29e0_7500_11d9_768f_a722316b722b_dlg_02.hlp");  
    
    var dlg = Dialogs.createUserDialog(userdialog); 
    dlg.setDlgListBoxArray("TABLE_CTRL", getTableEntries(oUnchangedObjOccs));
    Dialogs.show(__currentDialog = dlg);
    
    function getTableEntries(oUnchangedObjOccs) {
        var aTableEntries = new Array();
        oUnchangedObjOccs = oUnchangedObjOccs.sort(sortObjOccs);
        
        for (var i = 0; i < oUnchangedObjOccs.length; i++) {
            var oObjOcc = oUnchangedObjOccs[i];
            aTableEntries.push(oObjOcc.Model().Name(g_nloc));
            aTableEntries.push(oObjOcc.ObjDef().Name(g_nloc));
        }
        return aTableEntries;
        

        function sortObjOccs(objA, objB) {
            result = StrComp(objA.Model().Name(g_nloc), objB.Model().Name(g_nloc));
            if (result == 0) result = StrComp(objA.ObjDef().Name(g_nloc), objB.ObjDef().Name(g_nloc));
            return result;
        }
    }
}
