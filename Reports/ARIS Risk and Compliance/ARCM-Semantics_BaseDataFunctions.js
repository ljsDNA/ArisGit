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

var gLanguage = Context.getSelectedLanguage();

/*----------------------------------------------------------------------------------------------
 Write a given error string (pOutput) into a new output file (pOutputFilename)
 -----------------------------------------------------------------------------------------------*/ 
function writeErrorreport(pOutput, pHeader, pOutputFilename){
    
    if (pOutput.equals("")){
        // no error found
        return false;
    }
    else{
        pOutput =  (pHeader==null?"":pHeader) + pOutput;
        Context.setSelectedFile(pOutputFilename);
        var outFile = Context.createOutputObject(Constants.OUTTEXT, pOutputFilename);
        outFile.Init(gLanguage);
        outFile.OutputLn(pOutput, getString("COMMON_1"),  12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
        outFile.WriteReport();
        return true;
    } 
    
}

/*----------------------------------------------------------------------------------------------
 Write a given error string (pOutput) into a new output file (pOutputFilename)
 -----------------------------------------------------------------------------------------------*/ 
function writeErrorreport(pOutput, pOutputFilename){
    
    if (pOutput.equals("")){
        // no error found
        return false;
    }
    else{
        Context.setSelectedFile(pOutputFilename);
        var outFile = Context.createOutputObject(Constants.OUTTEXT, pOutputFilename);
        outFile.Init(gLanguage);
        outFile.OutputLn(pOutput, getString("COMMON_1"),  12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
        outFile.WriteReport();
        return true;
    } 
    
}


/*----------------------------------------------------------------------------------------------
 Convenience method for obtaining all ExportInfos for a given object mapping ID.
 Always returns a HashSet of ExportInfos, empty if there are none for the given mapping.
 -----------------------------------------------------------------------------------------------*/ 
function getExportInfoSetByObjectMappingID(p_sMappingObjectID) {
    var oExportInfoSet = g_classification_hm_mappingObjectID2exportInfos.get(p_sMappingObjectID);
    if (oExportInfoSet != null) {
        return oExportInfoSet;
    }
    return new java.util.HashSet();
}

/*----------------------------------------------------------------------------------------------
 Convenience method for obtaining all child ExportInfos linked to the given parent ExportInfo
 via the given mapping link ID.
 Always returns a ArrayList of ExportInfos, empty if there are no linked ExportInfos.
 -----------------------------------------------------------------------------------------------*/
function getChildExportInfoArrayByLink(p_oHierarchyElementExportInfo, p_sMappingLinkID) {
    var result = new java.util.ArrayList();
    var oHierarchyMappingObject = getMappingObjectByID(p_oHierarchyElementExportInfo.sMappingObjectID);
    var oMappingLink = getMappingLink(oHierarchyMappingObject, p_sMappingLinkID);
    if (oMappingLink != null) {
        result.addAll(getChildrenExportInfos(p_oHierarchyElementExportInfo, oMappingLink));
    }
    return result;
}

/*----------------------------------------------------------------------------------------------
 Convenience method for obtaining all parent ExportInfos of the given parent mapping object ID
 linked to the given child ExportInfo via the given mapping link ID.
 Always returns a ArrayList of ExportInfos, empty if there are no linked ExportInfos.
 -----------------------------------------------------------------------------------------------*/
function getParentExportInfoArrayByLink(p_oHierarchyElementExportInfo, p_sMappingLinkID, p_sParentMappingObjectID) {
    var result = new java.util.ArrayList();
    var oHierarchyMappingObject = getMappingObjectByID(p_sParentMappingObjectID);
    var oMappingLink = getMappingLink(oHierarchyMappingObject, p_sMappingLinkID);
    if (oMappingLink != null) {
        result.addAll(getParentExportInfos(p_oHierarchyElementExportInfo, oMappingLink, oHierarchyMappingObject));
    }
    return result;
}

/*----------------------------------------------------------------------------------------------
 Convenience method for obtaining all hierarchical parent ExportInfos linked to the given child
 ExportInfo via the given mapping link ID.
 Always returns a ArrayList of ExportInfos, empty if there are no linked ExportInfos.
 -----------------------------------------------------------------------------------------------*/
function getHierarchicalParentExportInfoArrayByLink(p_oHierarchyElementExportInfo, p_sMappingLinkID) {
    var result = new java.util.ArrayList();
    var oHierarchyMappingObject = getMappingObjectByID(p_oHierarchyElementExportInfo.sMappingObjectID);
    var oMappingLink = getHierarchicalMappinkLink(oHierarchyMappingObject);
    if (oMappingLink != null) {
        result.addAll(getParentExportInfos(p_oHierarchyElementExportInfo, oMappingLink, oHierarchyMappingObject));
    }
    return result;
}
