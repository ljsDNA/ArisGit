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


// text constants
// dialog text constants
var txtOutputOptionsDialogTitle = getString("TEXT1");
var txtOutputFormat         = getString("TEXT2");
var txtOFModelHier          = getString("TEXT3");
var txtOFModelHierISO       = getString("TEXT4");
var txtSupplement           = getString("TEXT5");

var txtSortOrder            = getString("TEXT6");
var txtSortSymbolTypes      = getString("TEXT7");
var txtSortAlpha            = getString("TEXT8");
var txtSortTopologically    = getString("TEXT9");
var txtSortNumerically      = getString("TEXT10");
var txtLinkLevels           = getString("TEXT11");

var txtModelTypes           = getString("TEXT12");
var txtMTeEPC               = getString("TEXT13");
var txtGraphic              = getString("TEXT19");
var txtFormatGraphic        = getString("TEXT20");

// output text constants
var txtStartPath            = getString("TEXT21");
var txtAssignedModels       = getString("TEXT22");
var txtFunction             = getString("TEXT23");
var txtChapter              = getString("TEXT24");

var txtTopLevel             = getString("TEXT25");
var txtLevel                = getString("TEXT26");
var txtAssignmentOf         = getString("TEXT27");
var txtNull                 = getString("TEXT28");
var txtGroup                = getString("TEXT29");
var txtPicture              = getString("TEXT30");
var txtNormElements         = getString("TEXT31");
var txtNorm                 = getString("TEXT32");
var txtNotNamed             = getString("TEXT33");
var txtRelations            = getString("TEXT34");
var txtInput                = getString("TEXT35");
var txtOutput               = getString("TEXT36");
var txtOrgResp              = getString("TEXT37");
var txtApplSysSupp          = getString("TEXT38");
var txtFrom                 = getString("TEXT39");
var txtLeadsTo              = getString("TEXT40");

var txtFurtherFunctionsWithSameAssignment = getString("TEXT41");

var txtInputObjects         = getString("TEXT42");
var txtOutputObjects        = getString("TEXT43");
var txtOrgElements          = getString("TEXT44");
var txtApplSystems          = getString("TEXT38");

// message box text constants
var txtPleaseNumber         = getString("TEXT45");
var txtNumberToSmall        = getString("TEXT46");
var txtNoModelsSelected     = getString("TEXT47");


var bremote = false; 

// Global variables.
var g_bmodtypedlg = false; 
var g_npicnum = 0;                          // Numbering model graphic.
var g_nselectedoption = 0;                  // Selected sort criterion.
var g_nprozfunclevel = 0;                   // Counter of functions in the active model.
var g_ooutfile = new __holder(null);        // Output object.
var g_oworkingarray = null;                 // List containing the models of the level to be processed right now.
var g_odonemodels = null;                   // List of models that have already been evaluated.
var g_odonefuncdefs = new __holder(null);   // List of functions that have already been evaluated.
var g_odonemodfuncoccs = new __holder(null);    // List of function occurrences that have already been topologically evaluated in the model.
var g_oepkfuncobjects = null;               // List of functions which are being processed in case of topological processing of the eEPC..
var g_oinputobjdefs = null;                 // Input objects of the model.
var g_ooutputobjdefs = null;                // Output objects of the model.
var g_oorgobjdefs = null;                   // Organizational objects of the model.
var g_oapplobjdefs = null;                  // Application system objects of the model.
var g_ssourcearray = new Array();           // List telling you by the help of which function the assigned model was found.
var g_sdonefuncident = new Array();         // ID of the evaluated function.
var g_sdfuoccid = new Array();              // ID evaluated function.
var g_sdonemodident = new Array();          // ID of the evaluated models.
var g_ssortstrings = new Array();           // List of strings to be exchanged are put in subroutine SortPosition.
var g_ssourceruleoffunc = new Array();      // List containing the predecessor functions of the function in the list g_oEpkFuncObjects.
var g_sselecttion = "";                     // Variable containing the type of the model to be evaluated when evaluating topologically.
var g_sdonefuncid = "";                     // Contains the string in case of topological evaluation.
var g_nloc = 0;                             // ID of the language.
var g_bstartlable = false; 
var g_bmodelidententry = false;             // Indicator flag for the entering in the list g_sDoneModIdent.
var g_bsamefunction = false;                // Indicator flag if the function is already evaluated.
var g_bdonefunc = false;                    // True, if the function has already been evaluated when evaluating topologically.
var g_bGraphic;                             // Variable whether the model graphic should be output.
var g_ocurarray = new Array();

var g_nDefaultLinkLevels = 3;               // default link levels

var g_nmodeltypes = new Array();
addModelTypeToList(Constants.MT_VAL_ADD_CHN_DGM);
addModelTypeToList(Constants.MT_EEPC);
addModelTypeToList(Constants.MT_EEPC_MAT);
addModelTypeToList(Constants.MT_EEPC_COLUMN);
addModelTypeToList(Constants.MT_EEPC_TAB_HORIZONTAL);
addModelTypeToList(Constants.MT_EEPC_TAB);
addModelTypeToList(Constants.MT_EEPC_ROW);
addModelTypeToList(Constants.MT_BPMN_COLLABORATION_DIAGRAM)
addModelTypeToList(Constants.MT_BPMN_PROCESS_DIAGRAM);
addModelTypeToList(Constants.MT_ENTERPRISE_BPMN_COLLABORATION);
addModelTypeToList(Constants.MT_ENTERPRISE_BPMN_PROCESS);
addModelTypeToList(Constants.MT_PROCESS_SCHEDULE);
addModelTypeToList(Constants.MT_SIPOC);
addModelTypeToList(Constants.MT_FUNC_ALLOC_DGM);
addModelTypeToList(Constants.MT_FUNC_TREE);

var g_nSelectedModelTypes;
var g_nOptOutput;
var g_bappendix;

// Dialog support depends on script runtime environment (STD resp. BP, TC)
var g_bDialogsSupported = isDialogSupported();

function addModelTypeToList(nModelType) {
    // BLUE-4733
    if (ArisData.ActiveFilter().IsValidModelType(nModelType)) {
        g_nmodeltypes.push(nModelType);
    }
}

