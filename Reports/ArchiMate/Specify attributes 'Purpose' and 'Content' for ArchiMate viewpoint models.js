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

var Purpose = {
    DECIDING:   Constants.AVT_ARCHIMATE_DECIDING,
    DESIGNING:  Constants.AVT_ARCHIMATE_DESIGNING,
    INFORMING:  Constants.AVT_ARCHIMATE_INFORMING
}

var Content = {
    DETAILS:    Constants.AVT_ARCHIMATE_DETAILS,    // single layer, single aspect
    COHERENCE:  Constants.AVT_ARCHIMATE_COHERENCE,  // multiple layers, single aspect OR single layer, multiple aspects
    OVERVIEW:   Constants.AVT_ARCHIMATE_OVERVIEW    // multiple layers, multiple aspects
}

var mapModelTypes = new java.util.HashMap();

var ATTRVALUES = function(nPurpose, nContent) {
    this.purpose = nPurpose;
    this.content = nContent;
}

function addToModelTypeMap(p_modelType, p_purpose, p_content) {
    mapModelTypes.put(p_modelType, new ATTRVALUES(p_purpose, p_content));
}

addToModelTypeMap("f6186b21-5a6d-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.COHERENCE); // ArchiMate Application Cooperation Viewpoint
addToModelTypeMap("f521b660-4d93-11ea-653e-5048494f4e43", Purpose.DESIGNING, Content.COHERENCE); // ArchiMate Application Structure Viewpoint
addToModelTypeMap("cff2a411-5a6d-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.OVERVIEW);  // ArchiMate Application Usage Viewpoint
addToModelTypeMap("eb7a5ed1-5a6d-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.OVERVIEW);  // ArchiMate Business Process Cooperation Viewpoint
addToModelTypeMap("6b54a021-5a6e-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.DETAILS);   // ArchiMate Capability Map Viewpoint
addToModelTypeMap("3b463a11-5a6e-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.DETAILS);   // ArchiMate Goal Realization Viewpoint
addToModelTypeMap("23605e31-5a6e-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.OVERVIEW);  // ArchiMate Implementation and Deployment Viewpoint
addToModelTypeMap("aa42b3d1-5a6e-11e7-7842-0050568c0a2f", Purpose.DECIDING,  Content.OVERVIEW);  // ArchiMate Implementation and Migration Viewpoint
addToModelTypeMap("849f58a1-5a6d-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.COHERENCE); // ArchiMate Information Structure Viewpoint
addToModelTypeMap("a70dbd01-5a6d-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.OVERVIEW);  // ArchiMate Layered Viewpoint
addToModelTypeMap("9d3d9291-5a6e-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.DETAILS);   // ArchiMate Migration Viewpoint
addToModelTypeMap("5191edf1-5a6e-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.DETAILS);   // ArchiMate Motivation Viewpoint
addToModelTypeMap("747b9241-5a6d-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.DETAILS);   // ArchiMate Organization Viewpoint
addToModelTypeMap("783856b1-5a6e-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.DETAILS);   // ArchiMate Outcome Realization Viewpoint
addToModelTypeMap("b5fde561-5a6d-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.OVERVIEW);  // ArchiMate Physical Viewpoint
addToModelTypeMap("c53f3b01-5a6d-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.OVERVIEW);  // ArchiMate Product Viewpoint
addToModelTypeMap("91733b41-5a6e-11e7-7842-0050568c0a2f", Purpose.DECIDING,  Content.DETAILS);   // ArchiMate Project Viewpoint
addToModelTypeMap("449b2491-5a6e-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.DETAILS);   // ArchiMate Requirements Realization Viewpoint
addToModelTypeMap("85043f81-5a6e-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.DETAILS);   // ArchiMate Resource Map Viewpoint
addToModelTypeMap("137a8b31-5a6e-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.OVERVIEW);  // ArchiMate Service Realization Viewpoint
addToModelTypeMap("2fee53a1-5a6e-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.DETAILS);   // ArchiMate Stakeholder Viewpoint
addToModelTypeMap("5eb879e1-5a6e-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.DETAILS);   // ArchiMate Strategy Viewpoint
addToModelTypeMap("db8fd0e1-5a6d-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.OVERVIEW);  // ArchiMate Technology Usage Viewpoint
addToModelTypeMap("93946301-5a6d-11e7-7842-0050568c0a2f", Purpose.DESIGNING, Content.COHERENCE); // ArchiMate Technology Viewpoint
addToModelTypeMap("2e757690-4d94-11ea-653e-5048494f4e43", Purpose.DESIGNING, Content.DETAILS);   // ArchiMate Value Stream Viewpoint

// Build an array of relevant model types from the hash map.
// This is used below for pre-filtering the models to be evaluated.
var aModelTypeNums = [];
var filter = ArisData.ActiveFilter();
var iter = mapModelTypes.keySet().iterator();
while (iter.hasNext()) {
    aModelTypeNums.push(filter.UserDefinedModelTypeNum(iter.next()));
}

// Get either the selected models or the models in the selected groups
var aModels = [];
var aSelectedGroups = ArisData.getSelectedGroups();
if (aSelectedGroups.length == 0) {
    aModels = ArisData.getSelectedModels();
} else {
    for (var i in aSelectedGroups) {
        aModels = aModels.concat(aSelectedGroups[i].ModelList(true, aModelTypeNums));
    }
}

// Set the attributes at models with supported types
var nLoc = Context.getSelectedLanguage();
var nCount = 0;
for (var i in aModels) {
    var model = aModels[i];
    var attrValues = mapModelTypes.get(model.getTypeGUID());
    if (attrValues != null) {
        model.Attribute(Constants.AT_ARCHIMATE_PURPOSE, nLoc).setValue(attrValues.purpose);
        model.Attribute(Constants.AT_ARCHIMATE_CONTENT, nLoc).setValue(attrValues.content);
        nCount++;
    }
}
Dialogs.MsgBox(formatstring1(getString("TEXT_1"), nCount.toString()), Constants.MSGBOX_BTN_OK, getString("TEXT_2"));
