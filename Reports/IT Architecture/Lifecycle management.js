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
const ALLOW_COLOR_OBJECTS_IN_CONNECT = false;   // Allow dialog options 'Color objects', "Reset colored objects" - Currently not supported in ARIS Connect (BLUE-12275)

/****************************************************/ 

// ----------------------------------------------------------
//
// evaluate getString("TEXT_15"):  cEVAL_ID_LC = "LC"      
// evaluate getString("TEXT_16"):  cEVAL_ID_SC = "SC";      
//
// ----------------------------------------------------------

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

var aOT_LifeCycle = new Array();
aOT_LifeCycle.push(Constants.OT_APPL_SYS);
aOT_LifeCycle.push(Constants.OT_HW_CMP);

var aOT_StdCycle = new Array();
aOT_StdCycle.push(Constants.OT_APPL_SYS_TYPE);
aOT_StdCycle.push(Constants.OT_DBMS_TYPE);
aOT_StdCycle.push(Constants.OT_PRG_LNG);
aOT_StdCycle.push(Constants.OT_HW_CMP_TYPE);
aOT_StdCycle.push(Constants.OT_OS_TYPE);
aOT_StdCycle.push(Constants.OT_FUNC);
aOT_StdCycle.push(Constants.OT_TECH_TRM);
aOT_StdCycle.push(Constants.OT_PERF);
aOT_StdCycle.push(Constants.OT_NW_PROT);

var g_nLoc = Context.getSelectedLanguage(); 
var g_oOutfile = null;

function MACRO_OBJOCC_COLOR(p_oObjOcc, p_nColor) {
    this.oObjOcc    = p_oObjOcc;
    this.nColor     = p_nColor;
}

function MACRO_LEGEND_COLOR(p_sState, p_nColor) {
    this.sState     = p_sState;
    this.nColor     = p_nColor;
}


// needed, if report was started by MACRO
var g_aObjColors_Macro = new Array();
var g_aLegend_LC = new Array();
var g_aLegend_SC = new Array();

var g_bIsStartedByMacro = getBoolPropertyValue("isStartedByMacro");  // Anubis 541446
var g_bLegend_LC = false;
var g_bLegend_SC = false;

main();

// needed, if report was started by MACRO
if (g_bIsStartedByMacro) {
    macro_writeProperties();
    
    if (g_bLegend_LC) macro_writeLegend_LC();
    if (g_bLegend_SC) macro_writeLegend_SC();
}

/*----------------------------------------------------------------------------*/

