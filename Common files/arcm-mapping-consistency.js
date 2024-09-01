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

 //set to true if you want to save time and are convinced that your mapping is correct
 var g_bSkipConsistencyCheck = false;

//------------------------------------------------ MASTER CHECK FUNCTION ---------------------------------------------------


function performMappingConsistencyChecks() {
    var aMessages = new Array();
    if (g_bSkipConsistencyCheck) {return aMessages;}
    
    // ---- check <mappingModel> MappingNodes and all children in recursion
    var iter = getAllMappingModels().iterator();
    while (iter.hasNext()) {
        aMessages = aMessages.concat( performMappingModelNodeChecks(iter.next()) );
    }
    
    // ---- check <mappingEnum> MappingNodes and all children in recursion
    var iter = getAllMappingEnums().iterator();
    while (iter.hasNext()) {
        aMessages = aMessages.concat( performMappingEnumNodeChecks(iter.next()) );
    }
    
    // ---- check <mappingObject> MappingNodes and all children in recursion
    var iter = getAllMappingObjects().iterator();
    while (iter.hasNext()) {
        aMessages = aMessages.concat( performMappingObjectNodeChecks(iter.next()) );
    }
    
    return aMessages;
}


//-------------------------------------------------- NODE BASED CHECKS -----------------------------------------------------


function performMappingModelNodeChecks(p_oMappingModelNode) {
    var aMessages = new Array();
    
    // ---- check <mappingModel> MappingNode
    // all defined attributes and children allowed check (recursive)
    aMessages = aMessages.concat( hasOnlyAllowedAttributesAndChildren(p_oMappingModelNode) );
    
    // mandatory attributes at <mappingModel> MappingNode
    aMessages = aMessages.concat( isMandatoryAttributeValueSet(p_oMappingModelNode, "id") );
    aMessages = aMessages.concat( isMandatoryAttributeValueSet(p_oMappingModelNode, "model_typenums") );
    aMessages = aMessages.concat( isMandatoryAttributeValueSet(p_oMappingModelNode, "mapping_object_refs") );
    // model type num check
    var sConcatenatedModelTypeNums = p_oMappingModelNode.getAttributeValue("model_typenums");
    aMessages = aMessages.concat( areModelTypeNumsResolvable(p_oMappingModelNode, sConcatenatedModelTypeNums) );
    // mapping object references check
    var sReferencedMappingObjectIDs = p_oMappingModelNode.getAttributeValue("mapping_object_refs");
    aMessages = aMessages.concat( areMappingObjectReferencesValid(p_oMappingModelNode, sReferencedMappingObjectIDs) );
    
    // ---- check subordinated <exportRelevanceCondition> MappingNodes
    var iter = p_oMappingModelNode.getChildren("exportRelevanceCondition").iterator();
    while (iter.hasNext()) {
        aMessages = aMessages.concat( performConditionNodeChecks(iter.next(), null) );
    }
    
    return aMessages;
}


function performMappingEnumNodeChecks(p_oMappingEnumNode) {
    var aMessages = new Array();

    // all defined attributes and children allowed check (recursive)
    aMessages = aMessages.concat( hasOnlyAllowedAttributesAndChildren(p_oMappingEnumNode) );
    
    // mandatory attributes
    aMessages = aMessages.concat( isMandatoryAttributeValueSet(p_oMappingEnumNode, "arcm_enum") );
    aMessages = aMessages.concat( isMandatoryAttributeValueSet(p_oMappingEnumNode, "is_multiple") );
    // attribute "is_multiple" must be "true" / "false"
    aMessages = aMessages.concat( hasAttributeValueTrueOrFalse(p_oMappingEnumNode, "is_multiple") );
    
    // ---- check subordinated <enumItem> MappingNodes
    var arisEnumID = p_oMappingEnumNode.getAttributeValue("aris_enum");
    var arcmEnumID = p_oMappingEnumNode.getAttributeValue("arcm_enum");
    var isMultipleValue = p_oMappingEnumNode.getAttributeValue("is_multiple");
    var iter = p_oMappingEnumNode.getChildren("enumItem").iterator();
    while (iter.hasNext()) {
        var oEnumItemMappingNode = iter.next();
        // mandatory attributes at <enumItem> MappingNode
        aMessages = aMessages.concat( isMandatoryAttributeValueSet(oEnumItemMappingNode, "id") );
        aMessages = aMessages.concat( isMandatoryAttributeValueSet(oEnumItemMappingNode, "aris_typenum") );
        
        //for all <mappingEnums> except "userrole_type" and "userrole_level" the enum item aris_typenums must be resolvable
        var sAttributeTypeNum = oEnumItemMappingNode.getAttributeValue("aris_typenum");
        if (sAttributeTypeNum != null && sAttributeTypeNum != ""
            && arisEnumID != "userrole_type" && arcmEnumID != "userrole_type" && arisEnumID != "userrole_level" && arcmEnumID != "userrole_level") {  
            if (isMultipleValue == "true") {
                //Constants.ABT_BOOL == IAttrBaseTypeTblNum.ABT_BOOL
                if (ArisData.ActiveFilter().AttrBaseType(getAttributeTypeNum(sAttributeTypeNum)) != Constants.ABT_BOOL) {
                    aMessages.push("Enum item is part of a multi enum mapping but '" + sAttributeTypeNum + "' as value for 'aris_typenum' does not point at an ARIS boolean attribute." + createNodeInfoAppendix(oEnumItemMappingNode));
                }
            }
            if (isMultipleValue == "false") {
                //we do a simple check here only if the AVT value can be resolved - the specific check if AVT value and value attribute match is done in function isAttributeTypeCompatibleWithARISAttribute()
                if (getAttributeTypeNum(sAttributeTypeNum) == -1) {
                    aMessages.push("Enum item is part of a single enum mapping but '" + sAttributeTypeNum + "' as value for 'aris_typenum' is no resolvable value attribute value." + createNodeInfoAppendix(oEnumItemMappingNode));
                }
            }
        }
        
    }

    return aMessages;
}


