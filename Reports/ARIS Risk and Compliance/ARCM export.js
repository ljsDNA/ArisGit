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

var g_nLoc = Context.getSelectedLanguage();

var g_bDebugSkipMeta = false;
var g_bDebugBenchmark = false;
var g_bDebugSort = false;
var g_bDebugSplitQuantities = false;
var g_bDebugSkipCycleLinks = false;
var g_bDebugDoNotResolveGUIDQuery = false;
var g_bDummyHierarchyModels = false;

g_bDebugStringOutput = false;

g_bDebugDummyGUIDs = false;
g_iDebugDummyGUIDCounter = 0;

//ensure bottom up skip before calling startClassification()
g_bSkipBottomUpRecursion = true;

/*
Indicates if the old AT_DEACT flag shall be used to exported objects as deactivated.
Please note that by default object deactivation is not done by this flag anymore but instead 
by executing the report on the ARIS database with option "Delete objects" set to "true".
*/
var g_bReadDeactivateAttribute = false;

// remote execution of report (outside UI by script)
var g_bRemoteCalledProperty = "remoteCalled";
var g_bRemoteCalled = false;

var ARCM = Context.getComponent("ARCM");
var g_arcmEnvironmentID = Context.getProperty("ARCM_TARGET_ENVIRONMENT");
var g_bImportModeEntire = Context.getProperty("ARCM_IMPORT_MODE_ENTIRE");

var g_sErrorMessageProperty = "errorMessage";  //identical to property in report "Main report form ARCM data transfer"

var g_iExportCount = 0;

var g_aMessages = new Array();

main();

function main() {
    
    try {
        var g_oOverallStartDate = new java.util.Date();
        
        //check if the (important for externally passed object GUIDs and error handling)
        var remoteCalledValue = Context.getProperty("remoteCalled");
        if (remoteCalledValue != null && remoteCalledValue.length() > 0 && remoteCalledValue.equalsIgnoreCase( new java.lang.String("true") )) {
            g_bRemoteCalled = true;    
        }
        var bStandAloneExecution = (g_arcmEnvironmentID == null || g_arcmEnvironmentID == "");

        //read mapping file
        var g_oConfigReadStartDate = new java.util.Date();
        initMappingAndStartClassification();
        var g_oConfigReadEndDate = new java.util.Date();
          
        //start XML generation if mappings initialisation and classification succeeded
        if (g_aMappingInitMessages.length == 0 && g_aTopologicalSortingMessages.length == 0 && g_aHierarchyIntersectionMessages.length == 0) {      
            
            var g_oXMLGenerationStartDate = new java.util.Date();
            var xmlOutput = Context.createXMLOutputObject(Context.getSelectedFile(), "import");
            generateXMLExport(xmlOutput);
            var g_oXMLGenerationEndDate = new java.util.Date();
           
            var g_oOverallEndDate = new java.util.Date();
           
            if (g_bDebugBenchmark) {
                var sConfigBenchmark = createExecutionTimeString("Overall execution time", g_oOverallStartDate, g_oOverallEndDate);
                writeXmlElement_ExecutionTime_BenchmarkString(xmlOutput, xmlOutput.getRootElement(), sConfigBenchmark);
                var sConfigBenchmark = createExecutionTimeString("Reading config", g_oConfigReadStartDate, g_oConfigReadEndDate);
                writeXmlElement_ExecutionTime_BenchmarkString(xmlOutput, xmlOutput.getRootElement(), sConfigBenchmark);
                var sClassificationBenchmark = createExecutionTimeString("Classification", g_oClassificationStartDate, g_oClassificationEndDate);
                writeXmlElement_ExecutionTime_BenchmarkString(xmlOutput, xmlOutput.getRootElement(), sClassificationBenchmark);
                var sXMLGenerationBenchmark = createExecutionTimeString("XML generation", g_oXMLGenerationStartDate, g_oXMLGenerationEndDate);
                writeXmlElement_ExecutionTime_BenchmarkString(xmlOutput, xmlOutput.getRootElement(), sXMLGenerationBenchmark);
            }
            
			//write the generated XML
			xmlOutput.WriteReport(); 
        }
        else {
            g_aMessages = g_aMessages.concat(g_aMappingInitMessages);
            g_aMessages = g_aMessages.concat(g_aTopologicalSortingMessages);
            g_aMessages = g_aMessages.concat(g_aHierarchyIntersectionMessages);
        }
    
    } catch(e) {       
        var sErrorMsg = e.toString();
        sErrorMsg += "\nfileName: " + e.fileName;
        sErrorMsg += "\nlineNumber: " + e.lineNumber;
        g_aMessages.push(sErrorMsg);
    }
    
    if (g_aMessages.length > 0) {
        if (g_bRemoteCalled) {
            Context.setProperty(g_sErrorMessageProperty, g_aMessages.join('\n'));
        } else { 
            Dialogs.showDialog(new MessagesDialog(g_aMessages.join('\n')), Constants.DIALOG_TYPE_ACTION, getString("EXPORT_ERRORS_DETECTED") + ":"); //Errors detected during export:
        }
    } 
}

