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

/**
* Helper utility to upload the content of the xml file to ADS
*
* For this reason this utility needs these information:
* - Path of the file in ADS
* - Name of the file in ADS 
* - Document title(optional)
* - Description for the document(optional)
*
* These properties are from the parameter class 'OutputParameters', which is to be defined in every script
*
* This upload process includes two steps:
* 1. Upload the meta data to ADS. In this step the header data from the xml output object will be uploaded.
*    The name of this file will be the original file name with the prefix '_metadata'.
*    E.g. the file name would be 'test.xml' the file name for the meta data would be 'test_metadata.xml'
* 2. Upload the complete xml file to ADS
*/    
function uploadXmlOutputToADS(outputObject, outputParameters) {
   uploadContentToADS(outputObject, 
                      prefixWithDatabaseName(outputParameters.getFolderName()),
                      outputParameters.getFileName(),
                      outputParameters.getDocumentTitle(),
                      outputParameters.getDescription());
}

function prefixWithDatabaseName(p_folderName) {
    var dbName = ArisData.getActiveDatabase().Name(-1);
    return /*encodeURI*/(dbName) + "\\" + /*encodeURI*/(p_folderName);   
}

this.uploadContentToADS = function(p_XMLOutputObject, p_adsFolderName, p_adsFileName, p_documentTitle, p_documentDescription) {
    var metaDataFileName = createMetaFileName(p_adsFileName);

    var rootName = p_XMLOutputObject.getRootElement().getName();
    var metaDataOutput = Context.createXMLOutputObject(metaDataFileName, rootName)
    metaDataOutput.setEncoding("UTF-8")
    var metaRoot = metaDataOutput.getRootElement();
    metaRoot.addContent(p_XMLOutputObject.cloneHeader());
    
    var adsReport = Context.getComponent("ADS")
    // todo: which repository is to use here?
    var repository = adsReport.getADSRepository("portal")
    var rootFolder = repository.getRootFolder();
    var folderName = "Dashboarding\\" + p_adsFolderName;
    var adsFolder = repository.getFolder(rootFolder, folderName);
    if (!adsFolder) 
        adsFolder = repository.createFolder(rootFolder, folderName);
    
    // todo: which name for the meta data attribute should be used?
    //myDocInfo.setAttributes([myDocInfo.createAttribute("metadata", new java.lang.String(metaDataByteArray))]);
    var myMetaInfo = repository.createDocumentMetaInfo("Meta data for: "+p_documentTitle, metaDataFileName, p_documentDescription);
    var metaDataByteArray = metaDataOutput.getDocumentContent();
    var metaDocument = repository.createAndOverwriteExistingDocument(adsFolder, myMetaInfo, new java.io.ByteArrayInputStream(metaDataByteArray))

    var myDocInfo = repository.createDocumentMetaInfo(p_documentTitle, p_adsFileName, p_documentDescription);
    var contentByteArray = p_XMLOutputObject.getContentAsByteArray();
    var document = repository.createAndOverwriteExistingDocument(adsFolder, myDocInfo, new java.io.ByteArrayInputStream(contentByteArray))
}    

function createMetaFileName(p_fileName) {
    var indexPoint = p_fileName.lastIndexOf(".");
    var metaDataFileName = p_fileName.substring(0,indexPoint)+"_METADATA"+p_fileName.substring(indexPoint, p_fileName.length());
    return metaDataFileName;        
}   

var OutputParameters = function(prefix) {
    var usedPrefix = "";
    if (prefix) {
        usedPrefix = prefix + "_";        
    }
    const m_folderName = Context.getParameterValueAccess().getParameterValue(usedPrefix + "FolderName").getValue();
    const m_fileName = Context.getParameterValueAccess().getParameterValue(usedPrefix + "FileName").getValue();
    const m_documentTitle = Context.getParameterValueAccess().getParameterValue(usedPrefix + "DocumentTitle").getValue();
    const m_description = Context.getParameterValueAccess().getParameterValue(usedPrefix + "DocumentDescription").getValue();
    
    this.getFolderName = function() {
        return m_folderName;
    }
    
    this.getFileName = function() {
        return m_fileName;
    }
    
    this.getDocumentTitle = function() {
        return m_documentTitle;
    }
    
    this.getDescription = function() {
        return m_description;
    }
}

function createXmlOutput(outputParameters) {
    const outputObject = new XMLOutputObject(outputParameters.getFileName(), false);
    return outputObject;
}