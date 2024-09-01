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

// Output information about IT objects


var g_cxntypesiselemensupported = [Constants.CT_CAN_SUPP_1]; 
var g_cxntypesdataadmin = [Constants.CT_IS_OWN]; 
var g_cxntypesdataused = [Constants.CT_CAN_SUPP_1]; 
var g_cxntypesdataused2 = [Constants.CT_IS_INP_FOR, Constants.CT_PROV_INP_FOR]; 
var g_cxntypesdatacreated = [Constants.CT_CAN_SUPP_1]; 
var g_cxntypesdatacreated2 = [Constants.CT_CRT_OUT_TO, Constants.CT_HAS_OUT]; 
var g_cxntypesfuncsupported = [Constants.CT_CAN_SUPP_1, Constants.CT_SUPP_3]; 
var g_cxntypeshardware = [Constants.CT_CAN_RUN_ON, Constants.CT_CAN_BE_PLTFRM_OF]; 

var g_objtypesiselemensupported = [Constants.OT_IS_FUNC, Constants.OT_FUNC_CLUSTER, Constants.OT_IS_SERVICE]; 

var g_objtypesdataused = [Constants.OT_IS_FUNC, Constants.OT_FUNC_CLUSTER, Constants.OT_IS_SERVICE]; 
var g_objtypesdataused2 = [Constants.OT_CLST, Constants.OT_ENT_TYPE, Constants.OT_RELSHP_TYPE, Constants.OT_ERM_ATTR, Constants.OT_TECH_TRM]; 

var g_objtypesdatacreated = [Constants.OT_IS_FUNC, Constants.OT_FUNC_CLUSTER, Constants.OT_IS_SERVICE]; 
var g_objtypesdatacreated2 = [Constants.OT_CLST, Constants.OT_ENT_TYPE, Constants.OT_RELSHP_TYPE, Constants.OT_ERM_ATTR, Constants.OT_TECH_TRM]; 

var g_emptylonglist = new Array(); 



var g_ooutfile = null; 
var g_nloc = Context.getSelectedLanguage(); 
var bCxnColored = false;

// this is the main subroutine.
// called, when the script is being executed
function main()
{
  var nuserchoice = 0; 

  // Variablen fuer Einstellungen
  var biselemsupported = new __holder(false); 
  var bdataadmin = new __holder(false); 
  var bdataused = new __holder(false); 
  var bdatacreated = new __holder(false); 
  var bfuncsupported = new __holder(false); 
  var bhardware = new __holder(false); 
  var bpath = new __holder(false); 
  var oselectedobjdefs = null; 

  nuserchoice = showitcityplanningdialog(biselemsupported, bdataadmin, bdataused, bdatacreated, bfuncsupported, bhardware, bpath);

  if (nuserchoice == - 1) {
    g_ooutfile = Context.createOutputObject();
    g_ooutfile.Init(g_nloc);
    
    oselectedobjdefs = ArisData.getSelectedObjDefs();
    oselectedobjdefs = ArisData.sort(oselectedobjdefs, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);

    outreportheaderfooter(oselectedobjdefs);
    if (biselemsupported.value) {
      doischeck_iselemensupported(oselectedobjdefs, bpath.value);
    }

    if (bdataadmin.value) {
      doischeck_dataadmin(oselectedobjdefs, bpath.value);
    }

    if (bdataused.value) {
      doischeck_dataused(oselectedobjdefs, bpath.value);
    }

    if (bdatacreated.value) {
      doischeck_datacreated(oselectedobjdefs, bpath.value);
    }

    if (bfuncsupported.value) {
      doischeck_funcsupported(oselectedobjdefs, bpath.value);
    }

    if (bhardware.value) {
      doischeck_hardware(oselectedobjdefs, bpath.value);
    }

    // Output
    g_ooutfile.WriteReport();
    oselectedobjdefs = null;
  }
  else {
    Context.setScriptError(Constants.ERR_CANCEL);
  }
}


function doischeck_iselemensupported(oobjdefs, bpath)
{
  var oobjdefstoshow = new __holder(null);   
  oobjdefstoshow.value = new Array();
  startTable( getString("TEXT1"), bpath)

  for (var i = 0 ; i < oobjdefs.length ; i++ ){
    var oobjdef = oobjdefs[i];

    switch(oobjdef.TypeNum()) {
      case Constants.OT_SOCKET:
      case Constants.OT_APPL_SYS_TYPE:
      case Constants.OT_DP_FUNC_TYPE:
        getobjectsconnectedbytypes(oobjdef, oobjdefstoshow, g_cxntypesiselemensupported, g_objtypesiselemensupported, g_emptylonglist, g_emptylonglist);
      break;
    }
  }
  printobjects(oobjdefstoshow.value, bpath);
}