function performMappingObjectNodeChecks(p_oMappingObjectNode) {
    var aMessages = new Array();

    // ---- check <mappingObject> MappingNode
    // all defined attributes and children allowed check (recursive)
    aMessages = aMessages.concat( hasOnlyAllowedAttributesAndChildren(p_oMappingObjectNode) );
    
    // mandatory attributes
    aMessages = aMessages.concat( isMandatoryAttributeValueSet(p_oMappingObjectNode, "id") );
    aMessages = aMessages.concat( isMandatoryAttributeValueSet(p_oMappingObjectNode, "arcm_objtype") );
    aMessages = aMessages.concat( isMandatoryAttributeValueSet(p_oMappingObjectNode, "aris_typenum") );
    // check "aris_typenum" value
    var sConcatenatedObjectTypeNums = p_oMappingObjectNode.getAttributeValue("aris_typenum");
    aMessages = aMessages.concat( areObjectTypeNumsResolvable(p_oMappingObjectNode, sConcatenatedObjectTypeNums) );
    // check "aris_symbolnum" value
    var sConcatenatedSymbolTypeNums = p_oMappingObjectNode.getAttributeValue("aris_symbolnum");
    aMessages = aMessages.concat( areSymbolTypeNumsResolvable(p_oMappingObjectNode, sConcatenatedSymbolTypeNums) );
    // attribute references checks
    var sConcatenatedMappingAttrReferenceIDs = p_oMappingObjectNode.getAttributeValue("mapping_by_referenced_attributes_value_equality");
    aMessages = aMessages.concat( areMappingAttrReferencesValid(p_oMappingObjectNode, "mapping_by_referenced_attributes_value_equality", sConcatenatedMappingAttrReferenceIDs, p_oMappingObjectNode) );
    var sConcatenatedMappingAttrReferenceIDs = p_oMappingObjectNode.getAttributeValue("ignore_if_referenced_attributes_not_filled");
    aMessages = aMessages.concat( areMappingAttrReferencesValid(p_oMappingObjectNode, "ignore_if_referenced_attributes_not_filled", sConcatenatedMappingAttrReferenceIDs, p_oMappingObjectNode) );
    // root mappingObject reference
    var sReferencedMappingObjectIDs = p_oMappingObjectNode.getAttributeValue("root_mapping_object_ref");
    aMessages = aMessages.concat( areMappingObjectReferencesValid(p_oMappingObjectNode, sReferencedMappingObjectIDs) );
    
    
    // ---- check subordinated <mappingAttr> MappingNodes
    var attrMappingNodeIter = p_oMappingObjectNode.getChildren("mappingAttr").iterator();
    while (attrMappingNodeIter.hasNext()) {
        var aAttrMappingNode = attrMappingNodeIter.next();
        // mandatory attributes at <mappingAttr> MappingNode
        aMessages = aMessages.concat( isMandatoryAttributeValueSet(aAttrMappingNode, "id") );
        aMessages = aMessages.concat( isMandatoryAttributeValueSet(aAttrMappingNode, "type") );
        aMessages = aMessages.concat( isMandatoryAttributeValueSet(aAttrMappingNode, "aris_typenum") );
        //check if "type" and "aris_typenum" match
        var sType = aAttrMappingNode.getAttributeValue("type");
        var sAttributeTypeNum = aAttrMappingNode.getAttributeValue("aris_typenum");
        aMessages = aMessages.concat( isAttributeTypeCompatibleWithARISAttribute(aAttrMappingNode, "type", sType, "aris_typenum", sAttributeTypeNum) );
        //check "default_value" value
        var sDefaultValue = aAttrMappingNode.getAttributeValue("default_value");
        if (sDefaultValue != null && sType != null) {
            aMessages = aMessages.concat( isAttributeValueCompatibleWithType(aAttrMappingNode, "default_value", sDefaultValue, sType) );
        }
    }
    
    // ---- check subordinated <mappingLink> MappingNodes
    var linkMappingNodeIter = p_oMappingObjectNode.getChildren("mappingLink").iterator();
    while (linkMappingNodeIter.hasNext()) {
        var aLinkMappingNode = linkMappingNodeIter.next()
        // mandatory attributes at <mappingAttr> MappingNode
        aMessages = aMessages.concat( isMandatoryAttributeValueSet(aLinkMappingNode, "id") );
        aMessages = aMessages.concat( isMandatoryAttributeValueSet(aLinkMappingNode, "mapping_object_ref") );
        // check mappingObject reference
        var sReferencedMappingObjectID = aLinkMappingNode.getAttributeValue("mapping_object_ref");
        var aReferenceMappingObjectMessages = areMappingObjectReferencesValid(aLinkMappingNode, sReferencedMappingObjectID)  
        aMessages = aMessages.concat( aReferenceMappingObjectMessages );
        var oReferencedMappingObject = null;
        var bVirtualMappingObjectReferenced = false;
        if (aReferenceMappingObjectMessages.length == 0) {
            oReferencedMappingObject = getMappingObjectByID(sReferencedMappingObjectID);
            bVirtualMappingObjectReferenced = oReferencedMappingObject.getAttributeValue("aris_typenum") == "VIRTUAL";
        }
        // check "aris_typenum" value
        var sConnectionTypeNum = aLinkMappingNode.getAttributeValue("aris_typenum");
        if (sConnectionTypeNum != null) {
            if (getConnectionTypeNum(sConnectionTypeNum) == -1) {
                aMessages.push("The connection type '" + sConnectionTypeNum + "' as value for 'aris_typenum' is unknown." + createNodeInfoAppendix(aLinkMappingNode));
            }
        } else {
            if (!bVirtualMappingObjectReferenced) {
                aMessages.push("The connection type 'aris_typenum' must be set if the target mapping object is has not the type 'VIRTUAL'." + createNodeInfoAppendix(aLinkMappingNode));
            }
        }
        // check "direction" value
        var sDirections = aLinkMappingNode.getAttributeValue("direction");
        if (sDirections != null) {
            var aSplittedDirectionStrings = sDirections.split("|");
            for (var d=0; d<aSplittedDirectionStrings.length; d++) {
                if (!arrayContainsValue(["out", "assign_out", "in", "assign_in"], aSplittedDirectionStrings[d].trim())) {
                    aMessages.push("The value for connection 'direction' is '" + aSplittedDirectionStrings[d] + "' but can only be one or a combination of 'out', 'assign_out', 'in' and 'assign_in', concatenated by '|'." + createNodeInfoAppendix(aLinkMappingNode));
                }
            }
        } else {
            if (!bVirtualMappingObjectReferenced) {
                aMessages.push("The connection 'direction' must be set if the target mapping object is has not the type 'VIRTUAL'." + createNodeInfoAppendix(aLinkMappingNode));
            }
        }
        // check the "true" / "false" attributes
        aMessages = aMessages.concat( hasAttributeValueTrueOrFalse(aLinkMappingNode, "is_hierarchical") );
        aMessages = aMessages.concat( hasAttributeValueTrueOrFalse(aLinkMappingNode, "is_top_down_reverse") );
        aMessages = aMessages.concat( hasAttributeValueTrueOrFalse(aLinkMappingNode, "inherit_export_relevance") );
        aMessages = aMessages.concat( hasAttributeValueTrueOrFalse(aLinkMappingNode, "restrict_assignment_connections") );
        aMessages = aMessages.concat( hasAttributeValueTrueOrFalse(aLinkMappingNode, "cycle_link") );
        aMessages = aMessages.concat( hasAttributeValueTrueOrFalse(aLinkMappingNode, "condition_relevant_only") );
        // check "merge_link_mapping_attribute_refs" value
        var sConcatenatedMergeLinkMappingAttrReferenceIDs = aLinkMappingNode.getAttributeValue("merge_link_mapping_attribute_refs");
        if (sConcatenatedMergeLinkMappingAttrReferenceIDs != null && oReferencedMappingObject != null) {
            aMessages = aMessages.concat( areMappingLinkReferencesValid(aLinkMappingNode, "merge_link_mapping_attribute_refs", sConcatenatedMergeLinkMappingAttrReferenceIDs, oReferencedMappingObject) );
        }
        // check "sort_method" value
        var sSortMethod = aLinkMappingNode.getAttributeValue("sort_method");
        if (sSortMethod != null && !arrayContainsValue(["sort_by_xy_position", "sort_by_yx_position", "sort_by_occ_distance"], sSortMethod)) {
            aMessages.push("The 'sort_method' has value '" + sSortMethod + "' but must be one of the values 'sort_by_xy_position', 'sort_by_yx_position' or 'sort_by_occ_distance'." + createNodeInfoAppendix(aLinkMappingNode));
        }
        
        // ---- check subordinated <linkCondition> MappingNodes
        var iter = aLinkMappingNode.getChildren("linkCondition").iterator();
        while (iter.hasNext()) {
            aMessages = aMessages.concat( performConditionNodeChecks(iter.next(), p_oMappingObjectNode) );
        }
        // ---- check subordinated <linkTargetCondition> MappingNodes
        var iter = aLinkMappingNode.getChildren("linkTargetCondition").iterator();
        while (iter.hasNext()) {
            aMessages = aMessages.concat( performLinkTargetNodeChecks(iter.next(), p_oMappingObjectNode, aLinkMappingNode) );
        }
    }
    
    // ---- check subordinated <mappingCondition> MappingNodes
    var iter = p_oMappingObjectNode.getChildren("mappingCondition").iterator();
    while (iter.hasNext()) {
        aMessages = aMessages.concat( performConditionNodeChecks(iter.next(), p_oMappingObjectNode) );
    }
    // ---- check subordinated <exportRelevanceCondition> MappingNodes
    var iter = p_oMappingObjectNode.getChildren("exportRelevanceCondition").iterator();
    while (iter.hasNext()) {
        aMessages = aMessages.concat( performConditionNodeChecks(iter.next(), p_oMappingObjectNode) );
    }
    // ---- check subordinated <validate> MappingNodes
    var iter = p_oMappingObjectNode.getChildren("validate").iterator();
    while (iter.hasNext()) {
        aMessages = aMessages.concat( performValidateNodeChecks(iter.next(), p_oMappingObjectNode) );
    }
        
    return aMessages;
}


