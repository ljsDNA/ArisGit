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
                        ~~~~~~~ Data structures ~~~~~~~
                        ~~~~~~~~~~~ General ~~~~~~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
// ARCM component
var ARCM = Context.getComponent("ARCM");
  
function exportInfo(p_oObjDef, p_sArcmGuid, p_sArcmRootGuid, p_sMappingObjectID, p_oDebugStringList) {
    if (p_oObjDef != null) {
        this.oObjDef = p_oObjDef;
        this.sArisGuid = p_oObjDef.GUID();
    }
    this.sArcmGuid = p_sArcmGuid;
    this.sArcmRootGuid = p_sArcmRootGuid;
    this.sMappingObjectID = p_sMappingObjectID;
    this.oDebugStringList = new java.util.ArrayList(); //List<String>
    if (p_oDebugStringList != null) {
        oDebugStringList.addAll(p_oDebugStringList);
    }
}
exportInfo.prototype.getObjDef = function getOrLoadObjDef() {
    if (this.oObjDef == null && g_oDatabase != null) {
        return g_oDatabase.FindGUID(this.sArisGuid, Constants.CID_OBJDEF);
    }
    return this.oObjDef;
}
exportInfo.prototype.toShortString = function exportInfoToString() {
    var ret = "<none>";
    if (this.oObjDef != null) {ret = "'" + this.oObjDef.Name(g_nLoc) + "'";}
    if (this.sMappingObjectID != null) {ret += " (" + this.sMappingObjectID + ")";}
    return ret;
}
exportInfo.prototype.toString = function exportInfoToString() {
    var ret = "";
    var sObjDefValue = "<none>";
    if (this.oObjDef != null) {sObjDefValue = "'" + this.oObjDef.Name(g_nLoc) + "'";}
    ret += "\n" + " - ObjDef: " + sObjDefValue;
    var sArisGuidValue = "<none>";
    if (this.sArisGuid != null) {sArisGuidValue = this.sArisGuid;}
    ret += "\n" + " - ARIS GUID: " + sArisGuidValue;
    var sArcmGuidValue = "<none>";
    if (this.sArcmGuid != null) {sArcmGuidValue = this.sArcmGuid;}
    ret += "\n" + " - ARCM GUID: " + sArcmGuidValue;
    var sArcmRootGuidValue = "<none>";
    if (this.sArcmRootGuid != null) {sArcmRootGuidValue = this.sArcmRootGuid;}
    ret += "\n" + " - ARCM Root GUID: " + sArcmRootGuidValue;
    var sMappingObjectIDValue = "<none>";
    if (this.sMappingObjectID != null) {sMappingObjectIDValue = this.sMappingObjectID;}
    ret += "\n" + " - MappingObject ID: " + sMappingObjectIDValue;
    ret += "\n" + " ---- Debug info: " + this.debugInfo();
    ret += "\n";
    return ret;
}
exportInfo.prototype.debugInfo = function DebugStringListToString() {
    var sDebugStringValue = "<none>";
    if (this.oDebugStringList != null) {
        sDebugStringValue = "";
        var iterator = this.oDebugStringList.iterator();
        while (iterator.hasNext()) {
            sDebugStringValue += "\n# " + iterator.next();
        }
    }
    return sDebugStringValue;
}

function addDebugInfo(p_oExportInfo, p_sDebugString) {
    p_oExportInfo.oDebugStringList.add(p_sDebugString); 
}

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                        ~~~~~~~ Data structures ~~~~~~~
                        ~~~~~~ Survey management ~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
function implicitPlacing(p_oObjDefToPlace, p_oPositioningSection, p_oActivatingSection, p_oActivatingQuestion, p_aContextQuestions) {
    this.oObjDefToPlace = p_oObjDefToPlace;
    this.oPositioningSection = p_oPositioningSection;
    this.oActivatingSection = p_oActivatingSection;
    this.oActivatingQuestion = p_oActivatingQuestion;
    this.aContextQuestions = p_aContextQuestions;
    return this;
}
implicitPlacing.prototype.toString = function impPlacToString() {
  var sObjDefToPlace = "<none>";
  if (this.oObjDefToPlace != null) {sObjDefToPlace = this.oObjDefToPlace.Name(g_nLoc);}
  var sPositioningSection = "<none>";
  if (this.oPositioningSection != null) {sPositioningSection = this.oPositioningSection.Name(g_nLoc);}
  var sActivatingSection = "<none>";
  if (this.oActivatingSection != null) {sActivatingSection = this.oActivatingSection.Name(g_nLoc);}
  var sActivatingQuestion = "<none>";
  if (this.oActivatingQuestion != null) {sActivatingQuestion = this.oActivatingQuestion.Name(g_nLoc);}
  var sContextQuestions = "<none>";
  if (this.aContextQuestions != null && this.aContextQuestions.length > 0) {
      sContextQuestions = "[";
      for (var i=0; i<this.aContextQuestions.length; i++) {
          sContextQuestions += this.aContextQuestions[i].Name(g_nLoc);
          if (i<this.aContextQuestions.length - 1) {sContextQuestions += ", ";}
      }
      sContextQuestions += "]";
  }
  var ret = 'ObjDefToPlace: ' + sObjDefToPlace + ' ---- Position: ' + sPositioningSection + ' ---- Act.Section: ' + sActivatingSection + " ---- Act.Question: " + sActivatingQuestion + ' ---- Context: ' + sContextQuestions;
  return ret;
}


//---------------------------------------------------------------------------------------
//-------------------- CONVERSION HashSet <-> JavaScript Array --------------------------

/*---------------------------------------------------------------------------------------
    Converts a Java HashSet to a JavaScript Array.
 ---------------------------------------------------------------------------------------*/   
function convertHashSetToJSArray(p_hashSet) {
    var jsArray = new Array();
    if (p_hashSet == null) {return jsArray;} 
    var it = p_hashSet.iterator();
    while (it.hasNext()) {
        jsArray.push(it.next());
    }
    return jsArray;
}

/*---------------------------------------------------------------------------------------
    Converts a JavaScript Array to a Java HashSet.
 ---------------------------------------------------------------------------------------*/   
function convertJSArrayToHashSet(p_jsArray) {
    var oHashSet = new java.util.HashSet();
    if (p_jsArray == null) {return oHashSet;} 
    for (var i=0; i<p_jsArray.length; i++) {
        oHashSet.add(p_jsArray[i]);
    }
    return oHashSet;
}

//-------------------- CONVERSION HashSet <-> JavaScript Array --------------------------
//---------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------
//---------------------------- Classification results -----------------------------------

// execution context database
var g_oDatabase;

// global mapping and classification messages
var g_aMappingInitMessages = new Array();
var g_aTopologicalSortingMessages = new Array();
var g_aHierarchyIntersectionMessages = new Array();

// map of exportInfo objects, keys are the IDs of the mappingObjects they were classified by
var g_classification_hm_mappingObjectID2exportInfos = new java.util.HashMap(); //Format: String | HashSet <exportInfo>

// map of parent to children relation, key is generated by getExportInfoHashMapKey(exportInfo), value itself is a map with attrRef IDs as keys
var g_classification_hm_parent2children = new java.util.HashMap(); //Format: String | HashMap < String | HashSet<exportInfo> >
// map of child to parent relation, key is generated by getExportInfoHashMapKey(exportInfo), value itself is a map with attrRef IDs as keys
var g_classification_hm_child2parents = new java.util.HashMap(); //Format: String | HashMap < String | HashSet<exportInfo> >

/*---------------------------------------------------------------------------------------
    Used by the accessor functions for g_classification_hm_parent2children and
    g_classification_hm_child2parents.
---------------------------------------------------------------------------------------*/
function getExportInfoHashMapKey(p_oExportInfo) {
    return p_oExportInfo.sArisGuid + "_" + p_oExportInfo.sArcmRootGuid + "_" + p_oExportInfo.sMappingObjectID;
}

/*---------------------------------------------------------------------------------------
    Accessor functions to obtain for a given parent exportInfo the child exportInfos
    for a given link key.
    This method guarantees a reliable access to g_classification_hm_parent2children
    evan after storing and restoring it as Context property.
---------------------------------------------------------------------------------------*/
function getChildExportInfoSet(p_oParentExportInfo, p_sLinkKey) {
    var childExportInfosMap = g_classification_hm_parent2children.get( getExportInfoHashMapKey(p_oParentExportInfo) );
    if (childExportInfosMap != null) {
        var childExportInfosSet = childExportInfosMap.get(p_sLinkKey);
        if (childExportInfosSet != null) {
            return childExportInfosSet;
        }
    }
    return new java.util.HashSet();
}

/*---------------------------------------------------------------------------------------
    Accessor method to store for a given parent exportInfo the hashmap of all child 
    exportInfos linked by link keys.
    This method guarantees a reliable access to g_classification_hm_parent2children
    evan after storing and restoring it as Context property.
---------------------------------------------------------------------------------------*/
function storeChildExportInfoHashMap(p_oParentExportInfo, p_oParent2ChildReferencesHashMap) {
    g_classification_hm_parent2children.put( getExportInfoHashMapKey(p_oParentExportInfo), p_oParent2ChildReferencesHashMap );
}

/*---------------------------------------------------------------------------------------
    Accessor method to obtain for a given child exportInfo the parent exportInfos
    for a given link key.
    This method guarantees a reliable access to g_classification_hm_parent2children
    evan after storing and restoring it as Context property.
---------------------------------------------------------------------------------------*/
function getParentExportInfoSet(p_oChildExportInfo, p_sLinkKey) {
    var parentExportInfosMap = g_classification_hm_child2parents.get( getExportInfoHashMapKey(p_oChildExportInfo) );
    if (parentExportInfosMap != null) {
        var parentExportInfosSet = parentExportInfosMap.get(p_sLinkKey);
        if (parentExportInfosSet != null) {
            return parentExportInfosSet;
        }
    }
    return new java.util.HashSet();
}

