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

var Layer = {
    STRATEGY:       Constants.AVT_ARCHIMATE_STRATEGY,
    BUSINESS:       Constants.AVT_ARCHIMATE_BUSINESS,
    APPLICATION:    Constants.AVT_ARCHIMATE_APPLICATION,
    TECHNOLOGY:     Constants.AVT_ARCHIMATE_TECHNOLOGY,
    PHYSICAL:       Constants.AVT_ARCHIMATE_PHYSICAL,
    IMPLEMENTATION: Constants.AVT_ARCHIMATE_IMPLEMENTATION_AND_MIGRATION,
    OTHER:          Constants.AVT_ARCHIMATE_OTHER
}

var Aspect = {
    BEHAVIOR:       Constants.AVT_ARCHIMATE_BEHAVIOR,
    STRUCTURE:      Constants.AVT_ARCHIMATE_STRUCTURE,
    PASSIVE:        Constants.AVT_ARCHIMATE_PASSIVE,
    ACTIVE:         Constants.AVT_ARCHIMATE_ACTIVE,
    COMPOSITE:      Constants.AVT_ARCHIMATE_COMPOSITE,
    MOTIVATION:     Constants.AVT_ARCHIMATE_MOTIVATION
}

var mapSymbols = new java.util.HashMap();

var ATTRVALUES = function(nAspect, nLayer) {
    this.aspect = nAspect;
    this.layer = nLayer;
}

function addToSymbolMap(p_symbol, p_aspect, p_layer) {
    mapSymbols.put(p_symbol, new ATTRVALUES(p_aspect, p_layer));
}

