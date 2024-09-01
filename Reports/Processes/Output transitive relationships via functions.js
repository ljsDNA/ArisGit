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
 
// text constants
// dialog text constants
var txtOutputOptionsDialogTitle = getString("TEXT1");
var txtOutputFormat             = getString("TEXT2");
var txtOFTable                  = getString("TEXT3");
var txtOFText                   = getString("TEXT4");

var txtDirection                = getString("TEXT5");
var txtDirFuncToObj             = getString("TEXT6");
var txtDirObjToFunc             = getString("TEXT7");

var txtSrcObjects               = getString("TEXT8");
var txtTrgObjects               = getString("TEXT9");
var txtObjAllOrg                = getString("TEXT10");
var txtObjOnlyExecuting         = getString("TEXT11");
var txtObjData                  = getString("TEXT12");
var txtObjApplSys               = getString("TEXT13");

var txtModels                   = getString("TEXT14");
var txtAttributes               = getString("TEXT15");
var txtModelGraphic             = getString("TEXT16");
var txtFormatGraphic            = getString("TEXT17");
var txtLinkedModels             = getString("TEXT18");

// message box text constants
var txtAtLeastOneNotProcModel   = getString("TEXT19");
var txtNoTypes                  = getString("TEXT20");
var txtNoModelsSelected         = getString("TEXT21");
var txtSameObjectsSelected      = getString("TEXT22");

// output text constants
var txtObjectName       = getString("TEXT23");
var txtObjectType       = getString("TEXT24");
var txtRelationType     = getString("TEXT25");
var txtModelAttributes  = getString("TEXT26");
var txtFunction         = getString("TEXT27");

// dialog item code constants
var dicOutputFormat         = "optOutputFormat";
var dicSrcObjects           = "optSrcObjects";
var dicTrgObjects           = "optTrgObjects";
var dicAttributes           = "chkAttr";
var dicModelGraphic         = "chkModelGraphic";
var dicShowGraphicSettings  = "butShowGraphicSettings";
var dicLinkedModels         = "chkLinkedModels";
var dicSrcObjAllOrg         = "optSrcObjAllOrg";
var dicSrcObjOnlyExecuting  = "optSrcObjOnlyExecuting";
var dicSrcObjData           = "optSrcObjData";
var dicSrcObjApplSys        = "optSrcObjApplSys";
var dicTrgObjAllOrg         = "optTrgObjAllOrg";
var dicTrgObjOnlyExecuting  = "optTrgObjOnlyExecuting";
var dicTrgObjData           = "optTrgObjData";
var dicTrgObjApplSys        = "optTrgObjApplSys";


function isValidModelType(typeNum)
{
  switch(typeNum) {
    // Model types.
    case Constants.MT_EEPC:
    case Constants.MT_EEPC_MAT:
    case Constants.MT_OFFICE_PROC:
    case Constants.MT_IND_PROC:
    case Constants.MT_PRCS_CHN_DGM:
    case Constants.MT_PCD_MAT:
    case Constants.MT_UML_ACTIVITY_DGM:
    case Constants.MT_EEPC_COLUMN:
    case Constants.MT_EEPC_ROW:
    case Constants.MT_EEPC_TAB:
    case Constants.MT_EEPC_TAB_HORIZONTAL:
    case Constants.MT_VAL_ADD_CHN_DGM:
    case Constants.MT_ENTERPRISE_BPMN_COLLABORATION:    // BLUE-10581        
    case Constants.MT_ENTERPRISE_BPMN_PROCESS:          // BLUE-10581                  
      return true;

    default:
      return false;        
  }
}

