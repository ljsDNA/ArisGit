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


/* ---------------------------------------------------------------- */

// bar chart - constants and global variables

// --- Coordinates and Sizes ---
var X_MIN = 0;
var X_MAX = 1000;
var Y_MIN = 0;
var Y_MAX = 100;
var Y_MIN_PDF = 105;        // special case: two graphics in one picture
var Y_MAX_PDF = 205;        // special case: two graphics in one picture
var Y_TRIANGLE = 30;
var TEXT_WIDTH = 100;

// --- Dates --- 
var g_sDate_Ref = getStringDate(new Date());    
// Start and end dates are adjusted according to the current year. If
// you prefer a fixed period that stays the same over time, you can
// use simple strings instead, like "01.01.2022".
var g_sDate_Start = "01.01." + toString((new Date()).getFullYear() - 1);
var g_sDate_End   = "31.12." + toString((new Date()).getFullYear() + 3);

var g_nDate_Ref = getLongDate(g_sDate_Ref);
var g_nDate_Start = getLongDate(g_sDate_Start);
var g_nDate_End   = getLongDate(g_sDate_End);

// only needed for Systemsteckbrief
var g_sDate_StartTmp = g_sDate_Start;
var g_sDate_EndTmp   = g_sDate_End;
var g_nDate_StartTmp = g_nDate_Start;
var g_nDate_EndTmp   = g_nDate_End;

/* ---------------------------------------------------------------- */

var cEVAL_ID_LC = "LC";      // evaluate "Lebenzyklus"
var cEVAL_ID_SC = "SC";      // evaluate "Standardisierungszyklus"

// --- Lebenzyklus ---    
var cAT_LC_Plan_Start       = Constants.AT_PLANNING_PHASE_START         // Planung (von)
var cAT_LC_Plan_End         = Constants.AT_PLANNING_PHASE_END           // Planung (bis)
var cAT_LC_Procure_End      = Constants.AT_PROCUREMENT_PHASE_END        // Beschaffung (bis)		
var cAT_LC_Develop_End      = Constants.AT_DEVELOPMENT_PHASE_END        // Entwicklung (bis)		
var cAT_LC_Test_End         = Constants.AT_TEST_PHASE_END               // Test (bis)
var cAT_LC_Operation_End    = Constants.AT_OPERATION_PHASE_END          // Betrieb (bis)
var cAT_LC_Deact_End        = Constants.AT_DEACTIVATION_PHASE_END       // Abschaltung (bis)

var cAT_LC_State            = Constants.AT_SYSTEM_STATE;                // Systemstatus           
var cATV_LC_State_Plan          = Constants.AVT_SYSTEM_STATE_PLAN           // In Planung
var cATV_LC_State_Procure       = Constants.AVT_SYSTEM_STATE_PROCURE        // In Beschaffung
var cATV_LC_State_Develop       = Constants.AVT_SYSTEM_STATE_DEV            // In Entwicklung
var cATV_LC_State_Test          = Constants.AVT_SYSTEM_STATE_TEST           // Im Test
var cATV_LC_State_Operation     = Constants.AVT_SYSTEM_STATE_RUNNING        // Im Betrieb
var cATV_LC_State_Deact         = Constants.AVT_SYSTEM_STATE_SHUTTING_DOWN  // In Abschaltung
var cATV_LC_State_IsDeact       = Constants.AVT_SYSTEM_STATE_SHUT_DOWN      // Abgeschaltet

// Old colors
/*
var cCOLOR_LC_Plan          = getColorByRGB(255, 255, 153);             // yellow1
var cCOLOR_LC_Procure       = getColorByRGB(255, 255,   0);             // yellow2
var cCOLOR_LC_Develop       = getColorByRGB(255, 204,   0);             // yellow3
var cCOLOR_LC_Test          = getColorByRGB(204, 255, 204);             // green1
var cCOLOR_LC_Operation     = getColorByRGB(  0, 255,   0);             // green2
var cCOLOR_LC_Deact         = getColorByRGB(255, 102,   0);             // orange1
var cCOLOR_LC_Offline       = getColorByRGB(255,   0,   0);             // red
*/
// New colors (as of 10.0 SR12, April 2020)
var cCOLOR_LC_Plan          = getColorByRGB(255, 255, 191);             // yellow1
var cCOLOR_LC_Procure       = getColorByRGB(255, 241, 156);             // yellow2
var cCOLOR_LC_Develop       = getColorByRGB(241, 227, 143);             // yellow3
var cCOLOR_LC_Test          = getColorByRGB(201, 217, 125);             // green1
var cCOLOR_LC_Operation     = getColorByRGB(145, 205, 139);             // green2
var cCOLOR_LC_Deact         = getColorByRGB(214, 108,  57);             // orange1
var cCOLOR_LC_Offline       = getColorByRGB(213,  62,  79);             // red

// --- Standardisierungszyklus ---
var cAT_SC_Eval_Start       = Constants.AT_EVALUATION_START             // Evaluierung (von)
var cAT_SC_Eval_End         = Constants.AT_EVALUATION_END               // Evaluierung (bis)
var cAT_SC_Request_End      = Constants.AT_REQUESTED_FOR_STANDARD_END   // Beantragung (bis)
var cAT_SC_PhasedIn_End     = Constants.AT_TO_BE_PHASED_IN_END          // Einführung (bis)
var cAT_SC_Standard_End     = Constants.AT_STANDARD_END                 // Standard (bis)
var cAT_SC_Std_Ltd_End      = Constants.AT_LIMITED_STANDARD_END         // Eingeschränkter Standard (bis)
var cAT_SC_PhasedOut_End    = Constants.AT_TO_BE_PHASED_OUT_END         // Auslauf (bis)

var cAT_SC_State            = Constants.AT_STATUS_STANDARDIZATION;      // Status der Standardisierung
var cATV_SC_State_NonStandard   = Constants.AVT_STATUS_STANDARDIZATION_NON_STANDARD     // Kein Standard
var cATV_SC_State_Eval          = Constants.AVT_STATUS_STANDARDIZATION_IN_EVALUATION    // In Evaluierung
var cATV_SC_State_Request       = Constants.AVT_STATUS_STANDARDIZATION_REQ_FOR_STANDARD // In Beantragung
var cATV_SC_State_PhasedIn      = Constants.AVT_STATUS_STANDARDIZATION_TO_BE_PHASED_IN  // In Einführung
var cATV_SC_State_Standard      = Constants.AVT_STATUS_STANDARDIZATION_IS_STANDARD      // Standard
var cATV_SC_State_Std_Ltd       = Constants.AVT_STATUS_STANDARDIZATION_STANDARD_LTD_USE // Standard - eingeschränkte Nutzung
var cATV_SC_State_PhasedOut     = Constants.AVT_STATUS_STANDARDIZATION_TO_BE_PHASED_OUT // Im Auslaufen
var cATV_SC_State_IsPhasedOut   = Constants.AVT_STATUS_STANDARDIZATION_IS_PHASED_OUT    // Ausgelaufen
var cATV_SC_State_Refused       = Constants.AVT_STATUS_STANDARDIZATION_REFUSED          // Abgelehnt

