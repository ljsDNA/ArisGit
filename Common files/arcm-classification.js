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

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 ~~~~~~~ Classification basics ~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

//global switch
var g_bSkipBottomUpRecursion = true;

//debug option for export relevance decisions
var g_bDebugStringOutput = false;

// map of already classified ObjDefs or Models by attributes and ObjDefs by occurrences in models, represented by their ARIS guids
var g_classification_hm_exportRelevance = new java.util.HashMap(); //Format: String | Boolean
// map of already classified ObjDefs by bottom up recursion, represented by their ARIS guids
var g_classification_hm_exportRelevanceBottomUp = new java.util.HashMap(); //Format: String | Boolean
// map of already classified ObjDefs by top down recursion, represented by their ARIS guids
var g_classification_hm_exportRelevanceTopDown = new java.util.HashMap(); //Format: String | Boolean

// map of exportInfo objects, keys are a combination of their ARIS guids and the mappingObject ID;
var g_classification_hm_arisGuidAndMappingObjectID2exportInfo = new java.util.HashMap(); //Format: String | HashSet <exportInfo>


/*---------------------------------------------------------------------------------------
 * Returns a Boolean representing the export relevance by the guid of the given
 * combination of ObjDef and MappingObject ID in case its relevance by attribute values 
 * and occurrences in models was already calculated and stored earlier.
 * Returns null if the relevance is not determined yet.
 ---------------------------------------------------------------------------------------*/
function getObjDefExportRelevance(p_oObjDef, p_sMappingObjectID) {
    var sKey = p_oObjDef.GUID() + "|" + p_sMappingObjectID;
    var oStoredJavaBoolean = g_classification_hm_exportRelevance.get(sKey);
    if (oStoredJavaBoolean != null) {
        return oStoredJavaBoolean.booleanValue();
    } else {
        return null;
    }
}

/*---------------------------------------------------------------------------------------
 * Stores the export relevance by attribute values and occurrences in models, 
 * represented by the combination of ObjDef and MappingObject ID.
 ---------------------------------------------------------------------------------------*/
function storeObjDefExportRelevance(p_oObjDef, p_sMappingObjectID, p_bExportRelevant) {
    var sKey = p_oObjDef.GUID() + "|" + p_sMappingObjectID;
    g_classification_hm_exportRelevance.put(sKey, p_bExportRelevant);
}

/*---------------------------------------------------------------------------------------
 * Returns a Boolean representing the export relevance by the guid of the given ObjDef
 * or Model in case ist relevance by bottom up recusrion values and occurrences in models
 * was already calculated and stored earlier.
 * Returns null if the relevance is not determined yet.
 ---------------------------------------------------------------------------------------*/
function getExportRelevanceBottomUp(p_oObjDef, p_sMappingObjectID) {
    var sKey = p_oObjDef.GUID() + "|" + p_sMappingObjectID;
    var oStoredJavaBoolean = g_classification_hm_exportRelevanceBottomUp.get(sKey);
    if (oStoredJavaBoolean != null) {
        return oStoredJavaBoolean.booleanValue();
    } else {
        return null;
    }
}

/*---------------------------------------------------------------------------------------
 * Mark the given ObjDef as processed by bottom up recursion by its guid.
 ---------------------------------------------------------------------------------------*/
function storeObjDefExportRelevanceBottomUp(p_oObjDef, p_sMappingObjectID, p_bExportRelevant) {
    var sKey = p_oObjDef.GUID() + "|" + p_sMappingObjectID;
    g_classification_hm_exportRelevanceBottomUp.put(sKey, p_bExportRelevant);
}

/*---------------------------------------------------------------------------------------
 * Returns a Boolean representing the export relevance by the guid of the given ObjDef
 * or Model in case ist relevance by top down recusrion values and occurrences in models
 * was already calculated and stored earlier.
 * Returns null if the relevance is not determined yet.
 ---------------------------------------------------------------------------------------*/
function isProcessedTopDown(p_oObjDef, p_sMappingObjectID, p_sArcmRootGuid) {
    return g_classification_hm_exportRelevanceTopDown.containsKey(p_oObjDef.GUID() + "|" + p_sMappingObjectID + "|" + p_sArcmRootGuid);
}

/*---------------------------------------------------------------------------------------
 * Mark the given ObjDef as processed by top down recursion by its guid.
 ---------------------------------------------------------------------------------------*/
function setProcessedTopDown(p_oObjDef, p_sMappingObjectID, p_sArcmRootGuid) {
    g_classification_hm_exportRelevanceTopDown.put(p_oObjDef.GUID() + "|" + p_sMappingObjectID + "|" + p_sArcmRootGuid, true);
}

/*---------------------------------------------------------------------------------------
 * Returns a HashSet of all created exportInfo objects for the given mapping object ID.
 * If there are none than an empty set is returned.
 ---------------------------------------------------------------------------------------*/
function getExportInfosByMappingObjectID(p_sMappingObjectID) {
    var result = g_classification_hm_mappingObjectID2exportInfos.get(p_sMappingObjectID);
    if (result == null) {
        result = new java.util.HashSet();
    }
    return result;
}

/*---------------------------------------------------------------------------------------
 * Returns an ExportInfo matching the passed ARIS guid, ARCM root guid (optional) and
 * object mapping ID, otherwise null if there is no match.
 ---------------------------------------------------------------------------------------*/
function getExportInfoByGUIDsAndMappingObjectID(p_sItemArisObjDefGUID, p_sArcmRootGuid, p_sMappingObjectID) {
    var sKey = p_sItemArisObjDefGUID + "#" + p_sMappingObjectID;
    var oExportInfoSet = g_classification_hm_arisGuidAndMappingObjectID2exportInfo.get(sKey);
    if (oExportInfoSet == null || oExportInfoSet.size() == 0) {
        return null;
    }
    var iter = oExportInfoSet.iterator();
    if (p_sArcmRootGuid == null) {
        return iter.next();
    } else {
        while (iter.hasNext()) {
            var oExportInfo = iter.next();
            if (oExportInfo.sArcmRootGuid == p_sArcmRootGuid) {
                return oExportInfo;
            }
        }
        return null;
    }
}

/*---------------------------------------------------------------------------------------
 * Stored the given exportInfo object into the internal exportInfo maps.
 * Also determines if the ARIS guid shall be used as ARCM guid or if a ARCM guid query
 * shall be constructed
 ---------------------------------------------------------------------------------------*/
function addExportInfo(p_oExportInfo, p_oMappingObject) {    
    
    //first clarify the ARCM guid
    determineArcmGUID(p_oExportInfo, p_oMappingObject);
    
    //then add the ExportInfo to the hashmaps
    var sKey = p_oExportInfo.sArisGuid + "#" + p_oExportInfo.sMappingObjectID;
    var set = g_classification_hm_arisGuidAndMappingObjectID2exportInfo.get(sKey);
    if (set == null) {
        set = new java.util.HashSet();
        g_classification_hm_arisGuidAndMappingObjectID2exportInfo.put(sKey, set);
    }
    set.add(p_oExportInfo);
    
    sKey = p_oExportInfo.sMappingObjectID;
    set = g_classification_hm_mappingObjectID2exportInfos.get(sKey);
    if (set == null) {
        set = new java.util.HashSet();
        g_classification_hm_mappingObjectID2exportInfos.put(sKey, set);
    }
    set.add(p_oExportInfo);
}

/*---------------------------------------------------------------------------------------
 * Removes the given exportInfo object from the internal exportInfo maps.
 ---------------------------------------------------------------------------------------*/
function removeExportInfo(p_oExportInfo) {
    var sItemArisObjDefGUID = p_oExportInfo.getObjDef().GUID();
    var sMappingObjectID = p_oExportInfo.sMappingObjectID;
    
    var sKey = sItemArisObjDefGUID + "#" + sMappingObjectID;
    var set = g_classification_hm_arisGuidAndMappingObjectID2exportInfo.get(sKey);
    if (set != null) {
        set.remove(p_oExportInfo);
    }
    
    sKey = sMappingObjectID;
    set = g_classification_hm_mappingObjectID2exportInfos.get(sKey);
    if (set != null) {
        set.remove(p_oExportInfo);
    }
}


/*---------------------------------------------------------------------------------------
 * Returns a LinkedHashSet of those child exportInfo objects which are linked by the given
 * attr ref ID to the given parent exportIndo object.
 * If there are none than an empty set is returned.
 ---------------------------------------------------------------------------------------*/
function getChildrenExportInfos(p_oParentExportInfo, p_oMappingLink) {
    var result = null;
    var oParentMappingObject = getMappingObjectByID(p_oParentExportInfo.sMappingObjectID);
    var sLinkKey = createExportInfoRelationKey(oParentMappingObject, p_oMappingLink);
    
    return getChildExportInfoSet(p_oParentExportInfo, sLinkKey); 
}

/*---------------------------------------------------------------------------------------
 * Returns a LinkedHashSet of those child exportInfo objects which are linked by the given
 * attr ref ID to the given parent exportInfo object.
 * If there are none than an empty set is returned.
 ---------------------------------------------------------------------------------------*/
function getParentExportInfos(p_oChildExportInfo, p_oMappingLink, p_oParentMappingObject) {
    var result = null;
    var sLinkKey = createExportInfoRelationKey(p_oParentMappingObject, p_oMappingLink);
    
    return getParentExportInfoSet(p_oChildExportInfo, sLinkKey);
}

/*---------------------------------------------------------------------------------------
 * Maps the given exportInfo object as child to the given parent exportInfo object
 * by the given attr ref ID.
 ---------------------------------------------------------------------------------------*/
function storeExportInfoRelation(p_oParentExportInfo, p_oMappingLink, p_oChildExportInfo, p_oPredecessorChildExportInfo) {
    var oParentMappingObject = getMappingObjectByID(p_oParentExportInfo.sMappingObjectID);
    var sParentExportInfoKey = getExportInfoHashMapKey(p_oParentExportInfo);
    var sChildExportInfoKey = getExportInfoHashMapKey(p_oChildExportInfo);
    var sLinkKey = createExportInfoRelationKey(oParentMappingObject, p_oMappingLink);
    
    //---- update parent -> children hash map
    var all_p2c_references_map = g_classification_hm_parent2children.get(sParentExportInfoKey);
    if (all_p2c_references_map == null) {
        all_p2c_references_map = new java.util.HashMap();
        g_classification_hm_parent2children.put(sParentExportInfoKey, all_p2c_references_map);
    }
    var child_set = all_p2c_references_map.get(sLinkKey);
    if (child_set == null) {
        child_set = new java.util.LinkedHashSet();
        all_p2c_references_map.put(sLinkKey, child_set);
    }  
    //if we have no restrictions where to place the new child then simply add it at the end
    if (p_oPredecessorChildExportInfo == null) {
        child_set.add(p_oChildExportInfo);
    }
    //if the precedessor child is specified then ensure that the new child is inserted directly after this predecessor
    else {
        var bAdded = false;
        var insert_child_set = new java.util.LinkedHashSet();
        var iter = child_set.iterator();
        while (iter.hasNext()) {
            var existingChildExportInfo = iter.next();
            insert_child_set.add(existingChildExportInfo);
            if (existingChildExportInfo == p_oPredecessorChildExportInfo) {
                insert_child_set.add(p_oChildExportInfo);
                bAdded = true;
            }
        }
        //if the predecessor child was not in the set then add the new child simply at the end
        if (!bAdded) {
            insert_child_set.add(p_oChildExportInfo);
        }
        all_p2c_references_map.put(sLinkKey, insert_child_set);
    }
    
    //---- update child -> parents hash map
    var all_c2p_references_map = g_classification_hm_child2parents.get(sChildExportInfoKey);
    if (all_c2p_references_map == null) {
        all_c2p_references_map = new java.util.HashMap();
        g_classification_hm_child2parents.put(sChildExportInfoKey, all_c2p_references_map);
    }
    var parent_set = all_c2p_references_map.get(sLinkKey);
    if (parent_set == null) {
        parent_set = new java.util.LinkedHashSet();
        all_c2p_references_map.put(sLinkKey, parent_set);
    }
    parent_set.add(p_oParentExportInfo);
}

/*---------------------------------------------------------------------------------------
 * Creates a unique key to be used to query the contents of g_classification_hm_parent2children
 * and g_classification_hm_child2parents based on the given MappingLink
 ---------------------------------------------------------------------------------------*/
function createExportInfoRelationKey(p_oParentMappingObject, p_oMappingLink) {
    var sKey = p_oParentMappingObject.getAttributeValue("id")
               + "#" + p_oMappingLink.getAttributeValue("aris_typenum")
               + "#" + p_oMappingLink.getAttributeValue("mapping_object_ref");
    var sGroupRole = p_oMappingLink.getAttributeValue("grouprole");
	if (sGroupRole != null) {
        sKey += "#" + p_oMappingLink.getAttributeValue("grouprole");
    }
    return sKey;
}
 

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                  ~~~~~~~ Classification algorithm ~~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/*---------------------------------------------------------------------------------------
 * Starts the classification based on the report execution context:
 * - if the context is the database then the classification start on the main group
 * - if the context includes groups then the classification is started on each group
 *   in sequence
 * - if the context includes Models then the classification starts directly on them
 * - if the context includes ObjDefs then the classification starts directly on them
 ---------------------------------------------------------------------------------------*/ 
