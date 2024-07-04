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

// Variabeln für Einstellungen
__usertype_toptionstype = function() {
    this.bchktemplate = false;
    this.bchkbgcolor = false;
    this.bchktextattr = false;
    this.bchkassign = false;
    this.bchkmodelzoom = false;
    this.bchkusegrid = false;
    this.bchkprintscale = false;
    this.bchkpageorient = false;
    this.bchkblackwite = false;
    this.bchknewedges = false;
    this.bchkbridgeheight = false;
    this.bchkround = false;
    this.stemplateguid = "";
    this.nbgcolor = 0;
    this.bdoshowbackimage = false;
    this.ntextsymbolsetting = 0;
    this.bdoseparatetext = false;
    this.bdohideassign = false;
    this.nmodelzoom = 0;
    this.bdogrid = false;
    this.ngrid = 0;
    this.bdospecgrid = false;
    this.nprintscale = 0;
    this.npageorient = 0;
    this.bdoblackwhite = false;
    this.bdonewedges = false;
    this.nbridgeheight = 0;
    this.nround = 0;
}

// Typ fuer Eintraege
__usertype_tnamevaluetype = function(nvalue, sname) {
    this.nvalue = nvalue;   // Wert fuer Benutzereingabe
    this.sname  = sname;    // Name fuer Anzeige
}


var g_nloc = 0; 

var g_toptions = new __usertype_toptionstype(); 


function main()
{

  var omodels = null; 
  var omodel = null; 

  var bdialogok = false; 
  var i = 0; 

  g_nloc = Context.getSelectedLanguage();

  omodels = ArisData.getSelectedModels();

  // BLUE-12779
  if ( !canModelsBeChanged(omodels) ) {
      Dialogs.MsgBox(getString("TEXT54"), Constants.MSGBOX_ICON_ERROR | Constants.MSGBOX_BTN_OK, "");
      Context.setScriptError(Constants.ERR_CANCEL);
      return;
  }

  initoptions(omodels);
  // Modelloptionen initialisieren

  if (modelsettingsdialog()) {
  // Modelloptionen-Dialog anzeigen

    for ( i = 0 ; i < omodels.length ; i++ ){
      omodel = omodels[i];
      
      setselectedflags(omodel);
      // Flags setzen
      
      if ((g_toptions.bchktemplate)) {
          omodel.setTemplate(g_toptions.stemplateguid);
      }
      
      if ((g_toptions.bchkbgcolor)) {
        omodel.setBgColor(g_toptions.nbgcolor);
      }


      if ((g_toptions.bchktextattr)) {
        omodel.setAttrOccHandling(g_toptions.ntextsymbolsetting);
      }


      if ((g_toptions.bchkmodelzoom)) {
        omodel.SetZoom(g_toptions.nmodelzoom);
      }


      if ((g_toptions.bchkusegrid)) {
        omodel.setGrid(g_toptions.ngrid);
      }


      if ((g_toptions.bchkprintscale)) {
        omodel.setPrintScale(g_toptions.nprintscale);
      }


      if ((g_toptions.bchkbridgeheight)) {
        omodel.setBridgeHeight(g_toptions.nbridgeheight);
      }


      if ((g_toptions.bchkround)) {
        omodel.setRounding(g_toptions.nround);
      }

    }

  }


  Context.setScriptError(Constants.ERR_NOFILECREATED);

}

function canModelsBeChanged(oModels) {
    for (var i in oModels) {
        if ( !oModels[i].canWrite(true/*p_bCheckAccessPermissions*/) ) return false;
    }
    return true
}


