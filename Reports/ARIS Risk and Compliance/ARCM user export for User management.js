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

initializeMappingsWithOptions(false);

var oOutput = Context.createOutputObject();
oOutput.DefineF("STD", "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

var incompleteUsers = [];
var nLocale = Context.getSelectedLanguage();
var g_nLoc = nLocale;
var selection = ArisData.getSelectedGroups();
if (selection.length == 0) {
    var databases = ArisData.getSelectedDatabases();
    if (databases.length != 0) {
        selection = [databases[0].RootGroup()];
    }
}
createSection(oOutput, selection);
oOutput.WriteReport();

var connectedGroups;

function createSection(p_output, p_aGroup) {
	// do not create new section if all data is empty
	if (p_aGroup.length==0)
		return    
    
    // extract all users from database:
	for (var i=0; i<p_aGroup.length; i++) {
		iteration_group(p_output, p_aGroup[i].ObjDefList(true, [Constants.OT_PERS]))
	}	
}

function iteration_group(p_output, p_aUserObjDef) {
    var licensePrivilege;
    var allUsersMaintained = true
    writeTitleRow(p_output)
    
    // check all user groups of that user for the roles
    for (var i1=0; i1<p_aUserObjDef.length; i1++) {

        aConnectedUserGroupObjDefs = p_aUserObjDef[i1].getConnectedObjs([Constants.OT_PERS_TYPE], Constants.EDGES_OUT, [Constants.CT_EXEC_5]);
        var isOperate = false;
        for (var z=0; z<aConnectedUserGroupObjDefs.length; z++) { 
            var sRoleID = getGroupRoleString(aConnectedUserGroupObjDefs[z]);
            // if the user is assigned to at least one group other than policy addressee or incident owner then the needed license is OPERATE
            if (sRoleID != "policyaddressee" && sRoleID != "incidentowner") {
                isOperate = true;
                break;
            }
        }    
        if (isOperate) {
            licensePrivilege="YRCOP";
        }
        else {
            licensePrivilege="YRCCO";
        }
        if (allAttributesMaintained(p_aUserObjDef[i1])) {
            writeData(p_output, "\"" + p_aUserObjDef[i1].Attribute(Constants.AT_LOGIN, nLocale).GetValue(true).trim() + "\"");
            writeData(p_output, ";");
            writeData(p_output, "\"" + p_aUserObjDef[i1].Attribute(Constants.AT_FIRST_NAME, nLocale).GetValue(true).trim() + "\"");
            writeData(p_output, ";");
            writeData(p_output, "\"" + p_aUserObjDef[i1].Attribute(Constants.AT_LAST_NAME, nLocale).GetValue(true).trim() + "\"");
            writeData(p_output, ";");
            writeData(p_output, "\"" + p_aUserObjDef[i1].Attribute(Constants.AT_EMAIL_ADDR, nLocale).GetValue(true).trim() + "\"");
            writeData(p_output, ";");
            writeDataEnd(p_output,licensePrivilege);
        } else {
            allUsersMaintained = false;
        }
    }
    if (!allUsersMaintained) {
        showIncompleteUsers();
    }
}

function writeTitleRow(p_output) {
    writeData(p_output, "User login")
    writeData(p_output, ";")
    writeData(p_output, "First name")
    writeData(p_output, ";")
    writeData(p_output, "Last name")
    writeData(p_output, ";")
    writeData(p_output, "E-Mail")
    writeData(p_output, ";")
    writeDataEnd(p_output,"License privilege")
}

function isARCMRole(sPossibleRoleName) {
    
    var sArisRoleName = null;
    readRoleMapping();
    if (roleMappingXMLElement != null) {
        var itemIterator = roleMappingXMLElement.getChildren("enumItem").iterator();
        while (itemIterator.hasNext()) {
            var roleItem = itemIterator.next();
            if (sPossibleRoleName.startsWith(roleItem.getAttributeValue("aris_typenum"))) {
                return true;
            }
        }
    }
    return false;
}

function isPersonTypeIncidentOwner(p_userGroupDef) {  
    return hasARCMRole(p_userGroupDef, "incidentowner");
}
function writeData(p_output, p_String) {
    p_output.OutputF(p_String, "STD");

}
function writeDataEnd(p_output, p_String) {
    p_output.OutputLnF(p_String, "STD");
}
function allAttributesMaintained(p_aUserObjDef) {    
    complete = true;
    if (p_aUserObjDef.Attribute(Constants.AT_LOGIN, nLocale).GetValue(true).isEmpty() ||
        p_aUserObjDef.Attribute(Constants.AT_LAST_NAME, nLocale).GetValue(true).isEmpty() ||
        p_aUserObjDef.Attribute(Constants.AT_FIRST_NAME, nLocale).GetValue(true).isEmpty() ||
        p_aUserObjDef.Attribute(Constants.AT_EMAIL_ADDR, nLocale).GetValue(true).isEmpty()) {
            incompleteUsers.push(p_aUserObjDef.Attribute(Constants.AT_NAME, nLocale).GetValue(true));
            complete = false;
    }
    return complete;
}
function showIncompleteUsers() {
    var messageText = "";
    for (i=0; i<incompleteUsers.length; i++) {
        messageText = messageText + " - " + incompleteUsers[i] + "\n"       
    }
    Dialogs.MsgBox(getString("TEXT_1") + messageText, Constants.MSGBOX_BTN_OK, getString("TEXT_2"))     
}

 