function startClassification() {
    
    var oSelectedGroups = ArisData.getSelectedGroups();
    var oSelectedModels = ArisData.getSelectedModels();
    var oSelectedObjDefs = ArisData.getSelectedObjDefs();
    
    //context "Database" -> handle like context of root group
    if (oSelectedGroups.length == 0 && oSelectedModels.length == 0 && oSelectedObjDefs.length == 0) {
        var databases = ArisData.getSelectedDatabases();
        if (databases.length != 0) {
            oSelectedGroups = [databases[0].RootGroup()];
        }
    }
    
    // context "Group"
    if (oSelectedGroups.length > 0) {
        var oObjTypeNumsToSearchItemHashMap = createObjectMappingSearchItems();
        var oModelTypeNumsToSearchItemHashMap = createModelMappingSearchItems();
        for (var a=0; a<oSelectedGroups.length; a++ ) {
            startClassificationOnGroup(oSelectedGroups[a], oObjTypeNumsToSearchItemHashMap, oModelTypeNumsToSearchItemHashMap);
        }
    }

    // context "Model"    
    if (oSelectedModels.length > 0) {
        for (var b=0; b<oSelectedModels.length; b++ ) {                    
            startClassificationOnModel(oSelectedModels[b], null);
        }
    }
    
    // context "ObjDef"    
    if (oSelectedObjDefs.length > 0) {
        for (var c=0; c<oSelectedObjDefs.length; c++ ) {
            startClassificationOnObjDef(oSelectedObjDefs[c], null);
        }
    }
}

/*---------------------------------------------------------------------------------------
 * Derives a map with the format:
 * single-element ObjDef TypeNum Array (representing an <mappingObject> node) -> SearchItem
 * 
 * The map contains only entries for these <mappingObject> nodes where export relevance
 * conditions are defined.
 * The SearchItem is an AND-combination of all successfully translated
 * <exportRelevanceCondition> and <mappingCondition> nodes. Only the ObjDefs which fulfill
 * this SearchItem shall be considered for top down classification starting points in
 * order to save time.
 ---------------------------------------------------------------------------------------*/   
function createObjectMappingSearchItems() {
    
    var currentDB = ArisData.getActiveDatabase();
    var result = new java.util.HashMap();
    
    var oMappingObjectsList = getAllMappingObjects();
    var oExportRelevantMappingObjectsList = new java.util.ArrayList();
    var iter = oMappingObjectsList.iterator();
    //for those <mappingObject> nodes...
    while (iter.hasNext()) {
        var mappingNode_MappingObject = iter.next();
        var objectTypeNumString = mappingNode_MappingObject.getAttributeValue("aris_typenum");
		var objectTypeNum = getObjectTypeNum(objectTypeNumString); 
        //... which have a valid TypeNum...
        if (objectTypeNum != -1) {
            var oExportRelevanceConditionsList = getExportRelevanceConditionsForMappingObject(mappingNode_MappingObject);
            //... and export relevance conditions...
            if (oExportRelevanceConditionsList.size() > 0) {
                var oSearchRelevantConditionsList = new java.util.ArrayList();
                oSearchRelevantConditionsList.addAll( oExportRelevanceConditionsList );
                oSearchRelevantConditionsList.addAll( getMappingConditionsForMappingObject(mappingNode_MappingObject) );
                //... create a AND-combined SearchItem of all export relevance conditions and mapping conditions
                //only ObjDefs fulfilling this SearchItem are direct classification starting points
                var oSearchItem = translateConditionsToSearchItem(mappingNode_MappingObject, oSearchRelevantConditionsList, currentDB);
                result.put([objectTypeNum], oSearchItem);
            }
         }
    }
    
    return result;
}

 /*---------------------------------------------------------------------------------------
 * Derives a map with the format:
 * Array of model TypeNums (representing an <mappingModel> node) -> SearchItem
 * 
 * The map contains only entries for these <mappingModel> nodes where export relevance
 * conditions are defined.
 * The SearchItem is an AND-combination of all successfully translated
 * <exportRelevanceCondition> nodes. Only the Models which fulfill this SearchItem shall
 * be considered for top down classification starting points in order to save time.
 ---------------------------------------------------------------------------------------*/ 
function createModelMappingSearchItems() {
    
    var currentDB = ArisData.getActiveDatabase();
    var result = new java.util.HashMap();
    
    var oMappingModelsList = getAllMappingModels();
    var oExportRelevantMappingObjectsList = new java.util.ArrayList();
    var iter = oMappingModelsList.iterator();
    //for for those <mappingModel> nodes...
    while (iter.hasNext()) {
        var mappingNode_MappingModel = iter.next();
		var aModelTypeNumStrings = mappingNode_MappingModel.getAttributeValue("model_typenums").split(",");
		var aModelTypeNums = new Array();
        for (var m=0; m<aModelTypeNumStrings.length; m++) {
            var modelTypeNum = getModelTypeNum(aModelTypeNumStrings[m]);
            if (modelTypeNum != -1) {
                aModelTypeNums.push(modelTypeNum);
            }
        }
        //... which have at least one valid Model TypeNum...
        if (aModelTypeNums.length > 0) {
            var oExportRelevanceConditionsList = getExportRelevanceConditionsForMappingModel(mappingNode_MappingModel);
            //... and export relevance conditions...
            if (oExportRelevanceConditionsList.size() > 0) {
                //... create a AND-combined SearchItem of all export relevance conditions and mapping conditions
                //only Models fulfilling this SearchItem are direct classification starting points
                var oSearchItem = translateConditionsToSearchItem(null, oExportRelevanceConditionsList, currentDB);
                result.put(aModelTypeNums, oSearchItem);
            }
        }
    }
    
    return result;
}

/*---------------------------------------------------------------------------------------
 * Starts the classification on a single Group itself and in sub group recursion:
 * - searches ObjDefs based on the entries of p_oObjTypeNumsToSearchItemHashMap.
 *   All ObjDefs fulfilling a SearchItem fulfill the mapping and export relevance
 *   conditions of at least one <mappingObject> node and are thus a valid
 *   classification starting point.
 * - searches Models based on the entries of p_oModelTypeNumsToSearchItemHashMap.
 *   All Models fulfilling a SearchItem fulfill the export relevance conditions of at 
 *   least one <mappingModel> node and are thus a valid classification starting point.
 ---------------------------------------------------------------------------------------*/   
function startClassificationOnGroup(p_oContextGroup, p_oObjTypeNumsToSearchItemHashMap, p_oModelTypeNumsToSearchItemHashMap) {
    
    //search ObjDef classification candidates in recursion
    var aObjDefClassificationCandidates = new Array();
    var objDefIter = p_oObjTypeNumsToSearchItemHashMap.keySet().iterator();
    while (objDefIter.hasNext()) {
        var aObjDefTypeNums = objDefIter.next();
        var oSearchItem = p_oObjTypeNumsToSearchItemHashMap.get(aObjDefTypeNums);
        aObjDefClassificationCandidates = aObjDefClassificationCandidates.concat( p_oContextGroup.ObjDefList(true, aObjDefTypeNums, oSearchItem) );
    }
    //start classifications for those individual ObjDefs
    for (var d=0; d<aObjDefClassificationCandidates.length; d++ ) {
        startClassificationOnObjDef(aObjDefClassificationCandidates[d], p_oContextGroup);
    }
    
    //search Model classification candidates in recursion
    var aModelClassificationCandidates = new Array();
    var modelIter = p_oModelTypeNumsToSearchItemHashMap.keySet().iterator();
    while (modelIter.hasNext()) {
        var aModelTypeNums = modelIter.next();
        var oSearchItem = p_oModelTypeNumsToSearchItemHashMap.get(aModelTypeNums);
        aModelClassificationCandidates = aModelClassificationCandidates.concat( p_oContextGroup.ModelList(true, aModelTypeNums, oSearchItem) );
    }
    //start classifications for those individual Models
    for (var e=0; e<aModelClassificationCandidates.length; e++ ) {
        startClassificationOnModel(aModelClassificationCandidates[e], p_oContextGroup);
    }
}

/*---------------------------------------------------------------------------------------
 * Starts the classification on a single Model:
 * If for this model there are existing model mappings then the set of relevant object
 * mappings is derived from them
 * If the model is export relevant by attribute then all occurrences within it are
 * checked; if an ObjDef there applies to one of the relevant object mappings then
 * the main classification method is executed for this ObjDef and object mapping.
 ---------------------------------------------------------------------------------------*/ 
function startClassificationOnModel(p_oModel, p_oContextGroup) {
    //classify the Model by all relevant modelMappings
    var aMappingModels = determineRelevantMappingModels(p_oModel);
    for (var m=0; m<aMappingModels.length; m++) {
        if (!isModelExportRelevant(p_oModel, aMappingModels[m])) {continue;}  
        
        var modelMappingID = aMappingModels[m].getAttributeValue("id");
        var oDebugDecisionString = "Classification decision: by model " + getModelDebugString(p_oModel, modelMappingID);
        if (p_oContextGroup != null) {
            oDebugDecisionString += "\n# " + "Classification decision: by recursive classification of execution context group '" + p_oContextGroup.Path(g_nLoc, true, true) + "'";
        } else {
            oDebugDecisionString += "Classification decision: Model itself is part of execution context";
        }
    
        //find relevant mappingObjects via mappingModel
        var oMappingObjectsSet = getMappingObjectsForModelMapping(aMappingModels[m]);
        if (oMappingObjectsSet == null || oMappingObjectsSet.isEmpty()) {return;}

        var aObjectsToClassify = p_oModel.ObjDefList();
        for (var g=0; g<aObjectsToClassify.length; g++) {
            var aRelevantMappingObjects = determineRelevantMappingObjects(aObjectsToClassify[g], null, p_oModel, false);
            for (var r=0; r<aRelevantMappingObjects.length; r++) {
                //only consider the mappingObjects registered at the model mappings
                if (!oMappingObjectsSet.contains(aRelevantMappingObjects[r])) {continue;}
                classifyObjDef(aObjectsToClassify[g], aRelevantMappingObjects[r], p_oModel, oDebugDecisionString);
            }
        }
    }
}

/*---------------------------------------------------------------------------------------
 * Starts the classification on a single ObjDef:
 * If for this ObjDef a mapping Object exists then the main classification method is 
 * executed for this ObjDef and object mapping.
 ---------------------------------------------------------------------------------------*/ 
function startClassificationOnObjDef(p_oObjDef, p_oContextGroup) {
    var oDebugDecisionString = new java.util.ArrayList();
    if (p_oContextGroup != null) {
        oDebugDecisionString = "Classification decision: by recursive classification of execution context group '" + p_oContextGroup.Path(g_nLoc, true, true) + "'";
    } else {
        oDebugDecisionString = "Classification decision: ObjDef itself is part of execution context";
    }
    
    //classify the ObjDef by all relevant objectMappings
    var aRelevantMappingObjects = determineRelevantMappingObjects(p_oObjDef, null, null, false);
    for (var r=0; r<aRelevantMappingObjects.length; r++) {
        classifyObjDef(p_oObjDef, aRelevantMappingObjects[r], null, oDebugDecisionString);
    }
}

  
/*---------------------------------------------------------------------------------------
 * The main classification method.
 *
 * Determines all relevant mappingObjects for one given ObjDef.
 * For each found mappingObject the following steps are then performed:
 * 1. Calculate the export relevance for one given ObjDef by its attributes, its model
 *    occurrences and by its parent ObjDefs.
 * 2. Calculates the export relevance for parent ObjDefs too in bottom-up direction;
 *    the content of the mapping file defines which ObDefs are considered as parents.
 *    This step is skipped if the global flag 'g_bSkipBottomUpRecursion' is set to 'true'
 * 3. If the given ObjDef considered as export relevant then the method also calculates
 *    the export relevance of the children ObjDefs; again the content of the mapping
 *    file defines which ObDefs are considered as children.
 *
 * The calculation of export relevance by the ObjDef's attributes considers all conditions
 * within the passed condition list p_oFulfilledExportRelevanceConditionsList as fulfilled,
 * regardless of the ObjDef's attribute values.
 *
 * If the ObjDef is classified as export relevant for a relevant mappingObject then
 * it stores an ExportInfo for this combination of ObjDef and mappingObject.
 ---------------------------------------------------------------------------------------*/ 