/*---------------------------------------------------------------------------------------
    Accessor method to store for a given child exportInfo the hashmap of all parent 
    exportInfos linked by link keys.
    This method guarantees a reliable access to g_classification_hm_parent2children
    evan after storing and restoring it as Context property.
---------------------------------------------------------------------------------------*/
function storeParentExportInfoHashMap(p_oChildExportInfo, p_oChild2ParentReferencesHashMap) {
    g_classification_hm_child2parents.put( getExportInfoHashMapKey(p_oChildExportInfo), p_oChild2ParentReferencesHashMap );
}


//---------------------------- Classification results -----------------------------------
//---------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------
//--------- CONVERSION classification results <-> Report property Strings ---------------

var g_sMessageDelimiter = "#";
var g_sExportInfoPropertyDelimiter = ";";
var g_sHashSetDelimiter = ",";
var g_sInnerHashMapAssignDelimiter = "=i=";
var g_sInnerHashMapEntryDelimiter = "#i#";
var g_sOuterHashMapAssignDelimiter = "=o=";
var g_sOuterHashMapEntryDelimiter = "#o#";


/*---------------------------------------------------------------------------------------
    Main function for initialising the mapping and starting the classification.
    First checks if this was done by a previous call of this function and the results 
    were stored as report properties.
    If so then the stored results are restored and used, otherwise first the mapping
    is initialised and - if this succeeded - the classification is started.
    The messages and/or classification results are stored as report properties. 
---------------------------------------------------------------------------------------*/
function initMappingAndStartClassification() {
    
    if (g_oDatabase == null) {
        if (ArisData.getSelectedDatabases().length > 0) {g_oDatabase = ArisData.getSelectedDatabases()[0];}
        else if (ArisData.getSelectedGroups().length > 0) {g_oDatabase = ArisData.getSelectedGroups()[0].Database();}
        else if (ArisData.getSelectedModels().length > 0) {g_oDatabase = ArisData.getSelectedModels()[0].Database();}
        else if (ArisData.getSelectedObjDefs().length > 0) {g_oDatabase = ArisData.getSelectedObjDefs()[0].Database();}
    }
    
    if (Context.getProperty("g_aMappingInitMessages") != null
        && Context.getProperty("g_aTopologicalSortingMessages") != null
        && Context.getProperty("g_aHierarchyIntersectionMessages") != null
        && Context.getProperty("g_classification_hm_mappingObjectID2exportInfos") != null
        && Context.getProperty("g_classification_hm_parent2children") != null
        && Context.getProperty("g_classification_hm_child2parents") != null) {
        restoreMappingAndClassificationResultsFromReportProperty();
        //just mapping file parsing for meta data but no consistency checks
        initializeMappingsWithOptions(false);
    }
    else {
        g_aMappingInitMessages = initializeMappings();
        if (g_aMappingInitMessages.length == 0) {
            startClassification();
            classifyDependentSectionsAndQuestions();
            performTopologicalSortings();
            checkOrgUnitHierarchyAndTesterHierarchyIntersection();
        }
        storeMappingAndClassificationResultsAsReportProperty();
    }
}


/*---------------------------------------------------------------------------------------
    Stores the part of the classification results as report property Strings which is
    relevant for the old semantic reports:
    - g_aMappingInitMessages -> "g_aMappingInitMessages"
    - g_aTopologicalSortingMessages -> "g_aTopologicalSortingMessages"
    - g_aHierarchyIntersectionMessages -> "g_aHierarchyIntersectionMessages"
    - g_classification_hm_mappingObjectID2exportInfos -> "g_classification_hm_mappingObjectID2exportInfos"
    - g_classification_hm_parent2children -> "g_classification_hm_parent2children"
    - g_classification_hm_child2parents -> "g_classification_hm_child2parents"
    exportInfo.oObjDef will be skipped as well as all debug strings.
---------------------------------------------------------------------------------------*/
function storeMappingAndClassificationResultsAsReportProperty() {
    var sPropertyValue = g_aMappingInitMessages.join(g_sMessageDelimiter);
    Context.setProperty("g_aMappingInitMessages", sPropertyValue);
    sPropertyValue = g_aTopologicalSortingMessages.join(g_sMessageDelimiter);
    Context.setProperty("g_aTopologicalSortingMessages", sPropertyValue);
    sPropertyValue = g_aHierarchyIntersectionMessages.join(g_sMessageDelimiter);
    Context.setProperty("g_aHierarchyIntersectionMessages", sPropertyValue);
    
    sPropertyValue = convertStringKeyHashMapToString(g_classification_hm_mappingObjectID2exportInfos);  
    Context.setProperty("g_classification_hm_mappingObjectID2exportInfos", sPropertyValue);
    sPropertyValue = convertExportInfoKeyHashMapToString(g_classification_hm_parent2children);
    Context.setProperty("g_classification_hm_parent2children", sPropertyValue);
    sPropertyValue = convertExportInfoKeyHashMapToString(g_classification_hm_child2parents);
    Context.setProperty("g_classification_hm_child2parents", sPropertyValue);
}


/*---------------------------------------------------------------------------------------
    Restores the part of the classification results from report property Strings which is
    relevant for the old semantic reports:
    - "g_aMappingInitMessages" -> g_aMappingInitMessages
    - "g_aTopologicalSortingMessages" -> g_aTopologicalSortingMessages
    - "g_aHierarchyIntersectionMessages" -> g_aHierarchyIntersectionMessages
    - "g_classification_hm_mappingObjectID2exportInfos" -> g_classification_hm_mappingObjectID2exportInfos
    - "g_classification_hm_parent2children" -> g_classification_hm_parent2children
    - "g_classification_hm_child2parents" -> g_classification_hm_child2parents
    exportInfo.oObjDef will be skipped as well as all debug strings.
---------------------------------------------------------------------------------------*/
function restoreMappingAndClassificationResultsFromReportProperty() {
    var sProp = Context.getProperty("g_aMappingInitMessages");
    if (sProp != null && sProp != "") {
        g_aMappingInitMessages = sProp.split(g_sMessageDelimiter);
    }
    sProp = Context.getProperty("g_aTopologicalSortingMessages");
    if (sProp != null && sProp != "") {
        g_aTopologicalSortingMessages = sProp.split(g_sMessageDelimiter);
    }
    sProp = Context.getProperty("g_aHierarchyIntersectionMessages");
    if (sProp != null && sProp != "") {
        g_aHierarchyIntersectionMessages = sProp.split(g_sMessageDelimiter);
    }
    
    sProp = Context.getProperty("g_classification_hm_mappingObjectID2exportInfos");
    if (sProp != null && sProp != "") {
        g_classification_hm_mappingObjectID2exportInfos = convertStringToStringKeyHashMap(sProp);
    }
    sProp = Context.getProperty("g_classification_hm_parent2children");
    if (sProp != null && sProp != "") {
        g_classification_hm_parent2children = convertStringToExportInfoKeyHashMap(sProp);
    }
    sProp = Context.getProperty("g_classification_hm_child2parents");
    if (sProp != null && sProp != "") {
        g_classification_hm_child2parents = convertStringToExportInfoKeyHashMap(sProp);
    }
}


/*---------------------------------------------------------------------------------------
    Convert a HashMap into a property String.
    HashMap format: < String | HashMap < String | HashSet<exportInfo> >
    exportInfo.oObjDef will be skipped as well as all debug strings.
---------------------------------------------------------------------------------------*/
function convertExportInfoKeyHashMapToString(expInfHashMap) {
    var oStringBuffer = new java.lang.StringBuffer();
    var bFirst = true;
    for (var oIterator = expInfHashMap.keySet().iterator(); oIterator.hasNext(); ) {
        if (!bFirst) {oStringBuffer.append(g_sOuterHashMapEntryDelimiter);}
        var sExpInfKey = oIterator.next();
        var oStringKeyHashMap = expInfHashMap.get(sExpInfKey);
        oStringBuffer   .append(sExpInfKey)
                        .append(g_sOuterHashMapAssignDelimiter)
                        .append(convertStringKeyHashMapToString(oStringKeyHashMap));
        bFirst = false;
    }
    return oStringBuffer.toString();
}

/*---------------------------------------------------------------------------------------
    Convert a property String into a HashMap.
    HashMap format: < String | HashMap < String | HashSet<exportInfo> >
    oObjDef will not be restored; call getObjDef() for reloading oObjDef.
---------------------------------------------------------------------------------------*/
function convertStringToExportInfoKeyHashMap(sProp) {
    var result = new java.util.HashMap();
    if (sProp != null && sProp != "") {
        var aHashMapParts = sProp.split(g_sOuterHashMapEntryDelimiter);
        for (n=0; n<aHashMapParts.length; n++) {
            var aHashMapEntryParts = aHashMapParts[n].split(g_sOuterHashMapAssignDelimiter);
            result.put(aHashMapEntryParts[0], convertStringToStringKeyHashMap(aHashMapEntryParts[1]));
        }
    }
    return result;
}

/*---------------------------------------------------------------------------------------
    Convert a HashMap into a property String.
    HashMap format: < String | HashSet<exportInfo> >
    exportInfo.oObjDef will be skipped as well as all debug strings.
---------------------------------------------------------------------------------------*/
function convertStringKeyHashMapToString(skHashMap) {
    var oStringBuffer = new java.lang.StringBuffer();
    var bFirst = true;
    for (var oIterator = skHashMap.keySet().iterator(); oIterator.hasNext(); ) {
        if (!bFirst) {oStringBuffer.append(g_sInnerHashMapEntryDelimiter);}
        var sKey = oIterator.next();
        var oExportInfoHashSet = skHashMap.get(sKey);
        oStringBuffer   .append(sKey)
                        .append(g_sInnerHashMapAssignDelimiter)
                        .append(convertExportInfoHashSetToString(oExportInfoHashSet));
        bFirst = false;
    }
    return oStringBuffer.toString();
}

