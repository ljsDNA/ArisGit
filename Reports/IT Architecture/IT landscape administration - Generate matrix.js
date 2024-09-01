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

////////////////////////////////////////////////////////
// 
// Report zum Bearbeiten einer Process Support Unit
//
////////////////////////////////////////////////////////

////////////////////////////////////////////////////////
// allgemeine Variablen

var language = Context.getSelectedLanguage();
var theSortedOIDs = Context.getProperty("theSortedOIDs");

var theFunctionArray = new Array();

var modelsSelected = true;
var theSelectedFunctionsMap = new Packages.java.util.HashMap();
var theSelectedFunctionNames = new Array();
var theModelArray = new Array();
var theModelNameArray = new Array(); 
var theFunctionNameArray = new Array();

var theLocationArray = new Array();
var theLocationNameArray = new Array();
var theLocationArray_2 = new Array();
var theLocationNameArray_2 = new Array();
var g_nSorting = 0;

var theFunctionsToUse = new Array();
var theLocationsToUse = new Array();
var theChosenOrgModel;

var checkLocations;

var height_row = 15;

var selection = ArisData.getSelectedModels();

if (selection == "") {
    selection = ArisData.getSelectedObjDefs().sort(SortByNameReport);
    modelsSelected = false;
}

if (modelsSelected) {
    for (var i=0; i< selection.length; i++) {

        var theModelFunctions = getOrderedFunctions(selection[i]);
        
        var theFunctionNames = new Array();
        var theFunctionsStatus = new Array();
        for (var j=0; j<theModelFunctions.length; j++) {
            theFunctionNames.push(theModelFunctions[j].Name(language, true)+ " ("+theModelFunctions[j].Type()+")");
            theFunctionsStatus.push("false");
        }
        
        theModelArray[i] = new Array();
        theModelArray[i]["modelname"] = selection[i].Name(language, true);
        theModelArray[i]["modelobject"] = selection[i];
        theModelArray[i]["functionnames"] = theFunctionNames;
        theModelArray[i]["functionobjects"] = theModelFunctions;
        theModelArray[i]["functionsStatus"] = theFunctionsStatus;
        theModelNameArray.push(selection[i].Name(language, true)+ " ("+selection[i].Type()+")");
    }
}

else {
    var theFunctionNames = new Array();
    var theFunctionsStatus = new Array();
    if (theSortedOIDs != null && theSortedOIDs != "") {
        var selection = new Array();
        var theOIDArray = theSortedOIDs.split("#:#");
        var selectedDatabase = ArisData.getActiveDatabase();
        for (var oaIdx=0; oaIdx<theOIDArray.length; oaIdx++) {
            var theObject = selectedDatabase.FindOID(theOIDArray[oaIdx]);
            selection.push(theObject);
            theFunctionNames.push(theObject.Name(language, true)+ " ("+theObject.Type()+")");
            theFunctionsStatus.push("false");
        }
    }
    else {
        for (var j=0; j<selection.length; j++) {
            theFunctionNames.push(selection[j].Name(language, true)+ " ("+selection[j].Type()+")");
            theFunctionsStatus.push("false");
        }
    }
    
    theModelArray[0] = new Array();
    theModelArray[0]["modelname"] = getString("NO_MODELS_SELECTED");
    theModelArray[0]["modelobject"] = null;
    theModelArray[0]["functionnames"] = theFunctionNames;
    theModelArray[0]["functionobjects"] = selection;
    theModelArray[0]["functionsStatus"] = theFunctionsStatus;
    theModelNameArray.push(getString("NO_MODELS_SELECTED"));
}


if (startCreationDialog_Step1()) {
    if (startCreationDialog_Step2()) {
        if (theFunctionsToUse.length > 0) {
            if (startCreationDialog_Step3()) {
                prepareObjects();
            }
        } else {
            Dialogs.MsgBox(getString("NO_FUNCTIONS_AT_ASSIGNMENT_LEVEL"));        
        }
    }
}

