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

var g_nLoc = Context.getSelectedLanguage();

var g_oSettings;

var g_iSuccessfulGroupObjDefsCount = 0;
var g_hmFailedGroupObjDefsMessages = new java.util.HashMap(); // format: ObjDef | String error message 

var g_iSuccessfulRoleObjDefsCount = 0;
var g_hmFailedRoleObjDefsMessages = new java.util.HashMap(); // format: ObjDef | String error message 

function main() {
    
    //display dialog
    g_oSettings = Dialogs.showDialog(new settingsDialog(), Constants.DIALOG_TYPE_ACTION, getString("DIALOG_TITLE"));
    if (!g_oSettings.isOk) {
        return;
    }
    
    //determine working area
    var oDatabase;
    var oStartingGroup;
    if (ArisData.getSelectedGroups().length > 0) {
        oStartingGroup = ArisData.getSelectedGroups()[0];
        oDatabase = oStartingGroup.Database();
    } else {
        oDatabase = ArisData.getSelectedDatabases()[0];
        oStartingGroup = ArisData.getSelectedDatabases()[0].RootGroup();
    }
    
    //search old role objects - case insensitive, allow wildcards
    
    var oSearchItem = oDatabase.createSearchItem(Constants.AT_NAME, g_nLoc, "*_1", Constants.SEARCH_CMP_EQUAL, false, true);
    oSearchItem = oSearchItem.or( oDatabase.createSearchItem(Constants.AT_NAME, g_nLoc, "*_2", Constants.SEARCH_CMP_EQUAL, false, true) );
    oSearchItem = oSearchItem.or( oDatabase.createSearchItem(Constants.AT_NAME, g_nLoc, "*_3", Constants.SEARCH_CMP_EQUAL, false, true) );
    var aRoleObjDefs = oStartingGroup.ObjDefList(true, Constants.OT_PERS_TYPE, oSearchItem);
    
    //migrate role objects
    for (var r=0; r<aRoleObjDefs.length; r++) {
    
        //lookup connected objects, set role type and role level there as well as attribute occurrence positions
        updateConnectedGroupObjDefs(aRoleObjDefs[r]);
        
        //handle old role object
        handleRoleObjDef(aRoleObjDefs[r]);
    }
    
    //show result dialog
    var infoDialogDefinition = new InfoDialog();
    var displayedInfoDialog = Dialogs.showDialog(infoDialogDefinition, Constants.DIALOG_TYPE_ACTION, getString("MIGRATION_RESULT"));
}