function MessagesDialog(p_aMessages) {
    // structure of the dialog page
    this.getPages = function() {
        var iDialogTemplate = Dialogs.createNewDialogTemplate(1400, 540, "not_used");
        iDialogTemplate.TextBox(10, 10, 1380, 520, "messages", 1);
        return [iDialogTemplate];
    }
    // init of dialog
    this.init = function(aPages) {
        var messagesTextBox = this.dialog.getPage(0).getDialogElement("messages");
        messagesTextBox.setText(p_aMessages.join("\n"));           
    }
}


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ~~~~~~~ Functionality for XML creation from mapping file ~~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
/*---------------------------------------------------------------------------------------
    Determine the origin for this export
---------------------------------------------------------------------------------------*/
function determineOrigin() {
	var oItem = null;
    var oItemName = null;
    var oTypeNum = null;
    if (ArisData.getSelectedDatabases().length != 0) {
        oItem = ArisData.getSelectedDatabases()[0];
        oItemName = oItem.Name(g_nLoc);
        oTypeNum = 0;
    } else if (ArisData.getSelectedGroups().length != 0) {
		oItem = ArisData.getSelectedGroups()[0];
		oItemName = getPath(oItem);
        oTypeNum = 1;
    } else if (ArisData.getSelectedModels().length != 0) {
		oItem = ArisData.getSelectedModels()[0];
		oItemName = getPath(oItem.Group()) + " > " + oItem.Name(g_nLoc);
        oTypeNum = 2;
    } else {
		oItem = ArisData.getSelectedObjDefs()[0];
		oItemName = getPath(oItem.Group()) + " > " + oItem.Name(g_nLoc);
        oTypeNum = 3;
    }
    var oOriginDatabase = oItem.Database().Name(g_nLoc);
	var oItemGuid = oItem.GUID();
	var oItemType = ArisData.ActiveFilter().ItemKindName(oItem.KindNum());

	const origin = {
		db: oOriginDatabase,
		name: oItemName,
		guid: oItemGuid,
		type: oItemType,
        typeNum: oTypeNum
	}

    return origin;
}

function getPath(oGroup){
    return oGroup.Path(g_nLoc).replaceAll("\\\\", " > ");
}

/*---------------------------------------------------------------------------------------
    Main XML export function
---------------------------------------------------------------------------------------*/
function generateXMLExport(xmlOutput) {

    //--- determine origin
    var sOrigin = determineOrigin();
    
    //--- determine scope
    var sScope = "PARTIAL";
    if (g_bImportModeEntire == "true") {
        sScope = "ENTIRE";
    }
    
	//--- XML format
    var xmlConfig_Root = g_xmlConfigReader.getRootElement();
    var xmlOutput_Root = xmlOutput.getRootElement();
    
    //write the overall meta data for logging on ARCM side
    generateOverallMetaData(xmlOutput, xmlOutput_Root, xmlConfig_Root, sOrigin, sScope);
    
    // --- <mappingObject> -> <Objects>, <Object> ---
    //iterate over all defined <mappingObject>s for creating XML content
    var iterObj = getAllMappingObjects().iterator(); 
    while (iterObj.hasNext()) {
		var xmlConfig_ObjectTypeMapping = iterObj.next();
        generateXMLExport_MappingObject(xmlOutput, xmlOutput_Root, xmlConfig_ObjectTypeMapping);
    }
    
    //set quantity after creating the XML content
    //xmlOutput_Root.setAttribute("quantity", g_iExportCount);
    xmlOutput_Root.setAttribute("quantity", xmlOutput_Root.getChildren("object").size());
    
    //split quantities for debug comparison
    if (g_bDebugSplitQuantities) {
        var hm_quantities = new java.util.LinkedHashMap();
        var iterExpObj = xmlOutput_Root.getChildren("object").iterator();
        while (iterExpObj.hasNext()) {
            var exportedObject = iterExpObj.next();
            var sType = exportedObject.getAttribute("type").getValue();
            var iCounter = hm_quantities.get(sType);
            if (iCounter == null) {
                iCounter = 1;
            } else {
                iCounter++;
            }
            hm_quantities.put(sType, iCounter);
        }
        
        if (!xmlOutput_Root.getChildren().isEmpty()) {
            var oFirstChild = xmlOutput_Root.getChildren().get(0);
            var iterQuantitites = hm_quantities.keySet().iterator();
            while (iterQuantitites.hasNext()) {
                var sType = iterQuantitites.next();
                var xmlOutput_Quantity = xmlOutput.addElement(xmlOutput_Root, "debug_quantity_" + sType);
                xmlOutput_Quantity.setText(hm_quantities.get(sType));
            }
        }
 
    }
}