// Old colors
/*
var cCOLOR_SC_Eval          = getColorByRGB(255, 255, 153);             // yellow1
var cCOLOR_SC_Request       = getColorByRGB(255, 255,   0);             // yellow2
var cCOLOR_SC_PhasedIn      = getColorByRGB(204, 255, 204);             // green1
var cCOLOR_SC_Standard      = getColorByRGB(  0, 255,   0);             // green2
var cCOLOR_SC_Std_Ltd       = getColorByRGB( 51, 102, 255);             // blue
var cCOLOR_SC_PhasedOut     = getColorByRGB(255, 153,   0);             // orange2
var cCOLOR_SC_NonStandard   = getColorByRGB(255,   0,   0);             // red
var cCOLOR_SC_Refused       = getColorByRGB(255,   0,   0);             // red
*/
// New colors (as of 10.0 SR12, April 2020)
var cCOLOR_SC_Eval          = getColorByRGB(255, 255, 191);             // yellow1
var cCOLOR_SC_Request       = getColorByRGB(255, 241, 156);             // yellow2
var cCOLOR_SC_PhasedIn      = getColorByRGB(201, 217, 125);             // green1
var cCOLOR_SC_Standard      = getColorByRGB(145, 205, 139);             // green2
var cCOLOR_SC_Std_Ltd       = getColorByRGB(117, 167, 208);             // blue
var cCOLOR_SC_PhasedOut     = getColorByRGB(214, 108,  57);             // orange2
var cCOLOR_SC_NonStandard   = getColorByRGB(213,  62,  79);             // red
var cCOLOR_SC_Refused       = getColorByRGB(213,  62,  79);             // red

// --- Common ---
var cCOLOR_DEFAULT          = -1;                               // DEFAULT
/*var cCOLOR_UNDEFINED        = getColorByRGB(255, 255, 255);             // white*/
var cCOLOR_Pen              = getColorByRGB(  0,   0,   0);             // black
var cCOLOR_White            = getColorByRGB(255, 255, 255);             // white
var cCOLOR_Back             = getColorByRGB(255, 255, 255);             // grey
var cCOLOR_Mark             = getColorByRGB(255,   0,   0);             // red

// --- Direction indicators ---
const DIRECTION_OUT = 0;
const DIRECTION_IN = 1;

/********************************************************************************************/

function getNameOfAttr(p_attrTypeNum ) {
    return ArisData.getActiveDatabase().ActiveFilter().AttrTypeName(p_attrTypeNum);
}

function getNameOfAttrValue(p_attrValueTypeNum) {
    return ArisData.getActiveDatabase().ActiveFilter().AttrValueType(p_attrValueTypeNum);
}

function getValueOfDateAttr(p_oObjDef, p_nAttrTypeNum) {
    if (p_oObjDef.Attribute(p_nAttrTypeNum, g_nLoc).IsMaintained()) {
        var sDateStd = p_oObjDef.Attribute(p_nAttrTypeNum, g_nLoc).getValueStd();
        return convertFromInternal(sDateStd);   // BLUE-18196
    }
    return "";
}

function getTimeOfDateAttr(p_oObjDef, p_nAttrTypeNum) {
    if (p_oObjDef.Attribute(p_nAttrTypeNum, g_nLoc).IsMaintained()) {
        return p_oObjDef.Attribute(p_nAttrTypeNum, g_nLoc).MeasureValue().getTime();
    }
    return undefined;
}

function getCellWidth(p_oOutfile, p_widthPercent) {
    return parseInt(p_widthPercent/100 * (p_oOutfile.GetPageWidth() - p_oOutfile.GetLeftMargin() - p_oOutfile.GetRightMargin()));
}

function getStatePicture_SystemState(p_oObjDef) {
    return getStatePicture(p_oObjDef, true, cEVAL_ID_LC);
}

function getPhasePicture_SystemState(p_oObjDef) {
    return getStatePicture(p_oObjDef, false, cEVAL_ID_LC);
}

function getStatePicture_Standardization(p_oObjDef) {
    return getStatePicture(p_oObjDef, true, cEVAL_ID_SC);
}

function getPhasePicture_Standardization(p_oObjDef) {
    return getStatePicture(p_oObjDef, false, cEVAL_ID_SC);
}

function getStatePicture(p_oObjDef, p_bColorOfState, p_EvalID, p_nPadding) {
    var nPadding = 1;
    if (p_nPadding != null) nPadding = p_nPadding;
    var nIndicatorSize = 60;
    var nTotalSize = nIndicatorSize + (2 * nPadding);
    
    var oPicture = Context.createPicture();

    oPicture.SelectPen(Constants.PS_NULL, 0, Constants.C_TRANSPARENT);
    oPicture.Rectangle(nTotalSize, nTotalSize, nTotalSize, nTotalSize);
    
    oPicture.SelectPen(Constants.PS_SOLID, 1, cCOLOR_Pen);
    oPicture.SelectBrush(cCOLOR_Pen);
    oPicture.Ellipse(nPadding, nPadding, nPadding + nIndicatorSize, nPadding + nIndicatorSize);

    var nBGcolor;
    if (p_bColorOfState) {
        nBGcolor = getColorOfState(p_oObjDef, p_EvalID);
    } else {
        nBGcolor = getColorOfPhase(p_oObjDef, p_EvalID);
    }
    oPicture.SelectBrush(nBGcolor);
    oPicture.Ellipse(nPadding + 5, nPadding + 5, nPadding + nIndicatorSize - 5, nPadding + nIndicatorSize - 5);
    
    return oPicture;
}