function main()
{
  var sextension = "";   // File ending
  var bchangeext = false;   // Variable for checking whether the file ending was changed.
  var ndummy = 0; 
  var ndepth = new __holder(0);   // Depth of the model level to be evaluated.
  var ntypecounter = 0; 
  var ncheckmsg = 0; 
  var bokmodel = false; 
  var bgeneralmodelok = false; 
  var bnotrightmodel = false; 
  var npos = 0; 
  var nuserdlg = 0;   // Variable for the user dialog box

  // Default settings
  g_bmodelidententry = false;

  var binput = false;
  bokmodel = false;
  bnotrightmodel = false;
  bgeneralmodelok = false;
  g_bstartlable = true;

  g_nloc = Context.getSelectedLanguage();
  g_ooutfile.value = Context.createOutputObject(Context.getSelectedFormat(), Context.getSelectedFile());
  g_ooutfile.value.DefineF("REPORT1", getString("TEXT48"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 0);
  g_ooutfile.value.DefineF("REPORT2", getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 0);
  g_ooutfile.value.DefineF("REPORT3", getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 0);
  g_ooutfile.value.DefineF("REPORT4", getString("TEXT48"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 0);
  g_ooutfile.value.DefineF("REPORT5", getString("TEXT48"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 0);
  g_ooutfile.value.DefineF("REPORT6", getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_ITALIC, 0, 0, 0, 0, 0, 0);
  g_ooutfile.value.Init(g_nloc);

  var omodels = getModelSelection();    // BLUE-10824 Context extended to model + group
  omodels = ArisData.sort(omodels, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);

  g_oworkingarray           = new Array();
  g_odonemodels             = new Array();
  g_odonefuncdefs.value     = new Array();
  g_odonemodfuncoccs.value  = new Array();
  g_oepkfuncobjects         = new Array();
  g_oinputobjdefs           = new Array();
  g_ooutputobjdefs          = new Array();
  g_oorgobjdefs             = new Array();
  g_oapplobjdefs            = new Array();

  g_sdonemodident = new Array(); 
  g_bsamefunction = false;

  g_npicnum = 1;
  g_ssourceruleoffunc = new Array(); 

  if (omodels.length > 0) {
    if (g_bDialogsSupported) {
        var holder_nOptOutput       = new __holder(0);
        var holder_bSupplement      = new __holder(false)
        var holder_nOptSortOrder    = new __holder(0);
        var holder_nLinkLevels      = new __holder(g_nDefaultLinkLevels);
        var holder_aModelTypes      = new __holder(new Array());
        var holder_bGraphic         = new __holder(false);
        
        var nuserdialog = showOutputOptionsDialog(g_ooutfile, holder_nOptOutput, holder_bSupplement, holder_nOptSortOrder, holder_nLinkLevels, holder_aModelTypes, holder_bGraphic);
    
        if(nuserdialog==0) {
          Context.setScriptError(Constants.ERR_CANCEL);
          return;
        }
    
        g_nOptOutput            = holder_nOptOutput.value;
        g_nselectedoption       = holder_nOptSortOrder.value;
        g_bappendix             = holder_bSupplement.value;
        ndepth.value            = holder_nLinkLevels.value;
        g_nSelectedModelTypes   = holder_aModelTypes.value;
        g_bGraphic              = holder_bGraphic.value;
    } else {
        // BLUE-4295
        g_nOptOutput            = 0;                            // Model hierarchy via functions
        g_nselectedoption       = 1;                            // Sort alphabetically
        g_bappendix             = false;                        // With appendix
        ndepth.value            = 5;                            // Assignment levels
        g_nSelectedModelTypes   = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]; // Indices of all model types in list
        g_bGraphic              = true;                         // With model graphic    

        // BLUE-12274 - Show simplified dialog in ARIS Connect
        if (!Context.getEnvironment().equals(Constants.ENVIRONMENT_BP)) {  // Never show in Business Publisher (BLUE-12274)
            var holder_nOptSortOrder    = new __holder(g_nselectedoption);
            var holder_nLinkLevels      = new __holder(ndepth.value);
            
            var nuserdialog = showConnectOptionsDialog(g_ooutfile, holder_nOptSortOrder, holder_nLinkLevels);
            if(nuserdialog == 0) {
                Context.setScriptError(Constants.ERR_CANCEL);
                return;
            } 
            g_nselectedoption       = holder_nOptSortOrder.value;
            ndepth.value            = holder_nLinkLevels.value;
        }        

        var bModelColor        = false;
        var nScaleOption       = 2;     // fit to page
        var bCutOfTheGraphic   = false;
        // most of the parameters are ignored!
        outputintoregistry(bModelColor, nScaleOption, bCutOfTheGraphic, 0, 0, 0, 0, 0, 0, 100);
    }

    // Beginning of processing the selected options.
    setReportHeaderFooter(g_ooutfile.value, g_nloc, true, true, true);

    evaluate(omodels, ndepth);

    g_ooutfile.value.WriteReport();
  }
  else {
      if (g_bDialogsSupported) {
          Dialogs.MsgBox(txtNoModelsSelected, Constants.MSGBOX_BTN_OK, getString("TEXT49"));
          Context.setScriptError(Constants.ERR_NOFILECREATED);  
      } else {
          outEmptyResult();     // BLUE-10824 Output empty result in Connect
      }
  }
}


function isSelectedModelTypeForAssignment(modelTypeNum)
{
  for(var i=0;i<g_nSelectedModelTypes.length;i++) {
    var mt = g_nmodeltypes[g_nSelectedModelTypes[i]];
    if(modelTypeNum==mt) {
      return true; 
    }
  }

  return false;
}


// --------------------------------------------------------------
// Subprogram AssignedModelsIntoList for inserting the assigned models into the corresponding list
// Parameter
// oCurrentFuncOcc = Current function occurrence.
// nDepth = Depth of the model level to be evaluated.
// nCurrentDepth = Current depth of the model levels.
// nModelLevel =  Model number on the current level.
// sFuncLevel = Number of the current function.
// oAsProzModelList = List of assigned models (of the Processes type).
// sSourceFuncProc =  List containing names of functions to which processes are assigned.

function assignedmodelsintolist(ocurrentfuncocc, ndepth, ncurrentdepth, nmodellevel, sfunclevel, oasprozmodellist, ssourcefuncproc)
{
  var bdonemodel = false;   // Indicator flag if the model has already been evaluated.
  var soutstring = new __holder(""); 
  var bfoundassigment = false;

  // Default settings.
  var bcheck = false; 
  var omodelsoffuncass  = ocurrentfuncocc.value.ObjDef().AssignedModels(); // List of models which are assigned to the current function.
  omodelsoffuncass      = ArisData.sort(omodelsoffuncass, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);

  if (omodelsoffuncass.length > 0) {
    for (var j = 0 ; j < omodelsoffuncass.length ; j++ ) {
      var ocurrentmodeloffuncass = omodelsoffuncass[j];
      bcheck = checkassignedmodel(ocurrentmodeloffuncass, oasprozmodellist, ndepth, ncurrentdepth, nmodellevel, soutstring);
      if (isSelectedModelTypeForAssignment(ocurrentmodeloffuncass.OrgModelTypeNum())) {     // TANR 216764
        switch(ocurrentmodeloffuncass.OrgModelTypeNum()) {      // TANR 216764
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
          case Constants.MT_FUNC_ALLOC_DGM:
          case Constants.MT_EEPC_TAB_HORIZONTAL:
          case Constants.MT_BPD_BPMN:                       // Anubis 356389
          case Constants.MT_BPMN_ALLOC_DIAGR:               // Anubis 356389
          case Constants.MT_PROCESS_SCHEDULE:
          case Constants.MT_SIPOC:

            if (bcheck == false) {
              oasprozmodellist.value[oasprozmodellist.value.length] = ocurrentmodeloffuncass;
              ssourcefuncproc.value[ssourcefuncproc.value.length] = "" + ncurrentdepth.value + "." + nmodellevel.value + "." + sfunclevel.value + String.fromCharCode(9) + ocurrentfuncocc.value.ObjDef().Name(g_nloc);
              bfoundassigment = true;
            }
          break;

          default:
            // The assigned models of the list are no processes, thus the hierarchy level will not be increased.
            if (bcheck == false) {
              g_oworkingarray[g_oworkingarray.length] = ocurrentmodeloffuncass;
              g_ssourcearray[g_ssourcearray.length] = "" + ncurrentdepth.value + "." + nmodellevel.value + "." + sfunclevel.value + String.fromCharCode(9) + ocurrentfuncocc.value.ObjDef().Name(g_nloc);
              bfoundassigment = true;
            }
        }
      }
    }
  }
}



// --------------------------------------------------------------
// Subprogram CheckAssignedModel Checks whether the assigned model is taken into account when the output is executed.
// Parameter
// oCurrentAssModel = Current assigned model.
// oAsProzModelList = List of assigned models (of the Processes type).
// nCurrentDepth = Current depth of the model levels.
// nModelLevel =  Model number on the current level.
// sIdOfAsMod = ID of the assigned model.

function checkassignedmodel(ocurrentassmodel, oasprozmodellist, ndepth, ncurrentdepth, nmodellevel, sidofasmod)
{
  var __functionResult = false;

  sidofasmod.value = ocurrentassmodel.Name(g_nloc);
  // Checks whether model is already evaluated.
  if (g_odonemodels.length > 0) {
    for (var i = 0; i < g_odonemodels.length; i++) {
      if (g_odonemodels[i].IsEqual(ocurrentassmodel) == true) {
        __functionResult = true;
        sidofasmod.value = g_sdonemodident[i];
        return __functionResult;
      }
    }
  }

  // Current level is registered for evaluation.
  if (g_odonemodels.length > 0) {
    for (var i = (nmodellevel.value - 1) ; i < g_oworkingarray.length ; i++ ){
      if (g_oworkingarray[i].IsEqual(ocurrentassmodel) == true) {
        __functionResult = true;
        sidofasmod.value = "" + ncurrentdepth.value + "." + (i + 1) + " " + ocurrentassmodel.Name(g_nloc);
        return __functionResult;
      }
    }
  }

  // Next level is registered for evaluation.
  if (oasprozmodellist.value.length > 0) {
    for (var i = 0 ; i < oasprozmodellist.value.length ; i++ ){
      if (oasprozmodellist.value[i].IsEqual(ocurrentassmodel) == true) {
        __functionResult = true;
        if ((ncurrentdepth.value + 1) <= ndepth.value) {
          sidofasmod.value = "" + (ncurrentdepth.value + 1) + "." + (i + 1) + " " + ocurrentassmodel.Name(g_nloc);
        } else {
          sidofasmod.value = ocurrentassmodel.Name(g_nloc);
        }

        return __functionResult;
      }
    }
  }

  return __functionResult;
}



// --------------------------------------------------------------
// Subprogram CheckObj for checking whether the current object has already been written into a reference list.
// Parameter
// oCurrentObj = Current object (Occ/Def).
// sIDOfEvaluateObj = Designation of the object from the corresponding list if it occurs in the reference list.
// nCurrentDepth = Current depth of the model levels.
// nModelLevel = Model number on the current level.
// sFuncLevel = Number of the current function.
// bEntry = True , and entering into the list.
// bID = True if ID of the element should be returned.
// oReferenceList = List of reference objects.
// sIDList = List of designations.
// sName = Name of the object to be checked.

function checkobj(ocurrentobj, sidofevaluateobj, ncurrentdepth, nmodellevel, sfunclevel, bentry, bid, oreferencelist, sidlist, sname)
{
  var __functionResult = false;

  if (oreferencelist.value.length > 0) {
    for (var i = 0 ; i < oreferencelist.value.length ; i++ ){
      if (ocurrentobj.value.IsEqual(oreferencelist.value[i])) {
        if (bid == true) {
          sidofevaluateobj.value = sidlist[i];
        }
        __functionResult = true;
        break;
      }
      else {
        if (bid == true) {
          sidofevaluateobj.value = "";
        }
      }
    }
  }

  if (__functionResult == false && bentry == true) {
    if (oreferencelist.value.length == 0) {
        sidlist.length = 0;                      // MWZ, 04.07.06, Call-ID 122680
    }
    oreferencelist.value[oreferencelist.value.length] = ocurrentobj.value;
    sidlist[sidlist.length] = "" + ncurrentdepth.value + "." + nmodellevel.value + "." + sfunclevel.value + String.fromCharCode(9) + sname;
  }

  return __functionResult;
}



// --------------------------------------------------------------
// Subprogram eEPKOut for the topological output of the functions in the model (eEPC) after the control flow.
// oCurrentModel = Current model.
// nDepth = Depth of the model level to be evaluated.
// nCurrentDepth = Current depth of the model levels.
// nModelLevel = Number or quantity of models that have already been output.
// oAsProzModelList = List of assigned models (of the Processes type).
// sSourceFuncProc =  List containing names of functions to which processes are assigned.
// oRootList = List of root objects.

function eepkout(ocurrentmodel, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc, orootlist)
{
  var ndummy = new __holder(0);
  var sdummy = new __holder("");

  var ocurrentoccfunc = new __holder(null); 
  var sfunclevel = ""; 
  var bfirst = false; 

  // Default settings
  g_nprozfunclevel = 0;

  if (orootlist.length > 0) {
    for (var i = 0 ; i < orootlist.length ; i++ ){
      ocurrentoccfunc.value = orootlist[i];
      bfirst = true;
      g_sselecttion = txtMTeEPC;
      g_ooutfile.value.OutputLn(txtStartPath, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
      g_ooutfile.value.OutputLn("", getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
      outofepkfunc(ocurrentmodel, ocurrentoccfunc, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc, "", false);
      if (g_oepkfuncobjects.length > 0) {
        var j = 0;
        while (j < g_oepkfuncobjects.length) {
          var bdonefunc = checkobj(new __holder(g_oepkfuncobjects[j]), sdummy, ndummy, ndummy, sdummy, false, false, g_odonemodfuncoccs, g_sdfuoccid, g_oepkfuncobjects[j].ObjDef().Name(g_nloc));
          if (! (bdonefunc)) {
            g_ooutfile.value.OutputLn(txtStartPath, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            g_ooutfile.value.OutputLn("", getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            outofepkfunc(ocurrentmodel, new __holder(g_oepkfuncobjects[j]), ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc, ""+j, true);
          }
          j = (j + 1);
        }

        // Delete List g_oEpkFuncObjects.
        g_oepkfuncobjects = new Array();
      }
      g_ssourceruleoffunc = new Array(); 
    }
  }
}



// ----------------------------------------------------------------
// 'Evaluate' for calling the subprogram; 'Manufacture' for recursive processing.
// oModels = List of the selected models.
// nDepth = Depth of the model level to be evaluated.

function evaluate(omodels, ndepth)
{
  g_ssourcearray = new Array(); 
  // Default settings
  if (ndepth.value > 0) {
    // List of selected models.
    for (var i = 0; i < omodels.length; i++) {
      g_bstartlable = true;
      var ocurrentmodel = omodels[i];
      g_oworkingarray[g_oworkingarray.length] = ocurrentmodel;
      // Inserts models in g_oWorkingArray for processing in 'Manufacture'.
      g_ssourcearray[i] = getString("TEXT28");
    }
    manufacture(ndepth, new __holder(1));
  }
}



// --------------------------------------------------------------
// Subprogram FindNextFunc for determining the next function.
// oCurrentModel = Current model.
// oCurrentObjOcc = Current ObjOcc by which the next function will be found.
// oTargetFuncObjectList = List of functions which were found over the connections.

function findnextfunc(ocurrentmodel, ocurrentobjocc, otargetfuncobjectlist)
{
  var onextobjoccs = null;   // List of following elements.
  var onextcurrentobjocc = new __holder(null);   // Current following element.
  var bcheck = false; 
  var sdummy = new __holder(""); 
  var ndummy = new __holder(0); 
  var sdummylist = new Array(); 

  onextobjoccs = ocurrentmodel.value.GetSuccNodes(ocurrentobjocc);
  bcheck = true;
  if (onextobjoccs.length > 0) {
    for (var i = 0 ; i < onextobjoccs.length ; i++ ){
      onextcurrentobjocc.value = onextobjoccs[i];
      switch(onextcurrentobjocc.value.ObjDef().TypeNum()) {
        case Constants.OT_FUNC:
          bcheck = checkobj(onextcurrentobjocc, sdummy, ndummy, ndummy, sdummy, false, false, otargetfuncobjectlist, sdummylist, "");
          if (bcheck == false) {
            otargetfuncobjectlist.value[otargetfuncobjectlist.value.length] = onextcurrentobjocc.value;
          }
        break;

        default:
          findnextfunc(ocurrentmodel, onextcurrentobjocc.value, otargetfuncobjectlist);
        }
    }
  }
}



function getstartnodes(ocurrentmodel)
{
  var ostartobjoccs = null; 
  if (ocurrentmodel.OrgModelTypeNum() == Constants.MT_VAL_ADD_CHN_DGM) {        // TANR 216764
    ostartobjoccs = new Array();
    var ofuncoccs = ocurrentmodel.ObjOccListFilter(Constants.OT_FUNC);
    for (var i = 0 ; i < ofuncoccs.length ; i++ ){
      var ofuncocc = ofuncoccs[i];
      if (ofuncocc.InDegree(Constants.EDGES_STRUCTURE) == 0) {
        ostartobjoccs[ostartobjoccs.length] = ofuncocc;
      }
    }
  } else {
    ostartobjoccs = ocurrentmodel.StartNodeList();
  }
  ostartobjoccs = ArisData.sort(ostartobjoccs, Constants.SORT_GEOMETRIC, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
  return ostartobjoccs;
} 



// --------------------------------------------------------------
// FindRootFunc For determining the root functions of the current model.
// oCurrentModel = Current model.
// oRootList = List of root objects.

function findrootfunc(ocurrentmodel, orootlist)
{
  var bcheck = false; 
  var nnumoutcxn = 0; 
  var nincxn = 0; 

  orootlist.value = new Array();
  ocurrentmodel.value.BuildGraph(true);
//  var ostartobjoccs = ocurrentmodel.value.StartNodeList(); // List of start objects.
  var ostartobjoccs = getstartnodes(ocurrentmodel.value);
  if (ostartobjoccs.length > 0) {
    // Elements that are not of the function or event type will be removed from the list.
    while (bcheck == false) {
      bcheck = true;
      for (var i = 0 ; i < ostartobjoccs.length ; i++ ){
        nnumoutcxn = ostartobjoccs[i].OutDegree(Constants.EDGES_STRUCTURE);
        nincxn = ostartobjoccs[i].InDegree(Constants.EDGES_STRUCTURE);
        if (! (ostartobjoccs[i].ObjDef().TypeNum() == Constants.OT_FUNC) && ! (ostartobjoccs[i].ObjDef().TypeNum() == Constants.OT_EVT) || (nnumoutcxn == 0 && nincxn != 0)) {
          ostartobjoccs = doDelete(ostartobjoccs, ostartobjoccs[i]);
          bcheck = false;
          break;
        }
      }
    }
  }

  if (ostartobjoccs.length > 0) {
    for (var i = 0 ; i < ostartobjoccs.length ; i++ ){
      var ocurrentstartobjocc = ostartobjoccs[i];
      if (ocurrentstartobjocc.ObjDef().TypeNum() == Constants.OT_FUNC) {
        orootlist.value[orootlist.value.length] = ocurrentstartobjocc;
      } else {
        findnextfunc(ocurrentmodel, ocurrentstartobjocc, orootlist);
      }
    }
  }
}



// --------------------------------------------------------------
// FunctionTreeOut for the topological output of the functions in the model (function tree) after control flow.
// oCurrentModel = Current model.
// nDepth = Depth of the model level to be evaluated.
// nCurrentDepth = Current depth of the model levels.
// nModelLevel = Number or quantity of models that have already been output.
// oAsProzModelList = List of assigned models (of the Processes type).
// sSourceFuncProc =  List containing names of functions to which processes are assigned.
// oRootList = List of root objects.

function functiontreeout(ocurrentmodel, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc, rootlist)
{
  var ocurrentoccfunc = new __holder(null); 
  var sfunclevel = new __holder(""); 
  var bfirst = new __holder(false); 

  if (rootlist.length > 0) {
    for (var i = 0 ; i < rootlist.length ; i++ ){
      ocurrentoccfunc.value = rootlist[i];
      bfirst.value = true;
      sfunclevel.value = "" + (i + 1);
      outofthetreefunc(ocurrentmodel, ocurrentoccfunc, ndepth, ncurrentdepth, nmodellevel, sfunclevel, oasprozmodellist, ssourcefuncproc, bfirst, new __holder(""), new __holder(true));
      ocurrentoccfunc.value = null;
    }
  }
}



// --------------------------------------------------------------
// Subprogram 'Manufacture' for the recursive workout of the hierarchy levels.
// nDepth = Depth of the model level to be evaluated.
// nCurrentDepth = Current depth of the model levels.

function manufacture(ndepth, ncurrentdepth)
{
  if(g_nOptOutput == 0) {
    manufacture_std(ndepth, ncurrentdepth);
  } else if(g_nOptOutput == 1) {
    manufacture_iso(ndepth, ncurrentdepth);
  }
}

function manufacture_std(ndepth, ncurrentdepth)
{
  var oasprozmodellist = new __holder(null);        // List of the assigned models (of the processes type).
  var ocurrentmodel = new __holder(null); 
  var ssourcefuncproc = new __holder(new Array());  // List containing names of functions to which processes are assigned.
  var osourcefuncproc = null;                       // List of function occurrences to which processes are assigned.
  var ssourcefunction = new __holder("");           // ID of the function to which the current model was assigned.
  var bfirstmodel = false; 

  // Default settings.
  oasprozmodellist.value = new Array();
  var nsourcefuncprocnumbers = 0;

  if (ncurrentdepth.value <= ndepth.value +1) {
    var i = 0;
    while (i < g_oworkingarray.length) {
      if (i == 0) {
        bfirstmodel = true;
      } else {
        bfirstmodel = false;
      }

      ssourcefunction.value = g_ssourcearray[i];
      ocurrentmodel.value = g_oworkingarray[i];
      if(i!=0) {
        g_ooutfile.value.OutputField(Constants.FIELD_NEWPAGE, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
      }
      g_odonemodfuncoccs.value = new Array();
      g_oepkfuncobjects = new Array();

      g_sdfuoccid = new Array(); 
      g_ssortstrings = new Array(); 

      outputmodeldata(ocurrentmodel, ncurrentdepth, new __holder((i + 1)), ssourcefunction, bfirstmodel);
      g_odonemodels[g_odonemodels.length] = ocurrentmodel.value;
      if (g_bmodelidententry == false) {
        g_bmodelidententry = true;
      }

      g_sdonemodident[g_sdonemodident.length] = "" + ncurrentdepth.value + "." + (i + 1) + ocurrentmodel.value.Name(g_nloc);
      outputfuncofmodels(ocurrentmodel, ndepth, ncurrentdepth, new __holder((i + 1)), oasprozmodellist, ssourcefuncproc);
      i = (i + 1);
      ocurrentmodel.value = null;
    }

    // Models of the next hierarchy level in the list (g_oWorkingArray ;g_oWorkingArray must be deleted beforehand).
      g_oworkingarray = new Array();        // MWZ, 04.07.06, Call-ID 122680

    if (oasprozmodellist.value.length > 0) {
      g_ssourcearray = new Array(); 
      for ( i = 0 ; i < oasprozmodellist.value.length; i++) {
        g_oworkingarray[g_oworkingarray.length] = oasprozmodellist.value[i];
        g_ssourcearray[i] = ssourcefuncproc.value[i];
      }

      // Raise hierarchy level and output models.
      manufacture(ndepth, new __holder((ncurrentdepth.value + 1)));
    }
  }
}


// --------------------------------------------------------------
// Subprogram 'Manufacture' for the recursive workout of the hierarchy levels.
function manufacture_iso(ndepth, ncurrentdepth)
{
  var oasprozmodellist = new __holder(null); 
  var ocurrentmodel = new __holder(null); 
  var ssourcefuncproc = new __holder(new Array()); 
  var osourcefuncproc = null;   // List of function occurrences to which processes are assigned.
  var ssourcefunction = new __holder("");   // ID of the function to which the current model was assigned.
  var bfirstmodel = false; 

  var i = 0; 

  // Default settings.
  oasprozmodellist.value = new Array();
  var nsourcefuncprocnumbers = undefined; 
  nsourcefuncprocnumbers = 0;
  g_sdonemodident = new Array(); 

  g_odonemodels = new Array();
  
  g_ocurarray = g_oworkingarray;

  if (ncurrentdepth.value <= ndepth.value +1) {
    i = 0;
    while (i < g_ocurarray.length) {
      if(i!=0) {
        g_ooutfile.value.OutputField(Constants.FIELD_NEWPAGE, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
      }
      if (i == 0) {
        bfirstmodel = true;
      } else {
        bfirstmodel = false;
      }

      ssourcefunction.value = g_ssourcearray[i];
      ocurrentmodel.value = g_ocurarray[i];

      g_odonemodfuncoccs.value = new Array();

      g_sdfuoccid = new Array(); 

      g_oinputobjdefs = new Array();
      g_ooutputobjdefs = new Array();
      g_oorgobjdefs = new Array();
      g_oapplobjdefs = new Array();
      g_oepkfuncobjects = new Array();

      g_ssortstrings = new Array(); 
      outputmodeldata(ocurrentmodel, ncurrentdepth, new __holder((i + 1)), ssourcefunction, bfirstmodel);
      g_odonemodels[g_odonemodels.length] = ocurrentmodel.value;
      if (! (g_bmodelidententry)) {
        g_bmodelidententry = true;
      }
      
      g_sdonemodident[g_sdonemodident.length] = "" + ncurrentdepth.value + "." + (i + 1) + ocurrentmodel.value.Name(g_nloc);
      g_ooutfile.value.OutputLn(getString("TEXT50"), getString("TEXT48"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
      outputfuncofmodels(ocurrentmodel, ndepth, ncurrentdepth, new __holder((i + 1)), oasprozmodellist, ssourcefuncproc);
      if (g_bappendix) {
        outobjofmodels(g_oinputobjdefs, txtInputObjects + ": ");
        outobjofmodels(g_ooutputobjdefs, txtOutputObjects + ": ");
        outobjofmodels(g_oorgobjdefs, txtOrgElements + ": ");
        outobjofmodels(g_oapplobjdefs, txtApplSystems + ": ");
      }
      i++;
      ocurrentmodel.value = null;
    }

    // Models of the next hierarchy level in the list (g_oCurArray ;g_oCurArray must be deleted beforehand)
    g_oworkingarray = new Array();

    if (oasprozmodellist.value.length > 0) {
      g_ssourcearray = new Array(); 
      for ( i = 0 ; i < oasprozmodellist.value.length ; i++ ){
        g_oworkingarray[g_oworkingarray.length] = oasprozmodellist.value[i];
        g_ssourcearray[i] = ssourcefuncproc.value[i];
      }

      // Raise hierarchy level and output models.
      manufacture(ndepth, new __holder((ncurrentdepth.value + 1)));
    }
  }
  oasprozmodellist.value = null;
}


// --------------------------------------------------------------
// Subprogram OutFuncData for outputting the functions' data.
// oCurrentFuncOcc = Current function occurrence.
// nDepth = Depth of the model level to be evaluated.
// nCurrentDepth = Current depth of the model levels.
// nModelLevel =  Model number on the current level.
// sFuncLevel = Number of the current function.
// oAsProzModelList = List of assigned models (of the Processes type).
// sSourceFuncProc =  List containing names of functions to which processes are assigned.
// sBough = Designation of the branch when outputting function trees.

function outfuncdata(ocurrentfuncocc, ndepth, ncurrentdepth, nmodellevel, sfunclevel, oasprozmodellist, ssourcefuncproc, sbough)
{
  var ocxnocclist           = new __holder(null); 
  var sidentificationofassignedmodels = new Array(); 
  var sidofevaluatefun      = new __holder(""); 
  var ssearchleftstring     = new __holder(""); 
  var ssearchrightstring    = new __holder(""); 

  // Default settings
  var iidentificationofassignedmodelsnumbers = 0; 
  var bdonefunc2    = checkobj(ocurrentfuncocc, sidofevaluatefun, ncurrentdepth, nmodellevel, sfunclevel, true, true, g_odonemodfuncoccs, g_sdfuoccid, ocurrentfuncocc.value.ObjDef().Name(g_nloc));
  var bdonefunc     = checkobj(new __holder(ocurrentfuncocc.value.ObjDef()), sidofevaluatefun, ncurrentdepth, nmodellevel, sfunclevel, true, true, g_odonefuncdefs, g_sdonefuncident, ocurrentfuncocc.value.ObjDef().Name(g_nloc));

  if (! (bdonefunc2)) {
    var ssearchchar = String.fromCharCode(9);
    ssearchleftstring.value = "";
    ssearchrightstring.value = "";
    // Assignments of the function are put in the corresponding list.
    var bcallfunction = false;
    if (ncurrentdepth.value <= ndepth.value) {
      if (! (ocurrentfuncocc.value.OrgSymbolNum() == Constants.ST_PRCS_IF)) {
        assignedmodelsintolist(ocurrentfuncocc, ndepth, ncurrentdepth, nmodellevel, sfunclevel, oasprozmodellist, ssourcefuncproc);
      }
    }

    if (bdonefunc == false) {
      g_ooutfile.value.OutputLnF("", "REPORT5");
      g_ooutfile.value.OutputLnF("" + ncurrentdepth.value + "." + nmodellevel.value + "." + sfunclevel.value + " " + ocurrentfuncocc.value.ObjDef().Name(g_nloc), "REPORT3");
      g_ooutfile.value.OutputLnF("", "REPORT5");
      g_ooutfile.value.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
      if (g_sselecttion == getString("TEXT13") && ! (sbough.value == "")) {
        g_ooutfile.value.TableRow();
        g_ooutfile.value.TableCell(txtFrom+" ", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        g_ooutfile.value.TableCell(sbough.value, 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      }

      if (g_bdonefunc == true) {
        stringcut(g_sdonefuncid, ssearchleftstring, ssearchrightstring, ssearchchar);
        g_ooutfile.value.TableRow();
        g_ooutfile.value.TableCell(txtLeadsTo+" ", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        g_ooutfile.value.TableCell(((((txtFunction + "  " + ssearchrightstring.value) + getString("TEXT51")) + ssearchleftstring.value) + ")"), 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      }

      var oattributes = ocurrentfuncocc.value.ObjDef().AttrList(g_nloc);
      if (oattributes.length > 0) {
        outofattributes(oattributes);
      }

      ocxnocclist.value = ocurrentfuncocc.value.CxnOccList();
      if (ocxnocclist.value.length > 0) {
        outofrelationships(ocxnocclist, ocurrentfuncocc);
      }

      // Assignments
      outofassignedmodels(ocurrentfuncocc, oasprozmodellist, ndepth, ncurrentdepth, nmodellevel);
      g_ooutfile.value.EndTable("", 100, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }

    else {
      stringcut(sidofevaluatefun.value, ssearchleftstring, ssearchrightstring, ssearchchar);
      g_ooutfile.value.OutputLnF("", "REPORT5");
      g_ooutfile.value.OutputLnF("" + ncurrentdepth.value + "." + nmodellevel.value + "." + sfunclevel.value + "  " + ssearchrightstring.value + " " + getString("TEXT52") + " " + ssearchleftstring.value, "REPORT3");
      g_ooutfile.value.OutputLnF("", "REPORT5");
      // Assignments
      g_ooutfile.value.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
      ocxnocclist.value = ocurrentfuncocc.value.CxnOccList();
      if (ocxnocclist.value.length > 0) {
        outofrelationships(ocxnocclist, ocurrentfuncocc);
      }
      g_ooutfile.value.EndTable("", 100, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }
  }
}



// --------------------------------------------------------------
// Subroutine OutNum for outputting the functions contained in the model which are sorted on the basis of the numbering of the attribute type 1.
// oCurrentModel = Current model.
// nDepth = Depth of the model level to be evaluated.
// nCurrentDepth = Current depth of the model levels.
// nModelLevel = Number or quantity of models that have already been output.
// oAsProzModelList = List of assigned models (of the Processes type).
// sSourceFuncProc =  List containing names of functions to which processes are assigned.

function outnum(ocurrentmodel, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc)
{
  var ocurrentfuncocc = new __holder(null);   // Current function occurrence.
  var oobjectdummy = null;   // Object for intermediate storing.
  var bchange = false;   // Indicator flag in case of change.
  var bexpr1 = false;   // Ausdruck1
  var bexpr2 = false;   // Ausdruck2

  var ofuncoccs = ocurrentmodel.ObjOccListFilter(Constants.OT_FUNC);   // List of function occurrences.
  var ofuncoccsarray = new Array();
  if (ofuncoccs.length > 0) {
    for (var i = 0 ; i < ofuncoccs.length ; i++ ){
      ofuncoccsarray[i] = ofuncoccs[i];
    }

    // Sorting on the basis of the size.
    while (bchange == false) {
      bchange = true;
      for (var j = 0 ; j < (ofuncoccs.length - 2)+1 ; j++ ){
        bexpr1 = isNumeric(ofuncoccsarray[j].ObjDef().Attribute(Constants.AT_TYP1, g_nloc).GetValue(true));
        bexpr2 = isNumeric(ofuncoccsarray[(j + 1)].ObjDef().Attribute(Constants.AT_TYP1, g_nloc).GetValue(true));
        if (bexpr1 && bexpr2) {
          if (parseInt(ofuncoccsarray[j].ObjDef().Attribute(Constants.AT_TYP1, g_nloc).GetValue(true)) > parseInt(ofuncoccsarray[(j + 1)].ObjDef().Attribute(Constants.AT_TYP1, g_nloc).GetValue(true))) {
            oobjectdummy = ofuncoccsarray[j];
            ofuncoccsarray[j] = ofuncoccsarray[(j + 1)];
            ofuncoccsarray[(j + 1)] = oobjectdummy;
            oobjectdummy = null;
            bchange = false;
          }
        } else if (bexpr1 || bexpr2) {
          if (! (bexpr1) && bexpr2) {
            oobjectdummy = ofuncoccsarray[j];
            ofuncoccsarray[j] = ofuncoccsarray[(j + 1)];
            ofuncoccsarray[(j + 1)] = oobjectdummy;
            oobjectdummy = null;
            bchange = false;
          }
        }
      }
    }

    // Output of sorted functions.
    for (var i = 0 ; i < ofuncoccs.length ; i++ ){
      ocurrentfuncocc.value = ofuncoccsarray[i];
      // Output will only be executed if the attribute is maintained.
      if (isNumeric(ocurrentfuncocc.value.ObjDef().Attribute(Constants.AT_TYP1, g_nloc).GetValue(true)) == true) {
        outfuncdata(ocurrentfuncocc, ndepth, ncurrentdepth, nmodellevel, new __holder("" + (i + 1)), oasprozmodellist, ssourcefuncproc, new __holder(""));
      }
      ocurrentfuncocc.value = null;
    }
  }
}


// --------------------------------------------------------------
// Subprogram OutObjOfModels for outputting certain object types that have relationships to the functions in the current model.

function outobjofmodels(oobjdefs, sheadline)
{
  if (oobjdefs.length > 0) {
    oobjdefs = ArisData.sort(oobjdefs, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);

    g_ooutfile.value.OutputLn("", getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
    g_ooutfile.value.OutputLn(sheadline, getString("TEXT48"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
//    g_ooutfile.value.OutputLn("", getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
    for (var i = 0 ; i < oobjdefs.length ; i++ ){
      g_ooutfile.value.OutputLnF("", "REPORT5");
      g_ooutfile.value.OutputLn(oobjdefs[i].Name(g_nloc), getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
      var oattributes = oobjdefs[i].AttrList(g_nloc);
      if (oattributes.length > 0) {
        g_ooutfile.value.OutputLnF("", "REPORT5");
        g_ooutfile.value.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        outofattributes(oattributes);
        g_ooutfile.value.EndTable("", 100, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
//        g_ooutfile.value.OutputLn("", getString("TEXT48"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0);
      }
    }
  }
}


// --------------------------------------------------------------
// OutOfAssignedModels for outputting the assigned models.
// oCurrentFuncObjOcc = Current function occurrence.
// oAsProzModelList = List of assigned models (of the Processes type).
// nCurrentDepth = Current depth of the model levels.
// nModelLevel = Model number on the current level.

function outofassignedmodels(ocurrentfuncobjocc, oasprozmodellist, ndepth, ncurrentdepth, nmodellevel)
{
  var oassignedmodels = null;   // List of models which are assigned to the function.
  var osubmodfunc = null;   // Object definition of the current function definition in the assigned model.
  var soutstring = new __holder(""); 
  var bcheck = false; 

  oassignedmodels = ocurrentfuncobjocc.value.ObjDef().AssignedModels();
  oassignedmodels = ArisData.sort(oassignedmodels, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);

  if (oassignedmodels.length > 0) {
    var bColored = true;   // variable to change background color of table rows
      
    g_ooutfile.value.TableRow();
    g_ooutfile.value.TableCell(txtAssignedModels + ": ", 50, getString("TEXT48"), 12, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.value.TableCell("", 50, getString("TEXT48"), 12, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    for (var h = 0 ; h < oassignedmodels.length ; h++ ){
      bcheck = checkassignedmodel(oassignedmodels[h], oasprozmodellist, ndepth, ncurrentdepth, nmodellevel, soutstring);
      g_ooutfile.value.TableRow();
      g_ooutfile.value.TableCell(soutstring.value, 50, getString("TEXT48"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      g_ooutfile.value.TableCell(oassignedmodels[h].Type(), 50, getString("TEXT48"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
      bColored = !bColored; // Change background color
    }
  }
}


// --------------------------------------------------------------
// OutOfAttributes for outputting the allowed attributes.
// oAttributes = List of maintained attributes.

function outofattributes(oattributes)
{
  var bAttrColored = true;   // variable to change background color of table rows (attributes)                            

  g_ooutfile.value.TableRow();
  g_ooutfile.value.TableCell(getString("TEXT53"), 50, getString("TEXT48"), 12, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
  g_ooutfile.value.TableCell("", 50, getString("TEXT48"), 12, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
  for (var i = 0 ; i < oattributes.length ; i++ ){
    var ocurrentattribute = oattributes[i];
    g_ooutfile.value.TableRow();
    g_ooutfile.value.TableCell(ocurrentattribute.Type(), 50, getString("TEXT48"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

    if (ocurrentattribute.TypeNum() == Constants.AT_DESC) {
      // Line breaks NOT removed
      g_ooutfile.value.TableCell(ocurrentattribute.GetValue(false), 50, getString("TEXT48"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    } else {
      g_ooutfile.value.TableCell(ocurrentattribute.GetValue(true), 50, getString("TEXT48"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }

    bAttrColored = !bAttrColored; // Change background color (attributes)    
  }
}


function outofepkfunc(ocurrentmodel, ocurrentoccfunc, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc, spredfuncocc, bisindex)
{
  if(g_nOptOutput == 0) {
    outofepkfunc_std(ocurrentmodel, ocurrentoccfunc, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc, spredfuncocc, bisindex);
  } else if(g_nOptOutput == 1) {
    outofepkfunc_iso(ocurrentmodel, ocurrentoccfunc, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc, spredfuncocc, bisindex);
  }
}

function outofepkfunc_iso(ocurrentmodel, ocurrentoccfunc, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc, spredfuncocc, bisindex)
{
  var onextobjocclist = new Array(); 
  var currentcxnocc = null; 
  var otarfulist = new __holder(null); 
  var nobjabspos = new Array(); 
  var bdonefunc = false; 
  var sidofevaluatefun = new __holder(""); 

  var srulestring = new __holder(""); 
  var sdummy = new __holder(""); 
  var ndummy = new __holder(0); 
  var x = 0.0;;   var y = 0.0;;   var z = 0.0; 

  // Default settings
  var lnumberoftargetfuncobjects = undefined; 
  lnumberoftargetfuncobjects = 0;
  onextobjocclist = new Array(); 
  otarfulist.value = new Array();

  switch(spredfuncocc) {
    case "":
      srulestring.value = "";
    break;
    default:
      if (isNumeric(spredfuncocc) && bisindex) {
        srulestring.value = g_ssourceruleoffunc[parseInt(spredfuncocc)];
      }
      else {
        srulestring.value = " "+txtFunction+" " + spredfuncocc + " ("+txtChapter+" " + ncurrentdepth.value + "." + nmodellevel.value + "." + g_nprozfunclevel + ")";
      }
    }
  g_nprozfunclevel++;
  findnextfunc(ocurrentmodel, ocurrentoccfunc.value, otarfulist);
  bdonefunc = checkobj(ocurrentoccfunc, sdummy, ndummy, ndummy, sdummy, false, false, g_odonemodfuncoccs, g_sdfuoccid, ocurrentoccfunc.value.ObjDef().Name(g_nloc));
  if (otarfulist.value.length > 0) {
    nobjabspos = new Array(); 
    onextobjocclist = new Array(); 
    for (var j = 0 ; j < otarfulist.value.length ; j++ ){
      onextobjocclist[j] = otarfulist.value[j];
      x = otarfulist.value[j].X();
      y = otarfulist.value[j].Y();
      z = (x * x) + (y * y);
      nobjabspos[j] = Math.sqrt(z);
    }

    // The paths are inserted in the global list to make sure that they are taken into account when sorting.
    g_ssortstrings = new Array(); 
    for (var i = 0 ; i < otarfulist.value.length ; i++ ){
      g_ssortstrings[i] = " "+txtFunction+" " + ocurrentoccfunc.value.ObjDef().Name(g_nloc) + " ("+txtChapter+" " + ncurrentdepth.value + "." + nmodellevel.value + "." + g_nprozfunclevel + ")";
    }

    // Sorting of the functions in the list. Evaluation of the functions by the smallest X coordinate.
    // The others are written into the global list g_oepkfuncobjects.
    sortposition(onextobjocclist, nobjabspos);
    // Back into list oTarFuList.
    otarfulist.value = new Array();

    for (var i = 0 ; i < onextobjocclist.length ; i++ ){
      otarfulist.value[otarfulist.value.length] = onextobjocclist[i];
    }

    if (otarfulist.value.length > 1) {
      for (var i = 1 ; i < otarfulist.value.length ; i++ ){
        g_oepkfuncobjects[g_oepkfuncobjects.length] = otarfulist.value[i];
        g_ssourceruleoffunc[g_ssourceruleoffunc.length] = g_ssortstrings[i];
      }
    }

    bdonefunc = checkobj(new __holder(otarfulist.value[0]), sidofevaluatefun, ncurrentdepth, nmodellevel, new __holder(""+(g_nprozfunclevel + 1)), false, true, g_odonemodfuncoccs, g_sdfuoccid, "");
    if (bdonefunc) {
      g_bdonefunc = true;
      g_sdonefuncid = sidofevaluatefun.value;
    }

    outfuncdata(ocurrentoccfunc, ndepth, ncurrentdepth, nmodellevel, new __holder(""+g_nprozfunclevel), oasprozmodellist, ssourcefuncproc, srulestring);
    g_bdonefunc = false;
    if (! (bdonefunc)) {
      outofepkfunc(ocurrentmodel, new __holder(otarfulist.value[0]), ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc, ocurrentoccfunc.value.ObjDef().Name(g_nloc), false);
    }
  }

  if (otarfulist.value.length == 0 || bdonefunc) {
    outfuncdata(ocurrentoccfunc, ndepth, ncurrentdepth, nmodellevel, new __holder(""+g_nprozfunclevel), oasprozmodellist, ssourcefuncproc, srulestring);
    g_ooutfile.value.OutputLn(txtEndOfPath, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_ooutfile.value.OutputLn("", getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
  }
}

// --------------------------------------------------------------
// Subprogram OutOfEPKFunc for the topological output of the functions in the model (eEPC).
// oCurrentModel = Current model.
// oCurrentOccFunc = current function (Occ).
// nDepth = Depth of the model level to be evaluated.
// nCurrentDepth = Current depth of the model levels.
// nModelLevel = Number or quantity of models that have already been output.
// oAsProzModelList = List of assigned models (of the Processes type).
// sSourceFuncProc =  List containing names of functions to which processes are assigned.
// sPredFuncOcc = 'Name of the predecessor function.
// bIsIndex = sPredFuncOcc is index (true) or name (false)

function outofepkfunc_std(ocurrentmodel, ocurrentoccfunc, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc, spredfuncocc, bisindex)
{
  var ndummy = new __holder(0);
  var sdummy = new __holder("");

  var otargetfuncobjectlist = new __holder(null); 
  var srulestring = new __holder(""); 
  var srule = ""; 
  var objectxposition = new Array(); 
  var objectyposition = new Array(); 
  var bdonefunc = false; 
  var sidofevaluatefun = new __holder(""); 

  // Default settings
  var lnumberoftargetfuncobjects = 0;
  var onextobjocclist = new Array(); 
  otargetfuncobjectlist.value = new Array();

  switch(spredfuncocc) {
    case "":
      srulestring.value = "";
    break;
    default:
      if (isNumeric(spredfuncocc) && bisindex) {
        srulestring.value = g_ssourceruleoffunc[parseInt(spredfuncocc)];
      } else {
        srulestring.value = " "+txtFunction + spredfuncocc + " ( " + txtChapter + ncurrentdepth.value + "." + nmodellevel.value + "." + g_nprozfunclevel + ")";
      }
  }

  g_nprozfunclevel++;
  findnextfunc(ocurrentmodel, ocurrentoccfunc.value, otargetfuncobjectlist);
  bdonefunc = checkobj(ocurrentoccfunc, sdummy, ndummy, ndummy, sdummy, false, false, g_odonemodfuncoccs, g_sdfuoccid, ocurrentoccfunc.value.ObjDef().Name(g_nloc));

  if (otargetfuncobjectlist.value.length > 0) {
    for (var j = 0 ; j < otargetfuncobjectlist.value.length ; j++ ){
      onextobjocclist[j] = otargetfuncobjectlist.value[j];
      objectxposition[j] = otargetfuncobjectlist.value[j].X();
      objectyposition[j] = otargetfuncobjectlist.value[j].Y();
    }

    // The paths are inserted in the global list to make sure that they are taken into account when sorting.
    for (var i = 0 ; i < otargetfuncobjectlist.value.length ; i++ ){
      g_ssortstrings[i] = getString("TEXT54") + ocurrentoccfunc.value.ObjDef().Name(g_nloc) + getString("TEXT51") + ncurrentdepth.value + "." + nmodellevel.value + "." + g_nprozfunclevel + ")";
    }

    // Sorting of the functions in the list. Evaluation of the functions by the smallest X coordinate.
    // The others are inserted into the global list g_oEpkFuncObjects.
    sortposition(onextobjocclist, objectxposition, objectyposition);
    g_bsamefunction = false;
    // Back into list oTargetFuncObjectList.
    otargetfuncobjectlist.value = new Array();

    for (var i = 0 ; i < onextobjocclist.length ; i++ ){
      otargetfuncobjectlist.value[otargetfuncobjectlist.value.length] = onextobjocclist[i];
    }

    if (otargetfuncobjectlist.value.length > 1) {
      for (var i = 1 ; i < otargetfuncobjectlist.value.length ; i++ ){
        g_oepkfuncobjects[g_oepkfuncobjects.length] = otargetfuncobjectlist.value[i];
        g_ssourceruleoffunc[g_ssourceruleoffunc.length] = g_ssortstrings[i];
      }
    }

    bdonefunc = checkobj(new __holder(otargetfuncobjectlist.value[0]), sidofevaluatefun, ncurrentdepth, nmodellevel, new __holder(""+(g_nprozfunclevel + 1)), false, true, g_odonemodfuncoccs, g_sdfuoccid, "");
    if (bdonefunc == true) {
      g_bdonefunc = true;
      g_sdonefuncid = sidofevaluatefun.value;
    }

    outfuncdata(ocurrentoccfunc, ndepth, ncurrentdepth, nmodellevel, new __holder(""+g_nprozfunclevel), oasprozmodellist, ssourcefuncproc, srulestring);
    g_bdonefunc = false;
    if (bdonefunc == false) {
      outofepkfunc(ocurrentmodel, new __holder(otargetfuncobjectlist.value[0]), ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc, ocurrentoccfunc.value.ObjDef().Name(g_nloc), false);
    }
  }

  if (otargetfuncobjectlist.value.length == 0 || bdonefunc) {
    outfuncdata(ocurrentoccfunc, ndepth, ncurrentdepth, nmodellevel, new __holder(""+g_nprozfunclevel), oasprozmodellist, ssourcefuncproc, srulestring);
    g_ooutfile.value.OutputLn(txtEndOfPath, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_ooutfile.value.OutputLn("", getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
  }
}

function outofrelationships(ocxnoccs, ocurrentfuncocc)
{
  if(g_nOptOutput==0) {
    outofrelationships_std(ocxnoccs, ocurrentfuncocc);
  } else if(g_nOptOutput == 1) {
    outofrelationships_iso(ocxnoccs, ocurrentfuncocc);
  }
}


// --------------------------------------------------------------
// OutOfRelationships for outputting the allowed relationships.
// oCxnOccs = List of the maintained attributes.
// oCurrentFuncOcc = Current function occurrence.

function outofrelationships_std(ocxnoccs, ocurrentfuncocc)
{
  var bColored = true;   // variable to change background color of table rows          

  var osubmodfunc = null;   // Object definition of the current function definition in the assigned model.
  var soutstr = ""; 
  
  var scurrentfuname = ocurrentfuncocc.value.ObjDef().Name(g_nloc);
  g_ooutfile.value.TableRow();
  g_ooutfile.value.TableCell(txtRelations + ": ", 50, getString("TEXT48"), 12, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
  g_ooutfile.value.TableCell("", 50, getString("TEXT48"), 12, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
  
  // Relationships within the model.
  for (var i = 0 ; i < ocxnoccs.value.length ; i++ ){
    var ocurrentcxnocc = ocxnoccs.value[i];
    g_ooutfile.value.TableRow();
    if (ocurrentfuncocc.value.IsEqual(ocurrentcxnocc.SourceObjOcc()) == true) {
      g_ooutfile.value.TableCell(ocurrentcxnocc.Cxn().ActiveType(), 50, getString("TEXT48"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      soutstr = ocurrentcxnocc.TargetObjOcc().ObjDef().Name(g_nloc);
      if (soutstr == "") {
        soutstr = "("+txtNotNamed+")";
      }
      g_ooutfile.value.TableCell(soutstr, 50, getString("TEXT48"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }
    else {
      g_ooutfile.value.TableCell(ocurrentcxnocc.Cxn().PassiveType(), 50, getString("TEXT48"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      soutstr = ocurrentcxnocc.SourceObjOcc().ObjDef().Name(g_nloc);
      if (soutstr == "") {
        soutstr = "("+txtNotNamed+")";
      }
      g_ooutfile.value.TableCell(soutstr, 50, getString("TEXT48"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }
    bColored = !bColored; // Change background color
  }

  // Relationships in the assigned function allocation diagram.
  var oassignedmodels = ocurrentfuncocc.value.ObjDef().AssignedModels();
  oassignedmodels = ArisData.sort(oassignedmodels, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);

  if (oassignedmodels.length > 0) {
    for (var h = 0 ; h < oassignedmodels.length ; h++ ){
      switch(oassignedmodels[h].OrgModelTypeNum()) {        // TANR 216764
        case Constants.MT_FUNC_ALLOC_DGM:
        case Constants.MT_BPMN_ALLOC_DIAGR:                 // Anubis 356389
          if (! (ocurrentfuncocc.value.Model().IsEqual(oassignedmodels[h]))) {
          // Assigned model is not current model
//            osubmodfunc = oassignedmodels[h].ObjOccListFilter(scurrentfuname, g_nloc, Constants.OT_FUNC);
            osubmodfunc = ocurrentfuncocc.value.ObjDef().OccListInModel(oassignedmodels[h]);    // Call-ID 106790
            if (osubmodfunc.length > 0) {                                                       // Anubis 411777
              ocxnoccs.value = oassignedmodels[h].CxnOccList();
              for ( i = 0 ; i < ocxnoccs.value.length ; i++ ){
                  var ocurrentcxnocc = ocxnoccs.value[i];
                  g_ooutfile.value.TableRow();
                  
                  if (osubmodfunc[0].IsEqual(ocurrentcxnocc.SourceObjOcc()) == true) {
                      g_ooutfile.value.TableCell(ocurrentcxnocc.Cxn().ActiveType(), 50, getString("TEXT48"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                      g_ooutfile.value.TableCell(ocurrentcxnocc.TargetObjOcc().ObjDef().Name(g_nloc), 50, getString("TEXT48"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                  }
                  else {
                      g_ooutfile.value.TableCell(ocurrentcxnocc.Cxn().PassiveType(), 50, getString("TEXT48"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                      g_ooutfile.value.TableCell(ocurrentcxnocc.SourceObjOcc().ObjDef().Name(g_nloc), 50, getString("TEXT48"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                  }
                  bColored = !bColored; // Change background color
              }
            }
          }
        break;
      }
    }
  }
}


// --------------------------------------------------------------
// Subprogram OutOfRelationships for outputting the allowed relationships.

function outofrelationships_iso(ocxnoccs, ofuncocc)
{
  var osubcxnoccs = new __holder(null); // List of sub connections.
  var osubmodfunc = null;               // Object definition of the current function definition in the assigned model.
  var scurrentfuname = "";              // Name of the current function.
  var sinputcxntype = new Array();      // List of connection types for input objects.
  var soutputcxntype = new Array();     // List of connection types for output objects.
  var sorgcxntype = new Array();        // List of connection types for organizational objects.
  var sapplcxntype = new Array();       // List of connection types for application system objects.

  sinputcxntype   = new Array();
  soutputcxntype  = new Array();
  sorgcxntype     = new Array();
  sapplcxntype    = new Array();

  var oinputobjoccs     = new Array();  // List of input objects of the model.
  var ooutputobjoccs    = new Array();  // List of output objects of the model.
  var oorgobjoccs       = new Array();  // List of organizational objects of the model.
  var oapplobjoccs      = new Array();  // List of application system objects of the model.

  scurrentfuname = ofuncocc.value.ObjDef().Name(g_nloc);
  // Relationships in the model are put in the corresponding list.
  getrelations(ocxnoccs, oinputobjoccs, ooutputobjoccs, oorgobjoccs, oapplobjoccs, sinputcxntype, soutputcxntype, sorgcxntype, sapplcxntype);
  // Relationships in the assigned function allocation diagram.
  var oassignedmodels = ofuncocc.value.ObjDef().AssignedModels();   // List of models which are assigned to the function.
  oassignedmodels = ArisData.sort(oassignedmodels, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);

  if (oassignedmodels.length > 0) {
    for (var h = 0 ; h < oassignedmodels.length ; h++ ){
      switch(oassignedmodels[h].OrgModelTypeNum()) {        // TANR 216764
        case Constants.MT_FUNC_ALLOC_DGM:
        case Constants.MT_BPMN_ALLOC_DIAGR:                 // Anubis 356389
          if (! (ofuncocc.value.Model().IsEqual(oassignedmodels[h]))) {
          // Assigned model is not current model
//            osubmodfunc = oassignedmodels[h].ObjOccListFilter_40(scurrentfuname, Constants.OT_FUNC, g_nloc);
            osubmodfunc = ofuncocc.value.ObjDef().OccListInModel(oassignedmodels[h]);    // Call-ID 106790
            
            osubcxnoccs.value = oassignedmodels[h].CxnOccList();
            getrelations(osubcxnoccs, oinputobjoccs, ooutputobjoccs, oorgobjoccs, oapplobjoccs, sinputcxntype, soutputcxntype, sorgcxntype, sapplcxntype);
          }
        break;
      }
    }
  }

  if (oinputobjoccs.length > 0) {
    g_ooutfile.value.TableRow();
    g_ooutfile.value.TableCell(txtInput+": ", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.value.TableCell("", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    relationout(oinputobjoccs, sinputcxntype);
  }

  if (ooutputobjoccs.length > 0) {
    g_ooutfile.value.TableRow();
    g_ooutfile.value.TableCell(txtOutput + ": ", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.value.TableCell("", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    relationout(ooutputobjoccs, soutputcxntype);
  }


  if (oorgobjoccs.length > 0) {
    g_ooutfile.value.TableRow();
    g_ooutfile.value.TableCell(txtOrgResp+": ", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.value.TableCell("", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    relationout(oorgobjoccs, sorgcxntype);
  }

  if (oapplobjoccs.length > 0) {
    g_ooutfile.value.TableRow();
    g_ooutfile.value.TableCell(txtApplSysSupp+": ", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.value.TableCell("", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    relationout(oapplobjoccs, sapplcxntype);
  }
}


// --------------------------------------------------------------
// Subprogram GetRelations for determining the relationships.
function getrelations(ocxnoccs, oinputobjoccs, ooutputobjoccs, oorgobjoccs, oapplobjoccs, sinputcxntype, soutputcxntype, sorgcxntype, sapplcxntype)
{
  var bcheck = false; 
  var sdummylist = new Array(); 
  var sdummy = new __holder(""); 
  var ndummy = new __holder(0); 

  for (var i = 0 ; i < ocxnoccs.value.length ; i++ ){
    switch(ocxnoccs.value[i].Cxn().TypeNum()) {
      case Constants.CT_PROV_INP_FOR:
      case Constants.CT_IS_INP_FOR:
        oinputobjoccs[oinputobjoccs.length] = ocxnoccs.value[i].SourceObjOcc();
        bcheck = checkobj(new __holder(ocxnoccs.value[i].SourceObjOcc().ObjDef()), sdummy, ndummy, ndummy, sdummy, false, false, new __holder(g_oinputobjdefs), sdummylist, ocxnoccs.value[i].SourceObjOcc().ObjDef().Name(g_nloc));
        if (! (bcheck)) {
          g_oinputobjdefs[g_oinputobjdefs.length] = ocxnoccs.value[i].SourceObjOcc().ObjDef();
        }

        sinputcxntype[sinputcxntype.length] = ocxnoccs.value[i].Cxn().PassiveType();
      break;

      case Constants.CT_HAS_OUT:
      case Constants.CT_CRT_OUT_TO:
        ooutputobjoccs[ooutputobjoccs.length] = ocxnoccs.value[i].TargetObjOcc();
        bcheck = checkobj(new __holder(ocxnoccs.value[i].TargetObjOcc().ObjDef()), sdummy, ndummy, ndummy, sdummy, false, false, new __holder(g_ooutputobjdefs), sdummylist, ocxnoccs.value[i].TargetObjOcc().ObjDef().Name(g_nloc));
        if (! (bcheck)) {
          g_ooutputobjdefs[g_ooutputobjdefs.length] = ocxnoccs.value[i].TargetObjOcc().ObjDef();
        }

        soutputcxntype[soutputcxntype.length] = ocxnoccs.value[i].Cxn().ActiveType();
      break;
    }

    switch(ocxnoccs.value[i].SourceObjOcc().ObjDef().TypeNum()) {
      case Constants.OT_SYS_ORG_UNIT:
      case Constants.OT_SYS_ORG_UNIT_TYPE:
      case Constants.OT_ORG_UNIT:
      case Constants.OT_ORG_UNIT_TYPE:
      case Constants.OT_PERS:
      case Constants.OT_PERS_TYPE:
      case Constants.OT_POS:
      case Constants.OT_GRP:
        oorgobjoccs[oorgobjoccs.length] = ocxnoccs.value[i].SourceObjOcc();
        bcheck = checkobj(new __holder(ocxnoccs.value[i].SourceObjOcc().ObjDef()), sdummy, ndummy, ndummy, sdummy, false, false, new __holder(g_oorgobjdefs), sdummylist, ocxnoccs.value[i].SourceObjOcc().ObjDef().Name(g_nloc));
        if (! (bcheck)) {
          g_oorgobjdefs[g_oorgobjdefs.length] = ocxnoccs.value[i].SourceObjOcc().ObjDef();
        }

        sorgcxntype[sorgcxntype.length] = ocxnoccs.value[i].Cxn().PassiveType();
      break;


      case Constants.OT_APPL_SYS:
      case Constants.OT_APPL_SYS_CLS:
      case Constants.OT_APPL_SYS_TYPE:
      case Constants.OT_MOD:
      case Constants.OT_MOD_CLS:
      case Constants.OT_MOD_TYPE:
      case Constants.OT_DP_FUNC:
      case Constants.OT_DP_FUNC_CLS:
      case Constants.OT_DP_FUNC_TYPE:
        oapplobjoccs[oapplobjoccs.length] = ocxnoccs.value[i].SourceObjOcc();
        bcheck = checkobj(new __holder(ocxnoccs.value[i].SourceObjOcc().ObjDef()), sdummy, ndummy, ndummy, sdummy, false, false, new __holder(g_oapplobjdefs), sdummylist, ocxnoccs.value[i].SourceObjOcc().ObjDef().Name(g_nloc));
        if (! (bcheck)) {
          g_oapplobjdefs[g_oapplobjdefs.length] = ocxnoccs.value[i].SourceObjOcc().ObjDef();
        }
        sapplcxntype[sapplcxntype.length] = ocxnoccs.value[i].Cxn().PassiveType();
      break;
    }

    if (ocxnoccs.value[i].TargetObjOcc().ObjDef().TypeNum() == Constants.OT_LOC) {
      oorgobjoccs[oorgobjoccs.length] = ocxnoccs.value[i].TargetObjOcc();
      bcheck = checkobj(new __holder(ocxnoccs.value[i].TargetObjOcc().ObjDef()), sdummy, ndummy, ndummy, sdummy, false, false, new __holder(g_oorgobjdefs), sdummylist, ocxnoccs.value[i].TargetObjOcc().ObjDef().Name(g_nloc));
      if (! (bcheck)) {
        g_oorgobjdefs[g_oorgobjdefs.length] = ocxnoccs.value[i].TargetObjOcc().ObjDef();
      }
      sorgcxntype[sorgcxntype.length] = ocxnoccs.value[i].Cxn().ActiveType();
    }
  }
}


// --------------------------------------------------------------
// Subprogram OutOfTheTreeFunc for recursive output of the functions in the model (function tree) topologically.
// oCurrentModel = Current model.
// oCurrentOccFunc = current function (Occ).
// nDepth = Depth of the model level to be evaluated.
// nCurrentDepth = Current depth of the model levels.
// nModelLevel = Number or quantity of models that have already been output.
// oAsProzModelList = List of assigned models (of the Processes type).
// sSourceFuncProc =  List containing names of functions to which processes are assigned.
// bFirst = Checking for first call of procedure.
// sBoughIn = Numbering of the branch when outputting function trees.
// bFirstSubFunc = Checking whether first call of SubFunktion.

var txtFuncTree  = getString("TEXT55");
var txtEndOfPath = getString("TEXT56");

function outofthetreefunc(ocurrentmodel, ocurrentoccfunc, ndepth, ncurrentdepth, nmodellevel, sfunclevel, oasprozmodellist, ssourcefuncproc, bfirst, sboughin, bfirstsubfunc)
{
  var oobjectlist = new Array(); 
  var objectxposition = new Array(); 
  var objectyposition = new Array(); 
  var bcheck = false;   // Indicator flag if FuncOcc has already been evaluated in the model = True.
  var sboughout = new __holder(""); 
  var sdummy = new __holder(""); 
  var sdummylist = new Array(); 

  var ilistsize = 0;
  if (bfirst.value == true) {
    g_sselecttion = "";
  } else {
    g_sselecttion = txtFuncTree;
  }

  bfirst.value = false;
  bcheck = checkobj(ocurrentoccfunc, sdummy, ncurrentdepth, nmodellevel, sfunclevel, false, false, g_odonemodfuncoccs, sdummylist, "");
  outfuncdata(ocurrentoccfunc, ndepth, ncurrentdepth, nmodellevel, sfunclevel, oasprozmodellist, ssourcefuncproc, sboughin);
  if (bcheck == false) {
    g_odonemodfuncoccs.value[g_odonemodfuncoccs.value.length] = ocurrentoccfunc.value;
    var onextobjoccs = ocurrentmodel.value.GetSuccNodes(ocurrentoccfunc.value);
    if (onextobjoccs.length > 0) {
      for (var i = 0 ; i < onextobjoccs.length ; i++ ){
        var ocurrentnextobjocc = onextobjoccs[i];
        // The sub functions are written into a list for sorting.
        oobjectlist[i] = ocurrentnextobjocc;
        objectxposition[i] = ocurrentnextobjocc.X();
        objectyposition[i] = ocurrentnextobjocc.Y();
      }

      sortposition(oobjectlist, objectxposition, objectyposition);
      for (var i = 0 ; i < onextobjoccs.length ; i++ ){
        if (bfirstsubfunc.value == true) {
          sboughout.value = "" + (i + 1);
          bfirstsubfunc.value = false;
        } else {
          sboughout.value = sboughin.value + "." + (i + 1);
        }
        outofthetreefunc(ocurrentmodel, new __holder(oobjectlist[i]), ndepth, ncurrentdepth, nmodellevel, new __holder(sfunclevel.value + "." + (i + 1)), oasprozmodellist, ssourcefuncproc, bfirst, sboughout, bfirstsubfunc);
      }
    }
  }
  else {
    g_bsamefunction = false;
  }
}



// --------------------------------------------------------------
// OutputFuncOfModels Call of procedure for the selected sort criterion.
// oCurrentModel = Current model.
// nDepth = Depth of the model level to be evaluated.
// nCurrentDepth = Current depth of the model levels.
// nModelLevel =  Model number on the current level.
// oAsProzModelList = List of assigned models (of the Processes type).
// sSourceFuncProc =  List containing names of functions to which processes are assigned.

function outputfuncofmodels(ocurrentmodel, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc)
{
  switch(g_nselectedoption) {
    case 0:
    case 1:
      outsymalpha(ocurrentmodel.value, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc);
    break;

    case 2:
      outtopo(ocurrentmodel, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc);
    break;

    case 3:
      outnum(ocurrentmodel.value, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc);
    break;
  }
}


function outputmodeldata(ocurrentmodel, ncurrentdepth, nmodellevel, ssourcefunc, bfirstmodel)
{
  if(g_nOptOutput==0) {
    outputmodeldata_std(ocurrentmodel, ncurrentdepth, nmodellevel, ssourcefunc, bfirstmodel);
  } else if(g_nOptOutput==1) {
    outputmodeldata_iso(ocurrentmodel, ncurrentdepth, nmodellevel, ssourcefunc, bfirstmodel);
  }
}

// --------------------------------------------------------------
// Subprogram OutputModelData for outputting the model data.
// Parameter
// oCurrentModel = Current model.
// nCurrentDepth = Current depth of the model levels.
// nModelLevel = Model number in the hierarchy.
// sSourceFunc = Function to which this model is assigned.
// bFirstModel = First model on this level (Yes = True / No = False).

function outputmodeldata_std(ocurrentmodel, ncurrentdepth, nmodellevel, ssourcefunc, bfirstmodel)
{
  var ocurrentsuperiorobject = new __holder(null); 
  var soutstring = new __holder("");   // Output string.
  var nmodelzoom = 0.0; 
  var bfirst = false; 
  var bdummy = false; 

  var osuperiorobjectlist = new Array();

  bfirst = true;

  if (bfirstmodel == true) {
    if (ncurrentdepth.value == 1) {
      g_ooutfile.value.OutputLnF("" + ncurrentdepth.value + "."+txtTopLevel, "REPORT1");
    } else {
      g_ooutfile.value.OutputLnF("", "REPORT1");
      g_ooutfile.value.OutputLnF("" + ncurrentdepth.value + "."+txtLevel, "REPORT1");
    }
  }

  g_ooutfile.value.OutputLnF("", "REPORT5");
  g_ooutfile.value.OutputLnF("" + ncurrentdepth.value + "." + nmodellevel.value + " " + ocurrentmodel.value.Name(g_nloc) + " " + ocurrentmodel.value.Type(), "REPORT2");
  g_ooutfile.value.OutputLnF("", "REPORT5");
  g_ooutfile.value.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
  if (! (ssourcefunc.value == txtNull)) {
    g_ooutfile.value.TableRow();
    g_ooutfile.value.TableCell(txtAssignmentOf + ": ", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.value.TableCell(ssourcefunc.value, 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    osuperiorobjectlist = ocurrentmodel.value.SuperiorObjDefs();
    if (osuperiorobjectlist.length > 0) {
      for (var i = 0 ; i < osuperiorobjectlist.length ; i++ ){
        ocurrentsuperiorobject.value = osuperiorobjectlist[i];
        bdummy = checkobj(ocurrentsuperiorobject, soutstring, ncurrentdepth, nmodellevel, ssourcefunc, false, true, g_odonefuncdefs, g_sdonefuncident, "");
        if (! (soutstring.value == "") && ! (soutstring.value == ssourcefunc.value)) {
          g_ooutfile.value.TableRow();
          if (bfirst == true) {
            g_ooutfile.value.TableCell(txtFurtherFunctionsWithSameAssignment, 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            bfirst = false;
          } else {
            g_ooutfile.value.TableCell("", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
          }

          g_ooutfile.value.TableCell(soutstring.value, 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
          ocurrentsuperiorobject.value = null;
        }
      }
    }
  }

  g_ooutfile.value.TableRow();
  g_ooutfile.value.TableCell(txtGroup + ": ", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
  g_ooutfile.value.TableCell(ocurrentmodel.value.Group().Name(g_nloc), 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
  var oattributes = ocurrentmodel.value.AttrList(g_nloc);
  if (oattributes.length > 0) {
    outofattributes(oattributes);
  }

  g_ooutfile.value.EndTable("", 100, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
  g_ooutfile.value.OutputLn("", getString("TEXT48"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0);
  if (g_bGraphic) {
    // Graphic of the model.
    graphicout(g_ooutfile, ocurrentmodel.value);
    g_ooutfile.value.OutputLn("", getString("TEXT48"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_ooutfile.value.OutputLnF(txtPicture + " " + g_npicnum + String.fromCharCode(9) + ocurrentmodel.value.Name(g_nloc), "REPORT4");
    g_ooutfile.value.OutputLn("", getString("TEXT48"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_npicnum++;
  }

}



// --------------------------------------------------------------
// Subprogram OutputModelData for outputting the model data.

function outputmodeldata_iso(ocurrentmodel, ncurrentdepth, nmodellevel, ssourcefunc, bfirstmodel)
{
  var ocurrentsuperiorobject = new __holder(null); 
  var ostrobjdef = null;   // List of structuring elements.
  var nmodelzoom = 0.0; 
  var soutstring = new __holder("");   // Output string.
  var bfirst = false; 
  var bdummy = false; 

  var osuperiorobjectlist = new Array();
  ostrobjdef = new Array();

  bfirst = true;
  if (bfirstmodel) {
    if (ncurrentdepth.value == 1) {
      g_ooutfile.value.OutputLnF("" + ncurrentdepth.value + "."+txtTopLevel, "REPORT1");
    } else {
      g_ooutfile.value.OutputLnF("", "REPORT1");
      g_ooutfile.value.OutputLnF("" + ncurrentdepth.value + "."+txtLevel, "REPORT1");
    }
  }

  osuperiorobjectlist = ocurrentmodel.value.SuperiorObjDefs();
  // Structuring elements are filtered.
  var i = 0;
  while (i <= (osuperiorobjectlist.length - 1)) {
    if (osuperiorobjectlist[i].TypeNum() == Constants.OT_STRCT_ELMT) {
      ostrobjdef[ostrobjdef.length] = osuperiorobjectlist[i];
      osuperiorobjectlist = doDelete(osuperiorobjectlist, i);
    }
    else {
      i = (i + 1);
    }
  }

  g_ooutfile.value.OutputLnF("", "REPORT5");
  g_ooutfile.value.OutputLnF("" + ncurrentdepth.value + "." + nmodellevel.value + " " + ocurrentmodel.value.Name(g_nloc) + " " + ocurrentmodel.value.Type(), "REPORT2");
  g_ooutfile.value.OutputLnF("", "REPORT5");
  g_ooutfile.value.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
  if (ssourcefunc.value == txtNull) {
    // No instruction.
  } else {
    g_ooutfile.value.TableRow();
    g_ooutfile.value.TableCell(txtAssignmentOf+": ", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.value.TableCell(ssourcefunc.value, 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

    if (osuperiorobjectlist.length > 0) {
      for ( i = 0 ; i < osuperiorobjectlist.length ; i++ ){
        ocurrentsuperiorobject.value = osuperiorobjectlist[i];
        bdummy = checkobj(ocurrentsuperiorobject, soutstring, ncurrentdepth, nmodellevel, ssourcefunc, false, true, g_odonefuncdefs, g_sdfuoccid, "");
        if (! (soutstring.value == "") && ! (soutstring.value == ssourcefunc.value)) {
          g_ooutfile.value.TableRow();
          if (bfirst) {
            g_ooutfile.value.TableCell(txtFurtherFunctionsWithSameAssignment, 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            bfirst = false;
          } else {
            g_ooutfile.value.TableCell("", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
          }

          g_ooutfile.value.TableCell(soutstring.value, 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
          ocurrentsuperiorobject.value = null;
        }
      }
    }
  }

  g_ooutfile.value.TableRow();
  g_ooutfile.value.TableCell(txtGroup + ": ", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
  g_ooutfile.value.TableCell(ocurrentmodel.value.Group().Name(g_nloc), 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
  var oattributes = ocurrentmodel.value.AttrList(g_nloc);
  if (oattributes.length > 0) {
    outofattributes(oattributes);
  }
  if (ostrobjdef.length > 0) {
    g_ooutfile.value.TableRow();
    g_ooutfile.value.TableCell(txtNormElements + ": ", 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.value.TableCell(txtNorm, 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    for ( i = 0 ; i < ostrobjdef.length ; i++ ){
      var ocurstrobjoccs = ostrobjdef[i].OccList();
      if (ocurstrobjoccs.length > 0) {
        soutstring.value = ocurstrobjoccs[0].Model().Name(g_nloc);
        for (var j = 1 ; j < ocurstrobjoccs.length ; j++ ){
          soutstring.value = soutstring.value + ", " + ocurstrobjoccs[j].Model().Name(g_nloc);
        }
      }

      g_ooutfile.value.TableRow();
      g_ooutfile.value.TableCell(ostrobjdef[i].Name(g_nloc), 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      g_ooutfile.value.TableCell(soutstring.value, 50, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      soutstring.value = "";
    }
  }

  g_ooutfile.value.EndTable("", 100, getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
  g_ooutfile.value.OutputLn("", getString("TEXT48"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0);
  if (g_bGraphic) {
    // Graphic of the model.
    graphicout(g_ooutfile, ocurrentmodel.value);

    g_ooutfile.value.OutputLn("", getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_ooutfile.value.OutputLnF(txtPicture + " " + g_npicnum + String.fromCharCode(9) + ocurrentmodel.value.Name(g_nloc), "REPORT4");
    g_ooutfile.value.OutputLn("", getString("TEXT48"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_npicnum++;
  }

  ocurrentsuperiorobject.value = null;
}


// --------------------------------------------------------------
// OutSymAlpha for outputting the functions in the model by symbol type or alphabetically.
// oCurrentModel = Current model.
// nDepth = Depth of the model level to be evaluated.
// nCurrentDepth = Current depth of the model levels.
// nModelLevel =  Model number on the current level.
// oAsProzModelList = List of assigned models (of the Processes type).
// sSourceFuncProc =  List containing names of functions to which processes are assigned.

function outsymalpha(ocurrentmodel, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc)
{
  var ocurrentfuncocc = new __holder(null); 

  var ofuncoccs = ocurrentmodel.ObjOccListFilter(Constants.OT_FUNC);
  if (ofuncoccs.length > 0) {
    switch(g_nselectedoption) {
      case 0:
        ofuncoccs = ArisData.sort(ofuncoccs, Constants.SORT_SYMBOLNAME, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);
      break;
      case 1:
        ofuncoccs = ArisData.sort(ofuncoccs, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
      break;
    }

    for (var i = 0 ; i < ofuncoccs.length ; i++ ){
      ocurrentfuncocc.value = ofuncoccs[i];
      outfuncdata(ocurrentfuncocc, ndepth, ncurrentdepth, nmodellevel, new __holder(""+(i + 1)), oasprozmodellist, ssourcefuncproc, new __holder(""));
      ocurrentfuncocc.value = null;
    }
  }
}


// --------------------------------------------------------------
// OutTopo for outputting the functions in the model after control flow.
// oCurrentModel = Current model.
// nDepth = Depth of the model level to be evaluated.
// nCurrentDepth = Current depth of the model levels.
// nModelLevel = Number or quantity of models that have already been output.
// oAsProzModelList = List of assigned models (of the Processes type).
// sSourceFuncProc =  List containing names of functions to which processes are assigned.

function outtopo(ocurrentmodel, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc)
{
  var orootlist = new __holder(null);   // List of root objects.
  orootlist.value = new Array();

  findrootfunc(ocurrentmodel, orootlist);
  if (orootlist.value.length > 0) {
    switch(ocurrentmodel.value.OrgModelTypeNum()) {         // TANR 216764
      case Constants.MT_PRCS_SLCT_MTX:
        processselectionmatrixout(ocurrentmodel.value, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc, orootlist.value);
      break;

      case Constants.MT_FUNC_TREE:
        functiontreeout(ocurrentmodel, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc, orootlist.value);
      break;

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
      case Constants.MT_EEPC_TAB_HORIZONTAL:
      case Constants.MT_BPD_BPMN:                       // Anubis 356389
      case Constants.MT_PROCESS_SCHEDULE:      
      case Constants.MT_SIPOC:   
        eepkout(ocurrentmodel, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc, orootlist.value);
      break;
    }
  } else {
        // BLUE-13204 - Topological sorting but no functions part of the control flow
        g_ooutfile.value.OutputLnF("", "REPORT5");
        g_ooutfile.value.OutputLnF(getString("TEXT57"), "REPORT6");
        g_ooutfile.value.OutputLnF("", "REPORT5");
  }
  orootlist.value = null;
}


// --------------------------------------------------------------
// ProcessSelectionmatrixOut for the topological output of the functions in the model (PAM) after control flow.
// oCurrentModel = Current model.
// nDepth = Depth of the model level to be evaluated.
// nCurrentDepth = Current depth of the model levels.
// nModelLevel = Number or quantity of models that have already been output.
// oAsProzModelList = List of assigned models (of the Processes type).
// sSourceFuncProc =  List containing names of functions to which processes are assigned.
// oRootList = List of root objects.

function processselectionmatrixout(ocurrentmodel, ndepth, ncurrentdepth, nmodellevel, oasprozmodellist, ssourcefuncproc, orootlist)
{
  var ocurrentrootobject = new __holder(null);

  var ocurrentnextobjocc = null;   // Current following element.
  var oobjectdummy = null; 

  var currentobjectname = ""; 
  var cxntargetobjectname = ""; 
  var cxnsourceobjectname = ""; 

  var nysize = new Array(); 
  var nydummy = 0; 
  var nsize = 0; 
  var bchange = false; 

  if (orootlist.length > 0) {
    for (var i = 0 ; i < orootlist.length ; i++ ){
      ocurrentrootobject.value = orootlist[i];
      outfuncdata(ocurrentrootobject, ndepth, ncurrentdepth, nmodellevel, new __holder(""+(i + 1)), oasprozmodellist, ssourcefuncproc, new __holder(""));
      var onextobjoccs = ocurrentmodel.GetSuccNodes(ocurrentrootobject.value);
      if (onextobjoccs.length > 0) {
        var oobjectocclist = new Array(); 
        nysize = new Array(); 
        for (var j = 0 ; j < onextobjoccs.length ; j++ ){
          oobjectocclist[j] = onextobjoccs[j];
          nysize[j] = onextobjoccs[j].y();
        }

        // Sorting by Y-coordinate.
        bchange = false;
        if (nsize > 0) {
          while (bchange == false) {
            bchange = true;
            for (var j = 0 ; j < (onextobjoccs.length - 2)+1 ; j++ ){
              if (nysize[j] > nysize[(j + 1)]) {
                nydummy = nysize[j];
                nysize[j] = nysize[(j + 1)];
                nysize[(j + 1)] = nydummy;
                oobjectdummy = oobjectocclist[j];
                oobjectocclist[j] = oobjectocclist[(j + 1)];
                oobjectdummy = oobjectocclist[(j + 1)];
                bchange = false;
              }
            }
          }

          // Output of the sorted functions.
          for (var j = 0 ; j < onextobjoccs.length ; j++ ){
            outfuncdata(new __holder(oobjectocclist[j]), ndepth, ncurrentdepth, nmodellevel, new __holder("" + (i + 1) + "." + (j + 1)), oasprozmodellist, ssourcefuncproc, new __holder(""));
          }
          oobjectocclist = new Array(); 
          nysize = new Array(); 
          nsize = 0;
        }
      }
      ocurrentrootobject.value = null;
    }
  }
}



// --------------------------------------------------------------
function RELATION(p_sCxnName, p_sObjName) {
    this.sCxnName = p_sCxnName;
    this.sObjName = p_sObjName;    
}

function sortRelation(a,b) {
    var tmp_lhs = new java.lang.String(a.sObjName);
    return tmp_lhs.compareTo(new java.lang.String(b.sObjName));
}

// Subprogram RelationOut for outputting the relationships.
function relationout(oobjoccs, scxntypename)
{ 
  // Anubis 274488    
  var aRelations = new Array();    
  for (var i = 0 ; i < oobjoccs.length; i++) {
      aRelations.push(new RELATION(scxntypename[i], oobjoccs[i].ObjDef().Name(g_nloc)));
  }
  aRelations.sort(sortRelation);
  
  var bColored = true;   // variable to change background color of table rows              
  for (var i = 0 ; i < aRelations.length; i++) {
    g_ooutfile.value.TableRow();
    g_ooutfile.value.TableCell(aRelations[i].sCxnName, 50, getString("TEXT48"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.value.TableCell(aRelations[i].sObjName, 50, getString("TEXT48"), 12, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

    bColored = !bColored; // Change background color 
  }
}

// --------------------------------------------------------------
// SortPosition for sorting the objects, 1. by the x-Position 2. by the y- Position.
// oObjectOccList = List of functions which are sorted (Occ).
// ObjectXPosition = X-coordinates of the objects.
// ObjectYPosition = Y-coordinates of the objects.

function sortposition(oobjectocclist, objectxposition, objectyposition)
{
  var objectdummy = null; 
  var bchange = false; 
  var iydummy = 0; 
  var sdummy = ""; 

  // Sort by X-coordinate.
  bchange = false;
  while (bchange == false) {
    bchange = true;
    for (var j = 0 ; j < oobjectocclist.length-1 ; j++ ){
      if (objectxposition[j] > objectxposition[(j + 1)]) {
        iydummy = objectxposition[j];
        objectxposition[j] = objectxposition[(j + 1)];
        objectxposition[(j + 1)] = iydummy;
        objectdummy = oobjectocclist[j];
        oobjectocclist[j] = oobjectocclist[(j + 1)];
        oobjectocclist[(j + 1)] = objectdummy;

        if (g_sselecttion == txtMTeEPC) {
          sdummy = g_ssortstrings[j];
          g_ssortstrings[j] = g_ssortstrings[(j + 1)];
          g_ssortstrings[(j + 1)] = sdummy;
        }
        bchange = false;
      }
    }
  }

  // Sort by y-coordinate.
  bchange = false;
  while (bchange == false) {
    bchange = true;
    for (var j = 0 ; j < oobjectocclist.length-1 ; j++ ){
      if (objectxposition[j] == objectxposition[(j + 1)]) {
        if (objectyposition[j] > objectyposition[(j + 1)]) {
          iydummy = objectyposition[j];
          objectyposition[j] = objectyposition[(j + 1)];
          objectyposition[(j + 1)] = iydummy;
          objectdummy = oobjectocclist[j];
          oobjectocclist[j] = oobjectocclist[(j + 1)];
          oobjectocclist[(j + 1)] = objectdummy;
          
          if (g_sselecttion == txtMTeEPC) {
            sdummy = g_ssortstrings[j];
            g_ssortstrings[j] = g_ssortstrings[(j + 1)];
            g_ssortstrings[(j + 1)] = sdummy;
          }
          bchange = false;
        }
      }
    }
  }
}


// --------------------------------------------------------------
// StringCut for cutting a string by a certain sign into a left and a right part.
// sDefaultString =  String that is cut by using a certain character.
// sSearchLeftString = left part of string.
// sSearchLeftString = right part of string.
// sSearchChar = Character by help o which the string is cut.

function stringcut(sdefaultstring, ssearchleftstring, ssearchrightstring, ssearchchar)
{
    sdefaultstring = ""+sdefaultstring;   
    var lpos = sdefaultstring.indexOf(ssearchchar);
    var lsize = sdefaultstring.length;
    if (lpos >= 0) {
        ssearchleftstring.value  = sdefaultstring.substr(0, lpos);
        ssearchrightstring.value = sdefaultstring.substr(lpos+1);
    }
}

var bShowGraphicSettingsDialog;
var dlgFuncOutput;


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
  switch(act)
  {
    case 1:
      bResult = false;
      break;

    case 2:
      if(dlgItem==dicOutputFormat) {
        var bEnable = dlgFuncOutput.getDlgValue(dicOutputFormat)!==0;
        dlgFuncOutput.setDlgEnable(dicSupplement, bEnable);
      } else if(dlgItem==dicGraphic) {
        var bEnable = dlgFuncOutput.getDlgValue(dicGraphic)!=0;
        dlgFuncOutput.setDlgEnable(dicShowGraphicSettings, bEnable);
      } else if(dlgItem==dicShowGraphicSettings) {
        bShowGraphicSettingsDialog = true;
        bResult = false;
      }
      else if(dlgItem=="OK")
        bResult = false;
      else if(dlgItem=="Cancel")
        bResult = false;
      break;
  }

  return bResult;
}


// dialog item code constants
var dicSupplement       = "chkSuppl";
var dicOutputFormat     = "optOutput";
var dicSortOrder        = "optSortOrder";
var dicLinkLevels       = "txtLinkLevels";
var dicGraphic          = "chkGraphic";
var dicShowGraphicSettings  = "butShowGraphicSettings";

var txtModelTypes = new Array();
var dicModelTypes = new Array();

/**
 *  function showOutputOptionsDialog
 *  shows output options dialog with specified initial settings
 *  @param outfile output file
 *  @param holder_nOptOutputFormat receives output format setting
 *  @param holder_nOptSortOrder receives sort order settings
 *  @param holder_nLinkLevels receives link levels settings
 *  @param holder_aModelTypes receives model types settings
 *  @param holder_bGraphic receives graphic settings
 *  @return dialog return value
 */
function showOutputOptionsDialog(outfile, holder_nOptOutputFormat, holder_bSupplement, holder_nOptSortOrder, 
                              holder_nLinkLevels, holder_aModelTypes, holder_bGraphic)
{
  var ofilter = ArisData.getActiveDatabase().ActiveFilter();

  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 610, 180 + (g_nmodeltypes.length*15) + 35, txtOutputOptionsDialogTitle, "dlgFuncOutputOptions");

  userdialog.GroupBox(7, 0, 590, 65, txtOutputFormat);
  userdialog.OptionGroup(dicOutputFormat);
  userdialog.OptionButton(20, 15, 560, 15, txtOFModelHier);
  userdialog.OptionButton(20, 30, 560, 15, txtOFModelHierISO);
  userdialog.CheckBox(40, 45, 200, 15, txtSupplement, dicSupplement);

  userdialog.GroupBox(7, 68, 590, 82, txtSortOrder);
  userdialog.OptionGroup(dicSortOrder);
  userdialog.OptionButton(20, 83, 570, 15, txtSortSymbolTypes);
  userdialog.OptionButton(20, 98, 570, 15, txtSortAlpha);
  userdialog.OptionButton(20, 113, 570, 15, txtSortTopologically);
  userdialog.OptionButton(20, 128, 570, 15, txtSortNumerically);

  userdialog.GroupBox(7, 153, 590, 45, txtLinkLevels);
  userdialog.Text(20, 170, 140, 15, txtLinkLevels);
  userdialog.TextBox(185, 168, 60, 21, dicLinkLevels);

  userdialog.GroupBox(7, 205, 590, (g_nmodeltypes.length*15)+15, txtModelTypes);

  var y = 210; 
  for(var i =0; i<g_nmodeltypes.length;i++) {
    dicModelTypes[i] = "dicMT_" + g_nmodeltypes[i];
    txtModelTypes[i] = ofilter.ModelTypeName(g_nmodeltypes[i]);
    userdialog.CheckBox(20, y, 380, 15, txtModelTypes[i], dicModelTypes[i]);
    y += 15;
  }
  y += 15;

  userdialog.CheckBox(7, y, 180, 15, txtGraphic, dicGraphic);
  userdialog.PushButton(220, y, 150, 15, txtFormatGraphic, dicShowGraphicSettings);

  y+= 25;

  userdialog.OKButton();
  userdialog.CancelButton();
  userdialog.HelpButton("HID_a8f194f0_eae3_11d8_12e0_9d2843560f51_dlg_01.hlp");

  dlgFuncOutput = Dialogs.createUserDialog(userdialog); 
  
  // Read dialog settings from config  
  var sSection = "SCRIPT_a8f194f0_eae3_11d8_12e0_9d2843560f51";
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicOutputFormat, holder_nOptOutputFormat.value);
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicSortOrder,    holder_nOptSortOrder.value);
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicSupplement,   holder_bSupplement.value?1:0);
  ReadSettingsDlgText(dlgFuncOutput, sSection, dicLinkLevels,    ""+holder_nLinkLevels.value);

  for(var i=0;i<dicModelTypes.length;i++) {
      ReadSettingsDlgValue(dlgFuncOutput, sSection, dicModelTypes[i], 0);
  }
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicGraphic, holder_bGraphic.value?1:0);

  dlgFuncOutput.setDlgEnable(dicSupplement, dlgFuncOutput.getDlgValue(dicOutputFormat) != 0);
  dlgFuncOutput.setDlgEnable(dicShowGraphicSettings, dlgFuncOutput.getDlgValue(dicGraphic) != 0);

  for(;;)
  {
    bShowGraphicSettingsDialog = false;
    nuserdialog = Dialogs.show( __currentDialog = dlgFuncOutput);
    // Displays dialog and waits for the confirmation with OK.
    if (nuserdialog == 0) {
      return nuserdialog;
    }
    if(bShowGraphicSettingsDialog) {
      showGraphicSettingsDialog(outfile);
      bShowGraphicSettingsDialog = false;
      continue;
    }
    else {
      if ((isNumeric(dlgFuncOutput.getDlgText(dicLinkLevels)) == true)) {
        var depth = parseInt(dlgFuncOutput.getDlgText(dicLinkLevels));
        if (depth > 0) {
          holder_nLinkLevels.value = depth;
          break; 
          
        } else { 
          Dialogs.MsgBox(txtNumberToSmall, Constants.MSGBOX_BTN_OK, "ARIS Report");
        }
      } else {
        Dialogs.MsgBox(txtPleaseNumber, Constants.MSGBOX_BTN_OK, "ARIS Report");
      }
    }
  }

  // Write dialog settings to config
  if (nuserdialog != 0) {  
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicOutputFormat);
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicSortOrder);
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicSupplement);
      WriteSettingsDlgText(dlgFuncOutput, sSection, dicLinkLevels);    
      
      for(var i=0;i<dicModelTypes.length;i++) {
          WriteSettingsDlgValue(dlgFuncOutput, sSection, dicModelTypes[i]);
      }
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicGraphic);      
  }
  
  // set flag for output format
  holder_nOptOutputFormat.value = dlgFuncOutput.getDlgValue(dicOutputFormat);
  holder_nOptSortOrder.value    = dlgFuncOutput.getDlgValue(dicSortOrder);
  holder_bSupplement.value      = dlgFuncOutput.getDlgValue(dicSupplement)!=0;
  
  holder_aModelTypes.value      = new Array();
  for(var i=0;i<dicModelTypes.length;i++) {
    if(dlgFuncOutput.getDlgValue(dicModelTypes[i])!=0) {
      holder_aModelTypes.value[holder_aModelTypes.value.length] = i;
    }
  }


  holder_bGraphic.value         = dlgFuncOutput.getDlgValue(dicGraphic)!=0;
    
  return nuserdialog;  
}


function showConnectOptionsDialog(outfile, holder_nOptSortOrder, holder_nLinkLevels)
{
  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 610, 100, txtOutputOptionsDialogTitle);

  userdialog.GroupBox(7, 5, 590, 65, txtSortOrder);
  userdialog.OptionGroup(dicSortOrder);
  userdialog.OptionButton(20, 15, 570, 15, txtSortSymbolTypes);
  userdialog.OptionButton(20, 30, 570, 15, txtSortAlpha);
  userdialog.OptionButton(20, 45, 570, 15, txtSortTopologically);

  userdialog.GroupBox(7, 75, 590, 45, txtLinkLevels);
  userdialog.Text(20, 87, 140, 15, txtLinkLevels);
  userdialog.TextBox(185, 85, 60, 21, dicLinkLevels);

  userdialog.OKButton();
  userdialog.CancelButton();
  //userdialog.HelpButton("HID_a8f194f0_eae3_11d8_12e0_9d2843560f51_dlg_02.hlp");

  dlgFuncOutput = Dialogs.createUserDialog(userdialog); 
  dlgFuncOutput.setDlgValue(dicSortOrder, holder_nOptSortOrder.value);
  dlgFuncOutput.setDlgText(dicLinkLevels, ""+holder_nLinkLevels.value);

  for(;;) {
      nuserdialog = Dialogs.show( __currentDialog = dlgFuncOutput);
      // Displays dialog and waits for the confirmation with OK.
      if (nuserdialog == 0) return nuserdialog;
      
      if (isNumeric(dlgFuncOutput.getDlgText(dicLinkLevels)) == true) {
          var depth = parseInt(dlgFuncOutput.getDlgText(dicLinkLevels));
          if (depth > 0) {
              holder_nLinkLevels.value = depth;
              break; 
          } else { Dialogs.MsgBox(txtNumberToSmall, Constants.MSGBOX_BTN_OK, "ARIS Report") }
      } else {     Dialogs.MsgBox(txtPleaseNumber, Constants.MSGBOX_BTN_OK, "ARIS Report") }
  }

  holder_nOptSortOrder.value    = dlgFuncOutput.getDlgValue(dicSortOrder); 
  return nuserdialog;  
}

/**
 *  show graphic settings dialog, depending on bremote flag
 *
 */
function showGraphicSettingsDialog(outfile)
{
  var bcheckuserdialog = new __holder(true);
  if (bremote) { // WebDesigner
    graphicdialogs_default(outfile, bcheckuserdialog);
  }
  else { // WindowsClient
    graphicdialogs(outfile, bcheckuserdialog);
  }
}

function getModelSelection() {
    // Models selected
    var oSelModels = ArisData.getSelectedModels();
    if (oSelModels.length > 0) return oSelModels;

    // Groups selected    
    var aModelTypes = Context.getDefinedItemTypes(Constants.CID_MODEL);
    oSelModels = new Array();
    var oSelGroups = ArisData.getSelectedGroups();
    for (var i = 0; i < oSelGroups.length; i++) {
        oSelModels = oSelModels.concat(filterModels(oSelGroups[i], aModelTypes));
    }
    return oSelModels;
    
    function filterModels(oGroup, aTypeNums) {
        if (aTypeNums.length == 0 || (aTypeNums.length == 1 && aTypeNums[0] == -1)) {
            // All/None type nums selected
            return oGroup.ModelList();
        }
        return oGroup.ModelList(false/* bRecursive*/, aTypeNums);
    }
}

function outEmptyResult() {
    setReportHeaderFooter(g_ooutfile.value, g_nloc, true, true, true);
    g_ooutfile.value.OutputLn(txtNoModelsSelected, getString("TEXT48"), 10, Constants.C_RED, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_ooutfile.value.WriteReport();
}

function isDialogSupported() {
    // Dialog support depends on script runtime environment (STD resp. BP, TC)
    var env = Context.getEnvironment();
    if (env.equals(Constants.ENVIRONMENT_STD)) return true;
    if (env.equals(Constants.ENVIRONMENT_TC)) return SHOW_DIALOGS_IN_CONNECT;
    return false;
}

function isNumeric(val) {
    if (val == null) return false;
    var str = ""+val;
    if(str.length == 0) return false;
    return ! isNaN(str);    
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











