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

// dialog texts
var txtOutputOptions            = getString("TEXT1");
var txtOutputFormat             = getString("TEXT2");
var txtOFTable                  = getString("TEXT3");
var txtOFText                   = getString("TEXT4");
var txtModelsObjects            = getString("TEXT5");
var txtModels                   = getString("TEXT6");
var txtWithAttributes           = getString("TEXT7");
var txtWithGraphic              = getString("TEXT8");
var txtFormatGraphic            = getString("TEXT9");
var txtObjects                  = getString("TEXT10");
var txtRecurse                  = getString("TEXT11");
var txtNoGroupsSelected         = getString("TEXT12");

// output texts
var txtModelName                = getString("TEXT13");
var txtModelType                = getString("TEXT14");
var txtObjectName               = getString("TEXT15");
var txtObjectType               = getString("TEXT16");
var txtGroup                    = getString("TEXT17");




// constants for indentation of attributes etc.
var g_nContentIdent = 5;
var g_nIdentAttributes = 5;
var g_nIdentNextLevel = 5;



// global variables
var g_nloc = 0; // Variable for determining the ID of the current language.

var dlgGroupInfo;
var bShowGraphicSettingsDialog;
var bremote = false;

var bDisableFormatGraphicButton = false;

// Dialog support depends on script runtime environment (STD resp. BP, TC)
var g_bDialogsSupported = isDialogSupported();

