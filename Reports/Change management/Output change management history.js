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

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

__usertype_thistorytype = function() {
    this.suser = "";
    this.sdate = "";
    this.simprove = "";
    this.saction = "";
    this.snote = "";
    this.sprio = "";
    this.sstatus = "";
    this.srespon = "";
    this.sdeadl = "";
}

// global declarations
var g_nloc = Context.getSelectedLanguage();
var g_omethodfilter = ArisData.getActiveDatabase().ActiveFilter();

var g_ooutfile = null; // declare the output Object

const START   = "-----------------------------------"; 
const IMPROVE = Constants.AT_IMPROVE; 
const ACTION  = Constants.AT_ACTION_2; 
const NOTE    = Constants.AT_NOTE_2; 
const PRIO    = Constants.AT_PRIO_3; 
const STATUS  = Constants.AT_STATUS; 
const RESPON  = Constants.AT_RESPON; 
const DEADL   = Constants.AT_DEADL; 

const PATTERN_1 = "  ( "; 
const PATTERN_2 = " )"; 

var c_ncolour1 = getColorByRGB(0, 0, 128); // Colour


function main()
{
    var bwritehistory = false;
    var bouttable = new __holder(false); 	
    
    // Check function rights
    var nfuncrights = ArisData.getActiveUser().FunctionRights();
    for (var i = 0 ; i < nfuncrights.length ; i++ ){
        if (nfuncrights[i] == Constants.AT_CHG_ADMIN) {
            bwritehistory = true;
            break;
        }
    }
    
    if (! (bwritehistory)) {
        Dialogs.MsgBox(getString("TEXT1") + "\r" + getString("TEXT2"), Constants.MSGBOX_BTN_OK, getString("TEXT3"));
        Context.setScriptError(Constants.ERR_CANCEL);
    } else {
        // Get output format
        switch(Context.getSelectedFormat()) {
            case Constants.OUTTEXT:
				bouttable.value = false;
				break;
            case Constants.OutputXLS:
				bouttable.value = true;
				break;
            case Constants.OutputXLSX:
				bouttable.value = true;
				break;
            default:
				bwritehistory = userdlg(bouttable);
        }
    }
    
    // Write history
    if (bwritehistory) {
        g_ooutfile = Context.createOutputObject();
        
        // get items
        var oitemlist = ArisData.getSelectedObjDefs();          // ObjDefs
        if (oitemlist.length == 0) {
            oitemlist = ArisData.getSelectedModels();       // Models 
        }
        
        if (oitemlist.length > 0) {
            // Create page header, page footer, headline and information header
            if (! (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX)) {
                createheaderfooter();
            }

            if (bouttable.value) {
                writehistory_table(oitemlist);        	// Out table...
            } else {
                writehistory_text(oitemlist);			// Out text...
            }
            g_ooutfile.WriteReport();
        } else {
            Context.setScriptError(Constants.ERR_CANCEL);
        }

        g_omethodfilter = null;
        g_ooutfile = null;
    } else {
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}

// ******************************* TEXT ****************************************************************************

function writehistory_text(oitemlist)
{
    for (var i = 0; i < oitemlist.length; i++) {
        var ocurrentitem = oitemlist[i];
        
        var shistory = gethistory_text(ocurrentitem);        
        shistory = replaceAttrType(shistory, IMPROVE);
        shistory = replaceAttrType(shistory, ACTION);
        shistory = replaceAttrType(shistory, NOTE);
        shistory = replaceAttrType(shistory, PRIO);
        shistory = replaceAttrType(shistory, STATUS);
        shistory = replaceAttrType(shistory, RESPON);
        shistory = replaceAttrType(shistory, DEADL);
        
        shistory = replacehistorystatus(shistory);
        
        g_ooutfile.OutputLn(ocurrentitem.Name(g_nloc), getString("TEXT4"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        g_ooutfile.OutputLn(getString("TEXT5") + ocurrentitem.Type(), getString("TEXT4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 10);
        g_ooutfile.OutputLn(getString("TEXT6") + ocurrentitem.Group().Path(g_nloc), getString("TEXT4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 10);
        g_ooutfile.OutputLn("", getString("TEXT4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        
        g_ooutfile.OutputLn(shistory, getString("TEXT4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 10);
    }
}

function gethistory_text(ocurrentitem)
{
    var ocurrentattribute = ocurrentitem.Attribute(Constants.AT_HISTORY, g_nloc);
    if (ocurrentattribute.IsMaintained()) {
        return ocurrentattribute.GetValue(false);
    }   
    return "";
}

// ******************************* TABLE ***************************************************************************

function writehistory_table(oitemlist)
{
    g_ooutfile.DefineF("BOLD", getString("TEXT4"), 8, Constants.C_WHITE, c_ncolour1, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("STANDARD", getString("TEXT4"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1);
    
    for (var i = 0; i < oitemlist.length; i++) {
        var ocurrentitem = oitemlist[i];
		var nwidth1 = 0; var nwidth2 = 0; 
        
        if (! (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX)) {
            g_ooutfile.OutputLn(ocurrentitem.Name(g_nloc), getString("TEXT4"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            g_ooutfile.OutputLn(getString("TEXT5") + ocurrentitem.Type(), getString("TEXT4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 10);
            g_ooutfile.OutputLn((getString("TEXT6") + ocurrentitem.Group().Path(g_nloc)), getString("TEXT4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 10);
            g_ooutfile.OutputLn("", getString("TEXT4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            
            nwidth1 = 10;
            nwidth2 = 13;
        } else {
            nwidth1 = 25;
            nwidth2 = 30;
        }

        var thistory = gethistory_table(ocurrentitem);		// __usertype_thistorytype()
        
        g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        g_ooutfile.TableRow();
        g_ooutfile.TableCellF((""+getString("TEXT7")).toUpperCase(), nwidth1, "BOLD");
        g_ooutfile.TableCellF((""+getString("TEXT8")).toUpperCase(), nwidth1, "BOLD");
        g_ooutfile.TableCellF(getAttrTypeName(IMPROVE), nwidth2, "BOLD");
        g_ooutfile.TableCellF(getAttrTypeName(ACTION), nwidth2, "BOLD");
        g_ooutfile.TableCellF(getAttrTypeName(NOTE), nwidth2, "BOLD");
        g_ooutfile.TableCellF(getAttrTypeName(PRIO), nwidth1, "BOLD");
        g_ooutfile.TableCellF(getAttrTypeName(STATUS), nwidth1, "BOLD");
        g_ooutfile.TableCellF(getAttrTypeName(RESPON), nwidth1, "BOLD");
        g_ooutfile.TableCellF(getAttrTypeName(DEADL), nwidth1, "BOLD");
        
        if (thistory.length > 0 && thistory[0].suser.length > 0) {
            for (var j = 0; j < thistory.length; j++) {
                g_ooutfile.TableRow();
                g_ooutfile.TableCellF(thistory[j].suser, nwidth1, "STANDARD");
                g_ooutfile.TableCellF(thistory[j].sdate, nwidth1, "STANDARD");
                g_ooutfile.TableCellF(thistory[j].simprove, nwidth2, "STANDARD");
                g_ooutfile.TableCellF(thistory[j].saction, nwidth2, "STANDARD");
                g_ooutfile.TableCellF(thistory[j].snote, nwidth2, "STANDARD");
                g_ooutfile.TableCellF(thistory[j].sprio, nwidth1, "STANDARD");
                g_ooutfile.TableCellF(thistory[j].sstatus, nwidth1, "STANDARD");
                g_ooutfile.TableCellF(thistory[j].srespon, nwidth1, "STANDARD");
                g_ooutfile.TableCellF(thistory[j].sdeadl, nwidth1, "STANDARD");
            }
        }
        
        if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) {
            g_ooutfile.EndTable(ocurrentitem.Name(g_nloc), 100, getString("TEXT4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        }
        else {
            g_ooutfile.EndTable("", 100, getString("TEXT4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        }
    }
}

function gethistory_table(ocurrentitem)
{
    thistory = new Array();		// __usertype_thistorytype() 
    
    var ocurrentattribute = ocurrentitem.Attribute(Constants.AT_HISTORY, g_nloc);
    if (ocurrentattribute.IsMaintained()) {
		var shistory = new __holder(ocurrentattribute.GetValue(false));
        
        var bnextentry = false; 
        
        bnextentry = true;
        while (bnextentry) {
			var shistoryentry = new __holder("");
            bnextentry = getcurrenthistoryentry(shistory, shistoryentry);
            thistory[thistory.length] = gettableentries(shistoryentry);
        }        
    }
    return thistory;
}

function getcurrenthistoryentry(shistory, shistoryentry)
{
    shistory.value = ""+shistory.value;
    var ssearch = ""+START;
    var npos_start = shistory.value.indexOf(ssearch, ssearch.length);
    
    if (npos_start >= 0) {
        shistoryentry.value = shistory.value.substr(0, npos_start);
        shistory.value = shistory.value.substr(npos_start);
        
		return true;
    } else {
        shistoryentry.value = shistory.value;
        shistory.value = "";        
        
		return false;
    }
}

function gettableentries(shistoryentry)
{   
    var thistory = new __usertype_thistorytype(); 

    var ssearch = START;
    shistoryentry.value = shistoryentry.value.substr(ssearch.length);
    
    var suserdate = getcurrenttableentry(shistoryentry, IMPROVE);
    var npos1 = suserdate.indexOf(PATTERN_1);
    var npos2 = suserdate.indexOf(PATTERN_2);

    thistory.suser = suserdate.substr(0, npos1);
    npos1 = (npos1 + PATTERN_1.length);
    thistory.sdate = suserdate.substr(npos1, npos2 - npos1);
    
    thistory.simprove = getcurrenttableentry(shistoryentry, ACTION);
    thistory.saction = getcurrenttableentry(shistoryentry, NOTE);
    thistory.snote = getcurrenttableentry(shistoryentry, PRIO);
    thistory.sprio = getcurrenttableentry(shistoryentry, STATUS);

    var shistoryStatus = getcurrenttableentry(shistoryentry, RESPON);
    shistoryStatus = replacehistorystatus(shistoryStatus);
    
    thistory.sstatus = shistoryStatus;  
    
    thistory.srespon = getcurrenttableentry(shistoryentry, DEADL);
    
    thistory.sdeadl = shistoryentry.value;
    ssearch = ("\r\n" + "\r\n");
    if (StrComp(thistory.sdeadl.substr(thistory.sdeadl.length - ssearch.length), ssearch) == 0) {
        thistory.sdeadl = shistoryentry.value.substr(0, shistoryentry.value.length - ssearch.length);
    }
    return thistory;
}

function getcurrenttableentry(shistoryentry, snexttag)
{
    var ssearch =   "<" + snexttag + ">" ;
    var nnextpos = shistoryentry.value.indexOf(ssearch);
    
    var stableentry = shistoryentry.value.substr(0, nnextpos);
    shistoryentry.value = shistoryentry.value.substr(stableentry.length + ssearch.length);
    
    return ""+stableentry;
}

// ******************************* COMMON ***************************************************************************

function replacehistorystatus(shistory)
{   
    var ssearch = "<" + STATUS + "|";
    
    var nstartpos = shistory.indexOf(ssearch);
    while (nstartpos >= 0) {
        var nendpos = shistory.indexOf(">", nstartpos);
        if (nendpos >= 0) {
            var nstatuspos = nstartpos + ssearch.length;
            var sstatus = shistory.substr(nstatuspos, nendpos - nstatuspos);
            
            if (!isNaN(sstatus)) {
                sstatus = g_omethodfilter.AttrValueType(parseInt(sstatus));                
                shistory = shistory.substr(0, nstartpos) + sstatus + shistory.substr(nendpos+1);
            }
        }
        nstartpos = shistory.indexOf(ssearch, nendpos);
    }
    return shistory;
}

function getAttrTypeName(atn) {
    return (""+g_omethodfilter.AttrTypeName(atn)).toUpperCase();
}

function replaceAttrType(shistoryValue, atn) {
    var pattern = "<" + atn + ">";
    return (""+shistoryValue).replace(pattern, getAttrTypeName(atn));
}

function createheaderfooter()
{
    // Create page header, page footer, headline and information header
    // BLUE-17783 Update report header/footer
    var borderColor = getColorByRGB( 23, 118, 191);  
    
    // graphics used in header
    var pictleft = Context.createPicture(Constants.IMAGE_LOGO_LEFT);
    var pictright = Context.createPicture(Constants.IMAGE_LOGO_RIGHT);
    
    g_ooutfile.DefineF("REPORT1", getString("TEXT4"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
    g_ooutfile.DefineF("REPORT2", getString("TEXT4"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    
    // Header
    setFrameStyle(g_ooutfile, Constants.FRAME_BOTTOM);
    g_ooutfile.BeginHeader();
    g_ooutfile.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell("", 26, getString("TEXT4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.OutGraphic(pictleft, - 1, 40, 15);
    g_ooutfile.TableCell(Context.getScriptInfo(Constants.SCRIPT_TITLE), 48, getString("TEXT4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.TableCell("", 26, getString("TEXT4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.OutGraphic(pictright, - 1, 40, 15);
    g_ooutfile.EndTable("", 100, getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.EndHeader();
    
    // Footer
    setFrameStyle(g_ooutfile, Constants.FRAME_TOP);
    g_ooutfile.BeginFooter();
    g_ooutfile.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell("", 26, getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_DATE, getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    g_ooutfile.Output(" ", getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_TIME, getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    g_ooutfile.TableCell(Context.getSelectedFile(), 48, getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.TableCell("", 26, getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.Output(getString("TEXT9"), getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_PAGE, getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
    g_ooutfile.Output(getString("TEXT10"), getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_NUMPAGES, getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
    g_ooutfile.EndTable("", 100, getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.EndFooter();
    
    g_ooutfile.ResetFrameStyle();
    
    // Headline
    g_ooutfile.OutputLnF("", "REPORT1");
    g_ooutfile.OutputLnF(getString("TEXT3"), "REPORT1");
    g_ooutfile.OutputLnF("", "REPORT1");
    
    // Information header.
    g_ooutfile.OutputLnF((getString("TEXT11") + ArisData.getActiveDatabase().ServerName()), "REPORT2");
    g_ooutfile.OutputLnF((getString("TEXT12") + ArisData.getActiveDatabase().Name(g_nloc)), "REPORT2");
    g_ooutfile.OutputLnF((getString("TEXT13") + ArisData.getActiveUser().Name(g_nloc)), "REPORT2");
    g_ooutfile.OutputLnF("", "REPORT2");
    
    
    function setFrameStyle(outfile, iFrame) { 
        outfile.SetFrameStyle(Constants.FRAME_TOP, 0); 
        outfile.SetFrameStyle(Constants.FRAME_LEFT, 0); 
        outfile.SetFrameStyle(Constants.FRAME_RIGHT, 0); 
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 0);
        
        outfile.SetFrameStyle(iFrame, 50, Constants.BRDR_NORMAL);
    }  
}

function userdlg(bouttable)
{ 
    var userdialog = Dialogs.createNewDialogTemplate(0, 0, 340, 150, getString("TEXT14"));
    // %GRID:10,7,1,1
    userdialog.Text(10, 10, 320, 30, getString("TEXT15"));
    userdialog.GroupBox(7, 55, 320, 55, getString("TEXT16"));
    userdialog.OptionGroup("options");
    userdialog.OptionButton(20, 70, 200, 15, getString("TEXT17"));
    userdialog.OptionButton(20, 85, 200, 15, getString("TEXT18"));
    userdialog.OKButton();
    userdialog.CancelButton();
    //  userdialog.HelpButton("HID_4fcd9380_eae6_11d8_12e0_9d2843560f51_dlg_01.hlp");
    
    var dlg = Dialogs.createUserDialog(userdialog); 
    
    // Read dialog settings from config
    var sSection = "SCRIPT_4fcd9380_eae6_11d8_12e0_9d2843560f51";  
    ReadSettingsDlgValue(dlg, sSection, "options", 0);
    
    var nuserdlg = Dialogs.show( __currentDialog = dlg);		// Show dialog (wait for ok)
    
    bouttable.value = parseInt(dlg.getDlgValue("options")) == 0; 
    
    if (nuserdlg == 0) {
        return false;
    } else {
        // Write dialog settings to config      
        WriteSettingsDlgValue(dlg, sSection, "options");
		return true;		
    }
}


main();