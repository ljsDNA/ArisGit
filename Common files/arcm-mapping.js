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

var g_mappingFileName = "aris2arcm-mapping.xml";
var g_xmlConfigReader = null;
var g_bStandardMappingsInitialized = false;

//---------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------- MAPPING PARSING -------------------------------------------------------

function initializeMappings() {
    return initializeMappingsWithOptions(true);
}

function initializeMappingsWithOptions(g_bDoConsistencyChecks) {
    var aMessages = new Array();
    
    var aParsingMessages = readStandardMappingFile(); //ArrayList of error messages if parsing fails
    aMessages = aMessages.concat(aParsingMessages);
    
    // readMappingCustomizings(); //ArrayList of error messages if parsing fails
    
    if (g_bDoConsistencyChecks) {
        var aConsistencyCheckMessages = performMappingConsistencyChecks(); //ArrayList of error messages if mapping is not consistent
        aMessages = aMessages.concat(aConsistencyCheckMessages);
    }
    
    return aMessages;
}


/*---------------------------------------------------------------------------------------
 * Tries to initialize the XMLParser for the aris2arcm mapping file in this order:
 * 1. The mapping file under "Common files"
 * 2. The mapping file in the calling report's category folder
 * 3. The selection by the user
 * If initialisation succeeds then the global variable g_xmlConfigReader is set and ready to use
 * If it fails then the corresponding error String is thrown.
---------------------------------------------------------------------------------------*/
function readStandardMappingFile() {
    
    //mapping file was already read -> do nothing
    if (g_xmlConfigReader != null && g_xmlConfigReader.isValid()) {return new Array();}
    
    //---- read the standard mapping file as JDOM
    var configFile = null;
    try {
        //1. search standard mapping file in "Common files"
        try {
            configFile = Context.getFile(g_mappingFileName, Constants.LOCATION_COMMON_FILES);
        } catch (e) {
            //ignore NPE if file could not be found
        }
        
        //2. search standard mapping file in the calling report's category folder
        if (configFile == null) {
            try {
                configFile = Context.getFile(g_mappingFileName, Constants.LOCATION_SCRIPT);
            } catch (e) {
                //ignore NPE if file could not be found
            }
        }
        
        //3. get standard mapping file by user selection dialog
        if (configFile == null && areDialogsAvailable()) {
            configFile = getImportFile();
        }
        
        // check if found and OK
        if (configFile == null) {
            throw "error";
        }
        
        // parse it
        g_xmlConfigReader = Context.getXMLParser(configFile);
        if (!g_xmlConfigReader.isValid()) {
            throw "error";
        }
        
        // read the standard mappings
        initializeMappingsByStandardMappingFile();
        
        return new Array(); //besides hard XML parsing errors we do not report anything else here
	   
    } catch (e) {
        var aMappingInitMessages = new Array();
        var sErrorMsg = "The mapping file '" + g_mappingFileName + "' could not be parsed: " + e + " - at line: " + e.lineNumber + " (" + e.fileName + ")";   
        aMappingInitMessages.push(sErrorMsg);
        if (g_bRemoteCalled || !areDialogsAvailable()) {
            Context.setProperty(g_errorMessageProperty, sErrorMsg);
        } else {
            Dialogs.MsgBox(sErrorMsg, Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_ERROR, "Mapping error");
        }
        return aMappingInitMessages;
    }  
}

var g_bDialogsAvailable = null;
/*---------------------------------------------------------------------------------------
    Runtime check if Dialogs are allowed at the current report execution.
---------------------------------------------------------------------------------------*/
function areDialogsAvailable() {
    if (g_bDialogsAvailable == null) {
        var scriptAdmin = Context.getComponent("ScriptAdmin");
        var scriptID = Context.getScriptInfo(Constants.SCRIPT_ID);
        var scriptInfo = scriptAdmin.getScriptInfo(Constants.SCRIPT_ID, null, scriptID, g_nLoc);
        g_bDialogsAvailable = scriptInfo.hasDialogSupport();
    }
    return g_bDialogsAvailable;
}

/*---------------------------------------------------------------------------------------
    Browse dialog for selection of mapping file
---------------------------------------------------------------------------------------*/
function getImportFile() {
    var sdefname = "";
    var sdefext = "*.xml!!XML Document|*.xml||";
    var sdefdir = "";
    var stitle = getString("MAPPING_FILE_SELECT");
    
    var file = null;
    var files = Dialogs.BrowseForFiles(sdefname, sdefext, sdefdir, stitle, 0);
    
    if (files != null && files.length > 0) { file = files[0] }
    if (file != null) {
        return file.getData(); // getData() needed for returning the selected file as Byte[];
    } else {
        return null;    
    }
}

//---------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------- MAPPING CONTENT METADATA --------------------------------------------------

var g_iMappingNodeInternalID = 0;

