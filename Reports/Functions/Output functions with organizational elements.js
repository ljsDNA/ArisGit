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
var txtOutputFormat     = getString("TEXT2");
var txtOFTable          = getString("TEXT3");
var txtOFText           = getString("TEXT4");
var txtRelations        = getString("TEXT5");
var txtRelAll           = getString("TEXT6");
var txtRelExecutes      = getString("TEXT7");

// output text constants
var txtFunction         = getString("TEXT8");
var txtRelationType     = getString("TEXT9");
var txtObjectName       = getString("TEXT10");
var txtObjectType       = getString("TEXT11");

// messagebox text constants
var txtNoFunctionObject       = getString("TEXT12");
var txtNoTypes                = getString("TEXT13");
var txtAtLeastOneNotFunction  = getString("TEXT14");

// dialog item constants
var dicOutputFormat     = "optOutputFormat";
var dicRelations        = "optRelations";


function main()
{
  var bnoobj = false;   // Variable for checking whether any objects were selected.
  var bokobj = false;   // Variable for checking whether objects of the function type were selected.
  var bcheckfirst = false;   // Variable for creating the table head.
  var bfirst = false;   // Variable for creating an empty row if the current object has more than one relationship type.
  var bnotrightcxn = false;   // Variable that remembers if the relationship type is incorrect.
  var brightcxn = false;   // Variable that registers if the relationship type is of the correct type.
  var bcheckselection = false;   // Variable for displaying the dialog only once.

  var ncheckmsg = 0;   // Variable containing the answer to the message (2 = Abort was selected).
  var nuserdialog = 0;   // Variable for checking whether the user has selected Cancel in the dialog boxes.

  var ncolour2 = 0; 

  var soutcxnname       = new __holder("");   // String for connection name output.
  var soutcxnsourceobj  = new __holder("");   // String for source object output.
  var soutcxnsourcetype = new __holder("");   // String for source object type output.


  var outfile = Context.createOutputObject();
  var nloc = Context.getSelectedLanguage();

  var bDisableOutputOptions;
  var nDefaultOptOutputFormat;

  if(Context.getSelectedFormat() == Constants.OUTTEXT) {
    bDisableOutputOptions = true;
    nDefaultOptOutputFormat = 1;
  } else if(Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) {
    bDisableOutputOptions = true;
    nDefaultOptOutputFormat = 0;
  } else {
    bDisableOutputOptions = false;
    var sSection = "SCRIPT_ed90c300_eae4_11d8_12e0_9d2843560f51";
    nDefaultOptOutputFormat = Context.getProfileInt(sSection, dicOutputFormat, 0);
  }


  var nrow = 0;
  var bColored = false;   // variable to change background color of table rows          

  outfile.DefineF("REPORT1", getString("TEXT15"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
  outfile.DefineF("REPORT2", getString("TEXT15"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  outfile.DefineF("REPORT3", getString("TEXT15"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

  // Create page header, page footer, headline and information header
  setReportHeaderFooter(outfile, nloc, true, true, true);

  var oobjdefs = ArisData.getSelectedObjDefs();
  if (oobjdefs.length > 0) {
    oobjdefs = ArisData.sort(oobjdefs, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, nloc);

    var holder_nOptOutputFormat   = new __holder(nDefaultOptOutputFormat);
    var holder_nOptRelations      = new __holder(0);

    nuserdialog = showOutputOptionsDialog(bDisableOutputOptions, holder_nOptOutputFormat, holder_nOptRelations);
    var nOptOutputFormat = holder_nOptOutputFormat.value;
    var nOptRelations    = holder_nOptRelations.value;

    if (nuserdialog == 0) {
      Context.setScriptError(Constants.ERR_CANCEL);
      return;
    }

    for (var i = 0; i < oobjdefs.length; i++) {
      // First connection (Variable used in case of tables and text)
      var bfirst = true;
      var ocurrentobjdef = oobjdefs[i];

      if (ocurrentobjdef.TypeNum() == Constants.OT_FUNC) {
        brightcxn   = false;
        bokobj      = true;

        // ------------------------------  Table ---------------------------------------------------------------

        if (nOptOutputFormat == 0) {
        // Modified for WebDesigner
        // Output text.
          // If Dlg.options = 0  Then 'Table

          if (bcheckfirst == false) {
            outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);

            var colHeadings = new Array(txtFunction, txtRelationType, txtObjectName, txtObjectType);
            writeTableHeaderWithColor(outfile, colHeadings, 12, getTableCellColor_Bk(true), Constants.C_WHITE);
            bcheckfirst = true;
          }

          outfile.TableRow();
          nrow++;

          outfile.TableCell(ocurrentobjdef.Name(nloc), 25, getString("TEXT15"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_BOLD |Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

          var ocxns = ocurrentobjdef.CxnList();
          if (ocxns.length > 0) {
            for (var j = 0 ; j < ocxns.length; j++) {
              var ocurrentcxn = ocxns[j];
            
              if( nOptRelations==0 || (nOptRelations==1 && (ocurrentcxn.TypeNum()== 65 || ocurrentcxn.TypeNum()== 218))) {
                soutcxnname.value         = "";
                soutcxnsourceobj.value    = "";
                soutcxnsourcetype.value   = "";

                // Check of current connection
                brightcxn = getcxn2orgelem(nloc, ocurrentobjdef, ocurrentcxn, soutcxnname, soutcxnsourceobj, soutcxnsourcetype);

                if (brightcxn == true) {
                // if connection between Function and OrgUnit
                  if (bfirst == true) {
                    bfirst = false;
                  } else {
                    outfile.TableRow();
                    nrow++;
                    outfile.TableCell("", 25, getString("TEXT15"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                  }

                  outfile.TableCell(soutcxnname.value, 25, getString("TEXT15"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                  outfile.TableCell(soutcxnsourceobj.value, 25, getString("TEXT15"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                  outfile.TableCell(soutcxnsourcetype.value, 25, getString("TEXT15"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                  
                  bColored = !bColored; // Change background color                  
                }
              }
            }
          }

          if (bfirst == true) {
          // No (right) connection types were found
            outfile.TableCell(txtNoTypes, 25, getString("TEXT15"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            outfile.TableCell("", 25, getString("TEXT15"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            outfile.TableCell("", 25, getString("TEXT15"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
          }

          if (ocxns.length == 0) {
            bColored = !bColored; // Change background color          
          }

          // ------------------------------  Text ---------------------------------------------------------------
        }
        else if(nOptOutputFormat==1) {
          outfile.OutputLn(txtFunction+ ": " + ocurrentobjdef.Name(nloc), getString("TEXT15"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
          var ocxns = ocurrentobjdef.CxnList();
          if (ocxns.length > 0) {
            for (var j = 0; j < ocxns.length; j++) {
              var ocurrentcxn = ocxns[j];

              if( nOptRelations==0 || (nOptRelations==1 && (ocurrentcxn.TypeNum()== 65 || ocurrentcxn.TypeNum()== 218))) {
                soutcxnname.value         = "";
                soutcxnsourceobj.value    = "";
                soutcxnsourcetype.value   = "";

                // Check of current connection
                brightcxn = getcxn2orgelem(nloc, ocurrentobjdef, ocurrentcxn, soutcxnname, soutcxnsourceobj, soutcxnsourcetype);

                if (brightcxn == true) {
                // if connection between Function and OrgElement
                  bfirst = false;

                  outfile.OutputLn(soutcxnname.value, getString("TEXT15"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 10);
                  outfile.OutputLn(((soutcxnsourceobj.value + " :  ") + soutcxnsourcetype.value), getString("TEXT15"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 20);
                }
              }
            }
          }

          if (bfirst == true) {
          // No (right) connection types were found
            outfile.OutputLn(txtNoTypes, getString("TEXT15"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 10);
          }
        }
      } else {
        bnoobj = true;
      }
    }
  }


  if ((bnoobj == true) && (bokobj == false)) {
  // No object of the function type was selected.
    Dialogs.MsgBox(txtNoFunctionObject, Constants.MSGBOX_BTN_OK, getString("TEXT16"));
    Context.setScriptError(Constants.ERR_NOFILECREATED);
  } else {
    if (nOptOutputFormat == 0) {
      outfile.EndTable("", 100, getString("TEXT15"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }

    if (bnoobj == true) {
      ncheckmsg = Dialogs.MsgBox(txtAtLeastOneNotFunction, Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT16"));
    }

    if (bokobj == true && ! (ncheckmsg == (2))) {
      outfile.WriteReport();
    } else {
      Context.setScriptError(Constants.ERR_CANCEL);
    }
  }
}



function getcxn2orgelem(nloc, ocurrentobjdef, ocurrentcxn, soutcxnname, soutcxnsourceobj, soutcxnsourcetype, nOptRelations)
{
  // Get string for  connection name output and string for source object output
  // Check if current connection is connection from/to OrgElement

  var __functionResult = false;

  var osourceobjdef = ocurrentcxn.SourceObjDef();
  var otargetobjdef = ocurrentcxn.TargetObjDef();

  if ((ocurrentobjdef.IsEqual(otargetobjdef))) {
    // if object definiton is target of connection
    soutcxnname.value       = ocurrentcxn.PassiveType();
    soutcxnsourceobj.value  = osourceobjdef.Name(nloc);
    soutcxnsourcetype.value = osourceobjdef.Type();

    switch(osourceobjdef.TypeNum()) {
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
        __functionResult = true;
      break;
    }
  } 
  else {
    // if object definiton is source of connection
    soutcxnname.value       = ocurrentcxn.ActiveType();
    soutcxnsourceobj.value  = otargetobjdef.Name(nloc);
    soutcxnsourcetype.value = otargetobjdef.Type();

    switch(otargetobjdef.TypeNum()) {
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
        __functionResult = true;
      break;
    }
  }

  return __functionResult;
}

/**
 *  function showOutputOptionsDialog
 *  shows output options dialog with specified initial settings
 *  @param bDisableOutputOptions flag for disabling output format settings
 *  @param holder_nOptOutputFormat receives output format setting
 *  @param holder_nOptRelations receives relations setting
 *  @return dialog return value
 */
function showOutputOptionsDialog(bDisableOutputOptions, holder_nOptOutputFormat, holder_nOptRelations)
{
  // Output format
  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 385, 110, txtOutputOptionsDialogTitle);

  userdialog.GroupBox(7, 0, 380, 55, txtOutputFormat);
  userdialog.OptionGroup(dicOutputFormat);
  userdialog.OptionButton(20, 15, 350, 15, txtOFTable);
  userdialog.OptionButton(20, 30, 350, 15, txtOFText);

  userdialog.GroupBox(7, 60, 380, 55, txtRelations);
  userdialog.OptionGroup(dicRelations);
  userdialog.OptionButton(20, 75, 350, 15, txtRelAll);
  userdialog.OptionButton(20, 90, 350, 15, txtRelExecutes);

  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_ed90c300_eae4_11d8_12e0_9d2843560f51_dlg_01.hlp");
  
  dlgFuncOutput = Dialogs.createUserDialog(userdialog); 

  // Read dialog settings from config
  var sSection = "SCRIPT_ed90c300_eae4_11d8_12e0_9d2843560f51";  
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicRelations, holder_nOptRelations.value);
  dlgFuncOutput.setDlgValue(dicOutputFormat, holder_nOptOutputFormat.value);
  dlgFuncOutput.setDlgEnable(dicOutputFormat, !bDisableOutputOptions);

  nuserdialog = Dialogs.show( __currentDialog = dlgFuncOutput);   // Displays dialog and waits for the confirmation with OK.

  if (nuserdialog != 0) {
    holder_nOptOutputFormat.value = dlgFuncOutput.getDlgValue(dicOutputFormat);
    holder_nOptRelations.value    = dlgFuncOutput.getDlgValue(dicRelations);
    
    // Write dialog settings to config    
    WriteSettingsDlgValue(dlgFuncOutput, sSection, dicRelations);
    WriteSettingsDlgValue(dlgFuncOutput, sSection, dicOutputFormat);    
  }
    
  return nuserdialog;  
}


main();