function classifyObjDef(p_oObjDef, p_oMappingObjectNode, p_oInheritanceModel, p_oDebugDecisionString) {
    
    var aRelevantMappingObjects = new Array();
    if (p_oMappingObjectNode != null) {
        aRelevantMappingObjects.push(p_oMappingObjectNode);
    } else {
        aRelevantMappingObjects = determineRelevantMappingObjects(p_oObjDef, null, p_oInheritanceModel, false);
    }
    
    var sGUID = p_oObjDef.GUID();
    
    //classify the ObjDef for each relevant mappingObject
    for (var r=0; r<aRelevantMappingObjects.length; r++) {
        var sMappingObjectID = aRelevantMappingObjects[r].getAttributeValue("id");

        var oExportInfo = getExportInfoByGUIDsAndMappingObjectID(sGUID, null, sMappingObjectID);
        if (oExportInfo == null) {
            oExportInfo = new exportInfo(p_oObjDef, null, null, sMappingObjectID, null);
        }
        
        //determine which export relevance conditions are fulfilled by p_oInheritanceModel (if passed)
        var oExportRelevanceConditionsFulfilledByInheritanceModel = new java.util.ArrayList();
        if (p_oInheritanceModel != null) {
            var oExportRelevanceConditionsList = getExportRelevanceConditionsForMappingObject(aRelevantMappingObjects[r]);
            var conditionIter = oExportRelevanceConditionsList.iterator();
            while (conditionIter.hasNext()) {
                var oExportRelevanceCondition = conditionIter.next();
                if (evaluateModelCondition(p_oInheritanceModel, oExportRelevanceCondition)) {
                    oExportRelevanceConditionsFulfilledByInheritanceModel.add(oExportRelevanceCondition);
                }
            }
        }
        
        var oDebugStringList = new java.util.ArrayList();
    
        //check if export relevant by bottom up direction
        var exportRelevantByBottomUpDirection = classifyObjDef_BottomUp(p_oObjDef, oExportInfo, aRelevantMappingObjects[r], oExportRelevanceConditionsFulfilledByInheritanceModel, p_oDebugDecisionString, oDebugStringList);
        if (exportRelevantByBottomUpDirection) {
            //register the export info
            addExportInfo(oExportInfo, aRelevantMappingObjects[r]);
            //top-down classification
            classifyObjDef_TopDown(oExportInfo, aRelevantMappingObjects[r], null, oExportInfo.toShortString());
        } else {
            //mark as not export relevant
            storeObjDefExportRelevance(p_oObjDef, sMappingObjectID, false);
        }
    }
}


/*---------------------------------------------------------------------------------------
 * Step 1:
 * If no mappingObject is passed then first those matching are looked up by:
 *   - aris_typenum match
 *   - aris_symbolnum match (if specified)
 * Step 2: 
 * If a mappingObject was passed or matching ones were found in step 1 above then for
 * each a further check if done if all specified <mappingConditions> are fulfilled
 * (always true if there are none)
 * All mapping conditions which are not fulfilled by ObjDef can be fulfilled instead by 
 * p_oInheritanceModel if passed.
 * If no p_oInheritanceModel is passed but p_bLookupInheritanceModels is set to "true"
 * then the mapping conditions can also be fulfilled instead by any model which:
 * - has a model mapping which references:
 *      - either the given object mapping or
 *      - of of the objects mapping which fits to p_oObjDef's type and default symbol
 * - where p_oObjDef has an occurrence in
 *
 * Returns the mappingObjects which are qualified by both steps above as JS Array.
 * Empty array if there are no matching mappingObjects.
 ---------------------------------------------------------------------------------------*/
function determineRelevantMappingObjects(p_oObjDef, p_oMappingObjectNode, p_oInheritanceModel, p_bLookupInheritanceModels) {
    
    var aFoundMappingObjects = new Array();
    if (p_oMappingObjectNode == null) {
        aFoundMappingObjects = convertHashSetToJSArray(getMappingObjectsByObjDef(p_oObjDef));
    } else {
        aFoundMappingObjects.push(p_oMappingObjectNode);
    }
    
    var aRelevantMappingObjects = new Array();
    for (var f=0; f<aFoundMappingObjects.length; f++) {
        var oMappingConditionsList = getMappingConditionsForMappingObject(aFoundMappingObjects[f]);
       
        //determine inheritance models which can also fulfill mapping conditions
        var aInheritanceModels = new Array();
        if (p_oInheritanceModel != null) {
            aInheritanceModels.push(p_oInheritanceModel);
        }
        if (p_bLookupInheritanceModels) {
            aInheritanceModels = aInheritanceModels.concat( getModels(p_oObjDef, aFoundMappingObjects[f]) );
        }
        
        //determine which mapping conditions are not fulfilled by the inheritance models; these must be fulfilled by p_oObjDef itself
        var oMappingConditionsFulfilledByInheritanceModels = new java.util.ArrayList();
        var conditionIter = oMappingConditionsList.iterator();
        while (conditionIter.hasNext()) {
            var oMappingCondition = conditionIter.next();
            for (var m=0; m<aInheritanceModels.length; m++) {
                if (evaluateModelCondition(aInheritanceModels[m], oMappingCondition)) {
                    oMappingConditionsFulfilledByInheritanceModels.add(oMappingCondition);
                    break;
                }
            }
        }
        
        //only those mapping conditions are relevant which are not already fulfilled by an inheritance model
        var oRelevantMappingConditionsList = removeEquivalentConditions(oMappingConditionsList, oMappingConditionsFulfilledByInheritanceModels);
        
        if (!oRelevantMappingConditionsList.isEmpty()) {
            var sMappingObjectID = aFoundMappingObjects[f].getAttributeValue("id");
            var oTemporaryExportInfo = new exportInfo(p_oObjDef, null, null, sMappingObjectID, null);
            
            var oFulfilledConditionsList = determineFulfilledConditions(oTemporaryExportInfo, null, oRelevantMappingConditionsList, true);
            if (oFulfilledConditionsList.size() == oRelevantMappingConditionsList.size()) {
               aRelevantMappingObjects.push(aFoundMappingObjects[f]);
            }
        } else {
            aRelevantMappingObjects.push(aFoundMappingObjects[f]);
        }
    }
    return aRelevantMappingObjects;
}


/*---------------------------------------------------------------------------------------
 * Returns an JSArray all mappingModels which contain the model type num. Empty array if
 * there are no matching mappingModels.
 ---------------------------------------------------------------------------------------*/
function determineRelevantMappingModels(p_oModel) {
    var aRelevantMappingModels = convertHashSetToJSArray(getMappingModelsByModel(p_oModel));
    return aRelevantMappingModels;
}


/*---------------------------------------------------------------------------------------
 * Returns a new ArrayList which contains all conditions from p_oConditionNodesList which
 * have no equivalent condition in p_oEquivalentConditionNodesToRemoveList.
 * Note: two condition nodes are considered equivalent if they have the same attributes
 * with the same values.
 ---------------------------------------------------------------------------------------*/
function removeEquivalentConditions(p_oConditionNodesList, p_oEquivalentConditionNodesToRemoveList) {
    
    if (p_oEquivalentConditionNodesToRemoveList != null) {
        var oReducedMappingConditionsList = new java.util.ArrayList();
        var iter = p_oConditionNodesList.iterator();
        while (iter.hasNext()) {
            var oCondition = iter.next();
            var bHasEquivalentCondition = false;
            var equivaluenceIter = p_oEquivalentConditionNodesToRemoveList.iterator();
            while (equivaluenceIter.hasNext() && !bHasEquivalentCondition) {
                var oEquivalenceCheckCondition = equivaluenceIter.next();
                bHasEquivalentCondition = oCondition.isEquivalentTo(oEquivalenceCheckCondition);
            }
            if (!bHasEquivalentCondition) {
                oReducedMappingConditionsList.add(oCondition);
            }
        }
        return oReducedMappingConditionsList;
    }
    else {
        return p_oConditionNodesList;
    }
}


/*---------------------------------------------------------------------------------------
 * If an Exportinfo is passed then checks which conditions of the passed condition List
 * is fulfilled by the ExportInfo.
 * Otherwise, if a Model is passed, checks which conditions of the passed condition List
 * is fulfilled by the Model.
 * Returns a List of all fulfilled conditions.
 * If "p_bAbortOnFirstUnfulfilledCondition" is set to "true" and at least one condition
 * is not fulfilled then an empty List is returned, regardless which other conditions
 * might be fulfilled.
 ---------------------------------------------------------------------------------------*/
function determineFulfilledConditions(p_oExportInfo, p_oModel, p_oConditionsCollection, p_bAbortOnFirstUnfulfilledCondition) {
    var result = new java.util.ArrayList();
    
    if (p_oExportInfo != null) {
        var iterConditions = p_oConditionsCollection.iterator();
        while (iterConditions.hasNext()) {
            var oMappingCondition = iterConditions.next();
            if ( evaluateExportInfoCondition(p_oExportInfo, oMappingCondition, null, null) ) {
                result.add(oMappingCondition);
            } else if (p_bAbortOnFirstUnfulfilledCondition) {
                return new java.util.ArrayList();
            }
        }
    } else if (p_oModel != null) {
        var iterConditions = p_oConditionsCollection.iterator();
        while (iterConditions.hasNext()) {
            var oMappingCondition = iterConditions.next();
            if ( evaluateModelCondition(p_oModel, oMappingCondition) ) {
                result.add(oMappingCondition);
            } else if (p_bAbortOnFirstUnfulfilledCondition) {
                return new java.util.ArrayList();
            }
        }
    }
    
    return result;
}
 

/*---------------------------------------------------------------------------------------
 * Calculate the export relevance for one given ObjDef by its export relevance conditions.
 * Returns false if there are no export relevance conditions or at least one is not
 * fulfilled.
 * 
 * Returns true if there are export relevance conditions and all of them are fulfilled.
 ---------------------------------------------------------------------------------------*/ 
function classifyExportInfoByExportRelevanceConditions(p_oExportInfo, p_oPreFulfilledExportRelevanceConditionsList, p_oDebugStringList) {

    var oMappingObject = getMappingObjectByID(p_oExportInfo.sMappingObjectID);
    var oExportRelevanceConditions = getExportRelevanceConditionsForMappingObject(oMappingObject);
    if (oExportRelevanceConditions.isEmpty()) {
	storeObjDefExportRelevance(p_oExportInfo.getObjDef(), p_oExportInfo.sMappingObjectID, false);
        return false;
    }
    
    var oFulfilledConditionsList = determineFulfilledConditions(p_oExportInfo, null, oExportRelevanceConditions, true);
    var relevanceByConditionsResult = oExportRelevanceConditions.size() == oFulfilledConditionsList.size();
    //if all export relevance conditions were fulfilled by the ObjDef itself
    if (relevanceByConditionsResult) {
        storeObjDefExportRelevance(p_oExportInfo.getObjDef(), p_oExportInfo.sMappingObjectID, true);
	if (p_oDebugStringList != null) {
	    p_oDebugStringList.add(0, "ObjDef '" + getObjDefDebugString(p_oExportInfo.getObjDef(), oMappingObject) + "' is export relevant by own fulfilled export relevance conditions");
	}
        return true;
    }
    
    oExportRelevanceConditions = removeEquivalentConditions(oExportRelevanceConditions, oFulfilledConditionsList);
    oExportRelevanceConditions = removeEquivalentConditions(oExportRelevanceConditions, p_oPreFulfilledExportRelevanceConditionsList);
    //if some of the export relevance conditions were not fulfilled by the ObjDef itself but were part of the p_oPreFulfilledExportRelevanceConditionsList
    if (oExportRelevanceConditions.size() == 0) {
        storeObjDefExportRelevance(p_oExportInfo.getObjDef(), p_oExportInfo.sMappingObjectID, true);
	if (p_oDebugStringList != null) {
	    p_oDebugStringList.add(0, "ObjDef '" + getObjDefDebugString(p_oExportInfo.getObjDef(), oMappingObject) + "' is export relevant because it has an ocurrence in a model which fulfills its export relevance conditions at least partially");
	}
        return true;
    }
    
    storeObjDefExportRelevance(p_oExportInfo.getObjDef(), p_oExportInfo.sMappingObjectID, false);
    return false;
}


/*---------------------------------------------------------------------------------------
 * Checks if a given model is export relevant. This is the case if there are export
 * relevance conditions are specified (<exportRelevanceCondition>) and if all of them 
 * are fulfilled.
 * Returns true if the model is export relevant, otherwise false.
 ---------------------------------------------------------------------------------------*/   
function isModelExportRelevant(p_oModel, p_oMappingModel) {
    
    var bExportRelevant = false;
    
    var oExportRelevanceConditions = getExportRelevanceConditionsForMappingModel(p_oMappingModel);
    var iterConditions = oExportRelevanceConditions.iterator();
    while (!bExportRelevant && iterConditions.hasNext()) {
        var oExportRelevanceCondition = iterConditions.next();
        bExportRelevant = bExportRelevant || evaluateModelCondition(p_oModel, oExportRelevanceCondition);
    }
    
    return bExportRelevant;
}


