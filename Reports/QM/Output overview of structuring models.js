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

var g_ooutfile = null; // Object used for the output of the report.
var g_odoneobjoccs = null; // List of objects of this model that have been processed.
var g_nloc = 0; // Variable for the ID of the current language.

function main()
{
  var omodels = null;   // List of models to be evaluated.
  var omodeldummys = null;   // List of the selected models.
  var ocurrentmodel = null;   // Current model of list oModels

  var bcheck = new __holder(false);   // Indicator flag for objects contained in the model (True = objects exist / False = no objects).

  var ncheckmsg = 0;   // Variable for checking the treatment of the message (nCheckMsg = 2 / Cancel was selected).
  var nselection = new __holder(0);   // 1 Table is selected / 0 Text is selected.
  var ncheckmsg2 = 0;   // Variable for checking the treatment of the message (nCheckMsg = 2 / Cancel was selected).
  var bcheckuserdialog = new __holder(false);   // Variable for checking whether the user has selected Cancel in the dialog boxes.
  var bmodcheck = false;   // Variable whether an incorrect model is contained in the selected list.

  var i = 0; 

  // setzen
  omodeldummys = ArisData.getSelectedModels();
  omodels = new Array();
  g_nloc = Context.getSelectedLanguage();
  g_ooutfile = Context.createOutputObject();
  g_odoneobjoccs = new Array();

  bcheck.value = true;
  if (omodeldummys.length > 0) {
    for ( i = 0 ; i < omodeldummys.length ; i++ ){
      if (omodeldummys[i].OrgModelTypeNum() == Constants.MT_STRCT_DGM) {        // TANR 216764
        omodels[omodels.length] = omodeldummys[i];
      } else {
        bmodcheck = true;
      }
    }

    if (bmodcheck) {
      ncheckmsg2 = Dialogs.MsgBox(getString("TEXT1"), Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT2"));
    }

    if (! (ncheckmsg2 == (2)) && omodels.length > 0) {
      omodels = ArisData.sort(omodels, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);

      if (! (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX)) {
        userdlg(nselection, bcheckuserdialog);
      }
      else {
        nselection.value = 1;
        bcheckuserdialog.value = true;
      }

      if (bcheckuserdialog.value == true) {
        if (nselection.value == 1) {
          if (! (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX)) {
            ncheckmsg = Dialogs.MsgBox(getString("TEXT3"), Constants.MSGBOX_BTN_YESNOCANCEL, getString("TEXT4"));
            if (ncheckmsg == 6) {
            // Yes was selected.
              Context.setSelectedFile(changeextension(Context.getSelectedFile(), "txt"));
              Context.setSelectedFormat(Constants.OUTTEXT);
              g_ooutfile = Context.createOutputObject();
            }

            g_ooutfile.Init(g_nloc);
            if (! (ncheckmsg == (2))) {
              outastable(omodels, bcheck);
            }
          }
          else {
            g_ooutfile.Init(g_nloc);
            outastable(omodels, bcheck);
          }
        }

        if (nselection.value == 0) {
          g_ooutfile.Init(g_nloc);
          reporthead();
          outastext(omodels, bcheck);
        }

        if (bcheck.value == false) {
          ncheckmsg = Dialogs.MsgBox(getString("TEXT5"), Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT2"));
          Context.setScriptError(Constants.ERR_CANCEL);
        }

        if (! (ncheckmsg == (2))) {
          g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
        }
      }
      else {
        Context.setScriptError(Constants.ERR_CANCEL);
        return;
      }
    }
    else {
      Context.setScriptError(Constants.ERR_CANCEL);
    }
  }
  else {
        Dialogs.MsgBox(getString("TEXT6"), Constants.MSGBOX_BTN_OK, getString("TEXT2"));
    Context.setScriptError(Constants.ERR_CANCEL);
  }
}


// ------------------------------------------------------------------------
// Subroutine CheckDoneObjOcc
// Subprogram that checks whether the current object occurrence has already been evaluated..
// Parameter
// oCurrentObjOcc = current object occurrence.
// ------------------------------------------------------------------------
function checkdoneobjocc(ocurrentobjocc)
{
  var __functionResult = false;
  var i = 0; 

  if (g_odoneobjoccs.length > 0) {
    for ( i = 0 ; i < g_odoneobjoccs.length ; i++ ){
      if (ocurrentobjocc.IsEqual(g_odoneobjoccs[i]) == true) {
        __functionResult = true;
        break;
      }
    }
  }

  if (__functionResult == false) {
    g_odoneobjoccs[g_odoneobjoccs.length] = ocurrentobjocc;
  }

  return __functionResult;
}


// ------------------------------------------------------------------------
// Subroutine CheckModel
// Subprogram for checking whether the model has already been put on the list.
// Parameter
// oAssignedModels = List containing the models.
// oCurrentModel = Current model.
// nIndex = If the model is already in the list it is given an index of it's position in the list.
// ------------------------------------------------------------------------
function checkmodel(oassignedmodels, ocurrentmodel, nindex)
{
  var __functionResult = false;

  var i = 0; 

  if (oassignedmodels.length > 0) {
    for ( i = 0 ; i < oassignedmodels.length ; i++ ){
      if (oassignedmodels[i].IsEqual(ocurrentmodel)) {
        __functionResult = true;
        nindex.value = i;
        break;
      }
    }
  }

  if (! (__functionResult)) {
    oassignedmodels[oassignedmodels.length] = ocurrentmodel;
  }

  return __functionResult;
}


// ------------------------------------------------------------------------
// Subroutine CreateTablePage
// This subprogram creates the output table sheets.
// Parameter
// oModelObjOccs = List of all object occurrences contained in the model.
// oAssignedModels() = List of models which are assigned to the objects.
// oOutArray() = List containing marks for telling which assigned models belong to which function.
// ------------------------------------------------------------------------
function createtablepage(omodelobjoccs, oassignedmodels, ooutarray)
{
  var i, j;

  // Output of table.
  g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
  // Table heading.
  g_ooutfile.TableRow();
  g_ooutfile.TableCell(getString("TEXT7"), 20, getString("TEXT8"), 12, 0, - 1, 0, 137, 0);
  for ( i = 0 ; i < omodelobjoccs.length ; i++ ){
    g_ooutfile.TableCell(omodelobjoccs[i].ObjDef().Name(g_nloc), 20, getString("TEXT8"), 12, 0, - 1, 0, 137, 0);
  }

  for ( i = 0 ; i < oassignedmodels.length ; i++ ){
    // Table body.
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(oassignedmodels[i].Name(g_nloc), 20, getString("TEXT8"), 12, 0, - 1, 0, 137, 0);
    for ( j = 0 ; j < omodelobjoccs.length ; j++ ){
      if (ooutarray[j][i] == 1) {
        g_ooutfile.TableCell(" X ", 20, getString("TEXT8"), 12, 0, - 1, 0, 137, 0);
      }
      else {
        g_ooutfile.TableCell("", 20, getString("TEXT8"), 12, 0, - 1, 0, 137, 0);
      }
    }
  }
}


// ------------------------------------------------------------------------
// Subroutine	GetRootObjOccs for determining the root objects of the current model.
// Parameter
// oObjOccs = List containing all objects of the model.
// oRootList = List containing the determined root elements.
// ------------------------------------------------------------------------
function getrootobjoccs(oobjoccs, rootlist)
{
  var ocurrentobjocc = null; 
  var ocxnoccs = null; 
  var oocurrentcxnocc = null; 

  var bokroot = false; 
  var i = 0; 

  // setzen
  bokroot = true;

  if (oobjoccs.length > 0) {
    for ( i = 0 ; i < oobjoccs.length ; i++ ){
      ocurrentobjocc = oobjoccs[i];
      ocxnoccs = ocurrentobjocc.InEdges(Constants.EDGES_ALL);
      if (ocxnoccs.length == 0) {
        rootlist[rootlist.length] = ocurrentobjocc;
      }
    }
  }
}


// ------------------------------------------------------------------------
// Subroutine OutAsTable
// Subprogram for outputting the report to Excel
// Parameter
// oModels = List of the selected models.
// bCheck = Indicator flag for objects contained in the model (True = objects exist / False = No objects).
// ------------------------------------------------------------------------
function outastable(omodels, bcheck)
{
    var ooutarray = new Array();  			   // List in containing marks for telling which assigned models belong to which functions.    

    for (var i = 0; i < omodels.length; i++) {
        g_odoneobjoccs = new Array();
        var oassignedmodels = new Array();		// List of models which are assigned to the objects.
        var ncounter = 0;
        
        var ocurrentmodel = omodels[i];
        var omodelobjoccs = ocurrentmodel.ObjOccList();
        omodelobjoccs = ArisData.sort(omodelobjoccs, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);    
        if (omodelobjoccs.length > 0) {
            
            for (var j = 0; j < omodelobjoccs.length; j++) {
                ooutarray[j] = new Array();                
                
                var oassigneddummy = omodelobjoccs[j].ObjDef().AssignedModels();	// List of models which are assigned to the current object.
                if (oassigneddummy.length > 0) {
                    
                    for (var h = 0; h < oassigneddummy.length; h++) {
                        var nindex = new __holder(0); // If the model is already in the list it is given an index of it's position in the list
                        var bcheckit = checkmodel(oassignedmodels, oassigneddummy[h], nindex);
                        if (! (bcheckit)) {
                            ooutarray[j][ncounter] = 1;
                            ncounter = ncounter + 1;
                        } else {
                            ooutarray[j][nindex.value] = 1;
                        }
                    }
                }
            }
        }
        
        if (omodelobjoccs.length > 0) {
            createtablepage(omodelobjoccs, oassignedmodels, ooutarray);
            g_ooutfile.EndTable(ocurrentmodel.Name(g_nloc), 100, getString("TEXT8"), 12, 0, - 1, 0, 137, 0);
            
        } else {
            g_ooutfile.BeginTable(100, 0, - 1, 8, 0);
            g_ooutfile.EndTable(ocurrentmodel.Name(g_nloc), 100, getString("TEXT8"), 12, 0, - 1, 0, 137, 0);
            bcheck.value = false;
        }
    }
}

// ------------------------------------------------------------------------
// Subroutine OutAsText
// Subprogram for outputting the report as text.
// Parameter
// oModels = List of the selected models.
// bCheck = Indicator flag for objects in the model (True = Objects exist / False = No objects in the model).
// ------------------------------------------------------------------------
function outastext(omodels, bcheck)
{
  var omodellobjoccs = null;   // List of all object occurrences in the model.
  var ocurrentrootobj = null;   // Current object occurrence from the list oRootObjOccs.
  var bdonecheck = false;   // Variable for checking whether the current object has already been evaluated.
  var i, j; 

  g_ooutfile.DefineF("REPORT4", getString("TEXT8"), 12, 0, - 1, 9, 0, 0, 0, 0, 0, 1);

  // setzen
  

  for ( i = 0 ; i < omodels.length ; i++ ){
    g_odoneobjoccs = new Array();       // delete entries

    var ocurrentmodel = new __holder(omodels[i]);   // Current model from the list oModels.
    omodellobjoccs = ocurrentmodel.value.ObjOccList();
    if (omodellobjoccs.length > 0) {
      var orootobjoccs = new Array();  
      getrootobjoccs(omodellobjoccs, orootobjoccs);
      if (orootobjoccs.length > 0) {
          
        for ( j = 0 ; j < orootobjoccs.length ; j++ ){
          ocurrentrootobj = orootobjoccs[j];
          bdonecheck = checkdoneobjocc(ocurrentrootobj);
          if (bdonecheck == false) {
            ocurrentmodel.value.MarkVisited(ocurrentrootobj, true);
            // Call of the subprogram for recursive processing of the model.
            outofnextobj(ocurrentmodel, ocurrentrootobj, 1);
          } else {
            // Output of the object name and indication that it has already been output.
            g_ooutfile.OutputLnF(ocurrentrootobj.ObjDef().Name(g_nloc), "REPORT4");
            g_ooutfile.OutputLnF(getString("TEXT9"), "Standard");
          }
        }
      }
    }
    else {
      bcheck.value = false;
    }
  }
  ocurrentmodel.value = null;
}


// ------------------------------------------------------------------------
// Subroutine OutOfNextObj
// Subprogram that outputs the current object.
// Determines it's following objects and calls itself together with these objects.
// Parameter
// oCurrentModel = current model.
// oCurrentObjOcc = Current object occurrence.
// nDepth = Indicator flag for the depth of the model hierarchy.
// ------------------------------------------------------------------------
function outofnextobj(ocurrentmodel, ocurrentobjocc, ndepth)
{
  var onextobjoccs = null;   // List of following elements.
  var ocurrentnextobjocc = null;   // Current following element.
  var ocxnoccs = null;   // List of connection occurrences.
  var oassignedmodels = null;   // List of models which are assigned to the objects.
  var bdonecheck = false;   // Variable for checking whether the current object has already been evaluated.
  var i = 0; 

  onextobjoccs = new Array();
  // Output of the object name.
  g_ooutfile.OutputLn(ocurrentobjocc.ObjDef().Name(g_nloc), getString("TEXT8"), 12, 0, - 1, 8, ((ndepth * 10) + 5));
  // Determine list of assigned models of the object.
  oassignedmodels = ocurrentobjocc.ObjDef().AssignedModels();
  for ( i = 0 ; i < oassignedmodels.length ; i++ ){
    // Output of the assigned models.
    g_ooutfile.OutputLn((getString("TEXT10") + oassignedmodels[i].Name(g_nloc)), getString("TEXT8"), 12, 0, - 1, 8, ((ndepth * 10) + 7));
  }

  ocxnoccs = ocurrentobjocc.OutEdges(Constants.EDGES_ALL);
  if (ocxnoccs.length > 0) {
    for ( i = 0 ; i < ocxnoccs.length ; i++ ){
      onextobjoccs[onextobjoccs.length] = ocxnoccs[i].TargetObjOcc();
    }

    onextobjoccs = ArisData.sort(onextobjoccs, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
    for ( i = 0 ; i < onextobjoccs.length ; i++ ){
      ocurrentnextobjocc = onextobjoccs[i];
      bdonecheck = checkdoneobjocc(ocurrentnextobjocc);
      if (bdonecheck == false) {
        // Select following object.
        ocurrentmodel.value.MarkVisited(ocurrentnextobjocc, true);
        // Call of the subprogram for recursive processing of the model.
        outofnextobj(ocurrentmodel, ocurrentnextobjocc, (ndepth + 1));
      }
      else {
        // Output of the object name and indication that it has already been output.
        g_ooutfile.OutputLn(ocurrentnextobjocc.ObjDef().Name(g_nloc), getString("TEXT8"), 12, 0, - 1, 8, ((((ndepth + 1)) * 10) + 5));
        g_ooutfile.OutputLn(getString("TEXT9"), getString("TEXT8"), 12, 0, - 1, 8, ((((ndepth + 1)) * 10) + 7));

      }
    }
  }
}


// ------------------------------------------------------------------------
// Subroutine UserDlg
// This subprogram is used for interrogating the output as text or table.
// Parameter
// nSelection = 1 table is selected / 0 text is selected.
// bCheckUserDialog = Variable for checking whether the user has chosen Cancel in the dialog boxes.
// ------------------------------------------------------------------------
function userdlg(nselection, bcheckuserdialog)
{
  var nuserdlg = 0;   // Variable for the user dialog box

  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 420, 140, getString("TEXT2"));
  userdialog.Text(10, 10, 460, 15, getString("TEXT11"));
  userdialog.Text(10, 25, 460, 15, getString("TEXT12"));
  userdialog.GroupBox(7, 50, 406, 55, getString("TEXT13"));
  userdialog.OptionGroup("options1");
  userdialog.OptionButton(20, 65, 360, 15, getString("TEXT14"));
  userdialog.OptionButton(20, 80, 360, 15, getString("TEXT15"));
  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_4ca7d030_eaeb_11d8_12e0_9d2843560f51_dlg_01.hlp");  

  var dlg = Dialogs.createUserDialog(userdialog); 

  // Read dialog settings from config 
  var sSection = "SCRIPT_4ca7d030_eaeb_11d8_12e0_9d2843560f51";
  ReadSettingsDlgValue(dlg, sSection, "options1", 0);  
  
  nuserdlg = Dialogs.show( __currentDialog = dlg);
  // Showing dialog and waiting for confirmation with OK

  nselection.value = dlg.getDlgValue("options1");
  if (nuserdlg == 0) {
    bcheckuserdialog.value = false;
  }
  else {
    bcheckuserdialog.value = true;
    
    // Write dialog settings to config 
    WriteSettingsDlgValue(dlg, sSection, "options1");  
  }
}


// ########################################################################################################################
// ##################################### ReportHead #######################################################################
// ########################################################################################################################
// ********************************************************************************************************************
// *  Subroutine ReportHead																							*
// *	This subprogram is used for creating the report head when outputting text.						*
// ********************************************************************************************************************
// *  Parameter																										*
// ********************************************************************************************************************
function reporthead()
{

  g_ooutfile.DefineF("REPORT1", getString("TEXT8"), 24, 0, - 1, 17, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT2", getString("TEXT8"), 14, 0, - 1, 8, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT3", getString("TEXT8"), 8, 0, - 1, 8, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("Standard", getString("TEXT8"), 12, 0, - 1, 16, 0, 0, 0, 0, 0, 1);

  // BLUE-17783 Update report header/footer
  var borderColor = getColorByRGB( 23, 118, 191); 
  
  // graphics used in header
  var pictleft = Context.createPicture(Constants.IMAGE_LOGO_LEFT);
  var pictright = Context.createPicture(Constants.IMAGE_LOGO_RIGHT);

  // Header + footer
  setFrameStyle(g_ooutfile, Constants.FRAME_BOTTOM);
  g_ooutfile.BeginHeader();
  g_ooutfile.BeginTable(100, borderColor, - 1, 8, 0);
  g_ooutfile.TableRow();
  g_ooutfile.TableCell("", 26, getString("TEXT8"), 12, 0, - 1, 0, 272, 0);
  g_ooutfile.OutGraphic(pictleft, - 1, 40, 15);
  g_ooutfile.TableCell(Context.getScriptInfo(Constants.SCRIPT_TITLE), 48, getString("TEXT8"), 14, 0, - 1, 0, 272, 0);
  g_ooutfile.TableCell("", 26, getString("TEXT8"), 12, 0, - 1, 0, 272, 0);
  g_ooutfile.OutGraphic(pictright, - 1, 40, 15);
  g_ooutfile.EndTable("", 100, getString("TEXT8"), 10, 0, - 1, 0, 136, 0);
  g_ooutfile.EndHeader();

  setFrameStyle(g_ooutfile, Constants.FRAME_TOP);
  g_ooutfile.BeginFooter();
  g_ooutfile.BeginTable(100, borderColor, - 1, 8, 0);
  g_ooutfile.TableRow();
  g_ooutfile.TableCell("", 26, getString("TEXT8"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
  g_ooutfile.OutputField(Constants.FIELD_DATE, getString("TEXT8"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
  g_ooutfile.Output(" ", getString("TEXT8"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
  g_ooutfile.OutputField(Constants.FIELD_TIME, getString("TEXT8"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
  g_ooutfile.TableCell(Context.getSelectedFile(), 48, getString("TEXT8"), 12, 0, - 1, 0, 272, 0);
  g_ooutfile.TableCell("", 26, getString("TEXT8"), 12, 0, - 1, 0, 272, 0);
  g_ooutfile.Output(getString("TEXT16"), getString("TEXT8"), 12, 0, 16777215, 16, 0);
  g_ooutfile.OutputField(1, getString("TEXT8"), 12, 0, 16777215, 16);
  g_ooutfile.Output(getString("TEXT17"), getString("TEXT8"), 12, 0, 16777215, 16, 0);
  g_ooutfile.OutputField(2, getString("TEXT8"), 12, 0, 16777215, 16);
  g_ooutfile.EndTable("", 100, getString("TEXT8"), 10, 0, - 1, 0, 136, 0);
  g_ooutfile.EndFooter();

  g_ooutfile.ResetFrameStyle();
  
  // Headline
  g_ooutfile.OutputLnF("", "REPORT1");
  g_ooutfile.OutputLnF(getString("TEXT2"), "REPORT1");
  g_ooutfile.OutputLnF("", "REPORT1");

  // Information header.
  g_ooutfile.OutputLnF((getString("TEXT18") + ArisData.getActiveDatabase().ServerName()), "REPORT2");
  g_ooutfile.OutputLnF((getString("TEXT19") + ArisData.getActiveDatabase().Name(g_nloc)), "REPORT2");
  g_ooutfile.OutputLnF((getString("TEXT20") + ArisData.getActiveUser().Name(g_nloc)), "REPORT2");
  g_ooutfile.OutputLnF("", "REPORT2");


  function setFrameStyle(outfile, iFrame) { 
    outfile.SetFrameStyle(Constants.FRAME_TOP, 0); 
    outfile.SetFrameStyle(Constants.FRAME_LEFT, 0); 
    outfile.SetFrameStyle(Constants.FRAME_RIGHT, 0); 
    outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 0);

    outfile.SetFrameStyle(iFrame, 50, Constants.BRDR_NORMAL);
  }
}


// ########################################################################################################################
// ##################################### Ende #############################################################################
// ########################################################################################################################

main();