function getOrderedFunctions(theModel) {
    var theOrderedFunctions = new Array();
    
    var theUnsortedObjOccs = theModel.ObjOccListFilter();
    var theSortedObjOccs = theUnsortedObjOccs.sort(sortByPosYX); //ArisData.sort(theUnsortedObjOccs, Constants.SORT_Y, Constants.SORT_X, language);
    
    var theSortedObjMap = Packages.java.util.HashMap();
    var theSortedObjArray = new Array();
    for (var i=0; i<theSortedObjOccs.length; i++) {
        var oObjDef = theSortedObjOccs[i].ObjDef();
        if (isColHeaderObj(oObjDef.TypeNum()) && !theSortedObjMap.containsKey(oObjDef)) {
            theSortedObjMap.put(oObjDef, oObjDef);
            theSortedObjArray.push(oObjDef);
        }
    }
    return theSortedObjArray;
}


function startCreationDialog_Step1() {
    var creationDialog_Step1 = Dialogs.createNewDialogTemplate(0, 0,  605, 300, getString("GENERATE_PROCESS_SUPPORT_MAP"), "creation1DlgEvntListener");
    
    // Gruppe Process Selection
    creationDialog_Step1.GroupBox(5, 5, 590, 290, getString("PROCESS_SELECTION"));
    creationDialog_Step1.Text(20, 20, 400, height_row, getString("SELECT_PROCESS_MODELS"));
    creationDialog_Step1.ComboBox(20, 40, 400, height_row, theModelNameArray, "model_listbox");
    creationDialog_Step1.Text(20, 60, 400, height_row, getString("SELECT_PROCESS_STEPS"));
    creationDialog_Step1.ListBox(20, 80, 550, 180, theFunctionNameArray, "function_listbox", 1);
    
    creationDialog_Step1.PushButton(20, 265, 150, height_row, getString("BUTTON_SELECT_ALL"), "button_select_all");
    creationDialog_Step1.PushButton(180, 265, 150, height_row, getString("BUTTON_SELECT_NONE"), "button_select_none");
    
    
    // Buttons am Ende: next, Cancel und Help
    creationDialog_Step1.PushButton(470, 265, 100, height_row, getString("BUTTON_NEXT"), "button_next");
    creationDialog_Step1.CancelButton();
//    creationDialog_Step1.HelpButton("HID_01b15fe0_3536_11dc_43b6_000fb0c4ad32_dlg_01.hlp");
    
    creationDlg_Step1 = Dialogs.createUserDialog(creationDialog_Step1);
    creationDlg_Step1.setDlgEnable("model_listbox", modelsSelected);
    creationDlg_Step1.setDlgEnable("button_next", false);
    
    fillFunctionList();
    var newDialog = Dialogs.show(creationDlg_Step1);
    if (newDialog == 0) return false;
    
    saveFunctions();
    return true;
}


function creation1DlgEvntListener(dlgItem, action, suppVal) {
    var result = false;
    
    switch (action) {
        case 1: // Dialog initialisiert
            result = false;
        break;
        
        case 2: 
        if (dlgItem == "Cancel") {
            result = false;
        }
        else if (dlgItem == "button_select_all") {
            result = true;
            selectFunctions(-2);
            fillFunctionList();
        }
        else if (dlgItem == "button_select_none") {
            result = true;
            selectFunctions(-1);
            fillFunctionList();            
        }
        else if (dlgItem == "button_next") {
            result = false;
        }
        else if (dlgItem == "model_listbox") {
            result = true;
            fillFunctionList();
        }
        else if (dlgItem == "function_listbox") {
            result = true;
            selectFunctions(suppVal);
        }
        checkNextButton();
        break;
    }
    return result;
}

