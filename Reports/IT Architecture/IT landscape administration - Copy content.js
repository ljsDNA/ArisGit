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


var language = Context.getSelectedLanguage();

var selection = ArisData.getSelectedObjDefs().sort(SortByNameReport);

var saving = false;
var theObjectNameArray;
var theGroupNameArray;

if (selection.length > 0) { // Es wurden Objekte erfolgreich übergeben
    var selectedMasterObject = startMasterSlaveDialog();
    if (selectedMasterObject != null) {
        var oRelevantModels = getRelevantModels(selectedMasterObject);
        var sRelevantModels = "";
        for (var i = 0; i < oRelevantModels.length; i++) {
            sRelevantModels += oRelevantModels[i].GUID() + ";"
        }
        Context.setProperty("modelGUIDs", sRelevantModels);
    }
}

function getRelevantModels(selectedMasterObject) {
    var setRelevantModels = new java.util.HashSet();
    
    var oOccList = selectedMasterObject.OccList(); 
    for (var i = 0; i < oOccList.length; i++) {
        var oModel = oOccList[i].Model();
        if (oModel.TypeNum() == Constants.MT_SYS_LAY_OUT_PLAN) setRelevantModels.add(oModel);
    }
    return setRelevantModels.toArray();
}

function startMasterSlaveDialog(isMergeDialog) {
    theObjectNameArray = new Array();
    theGroupNameArray = new Array();
    theConflictArray = new Array();
    theConflictArray.push(getString("CONFLICT_1"));
    theConflictArray.push(getString("CONFLICT_2"));
    
    for (var i=0; i<selection.length; i++) {
        theObjectNameArray.push(selection[i].Name(language, true));
        theGroupNameArray.push(selection[i].Group().Path(language));
    }

    var masterSlaveDialog = Dialogs.createNewDialogTemplate(0, 0,  540, 200, getString("DIALOG_TITLE"), "masterSlaveDlgEvntListener");
    // Gruppe Funktionen
    masterSlaveDialog.GroupBox(5, 5, 530, 140, getString("HEADER_OBJECTS"));
    masterSlaveDialog.Text(20, 20, 500, 15, getString("SELECT_SOURCE_OBJECT"));
    masterSlaveDialog.ListBox(20, 40, 500, 60, theObjectNameArray, "object_listbox");
    masterSlaveDialog.Text(20, 112, 110, 15, getString("GROUPNAME"));
    masterSlaveDialog.TextBox(130, 105, 390, 30, "textbox_groupname",1);
    
    masterSlaveDialog.GroupBox(5, 150, 530, 40, getString("CONFLICT_MANAGEMENT"));
    masterSlaveDialog.Text(20, 165, 180, 15, getString("PROCESS_SUPPORT_INFORMATION"));
    masterSlaveDialog.ComboBox(200, 165, 320, 15, theConflictArray, "combobox_conflictmanagement");

    masterSlaveDialog.CheckBox(7, 195, 530, 15, getString("DELETE_COLUMN"), "checkbox_deletecolumn");
    
    // Buttons am Ende: next, Cancel und Help
    masterSlaveDialog.OKButton();
    masterSlaveDialog.CancelButton();
//    masterSlaveDialog.HelpButton("HID_d80cba20_b9ee_11dc_5703_8755b17cb3ff_dlg_01.hlp");
    
    masterSlaveDlg = Dialogs.createUserDialog(masterSlaveDialog);  
    
    ////////////////////////////////////////////////////////
    // Funktionalität des Dialogs
    masterSlaveDlg.setDlgSelection("object_listbox", 0);
    masterSlaveDlg.setDlgEnable("textbox_groupname", false);
    showGroup(0);

    newDialog = Dialogs.show(masterSlaveDlg);
    if (newDialog == 0) return null;

    if (saving) {
        return saveSettings();
    }
}


function masterSlaveDlgEvntListener(dlgItem, action, suppVal) {
    var result = true;
    
    switch (action) {
        case 1: // Dialog initialisiert
            result = false;
            break;
        
        case 2: 
            // CheckBox, DropListBox, ListBox or OptionGroup: The value of the dialog item has changed. SuppValue contains the new value.
            // CancelButton, OKButton or PushButton: The button has been pressed. SuppValue has no meaning. The return value true prevents the dialog from being closed.   
            if (dlgItem == "Cancel") {
                result = false;
            }
            else if (dlgItem == "OK") {
                saving = true
                result = false;
                
            }
            else if (dlgItem == "object_listbox") {
                result = false;
                showGroup(suppVal);
            }
            break;
        
        case 3: // ComboBox or TextBox: The text for the dialog item has been changed and the item is losing focus. SuppValue contains the length of the text.  
            result = false;
            break;
    }
    return result;
}

function saveSettings() {
    var selectedMasterObject = selection[masterSlaveDlg.getDlgSelection("object_listbox")[0]];
    var deleteColumn = getValueAsBoolString(masterSlaveDlg.getDlgValue("checkbox_deletecolumn"), 1);
    var sourceOverwritesTarget = getValueAsBoolString(masterSlaveDlg.getDlgSelection("combobox_conflictmanagement")[0], 0);
    
    Context.setProperty("sourceObjectGUID", selectedMasterObject.GUID());
    Context.setProperty("deleteColumn", deleteColumn);
    Context.setProperty("sourceOverwritesTarget", sourceOverwritesTarget);

    function getValueAsBoolString(nValue, nTrueReference) {
        if (nValue == nTrueReference) return "True";
        return "False";
    }
    return selectedMasterObject;
}

function showGroup(idx) {
    masterSlaveDlg.setDlgText("textbox_groupname", theGroupNameArray[idx]);
}
