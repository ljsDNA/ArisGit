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

/*************************************************************************************************
						 --- Copyright (c) Software AG. All Rights Reserved. ---
*************************************************************************************************/

var OUTPUTFILENAME = Context.getSelectedFile();

var g_nLoc = Context.getSelectedLanguage(); 
             
try {           
    main();
}
catch(ex) {
    Context.setProperty("exception", ex.fileName + ":" + ex.lineNumber + ": " + ex);
}

function main() {
    
    var szOutput = "";

    //ensure bottom up skip before calling startClassification()
    g_bSkipBottomUpRecursion = true;
    
    initMappingAndStartClassification();
    
    //in case of mapping errors no sub report execution can be done; output the mapping errors instead
    if (g_aMappingInitMessages.length > 0) {
        szOutput = g_aMappingInitMessages.join("\n");
    }
    //do the checks
    else {
        
        var oUserExportInfoSet = getExportInfoSetByObjectMappingID("USER");
        //iterate on the users
        var iter = oUserExportInfoSet.iterator();
        while (iter.hasNext()) {
            
            var oUserExportInfo = iter.next();
            var oUser = oUserExportInfo.getObjDef();
            var szInnerMsg = "";
            
            szInnerMsg = addSingleValidationOutput( validateUserMandatoryAttributes(oUser), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedGroupsCount(oUserExportInfo), szInnerMsg );
    
            if (!szInnerMsg.equals("")){
                var szUserInfo = new java.lang.String(getString("TEXT_2")).replace("%0", oUser.Name(g_nLoc));
                var sCompleteSingleUserOutput = addObjectValidationInfo(szUserInfo, szInnerMsg, oUser, SPC1);
                szOutput = addCompleteObjectValidationOutput(szOutput, sCompleteSingleUserOutput);  
            }
        }
        
    }    
    
    if (szOutput.equals("")) {szOutput = NO_ERROR_FOUND;}
    szOutput = addOutputHeader(szOutput, getString("TEXT_1"));
    
    //combined execution by superior report
    if (Context.getProperty("combined_check") != null) {
        Context.setProperty("reportdata", szOutput);
    }
    //stand-alone execution
    else {
        writeErrorreport(szOutput, OUTPUTFILENAME);
    }
       
}

//------------------------------------------------------------------------------------
//----------------------------- Validate functions -----------------------------------

function validateUserMandatoryAttributes(pUser){
    var szMsg = "";
    var aMandatories = getMandatoryFieldsForUser();
    szMsg = validateMandatoryObjectAttributes(pUser, aMandatories, SPC1, getString("TEXT_3"));
    //check the user name
    if (!validateUserName(pUser)) {
        szMsg = szMsg + "\r\n\n" + SPC1 + getString("TEXT_5");    
    }
    
    return szMsg; 
}

/*
 * validates letter figure combination
 */
function validateUserName(pUser) {
    strName = pUser.Name(g_nLoc);
    result = strName.match("[^\u0021-\u002c\u002f\u003A-\u0040\u005B-\u005E\^Â°Â§Â´`Â²Â³{}\\~Âµ|?\t\n\r]*" );
    if (strName.length() == result.join().length ){
       return true; 
    }
    return false;
}


function validateConnectedGroupsCount(pUserExportInfo){
    var aParentExportInfoArray = getParentExportInfoArrayByLink(pUserExportInfo, "groupmembers", "USERGROUP");
    return getConnectionCountValidationOutput(OCCURRENCE_MIN_USER_TO_GROUPS, OCCURRENCE_MAX_USER_TO_GROUPS, pUserExportInfo, aParentExportInfoArray, getString("TEXT_4"), SPC1);
}