/*---------------------------------------------------------------------------------------
    Main XML export function for all objects described by one specific <mappingObject>
---------------------------------------------------------------------------------------*/
function generateXMLExport_MappingObject(xmlOutput, xmlOutput_Root, xmlConfig_ObjectTypeMapping) {
    
    //read mapping object attributes
	var arcmType = xmlConfig_ObjectTypeMapping.getAttributeValue("arcm_objtype");
	if (arcmType == null) {return;}
	
	//if objTypeNum is defined: get the export info objects for the classified objects for the given type
	var sMappingObjectID = xmlConfig_ObjectTypeMapping.getAttributeValue("id");
    var oExportInfosSet = getExportInfosByMappingObjectID(sMappingObjectID);
    var aExportInfos = convertHashSetToJSArray(oExportInfosSet);
    
    if (g_bDebugSort) {
        aExportInfos.sort(sortExportInfoByArcmGUID);
    }
    
    var exportInfoIterator;
    
    //if there are cycle links defined at the mapping then export all exportInfos a first time without any attrRefs for the cycle links
    if (hasMappingObjectCycleLinks(xmlConfig_ObjectTypeMapping) && !g_bDebugSkipCycleLinks) {
        for (e=0; e<aExportInfos.length; e++) {
            var exportInfo = aExportInfos[e];
            var xmlOutput_ObjectNode = writeXmlElement_Object(xmlOutput, xmlOutput_Root, exportInfo, xmlConfig_ObjectTypeMapping);
            writeXmlElement_ObjectMetaData(xmlOutput, xmlOutput_ObjectNode, exportInfo);
            writeXmlElement_ObjectAttributes(xmlOutput, xmlOutput_ObjectNode, exportInfo, xmlConfig_ObjectTypeMapping);
            writeXmlElement_ArisChangeDateAttribute(xmlOutput, xmlOutput_ObjectNode, exportInfo); 
            writeXmlElement_Links(xmlOutput, xmlOutput_ObjectNode, exportInfo, xmlConfig_ObjectTypeMapping, true);
	    //add cycle breaker flag
            xmlOutput_ObjectNode.setAttribute("cyclebreak", "true");
            //add cycle breaker comment
            var infoComment = new org.jdom2.Comment("cycle breaker");       
            var objectNodeContentList = xmlOutput_ObjectNode.getContent();
            objectNodeContentList.add(0, infoComment);
        }
    }
    
    //export the exportInfos completely including attrRefs
    for (e=0; e<aExportInfos.length; e++) {
        var exportInfo = aExportInfos[e];
        if (g_bDebugStringOutput) {writeXmlElement_Object_DebugString(xmlOutput, xmlOutput_Root, exportInfo);}
        var xmlOutput_ObjectNode = writeXmlElement_Object(xmlOutput, xmlOutput_Root, exportInfo, xmlConfig_ObjectTypeMapping);
        writeXmlElement_ObjectMetaData(xmlOutput, xmlOutput_ObjectNode, exportInfo);
        writeXmlElement_ObjectAttributes(xmlOutput, xmlOutput_ObjectNode, exportInfo, xmlConfig_ObjectTypeMapping);
        writeXmlElement_ArisChangeDateAttribute(xmlOutput, xmlOutput_ObjectNode, exportInfo);
        writeXmlElement_Links(xmlOutput, xmlOutput_ObjectNode, exportInfo, xmlConfig_ObjectTypeMapping, false);
        g_iExportCount++;
    }
}


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ~~~~~~~ Functionality for export XML - meta data creation ~~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
/*---------------------------------------------------------------------------------------
    XML export main function for overall meta data
---------------------------------------------------------------------------------------*/
function generateOverallMetaData(xmlOutput, xmlOutput_RootNode, xmlConfig_Root, sOrigin, sScope) {
    
    //skip in debugging mode
    if (g_bDebugSkipMeta) {return;}
    
    //caches
    var hm_metaCache_objTypeID2outputNode = new Packages.java.util.HashMap(); //format: <ARCM ObjType ID>|Node
    var hm_metaCache_objTypeID2attributeIDs = new Packages.java.util.HashMap(); //format: <ARCM ObjType ID>|Set of <String> (the ARCM attribute IDs)
    
    //<meta>
    var xmlOutput_Meta = xmlOutput.addElement(xmlOutput_RootNode, "meta");
    //<inf origin db>
        var xmlOutput_Meta_Inf = xmlOutput.addElement(xmlOutput_Meta, "inf");
        xmlOutput_Meta_Inf.setAttribute("id", "origin");
        xmlOutput_Meta_Inf.setText(sOrigin.db);

    	//<inf name>
        var xmlOutput_Meta_Inf = xmlOutput.addElement(xmlOutput_Meta, "inf");
        xmlOutput_Meta_Inf.setAttribute("id", "startItemName");
        xmlOutput_Meta_Inf.setText(sOrigin.name);

    	//<inf guid>
        var xmlOutput_Meta_Inf = xmlOutput.addElement(xmlOutput_Meta, "inf");
        xmlOutput_Meta_Inf.setAttribute("id", "startItemGuid");
        xmlOutput_Meta_Inf.setText(sOrigin.guid);

    	//<inf type>
        var xmlOutput_Meta_Inf = xmlOutput.addElement(xmlOutput_Meta, "inf");
        xmlOutput_Meta_Inf.setAttribute("id", "startItemType");
        xmlOutput_Meta_Inf.setText(sOrigin.type);

        //<inf typeNum>
        var xmlOutput_Meta_Inf = xmlOutput.addElement(xmlOutput_Meta, "inf");
        xmlOutput_Meta_Inf.setAttribute("id", "startItemTypeNum");
        xmlOutput_Meta_Inf.setText(sOrigin.typeNum);

        //<inf scope>
    xmlOutput_Meta_Inf = xmlOutput.addElement(xmlOutput_Meta, "inf");
    xmlOutput_Meta_Inf.setAttribute("id", "scope");
    xmlOutput_Meta_Inf.setText(sScope);
    
    //<mapping>
    var xmlOutput_Meta_Mapping = xmlOutput.addElement(xmlOutput_Meta, "mapping");
    
    var iterObj = getAllMappingObjects().iterator();
    while (iterObj.hasNext()) {
        var xmlConfig_MappingObject = iterObj.next();
        var sArcmObjType = xmlConfig_MappingObject.getAttributeValue("arcm_objtype");
        
        //meta data cache
        var oAlreadyCreatedAttributesSet = hm_metaCache_objTypeID2attributeIDs.get(sArcmObjType);
        if (oAlreadyCreatedAttributesSet == null) {
            oAlreadyCreatedAttributesSet = new java.util.HashSet();
            hm_metaCache_objTypeID2attributeIDs.put(sArcmObjType, oAlreadyCreatedAttributesSet);
        }
        //<object> - either new or from cache
        var xmlOutput_Meta_Mapping_Object = hm_metaCache_objTypeID2outputNode.get(sArcmObjType);
        if (xmlOutput_Meta_Mapping_Object == null) {
            xmlOutput_Meta_Mapping_Object = xmlOutput.addElement(xmlOutput_Meta_Mapping, "object");
            xmlOutput_Meta_Mapping_Object.setAttribute("id", sArcmObjType);
            hm_metaCache_objTypeID2outputNode.put(sArcmObjType, xmlOutput_Meta_Mapping_Object);
        }
        
        
        //<mappingAttr> in mapping object -> <attr> in meta 
        var iterAttr = xmlConfig_MappingObject.getChildren("mappingAttr").iterator();
        while (iterAttr.hasNext()) {
            var xmlConfig_MappingAttr = iterAttr.next();
            var sID = xmlConfig_MappingAttr.getAttributeValue("id");            
            //only process those attributes for which there were no meta data created already 
            if (!oAlreadyCreatedAttributesSet.add(sID)) {
                continue;
            }
            var sArisTypeNum = xmlConfig_MappingAttr.getAttributeValue("aris_typenum");
            var sLocalizedAttrName = "";
            //handle multi enum attributes by resolving their enum mapping attributes
            if (sArisTypeNum == "ISMULTIPLE") {
                var sEnumType = xmlConfig_MappingAttr.getAttributeValue("type");
                var xmlConfig_MappingEnumElement = getXmlConfigMappingEnumElement(sEnumType);
                if (xmlConfig_MappingEnumElement != null) {
                    var xmlConfig_EnumItems = xmlConfig_MappingEnumElement.getChildren("enumItem");
                    var iterItems = xmlConfig_EnumItems.iterator();
                    while (iterItems.hasNext()) {
                        var xmlConfig_EnumItem = iterItems.next();
                        var sLocalizedEnumPartAttrTypeNum = getAttributeTypeNum(xmlConfig_EnumItem.getAttributeValue("aris_typenum"));
                        if (sLocalizedAttrName != "") {sLocalizedAttrName += " / ";}
                        sLocalizedAttrName += localizeMetaData(sLocalizedEnumPartAttrTypeNum, "ATTRIBUTE");
                    }
                }    
            }
            //handle all other value attributes
            else {
                sLocalizedAttrName = localizeMetaData(sArisTypeNum, "ATTRIBUTE");
            }
            
            //only create <attr> and <inf>  if attribute type could be resolved and localized
            if (sLocalizedAttrName != sArisTypeNum) {
                //<attr>
                var xmlOutput_Meta_Mapping_Object_Attr = xmlOutput.addElement(xmlOutput_Meta_Mapping_Object, "attr");
                xmlOutput_Meta_Mapping_Object_Attr.setAttribute("id", sID);
                //<inf>
                var xmlOutput_Meta_Mapping_Object_Attr_Inf = xmlOutput.addElement(xmlOutput_Meta_Mapping_Object_Attr, "inf");
                xmlOutput_Meta_Mapping_Object_Attr_Inf.setAttribute("id", "aris_typenum");
                xmlOutput_Meta_Mapping_Object_Attr_Inf.setText(sLocalizedAttrName);
            }
        }
        
        
        //<mappingLink> in mapping object -> <attr> in meta 
        var iterLink = xmlConfig_MappingObject.getChildren("mappingLink").iterator();
        while (iterLink.hasNext()) {
            var xmlConfig_MappingLink = iterLink.next();
            var sId = "";
            var sDirection = "";
            var sTargetObjType = "";
            var sTargetSymbolNum = "";
            
            sID = xmlConfig_MappingLink.getAttributeValue("id");
            //only process those attributes for which there were no meta data created already 
            if (!oAlreadyCreatedAttributesSet.add(sID)) {
                continue;
            }
            if (xmlConfig_MappingLink.getAttributeValue("direction") != null) {sDirection = xmlConfig_MappingLink.getAttributeValue("direction");}
            
            var sMappingObjectRefID = xmlConfig_MappingLink.getAttributeValue("mapping_object_ref");
            var oMappingObjectRef = getMappingObjectByID(sMappingObjectRefID);
            if (oMappingObjectRef.getAttributeValue("aris_typenum") != null) {
                sTargetObjType = oMappingObjectRef.getAttributeValue("aris_typenum");
            }
            if (oMappingObjectRef.getAttributeValue("aris_symbolnum") != null) {
                sTargetSymbolNum = oMappingObjectRef.getAttributeValue("aris_symbolnum");
            }
            
            var sArisTypeNum = "";
            var sLocalizedCxnName = "";
            if (xmlConfig_MappingLink.getAttributeValue("aris_typenum") != null) {
                sArisTypeNum = xmlConfig_MappingLink.getAttributeValue("aris_typenum");
                sLocalizedCxnName = localizeMetaData(sArisTypeNum, "CONNECTION");
            }
            var sLocalizedTargetObjType = localizeMetaData(sTargetObjType, "OBJDEF");
            var sLocalizedTargetSymbolNum = localizeMetaData(sTargetSymbolNum, "SYMBOL");
            //skip if there would be nothing to add to output
            if ((sLocalizedCxnName == sArisTypeNum) && (sDirection == "") && (sTargetObjType == "" || sLocalizedTargetObjType == sTargetObjType)) {
                continue;
            }
            
            //<attr>
            var xmlOutput_Meta_Mapping_Object_Attr = xmlOutput.addElement(xmlOutput_Meta_Mapping_Object, "attr");
            xmlOutput_Meta_Mapping_Object_Attr.setAttribute("id", sID);
            //<inf> 
            if (sLocalizedCxnName != sArisTypeNum) {
                var xmlOutput_Meta_Mapping_Object_Attr_Inf = xmlOutput.addElement(xmlOutput_Meta_Mapping_Object_Attr, "inf");
                xmlOutput_Meta_Mapping_Object_Attr_Inf.setAttribute("id", "aris_typenum");
                xmlOutput_Meta_Mapping_Object_Attr_Inf.setText(sLocalizedCxnName);
            }
            //<inf>
            if (sDirection != "") {
                xmlOutput_Meta_Mapping_Object_Attr_Inf = xmlOutput.addElement(xmlOutput_Meta_Mapping_Object_Attr, "inf");
                xmlOutput_Meta_Mapping_Object_Attr_Inf.setAttribute("id", "direction");
                xmlOutput_Meta_Mapping_Object_Attr_Inf.setText(sDirection);
            }
            
            //<inf> - only if ObjDef type can be resolved and localized      
            if (sTargetObjType != "" && sLocalizedTargetObjType != sTargetObjType) {
                xmlOutput_Meta_Mapping_Object_Attr_Inf = xmlOutput.addElement(xmlOutput_Meta_Mapping_Object_Attr, "inf");
                xmlOutput_Meta_Mapping_Object_Attr_Inf.setAttribute("id", "aris_target_objtype");
                xmlOutput_Meta_Mapping_Object_Attr_Inf.setText(sLocalizedTargetObjType);
            }
            
            //<inf> - only if symbol type can be resolved and localized    
            if (sTargetSymbolNum != "" && sLocalizedTargetSymbolNum != sTargetSymbolNum) {
                xmlOutput_Meta_Mapping_Object_Attr_Inf = xmlOutput.addElement(xmlOutput_Meta_Mapping_Object_Attr, "inf");
                xmlOutput_Meta_Mapping_Object_Attr_Inf.setAttribute("id", "aris_target_symbolnum");
                xmlOutput_Meta_Mapping_Object_Attr_Inf.setText(sLocalizedTargetSymbolNum);
            }
        }
    }
}

