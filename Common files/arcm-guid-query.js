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

var g_bDebugDummyGUIDs = false;
var g_iDebugDummyGUIDCounter = 0;

//---------------------------------------------------------------------------------------
//--------------------- ARCM GUID QUERY CONSTRUCTION FUNCTIONS --------------------------

var g_sArcmGuidQueryStart   = "(";
var g_sArcmGuidQueryEnd     = ")";

/*--------------------------------------------------------------------------------------------------------------------------
    Convenience quick check function if a string is a ARCM guid query or not.
 -------------------------------------------------------------------------------------------------------------------------*/
function isARCMGuidQuery(sString) {
    return  sString != null 
            && (sString.startsWith(g_sArcmGuidQueryStart + "QUERY:") || sString.startsWith(g_sArcmGuidQueryStart + "REVERSEQUERY:"))
            && (sString.endsWith(g_sArcmGuidQueryEnd));
}


/*--------------------------------------------------------------------------------------------------------------------------
    Used for mappings which are marked as VIRTUAL (documents, policyreviewtask).
    Creates a query string which tells the export report how to obtain the ARCM guid of
    the AppObjs in ARCM in case they exist due to a previous sync.
    Format: "QUERY:<target AppObj ARCM guid>#<list attribute ID>#<attrID>=<value>#<attrID>=<value>#..."
    example risk document:      QUERY:12345678-1234-1234-1234-123456789012#documents#name=SomeDocName#link=SomeDocLink
                                -> returns the linked document where name and link match
    example policyreviewtask:   QUERY:87654321-431-4321-4321-210987654321#policyreviewtask
                                -> returns the first linked policyreviewtask
 -------------------------------------------------------------------------------------------------------------------------*/
function constructVirtualArcmGuidQuery(p_oExportInfo, p_oSuperiorExportInfo, p_sMappingLinkID) {
    
    var aAttrIDs = new Array();
    
    var sArcmQueryString = g_sArcmGuidQueryStart + "QUERY:";
    if (p_oSuperiorExportInfo.sArcmGuid != null) {
        sArcmQueryString += p_oSuperiorExportInfo.sArcmGuid;
    } else {
        sArcmQueryString += p_oSuperiorExportInfo.sArisGuid;
    }
    sArcmQueryString += "#" + p_sMappingLinkID;
       
    var oChildMappingObjectNode = getMappingObjectByID(p_oExportInfo.sMappingObjectID);
    var sMappingAttrEqualityString = oChildMappingObjectNode.getAttributeValue("mapping_by_referenced_attributes_value_equality");
	if (sMappingAttrEqualityString != null) {
        aAttrIDs = sMappingAttrEqualityString.split(",");

        for (var a=0; a<aAttrIDs.length; a++) {
            var oMappingAttrNode = getMappingAttr(oChildMappingObjectNode, aAttrIDs[a]);
            if (oMappingAttrNode == null) {continue;}
            
            var attrElemTypeNum = oMappingAttrNode.getAttributeValue("aris_typenum");
            var attrElemType = oMappingAttrNode.getAttributeValue("type");
            var sAttrValue = getAttrValue_Default(p_oSuperiorExportInfo.getObjDef(), attrElemTypeNum, attrElemType);
            
            sArcmQueryString += "#" + aAttrIDs[a] + "=" + sAttrValue; 
        }
    }
    sArcmQueryString += g_sArcmGuidQueryEnd;
    
    return sArcmQueryString;
}


