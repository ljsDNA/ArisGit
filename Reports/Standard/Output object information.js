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

 // Report Configuration
const SHOW_DIALOGS_IN_CONNECT = false;   // Show dialogs in ARIS Connect - Default=false (BLUE-12274)

/****************************************************/

// BLUE-17650 - Import/Usage of 'convertertools.js' removed 

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

var crow_max = 60000; 

// text constants
// dialog text constants
var txtOutputOptionsDialogTitle = getString("TEXT1");
var txtAttributes               = getString("TEXT2");
var txtObjectAttributes         = getString("TEXT3");
var txtTargetAttributes         = getString("TEXT4");
var txtGroups                   = getString("TEXT5");
var txtObjectGroups             = getString("TEXT6");
var txtTargetGroups             = getString("TEXT7");

// messagebox text constants
var txtNoObjectsSelected        = getString("TEXT8");

// output text constants
var txtGroup                    = getString("TEXT9");
var txtObjectName               = getString("TEXT10");
var txtObjectType               = getString("TEXT11");
var txtConnectionType           = getString("TEXT12");
var txtNoConnections            = getString("TEXT13");



// Global variables.
var g_nloc = 0; // Variable for determining the ID of the current language.
var g_oFilter = ArisData.ActiveFilter();

// Dialog support depends on script runtime environment (STD resp. BP, TC)
var g_bDialogsSupported = isDialogSupported();