/*---------------------------------------------------------------------------------------
    XML export main function for overall meta data - localization
---------------------------------------------------------------------------------------*/
function localizeMetaData(sInput, sMode) {
    var sResult = sInput;
    //attribute name by attrTypeNum
    if (sMode == "ATTRIBUTE") {
        var iTypeNum = obtainTypeNumFromFilter(sInput, "UserDefinedAttributeTypeNum");
        if (iTypeNum != -1) {
            sResult = ArisData.ActiveFilter().getItemTypeName(Constants.CID_ATTRDEF, iTypeNum);
        }
    }
    //attribute name by cxnTypeNum
    if (sMode == "CONNECTION") {
        var iTypeNum = obtainTypeNumFromFilter(sInput, null);
        if (iTypeNum != -1) {
            sResult = ArisData.ActiveFilter().getItemTypeName(Constants.CID_CXNDEF, iTypeNum);
        }
    }
    //target ObjDef type
    if (sMode == "OBJDEF") {
        var iTypeNum = obtainTypeNumFromFilter(sInput, null);
        if (iTypeNum != -1) {
            sResult = ArisData.ActiveFilter().getItemTypeName(Constants.CID_OBJDEF, iTypeNum);
        }
    }
    //target Symbol type
    if (sMode == "SYMBOL") {
        var iTypeNum = obtainTypeNumFromFilter(sInput, "UserDefinedSymbolTypeNum");
        if (iTypeNum != -1) {
            sResult = ArisData.ActiveFilter().SymbolName(iTypeNum);
        }
    }
    
    return sResult;
}


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
         ~~~~~~~ Basic XML output functions common for each exported object ~~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/*---------------------------------------------------------------------------------------
    Basic debug String info output method. Writes <debugInfo> tag referring to the
    following <object> tag
---------------------------------------------------------------------------------------*/ 
function  writeXmlElement_Object_DebugString(xmlOutput, xmlOutput_Root, oExportInfo) {
    if (g_bDebugStringOutput) {
        var xmlOutput_ObjectDebugInfoNode = xmlOutput.addElement(xmlOutput_Root, "objectDebugInfo");
        if (oExportInfo.oDebugStringList != null && oExportInfo.oDebugStringList.size() > 0) {
            xmlOutput_ObjectDebugInfoNode.setText("\n" + oExportInfo.debugInfo() + "\n");
        } else {
            xmlOutput_ObjectDebugInfoNode.setText("none");
        }
    }
}
  