function startCreationDialog_Step2() {
    // Don't show dialog if one selected process is not of type 'function'
    for (var i=0; i<theSelectedFunctionNames.length; i++) {
        if (theSelectedFunctionsMap.get(theSelectedFunctionNames[i]).TypeNum() != Constants.OT_FUNC) {
            copyFunctions();
            return true;
        }
    }
    
    var creationDialog_Step2 = Dialogs.createNewDialogTemplate(0, 0,  605, 300, getString("GENERATE_PROCESS_SUPPORT_MAP"), "creation2DlgEvntListener");
    
    var theLevelArray = new Array();
    for (var i=0; i<10; i++) {
        theLevelArray.push("" + i + "");
    }
    
    // Gruppe Process Selection
    creationDialog_Step2.GroupBox(5, 5, 590, 290, getString("LEVEL_OF_PROCESSES"));
    creationDialog_Step2.CheckBox(20, 20, 400, height_row, getString("REFER_TO_LEVEL"), "checkbox_levels");
    //creationDialog_Step2.TextBox(20, 40, 40, height_row, "textbox_levels", 0);
    creationDialog_Step2.ComboBox(20, 40, 40, height_row, theLevelArray, "level_listbox");
    creationDialog_Step2.Text(70, 43, 300, height_row, getString("ASSIGNMENT_LEVEL"));
    
    // Buttons am Ende: next, Cancel und Help
    creationDialog_Step2.PushButton(470, 265, 100, height_row, getString("BUTTON_NEXT"), "button_next");
    creationDialog_Step2.CancelButton();
//    creationDialog_Step2.HelpButton("HID_01b15fe0_3536_11dc_43b6_000fb0c4ad32_dlg_02.hlp");
    
    creationDlg_Step2 = Dialogs.createUserDialog(creationDialog_Step2);
    creationDlg_Step2.setDlgEnable("level_listbox", false);

    var newDialog = Dialogs.show(creationDlg_Step2);
    if (newDialog == 0) return false;
    return true;
}


function creation2DlgEvntListener(dlgItem, action, suppVal) {
    var result = false;
    
    switch (action) {
        case 1: // Dialog initialisiert
            result = false;
        break;
        
        case 2: 
        if (dlgItem == "Cancel") {
            result = false;
        }
        else if (dlgItem == "button_next") {
            result = false;
            saveNewFunctions();
        }
        else if (dlgItem == "checkbox_levels") {
            result = true;
            changeTextboxLevels(suppVal);
        }
        break;
    }
    return result;
}


function startCreationDialog_Step3() {
    var creationDialog_Step3 = Dialogs.createNewDialogTemplate(0, 0,  605, 300, getString("GENERATE_PROCESS_SUPPORT_MAP"), "creation3DlgEvntListener");
    
    // Gruppe Process Selection
    creationDialog_Step3.GroupBox(5, 5, 590, 290, getString("ORG_UNITS_AND_LOCATIONS"));
    creationDialog_Step3.Text(20, 20, 400, height_row, getString("RELEVANT_ORG_UNITS"));
    creationDialog_Step3.TextBox(20, 40, 300, height_row, "textbox_orgmodel", 0);
    creationDialog_Step3.PushButton(350, 40, 50, height_row, "...", "button_browse");
    creationDialog_Step3.Text(20, 60, 400, height_row, getString("ORG_UNITS_AND_LOCATIONS"));
    creationDialog_Step3.ListBox(20, 80, 550, 150, theFunctionNameArray, "location_listbox", 1);
    
    creationDialog_Step3.PushButton(20, 235, 150, height_row, getString("BUTTON_SELECT_ALL"), "button_select_all");
    creationDialog_Step3.PushButton(180, 235, 150, height_row, getString("BUTTON_SELECT_NONE"), "button_select_none");
    creationDialog_Step3.CheckBox(20, 265, 350, height_row, getString("SELECT_LOCATIONS"), "checkbox_locations");

    creationDialog_Step3.GroupBox(370, 235, 200, 40, "");
    creationDialog_Step3.OptionGroup("option_sort");
    creationDialog_Step3.OptionButton(385, 240, 180, height_row, getString("SORT_GEOMETRICALLY"));
    creationDialog_Step3.OptionButton(385, 255, 180, height_row, getString("SORT_ALPHABETICALLY"));    
    
    // Buttons am Ende: next, Cancel und Help
    creationDialog_Step3.OKButton();
    creationDialog_Step3.CancelButton();
//    creationDialog_Step3.HelpButton("HID_01b15fe0_3536_11dc_43b6_000fb0c4ad32_dlg_03.hlp");
    
    creationDlg_Step3 = Dialogs.createUserDialog(creationDialog_Step3);
    creationDlg_Step3.setDlgEnable("textbox_orgmodel", false);
    creationDlg_Step3.setDlgEnable("OK", false);
    
    var newDialog;
    for (;;) {
        checkLocations = false;
        newDialog = Dialogs.show(creationDlg_Step3);
        if (newDialog == 0) return false;
        
        if (checkLocations) {
            fillLocationList();
            checkOKButton();
        } else {
            break;
        }
    }
    saveLocations();
    return true;
}


