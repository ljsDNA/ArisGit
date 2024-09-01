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


DATA_TYPE = function(p_aColHeaderDefs, p_aRowHeaderDefs, p_aUserGroups, p_accessRight) {
    this.aColHeaderDefs = p_aColHeaderDefs;
    this.aRowHeaderDefs = p_aRowHeaderDefs;
    this.aUserGroups = p_aUserGroups;
    this.accessRight = p_accessRight;
}

var oDB = ArisData.getActiveDatabase();
var oFilter = oDB.ActiveFilter(); 

var myCOLHEAD_OBJ_TYPES = getHeaderTypes(oFilter, true/*bIsColHeader*/);
var myROWHEAD_OBJ_TYPES = getHeaderTypes(oFilter, false/*bIsColHeader*/);

var g_oPsmConfig = new psmConfig(false/*p_bMacro*/);
var oPsuGroup = g_oPsmConfig.getPsuGroup();

main(oPsuGroup);

/******************************************************************************************************/

function main(oPsuGroup) {
    // Check function rights of active user
    if (!checkFunctionRight(ArisData.getActiveUser().FunctionRights(), Constants.AT_USR_ADMIN)) {
        outErrorMessage(formatstring1(getString("MSG_MISSING_RIGHTS"), ArisData.ActiveFilter().AttrTypeName(Constants.AT_USR_ADMIN)));
        return;
    }
  
    var initData = getInitData(oPsuGroup);
    // Check selected data
    if (!checkData(initData)) return; 
    
    var result = Dialogs.showDialog(new accessDialog(initData), Constants.DIALOG_TYPE_WIZARD, getString("DIALOG_HEADLINE"));
    if (result != null) {
        setAccessPrivileges(result);
    }
}

function setAccessPrivileges(result) {
    var aColHeaderDefs = result.aColHeaderDefs;
    var aRowHeaderDefs = result.aRowHeaderDefs;
    var aUserGroups = result.aUserGroups;
    var accessRight = result.accessRight;

    var aUnitDefs = getUnitDefs(aColHeaderDefs, aRowHeaderDefs);
    var aUnitGroups = getUnitGroups(aUnitDefs);

    for (var i = 0; i < aUserGroups.length; i++) {
        aUserGroups[i].SetAccessRights(aUnitGroups, accessRight);
    }
    
    function getUnitGroups(aUnitDefs) {
        var aUnitGroups = new Array();
        for (var j = 0; j < aUnitDefs.length; j++) {
            aUnitGroups.push(aUnitDefs[j].Group());
        }
        return aUnitGroups;
    }
    
    function getUnitDefs(aColHeaderDefs, aRowHeaderDefs) {
        var aUnitDefs = new Array();
        var aUnitDefsOfColHeader = getUnitDefsOfHeader(aColHeaderDefs, true/*bIsColHeader*/);
        var aUnitDefsOfRowHeader = getUnitDefsOfHeader(aRowHeaderDefs, false/*bIsColHeader*/);        
        for (var j = 0; j < aUnitDefsOfColHeader.length; j++) {
            var aUnitDef = aUnitDefsOfColHeader[j];
            if (aUnitDefsOfRowHeader.some(function(element){return element.equals(aUnitDef)})) {
                aUnitDefs.push(aUnitDef);
            }
        }
        return ArisData.Unique(aUnitDefs).sort(SortByNameReport);
    }
}

function getUnitDefsOfHeader(aHeaderDefs, bIsColHeader) {
    var aHeaderUnitDefs = new Array();
    for (var k = 0; k < aHeaderDefs.length; k++) {
        aHeaderUnitDefs = aHeaderUnitDefs.concat(aHeaderDefs[k].getConnectedObjs(UNIT_OBJ_TYPES, Constants.EDGES_INOUT, (bIsColHeader ? COLHEAD_CXN_TYPES : ROWHEAD_CXN_TYPES)))
    }
    return ArisData.Unique(aHeaderUnitDefs);
}