/*---------------------------------------------------------------------------------------.
 * Calculates if the given child ObjDef is export relevant itself by own export relevance
 * conditions or by occurrences inside models which fulfill their export relevance
 * conditions.
 * 
 * The calculation of export relevance by the ObjDef's attributes considers all conditions
 * within the passed condition list p_oFulfilledExportRelevanceConditionsList as fulfilled,
 * regardless of the ObjDef's attribute values.
 *
 * Also calculates bottom up if at least one of the parent ObjDefs is export relevant
 * by the criteria above; the content of the mapping file defines which ObDefs are 
 * considered as parents.
 * 
 * For all parents no exportInfos are registered and no updates at the parent2children
 * and child2parents hash maps are done.
 *
 * Returns true if the child itself or at least one parent is classified as export
 * relevant, otherwise false.
 ---------------------------------------------------------------------------------------*/ 
function classifyObjDef_BottomUp(p_oChildObjDef, p_oChildExportInfo, p_oChildMappingObject, p_oPreFulfilledExportRelevanceConditionsList, p_oDebugDecisionString, p_oDebugStringList) {
    
    //if classification by bottom up recursion already determined earlier then return this result
    var storedResult = getExportRelevanceBottomUp(p_oChildObjDef, p_oChildExportInfo.sMappingObjectID);
    if (storedResult != null) {return storedResult;}
    
    //export relevant by itself
    var exportRelevantByConditions = classifyExportInfoByExportRelevanceConditions(p_oChildExportInfo, p_oPreFulfilledExportRelevanceConditionsList, p_oDebugStringList);   
    
    //export relevant by at least one parent
    //needs only to be done if the ObjDef is not export relevant by itself and bottom-up direction is desired
    var overallExportRelevantByConnectedObjects = false;
    if (!g_bSkipBottomUpRecursion && !exportRelevantByConditions) {
        
        //bottom up recursion by incoming mapping links
        var o_hm_mappingLink2ParentMappingObject = getIncomingLinks(p_oChildMappingObject);
        var linkIter = o_hm_mappingLink2ParentMappingObject.keySet().iterator();
        while (linkIter.hasNext() && !overallExportRelevantByConnectedObjects) {
            
            var oMappingLink = linkIter.next();
            //skip merge links, they are only relevant for top-down classification
            if (oMappingLink.getAttributeValue("merge_link_mapping_attribute_refs") != null) {
                continue;
            }
            //skip condition only links, these connected objects are relevant for (mapping) condition evalution only, not for actual exporting
            if (oMappingLink.getAttributeValue("condition_relevant_only") != null) {
                continue;
            }
            
            var parentMappingObject = o_hm_mappingLink2ParentMappingObject.get(oMappingLink);
            var sMappingObjectID = parentMappingObject.getAttributeValue("id");
            var aParentObjDefs = getConnectedObjectsByMapping(p_oChildObjDef, oMappingLink, true);
            
            for (var b=0; b<aParentObjDefs.length && !overallExportRelevantByConnectedObjects; b++) {
                var sParentGUID = aParentObjDefs[b].GUID();
                var oParentExportInfo = getExportInfoByGUIDsAndMappingObjectID(sParentGUID, null, sMappingObjectID);
                if (oParentExportInfo == null) {
                    oParentExportInfo = new exportInfo(aParentObjDefs[b], null, null, sMappingObjectID, null);
                }
                
                //bottom-up recursion
                //the passed export relevance conditions fulfilled by the model are *not* passed bottom up since they refer to the "direct" ObjDef only
                var exportRelevantByBottomUpRecursion = classifyObjDef_BottomUp(aParentObjDefs[b], oParentExportInfo, parentMappingObject, null, "Classification decision: Bottom-up by '" + getObjDefDebugString(p_oChildObjDef, p_oChildMappingObject) + "'", p_oDebugStringList);
                if (exportRelevantByBottomUpRecursion) {
                    overallExportRelevantByConnectedObjects = true;
                    //add debug info string for child
                    p_oDebugStringList.add(0, "ObjDef '" + getObjDefDebugString(p_oChildObjDef, p_oChildMappingObject)
                    + "' is bottom up export relevant by parent '" + getObjDefDebugString(aParentObjDefs[b], parentMappingObject)  + "'");
                }
            }
               
        } //end-while incoming links
        
        //bottom up recursion by outgoing mapping links with "inherit_export_relevance" (standard example: risks are export relevant if the connected control is export relevant)
        o_hm_mappingLink2ParentMappingObject = getOutgoingLinks(p_oChildMappingObject);
        var linkIter = o_hm_mappingLink2ParentMappingObject.keySet().iterator();
        while (linkIter.hasNext() && !overallExportRelevantByConnectedObjects) {
            
            var oMappingLink = linkIter.next();
            //skip merge links, they are only relevant for top-down classification
            if (oMappingLink.getAttributeValue("merge_link_mapping_attribute_refs") != null) {
                continue;
            }
            //skip condition only links, these connected objects are relevant for (mapping) condition evalution only, not for actual exporting
            if (oMappingLink.getAttributeValue("condition_relevant_only") != null) {
                continue;
            }
            
            //only look for "inherit_export_relevance" links
            if (oMappingLink.getAttributeValue("inherit_export_relevance") != "true") {
                continue;
            }
            
            var sExportRelevanceInheritanceChildMappingObjectID = oMappingLink.getAttributeValue("mapping_object_ref");
            var oExportRelevanceInheritanceChildMappingObject = getMappingObjectByID(sExportRelevanceInheritanceChildMappingObjectID);
            var aExportRelevanceInheritanceObjDefs = getConnectedObjectsByMapping(p_oChildObjDef, oMappingLink, false);
    
            var exportRelevantByConditionsOfDirectChild = false;
            for (var i=0; i<aExportRelevanceInheritanceObjDefs.length && !exportRelevantByConditionsOfDirectChild; i++) {
                
                var sExportRelevanceInheritanceChildGUID = aExportRelevanceInheritanceObjDefs[i].GUID();
                var oExportRelevanceInheritanceChildExportInfo = getExportInfoByGUIDsAndMappingObjectID(sExportRelevanceInheritanceChildGUID, null, sExportRelevanceInheritanceChildMappingObjectID);
                if (oExportRelevanceInheritanceChildExportInfo == null) {
                    oExportRelevanceInheritanceChildExportInfo = new exportInfo(aExportRelevanceInheritanceObjDefs[i], null, null, sExportRelevanceInheritanceChildMappingObjectID, null);
                }
                
                //the passed export relevance conditions fulfilled by the model are *not* passed bottom up since they refer to the "direct" ObjDef only
                exportRelevantByConditionsOfDirectChild = classifyExportInfoByExportRelevanceConditions(oExportRelevanceInheritanceChildExportInfo, null, p_oDebugStringList);
                if (exportRelevantByConditionsOfDirectChild) {
                    overallExportRelevantByConnectedObjects = true;
                    //store bottom up export relevant result directly because we do not enter recursion here
                    storeObjDefExportRelevanceBottomUp(aExportRelevanceInheritanceObjDefs[i], oExportRelevanceInheritanceChildExportInfo.sMappingObjectID, true);
                    //add debug info string for parent
                    if (g_bDebugStringOutput) {
                        p_oDebugStringList.add("ObjDef '" + getObjDefDebugString(p_oChildObjDef, p_oChildMappingObject)
                        + "' is bottom up export relevant in export relevance inheritance direction by child '" + getObjDefDebugString(aExportRelevanceInheritanceObjDefs[i], oExportRelevanceInheritanceChildMappingObject)  + "'");
                    }
                }
            }
            
        } //end-while outgoing links with "inherit_export_relevance"
    }
    
    //conclusion
    var bBottomUpExportRelevant = exportRelevantByConditions || overallExportRelevantByConnectedObjects;
    if (bBottomUpExportRelevant) {
        //store bottom up relevance result
        storeObjDefExportRelevanceBottomUp(p_oChildExportInfo.getObjDef(), p_oChildExportInfo.sMappingObjectID, true);
        //store debug info string for child
        if (g_bDebugStringOutput) {
            var oDebugStringList = new java.util.ArrayList();
            oDebugStringList.addAll(p_oDebugStringList);
            oDebugStringList.add(p_oDebugDecisionString);
            setExportInfoDebugStringList(p_oChildExportInfo, oDebugStringList);
        }
    } else {
        //mark as not bottom-up export relevant
        storeObjDefExportRelevanceBottomUp(p_oChildExportInfo.getObjDef(), p_oChildExportInfo.sMappingObjectID, false);
    }
    
    return bBottomUpExportRelevant;
}


/*---------------------------------------------------------------------------------------.
 * Registers the given ExportInfo for the export.
 * Follows the defined mapping links in recursion to create and register ExportInfos for
 * the linked ObjDefs.
 * One specific mapping link can be passed in the signature which
 * will be ignored for recursion. This is used for the special cases for exporting:
 *  - risks together with their connected export relevant controls
 *  - survey tasks together with their connected export relevant questionnaire templates
 * Resolves virtual mapping objects (i.e. creating multiple ExportInfos of different 
 * ARCM type for the same ObjDef).
 * Resolves merge relations between ObjDefs (i.e. created one ExportInfo for different
 * ObjDefs of the same kind, for example generic and specific risks).
 ---------------------------------------------------------------------------------------*/ 