function performConditionNodeChecks(p_oConditionNode, p_oSourceMappingObjectNode) {
    var aMessages = new Array();
    
    //hasOnlyAllowedAttributesAndChildren already done during recursion for <mappingObject> and <mappingModel> nodes
    bIsValidationNode = p_oConditionNode.getOriginNodeName() == "validate";
    
    //now the complicated stuff...
    var sOperator = p_oConditionNode.getAttributeValue("operator");
    var sMappingAttributeIDRef = p_oConditionNode.getAttributeValue("mapping_attribute_ref");
    var sType = p_oConditionNode.getAttributeValue("type");
    var sArisTypeNum = p_oConditionNode.getAttributeValue("aris_typenum");
    var sMode = p_oConditionNode.getAttributeValue("mode");
    var sValue = p_oConditionNode.getAttributeValue("value");
    var sMinValue = p_oConditionNode.getAttributeValue("min_value");
    var sMaxValue = p_oConditionNode.getAttributeValue("max_value");
    var sMappingLinkIDRef = p_oConditionNode.getAttributeValue("mapping_link_ref");
    // the following attributes are only allowed for <validate> nodes
    var sComparisonMappingAttributeIDRef        = (bIsValidationNode) ? p_oConditionNode.getAttributeValue("comparison_mapping_attribute_ref") : null;
    var sComparisonType                         = (bIsValidationNode) ? p_oConditionNode.getAttributeValue("comparison_type") : null;
    var sComparisonArisTypeNum                  = (bIsValidationNode) ? p_oConditionNode.getAttributeValue("comparison_aris_typenum") : null;
    var sComparisonMappingLinkIDRef             = (bIsValidationNode) ? p_oConditionNode.getAttributeValue("comparison_mapping_link_ref") : null;
    var sComparisonRecursiveMappingLinkIDRef    = (bIsValidationNode) ? p_oConditionNode.getAttributeValue("comparison_recursive_mapping_link_ref") : null;
    
    // helper booleans for the condition configuration
    var bOperatorSet = sOperator != null;
    var bAttributeRefSetStatic = (sType != null && sArisTypeNum != null);
    var bAttributeRefSetMapping = sMappingAttributeIDRef != null;
    var bAttributeRefSet = bAttributeRefSetStatic || bAttributeRefSetMapping;
    var bLinkRefSet = sMappingLinkIDRef != null;
    var bValueSet = sValue != null;
    var bMinMaxValuesSet = sMinValue != null || sMaxValue != null;
    var bComparisonAttributeRefSetStatic = (sComparisonType != null && sComparisonArisTypeNum != null);
    var bComparisonAttributeRefSetMapping = sComparisonMappingAttributeIDRef != null;
    var bComparisonAttributeRefSet = bComparisonAttributeRefSetStatic || bComparisonAttributeRefSetMapping;
    var bComparisonLinkRefSet = sComparisonMappingLinkIDRef != null;
    
    var bSimpleAttributeCondition = bAttributeRefSet && !bLinkRefSet && !bComparisonAttributeRefSet && !bComparisonLinkRefSet
                                    && !bValueSet && !bMinMaxValuesSet; 
    var bSimpleValueCondition = bAttributeRefSet && !bLinkRefSet && !bComparisonAttributeRefSet && !bComparisonLinkRefSet
                                && bValueSet && !bMinMaxValuesSet;
    var bSimpleMinMaxValueCondition = bAttributeRefSet && !bLinkRefSet && !bComparisonAttributeRefSet && !bComparisonLinkRefSet
                                      && !bValueSet && bMinMaxValuesSet;
    var bSimpleLinkCondition =  !bAttributeRefSet && bLinkRefSet && !bComparisonAttributeRefSet && !bComparisonLinkRefSet
                                && !bValueSet && bMinMaxValuesSet; 
    
    var bComparisonAttributeCondition = bAttributeRefSet && !bLinkRefSet && bComparisonAttributeRefSet && !bComparisonLinkRefSet
                                        && !bValueSet && !bMinMaxValuesSet;
    var bComparisonLinkTargetAttributesCondition =  bAttributeRefSet && !bLinkRefSet && bComparisonAttributeRefSet && bComparisonLinkRefSet
                                                    && !bValueSet && !bMinMaxValuesSet; //for each target via link a separate bComparisonAttributeCondition is evaluated
    
    
    // ---- part for all operator condition nodes ----
    
    // operator checks
    if (bOperatorSet) {
        if (!arrayContainsValue(["AND", "OR"], sOperator)) {
            aMessages.push("Condition operator '" + sOperator + "' is invalid - allowed values are 'AND' and 'OR'." + createNodeInfoAppendix(p_oConditionNode));
        }
        if (bAttributeRefSet || bLinkRefSet || bValueSet || bMinMaxValuesSet || bComparisonAttributeRefSet || bComparisonLinkRefSet) {
            aMessages.push("Any condition where operator is set is not allowed to have other condition attributes set." + createNodeInfoAppendix(p_oConditionNode));
        }
        if (p_oConditionNode.getChildren("condition").size() == 0) {
            aMessages.push("Any condition where operator is set must at least have have one child <condition> element." + createNodeInfoAppendix(p_oConditionNode));
        }
        return aMessages;
    }
    
    // ---- part for all non-operator condition nodes ----
    
    //all non-operator conditions except <validate> are not allowed to have subordinated <condition> nodes
    if (p_oConditionNode.getOriginNodeName() != "validate" && p_oConditionNode.getChildren("condition").size() > 0) {
        aMessages.push("Child <condition> elements are only allowed inside operator condition elements and <validate> elements." + createNodeInfoAppendix(p_oConditionNode));
    }
    
    // for all non-operator conditions check mandatory attribute "mode" at condition
    aMessages = aMessages.concat( isMandatoryAttributeValueSet(p_oConditionNode, "mode") );
    
    // in case an attribute reference is set then check if it is done by either "mapping_attribute_ref" or the combination of "type"/"aris_typenum" is set
    if (bAttributeRefSetStatic && bAttributeRefSetMapping) {
        aMessages.push("Condition attribute reference is ambiguous - both 'mapping_attribute_ref' and the combination of 'type' / 'aris_typenum' are set." + createNodeInfoAppendix(p_oConditionNode));
    }
    
    // check that either an attribute reference or link reference is set
    if (!bAttributeRefSet && !bLinkRefSet) {
        aMessages.push("Condition reference is not set - either 'mapping_link_ref', 'mapping_attribute_ref' or the combination of 'type' / 'aris_typenum' must be set." + createNodeInfoAppendix(p_oConditionNode));
    }
    // check that not both an attribute reference and link reference are set at the same time
    if (bAttributeRefSet && bLinkRefSet) {
        aMessages.push("Condition reference is ambiguous - both 'mapping_link_ref' and 'mapping_attribute_ref' or the combination of 'type' / 'aris_typenum' are set." + createNodeInfoAppendix(p_oConditionNode));
    }
    
    // if the condition explicitly references "type" and "aris_typenum" then check if these two parameters match
    aMessages = aMessages.concat( isAttributeTypeCompatibleWithARISAttribute(p_oConditionNode, "type", sType, "aris_typenum", sArisTypeNum) );
    
    // check "mapping_link_ref" value
    var bMappingAttrRefPointsToMappingLink = false;
    if (sMappingLinkIDRef != null) {
		//condition relates to a <mappingModel>
		if (p_oSourceMappingObjectNode == null) {
			aMessages.push("Link references by 'mapping_link_ref' are not allowed for <mappingModel> entries." + createNodeInfoAppendix(p_oConditionNode));
		}
		//condition relates to a <mappingObject>
		else {
			var aNoLinkRefMessage = areMappingLinkReferencesValid(p_oConditionNode, "mapping_link_ref", sMappingLinkIDRef, p_oSourceMappingObjectNode);
			bMappingAttrRefPointsToMappingLink = aNoLinkRefMessage.length == 0;
			if (!bMappingAttrRefPointsToMappingLink) {
				aMessages.push("Referenced link '" + sMappingLinkIDRef + "' unknown at mapping object '" + p_oSourceMappingObjectNode.getAttributeValue("id") + "'." + createNodeInfoAppendix(p_oConditionNode));
			}
		}
    }
    
    // check "mapping_attribute_ref" value
    var bMappingAttrRefPointsToMappingAttr = false;
    if (sMappingAttributeIDRef != null) {
        //condition relates to a <mappingModel>
		if (p_oSourceMappingObjectNode == null) {
			aMessages.push("Attribute references by 'mapping_attribute_ref' are not allowed for <mappingModel> entries." + createNodeInfoAppendix(p_oConditionNode));
		} 
		//condition relates to a <mappingObject>
		else {
			var aNoAttrRefMessage = areMappingAttrReferencesValid(p_oConditionNode, "mapping_attribute_ref", sMappingAttributeIDRef, p_oSourceMappingObjectNode);
			bMappingAttrRefPointsToMappingAttr = aNoAttrRefMessage.length == 0;
			if (!bMappingAttrRefPointsToMappingAttr) {
				aMessages.push("Referenced attribute '" + sMappingAttributeIDRef + "' unknown at mapping object '" + p_oSourceMappingObjectNode.getAttributeValue("id") + "'." + createNodeInfoAppendix(p_oConditionNode)); //neither referencing an attr nor a link
			}
		}
    }
    // in case "mapping_attribute_ref" is set then resolve the type of the references attribute for the following checks
    var sResolvedType = sType;
    if (sResolvedType == null) {
        //"mapping_attribute_ref" points at a <mappingAttr>
        if (bMappingAttrRefPointsToMappingAttr) {
            var oAttrMappingNode = getMappingAttr(p_oSourceMappingObjectNode, sMappingAttributeIDRef);
            if (oAttrMappingNode != null) {
                sResolvedType = oAttrMappingNode.getAttributeValue("type");
            }
        }
    }
    if (sResolvedType == null && !bMappingAttrRefPointsToMappingLink) {
        aMessages.push("The type of the referenced attribute is unknown." + createNodeInfoAppendix(p_oConditionNode));
    }
    
    // check "mode"
    if (!arrayContainsValue(["ISNOTNULL", "EQ", "NEQ", "GE", "GT", "LE", "LT", "CONTAINS", "CONTAINSNOT", "RANGE", "COUNT", "COUNT_BACK", "PROCESSINGTIME"], sMode)) {
        aMessages.push("The condition mode '" + sMode + "' is unknown." + createNodeInfoAppendix(p_oConditionNode)); //unknown mode
    } else {
        // check if "mode" value is compatible with sResolvedType 
        if (arrayContainsValue(["GE", "GT", "LE", "LT", "RANGE"], sMode)
            && !arrayContainsValue(["Number", "Double", "Date"], sResolvedType)) {
            aMessages.push("The condition mode '" + sMode + "' is only allowed for attribute references of type 'Number', 'Double' or 'Date'." + createNodeInfoAppendix(p_oConditionNode));
        }
        if (arrayContainsValue(["CONTAINS", "CONTAINSNOT"], sMode)
            && !arrayContainsValue(["String", "Text"], sResolvedType) && sResolvedType != null && !sResolvedType.startsWith("Enum_")) {
            aMessages.push("The condition mode '" + sMode + "' is only allowed for attribute references of type 'String', 'Text' or 'Enum'." + createNodeInfoAppendix(p_oConditionNode));
        }
        if (arrayContainsValue(["CONTAINS", "CONTAINSNOT"], sMode) && sResolvedType.startsWith("Enum_") && bValueSet && sValue.indexOf(",") != -1) {
            var oMappingEnumNode = getMappingEnum(new String(sResolvedType).substring(5));
            if (oMappingEnumNode != null && oMappingEnumNode.getAttributeValue("is_multiple") == "false") {
                aMessages.push("The condition mode '" + sMode + "' does not here because the attribute references a type 'Enum' which is not multiple and the static 'value' contains several enum items. Use mode 'EQ' or 'NEQ' instead." + createNodeInfoAppendix(p_oConditionNode));
            }
        }
        if (arrayContainsValue(["COUNT", "COUNT_BACK"], sMode)
            && !bSimpleLinkCondition) {
            aMessages.push("The condition mode '" + sMode + "' is only allowed for link references." + createNodeInfoAppendix(p_oConditionNode));
        }
        if (arrayContainsValue(["PROCESSINGTIME"], sMode)
            && (p_oSourceMappingObjectNode == null || p_oSourceMappingObjectNode.getAttributeValue("id") != "AUDITSTEPTEMPLATE")) {
            aMessages.push("The condition mode 'PROCESSINGTIME' is a special case for <mappingObject> 'AUDITSTEPTEMPLATE' only." + createNodeInfoAppendix(p_oConditionNode));
        }
        // check if "mode" value is compatible with condition configuration
        if (arrayContainsValue(["ISNOTNULL", "PROCESSINGTIME"], sMode) && !bSimpleAttributeCondition) {
            aMessages.push("The condition mode '" + sMode + "' is only allowed if neither attribute, link or comparison values nor references are set." + createNodeInfoAppendix(p_oConditionNode));
        }
        if (arrayContainsValue(["EQ", "NEQ", "GE", "GT", "LE", "LT", "CONTAINS", "CONTAINSNOT"], sMode) && !bSimpleValueCondition && !bComparisonAttributeCondition && !bComparisonLinkTargetAttributesCondition) {
            if (bIsValidationNode) {
                aMessages.push("The condition mode '" + sMode + "' is only allowed for attribute references comparisons against a static 'value' or an other comparison attribute reference." + createNodeInfoAppendix(p_oConditionNode));
            } else {
                aMessages.push("The condition mode '" + sMode + "' is only allowed for attribute references comparisons against a static 'value'." + createNodeInfoAppendix(p_oConditionNode));
            }
        }
        if (arrayContainsValue(["RANGE"], sMode) && !bSimpleMinMaxValueCondition) {
            aMessages.push("The condition mode '" + sMode + "' can only be used when specifying a static 'minValue' and/or 'maxValue'." + createNodeInfoAppendix(p_oConditionNode));
        }
        if (arrayContainsValue(["COUNT", "COUNT_BACK"], sMode) && !bSimpleLinkCondition) {
            aMessages.push("The condition mode '" + sMode + "' can only be used when referencing an link with 'mapping_link_ref'." + createNodeInfoAppendix(p_oConditionNode));
        }
		if (arrayContainsValue(["COUNT", "COUNT_BACK"], sMode) && sMinValue == null && sMaxValue == null) {
            aMessages.push("The condition mode '" + sMode + "' can only be used when specifying a static 'minValue' and/or 'maxValue'." + createNodeInfoAppendix(p_oConditionNode));
        }
    }
    
    // check if "min_value" value was correctly used
    if (sMinValue != null) {
        if (!arrayContainsValue(["RANGE", "COUNT", "COUNT_BACK"], sMode)) {
            aMessages.push("The condition mode '" + sMode + "' does not allow a min value." + createNodeInfoAppendix(p_oConditionNode)); //"min_Value" only allowed with the modes "RANGE", "COUNT" or "COUNT_BACK"
        }
        //"min_value" must be parseable for sResolvedType
        aMessages = aMessages.concat( isAttributeValueCompatibleWithType(p_oConditionNode, "min_value", sMinValue, sResolvedType) );
    }
    // check if "max_value" value was correctly used
    if (sMaxValue != null) {
        if (!arrayContainsValue(["RANGE", "COUNT", "COUNT_BACK"], sMode)) {
            aMessages.push("The condition mode '" + sMode + "' does not allow a max value." + createNodeInfoAppendix(p_oConditionNode)); //"max_Value" only allowed with the modes "RANGE", "COUNT" or "COUNT_BACK"
        }
        //"max_value" must be parseable for sResolvedType
        aMessages = aMessages.concat( isAttributeValueCompatibleWithType(p_oConditionNode, "max_value", sMaxValue, sResolvedType) );
    }
    
    // check if "value" was correctly used
    if (bValueSet) {
		if (!bSimpleValueCondition) {
			aMessages.push("The static 'value' can only be set if an attribute reference and no comparison references are set." + createNodeInfoAppendix(p_oConditionNode));
		}
		else {
			//"value" must be parseable for sResolvedType
			aMessages = aMessages.concat( isAttributeValueCompatibleWithType(p_oConditionNode, "value", sValue, sResolvedType) );
        }
    }
    
    //we are done for non-<validate> nodes here
    if (!bIsValidationNode) {
        return aMessages;
    }
	//also ignore <validate> nodes which are illegally specified at <mappingModels>
    if (p_oSourceMappingObjectNode == null) {
        return aMessages;
    }
    
    // ---- part for <validate> only - handling comparisons ----

    // check "comparison_mapping_link_ref" value
    var bComparisonMappingLinkRefPointsToMappingLink = false;
    if (sComparisonMappingLinkIDRef != null) {
        // check that it refers to a mapping link of source mappingObject
        var aNoLinkRefMessage = areMappingLinkReferencesValid(p_oConditionNode, "comparison_mapping_link_ref", sComparisonMappingLinkIDRef, p_oSourceMappingObjectNode);
        bComparisonMappingLinkRefPointsToMappingLink = aNoLinkRefMessage.length == 0;
        if (!bComparisonMappingLinkRefPointsToMappingLink) {
            aMessages = aMessages.concat(aNoLinkRefMessage);
        }
    }
    
    //check "comparison_mapping_attribute_ref" value
    var bComparisonMappingAttrRefPointsToMappingAttr = false;
    var oComparisonMappingObjectNode = null;
    if (sComparisonMappingAttributeIDRef != null) {
        if (sComparisonMappingLinkIDRef == null) {
            var aNoAttrRefMessage = areMappingAttrReferencesValid(p_oConditionNode, "comparison_mapping_attribute_ref", sComparisonMappingAttributeIDRef, p_oSourceMappingObjectNode);
            bComparisonMappingAttrRefPointsToMappingAttr = aNoAttrRefMessage.length == 0;
            aMessages = aMessages.concat( aNoAttrRefMessage );
            oComparisonMappingObjectNode = p_oSourceMappingObjectNode;
        }
        // if "comparison_mapping_link_ref" is set and pointing correctly to a link then "comparison_mapping_attribute_ref" must point at a <mappingAttr> on the target <mappingObject> MappingNode of the referenced link
        else if (bComparisonMappingLinkRefPointsToMappingLink) {
            var oComparisonMappingLink = getMappingLink(p_oSourceMappingObjectNode, sComparisonMappingLinkIDRef);
            var sComparisonMappingObjectID = oComparisonMappingLink.getAttributeValue("mapping_object_ref");
            oComparisonMappingObjectNode = getMappingObjectByID(sComparisonMappingObjectID);
            var aNoAttrRefMessage = areMappingAttrReferencesValid(p_oConditionNode, "comparison_mapping_attribute_ref", sComparisonMappingAttributeIDRef, oComparisonMappingObjectNode);
            bComparisonMappingAttrRefPointsToMappingAttr = aNoAttrRefMessage.length == 0;
            aMessages = aMessages.concat( aNoAttrRefMessage );
        }
    }
    
    //check "comparison_recursive_mapping_link_ref" value
    if (sComparisonRecursiveMappingLinkIDRef != null) {
        if (!bComparisonLinkRefSet || !bComparisonAttributeRefSetMapping) {
            if (!bComparisonLinkRefSet) {
                aMessages.push("The validation attribute 'comparison_recursive_mapping_link_ref' is only allowed to be set if the attribute 'comparison_mapping_link_ref' is set as well." + createNodeInfoAppendix(p_oConditionNode));
            }
            if (!bComparisonAttributeRefSetMapping) {
                aMessages.push("The validation attribute 'comparison_recursive_mapping_link_ref' is only allowed to be set if the attribute 'comparison_mapping_attribute_ref' is set as well." + createNodeInfoAppendix(p_oConditionNode));
            }
        }
        // oComparisonMappingObjectNode should defined here if settings for "sComparisonMappingAttributeIDRef" and "sComparisonMappingLinkIDRef" were correct, otherwise skip this check
        else if (oComparisonMappingObjectNode != null) {
            var sComparisonMappingObjectID = oComparisonMappingObjectNode.getAttributeValue("id");
            var oRecursiveMappingLinkNode = getMappingLink(oComparisonMappingObjectNode, sComparisonRecursiveMappingLinkIDRef);
            if (oRecursiveMappingLinkNode == null) {
                aMessages.push("Mapping object '" + sComparisonMappingObjectID + "' has no mapping link with ID '" + sComparisonRecursiveMappingLinkIDRef + "' which is referenced by attribute 'comparison_recursive_mapping_link_ref'." + createNodeInfoAppendix(p_oConditionNode));
            }
            else {
                var sRecursiveComparisonMappingObjectID = oRecursiveMappingLinkNode.getAttributeValue("mapping_object_ref");
                if (sComparisonMappingObjectID != sRecursiveComparisonMappingObjectID) {
                    aMessages.push("Mapping mapping link with ID '" + sComparisonRecursiveMappingLinkIDRef + "' which is referenced by attribute 'comparison_recursive_mapping_link_ref' must refer to mapping object '" + sComparisonMappingObjectID + "' but refers to '" + sRecursiveComparisonMappingObjectID + "' instaed." + createNodeInfoAppendix(p_oConditionNode));
                }
            }
        }
    }
    
    // in case an comparison attribute reference is set then check if it is done by either "comparison_mapping_attribute_ref" or the combination of "comparison_type"/"comparison_aris_typenum" is set
    if (bComparisonAttributeRefSetStatic && bComparisonAttributeRefSetMapping) {
        aMessages.push("Condition comparison attribute reference is ambiguous - both 'comparison_mapping_attribute_ref' and the combination of 'comparison_type' / 'comparison_aris_typenum' are set." + createNodeInfoAppendix(p_oConditionNode));
    }
    
    // if the condition explicitly references "comparison_type" and "comparison_aris_typenum" then check if these two parameters match
    aMessages = aMessages.concat(isAttributeTypeCompatibleWithARISAttribute(p_oConditionNode, "comparison_type", sComparisonType, "comparison_aris_typenum", sComparisonArisTypeNum) );
    
    // check if resolved attribute type and resolved comparison attribute type are the same (only if comparison attribute type is set)
    var sResolvedComparisonType = sComparisonType;
    if (sResolvedComparisonType == null && sComparisonArisTypeNum != null) {
        var oAttrMappingNode = getMappingAttr(oComparisonMappingObjectNode, sComparisonArisTypeNum);
        if (oAttrMappingNode != null) {
            sResolvedComparisonType = oAttrMappingNode.getAttributeValue("type");
        }
    }
    if (sResolvedComparisonType != null && sResolvedType != sResolvedComparisonType) {
        if (p_oSourceMappingObjectNode == oComparisonMappingObjectNode) {
            aMessages.push("The referenced attribute type '" + sResolvedType + "' and referenced comparison attribute type '" + sResolvedComparisonType + "' at mapping object '" + p_oSourceMappingObjectNode.getAttributeValue("id") + "' do not match." + createNodeInfoAppendix(p_oConditionNode));
        } else {
            aMessages.push("The referenced attribute type '" + sResolvedType + "' at mapping object '" + p_oSourceMappingObjectNode.getAttributeValue("id") + "' and referenced comparison attribute type '" + sResolvedComparisonType + "' at mapping object '" + oComparisonMappingObjectNode.getAttributeValue("id") + "' do not match." + createNodeInfoAppendix(p_oConditionNode));
        }
    }
    
    return aMessages;
}