function getInitData(oPsuGroup) {
    var aColHeaderDefs = new Array();
    var aRowHeaderDefs = new Array();
    var aUserGroups = getRelevantUserGroups(oPsuGroup);
    
    var selectedModels = ArisData.getSelectedModels();
    if (selectedModels.length > 0) {
        for (var i = 0; i < selectedModels.length; i++) {
            var oModel = selectedModels[i];
            aColHeaderDefs = aColHeaderDefs.concat(getRelevantHeaders(oModel.ObjDefListByTypes(myCOLHEAD_OBJ_TYPES), true/*bIsColHeader*/));
            aRowHeaderDefs = aRowHeaderDefs.concat(getRelevantHeaders(oModel.ObjDefListByTypes(myROWHEAD_OBJ_TYPES), false/*bIsColHeader*/));
        }
    } else {
        var selectedObjDefs = ArisData.getSelectedObjDefs();
        for (var i = 0; i < selectedObjDefs.length; i++) {
            var oObjDef = selectedObjDefs[i];
            if (isUnitObj(oObjDef.TypeNum())) {
                aColHeaderDefs = aColHeaderDefs.concat(oObjDef.getConnectedObjs(myCOLHEAD_OBJ_TYPES, Constants.EDGES_INOUT, COLHEAD_CXN_TYPES));
                aRowHeaderDefs = aRowHeaderDefs.concat(oObjDef.getConnectedObjs(myROWHEAD_OBJ_TYPES, Constants.EDGES_INOUT, ROWHEAD_CXN_TYPES));
                continue;
            }
            if (isColHeaderObj(oObjDef.TypeNum())) {
                aColHeaderDefs = aColHeaderDefs.concat(getRelevantHeaders([oObjDef], true/*bIsColHeader*/));
                continue;
            }
            if (isRowHeaderObj(oObjDef.TypeNum())) {
                aRowHeaderDefs = aRowHeaderDefs.concat(getRelevantHeaders([oObjDef], false/*bIsColHeader*/));
                continue;
            }
        }
    }
    if (aColHeaderDefs.length == 0) {
        aColHeaderDefs = reloadColHeaders(aRowHeaderDefs);
    } else if (aRowHeaderDefs.length == 0) {
        aRowHeaderDefs = reloadRowHeaders(aColHeaderDefs);
    }
    
    aColHeaderDefs = ArisData.Unique(aColHeaderDefs).sort(SortByNameReport);
    aRowHeaderDefs = ArisData.Unique(aRowHeaderDefs).sort(SortByNameReport);
    
    return new DATA_TYPE(aColHeaderDefs, aRowHeaderDefs, aUserGroups, -1/*accessRight - not evaluated here*/);

    function reloadColHeaders(aRowHeaderDefs) {
        var aColHeaderDefs = new Array();
        var aUnitDefsOfRowHeader = getUnitDefsOfHeader(aRowHeaderDefs, false/*bIsColHeader*/);        
        for (var i = 0; i < aUnitDefsOfRowHeader.length; i++) {
            var oUnitDef = aUnitDefsOfRowHeader[i];
            aColHeaderDefs = aColHeaderDefs.concat(oUnitDef.getConnectedObjs(myCOLHEAD_OBJ_TYPES, Constants.EDGES_INOUT, COLHEAD_CXN_TYPES));
        }
        return filterReloadedHeaders(aColHeaderDefs, aRowHeaderDefs);
    }
        
    function reloadRowHeaders(aColHeaderDefs) {
        var aRowHeaderDefs = new Array();
        var aUnitDefsOfColHeader = getUnitDefsOfHeader(aColHeaderDefs, true/*bIsColHeader*/);
        for (var i = 0; i < aUnitDefsOfColHeader.length; i++) {
            var oUnitDef = aUnitDefsOfColHeader[i];
            aRowHeaderDefs = aRowHeaderDefs.concat(oUnitDef.getConnectedObjs(myROWHEAD_OBJ_TYPES, Constants.EDGES_INOUT, ROWHEAD_CXN_TYPES));
        }
        return filterReloadedHeaders(aRowHeaderDefs, aColHeaderDefs);
    }
    
    function filterReloadedHeaders(aReloadedHeaderDefs, aSelectedHeaderDefs) {
        var selectedObjOccs = ArisData.getSelectedObjOccs();
        if (selectedObjOccs.length == 0) return aReloadedHeaderDefs; // No filtering required

        // Filtering:
        // In case of selected obj occs this function filters the reloaded header objects
        // with occurences in the same model(s).
        var aFilteredHeaderDefs = new Array();
        for (var i = 0; i < selectedObjOccs.length; i++) {
            var selectedObjOcc = selectedObjOccs[i];
            var selectedObjDef = selectedObjOcc.ObjDef();
            
            for (var j = 0; j < aSelectedHeaderDefs.length; j++) {
                if (selectedObjDef.IsEqual(aSelectedHeaderDefs[j])) {
                    var oModel = selectedObjOcc.Model();
                    
                    for (var k = 0; k < aReloadedHeaderDefs.length; k++) {
                        var oHeaderDef = aReloadedHeaderDefs[k];
                        if (oHeaderDef.OccListInModel(oModel).length > 0) {
                            aFilteredHeaderDefs.push(oHeaderDef);
                        }                        
                    }
                    break;
                }
            }
        }
        return aFilteredHeaderDefs;
    }

    function getRelevantHeaders(aHeaderDefs, bIsColHeader) {
        // Relevant header objects have to be connected to a unit
        var aRelevantHeaderDefs = new Array();
        for (var i = 0; i < aHeaderDefs.length; i++) {
            var oHeaderDef = aHeaderDefs[i];
            if (oHeaderDef.getConnectedObjs(UNIT_OBJ_TYPES, Constants.EDGES_INOUT, (bIsColHeader ? COLHEAD_CXN_TYPES : ROWHEAD_CXN_TYPES)).length > 0) {
                aRelevantHeaderDefs.push(oHeaderDef);
            }
        }
        return aRelevantHeaderDefs;
    }
    
    function getRelevantUserGroups(oPsuGroup) {
        var aRelevantUserGroups = new Array();

        var aUserGroups = oDB.UserGroupList();
        for (var i = 0; i < aUserGroups.length; i++) {
            var oUserGroup = aUserGroups[i];
            if (oUserGroup.AccessRights(oPsuGroup) < Constants.AR_WRITE) {
                aRelevantUserGroups.push(oUserGroup);
            }
        }
        return aRelevantUserGroups.sort(SortByNameReport);
    }
}
               