/*---------------------------------------------------------------------------------------
    Basic output method for the enclosing element <object> which is generated for each 
    exported object.
    The reference to the new created element <object> is returned.
 ----------------------------------------------------------------------------------------*/
function writeXmlElement_Object(xmlOutput, xmlOutput_Root, oExportInfo, xmlConfig_ObjectTypeMapping) {
    
    var sArcmType = xmlConfig_ObjectTypeMapping.getAttributeValue("arcm_objtype");
    
    var xmlOutput_ObjectNode = xmlOutput.addElement(xmlOutput_Root, "object");
    var sArcmGuid = oExportInfo.sArcmGuid;
    
    //handle ARCM guids
    if (sArcmGuid == null) {
        sArcmGuid = oExportInfo.sArisGuid;
    }
    else if (isARCMGuidQuery(sArcmGuid)) {
        if (!g_bDebugDoNotResolveGUIDQuery) {
            sArcmGuid = resolveArcmGuidQuery(sArcmGuid, xmlConfig_ObjectTypeMapping);
            oExportInfo.sArcmGuid = sArcmGuid;
        }
    }
    
    xmlOutput_ObjectNode.setAttribute("guid", sArcmGuid);
    xmlOutput_ObjectNode.setAttribute("type", sArcmType);
    
    if (g_bReadDeactivateAttribute) {
        var deactivated = getAttrValue(oExportInfo, Constants.AT_DEACT, "Boolean", null, null);
        if (deactivated == "true") {
            xmlOutput_ObjectNode.setAttribute("purpose", "DEACTIVATE");
        }
    }
    
    return xmlOutput_ObjectNode;
}