function updateConnectedGroupObjDefs(oRoleObjDef) {

    var oGroupObjDefs = new Array();
    
    try {
        var sName = oRoleObjDef.Attribute(Constants.AT_NAME, g_nLoc).getValue();
        var sRoleName = sName.substring(0, sName.length() - 2) + "";
        var sRoleLevel = sName.substring(sName.length() - 1, sName.length()) + "";
        
        //search linked ObjDefs which represent user groups
        oGroupObjDefs = oRoleObjDef.getConnectedObjs([Constants.OT_PERS_TYPE], Constants.EDGES_OUT, [Constants.CT_GENERAL_2]);
    }
    catch (e) {
        var sErrorMsg = e.toString();
        g_hmFailedRoleObjDefsMessages.put(oRoleObjDef, sErrorMsg);
    }
    
    //update user group ObjDefs
    for (var c=0; c<oGroupObjDefs.length; c++) {
        
        try {
            var oRoleTypeAttribute = oGroupObjDefs[c].Attribute(Constants.AT_ARCM_ROLE, g_nLoc);
            var oRoleLevelAttribute = oGroupObjDefs[c].Attribute(Constants.AT_ARCM_ROLE_LEVEL, g_nLoc);
    
            //set role type
            switch(sRoleName) {
                case "Audit auditor":               oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_AUDITAUDITOR);          break;
                case "Audit manager":               oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_AUDITMANAGER);          break;
                case "Audit owner":                 oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_AUDITOWNER);            break;
                case "Audit reviewer":              oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_AUDITREVIEWER);         break;
                case "Audit step owner":            oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_AUDITSTEPOWNER);        break;
                case "Control auditor":             oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_CONTROLAUDITOR);        break;
                case "Control execution owner":     oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_CONTROLEXECUTIONOWNER); break;
                case "Control manager":             oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_CONTROLMANAGER);        break;
                case "Deficiency auditor (L1)":     oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_DEFICIENCYAUDITOR_L1);  break;
                case "Deficiency auditor (L2)":     oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_DEFICIENCYAUDITOR_L2);  break;
                case "Deficiency auditor (L3)":     oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_DEFICIENCYAUDITOR_L3);  break;
                case "Deficiency manager (L1)":     oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_DEFICIENCYMANAGER_L1);  break;
                case "Deficiency manager (L2)":     oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_DEFICIENCYMANAGER_L2);  break;
                case "Deficiency manager (L3)":     oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_DEFICIENCYMANAGER_L3);  break;
                case "Hierarchy auditor":           oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_HIERARCHYAUDITOR);      break;
                case "Hierarchy manager":           oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_HIERARCHYMANAGER);      break;
                case "Hierarchy owner":             oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_HIERARCHYOWNER);        break;
                case "Incident auditor":            oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_INCIDENTAUDITOR);       break;
                case "Incident manager":            oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_INCIDENTMANAGER);       break;
                case "Incident owner":              oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_INCIDENTOWNER);         break;
                case "Incident reviewer":           oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_INCIDENTREVIEWER);      break;
                case "Interviewee":                 oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_QUESTIONNAIREOWNER);    break;
                case "Issue auditor":               oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_ISSUEAUDITOR);          break;
                case "Issue manager":               oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_ISSUEMANAGER);          break;
                case "Loss auditor":                oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_LOSSAUDITOR);           break;
                case "Loss manager":                oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_LOSSMANAGER);           break;
                case "Loss owner":                  oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_LOSSOWNER);             break;
                case "Loss reviewer":               oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_LOSSREVIEWER);          break;
                case "Policy addressee":            oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_POLICYADDRESSEE);       break;
                case "Policy approver":             oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_POLICYAPPROVER);        break;
                case "Policy auditor":              oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_POLICYAUDITOR);         break;
                case "Policy manager":              oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_POLICYMANAGER);         break;
                case "Policy owner":                oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_POLICYOWNER);           break;
                case "Risk auditor":                oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_RISKAUDITOR);           break;
                case "Risk manager":                oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_RISKMANAGER);           break;
                case "Risk owner":                  oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_RISKOWNER);             break;
                case "Risk reviewer":               oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_RISKREVIEWER);          break;
                case "Sign-off manager":            oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_SIGNOFFMANAGER);        break;
                case "Sign-off owner":              oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_SIGNOFFOWNER);          break;
                case "Sign-off reviewer":           oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_SIGNOFFREVIEWER);       break;
                case "Survey auditor":              oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_SURVEYAUDITOR);         break;
                case "Survey manager":              oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_SURVEYMANAGER);         break;
                case "Survey reviewer":             oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_SURVEYREVIEWER);        break;
                case "Test auditor":                oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_TESTAUDITOR);           break;
                case "Test auditor external":       oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_TESTAUDITOREXTERNAL);   break;
                case "Tester":                      oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_TESTER);                break;
                case "Test manager":                oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_TESTMANAGER);           break;
                case "Test reviewer":               oRoleTypeAttribute.setValue(Constants.AVT_ARCM_ROLE_TESTREVIEWER);          break;
            }
            
            //set role level
            switch(sRoleLevel) {
                case "1": oRoleLevelAttribute.setValue(Constants.AVT_ARCM_ROLE_LEVEL_CROSSCLIENT);  break;
                case "2": oRoleLevelAttribute.setValue(Constants.AVT_ARCM_ROLE_LEVEL_CLIENT);       break;
                case "3": oRoleLevelAttribute.setValue(Constants.AVT_ARCM_ROLE_LEVEL_OBJECT);       break;
            }
            
            //handle attribute occurrence positions (if set)
            if (g_oSettings.iRoleTypePosition != Constants.ATTROCC_PORT_FREE || g_oSettings.iRoleLevelPosition != Constants.ATTROCC_PORT_FREE) {
                var aGroupObjOccs = oGroupObjDefs[c].OccList();
                for (var d=0; d<aGroupObjOccs.length; d++) { 
                    var oRoleTypeAttrOcc = aGroupObjOccs[d].AttrOcc(Constants.AT_ARCM_ROLE);
                    if (oRoleTypeAttrOcc.IsValid()) {
                        if (!oRoleTypeAttrOcc.Exist()) {
                            oRoleTypeAttrOcc.Create(g_oSettings.iRoleTypePosition, null);
                        }
                        if (g_oSettings.bRoleTypePositionIncludeName) {
                            oRoleTypeAttrOcc.SetPortOptions(g_oSettings.iRoleTypePosition, Constants.ATTROCC_NAME);
                        } else {
                            oRoleTypeAttrOcc.SetPortOptions(g_oSettings.iRoleTypePosition, 0);
                        }
                    }
                    var oRoleLevelAttrOcc = aGroupObjOccs[d].AttrOcc(Constants.AT_ARCM_ROLE_LEVEL); //0 instead Constants.ATTROCC_NAME if attribute name is unwanted
                    if (oRoleLevelAttrOcc.IsValid()) {
                        if (!oRoleLevelAttrOcc.Exist()) {
                            oRoleLevelAttrOcc.Create(g_oSettings.iRoleLevelPosition, null);
                        }
                        if (g_oSettings.bRoleLevelPositionIncludeName) {
                            oRoleLevelAttrOcc.SetPortOptions(g_oSettings.iRoleLevelPosition, Constants.ATTROCC_NAME);
                        } else {
                            oRoleLevelAttrOcc.SetPortOptions(g_oSettings.iRoleLevelPosition, 0);
                        }
                    }
                }
            }
            
            g_iSuccessfulGroupObjDefsCount++;
        }
        catch (e) {
            var sErrorMsg = e.toString();
            g_hmFailedGroupObjDefsMessages.put(oGroupObjDefs[c], sErrorMsg);
        }
    }
}


