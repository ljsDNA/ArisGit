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

// BLUE-17650 - Import/Usage of 'convertertools.js' removed


// text constants
// dialog text constants
var txtOutputOptionsDialogTitle = getString("TEXT1");
var txtLinkLevels               = getString("TEXT2");

// message box text constants
var txtPleaseNumber             = getString("TEXT3");
var txtNumberToSmall            = getString("TEXT4");
var txtNoModelsSelected         = getString("TEXT5");


var g_nloc = Context.getSelectedLanguage();
var g_ooutfile = Context.createOutputObject();

var g_visitedModels = new java.util.HashSet()

var g_nDefaultLinkLevels = 3;
var g_nIndentNextLevel   = 20;  // Indentation for next level
var g_nIndentObjects     = 20;  // Indentation for objects


function main()
{
    var ndepth = new __holder(0);   // variable with value of user input for depth
    var ncurrentdepth = 1;   // variable for current depth      // Anubis 403183
    
    g_ooutfile.DefineF("REPORT1", getString("TEXT6"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
    g_ooutfile.DefineF("REPORT2", getString("TEXT6"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    g_ooutfile.DefineF("REPORT3", getString("TEXT6"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    
    var omodels = ArisData.getSelectedModels();
    if (omodels.length > 0) {
        
        var bcheckuserdialog = showOutputOptionsDialog(ndepth);
        if (bcheckuserdialog == true) {
		
            setReportHeaderFooter(g_ooutfile, g_nloc, true, true, true);
            outputmodels(omodels, ndepth.value, ncurrentdepth, new __holder(null));
            g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
        } else {
            Context.setScriptError(Constants.ERR_CANCEL);
        }
    } else {
        Dialogs.MsgBox(txtNoModelsSelected, Constants.MSGBOX_BTN_OK, getString("TEXT7"));
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}

// Subroutine to get the models,sort them by name and type,,and output
function outputmodels(omodels, ndepth, ncurrentdepth, oobjdef)
{
    g_ooutfile.OutputLnF("", "REPORT2");
	
    omodels = ArisData.sort(omodels, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);	
    for (var i = 0; i < omodels.length; i++) {
        var ocurrmodel = omodels[i];
        if( g_visitedModels.contains(ocurrmodel.ObjectID()) )
            continue;
			
        g_visitedModels.add(ocurrmodel.ObjectID())
        
        g_ooutfile.OutputLn(ocurrmodel.Type() + ": "+ ocurrmodel.Name(g_nloc), getString("TEXT6"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_BOLD | Constants.FMT_LEFT, (ncurrentdepth * g_nIndentNextLevel));
		
        // AGA-5434 Use occurences to ensure that filter settings concerning allowed symbols are considered
        var oobjdefs = new Array();
        oobjoccs = ocurrmodel.ObjOccList();
        for (var i = 0; i < oobjoccs.length; i++) {
            oobjdefs.push(oobjoccs[i].ObjDef());
        }
        oobjdefs = ArisData.Unique(oobjdefs);
        
        if (oobjdefs.length > 0) {
            outputobjects(oobjdefs, ndepth, ncurrentdepth, oobjdef);
        }
    }
}

// Subroutine to getthe objects in the models,sort them and output
function outputobjects(oobjdefs, ndepth, ncurrentdepth, oobjdef)
{
    oobjdefs = ArisData.sort(oobjdefs, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);
    g_ooutfile.OutputLnF("", "REPORT2");

    for (var i = 0; i < oobjdefs.length; i++) {
		var ocurrentobj = new __holder(null);
        ocurrentobj.value = oobjdefs[i];
		
        g_ooutfile.OutputLn(ocurrentobj.value.Type() + ": " + ocurrentobj.value.Name(g_nloc), getString("TEXT6"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, (((ncurrentdepth * g_nIndentNextLevel)) + g_nIndentObjects));
        
        if (ndepth >= ncurrentdepth) {
            if (oobjdef.value == null || !(ocurrentobj.value.IsEqual(oobjdef.value))) {
			
                var omodels = ocurrentobj.value.AssignedModels();
                if (omodels.length > 0) {
                    outputmodels(omodels, ndepth, ncurrentdepth + 1, ocurrentobj);
                }
            }
        }
    }    
    g_ooutfile.OutputLnF("", "REPORT2");
}


var dicLinkLevels = "txtLinkLevels";

// This subroutine asks the user to input the depth to be used in report
function showOutputOptionsDialog(ndepth)
{
    var bcheckuserdialog = false;	//result
    var binput = false;   			// Variable to check if input is correct
    var nuserdlg = 0;   			// Variable zum Überprüfen ob der Benutzer in den Dialogen Abbrechen gewählt wurde.
    
    while (binput == false && nuserdlg != 1) {
        var userdialog = Dialogs.createNewDialogTemplate(0, 0, 300, 45, txtOutputOptionsDialogTitle);
        userdialog.GroupBox(7, 7, 280, 45, txtLinkLevels);
        userdialog.Text(20, 25, 140, 15, txtLinkLevels);
        userdialog.TextBox(185, 22, 60, 21, dicLinkLevels);
        userdialog.OKButton();
        userdialog.CancelButton();
        //    userdialog.HelpButton("HID_6f45b490_eae1_11d8_12e0_9d2843560f51_dlg_01.hlp");    
        
        var dlg = Dialogs.createUserDialog(userdialog); 
        
        // Read dialog settings from config     
        var sSection = "SCRIPT_6f45b490_eae1_11d8_12e0_9d2843560f51";
        ReadSettingsDlgText(dlg, sSection, dicLinkLevels, g_nDefaultLinkLevels);
        
        nuserdlg = Dialogs.show( __currentDialog = dlg);
        if (nuserdlg == 0) {
            bcheckuserdialog = false;
            return bcheckuserdialog;
        } else {
            bcheckuserdialog = true;
        }
        
        // Write dialog settings to config
        if (nuserdlg != 0) {  
            WriteSettingsDlgText(dlg, sSection, dicLinkLevels);    
        }
        
        if (!isNaN(dlg.getDlgText(dicLinkLevels))== true) {
            ndepth.value = parseInt(dlg.getDlgText(dicLinkLevels));
            if (ndepth.value > 0) {
                binput = true;
            } else { 
                Dialogs.MsgBox(txtNumberToSmall, Constants.MSGBOX_BTN_OK, getString("TEXT7"));
            }
        } else {
            Dialogs.MsgBox(txtPleaseNumber, Constants.MSGBOX_BTN_OK, getString("TEXT7"));
        }
    }
    return bcheckuserdialog;
}


main();