function main() {
/*
    // Initialized in 'itArchitecture.js'
    var g_sDate_Ref = getStringDate(new Date());    
    var g_sDate_Start = "01.01.2018";
    var g_sDate_End   = "31.12.2022";
*/    
    var bOutTable_holder = new __holder(false);
    var nSetObjColor_holder = new __holder(0);
    var bAddLegend_holder = new __holder(false);    
    var nState_holder = new __holder(0);        
    var dDate_Ref = new Date();

    if (dlgSelectOptions(bOutTable_holder, nSetObjColor_holder, bAddLegend_holder, nState_holder)) {

        g_nDate_Ref = getLongDate(g_sDate_Ref);
        g_nDate_Start = getLongDate(g_sDate_Start);
        g_nDate_End   = getLongDate(g_sDate_End);
        
        // --- Out Table ---
        if (bOutTable_holder.value) {
            g_oOutfile = Context.createOutputObject(Context.getSelectedFormat(), Context.getSelectedFile());

            initStyles(g_oOutfile, getString("FONT"));
            
            // Set Landscape
            var pageHeight = g_oOutfile.GetPageHeight();
            var pageWidth = g_oOutfile.GetPageWidth();
            if (pageHeight > pageWidth) {
                g_oOutfile.SetPageHeight(pageWidth);
                g_oOutfile.SetPageWidth(pageHeight);
            }
            
            outHeaderFooter(g_oOutfile, getString("FONT"), getString("FOOTER_RIGHT"));

            // --- Lebenzyklus ---
            var oObjDefList_LC = getSelectedObjDefList(cEVAL_ID_LC);        // get 'selected' object definitions
            if (oObjDefList_LC.length > 0) {
                var sTitle = getString("TEXT_15");
                outHeading(sTitle);
                
                g_oOutfile.BeginTable(100, convertToDoubles([15, 6, 9, 8, 8, 8, 8, 8, 30]), COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_REPEAT_HEADER | Constants.FMT_LEFT, 0);
                g_oOutfile.TableRow();
                g_oOutfile.TableCellF(getString("TEXT_1"), 1, 1, "TBL_HEAD");
                g_oOutfile.TableCellF(getString("TEXT_3"), 1, 1, "TBL_HEAD");
                g_oOutfile.TableCell(getString("TEXT_4"), 1, 1, getString("FONT"), FONT_SIZE_TBL_HEAD, fgColorWithLargerContrast(COL_TBL_HEAD_TXT, Constants.C_WHITE, cCOLOR_LC_Plan), cCOLOR_LC_Plan, 0, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0);
                g_oOutfile.TableCell(getString("TEXT_5"), 1, 1, getString("FONT"), FONT_SIZE_TBL_HEAD, fgColorWithLargerContrast(COL_TBL_HEAD_TXT, Constants.C_WHITE, cCOLOR_LC_Procure), cCOLOR_LC_Procure, 0, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0);
                g_oOutfile.TableCell(getString("TEXT_6"), 1, 1, getString("FONT"), FONT_SIZE_TBL_HEAD, fgColorWithLargerContrast(COL_TBL_HEAD_TXT, Constants.C_WHITE, cCOLOR_LC_Develop), cCOLOR_LC_Develop, 0, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0);
                g_oOutfile.TableCell(getString("TEXT_7"), 1, 1, getString("FONT"), FONT_SIZE_TBL_HEAD, fgColorWithLargerContrast(COL_TBL_HEAD_TXT, Constants.C_WHITE, cCOLOR_LC_Test), cCOLOR_LC_Test, 0, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0);
                g_oOutfile.TableCell(getString("TEXT_8"), 1, 1, getString("FONT"), FONT_SIZE_TBL_HEAD, fgColorWithLargerContrast(COL_TBL_HEAD_TXT, Constants.C_WHITE, cCOLOR_LC_Operation), cCOLOR_LC_Operation, 0, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0);
                g_oOutfile.TableCell(getString("TEXT_9"), 1, 1, getString("FONT"), FONT_SIZE_TBL_HEAD, fgColorWithLargerContrast(COL_TBL_HEAD_TXT, Constants.C_WHITE, cCOLOR_LC_Deact), cCOLOR_LC_Deact, 0, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0);
                g_oOutfile.TableCellF("", 1, 1, "TBL_HEAD");
                var oArrow = getArrowPicture(getString("FONT"), COL_TBL_HEAD_TXT);
                g_oOutfile.OutGraphic(oArrow, -1, getCellWidth(g_oOutfile, 30)-2, 10);

                var bColoredTableCell = false;
                for ( i = 0 ; i < oObjDefList_LC.length ; i++ ) {
                    outObject(oObjDefList_LC[i], (nState_holder.value == 0), cEVAL_ID_LC, bColoredTableCell);
                    bColoredTableCell = !bColoredTableCell;                    
                }
                if ((Context.getSelectedFormat() != Constants.OutputXLS) && (Context.getSelectedFormat() != Constants.OutputXLSX))
                    sTitle = "";
                g_oOutfile.EndTable(sTitle, 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT, 0);
            }

            // --- Standardisierungszyklus ---                        
            var oObjDefList_SC = getSelectedObjDefList(cEVAL_ID_SC);          // get 'selected' object definitions
            if (oObjDefList_SC.length > 0) {
                var sTitle = getString("TEXT_16")
                outHeading(sTitle);      

                g_oOutfile.BeginTable(100, convertToDoubles([15, 6, 9, 8, 8, 8, 8, 8, 30]), COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_REPEAT_HEADER | Constants.FMT_LEFT, 0);
                g_oOutfile.TableRow();
                g_oOutfile.TableCellF(getString("TEXT_1"), 1, 1, "TBL_HEAD");
                g_oOutfile.TableCellF(getString("TEXT_3"), 1, 1, "TBL_HEAD");
                g_oOutfile.TableCell(getString("TEXT_10"), 1, 1, getString("FONT"), FONT_SIZE_TBL_HEAD, fgColorWithLargerContrast(COL_TBL_HEAD_TXT, Constants.C_WHITE, cCOLOR_SC_Eval), cCOLOR_SC_Eval, 0, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0);
                g_oOutfile.TableCell(getString("TEXT_11"), 1, 1, getString("FONT"), FONT_SIZE_TBL_HEAD, fgColorWithLargerContrast(COL_TBL_HEAD_TXT, Constants.C_WHITE, cCOLOR_SC_Request), cCOLOR_SC_Request, 0, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0);
                g_oOutfile.TableCell(getString("TEXT_12"), 1, 1, getString("FONT"), FONT_SIZE_TBL_HEAD, fgColorWithLargerContrast(COL_TBL_HEAD_TXT, Constants.C_WHITE, cCOLOR_SC_PhasedIn), cCOLOR_SC_PhasedIn, 0, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0);
                g_oOutfile.TableCell(getString("TEXT_13"), 1, 1, getString("FONT"), FONT_SIZE_TBL_HEAD, fgColorWithLargerContrast(COL_TBL_HEAD_TXT, Constants.C_WHITE, cCOLOR_SC_Standard), cCOLOR_SC_Standard, 0, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0);
                g_oOutfile.TableCell(getString("TEXT_32"), 1, 1, getString("FONT"), FONT_SIZE_TBL_HEAD, fgColorWithLargerContrast(COL_TBL_HEAD_TXT, Constants.C_WHITE, cCOLOR_SC_Std_Ltd), cCOLOR_SC_Std_Ltd, 0, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0);
                g_oOutfile.TableCell(getString("TEXT_14"), 1, 1, getString("FONT"), FONT_SIZE_TBL_HEAD, fgColorWithLargerContrast(COL_TBL_HEAD_TXT, Constants.C_WHITE, cCOLOR_SC_PhasedOut), cCOLOR_SC_PhasedOut, 0, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0);
                g_oOutfile.TableCellF("", 1, 1, "TBL_HEAD");
                var oArrow = getArrowPicture(getString("FONT"), COL_TBL_HEAD_TXT);
                g_oOutfile.OutGraphic(oArrow, -1, getCellWidth(g_oOutfile, 30)-2, 10);

                var bColoredTableCell = false;
                for ( i = 0 ; i < oObjDefList_SC.length ; i++ ) {
                    outObject(oObjDefList_SC[i], (nState_holder.value == 0), cEVAL_ID_SC, bColoredTableCell);
                    bColoredTableCell = !bColoredTableCell;                    
                }
                if ((Context.getSelectedFormat() != Constants.OutputXLS) && (Context.getSelectedFormat() != Constants.OutputXLSX))
                    sTitle = "";
                g_oOutfile.EndTable(sTitle, 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT, 0);
            }
            
            if (bAddLegend_holder.value) {
                var LCtext;
                if (oObjDefList_LC.length > 0) LCtext = getString("TEXT_15");

                var SCtext;
                if (oObjDefList_SC.length > 0) SCtext = getString("TEXT_16");
                
                var oLegendPicture = getLegendPicture(LCtext, SCtext, getString("FONT"));
                
                if ((Context.getSelectedFormat() != Constants.OutputXLS) && (Context.getSelectedFormat() != Constants.OutputXLSX)) {
                    g_oOutfile.OutputLn("", getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
                    g_oOutfile.OutGraphic(oLegendPicture, -1, 500, 500);
                } else {
                    g_oOutfile.BeginTable(100, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0);
                    g_oOutfile.TableRow();
                    g_oOutfile.TableCell("", 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
                    g_oOutfile.OutGraphic(oLegendPicture, -1, 100, 100);
                    g_oOutfile.EndTable(getString("TEXT_31"), 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT, 0);
                }
            }
            
            g_oOutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());            
        } else {
            Context.setScriptError(Constants.ERR_NOFILECREATED);
        }
        // --- Set Colors ---
        if (nSetObjColor_holder.value != 0) {
            // --- Lebenzyklus ---            
            var oObjOccList_LC = getSelectedObjOccList(cEVAL_ID_LC);          // get 'selected' object occurences
            for (var i = 0 ; i < oObjOccList_LC.length ; i++ ) {  
                setObjectColor(oObjOccList_LC[i], (nSetObjColor_holder.value > 0), (nState_holder.value == 0), cEVAL_ID_LC);
            }
            // --- Standardisierungszyklus ---            
            var oObjOccList_SC = getSelectedObjOccList(cEVAL_ID_SC);          // get 'selected' object occurences
            for (var i = 0 ; i < oObjOccList_SC.length ; i++ ) {  
                setObjectColor(oObjOccList_SC[i], (nSetObjColor_holder.value > 0), (nState_holder.value == 0), cEVAL_ID_SC);
            }            
            if (bAddLegend_holder.value) {
                if (oObjOccList_LC.length > 0) g_bLegend_LC = true;
                if (oObjOccList_SC.length > 0) g_bLegend_SC = true;
                
                if (!g_bIsStartedByMacro) {
                    addLegend(oObjOccList_LC, oObjOccList_SC);
                }
            }
        }
    } else { Context.setScriptError(Constants.ERR_CANCEL) }
}

function getSelectedObjDefList(p_EvalID) {
    // set array of object types
    var aObjTypeNums = new Array();
    if (p_EvalID == cEVAL_ID_LC) {
        aObjTypeNums = aOT_LifeCycle;
    } else {
        aObjTypeNums = aOT_StdCycle;
    }
    
    var oSelObjDefs = new Array();

    var mList = ArisData.getSelectedModels();
    for (var i = 0; i < mList.length; i++) {
        var oModel = mList[i];
        for (var j = 0; j < aObjTypeNums.length; j++) {
            oSelObjDefs = oSelObjDefs.concat(oModel.ObjDefListFilter(aObjTypeNums[j]));
        }
    }
    var oList = ArisData.getSelectedObjDefs();
    for (var i = 0; i < oList.length; i++) {
        var oObjDef = oList[i];
        for (var j = 0; j < aObjTypeNums.length; j++) {
            if (oObjDef.TypeNum() == aObjTypeNums[j]) {
                oSelObjDefs.push(oObjDef);
                break;
            }
        }
    }
    oSelObjDefs = ArisData.Unique(oSelObjDefs);
    oSelObjDefs.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_TYPE, Constants.SORT_NONE, g_nLoc).compare);
    return oSelObjDefs;
}

