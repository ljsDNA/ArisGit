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
 * Wrapps the java import helper and handles the change history.
 *
 * @author MIPO
 */

/* const */ ImportProvider.SUCCEEDED = 0;
/* const */ ImportProvider.SKIPPED = 1;
/* const */ ImportProvider.FAILED = 2;
/* const */ ImportProvider.DELAYED = 3;
    
/* const */ ImportProvider.NO_ERROR = "NO_ERROR"; /* when no error occurred */
/* const */ ImportProvider.TEMPORARY_ERROR = "TEMPORARY_ERROR"; /* i.e. open model */
/* const */ ImportProvider.METHOD_ERROR = "METHOD_ERROR"; /* some name/number was not found in ARIS method */
/* const */ ImportProvider.STRUCTURAL_ERROR = "STRUCTURAL_ERROR"; /* the structure of the received operation is invalid, configuration error) */
/* const */ ImportProvider.NOT_FOUND_ERROR = "NOT_FOUND_ERROR"; /* objects involved in the operation could not be found */
/* const */ ImportProvider.WRITE_ERROR = "WRITE_ERROR"; /* report framework write function failed (creating/deleting/...) */
/* const */ ImportProvider.UNKNOWN_ERROR = "UNKNOWN_ERROR"; /* everything else (class casts, null pointer etc.) */
    
 function ImportProvider(database, url, exportName, secret) {
    
    /**
     * Sets the attribute in which the change information is accumulated.
     * @param attribute type number or API name of attribute
     */
    this.setHistoryAttribute = function(attribute) {
        if (isNaN(attribute))
            changeHistoryAttribute = eval("Constants." + attribute);
        else
            changeHistoryAttribute = attribute;
    }
    
    this.next = function() {
        currentElement = processor.next();
        return currentElement;
    }
    
    /**
     * Sets the status of the current operation according to the given status.
     * @param status status of the import
     * @param statusMessage message describing the import status in detail
     * @param valueMessage message describing the change in detail
     */
    this.setStatus = function(status, errorCode, statusMessage, locale, createHistoryEntry, valueMessage) {
        processor.setStatus(status, statusMessage); 
        if(status != ImportProvider.DELAYED && createHistoryEntry)
            addToHistory(currentElement, status, errorCode, statusMessage, locale, valueMessage);
    }

    /**
     * Sets the status of the given operation according to the given status.
     * @param element DOM element containing the operation for which the status is to be set
     * @param status status of the import
     * @param statusMessage message describing the import status in detail
     * @param valueMessage message describing the change in detail
     */
    this.setStatusForElement = function(element, status, errorCode, statusMessage, locale, createHistoryEntry, valueMessage) {
        processor.setStatus(element, status, statusMessage);
        if(status != ImportProvider.DELAYED && createHistoryEntry)
            addToHistory(element, status, errorCode, statusMessage, locale, valueMessage);
    }
    
    /**
     * Gets a set of handler names for which import operations are available.
     * @return java.util.Set containing the handler names as java.lang.String
     */
    this.getHandlerSet = function() {
        return processor.getHandlerSet();
    }
    
    this.setActiveHandler = function(name) {
        return processor.setActiveHandler(name);
    }
    
    
    /**
     * Sets the item finder used to find any item while import process.
     * @param theItemFinder the item finder used while import process.
     */
    this.setItemFinder = function(theItemFinder) {
        itemFinder = theItemFinder;    
    }
    
    /**
     * Gets the item finder used to find any item while import process.    
     * @return item finder providing the findItem function to find items.
     */
    this.getItemFinder = function() {
        return itemFinder;   
    }
    

    /**
     * Adds import information for the change history of the context object.
     * @param operation DOM element of import operation
     * @param status status code of the import result
     * @param statusMessage message describing the import status in detail
     * @param valueMessage message describing the change in detail
     */
    function addToHistory(operation, status, errorCode, statusMessage, locale, valueMessage) {
        // get basic information and context item
        var command = operation.getAttribute("command");
        
        // get the context element
        var childNodes = getRealChildren(operation);
        
        // abort if the operation does not define a context 
         if(childNodes.length <= 0) 
             return;
        
        var contextNode = childNodes[0]; 
        var guid = contextNode.getAttribute("value"); 
        
        var contextObject = db.FindGUID(guid);
        if (contextObject == null)
            return;
        
        var historyEntry = "";

        // add error message where applicable
        statusMessage = statusMessage.replace("\n", "");
        switch (status) {
            case 0: break; // Success
            case 1: break; // Skipped (success)
            case 2: historyEntry += "Failed: " + errorCode + "\n";
            case 3: break; // Failed temporarily (not worth logging in the history)
            default: historyEntry += "Failed: " + ImportProvider.UNKNOWN_ERROR + "\n"; break;
        }
        
        // add information about the change
        var description = "unknown";
        if (command == "set")
            description = "Add: " + valueMessage + "\n";
        else
            description = "Delete: " + valueMessage + "\n";
   
        historyEntry += description;
        
        // create header of history entry
        var userName = operation.getAttribute("userName").replaceAll(";", "");
        var property = operation.getAttribute("property").replaceAll(";", "");
        var dateString = dateFormat.format(new Packages.java.util.Date());
        var historyEntryHeader =
            "# " + dateString + "; "
            + userName + "; "
            + property + "; "
            + operation.getAttribute("userGUID") + "; "
            + locale + "; "
            + historyEntry.length + "; "
            + "B4D95BF6B36723F232E27E15CE8DDE99"
            + "\n";
        
        // insert entry at the top of the change history 
        var theAttribute = changeHistoryAttribute;
        var operationHistoryAttribute = operation.getAttribute("history"); 
        if(operationHistoryAttribute != null && !operationHistoryAttribute.equals("")) {
           // in case operation provides history use this attribute 
           theAttribute = operationHistoryAttribute;
        }   
        
        existingHistoryText = contextObject.Attribute(theAttribute, -1).getValue();    
        
        if (existingHistoryText == null)
            existingHistoryText = "";
        contextObject.Attribute(theAttribute, -1).setValue(historyEntryHeader + historyEntry + existingHistoryText);
    }   

    /**
    * Returns the children for a given element node that are of type element node.
    * @param startNode the parent not for the look up. 
    *
    * @return the children for a given element node that are of type element node. 
    */
    function getRealChildren(startNode) {
        var childrenArray = new Array();
        var nodeChildren = startNode.getChildNodes();
        for (var gidx = 0; gidx < nodeChildren.getLength(); gidx++) {
            var childNode = nodeChildren.item(gidx);
            if (childNode.getNodeType() != childNode.ELEMENT_NODE) {
                continue;
            }
            else {
                childrenArray.push(childNode);
            }
        }
        return childrenArray;
    }          
                    
    // create an import processor for the given import on the given server
    var processor = new Packages.com.aris.modeling.server.bl.reportextensions.itinventory.ImportProcessor(url, exportName, secret);

    /** ARIS database to use */
    var db = database;
    
    /** attribute used to store the change information in */
    var changeHistoryAttribute; 

    /** Import operation which is currently being processed. */
    var currentElement;
    
    /** format for ABT_DATE */
    var dateFormat = new Packages.java.text.SimpleDateFormat("MM/dd/yyyy HH:mm:ss");
    
    /** the item finder used find any item while import process */
    var itemFinder;
}

/**
* Returns array of groups name for path string
* @param path string path
*
* @return array of group names
*/
function getPath(path){
        var groups = new java.util.LinkedList();
        var group = new java.lang.StringBuffer();
        path = new String(path);
        var maxLength = path.length;
        for (var i = 0; i < maxLength; i++) {
            var c= path.substring(i,i+1);
            if(c == "\\" ){
                groups.add(group.toString());
                group = new java.lang.StringBuffer();
                continue;
            }
            if(c == "/"){
                if(i+1 < maxLength && (path.substring(i+1,i+2) == "\\" || path.substring(i+1,i+2) == "/") ){
                    i++;
                    group.append(path.substring(i,i+1));
                    continue;
                }else{
                    groups.add(group.toString());
                    group = new java.lang.StringBuffer();
                    continue;
                }
            }
            group.append(c);
        }
        groups.add(group.toString());

        var result = new Array();
        for(var i =0; i< groups.size(); i++){
            result[i]=groups.get(i);
        }
        return result;
}
