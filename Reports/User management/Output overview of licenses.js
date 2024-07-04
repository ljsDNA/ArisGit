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

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed" 
 
var g_Output    = Context.createOutputObject();
var g_Locale    = 1033;
var UMC         = Context.getComponent("UMC");

var mapProductCodeToLicenses = new java.util.HashMap();
var mapProductCodeToChildCodes = new java.util.HashMap();

var g_CurrentRowName = "";
var g_CurrentSheetStartName = "";

main();

function main() {
    initializeOutput();
    startTableSheet();
    
    newTableRow();
    writeHeader(getString("REPORT_TITLE"), 7);
    newTableRow();
    writeDescription(getString("REPORT_DESCRIPTION"), 7);
    newTableRow();
    writeTableCell("");
    newTableRow();
    
    writeTableHeaderCell(getString("COLUMN_LICENSE"), 60);
    writeTableHeaderCell(getString("COLUMN_CAN_BE_ASSIGNED_TO_USER"), 30);
    writeTableHeaderCell(getString("COLUMN_LICENSES_AVAILABLE"), 30);
    writeTableHeaderCell(getString("COLUMN_LICENSES_USED"), 30);
    writeTableHeaderCell(getString("COLUMN_LICENSES_FREE"), 30);
    writeTableHeaderCell(getString("COLUMN_USER_NAME"), 30);
    writeTableHeaderCell(getString("COLUMN_EMAIL_ADDRESS"), 40);
    
    fillMaps();
    
    // sort
    var listSortedProductCodes = new java.util.ArrayList();
    listSortedProductCodes.addAll(mapProductCodeToLicenses.keySet());
    java.util.Collections.sort(listSortedProductCodes);
    
    var iter = listSortedProductCodes.iterator()
    
    var isEvenRow = true;
    
    while(iter.hasNext()) {
        var productCode = iter.next();
        if(mapProductCodeToChildCodes.containsKey(productCode)) {
            // its a parent product
            isEvenRow = !isEvenRow;
            writeProduct(productCode, false, isEvenRow);
            // now write sub-products
            for(var i = 0 ; i < mapProductCodeToChildCodes.get(productCode).size() ; i++) {
                var nextChildProduct = mapProductCodeToChildCodes.get(productCode).get(i);
                isEvenRow = !isEvenRow;
                writeProduct(nextChildProduct, true, isEvenRow);
            }
        }
    }
    endTableSheet(getIndexedSheetName(g_CurrentSheetStartName, g_CurrentRowName));
    g_Output.WriteReport();
}

function fillMaps() {
    var licenses = UMC.getAllLicenses();
    var processedProductCodes = new java.util.HashSet();
    for(var i = 0 ; i < licenses.size() ; i++) {
        // fill map product-code -> list of available licenses
        var license = licenses.get(i);
        var productCode = license.getProduct().getCode();
        if(!mapProductCodeToLicenses.containsKey(productCode)) {
            mapProductCodeToLicenses.put(productCode, new java.util.ArrayList());    
        }
        mapProductCodeToLicenses.get(productCode).add(license);
        
        if(!processedProductCodes.contains(productCode)) {
            processedProductCodes.add(productCode);
            // fill map product-code -> list of available sub product-codes
            var parentProduct = license.getProduct().getParent();
            if(parentProduct != null) {
                var parentProductCode = parentProduct.getCode();
                if(!mapProductCodeToChildCodes.containsKey(parentProductCode)) {
                    mapProductCodeToChildCodes.put(parentProductCode, new java.util.ArrayList());    
                }   
                mapProductCodeToChildCodes.get(parentProductCode).add(productCode);
            } else if(!mapProductCodeToChildCodes.containsKey(productCode)) {
                // product is a parent product itself and not yet available in the map
                mapProductCodeToChildCodes.put(productCode, new java.util.ArrayList());  
            }
        }
    }
}

function writeProduct(productCode, isChild, isEvenRow) {
    var listLicenses = mapProductCodeToLicenses.get(productCode);
            
    var total = 0;
    var used = 0;
    var free = 0;
    
    for(var i = 0 ; i < listLicenses.size() ; i++) {
        var license = listLicenses.get(i);
        total += license.getQuantity();
        used += license.getConsumedSeats();
        free += license.getFreeSeats();
    }
    
    newTableRow();
    
    var productName = listLicenses.get(0).getProduct().getName();
    
    g_CurrentRowName = productName;
    if(g_CurrentSheetStartName == "") {
        g_CurrentSheetStartName = productName;
    }
    
    if(isChild) {
        writeTableCell("    " + productName, 60, isEvenRow);
    } else {
        writeTableCell(productName, 60, isEvenRow);
    }
    
    var privilege = listLicenses.get(0).getPrivilege();
    if(privilege) {
        writeTableCell(getString("VALUE_YES"), 30, isEvenRow);
    } else {
        writeTableCell(getString("VALUE_NO"), 30, isEvenRow);
    }
    
    
    writeTableCell(total, 30, isEvenRow);
    writeTableCell(used, 30, isEvenRow);
    writeTableCell(free, 30, isEvenRow);
    
    var privilege = listLicenses.get(0).getPrivilege();
    if(privilege != null) {
        var users = UMC.getUsersForPrivilegeQualifier(privilege.getName());
        for(var j = 0 ; j < users.size() ; j++) {
            var user = users.get(j);
            if(j != 0) {
                newTableRow();
                writeTableCell("", 70, isEvenRow);
                writeTableCell("", 30, isEvenRow);
                writeTableCell("", 30, isEvenRow);
                writeTableCell("", 30, isEvenRow);
				writeTableCell("", 30, isEvenRow);
            }
            writeTableCell(user.getName(), 30, isEvenRow);
            writeTableEmailCell(user.getEmail(), 40, isEvenRow);
        }   
    }
}

function newTableRow() {
    if(!addTableRow()) {
        endTableSheet(getIndexedSheetName(g_CurrentSheetStartName, g_CurrentRowName));
        startTableSheet();
        g_CurrentSheetStartName = g_CurrentRowName;
        addTableRow();
    }
}

