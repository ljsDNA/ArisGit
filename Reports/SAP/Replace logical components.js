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
 
function TYPE_MAP(sLogComp2Replace, sLogCompAvailable) {
    this.sLogComp2Replace = sLogComp2Replace;
    this.sLogCompAvailable = sLogCompAvailable;
}

var g_sLogComponents2Replace = new Array();
var g_sLogComponentsAvailable = new Array();
var g_aMapping = new Array();
var g_sMapping = new Array();

var g_nLoc = Context.getSelectedLanguage();

main();

/********************************************************/

function main() {
    var rootNodes   = getRootNodes();
    if (rootNodes.length != 1) return;
    
    var sLogComponentsAvailable = getLogicalComponents(rootNodes[0]);
    if (sLogComponentsAvailable.length == 0) return;

    var objects2Replace = new Array();
    var setLogComponents2Replace = new java.util.HashSet()
    
    Context.writeStatus(getString("STATUS_DETERMINING"))
    var relevantObjects = getRelevantObjects();
    for (var i = 0; i < relevantObjects.length; i++) {
        var oObjDef = relevantObjects[i];
        var sLogComp = "" + oObjDef.Attribute(Constants.AT_SOLAR_SAP_COMPONENT, g_nLoc).getValue();
        
        if (!isAvailable(sLogComp, sLogComponentsAvailable)) {
            objects2Replace.push(oObjDef);
            setLogComponents2Replace.add(new java.lang.String(sLogComp));
        }
    }
    relevantObjects = null;
    
    if (objects2Replace.length == 0) {
        outMessage(getString("MSG_ALL_MATCHING"), Constants.MSGBOX_ICON_INFORMATION);
        return;
    }

    var mapLogComponents2Replace = mappingDialog(setLogComponents2Replace, sLogComponentsAvailable);
    if (mapLogComponents2Replace != null) {

        Context.writeStatus(getString("STATUS_ADJUSTING"))
        replaceLogicalComponents(objects2Replace, mapLogComponents2Replace);
    }
}