function creation3DlgEvntListener(dlgItem, action, suppVal) {
    var result = false;
    
    switch (action) {
        case 1: // Dialog initialisiert
            result = false;
        break;
        
        case 2: 
        if (dlgItem == "Cancel") {
            result = false;
        }
        else if (dlgItem == "button_select_all") {
            result = true;
            selectLocations(true);
        }
        else if (dlgItem == "button_select_none") {
            result = true;
            selectLocations(false);
        }
        else if (dlgItem == "OK") {
            result = false;
        }
        else if (dlgItem == "button_browse") {
            result = false;
            checkLocations = true;
        }
        else if (dlgItem == "location_listbox") {
            result = true;
        }
        else if (dlgItem == "option_sort") {
            if (suppVal != g_nSorting) {
                var theLocationIdx = getSelectionIndexes(suppVal);
                
                if (suppVal == 0) {
                    // -> Now sort geometrically (= Default)   
                    creationDlg_Step3.setDlgListBoxArray("location_listbox", theLocationNameArray);
                } else {
                    // -> Now sort alphabetically
                    creationDlg_Step3.setDlgListBoxArray("location_listbox", theLocationNameArray_2);
                }
                if (theLocationIdx!= null) creationDlg_Step3.setDlgSelection("location_listbox", theLocationIdx);
                g_nSorting = suppVal;
            } 
            result = true;
        }
        checkOKButton();
        break;
    }
    return result;
    
    function getSelectionIndexes(suppVal) {
        var theLocationIdx = creationDlg_Step3.getDlgSelection("location_listbox"); 
        if (theLocationIdx!=null && suppVal != g_nSorting) {
            var theChosenLocations = new Array();
            for (var i=0; i<theLocationIdx.length; i++) {
                var selectedIdx = theLocationIdx[i];
                if (g_nSorting == 0) {
                    theChosenLocations.push(theLocationArray[selectedIdx]); // Sorted geometrically (= Default)
                } else {
                    theChosenLocations.push(theLocationArray_2[selectedIdx]); // Sorted alphabetically
                }
            }
            theLocationIdx = updateIndexes(suppVal, theChosenLocations);
        }
        return theLocationIdx;
        
        function updateIndexes(suppVal, theChosenLocations) {
            var nIndexes = new Array();
            var aRefArray = (suppVal == 0) ? theLocationArray : theLocationArray_2;
            for (var i=0; i<aRefArray.length; i++) {
                aItem = aRefArray[i];
                for (var j=0; j<theChosenLocations.length; j++) {
                    if (aItem.IsEqual(theChosenLocations[j])) {
                        nIndexes.push(i);
                        break;
                    }
                }
            }
            return nIndexes;
        }        
    }
}

