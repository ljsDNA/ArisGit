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

// Report structure:
//   MAIN function 
//      - generateTestcaseDesc()
//   CENTRAL functions called in main function
//      - generateTestCaseDocuments()
//      - createTestCaseDocu()
//      - printOutTestSteps()
//      - storeTestCaseDocuInModel()
//      - getTestCaseData()
//   OUTPUT functions
//   COMMON functions
//   DIALOG functions
//   DECLARATION's part
//   OBJECT CLASS part

/**********************************************************************************************************************/
/*      CUSTOMER SETTINGS                                                                                             */
/**********************************************************************************************************************/

    // Documentation attributes
    const c_NAME_PREFIX      = "ARIS Testdocument: ";
    const c_SAP_DOC_TYPE_KEY = "TD1";
    const c_SAP_DOC_TYPE     = "Test Case Description";
    const c_SAP_STATUS_KEY   = "RELEASED";
    const c_SAP_STATUS       = "Released";


/**********************************************************************************************************************/
/*      MAIN function                                                                                                 */
/*      - generateTestcaseDesc()                                                                                      */
/**********************************************************************************************************************/

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

var g_nLoc = Context.getSelectedLanguage();

const TEST_DESIGNER_GUID = "b1e79fe0-5767-4988-b302-767810126663";
const TCE_ROOT_FOLDER = "ARIS Test Designer";

// Init ADS
var g_adsComp = Context.getComponent("ADS")
var g_repository = g_adsComp.getADSRepository("sap");
var g_tceFolder = getTceFolder();

var dlgOptions = new DialogOptions();                       // Options set in the user dialog

function generateTestcaseDesc(p_bSetDocAttrs) {
    var selObjDefs = ArisData.getSelectedObjDefs();
    
    var nCheck = checkPreRunConditions(selObjDefs);
    if( nCheck == ERR_FREE ){
        
        var dlg_Result   = usrDialog();                     // Run user Dialog
        if( dlg_Result == -1 )  {

            var startNode = new TestDesignerNode();
            startNode.Initialize( selObjDefs[0] );          // Get starting node info
            getTestCaseData( startNode );                   // Get all test data
            generateTestCaseDocuments(p_bSetDocAttrs);      // Generate documents - printout data
        }
    } else {
        showErrorMessage(nCheck);                           // Preconditions are bad - inform user
    }
}

/**********************************************************************************************************************/
/*      CENTRAL functions called in main function                                                                     */ 
/*      - generateTestCaseDocuments()                                                                                 */ 
/*      - createTestCaseDocu()                                                                                        */ 
/*      - printOutTestSteps()                                                                                         */      
/*      - storeTestCaseDocuInModel()                                                                                  */      
/*      - getTestCaseData()                                                                                           */ 
/**********************************************************************************************************************/

function generateTestCaseDocuments(p_bSetDocAttrs){
    if( checkForOpenModels( ) == false ){
        Context.setProperty(Constants.PROPERTY_SHOW_OUTPUT_FILE, true);
        Context.setProperty(Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false);

        var oMainOutput = Context.createOutputObject(Context.getSelectedFormat(), Context.getSelectedFile());
            DefineMainStyles( oMainOutput );
            BeginMainOutput( oMainOutput );
        var sTmp        = setFileNamesToStrArray( Context.getSelectedPath() );
        
        for(var i=0; i<ga_TSGnted.length; i++){
            // Create TS document's name from TestCaseOwner name
            var sOutFileName    = ga_TSGnted[i].Get("TSNAME");
            sOutFileName        = sOutFileName.replaceAll( "[\\:\\\\\\/\\?\\\"]", gs_Empty );       // BLUE-7079
            
            // if( dlgOptions.opt_AddTCs == 1 ){// Make unique file name when adding TS docus
                sOutFileName    = createUniqueFileName( sTmp, sOutFileName );
                sTmp.push( sOutFileName );
            // }
            sOutFileName    = sOutFileName.concat( getSelFileSuffx() );
            
            ga_TSGnted[i].Set( "TSOUTOBJ", Context.createOutputObject( Context.getSelectedFormat(), sOutFileName ) );// Create and Store output object into HashMap
            createTestCaseDocu( ga_TSGnted[i] );// Write relevant data into output object dif. between PDF and the rest
            ga_TSGnted[i].Get( "TSOUTOBJ" ).WriteReport();// Write TS docu
            
            Context.addOutputFileName( sOutFileName );// Add the TSdocu to Output File
    
            //Store info what was created and where...
            if( dlgOptions.opt_InclTDocu == 1 ){// Store TS documents into the DB
                storeTestCaseDocuInModel( oMainOutput, ga_TSGnted[i], sOutFileName, p_bSetDocAttrs);
            }
            else{// Docus will not go to DB - only to SelectedPath()
                writeInfo( oMainOutput, sOutFileName, Context.getSelectedPath(), gs_Empty );
            }
            
            if( dlgOptions.opt_Nodes == 0 )   break;// Finish if no child nodes should be reported
        }
        
        EndMainOutput( oMainOutput, getString("MSG_REPORT_NAME") );
        oMainOutput.WriteReport();// Output information
    }
    else{
        // Do not create output report file... 
        Context.setProperty(Constants.PROPERTY_SHOW_OUTPUT_FILE, false);
        Context.setProperty(Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false);
    }
}

function createTestCaseDocu( p_TSC ){
    var outputObj   = p_TSC.Get("TSOUTOBJ");
    var colWList    = new java.util.ArrayList();
    colWList.add(25);
    colWList.add(25);
    colWList.add(25);
    colWList.add(25);

    //setupOutputDefault( outputObj );
    DefineTSStyles( outputObj );
    setHeader( outputObj, gs_cEmpty);
    setFooter( outputObj, gs_cEmpty);
    
    // Output TestCase data...
    if( Context.getSelectedFormat() == Constants.OUTPDF ) { 
        outputObj.BeginTable(100, RGB(0,0,0), RGB(255,255,255),  Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0 ); 
    } else { 
        outputObj.BeginTable(100, colWList, RGB(0,0,0), RGB(255,255,255),  Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0 );
    }
    setEmptyLine( outputObj, [0,0,0,0] );
    outputObj.TableRow();
        addCell( outputObj, [0,0,0,0], getString("TESTCASE_ID"), 1, 1, 25, getString("TEXT_ID_STYLE_HEADING1") );// Test case ID
        addCell( outputObj, [0,0,0,0], getString("TESTCASE"), 1, 3, 75, getString("TEXT_ID_STYLE_HEADING1") );// Test case name
    outputObj.TableRow(); 
        addCell( outputObj, [], "", 1, 1, 25, getString("TEXT_ID_STYLE_HEADING3") );
        addCell( outputObj, [], p_TSC.Get("TSNAME"), 1, 3, 75, getString("TEXT_ID_STYLE_HEADING3") );
    setEmptyLine( outputObj, [0,0,0,0] );
    outputObj.TableRow(); 
        addCell( outputObj, [], getString("CREATED_"), 1, 1, 25, getString("TEXT_ID_STYLE_HEADING1") );// Created on
        addCell( outputObj, [], getDateString( new Date()), 1, 1, 25, getString("TEXT_ID_STYLE_DEFAULT") );
        addCell( outputObj, [], getString("PROCESS_CONTEXT_"), 1, 1, 25, getString("TEXT_ID_STYLE_HEADING1") );// Process context
        addCell( outputObj, [], p_TSC.Get("TS_FUNCTYPE"), 1, 1, 25, getString("TEXT_ID_STYLE_DEFAULT") );
    outputObj.TableRow(); 
        addCell( outputObj, [], getString("CREATED_BY_"), 1, 1, 25, getString("TEXT_ID_STYLE_HEADING1") );// Created by
        addCell( outputObj, [], getLoginString( ), 1, 1, 25, getString("TEXT_ID_STYLE_DEFAULT") );
        addCell( outputObj, [], (((dlgOptions.opt_OutTType == 1) && (p_TSC.Get("TSTYPE") != gs_cEmpty))?getString("TEST_TYPE_"):""), 1, 1, 25, getString("TEXT_ID_STYLE_HEADING1") );// test type
        addCell( outputObj, [], ((dlgOptions.opt_OutTType == 1)?p_TSC.Get("TSTYPE"):""), 1, 1, 25, getString("TEXT_ID_STYLE_DEFAULT") );
    outputObj.TableRow(); 
        addCell( outputObj, [], (((dlgOptions.opt_OutResp == 1) && (p_TSC.Get("TSRESP") != gs_cEmpty))?getString("TEST_OWNER_"):""), 1, 1, 25, getString("TEXT_ID_STYLE_HEADING1") );// Test responsible
        addCell( outputObj, [], ((dlgOptions.opt_OutResp == 1)?p_TSC.Get("TSRESP"):""), 1, 1, 25, getString("TEXT_ID_STYLE_DEFAULT") );
        addCell( outputObj, [], (((dlgOptions.opt_OutRndNum == 1) && (p_TSC.Get("TSRNDNUM") != gs_cEmpty))?getString("TEST_ROUND_"):""), 1, 1, 25, getString("TEXT_ID_STYLE_HEADING1") );// Test round
        addCell( outputObj, [], ((dlgOptions.opt_OutRndNum == 1)?p_TSC.Get("TSRNDNUM"):""), 1, 1, 25, getString("TEXT_ID_STYLE_DEFAULT") );
    outputObj.TableRow(); 
        addCell( outputObj, [], (((dlgOptions.opt_OutHRisk == 1) && (p_TSC.Get("TSHRISK") != gs_cEmpty))?getString("HIGH_RISK_"):""), 1, 1, 25, getString("TEXT_ID_STYLE_HEADING1") );// High risk
        addCell( outputObj, [], ((dlgOptions.opt_OutHRisk == 1)?p_TSC.Get("TSHRISK"):""), 1, 3, 75, getString("TEXT_ID_STYLE_DEFAULT") );

    // Output test Path image
    outputTestPathImage();

    // Output test Flow image
    outputTestFlowImage();
        
    // Test Content
    setEmptyLine(outputObj, [0,0,0,0] );
    outputObj.TableRow();
        addCell( outputObj, [], getString("TEST"), 1, 4, 100, getString("TEXT_ID_STYLE_HEADING1") );// Test
    outputObj.TableRow();
        addCell( outputObj, [1,1,1,1], getString("TEST_CONTENT"), 1, 4, 100, getString("TEXT_ID_STYLE_HEADING4") );// Test content
    outputObj.TableRow();
        addCell( outputObj, [0,1,1,1], getString("DESC_"), 1, 4, 100, getString("TEXT_ID_STYLE_HEADING1") );// Description
    outputObj.TableRow();
        addCell( outputObj, [1,1,1,0], ((dlgOptions.opt_OutAct == 1)?p_TSC.Get("TSACTIVITY"):""), 1, 4, 100, getString("TEXT_ID_STYLE_DEFAULT") );
    outputObj.TableRow();
        addCell( outputObj, [0,1,1,1], getString("REALIZATION_"), 1, 4, 100, getString("TEXT_ID_STYLE_HEADING1") );// Realization
    outputObj.TableRow();
        addCell( outputObj, [0,1,1,0], ((dlgOptions.opt_OutTData == 1)?p_TSC.Get("TSDATA"):""), 1, 4, 100, getString("TEXT_ID_STYLE_DEFAULT") );// Test data
//    setEmptyLine(outputObj, [1,1,1,0] );
    outputSelAttributes( p_TSC, outputObj ); // Output user-selected attributes...

    if( dlgOptions.opt_TrgEvt == 1 ){
        outputObj.TableRow();
            addCell( outputObj, [1,1,0,0], getString("START_EVENTS_") , 1, 1, 25, getString("TEXT_ID_STYLE_HEADING1") );
            // Triggering event(s)
            if( p_TSC.Get("TC_OWNER").Get("TRGEVT_ERR") == ERR_FREE ){
                addCell( outputObj, [1,0,1,0], p_TSC.getTrgEndEvents("TRGEVT_ERR") , 1, 3, 75, getString("TEXT_ID_STYLE_DEFAULT") );
            }
            else{
                addCell( outputObj, [1,0,1,0], "", 1, 3, 75, getString("TEXT_ID_STYLE_DEFAULT") );
            }
    }
    
    if( p_TSC.Get("TESTSTEP").length > 0 ){// Printing out TestSteps...
        outputObj.TableRow();
            addCell( outputObj, [0,1,1,1], getString("REALIZAZION_DESC_"), 1, 4, 100, getString("TEXT_ID_STYLE_HEADING1") );// Realization description
        outputObj.TableRow();
            addCell( outputObj, [0,1,1,1], getString("WORK_STEP"), 1, 2, 50, getString("TEXT_ID_STYLE_HEADING5") );
            addCell( outputObj, [], getString("DESC_TEST_DATA"), 1, 2, 50, getString("TEXT_ID_STYLE_HEADING5") );
        for(var i=0; i<p_TSC.Get("TESTSTEP").length; i++){
            var sAppx   = ( ((i+1)/2) == Math.floor((i+1)/2) )?"LIGHT":"DARK";
            printOutTestSteps( outputObj, p_TSC, p_TSC.GetTestStepIdx(i), Packages.java.lang.String( i+1 ).concat(".   "), sAppx);
        }
    }

    // Test Results
    if( dlgOptions.opt_OutExpRes == 1 ){
        outputObj.TableRow();
            addCell( outputObj, [0,1,1,1], getString("RESULT_"), 1, 4, 100, getString("TEXT_ID_STYLE_HEADING1") );
        outputObj.TableRow();
            var aOut    = [0,1,1,0];
            if( dlgOptions.opt_TrgEvt != 1 ) { aOut = [1,1,1,0]; }
            addCell( outputObj, aOut, p_TSC.Get("TSRESULT") , 1, 4, 100, getString("TEXT_ID_STYLE_DEFAULT") );
    }

    // End events
    if( dlgOptions.opt_TrgEvt == 1 ){
        outputObj.TableRow();
            addCell( outputObj, [1,1,0,0], getString("END_EVENTS_") , 1, 1, 25, getString("TEXT_ID_STYLE_HEADING1") );
            if( p_TSC.Get("TC_OWNER").Get("ENDEVT_ERR") == ERR_FREE ){
                addCell( outputObj, [1,0,1,0], p_TSC.getTrgEndEvents("ENDEVT_ERR") , 1, 3, 75, getString("TEXT_ID_STYLE_DEFAULT") );
            }
            else{
                addCell( outputObj, [1,0,1,0], "", 1, 3, 75, getString("TEXT_ID_STYLE_DEFAULT") );
            }
    }
    // Output Directions in small letters
    setEmptyLine( outputObj, [0,0,0,1] );
    outputObj.TableRow();
    addCell( outputObj, [0,0,0,0], getString("INFO_TEXT") , 1, 4, 100, getString("TEXT_ID_STYLE_DEFAULT") );
    outputObj.EndTable("", 100, getString("TEXT_ID_DEFAULT_FONT"), 8, Constants.C_TRANSPARENT, Constants.C_TRANSPARENT, Constants.FILLTYPE_SOLID, Constants.FMT_CENTER, 0);
    
    function outputTestPathImage() {
        // Output test Path image
        var oEmfData    = getTestPathImage( p_TSC.Get("TC_OWNER").Get("DEF") );     // AME-6375
        if( (oEmfData != null) && (oEmfData.length > 0) && (dlgOptions.opt_PathGraph == 1) ){
            try{
                var aZipFile    = unzipPathImage( oEmfData );
                if( (aZipFile != null) && (aZipFile.length > 0) ){
                    setEmptyLine( outputObj, [0,0,0,0] );
                    outputObj.TableRow(); 
                    addCell( outputObj, [], getString("AFFECTED_TEST_PATH"), 1, 4, 100, getString("TEXT_ID_STYLE_HEADING1") );// Test path image LABEL output
                    for(var i=0; i<aZipFile.length; i++){
                        //Dialogs.MsgBox( "Name\t: " + aZipFile[i].Get("NAME") + "\n" + "Length\t: " + aZipFile[i].Get("DATA").length + "bytes\n")
                        var oPicture    = Context.createPicture( aZipFile[i].Get("DATA"), Constants.IMAGE_FORMAT_EMF );
                        if( oPicture != null ){
                            outputObj.TableRow();
                            var picSize = ResizePicture( outputObj, oPicture, (outputObj.GetPageWidth() - outputObj.GetLeftMargin() - outputObj.GetRightMargin()), null );
                            addCell( outputObj, [], "", 1, 4, 100, getString("TEXT_ID_STYLE_HEADING1") );
                            outputObj.OutGraphic( oPicture, -1, picSize["WIDTH"], picSize["HEIGHT"] );
                        }
                    }
                }
            }
            catch(err){
            }
        }
        
        function getTestPathImage(oObjDef) {
            // AME-6375
            if (g_tceFolder != null) {
                var tceDocumentKey = getTceDocumentKey(oObjDef);
                var projectGuid = getProjectGuid(oObjDef);
                
                var adsFolder = getAdsFolder(projectGuid);
                if (adsFolder != null) {
                    
                    var document = g_repository.getDocument(adsFolder, tceDocumentKey, tceDocumentKey);
                    if (document != null) {
                        var inputStream = document.getDocumentContent();
                        return org.apache.commons.io.IOUtils.toByteArray(inputStream);
                    }
                }
            }
            return getAttrBlobValue( oObjDef, Constants.AT_TCE_TEST_PATH_IMAGE, g_nLoc );
        }
    }

    function outputTestFlowImage() {
        // Output test Flow image
        var oTest   = p_TSC.Get("TC_OWNER").Get("ASSMOD");
        if( (oTest != null) && (dlgOptions.opt_ModGraph == 1) ){
            var oPicture    = oTest.Graphic( false, false, g_nLoc );
            if( oPicture != null ){
                // var aPicSize    = ResizePicture( outputObj, oPicture, [Math.round( (outputObj.GetPageWidth() - outputObj.GetLeftMargin() - outputObj.GetRightMargin())/4 ), ""]);            
                setEmptyLine(outputObj, [0,0,0,0] );
                outputObj.TableRow(); 
                addCell( outputObj, [], getString("TEST_FLOW"), 1, 4, 100, getString("TEXT_ID_STYLE_HEADING1") );// Model image
                outputObj.OutGraphic( oPicture, -1, ((outputObj.GetPageWidth() - outputObj.GetLeftMargin()) - outputObj.GetRightMargin()), ((outputObj.GetPageHeight() - outputObj.GetTopMargin()) - outputObj.GetBottomMargin() - 60) );
            }
        }
    }    
}

