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
const SHOW_DIALOGS_IN_CONNECT = true;   // Show dialogs in ARIS Connect - Default=true (BLUE-12274)

/****************************************************/ 
const DEBUG = false;

// Colors
const c_BLACK   = RGB(  0,  0,  0);
const c_WHITE   = RGB(255,255,255);
const c_BG      = RGB(228,228,228);
const c_COLUMN  = RGB(239,249,253);
const c_BLUE    = RGB( 51,181,229);
const c_GREEN   = RGB(114,171, 22);
const c_ORANGE  = RGB(255,136,  0);
const c_RED     = RGB(255, 68, 68);
const c_TEXT    = RGB(120,120,120);
const c_TEXT_2  = RGB(144,144,144);
const c_LINE    = RGB(225,225,225);

// Symbols
var SYMBOL_PROCESS      = Context.createPicture("InternalProcesses.emf"); 
var SYMBOL_TP_NEGATIV   = Context.createPicture("NegativeTouchpoint.emf"); 
var SYMBOL_TP_NEUTRAL   = Context.createPicture("NeutralTouchpoint.emf"); 
var SYMBOL_TP_POSITIV   = Context.createPicture("PositiveTouchpoint.emf");
var SYMBOL_CF_NEGATIV   = Context.createPicture("Negative.emf"); 
var SYMBOL_CF_NEUTRAL   = Context.createPicture("Neutral.emf"); 
var SYMBOL_CF_POSITIV   = Context.createPicture("Positive.emf");
var SYMBOL_MOT          = Context.createPicture("MomentOfTruth.emf"); 
var SYMBOL_PP           = Context.createPicture("PainPoint.emf");
var SYMBOL_PP_2         = Context.createPicture("PainPointLarge.emf");
var SYMBOL_BP           = Context.createPicture("BestPractice.emf");
var SYMBOL_USER         = Context.createPicture("CustomersLarge.emf");

var MAX_COUNT_OF_JS = 8;    // Info message appears if number of journey steps exceeds this value

/*******************************************************************************************************************************/

// Dialog support depends on script runtime environment
var bDlgSupport = isDialogSupported(); 

var aProcessModelTypes = [Constants.MT_EEPC, Constants.MT_VAL_ADD_CHN_DGM];

DATA = function(oJourneyStep, oTouchpoint) {
    this.oJourneyStep = oJourneyStep;
    this.oTouchpoint  = oTouchpoint;
}

var oDB = ArisData.getActiveDatabase();
var filter = ArisData.ActiveFilter();
var nLoc = Context.getSelectedLanguage();
var oOut = Context.createOutputObject();