/*---------------------------------------------------------------------------------------
    XML export function for object specific meta data 
---------------------------------------------------------------------------------------*/
function writeXmlElement_ObjectMetaData(xmlOutput, xmlOutput_ObjectNode, oExportInfo) {
    var oGroup = oExportInfo.getObjDef().Group();
    var sPath = oGroup.Path(g_nLoc, true, true);
    var sName = oExportInfo.getObjDef().Name(g_nLoc);
    var xmlOutput_Meta = xmlOutput.addElement(xmlOutput_ObjectNode, "meta");
    
    var xmlOutput_Meta_Inf = xmlOutput.addElement(xmlOutput_Meta, "inf");
    xmlOutput_Meta_Inf.setAttribute("id", "group");
    xmlOutput_Meta_Inf.setText(sPath);
    
    xmlOutput_Meta_Inf = xmlOutput.addElement(xmlOutput_Meta, "inf");
    xmlOutput_Meta_Inf.setAttribute("id", "name");
    xmlOutput_Meta_Inf.setText(sName);
}

/*---------------------------------------------------------------------------------------
    Basic output method for the "aris_change_date" <attr> element.
 ----------------------------------------------------------------------------------------*/
function writeXmlElement_ArisChangeDateAttribute(xmlOutput, xmlOutput_ObjectNode, oExportInfo) {
    
    var sChangeDate = getAttrValue(oExportInfo, Constants.AT_LAST_CHNG_2, "Date", null, null);
    var xmlOutput_Attribute = xmlOutput.addElement(xmlOutput_ObjectNode, "attr");
    xmlOutput_Attribute.setAttribute("id", "aris_change_date");
    xmlOutput_Attribute.setText( sChangeDate );  
}

/*---------------------------------------------------------------------------------------
    Basic output method for the <attr> elements of each exported object.
 ----------------------------------------------------------------------------------------*/
function writeXmlElement_ObjectAttributes(xmlOutput, xmlOutput_ObjectNode, oExportInfo, oXmlConfig_MappingObject) {
    var xmlConfig_MappingAttrs = oXmlConfig_MappingObject.getChildren("mappingAttr");
    
    var oModel = null; 
    var bLookupModel = false;
    var iterAttr = xmlConfig_MappingAttrs.iterator();
    while (!bLookupModel && iterAttr.hasNext()) {   
        var xmlConfig_MapAttr = iterAttr.next();
        var attrElemTypeNum = xmlConfig_MapAttr.getAttributeValue("aris_typenum");
        bLookupModel = bLookupModel || attrElemTypeNum == "MODELGUID" || attrElemTypeNum == "MODELNAME"; 
    }       
    if (bLookupModel) {
        var aModels = getModels(oExportInfo.getObjDef(), oXmlConfig_MappingObject);
        if (aModels.length > 0) {
            oModel = aModels[0];
        }
    }
    
    var sRootGuid = oExportInfo.sArcmRootGuid;
    writeXmlElement_Attributes(xmlOutput, xmlOutput_ObjectNode, oExportInfo, null, xmlConfig_MappingAttrs, oModel, sRootGuid);
}

/*---------------------------------------------------------------------------------------
    Basic output method for the <attr> elements of each exported link.
 ----------------------------------------------------------------------------------------*/
function writeXmlElement_LinkAttributes(xmlOutput, xmlOutput_RefNode, oExportInfo, oChildExportInfo, oXmlConfig_LinkMapping) {
    var xmlConfig_MappingAttrs = oXmlConfig_LinkMapping.getChildren("mappingAttr"); 
    if (xmlConfig_MappingAttrs.size() > 0) {
        var sMappingLinkID = oXmlConfig_LinkMapping.getAttributeValue("id");
        var oCxnDef = getCxnDefInfo(oExportInfo.getObjDef(), oChildExportInfo.getObjDef(), sMappingLinkID);
        writeXmlElement_Attributes(xmlOutput, xmlOutput_RefNode, null, oCxnDef, xmlConfig_MappingAttrs, null, null);
    }
}

/*---------------------------------------------------------------------------------------
    Basic output method for <attr> elements
 ----------------------------------------------------------------------------------------*/