function accessDialog(initData) {
    var aColHeaderDefs = copyArray(initData.aColHeaderDefs);
    var aRowHeaderDefs = copyArray(initData.aRowHeaderDefs);   
    var aUserGroups = new Array();
    var accessRight = Constants.AR_WRITE;
    
    var dY = 15;
    var yMax = 400;
    var result = 0
    this.getPages = function() {   
        // Page #1
        var accessDialog1 = Dialogs.createNewDialogTemplate(0, 0,  500, yMax, getString("COLHEADER_HEADLINE"));
        var yPos = 5; 
        var yHeight = (myCOLHEAD_OBJ_TYPES.length+1) * dY + 5;
        accessDialog1.GroupBox(10, yPos, 480, yHeight, getString("COLHEADER_TYPE"));
        
        for (var i = 0; i < myCOLHEAD_OBJ_TYPES.length; i++) {
            yPos += dY;
            accessDialog1.CheckBox(20, yPos, 300, 15, oFilter.ObjTypeName(myCOLHEAD_OBJ_TYPES[i]), "PAGE_1_CHECK_"+parseInt(myCOLHEAD_OBJ_TYPES[i]), 0);
            
        }
        yPos += dY + 10;
        yHeight = yMax - yHeight;
        accessDialog1.GroupBox(10, yPos, 480, yHeight, getString("COLHEADER_SELECTION"));    
        yPos += dY;
        yHeight = yHeight - dY - (21 + dY/*Button*/);
        accessDialog1.ListBox(20, yPos, 460, yHeight, getItemNames(aColHeaderDefs), "PAGE_1_LISTBOX", 1);
        yPos += yHeight + 5;
        accessDialog1.PushButton(110, yPos, 180, 21, getString("BUTTON_REMOVE"), "PAGE_1_BUTTON_REMOVE");
        accessDialog1.PushButton(300, yPos, 180, 21, getString("BUTTON_RESET"), "PAGE_1_BUTTON_RESET");                       
        
        // Page #2        
        var accessDialog2 = Dialogs.createNewDialogTemplate(0, 0,  500, yMax, getString("ROWHEADER_HEADLINE"));
        var yPos = 5; 
        var yHeight = (myROWHEAD_OBJ_TYPES.length+1) * dY + 5;
        accessDialog2.GroupBox(10, yPos, 480, yHeight, getString("ROWHEADER_TYPE"));
        
        for (var i = 0; i < myROWHEAD_OBJ_TYPES.length; i++) {
            yPos += dY;
            accessDialog2.CheckBox(20, yPos, 300, 15, oFilter.ObjTypeName(myROWHEAD_OBJ_TYPES[i]), "PAGE_2_CHECK_"+parseInt(myROWHEAD_OBJ_TYPES[i]), 0); 
        }
        yPos += dY + 10;
        yHeight = yMax - yHeight;
        accessDialog2.GroupBox(10, yPos, 480, yHeight, getString("ROWHEADER_SELECTION"));    
        yPos += dY;
        yHeight = yHeight - dY - (21 + dY/*Button*/);
        accessDialog2.ListBox(20, yPos, 460, yHeight, getItemNames(aRowHeaderDefs), "PAGE_2_LISTBOX", 1);
        yPos += yHeight + 5;
        accessDialog2.PushButton(110, yPos, 180, 21, getString("BUTTON_REMOVE"), "PAGE_2_BUTTON_REMOVE");                       
        accessDialog2.PushButton(300, yPos, 180, 21, getString("BUTTON_RESET"), "PAGE_2_BUTTON_RESET");                       
        
        // Page #3        
        var accessDialog3 = Dialogs.createNewDialogTemplate(0, 0,  500, yMax, getString("USERGRP_HEADLINE"));            
        accessDialog3.GroupBox(10, 5, 480, 65, getString("SET_REMOVE"));
        accessDialog3.OptionGroup("PAGE_3_OPTIONS");  
        accessDialog3.OptionButton (20, 20, 300, 15, getString("OPTION_WRITE"));
        accessDialog3.OptionButton (20, 35, 300, 15, getString("OPTION_READ"));
        accessDialog3.OptionButton (20, 50, 300, 15, getString("OPTION_NORIGHTS"));
        accessDialog3.GroupBox(10, 75, 480, 325, getString("USERGRP_SELECTION")); 
        var columnArray = ["", getString("NAME")];
        var editorInfo = [Constants.TABLECOLUMN_BOOL_EDIT, Constants.TABLECOLUMN_DEFAULT] ;
        accessDialog3.Table(20, 90, 460, 300, columnArray, editorInfo, [], "PAGE_3_TABLE",Constants.TABLE_STYLE_MULTISELECT);
        
        return [accessDialog1, accessDialog2, accessDialog3];
    }
    //initialize dialog pages (are already created and pre-initialized with static data from XML or template)
    //parameter: Array of DialogPage
    //see Help: DialogPage
    //user can set control values
    //optional
    this.init = function(aPages) {
        for (var i = 0; i < myCOLHEAD_OBJ_TYPES.length; i++) {
            aPages[0].getDialogElement("PAGE_1_CHECK_"+parseInt(myCOLHEAD_OBJ_TYPES[i])).setChecked(true);
        }
        
        for (var i = 0; i < myROWHEAD_OBJ_TYPES.length; i++) {
            aPages[1].getDialogElement("PAGE_2_CHECK_"+parseInt(myROWHEAD_OBJ_TYPES[i])).setChecked(true);
        }

        aPages[2].getDialogElement("PAGE_3_OPTIONS").setSelection(0);   // accessRight = AR_WRITE
        
        var tableEntries = new Array()
        var aUserGroupNames = getUserGroupNames(initData.aUserGroups);
        for (var i = 0; i < aUserGroupNames.length; i++) {
            tableEntries.push(["", aUserGroupNames[i]]);
        }
        aPages[2].getDialogElement("PAGE_3_TABLE").setItems(tableEntries);
        
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
        return (pageNumber == 2);
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
        if (bOk) {
            aUserGroups = new Array();
            // Read selected user groups
            var tableEntries = this.dialog.getPage(2).getDialogElement("PAGE_3_TABLE").getItems();
            for (var i = 0; i < tableEntries.length; i++) {
                if (tableEntries[i][0] == "1") {
                    aUserGroups.push(initData.aUserGroups[i]);
                }
            }
        } else {
            aColHeaderDefs = null;
            aRowHeaderDefs = null;   
            aUserGroups = null;
        }
    }
    //the result of this function is returned as result of Dialogs.showDialog(). Can be any object.
    //optional    
    this.getResult = function() {
        if (aColHeaderDefs == null && aRowHeaderDefs == null && aUserGroups == null) return null;
        return new DATA_TYPE(aColHeaderDefs, aRowHeaderDefs, aUserGroups, accessRight);

    }

    //other methods (all optional): on[ControlID]_pressed, _focusChanged(boolean lost=false, gained=true), _changed for edit and toggle buttons, _selChanged(int[] newSelection)
    this.PAGE_1_CHECK_22_selChanged = function() {
        var typeNum = Constants.OT_FUNC;
        var bisChecked = this.dialog.getPage(0).getDialogElement("PAGE_1_CHECK_22").isChecked();
        aColHeaderDefs = updateEntriesByType(aColHeaderDefs, initData.aColHeaderDefs, typeNum, bisChecked);
        this.dialog.getPage(0).getDialogElement("PAGE_1_LISTBOX").setItems(getItemNames(aColHeaderDefs));
    }
    this.PAGE_1_CHECK_293_selChanged = function() {
        var typeNum = Constants.OT_IS_FUNC;
        var bisChecked = this.dialog.getPage(0).getDialogElement("PAGE_1_CHECK_293").isChecked();
        aColHeaderDefs = updateEntriesByType(aColHeaderDefs, initData.aColHeaderDefs, typeNum, bisChecked);
        this.dialog.getPage(0).getDialogElement("PAGE_1_LISTBOX").setItems(getItemNames(aColHeaderDefs));
    }
    this.PAGE_1_CHECK_294_selChanged = function() {
        var typeNum = Constants.OT_FUNC_CLUSTER;
        var bisChecked = this.dialog.getPage(0).getDialogElement("PAGE_1_CHECK_294").isChecked();
        aColHeaderDefs = updateEntriesByType(aColHeaderDefs, initData.aColHeaderDefs, typeNum, bisChecked);
        this.dialog.getPage(0).getDialogElement("PAGE_1_LISTBOX").setItems(getItemNames(aColHeaderDefs));
    }
    this.PAGE_2_CHECK_128_selChanged = function() {
        var typeNum = Constants.OT_GRP;
        var bisChecked = this.dialog.getPage(1).getDialogElement("PAGE_2_CHECK_128").isChecked();
        aRowHeaderDefs = updateEntriesByType(aRowHeaderDefs, initData.aRowHeaderDefs, typeNum, bisChecked);
        this.dialog.getPage(1).getDialogElement("PAGE_2_LISTBOX").setItems(getItemNames(aRowHeaderDefs));
    }
    this.PAGE_2_CHECK_43_selChanged = function() {
        var typeNum = Constants.OT_ORG_UNIT;
        var bisChecked = this.dialog.getPage(1).getDialogElement("PAGE_2_CHECK_43").isChecked();
        aRowHeaderDefs = updateEntriesByType(aRowHeaderDefs, initData.aRowHeaderDefs, typeNum, bisChecked);
        this.dialog.getPage(1).getDialogElement("PAGE_2_LISTBOX").setItems(getItemNames(aRowHeaderDefs));
    }
    this.PAGE_2_CHECK_44_selChanged = function() {
        var typeNum = Constants.OT_ORG_UNIT_TYPE;
        var bisChecked = this.dialog.getPage(1).getDialogElement("PAGE_2_CHECK_44").isChecked();
        aRowHeaderDefs = updateEntriesByType(aRowHeaderDefs, initData.aRowHeaderDefs, typeNum, bisChecked);
        this.dialog.getPage(1).getDialogElement("PAGE_2_LISTBOX").setItems(getItemNames(aRowHeaderDefs));
    }
    this.PAGE_2_CHECK_46_selChanged = function() {
        var typeNum = Constants.OT_PERS;
        var bisChecked = this.dialog.getPage(1).getDialogElement("PAGE_2_CHECK_46").isChecked();
        aRowHeaderDefs = updateEntriesByType(aRowHeaderDefs, initData.aRowHeaderDefs, typeNum, bisChecked);
        this.dialog.getPage(1).getDialogElement("PAGE_2_LISTBOX").setItems(getItemNames(aRowHeaderDefs));
    }
    this.PAGE_2_CHECK_78_selChanged = function() {
        var typeNum = Constants.OT_PERS_TYPE;
        var bisChecked = this.dialog.getPage(1).getDialogElement("PAGE_2_CHECK_78").isChecked();
        aRowHeaderDefs = updateEntriesByType(aRowHeaderDefs, initData.aRowHeaderDefs, typeNum, bisChecked);
        this.dialog.getPage(1).getDialogElement("PAGE_2_LISTBOX").setItems(getItemNames(aRowHeaderDefs));
    }
    this.PAGE_2_CHECK_45_selChanged = function() {
        var typeNum = Constants.OT_POS;
        var bisChecked = this.dialog.getPage(1).getDialogElement("PAGE_2_CHECK_45").isChecked();
        aRowHeaderDefs = updateEntriesByType(aRowHeaderDefs, initData.aRowHeaderDefs, typeNum, bisChecked);
        this.dialog.getPage(1).getDialogElement("PAGE_2_LISTBOX").setItems(getItemNames(aRowHeaderDefs));
    }
    this.PAGE_2_CHECK_54_selChanged = function() {
        var typeNum = Constants.OT_LOC;
        var bisChecked = this.dialog.getPage(1).getDialogElement("PAGE_2_CHECK_54").isChecked();
        aRowHeaderDefs = updateEntriesByType(aRowHeaderDefs, initData.aRowHeaderDefs, typeNum, bisChecked);
        this.dialog.getPage(1).getDialogElement("PAGE_2_LISTBOX").setItems(getItemNames(aRowHeaderDefs));
    }
    this.PAGE_2_CHECK_153_selChanged = function() {
        var typeNum = Constants.OT_PERF;
        var bisChecked = this.dialog.getPage(1).getDialogElement("PAGE_2_CHECK_153").isChecked();
        aRowHeaderDefs = updateEntriesByType(aRowHeaderDefs, initData.aRowHeaderDefs, typeNum, bisChecked);
        this.dialog.getPage(1).getDialogElement("PAGE_2_LISTBOX").setItems(getItemNames(aRowHeaderDefs));
    }
    
    this.PAGE_1_BUTTON_REMOVE_pressed = function() {
        // Remove entries from list of ROW headers
        var listBox = this.dialog.getPage(0).getDialogElement("PAGE_1_LISTBOX");
        aColHeaderDefs = removeSelectedEntries(aColHeaderDefs, listBox.getSelection());
        listBox.setItems(getItemNames(aColHeaderDefs));
    }
    this.PAGE_2_BUTTON_REMOVE_pressed = function() {
        // Remove entries from list of COLUMN headers
        var listBox = this.dialog.getPage(1).getDialogElement("PAGE_2_LISTBOX");
        aRowHeaderDefs = removeSelectedEntries(aRowHeaderDefs, listBox.getSelection());
        listBox.setItems(getItemNames(aRowHeaderDefs));
    }
    this.PAGE_1_BUTTON_RESET_pressed = function() {
        // Reset list of ROW headers
        var listBox = this.dialog.getPage(0).getDialogElement("PAGE_1_LISTBOX");
        aColHeaderDefs = copyArray(initData.aColHeaderDefs);
        listBox.setItems(getItemNames(aColHeaderDefs));

        for (var i = 0; i < myCOLHEAD_OBJ_TYPES.length; i++) {
            this.dialog.getPage(1).getDialogElement("PAGE_1_CHECK_"+parseInt(myCOLHEAD_OBJ_TYPES[i])).setChecked(true);
        }
    }
    this.PAGE_2_BUTTON_RESET_pressed = function() {
        // Reset list of COLUMN headers
        var listBox = this.dialog.getPage(1).getDialogElement("PAGE_2_LISTBOX");
        aRowHeaderDefs = copyArray(initData.aRowHeaderDefs);
        listBox.setItems(getItemNames(aRowHeaderDefs));

        for (var i = 0; i < myROWHEAD_OBJ_TYPES.length; i++) {
            this.dialog.getPage(1).getDialogElement("PAGE_2_CHECK_"+parseInt(myROWHEAD_OBJ_TYPES[i])).setChecked(true);
        }
    }
    this.PAGE_3_OPTIONS_selChanged = function() {
        switch (this.dialog.getPage(2).getDialogElement("PAGE_3_OPTIONS").getSelectedIndex()) {
            case 0: accessRight = Constants.AR_WRITE;
                    break;
            case 1: accessRight = Constants.AR_READ;
                    break;
            case 2: accessRight = Constants.AR_NORIGHTS;
                    break;
        }
    }
}