function getColorOfPhase(p_oObjDef, p_EvalID) {
    var nColor = cCOLOR_DEFAULT;         // init

    if (p_EvalID == cEVAL_ID_LC) {
// --- Lebenzyklus ---    
        if (checkAttributes_LC(p_oObjDef)) {
            var nDate_LC_Plan_Start     = getTimeOfDateAttr(p_oObjDef, cAT_LC_Plan_Start);
            var nDate_LC_Plan_End       = getTimeOfDateAttr(p_oObjDef, cAT_LC_Plan_End);
            var nDate_LC_Procure_End    = getTimeOfDateAttr(p_oObjDef, cAT_LC_Procure_End);
            var nDate_LC_Develop_End    = getTimeOfDateAttr(p_oObjDef, cAT_LC_Develop_End);
            var nDate_LC_Test_End       = getTimeOfDateAttr(p_oObjDef, cAT_LC_Test_End);
            var nDate_LC_Operation_End  = getTimeOfDateAttr(p_oObjDef, cAT_LC_Operation_End);
            var nDate_LC_Deact_End      = getTimeOfDateAttr(p_oObjDef, cAT_LC_Deact_End);
    
            nColor = cCOLOR_LC_Offline;
            
            if (nDate_LC_Deact_End != undefined && g_nDate_Ref <= nDate_LC_Deact_End) {
                nColor = cCOLOR_LC_Deact;
            }        
            if (nDate_LC_Operation_End != undefined && g_nDate_Ref <= nDate_LC_Operation_End) {
                nColor = cCOLOR_LC_Operation;
            }
            if (nDate_LC_Test_End != undefined && g_nDate_Ref <= nDate_LC_Test_End) {
                nColor = cCOLOR_LC_Test;
            }
            if (nDate_LC_Develop_End != undefined && g_nDate_Ref <= nDate_LC_Develop_End) {
                nColor = cCOLOR_LC_Develop;
            }
            if (nDate_LC_Procure_End != undefined && g_nDate_Ref <= nDate_LC_Procure_End) {
                nColor = cCOLOR_LC_Procure;
            }
            if (nDate_LC_Plan_End != undefined && g_nDate_Ref <= nDate_LC_Plan_End) {
                nColor = cCOLOR_LC_Plan;
            }
            if (nDate_LC_Plan_Start != undefined && g_nDate_Ref <= nDate_LC_Plan_Start) {
                nColor = cCOLOR_LC_Offline;
            }
        }
    } else {
// --- Standardisierungszyklus ---    
        if (checkAttributes_SC(p_oObjDef)) {
            var nDate_SC_Eval_Start     = getTimeOfDateAttr(p_oObjDef, cAT_SC_Eval_Start);
            var nDate_SC_Eval_End       = getTimeOfDateAttr(p_oObjDef, cAT_SC_Eval_End);    
            var nDate_SC_Request_End    = getTimeOfDateAttr(p_oObjDef, cAT_SC_Request_End);
            var nDate_SC_PhasedIn_End   = getTimeOfDateAttr(p_oObjDef, cAT_SC_PhasedIn_End);
            var nDate_SC_Standard_End   = getTimeOfDateAttr(p_oObjDef, cAT_SC_Standard_End);
            var nDate_SC_PhasedOut_End  = getTimeOfDateAttr(p_oObjDef, cAT_SC_PhasedOut_End);
    
            nColor = cCOLOR_SC_NonStandard;
            
            if (nDate_SC_PhasedOut_End != undefined && g_nDate_Ref <= nDate_SC_PhasedOut_End) {
                nColor = cCOLOR_SC_PhasedOut;
            }
            if (nDate_SC_Standard_End != undefined && g_nDate_Ref <= nDate_SC_Standard_End) {
                nColor = cCOLOR_SC_Standard;
            }
            if (nDate_SC_PhasedIn_End != undefined && g_nDate_Ref <= nDate_SC_PhasedIn_End) {
                nColor = cCOLOR_SC_PhasedIn;
            }
           // Refused: Only if ToBePhasedIn, Standard, ToBePhasedOut not defined
            if (nDate_SC_PhasedIn_End == undefined && 
                nDate_SC_Standard_End == undefined && 
                nDate_SC_PhasedOut_End == undefined) {
                    nColor = cCOLOR_SC_Refused;
            }
            if (nDate_SC_Request_End != undefined && g_nDate_Ref <= nDate_SC_Request_End) {
                nColor = cCOLOR_SC_Request;
                bRefusedAvailable = true;            
            }
            if (nDate_SC_Eval_End != undefined && g_nDate_Ref <= nDate_SC_Eval_End) {
                nColor = cCOLOR_SC_Eval;
                bRefusedAvailable = true;
            }
            if (nDate_SC_Eval_Start != undefined && g_nDate_Ref <= nDate_SC_Eval_Start) {
                nColor = cCOLOR_SC_NonStandard;
            }
        }
    }
    return nColor;
}

function getColorOfState(p_oObjDef, p_EvalID) {
    var nColor = cCOLOR_DEFAULT;

    if (p_EvalID == cEVAL_ID_LC) {
// --- Lebenzyklus ---    
        //nColor = cCOLOR_LC_Offline;
        
        var oAttr = p_oObjDef.Attribute(cAT_LC_State, g_nLoc);
        if (oAttr.IsMaintained()) {
            var nAttrValueType = oAttr.MeasureUnitTypeNum();
    
            if (nAttrValueType == cATV_LC_State_Plan)
                nColor = cCOLOR_LC_Plan;
            if (nAttrValueType == cATV_LC_State_Procure)
                nColor = cCOLOR_LC_Procure;
            if (nAttrValueType == cATV_LC_State_Develop)
                nColor = cCOLOR_LC_Develop;
            if (nAttrValueType == cATV_LC_State_Test)
                nColor = cCOLOR_LC_Test;
            if (nAttrValueType == cATV_LC_State_Operation)
                nColor = cCOLOR_LC_Operation;
            if (nAttrValueType == cATV_LC_State_Deact)
                nColor = cCOLOR_LC_Deact;
            if (nAttrValueType == cATV_LC_State_IsDeact)
                nColor = cCOLOR_LC_Offline;
        }
    } else {
// --- Standardisierungszyklus ---    
        //nColor = cCOLOR_SC_NonStandard;
        
        var oAttr = p_oObjDef.Attribute(cAT_SC_State, g_nLoc);
        if (oAttr.IsMaintained()) {
            var nAttrValueType = oAttr.MeasureUnitTypeNum();

            if (nAttrValueType == cATV_SC_State_NonStandard)
                nColor = cCOLOR_SC_NonStandard;
            if (nAttrValueType == cATV_SC_State_Eval)
                nColor = cCOLOR_SC_Eval;
            if (nAttrValueType == cATV_SC_State_Request)
                nColor = cCOLOR_SC_Request;
            if (nAttrValueType == cATV_SC_State_PhasedIn)
                nColor = cCOLOR_SC_PhasedIn;
            if (nAttrValueType == cATV_SC_State_Standard)
                nColor = cCOLOR_SC_Standard;
            if (nAttrValueType == cATV_SC_State_Std_Ltd)
                nColor = cCOLOR_SC_Std_Ltd;
            if (nAttrValueType == cATV_SC_State_PhasedOut)
                nColor = cCOLOR_SC_PhasedOut;
            if (nAttrValueType == cATV_SC_State_IsPhasedOut)
                nColor = cCOLOR_SC_NonStandard;
            if (nAttrValueType == cATV_SC_State_Refused)
                nColor = cCOLOR_SC_Refused;
        }
    }
    return nColor;
}

function getGraphicPicture_SystemState(p_oObjDef, p_sErrorText, p_sFont) {
    return getGraphicPicture(p_oObjDef, cEVAL_ID_LC, p_sErrorText, p_sFont);
}

function getGraphicPicture2_SystemState(p_oPicture, p_oObjDef, p_sErrorText, p_sFont) {
    var y_min_tmp = Y_MIN;
    var y_max_tmp = Y_MAX;
    
    Y_MIN = Y_MIN_PDF;
    Y_MAX = Y_MAX_PDF;
    
    var oPicture = getGraphicPicture2(p_oPicture, p_oObjDef, cEVAL_ID_LC, p_sErrorText, p_sFont);
    
    Y_MIN = y_min_tmp;
    Y_MAX = y_max_tmp;
    
    return oPicture;
}

function getGraphicPicture_Standardization(p_oObjDef, p_sErrorText, p_sFont) {
    return getGraphicPicture(p_oObjDef, cEVAL_ID_SC, p_sErrorText, p_sFont);
}

function getGraphicPicture2_Standardization(p_oPicture, p_oObjDef, p_sErrorText, p_sFont) {
    var y_min_tmp = Y_MIN;
    var y_max_tmp = Y_MAX;
    
    Y_MIN = Y_MIN_PDF;
    Y_MAX = Y_MAX_PDF;
    
    var oPicture = getGraphicPicture2(p_oPicture, p_oObjDef, cEVAL_ID_SC, p_sErrorText, p_sFont);
    
    Y_MIN = y_min_tmp;
    Y_MAX = y_max_tmp;
    
    return oPicture;
}

function getGraphicPicture(p_oObjDef, p_EvalID, p_sErrorText, p_sFont) {
    return getGraphicPicture2(Context.createPicture(), p_oObjDef, p_EvalID, p_sErrorText, p_sFont);
}
    
