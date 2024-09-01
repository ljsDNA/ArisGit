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

__usertype_askusertyp = function() {
    this.nmodeltypes = 0;                   // Variable whether model types should be evaluated ( 0 = No/ 1 = Yes).
    this.nmodelltypeattributes = 0;         // Variable whether model attribute types should be evaluated ( 0 = No/ 1 = Yes ).
    this.nsymboltypes = 0;                  // Variable whether symbol types should be evaluated ( 0 = No/ 1 = Yes).
    this.nobjecttypeattributes = 0;         // Variable whether object attribute types should be evaluated (0 = No/ 1 = Yes).
    this.nobjectassignments = 0;            // Variable whether object assignments should be evaluated ( 0 = No/ 1 = Yes ).
    this.nrelationshiptypes = 0;            // Variable whether relationship types should be evaluated ( 0 = No/ 1 = Yes ).
    this.nrelationshipattributes = 0;       // Variable whether relationship attribute types should be evaluated (0 = No/1 = Yes).
    this.nrelationshipassignments = 0;      // Variable whether relationship assignments should be evaluated ( 0 = No/ 1 = Yes ).
    this.naddtypenums = 0;                  // Variable whether type numbers should be added ( 0 = No/ 1 = Yes ).
    this.bcheckuserdialog = false;          // Variable for checking whether the user has selected Cancel in the dialog boxes.
}

var g_nloc = Context.getSelectedLanguage(); // Variable for the ID of the current language.
var g_ooutfile = null;                      // Object used for the output of the report.
var g_bisExcel = false;                     // True, if output to Excel.

var g_bgetmodeltype = false;                // Indicator flag whether the supprogram (GetModelTypes) has already been executed.
var g_bgetobjtypes = false;                 // Indicator flag whether the subprogram (GetObjTypes) has already been executed.
var g_bgetrelations = false;                // Indicator flag whether the subprogram (GetRelationShips) has already been executed.


var crow_max = 60000; 