function performValidateNodeChecks(p_oValidateNode, p_oSourceMappingObjectNode) {
    var aMessages = new Array();
    // check the same as for all other conditions first
    aMessages = aMessages.concat( performConditionNodeChecks(p_oValidateNode, p_oSourceMappingObjectNode) );
    // check if validation message is set
    aMessages = aMessages.concat( isMandatoryAttributeValueSet(p_oValidateNode, "message") );
    
    // check "comparison_mapping_link_ref" value
    var sComparisonMappingLinkRef = p_oValidateNode.getAttributeValue("comparison_mapping_link_ref");
    if (sComparisonMappingLinkRef != null) {
        var aNoLinkRefMessage = areMappingLinkReferencesValid(p_oValidateNode, "comparison_mapping_link_ref", sComparisonMappingLinkRef, p_oSourceMappingObjectNode);
        aMessages = aMessages.concat( aNoLinkRefMessage );
        //if "comparison_mapping_attribute_ref" is set then it must point at a <mappingAttr> on the target <mappingObject> MappingNode
        var sComparisonMappingAttributeRef = p_oValidateNode.getAttributeValue("comparison_mapping_attribute_ref");
        if (sComparisonMappingAttributeRef != null && aNoLinkRefMessage.length == 0) {
            //determining the target <mappingObject> MappingNode of the referenced <mappingLink> MappingNode
            var mappingLinkNode = getMappingLink(p_oSourceMappingObjectNode, sComparisonMappingLinkRef);
            var sTargetMappingObjectID = mappingLinkNode.getAttributeValue("mapping_object_ref");
            var oTargetMappingNode = getMappingObjectByID(sTargetMappingObjectID);
            if (oTargetMappingNode != null) {
                aMessages = aMessages.concat( areMappingAttrReferencesValid(p_oValidateNode, "comparison_mapping_attribute_ref", sComparisonMappingAttributeRef, oTargetMappingNode) );
            }
        }
    }
    
    // ---- check subordinated <condition> MappingNodes
    var iter = p_oValidateNode.getChildren("condition").iterator();
    while (iter.hasNext()) {
        aMessages = aMessages.concat( performConditionNodeChecks(iter.next(), p_oSourceMappingObjectNode) );
    }
    
    return aMessages;
}


