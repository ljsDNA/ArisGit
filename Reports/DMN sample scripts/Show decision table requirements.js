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
// This report identifies for the selected decision table model the decision owing
// the decision table, i.e. the decision the decision table model is assigned to, and
// analyzes the requirements of the decision.
//
// Unlike the corresponding example macro, which uses a functionality returning a
// DMN-specific structure providing all required information, the report-based
// evaluation must use the ARIS object model for collecting the required information.
// The DMN report component is not required here unless the internal structure of the
// involved decision tables and item definitions should be analyzed.
//
// This report is not available to ARIS users by default.
//
// Copyright (c) Software AG. All Rights Reserved.
//-----------------------------------------------------------------------------------

// The decision table model for which this report has been started:
var decisionTableModel = ArisData.getSelectedModels()[0];

// Get the owning decision object
var decisionObjDef = getOwningDecision(decisionTableModel);
var result;

if (decisionObjDef == null) {
    result = "Decision table '" + decisionTableModel.Name(-1) 
            + "' is not owned by a decision.";
} else {
    var informationRequirementObjDefs = getInformationRequirements(decisionObjDef);
    var requiredInputs = getRequirementsString(informationRequirementObjDefs, Constants.OT_CLST);
    var requiredDecisions = getRequirementsString(informationRequirementObjDefs, Constants.OT_BUSINESS_RULE);
    result = "Requirements of '" + decisionTableModel.Name(-1) + "'";
    result = result + "\n\nOwning decision: '" + decisionObjDef.Name(-1) + "'";
    result = result + "\n\nRequired inputs:" 
            + ((requiredInputs != "") ? requiredInputs : " <no required inputs defined>");
    result = result + "\n\nRequired decisions:" 
            + ((requiredDecisions != "") ? requiredDecisions : " <no required decisions defined>");
}
    
Dialogs.MsgBox(result);

/**
 * Returns the decision object owing the decision table.
 * This is an ARIS object of type OT_BUSINESS_RULE occurring in a model with symbol
 * ST_DMN_DECISION having the given decision table model uniquely assigned to it.
 */
function getOwningDecision(decisionTableModel) {
    var objTypes = [Constants.OT_BUSINESS_RULE];
    var superiorObjDefs = decisionTableModel.getSuperiorObjDefs(objTypes);
    
    if (superiorObjDefs.length == 0) {
        return null;
    }
    
    var owningDecision = null;
    
    for (var i = 0; i < superiorObjDefs.length; i++) {
        
        if (isDecision(superiorObjDefs[i])) {
            
            if (owningDecision != null) {
                // There is already a superior decision object. The ownership would
                // not be unique. Therefore return null:
                return null;
            }
            
            owningDecision = superiorObjDefs[i];
        }
    }
    
    return owningDecision;
}

/**
 * Checks, whether the given object has an occurrence with symbol ST_DMN_DECISION 
 * (or a symbol derived from it) in a model.
 */
function isDecision(objDef) {
    var occs = objDef.OccList();
    
    for (var i = 0; i < occs.length; i++) {
        
        if (occs[i].OrgSymbolNum() == Constants.ST_DMN_DECISION) {
            return true;
        }
    }
    
    return false;
}

/**
 * Returns all ObjDefs connected by outgoing CnxOccs of type CT_DMN_INFO_REQ to the given decision
 * in models of type MT_DMN_DECISION_REQUIREMENTS_DIAGRAM (or derived from this type).
 */
function getInformationRequirements(decisionObjDef) {
    var informationRequirementObjDefs = new java.util.HashSet();
    var objOccs = decisionObjDef.OccList();
    
    for (var i = 0; i < objOccs.length; i++) {
        
        if ((objOccs[i].Model() != null) 
                && (objOccs[i].Model().OrgModelTypeNum() == Constants.MT_DMN_DECISION_REQUIREMENTS_DIAGRAM)
                && (objOccs[i].OrgSymbolNum() == Constants.ST_DMN_DECISION)) {
            addInformationRequirements(objOccs[i], informationRequirementObjDefs);
        }
    }
    
    return informationRequirementObjDefs;
}

/**
 * Adds all ObjDefs connected by outgoing CnxOccs of type CT_DMN_INFO_REQ to the given decision
 * to the given set.
 */
