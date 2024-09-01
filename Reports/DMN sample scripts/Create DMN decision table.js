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
// This report creates a new child group in the selected group and in the new group 
// a DMN decision table model and fills it with some content.
//
// This script shows how to create and edit DMN decision table models using the 
// corresponding DMN-specific specific report API.
//
// This report is not available to ARIS users by default.
//
// Copyright (c) Software AG. All Rights Reserved.
//-----------------------------------------------------------------------------------

// Do not save each single change
ArisData.Save(Constants.SAVE_ONDEMAND);

// The ARIS group for which this report has been started:
var parentGroup = ArisData.getSelectedGroups()[0];

// The DMN component is the central entry point to the DMN specific report API:
var dmn = Context.getComponent("DMN");

// Create a new child group
var childGroup = parentGroup.CreateChildGroup("DMN report example", -1);

// Create a new DMN context
var dmnContext = dmn.createDmnContext(parentGroup.Database());

// Create a DMN decision table in the child group.
// Important: use model type MT_DMN_DECISION_TABLE and not MT_DMN_DECISION_TABLE_MODEL
//            which is an old type based on classic ARIS modeling instead of the new
//            DMN decision table editor
var decisionTableModel = 
        childGroup.CreateModel(Constants.MT_DMN_DECISION_TABLE, "Decision table example", -1);
                
// Get the DMN decision table interface for this model:
var decisionTable = dmn.getDecisionTable(decisionTableModel, dmnContext);

// Create some item definitions which will later be used in the table:
var customerTypeObjDef = childGroup.CreateObjDef(Constants.OT_DMN_ITEM_DEFINITION, "Customer", -1);
// Get the DMN item definition interface for this object and set some properties
var customerType = dmn.getItemDefinition(customerTypeObjDef, dmnContext);
customerType.setDatatype(Constants.DMN_FEEL_DATATYPE_STRING);
var customerTypeValues = customerType.createAllowedValues();
// The following text must be a valid FEEL expression corresponding to the specified datatype STRING
customerTypeValues.setText("\"Business\",\"Private\"");
// Store the item definition in its object
dmn.setItemDefinition(customerTypeObjDef, customerType);

var orderSizeTypeObjDef = childGroup.CreateObjDef(Constants.OT_DMN_ITEM_DEFINITION, "Order size", -1);
var orderSizeType = dmn.getItemDefinition(orderSizeTypeObjDef, dmnContext);
orderSizeType.setDatatype(Constants.DMN_FEEL_DATATYPE_STRING);
var orderSizeTypeValues = orderSizeType.createAllowedValues();
orderSizeTypeValues.setText("\"<10\",\">=10\""); 
dmn.setItemDefinition(orderSizeTypeObjDef, orderSizeType);

var discountTypeObjDef = childGroup.CreateObjDef(Constants.OT_DMN_ITEM_DEFINITION, "Discount", -1);
var discountType = dmn.getItemDefinition(discountTypeObjDef, dmnContext);
discountType.setDatatype(Constants.DMN_FEEL_DATATYPE_NUMBER);
var discountValues = discountType.createAllowedValues();
discountValues.setText("[0..0.15]");
dmn.setItemDefinition(discountTypeObjDef, discountType);

// Set some properties of the table:
decisionTable.setHitPolicy(Constants.DMN_HIT_POLICY_FIRST);

// Create two input columns
var inputs = decisionTable.getInputs();
var inputClause1 = inputs.createElement();
var inputExpression1 = inputClause1.createInputExpression();
inputExpression1.setType(customerType);

var inputClause2 = inputs.createElement();
var inputExpression2 = inputClause2.createInputExpression();
inputExpression2.setType(orderSizeType);

// Create an output column
var outputs = decisionTable.getOutputs();
var outputClause = outputs.createElement();
outputClause.setOutputDefinition(discountType);

// Create an annotation column
var annotations = decisionTable.getAnnotations();
var annotationClause = annotations.createElement();
annotationClause.setName("Remarks");

// Set the width of the annotations column
decisionTable.setColumnWidth(4, 400);

// Specify some rules
var rules = decisionTable.getRules();
var rule1 = rules.createElement();
setRuleEntries(rule1, "\"Private\"", "\"<10\"", "0", "No discount for private customers with small order size");
var rule2 = rules.createElement();
setRuleEntries(rule2, "\"Private\"", "\">=10\"", "0.05", "5% discount for private customers with large order size");
var rule3 = rules.createElement();
setRuleEntries(rule3, "\"Business\"", "\"<10\"", "0.1", "10% discount for business customers with small order size");
var rule4 = rules.createElement();
setRuleEntries(rule4, "\"Business\"", "\">=10\"", "0.15", "15% discount for business customers with large order size");

// Store the decision table in its model
var itemDefinitionObjDefs = new java.util.HashSet();
itemDefinitionObjDefs.add(customerTypeObjDef);
itemDefinitionObjDefs.add(orderSizeTypeObjDef);
itemDefinitionObjDefs.add(discountTypeObjDef);
dmn.setDecisionTable(decisionTableModel, decisionTable, itemDefinitionObjDefs);

// Save all changes
ArisData.Save(Constants.SAVE_NOW);

// Open the decision table in DMN editor
decisionTableModel.openModel();

/**
 * Fills the given rule with the given input, output and annotation values.
 *
 * The arguments input1, input2 and output must be a valid FEEL expression corresponding to the type
 * of their input or output clause.
 */
function setRuleEntries(rule, input1, input2, output, annotation) {
    var inputEntries = rule.getInputEntries();
    var inputEntry1 = inputEntries.createElement();
    inputEntry1.setText(input1);
    var inputEntry2 = inputEntries.createElement();
    inputEntry2.setText(input2);

    var outputEntries = rule.getOutputEntries();
    var outputEntry = outputEntries.createElement();
    outputEntry.setText(output);

    var annotationEntries = rule.getAnnotationEntries();
    var annotationEntry = annotationEntries.createElement();
    annotationEntry.setText(annotation);
}