function doischeck_dataadmin(oobjdefs, bpath)
{
  var oobjdefstoshow = new __holder(null);   
  oobjdefstoshow.value = new Array();
  startTable( getString("TEXT2"), bpath)

  for (var i = 0 ; i < oobjdefs.length ; i++ ){
    var oobjdef = oobjdefs[i];

    switch(oobjdef.TypeNum()) {
      case Constants.OT_SOCKET:
      case Constants.OT_APPL_SYS_TYPE:
      case Constants.OT_DP_FUNC_TYPE:
        getobjectsconnectedbytypes(oobjdef, oobjdefstoshow, g_cxntypesdataadmin, g_emptylonglist, g_emptylonglist, g_emptylonglist);
      break;
    }
  }
  printobjects(oobjdefstoshow.value, bpath);
}


function doischeck_dataused(oobjdefs, bpath)
{
  var oobjdefstoshow = new __holder(null);   
  oobjdefstoshow.value = new Array();
  startTable( getString("TEXT3"), bpath)

  for(var i = 0 ; i < oobjdefs.length ; i++ ){
    var oobjdef = oobjdefs[i];

    switch(oobjdef.TypeNum()) {
      case Constants.OT_SOCKET:
      case Constants.OT_APPL_SYS_TYPE:
      case Constants.OT_DP_FUNC_TYPE:
        getobjectsconnectedbytypes(oobjdef, oobjdefstoshow, g_cxntypesdataused, g_objtypesdataused, g_cxntypesdataused2, g_objtypesdataused2);
      break;
    }
  }
  printobjects(oobjdefstoshow.value, bpath);
}




function doischeck_datacreated(oobjdefs, bpath)
{
  var oobjdefstoshow = new __holder(null);   
  oobjdefstoshow.value = new Array();
  startTable( getString("TEXT4"), bpath)

  for (var i = 0 ; i < (oobjdefs.length - 1)+1 ; i++ )
  {
    var oobjdef = oobjdefs[i];
    switch(oobjdef.TypeNum()) {
      case Constants.OT_SOCKET:
      case Constants.OT_APPL_SYS_TYPE:
      case Constants.OT_DP_FUNC_TYPE:
        getobjectsconnectedbytypes(oobjdef, oobjdefstoshow, g_cxntypesdatacreated, g_objtypesdatacreated, g_cxntypesdatacreated2, g_objtypesdatacreated2);
      break;
    }
  }
  printobjects(oobjdefstoshow.value, bpath);
}




function doischeck_funcsupported(oobjdefs, bpath)
{
  var oobjdefstoshow = new __holder(null);   
  oobjdefstoshow.value = new Array();
  startTable( getString("TEXT5"), bpath)

  for (var i = 0 ; i < oobjdefs.length ; i++ ){
    var oobjdef = oobjdefs[i];

    switch(oobjdef.TypeNum()) {
      case Constants.OT_SOCKET:
      case Constants.OT_APPL_SYS_TYPE:
      case Constants.OT_DP_FUNC_TYPE:
        getobjectsconnectedbytypes(oobjdef, oobjdefstoshow, g_cxntypesfuncsupported, g_emptylonglist, g_emptylonglist, g_emptylonglist);
      break;
    }
  }
  printobjects(oobjdefstoshow.value, bpath);
}


function doischeck_hardware(oobjdefs, bpath)
{
  var oobjdefstoshow = new __holder(null);   
  oobjdefstoshow.value = new Array();
  startTable( getString("TEXT6"), bpath)

  for (var i = 0 ; i < oobjdefs.length ; i++ )
  {
    var oobjdef = oobjdefs[i];
    switch(oobjdef.TypeNum()) {
      case Constants.OT_APPL_SYS_TYPE:
        getobjectsconnectedbytypes(oobjdef, oobjdefstoshow, g_cxntypeshardware, g_emptylonglist, g_emptylonglist, g_emptylonglist);
      break;
    }
  }
  printobjects(oobjdefstoshow.value, bpath);
}




