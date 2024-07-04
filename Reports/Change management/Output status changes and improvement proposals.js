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

// DIALOG variables
var dicSelection = "optSelection";
var dicModelsOrObjects = "optModelsOrObjects";
var dicSort = "lstSort";
var dicDevList = "lstDevList";
var dicEvalList = "lstEvalList";
var dicAdd = "butAdd";
var dicDelete = "butDelete";
var dicChkRecursive = "chkRecursive";

// create and initialize the output Object and variable for selected language
var g_nloc       = Context.getSelectedLanguage();
var g_noutformat = Context.getSelectedFormat();
var g_ooutfile   = Context.createOutputObject();

var g_omodellist = null; 
var g_oobjdeflist = null; 

var g_omethodfilter = ArisData.getActiveDatabase().ActiveFilter();

var g_sdevlist = new Array(); 
var g_sevallist = new Array(); 
var g_ndevlist = new Array(); 
var g_nevallist = new Array(); 
var g_nsort = 0; 
var g_nrecursion = 0; 

var g_ntype = - 11;
var g_stype = getString("TEXT6");
var g_nwidth = 30;
var g_ncolour1 = getColorByRGB(0, 0, 128); 

var txtName   = getString("TEXT1");
var txtIdent  = getString("TEXT2");
var txtType   = getString("TEXT3")
var txtRemark = getString("TEXT4");
var txtStatus = getString("TEXT5");


main();

// -------------------------------------------------------------------------


function main() {
    var bcheckuserdialog = new __holder(false); 
    
    if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) {
        var holder_nOptSelection        = new __holder(0);
        var holder_nOptModelsOrObjects  = new __holder(0);
        var holder_nAttributes          = new __holder(0);
        var holder_nOptSort             = new __holder(0);
        var holder_bRecursive           = new __holder(false);
        
        var bChoice = userdlg(holder_nOptSelection, holder_nOptModelsOrObjects, holder_nAttributes, holder_nOptSort, holder_bRecursive);
        
        var nOptSelection       = holder_nOptSelection.value;
        var nOptModelsOrObjects = holder_nOptModelsOrObjects.value;
        var nAttributes         = holder_nAttributes.value;
        var nOptSort            = holder_nOptSort.value;
        var bRecursive          = holder_bRecursive.value;
        
        if (bChoice) {
            if (nOptModelsOrObjects==0 || nOptModelsOrObjects==1) {
                g_omodellist = new Array();
            }
            if (nOptModelsOrObjects==0 || nOptModelsOrObjects==2) {
                g_oobjdeflist = new Array();
            }
            
            // iterate through oSelectedGroups
            var oselectedgroups = ArisData.getSelectedGroups();
            if (oselectedgroups.length > 0) {
                for (var i = 0 ; i < oselectedgroups.length ; i++ ) {
                    var ocurrgroup = oselectedgroups[i];
                    
                    if (nOptModelsOrObjects==0 || nOptModelsOrObjects==1) {
                        getmodellist(ocurrgroup, bRecursive, nOptSelection);
                    }
                    
                    if (nOptModelsOrObjects==0 || nOptModelsOrObjects==2) {
                        getobjdeflist(ocurrgroup, bRecursive, nOptSelection);
                    }
                }
                
                var boutmodel = false, boutobjdef = false; 
                
                if (nOptModelsOrObjects==0 || nOptModelsOrObjects==1) {
                    if (nOptSelection == 0) {
                        boutmodel = outImprovementsOrStatus(g_omodellist, getString("TEXT11"), getString("TEXT15")); // out status 
                    } else if (nOptSelection == 1) {
                        boutmodel = outImprovementsOrStatus(g_omodellist, getString("TEXT11"), getString("TEXT12")); // out improvements
                    }
                }
                
                if (nOptModelsOrObjects==0 || nOptModelsOrObjects==2) {
                    if (nOptSelection == 0) {
                        boutobjdef = outImprovementsOrStatus(g_oobjdeflist, getString("TEXT13"), getString("TEXT16")); // out status 
                    } else if (nOptSelection == 1) {
                        boutobjdef = outImprovementsOrStatus(g_oobjdeflist, getString("TEXT13"), getString("TEXT14")); // out improvements
                    }
                }
                
                if (boutmodel == true || boutobjdef == true) {
                    
                    if (nOptSelection == 0) {
                        updatelaststatus(nOptModelsOrObjects);
                    }
                    
                    g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
                } else {
                    Context.setScriptError(Constants.ERR_CANCEL);
                }
            } else {
                Dialogs.MsgBox(getString("TEXT7"), Constants.MSGBOX_BTN_OK, getString("TEXT8"));
                Context.setScriptError(Constants.ERR_CANCEL);
            }
        } else {
            Context.setScriptError(Constants.ERR_CANCEL);
        }
    } else {
        Dialogs.MsgBox(getString("TEXT9"), Constants.MSGBOX_BTN_OK, getString("TEXT8"));
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}

