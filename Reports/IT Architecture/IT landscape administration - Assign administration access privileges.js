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


DATA_TYPE = function(p_aUserGroups, p_accessRight) {
    this.aUserGroups = p_aUserGroups;
    this.accessRight = p_accessRight;
}

var oDB = ArisData.getActiveDatabase();

var g_oPsmConfig = new psmConfig(false/*p_bMacro*/);
var g_oPsuGroup = g_oPsmConfig.getPsuGroup();

main();

/******************************************************************************************************/

function main() {
    // Check function rights of active user
    if (!checkFunctionRight(ArisData.getActiveUser().FunctionRights(), Constants.AT_USR_ADMIN)) {
        outErrorMessage(formatstring1(getString("MSG_MISSING_RIGHTS"), ArisData.ActiveFilter().AttrTypeName(Constants.AT_USR_ADMIN)));
        return;
    }
    
    var result = Dialogs.showDialog(new accessDialog(), Constants.DIALOG_TYPE_ACTION, getString("DIALOG_HEADLINE"));
    if (result != null) {
        inheritAccessPrivileges(result);
    }
}

function inheritAccessPrivileges(result) {
    var aUserGroups = result.aUserGroups;
    var accessRight = result.accessRight;

    for (var i = 0; i < aUserGroups.length; i++) {
        aUserGroups[i].inheritAccessRights(g_oPsuGroup, accessRight);
    }
}

function accessDialog() {
    var aUserGroups = new Array();    
    var aSelectedUserGroups = new Array();
    var accessRight = Constants.AR_WRITE;
    
    this.getPages = function() {   
        var accessDialog = Dialogs.createNewDialogTemplate(0, 0, 500, 400);
        accessDialog.GroupBox(10, 5, 480, 40, getString("PSU_GROUP_PATH"));
        accessDialog.TextBox(20, 20, 460, 16, "FIELD_TEXT");
        accessDialog.GroupBox(10, 50, 480, 65, getString("SET_REMOVE"));
        accessDialog.OptionGroup("FIELD_OPTIONS");  
        accessDialog.OptionButton (20, 65, 300, 15, getString("OPTION_WRITE"), "FIELD_OPTION_WRITE");
        accessDialog.OptionButton (20, 80, 300, 15, getString("OPTION_READ"), "FIELD_OPTION_READ");
        accessDialog.OptionButton (20, 95, 300, 15, getString("OPTION_NORIGHTS"), "FIELD_OPTION_NORIGHTS");
        accessDialog.GroupBox(10, 120, 480, 280, getString("USERGRP_SELECTION")); 
        var columnArray = ["", getString("NAME")];
        var editorInfo = [Constants.TABLECOLUMN_BOOL_EDIT, Constants.TABLECOLUMN_DEFAULT];
        accessDialog.Table(20, 135, 460, 255, columnArray, editorInfo, [], "FIELD_TABLE", Constants.TABLE_STYLE_MULTISELECT);
        
        return [accessDialog];
    }
    //initialize dialog pages (are already created and pre-initialized with static data from XML or template)
    //parameter: Array of DialogPage
    //see Help: DialogPage
    //user can set control values
    //optional
    this.init = function(aPages) {
        aPages[0].getDialogElement("FIELD_TEXT").setText(g_oPsuGroup.Path(language));
        aPages[0].getDialogElement("FIELD_TEXT").setEnabled(false);
        
        var index = 0;
        aUserGroups = getRelevantUserGroups(index);
        if (aUserGroups.length == 0) {
            aPages[0].getDialogElement("FIELD_OPTION_WRITE").setEnabled(false);            
            index = 1;
            aUserGroups = getRelevantUserGroups(index);
        }
        aPages[0].getDialogElement("FIELD_OPTIONS").setSelection(index);   // 0 = AR_WRITE, 1 = AR_READ

        var tableEntries = getTableEntries(index, aUserGroups);
        aPages[0].getDialogElement("FIELD_TABLE").setItems(tableEntries);
        
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
        if (bOk) {
            aSelectedUserGroups = new Array();
            // Read selected user groups
            var tableEntries = this.dialog.getPage(0).getDialogElement("FIELD_TABLE").getItems();
            for (var i = 0; i < tableEntries.length; i++) {
                if (tableEntries[i][0] == "1") {
                    aSelectedUserGroups.push(aUserGroups[i]);
                }
            }
        } else {
            aSelectedUserGroups = null;
        }
    }
    //the result of this function is returned as result of Dialogs.showDialog(). Can be any object.
    //optional    
    this.getResult = function() {
        if (aSelectedUserGroups == null) return null;
        return new DATA_TYPE(aSelectedUserGroups, accessRight);
    }

    this.FIELD_OPTIONS_selChanged = function() {
        var index = this.dialog.getPage(0).getDialogElement("FIELD_OPTIONS").getSelectedIndex();
        // update table entries
        aUserGroups = getRelevantUserGroups(index);
        var tableEntries = getTableEntries(index, aUserGroups);
        this.dialog.getPage(0).getDialogElement("FIELD_TABLE").setItems(tableEntries);
        
        switch (index) {
            case 0: accessRight = Constants.AR_WRITE;
                    break;
            case 1: accessRight = Constants.AR_READ;
                    break;
            case 2: accessRight = Constants.AR_NORIGHTS;
                    break;
        }
    }
}

function getTableEntries(index, aUserGroups) {
    var tableEntries = new Array();
    var aUserGroupNames = getUserGroupNames(index, aUserGroups);
    for (var i = 0; i < aUserGroupNames.length; i++) {
        tableEntries.push(["", aUserGroupNames[i]]);
    }
    return tableEntries;    
}

function getRelevantUserGroups(index) {
    var aRelevantUserGroups = new Array();
    var aUserGroups = oDB.UserGroupList();
    for (var i = 0; i < aUserGroups.length; i++) {
        var oUserGroup = aUserGroups[i];
        if (index == 0) {
            // user groups with function right 'User mgmt'
            if (checkFunctionRight(oUserGroup.FunctionRights(), Constants.AT_USR_ADMIN)) {
                aRelevantUserGroups.push(oUserGroup);
            }
        } else if (index == 1) {
            // all user groups
            aRelevantUserGroups.push(oUserGroup);
        } else if (index == 2) {
            // user groups with access rights on PSU group
            var accessRights = oUserGroup.AccessRights(g_oPsuGroup);
            if ((accessRights & Constants.AR_READ) == Constants.AR_READ) aRelevantUserGroups.push(oUserGroup);
        }
    }
    return aRelevantUserGroups.sort(SortByNameReport);
}

function getUserGroupNames(index, aUserGroups) {
    var aUserGroupNames = new Array();
    for (var i = 0; i < aUserGroups.length; i++) {
        var oUserGroup = aUserGroups[i];
        var name = oUserGroup.Name(language);
        if (index >= 1) {
            var accessRights = oUserGroup.AccessRights(g_oPsuGroup);
            if ((accessRights & Constants.AR_WRITE) == Constants.AR_WRITE) name += " *";
        }
        aUserGroupNames.push(name);
    }
    return aUserGroupNames;
}

function checkFunctionRight(aRights, currentRight) {
    for (var i = 0; i < aRights.length; i++) {
        if (currentRight == aRights[i]) return true;
    }
    return false;
}

function outErrorMessage(sMsgText) {
    sMsgText += "\n" + getString("MSG_REPORT_CANCELED");
    Dialogs.MsgBox(sMsgText, Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, Context.getScriptInfo(Constants.SCRIPT_NAME));
}