function getGraphicPicture2(p_oPicture, p_oObjDef, p_EvalID, p_sErrorText, p_sFont) {
    var oPicture = p_oPicture;
    
// (DUMMY) -> All graphics with same size!
    oPicture.SelectPen(Constants.PS_SOLID, 1, cCOLOR_White);
    oPicture.Rectangle(X_MAX+10, Y_MAX, X_MAX+10, Y_MAX);
    
    oPicture.SelectPen(Constants.PS_SOLID, 1, cCOLOR_Pen);
    oPicture.SetTextColor(cCOLOR_Pen);
    oPicture.SetBkMode(Constants.BKMODE_TRANSPARENT);

    oPicture.SelectFont(350, p_sFont, 0);    
    
    var bAttrOk = true;
    if (p_EvalID == cEVAL_ID_LC) {
// --- Lebenzyklus ---    
        if (checkAttributes_LC(p_oObjDef)) {
            drawGraphicPicture_LC(oPicture, p_oObjDef);
        } else {
            bAttrOk = false;
        }
            
    } else {
// --- Standardisierungszyklus ---
        if (checkAttributes_SC(p_oObjDef)) {
            drawGraphicPicture_SC(oPicture, p_oObjDef)
        } else {
            bAttrOk = false;
        }
    }

    if (bAttrOk) {
// Triangle
        if ((g_nDate_Start <= g_nDate_Ref) && (g_nDate_End >= g_nDate_Ref)) {
            var xMark = getCurrentX(g_nDate_Ref);
            drawTriangle(oPicture, xMark, Y_MIN + Y_TRIANGLE);
        }
    } else {
// Out empty rectangle with error-text
        oPicture.SelectBrush(cCOLOR_Back);
        oPicture.Rectangle(X_MIN, Y_MIN + Y_TRIANGLE, X_MAX, Y_MAX);        
        oPicture.DrawText(p_sErrorText, X_MIN, Y_MIN + Y_TRIANGLE + 10, X_MAX, Y_MAX, Constants.DT_CENTER);            

    }    
    return oPicture;
}

function drawGraphicPicture_LC(p_oPicture, p_oObjDef) {
    var nDate_LC_Plan_Start     = getTimeOfDateAttr(p_oObjDef, cAT_LC_Plan_Start);
    var nDate_LC_Plan_End       = getTimeOfDateAttr(p_oObjDef, cAT_LC_Plan_End);
    var nDate_LC_Procure_End    = getTimeOfDateAttr(p_oObjDef, cAT_LC_Procure_End);
    var nDate_LC_Develop_End    = getTimeOfDateAttr(p_oObjDef, cAT_LC_Develop_End);
    var nDate_LC_Test_End       = getTimeOfDateAttr(p_oObjDef, cAT_LC_Test_End);
    var nDate_LC_Operation_End  = getTimeOfDateAttr(p_oObjDef, cAT_LC_Operation_End);
    var nDate_LC_Deact_End      = getTimeOfDateAttr(p_oObjDef, cAT_LC_Deact_End);
    
// default ->
    var nColor = cCOLOR_LC_Offline;
    var xCurrMin = X_MIN;
    var yCurrMin = Y_MIN + Y_TRIANGLE;    
// -> Planning (Start)    
    if (nDate_LC_Plan_Start != undefined) {
        var xCurrMax = getCurrentX(nDate_LC_Plan_Start);
        p_oPicture.SelectBrush(nColor);
        p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
        xCurrMin = xCurrMax;    
    }
// -> Planning (End)    
    if (nDate_LC_Plan_End != undefined) {
        nColor = cCOLOR_LC_Plan;    
        var xCurrMax = getCurrentX(nDate_LC_Plan_End);
        p_oPicture.SelectBrush(nColor);
        p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
        xCurrMin = xCurrMax;    
    }
// -> Procurement (End)
    if (nDate_LC_Procure_End != undefined) {
        nColor = cCOLOR_LC_Procure;    
        var xCurrMax = getCurrentX(nDate_LC_Procure_End);
        p_oPicture.SelectBrush(nColor);
        p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
        xCurrMin = xCurrMax;    
    }
// -> Development (End)
    if (nDate_LC_Develop_End != undefined) {
        nColor = cCOLOR_LC_Develop;    
        var xCurrMax = getCurrentX(nDate_LC_Develop_End);
        p_oPicture.SelectBrush(nColor);
        p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
        xCurrMin = xCurrMax;    
    }
// -> Test (End)
    if (nDate_LC_Test_End != undefined) {
        nColor = cCOLOR_LC_Test;    
        var xCurrMax = getCurrentX(nDate_LC_Test_End);
        p_oPicture.SelectBrush(nColor);
        p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
        xCurrMin = xCurrMax;    
    }
// -> Operation (End)
    if (nDate_LC_Operation_End != undefined) {
        nColor = cCOLOR_LC_Operation;    
        var xCurrMax = getCurrentX(nDate_LC_Operation_End);
        p_oPicture.SelectBrush(nColor);
        p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
        xCurrMin = xCurrMax;    
    }
// -> Deactivation (End)
    if (nDate_LC_Deact_End != undefined) {
        nColor = cCOLOR_LC_Deact;
        var xCurrMax = getCurrentX(nDate_LC_Deact_End);
        p_oPicture.SelectBrush(nColor);
        p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
        xCurrMin = xCurrMax;    
    }
    nColor = cCOLOR_LC_Offline;
    var xCurrMax = X_MAX;
    p_oPicture.SelectBrush(nColor);
    p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
}

function drawGraphicPicture_SC(p_oPicture, p_oObjDef) {
    var nDate_SC_Eval_Start     = getTimeOfDateAttr(p_oObjDef, cAT_SC_Eval_Start);
    var nDate_SC_Eval_End       = getTimeOfDateAttr(p_oObjDef, cAT_SC_Eval_End);    
    var nDate_SC_Request_End    = getTimeOfDateAttr(p_oObjDef, cAT_SC_Request_End);
    var nDate_SC_PhasedIn_End   = getTimeOfDateAttr(p_oObjDef, cAT_SC_PhasedIn_End);
    var nDate_SC_Standard_End   = getTimeOfDateAttr(p_oObjDef, cAT_SC_Standard_End);
    var nDate_SC_Std_Ltd_End    = getTimeOfDateAttr(p_oObjDef, cAT_SC_Std_Ltd_End);
    var nDate_SC_PhasedOut_End  = getTimeOfDateAttr(p_oObjDef, cAT_SC_PhasedOut_End);    

    var bRefusedAvailable = false;    
// default ->
    var nColor = cCOLOR_SC_NonStandard;
    var xCurrMin = X_MIN;
    var yCurrMin = Y_MIN + Y_TRIANGLE;    
// -> Evaluation (Start)    
    if (nDate_SC_Eval_Start != undefined) {
        var xCurrMax = getCurrentX(nDate_SC_Eval_Start);
        p_oPicture.SelectBrush(nColor);
        p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
        xCurrMin = xCurrMax;    
    }
// -> Evaluation (End)    
    if (nDate_SC_Eval_End != undefined) {
        nColor = cCOLOR_SC_Eval;
        var xCurrMax = getCurrentX(nDate_SC_Eval_End);
        p_oPicture.SelectBrush(nColor);
        p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
        xCurrMin = xCurrMax; 
        
        bRefusedAvailable = true;    
    }
// -> Requested for Standard (End)
    if (nDate_SC_Request_End != undefined) {
        nColor = cCOLOR_SC_Request;
        var xCurrMax = getCurrentX(nDate_SC_Request_End);
        p_oPicture.SelectBrush(nColor);
        p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
        xCurrMin = xCurrMax;
        
        bRefusedAvailable = true;        
    }
// -> To Be Phased In (End)
    if (nDate_SC_PhasedIn_End != undefined) {
        nColor = cCOLOR_SC_PhasedIn;
        var xCurrMax = getCurrentX(nDate_SC_PhasedIn_End);
        p_oPicture.SelectBrush(nColor);
        p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
        xCurrMin = xCurrMax;    
    }
// -> Standard (End)
    if (nDate_SC_Standard_End != undefined) {
        nColor = cCOLOR_SC_Standard;
        var xCurrMax = getCurrentX(nDate_SC_Standard_End);
        p_oPicture.SelectBrush(nColor);
        p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
        xCurrMin = xCurrMax;    
    }
// -> Limited Standard (End)
    if (nDate_SC_Std_Ltd_End != undefined) {
        nColor = cCOLOR_SC_Std_Ltd;
        var xCurrMax = getCurrentX(nDate_SC_Std_Ltd_End);
        p_oPicture.SelectBrush(nColor);
        p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
        xCurrMin = xCurrMax;    
    }
// -> To Be Phased Out (End)
    if (nDate_SC_PhasedOut_End != undefined) {
        nColor = cCOLOR_SC_PhasedOut;
        var xCurrMax = getCurrentX(nDate_SC_PhasedOut_End);
        p_oPicture.SelectBrush(nColor);
        p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
        xCurrMin = xCurrMax;    
    }
// Refused: Only if ToBePhasedIn, Standard, ToBePhasedOut not defined
    if (nDate_SC_PhasedIn_End == undefined && 
        nDate_SC_Standard_End == undefined && 
        nDate_SC_PhasedOut_End == undefined) {
            
        if (bRefusedAvailable)
            nColor = cCOLOR_SC_Refused;
    } else {
        nColor = cCOLOR_SC_NonStandard;
    }    
    xCurrMax = X_MAX;
    p_oPicture.SelectBrush(nColor);
    p_oPicture.Rectangle(xCurrMin, yCurrMin, xCurrMax, Y_MAX);
}