function performLinkTargetNodeChecks(p_oLinkTargetConditionNode, p_oSourceMappingObjectNode, p_oSourceMappingLinkNode) {
    var aMessages = new Array();
    // check the same as for all other conditions first
    aMessages = aMessages.concat( performConditionNodeChecks(p_oLinkTargetConditionNode, p_oSourceMappingObjectNode) );
    
    //check "mapping_link_ref" value
    var sMappingLinkIDRef = p_oLinkTargetConditionNode.getAttributeValue("mapping_link_ref");
    if (sMappingLinkIDRef != null) {
        var sMappingLinkID = p_oSourceMappingLinkNode.getAttributeValue("id");
        var sMappingLinkTargetMappingObjectID = p_oSourceMappingLinkNode.getAttributeValue("mapping_object_ref");
        var sSourceMappingObjectID = p_oSourceMappingObjectNode.getAttributeValue("id");
		//"mapping_link_ref" must not point at the same <mappingLink> at the same <mappingObject> where the <linkTargetCondition> is defined on
        if (sMappingLinkIDRef == sMappingLinkID && sMappingLinkTargetMappingObjectID == sSourceMappingObjectID) {
            aMessages.push("The link reference 'mapping_link_ref' is pointing at the enclosing mapping link '" + sMappingLinkIDRef + "' of the same mapping object '" + p_oSourceMappingObjectNode.getAttributeValue("id") + "'. This is not allowed for link target conditions." + createNodeInfoAppendix(p_oLinkTargetConditionNode)); 
        }
    }
    
    return aMessages;
}


function hasOnlyAllowedAttributesAndChildren(p_oMappingNode) {
    var aMessages = new Array();
    
    //determine allowed attributes and children by node type
    var aAllowedAttibuteIDs = null;
    var aAllowedChildIDs = null;
    if (p_oMappingNode.getOriginNodeName() == "mappingModel") {
        var aAllowedAttibuteIDs = ["id", "model_typenums", "mapping_object_refs"];
        var aAllowedChildIDs = ["exportRelevanceCondition"];
    }
    if (p_oMappingNode.getOriginNodeName() == "mappingEnum") {
        aAllowedAttibuteIDs = ["arcm_enum", "is_multiple", "aris_enum"];
        aAllowedChildIDs = ["enumItem"];
    }
    if (p_oMappingNode.getOriginNodeName() == "enumItem") {
        aAllowedAttibuteIDs = ["id", "aris_typenum"];
        aAllowedChildIDs = [""];
    }
    if (p_oMappingNode.getOriginNodeName() == "mappingObject") {
        aAllowedAttibuteIDs = ["id", "arcm_objtype", "aris_typenum", "aris_symbolnum", 
                                "mapping_by_referenced_attributes_value_equality", "ignore_if_referenced_attributes_not_filled", 
                                "root_mapping_object_ref", "arcm_root_reverse_connection_attr", "arcm_guid_attr"];
        aAllowedChildIDs = ["mappingCondition", "exportRelevanceCondition", "mappingAttr", "mappingLink", "validate"];
    }
    if (p_oMappingNode.getOriginNodeName() == "mappingAttr") {
        aAllowedAttibuteIDs = ["id", "type", "aris_typenum", "default_value"];
        aAllowedChildIDs = [""];
    }
    if (p_oMappingNode.getOriginNodeName() == "mappingLink") {
        aAllowedAttibuteIDs = ["id", "aris_typenum", "direction", "mapping_object_ref", "is_hierarchical", "grouprole",
                                "is_top_down_reverse", "inherit_export_relevance", "merge_link_mapping_attribute_refs", "restrict_assignment_connections",
                                "sort_method", "sort_model_typenum", "cycle_link", "condition_relevant_only"];
        aAllowedChildIDs = ["mappingAttr", "linkCondition", "linkTargetCondition"];
    }
    
    if (p_oMappingNode.getOriginNodeName() == "mappingCondition"
        || p_oMappingNode.getOriginNodeName() == "exportRelevanceCondition"
        || p_oMappingNode.getOriginNodeName() == "linkCondition"
        || p_oMappingNode.getOriginNodeName() == "linkConnectionCondition"
        || p_oMappingNode.getOriginNodeName() == "linkTargetCondition"
        || p_oMappingNode.getOriginNodeName() == "validate"
        || p_oMappingNode.getOriginNodeName() == "condition") {
            
        aAllowedAttibuteIDs = [ "operator",
                                "mapping_attribute_ref", "type", "aris_typenum",
                                "mode",
                                "value", "min_value", "max_value",
                                "mapping_link_ref"];
        //operator <condition>s require sub <conditions>
        aAllowedChildIDs = ["condition"];
        
        if (p_oMappingNode.getOriginNodeName() == "validate") {
            aAllowedAttibuteIDs = aAllowedAttibuteIDs.concat([  "comparison_mapping_link_ref",
                                                                "comparison_mapping_attribute_ref", 
                                                                "comparison_recursive_mapping_link_ref",
                                                                "comparison_type", "comparison_aris_typenum",
                                                                "message" ]);
            aAllowedChildIDs.push("condition");
        }    
    }

    //perform checks
    if (aAllowedAttibuteIDs != null) {
        aMessages = aMessages.concat( hasOnlyAllowedAttributes(p_oMappingNode, aAllowedAttibuteIDs) );
    }
    if (aAllowedChildIDs != null) {
        aMessages = aMessages.concat( hasOnlyAllowedChildren(p_oMappingNode, aAllowedChildIDs) );
        //recursion
        for (var c=0; c<aAllowedChildIDs.length; c++) {
            var oChildrenList = p_oMappingNode.getChildren(aAllowedChildIDs[c]);
            var iter = oChildrenList.iterator();
            while (iter.hasNext()) {
                aMessages = aMessages.concat( hasOnlyAllowedAttributesAndChildren(iter.next()) );
            }
        }
    }
    return aMessages;
}


//---------------------------------------------------- ATOMIC CHECKS -------------------------------------------------------