function classifyObjDef_TopDown(p_oSourceExportInfo, p_oSourceMappingObject, p_oMappingLinkToIgnore, p_sDebugInfo) {
    
    var sMappingObjectID = p_oSourceMappingObject.getAttributeValue("id");
    
    //if earlier processed by top down recursion then do nothing
    if (isProcessedTopDown(p_oSourceExportInfo.getObjDef(), sMappingObjectID, p_oSourceExportInfo.sArcmRootGuid)) {return;}
    
    //mark the object as processed top down
    setProcessedTopDown(p_oSourceExportInfo.getObjDef(), sMappingObjectID, p_oSourceExportInfo.sArcmRootGuid);   
    
    //if the ObjDef to be classified is export relevant by its own export relevance conditions
    //then handle all links *including* the one possibly passed as to be ignored.
    //this is used for the case that a customer has marked both risks and controls as export relevant
    //and the current classification is going fromcontrol to risk
    var oMappingLinkToIgnore = p_oMappingLinkToIgnore;
    if (oMappingLinkToIgnore != null) {
        classifyExportInfoByExportRelevanceConditions(p_oSourceExportInfo, null, null);
        if (getObjDefExportRelevance(p_oSourceExportInfo.getObjDef(), sMappingObjectID)) {
            oMappingLinkToIgnore = null;
        }
    }

    //if there are no bottom up debug Strings yet then set the top down down debug Strings
    if (p_oSourceExportInfo.oDebugStringList.isEmpty() && p_sDebugInfo != null) {
        var oTopDownDebugStringList = new java.util.ArrayList();
        oTopDownDebugStringList.add(p_sDebugInfo); 
        setExportInfoDebugStringList(p_oSourceExportInfo, oTopDownDebugStringList);        
    }
    
    //set either the ARCM guid directly or contruct a query
    determineArcmGUID(p_oSourceExportInfo, p_oSourceMappingObject);
    
    //used for going into recursion via mapping links and their connected ObjDefs
    var o_hmMappingLink2ConnectedMappingObject = new java.util.HashMap();
    var o_hmMappingLink2ConnectedObjDefsSets = new java.util.HashMap();
    
    //---- 1. read targets by parent->child direction, done by following all outgoing links which are not "topDownReverse"
    var o_hm_outgoingMappingLink2TargetChildMappingObject = getOutgoingLinks(p_oSourceMappingObject);
    var linkIter = o_hm_outgoingMappingLink2TargetChildMappingObject.keySet().iterator();
    while (linkIter.hasNext()) {  
        var oMappingLink = linkIter.next();
		var sMappingLinkID = oMappingLink.getAttributeValue("id");
		
        //skip the link if it is the passed mapping link to ignore
        if (oMappingLink == oMappingLinkToIgnore) {
            continue;
        }
        
        //skip condition only links, these connected objects are relevant for (mapping) condition evalution only, not for actual exporting
        if (oMappingLink.getAttributeValue("condition_relevant_only") != null) {
            continue;
        }
        
        var sTargetMappingObjectID = oMappingLink.getAttributeValue("mapping_object_ref");
        var oTargetMappingObject = getMappingObjectByID(sTargetMappingObjectID);
          
        //virtual links which connect AppObjs which have their origin in the same ObjDef like the parent AppObjs 
        if (oTargetMappingObject.getAttributeValue("aris_typenum") == "VIRTUAL") {
            var bIsQualified = true;
			var sNeededMaintainedAttributeIDsString = oTargetMappingObject.getAttributeValue("ignore_if_referenced_attributes_not_filled");
            if (sNeededMaintainedAttributeIDsString != null) {
                var aNeededMaintainedAttributeIDs = sNeededMaintainedAttributeIDsString.split(",");
                for (var z=0; z<aNeededMaintainedAttributeIDs.length && bIsQualified; z++) {
                    var oMappingAttr = getMappingAttr(oTargetMappingObject, aNeededMaintainedAttributeIDs[z]);
                    var attrElemTypeNum = oMappingAttr.getAttributeValue("aris_typenum"); 
                    var iAttributeTypeNum = getAttributeTypeNum(attrElemTypeNum);
                    var oAttr = p_oSourceExportInfo.getObjDef().Attribute(iAttributeTypeNum, g_nLoc);
                    if (!oAttr.IsMaintained()) {
                        bIsQualified = false;
                    }
                }
            }
            if (bIsQualified) {
                //create an exportInfo for the virtual object
                var oVirtualTargetExportInfo = new exportInfo(p_oSourceExportInfo.getObjDef(), null, null, sTargetMappingObjectID, null);
                addExportInfo(oVirtualTargetExportInfo, oTargetMappingObject);
                
                //create the ARCM guid query to be executed and resolved later by export report
                var sArcmGuidQuery = constructVirtualArcmGuidQuery(oVirtualTargetExportInfo, p_oSourceExportInfo, sMappingLinkID);
                oVirtualTargetExportInfo.sArcmGuid = sArcmGuidQuery;
                
                //update parent2child and child2parent hash maps
                storeExportInfoRelation(p_oSourceExportInfo, oMappingLink, oVirtualTargetExportInfo);
                
                //create debug info
                var sDebugInfo = "Virtual ObjDef '" + getObjDefDebugString(p_oSourceExportInfo.getObjDef(), oTargetMappingObject)
                                + "' is derived from and thus top down export relevant by parent '" + getObjDefDebugString(p_oSourceExportInfo.getObjDef(), p_oSourceMappingObject)  + "'";   
                //recursion
                classifyObjDef_TopDown(oVirtualTargetExportInfo, oTargetMappingObject, null, sDebugInfo);
            }
        }
        //normal links which connect ObjDefs representing AppObjs
        else {
            var aTargetObjDefs;
            //normal links -> targets are children
            if (oMappingLink.getAttributeValue("is_top_down_reverse") != "true") {
                aTargetObjDefs = getConnectedObjectsByMapping(p_oSourceExportInfo.getObjDef(), oMappingLink, false);
            }
            //"is_top_down_reverse" links are ignored here; the top down recursion checks in a later step such links which are incoming from OTHER MappingObjects
            else {
                continue;
            }
            
            var oTargetObjDefsSet = convertJSArrayToHashSet(aTargetObjDefs);
            o_hmMappingLink2ConnectedObjDefsSets.put(oMappingLink, oTargetObjDefsSet);
            o_hmMappingLink2ConnectedMappingObject.put(oMappingLink, oTargetMappingObject);
        }
    }
    
    //---- 2. merge targets by parent->child direction, done by following all outgoing links which are merge links and not not "topDownReverse"
    linkIter = o_hm_outgoingMappingLink2TargetChildMappingObject.keySet().iterator();
    while (linkIter.hasNext()) {
        
        var oMappingLink = linkIter.next();
        
        //skip the link if it is the passed mapping link to ignore
        if (oMappingLink == oMappingLinkToIgnore) {
            continue;
        }
        
        //skip condition only links, these connected objects are relevant for (mapping) condition evalution only, not for actual exporting
        if (oMappingLink.getAttributeValue("condition_relevant_only") != null) {
            continue;
        }
		
	var sMergeLinkAttributeIDsValue = oMappingLink.getAttributeValue("merge_link_mapping_attribute_refs");
	if (sMergeLinkAttributeIDsValue == null) {
            continue;
        }
        
	var aMergeLinkAttributeIDs = sMergeLinkAttributeIDsValue.split(",");
        var oTargetChildMappingObject = o_hm_outgoingMappingLink2TargetChildMappingObject.get(oMappingLink);
        
        //find all superior ObjDef objects from which linked objects shall be copied to the current ObjDef
        var aSuperiorMergeObjDefs = getConnectedObjectsByMapping(p_oSourceExportInfo.getObjDef(), oMappingLink, false);
        for (var a=0; a<aSuperiorMergeObjDefs.length; a++) {
            
            for (var b=0; b<aMergeLinkAttributeIDs.length; b++) {
                var oMergeAttributeMappingLink = getMappingLink(oTargetChildMappingObject, aMergeLinkAttributeIDs[b]);
                //the connected ObjDefs of the subordinate merge ObjDef
                var oTargetObjDefsSet = o_hmMappingLink2ConnectedObjDefsSets.get(oMergeAttributeMappingLink);
                if (oTargetObjDefsSet == null) {
                    oTargetObjDefsSet = new java.util.HashSet();
                    o_hmMappingLink2ConnectedObjDefsSets.put(oMergeAttributeMappingLink, oTargetObjDefsSet);
                }
                
                //add all connected ObjDefs of the superior merge ObjDef, connected by the outgoing merge MappingLink
                var aSuperiorMergeConnectedObjDefs = getConnectedObjectsByMapping(aSuperiorMergeObjDefs[a], oMergeAttributeMappingLink, false);
                var oSuperiorMergeConnectedObjDefsSet = convertJSArrayToHashSet(aSuperiorMergeConnectedObjDefs);
                
                oTargetObjDefsSet.addAll(oSuperiorMergeConnectedObjDefsSet);
                var sMergeTargetMappingObjectID = oMergeAttributeMappingLink.getAttributeValue("mapping_object_ref");
                var oMergeTargetMappingObject = getMappingObjectByID(sMergeTargetMappingObjectID);
                o_hmMappingLink2ConnectedMappingObject.put(oMergeAttributeMappingLink, oMergeTargetMappingObject);
            }
        }
    }    
    
    //---- 3. merge targets by child<-parent, done by following all incoming links from OTHER MappingObjects which are marked
    //        either as "is_top_down_reverse" or as "inherit_export_relevance"
    var hm_MappingLink2ParentMappingObject = getIncomingLinks(p_oSourceMappingObject);
    linkIter = hm_MappingLink2ParentMappingObject.keySet().iterator();
    while (linkIter.hasNext()) {
        var oMappingLink = linkIter.next();
        
        //skip the link if it is the passed mapping link to ignore
        if (oMappingLink == oMappingLinkToIgnore) {
            continue;
        }
        
        //skip condition only links, these connected objects are relevant for (mapping) condition evalution only, not for actual exporting
        if (oMappingLink.getAttributeValue("condition_relevant_only") != null) {
            continue;
        }
        
        //only consider incoming links marked as "is_top_down_reverse" or "inherit_export_relevance"
        if (oMappingLink.getAttributeValue("is_top_down_reverse") != "true" && oMappingLink.getAttributeValue("inherit_export_relevance") != "true") {
            continue;
        }
        
        var oParentMappingObject = hm_MappingLink2ParentMappingObject.get(oMappingLink);
        var aParentObjDefs = getConnectedObjectsByMapping(p_oSourceExportInfo.getObjDef(), oMappingLink, true);
        var oParentObjDefsSet = convertJSArrayToHashSet(aParentObjDefs);
        o_hmMappingLink2ConnectedObjDefsSets.put(oMappingLink, oParentObjDefsSet);
        o_hmMappingLink2ConnectedMappingObject.put(oMappingLink, oParentMappingObject);
    }
        
    //---- go into top down recursion
    linkIter = o_hmMappingLink2ConnectedObjDefsSets.keySet().iterator();
    while (linkIter.hasNext()) {
        var oMappingLink = linkIter.next();
        var oTargetMappingObject = o_hmMappingLink2ConnectedMappingObject.get(oMappingLink);
        var sTargetMappingObjectID = oTargetMappingObject.getAttributeValue("id");
        
        //ignore merge links, they were handled above
        if (oMappingLink.getAttributeValue("merge_link_mapping_attribute_refs") != null) {
            continue;
        }
        
        //all target ObjDefs - direct parent->child, merged parent->child and reverse top down child<-parent
        var aTargetObjDefSet = o_hmMappingLink2ConnectedObjDefsSets.get(oMappingLink);
        var aTargetObjDefs = convertHashSetToJSArray(aTargetObjDefSet);
        
        //store target export infos and go into recursion
        for (var c=0; c<aTargetObjDefs.length; c++) {
            //lookup child export info
            var sTargetArisGUID = aTargetObjDefs[c].GUID();
            var sRootGuid = null;
            //root object -- hierarchical link --> root dependent object (example: QT -> SECTION)
            if (oTargetMappingObject.getAttributeValue("root_mapping_object_ref") == sMappingObjectID && oMappingLink.getAttributeValue("is_hierarchical") == "true") {
                // ARCM guid here is already at p_oSourceExportInfo
                sRootGuid = p_oSourceExportInfo.sArcmGuid;
            }
            //root dependent object -- hierarchical link --> root dependent object of the same type (example: SECTION -> SECTION)
            else if (p_oSourceExportInfo.sArcmRootGuid != null && sTargetMappingObjectID == sMappingObjectID && oMappingLink.getAttributeValue("is_hierarchical") == "true") {
                sRootGuid = p_oSourceExportInfo.sArcmRootGuid;
            }
            
            var oTargetExportInfo = getExportInfoByGUIDsAndMappingObjectID(sTargetArisGUID, sRootGuid, sTargetMappingObjectID); 
            if (oTargetExportInfo == null) {
                oTargetExportInfo = new exportInfo(aTargetObjDefs[c], null, sRootGuid, sTargetMappingObjectID, null);
                //calls internally determineArcmGUID() and thus sets either the ARCM guid directly or contructs a reverse query
                addExportInfo(oTargetExportInfo, oTargetMappingObject);
            }
            
            //the actual relation direction is from target to source if either:
            // - the link attribute "is_top_down_reverse" is set to "true" 
            // - the link attribute "inherit_export_relevance" is set to "true" and the link is defined at the target mappingObject 
            if ((oMappingLink.getAttributeValue("is_top_down_reverse") == "true") ||
                (oMappingLink.getAttributeValue("inherit_export_relevance") == "true" && oMappingLink.getParentMappingNode().getAttributeValue("id") == sTargetMappingObjectID) ) {
                storeExportInfoRelation(oTargetExportInfo, oMappingLink, p_oSourceExportInfo);
            }
            //for (the most) links which are not affected by these cases
            else {
                storeExportInfoRelation(p_oSourceExportInfo, oMappingLink, oTargetExportInfo);
            }
            
            //create debug info
            var sDebugInfo = "ObjDef '" + getObjDefDebugString(aTargetObjDefs[c], oTargetMappingObject)
                            + "' is top down export relevant by parent '" + getObjDefDebugString(p_oSourceExportInfo.getObjDef(), p_oSourceMappingObject)  + "'";   
            
            //recursion - when following "inherit_export_relevance" links then ignore these links in the recursion (for both directions parent->child and child->parent)
            var oTopDownMappingLinkToIgnore = null;
            if (oMappingLink.getAttributeValue("inherit_export_relevance") == "true") {
                oTopDownMappingLinkToIgnore = oMappingLink;
            }
            classifyObjDef_TopDown(oTargetExportInfo, oTargetMappingObject, oTopDownMappingLinkToIgnore, sDebugInfo);
        }
    } 
}


/*---------------------------------------------------------------------------------------
 * Determines the ObjDefs that are linked to the given ObjDef considering the given
 * mapping link.
 * If p_oSourceMappingObject is not specified then:
 *    - the given ObjDef is considered as source
 *    - the given MappingLink is considered to be defined at the MappingObject of ObjDef
 * If p_oSourceMappingObject is specified then:
 *    - the given ObjDef is considered as target
 *    - the given MappingLink is considered to be defined at the passed source MappingObject
 * In this context "Source" means the mapping object inside the XML where the mapping link
 * is defined at. "Target" means the mapping object that is referred by the mapping link.
 *
 * Returns a JSArray.
 ---------------------------------------------------------------------------------------*/ 