function getCurrentX(p_nDate) {
    if (p_nDate < g_nDate_Start) 
        return X_MIN;
    if (p_nDate > g_nDate_End) 
        return X_MAX;
     
    var xCurrent = (p_nDate - g_nDate_Start) / (g_nDate_End - g_nDate_Start) * (X_MAX - X_MIN);
    return xCurrent;
}

function drawTriangle(p_oPicture, p_xPos, p_yPos) {
    p_oPicture.SelectBrush(cCOLOR_Pen);
    var triangle = new Array(3); 
    triangle[0] = new java.awt.Point(p_xPos - 12, p_yPos - Y_TRIANGLE);
    triangle[1] = new java.awt.Point(p_xPos + 12, p_yPos - Y_TRIANGLE);
    triangle[2] = new java.awt.Point(p_xPos, p_yPos);
    p_oPicture.Polygon(triangle);
}

function getArrowPicture(p_sFont, p_nColor) {
    var yMid = (Y_MAX - Y_MIN)/2;
    var delta = yMid/3;

    var oArrow = Context.createPicture();
// (DUMMY) -> All graphics with same size!
    oArrow.SelectPen(Constants.PS_SOLID, 1, cCOLOR_White);
    oArrow.Rectangle(X_MAX+10, Y_MAX, X_MAX+10, Y_MAX);
    
    oArrow.SelectFont(300, p_sFont, 0);
// Arrowline    
    oArrow.SelectPen(Constants.PS_SOLID, 2, p_nColor);
    oArrow.MoveTo(X_MIN, yMid);
    oArrow.LineTo(X_MAX, yMid);
// Arrowhead
    var arrowHead = new Array(3); 
    arrowHead[0] = new java.awt.Point(X_MAX, yMid);
    arrowHead[1] = new java.awt.Point(X_MAX - delta, yMid + delta);
    arrowHead[2] = new java.awt.Point(X_MAX - delta, yMid - delta);
    oArrow.SelectBrush(p_nColor);
    oArrow.Polygon(arrowHead);

    oArrow.SetTextColor(p_nColor);
// Years
    var aYears = getYears(); 
    var nCount = 5;
    var nDelta = 1;
    if (aYears.length > nCount)
        nDelta = Math.round(aYears.length / nCount);
    for (var i = 0 ; i < aYears.length ; i = i+nDelta) {
        var sFullYear = getDate(aYears[i]).getFullYear();
        var xYear = getCurrentX(getLongDate(aYears[i]));        
        oArrow.SelectPen(Constants.PS_SOLID, 2, p_nColor);
        oArrow.MoveTo(xYear, yMid - delta);
        oArrow.LineTo(xYear, yMid + delta);
        var xYear_text = getCorrectedXPosition(xYear - TEXT_WIDTH/2, TEXT_WIDTH);
        oArrow.DrawText(sFullYear, xYear_text, Y_MIN, xYear_text + TEXT_WIDTH, yMid, Constants.DT_CENTER);
    }
// Start / End
    oArrow.SelectFont(250, p_sFont, 0);    
    oArrow.DrawText(g_sDate_Start, X_MIN, yMid + delta, X_MIN + TEXT_WIDTH, Y_MAX, Constants.DT_LEFT);
    oArrow.DrawText(g_sDate_End, X_MAX - TEXT_WIDTH, yMid + delta, X_MAX, Y_MAX, Constants.DT_RIGHT);   

// Mark Position
    if ((g_nDate_Start <= g_nDate_Ref) && (g_nDate_End >= g_nDate_Ref)) {
        var xMark = getCurrentX(g_nDate_Ref);
        drawTriangle(oArrow, xMark, yMid);
        if ( (X_MIN < (xMark + 3*TEXT_WIDTH)) && ((xMark + 3*TEXT_WIDTH) < X_MAX) ) {
            oArrow.DrawText(g_sDate_Ref, xMark - TEXT_WIDTH/2, yMid + delta, xMark + TEXT_WIDTH/2, Y_MAX, Constants.DT_LEFT);
        }
    }
    return oArrow;
}

function getCorrectedXPosition(p_xPos, p_nWidth) {
    if (p_xPos + p_nWidth > X_MAX) {
        return X_MAX - p_nWidth;
    }
    if (p_xPos < X_MIN) {
        return X_MIN;
    }
    return p_xPos;
}

function getYears() {
    var aYears = new Array();
    
    var bEnd  = true;
    var nFullYear = getDate(g_sDate_Start).getFullYear();
    while (bEnd) {
        var sCurrDate = "01.01." + nFullYear;
        if (getLongDate(sCurrDate) >= g_nDate_Start) {
            if (getLongDate(sCurrDate) <= g_nDate_End) {
                aYears.push(sCurrDate);
            } else {
                bEnd = false;
            }
        }
        nFullYear++;
    }
    return aYears;
}

function getDate(p_sDate) {
    // Format of p_sDate: DD.MM.YYYY
    
    if (p_sDate.length != 10) 
        return null;
    
    var sDay = getDayOrMonth(p_sDate.substr(0,2));
    var sMonth = getDayOrMonth(p_sDate.substr(3,2));
    var sYear = p_sDate.substr(6);
    
    if (sDay.isNaN || sMonth.isNaN || sYear.isNaN) 
        return null;
    
    if (parseInt(sDay) > 31 || parseInt(sMonth) > 12) 
        return null;    

    var dDate = new Date();
    dDate.setFullYear(parseInt(sYear));
    dDate.setMonth(parseInt(sMonth)-1);
    dDate.setDate(parseInt(sDay));
    
    return dDate;
}

function getDayOrMonth(p_sDate) {

    if (p_sDate.substr(0,1) == "0") {
        return p_sDate.substr(1,1);
    }
    return p_sDate;
}