function handleRoleObjDef(oRoleObjDef) {
    
    try {
        if (g_oSettings.bDelete) {
            var oGroup = oRoleObjDef.Group();
            oGroup.Delete(oRoleObjDef);
        }
        
        if (g_oSettings.bRename) {
            var oNameAttr = oRoleObjDef.Attribute(Constants.AT_NAME, g_nLoc);
            oNameAttr.setValue(g_oSettings.sPrefix + oNameAttr.GetValue(true) + g_oSettings.sSuffix);
        }
        
        g_iSuccessfulRoleObjDefsCount++;
    }
    catch (e) {
        var sErrorMsg = e.toString();
        g_hmFailedRoleObjDefsMessages.put(oRoleObjDef, sErrorMsg);
    }
}

 
//--------------------------------------------------------------------------------------------
//  Dialog handling
//--------------------------------------------------------------------------------------------

var g_sHelpID = "HID_84468220-82a9-11ec-4cd7-b02628593f84_dlg.hlp";

/*
* Automatically calculate nect row position in settings dialog.
*/
var gPosY = 0;
function nextLine(sKind) {
    gPosY += sKind;
    return gPosY;
}

const gSTART = 10;
const gRADIOBUTTON = 20;
const gINPUT = 15;
const gTEXT = 25;
const gNEXTTEXT = 15;
const gHEADER = 35;
const gSMALL = 5;
const gSAME = 0;

/*
* Dropdown box labels and values
*/
var gPositionLabels = [
        getString("POSITION_NONE"),
        getString("POSITION_TOP_LEFT"),
        getString("POSITION_TOP"),
        getString("POSITION_TOP_RIGHT"),
        getString("POSITION_LEFT"),
        getString("POSITION_RIGHT"),
        getString("POSITION_BOTTOM_LEFT"),
        getString("POSITION_BOTTOM"),
        getString("POSITION_BOTTOM_RIGHT")        
    ];
    
var gPositionValues = [
        Constants.ATTROCC_PORT_FREE,
        Constants.ATTROCC_TOPLEFT,
        Constants.ATTROCC_TOP,
        Constants.ATTROCC_TOPRIGHT,
        Constants.ATTROCC_LEFT,
        Constants.ATTROCC_RIGHT,
        Constants.ATTROCC_BOTTOMLEFT,
        Constants.ATTROCC_BOTTOM,
        Constants.ATTROCC_BOTTOMRIGHT
    ];