function getmodellist(ocurrgroup, bRecursive, nOptSelection) {
    var ocurrmodels = ocurrgroup.ModelList(bRecursive);     // BLUE-16023
    for (var i = 0 ; i < ocurrmodels.length ; i++ ) {
        var ocurrmodel = ocurrmodels[i];
        
        if (nOptSelection == 0) {       // Statusaenderungen
            var sstatus = ""; 
            var slaststatus = "";       
            
            if (ocurrmodel.Attribute(Constants.AT_STATUS, g_nloc).IsMaintained()) {
                sstatus = "" + ocurrmodel.Attribute(Constants.AT_STATUS, g_nloc).GetValue(false);
                
                if (ocurrmodel.Attribute(Constants.AT_LAST_STATUS, g_nloc).IsMaintained()) {
                    slaststatus = "" + ocurrmodel.Attribute(Constants.AT_LAST_STATUS, g_nloc).GetValue(false);
                }
                // Attribut check
                if (StrComp(sstatus, slaststatus) != 0) {               
                    g_omodellist.push(ocurrmodel);
                }
            }
        } else {
            // Verbesserungen
            if (ocurrmodel.Attribute(Constants.AT_STATUS, g_nloc).IsMaintained()) {
                g_omodellist.push(ocurrmodel);
            }          
        }
    }
}

function getobjdeflist(ocurrgroup, bRecursive, nOptSelection) {
    var ocurrobjdefs = ocurrgroup.ObjDefList(bRecursive);     // BLUE-16023
    for (var i = 0 ; i < ocurrobjdefs.length ; i++ ) {
        var ocurrobjdef = ocurrobjdefs[i];
        
        if (nOptSelection == 0) {       // Statusaenderungen
            var sstatus = ""; 
            var slaststatus = "";        
            
            if (ocurrobjdef.Attribute(Constants.AT_STATUS, g_nloc).IsMaintained()) {
                sstatus = "" + ocurrobjdef.Attribute(Constants.AT_STATUS, g_nloc).GetValue(false);
                
                if (ocurrobjdef.Attribute(Constants.AT_LAST_STATUS, g_nloc).IsMaintained()) {
                    slaststatus = "" + ocurrobjdef.Attribute(Constants.AT_LAST_STATUS, g_nloc).GetValue(false);
                }
                // Attribut check
                if (StrComp(sstatus, slaststatus) != 0) {
                    g_oobjdeflist.push(ocurrobjdef);
                }        
            }
        } else {
            // Verbesserungen          
            if (ocurrobjdef.Attribute(Constants.AT_STATUS, g_nloc).IsMaintained()) {
                g_oobjdeflist.push(ocurrobjdef);
            }      
        }    
    }
}