function getobjectsconnectedbytypes(oobjdef, oobjdefs, ncxntypes, nobjtypes, ncxntypes2, nobjtypes2)
{
  var ocxns = oobjdef.CxnList();
  for (var i = 0 ; i < ocxns.length ; i++ )
  {
    var ocxn = ocxns[i];
    for (var j = 0 ; j < ncxntypes.length ; j++ )
    {
      if (ncxntypes[j] == ocxn.TypeNum()) 
      {
        var opartnerobjdef = ocxn.SourceObjDef();
        if (opartnerobjdef.IsEqual(oobjdef)) {
          opartnerobjdef = ocxn.TargetObjDef();
        }

        if (nobjtypes.length == 0) 
        {
          addtoobjdeflist(oobjdefs, opartnerobjdef);
        }
        else 
        {
          for (var k = 0 ; k < nobjtypes.length; k++ )
          {
            if (nobjtypes[k] == opartnerobjdef.TypeNum()) 
            {
              if (ncxntypes2.length == 0) {
                addtoobjdeflist(oobjdefs, opartnerobjdef);
              }
              else {
                var oobjdef2 = opartnerobjdef;
                var ocxns2 = oobjdef2.CxnList();
                for (var l = 0 ; l < ocxns2.length ; l++ )
                {
                  var ocxn2 = ocxns2[l];
                  for (var m = 0 ; m < ncxntypes2.length; m++ )
                  {
                    if (ncxntypes2[m] == ocxn2.TypeNum()) 
                    {
                      var opartnerobjdef2 = ocxn2.SourceObjDef();
                      if (opartnerobjdef2.IsEqual(oobjdef2)) {
                        opartnerobjdef2 = ocxn2.TargetObjDef();
                      }

                      if (nobjtypes2.length == 0) {
                        addtoobjdeflist(oobjdefs, opartnerobjdef2);
                      }
                      else {
                        for (var n = 0 ; n < nobjtypes2.length ; n++ )
                        {
                          if (nobjtypes2[n] == opartnerobjdef2.TypeNum()) 
                          {
                            addtoobjdeflist(oobjdefs, opartnerobjdef2);
                          }
                         break;
                        }
                      }
                      break;
                    }
                  }
                }
              }
              break;
            }
          }
        }
        break;
      }
    }
  }

  oobjdefs.value = ArisData.sort(oobjdefs.value, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);

  return oobjdefs.value;
}



function addtoobjdeflist(oobjdeflist, oobjdef)
{
  for (var i = 0 ; i < oobjdeflist.value.length ; i++ )
  {
    var oobjdeftocompare = oobjdeflist.value[i];
    if (oobjdeftocompare.IsEqual(oobjdef)) {
      return;
    }
  }

  oobjdeflist.value.push( oobjdef );
}