/*---------------------------------------------------------------------------------------
    Convert a property String into a HashMap.
    HashMap format: < String | HashSet<exportInfo> >
    oObjDef will not be restored; call getObjDef() for reloading oObjDef.
---------------------------------------------------------------------------------------*/
function convertStringToStringKeyHashMap(sProp) {
    var result = new java.util.HashMap();
    var aHashMapParts = sProp.split(g_sInnerHashMapEntryDelimiter);
    for (m=0; m<aHashMapParts.length ;m++) {
        var aHashMapEntryParts = aHashMapParts[m].split(g_sInnerHashMapAssignDelimiter);
        result.put(aHashMapEntryParts[0], convertStringToExportInfoHashSet(aHashMapEntryParts[1]));
    }
    return result;
}

/*---------------------------------------------------------------------------------------
    Convert a HashSet of exportInfo into a property String.
    exportInfo.oObjDef will be skipped as well as all debug strings.
---------------------------------------------------------------------------------------*/
function convertExportInfoHashSetToString(expInfHashSet) {
    var oStringBuffer = new java.lang.StringBuffer();
    var bFirst = true;
    for (var oIterator = expInfHashSet.iterator(); oIterator.hasNext(); ) {
        if (!bFirst) {oStringBuffer.append(g_sHashSetDelimiter);}
        oStringBuffer.append(convertExportInfoToString(oIterator.next()));
        bFirst = false;
    }
    return oStringBuffer.toString();
}

/*---------------------------------------------------------------------------------------
    Convert an property String into a HashSet of exportInfo.
    Debug strings will not be restored.
    oObjDef will not be restored; call getObjDef() for reloading oObjDef.
---------------------------------------------------------------------------------------*/
function convertStringToExportInfoHashSet(expInfHashSetString) {
    var result = new java.util.HashSet();
    if (expInfHashSetString != null && expInfHashSetString != "") {
        var aParts = expInfHashSetString.split(g_sHashSetDelimiter);
        for (e=0; e<aParts.length; e++) {
            var expInf = convertStringToExportInfo(aParts[e]);
            result.add(expInf);
        }
    }
    return result;
}

/*---------------------------------------------------------------------------------------
    Convert an exportInfo into a property String.
    exportInfo.oObjDef will be skipped as well as all debug strings.
---------------------------------------------------------------------------------------*/
function convertExportInfoToString(expInf) {
    return  expInf.sArisGuid
            + g_sExportInfoPropertyDelimiter + expInf.sArcmGuid
            + g_sExportInfoPropertyDelimiter + expInf.sArcmRootGuid
            + g_sExportInfoPropertyDelimiter + expInf.sMappingObjectID;
}

/*---------------------------------------------------------------------------------------
    Convert a property String into an exportInfo.
    Debug strings will not be restored.
    oObjDef will not be restored; call getObjDef() for reloading oObjDef.
---------------------------------------------------------------------------------------*/
function convertStringToExportInfo(expInfString) {
    var aParts = expInfString.split(g_sExportInfoPropertyDelimiter);
    var result = new exportInfo(null, aParts[1], aParts[2], aParts[3], null);
    result.sArisGuid = aParts[0];
    return result;
}

//--------- CONVERSION classification results <-> Report property Strings ---------------
//---------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------
//------------------------------- TOPOLOGICAL SORTING -----------------------------------

var g_deactivatedLinkSet = new java.util.HashSet();

// map of CxnDef for those connections where the according mapping contains <mappingAttr> entries
var g_classification_hm_parentChildAttrID2cxnDef = new java.util.HashMap(); //Format: String with format <parent ObjDef GUID>#<child ObjDef GUID>#mappingLinkID | CxnDef


/*---------------------------------------------------------------------------------------
    Looks up all classified exportInfo objects which have a hierarchical link defined 
    (in standard: all hierarchies, the questionnaire sections and the audit step templates),
    then sorts them topologically in child-first order.
    If there are cycles then it fills g_aTopologicalSortingMessages accordingly.
---------------------------------------------------------------------------------------*/
function performTopologicalSortings() {
    
    var cyclesArray = new Array();
    
    var iter = getAllMappingObjects().iterator();
    while (iter.hasNext()) {
        var oMappingObjectNode = iter.next();
        var sMappingObjectID = oMappingObjectNode.getAttributeValue("id");
        var sHierarchicalLink = getHierarchicalMappinkLink(sMappingObjectID);
        if (sHierarchicalLink == null) {continue;}
        
        var sortResult = sortTopological(sMappingObjectID, g_classification_hm_mappingObjectID2exportInfos.get(sMappingObjectID));   
        cyclesArray = cyclesArray.concat(sortResult.cycleArrays);
        g_classification_hm_mappingObjectID2exportInfos.put(sMappingObjectID, sortResult.exportInfoSet);
    }
    
    //Abort if there are cycles found   
    if (cyclesArray.length > 0) {
        for (var i=0; i<cyclesArray.length; i++) {
            var sCycleErrorMsg = getString("EXPORT_CYCLE_DETECTED") + ":";     //"Hierarchical cycle detected: "
            for (var j=0; j<cyclesArray[i].length; j++) {
                sCycleErrorMsg += cyclesArray[i][j].toShortString();
                if (j<cyclesArray[i].length - 1) {sCycleErrorMsg += ", ";}
            }
            g_aTopologicalSortingMessages.push(sCycleErrorMsg);
        }
    }
}


/*---------------------------------------------------------------------------------------
    Performs a topological sort on a given Set of exportInfo elements.
    Returns the following result object:
		- property "exportInfoSet": new sorted LinkedHashSet with all exportInfo objects
                                    which are not part of any cycle
		- property "cycleArrays":	array of arrays which in turn contain the exportInfo
									objects of the different detected cycles
---------------------------------------------------------------------------------------*/
function sortTopological(p_sMappingObjectID, p_oExportInfoSet) { 
    
    if (p_oExportInfoSet == null) {
        return {
            exportInfoSet: new java.util.LinkedHashSet(),
            cycleArrays: []
        }
    }
    
    var exportInfoArray = convertHashSetToJSArray(p_oExportInfoSet);
    var unsortedExportInfoArray = exportInfoArray.concat(new Array());
    if (exportInfoArray.length == 0) {
        return {
            exportInfoSet: new java.util.LinkedHashSet(),
            cycleArrays: []
        }
    }
    
    //determine the hierarchical link between the objects to be sorted
    var oMappingObject = getMappingObjectByID(p_sMappingObjectID);
    var oMappingLink = getHierarchicalMappinkLink(p_sMappingObjectID);
    var sKey = createExportInfoRelationKey(oMappingObject, oMappingLink);
    
    //create successor and predecessor count maps
    var exportInfoSuccessorCounts = new java.util.HashMap(); //exportInfo -> count
    var exportInfoPredecessorCounts = new java.util.HashMap(); //exportInfo -> count
    for (var i=0; i<exportInfoArray.length; i++) {
        //successor count
        var childrenArray = convertHashSetToJSArray( getChildExportInfoSet(exportInfoArray[i], sKey) );
        exportInfoSuccessorCounts.put(exportInfoArray[i], childrenArray.length);
		//predecessor count
		var parentsArray = convertHashSetToJSArray( getParentExportInfoSet(exportInfoArray[i], sKey) );
        exportInfoPredecessorCounts.put(exportInfoArray[i], parentsArray.length);
    }
    
    //sort all cycle-free elements from bottom-up direction (i.e. no child elements)...
    var sortedExportInfoArray = new Array();
    var bottomUpSortedExportInfoArray = new Array();
    sortTopologicalBottomUp(unsortedExportInfoArray, bottomUpSortedExportInfoArray, sKey, exportInfoSuccessorCounts);
    sortedExportInfoArray = sortedExportInfoArray.concat(bottomUpSortedExportInfoArray);
    //...if there are still unsorted elements left then sort all cycle-free elements from top-down direction (i.e. no parent elements)
    //this step is only done to narrow down the cycles more exactly
    if (unsortedExportInfoArray.length > 0) {
        var topDownSortedExportInfoArray = new Array();
        sortTopologicalTopDown(unsortedExportInfoArray, topDownSortedExportInfoArray, sKey, exportInfoPredecessorCounts);
        sortedExportInfoArray = sortedExportInfoArray.concat(topDownSortedExportInfoArray);
    }

    //if there remain unsorted elements then sorting was not successful - determine the cycles between them
    var cycles = new Array(); //array of cycle arrays
    if (unsortedExportInfoArray.length > 0) {
        cycles = determineCycles(unsortedExportInfoArray, sKey);
    }
    
    var sortedExportInfoLinkedHashSet = new java.util.LinkedHashSet();
    for (var m=0; m<sortedExportInfoArray.length; m++) {
        sortedExportInfoLinkedHashSet.add(sortedExportInfoArray[m]);
    }
    
    return {
        exportInfoSet: sortedExportInfoLinkedHashSet,
        cycleArrays: cycles
    }
}

