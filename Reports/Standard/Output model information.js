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

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

// global variables
var dlgFuncOutput;
var bShowGraphicSettingsDialog;
var g_bRunByService = false;    // Anubis 379731

// Dialog support depends on script runtime environment (STD resp. BP, TC)
var g_bDialogsSupported = isDialogSupported();

// text constants:
// dialog text constants
var txtOutputOptionsDialogTitle = getString("TEXT1");
var txtOFTable                  = getString("TEXT3");
var txtOFText                   = getString("TEXT4");
var txtModels                   = getString("TEXT5");
var txtModelsWithGroups         = getString("TEXT6");
var txtModelsWithAttributes     = getString("TEXT7");
var txtModelsWithGraphic        = getString("TEXT8");
var txtFormatGraphic            = getString("TEXT9");
var txtObjects                  = getString("TEXT10");
var txtObjectsWithModels        = getString("TEXT11");
var txtObjectsWithGroups        = getString("TEXT6");
var txtObjectsWithAttributes    = getString("TEXT12");
var txtObjectsWithConnections   = getString("TEXT13");

// output text constants:
var txtGroup                    = getString("TEXT14");
var txtModelAttributes          = getString("TEXT15");
var txtObjectAttributes         = getString("TEXT16");
var txtGraphic                  = getString("TEXT17");
var txtObjectName               = getString("TEXT18");
var txtObjectType               = getString("TEXT19");
var txtConnectionType           = getString("TEXT20");

var nloc = Context.getSelectedLanguage();            // Variable for determining the ID of the current language.