function settingsDialog() {
    
    var isOk = false; 
  
    // structure of the dialog page
    this.getPages = function() {
           
        var gPosY = 0;
        
        var doubleLineLableOffset = 12;
        var dlgWidth = 460;
        var dlgHeight = 200;
        var posX = 10;
        var textHeight = 16;
        var lineWidth = dlgWidth - 10;
        var optionButtonWidth = dlgWidth - 10;
        var contentWidth = dlgWidth - 16;
        var labelWidth = 110;
        var labelSpace = 15;
        var checkboxSpace = 15;
        var checkboxLabelSpace = 5;
        var comboBoxWidth = contentWidth - labelWidth - 2*labelSpace;       
        var comboTextHeight = 20;        
        var buttonWidth = 40;
        
        var iDialogTemplate = Dialogs.createNewDialogTemplate(dlgWidth, dlgHeight, "First page");
        iDialogTemplate.HelpButton(g_sHelpID);            
        
        iDialogTemplate.Text(posX, nextLine(gSTART), lineWidth, textHeight + doubleLineLableOffset, getString("HANDLE_OLD_ROLES"));
        iDialogTemplate.OptionGroup("ROLEOBJECTDECISION");
        iDialogTemplate.OptionButton(posX, nextLine(gRADIOBUTTON), optionButtonWidth, textHeight, getString("IGNORE"), "ROLEOBJECTDECISION_IGNORE");
        iDialogTemplate.OptionButton(posX, nextLine(gRADIOBUTTON), optionButtonWidth, textHeight, getString("DELETE"), "ROLEOBJECTDECISION_DELETE");
        iDialogTemplate.OptionButton(posX, nextLine(gRADIOBUTTON), optionButtonWidth, textHeight, getString("RENAME"), "ROLEOBJECTDECISION_RENAME");
        
        iDialogTemplate.Text(posX, nextLine(gTEXT + gSMALL), labelWidth, textHeight + doubleLineLableOffset, getString("PREFIX"));
        iDialogTemplate.TextBox(posX + labelWidth + labelSpace, nextLine(gSAME) - 2, comboBoxWidth, textHeight, "PREFIX", 0);
        iDialogTemplate.Text(posX, nextLine(gTEXT), labelWidth, textHeight + doubleLineLableOffset, getString("SUFFIX"));
        iDialogTemplate.TextBox(posX + labelWidth + labelSpace, nextLine(gSAME) - 2, comboBoxWidth, textHeight, "SUFFIX", 0);
        
        iDialogTemplate.Text(posX, nextLine(gHEADER), lineWidth, textHeight + doubleLineLableOffset, getString("PLACEMENTS") + ":");
        
        iDialogTemplate.Text(posX, nextLine(gTEXT), labelWidth, textHeight + doubleLineLableOffset, getString("ROLE_TYPE"));
        iDialogTemplate.ComboBox(posX + labelWidth + labelSpace, nextLine(gSAME) - 2, comboBoxWidth, textHeight, gPositionLabels, "ROLETYPE_POSITION");
        iDialogTemplate.CheckBox (posX + labelWidth + labelSpace, nextLine(gRADIOBUTTON) - 6, labelSpace, textHeight, "", "ROLETYPE_POSITION_INCLUDE_NAME", 0);
        iDialogTemplate.Text(posX + labelWidth + labelSpace + checkboxSpace, nextLine(gSAME) - 2, 130 , textHeight + doubleLineLableOffset, getString("ATTRIBUTE_NAME"));
        
        iDialogTemplate.Text(posX, nextLine(gTEXT), labelWidth, textHeight + doubleLineLableOffset, getString("ROLE_LEVEL"));
        iDialogTemplate.ComboBox(posX + labelWidth + labelSpace, nextLine(gSAME) - 2, comboBoxWidth, textHeight, gPositionLabels, "ROLELEVEL_POSITION");
        iDialogTemplate.CheckBox (posX + labelWidth + labelSpace, nextLine(gRADIOBUTTON) - 6, labelSpace, textHeight, "", "ROLELEVEL_POSITION_INCLUDE_NAME", 0);
        iDialogTemplate.Text(posX + labelWidth + labelSpace + checkboxSpace, nextLine(gSAME) - 2, 130 , textHeight + doubleLineLableOffset, getString("ATTRIBUTE_NAME"));
        
        iDialogTemplate.Text(posX, nextLine(gTEXT + gSMALL), lineWidth, textHeight + doubleLineLableOffset, "\n");
        iDialogTemplate.Text(posX, nextLine(gNEXTTEXT), lineWidth, 2 * textHeight + doubleLineLableOffset, getString("NOTE") + ":\n" + getString("NOTE_CLOSE"));
        
        return [iDialogTemplate];
    }

    // init of dialog
    this.init = function(aPages) {
        this.getDialogElement("ROLEOBJECTDECISION").setSelection(0);
        this.getDialogElement("PREFIX").setEnabled( false );
        this.getDialogElement("SUFFIX").setEnabled( false );
    }
    
    // change listener, needs to be defined only, assigned to ROLEOBJECTDECISION by naming convention
    this.ROLEOBJECTDECISION_selChanged = function(newSelection) {
        this.getDialogElement("PREFIX").setEnabled( newSelection == 2 );
        this.getDialogElement("SUFFIX").setEnabled( newSelection == 2 );
    }
    
    // result of the dialog
    this.getResult = function() {
        var result = {};
        result["isOk"] = isOk;
        result["bIgnore"] = this.getDialogElement("ROLEOBJECTDECISION").getSelectedIndex() == 0;
        result["bDelete"] = this.getDialogElement("ROLEOBJECTDECISION").getSelectedIndex() == 1;
        result["bRename"] = this.getDialogElement("ROLEOBJECTDECISION").getSelectedIndex() == 2;
        result["sPrefix"] = this.getDialogElement("PREFIX").getText();
        result["sSuffix"] = this.getDialogElement("SUFFIX").getText();
        result["iRoleTypePosition"] = gPositionValues[this.getDialogElement("ROLETYPE_POSITION").getSelectedIndex()];
        result["bRoleTypePositionIncludeName"] = this.getDialogElement("ROLETYPE_POSITION_INCLUDE_NAME").isChecked();
        result["iRoleLevelPosition"] = gPositionValues[this.getDialogElement("ROLELEVEL_POSITION").getSelectedIndex()];
        result["bRoleLevelPositionIncludeName"] = this.getDialogElement("ROLELEVEL_POSITION_INCLUDE_NAME").isChecked();
        return result;
    }
    
    // dilaog will close
    this.onClose = function(pageNumber, bOk) {
        isOk = bOk;
    }
    
    // get dialog element by id
    this.getDialogElement = function(id) {
        return this.dialog.getPage(0).getDialogElement(id);
    }
}

