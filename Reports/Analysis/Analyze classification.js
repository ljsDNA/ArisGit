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

//===============================OBJECT CLASSIFICATION REPORT===================================

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

var BP_ATTR_TYPE_NUM = Constants.AT_ASSESSMENT_OF_VALUE_ADDED;

var g_ooutfile = null;                  // Output object.
var g_omethodfilter = null;             // MethodFilter

var g_nloc = 0;                         // Language-ID.
var g_ncurattrnum = 0;                  // Number of the selected attribute.
var g_nfunumlist = new Array();         // List containing the number of functions of the individual models.
var stRep = 0;
var rType=0;

var g_env = Context.getEnvironment();   // Determines the script runtime environment {BP,STD}

function main()
{
  var omodels = new __holder(null);   // List of selected models.
  var oObjDefs = new Array();
  var ncheckmsg = 0;                    // Variable for checking the treatment of the message (nCheckMsg = 2 / Cancel was selected).
  var ncheckmsg2 = 0;                   // Variable for checking the treatment of the message (nCheckMsg = 2 / Cancel was selected).
  var nvaluetable = new __holder(new Array());  // Variable for checking the values of the current model.
  var nselectedoption = new __holder(0);        // Variable for a cumulative ( = 0 ) or single (= 1) evaluation of the selected models.



  var sname = new __holder("");         // Variable for the analysis name.
  var sextension = new __holder("");    // Variable for the file extension.

  var boutput = false;                  // Variable for title (True = table / False = text).
  var bmodellok = false;                // Variable for checking whether the model is of the correct type.
  var bcheckuserdialog = new __holder(false);   // Variable for checking whether the user has selected Cancel in the dialog boxes.
  var berror = false; 

  var odummymodels = null;              // List of models for temporary saving.

  // Set
  g_omethodfilter = ArisData.getActiveDatabase().ActiveFilter();

  omodels.value = ArisData.getSelectedModels();
  oObjDefs = ArisData.getSelectedObjDefs();
  g_nloc = Context.getSelectedLanguage();
  sextension.value = "";
  bcheckuserdialog.value = true;
  berror = false;

  bmodellok = true;

//if report is started on object(s)  
  if((omodels.value.length==0)&&(oObjDefs.length>0)){
      var cObjType = oObjDefs[0].TypeNum();
      var error=0;
      rType=1;
      for(var i=0; i< oObjDefs.length;i++){
          if(oObjDefs[i].TypeNum()!=cObjType){
              error = 1;
              break;
          }          
      }

      if(error==0){
        // Selection of output.
        stRep = 1;
        g_ooutfile = Context.createOutputObject();

          if(StrComp(g_env, "BP") != 0) {
              userdlg(bcheckuserdialog, sname, nselectedoption,oObjDefs[0].TypeNum());
          } else {
              bcheckuserdialog.value = true;
              g_ncurattrnum = BP_ATTR_TYPE_NUM;
              nselectedoption.value = 1; 
              sname.value = getString("TEXT36");
          }          

        oObjDefs = ArisData.sort(oObjDefs, g_ncurattrnum, g_nloc);  // Anubis 478242
        var scurrentstringtab = new __holder(new Array()); 
        
        ObjGTable(oObjDefs, nvaluetable, scurrentstringtab);
        
        //OutputOfTable()
        if (ncheckmsg == 7){
          // Selection: No
            boutput = false;
          } else {
            boutput = true;
          }

          if (boutput == false) {
            outreporthead(oObjDefs, sname.value, boutput);
          }

          g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0);
          if (boutput) {
            outreporthead(oObjDefs, sname.value, boutput);
          }

          ObjOutputTable(oObjDefs, nvaluetable.value, sname.value, nselectedoption.value, scurrentstringtab.value);          
          g_ooutfile.EndTable(sname.value, 100, getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

          g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0);
          //outputCharts(omodels.value, nvaluetable.value, sname.value, nselectedoption.value, scurrentstringtab.value);
          
          outputChartsObjs(oObjDefs, nvaluetable, sname, nselectedoption, scurrentstringtab)          
          createObjPathSheet(oObjDefs, sname.value, boutput);
          g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
      }
      
      switch(error){
       case 1: if(StrComp(g_env, "BP") != 0) {
                 Dialogs.MsgBox(getString("TEXT_1"), Constants.MSGBOX_BTN_OK, getString("TEXT2"));
               }
      }
  }