function MappingNode() {
    
    this.iMappingNodeInternalID = g_iMappingNodeInternalID++;
    this.oParentMappingNode = null;
    this.sOriginNodeName = "";
    this.hm_nodeAttributeValues = new java.util.LinkedHashMap();    //format:	string --> string (can be null)
    this.hm_nodeChildren = new java.util.LinkedHashMap();           //format:	string --> ArrayList of MappingNodes
    
    this.setParentMappingNode = function(p_oParentMappingNode) {
        this.oParentMappingNode = p_oParentMappingNode;
    }
    this.getParentMappingNode = function() {
        return this.oParentMappingNode;
    }
    
    this.setOriginNodeName = function(sNodeName) {
        this.sOriginNodeName = sNodeName + "";
    }
    this.getOriginNodeName = function() {
        return this.sOriginNodeName;
    }
    
    this.setAttributeValue = function(id, value) {
        if (id == null || value == null) {return;}
        var sKey = id + "";
        if (value != null) {
            var sValue = value + "";
            this.hm_nodeAttributeValues.put(sKey + "", sValue);
        } else {
            this.hm_nodeAttributeValues.remove(sKey);
        }
    };
    this.getAttributeValue = function(id) {
        if (id != null) {
            var sJavaValue = this.hm_nodeAttributeValues.get(id + "");
            if (sJavaValue != null) {
                sJavaValue += ""; //ensure we only return JavaScript Strings, otherwise the comparisons don't work
            }
            return sJavaValue;
        } else {
            return null;
        }
    };
    this.getAttributeIDsSet = function() {
        return this.hm_nodeAttributeValues.keySet();
    };
    
    this.addChild = function(sChildType, oChildMappingNode) {
        if (sChildType == null || oChildMappingNode == null) {return;}
        var sKey = sChildType + ""; 
        var oMappingNodeList = this.hm_nodeChildren.get(sKey);
        if (oMappingNodeList == null) {
            oMappingNodeList = new java.util.ArrayList();
            this.hm_nodeChildren.put(sKey, oMappingNodeList);
        }
        oMappingNodeList.add(oChildMappingNode);
    };
    this.setChildren = function(sChildType, oChildMappingNodesArrayList) {
        if (sChildType == null || oChildMappingNodesArrayList == null) {return;}
        this.hm_nodeChildren.put(sChildType + "", oChildMappingNodesArrayList);
    };
    this.getChildren = function(sChildType) {
        if (sChildType == null) {return new java.util.ArrayList();}
        var children = this.hm_nodeChildren.get(sChildType + "");
        if (children == null) {children = new java.util.ArrayList();}
        return children;
    };
    this.removeChildren = function(sChildType) {
        if (sChildType == null) {return;}
        this.hm_nodeChildren.remove(sChildType + "");
    };
    this.getChildrenIDsSet = function() {
        return this.hm_nodeChildren.keySet();
    };
}

MappingNode.prototype.isEquivalentTo = function isEquivalentTo(oOtherMappingNode) {
    var oOwnAttrIdsSet = this.getAttributeIDsSet();
    var oOtherAttrIdsSet = this.getAttributeIDsSet();
    if (!oOwnAttrIdsSet.containsAll(oOtherAttrIdsSet) || !oOtherAttrIdsSet.containsAll(oOwnAttrIdsSet)) {
        return false;
    }
    
    var iter = oOwnAttrIdsSet.iterator(); 
    while (iter.hasNext()) {
        var sKey = iter.next();
        if (this.getAttributeValue(sKey) != oOtherMappingNode.getAttributeValue(sKey)) {
            return false;
        }
    }
    
    return true;
}

MappingNode.prototype.toString = function mappingNodeToString() {
    var sResult = "";
    sResult += "<" + this.sOriginNodeName + "> ---- ";
    sResult += this.iMappingNodeInternalID + " ---- ";
    if (this.hm_nodeAttributeValues.get("id") != null) {
        sResult += "ID: " + this.hm_nodeAttributeValues.get("id") + " ---- ";
    }
    sResult += "Attributes[" + this.hm_nodeAttributeValues.keySet().size() + "]: ";
    var sAttrIDsString = "";
    var iter = this.hm_nodeAttributeValues.keySet().iterator();
    while (iter.hasNext()) {
        if (sAttrIDsString.length > 0) {sAttrIDsString += ", ";}
        sAttrIDsString += iter.next();
    }
    sResult += sAttrIDsString + " ---- Links[" + this.hm_nodeChildren.keySet().size() + "]: "
    var sLinkIDsString = "";
    iter = this.hm_nodeChildren.keySet().iterator();
    while (iter.hasNext()) {
        var sSubLinkString = iter.next();
        sSubLinkString += "(" + this.hm_nodeChildren.get(sSubLinkString).size() + ")";
        if (sLinkIDsString.length > 0) {sLinkIDsString += ", ";}
        sLinkIDsString += sSubLinkString;
    }
    sResult += sLinkIDsString;
    
    return sResult;
}

