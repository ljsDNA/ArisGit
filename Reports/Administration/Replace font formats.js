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


var g_nloc = 0; 


function main()
{

  var ofontstyle_old = new __holder(null); 
  var ofontstyle_new = new __holder(null); 

  var omodels = null; 
  var omodel = null; 
  var oobjocclist = null; 
  var ocxnocclist = null; 
  var otextocclist = null; 

  var bprotocol = false; 
  var smsgtext = ""; 
  var smodelpath = new __holder(""); 
  var i = 0; 

  g_nloc = Context.getSelectedLanguage();

  if (userdlg(ofontstyle_old, ofontstyle_new, bprotocol)) {

    Context.writeOutput(formatstring2(getString("TEXT1"), getfontstylenameandid(ofontstyle_old.value), getfontstylenameandid(ofontstyle_new.value)));

    omodels = ArisData.getActiveDatabase().Find(Constants.SEARCH_MODEL);
    omodels = ArisData.sort(omodels, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);

    for ( i = 0 ; i < omodels.length ; i++ ){
      omodel = omodels[i];
      smodelpath.value = omodel.Type() + ": " + omodel.Name(g_nloc) + " (" + omodel.Group().Path(g_nloc) + ")";

      // Replace fonts of model object occs
      oobjocclist = omodel.ObjOccList();
      oobjocclist = ArisData.sort(oobjocclist, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
      replacefonts(oobjocclist, ofontstyle_old.value, ofontstyle_new.value, smodelpath, new __holder(1));

      // Replace fonts of model connection occs
      ocxnocclist = omodel.CxnOccList();
      ocxnocclist = ArisData.sort(ocxnocclist, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
      replacefonts(ocxnocclist, ofontstyle_old.value, ofontstyle_new.value, smodelpath, new __holder(2));

      // Replace fonts of model text occs
      otextocclist = omodel.TextOccList();
      otextocclist = ArisData.sort(otextocclist, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
      replacefonts(otextocclist, ofontstyle_old.value, ofontstyle_new.value, smodelpath, new __holder(3));

      oobjocclist = null;
      ocxnocclist = null;
      otextocclist = null;
      omodel = null;
    }

    omodels = null;
  }

  ofontstyle_old.value = null;
  ofontstyle_new.value = null;

  Context.setScriptError(Constants.ERR_NOFILECREATED);

}




function replacefonts(oocclist, ofontstyle_old, ofontstyle_new, smodelpath, nocctype)
{

  var ocurrocc = null; 
  var oattrocclist = null; 
  var ocurrattrocc = null; 
  var ocurrfontstyle = null; 

  var i = undefined;   var j = 0; 
  var boutput = false; 
  var bfirst = new __holder(false); 

  bfirst.value = true;

  for ( i = 0 ; i < oocclist.length ; i++ ){
    boutput = false;

    ocurrocc = oocclist[i];
    oattrocclist = ocurrocc.AttrOccList();

    for ( j = 0 ; j < oattrocclist.length ; j++ ){
      ocurrattrocc = oattrocclist[j];
      ocurrfontstyle = ocurrattrocc.FontStyleSheet();

      // --- Replace ---
      if (ocurrfontstyle.IsEqual(ofontstyle_old)) {

        boutput = ocurrattrocc.setFontStyleSheet(ofontstyle_new);
      }

      ocurrattrocc = null;
      ocurrfontstyle = null;
    }


    // Write output
    outputinfo(ocurrocc, bfirst, smodelpath, nocctype);

    ocurrocc = null;
    oattrocclist = null;
  }


}




var c_s4blancs = "    "; 
var c_s8blancs = "        "; 


function outputinfo(ocurrocc, bfirst, smodelpath, nocctype)
{

  if (smodelpath.value != "") {
    Context.writeOutput("");
    Context.writeOutput(smodelpath.value);
    smodelpath.value = "";      // Delete string, for next outputs
  }


  switch(nocctype.value) {
    case 1:
      if (bfirst.value) {
        Context.writeOutput((c_s4blancs + getString("TEXT2")));
      }

      Context.writeOutput((c_s8blancs + ocurrocc.ObjDef().Name(g_nloc)));

    break;
    case 2:
      if (bfirst.value) {
        Context.writeOutput((c_s4blancs + getString("TEXT3")));
      }

      Context.writeOutput((((c_s8blancs + ocurrocc.SourceObjOcc().ObjDef().Name(g_nloc)) + " --> ") + ocurrocc.TargetObjOcc().ObjDef().Name(g_nloc)));

    break;
    case 3:
      if (bfirst.value) {
        Context.writeOutput((c_s4blancs + getString("TEXT4")));
      }

      Context.writeOutput((c_s8blancs + ocurrocc.TextDef().Name(g_nloc)));
    break;
  }


  bfirst.value = false;

}




function userdlg(ofontstyle_old, ofontstyle_new, bprotocol)
{
  var __functionResult = false;

  var nuserdlg = 0;   // Variable for the user dialog box

  var ofontstylelist = null; 

  var nfontstylecount = 0; 

  var bfontsok = false; 
  var smsgtext = ""; 
  var i = 0; 


  // Get font style list
  ofontstylelist = ArisData.getActiveDatabase().FontStyleList();
  ofontstylelist = ArisData.sort(ofontstylelist, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
  
  var sfontstyles = new Array();
  for ( i = 0 ; i < ofontstylelist.length ; i++ ){
    sfontstyles[i] = getfontstylenameandid(ofontstylelist[i]);
  }
  
  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 450, 210, getString("TEXT5"));
  // %GRID:10,7,1,1
  userdialog.GroupBox(10, 7, 430, 155, getString("TEXT6"), "GroupBox1");
  userdialog.Text(25, 25, 400, 28, getString("TEXT7"), "Text1");
  userdialog.DropListBox(50, 60, 350, 70, sfontstyles, "Font_Old");
  userdialog.Text(30, 95, 400, 28, getString("TEXT8"), "Text2");
  userdialog.DropListBox(50, 130, 350, 70, sfontstyles, "Font_New");
  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_3eec1080_eae8_11d8_12e0_9d2843560f51_dlg_01.hlp");

  var dlg = Dialogs.createUserDialog(userdialog); 

  // Read dialog settings from config
  var sSection = "SCRIPT_3eec1080_eae8_11d8_12e0_9d2843560f51";  
  ReadSettingsListBoxByString(dlg, sSection, "Font_Old", "", sfontstyles);   
  ReadSettingsListBoxByString(dlg, sSection, "Font_New", "", sfontstyles);   
  
  nuserdlg = 1;
  bfontsok = false;

  while (! (bfontsok || nuserdlg == 0)) {

    nuserdlg = Dialogs.show( __currentDialog = dlg);
    // Show dialog (wait for ok).

    if (! (nuserdlg == 0)) {
      if ((dlg.getDlgValue("Font_Old") != dlg.getDlgValue("Font_New"))) {

        ofontstyle_old.value = ofontstylelist[dlg.getDlgValue("Font_Old")];
        ofontstyle_new.value = ofontstylelist[dlg.getDlgValue("Font_New")];

        bfontsok = true;
      } else {
        bfontsok = false;

        smsgtext = getString("TEXT9");
        Dialogs.MsgBox(smsgtext, Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, getString("TEXT5"));
      }

    }

  }

  // Write dialog settings to config  
  if (nuserdlg != 0) {  
      WriteSettingsListBoxByString(dlg, sSection, "Font_Old", sfontstyles);   
      WriteSettingsListBoxByString(dlg, sSection, "Font_New", sfontstyles);   
  }
  
  if (nuserdlg == 0) {
    __functionResult = false;
  }
  else {
    __functionResult = true;
  }


  ofontstylelist = null;

  return __functionResult;
}




function getfontstylenameandid(ofontstyle)
{
  var __functionResult = "";

  var snameandid = ""; 

  snameandid = ofontstyle.Name(g_nloc);

  if (ofontstyle.Attribute(Constants.AT_ID, g_nloc).IsMaintained()) {

    snameandid = snameandid + " (" + ofontstyle.Attribute(Constants.AT_ID, g_nloc).GetValue(true) + ")";
  }


  __functionResult = snameandid;

  return __functionResult;
}



main();