function getConnectedObjectsByMapping(p_oArisSourceObjDef, p_oMappingLink, p_bProcessMappingLinkReverse) {

    //---- clarify cxnTypeNum
    if (p_oMappingLink.getAttributeValue("aris_typenum") == null) {
        return new Array();
    }
    var iCxnTypeNum = getConnectionTypeNum(p_oMappingLink.getAttributeValue("aris_typenum"));  
    
    //---- clarify the source mappingObject and target mappingObject
    oSourceMappingObject = getMappingObjectOfMappingLink(p_oMappingLink);
    oTargetMappingObject = getMappingObjectByID(p_oMappingLink.getAttributeValue("mapping_object_ref"));
    
    //---- clarify if the connected objects to look up are the linkMapping source or linkMapping target
    var oArisConnectedMappingObject;
    if (p_bProcessMappingLinkReverse) {
        oArisConnectedMappingObject = oSourceMappingObject;
    } else {
        oArisConnectedMappingObject = oTargetMappingObject;
    } 
    
    //narrow by <linkCondition> - if link has conditions specified the link SOURCE must fulfill
    var oLinkConditions = p_oMappingLink.getChildren("linkCondition");
    if (oLinkConditions != null && !oLinkConditions.isEmpty()) {
        var oTemporarySourceExportInfo = new exportInfo(p_oArisSourceObjDef, null, null, oSourceMappingObject.getAttributeValue("id"), null);
        
        var oFulfilledLinkConditions = determineFulfilledConditions(oTemporarySourceExportInfo, null, oLinkConditions, true);
        //return no linked objects if source does not fulfill all <linkCondition>s
        if (oFulfilledLinkConditions.size() != oLinkConditions.size()) {
            return new Array();
        }
    }
    
    
    //---- clarify typeNum of connected ARIS ObjDefs
    var iConnectObjTypeNum = -1;
    if (oArisConnectedMappingObject.getAttributeValue("aris_typenum") != null) {
        
        var connectedObjTypeNumString = oArisConnectedMappingObject.getAttributeValue("aris_typenum");
        //never return connected objects for links whose target object mapping is of type "VIRTUAL" are 
        if (connectedObjTypeNumString == "VIRTUAL") {
            return new Array();
        }     
        var connectedObjTypeNumString = oArisConnectedMappingObject.getAttributeValue("aris_typenum");
        iConnectObjTypeNum = getObjectTypeNum(connectedObjTypeNumString);
    }
    
    
    //---- clarify symbolNums of connected ARIS ObjDefs
    var oConnectSymbolTypeNumSet = new java.util.HashSet();
    if (oArisConnectedMappingObject.getAttributeValue("aris_symbolnum") != null) {
        var connectedSymbolTypeNumString = oArisConnectedMappingObject.getAttributeValue("aris_symbolnum");
        var aSplittedConnectedSymbolTypeNumStrings = connectedSymbolTypeNumString.split(",");
        for (var a=0; a<aSplittedConnectedSymbolTypeNumStrings.length; a++) {
            var symbolNum = getSymbolTypeNum(aSplittedConnectedSymbolTypeNumStrings[a]);
            if (symbolNum != -1) {
                oConnectSymbolTypeNumSet.add(symbolNum);
            }
        }
    }

    
    //---- clarify cxn typeNums
    var aCxnKinds = new Array();

	var jsDirectionsString = p_oMappingLink.getAttributeValue("direction");
    if (jsDirectionsString != null) {
        jsDirectionsString = jsDirectionsString + "";
        var aDirectionStrings = jsDirectionsString.split("|");
        for (var d=0; d<aDirectionStrings.length; d++) {
            var cxnKind = null;
            if (aDirectionStrings[d] == "out" || aDirectionStrings[d] == "assign_out") {
                cxnKind = Constants.EDGES_OUT;
                if (p_bProcessMappingLinkReverse) {
                    cxnKind = Constants.EDGES_IN;
                }
                if (aDirectionStrings[d] == "assign_out") {
                    cxnKind = cxnKind | Constants.EDGES_ASSIGN;
                }
            }
            if (aDirectionStrings[d] == "in" || aDirectionStrings[d] == "assign_in") {
                cxnKind = Constants.EDGES_IN;
                if (p_bProcessMappingLinkReverse) {
                    cxnKind = Constants.EDGES_OUT;
                }
                if (aDirectionStrings[d] == "assign_in") {
                    cxnKind = cxnKind | Constants.EDGES_ASSIGN;
                }
            }
            
            if (cxnKind != null) {
                aCxnKinds.push(cxnKind);
            }
        }
    }
    
    //---- look up connected objects for all cxnTypeNums
    var aConnectedObjects = new Array();
    for (var c=0; c<aCxnKinds.length; c++) {
        aConnectedObjects = aConnectedObjects.concat( getConnectedObjects(  p_oArisSourceObjDef, //ARIS source
                                                                            aCxnKinds[c], iCxnTypeNum, //ARIS connection
                                                                            iConnectObjTypeNum, oConnectSymbolTypeNumSet, //ARIS target
                                                                            oSourceMappingObject, p_oMappingLink, oTargetMappingObject, //definition source mappingObject -- source mappingLink --> target mappingObject
                                                                            p_bProcessMappingLinkReverse) ); 
    }
    
    return aConnectedObjects;
} 


/*---------------------------------------------------------------------------------------
 * Determines the ObjDefs that are linked to the given object considering the 
 * derived connecetion directions, CxnTypeNum, ObjTypeNum, SymbolTypeNum and mapping 
 * conditions of the linked object.
 * ObjTypeNum and SymbolTypeNum are optional - if not needed then they can be null or -1.
 * Mapping conditions are optional - but once they are specified they must be fulfilled.
 * Returns a JSArray.
 ---------------------------------------------------------------------------------------*/ 
function getConnectedObjects(p_oObjDef, p_iCxnKind, p_iCxnTypeNum, p_iConnectObjTypeNum, p_oConnectSymbolTypeNumSet, p_oSourceMappingObject, p_oMappingLink, p_oTargetMappingObject, p_bProcessMappingLinkReverse) {
    var aConnectedObjDefs = new Array();
    
    var oCxns = null;
	if (p_iCxnTypeNum != -1) {
		oCxns = p_oObjDef.CxnListFilter(p_iCxnKind, p_iCxnTypeNum);
	} else {
		oCxns = p_oObjDef.CxnListFilter(p_iCxnKind);
	}
    
    var bAssignmentConnectionsOnly = Constants.EDGES_ASSIGN == (p_iCxnKind & Constants.EDGES_ASSIGN);
    
    var bSkipAssignmentConnections = false;
    if (p_oMappingLink.getAttributeValue("restrict_assignment_connections") == "true") {
       bSkipAssignmentConnections = oCxns.length != 1;
    }
    
    var sGroupRoleRestriction = p_oMappingLink.getAttributeValue("grouprole");
    
    for (var i = 0; i < oCxns.length; i++ ) { 
        //skip if the connection is normal and we wanted assignment connections only
        if (bAssignmentConnectionsOnly && !oCxns[i].isImplicitCxn()) {
            continue;
        }
        //skip if the connection is assignment and we wanted normal connections only
        if (!bAssignmentConnectionsOnly && oCxns[i].isImplicitCxn()) {
            continue;
        }
        
        //skip if we allow both, have more than one assignment connection and decided to restrict them (for example at hierarchy "children" link)
        if (bSkipAssignmentConnections && oCxns[i].isImplicitCxn()) {
            continue;
        }

		//narrow by conditions from <linkConnectionCondition>
        if (!checkLinkConnectionCondition(p_oMappingLink, oCxns[i])) {
            continue;
        }

        //ignore cycle connections to itself
        if (oCxns[i].SourceObjDef().GUID() == oCxns[i].TargetObjDef().GUID()) {
            continue; 
        }
        
        var oConnectedObjDef;
        if ( oCxns[i].SourceObjDef().equals(p_oObjDef) ) {
            oConnectedObjDef = oCxns[i].TargetObjDef();
        } else {
            oConnectedObjDef = oCxns[i].SourceObjDef();                
        }
        
        //narrow by target ObjDef type
		if (!p_iConnectObjTypeNum != null && p_iConnectObjTypeNum != -1 && oConnectedObjDef.TypeNum() != p_iConnectObjTypeNum) {
			continue; 
		}
        
        //narrow by target symbol types
		if (!p_oConnectSymbolTypeNumSet.isEmpty()
            && !p_oConnectSymbolTypeNumSet.contains(oConnectedObjDef.getDefaultSymbolNum())) {
			continue; 
		}
        
        //narrow target USERGROUPs by 'grouprole' of link
        if (p_oTargetMappingObject.getAttributeValue("id") == "USERGROUP" && sGroupRoleRestriction != null) {       
            if (!p_bProcessMappingLinkReverse) {
                //determine the grouprole information on the fly if needed and compare it
                if (!groupRoleStringMatches(oConnectedObjDef, sGroupRoleRestriction)) {
                    continue;
                }
            } else {
                //determine the grouprole information on the fly if needed and compare it
                if (!groupRoleStringMatches(p_oObjDef, sGroupRoleRestriction)) {
                    continue;
                }
            }
        }
        
        //narrow by conditions from <mappingCondition>
        if (!p_bProcessMappingLinkReverse) {
            if (determineRelevantMappingObjects(oConnectedObjDef, p_oTargetMappingObject, null, true).length == 0) {
                continue;
            }
        } else {
            if (determineRelevantMappingObjects(oConnectedObjDef, p_oSourceMappingObject, null, true).length == 0) {
                continue;
            }
        }
        
        //narrow by conditions from <linkTargetCondition>
        if (!p_bProcessMappingLinkReverse) {
            if (!checkLinkTargetCondition(p_oMappingLink, oConnectedObjDef, p_oTargetMappingObject)) {
                continue;
            }
        } else {
            if (!checkLinkTargetCondition(p_oMappingLink, p_oObjDef, p_oTargetMappingObject)) {
                continue;
            }
        }
         
		//connected ObjDef is qualified
        aConnectedObjDefs.push(oConnectedObjDef);
        
		if ( isboolattributetrue(oCxns[i], Constants.AT_DEACT, g_nLoc) ) {
			storeLinkDeactivated(p_oObjDef, oConnectedObjDef);
		}
        
        //store the CxnDef objects where mapping attributes are defined - export report will need to access them later
        if (p_oMappingLink.getChildren("mappingAttr").size() > 0) {
            sMappingLinkID = p_oMappingLink.getAttributeValue("id");
            storeCxnDefInfo(p_oObjDef, oConnectedObjDef, sMappingLinkID, oCxns[i]);
        }
    }    
    return aConnectedObjDefs;
}


/*---------------------------------------------------------------------------------------
 * Checks if a CxnDef fulfills the <linkConnectionCondition>s of the given MappingLink.
 * Returns true if the connection fulfills the condition, otherwise false.
 ---------------------------------------------------------------------------------------*/
function checkLinkConnectionCondition(p_oLinkSourceMappingLink, p_oCxnDefToCheck) {
    
    var oLinkConnectionConditions = p_oLinkSourceMappingLink.getChildren("linkConnectionCondition");
    if (oLinkConnectionConditions.isEmpty()) {
        return true;
    }
    
    var bResult = true;
    var iter = oLinkConnectionConditions.iterator();
    while (bResult && iter.hasNext()) {
        var oLinkConnectionCondition = iter.next();
        bResult = bResult && evaluateConnectionCondition(p_oCxnDefToCheck, oLinkConnectionCondition);
    }
    
    return bResult;
}


/*---------------------------------------------------------------------------------------
 * Checks if a target ObjDef fulfills the <linkTargetCondition>s of the given
 * MappingLink.
 * Returns true if the target fulfills the condition, otherwise false.
 ---------------------------------------------------------------------------------------*/
function checkLinkTargetCondition(p_oLinkSourceMappingLink, p_oLinkTargetObjDef, p_oLinkTargetMappingObject) {
    
    var oLinkTargetConditions = p_oLinkSourceMappingLink.getChildren("linkTargetCondition");
    if (oLinkTargetConditions.isEmpty()) {
        return true;
    }

    var oTemporaryTargetExportInfo = new exportInfo(p_oLinkTargetObjDef, null, null, p_oLinkTargetMappingObject.getAttributeValue("id"), null);
    var oFulfilledLinkTargetConditions = determineFulfilledConditions(oTemporaryTargetExportInfo, null, oLinkTargetConditions, true);
    return oFulfilledLinkTargetConditions.size() == oLinkTargetConditions.size();
}
 
 
/*---------------------------------------------------------------------------------------
 * Backward compatibility for old AT_DEACT usages.
 * Checks if the link between two given ObjDef is deactivated. The connection's direction
 * does not matter.
 * Returns either the boolean "true" or an empty String if the link is not deactivated
 ---------------------------------------------------------------------------------------*/
function isLinkDeactivated(objDef1, objDef2) {
    var bLinkDeactivated = g_deactivatedLinkSet.contains(objDef1.GUID() + "|" + objDef2.GUID())
                           || g_deactivatedLinkSet.contains(objDef2.GUID() + "|" + objDef1.GUID());
    if (bLinkDeactivated) {
        return bLinkDeactivated;
    } else {
        return "";
    }
}


/*---------------------------------------------------------------------------------------
 * Backward compatibility for old AT_DEACT usages.
 * Stores the info if the link between two given ObjDefs is deactivated.
 ---------------------------------------------------------------------------------------*/
function storeLinkDeactivated(objDef1, objDef2) {
    g_deactivatedLinkSet.add(objDef1.GUID() + "|" + objDef2.GUID());
}


/*---------------------------------------------------------------------------------------
 * Stores a CxnDef with the info which ObjDefs it connects under which MappingLink.
 ---------------------------------------------------------------------------------------*/
