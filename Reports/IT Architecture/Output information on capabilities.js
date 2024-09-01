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

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

__usertype_tchecktype = function() {
  this.bcheck_1 = false;
  this.bcheck_2 = false;
  this.bcheck_3 = false;
  this.bcheck_4 = false;
  this.bcheck_5 = false;
  this.bcheck_6 = false;
  this.bcheck_7 = false;
  this.__createNew = function() { return new __usertype_tchecktype; }
}

var c_sis_check_1 = getString("TEXT1"); 
var c_sis_check_2 = getString("TEXT2"); 
var c_sis_check_3 = getString("TEXT3"); 
var c_sis_check_4 = getString("TEXT4"); 
var c_sis_check_5 = getString("TEXT5"); 
var c_sis_check_6 = getString("TEXT6"); 
var c_sis_check_7 = getString("TEXT7"); 

var g_ooutfile = null; 
var g_nloc = 0; 
var bCxnColored = false;


function main()
{
  var tis_check = new __usertype_tchecktype(); 
  var bwithpath = new __holder(false); 
  
  if (userdlg(tis_check, bwithpath)) 
  {  
    g_nloc = Context.getSelectedLanguage();
    
    g_ooutfile = Context.createOutputObject();
    g_ooutfile.Init(g_nloc);
    outreportheaderfooter();

    var oselectedobjdefs = ArisData.getSelectedObjDefs();
    oselectedobjdefs = ArisData.sort(oselectedobjdefs, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);

    // Check 1
    if (tis_check.bcheck_1) {
      doischeck_1(oselectedobjdefs, bwithpath.value, c_sis_check_1);
    }

    // Check 2
    if (tis_check.bcheck_2) {
      doischeck_2(oselectedobjdefs, bwithpath.value, c_sis_check_2);
    }

    // Check 3
    if (tis_check.bcheck_3) {
      doischeck_3(oselectedobjdefs, bwithpath.value, c_sis_check_3);
    }

    // Check 4
    if (tis_check.bcheck_4) {
      doischeck_4(oselectedobjdefs, bwithpath.value, c_sis_check_4);
    }

    // Check 5
    if (tis_check.bcheck_5) {
      doischeck_5(oselectedobjdefs, bwithpath.value, c_sis_check_5);
    }

    // Check 6
    if (tis_check.bcheck_6) {
      doischeck_6(oselectedobjdefs, bwithpath.value, c_sis_check_6);
    }

    // Check 7
    if (tis_check.bcheck_7) {
      doischeck_7(oselectedobjdefs, bwithpath.value, c_sis_check_7);
    }

    g_ooutfile.WriteReport();
  }
  else {
    Context.setScriptError(Constants.ERR_CANCEL);
  }
  
  g_ooutfile = null;
}


function doischeck_1(oisobjdefs, bwithpath, stext)
{
  // Open table
  outtablewith2columns_open(stext, getString("TEXT8"), getString("TEXT9"), bwithpath);

  for (var i = 0 ; i < oisobjdefs.length ; i++ ){
    var oisobjdef = oisobjdefs[i];

    switch(oisobjdef.TypeNum()) {
      case Constants.OT_IS_SERVICE:
      case Constants.OT_FUNC_CLUSTER:
      case Constants.OT_IS_FUNC:

        var odataobjdeflist = getdataobjects(oisobjdef);
        // Output table
        outtablewith2columns_row(oisobjdef, odataobjdeflist, bwithpath);
      break;
    }
  }
  // Close table
  outtable_close( getString("TEXT10") );
}


function doischeck_2(oisobjdefs, bwithpath, stext)
{
  // Open table
  outtablewith2columns_open(stext, getString("TEXT8"), getString("TEXT11"), bwithpath);

  for (var i = 0 ; i < oisobjdefs.length ; i++ ){
    var oisobjdef = oisobjdefs[i];

    switch(oisobjdef.TypeNum()) {
      case Constants.OT_IS_SERVICE:
      case Constants.OT_FUNC_CLUSTER:
      case Constants.OT_IS_FUNC:

        var oapplobjdeflist = getapplicationobjects(oisobjdef);

        // Output table
        outtablewith2columns_row(oisobjdef, oapplobjdeflist, bwithpath);
      break;
    }
  }
  // Close table
  outtable_close( getString("TEXT12") );
}