/*---------------------------------------------------------------------------------------
    Fills bottomUpSortedExportInfoArray with topologically sorted elements - order is
    children first.
    Leaves all elements that could not be sorted topologically bottom up in
    unsortedExportInfoArray.
---------------------------------------------------------------------------------------*/
function sortTopologicalBottomUp(unsortedExportInfoArray, bottomUpSortedExportInfoArray, p_sHierarchicalLinkHmKey, exportInfoSuccessorCounts) {
    
    var furtherIteration = true;
    while (furtherIteration) {
        //separate the elements by the criterion "successors" / "no successors"
        var exportInfosWithoutSuccessors = new Array();
        var exportInfosWithSuccessors = new Array();
        for (var i=0; i<unsortedExportInfoArray.length; i++) {
            var count = exportInfoSuccessorCounts.get(unsortedExportInfoArray[i]);
            if (count == 0) {
                bottomUpSortedExportInfoArray.push(unsortedExportInfoArray[i]);
                exportInfosWithoutSuccessors.push(unsortedExportInfoArray[i]); //mark the exportInfo as relevant for count updates of the parent exportInfos
     
            } else {
                exportInfosWithSuccessors.push(unsortedExportInfoArray[i]);
            }
        }
        
        furtherIteration = exportInfosWithoutSuccessors.length > 0 && exportInfosWithSuccessors.length != unsortedExportInfoArray.length;
        //in the next iteration only the elements with (unprocessed) successors will be checked
        unsortedExportInfoArray.length = 0; //clear the array
        for (var h=0; h<exportInfosWithSuccessors.length; h++) {
            unsortedExportInfoArray.push(exportInfosWithSuccessors[h]);
        }
        
        //update the successor count map
        for (var j=0; j<exportInfosWithoutSuccessors.length; j++) {
            var parentExportInfosArray = convertHashSetToJSArray( getParentExportInfoSet(exportInfosWithoutSuccessors[j], p_sHierarchicalLinkHmKey) );
            for (var k=0; k<parentExportInfosArray.length; k++) { 
                var currentChildCount = exportInfoSuccessorCounts.get(parentExportInfosArray[k]);
                exportInfoSuccessorCounts.put(parentExportInfosArray[k], --currentChildCount);
            }
        }
    }
}

/*---------------------------------------------------------------------------------------
    Fills topDownSortedExportInfoArray with topologically sorted elements - order is
    children(!) first.
    Leaves all elements that could not be sorted topologically top down in
    unsortedExportInfoArray.
---------------------------------------------------------------------------------------*/
function sortTopologicalTopDown(unsortedExportInfoArray, topDownSortedExportInfoArray, p_sHierarchicalLinkHmKey, exportInfoPredecessorCounts) {

    var furtherIteration = true;
    while (furtherIteration) {
        //separate the elements by the criterion "predecessors" / "no predecessors"
        var exportInfosWithoutPredecessors = new Array();
        var exportInfosWithPredecessors = new Array();
        for (var i=0; i<unsortedExportInfoArray.length; i++) {
            var count = exportInfoPredecessorCounts.get(unsortedExportInfoArray[i]);
            if (count == 0) {
                topDownSortedExportInfoArray.push(unsortedExportInfoArray[i]);
                exportInfosWithoutPredecessors.push(unsortedExportInfoArray[i]); //mark the exportInfo as relevant for count updates of the parent exportInfos
     
            } else {
                exportInfosWithPredecessors.push(unsortedExportInfoArray[i]);
            }
        }
        
        furtherIteration = exportInfosWithoutPredecessors.length > 0 && exportInfosWithPredecessors.length != unsortedExportInfoArray.length;
        //in the next iteration only the elements with (unprocessed) predecessors will be checked
        unsortedExportInfoArray.length = 0; //clear the array
        for (var h=0; h<exportInfosWithPredecessors.length; h++) {
            unsortedExportInfoArray.push(exportInfosWithPredecessors[h]);
        }
        
        //update the predecessor count map
        for (var j=0; j<exportInfosWithoutPredecessors.length; j++) { 
            var childExportInfosArray = convertHashSetToJSArray( getChildExportInfoSet(exportInfosWithoutPredecessors[j], p_sHierarchicalLinkHmKey) );
            for (var k=0; k<childExportInfosArray.length; k++) { 
                var currentParentCount = exportInfoPredecessorCounts.get(childExportInfosArray[k]);
                exportInfoPredecessorCounts.put(childExportInfosArray[k], --currentParentCount);
            }
        }
    }
    
    topDownSortedExportInfoArray.reverse();
}

/*---------------------------------------------------------------------------------------
    Analyzes the given Array how the elements in it form a cycle, connected by the given
    link ID.
    Returns an Array where all found cycles are in turn stored as Arrays.
---------------------------------------------------------------------------------------*/
function determineCycles(unsortedExportInfoArray, p_sHierarchicalLinkHmKey) { 
    
    var uncheckedExportInfos = unsortedExportInfoArray.concat(new Array());
    var cycles = new Array();
    
    while (uncheckedExportInfos.length > 0) {
        var startExportInfo = uncheckedExportInfos[0];
        //find out to which cycle the start exportInfo belongs - cycleArray is filled by recursion
        var cycleArray = new Array();
        determineCycleForExportInfoRecursive(startExportInfo, unsortedExportInfoArray, p_sHierarchicalLinkHmKey, cycleArray);
        //add the exportInfo array representing the recognized cycle to the result
        cycles.push(cycleArray);
        //remove all cycle members from the array of exportInfos to check
        for (var i=0; i<cycleArray.length; i++) {
            var index = uncheckedExportInfos.indexOf(cycleArray[i]);
            uncheckedExportInfos.splice(index, 1);
        }
    }
    
    return cycles;
}


function determineCycleForExportInfoRecursive(p_oExportInfo, p_aExportInfosToCheck, p_sHierarchicalLinkHmKey, cycleArray) {
    var index = cycleArray.indexOf(p_oExportInfo);
    if (index >= 0) {
        return;
    }
    cycleArray.push(p_oExportInfo);
    var childExportInfoArray = convertHashSetToJSArray( getChildExportInfoSet(p_oExportInfo, p_sHierarchicalLinkHmKey) );
    for (var i=0; i<childExportInfoArray.length; i++) {
        var childIndex = p_aExportInfosToCheck.indexOf(childExportInfoArray[i]);
        //do recursion only for those children whose cycle membership is to check
        if (childIndex >= 0) {
            determineCycleForExportInfoRecursive(childExportInfoArray[i], p_aExportInfosToCheck, p_sHierarchicalLinkHmKey, cycleArray);
        }
    }
}


//------------------------------- TOPOLOGICAL SORTING -----------------------------------
//---------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------
//----------------------------- HIERARCHY INTERSECTION ----------------------------------

/*---------------------------------------------------------------------------------------
    Checks if there are ObjDefs which have a classified exportInfo in both the orgunit
    and tester hierarchy.
    If intersections are found then it fills g_aHierarchyIntersectionMessages accordingly.
---------------------------------------------------------------------------------------*/
function checkOrgUnitHierarchyAndTesterHierarchyIntersection() {
    
    var oOrgunitHierarchyMapping = g_classification_hm_mappingObjectID2exportInfos.get("HIERARCHY_ORGUNIT");
    var oTesterHierarchyMapping = g_classification_hm_mappingObjectID2exportInfos.get("HIERARCHY_TESTER");
    if (oOrgunitHierarchyMapping == null || oTesterHierarchyMapping == null) {
        return;
    }
    
    var oHierarchyIntersectionExportInfos = new java.util.HashSet();
    oHierarchyIntersectionExportInfos.addAll( oOrgunitHierarchyMapping );
    oHierarchyIntersectionExportInfos.retainAll( oTesterHierarchyMapping );
    
    if (oHierarchyIntersectionExportInfos.size() > 0) {
        var aErroneousHierarchyElementExportInfos = convertHashSetToJSArray(oHierarchyIntersectionExportInfos);
        var sIntersectionErrorMsg = getString("EXPORT_HIERARCHY_INTERSECTION") + ":\n"; //"An organizational unit cannot be assigned to the organizational hierarchy and tester hierarchy at the same time. The following organizational units violate this rule:\n"
        for (var i=0; i<aErroneousHierarchyElementExportInfos.length; i++) {
            sIntersectionErrorMsg = sIntersectionErrorMsg + "- " + aErroneousHierarchyElementExportInfos[i].getObjDef().Name(g_nLoc);
            if (i<aErroneousHierarchyElementExportInfos.length - 1) {sIntersectionErrorMsg += "\n";}
        }
        g_aHierarchyIntersectionMessages.push(sIntersectionErrorMsg);          
    }
}

//----------------------------- HIERARCHY INTERSECTION ----------------------------------
//---------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------
//------------------------------- OCCURRENCE SORTING ------------------------------------

/*---------------------------------------------------------------------------------------
    Sort a JS-Array of child ExportInfos according to the XY position of the occurrences 
    of their ObjDefs in a given model type.
    
    For each ExportInfo the occurrence of their ObjDef in the *first* found model with 
    the given type is used. After this the XY positions are used for sorting.
    ExportInfos whose ObjDefs have either no occurences at all or no occurences in a model 
    of the given model type are ignored for sorting - they are appended at the end of 
    the returned sorted list.
    
    Returns a sorted JS-Array with the ExportInfos given as input.
---------------------------------------------------------------------------------------*/
function sortExportInfosByPositionInModel( aExportInfos, iModelTypeNum, sSortFunctionName ) {

    //determine valid ObjOccs and ObjDefs without valid occurences
    var nonOccurrenceExportInfos = new Array();
    
    var hmObjOcc2ExportInfo = new java.util.HashMap();
    var sortableObjOccs = new Array();
    
    //if a model type is given
    if (iModelTypeNum != null && iModelTypeNum != -1) {
        
        for (var i=0; i<aExportInfos.length; i++) {       
            var bOccurrenceFound = false;
            var aObjDefOccurrences = aExportInfos[i].getObjDef().OccList();
            for (var j=0; j<aObjDefOccurrences.length; j++) {
                //stop at the first found ObjOcc - add it to the ObjOcc array
                if (aObjDefOccurrences[j].Model().TypeNum() == iModelTypeNum) {
                    sortableObjOccs.push( aObjDefOccurrences[j] );
                    hmObjOcc2ExportInfo.put(aObjDefOccurrences[j], aExportInfos[i]);
                    bOccurrenceFound = true;
                    break;    
                }
            }
            //if nothing found - add the ObjDef to the 'not sortable' list
            if (!bOccurrenceFound) {
                nonOccurrenceExportInfos.push( aExportInfos[i] );
            }
        }
    }
    else {
        sortableObjOccs = findObjOccsToSort(aExportInfos, hmObjOcc2ExportInfo);
    }
    
    //sort the occurences according to the sort function
    sortableObjOccs.sort( eval(sSortFunctionName) );
    
    //create the ExportInfo result array
    var sortedExportInfoArray = new Array();
    for (var k=0; k<sortableObjOccs.length; k++) {
        sortedExportInfoArray.push( hmObjOcc2ExportInfo.get(sortableObjOccs[k]) );
    }
    for (var l=0; l<nonOccurrenceExportInfos.length; l++) {
        sortedExportInfoArray.push( nonOccurrenceExportInfos[l] );
    }
    
    return sortedExportInfoArray;
}

