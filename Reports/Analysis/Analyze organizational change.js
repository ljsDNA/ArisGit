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
g_sstringarray[13] = getString("TEXT14");
g_sstringarray[14] = getString("TEXT15");
g_sstringarray[15] = getString("TEXT16");
g_sstringarray[16] = getString("TEXT17");
g_sstringarray[17] = getString("TEXT18");
g_sstringarray[18] = getString("TEXT19");
g_sstringarray[19] = getString("TEXT20");
g_sstringarray[20] = getString("TEXT21");
g_sstringarray[21] = getString("TEXT22");
g_sstringarray[22] = getString("TEXT23");
g_sstringarray[23] = getString("TEXT24");
g_sstringarray[24] = getString("TEXT25");

// common for all traversing analysis scripts
var g_odoneobjoccs = null; // List of object occurrences that have already been evaluated.
var g_odonefunc = null; 
var g_odonegenfuncobjoccs = null; 
var g_odonefuncwithorgs = null; 


// common types with specific contents/initialization/cleaner for all traversing analysis scripts:

// context for model
__usertype_tmodelcontext = function() {
  this.nfuncwithorg = 0;        // Variable for checking functions with organizational elements
  this.ncountoffunctran = 0;    // Variable for the number of function transitions.
  this.norgobjects = 0;         // Variable for the number of assigned organizational objects.
  this.nnumberoforgunits = 0;   // Variable for the number of organizational units.
  this.nnumberofgroups = 0;     // Variable for the number of groups.
  this.nnumberofpersons = 0;    // Variable for the number of persons.
  this.nnumberofpositions = 0;  // Variable for the number of positions.
  this.nnumberofemployee = 0;   // Variable for the number of employees.
  this.norgchangemin = 0;       // Variable for the number of minimum organizational changes.
  this.norgchangemax = 0;       // Variable for the number of maximum organizational changes.
}


// initialization of traversing context for model
function initmodelcontext(modelcontext)
{
}



// cleaner of traversing context for model
function cleanmodelcontext(modelcontext)
{
}

// specific content of func context for org changes
__usertype_tminmaxvalueset = function() {
  this.ofuncobjocc = null;
  this.nminvalue = 0;
  this.nmaxvalue = 0;
}

// traversing context for function
__usertype_tfunccontext = function() {
  this.oorgoccsfromcurfu = null;        // List of orgelements of the current function.
  this.ocxnoccsfromcurfu = null;        // List of connection occurrences of the current function.
  this.oorgoccsfromnextfu = null;       // Field containing the orgelements of the following functions.
  this.ocxnoccsfromnextfu = null;       // Field showing the connections of the following functions.
  this.minmaxaddvalues = new Array      // __usertype_tminmaxvalueset() // receives map for min/max org changes per connection from current function (filled in after handling of outgoing connections)
  this.nminvalue = 0;                   // receives map for min org changes for all paths from current function (filled in after complete traversation of these paths via recursive calls of TraverseModelGraph)
  this.nmaxvalue = 0;                   // receives map for max org changes for all paths from current function (filled in after complete traversation of these paths via recursive calls of TraverseModelGraph)
}

// initialization of traversing context for function
function initfunccontext(funccontext)
{
  funccontext.oorgoccsfromcurfu = new Array();
  funccontext.ocxnoccsfromcurfu = new Array();
  funccontext.oorgoccsfromnextfu = new Array();
  funccontext.ocxnoccsfromnextfu = new Array();
}



// cleaner of traversing context for function
function cleanfunccontext(funccontext)
{
  funccontext.oorgoccsfromcurfu = null;
  funccontext.ocxnoccsfromcurfu = null;
  funccontext.oorgoccsfromnextfu = null;
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
  for (var i = 0; i < traverseresults.length ; i++ ){
    if (traverseresults[i].ofuncobjocc.IsEqual(ofuncobjocc)) {
      traverseresults[i].funccontext = succfunccontext;
    }
  }
}






// specific globals
var g_ooutfile = null; // Object that is used for the output of the analysis.
var g_nloc = 0; // Variable for the ID of the current language.
var g_odoneorgobjdefs = null; 

