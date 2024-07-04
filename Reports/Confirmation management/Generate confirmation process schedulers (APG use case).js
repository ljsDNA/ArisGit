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
var CONF = Context.getComponent("Confirmation");
var UMC = Context.getComponent("UMC");
var g_database = ArisData.getActiveDatabase();
var g_locale = Context.getSelectedLanguage();

var g_errorReport = "";
var g_validItems = [];
var g_invalidItems = [];

main();

function main() {
    var items = [];
    items = items.concat(ArisData.getSelectedModels());
    items = items.concat(ArisData.getSelectedObjDefs());
    
    readItemsForSchedulers(items);
    
    var confNameFromProcess = Context.getProperty("confNameFromUser");
    var guids = [];
    
    for (var i = 0; i < g_validItems.length; i++) {
        var item = g_validItems[i];
        
        var descriptionAttr = item.Attribute(Constants.AT_CONFIRMATION_DESC, g_locale);
        var tempDescription = descriptionAttr.getValue();
        
        // teporarily update the description, only for generation
        var locale = g_database.getDbLanguage().LocaleInfo().getLocale();
        var dateFormat = java.text.DateFormat.getDateTimeInstance(java.text.DateFormat.MEDIUM, java.text.DateFormat.MEDIUM, locale);
        var formattedDate = dateFormat.format(Date.now());
        var description = getString("CONFIRMATION_DESCRIPTION") + " " + formattedDate;
        descriptionAttr.setValue(description);
        
        // override with name from process dialog, if available
        var nameAttr = item.Attribute(Constants.AT_CONFIRMATION_NAME, g_locale);
        var tempName = nameAttr.getValue();
        if (confNameFromProcess) {
            nameAttr.setValue(confNameFromProcess);
        }
        
        // create and activate scheduler
        var scheduler = CONF.createConfirmationScheduler(item);
        var guid = scheduler.getValueAttribute("guid").getRawValue();
        guids.push(guid);
        
        // reset to original values
        descriptionAttr.setValue(tempDescription);
        if (confNameFromProcess) {
            nameAttr.setValue(tempName);
        }
    }
    // generate processes for schedulers
    ARCM.triggerGeneratorServerTask("", guids);
    
    var ooutfile = Context.createOutputObject();
    if (g_errorReport != "") {
        ooutfile.OutputTxt(g_errorReport);
    } else {
        ooutfile.OutputTxt(getString("SCHEDULERS_CREATED"));
        for (var i = 0; i < g_validItems.length; i++) {
            var item = g_validItems[i];
            ooutfile.OutputTxt("\n\t" + item.Name(g_locale));
        }
    }
    ooutfile.WriteReport(); //This line only tests the result
}

function readItemsForSchedulers(items) {
    for (var i=0; i<items.length; i++) {
        readItemForScheduler(items[i]);
    }
}

function readItemForScheduler(item) {
    if (hasValidAttributes(item)) {
        g_validItems.push(item);
    } else {
        g_invalidItems.push(item);
    }
}

function hasValidAttributes(item) {
    var errors = [];
    var isValid = isValidAttributeValue(item, Constants.AT_CONFIRMATION_NAME, errors);
    isValid &= isValidAttributeValue(item, Constants.AT_CONFIRMATION_DURATION_1, errors);
    isValid &= isValidAttributeValue(item, Constants.AT_CONFIRMATION_ADDRESSEES, errors);
    if (!isValid) {
        logError(formatstring2(getString("INVALID_ITEM"), item.Name(g_locale), item.GUID()));
        logError("\t"+errors.join("\n\t"));
    }
    return isValid;
}

function isValidAttributeValue(item, attrId, errors) {
    var attribute = item.Attribute(attrId, g_locale);
    var value = attribute.getValue();
    var name = attribute.Type();
    
    var isValid = value && value != "";
    if (!isValid) {
        errors.push(formatstring1(getString("INVALID_ITEM_ATTRIBUTE"), name));
    }
    return isValid;
}

function createValidItemsSchedulers(thresholdDate) {
    for (var i=0; i<validItems.length; i++) {
        Confirmation.createConfirmationScheduler(validItems[i]);
    }
}

function logError(msg) {
    g_errorReport += msg+"\n";
}