//if report is started on model(s)
  if (omodels.value.length > 0){

    if(StrComp(g_env, "BP") != 0) {
      Dialogs.MsgBox(getString("TEXT_2"), Constants.MSGBOX_BTN_OK ,getString("TEXT_3"))
    }
      
    // Selection of output.
    rType=2;
    if (! (ncheckmsg == 2) && bcheckuserdialog.value){
      omodels.value = ArisData.sort(omodels.value, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);

      if(StrComp(g_env, "BP") != 0) {
        userdlg(bcheckuserdialog, sname, nselectedoption,Constants.OT_FUNC);
      } else {
          bcheckuserdialog.value = true;
          g_ncurattrnum = BP_ATTR_TYPE_NUM;
          nselectedoption.value = 1; 
          sname.value = getString("TEXT36");
      }
      
      if (bcheckuserdialog.value == true){
        var oobjoccs = new __holder(new Array()); 
        var bfound = new __holder(false); 
        bfound.value = false;
        
        getallfuncs(omodels.value, bcheckuserdialog, oobjoccs, bfound);
        
        //Checking models for functions
        if (! (bcheckuserdialog.value) && bfound.value) {
          if(StrComp(g_env, "BP") != 0) {
            ncheckmsg2 = Dialogs.MsgBox(getString("TEXT3"), Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT2"));
          } else {
            ncheckmsg2 = 1;
          }
        } else if (! (bfound.value)){
          if(StrComp(g_env, "BP") != 0) {
            Dialogs.MsgBox(getString("TEXT4"), Constants.MSGBOX_BTN_OK, getString("TEXT2"));
          }
          ncheckmsg2 = 2;
        }//:end checking

        if (! (ncheckmsg2 == (2))){
          g_ooutfile = Context.createOutputObject();            
          
          var tmp = new Array();
          var bAlreadyInList = false;

          // The objects are sorted on the basis of the attribute value.
          for(var i=0;i<oobjoccs.value.length;i++){
            bAlreadyInList = false;
            for(var j=0;j<tmp.length;j++) {
              if(oobjoccs.value[i].ObjDef().IsEqual(tmp[j].ObjDef())) {
                bAlreadyInList = true;
                break;
              }
            }
            if(!bAlreadyInList) {
              tmp[tmp.length] = oobjoccs.value[i];
            }
          }
          oobjoccs.value = tmp;
          
          quicksort(oobjoccs);
          var scurrentstringtab = new __holder(new Array());           // List of value strings.
          if (nselectedoption.value == 0) {
            // Cumulated
            singletable(oobjoccs, nvaluetable, scurrentstringtab);
          }
          else{
            // Every model separately.
            greattable(omodels, oobjoccs, nvaluetable, scurrentstringtab);
          }

          // Title
          if (ncheckmsg == 7){
          // Selection: No
            boutput = false;
          } else {
            boutput = true;
          }

          if (boutput == false) {
            outreporthead(omodels.value, sname.value, boutput);
          }

          g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0);
          if (boutput) {
            outreporthead(omodels.value, sname.value, boutput);
          }

          outputoftable(omodels.value, nvaluetable.value, sname.value, nselectedoption.value, scurrentstringtab.value);          
          g_ooutfile.EndTable(sname.value, 100, getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
          
          g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0);
          outputCharts(omodels.value, nvaluetable.value, sname.value, nselectedoption.value, scurrentstringtab.value);
          g_ooutfile.EndTable(getString("TEXT30"), 100, getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
          
          g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
        }
        else {
          if(StrComp(g_env, "BP") == 0) {
              // For "BP" the output has to be generated always
              if (g_ooutfile == null) {
                  g_ooutfile = Context.createOutputObject();
                  g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0);
                  g_ooutfile.EndTable("", 100, getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
              }
              g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
          }
          berror = true;
        }
      } else {
        berror = true;
      }
    } else {
      berror = true;
    }
  } 
  else if((omodels.value.length==0)&&(oObjDefs.length==0)) {
    if(StrComp(g_env, "BP") != 0) {
      Dialogs.MsgBox(getString("TEXT6"), Constants.MSGBOX_BTN_OK, getString("TEXT2"));
    }
    berror = true;
  }

  if (berror) {
//MJ: ScriptError-Behandlung
//    scripterror = Constants.ERR_CANCEL;
  }
}

