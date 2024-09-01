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

// Get either the selected objects or the objects in the selected groups
var aObjects = [];
var aSelectedGroups = ArisData.getSelectedGroups();
if (aSelectedGroups.length == 0) {
    aObjects = ArisData.getSelectedObjDefs();
} else {
    for (var i in aSelectedGroups) {
        aObjects = aObjects.concat(aSelectedGroups[i].ObjDefList(true, null));
    }
}

// Clear the attributes at all objects found
var nLoc = Context.getSelectedLanguage();
var nCount = 0;
for (var i in aObjects) {
    var obj = aObjects[i];
    var bChanged = false;
    var oAttrAspect = obj.Attribute(Constants.AT_ARCHIMATE_ASPECT, nLoc);
    if (oAttrAspect.IsMaintained()) {
        oAttrAspect.Delete();
        bChanged = true;
    }
    var oAttrLayer = obj.Attribute(Constants.AT_ARCHIMATE_LAYER, nLoc);
    if (oAttrLayer.IsMaintained()) {
        oAttrLayer.Delete();
        bChanged = true;
    }
    if (bChanged) nCount++;
}
Dialogs.MsgBox(formatstring1(getString("TEXT_1"), nCount.toString()), Constants.MSGBOX_BTN_OK, getString("TEXT_2"));