/*-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    Used for mappings which have a defined root (sections, audit step templates)
    Creates a query string which tells the export report how to obtain the ARCM guid of
    the AppObjs in ARCM in case they exist due to a previous sync.
    Format: "REVERSEQUERY:<root AppObj ARCM guid>#<list attribute ID>#<ARIS origin guid attr>=<ARIS guid of child ObjDef>"
    example section:                REVERSEQUERY:12345678-1234-1234-1234-123456789012#relQuestionnaireTemplate#objdef_guid=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee#section
                                    -> returns the section AppObj with the ARIS guid "aaaa..." which is linked to the specified questionnaire template
    example audit step template:    REVERSEQUERY:87654321-431-4321-4321-210987654321#audittemplate#guid=eeeeeeee-dddd-cccc-bbbb-aaaaaaaaaaaa#auditsteptemplate
                                    -> returns the audit step template AppObj with the ARIS guid "eeee..." which is linked to the specified audit template
 -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
function constructRootReverseArcmGuidQuery(p_oExportInfo) {

    var oChildMappingObject = getMappingObjectByID(p_oExportInfo.sMappingObjectID);
    var sRootReverseConnectionArcmLinkID = oChildMappingObject.getAttributeValue("arcm_root_reverse_connection_attr");
    var sGuidAttrName = oChildMappingObject.getAttributeValue("arcm_guid_attr");
    
    var sArcmRootGuidPart = p_oExportInfo.sArcmRootGuid;
    
    var sArcmQueryString = g_sArcmGuidQueryStart + "REVERSEQUERY:";
    sArcmQueryString += sArcmRootGuidPart + "#" + sRootReverseConnectionArcmLinkID;
    sArcmQueryString += "#" + sGuidAttrName + "=" + p_oExportInfo.sArisGuid + "#" + oChildMappingObject.getAttributeValue("arcm_objtype");
    sArcmQueryString += g_sArcmGuidQueryEnd;
    
    return sArcmQueryString;
}


/*--------------------------------------------------------------------------------------------------------------------------
    Creates a query string which tells the export report how to obtain the ARCM guid of depending section AppObjs in ARCM
    in case they exist due to a previous sync.
    Format: "QUERY:<positioning section AppObj ARCM guid>#<hierarchical list attribute ID>#<ARIS origin guid attr>=<ARIS guid of depending section ObjDef>"
    example section:            QUERY:12345678-1234-1234-1234-123456789012#sections#objdef_guid=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
                                -> returns the linked sub section where the ARIS guid matches
 -------------------------------------------------------------------------------------------------------------------------*/
function constructQTDependingSectionArcmGuidQuery(p_oPositioningQTExportInfo, p_oDependingSectionExportInfo) {
    
    var p_sMappingLinkID = getHierarchicalMappinkLink("QUESTIONNAIRE_TEMPLATE").getAttributeValue("id");
    var sGuidAttrName = getMappingObjectByID("SECTION").getAttributeValue("arcm_guid_attr");
    
    var sArcmQueryString = g_sArcmGuidQueryStart + "QUERY:";
    sArcmQueryString += p_oPositioningQTExportInfo.sArisGuid;
    sArcmQueryString += "#" + p_sMappingLinkID;
    sArcmQueryString += "#" + sGuidAttrName + "=" + p_oDependingSectionExportInfo.sArisGuid;
    sArcmQueryString += g_sArcmGuidQueryEnd;
    
    return sArcmQueryString;
}


/*--------------------------------------------------------------------------------------------------------------------------
    Creates a query string which tells the export report how to obtain the ARCM guid of depending section AppObjs in ARCM
    in case they exist due to a previous sync.
    Format: "QUERY:<positioning section AppObj ARCM guid>#<hierarchical list attribute ID>#<ARIS origin guid attr>=<ARIS guid of depending section ObjDef>"
    example risk document:      QUERY:12345678-1234-1234-1234-123456789012#subSections#objdef_guid=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
                                -> returns the linked sub section where the ARIS guid matches
 -------------------------------------------------------------------------------------------------------------------------*/
function constructSectionDependingSectionArcmGuidQuery(p_oPositioningSectionExportInfo, p_oDependingSectionExportInfo) {
    
    var p_sMappingLinkID = getHierarchicalMappinkLink("SECTION").getAttributeValue("id");
    var sGuidAttrName = getMappingObjectByID("SECTION").getAttributeValue("arcm_guid_attr");
    
    var sArcmQueryString = g_sArcmGuidQueryStart + "QUERY:";
    sArcmQueryString += p_oPositioningSectionExportInfo.sArcmGuid;
    sArcmQueryString += "#" + p_sMappingLinkID;
    sArcmQueryString += "#" + sGuidAttrName + "=" + p_oDependingSectionExportInfo.sArisGuid;
    sArcmQueryString += g_sArcmGuidQueryEnd;
    
    return sArcmQueryString;
}