function hasOnlyAllowedAttributes(p_oMappingNode, p_aAllowedAttributeIDs) {
    var aMessages = new Array();
    oAllowedAttributeIDSet = convertJSArrayToHashSet(p_aAllowedAttributeIDs);
    var iter = p_oMappingNode.getAttributeIDsSet().iterator();
    while (iter.hasNext()) {
        var sAttributeID = iter.next();
        if (!oAllowedAttributeIDSet.contains(sAttributeID)) {
            aMessages.push("Node attribute '" + sAttributeID + "' is not allowed at mapping nodes of type '" + p_oMappingNode.getOriginNodeName() + "'." + createNodeInfoAppendix(p_oMappingNode));
        }
    }
    return aMessages;
}

function hasOnlyAllowedChildren(p_oMappingNode, p_aAllowedChildTypeIDs) {
    var aMessages = new Array();
    oAllowedChildTypeIDSet = convertJSArrayToHashSet(p_aAllowedChildTypeIDs);
    var iter = p_oMappingNode.getChildrenIDsSet().iterator();
    while (iter.hasNext()) {
        var sChildTypeID = iter.next();
        if (!oAllowedChildTypeIDSet.contains(sChildTypeID)) {
            aMessages.push("Node child elements '" + sChildTypeID + "' are not allowed at mapping nodes of type '" + p_oMappingNode.getOriginNodeName() + "'." + createNodeInfoAppendix(p_oMappingNode));
        }
    }
    return aMessages;
}

function isMandatoryAttributeValueSet(p_oMappingNode, p_sAttributeID) {
    var aMessages = new Array();
    if (p_oMappingNode.getAttributeValue(p_sAttributeID) == null) {
        aMessages.push("Node attribute '" + p_sAttributeID + "' is mandatory for mapping nodes of type '" + p_oMappingNode.getOriginNodeName() + "' but is not set." + createNodeInfoAppendix(p_oMappingNode));
    }
    return aMessages;
}

//this is meant for direct MappingNode attributes which can have only "true" or false"
function hasAttributeValueTrueOrFalse(p_oMappingNode, p_sAttributeID) {
    var aMessages = new Array();
    var sValue = p_oMappingNode.getAttributeValue(p_sAttributeID);
    if (sValue != null && sValue != "true" && sValue != "false") {
        aMessages.push("Mapping node attribute '" + p_sAttributeID + "' may only be set to 'true' or 'false'." + createNodeInfoAppendix(p_oMappingNode));
    }
    return aMessages;
}

//this is meant for all <attrMapping> MappingNodes
function isAttributeValueCompatibleWithType(p_oMappingNode, p_sMappingNodeAttributeID, p_sValue, p_sType) {
    var aMessages = new Array();
    if (p_sType == null) {
        return aMessages;
    }
    else if (p_sType == "String" || p_sType == "Text") {
        return aMessages;
    }
    else if (p_sType == "Boolean") {
        if (p_sValue != "true" && p_sValue != "false") {
            aMessages.push("Type '" + p_sType + "' and the value '" + p_sValue + "' at mapping node attribute '" + p_sMappingNodeAttributeID + "' do not match." + createNodeInfoAppendix(p_oMappingNode));
        }
    }
    else if (p_sType == "Date") {
        //date values are exported as timeInMillis, but mapping values are specified in "yyyy.MM.dd"
        var dateFormat = new java.text.SimpleDateFormat("yyyy.MM.dd");
        try {
            dateFormat.parse(p_sValue);
        } catch (e) {
           aMessages.push("Type '" + p_sType + "' and the value '" + p_sValue + "' at mapping node attribute '" + p_sMappingNodeAttributeID + "' do not match." + createNodeInfoAppendix(p_oMappingNode));
        }
    }
    else if (p_sType == "Number" || p_sType == "link") {
        try {
            java.lang.Integer.valueOf(p_sValue);
        } catch (e) {
            aMessages.push("Type '" + p_sType + "' and the value '" + p_sValue + "' at mapping node attribute '" + p_sMappingNodeAttributeID + "' do not match." + createNodeInfoAppendix(p_oMappingNode));
        }
    }
    else if (p_sType == "Double") {
        try {
            java.lang.Double.valueOf(p_sValue);
        } catch (e) {
            aMessages.push("Type '" + p_sType + "' and the value '" + p_sValue + "' at mapping node attribute '" + p_sMappingNodeAttributeID + "' do not match." + createNodeInfoAppendix(p_oMappingNode));
        }
    }
    else if (p_sType.startsWith("Enum_")) {
        var sEnumID = p_sType.slice("Enum_".length);
        var aMappingEnumItemIDs = getAllItemIDsOfMappingEnum(sEnumID);
        var aSplittedEnumItemIDs = p_sValue.split(",");
        for (var i=0; i<aSplittedEnumItemIDs.length; i++) { 
            if (!aMappingEnumItemIDs.contains(aSplittedEnumItemIDs[i])) {
                aMessages.push("Type '" + p_sType + "' and the value '" + p_sValue + "' at mapping node attribute '" + p_sMappingNodeAttributeID + "' do not match. The specified enum item '" + aSplittedEnumItemIDs[i] + "' is not part of the referenced enum mapping '" + sEnumID + "'." + createNodeInfoAppendix(p_oMappingNode));
            }
        }
    }  
    return aMessages;
}