// Composite elements
addToSymbolMap(Constants.ST_ARCHIMATE_LOCATION, Aspect.COMPOSITE, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_LOCATION_S, Aspect.COMPOSITE, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_GROUP, Aspect.COMPOSITE, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_GROUP_S, Aspect.COMPOSITE, Layer.OTHER);
// Motivation elements
addToSymbolMap(Constants.ST_ARCHIMATE_STAKEHOLDER, Aspect.ACTIVE, Layer.OTHER); // specialization of "Active Structure Element" according to ArchiMate metamodel
addToSymbolMap(Constants.ST_ARCHIMATE_STAKEHOLDER_S, Aspect.ACTIVE, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_DRIVER, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_DRIVER_S, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_ASSESSMENT, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_ASSESSMENT_S, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_GOAL, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_GOAL_S, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_OUTCOME, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_OUTCOME_S, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_PRINCIPLE, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_PRINCIPLE_S, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_REQUIREMENT, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_REQUIREMENT_S, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_CONSTRAINT, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_CONSTRAINT_S, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_MEANING, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_MEANING_S, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_VALUE, Aspect.MOTIVATION, Layer.OTHER);
addToSymbolMap(Constants.ST_ARCHIMATE_VALUE_S, Aspect.MOTIVATION, Layer.OTHER);
// Strategy elements
addToSymbolMap(Constants.ST_ARCHIMATE_RESOURCE, Aspect.STRUCTURE, Layer.STRATEGY);
addToSymbolMap(Constants.ST_ARCHIMATE_RESOURCE_S, Aspect.STRUCTURE, Layer.STRATEGY);
addToSymbolMap(Constants.ST_ARCHIMATE_CAPABILITY, Aspect.BEHAVIOR, Layer.STRATEGY);
addToSymbolMap(Constants.ST_ARCHIMATE_CAPABILITY_S, Aspect.BEHAVIOR, Layer.STRATEGY);
addToSymbolMap(Constants.ST_ARCHIMATE_VALUE_STREAM, Aspect.BEHAVIOR, Layer.STRATEGY);
addToSymbolMap(Constants.ST_ARCHIMATE_VALUE_STREAM_S, Aspect.BEHAVIOR, Layer.STRATEGY);
addToSymbolMap(Constants.ST_ARCHIMATE_COURSE_OF_ACTION, Aspect.BEHAVIOR, Layer.STRATEGY);
addToSymbolMap(Constants.ST_ARCHIMATE_COURSE_OF_ACTION_S, Aspect.BEHAVIOR, Layer.STRATEGY);
// Business layer, active structure elements
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_ROLE, Aspect.ACTIVE, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_ROLE_S, Aspect.ACTIVE, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_ACTOR, Aspect.ACTIVE, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_ACTOR_S, Aspect.ACTIVE, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_COLLABORATION, Aspect.ACTIVE, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_COLLABORATION_S, Aspect.ACTIVE, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_INTERFACE, Aspect.ACTIVE, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_INTERFACE_S, Aspect.ACTIVE, Layer.BUSINESS);
// Business layer, behavior elements
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_PROCESS, Aspect.BEHAVIOR, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_PROCESS_S, Aspect.BEHAVIOR, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_FUNCTION, Aspect.BEHAVIOR, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_FUNCTION_S, Aspect.BEHAVIOR, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_INTERACTION, Aspect.BEHAVIOR, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_INTERACTION_S, Aspect.BEHAVIOR, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_EVENT, Aspect.BEHAVIOR, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_EVENT_S, Aspect.BEHAVIOR, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_SERVICE, Aspect.BEHAVIOR, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_SERVICE_S, Aspect.BEHAVIOR, Layer.BUSINESS);
// Business layer, passive structure elements
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_OBJECT, Aspect.PASSIVE, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_BUSINESS_OBJECT_S, Aspect.PASSIVE, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_CONTRACT, Aspect.PASSIVE, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_CONTRACT_S, Aspect.PASSIVE, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_REPRESENTATION, Aspect.PASSIVE, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_REPRESENTATION_S, Aspect.PASSIVE, Layer.BUSINESS);
// Business layer, composite elements
addToSymbolMap(Constants.ST_ARCHIMATE_PRODUCT, Aspect.COMPOSITE, Layer.BUSINESS);
addToSymbolMap(Constants.ST_ARCHIMATE_PRODUCT_S, Aspect.COMPOSITE, Layer.BUSINESS);
// Application layer, active structure elements
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_COMPONENT, Aspect.ACTIVE, Layer.APPLICATION);
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_COMPONENT_S, Aspect.ACTIVE, Layer.APPLICATION);
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_COLLABORATION, Aspect.ACTIVE, Layer.APPLICATION);
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_COLLABORATION_S, Aspect.ACTIVE, Layer.APPLICATION);
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_INTERFACE, Aspect.ACTIVE, Layer.APPLICATION);
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_INTERFACE_S, Aspect.ACTIVE, Layer.APPLICATION);
// Application layer, behavior elements
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_FUNCTION, Aspect.BEHAVIOR, Layer.APPLICATION);
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_FUNCTION_S, Aspect.BEHAVIOR, Layer.APPLICATION);
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_INTERACTION, Aspect.BEHAVIOR, Layer.APPLICATION);
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_INTERACTION_S, Aspect.BEHAVIOR, Layer.APPLICATION);
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_PROCESS, Aspect.BEHAVIOR, Layer.APPLICATION);
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_PROCESS_S, Aspect.BEHAVIOR, Layer.APPLICATION);
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_EVENT, Aspect.BEHAVIOR, Layer.APPLICATION);
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_EVENT_S, Aspect.BEHAVIOR, Layer.APPLICATION);
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_SERVICE, Aspect.BEHAVIOR, Layer.APPLICATION);
addToSymbolMap(Constants.ST_ARCHIMATE_APPLICATION_SERVICE_S, Aspect.BEHAVIOR, Layer.APPLICATION);
// Application layer, passive structure elements
addToSymbolMap(Constants.ST_ARCHIMATE_DATA_OBJECT, Aspect.PASSIVE, Layer.APPLICATION);
addToSymbolMap(Constants.ST_ARCHIMATE_DATA_OBJECT_S, Aspect.PASSIVE, Layer.APPLICATION);
// Technology layer, active structure elements
addToSymbolMap(Constants.ST_ARCHIMATE_NODE, Aspect.ACTIVE, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_NODE_S, Aspect.ACTIVE, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_DEVICE, Aspect.ACTIVE, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_DEVICE_S, Aspect.ACTIVE, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_SYSTEM_SOFTWARE, Aspect.ACTIVE, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_SYSTEM_SOFTWARE_S, Aspect.ACTIVE, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_TECHNOLOGY_COLLABORATION, Aspect.ACTIVE, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_TECHNOLOGY_COLLABORATION_S, Aspect.ACTIVE, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_TECHNOLOGY_INTERFACE, Aspect.ACTIVE, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_TECHNOLOGY_INTERFACE_S, Aspect.ACTIVE, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_PATH, Aspect.ACTIVE, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_PATH_S, Aspect.ACTIVE, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_NETWORK, Aspect.ACTIVE, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_NETWORK_S, Aspect.ACTIVE, Layer.TECHNOLOGY);
// Technology layer, behavior elements
addToSymbolMap(Constants.ST_ARCHIMATE_TECHNOLOGY_FUNCTION, Aspect.BEHAVIOR, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_TECHNOLOGY_FUNCTION_S, Aspect.BEHAVIOR, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_TECHNOLOGY_PROCESS, Aspect.BEHAVIOR, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_TECHNOLOGY_PROCESS_S, Aspect.BEHAVIOR, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_TECHNOLOGY_INTERACTION, Aspect.BEHAVIOR, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_TECHNOLOGY_INTERACTION_S, Aspect.BEHAVIOR, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_TECHNOLOGY_EVENT, Aspect.BEHAVIOR, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_TECHNOLOGY_EVENT_S, Aspect.BEHAVIOR, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_TECHNOLOGY_SERVICE, Aspect.BEHAVIOR, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_TECHNOLOGY_SERVICE_S, Aspect.BEHAVIOR, Layer.TECHNOLOGY);
// Technology layer, passive structure elements
addToSymbolMap(Constants.ST_ARCHIMATE_ARTIFACT, Aspect.PASSIVE, Layer.TECHNOLOGY);
addToSymbolMap(Constants.ST_ARCHIMATE_ARTIFACT_S, Aspect.PASSIVE, Layer.TECHNOLOGY);
// Physical elements, active structure elements
addToSymbolMap(Constants.ST_ARCHIMATE_EQUIPMENT, Aspect.ACTIVE, Layer.PHYSICAL);
addToSymbolMap(Constants.ST_ARCHIMATE_EQUIPMENT_S, Aspect.ACTIVE, Layer.PHYSICAL);
addToSymbolMap(Constants.ST_ARCHIMATE_FACILITY, Aspect.ACTIVE, Layer.PHYSICAL);
addToSymbolMap(Constants.ST_ARCHIMATE_FACILITY_S, Aspect.ACTIVE, Layer.PHYSICAL);
addToSymbolMap(Constants.ST_ARCHIMATE_DISTRIBUTION_NETWORK, Aspect.ACTIVE, Layer.PHYSICAL);
addToSymbolMap(Constants.ST_ARCHIMATE_DISTRIBUTION_NETWORK_S, Aspect.ACTIVE, Layer.PHYSICAL);
// Physical elements, passive structure elements
addToSymbolMap(Constants.ST_ARCHIMATE_MATERIAL, Aspect.PASSIVE, Layer.PHYSICAL);
addToSymbolMap(Constants.ST_ARCHIMATE_MATERIAL_S, Aspect.PASSIVE, Layer.PHYSICAL);
// Implementation and migration elements
addToSymbolMap(Constants.ST_ARCHIMATE_WORK_PACKAGE, Aspect.BEHAVIOR, Layer.IMPLEMENTATION);
addToSymbolMap(Constants.ST_ARCHIMATE_WORK_PACKAGE_S, Aspect.BEHAVIOR, Layer.IMPLEMENTATION);
addToSymbolMap(Constants.ST_ARCHIMATE_DELIVERABLE, Aspect.PASSIVE, Layer.IMPLEMENTATION);
addToSymbolMap(Constants.ST_ARCHIMATE_DELIVERABLE_S, Aspect.PASSIVE, Layer.IMPLEMENTATION);
addToSymbolMap(Constants.ST_ARCHIMATE_IMPLEMENTATION_EVENT, Aspect.BEHAVIOR, Layer.IMPLEMENTATION);
addToSymbolMap(Constants.ST_ARCHIMATE_IMPLEMENTATION_EVENT_S, Aspect.BEHAVIOR, Layer.IMPLEMENTATION);
addToSymbolMap(Constants.ST_ARCHIMATE_PLATEAU, Aspect.COMPOSITE, Layer.IMPLEMENTATION);
addToSymbolMap(Constants.ST_ARCHIMATE_PLATEAU_S, Aspect.COMPOSITE, Layer.IMPLEMENTATION);
addToSymbolMap(Constants.ST_ARCHIMATE_GAP, Aspect.PASSIVE, Layer.IMPLEMENTATION);
addToSymbolMap(Constants.ST_ARCHIMATE_GAP_S, Aspect.PASSIVE, Layer.IMPLEMENTATION);