function storeCxnDefInfo(p_oParentObjDef, p_oChildObjDef, p_sMappingLinkID, p_oCxnDef) {
    var sKey = p_oParentObjDef.GUID() + "#" + p_oChildObjDef.GUID() + "#" + p_sMappingLinkID;
    g_classification_hm_parentChildAttrID2cxnDef.put(sKey, p_oCxnDef);
}


/*---------------------------------------------------------------------------------------
 * Returns a CxnDef based on the info which ObjDefs it connects under which MappingLink.
 ---------------------------------------------------------------------------------------*/
function getCxnDefInfo(p_oParentObjDef, p_oChildObjDef, p_sMappingLinkID) {
    var sKey = p_oParentObjDef.GUID() + "#" + p_oChildObjDef.GUID() + "#" + p_sMappingLinkID;
    return g_classification_hm_parentChildAttrID2cxnDef.get(sKey);
}


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               ~~~~~~~ Model mapping handling ~~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  
/*---------------------------------------------------------------------------------------
 * Deterines the mapped models where the given object has an occurrence and returns them
 * as a JS array.
 * If there are export relevant models then they are returned, sorted by their guids.
 * Otherwise all non export relevant models are inserted, sorted by their guids.
 ---------------------------------------------------------------------------------------*/
function getModels(p_objDef, p_oMappingObject) {
    
    var oMappingModelsByMappingObject = getMappingModelsByMappingObject(p_oMappingObject);
    
    var oObjOccList = p_objDef.OccList();
    var aExportRelevantModels = new Array();
    var aNonExportRelevantModels = new Array();    
    for (var i = 0 ; i < oObjOccList.length ; i++) {
        var oModel = oObjOccList[i].Model();
        var oMappingModelsByModel = getMappingModelsByModel(oModel);
        var oIntersectionMappingModels = new java.util.HashSet(oMappingModelsByModel);
        oIntersectionMappingModels.retainAll(oMappingModelsByMappingObject);
        
        //check if the model is export relevant by at least one of its modelMappings
        var bExportRelevant = false;
        var iter = oIntersectionMappingModels.iterator();
        while (iter.hasNext() && !bExportRelevant) {
            var oMappingModel = iter.next();
            bExportRelevant = bExportRelevant || isModelExportRelevant(oModel, oMappingModel);
        }
        
        if (bExportRelevant) {
            aExportRelevantModels.push(oModel);
        } else {
            aNonExportRelevantModels.push(oModel);
        }
    }
    
    //sort the models by guid - function 'sortByGUID' from arcm-common.js
    aExportRelevantModels.sort(sortByGUID);
    aNonExportRelevantModels.sort(sortByGUID);
    //find best candidate
    if (aExportRelevantModels.length > 0) {return aExportRelevantModels;}
    if (aNonExportRelevantModels.length > 0) {return aNonExportRelevantModels;}
    //return empty array if there are no candidates at all
    return new Array();
}


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               ~~~~~~~ ARCM guid handling ~~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  
function determineArcmGUID(p_oExportInfo, p_oMappingObject) {
    
    //skip if the ARCM guid was already determined before
    if (p_oExportInfo.sArcmGuid != null) {
        return;
    }
    
    //for non-root-depending objects the ARCM guid equals the ARIS guid
    if (p_oMappingObject.getAttributeValue("root_mapping_object_ref") == null
        || p_oMappingObject.getAttributeValue("arcm_root_reverse_connection_attr") == null
        || p_oMappingObject.getAttributeValue("arcm_guid_attr") == null) {
        //if ARCM guid is not set already then set it equal to ARIS guid
        if (p_oExportInfo.sArcmGuid == null) {
            // ARCM guid is already set at ObjDef (i.e. it represents a ARCM managed user group) then use this...
            if (p_oExportInfo.getObjDef().Attribute(Constants.AT_ARCM_GUID, g_nLoc).IsMaintained()) {
                p_oExportInfo.sArcmGuid = p_oExportInfo.getObjDef().Attribute(Constants.AT_ARCM_GUID, g_nLoc).getValue();
            }
            //... otherwise just use the ObjDef's ARIS guid
            else {
                p_oExportInfo.sArcmGuid = p_oExportInfo.sArisGuid;
            }
        }
    }
    //construct ARCM guid query
    else {
        p_oExportInfo.sArcmGuid = constructRootReverseArcmGuidQuery(p_oExportInfo);
    }
}


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               ~~~~~~~ Dependent sections and questions ~~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/*---------------------------------------------------------------------------------------
 * Parses all classified questionnaire templates in order to resolve dependent sections
 * and questions in it.
 ---------------------------------------------------------------------------------------*/
function classifyDependentSectionsAndQuestions() {
    var oQuestionnaireTemplateExportInfosSet = getExportInfosByMappingObjectID("QUESTIONNAIRE_TEMPLATE");
    var qtExportInfoIterator = oQuestionnaireTemplateExportInfosSet.iterator();
    while (qtExportInfoIterator.hasNext()) {
        var qtExportInfo = qtExportInfoIterator.next();
        
        var oExplicitSectionExportInfosSet = new java.util.HashSet();
        var oExplicitQuestionExportInfosSet = new java.util.HashSet();
        determineExplicitSectionsAndQuestionsForQT(qtExportInfo, oExplicitSectionExportInfosSet, oExplicitQuestionExportInfosSet);
            
        var qtMappingObject = getMappingObjectByID("QUESTIONNAIRE_TEMPLATE");
        var sectionMappingLink = getMappingLink(qtMappingObject, "sections");
        var sectionLinkKey = createExportInfoRelationKey(qtMappingObject, sectionMappingLink);

        var oLinkedTopSectionExportInfos = getChildExportInfoSet(qtExportInfo, sectionLinkKey);
        var oTopSectionIter = oLinkedTopSectionExportInfos.iterator();
        while (oTopSectionIter.hasNext()) {
            var oTopSectionExportInfo = oTopSectionIter.next();
            var oAlreadyRecursivelyParsedSectionExportInfoSet = new java.util.HashSet();
            oAlreadyRecursivelyParsedSectionExportInfoSet.add(oTopSectionExportInfo);
            parseSectionRecursiveForImplicitPlacings(   qtExportInfo,
                                                        qtExportInfo, null, 
                                                        oTopSectionExportInfo,
                                                        oExplicitSectionExportInfosSet, oExplicitQuestionExportInfosSet,
                                                        oAlreadyRecursivelyParsedSectionExportInfoSet);
        } 
    }
}

/*---------------------------------------------------------------------------------------
 * Resolves the dependencies of sections and questions and at the same times classifies
 * all sections, questions, option sets and options.
 ---------------------------------------------------------------------------------------*/
function parseSectionRecursiveForImplicitPlacings(  p_oQTExportInfo,
                                                    p_oPositioningQTExportInfo,  p_oPositioningSectionExportInfo,
                                                    p_oSuperiorSectionExportInfo,
                                                    p_oExplicitSectionExportInfosSet, p_oExplicitQuestionExportInfosSet,
                                                    p_oAlreadyRecursivelyParsedSectionExportInfoSet) {
    
    var qtMappingObject = getMappingObjectByID("QUESTIONNAIRE_TEMPLATE");
    var sectionMappingObject = getMappingObjectByID("SECTION");
    var questionMappingObject = getMappingObjectByID("QUESTION");
    var optionSetMappingObject = getMappingObjectByID("OPTIONSET");
    
    var topSectionsMappingLink = getMappingLink(qtMappingObject, "sections");
    var subSectionsMappingLink = getMappingLink(sectionMappingObject, "subSections");
    
    //section -> section
    var aSubSectionObjDefs = getConnectedObjectsByMapping(p_oSuperiorSectionExportInfo.getObjDef(), subSectionsMappingLink, false);
    for (var s=0; s<aSubSectionObjDefs.length; s++) {
        var oSubSectionExportInfo = getOrCreateExportInfoAndEnsureLink(aSubSectionObjDefs[s], "SECTION", p_oSuperiorSectionExportInfo, subSectionsMappingLink, true);
        //recursion
        if (!p_oAlreadyRecursivelyParsedSectionExportInfoSet.add(oSubSectionExportInfo)) {
            parseSectionRecursiveForImplicitPlacings(   p_oQTExportInfo,
                                                        null, p_oSuperiorSectionExportInfo,
                                                        oSubSectionExportInfo, 
                                                        p_oExplicitSectionExportInfosSet, p_oExplicitQuestionExportInfosSet,
                                                        p_oAlreadyRecursivelyParsedSectionExportInfoSet);
        }
    }
    
    //section -> question 
    var questionsMappingLink = getMappingLink(sectionMappingObject, "questions");
    var aQuestionObjDefs = getConnectedObjectsByMapping(p_oSuperiorSectionExportInfo.getObjDef(), questionsMappingLink, false);
    
    for (var q=0; q<aQuestionObjDefs.length; q++) {
        var oQuestionExportInfo = getOrCreateExportInfoAndEnsureLink(aQuestionObjDefs[q], "QUESTION", p_oSuperiorSectionExportInfo, questionsMappingLink, true);
        
        //question -> option set
        var optionSetMappingLink = getMappingLink(questionMappingObject, "optionSet");
        var aOptionSetObjDefs = getConnectedObjectsByMapping(oQuestionExportInfo.getObjDef(), optionSetMappingLink, false);
        
        var aOptionExportInfos = new Array();
        for (var os=0; os<aOptionSetObjDefs.length; os++) {
            var oOptionSetExportInfo = getOrCreateExportInfoAndEnsureLink(aOptionSetObjDefs[os], "OPTIONSET", oQuestionExportInfo, optionSetMappingLink, true);
            
            //option set -> option
            var optionMappingLink = getMappingLink(optionSetMappingObject, "options");
            var aOptionObjDefs = getConnectedObjectsByMapping(oOptionSetExportInfo.getObjDef(), optionMappingLink, false);
            
            for (var o=0; o<aOptionObjDefs.length; o++) {
                var oOptionExportInfo = getOrCreateExportInfoAndEnsureLink(aOptionObjDefs[o], "OPTION", oOptionSetExportInfo, optionMappingLink, true);
                aOptionExportInfos.push(oOptionExportInfo);
            }
        }
        
        //question -> option
        var optionMappingLink = getMappingLink(questionMappingObject, "options");
        var aOptionObjDefs = getConnectedObjectsByMapping(oQuestionExportInfo.getObjDef(), optionMappingLink, false);
        for (var o=0; o<aOptionObjDefs.length; o++) {
            var oOptionExportInfo = getOrCreateExportInfoAndEnsureLink(aOptionObjDefs[o], "OPTION", oQuestionExportInfo, optionMappingLink, true);
            aOptionExportInfos.push(oOptionExportInfo);
        }
        
        for (var z=0; z<aOptionExportInfos.length; z++) {
            //option -> implicit question
            var dependingQuestionMappingLink = getMappingLink(questionMappingObject, "activatedBy");
            var aDependingQuestionsObjDefs = getConnectedObjectsByMapping(aOptionExportInfos[z].getObjDef(), dependingQuestionMappingLink, true);
            
            for (var d=0; d<aDependingQuestionsObjDefs.length; d++) {
                var oDependingQuestionExportInfo = getOrCreateExportInfoAndEnsureLink(aDependingQuestionsObjDefs[d], "QUESTION", aOptionExportInfos[z], dependingQuestionMappingLink, false);
                
                // ensure linked option sets are exported at the dependent question
                var optionSetMappingLink = getMappingLink(questionMappingObject, "optionSet");
                var aDependingOptionSetDefs = getConnectedObjectsByMapping(aDependingQuestionsObjDefs[d], optionSetMappingLink, false);
                for (var os=0; os<aDependingOptionSetDefs.length; os++) {
                    getOrCreateExportInfoAndEnsureLink(aDependingOptionSetDefs[os], "OPTIONSET", oDependingQuestionExportInfo, optionSetMappingLink, true);
                }
                // ensure linked options are exported at the dependent question
                var optionsMappingLink = getMappingLink(questionMappingObject, "options");
                var aDependingOptionDefs = getConnectedObjectsByMapping(aDependingQuestionsObjDefs[d], optionsMappingLink, false);
                for (var op=0; op<aDependingOptionDefs.length; op++) {
                    getOrCreateExportInfoAndEnsureLink(aDependingOptionDefs[op], "OPTION", oDependingQuestionExportInfo, optionsMappingLink, true);
                }

                //activation context
                var activationContextQuestionMappingLink = getMappingLink(questionMappingObject, "activatedInContextWith");
                var aActivationContextQuestionsObjDefs = getConnectedObjectsByMapping(oDependingQuestionExportInfo.getObjDef(), activationContextQuestionMappingLink, false);
                for (var c=0; c<aActivationContextQuestionsObjDefs.length; c++) {
                    var oActivationContextQuestionExportInfo = getOrCreateExportInfoAndEnsureLink(aActivationContextQuestionsObjDefs[c], "QUESTION", oDependingQuestionExportInfo, activationContextQuestionMappingLink, true);
                }
                
                //if the question is not an explicit one somewhere else in the questionnaire template then we must create an implicit placing 
                //under the *superior* section
                if (!hasExplicitEquivalent(oDependingQuestionExportInfo, p_oExplicitQuestionExportInfosSet)) {
                    //the position of the depending question shall be directly after the superior question (=oQuestionExportInfo)
                    storeExportInfoRelation(p_oSuperiorSectionExportInfo, questionsMappingLink, oDependingQuestionExportInfo, oQuestionExportInfo);
                }  
            }
            
            //option -> implicit section
            var dependingSectionMappingLink = getMappingLink(sectionMappingObject, "activatedBy");
            var aDependingSectionsObjDefs = getConnectedObjectsByMapping(aOptionExportInfos[z].getObjDef(), dependingSectionMappingLink, true);
            
            for (var d=0; d<aDependingSectionsObjDefs.length; d++) {
                
                var oDependingSectionExportInfo = getExportInfoByGUIDsAndMappingObjectID(aDependingSectionsObjDefs[d].GUID(), p_oQTExportInfo.sArcmGuid, "SECTION");
                if (oDependingSectionExportInfo == null) {
                    oDependingSectionExportInfo = new exportInfo(aDependingSectionsObjDefs[d], null, p_oQTExportInfo.sArcmGuid, "SECTION", null);
                }
                
                // skip depending section if it was already processed before within this recursion scope
                if (hasExplicitEquivalent(oDependingSectionExportInfo, p_oAlreadyRecursivelyParsedSectionExportInfoSet)) {
                    continue;
                }
                else {
                    p_oAlreadyRecursivelyParsedSectionExportInfoSet.add(oDependingSectionExportInfo);
                }
                
                var bIsExplicitSection = hasExplicitEquivalent(oDependingSectionExportInfo, p_oExplicitSectionExportInfosSet);
                if (!bIsExplicitSection) {
                    //create a separate new export info for depending sections
                    addExportInfo(oDependingSectionExportInfo, sectionMappingObject);
                }
                storeExportInfoRelation(oDependingSectionExportInfo, dependingSectionMappingLink, aOptionExportInfos[z]);
                
                //activation context
                var activationContextQuestionMappingLink = getMappingLink(sectionMappingObject, "activatedInContextWith");
                var aActivationContextQuestionsObjDefs = getConnectedObjectsByMapping(oDependingSectionExportInfo.getObjDef(), activationContextQuestionMappingLink, false);
                for (var c=0; c<aActivationContextQuestionsObjDefs.length; c++) {
                    var oActivationContextQuestionExportInfo = getOrCreateExportInfoAndEnsureLink(aActivationContextQuestionsObjDefs[c], "QUESTION", oDependingSectionExportInfo, activationContextQuestionMappingLink, true);
                }
                
                //if the section is not an explicit one somewhere else in the questionnaire template then we must create an implicit placing
                //under the *positioning* questionnaire template or section
                if (!bIsExplicitSection) {
                    if (p_oPositioningQTExportInfo != null) {
                        //the position of the depending section shall be directly after the superior section (=p_oSuperiorSectionExportInfo)
                        storeExportInfoRelation(p_oPositioningQTExportInfo, topSectionsMappingLink, oDependingSectionExportInfo, p_oSuperiorSectionExportInfo);
                        
                        //create query for depending section based on positioning section ARCM guid...
                        var sGuidQuery = constructQTDependingSectionArcmGuidQuery(p_oPositioningQTExportInfo, oDependingSectionExportInfo)
                        //... and resolve it directly
                        oDependingSectionExportInfo.sArcmGuid = resolveArcmGuidQuery(sGuidQuery, sectionMappingObject);
                    }
                    if (p_oPositioningSectionExportInfo != null) {
                        //the position of the depending section shall be directly after the superior section (=p_oSuperiorSectionExportInfo)
                        storeExportInfoRelation(p_oPositioningSectionExportInfo, subSectionsMappingLink, oDependingSectionExportInfo, p_oSuperiorSectionExportInfo);
                        
                        //if for positioning section the ARCM guid query is not resolved yet: do it now 
                        if (isARCMGuidQuery(p_oPositioningSectionExportInfo.sArcmGuid)) {
                            p_oPositioningSectionExportInfo.sArcmGuid = resolveArcmGuidQuery(p_oPositioningSectionExportInfo.sArcmGuid, sectionMappingObject);
                        }
                        
                        //create query for depending section based on positioning section ARCM guid...
                        var sGuidQuery = constructSectionDependingSectionArcmGuidQuery(p_oPositioningSectionExportInfo, oDependingSectionExportInfo);
                        //... and resolve it directly
                        oDependingSectionExportInfo.sArcmGuid = resolveArcmGuidQuery(sGuidQuery, sectionMappingObject);
                    }
                }  
                
                //recursion
                parseSectionRecursiveForImplicitPlacings(   p_oQTExportInfo,
                                                            p_oPositioningQTExportInfo,  p_oPositioningSectionExportInfo,
                                                            oDependingSectionExportInfo, 
                                                            p_oExplicitSectionExportInfosSet, p_oExplicitQuestionExportInfosSet,
                                                            p_oAlreadyRecursivelyParsedSectionExportInfoSet);
            }
            
        } //end option iterator
    } // end question iterator 
}