function writeXmlElement_Attributes(xmlOutput, xmlOutput_AttrTargetNode, oExportInfo, oCxnDef, xmlConfig_MappingAttrs, oModel, sRootGuid) {
    
    //atribute mapping handling
    var iterAttr = xmlConfig_MappingAttrs.iterator();
    while (iterAttr.hasNext()) {
        var xmlConfig_MappingAttr = iterAttr.next();
        
        var attrElemTypeNum = xmlConfig_MappingAttr.getAttributeValue("aris_typenum");
        var attrElemType = xmlConfig_MappingAttr.getAttributeValue("type");

        var attrDefaultValue = xmlConfig_MappingAttr.getAttributeValue("default_value");
        
        //determine attribute value from ObjDef by <mappingAttr> info
        var sAttrID = xmlConfig_MappingAttr.getAttributeValue("id");

        var sAttrValue = "";
        if (oExportInfo != null) {
            //object attributes
            sAttrValue = getAttrValue(oExportInfo, attrElemTypeNum, attrElemType, oModel, attrDefaultValue);
        } else if (oCxnDef != null) {
            //connection attributes
            sAttrValue = getAttrValue(oCxnDef, attrElemTypeNum, attrElemType, null, null);
        }
        
        var xmlOutput_Attribute = xmlOutput.addElement(xmlOutput_AttrTargetNode, "attr");
        xmlOutput_Attribute.setAttribute("id", sAttrID);
        xmlOutput_Attribute.setText(removeXMLInvalidChars(sAttrValue,true));
    }

    //ARCM root guid output
    if (sRootGuid != null) {
        var xmlOutput_RootGuidAttribute = xmlOutput.addElement(xmlOutput_AttrTargetNode, "attr");
        xmlOutput_RootGuidAttribute.setAttribute("id", "root_guid");
        xmlOutput_RootGuidAttribute.setText(sRootGuid);
    }
}