function main()
{
  var ocurrentmodel = null;   // Current model.
  var omodels = null;   // List of models.
  var ooutfile = new __holder(null);   // Object used for the output of the report.
  var oattributes = null;   // List of attributes.
  var ocurrentattribute = null;   // Current attribute.
  var oobjoccs = null;   // List of object occurrences.
  var ocurrentobjdef = null;   // Current object definition.
  var ocurrentobjocc = null;   // Current object occurrence.
  var ocxndefs = null;   // List of connection definitions. 
  var ocurrentcxn = null;   // Current connection definition.
  var ocurrentuser = null;   // Current user.

  var bheadout = false;   // Variable for outputting the report head when first called.

  var noutcheck = 0;       // Variable which suppresses the graphic output option in the user dialog when the output is executed as txt.
  var sobjname = "";        // String containing the object name.
  var stargobjname = "";    // String containing the target object name.
  var nuserdialog = 0;     // Variable for checking whether the user has selected Cancel in the dialog boxes.

  // Set
  bobjattr = false;
  bobjcxn  = false;
  bheadout = false;

  ooutfile.value = Context.createOutputObject();
  outfile = ooutfile;

  initStyles(ooutfile.value, getString("FONT"));
  if(!isExcel())
	ooutfile.value.DefineF(ooutfile.value.getDefaultFormatName(Constants.FORMATSTYLE_NORMAL), getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1.25);
	

  omodels = getModelSelection();    // BLUE-10824 Context extended to model + group
  if (omodels.length > 0) {
    var holder_bModelGroups     = new __holder(false);
    var holder_bModelAttr       = new __holder(false);
    var holder_bModelGraphic    = new __holder(false);
    var holder_bObjects         = new __holder(false);
    var holder_bObjectGroups    = new __holder(false);
    var holder_bObjectAttr      = new __holder(false);
    var holder_bObjectCxn       = new __holder(false);
    
    if (Context.getProperty("Prop_OutTable") != null) {
        // Anubis 379731 - Called by APG service
        g_bRunByService = true;
        
        holder_bModelGroups.value     = getBoolPropertyValue("Prop_ModelGroups");
        holder_bModelAttr.value       = getBoolPropertyValue("Prop_ModelAttrs");
        holder_bModelGraphic.value    = getBoolPropertyValue("Prop_ModelGraphic");
        holder_bObjects.value         = getBoolPropertyValue("Prop_Objects");
        holder_bObjectGroups.value    = getBoolPropertyValue("Prop_ObjectGroups");
        holder_bObjectAttr.value      = getBoolPropertyValue("Prop_ObjectAttrs");
        holder_bObjectCxn.value       = getBoolPropertyValue("Prop_ObjectCxns");
        
        var bBlackWhite = getBoolPropertyValue("Prop_GraphicBlackWhite");
        var nScaleOption = getIntPropertyValue("Prop_GraphicScaleOption", 2);   // 0: Scaling, 1: 100%, 2: Fit to page, 3: Model print scale
        var nScaleValue = getIntPropertyValue("Prop_GraphicScaleValue", 100);        
        var bCutObjects = getBoolPropertyValue("Prop_GraphicCutObjects");
        
        var nPageWidth = getIntPropertyValue("Prop_PageWidth", parseInt(ooutfile.value.GetPageWidth()));
        var nPageHeight = getIntPropertyValue("Prop_PageHeight", parseInt(ooutfile.value.GetPageHeight()));
        var nMarginLeft = getIntPropertyValue("Prop_MarginLeft", parseInt(ooutfile.value.GetLeftMargin()));
        var nMarginRight = getIntPropertyValue("Prop_MarginRight", parseInt(ooutfile.value.GetRightMargin()));
        var nMarginTop = getIntPropertyValue("Prop_MarginTop", parseInt(ooutfile.value.GetTopMargin()));
        var nMarginBottom = getIntPropertyValue("Prop_MarginBottom", parseInt(ooutfile.value.GetBottomMargin()));        
        
        // Output Graphics values into registry
        outputintoregistry(bBlackWhite, nScaleOption, bCutObjects, nMarginTop, nMarginBottom, nMarginLeft, nMarginRight, nPageWidth, nPageHeight, nScaleValue);

    } else {
        if (g_bDialogsSupported) {    // STD
            var nDialogResult = 1;
            nDialogResult = showOutputOptionsDialog( ooutfile,
                                                     holder_bModelGroups, holder_bModelAttr, holder_bModelGraphic, 
                                                     holder_bObjects, holder_bObjectGroups, holder_bObjectAttr, holder_bObjectCxn);
            // check for cancel
            if(nDialogResult == 0) {
              // Anubis 403962  
              Context.setProperty(Constants.PROPERTY_SHOW_OUTPUT_FILE, false)
              Context.setProperty(Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false)
              Context.setScriptError(Constants.ERR_CANCEL);  
              return;
            }
        } else {    // BP, TC
            //As default before change was made all = __holder(false);
            holder_bModelGroups.value     = true;
            holder_bModelAttr.value       = true;
            holder_bModelGraphic.value    = true;
            holder_bObjects.value         = true;
            holder_bObjectGroups.value    = true;
            holder_bObjectAttr.value      = true;
            holder_bObjectCxn.value       = true;
            
            // Output Graphics values into registry
            var bmodelcolor         = false;
            var nscaleoption        = (Context.getSelectedFormat() == Constants.OUTHTML) ? 0 : 2;    // fit to page, if not HTML (Anubis 332445)
            var bcutofthegraphic    = false;
            // most of the parameters are ignored!
            //outputintoregistry(bmodelcolor, nscaleoption, bcutofthegraphic, 30, 30, 20, 20, 210, 297, 100);
            //Strange but helpful:
            outputintoregistry(bmodelcolor, nscaleoption, bcutofthegraphic, 0, 0, 0, 0, 0, 0, 95);
        }
    }
    var bmodelgroups  = holder_bModelGroups.value;      // Variable whether model groups should be output
    var bmodelattr    = holder_bModelAttr.value;        // Variable whether model attributes should be output
    var bmodelgraphic = holder_bModelGraphic.value;     // Variable whether model graphic should be output
    var bobjects      = holder_bObjects.value;          // Variable whether objects should be output
    var bobjgroups    = holder_bObjectGroups.value;     // Variable whether object groups should be output
    var bobjattr      = holder_bObjectAttr.value;       // Variable whether object attributes should be output.
    var bobjcxn       = holder_bObjectCxn.value;        // Variable whether object relationships should be output
     
    if (!g_bDialogsSupported && Context.getSelectedFormat() == Constants.OUTHTML ){
        bmodelgraphic = false;
    }
    
    var aTitleDetails = [];
    if (omodels.length == 1) {
        aTitleDetails.push([getString("TEXT_2"), getModelName(omodels[0])]);
    }
    outTitlePage(ooutfile.value, getString("FONT"), getString("TEXT_6"), getString("TEXT_7"), aTitleDetails, getString("TITLE_PAGE"));
    
    outHeaderFooter(ooutfile.value, getString("FONT"), getString("FOOTER_RIGHT"));

    if ( isTocAvailable() ) {
        ooutfile.value.SetAutoTOCNumbering(true);
        ooutfile.value.OutputLnF(getString("TEXT_1"),"HEADING1_NOTOC");
        ooutfile.value.BeginParagraphF("Normal")
        ooutfile.value.OutputField(Constants.FIELD_TOC, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_RIGHT);
        ooutfile.value.EndParagraph();
    }
    
    setTableBorders(ooutfile.value);
    
    var bfirst = false;

    omodels = ArisData.sort(omodels, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, nloc);
    var bcheckit = false; 
    for (var i = 0 ; i < omodels.length; i++) {
        bfirst = true;
        ocurrentmodel = omodels[i];
    
        var matrixCxnMap;
        if (bobjcxn == true && isMatrix(ocurrentmodel)) {
            matrixCxnMap = initMatrixCxns(ocurrentmodel);
        }

        if (isExcel()) ooutfile.value.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        // Model heading
        var sModelName = getModelName(ocurrentmodel);
        outHeading(ooutfile.value, sModelName, 1);
        // Properties
        if (isExcel()) outEmptyRow(ooutfile.value);
        outHeading(ooutfile.value, getString("TEXT_3"), 2);
        if (!isExcel()) ooutfile.value.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        // Model type
        outProperty(ooutfile.value, getString("TEXT_4"), ocurrentmodel.Type());
        // Group of the model (optional)
        if (bmodelgroups) {
            outProperty(ooutfile.value, txtGroup, ocurrentmodel.Group().Name(nloc));
        }
        // Attributes of the model
        if(bmodelattr){
            var aoModelAttributes = getAttributesWithoutNameAndType(ocurrentmodel);
            for (var j=0; j<aoModelAttributes.length; j++) {
                outAttribute(ooutfile.value, aoModelAttributes[j]);
            }
        }
        if (!isExcel()) ooutfile.value.EndTable("", 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        // Objects of the model
        if (bobjects) {
            // Objects heading
            if (isExcel()) outEmptyRow(ooutfile.value);
            outHeading(ooutfile.value, getString("TEXT10"), 2);
            var aoObjOccs = getValidObjOccs(ocurrentmodel);
            for (var j=0; j<aoObjOccs.length; j++) {
                var oObjOcc = aoObjOccs[j];
                var oObjDef = oObjOcc.ObjDef();
                // Object heading
                if (isExcel()) outEmptyRow(ooutfile.value);
                outHeading(ooutfile.value, oObjDef.Name(nloc), 3);
                // Object properties
                if (isExcel()) outEmptyRow(ooutfile.value);
                outHeading(ooutfile.value, getString("TEXT_3"), null);
                if (!isExcel()) ooutfile.value.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);   
                // Object type
                outProperty(ooutfile.value, getString("TEXT_4"), oObjDef.Type());
                // Object group
                if(bobjgroups) {
                    outProperty(ooutfile.value, txtGroup, oObjDef.Group().Name(nloc));
                }
                // Attributes of the object
                if (bobjattr == true) {
                    var aoObjAttributes = getAttributesWithoutNameAndType(oObjDef);
                    for (var k=0; k<aoObjAttributes.length; k++) {
                        outAttribute(ooutfile.value, aoObjAttributes[k]);
                    }
                }
                if (!isExcel()) ooutfile.value.EndTable("", 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
                // Relationships of the object
                if (bobjcxn == true) {
                    if (isExcel()) outEmptyRow(ooutfile.value);
                    outHeading(ooutfile.value, getString("TEXT_5"), null);
                    
                    var ocxndefs = getRelationships(oObjOcc, matrixCxnMap);

                    if (!isExcel()) ooutfile.value.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);   
                    // Write new Column headings
                    var colHeadings = new Array(txtConnectionType, txtObjectName, txtObjectType);
                    outTableHead(ooutfile.value, colHeadings);
                    for (var k=0; k<ocxndefs.length; k++) {
                        ocurrentcxn = ocxndefs[k];
                        // Current object = target object.
                        if (oObjDef.IsEqual(ocurrentcxn.TargetObjDef())) {    
                            var txt = new Array(ocurrentcxn.PassiveType(), ocurrentcxn.SourceObjDef().Name(nloc), ocurrentcxn.SourceObjDef().Type());
                        }
                        // Current object = source object.                          
                        else {
                            var txt = new Array(ocurrentcxn.ActiveType(), ocurrentcxn.TargetObjDef().Name(nloc), ocurrentcxn.TargetObjDef().Type());
                        }
                        outTableRow(ooutfile.value, txt);
                    }
                    if (!isExcel()) ooutfile.value.EndTable("", 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
                }
            }
        }
        if (isExcel()) ooutfile.value.EndTable(sModelName, 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            
        // Graphic of the model. (Anubis 335835, 341529)
        if (bmodelgraphic) {
            // Output Header2 for Model
            ooutfile.value.OutputLnF(getString("TEXT17"), "HEADING2");
            graphicout(ooutfile, ocurrentmodel);
        }//--- Graphic of the model.        
        
        ocurrentmodel = null;
        ooutfile.value.OutputLn("", getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 10);
      }
      ooutfile.value.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
  } else {
    // List of models was empty.
    if (g_bDialogsSupported) {
        Dialogs.MsgBox(getString("TEXT22"), Constants.MSGBOX_BTN_OK, getString("TEXT23"));
        Context.setScriptError(Constants.ERR_NOFILECREATED);  
        
    } else {
        outEmptyResult();     // BLUE-10824 Output empty result in Connect
    }
  }

}//---Main

function getModelName(oModel) {
    var modelName = oModel.Name(nloc);
    // BLUE-26788 - consider database version   
    var dbVersion = ArisData.getActiveDatabase().getVersion();
    if (dbVersion != -1) {
        modelName += " [" + dbVersion + "]";
    }
    return modelName;
}

function outHeading(p_oOutfile, p_sHeading, p_nLevel) {
    if (isExcel()) {
        disableTableBorders(p_oOutfile);
        p_oOutfile.TableRow();
        p_oOutfile.TableCellF(p_sHeading, 100, getHeadingStyle(p_nLevel));
        setTableBorders(p_oOutfile);
    } else {
        p_oOutfile.OutputLnF(p_sHeading, getHeadingStyle(p_nLevel));
    }
}

function getHeadingStyle(p_nLevel) {
    if (p_nLevel != null && p_nLevel > 0 && p_nLevel <=4) {
        return "HEADING".concat(p_nLevel);
    } else {
        return "MINISEC";
    }
}

function getValidObjOccs(p_oModel) {
    if (isMatrix(p_oModel)) {
        return getMatrixObjOccs(p_oModel);
    }

    var aoResult = [];
    var aoObjOccs = p_oModel.ObjOccList();
    for (var i=0; i<aoObjOccs.length; i++) {
        var oObjOcc = aoObjOccs[i];
        if (oObjOcc.ObjDef().IsValid()) {
            aoResult.push(oObjOcc);
        }
    }
    aoResult = ArisData.sort(aoResult, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, nloc);
    return aoResult;
}

function getMatrixObjOccs(p_oModel) {
    // BLUE-21554
    var aoResult = [];
    var aoObjDefs = p_oModel.ObjDefList();
    for (var i=0; i<aoObjDefs.length; i++) {
        var oObjDef = aoObjDefs[i];
        var oObjOccs = oObjDef.OccListInModel(p_oModel);
        if (oObjOccs.length > 0) {
            // Ensure that each object is contained only once in result list
            aoResult.push(oObjOccs[0]);
        }
    }
    aoResult = ArisData.sort(aoResult, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, nloc);
    return aoResult;
}

function getRelationships(p_oObjOcc, matrixCxnMap) {
    if (isMatrix(p_oObjOcc.Model())) {
        return getMatrixRelationships(p_oObjOcc.ObjDef(), matrixCxnMap);
    }    
    
    var oCxnDefs = new Array();
    var oCxnOccs = p_oObjOcc.CxnOccList();
    for (var i=0; i<oCxnOccs.length; i++) {
        oCxnDefs.push(oCxnOccs[i].CxnDef())
    }
    return ArisData.sort(oCxnDefs, Constants.AT_TYPE_6, Constants.SORT_NONE, Constants.SORT_NONE, nloc);
}

function getMatrixRelationships(p_oObjDef, matrixCxnMap) {
    // BLUE-21554
    var oCxnDefs = ArisData.createTypedArray(Constants.CID_CXNDEF);

    var cxnSet = matrixCxnMap.get(p_oObjDef);
    if (cxnSet != null) {
        var iter = cxnSet.iterator();
        while (iter.hasNext()) {
            oCxnDefs.push(iter.next());
        }  
    }
    return ArisData.sort(oCxnDefs, Constants.AT_TYPE_6, Constants.SORT_NONE, Constants.SORT_NONE, nloc);        
}

function getAttributesWithoutNameAndType(p_oItem) {
    var aoResult = [];
    var aoAttrList = p_oItem.AttrList(nloc);
    for (var i=0; i<aoAttrList.length; i++) {
        var oAttr = aoAttrList[i];
        // Name and type are not output.
        if (!(oAttr.TypeNum() == Constants.AT_NAME || oAttr.TypeNum() == Constants.AT_TYPE_1 || oAttr.TypeNum() == Constants.AT_TYPE_6 || inCaseRange(oAttr.TypeNum(), Constants.AT_TYP1, Constants.AT_TYP7))) {
            aoResult.push(oAttr);
        }
    }
    aoResult = ArisData.sort(aoResult, Constants.SORT_METHOD, Constants.SORT_NONE, Constants.SORT_NONE, nloc);   // Anubis 265545
    return aoResult;
}

function outEmptyRow(p_oOutfile) {
    disableTableBorders(p_oOutfile);
    p_oOutfile.TableRow();
    p_oOutfile.TableCellF("", 100, "TBL_STD");
    setTableBorders(p_oOutfile);
}

function outProperty(p_oOutfile, p_sPropName, p_sPropValue) {
    p_oOutfile.TableRow();
    p_oOutfile.TableCellF(p_sPropName, 40, "TBL_STD");
    p_oOutfile.TableCellF(p_sPropValue, 60, "TBL_STD");
}

function outAttribute(p_oOutfile, p_oAttr) {
    p_oOutfile.TableRow();
    p_oOutfile.TableCellF(p_oAttr.Type(), 40, "TBL_STD");
    if (shouldBeOutputStyled(p_oAttr)) {
        p_oOutfile.TableCellF("", 60, "TBL_STD");
        p_oOutfile.OutputFormattedText(getFormattedAttrValue(p_oAttr));
    } else {
        p_oOutfile.TableCellF(p_oAttr.GetValue(true), 60, "TBL_STD");
    }
}

function outTableHead(p_oOutfile, p_asHeadings) {
    p_oOutfile.TableRow();
    var colWidth_default = Math.round((100.0 / p_asHeadings.length) - 0.5);
    var colSum = 0;
    var colWidth = 0;
    for(var i = 0; i < p_asHeadings.length; i++) {
        if (i < p_asHeadings.length - 1) {
            colWidth = colWidth_default;
        } else {
            colWidth = 100 - colSum;
        }
        p_oOutfile.TableCellF(p_asHeadings[i], colWidth, "TBL_HEAD");
        colSum = colSum + colWidth;
    }
}

function outTableRow(p_oOutfile, p_asValues) {
    p_oOutfile.TableRow();
    var colWidth_default = Math.round((100.0 / p_asValues.length) - 0.5);
    var colSum = 0;
    var colWidth = 0;
    for(var i = 0; i < p_asValues.length; i++) {
        if (i < p_asValues.length - 1) {
            colWidth = colWidth_default;
        } else {
            colWidth = 100 - colSum;
        }
        p_oOutfile.TableCellF(p_asValues[i], colWidth, "TBL_STD");
        colSum = colSum + colWidth;
    }
}

function outSpace(outfile, bHtmlOnly) {
    // BLUE-12585
    if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) return;
    if (Context.getSelectedFormat() != Constants.OutputHTML && bHtmlOnly) return;
    
    var fontSize = bHtmlOnly ? 0 : 8;
    
    outfile.EndTable("", 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    outfile.OutputLn("", getString("FONT"), fontSize, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 20);
    outfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);          
}


// dialog item code constants
var dicModelGroups          = "chkModel_groups";
var dicModelAttr            = "chkModel_attr";
var dicModelGraphic         = "chkModel_graphic";
var dicShowGraphicSettings  = "butShowGraphicSettings";
var dicObjects              = "chkObjects";
var dicObjectAttr           = "chkObject_attr";
var dicObjectGroups         = "chkObject_groups";
var dicObjectCxn            = "chkObject_cxn";


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
    switch(act) {
        case 1:
            switch(Context.getSelectedFormat()) {
                case Constants.OUTTEXT:
                    __currentDialog.setDlgValue(dicModelGraphic, 0);                    
                    __currentDialog.setDlgEnable(dicModelGraphic, false);
                    __currentDialog.setDlgEnable(dicShowGraphicSettings, false);
                    break;
                case Constants.OutputXLS:
                    __currentDialog.setDlgValue(dicModelGraphic, 0);                    
                    __currentDialog.setDlgEnable(dicModelGraphic, false);
                    __currentDialog.setDlgEnable(dicShowGraphicSettings, false);
                    break;
                case Constants.OutputXLSX:
                    __currentDialog.setDlgValue(dicModelGraphic, 0);                    
                    __currentDialog.setDlgEnable(dicModelGraphic, false);
                    __currentDialog.setDlgEnable(dicShowGraphicSettings, false);
                    break;
                default:
                    __currentDialog.setDlgEnable(dicShowGraphicSettings, __currentDialog.getDlgValue(dicModelGraphic) != 0);
                    break;    
            }
            var bEnable = (__currentDialog.getDlgValue(dicObjects)!=0);
            __currentDialog.setDlgEnable(dicObjectGroups, bEnable);
            __currentDialog.setDlgEnable(dicObjectAttr, bEnable);
            __currentDialog.setDlgEnable(dicObjectCxn, bEnable);
            
            bResult = false;
            break;
            
        case 2:
            if(dlgItem==dicObjects) {
                var bEnable = (__currentDialog.getDlgValue(dicObjects)!=0);
                __currentDialog.setDlgEnable(dicObjectGroups, bEnable);
                __currentDialog.setDlgEnable(dicObjectAttr, bEnable);
                __currentDialog.setDlgEnable(dicObjectCxn, bEnable);
            }
            else if(dlgItem==dicModelGraphic) {
                var bEnable = (__currentDialog.getDlgValue(dicModelGraphic)!=0);
                __currentDialog.setDlgEnable(dicShowGraphicSettings, bEnable);
            }
            else if(dlgItem==dicShowGraphicSettings) {
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
 *  @param holder_bModelGroups receives model groups setting
 *  @param holder_bModelAttr receives model attributes setting
 *  @param holder_bModelGraphic receives model graphic setting
 *  @param holder_bObjects receives objects setting
 *  @param holder_bObjectGroups receives object groups setting
 *  @param holder_bObjectAttr receives object attributes setting
 *  @param holder_bObjectCxn receives object connections setting
 *  @return dialog return value
 */
function showOutputOptionsDialog(ooutfile,
                              holder_bModelGroups, holder_bModelAttr, holder_bModelGraphic, 
                              holder_bObjects, holder_bObjectGroups, holder_bObjectAttr, holder_bObjectCxn)
{
  // Output format
  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 385, 200, txtOutputOptionsDialogTitle, "dlgFuncOutputOptions");

  userdialog.GroupBox(10, 10, 426, 65, txtModels);
  userdialog.CheckBox(24, 20, 220, 15, txtModelsWithGroups, dicModelGroups);
  userdialog.CheckBox(24, 35, 220, 15, txtModelsWithAttributes, dicModelAttr);
  userdialog.CheckBox(24, 50, 220, 15, txtModelsWithGraphic, dicModelGraphic);
  userdialog.PushButton(240, 50, 150, 15, txtFormatGraphic, dicShowGraphicSettings);

  userdialog.GroupBox(10, 85, 426, 80, txtObjectsWithModels);
  userdialog.CheckBox(24, 95, 380, 15, txtObjects, dicObjects);
  userdialog.CheckBox(48, 110, 380, 15, txtObjectsWithGroups, dicObjectGroups);
  userdialog.CheckBox(48, 125, 380, 15, txtObjectsWithAttributes, dicObjectAttr);
  userdialog.CheckBox(48, 140, 380, 15, txtObjectsWithConnections, dicObjectCxn);

  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_6f755010_eae1_11d8_12e0_9d2843560f51_dlg_01.hlp");
    
  dlgFuncOutput = Dialogs.createUserDialog(userdialog); 
  var sSection = "SCRIPT_6f755010_eae1_11d8_12e0_9d2843560f51";
  
  var vals  = new Array( (holder_bModelGroups.value?1:0), (holder_bModelAttr.value?1:0),
                         (holder_bModelGraphic.value?1:0), (holder_bObjects.value?1:0), (holder_bObjectGroups.value?1:0), 
                         (holder_bObjectAttr.value?1:0), (holder_bObjectCxn.value?1:0) );
  var dics  = new Array(dicModelGroups, dicModelAttr, dicModelGraphic, dicObjects, dicObjectGroups, dicObjectAttr, dicObjectCxn );
  
  // Read dialog settings from config
  for(var i=0;i<vals.length;i++) {
    ReadSettingsDlgValue(dlgFuncOutput, sSection, dics[i],  vals[i]);
  }

  for(;;)
  {
    bShowGraphicsSettingsDialog = false;
    nuserdialog = Dialogs.show( __currentDialog = dlgFuncOutput);
    // Displays dialog and waits for the confirmation with OK.
    if (nuserdialog == 0) {
      return nuserdialog;
    }
    if(bShowGraphicSettingsDialog) {
      showGraphicSettingsDialog(ooutfile);
      continue;
    }
    else break;
  }

  // Write dialog settings to config  
  if (nuserdialog != 0) {
      for(var i = 0; i < dics.length; i++) {
          WriteSettingsDlgValue(dlgFuncOutput, sSection, dics[i]);
      }
  }
  
  //  set flags for model/object data to consider
  var holders   = new Array(holder_bModelGroups, holder_bModelAttr, holder_bModelGraphic, holder_bObjects, holder_bObjectGroups, holder_bObjectAttr, holder_bObjectCxn);
  var dics      = new Array(dicModelGroups, dicModelAttr, dicModelGraphic, dicObjects, dicObjectGroups, dicObjectAttr, dicObjectCxn );
  
  for(var i = 0; i<holders.length;i++) {
    holders[i].value = (dlgFuncOutput.getDlgValue(dics[i]) != 0);
  }

  return nuserdialog;  
}

function isExcel()
{
	if (Context.getSelectedFormat()==Constants.OutputXLS) return true;
	if (Context.getSelectedFormat()==Constants.OutputXLSX) return true;
	return false;
}

/**
 *  show graphic settings dialog
 *
 */
function showGraphicSettingsDialog(outfile)
{
  var bcheckuserdialog = new __holder(true);
  graphicdialogs(outfile, bcheckuserdialog);
  bShowGraphicSettingsDialog = false;
}

var g_oFilter = ArisData.getActiveDatabase().ActiveFilter();

function shouldBeOutputStyled(p_oAttr) {
    if (g_bDialogsSupported) {    // STD
        switch (g_oFilter.AttrBaseType(p_oAttr.TypeNum())) {
            case Constants.ABT_MULTILINE:
            case Constants.ABT_SINGLELINE:
            var styledValue = p_oAttr.getStyledValue();
            if (!styledValue.containsOnlyPlainText()) {
                return true;
            }
            default:
            return false;
        }
    }
    else {  // BP, TC
        return false;
    }
}

function getFormattedAttrValue(p_oAttr) {
    // The output of the Description attribute looks out-of-place if the original formatting is left in place,
    // so we override it and apply the font that is used in the rest of the report.  If you really want the
    // formatting as it is defined in the attribute, set the last parameter of getMergedFormatting() to true.
    return p_oAttr.getStyledValue().getMergedFormatting(getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.FMT_LEFT, true).getHTML();
}

function getBoolPropertyValue(p_sPropKey) {
    var property = Context.getProperty(p_sPropKey);
    if (property != null) {
        return (StrComp(property, "true") == 0);
    }
    return false;
}

function getIntPropertyValue(p_sPropKey, nDefault) {
    var property = Context.getProperty(p_sPropKey);
    if (property != null) {
        if (!isNaN(property)) return parseInt(property);
    }
    return nDefault;
}

function isTocAvailable() {
    // BLUE-1864
    if ( Context.getSelectedFormat() == Constants.OUTTEXT || 
         Context.getSelectedFormat() == Constants.OUTHTML || 
         Context.getSelectedFormat() == Constants.OutputXLS || 
         Context.getSelectedFormat() == Constants.OutputXLSX || 
         Context.getSelectedFormat() == Constants.OUTXML ) return false;
    return true;
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
    if (isExcel()) {
        outfile.value.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        outfile.value.TableRow();
        outfile.value.TableCell(getString("TEXT22"), 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
        outfile.value.EndTable("", 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    } else {
        outHeaderFooter(outfile.value, getString("FONT"), getString("FOOTER_RIGHT"));
        outfile.value.OutputLn(getString("TEXT22"), getString("FONT"), FONT_SIZE, Constants.C_RED, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    }
    outfile.value.WriteReport();
}

function isDialogSupported() {
    // Dialog support depends on script runtime environment (STD resp. BP, TC)
    var env = Context.getEnvironment();
    if (env.equals(Constants.ENVIRONMENT_STD)) return true;
    if (env.equals(Constants.ENVIRONMENT_TC)) return SHOW_DIALOGS_IN_CONNECT;
    return false;
}

function inCaseRange(val, lower, upper) {
    return (val >= lower) && (val <= upper);
}

function isMatrix(oModel) {
    return oModel.OrgModelTypeNum() == Constants.MT_MATRIX_MOD;
}

function initMatrixCxns(oModel) {
    // BLUE-21554
    var matrixCxnMap = new java.util.HashMap();
    
    var oMatrixModel = oModel.getMatrixModel();
    var oCxns = getVisibleCxns(oMatrixModel);
    for (var i=0; i<oCxns.length; i++) {
        var oCxn = oCxns[i];
        addCxnToMap(oCxn.SourceObjDef(), oCxn, matrixCxnMap);
        addCxnToMap(oCxn.TargetObjDef(), oCxn, matrixCxnMap);        
    }
    return matrixCxnMap;
    
    function addCxnToMap(oObjDef, oCxn, map) {
        var cxnSet = new java.util.HashSet();
        if (map.containsKey(oObjDef)) {
            cxnSet = map.get(oObjDef);
        }
        cxnSet.add(oCxn);
        map.put(oObjDef, cxnSet);
    }        
    
    function getVisibleCxns(oMatrixModel) {
        var visibleCxnTypeSet = getVisibleCxnTypes(oMatrixModel);

        var visibleCxns = new Array();
        var contentCells = oMatrixModel.getContentCells();
        for (var i=0; i<contentCells.length; i++) {
            var contentCell = contentCells[i];
            if (contentCell == null) continue;   

            var cxns = contentCell.getCxns();
            for (var j = 0; j < cxns.length; j++) {
                var cxn = cxns[j];
                if (visibleCxnTypeSet.contains(cxn.TypeNum())) {
                    visibleCxns.push(cxn);
                }
            }
        }
        return visibleCxns;
    }        

    function getVisibleCxnTypes(oMatrixModel) {
        var visibleCxnTypeSet = new java.util.HashSet();
        
        var aCxnData = oMatrixModel.getCxnData();
        for (var i = 0; i < aCxnData.length; i++) {
            if (aCxnData[i].isVisible()) {
                visibleCxnTypeSet.add(aCxnData[i].getCxnType());
            }
        }
        return visibleCxnTypeSet;
    }    
}

main();
