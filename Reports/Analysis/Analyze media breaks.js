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

// localization
var g_sstringarray = new Array(); 
g_sstringarray[0]  = getString("TEXT1");
g_sstringarray[1]  = getString("TEXT2");
g_sstringarray[2]  = getString("TEXT3");
g_sstringarray[3]  = getString("TEXT4");
g_sstringarray[4]  = getString("TEXT5");
g_sstringarray[5]  = getString("TEXT6");
g_sstringarray[6]  = getString("TEXT7");
g_sstringarray[7]  = getString("TEXT8");
g_sstringarray[8]  = getString("TEXT9");
g_sstringarray[9]  = getString("TEXT10");
g_sstringarray[10] = getString("TEXT11");
g_sstringarray[11] = getString("TEXT12");
g_sstringarray[12] = getString("TEXT13");


// common for all traversing analysis scripts
var g_odoneobjoccs = null; // List of object occurrences that have already been evaluated.
var g_odonefunc = null; 
var g_odonegenfuncobjoccs = null; 


// common types with specific contents/initialization/cleaner for all traversing analysis scripts:

// traversing context for model
__usertype_tmodelcontext = function() {
  this.nmedvalue = new Array();
}

// initialization of traversing context for model
function initmodelcontext(modelcontext)
{
  for (var i=0;i<10;i++) {
    modelcontext.nmedvalue[i] = 0;
  }
}

// cleaner of traversing context for model
function cleanmodelcontext(modelcontext)
{
}

// traversing context for function
__usertype_tfunccontext = function() {
  this.oinfooccsfromcurfu = null;       // List of information carriers of the current function.
  this.ocxnoccsfromcurfu = null;        // List of connection occurrences of the current function.
  this.oinfooccsfromnextfu = null;      // Field of information carriers of the following functions.
  this.ocxnoccsfromnextfu = null;       // Field showing the connections of the following functions.
}

// initialization of traversing context for function
function initfunccontext(funccontext)
{
  funccontext.oinfooccsfromcurfu = new Array();
  funccontext.ocxnoccsfromcurfu = new Array();
  funccontext.oinfooccsfromnextfu = new Array();
  funccontext.ocxnoccsfromnextfu = new Array();
}