/*---------------------------------------------------------------------------------------
 Determines a set of child ObjOccs to be sorted by the following steps:
 - There must be a model where the all ObjDefs of the child ExportInfos have an occurrence; 
   if no such model exists then an empty Array is returned
 
 If this condition is met then a list of the found ObjOccs is returned.
 The passed hmObjOcc2ExportInfo will contain a mapping for each ObjOcc of the result
 JSArray to the according child ExportInfo.
---------------------------------------------------------------------------------------*/
function findObjOccsToSort( aExportInfos, hmObjOcc2ExportInfo ) {

    if (aExportInfos == null || aExportInfos.length <= 1) {return new Array();}
    
    var aObjOccsToSort = new Array();
    
    //find a model where all child objdefs have occurrences
    var aFirstObjOccs = aExportInfos[0].getObjDef().OccList();
    for (var i=0; i<aFirstObjOccs.length; i++) {

        hmObjOcc2ExportInfo.clear();
        var oFirstObjDefModel = aFirstObjOccs[i].Model();
        
        //all other children must have ObjOccs in this model
        var aFoundObjOccs = new Array();
        aFoundObjOccs.push(aFirstObjOccs[i]);
        for (j=1; j<aExportInfos.length; j++) {
            var aObjOccs = aExportInfos[j].getObjDef().OccList();
            for (k=0; k<aObjOccs.length; k++) {
                if (aObjOccs[k].Model().equals( oFirstObjDefModel )) {
                    //there can be multiple occurrences of the same ObjDef in this model -> keep them all and find out
                    //the real connected one in the next step
                    aFoundObjOccs.push(aObjOccs[k]);
                    hmObjOcc2ExportInfo.put(aObjOccs[k], aExportInfos[j]);
                }
            }
        }
        
        
        //if the Array lengths don't match then at least one found child ObjOcc is not connected to the parent ObjOcc -> try the next model
        if (aFoundObjOccs.length < aExportInfos.length) {
            continue;
        }
    
        //if everything is fulfilled then work with these child ObjOccs
        for (var p=0; p<aFoundObjOccs.length; p++) {
            aObjOccsToSort.push(aFoundObjOccs[p]);    
        }
        break;
    }
    
    return aObjOccsToSort;    
}

/*---------------------------------------------------------------------------------------
 Sorts ObjOccs by their XY position. ObjOccs with smaller X get a smaller index.
 If elements have the same X then the Y is compared. Again ObjOccs with smaller
 Y get a smaller index.
---------------------------------------------------------------------------------------*/
function sortObjOccsByXYPos( firstObjOcc, secondObjOcc ) {
    
    if (firstObjOcc.X() - secondObjOcc.X() != 0) {
        return firstObjOcc.X() - secondObjOcc.X();
    } else {
        return firstObjOcc.Y() - secondObjOcc.Y();
    }    
}

/*---------------------------------------------------------------------------------------
 Sorts ObjOccs by their YX position. ObjOccs with smaller Y get a smaller index.
 If elements have the same Y then the X is compared. Again ObjOccs with smaller
 X get a smaller index.
---------------------------------------------------------------------------------------*/
function sortObjOccsByYXPos( firstObjOcc, secondObjOcc ) {
    
    if (firstObjOcc.Y() - secondObjOcc.Y() != 0) {
        return firstObjOcc.Y() - secondObjOcc.Y();
    } else {
        return firstObjOcc.X() - secondObjOcc.X();
    }    
}


/*---------------------------------------------------------------------------------------
    Sorts the given list of child ExportInfos if the following conditions are fulfilled:
    - There is a model where the parent ExportInfo objDef as well all child ExportInfo 
      ObjDefs have at least one ObjOcc
    - All child ObjOccs are connected to the parent ObjOcc
    
    If so then the child ObjOccs are sorted by their distance to the parent ObjOcc. An 
    Array of their sorted child ExportInfos is returned.
    If not then the unsorted child ExportInfo list is returned.
---------------------------------------------------------------------------------------*/
function sortExportInfosByDistanceOfLinkedOccs( oParentExportInfo, aChildExportInfos ) {
    
    if (aChildExportInfos == null) {return null;}
    if (aChildExportInfos.length <= 1) {return aChildExportInfos;}
    
    var hmObjOcc2ExportInfo = new java.util.HashMap();
    var aObjOccsToSort = findParentLinkedChildObjOccsToSort( oParentExportInfo, aChildExportInfos, hmObjOcc2ExportInfo );
    
    //if no model could be found where the conditions for the ObjOccs were fulfilled then return unsorted list
    if (aObjOccsToSort.length == 0) {
        return aChildExportInfos;    
    }
    
    //calculate the distances of the child ObjOccs (from center to center)
    var oParentObjOcc = aObjOccsToSort.shift();
    var aDistanceArray = new Array();
    for (var i=0; i<aObjOccsToSort.length; i++) {
        
        var iParentXCenter = oParentObjOcc.X() + (oParentObjOcc.Width()/2);
        var iParentYCenter = oParentObjOcc.Y() - (oParentObjOcc.Height()/2);
        var iChildXCenter = aObjOccsToSort[i].X() + (aObjOccsToSort[i].Width()/2);
        var iChildYCenter = aObjOccsToSort[i].Y() - (aObjOccsToSort[i].Height()/2);
        
        var xDist = Math.abs( iParentXCenter - iChildXCenter );
        var yDist = Math.abs( iParentYCenter - iChildYCenter );
        var fDistance = Math.sqrt( Math.pow(xDist,2) + Math.pow(yDist,2) );
        
        var oObjOccDistanceContainer = new ObjOccDistanceContainer();
        oObjOccDistanceContainer.Occ = aObjOccsToSort[i];
        oObjOccDistanceContainer.Distance = fDistance;
        aDistanceArray.push( oObjOccDistanceContainer );
    }
    
    //sort the distance container array
    aDistanceArray.sort(sortDistanceContainers);
    
    //create the ExportInfo result array
    var sortedExportInfoArray = new Array();
    for (var j=0; j<aDistanceArray.length; j++) {
        sortedExportInfoArray.push( hmObjOcc2ExportInfo.get(aDistanceArray[j].Occ) );    
    }
    return sortedExportInfoArray;
}


/*---------------------------------------------------------------------------------------
 Determines a set of child ObjOccs to be sorted by the following steps:
 - There must be a model where the parent ObjDef as well as all child ObjDefs have
   occurrences; if no such model exists then an empty Array is returned
 - Inside this model the child ObjOccs must be connected to the parent ObjOcc; if this
   condition is not fulfilled by any qualified model from the first step then an empty 
   Array is returned
 
 If both conditions are met then a list of ObjOccs is returned where the parent ObjOcc
 is the first element, followed by all child ObjOccs to be sorted.
 If no parent or child ObjDefs are passed to the function then an empty Array is 
 returned.
 The passed hmObjOcc2ExportInfo will contain a mapping for each ObjOcc of the result
 JSArray to the according child ExportInfo.
---------------------------------------------------------------------------------------*/
function findParentLinkedChildObjOccsToSort(oParentExportInfo, aChildExportInfos, hmObjOcc2ExportInfo) {

    if (oParentExportInfo == null || aChildExportInfos == null || aChildExportInfos.length <= 1) {return new Array();}

    var aObjOccsToSort = new Array();
    
    //find a model where parent and all child objdefs have linked occurrences
    var aParentObjOccs = oParentExportInfo.getObjDef().OccList();
    for (var i=0; i<aParentObjOccs.length; i++) {

        hmObjOcc2ExportInfo.clear();
        var oParentObjDefModel = aParentObjOccs[i].Model();

        //all children must have ObjOccs in this model
        var aFoundObjOccs = new Array();
        for (j=0; j<aChildExportInfos.length; j++) {
            var aChildObjOccs = aChildExportInfos[j].getObjDef().OccList();
            for (k=0; k<aChildObjOccs.length; k++) {
                if (aChildObjOccs[k].Model().equals( oParentObjDefModel )) {
                    //there can be multiple occurrences of the same ObjDef in this model -> keep them all and find out
                    //the real connected one in the next step
                    aFoundObjOccs.push(aChildObjOccs[k]);
                    hmObjOcc2ExportInfo.put(aChildObjOccs[k], aChildExportInfos[j]);
                }
            }
        }
        
        //the children ObjOccs must be linked to the parent ObjOcc
        var aConnectedObjOccs = new Array();
        var aParentObjOccCxns = aParentObjOccs[i].CxnOccList();
        for (var m=0; m<aFoundObjOccs.length; m++) {
            for (var n=0; n<aParentObjOccCxns.length; n++) {
                if (aParentObjOccCxns[n].SourceObjOcc().equals( aFoundObjOccs[m] )
                    || aParentObjOccCxns[n].TargetObjOcc().equals( aFoundObjOccs[m] )
                    ) {
                    aConnectedObjOccs.push( aFoundObjOccs[m] );
                    break;
                }
            }
        }
        //if the Array lengths don't match then at least one found child ObjOcc is not connected to the parent ObjOcc -> try the next model
        if (aConnectedObjOccs.length < aChildExportInfos.length) {
            continue;
        }
    
        //if everything is fulfilled then work with these child ObjOccs
        aObjOccsToSort.push(aParentObjOccs[i]);
        for (var p=0; p<aConnectedObjOccs.length; p++) {
            aObjOccsToSort.push(aConnectedObjOccs[p]);    
        }
        break;
    }
    
    //it is possible that hmObjOcc2ExportInfo still contains ObjOccs which are not part of oRemainingOccs but this does not matter
    var oRemainingOccs = convertJSArrayToHashSet(aObjOccsToSort);
    
    return aObjOccsToSort;    
}


