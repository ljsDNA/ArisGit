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

 // Report Configuration
const SHOW_DIALOGS_IN_CONNECT = false;   // Show dialogs in ARIS Connect - Default=false (BLUE-12274)

/****************************************************/
   
//-------------------------------------------------------------------------------------------------
// Process manual
//-------------------------------------------------------------------------------------------------
// Global Extendable Statics-----------------------------------------------------------------------
// DO YOUR CHANGES HERE...
    var c_ADD_RASCI_TYPE            = true;     // Depending on this parameter the RASCI-type of the connection between the organization element and the process is added (in brackets) in the detail table
    var c_ADD_ORGA_CXN_TYPE         = false;    // Depending on this parameter the type of the connection between the organization element and the process is added (in brackets) in the detail table
    var c_ADD_IT_CXN_TYPE           = false;    // Depending on this parameter the type of connection between IT system and process is added
    var c_CONSIDER_ALLOC_DGRM       = true;     // Depending on this parameter the allocation in the assigned allocatin diagrams are additionally evaluated
    var c_CONSIDER_DERIVED_MODELS   = false;    // Depending on this parameter the derived model types of the configured model types are implicit evaluated
    var c_ADD_GOROUPPATH            = false;    // Depending on this parameter the group path of the model is added in overview table

    // Process Model
    var ga_ProcessModels    = [Constants.MT_ENTERPRISE_BPMN_COLLABORATION, Constants.MT_ENTERPRISE_BPMN_PROCESS, /*BLUE-9697*/
        Constants.MT_BPMN_COLLABORATION_DIAGRAM/*BLUE-5352*/, Constants.MT_BPD_BPMN, Constants.MT_BPMN_PROCESS_DIAGRAM, Constants.MT_SCEN_DGM, Constants.MT_EEPC,
        Constants.MT_EEPC_COLUMN, Constants.MT_EEPC_TAB_HORIZONTAL, Constants.MT_EEPC_MAT, Constants.MT_EEPC_ROW, Constants.MT_EEPC_TAB,
        Constants.MT_IND_PROC, Constants.MT_OFFICE_PROC, Constants.MT_PRCS_CHN_DGM, Constants.MT_PCD_MAT, Constants.MT_PROCESS_SCHEDULE,
        Constants.MT_SIPOC, Constants.MT_UML_ACTIVITY_DGM, Constants.MT_VAL_ADD_CHN_DGM];
    // Allocation Model
    var ga_AllocationModels = [Constants.MT_FUNC_ALLOC_DGM, Constants.MT_BPMN_ALLOC_DIAGR, Constants.MT_BPMN_ALLOCATION_DIAGRAM];
    // Organisation
    var ga_Organisation     = [Constants.OT_ORG_UNIT_TYPE, Constants.OT_ORG_UNIT, Constants.OT_SYS_ORG_UNIT_TYPE, Constants.OT_SYS_ORG_UNIT, 
        Constants.OT_POS, Constants.OT_PERS_TYPE, Constants.OT_PERS, Constants.OT_GRP, Constants.OT_EMPL_INST, Constants.OT_LOC];
    // Process
    var ga_Process          = [Constants.OT_FUNC];
    // IT
    var ga_IT               = [Constants.OT_DP_FUNC_TYPE, Constants.OT_DP_FUNC, Constants.OT_APPL_SYS_TYPE, Constants.OT_APPL_SYS_CLS,
        Constants.OT_APPL_SYS, /*Constants.OT_SCRN_DSGN, Constants.OT_SCRN,*/ Constants.OT_MOD_TYPE, Constants.OT_MOD];                 // BLUE-6327 No screens here
    // Data
    var ga_OutData          = [Constants.OT_CLST, Constants.OT_ENT_TYPE, Constants.OT_INFO_CARR, Constants.OT_RELSHP_TYPE,
        Constants.OT_ATTR_TYPE_GRP, Constants.OT_ERM_ATTR, Constants.OT_COT_ATTR, Constants.OT_OBJ_CX, Constants.OT_TECH_TRM,
        Constants.OT_BUSY_OBJ, Constants.OT_KNWLDG_CAT, Constants.OT_PACK, Constants.OT_CLS, Constants.OT_LST,
        Constants.OT_LST_DSGN, Constants.OT_BUSINESS_RULE];
    // Process model attributes
    var ga_ProcModAttributes    = [Constants.AT_PERS_RESP, Constants.AT_DESC, Constants.AT_STATE_1, Constants.AT_SINCE,
        Constants.AT_TITL_4, Constants.AT_PURP, Constants.AT_CRT_ON, Constants.AT_CRT_BY, Constants.AT_CHK_ON, 
        Constants.AT_CHK_BY, Constants.AT_REL_ON, Constants.AT_REL_BY, Constants.AT_CHNG_ON, Constants.AT_CHNG_BY,
        Constants.AT_EXT_DOC_1, Constants.AT_EXT_DOC_2, Constants.AT_TRM_ABB, Constants.AT_ORG, Constants.AT_VALID,
        Constants.AT_RESP, Constants.AT_DISTR_LST, Constants.AT_REL_1, Constants.AT_MODELING_AUDIT_TRAIL, Constants.AT_REVIEW_AUDIT_TRAIL,
        Constants.AT_APPROVAL_AUDIT_TRAIL, Constants.AT_MAJOR_VERSION, Constants.AT_MINOR_VERSION, Constants.AT_REVISION_NUMBER, Constants.AT_MODEL_STATUS];
    // Link attributes
    var ga_LinkAttributes       = [Constants.AT_EXT_1, Constants.AT_EXT_2, Constants.AT_EXT_3, Constants.AT_LINK,
        Constants.AT_DMS_LINK_1, Constants.AT_DMS_LINK_2, Constants.AT_DMS_LINK_3, Constants.AT_DMS_LINK_4];
    // RASCI
    // List of R-Cxn types "Responsible"
    var ga_RasciCxns_R = [Constants.CT_EXEC_1, Constants.CT_EXEC_2];
    // List of A-Cxn types "Accountable"
    var ga_RasciCxns_A = [Constants.CT_DECID_ON, Constants.CT_DECD_ON, Constants.CT_AGREES];
    // List of S-Cxn types "Supportive"
    var ga_RasciCxns_S = [Constants.CT_CONTR_TO_1, Constants.CT_CONTR_TO_2]; 
    // List of C-Cxn types "Consulted"
    var ga_RasciCxns_C = [Constants.CT_IS_TECH_RESP_1, Constants.CT_IS_TECH_RESP_3, Constants.CT_HAS_CONSLT_ROLE_IN_1, Constants.CT_HAS_CONSLT_ROLE_IN_2];
    // List of Cxn types "Informed"
    var ga_RasciCxns_I = [Constants.CT_MUST_BE_INFO_ABT_1, Constants.CT_MUST_BE_INFO_ON_CNC_1, Constants.CT_MUST_BE_INFO_ABT_2, Constants.CT_MUST_BE_INFO_ON_CNC_2];
        
// END::Global Extendable Statics------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

// DO NOT CHANGE ANYTHING FROM HERE ON!!!
//-------------------------------------------------------------------------------------------------
// Declaration's part------------------------------------------------------------------------------
    const c_SEPARATOR   = ";\n";

    var gb_bremote      = false;
    var gn_Lang         = Context.getSelectedLanguage();
    var gn_Format   	= Context.getSelectedFormat(); 
    var gaDTblCol       = getDTblColumns( 5 );// 5 - Number of detailed table columns
    var gs_Section      = "SCRIPT_2ba30bb0-5922-11df-3577-e3129f43de32";
    var gs_Empty    	= Packages.java.lang.String( "" );//convToBytes("") );
    var go_ActDB        = ArisData.getActiveDatabase();
    
    // Dialog support depends on script runtime environment (STD resp. BP, TC)
    var g_bDialogsSupported = isDialogSupported();
    
    var dlg             = null;
    var bShowGraphicSettingsDialog  = false;
    var hm_ModBookmark  = new java.util.HashMap();
    
    var CC_BLACK    = Constants.C_BLACK;
    var CC_TRANSPAR = Constants.C_TRANSPARENT;
    var CC_OBLUE    = RGB(  35,  51,  86 );
    var CC_LBLUE    = RGB(   3, 130, 153 );
    var CC_GWHITE   = RGB( 226, 231, 221 );
    var CC_VGREEN   = RGB( 150, 171,  57 );
    var CC_UCGREEN  = RGB( 204, 255, 204 );
    var CC_DORANGE  = RGB( 209, 110,   0 );
    var CC_ORED     = RGB( 198,   9,  42 );
    var CC_VRED     = RGB( 123,   0,  53 );
// END::Declaration's part-------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// MAIN part---------------------------------------------------------------------------------------
    var aSelModels  = getModelSelection();    // BLUE-10824 Context extended to model + group
    var outFile     = Context.createOutputObject( Context.getSelectedFormat(), Context.getSelectedFile() );
        outFile.Init( gn_Lang );
        updateAllUserDefinedMTs();
        
    // Check globals
    var greenToGo   = checkGlobalParameters();
    if( greenToGo == true ){
        // Set output options
        Context.setProperty( Constants.PROPERTY_SHOW_OUTPUT_FILE, true );
        Context.setProperty( Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false );
        // Set dialog default settings
        var hld_oOutputFile     = new __holder( outFile );
        var hld_nOutGraphic     = new __holder(0);
        var hld_nAssgnLevel     = new __holder(0);
        var hld_nAddAppendix    = new __holder(1);
        var nDlgResult              = -1;

        // Get user defined options
        if( g_bDialogsSupported ){
            nDlgResult  = showOutputOptionsDialog( hld_oOutputFile, hld_nOutGraphic, hld_nAssgnLevel );
        } else {
            hld_nAssgnLevel.value  = 0;     // Assignment level = 0 (BLUE-13465)
            hld_nOutGraphic.value  = 1;     // with Graphic
            hld_nAddAppendix.value = 1;     // with Appendix
            
            var bModelColor        = false;
            var nScaleOption       = 2;     // fit to page
            var bCutOfTheGraphic   = false;
            // most of the parameters are ignored!
            outputintoregistry(bModelColor, nScaleOption, bCutOfTheGraphic, 0, 0, 0, 0, 0, 0, 100);
            
        }
    }

    if( (nDlgResult == 0) || (greenToGo == false) ){// Dialog Cancelled - Do not create output report file
        Context.setScriptError(Constants.ERR_CANCEL);
        Context.setProperty( Constants.PROPERTY_SHOW_OUTPUT_FILE, false );
        Context.setProperty( Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false );
    }
    else{// Printout documents
        createDocument( aSelModels, hld_oOutputFile, hld_nOutGraphic, hld_nAssgnLevel );// Create document
        hld_oOutputFile.value.WriteReport();
    }
