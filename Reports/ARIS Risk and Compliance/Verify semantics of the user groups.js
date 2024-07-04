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
        var oUsergroupExportInfoSet = getExportInfoSetByObjectMappingID("USERGROUP");
        //iterate on the user groups
        var iter = oUsergroupExportInfoSet.iterator();
        while (iter.hasNext()) {
            
            var oUsergroupExportInfo = iter.next();
            var oUsergroup = oUsergroupExportInfo.getObjDef();
            var szInnerMsg = "";
            
            szInnerMsg = addSingleValidationOutput( validateUserGroupMandatoryAttributes(oUsergroup), szInnerMsg );
            szInnerMsg = addSingleValidationOutput( validateConnectedUsersCount(oUsergroupExportInfo), szInnerMsg );
                   
            if (!szInnerMsg.equals("")){
                var szUserGroupInfo = new java.lang.String(getString("TEXT_2")).replaceFirst("%0", oUsergroup.Name(g_nLoc));
                var sCompleteSingleUserGroupOutput = addObjectValidationInfo(szUserGroupInfo, szInnerMsg, oUsergroup, SPC1);
                szOutput = addCompleteObjectValidationOutput(szOutput, sCompleteSingleUserGroupOutput);     
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

function validateUserGroupMandatoryAttributes(pUserGroup){
    var szMsg = "";
    var aMandatories = getMandatoryFieldsForUserGroup();
    return validateMandatoryObjectAttributes(pUserGroup, aMandatories, SPC1, getString("TEXT_3")); 
}

function validateConnectedUsersCount(oUsergroupExportInfo){
    var aChildExportInfoArray = getChildExportInfoArrayByLink(oUsergroupExportInfo, "groupmembers");
    return getConnectionCountValidationOutput(OCCURRENCE_MIN_USER_TO_GROUPS, OCCURRENCE_MAX_USER_TO_GROUPS, oUsergroupExportInfo, aChildExportInfoArray, getString("TEXT_5"), SPC1);      
    
}