function InfoDialog() {
    
    // structure of the dialog page
    this.getPages = function() {
        var dlgWidth = 512;
        var dlgHeight = 200;
        var borderOffset = 10;
        
        var dialogTemplate = Dialogs.createNewDialogTemplate(dlgWidth, dlgHeight, getString("MIGRATION_RESULT"));
        dialogTemplate.TextBox (10, 10, dlgWidth - (2*borderOffset), dlgHeight - (2*borderOffset), "textContent", 1);
        dialogTemplate.HelpButton(g_sHelpID);            
        return [dialogTemplate];
    };
    
    // init of dialog
    this.init = function(aPages) {
        var sText = "";
        if (g_hmFailedGroupObjDefsMessages.size() == 0 && g_hmFailedRoleObjDefsMessages.size() == 0) {
            sText = getString("MIGRATION_RESULT_SUCCESS");
            sText += "\n\n" + getString("MIGRATION_RESULT_SUCCESS_OBJECTS") + ": " + g_iSuccessfulRoleObjDefsCount;
            sText += "\n"   + getString("MIGRATION_RESULT_SUCCESS_USERGROUPS") + ": " + g_iSuccessfulGroupObjDefsCount;
        }
        else {
            sText = getString("MIGRATION_RESULT_ERROR");
            sText += "\n" + getString("MIGRATION_RESULT_ERROR_NOTE");
            sText += "\n\n" + getString("MIGRATION_RESULT_ERROR_OBJECTS_SUCCESS") + ": " + g_iSuccessfulRoleObjDefsCount;
            if (g_hmFailedRoleObjDefsMessages.size() > 0) {
                sText += "\n" + getString("MIGRATION_RESULT_ERROR_OBJECTS_FAILED") + ": " + g_hmFailedRoleObjDefsMessages.size();
                var iter = g_hmFailedRoleObjDefsMessages.keySet().iterator();
                while (iter.hasNext()) {;
                    var oObjDef = iter.next();
                    sText += "\n" + oObjDef.Name(g_nLoc) + ": " + g_hmFailedRoleObjDefsMessages.get(oObjDef);
                }
            }
            sText += "\n\n" + getString("MIGRATION_RESULT_SUCCESS_USERGROUPS") + ": " + g_iSuccessfulGroupObjDefsCount;
            if (g_hmFailedGroupObjDefsMessages.size() > 0) {
                sText += "\n" + getString("MIGRATION_RESULT_ERROR_USERGROUPS_FAILED") + ": " + g_hmFailedGroupObjDefsMessages.length;
                var iter = g_hmFailedGroupObjDefsMessages.keySet().iterator();
                while (iter.hasNext()) {;
                    var oObjDef = iter.next();
                    sText += "\n" + oObjDef.Name(g_nLoc) + ": " + g_hmFailedGroupObjDefsMessages.get(oObjDef);
                }
            }
        }
        aPages[0].getDialogElement("textContent").setText(sText);
    }
}

main();