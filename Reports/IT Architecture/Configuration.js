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
 * Import configuration
 * 
 * Each configuration entry contains the following settings:
 *
 *    database   - name of ARIS database to import data into
 *    url        - url of Business Publisher with enabled IT Inventory
 *    export     - name of export on BP server to import changes from
 *    secret     - shared secret between BP server and import report
 *                 (used to establish trust between the two machines;
 *                 must be identical to secret given in IT Inventory
 *                 configuration)
 *    history    - API name of the attribute to use for the change history
 */
 
var configuration = new Array();
configuration.push(
    {
        "database": "United Motor Group",
        "url": "http://localhost:19990/businesspublisher/layouts/extensions/ext02/inventoryimport.jsp",
        "export": "UMG",
        "secret": "",
        "history": "AT_CHANGE_HISTORY",
        "layouter": "DefaultLayouter",
        "itemFinder": "DefaultItemFinder",
        "postImportProcessor": ""
    }
);

var handlerMappings = new Array();
handlerMappings.push(
    {
        "candidateOperations" : "CandidateOperationHandler",
        "requestOperations" : "RequestOperationHandler",
        "mappingOperations" : "MappingOperationHandler",
        "interfaceOperations" : "InterfaceOperationHandler",
        "relevancyOperations" : "RelevancyOperationHandler"
    }
);