function addInformationRequirements(decisionObjOcc, informationRequirementObjDefs) {
    var cxnOccs = decisionObjOcc.Cxns(Constants.EDGES_IN, Constants.EDGES_ALL);

    for (var i = 0; i < cxnOccs.length; i++) {
        
        if ((cxnOccs[i].getDefinition() != null)
                && (cxnOccs[i].getDefinition().TypeNum() == Constants.CT_DMN_INFO_REQ)
                && (cxnOccs[i].getDefinition().SourceObjDef() != null)) {
            informationRequirementObjDefs.add(cxnOccs[i].getDefinition().SourceObjDef());
        }
    }
}

/**
 * Returns a string providing all required inputs of the given decision
 */
function getRequirementsString(informationRequirementObjDefs, objType) {
    var requirements = ""
    var objDef;
    
    for (var it = informationRequirementObjDefs.iterator(); it.hasNext();) {
        objDef = it.next();
        
        if (objDef.TypeNum() != objType) {
            continue;
        }
        
        requirements = requirements + "\n- " + objDef.Name(-1) + " : " + getType(objDef);
    }
    
    return requirements;
}

/**
 * Returns a string containing the type of the given DMN DRG element (decision or
 * input data) ObjDef
 */
function getType(drgElementObjDef) {
    var itemDefinitionObjDef = getAssignedItemDefinition(drgElementObjDef);
    
    if (itemDefinitionObjDef != null) {
        return itemDefinitionObjDef.Name(-1);
    }
    
    var datatypeAttr = drgElementObjDef.Attribute(Constants.AT_FEEL_DATA_TYPE, -1);
     
    if ((datatypeAttr != null) && (datatypeAttr.getValue() != "")) {
        return datatypeAttr.getValue();
    } 
    
    var typeRefAttr = drgElementObjDef.Attribute(Constants.AT_DMN_TYPE_REF, -1);

    if ((typeRefAttr != null) && (typeRefAttr.getValue() != "")) {
        return typeRefAttr.getValue();
    }
    
    return "<no type specified>";
}

/**
 * Returns the ItemDefinition ObjDef which is connected to the given decision or
 * input data ObjDef by a connection of type CT_HAS_TYPE in a model of type
 * MT_DMN_CONTEXT_DIAGRAM which is assigned to the given ObjDef.
 */
function getAssignedItemDefinition(drgElementObjDef) {
    var itemDefinitionObjDef = null;
    var objOccs = drgElementObjDef.OccList();
    var drgElementObjOcc;
    
    for (var i = 0; i < objOccs.length; i++) {        
        drgElementObjOcc = objOccs[i];
        
        if ((drgElementObjOcc.Model() == null) 
                || (drgElementObjOcc.Model().OrgModelTypeNum() != Constants.MT_DMN_CONTEXT_DIAGRAM)
                || !isModelAssignedToDefinition(drgElementObjOcc)) {
            continue;
        }
        
        var cxnOccs = drgElementObjOcc.Cxns(Constants.EDGES_OUT, Constants.EDGES_ALL);
        
        for (var j = 0; j < cxnOccs.length; j++) {
            
            if ((cxnOccs[j].getDefinition() != null)
                    && (cxnOccs[j].getDefinition().TypeNum() == Constants.CT_HAS_TYPE)
                    && (cxnOccs[j].getTarget() != null)
                    && (cxnOccs[j].getTarget().OrgSymbolNum() == Constants.ST_DMN_ITEM_DEFINITION)
                    && (cxnOccs[j].getTarget().ObjDef() != null)) {
                        
                if ((itemDefinitionObjDef != null) && !itemDefinitionObjDef.IsEqual(cxnOccs[j].getTarget().ObjDef())) {
                    // In DMN an element cannot have more thsan one item definition as type. Therefore return null.
                    return null;
                }
                
                itemDefinitionObjDef = cxnOccs[j].getTarget().ObjDef();
            }
        }
    }
    
    return itemDefinitionObjDef;
}

/**
 * Checks for the given ObjOcc whether its model is assigned to its ObjDef
 */
function isModelAssignedToDefinition(objOcc) {

    if ((objOcc.Model() == null) || (objOcc.ObjDef() == null)) {
        return false;
    }
    
    var superiorObjDefs = objOcc.Model().getSuperiorObjDefs([objOcc.ObjDef().TypeNum()]);
    
    for (var i = 0; i < superiorObjDefs.length; i++) {
        
        if (superiorObjDefs[i].IsEqual(objOcc.ObjDef())) {
            return true;
        }
    }

    return false;
}