function updateEntriesByType(aHeaderDefs, aBaseHeaderDefs, typeNum, bAdd) {
    var aNewHeaderDefs = new Array();
    if (bAdd) {
        aNewHeaderDefs = aHeaderDefs.concat(getBaseHeadersByType(aBaseHeaderDefs, typeNum));
        aNewHeaderDefs = ArisData.Unique(aNewHeaderDefs);    
    } else {
        for (var i = 0; i < aHeaderDefs.length; i++) {
            var aHeaderDef = aHeaderDefs[i];
            if (aHeaderDef.TypeNum() != typeNum/*= type num to delete*/) {
                aNewHeaderDefs.push(aHeaderDefs[i]);
            }
        }
    }
    return aNewHeaderDefs.sort(SortByNameReport);

    function getBaseHeadersByType(aBaseHeaderDefs, typeNum) {
        var aNewBaseHeaderDefs = new Array();
        for (var j = 0; j < aBaseHeaderDefs.length; j++) {
            baseHeaderDef = aBaseHeaderDefs[j];
            if (baseHeaderDef.TypeNum() == typeNum) {
                aNewBaseHeaderDefs.push(baseHeaderDef);
            }
        }
        return aNewBaseHeaderDefs;
    }
}

function copyArray(aFromArray) {
    var aToArray = new Array();
    for (var i = 0; i < aFromArray.length; i++) {    
        aToArray.push(aFromArray[i])
    }
    return aToArray;
}

