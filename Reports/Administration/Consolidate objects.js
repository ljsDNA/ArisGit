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

__usertype_toptiontype = function() {
    this.bchildgroups = false;
    this.bcasesensitive = false;
    this.bignore = false;
    this.nattrtype = 0;
    this.bconsol_1 = false;
    this.bconsol_2 = false;
    this.bconsol_3 = false;
    this.bprotocol = false;
}

__usertype_tobjectstype = function() {
    this.oobjdef = null;
    this.stypename = "";
}

var g_omethodfilter = ArisData.getActiveDatabase().ActiveFilter();
var g_nloc = Context.getSelectedLanguage();
var g_ooutfile = null; 

var g_bConsolidationError = false;
var g_bfoundobjects = false; // Objects found to consolidate?
var g_toption = new __usertype_toptiontype(); 

var g_sattrlist = new  Array(); 
var g_nattrlist = new Array(); 

const c_UML2_META_MODEL = 2; // UML 2.5
var g_umlObjTypeSet = getUmlObjTypeSet();           // BLUE-6085


function main()
{
    g_bfoundobjects = false;		// Init: no objects; see also function ConsolidateObjects()
        
    if (dialog_getoptions(g_toption)) {
        
        var smsgtext = getString("TEXT1") + "\r" + getString("TEXT2");
        if (Dialogs.MsgBox(smsgtext, Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_QUESTION, getString("TEXT3")) == Constants.MSGBOX_RESULT_OK) {
            
            if (g_toption.bprotocol) {
                g_ooutfile = Context.createOutputObject(Context.getSelectedFormat(), Context.getSelectedFile());
                g_ooutfile.Init(g_nloc);
                
                g_ooutfile.DefineF("Out", getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
                
                g_ooutfile.OutputLnF(Context.getScriptInfo(Constants.SCRIPT_TITLE), "Out");
                g_ooutfile.OutputLnF("", "Out");
                g_ooutfile.OutputField(Constants.FIELD_DATE, getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
                g_ooutfile.Output(" ", getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
                g_ooutfile.OutputField(Constants.FIELD_TIME, getString("TEXT4"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
                g_ooutfile.OutputLnF("", "Out");
                g_ooutfile.OutputLnF("", "Out");
                g_ooutfile.OutputLnF((getString("TEXT5") + ArisData.getActiveDatabase().ServerName()), "Out");
                g_ooutfile.OutputLnF((getString("TEXT6") + ArisData.getActiveDatabase().Name(g_nloc)), "Out");
                g_ooutfile.OutputLnF((getString("TEXT7") + ArisData.getActiveUser().Name(g_nloc)), "Out");
            }
            
            var oselectedgroups = ArisData.getSelectedGroups();            
            for (var i = 0; i < oselectedgroups.length; i++)
            {
                tobjects = new Array(); 
                
                var oobjdeflist = filterOutUmlObjects(oselectedgroups[i].ObjDefList(g_toption.bchildgroups/*bRecursive*/));       // BLUE-6085
                if (oobjdeflist.length > 0) 
                {
                    tobjects = getobjectarray(oobjdeflist);     // Array of sorted ObjDefs and types/names
                    tobjects = tobjects.sort(sortByTypeName);   // use sort function
                    
                    consolidateobjects(tobjects);               // Consolidate objects
                }                
            }
            
            if (g_toption.bprotocol) {
                
                if (!g_bfoundobjects) {
                    g_ooutfile.OutputLnF("\r\n" + getString("TEXT8"), "Out");
                }
                g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
            } else {
                Context.setScriptError(Constants.ERR_NOFILECREATED);
            }
            
            if (g_bConsolidationError) {
                Dialogs.MsgBox(getString("TEXT26"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_ERROR, getString("TEXT3"));
            }
        }        
    } else {
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}

function getobjectarray(oobjdeflist)
{
    var tobjects = new Array();   

    for (var i = 0; i < oobjdeflist.length; i++)
    {
        var oobjdef = oobjdeflist[i];
        if (oobjdef.Attribute(Constants.AT_NAME, g_nloc).IsMaintained()) 
        {
            tobjects[tobjects.length] = new __usertype_tobjectstype();
            tobjects[tobjects.length-1].oobjdef = oobjdef;
            tobjects[tobjects.length-1].stypename = gettypenamestring(oobjdef);
        }
    }
    return tobjects;
}

function gettypenamestring(oobjdef)
{
    var stype = "" + oobjdef.TypeNum();
    var sname = oobjdef.Attribute(Constants.AT_NAME, g_nloc).GetValue(g_toption.bignore);
    
    if (g_toption.bignore) {
        sname = (""+sname).replace(/\s/g,'');   // Delete blanks
    }
    
    if (!g_toption.bcasesensitive) {
        sname = (""+sname).toLowerCase();       // Not casesensitive -> lowercase
    }
    return stype + "_" + sname;
}

function sortByTypeName(a,b)
{
    var tmp_lhs = new java.lang.String(a.stypename);
    return tmp_lhs.compareTo(new java.lang.String(b.stypename));
}

function consolidateobjects(tobjects)
{
    var nstart = new __holder(0); 
    for ( nstart.value = 0 ; nstart.value < tobjects.length ; nstart.value++ ) {               

        var omaster = new __holder(null);
        var oobjdefs2cons = new Array();
		
        if (getobjects2consolidate(omaster, oobjdefs2cons, tobjects, nstart)) {
		
            g_bfoundobjects = true;	            // Objects found to consolidate!
            
			var sconsol_ok    = getProtocolText(omaster, oobjdefs2cons, ""); 
			var sconsol_error = getProtocolText(omaster, oobjdefs2cons, getString("TEXT10"));
            
            try {
                var bConsolidate = omaster.value.Consolidate(oobjdefs2cons, g_toption.bconsol_1, g_toption.bconsol_2, g_toption.bconsol_3);
                
                if (bConsolidate) {
                    if (g_toption.bprotocol) g_ooutfile.OutputLnF(sconsol_ok, "Out");
                } else {
                    if (g_toption.bprotocol) g_ooutfile.OutputLnF(sconsol_error, "Out");
                    
                    g_bConsolidationError = true;                    
                }
            } catch(e) {
                if (g_toption.bprotocol) g_ooutfile.OutputLnF(sconsol_error, "Out");
                
                g_bConsolidationError = true;                
            }
        }        
    }

    function getProtocolText(omaster, oobjdefs2cons, sErrorText) {
        // Output string: consolidation ok    
        var sconsol = "\r\n" + getNameAndPath(omaster.value);
        if (sErrorText.length > 0) sconsol += sErrorText;

        for (var i = 0; i < oobjdefs2cons.length; i++) {
            sconsol_ok += "\r\n" + "    " + getNameAndPath(oobjdefs2cons[i]);
        }
        return sconsol;

        function getNameAndPath(oitem) {
            return oitem.Name(g_nloc) + getString("TEXT9") + oitem.Group().Path(g_nloc) + ")";
        }
    }
}

function getobjects2consolidate(omaster, oobjdefs2cons, tobjects, nstart)
{
    var oobjdeflist = new Array();
    oobjdeflist[oobjdeflist.length] = tobjects[nstart.value].oobjdef;       // First object
    
    var nnext = 0; 
    for (nnext = nstart.value + 1; nnext < tobjects.length; nnext++) {
        
        if (StrComp(tobjects[nstart.value].stypename, tobjects[nnext].stypename) == 0) {
            oobjdeflist[oobjdeflist.length] = tobjects[nnext].oobjdef;      // Next object with this type/name
        } else {
            break;
        }
    }
    var bResult = false;    
    // Get master and objects to consolidate
    if (oobjdeflist.length > 1) 
    {
        omaster.value = getmasterobject(oobjdeflist);
        
        if (omaster.value != null) {
            for (var i = 0; i < oobjdeflist.length; i++) {
                var oobjdef = oobjdeflist[i];
                
                if (! (oobjdef.IsEqual(omaster.value))) 
                {
                    oobjdefs2cons[oobjdefs2cons.length] = oobjdef;      // Objects to consolidate
                }
            }
            bResult = true;
        }  else {
            bResult = false;		// No master object
        }       
    } else {
            bResult = false;		// No objects to consolidate
    }
    
    nstart.value = nnext - 1;		// New index of start object
    
    return bResult;
}

function getmasterobject(oobjdeflist)
{
    var omaster = null;
    
    if (g_toption.nattrtype > 0) {
        var nmastercount = 0;
        
        for (var i = 0; i < oobjdeflist.length; i++) {
            var oobjdef = oobjdeflist[i];
            
            if (isboolattributetrue(oobjdef, g_toption.nattrtype, g_nloc)) {                
                if (omaster == null) {
                    omaster = oobjdef;
                }
                // Search master by (bool) attribute
                nmastercount++;
            }
        }
        
        if (nmastercount > 1) {
            var smsgtext = formatstring2(getString("TEXT11"), oobjdeflist[0].Type(), oobjdeflist[0].Name(g_nloc)) + "\r" + "\r" + getString("TEXT12") + "\r" + getString("TEXT13");
            
            if (Dialogs.MsgBox(smsgtext, Constants.MSGBOX_BTN_OKCANCEL | Constants.MSGBOX_ICON_QUESTION, getString("TEXT3")) != Constants.MSGBOX_RESULT_OK) {
                omaster = null;
            }
        }
    }
    return omaster;
}

function dialog_getoptions(toption)
{
    createattributelist(new __holder(g_sattrlist), new __holder(g_nattrlist));
    
    var userdialog = Dialogs.createNewDialogTemplate(0, 0, 400, 270, getString("TEXT14"));
    // %GRID:10,7,1,1
    userdialog.GroupBox(30, 8, 400, 80, getString("TEXT15"), "GroupBox1");
    userdialog.Text(44, 12, 380, 40, getString("TEXT_2"));
    userdialog.CheckBox(50, 30, 360, 15, getString("TEXT16"), "CheckBox1");
    userdialog.CheckBox(50, 45, 360, 15, getString("TEXT17"), "CheckBox2");
    userdialog.CheckBox(50, 60, 360, 15, getString("TEXT18"), "CheckBox3");
    userdialog.GroupBox(30, 100, 400, 80, getString("TEXT19"), "GroupBox2");
    userdialog.Text(44, 110, 360, 40, getString("TEXT20"));
    userdialog.Text(50, 153, 360, 30, getString("TEXT_1"))
    userdialog.DropListBox(170, 150, 250, 150, g_sattrlist, "DropListBox1");
    userdialog.GroupBox(30, 193, 400, 90, getString("TEXT21"), "GroupBox3");
    userdialog.Text(44, 197, 360, 40, getString("TEXT_3"));
    userdialog.CheckBox(50, 224, 20, 15, "", "CheckBox4");
    userdialog.Text(75, 225, 335, 28, getString("TEXT22"), "Text1");
    userdialog.CheckBox(50, 240, 360, 15, "", "CheckBox5");
    userdialog.Text(75, 241, 330, 28, getString("TEXT23"));
    userdialog.CheckBox(50, 255, 20, 15, "", "CheckBox6");
    userdialog.Text(75, 256, 330, 28, getString("TEXT24"), "Text2");
    userdialog.CheckBox(26, 289, 350, 15, getString("TEXT25"), "CheckBox7");
    userdialog.OKButton();
    userdialog.CancelButton();
    userdialog.HelpButton("HID_8e003480_eae8_11d8_12e0_9d2843560f51_dlg_01.hlp");
    
    var dlg = Dialogs.createUserDialog(userdialog); 
    
    // Read dialog settings from config
    var sSection = "SCRIPT_8e003480_eae8_11d8_12e0_9d2843560f51";  
    ReadSettingsDlgValue(dlg, sSection, "CheckBox1", 1);
    ReadSettingsDlgValue(dlg, sSection, "CheckBox2", 0);
    ReadSettingsDlgValue(dlg, sSection, "CheckBox3", 0);
    ReadSettingsListBoxByNumber(dlg, sSection, "DropListBox1", 0, g_nattrlist);
    ReadSettingsDlgValue(dlg, sSection, "CheckBox4", 1);
    ReadSettingsDlgValue(dlg, sSection, "CheckBox5", 1);
    ReadSettingsDlgValue(dlg, sSection, "CheckBox6", 1);
    ReadSettingsDlgValue(dlg, sSection, "CheckBox7", 1);
    
    var nuserdlg = Dialogs.show( __currentDialog = dlg);    // Show dialog (wait for ok)
    
    toption.bchildgroups   = dlg.getDlgValue("CheckBox1") != 0;
    toption.bcasesensitive = dlg.getDlgValue("CheckBox2") != 0;
    toption.bignore        = dlg.getDlgValue("CheckBox3") != 0;
    toption.bconsol_1      = dlg.getDlgValue("CheckBox4") != 0;
    toption.bconsol_2      = dlg.getDlgValue("CheckBox5") != 0;
    toption.bconsol_3      = dlg.getDlgValue("CheckBox6") != 0;
    toption.bprotocol      = dlg.getDlgValue("CheckBox7") != 0;
     
    if (dlg.getDlgValue("DropListBox1") >= 0) {
        toption.nattrtype = g_nattrlist[dlg.getDlgValue("DropListBox1")];
    } else {
        toption.nattrtype = 0;
    }

    if (nuserdlg != 0) {
        WriteSettingsDlgValue(dlg, sSection, "CheckBox1");
        WriteSettingsDlgValue(dlg, sSection, "CheckBox2");
        WriteSettingsDlgValue(dlg, sSection, "CheckBox3");
        WriteSettingsListBoxByNumber(dlg, sSection, "DropListBox1", g_nattrlist);
        WriteSettingsDlgValue(dlg, sSection, "CheckBox4");
        WriteSettingsDlgValue(dlg, sSection, "CheckBox5");
        WriteSettingsDlgValue(dlg, sSection, "CheckBox6");
        WriteSettingsDlgValue(dlg, sSection, "CheckBox7");
    }
    return (nuserdlg != 0)
}

function createattributelist(sattrlist, nattrlist)
{
    // Sub to create the attribute list.
    var nattrtypes = g_omethodfilter.AttrTypes(Constants.CID_OBJDEF);
    addboolattributes2list(new __holder(nattrtypes), nattrlist);
    
    for (var i = 0; i < nattrlist.value.length; i++) {
        sattrlist.value[i] = g_omethodfilter.AttrTypeName(nattrlist.value[i]) + " (" + nattrlist.value[i] + ")";
    }
}

function addboolattributes2list(nattrtypes, nattrlist)
{
    var badd = false; 
    
    for (var i = 0; i < nattrtypes.value.length; i++) {
        
        if (g_omethodfilter.AttrBaseType(nattrtypes.value[i]) == Constants.ABT_BOOL) {
            
            badd = true;
            if (nattrlist.value.length > 0) {
                badd = attributenotinlist(new __holder(nattrtypes.value[i]), nattrlist.value);
            }
            if (badd) {
                nattrlist.value[nattrlist.value.length] = nattrtypes.value[i];
            }
        }
    }
}

function attributenotinlist(nattrtype, nattrlist)
{
    for (var i = 0; i < nattrlist.length; i++) {
        if (nattrtype.value == nattrlist[i]) {
            return false;
        }
    }
    return true;
}

function getUmlObjTypeSet() {
    var umlObjTypeSet = new java.util.HashSet();
    
    var aUmlObjTypes = g_omethodfilter.getMetamodelItems(c_UML2_META_MODEL, Constants.CID_OBJDEF); 
    for (var i in aUmlObjTypes) {
        umlObjTypeSet.add(aUmlObjTypes[i]);
    }
    return umlObjTypeSet;
}

function filterOutUmlObjects(oObjDefs) {
    var oFilteredObjDefs = new Array();
    
    for (var i in oObjDefs) {
        var oObjDef = oObjDefs[i];
        if (!isUmlObject(oObjDef)) {
            oFilteredObjDefs.push(oObjDef);
        }
    }
    return oFilteredObjDefs;
    
    function isUmlObject(oObjDef) {
        return g_umlObjTypeSet.contains(oObjDef.TypeNum());
    } 
}


main();
