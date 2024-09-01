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


// Global variables.
var g_nloc = Context.getSelectedLanguage();

var g_ooutfile = Context.createOutputObject();
g_ooutfile.DefineF("REPORT1", getString("TEXT1"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
g_ooutfile.DefineF("REPORT2", getString("TEXT1"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
g_ooutfile.DefineF("REPORT3", getString("TEXT1"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

var g_sindent = "   ";

function main()
{
    // Declaration of variables
    var bnomod = false;   		// For checking whether one of the selected models is not of the correct type.
    var bokmod = false;   		// For checking whether at least one of the selected models is of the correct type.
    var bselectfirst = false;   // For displaying the user dialog only once.
    var ncheckmsg = 0;   		// Variable containing the answer to the message (2 = Abort was selected).
    
    createheaderfooter();		// Create page header, page footer, headline and information header
    
    var omodels = ArisData.getSelectedModels();
    omodels = ArisData.sort(omodels, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
    
    if (omodels.length > 0) {
        // Checks at the beginning whether a model is not of the 'organizational chart' type.
        for (var i = 0; i < omodels.length; i++) {
            var ocurrentmodel = omodels[i];
            if ((ocurrentmodel.OrgModelTypeNum() == 1) && ! (ncheckmsg == (2))) {     // TANR 216764
                // 1	Organizational chart
            } else {
                bnomod = true;
            }
        }
        
        if (bnomod == true && ! (ncheckmsg == (2))) {
            ncheckmsg = Dialogs.MsgBox(getString("TEXT2"), Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT3"));
        }
        
        for (var i = 0; i < omodels.length; i++) {
            var ocurrentmodel = omodels[i];
            
            var nausw_check1 = 0; 
            var nausw_check2 = 0; 
            
            if ((ocurrentmodel.OrgModelTypeNum() == 1) && ! (ncheckmsg == (2))) {     // TANR 216764
                // 1	Organizational chart
                g_ooutfile.OutputLn(((ocurrentmodel.Name(g_nloc) + ": ") + ocurrentmodel.Type()), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                g_ooutfile.OutputLn("", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                bokmod = true;
                if (bselectfirst == false) {
                    bselectfirst = true;
                    // Interrogation of options.
                    var userdialog = Dialogs.createNewDialogTemplate(0, 0, 440, 145, getString("TEXT3"));
                    userdialog.Text(10, 10, 400, 15, getString("TEXT4"));
                    userdialog.Text(10, 25, 400, 15, getString("TEXT5"));
                    userdialog.GroupBox(7, 55, 426, 55, getString("TEXT6"));
                    userdialog.CheckBox(20, 70, 360, 15, getString("TEXT7"), "Check1");
                    userdialog.CheckBox(20, 85, 360, 15, getString("TEXT8"), "Check2");
                    userdialog.OKButton();
                    userdialog.CancelButton();
                    //          userdialog.HelpButton("HID_e3f89120-eae8-11d8-12e0-9d2843560f51_dlg_01.hlp");
                    
                    var ausw = Dialogs.createUserDialog(userdialog); 
                    
                    // Read dialog settings from config
                    var sSection = "SCRIPT_e3f89120-eae8-11d8-12e0-9d2843560f51";  
                    ReadSettingsDlgValue(ausw, sSection, "Check1", 0);
                    ReadSettingsDlgValue(ausw, sSection, "Check2", 0);
                    
                    var nuserdialog = Dialogs.show( __currentDialog = ausw);          // Displays dialog and waits for the confirmation with OK.                    
                    if (nuserdialog != 0) {          
                        // Write dialog settings to config    
                        WriteSettingsDlgValue(ausw, sSection, "Check1");
                        WriteSettingsDlgValue(ausw, sSection, "Check2");
                        
                    } else {
                        Context.setScriptError(Constants.ERR_CANCEL);
                        return;
                    }
                    
                    // Modified for WebDesigner
                    nausw_check1 = ausw.getDlgValue("Check1");
                    nausw_check2 = ausw.getDlgValue("Check2");
                }
                var oallobjoccs = ocurrentmodel.ObjOccList();
                
                if (nausw_check1 == 1) {
                    // Modified for WebDesigner
                    // If Ausw.Check1 = 1 Then
                    ocurrentmodel.BuildGraph(true);
                    
                    var orootobjoccs = ocurrentmodel.StartNodeList();
                    if (orootobjoccs.length > 0) {
                        
                        g_ooutfile.OutputLn(getString("TEXT9"), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_UNDERLINE | Constants.FMT_LEFT, 0);
                        g_ooutfile.OutputLn("", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
                        
                        for (var j = 0; j < orootobjoccs.length; j++) {
                            var ocurrentobjocc = orootobjoccs[j];
                            
                            var ncounter = 0;
                            findstructedges(ocurrentobjocc, ncounter);
                        }
                    }  else {
                        ncheckmsg = Dialogs.MsgBox(getString("TEXT10") + ocurrentmodel.Name(g_nloc) + getString("TEXT11"), Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT3"));
                    }
                }
                
                if (nausw_check2 == 1) {
                    // Modified for WebDesigner
                    // If Ausw.Check2 = 1 Then
                    
                    if (nausw_check1 == 1) {
                        // Modified for WebDesigner
                        // If Ausw.Check1 = 1 Then
                        
                        // Leerzeilen einfügen
                        g_ooutfile.OutputLn("", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 15);
                        g_ooutfile.OutputLn("", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 15);
                    }

                    if (oallobjoccs.length > 0) {
                        findnotstructedges(oallobjoccs, ocurrentmodel);
                    } else {
                        ncheckmsg = Dialogs.MsgBox(getString("TEXT12") + ocurrentmodel.Name(g_nloc) + getString("TEXT13"), Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT3"));
                    }
                }
            }
        }
        if (bokmod == true && ! (ncheckmsg == (2))) {
            g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
        } else {
            Context.setScriptError(Constants.ERR_CANCEL);
        }
    } else {
        // List of models was empty.
        Dialogs.MsgBox(getString("TEXT14"), Constants.MSGBOX_BTN_OK, getString("TEXT3"));
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}

function findstructedges(ocurrentobjocc, ncounter)
{
    // Find the structurally relevant connections
    var ocurrentcxns = new __holder(null);   // List of connections.
    var outstring = new __holder(""); 
    
    // List of successors
    ocurrentcxns.value = ocurrentobjocc.OutEdges(Constants.EDGES_STRUCTURE);		// Get structurally relevant connections    
    if (ocurrentcxns.value.length > 0) {
	
        if (ncounter == 0) {
            // Output of root
            outstring.value = ocurrentobjocc.ObjDef().Name(g_nloc);
            g_ooutfile.OutputLn(outstring.value, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        }
		
        sortcxnsbytargetname(ocurrentcxns, g_nloc);		// Sort by name of target object
        
        for (var i = 0; i < ocurrentcxns.value.length; i++) {
            var ocurrentcxnocc = ocurrentcxns.value[i];
            var ocurrentcxn = ocurrentcxnocc.Cxn();
            
            g_ooutfile.OutputLn("", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            createstring(ocurrentcxn.ActiveType(), (ncounter + 1), outstring);
            g_ooutfile.Output(outstring.value, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            outstring.value = ocurrentcxn.TargetObjDef().Name(g_nloc);
            g_ooutfile.OutputLn(outstring.value, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            
            var onextobjocc = ocurrentcxnocc.TargetObjOcc();            
            findstructedges(onextobjocc, (ncounter + 1));		// Get next node
        }
    }   
}

function findnotstructedges(oallobjoccs, ocurrentmodel)
{
    // Find objects without hierarchical connections and objects without connections
    var ocxnobjoccs = new Array();
    var onocxnobjoccs = new Array();
    var ocurrentobjocc = new __holder(null); 
	
    for (var j = 0; j < oallobjoccs.length; j++) {
        ocurrentobjocc.value = oallobjoccs[j];
        
        var indeg = ocurrentobjocc.value.InDegree(Constants.EDGES_STRUCTURE);
        var outdeg = ocurrentobjocc.value.OutDegree(Constants.EDGES_STRUCTURE);
        
        if ((indeg == 0) && (outdeg == 0)) {
            var ocurrentcxns = ocurrentobjocc.value.CxnOccList();		// connections of objects
            if (ocurrentcxns.length > 0) {
                ocxnobjoccs[ocxnobjoccs.length] = ocurrentobjocc.value;
            } else {
                onocxnobjoccs[onocxnobjoccs.length] = ocurrentobjocc.value;
            }
        }
    }
    
    if ((ocxnobjoccs.length > 0) || (onocxnobjoccs.length > 0)) {
        if (ocxnobjoccs.length > 0) {
            g_ooutfile.OutputLn(getString("TEXT15"), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_UNDERLINE | Constants.FMT_LEFT, 0);
            
            for (var j = 0; j < ocxnobjoccs.length; j++) {
                ocurrentobjocc.value = ocxnobjoccs[j];
                outnotstruct(ocurrentobjocc);
            }
        }
        
        if (onocxnobjoccs.length > 0) {
            if (ocxnobjoccs.length > 0) {
                g_ooutfile.OutputLn("", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 15);
                g_ooutfile.OutputLn("", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 15);
            }
            g_ooutfile.OutputLn(getString("TEXT16"), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_UNDERLINE | Constants.FMT_LEFT, 0);
            
            for (var j = 0; j < onocxnobjoccs.length; j++) {
                ocurrentobjocc.value = onocxnobjoccs[j];
                outnotstruct(ocurrentobjocc);
            }
        }
    } else {
        Dialogs.MsgBox(getString("TEXT10") + ocurrentmodel.Name(g_nloc) + getString("TEXT17"), Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT3"));
    }
}

function outnotstruct(ocurrentobjocc)
{
    // Output of objects without hierarchical connections and objects without connections
    g_ooutfile.OutputLn("", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_ooutfile.OutputLn(ocurrentobjocc.value.ObjDef().Name(g_nloc), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
    
	var ocxnoccs = new __holder(null);   // List of connection occurrences.
	ocxnoccs.value = ocurrentobjocc.value.OutEdges(Constants.EDGES_NONSTRUCTURE);
    if (ocxnoccs.value.length > 0) {        
        sortcxnsbysourceortargetname(ocxnoccs, ocurrentobjocc.value, g_nloc);		// Sort by name of source or target object

        for (var i = 0; i < ocxnoccs.value.length; i++) {
            var ocurrentcxnocc = ocxnoccs.value[i];
            var ocurrentcxn = ocurrentcxnocc.Cxn();
            
            g_ooutfile.OutputLn("", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 15);
            
            if (ocurrentobjocc.value.IsEqual(ocurrentcxnocc.TargetObjOcc()) == true) {
                // Output of source object.
                g_ooutfile.Output((ocurrentcxn.PassiveType() + " "), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 15);
                g_ooutfile.OutputLn(ocurrentcxn.SourceObjDef().Name(g_nloc), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 15);
                
            } else if (ocurrentobjocc.value.IsEqual(ocurrentcxnocc.SourceObjOcc()) == true) {
                // Output of target object.
                g_ooutfile.Output((ocurrentcxn.ActiveType() + " "), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 15);
                g_ooutfile.OutputLn(ocurrentcxn.TargetObjDef().Name(g_nloc), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 15);
            }
        }
    }
    
    ocxnoccs.value = ocurrentobjocc.value.InEdges(Constants.EDGES_NONSTRUCTURE);
    if (ocxnoccs.value.length > 0) {        
        sortcxnsbysourceortargetname(ocxnoccs, ocurrentobjocc.value, g_nloc);		// Sort by name of source or target object

        for (var i = 0; i < ocxnoccs.value.length; i++) {
            var ocurrentcxnocc = ocxnoccs.value[i];
            var ocurrentcxn = ocurrentcxnocc.Cxn();
            
            g_ooutfile.OutputLn("", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 15);
            
            if (ocurrentobjocc.value.IsEqual(ocurrentcxnocc.TargetObjOcc()) == true) {
                // Output of source object.
                g_ooutfile.Output((ocurrentcxn.PassiveType() + " "), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 15);
                g_ooutfile.OutputLn(ocurrentcxn.SourceObjDef().Name(g_nloc), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 15);
                
            } else if (ocurrentobjocc.value.IsEqual(ocurrentcxnocc.SourceObjOcc()) == true) {
                // Output of target object.
                g_ooutfile.Output((ocurrentcxn.ActiveType() + " "), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 15);
                g_ooutfile.OutputLn(ocurrentcxn.TargetObjDef().Name(g_nloc), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 15);
            }
        }
    }
}

function createstring(instring, ncounter, outstring)
{
    // Build the output string
    outstring.value = "";
    for (var i = 1; i < ncounter+1; i++) {
        outstring.value += g_sindent;    
    }
    outstring.value += instring + " ";
}

function createheaderfooter()
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
    g_ooutfile.TableCell(Context.getScriptInfo(Constants.SCRIPT_TITLE), 48, getString("TEXT1"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.TableCell("", 26, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.OutGraphic(pictright, - 1, 40, 15);
    g_ooutfile.EndTable("", 100, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.EndHeader();
    
    // Footer
    setFrameStyle(g_ooutfile, Constants.FRAME_TOP);  
    g_ooutfile.BeginFooter();
    g_ooutfile.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell("", 26, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_DATE, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    g_ooutfile.Output(" ", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_TIME, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    g_ooutfile.TableCell(Context.getSelectedFile(), 48, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.TableCell("", 26, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    g_ooutfile.Output(getString("TEXT18"), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_PAGE, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
    g_ooutfile.Output(getString("TEXT19"), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_NUMPAGES, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
    g_ooutfile.EndTable("", 100, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.EndFooter();
    
    g_ooutfile.ResetFrameStyle();  
    
    // Headline
    g_ooutfile.OutputLnF("", "REPORT1");
    g_ooutfile.OutputLnF(getString("TEXT3"), "REPORT1");
    g_ooutfile.OutputLnF("", "REPORT1");
    
    // Information header.
    g_ooutfile.OutputLnF((getString("TEXT20") + ArisData.getActiveDatabase().ServerName()), "REPORT2");
    g_ooutfile.OutputLnF((getString("TEXT21") + ArisData.getActiveDatabase().Name(g_nloc)), "REPORT2");
    g_ooutfile.OutputLnF((getString("TEXT22") + ArisData.getActiveUser().Name(g_nloc)), "REPORT2");
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