//--------------------- ARCM GUID QUERY CONSTRUCTION FUNCTIONS --------------------------
//---------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------
//------------------------ ARCM GUID QUERY RESOLVE FUNCTIONS ----------------------------

//query result caching, mostly useful for depending sections
var g_hmArcmQuery2ArcmGuid = new java.util.HashMap();

/*----------------------------------------------------------------------------------------------
    Resolves the given ARCM guid query string and contacts ARCM if there exists an matching
    AppObj. If so then its ARCM guid is returned, otherwise a new one is generated.
    The given string is returned unchanged if:
        - is no ARCM guid query (but for example an already resolved guid)
        - g_arcmEnvironmentID or g_nLoc are not set i.e. the function is not called in 
          combination with the export report
------------------------------------------------------------------------------------------------*/
function resolveArcmGuidQuery(sArcmQueryString, oMappingObjectNode) {
	//return the string if it is no query or the debug flag is set
    if (!isARCMGuidQuery(sArcmQueryString) || g_bDebugDoNotResolveGUIDQuery) {
        return sArcmQueryString;
    }
    //return dummy guids if the debug flag is set, even if not executed in combination with export report
    if (g_bDebugDummyGUIDs) {
        sArcmGuid = "DummyGUID_" + g_iDebugDummyGUIDCounter;
        g_iDebugDummyGUIDCounter++;
        return sArcmGuid;
    }
    //return the query string if not executed in combination with export report
	if (g_arcmEnvironmentID == null || g_nLoc == null) {
		return sArcmQueryString;
	}
	
    sArcmQueryString = sArcmQueryString.slice(1, -1);
    
    //ask cache first
    var sArcmGuid = g_hmArcmQuery2ArcmGuid.get(sArcmQueryString);
    
    if (sArcmGuid == null) {
        if (sArcmQueryString.startsWith("QUERY:")) {
            sArcmGuid = resolveArcmGuidForwardQuery(sArcmQueryString, oMappingObjectNode);
        }
        if (sArcmQueryString.startsWith("REVERSEQUERY:")) {
            sArcmGuid = resolveArcmGuidReverseQuery(sArcmQueryString, oMappingObjectNode);
        }
    }
    
    //update cache
    g_hmArcmQuery2ArcmGuid.put(sArcmQueryString, sArcmGuid);
    
	return sArcmGuid;
}

/*----------------------------------------------------------------------------------------------
    Resolves forward ARCM guid queries starting with "QUERY:".
------------------------------------------------------------------------------------------------*/
function resolveArcmGuidForwardQuery(sArcmQueryString, oMappingObjectNode) {
	
	var sQueryPart = sArcmQueryString.substring("QUERY:".length); 
	var aQueryPartSplit = sQueryPart.split("#");
    
    //if the arcm guid part itself is again a query then resolve it first in recursion
	var sMasterAppObjArcmGuid = resolveArcmGuidQuery(aQueryPartSplit[0]);
	
	var oGUIDRequestResultList = ARCM.findByGUID(sMasterAppObjArcmGuid, g_arcmEnvironmentID, g_nLoc);
	if (oGUIDRequestResultList.size() > 0) {
		var oMasterAppObject = oGUIDRequestResultList.get(0);
		var sLinkAttributeID = aQueryPartSplit[1];
		
		var oAttributeValueMap = new java.util.HashMap();
		for (var a=2; a<aQueryPartSplit.length; a++) {
			var aIdValue = aQueryPartSplit[a].split("=");
			oAttributeValueMap.put(aIdValue[0], aIdValue[1]);
		}
		
		var oListAttribute = oMasterAppObject.getListAttribute(sLinkAttributeID);
		if (oListAttribute != null) {
			var oConnectedAppObjects = oListAttribute.getConnectedObjects();
			var iter = oConnectedAppObjects.iterator();
			while (iter.hasNext()) {
				var oConnectedAppObject = iter.next();
				//if there are value attribute or enum attribute criteria set: check if the attribute values match
				var bAllCriteriaMatch = true;
				var attrValueIterator = oAttributeValueMap.keySet().iterator();     
				while (attrValueIterator.hasNext() && bAllCriteriaMatch) {
					var sAttrID = attrValueIterator.next();
					var sAttrValue = oAttributeValueMap.get(sAttrID);
					if (oConnectedAppObject.isValueAttributeType(sAttrID)) {
						var oValueAttribute = oConnectedAppObject.getValueAttribute(sAttrID);
						if (oValueAttribute.getUiValue() + "" != sAttrValue) {
							bAllCriteriaMatch = false;
						}
					} else if (oConnectedAppObject.isEnumAttributeType(sAttrID)) {
						var oEnumAttribute = oConnectedAppObject.getEnumAttribute(sAttrID);
						var oSelectedItemsList = oEnumAttribute.getSelectedItems();
						var bItemSelected = false;
						var itemIterator = oSelectedItemsList.iterator();
						while (itemIterator.hasNext() && !bItemSelected) {
							var oItem = itemIterator.next();
							if (oItem.getId() + "" == sAttrValue) {
								bItemSelected = true;
							}
						}
						if (!bItemSelected) {
							bAllCriteriaMatch = false;
						}
					}   
				}
				//all existing criteria match -> return the AppObj ARCM guid
				if (bAllCriteriaMatch) {
					return oConnectedAppObject.getValueAttribute("guid").getRawValue();
				} 
			}
		}
	}
      
    //nothing found by query -> create new guid
    return Packages.com.aris.modeling.server.common.AGUIDGenerator.theInstance().createNewGUID().toExtendedString();
}