function fillLocationList() {
    var allowedModelTypes = new Array();
    allowedModelTypes[0] = Constants.MT_ORG_CHRT;
    
    var selectedDatabase = ArisData.getActiveDatabase();
    var databaseName = selectedDatabase.Name(language);
    var selectedServer = selectedDatabase.ServerName();
    var theOrgModelOID = Dialogs.BrowseArisItems(getString("CHOOSE_FILE"), getString("CHOOSE_ORG_CHART"), selectedServer, databaseName, Constants.CID_MODEL, allowedModelTypes, "HID_01b15fe0_3536_11dc_43b6_000fb0c4ad32_dlg_04.hlp");
    
    if(theOrgModelOID != "") {
        var theOrgModel = selectedDatabase.FindOID(theOrgModelOID);
        var theOrgModelName = theOrgModel.Name(language, true);
        creationDlg_Step3.setDlgText("textbox_orgmodel", theOrgModelName);
        theChosenOrgModel = theOrgModel;
        // Bestimmen der Org-Einheiten im ausgewählten Modell (nur Objekte in erster Ebene)
        var theLocationOccs = theOrgModel.ObjOccListFilter();
        theLocationOccs = theLocationOccs.sort(sortByPosXY); //ArisData.sort(theLocationOccs, Constants.SORT_X, Constants.SORT_Y, language);
        var theLocationDefs = new Array();
        for (var i=0; i<theLocationOccs.length; i++) {
            if (theLocationOccs[i].InEdges(Constants.EDGES_ALL).length == 0) { // ROOT-Objekt gefunden, weil keine eingehende Kante
                if (isRowHeaderObj(theLocationOccs[i].ObjDef().TypeNum())/*theLocationOccs[i].ObjDef().TypeNum() == Constants.OT_LOC || theLocationOccs[i].ObjDef().TypeNum() == Constants.OT_ORG_UNIT*/) {
                    theLocationDefs.push(theLocationOccs[i].ObjDef());
                }
            }
        }
        theLocationArray = theLocationDefs;
        theLocationNameArray = new Array();
        for (var i=0; i<theLocationDefs.length; i++) {
            theLocationNameArray.push(theLocationDefs[i].Name(language, true)+ " ("+theLocationDefs[i].Type()+")");
        }
        theLocationArray_2 = copyArray(theLocationArray).sort(SortByNameReport);
        theLocationNameArray_2 = new Array();
        for (var i=0; i<theLocationArray_2.length; i++) {
            theLocationNameArray_2.push(theLocationArray_2[i].Name(language, true)+ " ("+theLocationArray_2[i].Type()+")");
        }
        creationDlg_Step3.setDlgListBoxArray("location_listbox", theLocationNameArray);
        creationDlg_Step3.setDlgValue("option_sort", 0);    // Sort geometrically (= Default)
        g_nSorting = creationDlg_Step3.getDlgValue("option_sort");
    }
    
    function copyArray(aArr) {
        var aArrCopy = new Array();
        for (var i=0; i<aArr.length; i++) {
            aArrCopy.push(aArr[i]);
        }
        return aArrCopy;
    }
}

function checkOKButton() {
    var theLocationIdx = creationDlg_Step3.getDlgSelection("location_listbox");
    if (theLocationIdx != null) {
        creationDlg_Step3.setDlgEnable("OK", (theLocationIdx.length > 0));
    }
}

function checkNextButton() {
    var isFunctionSelected = false;
    for (var i=0; i<theModelArray.length; i++) {
        for (var j=0; j<theModelArray[i]["functionsStatus"].length; j++) {
            if (theModelArray[i]["functionsStatus"][j] == "true") {
                isFunctionSelected = true;
                break;
            }  
        }
    }
    creationDlg_Step1.setDlgEnable("button_next", isFunctionSelected);
}

function fillFunctionList() {
    var selectedModelIdx = creationDlg_Step1.getDlgValue("model_listbox");
    if (selectedModelIdx == -1) {
        selectedModelIdx = 0;
    }
    var selectedModelFunctions = theModelArray[selectedModelIdx]["functionnames"];
    creationDlg_Step1.setDlgListBoxArray("function_listbox", selectedModelFunctions);
    
    var theSelectedIndizes = new Array();
    
    for (var z=0; z<theModelArray[selectedModelIdx]["functionnames"].length; z++){
        if(theModelArray[selectedModelIdx]["functionsStatus"][z] == "true") {
            theSelectedIndizes.push(z);
        }
        creationDlg_Step1.setDlgSelection("function_listbox", theSelectedIndizes);
    }
}