function replaceLogicalComponents(objects2Replace, mapLogComponents2Replace) {
    objects2Replace = ArisData.sort(objects2Replace, Constants.SORT_TYPE, Constants.AT_NAME, g_nLoc);
    
    var oOut = Context.createOutputObject();
    setReportHeaderFooter(oOut, g_nLoc, false, false, false);
    oOut.DefineF("HEAD", getString("FONT"), 10, Constants.C_BLACK, Constants.C_GREY_80_PERCENT, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_EXCELMODIFY, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("STD", getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_EXCELMODIFY, 0, 21, 0, 0, 0, 1);
    
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    oOut.TableRow();
    oOut.TableCellF(getString("OBJECT_NAME"), 25, "HEAD");
    oOut.TableCellF(getString("OBJECT_TYPE"), 25, "HEAD");
    oOut.TableCellF(getString("VALUE_OLD"), 25, "HEAD");
    oOut.TableCellF(getString("VALUE_NEW"), 25, "HEAD");
    
    for (var i = 0; i < objects2Replace.length; i++) {
        var oObjDef = objects2Replace[i];      
        var oAttr = oObjDef.Attribute(Constants.AT_SOLAR_SAP_COMPONENT, g_nLoc);

        var oldValue = new java.lang.String(oAttr.getValue());
        var newValue = mapLogComponents2Replace.get(oldValue);
        if (newValue != null) {
            // Replacement
            if (oAttr.setValue(newValue)) {
                oOut.TableRow();
                oOut.TableCellF(oObjDef.Name(g_nLoc), 25, "STD");
                var sObjType = oObjDef.TypeNum() == Constants.OT_SCRN ? getString("TRANSACTION") : oObjDef.Type();
                oOut.TableCellF(sObjType, 25, "STD");
                oOut.TableCellF(oldValue, 25, "STD");
                oOut.TableCellF(newValue, 25, "STD");
            }
        }
    }
    oOut.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
    oOut.WriteReport();
}

function isAvailable(sLogComp, sLogComponentsAvailable) {
    return sLogComponentsAvailable.indexOf(sLogComp) >= 0;
}

function getLogicalComponents(rootNode) {
    var sLogComponents = new Array();
    var fadModels = rootNode.AssignedModels(getModelTypesIncludingUserDefined(Constants.MT_FUNC_ALLOC_DGM));
    if (fadModels.length > 0) {
        var oComponents = fadModels[0].ObjDefListFilter(Constants.OT_APPL_SYS_TYPE);
        for (var i = 0; i < oComponents.length; i++) {
            var sLogComp = getLogicalComponent(oComponents[i]);
            if (sLogComp.length > 0) {
                sLogComponents.push(sLogComp);
            }
        }
    }
    if (sLogComponents.length == 0) outMessage(formatstring1(getString("MSG_NO_LOGICAL_COMPONENTS"), rootNode.Name(g_nLoc)), Constants.MSGBOX_ICON_ERROR);    
    return sLogComponents;
    
    function getLogicalComponent(component) {
        var attrAreaID = component.Attribute(Constants.AT_SOLAR_AREA_ID, g_nLoc);
        if (attrAreaID.IsMaintained()) {
            var sAreaID = "" + attrAreaID.getValue();
            var idx = sAreaID.indexOf(":");
            if (idx > 0) return sAreaID.substring(0, idx);
        }
        return "";
    }
}

function outMessage(sMsgText, nIcon) {
    if (nIcon == Constants.MSGBOX_ICON_ERROR) sMsgText += "\n" + getString("MSG_REPORT_ABORT");
    Dialogs.MsgBox(sMsgText, Constants.MSGBOX_BTN_OK | nIcon, Context.getScriptInfo(Constants.SCRIPT_TITLE));
}

function getRootNodes() {
    var sProject = ArisData.ActiveFilter().AttrValueType(Constants.AT_SAP_FUNC_TYPE, Constants.AVT_SOLAR_PROJECT) // = 'Project'
    var searchSettings = ArisData.getActiveDatabase().createSearchItem(Constants.AT_SAP_FUNC_TYPE, g_nLoc, sProject, Constants.SEARCH_CMP_EQUAL, true/*bCaseSensitive*/, false/*bAllowWildcards*/);
    var objTypeNums = [Constants.OT_FUNC];
    
    var rootNodes = new Array();
    var oGroups = ArisData.getSelectedGroups();
    if (oGroups.length > 0) {
        for (var i = 0; i < oGroups.length; i++) {
            rootNodes = rootNodes.concat(oGroups[i].ObjDefList(true/*bRecursive*/, objTypeNums, searchSettings));
        }
    } else {
        rootNodes = ArisData.getActiveDatabase().Find(Constants.SEARCH_OBJDEF, objTypeNums, searchSettings);
    }
    if (rootNodes.length == 0) outMessage(getString("MSG_NO_ROOT_NODES"), Constants.MSGBOX_ICON_ERROR);
    if (rootNodes.length > 1)  outMessage(getString("MSG_MULTIPLE_ROOT_NODES"), Constants.MSGBOX_ICON_ERROR);

    return rootNodes;
}

function getRelevantObjects() {
    var searchSettings = ArisData.getActiveDatabase().createSearchItem(Constants.AT_SOLAR_SAP_COMPONENT, g_nLoc, true/*bExistence*/);
    var objTypeNums = [Constants.OT_SCRN, Constants.OT_FUNC];
    
    var relevantObjects = new Array();
    var oGroups = ArisData.getSelectedGroups();
    if (oGroups.length > 0) {
        for (var i = 0; i < oGroups.length; i++) {
            relevantObjects = relevantObjects.concat(oGroups[i].ObjDefList(true/*bRecursive*/, objTypeNums, searchSettings));
        }
    } else {
        relevantObjects = ArisData.getActiveDatabase().Find(Constants.SEARCH_OBJDEF, objTypeNums, searchSettings);
    }
    return relevantObjects;
}

function mappingDialog(setLogComponents2Replace, sLogComponentsAvailable) {
    var it = setLogComponents2Replace.iterator();
    while (it.hasNext()) {
        g_sLogComponents2Replace.push(it.next())
    }
    g_sLogComponents2Replace.sort();
    g_sLogComponentsAvailable = sLogComponentsAvailable.sort();
    
    var dlgTemplate = Dialogs.createNewDialogTemplate(660, 380, Context.getScriptInfo(Constants.SCRIPT_TITLE), "mappingDialogFunc");
    // %GRID:10,7,1,1
    dlgTemplate.Text(20, 10, 620, 15, getString("DLG_SELECT_COMPONENTS"));    
    dlgTemplate.Text(20, 30, 310, 15, getString("DLG_COMPONENTS_NOT_FOUND"));
    dlgTemplate.ListBox(20, 45, 310, 120, g_sLogComponents2Replace, "LIST_2REPLACE");
    dlgTemplate.Text(340, 30, 300, 15, getString("DLG_COMPONENTS_AVAILABLE"));
    dlgTemplate.ListBox(340, 45, 300, 120, g_sLogComponentsAvailable, "LIST_AVAILABLE");
    dlgTemplate.PushButton(20, 170, 150, 21, getString("DLG_BUTTON_ADD"), "BUTTON_ADD");
    dlgTemplate.Text(20, 210, 620, 15, getString("DLG_SELECTED_COMPONENTS"));
    dlgTemplate.ListBox(20, 225, 620, 120, g_sMapping, "LIST_MAPPING");
    dlgTemplate.PushButton(20, 350, 150, 21, getString("DLG_BUTTON_DELETE"), "BUTTON_DELETE");
    dlgTemplate.OKButton();
    dlgTemplate.CancelButton();
    //  dlgTemplate.HelpButton("HID_3d2d43f0_8906_11df_2501_973a59920f78_dlg_01.hlp");

    var dlg = Dialogs.createUserDialog(dlgTemplate); 
    if (Dialogs.show( __currentDialog = dlg) == 0) return null;
    

    var mapLogComponents2Replace = new java.util.HashMap();
    for (var i = 0; i < g_aMapping.length; i++) {
        mapLogComponents2Replace.put(new java.lang.String(g_aMapping[i].sLogComp2Replace), g_aMapping[i].sLogCompAvailable);
    }
    return mapLogComponents2Replace;
}

function mappingDialogFunc(dlgitem, action, suppvalue) {
    var result = false;
    
    var idx2Replace = 0;   
    var idxAvailable = 0;
    var idxMapping = 0;
    
    switch(action) {
        case 1:
            result = false;
            __currentDialog.setDlgEnable("BUTTON_ADD", true);
            __currentDialog.setDlgEnable("BUTTON_DELETE", false);
            __currentDialog.setDlgEnable("OK", false);
            break;
        case 2:
            result = true;
            switch(dlgitem) {
                case "LIST_2REPLACE":
                case "LIST_AVAILABLE":
                    idx2Replace = __currentDialog.getDlgValue("LIST_2REPLACE");
                    idxAvailable = __currentDialog.getDlgValue("LIST_AVAILABLE");
                    __currentDialog.setDlgEnable("BUTTON_ADD", idx2Replace != - 1 && idxAvailable != - 1);
                    break;
                    
                case "BUTTON_ADD":
                    idx2Replace = __currentDialog.getDlgValue("LIST_2REPLACE");
                    idxAvailable = __currentDialog.getDlgValue("LIST_AVAILABLE");

                    if (idx2Replace != - 1 && idxAvailable != - 1) {
                        addMapping(idx2Replace, idxAvailable);
                        __currentDialog.setDlgListBoxArray("LIST_2REPLACE", g_sLogComponents2Replace);
                        __currentDialog.setDlgListBoxArray("LIST_MAPPING", g_sMapping);
                        __currentDialog.setDlgEnable("BUTTON_ADD", false);
                        __currentDialog.setDlgEnable("OK", g_aMapping.length > 0);
                    }
                    break;
                    
                case "BUTTON_DELETE":
                    idxMapping = __currentDialog.getDlgValue("LIST_MAPPING");
                    if (idxMapping != - 1) {
                        deleteMapping(idxMapping);
                        __currentDialog.setDlgListBoxArray("LIST_2REPLACE", g_sLogComponents2Replace);
                        __currentDialog.setDlgListBoxArray("LIST_MAPPING", g_sMapping);
                        __currentDialog.setDlgEnable("BUTTON_DELETE", false);
                        __currentDialog.setDlgEnable("OK", (g_aMapping.length > 0));
                    }
                    break;
                    
                case "LIST_MAPPING":
                    idxMapping = __currentDialog.getDlgValue("LIST_MAPPING");
                    __currentDialog.setDlgEnable("BUTTON_DELETE", idxMapping != - 1);
                    break;
                case "OK":
                case "Cancel":
                    result = false;
            }
    }
    return result;
}

function addMapping(idx2Replace, idxAvailable) {
    var sLogComp2Replace = g_sLogComponents2Replace[idx2Replace];
    var sLogCompAvailable = g_sLogComponentsAvailable[idxAvailable];
    
    g_aMapping.push(new TYPE_MAP(sLogComp2Replace, sLogCompAvailable));
    g_aMapping.sort(sortMapping);
    updateMappingList();
        
    g_sLogComponents2Replace.splice(idx2Replace, 1);
}

function deleteMapping(idxMapping) {
    var sLogComp2Replace = g_aMapping[idxMapping].sLogComp2Replace;
    g_sLogComponents2Replace.push(sLogComp2Replace);
    g_sLogComponents2Replace.sort();

    g_aMapping.splice(idxMapping, 1);
    updateMappingList();
}

function updateMappingList() {
    g_sMapping = new Array();
    for (var i = 0; i < g_aMapping.length; i++) {
        g_sMapping.push(g_aMapping[i].sLogComp2Replace + "   -->   " + g_aMapping[i].sLogCompAvailable);
    }
}

function sortMapping(a, b) {
    return StrComp(a.sLogComp2Replace, b.sLogComp2Replace);
}