function doischeck_3(oisobjdefs, bwithpath, stext)
{
  // Open table
  outtablewith2columns_open(stext, getString("TEXT8"), getString("TEXT13"), bwithpath);

  for (var i = 0 ; i < oisobjdefs.length ; i++ ){
    var oisobjdef = oisobjdefs[i];

    switch(oisobjdef.TypeNum()) {
      case Constants.OT_IS_SERVICE:
      case Constants.OT_FUNC_CLUSTER:
      case Constants.OT_IS_FUNC:

        var ofuncobjdeflist = getfunctionobjects(oisobjdef);
        // Output table
        outtablewith2columns_row(oisobjdef, ofuncobjdeflist, bwithpath);
      break;
    }
  }
  // Close table
  outtable_close( getString("TEXT14") );
}


function doischeck_4(oisobjdefs, bwithpath, stext)
{
  // Open table
  outtablewith4columns_open(stext, getString("TEXT8"), getString("TEXT11"), getString("TEXT15"), getString("TEXT16"), bwithpath);

  for (var i = 0 ; i < oisobjdefs.length ; i++ ){
    var oisobjdef = oisobjdefs[i];

    switch(oisobjdef.TypeNum()) {
      case Constants.OT_IS_SERVICE:
      case Constants.OT_FUNC_CLUSTER:
      case Constants.OT_IS_FUNC:

        var oapplobjdeflist = getapplicationobjects(oisobjdef);
        for (var j = 0 ; j < oapplobjdeflist.length ; j++ )
        {
          var oapplobjdef = oapplobjdeflist[j];
          var oinputobjdeflist = getinputobjects(oapplobjdef);

          for (var k = 0 ; k < oinputobjdeflist.length ; k++ )
          {
            var oinputobjdef = oinputobjdeflist[k];
            var oownerobjdeflist = getownerobjects(oinputobjdef);

            // Output table
            if (outtablewith4columns_row(oisobjdef, oapplobjdef, oinputobjdef, oownerobjdeflist, bwithpath)) {

              // cause output empty table cell
              oapplobjdef = null;
              oisobjdef = null;
            }
            oownerobjdeflist = null;
            oinputobjdef = null;
          }

          oapplobjdef = null;
          oinputobjdeflist = null;
        }
        oapplobjdeflist = null;
      break;
    }
    
    oisobjdef = null;
  }

  // Close table
  outtable_close( getString("TEXT17") );
}




function doischeck_5(oisobjdefs, bwithpath, stext)
{
  // Open table
  outtablewith3columns_open(stext, getString("TEXT8"), getString("TEXT11"), getString("TEXT18"), bwithpath);

  for (var i = 0 ; i < oisobjdefs.length ; i++ ){
    var oisobjdef = oisobjdefs[i];

    switch(oisobjdef.TypeNum()) {
      case Constants.OT_IS_SERVICE:
      case Constants.OT_FUNC_CLUSTER:
      case Constants.OT_IS_FUNC:

        var oapplobjdeflist = getapplicationobjects(oisobjdef);

        for (var j = 0 ; j < oapplobjdeflist.length ; j++ )
        {
          var oapplobjdef = oapplobjdeflist[j];
          var ooutputobjdeflist = getoutputobjects(oapplobjdef);

          // Output table
          if (outtablewith3columns_row(oisobjdef, oapplobjdef, ooutputobjdeflist, bwithpath)) {

            // cause output empty table cell
            oisobjdef = null;
          }

          ooutputobjdeflist = null;
          oapplobjdef = null;
        }

        oapplobjdeflist = null;
      break;
    }

    oisobjdef = null;
  }

  // Close table
  outtable_close( getString("TEXT19") );
}