function getSelectedObjOccList(p_EvalID) {
    // set array of object types
    var aObjTypeNums = new Array();
    if (p_EvalID == cEVAL_ID_LC) {
        aObjTypeNums = aOT_LifeCycle;
    } else {
        aObjTypeNums = aOT_StdCycle;
    }

    var oSelObjOccs = new Array();

    var mList = ArisData.getSelectedModels();
    for (var i = 0; i < mList.length; i++) {
        var oModel = mList[i];
        for (var j = 0; j < aObjTypeNums.length; j++) {
            oSelObjOccs = oSelObjOccs.concat(oModel.ObjOccListFilter(aObjTypeNums[j]));
        }
    }
    var oList = ArisData.getSelectedObjOccs();
    for (var i = 0; i < oList.length; i++) {
        var oObjOcc = oList[i];
        for (var j = 0; j < aObjTypeNums.length; j++) {
            if (oObjOcc.ObjDef().TypeNum() == aObjTypeNums[j]) {
                oSelObjOccs.push(oObjOcc);
                break;
            }
        }
    }
    return filterOutOccsInPSM(oSelObjOccs);
    
    function filterOutOccsInPSM(oObjOccs) {        
        var oFilteredObjOccs = new Array();
        for (var i = 0; i < oObjOccs.length; i++) {
            var oObjOcc = oObjOccs[i];
            if (oObjOcc.Model().TypeNum() != Constants.MT_SYS_LAY_OUT_PLAN) {
                oFilteredObjOccs.push(oObjOcc);
            }
        }
        return oFilteredObjOccs;
    }
}