MappingNode.prototype.toConditionString = function mappingNodeToString() {
    var sResult = "<";
    sResult += this.sOriginNodeName;
    
    if (this.hm_nodeAttributeValues.get("operator") != null) {
        sResult += " operator='" + this.hm_nodeAttributeValues.get("operator") + "'";
    }
    if (this.hm_nodeAttributeValues.get("type") != null) {
        sResult += " type='" + this.hm_nodeAttributeValues.get("type") + "'";
    }
    if (this.hm_nodeAttributeValues.get("aris_typenum") != null) {
        sResult += " aris_typenum='" + this.hm_nodeAttributeValues.get("aris_typenum") + "'";
    }
    if (this.hm_nodeAttributeValues.get("mapping_attr_ref") != null) {
        sResult += " mapping_attr_ref='" + this.hm_nodeAttributeValues.get("mapping_attr_ref") + "'";
    }
    if (this.hm_nodeAttributeValues.get("mapping_link_ref") != null) {
        sResult += " mapping_link_ref='" + this.hm_nodeAttributeValues.get("mapping_link_ref") + "'";
    }
    if (this.hm_nodeAttributeValues.get("mode") != null) {
        sResult += " mode='" + this.hm_nodeAttributeValues.get("mode") + "'";
    }
    if (this.hm_nodeAttributeValues.get("value") != null) {
        sResult += " value='" + this.hm_nodeAttributeValues.get("value") + "'";
    }
    if (this.hm_nodeAttributeValues.get("min_value") != null) {
        sResult += " min_value='" + this.hm_nodeAttributeValues.get("min_value") + "'";
    }
    if (this.hm_nodeAttributeValues.get("max_value") != null) {
        sResult += " max_value='" + this.hm_nodeAttributeValues.get("max_value") + "'";
    }
    sResult += ">";
    
    return sResult;
}


//---------------------------------------------------------------------------------------------------------------------------
//-------------------------------------- MAPPING CONTENT METADATA PARSING - STANDARD ----------------------------------------

var hm_mappingObjectID2mappingObject = new java.util.LinkedHashMap();   	//format:	<mappingObject> MappingNode attribute value of "id" --> <mappingObject> MappingNode
var hm_objectAndSymbolType2mappingObjects = new java.util.HashMap();		//format:	String of: object type ID (Long) + "|" + symbol type ID (Long) --> HashSet of <mappingObject> MappingNodes
var hm_mappingModel2mappingObjects = new java.util.HashMap();           	//format:   <mappingModel> MappingNode --> Set of <mappingObject> MappingNodes
var hm_mappingLink2mappingObject = new java.util.HashMap();             	//format:   <mappingLink> MappingNode --> <mappingObject> MappingNode

var hm_mappingObject2mappingAttrIDs = new java.util.LinkedHashMap();        //format:   <mappingObject> MappingNode --> Set of String, consisting of the values of attribute "id" at the mapping attributes

var hm_mappingObject2mappingLinkIDs = new java.util.LinkedHashMap();        //format:   <mappingObject> MappingNode --> Set of String, consisting of the values of attribute "id" at the mapping links
var hm_mappingObject2IncomingMappingLinks = new java.util.HashMap();    	//format:	<mappingObject> MappingNode --> Map with format: <mappingLink> MappingNode --> <mappingObject> MappingNode
var hm_mappingObject2OutgoingMappingLinks = new java.util.HashMap();    	//format:	<mappingObject> MappingNode --> Map with format: <mappingLink> MappingNode --> <mappingObject> MappingNode

var set_mappingModels = new java.util.HashSet();				            //format:   Set of <mappingModel> MappingNodes
var hm_mappingObject2mappingModels = new java.util.HashMap();				//format:   <mappingObject> MappingNode --> Set of <mappingModel> MappingNodes
var hm_modelType2mappingModels = new java.util.HashMap();               	//format:	model type ID (Long) --> Set of <mappingModel> MappingNodes

var hm_enumID2mappingEnum = new java.util.HashMap();				    	//format:	<mappingEnum> MappingNode attribute value of "aris_enum" if specified, otherwise attribute value of "arcm_enum" --> <mappingEnum> MappingNode
var hm_enumID2enumItemIDs = new java.util.HashMap();				    	//format:	<mappingEnum> MappingNode attribute value of "aris_enum" if specified, otherwise attribute value of "arcm_enum" --> Set of String, consisting of the values of attribute "id" at the <enumItem> MappingNode

var hm_mappingObjectID2hierarchicalLink = new java.util.HashMap();          //format:   <mappingObject> MappingNode attribute value of "id" --> first <mappingLink> MappingNode which has attribute "is_hierarchical" with value "true"

var set_cycleLinkMappingObjects = new java.util.HashSet();                  //format:   Set of <mappingObject> MappingNodes

/*--------------------------------------------------------------------------------------------------------------------------
    Converts all XML elements from the standard mapping file into MappingNodes.
    Then fills the access HashMaps and HashSets above.
 -------------------------------------------------------------------------------------------------------------------------*/