function outImprovementsOrStatus(oitemList, sLabel, sErrorText) {   
    if (oitemList.length > 0) {  
        // Sort        
        if (g_nsort == g_ntype) {
            oitemList.sort(sortByPath);
        } else {
            if (g_nsort != null) oitemList.sort(new ArraySortComparator(g_nsort, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc).compare);            
        }
        
        // Output
        g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        
        var colHeadings = new Array();
        for (var i = 0 ; i < g_sevallist.length ; i++ ) {
            colHeadings.push(g_sevallist[i]);
        }
        writeTableHeaderWithColor(g_ooutfile, colHeadings, 12, g_ncolour1, Constants.C_WHITE);
        
        for (var i = 0 ; i < oitemList.length ; i++ ) {
            var ocurrItem = oitemList[i];
            
            g_ooutfile.TableRow();
            var ncolour2 = getcurrentcolour(i + 1);
            
            for (var j = 0 ; j < g_nevallist.length ; j++ ) {
                if (g_nevallist[j] == g_ntype) {
                    g_ooutfile.TableCell(ocurrItem.Group().Path(g_nloc), g_nwidth, getString("TEXT10"), 12, Constants.C_BLACK, ncolour2, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                } else {
                    var ocurrAttr = ocurrItem.Attribute(g_nevallist[j], g_nloc);
                    if (ocurrAttr.IsMaintained()) {
                        g_ooutfile.TableCell(ocurrAttr.GetValue(false), g_nwidth, getString("TEXT10"), 12, Constants.C_BLACK, ncolour2, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    } else {
                        g_ooutfile.TableCell("", g_nwidth, getString("TEXT10"), 12, Constants.C_BLACK, ncolour2, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    }
                }
            }
        }
        
        g_ooutfile.EndTable(sLabel, 100, getString("TEXT10"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        return true;
    }
    else {
        Dialogs.MsgBox(sErrorText, Constants.MSGBOX_BTN_OK, getString("TEXT8"));
        return false;
    }
}

function sortByPath(a,b) {
    var tmp_lhs = new java.lang.String(a.Group().Path(g_nloc));
    return tmp_lhs.compareTo(new java.lang.String(b.Group().Path(g_nloc)));
}

function userdlg(holder_nOptSelection, holder_nOptModelsOrObjects, holder_nAttributes, holder_nOptSort, holder_bRecursive) {
    var userdialog = Dialogs.createNewDialogTemplate(500, 365, getString("TEXT17"), "dlgFuncOutputOptions");
    
    userdialog.OptionGroup(dicSelection);
    userdialog.OptionButton(30, 10, 280, 15, getString("TEXT18"));
    userdialog.OptionButton(30, 25, 280, 15, getString("TEXT19"));
    
    userdialog.GroupBox(10, 50, 480, 65, getString("TEXT20"));
    userdialog.OptionGroup(dicModelsOrObjects);
    userdialog.OptionButton(30, 65, 280, 15, getString("TEXT21"));
    userdialog.OptionButton(30, 80, 280, 15, getString("TEXT11"));
    userdialog.OptionButton(30, 95, 280, 15, getString("TEXT13"));
    
    userdialog.GroupBox(10, 125, 480, 220, getString("TEXT22"));
    userdialog.ListBox(20, 140, 170, 170, g_sdevlist, dicDevList, 1);
    userdialog.ListBox(300, 140, 170, 170, g_sevallist, dicEvalList, 1);
    
    userdialog.Text(210, 320, 90, 15, getString("TEXT23"));
    userdialog.DropListBox(300, 320, 170, 80, g_sevallist, dicSort);
    userdialog.CheckBox(20, 350, 260, 15, getString("TEXT24"), dicChkRecursive);
    
    userdialog.PushButton(192, 180, 105, 21, getString("TEXT25"), dicAdd);
    userdialog.PushButton(192, 210, 105, 21, getString("TEXT26"), dicDelete);
    userdialog.OKButton();
    userdialog.CancelButton();
//    userdialog.HelpButton("HID_1a88abd0_427d_11d9_74b9_000f1f28afc9_dlg_01.hlp");    
    
    var dlg = Dialogs.createUserDialog(userdialog); 

    // Read dialog settings from config
    var sSection = "SCRIPT_1a88abd0_427d_11d9_74b9_000f1f28afc9";  
    ReadSettingsDlgValue(dlg, sSection, dicSelection, holder_nOptSelection.value);
    ReadSettingsDlgValue(dlg, sSection, dicModelsOrObjects, holder_nOptModelsOrObjects.value);
    ReadSettingsDlgValue(dlg, sSection, dicChkRecursive, holder_bRecursive.value?1:0);
//    ReadSettingsDlgValue(dlg, sSection, dicSort, holder_nOptSort.value);  /*see DialogFunc*/
    
    var  nuserdlg = Dialogs.show( __currentDialog = dlg);  // Show dialog (wait for ok).
    
    holder_nOptSelection.value       = dlg.getDlgValue(dicSelection);
    holder_nOptModelsOrObjects.value = dlg.getDlgValue(dicModelsOrObjects);
    holder_nOptSort.value            = dlg.getDlgValue(dicSort);
    holder_bRecursive.value          = dlg.getDlgValue(dicChkRecursive)!=0;
    
    if (g_nsort == 0) {
        g_nsort = g_nevallist[0];
    }
    
    if (nuserdlg!=0) {
        // Write evaluated attributes to registry
        var soutstring = "";
        for ( i = 0 ; i < g_nevallist.length ; i++ ) {
            soutstring = soutstring + g_nevallist[i] + ";";
        }
        // Write dialog settings to config
        WriteSettingsDlgValue(dlg, sSection, dicSelection);
        WriteSettingsDlgValue(dlg, sSection, dicModelsOrObjects);
        WriteSettingsDlgValue(dlg, sSection, dicChkRecursive);
        WriteSettingsDlgValue(dlg, sSection, dicSort);
        Context.writeProfileString(sSection, "EvaluatedAttributes", soutstring);
    }
    return nuserdlg != 0;
}

function dlgFuncOutputOptions(dlgitem, action, suppvalue) {
    var result = false;
    
    switch(action) {
        case 1:
            getevallist();      // Loading the pre-configured settings of the list to be evaluated from the registry
            createdevlist();    // Create the reference list

            __currentDialog.setDlgEnable(dicAdd, false);
            __currentDialog.setDlgEnable(dicDelete, false);
            
            __currentDialog.setDlgListBoxArray(dicSort, g_sevallist);
            __currentDialog.setDlgListBoxArray(dicDevList, g_sdevlist);
            __currentDialog.setDlgListBoxArray(dicEvalList, g_sevallist);
            
            var sSection = "SCRIPT_1a88abd0_427d_11d9_74b9_000f1f28afc9";  
            ReadSettingsDlgValue(__currentDialog, sSection, dicSort, 0);
            
            break;
        case 2:
            switch(dlgitem) {
                case "OK":
                case "Cancel":
                    result = false; 
                    break;
                case dicSort:
                    if (suppvalue >= 0 && suppvalue < g_nevallist.length) {
                        g_nsort = g_nevallist[suppvalue];
                    }
                    break;
                case dicDevList:
                    __currentDialog.setDlgEnable(dicAdd, true);
                    __currentDialog.setDlgEnable(dicDelete, false);
                    result = true; 
                    break;
                case dicEvalList:
                    __currentDialog.setDlgEnable(dicAdd, false);
                    __currentDialog.setDlgEnable(dicDelete, true);
                    result = true; 
                    break;
                case dicAdd:
                    var nAdds = __currentDialog.getDlgSelection(dicDevList)
                    if (nAdds.length > 0) {
                            for (var i = 0 ; i < nAdds.length ; i++ ) {  
                                g_sevallist.push(g_sdevlist[nAdds[i]]);
                                g_nevallist.push(g_ndevlist[nAdds[i]]);
                            }
                            createdevlist();                 // Create the reference list
                    } else {
                        Dialogs.MsgBox(getString("TEXT28"), Constants.MSGBOX_BTN_OK, getString("TEXT8"));
                    }
                    __currentDialog.setDlgEnable(dicAdd, false);
                    __currentDialog.setDlgListBoxArray(dicEvalList, g_sevallist);
                    __currentDialog.setDlgListBoxArray(dicSort, g_sevallist);
                    __currentDialog.setDlgListBoxArray(dicDevList, g_sdevlist);
                    result = true; 
                    break;
                case dicDelete:
                    var nDels = __currentDialog.getDlgSelection(dicEvalList)
                    if (nDels.length > 0) {
                            g_sevallist = deleteArrayEntries(g_sevallist, nDels);
                            g_nevallist = deleteArrayEntries(g_nevallist, nDels);                            
                            
                            createdevlist();                 // Create the reference list
                    } else {
                        Dialogs.MsgBox(getString("TEXT29"), Constants.MSGBOX_BTN_OK, getString("TEXT8"));
                    }
                    __currentDialog.setDlgEnable(dicDelete, false);                    
                    __currentDialog.setDlgListBoxArray(dicEvalList, g_sevallist);
                    __currentDialog.setDlgListBoxArray(dicSort, g_sevallist);
                    __currentDialog.setDlgListBoxArray(dicDevList, g_sdevlist);
                    result = true; 
                    break;
            }
            break;
    }
    
    return result;
}

function deleteArrayEntries(aOldArray, nDels) {
    var aNewArray = new Array();
    
    for (var i = 0 ; i < aOldArray.length ; i++ ) {
        var bAdd = true;
        for (var j = 0 ; j < nDels.length ; j++ ) {        
            if (i == nDels[j]) {
                bAdd = false;
                break;
            }
        }
        if (bAdd)
            aNewArray.push(aOldArray[i]);
    }
    return aNewArray;
}

function createdevlist() {
// --------------------------------------------------------------
// Sub to create the reference list.
// --------------------------------------------------------------
    var nreflist = new Array(); 
    nreflist.push(Constants.AT_NAME);
    nreflist.push(Constants.AT_ID);
    nreflist.push(Constants.AT_TYPE_6);
    nreflist.push(g_ntype);
    nreflist.push(Constants.AT_STATUS);
    nreflist.push(Constants.AT_PRIO_3);
    nreflist.push(Constants.AT_DEADL);
    nreflist.push(Constants.AT_ACTION_2);
    nreflist.push(Constants.AT_RESPON);
    nreflist.push(Constants.AT_IMPROVE);
    nreflist.push(Constants.AT_REGIST);
    nreflist.push(Constants.AT_NOTE_2);
    
    g_ndevlist = new Array(); 
    g_sdevlist = new Array();
    
    for ( i = 0 ; i < nreflist.length ; i++ ) {
        var binevallist = false;
        
        for (var j = 0 ; j < g_nevallist.length ; j++ ) {
            if (nreflist[i] == g_nevallist[j]) {
                binevallist = true;
                break;
            }
        }
        
        if (! (binevallist)) {
            g_ndevlist.push(nreflist[i]);
            
            if (nreflist[i] != g_ntype) {
                g_sdevlist.push(g_omethodfilter.AttrTypeName(nreflist[i]));
            } else {
                g_sdevlist.push(g_stype);
            }
        }
    }
}

function getevallist() {
// --------------------------------------------------------------------------------
// Subprogram GetEvalList for loading the pre-configured settings of the list
// to be evaluated from the registry.
// --------------------------------------------------------------------------------
    g_nevallist = new Array(); 
    g_sevallist = new Array(); 

    var sSection = "SCRIPT_1a88abd0_427d_11d9_74b9_000f1f28afc9";    
    var sgetstring = "" + Context.getProfileString(sSection, "EvaluatedAttributes", "");
    
    if (! (sgetstring == "")) {
        while (sgetstring.indexOf(";") >= 0) {
            var ncpos = sgetstring.indexOf(";");
            var nlen = sgetstring.length;
            
            var sstorestr = "" + sgetstring.substr(0, ncpos);
            var sgetstring = "" + sgetstring.substr(ncpos+1);
            
            var nstorestr = Number(sstorestr)
            g_nevallist.push(nstorestr);
            
            if (nstorestr != g_ntype) {
                g_sevallist.push(g_omethodfilter.AttrTypeName(nstorestr));
            } else {
                g_sevallist.push(g_stype);
            }
        }
    }
}

function getcurrentcolour(nrow) {
    var ncolour = 0; 
    var nresult = nrow % 2;
    
    if (nresult == 0) {
        ncolour = getColorByRGB(153, 204, 255);
    } else {
        ncolour = Constants.C_TRANSPARENT;
    }
    return ncolour;
}

function updatelaststatus(nOptModelsOrObjects) {
    if (!showUpdateMessage(nOptModelsOrObjects)) return;
    
    if (nOptModelsOrObjects==0 || nOptModelsOrObjects==1) {
        if (g_omodellist.length > 0) {
            for (var i = 0 ; i < g_omodellist.length ; i++ ) {
                var ocurrmodel = g_omodellist[i];
                
                var oattrstatus = ocurrmodel.Attribute(Constants.AT_STATUS, g_nloc);
                if (oattrstatus.IsMaintained()) {
                    var sstatus = "" + oattrstatus.GetValue(false);
                    
                    var oattrlaststat = ocurrmodel.Attribute(Constants.AT_LAST_STATUS, g_nloc);
                    if (oattrlaststat.IsValid() == true) {
                        oattrlaststat.setValue(sstatus);
                    }
                }
            }
        }
    }
    if (nOptModelsOrObjects==0 || nOptModelsOrObjects==2) {
        if (g_oobjdeflist.length > 0) {
            for (var i = 0 ; i < g_oobjdeflist.length ; i++ ) {
                var ocurrobjdef = g_oobjdeflist[i];
                
                var oattrstatus = ocurrobjdef.Attribute(Constants.AT_STATUS, g_nloc);
                if (oattrstatus.IsMaintained()) {
                    var sstatus = oattrstatus.GetValue(false);
                    
                    var oattrlaststat = ocurrobjdef.Attribute(Constants.AT_LAST_STATUS, g_nloc);
                    if (oattrlaststat.IsValid() == true) {
                        oattrlaststat.setValue(sstatus);
                    }
                }
            }
        }
    }
    
    function showUpdateMessage(nOptModelsOrObjects) {
        var sresetstatustext = null;
        
        switch(nOptModelsOrObjects) {
            case 0:
            sresetstatustext = getString("TEXT30");
            break;
            case 1:
            sresetstatustext = getString("TEXT31");
            break;
            case 2:
            sresetstatustext = getString("TEXT32");
            break;
        }
        
        if(sresetstatustext!=null) {
            var nchoice = Dialogs.MsgBox(sresetstatustext, Constants.MSGBOX_BTN_YESNO, getString("TEXT8"));
            if(nchoice==6) return true;
        }
        return false;
    }
}