/*---------------------------------------------------------------------------------------
    Data container for sorting ObjOccs by distance
---------------------------------------------------------------------------------------*/
function ObjOccDistanceContainer( oChildObjOcc, fDistance ) {    
    this.Occ = oChildObjOcc;
    this.Distance = fDistance;   
}

/*---------------------------------------------------------------------------------------
 Sorts ObjOccs by their XY position. ObjOccs with smaller X get a smaller index.
 If elements have the same X then the Y is compared. Again ObjOccs with smaller
 Y get a smaller index.
---------------------------------------------------------------------------------------*/
function sortDistanceContainers( firstContainer, secondContainer ) {
    return firstContainer.Distance - secondContainer.Distance;        
}

//------------------------------- OCCURRENCE SORTING ------------------------------------
//---------------------------------------------------------------------------------------


//-------------------------------- ARIS ITEM SORTING ------------------------------------
//---------------------------------------------------------------------------------------

/*---------------------------------------------------------------------------------------
 Sort two ARIS items (ObjDefs, Models) lexically by their GUID.
---------------------------------------------------------------------------------------*/
function sortByGUID( firstObject, secondObject ) {
    if (firstObject == null || secondObject == null) {return 0;}
    var firstGUID = firstObject.GUID() + "";
    var secondGUID = secondObject.GUID() + "";
    return firstGUID.localeCompare(secondGUID);        
}

/*---------------------------------------------------------------------------------------
 Sort two ExportInfos lexically by their GUID.
---------------------------------------------------------------------------------------*/
function sortExportInfoByArcmGUID( firstExportInfo, secondExportInfo ) {
    if (firstExportInfo == null || secondExportInfo == null) {return 0;}
    var firstGUID = firstExportInfo.sArcmGuid + "";
    var secondGUID = secondExportInfo.sArcmGuid + "";
    return firstGUID.localeCompare(secondGUID);        
}

/*---------------------------------------------------------------------------------------
 Sort two link mappings lexically by their ID.
---------------------------------------------------------------------------------------*/
function sortMappingElementsByID( firstMappingElement, secondMappingElement ) {
    if (firstMappingElement == null || secondMappingElement == null) {return 0;}
    var firstID = firstMappingElement.getAttributeValue("id") + "";
    var secondID = secondMappingElement.getAttributeValue("id") + "";
    return firstID.localeCompare(secondID);        
}

//---------------------------------------------------------------------------------------
//-------------------------------- ARIS ITEM SORTING ------------------------------------


//---------------------------------------------------------------------------------------
//---------------------------- TYPENUM HELPER FUNCTIONS ---------------------------------

/*---------------------------------------------------------------------------------------
    Checks the attribute type number:
    - for empty values -1 is returned
    - numerical values are not changed but only returned
    - if they belong to standard items the value of "Constants." + <p_sTypeNum>
      is returned
    - if they belong to custom items with GUID the currently valid TypeNumber
      is returned.
    - if it does not belong to any category above -1 is returned
---------------------------------------------------------------------------------------*/
function obtainTypeNumFromFilter(p_sTypeNum, p_sFilterFunction) {
    
    var sTypeNum = new java.lang.String(p_sTypeNum);  

    //if no TypeNum was set
    if (sTypeNum.length() == 0) {return -1;}
    
    //if TypeNum is already a number just return it
    if (!isNaN(sTypeNum)) {return Number(p_sTypeNum);}
 
    //if TypeNum belongs to a standard attribute return the corresponding Constant
    var iTypeNum;
    try {
        iTypeNum = eval("Constants." + sTypeNum);
        if (!isNaN(iTypeNum)) {
            return Number(iTypeNum);
        }
    }
    catch (e) {
        //ok, it does not
    }
 
    //check if TypeNum is the GUID of a user-defined attribute  
    try {
        if (p_sFilterFunction != null) {
            iTypeNum = eval("ArisData.ActiveFilter()." + p_sFilterFunction + "('" + sTypeNum.trim() + "')" );
            if (!isNaN(iTypeNum)) {
                return Number(iTypeNum);
            }
        }
    }
    catch (e) {
        //ok, it is not
    }
    
    //unknown TypeNum
    return -1;
}

function getAttributeTypeNum(p_sTypeNum) {
    return obtainTypeNumFromFilter(p_sTypeNum, "UserDefinedAttributeTypeNum");
}

function getModelTypeNum(p_sTypeNum) {
    return obtainTypeNumFromFilter(p_sTypeNum, "UserDefinedModelTypeNum");
}

function getSymbolTypeNum(p_sSymbolNum) {
    return obtainTypeNumFromFilter(p_sSymbolNum, "UserDefinedSymbolTypeNum");
}

function getObjectTypeNum(p_sObjectNum) {
    return obtainTypeNumFromFilter(p_sObjectNum, null);
}

function getConnectionTypeNum(p_sObjectNum) {
    return obtainTypeNumFromFilter(p_sObjectNum, null);
}

//---------------------------- TYPENUM HELPER FUNCTIONS ---------------------------------
//---------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------
//------------------------ ATTR VALUE READ HELPER FUNCTIONS -----------------------------

/*---------------------------------------------------------------------------------------
    Determines the attribute value and returns it as JavaScript String.
    The following keywords for parameter p_attrTypeNum are handled: 
        MODELGUID, 
        MODELNAME, 
        OBJECTGUID,
		FULLNAME,
        ISMULTIPLE,
		ENDDATE#<start date attribute>#<duration attribute>,
		DURATION#<duration attribute>,
        CONSTANT#<constant value>
        EVENT_DRIVEN_ALLOWED#<standard boolean attribute>#<attr value attribute>#<attr value for 'event-driven'>
    
    Standard attribute are handled by function "getAttrValue_Default".
    Returns the determined value as String or "", never null.
---------------------------------------------------------------------------------------*/
function getAttrValue(p_oExportInfoCxnDefOrModel, p_attrTypeNum, p_sAttrType, p_model, p_sAttrDefaultValue) {
    
    //oExportInfo instanceof exportInfo
    var oItem;
    var sMappingObjectID = null;
    if (p_oExportInfoCxnDefOrModel instanceof exportInfo) {
        oItem = p_oExportInfoCxnDefOrModel.getObjDef();
        sMappingObjectID = p_oExportInfoCxnDefOrModel.sMappingObjectID;
    } else {
        oItem = p_oExportInfoCxnDefOrModel;
    }
    
    var sAttrValue = "";
    if (p_attrTypeNum == null) {
        return sAttrValue;
    }
    
    if (valuesAreEqual(p_attrTypeNum, "MODELGUID")) {
        if (!g_bDummyHierarchyModels) {
            sAttrValue = getGuid(p_model);
        } else {
            sAttrValue = "00000000-000-000-000-000000000000";
        }
        
    } else if (valuesAreEqual(p_attrTypeNum, "MODELNAME")) {
        if (!g_bDummyHierarchyModels) {
            sAttrValue = getName(p_model);
        } else {
            sAttrValue = "DUMMY_MODELNAME";
        }
    
    } else if (valuesAreEqual(p_attrTypeNum, "OBJECTGUID")) {sAttrValue = getGuid(oItem);
        
    } else if (valuesAreEqual(p_attrTypeNum, "FULLNAME")) {
	
		sAttrValue =  getAttrValue_Default(oItem, "AT_FIRST_NAME", "String")
					+ " "
					+ getAttrValue_Default(oItem, "AT_LAST_NAME", "String");
        
    } else if (valuesAreEqual(p_attrTypeNum, "ISMULTIPLE")) {sAttrValue = getAttrValue_EnumMultiple(oItem, p_attrTypeNum, p_sAttrType);       
         
    } else if (java.lang.String(p_attrTypeNum).startsWith("REPORTPROPERTY#")) {  
	
		var propertyName = java.lang.String(p_attrTypeNum).substring("REPORTPROPERTY#".length);
		sAttrValue = Context.getProperty( propertyName );
	
	} else if (java.lang.String(p_attrTypeNum).startsWith("ENDDATE#")) {  
	
		var enddateCalculationParamString = java.lang.String(p_attrTypeNum).substring("ENDDATE#".length);
		sAttrValue = getAttrValue_EnddateCalculation(oItem, enddateCalculationParamString);
	
	} else if (java.lang.String(p_attrTypeNum).startsWith("DURATION#")) {
	
		var durationAttributeID = java.lang.String(p_attrTypeNum).substring("DURATION#".length);
		var sDurationStringValue = oItem.Attribute( eval("Constants." + durationAttributeID) , g_nLoc).GetValue(false);
        sAttrValue = getAttrValue_Duration(sDurationStringValue);
	
    } else if(java.lang.String(p_attrTypeNum).startsWith("FILESIZE#")){
        
        var filesizeAttrString = java.lang.String(p_attrTypeNum).substring("FILESIZE#".length);
          // reads file size using ADS link
        var nAttrTypeNum = getAttributeTypeNum(filesizeAttrString);
        if (nAttrTypeNum > 0) {
            if (valuesAreEqual(new String(filesizeAttrString).substring(0,12), "AT_ADS_LINK_")) {
                var adsComp = Context.getComponent("ADS");
                if (adsComp != null) {
                    var hyperLink = oItem.Attribute(nAttrTypeNum, g_nLoc).GetValue(true);
                    var document = adsComp.getDocumentByHyperlink(hyperLink);
                    if(document != null) {
                        var size = org.apache.commons.io.IOUtils.toByteArray(document.getDocumentContent()).length;
                        sAttrValue = size;
                    }
                }
            }
        }
    } else if (java.lang.String(p_attrTypeNum).startsWith("CONSTANT#")) {sAttrValue = java.lang.String(p_attrTypeNum).substring("CONSTANT#".length);

    } else if (java.lang.String(p_attrTypeNum).startsWith("EVENT_DRIVEN_ALLOWED#")) {
    
        var tokenList = p_attrTypeNum.split("#");
        if (tokenList.length == 4) {
            var eventDrivenBooleanAttributeTypeNumString = tokenList[1]; //the "normal" boolean attribute to export...
            var frequencyAttributeTypeNumString = tokenList[2]; //... except in those cases where this frequency attribute...
            var frequencyAttributeEventDrivenValueTypeNumString = tokenList[3]; //... has this value -> in this case we export "true"
            
            sAttrValue = getAttrValue_eventDrivenAllowed(oItem, p_sAttrType, eventDrivenBooleanAttributeTypeNumString, frequencyAttributeTypeNumString, frequencyAttributeEventDrivenValueTypeNumString);
        }
    
	} else { 
        sAttrValue = getAttrValue_Default(oItem, p_attrTypeNum, p_sAttrType);
    }
    
    if ((sAttrValue == null || sAttrValue == "") && p_sAttrDefaultValue != null) {
        sAttrValue = p_sAttrDefaultValue;
    }
    
    return sAttrValue += "";
}