function doischeck_6(oisobjdefs, bwithpath, stext)
{
  // Open table
  outtablewith3columns_open(stext, getString("TEXT8"), getString("TEXT20"), getString("TEXT21"), bwithpath);

  for (var i = 0 ; i < oisobjdefs.length ; i++ ){
    var oisobjdef = oisobjdefs[i];

    switch(oisobjdef.TypeNum()) {
      case Constants.OT_FUNC_CLUSTER:
      case Constants.OT_IS_FUNC:

        var oserviceobjdeflist = getserviceobjects(oisobjdef);

        for (var j = 0 ; j < oserviceobjdeflist.length ; j++ )
        {
          var oserviceobjdef = oserviceobjdeflist[j];

          var oprocessmodels = getprocessmodels(oserviceobjdef);

          // Output table
          if (outtablewith3columns_row(oisobjdef, oserviceobjdef, oprocessmodels, bwithpath)) {

            // cause output empty table cell
            oisobjdef = null;
          }

          oprocessmodels = null;
          oserviceobjdef = null;
        }

        oserviceobjdeflist = null;
      break;
    }

    oisobjdef = null;
  }

  // Close table
  outtable_close( getString("TEXT22") );
}




function doischeck_7(oisobjdefs, bwithpath, stext)
{
  // Open table
  outtablewith3columns_open(stext, getString("TEXT8"), getString("TEXT11"), getString("TEXT23"), bwithpath);

  for (var i = 0 ; i < oisobjdefs.length ; i++ ){
    var oisobjdef = oisobjdefs[i];

    switch(oisobjdef.TypeNum()) {
      case Constants.OT_IS_SERVICE:
      case Constants.OT_FUNC_CLUSTER:
      case Constants.OT_IS_FUNC:

        var oapplobjdeflist = getapplicationobjects(oisobjdef);

        for (var j = 0 ; j < oapplobjdeflist.length ; j++ )
        {
          var oapplobjdef = oapplobjdeflist[j];

          var ohardwareobjdeflist = gethardwarecomponents(oapplobjdef);

          // Output table
          if (outtablewith3columns_row(oisobjdef, oapplobjdef, ohardwareobjdeflist, bwithpath)) {

            // cause output empty table cell
            oisobjdef = null;
          }

          ohardwareobjdeflist = null;
          oapplobjdef = null;
        }
        oapplobjdeflist = null;
        break;
    }

    oisobjdef = null;
  }

  // Close table
  outtable_close( getString("TEXT24") );
}


function userdlg(tcheck, bwithpath)
{
  var __functionResult = false;

  var nuserdlg = 0;   // Variable for the user dialog box

  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 800, 280, getString("TEXT25"));
  // %GRID:10,7,1,1
  userdialog.GroupBox(20, 7, 760, 200, getString("TEXT26"), "GroupBox1");
  userdialog.Text(30, 30, 720, 14, getString("TEXT27"));
  userdialog.CheckBox(40, 50, 720, 15, c_sis_check_1, "Check_1");
  userdialog.CheckBox(40, 70, 720, 15, c_sis_check_2, "Check_2");
  userdialog.CheckBox(40, 90, 720, 15, c_sis_check_3, "Check_3");
  userdialog.CheckBox(40, 110, 720, 15, c_sis_check_4, "Check_4");
  userdialog.CheckBox(40, 130, 720, 15, c_sis_check_5, "Check_5");
  userdialog.CheckBox(40, 150, 720, 15, c_sis_check_6, "Check_6");
  userdialog.CheckBox(40, 170, 720, 15, c_sis_check_7, "Check_7");
  userdialog.CheckBox(40, 215, 720, 15, getString("TEXT28"), "Check_Path");
  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_b4e80120_eaea_11d8_12e0_9d2843560f51_dlg_01.hlp");

  var dlg = Dialogs.createUserDialog(userdialog); 

  // Read dialog settings from config
  var sSection = "SCRIPT_b4e80120_eaea_11d8_12e0_9d2843560f51";  
  ReadSettingsDlgValue(dlg, sSection, "Check_1", 0);
  ReadSettingsDlgValue(dlg, sSection, "Check_2", 0);
  ReadSettingsDlgValue(dlg, sSection, "Check_3", 0);
  ReadSettingsDlgValue(dlg, sSection, "Check_4", 0);
  ReadSettingsDlgValue(dlg, sSection, "Check_5", 0);
  ReadSettingsDlgValue(dlg, sSection, "Check_6", 0);
  ReadSettingsDlgValue(dlg, sSection, "Check_7", 0);
  ReadSettingsDlgValue(dlg, sSection, "Check_Path", 0);  
  
  nuserdlg = Dialogs.show( __currentDialog = dlg);
  // Showing dialog and waiting for confirmation with OK

  tcheck.bcheck_1 = (dlg.getDlgValue("Check_1") == 1);
  tcheck.bcheck_2 = (dlg.getDlgValue("Check_2") == 1);
  tcheck.bcheck_3 = (dlg.getDlgValue("Check_3") == 1);
  tcheck.bcheck_4 = (dlg.getDlgValue("Check_4") == 1);
  tcheck.bcheck_5 = (dlg.getDlgValue("Check_5") == 1);
  tcheck.bcheck_6 = (dlg.getDlgValue("Check_6") == 1);
  tcheck.bcheck_7 = (dlg.getDlgValue("Check_7") == 1);
  bwithpath.value = (dlg.getDlgValue("Check_Path") == 1);

  if (nuserdlg == 0) {
    __functionResult = false;
  }
  else {
    __functionResult = true;
    
    // Write dialog settings to config      
    WriteSettingsDlgValue(dlg, sSection, "Check_1");
    WriteSettingsDlgValue(dlg, sSection, "Check_2");
    WriteSettingsDlgValue(dlg, sSection, "Check_3");
    WriteSettingsDlgValue(dlg, sSection, "Check_4");
    WriteSettingsDlgValue(dlg, sSection, "Check_5");
    WriteSettingsDlgValue(dlg, sSection, "Check_6");
    WriteSettingsDlgValue(dlg, sSection, "Check_7");
    WriteSettingsDlgValue(dlg, sSection, "Check_Path");  
  }

  return __functionResult;
}


