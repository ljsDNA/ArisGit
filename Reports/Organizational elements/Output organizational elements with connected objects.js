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

// text constants
// dialog text constants
var txtOutputOptionsDialogTitle = getString("TEXT1");
var txtOutputFormat         = getString("TEXT2");
var txtOFTable              = getString("TEXT3");
var txtOFText               = getString("TEXT4");
var txtRelations            = getString("TEXT5");
var txtRelAllFunc           = getString("TEXT6");
var txtRelExecutes          = getString("TEXT7");
var txtRelAllOrg            = getString("TEXT8");
var txtObjectGroups         = getString("TEXT9");
var txtTargetObjectGroups   = getString("TEXT10");
var txtObjectAttr           = getString("TEXT11");
var txtTargetObjectAttr     = getString("TEXT12");

// output text constants
var txtObjectName           = getString("TEXT13");
var txtObjectType           = getString("TEXT14");
var txtRelationType         = getString("TEXT15");
var txtGroup                = getString("TEXT16");

// messagebox text constants
var txtNoOrgObject              = getString("TEXT17");
var txtNoTypes                  = getString("TEXT18");
var txtAtLeastOneNotOrgElement  = getString("TEXT19")

// dialog item constants
var dicOutputFormat         = "optOutputFormat";
var dicRelations            = "optRelations";
var dicObjectGroups         = "chkObjGroups";
var dicTargetObjectGroups   = "chkTrgObjGroups";
var dicObjectAttr           = "chkObjAttr";
var dicTargetObjectAttr     = "chkTrgObjAttr";