/*----------------------------------------------------------------------------------------------
    Determines reverse ARCM guid queries starting with "REVERSEQUERY:".
------------------------------------------------------------------------------------------------*/
function resolveArcmGuidReverseQuery(sArcmQueryString, oMappingObjectNode) {
	
	var sQueryPart = sArcmQueryString.substring("REVERSEQUERY:".length);
	var aQueryPartSplit = sQueryPart.split("#");
    
    //if the arcm guid part itself is again a query then resolve it first in recursion
	var sMasterAppObjArcmGuid = resolveArcmGuidQuery(aQueryPartSplit[0]);
    
	var sListAttributeID = oMappingObjectNode.getAttributeValue("arcm_root_reverse_connection_attr");
	var sChildAppObjTypeID = oMappingObjectNode.getAttributeValue("arcm_objtype");
    
    var sChildAppObjArcmConditionAttr = aQueryPartSplit[2].substring(0, aQueryPartSplit[2].indexOf("="));
    var sChildAppObjArcmConditionValue = aQueryPartSplit[2].substring(aQueryPartSplit[2].indexOf("=") + 1);
	
	var restrictionFactory = ARCM.getQueryRestrictionFactory();
	var query = ARCM.createQuery(sChildAppObjTypeID, g_nLoc);
	query.addRestriction(restrictionFactory.eq(sChildAppObjArcmConditionAttr, sChildAppObjArcmConditionValue));
	
	var oGUIDRequestResultList = query.getResult();
	var resultIterator = oGUIDRequestResultList.iterator();
	while (resultIterator.hasNext()) {
		var resultAppObject = resultIterator.next();
		if (!resultAppObject.isListAttributeType(sListAttributeID)) {
			continue;
		}
		
		//special case SECTION - only consider those which are explicit i.e. their list attribute "activatedBy" is empty
		if (resultAppObject.isListAttributeType("activatedBy")
			&& !resultAppObject.getListAttribute("activatedBy").getConnectedObjects().isEmpty()) {
			continue;
		}
		
		var oConnectedMastersIterator = resultAppObject.getListAttribute(sListAttributeID).getConnectedObjects().iterator();
		var bConnectedToMaster = false;
		while (oConnectedMastersIterator.hasNext()) {
			var masterAppObject = oConnectedMastersIterator.next();
			if (masterAppObject.getValueAttribute("guid").getRawValue() + "" == sMasterAppObjArcmGuid) {
				//we found the coresponding AppObj, return its ARCM guid
				return resultAppObject.getValueAttribute("guid").getRawValue();
			}
		}
	}
    
    //nothing found by query -> create new guid
    return Packages.com.aris.modeling.server.common.AGUIDGenerator.theInstance().createNewGUID().toExtendedString();
}


//------------------------ ARCM GUID QUERY RESOLVE FUNCTIONS ----------------------------
//---------------------------------------------------------------------------------------