function setObjectColor(p_oObjOcc, p_bSetColor, p_bColorOfState, p_EvalID) {
    var nColor = cCOLOR_DEFAULT;    /* = -1 */
    // bSetColor == true -> set color, else -> reset color
    if (p_bSetColor) {
        if (p_bColorOfState) {
            nColor = getColorOfState(p_oObjOcc.ObjDef(), p_EvalID);        
        } else {
            nColor = getColorOfPhase(p_oObjOcc.ObjDef(), p_EvalID);
        }
    }
    if (!g_bIsStartedByMacro) {
        try {
            if (nColor == cCOLOR_DEFAULT) {
                p_oObjOcc.setDefaultProperties(true, true, false);      // Set default properties
            } else {
                p_oObjOcc.setColor(nColor);                             // Set color of occs
            }
        } catch (e) {}
    } else {
        // needed, if report was started by MACRO
        g_aObjColors_Macro.push(new MACRO_OBJOCC_COLOR(p_oObjOcc, new java.lang.Long(nColor)));
    }
}
    
function outObject(p_oObjDef, p_bColorOfState, p_EvalID, p_bColoredTableCell) {

    g_oOutfile.TableRow();
    g_oOutfile.TableCellF(p_oObjDef.Name(g_nLoc), 1, 1, getStyleColored("TBL_STD_S", p_bColoredTableCell));
    var oStatePicture = getStatePicture(p_oObjDef, p_bColorOfState, p_EvalID);    
    g_oOutfile.TableCellF("", 1, 1, getStyleColored("TBL_STD_S", p_bColoredTableCell));
    g_oOutfile.OutGraphic(oStatePicture, -1, getCellWidth(g_oOutfile, 6), 6);

    if (p_EvalID == cEVAL_ID_LC) {
        // --- Lebenzyklus ---    
        var dDate_LC_Plan_Start     = getValueOfDateAttr(p_oObjDef, cAT_LC_Plan_Start);
        var dDate_LC_Plan_End       = getValueOfDateAttr(p_oObjDef, cAT_LC_Plan_End);
        var dDate_LC_Procure_End    = getValueOfDateAttr(p_oObjDef, cAT_LC_Procure_End);
        var dDate_LC_Develop_End    = getValueOfDateAttr(p_oObjDef, cAT_LC_Develop_End);
        var dDate_LC_Test_End       = getValueOfDateAttr(p_oObjDef, cAT_LC_Test_End);
        var dDate_LC_Operation_End  = getValueOfDateAttr(p_oObjDef, cAT_LC_Operation_End);
        var dDate_LC_Deact_End      = getValueOfDateAttr(p_oObjDef, cAT_LC_Deact_End);

        var sPlanFromUntil = "";
        if (dDate_LC_Plan_Start != "" || dDate_LC_Plan_End != "") sPlanFromUntil = dDate_LC_Plan_Start + " -\n" + dDate_LC_Plan_End;
        g_oOutfile.TableCellF(sPlanFromUntil, 1, 1, getStyleColored("TBL_STD_S", p_bColoredTableCell));
        g_oOutfile.TableCellF(dDate_LC_Procure_End, 1, 1, getStyleColored("TBL_STD_S", p_bColoredTableCell));
        g_oOutfile.TableCellF(dDate_LC_Develop_End, 1, 1, getStyleColored("TBL_STD_S", p_bColoredTableCell));
        g_oOutfile.TableCellF(dDate_LC_Test_End, 1, 1, getStyleColored("TBL_STD_S", p_bColoredTableCell));
        g_oOutfile.TableCellF(dDate_LC_Operation_End, 1, 1, getStyleColored("TBL_STD_S", p_bColoredTableCell));
        g_oOutfile.TableCellF(dDate_LC_Deact_End, 1, 1, getStyleColored("TBL_STD_S", p_bColoredTableCell));
    } else {     
        var dDate_SC_Eval_Start     = getValueOfDateAttr(p_oObjDef, cAT_SC_Eval_Start);        
        var dDate_SC_Eval_End       = getValueOfDateAttr(p_oObjDef, cAT_SC_Eval_End);
        var dDate_SC_Request_End    = getValueOfDateAttr(p_oObjDef, cAT_SC_Request_End);
        var dDate_SC_PhasedIn_End   = getValueOfDateAttr(p_oObjDef, cAT_SC_PhasedIn_End);
        var dDate_SC_Standard_End   = getValueOfDateAttr(p_oObjDef, cAT_SC_Standard_End);
        var dDate_SC_Std_Ltd_End    = getValueOfDateAttr(p_oObjDef, cAT_SC_Std_Ltd_End);
        var dDate_SC_PhasedOut_End  = getValueOfDateAttr(p_oObjDef, cAT_SC_PhasedOut_End);

        var sEvalFromUntil = "";
        if (dDate_SC_Eval_Start != "" || dDate_SC_Eval_End != "") sEvalFromUntil = dDate_SC_Eval_Start + " -\n" + dDate_SC_Eval_End;
        g_oOutfile.TableCellF(sEvalFromUntil, 1, 1, getStyleColored("TBL_STD_S", p_bColoredTableCell));
        g_oOutfile.TableCellF(dDate_SC_Request_End, 1, 1, getStyleColored("TBL_STD_S", p_bColoredTableCell));
        g_oOutfile.TableCellF(dDate_SC_PhasedIn_End, 1, 1, getStyleColored("TBL_STD_S", p_bColoredTableCell));
        g_oOutfile.TableCellF(dDate_SC_Standard_End, 1, 1, getStyleColored("TBL_STD_S", p_bColoredTableCell));
        g_oOutfile.TableCellF(dDate_SC_Std_Ltd_End, 1, 1, getStyleColored("TBL_STD_S", p_bColoredTableCell));
        g_oOutfile.TableCellF(dDate_SC_PhasedOut_End, 1, 1, getStyleColored("TBL_STD_S", p_bColoredTableCell));
    }
    var oGraphicPicture = getGraphicPicture(p_oObjDef, p_EvalID, getString("TEXT_17"), getString("FONT"));
    g_oOutfile.TableCellF("", 1, 1, getStyleColored("TBL_STD_S", p_bColoredTableCell));
    g_oOutfile.OutGraphic(oGraphicPicture, -1, getCellWidth(g_oOutfile, 30)-2, 10);
}