// Build an array of relevant object types from the symbols in the hash map.
// This is used below for pre-filtering the objects to be evaluated.
var aObjTypes = [];
var filter = ArisData.ActiveFilter();
var iter = mapSymbols.keySet().iterator();
while (iter.hasNext()) {
    var objType = filter.SymbolObjType(iter.next());
    if (!aObjTypes.indexOf(objType)!=-1)
        aObjTypes.push(objType);
}

// Get either the selected objects or the objects in the selected groups
var aObjects = [];
var aSelectedGroups = ArisData.getSelectedGroups();
if (aSelectedGroups.length == 0) {
    aObjects = ArisData.getSelectedObjDefs();
} else {
    for (var i in aSelectedGroups) {
        aObjects = aObjects.concat(aSelectedGroups[i].ObjDefList(true, aObjTypes));
    }
}

// Set the attributes at objects which have a relevant default symbol
var nLoc = Context.getSelectedLanguage();
var nCount = 0;
for (var i in aObjects) {
    var obj = aObjects[i];
    var attrValues = mapSymbols.get(obj.getDefaultSymbolNum());
    if (attrValues != null) {
        obj.Attribute(Constants.AT_ARCHIMATE_ASPECT, nLoc).setValue(attrValues.aspect);
        obj.Attribute(Constants.AT_ARCHIMATE_LAYER, nLoc).setValue(attrValues.layer);
        nCount++;
    }
}
Dialogs.MsgBox(formatstring1(getString("TEXT_1"), nCount.toString()), Constants.MSGBOX_BTN_OK, getString("TEXT_2"));