function main()
{
    var bchecktyp 	 = false;   // For checking whether the object that is related to the current object is of the right type.
    var btruecxntype = false;   // Variable for the connection type.    
    var ncheckmsg 	 = 0;   	// Variable containing the answer to the message (2 = Abort was selected).
    
    // Set
    var nloc = Context.getSelectedLanguage();
    var nvalidobjdefs = 0;
    
    // Precondition before loop: no object has the correct type.
    var bcheckfirst       = true;
    var bcheckselection   = false;
    
    var outfile = Context.createOutputObject();
    
    var bDisableOutputOptions;
    var nDefaultOptOutputFormat;
    
    if(Context.getSelectedFormat() == Constants.OUTTEXT)  {
        bDisableOutputOptions = true;
        nDefaultOptOutputFormat = 1;
    } else if(Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX)  {
        bDisableOutputOptions = true;
        nDefaultOptOutputFormat = 0;
    } else {
        bDisableOutputOptions = false;
        var sSection = "SCRIPT_5694c3b0_eae5_11d8_12e0_9d2843560f51";
        nDefaultOptOutputFormat = Context.getProfileInt(sSection, dicOutputFormat, 0);
        
    }
    
    
    outfile.DefineF("REPORT1", getString("TEXT20"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
    outfile.DefineF("REPORT2", getString("TEXT20"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    outfile.DefineF("REPORT3", getString("TEXT20"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    
    setReportHeaderFooter(outfile, nloc, true, true, true);		// Create page header, page footer, headline and information header
    
    var oobjdefs = ArisData.getSelectedObjDefs();
    if (oobjdefs.length > 0) {
        
        var holder_nOptOutputFormat     = new __holder(nDefaultOptOutputFormat);
        var holder_nOptRelations        = new __holder(0);
        var holder_bObjectGroups        = new __holder(false);
        var holder_bTargetObjectGroups  = new __holder(false);
        var holder_bObjectAttr          = new __holder(false);
        var holder_bTargetObjectAttr    = new __holder(false);
        
        nuserdialog = showOutputOptionsDialog(bDisableOutputOptions, holder_nOptOutputFormat, holder_nOptRelations, 
        holder_bObjectGroups, holder_bTargetObjectGroups, holder_bObjectAttr, holder_bTargetObjectAttr);
        if (nuserdialog == 0) {
            Context.setScriptError(Constants.ERR_CANCEL);
            return;
        }
        
        var nOptOutputFormat      = holder_nOptOutputFormat.value;
        var nOptRelations         = holder_nOptRelations.value;
        var bObjGroups            = holder_bObjectGroups.value;
        var bTrgObjGroups         = holder_bTargetObjectGroups.value;
        var bObjAttr              = holder_bObjectAttr.value;
        var bTrgObjAttr           = holder_bTargetObjectAttr.value;
        
        var soutcxnname           = new __holder("");   // String for connection name output.
        var soutcxntargetobj      = new __holder("");   // String for target object output.
        var soutcxntargetobjtype  = new __holder("");   // String for target object type output.
        var otargetobjdef         = new __holder(null);
        
        var bColored = bObjAttr || bTrgObjAttr;   // variable to change background color of table rows          
        
        oobjdefs = ArisData.sort(oobjdefs, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, nloc);
        for (var i = 0; i < oobjdefs.length; i++) {
            var ocurrentobjdef = oobjdefs[i];
            
            // First connection (Variable used in case of tables and text)
            var bFirst = true;
            
            switch(ocurrentobjdef.TypeNum()) {
                // Organisational unit types.
                case Constants.OT_SYS_ORG_UNIT:
                case Constants.OT_SYS_ORG_UNIT_TYPE:
                case Constants.OT_ORG_UNIT:
                case Constants.OT_ORG_UNIT_TYPE:
                case Constants.OT_PERS:
                case Constants.OT_PERS_TYPE:
                case Constants.OT_POS:
                case Constants.OT_LOC:
                case Constants.OT_GRP:
					bchecktyp = true;
					break;
                default:
					bchecktyp = false;
            }
            
            if (bchecktyp == true) {
                // Has the correct type.
                nvalidobjdefs++;
                
                if (nOptOutputFormat==0) {
                    // ------------------------------  Table ---------------------------------------------------------------
                    
                    if (bcheckfirst == true) {
                        outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
                        
                        var colHeadings = new Array(txtObjectName, txtObjectType, txtRelationType, txtObjectName, txtObjectType);
                        writeTableHeaderWithColor(outfile, colHeadings, 12, getTableCellColor_Head(), Constants.C_WHITE);
                        bcheckfirst = false;
                    }
                    
                    // flag, show if there are relations
                    var bHasRelations = false;
                    
                    var nColor = getTableCellColor_Bk(bColored);
                    var nFontColor = getTableCellColor_Font(bColored);
                    if (bObjAttr && bTrgObjAttr) {
                        nColor = getTableCellColor_Head();
                        nFontColor = Constants.C_WHITE;
                    }
                    
                    outfile.TableRow();
                    outfile.TableCell(ocurrentobjdef.Name(nloc), 20, getString("TEXT20"), 12, nFontColor, nColor, 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_BOLD, 0);
                    outfile.TableCell(ocurrentobjdef.Type(), 20, getString("TEXT20"), 12, nFontColor, nColor, 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_BOLD, 0);
                    
                    var ocxns = ocurrentobjdef.CxnList();
                    if (ocxns.length > 0) {
                        for (var j = 0; j < ocxns.length; j++) {
                            var ocurrentcxn = ocxns[j];
                            soutcxnname.value             = "";
                            soutcxntargetobj.value        = "";
                            soutcxntargetobjtype.value    = "";
                            otargetobjdef.value           = null;
                            btruecxntype                  = false;
                            
                            // Check of the current relation according to selected relation setting
                            if(nOptRelations==0) {
                                btruecxntype = getcxn2func(nloc, ocurrentobjdef, ocurrentcxn, soutcxnname, soutcxntargetobj, soutcxntargetobjtype, otargetobjdef);
                            } else if(nOptRelations==1 && (ocurrentcxn.TypeNum()== 65 || ocurrentcxn.TypeNum()== 218)) {
                                btruecxntype = getcxn2func(nloc, ocurrentobjdef, ocurrentcxn, soutcxnname, soutcxntargetobj, soutcxntargetobjtype, otargetobjdef);
                            } else if(nOptRelations==2) {
                                btruecxntype = getcxn2org(nloc, ocurrentobjdef, ocurrentcxn, soutcxnname, soutcxntargetobj, soutcxntargetobjtype, otargetobjdef);
                            }
                            
                            if (btruecxntype == true) {
                                bHasRelations = true;
                                
                                // Group and/or Attribute data on first relation
                                if(bFirst && (bObjGroups || bObjAttr)) {
                                    outfile.TableCell("", 60, getString("TEXT20"), 12, nFontColor, nColor, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                                    // Group 
                                    if (bObjGroups) {
                                        outfile.TableRow();
                                        var lineContent2 = new Array(txtGroup, ocurrentobjdef.Group().Name(nloc),"","","");
                                        var colWidth = 100.0 / lineContent2.length;
                                        for(var k = 0; k<lineContent2.length; k++) {
                                            outfile.TableCell(lineContent2[k], colWidth, getString("TEXT20"), 12, nFontColor, nColor, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                                        }
                                    }
                                    
                                    // Attributes
                                    if (bObjAttr) {
                                        var bAttrColored = true;   // variable to change background color of table rows (attributes)
                                        
                                        var oattributes = ocurrentobjdef.AttrList(nloc);
                                        for (var k = 0; k < oattributes.length; k++) {
                                            var ocurrentattribute = oattributes[k];
                                            if(!(ocurrentattribute.TypeNum() == Constants.AT_NAME || ocurrentattribute.TypeNum() == Constants.AT_TYPE_1 || ocurrentattribute.TypeNum() == Constants.AT_TYPE_6 || inCaseRange(ocurrentattribute.TypeNum(), Constants.AT_TYP1, Constants.AT_TYP7))) {
                                                outfile.TableRow();
                                                var lineContent2 = new Array(ocurrentattribute.Type(), ocurrentattribute.GetValue(true),"","","");
                                                var colWidth = 100.0 / lineContent2.length;
                                                for(var l = 0; l<lineContent2.length; l++) {
                                                    outfile.TableCell(lineContent2[l], colWidth, getString("TEXT20"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                                                }
                                            }
                                            bAttrColored = !bAttrColored; // Change background color (attributes)
                                        }
                                    }
                                    if (!bTrgObjAttr) {
                                        bColored = !bColored; // Change background color 
                                    }                                
                                }
                                
                                // if there is a connection between OrgElement and other object
                                var lineContent;
                                var bPrintOnNewRow = true;
                                if (bFirst && !(bObjGroups || bObjAttr)) {  
                                    // no object attributes or group and first relation -> same line as object name/type
                                    lineContent = new Array(soutcxnname.value, soutcxntargetobj.value, soutcxntargetobjtype.value);
                                    bPrintOnNewRow = false;
                                } else {
                                    lineContent = new Array("","",soutcxnname.value, soutcxntargetobj.value, soutcxntargetobjtype.value);
                                }
                                
                                if(bPrintOnNewRow) { 
                                    outfile.TableRow();
                                }
                                for(var k = 0; k<lineContent.length; k++) {
                                    outfile.TableCell(lineContent[k], 20, getString("TEXT20"), 12, getTableCellColor_Font(bColored), getTableCellColor_Bk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_BOLD, 0);
                                }
                                
                                // Group of the target object.
                                if (bTrgObjGroups) {
                                    // Table containing attributes.
                                    outfile.TableRow();
                                    var lineContent2 = new Array("","","",txtGroup, otargetobjdef.value.Group().Name(nloc));
                                    var colWidth = 100.0 / lineContent2.length;
                                    for(var k = 0; k<lineContent2.length; k++) {
                                        outfile.TableCell(lineContent2[k], colWidth, getString("TEXT20"), 12, getTableCellColor_Font(bColored), getTableCellColor_Bk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                                    }
                                }
                                
                                // Attributes of the target object.
                                if (bTrgObjAttr) {
                                    var bAttrColored = true;   // variable to change background color of table rows (attributes)                                                
                                    
                                    // Table containing attributes.
                                    var oattributes = otargetobjdef.value.AttrList(nloc);
                                    for (var k = 0; k < oattributes.length; k++) {
                                        var ocurrentattribute = oattributes[k];
                                        if(!(ocurrentattribute.TypeNum() == Constants.AT_NAME || ocurrentattribute.TypeNum() == Constants.AT_TYPE_1 || ocurrentattribute.TypeNum() == Constants.AT_TYPE_6 || inCaseRange(ocurrentattribute.TypeNum(), Constants.AT_TYP1, Constants.AT_TYP7))) {
                                            outfile.TableRow();
                                            var lineContent2 = new Array("","","",ocurrentattribute.Type(), ocurrentattribute.GetValue(true));
                                            var colWidth = 100.0 / lineContent2.length;
                                            for(var l = 0; l<lineContent2.length; l++) {
                                                outfile.TableCell(lineContent2[l], colWidth, getString("TEXT20"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                                            }
                                            bAttrColored = !bAttrColored; // Change background color (attributes)
                                        }
                                    }
                                }
                                
                                if(bFirst) {
                                    bFirst = false; 
                                }
                                
                                if (!bTrgObjAttr) {
                                    bColored = !bColored; // Change background color 
                                }              
                            }
                        }
                    }
                    
                    if (!bHasRelations) {
                        // No (right) relation types were found
                        outfile.TableCell(txtNoTypes, 60, getString("TEXT20"), 12, nFontColor, nColor, 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_BOLD, 0);
                        
                        // Group 
                        if (bObjGroups) {
                            outfile.TableRow();
                            var lineContent2 = new Array(txtGroup, ocurrentobjdef.Group().Name(nloc),"","","");
                            var colWidth = 100.0 / lineContent2.length;
                            for(var k = 0; k<lineContent2.length; k++) {
                                outfile.TableCell(lineContent2[k], colWidth, getString("TEXT20"), 12, nFontColor, nColor, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                            }
                        }
                        
                        // Attributes
                        if (bObjAttr) {
                            var bAttrColored = true;   // variable to change background color of table rows (attributes)
                            
                            var oattributes = ocurrentobjdef.AttrList(nloc);
                            for (var j = 0; j < oattributes.length; j++) {
                                var ocurrentattribute = oattributes[j];
                                if(!(ocurrentattribute.TypeNum() == Constants.AT_NAME || ocurrentattribute.TypeNum() == Constants.AT_TYPE_1 || ocurrentattribute.TypeNum() == Constants.AT_TYPE_6 || inCaseRange(ocurrentattribute.TypeNum(), Constants.AT_TYP1, Constants.AT_TYP7))) {
                                    outfile.TableRow();
                                    var lineContent2 = new Array(ocurrentattribute.Type(), ocurrentattribute.GetValue(true),"","","");
                                    var colWidth = 100.0 / lineContent2.length;
                                    for(var k = 0; k<lineContent2.length; k++) {
                                        outfile.TableCell(lineContent2[k], colWidth, getString("TEXT20"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                                    }
                                    bAttrColored = !bAttrColored; // Change background color (attributes)
                                }
                            }
                        }
                        if (!(bObjAttr || bTrgObjAttr)) {
                            bColored = !bColored; // Change background color 
                        }          
                    }
                } else if(nOptOutputFormat==1) {
                    // ------------------------------  Text ---------------------------------------------------------------
                    outfile.OutputLn(ocurrentobjdef.Name(nloc) + ": " + ocurrentobjdef.Type(), getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
                    
                    if (bObjGroups) {
                        outfile.OutputLn(txtGroup + ": " + ocurrentobjdef.Group().Name(nloc), getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 15);
                    }
                    
                    if (bObjAttr) {
                        // Table containing attributes.
                        var oattributes = ocurrentobjdef.AttrList(nloc);
                        if(oattributes.length>0) {
                            outfile.OutputLn(getString("TEXT22"), getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 15);
                            for (var j = 0; j < oattributes.length; j++) {
                                var ocurrentattribute = oattributes[j];
                                if(!(ocurrentattribute.TypeNum() == Constants.AT_NAME || ocurrentattribute.TypeNum() == Constants.AT_TYPE_1 || ocurrentattribute.TypeNum() == Constants.AT_TYPE_6 || inCaseRange(ocurrentattribute.TypeNum(), Constants.AT_TYP1, Constants.AT_TYP7))) {
                                    outfile.OutputLn(ocurrentattribute.Type() + ": " + ocurrentattribute.GetValue(true), getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 15);
                                }
                            }
                        }
                    }
                    
                    var ocxns = ocurrentobjdef.CxnList();
                    ocxns = ArisData.sort(ocxns, Constants.SORT_TYPE, Constants.SORT_NONE, Constants.SORT_NONE, nloc);
                    
                    if (ocxns.length > 0) {
                        for (var j = 0; j < ocxns.length; j++) {
                            var ocurrentcxn = ocxns[j];
                            
                            soutcxnname.value             = "";
                            soutcxntargetobj.value        = "";
                            soutcxntargetobjtype.value    = "";
                            otargetobjdef.value           = null;
                            btruecxntype                 =  false;
                            
                            // Check of the current relation according to selected relation setting
                            if(nOptRelations==0) {
                                btruecxntype = getcxn2func(nloc, ocurrentobjdef, ocurrentcxn, soutcxnname, soutcxntargetobj, soutcxntargetobjtype, otargetobjdef);
                            } else if(nOptRelations==1 && (ocurrentcxn.TypeNum()== 65 || ocurrentcxn.TypeNum()== 218)) {
                                btruecxntype = getcxn2func(nloc, ocurrentobjdef, ocurrentcxn, soutcxnname, soutcxntargetobj, soutcxntargetobjtype, otargetobjdef);
                            } else if(nOptRelations==2) {
                                btruecxntype = getcxn2org(nloc, ocurrentobjdef, ocurrentcxn, soutcxnname, soutcxntargetobj, soutcxntargetobjtype, otargetobjdef);
                            }
                            
                            if (btruecxntype == true) {
                                bFirst = false;
                                
                                outfile.OutputLn(soutcxnname.value, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 15);
                                outfile.OutputLn(soutcxntargetobj.value + ": " + soutcxntargetobjtype.value, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 30);
                                
                                if(bTrgObjGroups) {
                                    outfile.OutputLn(txtGroup + ": " + otargetobjdef.value.Group().Name(nloc), getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 45);
                                }
                                if (bTrgObjAttr) {
                                    // Table containing attributes.
                                    var oattributes = otargetobjdef.value.AttrList(nloc);
                                    if(oattributes.length>0) {
                                        outfile.OutputLn(getString("TEXT22"), getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 45);
                                        
										for (var k = 0; k < oattributes.length; k++) {
                                            var ocurrentattribute = oattributes[k];
                                            if(!(ocurrentattribute.TypeNum() == Constants.AT_NAME || ocurrentattribute.TypeNum() == Constants.AT_TYPE_1 || ocurrentattribute.TypeNum() == Constants.AT_TYPE_6 || inCaseRange(ocurrentattribute.TypeNum(), Constants.AT_TYP1, Constants.AT_TYP7))) {
                                                outfile.OutputLn(ocurrentattribute.Type() + ": " + ocurrentattribute.GetValue(true), getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 45);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    if (bFirst == true) {
                        // No (right) connection types were found
                        outfile.OutputLn(txtNoTypes, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 30);
                    }                    
                    outfile.OutputLn("", getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
                    outfile.OutputLn("", getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
                }
            }
        }
    }
    
    if ((nvalidobjdefs == 0)) {
        // No object of the function type was selected.
        Dialogs.MsgBox(txtNoOrgObject, Constants.MSGBOX_BTN_OK, getString("TEXT23"));
        Context.setScriptError(Constants.ERR_NOFILECREATED);
    } else {
        if (nOptOutputFormat == 0) {
            outfile.EndTable("", 100, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        }
        
        if (! (nvalidobjdefs == ArisData.getSelectedObjDefs().length)) {
            ncheckmsg = Dialogs.MsgBox(txtAtLeastOneNotOrgElement, Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT23"));
        }
        
        if (! (ncheckmsg == (2))) {
            outfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
        } else {
            Context.setScriptError(Constants.ERR_CANCEL);
        }
    }
}

function getcxn2func(nloc, ocurrentobjdef, ocurrentcxn, soutcxnname, soutcxntargetobj, soutcxntargetobjtype, ootherobjdef)
{
    // Get string for  connection name output and string for target object output
    // Check if current connection is connection from/to function
    
    var osourceobjdef = ocurrentcxn.SourceObjDef();
    var otargetobjdef = ocurrentcxn.TargetObjDef();
    var typeNum;
    
    if ((ocurrentobjdef.IsEqual(osourceobjdef))) {
        // if object definiton is source of connection
        soutcxnname.value           = ocurrentcxn.ActiveType();
        soutcxntargetobj.value      = otargetobjdef.Name(nloc);
        soutcxntargetobjtype.value  = otargetobjdef.Type();
        ootherobjdef.value          = otargetobjdef;
        typeNum = otargetobjdef.TypeNum();
    } else {
        // if object definiton is target of connection
        soutcxnname.value           = ocurrentcxn.PassiveType();
        soutcxntargetobj.value      = osourceobjdef.Name(nloc);
        soutcxntargetobjtype.value  = osourceobjdef.Type();
        ootherobjdef.value          = osourceobjdef;
        typeNum = osourceobjdef.TypeNum();
    }
    
    if (typeNum == Constants.OT_FUNC) {
        return true;
    }
    return false;
}

function getcxn2org(nloc, ocurrentobjdef, ocurrentcxn, soutcxnname, soutcxntargetobj, soutcxntargetobjtype, ootherobjdef)
{
    // Get string for  connection name output and string for target object output
    // Check if current connection is connection from/to org elements

    var osourceobjdef = ocurrentcxn.SourceObjDef();
    var otargetobjdef = ocurrentcxn.TargetObjDef();
    
    if ((ocurrentobjdef.IsEqual(osourceobjdef))) {
        // if object definiton is source of connection
        soutcxnname.value           = ocurrentcxn.ActiveType();
        soutcxntargetobj.value      = otargetobjdef.Name(nloc);
        soutcxntargetobjtype.value  = otargetobjdef.Type();
        ootherobjdef.value          = otargetobjdef;
    } else {
        // if object definiton is target of connection
        soutcxnname.value           = ocurrentcxn.PassiveType();
        soutcxntargetobj.value      = osourceobjdef.Name(nloc);
        soutcxntargetobjtype.value  = osourceobjdef.Type();
        ootherobjdef.value          = osourceobjdef;
    }
    
    switch (ocurrentcxn.TypeNum()) {
        case 3:
        case 4:
        case 6:
        case 7:
        case 8:
        case 9:
        case 12:
        case 17:
        case 42:
        case 51:
        case 61:
        case 84:
        case 87:
        case 101:
        case 150:
        case 169:
        case 178:
        case 195:
        case 196: 
        case 197: 
        case 209:
        case 210:
        case 211:
        case 292:
        case 293:
        case 296:
        case 318:
        case 328:
        case 395:
        case 415:
        case 479:
        case 480:
        case 481:
        case 579:
        case 667:
        case 668:
        case 669:
        case 673:
        case 750:
			return true;
    }
    return false;
}

/**
*  function showOutputOptionsDialog
*  shows output options dialog with specified initial settings
*  @param bDisableOutputOptions flag for disabling output format settings
*  @param holder_nOptOutputFormat receives output format setting
*  @param holder_nOptRelations receives relations setting
*  @param holder_bObjectGroups receives object groups setting
*  @param holder_bTargetObjectGroups receives target object groups setting
*  @param holder_bObjectAttr receives object attributes setting
*  @param holder_bTargetObjectAttr receives target object attribute setting
*  @return dialog return value
*/
function showOutputOptionsDialog(bDisableOutputOptions, holder_nOptOutputFormat, holder_nOptRelations, 
holder_bObjectGroups, holder_bTargetObjectGroups, 
holder_bObjectAttr, holder_bTargetObjectAttr)
{
    // Output format
    var userdialog = Dialogs.createNewDialogTemplate(0, 0, 435, 180, txtOutputOptionsDialogTitle);
    
    userdialog.GroupBox(7, 0, 430, 55, txtOutputFormat);
    userdialog.OptionGroup(dicOutputFormat);
    userdialog.OptionButton(20, 15, 400, 15, txtOFTable);
    userdialog.OptionButton(20, 30, 400, 15, txtOFText);
    
    userdialog.GroupBox(7, 60, 430, 70, txtRelations);
    userdialog.OptionGroup(dicRelations);
    userdialog.OptionButton(20, 75, 400, 15, txtRelAllFunc);
    userdialog.OptionButton(20, 90, 400, 15, txtRelExecutes);
    userdialog.OptionButton(20, 105, 400, 15, txtRelAllOrg);
    
    userdialog.CheckBox(7, 135, 400, 15, txtObjectGroups, dicObjectGroups);
    userdialog.CheckBox(7, 150, 400, 15, txtTargetObjectGroups, dicTargetObjectGroups);
    userdialog.CheckBox(7, 165, 400, 15, txtObjectAttr, dicObjectAttr);
    userdialog.CheckBox(7, 180, 400, 15, txtTargetObjectAttr, dicTargetObjectAttr);
    
    userdialog.OKButton();
    userdialog.CancelButton();
    //  userdialog.HelpButton("HID_5694c3b0_eae5_11d8_12e0_9d2843560f51_dlg_01.hlp");
    
    dlgFuncOutput = Dialogs.createUserDialog(userdialog); 
    
    // Read dialog settings from config  
    var sSection = "SCRIPT_5694c3b0_eae5_11d8_12e0_9d2843560f51";
    ReadSettingsDlgValue(dlgFuncOutput, sSection, dicRelations, holder_nOptRelations.value);  
    
    var vals = new Array( (holder_bObjectGroups.value?1:0), (holder_bTargetObjectGroups.value?1:0), (holder_bObjectAttr.value?1:0), (holder_bTargetObjectAttr.value?1:0) );
    var dics = new Array(dicObjectGroups, dicTargetObjectGroups, dicObjectAttr, dicTargetObjectAttr);
    
    for(var i = 0; i < dics.length; i++) {
        ReadSettingsDlgValue(dlgFuncOutput, sSection, dics[i], vals[i]);  
    }
    dlgFuncOutput.setDlgValue(dicOutputFormat, holder_nOptOutputFormat.value);
    dlgFuncOutput.setDlgEnable(dicOutputFormat, !bDisableOutputOptions);
    
    nuserdialog = Dialogs.show( __currentDialog = dlgFuncOutput);
    
    // Displays dialog and waits for the confirmation with OK.
    if (nuserdialog != 0) {
        holder_nOptOutputFormat.value = dlgFuncOutput.getDlgValue(dicOutputFormat);
        holder_nOptRelations.value    = dlgFuncOutput.getDlgValue(dicRelations);
        var holders = new Array(holder_bObjectGroups, holder_bTargetObjectGroups, holder_bObjectAttr, holder_bTargetObjectAttr);
        for(var i=0;i<dics.length;i++) {
            holders[i].value = dlgFuncOutput.getDlgValue(dics[i])!=0;  
        }
        
        // Write dialog settings to config 
        WriteSettingsDlgValue(dlgFuncOutput, sSection, dicRelations);
        WriteSettingsDlgValue(dlgFuncOutput, sSection, dicOutputFormat);    
        for(var i=0;i<dics.length;i++) {
            WriteSettingsDlgValue(dlgFuncOutput, sSection, dics[i]);  
        }
    }
    return nuserdialog;  
}

function inCaseRange(val, lower, upper)
{
  return (val >=lower) && (val <= upper);
}


main();