function dlgSelectOptions(p_bOutTable_holder, p_nSetObjColor_holder, p_bAddLegend_holder, p_nState_holder) {
    var nuserdlg = 0;   // Variable for the user dialog box
    
    var userdialog = Dialogs.createNewDialogTemplate(500, 280, getString("TEXT_18"), "dlgFuncSelectOptions");
    userdialog.GroupBox(10, 10, 450, 85, getString("TEXT_19"));
    userdialog.CheckBox(30, 25, 400, 15, getString("TEXT_20"), "var_outTable");
    userdialog.CheckBox(30, 40, 400, 15, getString("TEXT_21"), "var_setColor");
    userdialog.CheckBox(30, 55, 400, 15, getString("TEXT_22"), "var_resetColor");
    userdialog.CheckBox(30, 70, 400, 15, getString("TEXT_23"), "var_addLegend");
    
    userdialog.GroupBox(10, 100, 450, 55, getString("TEXT_24"));
    userdialog.OptionGroup("var_states");
    userdialog.OptionButton(30, 115, 350, 15, getString("TEXT_25"));
    userdialog.OptionButton(30, 130, 350, 15, getString("TEXT_26"));
       
    userdialog.GroupBox(10, 160, 450, 140, getString("TEXT_27"));
    userdialog.Text(30, 177, 250, 14, getString("TEXT_26") + ":");
    userdialog.DateChooser(300, 175, 120, 21, "var_dateRef");
    userdialog.GroupBox(20, 205, 430, 70, getString("TEXT_28"));
    userdialog.Text(30, 222, 250, 14, getString("TEXT_29") + ":");
    userdialog.DateChooser(300, 220, 120, 21, "var_dateStart");
    userdialog.Text(30, 247, 250, 14, getString("TEXT_30") + ":");
    userdialog.DateChooser(300, 245, 120, 21, "var_dateEnd");

    userdialog.OKButton();
    userdialog.CancelButton();
    userdialog.HelpButton("HID_2551a890_1a2d_11da_5bb8_000802c68187_dlg_01.hlp");
    
    var dlg = Dialogs.createUserDialog(userdialog); 
    var sSection = "SCRIPT_2551a890_1a2d_11da_5bb8_000802c68187";
    
    var bExitDialog = false;
    while (!bExitDialog) {
        // Read dialog settings from config    
        ReadSettingsDlgValue(dlg, sSection, "var_outTable", 1);
        ReadSettingsDlgValue(dlg, sSection, "var_setColor", 0);
        ReadSettingsDlgValue(dlg, sSection, "var_resetColor", 0);
        ReadSettingsDlgValue(dlg, sSection, "var_addLegend", 0);
        ReadSettingsDlgValue(dlg, sSection, "var_states", 0);
        ReadSettingsDlgText(dlg, sSection, "var_dateRef", convertToInternal(g_sDate_Ref));
        ReadSettingsDlgText(dlg, sSection, "var_dateStart", convertToInternal(g_sDate_Start));
        ReadSettingsDlgText(dlg, sSection, "var_dateEnd", convertToInternal(g_sDate_End));  
        
        nuserdlg = Dialogs.show( __currentDialog = dlg);    // Showing dialog and waiting for confirmation with OK
        
        if (nuserdlg == 0) {
            bExitDialog = true;
        } else {
            if ((getDate("" + convertFromInternal(dlg.getDlgText("var_dateRef"))) != null) &&
                (getDate("" + convertFromInternal(dlg.getDlgText("var_dateStart"))) != null) &&
                (getDate("" + convertFromInternal(dlg.getDlgText("var_dateEnd"))) != null)) {
                    
                bExitDialog = true;
                
                p_bOutTable_holder.value = (dlg.getDlgValue("var_outTable") == 1);
                
                if (dlg.getDlgValue("var_setColor") == 1) {
                    p_nSetObjColor_holder.value = 1;
                }
                if (dlg.getDlgValue("var_resetColor") == 1) {
                    p_nSetObjColor_holder.value = -1;
                }
                
                p_nState_holder.value = dlg.getDlgValue("var_states");                
                p_bAddLegend_holder.value = (dlg.getDlgValue("var_addLegend") == 1);    // Add legend
                    
                g_sDate_Ref   = "" + convertFromInternal(dlg.getDlgText("var_dateRef"));
                g_sDate_Start = "" + convertFromInternal(dlg.getDlgText("var_dateStart"));
                g_sDate_End   = "" + convertFromInternal(dlg.getDlgText("var_dateEnd"));
            }
        }
    }
    // Write dialog settings to config    
    if (nuserdlg != 0) {
        WriteSettingsDlgValue(dlg, sSection, "var_outTable");
        WriteSettingsDlgValue(dlg, sSection, "var_setColor");
        WriteSettingsDlgValue(dlg, sSection, "var_resetColor");
        WriteSettingsDlgValue(dlg, sSection, "var_addLegend");
        WriteSettingsDlgValue(dlg, sSection, "var_states");
        WriteSettingsDlgText(dlg, sSection, "var_dateRef");
        WriteSettingsDlgText(dlg, sSection, "var_dateStart");
        WriteSettingsDlgText(dlg, sSection, "var_dateEnd");  
    }
    return (nuserdlg != 0);
}

