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

var txtObjects                  = getString("TEXT8");
var txtObjAllOrg                = getString("TEXT9");
var txtObjOnlyExecuting         = getString("TEXT10");
var txtObjData                  = getString("TEXT11");
var txtObjApplSys               = getString("TEXT12");

var txtModels                   = getString("TEXT13");
var txtAttributes               = getString("TEXT14");
var txtModelGraphic             = getString("TEXT15");
var txtFormatGraphic            = getString("TEXT16");
var txtLinkedModels             = getString("TEXT17");

// message box text constants
var txtAtLeastOneNotProcModel   = getString("TEXT18");
var txtNoTypes                  = getString("TEXT19");
var txtNoModelsSelected         = getString("TEXT20");

// output text constants
var txtObjectName       = getString("TEXT21");
var txtObjectType       = getString("TEXT22");
var txtRelationType     = getString("TEXT23");
var txtModelAttributes  = getString("TEXT24");

// dialog item code constants
var dicOutputFormat         = "optOutputFormat";
var dicDirection            = "optDirection";
var dicObjects              = "optObjects";
var dicAttributes           = "chkAttr";
var dicModelGraphic         = "chkModelGraphic";
var dicShowGraphicSettings  = "butShowGraphicSettings";
var dicLinkedModels         = "chkLinkedModels";


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
  outfile.DefineF("REPORT1", getString("TEXT25"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
  outfile.DefineF("REPORT2", getString("TEXT25"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  outfile.DefineF("REPORT3", getString("TEXT25"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

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
      var sSection = "SCRIPT_129ec030-eadf-11d8-12e0-9d2843560f51";
      nDefaultOptOutputFormat = Context.getProfileInt(sSection, dicOutputFormat, 0);
      bLockOptFormat = false;
      bGraphic = (Context.getProfileInt(sSection, dicModelGraphic, 0) == 1);
      bDisableFormatGraphicButton = false;
    }

    var holder_nOptOutputFormat = new __holder(nDefaultOptOutputFormat);
    var holder_nOptDirection    = new __holder(0);
    var holder_nOptObjects      = new __holder(0);
    var holder_bAttr            = new __holder(false);
    var holder_bGraphic         = new __holder(bGraphic);
    var holder_bLinkedModels    = new __holder(false);

    var nuserdialog = showOutputOptionsDialog(outfile, bLockOptFormat, bDisableFormatGraphicButton, 
                                            holder_nOptOutputFormat, holder_nOptDirection, holder_nOptObjects, 
                                            holder_bAttr, holder_bGraphic, holder_bLinkedModels);

    var nOptOutputFormat    = holder_nOptOutputFormat.value;
    var nOptDirection       = holder_nOptDirection.value;
    var nOptObjects         = holder_nOptObjects.value;
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
          outfile.TableCell(((ocurrentmodel.Type() + ": ") + ocurrentmodel.Name(nloc)), 100, getString("TEXT25"), 10, Constants.C_WHITE, getTableCellColor_Head(), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        
          if(bAttributes) {
            var oattributes = ocurrentmodel.AttrList(nloc);
            if (oattributes.length > 0) {
              var bAttrColored = true;   // variable to change background color of table rows (attributes)                
                
              for (var j = 0; j < oattributes.length; j++) {
                var ocurrentattribute = oattributes[j];
                if(!(ocurrentattribute.TypeNum() == Constants.AT_NAME || ocurrentattribute.TypeNum() == Constants.AT_TYPE_1 || ocurrentattribute.TypeNum() == Constants.AT_TYPE_6 || inCaseRange(ocurrentattribute.TypeNum(), Constants.AT_TYP1, Constants.AT_TYP7))) {
                  outfile.TableRow();
                  outfile.TableCell(ocurrentattribute.Type(), 40, getString("TEXT25"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                  outfile.TableCell(ocurrentattribute.GetValue(true), 60, getString("TEXT25"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bAttrColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                
                  bAttrColored = !bAttrColored; // Change background color (attributes)
                }
              }
            }
          }
        
          var lines = getObjectInfo(ocurrentmodel, nOptDirection, nOptObjects, bAttributes, bLinkedModels, nloc);
    
          if (lines.length > 0) {
            var colHeadings = new Array(txtObjectName, txtObjectType, txtRelationType, txtObjectName, txtObjectType);
            var colWidths   = new Array(20,20,20,20,20);
            writeTableHeaderWithColorWidths(outfile, colHeadings, 10, getTableCellColor_Bk(true), Constants.C_WHITE, colWidths);
            var bColored = false;   // variable to change background color of table rows
            
            for ( var j = 0 ; j < lines.length; j++ ) {
              outfile.TableRow();
              var line = lines[j];
              for(var k = 0; k <line.length;k++) {
                var nf = (k==0) ? (Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_BOLD) : (Constants.FMT_LEFT | Constants.FMT_VTOP);
                outfile.TableCell(line[k], 20, getString("TEXT25"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, nf, 0);
              }
              bColored = !bColored; // Change background color
            }
          } 
          outfile.EndTable("", 100, getString("TEXT25"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
          // Graphic
          if (bGraphic) {
            outfile.OutputLn("", getString("TEXT25"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            graphicout(new __holder(outfile), ocurrentmodel);
            outfile.OutputLn("", getString("TEXT25"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
          }
        }


        else if(nOptOutputFormat==1) {  // output format text
          outfile.OutputLn(((ocurrentmodel.Type() + ": ") + ocurrentmodel.Name(nloc)), getString("TEXT25"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
        
          var nIndentModelAttrObjects = 15;  // Indentation for model attributes and objects
          var nIndentRelations        = 30;  // Indentation for relations
          var nIndentOtherObject      = 45;  // indentation for target object of relations

          var lastObjName = "";

          if(bAttributes) {
            var oattributes = ocurrentmodel.AttrList(nloc);
            if (oattributes.length > 0) {
              outfile.OutputLn(txtModelAttributes, getString("TEXT25"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, nIndentModelAttrObjects);
              for (var j = 0; j < oattributes.length; j++) {
                var ocurrentattribute = oattributes[j];
                if(!(ocurrentattribute.TypeNum() == Constants.AT_NAME || ocurrentattribute.TypeNum() == Constants.AT_TYPE_1 || ocurrentattribute.TypeNum() == Constants.AT_TYPE_6 || inCaseRange(ocurrentattribute.TypeNum(), Constants.AT_TYP1, Constants.AT_TYP7))) {
                  outfile.OutputLn(ocurrentattribute.Type()+ ": " + ocurrentattribute.GetValue(true), getString("TEXT25"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, nIndentModelAttrObjects);
                }
              }
            }
          }
          // Graphic
          if (bGraphic) {
            graphicout(new __holder(outfile), ocurrentmodel);
          }
    
          var lines = getObjectInfo(ocurrentmodel, nOptDirection, nOptObjects, bAttributes, bLinkedModels, nloc);
    
          if (lines.length > 0) {
            for ( var j = 0 ; j < lines.length; j++ ) {
              var line = lines[j];
              if(lastObjName!=line[0]) {
                outfile.OutputLn(line[1]+ ": " + line[0], getString("TEXT25"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, nIndentModelAttrObjects);
                lastObjName = line[0];
              }
              outfile.OutputLn(line[2], getString("TEXT25"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, nIndentRelations);
              outfile.OutputLn(line[4]+ ": " + line[3], getString("TEXT25"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, nIndentOtherObject);
            }
          } 
        }
      }
    }
    outfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
  }
  else {
    Dialogs.MsgBox(txtNoModelsSelected, Constants.MSGBOX_BTN_OK, getString("TEXT26"));
    Context.setScriptError(Constants.ERR_NOFILECREATED);    
  }
}


// MJ: HILFSFUNKTION FUER ERMITTLUNG KANTENDEFINITION
function getCxnDef(ocxn)
{
  var osrcocc   = ocxn.SourceObjOcc();
  var osrcdef   = osrcocc.ObjDef();
  var otrgocc   = ocxn.TargetObjOcc();
  var otrgdef   = otrgocc.ObjDef();

  var ocxnlist  = osrcdef.CxnList(new Array(osrcocc.Model()));
 
  for(var i=0;i<ocxnlist.length;i++) {
    var ocxndef = ocxnlist[i];
    var srcguid = ocxndef.SourceObjDef().GUID();
    var trgguid = ocxndef.TargetObjDef().GUID();
    if(srcguid == osrcdef.GUID() &&  trgguid == otrgdef.GUID()) {
      return ocxndef;
    }
  }

  return null;  
}

// outfile.TableCell(txtNoTypes, 60, getString("TEXT25"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);


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


function getLineData(ocxn, oobjocc, sobjname, sobjtype, scxnname, sothername, sothertype, nOptDirection, nloc)
{
  var srcobjocc;
  var trgobjocc;

  if(nOptDirection==0) {
    srcobjocc = ocxn.SourceObjOcc();
    trgobjocc = ocxn.TargetObjOcc();
  } else if(nOptDirection==1) {
    srcobjocc = ocxn.TargetObjOcc();
    trgobjocc = ocxn.SourceObjOcc();
  } else { return false; }

  if(oobjocc.IsEqual(srcobjocc)) {
    if(nOptDirection==0) {
      sobjname.value   = srcobjocc.ObjDef().Name(nloc);
      sobjtype.value   = srcobjocc.ObjDef().Type();
      sothername.value = trgobjocc.ObjDef().Name(nloc);
      sothertype.value = trgobjocc.ObjDef().Type();
      scxnname.value   = ocxn.CxnDef().ActiveType();
    } else if(nOptDirection==1) {
      sobjname.value   = trgobjocc.ObjDef().Name(nloc);
      sobjtype.value   = trgobjocc.ObjDef().Type();
      sothername.value = srcobjocc.ObjDef().Name(nloc);
      sothertype.value = srcobjocc.ObjDef().Type();
      scxnname.value   = ocxn.CxnDef().ActiveType();
    } else { return false; }
  } else {
    if(nOptDirection==0) {
      sobjname.value   = trgobjocc.ObjDef().Name(nloc);
      sobjtype.value   = trgobjocc.ObjDef().Type();
      sothername.value = srcobjocc.ObjDef().Name(nloc);
      sothertype.value = srcobjocc.ObjDef().Type();
      scxnname.value   = ocxn.CxnDef().PassiveType();
    } else if(nOptDirection==1) {
      sobjname.value   = srcobjocc.ObjDef().Name(nloc);
      sobjtype.value   = srcobjocc.ObjDef().Type();
      sothername.value = trgobjocc.ObjDef().Name(nloc);
      sothertype.value = trgobjocc.ObjDef().Type();
      scxnname.value   = ocxn.CxnDef().PassiveType();
    } else { return false; }
  }
}

function getObjectInfo(ocurrentmodel, nOptDirection, nOptObjects, bAttributes, bLinkedModels, nloc)
{
  var lines = new Array();

  var sobjname   = new __holder("");
  var sobjtype   = new __holder("");
  var scxnname   = new __holder("");
  var sothername = new __holder("");
  var sothertype = new __holder("");

  var oobjoccs = ocurrentmodel.ObjOccListFilter(Constants.OT_FUNC);
  // Objects are sorted on the basis of their names.
  oobjoccs = ArisData.sort(oobjoccs, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, nloc);

  if (oobjoccs.length > 0) {
    for (var i = 0 ; i < oobjoccs.length; i++) {
      var oobjocc = oobjoccs[i];
      var ocxns   = oobjocc.CxnOccList();
      ocxns = ArisData.sort(ocxns, Constants.SORT_TYPE, Constants.SORT_NONE, Constants.SORT_NONE, nloc);
      for(var j=0; j< ocxns.length; j++) {
        var ocxn = ocxns[j];
        if(isValidConnectionFromFunction(ocxn, oobjocc, nOptObjects)) {
          getLineData(ocxn, oobjocc, sobjname, sobjtype, scxnname, sothername, sothertype, nOptDirection, nloc);
          lines[lines.length] = new Array(sobjname.value, sobjtype.value, scxnname.value, sothername.value, sothertype.value);
        }
      }
      if (bLinkedModels) {
          // Anubis 520908
          var oOccsInAssignedModel = getOccsInAssignedModel(oobjocc.ObjDef());
          for (var m = 0 ; m < oOccsInAssignedModel.length; m++) {
              var oAssObjOcc = oOccsInAssignedModel[m];
              var oAssCxns   = oAssObjOcc.CxnOccList();
              oAssCxns = ArisData.sort(oAssCxns, Constants.SORT_TYPE, Constants.SORT_NONE, Constants.SORT_NONE, nloc);
              for(var n = 0; n < oAssCxns.length; n++) {
                  var oAssCxn = oAssCxns[n];
                  if(isValidConnectionFromFunction(oAssCxn, oAssObjOcc, nOptObjects)) {
                      getLineData(oAssCxn, oAssObjOcc, sobjname, sobjtype, scxnname, sothername, sothertype, nOptDirection, nloc);
                      lines[lines.length] = new Array(sobjname.value, sobjtype.value, scxnname.value, sothername.value, sothertype.value);
                  }
              }
          }
      }
    }
  }

  if(nOptDirection==1) {
    lines = sortLinesByObjectName(lines);
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

function sortLinesByObjectName(lines)
{
  var result = new Array();

  for(var i =0; i<lines.length;i++) {
    addLineInSortedArray(result, lines[i]);
  }

  return result;
}


function addLineInSortedArray(result, line)
{
  var insertIdx = 0;
  var i=0;
  for(;i<result.length;i++) {
    if(line[0]<result[i][0]) {
      insertIdx = i;
      break;
    }
  }
  if(insertIdx<result.length) {
    var tmp = new Array();
    var j = 0;
    for(i=insertIdx;i<result.length;i++) {
      tmp[j++]     = result[i];
    }
    result[insertIdx] = line;
    for(i=0;i<tmp.length;i++) {
      result[insertIdx+1+i] = tmp[i];
    }
  } else {
    result[result.length] = line;
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
      if(dlgItem==dicModelGraphic) {
        var bEnable = dlgFuncOutput.getDlgValue(dicModelGraphic)!=0;
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

/**
 *  function showOutputOptionsDialog
 *  shows output options dialog with specified initial settings
 *  @param outfile output file
 *  @param bLockOptFormat flag, true locks output format option 
 *  @param bDisableGraphic flag, true disables graphic setting and button 
 *  @param holder_nOptOrgElements receives org elements setting
 *  @param holder_nOptDirection receives direction settings
 *  @param holder_nOptObjects receives objects settings
 *  @param holder_bAttr receives attributes setting
 *  @param holder_bGraphic receives graphic setting
 *  @param holder_bLinkedModels receives linked models settings
 *  @return dialog return value
 */
function showOutputOptionsDialog(outfile, bLockOptFormat, bDisableFormatGraphicButton, 
                              holder_nOptOutputFormat, holder_nOptDirection, holder_nOptObjects, 
                              holder_bAttr, holder_bGraphic, holder_bLinkedModels)
{
  // Output format
  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 370, 265, txtOutputOptionsDialogTitle, "dlgFuncOutputOptions");

  userdialog.GroupBox(7, 0, 400, 55, txtOutputFormat);
  userdialog.OptionGroup(dicOutputFormat);
  userdialog.OptionButton(20, 15, 350, 15, txtOFTable);
  userdialog.OptionButton(20, 30, 350, 15, txtOFText);

  userdialog.GroupBox(7, 60, 400, 55, txtDirection);
  userdialog.OptionGroup(dicDirection);
  userdialog.OptionButton(20, 75, 350, 15, txtDirFuncToObj);
  userdialog.OptionButton(20, 90, 350, 15, txtDirObjToFunc);

  userdialog.GroupBox(7, 120, 400, 85, txtObjects);
  userdialog.OptionGroup(dicObjects);
  userdialog.OptionButton(20, 135, 350, 15, txtObjAllOrg);
  userdialog.OptionButton(20, 150, 350, 15, txtObjOnlyExecuting);
  userdialog.OptionButton(20, 165, 350, 15, txtObjData);
  userdialog.OptionButton(20, 180, 350, 15, txtObjApplSys);

  userdialog.GroupBox(7, 210, 400, 55, txtModels);
  userdialog.CheckBox(20, 225, 180, 15, txtAttributes, dicAttributes);
  userdialog.CheckBox(20, 240, 200, 15, txtModelGraphic, dicModelGraphic);
  userdialog.PushButton(220, 240, 170, 15, txtFormatGraphic, dicShowGraphicSettings);

  userdialog.CheckBox(7, 270, 240, 15, txtLinkedModels, dicLinkedModels);

  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_129ec030-eadf-11d8-12e0-9d2843560f51_dlg_01.hlp");
  
  dlgFuncOutput = Dialogs.createUserDialog(userdialog); 

  // Read dialog settings from config 
  var sSection = "SCRIPT_129ec030-eadf-11d8-12e0-9d2843560f51";
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicDirection, holder_nOptDirection.value);
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicObjects, holder_nOptObjects.value);
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicAttributes, holder_bAttr.value?1:0);
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicLinkedModels, holder_bLinkedModels.value?1:0);

  dlgFuncOutput.setDlgValue(dicOutputFormat, holder_nOptOutputFormat.value);
  dlgFuncOutput.setDlgEnable(dicOutputFormat, !bLockOptFormat);
  dlgFuncOutput.setDlgValue(dicModelGraphic, holder_bGraphic.value?1:0);
  dlgFuncOutput.setDlgEnable(dicModelGraphic, !bDisableFormatGraphicButton);
  dlgFuncOutput.setDlgEnable(dicShowGraphicSettings, !bDisableFormatGraphicButton && holder_bGraphic.value);

  var nuserdialog = 0;  
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
    else break;
  }
  
  // Write dialog settings to config    
  if (nuserdialog != 0) {  
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicDirection);
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicObjects);
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicAttributes);
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicLinkedModels);
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicOutputFormat);
      WriteSettingsDlgValue(dlgFuncOutput, sSection, dicModelGraphic);
  }
  
  // set flag for output format
  holder_nOptOutputFormat.value = dlgFuncOutput.getDlgValue(dicOutputFormat);
  holder_nOptDirection.value    = dlgFuncOutput.getDlgValue(dicDirection);
  holder_nOptObjects.value      = dlgFuncOutput.getDlgValue(dicObjects);
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





