function main()
{
  // In VB implizit deklarierte lokale Variablen
  var k = undefined;
  var j = undefined;
  var ialauf = undefined;
  var nloc = undefined;
  var iblauf = undefined;
  var f = undefined;
  //////


  var ocurrentobjdef = null;   // Current object
  var oconobjdef = null;   // Object that is linked to the current object via the current connection.
  var oobjdefs = null;   // List of object definitions.
  var ooutfile = null;   // Object used for the output of the report.
  var oattributes = null;   // List of attributes.
  var ocurrentattribute = null;   // Current attribute.
  var ocurrentuser = null;   // Current user.
  var ocxns = null;   // List of connection definitions.
  var ocurrentcxn = null;   // Current connection definition.
  var nuserdialog = 0;   // Variable for checking whether the user has selected Cancel in the dialog boxes.

  var bcheckfirst = false;   // Variable for creating the table header.
  var bfirstout = false; 
  var bcheckselection = false;   // Variable for displaying the dialog only once.

  var scxntype = "";   // String containing the connection name.

  var nrowcount = 0; 

  var bObjectAttr = true;
  var bTargetObjectAttr = false;
  var bObjectGroups = true;
  var bTargetObjectGroups = false;

  g_nloc = Context.getSelectedLanguage();
  bcheckfirst = true;
  bfirstout = false;

  oobjdefs = getObjectSelection();  // BLUE-10824 Context extended to objDef + group
  if (oobjdefs.length > 0) {

    var holder_bObjectAttr          = new __holder(false);
    var holder_bTargetObjectAttr    = new __holder(false);
    var holder_bObjectGroups        = new __holder(false);
    var holder_bTargetObjectGroups  = new __holder(false);

    if (g_bDialogsSupported) {
        var nuserdialog = showOutputOptionsDialog(holder_bObjectAttr, holder_bTargetObjectAttr, holder_bObjectGroups, holder_bTargetObjectGroups);
        // Displays dialog and waits for the confirmation with OK.
        if (nuserdialog == 0) {
          Context.setScriptError(Constants.ERR_CANCEL);  
          return;
        }
        bObjectAttr         = holder_bObjectAttr.value;
        bTargetObjectAttr   = holder_bTargetObjectAttr.value;
        bObjectGroups       = holder_bObjectGroups.value;
        bTargetObjectGroups = holder_bTargetObjectGroups.value;
    }

    ooutfile = Context.createOutputObject();
    ooutfile.DefineF("REPORT1", getString("TEXT14"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
    ooutfile.DefineF("REPORT2", getString("TEXT14"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    ooutfile.DefineF("REPORT3", getString("TEXT14"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

    setReportHeaderFooter(ooutfile, g_nloc, true, true, true);

    ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    
    // Object list is sorted.
    oobjdefs = ArisData.sort(oobjdefs, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);
    for ( k = 0; k < oobjdefs.length; k++) {
      ocurrentobjdef = oobjdefs[k];
      ialauf = 0;
      iblauf = 0;

      if (bcheckfirst == true) {
        nrowcount++;

        var colHeadings = new Array(txtObjectName, txtObjectType, txtConnectionType, txtObjectName, txtObjectType);
        writeTableHeaderWithColor(ooutfile, colHeadings, 10, getTableCellColor_Head(), Constants.C_WHITE);
        bcheckfirst = false;
      }

      nrowcount++;

      // Object headline.
      var txt = new Array(ocurrentobjdef.Name(g_nloc), ocurrentobjdef.Type(), "", "", "");
      ooutfile.TableRow();
      for(var l = 0; l<txt.length; l++) {
        ooutfile.TableCell(txt[l], 20, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Head(), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
      }

      // Group  of source object.
      if (bObjectGroups) {
        nrowcount++;
        txt = new Array(txtGroup, ocurrentobjdef.Group().Name(g_nloc), "", "", "");
        ooutfile.TableRow();
        for(var l = 0; l<txt.length; l++) {
          ooutfile.TableCell(txt[l], 20, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Head(), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
        }
      }

      // Attributes source object was selected.
      if (bObjectAttr) {
        // Attributes of the object.
        oattributes = ArisData.sort(ocurrentobjdef.AttrList(g_nloc), Constants.SORT_METHOD, g_nloc);
        if (oattributes.length > 0) {
          var bAttrColored = true;   // variable to change background color of table rows (attributes)                            
          
          for ( j = 0; j < oattributes.length; j++) {
            ocurrentattribute = oattributes[j];
            if(ocurrentattribute.TypeNum() == Constants.AT_NAME || ocurrentattribute.TypeNum() == Constants.AT_TYPE_1 || ocurrentattribute.TypeNum() == Constants.AT_TYPE_6 || inCaseRange(ocurrentattribute.TypeNum(), Constants.AT_TYP1, Constants.AT_TYP7)) {
            }
            else {
              nrowcount++;
              ooutfile.TableRow();
              ooutfile.TableCell(ocurrentattribute.Type(), 20, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
              writeCellWithFormattedAttribute(ooutfile, ocurrentattribute, 20, bAttrColored);
              ooutfile.TableCell("", 20, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
              ooutfile.TableCell("", 20, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
              ooutfile.TableCell("", 20, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
              bAttrColored = !bAttrColored; // Change background color (attributes)
            }
          }
        }
      }

      ocxns = ocurrentobjdef.CxnList();
      ocxns.sort(sortByTypeNum);             // Anubis      365802
      bfirstout = false;
      
      if (ocxns.length > 0) {
        var bColored = bTargetObjectAttr;   // variable to change background color of table rows          
        
        for ( f = 0; f < ocxns.length; f++) {
          ocurrentcxn = ocxns[f];

          // If oCurrentCxn.SourceObjDef().Name(g_nLoc) = oCurrentObjDef.Name(g_nLoc) Then
          if (ocurrentcxn.SourceObjDef().IsEqual(ocurrentobjdef)) {
          // Compare objects, not object names
            oconobjdef = ocurrentcxn.TargetObjDef();
            scxntype = ocurrentcxn.ActiveType();
          }
          else {
            oconobjdef = ocurrentcxn.SourceObjDef();
            scxntype = ocurrentcxn.PassiveType();
          }


          nrowcount++;
          var txt = new Array("", "", scxntype, oconobjdef.Name(g_nloc), oconobjdef.Type());
          ooutfile.TableRow();
          for(var l = 0; l<txt.length; l++) {
            ooutfile.TableCell(txt[l], 20, getString("TEXT14"), 10, getTableCellColor_Font(bColored), getTableCellColor_Bk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
          }

          // Group target object.
          if (bTargetObjectGroups) {
            nrowcount++;
            var txt = new Array("", "", "", txtGroup, oconobjdef.Group().Name(g_nloc));
            ooutfile.TableRow();
            for(var l = 0; l<txt.length; l++) {
              ooutfile.TableCell(txt[l], 20, getString("TEXT14"), 10, getTableCellColor_Font(bColored), getTableCellColor_Bk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
            }
          }

          if (bTargetObjectAttr) {
          // Attribute target object was selected.
            // Attributes of the object.
            oattributes = ArisData.sort(oconobjdef.AttrList(g_nloc), Constants.SORT_METHOD, g_nloc);
            if (oattributes.length > 0) {
              var bAttrColored = true;   // variable to change background color of table rows (attributes)                            
                
              for ( j = 0; j < oattributes.length; j++) {
                ocurrentattribute = oattributes[j];
                if(!(ocurrentattribute.TypeNum() == Constants.AT_NAME || ocurrentattribute.TypeNum() == Constants.AT_TYPE_1 || ocurrentattribute.TypeNum() == Constants.AT_TYPE_6 || inCaseRange(ocurrentattribute.TypeNum(), Constants.AT_TYP1, Constants.AT_TYP7))) {
                  nrowcount++;
                  ooutfile.TableRow();
                  ooutfile.TableCell("", 20, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                  ooutfile.TableCell("", 20, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                  ooutfile.TableCell("", 20, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                  ooutfile.TableCell(ocurrentattribute.Type(), 20, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                  writeCellWithFormattedAttribute(ooutfile, ocurrentattribute, 20, bAttrColored);
                  bAttrColored = !bAttrColored; // Change background color (attributes)
                }
              }
            }
          }
          if (!bTargetObjectAttr) {
              bColored = !bColored; // Change background color 
          }
        }
      }
      else {
        nrowcount++;
        var txt = new Array("", "", txtNoConnections, "", "");
        ooutfile.TableRow();
        for(var l = 0; l<txt.length; l++) {
          ooutfile.TableCell(txt[l], 20, getString("TEXT14"), 10, getTableCellColor_Font(false), getTableCellColor_Bk(false), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
        }
      }

      if (nrowcount >= crow_max) {
        // Out new table
        ooutfile.EndTable("", 100, getString("TEXT14"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);

        bcheckfirst = true;
        nrowcount = 0;
      }
    }

    ooutfile.EndTable("", 100, getString("TEXT14"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
  }

  else {
      if(g_bDialogsSupported) {
          Dialogs.MsgBox(txtNoObjectsSelected, Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT15"));
          Context.setScriptError(Constants.ERR_NOFILECREATED);  
      } else {
          outEmptyResult();     // BLUE-10824 Output empty result in Connect
      }
  }
}

function writeCellWithFormattedAttribute(p_oOutput, p_oAttr, p_nCellWidth, p_bAttrColored) {
    switch (g_oFilter.AttrBaseType(p_oAttr.TypeNum())) {
        case Constants.ABT_MULTILINE:
        case Constants.ABT_SINGLELINE:
            var styledValue = p_oAttr.getStyledValue();
            if (!styledValue.containsOnlyPlainText()) {
                styledValue = styledValue.getMergedFormatting(ArisData.getActiveDatabase().defaultFontStyle().Font(g_nloc));
                p_oOutput.TableCell("", p_nCellWidth, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(p_bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                p_oOutput.OutputFormattedText(styledValue.getHTML());
                break;
            }
        default:
            p_oOutput.TableCell(p_oAttr.GetValue(true), p_nCellWidth, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(p_bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
    }
}

var dicObjAttr                  =  "chkObjAttr";
var dicObjGroups                =  "chkObjGroups";
var dicTargetAttr               =  "chkTrgObjAttr";
var dicTargetGroups             =  "chkTrgObjGroups";

function showOutputOptionsDialog(holder_bObjectAttr, holder_bTargetObjectAttr, holder_bObjectGroups, holder_bTargetObjectGroups)
{
  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 380, 120, txtOutputOptionsDialogTitle);
  userdialog.GroupBox(10, 0, 400, 52, txtAttributes);
  userdialog.CheckBox(20, 15, 360, 15, txtObjectAttributes, dicObjAttr); 
  userdialog.CheckBox(20, 30, 360, 15, txtTargetAttributes, dicTargetAttr);

  userdialog.GroupBox(10, 65, 400, 52, txtGroups);
  userdialog.CheckBox(20, 80, 360, 15, txtObjectGroups , dicObjGroups);
  userdialog.CheckBox(20, 95, 360, 15, txtTargetGroups, dicTargetGroups);

  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_6fd4ae20_eae1_11d8_12e0_9d2843560f51_dlg_01.hlp");  

  var nValChkObjAttr        = holder_bObjectAttr.value ? 1 : 0;
  var nValChkTrgObjAttr     = holder_bTargetObjectAttr.value ? 1 : 0;
  var nValChkObjGroups      = holder_bObjectGroups.value ? 1 : 0;
  var nValChkTrgObjGroups   = holder_bTargetObjectGroups.value ? 1 : 0;

  var dlg = Dialogs.createUserDialog(userdialog); 
  
  // Read dialog settings from config    
  var sSection = "SCRIPT_6fd4ae20_eae1_11d8_12e0_9d2843560f51";
  ReadSettingsDlgValue(dlg, sSection, dicObjAttr, nValChkObjAttr);
  ReadSettingsDlgValue(dlg, sSection, dicTargetAttr, nValChkTrgObjAttr);
  ReadSettingsDlgValue(dlg, sSection, dicObjGroups, nValChkObjGroups);
  ReadSettingsDlgValue(dlg, sSection, dicTargetGroups, nValChkTrgObjGroups);

  nuserdialog = Dialogs.show( __currentDialog = dlg);

  if(nuserdialog!=0) {
    holder_bObjectAttr.value         = dlg.getDlgValue(dicObjAttr)!= 0;
    holder_bTargetObjectAttr.value   = dlg.getDlgValue(dicTargetAttr) != 0;
    holder_bObjectGroups.value       = dlg.getDlgValue(dicObjGroups) != 0;
    holder_bTargetObjectGroups.value = dlg.getDlgValue(dicTargetGroups) != 0;
    
    // Write dialog settings to config    
    WriteSettingsDlgValue(dlg, sSection, dicObjAttr);
    WriteSettingsDlgValue(dlg, sSection, dicTargetAttr);
    WriteSettingsDlgValue(dlg, sSection, dicObjGroups);
    WriteSettingsDlgValue(dlg, sSection, dicTargetGroups);
  }

  return nuserdialog;
}

function sortByTypeNum(a, b) {
    return a.TypeNum() - b.TypeNum();
}

function getObjectSelection() {
    // ObjDef selected
    var oSelObjDefs = ArisData.getSelectedObjDefs()
    if (oSelObjDefs.length > 0) return oSelObjDefs;

    // Groups selected    
    var aObjectTypes = Context.getDefinedItemTypes(Constants.CID_OBJDEF);
    oSelObjDefs = new Array();
    var oSelGroups = ArisData.getSelectedGroups();
    for (var i = 0; i < oSelGroups.length; i++) {
        oSelObjDefs = oSelObjDefs.concat(filterObjDefs(oSelGroups[i], aObjectTypes));
    }
    return oSelObjDefs;
    
    function filterObjDefs(oGroup, aTypeNums) {
        if (aTypeNums.length == 0 || (aTypeNums.length == 1 && aTypeNums[0] == -1)) {
            // All/None type nums selected
            return oGroup.ObjDefList();
        }
        return oGroup.ObjDefList(false/* bRecursive*/, aTypeNums);
    }
}

function outEmptyResult() {    
    var ooutfile = Context.createOutputObject();
    ooutfile.DefineF("REPORT1", getString("TEXT14"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
    ooutfile.DefineF("REPORT2", getString("TEXT14"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    ooutfile.DefineF("REPORT3", getString("TEXT14"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    
    if ( Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX ) {
        ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        ooutfile.TableRow();
        ooutfile.TableCell(txtNoObjectsSelected, 100, getString("TEXT14"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
        ooutfile.EndTable("", 100, getString("TEXT14"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    } else {
        setReportHeaderFooter(ooutfile, g_nloc, true, true, true);
        ooutfile.OutputLn(txtNoObjectsSelected, getString("TEXT14"), 10, Constants.C_RED, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    }
    ooutfile.WriteReport();
}

function isDialogSupported() {
    // Dialog support depends on script runtime environment (STD resp. BP, TC)
    var env = Context.getEnvironment();
    if (env.equals(Constants.ENVIRONMENT_STD)) return true;
    if (env.equals(Constants.ENVIRONMENT_TC)) return SHOW_DIALOGS_IN_CONNECT;
    return false;
}

function inCaseRange(val, lower, upper) {
    return (val >= lower) && (val <= upper);
}


main();