function getLongDate(p_sDate) {
    // Format of p_sDate: DD.MM.YYYY
    var dDate = getDate(p_sDate);
    if (dDate == null)
        return null;

    return dDate.getTime();   
}

function convertToInternal(p_sDate) {
    // Convert date format: dd.MM.yyyy -> MM/dd/yyyy ((BLUE-18196 - DateChooser))
    var sDate = "" + p_sDate;
    if (sDate.length != 10) return p_sDate; 

    var dDate = getDate(sDate);
    var df = new java.text.SimpleDateFormat("MM/dd/yyyy");
    return df.format(dDate);
}

function convertFromInternal(p_sDate) {
    // Convert date format: MM/dd/yyyy -> dd.MM.yyyy ((BLUE-18196 - DateChooser))
    var sDate = "" + p_sDate;
    if (sDate.length != 10) return p_sDate; 

    var sDay   = sDate.substr(3,2);
    var sMonth = sDate.substr(0,2);
    var sYear  = sDate.substr(6);
    return sDay + "." + sMonth + "." + sYear
}

function getStringDate(p_dDate) {
    var sb = new java.lang.StringBuffer();
    sb.append(toString(p_dDate.getDate()));
    sb.append(".");
    sb.append(toString(p_dDate.getMonth()+1));    
    sb.append(".");
    sb.append(toString(p_dDate.getFullYear()));
    return "" + sb.toString();
}

function toString(p_value) {
   var intValue = new java.lang.Integer(p_value);
   if (intValue < 10) {
        return new java.lang.StringBuffer().append("0").append(intValue).toString();
    }
    return java.lang.Integer.toString(intValue);
}

function checkAttributes_LC(p_oObjDef) {
    var nDate_LC_Plan_Start     = getTimeOfDateAttr(p_oObjDef, cAT_LC_Plan_Start);
    var nDate_LC_Plan_End       = getTimeOfDateAttr(p_oObjDef, cAT_LC_Plan_End);
    var nDate_LC_Procure_End    = getTimeOfDateAttr(p_oObjDef, cAT_LC_Procure_End);
    var nDate_LC_Develop_End    = getTimeOfDateAttr(p_oObjDef, cAT_LC_Develop_End);
    var nDate_LC_Test_End       = getTimeOfDateAttr(p_oObjDef, cAT_LC_Test_End);
    var nDate_LC_Operation_End  = getTimeOfDateAttr(p_oObjDef, cAT_LC_Operation_End);
    var nDate_LC_Deact_End      = getTimeOfDateAttr(p_oObjDef, cAT_LC_Deact_End);

    if (nDate_LC_Plan_Start == undefined &&
        nDate_LC_Plan_End == undefined &&
        nDate_LC_Procure_End == undefined &&
        nDate_LC_Develop_End == undefined &&
        nDate_LC_Test_End == undefined &&
        nDate_LC_Operation_End == undefined &&
        nDate_LC_Deact_End == undefined) {
        // None of this attributes maintained
        return false;
    }
    
    var nDate_Compare = 0;
    if (nDate_LC_Plan_Start != undefined) {
        if (nDate_Compare >= nDate_LC_Plan_Start) {
            return false;
        }
        nDate_Compare = nDate_LC_Plan_Start;
    }
    if (nDate_LC_Plan_End != undefined) {
        if (nDate_Compare >= nDate_LC_Plan_End) {
            return false;
        }
        nDate_Compare = nDate_LC_Plan_End;
    }
    if (nDate_LC_Procure_End != undefined) {
        if (nDate_Compare >= nDate_LC_Procure_End) {
            return false;
        }
        nDate_Compare = nDate_LC_Procure_End;
    }
    if (nDate_LC_Develop_End != undefined) {
        if (nDate_Compare >= nDate_LC_Develop_End) {
            return false;
        }
        nDate_Compare = nDate_LC_Develop_End;
    }
    if (nDate_LC_Test_End != undefined) {
        if (nDate_Compare >= nDate_LC_Test_End) {
            return false;
        }
        nDate_Compare = nDate_LC_Test_End;
    }
    if (nDate_LC_Operation_End != undefined) {
        if (nDate_Compare >= nDate_LC_Operation_End) {
            return false;
        }
        nDate_Compare = nDate_LC_Operation_End;
    }
    if (nDate_LC_Deact_End != undefined) {
        if (nDate_Compare >= nDate_LC_Deact_End) {
            return false;
        }
        nDate_Compare = nDate_LC_Deact_End;
    }
    return true;
}

function checkAttributes_SC(p_oObjDef) {
    var nDate_SC_Eval_Start     = getTimeOfDateAttr(p_oObjDef, cAT_SC_Eval_Start);
    var nDate_SC_Eval_End       = getTimeOfDateAttr(p_oObjDef, cAT_SC_Eval_End);    
    var nDate_SC_Request_End    = getTimeOfDateAttr(p_oObjDef, cAT_SC_Request_End);
    var nDate_SC_PhasedIn_End   = getTimeOfDateAttr(p_oObjDef, cAT_SC_PhasedIn_End);
    var nDate_SC_Standard_End   = getTimeOfDateAttr(p_oObjDef, cAT_SC_Standard_End);
    var nDate_SC_PhasedOut_End  = getTimeOfDateAttr(p_oObjDef, cAT_SC_PhasedOut_End);

    if (nDate_SC_Eval_Start == undefined &&
        nDate_SC_Eval_End == undefined &&
        nDate_SC_Request_End == undefined &&
        nDate_SC_PhasedIn_End == undefined &&
        nDate_SC_Standard_End == undefined &&
        nDate_SC_PhasedOut_End == undefined) {
        // None of this attributes maintained
        return false;    
    }
    
    var nDate_Compare = 0;
    if (nDate_SC_Eval_Start != undefined) {
        if (nDate_Compare >= nDate_SC_Eval_Start) {
            return false;
        }
        nDate_Compare = nDate_SC_Eval_Start;
    }
    if (nDate_SC_Eval_End != undefined) {
        if (nDate_Compare >= nDate_SC_Eval_End) {
            return false;
        }
        nDate_Compare = nDate_SC_Eval_End;
    }
    if (nDate_SC_Request_End != undefined) {
        if (nDate_Compare >= nDate_SC_Request_End) {
            return false;
        }
        nDate_Compare = nDate_SC_Request_End;
    }
    if (nDate_SC_PhasedIn_End != undefined) {
        if (nDate_Compare >= nDate_SC_PhasedIn_End) {
            return false;
        }
        nDate_Compare = nDate_SC_PhasedIn_End;
    }
    if (nDate_SC_Standard_End != undefined) {
        if (nDate_Compare >= nDate_SC_Standard_End) {
            return false;
        }
        nDate_Compare = nDate_SC_Standard_End;
    }
    if (nDate_SC_PhasedOut_End != undefined) {
        if (nDate_Compare >= nDate_SC_PhasedOut_End) {
            return false;
        }
        nDate_Compare = nDate_SC_PhasedOut_End;
    }
    return true;
}

/* ------------------------------------------------------ */

// Data Flow

function ROW_TYPE(p_oSource, p_oTarget, p_oData, p_oProtocol, p_sDirection) {
    this.oSource     = p_oSource;
    this.oTarget     = p_oTarget;
    this.oData       = p_oData;
    this.oProtocol   = p_oProtocol;
    this.sDirection  = p_sDirection;    
}