function outtablewith2columns_open(stext, shead1, shead2, bwithpath)
{
  outheadline(stext);

  g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0);  

  var colHeadings = bwithpath?new Array(shead1, shead2, getString("TEXT30")):new Array(shead1, shead2);
  writeTableHeaderWithColorWidths(g_ooutfile, colHeadings, 10, getTableCellColor_Bk(true), Constants.C_WHITE , bwithpath?[34,33,33]:[50,50]);  
  bCxnColored = false; //reset
}


function outtablewith3columns_open(stext, shead1, shead2, shead3, bwithpath)
{
  outheadline(stext);

  g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0);
  
  var colHeadings = bwithpath?new Array(shead1, shead2, getString("TEXT30"), shead3, getString("TEXT30")):new Array(shead1, shead2, shead3);
  writeTableHeaderWithColorWidths(g_ooutfile, colHeadings, 10, getTableCellColor_Bk(true), Constants.C_WHITE , bwithpath?[20,20,20,20,20]:[34,33,33]);  
  bCxnColored = false; //reset
}


function outtablewith4columns_open(stext, shead1, shead2, shead3, shead4, bwithpath)
{
  outheadline(stext);

  g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0);

  var colHeadings = bwithpath?new Array(shead1, shead2, getString("TEXT30"), shead3, getString("TEXT30"), shead4, getString("TEXT30")):new Array(shead1, shead2, shead3, shead4);
  writeTableHeaderWithColorWidths(g_ooutfile, colHeadings, 10, getTableCellColor_Bk(true), Constants.C_WHITE , bwithpath?[16,14,14,14,14,14,14]:[25,25,25,25]);  
  bCxnColored = false; //reset
}