function main()
{
  if (Context.getSelectedFormat() == Constants.OUTTEXT) {
    // BLUE-14018      
    Context.setProperty("use-new-output", false);
  }     

  var omodels = null;   // List of selected models.

  var ncheckmsg = 0;                        // Variable for checking the treatment of the message (nCheckMsg = 2 / Cancel was selected).
  var ncheckmsg2 = 0;                       // Variable for checking the treatment of the message (nCheckMsg = 2 / Cancel was selected).
  var nwithassmod = new __holder(0);        // Variable to check whether the function allocation diagrams should also be evaluated (1 = Yes / 0 = No).
  var nselectedoption = new __holder(0);    // Variable for a cumulative ( = 0 ) or single (= 1) evaluation of the selected models.
  var nvaluetable = new Array();            // List of the models' values.
  // First row: number of functions.
  // Second row of functions with organizational elements.
  // Third row : number of function transitions.
  // Fourth row: number of allocated  Org.elemente.
  // Fifth row: total of organizational units.
  // Sixth row: total of groups.
  // Seventh row: total of persons.
  // Eighth row: total of positions.
  // Ninth row: total of employee types.
  // Tenth row: minimum change.
  // Eleventh row: maximum change.

  var sname = new __holder("");   // Variable for the analysis name.
  var sextension = new __holder("");   // Variable for the file extension.
  var berror = false; 
  var boutput = false;   // Variable for title (True = table / False = text).
  var bmodellok = false;   // Variable for checking whether the model is of the correct type.
  var bcheckuserdialog = new __holder(false);   // Variable for checking whether the user has selected Cancel in the dialog boxes.

  var odummymodels = null;   // List of models for temporary saving.
  var i = 0; 

  // Set
  odummymodels = ArisData.getSelectedModels();
  g_nloc = Context.getSelectedLanguage();
  g_ooutfile = Context.createOutputObject();
  g_odoneobjoccs = new Array();
  g_odonegenfuncobjoccs = new Array();
  g_odoneorgobjdefs = new Array();
  g_odonefuncwithorgs = new Array();
  omodels = new Array();
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
        ncheckmsg2 = Dialogs.MsgBox(getString("TEXT26"), Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT16"));
      }
      else {
        Dialogs.MsgBox(getString("TEXT27"), Constants.MSGBOX_BTN_OK, getString("TEXT16"));
        ncheckmsg2 = 2;
      }
    }

    if (! (ncheckmsg2 == 2)) {
      // Selection of output.
      if (! (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX || Context.getSelectedFormat() == Constants.OUTTEXT)) {
        ncheckmsg = Dialogs.MsgBox(getString("TEXT28"), Constants.MSGBOX_BTN_YESNOCANCEL | Constants.MSGBOX_ICON_QUESTION, getString("TEXT16"));
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

            for (var k = 0; k < 11; k++) {
                nvaluetable[k] = 0.0;
            }
            singletable(omodels, nvaluetable, nwithassmod);
          }
          else {
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

          outputoftable(omodels, nvaluetable, sname.value, nselectedoption.value);
          g_ooutfile.EndTable(sname.value, 100, getString("TEXT29"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
          
          if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) {
            g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            outputCharts(omodels, nvaluetable, sname.value, nselectedoption.value);          
            g_ooutfile.EndTable(getString("TEXT43"), 100, getString("TEXT29"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
          }
          
          g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
        } else {
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
    Dialogs.MsgBox(getString("TEXT30"), Constants.MSGBOX_BTN_OK, getString("TEXT16"));
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
  var nRatioMin;
  var nRatioMax;
  if (nselectedoption == 0) {
    // Cumulated
    nRatioMin = (nvaluetable[2] == 0) ? 0 : nvaluetable[9]/nvaluetable[2];
    nRatioMax = (nvaluetable[2] == 0) ? 0 : nvaluetable[10]/nvaluetable[2];
    arrData.push(nRatioMin);
    arrData.push(nRatioMax);
    arrLegend.push(getString("TEXT44"));
    arrLegend.push(getString("TEXT45"));
  } else {
    // Every model separately
    for (i=0; i<omodels.length; i++) {
      nRatioMin = (nvaluetable[2][i] == 0) ? 0 : nvaluetable[9][i]/nvaluetable[2][i];
      nRatioMax = (nvaluetable[2][i] == 0) ? 0 : nvaluetable[10][i]/nvaluetable[2][i];
      arrData.push(nRatioMin);
      arrData.push(nRatioMax);
      arrLegend.push(getString("TEXT15")+" "+(i+1)+" "+getString("TEXT46"));
      arrLegend.push(getString("TEXT15")+" "+(i+1)+" "+getString("TEXT47"));
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
    chart.getYAxis().setTitle(getString("TEXT48"));

    return chart;
}

// ----------------------------------------------------------------------------
// Subroutine GetModelVal
// Subprogram for the cumulative evaluation of selected models.
// All model values are added up.
// Parameter
// oCurrentModel = current model.
// nCurrentTabOfVal() = List containing the current model's values.
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams should also be evaluated (1 = Yes / 0 = No).
// ----------------------------------------------------------------------------
function getmodelval(ocurrentmodel, ncurrenttabofval, nwithassmod)
{
  var ofuncobjocc = null;   // List of function occurrences.
  var ostartfunc = null;   // List of start functions of the current model.
  var bdonefunc = false;   // Variable for checking whether the current function has already been evaluated.
  var i = 0; 
  var funccontext = new __usertype_tfunccontext(); 
  var norgchangemin = 0;   var norgchangemax = 0; 

  var modelcontext = new __holder(new __usertype_tmodelcontext()); 
  initmodelcontext(modelcontext.value);

  // Number of functions in the model.
  ofuncobjocc = ocurrentmodel.value.ObjOccListFilter(Constants.OT_FUNC);
  ncurrenttabofval[0] = ofuncobjocc.length;

  ostartfunc = new Array();
  getstartfunc(ocurrentmodel, ostartfunc);
  ocurrentmodel.value.BuildGraph(false);

  norgchangemin = 0;
  norgchangemax = 0;
  
  for ( i = 0 ; i < ostartfunc.length ; i++ ){
    bdonefunc = checkdonefunc(ostartfunc[i]);
    if (bdonefunc == false) {
      funccontext = traversemodelgraph(ocurrentmodel, modelcontext, new __holder(ostartfunc[i]), nwithassmod);
    }
  }

  ncurrenttabofval[1]  = modelcontext.value.nfuncwithorg;
  ncurrenttabofval[2]  = modelcontext.value.ncountoffunctran;
  ncurrenttabofval[3]  = modelcontext.value.norgobjects;
  ncurrenttabofval[4]  = modelcontext.value.nnumberoforgunits;
  ncurrenttabofval[5]  = modelcontext.value.nnumberofgroups;
  ncurrenttabofval[6]  = modelcontext.value.nnumberofpersons;
  ncurrenttabofval[7]  = modelcontext.value.nnumberofpositions;
  ncurrenttabofval[8]  = modelcontext.value.nnumberofemployee;
  ncurrenttabofval[9]  = modelcontext.value.norgchangemin;
  ncurrenttabofval[10] = modelcontext.value.norgchangemax;

  cleanmodelcontext(modelcontext.value);
}




// standard function handler routine.
// specific handler for function handling result for org change
function handlefuncobject(ocurrentmodel, modelcontext, ocurrentfuncobjocc, funccontext, onextfuncnodes, nwithassmod)
{
  var bcheck = checkright(ocurrentmodel, ocurrentfuncobjocc, nwithassmod);
  
  if (bcheck == true) {
    // Orgelements and connections of the current element.
    var h_nfuncwithorg          = new __holder(modelcontext.value.nfuncwithorg);
    var h_norgobjects           = new __holder(modelcontext.value.norgobjects);
    var h_nnumberoforgunits     = new __holder(modelcontext.value.nnumberoforgunits);
    var h_nnumberofgroups       = new __holder(modelcontext.value.nnumberofgroups);
    var h_nnumberofpersons      = new __holder(modelcontext.value.nnumberofpersons);
    var h_nnumberofpositions    = new __holder(modelcontext.value.nnumberofpositions);
    var h_nnumberofemployee     = new __holder(modelcontext.value.nnumberofemployee);
    
    getorgandcxncurfun(ocurrentmodel, ocurrentfuncobjocc, funccontext.oorgoccsfromcurfu, funccontext.ocxnoccsfromcurfu, 
                     h_nfuncwithorg, h_norgobjects, h_nnumberoforgunits, h_nnumberofgroups, h_nnumberofpersons, 
                     h_nnumberofpositions, h_nnumberofemployee, nwithassmod);
    

    if (onextfuncnodes.value.length > 0) {
      // Delete global list.
      // Increase number of function transitions.
      modelcontext.value.ncountoffunctran = (modelcontext.value.ncountoffunctran + onextfuncnodes.value.length);
      // Orgelements and connections of the following functions.
      getorgandcxnnextfu(ocurrentmodel, onextfuncnodes, funccontext.oorgoccsfromnextfu, funccontext.ocxnoccsfromnextfu, nwithassmod, 
                         h_norgobjects, h_nnumberoforgunits, h_nnumberofgroups, h_nnumberofpersons, h_nnumberofpositions, h_nnumberofemployee);
    }

    modelcontext.value.nfuncwithorg         = h_nfuncwithorg.value;
    modelcontext.value.norgobjects          = h_norgobjects.value;
    modelcontext.value.nnumberoforgunits    = h_nnumberoforgunits.value;
    modelcontext.value.nnumberofgroups      = h_nnumberofgroups.value;
    modelcontext.value.nnumberofpersons     = h_nnumberofpersons.value;
    modelcontext.value.nnumberofpositions   = h_nnumberofpositions.value;
    modelcontext.value.nnumberofemployee    = h_nnumberofemployee.value;
    
    // Organizational change: min. or max.
    var h_oorgoccsfromcurfu     = new __holder(funccontext.oorgoccsfromcurfu);
    var h_oorgoccsfromnextfu    = new __holder(funccontext.oorgoccsfromnextfu);
    var h_ocxnoccsfromnextfu    = new __holder(funccontext.ocxnoccsfromnextfu);
    var h_minmaxaddvalues       = new __holder(funccontext.minmaxaddvalues);
    var h_nminvalue             = new __holder(modelcontext.value.norgchangemin);
    var h_nmaxvalue             = new __holder(modelcontext.value.norgchangemax);
    
    checkorgchange(onextfuncnodes, h_oorgoccsfromcurfu, funccontext.ocxnoccsfromcurfu, h_oorgoccsfromnextfu, h_ocxnoccsfromnextfu, h_nminvalue, h_nmaxvalue);

    funccontext.oorgoccsfromcurfu     = h_oorgoccsfromcurfu.value;
    funccontext.oorgoccsfromnextfu    = h_oorgoccsfromnextfu.value;
    funccontext.ocxnoccsfromnextfu    = h_ocxnoccsfromnextfu.value;
    funccontext.minmaxaddvalues       = h_minmaxaddvalues.value;
    modelcontext.value.norgchangemin   = h_nminvalue.value;
    modelcontext.value.norgchangemax   = h_nmaxvalue.value;
  }
  
  else {
    var numsuccs = 0;     
    var i = 0; var j = 0;

    numsuccs = onextfuncnodes.value.length;
    if (numsuccs > 0) {
      for ( i = 0 ; i < numsuccs ; i++ ){
        var balreadyinlist = false;
        for (j = 0; j<funccontext.minmaxaddvalues.length;j++) {
          if (funccontext.minmaxaddvalues[j].ofuncobjocc.IsEqual(onextfuncnodes.value[i])) {
            balreadyinlist = true;
          }
        }
        
        if (!balreadyinlist) {
          var idx = funccontext.minmaxaddvalues.length;
          funccontext.minmaxaddvalues[idx] = new __usertype_tminmaxvalueset();
          funccontext.minmaxaddvalues[idx].ofuncobjocc = onextfuncnodes.value[i];
          funccontext.minmaxaddvalues[idx].nminvalue = 0;
          funccontext.minmaxaddvalues[idx].nmaxvalue = 0;
        }
      }
    }
  }
}





// ------------------------------------------------------------------------
// Subroutine CheckChange1
// Subprogram for determining the minimum and maximum organizational change if both connections are of the 'contributes to' type.
// Parameter
// oDummyOrgOccs = List containing the organizational units of the current following function.
// oOrgOccsFromCurFu = List of Orgelements of the current function.
// nOrgChangeMin = Variable for checking the number of minimum organizational change.
// nOrgChangeMax = Variable for checking the number of maximum organizational change.
// ------------------------------------------------------------------------
function checkchange1(odummyorgoccs, oorgoccsfromcurfu, norgchangemin, norgchangemax)
{
  var bcheck = false;   // Indicator flag if both fields have the same orgelements.
  var i = 0;   var j = 0; 

  for ( i = 0 ; i < odummyorgoccs.length ; i++ ){
    for ( j = 0 ; j < oorgoccsfromcurfu.value.length ; j++ ){
      if (oorgoccsfromcurfu.value[j].ObjDef().IsEqual(odummyorgoccs[i].ObjDef()) == true) {
        bcheck = true;
        break;
      }
    }
    if (bcheck == true) {
      break;
    }
  }

  if (bcheck == false) {
    norgchangemin.value++;
    norgchangemax.value++;
  }
}




// ------------------------------------------------------------------------
// Subroutine CheckChange2
// Subprogram for determining minimum and maximum organizational change if one connection is of the 'contributes to' type and the other of the 'executes' type.
// Parameter
// oCoOrgOccs = List containing the orgunits with the connections 'contributes to'.
// oExOrgOccs = List containing the orgunits with the connections 'executes'.
// nOrgChangeMin = Variable for checking the number of minimum organizational change.
// nOrgChangeMax = Variable for checking the number of maximum organizational change.
// ------------------------------------------------------------------------
function checkchange2(ocoorgoccs, oexorgoccs, norgchangemin, norgchangemax)
{
  var bcheckonesame = false;   // Indicator flag if 1 orgelement is contained in both fields
  var bcheckonenotinboth = false;   // Indicator flag if 1 orgelement with the connection 'executes' does only occur once.
  var bcheck = false;   // Indicator flag for one throughput.
  var i = 0;   var j = 0; 

  for ( i = 0 ; i < oexorgoccs.value.length ; i++ ){
    bcheck = false;
    for ( j = 0 ; j < ocoorgoccs.value.length ; j++ ){
      if (oexorgoccs.value[i].ObjDef().IsEqual(ocoorgoccs.value[j].ObjDef()) == true) {
        bcheckonesame = true;
        bcheck = true;
      }
    }
    if (bcheck == false) {
      bcheckonenotinboth = true;
    }
  }

  if (bcheckonenotinboth == true) {
    if (bcheckonesame == false) {
      norgchangemin.value++;
      norgchangemax.value++;
    } else {
      norgchangemax.value++;
    }
  }
}




// ------------------------------------------------------------------------
// Subroutine CheckChange3
// Subprogram for determining min.-max.-orgchange if both connections are of the "führt aus" type.
// Parameter
// oDummyOrgOccs = List containing the organizational units of the current following function.
// oOrgOccsFromCurFu = List of connection occurrences of the current function.
// nOrgChangeMin = Variable for checking the number of minimum organizational change.
// nOrgChangeMax = Variable for checking the number of maximum organizational change.
// ------------------------------------------------------------------------
function checkchange3(odummyorgoccs, oorgoccsfromcurfu, norgchangemin, norgchangemax)
{
  var bcheckonesame = false;   // Indicator flag if 1 orgelement is contained in both fields
  var bcheckonenotinboth = false;   // Indicator flag if 1 orgelement with the connection 'executes' does only occur once.
  var i = 0;   var j = 0; 

  for ( i = 0 ; i < odummyorgoccs.length ; i++ ){
    for ( j = 0 ; j < oorgoccsfromcurfu.value.length ; j++ ){
      if (odummyorgoccs[i].ObjDef().IsEqual(oorgoccsfromcurfu.value[j].ObjDef()) == true) {
        bcheckonesame = true;
      } else {
        bcheckonenotinboth = true;
      }
    }
  }

  if (bcheckonenotinboth == true) {
    if (bcheckonesame == false) {
      norgchangemin.value++;
      norgchangemax.value++;
    } else {
      norgchangemax.value++;
    }
  }
}




// ------------------------------------------------------------------------
// Subroutine CheckDoneFunc
// Subprogram: Checks whether the current function occurrence has already been evaluated.
// Parameter
// oCurrentObjOcc = current object occurrence
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
// Subroutine CheckOrg
// Subprogram for checking whether the occurrence of the current orgelement has already been processed.
// If it has not been registered it is written into the global list g_oDoneOrgObjDefs and the corresponding counter will be raised.
// Parameter
// oCurrentOrgObjDef = current orgelement.
// nOrgObjects = Variable for determining the number of allocated organizational objects.
// nNumberOfOrgUnits As Long 'Variable for determining the number of organizational units.
// nNumberOfGroups As Long 'Variable for determining the number of groups.
// nNumberOfPersons As Long 'Variable for determining the number of persons.
// nNumberOfPositions As Long 'Variable for determining the number of positions.
// nNumberOfEmployee As Long 'Variable for determining the number of employees.
// ------------------------------------------------------------------------
function checkorg(ocurrentorgobjdef, norgobjects, nnumberoforgunits, nnumberofgroups, nnumberofpersons, nnumberofpositions, nnumberofemployee)
{
  var bfound = false;   // Indicator flag whether the orgelement has already been evaluated.
  var borg = false; 

  if (g_odoneorgobjdefs.length > 0) {
    for (var i = 0 ; i < g_odoneorgobjdefs.length ; i++ ){
      if (ocurrentorgobjdef.IsEqual(g_odoneorgobjdefs[i]) == true) {
        bfound = true;
        break;
      }
    }
  }

  if (bfound == false) {
    g_odoneorgobjdefs[g_odoneorgobjdefs.length] = ocurrentorgobjdef;
    norgobjects.value++;
    
    // Orgelemente are checked.
    switch(ocurrentorgobjdef.TypeNum()) {
      case Constants.OT_ORG_UNIT:
        __functionResult = true;
        nnumberoforgunits.value++;
      break;
      
      case Constants.OT_GRP:
        __functionResult = true;
        nnumberofgroups.value++;
      break;
      
      case Constants.OT_PERS:
        __functionResult = true;
        nnumberofpersons.value++;
      break;
      
      case Constants.OT_POS:
        __functionResult = true;
        nnumberofpositions.value++;
      break;
      
      case Constants.OT_PERS_TYPE:
        __functionResult = true;
        nnumberofemployee.value++;
      break;
    }
  }

  return __functionResult;
}




// ------------------------------------------------------------------------
// Subroutine CheckOrgChange
// This subprogram is used for determining the minimum and maximum organizational changes.
// Parameter
// oNextFuncNodes = List of following function objects of the current function.
// oOrgOccsFromCurFu = List of Orgelements of the current function.
// oCxnOccsFromCurFu = List of connection occurrences of the current function.
// oOrgOccsFromNextFu = Field with the orgelements of the following functions.
// oCxnOccsFromNextFu = Field containing the connections of the following functions.
// nOrgChangeMin As Long 'Variable for determining the number of the minimum organizational changes.
// nOrgChangeMax As Long 'Variable for determining the number of the maximum organizational changes.
// ------------------------------------------------------------------------
function checkorgchange(onextfuncnodes, oorgoccsfromcurfu, ocxnoccsfromcurfu, oorgoccsfromnextfu, ocxnoccsfromnextfu, nminvalue, nmaxvalue)
{

  var odummyorgoccs = new __holder(null);   // List containing the orgunits of the current following function for comparison with the orgelements in the list oOrgOccsFromCurFu.
  var odummycxnoccs = null;   // List containing the connections to the orgunits of the current following function for comparison with the connections (oCxnOccsFromCurFu) of the orgelements in the list oOrgOccsFromCurFu.
  var ofuncobjocc = null; 

  odummyorgoccs.value = new Array();
  odummycxnoccs = new Array();

  var i = 0; var j = 0;  var numsuccs = 0; 

  numsuccs = onextfuncnodes.value.length;

  while (onextfuncnodes.value.length > 0) {
    ofuncobjocc = getfirstcheckelem(onextfuncnodes, odummyorgoccs.value, odummycxnoccs, oorgoccsfromnextfu, ocxnoccsfromnextfu);
    if (odummyorgoccs.value.length > 0) {
      switch(ocxnoccsfromcurfu[0].Cxn().TypeNum()) {
        case Constants.CT_CONTR_TO_1:
        case Constants.CT_CONTR_TO_2:
          switch(odummycxnoccs[0].Cxn().TypeNum()) {
            case Constants.CT_CONTR_TO_1:
            case Constants.CT_CONTR_TO_2:
              // Both connections of the 'contributes to' type.
              checkchange1(odummyorgoccs.value, oorgoccsfromcurfu, nminvalue, nmaxvalue);
            break;
            
            case Constants.CT_EXEC_1:
            case Constants.CT_EXEC_2:
            case Constants.CT_EXEC_3:
              // One connection of the 'contributes to' type, the other of the 'executes' type.
              checkchange2(oorgoccsfromcurfu, odummyorgoccs, nminvalue, nmaxvalue);
            break;
          }
        break;
        
        case Constants.CT_EXEC_1:
        case Constants.CT_EXEC_2:
        case Constants.CT_EXEC_3:
          switch(odummycxnoccs[0].Cxn().TypeNum()) {
            case Constants.CT_CONTR_TO_1:
            case Constants.CT_CONTR_TO_2:
              // One connection of the 'contributes to' type, the other of the 'executes' type.
              checkchange2(odummyorgoccs, oorgoccsfromcurfu, nminvalue, nmaxvalue);
            break;
            
            case Constants.CT_EXEC_1:
            case Constants.CT_EXEC_2:
            case Constants.CT_EXEC_3:
              // Both connections of the 'executes' type.
              checkchange3(odummyorgoccs.value, oorgoccsfromcurfu, nminvalue, nmaxvalue);
            break;
          }
        break;
      }
    }

    odummyorgoccs.value = new Array();
    odummycxnoccs.value = new Array();
  }
  odummyorgoccs.value = null;
}




function setfuncobjoccchangeminmaxvalues(ofuncobjocc, minmaxaddvalues, nminvalue, nmaxvalue)
{
  var i = 0; 
  for ( i = 0 ; i < minmaxaddvalues.value.length ; i++ ){
    if (minmaxaddvalues.value[i].ofuncobjocc.IsEqual(ofuncobjocc)) {
      minmaxaddvalues.value[i].nminvalue = nminvalue;
      minmaxaddvalues.value[i].nmaxvalue = nmaxvalue;
    }
  }
}




// ------------------------------------------------------------------------
// Subroutine CheckRight
// Subprogram for checking whether the linked orgelements are relevant.
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
  var ocurrentcxnocc = null;   // Connection between oOrgelement and function.
  var oassignedmodels = null;   // List of models which are assigned to the function.
  var osubmodfunc = null;   // Object definition of the current function definition in the assigned model.
  var i = 0;   var j = 0;   var h = 0; 

  oprednodes = ocurrentmodel.value.GetPredNodes(ocurrentfunobjocc.value);
  if (oprednodes.length > 0) {
    for ( i = 0 ; i < oprednodes.length ; i++ ){
      switch(oprednodes[i].ObjDef().TypeNum()) {
        case Constants.OT_ORG_UNIT:
        case Constants.OT_GRP:
        case Constants.OT_PERS:
        case Constants.OT_POS:
        case Constants.OT_PERS_TYPE:
          ocxnoccs = oprednodes[i].OutEdges(Constants.EDGES_ALL);
          for ( j = 0 ; j < ocxnoccs.length ; j++ ){
            ocurrentcxnocc = ocxnoccs[j];
            if (ocurrentcxnocc.TargetObjOcc().IsEqual(ocurrentfunobjocc.value) == true) {
              switch(ocurrentcxnocc.Cxn().TypeNum()) {
                case Constants.CT_EXEC_1:
                case Constants.CT_EXEC_2:
                case Constants.CT_EXEC_3:
                case Constants.CT_CONTR_TO_1:
                case Constants.CT_CONTR_TO_2:
                  __functionResult = true;
                  break;
                break;
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
            osubmodfunc = ocurrentfunobjocc.value.ObjDef().OccListInModel(oassignedmodels[j]);
            if (osubmodfunc.length > 0) {
                ocxnoccs = oassignedmodels[j].CxnOccList();
                for ( h = 0 ; h < ocxnoccs.length ; h++ ){
                  ocurrentcxnocc = ocxnoccs[h];
                  if (ocurrentcxnocc.TargetObjOcc().IsEqual(osubmodfunc[0]) == true) {
                    switch(ocurrentcxnocc.Cxn().TypeNum()) {
                      case Constants.CT_EXEC_1:
                      case Constants.CT_EXEC_2:
                      case Constants.CT_EXEC_3:
                      case Constants.CT_CONTR_TO_1:
                      case Constants.CT_CONTR_TO_2:
                        switch(ocurrentcxnocc.SourceObjOcc().ObjDef().TypeNum()) {
                          case Constants.OT_ORG_UNIT:
                          case Constants.OT_GRP:
                          case Constants.OT_PERS:
                          case Constants.OT_POS:
                          case Constants.OT_PERS_TYPE:
                            __functionResult = true;
                            break;
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

  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 700, 145, getString("TEXT16"));
  userdialog.Text(10, 10, 460, 15, getString("TEXT31"));
  userdialog.Text(10, 25, 460, 15, getString("TEXT32"));
  userdialog.GroupBox(7, 50, 686, 60, getString("TEXT33"));
  userdialog.OptionGroup("options1");
  userdialog.OptionButton(20, 65, 580, 15, getString("TEXT34"));
  userdialog.OptionButton(20, 80, 580, 15, getString("TEXT35"));
  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_84bf7ad0_2f2f_11d9_017b_e10284184242_dlg_01.hlp");

  var dlg = Dialogs.createUserDialog(userdialog); 
  // Read dialog settings from config
  var sSection = "SCRIPT_84bf7ad0_2f2f_11d9_017b_e10284184242";  
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
// This subprogram is used for writing the corresponding orgelements and connections of the current following function
// in the lists oDummyOrgOccs, oDummyCxnOccs. The following function and it's orgelements as well as
// connections are at the same time removed from the lists oNextFuncNodes, oOrgOccsFromNextFu and oCxnOccsFromNextFu.
// Parameter
// oNextFuncNodes = List of following function objects of the current function.
// oDummyOrgOccs = List containing the orgunits of the current following function for comparison with the orgelements contained in the list oOrgOccsFromCurFu.
// oDummyCxnOccs = List containing the connections to the orgunits of the current following function for comparison with the connections (oCxnOccsFromCurFu) of the orgelements contained in list oOrgOccsFromCurFu.
// oOrgOccsFromNextFu = Field with the orgelements of the following functions.
// oCxnOccsFromNextFu = Field containing the connections of the following functions.
// ----------------------------------------------------------------------------
function getfirstcheckelem(onextfuncnodes, odummyorgoccs, odummycxnoccs, oorgoccsfromnextfu, ocxnoccsfromnextfu)
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
      odummyorgoccs[odummyorgoccs.length] = oorgoccsfromnextfu.value[0];
      oorgoccsfromnextfu.value = doDelete(oorgoccsfromnextfu, oorgoccsfromnextfu.value[0]);
      odummycxnoccs[odummycxnoccs.length] = ocxnoccsfromnextfu.value[0];
      ocxnoccsfromnextfu.value = doDelete(ocxnoccsfromnextfu, ocxnoccsfromnextfu.value[0]);
      onextfuncnodes.value = doDelete(onextfuncnodes, ofuncobjocc);
    }
    else {
      bcheck = false;
    }
  }

  __functionResult = ocheckobjocc;
  return __functionResult;
}




// ----------------------------------------------------------------------------
// Subroutine GetOrgAndCxnCurFun
// Subprogram for determining the orgelements and connections of the current function.
// Parameter
// oCurrentModel = current model.
// oCurrentFuncObjOcc = current function.
// oOrgOccsFromCurFu = List of Orgelements of the current function.
// oCxnOccsFromCurFu = List of connection occurrences of the current function.
// nOrgObjects = Variable for determining the number of allocated organizational objects.
// nNumberOfOrgUnits As Long 'Variable for determining the number of organizational units.
// nNumberOfGroups As Long 'Variable for determining the number of groups.
// nNumberOfPersons As Long 'Variable for determining the number of persons.
// nNumberOfPositions As Long 'Variable for determining the number of positions.
// nNumberOfEmployee As Long 'Variable for determining the number of employees.
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams should also be evaluated (1 = Yes / 0 = No).
// ----------------------------------------------------------------------------
function getorgandcxncurfun(ocurrentmodel, ocurrentfuncobjocc, oorgoccsfromcurfu, ocxnoccsfromcurfu, nnumfuncwithorgs, norgobjects, nnumberoforgunits, nnumberofgroups, nnumberofpersons, nnumberofpositions, nnumberofemployee, nwithassmod)
{
  var oassignedmodels = null;   // List of models which are assigned to the function.
  var odummyobjoccs = null;     // List of ObjOccs for temporary saving.
  var ocurrentcxnocc = null;    // Connection between oOrgelement and function.
  var ocxnoccs = null;          // List of connection occurrences.
  var oexeccxntooccs = null;    // List of object occurrences which are linked via the connection occurrences of the types CT_EXEC_1, CT_EXEC_2, CT_EXEC_3.
  var ocontrcxntooccs = null;   // List of object occurrences which are linked via the connection occurrences of the types CT_CONTR_TO_1, CT_CONTR_TO_2.
  var ocontrcxnoccs = null;     // List of connection occurrences of the types CT_CONTR_TO_1, CT_CONTR_TO_2.
  var oexeccxnoccs = null;      // List of connection occurrences of the types CT_EXEC_1, CT_EXEC_2, CT_EXEC_3.
  var osubmodfunc = null;       // Object definition of the current function definition in the assigned model.
  var scurrentfuname = "";      // Name of the current function definition.
  var borg = false; 
  var bhasorg = false; 
  var i = 0;   var j = 0;   var k = 0;   var l = 0; 

  oexeccxnoccs      = new Array();
  ocontrcxnoccs     = new Array();
  oexeccxntooccs    = new Array();
  ocontrcxntooccs   = new Array();
  
  // Orgelements and connections of the current function occurrence.
  // Direct
  
  odummyobjoccs = ocurrentmodel.value.GetPredNodes(ocurrentfuncobjocc.value);
  scurrentfuname = ocurrentfuncobjocc.value.ObjDef().Name(g_nloc);
  bhasorg = false;

  if (odummyobjoccs.length > 0) {
    for ( i = 0 ; i < odummyobjoccs.length ; i++ ){
      // Orgelements are checked.
      borg = false;
      switch(odummyobjoccs[i].ObjDef().TypeNum()) {
        case Constants.OT_ORG_UNIT:
        case Constants.OT_GRP:
        case Constants.OT_PERS:
        case Constants.OT_POS:
        case Constants.OT_PERS_TYPE:
          borg = checkorg(odummyobjoccs[i].ObjDef(), norgobjects, nnumberoforgunits, nnumberofgroups, nnumberofpersons, nnumberofpositions, nnumberofemployee);
          bhasorg = true;
          // bHasOrg Or bOrg
          ocxnoccs = odummyobjoccs[i].OutEdges(Constants.EDGES_ALL);
          for ( k = 0 ; k < ocxnoccs.length ; k++ ){
            ocurrentcxnocc = ocxnoccs[k];
            if (ocurrentcxnocc.TargetObjOcc().IsEqual(ocurrentfuncobjocc.value) == true) {
              // Check connections.
              switch(ocurrentcxnocc.Cxn().TypeNum()) {
                case Constants.CT_EXEC_1:
                case Constants.CT_EXEC_2:
                case Constants.CT_EXEC_3:
                  oexeccxnoccs[oexeccxnoccs.length]       = ocurrentcxnocc;
                  oexeccxntooccs[oexeccxntooccs.length]   = odummyobjoccs[i];
                break;
                case Constants.CT_CONTR_TO_1:
                case Constants.CT_CONTR_TO_2:
                  ocontrcxnoccs[ocontrcxnoccs.length]     = ocurrentcxnocc;
                  ocontrcxntooccs[ocontrcxntooccs.length] = odummyobjoccs[i];
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
                      case Constants.CT_EXEC_1:
                      case Constants.CT_EXEC_2:
                      case Constants.CT_EXEC_3:
                        bhasorg = true;
                        // bHasOrg Or bOrg
                        switch(ocurrentcxnocc.SourceObjOcc().ObjDef().TypeNum()) {
                          case Constants.OT_ORG_UNIT:
                          case Constants.OT_GRP:
                          case Constants.OT_PERS:
                          case Constants.OT_POS:
                          case Constants.OT_PERS_TYPE:
                            borg = checkorg(ocurrentcxnocc.SourceObjOcc().ObjDef(), norgobjects, nnumberoforgunits, nnumberofgroups, nnumberofpersons, nnumberofpositions, nnumberofemployee);
                            oexeccxnoccs[oexeccxnoccs.length] = ocurrentcxnocc;
                            oexeccxntooccs[oexeccxntooccs.length] = ocurrentcxnocc.SourceObjOcc();
                          break;
                        }
    
                      break;
                      case Constants.CT_CONTR_TO_1:
                      case Constants.CT_CONTR_TO_2:
                        bhasorg = true;
                        // bHasOrg Or bOrg
                        switch(ocurrentcxnocc.SourceObjOcc().ObjDef().TypeNum()) {
                          case Constants.OT_ORG_UNIT:
                          case Constants.OT_GRP:
                          case Constants.OT_PERS:
                          case Constants.OT_POS:
                          case Constants.OT_PERS_TYPE:
                            borg = checkorg(ocurrentcxnocc.SourceObjOcc().ObjDef(), norgobjects, nnumberoforgunits, nnumberofgroups, nnumberofpersons, nnumberofpositions, nnumberofemployee);
                            ocontrcxnoccs[ocontrcxnoccs.length] = ocurrentcxnocc;
                            ocontrcxntooccs[ocontrcxntooccs.length] = ocurrentcxnocc.SourceObjOcc();
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


  if (ocontrcxntooccs.length > 0) {
    for ( l = 0 ; l < ocontrcxntooccs.length ; l++ ){
      oorgoccsfromcurfu[oorgoccsfromcurfu.length] = ocontrcxntooccs[l];
      ocxnoccsfromcurfu[ocxnoccsfromcurfu.length] = ocontrcxnoccs[l];
    }
  } else {
    if (oexeccxntooccs.length > 0) {
      for ( l = 0 ; l < oexeccxntooccs.length ; l++ ){
        oorgoccsfromcurfu[oorgoccsfromcurfu.length] = oexeccxntooccs[l];
        ocxnoccsfromcurfu[ocxnoccsfromcurfu.length] = oexeccxnoccs[l];
      }
    }
  }

  if (bhasorg) {
    for ( i = 0 ; i < g_odonefuncwithorgs.length ; i++ ){
      if (g_odonefuncwithorgs[i].IsEqual(ocurrentfuncobjocc.value.ObjDef())) {
        bhasorg = false;
        break;
      }
    }

    if (bhasorg) {
      nnumfuncwithorgs.value++;
      g_odonefuncwithorgs[g_odonefuncwithorgs.length] = ocurrentfuncobjocc.value.ObjDef();
    }
  }
}


// ----------------------------------------------------------------------------
// Subroutine GetOrgAndCxnNextFu
// Subprogram for determining the organizational elements and occurrences of the following functions.
// Parameter
// oCurrentModel = current model.
// oNextFuncNodes = List of following function objects of the current function.
// oOrgOccsFromNextFu = Field with the orgelements of the following functions.
// oCxnOccsFromNextFu = Field containing the connections of the following functions.
// nWithAssMod = Variable for checking whether the assigned function allocation diagrams should also be evaluated (1 = Yes / 0 = No).
// nOrgObjects = Variable for determining the number of allocated organizational objects.
// nNumberOfOrgUnits As Long 'Variable for determining the number of organizational units.
// nNumberOfGroups As Long 'Variable for determining the number of groups.
// nNumberOfPersons As Long 'Variable for determining the number of persons.
// nNumberOfPositions As Long 'Variable for determining the number of positions.
// nNumberOfEmployee As Long 'Variable for determining the number of employees.
// ----------------------------------------------------------------------------
function getorgandcxnnextfu(ocurrentmodel, onextfuncnodes, oorgoccsfromnextfu, ocxnoccsfromnextfu, nwithassmod, norgobjects, nnumberoforgunits, nnumberofgroups, nnumberofpersons, nnumberofpositions, nnumberofemployee)
{
  var odummynextobjoccs = null;   // List of ObjOccs for temporary saving.
  var odummyfuncobjoccs = null;   // List of ObjOccs for temporary saving.
  var ocurrentcxnocc = null;   // Connection between oOrgelement and function.
  var ocxnoccs = null;   // List of connection occurrences.
  var oexorgoccs = null;   // List of objects which are linked to the current function via 'executes' connections.
  var ocoorgoccs = null;   // List of objects which are linked to the current function via 'contributes to' connections.
  var oexcxnoccs = null;   // List of connections (Occs) of the 'executes' type.
  var ococxnoccs = null;   // List of connections (Occs) of the 'contributes to' type.
  var oassignedmodels = null;   // List of models which are assigned to the current function.
  var osubmodfunc = null;   // Object definition of the current function definition in the assigned model.
  var scurrentfuname = "";   // Name of the current function definition.
  var i = 0;   var j = 0;   var k = 0;   var m = 0; 

  oexorgoccs = new Array();
  ocoorgoccs = new Array();
  oexcxnoccs = new Array();
  ococxnoccs = new Array();
  odummyfuncobjoccs = new Array();

  for ( i = 0 ; i < onextfuncnodes.value.length ; i++ ){
    odummyfuncobjoccs[odummyfuncobjoccs.length] = onextfuncnodes.value[i];
  }

  while (onextfuncnodes.value.length > 0) {
    onextfuncnodes.value = doDelete(onextfuncnodes, onextfuncnodes.value[0]);
  }


  for ( i = 0 ; i < odummyfuncobjoccs.length ; i++ ){
    scurrentfuname = odummyfuncobjoccs[i].ObjDef().Name(g_nloc);
    odummynextobjoccs = ocurrentmodel.value.GetPredNodes(odummyfuncobjoccs[i]);
    if (odummynextobjoccs.length > 0) {
      for ( j = 0 ; j < odummynextobjoccs.length ; j++ ){
        // Orgelemente are checked.
        switch(odummynextobjoccs[j].ObjDef().TypeNum()) {
          case Constants.OT_ORG_UNIT:
          case Constants.OT_GRP:
          case Constants.OT_PERS:
          case Constants.OT_POS:
          case Constants.OT_PERS_TYPE:
            checkorg(odummynextobjoccs[j].ObjDef(), norgobjects, nnumberoforgunits, nnumberofgroups, nnumberofpersons, nnumberofpositions, nnumberofemployee);
            ocxnoccs = odummynextobjoccs[j].OutEdges(Constants.EDGES_ALL);
            for ( m = 0 ; m < ocxnoccs.length ; m++ ){
              ocurrentcxnocc = ocxnoccs[m];
              if (ocurrentcxnocc.TargetObjOcc().IsEqual(odummyfuncobjoccs[i]) == true) {
                switch(ocurrentcxnocc.Cxn().TypeNum()) {
                  case Constants.CT_EXEC_1:
                  case Constants.CT_EXEC_2:
                  case Constants.CT_EXEC_3:
                    oexorgoccs[oexorgoccs.length] = odummynextobjoccs[j];
                    oexcxnoccs[oexcxnoccs.length] = ocurrentcxnocc;
                  break;
                  case Constants.CT_CONTR_TO_1:
                  case Constants.CT_CONTR_TO_2:
                    ocoorgoccs[ocoorgoccs.length] = odummynextobjoccs[j];
                    ococxnoccs[ococxnoccs.length] = ocurrentcxnocc;
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
                        case Constants.CT_EXEC_1:
                        case Constants.CT_EXEC_2:
                        case Constants.CT_EXEC_3:
                          switch(ocurrentcxnocc.SourceObjOcc().ObjDef().TypeNum()) {
                            case Constants.OT_ORG_UNIT:
                            case Constants.OT_GRP:
                            case Constants.OT_PERS:
                            case Constants.OT_POS:
                            case Constants.OT_PERS_TYPE:
                              checkorg(ocurrentcxnocc.SourceObjOcc().ObjDef(), norgobjects, nnumberoforgunits, nnumberofgroups, nnumberofpersons, nnumberofpositions, nnumberofemployee);
                              oexcxnoccs[oexcxnoccs.length] = ocurrentcxnocc;
                              oexorgoccs[oexorgoccs.length] = ocurrentcxnocc.SourceObjOcc();
                            break;
                          }
                        break;
                        
                        case Constants.CT_CONTR_TO_1:
                        case Constants.CT_CONTR_TO_2:
                          switch(ocurrentcxnocc.SourceObjOcc().ObjDef().TypeNum()) {
                            case Constants.OT_ORG_UNIT:
                            case Constants.OT_GRP:
                            case Constants.OT_PERS:
                            case Constants.OT_POS:
                            case Constants.OT_PERS_TYPE:
                              checkorg(ocurrentcxnocc.SourceObjOcc().ObjDef(), norgobjects, nnumberoforgunits, nnumberofgroups, nnumberofpersons, nnumberofpositions, nnumberofemployee);
                              ocoorgoccs[ocoorgoccs.length] = ocurrentcxnocc.SourceObjOcc();
                              ococxnoccs[ococxnoccs.length] = ocurrentcxnocc;
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

    if (ocoorgoccs.length > 0) {
      for ( j = 0 ; j < ocoorgoccs.length ; j++ ){
        onextfuncnodes.value[onextfuncnodes.value.length] = odummyfuncobjoccs[i];
        oorgoccsfromnextfu[oorgoccsfromnextfu.length] = ocoorgoccs[j];
        ocxnoccsfromnextfu[ocxnoccsfromnextfu.length] = ococxnoccs[j];
      }
    }
    else {
      if (oexorgoccs.length > 0) {
        for ( j = 0 ; j < oexorgoccs.length ; j++ ){
          onextfuncnodes.value[onextfuncnodes.value.length] = odummyfuncobjoccs[i];
          oorgoccsfromnextfu[oorgoccsfromnextfu.length] = oexorgoccs[j];
          ocxnoccsfromnextfu[ocxnoccsfromnextfu.length] = oexcxnoccs[j];
        }
      }
    }

    // Reset
    ocoorgoccs = new Array();
    ococxnoccs = new Array();
    oexorgoccs = new Array();
    oexcxnoccs = new Array();

    if (nwithassmod.value == 1) {
      oassignedmodels = new Array();
    }
  }
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
  var ocurrentmodel = new __holder(null);   // Current model of list oModels
  var ncurrenttabofval = new Array();       // List containing the current model's values.
  var i = 0;   var j = 0; 

  for ( i = 0 ; i < omodels.length ; i++ ){

    g_odoneobjoccs = new Array();
    g_odoneorgobjdefs = new Array();
    g_odonefuncwithorgs = new Array();
    ocurrentmodel.value = omodels[i];

    // Determine current model values.
    getmodelval(ocurrentmodel, ncurrenttabofval, nwithassmod);
    // Add current values to general values.
    for ( j = 0 ; j < 10+1 ; j++ ){
      nvaluetable[j][i] = nvaluetable[j][i] + ncurrenttabofval[j];
    }
  }

  ocurrentmodel.value = null;
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
  g_ooutfile.DefineF("REPORT6", getString("TEXT29"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT6_green", getString("TEXT29"), 12, Constants.C_BLACK, 0xCCFFCC, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT6_green_bold", getString("TEXT29"), 12, Constants.C_BLACK, 0xCCFFCC, Constants.FMT_LEFT | Constants.FMT_BOLD, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT6_pink", getString("TEXT29"), 12, Constants.C_BLACK, 0xFFCC99, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT6_pink_bold", getString("TEXT29"), 12, Constants.C_BLACK, 0xFFCC99, Constants.FMT_LEFT | Constants.FMT_BOLD, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT6_blue", getString("TEXT29"), 12, Constants.C_BLACK, 0xCCFFFF, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT6_blue_bold", getString("TEXT29"), 12, Constants.C_BLACK, 0xCCFFFF, Constants.FMT_LEFT | Constants.FMT_BOLD, 0, 0, 0, 0, 0, 1);

  var nvalue = 0; 
  var ncut = 0.0; 
  var i = 0;   var j = 0; 

  var sFormat;
  if (nselectedoption == 0) {
  // Cumulated
  // Individual
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF(sname, 40, "REPORT6_green");
    sFormat = "REPORT6_pink_bold";
    g_ooutfile.TableCellF(g_sstringarray[13], 10, sFormat);
    for ( i = 0 ; i < 12+1 ; i++ ){
      if (i < 9) {
        g_ooutfile.TableRow();
        g_ooutfile.TableCellF(g_sstringarray[i], 40, "REPORT6_green");
        g_ooutfile.TableCellF(nvaluetable[i], 10, sFormat);
      }

      if (i == 9) {
        // Minimum number. Organizational change.
        g_ooutfile.TableRow();
        g_ooutfile.TableCellF(g_sstringarray[9], 40, "REPORT6_green");
        g_ooutfile.TableCellF(nvaluetable[9], 10, sFormat);
      }

      if (i == 10) {
        // Ratio min. change/function transitions.
        g_ooutfile.TableRow();
        g_ooutfile.TableCellF(g_sstringarray[10], 40, "REPORT6_green");
        if (nvaluetable[2] == 0) {
          g_ooutfile.TableCellF("0", 10, sFormat);
        }
        else {
          ncut = round2(nvaluetable[9] / nvaluetable[2]);
          g_ooutfile.TableCellF(ncut, 10, sFormat);
        }
      }

      if (i == 11) {
        // Maximum number. Organizational change.
        g_ooutfile.TableRow();
        g_ooutfile.TableCellF(g_sstringarray[11], 40, "REPORT6_green");
        g_ooutfile.TableCellF(nvaluetable[10], 10, sFormat);
      }

      if (i == 12) {
        // Ratio max. change/function transitions.
        g_ooutfile.TableRow();
        g_ooutfile.TableCellF(g_sstringarray[12], 40, "REPORT6_green");
        if (nvaluetable[2] == 0) {
          g_ooutfile.TableCellF("0", 10, sFormat);
        }
        else {
          ncut = round2((nvaluetable[10] / nvaluetable[2]));
          g_ooutfile.TableCellF(ncut, 10, sFormat);
        }
      }
    }
  }
  else {
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF(sname, 40, "REPORT6_green_bold");
    for ( i = 0 ; i < omodels.length ; i++ ){
      sFormat = (i%2 == 0) ? "REPORT6_pink_bold" : "REPORT6_blue_bold";
      g_ooutfile.TableCellF(g_sstringarray[14]+" "+(i+1), 10, sFormat);
    }

    for ( i = 0 ; i < 12+1 ; i++ ){
      if (i < 9) {
        g_ooutfile.TableRow();
        g_ooutfile.TableCellF(g_sstringarray[i], 40, "REPORT6_green");
        for ( j = 0 ; j < omodels.length ; j++ ){
          sFormat = (j%2 == 0) ? "REPORT6_pink" : "REPORT6_blue";
          g_ooutfile.TableCellF(nvaluetable[i][j], 10, sFormat);
        }
      }

      if (i == 9) {
        // Maximum number. Organizational change.
        g_ooutfile.TableRow();
        g_ooutfile.TableCellF(g_sstringarray[9], 40, "REPORT6_green");
        for ( j = 0 ; j < omodels.length ; j++ ){
          sFormat = (j%2 == 0) ? "REPORT6_pink" : "REPORT6_blue";
          g_ooutfile.TableCellF(nvaluetable[9][j], 10, sFormat);
        }
      }

      if (i == 10) {
        // Ratio min. change/function transitions.
        g_ooutfile.TableRow();
        g_ooutfile.TableCellF(g_sstringarray[10], 40, "REPORT6_green");
        for ( j = 0 ; j < omodels.length ; j++ ){
          sFormat = (j%2 == 0) ? "REPORT6_pink_bold" : "REPORT6_blue_bold";
          if (nvaluetable[2][j] == 0) {
            g_ooutfile.TableCellF("0", 10, sFormat);
          }
          else {
            ncut = round2((nvaluetable[9][j] / nvaluetable[2][j]));
            g_ooutfile.TableCellF(ncut, 10, sFormat);
          }
        }
      }

      if (i == 11) {
        // Maximum number. Organizational change.
        g_ooutfile.TableRow();
        g_ooutfile.TableCellF(g_sstringarray[11], 40, "REPORT6_green");
        for ( j = 0 ; j < omodels.length ; j++ ){
          sFormat = (j%2 == 0) ? "REPORT6_pink" : "REPORT6_blue";
          g_ooutfile.TableCellF(nvaluetable[10][j], 10, sFormat);
        }
      }

      if (i == 12) {
        // Ratio max. change/function transitions.
        g_ooutfile.TableRow();
        g_ooutfile.TableCellF(g_sstringarray[12], 40, "REPORT6_green");
        for ( j = 0 ; j < omodels.length ; j++ ){
          sFormat = (j%2 == 0) ? "REPORT6_pink_bold" : "REPORT6_blue_bold";
          if (nvaluetable[2][j] == 0) {
            g_ooutfile.TableCellF("0", 10, sFormat);
          }
          else {
            ncut = round2((nvaluetable[10][j] / nvaluetable[2][j]));
            g_ooutfile.TableCellF(ncut, 10, sFormat);
          }
        }
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
  var ocurrentuser = null; 
  var spath = "";   // Path of the current model.
  var soutputline = ""; 
  var i = 0;   var j = 0; 

  ocurrentuser = ArisData.getActiveUser();
  g_ooutfile.DefineF("REPORT1", getString("TEXT29"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT2", getString("TEXT29"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT3", getString("TEXT29"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

  if (boutcheck == true) {
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(g_sstringarray[15] + ": " + sname, 20, getString("TEXT29"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell("", 20, getString("TEXT29"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    g_ooutfile.Output(g_sstringarray[16] + ": ", getString("TEXT29"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT, 0);
    g_ooutfile.OutputField(Constants.FIELD_DATE, getString("TEXT29"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT);
    g_ooutfile.Output(" ", getString("TEXT29"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT, 0);
    g_ooutfile.OutputField(Constants.FIELD_TIME, getString("TEXT29"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(g_sstringarray[17] + ": " + ArisData.getActiveDatabase().ServerName(), 20, getString("TEXT29"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(g_sstringarray[18] + ": " + ArisData.getActiveDatabase().Name(g_nloc), 20, getString("TEXT29"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(g_sstringarray[19] + ": " + ocurrentuser.Name(g_nloc), 20, getString("TEXT29"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(g_sstringarray[20] + ": " + Context.getSelectedFile(), 20, getString("TEXT29"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(g_sstringarray[21] + ": " + g_sstringarray[24], 20, getString("TEXT29"), 12, Constants.C_BLACK, 0xC0C0C0, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    g_ooutfile.TableRow();
    g_ooutfile.TableRow();
    g_ooutfile.TableCell(g_sstringarray[22] + ": ", 20, getString("TEXT29"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER | Constants.FMT_BOLD, 0)
    var nColor;
    for ( i = 0 ; i < omodels.length ; i++ ){
      nColor = (i%2 == 0) ? 0xFFCC99 : 0xCCFFFF;
      g_ooutfile.TableRow();
      spath = omodels[i].Group().Path(g_nloc);
      g_ooutfile.TableCell("" + (i + 1) + ".) " + spath + "\\" + omodels[i].Name(g_nloc) + " (" + omodels[i].Type() + ")", 20, getString("TEXT29"), 12, Constants.C_BLACK, nColor, 0, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0);
    }
    g_ooutfile.TableRow();
  }
  
  
  else {
    // Header Footer
    g_ooutfile.BeginHeader();
    g_ooutfile.EndHeader();
    g_ooutfile.BeginFooter();
    g_ooutfile.OutputLnF("" + (new __date()) + " " + (new __time()) + ";" + ArisData.getActiveDatabase().Name(g_nloc) + ";" + ArisData.getActiveDatabase().ServerName() + ";" + Context.getSelectedFile() + ";" + getString("TEXT36"), "REPORT3");
    g_ooutfile.Output(g_sstringarray[23] + " ", getString("TEXT29"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    g_ooutfile.OutputField(Constants.FIELD_PAGE, getString("TEXT29"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    g_ooutfile.EndFooter();

    // Headline
    g_ooutfile.OutputLnF("", "REPORT3");
    g_ooutfile.OutputLnF(g_sstringarray[15], "REPORT1");
    g_ooutfile.OutputLnF("", "REPORT2");
    // Creating
    g_ooutfile.OutputLnF(g_sstringarray[16] + ": " + (new __date()) + " " + (new __time()), "REPORT2");
    // Database and Server
    g_ooutfile.OutputLnF(g_sstringarray[17] + ": " + ArisData.getActiveDatabase().ServerName(), "REPORT2");
    g_ooutfile.OutputLnF(g_sstringarray[18] + ": " + ArisData.getActiveDatabase().Name(g_nloc), "REPORT2");
    ocurrentuser = ArisData.getActiveUser();
    // User
    g_ooutfile.OutputLnF(g_sstringarray[19] + ": " + ocurrentuser.Name(g_nloc), "REPORT2");
    // File
    g_ooutfile.OutputLnF(g_sstringarray[20] + ": " + Context.getSelectedFile(), "REPORT2");
    g_ooutfile.OutputLnF(g_sstringarray[21] + ": " + g_sstringarray[24], "REPORT2");
    g_ooutfile.OutputLnF("", "REPORT2");
    g_ooutfile.OutputLnF(g_sstringarray[22] + ": ", "REPORT2");
    for ( i = 0 ; i < omodels.length ; i++ ){
      spath = omodels[i].Group().Path(g_nloc);
      soutputline = ("" + (i + 1) + ".)  " + spath + "\\" + omodels[i].Name(g_nloc) + " (" + omodels[i].Type() + ")");
      g_ooutfile.OutputLnF(soutputline, "REPORT2");
    }
    g_ooutfile.OutputLnF("", "REPORT2");
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
  var ocurrentmodel = new __holder(null);   // Current model of list oModels
  var ncurrenttabofval = new Array();       // List containing the current model's values.
  var i = 0;   var j = 0; 

  for ( i = 0 ; i < omodels.length ; i++ ){
    ocurrentmodel.value = omodels[i];

    g_odoneobjoccs = new Array();
    g_odoneorgobjdefs = new Array();
    g_odonefuncwithorgs = new Array();

    // Determine current model values.
    getmodelval(ocurrentmodel, ncurrenttabofval, nwithassmod);
    // Add current values to general values.
    for ( j = 0 ; j < 10+1 ; j++ ){
      nvaluetable[j] = nvaluetable[j] + ncurrenttabofval[j];
    }
  }
  ocurrentmodel.value = null;
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

  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 700, 210, getString("TEXT16"));
  userdialog.Text(10, 10, 460, 15, getString("TEXT37"));
  userdialog.Text(10, 25, 460, 15, getString("TEXT32"));
  userdialog.CheckBox(10, 50, 580, 15, getString("TEXT38"), "Check");
  userdialog.GroupBox(7, 75, 686, 55, getString("TEXT39"));
  userdialog.OptionGroup("options2");
  userdialog.OptionButton(20, 90, 580, 15, getString("TEXT40"));
  userdialog.OptionButton(20, 105, 580, 15, getString("TEXT41"));
  userdialog.Text(10, 135, 460, 15, getString("TEXT42"));
  userdialog.TextBox(10, 155, 500, 20, "Text0");
  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_84bf7ad0_2f2f_11d9_017b_e10284184242_dlg_02.hlp");  

  var dlg = Dialogs.createUserDialog(userdialog); 
  // Read dialog settings from config
  var sSection = "SCRIPT_84bf7ad0_2f2f_11d9_017b_e10284184242";  
  ReadSettingsDlgValue(dlg, sSection, "options2", 1);
  ReadSettingsDlgValue(dlg, sSection, "Check", 0);
  ReadSettingsDlgText(dlg, sSection, "Text0", getString("TEXT36"));

  nuserdlg = Dialogs.show( __currentDialog = dlg);
  // Showing dialog and waiting for confirmation with OK
  nselectedoption.value = parseInt(dlg.getDlgValue("options2"));
  sname.value = dlg.getDlgText("Text0");
  nwithassmod.value = parseInt(dlg.getDlgValue("Check"));
  if (nuserdlg == 0) {
    bcheckuserdialog.value = false;
  } else {
    bcheckuserdialog.value = true;

    // Write dialog settings to config 
    WriteSettingsDlgValue(dlg, sSection, "options2");
    WriteSettingsDlgValue(dlg, sSection, "Check");
    WriteSettingsDlgText(dlg, sSection, "Text0");
  }
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

  onextfuncnodes.value  = new Array();
  ostorenodes          = new Array();
  odummyobjoccs.value   = new Array();
  odummy2objoccs.value  = new Array();

  var funccontext = new __usertype_tfunccontext(); 
  initfunccontext(funccontext);

  var traverseresults = new Array();    // __usertype_ttraverseresult() 

  g_odoneobjoccs[g_odoneobjoccs.length] = ocurrentfuncobjocc.value;
  
  // Find following functions
  findnextfunc(ocurrentmodel, ocurrentfuncobjocc.value, odummyobjoccs);

  // Found functions, information carriers and connections are checked.
  if (odummyobjoccs.value.length > 0) {
    i = 0;
    bcheckit = false;
    while (i <= (odummyobjoccs.value.length - 1)) {
      bcheck = false;
      ocurrentdummyocc.value = odummyobjoccs.value[i];
      
      bcheck        = checkright(ocurrentmodel, ocurrentdummyocc, nwithassmod);
      bfunccheck    = checkfuncocc(ocurrentdummyocc.value);
      
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

          while (odummy2objoccs.value.length > 0) {
            odummy2objoccs.value = doDelete(odummy2objoccs, odummy2objoccs.value[0]);
          }
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
    var nnumsuccs = ostorenodes.length;
    if (nnumsuccs > 0) {
      traverseresults = new Array();
      for ( i = 0 ; i < nnumsuccs ; i++ ){
        traverseresults[i]= new __usertype_ttraverseresult();
        traverseresults[i].ofuncobjocc = ostorenodes[i];
      }
    }

    var ofuncobjocc = new __holder(null); 

    var nminold = modelcontext.value.norgchangemin;
    var nmaxold = modelcontext.value.norgchangemax;

    var nminpathvalues = new Array();
    var nmaxpathvalues = new Array();
    
    // Recursive call of following elements in case they have not been evaluated.
    for ( i = 0 ; i < ostorenodes.length ; i++ ){
      ofuncobjocc.value = ostorenodes[i];
      bdonefunc = checkdonefunc(ofuncobjocc.value);
      if (bdonefunc == false) {
        modelcontext.value.norgchangemin = 0;
        modelcontext.value.norgchangemax = 0;
      
        succfunccontext = traversemodelgraph(ocurrentmodel, modelcontext, ofuncobjocc, nwithassmod);

        nminpathvalues[i] = modelcontext.value.norgchangemin;
        nmaxpathvalues[i] = modelcontext.value.norgchangemax;
        
        setfuncsucctraverseresult(ofuncobjocc.value, traverseresults, succfunccontext);
      } else {
        // MWZ (28.09.05) TANR 141956
        nminpathvalues[i] = 0;
        nmaxpathvalues[i] = 0;
      }
    }
//    handlefuncsucctraverseresult(ocurrentfuncobjocc.value, modelcontext, funccontext, traverseresults, nnumsuccs);
    var nminadd = 0;
    var nmaxadd = 0;
    
    for(i=0;i<nminpathvalues.length;i++) {
      nminadd += nminpathvalues[i];
      nmaxadd += nmaxpathvalues[i];
    }
    
    modelcontext.value.norgchangemin = nminold + nminadd;
    modelcontext.value.norgchangemax = nmaxold + nmaxadd;
  } 
  
  else {
    handlefuncobject(ocurrentmodel, modelcontext, ocurrentfuncobjocc, funccontext, odummyobjoccs, nwithassmod);
//    handlefuncsucctraverseresult(ocurrentfuncobjocc.value, modelcontext, funccontext, traverseresults, 0);
  }
  
  onextfuncnodes.value      = null;
  odummyobjoccs.value       = null;
  odummy2objoccs.value      = null;
  ocurrentdummyocc.value    = null;

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
  // BLUE-19508 - Ignore non-structural connections when searching next function   
  var objType = ocurrentobjocc.ObjDef().TypeNum();
  if (objType != Constants.OT_FUNC && objType != Constants.OT_EVT && objType != Constants.OT_RULE) return;
    
  var otargetobjoccs = ocurrentmodel.value.GetSuccNodes(ocurrentobjocc); // List of following object occurrences of the current model.

  if (otargetobjoccs.length > 0) {
    for (var i = 0 ; i < otargetobjoccs.length ; i++ ){
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
      } else {
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