function printOutTestSteps( outputObj, p_TSC, p_TestStep,  p_Idx, p_Style){
    var tmpTS           = getTestCaseByTestCaseOwner( ga_TSGnted, p_TestStep.Get("DEF") );// Test-case information on child node
    var sStyleBold      = (p_Style == "DARK")?getString("TEXT_ID_STYLE_DEFAULT2"):getString("TEXT_ID_STYLE_DEFAULT4");
    var sStyleNormal    = (p_Style == "DARK")?getString("TEXT_ID_STYLE_DEFAULT3"):getString("TEXT_ID_STYLE_DEFAULT5");

    outputObj.TableRow();
        addCell( outputObj, [0,1,1,1], p_Idx.concat( tmpTS.Get("TSNAME") ), 1, 2, 50, sStyleBold );// Work-step name
        addCell( outputObj, [0,1,0,1], getString("DESC_"), 1, 1, 25, sStyleBold );// Work-step description
        addCell( outputObj, [0,0,1,1], ((dlgOptions.opt_OutAct == 1)?tmpTS.Get("TSACTIVITY"):""), 1, 1, 25, sStyleNormal );
    if( tmpTS != null ){
        outputObj.TableRow();
            addCell( outputObj, [0,1,1,0], "", 1, 2, 50, sStyleBold );
            addCell( outputObj, [0,1,0,0], getString("REALIZATION_"), 1, 1, 25, sStyleBold );// Work-step Realization
            // Work-step triggering event
            if( tmpTS.Get("TC_OWNER").Get("TRGEVT_ERR") == ERR_FREE ){
                addCell( outputObj, [0,0,1,0], tmpTS.getTrgEndEvents("TRGEVT_ERR"), 1, 1, 25, sStyleNormal );
            }
            else{
                addCell( outputObj, [0,0,1,0], "", 1, 1, 25, sStyleNormal );
            }

        // Work-step; Test data
        outputObj.TableRow();
            addCell( outputObj, [0,1,1,0], "", 1, 2, 50, sStyleBold );
            addCell( outputObj, [0,1,0,0], "", 1, 1, 25, sStyleBold );
            addCell( outputObj, [0,0,1,0], ((dlgOptions.opt_OutTData == 1)?tmpTS.Get("TSDATA"):""), 1, 1, 25, sStyleNormal );
                
        // Work-step; Assignments
        var aTmp    = tmpTS.Get("TC_OWNER").Get("VARASGNS");
        if( (aTmp != null) && (aTmp.isEmpty() == false) ){
            var iterator    = aTmp.keySet().iterator();
            while(iterator.hasNext()){
                var idx = iterator.next();
                var aAssgns = aTmp.get( idx );
                outputObj.TableRow();
                    addCell( outputObj, [0,1,1,0], "", 1, 2, 50, sStyleBold );
                    addCell( outputObj, [1,1,0,1], ArisData.ActiveFilter().ObjTypeName( idx ), 1, 1, 25, sStyleBold );
                    addCell( outputObj, [1,0,1,1], getAssignmentString( aAssgns ), 1, 1, 25, sStyleNormal );
            }
        }
        
        outputObj.TableRow();
            addCell( outputObj, [0,1,1,0], "", 1, 2, 50, sStyleBold );
            addCell( outputObj, [0,1,0,0], getString("RESULT_"), 1, 1, 25, sStyleBold );// Work-step Result
            // Work-step end event
            if( tmpTS.Get("TC_OWNER").Get("ENDEVT_ERR") == ERR_FREE ){
                addCell( outputObj, [0,0,1,0], tmpTS.getTrgEndEvents("ENDEVT_ERR"), 1, 1, 25, sStyleNormal );
            }
            else{
                addCell( outputObj, [0,0,1,0], "", 1, 1, 25, sStyleNormal );
            }

       if( dlgOptions.opt_OutExpRes == 1 ){// Work-step; Test Result
            outputObj.TableRow();
            addCell( outputObj, [0,1,1,0], "", 1, 2, 50, sStyleBold );
            addCell( outputObj, [0,1,0,0], "", 1, 1, 25, sStyleBold );
            addCell( outputObj, [0,0,1,0], tmpTS.Get("TSRESULT"), 1, 1, 25, sStyleNormal );
        }
    }
}

function storeTestCaseDocuInModel( p_Output, p_TSC, p_FName, p_bSetDocAttrs) {
    var oModel      = null;
    var oOcc        = null;
    var oDef        = null;
    var sNodeName   = p_TSC.Get("TSNAME");
    
    var nModTp  = (p_TSC.Get("TC_OWNER").Get("DEF").TypeNum() != Constants.OT_DP_FUNC_TYPE)?Constants.MT_FUNC_ALLOC_DGM:Constants.MT_ACS_DGM;
    // Check for group existence
    if( p_TSC.Get("TSGRP") != null ){
        // Check for model existence
        var aTmp = getAssignedModels(p_TSC.Get("TC_OWNER").Get("DEF"), nModTp); // AGA-16020
        if( aTmp.length > 0 )   { oModel    = aTmp[0]; }
        else{
            oModel  = p_TSC.Get("TSGRP").CreateModel( nModTp, sNodeName, g_nLoc );
			setAttrStrValue( oModel, Constants.AT_SAP_DOM, "TCE_TRANSACTION_SCOPING", g_nLoc );
        }
        try{
            // Create or overwrite the infocarrier
            var aTmp    = oModel.ObjOccListFilter(Constants.OT_INFO_CARR);
            if( (aTmp.length > 0 ) && (dlgOptions.opt_TCs == 0) ) { deleteOccsInModel( oModel, aTmp, true ); }
            if( (aTmp.length > 0 ) && (dlgOptions.opt_TCs == 1) ){
                var aStr    = setOccNameToStringArray( aTmp );
                sNodeName   = createUniqueFileName( aStr, sNodeName );
            }
            
            var oDef    = p_TSC.Get("TSGRP").CreateObjDef( Constants.OT_INFO_CARR, sNodeName, g_nLoc );
            var oOcc    = oModel.createObjOcc( Constants.ST_SAP_TEST_DOC, oDef, 10, 10, true );
            var aFncOcc = p_TSC.Get("TC_OWNER").Get("DEF").OccListInModel( oModel );
            // Create connection occurrence
            var oFncOcc = null;
            if( aFncOcc.length < 1 )    { oFncOcc = oModel.createObjOcc( getDefSymbol( oModel, p_TSC.Get("TC_OWNER").Get("DEF") ), p_TSC.Get("TC_OWNER").Get("DEF"), 10, 10, true ); }
            if( aFncOcc.length == 1 )   { oFncOcc = aFncOcc[0]; }
            if( (oFncOcc != null) && (oOcc != null) && (oModel != null) ){
                var sourcePoint = new java.awt.Point( oOcc.X(), oOcc.Y() );
                var targetPoint = new java.awt.Point( oFncOcc.X(), oFncOcc.Y() );
                var pointArray  = new Array(sourcePoint, targetPoint);
                oModel.CreateCxnOcc( false, oOcc, oFncOcc, Constants.CT_PROV_INP_FOR, pointArray);
            }
            
            // Create link and add assignment for TS document to infocarrier object
            var sLink   = Packages.java.lang.String( Context.getSelectedPath() ).concat( p_FName );
            p_TSC.Get("TC_OWNER").Get("DEF").CreateAssignment( oModel, false );
            setAttrStrValue( oDef, Constants.AT_EXT_1, sLink, g_nLoc );
            
            if (p_bSetDocAttrs) {
                setDocAttributes(oDef, p_FName, sNodeName);
            }
            oModel.doLayout();
        }
        catch(err){
        }
    }
        
    // Write info into the main output object
    if( (oOcc != null) && (oDef != null) && (oModel != null) ){
        var sModelName = new java.lang.String(oModel.Name(g_nLoc)); // AGA-16020
        writeInfo( p_Output, p_FName, p_TSC.Get("TSPATH"), sModelName.concat(" (").concat(oModel.Type()).concat(")") );
    }
    
    function getAssignedModels(oObjDef, nModelType) {
        try {
            return oObjDef.AssignedModels(nModelType);
        } catch(ex) { return []; }
    }
}