function startTable(p_sHeading, bpath)
{
    g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(p_sHeading, 100, getString("TEXT8"), 10, getTableCellColor_Font(true), bpath?getTableCellColor_Head():getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    if(bpath)
    {
        g_ooutfile.TableRow();
        g_ooutfile.TableCell("", 40, getString("TEXT8"), 10, getTableCellColor_Font(true), getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        g_ooutfile.TableCell(getString("TEXT31"), 60, getString("TEXT8"), 10, getTableCellColor_Font(true), getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }

    bCxnColored = false; //reset
}

function printobjects(oobjdefs, bpath)
{
    for (var i = 0 ; i < oobjdefs.length ; i++ )
    {
        g_ooutfile.TableRow();
        g_ooutfile.TableCell(oobjdefs[i].Name(g_nloc), bpath?40:100, getString("TEXT8"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bCxnColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        if (bpath) {
            g_ooutfile.TableCell(oobjdefs[i].Group().Path(g_nloc), 60, getString("TEXT8"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bCxnColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        }
        bCxnColored = !bCxnColored;
    }
    g_ooutfile.EndTable("", 100, getString("TEXT8"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT , 0);
    g_ooutfile.OutputLnF("", "REPORT2");    
}

function outreportheaderfooter(oobjdefs)
{
  if ((Context.getSelectedFormat() != Constants.OutputXLS) && (Context.getSelectedFormat() != Constants.OutputXLSX)) {

    g_ooutfile.DefineF("REPORT1", getString("TEXT8"), 24, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
    g_ooutfile.DefineF("REPORT2", getString("TEXT8"), 14, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

    setReportHeaderFooter(g_ooutfile, g_nloc, false, true, true);

    
    g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(getString("TEXT14"), 100, getString("TEXT8"), 10, getTableCellColor_Font(true), getTableCellColor_Head(), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

    bCxnColored = false; //reset
    var nlasttype = 0;

    for (var i = 0 ; i < oobjdefs.length ; i++ )
    {
      g_ooutfile.TableRow();

      var oobjdef = oobjdefs[i];
      if (oobjdef.TypeNum() != nlasttype) 
      {
        g_ooutfile.TableCell("", 100, getString("TEXT8"), 10, getTableCellColor_Font(true), getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);        
        g_ooutfile.Output(getString("TEXT15"), getString("TEXT8"), 10, getTableCellColor_Font(true), getTableCellColor_Bk(true), Constants.FMT_LEFT, 10);
        g_ooutfile.Output(" " + oobjdef.Type() + ":", getString("TEXT8"), 10, getTableCellColor_Font(true), getTableCellColor_Bk(true), Constants.FMT_BOLD | Constants.FMT_LEFT, 10);
        nlasttype = oobjdef.TypeNum();
        g_ooutfile.TableRow();
      }
      g_ooutfile.TableCell("- " + oobjdef.Name(g_nloc), 100, getString("TEXT8"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bCxnColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 5);        
      bCxnColored = !bCxnColored;
    }
    g_ooutfile.EndTable("", 100, getString("TEXT8"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT , 0);
    g_ooutfile.OutputLnF("", "REPORT2");
  }

}





// --------------------------------
// Dialogseite anzeigen
function showitcityplanningdialog(biselemsupported, bdataadmin, bdataused, bdatacreated, bfuncsupported, bhardware, bpath)
{
  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 600, 224, getString("TEXT21"));
  // %GRID:10,7,1,1
  userdialog.GroupBox(20, 7, 560, 161, getString("TEXT22"));
  userdialog.CheckBox(32, 46, 440, 15, getString("TEXT23"), "chkISElemSupported");
  userdialog.CheckBox(32, 66, 440, 15, getString("TEXT24"), "chkDataAdmin");
  userdialog.CheckBox(32, 86, 520, 15, getString("TEXT25"), "chkDataUsed");
  userdialog.CheckBox(32, 106, 500, 15, getString("TEXT26"), "chkDataCreated");
  userdialog.CheckBox(32, 126, 460, 15, getString("TEXT27"), "chkFuncSupported");
  userdialog.CheckBox(32, 146, 430, 15, getString("TEXT28"), "chkHardware");
  userdialog.CheckBox(30, 176, 470, 15, getString("TEXT29"), "chkPath");
  userdialog.Text(32, 26, 410, 15, getString("TEXT30"));
  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_f3e84bb0_74ff_11d9_768f_a722316b722b_dlg_01.hlp");

  var dlg = Dialogs.createUserDialog(userdialog); 

  // Read dialog settings from config
  var sSection = "SCRIPT_f3e84bb0_74ff_11d9_768f_a722316b722b";  
  ReadSettingsDlgValue(dlg, sSection, "chkISElemSupported", 0);
  ReadSettingsDlgValue(dlg, sSection, "chkDataAdmin", 0);
  ReadSettingsDlgValue(dlg, sSection, "chkDataUsed", 0);
  ReadSettingsDlgValue(dlg, sSection, "chkDataCreated", 0);
  ReadSettingsDlgValue(dlg, sSection, "chkFuncSupported", 0);
  ReadSettingsDlgValue(dlg, sSection, "chkHardware", 0);  
  ReadSettingsDlgValue(dlg, sSection, "chkPath", 0);  
  
  var bentryok = false; 
  var nuserchoice = 0; 

  nuserchoice = Dialogs.show( __currentDialog = dlg);
  // Dialog anzeigen

  if (nuserchoice != 0) {
      // Write dialog settings to config      
      WriteSettingsDlgValue(dlg, sSection, "chkISElemSupported");
      WriteSettingsDlgValue(dlg, sSection, "chkDataAdmin");
      WriteSettingsDlgValue(dlg, sSection, "chkDataUsed");
      WriteSettingsDlgValue(dlg, sSection, "chkDataCreated");
      WriteSettingsDlgValue(dlg, sSection, "chkFuncSupported");
      WriteSettingsDlgValue(dlg, sSection, "chkHardware");  
      WriteSettingsDlgValue(dlg, sSection, "chkPath");  
  }  
  
  biselemsupported.value = (dlg.getDlgValue("chkISElemSupported") != 0);
  bdataadmin.value = (dlg.getDlgValue("chkDataAdmin") != 0);
  bdataused.value = (dlg.getDlgValue("chkDataUsed") != 0);
  bdatacreated.value = (dlg.getDlgValue("chkDataCreated") != 0);
  bfuncsupported.value = (dlg.getDlgValue("chkFuncSupported") != 0);
  bhardware.value = (dlg.getDlgValue("chkHardware") != 0);
  bpath.value = (dlg.getDlgValue("chkPath") != 0);

  return nuserchoice;
}

main();