function initializeMappingsByStandardMappingFile() {
	
    if (g_bStandardMappingsInitialized || g_xmlConfigReader == null) {return;}
	var xmlConfig_Root = g_xmlConfigReader.getRootElement();
	
	//object mapping access
	var xmlConfig_MappingObjects = xmlConfig_Root.getChildren("mappingObject");
    var iterObj = xmlConfig_MappingObjects.iterator();
    while (iterObj.hasNext()) {
		var xmlConfig_MappingObject = iterObj.next();
        var mappingNode_MappingObject = createMappingNodeFromStandardMappingXMLNode(xmlConfig_MappingObject, null);
		
		var objectTypeNumString = mappingNode_MappingObject.getAttributeValue("aris_typenum");
		var objectTypeNum = getObjectTypeNum(objectTypeNumString);
		var symbolTypeNumString = null;
        if (mappingNode_MappingObject.getAttributeValue("aris_symbolnum") != null) {
            symbolTypeNumString = mappingNode_MappingObject.getAttributeValue("aris_symbolnum");
        }
		
		if (symbolTypeNumString == null) {
            var sKey = objectTypeNum + "";
            var oMappingObjects = hm_objectAndSymbolType2mappingObjects.get(sKey);
            if (oMappingObjects == null) {
                oMappingObjects = new java.util.HashSet();
                hm_objectAndSymbolType2mappingObjects.put(sKey, oMappingObjects);
            }
            oMappingObjects.add(mappingNode_MappingObject);
		} else {
			var symbolTypeNumStringParts = symbolTypeNumString.split(",");
			for (var i = 0; i < symbolTypeNumStringParts.length; i++) {
				var symbolTypeNum = getSymbolTypeNum(symbolTypeNumStringParts[i]);
				var sKey = objectTypeNum + "|" + symbolTypeNum;
                var oMappingObjects = hm_objectAndSymbolType2mappingObjects.get(sKey);
                if (oMappingObjects == null) {
                    oMappingObjects = new java.util.HashSet();
                    hm_objectAndSymbolType2mappingObjects.put(sKey, oMappingObjects);
                }
                oMappingObjects.add(mappingNode_MappingObject);
			}
		}
		
		var mappingObjectID = mappingNode_MappingObject.getAttributeValue("id");
		hm_mappingObjectID2mappingObject.put(mappingObjectID, mappingNode_MappingObject);
	}
	
	//mapping attribute IDs access and mapping links access
    var iterObj = getAllMappingObjects().iterator();
    while (iterObj.hasNext()) {
        var mappingNode_ParentMappingObject = iterObj.next();
        var sParentMappingObjectID = mappingNode_ParentMappingObject.getAttributeValue("id");
        
        //mapping attribute IDs access
        var mappingNode_MappingAttrList = mappingNode_ParentMappingObject.getChildren("mappingAttr");
        var mappingIterObj = mappingNode_MappingAttrList.iterator();
        while (mappingIterObj.hasNext()) {
            var sAttrID = mappingIterObj.next().getAttributeValue("id");
            var oAttrIds = hm_mappingObject2mappingAttrIDs.get(mappingNode_ParentMappingObject);
            if (oAttrIds == null) {
                oAttrIds = new java.util.HashSet();
                hm_mappingObject2mappingAttrIDs.put(mappingNode_ParentMappingObject, oAttrIds);
            }
            oAttrIds.add(sAttrID);
        }
        
        //mapping links access
        var mappingNode_MappingLinksList = mappingNode_ParentMappingObject.getChildren("mappingLink");
        var mappingIterObj = mappingNode_MappingLinksList.iterator();
        while (mappingIterObj.hasNext()) {
            var mappingNode_MappingLink = mappingIterObj.next();
            var sMappingLinkID = mappingNode_MappingLink.getAttributeValue("id");
            
            var oMappingLinkIds = hm_mappingObject2mappingLinkIDs.get(mappingNode_ParentMappingObject);
            if (oMappingLinkIds == null) {
                oMappingLinkIds = new java.util.HashSet();
                hm_mappingObject2mappingLinkIDs.put(mappingNode_ParentMappingObject, oMappingLinkIds);
            }
            oMappingLinkIds.add(sMappingLinkID);
            
            
            hm_mappingLink2mappingObject.put(mappingNode_MappingLink, mappingNode_ParentMappingObject);
            
            var sChildMappingObjectID = mappingNode_MappingLink.getAttributeValue("mapping_object_ref");
            var mappingNode_ChildMappingObject = hm_mappingObjectID2mappingObject.get(sChildMappingObjectID);         
            
            var outgoingLinksMap = hm_mappingObject2OutgoingMappingLinks.get(mappingNode_ParentMappingObject);
            if (outgoingLinksMap == null) {
                outgoingLinksMap = new java.util.LinkedHashMap();
                hm_mappingObject2OutgoingMappingLinks.put(mappingNode_ParentMappingObject, outgoingLinksMap);
            }
            outgoingLinksMap.put(mappingNode_MappingLink, mappingNode_ChildMappingObject);
             
            var incomingLinksMap = hm_mappingObject2IncomingMappingLinks.get(mappingNode_ChildMappingObject);
            if (incomingLinksMap == null) {
                incomingLinksMap = new java.util.LinkedHashMap();
                hm_mappingObject2IncomingMappingLinks.put(mappingNode_ChildMappingObject, incomingLinksMap);
            }
            incomingLinksMap.put(mappingNode_MappingLink, mappingNode_ParentMappingObject);
            
            if (hm_mappingObjectID2hierarchicalLink.get(sParentMappingObjectID) == null
                && mappingNode_MappingLink.getAttributeValue("is_hierarchical")) {
                hm_mappingObjectID2hierarchicalLink.put(sParentMappingObjectID, mappingNode_MappingLink);
            }
            
            if (mappingNode_MappingLink.getAttributeValue("cycle_link") != null) {
                set_cycleLinkMappingObjects.add(mappingNode_ParentMappingObject);
            }
        }
    }
	
	//model mapping access
    var xmlConfig_MappingModels = xmlConfig_Root.getChildren("mappingModel");
	var iterModel = xmlConfig_MappingModels.iterator();
    while (iterModel.hasNext()) {
        var xmlConfig_MappingModel = iterModel.next();
        var mappingNode_MappingModel = createMappingNodeFromStandardMappingXMLNode(xmlConfig_MappingModel, null);
		
        set_mappingModels.add(mappingNode_MappingModel);
        var modelTypeIDs = mappingNode_MappingModel.getAttributeValue("model_typenums");
		var modelTypeIDsParts = modelTypeIDs.split(",");
        
        for (var i = 0; i < modelTypeIDsParts.length; i++) {
            var sModelTypeNumString = modelTypeIDsParts[i] + ""; //because otherwise the Strings are not considered equal...
            var modelTypeNum = getModelTypeNum(sModelTypeNumString);
            if (modelTypeNum == null) {continue;}
        
            var oMappingModelsSet = hm_modelType2mappingModels.get(modelTypeNum);
            if (oMappingModelsSet == null) {
                oMappingModelsSet = new java.util.HashSet();
                hm_modelType2mappingModels.put(modelTypeNum, oMappingModelsSet);
            }
            oMappingModelsSet.add(mappingNode_MappingModel);
        }
        
        var mappingObjectIDs = mappingNode_MappingModel.getAttributeValue("mapping_object_refs");
		var mappingObjectIDsParts = mappingObjectIDs.split(",");
        
        for (var j = 0; j < mappingObjectIDsParts.length; j++) {
            var sMappingObjectID = mappingObjectIDsParts[j] + ""; //because otherwise the Strings are not considered equal...
            var mappingNode_MappingObject = hm_mappingObjectID2mappingObject.get(sMappingObjectID);
            
            var oMappingObjectsSet = hm_mappingModel2mappingObjects.get(mappingNode_MappingModel);
            if (oMappingObjectsSet == null) {
                oMappingObjectsSet = new java.util.HashSet();
                hm_mappingModel2mappingObjects.put(mappingNode_MappingModel, oMappingObjectsSet);
            }
            oMappingObjectsSet.add(mappingNode_MappingObject);
            
            var oMappingModelsSet = hm_mappingObject2mappingModels.get(mappingNode_MappingObject);
            if (oMappingModelsSet == null) {
                oMappingModelsSet = new java.util.HashSet();
                hm_mappingObject2mappingModels.put(mappingNode_MappingObject, oMappingModelsSet);
            }
            oMappingModelsSet.add(mappingNode_MappingModel);
        }
    }
	
	//enum mappings access
	var xmlConfig_MappingEnumElements = xmlConfig_Root.getChildren("mappingEnum");
	var iterEnum = xmlConfig_MappingEnumElements.iterator();
    while (iterEnum.hasNext()) {
        var xmlConfig_MappingEnumElement = iterEnum.next();  
        var mappingNode_MappingEnum = createMappingNodeFromStandardMappingXMLNode(xmlConfig_MappingEnumElement, null);

		var enumIDAttrValue = mappingNode_MappingEnum.getAttributeValue("aris_enum");
        if (enumIDAttrValue == null) {
            enumIDAttrValue = mappingNode_MappingEnum.getAttributeValue("arcm_enum");
        }
        hm_enumID2mappingEnum.put(enumIDAttrValue, mappingNode_MappingEnum);
        
        var oEnumItemIDsList = new java.util.ArrayList();
        hm_enumID2enumItemIDs.put(enumIDAttrValue, oEnumItemIDsList);
        var oEnumItemsList = mappingNode_MappingEnum.getChildren("enumItem");
        var iter = oEnumItemsList.iterator();
        while (iter.hasNext()) {
            var sEnumItemID = iter.next().getAttributeValue("id");
            oEnumItemIDsList.add(sEnumItemID);
        }
	}
    
    g_bStandardMappingsInitialized = true;
}