/*---------------------------------------------------------------------------------------
    Determines the attribute value of standard attributes.
    The following attribute types are handled specially: "Date", "Boolean" "Enum_<XXX>".
    Returns the determined value as String or "", never null.
---------------------------------------------------------------------------------------*/
function getAttrValue_Default(p_oItem, p_attrTypeNum, p_sAttrType) {
    
    // Enumeration
    if (valuesAreEqual(new String(p_sAttrType).substring(0,5), "Enum_") && p_attrTypeNum != null) {
        
        //check if preselected value shall be used for XML export
        var aAttrTypeNumParts = (p_attrTypeNum + "").split("#");
        //no preselection specified
        if (aAttrTypeNumParts.length == 1) {
            var enumValue = getAttrValue_Enum(p_oItem, p_attrTypeNum, p_sAttrType);
            return enumValue;
        }
        //preselection specified
        if (aAttrTypeNumParts.length == 2) {
            return aAttrTypeNumParts[1];
        }
        return "";
    }
    
    //Non-Enumeration
    var nAttrTypeNum = getAttributeTypeNum(p_attrTypeNum);
    if (nAttrTypeNum > 0) {
        
        // Date
        if (valuesAreEqual(p_sAttrType, "Date")) {
            if (p_oItem.Attribute(nAttrTypeNum, g_nLoc).MeasureValue() == null) {
                return "";
            }
            return p_oItem.Attribute(nAttrTypeNum, g_nLoc).MeasureValue().getTime();
        } 
        // Boolean
        if (valuesAreEqual(p_sAttrType, "Boolean")) {
            if (isboolattributetrue(p_oItem, nAttrTypeNum, g_nLoc)) {
                return "true";
            } else if (isboolattributefalse(p_oItem, nAttrTypeNum, g_nLoc)) {
                return "false";
            } else {
                return "";
            }
        }

        // converts ADS link to GUID
        if (valuesAreEqual(new String(p_attrTypeNum).substring(0,12), "AT_ADS_LINK_") && p_attrTypeNum != null) {
            return ARCM.transformADSLinkToGUID(p_oItem.Attribute(nAttrTypeNum, g_nLoc).GetValue(true));
        }
        
        // String
        if (valuesAreEqual(p_sAttrType, "String")) {
            return p_oItem.Attribute(nAttrTypeNum, g_nLoc).GetValue(true);
		}
        
        // default (Number, Double, Text)
        return p_oItem.Attribute(nAttrTypeNum, g_nLoc).GetValue(false);
        
    }
    // no valid attr type num
    return "";
}

/*---------------------------------------------------------------------------------------
    Determines the value from the enum mapping corresponding to the given value.
    If a matching mapping enum item is found then the value of its attribute "id" is
    returned, otherwise "".
---------------------------------------------------------------------------------------*/
function getStaticMappingValue_Enum(p_value, p_sAttrType) {
    if (valuesAreEqual(new String(p_sAttrType).substring(0,5), "Enum_")) {
        var oMappingEnumNode = getMappingEnum(new String(p_sAttrType).substring(5));
        if (oMappingEnumNode != null) {

            var oEnumItemNodes = oMappingEnumNode.getChildren("enumItem");
        
            var iterItems = oEnumItemNodes.iterator();
            while (iterItems.hasNext()) {
                var oEnumItemNode = iterItems.next();
                
                var sTypeNum = oEnumItemNode.getAttributeValue("aris_typenum");
                if (valuesAreEqual(sTypeNum, p_value)) {
                    return oEnumItemNode.getAttributeValue("id");                
                }
            }
        }
        // entry not found in enum mapping
        return "";
    }
    return p_value;
}

/*---------------------------------------------------------------------------------------
    Determines the value of enum attributes at the given ObjDef by reading the selected
    Enum value at the ObjDef and comparing it to the enum item mappings from the
    mapping XML.
    If a matching mapping enum item is found then the value of its attribute "id" is
    returned, otherwise "".
---------------------------------------------------------------------------------------*/
function getAttrValue_Enum(p_oItem, p_attrTypeNum, p_sAttrType) {
    var oMappingEnumNode = getMappingEnum(new String(p_sAttrType).substring(5));
    if (oMappingEnumNode == null) {
        return "";
    }                
    
    var nAttrTypeNum = getAttributeTypeNum(p_attrTypeNum);
    if (nAttrTypeNum > 0) {    
        var oAttribute = p_oItem.Attribute(nAttrTypeNum, g_nLoc);
        var sUnitTypeNum = "";
        if (oAttribute.IsMaintained()) {
            sUnitTypeNum = oAttribute.MeasureUnitTypeNum();
        }
        
        var sAttrGUID = null;
        if (ArisData.ActiveFilter().isUserDefinedAttrType(nAttrTypeNum)) {
            sAttrGUID = ArisData.ActiveFilter().UserDefinedAttributeTypeGUID(nAttrTypeNum);
        }

        var enumValue = getXmlEnumValueViaMapping(oMappingEnumNode, sUnitTypeNum, sAttrGUID);
        return enumValue;
    }
    // no valid attr type num
    return "";        
}

/*---------------------------------------------------------------------------------------
    Determines the value of the XML enum element whose attribute "aris_typenum" fits to
    the given value "p_sUnitTypeNum" (including processing with "getAttributeTypeNum()")
    The value of "aris_typenum" from XML can have two meanings:
    1) A reference to a boolean attribute (for items of multiple enums - Example: assertion)
    2) A reference to a attribute value type (for items of single enums - Example: impact)
    In each case the value of "aris_typenum" can be a direct type number, a 
    constant reference or a GUID.
    If a matching mapping enum item is found then the value of its attribute "id" is
    returned, otherwise "".
    
    Parameter p_attributeValueTypeGUID is only needed when an user defined attribute value
    type of an user defined value attribute must be resolved by both attribute and
    attribute value type GUID.
---------------------------------------------------------------------------------------*/    
function getXmlEnumValueViaMapping(p_oMappingEnumNode, p_sUnitTypeNum, p_attributeValueTypeGUID) {
    
    var oEnumItemNodes = p_oMappingEnumNode.getChildren("enumItem");
    var iterItems = oEnumItemNodes.iterator();
    
    while (iterItems.hasNext()) {
        var oEnumItemNode = iterItems.next();
        var sXMLTypeNumValue = oEnumItemNode.getAttributeValue("aris_typenum");
        
        //case 1) - Boolean attribute as part of a multi enum mapping
        var attrValueTypeNum = getAttributeTypeNum(sXMLTypeNumValue);
        
        //case 2) - reference for a value type of a value attribute
        //maybe special case 2) where the enumItem aris_type_num points at an user-defined attribute value type of an 
        //user-defined value attribute
        if (attrValueTypeNum == undefined && attrValueTypeNum != -1 
            && p_attributeValueTypeGUID != null && p_attributeValueTypeGUID != ""
            && (sXMLTypeNumValue != null && sXMLTypeNumValue.length() > 0)
            ) {
            attrValueTypeNum = ArisData.ActiveFilter().UserDefinedAttributeValueTypeNum(p_attributeValueTypeGUID, sXMLTypeNumValue);        
        }
        
        if ( (attrValueTypeNum != undefined) && valuesAreEqual(attrValueTypeNum, p_sUnitTypeNum) ) {   
            return oEnumItemNode.getAttributeValue("id");                
        }
    }
    // entry not found in enum mapping    
    return "";
}

