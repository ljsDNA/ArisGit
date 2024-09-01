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


//Context.writePrivateProfileInt("mySection", "myInt1", 10, "myFile.xml");
//Context.writePrivateProfileString("mySection", "myString1", "Test", "myFile.xml");

var numberOfUnits = Context.getPrivateProfileString("QuadrantConfiguration", "numberOfUnits", 0, "quadrants configuration.xml");
var attributeName = Context.getPrivateProfileString("QuadrantConfiguration", "configuration", "Default", "quadrants configuration.xml");
var useRGB = Context.getPrivateProfileString("QuadrantConfiguration", "useRGB", "Default", "quadrants configuration.xml");

var unitCount = parseInt(numberOfUnits);

var mapString = "";

for (var i=1; i<=unitCount; i++) {
    mapString = mapString + Context.getPrivateProfileString("QuadrantConfiguration", "attributeVal" + i, "Default", "quadrants configuration.xml") + ":";
    mapString = mapString + Context.getPrivateProfileString("QuadrantConfiguration", "AssignedColor" + i, "Default", "quadrants configuration.xml") + "#";
}

Context.setProperty("mapString", mapString);
Context.setProperty("useRGB", useRGB);
Context.setProperty("attributeName", attributeName);

//Dialogs.MsgBox(attributeName + " - " + numberOfUnits);