/*--------------------------------------------------------------------------------------------------------------------------
    Convenience method for creating a MappingNode based on a JDOM node element.
 -------------------------------------------------------------------------------------------------------------------------*/
function createMappingNodeFromStandardMappingXMLNode(oSourceXMLNode, p_oParentTargetMappingNode) {
    
    var oTargetMappingNode = new MappingNode();
    
    oTargetMappingNode.setParentMappingNode(p_oParentTargetMappingNode);
    oTargetMappingNode.setOriginNodeName(oSourceXMLNode.getName());
    
    //fill node with own attributes
    var attributeIterator = oSourceXMLNode.getAttributes().iterator();
    while (attributeIterator.hasNext()) {
        var oAttribute = attributeIterator.next();
        oTargetMappingNode.setAttributeValue(oAttribute.getName(), oAttribute.getValue());
    }
    
    //create and link children - recursive
    var childIterator = oSourceXMLNode.getChildren().iterator();
    while (childIterator.hasNext()) {
        var oChildSourceXMLNode = childIterator.next();
        var oTargetMappingChildNode = createMappingNodeFromStandardMappingXMLNode(oChildSourceXMLNode, oTargetMappingNode);
		oTargetMappingNode.addChild(oChildSourceXMLNode.getName(), oTargetMappingChildNode);
    }
    
    return oTargetMappingNode;
}