function selectLocations(checkAll) { 
    var selectionArray = new Array();
    if (checkAll) {
        for (var i=0; i<theLocationNameArray.length; i++) {
            selectionArray.push(i);
        }
    }
    creationDlg_Step3.setDlgSelection("location_listbox", selectionArray);

}

function selectFunctions(value) {
    var selectedModelIdx = creationDlg_Step1.getDlgValue("model_listbox");
    if (selectedModelIdx == -1) {
        selectedModelIdx = 0;
    }

    if(value == -2) {
        for (var z=0; z<theModelArray[selectedModelIdx]["functionsStatus"].length; z++) {
            theModelArray[selectedModelIdx]["functionsStatus"][z] = "true";
        }
    }
    
    else if(value == -1) {
        for (var z=0; z<theModelArray[selectedModelIdx]["functionsStatus"].length; z++) {
            theModelArray[selectedModelIdx]["functionsStatus"][z] = "false";
        }
    }
    else {
        for (var z=0; z<theModelArray[selectedModelIdx]["functionsStatus"].length; z++) {
            theModelArray[selectedModelIdx]["functionsStatus"][z] = "false";
        }
        
        var selectedFunctionIdx = creationDlg_Step1.getDlgSelection("function_listbox");
        for (var z=0; z<selectedFunctionIdx.length; z++){
            var idx2set = selectedFunctionIdx[z];
            theModelArray[selectedModelIdx]["functionsStatus"][idx2set] = "true";
        }
    }
}


function saveFunctions() {
    for (var i=0; i<theModelArray.length; i++) {
        
        for (var j=0; j<theModelArray[i]["functionsStatus"].length; j++) {
            if (theModelArray[i]["functionsStatus"][j] == "true") {
                if(!theSelectedFunctionsMap.containsKey(theModelArray[i]["functionnames"][j])) {
                    theSelectedFunctionsMap.put(theModelArray[i]["functionnames"][j], theModelArray[i]["functionobjects"][j]);
                    theSelectedFunctionNames.push(theModelArray[i]["functionnames"][j]);
                }
            }  
        }
    }
}

function saveNewFunctions() {
    if(creationDlg_Step2.getDlgEnable("level_listbox") && creationDlg_Step2.getDlgValue("level_listbox") != 0) {
        var levels = creationDlg_Step2.getDlgValue("level_listbox");
        
        for (var i=0; i<theSelectedFunctionNames.length; i++) {
            var theSelectedFunction = theSelectedFunctionsMap.get(theSelectedFunctionNames[i]);
            goInto(theSelectedFunction,0,levels);
        }   
    }
    else {
        copyFunctions();
    }
}

function copyFunctions() {
    for (var i=0; i<theSelectedFunctionNames.length; i++) {
        theFunctionsToUse.push(theSelectedFunctionsMap.get(theSelectedFunctionNames[i]));
    }
}

function goInto(theSelectedFunction, actLevel,levels,previousModel) {
    var theAssignedModels = theSelectedFunction.AssignedModels();
    var theAssignedModel = theAssignedModels[0];
    
    
    if (theAssignedModel != null && !theAssignedModel.equals(previousModel)) {
        actLevel++;
        var theAssignedFunctionDefs = getOrderedFunctions(theAssignedModel);
        for (var j=0; j<theAssignedFunctionDefs.length; j++) {
            if (actLevel == levels) {
                theFunctionsToUse.push(theAssignedFunctionDefs[j]);
            }
            else {
                goInto(theAssignedFunctionDefs[j],actLevel,levels, theAssignedModel);
            }
        }
    }        
}