// cleaner of traversing context for function
function cleanfunccontext(context)
{
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
var g_ooutfile = null; // Output object.
var g_nloc = 0; // Language-ID.
var g_odoneinfoobjdefs = null; // List of Infoelement.
var g_odoneinfoinobjdefs = null; 
var g_odoneinfooutobjdefs = null; 

var g_ndoneinfoinsym = new Array(); 
var g_ndoneinfosym = new Array(); 
var g_ndoneinfooutsym = new Array(); 


function main()
{
  if (Context.getSelectedFormat() == Constants.OUTTEXT) {
    // BLUE-14018      
    Context.setProperty("use-new-output", false);
  } 
    
  var i;

  var omodels = null;   // List of selected models.
  var ncheckmsg = 0;   // Variable for checking the treatment of the message (nCheckMsg = 2 / Cancel was selected).
  var ncheckmsg2 = 0;   // Variable for checking the treatment of the message (nCheckMsg = 2 / Cancel was selected).
  var nwithassmod = new __holder(0);   // Variable to check whether the function allocation diagrams should also be evaluated (1 = Yes / 0 = No).
  var nselectedoption = new __holder(0);   // Variable for a cumulative ( = 0 ) or single (= 1) evaluation of the selected models.
  var nvaluetable = new Array();   // List of the models' values.
  var berror = false; 
  var sname = new __holder("");   // Variable for the analysis name.
  var sextension = new __holder("");   // Variable for the file extension.
  var boutput = false;   // Variable for title (True = table / False = text).
  var bmodellok = false;   // Variable for checking whether the model is of the correct type.
  var bcheckuserdialog = new __holder(false);   // Variable for checking whether the user has selected Cancel in the dialog boxes.

  var odummymodels = null;   // List of models for temporary saving.

  odummymodels = ArisData.getSelectedModels();
  g_nloc = Context.getSelectedLanguage();
  g_ooutfile = Context.createOutputObject();
  g_odoneobjoccs = new Array();
  g_odonefunc = new Array();
  g_odonegenfuncobjoccs = new Array();
  g_odoneinfoinobjdefs = new Array();
  g_odoneinfooutobjdefs = new Array();
  g_odoneinfoobjdefs = new Array();
  omodels = new Array();
  g_ndoneinfoinsym = new Array(); 
  g_ndoneinfosym = new Array(); 
  g_ndoneinfooutsym = new Array(); 
  sextension.value = "";
  bcheckuserdialog.value = true;
  berror = false;

  bmodellok = true;

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
        case Constants.MT_EEPC_ROW:
        case Constants.MT_EEPC_TAB:
        case Constants.MT_EEPC_TAB_HORIZONTAL:        
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
        ncheckmsg2 = Dialogs.MsgBox(getString("TEXT14"), Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT15"));
      } else {
        Dialogs.MsgBox(getString("TEXT14"), Constants.MSGBOX_BTN_OK, getString("TEXT15"));
        ncheckmsg2 = 2;
      }
    }

    if (! (ncheckmsg2 == 2)) {
      // Selection of output.
      if (! (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX || Context.getSelectedFormat() == Constants.OUTTEXT)) {
        ncheckmsg = Dialogs.MsgBox(getString("TEXT16"), Constants.MSGBOX_BTN_YESNOCANCEL | Constants.MSGBOX_ICON_QUESTION, getString("TEXT15"));
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
            nvaluetable = new Array();
            for (var k = 0; k < 11; k++) {
                nvaluetable[k] = 0.0;
            }
            singletable(omodels, nvaluetable, nwithassmod);
          } else {
            // Every model separately.
            nvaluetable = new Array();
            for (var k = 0; k < 11; k++) {
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
          }
          else {
            boutput = true;
          }

          if (boutput == false) {
            outreporthead(omodels, sname.value, boutput);
          }

          g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
          if (boutput == true) {
            outreporthead(omodels, sname.value, boutput);
          }

          outputoftable(omodels, nvaluetable, sname.value, nselectedoption.value);
          g_ooutfile.EndTable(sname.value, 100, getString("TEXT17"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
          
          if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) {
            g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            outputCharts(omodels, nvaluetable, sname.value, nselectedoption.value);          
            g_ooutfile.EndTable(getString("TEXT41"), 100, getString("TEXT17"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
          }
          g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
        }
        else {
          berror = true;
        }
      }
      else {
        berror = true;
      }
    }
    else {
      berror = true;
    }
  }
  else {
    Dialogs.MsgBox(getString("TEXT18"), Constants.MSGBOX_BTN_OK, getString("TEXT15"));
    berror = true;
  }

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
    nRatio = (nvaluetable[8] == 0) ? 0 : nvaluetable[9]/nvaluetable[8];
    arrData.push(nRatio);
    arrLegend.push(getString("TEXT42"));
  } else {
    // Every model separately
    for (i=0; i<omodels.length; i++) {
      nRatio = (nvaluetable[8][i] == 0) ? 0 : nvaluetable[9][i]/nvaluetable[8][i];
      arrData.push(nRatio);
      arrLegend.push(getString("TEXT13")+" "+(i+1));
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
    chart.getYAxis().setTitle(getString("TEXT43"));

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
  var i;

  var ofuncobjocc = null;   // List of function occurrences.
  var ostartfunc = null;   // List of start functions of the current model.
  var bdonefunc = false;   // Variable for checking whether the current function has already been evaluated.
  var funccontext = new __usertype_tfunccontext(); 

  var modelcontext = new __holder(new __usertype_tmodelcontext()); 
  initmodelcontext(modelcontext.value);

  // Number of functions in the model.
  ofuncobjocc = ocurrentmodel.value.ObjOccListFilter(Constants.OT_FUNC);
  ncurrenttabofval[0] = ofuncobjocc.length;

  ostartfunc = new Array();
  getstartfunc(ocurrentmodel, ostartfunc);
  ocurrentmodel.value.BuildGraph(false);
  for ( i = 0 ; i < ostartfunc.length ; i++ ){
    bdonefunc = checkdonefunc(ostartfunc[i]);
    if (bdonefunc == false) {
      funccontext = traversemodelgraph(ocurrentmodel, modelcontext, new __holder(ostartfunc[i]), nwithassmod);
    }
  }

  ncurrenttabofval[1] = g_odoneinfoobjdefs.length;          // All together allocated information carriers.
  ncurrenttabofval[2] = modelcontext.value.nmedvalue[2];    // Input information carriers.
  ncurrenttabofval[3] = modelcontext.value.nmedvalue[3];    // Output information carriers.
  ncurrenttabofval[4] = modelcontext.value.nmedvalue[4];    // Functions with at least 1 input information carriers.
  ncurrenttabofval[5] = modelcontext.value.nmedvalue[5];    // Functions with at least 1 output information carriers.
  ncurrenttabofval[6] = modelcontext.value.nmedvalue[6];    // Functions with at least 1 input information carrier and 1 output information carrier.
  ncurrenttabofval[7] = modelcontext.value.nmedvalue[7];    // Functions with different input information carriers and output information carriers.
  ncurrenttabofval[8] = modelcontext.value.nmedvalue[8];    // Number of function transitions.
  ncurrenttabofval[9] = modelcontext.value.nmedvalue[9];    // function transitions with media breaks.

  cleanmodelcontext(modelcontext.value);
}


// standard function handler routine.
// implementation is specific for analysis
function handlefuncobject(ocurrentmodel, modelcontext, ocurrentfuncobjocc, funccontext, onextfuncnodes, nwithassmod)
{
  var bcheck = checkright(ocurrentmodel, ocurrentfuncobjocc, nwithassmod);
  if (bcheck == true) {
    // Information carriers and connections of the current element.
    getinfoandcxncurfun(ocurrentmodel, ocurrentfuncobjocc, funccontext.oinfooccsfromcurfu, funccontext.ocxnoccsfromcurfu, modelcontext.value.nmedvalue, nwithassmod);
    if (onextfuncnodes.value.length > 0) {
      // Increase number of function transitions.
      modelcontext.value.nmedvalue[8] = (modelcontext.value.nmedvalue[8] + onextfuncnodes.value.length);
      // Orgelements and connections of the following functions.
      getinfoandcxnnextfu(ocurrentmodel, onextfuncnodes, funccontext.oinfooccsfromnextfu, funccontext.ocxnoccsfromnextfu, nwithassmod, modelcontext.value.nmedvalue);
    }

    // Change of media.
    var h_nmedvalue             = new __holder(modelcontext.value.nmedvalue) ;
    var h_oinfooccsfromcurfu    = new __holder(funccontext.oinfooccsfromcurfu);
    var h_ocxnoccsfromnextfu    = new __holder(funccontext.ocxnoccsfromnextfu);
    var h_oinfooccsfromnextfu   = new __holder(funccontext.oinfooccsfromnextfu);
    
    checkmedchange(onextfuncnodes, h_oinfooccsfromcurfu, funccontext.ocxnoccsfromcurfu, h_oinfooccsfromnextfu, h_ocxnoccsfromnextfu, h_nmedvalue);

    modelcontext.value.nmedvalue    = h_nmedvalue.value;
    funccontext.oinfooccsfromcurfu  = h_oinfooccsfromcurfu.value;
    funccontext.ocxnoccsfromnextfu  = h_ocxnoccsfromnextfu.value;
    funccontext.oinfooccsfromnextfu = h_oinfooccsfromnextfu.value;
  }
}




// standard dfs traverse result handler routine.
// specific implementation for handling of dfs traverse result for media change
function handlefuncsucctraverseresult(ofuncobjocc, modelcontext, funccontext, traverseresults, nnumsuccs)
{
}





// ------------------------------------------------------------------------
// Subroutine CheckChange
// Subprogram for determining media breaks.
// Parameter
// oDummyInfoOccs = List containing the information carriers of the current following function.
// oInfoOccsFromCurFu = List containing the information carrier of the current function.
// nMedValue() = List of results.
// ------------------------------------------------------------------------
function checkchange(odummyinfooccs, oinfooccsfromcurfu, nmedvalue)
{
  var i,j;
  var bcheck = false; // Indicator flag if both fields have the same orgelements.
  for ( i = 0 ; i < odummyinfooccs.length ; i++ ){
    for ( j = 0 ; j < oinfooccsfromcurfu.value.length ; j++ ){
      if (oinfooccsfromcurfu.value[j].ObjDef().IsEqual(odummyinfooccs[i].ObjDef()) == true && oinfooccsfromcurfu.value[j].OrgSymbolNum() == odummyinfooccs[i].OrgSymbolNum()) {
        bcheck = true;
      }
    }
  }

  if (bcheck == false) {
    nmedvalue.value[9] = nmedvalue.value[9] + 1;
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

  var i;

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
// Subroutine CheckFunc
// Subprogram that checks whether the information carrier of the current function occurrence has already been evaluated.
// Parameter
// oCurrentObjOcc = current object occurrence.
// ------------------------------------------------------------------------
function checkfunc(ocurrentobjocc)
{
  var __functionResult = false;

  var i;

  if (g_odonefunc.length > 0) {
    for ( i = 0 ; i < g_odonefunc.length ; i++ ){
      if (ocurrentobjocc.IsEqual(g_odonefunc[i]) == true) {
        __functionResult = true;
        break;
      }
    }
  }

  if (__functionResult == false) {
    g_odonefunc[g_odonefunc.length] = ocurrentobjocc;
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

  var i;

  if (g_odonegenfuncobjoccs.length > 0) {
    for ( i = 0 ; i < g_odonegenfuncobjoccs.length ; i++ ){
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
// Subroutine CheckInBoth
// Subprogram that checks whether the current function occurrence has different Input- OutputInfo. elements.
// Parameter
// oInfoInCxnToOccs = List of object occurrences which are linked by the connection occurrences of the 'provides output for' type.
// oInfoOutCxnToOccs = List of object occurrences which are linked by the connection occurrencese of the 'creates output to' type.
// ------------------------------------------------------------------------
function checkinboth(oinfooutcxntooccs, oinfoincxntooccs)
{
  var __functionResult = false;

  var i, j;
  var bcheckit = false; 

  __functionResult = true;
  for ( i = 0 ; i < oinfooutcxntooccs.length ; i++ ){
    bcheckit = false;
    for ( j = 0 ; j < oinfoincxntooccs.length ; j++ ){
      if (oinfooutcxntooccs[i].IsEqual(oinfoincxntooccs[j]) == true && oinfooutcxntooccs[i].OrgSymbolNum() == oinfoincxntooccs[j].OrgSymbolNum()) {
        bcheckit = true;
        break;
      }
    }

    if (bcheckit == true) {
      __functionResult = false;
      break;
    }
  }

  if (__functionResult == true) {
    for ( i = 0 ; i < oinfoincxntooccs.length ; i++ ){
      bcheckit = false;
      for ( j = 0 ; j < oinfooutcxntooccs.length ; j++ ){
        if (oinfooutcxntooccs[j].IsEqual(oinfoincxntooccs[i]) == true && oinfooutcxntooccs[j].OrgSymbolNum() == oinfoincxntooccs[i].OrgSymbolNum()) {
          bcheckit = true;
          break;
        }
      }

      if (bcheckit == true) {
        __functionResult = false;
        break;
      }
    }
  }

  return __functionResult;
}


// ------------------------------------------------------------------------
// Subroutine CheckInfo
// Subprogram that checks whether the occurrence of the current information carrier has already been processed. If it is not yet registered it is entered in the global list g_oDoneInfoInObjDefs or g_oDoneInfoOutObjDefs.
// Parameter
// oCurrentInfoObjOcc = current orgelement.
// bCheck = Indicator flag whether the current object is put into the function as Input (True) or output (False).
// ------------------------------------------------------------------------
function checkinfo(ocurrentinfoobjocc, bcheck)
{
  var __functionResult = false;

  var i;
  var bfound = false;   // Indicator flag whether InfoElement has already been evaluated.
  var bfoundinfo = false;   // Indicator flag whether InfoElement has already been put in the global list.

  if (bcheck.value == true) {
  // Input information carrier.
  // Output information carrier.
    if (g_odoneinfoinobjdefs.length > 0) {
      for ( i = 0 ; i < g_odoneinfoinobjdefs.length ; i++ ){
        if (ocurrentinfoobjocc.ObjDef().IsEqual(g_odoneinfoinobjdefs[i]) == true && ocurrentinfoobjocc.OrgSymbolNum() == g_ndoneinfoinsym[i]) {
          bfound = true;
          __functionResult = true;
          break;
        }
      }
    }

    if (bfound == false) {
      g_ndoneinfoinsym[g_ndoneinfoinsym.length] = ocurrentinfoobjocc.OrgSymbolNum();
      g_odoneinfoinobjdefs[g_odoneinfoinobjdefs.length] = ocurrentinfoobjocc.ObjDef();
    }
  }
  else {
    if (g_odoneinfooutobjdefs.length > 0) {
      for ( i = 0 ; i < g_odoneinfooutobjdefs.length ; i++ ){
        if (ocurrentinfoobjocc.ObjDef().IsEqual(g_odoneinfooutobjdefs[i]) == true && ocurrentinfoobjocc.OrgSymbolNum() == g_ndoneinfooutsym[i]) {
          bfound = true;
          __functionResult = true;
          break;
        }
      }
    }

    if (bfound == false) {
      g_ndoneinfooutsym[g_ndoneinfooutsym.length] = ocurrentinfoobjocc.OrgSymbolNum();
      g_odoneinfooutobjdefs[g_odoneinfooutobjdefs.length] = ocurrentinfoobjocc.ObjDef();
    }
  }

  if (g_odoneinfoobjdefs.length > 0) {
    for ( i = 0 ; i < g_odoneinfoobjdefs.length ; i++ ){
      if (ocurrentinfoobjocc.ObjDef().IsEqual(g_odoneinfoobjdefs[i]) == true && ocurrentinfoobjocc.OrgSymbolNum() == g_ndoneinfosym[i]) {
        bfoundinfo = true;
        break;
      }
    }
  }

  if (bfoundinfo == false) {
    g_ndoneinfosym[g_ndoneinfosym.length] = ocurrentinfoobjocc.OrgSymbolNum();
    g_odoneinfoobjdefs[g_odoneinfoobjdefs.length] = ocurrentinfoobjocc.ObjDef();
  }

  return __functionResult;
}


// ------------------------------------------------------------------------
// Subroutine CheckMedChange
// This subprogram is used for determining the media breaks.
// Parameter
// oNextFuncNodes = List of following function objects of the current function.
// oInfoOccsFromCurFu = List of information carriers of the current function.
// oCxnOccsFromCurFu = List of connection occurrences of the current function.
// oInfoOccsFromNextFu = Field with the orgelements of the following functions.
// oCxnOccsFromNextFu = Field containing the connections of the following functions.
// nMedValue() = List of results.
// ------------------------------------------------------------------------
function checkmedchange(onextfuncnodes, oinfooccsfromcurfu, ocxnoccsfromcurfu, oinfooccsfromnextfu, ocxnoccsfromnextfu, nmedvalue)
{
  var odummyinfooccs = new Array();   // List containing the information carriers of the following function for comparison with the orgelements in the list oInfoOccsFromCurFu.
  var odummycxnoccs = new Array();   // List containing the connections belonging to the information carriers of the current following function for comparison with the connections (oCxnOccsFromCurFu) of the information carriers in the list oInfoOccsFromCurFu.

  while (onextfuncnodes.value.length > 0) {
    getfirstcheckelem(onextfuncnodes, odummyinfooccs, odummycxnoccs, oinfooccsfromnextfu, ocxnoccsfromnextfu);
    checkchange(odummyinfooccs, oinfooccsfromcurfu, nmedvalue);
    odummyinfooccs = new Array();
    odummycxnoccs = new Array();
  }
}


// ------------------------------------------------------------------------
// Subroutine CheckRight
// Subprogram for checking whether the linked information carriers are relevant.
// Parameter
// oCurrentModel = current model.
// oCurrentFunObjOcc = current function occurrence.
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams should also be evaluated (1 = Yes / 0 = No).																				*
// ------------------------------------------------------------------------
function checkright(ocurrentmodel, ocurrentfunobjocc, nwithassmod)
{
  var __functionResult = false;
  var i,j,h;

  var oprednodes = null;   // List of previous objects of the current function.
  var oconnodes = null;   // List of all linked objects of the current function.
  var ocxnoccs = null;   // List of connections (Occs) of the current following object.
  var ocurrentcxnocc = null;   // Connection between information carrier and function.
  var oassignedmodels = null;   // List of models which are assigned to the function.
  var osubmodfunc = null;   // Object definition of the current function definition in the assigned model.

  oprednodes = ocurrentmodel.value.GetPredNodes(ocurrentfunobjocc.value);
  oconnodes = ocurrentmodel.value.GetSuccNodes(ocurrentfunobjocc.value);
  var tmp = new Array();
  if (oconnodes.length > 0) {
    for ( i = 0 ; i < oconnodes.length ; i++ ){
      tmp[tmp.length] = oconnodes[i];
    }
  }
  
  if (oprednodes.length > 0) {
    for ( i = 0 ; i < oprednodes.length ; i++ ){
      tmp[tmp.length] = oprednodes[i];
    }
  }
  
  oconnodes = tmp;

  if (oconnodes.length > 0) {
    for ( i = 0 ; i < oconnodes.length ; i++ ){
      if (oconnodes[i].ObjDef().TypeNum() == Constants.OT_INFO_CARR) {
        if (isinfocarriersymbol(oconnodes[i].OrgSymbolNum())) {
          ocxnoccs = oconnodes[i].CxnOccList();
          for ( j = 0 ; j < ocxnoccs.length ; j++ ){
            ocurrentcxnocc = ocxnoccs[j];
            if (ocurrentcxnocc.TargetObjOcc().IsEqual(ocurrentfunobjocc.value) == true) {
              switch(ocurrentcxnocc.Cxn().TypeNum()) {
                case Constants.CT_PROV_INP_FOR:
                  __functionResult = true;
                  break;
                break;
              }
            }

            if (ocurrentcxnocc.SourceObjOcc().IsEqual(ocurrentfunobjocc.value) == true) {
              switch(ocurrentcxnocc.Cxn().TypeNum()) {
                case Constants.CT_CRT_OUT_TO:
                  __functionResult = true;
                  break;
                break;
              }
            }
          }

          if (__functionResult == true) {
            break;
          }
        }
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
                      case Constants.CT_PROV_INP_FOR:
    
                        if (isinfocarriersymbol(ocurrentcxnocc.SourceObjOcc().OrgSymbolNum())) {
                          __functionResult = true;
                          break;
                        }
                      break;
                    }
                  }
    
                  if (ocurrentcxnocc.SourceObjOcc().IsEqual(osubmodfunc[0]) == true) {
                    switch(ocurrentcxnocc.Cxn().TypeNum()) {
                      case Constants.CT_CRT_OUT_TO:
    
                        if (isinfocarriersymbol(ocurrentcxnocc.TargetObjOcc().OrgSymbolNum())) {
                          __functionResult = true;
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

  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 700, 145, getString("TEXT15"));
  userdialog.Text(10, 10, 460, 15, getString("TEXT19"));
  userdialog.Text(10, 25, 460, 15, getString("TEXT20"));
  userdialog.GroupBox(7, 50, 686, 60, getString("TEXT21"));
  userdialog.OptionGroup("options1");
  userdialog.OptionButton(20, 65, 580, 15, getString("TEXT22"));
  userdialog.OptionButton(20, 80, 580, 15, getString("TEXT23"));
  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_f87b1fc0_2f2e_11d9_017b_e10284184242_dlg_01.hlp");

  var dlg = Dialogs.createUserDialog(userdialog); 
  // Read dialog settings from config
  var sSection = "SCRIPT_f87b1fc0_2f2e_11d9_017b_e10284184242";  
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


// ------------------------------------------------------------------------
// Subroutine GetFirstCheckElem
// This subprogram is used for writing the information carriers and connections belonging to the current
// following function in the lists oDummyInfoOccs, oDummyCxnOccs. In doing so, the following function and its
// information carrier as well as its connections are removed from the lists oNextFuncNodes,
// oInfoOccsFromNextFu and oCxnOccsFromNextFu.
// Parameter
// oNextFuncNodes = List of following function objects of the current function.
// oDummyInfoOccs = List containing the information carriers of the current following function for comparison with the information carriers in the list oInfoOccsFromCurFu.
// oDummyCxnOccs = List containing the connections belonging to the Orgeinheiten of the current following function for comparison with the connections (oCxnOccsFromCurFu) of the Org.Elementen in the list oInfoOccsFromCurFu.
// oInfoOccsFromNextFu = Field of information carriers of the following functions.
// oCxnOccsFromNextFu = Field containing the connections of the following functions.
// ------------------------------------------------------------------------
function getfirstcheckelem(onextfuncnodes, odummyinfooccs, odummycxnoccs, oinfooccsfromnextfu, ocxnoccsfromnextfu)
{
  var ocheckobjocc = null;   // Object for checking the change.
  var bcheck = true;   // Abort criterion

  ocheckobjocc = onextfuncnodes.value[0];

  while (bcheck == true) {
    var ofuncobjocc = onextfuncnodes.value[0];
    if (ocheckobjocc!=null && ocheckobjocc!=undefined && ofuncobjocc!=null && ofuncobjocc != undefined && ocheckobjocc.IsEqual(ofuncobjocc) == true) {
      odummyinfooccs[odummyinfooccs.length] = oinfooccsfromnextfu.value[0];
      oinfooccsfromnextfu.value = doDelete(oinfooccsfromnextfu, oinfooccsfromnextfu.value[0]);
      odummycxnoccs[odummycxnoccs.length] = ocxnoccsfromnextfu.value[0];
      ocxnoccsfromnextfu.value = doDelete(ocxnoccsfromnextfu, ocxnoccsfromnextfu.value[0]);
      onextfuncnodes.value = doDelete(onextfuncnodes.value, onextfuncnodes.value[0]);
    } else {
      bcheck = false;
    }
  }
}


// ------------------------------------------------------------------------
// Subroutine GetInfoAndCxnCurFun
// Subprogram for determining the information carriers and connections of the current function.
// Parameter
// oCurrentModel = current model.
// oCurrentFuncObjOcc = current function.
// oInfoOccsFromCurFu = List of information carriers of the current function.
// oCxnOccsFromCurFu = List of connection occurrences of the current function.
// nMedValue() = List of results.
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams should also be evaluated (1 = Yes / 0 = No).																				*
// ------------------------------------------------------------------------
function getinfoandcxncurfun(ocurrentmodel, ocurrentfuncobjocc, oinfooccsfromcurfu, ocxnoccsfromcurfu, nmedvalue, nwithassmod)
{
  var i,j,k,l;
  var oinfocxnoccs;

  var oassignedmodels = null;   // List of models which are assigned to the function.
  var odummyobjoccs = null;   // List of ObjOccs for temporary saving.
  var ocurrentcxnocc = null;   // Connection between information carrier and function.
  var ocxnoccs = null;   // List of connection occurrences.
  var oinfooutcxntooccs = null;   // List of object occurrences which are linked by the connection occurrences of the 'creates output to' type.
  var oinfoincxntooccs = null;   // List of object occurrences which are linked by the connection occurrences of the 'provides input for' type.
  var oinfooutcxnoccs = null;   // List of connection occurrences of the 'creates output to' type.
  var oinfoincxnoccs = null;   // List or connection occurrences of the provides input for' type.
  var osubmodfunc = null;   // Object definition of the current function definition in the assigned model.
  var oprednodes = null;   // List of previous objects of the current function.
  var scurrentfuname = "";   // Name of the current function definition.
  var bcheckinfo = false;   // Variable for checking whether the information carrier has already been registered.
  var bckeckfunc = false;   // Checks whether the function occurrence has already been registered.
  var bboth = false;   // Checks whether the function has different input and or output information carriers.

  oinfooutcxnoccs = new Array();
  oinfoincxnoccs = new Array();
  oinfooutcxntooccs = new Array();
  oinfoincxntooccs = new Array();

  // Information carriers and connections of the current function occurrence.
  // Direct
  oprednodes = ocurrentmodel.value.GetPredNodes(ocurrentfuncobjocc.value);
  odummyobjoccs = ocurrentmodel.value.GetSuccNodes(ocurrentfuncobjocc.value);
  var tmp = new Array();
  if (odummyobjoccs.length > 0) {
    for ( i = 0 ; i < odummyobjoccs.length ; i++ ){
      tmp[tmp.length] = odummyobjoccs[i];
    }
  }
  if (oprednodes.length > 0) {
    for ( i = 0 ; i < oprednodes.length ; i++ ){
      tmp[tmp.length] = oprednodes[i];
    }
  }
  
  odummyobjoccs = tmp;

  scurrentfuname = ocurrentfuncobjocc.value.ObjDef().Name(g_nloc);
  if (odummyobjoccs.length > 0) {
    for ( i = 0 ; i < odummyobjoccs.length ; i++ ){
      // Information carrier is checked.

      if (isinfocarriersymbol(odummyobjoccs[i].OrgSymbolNum())) {
        ocxnoccs = odummyobjoccs[i].CxnOccList();
        for ( k = 0 ; k < ocxnoccs.length ; k++ ){
          ocurrentcxnocc = ocxnoccs[k];
          switch(ocurrentcxnocc.Cxn().TypeNum()) {
            case Constants.CT_PROV_INP_FOR:
            case Constants.CT_CRT_OUT_TO:
              if (ocurrentcxnocc.TargetObjOcc().IsEqual(ocurrentfuncobjocc.value) == true) {
                bcheckinfo = checkinfo(odummyobjoccs[i], new __holder(true));
                if (bcheckinfo == false) {
                  nmedvalue[2] = nmedvalue[2] + 1;
                }

                oinfoincxnoccs[oinfoincxnoccs.length] = ocurrentcxnocc;
                oinfoincxntooccs[oinfoincxntooccs.length] = odummyobjoccs[i];
              }

              if (ocurrentcxnocc.SourceObjOcc().IsEqual(ocurrentfuncobjocc.value) == true) {
                bcheckinfo = checkinfo(odummyobjoccs[i], new __holder(false));
                if (bcheckinfo == false) {
                  nmedvalue[3] = nmedvalue[3] + 1;
                }

                oinfooutcxnoccs[oinfooutcxnoccs.length] = ocurrentcxnocc;
                oinfooutcxntooccs[oinfooutcxntooccs.length] = odummyobjoccs[i];
              }
            break;
          }
        }
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
//            osubmodfunc = oassignedmodels[j].ObjOccListFilter(scurrentfuname, g_nloc, Constants.OT_FUNC);
            osubmodfunc = ocurrentfuncobjocc.value.ObjDef().OccListInModel(oassignedmodels[j]);
            if (osubmodfunc.length > 0) {
                ocxnoccs = oassignedmodels[j].CxnOccList();
                for ( k = 0 ; k < ocxnoccs.length ; k++ ){
                  ocurrentcxnocc = ocxnoccs[k];
                  switch(ocurrentcxnocc.Cxn().TypeNum()) {
                    case Constants.CT_PROV_INP_FOR:
                    case Constants.CT_CRT_OUT_TO:
                      if (ocurrentcxnocc.TargetObjOcc().IsEqual(osubmodfunc[0]) == true) {
    
                        if (isinfocarriersymbol(ocurrentcxnocc.SourceObjOcc().OrgSymbolNum())) {
                          bcheckinfo = checkinfo(ocurrentcxnocc.SourceObjOcc(), new __holder(true));
                          if (bcheckinfo == false) {
                            nmedvalue[2] = nmedvalue[2] + 1;
                          }
    
                          oinfoincxnoccs[oinfoincxnoccs.length] = ocurrentcxnocc;
                          oinfoincxntooccs[oinfoincxntooccs.length] = ocurrentcxnocc.SourceObjOcc();
                        }
                      }
    
                      if (ocurrentcxnocc.SourceObjOcc().IsEqual(osubmodfunc[0]) == true) {
                        if (isinfocarriersymbol(ocurrentcxnocc.TargetObjOcc().OrgSymbolNum())) {
                          bcheckinfo = checkinfo(ocurrentcxnocc.TargetObjOcc(), new __holder(false));
                          if (bcheckinfo == false) {
                            nmedvalue[3] = nmedvalue[3] + 1;
                          }
    
                          oinfooutcxnoccs[oinfooutcxnoccs.length] = ocurrentcxnocc;
                          oinfooutcxntooccs[oinfooutcxntooccs.length] = ocurrentcxnocc.TargetObjOcc();
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
  }

  bckeckfunc = checkfunc(ocurrentfuncobjocc.value);
  if (oinfoincxntooccs.length > 0) {
    if (bckeckfunc == false) {
      nmedvalue[4] = nmedvalue[4] + 1;
    }

    for ( l = 0 ; l < oinfoincxntooccs.length ; l++ ){
      oinfooccsfromcurfu[oinfooccsfromcurfu.length] = oinfoincxntooccs[l];
      ocxnoccsfromcurfu[ocxnoccsfromcurfu.length] = oinfoincxnoccs[l];
    }
  }

  if (oinfooutcxntooccs.length > 0) {
    if (bckeckfunc == false) {
      nmedvalue[5] = nmedvalue[5] + 1;
    }

    for ( l = 0 ; l < oinfooutcxntooccs.length ; l++ ){
      oinfooccsfromcurfu[oinfooccsfromcurfu.length] = oinfooutcxntooccs[l];
      ocxnoccsfromcurfu[ocxnoccsfromcurfu.length] = oinfooutcxnoccs[l];
    }
  }

  if (bckeckfunc == false) {
    if (oinfooutcxntooccs.length > 0 && oinfoincxntooccs.length > 0) {
      nmedvalue[6] = nmedvalue[6] + 1;
      bboth = checkinboth(oinfooutcxntooccs, oinfoincxntooccs);
      if (bboth == true) {
        nmedvalue[7] = nmedvalue[7] + 1;
      }
    }
  }
}



// ------------------------------------------------------------------------
// Subroutine GetInfoAndCxnNextFu
// Subprogram for determining the organizational elements and occurrences of the following functions.
// Parameter
// oCurrentModel = current model.
// oNextFuncNodes = List of following function objects of the current function.
// oInfoOccsFromNextFu  = Field of organizational elements of the following functions.
// oCxnOccsFromNextFu = Field containing the connections of the following functions.
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams should also be evaluated (1 = Yes / 0 = No).
// nMedValue() = List of results.
// ------------------------------------------------------------------------
function getinfoandcxnnextfu(ocurrentmodel, onextfuncnodes, oinfooccsfromnextfu, ocxnoccsfromnextfu, nwithassmod, nmedvalue)
{
  var h,i,j,k,l,m;
  var odummynextobjoccs = null;   // List of ObjOccs for temporary saving.
  var odummyfuncobjoccs = null;   // List of ObjOccs for temporary saving.
  var ocurrentcxnocc = null;   // Connection between information carrier and function.
  var ocxnoccs = null;   // List of connection occurrences.
  var oinfoinoccs = null;   // List of objects which are linked to the current function by 'provides input for' connections.
  var oinfooutoccs = null;   // List of objects which are linked to the current function by 'creates output to' connections.
  var oincxnoccs = null;   // List of connections (Occs) of the 'provides input for' type.
  var ooutcxnoccs = null;   // List of connections (Occs) of the 'creates output to' type.
  var oassignedmodels = null;   // List of models which are assigned to the current function.
  var osubmodfunc = null;   // Object definition of the current function definition in the assigned model.
  var oprednodes = null;   // List of previous objects of the current function.
  var scurrentfuname = "";   // Name of the current function definition.
  var bcheckoutput = false;   // Variable in case of output.
  var bcheckinput = false;   // Variable in case of input.
  var bcheckinfo = false;   // Variable for checking whether the information carrier has already been registered.
  var bckeckfunc = false;   // Checks whether the function occurrence has already been registered.
  var bboth = false;   // Checks whether the function has different input and or output information carriers.

  // Set
  oinfoinoccs = new Array();
  oinfooutoccs = new Array();
  oincxnoccs = new Array();
  ooutcxnoccs = new Array();
  odummyfuncobjoccs = new Array();

  for ( i = 0 ; i < onextfuncnodes.value.length ; i++ ){
    odummyfuncobjoccs[odummyfuncobjoccs.length] = onextfuncnodes.value[i];
  }

  onextfuncnodes.value = new Array();

  for ( i = 0 ; i < odummyfuncobjoccs.length ; i++ ){
    scurrentfuname = odummyfuncobjoccs[i].ObjDef().Name(g_nloc);
    odummynextobjoccs = ocurrentmodel.value.GetSuccNodes(odummyfuncobjoccs[i]);
    oprednodes = ocurrentmodel.value.GetPredNodes(odummyfuncobjoccs[i]);
    var tmp = new Array();
    if (odummynextobjoccs.length > 0) {
      for ( h = 0 ; h < odummynextobjoccs.length ; h++ ){
        tmp[tmp.length] = odummynextobjoccs[h];
      }
    }
    if (oprednodes.length > 0) {
      for ( h = 0 ; h < oprednodes.length ; h++ ){
        tmp[tmp.length] = oprednodes[h];
      }
    }
    odummynextobjoccs = tmp;

    if (odummynextobjoccs.length > 0) {
      for ( j = 0 ; j < odummynextobjoccs.length ; j++ ){
        // Orgelemente are checked.
        if (isinfocarriersymbol(odummynextobjoccs[j].OrgSymbolNum())) {
          ocxnoccs = odummynextobjoccs[j].CxnOccList();
          for ( m = 0 ; m < ocxnoccs.length ; m++ ){
            ocurrentcxnocc = ocxnoccs[m];
            switch(ocurrentcxnocc.Cxn().TypeNum()) {
              case Constants.CT_PROV_INP_FOR:
              case Constants.CT_CRT_OUT_TO:
                if (ocurrentcxnocc.TargetObjOcc().IsEqual(odummyfuncobjoccs[i]) == true) {
                  bcheckinfo = checkinfo(odummynextobjoccs[j], new __holder(true));
                  if (bcheckinfo == false) {
                    nmedvalue[2] = nmedvalue[2] + 1;
                  }

                  oinfoinoccs[oinfoinoccs.length] = odummynextobjoccs[j];
                  oincxnoccs[oincxnoccs.length] = ocurrentcxnocc;
                }

                if (ocurrentcxnocc.SourceObjOcc().IsEqual(odummyfuncobjoccs[i]) == true) {
                  bcheckinfo = checkinfo(odummynextobjoccs[j], new __holder(false));
                  if (bcheckinfo == false) {
                    nmedvalue[3] = nmedvalue[3] + 1;
                  }

                  oinfooutoccs[oinfooutoccs.length] = odummynextobjoccs[j];
                  ooutcxnoccs[ooutcxnoccs.length] = ocurrentcxnocc;
                }
              break;
            }
          }
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
//              osubmodfunc = oassignedmodels[j].ObjOccListFilter(scurrentfuname, g_nloc, Constants.OT_FUNC);
                osubmodfunc = odummyfuncobjoccs[i].ObjDef().OccListInModel(oassignedmodels[j]);
                if (osubmodfunc.length > 0) {
                  ocxnoccs = oassignedmodels[j].CxnOccList();
                  for ( k = 0 ; k < ocxnoccs.length ; k++ ){
                    ocurrentcxnocc = ocxnoccs[k];
                    // Check connections.
                    switch(ocurrentcxnocc.Cxn().TypeNum()) {
                      case Constants.CT_PROV_INP_FOR:
                      case Constants.CT_CRT_OUT_TO:
    
                        if (isinfocarriersymbol(ocurrentcxnocc.SourceObjOcc().OrgSymbolNum())) {
    
                          if (ocurrentcxnocc.TargetObjOcc().IsEqual(osubmodfunc[0]) == true) {
                            bcheckinfo = checkinfo(ocurrentcxnocc.SourceObjOcc(), new __holder(true));
                            if (bcheckinfo == false) {
                              nmedvalue[2] = nmedvalue[2] + 1;
                            }
    
                            oincxnoccs[oincxnoccs.length] = ocurrentcxnocc;
                            oinfoinoccs[oinfoinoccs.length] = ocurrentcxnocc.SourceObjOcc();
                          }
                        }
    
                        if (isinfocarriersymbol(ocurrentcxnocc.TargetObjOcc().OrgSymbolNum())) {
                          if (ocurrentcxnocc.SourceObjOcc().IsEqual(osubmodfunc[0]) == true) {
                            bcheckinfo = checkinfo(ocurrentcxnocc.TargetObjOcc(), new __holder(false));
                            if (bcheckinfo == false) {
                              nmedvalue[3] = nmedvalue[3] + 1;
                            }
    
                            oinfooutoccs[oinfooutoccs.length] = ocurrentcxnocc.TargetObjOcc();
                            ooutcxnoccs[ooutcxnoccs.length] = ocurrentcxnocc;
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
    }

    bckeckfunc = checkfunc(odummyfuncobjoccs[i]);
    if (oinfooutoccs.length > 0) {
      if (bckeckfunc == false) {
        nmedvalue[5] = nmedvalue[5] + 1;
      }

      for ( l = 0 ; l < oinfooutoccs.length ; l++ ){
        onextfuncnodes.value[onextfuncnodes.value.length] = odummyfuncobjoccs[i];
        oinfooccsfromnextfu[oinfooccsfromnextfu.length] = oinfooutoccs[l];
        ocxnoccsfromnextfu[ocxnoccsfromnextfu.length] = ooutcxnoccs[l];
      }
    }

    if (oinfoinoccs.length > 0) {
      if (bckeckfunc == false) {
        nmedvalue[4] = nmedvalue[4] + 1;
      }

      for ( l = 0 ; l < oinfoinoccs.length ; l++ ){
        onextfuncnodes.value[onextfuncnodes.value.length] = odummyfuncobjoccs[i];
        oinfooccsfromnextfu[oinfooccsfromnextfu.length] = oinfoinoccs[l];
        ocxnoccsfromnextfu[ocxnoccsfromnextfu.length] = oincxnoccs[l];
      }
    }

    if (bckeckfunc == false) {
      if (oinfooutoccs.length > 0 && oinfoinoccs.length > 0) {
        nmedvalue[6] = nmedvalue[6] + 1;
        bboth = checkinboth(oinfooutoccs, oinfoinoccs);
        if (bboth == true) {
          nmedvalue[7] = nmedvalue[7] + 1;
        }
      }
    }

    // Reset
    oinfooutoccs = new Array();
    ooutcxnoccs = new Array();
    oinfoinoccs = new Array();
    oincxnoccs = new Array();

    if (nwithassmod.value == 1) {
      oassignedmodels = new Array();
    }
  }
}




// ------------------------------------------------------------------------
// Subroutine GreatTable																							*
// Subprogram for the individual evaluation of the selected models.												*
// Parameter																										*
// oModels = List of the selected models.																	*
// nValueTable() = List of the models' values.																*
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams should also							*
// be evaluated (1 = ja / 0 = Nein).																				*
// ------------------------------------------------------------------------
function greattable(omodels, nvaluetable, nwithassmod)
{
  var i,j;
  var ocurrentmodel = new __holder(null);   // Current model of list oModels
  var ncurrenttabofval = new Array();       // List containing the current model's values.

  // setzen
  ncurrenttabofval = new Array(); 
  for ( i = 0 ; i < omodels.length ; i++ ){
    g_ndoneinfoinsym = new Array(); 
    g_ndoneinfooutsym = new Array(); 
    g_ndoneinfosym = new Array(); 

    g_odoneinfoobjdefs = new Array();
    g_odoneinfoinobjdefs = new Array();
    g_odoneinfooutobjdefs = new Array();
    g_odoneobjoccs = new Array();
    g_odonefunc = new Array();

    ocurrentmodel.value = omodels[i];
    // Determine current model values.
    getmodelval(ocurrentmodel, ncurrenttabofval, nwithassmod);
    // Add current values to general values.
    for ( j = 0 ; j < 9+1 ; j++ ){
      nvaluetable[j][i] = nvaluetable[j][i] + ncurrenttabofval[j];
    }
  }

  ocurrentmodel.value = null;
}





// ------------------------------------------------------------------------
// Subroutine OutputOfTable
// Subprogram for cumulative and individual evaluation of the selected models.
// In case of cumulative evaluation all model values are added.
// Parameter
// oModels = List of the selected models.
// nValueTable() = List of the models' values.
// sName = Variable for the analysis name.
// nSelectedOption = Variable for checking whether the selected models are to be evaluated cumulatively  ( = 0 ) or individually (= 1).																*
// ------------------------------------------------------------------------
function outputoftable(omodels, nvaluetable, sname, nselectedoption)
{
  var i,j;

  g_ooutfile.DefineF("REPORT4", getString("TEXT17"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT4_green", getString("TEXT17"), 12, Constants.C_BLACK, 0xCCFFCC, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT4_green_bold", getString("TEXT17"), 12, Constants.C_BLACK, 0xCCFFCC, Constants.FMT_LEFT | Constants.FMT_BOLD, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT4_pink", getString("TEXT17"), 12, Constants.C_BLACK, 0xFFCC99, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT4_pink_bold", getString("TEXT17"), 12, Constants.C_BLACK, 0xFFCC99, Constants.FMT_LEFT | Constants.FMT_BOLD, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT4_blue", getString("TEXT17"), 12, Constants.C_BLACK, 0xCCFFFF, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT4_blue_bold", getString("TEXT17"), 12, Constants.C_BLACK, 0xCCFFFF, Constants.FMT_LEFT | Constants.FMT_BOLD, 0, 0, 0, 0, 0, 1);

  var nvalue = 0; 
  var ncut = 0.0; 

  if (nselectedoption == 0) {
  // Cumulated
  // Individual
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF(sname, 40, "REPORT4_green_bold");
    g_ooutfile.TableCellF(g_sstringarray[11], 10, "REPORT4_pink_bold");
    for ( i = 0 ; i < 10+1 ; i++ ){
      if (i < 10) {
        g_ooutfile.TableRow();
        g_ooutfile.TableCellF(g_sstringarray[i], 40, "REPORT4_green");
        g_ooutfile.TableCellF(nvaluetable[i], 10, "REPORT4_pink");
      }

      if (i == 10) {
        // Ratio media breaks/function transitions.
        g_ooutfile.TableRow();
        g_ooutfile.TableCellF(g_sstringarray[10], 40, "REPORT4_green");
        if (nvaluetable[8] == 0) {
          g_ooutfile.TableCellF("0", 10, "REPORT4_pink_bold");
        }
        else {
          ncut = round2(nvaluetable[9] / nvaluetable[8]);
          g_ooutfile.TableCellF(ncut, 10, "REPORT4_pink_bold");
        }
      }
    }
  }
  else {
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF(sname, 40, "REPORT4_green_bold");
    var sFormat;
    for ( i = 0 ; i < omodels.length ; i++ ){
      sFormat = (i%2 == 0) ? "REPORT4_pink_bold" : "REPORT4_blue_bold";
      g_ooutfile.TableCellF(g_sstringarray[12] + " "+ (i + 1), 10, sFormat);
    }

    for ( i = 0 ; i < 10+1 ; i++ ){
      if (i < 10) {
        g_ooutfile.TableRow();
        g_ooutfile.TableCellF(g_sstringarray[i], 40, "REPORT4_green");
        for ( j = 0 ; j < omodels.length ; j++ ){
          sFormat = (j%2 == 0) ? "REPORT4_pink" : "REPORT4_blue";
          g_ooutfile.TableCellF(nvaluetable[i][j], 10, sFormat);
        }
      }

      if (i == 10) {
        // Ratio media breaks/function transitions.
        g_ooutfile.TableRow();
        g_ooutfile.TableCellF(g_sstringarray[10], 40, "REPORT4_green");
        for ( j = 0 ; j < omodels.length ; j++ ){
          sFormat = (j%2 == 0) ? "REPORT4_pink_bold" : "REPORT4_blue_bold";
          if (nvaluetable[8][j] == 0) {
            g_ooutfile.TableCellF("0", 10, sFormat);
          }
          else {
            ncut = round2(nvaluetable[9][j] / nvaluetable[8][j]);
            g_ooutfile.TableCellF(ncut, 10, sFormat);
          }
        }
      }
    }
  }
}


// ------------------------------------------------------------------------
// Subroutine OutReportHead
// Subprogram for the title.
// Parameter
// oModels = List of the selected models.
// sName = analysis names
// bOutCheck = Variable whether title is in table or text.
// ------------------------------------------------------------------------
function outreporthead(omodels, sname, boutcheck)
{
  var i;
  var ocurrentuser = null; 
  var spath = "";   // Path of the current model.
  var soutputline = ""; 
  ocurrentuser = ArisData.getActiveUser();
  g_ooutfile.DefineF("REPORT1", getString("TEXT17"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT2", getString("TEXT17"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT3", getString("TEXT17"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

  if (boutcheck == true) {
    g_ooutfile.TableRow();
    g_ooutfile.TableCell((getString("TEXT24") + sname), 20, getString("TEXT17"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell("", 20, getString("TEXT17"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    g_ooutfile.Output(getString("TEXT25"), getString("TEXT17"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT, 0);
    g_ooutfile.OutputField(Constants.FIELD_DATE, getString("TEXT17"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT);
    g_ooutfile.Output(" ", getString("TEXT17"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT, 0);
    g_ooutfile.OutputField(Constants.FIELD_TIME, getString("TEXT17"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell((getString("TEXT26") + ArisData.getActiveDatabase().ServerName()), 20, getString("TEXT17"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell((getString("TEXT27") + ArisData.getActiveDatabase().Name(g_nloc)), 20, getString("TEXT17"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell((getString("TEXT28") + ocurrentuser.Name(g_nloc)), 20, getString("TEXT17"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell((getString("TEXT29") + Context.getSelectedFile()), 20, getString("TEXT17"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(getString("TEXT30"), 20, getString("TEXT17"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(getString("TEXT31"), 20, getString("TEXT17"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER | Constants.FMT_BOLD, 0);
    var nColor;
    for ( i = 0 ; i < omodels.length ; i++ ){
      g_ooutfile.TableRow();
      spath = omodels[i].Group().Path(g_nloc);
      nColor = (i%2 == 0) ? 0xFFCC99 : 0xCCFFFF;
      g_ooutfile.TableCell("" + (i + 1) + ".) " + spath + "\\" + omodels[i].Name(g_nloc) + " (" + omodels[i].Type() + ")", 20, getString("TEXT17"), 12, Constants.C_BLACK, nColor, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    }
    g_ooutfile.TableRow();
  }
  else {
    // Header Footer
    g_ooutfile.BeginHeader();
    g_ooutfile.EndHeader();
    g_ooutfile.BeginFooter();
    g_ooutfile.OutputLnF("" + (new __date()) + " " + (new __time()) + ";" + ArisData.getActiveDatabase().Name(g_nloc) + ";" + ArisData.getActiveDatabase().ServerName() + ";" + Context.getSelectedFile() + ";" + getString("TEXT32"), "REPORT3");
    g_ooutfile.Output(getString("TEXT33"), getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_PAGE, getString("TEXT17"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    g_ooutfile.EndFooter();

    // Headline
    g_ooutfile.OutputLnF("", "REPORT3");
    g_ooutfile.OutputLnF(getString("TEXT15"), "REPORT1");
    g_ooutfile.OutputLnF("", "REPORT2");
    // Creating
    g_ooutfile.OutputLnF(getString("TEXT25") + (new __date()) + " " + (new __time()), "REPORT2");
    // Database and Server
    g_ooutfile.OutputLnF((getString("TEXT26") + ArisData.getActiveDatabase().ServerName()), "REPORT2");
    g_ooutfile.OutputLnF((getString("TEXT27") + ArisData.getActiveDatabase().Name(g_nloc)), "REPORT2");
    ocurrentuser = ArisData.getActiveUser();
    // User
    g_ooutfile.OutputLnF((getString("TEXT28") + ocurrentuser.Name(g_nloc)), "REPORT2");
    // File
    g_ooutfile.OutputLnF((getString("TEXT29") + Context.getSelectedFile()), "REPORT2");
    g_ooutfile.OutputLnF(getString("TEXT30"), "REPORT2");
    g_ooutfile.OutputLnF("", "REPORT2");
    g_ooutfile.OutputLnF(getString("TEXT31"), "REPORT2");
    for ( i = 0 ; i < omodels.length ; i++ ){
      spath = omodels[i].Group().Path(g_nloc);
      soutputline = "" + (i + 1) + ".)  " + spath + "\\" + omodels[i].Name(g_nloc) + " (" + omodels[i].Type() + ")";
      g_ooutfile.OutputLnF(soutputline, "REPORT2");
    }
    g_ooutfile.OutputLnF("", "REPORT2");
  }
}


// ------------------------------------------------------------------------
// Subroutine SingleTable
// Subprogram for the cumulative evaluation of selected models.
// All model values are added up.
// Parameter
// oModels = List of the selected models.
// nValueTable() = List of the models' values.
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams should also be evaluated (1 = Yes / 0 = No).
// ------------------------------------------------------------------------
function singletable(omodels, nvaluetable, nwithassmod)
{
  var i,j;
  var ocurrentmodel = new __holder(null);   // Current model of list oModels
  var ncurrenttabofval = new Array();       // List containing the current model's values.

  // setzen
  ncurrenttabofval = new Array(); 
  for ( i = 0 ; i < omodels.length; i++ ){
    g_ndoneinfoinsym = new Array(); 
    g_ndoneinfooutsym = new Array(); 
    g_ndoneinfosym = new Array(); 

    g_odoneinfoobjdefs = new Array();
    g_odoneinfoinobjdefs = new Array();
    g_odoneinfooutobjdefs = new Array();
    g_odoneobjoccs = new Array();
    g_odonefunc = new Array();

    ocurrentmodel.value = omodels[i];
    // Determine current model values.
    getmodelval(ocurrentmodel, ncurrenttabofval, nwithassmod);
    // Add current values to general values.
    for ( j = 0 ; j < 9+1 ; j++ ){
      nvaluetable[j] = nvaluetable[j] + ncurrenttabofval[j];
    }
  }

  ocurrentmodel.value = null;
}


// ------------------------------------------------------------------------
// Subroutine UserDlg
// This subprogram is needed to get information from the user to obtain the necessary settings for the analysis.
// Parameter
// nSelectedOption  = Variable for checking whether the selected models should be evaluated cumulatively ( = 0 ) or individually (= 1).
// sName = Variable for the analysis name.
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams should also be evaluated (1 = Yes / 0 = No).
// bCheckUserDialog = Variable for checking whether the user has chosen Cancel in the dialog boxes.
// ------------------------------------------------------------------------
function userdlg(nselectedoption, sname, nwithassmod, bcheckuserdialog)
{
  var nuserdlg = 0;   // Variable for the user dialog box

  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 700, 210, getString("TEXT15"));
  userdialog.Text(10, 10, 460, 15, getString("TEXT34"));
  userdialog.Text(10, 25, 460, 15, getString("TEXT20"));
  userdialog.CheckBox(10, 50, 580, 15, getString("TEXT35"), "Check");
  userdialog.GroupBox(7, 75, 686, 55, getString("TEXT36"));
  userdialog.OptionGroup("options2");
  userdialog.OptionButton(20, 90, 580, 15, getString("TEXT37"));
  userdialog.OptionButton(20, 105, 580, 15, getString("TEXT38"));
  userdialog.Text(10, 135, 460, 15, getString("TEXT39"));
  userdialog.TextBox(10, 155, 500, 20, "Text0");
  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_f87b1fc0_2f2e_11d9_017b_e10284184242_dlg_02.hlp");  

  var dlg = Dialogs.createUserDialog(userdialog); 
  // Read dialog settings from config
  var sSection = "SCRIPT_f87b1fc0_2f2e_11d9_017b_e10284184242";  
  ReadSettingsDlgValue(dlg, sSection, "options2", 0);
  ReadSettingsDlgText(dlg, sSection, "Text0", getString("TEXT40"));
  ReadSettingsDlgValue(dlg, sSection, "Check", 0);

  nuserdlg = Dialogs.show( __currentDialog = dlg);
  // Showing dialog and waiting for confirmation with OK
  nselectedoption.value = parseInt(dlg.getDlgValue("options2"));
  sname.value = dlg.getDlgText("Text0");
  nwithassmod.value = parseInt(dlg.getDlgValue("Check"));
  if (nuserdlg == 0) {
    bcheckuserdialog.value = false;
  }
  else {
    bcheckuserdialog.value = true;

    // Write dialog settings to config 
    WriteSettingsDlgValue(dlg, sSection, "options2");
    WriteSettingsDlgText(dlg, sSection, "Text0");
    WriteSettingsDlgValue(dlg, sSection, "Check");
  }

}




function isinfocarriersymbol(nsymbolnum)
{
  var __functionResult = false;
  switch(nsymbolnum) {
    case Constants.ST_CRD_FILE:
    case Constants.ST_FILE:
    case Constants.ST_DOC:
    case Constants.ST_KNOWHOW:
    case Constants.ST_FOLD:
    case Constants.ST_BARCODE:
    case Constants.ST_MICROFICHE:
    case Constants.ST_PHONE:
    case Constants.ST_FAX:
    case Constants.ST_MAGN_TAPE:
    case Constants.ST_INFO_CARR:
    case Constants.ST_LOG:
    case Constants.ST_ARIS_DGM:
    case Constants.ST_PRINT_PIC:
    case Constants.ST_CD_PIC:
    case Constants.ST_HDISK_PIC:
    case Constants.ST_FILE_PIC:
    case Constants.ST_DOCU_PIC:
    case Constants.ST_WASTE_PIC:
    case Constants.ST_TPLAN_PIC:
    case Constants.ST_LETT_PIC:
    case Constants.ST_DISK_PIC:
    case Constants.ST_BOOK_PIC:
    case Constants.ST_FCABIN_PIC:
    case Constants.ST_NOTE_PIC:
    case Constants.ST_TAPE_PIC:
    case Constants.ST_INTERNET_PIC:
    case Constants.ST_FAX_PIC:
    case Constants.ST_PHONE_PIC:
    case Constants.ST_EMAIL_PIC:
    case Constants.ST_FILE_BIN_PIC:
    case Constants.ST_INFO_CARR_PDA:
    case Constants.ST_INFO_CARR_PRINT:
    case Constants.ST_INFO_CARR_CD:
    case Constants.ST_INFO_CARR_HD:
    case Constants.ST_INFO_CARR_WASTE:
    case Constants.ST_INFO_CARR_TPLAN:
    case Constants.ST_EMAIL_1:
    case Constants.ST_INFO_CARR_LETTER:
    case Constants.ST_INFO_CARR_FDD:
    case Constants.ST_INFO_CARR_BOOK:
    case Constants.ST_INFO_CARR_FCABIN:
    case Constants.ST_INFO_CARR_NOTE:
    case Constants.ST_INFO_CARR_INTERN:
    case Constants.ST_INFO_CARR_FILE_BIN:
    case Constants.ST_INFO_CARR_EDI:
    case Constants.ST_INFO_CARR_EDOC:
    case Constants.ST_INFO_CARR_EFOLDER:
    case Constants.ST_INFO_CARR_LAN:
    case Constants.ST_INFO_CARR_EXPERT:
    case Constants.ST_INFO_CARR_HANDY:
    case Constants.ST_INFO_CARR_INTRANET:
    case Constants.ST_INFO_CARR_EXTRA:
    case Constants.ST_INFO_CARR_DVD:
    case Constants.ST_BPMN_DATA_STORE:      // BLUE-10581
      __functionResult = true;

    break;
    default:
      __functionResult = false;
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

  var onextfuncnodes = new __holder(null);   // List of following function objects of the current function.
  var odummyobjoccs = new __holder(null);   // List of function occurrences for intermediate saving.
  var odummy2objoccs = new __holder(null);   // List of function occurrences for intermediate saving.
  var ocurrentdummyocc = new __holder(null);   // Current saving element.
  var ostorenodes = null;   // List for intermediate saving of following function objects of the current function.

  var bcheck = false;   // Variable for checking whether the connections and information carriers of the function are correct.
  var bcheckit = false; 
  var bdonefunc = false;   // Variable for checking whether the current function has already been evaluated.
  var bfunccheck = false;   // Variable for checking whether relevant function occurrences have already been considered in the evaluation.
  var i = 0;   var j = 0; 

  onextfuncnodes.value = new Array();
  ostorenodes = new Array();
  odummyobjoccs.value = new Array();
  odummy2objoccs.value = new Array();

  var funccontext = new __usertype_tfunccontext(); 
  initfunccontext(funccontext);

  var traverseresults = new Array();    // __usertype_ttraverseresult() 

  // Find following functions
  findnextfunc(ocurrentmodel, ocurrentfuncobjocc.value, odummyobjoccs);

  // Dim sDbg As String
  // sDbg = GetNamesOfNextFunctions(oDummyObjOccs)
  // Debug.Print oCurrentFuncObjOcc.ObjDef.Name(g_nLoc) & ": " & sDbg

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
      }
      else {
        i = i + 1;
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

  // clean up lists
  onextfuncnodes.value = null;
  odummyobjoccs.value = null;
  odummy2objoccs.value = null;
  ocurrentdummyocc.value = null;

  __functionResult = funccontext;
  return __functionResult;
}



function getnamesofnextfunctions(olist)
{
  var __functionResult = "";
  var sres = "";   var i = 0; 

  for ( i = 0 ; i < olist.length ; i++ ){
    if (i > 0) {
      sres = sres + ", ";
    }
    sres = sres + olist[i].ObjDef().Name(g_nloc);
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
  var i;

  var otargetobjoccs = ocurrentmodel.value.GetSuccNodes(ocurrentobjocc);  // List of following object occurrences of the current model.

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
  var i,j;

  var ostartobjoccs = null;   // List of start object occurrences of the model.
  var odummyobjoccs = new __holder(null);   // List of object occurrences.

  var bcheck = new __holder(false);

  odummyobjoccs.value = new Array();
  ocurrentmodel.value.BuildGraph(true);
  ostartobjoccs = ocurrentmodel.value.StartNodeList();
  if (ostartobjoccs.length > 0) {
    // Elements that are not of the function or event type will be removed from the list.
    while (bcheck.value == false) {
      bcheck.value = true;
      for ( i = 0 ; i < ostartobjoccs.length ; i++ ){
        if (! (ostartobjoccs[i].ObjDef().TypeNum() == Constants.OT_FUNC || ostartobjoccs[i].ObjDef().TypeNum() == Constants.OT_EVT)) {
          ostartobjoccs = doDelete(ostartobjoccs, ostartobjoccs[i]);
          bcheck.value = false;
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