function removeSelectedEntries(aHeaderDefs, nIndicesToDelete) {
    var aNewHeaderDefs = new Array();
    for (var i = 0; i < aHeaderDefs.length; i++) {
        if (!isIndexToDelete(i, nIndicesToDelete)) {
            aNewHeaderDefs.push(aHeaderDefs[i]);
        }
    }
    return aNewHeaderDefs.sort(SortByNameReport);

    function isIndexToDelete(index, nIndicesToDelete) {
        for (var j = 0; j < nIndicesToDelete.length; j++) {
            if (index == nIndicesToDelete[j]) return true;
        }
        return false;
    }
}

function getItemNames(aItems) {
    var aItemNames = new Array();
    for (var i = 0; i < aItems.length; i++) {
        aItemNames.push(aItems[i].Name(language));
    }
    return aItemNames;
}

function getUserGroupNames(aUserGroups) {
    var aUserGroupNames = new Array();
    for (var i = 0; i < aUserGroups.length; i++) {
        aUserGroupNames.push(aUserGroups[i].Name(language));
    }
    return aUserGroupNames;
}

function checkFunctionRight(aRights, currentRight) {
    for (var i = 0; i < aRights.length; i++) {
        if (currentRight == aRights[i]) return true;
    }
    return false;
}

function checkData(initData) {
    var bCheck = true;
    var sMsgText = "";
    
    if (initData.aColHeaderDefs.length == 0 && initData.aRowHeaderDefs.length == 0) {
        sMsgText = getString("MSG_NO_HEADERS");
        bCheck = false;
    }
    if (initData.aUserGroups.length == 0) {
        if (sMsgText.length > 0) sMsgText += "\n";
        sMsgText = getString("MSG_NO_USERGROUPS");
        bCheck = false;
    }
    if (!bCheck) outErrorMessage(sMsgText);
    return bCheck;
}

function outErrorMessage(sMsgText) {
    sMsgText += "\n" + getString("MSG_REPORT_CANCELED");
    Dialogs.MsgBox(sMsgText, Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, Context.getScriptInfo(Constants.SCRIPT_NAME));
}