//---------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------- MAPPING CONTENT ACCESS --------------------------------------------------
//---------------------------------------------------- MAPPING OBJECTS ------------------------------------------------------

/*--------------------------------------------------------------------------------------------------------------------------
    Returns all <mappingObject> MappingNodes in the defined mapping.
 -------------------------------------------------------------------------------------------------------------------------*/
function getAllMappingObjects() {
	return hm_mappingObjectID2mappingObject.values();
}

/*--------------------------------------------------------------------------------------------------------------------------
    Returns the <mappingObject> MappingNode whose attribute "id" matches the given ID, otherwise null.
 -------------------------------------------------------------------------------------------------------------------------*/
function getMappingObjectByID(p_sMappingObjectID) {
	return hm_mappingObjectID2mappingObject.get(p_sMappingObjectID);
}

/*--------------------------------------------------------------------------------------------------------------------------
    Returns the <mappingObject> MappingNode where the attribute value of "aris_typenum" matches the ObjDef type num and 
    the attribute value of "aris_symbolnum" matches the ObjDef default symbol type num, otherwise null.
 -------------------------------------------------------------------------------------------------------------------------*/
function getMappingObjectsByObjDef(p_oObjDef) {
	var sKey = p_oObjDef.TypeNum() + "|" + p_oObjDef.getDefaultSymbolNum();
	var oResult = hm_objectAndSymbolType2mappingObjects.get(sKey);
    if (oResult == null) {
        sKey = p_oObjDef.TypeNum() + "";
        oResult = hm_objectAndSymbolType2mappingObjects.get(sKey);
    }
    if (oResult == null) {
        oResult = new java.util.HashSet();
    }
    return oResult; //HashSet of <mappingObject> MappingNodes
}

/*--------------------------------------------------------------------------------------------------------------------------
    Returns the <mappingObject> MappingNode where the given <mappingLink> MappingNode is defined on.
 -------------------------------------------------------------------------------------------------------------------------*/
function getMappingObjectOfMappingLink(p_oMappingLink) {
    return hm_mappingLink2mappingObject.get(p_oMappingLink);
}

/*--------------------------------------------------------------------------------------------------------------------------
    Returns a HashSet of those <mappingObject> MappingNodes which are referenced by the given <mappingModel> MappingNode.
 -------------------------------------------------------------------------------------------------------------------------*/
function getMappingObjectsForModelMapping(p_oMappingModel) {
    var oResult = hm_mappingModel2mappingObjects.get(p_oMappingModel);
    if (oResult == null) {
        oResult = new java.util.HashSet();
    }
    return oResult;
}


//---------------------------------------------------- MAPPING MODELS ------------------------------------------------------

/*--------------------------------------------------------------------------------------------------------------------------
    Returns all <mappingModel> MappingNodes in the defined mapping as Collection.
 -------------------------------------------------------------------------------------------------------------------------*/
function getAllMappingModels() {
	return hm_mappingModel2mappingObjects.keySet();
}

/*--------------------------------------------------------------------------------------------------------------------------
    Returns a HashSet of those <mappingModel> MappingNodes whose attribute value of "model_typenums" contains the 
    model type num of the given Model.
 -------------------------------------------------------------------------------------------------------------------------*/
function getMappingModelsByModel(p_oModel) {
    var modelTypeNum = p_oModel.TypeNum();
    var oResult = hm_modelType2mappingModels.get(modelTypeNum);
    if (oResult == null) {
        oResult = new java.util.HashSet();
    }
    return oResult; //HashSet of <mappingModel> MappingNodes
}

/*--------------------------------------------------------------------------------------------------------------------------
    Returns a HashSet of those <mappingModel> MappingNodes whose attribute value of "mapping_object_refs" contains the 
    attribute value "id" of the given <mappingModel> MappingNode.
 -------------------------------------------------------------------------------------------------------------------------*/
function getMappingModelsByMappingObject(p_oMappingObject) {
    var oResult = hm_mappingObject2mappingModels.get(p_oMappingObject);
    if (oResult == null) {
        oResult = new java.util.HashSet();
    }
    return oResult; //HashSet of <mappingModel> MappingNodes
}


//-------------------------------------------------- MAPPING CONDITIONS ----------------------------------------------------

/*--------------------------------------------------------------------------------------------------------------------------
    Returns a HashSet of those <exportRelevanceCondition> MappingNodes which are defined at the given 
    <mappingObject> MappingNode.
 -------------------------------------------------------------------------------------------------------------------------*/