/*---------------------------------------------------------------------------------------
    Determines the value of "multiple" enums.
    If a matching mapping enum item is found then the value of its attribute "id" is
    returned, separated by commas; otherwise "".
---------------------------------------------------------------------------------------*/        
function getAttrValue_EnumMultiple(p_objDef, p_attrTypeNum, p_sAttrType) {
    var oMappingEnumNode = getMappingEnum(new String(p_sAttrType).substring(5));
    if (oMappingEnumNode == null) {
        return "";
    }                
    var sAttrValue = "";
    
    var oEnumItemNodes = oMappingEnumNode.getChildren("enumItem");
    var iterItems = oEnumItemNodes.iterator();
    
    while (iterItems.hasNext()) {
        var oEnumItemNode = iterItems.next();
        var nAttrTypeNum = getAttributeTypeNum(oEnumItemNode.getAttributeValue("aris_typenum"));
        if (nAttrTypeNum > 0) {     
            if (isboolattributetrue(p_objDef, nAttrTypeNum, g_nLoc)) {
                if (sAttrValue.length > 0) {
                    sAttrValue = sAttrValue.concat(",");
                }
                sAttrValue = sAttrValue.concat(oEnumItemNode.getAttributeValue("id"));                
            }
        }
    }
    return sAttrValue;
}

/*---------------------------------------------------------------------------------------
    Reads the String attribute value of a duration attribute and converts it in
    timeInMillis since 1970 as String.
---------------------------------------------------------------------------------------*/
function getAttrValue_Duration(sDurationValue) {

    var mults = new Array(1, 60, 3600, 86400);
    
    sDurationValue = sDurationValue.trim();
    if (sDurationValue == null || sDurationValue.length() == 0) {return 0;}
    
    var timeInMillis = 0;
    var tokenList = java.util.Arrays.asList(sDurationValue.split(":"));
    if(tokenList.isEmpty()) {return 0;}
    java.util.Collections.reverse(tokenList);//seconds always first

    for (var i=0; i<Math.min(tokenList.size(), 4); i++) {
        timeInMillis += java.lang.Long.parseLong(tokenList.get(i)) * mults[i];
    }

    return new java.lang.String(timeInMillis * 1000);    
}

/*---------------------------------------------------------------------------------------
    Checks if the given frequency attribute is maintained and has the given value
    indicating "Event-driven".
    If so then "true" is returned, otherwise the standard boolean value read from
    the given boolean is returned.
---------------------------------------------------------------------------------------*/
function getAttrValue_eventDrivenAllowed(   p_objDef,
                                            p_sAttrType, 
                                            eventDrivenBooleanAttributeTypeNumString, 
                                            frequencyAttributeTypeNumString, 
                                            frequencyAttributeEventDrivenValueTypeNumString ) {
    
    //which value has the frequency enumeration set?
    var frequencyAttributeTypeNum = getAttributeTypeNum(frequencyAttributeTypeNumString);
    var frequencyAttributeMaintainedValueTypeNum = null;
    if (frequencyAttributeTypeNum > 0) {    
        var frequencyAttribute = p_objDef.Attribute(frequencyAttributeTypeNum, g_nLoc);
        if (frequencyAttribute.IsMaintained()) {
            frequencyAttributeMaintainedValueTypeNum = frequencyAttribute.MeasureUnitTypeNum();
        }
    }
    //which value would be the special event driven value?
    var frequencyAttributeEventDrivenValueTypeNum = getAttributeTypeNum(frequencyAttributeEventDrivenValueTypeNumString);
    
    //if they are equal (i.e. event-driven is set) then return "true"
    if (frequencyAttributeMaintainedValueTypeNum + "" == frequencyAttributeEventDrivenValueTypeNum + "") {
        return "true";
    }
    //otherwise return the boolean value of the event driven boolean attribute as usual
    else {
        //p_sAttrType is "Boolean"
        return getAttrValue_Default(p_objDef, eventDrivenBooleanAttributeTypeNumString, p_sAttrType);
    }    
        
}

/*---------------------------------------------------------------------------------------
    Calls ObjDef.getEndDate(int startATN, int durationATN, int localeID).
    This method then calculates the enddate based on the attribute values and the
    boolean flag AT_WEEKEND_OFF.
---------------------------------------------------------------------------------------*/
function getAttrValue_EnddateCalculation(p_objDef, enddateCalculationParamString) {
    
    var tokenList = java.util.Arrays.asList(enddateCalculationParamString.split("#"));
    var startdateAttributeTypeNum = eval( "Constants." + tokenList.get(0) );
    var durationAttributeTypeNum = eval( "Constants." + tokenList.get(1) );
    
    var enddate = p_objDef.getEndDate(startdateAttributeTypeNum, durationAttributeTypeNum, g_nLoc);
    if (enddate == null) {return null;}
    return enddate.getTime();
}

/*---------------------------------------------------------------------------------------
    Checks if both Strings are equal.
    -> returns true, else false
 ---------------------------------------------------------------------------------------*/        
function valuesAreEqual(p_value1, p_value2) {
    if (p_value1 != null && p_value2 != null) {
        var sValue1 = java.lang.String(p_value1);
        var sValue2 = java.lang.String(p_value2);        
        return (sValue1.compareToIgnoreCase(sValue2) == 0);
    }
    return false;
}

//------------------------ ATTR VALUE READ HELPER FUNCTIONS -----------------------------
//---------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------
//------------------------ USER GROUP ROLE HELPER FUNCTIONS -----------------------------

// map of user group export Info to group role string (the id of the corresponding role enum item)
var g_hm_usergroupExportInfo2groupRoleString = new java.util.HashMap(); //Format: exportInfo | String

/*---------------------------------------------------------------------------------------
 * Returns for the given ObjDef the group role string based on the enum mapping
 * "userrole_type" - one of the enum item IDs or "" if role is not set.
 ---------------------------------------------------------------------------------------*/
function getGroupRoleString(p_oUserGroupObjDef) {
    var result = g_hm_usergroupExportInfo2groupRoleString.get(p_oUserGroupObjDef);
    //if not yet determined then do it now
    if (result == null) {
        storeGroupRoleString(p_oUserGroupObjDef);
    }
    result = g_hm_usergroupExportInfo2groupRoleString.get(p_oUserGroupObjDef);
    //if group role string could be determined (i.e. ObjDef represents a USERGROUP) then return it...
    if (result != null) {
        return result;
    }
    //... otherwise ""
    else {
         return "";
    }
}

/*---------------------------------------------------------------------------------------
 * If at the given ObjDef the attribute AT_ARCM_ROLE is set then the value is resolved
 * against the enum mapping "userrole_type" (either matching enum item "id" or "") and
 * stores it in g_hm_usergroupExportInfo2groupRoleString.
 ---------------------------------------------------------------------------------------*/
function storeGroupRoleString(p_oUserGroupObjDef) {
    var oAttribute = p_oUserGroupObjDef.Attribute(Constants.AT_ARCM_ROLE, g_nLoc);
    if (oAttribute.IsMaintained()) {
        var sGroupRole = getAttrValue_Enum(p_oUserGroupObjDef, Constants.AT_ARCM_ROLE, "Enum_userrole_type");
        g_hm_usergroupExportInfo2groupRoleString.put(p_oUserGroupObjDef, sGroupRole);
    }
}

/*---------------------------------------------------------------------------------------
 * Checks for the given USERGROUP exportInfo if the registered group role String
 * matches the given group role String.
 ---------------------------------------------------------------------------------------*/
function groupRoleStringMatches(p_oUserGroupObjDef, p_sGroupRoleString) {
	if (p_sGroupRoleString == null) {return false;}
    var aRegisteredRoleString = getGroupRoleString(p_oUserGroupObjDef);
    return aRegisteredRoleString == p_sGroupRoleString;
}

//------------------------ USER GROUP ROLE HELPER FUNCTIONS -----------------------------
//---------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------
//------------------------------ EXECUTION TIME LOGGING ---------------------------------

/*---------------------------------------------------------------------------------------
 Creates an execution time string about the passed minutes, seconds and millis.
---------------------------------------------------------------------------------------*/
function createExecutionTimeString(p_sPrefix, p_oStartDate, p_oEndDate) {
    return createDurationStringByMillis(p_sPrefix, p_oEndDate.getTime() - p_oStartDate.getTime());
}

/*---------------------------------------------------------------------------------------
 Creates an execution time string about the passed minutes, seconds and millis.
---------------------------------------------------------------------------------------*/
function createDurationStringByMillis(p_sPrefix, p_lDurationMillis) {
    
    var result = "";

    var differenceMillis = p_lDurationMillis % 1000;
    var differenceSeconds = java.lang.Math.floor( p_lDurationMillis / 1000 ) % 60;
    var differenceMinutes = java.lang.Math.floor( (p_lDurationMillis / 1000 ) - differenceSeconds) / 60;
    
    result = p_sPrefix + " - Time: " + differenceMinutes + " min., " + differenceSeconds + " sec., " + differenceMillis + " mil.";
    
    return result;
}

/*---------------------------------------------------------------------------------------
    Basic debug String info output method. Writes <debugInfo> tag referring to the
    following <object> tag
---------------------------------------------------------------------------------------*/ 
function writeXmlElement_ExecutionTime_BenchmarkString(p_oXmlOutput, p_oXmlOutput_Root, p_sDebugString) {
    if (p_sDebugString) {
        var oObjectDebugInfoNode = p_oXmlOutput.addElement(p_oXmlOutput_Root, "ExecTimeBenchmark");
        oObjectDebugInfoNode.setText(p_sDebugString);
    }
}

//------------------------------ EXECUTION TIME LOGGING ---------------------------------
//---------------------------------------------------------------------------------------