function dlgFuncSelectOptions(dlgitem, action, suppvalue) {
    var result = false;
    
    switch(action) {
        case 1:
            if (__currentDialog.getDlgValue("var_states") != 1) {
                __currentDialog.setDlgEnable("var_dateRef", false);
            }          
            
            if (!Context.getEnvironment().equals(Constants.ENVIRONMENT_STD) && !ALLOW_COLOR_OBJECTS_IN_CONNECT) {
                // BLUE-12275 Disable dialog options 'Color objects', "Reset colored objects" , because currently not supported in ARIS Connect
                __currentDialog.setDlgValue("var_setColor", 0);
                __currentDialog.setDlgValue("var_resetColor", 0);
                __currentDialog.setDlgEnable("var_setColor", false);
                __currentDialog.setDlgEnable("var_resetColor", false);

            } else {
                if (ArisData.getSelectedModels().length > 0 || ArisData.getSelectedObjOccs().length > 0) {
                    __currentDialog.setDlgEnable("var_setColor", true);
                    __currentDialog.setDlgEnable("var_resetColor", true);
                    
                    if (__currentDialog.getDlgValue("var_setColor") != 0) {
                        __currentDialog.setDlgValue("var_resetColor", 0);
                        __currentDialog.setDlgEnable("var_resetColor", false);
                    } else {
                        if (__currentDialog.getDlgValue("var_resetColor") != 0) {
                            __currentDialog.setDlgEnable("var_setColor", false);
                        }
                    }
                } else {
                    __currentDialog.setDlgEnable("var_setColor", false);
                    __currentDialog.setDlgEnable("var_resetColor", false);
                }
            }
            if (__currentDialog.getDlgValue("var_outTable") == 0 && __currentDialog.getDlgValue("var_setColor") == 0) {
                __currentDialog.setDlgValue("var_addLegend", 0);
                __currentDialog.setDlgEnable("var_addLegend", false);
            } else {
                __currentDialog.setDlgEnable("var_addLegend", true);
            }
            break;
        case 2:
            switch(dlgitem) {
                case "var_outTable":                
                    if (__currentDialog.getDlgValue("var_outTable") == 0) {
                        __currentDialog.setDlgEnable("var_dateStart", false);
                        __currentDialog.setDlgEnable("var_dateEnd", false);
                        if (__currentDialog.getDlgValue("var_setColor") == 0) {
                            __currentDialog.setDlgValue("var_addLegend", 0);
                            __currentDialog.setDlgEnable("var_addLegend", false);
                        }
                    } else {
                        __currentDialog.setDlgEnable("var_dateStart", true);
                        __currentDialog.setDlgEnable("var_dateEnd", true);
                        __currentDialog.setDlgEnable("var_addLegend", true);
                    }
                    result = true;
                    break;
                case "var_setColor":
                    if (__currentDialog.getDlgValue("var_setColor") == 0) {
                        __currentDialog.setDlgEnable("var_resetColor", true);
                        if (__currentDialog.getDlgValue("var_outTable") == 0) {
                            __currentDialog.setDlgValue("var_addLegend", 0);
                            __currentDialog.setDlgEnable("var_addLegend", false);
                        }
                    } else {
                        __currentDialog.setDlgEnable("var_resetColor", false);
                        __currentDialog.setDlgEnable("var_addLegend", true);
                    }
                    result = true;
                    break;
                case "var_states":
                    if (__currentDialog.getDlgValue("var_states") == 0) {
                        __currentDialog.setDlgEnable("var_dateRef", false);
                    } else {
                        __currentDialog.setDlgEnable("var_dateRef", true);
                    }
                    result = true;
                    break;
                case "var_resetColor":
                    if (__currentDialog.getDlgValue("var_resetColor") == 0) {
                        __currentDialog.setDlgEnable("var_setColor", true);
                    } else {
                        __currentDialog.setDlgEnable("var_setColor", false);
                    }
                    result = true;
                    break;
            }
    }
    return result;
}