function outputChartsObjs(objs, nvaluetable, sname, nselectedoption, scurrentstringtab)
{
  var ncount = 0; 
  var ncut = 0.0; 
  var i = 0, j = 0, sVal = "";
  var chart, chartPicture;
  var sTitle = "", spath = "";
  
        sTitle = getString("TEXT37");
 
      var arrData = new Array();
      var arrLegend = new Array();
      
      for (j=0; j<scurrentstringtab.value.length; j++) {
          ncut = round2(nvaluetable.value[i*2+1][j]);
          arrData.push(ncut);
          sVal = scurrentstringtab.value[j];
          if (sVal == "")
              sVal = getString("TEXT_4");
          else
              sVal = WrapString(sVal, 10);  
          arrLegend.push(sVal);
      }
      
      chart = createBarChart(sTitle, arrData, arrLegend);
      chartPicture = chart.getPicture();
      
      g_ooutfile.TableRow();
      g_ooutfile.TableCell("", 5, getString("TEXT5"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, 
      Constants.FMT_CENTER | Constants.FMT_VTOP | Constants.FMT_NOLINEBREAK, 0);
      g_ooutfile.OutGraphic(chartPicture, 100, 200, 200);
      g_ooutfile.TableRow();
      g_ooutfile.EndTable(getString("TEXT30"), 100, getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}

// secherka
function outputCharts(omodels, nvaluetable, sname, nselectedoption, scurrentstringtab)
{
  var ncount = 0; 
  var ncut = 0.0; 
  var i = 0, j = 0, sVal = "";
  var chart, chartPicture;
  var sTitle = "", spath = "";
  
  if (nselectedoption == 0) {
    // Cumulated
    ncount = 0;    
  }
  else {
    // Models individual
    ncount = omodels.length-1;
  }
  
  for (i=0; i<ncount+1; i++) {
      if (nselectedoption == 0) {
        // Cumulated
        sTitle = getString("TEXT_5");
      } else {
        // Models individual
        spath = omodels[i].Group().Path(g_nloc)+"\\";
        sTitle = (i+1) + ".) " + spath + omodels[i].Name(g_nloc) + " (" + omodels[i].Type() + ")";
        sTitle = WrapString(sTitle, 50);        
      }      
      var arrData = new Array();
      var arrLegend = new Array();
      
      for (j=0; j<scurrentstringtab.length; j++) {
          ncut = round2(nvaluetable[i*2+1][j]);
          arrData.push(ncut);
          sVal = scurrentstringtab[j];
          if (sVal == "")
              sVal = getString("TEXT_4");
          else
              sVal = WrapString(sVal, 10);  
          arrLegend.push(sVal);
      }
      
      chart = createBarChart(sTitle, arrData, arrLegend);
      chartPicture = chart.getPicture();
      
      g_ooutfile.TableRow();
      g_ooutfile.TableCell("", 5, getString("TEXT5"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, 
      Constants.FMT_CENTER | Constants.FMT_VTOP | Constants.FMT_NOLINEBREAK, 0);
      g_ooutfile.OutGraphic(chartPicture, 100, 100, 200);
      g_ooutfile.TableRow();
  }
  
}

function WrapString(str, nMaxLen) {
  var i;
  var sArr = ("" + str).split(" ");      // Anubis 281155
  var sRes = "";
  var sLine = "";
  for (i=0; i<sArr.length; i++) {
    if (i<sArr.length-1) 
        sLine += sArr[i]+" ";
    else
        sLine += sArr[i];
    if ((sLine.length>nMaxLen) && (i!=sArr.length-1)) {
      sRes += sLine+"\r\n";
      sLine = "";
    }
  }
  return sRes+sLine;
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

    var legend = chart.setLegend();
    legend.setFont(getString("TEXT5"));
    chart.setMultiData(arrData, p_arrLegend);
    //chart.setDataLabels(true);
    chart.set3D(10);
    chart.setTitle(p_sTitle);
    chart.setTitleFont(getString("TEXT5"), 10, new java.awt.Color(0, 0, 0), Constants.FMT_BOLD);
    chart.getYAxis().setTitle("%");

    return chart;
}

// ------------------------------------------------------------------------
// Subroutine CheckAttr
// Subprogram for creating the table.
// Parameter
// oObjOccs = Current list of object occurrences.
// nStart = Starting position.
// nCount Number of functions having the same value string.
// sAttrStr Attribute value as string.
// ------------------------------------------------------------------------
function checkattr(oobjoccs, nstart, ncount, sattrstr)
{
  var ncheck = 0, j = 0;

  var bcheck = true; 

  ncount.value = 1;
  sattrstr.value = oobjoccs.value[nstart.value].ObjDef().Attribute(g_ncurattrnum, g_nloc).GetValue(true);
  j = (nstart.value + 1);
  while (bcheck && j < oobjoccs.value.length) {
    ncheck = StrCompIgnoreCase(sattrstr.value, oobjoccs.value[j].ObjDef().Attribute(g_ncurattrnum, g_nloc).GetValue(true));
    if (ncheck == 0) {
      ncount.value++;
      j++;
    } else {
      bcheck = false;
    }
  }
  nstart.value = j;
}


// ----------------------------------------------------------------------------
// Subroutine GetAllFuncs
// Subprogram for inserting all function occurrences into a list when evaluating cumulatively.
// Parameter
// oModels = List of the selected models.
// bCheckUserDialog = False if a model has no functions.
// oObjOccs = List of function occurrences.
// bFound = true if one function occurrence is in the selected models
// ----------------------------------------------------------------------------
function getallfuncs(omodels, bcheckuserdialog, oobjoccs, bfound)
{
  var ofuncobjoccs = null; 
  var odummyobjocclist = null; 
  var i = 0, j = 0; 
  i = 0;
  odummyobjocclist = new Array();
  while (i <= (omodels.length - 1)) {
    ofuncobjoccs = omodels[i].ObjOccListFilter(Constants.OT_FUNC);
    if (ofuncobjoccs.length > 0) {
      for (var j = 0; j < ofuncobjoccs.length; j++) {
        odummyobjocclist[odummyobjocclist.length] = ofuncobjoccs[j];
      }
      i++;
    } else {
      omodels.splice(i, 1);
      bcheckuserdialog.value = false;
    }
  }

  if (odummyobjocclist.length) {
    oobjoccs.value = new Array(); 
    for (var i = 0; i < odummyobjocclist.length; i++) {
      oobjoccs.value[i] = odummyobjocclist[i];
    }
    bfound.value = true;
  }

}

//Getting value of objects attributes
function getObjAttrList(obj, scurrentstringtab)
{
  var scheckstring = ""; 
  var ncheck = 0;   // Variable for comparison.
  var j = 0, j = 0;

  scurrentstringtab.value = new Array(); 
  scurrentstringtab.value[0] = obj[0].Attribute(g_ncurattrnum, g_nloc).GetValue(true);
  scheckstring = scurrentstringtab.value[0];
  ncheck = 0;

  j = 1;
  for (var i = 0; i < obj.length; i++) {
    ncheck = StrCompIgnoreCase(obj[i].Attribute(g_ncurattrnum, g_nloc).GetValue(true), scheckstring);
    if (ncheck != 0) {
      scurrentstringtab.value[j] = obj[i].Attribute(g_ncurattrnum, g_nloc).GetValue(true);
      scheckstring = scurrentstringtab.value[j];
      j++;
    }
  }
}

//Building charts
function ObjGTable(obj, ncurrenttabofval, scurrentstringtab)
{
  var i = 0; j = 0; h = 0;

  getObjAttrList(obj, scurrentstringtab);

  ncurrenttabofval.value = new Array();
  for (var k = 0; k < (2 * obj.length); k++) {
      ncurrenttabofval.value[k] = new Array();
      for (var m = 0; m < scurrentstringtab.value.length; m++) {
          ncurrenttabofval.value[k][m] = 0.0;
      }
  }
  
  var ncheck = 0;   // Variable for comparison.

  for (var h = 0; h < obj.length; h++) {
    for (var j = 0; j < scurrentstringtab.value.length ; j++) {
      ncurrenttabofval.value[(h * 2)][j]  = 0.0;
      ncurrenttabofval.value[(h * 2)+1][j]  = 0.0;
    }
  }
  for (var j = 0; j < scurrentstringtab.value.length; j++) {
    for (var i = 0; i < obj.length; i++) {
      ncheck = StrCompIgnoreCase(scurrentstringtab.value[j], obj[i].Attribute(g_ncurattrnum, g_nloc).GetValue(true));
      if (ncheck == 0) {
        for (var h = 0; h < obj.length; h++) {
            ncurrenttabofval.value[(h * 2)][j] = ncurrenttabofval.value[(h * 2)][j] + 1;
            ncurrenttabofval.value[(h * 2) + 1][j] = (100 * ncurrenttabofval.value[(h * 2)][j]) / obj.length;
        }
      }
    }
  }
}

// ----------------------------------------------------------------------------
// Subroutine GetAttrStrList
// Subprogram for determining the value string list.
// Parameter
// oObjOccs = Current list of object occurrences.
// sCurrentStringTab = List of value strings.
// ------------------------------------------------------------------------
function getattrstrlist(oobjoccs, scurrentstringtab)
{
  var scheckstring = ""; 
  var ncheck = 0;   // Variable for comparison.
  var j = 0, j = 0;

  scurrentstringtab.value = new Array();; 
  scurrentstringtab.value[0] = oobjoccs.value[0].ObjDef().Attribute(g_ncurattrnum, g_nloc).GetValue(true);
  scheckstring = scurrentstringtab.value[0];
  ncheck = 0;

  j = 1;
  for (var i = 0; i < oobjoccs.value.length; i++) {
    ncheck = StrCompIgnoreCase(oobjoccs.value[i].ObjDef().Attribute(g_ncurattrnum, g_nloc).GetValue(true), scheckstring);
    if (ncheck != 0) {
      scurrentstringtab.value[j] = oobjoccs.value[i].ObjDef().Attribute(g_ncurattrnum, g_nloc).GetValue(true);
      scheckstring = scurrentstringtab.value[j];
      j++;
    }
  }
}

// ----------------------------------------------------------------------------
// Subroutine GetFuNumList
// Subprogram for determining the number of functions in the models.
// Parameter
// oModels = akt. List of models.
// ------------------------------------------------------------------------
function getfunumlist(omodels)
{
  var i = undefined;

  var ndummylist = new Array(); 
  var lstObjDefs = null; 
  ndummylist = new Array(); 
  for (var i = 0; i < omodels.value.length; i++) {
    lstObjDefs = omodels.value[i].ObjDefListFilter(Constants.OT_FUNC);
    ndummylist[i] = lstObjDefs.length;
    ofuoccs = null;
  }

  g_nfunumlist = ndummylist;
}

// ----------------------------------------------------------------------------
// Subroutine GreatTable
// Subprogram for the individual evaluation of the selected models.
// Parameter
// oModels = akt. List of models.
// oObjOccs = Current list of object occurrences.
// nCurrentTabOfVal = List containing the values.
// sCurrentStringTab = List of value strings.
// ------------------------------------------------------------------------
function greattable(omodels, oobjoccs, ncurrenttabofval, scurrentstringtab)
{
  var i = 0; j = 0; h = 0;

  getattrstrlist(oobjoccs, scurrentstringtab);
  getfunumlist(omodels);

  ncurrenttabofval.value = new Array();
  for (var k = 0; k < (2 * omodels.value.length); k++) {
      ncurrenttabofval.value[k] = new Array();
      for (var m = 0; m < scurrentstringtab.value.length; m++) {
          ncurrenttabofval.value[k][m] = 0.0;
      }
  }

  var ncheck = 0;   // Variable for comparison.
  ncheck = 0;
  for (var h = 0; h < omodels.value.length; h++) {
    for (var j = 0; j < scurrentstringtab.value.length; j++) {
      ncurrenttabofval.value[(h * 2)][j]  = 0.0;
      ncurrenttabofval.value[(h * 2)+1][j]  = 0.0;
    }
  }
  for (var j = 0; j < scurrentstringtab.value.length; j++) {
    for (var i = 0; i < oobjoccs.value.length; i++) {
      ncheck = StrCompIgnoreCase(scurrentstringtab.value[j], oobjoccs.value[i].ObjDef().Attribute(g_ncurattrnum, g_nloc).GetValue(true));
      if (ncheck == 0) {
        for (var h = 0; h < omodels.value.length; h++) {
          if (omodels.value[h].IsEqual(oobjoccs.value[i].Model())) {
            ncurrenttabofval.value[(h * 2)][j] = ncurrenttabofval.value[(h * 2)][j] + 1;
            ncurrenttabofval.value[(h * 2) + 1][j] = (100 * ncurrenttabofval.value[(h * 2)][j]) / g_nfunumlist[h];
          }
        }
      }
    }
  }
}

function ObjOutputTable(obj, nvaluetable, sname, nselectedoption, scurrentstringtab)
{
  var nindexofarray = 0; 
  var ncount = 0; 
  var ncut = 0.0; 
  var i = 0; j = 0; sout = "";
  var strFormat;

  g_ooutfile.DefineF("Standard", getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);

  ncount = obj.length-1;
  g_ooutfile.TableRow();
  g_ooutfile.TableCellF((getString("TEXT38") + " " + g_omethodfilter.AttrTypeName(g_ncurattrnum)), 50, "REPORT5_green");
  
  strFormat = "REPORT5_pink";
  
      g_ooutfile.TableCellF(getString("TEXT39"), 20, strFormat);
      g_ooutfile.TableCellF(" ", 20, strFormat);

  // Number and percentage.
  g_ooutfile.TableRow();
  g_ooutfile.TableCellF(" ", 50, "REPORT5_green");
  var col_count = 1;
  var j=ncount;
   strFormat = "REPORT5_pink"
    g_ooutfile.TableCellF(getString("TEXT15"), 20, strFormat);
    g_ooutfile.TableCellF(getString("TEXT16"), 20, strFormat);

  // Number of functions contained in the models.
  g_ooutfile.TableRow();
  g_ooutfile.TableCellF(getString("TEXT_6"), 50, "REPORT5_green");
  strFormat = "REPORT4_pink";

    g_ooutfile.TableCellF(obj.length, 20, strFormat);
    sout = 100;
    g_ooutfile.TableCellF(sout, 20, strFormat);

  // Value
  for (var i = 0; i < scurrentstringtab.length; i++) {
    g_ooutfile.TableRow();
    if (scurrentstringtab[i] == "") {
      g_ooutfile.TableCellF(getString("TEXT18"), 50, "REPORT5_green");
    } else {
      g_ooutfile.TableCellF(scurrentstringtab[i], 50, "REPORT5_green");
    }
      g_ooutfile.TableCellF(nvaluetable[j*2][i], 20, strFormat);
      ncut = round2(nvaluetable[(j*2 + 1)][i]);
      g_ooutfile.TableCellF(ncut, 20, strFormat);
  }
}


// ----------------------------------------------------------------------------
// Subroutine OutputOfTable
// Subprogram for evaluating the selected models.
// Parameter
// oModels = List of the selected models.
// nValueTable() = List of the models' values.
// sName = Variable for the analysis name.
// nSelectedOption  = Variable for checking whether the selected models should be evaluated cumulatively ( = 0 ) or individually (= 1).
// sCurrentStringTab() = List of value strings.
// ----------------------------------------------------------------------------
function outputoftable(omodels, nvaluetable, sname, nselectedoption, scurrentstringtab)
{
  var nindexofarray = 0; 
  var ncount = 0; 
  var ncut = 0.0; 
  var i = 0; j = 0; sout = "";
  var strFormat;

  g_ooutfile.DefineF("Standard", getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
  if (nselectedoption == 0) {
  // Cumulated
    ncount = 0;
  } else {
    ncount = omodels.length - 1;
  }

  g_ooutfile.TableRow();
  g_ooutfile.TableCellF((getString("TEXT12") +" "+ g_omethodfilter.AttrTypeName(g_ncurattrnum)), 50, "REPORT5_green");
  if (nselectedoption == 0) {
    // Cumulated
    g_ooutfile.TableCellF(getString("TEXT13"), 20, "REPORT5_pink");
    g_ooutfile.TableCellF(getString("TEXT13"), 20, "REPORT5_pink");
  } else {
    // Models individual
    for (var j = 0; j < omodels.length; j++) {
      if (j%2 == 0) {
          strFormat = "REPORT5_pink";
      } else {
          strFormat = "REPORT5_blue";
      }
      g_ooutfile.TableCellF("" + (j + 1) + getString("TEXT14"), 20, strFormat);
      g_ooutfile.TableCellF(" ", 20, strFormat);
    }
  }

  // Number and percentage.
  g_ooutfile.TableRow();
  g_ooutfile.TableCellF(" ", 50, "REPORT5_green");
  var col_count = 0;
  if (nselectedoption == 0) {
    // Cumulated
    col_count = 1;
  } else {
    // Models individual
    col_count = omodels.length;
  }
  for ( j = 0 ; j < col_count; j++ ){
    if (j%2 == 0) {
      strFormat = "REPORT5_pink"
    } else {
      strFormat = "REPORT5_blue"
    }
    g_ooutfile.TableCellF(getString("TEXT15"), 20, strFormat);
    g_ooutfile.TableCellF(getString("TEXT16"), 20, strFormat);
  }

  // Number of functions contained in the models.
  g_ooutfile.TableRow();
  g_ooutfile.TableCellF(getString("TEXT17"), 50, "REPORT5_green");
  for ( j = 0 ; j < ncount+1 ; j++ ){
    if (j%2 == 0) {
      strFormat = "REPORT4_pink";
    } else {
      strFormat = "REPORT4_blue";
    }
    g_ooutfile.TableCellF(g_nfunumlist[j], 20, strFormat);
    sout = 100;
    g_ooutfile.TableCellF(sout, 20, strFormat);
  }

  // Value
  for (var i = 0; i < scurrentstringtab.length; i++) {
    g_ooutfile.TableRow();
    if (scurrentstringtab[i] == "") {
      g_ooutfile.TableCellF(getString("TEXT18"), 50, "REPORT5_green");
    } else {
      g_ooutfile.TableCellF(scurrentstringtab[i], 50, "REPORT5_green");
    }

    for ( j = 0 ; j < ncount+1 ; j++ ){
      if (j%2 == 0) {
        strFormat = "REPORT4_pink"
      } else {
        strFormat = "REPORT4_blue"
      }        
      g_ooutfile.TableCellF(nvaluetable[j*2][i], 20, strFormat);
      ncut = round2(nvaluetable[(j*2 + 1)][i]);
      g_ooutfile.TableCellF(ncut, 20, strFormat);
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
  var i = 0;

  var ocurrentuser = null; 
  var spath = "";   // Path of the current model.
  var soutputline = ""; 
  ocurrentuser = ArisData.getActiveUser();
  g_ooutfile.DefineF("REPORT1", getString("TEXT5"), 24, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT2", getString("TEXT5"), 14, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT3", getString("TEXT5"), 8, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT4", getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT4_gray", getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT4_pink", getString("TEXT5"), 12, Constants.C_BLACK, 0xFFCC99, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT4_blue", getString("TEXT5"), 12, Constants.C_BLACK, 0xCCFFFF, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT5", getString("TEXT5"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_BOLD | Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT5_green", getString("TEXT5"), 12, Constants.C_BLACK, 0xCCFFCC, Constants.FMT_BOLD | Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT5_gray", getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_BOLD | Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT5_pink", getString("TEXT5"), 12, Constants.C_BLACK, 0xFFCC99, Constants.FMT_BOLD | Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  g_ooutfile.DefineF("REPORT5_blue", getString("TEXT5"), 12, Constants.C_BLACK, 0xCCFFFF, Constants.FMT_BOLD | Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

    g_ooutfile.TableRow();
    g_ooutfile.TableCellF((getString("TEXT19") + sname), 20, "REPORT5_gray");
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF("", 20, "REPORT4_gray");
    g_ooutfile.Output(getString("TEXT20"), getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT, 0);
    g_ooutfile.OutputField(Constants.FIELD_DATE, getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT);
    g_ooutfile.Output(" ", getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT, 0);
    g_ooutfile.OutputField(Constants.FIELD_TIME, getString("TEXT5"), 12, Constants.C_BLACK, 0xC0C0C0, Constants.FMT_LEFT);
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF((getString("TEXT21") + ArisData.getActiveDatabase().ServerName()), 20, "REPORT4_gray");
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF((getString("TEXT22") + ArisData.getActiveDatabase().Name(g_nloc)), 20, "REPORT4_gray");
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF((getString("TEXT23") + ocurrentuser.Name(g_nloc)), 20, "REPORT4_gray");
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF((getString("TEXT24") + Context.getSelectedFile()), 20, "REPORT4_gray");
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF(getString("TEXT25"), 20, "REPORT4_gray");
    g_ooutfile.TableRow();
    g_ooutfile.TableRow();
    if(rType==2){
    g_ooutfile.TableCellF(getString("TEXT26"), 20, "REPORT5");
    }
    var strFormat;
    if(rType == 2){
    for ( i = 0 ; i < omodels.length ; i++ ){
      g_ooutfile.TableRow();
      spath = omodels[i].Group().Path(g_nloc);
      if (i%2 == 0) {
        strFormat = "REPORT4_pink";
      } else {
        strFormat = "REPORT4_blue";
      }
      g_ooutfile.TableCellF("" + (i + 1) + ".) " + spath + "\\" + omodels[i].Name(g_nloc) + " (" + omodels[i].Type() + ")", 20, strFormat);
      
    }
    g_ooutfile.TableRow();
    }
}

function createObjPathSheet(omodels, sname, boutcheck){
if(rType==1){
    g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);    for ( i = 0 ; i < omodels.length ; i++ ){
      g_ooutfile.TableRow();
      spath = omodels[i].Group().Path(g_nloc);
      if (i%2 == 0) {
        strFormat = "REPORT4_pink";
      } else {
        strFormat = "REPORT4_blue";
      }
      g_ooutfile.TableCellF("" + (i + 1) + ".) " +omodels[i].Name(g_nloc)+"\nPath: " + spath + "\\", 100, strFormat);
    }
    g_ooutfile.EndTable(omodels[0].Type(), 100, getString("TEXT5"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }
}

// ------------------------------------------------------------------
// Subroutine 
// Subprogram for sorting the tables in alphabetical order.
// Parameter
// sTable() = List of object occurrences.
// ------------------------------------------------------------------
function quicksort(ofirsttable)
{
  tablesort(ofirsttable, new __holder(0), new __holder(ofirsttable.value.length-1));
}



// ------------------------------------------------------------------
// Subroutine TableSort
// Subprogram for sorting the tables in alphabetical order.
// Parameter
// oFirstTable() = List of the object occurrences.
// nStart = Starting index of the field that is to be checked.
// nEnd = End index of the field that is to be checked.
// ------------------------------------------------------------------
function tablesort(ofirsttable, nstart, nend)
{
  var odummy = null;   // Variable in which  the object to be exchanged will be temporarily stored.

  var scenter = "";   // Intermediate element that is to be checked.
  var ncountleft = new __holder(0);   // Left margin.
  var ncountright = new __holder(0);   // Right margin.
  var ncentercount = 0;   // Center of field.
  var ncheck = 0;   // Variable for checking the size.

  ncentercount = parseInt( (nstart.value + nend.value) / 2);
  scenter = ofirsttable.value[ncentercount].ObjDef().Attribute(g_ncurattrnum, g_nloc).GetValue(true);
  ncountleft.value = nstart.value;
  ncountright.value = nend.value;
  ncheck = 0;


  do {
    ncheck = StrCompIgnoreCase(ofirsttable.value[ncountleft.value].ObjDef().Attribute(g_ncurattrnum, g_nloc).GetValue(true), scenter);
    while (ncheck == - 1) {
      ncountleft.value = ncountleft.value + 1;
      ncheck = StrCompIgnoreCase(ofirsttable.value[ncountleft.value].ObjDef().Attribute(g_ncurattrnum, g_nloc).GetValue(true), scenter);
    }

    ncheck = 0;
    ncheck = StrCompIgnoreCase(ofirsttable.value[ncountright.value].ObjDef().Attribute(g_ncurattrnum, g_nloc).GetValue(true), scenter);
    while (ncheck == 1) {
      ncountright.value = ncountright.value - 1;
      ncheck = StrCompIgnoreCase(ofirsttable.value[ncountright.value].ObjDef().Attribute(g_ncurattrnum, g_nloc).GetValue(true), scenter);
    }

    if (ncountleft.value <= ncountright.value) {
      odummy = ofirsttable.value[ncountleft.value];
      ofirsttable.value[ncountleft.value] = ofirsttable.value[ncountright.value];
      ofirsttable.value[ncountright.value] = odummy;
      ncountleft.value = ncountleft.value + 1;
      ncountright.value = ncountright.value - 1;
    }
  }
  while (!(ncountleft.value > ncountright.value));

  if (nstart.value < ncountright.value) {
    tablesort(ofirsttable, nstart, ncountright);
  }

  if (ncountleft.value < nend.value) {
    tablesort(ofirsttable, ncountleft, nend);
  }
}


// ------------------------------------------------------------------------
// Subroutine SingleTable
// Subprogram which creates the cumulated table.
// Parameter
// oObjOccs = Current list of object occurrences.
// nCurrentTabOfVal = List containing the values.
// sCurrentStringTab = List of value strings.
// ------------------------------------------------------------------------
function singletable(oobjoccs, ncurrenttabofval, scurrentstringtab)
{
  var nnumoffu = 0;
  var j = 0;
 
  ncurrenttabofval.value = [new Array(), new Array(), new Array()];
  scurrentstringtab.value = new Array(); 
  // Number of functions altogether.
  nnumoffu = oobjoccs.value.length;
  g_nfunumlist = new Array(); 
  g_nfunumlist[0] = nnumoffu;
  var nstart = new __holder(0); 
  var sattrstr = new __holder(""); 
  var ncount = new __holder(0); 
  nstart.value = 0;
  j = 0;
  while (nstart.value < nnumoffu) {
    checkattr(oobjoccs, nstart, ncount, sattrstr);

    ncurrenttabofval.value[0][j] = ncount.value;
    ncurrenttabofval.value[1][j] = (100 * ncount.value) / nnumoffu;
    scurrentstringtab.value[j] = sattrstr.value;
    j++;
  }
}


// ----------------------------------------------------------------------------
// Subroutine UserDlg
// This subprogram is needed to get information from the user to obtain the necessary settings for the analysis.
// Parameter
// bCheckUserDialog = Variable for checking whether the user has chosen Cancel in the dialog boxes.
// sName = Variable for the analysis name.
// nSelectedOption  = Variable for checking whether the selected models should be evaluated cumulatively ( = 0 ) or individually (= 1).
// ----------------------------------------------------------------------------
function userdlg(bcheckuserdialog, sname, nselectedoption,oOtype)
{
  var nuserdlg = 0;             // Variable for the user dialog box
  var sattrstr = new Array();   // List of strings of selectable attributes.
  
  var lstAttrTypes = [].concat(g_omethodfilter.AttrTypes(Constants.CID_OBJDEF, oOtype));
  lstAttrTypes.sort(sortAttrTypes);
  
  for (i=0; i<lstAttrTypes.length; i++) {
      sattrstr[i] = g_omethodfilter.AttrTypeName(lstAttrTypes[i]);  // Bemerkung/Beispiel
  }
  
  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 550, 300, getString("TEXT2"));
  userdialog.Text(10, 10, 530, 36, getString("TEXT29"));
  userdialog.GroupBox(7, 50, 536, 95, getString("TEXT31"));
  userdialog.ListBox(14, 65, 522, 70, sattrstr, "list", 0, getString("TEXT31"));
  userdialog.GroupBox(7, 155, 536, 55, getString("TEXT32"));
  userdialog.OptionGroup("options1");
  userdialog.OptionButton(20, 170, 500, 15, getString("TEXT33"),"dicCom");
  userdialog.OptionButton(20, 185, 500, 15, getString("TEXT34"),"dicEach");
  userdialog.Text(10, 225, 460, 15, getString("TEXT35"));
  userdialog.TextBox(10, 245, 530, 20, "Text0", 0, getString("TEXT35"));
  userdialog.OKButton();
  userdialog.CancelButton();
  userdialog.HelpButton("HID_c8746560_2f2f_11d9_017b_e10284184242_dlg_01.hlp");

  var dlg = Dialogs.createUserDialog(userdialog); 
  var sSection = "SCRIPT_c8746560_2f2f_11d9_017b_e10284184242";  
  ReadSettingsDlgValue(dlg, sSection, "options1", 1);
  ReadSettingsDlgValue(dlg, sSection, "list", 0);
  ReadSettingsDlgText(dlg, sSection, "Text0", getString("TEXT36"));
  
   if(stRep == 1){
      dlg.setDlgEnable("dicCom",false);
      dlg.setDlgEnable("dicEach",false);      
   }

  nuserdlg = Dialogs.show( __currentDialog = dlg);
  // Showing dialog and waiting for confirmation with OK
  choisedAttrNum = dlg.getDlgValue("list")
  if (choisedAttrNum>=0) {
    g_ncurattrnum = lstAttrTypes[choisedAttrNum];
  }
  nselectedoption.value = dlg.getDlgValue("options1");
  sname.value = dlg.getDlgText("Text0");
  if (nuserdlg == 0) {
    bcheckuserdialog.value = false;
  } else {
    bcheckuserdialog.value = true;
    
    // Write dialog settings to config 
    WriteSettingsDlgValue(dlg, sSection, "options1");
    WriteSettingsDlgValue(dlg, sSection, "list");
    WriteSettingsDlgText(dlg, sSection, "Text0");
  }
}

function sortAttrTypes(a, b) {
    return StrComp(g_omethodfilter.AttrTypeName(a), (g_omethodfilter.AttrTypeName(b)));
}

function StrCompIgnoreCase(Str1, Str2) {
    var tmp_Str1 = new java.lang.String(Str1);
    var res = tmp_Str1.compareToIgnoreCase(new java.lang.String(Str2));
    return (res < 0) ? -1 : ((res > 0) ? 1 : 0);
}

main();



