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

const EVAL_FAD = true;    // BLUE-21895

// text constants
// dialog text constants
var txtOutputOptionsDialogTitle = getString("TEXT1");
var txtOutput           = getString("TEXT2");
var txtOEExecuting      = getString("TEXT3");
var txtOEAll            = getString("TEXT4");
var txtModelGraphic     = getString("TEXT5");
var txtFormatGraphic    = getString("TEXT6");

// output text constants
var txtRelationType = getString("TEXT7");
var txtOrgElements  = getString("TEXT8");
var txtHasInput     = getString("TEXT9");
var txtHasOutput    = getString("TEXT10");
var txtFunction     = getString("TEXT11");
var txtDescDef      = getString("TEXT12");
var txtNoTypes      = getString("TEXT13");

// messagebox text constants
var txtNoFuncInModel_1  = getString("TEXT14");
var txtNoFuncInModel_2  = getString("TEXT15");
var txtNoModelsSelected = getString("TEXT16");


var bremote;



function main()
{
  // In VB implizit deklarierte lokale Variablen
  var scripterror = undefined;
  //////

  var oconobjdef = new __holder(null);   // Object which is linked to the current object(oCurrentObjDef) via the current connection.

  var stablea     = new Array();   // List of object names.
  var stableb     = new Array();   // List of object names.
  var stablec     = new Array();   // List of object names.
  var stablecxna  = new Array();   // List of connection names.
  var stableatype = new Array();   // List of object types.
  var stablebtype = new Array();   // List of object types.
  var stablectype = new Array();   // List of ObjDef types.

  var ncounta = 0;   // Number of field elements in sTableA.
  var ncountb = 0;   // Number of field elements in sTableB.
  var ncountc = 0;   // Number of field elements in sTableC.
  var nopt = 0;   // Variable for outputting the organizational units and input/output data.
  var ngrcount = 0;   // Variable in which the highest number of field elements is registered.
  var ncheckmsg = 0;   // Variable containing the answer to the message (2 = Abort was selected).


  var bnoobj = false;   // For checking whether no objects of the correct type were found.
  var bokobj = false;   // For checking whether objects of the correct type were found.
  var bcheckfirst = true;   // Variable for creating the table header.
  var bfirstout = false;   // Variable for creating a new table row and outputting the object name.
  var bnotrightcxn = false;   // Variable for indicating if wrong connection types were found.
  var brightcxn = false;   // Variable for indicating if connections of the correct type were found.
  var bcheckuserdialog = new __holder(false);   // Variable for checking whether the user selected Abort in the dialogs.

  var scxnname = new __holder("");   // String containing the current connection name.

  bremote = getremoteentryfromreg();

  // Set
  var nloc      = Context.getSelectedLanguage();
  var noutcheck = Context.getSelectedFormat();
  var berror    = false;

  var omodels = ArisData.getSelectedModels();
  omodels = ArisData.sort(omodels, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, nloc);
  
  var bDisableGraphic;
  
  if (omodels.length > 0) {

    if(Context.getSelectedFormat() == Constants.OUTTEXT) {
        bDisableGraphic = true;
		} else if( Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX ) {
        bDisableGraphic = true;
		} else {
        bDisableGraphic = false;
    }

    var holder_nOptOrgElements  = new __holder(0);
    var holder_bGraphic         = new __holder(!bDisableGraphic);

    var outfile = Context.createOutputObject(Context.getSelectedFormat(), Context.getSelectedFile());
    outfile.Init(nloc);


    var nuserdialog = showOutputOptionsDialog(outfile, holder_nOptOrgElements, holder_bGraphic);
    if(nuserdialog==0) {
      scripterror = Constants.ERR_CANCEL;
      return;
    }
    var nOptOrgElements = holder_nOptOrgElements.value;
    var bGraphic        = holder_bGraphic.value;



    outfile.DefineF("REPORT1", getString("TEXT17"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
    outfile.DefineF("REPORT2", getString("TEXT17"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    outfile.DefineF("REPORT3", getString("TEXT17"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

    // Create page header, page footer, headline and information header
    setReportHeaderFooter(outfile, nloc, true, true, true);

    for (var i = 0; i < omodels.length; i++) {
      var ocurrentmodel = omodels[i];
      if (ocurrentmodel.OrgModelTypeNum() == Constants.MT_VAL_ADD_CHN_DGM) {        // TANR 216764
        outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        bokobj = true;
        
        // Output of selected models.
        outfile.TableRow();
        outfile.TableCell(((ocurrentmodel.Type() + ": ") + ocurrentmodel.Name(nloc)), 100, getString("TEXT17"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

        // Table containing attributes.
        var oattributes = ocurrentmodel.AttrList(nloc);
        for (var j = 0 ; j < oattributes.length; j++) {
          var ocurrentattribute = oattributes[j];
          if(!(ocurrentattribute.TypeNum() == Constants.AT_NAME || ocurrentattribute.TypeNum() == Constants.AT_TYPE_1 || ocurrentattribute.TypeNum() == Constants.AT_TYPE_6 || inCaseRange(ocurrentattribute.TypeNum(), Constants.AT_TYP1, Constants.AT_TYP7))) {
            outfile.TableRow();
            outfile.TableCell(ocurrentattribute.Type(), 50, getString("TEXT17"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            outfile.TableCell(ocurrentattribute.GetValue(true), 50, getString("TEXT17"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
          }
        }

        // Object list.
        var oobjoccs = ocurrentmodel.ObjOccListFilter(Constants.OT_FUNC);
        // Objects are sorted on the basis of their names.
        oobjoccs = ArisData.sort(oobjoccs, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, nloc);

        if (oobjoccs.length > 0) {
          for (var r = 0; r < oobjoccs.length; r++) {
            var ocurrentobjocc = oobjoccs[r];
            var ocurrentobjdef = ocurrentobjocc.ObjDef();
            brightcxn    = false;
            bnotrightcxn = false;
            
            // Output attribute description / definition.
            var ocurrentattribute = ocurrentobjdef.Attribute(Constants.AT_DESC, nloc);
            if (bcheckfirst == true) {
              outfile.TableRow();
              outfile.TableCell(txtFunction, 17, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
              outfile.TableCell(txtDescDef, 20, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
              outfile.TableCell(txtRelationType, 9, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
              outfile.TableCell(txtOrgElements, 9, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
              outfile.TableCell("", 9, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
              outfile.TableCell(txtHasInput, 9, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
              outfile.TableCell("", 9, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
              outfile.TableCell(txtHasOutput, 9, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
              outfile.TableCell("", 9, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
              bcheckfirst = false;
            }

            bfirstout = true;
            outfile.TableRow();
            outfile.TableCell(ocurrentobjdef.Name(nloc), 17, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            outfile.TableCell(ocurrentattribute.GetValue(true), 20, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            // List of connection occurrences of the current object.
            var ocxnoccs = ocurrentobjocc.CxnOccList();
            
            if (EVAL_FAD) {
                // BLUE-21895)
                var oOccsInAssignedModel = getOccsInAssignedModel(ocurrentobjocc.ObjDef());
                for (var m = 0 ; m < oOccsInAssignedModel.length; m++) {
                    var oAssObjOcc = oOccsInAssignedModel[m];
                    ocxnoccs = ocxnoccs.concat(oAssObjOcc.CxnOccList());
                }            
            }
            
            if (ocxnoccs.length > 0) {
              // List of connections is sorted.
              ocxnoccs = ArisData.sort(ocxnoccs, Constants.SORT_TYPE, Constants.SORT_NONE, Constants.SORT_NONE, nloc);

              var soutatype       = "";  // Current output string containing the object type.
              var soutbtype       = "";  // Current output string containing the object type.
              var soutctype       = "";  // Current output string containing the object type.
              var soutacxnname    = "";  // Current output string containing the connection name.
              var soutaname       = "";  // Current output string containing the object name.
              var soutbname       = "";  // Current output string containing the object name.
              var soutcname       = "";  // Current output string containing the object name.

              for (var h = 0; h < ocxnoccs.length; h++) {
                var ocurrentcxnocc = ocxnoccs[h];
                var ocurrentcxn = ocurrentcxnocc.CxnDef();
                scxnname.value = "";
                
                // Check of current connection
                if (getcxnocc2orgelem(ocurrentobjocc.ObjDef(), ocurrentcxn, scxnname, oconobjdef, nOptOrgElements) == true) {
                 // if connection between Function and OrgElement
                    brightcxn     = true;
                    stablecxna[ncounta]  = scxnname.value;
                    stablea[ncounta]     = oconobjdef.value.Name(nloc);
                    stableatype[ncounta] = oconobjdef.value.Type();
                    ncounta++;
                } else {
                    switch(ocurrentcxn.TypeNum()) {
                      case Constants.CT_IS_INP_FOR:
                        brightcxn = true;
                        oconobjdef.value = ocurrentcxn.SourceObjDef();
                        stableb[ncountb]     = oconobjdef.value.Name(nloc);
                        stablebtype[ncountb] = oconobjdef.value.Type();
                        ncountb++;
                      break;
                      case Constants.CT_HAS_OUT:
                        brightcxn = true;
                        oconobjdef.value = ocurrentcxn.TargetObjDef();
                        stablec[ncountc]     = oconobjdef.value.Name(nloc);
                        stablectype[ncountc] = oconobjdef.value.Type();
                        ncountc++;
                      break;
                      default:
                        bnotrightcxn = true;
                      }
                  }
                  oconobjdef.value = null;
                }
              } else {
                bnotrightcxn = true;
              }
               if ((bnotrightcxn == true) && (brightcxn == false)) {
                outfile.TableCell(txtNoTypes, 63, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
              }
               // Determine the highest counter.
              if (ncounta >= ncountb) {
                ngrcount = (ncounta >= ncountc) ? ncounta : ncountc;
              } else {
                ngrcount = (ncountb > ncountc) ? ncountb : ncountc;
              }
              // Output
              for (var k = 0; k < ngrcount; k++) {
                 // Output relationship type.
                if (ncounta > k) {
                  soutatype       = stableatype[k];
                  soutaname       = stablea[k];
                  soutacxnname    = stablecxna[k];
                } else {
                  soutatype       = "";
                  soutaname       = "";
                  soutacxnname    = "";
                }

                // Output relationship type 'has input'.
                if (ncountb > k) {
                  soutbtype       = stablebtype[k];
                  soutbname       = stableb[k];
                 } else {
                  soutbtype       = "";
                  soutbname       = "";
                }

                // Output relationship type 'has output'.
                if (ncountc > k) {
                  soutctype       = stablectype[k];
                  soutcname       = stablec[k];
                } else {
                  soutctype       = "";
                  soutcname       = "";
                }

                if (bfirstout == false) {
                  outfile.TableRow();
                  outfile.TableCell("", 17, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                  outfile.TableCell("", 20, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                }

                bfirstout = false;

                // Output relationship type.
                outfile.TableCell(soutacxnname, 9, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                outfile.TableCell(soutaname, 9, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                outfile.TableCell(soutatype, 9, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

                // Output relationship type 'has input'.
                outfile.TableCell(soutbname, 9, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                outfile.TableCell(soutbtype, 9, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                // Output relationship type 'has output'.
                outfile.TableCell(soutcname, 9, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                outfile.TableCell(soutctype, 9, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
              }

              // Reset of tables.
              stablea     = new Array();
              stableb     = new Array();
              stablec     = new Array();
              stableatype = new Array();
              stablebtype = new Array();
              stablectype = new Array();
              stablecxna  = new Array();
              ncounta = 0;
              ncountb = 0;
              ncountc = 0;
          }
        } else {
          ncheckmsg = Dialogs.MsgBox(txtNoFuncInModel_1 + ocurrentmodel.Name(nloc) + txtNoFuncInModel_2, Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT18"));
        }

        outfile.EndTable("", 100, getString("TEXT17"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        outfile.OutputLn("", getString("TEXT17"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
        outfile.OutputLn("", getString("TEXT17"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);

        // Graphic
        if (bGraphic) {
          graphicout(new __holder(outfile), ocurrentmodel);
          outfile.OutputLn("", getString("TEXT17"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
          outfile.OutputLn("", getString("TEXT17"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
        }
      } else {
        bnoobj = true;
      }
    }

    if (bnoobj == true && ! (ncheckmsg == (2))) {
      ncheckmsg = Dialogs.MsgBox(getString("TEXT19"), Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT18"));
    }

    if (bokobj == true && ! (ncheckmsg == (2))) {
      outfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
    } else {
      berror = true;
    }
  }

  else {
    Dialogs.MsgBox(txtNoModelsSelected, Constants.MSGBOX_BTN_OK, getString("TEXT18"));
    berror = true;
  }

  if (berror || ! (bcheckuserdialog.value)) {
    scripterror = Constants.ERR_CANCEL;
  }
}

function getOccsInAssignedModel(oObjDef) {
    var oOccsInAssignedModel = new Array();
    var oAssignedModels = oObjDef.AssignedModels(Constants.MT_FUNC_ALLOC_DGM);
    for (var i = 0; i < oAssignedModels.length; i++) {
        oOccsInAssignedModel = oOccsInAssignedModel.concat(oObjDef.OccListInModel(oAssignedModels[i]));        
    }
    return oOccsInAssignedModel;
}

function getcxnocc2orgelem(ocurrentobjdef, ocurrentcxn, scxnname, oconobjdef, nOptOrgElements)
{
  var __functionResult = false;
  // Get string for connection name output and ObjDef of OrgElment
  // Check if current connection is connection from/to OrgElement

  if(nOptOrgElements==1 && (! (ocurrentcxn.TypeNum() == 65  || ocurrentcxn.TypeNum() == 218))) {
    return __functionResult;
  }

  if ((ocurrentobjdef.IsEqual(ocurrentcxn.TargetObjDef()))) {
    // if object occurence is target of connection
    scxnname.value   = ocurrentcxn.PassiveType();
    oconobjdef.value = ocurrentcxn.SourceObjDef();
  } else {
    // if object occurence is source of connection
    scxnname.value   = ocurrentcxn.ActiveType();
    oconobjdef.value = ocurrentcxn.TargetObjDef();
  }

  switch(oconobjdef.value.TypeNum()) {
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

  return __functionResult;
}



var bShowGraphicSettingsDialog;
var dlgFuncOutput;

// dialog item code constants
var dicOrgElements          = "optOrgElements";
var dicModelGraphic         = "chkModelGraphic";
var dicShowGraphicSettings  = "butShowGraphicSettings";


/** 
  *  Dialog function for output options dialog
  * @param dlgItem   dialog item name
  * @param act action
  * @param suppVal support value
  * @return bool value, for act!=1, true means continue dialog and false ends dialog, vice versa for act=1 
  */
function dlgFuncOutputOptions(dlgItem, act, suppVal)
{
  var bResult = true;
  switch(act)
  {
    case 1:
      bResult = false;
      break;

    case 2:
      if(dlgItem==dicModelGraphic) {
        var bEnable = dlgFuncOutput.getDlgValue(dicModelGraphic)!=0;
        dlgFuncOutput.setDlgEnable(dicShowGraphicSettings, bEnable);
      } else if(dlgItem==dicShowGraphicSettings) {
        bShowGraphicSettingsDialog = true;
        bResult = false;
      }
      else if(dlgItem=="OK")
        bResult = false;
      else if(dlgItem=="Cancel")
        bResult = false;
      break;
  }

  return bResult;
}


/**
 *  function showOutputOptionsDialog
 *  shows output options dialog with specified initial settings
 *  @param outfile output file
 *  @param bDisableGraphic flag, true disables graphic settings 
 *  @param holder_nOptOrgElements receives org elements setting
 *  @param holder_bGraphic receives graphic setting
 *  @return dialog return value
 */
function showOutputOptionsDialog(outfile, 
                              holder_nOptOrgElements, holder_bGraphic)
{
  // Output format
  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 300, 75, txtOutputOptionsDialogTitle, "dlgFuncOutputOptions");

  userdialog.Text(7, 0, 280, 15, txtOutput);
  userdialog.OptionGroup(dicOrgElements);
  userdialog.OptionButton(7, 15, 280, 15, txtOEAll);
  userdialog.OptionButton(7, 30, 280, 15, txtOEExecuting);

  userdialog.CheckBox(7, 55, 220, 15, txtModelGraphic, dicModelGraphic);
  userdialog.PushButton(230, 55, 150, 15, txtFormatGraphic, dicShowGraphicSettings);

  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_12d33db0_eadf_11d8_12e0_9d2843560f51_dlg_01.hlp");
  
  dlgFuncOutput = Dialogs.createUserDialog(userdialog); 
  
  // Read dialog settings from config
  var sSection = "SCRIPT_12d33db0_eadf_11d8_12e0_9d2843560f51";  
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicOrgElements, holder_nOptOrgElements.value);
  
  if (holder_bGraphic.value) {
      ReadSettingsDlgValue(dlgFuncOutput, sSection, dicModelGraphic, holder_bGraphic.value?1:0);
      dlgFuncOutput.setDlgEnable(dicModelGraphic, true);
      var bEnable = (dlgFuncOutput.getDlgValue(dicModelGraphic) != 0);
      dlgFuncOutput.setDlgEnable(dicShowGraphicSettings, bEnable);
  } else {
      // Out format = XLS or TXT
      dlgFuncOutput.setDlgValue(dicModelGraphic, 0);
      dlgFuncOutput.setDlgEnable(dicModelGraphic, false);
      dlgFuncOutput.setDlgEnable(dicShowGraphicSettings, false);
  }

  for(;;)
  {
    bShowGraphicSettingsDialog = false;
    nuserdialog = Dialogs.show( __currentDialog = dlgFuncOutput);
    // Displays dialog and waits for the confirmation with OK.
    if (nuserdialog == 0) {
      return nuserdialog;
    }
    if(bShowGraphicSettingsDialog) {
      showGraphicSettingsDialog(outfile);
      bShowGraphicSettingsDialog = false;
      continue;
    }
    else break;
  }
  
  // Write dialog settings to config    
  if (nuserdialog != 0) {    
    WriteSettingsDlgValue(dlgFuncOutput, sSection, dicOrgElements);
    WriteSettingsDlgValue(dlgFuncOutput, sSection, dicModelGraphic);
  }    
  
  // set flag for output format
  holder_nOptOrgElements.value  = dlgFuncOutput.getDlgValue(dicOrgElements);
  holder_bGraphic.value         = dlgFuncOutput.getDlgValue(dicModelGraphic)!=0;
    
  return nuserdialog;  
}


/**
 *  show graphic settings dialog, depending on bremote flag
 *
 */
function showGraphicSettingsDialog(outfile)
{
  var bcheckuserdialog = new __holder(true);
  if (bremote) { // WebDesigner
    graphicdialogs_default(new __holder(outfile), bcheckuserdialog);
  }
  else { // WindowsClient
    graphicdialogs(new __holder(outfile), bcheckuserdialog);
  }
}

function inCaseRange(val, lower, upper)
{
  return (val >= lower) && (val <= upper);
}

main();









