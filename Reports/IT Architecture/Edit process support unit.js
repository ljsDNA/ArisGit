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


var g_oPsmConfig = new psmConfig(false);
var g_bIgnoreCheckBox_ToBe = g_oPsmConfig.ignoreCheckBox_ToBe();

var mainDlg;
var addDlg;
var aAllAst = new Array();

var deleteAST = false;
var saving = false;
var savingAdd = false;
var showAddDialog = false;
var showEditDialog = false;
var startNewSearch = false;

var selectedUnitDefs = getSelection();
var bMultiple = (selectedUnitDefs.length > 1);

var g_aAstData = getInitialData(selectedUnitDefs);
var g_aAstData_Backup = copyAstData(g_aAstData);        // *** Backup ***

var aUnitStatus = new Array();
aUnitStatus[0] = getString("UNITSTATUS_NULL");
aUnitStatus[1] = getString("UNITSTATUS_MANUAL");
aUnitStatus[2] = getString("UNITSTATUS_NO_PROCESSING");
aUnitStatus[3] = getString("UNITSTATUS_SYSTEM");

var g_statusIndex = getUnitStatusIndex(selectedUnitDefs);
var g_statusSystemSelected = (g_statusIndex >= 3);

createMainDialog();


/****************************************************************/

function getSelection() {
    var selectedUnitDefs = ArisData.getSelectedObjDefs();
    if (selectedUnitDefs.length == 0) {

        var selectedUnitOccs = ArisData.getSelectedObjOccs();
        for (var i = 0; i < selectedUnitOccs.length; i++) {
            selectedUnitDefs.push(selectedUnitOccs.ObjDef());
        }
    }
    return selectedUnitDefs;
}

function getInitialData(oUnitDefs) {
    var aAstData = new Array();
    
    for (var i = 0; i < oUnitDefs.length; i++) {
        var oUnitDef = oUnitDefs[i];
        
        var oCxns_Ast2Unit = oUnitDef.CxnListFilter(Constants.EDGES_IN, CXN_BELONGS2PROCUNIT);
        for (var j = 0; j < oCxns_Ast2Unit.length; j++) {
            var oCxn = oCxns_Ast2Unit[j];
            
            if (isRelevantCxn(oCxn)) {
                var oAstDef = oCxn.SourceObjDef();
                var aCxnAttributes = getCxnAttributes(oCxn);

                var nAstIndex = getAstDataIndex(oAstDef, aAstData);
                if (nAstIndex < 0) {
                    // add new ast data object
                    nAstIndex = aAstData.length;
                    aAstData[nAstIndex] = new AST_DATA(oAstDef);   
                }
                var aCxn2UnitData = aAstData[nAstIndex].aCxn2UnitData;
                
                var nUnitIndex = getCxn2UnitDataIndex(oUnitDef, aCxn2UnitData);
                if (nUnitIndex < 0) {
                    // add new cxn2unit data object
                    nUnitIndex = aCxn2UnitData.length;
                    aCxn2UnitData[nUnitIndex] = new CXN2UNIT_DATA(oUnitDef, aCxnAttributes);   
                }
            }
        }
    }
    return aAstData.sort(sortAstDataByName);    
    
    function isRelevantCxn(oCxn) {
        return oCxn.Attribute(Constants.AT_PROC_SUPPORT_STATUS, language).IsMaintained();
    }
}

//////////////////////////////////////////////////////////
//
// Dialogs
//
//////////////////////////////////////////////////////////