function addLegend(p_oObjOccList_LC, p_oObjOccList_SC) {
    var oObjOccList = new Array();
    oObjOccList = oObjOccList.concat(p_oObjOccList_LC);
    oObjOccList = oObjOccList.concat(p_oObjOccList_SC);
    
    var oModelList = new Array();
    for (var i = 0 ; i < oObjOccList.length ; i++ ) {  
        oModelList.push(oObjOccList[i].Model());
    }            
    oModelList = ArisData.Unique(oModelList);

    for (var i = 0 ; i < oModelList.length ; i++ ) {  
        var oModel = oModelList[i];
        try {
            oModel.doLayout();
        } catch (e) {}
        var yStart = getMaxYPos(oModel) + 100;
        var xStart = 100;

        if (g_bLegend_LC) {
            // Lebenzyklus
            oModel.CreateTextOcc (xStart, yStart + 25, getString("TEXT_15"));
            createColoredRect(oModel, xStart, yStart + 100, cCOLOR_LC_Plan,      getNameOfAttrValue(cATV_LC_State_Plan));
            createColoredRect(oModel, xStart, yStart + 200, cCOLOR_LC_Procure,   getNameOfAttrValue(cATV_LC_State_Procure));
            createColoredRect(oModel, xStart, yStart + 300, cCOLOR_LC_Develop,   getNameOfAttrValue(cATV_LC_State_Develop));
            createColoredRect(oModel, xStart, yStart + 400, cCOLOR_LC_Test,      getNameOfAttrValue(cATV_LC_State_Test));
            createColoredRect(oModel, xStart, yStart + 500, cCOLOR_LC_Operation, getNameOfAttrValue(cATV_LC_State_Operation));
            createColoredRect(oModel, xStart, yStart + 600, cCOLOR_LC_Deact,     getNameOfAttrValue(cATV_LC_State_Deact));
            createColoredRect(oModel, xStart, yStart + 700, cCOLOR_LC_Offline,   getNameOfAttrValue(cATV_LC_State_IsDeact));
            
            xStart = 600;
        }
        
        if (g_bLegend_SC) {
            // Standardisierungszyklus
            oModel.CreateTextOcc (xStart, yStart + 25, getString("TEXT_16"));        
            createColoredRect(oModel, xStart, yStart + 100, cCOLOR_SC_NonStandard, getNameOfAttrValue(cATV_SC_State_NonStandard));        
            createColoredRect(oModel, xStart, yStart + 200, cCOLOR_SC_Eval,        getNameOfAttrValue(cATV_SC_State_Eval));
            createColoredRect(oModel, xStart, yStart + 300, cCOLOR_SC_Request,     getNameOfAttrValue(cATV_SC_State_Request));
            createColoredRect(oModel, xStart, yStart + 400, cCOLOR_SC_PhasedIn,    getNameOfAttrValue(cATV_SC_State_PhasedIn));
            createColoredRect(oModel, xStart, yStart + 500, cCOLOR_SC_Standard,    getNameOfAttrValue(cATV_SC_State_Standard));
            createColoredRect(oModel, xStart, yStart + 600, cCOLOR_SC_Std_Ltd,     getNameOfAttrValue(cATV_SC_State_Std_Ltd));
            createColoredRect(oModel, xStart, yStart + 700, cCOLOR_SC_PhasedOut,   getNameOfAttrValue(cATV_SC_State_PhasedOut));
            createColoredRect(oModel, xStart, yStart + 800, cCOLOR_SC_NonStandard, getNameOfAttrValue(cATV_SC_State_IsPhasedOut));                
            createColoredRect(oModel, xStart, yStart + 900, cCOLOR_SC_Refused,     getNameOfAttrValue(cATV_SC_State_Refused));
        }
    }    
}

function getMaxYPos(p_oModel) {
    var yMax = 0;
    var oObjOccList = p_oModel.ObjOccList();
    for (var i = 0 ; i < oObjOccList.length ; i++ ) {
        var oObjOcc = oObjOccList[i];
        var yTmp = oObjOcc.Y() + oObjOcc.Height();
        
        if (yTmp > yMax) 
            yMax = yTmp;
    }  
    return yMax; 
} 
 
function createColoredRect(p_oModel, p_xPos, p_yPos, p_nColor, p_sState) {
    var oRect = p_oModel.createRoundedRectangle(p_xPos, p_yPos, 100, 50);
    if (oRect != null) {
        oRect.setRoundness(0,0);
        oRect.setBrushColor(p_nColor);
        
        p_oModel.CreateTextOcc (p_xPos + 150, p_yPos + 25, p_sState);
    }
} 