/*---------------------------------------------------------------------------------------
 * Convenience method to determine which sections and questions have explicit placings
 * inside a questionnaire template.
 ---------------------------------------------------------------------------------------*/
function determineExplicitSectionsAndQuestionsForQT(p_qtExportInfo, p_oExplicitSectionExportInfosSet, p_oExplicitQuestionExportInfosSet) {
    var qtMappingObject = getMappingObjectByID("QUESTIONNAIRE_TEMPLATE");
    var sectionMappingLink = getMappingLink(qtMappingObject, "sections");
    var sectionLinkKey = createExportInfoRelationKey(qtMappingObject, sectionMappingLink);
    
    var oLinkedTopSectionExportInfosSet = getChildExportInfoSet(p_qtExportInfo, sectionLinkKey)
    var oTopSectionIter = oLinkedTopSectionExportInfosSet.iterator();
    while (oTopSectionIter.hasNext()) {
        var oTopSectionInfo = oTopSectionIter.next();
        var sectionResult = determineExplicitSectionsAndQuestionsForSection(oTopSectionInfo, p_oExplicitSectionExportInfosSet, p_oExplicitQuestionExportInfosSet);
    }
}

/*---------------------------------------------------------------------------------------
 * Recursive convenience method used by determineExplicitSectionsAndQuestionsForQT.
 ---------------------------------------------------------------------------------------*/
function determineExplicitSectionsAndQuestionsForSection(p_sectionExportInfo, p_oExplicitSectionExportInfosSet, p_oExplicitQuestionExportInfosSet) {
    
    if (!p_oExplicitSectionExportInfosSet.add(p_sectionExportInfo)) {
        return;
    }
    
    var sectionMappingObject = getMappingObjectByID("SECTION");
    
    var questionMappingLink = getMappingLink(sectionMappingObject, "questions");
    var questionLinkKey = createExportInfoRelationKey(sectionMappingObject, questionMappingLink);
    
    var questionIter = getChildExportInfoSet(p_sectionExportInfo, questionLinkKey).iterator();
    while (questionIter.hasNext()) {
        p_oExplicitQuestionExportInfosSet.add(questionIter.next());
    }
    
    var subSectionMappingLink = getMappingLink(sectionMappingObject, "subSections");
    var subSectionLinkKey = createExportInfoRelationKey(sectionMappingObject, subSectionMappingLink);
    
    var subSectionIter = getChildExportInfoSet(p_sectionExportInfo, subSectionLinkKey).iterator();
    while (subSectionIter.hasNext()) {
        determineExplicitSectionsAndQuestionsForSection(subSectionIter.next(), p_oExplicitSectionExportInfosSet, p_oExplicitQuestionExportInfosSet);     
    }
}

/*---------------------------------------------------------------------------------------
 * Convenience method to determine a given ExportInfo or to create a new one if there
 * exists none yet.
 * After getting or creating the wanted ExportInfo it is ensured that the given link to 
 * the given existing ExportInfo (if both is provided).
 * Used for parseSectionRecursiveForImplicitPlacings().
 ---------------------------------------------------------------------------------------*/
function getOrCreateExportInfoAndEnsureLink(p_oObjDef, p_sMappingObjectID, p_oExistingExportInfo, p_oMappingLink, p_bExistingExportInfoIsParent) {
    
    //get or create the ExportInfo for the given p_oObjDef
    var sGUID = p_oObjDef.GUID();
    var oResultExportInfo = getExportInfoByGUIDsAndMappingObjectID(sGUID, null, p_sMappingObjectID);
    if (oResultExportInfo == null) {
        oResultExportInfo = new exportInfo(p_oObjDef, null, null, p_sMappingObjectID, null);
        var oMappingObject = getMappingObjectByID(p_sMappingObjectID);
        addExportInfo(oResultExportInfo, oMappingObject);
    }
    
    //if there shall be a parent or child link ensured to a given p_oExistingExportInfo
    if (p_oExistingExportInfo != null && p_oMappingLink != null && p_bExistingExportInfoIsParent != null) {
        if (p_bExistingExportInfoIsParent) {
            var oParentMappingObject = getMappingObjectByID(p_oExistingExportInfo.sMappingObjectID);
            var oParentExportInfoSet = getParentExportInfos(oResultExportInfo, p_oMappingLink, oParentMappingObject);
            //if there is not already a link stored for the given parent p_oExistingExportInfo to the result ExportInfo as child then create it
            if (!hasExplicitEquivalent(p_oExistingExportInfo, oParentExportInfoSet)) {
                storeExportInfoRelation(p_oExistingExportInfo, p_oMappingLink, oResultExportInfo);
            } 
        } else {
            var oChildrenExportInfoSet = getChildrenExportInfos(oResultExportInfo, p_oMappingLink);
            //if there is not already a link stored for the parent result ExportInfo to the given p_oExistingExportInfo as child then create it
            if (!hasExplicitEquivalent(p_oExistingExportInfo, oChildrenExportInfoSet)) {
                storeExportInfoRelation(oResultExportInfo, p_oMappingLink, p_oExistingExportInfo);
            }
        }
    }
    
    return oResultExportInfo;
}

/*---------------------------------------------------------------------------------------
 * Convenience method to determine if a given ExportInfo has an equivalent in the given 
 * set of explicitly positioned ExportInfos.
 * It has if there is one ExportInfo whose ObjDef guid matches the depending ObjDef guid.
 ---------------------------------------------------------------------------------------*/
function hasExplicitEquivalent(p_oDependingExportInfo, oExplicitExportInfosSet) {
    var iter = oExplicitExportInfosSet.iterator();
    while (iter.hasNext()) {
        if (iter.next().getObjDef().GUID() == p_oDependingExportInfo.getObjDef().GUID()) {
            return true;
        }
    }
    return false;
}



/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                       ~~~~~~~ Debug info handling ~~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  
/*---------------------------------------------------------------------------------------.
 * Outputs an info String for the given ObjDef, including its name, its type name and
 * the applied mapping info.
 ---------------------------------------------------------------------------------------*/
function getObjDefDebugString(p_oObjDef, p_oMappingObjectNode) {
    var sMappingObjectID = p_oMappingObjectNode.getAttributeValue("id");
    var sARCMObjTypeID = p_oMappingObjectNode.getAttributeValue("arcm_objtype");
    return p_oObjDef.Type() + " '" + p_oObjDef.Name(g_nLoc) + "', mapping '" + sMappingObjectID + "' (ARCM objType '" + sARCMObjTypeID + "')";
}

/*---------------------------------------------------------------------------------------.
 * Outputs an info String for the given Model, including its name, its type name and
 * the applied mapping info.
 ---------------------------------------------------------------------------------------*/
function getModelDebugString(p_oModel, modelMappingID) {
    return "'" + p_oModel.Name(g_nLoc) + "' of type '" + p_oModel.Type() + "' (mapping '" + modelMappingID + "')";
}

/*---------------------------------------------------------------------------------------.
 * Adds the Strings in the given debug string list at to the internal debug string list
 * at the given export info 
 ---------------------------------------------------------------------------------------*/
function setExportInfoDebugStringList(p_oExportInfo, p_oDebugStringList) {
    var oDebugStringList = new java.util.ArrayList();
    if (p_oDebugStringList != null && !p_oDebugStringList.isEmpty()) {
        var iter = p_oDebugStringList.iterator();
        while (iter.hasNext()) {
            var sDebugString = iter.next();
            if (!p_oExportInfo.oDebugStringList.contains(sDebugString)) {
                p_oExportInfo.oDebugStringList.add(sDebugString);
            }
        }
    }
}