function modelsettingsdialog()
{
  var __functionResult = false;

  var i = 0; 

  var sbackcolors = getcolors();

  // --- Back Color Texts ----
  var sbackcolortexts = new Array(); 
  var ncolorindex = 0; 

  for ( i = 0; i < sbackcolors.length; i++) {
    sbackcolortexts[i] = sbackcolors[i].sname;
    if ((g_toptions.nbgcolor == sbackcolors[i].nvalue)) {
      ncolorindex = i;
    }
  }


  var textsymbolattrsettings = getattributesettings();

  // --- Text Symbole Attribute Setting Texts ---
  var textsymbolattrsettingstexts = new Array(); 
  var ntextsymbolsettingindex = 0; 

  for ( i = 0; i < textsymbolattrsettings.length; i++) {
    textsymbolattrsettingstexts[i] = textsymbolattrsettings[i].sname;
    if ((g_toptions.ntextsymbolsetting == textsymbolattrsettings[i].nvalue)) {
      ntextsymbolsettingindex = i;
    }

  }

  // Templates
  var aConfigTemplates = ArisData.getConfigurationTemplates(g_nloc);
  var nTemplateIndex = 0;
  var aTemplateNames = new Array();
  for (var i = 0; i < aConfigTemplates.length; i++) {
      if (StrComp(g_toptions.stemplateguid, aConfigTemplates[i].getGUID()) == 0) {
          nTemplateIndex = i;
      }
      aTemplateNames.push(aConfigTemplates[i].getName());
  }
  
  var userdialog = Dialogs.createNewDialogTemplate(520, 390, getString("TEXT1"), "dlgfuncmodelsettings");
  // %GRID:10,7,1,0
  userdialog.GroupBox(20, 5, 490, 165, getString("TEXT2"));
  userdialog.CheckBox(30, 20, 235, 15, getString("TEXT3"), "chkUseTemplate");
  userdialog.DropListBox(270, 20, 230, 100, aTemplateNames, "lstTemplateGUID");
  userdialog.CheckBox(30, 45, 235, 15, getString("TEXT5"), "chkBgColor");
  userdialog.DropListBox(270, 45, 230, 100, sbackcolortexts, "lstColor");
  userdialog.CheckBox(270, 62, 220, 15, getString("TEXT6"), "doShowBackImage");
  userdialog.CheckBox(30, 85, 235, 15, getString("TEXT7"), "chkTextAttr");
  userdialog.DropListBox(270, 85, 230, 77, textsymbolattrsettingstexts, "lstTextSymbolSetting");
  userdialog.CheckBox(270, 102, 220, 15, getString("TEXT8"), "doSeparateText");
  userdialog.CheckBox(30, 125, 235, 15, getString("TEXT9"), "chkAssign");
  userdialog.CheckBox(270, 125, 220, 15, getString("TEXT10"), "doHideAssign");
  userdialog.CheckBox(30, 145, 235, 15, getString("TEXT11"), "chkModelZoom");
  userdialog.TextBox(270, 145, 60, 16, "txtModelZoom");
  userdialog.Text(350, 147, 100, 14, getString("TEXT12"));
  
  userdialog.GroupBox(20, 175, 490, 55, getString("TEXT13"));
  userdialog.CheckBox(30, 190, 110, 15, getString("TEXT13"), "chkUseGrid");
  userdialog.CheckBox(150, 190, 110, 15, getString("TEXT14"), "doGrid");
  userdialog.TextBox(270, 190, 60, 16, "txtGrid");
  userdialog.Text(350, 192, 100, 14, getString("TEXT15"));
  userdialog.CheckBox(270, 207, 220, 15, getString("TEXT16"), "doSpecGrid");
  
  userdialog.GroupBox(20, 235, 490, 90, getString("TEXT18"));
  userdialog.CheckBox(30, 250, 235, 15, getString("TEXT19"), "chkPrintScale");
  userdialog.TextBox(270, 250, 60, 16, "txtPrintScale");
  userdialog.Text(350, 252, 100, 14, getString("TEXT20"));
  userdialog.CheckBox(30, 270, 235, 15, getString("TEXT21"), "chkPageOrient");
  userdialog.OptionGroup("grpPageOrient");
  userdialog.OptionButton(270, 270, 220, 15, getString("TEXT22"));
  userdialog.OptionButton(270, 285, 220, 15, getString("TEXT23"));
  userdialog.CheckBox(30, 302, 235, 15, getString("TEXT24"), "chkBlackWite");
  userdialog.CheckBox(270, 302, 220, 15, getString("TEXT17"), "doBlackWhite");

  userdialog.GroupBox(22, 330, 490, 80, getString("TEXT25"));
  userdialog.CheckBox(30, 345, 235, 15, getString("TEXT26"), "chkNewEdges");
  userdialog.CheckBox(270, 345, 220, 15, getString("TEXT27"), "doNewEdges");
  userdialog.CheckBox(30, 365, 235, 15, getString("TEXT28"), "chkBridgeHeight");
  userdialog.TextBox(270, 365, 60, 16, "txtBridgeHeight");
  userdialog.Text(350, 367, 100, 14, getString("TEXT29"));
  userdialog.CheckBox(30, 385, 235, 15, getString("TEXT30"), "chkRound");
  userdialog.TextBox(270, 385, 60, 16, "txtRound");
  userdialog.Text(350, 387, 100, 14, getString("TEXT29"));

  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_20338f40_7500_11d9_768f_a722316b722b_dlg_01.hlp");

  var dlg = Dialogs.createUserDialog(userdialog); 

  var bentryok = false;   var bvaluesok = false; 
  bentryok = false;

  var nuserchoice = 0; 
  nuserchoice = 0;


  while (! bentryok) {

    // Standardwerte wie in den Parametern enthalten setzen:
    // dlg.<variable fuer feld> = <Wert fuer Feld>

    dlg.setDlgValue("chkUseTemplate", IIf(g_toptions.bchktemplate, 1, 0));
    dlg.setDlgValue("chkBgColor", IIf(g_toptions.bchkbgcolor, 1, 0));
    dlg.setDlgValue("chkTextAttr", IIf(g_toptions.bchktextattr, 1, 0));
    dlg.setDlgValue("chkAssign", IIf(g_toptions.bchkassign, 1, 0));
    dlg.setDlgValue("chkModelZoom", IIf(g_toptions.bchkmodelzoom, 1, 0));
    dlg.setDlgValue("chkUseGrid", IIf(g_toptions.bchkusegrid, 1, 0));
    dlg.setDlgValue("chkPrintScale", IIf(g_toptions.bchkprintscale, 1, 0));
    dlg.setDlgValue("chkPageOrient", IIf(g_toptions.bchkpageorient, 1, 0));
    dlg.setDlgValue("chkBlackWite", IIf(g_toptions.bchkblackwite, 1, 0));
    dlg.setDlgValue("chkNewEdges", IIf(g_toptions.bchknewedges, 1, 0));
    dlg.setDlgValue("chkBridgeHeight", IIf(g_toptions.bchkbridgeheight, 1, 0));
    dlg.setDlgValue("chkRound", IIf(g_toptions.bchkround, 1, 0));
    // ------- Group getString("TEXT2")
    dlg.setDlgText("lstTemplateGUID", nTemplateIndex);
    dlg.setDlgValue("lstColor", ncolorindex);
    dlg.setDlgValue("doShowBackImage", IIf(g_toptions.bdoshowbackimage, 1, 0));
    dlg.setDlgValue("lstTextSymbolSetting", ntextsymbolsettingindex);
    dlg.setDlgValue("doSeparateText", IIf(g_toptions.bdoseparatetext, 1, 0));
    dlg.setDlgValue("doHideAssign", IIf(g_toptions.bdohideassign, 1, 0));
    dlg.setDlgText("txtModelZoom", ""+g_toptions.nmodelzoom);
    // ------- Group getString("TEXT13")
    dlg.setDlgValue("doGrid", IIf(g_toptions.bdogrid, 1, 0));
    dlg.setDlgText("txtGrid", ""+g_toptions.ngrid);
    dlg.setDlgValue("doSpecGrid", IIf(g_toptions.bdospecgrid, 1, 0));
    // ------- Group getString("TEXT18")
    dlg.setDlgText("txtPrintScale", ""+g_toptions.nprintscale);
    dlg.setDlgValue("grpPageOrient", g_toptions.npageorient);
    dlg.setDlgValue("doBlackWhite", IIf(g_toptions.bdoblackwhite, 1, 0));
    // ------- Group getString("TEXT25")
    dlg.setDlgValue("doNewEdges", IIf(g_toptions.bdonewedges, 1, 0));
    dlg.setDlgText("txtBridgeHeight", ""+g_toptions.nbridgeheight);
    dlg.setDlgText("txtRound", ""+g_toptions.nround);
    
    nuserchoice = Dialogs.show( __currentDialog = dlg);        // Dialog anzeigen
    
    // Werte pruefen:
    if (nuserchoice == - 1) {

      bvaluesok = true;

      // WERTE PRUEFEN, JEDEN WERT IN DEN ENTSPRECHENEN PARAMETER SCHREIBEN FALLS ER OK IST
      // UND DANN PRUEFERGEBNIS IN bValuesOK SCHREIBEN:

      g_toptions.bchktemplate = (dlg.getDlgValue("chkUseTemplate") == 1);
      g_toptions.bchkbgcolor = (dlg.getDlgValue("chkBgColor") == 1);
      g_toptions.bchktextattr = (dlg.getDlgValue("chkTextAttr") == 1);
      g_toptions.bchkassign = (dlg.getDlgValue("chkAssign") == 1);
      g_toptions.bchkmodelzoom = (dlg.getDlgValue("chkModelZoom") == 1);
      g_toptions.bchkusegrid = (dlg.getDlgValue("chkUseGrid") == 1);
      g_toptions.bchkprintscale = (dlg.getDlgValue("chkPrintScale") == 1);
      g_toptions.bchkpageorient = (dlg.getDlgValue("chkPageOrient") == 1);
      g_toptions.bchkblackwite = (dlg.getDlgValue("chkBlackWite") == 1);
      g_toptions.bchknewedges = (dlg.getDlgValue("chkNewEdges") == 1);
      g_toptions.bchkbridgeheight = (dlg.getDlgValue("chkBridgeHeight") == 1);
      g_toptions.bchkround = (dlg.getDlgValue("chkRound") == 1);

      g_toptions.stemplateguid = aConfigTemplates[dlg.getDlgValue("lstTemplateGUID")].getGUID();
      g_toptions.bdoshowbackimage = (dlg.getDlgValue("doShowBackImage") == 1);
      g_toptions.bdoseparatetext = (dlg.getDlgValue("doSeparateText") == 1);
      g_toptions.bdohideassign = (dlg.getDlgValue("doHideAssign") == 1);
      g_toptions.bdogrid = (dlg.getDlgValue("doGrid") == 1);
      g_toptions.bdospecgrid = (dlg.getDlgValue("doSpecGrid") == 1);
      g_toptions.npageorient = dlg.getDlgValue("grpPageOrient");
      g_toptions.bdoblackwhite = (dlg.getDlgValue("doBlackWhite") == 1);
      g_toptions.bdonewedges = (dlg.getDlgValue("doNewEdges") == 1);

      if ((g_toptions.bchkmodelzoom && (dlg.getDlgText("txtModelZoom") != ""))) {
        var holder_nmodelzoom = new __holder(g_toptions.nmodelzoom);          
        bvaluesok = rangecheck(10, 400, dlg.getDlgText("txtModelZoom"), holder_nmodelzoom) && bvaluesok;
        g_toptions.nmodelzoom = holder_nmodelzoom.value;
      }


      if ((g_toptions.bchkusegrid && (dlg.getDlgText("txtGrid") != ""))) {
        var holder_ngrid = new __holder(g_toptions.ngrid);   
        bvaluesok = rangecheck(2, 100, dlg.getDlgText("txtGrid"), holder_ngrid) && bvaluesok;
        g_toptions.ngrid = holder_ngrid.value;
      }


      if ((g_toptions.bchkprintscale && (dlg.getDlgText("txtPrintScale") != ""))) {
        var holder_nprintscale = new __holder(g_toptions.nprintscale);  
        bvaluesok = rangecheck(10, 1000, dlg.getDlgText("txtPrintScale"), holder_nprintscale) && bvaluesok;
        g_toptions.nprintscale = holder_nprintscale.value;
      }


      if ((g_toptions.bchkbridgeheight && (dlg.getDlgText("txtBridgeHeight") != ""))) {
        var holder_nbridgeheight = new __holder(g_toptions.nbridgeheight);    
        bvaluesok = rangecheck(0, 100, dlg.getDlgText("txtBridgeHeight"), holder_nbridgeheight) && bvaluesok;
        g_toptions.nbridgeheight = holder_nbridgeheight.value;
      }


      if ((g_toptions.bchkround && (dlg.getDlgText("txtRound") != ""))) {
        var holder_nround = new __holder(g_toptions.nround);  
        bvaluesok = rangecheck(0, 100, dlg.getDlgText("txtRound"), holder_nround) && bvaluesok;
        g_toptions.nround = holder_nround.value;
      }


      ncolorindex = dlg.getDlgValue("lstColor");
      if (ncolorindex != - 1) {
      // something selected
        g_toptions.nbgcolor = sbackcolors[ncolorindex].nvalue;
      }


      ntextsymbolsettingindex = dlg.getDlgValue("lstTextSymbolSetting");
      if (ntextsymbolsettingindex != - 1) {
      // something selected
        g_toptions.ntextsymbolsetting = textsymbolattrsettings[ntextsymbolsettingindex].nvalue;
      }


      // Pruefung nur bei OK
      if (bvaluesok) {
        bentryok = true;                          // raus aus der While-Schleife
      }
      else {
        Dialogs.MsgBox(getString("TEXT53"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, getString("TEXT33"));          
        bentryok = false;                         // Dialog nochmal anzeigen
      }
    }
    else {
      bentryok = true;                            // raus aus der While-Schleife
    }
  }
  __functionResult = nuserchoice;                         // Ergebnis des Dialogs liefern

  return __functionResult;
}

// Dialogfunktion
function dlgfuncmodelsettings(dlgitem, action, suppvalue)
{
  var __functionResult = false;

  switch(action) {
    case 1:
      __functionResult = false;

      if (      __currentDialog.getDlgValue("chkUseTemplate") == 0) {
                __currentDialog.setDlgEnable("lstTemplateGUID", false);
      }
      else {
                __currentDialog.setDlgEnable("lstTemplateGUID", true);
      }


      if (      __currentDialog.getDlgValue("chkBgColor") == 0) {
                __currentDialog.setDlgEnable("lstColor", false);
                __currentDialog.setDlgEnable("doShowBackImage", false);
      }
      else {
                __currentDialog.setDlgEnable("lstColor", true);
                __currentDialog.setDlgEnable("doShowBackImage", true);
      }


      if (      __currentDialog.getDlgValue("chkTextAttr") == 0) {
                __currentDialog.setDlgEnable("lstTextSymbolSetting", false);
                __currentDialog.setDlgEnable("doSeparateText", false);
      }
      else {
                __currentDialog.setDlgEnable("lstTextSymbolSetting", true);
                __currentDialog.setDlgEnable("doSeparateText", true);
      }


      if (      __currentDialog.getDlgValue("chkAssign") == 0) {
                __currentDialog.setDlgEnable("doHideAssign", false);
      }
      else {
                __currentDialog.setDlgEnable("doHideAssign", true);
      }


      if (      __currentDialog.getDlgValue("chkModelZoom") == 0) {
                __currentDialog.setDlgEnable("txtModelZoom", false);
      }
      else {
                __currentDialog.setDlgEnable("txtModelZoom", true);
      }


      if (      __currentDialog.getDlgValue("chkUseGrid") == 0) {
                __currentDialog.setDlgEnable("doGrid", false);
                __currentDialog.setDlgEnable("txtGrid", false);
                __currentDialog.setDlgEnable("doSpecGrid", false);
      }
      else {
                __currentDialog.setDlgEnable("doGrid", true);
                __currentDialog.setDlgEnable("txtGrid", true);
                __currentDialog.setDlgEnable("doSpecGrid", true);
      }


      if (      __currentDialog.getDlgValue("chkPrintScale") == 0) {
                __currentDialog.setDlgEnable("txtPrintScale", false);
      }
      else {
                __currentDialog.setDlgEnable("txtPrintScale", true);
      }


      if (      __currentDialog.getDlgValue("chkPageOrient") == 0) {
                __currentDialog.setDlgEnable("grpPageOrient", false);
      }
      else {
                __currentDialog.setDlgEnable("grpPageOrient", true);
      }


      if (      __currentDialog.getDlgValue("chkBlackWite") == 0) {
                __currentDialog.setDlgEnable("doBlackWhite", false);
      }
      else {
                __currentDialog.setDlgEnable("doBlackWhite", true);
      }


      if (      __currentDialog.getDlgValue("chkNewEdges") == 0) {
                __currentDialog.setDlgEnable("doNewEdges", false);
      }
      else {
                __currentDialog.setDlgEnable("doNewEdges", true);
      }


      if (      __currentDialog.getDlgValue("chkBridgeHeight") == 0) {
                __currentDialog.setDlgEnable("txtBridgeHeight", false);
      }
      else {
                __currentDialog.setDlgEnable("txtBridgeHeight", true);
      }


      if (      __currentDialog.getDlgValue("chkRound") == 0) {
                __currentDialog.setDlgEnable("txtRound", false);
      }
      else {
                __currentDialog.setDlgEnable("txtRound", true);
      }


    break;
    case 2:
      __functionResult = false;

      switch(dlgitem) {
        case "chkUseTemplate":
          if (          __currentDialog.getDlgValue("chkUseTemplate") == 0) {
                        __currentDialog.setDlgEnable("lstTemplateGUID", false);
          }
          else {
                        __currentDialog.setDlgEnable("lstTemplateGUID", true);
          }

          __functionResult = true;

        break;
        case "chkBgColor":
          if (          __currentDialog.getDlgValue("chkBgColor") == 0) {
                        __currentDialog.setDlgEnable("lstColor", false);
                        __currentDialog.setDlgEnable("doShowBackImage", false);
          }
          else {
                        __currentDialog.setDlgEnable("lstColor", true);
                        __currentDialog.setDlgEnable("doShowBackImage", true);
          }

          __functionResult = true;

        break;
        case "chkTextAttr":
          if (          __currentDialog.getDlgValue("chkTextAttr") == 0) {
                        __currentDialog.setDlgEnable("lstTextSymbolSetting", false);
                        __currentDialog.setDlgEnable("doSeparateText", false);
          }
          else {
                        __currentDialog.setDlgEnable("lstTextSymbolSetting", true);
                        __currentDialog.setDlgEnable("doSeparateText", true);
          }

          __functionResult = true;

        break;
        case "chkAssign":
          if (          __currentDialog.getDlgValue("chkAssign") == 0) {
                        __currentDialog.setDlgEnable("doHideAssign", false);
          }
          else {
                        __currentDialog.setDlgEnable("doHideAssign", true);
          }

          __functionResult = true;

        break;
        case "chkModelZoom":
          if (          __currentDialog.getDlgValue("chkModelZoom") == 0) {
                        __currentDialog.setDlgEnable("txtModelZoom", false);
          }
          else {
                        __currentDialog.setDlgEnable("txtModelZoom", true);
          }

          __functionResult = true;

        break;
        case "chkUseGrid":
          if (          __currentDialog.getDlgValue("chkUseGrid") == 0) {
                        __currentDialog.setDlgEnable("doGrid", false);
                        __currentDialog.setDlgEnable("txtGrid", false);
                        __currentDialog.setDlgEnable("doSpecGrid", false);
          }
          else {
                        __currentDialog.setDlgEnable("doGrid", true);
                        __currentDialog.setDlgEnable("txtGrid", true);
                        __currentDialog.setDlgEnable("doSpecGrid", true);
          }

          __functionResult = true;

        break;
        case "chkPrintScale":
          if (          __currentDialog.getDlgValue("chkPrintScale") == 0) {
                        __currentDialog.setDlgEnable("txtPrintScale", false);
          }
          else {
                        __currentDialog.setDlgEnable("txtPrintScale", true);
          }

          __functionResult = true;

        break;
        case "chkPageOrient":
          if (          __currentDialog.getDlgValue("chkPageOrient") == 0) {
                        __currentDialog.setDlgEnable("grpPageOrient", false);
          }
          else {
                        __currentDialog.setDlgEnable("grpPageOrient", true);
          }

          __functionResult = true;

        break;
        case "chkBlackWite":
          if (          __currentDialog.getDlgValue("chkBlackWite") == 0) {
                        __currentDialog.setDlgEnable("doBlackWhite", false);
          }
          else {
                        __currentDialog.setDlgEnable("doBlackWhite", true);
          }

          __functionResult = true;

        break;
        case "chkNewEdges":
          if (          __currentDialog.getDlgValue("chkNewEdges") == 0) {
                        __currentDialog.setDlgEnable("doNewEdges", false);
          }
          else {
                        __currentDialog.setDlgEnable("doNewEdges", true);
          }

          __functionResult = true;

        break;
        case "chkBridgeHeight":
          if (          __currentDialog.getDlgValue("chkBridgeHeight") == 0) {
                        __currentDialog.setDlgEnable("txtBridgeHeight", false);
          }
          else {
                        __currentDialog.setDlgEnable("txtBridgeHeight", true);
          }

          __functionResult = true;

        break;
        case "chkRound":
          if (          __currentDialog.getDlgValue("chkRound") == 0) {
                        __currentDialog.setDlgEnable("txtRound", false);
          }
          else {
                        __currentDialog.setDlgEnable("txtRound", true);
          }

          __functionResult = true;

        break;
        case "doSpecGrid":
          if (__currentDialog.getDlgValue("chkUseGrid") != 0 && __currentDialog.getDlgValue("doSpecGrid") != 0) {

            var holder_ngrid = new __holder(g_toptions.ngrid);
            if (! (rangecheck(30, 100, __currentDialog.getDlgText("txtGrid"), holder_ngrid))) {
                __currentDialog.setDlgText("txtGrid", "30");
            }
          }
          __functionResult = true;

        break;        
      }

    break;
  }


  return __functionResult;
}


function rangecheck(nlowlimit, nupperlimit, svalue, nvalue)
{
  var __functionResult = false;

  var nresult = 0; 

  if (isNaN(svalue)) {
    __functionResult = false;
    return __functionResult;
  }


  nresult = parseInt(svalue);
  if (nresult >= nlowlimit && nresult <= nupperlimit) {
    nvalue.value = nresult;
    __functionResult = true;
  }
  else {
    __functionResult = false;
  }


  return __functionResult;
}



function initoptions(omodels)
{

  var omodel = null; 
  var nflags = 0; 

  // *** Allgemeines ***
  g_toptions.bchktemplate = false;
  g_toptions.bchkbgcolor = false;
  g_toptions.bchktextattr = false;
  g_toptions.bchkassign = false;
  g_toptions.bchkmodelzoom = false;
  // *** Raster ***
  g_toptions.bchkusegrid = false;
  // *** Druckoptionen
  g_toptions.bchkprintscale = false;
  g_toptions.bchkpageorient = false;
  g_toptions.bchkblackwite = false;
  // *** Kantendarstellung ***
  g_toptions.bchknewedges = false;
  g_toptions.bchkbridgeheight = false;
  g_toptions.bchkround = false;

  // *** Allgemeines ***
  g_toptions.stemplateguid = "";
  // Template-GUID
  g_toptions.nbgcolor = Constants.C_WHITE;
  // Hintergrundfarbe
  g_toptions.bdoshowbackimage = false;
  // Hintergrundbild anzeigen
  g_toptions.ntextsymbolsetting = 2;
  // Textattribute im Symbol
  g_toptions.bdoseparatetext = false;
  // Texte freistellen
  g_toptions.bdohideassign = false;
  // Hinterlegungssymbole ausblenden
  g_toptions.nmodelzoom = 10;
  // Zoomfaktor (10-400)
  // *** Raster ***
  g_toptions.bdogrid = false;
  // Raster benutzen
  g_toptions.ngrid = 5;
  // Rasterweite (2-100)
  g_toptions.bdospecgrid = false;
  // Spezieller Rastermodus
  // *** Druckoptionen
  g_toptions.nprintscale = 100;
  // Druckskalierung (10-1000)
  g_toptions.npageorient = 0;
  // Seitenorientierung (Hochformat/Querformat)
  g_toptions.bdoblackwhite = false;
  // Schwarzweiß-Druck
  // *** Kantendarstellung ***
  g_toptions.bdonewedges = true;
  // Neue Kanten nur rechtwinklig
  g_toptions.nbridgeheight = 0;
  // Brückenhöhe (0-100)
  g_toptions.nround = 0;
  // Rundung (0-100)


  if (omodels.length == 1) {
    omodel = omodels[0];

    nflags = omodel.Flags();

    // *** Allgemeines ***
    // --- Template ---
    g_toptions.stemplateguid = "" + omodel.getTemplate();
//    g_toptions.bchktemplate = (g_toptions.stemplateguid.length > 0);

    // --- Hintergrundfarbe, -bild ---
    g_toptions.nbgcolor = omodel.getBgColor();
    g_toptions.bdoshowbackimage = (nflags & Constants.MODEL_FILLBYLOGO) != 0;

    // --- Textattribute im Symbol ---
    g_toptions.ntextsymbolsetting = omodel.getAttrOccHandling();
    g_toptions.bdoseparatetext = (nflags & Constants.MODEL_TEXTOPAQUE) != 0;

    // --- Hinterlegungssymbole ausblenden ---
    g_toptions.bdohideassign = (nflags & Constants.MODEL_HSYMBOL_OFF) != 0;

    // --- Darstellungsfaktor ---
    g_toptions.nmodelzoom = omodel.Zoom();

    // *** Raster ***
    // --- Rasterweite setzen ---
    g_toptions.bdogrid = (nflags & Constants.MODEL_USE_GRID) != 0;
    g_toptions.ngrid = omodel.getGrid();
    // --- Spezieller Rastermodus ---
    g_toptions.bdospecgrid = (nflags & Constants.MODEL_SPECIAL_GRID_MODE) != 0;

    // *** Druckoptionen ***
    // --- Druckskalierung ---
    g_toptions.nprintscale = omodel.getPrintScale();

    // --- Seitenorientierung ---
    g_toptions.npageorient = IIf(((nflags & Constants.MODEL_PRINT_LANDSCAPE) != 0), 1, 0);

    // --- Schwarzweiß-Druck ---
    g_toptions.bdoblackwhite = (nflags & Constants.MODEL_BLACKWHITE) != 0;

    // *** Kantendarstellung ***
    // --- Neue Kanten nur rechtwinklig ---
    g_toptions.bdonewedges = (nflags & Constants.MODEL_DIAGONAL_OCCS) != 0;

    // --- Brückenhöhe ---
    g_toptions.nbridgeheight = omodel.getBridgeHeight();
    // g_tOptions.bChkBridgeHeight = g_tOptions.nBridgeHeight > 0

    // --- Rundung ---
    g_toptions.nround = omodel.getRounding();
    // g_tOptions.bChkRound = g_tOptions.nRound > 0

  }
  else {
        Dialogs.MsgBox(((getString("TEXT31") + "\r\n") + getString("TEXT32")), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_INFORMATION, getString("TEXT33"));
  }


}




function setselectedflags(omodel)
{
  var nflags = omodel.Flags();
  
  if ((g_toptions.bchkbgcolor)) {
    if ((g_toptions.bdoshowbackimage)) {
      nflags = nflags | Constants.MODEL_FILLBYLOGO;
    }
    else {
      nflags = nflags & ~Constants.MODEL_FILLBYLOGO;
    }

  }


  if ((g_toptions.bchktextattr)) {
    if ((g_toptions.bdoseparatetext)) {
      nflags = nflags | Constants.MODEL_TEXTOPAQUE;
    }
    else {
      nflags = nflags & ~Constants.MODEL_TEXTOPAQUE;
    }

  }


  if ((g_toptions.bchkassign)) {
    if ((g_toptions.bdohideassign)) {
      nflags = nflags | Constants.MODEL_HSYMBOL_OFF;
    }
    else {
      nflags = nflags & ~Constants.MODEL_HSYMBOL_OFF;
    }

  }


  if ((g_toptions.bchkusegrid)) {
    if ((g_toptions.bdogrid)) {
      nflags = nflags | Constants.MODEL_USE_GRID;
    }
    else {
      nflags = nflags & ~Constants.MODEL_USE_GRID;
    }
    
    if ((g_toptions.bdospecgrid)) {
      nflags = nflags | Constants.MODEL_SPECIAL_GRID_MODE;
    }
    else {
      nflags = nflags & ~Constants.MODEL_SPECIAL_GRID_MODE;
    }
  }


  if ((g_toptions.bchkpageorient)) {
    if ((g_toptions.npageorient == 0)) {
      nflags = nflags & ~Constants.MODEL_PRINT_LANDSCAPE;
    }
    else {
      nflags = nflags | Constants.MODEL_PRINT_LANDSCAPE;
    }

  }


  if ((g_toptions.bchkblackwite)) {
    if ((g_toptions.bdoblackwhite)) {
      nflags = nflags | Constants.MODEL_BLACKWHITE;
    }
    else {
      nflags = nflags & ~Constants.MODEL_BLACKWHITE;
    }

  }


  if ((g_toptions.bchknewedges)) {
    if ((g_toptions.bdonewedges)) {
      nflags = nflags | Constants.MODEL_DIAGONAL_OCCS;
    }
    else {
      nflags = nflags & ~Constants.MODEL_DIAGONAL_OCCS;
    }

  }

  omodel.SetFlags(nflags);
}

function getcolors() {
    var sbackcolors = new Array(); 
    sbackcolors[0]  = new __usertype_tnamevaluetype(Constants.C_BLACK, getString("TEXT34"));
    sbackcolors[1]  = new __usertype_tnamevaluetype(Constants.C_BLUE, getString("TEXT35"));
    sbackcolors[2]  = new __usertype_tnamevaluetype(Constants.C_GREEN, getString("TEXT36"));
    sbackcolors[3]  = new __usertype_tnamevaluetype(Constants.C_RED, getString("TEXT37"));
    sbackcolors[4]  = new __usertype_tnamevaluetype(Constants.C_CYAN, getString("TEXT38"));
    sbackcolors[5]  = new __usertype_tnamevaluetype(Constants.C_MAGENTA, getString("TEXT39"));
    sbackcolors[6]  = new __usertype_tnamevaluetype(Constants.C_YELLOW, getString("TEXT40"));
    sbackcolors[7]  = new __usertype_tnamevaluetype(Constants.C_WHITE, getString("TEXT41"));
    sbackcolors[8]  = new __usertype_tnamevaluetype(Constants.C_DARKBLUE, getString("TEXT42"));
    sbackcolors[9]  = new __usertype_tnamevaluetype(Constants.C_DARKGREEN, getString("TEXT43"));
    sbackcolors[10] = new __usertype_tnamevaluetype(Constants.C_DARKRED, getString("TEXT44"));
    sbackcolors[11] = new __usertype_tnamevaluetype(Constants.C_BLUEGREEN, getString("TEXT45"));
    sbackcolors[12] = new __usertype_tnamevaluetype(Constants.C_PURPLE, getString("TEXT46"));
    sbackcolors[13] = new __usertype_tnamevaluetype(Constants.C_OLIVE, getString("TEXT47"));
    sbackcolors[14] = new __usertype_tnamevaluetype(Constants.C_GRAY, getString("TEXT48"));
    return sbackcolors;
}

function getattributesettings() {
    var textsymbolattrsettings = new Array();
    textsymbolattrsettings[0] = new __usertype_tnamevaluetype(Constants.ATTROCCHANDLING_OVERLAP, getString("TEXT49"));
    textsymbolattrsettings[1] = new __usertype_tnamevaluetype(Constants.ATTROCCHANDLING_RESIZESYM, getString("TEXT50"));
    textsymbolattrsettings[2] = new __usertype_tnamevaluetype(Constants.ATTROCCHANDLING_BREAKATTR, getString("TEXT51"));
    textsymbolattrsettings[3] = new __usertype_tnamevaluetype(Constants.ATTROCCHANDLING_SHORTENATTR, getString("TEXT52"));
    return textsymbolattrsettings;
}

function IIf(bExpr, expr1, expr2) {
    return bExpr ? expr1 : expr2;
}


main();












