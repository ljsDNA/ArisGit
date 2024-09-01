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
 
// common for all traversing analysis scripts
var g_ooutfile = null; // Object that is used for the output of the analysis.
var g_nloc = 0; // Variable for the ID of the current language.
var g_odoneobjoccs = null; // List of object occurrences which have already been evaluated in the model.



// common types with specific contents/initialization/cleaner for all traversing analysis scripts:

// traversing context for model
__usertype_tmodelcontext = function() {
  this.nappvalue = new Array(); // List of the determined values.
}


// initialization of traversing context for model
function initmodelcontext(modelcontext)
{
  modelcontext.value.nappvalue = new Array();
  for(var i =0; i<13;i++) {
      modelcontext.value.nappvalue[i] = 0;
  }
}



// cleaner of traversing context for model
function cleanmodelcontext(modelcontext)
{
}




// traversing context for function
__usertype_tfunccontext = function() {
  this.oappoccsfromcurfu = null;
// List of application systems of the current function.
  this.ocxnoccsfromcurfu = null;
// List of connection occurrences of the current function.
  this.oappoccsfromnextfu = null;
// Field showing the application systems of the following functions.
  this.ocxnoccsfromnextfu = null;
// Field showing the connections of the following functions.
}


// initialization of traversing context for function
function initfunccontext(funccontext)
{
  funccontext.oappoccsfromcurfu = new Array();
  funccontext.ocxnoccsfromcurfu = new Array();
  funccontext.oappoccsfromnextfu = new Array();
  funccontext.ocxnoccsfromnextfu = new Array();
}



// cleaner of traversing context for function
function cleanfunccontext(funccontext)
{
  funccontext.oappoccsfromcurfu = null;
  funccontext.ocxnoccsfromcurfu = null;
  funccontext.oappoccsfromnextfu = null;
  funccontext.ocxnoccsfromnextfu = null;
}



// common traverse result type
__usertype_ttraverseresult = function() {
  this.ofuncobjocc = null;
  this.funccontext = new __usertype_tfunccontext();
}


// helper routine for adding to traverse result list
function setfuncsucctraverseresult(ofuncobjocc, traverseresults, succfunccontext)
{
    for (var i = 0; i < traverseresults.length; i++) {
        if (traverseresults[i].ofuncobjocc.IsEqual(ofuncobjocc)) {
            traverseresults[i].funccontext = succfunccontext;
        }
    }
}


// specific globals
var g_odoneappobjdefs       = null; // List of application system definitions which have already been evaluated in the model.
var g_odoneappobjoccs       = null; // List of application system occurrences which have already been evaluated in the model.
var g_odonegenfuncobjoccs   = null; // List of object occurrences of the functions contained in the model which have already been edited.
var g_evalfunc              = null; 