function getExportRelevanceConditionsForMappingObject(p_oMappingObject) {
    var oExportRelevanceConditionsList = p_oMappingObject.getChildren("exportRelevanceCondition");
    if (oExportRelevanceConditionsList == null) {oExportRelevanceConditionsList = new java.util.ArrayList();}
    return oExportRelevanceConditionsList;
}

/*--------------------------------------------------------------------------------------------------------------------------
    Returns a HashSet of those <mappingCondition> MappingNodes which are defined at the given 
    <mappingObject> MappingNode.
 -------------------------------------------------------------------------------------------------------------------------*/
function getMappingConditionsForMappingObject(p_oMappingObject) {
    var oMappingConditionsList = p_oMappingObject.getChildren("mappingCondition");
    if (oMappingConditionsList == null) {oMappingConditionsList = new java.util.ArrayList();}
    return oMappingConditionsList;
}

/*--------------------------------------------------------------------------------------------------------------------------
    Returns a HashSet of those <mappingCondition> MappingNodes which are defined at the given <mappingModel> MappingNode.
 -------------------------------------------------------------------------------------------------------------------------*/
function getExportRelevanceConditionsForMappingModel(p_oMappingModel) {
    var oMappingConditionsList = p_oMappingModel.getChildren("exportRelevanceCondition");
    if (oMappingConditionsList == null) {oMappingConditionsList = new java.util.ArrayList();}
    return oMappingConditionsList;
}


//-------------------------------------------------- MAPPING VALIDATES -----------------------------------------------------

/*--------------------------------------------------------------------------------------------------------------------------
    Returns a HashSet of those <validate> MappingNodes which are defined at the given <mappingObject> MappingNode.
 -------------------------------------------------------------------------------------------------------------------------*/
function getValidationsForMappingObject(p_oMappingObject) {
    var oExportRelevanceConditionsList = p_oMappingObject.getChildren("validate");
    if (oExportRelevanceConditionsList == null) {oExportRelevanceConditionsList = new java.util.ArrayList();}
    return oExportRelevanceConditionsList;
}

/*--------------------------------------------------------------------------------------------------------------------------
    Returns a HashSet of those <condition> MappingNodes which are defined at the given <validate> MappingNode.
 -------------------------------------------------------------------------------------------------------------------------*/
function getConditionsForValidate(p_oValidate) {
    var oConditionsList = p_oValidate.getChildren("condition");
    if (oConditionsList == null) {oConditionsList = new java.util.ArrayList();}
    return oConditionsList;
}


//---------------------------------------------------- MAPPING ATTRS -------------------------------------------------------

/*--------------------------------------------------------------------------------------------------------------------------
    Look up the <mappingAttr>s of the given p_oMappingObject and return their values for their attribute "id".
 -------------------------------------------------------------------------------------------------------------------------*/
function getMappingAttrIDsOfMappingObject(p_oMappingObject) {
	var oResult = hm_mappingObject2mappingAttrIDs.get(p_oMappingObject);
    if (oResult == null) {
        oResult = new java.util.HashSet();
    }
    return oResult; //HashSet of String representing <mappingAttr> attribute values of "id"
}


//---------------------------------------------------- MAPPING LINKS -------------------------------------------------------

/*--------------------------------------------------------------------------------------------------------------------------
    Look up the <mappingLink>s of the given p_oMappingObject and return their values for their attribute "id".
 -------------------------------------------------------------------------------------------------------------------------*/
function getMappingLinkIDsOfMappingObject(p_oMappingObject) {
	var oResult = hm_mappingObject2mappingLinkIDs.get(p_oMappingObject);
    if (oResult == null) {
        oResult = new java.util.HashSet();
    }
    return oResult; //HashSet of String representing <mappingLink> attribute values of "id"
}

/*--------------------------------------------------------------------------------------------------------------------------
    Returns the <mappingLink> MappingNode which is defined at the given <mappingObject> MappingNode and whose attribute
    value "id" matches the given ID, otherwise null.
 -------------------------------------------------------------------------------------------------------------------------*/
function getMappingLink(p_oMappingObject, p_sMappingLinkID) {
    
    //<mappingObject> MappingNode --> Map with format: <mappingLink> MappingNode --> <mappingObject> MappingNode
    var aOutgoingLinksMap = getOutgoingLinks(p_oMappingObject);
    var linkIter = aOutgoingLinksMap.keySet().iterator();
    while (linkIter.hasNext()) {
        var oMappingLink = linkIter.next();
        if (oMappingLink.getAttributeValue("id") + "" == p_sMappingLinkID) {
            return oMappingLink;
        }
    }
    return null;
}

/*--------------------------------------------------------------------------------------------------------------------------
    Returns a HashSet of those <mappingLink> MappingNodes which are defined at the given <mappingModel> MappingNode.
 -------------------------------------------------------------------------------------------------------------------------*/
function getOutgoingLinks(p_oMappingObject) {
    var oLinksMap = hm_mappingObject2OutgoingMappingLinks.get(p_oMappingObject);
    if (oLinksMap == null) {oLinksMap = new java.util.HashMap()}
    return oLinksMap;
}