function getTestCaseData( p_Node ){
    var newTSCase   = new TestCaseNode();
        newTSCase.Initialize( p_Node );
        ga_TSGnted.push( newTSCase );
    var aChldNodes  = newTSCase.Get("TESTSTEP");        
    for(var i=0; i<aChldNodes.length; i++){
        getTestCaseData( aChldNodes[i] );
    }
}

/**********************************************************************************************************************/
/*      OUTPUT functions                                                                                              */
/**********************************************************************************************************************/

function outputSelAttributes( p_TSC, outputObj ){
    setEmptyLine( outputObj, [1,1,1,0] );
    if( (dlgOptions.opt_OutResp == 1) && (p_TSC.Get("TSRESP") != gs_cEmpty) )     { outputInnerTable( outputObj, ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_RESPONSIBLE), p_TSC.Get("TSRESP") ); }
    if( (dlgOptions.opt_OutTData == 1) && (p_TSC.Get("TSDATA")!= gs_cEmpty) )     { outputInnerTable( outputObj, ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_DATA), p_TSC.Get("TSDATA") ); }
    if( (dlgOptions.opt_OutExpRes == 1) && (p_TSC.Get("TSRESULT")!= gs_cEmpty) )  { outputInnerTable( outputObj, ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_EXPECT_TEST_RESULT), p_TSC.Get("TSRESULT") ); }
    if( (dlgOptions.opt_OutAct == 1) && (p_TSC.Get("TSACTIVITY")!= gs_cEmpty) )   { outputInnerTable( outputObj, ArisData.ActiveFilter().AttrTypeName(Constants.AT_AAM_TEST_ACTIVITY), p_TSC.Get("TSACTIVITY") ); }
    if( (dlgOptions.opt_OutRndNum == 1) && (p_TSC.Get("TSRNDNUM")!= gs_cEmpty) )  { outputInnerTable( outputObj, ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_ROUND_NUM), p_TSC.Get("TSRNDNUM") ); }
    if( (dlgOptions.opt_OutHRisk == 1) && (p_TSC.Get("TSHRISK")!= gs_cEmpty) )    { outputInnerTable( outputObj, ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_HIGH_RISK), p_TSC.Get("TSHRISK") ); }
    if( (dlgOptions.opt_OutTType == 1) && (p_TSC.Get("TSTYPE")!= gs_cEmpty) )     { outputInnerTable( outputObj, ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_TYPE), p_TSC.Get("TSTYPE") ); }
    setEmptyLine( outputObj, [0,1,1,1] );

    var aTmp    = p_TSC.Get("TC_OWNER").Get("VARASGNS");
    if( (aTmp != null) && (aTmp.isEmpty() == false) ){
        setEmptyLine( outputObj, [1,1,1,0] );        
        var iterator    = aTmp.keySet().iterator();
        while(iterator.hasNext()){
            var idx = iterator.next();
            var aAssgns = aTmp.get( idx );
            outputObj.TableRow();
                addCell( outputObj, [0,1,1,0], "", 1, 2, 50, getString("TEXT_ID_STYLE_DEFAULT") );
                addCell( outputObj, [1,1,0,1], ArisData.ActiveFilter().ObjTypeName( idx ), 1, 1, 25, getString("TEXT_ID_STYLE_DEFAULT2") );
                addCell( outputObj, [1,0,1,1], getAssignmentString( aAssgns ), 1, 1, 25, getString("TEXT_ID_STYLE_DEFAULT") );
        }
        setEmptyLine( outputObj, [0,1,1,1] );
    }
}

