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

var ARCM = Context.getComponent("ARCM");
var Confirmation = Context.getComponent("Confirmation");
var UMC = Context.getComponent("UMC");
var locale = Context.getSelectedLanguage();
var errorReport = "";
var valBackup = {};
var validItems = [];
var invalidItems = [];

main();
 
function main() {
    if(!userHasPermission()){
        Context.setScriptError(Constants.ERR_CANCEL);
        return;
    }
    
    var thresholdDate = askThresholdDate();
    if(thresholdDate != null){
        readGroupsForSchedulers(ArisData.getSelectedGroups(), thresholdDate);
        if(invalidItems.length == 0){
            createValidItemsSchedulers(thresholdDate);
        }
    } else {
        return;
    }
    if(errorReport != ""){
        var g_ooutfile = Context.createOutputObject();
        g_ooutfile.OutputTxt(errorReport);
        g_ooutfile.WriteReport();
    } else {
        Dialogs.MsgBox(formatstring2(getString("SCHEDULERS_CREATED"), getLocalizedDate(thresholdDate), validItems.length), Constants.MSGBOX_ICON_INFORMATION, getString("SCHEDULERS_CREATED_DIALOG_TITLE"));
    }
}

function userHasPermission(){
    if(!isConfirmationAdmin() && !isConfirmationManager()) {
        Dialogs.MsgBox(formatstring2(getString("FUNCTION_PRIVILEGES_MISSING"), getPrivilegesDisplayName("CFM_ADMIN"), getPrivilegesDisplayName("CFM_MANAGER")), Constants.MSGBOX_ICON_ERROR, "Error");
        return false;
    }
    if(!hasOperateLicense()) {
        Dialogs.MsgBox(formatstring1(getString("OPERATE_PRIVILEGES_MISSING"),getPrivilegesDisplayName("LICENSE_YRCOP")), Constants.MSGBOX_ICON_ERROR, "Error");
        return false;
    }
    return true;
}
function isConfirmationAdmin() {
    var user = UMC.getCurrentUser();
    return findPrivilegesForUser(user, "CFM_ADMIN", true, false) != null;  
}

function isConfirmationManager() {
    var user = UMC.getCurrentUser();
    return findPrivilegesForUser(user, "CFM_MANAGER", true, false) != null;  
}

function hasOperateLicense() {
    var user = UMC.getCurrentUser();
    return findPrivilegesForUser(user, "LICENSE_YRCOP", false, true) != null;  
}

function findPrivilegesForUser(user, privilegeName, isFunctionPrivilege, isLicencePrivilege) {
    var user = UMC.getCurrentUser();
    var privileges = UMC.getPrivilegesForUser(user, isFunctionPrivilege, isLicencePrivilege, true);   
    for(var x = 0; x < privileges.size(); x++) {
        var privilege = privileges.get(x);
        if(privilege.getName() == privilegeName) {
            return privilege;
        }
    }
    return null;    
}

function getPrivilegesDisplayName(privilegeName) {
    var privileges = UMC.getAllPrivileges(true, true);   
    for(var x = 0; x < privileges.size(); x++) {
        var privilege = privileges.get(x);
        if(privilege.getName() == privilegeName) {
            return privilege.getDisplayName();
        }
    }
    return null;    
}

function askThresholdDate(){
    var result = Dialogs.showDialog(new thresholdDialog(), Constants.DIALOG_TYPE_ACTION, Context.getScriptInfo(Constants.SCRIPT_TITLE));
    if(result.bOk){
        try {
            return new java.util.Date(result.thresholdDate);
        } catch(e) {
            logError(getString("INVALID_THRESHOLD_DATE"));
        }
    } else {
        Context.setScriptError(Constants.ERR_CANCEL);
    }
    return null;
}

function thresholdDialog() {
    var result = {thresholdDate: ""};

    this.getPages = function () {
        var iDialogTemplate1 = Dialogs.createNewDialogTemplate(500, 50, Context.getScriptInfo(Constants.SCRIPT_TITLE));
        iDialogTemplate1.Text(10, 5, 490, 32, getString("THRESHOLD_HINT"));
        iDialogTemplate1.Text(10, 37, 490, 16, getString("ENTER_THRESHOLD_DATE") + ":");
        iDialogTemplate1.DateChooser(10, 53, 150, 14, "THRESHOLD_DATE");
        return [iDialogTemplate1];
    }

    this.init = function (aPages) {}

    this.isInValidState = function (pageNumber) {
        return true;
    }

    this.onClose = function (pageNumber, bOk) {
        result.thresholdDate = this.dialog.getPage(0).getDialogElement("THRESHOLD_DATE").getDate();
        result.bOk = bOk;
    }

    this.getResult = function () {
        return result;
    }
}

function readGroupsForSchedulers(groups, thresholdDate){
    for(var i=0; i<groups.length; i++){
        readGroupForSchedulers(groups[i], thresholdDate);
    }
}

function readGroupForSchedulers(group, thresholdDate){
    readItemsForSchedulers(group.ModelList(), thresholdDate);
    readItemsForSchedulers(group.ObjDefList(), thresholdDate);
    readGroupsForSchedulers(group.Childs(), thresholdDate);
}

function readItemsForSchedulers(items, thresholdDate){
    for(var i=0; i<items.length; i++){
        readItemForScheduler(items[i], thresholdDate);
    }
}

function readItemForScheduler(item, thresholdDate){
    if(wasChangedAfterThreshold(item, thresholdDate)) {
        if(hasValidAttributes(item)){
            validItems.push(item);
        } else {
            invalidItems.push(item);
        }
    }
}

function hasValidAttributes(item){
    var errors = [];
    var isValid = isValidAttributeValue(item, Constants.AT_CONFIRMATION_NAME, errors);
        isValid &= isValidAttributeValue(item, Constants.AT_CONFIRMATION_DURATION_1, errors);
        isValid &= isValidAttributeValue(item, Constants.AT_CONFIRMATION_ADDRESSEES, errors);
    if(!isValid){
        logError(formatstring2(getString("INVALID_ITEM"), item.Name(locale), item.GUID()));
        logError("\t"+errors.join("\n\t"));
    }
    return isValid;
}

function isValidAttributeValue(item, attrId, errors){
    var attribute = item.Attribute(attrId, locale);
    var value = attribute.getValue();
    var name = attribute.Type();
    
    var isValid = value && value != "";
    if(!isValid){
        errors.push(formatstring1(getString("INVALID_ITEM_ATTRIBUTE"), name));
    }
    return isValid;
}

function createValidItemsSchedulers(thresholdDate){
    for(var i=0; i<validItems.length; i++){
        Confirmation.createConfirmationScheduler(validItems[i]);
    }
}

function getLocalizedDate(date){
    return java.text.DateFormat.getDateInstance(java.text.DateFormat.MEDIUM, getLocale(locale)).format(date);
}

function getLocale(localeId) {
  return ArisData.getActiveDatabase().LanguageList()[0].convertLocale(localeId).getLocale();  
}

function wasChangedAfterThreshold(item, thresholdDate){
    var itemLastChangeDate = item.Attribute(Constants.AT_LAST_CHNG_2, locale).MeasureValue();
    return itemLastChangeDate.compareTo(thresholdDate) >= 0;
}

function logError(msg){
    errorReport += msg+"\n";
}