function createMainDialog() {
    var aAstDataNames = getAstDataNames(g_aAstData);
    
    var mainDialog = Dialogs.createNewDialogTemplate(0, 0,  605, 450, getString("EDIT_PROCESS_SUPPORT_UNIT"), "mainDlgEvntListener");
   
    // 1. Gruppe: Properties of the cell
    mainDialog.GroupBox(5, 5, 590, 120, getString("PROPERTIES_OF_THE_PSU"));
    if (bMultiple) {
        mainDialog.Text(20, 20, 550, 30, getString("SEVERAL_UNITS_EDITED"));        
    } else {
        mainDialog.Text(20, 20, 130, 15, getString("COLUMN_HEADER"));
        mainDialog.TextBox(150, 20, 400, 15, "txtbox_processname");
        mainDialog.Text(20, 40, 130, 15, getString("ROW_HEADER"));
        mainDialog.TextBox(150, 40, 400, 15, "txtbox_orgunitname");
    }
    mainDialog.Text(20, 60, 130, 15, getString("UNITSTATUS"));
    mainDialog.ComboBox(150, 60, 400, 15, aUnitStatus, "combobox_unitStatus");
    mainDialog.Text(20, 85, 130, 15, getString("PSU_COMMENT"));
    mainDialog.TextBox(150, 85, 400, 30, "txtbox_comment_PSU", 1);
    
    // 2. Gruppe: Allocations
    mainDialog.GroupBox(5, 130, 590, 330, getString("ALLOCATIONS"));
    mainDialog.ListBox(20, 140, 320, 75, aAstDataNames, "listbox_ast", 0);
    mainDialog.PushButton(400, 140, 100, 15, getString("BUTTON_ADD"), "button_add");
    mainDialog.PushButton(400, 160, 100, 15, getString("BUTTON_EDIT"), "button_edit");
    mainDialog.PushButton(400, 180, 100, 15, getString("BUTTON_DELETE"), "button_delete");
        
    // 3. Gruppe: Properties of the allocation
    mainDialog.GroupBox(20, 220, 555, 215, getString("PROPERTIES_OF_THE_ALLOCATION"));
    mainDialog.Text(35, 240, 265, 15, g_oFilter.AttrTypeName(Constants.AT_START_PLAN_PHASE_IN) + ":");
    mainDialog.DateChooser(300, 240, 250, 15, "datechooser_startplanphasein");
    mainDialog.Text(35, 260, 265, 15, g_oFilter.AttrTypeName(Constants.AT_PHASE_IN_PLAN) + ":");
    mainDialog.DateChooser(300, 260, 250, 15, "datechooser_phaseinplan");
    mainDialog.Text(35, 280, 265, 15, g_oFilter.AttrTypeName(Constants.AT_PHASE_IN_AS_IS) + ":");
    mainDialog.DateChooser(300, 280, 250, 15, "datechooser_phasein");
    mainDialog.Text(35, 300, 265, 15, g_oFilter.AttrTypeName(Constants.AT_START_PLAN_PHASE_OUT) + ":");
    mainDialog.DateChooser(300, 300, 250, 15, "datechooser_startplanphaseout");
    mainDialog.Text(35, 320, 265, 15, g_oFilter.AttrTypeName(Constants. AT_PHASE_OUT_PLAN) + ":");
    mainDialog.DateChooser(300, 320, 250, 15, "datechooser_phaseoutplan");
    mainDialog.Text(35, 340, 265, 15, g_oFilter.AttrTypeName(Constants.AT_PHASE_OUT_AS_IS) + ":");
    mainDialog.DateChooser(300, 340, 250, 15, "datechooser_phaseout");
    mainDialog.Text(35, 360, 265, 15, g_oFilter.AttrTypeName(Constants.AT_PROC_SUPPORT_STATUS) + ":");
    mainDialog.TextBox(300, 360, 250, 15, "txtbox_statusofprocesssupport");
    mainDialog.Text(35, 380, 265, 15, getString("SHORT_DESCRIPTION"));
    mainDialog.TextBox(300, 380, 250, 30, "txtbox_shortdescription", 1);
    if (bMultiple) {
        mainDialog.CheckBox(300, 415, 100, 15, getString("TO_BE"), "checkbox_tobe", 2);      // 3 state
    } else {
        mainDialog.CheckBox(300, 415, 100, 15, getString("TO_BE"), "checkbox_tobe");
    }    
    // Warning - text
    mainDialog.Text(20, 450, 565, 40, "", "txt_unitStatusMsg");     // ATTENTION: If status is changed this text may be filled with UNITSTATUS_MSG

    // Buttons am Ende: OK, Cancel und Help
    mainDialog.OKButton();
    mainDialog.CancelButton();
    mainDialog.HelpButton("HID_37a73280_0527_11dc_43b6_000fb0c4ad32_dlg_01.hlp");
    
    mainDlg = Dialogs.createUserDialog(mainDialog);
   
    
    ////////////////////////////////////////////////////////
    // Funktionalität des Dialogs
    
    if (!bMultiple) {    
        mainDlg.setDlgEnable("txtbox_processname", false);
        mainDlg.setDlgText("txtbox_processname", Context.getProperty("theFuncName"));
        
        mainDlg.setDlgEnable("txtbox_orgunitname", false);
        mainDlg.setDlgText("txtbox_orgunitname", Context.getProperty("theOrgName"));
    }  
    checkUnitStatus();

    mainDlg.setDlgText("txtbox_comment_PSU",getUnitComment(selectedUnitDefs));
    mainDlg.setDlgSelection("listbox_ast", -1);
    mainDlg.setDlgEnable("button_edit", false);
    mainDlg.setDlgEnable("button_delete", false);
    
    mainDlg.setDlgEnable("datechooser_startplanphasein", false);
    mainDlg.setDlgEnable("datechooser_phaseinplan", false);
    mainDlg.setDlgEnable("datechooser_phasein", false);
    mainDlg.setDlgEnable("datechooser_startplanphaseout", false);
    mainDlg.setDlgEnable("datechooser_phaseoutplan", false);
    mainDlg.setDlgEnable("datechooser_phaseout", false);
    mainDlg.setDlgEnable("txtbox_statusofprocesssupport", false);
    mainDlg.setDlgEnable("txtbox_shortdescription", false);
    mainDlg.setDlgEnable("checkbox_tobe", false);

    mainDlg.setDlgValue("checkbox_tobe", 0);    
    mainDlg.setDlgVisible("checkbox_tobe", !g_bIgnoreCheckBox_ToBe); // Anubis 478424
    
    var newDialog = undefined;
    
    for (;;) {
        deleteAST = false;
        saving = false;
        showAddDialog = false;
        showEditDialog = false;        
        
        newDialog = Dialogs.show(mainDlg);

        if (newDialog == 0) {
            return newDialog;
        }
        if (deleteAST) {
            deleteAstFromData();
            deleteAST = false;
            g_aAstData_Backup = copyAstData(g_aAstData);        // *** Backup ***
            
            continue;
        }
        else if (showAddDialog) {
            var oNewAstDef = createAddDialog(bMultiple);
            showAddDialog = false;
            g_aAstData_Backup = copyAstData(g_aAstData);        // *** Backup ***
            
            var nAstIndex= getAstDataIndex(oNewAstDef, g_aAstData);
            var aAstNames = getAstDataNames(g_aAstData);
            mainDlg.setDlgListBoxArray("listbox_ast", aAstNames);
            mainDlg.setDlgSelection("listbox_ast", nAstIndex);
            showASTAttributes(nAstIndex);

            continue;
        }
        else if (showEditDialog) {
            var selectedIdx = mainDlg.getDlgSelection("listbox_ast")[0];
            if (g_oPsmConfig.isValidAllocation(g_aAstData[selectedIdx].oAstDef)) {
                createEditDialog(selectedIdx, bMultiple, g_aAstData, selectedUnitDefs, g_bIgnoreCheckBox_ToBe);
                showEditDialog = false;
                g_aAstData_Backup = copyAstData(g_aAstData);        // *** Backup ***
                    
                var aAstNames = getAstDataNames(g_aAstData);
                mainDlg.setDlgListBoxArray("listbox_ast", aAstNames);
                mainDlg.setDlgSelection("listbox_ast", selectedIdx);
                showASTAttributes(selectedIdx);
            } else {
                // MsgBox in case of invalid allocation
                Dialogs.MsgBox(getString("NOT_IN_FILTER"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_INFORMATION, getString("EDIT_AST"));
            }
            continue;
        }
        else if (saving) {
            var newStatus = Constants.AVT_SYSTEM;
            var unitStatus = mainDlg.getDlgSelection("combobox_unitStatus")[0];
            var sPSUComment = mainDlg.getDlgText ("txtbox_comment_PSU")
            if (unitStatus == 0) newStatus = 0;
            if (unitStatus == 1) newStatus = Constants.AVT_MANUAL;
            if (unitStatus == 2) newStatus = Constants.AVT_NO_PROCESSING;
            if (unitStatus == 3) newStatus = Constants.AVT_SYSTEM;
            if (unitStatus == 4) newStatus = null;

            saveChanges(newStatus,sPSUComment);
            saving = false;
            break;
        }
        else {
            break;
        }
    }
}

////////////////////////////////////////////////////////

// Event-Listener
function mainDlgEvntListener(dlgItem, action, suppVal) {
    var result = true;
    
    switch (action) {
        case 1: // Dialog initialisiert
            if (g_statusIndex == 4) {
                aUnitStatus[4] = differentValues;                                   // Add "#########" to list
                mainDlg.setDlgListBoxArray("combobox_unitStatus", aUnitStatus);
            }
            mainDlg.setDlgSelection("combobox_unitStatus", g_statusIndex);
            checkUnitStatus();                                                      // BLUE-6243

            if (mainDlg.getDlgListBoxArray("listbox_ast").length > 0) {
                mainDlg.setDlgSelection("listbox_ast", 0);
                showASTAttributes(0);
            }
            result = false;
        break;
        
        case 2: 
        // CheckBox, DropListBox, ListBox or OptionGroup: The value of the dialog item has changed. SuppValue contains the new value.
        // CancelButton, OKButton or PushButton: The button has been pressed. SuppValue has no meaning. The return value true prevents the dialog from being closed.   
        if (dlgItem == "OK") {
            saving = true;
            result = false;
        }
        else if (dlgItem == "Cancel") {
            result = false;
        }
        else if (dlgItem == "button_delete") {
            result = false;
            deleteAST = true;
        }
        else if (dlgItem == "button_add") {
            result = false;
            showAddDialog = true;
        }
        else if (dlgItem == "button_edit") {
            result = false;
            showEditDialog = true;
        }
        else if (dlgItem == "listbox_ast") {
            result = false;
            showASTAttributes(suppVal);
        }
        else if (dlgItem == "combobox_unitStatus") {
            g_statusIndex = suppVal;
            if (g_statusIndex < 4 && aUnitStatus.length > 3) {
                aUnitStatus.splice(4,1);                                        // Remove "#########" from list
                mainDlg.setDlgListBoxArray("combobox_unitStatus", aUnitStatus);
                mainDlg.setDlgSelection("combobox_unitStatus", g_statusIndex);
            }

            // Show text: UNITSTATUS_MSG
            var sUnitStatusMsg = "";
            if (g_statusIndex >= 3) {
                g_statusSystemSelected = true;
            } else {
                if (g_statusSystemSelected) sUnitStatusMsg = getString("UNITSTATUS_MSG");
            }
            mainDlg.setDlgText("txt_unitStatusMsg", sUnitStatusMsg);
            
            result = false;
            toggleUnitStatus();
            checkUnitStatus();
        }
        break;
        
        case 3: // ComboBox or TextBox: The text for the dialog item has been changed and the item is losing focus. SuppValue contains the length of the text.  
            result = false;
        break;
    }
    return result;
}

///////////////////////////////////////////////////
// Add-Dialog



function createAddDialog(bMultiple) {
    var statusArray = getStatusArray(false);  // Always without 'differentValues' !

    var aAllAstNames = new Array();
    
    var addDialog = Dialogs.createNewDialogTemplate(0, 0,  575, 450, getString("ADD_ALLOCATION"), "addDlgEvntListener");
    
    // 1. Gruppe: Properties of the cell
    addDialog.GroupBox(5, 5, 570, 60, getString("PROPERTIES_OF_THE_PSU"));
    if (bMultiple) {
        addDialog.Text(20, 20, 550, 70, getString("SEVERAL_UNITS_EDITED"));
    } else {
        addDialog.Text(20, 20, 230, 15, getString("COLUMN_HEADER"));
        addDialog.TextBox(250, 20, 280, 15, "txtbox_processname");
        addDialog.Text(20, 40, 230, 15, getString("ROW_HEADER"));
        addDialog.TextBox(250, 40, 280, 15, "txtbox_orgunitname");
    }
    
    // 2. Gruppe: Allocations
    addDialog.GroupBox(5, 70, 570, 405, getString("ALLOCATIONS"));
    
    //Dummy for object type selection    
    addDialog.Text(20, 85, 120, 15, getString("ALLOCATION_TYPE"));
    addDialog.ComboBox(150, 85, 290, 15, g_oPsmConfig.getAObjectTypeListNames() , "combobox_AllocationType");
    //
    addDialog.Text(20, 110, 120, 15, getString("ALLOCATION_NAME"));
    addDialog.TextBox(150, 110, 290, 15, "txtbox_search");
    addDialog.PushButton(465, 110, 100, 15, getString("BUTTON_SEARCH"), "button_search");
    addDialog.Text(20, 130, 220, 15, getString("ALLOCATIONS_FOUND"));
    addDialog.ListBox(20, 145, 545, 95, aAllAstNames, "listbox_ast");
    
    // 3. Gruppe: Properties of the allocation
    addDialog.GroupBox(20, 245, 545, 205, getString("PROPERTIES_OF_THE_ALLOCATION"));
    addDialog.Text(35, 260, 265, 15, g_oFilter.AttrTypeName(Constants.AT_START_PLAN_PHASE_IN) + ":");
    addDialog.DateChooser(300, 260, 250, 15, "datechooser_startplanphasein");
    addDialog.Text(35, 280, 265, 15, g_oFilter.AttrTypeName(Constants.AT_PHASE_IN_PLAN) + ":");
    addDialog.DateChooser(300, 280, 250, 15, "datechooser_phaseinplan");
    addDialog.Text(35, 300, 265, 15, g_oFilter.AttrTypeName(Constants.AT_PHASE_IN_AS_IS) + ":");
    addDialog.DateChooser(300, 300, 250, 15, "datechooser_phasein");
    addDialog.Text(35, 320, 265, 15, g_oFilter.AttrTypeName(Constants.AT_START_PLAN_PHASE_OUT) + ":");
    addDialog.DateChooser(300, 320, 250, 15, "datechooser_startplanphaseout");
    addDialog.Text(35, 340, 265, 15, g_oFilter.AttrTypeName(Constants.AT_PHASE_OUT_PLAN) + ":");
    addDialog.DateChooser(300, 340, 250, 15, "datechooser_phaseoutplan");
    addDialog.Text(35, 360, 265, 15, g_oFilter.AttrTypeName(Constants.AT_PHASE_OUT_AS_IS) + ":");
    addDialog.DateChooser(300, 360, 250, 15, "datechooser_phaseout");
    addDialog.Text(35, 380, 265, 15, g_oFilter.AttrTypeName(Constants.AT_PROC_SUPPORT_STATUS) + ":");
    addDialog.ComboBox(300, 380,250, 15, statusArray, "combo_statusofprocesssupport");
    //addDialog.TextBox(300, 380,250, 15, "txtbox_statusofprocesssupport");
    addDialog.Text(35, 405, 265, 15, getString("SHORT_DESCRIPTION"));
    addDialog.TextBox(300, 405, 250, 30, "txtbox_shortdescription", 1);
    addDialog.CheckBox(35, 420, 200, 15, getString("TO_BE"), "checkbox_tobe");
    
    // Buttons am Ende: OK, Cancel und Help
    addDialog.OKButton();
    addDialog.CancelButton();
    addDialog.HelpButton("HID_37a73280_0527_11dc_43b6_000fb0c4ad32_dlg_02.hlp");
   
    
    addDlg = Dialogs.createUserDialog(addDialog);
    
    
    ////////////////////////////////////////////////////////
    // Funktionalität des Dialogs
    
    if (!bMultiple) {
        addDlg.setDlgEnable("txtbox_processname", false);
        addDlg.setDlgText("txtbox_processname", Context.getProperty("theFuncName"));
        
        addDlg.setDlgEnable("txtbox_orgunitname", false);
        addDlg.setDlgText("txtbox_orgunitname", Context.getProperty("theOrgName"));
    }
    
    addDlg.setDlgSelection("listbox_ast", 0);
    addDlg.setDlgSelection("combobox_AllocationType", 0);
    addDlg.setDlgSelection("combo_statusofprocesssupport", 2);
    
    addDlg.setDlgVisible("checkbox_tobe", !g_bIgnoreCheckBox_ToBe); // Anubis 478424
    //addDlg.setDlgEnable("txtbox_statusofprocesssupport", false);
    addDlg.setDlgEnable("OK", false);
    addDlg.setDlgFocus("button_search");

    var newAddDialog = undefined;
    var oNewAstDef = null;
    
    for (;;) {
                
        newAddDialog = Dialogs.show(addDlg);
        
        if (newAddDialog == 0) {
            return null;
        }
        if (startNewSearch) {
            var iOT = g_oPsmConfig.getAObjectTypeList()[addDlg.getDlgSelection("combobox_AllocationType")[0]];
            aAllAst = getAstList(addDlg.getDlgText("txtbox_search"),iOT);
            var aAllAstNames = getAstListNames(aAllAst);
            addDlg.setDlgListBoxArray("listbox_ast", aAllAstNames);
            if (aAllAstNames.length > 0) {
                addDlg.setDlgEnable("OK", true);
                addDlg.setDlgFocus("button_search");
            }
            else {
                addDlg.setDlgEnable("OK", false);
                addDlg.setDlgFocus("button_search");
            }
            startNewSearch = false;
            continue;
        }
        else if (savingAdd) {
            if (!checkDate(addDlg, false)) {
                // Alertmeldung und abbruch
                Dialogs.MsgBox(getString("DATEERROR"));
                savingAdd = false;
                continue;
            }
            else if (!checkPlausibility(addDlg, false)) {
                Dialogs.MsgBox(getString("PLAUSIBILITY_ERROR"));
                savingAdd = false;
                continue;
            }
            else {
                oNewAstDef = saveAddedAst(addDlg, statusArray);
                savingAdd = false;
                break;
            }
            
        }
        else {
            break;
        }
    }
    return oNewAstDef;
}

////////////////////////////////////////////////////////
// Event-Listener Add-Dialog
function addDlgEvntListener(dlgItem, action, suppVal) {
    var result = true;
    
    switch (action) {
        case 1: // Dialog initialisiert
            result = false;
        break;
        
        case 2: 
        // CheckBox, DropListBox, ListBox or OptionGroup: The value of the dialog item has changed. SuppValue contains the new value.
        // CancelButton, OKButton or PushButton: The button has been pressed. SuppValue has no meaning. The return value true prevents the dialog from being closed.   
        if (dlgItem == "OK") {
            savingAdd = true;
            result = false;
        }
        else if (dlgItem == "Cancel") {
            result = false;
        }
        else if (dlgItem == "button_search") {
            result = false;
            startNewSearch = true;
        }
        else if (dlgItem == "listbox_ast") {
            result = false;
            if (selectedUnitDefs.length == 1) {
                showConnectionAttributes(suppVal);
            }
        }
        break;
        
        
        case 3: // ComboBox or TextBox: The text for the dialog item has been changed and the item is losing focus. SuppValue contains the length of the text.  
            result = false;
        break;
    }
    return result;
}

function getUnitStatusIndex(oUnitDefs) {
    var nIndex = null;
    for (var i = 0; i < oUnitDefs.length; i++) {
        var oUnitDef = oUnitDefs[i];
        var oAttr = oUnitDef.Attribute(Constants.AT_PROCESSING_TYPE, language);
        var nIndexTmp = mapUnitStatus(oAttr);
        if (nIndex != null) {
            if (nIndex != nIndexTmp) return 4;   // differentValues
        }
        nIndex = nIndexTmp;
    }
    return nIndex;
    
    function mapUnitStatus(oAttr) {
        if (oAttr.IsMaintained()) {
            var nMeasureUnitTypeNum = oAttr.MeasureUnitTypeNum();
            if (nMeasureUnitTypeNum == Constants.AVT_MANUAL) return 1;
            if (nMeasureUnitTypeNum == Constants.AVT_NO_PROCESSING) return 2;        
            if (nMeasureUnitTypeNum == Constants.AVT_SYSTEM) return 3;        
        }
        return 0;
    }
}

function getUnitComment(oUnitDefs) {
    var sPSUComment="";
    for (var i = 0; i < oUnitDefs.length; i++) {
        var oUnitDef = oUnitDefs[i];
        var oAttr = oUnitDef.Attribute(Constants.AT_REM, language);
        if (i==0) sPSUComment = oAttr.getValue();
        else if (!sPSUComment.equals(oAttr.getValue())) sPSUComment = differentValues;
    }
    return sPSUComment;
}

function toggleUnitStatus() {
    if (mainDlg.getDlgSelection("combobox_unitStatus")[0] < 3) {
        // Delete all ast data
        g_aAstData = new Array(); 
    }
    else if (mainDlg.getDlgSelection("combobox_unitStatus")[0] == 3) {      // = System
        // Restore Backup
        g_aAstData = copyAstData(g_aAstData_Backup);
    }
    var aAstNames = getAstDataNames(g_aAstData);
    mainDlg.setDlgListBoxArray("listbox_ast", aAstNames);
}

function checkUnitStatus() {
    if (mainDlg.getDlgSelection("combobox_unitStatus")[0] == 3) {      // = System
        mainDlg.setDlgEnable("listbox_ast", true);
        mainDlg.setDlgEnable("button_add", true);
    } else {
        mainDlg.setDlgEnable("listbox_ast", false);
        mainDlg.setDlgEnable("button_add", false);
        mainDlg.setDlgEnable("button_edit", false);
        mainDlg.setDlgEnable("button_delete", false);
    }    
}

function showASTAttributes(nAstIndex) {
    var aCxnAttributesToShow = new Array();
    var bEnable = (nAstIndex >= 0);    
    
    if (nAstIndex >= 0) {
        var aCxn2UnitData = g_aAstData[nAstIndex].aCxn2UnitData;
        for (var i = 0; i < aCxn2UnitData.length; i++) {
    
            var aCxnAttributes = aCxn2UnitData[i].aCxnAttributes;
            for (var j = 0; j < aCxnAttributes.length; j++) {
                if (aCxnAttributesToShow[j] == null) {
                    aCxnAttributesToShow[j] = aCxnAttributes[j];
                } else if (compareString(aCxnAttributesToShow[j], aCxnAttributes[j]) != 0) {
                    aCxnAttributesToShow[j] = differentValues;
                }
            }
        }
    }
    setDialogAttributes(mainDlg, aCxnAttributesToShow, null);
    mainDlg.setDlgEnable("button_edit", bEnable);
    mainDlg.setDlgEnable("button_delete", bEnable);
}

function deleteAstFromData() {
    var selectedIndex = mainDlg.getDlgSelection("listbox_ast");
    if (selectedIndex != null && selectedIndex[0] >= 0) {
        g_aAstData.splice(selectedIndex[0], 1);
        aAstNames = getAstDataNames(g_aAstData);
        mainDlg.setDlgListBoxArray("listbox_ast", aAstNames);
        mainDlg.setDlgSelection("listbox_ast", -1);
        showASTAttributes(-1);
    }
}

function getAstList(p_sSearch, p_iObjectType) {
    p_sSearch = p_sSearch + "*";
    //var oStopWatch = new stopWatch("Bebauungseinheiten bearbeiten");
    var allAstList = ArisData.getActiveDatabase().Find(Constants.SEARCH_OBJDEF, p_iObjectType, Constants.AT_NAME, language, p_sSearch, Constants.SEARCH_CMP_WILDCARDS);
    if (oStopWatch) oStopWatch.stopOver("Find");
    var filteredAstList = new Array();
    for (var i = 0; i < allAstList.length; i++) {
        var oAstDef = allAstList[i];
        if (g_oPsmConfig.isValidAllocation(oAstDef)) {
            filteredAstList.push(oAstDef);
        }
    }
    allAstList = filteredAstList.sort(SortByNameReport);    
    if (oStopWatch) oStopWatch.end("Filter & Sort");
    var aAstList = new Array();
    for (var i = 0; i < allAstList.length; i++) {
        var oAstDef = allAstList[i];
        if (getAstDataIndex(oAstDef, g_aAstData) < 0) {
            aAstList.push(oAstDef);
        }
    }
    return aAstList;    
}        

function getAstListNames(aAstList) {
    var aAstNames = new Array();
    for (var i = 0; i < aAstList.length; i++) {
        aAstNames[i] = aAstList[i].Name(language, true) + " (" + aAstList[i].Group().Path(language) + ")";
    }
    return aAstNames;
}

function showConnectionAttributes(idx) {  
    var bIndex = (idx >= 0); 
    var allocation2Add = null;

    if (bIndex) {
        var outgoingCxnDefs = aAllAst[idx].CxnListFilter(Constants.EDGES_OUT, CXN_BELONGS2PROCUNIT);
        for (var i=0; i<outgoingCxnDefs.length; i++) {
        if (outgoingCxnDefs[i].TargetObjDef().IsEqual(selectedUnitDefs[0])) {
                allocation2Add = outgoingCxnDefs[i];
            }
        }
    }
    setDialogAttributes(addDlg, getCxnAttributes(allocation2Add), null);
    addDlg.setDlgEnable("OK", bIndex);
}

function saveAddedAst(dlg, statusArray) {
    var newAstAttributes = getDialogAttributes(dlg, statusArray);
    
    var selectedIdx = dlg.getDlgSelection("listbox_ast");
    var oNewAstDef = aAllAst[selectedIdx[0]];
    
    newAstAttributes = checkProcessSupportStatus2(newAstAttributes);
    
    var nAstIndex = g_aAstData.length;
    g_aAstData[nAstIndex] = new AST_DATA(oNewAstDef);   

    var aCxn2UnitData = g_aAstData[nAstIndex].aCxn2UnitData;
    
    for (var i = 0; i < selectedUnitDefs.length; i++) {
        aCxn2UnitData.push(new CXN2UNIT_DATA(selectedUnitDefs[i], newAstAttributes));
    }
    g_aAstData = g_aAstData.sort(sortAstDataByName);
    
    return oNewAstDef;
}

function saveChanges(newStatus,p_sPSUComment) {
    var dataString = "";
    for (var i = 0; i < selectedUnitDefs.length; i++) {
        var oUnitDef = selectedUnitDefs[i];

        dataString += oUnitDef.GUID();
        dataString+="::";
        
        dataString += getNewStatus(newStatus, oUnitDef);
        dataString+="::";
        
        dataString += p_sPSUComment;
        
        dataString += "||";
        
        for (var j = 0; j < g_aAstData.length; j++) {
            if (!g_oPsmConfig.isValidAllocation(g_aAstData[j].oAstDef))  continue;   // remove invalid allocations

            var aCxn2UnitData = g_aAstData[j].aCxn2UnitData;
            for (var k = 0; k < aCxn2UnitData.length; k++) {
                if (aCxn2UnitData[k].oUnitDef.equals(oUnitDef)) {
                    
                    dataString += g_aAstData[j].oAstDef.GUID();
                    dataString += "::";
                    
                    var aCxnAttributes = aCxn2UnitData[k].aCxnAttributes;
                    aCxnAttributes[6] = convertAttrText2Value(aCxnAttributes[6], Constants.AT_PROC_SUPPORT_STATUS);
                    
                    for (var m = 0; m < aCxnAttributes.length; m++) {
                        
                        dataString += aCxnAttributes[m];
                        dataString += ";;";                             // Trennung der Attribute voneinander
                    }
                    dataString += "##";                                 // Trennung der Zuordnungen voneinander
                }
            }
        }
        dataString += "#unit#";
    }
    
    var myProps = new Packages.java.util.Properties();
    myProps.put("dataString", dataString);
    
    var myOutput = new Packages.java.io.ByteArrayOutputStream();
    myProps.store(myOutput, "whatever");
    
    Context.setPropertyBytes("dataProp", myOutput.toByteArray());
    
    function getNewStatus(newStatus, oUnitDef) {
        // checks 'newStatus' - if newStatus == null (== differentValues) it is read again from attribute
        if (newStatus != null) return newStatus;
        
        var oAttr = oUnitDef.Attribute(Constants.AT_PROCESSING_TYPE, language);
        if (oAttr.IsMaintained()) {
            return oAttr.MeasureUnitTypeNum();
        }
        return 0;
    }
}

function getAstDataNames(aAstData) {
    var aAstNames = new Array();
    for (var i = 0; i < aAstData.length; i++) {
        var sAstName = aAstData[i].oAstDef.Name(language, true);
        if (aAstData[i].aCxn2UnitData.length < selectedUnitDefs.length) {
            sAstName = sAstName + " *";
        }
        aAstNames[i] = sAstName;
    }
    return aAstNames;
}

function getAstDataIndex(oAstDef, aAstData) {
    if (oAstDef != null) {
        for (var i = 0; i < aAstData.length; i++) {
            if (aAstData[i].oAstDef.IsEqual(oAstDef)) return i;
        }
    }
    return -1;
}

function copyAstData(aAstData_Src) {
    var aAstData_Copy = new Array();
    
    for (var i = 0; i < aAstData_Src.length; i++) {
        var oAstDef_Src = aAstData_Src[i].oAstDef;
        var aCxn2UnitData_Src = aAstData_Src[i].aCxn2UnitData;
        
        aAstData_Copy[i] = new AST_DATA(oAstDef_Src);   
        for (var j = 0; j < aCxn2UnitData_Src.length; j++) {
            var oUnitDef_Src = aCxn2UnitData_Src[j].oUnitDef;
            var aCxnAttributes_Src = aCxn2UnitData_Src[j].aCxnAttributes;
            
            aAstData_Copy[i].aCxn2UnitData[j] = new CXN2UNIT_DATA(oUnitDef_Src, aCxnAttributes_Src)
        }
    }
    return aAstData_Copy;
}