function DefineMainStyles( p_Output ){
    p_Output.DefineF(getString("TEXT_ID_STYLE_RD_HEADER"), getString("TEXT_ID_DEFAULT_FONT"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD| Constants.FMT_CENTER| Constants.FMT_VTOP, 1, 0, 0, 0, 0, 1);
    p_Output.DefineF(getString("TEXT_ID_STYLE_RD_FOOTER"), getString("TEXT_ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_LEFT| Constants.FMT_VTOP, 1, 0, 0, 0, 0, 1);
    p_Output.DefineF(getString("TEXT_ID_STYLE_DEFAULT"), getString("TEXT_ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_LEFT| Constants.FMT_VTOP, 1, 0, 0, 0, 0, 1);
    p_Output.DefineF(getString("TEXT_ID_STYLE_HEADING1"), getString("TEXT_ID_DEFAULT_FONT"), 11, Constants.C_WHITE, RGB( 1, 91, 126 ),  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VTOP, 1, 0, 0, 0, 0, 1);
    p_Output.DefineF(getString("TEXT_ID_STYLE_HEADING2"), getString("TEXT_ID_DEFAULT_FONT"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD| Constants.FMT_UNDERLINE | Constants.FMT_CENTER| Constants.FMT_VTOP, 1, 0, 0, 0, 0, 1);
}

function setupOutputDefault( outputObj ){// Apply default page format settings to output object
    var MARGIN_SIDE     = 12.5;
    var MARGIN_TOP      = 35;
    var MARGIN_BOTTOM   = 20;
    var DIST_TOP        = 5;
    var DIST_BOTTOM     = 5;
    
	outputObj.SetPageWidth(210.10);
	outputObj.SetPageHeight(297.20);
	outputObj.SetLeftMargin(MARGIN_SIDE);
	outputObj.SetRightMargin(MARGIN_SIDE);
	outputObj.SetTopMargin(MARGIN_TOP);
	outputObj.SetBottomMargin(MARGIN_BOTTOM);
	outputObj.SetDistHeader(DIST_TOP);
	outputObj.SetDistFooter(DIST_BOTTOM);
	outputObj.SetAutoTOCNumbering(true);
}

function setHeader( outputObj, pTxt ){// Printout Header/Footer section
    // BLUE-10653 Use standard report header (cmp. function setReportHeaderFooter() in atsallXX.js)
    
    // BLUE-17783 Update report header/footer
    var borderColor = getColorByRGB( 23, 118, 191);     
    
    var pictleft  = Context.createPicture(Constants.IMAGE_LOGO_LEFT);
    var pictright = Context.createPicture(Constants.IMAGE_LOGO_RIGHT);

    // set frame style
    outputObj.SetFrameStyle(Constants.FRAME_TOP, 0); 
    outputObj.SetFrameStyle(Constants.FRAME_LEFT, 0); 
    outputObj.SetFrameStyle(Constants.FRAME_RIGHT, 0); 
    outputObj.SetFrameStyle(Constants.FRAME_BOTTOM, 50, Constants.BRDR_NORMAL);

    outputObj.BeginHeader();
    outputObj.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    outputObj.TableRow();
    outputObj.TableCell("", 26, "Arial", 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    outputObj.OutGraphic(pictleft, - 1, 40, 15);
    outputObj.TableCell(Context.getScriptInfo(Constants.SCRIPT_TITLE), 48, "Arial", 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    outputObj.TableCell("", 26, "Arial", 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    outputObj.OutGraphic(pictright, - 1, 40, 15);
    outputObj.EndTable("", 100, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    outputObj.EndHeader();
    
    outputObj.ResetFrameStyle();
}

function setFooter( outputObj, pTxt ){
    outputObj.BeginFooter(); 
    outputObj.BeginTable(100, Constants.C_TRANSPARENT, RGB( 1, 91, 126 ), Constants.FMT_CENTER, 0);
    outputObj.TableRow(); 
    outputObj.TableCellF( "", 50, getString("TEXT_ID_STYLE_HEADING2") );
    outputObj.OutputLinkF( getString("URL"), "http://www.softwareag.com", getString("TEXT_ID_STYLE_HEADING2") );
    outputObj.TableCellF( "", 50, getString("TEXT_ID_STYLE_RD_FOOTER") );
    outputObj.OutputF( getString("PAGE_"), getString("TEXT_ID_STYLE_RD_FOOTER") );
    outputObj.OutputField(Constants.FIELD_PAGE, getString("TEXT_ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_CENTER| Constants.FMT_VTOP );
    outputObj.OutputF( getString("FROM_"), getString("TEXT_ID_STYLE_RD_FOOTER") );
    outputObj.OutputField(Constants.FIELD_NUMPAGES, getString("TEXT_ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_CENTER| Constants.FMT_VTOP );
    outputObj.EndTable("", 100, getString("TEXT_ID_DEFAULT_FONT"), 8, Constants.C_TRANSPARENT, Constants.C_TRANSPARENT, Constants.FILLTYPE_SOLID, Constants.FMT_CENTER, 0);
    outputObj.EndFooter();
}

function BeginMainOutput( p_Output ){
    setupOutputDefault( p_Output );
    setHeader( p_Output, gs_cEmpty );

    p_Output.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    p_Output.TableRow();
    p_Output.TableCellF( getString("GENERATED_TESTCASE_NAME"), 20, getString("TEXT_ID_STYLE_HEADING1") );
    p_Output.TableCellF( getString("PATH"), 50, getString("TEXT_ID_STYLE_HEADING1") );
    p_Output.TableCellF( getString("MODELNAME"), 30, getString("TEXT_ID_STYLE_HEADING1") );
}

function EndMainOutput( p_Output, p_Txt ){
    p_Output.EndTable( p_Txt, 100, getString("TEXT_ID_DEFAULT_FONT"), 10, Constants.C_WHITE, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VCENTER, 0 );
}

function DefineTSStyles( oOutput ){
    oOutput.DefineF(getString("TEXT_ID_STYLE_RD_HEADER"), getString("TEXT_ID_DEFAULT_FONT"), 18, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VTOP, 1, 0, 0, 0, 0, 1);
    oOutput.DefineF(getString("TEXT_ID_STYLE_RD_FOOTER"), getString("TEXT_ID_DEFAULT_FONT"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_RIGHT| Constants.FMT_VTOP, 1, 0, 0, 0, 0, 1);
    oOutput.DefineF(getString("TEXT_ID_STYLE_HEADING1"), getString("TEXT_ID_DEFAULT_FONT"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 0, 0, 0, 1);
    oOutput.DefineF(getString("TEXT_ID_STYLE_HEADING2"), getString("TEXT_ID_DEFAULT_FONT"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD| Constants.FMT_UNDERLINE | Constants.FMT_LEFT| Constants.FMT_VTOP, 1, 0, 0, 0, 0, 1);
    oOutput.DefineF(getString("TEXT_ID_STYLE_HEADING3"), getString("TEXT_ID_DEFAULT_FONT"), 16, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VTOP, 1, 0, 0, 0, 0, 1);
    oOutput.DefineF(getString("TEXT_ID_STYLE_HEADING4"), getString("TEXT_ID_DEFAULT_FONT"), 8, Constants.C_WHITE, RGB(64,64,64),  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VBOTTOM, 1, 0, 0, 0, 0, 1);    
    oOutput.DefineF(getString("TEXT_ID_STYLE_HEADING5"), getString("TEXT_ID_DEFAULT_FONT"), 8, Constants.C_BLACK, RGB(204,204,204),  Constants.FMT_BOLD| Constants.FMT_CENTER| Constants.FMT_VCENTER, 2, 2, 2, 2, 0, 1);
    oOutput.DefineF(getString("TEXT_ID_STYLE_DEFAULT"), getString("TEXT_ID_DEFAULT_FONT"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 0, 0, 0, 1);
    oOutput.DefineF(getString("TEXT_ID_STYLE_DEFAULT1"), getString("TEXT_ID_DEFAULT_FONT"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD | Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 0, 0, 0, 1);
    oOutput.DefineF(getString("TEXT_ID_STYLE_DEFAULT2"), getString("TEXT_ID_DEFAULT_FONT"), 8, Constants.C_BLACK, RGB(242,242,242),  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VTOP, 2, 2, 2, 2, 0, 1);
    oOutput.DefineF(getString("TEXT_ID_STYLE_DEFAULT3"), getString("TEXT_ID_DEFAULT_FONT"), 8, Constants.C_BLACK, RGB(242,242,242),  Constants.FMT_LEFT| Constants.FMT_VCENTER, 2, 2, 2, 2, 0, 1);
    oOutput.DefineF(getString("TEXT_ID_STYLE_DEFAULT4"), getString("TEXT_ID_DEFAULT_FONT"), 8, Constants.C_BLACK, RGB(204,204,204),  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VTOP, 2, 2, 2, 2, 0, 1);
    oOutput.DefineF(getString("TEXT_ID_STYLE_DEFAULT5"), getString("TEXT_ID_DEFAULT_FONT"), 8, Constants.C_BLACK, RGB(204,204,204),  Constants.FMT_LEFT| Constants.FMT_VCENTER, 2, 2, 2, 2, 0, 1);
}

function outputInnerTable( outputObj, p_ValLFT, p_ValRGH ){
    outputObj.TableRow();
        addCell( outputObj, [0,1,1,0], "", 1, 2, 50, getString("TEXT_ID_STYLE_DEFAULT") );
        addCell( outputObj, [0,1,1,0], p_ValLFT, 1, 1, 25, getString("TEXT_ID_STYLE_DEFAULT") );
        addCell( outputObj, [0,1,1,0], p_ValRGH, 1, 1, 25, getString("TEXT_ID_STYLE_DEFAULT") );
}

function addCell( outputObj, p_fStyle, p_Text, p_Row, p_Col, p_PerCnt, p_txtStyle ){
    // Set new Frame Style
    if( p_fStyle.length > 0 )   { setNewFrameStyle(outputObj, p_fStyle ); }

    if( Context.getSelectedFormat() == Constants.OUTPDF ){// Create output according to Selected Format
        outputObj.TableCellF( p_Text, p_PerCnt, p_txtStyle );
    } else{
        outputObj.TableCellF( p_Text, p_Row, p_Col, p_txtStyle );
    }
}

function writeInfo( p_Output, p_Name, p_Path, p_Model){// Write info into the main output object
    p_Output.TableRow();
    p_Output.TableCellF( p_Name, 20, getString("TEXT_ID_STYLE_DEFAULT") );
    p_Output.TableCellF( p_Path, 50, getString("TEXT_ID_STYLE_DEFAULT") );
    p_Output.TableCellF( p_Model, 30, getString("TEXT_ID_STYLE_DEFAULT") );
}

function setEmptyLine( p_Out, p_Style){
    if( Context.getSelectedFormat() == Constants.OUTPDF ){
        p_Out.TableRow();
        setNewFrameStyle(p_Out, p_Style );
        p_Out.TableCellF( "", 100, getString("TEXT_ID_STYLE_DEFAULT") );
    } else{
        p_Out.TableRow();
        setNewFrameStyle(p_Out, p_Style );
        p_Out.TableCellF( "", 1, 4, getString("TEXT_ID_STYLE_DEFAULT") );
    }
}

function setNewFrameStyle(p_Out, p_Style){
    p_Out.ResetFrameStyle();
    p_Out.SetFrameStyle( Constants.FRAME_BOTTOM,    p_Style[0] );
    p_Out.SetFrameStyle( Constants.FRAME_LEFT,      p_Style[1] );
    p_Out.SetFrameStyle( Constants.FRAME_RIGHT,     p_Style[2] );
    p_Out.SetFrameStyle( Constants.FRAME_TOP,       p_Style[3] );
}

function ResizePicture( p_Output, p_Pict, p_MaxWidth, p_MaxHeight ){
    var nPicWidth   = p_Pict.getWidth(Constants.SIZE_LOMETRIC) / 10 ;
    var nPicHeight  = p_Pict.getHeight(Constants.SIZE_LOMETRIC) / 10 ;
    var nDispWidth  = (p_Output.GetPageWidth() - p_Output.GetLeftMargin()) - p_Output.GetRightMargin();
    var nDispHeight = (p_Output.GetPageHeight() - p_Output.GetTopMargin()) - p_Output.GetBottomMargin() - 60;
    var aSize       = new Array();
    var nZoom       = 1;

    if( p_MaxWidth != null )    { nDispWidth  = p_MaxWidth; }
    if( p_MaxHeight != null )   { nDispHeight = p_MaxHeight; }

    if( (nDispHeight < nPicHeight) || (nDispWidth < nPicWidth) ){
        var nHZoom  = nPicHeight / nDispHeight;
        var nWZoom  = nPicWidth / nDispWidth;
        if( nHZoom < nWZoom )   { nZoom = nWZoom; }
        if( nHZoom > nWZoom )   { nZoom = nHZoom; }
    }

    aSize["WIDTH"]  = (nPicWidth / nZoom).toFixed(2);
    aSize["HEIGHT"] = (nPicHeight / nZoom).toFixed(2);
    
    return aSize;
}

/**********************************************************************************************************************/
/*      COMMON functions                                                                                              */
/**********************************************************************************************************************/

function setDocAttributes(oDef, sFnm, sNodeName)
{
    setAttrStrValue(oDef, Constants.AT_NAME,             c_NAME_PREFIX + sNodeName, g_nLoc);
    setAttrStrValue(oDef, Constants.AT_SAP_DOC_TYPE_KEY, c_SAP_DOC_TYPE_KEY, g_nLoc);
    setAttrStrValue(oDef, Constants.AT_SAP_DOC_TYPE,     c_SAP_DOC_TYPE, g_nLoc);
    setAttrStrValue(oDef, Constants.AT_SAP_STATUS_KEY,   c_SAP_STATUS_KEY, g_nLoc);
    setAttrStrValue(oDef, Constants.AT_SAP_STATUS,       c_SAP_STATUS, g_nLoc);
    storeDocumentation(oDef, sFnm);
}

function storeDocumentation(def, sFnm) 
{    
    var buffer =  Context.getFile(sFnm, Constants.LOCATION_OUTPUT);        
    var attr = def.Attribute(Constants.AT_DOCUMENTATION, g_nLoc, true);
    if (attr.IsValid()) 
    {
        var docBlob = attr.createExternalDocument();
        docBlob.setDocument(buffer, getSuffix(sFnm));
        attr.setExternalDocument(docBlob);
    }
}

function getSuffix(sFnm)
{
    var nIndex = sFnm.lastIndexOf(".");
    return sFnm.substring(nIndex + 1, sFnm.length());
}

function getAttrBlobValue(p_objDef, p_attrTypeNum, p_Lang){
    var attr    = p_objDef.Attribute(p_attrTypeNum, p_Lang, true);
    if(attr.IsValid() == false) return null;
    return attr.MeasureValue();
}

function getAttrIntValue(p_objDef, p_attrTypeNum, p_Lang){
    var attr    = p_objDef.Attribute(p_attrTypeNum, p_Lang, true);
    if(attr.IsValid() == false) return -1;
    return attr.MeasureUnitTypeNum();
}

function getAttrStrValue(p_objDef, p_attrTypeNum, p_Lang){
    var attr    = p_objDef.Attribute(p_attrTypeNum, p_Lang, true);
    if(attr.IsValid() == false) return gs_cEmpty;
    return java.lang.String( convToBytes( attr.GetValue(true) ) );
}

function setAttrStrValue(p_objDef, p_attrTypeNum, p_Val, p_Lang){
    var attr    = p_objDef.Attribute(p_attrTypeNum, p_Lang, true);
    if (attr.IsValid()) {
        return attr.setValue(p_Val);
    }
    return false;
}

function checkPreRunConditions( p_aODefs ){
    if( p_aODefs.length < 1 )   return ERR_NOSEL;
    if( p_aODefs.length > 1 )   return ERR_2MUCH;

    return checkTestDesignerNode( p_aODefs[0] );
}

function checkTestDesignerNode( p_ODef ){
    var nRes        = ERR_FREE;
    var sOriginal   = getAttrStrValue( p_ODef, ATT_SAPID, g_nLoc );
    var sTmp        = new Array();
    if( sOriginal.isEmpty() )    { return ERR_NOTCE; }

    sTmp    = sOriginal.substring( 0, sOriginal.indexOf("#") );
    if( ATT_TCEID.compareTo( sTmp ) != 0 )  { return ERR_NOTCE; }
    
    return ERR_FREE;
}

function getTestSteps( p_Node ){
    var aTmp        = new Array();
    var aChldOccs   = new Array();

    var oAssMod = p_Node.Get("ASSMOD");
    if( oAssMod != null ){
        var aPath       = commonUtils.search.graph.ModelAnalyzer( oAssMod, Constants.EDGES_INOUT );
        if( aPath.length > 0 )  { aChldOccs   = aPath[0].copy(); }
        for(var i=0; i<aChldOccs.length; i++){
            var newNode = new TestDesignerNode();
            newNode.Initialize( aChldOccs[i].ObjDef() );
            aTmp.push( newNode );
        }
    }
    return aTmp;
}


function getRelatedDefs( p_Def, p_Ref ){
    var hm_Out  = new java.util.HashMap();
    var aCxns   = p_Def.CxnList();

    if( (aCxns.length > 1) && (p_Ref.length > 0)  ){
        for(var i=0; i<aCxns.length; i++){
            var oTmp    = commonUtils.search.searchConnectedObjDef( p_Def, aCxns[i] );
            var nTNum   = oTmp.TypeNum();
            if( p_Ref.contains( nTNum ) == true ){
                var aNew    = new Array();
                if( hm_Out.containsKey( nTNum ) == true ){
                    aNew    = hm_Out.get( nTNum );
                }
                aNew.push( oTmp );
                hm_Out.put( nTNum, aNew );
            }
        }
    }    
    return hm_Out;
}

function getConnectedByOT( p_oObj, p_aOT, p_Dir){
    var aOut    = new Array();
    var aTmp    = commonUtils.search.searchConnectedObjOccs( p_oObj, p_oObj.Cxns( p_Dir ) );
    for(var i=0; i<aTmp.length; i++){
        if( p_aOT.contains( aTmp[i].ObjDef().TypeNum() ) == true )  { aOut.push( aTmp[i] ); }
    }
    return aOut;
}

function getConnectedEvents(p_oObjOcc, p_aResult, p_Dir){//p_Dir = {Constants.EDGES_IN, Constants.EDGES_OUT}
    var aPredSuccs  = getConnectedByOT( p_oObjOcc, [ Constants.OT_EVT, Constants.OT_RULE ], p_Dir );
    
    for(var i=0; i<aPredSuccs.length; i++){
        if( Constants.OT_EVT == aPredSuccs[i].ObjDef().TypeNum() )  { p_aResult.push( aPredSuccs[i] ); }
        if( Constants.OT_RULE == aPredSuccs[i].ObjDef().TypeNum() ) { p_aResult = getConnectedEvents( aPredSuccs[i], p_aResult, p_Dir ); }
    }
    return p_aResult;
}

function setTrgEndEvents( p_Flag, p_Node ){
    var aOut    = new Array();
    var aOccs   = ( (p_Node.Get("SRCMOD") != null) && (p_Node.Get("MASTER") != null) )?p_Node.Get("MASTER").OccListInModel( p_Node.Get("SRCMOD") ):new Array();   

    if( aOccs.length > 1 )  { p_Node.Set( p_Flag, ERR_2MUCH ); }
    if( aOccs.length == 1 ){
        aOut    = getConnectedEvents( aOccs[0], aOut, ((p_Flag == "TRGEVT_ERR")?Constants.EDGES_IN:Constants.EDGES_OUT) );
    }

    if( aOut.length > 0 ){
        if( p_Flag == "TRGEVT_ERR" ) { p_Node.Set( "TRGEVT", aOut.copy() ); }
        else    { p_Node.Set( "ENDEVT", aOut.copy() ); }
        p_Node.Set( p_Flag, ERR_FREE );
    }
    else{
        p_Node.Set( p_Flag, ERR_NOSEL );
    }
}

function deleteOccsInModel( p_Mod, p_Occs, p_Flag){
    for(var i=0; i<p_Occs.length; i++){
        p_Mod.deleteOcc( p_Occs[i], p_Flag);
    }
}

function getTestCaseByTestCaseOwner( p_allTSC, p_Def){
    for(var i=0; i<p_allTSC.length; i++){
        if( p_Def.equals( p_allTSC[i].Get("TC_OWNER").Get("DEF") ) == true ){
            return p_allTSC[i];
        }
    }
    return null;
}


function setOccNameToStringArray( p_aOcc ){
    var aOut    = new Array();
    for(var i=0; i<p_aOcc.length; i++){
        aOut.push( getAttrStrValue( p_aOcc[i].ObjDef(), Constants.AT_NAME, g_nLoc) );
    }
    return aOut;
}

function isModelOpened( p_Mod ){
    ArisData.getActiveDatabase().setAutoTouch(false);
        try{
            p_Mod.setBgColor(p_Mod.getBgColor());
        }
        catch(e){
            return true;
        }
    ArisData.getActiveDatabase().setAutoTouch(true);    
    return false;
}

function checkForOpenModels( ){
    var nCounter    = 0;
    
    for(var i=0; i<ga_TSGnted.length; i++){
        var sNodeName   = ga_TSGnted[i].Get("TSNAME");
        var nModTp      = (ga_TSGnted[i].Get("TC_OWNER").Get("DEF").TypeNum() != Constants.OT_DP_FUNC_TYPE)?Constants.MT_FUNC_ALLOC_DGM:Constants.MT_ACS_DGM;
        
        if( ga_TSGnted[i].Get("TSGRP") != null ){// Check for group existence
            var aTmp    = ga_TSGnted[i].Get("TSGRP").ModelListFilter( sNodeName, g_nLoc, nModTp);// Check for model existence
            for(var j=0; j< aTmp.length; j++){
                if( isModelOpened( aTmp[j] ) == true ){// Check if model is opened
                    nCounter++;// sOut    = sOut.concat( getAttrStrValue( aTmp[j], Constants.AT_NAME, g_nLoc ) ).concat( "\n" );
                }
            }
        }
    }
    
    if( nCounter > 0 ){// display MsgBox to user to close open models
        Dialogs.MsgBox(getString("MSG_CLOSE_OPEN_MODELS"), Constants.MSGBOX_ICON_INFORMATION|Constants.MSGBOX_BTN_OK, getString("MSG_REPORT_NAME"));
        return true;
    }
    
    return false;
}

function getDefSymbol( p_Mod, p_Def ){
    var nDefSym = p_Def.getDefaultSymbolNum();
    var aPosSym = ArisData.ActiveFilter().Symbols( p_Mod.TypeNum(), p_Def.TypeNum() );

    if( (aPosSym.length > 0) && (nDefSym != 0) ){
        if( aPosSym.contains( nDefSym ) == true )   { return nDefSym; }
    }

    return Constants.ST_FUNC;
}

function getAssignmentString( p_Arr ){
    var sOut    = gs_cEmpty;
    
    for(var i=0; i<p_Arr.length; i++){
        var sDisplayName = getAttrStrValue(p_Arr[i], Constants.AT_NAME, g_nLoc);
        if (p_Arr[i].KindNum() == Constants.CID_OBJDEF && p_Arr[i].TypeNum() == Constants.OT_SCRN)
        {
            var sTransactionCode = getAttrStrValue(p_Arr[i], Constants.AT_TRANS_CODE, g_nLoc);
            if (sTransactionCode != "") {           // AME-1777 Output screen name in case of transaction code is not maintained
                sDisplayName = sTransactionCode;
            }
        }
        sOut    = sOut.concat(sDisplayName);
        if( i < (p_Arr.length-1) )   sOut    = sOut.concat( ", " );
    }
    
    return sOut;
}

function collectOTypes( ){
    var aTypes  = ArisData.ActiveFilter().ObjTypes();    

    for(var i=0; i<aTypes.length; i++){
        var aFromFnc    = ArisData.ActiveFilter().CxnTypesFromObj( Constants.OT_FUNC, aTypes[i] );
        var aToFnc      = ArisData.ActiveFilter().CxnTypesFromObj( aTypes[i], Constants.OT_FUNC );
        
        var aFromITFnc  = ArisData.ActiveFilter().CxnTypesFromObj( Constants.OT_DP_FUNC, aTypes[i] );
        var aToITFnc    = ArisData.ActiveFilter().CxnTypesFromObj( aTypes[i], Constants.OT_DP_FUNC );
        
        var aFromAST    = ArisData.ActiveFilter().CxnTypesFromObj( Constants.OT_APPL_SYS_TYPE, aTypes[i] );
        var aToAST      = ArisData.ActiveFilter().CxnTypesFromObj( aTypes[i], Constants.OT_APPL_SYS_TYPE );
        
        var aFromModT   = ArisData.ActiveFilter().CxnTypesFromObj( Constants.OT_MOD_TYPE, aTypes[i] );
        var aToModT     = ArisData.ActiveFilter().CxnTypesFromObj( aTypes[i], Constants.OT_MOD_TYPE );
        
        if( (aFromFnc.length > 0) || (aFromITFnc.length > 0)    || (aToFnc.length > 0) || (aToITFnc.length > 0) ||
            (aFromAST.length > 0) || (aFromModT.length > 0)     || (aToAST.length > 0) || (aToModT.length > 0)      ){
            go_RefOT.add( aTypes[i] );
        }
    }
}

function showErrorMessage(p_nCheck) {
    // Preconditions are bad - inform user
    switch (p_nCheck) {
        case ERR_NOSEL:     // No Object Definition selected - but Object Occurence
            Dialogs.MsgBox( commonUtils.attsall.formatString( "@0 @1", [getString("MSG_UNABLE_TO_CREATE_OUTPUT"), getString("MSG_NO_OBJDEF_SELECTED")]), Constants.MSGBOX_BTN_OK|Constants.MSGBOX_ICON_WARNING, getString("MSG_REPORT_NAME") );
            break;
        case ERR_2MUCH:     // Too many Object Definitions were selected
            Dialogs.MsgBox( commonUtils.attsall.formatString( "@0 @1", [getString("MSG_UNABLE_TO_CREATE_OUTPUT"), getString("MSG_TOOMANY_OBJDEF_SELECTED")]), Constants.MSGBOX_BTN_OK|Constants.MSGBOX_ICON_WARNING, getString("MSG_REPORT_NAME") );
            break;
        case ERR_NOTCE:     // Starting node is not a TCE node - inform user
            Dialogs.MsgBox( commonUtils.attsall.formatString( "@0 @1", [getString("MSG_UNABLE_TO_CREATE_OUTPUT"), getString("MSG_SEL_HAS_NO_TCE_NODES")]), Constants.MSGBOX_BTN_OK|Constants.MSGBOX_ICON_WARNING, getString("MSG_REPORT_NAME") );
            break;
    }
}


function RGB( r, g, b ){
	return (new java.awt.Color(r/255.0,g/255.0,b/255.0,1)).getRGB() & 0xFFFFFF;
}

function setFileNamesToStrArray( p_Path ){
    var outStr  = new Array();
    var sSuffx  = getSelFileSuffx();
    try{
        var aStr    = new java.io.File( p_Path ).list();
        for(var i=0; i<aStr.length; i++){
            var fName   = aStr[i].substring( 0, aStr[i].lastIndexOf(".") );
            var fSuffx  = aStr[i].substring( aStr[i].lastIndexOf("."), aStr[i].length );
            if( sSuffx.equalsIgnoreCase( fSuffx ) == true ) { outStr.push( java.lang.String( fName )); }
        }
        return outStr;
    }
    catch(err){
        return outStr;
    }
}

function getIntFromStr( p_Val ){
    try{
        return java.lang.Integer( p_Val );
    }
    catch(err){
        return null;
    }
}

function createUniqueFileName( p_aStr, p_FileName ){
    var nCounter    = 0;
    var sNewName    = java.lang.String( p_FileName );

    while( p_aStr.contains( sNewName ) == true ){
        var idx     = sNewName.lastIndexOf("_");
        if( idx != -1 ){
            var num = getIntFromStr( sNewName.substring( idx+1, sNewName.length()) );
            if( num != null ){
                var sBase   = sNewName.substring( 0, idx );
                num++;
                var sSuffx  = java.lang.Integer( num ).toString();
            }
        }
        if( (idx == -1) || ( num == null) ){
            var sBase   = java.lang.String( sNewName );
            nCounter++;
            var sSuffx  = java.lang.Integer( nCounter ).toString();
        }
        sNewName    = sBase.concat( "_").concat( sSuffx );
    }

    return sNewName;
}

function getSelFileSuffx( ){
    var oTmp    = Context.getSelectedFormat();
    if( Constants.OutputXLS   == oTmp )  return Packages.java.lang.String( ".xls" );
    if( Constants.OUTHTML    == oTmp )  return Packages.java.lang.String( ".html" );
    if( Constants.OUTPDF     == oTmp )  return Packages.java.lang.String( ".pdf" );
    if( Constants.OUTRTF     == oTmp )  return Packages.java.lang.String( ".rtf" );
    if( Constants.OUTTEXT    == oTmp )  return Packages.java.lang.String( ".txt" );
    if( Constants.OUTWORD    == oTmp )  return Packages.java.lang.String( ".doc" );
    if( Constants.OUTXML     == oTmp )  return Packages.java.lang.String( ".xml" );
    if( Constants.OutputDOCX == oTmp )  return Packages.java.lang.String( ".docx" );
    if( Constants.OutputODT  == oTmp )  return Packages.java.lang.String( ".odt" );
    if( Constants.OutputXLSX == oTmp )  return Packages.java.lang.String( ".xlsx" );
    return new gs_cEmpty;
}

function getDateString( p_Date ){
    if( (p_Date == null) || (p_Date == "") )  { p_Date    = new Date(); }
    return Packages.java.lang.String( (p_Date.getDate()) ).concat( gs_Empty ).concat( Packages.java.lang.String( (p_Date.getMonth()+1) ) ).concat( gs_Empty ).concat( Packages.java.lang.String( p_Date.getFullYear()) );
}

function getLoginString( ){
    var sTmp    = ArisData.getActiveUser().Name( g_nLoc );
    return java.lang.String( getString("TEST_DESIGNER") ).concat("-").concat( sTmp );
}

function ArrayOTToString( p_Val ){
    var sTmp    = new java.lang.String("");
    for(var i=0; i<p_Val.length; i++){
        sTmp    = sTmp.concat( java.lang.String(p_Val[i]) );
        if( i < p_Val.length-1 )  sTmp    = sTmp.concat(";");
    }
    return sTmp;
}

function StringOTToArray( p_Val ){
    return p_Val.split(";");
}

function unzipPathImage( p_Val ){
    try {
        var aOut    = new Array();
        var aRef    = [java.lang.String(".jpg"), java.lang.String(".png"), java.lang.String(".emf")];
        var aZipEntries = Context.getComponent("ReportScheduler").getZipEntries(p_Val)                  // AGA-10194
        for(var i=0; i<aZipEntries.length; i++){
            var sName       = java.lang.String( aZipEntries[i].getName() );
            var sNameSffx   = sName.substring( sName.lastIndexOf(".") );
            if( aRef.contains( sNameSffx ) == true ){
                var zipFile = new AZipClass();
                    zipFile.Initialize( aZipEntries[i].getName(), aZipEntries[i].getData() );
                aOut.push( zipFile );
            }
        }
        return aOut;
    }
    catch (err){
        return null;
    }
    return null;
}

function convToBytes( p_Val ){
    return java.lang.String( p_Val ).getBytes();
}

/**********************************************************************************************************************/
/*      DIALOG functions                                                                                              */
/**********************************************************************************************************************/

function usrDialog(){
    
    collectOTypes( );                       // Get Object Type referrence array
    ga_RefOT    = go_RefOT.toArray();
    dlgOptions.Initialize( ga_RefOT );      // Initialize dialog buffer with collected assignments
    
    
    var currentDialog   = DHLBoxDriverTemplate( );
    var dlg_Result      = null;

    dlg = Dialogs.createUserDialog( currentDialog );
    dlg.setDlgListBoxArray( "cxnSourceList", dlgOptions.SourceSel.ToDisplay() );
    dlg.setDlgListBoxArray( "cxnSelectedList", dlgOptions.TargetSel.ToDisplay() );
    dlg.setDlgValue("opt_Nodes", dlgOptions.opt_Nodes );          // 0 = Only selected TCE node; 1 = Include children nodes
    dlg.setDlgValue("opt_TCs", dlgOptions.opt_TCs );              // 0 = Overwrite existing test cases; 1 = Add to existing test cases
    
    dlg.setDlgValue("opt_PathGraph", dlgOptions.opt_PathGraph );  // Include path graphics
    dlg.setDlgValue("opt_ModGraph", dlgOptions.opt_ModGraph );    // Include model graphics
    dlg.setDlgValue("opt_TrgEvt", dlgOptions.opt_TrgEvt );      // Include triggering/ end event
    dlg.setDlgValue("opt_InclTDocu", dlgOptions.opt_InclTDocu );  // Assign test document to the model
    
    dlg.setDlgValue("opt_OutExpRes", dlgOptions.opt_OutExpRes );  // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_EXPECT_TEST_RESULT)
    dlg.setDlgValue("opt_OutAct", dlgOptions.opt_OutAct );        // ArisData.ActiveFilter().AttrTypeName(Constants.AT_AAM_TEST_ACTIVITY)
    dlg.setDlgValue("opt_OutHRisk", dlgOptions.opt_OutHRisk );    // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_HIGH_RISK)
    dlg.setDlgValue("opt_OutResp", dlgOptions.opt_OutResp );      // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_RESPONSIBLE)
    dlg.setDlgValue("opt_OutRndNum", dlgOptions.opt_OutRndNum );  // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_ROUND_NUM)
    dlg.setDlgValue("opt_OutTType", dlgOptions.opt_OutTType );    // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_TYPE)
    dlg.setDlgValue("opt_OutTData", dlgOptions.opt_OutTData );    // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_DATA)
    

    dlg_Result  = Dialogs.show( dlg );
    dlgOptions.OutSelected( );

    if (dlg_Result != 0) {
        // BLUE-7660 Save user selection (globals, properties) only if dialog is finished with "OK"
        saveUserSelection( );
    }
    return dlg_Result;
}

function DHLBoxDriverTemplate(){
    var aStr            = new Array();
    var currentDialog   = Dialogs.createNewDialogTemplate(20, 20, 900, 240, getString("MSG_REPORT_NAME"), "DHLBoxDriverHandler"); 

    currentDialog.GroupBox  ( 20, 10,880,125, getString("DLG_TEXT_01"));
    currentDialog.ListBox   ( 30, 25,340,105, aStr, "cxnSourceList", 1);
    currentDialog.ListBox   (550, 25,340,105, aStr, "cxnSelectedList", 1);
    currentDialog.PushButton(385, 40,150, 15, getString("DLG_TEXT_02"), "addAllButton");
    currentDialog.PushButton(385, 60,150, 15, getString("DLG_TEXT_03"), "addButton");
    currentDialog.PushButton(385, 80,150, 15, getString("DLG_TEXT_04"), "removeButton");
    currentDialog.PushButton(385,100,150, 15, getString("DLG_TEXT_05"), "removeAllButton");    

    currentDialog.GroupBox      ( 20,140,280,123, getString("DLG_TEXT_06"));
    currentDialog.OptionGroup   ("opt_Nodes");
    currentDialog.OptionButton  ( 30,150,260, 15, getString("DLG_TEXT_07"), "opt_SelNodes");
    currentDialog.OptionButton  ( 30,165,260, 15, getString("DLG_TEXT_08"), "opt_ChldNods");
    currentDialog.OptionGroup   ("opt_TCs");
    currentDialog.OptionButton  ( 30,195,260, 15, getString("DLG_TEXT_09"), "opt_OverTCs");
    currentDialog.OptionButton  ( 30,210,260, 15, getString("DLG_TEXT_10"), "opt_AddTCs");
    
    currentDialog.GroupBox  (310,140,290,123, getString("DLG_TEXT_11"));
    currentDialog.CheckBox  (320,150,260, 15, getString("DLG_TEXT_12"), "opt_PathGraph");
    currentDialog.CheckBox  (320,165,260, 15, getString("DLG_TEXT_13"), "opt_ModGraph");
    currentDialog.CheckBox  (320,180,260, 15, getString("DLG_TEXT_14"), "opt_TrgEvt");
    currentDialog.CheckBox  (320,195,260, 15, getString("DLG_TEXT_15"), "opt_InclTDocu");
    
    currentDialog.GroupBox  (610,140,290,123, getString("DLG_TEXT_16"));
    currentDialog.CheckBox  (620,150,260, 15, ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_EXPECT_TEST_RESULT), "opt_OutExpRes");
    currentDialog.CheckBox  (620,165,260, 15, ArisData.ActiveFilter().AttrTypeName(Constants.AT_AAM_TEST_ACTIVITY), "opt_OutAct");
    currentDialog.CheckBox  (620,180,260, 15, ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_HIGH_RISK), "opt_OutHRisk");
    currentDialog.CheckBox  (620,195,260, 15, ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_RESPONSIBLE), "opt_OutResp");
    currentDialog.CheckBox  (620,210,260, 15, ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_ROUND_NUM), "opt_OutRndNum");
    currentDialog.CheckBox  (620,225,260, 15, ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_TYPE), "opt_OutTType");
    currentDialog.CheckBox  (620,240,260, 15, ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_DATA), "opt_OutTData");
    
    currentDialog.OKButton();
    currentDialog.CancelButton();
    currentDialog.HelpButton("SAP/58e38e00-b8ab-11de-368f-80f5a5e6673a.HLP");
    
    return currentDialog;   
}

function DHLBoxDriverHandler(dlgitem,action,suppvalue){
  var result        = false;
  var a_CxnOnMove   = new Array();// an array of currently selected elements from source or selected array
  
  switch (action){
    case 1:
        dlg.setDlgEnable("addAllButton",true);
        dlg.setDlgEnable("addButton", false);
        dlg.setDlgEnable("removeButton", false);
        dlg.setDlgEnable("removeAllButton", true);
        break;    
    case 2:
        switch(dlgitem){
        case "OK":
        case "Cancel":
            dlgOptions.opt_Nodes      = dlg.getDlgValue("opt_Nodes");     // 0 = Only selected TCE node; 1 = Include children nodes
            dlgOptions.opt_TCs        = dlg.getDlgValue("opt_TCs");       // 0 = Overwrite existing test cases; 1 = Add to existing test cases
            
            dlgOptions.opt_PathGraph  = dlg.getDlgValue("opt_PathGraph"); // Include path graphics
            dlgOptions.opt_ModGraph   = dlg.getDlgValue("opt_ModGraph");  // Include model graphics
            dlgOptions.opt_TrgEvt     = dlg.getDlgValue("opt_TrgEvt");    // Include triggering/ end event
            dlgOptions.opt_InclTDocu  = dlg.getDlgValue("opt_InclTDocu"); // Assign test document to the model
            
            dlgOptions.opt_OutExpRes  = dlg.getDlgValue("opt_OutExpRes"); // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_EXPECT_TEST_RESULT)
            dlgOptions.opt_OutAct     = dlg.getDlgValue("opt_OutAct");    // ArisData.ActiveFilter().AttrTypeName(Constants.AT_AAM_TEST_ACTIVITY)
            dlgOptions.opt_OutHRisk   = dlg.getDlgValue("opt_OutHRisk");  // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_HIGH_RISK)
            dlgOptions.opt_OutResp    = dlg.getDlgValue("opt_OutResp");   // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_RESPONSIBLE)
            dlgOptions.opt_OutRndNum  = dlg.getDlgValue("opt_OutRndNum"); // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_ROUND_NUM)
            dlgOptions.opt_OutTType   = dlg.getDlgValue("opt_OutTType");  // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_TYPE)
            dlgOptions.opt_OutTData   = dlg.getDlgValue("opt_OutTData");  // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_DATA)
            result = false;
            break;
        case "cxnSourceList":
            if( (dlg.getDlgSelection("cxnSourceList").length > 0) == true ){
                dlg.setDlgEnable("addButton", true);
                dlg.setDlgEnable("addAllButton",true);
                dlg.setDlgEnable("removeButton", false);
                dlg.setDlgEnable("removeAllButton", true);
            }
            else{
                dlg.setDlgEnable("addAllButton",true);
                dlg.setDlgEnable("addButton", false);
                dlg.setDlgEnable("removeButton", false);
                dlg.setDlgEnable("removeAllButton", true);
            }
            result = true;
            break;
        case "cxnSelectedList":
            if( (dlg.getDlgSelection("cxnSelectedList").length > 0) == true ){
                dlg.setDlgEnable("addButton", false);
                dlg.setDlgEnable("addAllButton", true);
                dlg.setDlgEnable("removeButton", true);
                dlg.setDlgEnable("removeAllButton", true);
            }
            else{
                dlg.setDlgEnable("addAllButton",true);
                dlg.setDlgEnable("addButton", false);
                dlg.setDlgEnable("removeButton", false);
                dlg.setDlgEnable("removeAllButton", true);
            }
            result = true;
            break;
        case "addAllButton":
            dlg.setDlgEnable("addButton", false);
            dlg.setDlgEnable("addAllButton",true)
            dlg.setDlgEnable("removeButton", false);                 
            dlg.setDlgEnable("removeAllButton", true);                             
            
            dlgOptions.Add2Target( "ALL", null );
            
            dlg.setDlgListBoxArray( "cxnSourceList",      dlgOptions.SourceSel.ToDisplay() );
            dlg.setDlgListBoxArray( "cxnSelectedList",    dlgOptions.TargetSel.ToDisplay() );
            result = true;
            break;
        case "removeAllButton":
            dlg.setDlgEnable("addButton", false);
            dlg.setDlgEnable("addAllButton", true)
            dlg.setDlgEnable("removeButton", false);                 
            dlg.setDlgEnable("removeAllButton", true);                             
            
            dlgOptions.Rem2Source( "ALL", null );
            
            dlg.setDlgListBoxArray( "cxnSourceList",      dlgOptions.SourceSel.ToDisplay() );
            dlg.setDlgListBoxArray( "cxnSelectedList",    dlgOptions.TargetSel.ToDisplay() );
            result = true;          
            break;        
        case "addButton":
            dlg.setDlgEnable("addButton", false);
            dlg.setDlgEnable("addAllButton", true)
            dlg.setDlgEnable("removeButton", false);                 
            dlg.setDlgEnable("removeAllButton", true);                             
            
            a_CxnOnMove   = dlg.getDlgSelection("cxnSourceList");
            dlgOptions.Add2Target( "IDX", a_CxnOnMove );
            
            dlg.setDlgListBoxArray( "cxnSourceList",      dlgOptions.SourceSel.ToDisplay() );
            dlg.setDlgListBoxArray( "cxnSelectedList",    dlgOptions.TargetSel.ToDisplay() );
            result = true;
            break;
        case "removeButton":
            dlg.setDlgEnable("addButton", false);
            dlg.setDlgEnable("addAllButton",true)
            dlg.setDlgEnable("removeButton", false);                 
            dlg.setDlgEnable("removeAllButton", true);                             
            
            a_CxnOnMove   = dlg.getDlgSelection("cxnSelectedList");
            dlgOptions.Rem2Source( "IDX", a_CxnOnMove );
            
            dlg.setDlgListBoxArray( "cxnSourceList",      dlgOptions.SourceSel.ToDisplay() );
            dlg.setDlgListBoxArray( "cxnSelectedList",    dlgOptions.TargetSel.ToDisplay() );
            result = true;
            break;
      }
  }
return result;
}

function SelListSort(a,b){
    var a_Conn  = a.GetEntry();
    var b_Conn  = b.GetEntry();
    
    return a_Conn.compareTo( b_Conn);
}

function SelEntry(){
    this.oObj       = null;
    this.sEntry     = gs_Empty;

    this.SetObj = function(p_Val) {
        this.oObj = p_Val;
    }
    this.GetObj = function() {
        return this.oObj;
    }
    this.SetEntry = function(p_Val) {
        this.sEntry = new java.lang.String(p_Val);
    }
    this.GetEntry = function() {
        return this.sEntry;
    }
    this.InitEntry = function(p_Obj, p_Val) {
        this.SetObj( p_Obj );
        this.SetEntry( p_Val );
    }
    this.Destroy = function() {
        this.oObj       = null;
        this.sEntry     = gs_Empty;
    }
}

function SelList(){
    this.aSelection = new Array();
    
    this.Sort = function() {
        return this.aSelection.sort( SelListSort );
    }
    this.Size = function() {
        return this.aSelection.length;
    }
    this.IsEmpty = function() {
        if( this.aSelection.length > 0 ) return false;
        return true;
    }
    this.Destroy = function() {
        this.aSelection     = new Array();
    }
    this.Push = function(p_aVal) {
        for(var i=0; i<p_aVal.length; i++){
            this.aSelection.push( p_aVal[i] );
        }
    }
    this.Get = function(p_Idx) {
        return this.aSelection[p_Idx];
    }
    this.GetAll = function() {
        return this.aSelection;
    }
    this.SetAll = function(p_aVal) {
        this.aSelection = p_aVal.copy();
    }
    this.GetByIdx = function(p_aIdx) {
        var aOutSel = new Array();
        var aStays  = new Array();
        
        for(var i=0; i<this.aSelection.length; i++){
            if( p_aIdx.contains(i) == true )    { aOutSel.push( this.aSelection[i] ); }
            else    { aStays.push( this.aSelection[i] ); }
        }
        this.Destroy();
        this.SetAll( aStays );

        return aOutSel;
    }
    this.ToDisplay = function() {
        var aOut    = new Array();
        for(var i=0; i<this.aSelection.length; i++){
            aOut.push( this.aSelection[i].GetEntry() );
        }
        return aOut;
    }
}

function DialogOptions(){
    this.SourceSel  = new SelList();
    this.TargetSel  = new SelList();
    
    this.opt_Nodes      = null; // 0 = Only selected TCE node; 1 = Include children nodes
    this.opt_TCs        = null; // 0 = Overwrite existing test cases; 1 = Add to existing test cases

    this.opt_PathGraph  = null; // Include path graphics
    this.opt_ModGraph   = null; // Include model graphics
    this.opt_TrgEvt    = null; // Include triggering/ end event
    this.opt_InclTDocu  = null; // Assign test document to the model

    this.opt_OutExpRes  = null; // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_EXPECT_TEST_RESULT)
    this.opt_OutAct     = null; // ArisData.ActiveFilter().AttrTypeName(Constants.AT_AAM_TEST_ACTIVITY)
    this.opt_OutHRisk   = null; // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_HIGH_RISK)
    this.opt_OutResp    = null; // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_RESPONSIBLE)
    this.opt_OutRndNum  = null; // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_ROUND_NUM)
    this.opt_OutTType   = null; // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_TYPE)
    this.opt_OutTData   = null; // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_DATA)

    this.Initialize = function(p_OTRef) {
        var sSelList        = Context.getProfileString(gs_Section, "cxnSelectedList", gs_cEmpty); // Re-reads previous user's selection
        var aSelList        = StringOTToArray( sSelList );
        
        this.opt_Nodes      = Context.getProfileInt(gs_Section, "opt_Nodes", 0);     // 0 = Only selected TCE node; 1 = Include children nodes
        this.opt_TCs        = Context.getProfileInt(gs_Section, "opt_TCs", 0);       // 0 = Overwrite existing test cases; 1 = Add to existing test cases
    
        this.opt_PathGraph  = Context.getProfileInt(gs_Section, "opt_PathGraph", 0); // Include path graphics
        this.opt_ModGraph   = Context.getProfileInt(gs_Section, "opt_ModGraph", 0);  // Include model graphics
        this.opt_TrgEvt    = Context.getProfileInt(gs_Section, "opt_TrgEvt", 0);   // Include triggering/ end event
        this.opt_InclTDocu  = Context.getProfileInt(gs_Section, "opt_InclTDocu", 0); // Assign test document to the model
    
        this.opt_OutExpRes  = Context.getProfileInt(gs_Section, "opt_OutExpRes", 0); // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_EXPECT_TEST_RESULT)
        this.opt_OutAct     = Context.getProfileInt(gs_Section, "opt_OutAct", 0);    // ArisData.ActiveFilter().AttrTypeName(Constants.AT_AAM_TEST_ACTIVITY)
        this.opt_OutHRisk   = Context.getProfileInt(gs_Section, "opt_OutHRisk", 0);  // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_HIGH_RISK)
        this.opt_OutResp    = Context.getProfileInt(gs_Section, "opt_OutResp", 0);   // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_RESPONSIBLE)
        this.opt_OutRndNum  = Context.getProfileInt(gs_Section, "opt_OutRndNum", 0); // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_ROUND_NUM)
        this.opt_OutTType   = Context.getProfileInt(gs_Section, "opt_OutTType", 0);  // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_TYPE)
        this.opt_OutTData   = Context.getProfileInt(gs_Section, "opt_OutTData", 0);  // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_DATA)
        
        for(var i=0; i<p_OTRef.length; i++){
            var oEntry  = new SelEntry();
            oEntry.InitEntry( p_OTRef[i], (Packages.java.lang.String( convToBytes( ArisData.ActiveFilter().ObjTypeName( p_OTRef[i] )))) );
            if( aSelList.contains( p_OTRef[i] ) == true ){
                this.TargetSel.Push( [oEntry] );
            }
            else{
                this.SourceSel.Push( [oEntry] );
            }
        }
    
        this.SourceSel.Sort( );
        this.TargetSel.Sort( );
    }
    
    this.Add2Target = function(p_Flag, p_aIdx) {
        switch(p_Flag){
            case "IDX":
                var aEntries    = this.SourceSel.GetByIdx( p_aIdx );
                                  this.TargetSel.Push( aEntries );
                break;
            case "ALL":
                var aEntries    = this.SourceSel.GetAll();
                                  this.TargetSel.Push( aEntries );
                                  this.SourceSel.Destroy();
        }
        this.SourceSel.Sort( );
        this.TargetSel.Sort( );
    }
    
    this.Rem2Source  = function(p_Flag, p_aIdx) {
        switch(p_Flag){
            case "IDX":
                var aEntries    = this.TargetSel.GetByIdx( p_aIdx );
                                  this.SourceSel.Push( aEntries );
                break;
            case "ALL":
                var aEntries    = this.TargetSel.GetAll();
                                  this.SourceSel.Push( aEntries );
                                  this.TargetSel.Destroy();
        }
        this.SourceSel.Sort( );
        this.TargetSel.Sort( );
    }
    
    this.OutSelected = function() {
        var hs_RefOT    = new java.util.HashSet();
        for(var i=0; i<this.TargetSel.Size(); i++){
            hs_RefOT.add( this.TargetSel.Get( i ).GetObj() );
        }
        ga_RefOT    = hs_RefOT.toArray();
    }
}

function saveUserSelection( ){
    Context.writeProfileString(gs_Section, "cxnSelectedList", ArrayOTToString( ga_RefOT ) );    // String of OT-Nums
    
    Context.writeProfileInt(gs_Section, "opt_Nodes", dlgOptions.opt_Nodes );          // 0 = Only selected TCE node; 1 = Include children nodes
    Context.writeProfileInt(gs_Section, "opt_TCs", dlgOptions.opt_TCs );              // 0 = Overwrite existing test cases; 1 = Add to existing test cases
    
    Context.writeProfileInt(gs_Section, "opt_PathGraph", dlgOptions.opt_PathGraph );  // Include path graphics
    Context.writeProfileInt(gs_Section, "opt_ModGraph", dlgOptions.opt_ModGraph );    // Include model graphics
    Context.writeProfileInt(gs_Section, "opt_TrgEvt", dlgOptions.opt_TrgEvt );      // Include triggering/ end event
    Context.writeProfileInt(gs_Section, "opt_InclTDocu", dlgOptions.opt_InclTDocu );  // Assign test document to the model
    
    Context.writeProfileInt(gs_Section, "opt_OutExpRes", dlgOptions.opt_OutExpRes );  // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_EXPECT_TEST_RESULT)
    Context.writeProfileInt(gs_Section, "opt_OutAct", dlgOptions.opt_OutAct );        // ArisData.ActiveFilter().AttrTypeName(Constants.AT_AAM_TEST_ACTIVITY)
    Context.writeProfileInt(gs_Section, "opt_OutHRisk", dlgOptions.opt_OutHRisk );    // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_HIGH_RISK)
    Context.writeProfileInt(gs_Section, "opt_OutResp", dlgOptions.opt_OutResp );      // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_RESPONSIBLE)
    Context.writeProfileInt(gs_Section, "opt_OutRndNum", dlgOptions.opt_OutRndNum );  // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_ROUND_NUM)
    Context.writeProfileInt(gs_Section, "opt_OutTType", dlgOptions.opt_OutTType );    // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_TYPE)
    Context.writeProfileInt(gs_Section, "opt_OutTData", dlgOptions.opt_OutTData );    // ArisData.ActiveFilter().AttrTypeName(Constants.AT_TCE_TEST_DATA)
}

/**********************************************************************************************************************/
/*      DECLARATION's part                                                                                            */
/**********************************************************************************************************************/

    // Define (error) response numbers
    var ERR_FREE    	=  0;
    var ERR_2MUCH   	= -1;  // Starting node is not a TCE node
    var ERR_NOTCE   	= -2;  // Too many Object Definitions were selected
    var ERR_NOSEL   	= -3;  // No Object Definition selected - but Object Occurence
    
    // Define string globals  
    var gs_Empty    	= Packages.java.lang.String( convToBytes("-") );
    var gs_cEmpty   	= Packages.java.lang.String( convToBytes("") );
    var gs_Section  	= "SCRIPT_58e38e00-b8ab-11de-368f-80f5a5e6673a";

    // Define global arrays
    var ga_TSGnted      = new Array();
    var go_RefOT        = new java.util.HashSet();
    var ga_RefOT        = new Array();

    // Define Attributes
    var ATT_SAPID   	= Constants.AT_SAP_ID;
    var ATT_TCEID   	= Packages.java.lang.String( "b1e79fe0-5767-4988-b302-767810126663" );
    
/**********************************************************************************************************************/
/*      OBJECT CLASS part                                                                                            */
/**********************************************************************************************************************/

function TestDesignerNode() {
    // Data container for all test designer nodes
    this.Def        = null;
    this.AssMod     = null;
    this.NodeName   = gs_cEmpty;
    this.SAPID      = gs_cEmpty;

    this.Level      = -1;
    this.FuncType   = gs_cEmpty;
    this.HRisk      = gs_cEmpty;
    this.TType      = gs_cEmpty;
    this.TRndNum    = gs_cEmpty;
    this.Activity   = gs_cEmpty;
    this.SRCMod     = null;
    this.SRCModGUID = gs_cEmpty;
    this.TData      = gs_cEmpty;
    this.TResult    = gs_cEmpty;
    
    this.TrgEvts    = new Array();
    this.TrgEvt_Err = ERR_FREE;
    this.EndEvts    = new Array();
    this.EndEvt_Err = ERR_FREE;
    
    this.VarMaster  = null;
    this.VarMod     = null;
    this.VarAsgns   = null;
    
    this.Set = function(p_Flag, p_Val) {
        switch( p_Flag ){
            case "DEF":             this.Def = p_Val; break;
            case "ASSMOD":          this.AssMod = p_Val; break;
            case "NODENAME":        this.NodeName = Packages.java.lang.String(p_Val); break;
            case "SAPID":           this.SAPID = Packages.java.lang.String(p_Val); break;
            case "LEVEL":           this.Level = p_Val; break;
            case "SRCMOD":          this.SRCMod = p_Val; break;
            case "SRCMODGUID":      this.SRCModGUID = p_Val; break;
            case "TRGEVT":          this.TrgEvts = p_Val; break;
            case "TRGEVT_ERR":      this.TrgEvt_Err = p_Val; break;
            case "ENDEVT":          this.EndEvts = p_Val; break;
            case "ENDEVT_ERR":      this.EndEvt_Err = p_Val; break;
 
            case "MASTER":          this.VarMaster = p_Val; break;
            case "VARMOD":          this.VarMod = p_Val; break;
            case "VARASGNS":        this.VarAsgns = p_Val; break;
        }
    }

    this.Get = function(p_Flag) {
        switch( p_Flag ){
            case "DEF":             return this.Def;
            case "ASSMOD":          return this.AssMod;
            case "NODENAME":        return this.NodeName;
            case "SAPID":           return this.SAPID;
            case "LEVEL":           return this.Level;
            case "FUNCTYPE":        return this.FuncType;

            case "TRESULT":         return this.TResult;
            case "TACTIVITY":       return this.Activity;
            case "THRISK":          return this.HRisk;
            case "TRESP":           return this.TSResp;
            case "TRNDNUM":         return this.TRndNum;
            case "TTYPE":           return this.TType;
            case "TDATA":           return this.TData;

            case "SRCMOD":          return this.SRCMod;
            case "SRCMODGUID":      return this.SRCModGUID;

            case "TRGEVT":          return this.TrgEvts;
            case "TRGEVT_ERR":      return this.TrgEvt_Err;
            case "ENDEVT":          return this.EndEvts;
            case "ENDEVT_ERR":      return this.EndEvt_Err;

            case "MASTER":          return this.VarMaster;
            case "VARMOD":          return this.VarMod;
            case "VARASGNS":        return this.VarAsgns;
            default:                return null;
        }
    }
    
    this.GetFromMaster = function() {
        if( this.VarMaster != null ){
            // Assignments
            if( this.TSResp == gs_cEmpty )  { this.TSResp   = getAttrStrValue( this.VarMaster, Constants.AT_TCE_TEST_RESPONSIBLE, g_nLoc); }
            if( this.TData == gs_cEmpty )   { this.TData    = getAttrStrValue( this.VarMaster, Constants.AT_TCE_TEST_DATA, g_nLoc); }
            if( this.TResult == gs_cEmpty ) { this.TResult  = getAttrStrValue( this.VarMaster, Constants.AT_TCE_EXPECT_TEST_RESULT, g_nLoc); }
            if( this.Activity == gs_cEmpty ){ this.Activity = getAttrStrValue( this.VarMaster, Constants.AT_AAM_TEST_ACTIVITY, g_nLoc ); }
            if( this.TRndNum == gs_cEmpty ) { this.TRndNum  = getAttrStrValue( this.VarMaster, Constants.AT_TCE_TEST_ROUND_NUM, g_nLoc ); }
            if( this.HRisk == gs_cEmpty )   { this.HRisk    = getAttrStrValue( this.VarMaster, Constants.AT_TCE_TEST_HIGH_RISK, g_nLoc ); }
            if( this.TType == gs_cEmpty )   { this.TType    = getAttrStrValue( this.VarMaster, Constants.AT_TCE_TEST_TYPE, g_nLoc ); }
        }
    }
    
    this.Initialize = function(p_Val) {
        this.Def        = p_Val;
        this.AssMod     = (p_Val.AssignedModels([Constants.MT_PRG_STRCT_CHRT, Constants.MT_EEPC]).length == 1)?p_Val.AssignedModels([Constants.MT_PRG_STRCT_CHRT, Constants.MT_EEPC])[0]:null;
        this.NodeName   = getAttrStrValue( p_Val, Constants.AT_NAME, g_nLoc );
        this.SAPID      = getAttrStrValue( p_Val, ATT_SAPID, g_nLoc );
        this.Level      = Packages.java.lang.Integer( this.SAPID.split("#")[1] );
        this.FuncType   = getAttrStrValue( p_Val, Constants.AT_SAP_FUNC_TYPE, g_nLoc );
        this.TSResp     = getAttrStrValue( p_Val, Constants.AT_TCE_TEST_RESPONSIBLE, g_nLoc);
        this.HRisk      = getAttrStrValue( p_Val, Constants.AT_TCE_TEST_HIGH_RISK, g_nLoc );
        this.TType      = getAttrStrValue( p_Val, Constants.AT_TCE_TEST_TYPE, g_nLoc );
        this.TRndNum    = getAttrStrValue( p_Val, Constants.AT_TCE_TEST_ROUND_NUM, g_nLoc );
        this.Activity   = getAttrStrValue( p_Val, Constants.AT_AAM_TEST_ACTIVITY, g_nLoc );
        this.SRCModGUID = getAttrStrValue( p_Val, Constants.AT_TCE_SRC_MOD_GUID, g_nLoc).split("#")[0];
        this.SRCMod     = (this.SRCModGUID.length > 0)?ArisData.getActiveDatabase().FindGUID( this.SRCModGUID, Constants.CID_MODEL ):null;
        this.TData      = getAttrStrValue( p_Val, Constants.AT_TCE_TEST_DATA, g_nLoc);
        this.TResult    = getAttrStrValue( p_Val, Constants.AT_TCE_EXPECT_TEST_RESULT, g_nLoc);
        
        this.VarMaster  = (p_Val.Master().IsValid() == true)?p_Val.Master():null;
        this.VarMod     = (this.VarMaster != null)?((this.VarMaster.AssignedModels([Constants.MT_PRG_STRCT_CHRT, Constants.MT_EEPC]).length == 1 )?this.VarMaster.AssignedModels([Constants.MT_PRG_STRCT_CHRT, Constants.MT_EEPC])[0]:null): null;
        this.VarAsgns   = (this.VarMaster != null)? getRelatedDefs( this.VarMaster, ga_RefOT ):null;
        
        this.GetFromMaster( );
    }
}

function TestCaseNode() {
    this.TestCaseOwner = null;
    this.TestStep      = new Array();
    this.TSPath        = gs_cEmpty;
    this.TSFuncType    = gs_cEmpty;
    this.TSOutObj      = null;
    
    this.Set = function(p_Flag, p_Val) {
        switch(p_Flag) {
            case "TC_OWNER":        this.TestCaseOwner = p_Val; break;
            case "TESTSTEP":        this.TestStep = p_Val; break;
            //case "TESTSTEPPUSH":    this.TestStep.push(p_Val); break;
            case "TSPATH":          this.TSPath = Packages.java.lang.String(p_Val); break;
            case "TSOUTOBJ":        this.TSOutObj = p_Val; break;
        }
    }
    
    this.Get = function(p_Flag) {
        switch(p_Flag) {
            case "TC_OWNER":        return this.TestCaseOwner;
            case "TSNAME":          return this.TestCaseOwner.Get("NODENAME");
            case "TESTSTEP":        return this.TestStep;
            //case "TESTSTEPPOP":     return this.TestStep.pop();
            case "TSGRP":           return this.TSGrp;
            case "TSPATH":          return this.TSPath;
            case "TSOUTOBJ":        return this.TSOutObj;
            case "TS_FUNCTYPE":     return this.TSFuncType;
            case "TSRESULT":        return this.TestCaseOwner.Get("TRESULT");
            case "TSACTIVITY":      return this.TestCaseOwner.Get("TACTIVITY");
            case "TSHRISK":         return this.TestCaseOwner.Get("THRISK");
            case "TSRESP":          return this.TestCaseOwner.Get("TRESP");
            case "TSRNDNUM":        return this.TestCaseOwner.Get("TRNDNUM");
            case "TSTYPE":          return this.TestCaseOwner.Get("TTYPE");
            case "TSDATA":          return this.TestCaseOwner.Get("TDATA");
            default:                return null;
        }
    }
    
    this.GetTestStepIdx = function(p_Val) {
        return this.TestStep[p_Val];
    }
    
    this.getTrgEndEvents = function(p_Flag) {
        if( (this.TestCaseOwner.Get("TRGEVT_ERR") == ERR_2MUCH) || (this.TestCaseOwner.Get("ENDEVT_ERR") == ERR_2MUCH) ) return getString("MSG_TRGEND_EVENT_TOO_MUCH");

        var aTmp    = new Array();
        var sTmp    = gs_cEmpty;

        if( (p_Flag == "TRGEVT_ERR") && (this.TestCaseOwner.Get("TRGEVT_ERR") == ERR_FREE) ){
            aTmp    = this.TestCaseOwner.Get("TRGEVT");
        }
        if( (p_Flag == "ENDEVT_ERR") && (this.TestCaseOwner.Get("ENDEVT_ERR") == ERR_FREE) ){
            aTmp    = this.TestCaseOwner.Get("ENDEVT");
        }

        for(var i=0; i<aTmp.length; i++){
            sTmp    = sTmp.concat( getAttrStrValue(aTmp[i].ObjDef(), Constants.AT_NAME, g_nLoc) );
            if( i < aTmp.length-1 )  sTmp    = sTmp.concat(", ");
        }//END;;for_i

        return sTmp;
    }
    
    this.Initialize = function(p_Val) {
        this.TestCaseOwner    = p_Val;
        this.TestStep   = getTestSteps( p_Val );
        this.TSGrp      = (p_Val.Get("DEF").Group() != null)?p_Val.Get("DEF").Group():null;
        this.TSPath     = (this.TSGrp != null)?Packages.java.lang.String( this.TSGrp.Path(g_nLoc) ):gs_cEmpty;
        this.TSFuncType = (this.TestCaseOwner.Get("FUNCTYPE").isEmpty() == false)?this.TestCaseOwner.Get("FUNCTYPE"):this.TestCaseOwner.Get("LEVEL");
        setTrgEndEvents( "TRGEVT_ERR", p_Val );
        setTrgEndEvents( "ENDEVT_ERR", p_Val );
    }
}

function AZipClass() {
    this.sName  = gs_cEmpty;
    this.aData  = [];
    
    this.Initialize = function(p_Name, p_Data) {
        this.sName  = p_Name;
        this.aData  = p_Data;
    }
    this.Get = function(p_Flag) {
        switch( p_Flag ){
            case "NAME": return this.sName;
            case "DATA": return this.aData;
        }
        return null;
    }
    this.Set = function(p_Flag, p_Val) {
        switch( p_Flag ){
            case "NAME": this.sName = p_Val;
            case "DATA": this.aData = p_Val.copy();
        }
    }
}

/******************************************************************************************************/
// AME-6375 - Migrate TCE Blob to ADS

function getTceFolder() {
    var rootFolder = g_repository.getRootFolder();
    return g_repository.getFolder(rootFolder, TCE_ROOT_FOLDER);
}

function getAdsFolder(projectGuid) {
    return g_repository.getFolder(g_tceFolder, projectGuid);
}

function getTceDocumentKey(oObjDef) {
    return oObjDef.GUID();
}

function getProjectGuid(oObjDef) {
    var rootObjDef = getRootObject(oObjDef);
    if (rootObjDef == null) return null;
    
    return rootObjDef.GUID();

    
    function getRootObject(currentObjDef) {
        var externalId = getExternalId(currentObjDef);
        if (externalId == null) return null;
        
        var nLevel = externalId.level;
        while (nLevel >= 0) {
            
            if (nLevel == 0) {
                return currentObjDef;
            }
            
            nLevel--;
            var parentModel = getParentModel(currentObjDef, nLevel) ;
            if (parentModel == null) return null;
            
            var parentFunction = getParentFunction(parentModel);
            if (parentFunction == null) return null;
            
            currentObjDef = parentFunction;
        }
        return null;
    }
    
    function getParentModel(oObjDef, nLevel) {
        var oObjOccs = oObjDef.OccList();
        for (var i = 0; i < oObjOccs.length; i++) {
            var oModel = oObjOccs[i].Model();
            
            if (isTestDesignerModel(oModel, nLevel)) {
                return oModel;
            }
        }
        return null;
        
        function isTestDesignerModel(oModel, nLevel) {
            var externalId = getExternalId(oModel);
            if (externalId == null) return false;
            
            return StrComp(externalId.guid, TEST_DESIGNER_GUID) == 0 && externalId.level == nLevel;
        }
    }
    
    function getParentFunction(oModel) {
        var oSuperiorObjDefs = oModel.SuperiorObjDefs();
        for (var i = 0; i < oSuperiorObjDefs.length; i++) {
            var oSuperiorObjDef = oSuperiorObjDefs[i];            
            
            if (StrComp(getAttrExternalId(oSuperiorObjDef), getAttrExternalId(oModel)) == 0) {
                return oSuperiorObjDef;
            }
        }
        return null;
    }

    function getAttrExternalId(oItem) {
        return oItem.Attribute(Constants.AT_SAP_ID, g_nLoc).getValue();
    }
    
    function getExternalId(oItem) {
        var sExtId = getAttrExternalId(oItem);
        if (sExtId != "") {
            var aExtId = sExtId.split("#");
            return {guid: aExtId[0],
            level: parseInt(aExtId[1])};
        }
        return null;
    }
}