function main()
{
  var nloc = Context.getSelectedLanguage();

  var outfile = Context.createOutputObject();
  outfile.DefineF("REPORT1", getString("TEXT28"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
  outfile.DefineF("REPORT2", getString("TEXT28"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  outfile.DefineF("REPORT3", getString("TEXT28"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

  var omodels = ArisData.getSelectedModels();
  omodels = ArisData.sort(omodels, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, nloc);

  if (omodels.length > 0) {
    var nDefaultOptOutputFormat;
    var bLockOptFormat;
    var bDisableFormatGraphicButton;
    var bGraphic;
    
    if(Context.getSelectedFormat()==Constants.OUTTEXT) {
        nDefaultOptOutputFormat = 1;
        bLockOptFormat = true;
        bGraphic = false;
        bDisableFormatGraphicButton = true;
    } else if( Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX ) {
        nDefaultOptOutputFormat = 0;
        bLockOptFormat = true;
        bGraphic = false;
        bDisableFormatGraphicButton = true;
	} else {
        var sSection = "SCRIPT_7c778090_eae0_11d8_12e0_9d2843560f51";
        nDefaultOptOutputFormat = Context.getProfileInt(sSection, dicOutputFormat, 0);
        bLockOptFormat = false;
        bGraphic = (Context.getProfileInt(sSection, dicModelGraphic, 0) == 1);
        bDisableFormatGraphicButton = false;
    }

    var holder_nOptOutputFormat = new __holder(nDefaultOptOutputFormat);
    var holder_nOptSrcObjects   = new __holder(0);
    var holder_nOptTrgObjects   = new __holder(0);
    var holder_bAttr            = new __holder(false);
    var holder_bGraphic         = new __holder(bGraphic);
    var holder_bLinkedModels    = new __holder(false);

    var nuserdialog = showOutputOptionsDialog(outfile, bLockOptFormat, bDisableFormatGraphicButton, 
                                            holder_nOptOutputFormat, holder_nOptSrcObjects, holder_nOptTrgObjects, 
                                            holder_bAttr, holder_bGraphic, holder_bLinkedModels);

    var nOptOutputFormat    = holder_nOptOutputFormat.value;
    var nOptSrcObjects      = holder_nOptSrcObjects.value;
    var nOptTrgObjects      = holder_nOptTrgObjects.value;
    var bAttributes         = holder_bAttr.value;
    var bGraphic            = holder_bGraphic.value;
    var bLinkedModels       = holder_bLinkedModels.value;

    if(nuserdialog==0) {
      Context.setScriptError(Constants.ERR_CANCEL);
      return;
    }

    setReportHeaderFooter(outfile, nloc, true, true, true); // Anubis 541179 - Start output after dialog with possible page settings
    
    var bFirst = true;

    for (var i = 0; i < omodels.length; i++) {
      var ocurrentmodel = omodels[i];

      if(isValidModelType(ocurrentmodel.OrgModelTypeNum())) {       // TANR 216764
        if(bFirst) {
          bFirst = false;
        }
        if(nOptOutputFormat==0) { // output format table
          outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
          outfile.TableRow();
          outfile.TableCell(((ocurrentmodel.Type() + ": ") + ocurrentmodel.Name(nloc)), 100, getString("TEXT28"), 10, Constants.C_WHITE, getTableCellColor_Head(), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        
          if(bAttributes) {
            var oattributes = ocurrentmodel.AttrList(nloc);
            if (oattributes.length > 0) {
              var bAttrColored = true;   // variable to change background color of table rows (attributes)                
                
              for (var j = 0; j < oattributes.length; j++) {
                var ocurrentattribute = oattributes[j];
                if(!(ocurrentattribute.TypeNum() == Constants.AT_NAME || ocurrentattribute.TypeNum() == Constants.AT_TYPE_1 || ocurrentattribute.TypeNum() == Constants.AT_TYPE_6 || inCaseRange(ocurrentattribute.TypeNum(), Constants.AT_TYP1, Constants.AT_TYP7))) {
                  outfile.TableRow();
                  outfile.TableCell(ocurrentattribute.Type(), 40, getString("TEXT28"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                  outfile.TableCell(ocurrentattribute.GetValue(true), 60, getString("TEXT28"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                
                  bAttrColored = !bAttrColored; // Change background color (attributes)
                }
              }
            }
          }
        
          var lines = getObjectInfo(ocurrentmodel, nOptSrcObjects, nOptTrgObjects, bAttributes, bLinkedModels, nloc);
    
          if (lines.length > 0) {
            var colHeadings = new Array(txtObjectName, txtObjectType, txtRelationType, txtFunction, txtRelationType, txtObjectName, txtObjectType);
            var colWidths   = new Array(17,13,13,14,17,13,13);
            //writeTableHeaderWidths(outfile, colHeadings, colWidths, 10);
            writeTableHeaderWithColorWidths(outfile, colHeadings, 10, getTableCellColor_Bk(true), Constants.C_WHITE, colWidths);
            var bColored = false;   // variable to change background color of table rows
            
            for ( var j = 0 ; j < lines.length; j++ ) {
              var line = lines[j];
              var srcLines = line[0];
              var trgLines = line[2];

              var maxCxns = srcLines.length;
              if(maxCxns<trgLines.length) {
                maxCxns = trgLines.length;
              }

              var nf = (Constants.FMT_LEFT | Constants.FMT_VTOP);

              for(var k = 0; k< maxCxns; k++) {
                outfile.TableRow();
                if(k<srcLines.length) {
                  var srcLine = srcLines[k];
                  outfile.TableCell(srcLine[0], 17, getString("TEXT28"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, nf, 0);
                  outfile.TableCell(srcLine[1], 13, getString("TEXT28"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, nf, 0);
                  outfile.TableCell(srcLine[2], 13, getString("TEXT28"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, nf, 0);
                } else {
                  outfile.TableCell("", 17, getString("TEXT28"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, nf, 0);
                  outfile.TableCell("", 13, getString("TEXT28"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, nf, 0);
                  outfile.TableCell("", 13, getString("TEXT28"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, nf, 0);
                }
                outfile.TableCell(line[1], 14, getString("TEXT28"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, nf, 0);
                if(k<trgLines.length) {
                  var trgLine = trgLines[k];
                  outfile.TableCell(trgLine[2], 17, getString("TEXT28"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, nf, 0);
                  outfile.TableCell(trgLine[0], 13, getString("TEXT28"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, nf, 0);
                  outfile.TableCell(trgLine[1], 13, getString("TEXT28"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, nf, 0);
                } else {
                  outfile.TableCell("", 17, getString("TEXT28"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, nf, 0);
                  outfile.TableCell("", 13, getString("TEXT28"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, nf, 0);
                  outfile.TableCell("", 13, getString("TEXT28"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, nf, 0);
                }
                bColored = !bColored; // Change background color                
              }
//              for(var k = 0; k <line.length;k++) {
//                var nf = (k==0) ? (Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_BOLD) : (Constants.FMT_LEFT | Constants.FMT_VTOP);
//                outfile.TableCell(line[k], 20, getString("TEXT28"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, nf, 0);
//              }
            }
          } 
          outfile.EndTable("", 100, getString("TEXT28"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
          // Graphic
          if (bGraphic) {
            outfile.OutputLn("", getString("TEXT28"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            graphicout(new __holder(outfile), ocurrentmodel);
            outfile.OutputLn("", getString("TEXT28"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
          }
        }


        else if(nOptOutputFormat==1) {  // output format text
          outfile.OutputLn(((ocurrentmodel.Type() + ": ") + ocurrentmodel.Name(nloc)), getString("TEXT28"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
        
          var nIndentModelAttrObjects = 15;  // Indentation for model attributes and objects
          var nIndentRelations        = 30;  // Indentation for relations
          var nIndentOtherObject      = 45;  // indentation for target object of relations

          var lastObjName = "";

          if(bAttributes) {
            var oattributes = ocurrentmodel.AttrList(nloc);
            if (oattributes.length > 0) {
              outfile.OutputLn(txtModelAttributes, getString("TEXT28"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, nIndentModelAttrObjects);

              for (var j = 0 ; j < oattributes.length; j++) {
                var ocurrentattribute = oattributes[j];
                if(!(ocurrentattribute.TypeNum() == Constants.AT_NAME || ocurrentattribute.TypeNum() == Constants.AT_TYPE_1 || ocurrentattribute.TypeNum() == Constants.AT_TYPE_6 || inCaseRange(ocurrentattribute.TypeNum(), Constants.AT_TYP1, Constants.AT_TYP7))) {
                  outfile.OutputLn(ocurrentattribute.Type()+ ": " + ocurrentattribute.GetValue(true), getString("TEXT28"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, nIndentModelAttrObjects);
                }
              }
            }
          }
          // Graphic
          if (bGraphic) {
            graphicout(new __holder(outfile), ocurrentmodel);
          }

          var lines = getObjectInfo(ocurrentmodel, nOptSrcObjects, nOptTrgObjects, bAttributes, bLinkedModels, nloc);
    
          if (lines.length > 0) {
            for ( var j = 0 ; j < lines.length; j++ ) {
              var line = lines[j];
              var srcLines = line[0];
              var trgLines = line[2];
              if(lastObjName!=line[1]) {
                outfile.OutputLn(line[1]+ ": ", getString("TEXT28"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, nIndentModelAttrObjects);
                lastObjName = line[1];
              }
              for(var k=0;k<srcLines.length;k++) {
                outfile.OutputLn(srcLines[k][2]+" "+srcLines[k][0]+" ("+srcLines[k][1]+") ", getString("TEXT28"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, nIndentRelations);
              }
              for(var k=0;k<trgLines.length;k++) {
                outfile.OutputLn(trgLines[k][2]+" "+trgLines[k][0]+" ("+trgLines[k][1]+") ", getString("TEXT28"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, nIndentOtherObject);
              }
            }
          } 
        }
      }
    }
    outfile.WriteReport();
  }
  else {
    Dialogs.MsgBox(txtNoModelsSelected, Constants.MSGBOX_BTN_OK, getString("TEXT29"));
    Context.setScriptError(Constants.ERR_NOFILECREATED);    
  }
}



function isValidConnectionFromFunction(ocxn, oobjocc, nOptObjects)
{
  var ocxndef   = ocxn.CxnDef();
  var typeNum   = ocxndef.TypeNum();
  var srcobjocc = ocxn.SourceObjOcc();
  var trgobjocc = ocxn.TargetObjOcc();

  var otherTypeNum;
  if(oobjocc.IsEqual(srcobjocc)) {
    otherTypeNum = trgobjocc.ObjDef().TypeNum();
  } else {
    otherTypeNum = srcobjocc.ObjDef().TypeNum();
  }

  switch(nOptObjects) {
    case 0: // all org elements
    {
      switch(otherTypeNum) {
        case Constants.OT_SYS_ORG_UNIT:
        case Constants.OT_SYS_ORG_UNIT_TYPE:
        case Constants.OT_ORG_UNIT:
        case Constants.OT_ORG_UNIT_TYPE:
        case Constants.OT_PERS:
        case Constants.OT_PERS_TYPE:
        case Constants.OT_POS:
        case Constants.OT_LOC:
        case Constants.OT_GRP:
        return true;
      }
    }
    break;

    case 1: // executing org elements
      switch(typeNum) {
        case 65:
        case 218:
        return true;
      }
    break;

    case 2: // data elements
      switch(typeNum) {
        case Constants.CT_IS_INP_FOR:
        case Constants.CT_PROV_INP_FOR:
        case Constants.CT_HAS_OUT:
        case Constants.CT_CRT_OUT_TO:
        return true;
      }
    break;

    case 3: // application systems
      switch(typeNum) {
        case 147:
        case 221:
        return true;
      }
    break;
  }
  return false;
}


function getLineData(oobjocc, srcCxns, trgCxns, nloc)
{
  var i;
  
  if(srcCxns.length==0 || trgCxns.length==0) {
    return new Array();
  }
  
  var srcData = new Array();
  for(i=0;i<srcCxns.length;i++) {
    var ocxn = srcCxns[i];
    var srcEntry = getObjectNameAndType(ocxn, oobjocc, nloc);
    srcData[srcData.length] = srcEntry;
  }

  var trgData = new Array();
  for(i=0;i<trgCxns.length;i++) {
    var ocxn = trgCxns[i];
    var trgEntry = getObjectNameAndType(ocxn, oobjocc, nloc);
    trgData[trgData.length] = trgEntry;
  }

  var objName = oobjocc.ObjDef().Name(nloc);
  return new Array(srcData, objName, trgData);
}

function getObjectNameAndType(ocxn, oobjocc, nloc)
{
  var result = new Array();

  var srcobjocc = ocxn.SourceObjOcc();
  var trgobjocc = ocxn.TargetObjOcc();

  if(oobjocc.IsEqual(srcobjocc)) {
    result[0] = trgobjocc.ObjDef().Name(nloc);
    result[1] = trgobjocc.ObjDef().Type();
    result[2] = ocxn.CxnDef().ActiveType();
  } else {
    result[0] = srcobjocc.ObjDef().Name(nloc);
    result[1] = srcobjocc.ObjDef().Type();
    result[2] = ocxn.CxnDef().PassiveType();
  }
  return result;
}

function getObjectInfo(ocurrentmodel, nOptSrcObjects, nOptTrgObjects, bAttributes, bLinkedModels, nloc)
{
  var lines = new Array();

  var srcCxns;// = new Array();
  var trgCxns;// = new Array();

  var oobjoccs = ocurrentmodel.ObjOccListFilter(Constants.OT_FUNC);
  // Objects are sorted on the basis of their names.
  oobjoccs = ArisData.sort(oobjoccs, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, nloc);

  if (oobjoccs.length > 0) {
    for (var i = 0; i < oobjoccs.length; i++) {
      srcCxns = new Array();
      trgCxns = new Array();
      
      var oobjocc = oobjoccs[i];
      var ocxns   = oobjocc.CxnOccList();
      ocxns = ArisData.sort(ocxns, Constants.SORT_TYPE, Constants.SORT_NONE, Constants.SORT_NONE, nloc);      
      for(var j = 0; j < ocxns.length; j++) {
        var ocxn = ocxns[j];
        if(isValidConnectionFromFunction(ocxn, oobjocc, nOptSrcObjects)) {
          srcCxns[srcCxns.length] = ocxn;
        }
        if(isValidConnectionFromFunction(ocxn, oobjocc, nOptTrgObjects)) {
          trgCxns[trgCxns.length] = ocxn;
        }
      }
      var lineData = getLineData(oobjocc, srcCxns, trgCxns, nloc);
      if(lineData.length!=0) {
        lines[lines.length] = lineData;
      }

      if (bLinkedModels) {
          // Anubis 520908
          var oOccsInAssignedModel = getOccsInAssignedModel(oobjocc.ObjDef());
          for (var m = 0 ; m < oOccsInAssignedModel.length; m++) {
              var srcAssCxns = new Array();
              var trgAssCxns = new Array();
              
              var oAssObjOcc = oOccsInAssignedModel[m];
              var oAssCxns   = oAssObjOcc.CxnOccList();
              oAssCxns = ArisData.sort(oAssCxns, Constants.SORT_TYPE, Constants.SORT_NONE, Constants.SORT_NONE, nloc);
              for(var n = 0; n < oAssCxns.length; n++) {
                  var oAssCxn = oAssCxns[n];
                  if(isValidConnectionFromFunction(oAssCxn, oAssObjOcc, nOptSrcObjects)) {
                      srcAssCxns[srcAssCxns.length] = oAssCxn;
                  }
                  if(isValidConnectionFromFunction(oAssCxn, oAssObjOcc, nOptTrgObjects)) {
                      trgAssCxns[trgAssCxns.length] = oAssCxn;
                  }
              }
              var lineData = getLineData(oAssObjOcc, srcAssCxns, trgAssCxns, nloc);
              if(lineData.length!=0) {
                  lines[lines.length] = lineData;
              }              
          }
      }
    }
  }

  return lines;
}

function getOccsInAssignedModel(oObjDef) {
    var oOccsInAssignedModel = new Array();
    var oAssignedModels = oObjDef.AssignedModels(Constants.MT_FUNC_ALLOC_DGM);
    for (var i = 0; i < oAssignedModels.length; i++) {
        oOccsInAssignedModel = oOccsInAssignedModel.concat(oObjDef.OccListInModel(oAssignedModels[i]));        
    }
    return oOccsInAssignedModel;
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
        source2target();    
        target2source();
        
        bResult = false;
        break;

    case 2:
        if(dlgItem==dicModelGraphic) {
            var bEnable = dlgFuncOutput.getDlgValue(dicModelGraphic) != 0;
            dlgFuncOutput.setDlgEnable(dicShowGraphicSettings, bEnable);
        } else if(dlgItem==dicShowGraphicSettings) {
            bShowGraphicSettingsDialog = true;
            bResult = false;
        }
        else if(dlgItem==dicSrcObjects) {
            dlgFuncOutput.setDlgEnable(dicTrgObjAllOrg, true);
            dlgFuncOutput.setDlgEnable(dicTrgObjOnlyExecuting, true);
            dlgFuncOutput.setDlgEnable(dicTrgObjData, true);
            dlgFuncOutput.setDlgEnable(dicTrgObjApplSys, true);
            
            source2target();
        }
        else if(dlgItem==dicTrgObjects) {
            dlgFuncOutput.setDlgEnable(dicSrcObjAllOrg, true);
            dlgFuncOutput.setDlgEnable(dicSrcObjOnlyExecuting, true);
            dlgFuncOutput.setDlgEnable(dicSrcObjData, true);
            dlgFuncOutput.setDlgEnable(dicSrcObjApplSys, true);
            
            target2source();
        }
        else if(dlgItem=="OK")
            bResult = false;
        else if(dlgItem=="Cancel")
            bResult = false;
        break;
  }

  return bResult;
}

function source2target() {
   switch (dlgFuncOutput.getDlgValue(dicSrcObjects)) {
        case 0:
        case 1:
            dlgFuncOutput.setDlgEnable(dicTrgObjAllOrg, false);
            dlgFuncOutput.setDlgEnable(dicTrgObjOnlyExecuting, false);
            if (dlgFuncOutput.getDlgValue(dicTrgObjects) <= 1)
                dlgFuncOutput.setDlgValue(dicTrgObjects, 2);
            break;
        case 2:
            dlgFuncOutput.setDlgEnable(dicTrgObjData, false);
            if (dlgFuncOutput.getDlgValue(dicTrgObjects) == 2)
                dlgFuncOutput.setDlgValue(dicTrgObjects, 0);
            break;                
        case 3:
            dlgFuncOutput.setDlgEnable(dicTrgObjApplSys, false);
            if (dlgFuncOutput.getDlgValue(dicTrgObjects) == 3)
                dlgFuncOutput.setDlgValue(dicTrgObjects, 0);
            break;
    }
}

function target2source() {
    switch (dlgFuncOutput.getDlgValue(dicTrgObjects)) {
        case 0:
        case 1:
            dlgFuncOutput.setDlgEnable(dicSrcObjAllOrg, false);
            dlgFuncOutput.setDlgEnable(dicSrcObjOnlyExecuting, false);
            if (dlgFuncOutput.getDlgValue(dicSrcObjects) <= 1)
                dlgFuncOutput.setDlgValue(dicSrcObjects, 2);
            break;
        case 2:
            dlgFuncOutput.setDlgEnable(dicSrcObjData, false);
            if (dlgFuncOutput.getDlgValue(dicSrcObjects) == 2)
                dlgFuncOutput.setDlgValue(dicSrcObjects, 0);
            break;                
        case 3:
            dlgFuncOutput.setDlgEnable(dicSrcObjApplSys, false);
            if (dlgFuncOutput.getDlgValue(dicSrcObjects) == 3)
                dlgFuncOutput.setDlgValue(dicSrcObjects, 0);
            break;
    }
}

/**
 *  function showOutputOptionsDialog
 *  shows output options dialog with specified initial settings
 *  @param outfile output file
 *  @param bLockOptFormat flag, true locks output format option 
 *  @param bDisableGraphic flag, true disables graphic setting and button 
 *  @param holder_nOptOrgElements receives org elements setting
 *  @param holder_nOptSrcObjects receives source objects settings
 *  @param holder_nOptTrgObjects receives target objects settings
 *  @param holder_bAttr receives attributes setting
 *  @param holder_bGraphic receives graphic setting
 *  @param holder_bLinkedModels receives linked models settings
 *  @return dialog return value
 */
function showOutputOptionsDialog(outfile, bLockOptFormat, bDisableFormatGraphicButton, 
                              holder_nOptOutputFormat, holder_nOptSrcObjects, holder_nOptTrgObjects, 
                              holder_bAttr, holder_bGraphic, holder_bLinkedModels)
{
  // Output format
  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 420, 310, txtOutputOptionsDialogTitle, "dlgFuncOutputOptions");

  userdialog.GroupBox(7, 0, 400, 55, txtOutputFormat);
  userdialog.OptionGroup(dicOutputFormat);
  userdialog.OptionButton(20, 15, 380, 15, txtOFTable);
  userdialog.OptionButton(20, 30, 380, 15, txtOFText);

  userdialog.GroupBox(7, 60, 400, 85, txtSrcObjects);
  userdialog.OptionGroup(dicSrcObjects);
  userdialog.OptionButton(20, 75, 380, 15, txtObjAllOrg, dicSrcObjAllOrg);
  userdialog.OptionButton(20, 90, 380, 15, txtObjOnlyExecuting, dicSrcObjOnlyExecuting);
  userdialog.OptionButton(20, 105, 380, 15, txtObjData, dicSrcObjData);
  userdialog.OptionButton(20, 120, 380, 15, txtObjApplSys, dicSrcObjApplSys);

  userdialog.GroupBox(7, 150, 400, 85, txtTrgObjects);
  userdialog.OptionGroup(dicTrgObjects);
  userdialog.OptionButton(20, 165, 380, 15, txtObjAllOrg, dicTrgObjAllOrg);
  userdialog.OptionButton(20, 180, 380, 15, txtObjOnlyExecuting, dicTrgObjOnlyExecuting);
  userdialog.OptionButton(20, 195, 380, 15, txtObjData, dicTrgObjData);
  userdialog.OptionButton(20, 210, 380, 15, txtObjApplSys, dicTrgObjApplSys);

  userdialog.GroupBox(7, 240, 400, 55, txtModels);
  userdialog.CheckBox(20, 255, 180, 15, txtAttributes, dicAttributes);
  userdialog.CheckBox(20, 270, 180, 15, txtModelGraphic, dicModelGraphic);
  userdialog.PushButton(200, 270, 150, 15, txtFormatGraphic, dicShowGraphicSettings);

  userdialog.CheckBox(7, 300, 240, 15, txtLinkedModels, dicLinkedModels);

  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_7c778090_eae0_11d8_12e0_9d2843560f51_dlg_01.hlp");

  dlgFuncOutput = Dialogs.createUserDialog(userdialog); 
  
  // Read dialog settings from config 
  var sSection = "SCRIPT_7c778090_eae0_11d8_12e0_9d2843560f51";
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicSrcObjects, holder_nOptSrcObjects.value);
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicTrgObjects, holder_nOptTrgObjects.value);
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicAttributes, holder_bAttr.value?1:0);
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicLinkedModels, holder_bLinkedModels.value?1:0);

  dlgFuncOutput.setDlgValue(dicOutputFormat, holder_nOptOutputFormat.value);
  dlgFuncOutput.setDlgEnable(dicOutputFormat, !bLockOptFormat);
  dlgFuncOutput.setDlgValue(dicModelGraphic, holder_bGraphic.value?1:0);  
  dlgFuncOutput.setDlgEnable(dicModelGraphic, !bDisableFormatGraphicButton);
  dlgFuncOutput.setDlgEnable(dicShowGraphicSettings, !bDisableFormatGraphicButton && holder_bGraphic.value);

  for(;;)
  {
    bShowGraphicSettingsDialog = false;
    nuserdialog = Dialogs.show( __currentDialog = dlgFuncOutput);
    // Displays dialog and waits for the confirmation with OK.

    if(nuserdialog == -1 && dlgFuncOutput.getDlgValue(dicSrcObjects) == dlgFuncOutput.getDlgValue(dicTrgObjects)) {
      Dialogs.MsgBox(txtSameObjectsSelected, Constants.MSGBOX_BTN_OK, getString("TEXT29"));
    }
    else if (nuserdialog == 0) {
        return nuserdialog;
    }
    else if(bShowGraphicSettingsDialog) {
      showGraphicSettingsDialog(outfile);
      bShowGraphicSettingsDialog = false;
      continue;
    }
    else break;
  }
  
  // Write dialog settings to config    
  if (nuserdialog != 0) {  
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicSrcObjects);
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicTrgObjects);
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicAttributes);
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicLinkedModels);
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicOutputFormat);
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicModelGraphic);
  }

  // set flag for output format
  holder_nOptOutputFormat.value = dlgFuncOutput.getDlgValue(dicOutputFormat);
  holder_nOptSrcObjects.value   = dlgFuncOutput.getDlgValue(dicSrcObjects);
  holder_nOptTrgObjects.value   = dlgFuncOutput.getDlgValue(dicTrgObjects);
  holder_bAttr.value            = dlgFuncOutput.getDlgValue(dicAttributes)!=0;
  holder_bGraphic.value         = dlgFuncOutput.getDlgValue(dicModelGraphic)!=0;
  holder_bLinkedModels.value    = dlgFuncOutput.getDlgValue(dicLinkedModels)!=0;
    
  return nuserdialog;  
}

function showGraphicSettingsDialog(outfile)
{
  var bcheckuserdialog = new __holder(true);
  graphicdialogs(new __holder(outfile), bcheckuserdialog);
}

function inCaseRange(val, lower, upper)
{
  return (val >= lower) && (val <= upper);
}


main();








