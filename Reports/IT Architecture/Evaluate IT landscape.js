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

var activeDatabase = ArisData.getActiveDatabase();
var g_oFilter = ArisData.ActiveFilter();
var g_nLoc = Context.getSelectedLanguage();
var g_oPsmConfig = new psmConfig(false/*p_bMacro*/);

// --- Lebenzyklus ---    

var cAT_OP_State   = Constants.AT_SYSTEM_STATE;                // Systemstatus 
var cAT_sOP_State = g_oFilter.AttrTypeName(cAT_OP_State); 

var aOP_StateTypes = [Constants.AVT_SYSTEM_STATE_PLAN, Constants.AVT_SYSTEM_STATE_PROCURE, 
                      Constants.AVT_SYSTEM_STATE_DEV, Constants.AVT_SYSTEM_STATE_TEST, 
                      Constants.AVT_SYSTEM_STATE_RUNNING, Constants.AVT_SYSTEM_STATE_SHUTTING_DOWN, 
                      Constants.AVT_SYSTEM_STATE_SHUT_DOWN];
                      
var aOP_States = getTypeValueNames(cAT_OP_State,aOP_StateTypes);   

var cCOLOR_OP_Plan          = getColor4RGB(255, 255, 153);             // yellow1
var cCOLOR_OP_Procure       = getColor4RGB(255, 255,   0);             // yellow2
var cCOLOR_OP_Develop       = getColor4RGB(255, 204,   0);             // yellow3
var cCOLOR_OP_Test          = getColor4RGB(204, 255, 204);             // green1
var cCOLOR_OP_Operation     = getColor4RGB(  0, 255,   0);             // green2
var cCOLOR_OP_Deact         = getColor4RGB(255, 102,   0);             // orange1
var cCOLOR_OP_Offline       = getColor4RGB(255,   0,   0);             // red

var aOP_StateColor = [cCOLOR_OP_Plan, cCOLOR_OP_Procure,
                      cCOLOR_OP_Develop, cCOLOR_OP_Test,
                      cCOLOR_OP_Operation, cCOLOR_OP_Deact,
                      cCOLOR_OP_Offline];

// --- Standardisierungszyklus ---

var cAT_LC_STATE   = Constants.AT_STATUS_STANDARDIZATION;      // Status der Standardisierung
var cAT_sLC_State = g_oFilter.AttrTypeName(cAT_LC_STATE); 

var aLC_STATETypes = [Constants.AVT_STATUS_STANDARDIZATION_NON_STANDARD, Constants.AVT_STATUS_STANDARDIZATION_IN_EVALUATION,
                      Constants.AVT_STATUS_STANDARDIZATION_REQ_FOR_STANDARD, Constants.AVT_STATUS_STANDARDIZATION_TO_BE_PHASED_IN,
                      Constants.AVT_STATUS_STANDARDIZATION_IS_STANDARD,Constants.AVT_STATUS_STANDARDIZATION_STANDARD_LTD_USE,
                      Constants.AVT_STATUS_STANDARDIZATION_TO_BE_PHASED_OUT, Constants.AVT_STATUS_STANDARDIZATION_IS_PHASED_OUT,
                      Constants.AVT_STATUS_STANDARDIZATION_REFUSED];
                      
var c_iCONTEXT_ALL = 1;
var c_iCONTEXT_SINGLE = 2;
var c_iCONTEXT_QUADRANT = 3;
var c_iCONTEXT_AE = 4;
var c_iCONTEXT_SE = 5;
var c_iCONTEXT_ROWHEADER = 6;
var c_iCONTEXT_COLHEADER = 7;
                      
var aLC_STATEs = getTypeValueNames(cAT_LC_STATE,aLC_STATETypes);

var cCOLOR_LC_NonStandard   = getColor4RGB(255,   0,   0);             // red
var cCOLOR_LC_Eval          = getColor4RGB(255, 255, 153);             // yellow1
var cCOLOR_LC_Request       = getColor4RGB(255, 255,   0);             // yellow2
var cCOLOR_LC_PhasedIn      = getColor4RGB(130, 255, 130);             // green1
var cCOLOR_LC_Standard      = getColor4RGB(  0, 255,   0);             // green2
var cCOLOR_LC_Std_Ltd       = getColor4RGB(  0, 180,   0);             // blue --> dark green getColor4RGB( 51, 102, 255)
var cCOLOR_LC_PhasedOutToBe = getColor4RGB(255, 153,   0);             // orange1
var cCOLOR_LC_PhasedOutAsIs = getColor4RGB(255, 100,   0);             // orange2
var cCOLOR_LC_Refused       = getColor4RGB(255,   0,   0);             // red

var aLC_STATEColor = [cCOLOR_LC_NonStandard,cCOLOR_LC_Eval, 
                      cCOLOR_LC_Request, cCOLOR_LC_PhasedIn,
                      cCOLOR_LC_Standard , cCOLOR_LC_Std_Ltd,
                      cCOLOR_LC_PhasedOutToBe, cCOLOR_LC_PhasedOutAsIs,
                      cCOLOR_LC_Refused];
                      
var cOT_sSystem = getString("SYSTEM");//g_oFilter.ObjTypeName(Constants.OT_APPL_SYS_TYPE);
var cOT_sArchElmt = g_oFilter.ObjTypeName(Constants.OT_ARCH_ELEMENT);
var cOT_sStructElmt = g_oFilter.ObjTypeName(Constants.OT_STRCT_ELMT);

chart_main()  

