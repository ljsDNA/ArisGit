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

var g_nloc = Context.getSelectedLanguage();
var g_arrModelType = [Constants.MT_VAL_ADD_CHN_DGM, Constants.MT_ENTERPRISE_BPMN_COLLABORATION, Constants.MT_ENTERPRISE_BPMN_PROCESS, Constants.MT_EEPC];
var g_oModels = new Array();

var g_Font = getString("FONT");
var outfile = Context.createOutputObject(Context.getSelectedFormat(), Context.getSelectedFile());

outfile.DefineF("TABLE_CONTENT", g_Font, 8, RGB(0,0,0), Constants.C_TRANSPARENT,  Constants.FMT_LEFT| Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1)
outfile.DefineF("TITLE", g_Font, 21, RGB(0,0,0), Constants.C_TRANSPARENT,  Constants.FMT_BOLD | Constants.FMT_CENTER| Constants.FMT_VTOP, 0, 0, 1.76, 8.82, 0, 1)
outfile.DefineF("REPORT1", g_Font, 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
outfile.DefineF("REPORT2", g_Font, 16, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
outfile.DefineF("REPORT3", g_Font, 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
outfile.DefineF("DEFAULT", g_Font, 11, RGB(0,0,0), Constants.C_TRANSPARENT,  Constants.FMT_LEFT| Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1)
outfile.DefineF("HEADING_1", g_Font, 18, RGB(0,0,0), Constants.C_TRANSPARENT,  Constants.FMT_BOLD | Constants.FMT_LEFT| Constants.FMT_VTOP| Constants.FMT_TOCENTRY0 , 0, 0, 4, 4, 0, 1)
outfile.DefineF("HEADING_2", g_Font, 14, RGB(0,0,0), Constants.C_TRANSPARENT,  Constants.FMT_ITALIC | Constants.FMT_BOLD | Constants.FMT_LEFT| Constants.FMT_VTOP| Constants.FMT_TOCENTRY1 , 0, 0, 2, 2, 0, 1)
outfile.DefineF("HEADING_3", g_Font, 12, RGB(0,0,0), Constants.C_TRANSPARENT,  Constants.FMT_ITALIC | Constants.FMT_BOLD | Constants.FMT_LEFT| Constants.FMT_VTOP| Constants.FMT_TOCENTRY2 , 0, 0, 1, 1, 0, 1)
outfile.DefineF("HEADING_4", g_Font, 12, RGB(0,0,0), Constants.C_TRANSPARENT,  Constants.FMT_ITALIC | Constants.FMT_BOLD | Constants.FMT_LEFT| Constants.FMT_VTOP| Constants.FMT_TOCENTRY3 , 0, 0, 0, 0, 0, 1)

function main(){
    
    if (ArisData.getSelectedDatabases().length>0){
        g_oModels = ArisData.getSelectedDatabases()[0].Find(Constants.SEARCH_MODEL, g_arrModelType);
    }    
    
    if (ArisData.getSelectedGroups().length>0){
        g_oModels = ArisData.getSelectedGroups()[0].ModelList(true, g_arrModelType);
    }
    
    //var oSelectedModels = ArisData.getSelectedModels([Constants.MT_VAL_ADD_CHN_DGM]);
    var oSelectedModels = new Array();
    oSelectedModels = ArisData.getSelectedModels();
    if (oSelectedModels.length>0){
        g_oModels.push(oSelectedModels[0]);
        getAssignModels(oSelectedModels[0]);
    }

    //retrive function objects
    var oFunctionObjs = retriveObjects(g_oModels);
    
    //outfile.BeginSection(false, Constants.SECTION_INDEX);
    outfile.SetAutoTOCNumbering(true)
    // Create page header, page footer, headline and information header
    setReportHeaderFooter(outfile, g_nloc, true, true, true);
    //
    //outfile.BeginParagraphF("DEFAULT")
		//to format the TOC output use output.SetTOCFormat(iLevel, sFont, iFontSize, nFontColor, nBackgroundColor, nFormat, nLeftIndentation, nRightIndentation, nDistTop, nDistBottom)
    outfile.SetTOCFormat(0, getString("FONT"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT , 0, 0, 0, 0);
    outfile.SetTOCFormat(1, getString("FONT"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT , 5, 5, 2, 2);
    outfile.SetTOCFormat(2, getString("FONT"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT , 10 , 5, 2, 2);
    outfile.SetTOCFormat(3, getString("FONT"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 15, 5, 2, 2);
    //Output text
	outfile.OutputField( Constants.FIELD_TOC, g_Font, 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_LEFT)
    //outfile.EndSection();
    //outfile.BeginSection(true, Constants.SECTION_DEFAULT);
    outputFunction(oFunctionObjs);
    //outfile.EndSection();
    outfile.WriteReport();
}

function outputFunction(oItems){
    
    for (var i=0; i<oItems.length; i++){
        var oAssignedRisks = oItems[i].getConnectedObjs([Constants.OT_RISK], Constants.EDGES_IN, [Constants.CT_OCCUR]);
        oAssignedRisks = ArisData.sort(oAssignedRisks, Constants.AT_NAME, g_nloc);
        var oRiskList = new Array();
        
        for (var j=0; j<oAssignedRisks.length; j++){
            if (oAssignedRisks[j].Attribute(Constants.AT_IMPLEMENTATION_STATUS, g_nloc).IsMaintained()==false){
                oRiskList.push(oAssignedRisks[j]);
            }
        }
        
        if (oRiskList.length>0){
            //Activity section
            if (i>0){
                outfile.OutputField( Constants.FIELD_NEWPAGE, g_Font, 11, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT)
            }

            outfile.addLocalBookmark ( "2" )
            outfile.BeginParagraphF("HEADING_1")
            outfile.OutputLnF(getString("ACTIVITY_") + " " + oItems[i].Name(g_nloc), "HEADING_1")
            outfile.EndParagraph()
            
            outfile.BeginTable(100, Constants.C_TRANSPARENT, Constants.C_TRANSPARENT,  Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0)
                
                outfile.TableRow();
                    outfile.TableCell(getString("ACTIVITY_DESC"), 30, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    outfile.TableCell(oItems[i].Attribute(Constants.AT_DESC, g_nloc).getValue(), 70, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);             
                
                outfile.TableRow();
                    outfile.TableCell(getString("CRITICALITY"), 30, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    outfile.TableCell(oItems[i].Attribute(Constants.AT_CRITICALITY, g_nloc).getValue(), 70, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);             
                
                outfile.TableRow();
                    outfile.TableCell(getString("MODEL_NAME"), 30, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

                    var occModels = new Array();
                    occModels= getOccModels(oItems[i]);
                    outfile.TableCell(convertArrayToString(occModels, "\n"), 70, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0); 

                outfile.TableRow();
                    outfile.TableCell(getString("MODEL_OWNER"), 30, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    var sModelOwner = "";
                    for (var om in occModels) {
                        if (sModelOwner.length != "") {
                            sModelOwner += "\n";
                        }
                        sModelOwner += getUsersName(occModels[om].Attribute(Constants.AT_PERS_RESP, g_nloc).getValue());                  
                    }
                    outfile.TableCell(sModelOwner, 70, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);            
                                        
            outfile.EndTable("", 100, g_Font, 11, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            
            
            //risk assigned to function
            outfile.OutputLn("\n",getString("FONT"),11, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT | Constants.FMT_BOLD,0);
            
            outfile.BeginTable(100, Constants.C_TRANSPARENT, Constants.C_TRANSPARENT,  Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0)
                outfile.TableRow();
                    outfile.TableCell(getString("RISK_ASSIGNED_"), 100, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    //outfile.TableCell("", 65, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);            
            outfile.EndTable("", 100, g_Font, 11, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

            outfile.BeginTable(100, RGB(0,0,0), Constants.C_TRANSPARENT,  Constants.FMT_LEFT, 0)
                outfile.TableRow();
                    outfile.TableCell(getString("RISK"), 25, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    outfile.TableCell(getString("RISK_DESC"), 25, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    outfile.TableCell(getString("RISK_OWNER"), 15, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    outfile.TableCell(getString("RISC_IMPACT"), 15, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    outfile.TableCell(getString("RISK_PROB"), 20, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            
                    for (var k=0; k<oRiskList.length; k++){
                        outfile.TableRow();
                            outfile.TableCell(oRiskList[k].Name(g_nloc), 25, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                            outfile.TableCell(oRiskList[k].Attribute(Constants.AT_DESC, g_nloc).getValue(), 25, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                            outfile.TableCell(getUsersName(oRiskList[k].Attribute(Constants.AT_PERS_RESP, g_nloc).getValue()), 15, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                            outfile.TableCell(oRiskList[k].Attribute(Constants.AT_AAM_IMPACT, g_nloc).getValue(), 15, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                            outfile.TableCell(oRiskList[k].Attribute(Constants.AT_AAM_PROBABILITY, g_nloc).getValue(), 20, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    }
            
            outfile.EndTable("", 100, g_Font, 11, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            outfile.OutputLn("" + "\n",getString("FONT"),11, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT | Constants.FMT_BOLD,0);                  
            
            //risk section
            for (var k=0; k<oRiskList.length; k++){
                outfile.OutputField( Constants.FIELD_NEWPAGE, g_Font, 11, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT)
                
                outfile.addLocalBookmark ( "3" )
                outfile.BeginParagraphF("HEADING_2")
                outfile.OutputLnF(getString("RISK_") + " " + oRiskList[k].Name(g_nloc), "HEADING_2");
                outfile.EndParagraph()
                
                outfile.BeginTable(100, Constants.C_TRANSPARENT, Constants.C_TRANSPARENT,  Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0)
                    outfile.TableRow();
                        outfile.TableCell(getString("RISK_DESC"), 35, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                        outfile.TableCell(oRiskList[k].Attribute(Constants.AT_DESC, g_nloc).getValue(), 65, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);            
                    
                    outfile.TableRow();
                        outfile.TableCell(getString("RISK_OWNER"), 35, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                        outfile.TableCell(oRiskList[k].Attribute(Constants.AT_PERS_RESP, g_nloc).getValue(), 65, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);             
                    
                    outfile.TableRow();
                        outfile.TableCell(getString("RISC_IMPACT"), 35, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                        outfile.TableCell(oRiskList[k].Attribute(Constants.AT_AAM_IMPACT, g_nloc).getValue(), 65, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);             
                    
                    outfile.TableRow();
                        outfile.TableCell(getString("RISK_PROB"), 35, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                        outfile.TableCell(oRiskList[k].Attribute(Constants.AT_AAM_PROBABILITY, g_nloc).getValue(), 65, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);             
                    
                    outfile.TableRow();
                        outfile.TableCell(getString("RISK_REMARK"), 35, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                        outfile.TableCell(oRiskList[k].Attribute(Constants.AT_REM, g_nloc).getValue(), 65, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);             
    
                    outfile.TableRow();
                        outfile.TableCell(getString("POSSIBLE_SOLUTION"), 35, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                        outfile.TableCell(oRiskList[k].Attribute(Constants.AT_POSSIBLE_SOLUTION, g_nloc).getValue(), 65, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);   
    
                    outfile.TableRow();
                        outfile.TableCell(getString("REALIZATION_CAT"), 35, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                        outfile.TableCell(oRiskList[k].Attribute(Constants.AT_REALIZATION_CATEGORY, g_nloc).getValue(), 65, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);   
    
                    outfile.TableRow();
                        outfile.TableCell(getString("IMPL_SOL_COST"), 35, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                        outfile.TableCell(oRiskList[k].Attribute(Constants.AT_IMPLEMENTATION_COSTS, g_nloc).getValue(), 65, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);   
    
                    outfile.TableRow();
                        outfile.TableCell(getString("IMPL_SOL_HORIZON"), 35, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                        outfile.TableCell(oRiskList[k].Attribute(Constants.AT_IMPLEMENTATION_HORIZON, g_nloc).getValue(), 65, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);                   

                outfile.EndTable("", 100, g_Font, 11, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0); 
                
                outfile.OutputLn("" + "\n",getString("FONT"),11, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT | Constants.FMT_BOLD,0);  

                //
                outfile.BeginTable(100, Constants.C_TRANSPARENT, Constants.C_TRANSPARENT,  Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0)
                    outfile.TableRow();
                        outfile.TableCell("", 30, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                        outfile.TableCell(getString("ACTIVITY"), 70, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    
                    outfile.TableRow();
                        outfile.TableCell(getString("OCCURS_AT"), 30, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                        
                        var oCxnFunctions = oRiskList[k].getConnectedObjs([Constants.OT_FUNC], Constants.EDGES_OUT, [Constants.CT_OCCUR]);
                        oCxnFunctions =  ArisData.sort(oCxnFunctions, Constants.AT_NAME, g_nloc);
                        
                        //outfile.TableCell(oItems[i].Name(g_nloc), 70, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);   
                        outfile.TableCell(convertArrayToString(oCxnFunctions, "\n"), 70, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);   
                    
                    outfile.EndTable("", 100, g_Font, 11, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0); 
                
                //
                outfile.OutputLn("",getString("FONT"),11, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT | Constants.FMT_BOLD,0);  
                outfile.OutputLn(getString("FILL_IN"),getString("FONT"),11, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT | Constants.FMT_BOLD,0);  
                
                outfile.BeginTable(100, Constants.C_TRANSPARENT, Constants.C_TRANSPARENT,  Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0)
                outfile.TableRow();
                    outfile.TableCell(getString("IMPL_STATUS"), 30, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    outfile.TableCell("", 70, g_Font, 11, Constants.C_WHITE, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                
                    outfile.OutputLn(getString("_APPROVED") + "        " + getString("_REJECTED"),getString("FONT"),11, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT,0);  
                
                outfile.TableRow();
                    outfile.TableCell("", 100, g_Font, 11, Constants.C_WHITE, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                
                outfile.TableRow();
                    outfile.TableCell(getString("PRIORITY"), 30, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    outfile.TableCell("", 70, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);                
                
                    outfile.OutputLn(getString("_VERY_HIGH") + "\n" + getString("_HIGH") + "\n" + getString("_AVERAGE") + "\n" + getString("_LOW") + "\n" + getString("_VERY_LOW"),getString("FONT"),11, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT,0);  

                    outfile.EndTable("", 100, g_Font, 11, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0); 

                outfile.OutputLn("",getString("FONT"),11, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT | Constants.FMT_BOLD,0);  
                outfile.OutputLn(getString("ADD_NOTES"),getString("FONT"),11, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT | Constants.FMT_BOLD,0);  
                
                //
                outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_LEFT, 0)
                outfile.TableRow();
                    outfile.TableCell(getString("COMMENT"), 20, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    outfile.TableCell("", 80, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);                
                                        
                    outfile.OutputLn("\n\n\n\n\n\n",getString("FONT"),11, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT,0);  

                
                outfile.TableRow();
                    outfile.TableCell("", 20, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    outfile.OutputLn(getString("NAME"),getString("FONT"),11, Constants.C_WHITE, RGB(8, 153, 204), Constants.FMT_LEFT,0); 
                    outfile.OutputLn("",getString("FONT"),11, Constants.C_WHITE, RGB(8, 153, 204), Constants.FMT_LEFT,0); 
                    outfile.OutputLn(getString("DATE"),getString("FONT"),11, Constants.C_WHITE, RGB(8, 153, 204), Constants.FMT_LEFT,0); 
                    outfile.OutputLn("",getString("FONT"),11, Constants.C_WHITE, RGB(8, 153, 204), Constants.FMT_LEFT,0); 
                    
                    outfile.TableCell("", 30, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);  
                    outfile.TableCell("", 20, g_Font, 11, Constants.C_WHITE, RGB(8, 153, 204), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0); 
                    outfile.OutputLn(getString("SIGNATURE"),getString("FONT"),11, Constants.C_WHITE, RGB(8, 153, 204), Constants.FMT_LEFT,0); 
                    
                    outfile.TableCell("", 30, g_Font, 11, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0); 
                
                outfile.EndTable("", 100, g_Font, 11, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0); 

            }            
        }
    }
}

function getAssignModels(oItem){
    var objList = oItem.ObjDefListByTypes([Constants.OT_FUNC]);
    
    for (var i=0; i<objList.length; i++){
        var assignModels = objList[i].AssignedModels(g_arrModelType);
        
        for (var j=0; j<assignModels.length; j++){
            if (!(assignModels[j].IsEqual(oItem))){
                if (arrIndexOf(assignModels[j].TypeNum(), g_arrModelType)!=-1){
                    g_oModels.push(assignModels[j]);
                }
                
                if ((assignModels[j].TypeNum()==Constants.MT_VAL_ADD_CHN_DGM) || (assignModels[j].TypeNum()==Constants.MT_ENTERPRISE_BPMN_COLLABORATION)){
                    getAssignModels(assignModels[j]);
                }            
            }
        }
    }
}

function retriveObjects(oItems){
    var arrObjs =  new Array();
    
    for (var i=0; i<oItems.length; i++){
        var objList = oItems[i].ObjDefListByTypes([Constants.OT_FUNC]);
        
        for (var j=0; j<objList.length; j++){
            var occsInModel = objList[j].OccListInModel(oItems[i]);     // BLUE-28316
            if (occsInModel.length > 0 && occsInModel[0].SymbolNum()!=Constants.ST_PRCS_IF){
                
                var oSuperObjs = oItems[i].getSuperiorObjDefs([Constants.OT_FUNC]);
                
                if (arrIndexOf(objList[j], oSuperObjs)==-1){
                    if (arrIndexOf(objList[j], arrObjs)==-1){
                        arrObjs.push(objList[j]);
                    }          
                }
            }            
        }
    }
    
    arrObjs = ArisData.Unique(arrObjs)
    arrObjs = ArisData.sort(arrObjs, Constants.AT_NAME, g_nloc);
    return arrObjs;
}

function getOccModels(oItem){
    var arrModels = new Array();
    var oObjOccs = oItem.OccList();
    
    for (var i=0; i<oObjOccs.length; i++){
        arrModels.push(oObjOccs[i].Model());
    }
    
    arrModels = ArisData.Unique(arrModels);
    arrModels = ArisData.sort(arrModels, Constants.AT_NAME, g_nloc)
    return arrModels;
}


function convertArrayToString(arrItems, sDelimerter){
    var sRetString = "";
    
    for (var i=0; i<arrItems.length; i++){
        if (sRetString == ""){
            sRetString = arrItems[i].Name(g_nloc);
        }else{
            sRetString = sRetString + sDelimerter + arrItems[i].Name(g_nloc);
        }
    }

    return sRetString;
}

function getUsersName(sLogin) {
    var g_oComponentUMC = Context.getComponent("UMC");
    if (sLogin != null && sLogin != "") {
        var oUser = g_oComponentUMC.getUserByName(sLogin);
        if (isValidName(oUser)) {        
            return oUser.getFirstName() +" "+oUser.getLastName();
        }
        else return sLogin;
    }
    return "";
    
    function isValidName(oUser) {
        return oUser != null && oUser.getFirstName() != "" && oUser.getLastName() != "";
    }    
}

function RGB(r, g, b) {
    return (new java.awt.Color(r/255.0,g/255.0,b/255.0,1)).getRGB() & 0xFFFFFF
} 

function arrIndexOf(item, arrItem){
    for (var i=0; i<arrItem.length; i++){
        if (arrItem[i]==item){
            return i;
        }
    }
    return -1;
}

function setReportHeaderFooter(outfile, nloc, bDisplayServer, bDisplayDatabase, bDisplayUser)
{
    var sTitle = Context.getScriptInfo(Constants.SCRIPT_TITLE);
    setReportHeaderFooterWithTitle(outfile, nloc, bDisplayServer, bDisplayDatabase, bDisplayUser, sTitle)
}

function setReportHeaderFooterWithTitle(outfile, nloc, bDisplayServer, bDisplayDatabase, bDisplayUser, sTitle)  // BLUE-11195
{
	// BLUE-17783 Update report header/footer
    var borderColor = getColorByRGB( 23, 118, 191);
    
    // graphics used in header
    var pictleft  = Context.createPicture(Constants.IMAGE_LOGO_LEFT);
    var pictright = Context.createPicture(Constants.IMAGE_LOGO_RIGHT);
    
    // header + footer settings
    setFrameStyle(outfile, Constants.FRAME_BOTTOM);
    
    //headertitle
    var sHeaderTitle = null;
    
    if (ArisData.getSelectedDatabases().length>0){
        sHeaderTitle = ArisData.getSelectedDatabases()[0].Name(nloc);
    }
    
    if (ArisData.getSelectedGroups().length>0){
        sHeaderTitle = ArisData.getSelectedGroups()[0].Name(nloc);
    }
    
    if (ArisData.getSelectedModels().length>0){
        sHeaderTitle = ArisData.getSelectedModels()[0].Name(nloc);
    }
    
    outfile.BeginHeader();
    outfile.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    outfile.TableRow();
    //outfile.TableCell("", 26, getString("FONT"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    outfile.TableCell("", 74, getString("FONT"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0);
    
    if (sHeaderTitle==null){
        outfile.OutGraphic(pictleft, - 1, 40, 15);
    
    }else{
        outfile.Output(sHeaderTitle, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    }
    
    //outfile.TableCell(sTitle, 48, getString("FONT"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    outfile.TableCell("", 26, getString("FONT"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    outfile.OutGraphic(pictright, - 1, 40, 15);
    outfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    outfile.EndHeader();
    
    setFrameStyle(outfile, Constants.FRAME_TOP);
    
    outfile.BeginFooter();
    outfile.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    outfile.TableRow();
    outfile.TableCell("", 26, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    outfile.OutputField(Constants.FIELD_DATE, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    outfile.Output(" ", getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    outfile.OutputField(Constants.FIELD_TIME, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    outfile.TableCell(sTitle, 48, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    outfile.TableCell("", 26, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    outfile.Output(getString("PAGE") + " ", getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    outfile.OutputField(Constants.FIELD_PAGE, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    outfile.Output(" " + getString("OF") + " ", getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    outfile.OutputField(Constants.FIELD_NUMPAGES, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    outfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    outfile.EndFooter();
    
    outfile.ResetFrameStyle();
    
    // Information header (if enabled)
    outfile.OutputLnF("\n\n\n\n\n\n\n\n", "REPORT1")
    outfile.OutputLnF(sTitle + "\n" + sHeaderTitle, "REPORT1");
    
    outfile.OutputLnF("\n\n", "REPORT1")
    
    outfile.OutputLnF(getString("IDENTIFIED_RISKS"), "REPORT2");
    
    outfile.OutputLnF("\n\n\n\n\n\n\n", "REPORT1")
    
    if(bDisplayServer)
        outfile.OutputLnF((getString("SERVER_") + " " + ArisData.getActiveDatabase().ServerName()), "REPORT3");
    
    if(bDisplayDatabase)
        outfile.OutputLnF((getString("DATABASE_") + " " + ArisData.getActiveDatabase().Name(nloc)), "REPORT3");
    
    if(bDisplayUser)
        outfile.OutputLnF((getString("USER_") + " " + ArisData.getActiveUser().Name(nloc)), "REPORT3");
    
    if(bDisplayServer||bDisplayDatabase||bDisplayUser)
        outfile.OutputLnF("", "REPORT3");
    
    outfile.OutputField(Constants.FIELD_NEWPAGE, getString("FONT"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    
    
    function setFrameStyle(outfile, iFrame) { 
        outfile.SetFrameStyle(Constants.FRAME_TOP, 0); 
        outfile.SetFrameStyle(Constants.FRAME_LEFT, 0); 
        outfile.SetFrameStyle(Constants.FRAME_RIGHT, 0); 
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 0);
        
        outfile.SetFrameStyle(iFrame, 50, Constants.BRDR_NORMAL);
    }    
}

main();