/*--------------------------------------------------------------------------------------------------------------------------
    Returns a HashSet of those <mappingLink> MappingNodes whose attribute value "mapping_object_ref" is referencing the 
    given <mappingModel> MappingNode.
 -------------------------------------------------------------------------------------------------------------------------*/
function getIncomingLinks(p_oMappingObject) {
    var oLinksMap = hm_mappingObject2IncomingMappingLinks.get(p_oMappingObject);
    if (oLinksMap == null) {oLinksMap = new java.util.HashMap();}
    return oLinksMap;
}

/*--------------------------------------------------------------------------------------------------------------------------
    Looks up the <mappingObject> MappingNode whose attribute "id" matches the given ID. Then returns the 
    <mappingLink> MappingNode which is defined this <mappingObject> MappingNode and whose attribute value 
    "is_hierarchical" is "true".
    Returns null if either no such <mappingObject> MappingNode or <mappingLink> MappingNode exists.
 -------------------------------------------------------------------------------------------------------------------------*/
function getHierarchicalMappinkLink(p_sMappingObjectID) {
    return hm_mappingObjectID2hierarchicalLink.get(p_sMappingObjectID);
}   

/*--------------------------------------------------------------------------------------------------------------------------
    Returns true if at the given <mappingObject> MappingNode there is a <mappingLink> MappingNode defined whose 
    attribute value "cycle_link" is "true", otherwise false is returned.
 -------------------------------------------------------------------------------------------------------------------------*/
function hasMappingObjectCycleLinks(p_oMappingObject) {
    return set_cycleLinkMappingObjects.contains(p_oMappingObject);
}


//--------------------------------------------------- MAPPING ENUMS --------------------------------------------------------

/*--------------------------------------------------------------------------------------------------------------------------
    Returns all <mappingEnum> MappingNodes in the defined mapping as Collection.
 -------------------------------------------------------------------------------------------------------------------------*/
function getAllMappingEnums() {
	return hm_enumID2mappingEnum.values();
}

/*--------------------------------------------------------------------------------------------------------------------------
    Returns the IDs for all <mappingEnum> MappingNodes in the defined mapping as Collection.
    The enum ID is the value of attribute "aris_enum" if set, otherwise the value of "arcm_enum"
 -------------------------------------------------------------------------------------------------------------------------*/
function getAllMappingEnumIDs() {
	return hm_enumID2mappingEnum.keySet();
}

/*--------------------------------------------------------------------------------------------------------------------------
    Returns the <mappingEnum> MappingNode whose attribute value "aris_enum" or "arcm_enum" matches the given ID (checked
    in this order).
    Otherwise returns null.
 -------------------------------------------------------------------------------------------------------------------------*/
function getMappingEnum(p_sEnumID) {
	return hm_enumID2mappingEnum.get(p_sEnumID); //<mappingEnum> MappingNode
}

/*--------------------------------------------------------------------------------------------------------------------------
    Looks up the the <mappingEnum> MappingNode corresponding to the given ID.
    The returns the IDs for all <enumItem> MappingNodes under this <mappingEnum> MappingNode as Collection.
    Returns an empty Collection if there exists no enumeration for the given ID.
 -------------------------------------------------------------------------------------------------------------------------*/
function getAllItemIDsOfMappingEnum(p_sEnumID) {
    var oResult = hm_enumID2enumItemIDs.get(p_sEnumID);
    if (oResult == null) {
        oResult = new java.util.ArrayList();
    }
	return oResult;
}

/*--------------------------------------------------------------------------------------------------------------------------
    Then returns the <enumItem> MappingNode under the given <mappingEnum> MappingNode corresponding to the given enum item ID.
    Returns null if either there is no matching enum or no matching enum item in it.
 -------------------------------------------------------------------------------------------------------------------------*/
function getMappingEnumItemOfMappingEnum(p_oMappingNode_mappingEnum, p_sEnumItemID) {
    if (p_oMappingNode_mappingEnum != null) {
        var itemIter = p_oMappingNode_mappingEnum.getChildren("enumItem").iterator();
        while (itemIter.hasNext()) {
            var oMappingNode_mappingEnumItem = itemIter.next();
            if (oMappingNode_mappingEnumItem.getAttributeValue("id") + "" == p_sEnumItemID) {
                return oMappingNode_mappingEnumItem;
            }
        }
    }
    return null;
}

//------------------------------------------------- MAPPING ATTRIBUTES -----------------------------------------------------

/*--------------------------------------------------------------------------------------------------------------------------
    Returns the <mappingAttr> MappingNode which is defined at the given <mappingObject> MappingNode and whose attribute
    value "id" matches the given ID, otherwise null.
 -------------------------------------------------------------------------------------------------------------------------*/
function getMappingAttr(p_oMappingObject, p_sMappingAttrID) {
    var attrIter = p_oMappingObject.getChildren("mappingAttr").iterator();
    while (attrIter.hasNext()) {
        var oAttr = attrIter.next();
        if (oAttr.getAttributeValue("id") + "" == p_sMappingAttrID) {
            return oAttr;
        }
    }
    return null;
}