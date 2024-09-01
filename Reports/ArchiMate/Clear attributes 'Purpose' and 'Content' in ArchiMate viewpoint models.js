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

// Get either the selected models or the models in the selected groups
var aModels = [];
var aSelectedGroups = ArisData.getSelectedGroups();
if (aSelectedGroups.length == 0) {
    aModels = ArisData.getSelectedModels();
} else {
    for (var i in aSelectedGroups) {
        aModels = aModels.concat(aSelectedGroups[i].ModelList(true, null));
    }
}

// Clear the attributes at all models found
var nLoc = Context.getSelectedLanguage();
var nCount = 0;
for (var i in aModels) {
    var model = aModels[i];
    var bChanged = false;
    var oAttrPurpose = model.Attribute(Constants.AT_ARCHIMATE_PURPOSE, nLoc);
    if (oAttrPurpose.IsMaintained()) {
        oAttrPurpose.Delete();
        bChanged = true;
    }
    var oAttrContent = model.Attribute(Constants.AT_ARCHIMATE_CONTENT, nLoc);
    if (oAttrContent.IsMaintained()) {
        oAttrContent.Delete();
        bChanged = true;
    }
    if (bChanged) nCount++;
}
Dialogs.MsgBox(formatstring1(getString("TEXT_1"), nCount.toString()), Constants.MSGBOX_BTN_OK, getString("TEXT_2"));