function main()
{
  g_nloc = Context.getSelectedLanguage();

  var outfile = Context.createOutputObject();

  var ogroups = ArisData.getSelectedGroups();
  ogroups = ArisData.sort(ogroups, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
  if (ogroups.length > 0) {

    var nDefaultOptOutputFormat;
    var bLockOptFormat;

    if(Context.getSelectedFormat() == Constants.OutputTXT) {
      bDisableFormatGraphicButton = true;
	} else if(Context.getSelectedFormat() == Constants.OutputXLS) {
      bDisableFormatGraphicButton = true;
	} else {
      bDisableFormatGraphicButton = false;
    }

    // dialog default settings
    var holder_nOptOutputFormat = new __holder(0);
    var holder_bModels          = new __holder(true);
    var holder_bModelAttr       = new __holder(true);
    var holder_bModelGraphic    = new __holder(false);
    var holder_bObjects         = new __holder(false);
    var holder_bObjectAttr      = new __holder(false);
    var holder_bRecursive       = new __holder(false);

    if (g_bDialogsSupported) {
        var nDialogResult = showOutputOptionsDialog(outfile, 
                                                   holder_nOptOutputFormat, holder_bModels, holder_bModelAttr, holder_bModelGraphic, 
                                                   holder_bObjects, holder_bObjectAttr, holder_bRecursive);
        if(nDialogResult == 0) {    // check for cancel
          Context.setScriptError(Constants.ERR_CANCEL);
          return;
        }
    } else {
        // BLUE-10824
        holder_nOptOutputFormat.value = Context.getSelectedFormat() != Constants.OutputTXT ? 0 : 1; // Table/Text
        holder_bModels.value          = true;   // Models
        holder_bModelAttr.value       = true;   // With all specified model attributes
        holder_bModelGraphic.value    = false;  // With model graphic
        holder_bObjects.value         = true;   // Objects
        holder_bObjectAttr.value      = true;   // With all specified object attributes
        holder_bRecursive.value       = false;  // Include subgroups
    }

    // set flag for output format
    var nOutputFormat = holder_nOptOutputFormat.value;

    //  set flags for model/object data to consider
    var bmodels       = holder_bModels.value;
    var bmodelattr    = holder_bModelAttr.value;
    var bmodelgraphic = holder_bModelGraphic.value;
    var bobjects      = holder_bObjects.value;
    var bobjectattr   = holder_bObjectAttr.value;
    var brecursive    = holder_bRecursive.value;

    outfile.DefineF("REPORT1", getString("TEXT18"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
    outfile.DefineF("REPORT2", getString("TEXT18"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    outfile.DefineF("REPORT3", getString("TEXT18"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

    setReportHeaderFooter(outfile, g_nloc, true, true, true);

    // Output of the group  ModellTyp ModellName ModellGrafik.
    for (var i = 0 ; i < ogroups.length; i++ ){
      var ocurrentgroup = ogroups[i];

      writeGroupContents(outfile, ocurrentgroup, 10, brecursive, bmodels, bmodelattr, bmodelgraphic, bobjects, bobjectattr, nOutputFormat);
    }

    outfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
  }
  else {
    showMessageBox(txtNoGroupsSelected, Constants.MSGBOX_BTN_OK, getString("TEXT19"));
    Context.setScriptError(Constants.ERR_NOFILECREATED);
  }
}

function writeGroupContents(outfile, ocurrentgroup, nIdent, bRecursive, bModels, bModelAttr, bModelGraphic, bObjects, bObjectAttr, nOutputFormat)
{
  writeGroup(outfile, ocurrentgroup, nIdent, nOutputFormat);

  if(bModels) {
    writeGroupModels(outfile, ocurrentgroup, nIdent+g_nContentIdent, bModelAttr, bModelGraphic, nOutputFormat);
  }


  if(bObjects) {
      
    var objDefCount = ocurrentgroup.ObjDefList().length;
      
    if(nOutputFormat==0 && objDefCount > 0) {
      outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
      var colHeadings = new Array(txtObjectName, txtObjectType, txtGroup);
      writeTableHeaderWithColor(outfile, colHeadings, 10, getTableCellColor_Head(), Constants.C_WHITE);
    }

    writeGroupObjects(outfile, ocurrentgroup, nIdent+g_nContentIdent, bObjectAttr, nOutputFormat);

    if(nOutputFormat==0 && objDefCount > 0) {
      outfile.EndTable("", 100, getString("TEXT18"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }

  }

  // recurse sub groups
  if (bRecursive) {
    var ochildren = ocurrentgroup.Childs();
    ochildren = ArisData.sort(ochildren, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);

    if ((ochildren.length > 0)) {
      for (var h = 0; h < ochildren.length; h++) {
        var ocurrentchild = ochildren[h];
        writeGroupContents(outfile, ocurrentchild, nIdent+g_nIdentNextLevel, bRecursive, bModels, bModelAttr, bModelGraphic, bObjects, bObjectAttr, nOutputFormat);
      }
    }
  }
}

function writeGroup(outfile, ocurrentgroup, nIdent, nOutputFormat)
{
  if(nOutputFormat==1)  // text output for group is done at model/object level
  {
    // output format text
    outfile.OutputLn(ocurrentgroup.Path(g_nloc), getString("TEXT18"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, nIdent);
  }
}

function writeGroupModels(outfile, ocurrentgroup, nIdent, bModelAttr, bModelGraphic, nOutputFormat)
{
  var sGroupPath = ocurrentgroup.Path(g_nloc);
    
  var omodels = ocurrentgroup.ModelList();
  omodels = ArisData.sort(omodels, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);
  if (omodels.length > 0) {
    for (var i = 0; i < omodels.length; i++) {

      var ocurrentmodel = omodels[i];
      
      if(nOutputFormat==0) {
        outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        var colHeadings = new Array(txtModelName, txtModelType, txtGroup);
        writeTableHeaderWithColor(outfile, colHeadings, 10, getTableCellColor_Head(), Constants.C_WHITE);
          
        outfile.TableRow();
        outfile.TableCell(ocurrentmodel.Name(g_nloc), 33, getString("TEXT18"), 10, getTableCellColor_Font(true), getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        outfile.TableCell(ocurrentmodel.Type(), 33, getString("TEXT18"), 10, getTableCellColor_Font(true), getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        outfile.TableCell(sGroupPath, 34, getString("TEXT18"), 10, getTableCellColor_Font(true), getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      }
      else if(nOutputFormat==1) {
        outfile.OutputLn(((ocurrentmodel.Name(g_nloc) + ": ") + ocurrentmodel.Type()), getString("TEXT18"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, nIdent);
      }
      // Output of the attributes that are maintained.
      if (bModelAttr) {
        var oattributes = ocurrentmodel.AttrList(g_nloc);
        if (oattributes.length > 0) {
          var bAttrColored = true;   // variable to change background color of table rows (attributes)
          
          for (var j = 0; j < oattributes.length; j++) {
            var ocurrentattribute = oattributes[j];
            // check attribute type
            if(!(ocurrentattribute.TypeNum() == Constants.AT_NAME || ocurrentattribute.TypeNum() == Constants.AT_TYPE_1 || ocurrentattribute.TypeNum() == Constants.AT_TYPE_6 || inCaseRange(ocurrentattribute.TypeNum(), Constants.AT_TYP1, Constants.AT_TYP7))) {
                if(nOutputFormat==0) {
                  outfile.TableRow();
                  outfile.TableCell(ocurrentattribute.Type(), 33, getString("TEXT18"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                  outfile.TableCell(ocurrentattribute.GetValue(true), 33, getString("TEXT18"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                  outfile.TableCell("", 34, getString("TEXT18"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                
                  bAttrColored = !bAttrColored; // Change background color (attributes)
                }
                else if(nOutputFormat==1) {
                  outfile.OutputLn(ocurrentattribute.Type() + ": " + ocurrentattribute.GetValue(true), getString("TEXT18"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, nIdent+g_nIdentAttributes);
                }
            }
          }
        }
      }
      
      if(nOutputFormat==0) {
        outfile.EndTable("", 100, getString("TEXT18"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      }
      
      if (! (nOutputFormat == 1)) {
        // Output of the graphic only if not Text format.
        if (bModelGraphic) {
          graphicout(new __holder(outfile), ocurrentmodel);
          
          outfile.OutputField(Constants.FIELD_NEWPAGE, "Arial", 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
        }
      }
    }
  }
}

function writeGroupObjects(outfile, ocurrentgroup, nIdent, bObjectAttr, nOutputFormat)
{
  var sGroupPath = ocurrentgroup.Path(g_nloc);
  
  var oobjdefs = ocurrentgroup.ObjDefList();
  oobjdefs = ArisData.sort(oobjdefs, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);

  if (oobjdefs.length > 0) {
    var bColored = bObjectAttr;   // variable to change background color of table rows
    
    for (var i = 0; i < oobjdefs.length; i++) {
      var ocurrentobjdef = oobjdefs[i];

      if(nOutputFormat==0) {
        outfile.TableRow();
        outfile.TableCell(ocurrentobjdef.Name(g_nloc), 33, getString("TEXT18"), 10, getTableCellColor_Font(bColored), getTableCellColor_Bk(bColored), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        outfile.TableCell(ocurrentobjdef.Type(), 33, getString("TEXT18"), 10, getTableCellColor_Font(bColored), getTableCellColor_Bk(bColored), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        outfile.TableCell(sGroupPath, 34, getString("TEXT18"), 10, getTableCellColor_Font(bColored), getTableCellColor_Bk(bColored), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      }
      else if(nOutputFormat==1) {
        outfile.OutputLn(((ocurrentobjdef.Name(g_nloc) + ": ") + ocurrentobjdef.Type()), getString("TEXT18"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, nIdent);
      }
      // Output of the attributes that are maintained.
      if (bObjectAttr) {
        var oattributes = ocurrentobjdef.AttrList(g_nloc);
        if (oattributes.length > 0) {
          var bAttrColored = true;   // variable to change background color of table rows (attributes)
            
          for (var j = 0; j < oattributes.length; j++) {
            var ocurrentattribute = oattributes[j];
            if(!(ocurrentattribute.TypeNum() == Constants.AT_NAME || ocurrentattribute.TypeNum() == Constants.AT_TYPE_1 || ocurrentattribute.TypeNum() == Constants.AT_TYPE_6 || inCaseRange(ocurrentattribute.TypeNum(), Constants.AT_TYP1, Constants.AT_TYP7))) {
                if(nOutputFormat==0) {
                  outfile.TableRow();
                  outfile.TableCell(ocurrentattribute.Type(), 33, getString("TEXT18"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                  outfile.TableCell(ocurrentattribute.GetValue(true), 33, getString("TEXT18"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                  outfile.TableCell("", 34, getString("TEXT18"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                
                  bAttrColored = !bAttrColored; // Change background color (attributes)
                }
                else if(nOutputFormat==1) {
                  outfile.OutputLn(ocurrentattribute.Type() + ": " + ocurrentattribute.GetValue(true), getString("TEXT18"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, nIdent+g_nIdentAttributes);
                }
            }
          }
        }
      }
      sGroupPath = "";
      
      if (!bObjectAttr) {
          bColored = !bColored; // Change background color 
      }
    }
  }
}


// dialog item codes
var dicOutputFormat         = "optOutputFormat";
var dicModels               = "chkModels";
var dicModelAttr            = "chkModel_attr";
var dicModelGraphic         = "chkModel_graphic";
var dicShowGraphicSettings  = "butShowGraphicSettings";
var dicObjects              = "chkObjects";
var dicObjectAttr           = "chkObject_attr";
var dicRecursive            = "chkRecursive";

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
    switch(act) {
        case 1:
            switch(Context.getSelectedFormat()) {
                case Constants.OUTTEXT:
                    __currentDialog.setDlgValue(dicOutputFormat, 1);            
                    __currentDialog.setDlgEnable(dicOutputFormat, false);
                    __currentDialog.setDlgValue(dicModelGraphic, 0);
                    __currentDialog.setDlgEnable(dicModelGraphic, false);
                    __currentDialog.setDlgEnable(dicShowGraphicSettings, false);                    
                    break;
                case Constants.OutputXLS:
                    __currentDialog.setDlgValue(dicOutputFormat, 0);            
                    __currentDialog.setDlgEnable(dicOutputFormat, false);
                    __currentDialog.setDlgValue(dicModelGraphic, 0);                    
                    __currentDialog.setDlgEnable(dicModelGraphic, false);
                    __currentDialog.setDlgEnable(dicShowGraphicSettings, false);                    
                    break;
                case Constants.OutputXLSX:
                    __currentDialog.setDlgValue(dicOutputFormat, 0);            
                    __currentDialog.setDlgEnable(dicOutputFormat, false);
                    __currentDialog.setDlgValue(dicModelGraphic, 0);                    
                    __currentDialog.setDlgEnable(dicModelGraphic, false);
                    __currentDialog.setDlgEnable(dicShowGraphicSettings, false);                    
                    break;
                default:
                    var bEnable = (__currentDialog.getDlgValue(dicOutputFormat)==0 && __currentDialog.getDlgValue(dicModels)!=0);
                    __currentDialog.setDlgEnable(dicModelGraphic, bEnable);

                    bEnable = bEnable && (__currentDialog.getDlgValue(dicModelGraphic) != 0);
                    __currentDialog.setDlgEnable(dicShowGraphicSettings, bEnable);
                    break;    
            }
            var bEnableMod = (__currentDialog.getDlgValue(dicModels)!=0);
            __currentDialog.setDlgEnable(dicModelAttr, bEnableMod);

            
            var bEnableObj = (__currentDialog.getDlgValue(dicObjects)!=0);
            __currentDialog.setDlgEnable(dicObjectAttr, bEnableObj);
            
            bResult = false;
            break;
        
        case 2: 
            if(dlgItem==dicOutputFormat)
            {
                var bEnable = __currentDialog.getDlgValue(dicOutputFormat)==0;
                var bModelGraphic = __currentDialog.getDlgValue(dicModelGraphic)!=0;
                __currentDialog.setDlgEnable(dicModelGraphic, bEnable);
                __currentDialog.setDlgEnable(dicShowGraphicSettings, bEnable && bModelGraphic);
                if (!bEnable) {
                    __currentDialog.setDlgValue(dicModelGraphic, 0);
                }
            }    
            else if(dlgItem==dicModels)
            {
                var bEnable = __currentDialog.getDlgValue(dicModels)!=0;
                var bModelGraphic = __currentDialog.getDlgValue(dicModelGraphic)!=0;
                __currentDialog.setDlgEnable(dicModelAttr, bEnable);
                __currentDialog.setDlgEnable(dicModelGraphic, bEnable && (!bDisableFormatGraphicButton));
                __currentDialog.setDlgEnable(dicShowGraphicSettings, bEnable && bModelGraphic && (!bDisableFormatGraphicButton));
            }
            else if(dlgItem==dicModelGraphic)
            {
                var bEnable = __currentDialog.getDlgValue(dicModelGraphic)!=0;
                __currentDialog.setDlgEnable(dicShowGraphicSettings, bEnable);
            }
            else if(dlgItem==dicObjects)
            {
                var bEnable = __currentDialog.getDlgValue(dicObjects)!=0;
                __currentDialog.setDlgEnable(dicObjectAttr, bEnable);
            }
            else if(dlgItem=="OK")
                bResult = false;
            else if(dlgItem=="Cancel")
                bResult = false;
            else if(dlgItem==dicShowGraphicSettings)
            {
                bShowGraphicSettingsDialog = true;
                bResult = false;
            }
            break;
    }
    
    return bResult;
}


/**
 *  function showOutputOptionsDialog
 *  shows output options dialog with specified initial settings
 *  @param holder_nOptOutputFormat receives output format setting
 *  @param holder_bModels receives model setting
 *  @param holder_bModelAttr receives model attributes setting
 *  @param holder_bModelGraphic receives model graphic setting
 *  @param holder_bObjects receives objects setting
 *  @param holder_bObjectAttr receives object attributes setting
 *  @param holder_bRecursive receives recurse subgroups setting
 *  @return dialog return value
*/
function showOutputOptionsDialog(outfile, 
                               holder_nOptOutputFormat, holder_bModels, holder_bModelAttr, holder_bModelGraphic, 
                               holder_bObjects, holder_bObjectAttr, holder_bRecursive)
{
  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 385, 190, txtOutputOptions, "dlgFuncOutputOptions");

  userdialog.GroupBox(7, 0, 426, 55, txtOutputFormat);
  userdialog.OptionGroup(dicOutputFormat);
  userdialog.OptionButton(20, 15, 380, 15, txtOFTable);
  userdialog.OptionButton(20, 30, 380, 15, txtOFText);

  userdialog.GroupBox(7, 60, 426, 100, txtModelsObjects);
  userdialog.CheckBox(20, 75, 220, 15, txtModels, dicModels);
  userdialog.CheckBox(33, 90, 220, 15, txtWithAttributes, dicModelAttr);
  userdialog.CheckBox(33, 105, 220, 15, txtWithGraphic, dicModelGraphic);
  userdialog.PushButton(260, 105, 150, 15, txtFormatGraphic, dicShowGraphicSettings);
  userdialog.CheckBox(20, 120, 380, 15, txtObjects, dicObjects);
  userdialog.CheckBox(33, 135, 380, 15, txtWithAttributes, dicObjectAttr);
  userdialog.CheckBox(7, 160, 380, 15, txtRecurse, dicRecursive);

  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_583c3cc0_272b_11d9_52e6_9e65a904efdd_dlg_01.hlp");  

  dlgGroupInfo = Dialogs.createUserDialog(userdialog); 
  var sSection = "SCRIPT_583c3cc0_272b_11d9_52e6_9e65a904efdd";
  
  var vals = new Array(  holder_nOptOutputFormat.value, (holder_bModels.value ? 1 : 0), (holder_bModelAttr.value ? 1 : 0),
                        (holder_bModelGraphic.value ? 1 : 0), (holder_bObjects.value ? 1 : 0), (holder_bObjectAttr.value ? 1 : 0), 
                        (holder_bRecursive.value ? 1 : 0) );

  var dics = new Array( dicOutputFormat, dicModels, dicModelAttr, dicModelGraphic, dicObjects, dicObjectAttr, dicRecursive);

  // Read dialog settings from config
  for(var i=0;i<vals.length;i++) {
    ReadSettingsDlgValue(dlgGroupInfo, sSection, dics[i], vals[i]); 
  }

  for(;;) {
    bShowGraphicsSettingsDialog = false;
    // Displays dialog and waits for the confirmation with OK / Cancel.
    nuserdialog = Dialogs.show( __currentDialog = dlgGroupInfo);

    if (nuserdialog == 0) {
      return nuserdialog;
    }
    if(bShowGraphicSettingsDialog) {
      showGraphicSettingsDialog(outfile);
      bShowGraphicSettingsDialog = false;
      continue;
    }
    else
      break;
  }

  // Write dialog settings to config  
  if (nuserdialog != 0) {
      for(var i = 0; i < dics.length; i++) {
          WriteSettingsDlgValue(dlgGroupInfo, sSection, dics[i]);
      }
  }
  
  // store dialog result in holders
  holder_nOptOutputFormat.value = dlgGroupInfo.getDlgValue(dicOutputFormat);

  var holders = new Array(holder_bModels,  holder_bModelAttr,  holder_bModelGraphic,  holder_bObjects,  holder_bObjectAttr,  holder_bRecursive);
  var dics    = new Array(dicModels,       dicModelAttr,       dicModelGraphic,       dicObjects,       dicObjectAttr,       dicRecursive);
  for(var i=0;i<holders.length;i++) {
    holders[i].value = (dlgGroupInfo.getDlgValue(dics[i]) != 0);
 }

  return nuserdialog;
}


/**
*  show graphic settings dialog, depending on bremote flag
*
*/
function showGraphicSettingsDialog(outfile)
{
    var bcheckuserdialog = new __holder(true);
    if (bremote) {
        // WebDesigner
        graphicdialogs_default(new __holder(outfile), bcheckuserdialog);
    }
    // WindowsClient
    else {
        graphicdialogs(new __holder(outfile), bcheckuserdialog);
    }
}

function showMessageBox(sMessage, nType, sTitle) {
    if (g_bDialogsSupported) {
        Dialogs.MsgBox(sMessage, nType, sTitle);
    }
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