// END::MAIN part----------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// Dialogs part------------------------------------------------------------------------------------
    function dlgFuncOutputOptions(dlgItem, act, suppVal)
    {
        var bResult = true;
        switch(act){
            case 1:
                bResult = false;
            break;
            case 2:
                if( dlgItem == "VAR_CHECKBOX" ){
                    var bEnable = dlg.getDlgValue("VAR_CHECKBOX")!=0;
                    dlg.setDlgEnable("VAR_BUTTON", bEnable);
                }
                else if( dlgItem == "VAR_BUTTON" ){
                    bShowGraphicSettingsDialog = true;
                    bResult = false;
                }
                else if(dlgItem=="OK")      bResult = false;
                else if(dlgItem=="Cancel")  bResult = false;
            break;
        }
        
        return bResult;
    }
    
    function showOutputOptionsDialog( hld_outFile, hld_nOutGraphic, hld_nAssgnLevel){
        var ofilter     = ArisData.getActiveDatabase().ActiveFilter();
        var userdialog  = Dialogs.createNewDialogTemplate(0, 0, 610, 100, getString("TEXT_DLG_TITLE_GRP"), "dlgFuncOutputOptions");
    
        userdialog.GroupBox(10, 5, 600, 45, getString("TEXT_DLG_ASSGN_LEVEL"));
        userdialog.Text(25, 22, 195, 15, getString("TEXT_DLG_ASSGN_LEVEL"));
        userdialog.TextBox(220, 20, 60, 21, "VAR_TEXTBOX", 0, getString("TEXT_DLG_ASSGN_LEVEL"));

        userdialog.CheckBox(20, 60, 200, 15, getString("TEXT_DLG_CHKBOX"), "VAR_CHECKBOX");
        userdialog.PushButton(220, 60, 150, 15, getString("TEXT_DLG_GRAPHIC_BUTTON"), "VAR_BUTTON");
        userdialog.CheckBox(20, 80, 200, 15, getString("TEXT_DLG_CHKBOX_APPENDIX"), "VAR_APPENDIX");
        
        userdialog.OKButton();
        userdialog.CancelButton();
        userdialog.HelpButton("HID_2ba30bb0-5922-11df-3577-e3129f43de32.hlp");
        
        dlg = Dialogs.createUserDialog(userdialog); 
        // Read dialog settings from config  
        ReadSettingsDlgText( dlg, gs_Section, "VAR_TEXTBOX", hld_nAssgnLevel.value );
        ReadSettingsDlgValue( dlg, gs_Section, "VAR_CHECKBOX", hld_nOutGraphic.value );
        ReadSettingsDlgValue( dlg, gs_Section, "VAR_APPENDIX", hld_nAddAppendix.value );
        
        dlg.setDlgEnable( "VAR_BUTTON", (dlg.getDlgValue("VAR_CHECKBOX")!=0) );

        var nuserdialog = 0;
        for(;;){
            bShowGraphicSettingsDialog = false;
            nuserdialog = Dialogs.show( dlg );
            // Displays dialog and waits for the confirmation with OK.
            if( nuserdialog == 0 ){
                return nuserdialog;
            }
            if( bShowGraphicSettingsDialog ){
                graphicdialogs( hld_outFile, new __holder(true) );
                bShowGraphicSettingsDialog = false;
                continue;
            }
            else {
                if (!isNaN(dlg.getDlgText("VAR_TEXTBOX"))) {
                    var depth = parseInt(dlg.getDlgText("VAR_TEXTBOX"));
                    if (depth >= 0) {
                        hld_nAssgnLevel.value = depth;
                        break;
                    }else{ 
                        Dialogs.MsgBox( getString("TEXT_DLG_ERRMSG_TOO_SMALL"), Constants.MSGBOX_BTN_OK, getString("TEXT_DLG_TITLE_REPORT") );
                    }
                }else{
                    Dialogs.MsgBox( getString("TEXT_DLG_ERRMSG_NOT_NUMBER"), Constants.MSGBOX_BTN_OK, getString("TEXT_DLG_TITLE_REPORT"));
                }
            }
        }//END::for_::
    
        // Write dialog settings to config
        if( nuserdialog != 0 ){
            WriteSettingsDlgText( dlg, gs_Section, "VAR_TEXTBOX" );
            WriteSettingsDlgValue( dlg, gs_Section, "VAR_CHECKBOX" );
            WriteSettingsDlgValue( dlg, gs_Section, "VAR_APPENDIX" );
            hld_nAssgnLevel.value   = dlg.getDlgText("VAR_TEXTBOX");
            hld_nOutGraphic.value   = dlg.getDlgValue("VAR_CHECKBOX");
            hld_nAddAppendix.value  = dlg.getDlgValue("VAR_APPENDIX");
        }

        return nuserdialog;
    }
// END::Dialogs part-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// Functions part----------------------------------------------------------------------------------
    function getDTblColumns( p_NumCol){
        var aOut    = new Array();// Note that there will be Processes displayed at first Column always
        for(var i=0; i<p_NumCol; i++ ) { aOut[i] = new java.util.HashMap(); }

        aOut[0].put("TEXT", getString("TEXT_PG_ACTIVITY") );
        aOut[0].put("TEXT_PL", getString("TEXT_PG_ACTIVITY_PL") );
        aOut[0].put("TYPES", ga_Process );
        aOut[0].put("DIR", Constants.EDGES_ALL );
        aOut[0].put("STRUC", Constants.EDGES_NONSTRUCTURE );
        aOut[0].put("DATA", [] );
        aOut[0].put("BMK", "BMK0" );

        aOut[1].put("TEXT", getString("TEXT_PG_ORGANIZATION") );
        aOut[1].put("TEXT_PL", getString("TEXT_PG_ORGANIZATION_PL") );
        aOut[1].put("TYPES", ga_Organisation );
        aOut[1].put("DIR", Constants.EDGES_INOUT );
        aOut[1].put("STRUC", Constants.EDGES_NONSTRUCTURE );
        aOut[1].put("DATA", [] );
        aOut[1].put("BMK", "BMK1" );
        
        aOut[2].put("TEXT", getString("TEXT_PG_INPUT") );
        aOut[2].put("TEXT_PL", getString("TEXT_PG_INPUT_PL") );
        aOut[2].put("TYPES", ga_OutData );
        aOut[2].put("DIR", Constants.EDGES_IN );
        aOut[2].put("STRUC", Constants.EDGES_NONSTRUCTURE );
        aOut[2].put("DATA", [] );
        aOut[2].put("BMK", "BMK2" );
        
        aOut[3].put("TEXT", getString("TEXT_PG_OUTPUT") );
        aOut[3].put("TEXT_PL", getString("TEXT_PG_OUTPUT_PL") );
        aOut[3].put("TYPES", ga_OutData );
        aOut[3].put("DIR", Constants.EDGES_OUT );
        aOut[3].put("STRUC", Constants.EDGES_NONSTRUCTURE );
        aOut[3].put("DATA", [] );
        aOut[3].put("BMK", "BMK2" );
        
        aOut[4].put("TEXT", getString("TEXT_PG_IT") );
        aOut[4].put("TEXT_PL", getString("TEXT_PG_IT_PL") );
        aOut[4].put("TYPES", ga_IT );
        aOut[4].put("DIR", Constants.EDGES_INOUT );
        aOut[4].put("STRUC", Constants.EDGES_NONSTRUCTURE );
        aOut[4].put("DATA", [] );
        aOut[4].put("BMK", "BMK3" );
        
        return aOut;
    }//END::getDTblColumns()

    function checkGlobalParameters(){
        // Check and set global parameters to predefined value if not set
        if( (c_ADD_ORGA_CXN_TYPE != false) && (c_ADD_ORGA_CXN_TYPE != true) )               { c_ADD_ORGA_CXN_TYPE = false; }
        if( (c_CONSIDER_ALLOC_DGRM != false) && (c_CONSIDER_ALLOC_DGRM != true) )           { c_CONSIDER_ALLOC_DGRM = true; }
        if( (c_CONSIDER_DERIVED_MODELS != false) && (c_CONSIDER_DERIVED_MODELS != true) )   { c_CONSIDER_DERIVED_MODELS = false; }

        var nCounter    = 0;
        try{// check models, OTs,ATs for empty arrays - if empty => no go!
            if( ga_ProcessModels.length > 0)          nCounter++;
            if( ga_AllocationModels.length > 0)       nCounter++;
            if( ga_Organisation.length > 0)           nCounter++;
            if( ga_Process.length > 0)                nCounter++;
            if( ga_IT.length > 0)                     nCounter++;
            if( ga_OutData.length > 0)                nCounter++;
            if( ga_ProcModAttributes.length > 0) nCounter++;
            if( ga_LinkAttributes.length > 0)         nCounter++;
        }
        catch(err){
            return false;
        }
        
        if( nCounter < 8 ) return false;
        
        return true;
    }//END::checkGlobalParameters()
    