// main routine
function main()
{
  if (Context.getSelectedFormat() == Constants.OUTTEXT) {
    // BLUE-14018      
    Context.setProperty("use-new-output", false);
  } 
    
  var omodels = null;   // List of selected models.

  var ncheckmsg = 0;   // Variable for checking the treatment of the message (nCheckMsg = 2 / Cancel was selected).
  var ncheckmsg2 = 0;   // Variable for checking the treatment of the message (nCheckMsg = 2 / Cancel was selected).
  var nwithassmod = new __holder(0);   // Variable to check whether the function allocation diagrams should also be evaluated (1 = Yes / 0 = No).
  var nselectedoption = new __holder(0);   // Variable for a cumulative ( = 0 ) or single (= 1) evaluation of the selected models.
  var nvaluetable = new Array();   // List of the models' values.
  // First row: number of functions.
  // Second row: total of allocated application system elements.
  // Third row: number of application systems.
  // Fourth row: number of application system types.
  // Fifth row: number of computers.
  // Sixth row: number of application system classes.
  // Seventh row: functions with application system elements in %.
  // Eighth row: functions with application system in %.
  // Ninth row: functions with application system type in %.
  // Tenth row: functions with computer in %.
  // Eleventh row: functions with application system class in %.
  // Twelfth row: number of function transitions.
  // Thirteenth row: number of application system application system breaks.
  // Fourteenth row: Ration of application system break / function transitions.

  var sname         = new __holder("");   // Variable for the analysis name.
  var sextension    = new __holder("");   // Variable for the file extension.

  var boutput   = false;   // Variable for title (True = table / False = text).
  var bmodellok = true;   // Variable for checking whether the model is of the correct type.
  var berror    = false; 
  var i = 0;   var j = 0; 

  var bcheckuserdialog = new __holder(false);   // Variable for checking whether the user has selected Cancel in the dialog boxes.

  var odummymodels  = null;   // List of models for temporary saving.
  var bcheck        = false; 


  // Set
  odummymodels  = ArisData.getSelectedModels();
  g_nloc        = Context.getSelectedLanguage();
  g_ooutfile    = Context.createOutputObject();
  
  g_odoneobjoccs         = new Array();
  g_odonegenfuncobjoccs  = new Array();
  g_evalfunc             = new Array();
  g_odoneappobjdefs      = new Array();
  g_odoneappobjoccs      = new Array();
  omodels                = new Array();
  sextension.value       = "";
  bcheckuserdialog.value = true;

  if (odummymodels.length > 0) {
    // Correctness of model type is checked.
    for ( i = 0 ; i < odummymodels.length ; i++ ){
      switch(odummymodels[i].OrgModelTypeNum()) {           // TANR 248128
        case Constants.MT_EEPC:
        case Constants.MT_EEPC_MAT:
        case Constants.MT_IND_PROC:
        case Constants.MT_OFFICE_PROC:
        case Constants.MT_PRCS_CHN_DGM:
        case Constants.MT_PCD_MAT:
        case Constants.MT_UML_ACTIVITY_DGM:
        case Constants.MT_EEPC_COLUMN:
        case Constants.MT_VAL_ADD_CHN_DGM:
        case Constants.MT_EEPC_ROW:
        case Constants.MT_EEPC_TAB:
        case Constants.MT_ENTERPRISE_BPMN_COLLABORATION:    // BLUE-10581        
        case Constants.MT_ENTERPRISE_BPMN_PROCESS:          // BLUE-10581                  
          omodels[omodels.length] = odummymodels[i];
          break;

        default:
          bmodellok = false;
        }
    }

    if (bmodellok == false) {
      if (omodels.length > 0) {
        ncheckmsg2 = Dialogs.MsgBox(getString("TEXT1"), Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT2"));
      }
      else {
        Dialogs.MsgBox(getString("TEXT3"), Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT2"));
        ncheckmsg2 = 2;
      }
    }

    if (! (ncheckmsg2 == (2))) {
      // Selection of output.
      if (! (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX || Context.getSelectedFormat() == Constants.OUTTEXT)) {
        ncheckmsg = Dialogs.MsgBox(getString("TEXT4"), Constants.MSGBOX_BTN_YESNOCANCEL | Constants.MSGBOX_ICON_QUESTION, getString("TEXT2"));
        if (ncheckmsg == 6) {
        // Yes was selected.
          getextension(sextension, bcheckuserdialog);
          switch(sextension.value) {
            case "txt":
              Context.setSelectedFormat(Constants.OUTTEXT);
            break;
            case "xls":
              Context.setSelectedFormat(Constants.OutputXLS);
            break;
            case "xlsx":
              Context.setSelectedFormat(Constants.OutputXLSX);
            break;
          }
          Context.setSelectedFile(changeextension(Context.getSelectedFile(), sextension.value));
          g_ooutfile = Context.createOutputObject();          
        }
      }

      g_ooutfile.Init(g_nloc);
      if (! (ncheckmsg == 2) && bcheckuserdialog.value == true) {
        omodels = ArisData.sort(omodels, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);
        userdlg(nselectedoption, sname, nwithassmod, bcheckuserdialog);
        if (bcheckuserdialog.value == true) {
          if (nselectedoption.value == 0) {
          // Cumulated
          // Every model separately.
            nvaluetable = new Array();
            for (var k = 0; k < 13+1; k++) {
                nvaluetable[k] = 0.0;
            }
            singletable(omodels, nvaluetable, nwithassmod);
          }
          else {
            nvaluetable = new Array();
            for (var k = 0; k < 13; k++) {
                nvaluetable[k] = new Array();
                for (var m = 0; m < omodels.length; m++) {
                    nvaluetable[k][m] = 0.0;
                }
            }
            greattable(omodels, nvaluetable, nwithassmod);
          }

          // Title
          if (ncheckmsg == 7) {
          // Selection: No
            boutput = false;
          } else {
            boutput = true;
          }

          if (boutput == false) {
            outreporthead(omodels, sname.value, boutput);
          }

          g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
          if (boutput == true) {
            outreporthead(omodels, sname.value, boutput);
          }

          bcheck = checkval(nvaluetable, nselectedoption.value);
          if (bcheck) {
            outputoftable(omodels, nvaluetable, sname.value, nselectedoption.value);
          }

          g_ooutfile.EndTable(sname.value, 100, getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
          
          if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) {
            g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            outputCharts(omodels, nvaluetable, sname.value, nselectedoption.value);          
            g_ooutfile.EndTable(getString("TEXT47"), 100, getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
          }
          
          g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
        }
        else {
          berror = true;
        }
      } else {
        berror = true;
      }
    } else {
      berror = true;
    }
  }
  else {
    Dialogs.MsgBox(getString("TEXT6"), Constants.MSGBOX_BTN_OK, getString("TEXT2"));
    berror = true;
  }

  omodels = null;
  if (berror) {
    Context.setScriptError(Constants.ERR_CANCEL);
  }
}

// secherka
function outputCharts(omodels, nvaluetable, sTitle, nselectedoption)
{
  var ncount = 0; 
  var ncut = 0.0; 
  var i = 0, j = 0, sVal = "";
  var chart, chartPicture;
  
  var arrData = new Array();
  var arrLegend = new Array();
  var nRatio;
  if (nselectedoption == 0) {
    // Cumulated
    nRatio = (nvaluetable[11] == 0) ? 0 : nvaluetable[12]/nvaluetable[11];
    arrData.push(nRatio);
    arrLegend.push(getString("TEXT48"));
  } else {
    // Every model separately
    for (i=0; i<omodels.length; i++) {
      nRatio = (nvaluetable[11][i] == 0) ? 0 : nvaluetable[12][i]/nvaluetable[11][i];
      arrData.push(nRatio);
      arrLegend.push(getString("TEXT28")+" "+(i+1));
    }
  }
      
  chart = createBarChart(sTitle, arrData, arrLegend);
  chartPicture = chart.getPicture();
  
  g_ooutfile.TableRow();
  g_ooutfile.TableCell("", 5, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, 
    Constants.FMT_CENTER | Constants.FMT_VTOP | Constants.FMT_NOLINEBREAK, 0);
  g_ooutfile.OutGraphic(chartPicture, 100, 100, 200);
  g_ooutfile.TableRow();
  
}

// Subroutine creates chart
//  p_sTitle - title of chart
//  p_arrData - array of bar values
//  p_arrLegend - array of legend values
function createBarChart(p_sTitle, p_arrData, p_arrLegend) {
    
    var chart = Context.createChart(Constants.CHART_TYPE_BAR, 500, 300);
    chart.setMultiChartType(Constants.CHART_COMBINE_SIDE);
    var arrData = new Array();
    
    for (i=0; i<p_arrData.length; i++) {
        arrData[i] = new Array();
        arrData[i][0] = p_arrData[i];
    }
    
    chart.setLegend();
    chart.setMultiData(arrData, p_arrLegend);
    //chart.setDataLabels(true);
    chart.set3D(10);
    chart.setTitle(p_sTitle);
    chart.setTitleFont("Arial", 10, new java.awt.Color(0, 0, 0), Constants.FMT_BOLD);
    chart.getYAxis().setTitle(getString("TEXT49"));

    return chart;
}

// ------------------------------------------------------------------------
// Subroutine GetModelVal
// Subprogram for the cumulative evaluation of selected models.
// All model values are added up.
// Parameter
// oCurrentModel = current model.
// nCurrentTabOfVal() = List containing the current model's values.
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams
// will also be evaluated (1 = Yes / 0 = No).
// ------------------------------------------------------------------------
function getmodelval(ocurrentmodel, ncurrenttabofval, nwithassmod)
{

  var ofuncobjocc = null;   // List of function occurrences.
  var ostartfunc = null;   // List of start functions of the current model.
  var i = 0; 

  var bdonefunc = false;   // Variable for checking whether the current function has already been evaluated.

  var modelcontext = new __holder(new __usertype_tmodelcontext()); 
  initmodelcontext(modelcontext);

  // setzen
  ostartfunc = new Array();

  // Number of functions in the model.
  ofuncobjocc = ocurrentmodel.value.ObjOccListFilter(Constants.OT_FUNC);

  ncurrenttabofval[0] = ofuncobjocc.length;

  getstartfunc(ocurrentmodel, ostartfunc);
  ocurrentmodel.value.BuildGraph(false);

  for ( i = 0 ; i < ostartfunc.length ; i++ ){
    bdonefunc = checkdonefunc(ostartfunc[i]);
    if (bdonefunc == false) {
      traversemodelgraph(ocurrentmodel, modelcontext, new __holder(ostartfunc[i]), nwithassmod);
    }
  }

//  ncurrenttabofval[0] = modelcontext.value.nappvalue[0];
  ncurrenttabofval[1] = modelcontext.value.nappvalue[1];
  ncurrenttabofval[2] = modelcontext.value.nappvalue[2];
  ncurrenttabofval[3] = modelcontext.value.nappvalue[3];
  ncurrenttabofval[4] = modelcontext.value.nappvalue[4];
  ncurrenttabofval[5] = modelcontext.value.nappvalue[5];
  ncurrenttabofval[6] = modelcontext.value.nappvalue[6];
  ncurrenttabofval[7] = modelcontext.value.nappvalue[7];
  ncurrenttabofval[8] = modelcontext.value.nappvalue[8];
  ncurrenttabofval[9] = modelcontext.value.nappvalue[9];
  ncurrenttabofval[10] = modelcontext.value.nappvalue[10];
  ncurrenttabofval[11] = modelcontext.value.nappvalue[11];
  ncurrenttabofval[12] = modelcontext.value.nappvalue[12];

  cleanmodelcontext(modelcontext.value);
}





// standard function handler routine.
// implementation is specific for analysis
function handlefuncobject(ocurrentmodel, modelcontext, ocurrentfuncobjocc, funccontext, onextfuncnodes, nwithassmod)
{
  var i = 0; 
  var bcheck = false; 

  bcheck = checkright(ocurrentmodel, ocurrentfuncobjocc, nwithassmod);

  if (bcheck == true) {
    // Application system and connections of the current element.
    var h_nappvalue = new __holder(modelcontext.value.nappvalue);
    getappandcxncurfun(ocurrentmodel, ocurrentfuncobjocc, funccontext.oappoccsfromcurfu, funccontext.ocxnoccsfromcurfu, h_nappvalue, nwithassmod);
    modelcontext.value.nappvalue = h_nappvalue.value;
    if (onextfuncnodes.value.length > 0) {
      // Increase number of function transitions.
      modelcontext.value.nappvalue[11] += onextfuncnodes.value.length;
      // Orgelements and connections of the following functions.
      var h_nappvalue = new __holder(modelcontext.value.nappvalue);
      getappandcxnnextfu(ocurrentmodel, onextfuncnodes, funccontext.oappoccsfromnextfu, funccontext.ocxnoccsfromnextfu, nwithassmod, h_nappvalue);
      modelcontext.value.nappvalue = h_nappvalue.value;
    }

    // Change of application system.
    var h_ocxnoccsfromnextfu = new __holder(funccontext.ocxnoccsfromnextfu);
    var h_oappoccsfromnextfu = new __holder(funccontext.oappoccsfromnextfu);
    var h_nappvalue = new __holder(modelcontext.value.nappvalue);
    checkappchange(onextfuncnodes, funccontext.oappoccsfromcurfu, funccontext.ocxnoccsfromcurfu, h_oappoccsfromnextfu, h_ocxnoccsfromnextfu, h_nappvalue);
    funccontext.ocxnoccsfromnextfu = h_ocxnoccsfromnextfu.value;
    funccontext.oappoccsfromnextfu = h_oappoccsfromnextfu.value;
    modelcontext.value.nappvalue = h_nappvalue.value;
  }

}




// standard dfs traverse result handler routine.
// specific implementation for handling of dfs traverse result for media change
function handlefuncsucctraverseresult(ofuncobjocc, modelcontext, funccontext, traverseresults, nnumsuccs)
{
}





// ------------------------------------------------------------------------
// Subroutine CheckApp
// Subprogram that checks whether the definition of the current application system has already been processed.
// If it has not been registered it is put in the global list g_oDoneAppObjDefs and the relevant counter will be increased.
// Parameter
// oCurrentAppObjOcc = current application system.
// nAppValue() = List of values.
// bCheckAppType() = List as indicator flag which application system was found.
// ------------------------------------------------------------------------
function checkapp(ocurrentappobjocc, nappvalue, bcheckapptype)
{
  var i = 0; 

  var bfound = false;   // Indicator flag whether the application system has already been evaluated.

  if (g_odoneappobjdefs.length > 0) {
    for ( i = 0 ; i < g_odoneappobjdefs.length ; i++ ){
      if (ocurrentappobjocc.ObjDef().IsEqual(g_odoneappobjdefs[i]) == true) {
        bfound = true;
        break;
      }
    }
  }

  if (bfound == false) {
    g_odoneappobjdefs[g_odoneappobjdefs.length] = ocurrentappobjocc.ObjDef();
    nappvalue.value[1] = nappvalue.value[1] + 1;

    // Check of application systems.
    switch(ocurrentappobjocc.ObjDef().TypeNum()) {
      case Constants.OT_APPL_SYS:
        nappvalue.value[2] = nappvalue.value[2] + 1;
        break;
      case Constants.OT_APPL_SYS_TYPE:
        if (ocurrentappobjocc.OrgSymbolNum() == Constants.ST_APPL_SYS_TYPE ||
            ocurrentappobjocc.OrgSymbolNum() == Constants.ST_AST_LANE) {        // BLUE-10581
          nappvalue.value[3] = nappvalue.value[3] + 1;
        }
        if (ocurrentappobjocc.OrgSymbolNum() == Constants.ST_COMPUT_PIC) {
          nappvalue.value[4] = nappvalue.value[4] + 1;
        }
        break;
      case Constants.OT_APPL_SYS_CLS:
        nappvalue.value[5] = nappvalue.value[5] + 1;
      break;
    }
  }

  bfound = false;
  if (g_odoneappobjoccs.length > 0) {
    for ( i = 0 ; i < g_odoneappobjoccs.length ; i++ ){
      if (ocurrentappobjocc.IsEqual(g_odoneappobjoccs[i]) == true) {
        bfound = true;
        break;
      }
    }
  }

  if (bfound == false) {
    g_odoneappobjoccs[g_odoneappobjoccs.length] = ocurrentappobjocc;

  }

  // Check of application systems.
  switch(ocurrentappobjocc.ObjDef().TypeNum()) {
    case Constants.OT_APPL_SYS:
      bcheckapptype[0] = true;
    break;
    
    case Constants.OT_APPL_SYS_TYPE:
      if (ocurrentappobjocc.OrgSymbolNum() == Constants.ST_APPL_SYS_TYPE ||
          ocurrentappobjocc.OrgSymbolNum() == Constants.ST_AST_LANE) {      // BLUE-10581
        bcheckapptype[1] = true;
      }

      if (ocurrentappobjocc.OrgSymbolNum() == Constants.ST_COMPUT_PIC) {
        bcheckapptype[2] = true;
      }
    break;
    
    case Constants.OT_APPL_SYS_CLS:
      bcheckapptype[3] = true;
    break;
  }
}


// ------------------------------------------------------------------------
// Subroutine CheckAppChange
// This subprogram is needed for detecting application system breaks.
// Parameter
// oNextFuncNodes = List of following function objects of the current function.
// oAppOccsFromCurFu = List of application system
// oCxnOccsFromCurFu = List of connection occurrences of the current function.
// oAppOccsFromNextFu = Field containing the application systems of the following functions.
// oCxnOccsFromNextFu = Field containing the connections of the following functions.
// nAppValue() = List of values.
// ------------------------------------------------------------------------
function checkappchange(onextfuncnodes, oappoccsfromcurfu, ocxnoccsfromcurfu, oappoccsfromnextfu, ocxnoccsfromnextfu, h_nappvalue)
{
  var odummyappoccs = null;   // List containing the application systems of the current following function for comparison with the Org.Elements listed in oAppOccsFromCurFu.
  var odummycxnoccs = null;   // List containing the connections to the application systems of the current following function for comparison with the connections (oCxnOccsFromCurFu) of the application system elements listed in oAppOccsFromCurFu.
  var bcheck = false;   // Indicator flag if the same application system elements are contained in both fields.
  var i = 0;   var j = 0; 

  odummyappoccs = new Array();
  odummycxnoccs = new Array();

  while (onextfuncnodes.value.length > 0) {
    getfirstcheckelem(onextfuncnodes, odummyappoccs, odummycxnoccs, oappoccsfromnextfu, ocxnoccsfromnextfu);
    bcheck = false;
    if (odummyappoccs.length > 0) {
      for ( i = 0 ; i < odummyappoccs.length ; i++ ){
        for ( j = 0 ; j < oappoccsfromcurfu.length ; j++ ){
          if (oappoccsfromcurfu[j].ObjDef().IsEqual(odummyappoccs[i].ObjDef()) == true) {
            bcheck = true;
            break;
          }

          if (bcheck == true) {
            break;
          }
        }
      }

      if (bcheck == false) {
        h_nappvalue.value[12] = h_nappvalue.value[12] + 1;
      }
    }

    odummyappoccs = new Array();
    odummycxnoccs = new Array();
  }
}


// ------------------------------------------------------------------------
// Subroutine CheckDoneFunc
// Subprogram: Checks whether the current function occurrence has already been evaluated.
// Parameter
// oCurrentObjOcc = current object occurrence.
// ------------------------------------------------------------------------
function checkdonefunc(ocurrentobjocc)
{
  var __functionResult = false;

  if (g_odoneobjoccs.length > 0) {
    for (var i = 0 ; i < g_odoneobjoccs.length ; i++ ){
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
// Subroutine CheckFuncOcc
// Subprogram: Checks whether the current function occurrence has already been evaluated.
// Parameter
// oCurrentObjOcc = current object occurrence
// ------------------------------------------------------------------------
function checkfuncocc(ocurrentobjocc)
{
  var __functionResult = true;

  if (g_odonegenfuncobjoccs.length > 0) {
    for (var i = 0 ; i < g_odonegenfuncobjoccs.length ; i++ ){
      if (ocurrentobjocc.IsEqual(g_odonegenfuncobjoccs[i]) == true) {
        __functionResult = false;
        break;
      }
    }
  }

  if (__functionResult == true) {
    g_odonegenfuncobjoccs[g_odonegenfuncobjoccs.length] = ocurrentobjocc;
  }

  return __functionResult;
}





// ------------------------------------------------------------------------
// Subroutine CheckRight
// Subprogram for checking whether the connected application systems are relevant.
// Parameter
// oCurrentModel = current model.
// oCurrentFunObjOcc = current function occurrence.
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams should also be evaluated (1 = Yes / 0 = No).
// ------------------------------------------------------------------------
function checkright(ocurrentmodel, ocurrentfunobjocc, nwithassmod)
{
  var __functionResult = false;
  var oprednodes = null;   // List of following objects of the current function.
  var ocxnoccs = null;   // List of connections (Occs) of the current following object.
  var ocurrentcxnocc = null;   // Connection between application system and function.
  var oassignedmodels = null;   // List of models which are assigned to the function.
  var osubmodfunc = null;   // Object definition of the current function definition in the assigned model.
  var bcheck = false; 
  var i = 0;   var j = 0;   var h = 0; 

  oprednodes = ocurrentmodel.value.GetPredNodes(ocurrentfunobjocc.value);
  if (oprednodes.length > 0) {
    for ( i = 0 ; i < oprednodes.length ; i++ ){
      switch(oprednodes[i].ObjDef().TypeNum()) {
        case Constants.OT_APPL_SYS:
        case Constants.OT_APPL_SYS_TYPE:
        case Constants.OT_APPL_SYS_CLS:
          if (oprednodes[i].ObjDef().TypeNum() == Constants.OT_APPL_SYS_TYPE) {
            if (oprednodes[i].OrgSymbolNum() == Constants.ST_APPL_SYS_TYPE || 
                oprednodes[i].OrgSymbolNum() == Constants.ST_AST_LANE ||        // BLUE-10581
                oprednodes[i].OrgSymbolNum() == Constants.ST_COMPUT_PIC) {
              bcheck = true;
            } else {
              bcheck = false;
            }
          } else {
            bcheck = true;
          }

          if (bcheck == true) {
            ocxnoccs = oprednodes[i].OutEdges(Constants.EDGES_ALL);
            for ( j = 0 ; j < ocxnoccs.length ; j++ ){
              ocurrentcxnocc = ocxnoccs[j];
              if (ocurrentcxnocc.TargetObjOcc().IsEqual(ocurrentfunobjocc.value) == true) {
                switch(ocurrentcxnocc.Cxn().TypeNum()) {
                  case Constants.CT_SUPP_1:
                  case Constants.CT_SUPP_2:
                  case Constants.CT_SUPP_3:
                  case Constants.CT_CAN_SUPP_1:
                  case Constants.CT_CAN_SUPP_2:
                    __functionResult = true;
                    break;
                  break;
                }
              }
            }
          }

          if (__functionResult == true) {
            break;
          }
        break;
      }
    }
  }


  if (nwithassmod.value == 1) {
    oassignedmodels = ocurrentfunobjocc.value.ObjDef().AssignedModels();
    // Assigned model function allocation diagram.
    if (oassignedmodels.length > 0) {
      for ( j = 0 ; j < oassignedmodels.length ; j++ ){
        switch(oassignedmodels[j].OrgModelTypeNum()) {          // TANR 248128
          case Constants.MT_FUNC_ALLOC_DGM:
//            osubmodfunc = oassignedmodels[j].ObjOccListFilter(ocurrentfunobjocc.value.ObjDef().Name(g_nloc), g_nloc, Constants.OT_FUNC);
            osubmodfunc = ocurrentfunobjocc.value.ObjDef().OccListInModel(oassignedmodels[j]);
            if (osubmodfunc.length > 0) {
                ocxnoccs = oassignedmodels[j].CxnOccList();
                for ( h = 0 ; h < ocxnoccs.length ; h++ ){
                  ocurrentcxnocc = ocxnoccs[h];
                  if (ocurrentcxnocc.TargetObjOcc().IsEqual(osubmodfunc[0]) == true) {
                    switch(ocurrentcxnocc.Cxn().TypeNum()) {
                      case Constants.CT_SUPP_1:
                      case Constants.CT_SUPP_2:
                      case Constants.CT_SUPP_3:
                      case Constants.CT_CAN_SUPP_1:
                      case Constants.CT_CAN_SUPP_2:
                        switch(ocurrentcxnocc.SourceObjOcc().ObjDef().TypeNum()) {
                          case Constants.OT_APPL_SYS:
                          case Constants.OT_APPL_SYS_TYPE:
                          case Constants.OT_APPL_SYS_CLS:
                            if (ocurrentcxnocc.SourceObjOcc().ObjDef().TypeNum() == Constants.OT_APPL_SYS_TYPE) {
                              if (ocurrentcxnocc.SourceObjOcc().OrgSymbolNum() == Constants.ST_APPL_SYS_TYPE || 
                                  ocurrentcxnocc.SourceObjOcc().OrgSymbolNum() == Constants.ST_AST_LANE ||      // BLUE-10581
                                  ocurrentcxnocc.SourceObjOcc().OrgSymbolNum() == Constants.ST_COMPUT_PIC) {
                                __functionResult = true;
                                break;
                              }
                            } else {
                              __functionResult = true;
                              break;
                            }
                          break;
                        }
                      break;
                    }
                  }
                }
            }
            if (__functionResult == true) {
              break;
            }
          break;
        }
      }
    }
  }

  return __functionResult;
}




// ----------------------------------------------------------------------------
// Subroutine GetAppAndCxnCurFun
// Subprogram which determines the application systems and connections of the current function.
// Parameter
// oCurrentModel = current model.
// oCurrentFuncObjOcc = current function.
// oAppOccsFromCurFu = List of application systems of the current function.
// oCxnOccsFromCurFu = List of connection occurrences of the current function.
// nAppValue() = List of values.
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams should also be evaluated (1 = Yes / 0 = No).
// ----------------------------------------------------------------------------
function getappandcxncurfun(ocurrentmodel, ocurrentfuncobjocc, oappoccsfromcurfu, ocxnoccsfromcurfu, nappvalue, nwithassmod)
{

  var oassignedmodels = null;   // List of models which are assigned to the function.
  var odummyobjoccs = null;   // List of ObjOccs for temporary saving.
  var ocurrentcxnocc = null;   // Connection between oOrgelement and function.
  var ocxnoccs = null;   // List of connection occurrences.
  var osubmodfunc = null;   // Object definition of the current function definition in the assigned model.
  var bfuncwithapp = false;   // Indicator flag whether function has already been registered.
  var nindex = 0; 
  var borg = false; 
  var i = 0;   var j = 0;   var k = 0; 

  var bcheckapptype = new Array();   // List for reminding which application system was found.
  bfuncwithapp = false;
  for ( i = 0 ; i < 3+1 ; i++ ){
    bcheckapptype[i] = false;
  }

  // Application systems and connections of the current function occurrence.
  // Direct
  odummyobjoccs = ocurrentmodel.value.GetPredNodes(ocurrentfuncobjocc.value);
  if (odummyobjoccs.length > 0) {
    for ( i = 0 ; i < odummyobjoccs.length ; i++ ){
      // Check application systems.
      borg = false;
      switch(odummyobjoccs[i].ObjDef().TypeNum()) {
        case Constants.OT_APPL_SYS:
        case Constants.OT_APPL_SYS_TYPE:
        case Constants.OT_APPL_SYS_CLS:
          checkapp(odummyobjoccs[i], nappvalue, bcheckapptype);
          ocxnoccs = odummyobjoccs[i].OutEdges(Constants.EDGES_ALL);
          for ( k = 0 ; k < ocxnoccs.length ; k++ ){
            ocurrentcxnocc = ocxnoccs[k];
            if (ocurrentcxnocc.TargetObjOcc().IsEqual(ocurrentfuncobjocc.value) == true) {
              // Check connections.
              switch(ocurrentcxnocc.Cxn().TypeNum()) {
                case Constants.CT_SUPP_1:
                case Constants.CT_SUPP_2:
                case Constants.CT_SUPP_3:
                case Constants.CT_CAN_SUPP_1:
                case Constants.CT_CAN_SUPP_2:
                  ocxnoccsfromcurfu[ocxnoccsfromcurfu.length] = ocurrentcxnocc;
                  oappoccsfromcurfu[oappoccsfromcurfu.length] = odummyobjoccs[i];
                  bfuncwithapp = true;
                break;
              }
            }
          }
        break;
      }
    }
  }

  if (nwithassmod.value == 1) {
    oassignedmodels = ocurrentfuncobjocc.value.ObjDef().AssignedModels();
    // Assigned model function allocation diagram.
    if (oassignedmodels.length > 0) {
      for ( j = 0 ; j < oassignedmodels.length ; j++ ){
        switch(oassignedmodels[j].OrgModelTypeNum()) {          // TANR 248128
          case Constants.MT_FUNC_ALLOC_DGM:
            osubmodfunc = ocurrentfuncobjocc.value.ObjDef().OccListInModel(oassignedmodels[j]);
            if (osubmodfunc.length > 0) {
                ocxnoccs = oassignedmodels[j].CxnOccList();
                for ( k = 0 ; k < ocxnoccs.length ; k++ ){
                  ocurrentcxnocc = ocxnoccs[k];
                  if (ocurrentcxnocc.TargetObjOcc().IsEqual(osubmodfunc[0]) == true) {
                    // Check connections.
                    switch(ocurrentcxnocc.Cxn().TypeNum()) {
                      case Constants.CT_SUPP_1:
                      case Constants.CT_SUPP_2:
                      case Constants.CT_SUPP_3:
                      case Constants.CT_CAN_SUPP_1:
                      case Constants.CT_CAN_SUPP_2:
                        switch(ocurrentcxnocc.SourceObjOcc().ObjDef().TypeNum()) {
                          case Constants.OT_APPL_SYS:
                          case Constants.OT_APPL_SYS_TYPE:
                          case Constants.OT_APPL_SYS_CLS:
                            checkapp(ocurrentcxnocc.SourceObjOcc(), nappvalue, bcheckapptype);
                            ocxnoccsfromcurfu[ocxnoccsfromcurfu.length] = ocurrentcxnocc;
                            oappoccsfromcurfu[oappoccsfromcurfu.length] = ocurrentcxnocc.SourceObjOcc();
                            bfuncwithapp = true;
                          break;
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
  }

  if (! (iselementinlist(ocurrentfuncobjocc.value, g_evalfunc, nindex))) {
    g_evalfunc[g_evalfunc.length] = ocurrentfuncobjocc.value;
    if (bcheckapptype[0] == true) {
      nappvalue.value[7] = nappvalue.value[7] + 1;
    }

    if (bcheckapptype[1] == true) {
      nappvalue.value[8] = nappvalue.value[8] + 1;
    }

    if (bcheckapptype[2] == true) {
      nappvalue.value[9] = nappvalue.value[9] + 1;
    }

    if (bcheckapptype[3] == true) {
      nappvalue.value[10] = nappvalue.value[10] + 1;
    }

    if (bfuncwithapp == true) {
      nappvalue.value[6] = nappvalue.value[6] + 1;
    }
  }
}





// ----------------------------------------------------------------------------
// Subroutine GetAppAndCxnNextFu
// Subprogram: Determines the application systems and connections of the following functions.
// Parameter
// oCurrentModel = current model.
// oNextFuncNodes = List of following function objects of the current function.
// oAppOccsFromNextFu = Field containing the application systems of the following functions.
// oCxnOccsFromNextFu = Field containing the connections of the following functions.
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams should also be evaluated (1 = Yes / 0 = No).
// nAppValue() = List of values.
// ----------------------------------------------------------------------------
function getappandcxnnextfu(ocurrentmodel, onextfuncnodes, oappoccsfromnextfu, ocxnoccsfromnextfu, nwithassmod, nappvalue)
{
  var odummynextobjoccs = null;   // List of ObjOccs for temporary saving.
  var odummyfuncobjoccs = null;   // List of ObjOccs for temporary saving.
  var ocurrentcxnocc = null;   // Connection between oOrgelement and function.
  var ocxnoccs = null;   // List of connection occurrences.
  var oassignedmodels = null;   // List of models which are assigned to the current function.
  var osubmodfunc = null;   // Object definition of the current function definition in the assigned model.
  var nindex = 0; 

  var bfuncwithapp = false;   // Indicator flag whether function has already been registered.
  var i = 0;   var j = 0;   var k = 0;   var m = 0; 

  // Set
  odummyfuncobjoccs = new Array();
  var bcheckapptype = new Array();   // List for reminding which application system was found.

  for ( i = 0 ; i < onextfuncnodes.value.length ; i++ ){
    odummyfuncobjoccs[odummyfuncobjoccs.length] = onextfuncnodes.value[i];
  }

  onextfuncnodes.value = new Array();

  for ( i = 0 ; i < odummyfuncobjoccs.length ; i++ ){
    for ( j = 0 ; j < 3+1 ; j++ ){
      bcheckapptype[j] = false;
    }

    odummynextobjoccs = ocurrentmodel.value.GetPredNodes(odummyfuncobjoccs[i]);
    if (odummynextobjoccs.length > 0) {
      for ( j = 0 ; j < odummynextobjoccs.length ; j++ ){
        // Check application system elements.
        switch(odummynextobjoccs[j].ObjDef().TypeNum()) {
          case Constants.OT_APPL_SYS:
          case Constants.OT_APPL_SYS_TYPE:
          case Constants.OT_APPL_SYS_CLS:
            checkapp(odummynextobjoccs[j], nappvalue, bcheckapptype);
            ocxnoccs = odummynextobjoccs[j].OutEdges(Constants.EDGES_ALL);
            for ( m = 0 ; m < ocxnoccs.length ; m++ ){
              ocurrentcxnocc = ocxnoccs[m];
              if (ocurrentcxnocc.TargetObjOcc().IsEqual(odummyfuncobjoccs[i]) == true) {
                switch(ocurrentcxnocc.Cxn().TypeNum()) {
                  case Constants.CT_SUPP_1:
                  case Constants.CT_SUPP_2:
                  case Constants.CT_SUPP_3:
                  case Constants.CT_CAN_SUPP_1:
                  case Constants.CT_CAN_SUPP_2:
                    oappoccsfromnextfu[oappoccsfromnextfu.length] = odummynextobjoccs[j];
                    ocxnoccsfromnextfu[ocxnoccsfromnextfu.length] = ocurrentcxnocc;
                    onextfuncnodes.value[onextfuncnodes.value.length] = odummyfuncobjoccs[i];
                    bfuncwithapp = true;
                  break;
                }
              }
            }
          break;
        }
      }
    }

    if (nwithassmod.value == 1) {
      oassignedmodels = odummyfuncobjoccs[i].ObjDef().AssignedModels();
      // Assigned model function allocation diagram.
      if (oassignedmodels.length > 0) {
        for ( j = 0 ; j < oassignedmodels.length ; j++ ){
          switch(oassignedmodels[j].OrgModelTypeNum()) {            // TANR 248128
            case Constants.MT_FUNC_ALLOC_DGM:
                osubmodfunc = odummyfuncobjoccs[i].ObjDef().OccListInModel(oassignedmodels[j]);
                if (osubmodfunc.length > 0) {
                  ocxnoccs = oassignedmodels[j].CxnOccList();
                  for ( k = 0 ; k < ocxnoccs.length ; k++ ){
                    ocurrentcxnocc = ocxnoccs[k];
                    if (ocurrentcxnocc.TargetObjOcc().IsEqual(osubmodfunc[0]) == true) {
                      // Check connections.
                      switch(ocurrentcxnocc.Cxn().TypeNum()) {
                        case Constants.CT_SUPP_1:
                        case Constants.CT_SUPP_2:
                        case Constants.CT_SUPP_3:
                        case Constants.CT_CAN_SUPP_1:
                        case Constants.CT_CAN_SUPP_2:
                          switch(ocurrentcxnocc.SourceObjOcc().ObjDef().TypeNum()) {
                            case Constants.OT_APPL_SYS:
                            case Constants.OT_APPL_SYS_TYPE:
                            case Constants.OT_APPL_SYS_CLS:
                              checkapp(ocurrentcxnocc.SourceObjOcc(), nappvalue, bcheckapptype);
                              oappoccsfromnextfu[oappoccsfromnextfu.length] = ocurrentcxnocc.SourceObjOcc();
                              ocxnoccsfromnextfu[ocxnoccsfromnextfu.length] = ocurrentcxnocc;
                              onextfuncnodes.value[onextfuncnodes.value.length] = odummyfuncobjoccs[i];
                              bfuncwithapp = true;
                            break;
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
    }

    if (! (iselementinlist(odummyfuncobjoccs[i], g_evalfunc, nindex))) {
      g_evalfunc[g_evalfunc.length] = odummyfuncobjoccs[i];
      if (bcheckapptype[0] == true) {
        nappvalue.value[7] = nappvalue.value[7] + 1;
      }

      if (bcheckapptype[1] == true) {
        nappvalue.value[8] = nappvalue.value[8] + 1;
      }

      if (bcheckapptype[2] == true) {
        nappvalue.value[9] = nappvalue.value[9] + 1;
      }

      if (bcheckapptype[3] == true) {
        nappvalue.value[10] = nappvalue.value[10] + 1;
      }

      if (bfuncwithapp == true) {
        nappvalue.value[6] = nappvalue.value[6] + 1;
        bfuncwithapp = false;
      }
    }


    if (nwithassmod.value == 1) {
      oassignedmodels = new Array();
    }
  }
}


// ----------------------------------------------------------------------------
// Subroutine GetExtension
// This program is used if a text output was selected for the analysis with table output.
// To inform the user and to carry out the necessary changes.
// Parameter
// sExtension = file extension
// bCheckUserDialog = Variable for checking whether the user has chosen Cancel in the dialog boxes.
// ----------------------------------------------------------------------------
function getextension(sextension, bcheckuserdialog)
{
  var nuserdlg = 0;   // Variable for the user dialog box

  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 700, 160, getString("TEXT2"));
  userdialog.Text(10, 10, 460, 15, getString("TEXT7"));
  userdialog.Text(10, 25, 460, 15, getString("TEXT8"));
  userdialog.GroupBox(7, 50, 686, 60, getString("TEXT9"));
  userdialog.OptionGroup("options1");
  userdialog.OptionButton(20, 65, 580, 15, getString("TEXT10"));
  userdialog.OptionButton(20, 80, 580, 15, getString("TEXT12"));
  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_8a8c4570_2f2e_11d9_017b_e10284184242_dlg_01.hlp");

  var dlg = Dialogs.createUserDialog(userdialog); 
  // Read dialog settings from config
  var sSection = "SCRIPT_8a8c4570_2f2e_11d9_017b_e10284184242";  
  ReadSettingsDlgValue(dlg, sSection, "options1", 0);

  nuserdlg = Dialogs.show( __currentDialog = dlg);
  // Showing dialog and waiting for confirmation with OK
  if (nuserdlg == 0) {
    bcheckuserdialog.value = false;
  } else {
    bcheckuserdialog.value = true;

    // Write dialog settings to config
    WriteSettingsDlgValue(dlg, sSection, "options1");    
  }

  switch(dlg.getDlgValue("options1")) {
    case 0:
      sextension.value = "txt";
    break;
    case 1:
      sextension.value = "xls";
    break;
  }
}





// ----------------------------------------------------------------------------
// Subroutine GetFirstCheckElem
// This subprogram is used for writing the corresponding application system elements and connections of the current following function
// in the list oDummyAppOccs, oDummyCxnOccs. In doing so, the following function and its application system elements as well as
// the connections are removed from the lists oNextFuncNodes, oAppOccsFromNextFu, oCxnOccsFromNextFu.
// Parameter
// oNextFuncNodes = List of following function objects of the current function.
// oDummyAppOccs = List containing the application systems of the current following function for comparison with the application system elements in the list oAppOccsFromCurFu.
// oDummyCxnOccs = List containing the connections to the organizational units of the current following function for comparison with the connections (oCxnOccsFromCurFu) of the application system elements in the list oAppOccsFromCurFu.
// oAppOccsFromNextFu = Field containing the application systems of the following functions.
// oCxnOccsFromNextFu = Field containing the connections of the following functions.
// ----------------------------------------------------------------------------
function getfirstcheckelem(onextfuncnodes, odummyappoccs, odummycxnoccs, oappoccsfromnextfu, ocxnoccsfromnextfu)
{
  var __functionResult = null;
  var ocheckobjocc = null;   // Object for checking the change.
  var ofuncobjocc = null; 
  var bcheck = false;   // Abort criterion

  ocheckobjocc = onextfuncnodes.value[0];
  bcheck = true;
  while (bcheck == true) {
    ofuncobjocc = onextfuncnodes.value[0];
    if (ocheckobjocc!=null && ocheckobjocc!=undefined && ofuncobjocc!=null && ofuncobjocc != undefined && ocheckobjocc.IsEqual(ofuncobjocc) == true) {
      odummyappoccs[odummyappoccs.length] = oappoccsfromnextfu.value[0];
      oappoccsfromnextfu.value = doDelete(oappoccsfromnextfu, oappoccsfromnextfu.value[0]);
      odummycxnoccs[odummycxnoccs.length] = ocxnoccsfromnextfu.value[0];
      ocxnoccsfromnextfu.value = doDelete(ocxnoccsfromnextfu, ocxnoccsfromnextfu.value[0]);
      onextfuncnodes.value = doDelete(onextfuncnodes, ofuncobjocc);
    } else {
      bcheck = false;
    }
  }

  __functionResult = ocheckobjocc;
  return __functionResult;
}




// ----------------------------------------------------------------------------
// Subroutine GreatTable
// Subprogram for the individual evaluation of the selected models.
// Parameter
// oModels = List of the selected models.
// nValueTable() = List of the models' values.
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams should also be evaluated (1 = Yes / 0 = No).
// ----------------------------------------------------------------------------
function greattable(omodels, nvaluetable, nwithassmod)
{
    for (var i = 0; i < omodels.length; i++) {
        /*
        var h_g_evalfunc = new __holder(g_evalfunc);
        deleteelements(h_g_evalfunc);
        g_evalfunc = h_g_evalfunc.value;
        */
        g_evalfunc          = new Array();
        
        g_odoneobjoccs      = new Array();
        g_odoneappobjdefs   = new Array();
        g_odoneappobjoccs   = new Array();
        
        var ocurrentmodel = new __holder(null);   // Current model of list oModels
        ocurrentmodel.value = omodels[i];
        
        // Determine current model values.
        var ncurrenttabofval = new Array();   // List containing the current model's values.
        getmodelval(ocurrentmodel, ncurrenttabofval, nwithassmod);
        
        // Add current values to general values.
        for (var j = 0; j < 13; j++) {
            nvaluetable[j][i] = nvaluetable[j][i] + ncurrenttabofval[j];
        }
    }
}





// ----------------------------------------------------------------------------
// Subroutine OutputOfTable
// Subprogram for the cumulative evaluation of selected models.
// All model values are added up.
// Parameter
// oModels = List of the selected models.
// nValueTable() = List of the models' values.
// sName = Variable for the analysis name.
// nSelectedOption = Variable whether the selected models will be evaluated cumulatively ( = 0 ) or individually (= 1).
// ----------------------------------------------------------------------------
function outputoftable(omodels, nvaluetable, sname, nselectedoption)
{
  g_ooutfile.DefineF("REPORT6", getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT6_green", getString("TEXT5"), 12, Constants.C_BLACK, 0xCCFFCC, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT6_green_bold", getString("TEXT5"), 12, Constants.C_BLACK, 0xCCFFCC, Constants.FMT_LEFT | Constants.FMT_BOLD, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT6_pink", getString("TEXT5"), 12, Constants.C_BLACK, 0xFFCC99, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT6_pink_bold", getString("TEXT5"), 12, Constants.C_BLACK, 0xFFCC99, Constants.FMT_LEFT | Constants.FMT_BOLD, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT6_blue", getString("TEXT5"), 12, Constants.C_BLACK, 0xCCFFFF, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT6_blue_bold", getString("TEXT5"), 12, Constants.C_BLACK, 0xCCFFFF, Constants.FMT_LEFT | Constants.FMT_BOLD, 0, 0, 0, 0, 0, 1);
  
  var nvalue = 0; 
  var ncut = 0.0;   var i = 0;   var j = 0; 

  var sstringarray = new Array(); 
  sstringarray[0] = getString("TEXT13");
  sstringarray[1] = getString("TEXT14");
  sstringarray[2] = getString("TEXT15");
  sstringarray[3] = getString("TEXT16");
  sstringarray[4] = getString("TEXT17");
  sstringarray[5] = getString("TEXT18");
  sstringarray[6] = getString("TEXT19");
  sstringarray[7] = getString("TEXT20");
  sstringarray[8] = getString("TEXT21");
  sstringarray[9] = getString("TEXT22");
  sstringarray[10] = getString("TEXT23");
  sstringarray[11] = getString("TEXT24");
  sstringarray[12] = getString("TEXT25");
  sstringarray[13] = getString("TEXT26");

  if (nselectedoption == 0) {
  // Cumulated
  // Individual
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF(sname, 50, "REPORT6_green_bold");
    g_ooutfile.TableCellF(getString("TEXT27"), 10, "REPORT6_pink_bold");
    for ( i = 0 ; i <= 13 ; i++ ){
      switch(i) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 11:
        case 12:
          g_ooutfile.TableRow();
          g_ooutfile.TableCellF(sstringarray[i], 50, "REPORT6_green");
          g_ooutfile.TableCellF(""+nvaluetable[i], 10, "REPORT6_pink");
        break;
        
        case 6:
        case 7:
        case 8:
        case 9:
        case 10:
          g_ooutfile.TableRow();
          g_ooutfile.TableCellF(sstringarray[i], 50, "REPORT6_green");
          if (nvaluetable[0] == 0) {
            g_ooutfile.TableCellF("0", 10, "REPORT6_pink");
          } else {
            ncut = (nvaluetable[i] * 100) / nvaluetable[0];
            ncut = round2(ncut);
            g_ooutfile.TableCellF(""+ncut, 10, "REPORT6_pink");
          }
        break;
        
        case 13:
          g_ooutfile.TableRow();
          g_ooutfile.TableCellF(sstringarray[i], 50, "REPORT6_green");
          if (nvaluetable[11] == 0) {
            g_ooutfile.TableCellF("0", 10, "REPORT6_pink_bold");
          } else {
            ncut = nvaluetable[12] / nvaluetable[11];
            ncut = round2(ncut);
            g_ooutfile.TableCellF(""+ncut, 10, "REPORT6_pink_bold");
          }
        break;
      }
    }
  }
  else {
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF(sname, 50, "REPORT6_green_bold");
    var sFormat;
    for ( i = 0 ; i < omodels.length ; i++ ){
      sFormat = (i%2 == 0) ? "REPORT6_pink_bold" : "REPORT6_blue_bold";
      g_ooutfile.TableCellF(getString("TEXT28")+" "+(i+1), 10, sFormat);
    }

    for ( i = 0 ; i < 13+1 ; i++ ){
      switch(i) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 11:
        case 12:
          g_ooutfile.TableRow();
          g_ooutfile.TableCellF(sstringarray[i], 50, "REPORT6_green");
          for ( j = 0 ; j < omodels.length ; j++ ){
            sFormat = (j%2 == 0) ? "REPORT6_pink" : "REPORT6_blue";
            g_ooutfile.TableCellF(""+nvaluetable[i][j], 10, sFormat);
          }
        break;
        
        case 6:
        case 7:
        case 8:
        case 9:
        case 10:
          g_ooutfile.TableRow();
          g_ooutfile.TableCellF(sstringarray[i], 50, "REPORT6_green");
          for ( j = 0 ; j < omodels.length ; j++ ){
            sFormat = (j%2 == 0) ? "REPORT6_pink" : "REPORT6_blue";
            if (nvaluetable[0][j] == 0) {
              g_ooutfile.TableCellF("0", 10, sFormat);
            } else {
              ncut = (nvaluetable[i][j] * 100) / nvaluetable[0][j];
              ncut = round2(ncut);
              g_ooutfile.TableCellF(""+ncut, 10, sFormat);
            }
          }
        break;

        case 13:
          g_ooutfile.TableRow();
          g_ooutfile.TableCellF(sstringarray[i], 50, "REPORT6_green");
          for ( j = 0 ; j < omodels.length ; j++ ){
            sFormat = (j%2 == 0) ? "REPORT6_pink_bold" : "REPORT6_blue_bold";
            if (nvaluetable[11][j] == 0) {
              g_ooutfile.TableCellF("0", 10, sFormat);
            } else {
              ncut = nvaluetable[12][j] / nvaluetable[11][j];
              ncut = round2(ncut);
              g_ooutfile.TableCellF(""+ncut, 10, sFormat);
            }
          }
        break;
      }
    }
  }
}





// ----------------------------------------------------------------------------
// Subroutine OutReportHead
// Subprogram for the title.
// Parameter
// oModels = List of the selected models.
// sName = analysis names
// bOutCheck = Variable whether title is in table or text.
// ----------------------------------------------------------------------------
function outreporthead(omodels, sname, boutcheck)
{
    var spath = "";   // Path of the current model.
    var soutputline = ""; 
    var i = 0;   var j = 0; 
    
    var ocurrentuser = ArisData.getActiveUser();
    g_ooutfile.DefineF("REPORT1", getString("TEXT5"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
    g_ooutfile.DefineF("REPORT2", getString("TEXT5"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    g_ooutfile.DefineF("REPORT3", getString("TEXT5"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    
    if (boutcheck == true) {
        g_ooutfile.TableRow();
        g_ooutfile.TableCell((getString("TEXT29") + sname), 20, getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
        g_ooutfile.TableRow();
        g_ooutfile.TableCell("", 20, getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
        g_ooutfile.Output(getString("TEXT30"), getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT, 0);
        g_ooutfile.OutputField(Constants.FIELD_DATE, getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT);
        g_ooutfile.Output(" ", getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT, 0);
        g_ooutfile.OutputField(Constants.FIELD_TIME, getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT);
        g_ooutfile.TableRow();
        g_ooutfile.TableCell((getString("TEXT31") + ArisData.getActiveDatabase().ServerName()), 20, getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
        g_ooutfile.TableRow();
        g_ooutfile.TableCell((getString("TEXT32") + ArisData.getActiveDatabase().Name(g_nloc)), 20, getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
        g_ooutfile.TableRow();
        g_ooutfile.TableCell((getString("TEXT33") + ocurrentuser.Name(g_nloc)), 20, getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
        g_ooutfile.TableRow();
        g_ooutfile.TableCell((getString("TEXT34") + Context.getSelectedFile()), 20, getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
        g_ooutfile.TableRow();
        g_ooutfile.TableCell(getString("TEXT35"), 20, getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
        g_ooutfile.TableRow();
        g_ooutfile.TableRow();
        g_ooutfile.TableCell(getString("TEXT36"), 20, getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER | Constants.FMT_BOLD, 0);
        var nColor;
        for ( i = 0 ; i < omodels.length ; i++ ){
            g_ooutfile.TableRow();
            spath = omodels[i].Group().Path(g_nloc);
            nColor = (i%2 == 0) ? 0xFFCC99 : 0xCCFFFF;
            g_ooutfile.TableCell( (i + 1) + ".) " + spath + "\\" + omodels[i].Name(g_nloc) + " (" + omodels[i].Type() + ")", 20, getString("TEXT5"), 12, Constants.C_BLACK, nColor, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
        }
        g_ooutfile.TableRow();
    }
    else {
        // BLUE-17783 Update report header/footer
        var borderColor = getColorByRGB( 23, 118, 191);        
        
        // graphics used in header
        var pictleft = Context.createPicture(Constants.IMAGE_LOGO_LEFT);
        var pictright = Context.createPicture(Constants.IMAGE_LOGO_RIGHT);    
        
        // Header + footer
        setFrameStyle(g_ooutfile, Constants.FRAME_BOTTOM);
        
        g_ooutfile.BeginHeader();
        g_ooutfile.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        g_ooutfile.TableRow();
        g_ooutfile.TableCell("", 26, getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
        g_ooutfile.OutGraphic(pictleft, - 1, 40, 15);
        g_ooutfile.TableCell(Context.getScriptInfo(Constants.SCRIPT_TITLE), 48, getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
        g_ooutfile.TableCell("", 26, getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
        g_ooutfile.OutGraphic(pictright, - 1, 40, 15);
        g_ooutfile.EndTable("", 100, getString("TEXT5"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        g_ooutfile.EndHeader();
        
        setFrameStyle(g_ooutfile, Constants.FRAME_TOP);
        
        g_ooutfile.BeginFooter();
        g_ooutfile.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        g_ooutfile.TableRow();
        g_ooutfile.TableCell("" + (new __date()) + " " + (new __time()), 26, getString("TEXT5"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
        g_ooutfile.TableCell(Context.getSelectedFile(), 48, getString("TEXT5"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
        g_ooutfile.TableCell("", 26, getString("TEXT5"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
        g_ooutfile.Output(getString("TEXT37"), getString("TEXT5"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
        g_ooutfile.OutputField(Constants.FIELD_PAGE, getString("TEXT5"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
        g_ooutfile.Output(getString("TEXT38"), getString("TEXT5"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
        g_ooutfile.OutputField(Constants.FIELD_NUMPAGES, getString("TEXT5"), 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
        g_ooutfile.EndTable("", 100, getString("TEXT5"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        g_ooutfile.EndFooter();
        
        g_ooutfile.ResetFrameStyle();
        
        // Headline
        g_ooutfile.OutputLnF("", "REPORT1");
        g_ooutfile.OutputLnF(getString("TEXT2"), "REPORT1");
        g_ooutfile.OutputLnF("", "REPORT1");
        
        // Information header.
        g_ooutfile.OutputLnF((getString("TEXT31") + ArisData.getActiveDatabase().ServerName()), "REPORT2");
        g_ooutfile.OutputLnF((getString("TEXT32") + ArisData.getActiveDatabase().Name(g_nloc)), "REPORT2");
        g_ooutfile.OutputLnF((getString("TEXT33") + ArisData.getActiveUser().Name(g_nloc)), "REPORT2");
        g_ooutfile.OutputLnF("", "REPORT2");
        for ( i = 0 ; i < omodels.length ; i++ ){
            spath = omodels[i].Group().Path(g_nloc);
            soutputline = (i + 1) + ".)  " + spath + "\\" + omodels[i].Name(g_nloc) + " (" + omodels[i].Type() + ")";
            g_ooutfile.OutputLnF(soutputline, "REPORT2");
        }
        
        g_ooutfile.OutputLnF("", "REPORT2");
    }

  
    function setFrameStyle(outfile, iFrame) { 
        outfile.SetFrameStyle(Constants.FRAME_TOP, 0); 
        outfile.SetFrameStyle(Constants.FRAME_LEFT, 0); 
        outfile.SetFrameStyle(Constants.FRAME_RIGHT, 0); 
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 0);
        
        outfile.SetFrameStyle(iFrame, 50, Constants.BRDR_NORMAL);
    }  
}





// ----------------------------------------------------------------------------
// Subroutine SingleTable
// Subprogram for the cumulative evaluation of selected models.
// All model values are added up.
// Parameter
// oModels = List of the selected models.
// nValueTable() = List of the models' values.
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams should also be evaluated (1 = Yes / 0 = No).
// ----------------------------------------------------------------------------
function singletable(omodels, nvaluetable, nwithassmod)
{
    // setzen
    for (var i = 0 ; i < omodels.length ; i++ ){
        var ocurrentmodel = new __holder(null);   // Current model of list oModels
        ocurrentmodel.value = omodels[i];
        /*
        var h_g_evalfunc = new __holder(g_evalfunc);
        deleteelements(h_g_evalfunc);
        g_evalfunc = h_g_evalfunc.value;    
        */
        
        g_evalfunc        = new Array();
        g_odoneobjoccs    = new Array();
        g_odoneappobjoccs = new Array();
        g_odoneappobjdefs = new Array();
        
        // Determine current model values.
        var ncurrenttabofval = new Array();   // List containing the current model's values.
        getmodelval(ocurrentmodel, ncurrenttabofval, nwithassmod);
        
        // Add current values to general values.
        for (var j = 0 ; j < 13+1; j++) {
            nvaluetable[j] = nvaluetable[j] + ncurrenttabofval[j];
        }
    }
}





// ----------------------------------------------------------------------------
// Subroutine UserDlg
// This subprogram is needed to get information from the user to obtain the necessary settings for the analysis.
// Parameter
// nSelectedOption  = Variable for checking whether the selected models should be evaluated cumulatively ( = 0 ) or individually (= 1).
// sName = Variable for the analysis name.
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams should also be evaluated (1 = Yes / 0 = No).
// bCheckUserDialog = Variable for checking whether the user has chosen Cancel in the dialog boxes.
// ----------------------------------------------------------------------------
function userdlg(nselectedoption, sname, nwithassmod, bcheckuserdialog)
{

  var nuserdlg = 0;   // Variable for the user dialog box

  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 700, 210, getString("TEXT2"));
  userdialog.Text(10, 10, 460, 15, getString("TEXT40"));
  userdialog.Text(10, 25, 460, 15, getString("TEXT8"));
  userdialog.CheckBox(10, 50, 580, 15, getString("TEXT41"), "Check");
  userdialog.GroupBox(7, 75, 686, 55, getString("TEXT42"));
  userdialog.OptionGroup("options2");
  userdialog.OptionButton(20, 90, 580, 15, getString("TEXT43"));
  userdialog.OptionButton(20, 105, 580, 15, getString("TEXT44"));
  userdialog.Text(10, 135, 460, 15, getString("TEXT45"));
  userdialog.TextBox(10, 155, 500, 20, "Text0");
  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_8a8c4570_2f2e_11d9_017b_e10284184242_dlg_02.hlp");

  var dlg = Dialogs.createUserDialog(userdialog); 

  // Read dialog settings from config
  var sSection = "SCRIPT_8a8c4570_2f2e_11d9_017b_e10284184242";  
  ReadSettingsDlgValue(dlg, sSection, "options2", 1);
  ReadSettingsDlgText(dlg, sSection, "Text0", getString("TEXT46"));
  ReadSettingsDlgValue(dlg, sSection, "Check", 0);

  nuserdlg = Dialogs.show( __currentDialog = dlg);      // Showing dialog and waiting for confirmation with OK

  nselectedoption.value = dlg.getDlgValue("options2");
  sname.value = dlg.getDlgText("Text0");
  nwithassmod.value = dlg.getDlgValue("Check");
  if (nuserdlg == 0) {
    bcheckuserdialog.value = false;
  } else {
    bcheckuserdialog.value = true;
    
    // Write dialog settings to config    
    WriteSettingsDlgValue(dlg, sSection, "options2");
    WriteSettingsDlgText(dlg, sSection, "Text0");
    WriteSettingsDlgValue(dlg, sSection, "Check");
  }

}





// ----------------------------------------------------------------------------
// Function  CheckVal
// This sub is used for checking whether an entry was made in the value table.
// Parameter
// nValueTable = Table containing values.
// nSelectedOption = cumulatively( = 0 ) or individually(= 1)
// ----------------------------------------------------------------------------
function checkval(nvaluetable, nselectedoption)
{
  var __functionResult = false;
  
  if (nselectedoption == 0) {
    for (var i = 0 ; i < nvaluetable.length ; i++ ){
      if (nvaluetable[i] != 0) {
        __functionResult = true;
      }
    }
  } else {
    for (var i = 0 ; i < nvaluetable.length ; i++ ){
      for (var j = 0 ; j < nvaluetable[i].length ; j++ ){
        if (nvaluetable[i][j] != 0) {
          __functionResult = true;
        }
      }
    }
  }

  return __functionResult;
}






// ----------------------------------------
// 
// Common traversation functions
// 
// ----------------------------------------

// model graph traversation within specified model context
// function occs are handled by function "HandleFuncObject" with specific implementation
// returns function context with path traversation result
function traversemodelgraph(ocurrentmodel, modelcontext, ocurrentfuncobjocc, nwithassmod)
{
  var __functionResult = new __usertype_tfunccontext();

  var onextfuncnodes    = new __holder(null);   // List of following function objects of the current function.
  var odummyobjoccs     = new __holder(null);   // List of function occurrences for intermediate saving.
  var odummy2objoccs    = new __holder(null);   // List of function occurrences for intermediate saving.
  var ocurrentdummyocc  = new __holder(null);   // Current saving element.
  var ostorenodes       = null;                 // List for intermediate saving of following function objects of the current function.

  var bcheck     = false;   // Variable for checking whether the connections and information carriers of the function are correct.
  var bcheckit   = false; 
  var bdonefunc  = false;   // Variable for checking whether the current function has already been evaluated.
  var bfunccheck = false;   // Variable for checking whether relevant function occurrences have already been considered in the evaluation.
  var i = 0;   var j = 0; 

  onextfuncnodes.value  = new Array();
  ostorenodes           = new Array();
  odummyobjoccs.value   = new Array();
  odummy2objoccs.value  = new Array();

  var funccontext = new __usertype_tfunccontext(); 
  initfunccontext(funccontext);

  var traverseresults = new Array();    // __usertype_ttraverseresult()

  // Find following functions
  findnextfunc(ocurrentmodel, ocurrentfuncobjocc.value, odummyobjoccs);

  // Found functions, information carriers and connections are checked.
  if (odummyobjoccs.value.length > 0) {
    i = 0;
    bcheckit = false;
    while (i <= (odummyobjoccs.value.length - 1)) {
      bcheck = false;
      ocurrentdummyocc.value = odummyobjoccs.value[i];
      bcheck = checkright(ocurrentmodel, ocurrentdummyocc, nwithassmod);
      bfunccheck = checkfuncocc(ocurrentdummyocc.value);
      if (bfunccheck == true) {
        // If the connections to be evaluated they will be added to the list.
        if (bcheck == true && ! (ocurrentdummyocc.value.IsEqual(ocurrentfuncobjocc.value) == true)) {
        // If they do not exist, search for the following functions.
          onextfuncnodes.value[onextfuncnodes.value.length] = ocurrentdummyocc.value;
        }
        else {
          findnextfunc(ocurrentmodel, ocurrentdummyocc.value, odummy2objoccs);
          odummyobjoccs.value = doDelete(odummyobjoccs, ocurrentdummyocc.value);
          bcheckit = true;
          for ( j = 0 ; j < odummy2objoccs.value.length ; j++ ){
            ocurrentdummyocc.value = odummy2objoccs.value[j];
            odummyobjoccs.value[odummyobjoccs.value.length] = ocurrentdummyocc.value;
          }
          
          odummy2objoccs.value = new Array();
        }
      }

      if (bcheckit == true) {
        i = 0;
        bcheckit = false;
      } else {
        i++;
      }
    }

    for ( i = 0 ; i < onextfuncnodes.value.length ; i++ ){
      ostorenodes[ostorenodes.length] = onextfuncnodes.value[i];
    }

    g_odonegenfuncobjoccs = new Array();

    handlefuncobject(ocurrentmodel, modelcontext, ocurrentfuncobjocc, funccontext, onextfuncnodes, nwithassmod);

    var succfunccontext = new __usertype_tfunccontext(); 
    var nnumsuccs = 0; 
    nnumsuccs = ostorenodes.length;
    if (nnumsuccs > 0) {
      traverseresults = new Array();
      for ( i = 0 ; i < nnumsuccs ; i++ ){
        traverseresults[i] = new __usertype_ttraverseresult();   
        traverseresults[i].ofuncobjocc = ostorenodes[i];
      }
    }

    var ofuncobjocc = new __holder(null); 

    // Recursive call of following elements in case they have not been evaluated.
    for ( i = 0 ; i < ostorenodes.length ; i++ ){
      ofuncobjocc.value = ostorenodes[i];
      bdonefunc = checkdonefunc(ofuncobjocc.value);
      if (bdonefunc == false) {
        succfunccontext = traversemodelgraph(ocurrentmodel, modelcontext, ofuncobjocc, nwithassmod);
        setfuncsucctraverseresult(ofuncobjocc.value, traverseresults, succfunccontext);
      }
    }

    handlefuncsucctraverseresult(ocurrentfuncobjocc.value, modelcontext, funccontext, traverseresults, nnumsuccs);
  }
  else {
    handlefuncobject(ocurrentmodel, modelcontext, ocurrentfuncobjocc, funccontext, odummyobjoccs, nwithassmod);
    handlefuncsucctraverseresult(ocurrentfuncobjocc.value, modelcontext, funccontext, traverseresults, 0);
  }

  __functionResult = funccontext;
  return __functionResult;
}




function getnamesofnextfunctions(olist)
{
  var __functionResult = "";
  var sres = "";   var i = 0; 

  for ( i = 0 ; i < olist.length ; i++ ){
    if (i > 0) {
      sres += ", ";
    }
    sres += olist[i].ObjDef().Name(g_nloc);
  }

  __functionResult = sres;
  return __functionResult;
}




// ------------------------------------------------------------------------
// Subroutine FindNextFunc for determining the next function.
// Parameter
// oCurrentModel = current model.
// oCurrentObjOcc = current object(Occ) the following functions of which are searched for.
// oTargetFuncObjOccs = List of functions which have been found as successors.
// ------------------------------------------------------------------------
function findnextfunc(ocurrentmodel, ocurrentobjocc, otargetfuncobjoccs)
{
  var i = 0; 
  var otargetobjoccs = null;   // List of following object occurrences of the current model.
  otargetobjoccs = ocurrentmodel.value.GetSuccNodes(ocurrentobjocc);

  if (otargetobjoccs.length > 0) {
    for ( i = 0 ; i < otargetobjoccs.length ; i++ ){
      switch(otargetobjoccs[i].ObjDef().TypeNum()) {
        case Constants.OT_FUNC:
          otargetfuncobjoccs.value[otargetfuncobjoccs.value.length] = otargetobjoccs[i];
        break;

        default:
          findnextfunc(ocurrentmodel, otargetobjoccs[i], otargetfuncobjoccs);
        }
    }
  }
  otargetobjoccs = null;
}




// ------------------------------------------------------------------------
// Subroutine GetStartFunc
// Subprogram for determining the start functions of the current model.
// Parameter
// oCurrentModel = current model.
// oStartFunc = List of start functions(ObjOcc) of the current model.
// ------------------------------------------------------------------------
function getstartfunc(ocurrentmodel, ostartfunc)
{
  var ostartobjoccs = null;   // List of start object occurrences of the model.
  var odummyobjoccs = new __holder(null);   // List of object occurrences.
  var bcheck = false;   
  var i = 0;   var j = 0; 

  odummyobjoccs.value = new Array();
  ocurrentmodel.value.BuildGraph(true);
  ostartobjoccs = ocurrentmodel.value.StartNodeList();
  if (ostartobjoccs.length > 0) {
    // Elements that are not of the function or event type will be removed from the list.
    while (bcheck == false) {
      bcheck = true;
      for ( i = 0 ; i < ostartobjoccs.length ; i++ ){
        if (! (ostartobjoccs[i].ObjDef().TypeNum() == Constants.OT_FUNC || ostartobjoccs[i].ObjDef().TypeNum() == Constants.OT_EVT)) {
          ostartobjoccs = doDelete(ostartobjoccs, ostartobjoccs[i]);
          bcheck = false;
          break;
        }
      }
    }

    for ( i = 0 ; i < ostartobjoccs.length ; i++ ){
      if (ostartobjoccs[i].ObjDef().TypeNum() == Constants.OT_FUNC) {
        ostartfunc[ostartfunc.length] = ostartobjoccs[i];
      }
      else {
        findnextfunc(ocurrentmodel, ostartobjoccs[i], odummyobjoccs);
        if (odummyobjoccs.value.length > 0) {
          for ( j = 0 ; j < odummyobjoccs.value.length ; j++ ){
            ostartfunc[ostartfunc.length] = odummyobjoccs.value[j];
          }
        }
      }
    }
  }
}

function doDelete(arr, obj)
{
    if (typeof(arr)=="object" && arr.constructor.toString().indexOf("__isHolder")!=-1)
        arr = arr.value;
    
    if(arr==null || arr.length==0)
        return arr;
    
    if(!isNaN(obj)) {
        arr.splice(obj, 1);
    } else {
        for(var i=0; i<arr.length; i++) {
            if(arr[i] == obj) {
                arr.splice(i, 1);
                break;
            }
        }
    }
    return arr;
}


main();
