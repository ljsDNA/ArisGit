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

var g_ooutfile = g_ooutfile = Context.createOutputObject();
g_ooutfile.DefineF("REPORT1", getString("TEXT1"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
g_ooutfile.DefineF("REPORT2", getString("TEXT1"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
g_ooutfile.DefineF("REPORT3", getString("TEXT1"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);


function main()
{   
    outHeaderFooter();    

    var oobjdefs = ArisData.getSelectedObjDefs();
    if (oobjdefs.length > 0) {
		var ofuncs = new Array();
		
		var ncheckmsg = 0;   // Variable containing the answer to the message (2 = Abort was selected).
		var bfuncok = false;
		var binvalidfound = false; 
		
        for (var j = 0; j < oobjdefs.length; j++) {
            var ocurrentobjdef = oobjdefs[j];
            if (ocurrentobjdef.TypeNum() == Constants.OT_FUNC) {
                bfuncok = true;
                ofuncs[ofuncs.length] = ocurrentobjdef;
            } else {
                binvalidfound = true;
            }
        }
        
        if (bfuncok == false) {
            Dialogs.MsgBox(getString("TEXT8"), Constants.MSGBOX_BTN_OK, getString("TEXT4"));
            Context.setScriptError(Constants.ERR_NOFILECREATED);
        } else {
            if (binvalidfound == true) {
                ncheckmsg = Dialogs.MsgBox(getString("TEXT9"), Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT4"));
            }
        }
        
        if (bfuncok == true && ! (ncheckmsg == 2)) {
            var ncount = 1;
            var oSuperFuncs = new Array();      
            checkhiera(ofuncs, oSuperFuncs, ncount);
            g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
        } else {
            Context.setScriptError(Constants.ERR_CANCEL);
        }
    } else {
        Dialogs.MsgBox(getString("TEXT10"), Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT4"));
        Context.setScriptError(Constants.ERR_NOFILECREATED);
    }
}


// ********************************************************************************************************
// *  Subprogram CheckHiera for creating the hierarchy of the functions                                *
// ********************************************************************************************************
// *  Transfer parameter                                                                                  *
// *  oObjDefs = List of functions.
// * oSuperFuncs = List of functions on higher level                                                    *
// *  nCount = counter													                            *
// ********************************************************************************************************

function checkhiera(oobjdefs, oSuperFuncs, ncount)
{
    var odoneobjdefs = new Array();	// List of objects which have already been edited on this hierarchy level.
    
    if (oobjdefs.length > 0) {
        oobjdefs = ArisData.sort(oobjdefs, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
        for (var i = 0; i < oobjdefs.length; i++) {
            
            var ocurrentobjdef = oobjdefs[i];
            
            if (ncount == 1) {
                g_ooutfile.OutputLn("", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
                g_ooutfile.OutputLn((getString("TEXT11") + ocurrentobjdef.Name(g_nloc)), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
            }
            
            var nIndent = 0;
            for (var j = 1 ; j < ncount; j++) {
                nIndent = nIndent + 3; //use 3mm indent per level
            }
            
            g_ooutfile.OutputLn(ocurrentobjdef.Name(g_nloc), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, nIndent);
            
            if (!isInList(ocurrentobjdef, oSuperFuncs)) {
                var oNewSuperFuncs = new Array();
                oNewSuperFuncs = oNewSuperFuncs.concat(oSuperFuncs);
                oNewSuperFuncs.push(ocurrentobjdef);
                
                var ofuncs = new Array();
                
                // First of all the direct relationships of the function.
                var ocxns = ocurrentobjdef.CxnList();
                if (ocxns.length > 0) {
                    for (var h = 0; h < ocxns.length; h++) {
                        var ocurrentcxn = ocxns[h];
                        if ((ocurrentcxn.TypeNum() == Constants.CT_IS_PRCS_ORNT_SUPER)) {
                            // Is process-oriented inferior.
                            var otempobjdef = ocurrentcxn.TargetObjDef();
                            
                            if (! (otempobjdef.IsEqual(ocurrentobjdef))) {
                                var bdone = isDone(otempobjdef, odoneobjdefs);

                                if (bdone == false) {
                                    ofuncs[ofuncs.length] = otempobjdef;
                                    odoneobjdefs[odoneobjdefs.length] = otempobjdef;
                                }
                            }
                        }
                    }
                }
                
                // Now the relationships that were created by the assignments.
                var omodels = ocurrentobjdef.AssignedModels();
                for (var h = 0; h < omodels.length; h++) {
                    var ocurrentmodel = omodels[h];
                    var oObjDefsInModel = ocurrentmodel.ObjDefListFilter(Constants.OT_FUNC);
                    
                    for (var k = 0; k < oObjDefsInModel.length; k++) {
                        var otempobjdef = oObjDefsInModel[k];
                        if (! (otempobjdef.IsEqual(ocurrentobjdef))) {
                            var bdone = isDone(otempobjdef, odoneobjdefs);

                            if (bdone == false) {
                                ofuncs[ofuncs.length] = otempobjdef;
                                odoneobjdefs[odoneobjdefs.length] = otempobjdef;
                            }
                        }
                    }
                }
                // Now, call recursively.
                if (ofuncs.length > 0) {
                    checkhiera(ofuncs, oNewSuperFuncs, (ncount + 1));
                }
            }
        }
    }
}

function isDone(otempobjdef, odoneobjdefs) {
    if (odoneobjdefs.length > 0) {
        for (var j = 0; j < odoneobjdefs.length; j++) {
            var ocurrentdoneobjdef = odoneobjdefs[j];
            
            if (ocurrentdoneobjdef.IsEqual(otempobjdef)) {
                return true;
            }
        }
    }
    return false;
}

function isInList(ocurrelement, oelements) {
    for (var i = 0 ; i < oelements.length; i++ ) {
        if (ocurrelement.IsEqual(oelements[i])) {
            return true;
        }
    }
    return false;
}

function outHeaderFooter() {
    // BLUE-17783 Update report header/footer
    var borderColor = getColorByRGB( 23, 118, 191);  
        
    // graphics used in header
    var pictleft = Context.createPicture(Constants.IMAGE_LOGO_LEFT);
    var pictright = Context.createPicture(Constants.IMAGE_LOGO_RIGHT);
    
    // Header + footer
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
    g_ooutfile.Output(getString("TEXT2"), getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_PAGE, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
    g_ooutfile.Output(getString("TEXT3"), getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_NUMPAGES, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
    g_ooutfile.EndTable("", 100, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.EndFooter();
    
    g_ooutfile.ResetFrameStyle();
    
    // Headline
    g_ooutfile.OutputLnF("", "REPORT1");
    g_ooutfile.OutputLnF(getString("TEXT4"), "REPORT1");
    g_ooutfile.OutputLnF("", "REPORT1");
    
    // Information header.
    g_ooutfile.OutputLnF((getString("TEXT5") + ArisData.getActiveDatabase().ServerName()), "REPORT2");
    g_ooutfile.OutputLnF((getString("TEXT6") + ArisData.getActiveDatabase().Name(g_nloc)), "REPORT2");
    g_ooutfile.OutputLnF((getString("TEXT7") + ArisData.getActiveUser().Name(g_nloc)), "REPORT2");
    g_ooutfile.OutputLnF("", "REPORT2");
}

function setFrameStyle(outfile, iFrame) { 
    outfile.SetFrameStyle(Constants.FRAME_TOP, 0); 
    outfile.SetFrameStyle(Constants.FRAME_LEFT, 0); 
    outfile.SetFrameStyle(Constants.FRAME_RIGHT, 0); 
    outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 0);
    
    outfile.SetFrameStyle(iFrame, 50, Constants.BRDR_NORMAL);
} 


main();