/*    function convToBytes( p_Val ){
        return Packages.java.lang.String( p_Val ).getBytes();
    }//END::convToBytes()*/
    
    function getAttrObj(p_objDef, p_attrTypeNum, p_Lang){
        return p_objDef.Attribute(p_attrTypeNum, p_Lang, true);
    }    
    
    function getAttrBlobValue(p_objDef, p_attrTypeNum, p_Lang){
        var attr    = p_objDef.Attribute(p_attrTypeNum, p_Lang, true);
        if(attr.IsValid() == false) return null;
        return attr.MeasureValue();
    }//END::getAttrBlobValue()
    
    function getAttrIntValue(p_objDef, p_attrTypeNum, p_Lang){
        var attr    = p_objDef.Attribute(p_attrTypeNum, p_Lang, true);
        if(attr.IsValid() == false) return -1;
        return attr.MeasureUnitTypeNum();
    }//END::getAttrIntValue()
    
    function getAttrStrValue(p_objDef, p_attrTypeNum, p_Lang){
        var attr    = p_objDef.Attribute(p_attrTypeNum, p_Lang, true);
        if(attr.IsValid() == false) return gs_Empty;
        return Packages.java.lang.String( attr.GetValue(true) );//convToBytes( attr.GetValue(true) ) );
    }//END::getAttrStrValue()

    function sortAttributeNames( a, b ){
        var valA    = ArisData.ActiveFilter().AttrTypeName( a );
        var valB    = ArisData.ActiveFilter().AttrTypeName( b );
        return valA.compareToIgnoreCase( valB );
    }//END::sortAttributeNames()
    
    function sortOccsNames( a, b ){
        var valA    = getAttrStrValue( a.ObjDef(), Constants.AT_NAME, gn_Lang );
        var valB    = getAttrStrValue( b.ObjDef(), Constants.AT_NAME, gn_Lang );
        return valA.compareToIgnoreCase( valB );
    }//END::sortOccsNames()
    
    function sortDefsNames( a, b ){
        var valA    = getAttrStrValue( a, Constants.AT_NAME, gn_Lang );
        var valB    = getAttrStrValue( b, Constants.AT_NAME, gn_Lang );
        return valA.compareToIgnoreCase( valB );
    }//END::sortDefsNames()

    function getConnectedByOT( p_oObj, p_aTypes, p_nDir, p_nCxnType ){
        var aOut    = new Array();
        // Search for directly connected objects
        var aConObj = commonUtils.search.searchConnectedObjOccs( p_oObj, p_oObj.Cxns( p_nDir, p_nCxnType) );
        for(var i=0; i<aConObj.length; i++){
            if( p_aTypes.contains( aConObj[i].ObjDef().TypeNum() ) == true )  { aOut.push( aConObj[i] ); }
        }//END::for_i
        if( c_CONSIDER_ALLOC_DGRM ){// Search for objects connected in Assigned Models
            var allObjOcc   = getAllOccsInAssignedModelsByMT( p_oObj, ga_AllocationModels );
            for(var i=0; i<allObjOcc.length; i++){
                var aConObj = commonUtils.search.searchConnectedObjOccs( allObjOcc[i], allObjOcc[i].Cxns( p_nDir) ); // Anubis 539901: Type of relationship in Allocation diagrams differs from process models - therefore parameter 'p_nCxnType' removed here
                for(var j=0; j<aConObj.length; j++){
                    if( p_aTypes.contains( aConObj[j].ObjDef().TypeNum() ) == true ){
                        if( aOut.contains( aConObj[j] ) == false ){
                            aOut.push( aConObj[j] );
                        }
                    }
                }//END::for_i
            }//END::for_i
        }
        return aOut;
        
        function getAllOccsInAssignedModelsByMT( p_oObj, p_aTypes ){
            var aAssgnMods  = p_oObj.ObjDef().AssignedModels( p_aTypes );
            var aAllOccurr  = new Array();
            if( aAssgnMods.length > 0 ){
                aAllOccurr  = p_oObj.ObjDef().OccList( aAssgnMods );
            }
            return aAllOccurr;
        }//END::getAllOccsInAssignedModelsByMT()::getConnectedByOT()
    }//END::getConnectedByOT()

    function getCreatorString( ){
        var sTmp    = ArisData.ActiveUser().Name( gn_Lang );
        return java.lang.String( commonUtils.attsall.formatString( getString("TEXT_CP_CREATOR"), [sTmp] ) );
    }//END::getCreatorString()
    
    function getCreatedOnString( p_Date ){
        if( (p_Date == null) || (p_Date == "") )  { p_Date    = new Date(); }
        return Packages.java.lang.String( commonUtils.attsall.formatString( getString("TEXT_CP_CREATEDON"),[p_Date.getDate(), (p_Date.getMonth()+1), p_Date.getFullYear()]) );
    }//END::getCreatedOnString()

    function getDBString( ){
        var sTmp    = go_ActDB.Name( gn_Lang );
        return java.lang.String( commonUtils.attsall.formatString( getString("TEXT_CP_ACTIVEDB"), [sTmp] ) );
    }//END::getDBString()    

    function getVersionString( ){
        return java.lang.String( getString("TEXT_CP_VERSION") );
    }//END::getVersionString()

    function placeOccsArrayStringsLink( p_Output, p_Obj, hm_DTbl, p_Array ){
        for(var i=0; i<p_Array.length; i++){
            p_Output.OutputLinkF( getAttrStrValue( p_Array[i].ObjDef(), Constants.AT_NAME, gn_Lang ), hm_DTbl.get("BMK"), getString("TEXT_STYLE_DEFAULT") );
            outCxnOnfo(p_Obj, p_Array[i], hm_DTbl);
            if( i<(p_Array.length - 1) ) { p_Output.OutputF( c_SEPARATOR, getString("TEXT_STYLE_DEFAULT") ); }
        }
        
        function outCxnOnfo(p_ObjS, p_ObjT, hm_DTbl) {
            if (hm_DTbl.get("TEXT").equals( getString("TEXT_PG_ORGANIZATION"))) {
                if (c_ADD_RASCI_TYPE != true && c_ADD_ORGA_CXN_TYPE != true) return;
                
                var oCxnDef = getCurrentCxn( p_ObjS, p_ObjT, hm_DTbl );
                var sCxn = "\n  [";
                    if (c_ADD_RASCI_TYPE == true) {
                        sCxn += getRasciType(oCxnDef);
                        if (c_ADD_ORGA_CXN_TYPE == true) sCxn += " - ";
                    }
                    if (c_ADD_ORGA_CXN_TYPE == true) {
                        sCxn += getCxnName(oCxnDef);
                    }
                sCxn += "]";
                p_Output.OutputF(sCxn, getString("TEXT_STYLE_DEFAULT") );
            } else if (hm_DTbl.get("TEXT").equals(getString("TEXT_PG_IT")) && c_ADD_IT_CXN_TYPE) {
                var oCxnDef = getCurrentCxn(p_ObjS, p_ObjT, hm_DTbl);
                var sCxn = "\n  [" + getCxnName(oCxnDef) + "]";
                p_Output.OutputF(sCxn, getString("TEXT_STYLE_DEFAULT"));
            }
        }

        function getCurrentCxn( p_ObjS, p_ObjT, hm_DTbl ){            
            // 1. Verify cxns in process model
            var aCxns   = p_ObjS.Cxns( hm_DTbl.get("DIR"), hm_DTbl.get("STRUC") );
            for(var j=0; j<aCxns.length; j++){
                if (verifyCxn(p_ObjS, p_ObjT, aCxns[j])) {
                    return aCxns[j].Cxn();
                }
            }
            // 2. Verify cxns in allocation model (BLUE-6327)
            var oModel = p_ObjT.Model();
            if (isAllocationModel(oModel.TypeNum())) {
                var assignedObjSList = p_ObjS.ObjDef().OccListInModel(oModel);
                for (var k=0; k < assignedObjSList.length; k++) {
                    var assignedObjS = assignedObjSList[k];
                    var aCxns = assignedObjS.Cxns( hm_DTbl.get("DIR"));  // (cmp. remarks above concerning Anubis 539901)
                    for(var j=0; j<aCxns.length; j++){
                        if (verifyCxn(assignedObjS, p_ObjT, aCxns[j])) {
                            return aCxns[j].Cxn();
                        }
                    }
                }
            }
            return null;
                
            function isAllocationModel(modelType) {
                for (var i=0; i < ga_AllocationModels.length; i++) {
                    if (modelType == ga_AllocationModels[i]) return true;
                }
                return false;
            }
            
            function verifyCxn(p_ObjS, p_ObjT, oCxnOcc) {
                // BLUE-23326 Ignore 'belongsTo'-Cxn in EnterpriseBPMN models
                if (isBelongsToCxnInEBPMN(oCxnOcc)) return false;
                
                return (oCxnOcc.SourceObjOcc().equals(p_ObjS) && oCxnOcc.TargetObjOcc().equals(p_ObjT)) ||
                (oCxnOcc.SourceObjOcc().equals(p_ObjT) && oCxnOcc.TargetObjOcc().equals(p_ObjS));
            }
            
            function isBelongsToCxnInEBPMN(oCxnOcc) {                
                var cxnType = oCxnOcc.CxnDef().TypeNum();
                if (cxnType == Constants.CT_BELONGS_TO_1) {
                    var modelType = oCxnOcc.Model().OrgModelTypeNum();
                    if (modelType == Constants.MT_ENTERPRISE_BPMN_COLLABORATION || modelType == Constants.MT_ENTERPRISE_BPMN_PROCESS) {
                        return true;
                    }
                }
                return false;
            }
        }
        
        function getCxnName(oCxnDef) {
            if (oCxnDef != null) return oCxnDef.ActiveType();
            return gs_Empty;
        }
        
        function getRasciType(oCxnDef) {
            if (oCxnDef != null) {
                var cxnType = oCxnDef.TypeNum();
                if (checkCxnType(cxnType, ga_RasciCxns_R)) return "R";
                if (checkCxnType(cxnType, ga_RasciCxns_A)) return "A";
                if (checkCxnType(cxnType, ga_RasciCxns_S)) return "S";
                if (checkCxnType(cxnType, ga_RasciCxns_C)) return "C";
                if (checkCxnType(cxnType, ga_RasciCxns_I)) return "I";
            }
            return "";
            
            function checkCxnType(cxnType, aCxnTypes) {
                for (var i=0; i < aCxnTypes.length; i++) {
                    if (cxnType == aCxnTypes[i]) return true;
                }
                return false;
            }
        }
    }//END::placeOccsArrayStringsLink()
    
    function placeModsArrayStringsLink( p_Output, p_Array ){
        for(var i=0; i<p_Array.length; i++){
            if( hm_ModBookmark.get(p_Array[i]) == null ) { p_Output.OutputF( getAttrStrValue( p_Array[i], Constants.AT_NAME, gn_Lang ), getString("TEXT_STYLE_DEFAULT") ); }
            else { p_Output.OutputLinkF( getAttrStrValue( p_Array[i], Constants.AT_NAME, gn_Lang ), hm_ModBookmark.get(p_Array[i]), getString("TEXT_STYLE_DEFAULT") ); }
            
            if( i<(p_Array.length - 1) ) { p_Output.OutputF( c_SEPARATOR, getString("TEXT_STYLE_DEFAULT") ); }
        }//END::for_i
    }//END::getModsArrayStrings()

    function getOccsArrayStrings( p_Array ){
        var sOut    = gs_Empty;
        for(var i=0; i<p_Array.length; i++){
            sOut    = sOut.concat( getAttrStrValue( p_Array[i].ObjDef(), Constants.AT_NAME, gn_Lang ) );
            if( i<(p_Array.length - 1) )   sOut = sOut.concat(c_SEPARATOR);
        }//END::for_i
            
        return sOut;
    }//END::getOccsArrayStrings()
    
    function getModsArrayStrings( p_Array ){
        var sOut    = gs_Empty;
        for(var i=0; i<p_Array.length; i++){
            sOut    = sOut.concat( getAttrStrValue( p_Array[i], Constants.AT_NAME, gn_Lang ) );
            if( i<(p_Array.length - 1) )   sOut = sOut.concat(c_SEPARATOR);
        }//END::for_i
            
        return sOut;
    }//END::getModsArrayStrings()

    function getAttrArrayStrings( p_Obj, p_Attr ){
        var sOut    = gs_Empty;
        for(var i=0; i<p_Attr.length; i++){
            sOut    = sOut.concat( getAttrStrValue( p_Obj.ObjDef(), p_Attr[i], gn_Lang ) );
            if( i<(p_Attr.length - 1) )   sOut = sOut.concat("###");
        }//END::for_i
            
        return sOut;
    }//END::getAttrArrayStrings()
    
    function getModelAttributes( p_Model, p_aAttr ){
        var aOut    = new Array();
        for(var i=0; i<p_aAttr.length; i++){
            if( (p_Model.Attribute( p_aAttr[i], gn_Lang ).IsMaintained()) && (p_Model.Attribute( p_aAttr[i], gn_Lang ).IsValid()) ) { aOut.push( p_aAttr[i] ); }
        }//END::for_i

        return aOut;
    }//END::getModelAttributes()

    function getModelStartEndEvents( p_Model ){
        p_Model.BuildGraph( true );
        var aStartOccs  = p_Model.StartNodeList();// Get start nodes
        var aEndOccs    = p_Model.EndNodeList();// Get end nodes
        var aNodes    = new Array();
        
        aNodes["START"]   = getFilteredByObjDef( getOccBeginEnd( p_Model, aStartOccs, Constants.EDGES_OUT) );// Get Events in start nodes
        aNodes["END"]     = getFilteredByObjDef( getOccBeginEnd( p_Model, aEndOccs, Constants.EDGES_IN) );// Get Events in end nodes
        return aNodes;
        
        function getOccBeginEnd( p_Model, aOccs, p_Dir){
            var aOut    = [];
            for(var i=0; i<aOccs.length; i++){
                if( (aOccs[i].ObjDef().TypeNum() == Constants.OT_EVT) && (aOccs[i].SymbolNum() != Constants.ST_PRCS_IF) ){
                    aOut.push( aOccs[i] );
                }
                if( aOccs[i].SymbolNum() == Constants.ST_PRCS_IF ){                    
                    aOut = aOut.concat( checkPRCSEventCnx( aOccs[i], p_Dir, []/*aVisitedOccs*/ ) );
                }
                
            }//END::for_i
            return aOut;
        }//END::getOccBeginEnd()
        
        function checkPRCSEventCnx( oOcc, p_Dir, aVisitedOccs/*BLUE-4631*/){
            if (checkVisited(oOcc, aVisitedOccs)) {
                // BLUE-4631 Avoid endless loop
                return [];
            }    
            var aTmp    = [];
            var aConOcc = commonUtils.search.searchConnectedObjOccs( oOcc, oOcc.Cxns( p_Dir, Constants.EDGES_STRUCTURE) );
            for(var i=0; i<aConOcc.length; i++){
                if( aConOcc[i].ObjDef().TypeNum() == Constants.OT_EVT ) { aTmp.push( aConOcc[i] ); }
                if( aConOcc[i].ObjDef().TypeNum() == Constants.OT_RULE ){
                    aTmp    = aTmp.concat( checkPRCSEventCnx( aConOcc[i], p_Dir, aVisitedOccs ) );
                }
            }//END::for_i
            return aTmp;
            
            function checkVisited(oOcc, oOccList) {
                for (i = 0; i < oOccList.length; i++) {
                    if (oOcc.IsEqual(oOccList[i]))
                        return true;
                }
                oOccList.push(oOcc);
                return false;
            }            
        }//END::checkPRCSEventCnx()
    }//END::getModelStartEndEvents()

    function getModelInOutObjects( p_Model ){
        var p_Types         = ga_OutData;
        var aNodes          = new Array();
            aNodes["IN"]    = getFilteredByObjDef( getOccInOut( p_Model, p_Types, Constants.EDGES_IN ) );// Get in-connected objects to process as input objects
            aNodes["OUT"]   = getFilteredByObjDef( getOccInOut( p_Model, p_Types, Constants.EDGES_OUT ) );// Get out-connected objects to process as output objects
        return aNodes;

        function getOccInOut( p_Model, p_Types, p_Dir ){
            var aOut    = new Array();
            try{
                var aOccs   = p_Model.ObjOccList();
                for(var i=0; i<aOccs.length; i++){
                    if( p_Types.contains( aOccs[i].ObjDef().TypeNum() ) == true ){
                        var aCxnIn  = commonUtils.search.searchConnectedObjOccs( aOccs[i], aOccs[i].Cxns( Constants.EDGES_IN, Constants.EDGES_NONSTRUCTURE) );
                        var aCxnOut = commonUtils.search.searchConnectedObjOccs( aOccs[i], aOccs[i].Cxns( Constants.EDGES_OUT, Constants.EDGES_NONSTRUCTURE) );
                        if( (p_Dir == Constants.EDGES_IN) && (aCxnIn.length == 0) && (aCxnOut.length > 0) ) { aOut.push( aOccs[i] ); }
                        if( (p_Dir == Constants.EDGES_OUT) && (aCxnIn.length > 0) && (aCxnOut.length == 0) ) { aOut.push( aOccs[i] ); }
                    }
                }//END::for_i
            }catch(err){
                return new Array();
            }
            return aOut;
        }//END::getOccInOut()
    }//END::getModelInOutObjects()

    function getModelITSys( p_Model, p_Types ){
        var aOut    = new Array();
        try{
            var aOccs   = p_Model.ObjOccList();
            for(var i=0; i<aOccs.length; i++){
                if( p_Types.contains( aOccs[i].ObjDef().TypeNum()) == true ){
                    aOut.push( aOccs[i] );
                }
            }//END::for_i
        }catch(err){
            return new Array();
        }
        return getFilteredByObjDef( aOut );
    }//END::getModelITSys()
    
    function getModelPrcsInts( p_Model ){
        var aOccs           = p_Model.ObjOccListBySymbol( [Constants.ST_PRCS_IF] );
        var nCounter        = 0;
        var aNodes          = new Array();
            aNodes["IN"]    = new Array();// Get incoming process interfaces
            aNodes["MID"]   = new Array();// Get in-between process interfaces
            aNodes["OUT"]   = new Array();// Get outgoing process interfaces

        for(var i=0; i<aOccs.length; i++){
            var aInCxns     = aOccs[i].Cxns( Constants.EDGES_IN, Constants.EDGES_STRUCTURE);
            var aOutCxns    = aOccs[i].Cxns( Constants.EDGES_OUT, Constants.EDGES_STRUCTURE);
            if( (aInCxns.length > 0) && (aOutCxns.length < 1) ) { aNodes["OUT"].push( aOccs[i] ); }
            if( (aInCxns.length < 1) && (aOutCxns.length > 0) ) { aNodes["IN"].push( aOccs[i] ); }
            if( (aInCxns.length > 0) && (aOutCxns.length > 0) ) { aNodes["MID"].push( aOccs[i] ); }
        }//END::for_i
        
        if( aNodes["IN"].length > 0 )     { nCounter++; aNodes["IN"]    = getFilteredByObjDef( aNodes["IN"] ); }
        if( aNodes["OUT"].length > 0 )    { nCounter++; aNodes["OUT"]    = getFilteredByObjDef( aNodes["OUT"] ); }
        if( aNodes["MID"].length > 0 )    { nCounter++; aNodes["MID"]    = getFilteredByObjDef( aNodes["MID"] ); }

        aNodes["RSPAN"]   = nCounter;

        return aNodes;
    }//END::getModelPrcsInts()
    
    function getModelSupProcesses( p_Model, p_Types ){
        var aOut        = new Array();
        var aSupDefs    = p_Model.SuperiorObjDefs();
        for(var i=0; i<aSupDefs.length; i++){
            var aOccs   = aSupDefs[i].OccList();
            for(var j=0; j<aOccs.length; j++){
                var oSupModel = aOccs[j].Model();
                if (oSupModel.IsEqual(p_Model)) continue;                               // BLUE-6327
                if (isIncomingOrOutgoingProcessInterface(aOccs[j])) continue;           // BLUE-6327
                
                if( p_Types.contains( oSupModel.TypeNum() ) == true ){
                    if( aOut.contains( oSupModel ) == false ) { aOut.push( oSupModel ); }
                }
            }//END::for_j
        }//END::for_i
        return aOut;
    }//END::getModelSupProcesses()
    
    function getModelAssProcesses( p_Model, p_Types ){
        var aOut        = new Array();
        var aAllOccs    = p_Model.ObjOccList();
        for(var i=0; i<aAllOccs.length; i++){
            if (isIncomingOrOutgoingProcessInterface(aAllOccs[i])) continue;            // BLUE-6327

            var aAsgnModels = aAllOccs[i].ObjDef().AssignedModels( p_Types );
            for(var j=0; j<aAsgnModels.length; j++){
                var oAsgnModel = aAsgnModels[j];
                if (oAsgnModel.IsEqual(p_Model)) continue;                              // BLUE-6327
                if( aOut.contains( oAsgnModel ) == false ) { aOut.push( oAsgnModel ); }
            }//END::for_j
        }//END::for_i
        return aOut;
    }//END::getModelAssProcesses()

    function isIncomingOrOutgoingProcessInterface(oFuncOcc) {
        if (oFuncOcc.SymbolNum() == Constants.ST_PRCS_IF) {
            var aInCxns  = oFuncOcc.Cxns( Constants.EDGES_IN, Constants.EDGES_STRUCTURE);
            var aOutCxns = oFuncOcc.Cxns( Constants.EDGES_OUT, Constants.EDGES_STRUCTURE);
            if ((aInCxns.length > 0) && (aOutCxns.length < 1)) return true;
            if ((aInCxns.length < 1) && (aOutCxns.length > 0)) return true;
        }
        return false;
    
    } 
    
    function getOccsFilteredByST( p_Model, p_aOccs, p_aSymb ){
        var aOccs   = new Array();
        var aOut    = new Array();
        
        for(var i=0; i<p_aOccs.length; i++){
            aOccs   = aOccs.concat( p_Model.ObjOccListFilter( p_aOccs[i] ) );
        }//END::for_i
        for(var i=0; i<aOccs.length;i++){
            if( p_aSymb.contains( aOccs[i].SymbolNum() ) == false )    aOut.push( aOccs[i] );
        }//END::for_i
        return aOut;
    }//END::getOccsFilteredByST()

    function getFilteredByObjDef( p_Array ){
        var aOut    = new Array();
        var aDefs   = new Array();
        for(var m=0; m<p_Array.length; m++){
            if( (aOut.contains( p_Array[m] ) == false) && (aDefs.contains( p_Array[m].ObjDef() ) == false) ){
                aOut.push( p_Array[m] );
                aDefs.push( p_Array[m].ObjDef() );
            }
        }//END::for_m
        return aOut;
    }//END::getFilteredByObjDef()::outputAppendix()

    function updateAllUserDefinedMTs(){
        ga_ProcessModels    = getUDMT( ga_ProcessModels );
        ga_AllocationModels = getUDMT( ga_AllocationModels );
        // BLUE-6572 - All lists which don't contain model types are removed here
        
        function getUDMT( p_Array ){
            var aOut    = [];
            for(var i=0; i<p_Array.length; i++){
                aOut    = aOut.concat( getModelTypesIncludingUserDefined( p_Array[i] ) );
            }//END::for_i
            return aOut;
        }//END::getUDMT()::updateAllUserDefinedMTs()
    }//END::updateAllUserDefinedMTs()

    function RGB( r, g, b ){
        return (new java.awt.Color(r/255.0,g/255.0,b/255.0,1)).getRGB() & 0xFFFFFF;
    }//END::RGB()