function saveLocations() {
    var bDefaultSorting = (creationDlg_Step3.getDlgValue("option_sort") == 0);
    var theLocationIdx = creationDlg_Step3.getDlgSelection("location_listbox");
    var theChosenLocations = new Array();
    for (var i=0; i<theLocationIdx.length; i++) {
        var selectedIdx = theLocationIdx[i];
        if (bDefaultSorting) {
            theChosenLocations.push(theLocationArray[selectedIdx]); // Sorted geometrically (= Default)
        } else {
            theChosenLocations.push(theLocationArray_2[selectedIdx]); // Sorted alphabetically
        }
    }
    if (!bDefaultSorting) {
        // Sort geometrically again!
        theChosenLocations = updateSorting(theChosenLocations, theLocationArray);
    }
    var useLocations = creationDlg_Step3.getDlgValue("checkbox_locations");
    
    for (var i=0; i<theChosenLocations.length; i++) {
        theLocationsToUse.push(theChosenLocations[i]);

        if (useLocations == 1) {
            var theOccsInModel = theChosenLocations[i].OccListInModel(theChosenOrgModel);
            var outgoingCxnOccs = theOccsInModel[0].OutEdges(Constants.EDGES_ALL);
            var tmpLocsArray = new Array();
            for (var j=0; j<outgoingCxnOccs.length; j++) {
                var tmpObj = outgoingCxnOccs[j];
                var theTargetOcc = tmpObj.TargetObjOcc();
                if (theTargetOcc.ObjDef().TypeNum() == Constants.OT_LOC) {
                    tmpLocsArray[tmpLocsArray.length] = theTargetOcc;
                }
            }
            //sort by Y axis... and push back to array...
            tmpLocsArray = tmpLocsArray.sort(sortByPosXY);
            for (var k=0; k<tmpLocsArray.length; k++) {
                var tmpObjOcc = tmpLocsArray[k];
                theLocationsToUse.push(tmpObjOcc.ObjDef());
            }
        }
    }
    
    function updateSorting(aArrayToSort, aRefArray) {
        var aSortedArray = new Array();
        for (var i=0; i<aRefArray.length; i++) {
            aItem = aRefArray[i];
            for (var j=0; j<aArrayToSort.length; j++) {
                if (aItem.IsEqual(aArrayToSort[j])) {
                    aSortedArray.push(aItem);
                    break;
                }
            }
        }
        return aSortedArray;
    }
}

function sortByPosYX(a,b){
    if (a.Y()+a.Height()<b.Y()) return -1
    if (b.Y()+b.Height()<a.Y()) return 1
    return a.X()-b.X();
}
function sortByPosXY(a,b){
    if (a.X()+a.Width()<b.X()) return -1
    if (b.X()+b.Width()<a.X()) return 1
    return a.Y()-b.Y();
}
/*function SortByPosX(aObj, bObj){
    var x = aObj.X();
    var y = bObj.X();

    return x-y;
}

function SortByPosY(aObj, bObj){
    var x = aObj.Y();
    var y = bObj.Y();

    return x-y;
}*/

function prepareObjects() {
    var dataString = "";
    for (var i=0; i<theFunctionsToUse.length; i++) {
        dataString += theFunctionsToUse[i].GUID();
        dataString += "##";                                 // Trennung der Zuordnungen voneinander
    }
    dataString += "::";                                     // Trennung der Funktionen von den Locations

    for (var i=0; i<theLocationsToUse.length; i++) {
        dataString += theLocationsToUse[i].GUID();
        dataString += "##";                                 // Trennung der Zuordnungen voneinander
    }
    
    var myProps = new Packages.java.util.Properties();
    myProps.put("dataString", dataString);
    
    var myOutput = new Packages.java.io.ByteArrayOutputStream();
    myProps.store(myOutput, "whatever");
    
    Context.setPropertyBytes("dataProp", myOutput.toByteArray());
    Context.setProperty("dataString", dataString);
}

function changeTextboxLevels(suppVal) {
    if(suppVal) {
        creationDlg_Step2.setDlgEnable("level_listbox", true);
    }
    else {
        creationDlg_Step2.setDlgEnable("level_listbox", false);
    }
}