//this is meant for all <attrMapping> MappingNodes and for condition nodes as well
function isAttributeTypeCompatibleWithARISAttribute(p_oMappingNode, p_sTypeXMLName, p_sType, p_sAttributeTypeNumXMLName, p_sAttributeTypeNum) {
    var aMessages = new Array();
    if (p_sType == null || p_sAttributeTypeNum == null) {
        return aMessages;
    }
    //special cases of attribute type nums
    if (arrayContainsValue(["MODELGUID", "MODELNAME", "OBJECTGUID", "ROLE", "ROLELEVEL", "FULLNAME"], p_sAttributeTypeNum)) {
        return aMessages;
    }
    if (p_sAttributeTypeNum.startsWith("CONSTANT#")) {
        return aMessages;
    }
    if (p_sAttributeTypeNum.startsWith("ENDDATE#")) { //ENDDATE#<start date attribute>#<duration attribute>
        var aAttributeReferences = p_sAttributeTypeNum.split("#");
        if (p_sType != "Date") {
            aMessages.push("The ENDDATE reference at '" + p_sAttributeTypeNumXMLName + "' is only allowed if '" + p_sTypeXMLName + "' has value 'Date'." + createNodeInfoAppendix(p_oMappingNode));
        }
        if (aAttributeReferences.length != 3) {
            aMessages.push("The ENDDATE reference at '" + p_sAttributeTypeNumXMLName + "' has not the required form 'ENDDATE#<start date attribute>#<duration attribute>'." + createNodeInfoAppendix(p_oMappingNode));
            return aMessages;
        }
        if (ArisData.ActiveFilter().AttrBaseType(getAttributeTypeNum(aAttributeReferences[1])) != Constants.ABT_DATE) {
            aMessages.push("The ENDDATE reference at '" + p_sAttributeTypeNumXMLName + "' has the required form 'ENDDATE#<start date attribute>#<duration attribute>' but '<start date attribute>' does not refer to an ARIS date attribute." + createNodeInfoAppendix(p_oMappingNode));
        }
        if (ArisData.ActiveFilter().AttrBaseType(getAttributeTypeNum(aAttributeReferences[2])) != Constants.ABT_TIMESPAN) {
            aMessages.push("The ENDDATE reference at '" + p_sAttributeTypeNumXMLName + "' has the required form 'ENDDATE#<start date attribute>#<duration attribute>' but '<duration attribute>' does not refer to an ARIS duration attribute." + createNodeInfoAppendix(p_oMappingNode));
        }
        return aMessages;
    }
    if (p_sAttributeTypeNum.startsWith("DURATION#")) { //DURATION#<duration attribute>
        var aAttributeReferences = p_sAttributeTypeNum.split("#");
        if (p_sType != "Number") {
            aMessages.push("The DURATION reference at '" + p_sAttributeTypeNumXMLName + "' is only allowed if '" + p_sTypeXMLName + "' has value 'Number'." + createNodeInfoAppendix(p_oMappingNode));
        }
        if (aAttributeReferences.length != 2) {
            aMessages.push("The DURATION reference at '" + p_sAttributeTypeNumXMLName + "' has not the required form 'DURATION#<duration attribute>'." + createNodeInfoAppendix(p_oMappingNode));
            return aMessages;
        }
        if (ArisData.ActiveFilter().AttrBaseType(getAttributeTypeNum(aAttributeReferences[1])) != Constants.ABT_TIMESPAN) {
            aMessages.push("The DURATION reference at '" + p_sAttributeTypeNumXMLName + "' has the required form 'DURATION#<duration attribute>' but '<duration attribute>' does not refer to an ARIS duration attribute." + createNodeInfoAppendix(p_oMappingNode));
        }
        return aMessages;
    }
    if (p_sAttributeTypeNum.startsWith("EVENT_DRIVEN_ALLOWED#")) { //EVENT_DRIVEN_ALLOWED#<boolean attribute>#<attr value attribute>#<attr value for 'event-driven'>
        var aAttributeReferences = p_sAttributeTypeNum.split("#");
        if (p_sType != "Boolean") {
            aMessages.push("The EVENT_DRIVEN_ALLOWED reference at '" + p_sAttributeTypeNumXMLName + "' is only allowed if '" + p_sTypeXMLName + "' has value 'Boolean'." + createNodeInfoAppendix(p_oMappingNode));
        }
        if (aAttributeReferences.length != 4) {
            aMessages.push("The EVENT_DRIVEN_ALLOWED reference at '" + p_sAttributeTypeNumXMLName + "' has not the required form 'EVENT_DRIVEN_ALLOWED#<boolean attribute>#<attr value attribute>#<attr value for 'event-driven'>'." + createNodeInfoAppendix(p_oMappingNode));
            return aMessages;
        }
        if (ArisData.ActiveFilter().AttrBaseType(getAttributeTypeNum(aAttributeReferences[1])) != Constants.ABT_BOOL) {
            aMessages.push("The EVENT_DRIVEN_ALLOWED reference at '" + p_sAttributeTypeNumXMLName + "' has the required form 'EVENT_DRIVEN_ALLOWED#<boolean attribute>#<attr value attribute>#<attr value for 'event-driven'>' but '<boolean attribute>' does not refer to an ARIS boolean attribute." + createNodeInfoAppendix(p_oMappingNode));
        }
        var iValueAttributeTypeNum = getAttributeTypeNum(aAttributeReferences[2]);
        if (ArisData.ActiveFilter().AttrBaseType(iValueAttributeTypeNum) != Constants.ABT_VALUE) {
            aMessages.push("The EVENT_DRIVEN_ALLOWED reference at '" + p_sAttributeTypeNumXMLName + "' has the required form 'EVENT_DRIVEN_ALLOWED#<boolean attribute>#<attr value attribute>#<attr value for 'event-driven'>' but '<attr value attribute>' does not refer to an ARIS value attribute." + createNodeInfoAppendix(p_oMappingNode));
            return aMessages;
        }
        var iValueAttributeValueTypeNum = getAttributeTypeNum(aAttributeReferences[3]);
        var aAllowedAttributeValueTypeNums = ArisData.ActiveFilter().AttrValueTypeNums(iValueAttributeTypeNum);
        if (!arrayContainsValue(aAllowedAttributeValueTypeNums, iValueAttributeValueTypeNum)) {
            aMessages.push("The EVENT_DRIVEN_ALLOWED reference at '" + p_sAttributeTypeNumXMLName + "' has the required form 'EVENT_DRIVEN_ALLOWED#<boolean attribute>#<attr value attribute>#<attr value for 'event-driven'>' but '<attr value for 'event-driven'>' does not refer to an allowed value of the referenced ARIS value attribute." + createNodeInfoAppendix(p_oMappingNode));
        }
        return aMessages;
    }
    if (p_sAttributeTypeNum.startsWith("FILESIZE#")) { //EVENT_DRIVEN_ALLOWED#<boolean attribute>#<attr value attribute>#<attr value for 'event-driven'>
        var aAttributeReferences = p_sAttributeTypeNum.split("#");
        if (p_sType != "Number") {
            aMessages.push("The FILESIZE reference at '" + p_sAttributeTypeNumXMLName + "' is only allowed if '" + p_sTypeXMLName + "' has value 'String'." + createNodeInfoAppendix(p_oMappingNode));
        }
        if (aAttributeReferences.length != 2) {
            aMessages.push("The FILESIZE reference at '" + p_sAttributeTypeNumXMLName + "' has not the required form 'FILESIZE#<file attribute>'." + createNodeInfoAppendix(p_oMappingNode));
            return aMessages;
        } 
        if (ArisData.ActiveFilter().AttrBaseType(getAttributeTypeNum(aAttributeReferences[1])) != Constants.ABT_FILE) {
            aMessages.push("The FILESIZE reference at '" + p_sAttributeTypeNumXMLName + "' has the required form 'FILESIZE#<file attribute>' but '<file attribute>' does not refer to an ARIS file attribute." + createNodeInfoAppendix(p_oMappingNode));
        }
        return aMessages;
    }
    
    //enum attribute type
    if (p_sType.startsWith("Enum_")) {
        var sEnumID = p_sType.slice("Enum_".length);
        var oEnumMappingNode = getMappingEnum(sEnumID);
        if (oEnumMappingNode == null) {
            aMessages.push("The enum type '" + sEnumID + "' at '" + p_sTypeXMLName + "' is not resolvable." + createNodeInfoAppendix(p_oMappingNode));
        } else {
            var sMultiple = oEnumMappingNode.getAttributeValue("is_multiple");
            var itemIter = oEnumMappingNode.getChildren("enumItem").iterator();
            if (sMultiple == "true") {
                if (p_sAttributeTypeNum != "ISMULTIPLE") {
                    aMessages.push("If the enum type at '" + p_sTypeXMLName + "' references a multi enum then the attribute reference at '" + p_sAttributeTypeNumXMLName + "' must be set to 'ISMULTIPLE'." + createNodeInfoAppendix(p_oMappingNode));
                } 
                //otherwise all enum items must point at boolean attributes - this is already covered by the enum mapping checks
            }
            if (sMultiple == "false") {
                var iAttributeTypeNum = getAttributeTypeNum(p_sAttributeTypeNum);
                var iAttrBaseType = ArisData.ActiveFilter().AttrBaseType(iAttributeTypeNum);
                if (iAttrBaseType == -1) {
                    aMessages.push("The attribute reference '" + p_sAttributeTypeNum + "' is not resolvable." + createNodeInfoAppendix(p_oMappingNode));
                }
                else if (iAttrBaseType != Constants.ABT_VALUE) {
                    aMessages.push("The enum type at '" + p_sTypeXMLName + "' references a single enum but the attribute reference at '" + p_sAttributeTypeNumXMLName + "' does not refer at an ARIS value attribute." + createNodeInfoAppendix(p_oMappingNode));
                }
                else {
                    var aAllowedValueTypeNums = ArisData.ActiveFilter().AttrValueTypeNums(iAttributeTypeNum);
                    //all set enumItem references must point at a value of this value attributes
                    while (itemIter.hasNext()) {
                        oEnumItemMappingNode = itemIter.next();
                        var sItemID = oEnumItemMappingNode.getAttributeValue("id");
                        var sItemTypeNum = oEnumItemMappingNode.getAttributeValue("aris_typenum");
                        if (sItemID != null && sItemTypeNum) {
                            var iValueTypeNum = getAttributeTypeNum(sItemTypeNum);
                            if (iValueTypeNum == -1  && p_sAttributeTypeNum.length == 36 && sItemTypeNum.length == 36) {
                                iValueTypeNum = ArisData.ActiveFilter().UserDefinedAttributeValueTypeNum(p_sAttributeTypeNum, sItemTypeNum);
                            }
                            if (!arrayContainsValue(aAllowedValueTypeNums, iValueTypeNum)) {
                                aMessages.push("The enum type at '" + p_sTypeXMLName + "' references the single enum '" + sEnumID + "' but the referenced ARIS value attribute '" + p_sAttributeTypeNum + "' does not allow the value '" + sItemTypeNum + "' of enum item '" + sItemID + "'." + createNodeInfoAppendix(p_oMappingNode));
                            }
                        }
                    }
                }
            }
        }
        return aMessages;
    }
    
    //all other attribute types
    var iAttrBaseType = ArisData.ActiveFilter().AttrBaseType(getAttributeTypeNum(p_sAttributeTypeNum));
    if (iAttrBaseType == -1) {
        aMessages.push("The attribute reference at '" + p_sAttributeTypeNumXMLName + "' is not resolvable." + createNodeInfoAppendix(p_oMappingNode));
    }
    else if (arrayContainsValue(["String", "Text"], p_sType)
            && iAttrBaseType != Constants.ABT_SINGLELINE && iAttrBaseType != Constants.ABT_MULTILINE && iAttrBaseType != Constants.ABT_FILE) {
        aMessages.push("Attribute type '" + p_sTypeXMLName + "' is set to '" + p_sType + "' but the attribute reference '" + p_sAttributeTypeNum + "' at '" + p_sAttributeTypeNumXMLName + "' does not refer to an ARIS text attribute." + createNodeInfoAppendix(p_oMappingNode));
    }
    else if (arrayContainsValue(["Boolean"], p_sType)
            && iAttrBaseType != Constants.ABT_BOOL) {
        aMessages.push("Attribute type '" + p_sTypeXMLName + "' is set to '" + p_sType + "' but the attribute reference '" + p_sAttributeTypeNum + "' at '" + p_sAttributeTypeNumXMLName + "' does not refer to an ARIS boolean attribute." + createNodeInfoAppendix(p_oMappingNode));
    }
    else if (arrayContainsValue(["Date"], p_sType)
            && iAttrBaseType != Constants.ABT_DATE) {
        aMessages.push("Attribute type '" + p_sTypeXMLName + "' is set to '" + p_sType + "' but the attribute reference '" + p_sAttributeTypeNum + "' at '" + p_sAttributeTypeNumXMLName + "' does not refer to an ARIS date attribute." + createNodeInfoAppendix(p_oMappingNode));
    }
    else if (arrayContainsValue(["Number"], p_sType)
            && iAttrBaseType != Constants.ABT_INTEGER && iAttrBaseType != Constants.ABT_RANGEINTEGER) {
        aMessages.push("Attribute type '" + p_sTypeXMLName + "' is set to '" + p_sType + "' but the attribute reference '" + p_sAttributeTypeNum + "' at '" + p_sAttributeTypeNumXMLName + "' does not refer to an ARIS integer attribute." + createNodeInfoAppendix(p_oMappingNode));
    }
    else if (arrayContainsValue(["Double"], p_sType)
            && iAttrBaseType != Constants.ABT_FLOAT && iAttrBaseType != Constants.ABT_RANGEFLOAT) {
        aMessages.push("Attribute type '" + p_sTypeXMLName + "' is set to '" + p_sType + "' but the attribute reference '" + p_sAttributeTypeNum + "' at '" + p_sAttributeTypeNumXMLName + "' does not refer to an ARIS float attribute." + createNodeInfoAppendix(p_oMappingNode));
    }
    
    return aMessages;
}