// END::Functions part-----------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
    
//-------------------------------------------------------------------------------------------------
// Output Functions part---------------------------------------------------------------------------
    function defineStyles( p_Output ){
        p_Output.DefineF("Header_Big", getString("TEXT_FONT_DEFAULT"), 20, CC_BLACK, CC_TRANSPAR,  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 0, 0, 0, 1);
        p_Output.DefineF(getString("TEXT_STYLE_HEADER"), getString("TEXT_FONT_DEFAULT"), 14, CC_BLACK, CC_TRANSPAR,  Constants.FMT_BOLD| Constants.FMT_CENTER| Constants.FMT_VCENTER, 1, 0, 0, 0, 0, 1);
        p_Output.DefineF("Header_Left", getString("TEXT_FONT_DEFAULT"), 14, CC_BLACK, CC_TRANSPAR,  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 0, 0, 0, 1);
        p_Output.DefineF("Header_Small", getString("TEXT_FONT_DEFAULT"), 12, CC_OBLUE, CC_TRANSPAR,  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 4, 2, 0, 1);

        p_Output.DefineF("Heading 0", getString("TEXT_FONT_DEFAULT"), 14, CC_OBLUE, CC_TRANSPAR,  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VCENTER| Constants.FMT_TOCENTRY0, 1, 0, 6, 4, 0, 1);
        p_Output.DefineF("Heading 1", getString("TEXT_FONT_DEFAULT"), 12, CC_OBLUE, CC_TRANSPAR,  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VCENTER| Constants.FMT_TOCENTRY1, 1, 0, 4, 2, 0, 1);
        p_Output.DefineF("Heading 2", getString("TEXT_FONT_DEFAULT"), 12, CC_OBLUE, CC_TRANSPAR,  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VCENTER| Constants.FMT_TOCENTRY2, 1, 0, 2, 1, 0, 1);
        p_Output.DefineF("Heading 3", getString("TEXT_FONT_DEFAULT"), 12, CC_OBLUE, CC_TRANSPAR,  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VCENTER| Constants.FMT_TOCENTRY3, 1, 0, 2, 1, 0, 1);

        p_Output.DefineF(getString("TEXT_STYLE_FOOTER"), getString("TEXT_FONT_DEFAULT"), 8, CC_BLACK, CC_TRANSPAR,  Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 0, 0, 0, 1);
        // p_Output.DefineF("Footer_Right", getString("TEXT_FONT_DEFAULT"), 8, CC_BLACK, CC_TRANSPAR,  Constants.FMT_RIGHT| Constants.FMT_VCENTER, 1, 0, 0, 0, 0, 1);
        p_Output.DefineF(getString("TEXT_STYLE_TOC"), getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_TRANSPAR,  Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 0, 0, 0, 1);

        p_Output.DefineF(getString("TEXT_STYLE_DEFAULT"), getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_TRANSPAR,  Constants.FMT_LEFT| Constants.FMT_VTOP, 1, 0, 0, 0, 0, 1);
        // p_Output.DefineF("Default_Bookmark", getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_TRANSPAR,  Constants.FMT_LEFT| Constants.FMT_VCENTER| Constants.FMT_LINKTARGET, 1, 0, 0, 0, 0, 1);
        // p_Output.DefineF("Default_Bold", getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_TRANSPAR,  Constants.FMT_BOLD | Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 0, 0, 0, 1);
        p_Output.DefineF("Default_BoldOnGreen", getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_UCGREEN,  Constants.FMT_BOLD | Constants.FMT_LEFT| Constants.FMT_VTOP, 1, 0, 0, 0, 0, 1);
    }//END::defineStyles()
    
    function getFStyle(p_Level){
        if (p_Level == 0) return "Heading 0";
        if (p_Level == 1) return "Heading 1";
        if (p_Level == 2) return "Heading 2";
        return "Heading 3";
    }
    
    function setEmptyLine( p_Output, p_Style, p_Cell, p_Num ){
        if( (p_Num == null) || (p_Num < 1) ) { p_Num = 1; }
        for(var i=0; i<p_Num; i++){
            p_Output.TableRow();
            addCell( p_Output, (p_Cell[0]==1?p_Style:[0,0,0,0]), "", 1, 1, 25, getString("TEXT_STYLE_DEFAULT") );
            addCell( p_Output, (p_Cell[1]==1?p_Style:[0,0,0,0]), "", 1, 1, 25, getString("TEXT_STYLE_DEFAULT") );
            addCell( p_Output, (p_Cell[2]==1?p_Style:[0,0,0,0]), "", 1, 1, 25, getString("TEXT_STYLE_DEFAULT") );
            addCell( p_Output, (p_Cell[3]==1?p_Style:[0,0,0,0]), "", 1, 1, 25, getString("TEXT_STYLE_DEFAULT") );
        }
    }//END::setEmptyLine()
    
    function setNewFrameStyle(p_Output, p_Style){
        p_Output.ResetFrameStyle();
        p_Output.SetFrameStyle( Constants.FRAME_BOTTOM,    p_Style[0] );
        p_Output.SetFrameStyle( Constants.FRAME_LEFT,      p_Style[1] );
        p_Output.SetFrameStyle( Constants.FRAME_RIGHT,     p_Style[2] );
        p_Output.SetFrameStyle( Constants.FRAME_TOP,       p_Style[3] );
    }//END::setNewFrameStyle()

    function createTableBegin( p_Output, p_Size, p_cellWidth, p_FGColor, p_BGColor, p_SpecFormat, p_Border ){
        var tbl_Format  = Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER;
        var colWList    = new java.util.ArrayList();
        for(var i=0; i<p_Size; i++) { colWList.add(p_cellWidth); }

        if( (p_SpecFormat != null) && (p_SpecFormat != "") ){
            tbl_Format  = tbl_Format | p_SpecFormat;
        }
        if( gn_Format == Constants.OUTPDF ){
            p_Output.BeginTable(100, p_FGColor, p_BGColor, tbl_Format, p_Border );
        }
        else{
            p_Output.BeginTable(100, colWList, p_FGColor, p_BGColor, tbl_Format, p_Border );
        }
    }//END::createTableBegin()

    function addCell( p_Output, p_fStyle, p_Text, p_Row, p_Col, p_PerCnt, p_txtStyle ){
        // Usage: addCell( p_Output, [0,1,1,0], "text", 1, 1, 25, getString("TEXT_STYLE_DEFAULT") );
        // Set new Frame Style
        if( p_fStyle.length > 0 )   { setNewFrameStyle(p_Output, p_fStyle ); }
        // Create output according to Selected Format
        if( gn_Format == Constants.OUTPDF ) { p_Output.TableCellF( p_Text, p_PerCnt, p_txtStyle ); }
        else { p_Output.TableCellF( p_Text, p_Row, p_Col, p_txtStyle ); }
    }//END::addCell()

	// BLUE-8672 Output attribute formatting
    function addCell_withFormattedAttr( p_Output, p_fStyle, p_oAttr, p_Row, p_Col, p_PerCnt, p_txtStyle ){        
        if( p_fStyle.length > 0 )   { setNewFrameStyle(p_Output, p_fStyle ); }

        switch (ArisData.ActiveFilter().AttrBaseType(p_oAttr.TypeNum())) {
            case Constants.ABT_MULTILINE:
            case Constants.ABT_SINGLELINE:
                var styledValue = p_oAttr.getStyledValue();
                if (!styledValue.containsOnlyPlainText()) {
                    if( gn_Format == Constants.OUTPDF ) { p_Output.TableCellF( "", p_PerCnt, p_txtStyle ); }
                    else { p_Output.TableCellF( "", p_Row, p_Col, p_txtStyle ); }

                    styledValue = styledValue.getMergedFormatting(ArisData.getActiveDatabase().defaultFontStyle().Font(gn_Lang));
                    p_Output.OutputFormattedText(styledValue.getHTML());
                    break;
                }
            default:
                var sText = p_oAttr.GetValue(true);
                if( gn_Format == Constants.OUTPDF ) { p_Output.TableCellF( sText, p_PerCnt, p_txtStyle ); }
                else { p_Output.TableCellF( sText, p_Row, p_Col, p_txtStyle ); }
        }
    }
 
    function outputCoverPage( p_Output, p_aSelModels ){
        setReportHeaderFooterWithTitle( p_Output, gn_Lang, false, false, false, getString("TEXT_CP_TITLE") );    // BLUE-6327, BLUE-11195
        
        createTableBegin( p_Output, 4, 25, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_VCENTER, 2 );
        setEmptyLine( p_Output, [0,0,1,0], [1,0,0,0], 1 );
        p_Output.TableRow(); 
        addCell( p_Output, [0,0,1,0], "", 1, 1, 25, getString("TEXT_STYLE_HEADER") );
        addCell( p_Output, [0,0,0,0], getString("TEXT_CP_TITLE"), 1, 3, 75, "Header_Big" );
        setEmptyLine( p_Output, [0,0,1,0], [1,0,0,0], 4 );
        p_Output.TableRow(); 
        addCell( p_Output, [0,0,1,0], "", 1, 1, 25, getString("TEXT_STYLE_HEADER") );
        addCell( p_Output, [0,0,0,0], getModsArrayStrings( p_aSelModels ), 1, 3, 75, "Header_Big" );
        setEmptyLine( p_Output, [0,0,1,0], [1,0,0,0], 3 );
        p_Output.TableRow(); 
        addCell( p_Output, [0,0,1,0], "", 1, 1, 25, getString("TEXT_STYLE_HEADER") );
        addCell( p_Output, [0,0,0,0], getCreatorString(), 1, 3, 75, "Header_Small" );
        setEmptyLine( p_Output, [0,0,1,0], [1,0,0,0], 1 );
        p_Output.TableRow(); 
        addCell( p_Output, [0,0,1,0], "", 1, 1, 25, getString("TEXT_STYLE_HEADER") );
        addCell( p_Output, [0,0,0,0], getCreatedOnString(), 1, 3, 75, "Header_Small" );
        setEmptyLine( p_Output, [0,0,1,0], [1,0,0,0], 1 );
        p_Output.TableRow(); 
        addCell( p_Output, [0,0,1,0], "", 1, 1, 25, getString("TEXT_STYLE_HEADER") );
        addCell( p_Output, [0,0,0,0], getDBString(), 1, 3, 75, "Header_Small" );
        setEmptyLine( p_Output, [0,0,1,0], [1,0,0,0], 1 );
        p_Output.TableRow(); 
// BLUE-23829 - Version number removed        
//        addCell( p_Output, [0,0,1,0], "", 1, 1, 25, getString("TEXT_STYLE_HEADER") );
//        addCell( p_Output, [0,0,0,0], getVersionString(), 1, 3, 75, "Header_Small" );
//        setEmptyLine( p_Output, [0,0,1,0], [1,0,0,0], 1 );
        p_Output.EndTable( "", 100, getString("TEXT_FONT_DEFAULT"), 8, Constants.C_TRANSPARENT, Constants.C_TRANSPARENT, Constants.FILLTYPE_SOLID, Constants.FMT_LEFT, 0);
        
        p_Output.ResetFrameStyle();     // BLUE-14209 Ensure consistent report header styles
    }//END::outputCoverPage()
    
    function outputTOC( p_Output ){
        p_Output.OutputField( Constants.FIELD_NEWPAGE, getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_TRANSPAR,  Constants.FMT_LEFT);
        setReportHeaderFooterWithTitle( p_Output, gn_Lang, false, false, false, getString("TEXT_CP_TITLE") );    // BLUE-6327, BLUE-11195
        
        p_Output.SetAutoTOCNumbering(true);
        if( (gn_Format == Constants.OUTRTF) || (gn_Format == Constants.OUTWORD) ){
			p_Output.BeginParagraphF( "Header_Left" );// Create Header 1 for TOC
                p_Output.OutputLnF( getString("TEXT_PG_TOC"), "Header_Left" );
            p_Output.EndParagraph();
            p_Output.BeginParagraphF( getString("TEXT_STYLE_DEFAULT") );
                p_Output.OutputField( Constants.FIELD_TOC, getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_TRANSPAR,  Constants.FMT_LEFT);
            p_Output.EndParagraph();
        }
        else{
            p_Output.BeginParagraphF( getString("TEXT_STYLE_TOC") );
                p_Output.OutputField( Constants.FIELD_TOC, getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_TRANSPAR,  Constants.FMT_LEFT);
            p_Output.EndParagraph();
        }
    }//END::outputTOC()
    
    function outputDataPerModel( p_aSelModels, hld_oOutputFile, p_bOutGraphic, p_nAsgnLevel, p_nActLevel, p_aVisitedMods ){
        var p_Output    = hld_oOutputFile.value;
        p_aSelModels.sort( sortDefsNames );
        if( p_aSelModels.length < 1 )   return;// Do not create new section if all data is empty
        
        for(var i=0; i<p_aSelModels.length; i++){// Output data per selected model
            p_Output.BeginSection( (i==0?false:true), Constants.SECTION_DEFAULT );
            setReportHeaderFooterWithTitle( p_Output, gn_Lang, false, false, false, getString("TEXT_CP_TITLE") );    // BLUE-6327, BLUE-11195
            p_Output.SetAutoTOCNumbering(true);
            // Gather info...
            var aAttribs        = getModelAttributes( p_aSelModels[i], ga_ProcModAttributes );
            var aSEEvents       = getModelStartEndEvents( p_aSelModels[i] );
            var aITSys          = getModelITSys( p_aSelModels[i], ga_IT );
            var aPrcsInt        = getModelPrcsInts( p_aSelModels[i] );
            var aInOutObjects   = getModelInOutObjects( p_aSelModels[i] );
            var aSupModels      = getModelSupProcesses( p_aSelModels[i], ga_ProcessModels );
            var aAsgnModels     = getModelAssProcesses( p_aSelModels[i], ga_ProcessModels );
            var cellWidth       = java.lang.Math.round( 100 / (gaDTblCol.length) );

                // Output info...
                outputHeadline( p_Output, p_aSelModels[i], p_bOutGraphic, p_nActLevel );
                outputOverview( p_Output, p_aSelModels[i], p_bOutGraphic, p_nActLevel );
                outputGraphic( p_Output, p_aSelModels[i], p_bOutGraphic, p_nActLevel );
                outputDetailedTable( p_Output, p_aSelModels[i], p_bOutGraphic, p_nActLevel );
                if( (aAsgnModels.length > 0) && (p_nActLevel < p_nAsgnLevel) && (p_aVisitedMods.contains( p_aSelModels[i] ) == false) ){
                    p_nActLevel++;
                    p_aVisitedMods.push( p_aSelModels[i] );
//                    p_aVisitedMods    = p_aVisitedMods.concat( outputDataPerModel( aAsgnModels, hld_oOutputFile, p_bOutGraphic, p_nAsgnLevel, p_nActLevel, p_aVisitedMods ) );
                    outputDataPerModel( aAsgnModels, hld_oOutputFile, p_bOutGraphic, p_nAsgnLevel, p_nActLevel, p_aVisitedMods ); // AGA-6465, Applix 298573
                    p_nActLevel--;
                }
            p_Output.EndSection();
        }//END::for_i
        
        return p_aVisitedMods;
        
        // Local functions for outputDataPerModel()-----------------------------------------------
        function outputHeadline( p_Output, p_Model, p_bGraphic, p_nLevel ){
            hm_ModBookmark.get(p_Model) != null?p_Output.addLocalBookmark( hm_ModBookmark.get(p_Model) ):a=0;
            p_Output.OutputLnF( getAttrStrValue( p_Model, Constants.AT_NAME, gn_Lang), getFStyle(p_nLevel) );
        }//END::outputHeadline()::outputDataPerModel()

        function outputOverview( p_Output, p_Model, p_bGraphic, p_nLevel ){
            p_Output.OutputLnF( getString("TEXT_PG_OVERVIEW_TABLE"), "Header_Small" );
            // Output overview table
            createTableBegin( p_Output, 4, 25, CC_BLACK, CC_TRANSPAR, null, 0 );
            setEmptyLine( p_Output, [0,0,0,0], [0,0,0,0], 1 );

            if( aAttribs.length > 0 ){// Row - Process model attributes
                // aAttribs.sort( sortAttributeNames );
                for(var i=0; i<aAttribs.length; i++){
                    p_Output.TableRow();
                    addCell( p_Output, [1,1,1,1], ArisData.ActiveFilter().AttrTypeName( aAttribs[i] ), 1, 1, 25, "Default_BoldOnGreen" );
                    addCell_withFormattedAttr( p_Output, [1,1,1,1], getAttrObj( p_Model, aAttribs[i], gn_Lang ), 1, 3, 75, getString("TEXT_STYLE_DEFAULT") );   // BLUE-8672
                }//END::for_i
            }
            
            if( aSEEvents["START"].length > 0 ) { p_Output.TableRow();// Row - Output Start Events
                aSEEvents["START"].sort( sortOccsNames );
                addCell( p_Output, [1,1,1,1], getString("TEXT_PG_START_EVENTS"), 1, 1, 25, "Default_BoldOnGreen" );
                addCell( p_Output, [1,1,1,1], getOccsArrayStrings( aSEEvents["START"] ), 1, 3, 75, getString("TEXT_STYLE_DEFAULT") );
            }
            
            if( aSEEvents["END"].length > 0 ) { p_Output.TableRow();// Row - Output End Events
                aSEEvents["END"].sort( sortOccsNames );
                addCell( p_Output, [1,1,1,1], getString("TEXT_PG_END_EVENTS"), 1, 1, 25, "Default_BoldOnGreen" );
                addCell( p_Output, [1,1,1,1], getOccsArrayStrings( aSEEvents["END"] ), 1, 3, 75, getString("TEXT_STYLE_DEFAULT") );
            }
            
            if( aITSys.length > 0 ) { p_Output.TableRow();// Row - Output IT systems
                aITSys.sort( sortOccsNames );
                addCell( p_Output, [1,1,1,1], getString("TEXT_PG_IT_SYSTEMS"), 1, 1, 25, "Default_BoldOnGreen" );
                addCell( p_Output, [1,1,1,1], getOccsArrayStrings( aITSys ), 1, 3, 75, getString("TEXT_STYLE_DEFAULT") );
            }
            
            
            if( aInOutObjects["IN"].length > 0 ) { p_Output.TableRow();// Row - Output input objects
                aInOutObjects["IN"].sort( sortOccsNames );
                addCell( p_Output, [1,1,1,1], getString("TEXT_PG_INPUT"), 1, 1, 25, "Default_BoldOnGreen" );
                addCell( p_Output, [1,1,1,1], getOccsArrayStrings( aInOutObjects["IN"] ), 1, 3, 75, getString("TEXT_STYLE_DEFAULT") );
            }
            
            if( aInOutObjects["OUT"].length > 0 ) { p_Output.TableRow();// Row - Output output objects
                aInOutObjects["OUT"].sort( sortOccsNames );
                addCell( p_Output, [1,1,1,1], getString("TEXT_PG_OUTPUT"), 1, 1, 25, "Default_BoldOnGreen" );
                addCell( p_Output, [1,1,1,1], getOccsArrayStrings( aInOutObjects["OUT"] ), 1, 3, 75, getString("TEXT_STYLE_DEFAULT") );
            }
            
            if( aPrcsInt["RSPAN"] > 0 ){// Output process interfaces
                p_Output.TableRow();
                if( (gn_Format == Constants.OUTPDF) && (aPrcsInt["RSPAN"] > 1) ){
                    addCell( p_Output, [0,1,1,1], getString("TEXT_PG_PRCS_IF"), 1, 1, 25, "Default_BoldOnGreen" );
                }
                else{
                    addCell( p_Output, [1,1,1,1], getString("TEXT_PG_PRCS_IF"), aPrcsInt["RSPAN"], 1, 25, "Default_BoldOnGreen" );
                }
                
                if( aPrcsInt["IN"].length > 0 ){// Row - Output incomming process interfaces
                    aPrcsInt["IN"].sort( sortOccsNames );
                    addCell( p_Output, [1,1,1,1], getString("TEXT_PG_INCOMING"), 1, 1, 25, getString("TEXT_STYLE_DEFAULT") );
                    addCell( p_Output, [1,1,1,1], getOccsArrayStrings( aPrcsInt["IN"] ), 1, 2, 50, getString("TEXT_STYLE_DEFAULT") );
                }
                
                if( aPrcsInt["MID"].length > 0 ){// Row - Output in between process interfaces
                    if( aPrcsInt["RSPAN"] > 1 ){
                        p_Output.TableRow();
                        if( gn_Format == Constants.OUTPDF ) { addCell( p_Output, [1,1,1,0], "", 1, 1, 25, "Default_BoldOnGreen" ); }
                    }
                    aPrcsInt["MID"].sort( sortOccsNames );
                    addCell( p_Output, [1,1,1,1], getString("TEXT_PG_INBETWEEN"), 1, 1, 25, getString("TEXT_STYLE_DEFAULT") );
                    addCell( p_Output, [1,1,1,1], getOccsArrayStrings( aPrcsInt["MID"] ), 1, 2, 50, getString("TEXT_STYLE_DEFAULT") );
                }
                
                if( aPrcsInt["OUT"].length > 0 ){// Row - Output outgoing process interfaces
                    if( aPrcsInt["RSPAN"] > 1 ){
                        p_Output.TableRow();
                        if( gn_Format == Constants.OUTPDF ) { addCell( p_Output, [1,1,1,0], "", 1, 1, 25, "Default_BoldOnGreen" ); }
                    }
                    aPrcsInt["OUT"].sort( sortOccsNames );
                    addCell( p_Output, [1,1,1,1], getString("TEXT_PG_OUTGOING"), 1, 1, 25, getString("TEXT_STYLE_DEFAULT") );
                    addCell( p_Output, [1,1,1,1], getOccsArrayStrings( aPrcsInt["OUT"] ), 1, 2, 50, getString("TEXT_STYLE_DEFAULT") );
                }
            }
            
            if( aSupModels.length > 0 ) { p_Output.TableRow();// Row - Output Superior process models
                aSupModels.sort( sortDefsNames );
                addCell( p_Output, [1,1,1,1], getString("TEXT_PG_SUPERIOR_PRCS"), 1, 1, 25, "Default_BoldOnGreen" );
                addCell( p_Output, [1,1,1,1], "", 1, 3, 75, getString("TEXT_STYLE_DEFAULT") );// getModsArrayStrings( aSupModels )
                placeModsArrayStringsLink( p_Output, aSupModels );
            }

            if( aAsgnModels.length > 0 ) { p_Output.TableRow();// Row - Output assigned process models
                aAsgnModels.sort( sortDefsNames );
                addCell( p_Output, [1,1,1,1], getString("TEXT_PG_ASSIGNED_PRCS"), 1, 1, 25, "Default_BoldOnGreen" );
                addCell( p_Output, [1,1,1,1], "", 1, 3, 75, getString("TEXT_STYLE_DEFAULT") );
                placeModsArrayStringsLink( p_Output, aAsgnModels );
            }
            
            if( c_ADD_GOROUPPATH == true ){p_Output.TableRow();// Row - Output Group Path
                addCell( p_Output, [1,1,1,1], getString("TEXT_PG_PATH"), 1, 1, 25, "Default_BoldOnGreen" );
                addCell( p_Output, [1,1,1,1], p_Model.Group().Path(gn_Lang, true), 1, 3, 75, getString("TEXT_STYLE_DEFAULT") );
            }
           
            p_Output.EndTable( "", 100, getString("TEXT_FONT_DEFAULT"), 8, CC_TRANSPAR, CC_TRANSPAR, Constants.FILLTYPE_SOLID, Constants.FMT_LEFT, 0);            
        }//END::outputOverview()::outputDataPerModel()

        function outputGraphic( p_Output, p_Model, p_bGraphic, p_nLevel ){
            if( p_bGraphic == true ){// Create Header 2 with model's graphic
                p_Output.OutputLnF( getString("TEXT_PG_MODEL_GRAPHIC"), "Header_Small" );
                p_Output.BeginParagraphF( getString("TEXT_STYLE_DEFAULT") );
                
                graphicout(new __holder( p_Output ), p_Model );

                p_Output.EndParagraph();
            }
        }//END::outputGraphic()::outputDataPerModel()

        function outputDetailedTable( p_Output, p_Model, p_bGraphic, p_nLevel ){
            var allProcesses    = getOccsFilteredByST( p_Model, ga_Process, [Constants.ST_PRCS_IF] );
                allProcesses.sort( sortOccsNames );
            if( allProcesses.length > 0 ){
                
                p_Output.OutputLnF( getString("TEXT_PG_DETAILED_TABLE"), "Header_Small" );
                p_Output.OutputLnF( getString("TEXT_PG_FOLLOW_HYPERLINK"), getString("TEXT_STYLE_DEFAULT") );

                gaDTblCol[0].put("DATA", gaDTblCol[0].get("DATA").concat( allProcesses ) );
                createTableBegin( p_Output, gaDTblCol.length, cellWidth, CC_BLACK, CC_TRANSPAR, null, 0 );
                outDTblHeader( p_Output, cellWidth );
                for(var i=0; i<allProcesses.length; i++){
                    p_Output.TableRow();
                    addCell( p_Output, [1,1,1,1], "", 1, 1, cellWidth, getString("TEXT_STYLE_DEFAULT") );// Output Process name
                    p_Output.OutputLinkF( getAttrStrValue( allProcesses[i].ObjDef(), Constants.AT_NAME, gn_Lang), gaDTblCol[0].get("BMK"), getString("TEXT_STYLE_DEFAULT") );
                    outDTblData( p_Output, p_Model, allProcesses[i]);// Output Process's data
                }//END::for_i
                p_Output.EndTable( "", 100, getString("TEXT_FONT_DEFAULT"), 8, CC_TRANSPAR, CC_TRANSPAR, Constants.FILLTYPE_SOLID, Constants.FMT_LEFT, 0);            
            }

            //---------------------------------------------------
            function outDTblHeader( p_Output, p_Width ){
                p_Output.TableRow();
                for(var j=0; j<gaDTblCol.length; j++){// Output Head_column names
                    addCell( p_Output, [1,1,1,1], gaDTblCol[j].get("TEXT"), 1, 1, p_Width, "Default_BoldOnGreen" );
                }//END::for_j
            }//END::outDTblHeader()::outputDetailedTable()

            function outDTblData( p_Output, p_Model, p_Process ){
                for(var k=1; k<gaDTblCol.length; k++){// Get connected Objects to 'p_Process' considering 'c_CONSIDER_ALLOC_DGRM'-parameter
                    var aOut    = getConnectedByOT( p_Process, gaDTblCol[k].get("TYPES"), gaDTblCol[k].get("DIR"), gaDTblCol[k].get("STRUC") );
                        aOut.sort( sortOccsNames );
                        gaDTblCol[k].put("DATA", gaDTblCol[k].get("DATA").concat( aOut ) );
                    addCell( p_Output, [1,1,1,1], "", 1, 1, cellWidth, getString("TEXT_STYLE_DEFAULT") );
                    placeOccsArrayStringsLink( p_Output, p_Process, gaDTblCol[k], aOut );
                }//END::for_i
            }//END::outDTblData()::outputDetailedTable()
        }//END::outputDetailedTable()::outputDataPerModel()
    }//END::outputDataPerModel()   
    
    function outputAppendix( p_Output ){
        var aAttr   = ga_LinkAttributes;

        p_Output.BeginSection( true, Constants.SECTION_DEFAULT );
        setReportHeaderFooterWithTitle( p_Output, gn_Lang, false, false, false, getString("TEXT_CP_TITLE") );    // BLUE-6327, BLUE-11195
        p_Output.SetAutoTOCNumbering(true);
        
        p_Output.OutputLnF( getString("TEXT_PG_APPENDIX"), "Header_Left" );

        for(var i=0; i<gaDTblCol.length; i++){
            var sHText  = "";
            var aData   = new Array();
                aData   = gaDTblCol[i].get("DATA");
            if( gaDTblCol[i].get("TEXT").equals( getString("TEXT_PG_OUTPUT") ) == true ) continue;
            if( gaDTblCol[i].get("TEXT").equals( getString("TEXT_PG_INPUT") ) == true ){
                aData   = aData.concat( getDTblDataByText( getString("TEXT_PG_OUTPUT") ) );
                sHText  = getString("TEXT_PG_DATA");
            }
            else { sHText  = gaDTblCol[i].get("TEXT_PL"); }
            
            if( aData.length < 1 )  continue;
            aData   = getFilteredByObjDef( aData );
            
            p_Output.BeginParagraphF( "Header_Small" );
                p_Output.addLocalBookmark( gaDTblCol[i].get("BMK") );
                p_Output.OutputLnF( sHText, "Header_Small" );
            p_Output.EndParagraph();
    
            createTableBegin( p_Output, 3, 33, CC_BLACK, CC_TRANSPAR, null, 0 );
            // Output Appendix table header
            p_Output.TableRow();
                addCell( p_Output, [1,1,1,1], getString("TEXT_PG_NAME"), 1, 1, 30, "Default_BoldOnGreen" );
                addCell( p_Output, [1,1,1,1], getString("TEXT_DESCRIPTION"), 1, 1, 30, "Default_BoldOnGreen" );
                addCell( p_Output, [1,1,1,1], getString("TEXT_LINKS"), 1, 1, 40, "Default_BoldOnGreen" );
            for(var k=0; k<aData.length; k++){
                p_Output.TableRow();
                addCell_withFormattedAttr( p_Output, [1,1,1,1], getAttrObj(aData[k].ObjDef(), Constants.AT_NAME, gn_Lang), 1, 1, 30, getString("TEXT_STYLE_DEFAULT") );// Output name (BLUE-8672)
                addCell_withFormattedAttr( p_Output, [1,1,1,1], getAttrObj(aData[k].ObjDef(), Constants.AT_DESC, gn_Lang), 1, 1, 30, getString("TEXT_STYLE_DEFAULT") );// Output description (BLUE-8672)
                addCell( p_Output, [1,1,1,1], "", 1, 1, 40, getString("TEXT_STYLE_DEFAULT") );// Output link attributes
                    OutputLinkAttributes( p_Output, getObjLinkAttributes( aData[k], aAttr ) );
            }//END::for_k
            p_Output.EndTable( "", 100, getString("TEXT_FONT_DEFAULT"), 8, CC_TRANSPAR, CC_TRANSPAR, Constants.FILLTYPE_SOLID, Constants.FMT_LEFT, 0);            
        }//END::for_i
        
        p_Output.EndSection();
        
        //-----------------------------------------------------------------
        function OutputLinkAttributes( p_Output, p_sAttr ){
            p_sAttr = p_sAttr.split("###");  // AGA-4109, Call-ID 287823
            for(var i=0; i<p_sAttr.length; i++){
                var sTmp    = java.lang.String( p_sAttr[i] );
                if( sTmp.contains( "http:" ) || sTmp.contains( "https:" ) || sTmp.contains( "ftp:" ) || sTmp.contains( "mailto:" ) ){
                    p_Output.OutputLinkF( p_sAttr[i], p_sAttr[i], getString("TEXT_STYLE_DEFAULT") );
                }
                else{
                    p_Output.OutputF( p_sAttr[i], getString("TEXT_STYLE_DEFAULT") );
                }
                if( i<(p_sAttr.length - 1) ) { p_Output.OutputF( c_SEPARATOR, getString("TEXT_STYLE_DEFAULT") ); }
            }//END::for_i
        }//END::OutputLinkAttributes()::outputAppendix()
        
        function getObjLinkAttributes( p_Obj, p_aAttr ){
            var aOut    = new Array();
            for(var i=0; i<p_aAttr.length; i++){
                if( (p_Obj.ObjDef().Attribute( p_aAttr[i], gn_Lang ).IsMaintained()) && (p_Obj.ObjDef().Attribute( p_aAttr[i], gn_Lang ).IsValid()) ) { aOut.push( p_aAttr[i] ); }
            }//END::for_i
            aOut.sort( sortAttributeNames );
            return getAttrArrayStrings( p_Obj, aOut );
        }//END::getObjLinkAttributes()::outputAppendix()

        function getDTblDataByText( p_Text ){
            for(var i=0; gaDTblCol.length; i++){
                if( gaDTblCol[i].get("TEXT").equals( p_Text ) == true ) return gaDTblCol[i].get("DATA");
            }//END::for_i
            return [];
        }//END::getDTblDataByText()::outputAppendix()
    }//END::outputAppendix()

    function createDocument( aSelModels, hld_oOutputFile, hld_nOutGraphic, hld_nAssgnLevel ){
        var aVisitedMods    = [];
        var hs_VisMods      = new java.util.HashSet();
        
        getModsBookmarks( aSelModels, hld_nAssgnLevel.value, 0);
        defineStyles( hld_oOutputFile.value );
        outputCoverPage( hld_oOutputFile.value, aSelModels );
        outputTOC( hld_oOutputFile.value );
        outputDataPerModel( aSelModels, hld_oOutputFile, hld_nOutGraphic.value, hld_nAssgnLevel.value, 0, aVisitedMods );
        if( hld_nAddAppendix.value == 1 )    outputAppendix( hld_oOutputFile.value );

        //-----------------------------------------------------------------
        function getModsBookmarks( p_aSelModels, p_MaxLevel, p_ActLevel){
            for(var i=0; i<p_aSelModels.length; i++){
                var aAsgnModels = getModelAssProcesses( p_aSelModels[i], ga_ProcessModels );
                hm_ModBookmark.put( p_aSelModels[i], "BMK" + p_aSelModels[i] );
                if( (aAsgnModels.length > 0) && (p_ActLevel < p_MaxLevel) && (hs_VisMods.contains( p_aSelModels[i] ) == false) ){
                    p_ActLevel++;
                    hs_VisMods.add( p_aSelModels[i] );
                    getModsBookmarks( aAsgnModels, p_MaxLevel, p_ActLevel );
                    p_ActLevel--;
                }
                hs_VisMods.add( p_aSelModels[i] );
            }//END::for_i
        }//END::getModsBookmarks()::createDocument()
    }//END::createDocument()
// END::Output Functions part----------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

function getModelSelection() {
    var aModelTypes = Context.getDefinedItemTypes(Constants.CID_MODEL);
    
    // Models selected
    var oSelModels = ArisData.getSelectedModels(aModelTypes);
    if (oSelModels.length > 0) return oSelModels;

    // Groups selected    
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

function isDialogSupported() {
	// Dialog support depends on script runtime environment (STD resp. BP, TC)
    var env = Context.getEnvironment();
    if (env.equals(Constants.ENVIRONMENT_STD)) return true;
    if (env.equals(Constants.ENVIRONMENT_TC)) return SHOW_DIALOGS_IN_CONNECT;
    return false;
}