function macro_writeProperties() {
    if (g_aObjColors_Macro.length > 0) {
        var sb = new java.lang.StringBuffer();
        
        for ( i = 0 ; i < g_aObjColors_Macro.length ; i++ ) {
            sb.append(g_aObjColors_Macro[i].oObjOcc.ObjectID());
            sb.append(",");
            sb.append(g_aObjColors_Macro[i].nColor);
            sb.append(";");
        }
        Context.setProperty("LifeCycle", sb.toString());   
    }
}

function macro_writeLegend_LC() {
    // Lebenzyklus    
    var sb = new java.lang.StringBuffer();
    sb.append("" +  cCOLOR_LC_Plan          + "," + getNameOfAttrValue(cATV_LC_State_Plan) + ";");
    sb.append("" +  cCOLOR_LC_Procure       + "," + getNameOfAttrValue(cATV_LC_State_Procure) + ";");
    sb.append("" + cCOLOR_LC_Develop        + "," + getNameOfAttrValue(cATV_LC_State_Develop) + ";");
    sb.append("" + cCOLOR_LC_Test           + "," + getNameOfAttrValue(cATV_LC_State_Test) + ";");
    sb.append("" + cCOLOR_LC_Operation      + "," + getNameOfAttrValue(cATV_LC_State_Operation) + ";");
    sb.append("" + cCOLOR_LC_Deact          + "," + getNameOfAttrValue(cATV_LC_State_Deact) + ";");
    sb.append("" + cCOLOR_LC_Offline        + "," + getNameOfAttrValue(cATV_LC_State_IsDeact) + ";");
    Context.setProperty("Legend_LC", sb.toString());       
}

function macro_writeLegend_SC() {
    // Standardisierungszyklus    
    var sb = new java.lang.StringBuffer();
    sb.append("" +  cCOLOR_SC_NonStandard   + "," + getNameOfAttrValue(cATV_SC_State_NonStandard) + ";");
    sb.append("" +  cCOLOR_SC_Eval          + "," + getNameOfAttrValue(cATV_SC_State_Eval) + ";");
    sb.append("" +  cCOLOR_SC_Request       + "," + getNameOfAttrValue(cATV_SC_State_Request) + ";");
    sb.append("" +  cCOLOR_SC_PhasedIn      + "," + getNameOfAttrValue(cATV_SC_State_PhasedIn) + ";");
    sb.append("" +  cCOLOR_SC_Standard      + "," + getNameOfAttrValue(cATV_SC_State_Standard) + ";");
    sb.append("" +  cCOLOR_SC_Std_Ltd       + "," + getNameOfAttrValue(cATV_SC_State_Std_Ltd) + ";");
    sb.append("" +  cCOLOR_SC_PhasedOut     + "," + getNameOfAttrValue(cATV_SC_State_PhasedOut) + ";");
    sb.append("" +  cCOLOR_SC_NonStandard   + "," + getNameOfAttrValue(cATV_SC_State_IsPhasedOut) + ";");
    sb.append("" +  cCOLOR_SC_Refused       + "," + getNameOfAttrValue(cATV_SC_State_Refused) + ";");
    Context.setProperty("Legend_SC", sb.toString());       
}

function outHeading(p_sText) {
    if ((Context.getSelectedFormat() != Constants.OutputXLS) && (Context.getSelectedFormat() != Constants.OutputXLSX)) {
        var sText = p_sText;
        if (ArisData.getSelectedModels().length == 1) {
            sText += ": "+ArisData.getSelectedModels()[0].Name(g_nLoc);
        }
        g_oOutfile.OutputLnF(sText, "HEADING1_NOTOC");
    }
}

function getBoolPropertyValue(p_sPropKey) {
    var property = Context.getProperty(p_sPropKey);
    if (property != null) {
        return (StrComp(property, "true") == 0);
    }
    return false;
}

function fgColorWithLargerContrast(p_nFgColor1, p_nFgColor2, p_nBgColor) {
    var aWeights = [1/3, 1/3, 1/3]; // For converting R, G and B to grayscale. Taking human perception in account it would be [.21, .72, .07] or [.3, .59, .11].
    var oFgColor1 = new java.awt.Color(p_nFgColor1);
    var oFgColor2 = new java.awt.Color(p_nFgColor2);
    var oBgColor = new java.awt.Color(p_nBgColor);
    var nBrightnessFgColor1 = oFgColor1.getRed()*aWeights[0] + oFgColor1.getGreen()*aWeights[1] + oFgColor1.getBlue()*aWeights[2];
    var nBrightnessFgColor2 = oFgColor2.getRed()*aWeights[0] + oFgColor2.getGreen()*aWeights[1] + oFgColor2.getBlue()*aWeights[2];
    var nBrightnessBgColor = oBgColor.getRed()*aWeights[0] + oBgColor.getGreen()*aWeights[1] + oBgColor.getBlue()*aWeights[2];
    if (Math.abs(nBrightnessFgColor1 - nBrightnessBgColor) > Math.abs(nBrightnessFgColor2 - nBrightnessBgColor)) {
        return p_nFgColor1;
    } else {
        return p_nFgColor2;
    }
}