function getTableContent(p_oSelApplSystems, p_bOnlyBetween) {
    for (var i = 0; i < p_oSelApplSystems.length; i++) {
        var oApplSystem = p_oSelApplSystems[i];
        
        var oInterfaceCxns_Out = getInterfaceCxns_Out(oApplSystem);
        for (var j = 0; j < oInterfaceCxns_Out.length; j++) {
            var oInterfaceCxn = oInterfaceCxns_Out[j];
            var oTargetObjDef = getTargetApplSystem(oInterfaceCxn, p_oSelApplSystems, p_bOnlyBetween);
            
            if (oTargetObjDef != null) {
                writeDataAndProtocol(oApplSystem, oTargetObjDef, oInterfaceCxn, DIRECTION_OUT);
            }
        }
        var oInterfaceCxns_In = getInterfaceCxns_In(oApplSystem);    
        for (var j = 0; j < oInterfaceCxns_In.length; j++) {    
            var oInterfaceCxn = oInterfaceCxns_In[j];            
            var oSourceObjDef = getSourceApplSystem(oInterfaceCxn, p_oSelApplSystems, p_bOnlyBetween);
            
            if (oSourceObjDef != null) {
                writeDataAndProtocol(oApplSystem, oSourceObjDef, oInterfaceCxn, DIRECTION_IN);
            }
        }    
    }
    //g_rowData.sort(sortByColumns);
    return g_rowData;
}

function writeDataAndProtocol(p_oApplSystem_Src, p_oApplSystem_Trg, p_oInterfaceCxn, p_sDirection) {
    // check, if already in table
    if (checkRedundancy(p_oApplSystem_Src, p_oApplSystem_Trg)) {
        var bWritten = false;
        var oAssignedModels = getAssignedModels(p_oInterfaceCxn);
        
        for (var i = 0; i < oAssignedModels.length; i++) {
            var oAssignedModel = oAssignedModels[i];
            oProtocol = getProtocol(oAssignedModel, p_oApplSystem_Src, p_oApplSystem_Trg);    
            
            var oDataList = getDataList(oAssignedModel, p_oApplSystem_Src, p_oApplSystem_Trg);
            
            g_rowData.push(new ROW_TYPE(p_oApplSystem_Src, p_oApplSystem_Trg, oDataList, oProtocol, p_sDirection));
                bWritten = true;
            /*    
            for (var j = 0; j < oDataList.length; j++) {
                g_rowData.push(new ROW_TYPE(p_oApplSystem_Src, p_oApplSystem_Trg, oDataList[j], oProtocol, p_sDirection));
                bWritten = true;
            }
            */
        }
        if (!bWritten) {
            g_rowData.push(new ROW_TYPE(p_oApplSystem_Src, p_oApplSystem_Trg, null, null, p_sDirection));    
        }
    }
}

function getSourceApplSystem(p_oCxn,  p_oSelApplSystems, p_bOnlyBetween) {
    var oSourceObjDef = p_oCxn.SourceObjDef();
    if (oSourceObjDef.TypeNum() == Constants.OT_APPL_SYS_TYPE) {
        var bAdd = true;
        
        if (p_bOnlyBetween && (!isObjectInList(oSourceObjDef, p_oSelApplSystems))) {
            bAdd = false;
        }
        if (bAdd) {
            return oSourceObjDef;
        }
    }
    return null;
}

function getTargetApplSystem(p_oCxn,  p_oSelApplSystems, p_bOnlyBetween) {
    var oTargetObjDef = p_oCxn.TargetObjDef();
    if (oTargetObjDef.TypeNum() == Constants.OT_APPL_SYS_TYPE) {
        var bAdd = true;
        
        if (p_bOnlyBetween && (!isObjectInList(oTargetObjDef, p_oSelApplSystems))) {
            bAdd = false;
        }
        if (bAdd) {
            return oTargetObjDef;
        }
    }
    return null;
}

function getAssignedModels(p_oCxn) {
    var oAssignedModels = new Array();

    var oModels = p_oCxn.AssignedModels();
    for (var i = 0; i < oModels.length; i++) {
        var oModel = oModels[i];
        if (oModel.OrgModelTypeNum() == Constants.MT_PRG_STRCT_CHRT) {
            oAssignedModels.push(oModel);
        }
    }
    return oAssignedModels;
}

function getDataList(p_oModel, p_oApplSystem_Src, p_oApplSystem_Trg) {
    var oDataList = new Array();
    oDataList = oDataList.concat(getConnectedObjects_DataFlow(p_oModel, p_oApplSystem_Src, p_oApplSystem_Trg, Constants.OT_CLST));
    oDataList = oDataList.concat(getConnectedObjects_DataFlow(p_oModel, p_oApplSystem_Src, p_oApplSystem_Trg, Constants.OT_CLS));
    return oDataList;
}
    
function getProtocol(p_oModel, p_oApplSystem_Src, p_oApplSystem_Trg) {
    var oProtocolList = getConnectedObjects_DataFlow(p_oModel, p_oApplSystem_Src, p_oApplSystem_Trg, Constants.OT_NW_PROT);
    if (oProtocolList.length > 0) {
        return oProtocolList[0];
    }
    return null;
}
    
function getConnectedObjects_DataFlow(p_oModel, p_oApplSystem_Src, p_oApplSystem_Trg, p_nObjTypeNum) {    
    var oConnectedDefs = new Array();
    
    var oSourceOccs = getOccurencesInModel(p_oModel, p_oApplSystem_Src);
    var oTargetOccs = getOccurencesInModel(p_oModel, p_oApplSystem_Trg);    
    
    // get ObjOccs with rigth type    
    var oObjOccsWithType = new Array();
    var oObjOccs = p_oModel.ObjOccList();
    for (var i = 0; i < oObjOccs.length; i++) {
        if (oObjOccs[i].ObjDef().TypeNum() == p_nObjTypeNum) {
            oObjOccsWithType.push(oObjOccs[i]);
        }
    }
    // get ObjDefs which are connected with source and target
    for (var i = 0; i < oObjOccsWithType.length; i++) {
        var oCurrentOcc = oObjOccsWithType[i]
        if (checkConnection(p_oModel, oCurrentOcc, oSourceOccs) && checkConnection(p_oModel, oCurrentOcc, oTargetOccs)) {
            
            oConnectedDefs.push(oCurrentOcc.ObjDef());
        }
    }
    return oConnectedDefs;
}

function checkConnection(p_oModel, p_oObjOcc, p_oOccList2Check) {
    // In edges
    var oInEdges = p_oObjOcc.InEdges(Constants.EDGES_ALL);
    for (var i = 0; i < oInEdges.length; i++) {
        var oSourceObjOcc = oInEdges[i].SourceObjOcc();
        
        for (var j = 0; j < p_oOccList2Check.length; j++) {        
            if (oSourceObjOcc.IsEqual(p_oOccList2Check[j])) {
                return true;
            }
        }
    }
    // Out edges
    var oOutEdges = p_oObjOcc.OutEdges(Constants.EDGES_ALL);
    for (var i = 0; i < oOutEdges.length; i++) {
        var oTargetObjOcc = oOutEdges[i].TargetObjOcc();
        
        for (var j = 0; j < p_oOccList2Check.length; j++) {
            if (oTargetObjOcc.IsEqual(p_oOccList2Check[j])) {
                return true;
            }
        }
    }
    return false;
}
    
function getInterfaceCxns_Out(p_oApplSysType) {
    var oOutCxns_IF = new Array();
    var oOutCxns = p_oApplSysType.CxnList(Constants.EDGES_OUT);
    for (var i = 0; i < oOutCxns.length; i++) {
        var oOutCxn = oOutCxns[i];
        if (oOutCxn.TypeNum() == Constants.CT_SENDS_3) {
            oOutCxns_IF.push(oOutCxn);
        }
        
    }
    return oOutCxns_IF;
}