function main() 
{
    var nallallowedmodeltypes = new Array();      // List containing all allowed model type numbers of the current filter.
    var nallallowedobjecttypes = new Array();     // List containing all allowed object type numbers of the current filter.
    var nallallowedrelationships = new Array();   // List containing all allowed relationship type numbers of the current filter.

    var ofilters = ArisData.getSelectedFilters();
    if (ofilters.length > 0) {
        var ocurrentfilter = ofilters[0];
        
        if (ocurrentfilter.IsFullMethod()) {
            // Anubis 464247
            Dialogs.MsgBox(getString("TEXT44"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_INFORMATION, Context.getScriptInfo(Constants.SCRIPT_NAME));            
            return;
        }
        
        if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) g_bisExcel = true;
        
        // Subroutine UserDlg
        var askdlg = new __usertype_askusertyp();
        userdlg(askdlg);
        if (askdlg.bcheckuserdialog == true) {
            if (askdlg.nmodeltypes == 1 || 
                askdlg.nmodelltypeattributes == 1 || 
                askdlg.nsymboltypes == 1 || 
                askdlg.nobjecttypeattributes == 1 || 
                askdlg.nobjectassignments == 1 || 
                askdlg.nrelationshiptypes == 1 || 
                askdlg.nrelationshipattributes == 1 || 
                askdlg.nrelationshipassignments == 1) {
                
                var bAddTypeNum = (askdlg.naddtypenums == 1);
                
                g_ooutfile = Context.createOutputObject();
                // Subroutine ReportHead
                reporthead();
                g_ooutfile.OutputLn(ocurrentfilter.Name(g_nloc), getString("TEXT1"), 10, 0, - 1, 8, 0);
                g_ooutfile.OutputLn((getString("TEXT2") + ocurrentfilter.FilterKey()), getString("TEXT1"), 10, 0, - 1, 8, 0);
                g_ooutfile.OutputLn((getString("TEXT3") + ocurrentfilter.Description(g_nloc)), getString("TEXT1"), 10, 0, - 1, 8, 0);

                if (askdlg.nmodeltypes == 1) {
                    if (!g_bgetmodeltype) nallallowedmodeltypes = getmodeltypes(ocurrentfilter);
                    outmodels(ocurrentfilter, nallallowedmodeltypes, bAddTypeNum);
                }
                if (askdlg.nmodelltypeattributes == 1) {
                    if (!g_bgetmodeltype) nallallowedmodeltypes = getmodeltypes(ocurrentfilter);
                    outmodelattribute(ocurrentfilter, nallallowedmodeltypes, bAddTypeNum);
                }
                if (askdlg.nsymboltypes == 1) {
                    if (!g_bgetmodeltype) nallallowedmodeltypes = getmodeltypes(ocurrentfilter);
                    if (!g_bgetobjtypes)  nallallowedobjecttypes = getobjtypes(ocurrentfilter);
                    outsym(ocurrentfilter, nallallowedmodeltypes, nallallowedobjecttypes, bAddTypeNum);
                }
                if (askdlg.nobjecttypeattributes == 1) {
                    if (!g_bgetobjtypes) nallallowedobjecttypes = getobjtypes(ocurrentfilter);
                    outobjattr(ocurrentfilter, nallallowedobjecttypes, bAddTypeNum);
                }
                if (askdlg.nobjectassignments == 1) {
                    if (!g_bgetobjtypes) nallallowedobjecttypes = getobjtypes(ocurrentfilter);
                    outobjectassignments(ocurrentfilter, nallallowedobjecttypes, bAddTypeNum);
                }
                if (askdlg.nrelationshiptypes == 1) {
                    if (!g_bgetmodeltype) nallallowedmodeltypes = getmodeltypes(ocurrentfilter);
                    outrelationships(ocurrentfilter, nallallowedmodeltypes, bAddTypeNum);
                }
                if (askdlg.nrelationshipattributes == 1) {
                    if (!g_bgetrelations) nallallowedrelationships = getrelationships(ocurrentfilter);
                    outrelationshipsattribute(ocurrentfilter, nallallowedrelationships, bAddTypeNum);
                }
                if (askdlg.nrelationshipassignments == 1) {
                    if (!g_bgetrelations) nallallowedrelationships = getrelationships(ocurrentfilter);
                    outrelationshipassignments(ocurrentfilter, nallallowedrelationships, bAddTypeNum);
                }
                g_ooutfile.WriteReport();
            } else {
                Dialogs.MsgBox(getString("TEXT4"), Constants.MSGBOX_BTN_OK, getString("TEXT5"));
                Context.setScriptError(Constants.ERR_CANCEL);
            }
        } else {
            Context.setScriptError(Constants.ERR_CANCEL);
        }
    } else {
        Dialogs.MsgBox(getString("TEXT6"), Constants.MSGBOX_BTN_OK, getString("TEXT5"));
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}

function addTypeNum(nTypeNum) {
    return formatstring1(" (@1)", nTypeNum);
}

// ########################################################################################################################
// ######################################## OutObjectAssignments ##########################################################
// ########################################################################################################################
// ********************************************************************************************************************
// *  Subroutine OutObjectAssignments   																			  *
// *	Subprogram for outputting the allowed object assignments of the current filter.						          *
// ********************************************************************************************************************
// *  Parameter																										  *
// *	oCurrentFilter = Current filter.																			  *
// *	nAllAllowedObjectTypes() = List containing all allowed object type numbers of the current filter.			  *
// ********************************************************************************************************************
function outobjectassignments(ocurrentfilter, nallallowedobjecttypes, bAddTypeNum) 
{
    var ntablecount = 1; 
    var nrowcount = 0; 
    
    var soutstring = ""; 
    if (g_bisExcel) soutstring = getString("TEXT7");
    
    // Create table sheet.
    g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.OutputLn(getString("TEXT7"), getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
    // Table heading.
    nrowcount = nrowcount + 1;
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(getString("TEXT8"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
    g_ooutfile.TableCell(getString("TEXT9"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0); 
    var bColored = false;   // variable to change background color of table rows 
    
    for (var i = 0; i < nallallowedobjecttypes.length; i++) {
        var bFirst = true;
        var sObjectType = ocurrentfilter.ObjTypeName(nallallowedobjecttypes[i]);
        if (bAddTypeNum) sObjectType += addTypeNum(nallallowedobjecttypes[i]);
        
        var nobjectassignmentstypenum = ocurrentfilter.Assignments(Constants.CID_OBJDEF, nallallowedobjecttypes[i]);
        nobjectassignmentstypenum.sort(sortByModelTypeName);

        // Excel: New table cause to many rows (> 60000)
        if (g_bisExcel && nrowcount + nobjectassignmentstypenum.length >= crow_max) {
            createNewTable();
            bFirst = true;
        }
        
        for (var j = 0; j < nobjectassignmentstypenum.length; j++) {
            var sModelType = ocurrentfilter.ModelTypeName(nobjectassignmentstypenum[j]);
            if (bAddTypeNum) sModelType += addTypeNum(nobjectassignmentstypenum[j]);
            
            nrowcount = nrowcount + 1;
            g_ooutfile.TableRow();
            g_ooutfile.TableCell(sObjectType, 50, getString("TEXT1"), 10, bFirst ? Constants.C_BLACK : Constants.C_GREY_80_PERCENT, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
            g_ooutfile.TableCell(sModelType, 50, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
            bFirst = false;
        }
        bColored = !bColored; // Change background color        
    }
    g_ooutfile.EndTable(soutstring, 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);

    /************************************************************************************************/

    function createNewTable() {
        nrowcount = 0;
        g_ooutfile.EndTable(soutstring, 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);
        
        ntablecount = ntablecount + 1;
        soutstring = "";
        if (g_bisExcel) soutstring = getString("TEXT7") + ntablecount;
        
        g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
        // Table heading.
        nrowcount = nrowcount + 1;
        g_ooutfile.TableRow();
        g_ooutfile.TableCell(getString("TEXT8"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        g_ooutfile.TableCell(getString("TEXT9"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        bColored = false;
    }
    
    function sortByModelTypeName(a, b) {
        return StrComp(ocurrentfilter.ModelTypeName(a), ocurrentfilter.ModelTypeName(b));
    }     
}

// ########################################################################################################################
// ######################################## OutRelationshipAssignments ####################################################
// ########################################################################################################################
// ********************************************************************************************************************
// *  Subroutine OutRelationshipAssignments     																	  *
// *	Subprogram for outputting the allowed object assignments of the current filter.						          *
// ********************************************************************************************************************
// *  Parameter																										  *
// *	oCurrentFilter = Current filter.																			  *
// *    nAllAllowedRelationships() = List containing all allowed relationship type numbers of the current filter.	  *
// ********************************************************************************************************************
function outrelationshipassignments(ocurrentfilter, nallallowedrelationships, bAddTypeNum) 
{
    var ntablecount = 1; 
    var nrowcount = 0; 
    
    var soutstring = ""; 
    if (g_bisExcel) soutstring = getString("TEXT46");
    
    // Create table sheet.
    g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.OutputLn(getString("TEXT46"), getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
    // Table heading.
    nrowcount = nrowcount + 1;
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(getString("TEXT23"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
    g_ooutfile.TableCell(getString("TEXT9"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0); 
    var bColored = false;   // variable to change background color of table rows 
    
    for (var i = 0; i < nallallowedrelationships.length; i++) {
        var bFirst = true;
        var sCxnType = ocurrentfilter.ActiveCxnTypeName(nallallowedrelationships[i]);
        if (bAddTypeNum) sCxnType += addTypeNum(nallallowedrelationships[i]);
        
        var nrelationshipassignmentstypenum = ocurrentfilter.Assignments(Constants.CID_CXNDEF, nallallowedrelationships[i]);
        nrelationshipassignmentstypenum.sort(sortByModelTypeName);

        // Excel: New table cause to many rows (> 60000)
        if (g_bisExcel && nrowcount + nrelationshipassignmentstypenum.length >= crow_max) {
            createNewTable();
            bFirst = true;
        }
        
        for (var j = 0; j < nrelationshipassignmentstypenum.length; j++) {
            var sModelType = ocurrentfilter.ModelTypeName(nrelationshipassignmentstypenum[j]);
            if (bAddTypeNum) sModelType += addTypeNum(nrelationshipassignmentstypenum[j]);
            
            nrowcount = nrowcount + 1;
            g_ooutfile.TableRow();
            g_ooutfile.TableCell(sCxnType, 50, getString("TEXT1"), 10, bFirst ? Constants.C_BLACK : Constants.C_GREY_80_PERCENT, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
            g_ooutfile.TableCell(sModelType, 50, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
            bFirst = false;
        }
        bColored = !bColored; // Change background color        
    }
    g_ooutfile.EndTable(soutstring, 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);

    /************************************************************************************************/

    function createNewTable() {
        nrowcount = 0;
        g_ooutfile.EndTable(soutstring, 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);
        
        ntablecount = ntablecount + 1;
        soutstring = "";
        if (g_bisExcel) soutstring = getString("TEXT7") + ntablecount;
        
        g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
        // Table heading.
        nrowcount = nrowcount + 1;
        g_ooutfile.TableRow();
        g_ooutfile.TableCell(getString("TEXT8"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        g_ooutfile.TableCell(getString("TEXT9"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        bColored = false;
    }
    
    function sortByModelTypeName(a, b) {
        return StrComp(ocurrentfilter.ModelTypeName(a), ocurrentfilter.ModelTypeName(b));
    }     
}

// ########################################################################################################################
// ######################################## OutModelAttribute #############################################################
// ########################################################################################################################
// ********************************************************************************************************************
// *  Subroutine OutModelAttribute																					  *
// *	Subprogram for outputting the allowed model attribute types of the current filter.							  *
// ********************************************************************************************************************
// *  Parameter																										  *
// *	oCurrentFilter = Current filter.																			  *
// *  Parameter																										  *
// *	oCurrentFilter = Current filter.																			  *
// *	nAllAllowedModelTypes() = List containing all allowed model type numbers of the current filter. 			  *
// ********************************************************************************************************************
function outmodelattribute(ocurrentfilter, nallallowedmodeltypes, bAddTypeNum)
{
    var ntablecount = 1; 
    var nrowcount = 0; 
    
    var soutstring = ""; 
    if (g_bisExcel) soutstring = getString("TEXT10");
    
    // Create table sheet.
    g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.OutputLn(getString("TEXT10"), getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
    // Table heading.
    nrowcount = nrowcount + 1;
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(getString("TEXT9"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
    g_ooutfile.TableCell(getString("TEXT11"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
    var bColored = false;   // variable to change background color of table rows 
    
    for (var i = 0; i < nallallowedmodeltypes.length; i++) {
        var bFirst = true;
        var sModelType = ocurrentfilter.ModelTypeName(nallallowedmodeltypes[i]);
        if (bAddTypeNum) sModelType += addTypeNum(nallallowedmodeltypes[i]);
        
        var nattrtypenum = ocurrentfilter.AttrTypes(Constants.CID_MODEL, nallallowedmodeltypes[i]);
        
        // Excel: New table cause to many rows (> 60000)
        if (g_bisExcel && nrowcount + nattrtypenum.length >= crow_max) {
            createNewTable();
            bFirst = true;
        }
        
        for (var j = 0; j < nattrtypenum.length; j++) {
            var sAttrType = ocurrentfilter.AttrTypeName(nattrtypenum[j]);
            if (bAddTypeNum) sAttrType += addTypeNum(nattrtypenum[j]);
            
            nrowcount = nrowcount + 1;
            g_ooutfile.TableRow();
            g_ooutfile.TableCell(sModelType, 50, getString("TEXT1"), 10, bFirst ? Constants.C_BLACK : Constants.C_GREY_80_PERCENT, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
            g_ooutfile.TableCell(sAttrType, 50, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
            bFirst = false;
        }
        bColored = !bColored; // Change background color
    }
    g_ooutfile.EndTable(soutstring, 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);
    
    /************************************************************************************************/

    function createNewTable() {
        nrowcount = 0;
        g_ooutfile.EndTable(soutstring, 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);
        
        ntablecount = ntablecount + 1;
        soutstring = "";
        if (g_bisExcel) soutstring = getString("TEXT10") + ntablecount;
        
        g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
        // Table heading.
        nrowcount = nrowcount + 1;
        g_ooutfile.TableRow();
        g_ooutfile.TableCell(getString("TEXT9"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        g_ooutfile.TableCell(getString("TEXT11"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        bColored = false;
    }
}

// ########################################################################################################################
// ######################################## OutModels #####################################################################
// ########################################################################################################################
// ********************************************************************************************************************
// *  Subroutine OutModels																							  *
// *	Subprogram for outputting the allowed model types of the current filter.									  *
// ********************************************************************************************************************
// *  Parameter																										  *
// *	oCurrentFilter = Current filter.																			  *
// *	nAllAllowedModelTypes() = List containing all allowed model type numbers of the current filter. 			  *
// ********************************************************************************************************************
function outmodels(ocurrentfilter, nallallowedmodeltypes, bAddTypeNum)
{
    if (nallallowedmodeltypes.length > 0) {
        // Create table sheet.
        g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
        g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
        g_ooutfile.OutputLn(getString("TEXT12"), getString("TEXT1"), 10, 0, - 1, 8, 0);
        g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
        // Table heading.
        g_ooutfile.TableRow();
        g_ooutfile.TableCell(getString("TEXT9"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        g_ooutfile.TableCell(getString("TEXT13"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        var bColored = false;   // variable to change background color of table rows
        
        for (var i = 0; i < nallallowedmodeltypes.length; i++) {
            var sModelType = ocurrentfilter.ModelTypeName(nallallowedmodeltypes[i]);
            if (bAddTypeNum) sModelType += addTypeNum(nallallowedmodeltypes[i]);
            
            g_ooutfile.TableRow();
            g_ooutfile.TableCell(sModelType, 50, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, 8, 0);
            
            var sarisview = "";   // String for the ARIS - View.
            switch(ocurrentfilter.View(nallallowedmodeltypes[i])) {
                case Constants.ARISVIEW_ORG:
                    sarisview = getString("TEXT14");
                    break;
                case Constants.ARISVIEW_FUNC:
                    sarisview = getString("TEXT15");
                    break;
                case Constants.ARISVIEW_DATA:
                    sarisview = getString("TEXT16");
                    break;
                case Constants.ARISVIEW_CTRL:
                    sarisview = getString("TEXT17");
                    break;
                case Constants.ARISVIEW_OUTPUT:
                    sarisview = getString("TEXT18");
                    break;
            }
            g_ooutfile.TableCell(sarisview, 50, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, 8, 0);
            bColored = !bColored; // Change background color
        }
        
        var soutstring = ""; 
        if (g_bisExcel) soutstring = getString("TEXT12");
        
        g_ooutfile.EndTable(soutstring, 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);
    } else {
        g_ooutfile.OutputLn(getString("TEXT19"), getString("TEXT1"), 10, 0, - 1, 8, 0);
    }
}

// ########################################################################################################################
// ######################################## OutObjAttr ####################################################################
// ########################################################################################################################
// ********************************************************************************************************************
// *  Subroutine OutObjAttr																							  *
// *	Subprogram for outputting the allowed object attributes of the current filter.								  *
// ********************************************************************************************************************
// *  Parameter																										  *
// *	oCurrentFilter = Current filter.																			  *
// *	nAllAllowedObjectTypes() = List containing all allowed object type numbers of the current filter.			  *
// ********************************************************************************************************************
function outobjattr(ocurrentfilter, nallallowedobjecttypes, bAddTypeNum)
{
    var ntablecount = 1; 
    var nrowcount = 0; 
    
    var soutstring = ""; 
    if (g_bisExcel) soutstring = getString("TEXT20");

    if (nallallowedobjecttypes.length > 0) {
        // Create table sheet.
        g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
        g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
        g_ooutfile.OutputLn(getString("TEXT20"), getString("TEXT1"), 10, 0, - 1, 8, 0);
        g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
        // Table heading.
        nrowcount = nrowcount + 1;
        g_ooutfile.TableRow();
        g_ooutfile.TableCell(getString("TEXT8"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        g_ooutfile.TableCell(getString("TEXT11"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        var bColored = false;   // variable to change background color of table rows
        
        for (var i = 0 ; i < nallallowedobjecttypes.length; i++) {
            var bFirst = true;
            var sObjectType = ocurrentfilter.ObjTypeName(nallallowedobjecttypes[i]);
            if (bAddTypeNum) sObjectType += addTypeNum(nallallowedobjecttypes[i]);
            
            var nattrtypenum = ocurrentfilter.AttrTypes(Constants.CID_OBJDEF, nallallowedobjecttypes[i]);

            // Excel: New table cause to many rows (> 60000)
            if (g_bisExcel && nrowcount + nattrtypenum.length >= crow_max) {
                createNewTable();
                bFirst = true;
            }

            for (var j = 0; j < nattrtypenum.length; j++) {
                var sAttrType = ocurrentfilter.AttrTypeName(nattrtypenum[j]);
                if (bAddTypeNum) sAttrType += addTypeNum(nattrtypenum[j]);
                
                nrowcount = nrowcount + 1;
                g_ooutfile.TableRow();
                g_ooutfile.TableCell(sObjectType, 50, getString("TEXT1"), 10, bFirst ? Constants.C_BLACK : Constants.C_GREY_80_PERCENT, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
                g_ooutfile.TableCell(sAttrType, 50, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
                bFirst = false;
            }
            bColored = !bColored; // Change background color
        }
        g_ooutfile.EndTable(soutstring, 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);
    } else {
        g_ooutfile.OutputLn(getString("TEXT21"), getString("TEXT1"), 10, 0, - 1, 8, 0);
    }

    /************************************************************************************************/

    function createNewTable() {
        nrowcount = 0;
        g_ooutfile.EndTable(soutstring, 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);
        
        ntablecount = ntablecount + 1;
        soutstring = "";
        if (g_bisExcel) soutstring = getString("TEXT20") + ntablecount;
        
        g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
        // Table heading.
        nrowcount = nrowcount + 1;
        g_ooutfile.TableRow();
        g_ooutfile.TableCell(getString("TEXT8"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        g_ooutfile.TableCell(getString("TEXT11"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        bColored = false;
    }
}

// ########################################################################################################################
// ######################################## OutRelationshipsAttribute #####################################################
// ########################################################################################################################
// ********************************************************************************************************************
// *  Subroutine OutRelationshipsAttribute																			  *
// *	Subprogram for outputting the allowed connections of the current filter.									  *
// ********************************************************************************************************************
// *  Parameter																										  *
// *	oCurrentFilter = Current filter.																			  *
// *    nAllAllowedRelationships() = List containing all allowed relationship type numbers of the current filter.	  *
// ********************************************************************************************************************
function outrelationshipsattribute(ocurrentfilter, nallallowedrelationships, bAddTypeNum)
{
    var ntablecount = 1; 
    var nrowcount = 0; 

    var soutstring = ""; 
    if (g_bisExcel) soutstring = getString("TEXT22");
    
    // Create table sheet.
    g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.OutputLn(getString("TEXT22"), getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
    // Table heading.
    nrowcount = nrowcount + 1;
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(getString("TEXT23"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
    g_ooutfile.TableCell(getString("TEXT11"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
    var bColored = false;   // variable to change background color of table rows
    
    for (var i = 0; i < nallallowedrelationships.length; i++) {
        var bFirst = true;
        var sCxnType = ocurrentfilter.ActiveCxnTypeName(nallallowedrelationships[i]);
        if (bAddTypeNum) sCxnType += addTypeNum(nallallowedrelationships[i]);
        
        var nattrtypenum = ocurrentfilter.AttrTypes(Constants.CID_CXNDEF, nallallowedrelationships[i]);

        // Excel: New table cause to many rows (> 60000)
        if (g_bisExcel && nrowcount + nattrtypenum.length >= crow_max) {
            createNewTable();
            bFirst = true;
        }

        for (var j = 0; j < nattrtypenum.length; j++) {
            var sAttrType = ocurrentfilter.AttrTypeName(nattrtypenum[j]);
            if (bAddTypeNum) sAttrType += addTypeNum(nattrtypenum[j]);
            
            nrowcount = nrowcount + 1;
            g_ooutfile.TableRow();
            g_ooutfile.TableCell(sCxnType, 50, getString("TEXT1"), 10, bFirst ? Constants.C_BLACK : Constants.C_GREY_80_PERCENT, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
            g_ooutfile.TableCell(sAttrType, 50, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
            bFirst = false;
        }
        bColored = !bColored; // Change background color        
    }
    g_ooutfile.EndTable(soutstring, 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);

    /************************************************************************************************/

    function createNewTable() {
        nrowcount = 0;
        g_ooutfile.EndTable(soutstring, 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);
        
        ntablecount = ntablecount + 1;
        if (g_bisExcel) soutstring = getString("TEXT22") + ntablecount;
        
        g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
        // Table heading.
        nrowcount = nrowcount + 1;
        g_ooutfile.TableRow();
        g_ooutfile.TableCell(getString("TEXT23"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        g_ooutfile.TableCell(getString("TEXT11"), 50, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        bColored = false;
    }
}

// ########################################################################################################################
// ######################################## OutRelationships ##############################################################
// ########################################################################################################################
// ********************************************************************************************************************
// *  Subroutine OutRelationships																					  *
// *	Subprogram for outputting the allowed connections of the current filter.									  *
// ********************************************************************************************************************
// *  Parameter																										  *
// *	oCurrentFilter = Current filter.																			  *
// *  Parameter																										  *
// *	oCurrentFilter = Current filter.																			  *
// *	nAllAllowedModelTypes() = List containing all allowed model type numbers of the current filter. 			  *
// ********************************************************************************************************************
function outrelationships(ocurrentfilter, nallallowedmodeltypes, bAddTypeNum)
{
    var ntablecount = 1; 
    var nrowcount = 0; 
    
    var soutstring = ""; 
    if (g_bisExcel) soutstring = getString("TEXT24");
    
    // Create table sheet.
    g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.OutputLn(getString("TEXT24"), getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
    // Table heading.
    nrowcount = nrowcount + 1;
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(getString("TEXT9"), 30, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
    g_ooutfile.TableCell(getString("TEXT25"), 22, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
    g_ooutfile.TableCell(getString("TEXT26"), 22, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
    g_ooutfile.TableCell(getString("TEXT23"), 26, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
    var bColored = false;   // variable to change background color of table rows
    
    for (var i = 0; i < nallallowedmodeltypes.length; i++) {
        var bFirstModel = true;
        var sModelType = ocurrentfilter.ModelTypeName(nallallowedmodeltypes[i]);
        if (bAddTypeNum) sModelType += addTypeNum(nallallowedmodeltypes[i]);
        
        var nsymtypenum = ocurrentfilter.Symbols(nallallowedmodeltypes[i]);
        nsymtypenum.sort(sortBySymbolName);
        
        for (var j = 0; j < nsymtypenum.length; j++) {
            var bFirstSrc = true;
            for (var h = 0; h < nsymtypenum.length; h++) {
                var bFirstTrg = true;                
                var ncxntypenum = ocurrentfilter.CxnTypes(nallallowedmodeltypes[i], nsymtypenum[j], nsymtypenum[h]);
                ncxntypenum.sort(sortByActiveCxnTypeName);

                // Excel: New table cause to many rows (> 60000)
                if (g_bisExcel && nrowcount + ncxntypenum.length >= crow_max) {
                    createNewTable();
                    bFirstModel = true;
                    bFirstSrc = true;
                    bFirstTrg = true;                    
                }
                
                for (var n = 0; n < ncxntypenum.length; n++) {
                    var sSrcSymbolType = ocurrentfilter.SymbolName(nsymtypenum[j]);
                    var sTrgSymbolType = ocurrentfilter.SymbolName(nsymtypenum[h]);
                    var sCxnType = ocurrentfilter.ActiveCxnTypeName(ncxntypenum[n]);
                    
                    if (bAddTypeNum) {
                        sSrcSymbolType += addTypeNum(nsymtypenum[j]);
                        sTrgSymbolType += addTypeNum(nsymtypenum[h]);
                        sCxnType += addTypeNum(ncxntypenum[n]);
                    }
                    nrowcount = nrowcount + 1;
                    g_ooutfile.TableRow();
                    g_ooutfile.TableCell(sModelType, 30, getString("TEXT1"), 10, bFirstModel ? Constants.C_BLACK : Constants.C_GREY_80_PERCENT, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
                    g_ooutfile.TableCell(sSrcSymbolType, 22, getString("TEXT1"), 10, bFirstSrc ? Constants.C_BLACK : Constants.C_GREY_80_PERCENT, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
                    g_ooutfile.TableCell(sTrgSymbolType, 22, getString("TEXT1"), 10, bFirstTrg ? Constants.C_BLACK : Constants.C_GREY_80_PERCENT, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
                    g_ooutfile.TableCell(sCxnType, 26, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
                    bFirstModel = false;
                    bFirstSrc = false;
                    bFirstTrg = false;                    
                }
            }
        }
        bColored = !bColored; // Change background color            
    }
    g_ooutfile.EndTable(soutstring, 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);

    /************************************************************************************************/

    function createNewTable() {
        nrowcount = 0;
        g_ooutfile.EndTable(soutstring, 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);
        
        ntablecount = ntablecount + 1;
        if (g_bisExcel) soutstring = getString("TEXT24") + ntablecount;
        
        g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
        // Table heading.
        nrowcount = nrowcount + 1;
        g_ooutfile.TableRow();
        g_ooutfile.TableCell(getString("TEXT9"), 30, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        g_ooutfile.TableCell(getString("TEXT25"), 22, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        g_ooutfile.TableCell(getString("TEXT26"), 22, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        g_ooutfile.TableCell(getString("TEXT23"), 26, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        //bColored = false;
    }

    function sortBySymbolName(a, b) {
        return StrComp(ocurrentfilter.SymbolName(a), ocurrentfilter.SymbolName(b));
    }    

    function sortByActiveCxnTypeName(a, b) {
        return StrComp(ocurrentfilter.ActiveCxnTypeName(a), ocurrentfilter.ActiveCxnTypeName(b));
    } 
}

// ########################################################################################################################
// ######################################## OutSym ########################################################################
// ########################################################################################################################
// ********************************************************************************************************************
// *  Subroutine OutSym																								  *
// *	Subprogram for outputting the allowed symbol types of the current filter.						              *
// ********************************************************************************************************************
// *  Parameter																										  *
// *	oCurrentFilter = Current filter.																			  *
// *  Parameter																										  *
// *	oCurrentFilter = Current filter.																			  *
// *	nAllAllowedModelTypes() = List containing all allowed model type numbers of the current filter. 			  *
// ********************************************************************************************************************
function outsym(ocurrentfilter, nallallowedmodeltypes, nallallowedobjecttypes, bAddTypeNum)
{
    var ntablecount = 1; 
    var nrowcount = 0; 
    
    var soutstring = ""; 
    if (g_bisExcel) soutstring = getString("TEXT27");
    
    // Create table sheet.
    g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.OutputLn("", getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.OutputLn(getString("TEXT27"), getString("TEXT1"), 10, 0, - 1, 8, 0);
    g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
    // Table heading.
    nrowcount = nrowcount + 1;
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(getString("TEXT9"), 40, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
    g_ooutfile.TableCell(getString("TEXT8"), 30, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
    g_ooutfile.TableCell(getString("TEXT28"), 30, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
    var bColored = false;   // variable to change background color of table rows
    
    for (var i = 0; i < nallallowedmodeltypes.length; i++) {
        var bFirstModel = true;
        var sModelType = ocurrentfilter.ModelTypeName(nallallowedmodeltypes[i]);
        if (bAddTypeNum) sModelType += addTypeNum(nallallowedmodeltypes[i]);
        
        for (var j = 0; j < nallallowedobjecttypes.length; j++) {
            var bFirstObject = true;
            var sObjectType = ocurrentfilter.ObjTypeName(nallallowedobjecttypes[j]);
            if (bAddTypeNum) sObjectType += addTypeNum(nallallowedobjecttypes[j]);

            var nsymtypenum = ocurrentfilter.Symbols(nallallowedmodeltypes[i], nallallowedobjecttypes[j]);
            nsymtypenum.sort(sortBySymbolName);
    
            // Excel: New table cause to many rows (> 60000)
            if (g_bisExcel && nrowcount + nsymtypenum.length >= crow_max) {
                createNewTable();
                bFirstModel = true;
                bFirstObject = true;                
            }
            
            for (var k = 0; k < nsymtypenum.length; k++) {
                var sSymbolType = ocurrentfilter.SymbolName(nsymtypenum[k]);
                if (bAddTypeNum) sSymbolType += addTypeNum(nsymtypenum[k]);
    
                nrowcount = nrowcount + 1;
                g_ooutfile.TableRow();
                g_ooutfile.TableCell(sModelType, 40, getString("TEXT1"), 10, bFirstModel ? Constants.C_BLACK : Constants.C_GREY_80_PERCENT, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
                g_ooutfile.TableCell(sObjectType, 30, getString("TEXT1"), 10, bFirstObject ? Constants.C_BLACK : Constants.C_GREY_80_PERCENT, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
                g_ooutfile.TableCell(sSymbolType, 30, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, 262152, 0);
                bFirstModel = false;
                bFirstObject = false;                
            }
        }   
        bColored = !bColored; // Change background color
    }
    g_ooutfile.EndTable(soutstring, 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);

    /************************************************************************************************/

    function createNewTable() {
        nrowcount = 0;
        g_ooutfile.EndTable(soutstring, 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);
        
        ntablecount = ntablecount + 1;
        if (g_bisExcel) soutstring = getString("TEXT27") + ntablecount;
        
        g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
        // Table heading.
        nrowcount = nrowcount + 1;
        g_ooutfile.TableRow();
        g_ooutfile.TableCell(getString("TEXT9"), 40, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        g_ooutfile.TableCell(getString("TEXT8"), 30, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        g_ooutfile.TableCell(getString("TEXT28"), 30, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, 137, 0);
        bColored = false;
    }

    function sortBySymbolName(a, b) {
        return StrComp(ocurrentfilter.SymbolName(a), ocurrentfilter.SymbolName(b));
    }
}

// ########################################################################################################################
// ######################################## UserDlg #######################################################################
// ########################################################################################################################
// ****************************************************************************************************************************
// *  Subroutine UserDlg																									  *
// *	This subprogram is needed for interrogating the user about the necessary settings for the report.				      *
// ****************************************************************************************************************************
// *  Parameter																												  *
// *	askdlg 																												  *
// *    .nmodeltypes              = Variable whether model types should be evaluated ( 0 = No/ 1 = Yes).					  * 
// *    .nmodelltypeattributes    = Variable whether model type attributes should be evaluated ( 0 = No / 1 = Yes ).	      *
// *    .nsymboltypes             = Variable whether symbol types should be evaluated ( 0 = No / 1 = Yes).					  *
// *    .nobjecttypeattributes    = Variable whether object attribute types should be evaluated (0 = No / 1 = Yes ).	      *
// *    .nobjectassignments       = Variable whether object assignments should be evaluated ( 0 = No / 1 = Yes ).			  *
// *    .nrelationshiptypes       = Variable whether relationship types should be evaluated ( 0 = No / 1 = Yes ).			  *
// *    .nrelationshipattributes  = Variable whether relationship attribute types should be evaluated (0 = No /1 = Yes).      *
// *    .nrelationshipassignments = Variable whether relationship assignments should be evaluated ( 0 = No / 1 = Yes ).		  *
// *    .naddtypenums             = Variable whether type numbers should be added ( 0 = No/ 1 = Yes ).                        *
// *    .bcheckuserdialog         = Variable for checking whether the user selected Cancel in the dialogs.				      *
// ****************************************************************************************************************************
function userdlg(askdlg)
{
    var nuserdlg = 0;   // Variable for the user dialog box
    
    var userdialog = Dialogs.createNewDialogTemplate(555, 240, getString("TEXT5"));
    userdialog.Text(10, 10, 540, 15, getString("TEXT29"));
    userdialog.Text(10, 25, 540, 15, getString("TEXT30"));
    userdialog.GroupBox(10, 50, 540, 160, getString("TEXT31"));
    userdialog.CheckBox(20, 60, 520, 15, getString("TEXT32"), "Check1");
    userdialog.CheckBox(20, 77, 520, 15, getString("TEXT33"), "Check2");
    userdialog.CheckBox(20, 94, 520, 15, getString("TEXT34"), "Check3");
    userdialog.CheckBox(20, 111, 520, 15, getString("TEXT35"), "Check4");
    userdialog.CheckBox(20, 128, 520, 15, getString("TEXT36"), "Check5");
    userdialog.CheckBox(20, 145, 520, 15, getString("TEXT37"), "Check6");
    userdialog.CheckBox(20, 162, 520, 15, getString("TEXT38"), "Check7");
    userdialog.CheckBox(20, 179, 520, 15, getString("TEXT45"), "Check8");

    userdialog.CheckBox(10, 215, 540, 15, getString("TEXT47"), "CheckTN");
    
    userdialog.OKButton();
    userdialog.CancelButton();
    userdialog.HelpButton("HID_e76a54c0_eae7_11d8_12e0_9d2843560f51_dlg_01.hlp");
    
    var dlg = Dialogs.createUserDialog(userdialog); 
    
    // Read dialog settings from config
    var sSection = "SCRIPT_e76a54c0_eae7_11d8_12e0_9d2843560f51";  
    ReadSettingsDlgValue(dlg, sSection, "Check1", 0);
    ReadSettingsDlgValue(dlg, sSection, "Check2", 0);
    ReadSettingsDlgValue(dlg, sSection, "Check3", 0);
    ReadSettingsDlgValue(dlg, sSection, "Check4", 0);
    ReadSettingsDlgValue(dlg, sSection, "Check5", 0);
    ReadSettingsDlgValue(dlg, sSection, "Check6", 0);
    ReadSettingsDlgValue(dlg, sSection, "Check7", 0);  
    ReadSettingsDlgValue(dlg, sSection, "Check8", 0);  
    ReadSettingsDlgValue(dlg, sSection, "CheckTN", 0);  
    
    nuserdlg = Dialogs.show( __currentDialog = dlg);       // Showing dialog and waiting for confirmation with OK
    askdlg.nmodeltypes = dlg.getDlgValue("Check1");
    askdlg.nmodelltypeattributes = dlg.getDlgValue("Check2");
    askdlg.nsymboltypes = dlg.getDlgValue("Check3");
    askdlg.nobjecttypeattributes = dlg.getDlgValue("Check4");
    askdlg.nobjectassignments = dlg.getDlgValue("Check5");
    askdlg.nrelationshiptypes = dlg.getDlgValue("Check6");
    askdlg.nrelationshipattributes = dlg.getDlgValue("Check7");
    askdlg.nrelationshipassignments = dlg.getDlgValue("Check8");
    askdlg.naddtypenums = dlg.getDlgValue("CheckTN");
    if (nuserdlg == 0) {
        askdlg.bcheckuserdialog = false;
    } else {
        askdlg.bcheckuserdialog = true;
        
        // Write dialog settings to config    
        WriteSettingsDlgValue(dlg, sSection, "Check1");
        WriteSettingsDlgValue(dlg, sSection, "Check2");
        WriteSettingsDlgValue(dlg, sSection, "Check3");
        WriteSettingsDlgValue(dlg, sSection, "Check4");
        WriteSettingsDlgValue(dlg, sSection, "Check5");
        WriteSettingsDlgValue(dlg, sSection, "Check6");
        WriteSettingsDlgValue(dlg, sSection, "Check7");  
        WriteSettingsDlgValue(dlg, sSection, "Check8");  
        WriteSettingsDlgValue(dlg, sSection, "CheckTN");  
    }
}

// ########################################################################################################################
// ######################################## ReportHead ####################################################################
// ########################################################################################################################
// ********************************************************************************************************************
// *  Subroutine ReportHead																							  *
// *	This subprogram is used for creating the report head when outputting text.						              *
// ********************************************************************************************************************
// *  Parameter																										  *
// ********************************************************************************************************************
function reporthead()
{
    g_ooutfile.DefineF("REPORT1", getString("TEXT1"), 24, 0, - 1, 17, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("REPORT2", getString("TEXT1"), 14, 0, - 1, 8, 0, 0, 0, 0, 0, 1);
    
    // Header + footer
    setReportHeaderFooter(g_ooutfile, g_nloc, false, false, false);

    // Headline
    g_ooutfile.OutputLnF("", "REPORT1");
    g_ooutfile.OutputLnF(getString("TEXT5"), "REPORT1");
    g_ooutfile.OutputLnF("", "REPORT1");
    
    // Information header.
    // g_oOutFile.OutputLnF(getString("TEXT41") +  ActiveDatabase.ServerName,"REPORT2")
    g_ooutfile.OutputLnF(getString("TEXT42"), "REPORT2");
    g_ooutfile.OutputLnF(getString("TEXT43"), "REPORT2");
    g_ooutfile.OutputLnF("", "REPORT2");
}

// ########################################################################################################################
// ######################################## GetModelTypes #################################################################
// ########################################################################################################################
// ********************************************************************************************************************
// *  Subroutine GetModelTypes																						  *
// *	Subprogram for determining the allowed model types of the current filter.									  *
// ********************************************************************************************************************
// *  Parameter																										  *
// *	oCurrentFilter = Current filter.																			  *
// ********************************************************************************************************************
function getmodeltypes(ocurrentfilter)
{
    g_bgetmodeltype = true;
    
    var nallallowedmodeltypes = ocurrentfilter.ModelTypes(Constants.ARISVIEW_ALL);
    
    if (nallallowedmodeltypes.length == 0) {
        g_ooutfile.OutputLn(getString("TEXT19"), getString("TEXT1"), 10, 0, - 1, 8, 0);
    }
    return nallallowedmodeltypes.sort(sortByModelTypeName);
    
    /************************************************************************************************/

    function sortByModelTypeName(a, b) {
        return StrComp(ocurrentfilter.ModelTypeName(a), ocurrentfilter.ModelTypeName(b));
    }    
}

// ########################################################################################################################
// ######################################## GetObjTypes ###################################################################
// ########################################################################################################################
// ********************************************************************************************************************
// *  Subroutine GetObjTypes																						  *
// *	Subprogram for determining the allowed object types of the current filter.									  *
// ********************************************************************************************************************
// *  Parameter																										  *
// *	oCurrentFilter = Current filter.																			  *
// ********************************************************************************************************************
function getobjtypes(ocurrentfilter)
{
    g_bgetobjtypes = true;

    var nallallowedobjecttypes = ocurrentfilter.ObjTypes();

    return nallallowedobjecttypes.sort(sortByObjTypeName);
    
    /************************************************************************************************/

    function sortByObjTypeName(a, b) {
        return StrComp(ocurrentfilter.ObjTypeName(a), ocurrentfilter.ObjTypeName(b));
    }     
}

// ########################################################################################################################
// ######################################## GetRelationShips ##############################################################
// ########################################################################################################################
// ********************************************************************************************************************
// *  Subroutine GetRelationShips																					  *
// *	Subprogram for outputting the allowed connections of the current filter.									  *
// ********************************************************************************************************************
// *  Parameter																										  *
// *	oCurrentFilter = Current filter.																			  *
// ********************************************************************************************************************
function getrelationships(ocurrentfilter)
{
    g_bgetrelationships = true;
    
    nallallowedrelationships = ocurrentfilter.GetTypes(Constants.CID_CXNDEF);
    
    return nallallowedrelationships.sort(sortByActiveCxnTypeName);
    
    /************************************************************************************************/

    function sortByActiveCxnTypeName(a, b) {
        return StrComp(ocurrentfilter.ActiveCxnTypeName(a), ocurrentfilter.ActiveCxnTypeName(b));
    }     
}

// ########################################################################################################################
// ######################################## CheckRelation #################################################################
// ########################################################################################################################
// ********************************************************************************************************************
// *  Subroutine CheckRelation																						  *
// *	Subprogram for checking whether the current connection is already contained in the list vCxnTypeNum().		  *
// ********************************************************************************************************************
// *  Parameter																									 	  *
// *	vCxnTypeNum() = List of connection numbers.																	  *
// *	nCxnTypeNum = Current connection number..																	  *
// ********************************************************************************************************************
function checkrelation(vcxntypenum, ncxntypenum)
{
    for (var i = 0; i < vcxntypenum.length; i++) {
        if (ncxntypenum == vcxntypenum[i]) return true;
    }
    return false;
}

// ########################################################################################################################
// ######################################## End ###########################################################################
// ########################################################################################################################

main();