function areMappingObjectReferencesValid(p_oMappingNode, p_sConcatenatedMappingObjectIDs) {
    var aMessages = new Array();
    if (p_sConcatenatedMappingObjectIDs != null && p_sConcatenatedMappingObjectIDs.length > 0) {
        var aSplittedMappingObjectIDs = p_sConcatenatedMappingObjectIDs.split(",");
        for (var o=0; o<aSplittedMappingObjectIDs.length; o++) {
            if (getMappingObjectByID(aSplittedMappingObjectIDs[o]) == null) {
                aMessages.push("The mapping object reference '" + aSplittedMappingObjectIDs[o] + "' is unknown." + createNodeInfoAppendix(p_oMappingNode));
            }
        }
    }
    return aMessages;
}

function areMappingAttrReferencesValid(p_oMappingNode, p_sSourceAttrID, p_sConcatenatedMappingAttrReferenceIDs, p_oTargetMappingNode) {
	var aMessages = new Array();
    if (p_sConcatenatedMappingAttrReferenceIDs != null && p_sConcatenatedMappingAttrReferenceIDs.length > 0) {
        var oAttrIDsSet = getMappingAttrIDsOfMappingObject(p_oTargetMappingNode);
		var aSplittedMappingAttrReferenceIDStrings = p_sConcatenatedMappingAttrReferenceIDs.split(",");
        for (var a=0; a<aSplittedMappingAttrReferenceIDStrings.length; a++) {
			if (!oAttrIDsSet.contains(aSplittedMappingAttrReferenceIDStrings[a])) {
                aMessages.push("The attribute reference at '" + p_sSourceAttrID + "' points at a mapping attribute '" + aSplittedMappingAttrReferenceIDStrings[a] + "' which is not defined at the mapping object '" + p_oTargetMappingNode.getAttributeValue("id") + "'." + createNodeInfoAppendix(p_oMappingNode));
            }
        }
    }
    return aMessages;
}

function areMappingLinkReferencesValid(p_oMappingNode, p_sSourceAttrID, p_sConcatenatedMappingLinkReferenceIDs, p_oTargetMappingNode) {
	var aMessages = new Array();
    if (p_sConcatenatedMappingLinkReferenceIDs != null && p_sConcatenatedMappingLinkReferenceIDs.length > 0) {
        var oLinkIDsSet = getMappingLinkIDsOfMappingObject(p_oTargetMappingNode);
		var aSplittedMappingLinkReferenceIDStrings = p_sConcatenatedMappingLinkReferenceIDs.split(",");
        for (var a=0; a<aSplittedMappingLinkReferenceIDStrings.length; a++) {
			if (!oLinkIDsSet.contains(aSplittedMappingLinkReferenceIDStrings[a])) {
                aMessages.push("The mapping link reference at '" + p_sSourceAttrID + "' points at a link attribute '" + aSplittedMappingLinkReferenceIDStrings[a] + "' which is not defined at the mapping object '" + p_oTargetMappingNode.getAttributeValue("id") + "'." + createNodeInfoAppendix(p_oMappingNode));
            }
        }
    }
    return aMessages;
}

function areModelTypeNumsResolvable(p_oMappingNode, p_sConcatenatedModelTypeNums) {
    var aMessages = new Array();
    if (p_sConcatenatedModelTypeNums != null && p_sConcatenatedModelTypeNums.length > 0) {
        var aSplittedModelTypeNumStrings = p_sConcatenatedModelTypeNums.split(",");
        for (var m=0; m<aSplittedModelTypeNumStrings.length; m++) {
            if (getModelTypeNum(aSplittedModelTypeNumStrings[m]) == -1) {
                aMessages.push("The model type num '" + aSplittedModelTypeNumStrings[m] + "' is unknown." + createNodeInfoAppendix(p_oMappingNode));
            }
        }
    }
    return aMessages;
}

function areObjectTypeNumsResolvable(p_oMappingNode, p_sConcatenatedObjectTypeNums) {
    var aMessages = new Array();
    if (p_sConcatenatedObjectTypeNums != null && p_sConcatenatedObjectTypeNums.length > 0) {
        var aSplittedObjectTypeNumStrings = p_sConcatenatedObjectTypeNums.split(",");
        for (var o=0; o<aSplittedObjectTypeNumStrings.length; o++) {
            if (aSplittedObjectTypeNumStrings[o] == "VIRTUAL") {continue;}
            if (getObjectTypeNum(aSplittedObjectTypeNumStrings[o]) == -1) {
                aMessages.push("The object type num '" + aSplittedObjectTypeNumStrings[o] + "' is unknown." + createNodeInfoAppendix(p_oMappingNode));
            }
        }
    }
    return aMessages;
}

function areSymbolTypeNumsResolvable(p_oMappingNode, p_sConcatenatedSymbolTypeNums) {
    var aMessages = new Array();
    if (p_sConcatenatedSymbolTypeNums != null && p_sConcatenatedSymbolTypeNums.length > 0) {
        var aSplittedSymbolTypeNumStrings = p_sConcatenatedSymbolTypeNums.split(",");
        for (var s=0; s<aSplittedSymbolTypeNumStrings.length; s++) {
            if (getSymbolTypeNum(aSplittedSymbolTypeNumStrings[s]) == -1) {
                aMessages.push("The symbol type num '" + aSplittedSymbolTypeNumStrings[s] + "' is unknown." + createNodeInfoAppendix(p_oMappingNode));
            }
        }
    }
    return aMessages;
}

function arrayContainsValue(p_aArray, p_oValue) {
    return p_aArray.indexOf(p_oValue) != -1;
}

//------------------------------------------------------- MESSAGES ---------------------------------------------------------


function createNodeInfoAppendix(p_oMappingNode) {
    var sResult = " Located at: ";
    if (p_oMappingNode.getOriginNodeName() == "mappingModel"
        || p_oMappingNode.getOriginNodeName() == "mappingEnum"
        || p_oMappingNode.getOriginNodeName() == "mappingObject") {
        sResult += " " + createNodeIdentifier(p_oMappingNode);
    }
    else if (p_oMappingNode.getOriginNodeName() == "enumItem"
            || p_oMappingNode.getOriginNodeName() == "mappingAttr"
            || p_oMappingNode.getOriginNodeName() == "mappingLink"
            || p_oMappingNode.getOriginNodeName() == "mappingCondition"
            || p_oMappingNode.getOriginNodeName() == "exportRelevanceCondition"
            || p_oMappingNode.getOriginNodeName() == "validate") {
        sResult += " " + createNodeIdentifier(p_oMappingNode) + " <-- " + createNodeIdentifier(p_oMappingNode.getParentMappingNode());
    }
    else if (p_oMappingNode.getOriginNodeName() == "linkCondition"
            || p_oMappingNode.getOriginNodeName() == "linkTargetCondition"
            || p_oMappingNode.getOriginNodeName() == "condition") {
        sResult += " " + createNodeIdentifier(p_oMappingNode) + " <-- " + createNodeIdentifier(p_oMappingNode.getParentMappingNode()) + " <-- " + createNodeIdentifier(p_oMappingNode.getParentMappingNode().getParentMappingNode());
    }
    return sResult;
}


function createNodeIdentifier(p_oMappingNode) {
    var sOriginNodeName = p_oMappingNode.getOriginNodeName();
    var sResult = "<" + sOriginNodeName + " ";
    if (p_oMappingNode.getOriginNodeName() == "mappingModel") {
        sResult += "id='" + p_oMappingNode.getAttributeValue("id") + "'";
    }
    if (p_oMappingNode.getOriginNodeName() == "mappingEnum") {
        var sID = p_oMappingNode.getAttributeValue("arcm_enum");
        if (sID != null) {
            sResult += "arcm_enum='" + sID + "'";
        } else {
            var sID = p_oMappingNode.getAttributeValue("aris_enum");
            if (sID != null) {
                sResult += "aris_enum='" + sID + "'";
            }
        }
    }
    if (p_oMappingNode.getOriginNodeName() == "enumItem") {
        sResult += "id='" + p_oMappingNode.getAttributeValue("id") + "'";
    }
    if (p_oMappingNode.getOriginNodeName() == "mappingObject") {
        sResult += "id='" + p_oMappingNode.getAttributeValue("id") + "'";
    }
    if (p_oMappingNode.getOriginNodeName() == "mappingAttr") {
        sResult += "id='" + p_oMappingNode.getAttributeValue("id") + "'";
    }
    if (p_oMappingNode.getOriginNodeName() == "mappingLink") {
        sResult += "id='" + p_oMappingNode.getAttributeValue("id") + "'";
    }
    if (p_oMappingNode.getOriginNodeName() == "linkCondition"
        || p_oMappingNode.getOriginNodeName() == "linkTargetCondition"
        || p_oMappingNode.getOriginNodeName() == "mappingCondition"
        || p_oMappingNode.getOriginNodeName() == "exportRelevanceCondition"
        || p_oMappingNode.getOriginNodeName() == "validate"
        || p_oMappingNode.getOriginNodeName() == "condition") {
        
        var sOperator = p_oMappingNode.getAttributeValue("operator");
        if (sOperator != null) {
            sResult += "operator='" + sOperator + "'";
        }
        var sAttrRef = p_oMappingNode.getAttributeValue("mapping_attribute_ref");
        if (sAttrRef != null) {
            sResult += "mapping_attribute_ref='" + sAttrRef + "'";
        } else {
            var sComboID = "";
            var sType = p_oMappingNode.getAttributeValue("type");
            if (sType != null) {
                sComboID += "type='" + sType + "'";
            }
            var sArisTypeNum = p_oMappingNode.getAttributeValue("aris_typenum");
            if (sArisTypeNum != null) {
                if (sComboID.length > 0) {sComboID += " / ";}
                sComboID += "aris_typenum='" + sArisTypeNum + "'";
            }
            sResult += sComboID;
        }
    }
    sResult += ">";

    return sResult;
}