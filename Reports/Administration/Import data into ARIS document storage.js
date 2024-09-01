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

// please ADAPT before executing this script
var documentFileName = "PATH to an example document" // e.g. "c:\\ads\\document.txt" or "./ads/document.txt"
var documentUpdatedFileName = "PATH to an document to update the previous one" // e.g. "c:\\ads\\document updated.txt" or "./ads/document updated.txt"
var importDirectory = java.nio.file.Paths.get("PATH to a specific directoy") // // e.g. "c:\\ads" or "./ads"

var adsReport = Context.getComponent("ADS")
var umcReport = Context.getComponent("UMC")

// try to fetch a specific user from UMC to assign later as the document owner
// (fallback to the system user, if the user "Owner" does not exist in UMC
var owner = umcReport.getUserByName("Owner")

// get the standard repository (the one you see in ARIS Connect etc.)
var repository = adsReport.getADSRepository("portal")
var rootFolder = repository.getRootFolder();

var adsFolder;
var parentFolder;

main();
 
function main() {
    
    // example implementation to upload a complete folder hierarchy to ADS
    // the first folder is ignored, all files are uploaded to the root folder in ads
    // e.g.: /ads/first folder/subfolder of first folder -> in the ADS repository all files
    //       in the folder "ads" are stored in the root folder, everything beyond in the folders
    //       which are given by the directory structure

    traverseDir(importDirectory);

    var file = new java.io.File(documentFileName);
    
    // create the meta data, e.g. file name, file title, description and the owner, previously taken from UMC
    var docInfo = repository.createDocumentMetaInfo(file.getName(), file.getName(), "update example", null, null, owner);  
    var singleContent = new java.io.FileInputStream(file);
    
    try {
        document = repository.createDocument(rootFolder, docInfo, singleContent);    
        
        // create updated meta data for the given document
        docInfo = repository.createDocumentMetaInfo(file.getName(), file.getName(), "updated metadata");    
        // update the document meta data
        document = repository.updateDocument(document, docInfo);
        
        file = new java.io.File(documentUpdatedFileName);
        singleContent = new java.io.FileInputStream(file);
        
        // and upload new document revision, with revision comment "content updated"
        repository.updateDocumentContent(document, docInfo, singleContent, "content updated");
    } finally {        
        singleContent.close();
    }
    
}
	
function traverseDir(path) {    
    
        var stream = java.nio.file.Files.newDirectoryStream(path);
	    try {
	       for (var iterator = stream.iterator(); iterator.hasNext();) {
               var entry = iterator.next();
               
	            if (java.nio.file.Files.isDirectory(entry)) {    
                    var parentFolder;
                    if (adsFolder) {
                        parentFolder = adsFolder;
                    } else {
                        parentFolder = rootFolder;
                    }
                    
                    adsFolder = repository.createFolder(parentFolder, entry.toString().substring(entry.toString().lastIndexOf("\\")+1));
                    
	                traverseDir(entry);
                    adsFolder = null;
	            } else {	            	
	            	var file = entry.toFile();                    
                    var docInfo = repository.createDocumentMetaInfo(file.getName(), file.getName(), "");
                    
                    var document;
                    var parentFolder;
                    
                    if (adsFolder) {
                        parentFolder = adsFolder;
                    } else {
                        parentFolder = rootFolder;
                    }
                    
                    var content = new java.io.FileInputStream(file);
                    
                    try {                        
                        document = repository.createDocument(parentFolder, docInfo, content);
                    } finally {
                        content.close();
                    }
                    
	            }
	        }
	    } catch (ex) {
              var line = ex.lineNumber    
              var message = ex.message    
              var filename = ex.fileName    
              var exJava = ex.javaException
              
              if(exJava!=null) {
    
                var aStackTrace = exJava.getStackTrace()    

                for(var iST=0; iST<aStackTrace.length; iST++) {    
                    message = message + "\n" + aStackTrace[iST].toString()    
                }
              }
    
              Dialogs.MsgBox("Exception in file "+filename+", line "+line+":\n"+message )
	    } finally {
            stream.close();
        }
	}