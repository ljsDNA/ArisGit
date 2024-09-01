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

var g_CurrentRowName = "";
var g_CurrentSheetStartName = "";

main();

function main() {
    initializeOutput();
    startTableSheet();
    
    newTableRow();
    writeHeader(getString("REPORT_TITLE"), 3);
    newTableRow();
    writeDescription(getString("REPORT_DESCRIPTION"), 3);
    newTableRow();
    writeTableCell("");
    newTableRow();
    
    writeTableHeaderCell(getString("COLUMN_USER_NAME"), 30);
    writeTableHeaderCell(getString("COLUMN_EMAIL_ADDRESS"), 50);
    writeTableHeaderCell(getString("COLUMN_SESSION_AGE"), 50);
    
    var countUsersWithActiveSessions = 0;
    var isEvenRow;
    
    var selectedUserNames = getSelectionList();
    
    var users = UMC.getAllUsers();
    for(var i = 0 ; i < users.size() ; i++) {
        var user = users.get(i);
        var username = user.getName();
        
        if(!selectedUserNames.isEmpty() && !selectedUserNames.contains(username)) {
            continue;
        }
        
        var email = user.getEmail();
        var sessions = UMC.getSessionsForUser(user);
        
        if(sessions.size() > 0) {
            
            g_CurrentRowName = username;
            if(g_CurrentSheetStartName == "") {
                g_CurrentSheetStartName = username;
            }
            
            isEvenRow = !isEvenRow;
            countUsersWithActiveSessions++;
            newTableRow();
            writeTableCell(username, 30, isEvenRow);
            writeTableEmailCell(email, 50, isEvenRow);
            for(var j = 0 ; j < sessions.size() ; j++) {
                if(j != 0) {
                    newTableRow();
                    writeTableCell("", 30, isEvenRow);
                    writeTableCell("", 50, isEvenRow);
                }
                writeTableCell(sessions.get(j).getCreated(), 50, isEvenRow);    
            }   
        }
    }
    newTableRow();
    writeTableFooterCell(getString("TOTAL_NUMBER_OF_ACTIVE_USERS") + " " + countUsersWithActiveSessions , 3);
    
    endTableSheet(getIndexedSheetName(g_CurrentSheetStartName, g_CurrentRowName));
    
    g_Output.WriteReport();
}

function newTableRow() {
    if(!addTableRow()) {
        endTableSheet(getIndexedSheetName(g_CurrentSheetStartName, g_CurrentRowName));
        startTableSheet();
        g_CurrentSheetStartName = g_CurrentRowName;
        addTableRow();
    }
}
