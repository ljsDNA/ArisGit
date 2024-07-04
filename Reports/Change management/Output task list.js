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


// global declarations
var g_nloc = Context.getSelectedLanguage();
var g_noutformat = Context.getSelectedFormat();
var g_ooutfile = Context.createOutputObject();

var g_omodellist = null; 
var g_oobjdeflist = null; 

var g_nmodel = 0; 
var g_nobject = 0; 
var g_nrecursion = 0; 


function main()
{
    var srespon = new __holder(""); 
    var bcheckdialog = new __holder(false); 
    
    g_ooutfile.DefineF("REPORT1", getString("TEXT1"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
    g_ooutfile.DefineF("REPORT2", getString("TEXT1"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    g_ooutfile.DefineF("REPORT3", getString("TEXT1"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    

	userdlg(bcheckdialog);
	if (bcheckdialog.value == true) {
		g_omodellist = new Array();
		g_oobjdeflist = new Array();
		
		// iterate through oSelectedGroups
		var oselectedgroups = ArisData.getSelectedGroups();
		if (oselectedgroups.length > 0) {
		
			for (var i = 0; i < oselectedgroups.length; i++) {
				var ocurrgroup = oselectedgroups[i];
				
				if (g_nmodel != 0) {
					getmodellist(ocurrgroup);
				}
				
				if (g_nobject != 0) {
					getobjdeflist(ocurrgroup);
				}
			}
			
			if (g_omodellist.length > 0 || g_oobjdeflist.length > 0) {
				respondlg(srespon, bcheckdialog);
				if (bcheckdialog.value == true) {
					outputactivitylist(srespon);
				}
				else {
					Context.setScriptError(Constants.ERR_CANCEL);
				}
			} else {
				Dialogs.MsgBox(getString("TEXT2"), Constants.MSGBOX_BTN_OK, getString("TEXT3"));
				Context.setScriptError(Constants.ERR_CANCEL);
			}
		} else {
			Dialogs.MsgBox(getString("TEXT4"), Constants.MSGBOX_BTN_OK, getString("TEXT3"));
			Context.setScriptError(Constants.ERR_CANCEL);
		}
	} else {
		Context.setScriptError(Constants.ERR_CANCEL);
	}
}


function getmodellist(ocurrgroup)
{
    var ocurrmodels = ocurrgroup.ModelList(g_nrecursion != 0);     // BLUE-16023    
    if (ocurrmodels.length > 0) {
	
        for (var i = 0 ; i < ocurrmodels.length; i++) {
            var ocurrmodel = ocurrmodels[i];
            if (ocurrmodel.Attribute(Constants.AT_STATUS, g_nloc).IsMaintained()) {
                g_omodellist[g_omodellist.length] = ocurrmodel;
            }
        }
    }
}

function getobjdeflist(ocurrgroup)
{
    var ocurrobjdefs = ocurrgroup.ObjDefList(g_nrecursion != 0);     // BLUE-16023
    if (ocurrobjdefs.length > 0) {
        for (var i = 0 ; i < ocurrobjdefs.length; i++) {
            var ocurrobjdef = ocurrobjdefs[i];
            if (ocurrobjdef.Attribute(Constants.AT_STATUS, g_nloc).IsMaintained()) {
                g_oobjdeflist[g_oobjdeflist.length] = ocurrobjdef;
            }
        }
    }
}

function outputactivitylist(srespon)
{
    var boutmodel = false; 
    var boutobject = false; 
    
    // Create page header, page footer, headline and information header
    createheaderfooter(srespon);
    
    if (g_nmodel != 0) {
        g_ooutfile.OutputLink(getString("TEXT6"), getString("TEXT6"));
        g_ooutfile.OutputLn("", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }
    
    if (g_nobject != 0) {
        g_ooutfile.OutputLink(getString("TEXT7"), getString("TEXT7"));
        g_ooutfile.OutputLn("", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }
    
    // Out model list
    if (g_nmodel != 0) {
        g_ooutfile.OutputLn("", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 10);
        g_ooutfile.OutputLn(getString("TEXT6"), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_LINKTARGET, 10);
        
        if (g_omodellist.length > 0) {
            g_omodellist = ArisData.sort(g_omodellist, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
            
            for (var i = 0; i < g_omodellist.length; i++) {
                var ocurrelem = g_omodellist[i];
                var ocurrattr = ocurrelem.Attribute(Constants.AT_RESPON, g_nloc);
                
                if (ocurrattr.IsMaintained() == true) {
                    if (StrComp(srespon.value, ocurrattr.GetValue(false)) == 0) {
                        outputelement(ocurrelem);
                    }
                }
            }
            boutmodel = true;
        } else {
            Dialogs.MsgBox(getString("TEXT8"), Constants.MSGBOX_BTN_OK, getString("TEXT3"));
            boutmodel = false;
        }
    }
    
    // Out object list
    if (g_nobject != 0) {
        g_ooutfile.OutputLn("", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 10);
        g_ooutfile.OutputLn(getString("TEXT7"), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_LINKTARGET, 10);
        if (g_oobjdeflist.length > 0) {
            g_oobjdeflist = ArisData.sort(g_oobjdeflist, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
            for (var i = 0; i < g_oobjdeflist.length; i++) {
                var ocurrelem = g_oobjdeflist[i];
                var ocurrattr = ocurrelem.Attribute(Constants.AT_RESPON, g_nloc);
                if (ocurrattr.IsMaintained() == true) {
                    if (StrComp(srespon.value, ocurrattr.GetValue(false)) == 0) {
                        outputelement(ocurrelem);
                    }
                }
            }
            boutobject = true;
        } else {
            Dialogs.MsgBox(getString("TEXT9"), Constants.MSGBOX_BTN_OK, getString("TEXT3"));
            boutobject = false;
        }
    }
    
    if (boutmodel == true || boutobject == true) {
        g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
    } else {
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}

function outputelement(ocurrelem)
{
    var svalue = ""; 
    
    g_ooutfile.OutputLn("", getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
    var ocurrattr = ocurrelem.Attribute(Constants.AT_NAME, g_nloc);
    if (ocurrattr.IsMaintained() == true) {
        svalue = ocurrattr.GetValue(false);
        g_ooutfile.OutputLn(svalue, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }
    
    svalue = getString("TEXT10");
    ocurrattr = ocurrelem.Attribute(Constants.AT_ID, g_nloc);
    if (ocurrattr.IsMaintained() == true) {
        svalue += ocurrattr.GetValue(false);
    }
    g_ooutfile.OutputLn(svalue, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 10);
    
    svalue = getString("TEXT11");
    ocurrattr = ocurrelem.Attribute(Constants.AT_TYPE_6, g_nloc);
    if (ocurrattr.IsMaintained() == true) {
        svalue += ocurrattr.GetValue(false);
    }
    g_ooutfile.OutputLn(svalue, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 10);
    
    svalue = getString("TEXT12");
    svalue += ocurrelem.Group().Path(g_nloc);
    g_ooutfile.OutputLn(svalue, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 10);
    
    svalue = getString("TEXT13");
    ocurrattr = ocurrelem.Attribute(Constants.AT_IMPROVE, g_nloc);
    if (ocurrattr.IsMaintained() == true) {
        svalue += ocurrattr.GetValue(false);
    }
    g_ooutfile.OutputLn(svalue, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
    svalue = getString("TEXT14");
    ocurrattr = ocurrelem.Attribute(Constants.AT_NOTE_2, g_nloc);
    if (ocurrattr.IsMaintained() == true) {
        svalue += ocurrattr.GetValue(false);
    }
    g_ooutfile.OutputLn(svalue, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
    svalue = getString("TEXT15");
    ocurrattr = ocurrelem.Attribute(Constants.AT_PRIO_3, g_nloc);
    if (ocurrattr.IsMaintained() == true) {
        svalue += ocurrattr.GetValue(false);
    }
    g_ooutfile.OutputLn(svalue, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
    svalue = getString("TEXT16");
    ocurrattr = ocurrelem.Attribute(Constants.AT_STATUS, g_nloc);
    if (ocurrattr.IsMaintained() == true) {
        svalue += ocurrattr.GetValue(false);
    }
    g_ooutfile.OutputLn(svalue, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
    svalue = getString("TEXT17");
    ocurrattr = ocurrelem.Attribute(Constants.AT_DEADL, g_nloc);
    if (ocurrattr.IsMaintained() == true) {
        svalue += ocurrattr.GetValue(false);
    }
    g_ooutfile.OutputLn(svalue, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

    g_ooutfile.OutputLn("", getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}

function userdlg(bcheckuserdialog)
{
    var userdialog = Dialogs.createNewDialogTemplate(0, 0, 440, 100, getString("TEXT3"));
    
    userdialog.GroupBox(10, 10, 260, 60, getString("TEXT18"), "GroupBox1");
    userdialog.CheckBox(30, 25, 100, 15, getString("TEXT19"), "Check_Model");
    userdialog.CheckBox(30, 45, 100, 15, getString("TEXT20"), "Check_Object");
    userdialog.CheckBox(20, 80, 260, 15, getString("TEXT21"), "Check_Recursion");
    userdialog.OKButton();
    userdialog.CancelButton();
    //  userdialog.HelpButton("HID_d15ec480_4286_11d9_74b9_000f1f28afc9_dlg_01.hlp");
    
    var dlg = Dialogs.createUserDialog(userdialog); 
    
    // Read dialog settings from config
    var sSection = "SCRIPT_d15ec480_4286_11d9_74b9_000f1f28afc9";  
    ReadSettingsDlgValue(dlg, sSection, "Check_Model", 1);
    ReadSettingsDlgValue(dlg, sSection, "Check_Object", 1);
    ReadSettingsDlgValue(dlg, sSection, "Check_Recursion", 0);
    
    var nuserdlg = Dialogs.show( __currentDialog = dlg);
    // Show dialog (wait for ok).
    
    g_nmodel = dlg.getDlgValue("Check_Model");
    g_nobject = dlg.getDlgValue("Check_Object");
    g_nrecursion = dlg.getDlgValue("Check_Recursion");
    
    if (nuserdlg == 0) {
        bcheckuserdialog.value = false;
    } else {
        bcheckuserdialog.value = true;
        
        // Write dialog settings to config      
        WriteSettingsDlgValue(dlg, sSection, "Check_Model");
        WriteSettingsDlgValue(dlg, sSection, "Check_Object");
        WriteSettingsDlgValue(dlg, sSection, "Check_Recursion");
    }
    return false;
}

function respondlg(srespon, bcheckrespondialog)
{
    var sresponlist = new __holder(new Array());    
    if (getresponselist(sresponlist)) {
        
        var userdialog = Dialogs.createNewDialogTemplate(0, 0, 440, 115, getString("TEXT3"));
        // %GRID:10,7,1,1
        userdialog.GroupBox(10, 7, 420, 65, "", "GroupBox1");
        userdialog.Text(30, 35, 150, 14, getString("TEXT22"), "Text1");
        userdialog.DropListBox(190, 33, 220, 100, sresponlist.value, "DropListBox1");
        userdialog.OKButton();
        userdialog.CancelButton();
        //    userdialog.HelpButton("HID_d15ec480_4286_11d9_74b9_000f1f28afc9_dlg_02.hlp");
        
        var dlg = Dialogs.createUserDialog(userdialog); 
        
        // Read dialog settings from config
        var sSection = "SCRIPT_d15ec480_4286_11d9_74b9_000f1f28afc9";  
        ReadSettingsListBoxByString(dlg, sSection, "DropListBox1", "", sresponlist.value);    
        
        var nrespondlg = Dialogs.show( __currentDialog = dlg);
        // Show dialog (wait for ok).
        
        if (nrespondlg != 0) {        
            // Write dialog settings to config      
            WriteSettingsListBoxByString(dlg, sSection, "DropListBox1", sresponlist.value);    
        }
        
        var dlgValue = parseInt(dlg.getDlgValue("DropListBox1"));
        if (dlgValue >= 0 && dlgValue <= sresponlist.value.length) {
            srespon.value = sresponlist.value[dlgValue];
            if (nrespondlg == 0) {
                bcheckrespondialog.value = false;
            } else {
                bcheckrespondialog.value = true;
            }
        } else {
            bcheckrespondialog.value = false;
        }
    } else {
        bcheckrespondialog.value = false;
    }
}

function getresponselist(sresponlist)
{
    var bfirst = new __holder(true); 
    
    if (g_nmodel != 0 && g_omodellist.length > 0) {
        for (var i = 0; i < g_omodellist.length; i++) {
            var ocurrelem = g_omodellist[i];
            name2responlist(bfirst, ocurrelem, sresponlist);
        }
    }
    
    if (g_nobject != 0 && g_oobjdeflist.length > 0) {
        for (var i = 0; i < g_oobjdeflist.length; i++) {
            var ocurrelem = g_oobjdeflist[i];
            name2responlist(bfirst, ocurrelem, sresponlist);
        }
    }
    
    // Sorting in alphabetical order
    tablesort(sresponlist, new __holder(0), new __holder(sresponlist.value.length-1));
    
    if (bfirst.value) {
        Dialogs.MsgBox(getString("TEXT23"), Constants.MSGBOX_BTN_OK, getString("TEXT3"));
    }  
	
    return !(bfirst.value);
}

function name2responlist(bfirst, ocurrelem, sresponlist)
{
	var ocurrattr = ocurrelem.Attribute(Constants.AT_RESPON, g_nloc);
    if (ocurrattr.IsMaintained() == true) {
        var scurrrespon = ocurrattr.GetValue(false);
        
        var bnewrespon = true;
        if (sresponlist.value[0] != "") {
            for (var i = 0; i < sresponlist.value.length; i++) {
                if (StrComp(scurrrespon, sresponlist.value[i]) == 0) {
                    bnewrespon = false;
                    break;
                }
            }
        }
        
        if (bnewrespon == true) {
            bfirst.value = false;
            sresponlist.value[sresponlist.value.length] = scurrrespon;
        }
    }
}

function tablesort(ssorttable, nstart, nend)
{
// ------------------------------------------------------------------
// Subroutine TableSort
// Subprogram for sorting the tables in alphabetical order.
// Parameter
// sSortTable() = List of Strings
// nStart = Starting index of the field that is to be checked.
// nEnd = End index of the field that is to be checked.
// ------------------------------------------------------------------
	
    var ncountleft  = new __holder(nstart.value);   // Left margin.
    var ncountright = new __holder(nend.value);   // Right margin.

    var ncentercount = parseInt((nstart.value + nend.value) / 2);
    var scenter = ssorttable.value[ncentercount];
	
    var ncheck = 0;
    
    do {
        ncheck = StrCompIgnoreCase(ssorttable.value[ncountleft.value], scenter);
        
        while (ncheck == - 1) {
            ncountleft.value++;
            ncheck = StrCompIgnoreCase(ssorttable.value[ncountleft.value], scenter);
        }
        
        ncheck = StrCompIgnoreCase(ssorttable.value[ncountright.value], scenter);
        while (ncheck == 1) {
            ncountright.value--;
            ncheck = StrComp(ssorttable.value[ncountright.value], scenter);
        }
        
        if (ncountleft.value <= ncountright.value) {
            var sdummy = ssorttable.value[ncountleft.value];
            ssorttable.value[ncountleft.value] = ssorttable.value[ncountright.value];
            ssorttable.value[ncountright.value] = sdummy;
            
            ncountleft.value++;
            ncountright.value--;
        }
    }
    while (!(ncountleft.value > ncountright.value));
    
    if (nstart.value < ncountright.value) {
        tablesort(ssorttable, nstart, ncountright);
    }
    
    if (ncountleft.value < nend.value) {
        tablesort(ssorttable, ncountleft, nend);
    }
}

function StrCompIgnoreCase(Str1, Str2) {
    var tmp_Str1 = new java.lang.String(Str1);
    var res = tmp_Str1.compareToIgnoreCase(new java.lang.String(Str2));
    return (res < 0) ? -1 : ((res > 0) ? 1 : 0);
}

function createheaderfooter(srespon)
{
    // Create page header, page footer, headline and information header
    // BLUE-17783 Update report header/footer
    var borderColor = getColorByRGB( 23, 118, 191);  
    
    // graphics used in header
    var pictleft = Context.createPicture(Constants.IMAGE_LOGO_LEFT); 
    var pictright = Context.createPicture(Constants.IMAGE_LOGO_RIGHT); 
    
    // Header
    setFrameStyle(g_ooutfile, Constants.FRAME_BOTTOM);
    g_ooutfile.BeginHeader();
    g_ooutfile.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell("", 26, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.OutGraphic(pictleft, - 1, 40, 15);
    g_ooutfile.TableCell(Context.getScriptInfo(Constants.SCRIPT_TITLE), 48, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.TableCell("", 26, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.OutGraphic(pictright, - 1, 40, 15);
    g_ooutfile.EndTable("", 100, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.EndHeader();
    
    // Footer
    setFrameStyle(g_ooutfile, Constants.FRAME_TOP);
    g_ooutfile.BeginFooter();
    g_ooutfile.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell("", 26, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_DATE, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    g_ooutfile.Output(" ", getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_TIME, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    g_ooutfile.TableCell(Context.getSelectedFile(), 48, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.TableCell("", 26, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.Output(getString("TEXT24"), getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_PAGE, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
    g_ooutfile.Output(getString("TEXT25"), getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_NUMPAGES, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
    g_ooutfile.EndTable("", 100, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.EndFooter();
    
    g_ooutfile.ResetFrameStyle();
    
    // Headline
    g_ooutfile.OutputLnF("", "REPORT1");
    g_ooutfile.OutputLnF(getString("TEXT26"), "REPORT1");
    g_ooutfile.OutputLnF(srespon.value, "REPORT1");
    g_ooutfile.OutputLnF("", "REPORT1");
    
    // Information header.
    g_ooutfile.OutputLnF((getString("TEXT27") + ArisData.getActiveDatabase().ServerName()), "REPORT2");
    g_ooutfile.OutputLnF((getString("TEXT28") + ArisData.getActiveDatabase().Name(g_nloc)), "REPORT2");
    g_ooutfile.OutputLnF((getString("TEXT29") + ArisData.getActiveUser().Name(g_nloc)), "REPORT2");
    g_ooutfile.OutputLnF("", "REPORT2");
    
    
    function setFrameStyle(outfile, iFrame) { 
        outfile.SetFrameStyle(Constants.FRAME_TOP, 0); 
        outfile.SetFrameStyle(Constants.FRAME_LEFT, 0); 
        outfile.SetFrameStyle(Constants.FRAME_RIGHT, 0); 
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 0);
        
        outfile.SetFrameStyle(iFrame, 50, Constants.BRDR_NORMAL);
    } 
}


main();

