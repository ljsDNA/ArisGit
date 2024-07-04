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
var txtRelations        = getString("TEXT2");
var txtRelAll           = getString("TEXT3");
var txtRelStruct        = getString("TEXT4");
var txtRelNotStruct     = getString("TEXT5");
var txtLinkLevels       = getString("TEXT6");
var txtAttributes       = getString("TEXT7");

// messagebox text constants
var txtNoModelsSelected     = getString("TEXT8");
var txtNumberToSmall        = getString("TEXT9");
var txtPleaseEnterNumber    = getString("TEXT10");

// output text constants
var txtStartPath            = getString("TEXT11");
var txtAlreadEvaluated      = getString("TEXT12");
var txtNonStructRel         = getString("TEXT13");
var txtStructRel            = getString("TEXT14");
var txtMark                 = getString("TEXT15");

var txtEndOfPath			= getString("TEXT19");

var dicRelations    = "optRelations";
var dicLinkLevels   = "txtLinkLevels";
var dicAttributes   = "chkAttributes";

__usertype_tmarkedobjocctype = function() {
    this.omarkednode = null;
    this.osuccnodes = null;
    this.smark = "";
}

var g_nloc = Context.getSelectedLanguage();

var g_ooutfile = Context.createOutputObject();
g_ooutfile.DefineF("REPORT1", getString("TEXT16"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 0, 0, 0, 0, 1);
g_ooutfile.DefineF("REPORT2", getString("TEXT16"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
g_ooutfile.DefineF("REPORT3", getString("TEXT16"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);

var g_odoneobjoccs = new Array();   // List of object occurrences of the objects which have already been evaluated.

var g_nmarkcounter	 = 0;			// Counter for indicator flags.
var g_tmarkedobjoccs = new Array()  // __usertype_tmarkedobjocctype()

var g_nDefaultLinkLevels = 3;		// default link level

function main()
{
    var bcheckuserdialog = new __holder(false);   	// Variable for checking whether the user selected Cancel in the dialog.
    var bchangeext = false;							// Variable for checking whether the file ending was changed.
    
    var omodels = ArisData.getSelectedModels();
    omodels = ArisData.sort(omodels, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
    
    if (bchangeext == false) {
        bcheckuserdialog.value = true;
    }
    
    if (bcheckuserdialog.value == true) {
        if (omodels.length > 0) {
            
            var holder_nOptRelations  = new __holder(0);
            var holder_bAttributes    = new __holder(false);
            var holder_nDepth         = new __holder(g_nDefaultLinkLevels);
            
            showOutputOptionsDialog(holder_nOptRelations, holder_bAttributes, holder_nDepth, bcheckuserdialog);
            if (bcheckuserdialog.value == true) {
                
                setReportHeaderFooter(g_ooutfile, g_nloc, true, true, true);
                
                for (var i = 0; i < omodels.length; i++) {
					var ocurrentmodel = new __holder(null);   // Current model of list oModels
                    ocurrentmodel.value = omodels[i];
					
                    while (g_odoneobjoccs.length > 0) {
                        g_odoneobjoccs = doDelete(g_odoneobjoccs, g_odoneobjoccs[0]);
                    }
                    
                    g_ooutfile.OutputLnF("", "REPORT1");
                    g_ooutfile.OutputLn(ocurrentmodel.value.Name(g_nloc), getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
                    if (ArisData.getActiveDatabase().ActiveFilter().GraphType(ocurrentmodel.value.TypeNum()) == Constants.GT_GRAPH) {
                        // Output of graphs.
                        graphout(ocurrentmodel, holder_nOptRelations.value, holder_bAttributes.value, holder_nDepth.value);
                    } else { // Output of trees.
                        nographout(ocurrentmodel, holder_nOptRelations.value, holder_bAttributes.value, holder_nDepth.value);
                    }
                }
                g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
            }
            
            else {
                Context.setScriptError(Constants.ERR_CANCEL);
            }
        }
        else {
            Dialogs.MsgBox(txtNoModelsSelected, Constants.MSGBOX_BTN_OK, getString("TEXT17"));
            Context.setScriptError(Constants.ERR_CANCEL);
        }
    }
}

// ****************************************************************************************************************************
// *  Subroutine showOutputOptionsDialog 															
// *	This subprogram is needed for interrogating the user about the necessary settings for the report.			
// ****************************************************************************************************************************
// *  Parameters																									
// *    holder_nOptRelations = holder for variable whether the relationships that form a structure or  whether the relationships that do not form a structure or both should be evaluated
// *	holder_bAttributes  = holder for Variable whether attributes should be evaluated (0 = No/ 1 = Yes ).							
// *	holder_nDepth =  holder for Variable for the evaluation depth of the levels of trees.										
// *	bCheckUserDialog = Variable for checking whether the user selected Cancel in the dialogs.				
// ****************************************************************************************************************************
function showOutputOptionsDialog(holder_nOptRelations, holder_bAttributes, holder_nDepth, bcheckuserdialog)
{
    var nuserdlg = 1;     // Variable for the user dialog box
    var binput = false;    // Variable whether the input is correct.
    
    while (binput == false && ! (nuserdlg == 0)) {
        var userdialog = Dialogs.createNewDialogTemplate(0, 0, 450, 140, txtOutputOptionsDialogTitle);
        userdialog.GroupBox(7, 0, 430, 65, txtRelations);
        userdialog.OptionGroup(dicRelations);
        userdialog.OptionButton(20, 15, 400, 15, txtRelAll);
        userdialog.OptionButton(20, 30, 400, 15, txtRelStruct);
        userdialog.OptionButton(20, 45, 400, 15, txtRelNotStruct);
        
        userdialog.GroupBox(7, 75, 430, 45, txtLinkLevels);
        userdialog.Text(20, 95, 210, 15, txtLinkLevels);
        userdialog.TextBox(250, 90, 60, 21, dicLinkLevels);
        
        userdialog.CheckBox(7, 125, 350, 15, txtAttributes, dicAttributes);
        
        userdialog.OKButton();
        userdialog.CancelButton();
        //    userdialog.HelpButton("HID_6f009540_eae1_11d8_12e0_9d2843560f51_dlg_01.hlp");
        
        var dlg = Dialogs.createUserDialog(userdialog); 
        
        // Read dialog settings from config    
        var sSection = "SCRIPT_6f009540_eae1_11d8_12e0_9d2843560f51";
        ReadSettingsDlgValue(dlg, sSection, dicRelations, 0);    
        ReadSettingsDlgText(dlg, sSection, dicLinkLevels, holder_nDepth.value);
        ReadSettingsDlgValue(dlg, sSection, dicAttributes, holder_bAttributes.value?1:0);  
        
        nuserdlg = Dialogs.show( __currentDialog = dlg);
        // Showing dialog and waiting for confirmation with OK
        holder_nOptRelations.value  = dlg.getDlgValue(dicRelations);
        holder_bAttributes.value    = dlg.getDlgValue(dicAttributes)!=0;
        
        if (! isNaN(dlg.getDlgText(dicLinkLevels))) {
            holder_nDepth.value = parseInt(dlg.getDlgText(dicLinkLevels));
            if (holder_nDepth.value < 0) {
                Dialogs.MsgBox(txtNumberToSmall, Constants.MSGBOX_BTN_OK, getString("TEXT17"));
                binput = false;
            } else { 
                binput = true;
            } 
        } else {
            Dialogs.MsgBox(txtPleaseEnterNumber, Constants.MSGBOX_BTN_OK, getString("TEXT17"));
            binput = false;
        }
    }
    
    // Write dialog settings to config
    if (nuserdlg != 0) {
        WriteSettingsDlgValue(dlg, sSection, dicRelations);    
        WriteSettingsDlgText(dlg, sSection, dicLinkLevels);
        WriteSettingsDlgValue(dlg, sSection, dicAttributes);  
    }
    
    bcheckuserdialog.value = nuserdlg!=0;
}

// ########################################################################################################################
// ############################################## GraphOut ################################################################
// ########################################################################################################################
// ****************************************************************************************************************************
// *  Subroutine GraphOut																										*
// *	This subprogram is used for evaluating models that are graphs.											*
// *	The objects are output in the modeled order.															*
// ****************************************************************************************************************************
// *  Parameter																												*
// *	oCurrentModel = current model.																						*
// *  AskOpt.nStruktRelationships  = Variable whether the relationships that form a structure should be evaluated								*
// *	 ( 0 = No/ 1 = Yes ).																						*
// *  AskOpt.nStruktRelationships  = Variable whether the relationships that do not form a structure should be evaluated.							*
// *	 ( 0 = No/ 1 = Yes ).																						*
// *	AskOpt.nAttributes  = Variable whether attributes should be evaluated (0 = No/ 1 = Yes ).								*
// *	AskOpt.nDepth =  Variable for the evaluation depth of the levels of trees.											*
// ****************************************************************************************************************************
function graphout(ocurrentmodel, nOptRelations, bAttributes, nDepth)
{
    var scurrentmark    = new __holder("");   // Variable containing the mark that was put on the object occurrence.
    
    var orootobjoccs = new __holder(null);   // List containing the start and/or root elements (ObjOccs) of the current model.
	orootobjoccs.value = new Array();
    
    if (ocurrentmodel.value.BuildGraph(true)) {  
        getstartfunc(ocurrentmodel, orootobjoccs);
        createmarkedlist(ocurrentmodel);
        // create list of marked ObjOccs
        
		var oendobjoccs = new __holder(null);   // List containing the end objects.
        oendobjoccs.value = ocurrentmodel.value.EndNodeList();
        
        if (orootobjoccs.value.length > 0) {
            for (var i = 0; i < orootobjoccs.value.length; i++) {
				var ocurrentobjocc = new __holder(null);   // Current object occurrence.
                ocurrentobjocc.value = orootobjoccs.value[i];
				
                ocurrentmodel.value.DFSGetFirstNode(ocurrentobjocc.value);
                
				var onextobjocc = new __holder(null);   // Current following object.
                onextobjocc.value = ocurrentmodel.value.DFSNextNode();
                
                // Checks whether the object occurrence has already been evaluated.
                var bcheckdoneobj = checkdoneobject(ocurrentobjocc, true);
                if (bcheckdoneobj == false) {
                    
                    g_ooutfile.OutputLn("", getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
                    g_ooutfile.OutputLn(txtStartPath, getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
                    g_ooutfile.Output(((ocurrentobjocc.value.ObjDef().Name(g_nloc) + ", ") + ocurrentobjocc.value.ObjDef().Type()), getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
                    
                    if (getcurrobjectmark(ocurrentobjocc, scurrentmark)) {
                        g_ooutfile.OutputLn(((" (" + scurrentmark.value) + ")"), getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
                    } else {
                        g_ooutfile.OutputLn("", getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
                    }
                    
                    // Attributes, first level.
                    if (bAttributes) {
                        outattributes(ocurrentobjocc.value.ObjDef(), new __holder(0));
                    }
                    
                    // Relationships
                    outrelationship(ocurrentobjocc, nOptRelations, new __holder(0), true);
                }
                
                if (onextobjocc.value.IsValid() == true) {
                    outnextnode(ocurrentmodel, nOptRelations, bAttributes, nDepth, onextobjocc, oendobjoccs, new __holder(false));
                }
            }
        }
    } else {
        // No layout information available
        var smodeltype = ArisData.getActiveDatabase().ActiveFilter().ModelTypeName(ocurrentmodel.value.TypeNum());
        g_ooutfile.OutputLn(formatstring1(getString("TEXT21"), smodeltype), getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_ITALIC | Constants.FMT_LEFT, 0);
    }
}

// ****************************************************************************************************************************
// *  Subroutine OutNextNode																									*
// *	This subprogram is used for the recursive processing of the graph.												*
// ****************************************************************************************************************************
// *  Parameter																												*
// *	oCurrentModel = current model.																						*
// *  AskOpt.nStruktRelationships  = Variable whether the relationships that form a structure should be evaluated								*
// *	 ( 0 = No/ 1 = Yes ).																						*
// *  AskOpt.nNoneStruktRelationships  = Variable whether the relationships that do not form a structure should be evaluated.						*
// *	 ( 0 = No/ 1 = Yes ).																						*
// *	AskOpt.nAttributes  = Variable whether attributes should be evaluated (0 = No/ 1 = Yes ).								*
// *	AskOpt.nDepth =  Variable for the evaluation depth of the levels of trees.											*
// *	oCurrentObjOcc = current object occurrence..																				*
// *	oEndObjOccs As Object = List of the end objects.																		*
// ****************************************************************************************************************************
function outnextnode(ocurrentmodel, nOptRelations, bAttributes, nDepth, ocurrentobjocc, oendobjoccs, bnewpath)
{
    var scurrentmark = new __holder("");   // Variable containing the mark that was put on the object occurrence.
    var bcheck = new __holder(false);   // Indicator flag if object = end object = True.
    var nindex = new __holder(0); 
    
    g_ooutfile.OutputLnF("", "REPORT2");
	
	var onextobjocc = new __holder(null);   // Current following object.
    onextobjocc.value = ocurrentmodel.value.DFSNextNode();
    
    // Checks whether the object occurrence has already been evaluated.
    var bcheckdoneobj = checkdoneobject(ocurrentobjocc, true);
    if (bcheckdoneobj == false) {
        
        if (bnewpath.value) {
            if (getpredobjectmark(ocurrentobjocc, scurrentmark)) {
                g_ooutfile.OutputLn(getString("TEXT11"), getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
                g_ooutfile.OutputLn(getString("TEXT18") + " " + scurrentmark.value, getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
            }
        }
        
        g_ooutfile.Output(ocurrentobjocc.value.ObjDef().Name(g_nloc) + ", " + ocurrentobjocc.value.ObjDef().Type(), getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
        
        if (getcurrobjectmark(ocurrentobjocc, scurrentmark)) {
            g_ooutfile.OutputLn(" (" + scurrentmark.value + ")", getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
        } else {
            g_ooutfile.OutputLn("", getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
        }
        
        // Attributes, further levels.
        if (bAttributes) {
            outattributes(ocurrentobjocc.value.ObjDef(), new __holder(0));
        }
        
        // Relationships
        outrelationship(ocurrentobjocc, nOptRelations, new __holder(0), true);
        
        // End of path.
        bcheck.value = false;
        checkendnode(ocurrentobjocc, oendobjoccs, bcheck);
        if (bcheck.value == true) {
            g_ooutfile.OutputLn(txtEndOfPath, getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
        }
    }
    
    bnewpath.value = bcheck.value;
    if (! (bnewpath.value)) {
        bnewpath.value = ! (iselementinlist(onextobjocc.value, ocurrentmodel.value.GetSuccNodes(ocurrentobjocc.value), nindex));
    }
    
    if (onextobjocc.value.IsValid() == true) {
        outnextnode(ocurrentmodel, nOptRelations, bAttributes, nDepth, onextobjocc, oendobjoccs, bnewpath);
    }
}

// ********************************************************************************************************************
// *  Subroutine NoGraphOut																							
// *	This subprogram is used for evaluating models which are no graphs.							
// *	The objects are output in the modeled order.													
// ********************************************************************************************************************
// *  Parameters																								
// *	oCurrentModel = Current model.	
// *    nOptRelations	= option whether the relationships that form a structure or whether the relationships that 
// *                                    do not form a structure should be evaluated or  both													
// *	bAttributes  = Variable whether attributes should be evaluated						
// *	nDepth = Variable for the evaluation depth of the levels with regard to trees.							
// ********************************************************************************************************************
function nographout(ocurrentmodel, nOptRelations, bAttributes, nDepth)
{
    var oendobjoccs = new __holder(null);   // List containing the end objects.
    var onextobjoccs = new Array();
    
    if (ocurrentmodel.value.BuildGraph(true)) {  
        var orootobjoccs = ocurrentmodel.value.StartNodeList();
        if (orootobjoccs.length > 0) {
            for (var i = 0; i < orootobjoccs.length; i++) {
				var ocurrentobjocc = new __holder(null); 
                ocurrentobjocc.value = orootobjoccs[i];
				
                ocurrentmodel.value.DFSGetFirstNode(ocurrentobjocc.value);
				
				var ndepthlevel = new __holder(0);			// Depth of the current object in the model graph.
                ndepthlevel.value = ocurrentmodel.value.Depth(ocurrentobjocc.value);
				
                if (ndepthlevel.value < nDepth) {
                    // THA: nDepthLevel starts at 0, AskOpt.nDept: 1 means only one level, so: level 0 ==> use "<"
                    
                    g_ooutfile.OutputLn("", getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, (ndepthlevel.value * 10));
                    g_ooutfile.OutputLn(((ocurrentobjocc.value.ObjDef().Name(g_nloc) + ", ") + ocurrentobjocc.value.ObjDef().Type()), getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, (ndepthlevel.value * 10));
                    // Marks as visited.
                    ocurrentmodel.value.MarkVisited(ocurrentobjocc.value, true);
                    
                    // Checks whether the object occurrence has already been evaluated.
                    var bcheckdoneobj = checkdoneobject(ocurrentobjocc, true);
                    if (bcheckdoneobj == false) {
                        // Attributes, first level.
                        if (bAttributes) {
                            outattributes(ocurrentobjocc.value.ObjDef(), ndepthlevel);
                        }
                        
                        // Relationships
                        outrelationship(ocurrentobjocc, nOptRelations, ndepthlevel, false);
                    }
                    else {
                        g_ooutfile.OutputLn(getString("TEXT12"), getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, (ndepthlevel.value * 10));
                    }
                    
                    var ocxnoccs = ocurrentobjocc.value.OutEdges(Constants.EDGES_ALL);
                    if (ocxnoccs.length > 0) {
                        for (var h = 0; h < ocxnoccs.length; h++) {
                            onextobjoccs[onextobjoccs.length] = ocxnoccs[h].TargetObjOcc();
                        }
                        
                        for (var h = 0; h < onextobjoccs.length; h++) {
                            bcheckdoneobj = checkdoneobject(new __holder(onextobjoccs[h]), false);
                            if (bcheckdoneobj == false) {
                                outnexttreenode(ocurrentmodel, nOptRelations, bAttributes, nDepth, new __holder(onextobjoccs[h]), oendobjoccs, ndepthlevel);
                            }
                        }
                    }
                }
            }
        }
    } else {
        // No layout information available
        var smodeltype = ""; 
        smodeltype = ArisData.getActiveDatabase().ActiveFilter().ModelTypeName(ocurrentmodel.value.TypeNum());
        g_ooutfile.OutputLn(formatstring1(getString("TEXT21"), smodeltype), getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_ITALIC | Constants.FMT_LEFT, 0);
    }
}

// ****************************************************************************************************************************
// *  Subroutine OutNextTreeNode 																								*
// *	This subprogram is used for the recursive processing of the tree.												*
// ****************************************************************************************************************************
// *  Parameter																												*
// *	oCurrentModel = current model.																						*
// *  AskOpt.nStruktRelationships  = Variable whether the relationships that form a structure should be evaluated								*
// *	 ( 0 = No/ 1 = Yes ).																						*
// *  AskOpt.nNoneStruktRelationships  = Variable whether the relationships that do not form a structure should be evaluated.						*
// *	 ( 0 = No/ 1 = Yes ).																						*
// *	AskOpt.nAttributes  = Variable whether attributes should be evaluated (0 = No/ 1 = Yes ).								*
// *	AskOpt.nDepth As Integer = Variable for the evaluation depth of the levels with regard to trees.									*
// *	oCurrentObjOcc = current object occurrence..																				*
// *	oEndObjOccs As Object = List of the end objects.																		*
// *	nDepthLevel = Depth of the current object in the model graph.																*
// ****************************************************************************************************************************
function outnexttreenode(ocurrentmodel, nOptRelations, bAttributes, nDepth, ocurrentobjocc, oendobjoccs, ndepthlevel)
{
    var onextobjoccs = new Array();
    
    ocurrentmodel.value.DFSGetFirstNode(ocurrentobjocc.value);
    ndepthlevel.value = ocurrentmodel.value.Depth(ocurrentobjocc.value);
    if (ndepthlevel.value < nDepth) {
        // THA: nDepthLevel starts at 0, AskOpt.nDept: 1 means only one level, so: level 0 ==> use "<"
        g_ooutfile.OutputLn("", getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, (ndepthlevel.value * 10));
        g_ooutfile.OutputLn(((ocurrentobjocc.value.ObjDef().Name(g_nloc) + ", ") + ocurrentobjocc.value.ObjDef().Type()), getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, (ndepthlevel.value * 10));
        
        // Marks as visited.
        ocurrentmodel.value.MarkVisited(ocurrentobjocc.value, true);
        // Checks whether the object occurrence has already been evaluated.
        var bcheckdoneobj = checkdoneobject(ocurrentobjocc, true);
        if (bcheckdoneobj == false) {
            // Attributes of the further levels.
            if (bAttributes == 1) {
                outattributes(ocurrentobjocc.value.ObjDef(), ndepthlevel);
            }
            
            // Relationships
            outrelationship(ocurrentobjocc, nOptRelations, ndepthlevel, false);
        }
        else {
            g_ooutfile.OutputLn(txtAlreadEvaluated, getString("TEXT16"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, (ndepthlevel.value * 10));
        }
        
        var ocxnoccs = ocurrentobjocc.value.OutEdges(Constants.EDGES_ALL);
        if (ocxnoccs.length > 0) {
            for (var h = 0; h < ocxnoccs.length; h++) {
                onextobjoccs[onextobjoccs.length] = ocxnoccs[h].TargetObjOcc();
            }
            
            for (var h = 0; h < onextobjoccs.length; h++) {
                bcheckdoneobj = checkdoneobject(new __holder(onextobjoccs[h]), false);
                if (bcheckdoneobj == false) {
                    outnexttreenode(ocurrentmodel, nOptRelations, bAttributes, nDepth, new __holder(onextobjoccs[h]), oendobjoccs, ndepthlevel);
                }
            }
        }
    }
}

// ********************************************************************************************************************
// *  Subroutine CheckEndNode																							*
// *	This subprogram checks whether the current object is an end object of the graph.		*
// ********************************************************************************************************************
// *  Parameter																										*
// *	oCurrentObjOcc As Object = Current object occurrence.															*
// *	oEndObjOccs As Object = List of the end objects.																*
// *	bCheck as Boolean 'Indicator flag if object = end object = True.														*
// ********************************************************************************************************************
function checkendnode(ocurrentobjocc, oendobjoccs, bcheck)
{
    for (var i = 0; i < oendobjoccs.value.length; i++) {
        if (ocurrentobjocc.value.IsEqual(oendobjoccs.value[i])) {
            bcheck.value = true;
            break;
        }
    }
}

// ********************************************************************************************************************
// *  Subroutine CheckDoneObject																						*
// *	Subprogram for checking whether the current object occurrence has already been evaluated.						*
// ********************************************************************************************************************
// *  Parameter																										*
// *	oCurrebtObjOcc = Current object occurrence.																		*
// *	bInsert = Checks whether the object will be inserted into the global list g_oDoneObjOccs.							*
// ********************************************************************************************************************
function checkdoneobject(ocurrentobjocc, binsert)
{
	for (var i = 0; i < g_odoneobjoccs.length; i++) {
		var ocurrentdoneobjdef = g_odoneobjoccs[i];
		// Checks whether the object is contained in the list g_oDoneObjOccs.
		if (ocurrentdoneobjdef.IsEqual(ocurrentobjocc.value)) {

			return true;
		}
	}

    if (binsert == true) {
        g_odoneobjoccs[g_odoneobjoccs.length] = ocurrentobjocc.value;
    }
    return false;
}

// ********************************************************************************************************************
// *  Subroutine OutAttributes																						*
// *	This subprogram is used for outputting the attributes of the objects.									*
// ********************************************************************************************************************
// *  Parameter																										*
// *	oCurrentObject = Current object definition.																		*
// *	nDepthLevel = Variable for the level depth.																		*
// ********************************************************************************************************************
function outattributes(ocurrentobject, ndepthlevel)
{
    var oattributes = ocurrentobject.AttrList(g_nloc);    
    if (oattributes.length > 0) {
        g_ooutfile.OutputLn(getString("TEXT20"), getString("TEXT16"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, (ndepthlevel.value * 10));
        
		for (var i = 0; i < oattributes.length; i++) {
            var ocurrentattribute = oattributes[i];
            g_ooutfile.OutputLn(ocurrentattribute.Type() + ": " + ocurrentattribute.GetValue(true), getString("TEXT16"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, (ndepthlevel.value * 10));
        }
    }
}

// ****************************************************************************************************************************
// *  Subroutine OutRelationship																								
// *	This subprogram is used to output the structurally relevant connections and non-structurally-relevant			
// *	connections of objects.																				
// ****************************************************************************************************************************
// *  Parameter																												
// *	oCurrentObjOcc = Current object definition.																				
// *	AskOpt.nStruktRelationships = Variable whether the structurally relevant relationships should be evaluated.									
// *	 ( 0 = No/ 1 = Yes ).																						
// *  	AskOpt.nNoneStruktRelationships  = Variable whether the structurally not relevant relationships should be evaluated.						
// *	 ( 0 = No/ 1 = Yes ).																						
// *	AskOpt.nAttributes  = Variable whether attributes should be evaluated (0 = No/ 1 = Yes ).								
// *	AskOpt.nDepth =  Variable for the evaluation depth of the levels of trees.											
// *	bGrapOut = Variable if model is a graph = True .
// ****************************************************************************************************************************
function outrelationship(ocurrentobjocc, nOptRelations, ndepthlevel, bgrapout)
{
    if (nOptRelations == 0 || nOptRelations == 2) {
        g_ooutfile.OutputLn(txtNonStructRel + ": ", getString("TEXT16"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, (ndepthlevel.value * 10));
        // Incoming connections.
        var ocxnoccs = ocurrentobjocc.value.InEdges(Constants.EDGES_NONSTRUCTURE);
        if (ocxnoccs.length > 0) {
		
            for (var i = 0; i < ocxnoccs.length; i++) {
                var ocurrentcxnocc = ocxnoccs[i];
                g_ooutfile.OutputLn(ocurrentcxnocc.Cxn().PassiveType() + " " + ocurrentcxnocc.Cxn().SourceObjDef().Name(g_nloc), getString("TEXT16"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, (ndepthlevel.value * 10));
            }
        }        
        // Outgoing connections.
        ocxnoccs = ocurrentobjocc.value.OutEdges(Constants.EDGES_NONSTRUCTURE);
        if (ocxnoccs.length > 0) {
		
            for (var i = 0; i < ocxnoccs.length; i++) {
                var ocurrentcxnocc = ocxnoccs[i];
                g_ooutfile.OutputLn(ocurrentcxnocc.Cxn().ActiveType() + " " + ocurrentcxnocc.Cxn().TargetObjDef().Name(g_nloc), getString("TEXT16"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, (ndepthlevel.value * 10));
            }
        }
    }
    
    if (nOptRelations == 0 || nOptRelations == 1) {
        g_ooutfile.OutputLn(txtStructRel + ": ", getString("TEXT16"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, (ndepthlevel.value * 10));
        // Incoming connections.
        var ocxnoccs = ocurrentobjocc.value.InEdges(Constants.EDGES_STRUCTURE);
        if (ocxnoccs.length > 0) {
		
            for (var i = 0; i < ocxnoccs.length; i++) {
                var ocurrentcxnocc = ocxnoccs[i];
				var soutstring = "";
				
                if (bgrapout == true) {
					var scurrentmark = new __holder(""); 
                    if (getcurrobjectmark(new __holder(ocurrentcxnocc.SourceObjOcc()), scurrentmark)) {
                        soutstring = ocurrentcxnocc.Cxn().PassiveType() + " " + ocurrentcxnocc.Cxn().SourceObjDef().Name(g_nloc) + " (" + scurrentmark.value + ")";
                    } else {
                        soutstring = ocurrentcxnocc.Cxn().PassiveType() + " " + ocurrentcxnocc.Cxn().SourceObjDef().Name(g_nloc);
                    }
                } else {
                    soutstring = ocurrentcxnocc.Cxn().PassiveType() + " " + ocurrentcxnocc.Cxn().SourceObjDef().Name(g_nloc);
                }
                g_ooutfile.OutputLn(soutstring, getString("TEXT16"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, (ndepthlevel.value * 10));
            }
        }
        
        // Outgoing connections.
        ocxnoccs = ocurrentobjocc.value.OutEdges(Constants.EDGES_STRUCTURE);
        if (ocxnoccs.length > 0) {
            for (var i = 0 ; i < ocxnoccs.length; i++) {
                var ocurrentcxnocc = ocxnoccs[i];
				var soutstring = "";
				
                if (bgrapout == true) {
					var scurrentmark = new __holder(""); 				
                    if (getcurrobjectmark(new __holder(ocurrentcxnocc.TargetObjOcc()), scurrentmark)) {
                        soutstring = ocurrentcxnocc.Cxn().ActiveType() + " " + ocurrentcxnocc.Cxn().TargetObjDef().Name(g_nloc) + " (" + scurrentmark.value + ")";
                    } else {
                        soutstring = ocurrentcxnocc.Cxn().ActiveType() + " " + ocurrentcxnocc.Cxn().TargetObjDef().Name(g_nloc);
                    }
                } else {
                    soutstring = ocurrentcxnocc.Cxn().ActiveType() + " " + ocurrentcxnocc.Cxn().TargetObjDef().Name(g_nloc);
                }
                g_ooutfile.OutputLn(soutstring, getString("TEXT16"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, (ndepthlevel.value * 10));
            }
        }
    }
}


// ********************************************************************************************************************
// *  Subroutine GetStartFunc																							*
// *	Subprogram for determining the start objects of the current model.												*
// ********************************************************************************************************************
// *  Parameter																										*
// *  oCurrentModel = Current model 																				*
// *	oStartFunc = List containing the start functions(ObjOcc) of the current model.										*
// ********************************************************************************************************************
function getstartfunc(ocurrentmodel, ostartobjoccs)
{
    var bcheck = false; 
    
    ostartobjoccs.value = ocurrentmodel.value.StartNodeList();
    if (ostartobjoccs.value.length > 0) {
        // Elements that are not of the function or event type will be removed from the list.
        while (bcheck == false) {
            bcheck = true;
			
            for (var i = 0; i < ostartobjoccs.value.length; i++) {
                if (ostartobjoccs.value[i].ObjDef().TypeNum() != Constants.OT_FUNC && ostartobjoccs.value[i].ObjDef().TypeNum() != Constants.OT_EVT) {
                    ostartobjoccs.value = doDelete(ostartobjoccs, ostartobjoccs.value[i]);
                    bcheck = false;
                    break;
                }
            }
        }
    }
}

function createmarkedlist(ocurrentmodel)
{
    g_tmarkedobjoccs = new Array();
    
    // Get marked ObjOccs
    var oobjocclist = ocurrentmodel.value.ObjOccList();
    for (var i = 0; i < oobjocclist.length; i++) {
        var ocurrentobjocc = oobjocclist[i];
        if (ocurrentmodel.value.Mark(ocurrentobjocc) != "") {
            var nindex = g_tmarkedobjoccs.length;
            g_tmarkedobjoccs[nindex] = new __usertype_tmarkedobjocctype();
            g_tmarkedobjoccs[nindex].smark = "";
            g_tmarkedobjoccs[nindex].omarkednode = ocurrentobjocc;
            g_tmarkedobjoccs[nindex].osuccnodes = ocurrentmodel.value.GetSuccNodes(ocurrentobjocc);
        }
    }
}

function getcurrobjectmark(ocurrentobjocc, scurrentmark)
{
    var nindex = 0; 
    var binlist = false; 
    
    if (g_tmarkedobjoccs.length > 0 && ! (( typeof(g_tmarkedobjoccs[0].omarkednode) == "object" && g_tmarkedobjoccs[0].omarkednode == null))) {

		for (var i = 0; i < g_tmarkedobjoccs.length; i++) {
            if (ocurrentobjocc.value.IsEqual(g_tmarkedobjoccs[i].omarkednode)) {
                nindex = i;
                binlist = true;
                break;
            }
        }
    }
    
    if (binlist) {
        if (g_tmarkedobjoccs[nindex].smark == "") {
            g_tmarkedobjoccs[nindex].smark = (txtMark + " " + g_nmarkcounter);
            g_nmarkcounter++;
        }
        
        scurrentmark.value = g_tmarkedobjoccs[nindex].smark;
        return true;
    } else {
        scurrentmark.value = "";
        return false;
    }
}

function getpredobjectmark(ocurrentobjocc, spredmark)
{
    var nindex = 0; 
    var binlist = false; 
	
    if (g_tmarkedobjoccs.length > 0 && ! (( typeof(g_tmarkedobjoccs[0].omarkednode) == "object" && g_tmarkedobjoccs[0].omarkednode == null))) {
        for (var i = 0; i < g_tmarkedobjoccs.length; i++) {
            var osuccnodes = g_tmarkedobjoccs[i].osuccnodes;
            if (osuccnodes.length > 0) {
                for (var j = 0; j < osuccnodes.length; j++) {
                    if (ocurrentobjocc.value.IsEqual(osuccnodes[j])) {
                        nindex = i;
                        binlist = true;
                        break;
                    }
                }
            }
            if (binlist) {
                break;
            }
        }
    }
    
    if (binlist) {
        spredmark.value = g_tmarkedobjoccs[nindex].smark;
        return true;
    } else {
        spredmark.value = "";
        return false;
    }
}

function doDelete(arr, obj)
{
    if (typeof(arr)=="object" && arr.constructor.toString().indexOf("__isHolder")!=-1)
        arr = arr.value;
    
    if(arr==null || arr.length==0)
        return arr;
    
    if(!isNaN(obj)) {
        arr.splice(obj, 1);
    } else {
        for(var i=0; i<arr.length; i++) {
            if(arr[i] == obj) {
                arr.splice(i, 1);
                break;
            }
        }
    }
    return arr;
}


main();