function removeXMLInvalidChars(str, removeDiscouragedChars) {

    // remove everything forbidden by XML 1.0 specifications, plus the unicode replacement character U+FFFD
    var regex = /((?:[\0-\x08\x0B\f\x0E-\x1F\uFFFD\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/g;

    // ensure we have a string
    str = String(str || '').replace(regex, '');

    if (removeDiscouragedChars) {

        // remove everything discouraged by XML 1.0 specifications
        regex = new RegExp(
            '([\\x7F-\\x84]|[\\x86-\\x9F]|[\\uFDD0-\\uFDEF]|(?:\\uD83F[\\uDFFE\\uDFFF])|(?:\\uD87F[\\uDF' +
            'FE\\uDFFF])|(?:\\uD8BF[\\uDFFE\\uDFFF])|(?:\\uD8FF[\\uDFFE\\uDFFF])|(?:\\uD93F[\\uDFFE\\uD' +
            'FFF])|(?:\\uD97F[\\uDFFE\\uDFFF])|(?:\\uD9BF[\\uDFFE\\uDFFF])|(?:\\uD9FF[\\uDFFE\\uDFFF])' +
            '|(?:\\uDA3F[\\uDFFE\\uDFFF])|(?:\\uDA7F[\\uDFFE\\uDFFF])|(?:\\uDABF[\\uDFFE\\uDFFF])|(?:\\' +
            'uDAFF[\\uDFFE\\uDFFF])|(?:\\uDB3F[\\uDFFE\\uDFFF])|(?:\\uDB7F[\\uDFFE\\uDFFF])|(?:\\uDBBF' +
            '[\\uDFFE\\uDFFF])|(?:\\uDBFF[\\uDFFE\\uDFFF])(?:[\\0-\\t\\x0B\\f\\x0E-\\u2027\\u202A-\\uD7FF\\' +
            'uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|' +
            '(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF]))', 'g');

        str = str.replace(regex, '');
    }

    return str;
}

/*---------------------------------------------------------------------------------------
    Basic output method for the <attrRef> elements of each exported object.
 ----------------------------------------------------------------------------------------*/
function writeXmlElement_Links(xmlOutput, xmlOutput_ObjectNode, oExportInfo, oXmlConfig_ObjectTypeMapping, bCycleBreakerMode) {
    
    var oObjDef = oExportInfo.getObjDef();
    
    var o_hm_mappingLink2ChildMappingObject = getOutgoingLinks(oXmlConfig_ObjectTypeMapping);
    var aLinkMappings = convertHashSetToJSArray(o_hm_mappingLink2ChildMappingObject.keySet());
    
    for (var m=0; m<aLinkMappings.length; m++) {
        var linkMapping = aLinkMappings[m];
        var linkMappingID = linkMapping.getAttributeValue("id");
        
        //ignore "cycle" links if the links shall be output in cycle breaker mode
        if (bCycleBreakerMode 
            && linkMapping.getAttributeValue("cycle_link") == "true") {
            continue;
        }
        //ignore merge links, they were handled by object classification algorithm already
        if (linkMapping.getAttributeValue("merge_link_mapping_attribute_refs") != null) {
            continue;
        }
        
        var oChildMappingObject = o_hm_mappingLink2ChildMappingObject.get(linkMapping);
        var sChildMappingObjectID = oChildMappingObject.getAttributeValue("id") + "";

        var sChildExportInfosSet = getChildrenExportInfos(oExportInfo, linkMapping);
        var aChildExportInfos = convertHashSetToJSArray(sChildExportInfosSet);

        //sorting by mappingLink "sort_method" if specified
        var sortMethod = linkMapping.getAttributeValue("sort_method");
        
        var sortModelTypeNum = linkMapping.getAttributeValue("sort_model_typenum");
        
        aChildExportInfos = sortChildObjDefs(sortMethod, sortModelTypeNum, oExportInfo, aChildExportInfos);
        
        //split into child ExportInfo array without and with purpose "REMOVE"
        var aChildExportInfosActive = new Array();
        var aChildExportInfosRemove = new Array();
        for (var a=0; a<aChildExportInfos.length; a++) {
            if (isLinkDeactivated(oObjDef, aChildExportInfos[a].getObjDef())) {
                aChildExportInfosRemove.push(aChildExportInfos[a]);
            } else {
                aChildExportInfosActive.push(aChildExportInfos[a]);
            }
        }
        
        //output 
        if (aChildExportInfosActive.length > 0) {
            var xmlOutput_AttrRefNode = xmlOutput.addElement(xmlOutput_ObjectNode, "attrRef");
            xmlOutput_AttrRefNode.setAttribute("id", linkMappingID);
            for (var b=0; b<aChildExportInfosActive.length; b++) {
                var sGUID = aChildExportInfosActive[b].sArcmGuid;
                if (sGUID == null) {sGUID = aChildExportInfosActive[b].sArisGuid;}
                var xmlOutput_RefNode = xmlOutput.addElement(xmlOutput_AttrRefNode, "ref");
                xmlOutput_RefNode.setAttribute("guid", sGUID);
                writeXmlElement_LinkAttributes(xmlOutput, xmlOutput_RefNode, oExportInfo, aChildExportInfosActive[b], linkMapping);
            }
        }
        if (aChildExportInfosRemove.length > 0) {
            var xmlOutput_AttrRefNode = xmlOutput.addElement(xmlOutput_ObjectNode, "attrRef");
            xmlOutput_AttrRefNode.setAttribute("id", linkMappingID);
            for (var c=0; c<aChildExportInfosRemove.length; c++) {
                var sGUID = aChildExportInfosRemove[c].sArcmGuid;
                if (sGUID == null) {sGUID = aChildExportInfosRemove[c].sArisGuid;}
                var xmlOutput_RefNode = xmlOutput.addElement(xmlOutput_AttrRefNode, "ref");
                xmlOutput_RefNode.setAttribute("guid", sGUID);
                xmlOutput_RefNode.setAttribute("purpose", "REMOVE");
                writeXmlElement_LinkAttributes(xmlOutput, xmlOutput_RefNode, oExportInfo, aChildExportInfosRemove[c], linkMapping);
            }
        }
        
    }
    
}

/*---------------------------------------------------------------------------------------
    Sort handling for <attrRef> elements.
 ----------------------------------------------------------------------------------------*/
function sortChildObjDefs(sSortMethod, sSortModelTypeNum, p_oParentExportInfo, p_aChildExportInfos) {
    
    if (g_bDebugSort) {
        var aDebugSortedChildExportInfos = p_aChildExportInfos.sort(sortExportInfoByArcmGUID);
    }
    
    var aSortedChildExportInfos = p_aChildExportInfos;
    if (sSortMethod == "sort_by_xy_position" && sSortModelTypeNum != null) {
        var iModelTypeNum = getModelTypeNum( sSortModelTypeNum );
        aSortedChildExportInfos = sortExportInfosByPositionInModel( p_aChildExportInfos, iModelTypeNum, "sortObjOccsByXYPos" );
    }
    
    if (sSortMethod == "sort_by_yx_position" && sSortModelTypeNum != null) {
        var iModelTypeNum = getModelTypeNum( sSortModelTypeNum );
        aSortedChildExportInfos = sortExportInfosByPositionInModel( p_aChildExportInfos, iModelTypeNum, "sortObjOccsByYXPos" );
    }
     
    if (sSortMethod == "sort_by_occ_distance") {
        aSortedChildExportInfos = sortExportInfosByDistanceOfLinkedOccs(p_oParentExportInfo, p_aChildExportInfos);
    }
    
    return aSortedChildExportInfos;
}

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
         ~~~~~~~ Functionality for export XML Attribute value helper functions ~~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/*---------------------------------------------------------------------------------------
    Determines the GUID.
 ---------------------------------------------------------------------------------------*/        
function getGuid(p_item) {
    if (p_item == null) {return "";}
    return p_item.GUID();
}

/*---------------------------------------------------------------------------------------
    Determines the name by attribute "AT_NAME".
 ---------------------------------------------------------------------------------------*/        
function getName(p_item) {
    if (p_item == null) {
        return "";
    }      
    return p_item.Attribute(Constants.AT_NAME, g_nLoc).GetValue(true);
}

/*---------------------------------------------------------------------------------------
    Determines the role ID by attribute "AT_NAME" and given Locale
 ---------------------------------------------------------------------------------------*/        
function getRole(p_item, p_nLocale) {
    if (p_item == null) {
        return "";
    }
    sAttrValue = p_item.Attribute(Constants.AT_NAME, p_nLocale).GetValue(true).trim();
    if (sAttrValue == null) {
        return "";
    }
    
    var nIndex = sAttrValue.indexOf("_");
    if (nIndex >= 0) {
        return sAttrValue.substring(0, nIndex);
    }  
    return "";
}


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                ~~~~~~~ Functionality for export XML - helper methods ~~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  
/*----------------------------------------------------------------------------------------------
    Determines the element inside the enum mapping by means of a partial String.
    Example: "Enum_someID" 	-> EnumElement "mappingEnum" with attribute "aris_enum" = "someID".
			 not found?		-> EnumElement "mappingEnum" with attribute "enum" = "someID".
    Returns the according <mappingenum> element.
------------------------------------------------------------------------------------------------*/
function getXmlConfigMappingEnumElement(p_sAttrType){
    var sEnumID = new String(p_sAttrType).substring(5); 
    return getMappingEnum(sEnumID);
}