function chart_main() {
    var oChartOption = Dialogs.showDialog(new chartOptionDialog(), Constants.DIALOG_TYPE_PROPERTY, getString("OPTIONS4CHART"));
    if (oChartOption==null) return
    if (oChartOption.isChartRequested()){   
        var aChartArray = new Array();
        var chartCreator = new chartCreatorClass();
        
        var inputObj = new getInputSelection();
        
        inputObj.setAllocCheck();        
        var allocMapper = new allocationMapper(inputObj);
        var uniquer = new uniqueName();    
        
        if (oChartOption.oBarChartComplete.bBarChart1){
            var chartData = new chartDataCollectorClass(cAT_LC_STATE,aLC_STATETypes,aLC_STATEColor);
        }
        if (oChartOption.oBarChartSingle.bBarChart1 || oChartOption.oBarChartSingle.bPieChart){
            var chartDataAST = new chartDataCollectorClass(cAT_LC_STATE,aLC_STATETypes,aLC_STATEColor);
        }
        if (oChartOption.oBarChartQuad.bBarChart1){
            var chartDataQuadrant = new chartDataCollectorClass(cAT_LC_STATE,aLC_STATETypes,aLC_STATEColor);
        }    
        if (oChartOption.oBarChartArch.bBarChart1){
            var chartDataArchElmt = new chartDataCollectorClass(cAT_LC_STATE,aLC_STATETypes,aLC_STATEColor);
        }    
        if (oChartOption.oBarChartArch.bBarChart2){
            var chartDataStructElmt = new chartDataCollectorClass(cAT_LC_STATE,aLC_STATETypes,aLC_STATEColor);
        }    
        if (oChartOption.oBarChartITPlan.bBarChart1){
            var chartDataRowHeader = new chartDataCollectorClass(cAT_LC_STATE,aLC_STATETypes,aLC_STATEColor);
        }    
        if (oChartOption.oBarChartITPlan.bBarChart2){
            var chartDataColHeader = new chartDataCollectorClass(cAT_LC_STATE,aLC_STATETypes,aLC_STATEColor);
        }        
        if (oChartOption.oBarChartComplete.bBarChart1 || oChartOption.oBarChartSingle.bBarChart1 || oChartOption.oBarChartSingle.bPieChart || 
            oChartOption.oBarChartQuad.bBarChart1 || oChartOption.oBarChartArch.bBarChart1 ||  oChartOption.oBarChartArch.bBarChart2|| 
                oChartOption.oBarChartITPlan.bBarChart1 || oChartOption.oBarChartITPlan.bBarChart2){        
            var aComponentCxns = inputObj.getComponentCxns();    
            for (var i = 0; i<aComponentCxns.length;i++){
                var oComponentCxn = aComponentCxns[i];
                var oSource = oComponentCxn.SourceObjDef();
                var oTarget = oComponentCxn.TargetObjDef();
                var oCompState = getValue(oTarget, cAT_LC_STATE);
                
                if (oChartOption.oBarChartComplete.bBarChart1){
                    chartData.countAttrValue(oSource.Name(g_nLoc,true),oTarget,cAT_LC_STATE);
                }                  
                if (oChartOption.oBarChartSingle.bBarChart1 || oChartOption.oBarChartSingle.bPieChart){
                    chartDataAST.countAttrValue(oSource.Name(g_nLoc,true),oTarget,cAT_LC_STATE);
                }    
                if (oChartOption.oBarChartQuad.bBarChart1){
                    var oQuadrant = inputObj.getQuadrant([oSource]);
                    if (oQuadrant != null) {
                        var oQuadrantName = getValue(oQuadrant,Constants.AT_QUADRANT);
                        chartDataQuadrant.countValue(oQuadrantName,oCompState);
                    }    
                }    
                if (oChartOption.oBarChartArch.bBarChart1){
                    var oArchElmt = inputObj.getArchitectureElement(oTarget);
                    var oArchElmtName = getTextAttr(oArchElmt,Constants.AT_NAME);
                    chartDataArchElmt.countValue(oArchElmtName,oCompState);     
                }    
                if (oChartOption.oBarChartArch.bBarChart2){
                    var oStructElemt = getStrucElement(oArchElmt,inputObj);
                    var oStructElemtName = getTextAttr(oStructElemt,Constants.AT_NAME);
                    chartDataStructElmt.countValue(oStructElemtName,oCompState);
                }  
                 
                if (oChartOption.oBarChartITPlan.bBarChart1){
                    var aHeaders = allocMapper.getRowHeaders4Alloc(oSource);
                    for (var j=0; j<aHeaders.length;j++){
                        var oHeaderName = uniquer.getUniqueName(aHeaders[j]); 
                        chartDataRowHeader.countValue(oHeaderName,oCompState);
                    }   
                }   
                if (oChartOption.oBarChartITPlan.bBarChart2){ 
                    var aHeaders = allocMapper.getColHeaders4Alloc(oSource);
                    for (var j=0; j<aHeaders.length;j++){
                        var oHeaderName = uniquer.getUniqueName(aHeaders[j]); 
                        chartDataColHeader.countValue(oHeaderName,oCompState);
                    }  
                }    
            }  
        } 
        
        if (oChartOption.oBarChartQuad.bBarChart2){
            var chartDataQuadrantOC = new chartDataCollectorClass(cAT_OP_State,aOP_StateTypes,aOP_StateColor);
        }                
        if (oChartOption.oBarChartComplete.bBarChart2 || oChartOption.oBarChartSingle.bBarChart2 ||oChartOption.oBarChartQuad.bBarChart2){                   
            var aSystemInstances = inputObj.getSystemInstances();                      
            var chartDataOC = new chartDataCollectorClass(cAT_OP_State,aOP_StateTypes, aOP_StateColor);          
            var chartData4ASTOC = new chartDataCollectorClass(cAT_OP_State,aOP_StateTypes, aOP_StateColor);
            for (var i = 0; i<aSystemInstances.length;i++){                
                var oSystem = aSystemInstances[i][0];
                var oSystemInstance = aSystemInstances[i][1];
                chartDataOC.countAttrValue(oSystem.Name(g_nLoc,true),oSystemInstance,cAT_OP_State);   
                chartData4ASTOC.countAttrValue(oSystem.Name(g_nLoc,true),oSystemInstance,cAT_OP_State);                 
                if (oChartOption.oBarChartQuad.bBarChart2){
                    var oQuadrant = inputObj.getQuadrant([oSystem]);                    
                    if (oQuadrant != null) {
                        var oQuadrantName = getValue(oQuadrant,Constants.AT_QUADRANT);
                        chartDataQuadrantOC.countValue(oQuadrantName,getValue(oSystemInstance, cAT_OP_State));
                    }    
                }  
            }    
        }       
        if (oChartOption.oBarChartComplete.bBarChart1){
            chartCreator.setChartDetailType(oChartOption.oBarChartComplete.iBarChartType);    
            chartCreator.setTitle(oChartOption.oBarChartComplete.sTitle);
            chartCreator.setDataPercent(oChartOption.oBarChartComplete.bDataPercent);               
            if (oChartOption.oBarChartComplete.bDataPercent) chartCreator.setYAxisTitle(getString("PERCENT_OF_COMP"));
            else chartCreator.setYAxisTitle(getString("NUMBER_OF_COMP"));
            chartCreator.setMaxBars(oChartOption.oBarChartComplete.iMaxBars);    
            chartCreator.setDataReverse(oChartOption.oBarChartComplete.bDataReverse);
            if (oChartOption.oBarChartComplete.bDataReverse) chartCreator.setXAxisTitle(cAT_sLC_State);
            else chartCreator.setXAxisTitle(cOT_sSystem);
            var aCharts = chartCreator.getBarCharts(chartData);
            aChartArray.push(new charts4(aCharts, getString("OPT_SELECTION"), getString("CHART4STD"), oChartOption.oBarChartComplete.getDescription(aCharts.length, c_iCONTEXT_ALL, cAT_LC_STATE)));
        }                    
        if (oChartOption.oBarChartComplete.bBarChart2){
            chartCreator.setChartDetailType(oChartOption.oBarChartComplete.iBarChartType);    
            chartCreator.setTitle(oChartOption.oBarChartComplete.sTitle);
            chartCreator.setDataPercent(oChartOption.oBarChartComplete.bDataPercent);               
            if (oChartOption.oBarChartComplete.bDataPercent) chartCreator.setYAxisTitle(getString("PERCENT_OF_INST"));
            else chartCreator.setYAxisTitle(getString("NUMBER_OF_INST"));
            chartCreator.setMaxBars(oChartOption.oBarChartComplete.iMaxBars);    
            chartCreator.setDataReverse(oChartOption.oBarChartComplete.bDataReverse);            
            if (oChartOption.oBarChartComplete.bDataReverse) chartCreator.setXAxisTitle(cAT_sOP_State);            
            else chartCreator.setXAxisTitle(cOT_sSystem);            
            var aCharts = chartCreator.getBarCharts(chartDataOC);
            aChartArray.push(new charts4(aCharts, getString("OPT_SELECTION"), getString("CHART4OC"), oChartOption.oBarChartComplete.getDescription(aCharts.length, c_iCONTEXT_ALL, cAT_OP_State)));
        }                   
        if (oChartOption.oBarChartSingle.bBarChart1){            
            chartCreator.setChartDetailType(oChartOption.oBarChartSingle.iBarChartType);  
            chartCreator.setDataPercent(oChartOption.oBarChartSingle.bDataPercent);   
            chartCreator.setDataReverse(oChartOption.oBarChartSingle.bDataReverse);
            if (oChartOption.oBarChartSingle.bDataPercent) chartCreator.setYAxisTitle(getString("PERCENT_OF_COMP"));
            else chartCreator.setYAxisTitle(getString("NUMBER_OF_COMP"));
            chartCreator.setXAxisTitle("");            
            var aCharts = chartCreator.getSingleBarCharts(chartDataAST, getString("STATUS4").replace("@2", getString("@2SYS")));
            aChartArray.push(new charts4(aCharts, getString("OPTSYSTEM"), getString("CHART4STD"), oChartOption.oBarChartSingle.getDescription(aCharts.length, c_iCONTEXT_SINGLE, cAT_LC_STATE)));
        }                    
        if (oChartOption.oBarChartSingle.bBarChart2){          
            chartCreator.setChartDetailType(oChartOption.oBarChartSingle.iBarChartType);                  
            chartCreator.setDataPercent(oChartOption.oBarChartSingle.bDataPercent);  
            chartCreator.setDataReverse(oChartOption.oBarChartSingle.bDataReverse);
            if (oChartOption.oBarChartSingle.bDataPercent) chartCreator.setYAxisTitle(getString("PERCENT_OF_INST"));
            else chartCreator.setYAxisTitle(getString("NUMBER_OF_INST"));
            chartCreator.setXAxisTitle("");           
            var aCharts = chartCreator.getSingleBarCharts(chartData4ASTOC, getString("OPSTATE4").replace("@2", getString("@2SYS")));
            aChartArray.push(new charts4(aCharts, getString("OPTSYSTEM"), getString("CHART4OC"), oChartOption.oBarChartSingle.getDescription(aCharts.length, c_iCONTEXT_SINGLE, cAT_OP_State)));
        }                    
        if (oChartOption.oBarChartSingle.bPieChart){ 
            chartCreator.setTitle(getString("STATUS4").replace("@2", getString("@2SYS")));                             
            aChartArray.push(new charts4(chartCreator.getPieCharts(chartDataAST),getString("OPTSYSTEM"),getString("PIECHART_1")));
        }              
        if (oChartOption.oBarChartQuad.bBarChart1){ 
            chartCreator.setTitle(getString("STATUS4").replace("@2", getString("@2QUADRANTS")));  
            chartCreator.setChartDetailType(oChartOption.oBarChartQuad.iBarChartType);                  
            chartCreator.setDataPercent(oChartOption.oBarChartQuad.bDataPercent); 
            chartCreator.setMaxBars(oChartOption.oBarChartQuad.iMaxBars);    
            chartCreator.setDataReverse(oChartOption.oBarChartQuad.bDataReverse);
            if (oChartOption.oBarChartQuad.bDataPercent) chartCreator.setYAxisTitle(getString("PERCENT_OF_COMP"));
            else chartCreator.setYAxisTitle(getString("NUMBER_OF_COMP"));                
            if (oChartOption.oBarChartQuad.bDataReverse) chartCreator.setXAxisTitle(cAT_sLC_State);
            else chartCreator.setXAxisTitle(getString("QUADRANTS")); 
            var aCharts = chartCreator.getBarCharts(chartDataQuadrant);
            aChartArray.push(new charts4(aCharts, getString("OPTQUADRANT"), getString("CHART4STD"), oChartOption.oBarChartQuad.getDescription(aCharts.length, c_iCONTEXT_QUADRANT, cAT_LC_STATE)));
        }              
        if (oChartOption.oBarChartQuad.bBarChart2){
            chartCreator.setTitle(getString("OPSTATE4").replace("@2", getString("@2QUADRANTS")));  
            chartCreator.setChartDetailType(oChartOption.oBarChartQuad.iBarChartType);                  
            chartCreator.setDataPercent(oChartOption.oBarChartQuad.bDataPercent); 
            chartCreator.setMaxBars(oChartOption.oBarChartQuad.iMaxBars);    
            chartCreator.setDataReverse(oChartOption.oBarChartQuad.bDataReverse);
            if (oChartOption.oBarChartQuad.bDataPercent) chartCreator.setYAxisTitle(getString("PERCENT_OF_INST"));
            else chartCreator.setYAxisTitle(getString("NUMBER_OF_INST"));                
            if (oChartOption.oBarChartQuad.bDataReverse) chartCreator.setXAxisTitle(cAT_sOP_State);
            else chartCreator.setXAxisTitle(getString("QUADRANTS"));
            var aCharts = chartCreator.getBarCharts(chartDataQuadrantOC);
            aChartArray.push(new charts4(aCharts, getString("OPTQUADRANT"), getString("CHART4OC"), oChartOption.oBarChartQuad.getDescription(aCharts.length, c_iCONTEXT_QUADRANT, cAT_OP_State)));
        }    
        if (oChartOption.oBarChartArch.bBarChart1 || oChartOption.oBarChartArch.bBarChart2){   
            chartCreator.setChartDetailType(oChartOption.oBarChartArch.iBarChartType);   
            chartCreator.setMaxBars(oChartOption.oBarChartArch.iMaxBars);    
            chartCreator.setDataReverse(oChartOption.oBarChartArch.bDataReverse);
            chartCreator.setDataPercent(oChartOption.oBarChartArch.bDataPercent);          
            if (oChartOption.oBarChartArch.bDataPercent) chartCreator.setYAxisTitle(getString("PERCENT_OF_COMP"));
            else chartCreator.setYAxisTitle(getString("NUMBER_OF_COMP"))  
            if (oChartOption.oBarChartArch.bBarChart1) {               
                chartCreator.setTitle(getString("STATUS4").replace("@2", getString("@2ARCHELMTS")));
                if (oChartOption.oBarChartArch.bDataReverse) chartCreator.setXAxisTitle(cAT_sLC_State);
                else chartCreator.setXAxisTitle(cOT_sArchElmt); 
                var aCharts = chartCreator.getBarCharts(chartDataArchElmt);
                aChartArray.push(new charts4(aCharts, getString("OPTARCH"), cOT_sArchElmt, oChartOption.oBarChartArch.getDescription(aCharts.length, c_iCONTEXT_AE, cAT_LC_STATE)));
            }
            if (oChartOption.oBarChartArch.bBarChart2) {                
                chartCreator.setTitle(getString("STATUS4").replace("@2", getString("@2STRUCTELMTS")));
                if (oChartOption.oBarChartArch.bDataReverse) chartCreator.setXAxisTitle(cAT_sLC_State);
                else chartCreator.setXAxisTitle(cOT_sStructElmt);
                var aCharts = chartCreator.getBarCharts(chartDataStructElmt);
                aChartArray.push(new charts4(aCharts, getString("OPTARCH"), cOT_sStructElmt, oChartOption.oBarChartArch.getDescription(aCharts.length, c_iCONTEXT_SE, cAT_LC_STATE)));
            }    
        }   
        if (oChartOption.oBarChartITPlan.bBarChart1 || oChartOption.oBarChartITPlan.bBarChart2){         
            if (!oChartOption.oBarChartITPlan.bDataPercent) chartCreator.setYAxisTitle(getString("NUMBER_OF_COMP"));
            else chartCreator.setYAxisTitle(getString("PERCENT_OF_COMP"));
            chartCreator.setChartDetailType(oChartOption.oBarChartITPlan.iBarChartType);  
            chartCreator.setMaxBars(oChartOption.oBarChartITPlan.iMaxBars);   
            chartCreator.setDataPercent(oChartOption.oBarChartITPlan.bDataPercent);   
            chartCreator.setDataReverse(oChartOption.oBarChartITPlan.bDataReverse);  
            if (oChartOption.oBarChartITPlan.bBarChart1) {                                    
                chartCreator.setTitle(getString("STATUS4").replace("@2", getString("@2ROWS")));
                if (oChartOption.oBarChartITPlan.bDataReverse) chartCreator.setXAxisTitle(cAT_sLC_State);
                else chartCreator.setXAxisTitle(getString("ROWHEADER"));
                var aCharts = chartCreator.getBarCharts(chartDataRowHeader);
                aChartArray.push(new charts4(aCharts, getString("OPTHEADER"), getString("@3ROW"), oChartOption.oBarChartITPlan.getDescription(aCharts.length, c_iCONTEXT_ROWHEADER, cAT_LC_STATE)));
            }    
            if (oChartOption.oBarChartITPlan.bBarChart2){                                   
                chartCreator.setTitle(getString("STATUS4").replace("@2", getString("@2COLS"))); 
                if (oChartOption.oBarChartITPlan.bDataReverse) chartCreator.setXAxisTitle(cAT_sLC_State);
                else chartCreator.setXAxisTitle(getString("COLHEADER")); 
                var aCharts = chartCreator.getBarCharts(chartDataColHeader);
                aChartArray.push(new charts4(aCharts, getString("OPTHEADER"), getString("@3COL"), oChartOption.oBarChartITPlan.getDescription(aCharts.length, c_iCONTEXT_COLHEADER, cAT_LC_STATE)));
            } 
         }
         writeReportOutput(aChartArray);
            
    }
}
function writeReportOutput(p_aChartArray){
    var outfile = Context.createOutputObject();
     setTitleHeaderFooter(outfile);
     if (outfile.GetPageHeight() >outfile.GetPageWidth()){
         var nChartScaleWidth = outfile.GetPageWidth()-outfile.GetRightMargin()-outfile.GetLeftMargin();
         var nChartScaleHeight = nChartScaleWidth * 10/16;
     } else {         
         var nChartScaleHeight = outfile.GetPageHeight()-outfile.GetTopMargin()-outfile.GetBottomMargin();
         var nChartScaleWidth = nChartScaleHeight * 16/10;
     }    
     
     var LastTitle = "";
     var firstPage = true;
     for (var i = 0 ; i < p_aChartArray.length ; i++) {             
        var oChart4 = p_aChartArray[i]; 
        var length = oChart4.aCharts.length;
        if (length>0) {
            if (!firstPage) {
                outfile.OutputField(Constants.FIELD_NEWPAGE, getString("FONT"),12,Constants.C_BLACK,Constants.C_TRANSPARENT, Constants.FMT_LEFT);                
            } else firstPage = false;   
            if (oChart4.sTitle!==LastTitle) outfile.OutputLnF (oChart4.sTitle,"REPORT_HD1");
            LastTitle = oChart4.sTitle;
            outfile.OutputLnF (oChart4.sSubTitle,"REPORT_HD2");
            if (oChart4.sDescription) outfile.OutputLnF (oChart4.sDescription,"REPORT1");
            for (var j = 0 ; j < oChart4.aCharts.length ; j++) { 
                var chartPicture = oChart4.aCharts[j].getPicture();            
                if (i>0) outfile.OutputLnF ("","REPORT1");
                outfile.OutGraphic(chartPicture, -1, nChartScaleWidth, nChartScaleHeight);
            }    
         }
     }    
     outfile.WriteReport();
}
function setTitleHeaderFooter(p_oFile){   
         p_oFile.DefineF("REPORT1", getString("FONT"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT , 0, 21, 0, 2, 0, 1);
         p_oFile.DefineF("REPORT2", getString("FONT"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 3, 0, 1);
         p_oFile.DefineF("REPORT3", getString("FONT"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 3, 0, 1);
         p_oFile.DefineF("REPORT_HD1", getString("FONT"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_TOCENTRY0, 0, 21, 0, 5, 0, 1);
         p_oFile.DefineF("REPORT_HD2", getString("FONT"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_TOCENTRY1, 0, 21, 0, 3, 0, 1);
              
         /*outfile.BeginSection(true, Constants.SECTION_COVER); 
         setReportHeaderFooter(p_oFile, g_nLoc, true, true, true);
         outfile.OutputLn("Degree of Standardization", getString("FONT"), 20, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0); 
         outfile.EndSection();*/          
         p_oFile.BeginSection (true, Constants.SECTION_INDEX);
         p_oFile.SetAutoTOCNumbering(true);
         setReportHeaderFooter(p_oFile, g_nLoc, true, true, true);
         //p_oFile.OutputLnF(" ","REPORT1");
         p_oFile.OutputLnF(getString("TOC"),"REPORT2"); 
         p_oFile.OutputField(Constants.FIELD_TOC,getString("FONT"),12,Constants.C_BLACK,Constants.C_WHITE,Constants.FMT_RIGHT);
         p_oFile.EndSection();
         setReportHeaderFooter(p_oFile, g_nLoc, false, false, false);
}
function charts4(p_aCharts, p_sTitle, p_sSubTitle, p_sDescription){
    this.sTitle = p_sTitle
    this.aCharts = p_aCharts    
    this.sSubTitle = p_sSubTitle;
    this.sDescription = p_sDescription
}
/*------------------------------------------------------------------------------------*/
 function chartOptionDialog() {
    var canceled = false; 
    this.getPages = function() {
        return [getPageTmp(0,"OPT_SELECTION","cb_Page0_BarChart1","cb_Page0_BarChart2","og_Page0_ChartType","og_Page0_DataAggregation","og_Page0_XAxis",cOT_sSystem,"tb_Page0_MaxCols","tb_Page0_selTitle"),
                getPageTmp(1,"OPTSYSTEM","cb_Page1_BarChart1","cb_Page1_BarChart2","og_Page1_ChartType","og_Page1_DataAggregation",undefined,undefined,undefined,undefined,"cb_Page1_PieChart"),
                getPageTmp(2,"OPTQUADRANT","cb_Page2_BarChart1","cb_Page2_BarChart2","og_Page2_ChartType","og_Page2_DataAggregation","og_Page2_XAxis", getString("QUADRANT"),"tb_Page2_MaxCols"),
                getPageTmp(3,"OPTARCH","cb_Page3_BarChart1","cb_Page3_BarChart2","og_Page3_ChartType","og_Page3_DataAggregation","og_Page3_XAxis",getString("ARCHOBJ"),"tb_Page3_MaxCols"),
                getPageTmp(4,"OPTHEADER","cb_Page4_BarChart1","cb_Page4_BarChart2","og_Page4_ChartType","og_Page4_DataAggregation","og_Page4_XAxis",getString("HEADER"),"tb_Page4_MaxCols")];
                
        function getPageTmp(p_iPage, p_stitle,p_sBarCheckbox1,p_sBarCheckbox2,p_sChartType,p_sAggregation,p_sXAxisAttr,p_sXAxis1ValueName,p_sMaxBars, p_sTitle4Bar, p_sPieChart){                
            var chartOptionsDlgTmp =  Dialogs.createNewDialogTemplate(680, 210, getString(p_stitle));
            var heigthDataOptionBox = 215 - (p_sXAxisAttr ? 0 : 50) - (p_sMaxBars ? 0 : 50);
            var sBarChartName1 = getString("DEGREE4STD");
            var sBarChartName2 = getString("OPSTATE");
            if (p_sBarCheckbox1 == "cb_Page3_BarChart1") {
                sBarChartName1 = cOT_sArchElmt;
                sBarChartName2 = cOT_sStructElmt;
            }    
            if (p_sBarCheckbox1 == "cb_Page4_BarChart1") {
                sBarChartName1 = getString("ROWHEADER");
                sBarChartName2 = getString("COLHEADER");
            }
            chartOptionsDlgTmp.GroupBox(5, 5, 665, 245, "");            
            chartOptionsDlgTmp.GroupBox(15, 10, 200, 55, getString("BARCHARTS_FOR"));
            chartOptionsDlgTmp.CheckBox(25, 20, 185, 15, sBarChartName1, p_sBarCheckbox1);   
            chartOptionsDlgTmp.CheckBox(25, 40, 185, 15, sBarChartName2, p_sBarCheckbox2);  
            
            if (p_sPieChart){
                chartOptionsDlgTmp.GroupBox(15, 55, 200, 42, "");
                chartOptionsDlgTmp.CheckBox(25, 65, 130, 15, getString("PIECHART"), p_sPieChart);
            }    
            
            chartOptionsDlgTmp.GroupBox(220, 10, 440, heigthDataOptionBox, getString("DATAOPTIONS"));
            chartOptionsDlgTmp.GroupBox(230, 20, 420, 30, getString("BAR_TYPE"));
            chartOptionsDlgTmp.OptionGroup(p_sChartType);
            chartOptionsDlgTmp.OptionButton(240,30, 190, 15, getString("COMB_STACK"));
            chartOptionsDlgTmp.OptionButton(440,30, 190, 15, getString("COMB_SIDE"));
            
            chartOptionsDlgTmp.GroupBox(230, 55, 420, 30, getString("DATA_AGGREGATION"));
            chartOptionsDlgTmp.OptionGroup(p_sAggregation);
            chartOptionsDlgTmp.OptionButton(240,65, 190, 15, getString("ABSOLUT_COUNT"));
            chartOptionsDlgTmp.OptionButton(440,65, 190, 15, getString("PERCENT"));
            
            if (p_sXAxisAttr){        
                chartOptionsDlgTmp.GroupBox(230, 90, 420, 30, getString("X_AXIS_ATTRIBUTION"));
                chartOptionsDlgTmp.OptionGroup(p_sXAxisAttr);
                chartOptionsDlgTmp.OptionButton(240,100, 190, 15, p_sXAxis1ValueName);
                chartOptionsDlgTmp.OptionButton(440,100, 190, 15, getString("LIFECYCLE_STATES")); 
            }    
            if (p_sMaxBars){ 
                chartOptionsDlgTmp.GroupBox(230, 125, 420, 35, getString("MAX_COLS"));  
                chartOptionsDlgTmp.TextBox(240, 135, 28, 15, p_sMaxBars,0); 
            }    
            if (p_sTitle4Bar) {
                chartOptionsDlgTmp.GroupBox(5, 185, 665, 40, "");            
                chartOptionsDlgTmp.Text(25, 192, 120, 15, getString("SEL_TITLE"));
                chartOptionsDlgTmp.TextBox(220, 190, 440, 15, p_sTitle4Bar,0);
            }
            chartOptionsDlgTmp.HelpButton("HIDa80c8e10-35da-11dc-2c27-82acaf0c5956_"+p_iPage);
            return chartOptionsDlgTmp;
        }
     }

     //initialize dialog pages (are already created and pre-initialized with static data from XML or template)
     //parameter: Array of DialogPage
     //see Help: DialogPage
     //user can set control values
     //optional
     this.init = function(aPages){
        var oChartOption = new chartOptions();
        oChartOption.getSavedOptions();        
        initPage(aPages[0], oChartOption.oBarChartComplete);
        initPage(aPages[1], oChartOption.oBarChartSingle);
        initPage(aPages[2], oChartOption.oBarChartQuad);
        initPage(aPages[3], oChartOption.oBarChartArch);
        initPage(aPages[4], oChartOption.oBarChartITPlan);
        function initPage(p_oPage,p_oChartOption){            
            if (p_oPage.getDialogElement("cb_Page"+p_oPage.getPageIndex()+"_BarChart1")) p_oPage.getDialogElement("cb_Page"+p_oPage.getPageIndex()+"_BarChart1").setChecked(p_oChartOption.bBarChart1==true); 
            if (p_oPage.getDialogElement("cb_Page"+p_oPage.getPageIndex()+"_BarChart2")) p_oPage.getDialogElement("cb_Page"+p_oPage.getPageIndex()+"_BarChart2").setChecked(p_oChartOption.bBarChart2==true);
            if (p_oPage.getDialogElement("og_Page"+p_oPage.getPageIndex()+"_ChartType")) p_oPage.getDialogElement("og_Page"+p_oPage.getPageIndex()+"_ChartType").setSelection((p_oChartOption.iBarChartType==Constants.CHART_COMBINE_SIDE) ? 1 :0);
            if (p_oPage.getDialogElement("og_Page"+p_oPage.getPageIndex()+"_DataAggregation")) p_oPage.getDialogElement("og_Page"+p_oPage.getPageIndex()+"_DataAggregation").setSelection((p_oChartOption.bDataPercent==true) ? 1 :0);
            if (p_oPage.getDialogElement("og_Page"+p_oPage.getPageIndex()+"_XAxis")) p_oPage.getDialogElement("og_Page"+p_oPage.getPageIndex()+"_XAxis").setSelection((p_oChartOption.bDataReverse==true) ? 1 :0);
            if (p_oPage.getDialogElement("tb_Page"+p_oPage.getPageIndex()+"_MaxCols")) p_oPage.getDialogElement("tb_Page"+p_oPage.getPageIndex()+"_MaxCols").setText(p_oChartOption.iMaxBars);
            if (p_oPage.getDialogElement("tb_Page"+p_oPage.getPageIndex()+"_selTitle")) p_oPage.getDialogElement("tb_Page"+p_oPage.getPageIndex()+"_selTitle").setText(p_oChartOption.sTitle);         
            if (p_oPage.getDialogElement("cb_Page"+p_oPage.getPageIndex()+"_PieChart")) p_oPage.getDialogElement("cb_Page"+p_oPage.getPageIndex()+"_PieChart").setChecked(p_oChartOption.bPieChart==true); 
        }
     }

     //the result of this function is returned as result of Dialogs.showDialog(). Can be any object.
     //optional
     this.getResult = function(){
         if (canceled) return null;
         var oChartOption = new chartOptions();  
         savePageOption(this.dialog.getPage(0),oChartOption.oBarChartComplete);
         savePageOption(this.dialog.getPage(1),oChartOption.oBarChartSingle);
         savePageOption(this.dialog.getPage(2),oChartOption.oBarChartQuad);
         savePageOption(this.dialog.getPage(3),oChartOption.oBarChartArch);
         savePageOption(this.dialog.getPage(4),oChartOption.oBarChartITPlan);
         function savePageOption(p_oPage,p_oChartOption){
            var iPageIndex = p_oPage.getPageIndex();
            p_oChartOption.setChartOptionGrp(p_oPage.getDialogElement("cb_Page"+iPageIndex+"_BarChart1").isChecked(), 
                                             p_oPage.getDialogElement("cb_Page"+iPageIndex+"_BarChart2").isChecked(),
                                             p_oPage.getDialogElement("og_Page"+iPageIndex+"_ChartType").getValue()==1,
                                             p_oPage.getDialogElement("tb_Page"+iPageIndex+"_MaxCols") ? p_oPage.getDialogElement("tb_Page"+iPageIndex+"_MaxCols").getText() : 0,
                                             p_oPage.getDialogElement("og_Page"+iPageIndex+"_XAxis") ? p_oPage.getDialogElement("og_Page"+iPageIndex+"_XAxis").getValue()==1 : false,
                                             p_oPage.getDialogElement("og_Page"+iPageIndex+"_DataAggregation").getValue()==1,
                                             p_oPage.getDialogElement("tb_Page"+iPageIndex+"_selTitle") ? p_oPage.getDialogElement("tb_Page"+iPageIndex+"_selTitle").getText() : undefined,
                                             p_oPage.getDialogElement("cb_Page"+iPageIndex+"_PieChart") ? p_oPage.getDialogElement("cb_Page"+iPageIndex+"_PieChart").isChecked() : false);
         }

         oChartOption.saveOptions();                               
         return oChartOption;
     }
     this.canFinish = function(pageNumber){
        return true;
     }    
     this.isInValidState = function(pageNumber){
        return true;
     }   
     //called after ok/finish has been pressed and the current state data has been applied
     //can be used to update your data
     // pageNumber: the current page number
     // bOK: true=Ok/finish, false=cancel pressed
     //optional
     this.onClose = function(pageNumber, bOk){
         canceled = !bOk;
     }
}

function chartOptions(){
    this.oBarChartComplete = new chartOptionGrp
    this.oBarChartComplete.setChartOptionGrp(true, false, undefined, undefined, undefined, undefined, "");
    this.oBarChartSingle = new chartOptionGrp
    this.oBarChartSingle.setChartOptionGrp(true, false, true);
    this.oBarChartQuad = new chartOptionGrp
    this.oBarChartQuad.setChartOptionGrp(false, false);
    this.oBarChartArch = new chartOptionGrp
    this.oBarChartArch.setChartOptionGrp(false, false);
    this.oBarChartITPlan = new chartOptionGrp
    this.oBarChartITPlan.setChartOptionGrp(false, false);
    this.saveOptions = function(){  
        var sPropertyName;
        var sSubPropertyName;
        for (sPropertyName in this){
            if (this.hasOwnProperty(sPropertyName) && typeof this[sPropertyName] === "object"){
                var oProperty = this[sPropertyName];
                for (sSubPropertyName in oProperty){
                    if (typeof oProperty[sSubPropertyName]!=="function" && oProperty.hasOwnProperty(sSubPropertyName)){
                        Context.writeProfileString ("chartOptions."+sPropertyName,sSubPropertyName,oProperty[sSubPropertyName]);
                    }    
                }    
            }
        }       
       Context.writeProfileString ("chartOptions","chartOptionsInitialized", "true");
    }
    this.getSavedOptions = function(){ 
        if (Context.getProfileString("chartOptions","chartOptionsInitialized", false)=="true"){ 
           var sPropertyName;
           var sSubPropertyName;
           for (sPropertyName in this){
                if (this.hasOwnProperty(sPropertyName) && typeof this[sPropertyName] === "object"){
                    var oProperty = this[sPropertyName];
                    for (sSubPropertyName in oProperty){
                        if (typeof oProperty[sSubPropertyName]!=="function" && oProperty.hasOwnProperty(sSubPropertyName)) {
                            var sProperty = Context.getProfileString("chartOptions."+sPropertyName,sSubPropertyName,oProperty[sSubPropertyName]);
                            if (sProperty == "true" || sProperty == "false") sProperty = (sProperty == "true");
                            oProperty[sSubPropertyName] = sProperty;
                        }    
                    }    
                }
           } 
        }
    }
    this.isChartRequested = function(){
        return this.oBarChartComplete.isChartRequested() || this.oBarChartSingle.isChartRequested() || this.oBarChartQuad.isChartRequested() || this.oBarChartArch.isChartRequested() || this.oBarChartITPlan.isChartRequested();
    }
    function chartOptionGrp(){        
        this.bBarChart1 = true;
        this.bBarChart2 = false; 
        this.iBarChartType = Constants.CHART_COMBINE_STACK;
        this.iMaxBars = 15;
        this.bDataReverse = false;
        this.bDataPercent = false;
        this.sTitle="";
        this.bPieChart = false;
        
        this.setChartOptionGrp = function(p_bBarChart1, p_bBarChart2, p_bCombine , p_iMaxBars, p_bDataReverse, p_bDataPercent, p_sTitle, p_bPieChart){                   
            this.bBarChart1 = p_bBarChart1 ? p_bBarChart1 : false;
            this.bBarChart2 = p_bBarChart2 ? p_bBarChart2 : false; 
            this.iBarChartType = (p_bCombine) ? Constants.CHART_COMBINE_SIDE : Constants.CHART_COMBINE_STACK;
            this.iMaxBars = (p_iMaxBars && !isNaN(p_iMaxBars)) ?  parseInt(p_iMaxBars) : 15;
            this.bDataReverse = p_bDataReverse ? p_bDataReverse : false;
            this.bDataPercent = p_bDataPercent ? p_bDataPercent : false;
            this.sTitle = p_sTitle;
            this.bPieChart = p_bPieChart ? p_bPieChart : false;
        }
        this.isBarChartRequested = function(){
            return this.bBarChart1 || this.bBarChart2;
        }
        this.isChartRequested = function(){
            return  this.isBarChartRequested() || this.bPieChart;
        }
        this.getDescription = function(p_iCount, p_iContext, p_iStateType){
        /* This functions generates a Description       

        "@3ARCHELMT"=architecture element
        "@3COL"=IT planning column header
        "@3QUADRANT"=quadrant
        "@3ROW"=IT planning row header
        "@3STRUCTELMT"=structure element
        "@3SYS"=IT system
        
        "@4_BAR"=bar
        "@4_BARGRP"=bar group
        
        "@5_BAR"=bar
        "@5_BARPART"=bar part
        
        "@6_ABSOLUTE"=absolute number
        "@6_PERCENT"=percentage amount
        
        "DESC_BASE1_LC"=The following @1 representing the standardization status for each found @3.
        "DESC_BASE1_OC"=The following @1 representing the system status of IT system instances of each found @3.
        
        "DESC_BASE2"=Each chart contains one @4 per @3 and one color for each state type.
        "DESC_BASE2_REVERSE"=Each chart contains one @4 per state type and one color for each @3.
        
        "DESC_BASE3_LC"=The value of a colored @5 is related to the @6 of components with a specific state.
        "DESC_BASE3_OC"=The value of a colored @5 is related to the @6 of IT system instances with a specific state.
        
        "DESC_BASE4_ARCH"=The values are aggregated for IT system related to an architecture element. 
        "DESC_BASE4_PLAN_COL"=The values are aggregated for IT system allocated (as is today) to the IT planning column header.
        "DESC_BASE4_PLAN_ROW"=The values are aggregated for IT system allocated (as is today) to the IT planning row header.
        "DESC_BASE4_QUAD"=The values are aggregated for IT system related to a quadrant.
        "DESC_BASE4_STRUCT"=The values are aggregated for IT system related to a structural element.
        */
            switch (p_iContext) { 
                case c_iCONTEXT_ALL:                                       
                    var sBar4 = getString("@3SYS");                                       
                    var sBar4x = getString("@7SYS");            
                    var titleExt4 = "";
                    break;
                case c_iCONTEXT_SINGLE:
                    var sBar4 = getString("@3SYS");  
                    var sBar4x = getString("@7SYS");              
                    var titleExt4 = "";
                    break;
                case c_iCONTEXT_QUADRANT:
                    var sBar4 = getString("@3QUADRANT");
                    var sBar4x = getString("@7QUADRANT");
                    var titleExt4 = getString("DESC_BASE4_QUAD") ;      
                    break;
                case c_iCONTEXT_AE:    
                    var sBar4 = getString("@3ARCHELMT");  
                    var sBar4x = getString("@7ARCHELMT");
                    var titleExt4 = getString("DESC_BASE4_ARCH") ; 
                    break;
                case c_iCONTEXT_SE:   
                    var sBar4 = getString("@3STRUCTELMT");
                    var sBar4x = getString("@7STRUCTELMT");
                    var titleExt4 = getString("DESC_BASE4_STRUCT") ;  
                    break;
                case c_iCONTEXT_ROWHEADER:   
                    var sBar4 = getString("@3ROW");
                    var sBar4x = getString("@7ROW");
                    var titleExt4 = getString("DESC_BASE4_PLAN_ROW") ;  
                    break;
                case c_iCONTEXT_COLHEADER:     
                    var sBar4 = getString("@3COL"); 
                    var sBar4x = getString("@7COL");
                    var titleExt4 = getString("DESC_BASE4_PLAN_COL") ;   
                    break;
            }    
            var title = p_iStateType == cAT_LC_STATE ? getString("DESC_BASE1_LC") : getString("DESC_BASE1_OC");
            title = title.replace("@7", sBar4x);
            var titleExt = this.bDataReverse ? getString("DESC_BASE2_REVERSE") :getString("DESC_BASE2");
            titleExt = titleExt.replace("@3", sBar4);
            title = title + " " +titleExt.replace("@4", this.iBarChartType===Constants.CHART_COMBINE_STACK ? getString("@4_BAR") : getString("@4_BARGRP"));
            titleExt = p_iStateType === cAT_LC_STATE ? getString("DESC_BASE3_LC") :getString("DESC_BASE3_OC");            
            titleExt = titleExt.replace("@5", this.iBarChartType===Constants.CHART_COMBINE_STACK ? getString("@5_BARPART") : getString("@5_BAR"));
            title = title + " " +titleExt.replace("@6", this.bDataPercent ? getString("@6_PERCENT") : getString("@6_ABSOLUTE"));
            title = title + titleExt4
            return title;
        }
    }
}

/*
 *
 * --- Bar Chart ---
 *
 */
function getStrucElement(p_oArchElmt,p_oInput){
    var oNextElmt = p_oInput.getArchitectureElement(p_oArchElmt, [Constants.OT_ARCH_ELEMENT, Constants.OT_STRCT_ELMT]);
    if (oNextElmt !=null){
        if (oNextElmt.TypeNum() == Constants.OT_ARCH_ELEMENT){
            oNextElmt = getStrucElement(oNextElmt,p_oInput);
        }
    }
    return oNextElmt;
}
function uniqueName(){
    var nameMap = new java.util.HashMap();
    this.getUniqueName = function(oItem){
        var sItemName = getTextAttr(oItem,Constants.AT_NAME);
        if (nameMap.containsKey(sItemName)){            
            var map4Name = nameMap.get(sItemName);
            if (map4Name.containsKey(oItem)) return map4Name.get(oItem);
            else {
                var sUniqueName = sItemName +"("+map4Name.size()+")";
                map4Name.put(oItem,sUniqueName);
                return sUniqueName;
            }
        } else {
            var map4Name = new java.util.HashMap();
            map4Name.put(oItem,sItemName);
            nameMap.put(sItemName, map4Name);
            return sItemName;
        }
    }
}
function allocationMapper(p_input){
    var oColHeader4Alloc = new java.util.HashMap();
    var oRowHeader4Alloc = new java.util.HashMap();
    var oHeader4PSU = new java.util.HashMap();
    this.getColHeaders4Alloc = function(p_oAlloc){
        if (oColHeader4Alloc.containsKey(p_oAlloc)) return oColHeader4Alloc.get(p_oAlloc).aHeader;
        return [];        
    }
    this.getRowHeaders4Alloc = function(p_oAlloc){
        if (oRowHeader4Alloc.containsKey(p_oAlloc)) return oRowHeader4Alloc.get(p_oAlloc).aHeader;
        return [];        
    }
    var aPSUs = p_input.getPSUs();    
    for (var i=0;i<aPSUs.length;i++){
        oHeader4PSU.put(aPSUs[i], new psuHeaders(getColHeaderDef(aPSUs[i]),getRowHeaderDef(aPSUs[i])));
    }
    var aAllocs = p_input.getAllocations();
    for (var i=0;i<aAllocs.length;i++){        
        var oAllocCxn = aAllocs[i];
        var oAlloc = oAllocCxn.SourceObjDef();
        var oHeaders = oHeader4PSU.get(oAllocCxn.TargetObjDef());
        if (!oRowHeader4Alloc.containsKey(oAlloc)) {
            var allocMap = new allocationMap();
            allocMap.addHeader(oHeaders.oRow);
            oRowHeader4Alloc.put(oAlloc,allocMap);
        } else {     
            var allocMap = oRowHeader4Alloc.get(oAlloc);       
            allocMap.addHeader(oHeaders.oRow);
        }
        if (!oColHeader4Alloc.containsKey(oAlloc)) {
            var allocMap = new allocationMap();
            allocMap.addHeader(oHeaders.oCol);
            oColHeader4Alloc.put(oAlloc,allocMap);
        } else {     
            var allocMap = oColHeader4Alloc.get(oAlloc);       
            allocMap.addHeader(oHeaders.oCol);
        }
    } 
    function allocationMap(){
        var aHeaderMap =  new java.util.HashMap();
        this.aHeader=[];
        this.addHeader = function(p_oHeader){
            if (!aHeaderMap.containsKey(p_oHeader)){
                aHeaderMap.put(p_oHeader,null);
                this.aHeader.push(p_oHeader);
            }
        }
    }  
    function psuHeaders(p_oCol,p_oRow){
        this.oCol = p_oCol;
        this.oRow = p_oRow;
    }
}
function getTextAttr(oItem, attrTypeNum) {   
    if (oItem == null) return ""; 
    var oAttr = oItem.Attribute (attrTypeNum, g_nLoc, true/*Fallback*/);
    if (!oAttr.IsMaintained()) return "";
    return oAttr.GetValue(true);
}

function getDateValue2(oItem, attrTypeNum) {
    var oAttr = oItem.Attribute(attrTypeNum, g_nLoc);
    if (!oAttr.IsMaintained()) return null;
    return oAttr.MeasureValue();
}

function getValue(oItem, attrTypeNum) {  
    if (oItem == null) return ""; 
    var oAttr = oItem.Attribute(attrTypeNum, g_nLoc,true/*Fallback*/);
    if (!oAttr.IsMaintained()) return "";
    return oAttr.getValue();
}
function addDataSetName(p_aDataSetNames,p_sName){
    if (p_aDataSetNames.indexOf(p_sName) < 0) p_aDataSetNames.push(p_sName);
} 
function chartCreatorClass(){
    var iChartWidth = 1024;
    var iChartHeight = 640;
    var iMaxBars = 15;
    var bDataReverse = false;
    var bDataAcumulated = false;
    var bDataPercent = false;
    var bDataLabels = true;
    var bLedgend = true;
    var i3dRatio = 20;
    var iChartDetailType = Constants.CHART_COMBINE_STACK;
    var sTitle = "";
    var sXAxisTitle = "";
    var sYAxisTitle = "";
    var iXAxisLabelAngle = 20;
    var iYAxisLabelAngle = 0;
    var oTitleFont = new chartFontClass(getString("FONT"), 16, getColor4RGB(0,0,0), Constants.FMT_BOLD, getColor4RGB(233,227,207));//getColor4RGB(100,100,255)
    var oXAxisTitleFont = new chartFontClass(getString("FONT"), 10, getColor4RGB(0,0,0));
    var oYAxisTitleFont = new chartFontClass(getString("FONT"), 10, getColor4RGB(0,0,0));
    var oLedgendFont = new chartFontClass(getString("FONT"), 10, getColor4RGB(0,0,0));
    var oBackGroundColorPlot1 = getColor4RGB(255, 255, 222);//getColor4RGB(80, 80, 180)
    var oBackGroundColorPlot2 = getColor4RGB(254, 250, 238);//getColor4RGB(80, 80, 210);
    var oChartBackGroundColor = getColor4RGB(235, 238, 246);//getColor4RGB(230, 255, 255); 
    this.setSize = function(p_iWidth, p_iHeight){
       iChartWidth = p_iWidth;
       iChartHeigth = p_iHeight;
    }
    this.setDataReverse = function(p_bDataReverse){
        bDataReverse = p_bDataReverse;
    }
    this.setDataAcumulated = function(p_bDataAcumulated){
        bDataAcumulated = p_bDataAcumulated;
    }
    this.setDataPercent = function(p_bDataPercent){
        bDataPercent = p_bDataPercent;
    }
    
    this.setMaxBars = function(p_iMaxBars){
        iMaxBars = p_iMaxBars;
    }
    this.setDataLabels = function(p_bDataLabels){
        bDataLabels = p_bDataLabels;
    }
    this.setLedgend = function(p_bLedgend){
        bLedgend = p_Ledgend;
    }
    this.set3dRatio = function(p_i3dRatio){
        i3dRatio = p_i3dRatio;
    }
    this.setChartDetailType = function(p_iChartDetailType){
        iChartDetailType = p_iChartDetailType;
    }    
    this.setTitle = function(p_sTitle){
        sTitle = p_sTitle;
    }   
    this.setXAxisTitle = function(p_sXAxisTitle){
        sXAxisTitle = p_sXAxisTitle;
    }   
    this.setYAxisTitle = function(p_sYAxisTitle){
        sYAxisTitle = p_sYAxisTitle;
    }   
    this.setXAxisLabelAngle = function(p_iXAxisLabelAngle){
        iXAxisLabelAngle = p_iXAxisLabelAngle;
    }  
    this.setYAxisLabelAngle = function(p_iYAxisLabelAngle){
        iYAxisLabelAngle = p_iYAxisLabelAngle;
    } 
    this.setTitleFont = function(p_sFont, p_iFontSize, p_oFontColor, p_iFontStyle, p_iBackGroundColor){
        oTitleFont = new chartFontClass(p_sFont, p_iFontSize, p_oFontColor, p_iFontStyle, p_iBackGroundColor);
    } 
    this.setTitleFont = function(p_sFont, p_iFontSize, p_oFontColor, p_iFontStyle, p_iBackGroundColor){
        oTitleFont = new chartFontClass(p_sFont, p_iFontSize, p_oFontColor, p_iFontStyle, p_iBackGroundColor);
    } 
    this.setXAxisTitleFont = function(p_sFont, p_iFontSize, p_oFontColor, p_iFontStyle, p_iBackGroundColor){
        oXAxisTitleFont = new chartFontClass(p_sFont, p_iFontSize, p_oFontColor, p_iFontStyle, p_iBackGroundColor);
    }
    this.setYAxisTitleFont = function(p_sFont, p_iFontSize, p_oFontColor, p_iFontStyle, p_iBackGroundColor){
        oYAxisTitleFont = new chartFontClass(p_sFont, p_iFontSize, p_oFontColor, p_iFontStyle, p_iBackGroundColor);
    }
    this.setLedgendFont = function(p_sFont, p_iFontSize, p_oFontColor, p_iFontStyle, p_iBackGroundColor){
        oLedgendFont = new chartFontClass(p_sFont, p_iFontSize, p_oFontColor, p_iFontStyle, p_iBackGroundColor);
    }      
    this.setBackGroundPlot = function(p_oBackGroundColorPlot1, p_oBackGroundColorPlot2){
        oBackGroundColorPlot1 = p_oBackGroundColorPlot1;
        oBackGroundColorPlot2 = p_oBackGroundColorPlot2 ? p_oBackGroundColorPlot2 : p_oBackGroundColorPlot1;
    }
    this.getBarChart = function(p_oChartData, p_ChartIndex, p_start_index, p_number_of_sets){
        var chart = Context.createChart(Constants.CHART_TYPE_BAR, iChartWidth, iChartHeight);
        chart.setMultiChartType(iChartDetailType);
        if (bDataReverse) chart.setMultiData(p_oChartData.getChartDataReverse(bDataAcumulated,bDataPercent,p_number_of_sets, p_start_index),p_oChartData.getLastCollectionValueNames());
        else chart.setMultiData(p_oChartData.getChartData(bDataAcumulated,bDataPercent,p_number_of_sets,p_start_index),p_oChartData.getLastCollectionValueNames(),p_oChartData.getLastCollectionValueColors());
        chart.setLabels (p_oChartData.getLastCollectionDataSetNames());
        chart.setTitle(p_ChartIndex && (p_ChartIndex > 0) ? sTitle + " ("+p_ChartIndex+")" : sTitle);
        chart.setTitleFont(oTitleFont.sFont, oTitleFont.iFontSize, oTitleFont.oFontColor, oTitleFont.iFontStyle );
        if (oTitleFont.iBackGroundColor) chart.setTitleBackground(oTitleFont.iBackGroundColor);      
        var plotArea = chart.getPlotArea();
        if (oBackGroundColorPlot2) {   
            plotArea.setBackgroundColor(oBackGroundColorPlot1, oBackGroundColorPlot2);
        }
        var yAxis = chart.getYAxis();  
        if (sYAxisTitle!="") yAxis.setTitle(sYAxisTitle);
        yAxis.setLabelFont(oYAxisTitleFont.sFont,oYAxisTitleFont.iFontSize,oYAxisTitleFont.oFontColor,oYAxisTitleFont.iFontStyle,iYAxisLabelAngle);
        var xAxis = chart.getXAxis();   
        if (sXAxisTitle!="") xAxis.setTitle(sXAxisTitle);
        xAxis.setLabelFont(oXAxisTitleFont.sFont,oXAxisTitleFont.iFontSize,oXAxisTitleFont.oFontColor,oXAxisTitleFont.iFontStyle,iXAxisLabelAngle);
        
        createLegend(chart, true);
        chart.setBackground(oChartBackGroundColor);
        chart.setDataLabels(bDataLabels);
        chart.set3D(i3dRatio);
    
        return chart;
    }    
    this.getPieChart = function(p_chartData, sKey) {
        var chart = Context.createChart(Constants.CHART_TYPE_PIE, iChartWidth, iChartHeight);
        chart.setData(p_chartData.getSingleChartData(sKey));
        chart.setLabels (p_chartData.getLastCollectionValueNames());
        chart.setLabelFont (oLedgendFont.sFont,oLedgendFont.iFontSize,oLedgendFont.oFontColor,oLedgendFont.iFontStyle);    
        var colors = p_chartData.getLastCollectionValueColors();
        for (var i=0; i<colors.length;i++){
            var oSector = chart.getSector(i);
            oSector.setColor(colors[i]);
        }    
        chart.setTitle(sTitle+" "+sKey);
        chart.setTitleFont(oTitleFont.sFont, oTitleFont.iFontSize, oTitleFont.oFontColor, oTitleFont.iFontStyle );
        if (oTitleFont.iBackGroundColor) chart.setTitleBackground(oTitleFont.iBackGroundColor);      
        chart.setExplode(4);    
        chart.setExplode(5);
        chart.setBackground(oChartBackGroundColor); 
        chart.set3D(i3dRatio);
        if (bLedgend) createLegend(chart, true);
        return chart;
    }
    this.getPieCharts = function(p_oChartData){          
        var aCharts = [];
        var collSet = p_oChartData.getCollectionDataSetNames()
        for (var i = 0 ; i < collSet.length ; i++) {
            aCharts.push(this.getPieChart(p_oChartData, collSet[i]));
        }  
        return aCharts;
    }
    this.getSingleBarCharts = function(p_oChartData,p_sTitlePrefix){
        var aCharts = [];
        var collSet = p_oChartData.getCollectionDataSetNames();
        for (var i = 0 ; i < collSet.length ; i++) {       
            this.setTitle(p_sTitlePrefix + " " + collSet[i]);
            aCharts.push(this.getBarChart(p_oChartData,undefined,i,1));
        }
        return aCharts;
    }
    this.getBarCharts = function(p_oChartData){
        var aCharts = [];
        var collSet = p_oChartData.getCollectionDataSetNames();
        var iChartIndex = 0;
        for (var i = 0 ; i < collSet.length ; i=i+iMaxBars) {           
            aCharts.push(this.getBarChart(p_oChartData,iChartIndex,i,iMaxBars));
            iChartIndex++;
        }
        return aCharts;
    }
    function chartFontClass(p_sFont, p_iFontSize, p_oFontColor, p_iFontStyle, p_iBackGroundColor){
        this.sFont = p_sFont;
        this.iFontSize = p_iFontSize; 
        this.oFontColor = (p_oFontColor) ? p_oFontColor : getColor4RGB(0,0,0); 
        this.iFontStyle = (p_iFontStyle) ? p_iFontStyle : Constants.FMT_CENTER;
        this.iBackGroundColor = p_iBackGroundColor;
    }
    function createLegend(chart, bReverse) {
        var legend = chart.setLegend();
        legend.setReverse(bReverse);
        legend.setFont(oLedgendFont.sFont,oLedgendFont.iFontSize,oLedgendFont.oFontColor,oLedgendFont.iFontStyle);
        legend.setVertical(true);
    }
}

function chartDataCollectorClass(p_iAttrTypeNum,p_aCollectionValueTypes,p_aCollectionValueColors){
    var title = "Chart Title"      
    var aCollectionValueNames = (p_iAttrTypeNum && p_aCollectionValueTypes) ? getTypeValueNames(p_iAttrTypeNum, p_aCollectionValueTypes) : [];
    var aCollectionValueTypes = p_aCollectionValueTypes ? p_aCollectionValueTypes : [];
    var aCollectionValueColors = p_aCollectionValueColors ? p_aCollectionValueColors = p_aCollectionValueColors : [];
    var aCollectionDataSets = new Array();
    var aCollectionDataSetNames = new Array();
    var aLastCollectionValueColors = new Array();
    var aLastCollectionValueNames = new Array();
    var aLastCollectionDataSetNames = new Array();
    var iLastDataSet = aCollectionDataSetNames.length;
    var bSort = false;
    
    this.getChartData = function(p_bAccumulate, p_bAsPercent, p_iMaxDataSets, p_iFirstDataSet, p_aValueTypes){
        sortCollectionDataSetNames();
        iLastDataSet = aCollectionDataSetNames.length;
        if (!p_iFirstDataSet) p_iFirstDataSet = 0;        
        if (p_iMaxDataSets && p_iFirstDataSet + p_iMaxDataSets < aCollectionDataSetNames.length) iLastDataSet = p_iFirstDataSet + p_iMaxDataSets;
        if (p_aValueTypes) {
            aLastCollectionValueNames = new Array();
            aLastCollectionValueColors = new Array();
            for (var i=0; i<p_aValueTypes.length; i++){
                if (0<=p_aValueTypes[i] && p_aValueTypes[i]<aCollectionValueNames.length){ 
                    var currIndex = p_aValueTypes[i];
                    aLastCollectionValueNames.push(aCollectionValueNames[currIndex]);
                    aLastCollectionValueColors.push(aCollectionValueColors[currIndex]);
                }    
            }
        } else {            
            aLastCollectionValueNames = aCollectionValueNames;
            aLastCollectionValueColors = aCollectionValueColors;
        } 
        //if (aChartData) return aChartData;
        var aChartData = new Array();   
        for (var i=0; i<aLastCollectionValueNames.length;i++){                
            aChartData.push(new Array()); 
        } 
        aLastCollectionDataSetNames = new Array();  
        var iCurrentDatset = 0;                   
        for (var j=p_iFirstDataSet; j<iLastDataSet; j++){ 
            var aDataSet = aCollectionDataSets[aCollectionDataSetNames[j]];
            for (var i=0; i<aLastCollectionValueNames.length;i++){  
                if (i==0) aLastCollectionDataSetNames.push(aCollectionDataSetNames[j]);
                aChartData[i].push(aDataSet.getCountOf(aLastCollectionValueNames[i]));               
                if (i>0 && p_bAccumulate) aChartData[i][iCurrentDatset] = aChartData[i][iCurrentDatset]+aChartData[i-1][iCurrentDatset];
            }
            iCurrentDatset++;
        }
        return (p_bAsPercent) ? getDataAsPercent(aChartData) : aChartData;
    }
    this.getChartDataReverse = function(p_bAccumulate, p_bAsPercent, p_iMaxDataSets, p_iFirstDataSet, p_aValueTypes){
        sortCollectionDataSetNames();
        iLastDataSet = aCollectionDataSetNames.length;
        if (!p_iFirstDataSet) p_iFirstDataSet = 0;        
        if (p_iMaxDataSets && (p_iFirstDataSet + p_iMaxDataSets) < aCollectionDataSetNames.length) iLastDataSet = p_iFirstDataSet + p_iMaxDataSets;
        if (p_aValueTypes) {
            aLastCollectionDataSetNames = new Array();
            for (var i=0; i<p_aValueTypes.length; i++){
                if (0<=p_aValueTypes[i] && p_aValueTypes[i]<aCollectionValueNames.length){ 
                    var currIndex = p_aValueTypes[i];
                    aLastCollectionDataSetNames.push(aCollectionValueNames[currIndex]);
                }    
            }
        } else {            
            aLastCollectionDataSetNames = aCollectionValueNames;
        } 
        var aChartData = new Array();  
        aLastCollectionValueNames = new Array();
        var iCurrentDatset = 0;            
        for (var j=p_iFirstDataSet; j<iLastDataSet; j++){
            aChartData.push(new Array());
            aLastCollectionValueNames.push(aCollectionDataSetNames[j]);
            var aDataSet = aCollectionDataSets[aCollectionDataSetNames[j]];
            for (var i=0; i<aLastCollectionDataSetNames.length;i++){
               aChartData[iCurrentDatset].push(aDataSet.getCountOf(aLastCollectionDataSetNames[i]));                          
               if (iCurrentDatset>0 && p_bAccumulate) aChartData[iCurrentDatset][i] = aChartData[iCurrentDatset][i]+aChartData[iCurrentDatset-1][i];
            }
            iCurrentDatset++;
        }
        return (p_bAsPercent) ? getDataAsPercent(aChartData) : aChartData;;
    }
    this.getSingleChartData = function(sKey, p_aValueTypes){    
        sortCollectionDataSetNames();
        if (p_aValueTypes) {
            aLastCollectionValueNames = new Array();
            aLastCollectionValueColors = new Array();
            for (var i=0; i<p_aValueTypes.length; i++){
                if (0<=p_aValueTypes[i] && p_aValueTypes[i]<aCollectionValueNames.length){ 
                    var currIndex = p_aValueTypes[i];
                    aLastCollectionValueNames.push(aCollectionValueNames[currIndex] );
                    aLastCollectionValueColors.push(aCollectionValueColors[currIndex]);
                }    
            }
        } else {            
            aLastCollectionValueNames = aCollectionValueNames;
            aLastCollectionValueColors = aCollectionValueColors;
        } 
        var aChartData = new Array();  
        var aDataSet = aCollectionDataSets[sKey];         
        for (var i=0; i<aLastCollectionValueNames.length;i++){
            aChartData.push(aDataSet.getCountOf(aLastCollectionValueNames[i]));
        }    
        return aChartData;
    }
    this.getCollectionDataSetNames = function(){
        sortCollectionDataSetNames();
        return aCollectionDataSetNames;
    }
    this.getLastCollectionDataSetNames = function(){
        return aLastCollectionDataSetNames;
    }
    this.countValue= function(p_CollectionSetName,p_sValueName){
        getCollectionDataSet(p_CollectionSetName).countValue(p_sValueName);
    }  
    this.countAttrValue= function(p_CollectionSetName,p_oObj,p_iAttrTypeNum){
        getCollectionDataSet(p_CollectionSetName).countValue(getValue(p_oObj, p_iAttrTypeNum));
    }  
    this.setCollectionValueNames = function(p_aCollectionValueNames){
        aCollectionValueNames = p_aCollectionValueNames;
    }
    this.getCollectionValueNames = function(){
        return aCollectionValueNames;
    } 
    this.getLastCollectionValueNames = function(){
        return aLastCollectionValueNames;
    }  
    this.getCollectionValueTypes = function(){
        return aCollectionValueTypes;
    }     
    this.SetCollValueNames4AttrTypes = function(p_iAttrTypeNum,p_aCollectionValueTypes){
        aCollectionValueTypes = p_aCollectionValueTypes;
        aCollectionValueNames = getTypeValueNames(p_iAttrTypeNum, p_aCollectionValueTypes);
    }
    this.setCollectionValueColors = function(p_aCollectionValueColors){
        aCollectionValueColors = p_aCollectionValueColors;
    }
    this.getCollectionValueColors = function(){
        return aCollectionValueColors;
    }
    this.getLastCollectionValueColors = function(){
        return aLastCollectionValueColors;
    }
    function sortCollectionDataSetNames(){        
        if (!bSort) {
            aCollectionDataSetNames.sort();
            bSort = true;
        }    
    }
    function getDataAsPercent(aChartData){
        var aSum = new Array(aChartData[0].length)
        for (var i=0; i<aChartData.length;i++){
            for (var j=0;j<aChartData[i].length;j++){
                if (i==0) aSum[j] = 0;
                aSum[j] = aSum[j] + aChartData[i][j];
            }
        }
        for (var i=0; i<aChartData.length;i++){
            for (var j=0;j<aChartData[i].length;j++){
                if (aSum[j]!=0) aChartData[i][j] = Math.round(aChartData[i][j]/aSum[j] * 10000)/100;
            }
        }
        return aChartData;
    }
    function collectionDataSet(p_sCollectionSetName){
        var sCollectionSetName = p_sCollectionSetName;
        var aValues = new Array();
        this.countValue= function(p_ValueName){
            aValues[p_ValueName] = aValues[p_ValueName] ? aValues[p_ValueName] + 1 : 1;
        }   
        this.getCountOf = function(p_ValueName){ 
            return aValues[p_ValueName] ? aValues[p_ValueName] : 0;
        }
    }     
    function getCollectionDataSet(p_sCollectionSetName){
        if (!aCollectionDataSets[p_sCollectionSetName]) {
            aCollectionDataSets[p_sCollectionSetName] = new collectionDataSet(p_sCollectionSetName);
            aCollectionDataSetNames.push(p_sCollectionSetName);
        }    
        return aCollectionDataSets[p_sCollectionSetName];
    }
    function getValue(oItem, p_iAttrTypeNum) {
        var oAttr = oItem.Attribute(p_iAttrTypeNum, g_nLoc,true/*Fallback*/);
        if (!oAttr) return "undefined";
        if (!oAttr.IsMaintained()) return "undefined";
        if (oAttr.getValue()) return g_oFilter.getOriginalAttrValueTypeName(oAttr.MeasureUnitTypeNum());
        return oAttr.getValue();
    }
}

function getColor4RGB(p_iRed,p_iGreen,p_iBlue){
    return new java.awt.Color(getNormRGBValue(p_iRed), getNormRGBValue(p_iGreen), getNormRGBValue(p_iBlue));
}
function getNormRGBValue(p_iValue){
    p_iValue = (p_iValue && typeof(p_iValue) == "number") ? (p_iValue<=0 ? 0 : (p_iValue>255 ? 255 : p_iValue ) ) : 0;
    return p_iValue/255;
}
function getTypeValueNames(p_nAttrTypeNum, p_aValues){
    var aValues = new Array();
    for (var i=0;i<p_aValues.length;i++){
        aValues.push(g_oFilter.AttrValueType(p_nAttrTypeNum, p_aValues[i]));
    }
    return aValues
}
    