function getInterfaceCxns_In(p_oApplSysType) {
    var oInCxns_IF = new Array();
    var oInCxns = p_oApplSysType.CxnList(Constants.EDGES_IN);
    for (var i = 0; i < oInCxns.length; i++) {
        var oInCxn = oInCxns[i];
        if (oInCxn.TypeNum() == Constants.CT_SENDS_3) {
            oInCxns_IF.push(oInCxn);
        }
    }
    return oInCxns_IF;
}

function getOccurencesInModel(p_oModel, p_oObjDef) {
    return p_oObjDef.OccListInModel(p_oModel);
}

function getObjectGuid(p_objDef) {
    if (p_objDef == null) {
        return "00000000-0000-0000-0000-000000000000";
    }
    return p_objDef.GUID();
}

function getName(p_oItem) {
    if (p_oItem == null)
        return "";
    return p_oItem.Name(g_nLoc);
}

function getNames(p_oItemList) {
    var sNames = "";
    if (p_oItemList != null) {
        for (var i = 0; i < p_oItemList.length; i++) {
            if (sNames.length > 0) sNames += "\n";
            sNames += p_oItemList[i].Name(g_nLoc);
        }
    }
    return sNames;            
}

function sortByColumns(a,b) {
    var nCompare = sortByName(a.oSource, b.oSource);
    if (nCompare == 0) {
        nCompare = sortByName(a.oTarget, b.oTarget);
        if (nCompare == 0) {
            nCompare = sortByName(a.oInterface, b.oInterface);
            if (nCompare == 0) {
                nCompare = sortByName(a.oData, b.oData);
                if (nCompare == 0) {
                    nCompare = sortByName(a.oProtocol, b.oProtocol);
                }
            }
        }
    }
    return nCompare;
}

function sortByName(a,b) {
    var tmp_lhs = new java.lang.String(getName(a));
    return tmp_lhs.compareTo(new java.lang.String(getName(b)));
}

function isObjectInList(p_oObjDef, p_oObjDefList) {
    for (var i = 0; i < p_oObjDefList.length; i++) {
        if (p_oObjDef.IsEqual(p_oObjDefList[i])) {
            return true;
        }
    }
    return false;
}

function checkRedundancy(p_oApplSystem_Src, p_oApplSystem_Trg) {
    for (var i = 0; i < g_rowData.length; i++) {
        if (p_oApplSystem_Src.IsEqual(g_rowData[i].oTarget) && p_oApplSystem_Trg.IsEqual(g_rowData[i].oSource)) {
            // source and target are already in table: source as target, target as source
            return false;
        }
    }
    return true;
}

function getLegendPicture(pLCtext, pSCtext, p_sFont) {
    
    var oPicture = Context.createPicture();
    oPicture.SelectPen(Constants.PS_SOLID, 1, cCOLOR_Pen);
    oPicture.SetTextColor(cCOLOR_Pen);

    var xStart = 0;
    var yStart = 0;

    if (pLCtext != undefined) {
        // Lebenzyklus
        oPicture.SelectFont(300, p_sFont, Constants.FMT_BOLD);   
        oPicture.DrawText(pLCtext, xStart, yStart, xStart + 500, yStart + 50, Constants.DT_LEFT);                    
        oPicture.SelectFont(250, p_sFont, Constants.FMT_BOLD);       
        writeLegendEntry(oPicture, xStart, yStart + 75, cCOLOR_LC_Plan,      getNameOfAttrValue(cATV_LC_State_Plan));
        writeLegendEntry(oPicture, xStart, yStart + 150, cCOLOR_LC_Procure,   getNameOfAttrValue(cATV_LC_State_Procure));
        writeLegendEntry(oPicture, xStart, yStart + 225, cCOLOR_LC_Develop,   getNameOfAttrValue(cATV_LC_State_Develop));
        writeLegendEntry(oPicture, xStart, yStart + 300, cCOLOR_LC_Test,      getNameOfAttrValue(cATV_LC_State_Test));
        writeLegendEntry(oPicture, xStart, yStart + 375, cCOLOR_LC_Operation, getNameOfAttrValue(cATV_LC_State_Operation));
        writeLegendEntry(oPicture, xStart, yStart + 450, cCOLOR_LC_Deact,     getNameOfAttrValue(cATV_LC_State_Deact));
        writeLegendEntry(oPicture, xStart, yStart + 525, cCOLOR_LC_Offline,   getNameOfAttrValue(cATV_LC_State_IsDeact));
        
        var xStart = 700;
    }    
    if (pSCtext != undefined) {
        // Standardisierungszyklus
        oPicture.SelectFont(300, p_sFont, Constants.FMT_BOLD);   
        oPicture.DrawText(pSCtext, xStart, 0, xStart + 500, 50, Constants.DT_LEFT);                    
        oPicture.SelectFont(250, p_sFont, Constants.FMT_BOLD);           
        writeLegendEntry(oPicture, xStart, yStart + 75, cCOLOR_SC_NonStandard, getNameOfAttrValue(cATV_SC_State_NonStandard));        
        writeLegendEntry(oPicture, xStart, yStart + 150, cCOLOR_SC_Eval,        getNameOfAttrValue(cATV_SC_State_Eval));
        writeLegendEntry(oPicture, xStart, yStart + 225, cCOLOR_SC_Request,     getNameOfAttrValue(cATV_SC_State_Request));
        writeLegendEntry(oPicture, xStart, yStart + 300, cCOLOR_SC_PhasedIn,    getNameOfAttrValue(cATV_SC_State_PhasedIn));
        writeLegendEntry(oPicture, xStart, yStart + 375, cCOLOR_SC_Standard,    getNameOfAttrValue(cATV_SC_State_Standard));
        writeLegendEntry(oPicture, xStart, yStart + 450, cCOLOR_SC_Std_Ltd,     getNameOfAttrValue(cATV_SC_State_Std_Ltd));
        writeLegendEntry(oPicture, xStart, yStart + 525, cCOLOR_SC_PhasedOut,   getNameOfAttrValue(cATV_SC_State_PhasedOut));
        writeLegendEntry(oPicture, xStart, yStart + 600, cCOLOR_SC_NonStandard, getNameOfAttrValue(cATV_SC_State_IsPhasedOut));                
        writeLegendEntry(oPicture, xStart, yStart + 675, cCOLOR_SC_Refused,     getNameOfAttrValue(cATV_SC_State_Refused));
    }
 return oPicture;
}

function writeLegendEntry(p_oPicture, p_xPos, p_yPos, p_nColor, p_sState) {
    p_oPicture.SelectBrush(p_nColor);    
    p_oPicture.Rectangle(p_xPos, p_yPos, p_xPos + 100, p_yPos + 50);
    p_oPicture.DrawText("" + p_sState, p_xPos + 150, p_yPos, p_xPos + 700, p_yPos + 50, Constants.DT_LEFT | Constants.DT_VCENTER);                
}

function removeBlanks(sText) {
    return (""+sText).replace(/\s/g,'');
}

function toLowerCase(string) {
    if(string == null) return null;
    return (""+string).toLowerCase();
}

Array.prototype.containsModString = function(p_element)
{
 for(var i=0; i < this.length; i++)
  {
    if (removeblanks(toLowerCase(this[i].toString())).equals(removeblanks(toLowerCase(p_element.toString())))) return true;
  }
 return false;
};