function outtable_close(stext)
{
  if ( (Context.getSelectedFormat() != Constants.OutputXLS) && (Context.getSelectedFormat() != Constants.OutputXLSX) ) {
    stext = "";
  }
  g_ooutfile.EndTable(stext, 100, getString("TEXT29"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}


function outtablewith2columns_row(oisobjdef, osearcheditemlist, bwithpath)
{
  var snameandtype = ""; 
  var spath = ""; 

  var nwidth1 = 0; 
  var nwidth2 = 0; 
  var i = 0; 
  var boutput = false; 

  if (bwithpath) {
    nwidth1 = 34;
    nwidth2 = 33;
  }
  else {
    nwidth1 = 50;
    nwidth2 = 50;
  }

  var sisname = oisobjdef.Name(g_nloc);

  if (osearcheditemlist.length > 0) {
    boutput = true;

    for ( i = 0 ; i < osearcheditemlist.length ; i++ ){
      g_ooutfile.TableRow();
      g_ooutfile.TableCell(sisname, nwidth1, getString("TEXT29"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bCxnColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

      snameandtype = getnameandtype(osearcheditemlist[i]);
      g_ooutfile.TableCell(snameandtype, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bCxnColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

      if (bwithpath) {
        spath = getgrouppath(osearcheditemlist[i]);
        g_ooutfile.TableCell(spath, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bCxnColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      }

      bCxnColored = !bCxnColored; // Change background color
      sisname = "";
      // cause output empty table cell
    }
  }

  return boutput;
}


function outtablewith3columns_row(oisobjdef, osearchedobjdef, osearcheditemlist, bwithpath)
{
  var sisname = ""; 
  var snameandtype1 = ""; 
  var spath1 = ""; 
  var snameandtype2 = ""; 
  var spath2 = ""; 

  var nwidth1 = 0; 
  var nwidth2 = 0; 

  if (bwithpath) {
    nwidth1 = 20;
    nwidth2 = 20;
  }
  else {
    nwidth1 = 34;
    nwidth2 = 33;
  }

  if ( oisobjdef != null ) {
    sisname = oisobjdef.Name(g_nloc);
  }
  else {
    sisname = "";
  }

  snameandtype1 = getnameandtype(osearchedobjdef);
  if (bwithpath) {
    spath1 = getgrouppath(osearchedobjdef);
  }


  if (osearcheditemlist.length > 0) {
    for (var i = 0 ; i < osearcheditemlist.length ; i++ )
    {      
      var cBack = getTableCellColor_AttrBk(bCxnColored)
      bCxnColored = !bCxnColored; // Change background color
      
      g_ooutfile.TableRow();
      g_ooutfile.TableCell(sisname, nwidth1, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      g_ooutfile.TableCell(snameandtype1, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

      if (bwithpath) {
        g_ooutfile.TableCell(spath1, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      }

      snameandtype2 = getnameandtype(osearcheditemlist[i]);
      g_ooutfile.TableCell(snameandtype2, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

      if (bwithpath) {
        spath2 = getgrouppath(osearcheditemlist[i]);
        g_ooutfile.TableCell(spath2, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      }

      // cause output empty table cell
      sisname = "";
      snameandtype1 = "";
      spath1 = "";
    }
  }
  else {
    var cBack = getTableCellColor_AttrBk(bCxnColored)
    bCxnColored = !bCxnColored; // Change background color
    
    g_ooutfile.TableRow();    
    g_ooutfile.TableCell(sisname, nwidth1, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.TableCell(snameandtype1, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

    if (bwithpath) {
      g_ooutfile.TableCell(spath1, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }

    g_ooutfile.TableCell("", nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

    if (bwithpath) {
      g_ooutfile.TableCell("", nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }
  }

  return true;
}




function outtablewith4columns_row(oisobjdef, osearchedobjdef1, osearchedobjdef2, osearcheditemlist, bwithpath)
{
  var sisname = ""; 
  var snameandtype1 = ""; 
  var spath1 = ""; 
  var snameandtype2 = ""; 
  var spath2 = ""; 
  var snameandtype3 = ""; 
  var spath3 = ""; 

  var nwidth1 = 0; 
  var nwidth2 = 0; 
  var i = 0; 
  var boutput = false; 

  if (bwithpath) {
    nwidth1 = 16;
    nwidth2 = 14;
  }
  else {
    nwidth1 = 25;
    nwidth2 = 25;
  }

  if (oisobjdef != null) {
    sisname = oisobjdef.Name(g_nloc);
  }
  else {
    sisname = "";
  }


  if (osearchedobjdef1 != null) {
    snameandtype1 = getnameandtype(osearchedobjdef1);
    if (bwithpath) {
      spath1 = getgrouppath(osearchedobjdef1);
    }
  }
  else {
    snameandtype1 = "";
  }

  snameandtype2 = getnameandtype(osearchedobjdef2);
  if (bwithpath) {
    spath2 = getgrouppath(osearchedobjdef2);
  }


  if (osearcheditemlist.length > 0) {
    for ( i = 0 ; i < osearcheditemlist.length ; i++ ){
      var cBack = getTableCellColor_AttrBk(bCxnColored)
      bCxnColored = !bCxnColored; // Change background color

      g_ooutfile.TableRow();
      g_ooutfile.TableCell(sisname, nwidth1, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      g_ooutfile.TableCell(snameandtype1, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

      if (bwithpath) {
        g_ooutfile.TableCell(spath1, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      }


      g_ooutfile.TableCell(snameandtype2, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

      if (bwithpath) {
        g_ooutfile.TableCell(spath2, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      }


      snameandtype3 = getnameandtype(osearcheditemlist[i]);
      g_ooutfile.TableCell(snameandtype3, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

      if (bwithpath) {
        spath3 = getgrouppath(osearcheditemlist[i]);
        g_ooutfile.TableCell(spath3, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      }


      // cause output empty table cell
      sisname = "";
      snameandtype1 = "";
      spath1 = "";
      snameandtype2 = "";
      spath2 = "";
    }

  }
  else {
    var cBack = getTableCellColor_AttrBk(bCxnColored)
    bCxnColored = !bCxnColored; // Change background color

    g_ooutfile.TableRow();
    g_ooutfile.TableCell(sisname, nwidth1, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.TableCell(snameandtype1, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

    if (bwithpath) {
      g_ooutfile.TableCell(spath1, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }


    g_ooutfile.TableCell(snameandtype2, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

    if (bwithpath) {
      g_ooutfile.TableCell(spath2, nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }


    g_ooutfile.TableCell("", nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

    if (bwithpath) {
      g_ooutfile.TableCell("", nwidth2, getString("TEXT29"), 10, Constants.C_BLACK, cBack, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }

  }

  return boutput;
}


function outheadline(stext)
{
  if ((Context.getSelectedFormat() != Constants.OutputXLS) && (Context.getSelectedFormat() != Constants.OutputXLSX)) {
    g_ooutfile.OutputLn("", getString("TEXT29"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_ooutfile.OutputLn(stext, getString("TEXT29"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
  }
}


function outreportheaderfooter()
{
  if ( (Context.getSelectedFormat() != Constants.OutputXLS) && (Context.getSelectedFormat() != Constants.OutputXLSX) ) 
  {
    g_ooutfile.DefineF("REPORT1", getString("TEXT29"), 24, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
    g_ooutfile.DefineF("REPORT2", getString("TEXT29"), 14, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

    setReportHeaderFooter(g_ooutfile, g_nloc, false, true, true);    
  }
}


function getnameandtype(oitem)
{
  return oitem.Name(g_nloc) + " (" + oitem.Type(false) + ")";
}


function getgrouppath(oitem)
{
  return oitem.Group().Path(g_nloc);
}


function getdataobjects(oobjdef)
{
  var odataobjdeflist = new Array(); 
  var ooutcxndefs = oobjdef.CxnListFilter(Constants.EDGES_OUT, Constants.CT_IS_OWN);
  for(var i = 0 ; i < ooutcxndefs.length ; i++ ){
    odataobjdeflist.push( ooutcxndefs[i].TargetObjDef() ); 
  }

  odataobjdeflist = ArisData.sort(odataobjdeflist, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);
  return odataobjdeflist;
}


function getapplicationobjects(oobjdef)
{
  var oapplobjdeflist = new Array();
  var oincxndefs = oobjdef.CxnListFilter(Constants.EDGES_IN, Constants.CT_CAN_SUPP_1);
  for (var i = 0 ; i < oincxndefs.length ; i++ ){
    oapplobjdeflist.push( oincxndefs[i].SourceObjDef() );
  }

  oapplobjdeflist = ArisData.sort(oapplobjdeflist, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);
  return oapplobjdeflist;
}


function getfunctionobjects(oobjdef)
{
  var ofuncobjdeflist = new Array();
  var ooutcxndefs = oobjdef.CxnListFilter(Constants.EDGES_OUT, Constants.CT_CAN_SUPP_1);
  for (var i = 0 ; i < ooutcxndefs.length ; i++ ){
    ofuncobjdeflist.push( ooutcxndefs[i].TargetObjDef() );
  }

  ofuncobjdeflist = ArisData.sort(ofuncobjdeflist, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);
  return ofuncobjdeflist;
}


function getserviceobjects(oobjdef)
{
  var oserviceobjdeflist = new Array();

  var oincxndefs = oobjdef.CxnListFilter(Constants.EDGES_OUT, Constants.CT_DELIVERS_1);
  for (var i = 0 ; i < oincxndefs.length ; i++ ){

    oserviceobjdeflist.push( oincxndefs[i].TargetObjDef() );
  }

  oserviceobjdeflist = ArisData.sort(oserviceobjdeflist, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);
  return oserviceobjdeflist;
}


function getinputobjects(oobjdef)
{
  var oinputobjdeflist = new Array();
  
  var oincxndefs = oobjdef.CxnListFilter(Constants.EDGES_IN, Constants.CT_IS_INP_FOR);  
  for (var i = 0 ; i < oincxndefs.length ; i++ ){
    oinputobjdeflist.push( oincxndefs[i].SourceObjDef() );
  }

  oincxndefs = oobjdef.CxnListFilter(Constants.EDGES_IN, Constants.CT_PROV_INP_FOR);
  for (var i = 0 ; i < oincxndefs.length ; i++ ){
    oinputobjdeflist.push( oincxndefs[i].SourceObjDef() );
  }

  oinputobjdeflist = ArisData.sort(oinputobjdeflist, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);
  return oinputobjdeflist;
}


function getownerobjects(oobjdef)
{
  var oownerobjdeflist = new Array();

  var oincxndefs = oobjdef.CxnListFilter(Constants.EDGES_IN, Constants.CT_IS_OWN);
  for (var i = 0 ; i < oincxndefs.length ; i++ ){
    oownerobjdeflist.push( oincxndefs[i].SourceObjDef() );
  }

  oownerobjdeflist = ArisData.sort(oownerobjdeflist, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);
  return oownerobjdeflist;
}


function getoutputobjects(oobjdef)
{
  var ooutputobjdeflist = new Array();

  var ooutcxndefs = oobjdef.CxnListFilter(Constants.EDGES_OUT, Constants.CT_CRT_OUT_TO);
  for (var i = 0 ; i < ooutcxndefs.length ; i++ ){
    ooutputobjdeflist.push( ooutcxndefs[i].TargetObjDef() );
  }

  ooutcxndefs = oobjdef.CxnListFilter(Constants.EDGES_OUT, Constants.CT_HAS_OUT);
  for (var i = 0 ; i < ooutcxndefs.length ; i++ ){
    ooutputobjdeflist.push( ooutcxndefs[i].TargetObjDef() );
  }

  ooutputobjdeflist = ArisData.sort(ooutputobjdeflist, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);
  return ooutputobjdeflist;
}


function getprocessmodels(oobjdef)
{
  var oprocessmodels = new Array();

  var oobjoccs = oobjdef.OccList();
  for (var i = 0 ; i < oobjoccs.length ; i++ ){
    var omodel = oobjoccs[i].Model();

    switch(omodel.TypeNum()) {
      case Constants.MT_EEPC:
      case Constants.MT_EEPC_MAT:
      case Constants.MT_EEPC_COLUMN:
      case Constants.MT_EEPC_ROW:
      case Constants.MT_EEPC_TAB:
      case Constants.MT_EEPC_TAB_HORIZONTAL:
      case Constants.MT_OFFICE_PROC:
      case Constants.MT_IND_PROC:
      case Constants.MT_PRCS_CHN_DGM:
      case Constants.MT_PCD_MAT:
      case Constants.MT_UML_ACTIVITY_DGM:
      case Constants.MT_VAL_ADD_CHN_DGM:
      case Constants.MT_FUNC_ALLOC_DGM:

        oprocessmodels.push( omodel );
      break;
    }
  }

  oprocessmodels = ArisData.Unique(oprocessmodels);
  oprocessmodels = ArisData.sort(oprocessmodels, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);
  return oprocessmodels;
}


function gethardwarecomponents(oobjdef)
{
  var ohardwareobjdeflist = new Array();
  var ooutcxndefs = oobjdef.CxnListFilter(Constants.EDGES_OUT, Constants.CT_CAN_RUN_ON);
  for (var i = 0 ; i < ooutcxndefs.length ; i++ ){
    ohardwareobjdeflist.push( ooutcxndefs[i].TargetObjDef() );
  }


  var oincxndefs = oobjdef.CxnListFilter(Constants.EDGES_IN, Constants.CT_CAN_BE_PLTFRM_OF);
  for (var i = 0 ; i < oincxndefs.length ; i++ ){
    ohardwareobjdeflist.push( oincxndefs[i].SourceObjDef() );
  }

  ohardwareobjdeflist = ArisData.sort(ohardwareobjdeflist, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);
  return ohardwareobjdeflist;
}


main();