var oModels = getModels();
if (oModels.length > 0) {
    for (var i in oModels) {
        var oModel = oModels[i];
        var aData = getData(oModel);
        if (aData != null) {
            if (aData.length > MAX_COUNT_OF_JS)  outInfoMessage(oModel);
            
            outData(oModel, aData);
        }
    }        
} else {
    // BLUE-10824 Output empty result
    oOut.OutputLn(getString("EMPTY_SELECTION"), getString("FONT"), 12, Constants.C_RED, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
}
oOut.WriteReport();

/*******************************************************************************************************************************/
/*** OUT DATA ******************************************************************************************************************/
/*******************************************************************************************************************************/

function outData(oModel, aData) {
    var xSize = 4000;
    var ySize = 2800;
    
    var xMin  = 50;
    var xMax  = 3950;    

    var xColWidthOfHeader  = 500;   
    var yRowHeightOfHeader = 200;
    
    var nColCount          = aData.length;
    var xColWidth          = parseInt((xMax-xMin-xColWidthOfHeader)/nColCount);   
    var yRowHeight         = 150;
    
    var oPic = Context.createPicture();
    outBackgroundAndTitle();
    
    outPicture_1();    
    outPicture_2();    
    outPicture_3_1();
    outPicture_3_2();
    outPicture_3_3();
    outPicture_3_4();

    oOut.OutGraphic(oPic, -1, 400, 280);    
    
    /*******************************************************/
    /*** Out Background And Title **************************/
    /*******************************************************/

    function outBackgroundAndTitle() {
        outBackground(0, 0, xSize, ySize);
        
        var sName = oModel.Name(nLoc);
        var sOwner = getOwner();
        if (sOwner != "") sName += formatstring1(" (@1)", sOwner);
        outText(sName, xMin, 25, xMax, 100, Constants.DT_LEFT | Constants.DT_WORDBREAK, 600, getString("FONT"), 0, c_TEXT);  
        
        function getOwner() {
            var oAttr = oModel.Attribute(Constants.AT_CUSTOMER_JOURNEY_OWNER, nLoc, true);
            if (!oAttr.IsMaintained()) return "";
            return oAttr.GetValue(true);
        }
    }

    /*******************************************************/
    /*** Out Picture 1 *************************************/
    /*******************************************************/
    
    function outPicture_1() {
        var xStart = xMin;
        var yStart = 150;
        var xEnd   = xMax;
        var yEnd   = 1450;
        
        initPictureBackground(xStart, yStart, xEnd, yEnd);
        outHeaderRow();
        outHeaderColumn();
        outMarks()
        outLines();
        outTouchpoints();
        outBackground(0, yEnd, xSize, ySize);
        
        function outHeaderRow() {
            var xLeft = xStart + xColWidthOfHeader;
            var yTop  = yStart;
            var yBot  = yStart + yRowHeightOfHeader;    
            
            outBar(xStart, xLeft, c_TEXT_2);
            
            var tpCount = aData.length;
            for (var i = 0; i < aData.length; i++) {
                var xRight = (i < aData.length-1) ? xLeft + xColWidth : xEnd;               
                var tpColor = getTPColor(aData[i].oTouchpoint);
                outBar(xLeft, xRight, tpColor);
                
                var sName = aData[i].oJourneyStep.ObjDef().Name(nLoc);
                outText(sName, xLeft+10, yTop+20, xRight-10, yBot, Constants.DT_CENTER | Constants.DT_VCENTER | Constants.DT_WORDBREAK, 300, getString("FONT"), Constants.FMT_BOLD, tpColor);                     
                
                xLeft = xRight;
            }
            function outBar(xLeft, xRight, nColor) {
                oPic.SelectPen(Constants.PS_SOLID, 1, nColor);
                oPic.SelectBrush(nColor);
                oPic.Rectangle(xLeft, yTop, xRight, yTop+5);
            }
            
            function getTPColor(oTouchpoint) {
                if (oTouchpoint != null) {
                    var custFeeling = getCustomerFeeling(oTouchpoint);
                    if (custFeeling == -1) return c_RED;
                    if (custFeeling ==  0) return c_BLUE;
                    if (custFeeling ==  1) return c_GREEN;
                }
                return c_TEXT_2;
            }        
        }
        
        function outHeaderColumn() {
            var xLeft  = xMin;
            var xRight = xLeft + xColWidthOfHeader;
            var yTop   = yStart + yRowHeightOfHeader;
            var yBot   = yTop + yRowHeight;
            
            outHeaderCell(getString("POSITIVE"), SYMBOL_CF_POSITIV, c_GREEN);
            outHeaderCell(getString("NEUTRAL"), SYMBOL_CF_NEUTRAL, c_BLUE);
            outHeaderCell(getString("NEGATIVE"), SYMBOL_CF_NEGATIV, c_RED);    
            
            function outHeaderCell(sText, symbol, color) {    
                if (sText.length > 0) {
                    outSymbol_zoomed(symbol, 0.45, xLeft+40, yTop+42, false);
                    outText(sText, xLeft+140, yTop+55, xRight, yBot, Constants.DT_LEFT | Constants.DT_VCENTER | Constants.DT_WORDBREAK, 300, getString("FONT"), Constants.FMT_BOLD, color);
                }        
                yTop = yBot;
                yBot = yTop + yRowHeight;
            }
        }
        
        function outMarks() {
            var yPos = yStart + yRowHeightOfHeader;
            outMark(yPos);
            outMark(yPos + yRowHeight);
            outMark(yPos + 2*yRowHeight);
            outMark(yPos + 3*yRowHeight);
            
            function outMark(yPos) {
                oPic.SelectPen(Constants.PS_SOLID, 1, c_LINE);
                oPic.MoveTo(xMin, yPos);
                oPic.LineTo(xMax, yPos);
            }
        }
        
        function outLines() {
            outLinesOrSymbols(false/*bOutSymbol*/); 
        }
        
        function outTouchpoints() {
            outLinesOrSymbols(true/*bOutSymbol*/);
        }    
        
        function outLinesOrSymbols(bOutSymbol) {
            var xLeft, xRight, yTop, yBot;                      // undefined
            var xLineStart, xLineStop, yLineStart, yLineStop;   // undefined
            
            var xColStart = xStart + xColWidthOfHeader;
            
            for (var i = 0; i < aData.length; i++) {
                var oTouchpoint = aData[i].oTouchpoint;
                if (oTouchpoint != null) {
                    var symbol = getSymbol(oTouchpoint);
                    var symbolWidth = symbol.getWidth(Constants.SIZE_LOMETRIC);
                    var symbolHeight = symbol.getHeight(Constants.SIZE_LOMETRIC); 
                    
                    xLeft = xColStart + (xColWidth - symbolWidth)/2; 
                    xRight = xLeft + symbolWidth;
                    
                    yFactor = getVerticalPosFactor(oTouchpoint);
                    yTop = yStart + yRowHeightOfHeader + (yFactor * yRowHeight) + 10;
                    yBot = yTop + symbolHeight;    
                    
                    bOutSymbol ? outTpSymbol(oTouchpoint, symbol) : outLine();
                }
                xColStart += xColWidth;
            }
            
            function outLine() {
                xLineEnd = xLeft + (xRight - xLeft)/2;
                yLineEnd = yTop + (yBot - yTop)/2;
                
                if (xLineStart != null && yLineStart != null) {
                    oPic.SelectPen(Constants.PS_SOLID, 2, c_BLACK);
                    oPic.MoveTo(xLineStart, yLineStart);
                    oPic.LineTo(xLineEnd, yLineEnd);
                }            
                xLineStart = xLineEnd
                yLineStart = yLineEnd;
            }
            
            function outTpSymbol(oTouchpoint, p_symbol) {
                outSymbol_zoomed(p_symbol, 1.0, xLeft, yTop, true);
                outNameAndDescription();
                outIcons();
                
                function outIcons() {
                    var nPlacement = 0;     // 0:Left, 1: Right, 2: Not placed
                    outIcon(getSymbol_MomentOfTruth(oTouchpoint), 0.25, false);
                    outIcon(getSymbol_PainPoint(oTouchpoint), 0.25, true);
                    outIcon(getSymbol_BestPractice(oTouchpoint), 0.25, false);
                    
                    function outIcon(symbol, zoom, bFilled) {
                        if (symbol != null) {
                            if (nPlacement == 0) outSymbol_zoomed(symbol, zoom, xLeft-30, yBot-56, bFilled);     // Left placement
                            if (nPlacement == 1) outSymbol_zoomed(symbol, zoom, xRight-40, yBot-56, bFilled);    // Right placement
                            nPlacement++;
                        }
                    }
                }
                
                function outNameAndDescription() {
                    var xLeftText = xColStart;
                    var xRightText = xLeftText + xColWidth;
                    
                    var yTopText = yStart + yRowHeightOfHeader + (3*yRowHeight);
                    var yBotText = yEnd-50;    
                    
                    var symbol = getSymbolCF(oTouchpoint)
                    outSymbol_zoomed(symbol, 0.25, xLeftText+20, yTopText+57, false);
                    var sName = oTouchpoint.ObjDef().Name(nLoc);
                    var yHeight = outText(sName, xLeftText+75, yTopText+60, xRightText-20, yTopText+180, Constants.DT_LEFT | Constants.DT_WORDBREAK, 240, getString("FONT"), Constants.FMT_BOLD, getTextColor());
                    
                    var attrDesc = oTouchpoint.ObjDef().Attribute(Constants.AT_DESC, nLoc, true);
                    if (attrDesc.IsMaintained()) {
                        var sDesc = attrDesc.getValue();   
                        outText(sDesc, xLeftText+20, yTopText+180, xRightText-20, yBotText, Constants.DT_LEFT | Constants.DT_WORDBREAK, 240, getString("FONT"), 0, c_TEXT);
                    }
                    
                    function getTextColor() {
                        var custFeeling = getCustomerFeeling(oTouchpoint);
                        if (custFeeling == -1) return c_RED;
                        if (custFeeling ==  0) return c_BLUE;
                        if (custFeeling ==  1) return c_GREEN;
                    }
                }
            }

            function getVerticalPosFactor(oTouchpoint) {
                var custFeeling = getCustomerFeeling(oTouchpoint);
                if (custFeeling ==  1) return 0;
                if (custFeeling ==  0) return 1;
                if (custFeeling == -1) return 2;
            }
        }
    }

    /*******************************************************/
    /*** Out Picture 2 *************************************/
    /*******************************************************/
    
    function outPicture_2() {
        var xStart = xMin;
        var yStart = 1493;
        var xEnd   = xMax;
        var yEnd   = 1973;
        
        initPictureBackground(xStart, yStart, xEnd, yEnd);
        outAdditionalTouchpointAttrs();
        outBackground(0, yEnd, xSize, ySize);
        
        function outAdditionalTouchpointAttrs() {
            var xColStart = xStart + xColWidthOfHeader;

            var nPlacement = 0;
            for (var i = 0; i < aData.length; i++) {
                nPlacement = 0;
                var oTouchpoint = aData[i].oTouchpoint;
                if (isMomentOfTruth(oTouchpoint)) outTouchpointAttr(SYMBOL_MOT, 0.16, Constants.AT_DESCRIPTION_MOMENT_OF_TRUTH); 
                if (isPainPoint(oTouchpoint))     outTouchpointAttr(SYMBOL_PP, 0.16, Constants.AT_DESCRIPTION_PAIN_POINT); 
                if (isBestPractice(oTouchpoint))  outTouchpointAttr(SYMBOL_BP, 0.16,  null);

                xColStart += xColWidth;        
            }

            function outTouchpointAttr(symbol, zoom, nAttr) {
                var bFilled = (symbol == SYMBOL_PP);
                var xRight = xColStart + xColWidth;
                if (nPlacement == 0) {
                    outSymbol_zoomed(symbol, zoom, xColStart+20, yStart+12, bFilled);   // Top placement
                    outText(getSymbolText(), xColStart+75 , yStart+15, xRight-20, yStart+50, Constants.DT_LEFT | Constants.DT_VCENTER | Constants.DT_WORDBREAK, 250, getString("FONT"), Constants.FMT_BOLD, c_TEXT);
                    // BLUE-10950 	
                    if (nAttr != null) {
                        var oAttr = oTouchpoint.ObjDef().Attribute(nAttr, nLoc, true);
                        if (oAttr.IsMaintained()) {
                            var sDesc = oAttr.getValue();      
                            outText(sDesc, xColStart+20, yStart+70, xRight-20, yEnd-45, Constants.DT_LEFT | Constants.DT_WORDBREAK, 250, getString("FONT"), 0, c_TEXT);
                        }
                    }           		                
                }
                if (nPlacement == 1) {
                    outPictureBackground(i, xColStart, yEnd-50, xRight, yEnd);
                    outSymbol_zoomed(symbol, zoom, xColStart+20, yEnd-50, bFilled);     // Bottom placement
                    outText(getSymbolText(), xColStart+75 , yEnd-45, xRight-20, yEnd, Constants.DT_LEFT | Constants.DT_VCENTER | Constants.DT_WORDBREAK, 250, getString("FONT"), Constants.FMT_BOLD, c_TEXT);
                }
                nPlacement++;

                function getSymbolText() {
                    if (symbol == SYMBOL_MOT) return getString("MOMENT_OF_TRUTH");
                    if (symbol == SYMBOL_PP)  return getString("PAIN_POINT");
                    if (symbol == SYMBOL_BP)  return getString("BEST_PRACTICE");
                    return "";                    
                }
                
                function outPictureBackground(i, x1, y1, x2, y2) {
                    if (i % 2 == 0) {
                        oPic.SelectPen(Constants.PS_SOLID, 1, c_COLUMN);
                        oPic.SelectBrush(c_COLUMN);
                    } else {
                        oPic.SelectPen(Constants.PS_SOLID, 1, c_WHITE);
                        oPic.SelectBrush(c_WHITE);
                    }
                    oPic.Rectangle(x1, y1, x2, y2);
                }
            }
        }
    }

    /*******************************************************/
    /*** Out Picture 3.1 ***********************************/
    /*******************************************************/
    
    function outPicture_3_1() {
        var xStart = xMin;
        var yStart = 2016;
        var xEnd   = 722;
        var yEnd   = 2743;
        
        oPic.SelectPen(Constants.PS_SOLID, 1, c_WHITE);
        oPic.SelectBrush(c_WHITE);
        oPic.Rectangle(xStart, yStart, xEnd, yEnd);
        
        outSymbol_zoomed(SYMBOL_PP_2, 0.35, xStart+130, yStart+64, false);
        
        var percentage = calcPercentage();       
        var sPercentage = percentage + "%";
        outText(sPercentage, xStart+20, yStart+164, xEnd-20, yStart+384, Constants.DT_CENTER | Constants.DT_WORDBREAK, 1500, getString("FONT"), 0, c_BLUE);
        
        var sText = getString("TOUCHPOINTS_ARE_PAINPOINTS");
        outText(sText, xStart+20, yEnd-200, xEnd-20, yEnd-20, Constants.DT_CENTER | Constants.DT_WORDBREAK, 400, getString("FONT"), 0, c_TEXT_2);
        
        function calcPercentage() {
            var allCount = 0;
            var nCount = 0;
            for (var i in aData) {
                var oTouchpoint = aData[i].oTouchpoint;
                if (oTouchpoint != null) {
                    allCount++;
                    if (isPainPoint(oTouchpoint)) nCount++;
                }
            }
            if (allCount == 0) return 0;
            return parseInt(round2(nCount / allCount) * 100);
        }
    }

    /*******************************************************/
    /*** Out Picture 3.2 ***********************************/
    /*******************************************************/
    
    function outPicture_3_2() {
        var xStart = 744;
        var yStart = 2016;
        var xEnd   = 1394;
        var yEnd   = 2743;
        
        oPic.SelectPen(Constants.PS_SOLID, 1, c_WHITE);
        oPic.SelectBrush(c_WHITE);
        oPic.Rectangle(xStart, yStart, xEnd, yEnd);
        
        outSymbol_zoomed(SYMBOL_USER, 0.54, xStart+100, yStart+64, false);
        
        var percentage = calcPercentage();
        var sPercentage = percentage + "%";        
        outText(sPercentage, xStart+20, yStart+164, xEnd-20, yStart+384, Constants.DT_CENTER | Constants.DT_WORDBREAK, 1500, getString("FONT"), 0, c_BLUE);
        
        var sText = getString("CUSTOMERS_ARE_PLEASED")
        outText(sText, xStart+20, yEnd-200, xEnd-20, yEnd-20, Constants.DT_CENTER | Constants.DT_WORDBREAK, 400, getString("FONT"), 0, c_TEXT_2);
       
        function calcPercentage() {           
            var allCount = 0;
            var nCount = 0;
            for (var i in aData) {
                allCount++;
                if (isPleased(aData[i].oJourneyStep)) nCount++;
            }
            if (allCount == 0) return 0;
            return parseInt(round2(nCount / allCount) * 100);
        }
    }

    /*******************************************************/
    /*** Out Picture 3.3 ***********************************/
    /*******************************************************/
    
    function outPicture_3_3() {
        var xStart = 1416;
        var yStart = 2016;
        var xEnd   = 2088;
        var yEnd   = 2743;
        
        oPic.SelectPen(Constants.PS_SOLID, 1, c_WHITE);
        oPic.SelectBrush(c_WHITE);
        oPic.Rectangle(xStart, yStart, xEnd, yEnd);

        outSymbol_zoomed(SYMBOL_PROCESS, 0.5, xStart+100, yStart+130, false);

        var oPainPointDefs = getTouchpointDefs();
        var processCount = getProcessCount(oPainPointDefs);
        outText(processCount, xStart+20, yStart+164, xEnd-20, yStart+384, Constants.DT_CENTER | Constants.DT_WORDBREAK, 1500, getString("FONT"), 0, c_BLUE);
        
        var sText = getString("PROCESSES_ARE_AFFECTED");
        outText(sText, xStart+20, yEnd-250, xEnd-20, yEnd-20, Constants.DT_CENTER | Constants.DT_WORDBREAK, 400, getString("FONT"), 0, c_TEXT_2);
 
        function getProcessCount(oPainPointDefs) {
			// BLUE-13111 Finding of affected processes updated
            var oModels = ArisData.createTypedArray(Constants.CID_MODEL);
            
            for (var i in oPainPointDefs) {
                var oOutCxns = oPainPointDefs[i].CxnListFilter(Constants.EDGES_OUT, Constants.CT_IS_RELATED_TO_1);  // BLUE-13111
                for (var j in oOutCxns) {
                    var oOutCxn = oOutCxns[j];
                    if (oOutCxn.OccList().length == 0) continue;     // Ignore cxn without occurrence(s) in model
                    
                    var oProcDef = oOutCxn.TargetObjDef();
                    var oOccList = oProcDef.OccList();
                    for (var k in oOccList) {
                        oModels.push(oOccList[k].Model());
                    }
                }
            }
            return ArisData.Unique(filterProcessModels(oModels)).length;
            
            function filterProcessModels(oModels) {
                var oProcModels = ArisData.createTypedArray(Constants.CID_MODEL);
                for (var i in oModels) {
                    if (isProcessModel(oModels[i])) {
                        oProcModels.push(oModels[i]);
                    }
                }
                return oProcModels;
                
                function isProcessModel(oModel) {
                    for (var i in aProcessModelTypes) {
                        if (oModel.TypeNum() == aProcessModelTypes[i]) return true;
                    }
                    return false;
                }
            }
        }
        
        function getTouchpointDefs() {
            var oPainPointDefs = new Array();
            for (var i in aData) {
                var oTouchpoint = aData[i].oTouchpoint;
                if (oTouchpoint == null) continue;              // BLUE-12914
                //if (isPainPoint(oTouchpoint)) {
                    oPainPointDefs.push(oTouchpoint.ObjDef());
                //}
            }
            return oPainPointDefs;
        }        
    }

    /*******************************************************/
    /*** Out Picture 3.4 ***********************************/
    /*******************************************************/
    
    function outPicture_3_4() {
        var xStart = 2110;
        var yStart = 2016;
        var xEnd   = xMax;
        var yEnd   = 2743;
        
        oPic.SelectPen(Constants.PS_SOLID, 1, c_WHITE);
        oPic.SelectBrush(c_WHITE);
        oPic.Rectangle(xStart, yStart, xEnd, yEnd);
        
        var oTouchpoints = getTouchpointsWithImportanceOrFeeling();
      
        var sText = getString("IMPORTANCE_AND_FEELINGS");
        if (oTouchpoints.length > 10) sText += " " + getString("TOP_10")
        outText(sText, xStart+47,  yStart+40, xEnd, yStart+100, Constants.DT_LEFT | Constants.DT_WORDBREAK, 400, getString("FONT"), Constants.FMT_BOLD, c_TEXT_2);     

        //Legend    
        oPic.SelectPen(Constants.PS_SOLID, 1, c_BLUE);
        oPic.SelectBrush(c_BLUE);
        oPic.Rectangle(xEnd-600, yStart+50, xEnd-580, yStart+70);       
        outText(getString("FEELINGS"), xEnd-570,  yStart+40, xEnd-400, yStart+100, Constants.DT_LEFT | Constants.DT_WORDBREAK, 250, getString("FONT"), Constants.FMT_BOLD, c_BLUE);
        oPic.SelectPen(Constants.PS_SOLID, 1, c_ORANGE);
        oPic.SelectBrush(c_ORANGE);
        oPic.Rectangle(xEnd-300, yStart+50, xEnd-280, yStart+70);       
        outText(getString("IMPORTANCE"), xEnd-270,  yStart+40, xEnd, yStart+100, Constants.DT_LEFT | Constants.DT_WORDBREAK, 250, getString("FONT"), Constants.FMT_BOLD, c_ORANGE);
    
        var x1 = xStart+47;
        var y1 = yStart+150;
        var xWidth = (oTouchpoints.length > 5) ? 775 : 1745;
        
        for (var i = 0; i <oTouchpoints.length; i++) {
            if (i == 10) break;
            
            var oTouchpoint = oTouchpoints[i];

            var sName = oTouchpoint.ObjDef().Name(nLoc);
            outText(sName, x1, y1, x1+xWidth, y1+=45, Constants.DT_LEFT | Constants.DT_WORDBREAK, 250, getString("FONT"), 0, c_TEXT_2);
            
            oPic.SelectPen(Constants.PS_SOLID, 1, c_BLUE);
            oPic.SelectBrush(c_BLUE);
            var feeling = getFeeling(oTouchpoint);          // BLUE-10780
            
            var x2 = x1 + calcWidth(feeling/3, xWidth);
            oPic.Rectangle(x1, y1, x2, y1+=22);
            
            oPic.SelectPen(Constants.PS_SOLID, 1, c_ORANGE);
            oPic.SelectBrush(c_ORANGE);            
            var importance = getImportance(oTouchpoint);    // BLUE-10780
            var x2 = x1 + calcWidth(importance/3, xWidth);
            y1+=2; //Otherwise rectangles are overlapping
            oPic.Rectangle(x1, y1, x2, y1+=22);
            
            y1+=20;
            
            if (i == 4) {
                x1 = xStart+970;
                y1 = yStart+150;
            }
        }

        function getTouchpointsWithImportanceOrFeeling() {
            var oTouchpointsWithImportanceOrFeeling = new Array();
            for (var i in aData) {
                var oTouchpoint = aData[i].oTouchpoint;
                if (oTouchpoint == null) continue;
                //if (getImportance(oTouchpoint) == 0) continue;
                //if (getFeeling(oTouchpoint) == 0) continue;
                
                oTouchpointsWithImportanceOrFeeling.push(oTouchpoint);
            }
            return oTouchpointsWithImportanceOrFeeling.sort(sortImportanceAndFeeling);
            
            function sortImportanceAndFeeling(occA, occB) {
                var impAndFeelA = getImportance(occA) + getFeeling(occA);
                var impAndFeelB = getImportance(occB) + getFeeling(occB);

                return impAndFeelB - impAndFeelA;
            }
        }        
        
        function getImportance(oTouchpoint) {
            if (oTouchpoint != null) {
                var attr = oTouchpoint.ObjDef().Attribute(Constants.AT_IMPORTANCE_TO_CUSTOMER, nLoc, true);
                if (attr.IsMaintained()) {
                    switch (attr.MeasureUnitTypeNum()) {
                        case Constants.AVT_HIGH:  return 3;        
                        case Constants.AVT_AVG:   return 2;
                        case Constants.AVT_LOW_1: return 1;
                    }
                }
            }
            return 0;
        }
        
        function getFeeling(oTouchpoint) {
            if (oTouchpoint != null) {
                var attr = oTouchpoint.ObjDef().Attribute(Constants.AT_CUSTOMER_FEELING, nLoc, true);
                if (attr.IsMaintained()) {
                    switch (attr.MeasureUnitTypeNum()) {
                        case Constants.AVT_POSITIVE: return 3;
                        case Constants.AVT_NEUTRAL:  return 2;
                        case Constants.AVT_NEGATIVE: return 1;        
                    }
                }
            }
            return 0;
        }
        
        function calcWidth(nFactor, nWidth) {
            if (nFactor > 0) return nFactor * nWidth;
            return 5;
        }
    }     

    /*******************************************************/
    /*** Common ********************************************/
    /*******************************************************/

    function initPictureBackground(xStart, yStart, xEnd, yEnd) {
        oPic.SelectPen(Constants.PS_SOLID, 1, c_WHITE);
        oPic.SelectBrush(c_WHITE);
        oPic.Rectangle(xStart, yStart, xEnd, yEnd);
        
        var xPosStart = xStart + xColWidthOfHeader;
        for (var i = 0; i < nColCount; i++) {
            if (i % 2 == 0) {
                oPic.SelectPen(Constants.PS_SOLID, 1, c_COLUMN);
                oPic.SelectBrush(c_COLUMN);
            } else {
                oPic.SelectPen(Constants.PS_SOLID, 1, c_WHITE);
                oPic.SelectBrush(c_WHITE);
            }
            var xPosEnd = (i < nColCount-1) ? xPosStart + xColWidth : xEnd;
            oPic.Rectangle(xPosStart, yStart, xPosEnd, yEnd);
            xPosStart = xPosEnd;
        }
    }

    function outBackground(x1, y1, x2, y2) {
        oPic.SelectPen(Constants.PS_SOLID, 1, c_BG);
        oPic.SelectBrush(c_BG);
        oPic.Rectangle(x1, y1, x2, y2);
    }
    
    function getSymbol(oTouchpoint) {
        var custFeeling = getCustomerFeeling(oTouchpoint);
        if (custFeeling == -1) return SYMBOL_TP_NEGATIV; 
        if (custFeeling ==  0) return SYMBOL_TP_NEUTRAL; 
        if (custFeeling ==  1) return SYMBOL_TP_POSITIV;
    }

    function getSymbolCF(oTouchpoint) {
        var custFeeling = getCustomerFeeling(oTouchpoint);
        if (custFeeling == -1) return SYMBOL_CF_NEGATIV; 
        if (custFeeling ==  0) return SYMBOL_CF_NEUTRAL; 
        if (custFeeling ==  1) return SYMBOL_CF_POSITIV;
    }
    
    function getSymbol_MomentOfTruth(oTouchpoint) {
        if (isMomentOfTruth(oTouchpoint)) return SYMBOL_MOT;
        return null;
    }

    function getSymbol_PainPoint(oTouchpoint) {
        if (isPainPoint(oTouchpoint)) return SYMBOL_PP;
        return null;
    }

    function getSymbol_BestPractice(oTouchpoint) {
        if (isBestPractice(oTouchpoint)) return SYMBOL_BP;
        return null;
    }
    
    function isMomentOfTruth(oTouchpoint) {
        if (oTouchpoint == null) return false;
        var oAttr = oTouchpoint.ObjDef().Attribute(Constants.AT_MOMENT_OF_TRUTH, nLoc, true);
        return (oAttr.IsMaintained() && oAttr.MeasureUnitTypeNum() == Constants.AVT_ONE);
    }
    
    function isPainPoint(oTouchpoint) {
        if (oTouchpoint == null) return false;
        var oAttr = oTouchpoint.ObjDef().Attribute(Constants.AT_PAIN_POINT, nLoc, true);
        return (oAttr.IsMaintained() && oAttr.MeasureUnitTypeNum() == Constants.AVT_ONE);
    }
    
    function isBestPractice(oTouchpoint) {
        if (oTouchpoint == null) return false;
        var oAttr = oTouchpoint.ObjDef().Attribute(Constants.AT_BEST_PRACTICE, nLoc, true);
        return (oAttr.IsMaintained() && oAttr.MeasureUnitTypeNum() == Constants.AVT_ONE);
    }    
    
    function isPleased(oJourneyStep) {
        var oAttr = oJourneyStep.ObjDef().Attribute(Constants.AT_OVERALL_CUSTOMER_EXPERIENCE, nLoc, true);
        return (oAttr.IsMaintained() && oAttr.MeasureUnitTypeNum() == Constants.AVT_PLEASED);
    }
    
    function outSymbol_zoomed(symbol, zoom, xLeft, yTop, bFilled) {
        var symbolWidth = symbol.getWidth(Constants.SIZE_LOMETRIC);
        var symbolHeight = symbol.getHeight(Constants.SIZE_LOMETRIC);
        
        var xRight = xLeft + symbolWidth*zoom;
        var yBot = yTop + symbolHeight*zoom;
        
        if (bFilled) {
            oPic.SelectPen(Constants.PS_SOLID, 1, c_WHITE);
            oPic.SelectBrush(c_WHITE);
            oPic.Ellipse(xLeft, yTop, xRight, yBot); 
        }
        oPic.Insert(symbol, xLeft, yTop, xRight, yBot, ""/*p_sFormat*/); 
    }
       
    function outText(sText, x1, y1, x2, y2, format, fontSize, fontName, fontStyle, color) {
        if (DEBUG) {
            oPic.SelectPen(Constants.PS_SOLID, 1, c_RED);
            oPic.SelectBrush(c_WHITE);
            oPic.Rectangle(x1, y1, x2, y2);        
        }
        oPic.SelectFont(fontSize, fontName, fontStyle);
        oPic.SetTextColor(color);
        return oPic.DrawText(sText, x1, y1, x2, y2, format);
    }

    function getCustomerFeeling(oTouchpoint) {
        if (oTouchpoint == null) return null;    
        var attr = oTouchpoint.ObjDef().Attribute(Constants.AT_CUSTOMER_FEELING, nLoc, true);
        if (attr.IsMaintained()) {
            switch (attr.MeasureUnitTypeNum()) {
                case Constants.AVT_POSITIVE: return  1;
                case Constants.AVT_NEUTRAL:  return  0;
                case Constants.AVT_NEGATIVE: return -1;        
            }
        }
        return 0;
    }
}

/*******************************************************************************************************************************/
/*** GET DATA ******************************************************************************************************************/
/*******************************************************************************************************************************/

function getData(oModel) {
    var aData = new Array();
    var oJourneySteps = getJourneySteps(oModel);
    for (var i in oJourneySteps) {
        var oJourneyStep = oJourneySteps[i];
        var oTouchpoints = getTouchpoints(oJourneyStep);
        
        var oTouchpoint = (oTouchpoints.length > 0) ? oTouchpoints[0] : null;
        aData.push(new DATA(oJourneyStep, oTouchpoint));
        
        if (oTouchpoints.length > 1) {
            var sTitle = Context.getScriptInfo(Constants.SCRIPT_TITLE);
            var sText = formatstring1(getString("MORE_THAN_ONE_TOUCHPOINT"), oModel.Name(nLoc));
            if (bDlgSupport) Dialogs.MsgBox(sText, Constants.MSGBOX_ICON_WARNING | Constants.MSGBOX_BTN_OK, sTitle);
            Context.writeLog(sText);
        }
    }
    return aData;

    function getJourneySteps(oModel) {
        var oJourneySteps = new Array();
        
        var oObjOccs = oModel.ObjOccListFilter(Constants.OT_CUSTOMER_JOURNEY_STEP);
        for (var i in oObjOccs) {
            oJourneySteps.push(oObjOccs[i]);
        }
        return oJourneySteps.sort(sortX);
        
        function sortX(occA, occB) { return occA.X() - occB.X(); }
    }
    
    function getTouchpoints(oJourneyStep) {
        var oTouchpoints = new Array();
        
        var oCxns = oJourneyStep.Cxns(Constants.EDGES_IN);
        for (var i in oCxns) {
            var oSrcOcc = oCxns[i].SourceObjOcc();
            if (oSrcOcc.ObjDef().TypeNum() == Constants.OT_CUSTOMER_TOUCHPOINT) {
                oTouchpoints.push(oSrcOcc);
            }
        }
        return ArisData.sort(oTouchpoints, Constants.SORT_Y, nLoc);
    }    
}

function getModels() {
    // Models selected
    var selectedModels = ArisData.getSelectedModels();
    if (selectedModels.length > 0) {
        return filterCustomerJourneyMap(selectedModels);
    }
    // ObjDefs selected
    if (ArisData.getSelectedObjDefs().length > 0) {
        return getAssignedModels();
    }
    // Groups selected    // BLUE-10824 Context extended (+ group)
    selectedModels = new Array();    
    var selectedGroups = ArisData.getSelectedGroups();
    for (var i = 0; i < selectedGroups.length; i++) {
        selectedModels = selectedModels.concat(selectedGroups[i].ModelList());
    }
    return filterCustomerJourneyMap(selectedModels);
    
    function getAssignedModels() {
        var oAssignedModels = new Array();
        var selectedObjects = ArisData.getSelectedObjDefs();
        for (var i in selectedObjects) {
            var oObjDef = selectedObjects[i];
            if (oObjDef.TypeNum() != Constants.OT_CUSTOMER_JOURNEY) continue;
            
            var oCurrAssModels = oObjDef.AssignedModels(Constants.MT_CUSTOMER_JOURNEY_MAP);
            if (oCurrAssModels.length > 0) {
                oAssignedModels = oAssignedModels.concat(oCurrAssModels);
            }
        }
        return oAssignedModels;
    }
        
    function filterCustomerJourneyMap(oModels) {
        var filteredModels = new Array();
        
        for (var i in oModels) {
            var oModel = oModels[i];
            if (oModel.TypeNum() == Constants.MT_CUSTOMER_JOURNEY_MAP) {
                filteredModels.push(oModel);
            }
        }
        return filteredModels;
    }
}

function RGB(r, g, b) {
    return (new java.awt.Color(r/255.0,g/255.0,b/255.0,1)).getRGB() & 0xFFFFFF;
}

function outInfoMessage(oModel) {
    var sText = formatstring2(getString("MAX_COUNT_EXCEEDED"), oModel.Name(nLoc), MAX_COUNT_OF_JS);
    if (bDlgSupport) Dialogs.MsgBox(sText, Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_INFORMATION, Context.getScriptInfo(Constants.SCRIPT_TITLE));
    Context.writeLog(sText);
}

function isDialogSupported() {
    // Dialog support depends on script runtime environment (STD resp. BP, TC)
    var env = Context.getEnvironment();
    if (env.equals(Constants.ENVIRONMENT_STD)) return true;
    if (env.equals(Constants.ENVIRONMENT_TC)) return SHOW_DIALOGS_IN_CONNECT;
    return false;
}
