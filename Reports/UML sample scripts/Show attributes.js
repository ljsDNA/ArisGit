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

//-----------------------------------------------------------------------------------
// This report shows the owned attributes of the selected class in a message box.
//
// It can be started on UML 2 classes, i.e. on ARIS objects of type OT_UML2_CLASS.
// The report retrieves this information by using the OMF / UML specific report API.
//
// This report is not available to ARIS users by default.
//
// Copyright (c) Software AG. All Rights Reserved.
//-----------------------------------------------------------------------------------


// The ARIS object representing the UML2 class for which this report has been started:
var objDef = ArisData.getSelectedObjDefs()[0];

// The OMF component is the central entry point to the OMF and UML 2 specific report API:
var omf = Context.getComponent("OMF");

// Get a Uml2ScriptingClass interface for the select ARIS ObjDef:
// (We can rely on this because this report can be started on UML 2 classes only.)
var umlClass = omf.toOmfObject(objDef);

// The result string which will be shown in a message box:
var result = "Attributes of class " + umlClass.getName(null) + ":\n";

// The method Uml2ScriptingClass.getOwnedAttributes() returns a list of Uml2ScriptingProperty elements:
var umlProperties = umlClass.getOwnedAttributes();

// Iterate over the list of owned attributes...
for (var it = umlProperties.iterator(); it.hasNext(); ) {
    var umlProperty = it.next();
    
    // ... and add a string representation of the UML 2 Property to the resul:
    result += "\n" + getPropertyString(umlProperty);
}

// Show the result in a message box:
Dialogs.MsgBox(result);

/**
 * Returns a string representation of the given UML 2 Property.
 */
function getPropertyString(umlProperty) {
    var propertyString = "";
    
    propertyString += getVisibilityChar(umlProperty);
    propertyString += umlProperty.getName(null);
    propertyString += " : ";
    propertyString += getTypeString(umlProperty);
    propertyString += " [" + getMultiplicityString(umlProperty) + "]";
    
    return propertyString;
}

/**
 * Returns a string with a character showing the visibility of the given Uml2ScriptingProperty element.
 *
 * It shows how enumerations defined in the UML meta model are supported in the UML scripting API.
 */
function getVisibilityChar(umlProperty) {
    var visibility = umlProperty.getVisibility();
    
    if (visibility == null) {
        return "";
    }
    
    switch (visibility) {
        case Constants.UML2_VISIBILITY_KIND_PUBLIC:
            return "+";
        case Constants.UML2_VISIBILITY_KIND_PROTECTED:
            return "#";
        case Constants.UML2_VISIBILITY_KIND_PRIVATE:
            return "-";
        case Constants.UML2_VISIBILITY_KIND_PACKAGE:
            return "~";
        default:
            return "";
    }
}

/**
 * Returns a string representation of the type of the given UML 2 Property.
 */
function getTypeString(umlProperty) {
    var type = umlProperty.getType();
    
    if (type != null) {
        return type.getName(null);
    } else {
        return "<no type>";
    }
}

/**
 * Returns a string representation of the multiplicity of given UML 2 Property.
 *
 * It shows how the value 'unlimited' for an upper bound cna be identified in the UML scripting API.
 */
function getMultiplicityString(umlProperty) {
    var lower = umlProperty.getLower();
    var upper = umlProperty.getUpper();
    
    var multiplicityString = "";
    
    if (lower == upper) {
        multiplicityString += lower;
    } else if (upper == Constants.UML2_UNLIMITED_VALUE) {
        
        if (lower == 0) {
            multiplicityString += "*";
        } else {
            multiplicityString += lower + "..*";
        }
    } else {
        multiplicityString += lower + ".." + upper;
    }

    return multiplicityString;    
}
