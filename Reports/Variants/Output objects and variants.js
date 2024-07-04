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


// Global Variables
var g_nloc = Context.getSelectedLanguage();
var g_ooutfile = Context.createOutputObject();

// Main Routine
function main()
{
    var oobjdefs = ArisData.getSelectedObjDefs();
    if (oobjdefs.length > 0) {
        
		var bcheckuserdialog = new __holder(false);   	// variable to check for the interruption of userdialog
		var ndepth = new __holder(0);   				// variable with value of user input depth		
        userdlg(ndepth, bcheckuserdialog);
		
        if (bcheckuserdialog.value == true) {            
            header();
            outputobjects(ndepth, 0, oobjdefs, Constants.FMT_BOLD | Constants.FMT_LEFT);
            g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
            
        } else {
            Context.setScriptError(Constants.ERR_CANCEL);
        }
    } else {
        Dialogs.MsgBox(getString("TEXT1"), Constants.MSGBOX_BTN_OK, getString("TEXT2"));
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}

// This subroutine designs the header and the footer of the created report
function header()
{    
    // format styles
    g_ooutfile.DefineF("REPORT1", getString("TEXT3"), 24, 0, - 1, 17, 0, 21, 0, 0, 0, 1);
    g_ooutfile.DefineF("REPORT2", getString("TEXT3"), 14, 0, - 1, 8, 0, 21, 0, 0, 0, 1);
    g_ooutfile.DefineF("REPORT3", getString("TEXT3"), 8, 0, - 1, 8, 0, 21, 0, 0, 0, 1);
    
    // BLUE-17783 Update report header/footer
    var borderColor = getColorByRGB( 23, 118, 191);
    
    // graphics used in header
    var pictleft = Context.createPicture(Constants.IMAGE_LOGO_LEFT);
    var pictright = Context.createPicture(Constants.IMAGE_LOGO_RIGHT);
    
    // Header + Footer
    setFrameStyle(g_ooutfile, Constants.FRAME_BOTTOM);
    g_ooutfile.BeginHeader();
    g_ooutfile.BeginTable(100, borderColor, - 1, 8, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell("", 26, getString("TEXT3"), 12, 0, - 1, 0, 272, 0);
    g_ooutfile.OutGraphic(pictleft, - 1, 40, 15);
    g_ooutfile.TableCell(Context.getScriptInfo(Constants.SCRIPT_TITLE), 48, getString("TEXT3"), 14, 0, - 1, 0, 272, 0);
    g_ooutfile.TableCell("", 26, getString("TEXT3"), 12, 0, - 1, 0, 272, 0);
    g_ooutfile.OutGraphic(pictright, - 1, 40, 15);
    g_ooutfile.EndTable("", 100, getString("TEXT3"), 10, 0, - 1, 0, 136, 0);
    g_ooutfile.EndHeader();
    
    setFrameStyle(g_ooutfile, Constants.FRAME_TOP);
    g_ooutfile.BeginFooter();
    g_ooutfile.BeginTable(100, borderColor, - 1, 8, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell("", 26, getString("TEXT3"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_DATE, getString("TEXT3"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    g_ooutfile.Output(" ", getString("TEXT3"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_TIME, getString("TEXT3"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    g_ooutfile.TableCell(Context.getSelectedFile(), 48, getString("TEXT3"), 12, 0, - 1, 0, 272, 0);
    g_ooutfile.TableCell("", 26, getString("TEXT3"), 12, 0, - 1, 0, 272, 0);
    g_ooutfile.Output(getString("TEXT4"), getString("TEXT3"), 12, 0, 16777215, 16, 0);
    g_ooutfile.OutputField(1, getString("TEXT3"), 12, 0, 16777215, 16);
    g_ooutfile.Output(getString("TEXT5"), getString("TEXT3"), 12, 0, 16777215, 16, 0);
    g_ooutfile.OutputField(2, getString("TEXT3"), 12, 0, 16777215, 16);
    g_ooutfile.EndTable("", 100, getString("TEXT3"), 10, 0, - 1, 0, 136, 0);
    g_ooutfile.EndFooter();
    
    g_ooutfile.ResetFrameStyle();
    
    // Headline
    g_ooutfile.OutputLnF("", "REPORT1");
    g_ooutfile.OutputLnF(getString("TEXT2"), "REPORT1");
    g_ooutfile.OutputLnF("", "REPORT1");
    
    // Information Header
    g_ooutfile.OutputLnF((getString("TEXT6") + ArisData.getActiveDatabase().ServerName()), "REPORT2");
    g_ooutfile.OutputLnF((getString("TEXT7") + ArisData.getActiveDatabase().Name(g_nloc)), "REPORT2");
    g_ooutfile.OutputLnF((getString("TEXT8") + ArisData.getActiveUser().Name(g_nloc)), "REPORT2");
    g_ooutfile.OutputLnF("", "REPORT2");
    
    
    function setFrameStyle(outfile, iFrame) { 
        outfile.SetFrameStyle(Constants.FRAME_TOP, 0); 
        outfile.SetFrameStyle(Constants.FRAME_LEFT, 0); 
        outfile.SetFrameStyle(Constants.FRAME_RIGHT, 0); 
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 0);
        
        outfile.SetFrameStyle(iFrame, 50, Constants.BRDR_NORMAL);
    }  
}

// This subroutine asks the user to input the depth to be used in report
function userdlg(ndepth, bcheckuserdialog)
{
    var binput = false;   // Variable to check if input is correct
    var nuserdlg = 1;   // Variable zum Überprüfen ob der Benutzer in den Dialogen Abbrechen gewählt wurde.
    
    while (binput == false && (nuserdlg != 0)) {        
        var userdialog = Dialogs.createNewDialogTemplate(0, 0, 600, 99, getString("TEXT2"));
        userdialog.GroupBox(7, 7, 586, 56, getString("TEXT9"));
        userdialog.TextBox(200, 28, 40, 21, "Text0");
        userdialog.Text(70, 30, 100, 14, getString("TEXT10"));
        userdialog.OKButton();
        userdialog.CancelButton();
        //    userdialog.HelpButton("HID_afad6bc0_eae8_11d8_12e0_9d2843560f51_dlg_01.hlp");    
        
        var dlg = Dialogs.createUserDialog(userdialog); 
        
        // Read dialog settings from config  
        var sSection = "SCRIPT_afad6bc0_eae8_11d8_12e0_9d2843560f51";
        ReadSettingsDlgText(dlg, sSection, "Text0", "3");
        
        nuserdlg = Dialogs.show( __currentDialog = dlg);      // Show Dialog and waiting for confirmation with  OK
        
        if (nuserdlg == 0) {
            bcheckuserdialog.value = false;
        } else {
            bcheckuserdialog.value = true;
            
            if (!isNaN(""+dlg.getDlgText("Text0"))) {
                ndepth.value = parseInt(dlg.getDlgText("Text0"));
                if (ndepth.value > 0) {
                    binput = true;
                } else {
                    Dialogs.MsgBox(getString("TEXT11"), Constants.MSGBOX_BTN_OK, getString("TEXT2"));
                }
            } else {
                Dialogs.MsgBox(getString("TEXT12"), Constants.MSGBOX_BTN_OK, getString("TEXT2"));
            }
            // Write dialog settings to config      
            if (binput) {
                WriteSettingsDlgText(dlg, sSection, "Text0");
            }
        }
    }
}

// Subroutine to get the objects,sort them by name and type,,and output
function outputobjects(ndepth, ncurrentdepth, oobjdefs, nformat)
{
	oobjdefs = ArisData.sort(oobjdefs, Constants.AT_NAME, Constants.SORT_TYPE, Constants.SORT_NONE, g_nloc);
    for (var k = 0; k < oobjdefs.length; k++) {
        var ocurrentobj = oobjdefs[k];
		
        g_ooutfile.OutputLn(ocurrentobj.Name(g_nloc) + "(" + ocurrentobj.Type() + ")", getString("TEXT3"), 12, 0, 16777215, nformat, (ncurrentdepth * 10));
        g_ooutfile.OutputLn(getString("TEXT13") + ocurrentobj.Group().Path(g_nloc), getString("TEXT3"), 12, 0, 16777215, nformat, (ncurrentdepth * 10));

        if (ndepth.value >= ncurrentdepth) {
            if (ocurrentobj.HasVariants()) {
                var ovariants = ocurrentobj.Variants();
                if (ovariants.length > 0) {
                    outputobjects(ndepth, (ncurrentdepth + 1), ovariants, Constants.FMT_LEFT);
                }
                g_ooutfile.OutputLn("", getString("TEXT3"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0);
            }
        }
    }
}


main();