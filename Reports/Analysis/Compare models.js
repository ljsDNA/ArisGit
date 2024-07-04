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

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed" 

 // Report settings --------------------------------------------------------------------------------

    const IGNORE_DUPLICATED_RESULTS = false;         // BLUE-23799 - Ignore duplicated entries in table 'Comparison result' (optional, default: false)
 
 // Globals-----------------------------------------------------------------------------------------
    var gn_Lang         = Context.getSelectedLanguage();
    var gs_Filter       = ArisData.ActiveFilter().GUID();
    var gn_Format   	= Context.getSelectedFormat();
    var gs_Section      = "SCRIPT_13556fe0-59d4-11e0-785f-996f2eafddb7";
    var gs_Empty    	= new java.lang.String("");
    var ga_Context      = [getString("TEXT_WORKSPACE"), getString("TEXT_CURRVERSION"), getString("TEXT_CHNGLIST")];
    var gn_errLogin     = 100;// Bad user Login name or Password; problems login into DB
    var gn_errNoCmp     = 110;// No suitable models found according user settings criteria
    var gn_errNoDB      = 101;// Desired version DB not retrieved
    var gn_ModelCount   = -1;// Number of comparison models/ array entries of aElement
    var ga_Conditions   = new Array();
    var ga_Summary      = new Array();
    var ga_ModelGraphic = new Array();

    // BLUE-4104 In case of cross-database comparison uses same filter and language and compares with workspace (so dialog 100 seems not really necessary)    
    var gb_showDlg100  = false;          

    // DEFINE Global Color Style-----------------------------------------------------------------------
    var CC_BLACK        = Constants.C_BLACK;
    var CC_WHITE        = Constants.C_WHITE;
    var CC_TRANSPARENT  = Constants.C_TRANSPARENT;
    var CC_DARK_GREEN   = RGB(0, 128, 128);
    var CC_BLUE         = Constants.C_BLUE;
    var CC_RED          = Constants.C_RED;
    var CC_YELLOW       = Constants.C_YELLOW;
    var CC_GREEN        = Constants.C_GREEN;
    
    // DO NOT TRANSLATE !!!----------------------------------------------------------------------------
    var c_xmlCondition  = "condition";      // condition
    var c_xmlAction     = "action";         // action
    var c_xmlSymbolType = "symbol-type";    // symbol-type    
    var c_xmlCxnType    = "cxn-type";       // cxn-type
    var c_xmlAttrType   = "attr-type";      // attr-type
    var c_xmlType       = "type";           // type
    var c_xmlMsgText    = "msg-text";       // msg-text
    var gs_Updated      = "UPDATED";        // UPDATED
    var gs_Created      = "CREATED";        // CREATED
    var gs_Deleted      = "DELETED";        // DELETED
    
    // Default texts for summary-----------------------------------------------------------------------    
    var c_sDefaultText_SomethingCreated = getString("DEFAULTTEXT_SOMETHING_CREATED");
    var c_sDefaultText_SomethingUpdated = getString("DEFAULTTEXT_SOMETHING_UPDATED");
    var c_sDefaultText_SomethingDeleted = getString("DEFAULTTEXT_SOMETHING_DELETED");
    
    
    var c_sDefaultText_SymbolTypeCreated = getString("DEFAULTTEXT_SYMBOLTYPE_CREATED");
    var c_sDefaultText_SymbolTypeUpdated = getString("DEFAULTTEXT_SYMBOLTYPE_UPDATED");
    var c_sDefaultText_SymbolTypeDeleted = getString("DEFAULTTEXT_SYMBOLTYPE_DELETED");
    
    var c_sDefaultText_CxnTypeCreated = getString("DEFAULTTEXT_CXNTYPE_CREATED");
    var c_sDefaultText_CxnTypeUpdated = getString("DEFAULTTEXT_CXNTYPE_UPDATED");
    var c_sDefaultText_CxnTypeDeleted = getString("DEFAULTTEXT_CXNTYPE_DELETED");
    
    var c_sDefaultText_AttrTypeCreated = getString("DEFAULTTEXT_ATTRTYPE_CREATED");
    var c_sDefaultText_AttrTypeUpdated = getString("DEFAULTTEXT_ATTRTYPE_UPDATED");
    var c_sDefaultText_AttrTypeDeleted = getString("DEFAULTTEXT_ATTRTYPE_DELETED");
    
    var c_sDefaultText_CxnType_AttrTypeCreated = getString("DEFAULTTEXT_CXNTYPE_ATTRTYPE_CREATED");
    var c_sDefaultText_CxnType_AttrTypeUpdated = getString("DEFAULTTEXT_CXNTYPE_ATTRTYPE_UPDATED");
    var c_sDefaultText_CxnType_AttrTypeDeleted = getString("DEFAULTTEXT_CXNTYPE_ATTRTYPE_DELETED");
    // Comparision classes-----------------------------------------------------------------------------
    __cmp_Statistics        = function( ){
        this.CmpExistFirstMod       = 0;
        this.CmpExistSecondMod      = 0;
        this.CmpChangeBothMod       = 0;
        this.ItmModProperties       = 0;

        this.ItmObjDefinitions      = new Array();
            this.ItmObjAttributes   = 0;
            this.ItmObjOccurrences  = new Array();
            this.ItmObjAppearance   = 0;
            this.ItmObjPosition     = 0;
            this.ItmObjAttrPlace    = 0;
            
        this.ItmCxnDefinitions      = new Array();
            this.ItmCxnAttributes   = 0;
            this.ItmCxnOccurrences  = new Array();
            this.ItmCxnAppearance   = 0;
            this.ItmCxnPosition     = 0;
            this.ItmCxnAttrPlace    = 0;

        this.ItmGraphicObjects      = 0;
        this.ItmOLEObjects          = 0;
        this.ItmFreeText            = 0;

        __cmp_Statistics.prototype.Set	= function( oDifference ){
			switch( oDifference.getDifferenceType() ){// Get Existence OR Difference
                case Constants.MODCOMP_DIFF_LEFTONLY:// Existence
                    this.CmpExistFirstMod++;
                    break;
                case Constants.MODCOMP_DIFF_RIGHTONLY:// Existence
                    this.CmpExistSecondMod++;
                    break;
                case Constants.MODCOMP_DIFF_BOTH:// Difference
                    this.CmpChangeBothMod++;
                    break;
            }

            switch( oDifference.getExistingElement().KindNum() ){
                case Constants.CID_MODEL:
                    this.ItmModProperties++;
                    break;
                case Constants.CID_OBJDEF:
                case Constants.CID_OBJOCC:
                    if( oDifference.getDifferenceSubType() == Constants.MODCOMP_DEFINITION) {
                        var oObjDef = (oDifference.getExistingElement().KindNum() == Constants.CID_OBJDEF) ? oDifference.getExistingElement() : oDifference.getExistingElement().ObjDef();
                        this.ItmObjDefinitions.push(oObjDef);
                    }
                    if( oDifference.getDifferenceSubType() == Constants.MODCOMP_OCCURENCE) {
                        if (oDifference.getExistingElement().KindNum() == Constants.CID_OBJOCC) {
                            this.ItmObjOccurrences.push(oDifference.getExistingElement());
                        }
                    }
                    if( oDifference.isSubElementChanged() == true ){// Get Difference in attribute...
                        if( oDifference.getDifferenceSubType() == Constants.MODCOMP_ATTRIBUTE_OCC && 
                            (oDifference.getDifferenceKind() == Constants.MODCOMP_DIFFKIND_ATTR_PLACEMENT || oDifference.getDifferenceKind() == Constants.MODCOMP_DIFFKIND_ATTR_PORT) ) {
                            this.ItmObjAttrPlace++;
                        }
                        if( oDifference.getDifferenceSubType() == Constants.MODCOMP_ATTRIBUTE_DEF ) {
                            this.ItmObjAttributes++;
                        }
                    }
                    if( oDifference.isSubElementChanged() == false ){// Get Difference in existence, appearance, size, position,...
                        switch( oDifference.getDifferenceKind() ){
                            case Constants.MODCOMP_DIFFKIND_POSITION:
                            case Constants.MODCOMP_DIFFKIND_SIZE:
                                this.ItmObjPosition++;
                                break;
                            case Constants.MODCOMP_DIFFKIND_APPEARENCE:
                            case Constants.MODCOMP_DIFFKIND_SYMBOL:
                                this.ItmObjAppearance++;
                                break;
                        }
                    }
                    break;
                case Constants.CID_CXNDEF:
                case Constants.CID_CXNOCC:
                    if( oDifference.getDifferenceSubType() == Constants.MODCOMP_DEFINITION) {
                        var oCxnDef = (oDifference.getExistingElement().KindNum() == Constants.CID_CXNDEF) ? oDifference.getExistingElement() : oDifference.getExistingElement().CxnDef();
                        this.ItmCxnDefinitions.push(oCxnDef);
                    }
                    if( oDifference.getDifferenceSubType() == Constants.MODCOMP_OCCURENCE) {
                        if (oDifference.getExistingElement().KindNum() == Constants.CID_CXNOCC) {
                            this.ItmCxnOccurrences.push(oDifference.getExistingElement());
                        }
                    }
                    if( oDifference.isSubElementChanged() == true ){// Get Difference in attribute...
                        if( oDifference.getDifferenceSubType() == Constants.MODCOMP_ATTRIBUTE_OCC && 
                            (oDifference.getDifferenceKind() == Constants.MODCOMP_DIFFKIND_ATTR_PLACEMENT || oDifference.getDifferenceKind() == Constants.MODCOMP_DIFFKIND_ATTR_PORT) ) { this.ItmCxnAttrPlace++; }
                        if( oDifference.getDifferenceSubType() == Constants.MODCOMP_ATTRIBUTE_DEF ) { this.ItmCxnAttributes++; }
                    }
                    if( oDifference.isSubElementChanged() == false ){// Get Difference in existence, appearance, size, position,...
                        switch( oDifference.getDifferenceKind() ){
                            case Constants.MODCOMP_DIFFKIND_CXNPOINTS:
                            case Constants.MODCOMP_DIFFKIND_POINTS:
                                this.ItmCxnPosition++;
                                break;
                            case Constants.MODCOMP_DIFFKIND_CXN_APPEARENCE:
                            case Constants.MODCOMP_DIFFKIND_APPEARENCE:
                            case Constants.MODCOMP_DIFFKIND_SYMBOL:
                                this.ItmCxnAppearance++;
                                break;
                        }
                    }
                    break;
                case Constants.CID_COMOBJDEF:
                case Constants.CID_COMOBJOCC:
                    this.ItmOLEObjects++;
                    break;
                case Constants.CID_TEXTDEF:
                case Constants.CID_TEXTOCC:
                    this.ItmFreeText++;
                    break;
                case Constants.CID_GFXOBJ:
                    this.ItmGraphicObjects++;
                    break;
            }// END::switch_KindNum
		}
    }
    
    __cmp_Occurrences       = function( ){
        this.Checked        = true;
        this.Appearance     = false;
        this.Position       = false;
        this.AttrPlace      = false;
    }

    __cmp_Definitions       = function( ){
        this.Checked        = true;
        this.Attributes     = true;
            this.SystemAttributes   = false;
        this.Occurrences    = new __cmp_Occurrences();
    }
    
    __cmp_ComparisonOptions         = function( ){
        this.CmpExistFirstMod       = true;
        this.CmpExistSecondMod      = true;
        this.CmpChangeBothMod       = true;
    
        this.ItmModProperties       = true;
        this.ItmObjDefinitions      = new __cmp_Definitions( );
        this.ItmCxnDefinitions      = new __cmp_Definitions( );
        this.ItmGraphicObjects      = true;
        this.ItmOLEObjects          = true;
        this.ItmFreeText            = true;
        
        this.AddIdenticalAttr       = false;
        this.AddAttrNumber          = Constants.AT_NAME;
        this.AddMatchCase           = false;
        this.AddLineBreaksSpaces    = false;
        
        this.MasterVariantComp      = false
    }

    __usertype_tComparisonSet   = function( ){
        this.aModels            = ArisData.getSelectedModels( getModelTypesIncludingUserDefined_Array( Context.getDefinedItemTypes(Constants.CID_MODEL) ) );
        this.oRefModel          = ( (this.aModels != null) && (this.aModels.length == 1) )?this.aModels[0]:null;
        this.oActDB             = ArisData.getActiveDatabase( );        

        this.nDBCompare         = 0;
        this.nModCompare        = 0;

        this.aCompModels        = null;
        this.oCompDB            = null;
        this.oCmpOptions        = null;// new __cmp_ComparisonOptions( );
        this.oCmpStatistics     = null;// new __cmp_Statistics( );
        
        if( (this.aModels != null) && (this.aModels.length > 1) ){
            this.aModels.sort( sortLangNames );
        }

        __usertype_tComparisonSet.prototype.getScope    = function( oUsrSettings ){
            var aTmp            = new Array();
            this.oRefModel      = oUsrSettings.RefModel;// Reference model
            this.aCompModels    = oUsrSettings.CompModels.copy();// Array of selected models for comparision
                aTmp.push(this.oRefModel);
            this.aModels        = aTmp.concat( this.aCompModels );// Merged Reference model (index==0) with comparision models (index > 0)

            this.nDBCompare     = oUsrSettings.P11DBCompare;// Option for comparison of models: 0->Within One DB, 1->Cross DB comparision
            this.nModCompare    = oUsrSettings.P11ModCompare;// Option for comparison of models: 0->Versions, 1->Masters/variants, 2->Attribute, 3->GUID, 4->Selected models

            this.oCompDB        = oUsrSettings.CompDB;// Cross compare DB opened using P10Login, P10Password, P100Filter, P100Lang, as read-only
            this.oCmpOptions    = oUsrSettings.oCmpOptions;// User set Comparision Options
            this.oCmpStatistics = new __cmp_Statistics( );

            gn_ModelCount       = this.aCompModels.length;
        }//END::getScope()

        __usertype_tComparisonSet.prototype.outputStatistics    = function( p_Output, sCriterion, sText ){
            if( (p_Output != null) && ( sCriterion != null) && (sText != null) ){
                var nResult     = "";
                var sSetting    = "";
                
                if( sCriterion == "Criterion" ){
                    var sTmp    = new Array();
                        sTmp.push( ((this.nDBCompare == 0)?getString("TEXT_WITHINDB"):getString("TEXT_CROSSDB")) );
                        if( this.nModCompare == 0 ) sTmp.push( getString("TEXT_CRITERION1") );
                        if( this.nModCompare == 1 ) sTmp.push( getString("TEXT_CRITERION2") );
                        if( this.nModCompare == 2 ) sTmp.push( getString("TEXT_CRITERION3") );
                        if( this.nModCompare == 3 ) sTmp.push( getString("TEXT_CRITERION4") );
                        if( this.nModCompare == 4 ) sTmp.push( getString("TEXT_CRITERION5") );
                    sSetting    = commonUtils.attsall.formatString( "@0,\n@1", sTmp );
                } else if( sCriterion == "AddIdenticalAttr"){
                        if( this.oCmpOptions.AddIdenticalAttr == true){
                            sSetting    = formatstring1( getString("TEXT_MATCH_OUTPUT"), ArisData.ActiveFilter().AttrTypeName( this.oCmpOptions.AddAttrNumber ));
                            if( this.oCmpOptions.AddMatchCase == true )         sSetting = formatstring2("@1,\n@2", sSetting, getString("TEXT_MATCH1"));
                            if( this.oCmpOptions.AddLineBreaksSpaces == true )  sSetting = formatstring2("@1,\n@2", sSetting, getString("TEXT_MATCH2"));
                        } else{
                            sSetting    = getString("TEXT_MATCH_STANDARD");
                        }
                } else if(  (sCriterion == "CmpExistFirstMod") || (sCriterion == "CmpExistSecondMod") ||
                            (sCriterion == "CmpChangeBothMod") || (sCriterion == "ItmModProperties") ||
                            (sCriterion == "ItmGraphicObjects") || (sCriterion == "ItmOLEObjects") ||
                            (sCriterion == "ItmFreeText") ){
                        nResult     = eval( "this.oCmpStatistics." + sCriterion);
                        sSetting    = eval( "this.oCmpOptions." + sCriterion);
                        sSetting    = (sSetting == true)?getString("TEXT_OPTION_YES"):getString("TEXT_OPTION_NO");
                } else{
                    if( sCriterion == "ItmObjDefinitions" ) { sSetting = this.oCmpOptions.ItmObjDefinitions.Checked; }
                    if( sCriterion == "ItmObjAttributes" ) { sSetting = this.oCmpOptions.ItmObjDefinitions.Attributes; }
                    if( sCriterion == "ItmObjOccurrences" )  { sSetting = this.oCmpOptions.ItmObjDefinitions.Occurrences.Checked; }
                    if( sCriterion == "ItmObjAppearance" ) { sSetting = this.oCmpOptions.ItmObjDefinitions.Occurrences.Appearance; }
                    if( sCriterion == "ItmObjPosition") { sSetting = this.oCmpOptions.ItmObjDefinitions.Occurrences.Position; }
                    if( sCriterion == "ItmObjAttrPlace" ) { sSetting = this.oCmpOptions.ItmObjDefinitions.Occurrences.AttrPlace; }
                    if( sCriterion == "ItmCxnDefinitions" ) { sSetting = this.oCmpOptions.ItmCxnDefinitions.Checked; }
                    if( sCriterion == "ItmCxnAttributes" ) { sSetting = this.oCmpOptions.ItmCxnDefinitions.Attributes; }
                    if( sCriterion == "ItmCxnOccurrences" )  { sSetting = this.oCmpOptions.ItmCxnDefinitions.Occurrences.Checked; }
                    if( sCriterion == "ItmCxnAppearance" ) { sSetting = this.oCmpOptions.ItmCxnDefinitions.Occurrences.Appearance; }
                    if( sCriterion == "ItmCxnPosition" ) { sSetting = this.oCmpOptions.ItmCxnDefinitions.Occurrences.Position; }
                    if( sCriterion == "ItmCxnAttrPlace" ) { sSetting = this.oCmpOptions.ItmCxnDefinitions.Occurrences.AttrPlace; }
                    
                    nResult     = getResult(eval( "this.oCmpStatistics." + sCriterion), sCriterion );
                    sSetting    = (sSetting == true)?getString("TEXT_OPTION_YES"):getString("TEXT_OPTION_NO");
                }
                
                p_Output.TableRow( );// Comparison Criterion
                    addCell( p_Output, [1,1,1,1], sText, 35, "TEXT_STYLE_BOLD" );
                    addCell( p_Output, [1,1,1,1], sSetting, 20, "TEXT_STYLE_DEFAULT" );
                    addCell( p_Output, [1,1,1,1], nResult, 20, "TEXT_STYLE_DEFAULT" );
                    addCell( p_Output, [0,0,0,0], "", 25, "TEXT_STYLE_TRANSPARENT" );
            }
        }//END::outputStatistics()
        
        function getResult(result, sCriterion) {
            if( sCriterion == "ItmObjDefinitions" ||
                sCriterion == "ItmObjOccurrences" ||
                sCriterion == "ItmCxnDefinitions" || 
                sCriterion == "ItmCxnOccurrences" )  {
                // result is an array
                result = ArisData.Unique(result);
                return result.length;
                
            } else {
                // result is a number
                return result;
            }
        }
        
    }//END::__usertype_tComparisonSet()
    
    __cl_SubElement		= function( oObj, oSubObj, sName, bSubChange, nDiffType, nDiffKind, pDiffDetails, pValue ){
		this.oObj			= oObj;
        this.oSubObj    	= oSubObj;
		this.sName			= sName;
		this.bSubChange	    = false;
		this.nDiffType		= nDiffType;
        this.nDiffKind		= nDiffKind;
		this.sDiffDetails	= pDiffDetails;
        this.sValue			= pValue;
    }//END::__cl_SubElement
    
    __cl_MainElement		= function( oRefObj, sName, bSubChange, nType, nDiffType, nDiffKind, pDiffDetails, aElements ){
        this.oRefObj		= oRefObj;
		this.sName			= sName;
		this.bSubChange	    = false;
		this.nType			= nType;
		this.nDiffType		= nDiffType;
        this.nDiffKind		= nDiffKind;
		this.sDiffDetails	= pDiffDetails;
        this.aElements		= aElements;// Array of objects of type __cl_SubElement (comparison right side elements)
    }
    
    __usertype_tMsgInput = function() {
        this.nsymboltype = -1;
        this.ncxntype = -1;
        this.nattrtype = -1;
        this.saction = "";
        this.omodel = null;
        this.omodeltocompare = null;
        this.oobjdef = null;
        this.oobjdeftocompare = null;
        this.oattr = null;
        this.oattrtocompare = null;
        this.ocxndef = null;
        this.ocxndeftocompare = null;
        this.otranscxn = null;
        this.otranscxntocompare = null;
    }    
    
    __usertype_tSummaryEntry = function(stext, slink, saction) {
        this.stext = stext;
        this.slink = slink;
        this.saction = saction;
    }

    __usertype_tConditions = function( nsymboltype, ncxntype, nattrtype, saction, smsgtext ){
        this.nsymboltype = nsymboltype;
        this.ncxntype = ncxntype;
        this.nattrtype = nattrtype;
        this.saction = saction;
        this.smsgtext = smsgtext;
    }

// END::Globals------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------------------------------------
// MAIN part---------------------------------------------------------------------------------------
    var bPrintOut = true;   // Printout documents
    var aDBsToClose = new Array()       // BLUE-9288 	
    
    // Set output options
    Context.setProperty( Constants.PROPERTY_SHOW_OUTPUT_FILE, true );
    Context.setProperty( Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false );

    if (isStartedByDesigner()) {
        var oRefModel = getModelByProps("firstModelGuid","firstRevision", "firstDatabaseName", "firstFilter", "firstLocale");   // BLUE-9288, BLUE-12277
        var oCompModel = getModelByProps("secondModelGuid", "secondRevision", "secondDatabaseName", "secondFilter", "secondLocale");   // BLUE-9288, BLUE-12277

        var oComparisionSet = new __usertype_tComparisonSet( );
        var oUsrSettings = new cl_UISettings(oRefModel, [oRefModel, oCompModel]);
        oUsrSettings.CompModels = [oCompModel];
        oUsrSettings.getSettingsFromDesigner();
        
    } else {    // default
        var oComparisionSet = new __usertype_tComparisonSet( );
        var oUsrSettings    = new cl_UISettings( oComparisionSet.oRefModel, oComparisionSet.aModels );
            oUsrSettings.ReStoreUISettings( oComparisionSet );
            
        // Get User Options selection via Dialogs
        var nDlgResult  = displayUI( oUsrSettings, oComparisionSet );
        oUsrSettings.StoreUISettings( );
        // oComparisionSet.PullUsrSettings( oUsrSettings );
        
        if( nDlgResult != -1 ){// Dialog Cancelled - Do not create output report file
            if( nDlgResult == gn_errNoCmp ){
                Dialogs.MsgBox( getString("MSG_COMP_NOT_FOUND") );
            }
            if( nDlgResult == gn_errNoDB ){
                Dialogs.MsgBox( getString("MSG_DB_NOT_FOUND") );
            }
            Context.setProperty( Constants.PROPERTY_SHOW_OUTPUT_FILE, false );
            Context.setProperty( Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false );
            bPrintOut = false;
        }
    }
    // Printout documents
    if (bPrintOut) {
        oComparisionSet.getScope( oUsrSettings );
        oUsrSettings            = null;// Destroy oUsrSettings
        ga_Conditions           = getConditions();
        var aComparisonTable    = performComparision( oComparisionSet );// Perform comparision
        createDocument( oComparisionSet, aComparisonTable );// Write output report document
    }
    
    if (aDBsToClose.length > 0) { 	    // BLUE-9288
        for (var i= 0; i < aDBsToClose.length; i++) {
            aDBsToClose[i].close();
        }
    }   
// END::MAIN part----------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------------------------------------
// Functions part----------------------------------------------------------------------------------

function isStartedByDesigner() {
    var propFirstGuid = Context.getProperty("firstModelGuid");
    var propSecondGuid = Context.getProperty("secondModelGuid");
    var propFirstRev = Context.getProperty("firstRevision");
    var propSecondRev = Context.getProperty("secondRevision");
    
    if (propFirstGuid == null || propSecondGuid == null || propFirstRev == null || propSecondRev == null) return false;

    if (!ATSALL.isGuid(propFirstGuid)) return false;
    if (!ATSALL.isGuid(propSecondGuid)) return false;        
    if (isNaN(propFirstRev)) return false;
    if (isNaN(propSecondRev)) return false;        
        
    return true;
}

function getModelByProps(sPropGuid, sPropRev, sPropDB, sPropFilter, sPropLoc) {
    var sGuid       = Context.getProperty(sPropGuid);
    var nRev        = parseInt(Context.getProperty(sPropRev));
    var sDBName     = getDBName(sPropDB);
    var sFilterGuid = getFilterGuid(sPropFilter);
    var nLocaleID   = getLocaleId(sPropLoc);    
    
    var oDB = getCurrentDatabase();                             // BLUE-9288, BLUE-12277 	
    return oDB.FindGUID(sGuid, Constants.CID_MODEL);

    function getCurrentDatabase() {
        if (nRev > 0) {
            return ArisData.openDatabaseVersion(sDBName, sFilterGuid, nLocaleID, nRev, true/*p_bReadOnly*/);    // BLUE-12277 
        }
        if (isActiveDB()) {
            return ArisData.getActiveDatabase();
        }
        var oDB = ArisData.openDatabase(sDBName, sFilterGuid, nLocaleID, true/*p_bReadOnly*/);                  // BLUE-12277 
        if (oDB != null) {
            aDBsToClose.push(oDB);
            return oDB;
        }
        return ArisData.getActiveDatabase();   // fallback
        
        function isActiveDB() {
            var sActiveDBName = ArisData.getActiveDatabase().Name(gn_Lang);
            return (StrComp(sDBName, sActiveDBName) == 0);
        }
    }
    
    function getDBName(sPropDB) {
        var dBName = Context.getProperty(sPropDB);
        if (dBName != null) return dBName;
        return ArisData.getActiveDatabase().Name(gn_Lang);  // Former versions - property not set
    }
    
    function getFilterGuid(sPropFilter) {
        var filterGuid = Context.getProperty(sPropFilter);
        if (filterGuid != null && ATSALL.isGuid(filterGuid)) return filterGuid;
        return ArisData.ActiveFilter().GUID();              // Former versions - property not set
    }
    
    function getLocaleId(sPropLoc) {
        var locID   = Context.getProperty(sPropLoc);
        if (locID != null && !isNaN(locID)) return parseInt(locID);
        return gn_Lang;                                     // Former versions - property not set
    }   
}

function getAttrValue( p_Obj, p_attrTypeNum, p_Lang ){
    if( (p_Obj != null) && (p_Obj.IsValid()) ){
        var oObj    = (p_Obj.KindNum() == Constants.CID_OBJOCC)?p_Obj.ObjDef():p_Obj;
        var p_Attr  = oObj.Attribute( p_attrTypeNum, p_Lang, true );
        if( (p_Attr.IsValid() == false) || (p_Attr.IsMaintained() == false) ){
            return null;
        }
        var aOut    = [];
            aOut["NAME"]    = java.lang.String( p_Attr.Type() );
        switch( ArisData.ActiveFilter().AttrBaseType( p_Attr.TypeNum() ) ){
            case Constants.ABT_MULTILINE:
                aOut["VALUE"]   = java.lang.String( p_Attr.GetValue(false) );
                break;
            case Constants.ABT_BOOL:
                aOut["VALUE"]   =  java.lang.Boolean.parseBoolean( p_Attr.GetValue(false) );
                break;
            case Constants.ABT_VALUE:
                aOut["VALUE"]   =  p_Attr.getValue();
                break;
            case Constants.ABT_SINGLELINE:
                aOut["VALUE"]   =  java.lang.String( p_Attr.GetValue(true) );
                break;
            case Constants.ABT_INTEGER:
                aOut["VALUE"]   =  parseInt( p_Attr.GetValue(false) );
                break;
            case Constants.ABT_RANGEINTEGER:
                aOut["VALUE"]   =  parseInt( p_Attr.GetValue(false) );
                break;
            case Constants.ABT_FLOAT:
                aOut["VALUE"]   =  parseFloat( p_Attr.GetValue(false) );
                break;
            case Constants.ABT_RANGEFLOAT:
                aOut["VALUE"]   =  parseFloat( p_Attr.GetValue(false) );
                break;
            case Constants.ABT_DATE:
                aOut["VALUE"]   =  p_Attr.getValueStd();
                break;
            case Constants.ABT_TIME:
                aOut["VALUE"]   =  p_Attr.getValueStd();
                break;
            case Constants.ABT_TIMESTAMP:
                aOut["VALUE"]   =  p_Attr.getValueStd();
                break;
            case Constants.ABT_TIMESPAN:
                aOut["VALUE"]   =  p_Attr.getValueStd();
                break;
            case Constants.ABT_FILE:
                aOut["VALUE"]   =  p_Attr.MeasureValue(false);
                break;
            case Constants.ABT_FOREIGN_ID:
                aOut["VALUE"]   =  p_Attr.GetValue(false);
                break;
            case Constants.ABT_COMBINED:
                aOut["VALUE"]   =  p_Attr.getMeasureValueAsString();
                break;
            case Constants.ABT_ITEMTYPE:
                aOut["VALUE"]   =  p_Attr.GetValue(false);
                break;
            case Constants.ABT_LONGTEXT:
                aOut["VALUE"]   =  p_Attr.MeasureValue(false);
                break;
            case Constants.ABT_BITMAP:
                aOut["VALUE"]   =  p_Attr.MeasureValue();
                break;
            case Constants.ABT_BLOB:
                aOut["VALUE"]   =  p_Attr.MeasureValue();
                break;
        }//END::switch()
        return aOut;
    }
}//END::getAttrValue()

function sortFilterNames( oA, oB ){
    var sA  = java.lang.String( oA.getName() );
    var sB  = java.lang.String( oB.getName() );
    return sA.compareToIgnoreCase( sB );
}

function sortStrings( sA, sB ){
    var jA  = java.lang.String(sA);
    var jB  = java.lang.String(sB);
    return jA.compareToIgnoreCase( jB );
}

function sortLangNames( oLA, oLB ){
    var sA  = java.lang.String( oLA.Name( gn_Lang ) );
    var sB  = java.lang.String( oLB.Name( gn_Lang ) );
    return sA.compareToIgnoreCase( sB );
}

function sortAttrNames( nNum1, nNum2 ){
    var sName1   = java.lang.String( ArisData.ActiveFilter().AttrTypeName( nNum1 ) );
    var sName2   = java.lang.String( ArisData.ActiveFilter().AttrTypeName( nNum2 ) );
    return sName1.compareToIgnoreCase( sName2 );
}

function sortChListID( oA, oB ){
    var nA  = oA.getID();
    var nB  = oB.getID();
    if( nA < nB ) return -1;
    if( nA > nB ) return 1;
    return 0;
}

function getAttrStrValue(p_objDef, p_attrTypeNum ){
    if( (p_objDef == null) || (!p_objDef.IsValid()) ){ return gs_Empty; }
    
    var oObj    = ((p_objDef.IsValid()) && (p_objDef.KindNum() == Constants.CID_OBJOCC) )?p_objDef.ObjDef():p_objDef;
    var attr    = oObj.Attribute(p_attrTypeNum, gn_Lang, true);
    
    if(!attr.IsValid() ){ return gs_Empty; }
    
    return java.lang.String( attr.GetValue(true) );
}//END::getAttrStrValue()


function getModelVersions( oModel ){
    var compVersioning = Context.getComponent("Versioning");
    if (compVersioning == null) return null;
    
    if( (oModel == null) || (!oModel.IsValid()) ) return null;
    
    var aModelVer = compVersioning.getModelRevisions( oModel );
    if (aModelVer.length == 0) { return null; }
    
    return aModelVer;
}//END::getModelRevisions()


function getProfileBool(sSection, sField, bDefault) {
    return (Context.getProfileInt(sSection, sField, bDefault?1:0) == 1);
}//END::getProfileBool()


function writeProfileBool(sSection, sField, bSet) {
    Context.writeProfileInt(sSection, sField, bSet?1:0);
}//END::writeProfileBool()


function isUserInDB( pCurrUser, pDBName ){
    try {
        var oDB = ArisData.openDatabase( pDBName, true );// OpenDB
    }catch(e) {
        // BLUE-4104
        return false;
    }    
    var aUserList   = oDB.UserList();
    for( var i=0; i<aUserList.length; i++ ){
        if( aUserList[i].Name( gn_Lang, true ).compareToIgnoreCase( pCurrUser ) == 0 ){
            oDB.close();
            return true;
        }
    }//END::for_i
    oDB.close();
    return false;
}


function createModelNames( aMods ){
    var aOut    = new Array();

    if( aMods != null ){
        for(var i=0; i<aMods.length; i++ ){
            aOut[i] = getModelName(aMods[i], gn_Lang);
        }//END::for_i
    }
    
    return aOut; 
}//END::createModelNames()


function transformModArrayToGUID( aMods ){
    var sOut    = gs_Empty;

    if( aMods != null ){
        for(var i=0; i<aMods.length; i++ ){
            if( aMods[i] != null ){
                sOut    = sOut.concat( aMods[i].GUID() );
                if( i< (aMods.length - 1) ){
                    sOut    = sOut.concat( ";" );
                }
            }
        }//END::for_i
    }
    
    return sOut;
}//END::transformModArrayToGUID()


function transformGUIDToModArray( oDB, sMods ){
    var aOut    = new Array();
    
    if( (oDB != null) && (sMods != null) ){
        var aMods   = sMods.split( ";" );
    
        for(var i=0; i<aMods.length; i++ ){
            var oMod    = oDB.FindGUID( aMods[i], Constants.CID_MODEL );
            if( (oMod != null) && (oMod.IsValid()) ){
                aOut.push( oMod );
            }
        }//END::for_i
    }

    if( (aOut != null) && (aOut.length > 0) ){
        return aOut;
    }

    return null;
}//END::transformGUIDToModArray()


function transformObjToGUID( oObj ){
    var sOut    = gs_Empty;
    if( (oObj != null) && (oObj.IsValid) ){
        sOut    = sOut.concat( oObj.GUID() );
    }
    return sOut;
}//END::transformObjToGUID()


function transformGUIDToObj( oDB, sObj, oCID ){
    if( (oDB != null) && (sObj != null) && (sObj.length() > 0) ){
        var oObj    = oDB.FindGUID( sObj, oCID );
        if( (oObj != null) && (oObj.IsValid()) ){
            return oObj;
        }
    }
    
    return null;
}//END::transformGUIDToObj()


function transformStringToArray( sStr ){
    var aOut    = new Array();
    
    if( (sStr != null ) && (sStr.length() > 0) ){
        aOut    = sStr.split( ";" );
    }
    
    if( (aOut != null) && (aOut.length > 0) ){
        return aOut;
    }

    return null;
}//END::transformStringToArray()


function transformArrayToString( aArray ){
    var sOut    = gs_Empty;
    if( (aArray != null) && (aArray.length > 0) ){
        for( var i=0; i<aArray.length; i++ ){
            sOut    = sOut.concat( aArray[i] );
            if( i < (aArray.length - 1) ) { sOut    = sOut.concat( ";" ); }
        }//END::for_i
    }
    return sOut;
}//END::transformArrayToString()


function transformOIDToModArray( oDB, sModels ){
    var aOut    = new Array();
    
    if( (oDB != null) && (sModels != null) ){
        var aModels   = sModels.split( ";" );
    
        for(var i=0; i<aModels.length; i++ ){
            var oModel  = oDB.FindOID( aModels[i] );
            if( (oModel != null) && (oModel.IsValid()) && (oModel.KindNum() == Constants.CID_MODEL ) ){
                aOut.push( oModel );
            }
        }//END::for_i
    }

    if( (aOut != null) && (aOut.length > 0) ){
        return aOut;
    }

    return null;
}

function tryLoginToDB( oUsrSettings, p_bReadOnly ){
    if (!gb_showDlg100) {
        // BLUE-4104
        oUsrSettings.CompDB = ArisData.openDatabase ( oUsrSettings.P11DBName, oUsrSettings.P10Login, oUsrSettings.P10Passwd, gs_Filter, gn_Lang, p_bReadOnly );
        if( oUsrSettings.CompDB != null ) return -1;// Return -1 as beeing OK
        return gn_errLogin;
    } 
    else {
        // oUsrSettings.CompDB = null;
        if( ( gs_Empty.compareToIgnoreCase( oUsrSettings.P11DBName ) != 0 ) &&
            ( gs_Empty.compareToIgnoreCase( oUsrSettings.P10Login ) != 0 ) &&
            ( gs_Empty.compareToIgnoreCase( oUsrSettings.P10Passwd ) != 0 ) &&
            ( oUsrSettings.P100Filter != null ) &&
            ( oUsrSettings.P100Lang != null ) &&
            ( (p_bReadOnly == true) || (p_bReadOnly == false) ) ){
            
            oUsrSettings.CompDB = ArisData.openDatabase ( oUsrSettings.P11DBName, oUsrSettings.P10Login, oUsrSettings.P10Passwd, oUsrSettings.P100Filter.getGUID(), oUsrSettings.P100Lang, p_bReadOnly );
        }
        
        if( oUsrSettings.CompDB != null ) return -1;// Return -1 as beeing OK
        return gn_errLogin;
    }
}

function getTableRowChecked( dialog, tabName, colNum, colRead ){
    var aOut        = new Array();
    if( (dialog != null) && (tabName != null) && (colNum != null) ){
        var tableName   = java.lang.String( tabName );
        if( tableName.length() > 0 ){
            var aTableValues    = dialog.getDlgListBoxArray( tableName );
            if( (aTableValues != null) && (aTableValues.length > 0) && (colNum > 0) && ((colNum <= aTableValues.length)) ){
                var nRows   = parseInt( aTableValues.length/ colNum );
                if( (colRead != null) && (colRead >= 0) && (colRead < parseInt(aTableValues.length/nRows)) ){
                    for( var i=0; i<nRows; i++ ){
                        if( (aTableValues[(i*colNum+colRead)] == 1) ){
                            return true;
                        }
                    }//END::for_i
                }
            }
        }
    }
    return false;
}

function setTableAllChecked( dialog, tabName, colNum, colRead, bChecked ){
    var aOut        = new Array();
    if( (dialog != null) && (tabName != null) && (colNum != null) ){
        var tableName   = java.lang.String( tabName );
        if( tableName.length() > 0 ){
            var aTableValues    = dialog.getDlgListBoxArray( tableName );
            if( (aTableValues != null) && (aTableValues.length > 0) && (colNum > 0) && ((colNum <= aTableValues.length)) ){
                var nRows   = parseInt( aTableValues.length/ colNum );
                if( (colRead != null) && (colRead >= 0) && (colRead < parseInt(aTableValues.length/nRows)) && (bChecked == true || bChecked == false) ){
                    for( var i=0; i<nRows; i++ ){
                        aTableValues[(i*colNum+colRead)]    = (bChecked == true)?1:0;
                    }//END::for_i
                    dialog.setDlgListBoxArray( tableName, aTableValues );
                    return true;
                }
            }
        }
    }
    return false;
}

function getWorkspaceModel( oDB, currModel) {   // AGA-4461
    var workspaceDB = ArisData.openDatabaseVersion( oDB.Name(gn_Lang), -1);
    
    var specifiedModel  = workspaceDB.FindGUID( currModel.GUID(), Constants.CID_MODEL );
    if(specifiedModel.IsValid()) {
        return [specifiedModel];
    }
    return gn_errNoCmp;
}

function getCurrentModelVersion( oDB, currModel) {  // AGA-4461
    var maxVersionID = 0;
    var modelVersions = getModelVersions(currModel);
    for (var i = 0; i < modelVersions.length; i++) {
        maxVersionID = Math.max(maxVersionID, modelVersions[i].getChangeListInfo().getID());
    }
    if (maxVersionID > 0) {
        var specifiedRevisionDB = ArisData.openDatabaseVersion( oDB.Name(gn_Lang), maxVersionID );
        if( specifiedRevisionDB != null ){
            var specifiedModel  = specifiedRevisionDB.FindGUID( currModel.GUID(), Constants.CID_MODEL );
            if(specifiedModel.IsValid()) {
                return [specifiedModel];
            }
        }
    }
    return gn_errNoCmp;
}

function getModelSpecialRevisions( oDB, currModel, aVersions ){
    var aOut    = new Array();
    
    if( (oDB != null) && (aVersions != null) && (aVersions.length > 0) ){
        for( var i=0; i<aVersions.length; i++ ){
            var specifiedRevisionDB = ArisData.openDatabaseVersion( oDB.Name(gn_Lang), aVersions[i] );
            if( specifiedRevisionDB == null ){
                return gn_errNoDB;
            }

            var specifiedModel  = specifiedRevisionDB.FindGUID( currModel.GUID(), Constants.CID_MODEL );
            if( !specifiedModel.IsValid() ){
                return gn_errNoCmp;
            }
            if( specifiedModel.IsValid() ){
                aOut.push( specifiedModel );
            }
        }//END::for_i
    }

    return aOut;
}


function getConditions() {
    var aConditions = new Array();
    var fileData = Context.getFile("ModelComparison.xml", Constants.LOCATION_SCRIPT);
    var xmlReader = Context.getXMLParser(fileData);
    if (xmlReader.isValid()) {
        var xmlRoot = xmlReader.getRootElement();

        var xmlConditionList = xmlRoot.getChildren(c_xmlCondition);
        var iterCond = xmlConditionList.iterator();
        while (iterCond.hasNext()) {
            var xmlCondition = iterCond.next();
            
            var nsymboltype = getXmlAttrValue_TypeNum(xmlCondition, c_xmlSymbolType, Constants.CID_OBJOCC);
            var ncxntype    = getXmlAttrValue_TypeNum(xmlCondition, c_xmlCxnType, Constants.CID_CXNOCC);
            var nattrtype   = getXmlAttrValue_TypeNum(xmlCondition, c_xmlAttrType, Constants.CID_ATTRDEF);

            var xmlActionList = xmlCondition.getChildren(c_xmlAction);
            var iterAction = xmlActionList.iterator();
            while (iterAction.hasNext()) {
                var xmlAction = iterAction.next();

                var saction = getXmlAttrValue(xmlAction, c_xmlType);
                var smsgtext = getXmlAttrValue(xmlAction, c_xmlMsgText);
                
                aConditions.push(new __usertype_tConditions(nsymboltype, ncxntype, nattrtype, saction, smsgtext));
            }        
        }        
    }
    return aConditions;
    
    function getXmlAttrValue(xmlElement, sAttrName) {
        var xmlAttr = xmlElement.getAttribute(sAttrName)
        if (xmlAttr != null) return "" + xmlAttr.getValue();
        return "";
    }    
    
    function getXmlAttrValue_TypeNum(xmlElement, sAttrName, nKindNum) {
        var xmlAttr = xmlElement.getAttribute(sAttrName)
        if (xmlAttr != null) return  getTypeNum(xmlAttr.getValue(), nKindNum);
        return -1;
    }
    
    function getTypeNum(p_typeNum, p_kindNum) {
        if (String(p_typeNum).length == 0) return -1;
        
        var nTypeNum = p_typeNum;
        
        if (isNaN(p_typeNum)) {
            if (ATSALL.isGuid(p_typeNum)) {
                // userdefined attribute/model/symbol type number
                try {
                    if (p_kindNum == Constants.CID_ATTRDEF) return ArisData.ActiveFilter().UserDefinedAttributeTypeNum(p_typeNum);  
                    if (p_kindNum == Constants.CID_MODEL)  return ArisData.ActiveFilter().UserDefinedModelTypeNum(p_typeNum);
                    if (p_kindNum == Constants.CID_OBJOCC)  return ArisData.ActiveFilter().UserDefinedSymbolTypeNum(p_typeNum);
                } catch(e) {
                    return -1;
                }
                return -1;
            }
            nTypeNum = Constants[p_typeNum];
            if (typeof(nTypeNum) == "undefined" || isNaN(nTypeNum)) {
                return -1;
            }
        }
        return parseInt(nTypeNum);
    }
}


function getConditionMsgText(tMsgInput) {
    for (var i = 0; i < ga_Conditions.length; i++) {
        if (ga_Conditions[i].nsymboltype == tMsgInput.nsymboltype && 
            ga_Conditions[i].ncxntype == tMsgInput.ncxntype && 
            ga_Conditions[i].nattrtype == tMsgInput.nattrtype &&
            StrComp(ga_Conditions[i].saction, tMsgInput.saction) == 0) {
                
                return buildMsgText(ga_Conditions[i].smsgtext, tMsgInput);
        }
    }    
    if (tMsgInput.nattrtype > 0 && tMsgInput.ncxntype > 0) {
        if (StrComp(tMsgInput.saction, gs_Created) == 0) return buildMsgText(c_sDefaultText_CxnType_AttrTypeCreated, tMsgInput);
        if (StrComp(tMsgInput.saction, gs_Updated) == 0) return buildMsgText(c_sDefaultText_CxnType_AttrTypeUpdated, tMsgInput);
        if (StrComp(tMsgInput.saction, gs_Deleted) == 0) return buildMsgText(c_sDefaultText_CxnType_AttrTypeDeleted, tMsgInput);
    }
    if (tMsgInput.nattrtype > 0) {
        if (StrComp(tMsgInput.saction, gs_Created) == 0) return buildMsgText(c_sDefaultText_AttrTypeCreated, tMsgInput);
        if (StrComp(tMsgInput.saction, gs_Updated) == 0) return buildMsgText(c_sDefaultText_AttrTypeUpdated, tMsgInput);
        if (StrComp(tMsgInput.saction, gs_Deleted) == 0) return buildMsgText(c_sDefaultText_AttrTypeDeleted, tMsgInput);
    }
    if (tMsgInput.ncxntype > 0) {
        if (StrComp(tMsgInput.saction, gs_Created) == 0) return buildMsgText(c_sDefaultText_CxnTypeCreated, tMsgInput);
        if (StrComp(tMsgInput.saction, gs_Updated) == 0) return buildMsgText(c_sDefaultText_CxnTypeUpdated, tMsgInput);
        if (StrComp(tMsgInput.saction, gs_Deleted) == 0) return buildMsgText(c_sDefaultText_CxnTypeDeleted, tMsgInput);
    }
    if (tMsgInput.nsymboltype > 0) {        
        if (StrComp(tMsgInput.saction, gs_Created) == 0) return buildMsgText(c_sDefaultText_SymbolTypeCreated, tMsgInput);
        if (StrComp(tMsgInput.saction, gs_Updated) == 0) return buildMsgText(c_sDefaultText_SymbolTypeUpdated, tMsgInput);
        if (StrComp(tMsgInput.saction, gs_Deleted) == 0) return buildMsgText(c_sDefaultText_SymbolTypeDeleted, tMsgInput);
    }
    
    if (StrComp(tMsgInput.saction, gs_Created) == 0) return buildMsgText_Something(c_sDefaultText_SomethingCreated, tMsgInput);
    if (StrComp(tMsgInput.saction, gs_Updated) == 0) return buildMsgText_Something(c_sDefaultText_SomethingUpdated, tMsgInput);
    if (StrComp(tMsgInput.saction, gs_Deleted) == 0) return buildMsgText_Something(c_sDefaultText_SomethingDeleted, tMsgInput);

//    return "";

    function buildMsgText_Something(sMsgText, tMsgInput) {
        if (tMsgInput.omodel != null) {
            sMsgText = sMsgText.replace(/{model.reference.name}/g, getModelName(tMsgInput.omodel, gn_Lang));
        }
        if (tMsgInput.omodeltocompare != null) {
            sMsgText = sMsgText.replace(/{model.comparison.name}/g, getModelName(tMsgInput.omodeltocompare, gn_Lang));
        }
        
        var something = tMsgInput.oobjdef;
        if (something == null) something = tMsgInput.oobjdeftocompare;
        
        if (something != null && something.IsValid()) {
            switch( something.KindNum() ){
                case Constants.CID_GFXOBJ:
                    sMsgText = formatstring1(sMsgText, getString("TEXT_GRAPHIC_OBJECT"));
                    break;
                case Constants.CID_TEXTDEF:
                case Constants.CID_TEXTOCC:
                    sMsgText = formatstring1(sMsgText, getString("TEXT_FREE_FORM_TEXT"));
                    break;
                case Constants.CID_COMOBJDEF:
                case Constants.CID_COMOBJOCC:
                    sMsgText = formatstring1(sMsgText, getString("TEXT_OLE_OBJECT"));
                    break;
                default:
                    // BLUE-4616
                    sMsgText = formatstring1(sMsgText, getString("TEXT_ATTRIBUTE"));
            }
        }
        return sMsgText;
    }
    
    function buildMsgText(sMsgText, tMsgInput) {
        if (tMsgInput.omodel != null) {
            sMsgText = sMsgText.replace(/{model.reference.name}/g, getModelName(tMsgInput.omodel, gn_Lang));
            sMsgText = sMsgText.replace(/{model.type}/g, tMsgInput.omodel.Type());
        }
        if (tMsgInput.omodeltocompare != null) {
            sMsgText = sMsgText.replace(/{model.comparison.name}/g, getModelName(tMsgInput.omodeltocompare, gn_Lang));
            sMsgText = sMsgText.replace(/{model.type}/g, tMsgInput.omodeltocompare.Type());
        }
        if (tMsgInput.oobjdef != null) {
            sMsgText = sMsgText.replace(/{object.reference.name}/g, tMsgInput.oobjdef.Name(gn_Lang));
            sMsgText = sMsgText.replace(/{object.type}/g, tMsgInput.oobjdef.Type());
        }            
        if (tMsgInput.oobjdeftocompare != null) {
            sMsgText = sMsgText.replace(/{object.comparison.name}/g, tMsgInput.oobjdeftocompare.Name(gn_Lang));
            sMsgText = sMsgText.replace(/{object.type}/g, tMsgInput.oobjdeftocompare.Type());
        }
        if (tMsgInput.oattr != null) {
             sMsgText = sMsgText.replace(/{attribute.reference.value}/g, tMsgInput.oattr.GetValue(true));
             sMsgText = sMsgText.replace(/{attribute.type}/g, tMsgInput.oattr.Type());
        }
        if (tMsgInput.oattrtocompare != null) {
             sMsgText = sMsgText.replace(/{attribute.comparison.value}/g, tMsgInput.oattrtocompare.GetValue(true));
             sMsgText = sMsgText.replace(/{attribute.type}/g, tMsgInput.oattrtocompare.Type());
        }
        if (tMsgInput.ocxndef != null) {
             sMsgText = sMsgText.replace(/{cxn.reference.sourcename}/g, tMsgInput.ocxndef.SourceObjDef().Name(gn_Lang));
             sMsgText = sMsgText.replace(/{cxn.reference.targetname}/g, tMsgInput.ocxndef.TargetObjDef().Name(gn_Lang));             
             sMsgText = sMsgText.replace(/{cxn.type}/g, tMsgInput.ocxndef.ActiveType());
        }
        if (tMsgInput.ocxndeftocompare != null) {
             sMsgText = sMsgText.replace(/{cxn.comparison.sourcename}/g, tMsgInput.ocxndeftocompare.SourceObjDef().Name(gn_Lang));
             sMsgText = sMsgText.replace(/{cxn.comparison.targetname}/g, tMsgInput.ocxndeftocompare.TargetObjDef().Name(gn_Lang));             
             sMsgText = sMsgText.replace(/{cxn.type}/g, tMsgInput.ocxndeftocompare.ActiveType());
        }
        return sMsgText;
    }
}


function isAttributeToIgnore( oAttr ){
    if (isNoAttribute(oAttr)) {
        // BLUE 24271 - Maybe this meanwhile is a CxnDef/CxnOcc - not to be hanled here
        return true
    }
    var nTypeNum    = oAttr.TypeNum();
    if( ArisData.ActiveFilter().AttrProperties( nTypeNum )& 1){
        return false;// Attribute is visible - so not hidden - Will NOT BE ignored
    }
    return true;// Attribute is hidden - WILL BE ignored
    
    function isNoAttribute(oAttr) {
        return (oAttr.KindNum()!= Constants.CID_ATTROCC && oAttr.KindNum()!= Constants.CID_ATTRDEF);
    }
}


function doCheck( aItems ){
    var nCount  = 0;
    for( var i=0; i<aItems.length; i++ ){
        if( aItems[i] != null ) nCount++;
        if( nCount >= 2 ) return true;
    }// END::for_i
    return false;
}


function getNullArray() {
    var aNullArray  = new Array();
    for( var i=0; i<gn_ModelCount; i++ ){
        aNullArray[i]   = null;
    }//END::for_i
    return aNullArray;
}

function setComparisonOptions( oComparisionSet ){
    var oCmpOptions = oComparisionSet.oRefModel.createEmptyComparisonOptions();
    var oOptions    = oComparisionSet.oCmpOptions;
    
    oCmpOptions.setItemExistingOnlyInFirstModel( oOptions.CmpExistFirstMod );
    oCmpOptions.setItemExistingOnlyInSecondModel( oOptions.CmpExistSecondMod );
    oCmpOptions.setModifiedItemsExistingInBothModel( oOptions.CmpChangeBothMod );

    oCmpOptions.setModelProperties( oOptions.ItmModProperties );

    oCmpOptions.setObjectDefinition( oOptions.ItmObjDefinitions.Checked );
    oCmpOptions.setObjectAttributes( oOptions.ItmObjDefinitions.Attributes );
    oCmpOptions.setObjectSystemAttributes( oOptions.ItmObjDefinitions.SystemAttributes );
    oCmpOptions.setObjectOccurrences( oOptions.ItmObjDefinitions.Occurrences.Checked );
    oCmpOptions.setObjectAppearence( oOptions.ItmObjDefinitions.Occurrences.Appearance );
    oCmpOptions.setObjectPositionSize( oOptions.ItmObjDefinitions.Occurrences.Position );
    oCmpOptions.setObjectAttributePlacements( oOptions.ItmObjDefinitions.Occurrences.AttrPlace );
    
    oCmpOptions.setConnectionDefinition( oOptions.ItmCxnDefinitions.Checked );
    oCmpOptions.setConnectionAttributes( oOptions.ItmCxnDefinitions.Attributes );
    oCmpOptions.setConnectionOccurrences( oOptions.ItmCxnDefinitions.Occurrences.Checked );
    oCmpOptions.setConnectionAppearences( oOptions.ItmCxnDefinitions.Occurrences.Appearance );
    oCmpOptions.setConnectionPoints( oOptions.ItmCxnDefinitions.Occurrences.Position );
    oCmpOptions.setConnectionAttributePlacements( oOptions.ItmCxnDefinitions.Occurrences.AttrPlace );

    oCmpOptions.setGfxObjects( oOptions.ItmGraphicObjects );
    oCmpOptions.setOleObjects( oOptions.ItmOLEObjects );
    oCmpOptions.setFreeformtTexts( oOptions.ItmFreeText );
    
    if (oOptions.AddIdenticalAttr) {
        oCmpOptions.setIdentifyElementsByAttribute(parseInt(oOptions.AddAttrNumber), oOptions.AddMatchCase, oOptions.AddLineBreaksSpaces)
    } else {
        oCmpOptions.setIdentifyElementsNotByAttribute();
    }
    oCmpOptions.setMasterVariantModelComparison ( oOptions.MasterVariantComp );
    return oCmpOptions;
}

function performComparision( oComparisionSet ){
    var aComparisonTable    = new Array();

    if( (oComparisionSet.oRefModel != null) && (oComparisionSet.aCompModels != null) && (gn_ModelCount > 0) ){
        var oCmpOptions         = setComparisonOptions( oComparisionSet );

        for( var i=0; i<gn_ModelCount; i++){
            var oCmpDifferences = oComparisionSet.oRefModel.compareModel( oComparisionSet.aCompModels[i], gn_Lang, oCmpOptions );
            parseComparisonDifferences( oCmpDifferences, aComparisonTable, oComparisionSet, i+1 );
            if( i==0 ){
                ga_ModelGraphic.push( oCmpDifferences.getFirstModelGraphic( true, false, gn_Lang ) );
            }
            ga_ModelGraphic.push( oCmpDifferences.getSecondModelGraphic( true, false, gn_Lang ) );
        }// END::for_i
    }

    return aComparisonTable.sort( sortByRefName );
    
    function parseComparisonDifferences( oCmpDifferences,  aComparisonTable, oComparisionSet, colIndex ){
        var aDifferences    = oCmpDifferences.getDifferences();
        for( var i=0; i<aDifferences.length; i++ ){
            var oDifference = aDifferences[i];
            
            var oExistingElement = oDifference.getExistingElement();            // AGA-5835
            if (oExistingElement == null || !oExistingElement.IsValid() ) {
                continue;
            }
            if( checkIncluded( oDifference ) ){
                var rowIndex    = getTableRow( oDifference, aComparisonTable, oComparisionSet, colIndex );
                if( aComparisonTable[ rowIndex ].aElements[ colIndex ] == null ){
                    aComparisonTable[ rowIndex ].aElements[ colIndex ]  = setRightSubDifference( oDifference, oComparisionSet, colIndex );
                }
            }
        }// END::for_i
    }
    
    function getTableRow( oDifference, aComparisonTable, oComparisionSet, colIndex ){
        for( var i=0; i<aComparisonTable.length; i++ ){
            for( var j=0; j<colIndex; j++ ){
                if( !doCheck( aComparisonTable[ i ].aElements ) ) break;
                // BLUE-11401 - Obsolete call of function 'isEqual' removed here
            }// END::for_j
        }// END::for_i

        aComparisonTable.push( setMainDifference( oDifference, oComparisionSet ) );
        var rIndex  = aComparisonTable.length - 1;
        aComparisonTable[ rIndex ].aElements[ 0 ]  = setSubDifference( oDifference, oComparisionSet, colIndex );
        
        return rIndex;
    }
    
    function isElementItem(oElement) {
        if (oElement != null) {
            switch (oElement.KindNum()) {        
                case Constants.CID_MODEL:
                case Constants.CID_OBJDEF:
                case Constants.CID_CXNDEF:
                //case Constants.CID_COMOBJDEF:
                case Constants.CID_TEXTDEF:
                    return true;
            }
        }
        return false;
    }
    
    function getElementItem(oElement) {
        if (oElement != null) {
            if (isElementItem(oElement)) return oElement;
            switch (oElement.KindNum()) {        
                case Constants.CID_OBJOCC:
                    return oElement.ObjDef();
                case Constants.CID_CXNOCC:
                    return oElement.CxnDef();
                case Constants.CID_TEXTOCC:
                    return oElement.TextDef();
            }
        }
        return null; // (CID_COMOBJDEF,) CID_COMOBJOCC, CID_GFXOBJ
    }
       
    function getSubElementValue(Flag, oDifference) {
        var oSubElement = getRightLeftSubElement( null, oDifference);
        if (oSubElement != null && oSubElement.IsValid() && oSubElement.KindNum() == Constants.CID_ATTRDEF) {
            var oElementItem = getElementItem(getRightLeftElement( Flag, oDifference));
            if (oElementItem != null) {
                var nAttrTypeNum = oSubElement.TypeNum();   // SubElement is always attribute (def or occ)
                if (nAttrTypeNum!= null) {

                    return oElementItem.Attribute(nAttrTypeNum, gn_Lang).getValue();
                }
            }
        }
        if (Flag != null) {
            return (Flag == "LEFT") ? oDifference.getValueDescriptionLeft() : oDifference.getValueDescriptionRight();
        }
        return oDifference.getValueDescriptionLeft();
    }
    
    function setSubDifference( oDifference, oComparisionSet, colIndex ){// Create Referrence element for aElements array for 0-position
        var oElement    = new __cl_SubElement( getRightLeftElement( "LEFT", oDifference), getRightLeftSubElement( null, oDifference), oDifference.getElementDescriptionLeft(),oDifference.isSubElementChanged(), oDifference.getDifferenceType(), oDifference.getDifferenceKind(), oDifference.getDifferenceDescription(), getSubElementValue("LEFT", oDifference) );
        return oElement;
    }

    function setRightSubDifference( oDifference, oComparisionSet, colIndex ){// Create elements for aElements array
        var oElement    = new __cl_SubElement( getRightLeftElement( "RIGHT", oDifference), getRightLeftSubElement( "RIGHT", oDifference), oDifference.getElementDescriptionRight(),oDifference.isSubElementChanged(), oDifference.getDifferenceType(), oDifference.getDifferenceKind(), oDifference.getDifferenceDescription(), getSubElementValue("RIGHT", oDifference) );
        oComparisionSet.oCmpStatistics.Set( oDifference );
        var msgInput    = createMsgInput( oDifference, oComparisionSet, colIndex );
        ga_Summary.push( new __usertype_tSummaryEntry( getConditionMsgText(msgInput), "", msgInput.saction ) );
        return oElement;
    }

    function setLeftSubDifference( oDifference, oComparisionSet, colIndex ){// Create Referrence element for aElements array for 0-position
        var oElement    = new __cl_SubElement( getRightLeftElement( "LEFT", oDifference), getRightLeftSubElement( "LEFT", oDifference), oDifference.getElementDescriptionLeft(),oDifference.isSubElementChanged(), oDifference.getDifferenceType(), oDifference.getDifferenceKind(), oDifference.getDifferenceDescription(), getSubElementValue("LEFT", oDifference) );
        //oComparisionSet.oCmpStatistics.Set( oDifference );
        //var msgInput    = createMsgInput( oDifference, oComparisionSet, colIndex );
        //ga_Summary.push( new __usertype_tSummaryEntry( getConditionMsgText(msgInput), "", msgInput.saction ) );
        return oElement;
    }

    function setMainDifference( oDifference, oComparisionSet ){// Create elements for aComparisonTable
        var sName = oDifference.getElementDescriptionLeft();
        if (sName == "") sName = oDifference.getElementDescription();
        var oElement    = new __cl_MainElement( oDifference.getExistingElement(), sName, oDifference.isSubElementChanged(), oDifference.getElementType(), oDifference.getDifferenceType(), oDifference.getDifferenceKind(), oDifference.getDifferenceDescription(), getNullArray() );
            //oComparisionSet.oCmpStatistics.Set( oDifference );
        return oElement;
    }
    
    function getRightLeftElement( Flag, oDifference){
        if( (Flag != null) && (Flag == "LEFT") ){
            return oDifference.getLeft();
        }
        if( (Flag != null) && (Flag == "RIGHT") ){
            return oDifference.getRight();
        }
        return oDifference.getExistingElement();
    }
    
    function getRightLeftSubElement( Flag, oDifference ){
        if( (Flag != null) && (Flag == "LEFT") ){
            return oDifference.getSubElementLeft();
        }
        if( (Flag != null) && (Flag == "RIGHT") ){
            return oDifference.getSubElementRight();
        }
        if( oDifference.getSubElementLeft() == null ){
            return oDifference.getSubElementRight();
        }
        return oDifference.getSubElementLeft();
    }

    function checkIncluded( oDifference ){
        switch( oDifference.getDifferenceType() ){// Get Existence OR Difference
            case Constants.MODCOMP_DIFF_LEFTONLY:// Existence
            case Constants.MODCOMP_DIFF_RIGHTONLY:// Existence
                break;
            case Constants.MODCOMP_DIFF_BOTH:// Difference
                if( oDifference.isSubElementChanged() ){// Get Difference in Attribute 
                    var oAttr   = getRightLeftSubElement( null, oDifference );
                    if( oAttr != null && oAttr.IsValid()){// Change after method KindNum() available for attributes: if( (oAttr != null) && ( (oAttr.KindNum == Constants.CID_ATTRDEF) || (oAttr.KindNum == Constants.CID_ATTROCC) ) ){
                        return !( isAttributeToIgnore( getRightLeftSubElement( null, oDifference ) ) );
                    }
                } else {// Get Difference in Existence, appearance, size, position,...
                    switch( oDifference.getExistingElement().KindNum() ){
                        case Constants.CID_OBJDEF:
                        case Constants.CID_OBJOCC:
                            break;
                        case Constants.CID_CXNDEF:
                        case Constants.CID_CXNOCC:
                            break;
                        case Constants.CID_COMOBJDEF:
                        case Constants.CID_COMOBJOCC:
                            break;
                        case Constants.CID_TEXTDEF:
                        case Constants.CID_TEXTOCC:
                            break;
                        case Constants.CID_GFXOBJ:
                            break;
                    }// END::switch_KindNum
                }
                break;
        }// END::switch_getDifferenceType
        return true;
    }
    
    function sortByRefName( a, b ){
        return StrComp( a.sName , b.sName );
    }
    
    function createMsgInput( oDifference, oComparisionSet, colIndex ){
        var oObj        = getRightLeftElement( null, oDifference );
        var msgInput    = new __usertype_tMsgInput();
        
        // default
        var elemRef     = oDifference.getLeft();
        var elemCmp     = oDifference.getRight();
        var subelemRef  = oDifference.getSubElementLeft();
        var subelemCmp  = oDifference.getSubElementRight();
        
        var modelRef    = oComparisionSet.oRefModel;
        var modelCmp    = oComparisionSet.aCompModels[(colIndex-1)];
        
        if ( (oComparisionSet.nModCompare == 0) && doChangeReference(modelRef, modelCmp) ) {
            // BLUE-7507 Comparison of versioned models must be relative to the (older) version
            elemRef     = oDifference.getRight();
            elemCmp     = oDifference.getLeft();
            subelemRef  = oDifference.getSubElementRight();
            subelemCmp  = oDifference.getSubElementLeft();
            
            modelRef    = oComparisionSet.aCompModels[(colIndex-1)];
            modelCmp    = oComparisionSet.oRefModel;
        }
        
        msgInput.nsymboltype        = getSymbolNum( oDifference, oComparisionSet.aCompModels[(colIndex-1)] );
        msgInput.omodel             = modelRef;
        msgInput.omodeltocompare    = modelCmp;        

        if (isCxn(oDifference)) {
            // Anubis 541120
            msgInput.ocxndef            = getDefinition( elemRef );
            msgInput.ocxndeftocompare   = getDefinition( elemCmp );
            msgInput.ncxntype           = (msgInput.ocxndef != null) ? msgInput.ocxndef.TypeNum() : msgInput.ocxndeftocompare.TypeNum();
        } else {
            msgInput.oobjdef            = getDefinition( elemRef );
            msgInput.oobjdeftocompare   = getDefinition( elemCmp );
        }        
        switch( oDifference.getDifferenceType() ){// Get Existence OR Difference
            case Constants.MODCOMP_DIFF_LEFTONLY:
            case Constants.MODCOMP_DIFF_RIGHTONLY:
                msgInput.saction    = getAction( elemRef, elemCmp );
                break;
            case Constants.MODCOMP_DIFF_BOTH:// Difference
                if( oDifference.isSubElementChanged() ){//  Write Attribute difference message input
                    msgInput.saction    = getAction( subelemRef, subelemCmp );
                    var oAttr   = getRightLeftSubElement( null, oDifference );
                    if( (oAttr != null && oAttr.IsValid()) && ( isAttributeToIgnore( getRightLeftSubElement( null, oDifference ) ) == false) ){
                        msgInput.nattrtype      = (oAttr.KindNum() == Constants.CID_ATTROCC)?oAttr.AttrTypeNum():oAttr.TypeNum();                                    
                        msgInput.oattr          = subelemRef;
                        msgInput.oattrtocompare = subelemCmp;       // BLUE-11804
                    }
                } else {// Get Difference in Existence, appearance, size, position,...
                    msgInput.saction    = getAction( elemRef, elemCmp );
                }
                break;
        }// END::switch_getDifferenceType

        return msgInput;
        
        function isCxn(oDifference) {
            var oObject = oDifference.getLeft();
            if (oObject == null) oObject = oDifference.getRight();             
            
            if (oObject != null) {
                if (oObject.KindNum() == Constants.CID_CXNDEF || 
                    oObject.KindNum() == Constants.CID_CXNOCC) return true;
            }
            return false;
        }
        
        function doChangeReference(modelRef, modelCmp) {
            refVersion = modelRef.Database().getVersion();
            cmpVersion = modelCmp.Database().getVersion();
            
            if (cmpVersion == -1) return false;
            if (refVersion == -1) return true;
            
            return (refVersion > cmpVersion);
        }
    }
    
    function getAction( leftObject, rightObject ){
        if( leftObject == null && rightObject != null ) return gs_Created;
        if( leftObject != null && rightObject == null ) return gs_Deleted;
        return gs_Updated;
    }
    
    function getSymbolNum( oDifference, oCompModel ){
        var oObj    = (oDifference.isSubElementChanged() == true)?getRightLeftSubElement(null, oDifference):getRightLeftElement(null, oDifference );
        if( oObj != null && oObj.IsValid() ) {
            switch( oObj.KindNum() ){
                case Constants.CID_OBJDEF:  
                    var oOcc    = getOccOfDefinition( oObj, [oCompModel] );
                    return ( (oOcc != null)? oOcc.SymbolNum(): "");
                    break;
                case Constants.CID_OBJOCC:
                    return oObj.SymbolNum();
                    break;
            }// END::switch_KindNum
        }
        return "";
    }

    function getDefinition( oObj ){
        if( oObj != null && oObj.IsValid() ){
            switch( oObj.KindNum() ){
                case Constants.CID_ATTROCC:
                    return oObj.AttrDef( gn_Lang );
                    break;
                case Constants.CID_OBJOCC:
                    return oObj.ObjDef();
                    break;
                case Constants.CID_CXNOCC:
                    return oObj.CxnDef();
                    break;
            }// END::switch_KindNum
        }
        return oObj;
    }
    
    function getOccOfDefinition( oDef, aModels ){
        for( var i=0; i<aModels.length; i++ ){
            var oOccListInModel = oDef.OccListInModel( aModels[i] );
            if (oOccListInModel.length > 0) return oOccListInModel[0];
        }//END::for_i
        return null;
    }
    
}//END::performComparision()


function createDocument( oComparisionSet, aComparisonTable ){
    var outFile = Context.createOutputObject( Context.getSelectedFormat( ), Context.getSelectedFile( ) );
        outFile.Init( gn_Lang );

    defineStyles( outFile );
    createSummaryStatistics( outFile, oComparisionSet );
    createComparisonStatements( outFile );
    createDetailedOutput( outFile, oComparisionSet, aComparisonTable );
    createGraphicOutputPreparation( outFile, oComparisionSet );//prepares for createGraphicOutputUsingExcel
    outFile.WriteReport( );
    
    createGraphicOutputUsingExcel(outFile, Context.getSelectedFile(), oComparisionSet)
    
}//END::createDocument()

function resizePicture( p_Output, p_Pict, p_MaxSize ){
    var nPicWidth   = p_Pict.getWidth(Constants.SIZE_LOMETRIC) / 10 ;
    var nPicHeight  = p_Pict.getHeight(Constants.SIZE_LOMETRIC) / 10 ;
    var nDispWidth  = ( p_MaxSize[0] != "" )?p_MaxSize[0]:p_Output.GetPageWidth() - p_Output.GetLeftMargin() - p_Output.GetRightMargin();
    var nDispHeight = ( p_MaxSize[1] != "" )?p_MaxSize[1]:p_Output.GetPageHeight() - p_Output.GetTopMargin() - p_Output.GetBottomMargin() - 30;
    var aSize       = new Array();
    var nZoom       = 1;
    aSize["PAGE"]   = false;
    
    if( nDispHeight < nPicHeight ) { aSize["PAGE"]  = true; }
    
    aSize["WIDTH"]  = (nPicWidth / nZoom).toFixed(2);
    aSize["HEIGHT"] = (nPicHeight / nZoom).toFixed(2);
    
    return aSize;
}//END::resizePicture()

// END::Functions part-----------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------------------------------------
// Dialog part-------------------------------------------------------------------------------------
function displayUI( oUsrSettings, oComparisionSet ){
    var _result = 0;// Set default 0 as to cancel the report running and display nothing

    if( (oComparisionSet.aModels != null) && (oComparisionSet.aModels.length == 1) ){
        // Page #11 - Only one model selected
        _result = showDlgPage11( oUsrSettings, oComparisionSet );
        if( _result != -1 ) { return _result; }
        
            // Page #10 - Login and Password collect
            if( oUsrSettings.P11DBCompare == 1 ){
                oUsrSettings.CompDB = ArisData.openDatabase( oUsrSettings.P11DBName, true );     // Fixed in context of 'BLUE-9288'
                if( oUsrSettings.CompDB == null ) {
                    
                    do{
                        _result = showDlgPage10( oUsrSettings, oComparisionSet );// Login and Password
                        if (gb_showDlg100) {
                            if( _result == -1 ) _result = showDlgPage100( oUsrSettings, oComparisionSet );// Login Options
                        }
                        if( _result == -1 ) _result = tryLoginToDB( oUsrSettings, true );// Tryout login to DB
                        if( _result == gn_errLogin ) { Dialogs.MsgBox( getString("MSG_LOGIN_FAIL") ); }
                    }while( (_result != -1) && (_result != 0) );
                    if( _result != -1 ) { return _result; }
                }
            }
            
            oUsrSettings.getRefModelVersions();
            oUsrSettings.getRefModelMastersVariants();
            // Page #12 - Versions to compare
            if( oUsrSettings.P11ModCompare == 0 ){
                _result = showDlgPage12( oUsrSettings, oComparisionSet );
                if( _result != -1 ) { return _result; }
            }
            
            // Page #13 - Model Master/Variants to compare
            if( oUsrSettings.P11ModCompare == 1 ){
                _result = showDlgTable( "Page13", oUsrSettings, oComparisionSet );
                if( _result != -1 ) { return _result; }
            }
            
            // Page #14 - Models with identical attribute
            if( oUsrSettings.P11ModCompare == 2 ){
                _result = showDlgTable( "Page14", oUsrSettings, oComparisionSet );
                if( _result != -1 ) { return _result; }
            }
            
            // No Page - just check for same GUID in another DB
            if( oUsrSettings.P11ModCompare == 3 ){
                oUsrSettings.CompModels = oUsrSettings.getModelsByGUID();
                if( (oUsrSettings.CompModels == null) || (oUsrSettings.CompModels.length < 1) ) { return gn_errNoCmp; }
            }
            
            // Page #15 - Choose another comparison models
            if( oUsrSettings.P11ModCompare == 4 ){
                
                var oDB = oComparisionSet.oActDB;               
                if( oUsrSettings.P11DBCompare == 1 && oUsrSettings.CompDB != null) {
                    // (AGA-18574) Search for models in comparison database
                    oDB = oUsrSettings.CompDB;
                }              
                
                var sTmp    = Dialogs.BrowseArisItems(getString("TEXT_SELECTION_DLG_TITLE"), getString("TEXT_SELECTION_DLG_EXPLAIN"), oDB.ServerName(), oDB.Name( gn_Lang, true ), Constants.CID_MODEL, Context.getDefinedItemTypes(Constants.CID_MODEL), "HID_13556fe0-59d4-11e0-785f-996f2eafddb7_P14.hlp");
                oUsrSettings.CompModels = transformOIDToModArray( oDB, sTmp );
                if( (oUsrSettings.CompModels == null) || (oUsrSettings.CompModels.length < 1) ) { return gn_errNoCmp; }
            }
            
    } else if( (oComparisionSet.aModels != null) && (oComparisionSet.aModels.length > 1) ){
        // Page #20 - Several models selected
        _result = showDlgPage20( oUsrSettings, oComparisionSet );
        if( _result != -1 ) { return _result; }
    }
    
    if( (oComparisionSet.aModels != null) && (oComparisionSet.aModels.length > 0) ){
        // Page #30 - Comparison options
        _result = showDlgPage30( oUsrSettings, oComparisionSet );
    }
    
    return _result;
}//END::displayUI()


function showDlgPage11( oUsrSettings, oComparisionSet ){// Select comparision models dialog
    var tmpUserDialog   = Dialogs.createNewDialogTemplate(540, 250, getString("TEXT_SELECTION_DLG_TITLE"), "funcDlgPg11");
    // DB Options
    tmpUserDialog.GroupBox(20, 10, 510, 80, getString("TEXT_DB_OPTION"));
    tmpUserDialog.OptionGroup("grpDBOptions");
        tmpUserDialog.OptionButton(40, 35, 420, 15, getString("TEXT_WITHINDB"), "optDBOne");// 0
        tmpUserDialog.OptionButton(40, 60, 210, 15, getString("TEXT_CROSSDB"), "optDBCross");// 1
        tmpUserDialog.DropListBox(250, 60, 270, 100, oUsrSettings.DBNames(), "lstDBNames");
    // Comparison models
    tmpUserDialog.GroupBox(20, 100, 510, 175, getString("TEXT_COMP_MODELS"));
    tmpUserDialog.OptionGroup("grpComparisionModels");
        tmpUserDialog.OptionButton(40, 120, 420, 15, getString("TEXT_DIFF_VERSIONS"), "optVersRefModels");  // 0
        tmpUserDialog.OptionButton(40, 145, 420, 15, getString("TEXT_MASTER_VARIANTS"), "optMastVarModels");   // 1
        tmpUserDialog.OptionButton(40, 170, 210, 15, getString("TEXT_MODS_IDENTIC_ATTR"), "optIdentAttr");      // 2
        tmpUserDialog.OptionButton(40, 220, 420, 15, getString("TEXT_MODS_IDENTIC_GUID"), "optIdentGUID");      // 3
        tmpUserDialog.OptionButton(40, 245, 420, 15, getString("TEXT_CHOOSE_MODELS"), "optOtherModels");      // 4
        tmpUserDialog.DropListBox(250, 170, 270, 100, oUsrSettings.AttrNames(), "lstAttrNames");
        tmpUserDialog.CheckBox(70, 195, 350, 15, getString("TEXT_MATCH_CASE"), "chkCaseSensitive");
        // tmpUserDialog.Text(210, 195, 250, 30, "", "var_result");
    // Hidden text variables holding info {"true"|"false"}
    tmpUserDialog.Text(210, 195, 10, 20, "", "hid_Versionable");
    tmpUserDialog.Text(210, 195, 10, 20, "", "hid_MasterVariant");
    // Buttons
    tmpUserDialog.OKButton();
    tmpUserDialog.CancelButton();
    tmpUserDialog.HelpButton("HID_13556fe0-59d4-11e0-785f-996f2eafddb7_P11.hlp");
    
    dlg = Dialogs.createUserDialog( tmpUserDialog );
    // Sets user settings into relevant dialog
    oUsrSettings.setDlgPage11( dlg, oComparisionSet );
    var resUserDialog = Dialogs.show( dlg );
    // Gets user settings from dialog window
    if( resUserDialog == -1 ){
        oUsrSettings.getDlgPage11( dlg, oComparisionSet );
    }
    return resUserDialog;
}//END::showDlgPage11()


function funcDlgPg11( dlgitem, action, suppvalue ){
    var bResult = true;
    switch( action ){
        case 1:// Pre-Set the dialog settings according those Re-read from the Profile
            bResult = false;
        break;
        case 2:
            /*var gs_Out    = "  dlgitem:\t"+ dlgitem +"\n" ;
                gs_Out    += "  suppvalue: " + suppvalue + "\n";
            dlg.setDlgText( "var_result", gs_Out );*/
            
            if( dlgitem == "grpDBOptions" ){
                if( suppvalue == 0 ){
                    dlg.setDlgEnable( "lstDBNames", false);
                    dlg.setDlgEnable( "optIdentGUID", false );
                    dlg.setDlgEnable( "optMastVarModels", true );
                    /*
                    if( dlg.getDlgText( "hid_Versionable" ) == "true" ){
                        dlg.setDlgEnable( "optVersRefModels", true );
                    }
                    */
                    if( dlg.getDlgValue( "grpComparisionModels" ) == 3 ){
                        dlg.setDlgValue( "grpComparisionModels", 0 );
                    }
                }
                if( suppvalue == 1 ){
                    dlg.setDlgEnable( "lstDBNames", true);
                    dlg.setDlgEnable( "optMastVarModels", false );
                    dlg.setDlgEnable( "optIdentGUID", true );
                   
                    if( dlg.getDlgValue( "grpComparisionModels" ) == 1 ){
                        dlg.setDlgValue( "grpComparisionModels", 0 );
                    }
                }
            }
            
            if( dlgitem == "grpComparisionModels"){
                if( suppvalue == 2 ){
                    dlg.setDlgEnable( "chkCaseSensitive", true );
                    dlg.setDlgEnable( "lstAttrNames", true );
                } else if( dlg.getDlgEnable( "lstAttrNames" ) ){
                    dlg.setDlgEnable( "chkCaseSensitive", false );
                    dlg.setDlgEnable( "lstAttrNames", false );
                }
            }
            
            if( dlgitem == "OK" ) { bResult = false; }
            if( dlgitem == "Cancel" ) { bResult = false; }
        break;
    }

    return bResult;
}//END::funcDlgPg11()


function showDlgPage10( oUsrSettings, oComparisionSet ){// Database login dialog
    var tmpUserDialog   = Dialogs.createNewDialogTemplate(510, 120, getString("TEXT_DB_LOGIN"), "funcDlgPg10");
    tmpUserDialog.GroupBox(10, 10, 490, 100, getString("TEXT_LOGIN_EXPLAIN"));
    tmpUserDialog.Text(30, 40, 100, 30, getString("TEXT_DATABASE"));
    tmpUserDialog.Text(130, 40, 350, 30, oUsrSettings.P11DBName, "log_DbName");
    
    tmpUserDialog.Text(30, 60, 100, 15, getString("TEXT_USER"));
    tmpUserDialog.TextBox(130, 60, 350, 15, "log_Login", 0);
    tmpUserDialog.Text(30, 80, 100, 15, getString("TEXT_PASSWORD"));
    tmpUserDialog.TextBox(130, 80, 350, 15, "log_Password", -1);
    // tmpUserDialog.Text(130, 130, 250, 40, "", "var_result");
    
    tmpUserDialog.OKButton();
    tmpUserDialog.CancelButton();
    tmpUserDialog.HelpButton("HID_13556fe0-59d4-11e0-785f-996f2eafddb7_P10.hlp");
    
    dlg = Dialogs.createUserDialog( tmpUserDialog );
    // Sets user settings into relevant dialog
    oUsrSettings.setDlgPage10( dlg, oComparisionSet );
    var resUserDialog = Dialogs.show( dlg );
    // Gets user settings from dialog window
    if( resUserDialog == -1 ){
        oUsrSettings.getDlgPage10( dlg, oComparisionSet );
    }
    return resUserDialog;
}


function funcDlgPg10( dlgitem, action, suppvalue ){
    var bResult = true;
    switch( action ){
        case 1:
            bResult = false;
        break;
        case 2:
            if( dlgitem == "OK" ) { bResult = false; }
            if( dlgitem == "Cancel" ) { bResult = false; }
        break;
        case 3:
            if( (dlg.getDlgText( "log_Login" ).length() > 0) && (dlg.getDlgText( "log_Password" ).length() > 0) ){
                dlg.setDlgEnable( "OK", true );
            } else {
                dlg.setDlgEnable( "OK", false );
            }
        break;
    }
    return bResult;
}//END::funcDlgPg10()


function showDlgPage100( oUsrSettings, oComparisionSet ){// Database select options
    var tmpUserDialog   = Dialogs.createNewDialogTemplate(560, 120, getString("TEXT_SELECT_OPTIONS"), "funcDlgPg100");
    tmpUserDialog.GroupBox(10, 10, 540, 140, getString("TEXT_DB_OPEN_EXPLAIN") );
    tmpUserDialog.Text(20, 30, 120, 15, getString("TEXT_FILTER") );// Available Filter List
        tmpUserDialog.DropListBox(140, 30, 400, 100, oUsrSettings.FilterNames(), "lstDBFilters");
    tmpUserDialog.Text(20, 50, 120, 15, getString("TEXT_LANG") );// Available DB language
        tmpUserDialog.DropListBox(140, 50, 400, 100, oUsrSettings.LangNames(), "lstDBLang");
    tmpUserDialog.Text(20, 80, 500, 15, getString("TEXT_DB_VERSION") );// Simple text
    tmpUserDialog.Text(20, 100, 120, 15, getString("TEXT_VERSION_CONTEXT"));// Available Versions
        tmpUserDialog.DropListBox(140, 100, 400, 100, ga_Context, "lstDBContext");
    tmpUserDialog.Text(20, 120, 120, 15, getString("TEXT_CHLIST_NUM") );// Available change list numbers
        tmpUserDialog.DropListBox(140, 120, 400, 100, oUsrSettings.ChListInfos(), "lstDBChListFilled");
        tmpUserDialog.DropListBox(140, 120, 400, 100, [], "lstDBChListEmpty");
    // tmpUserDialog.Text(40, 160, 250, 30, "", "var_result");

    tmpUserDialog.OKButton();
    tmpUserDialog.CancelButton();
    tmpUserDialog.HelpButton("HID_13556fe0-59d4-11e0-785f-996f2eafddb7_P100.hlp");
    
    dlg = Dialogs.createUserDialog( tmpUserDialog );
    // Sets user settings into relevant dialog
    oUsrSettings.setDlgPage100( dlg, oComparisionSet );
    var resUserDialog = Dialogs.show( dlg );
    // Gets user settings from dialog window
    if( resUserDialog == -1 ){
        oUsrSettings.getDlgPage100( dlg, oComparisionSet );
    }
    return resUserDialog;
}


function funcDlgPg100( dlgitem, action, suppvalue ){
    var bResult = true;
    switch( action ){
        case 1:
            bResult = false;
        break;
        case 2:
/*            var gs_Out    = "  dlgitem:\t"+ dlgitem +"\n" ;
                gs_Out    += "  suppvalue: " + suppvalue + "\n";
            dlg.setDlgText( "var_result", gs_Out );*/
            
            if( (dlgitem == "lstDBContext") && (suppvalue == 2) ){
                dlg.setDlgEnable( "lstDBChListFilled", true );
                dlg.setDlgEnable( "lstDBChListEmpty", false );
                dlg.setDlgVisible( "lstDBChListFilled", true );
                dlg.setDlgVisible( "lstDBChListEmpty", false );
            } else if( (dlgitem == "lstDBContext") ){
                dlg.setDlgEnable( "lstDBChListFilled", false );
                dlg.setDlgEnable( "lstDBChListEmpty", false );
                dlg.setDlgVisible( "lstDBChListFilled", false );
                dlg.setDlgVisible( "lstDBChListEmpty", true );
            }
            if( dlgitem == "OK" ) { bResult = false; }
            if( dlgitem == "Cancel" ) { bResult = false; }
        break;
        case 3:
        break;
    }
    return bResult;
}//END::funcDlgPg100()


function showDlgPage12( oUsrSettings, oComparisionSet ){// Select versions to compare dialog
    var columnHeadings  = [getString("TEXT_SELECTION_TAB"), getString("TEXT_VERSION_TAB"), getString("TEXT_CHLISTNUM_TAB"), getString("TEXT_TIMEDATE_TAB"), getString("TEXT_DESCRIPTION_TAB"), getString("TEXT_USER_TAB")];
    var editorInfo      = [Constants.TABLECOLUMN_BOOL_EDIT, Constants.TABLECOLUMN_DEFAULT, Constants.TABLECOLUMN_DEFAULT, Constants.TABLECOLUMN_DEFAULT, Constants.TABLECOLUMN_DEFAULT, Constants.TABLECOLUMN_DEFAULT];
    var tmpUserDialog   = Dialogs.createNewDialogTemplate(770, 270, getString("TEXT_VERSIONS_TO_COMPARE"), "funcDlgPg12");
    // Version to compare
    tmpUserDialog.GroupBox(10, 10, 750, 230, getString("TEXT_VERSIONS_REFMODEL"));
    tmpUserDialog.OptionGroup("chkVersion");
        tmpUserDialog.OptionButton(30, 30, 710, 15, getString("TEXT_WORKSPACE"));
        tmpUserDialog.OptionButton(30, 50, 710, 15, getString("TEXT_CURRVERSION"));
        tmpUserDialog.OptionButton(30, 70, 710, 15, getString("TEXT_CHNGLIST"));
    tmpUserDialog.Table(30, 95, 710, 130, columnHeadings, editorInfo, [], "tabModVersions", Constants.TABLE_STYLE_ALLROWSSAMEHEIGHT);
        //tmpUserDialog.Text(200, 30, 250, 60, "", "var_result");

    tmpUserDialog.PushButton( 30, 250, 150, 15, getString("TEXT_SELECTALL_BTN"), "btn_SelectAll");
    tmpUserDialog.PushButton( 200, 250, 150, 15, getString("TEXT_DESELECTALL_BTN"), "btn_DeselectAll");
    tmpUserDialog.OKButton();
    tmpUserDialog.CancelButton();
    tmpUserDialog.HelpButton("HID_13556fe0-59d4-11e0-785f-996f2eafddb7_P12.hlp");
    
    dlg = Dialogs.createUserDialog( tmpUserDialog );
    // Sets user settings into relevant dialog
    if( oUsrSettings.setDlgPage12( dlg, oComparisionSet ) != -1 ){ return gn_errNoCmp; }
    var resUserDialog = Dialogs.show( dlg );
    // Gets user settings from dialog window
    if( resUserDialog == -1 ){
        resUserDialog   = oUsrSettings.getDlgPage12( dlg, oComparisionSet );
    }
    return resUserDialog;
}//END::showDlgPage12()

function funcDlgPg12( dlgitem, action, suppvalue ){
    var bResult = true;
    switch( action ){
        case 1:
            bResult = false;
        break;
        case 2:
            /*var gs_Out    = "  dlgitem:\t"+ dlgitem +"\n" ;
                gs_Out    += "  suppvalue: " + suppvalue + "\n";
            dlg.setDlgText( "var_result", gs_Out );*/
            switch( dlgitem ){
                case "chkVersion":
                    if( suppvalue == 2){
                        dlg.setDlgEnable( "tabModVersions", true );
                        if(dlg.getDlgListBoxArray( "tabModVersions" ).length >= 6){
                            dlg.setDlgEnable( "tabModVersions", true );
                            dlg.setDlgEnable( "btn_DeselectAll", true );
                            dlg.setDlgEnable( "btn_SelectAll", true );
                        } else{
                            dlg.setDlgEnable( "tabModVersions", false );
                        }
                    } else{
                        dlg.setDlgEnable( "tabModVersions", false );
                        dlg.setDlgEnable( "btn_DeselectAll", false );
                        dlg.setDlgEnable( "btn_SelectAll", false );
                    }
                    break;
                case "btn_SelectAll":
                    setTableAllChecked( dlg, "tabModVersions", 6, 0, true );
                    break;
                case "btn_DeselectAll":
                    setTableAllChecked( dlg, "tabModVersions", 6, 0, false );
                    break;
            }
            dlg.setDlgEnable( "OK", true );
            if( (dlg.getDlgValue("chkVersion") == 2) && (!getTableRowChecked( dlg, "tabModVersions", 6, 0)) ){
                dlg.setDlgEnable( "OK", false );
            }
            
            /*gs_Out    += "  checked: " + getTableRowChecked( dlg, "tabModVersions", 6, 0) + "\n";
            dlg.setDlgText( "var_result", gs_Out );*/
            
            if( dlgitem == "OK" ) { bResult = false; }
            if( dlgitem == "Cancel" ) { bResult = false; }
        break;
        case 8:
            dlg.setDlgEnable( "OK", getTableRowChecked( dlg, "tabModVersions", 6, 0) );
            bResult = false;
            var gs_Out    = "  dlgitem:\t"+ dlgitem +"\n" ;
                gs_Out    += "  suppvalue: " + suppvalue + "\n";
                gs_Out    += "  checked: " + getTableRowChecked( dlg, "tabModVersions", 6, 0) + "\n";
            dlg.setDlgText( "var_result", gs_Out );
            bResult = false;
        break;
    }

    return bResult;
}//END::funcDlgPg12()


function showDlgTable( sPage, oUsrSettings, oComparisionSet ){// Model Master/Variants to compare dialog
    var columnHeadings  = [getString("TEXT_SELECTION_TAB"), getString("TEXT_NAME_TAB"), getString("TEXT_TYPE_TAB"), getString("TEXT_GROUP_TAB")];
    var editorInfo      = [Constants.TABLECOLUMN_BOOL_EDIT, Constants.TABLECOLUMN_DEFAULT, Constants.TABLECOLUMN_DEFAULT, Constants.TABLECOLUMN_DEFAULT];
    var tmpUserDialog   = Dialogs.createNewDialogTemplate(750, 250, getString("TEXT_SELECT_MASTER_VARIANTS"), "funcDlgTable");

    tmpUserDialog.GroupBox(10, 10, 750, 200, getString("TEXT_MODEL_MASTER_VARIANTS") );
    tmpUserDialog.Table(30, 30, 710, 130, columnHeadings, editorInfo, [], "tabModels", Constants.TABLE_STYLE_ALLROWSSAMEHEIGHT);

    tmpUserDialog.PushButton( 30, 175, 150, 15, getString("TEXT_SELECTALL_BTN"), "btn_SelectAll");
    tmpUserDialog.PushButton( 200, 175, 150, 15, getString("TEXT_DESELECTALL_BTN"), "btn_DeselectAll");
    tmpUserDialog.OKButton();
    tmpUserDialog.CancelButton();
    tmpUserDialog.HelpButton("HID_13556fe0-59d4-11e0-785f-996f2eafddb7_P13.hlp");
    
    dlg = Dialogs.createUserDialog( tmpUserDialog );
    // Sets user settings into relevant dialog
    if( sPage == "Page13" ){
        if( oUsrSettings.setDlgPage13( dlg, oComparisionSet ) == gn_errNoCmp ) { return gn_errNoCmp; }
    }
    if( sPage == "Page14" ){
        if( oUsrSettings.setDlgPage14( dlg, oComparisionSet ) == gn_errNoCmp ) { return gn_errNoCmp; }
    }

    var resUserDialog = Dialogs.show( dlg );
    // Gets user settings from dialog window
    if( resUserDialog == -1 ){
        if( sPage == "Page13" ) { resUserDialog   = oUsrSettings.getDlgPage13( dlg, oComparisionSet ); }
        if( sPage == "Page14" ) { resUserDialog   = oUsrSettings.getDlgPage14( dlg, oComparisionSet ); }
    }
    return resUserDialog;
}//END::showDlgTable()

function funcDlgTable( dlgitem, action, suppvalue ){
    var bResult = true;
    switch( action ){
        case 1:
            bResult = false;
        break;
        case 2:
            if( dlg.getDlgListBoxArray( "tabModels" ).length >= 4 ){
                dlg.setDlgEnable( "btn_DeselectAll", true );
                dlg.setDlgEnable( "btn_SelectAll", true );
            } else{
                dlg.setDlgEnable( "btn_DeselectAll", false );
                dlg.setDlgEnable( "btn_SelectAll", false );
            }
            
            if( dlgitem == "btn_SelectAll" ){
                setTableAllChecked( dlg, "tabModels", 4, 0, true );
            }
            if( dlgitem == "btn_DeselectAll" ){
                setTableAllChecked( dlg, "tabModels", 4, 0, false );
            }

            dlg.setDlgEnable( "OK",  getTableRowChecked( dlg, "tabModels", 4, 0) );

            if( dlgitem == "OK" ) { bResult = false; }
            if( dlgitem == "Cancel" ) { bResult = false; }
        break;
        case 3:
            dlg.setDlgEnable( "OK",  getTableRowChecked( dlg, "tabModels", 4, 0) );
            bResult = false;
        break;
        case 4:
            dlg.setDlgEnable( "OK",  getTableRowChecked( dlg, "tabModels", 4, 0) );
            bResult = false;
        break;

        case 7:
            dlg.setDlgEnable( "OK",  getTableRowChecked( dlg, "tabModels", 4, 0) );
            bResult = false;
        break;
        case 8:
            dlg.setDlgEnable( "OK",  getTableRowChecked( dlg, "tabModels", 4, 0) );
            bResult = false;
        break;
    }

    return bResult;
}//END::funcDlgTable()

function showDlgPage20( oUsrSettings, oComparisionSet ){// Several models- Select reference model
    var tmpUserDialog   = Dialogs.createNewDialogTemplate(560, 120, getString("TEXT_SELECT_REF_MODEL"), "funcDlgPg20");

    tmpUserDialog.GroupBox(10, 10, 540, 100, getString("TEXT_SELECT_REF_MODEL"));
    tmpUserDialog.Text(20, 30, 120, 15, getString("TEXT_REFERENCE_MODEL"));
        tmpUserDialog.DropListBox(140, 30, 400, 100, [], "lstModels");
    // tmpUserDialog.Text(20, 55, 250, 30, "", "var_result");
    
    tmpUserDialog.OKButton();
    tmpUserDialog.CancelButton();
    tmpUserDialog.HelpButton("HID_13556fe0-59d4-11e0-785f-996f2eafddb7_P20.hlp");
    
    dlg = Dialogs.createUserDialog( tmpUserDialog );
    // Sets user settings into relevant dialog
    oUsrSettings.setDlgPage20( dlg, oComparisionSet );
    var resUserDialog = Dialogs.show( dlg );
    // Gets user settings from dialog window
    if( resUserDialog == -1 ){
        resUserDialog   = oUsrSettings.getDlgPage20( dlg, oComparisionSet );
    }
    return resUserDialog;
}

function funcDlgPg20( dlgitem, action, suppvalue ){
    var bResult = true;
    switch( action ){
        case 1:
            bResult = false;
        break;
        case 2:
/*            var gs_Out    = "  dlgitem:\t"+ dlgitem +"\n" ;
                gs_Out    += "  suppvalue: " + suppvalue + "\n";
            dlg.setDlgText( "var_result", gs_Out );*/
            if( dlgitem == "lstModels" ){
                if( (suppvalue > 0) && (suppvalue < dlg.getDlgListBoxArray( "lstModels" ).length) ){
                    dlg.setDlgEnable( "OK", true );
                }
            }
            if( dlgitem == "OK" ) { bResult = false; }
            if( dlgitem == "Cancel" ) { bResult = false; }
        break;
    }
    return bResult;
}//END::funcDlgPg20()

function showDlgPage30( oUsrSettings, oComparisionSet ){// Model comparision options
    var nuserdlg = 0;   // Variable for the user dialog box
    oUsrSettings.setAttributes( Constants.CID_OBJDEF );
    var tmpUserDialog = Dialogs.createNewDialogTemplate(0, 0, 560, 420, getString("TEXT_COMPARISON_OPTIONS"), "funcDlgPg30");
    tmpUserDialog.GroupBox(20, 10, 530, 70, getString("TEXT_COMPARISON_TYPES"));// Comparison types
        tmpUserDialog.CheckBox(35, 25, 400, 15, getString("TEXT_ITEM_EXIST_REF_MOD"), "chkFirstModel", 0 );// Items that only exist in first model
        tmpUserDialog.CheckBox(35, 40, 400, 15, getString("TEXT_ITEM_EXIST_COMP_MOD"), "chkSecondModel", 0 );// Items that only exist in second model
        tmpUserDialog.CheckBox(35, 55, 400, 15, getString("TEXT_ITEM_ALL_MODELS"), "chkBothModels", 0 );// Changed items in both models
        
    tmpUserDialog.GroupBox(20, 85, 530, 280, getString("TEXT_ITEM_TYPES"));// Item types
        tmpUserDialog.CheckBox(35, 100, 400, 15, getString("TEXT_MODEL_PROPERTIES"), "chkModelProperties", 0 );// Model properties
        tmpUserDialog.CheckBox(35, 115, 400, 15, getString("TEXT_OBJECT_DEF"), "chkObjDefinition", 0 );// Object definition
            tmpUserDialog.CheckBox(55, 130, 400, 15, getString("TEXT_OBJECT_ATTRS"), "chkObjDefAttributes", 0 );// Object attributes
                tmpUserDialog.CheckBox(75, 145, 450, 15, getString("TEXT_SYSTEMATTRIBUTES"), "chkObjDefSystemAttributes", 0 );// System Attributes
            tmpUserDialog.CheckBox(55, 160, 400, 15, getString("TEXT_OBJECT_OCCU"), "chkObjOccs", 0 );// Object occurrences
                tmpUserDialog.CheckBox(75, 175, 400, 15, getString("TEXT_APPEAR_SYMBOL"), "chkAppearSymbol", 0 ); // Appearance/ symbol
                tmpUserDialog.CheckBox(75, 190, 400, 15, getString("TEXT_POS_SIZE"), "chkPositionSize", 0 );// Position/ Size
                tmpUserDialog.CheckBox(75, 205, 400, 15, getString("TEXT_ATTR_PLACEMENT"), "chkAttrPlacement", 0 );//Attribute placement
        tmpUserDialog.CheckBox(35, 220, 400, 15, getString("TEXT_CONNECTION_DEF"), "chkCxnsDefinition", 0 );// Connection definition
            tmpUserDialog.CheckBox(55, 235, 400, 15, getString("TEXT_CONNECTION_ATTRS"), "chkCxnDefAttributes", 0 );// Connection attributes
            tmpUserDialog.CheckBox(55, 250, 400, 15, getString("TEXT_CONNECTION_OCCU"), "chkCxnOccs", 0 );// Connection occurrences
                tmpUserDialog.CheckBox(75, 265, 400, 15, getString("TEXT_CONNECTION_APPEAR"), "chkCxnAppearance", 0 );// Connection appearance
                tmpUserDialog.CheckBox(75, 280, 400, 15, getString("TEXT_CONNECTION_POINTS"), "chkCxnAnchorPoints", 0 );// Connection anchor points
                tmpUserDialog.CheckBox(75, 295, 400, 15, getString("TEXT_ATTR_CXN_PLACEMENT"), "chkCxnAttrPlacement", 0 );// Attribute placements for connections
        tmpUserDialog.CheckBox(35, 310, 400, 15, getString("TEXT_GRAPHIC_OBJ"), "chkGraphicObjects", 0 );// Graphic objects
        tmpUserDialog.CheckBox(35, 325, 400, 15, getString("TEXT_OLE_OBJ"), "chkOLEObjects", 0 );// OLE objects
        tmpUserDialog.CheckBox(35, 340, 400, 15, getString("TEXT_FREE_TEXT"), "chkFFText", 0 );// Free-Form Text

    tmpUserDialog.GroupBox(20, 370, 530, 70, getString("TEXT_ADDITIONAL_CRITERION"), "grpAddCriteria");// Additional criterion
        tmpUserDialog.CheckBox(35, 385, 230, 15, getString("TEXT_IDENTICAL_ATTR"), "chkObjIdenticAttrs", 0 );// Objects with identical attributes
                tmpUserDialog.DropListBox(265, 385, 270, 100, oUsrSettings.AttrNames(), "lstAttrNames");// ListBox with Attributes names
            tmpUserDialog.CheckBox(55, 400, 400, 15, getString("TEXT_MATCH_CASE"), "chkCaseSensitive", 0 );// Match case sensitive
            tmpUserDialog.CheckBox(55, 415, 400, 15, getString("TEXT_INCLUDE_LINE_BREAKS"), "chkInclBreaksSpaces", 0 );// Include line breaks and spaces

    // tmpUserDialog.Text(35, 440, 250, 70, "", "var_result");
    tmpUserDialog.OKButton();
    tmpUserDialog.CancelButton();
    tmpUserDialog.HelpButton("HID_13556fe0-59d4-11e0-785f-996f2eafddb7_P30.hlp");
    
    dlg = Dialogs.createUserDialog( tmpUserDialog );
    // Sets user settings into relevant dialog
    oUsrSettings.setDlgPage30( dlg, oComparisionSet );
    var resUserDialog = Dialogs.show( dlg );
    // Gets user settings from dialog window
    if( resUserDialog == -1 ){
        oUsrSettings.getDlgPage30( dlg, oComparisionSet );
    }
    return resUserDialog;
}//END::showDlgPage30()

function funcDlgPg30( dlgitem, action, suppvalue ){
    var bResult = true;
    switch( action ){
        case 1:
            bResult = false;
            break;
        case 2:
            // var gs_Out    = "  dlgitem:\t"+ dlgitem +"\n" ;
                // gs_Out    += "  suppvalue: " + suppvalue + "\n";
            // dlg.setDlgText( "var_result", gs_Out );

             switch(dlgitem) {
                case "chkObjIdenticAttrs":
                    dlg.setDlgEnable( "lstAttrNames", suppvalue==1 );
                    dlg.setDlgEnable( "chkCaseSensitive", suppvalue==1 );
                    dlg.setDlgEnable( "chkInclBreaksSpaces", suppvalue==1 );
                    break;
                case "chkObjDefinition":
                    if ( suppvalue!=1 ) {
                        dlg.setDlgValue( "chkObjDefAttributes", 0 );
                        dlg.setDlgValue( "chkObjDefSystemAttributes", 0 );
                        dlg.setDlgValue( "chkObjOccs", 0 );
                        dlg.setDlgValue( "chkAppearSymbol", 0 );
                        dlg.setDlgValue( "chkPositionSize", 0 );
                        dlg.setDlgValue( "chkAttrPlacement", 0 );
                    }
                    break;
                case "chkObjDefAttributes":
                    if ( suppvalue==1 ) {
                        dlg.setDlgValue( "chkObjDefinition", 1 );
                    } else {
                        dlg.setDlgValue( "chkObjDefSystemAttributes", 0 );
                    }
                    break;
                case "chkObjDefSystemAttributes":
                    if ( suppvalue==1 ) {
                        dlg.setDlgValue( "chkObjDefinition", 1 );
                        dlg.setDlgValue( "chkObjDefAttributes", 1 );
                    }
                    break;
                case "chkObjOccs":
                    if ( suppvalue==1 ) {
                        dlg.setDlgValue( "chkObjDefinition", 1 );
                    } else {
                        dlg.setDlgValue( "chkAppearSymbol", 0 );
                        dlg.setDlgValue( "chkPositionSize", 0 );
                        dlg.setDlgValue( "chkAttrPlacement", 0 );
                    }
                    break;
                case "chkAppearSymbol":
                case "chkPositionSize":
                case "chkAttrPlacement":
                    if ( suppvalue==1 ) {
                        dlg.setDlgValue( "chkObjDefinition", 1 );
                        dlg.setDlgValue( "chkObjOccs", 1 );
                    }
                    break;
                    
                case "chkCxnsDefinition":
                    if ( suppvalue!=1 ) {
                        dlg.setDlgValue( "chkCxnDefAttributes", 0 );
                        dlg.setDlgValue( "chkCxnOccs", 0 );
                        dlg.setDlgValue( "chkCxnAppearance", 0 );
                        dlg.setDlgValue( "chkCxnAnchorPoints", 0 );
                        dlg.setDlgValue( "chkCxnAttrPlacement", 0 );
                    }
                    break;
                case "chkCxnDefAttributes":
                    if ( suppvalue==1 ) {
                        dlg.setDlgValue( "chkCxnsDefinition", 1 );
                    }
                    break;
                        
                case "chkCxnOccs":
                    if ( suppvalue==1 ) {
                        dlg.setDlgValue( "chkCxnsDefinition", 1 );
                    } else {
                        dlg.setDlgValue( "chkCxnAppearance", 0 );
                        dlg.setDlgValue( "chkCxnAnchorPoints", 0 );
                        dlg.setDlgValue( "chkCxnAttrPlacement", 0 );
                    }
                    break;
                case "chkCxnAppearance":
                case "chkCxnAnchorPoints":
                case "chkCxnAttrPlacement":
                    if ( suppvalue==1 ) {
                        dlg.setDlgValue( "chkCxnsDefinition", 1 );
                        dlg.setDlgValue( "chkCxnOccs", 1 );
                    }
                    break;
            }
            if( dlgitem == "OK" ) { bResult = false; }
            if( dlgitem == "Cancel" ) { bResult = false; }
            break;
    }
    return bResult;
}//END::funcDlgPg30()
// END::Dialog-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------------------------------------
// Classes-----------------------------------------------------------------------------------------
function cl_MasterVariant( ){
        this.oMaster    = null;
        this.aVariants  = null;
        
        cl_MasterVariant.prototype.getMaster    = function( oModel, oDB, bFlag ){
            if( (oModel == null) || (oDB == null) || (!oModel.IsValid()) || (!oDB.IsValid()) || ((bFlag != 0) && (bFlag != 1) ) ) { return; }
            
            if( bFlag == 0 ){// Perform on ActiveDB
                var oObj    = oModel.Master();
                if( oObj.IsValid() ){
                    this.oMaster    = oObj;
                }
            }
            if( bFlag == 1 ){// Perform on Comparison DB
                var srchGUID    = oModel.RefGUID();
                if( (srchGUID != null) && (srchGUID.length() > 0) ){
                    var masterModel = oDB.FindGUID( srchGUID, Constants.CID_MODEL );
                    if( (masterModel != null) && (masterModel.IsValid()) ){
                        this.oMaster    = masterModel;
                    }
                }
            }
        }
        
        cl_MasterVariant.prototype.getVariants  = function( oModel, oDB, bFlag ){
            if( (oModel == null) || (oDB == null) || (!oModel.IsValid()) || ((bFlag != 0) && (bFlag != 1) ) ) { return; }
            
            if( bFlag == 0 ){// Perform on ActiveDB
                if( oModel.Variants().length > 0 ){
                    this.aVariants  = oModel.Variants();
                    this.aVariants.sort( sortLangNames );
                }
            }
            if( bFlag == 1 ){// Perform on Comparison DB
                var srchGUID    = oModel.GUID();
                if( (srchGUID != null) && (srchGUID.length() > 0) ){
                    var aVariants   = oDB.FindRefGUID( srchGUID, Constants.CID_MODEL );
                    if( (aVariants != null) && (aVariants.length > 0) ){
                        this.aVariants  = aVariants;
                        this.aVariants.sort( sortLangNames );
                    }
                }
            }
        }

        cl_MasterVariant.prototype.Initialize   = function( oModel, oDB, bFlag ){
                this.getMaster( oModel, oDB, bFlag );
                this.getVariants( oModel, oDB, bFlag );
        }
        
        cl_MasterVariant.prototype.HasMaster    = function(){
            if( this.oMaster != null ){
                return true;
            }
            return false;
        }
        cl_MasterVariant.prototype.HasVariant  = function(){
            if( (this.aVariants != null) && (this.aVariants.length > 0) ){
                return true;
            }
            return false;
        }
        
        cl_MasterVariant.prototype.HasMasterVariants    = function(){
            if( this.HasMaster() || this.HasVariant() ){
                return true;
            }
            return false;
        }
        cl_MasterVariant.prototype.outModels    = function(){
            var aOut    = new Array();
            if( this.HasMaster() ){
                aOut.push( this.oMaster );
            }
            if( this.HasVariant() ){
                aOut    = aOut.concat( this.aVariants );
            }
            return aOut;
        }
}//END::CL_MASTERVARIANT


function cl_UISettings( referenceModel, selectedModels ){
    this.aModels        = (selectedModels != null)?selectedModels:null;// Selected models on which report was started
    this.RefModel       = (referenceModel != null)?referenceModel:null;// Reference model
    this.RefVersioned   = false;                // Flag whether ref.model is versioned
    this.CompModels     = [];                   // Array of selected models for comparision
    this.CompDB         = null;                 // Cross compare DB opened using P10Login, P10Password, P100Filter, P100Lang, as read-only
    //Page #11 - Only one model selected
    this.P11DBCompare   = 0;                    // Option for comparison of models: 0->Within One DB, 1->Cross DB comparision
    this.P11DBName      = gs_Empty;             // Database name for db compare
    this.P11ModCompare  = 0;                    // Option for comparison of models: 0->Versions, 1->Masters/variants, 2->Attribute, 3->GUID, 4->Selected models
    this.P11AttrNumber  = Constants.AT_NAME;    // Attribute type num for model comparison by attribute
    this.P11MatchCase   = false;                // Flag for case sensitive attribute comparison for models
    //SubPage #10 - Login into DB
    this.P10Login       = gs_Empty;             // Database user login name
    this.P10Passwd      = gs_Empty;             // Database password
    //SubPage #100 - Login Options
    this.P100Filter     = null;
    this.P100Lang       = gn_Lang;
    this.P100DBContext  = 0;            // Options for DB Context: 0->Workspace, 1->Current version, 2->Change list
    this.P100ChListNum  = -1;
    //Page #12 - Versions to compare
    this.P12Workspace   = false;        // Flag for reference model to workspace model comparision
    this.P12CurrVersion = false;        // Flag for reference model to current version model comparision
    this.P12ChangeList  = false;        // Flag for reference model to change list version model(s) comparision
    this.P12ChListVers  = [];           // Array of selected version numbers for reference model to change list version model(s) comparision {1,2,3,4,5,..}
    //Page #14 - anykind temporary array used to echange and store models found and selected by user choosen attribute
    this.aTempArray    = null;
    //Page #30 - Comparison options
    this.oCmpOptions    = new __cmp_ComparisonOptions();
    // General class variables
    this.aFilters       = sortAndFilterFilters( ArisData.getConfigurationFilters( gn_Lang ) );
    this.aDBLangs       = null;
    this.aChListInfos   = null;
    this.aDBNames       = _sortStrArray( ArisData.GetDatabaseNames( ), java.lang.String(ArisData.getActiveDatabase().Name( gn_Lang, true)) );
    this.aAttributes    = _sortAttrByNames( ArisData.ActiveFilter().AttrTypes( Constants.CID_MODEL ) );
    this.aModVersions   = null;
    this.oMasterVariant = new cl_MasterVariant();

    cl_UISettings.prototype.getRefModelVersions = function( ){
        if( this.RefModel != null ){
            var oModel = this.RefModel;
            
            if( this.P11DBCompare == 1 && this.CompDB != null) {
                // AGA-18574 Search for versions in comparison database
                oModel = this.CompDB.FindGUID(this.RefModel.GUID());
            }
            this.aModVersions   = getModelVersions( oModel );// Ref. model versionable check
            this.RefVersioned   = ((this.aModVersions != null) && (this.aModVersions.length > 0))?true:false;
        }
    }

    cl_UISettings.prototype.getRefModelMastersVariants  = function( ){
        var oDB = (this.P11DBCompare == 0)?ArisData.getActiveDatabase():this.CompDB;
        if( (oDB != null) && (oDB.IsValid()) ){
            this.oMasterVariant.Initialize( this.RefModel, oDB, this.P11DBCompare );// Get Masters and Variants of selected model
        }
    }


    if( (selectedModels != null) && (selectedModels.length == 1) ){
        this.getRefModelVersions( );
        this.getRefModelMastersVariants( );
    }

    function sortAndFilterFilters( p_Array ){
        var aOut    = new Array();
        if( p_Array != null ){
            for( var i=0; i<p_Array.length; i++ ){
                if( !(p_Array[i].isEvaluationFilter()) ){
                    aOut.push( p_Array[i] );
                }
            }
            aOut.sort( sortFilterNames );
        }
        return aOut;
    }
    
    function _sortStrArray( p_Array, sException ){
        if( p_Array != null ){
            var aOut    = new Array();
            p_Array.sort( sortStrings );
            if( (sException != null) && (sException.length() > 0)  ){
                for( var i=0; i<p_Array.length; i++ ){
                    if( sException.compareToIgnoreCase( java.lang.String(p_Array[i]) ) != 0 ){
                        aOut.push( p_Array[i] );
                    }
                }//END::for_i
            }
            return aOut;
        }
        return p_Array;
    }
    
    function _sortAttrByNames( p_Attr ){
        if( p_Attr != null ){
            p_Attr.sort( sortAttrNames );
        }
        return p_Attr;
    }

    cl_UISettings.prototype.DBNames     = function( ){
            return this.aDBNames;
    }

    cl_UISettings.prototype.DBName      = function( p_Idx ){
        if( (this.aDBNames != null) && (this.aDBNames.length > 0) && ((p_Idx < this.aDBNames.length) && (p_Idx >= 0))){
            return java.lang.String( this.aDBNames[ p_Idx ] );
        }
        return null;
    }
    
    cl_UISettings.prototype.getDBNameIdx    = function( p_sName ){
        if( (p_sName != null) && (p_sName.length() > 0) && (this.aDBNames != null) && (this.aDBNames.length > 0) ){
            for( var i=0; i < this.aDBNames.length; i++ ){
                var sTmp    = this.DBName( i );
                if( (sTmp != null) && (sTmp.compareToIgnoreCase( p_sName ) == 0) ){
                    return i;
                }
            }//END::for_i
        }
        return 0;
    }

    cl_UISettings.prototype.Attributes      = function( ){
            return this.aAttributes;
    }

    cl_UISettings.prototype.setAttributes   = function( p_nNum ){
        this.aAttributes    = _sortAttrByNames( ArisData.ActiveFilter().AttrTypes( p_nNum ) );
    }
    
    cl_UISettings.prototype.getAttributes   = function( p_Idx ){
        if( (this.aAttributes != null) && (this.aAttributes.length > 0) && ((p_Idx < this.aAttributes.length) && (p_Idx >= 0))){
            return this.aAttributes[ p_Idx ];
        }
        return null;
    }

    cl_UISettings.prototype.AttrNames    = function( ){
        var aOut    = new Array();
        if( (this.aAttributes != null) && (this.aAttributes.length > 0) ){
            for(var i=0; i<this.aAttributes.length; i++ ){
                aOut.push( getAttributeName( this.aAttributes[i] ));
            }//END::for_i
        }
        return aOut;
        
        function getAttributeName(p_attrTypeNum) {
            var sName = ArisData.ActiveFilter().AttrTypeName(p_attrTypeNum) + " [" + 
                        ArisData.ActiveFilter().getAPIName(Constants.CID_ATTRDEF, p_attrTypeNum) + "]";
            return java.lang.String( sName );
        }
    }
    
    cl_UISettings.prototype.getAttrIdx  = function( p_nNum ){
        if( (p_nNum != null) && (p_nNum > 0) && (this.aAttributes != null) && (this.aAttributes.length > 0) ){
            for( var i=0; i<this.aAttributes.length; i++ ){
                if( this.getAttributes( i ) == p_nNum ){
                    return i;
                }
            }//END::for_i
        }
        return 0;
    }
    
    cl_UISettings.prototype.FilterNames    = function( ){
        var aOut    = new Array();
        if( (this.aFilters != null) && (this.aFilters.length > 0) ){
            for(var i=0; i<this.aFilters.length; i++ ){
                aOut.push( java.lang.String( this.aFilters[i].getName() ) );
            }//END::for_i
        }
        return aOut;
    }
    cl_UISettings.prototype.getFilterNameIdx    = function( p_sName ){
        if( (p_sName != null) && (p_sName.length() > 0) && (this.aFilters != null) && (this.aFilters.length > 0) ){
            for(var i=0; i<this.aFilters.length; i++ ){
                var sTmp    = java.lang.String( this.aFilters[i].getName() );
                if( (sTmp != null) && (sTmp.compareToIgnoreCase( p_sName ) == 0) ){
                    return i;
                }
            }//END::for_i
        }
        return 0;
    }
    cl_UISettings.prototype.getConfigFilter = function( p_sGUID ){
        if( (p_sGUID != null) && (gs_Empty.compareToIgnoreCase( p_sGUID ) != 0) ){
            if( (this.aFilters != null) && (this.aFilters.length > 0) ){
                for(var i=0; i<this.aFilters.length; i++ ){
                    var a_sFilter   = java.lang.String( this.aFilters[i].getGUID() );
                    var p_sFilter   = java.lang.String( this.p_sGUID );
                    if( a_sFilter.compareToIgnoreCase( p_sFilter ) == 0 ){
                        return this.aFilters[i];
                    }
                }//END::for_i
            }
        }
        
        return null;
    }

    cl_UISettings.prototype.LangNames    = function( ){
        var aOut    = new Array();
        if( (this.aDBLangs != null) && (this.aDBLangs.length > 0) ){
            for(var i=0; i<this.aDBLangs.length; i++ ){
                aOut.push( java.lang.String( this.aDBLangs[i].Name( gn_Lang ) ) );
            }//END::for_i
        }
        return aOut;
    }
    cl_UISettings.prototype.getLangNamesIdx = function( p_Lang ){
        var aOut    = new Array();
        if( (this.aDBLangs != null) && (this.aDBLangs.length > 0) ){
            for(var i=0; i<this.aDBLangs.length; i++ ){
                if( this.aDBLangs[i].LocaleId() == p_Lang ){
                    return i;
                }
            }//END::for_i
        }
        return 0;
    }

    cl_UISettings.prototype.ChListInfos  = function( ){
        var aOut    = new Array();
        if( (this.aChListInfos != null) && (this.aChListInfos.length > 0) ){
            for(var i=0; i<this.aChListInfos.length; i++ ){
                aOut.push( java.lang.String( this.aChListInfos[i].getID() ).concat(" -  ").concat( this.aChListInfos[i].getDescription()) );
            }//END::for_i
        }
        return aOut;
    }
    
    cl_UISettings.prototype.ChListInfo  = function( p_Idx ){
        if( (p_Idx != null) && (p_Idx > 0) && (this.aChListInfos != null) && (p_Idx < this.aChListInfos.length) ){
            return this.aChListInfos[ p_Idx ];
        }
        return null;
    }
    
    cl_UISettings.prototype.getModelsByAttr = function( ){
        var aOut    = new Array();
        var oDB     = (this.P11DBCompare == 1)?this.CompDB:ArisData.getActiveDatabase();
        if( (oDB != null) && (this.RefModel != null) ){
            var aAttr           = getAttrValue( this.RefModel, this.P11AttrNumber, this.P100Lang );
            if( aAttr != null ){
                var sRefAttrValue   = (aAttr["VALUE"] == null)?gs_Empty:aAttr["VALUE"];
                var nCompareFlags   = (this.P11MatchCase)?(Constants.SEARCH_CMP_EQUAL|Constants.SEARCH_CMP_CASESENSITIVE):Constants.SEARCH_CMP_EQUAL;
                var aModels         = oDB.Find( Constants.SEARCH_MODEL, this.P11AttrNumber, this.P100Lang, sRefAttrValue, nCompareFlags );
                
                if( aModels != null ){
                    for( var i=0; i<aModels.length; i++ ){
                        if( aModels[i] != null && aModels[i].IsValid() && (!aModels[i].IsEqual(this.RefModel)) ){
                            aOut.push( aModels[i] );
                        }
                    }//END::for_i
                }
            }
        }
        return aOut;
    }
    
    cl_UISettings.prototype.getModelsByGUID = function( ){
        var aOut    = new Array();
        if( (this.RefModel != null) && (this.CompDB != null) ){
            var sRefModelGUID   = this.RefModel.GUID();
            var oModel          = this.CompDB.FindGUID( sRefModelGUID, Constants.CID_MODEL );

            if( oModel != null && oModel.IsValid() ){
                aOut.push( oModel );
            }
        }
        return aOut;
    }

    cl_UISettings.prototype.getStartingModelsNames  = function( ){
        var aOut    = new Array();
        if( (this.aModels != null) && (this.aModels.length > 0) ){
            for(var i=0; i<this.aModels.length; i++ ){
                aOut.push( java.lang.String( getModelName(this.aModels[i], gn_Lang) ) );
            }//END::for_i
        }
        return aOut;
    }
    cl_UISettings.prototype.getStartingModelsIdx    = function( p_sName ){
        if( (p_sName != null) && (p_sName.length() > 0) && (this.aModels != null) && (this.aModels.length > 0) ){
            for(var i=0; i<this.aModels.length; i++ ){
                var sTmp    = java.lang.String( getModelName(this.aModels[i], gn_Lang) );
                if( (sTmp != null) && (sTmp.compareToIgnoreCase( p_sName ) == 0) ){
                    return i;
                }
            }//END::for_i
        }
        return 0;
    }
    cl_UISettings.prototype.getStartingModelByIdx       = function( p_Idx ){
        if( (p_Idx != null) && (p_Idx >= 0) && (p_Idx < this.aModels.length) && (this.aModels != null) ){
            return this.aModels[ p_Idx ];
        }
        return null;
    }
    cl_UISettings.prototype.filterStartingModelsByIdx   = function( p_Idx ){
        var aOut    = new Array();
        if( (p_Idx != null) && (p_Idx >= 0) && (p_Idx < this.aModels.length) && (this.aModels != null) ){
            for( var i=0; i<this.aModels.length; i++ ){
                if( i != p_Idx ) aOut.push( this.aModels[i] );
            }//END::for_i
        }
        return aOut;
    }
    
    // Cl_Function - ReStoreUISettings: Reads settings from profile into class variables
    cl_UISettings.prototype.ReStoreUISettings   = function( oComparisionSet ){
        var bRestore        = false;
        var storedRefModel  = transformGUIDToModArray( oComparisionSet.oActDB, Context.getProfileString( gs_Section, "RefModel", gs_Empty) );
        
        if( (oComparisionSet.aModels != null) && (oComparisionSet.aModels.length == 1) ){// Started on 1 model
            if( (storedRefModel != null) && (this.RefModel.equals( storedRefModel[0] ) == true) ) { bRestore = true; }

            if( bRestore ){
                //Page #11 - Only one model selected
                this.P11DBCompare   = Context.getProfileInt( gs_Section, "P11DBCompare", 0 );
                this.P11DBName      = Context.getProfileString( gs_Section, "P11DBName", gs_Empty );
                this.P11ModCompare  = Context.getProfileInt( gs_Section, "P11ModCompare", 0 );
                this.P11AttrNumber  = Context.getProfileInt( gs_Section, "P11AttrNumber", Constants.AT_NAME );
                this.P11MatchCase   = getProfileBool( gs_Section, "P11MatchCase", false );
                //SubPage #10 - Login into DB
                this.P10Login       = Context.getProfileString( gs_Section, "P10Login", gs_Empty );
                
                if (gb_showDlg100) {
                    //SubPage #100 - Login Options
                    this.P100Filter     = this.getConfigFilter( Context.getProfileString( gs_Section, "P100Filter", gs_Empty ) );
                    this.P100Lang       = Context.getProfileInt( gs_Section, "P100Lang", gn_Lang );
                    this.P100DBContext  = Context.getProfileInt( gs_Section, "P100DBContext", 0 );
                    this.P100ChListNum  = Context.getProfileInt( gs_Section, "P100ChListNum", -1 );
                }
                //Page #12 - Versions to compare
                this.P12Workspace   = getProfileBool( gs_Section, "P12Workspace", false );
                this.P12CurrVersion = getProfileBool( gs_Section, "P12CurrVersion", false );
                this.P12ChangeList  = getProfileBool( gs_Section, "P12ChangeList", false );
                this.P12ChListVers  = transformStringToArray( Context.getProfileString( gs_Section, "P12ChListVers", gs_Empty ) );
            }
        } else if( (oComparisionSet.aModels != null) && (oComparisionSet.aModels.length > 1) ){
            if( (storedRefModel != null) && (storedRefModel.length > 0) && (oComparisionSet.aModels.contains( storedRefModel[0] ) ) ){
                this.RefModel       = storedRefModel[0];
            }
        }

        if( (oComparisionSet.aModels != null) && (oComparisionSet.aModels.length > 0) ){
            //Page #30 - Comparison options
            this.oCmpOptions.CmpExistFirstMod   = getProfileBool( gs_Section, "OptCmpExistFirstMod", true );
            this.oCmpOptions.CmpExistSecondMod  = getProfileBool( gs_Section, "OptCmpExistSecondMod", true );
            this.oCmpOptions.CmpChangeBothMod   = getProfileBool( gs_Section, "OptCmpChangeBothMod", true );

            this.oCmpOptions.ItmModProperties                           = getProfileBool( gs_Section, "OptItmModProperties", true );
            this.oCmpOptions.ItmObjDefinitions.Checked                  = getProfileBool( gs_Section, "OptItmObjDefinitionsChecked", true );
            this.oCmpOptions.ItmObjDefinitions.Attributes               = getProfileBool( gs_Section, "OptItmObjDefinitionsAttributes", true );
                this.oCmpOptions.ItmObjDefinitions.SystemAttributes     = getProfileBool( gs_Section, "OptItmObjDefinitionsSystemAttributes", false );
            this.oCmpOptions.ItmObjDefinitions.Occurrences.Checked      = getProfileBool( gs_Section, "OptItmObjDefinitionsOccurrencesChecked", true );
            this.oCmpOptions.ItmObjDefinitions.Occurrences.Appearance   = getProfileBool( gs_Section, "OptItmObjDefinitionsOccurrencesAppearance", false );
            this.oCmpOptions.ItmObjDefinitions.Occurrences.Position     = getProfileBool( gs_Section, "OptItmObjDefinitionsOccurrencesPosition", false );
            this.oCmpOptions.ItmObjDefinitions.Occurrences.AttrPlace    = getProfileBool( gs_Section, "OptItmObjDefinitionsOccurrencesAttrPlace", false );
            
            this.oCmpOptions.ItmCxnDefinitions.Checked                  = getProfileBool( gs_Section, "OptItmCxnDefinitionsChecked", true );
            this.oCmpOptions.ItmCxnDefinitions.Attributes               = getProfileBool( gs_Section, "OptItmCxnDefinitionsAttributes", true );
            this.oCmpOptions.ItmCxnDefinitions.Occurrences.Checked      = getProfileBool( gs_Section, "OptItmCxnDefinitionsOccurrencesChecked", true );
            this.oCmpOptions.ItmCxnDefinitions.Occurrences.Appearance   = getProfileBool( gs_Section, "OptItmCxnDefinitionsOccurrencesAppearance", false );
            this.oCmpOptions.ItmCxnDefinitions.Occurrences.Position     = getProfileBool( gs_Section, "OptItmCxnDefinitionsOccurrencesPosition", false );
            this.oCmpOptions.ItmCxnDefinitions.Occurrences.AttrPlace    = getProfileBool( gs_Section, "OptItmCxnDefinitionsOccurrencesAttrPlace", false );
            
            this.oCmpOptions.ItmGraphicObjects   = getProfileBool( gs_Section, "OptItmGraphicObjects", true );
            this.oCmpOptions.ItmOLEObjects       = getProfileBool( gs_Section, "OptItmOLEObjects", true );
            this.oCmpOptions.ItmFreeText         = getProfileBool( gs_Section, "OptItmFreeText", true );

            this.oCmpOptions.AddIdenticalAttr    = getProfileBool( gs_Section, "OptAddIdenticalAttr", false);
            this.oCmpOptions.AddAttrNumber      = Context.getProfileInt( gs_Section, "OptAddAttrNumber", Constants.AT_NAME);
            this.oCmpOptions.AddMatchCase        = getProfileBool( gs_Section, "OptAddMatchCase", false);
            this.oCmpOptions.AddLineBreaksSpaces = getProfileBool( gs_Section, "OptAddLineBreaksSpaces", false);
        }
    }
    
    // Cl_Function - StoreUISettings: Writes user settings into profile
    cl_UISettings.prototype.StoreUISettings     = function( ){
        Context.writeProfileString( gs_Section, "RefModel", transformModArrayToGUID( [this.RefModel] ) );
        //Page #11 - Only one model selected
        Context.writeProfileInt( gs_Section, "P11DBCompare", this.P11DBCompare );
        Context.writeProfileString( gs_Section, "P11DBName", this.P11DBName );
        Context.writeProfileInt( gs_Section, "P11ModCompare", this.P11ModCompare );
        Context.writeProfileInt( gs_Section, "P11AttrNumber", this.P11AttrNumber );
        writeProfileBool( gs_Section, "P11MatchCase", this.P11MatchCase );
        //SubPage #10 - Login into DB
        Context.writeProfileString( gs_Section, "P10Login", this.P10Login );
        // Context.writeProfileString( gs_Section, "P10Passwd", this.P10Passwd );
        //SubPage #100 - Login Options
        Context.writeProfileString( gs_Section, "P100Filter", ((this.P100Filter != null)?this.P100Filter.getGUID():gs_Empty) );
        Context.writeProfileInt( gs_Section, "P100Lang", this.P100Lang );
        Context.writeProfileInt( gs_Section, "P100DBContext", this.P100DBContext );
        Context.writeProfileInt( gs_Section, "P100ChListNum", this.P100ChListNum );
        //Page #12 - Versions to compare
        writeProfileBool( gs_Section, "P12Workspace", this.P12Workspace );
        writeProfileBool( gs_Section, "P12CurrVersion", this.P12CurrVersion );
        writeProfileBool( gs_Section, "P12ChangeList", this.P12ChangeList );
        Context.writeProfileString( gs_Section, "P12ChListVers", transformArrayToString( this.P12ChListVers ) );
        //Page #30 - Comparison options
        writeProfileBool( gs_Section, "OptCmpExistFirstMod", this.oCmpOptions.CmpExistFirstMod );
        writeProfileBool( gs_Section, "OptCmpExistSecondMod", this.oCmpOptions.CmpExistSecondMod );
        writeProfileBool( gs_Section, "OptCmpChangeBothMod", this.oCmpOptions.CmpChangeBothMod );

        writeProfileBool( gs_Section, "OptItmModProperties", this.oCmpOptions.ItmModProperties );
        writeProfileBool( gs_Section, "OptItmObjDefinitionsChecked", this.oCmpOptions.ItmObjDefinitions.Checked );
        writeProfileBool( gs_Section, "OptItmObjDefinitionsAttributes", this.oCmpOptions.ItmObjDefinitions.Attributes );
            writeProfileBool( gs_Section, "OptItmObjDefinitionsSystemAttributes", this.oCmpOptions.ItmObjDefinitions.SystemAttributes );
        writeProfileBool( gs_Section, "OptItmObjDefinitionsOccurrencesChecked", this.oCmpOptions.ItmObjDefinitions.Occurrences.Checked );
        writeProfileBool( gs_Section, "OptItmObjDefinitionsOccurrencesAppearance", this.oCmpOptions.ItmObjDefinitions.Occurrences.Appearance );
        writeProfileBool( gs_Section, "OptItmObjDefinitionsOccurrencesPosition", this.oCmpOptions.ItmObjDefinitions.Occurrences.Position );
        writeProfileBool( gs_Section, "OptItmObjDefinitionsOccurrencesAttrPlace", this.oCmpOptions.ItmObjDefinitions.Occurrences.AttrPlace );
                            
        writeProfileBool( gs_Section, "OptItmCxnDefinitionsChecked", this.oCmpOptions.ItmCxnDefinitions.Checked );
        writeProfileBool( gs_Section, "OptItmCxnDefinitionsAttributes", this.oCmpOptions.ItmCxnDefinitions.Attributes );
        writeProfileBool( gs_Section, "OptItmCxnDefinitionsOccurrencesChecked", this.oCmpOptions.ItmCxnDefinitions.Occurrences.Checked );
        writeProfileBool( gs_Section, "OptItmCxnDefinitionsOccurrencesAppearance", this.oCmpOptions.ItmCxnDefinitions.Occurrences.Appearance );
        writeProfileBool( gs_Section, "OptItmCxnDefinitionsOccurrencesPosition", this.oCmpOptions.ItmCxnDefinitions.Occurrences.Position );
        writeProfileBool( gs_Section, "OptItmCxnDefinitionsOccurrencesAttrPlace", this.oCmpOptions.ItmCxnDefinitions.Occurrences.AttrPlace );
        writeProfileBool( gs_Section, "OptItmGraphicObjects", this.oCmpOptions.ItmGraphicObjects );
        writeProfileBool( gs_Section, "OptItmOLEObjects", this.oCmpOptions.ItmOLEObjects );
        writeProfileBool( gs_Section, "OptItmFreeText", this.oCmpOptions.ItmFreeText );

        writeProfileBool( gs_Section, "OptAddIdenticalAttr", this.oCmpOptions.AddIdenticalAttr );
        Context.writeProfileInt( gs_Section, "OptAddAttrNumber", this.oCmpOptions.AddAttrNumber );
        writeProfileBool( gs_Section, "OptAddMatchCase", this.oCmpOptions.AddMatchCase );
        writeProfileBool( gs_Section, "OptAddLineBreaksSpaces", this.oCmpOptions.AddLineBreaksSpaces);
    }
    
    // Stores user made settings from Dialog window into oUsrSettings
    cl_UISettings.prototype.getDlgPage11    = function( dialog ){
        this.P11DBCompare   = dialog.getDlgValue( "grpDBOptions" );
        if( this.P11DBCompare == 1 ){
            this.P11DBName  = this.DBName( dialog.getDlgValue( "lstDBNames" ) );
        }
        this.P11ModCompare  = dialog.getDlgValue( "grpComparisionModels" );
        if( this.P11ModCompare == 2 ){
            this.P11AttrNumber  = this.getAttributes( dialog.getDlgValue( "lstAttrNames" ) );
        }
        this.P11MatchCase   = dialog.getDlgValue( "chkCaseSensitive" );
        
        this.oCmpOptions.MasterVariantComp = (this.P11ModCompare == 1); //Master/Variants?
    }
    
    // Set pre-Set values from registry to Dialog window
    cl_UISettings.prototype.setDlgPage11    = function( dialog ){
        dialog.setDlgText( "hid_Versionable", (this.RefVersioned == true?"true":"false") );
        dialog.setDlgText( "hid_MasterVariant", (this.oMasterVariant.HasMasterVariants() == true?"true":"false") );
        dialog.setDlgEnable( "hid_Versionable", false );
        dialog.setDlgVisible( "hid_Versionable", false );
        dialog.setDlgEnable( "hid_MasterVariant", false );
        dialog.setDlgVisible( "hid_MasterVariant", false );

        dialog.setDlgValue( "grpDBOptions", this.P11DBCompare );
        dialog.setDlgValue( "grpComparisionModels", this.P11ModCompare );

        dialog.setDlgEnable( "lstDBNames", false );
        dialog.setDlgEnable( "optIdentGUID", false);
        dialog.setDlgEnable( "lstAttrNames", false );
        dialog.setDlgValue( "lstAttrNames", this.getAttrIdx( this.P11AttrNumber ) );        
        dialog.setDlgEnable( "chkCaseSensitive", false );
        dialog.setDlgEnable( "optMastVarModels", false );
/*
        if( this.RefVersioned ){// Selected reference model is versionable
            dialog.setDlgEnable( "optVersRefModels", true );
        } else {// Selected reference model is not versionable
            dialog.setDlgEnable( "optVersRefModels", false );
            if (this.P11ModCompare == 0) {
                dialog.setDlgValue( "grpComparisionModels", 1 );
            }
        }
*/
        // If Profile sets Within DB - pre-set options
        if( dialog.getDlgValue( "grpDBOptions" ) == 0 ){
            dialog.setDlgEnable( "optMastVarModels", true );
        }        
        // If Profile sets Cross DB - pre-set options
        if( dialog.getDlgValue( "grpDBOptions" ) == 1 ){
            dialog.setDlgEnable( "lstDBNames", true );
            dialog.setDlgValue( "lstDBNames", this.getDBNameIdx( this.P11DBName ) );
//            if( this.oMasterVariant.HasMasterVariants() ){// Enable only if model has Master or Variants
                dialog.setDlgEnable( "optIdentGUID", true );
//            }
        }
        // Set Matching values for case sensitive search on attributes
        if( dialog.getDlgValue( "grpComparisionModels" ) == 2 ){
            dialog.setDlgEnable( "chkCaseSensitive", true );
            dialog.setDlgValue( "chkCaseSensitive", this.P11MatchCase );
            dialog.setDlgEnable( "lstAttrNames", true );
            dialog.setDlgValue( "lstAttrNames", this.getAttrIdx( this.P11AttrNumber ) );
        }
    }
    // Stores user made settings from Dialog window into oUsrSettings
    cl_UISettings.prototype.getDlgPage10    = function( dialog, oSettings ){
        this.P10Login   = dialog.getDlgText( "log_Login" );
        this.P10Passwd  = dialog.getDlgText( "log_Password" );
        if( (this.P10Login.length() > 0) && (this.P10Passwd.length() > 0) ){
            var oDB = ArisData.openDatabase( this.P11DBName, this.P10Login, this.P10Passwd, gs_Filter, gn_Lang, true );// OpenDB
            if (oDB != null && oDB.IsValid()) {
                this.aDBLangs   = oDB.LanguageList();// Get Languages
                if( this.aDBLangs != null ) this.aDBLangs.sort( sortLangNames );// Sort Languages
                if( oDB.isVersionable() ){// Get Versions
                    var compVersioning  = Context.getComponent("Versioning");
                    if( compVersioning != null ){
                        this.aChListInfos   = compVersioning.getChangelistInfos( oDB );
                        this.aChListInfos.sort( sortChListID );
                    }
                }
                oDB.close();
            }
        }
    }
    // Set pre-Set values from registry to Dialog window
    cl_UISettings.prototype.setDlgPage10    = function( dialog, oSettings ){
        if( this.P10Login != gs_Empty ){
            dialog.setDlgText( "log_Login", this.P10Login );
        }  else {
            var currUser    = ArisData.getActiveUser().Name( gn_Lang, true );
            if( isUserInDB( currUser, this.P11DBName ) ){
                dialog.setDlgText( "log_Login", currUser );
            }
        }
        dialog.setDlgEnable( "OK", false );
    }
    // Stores user made settings from Dialog window into oUsrSettings
    cl_UISettings.prototype.getDlgPage100   = function( dialog, oSettings ){
        if( dialog.getDlgEnable( "lstDBChListFilled" ) ){
            this.P100ChListNum  = dialog.getDlgValue( "lstDBChListFilled" );
        } else {
            this.P100ChListNum  = -1;
        }
        this.P100DBContext  = dialog.getDlgValue("lstDBContext");
        this.P100Filter     = this.aFilters[ dialog.getDlgValue("lstDBFilters") ];
        this.P100Lang       = this.aDBLangs[ dialog.getDlgValue("lstDBLang") ].LocaleId();
    }
    // Set pre-Set values from registry to Dialog window
    cl_UISettings.prototype.setDlgPage100   = function( dialog, oSettings ){
        dialog.setDlgEnable( "lstDBChListFilled", false );
        dialog.setDlgVisible( "lstDBChListFilled", false );
        dialog.setDlgEnable( "lstDBChListEmpty", false );
        dialog.setDlgVisible( "lstDBChListEmpty", true );

        dialog.setDlgValue( "lstDBFilters", this.getFilterNameIdx( oSettings.oActDB.ActiveFilter().Name( gn_Lang ) ) );
        dialog.setDlgValue( "lstDBLang", this.getLangNamesIdx( gn_Lang ) );
    }
    
    // Stores user made settings from Dialog window into oUsrSettings
    cl_UISettings.prototype.getDlgPage12   = function( dialog, oSettings ){
        var nVersion = dialog.getDlgValue( "chkVersion" );
        this.P12Workspace   = (nVersion == 0);
        this.P12CurrVersion = (nVersion == 1);
        this.P12ChangeList  = (nVersion == 2);
        this.P12ChListVers  = _getTableValues( dialog.getDlgListBoxArray( "tabModVersions" ) );

        var oDB = oSettings.oActDB;
        var oModel = this.RefModel;
        
        if( this.P11DBCompare == 1 && this.CompDB != null) {
            // AGA-18574 Search for versions in comparison database
            oDB = this.CompDB;
            oModel = this.CompDB.FindGUID(this.RefModel.GUID());
        }
        
        // AGA-4461
        if (this.P12Workspace) {
            this.CompModels = getWorkspaceModel( oDB, oModel);
            return -1;
        }
        if (this.P12CurrVersion) {
            this.CompModels = getCurrentModelVersion( oDB, oModel);
            return -1;
        }
        if( this.P12ChangeList && (this.P12ChListVers != null) && (this.P12ChListVers.length > 0) ){
            this.CompModels = getModelSpecialRevisions( oDB, oModel, this.P12ChListVers );// Get model revisions
            if( (this.CompModels == null) || (this.CompModels == gn_errNoCmp) || (this.CompModels == gn_errNoDB) ){
                return this.CompModels;
            }
            return -1;
        }
        return gn_errNoCmp;
        
        function _getTableValues( aTableValues ){
            var nRows   = parseInt( aTableValues.length/ 6 );
            var aOut    = new Array();
            for( var i=0; i<nRows; i++ ){
                if( (aTableValues[i*6] == true) ){
                    aOut.push( aTableValues[(i*6)+2] );
                }
            }//END::for_i
            return aOut;
        }
    }
    // Set pre-Set values from registry to Dialog window
    cl_UISettings.prototype.setDlgPage12   = function( dialog, oSettings ){
        if(/* (this.P11DBCompare != 0) ||*/ (!this.RefVersioned) ) { return gn_errNoCmp; }
        
        var nVersion = 0; // this.P12Workspace
        if (this.P12CurrVersion) nVersion = 1;
        if (this.P12ChangeList) nVersion = 2;
        dialog.setDlgValue( "chkVersion", nVersion );

        dialog.setDlgListBoxArray( "tabModVersions", _setTableValues( (this.aModVersions != null?this.aModVersions:[]) ) );
        
        dialog.setDlgEnable( "tabModVersions", this.P12ChangeList );
        dialog.setDlgEnable( "btn_DeselectAll", this.P12ChangeList );
        dialog.setDlgEnable( "btn_SelectAll", this.P12ChangeList );
        dialog.setDlgEnable( "OK", false );
        if( nVersion == 0 || nVersion == 1 ){       // BLUE-11018 Enable OK button if 'Workspace' is selected
            dialog.setDlgEnable( "OK", true );
        }
        return -1;

        function _setTableValues( aVersions ){
            var aTableValues    = Array();// Row = aVersions.length; Column = 6
            
            if( aVersions != null ){
                for( var i=0; i<aVersions.length; i++ ){
                    aTableValues.push( false );// Column - Selection {Only checkbox column}
                    aTableValues.push( aVersions[i].getRevisionNumber() );// Column - Version
                    aTableValues.push( aVersions[i].getChangeListInfo().getID() );// Column - Changelist number
                    aTableValues.push( aVersions[i].getChangeListInfo().getSubmitTimeGMT0() );// Column - Versioning time
                    aTableValues.push( aVersions[i].getChangeListInfo().getDescription() );// Column - Description
                    aTableValues.push( aVersions[i].getChangeListInfo().getUser() );// Column - User
                }//END::for_i
            }
            return aTableValues;
        }
    }
    
    // Stores user made settings from Dialog window into oUsrSettings
    cl_UISettings.prototype.getDlgPage13    = function( dialog, oSettings ){
        this.CompModels = _getTableValues( this.oMasterVariant.outModels(), dialog.getDlgListBoxArray( "tabModels" ) );
        if( this.CompModels.length > 0 ) { return -1; }
        return gn_errNoCmp;
        
        function _getTableValues( aModels, aTableValues ){
            var aOut    = new Array();
            if( (aModels != null) && (aModels.length > 0) && (aTableValues != null) && (aTableValues.length > 0) ){
                var nRows   = parseInt( aTableValues.length/ 4 );
                for( var i=0; i<nRows; i++ ){
                    if( (aTableValues[i*4] == true) ){
                        aOut.push( aModels[i]);
                    }
                }//END::for_i
            }
            return aOut;
        }
    }
    // Set pre-Set values from registry to Dialog window
    cl_UISettings.prototype.setDlgPage13    = function( dialog, oSettings ){
        if( !this.oMasterVariant.HasMasterVariants() ) { return gn_errNoCmp; }
        
        dialog.setDlgEnable( "btn_DeselectAll", false );
        dialog.setDlgEnable( "btn_SelectAll", false );
        dialog.setDlgEnable( "tabModels", true );
        dialog.setDlgEnable( "OK", false );
        dialog.setDlgListBoxArray( "tabModels", _setTableValues( this.oMasterVariant ) );
        if( dialog.getDlgListBoxArray( "tabModels" ).length >= 4){
            dialog.setDlgEnable( "btn_DeselectAll", true );
            dialog.setDlgEnable( "btn_SelectAll", true );
        }
        return -1;
        
        function _setTableValues( aVariants ){
            var aTableValues    = Array();// Row = aVersions.length; Column = 4
            
            if( (aVariants != null) && (aVariants.HasMasterVariants()) ){
                var aModels = aVariants.outModels();
                for( var i=0; i<aModels.length; i++ ){
                    aTableValues.push( false );// Column - Selection {Only checkbox column}
                    aTableValues.push( getModelName(aModels[i], gn_Lang) );// Column - Name
                    aTableValues.push( (aModels[i].IsVariant()?"Variant":"Master")  );// Column - Type
                    aTableValues.push( aModels[i].Group().Name( gn_Lang ) );// Column - Group
                }//END::for_i
            }
            return aTableValues;
        }
    }
    
    // Stores user made settings from Dialog window into oUsrSettings
    cl_UISettings.prototype.getDlgPage14    = function( dialog, oSettings ){
        this.CompModels = _getTableValues( dialog.getDlgListBoxArray( "tabModels" ), this.aTempArray );
        if( this.CompModels.length > 0 ) { return -1; }
        return gn_errNoCmp;
        
        function _getTableValues( aTableValues, aModels ){
            var nRows   = parseInt( aTableValues.length/ 4 );
            var aOut    = new Array();
            if( aModels != null ){
                for( var i=0; i<nRows; i++ ){
                    if( (aTableValues[i*4] == true) ){
                        aOut.push( aModels[i]);
                    }
                }//END::for_i
            }
            return aOut;
        }
    }
    // Set pre-Set values from registry to Dialog window
    cl_UISettings.prototype.setDlgPage14    = function( dialog, oSettings ){
        this.aTempArray    = this.getModelsByAttr();// This variable is used for temporary storage of all possible models which are imput for user Dialog
        if( (this.aTempArray == null) || (this.aTempArray.length < 1) ) { return gn_errNoCmp; }

        dialog.setDlgEnable( "btn_DeselectAll", false );
        dialog.setDlgEnable( "btn_SelectAll", false );
        dialog.setDlgEnable( "tabModels", true );
        dialog.setDlgEnable( "OK", false );
        dialog.setDlgListBoxArray( "tabModels", _setTableValues( this.aTempArray ) );
        if( dialog.getDlgListBoxArray( "tabModels" ).length >= 4){
            dialog.setDlgEnable( "btn_DeselectAll", true );
            dialog.setDlgEnable( "btn_SelectAll", true );
        }
        return -1;

        function _setTableValues( aModels ){
            var aTableValues    = Array();// Row = aVersions.length; Column = 4
            
            if( (aModels != null) && (aModels.length > 0) ){
                for( var i=0; i<aModels.length; i++ ){
                    aTableValues.push( false );// Column - Selection {Only checkbox column}
                    aTableValues.push( getModelName(aModels[i], gn_Lang) );// Column - Name
                    aTableValues.push( aModels[i].Type()  );// Column - Type
                    aTableValues.push( aModels[i].Group().Name( gn_Lang ) );// Column - Group
                }//END::for_i
            }
            return aTableValues;
        }
    }
    
    // Stores user made settings from Dialog window into oUsrSettings
    cl_UISettings.prototype.getDlgPage20    = function( dialog, oSettings ){
        this.RefModel   = this.getStartingModelByIdx( dialog.getDlgValue( "lstModels" ) );
        this.CompModels = this.filterStartingModelsByIdx( dialog.getDlgValue( "lstModels" ) );
        if( (this.RefModel == null) || (this.CompModels == null) || (this.CompModels.length < 1) ) { return gn_errNoCmp; }
        return -1;
    }
    // Set pre-Set values from registry to Dialog window
    cl_UISettings.prototype.setDlgPage20    = function( dialog, oSettings ){
        dialog.setDlgListBoxArray( "lstModels", this.getStartingModelsNames() );
        dialog.setDlgEnable( "OK", false );
        if( (dialog.getDlgListBoxArray( "lstModels" ) != null) && (this.RefModel != null) && (dialog.getDlgListBoxArray( "lstModels" ).length > 0) ){
            dialog.setDlgEnable( "OK", true );
            dialog.setDlgValue( "lstModels", this.getStartingModelsIdx( getModelName(this.RefModel, gn_Lang) ) );
        } else if( (dialog.getDlgListBoxArray( "lstModels" ) != null) && (dialog.getDlgListBoxArray( "lstModels" ).length > 0) ){
            dialog.setDlgEnable( "OK", true );
            dialog.setDlgValue( "lstModels", 0 );
        }
    }
    
    // Stores user made settings from Dialog window into oUsrSettings
    cl_UISettings.prototype.getDlgPage30    = function( dialog, oSettings ){
        this.oCmpOptions.CmpExistFirstMod    = (dialog.getDlgValue( "chkFirstModel" ) == 1)? true: false;
        this.oCmpOptions.CmpExistSecondMod   = (dialog.getDlgValue( "chkSecondModel" ) == 1)? true: false;
        this.oCmpOptions.CmpChangeBothMod    = (dialog.getDlgValue( "chkBothModels" ) == 1)? true: false;

        this.oCmpOptions.ItmModProperties    = (dialog.getDlgValue( "chkModelProperties" ) == 1)? true: false;
        this.oCmpOptions.ItmObjDefinitions.Checked          = (dialog.getDlgValue( "chkObjDefinition" ) == 1)? true: false;
        this.oCmpOptions.ItmObjDefinitions.Attributes       = (dialog.getDlgValue( "chkObjDefAttributes" ) == 1)? true: false;
        this.oCmpOptions.ItmObjDefinitions.SystemAttributes = (dialog.getDlgValue( "chkObjDefSystemAttributes" ) == 1)? true: false;
        this.oCmpOptions.ItmObjDefinitions.Occurrences.Checked       = (dialog.getDlgValue( "chkObjOccs" ) == 1)? true: false;
        this.oCmpOptions.ItmObjDefinitions.Occurrences.Appearance    = (dialog.getDlgValue( "chkAppearSymbol" ) == 1)? true: false;
        this.oCmpOptions.ItmObjDefinitions.Occurrences.Position      = (dialog.getDlgValue( "chkPositionSize" ) == 1)? true: false;
        this.oCmpOptions.ItmObjDefinitions.Occurrences.AttrPlace     = (dialog.getDlgValue( "chkAttrPlacement" ) == 1)? true: false;
        
        this.oCmpOptions.ItmCxnDefinitions.Checked       = (dialog.getDlgValue( "chkCxnsDefinition" ) == 1)? true: false;
        this.oCmpOptions.ItmCxnDefinitions.Attributes    = (dialog.getDlgValue( "chkCxnDefAttributes" ) == 1)? true: false;
        this.oCmpOptions.ItmCxnDefinitions.Occurrences.Checked       = (dialog.getDlgValue( "chkCxnOccs" ) == 1)? true: false;
        this.oCmpOptions.ItmCxnDefinitions.Occurrences.Appearance    = (dialog.getDlgValue( "chkCxnAppearance" ) == 1)? true: false;
        this.oCmpOptions.ItmCxnDefinitions.Occurrences.Position      = (dialog.getDlgValue( "chkCxnAnchorPoints" ) == 1)? true: false;
        this.oCmpOptions.ItmCxnDefinitions.Occurrences.AttrPlace     = (dialog.getDlgValue( "chkCxnAttrPlacement" ) == 1)? true: false;
        
        this.oCmpOptions.ItmGraphicObjects   = (dialog.getDlgValue( "chkGraphicObjects" ) == 1)? true: false;
        this.oCmpOptions.ItmOLEObjects       = (dialog.getDlgValue( "chkOLEObjects" ) == 1)? true: false;
        this.oCmpOptions.ItmFreeText         = (dialog.getDlgValue( "chkFFText" ) == 1)? true: false;

        this.oCmpOptions.AddIdenticalAttr    = (dialog.getDlgValue( "chkObjIdenticAttrs" ) == 1)? true: false;
        if( this.oCmpOptions.AddIdenticalAttr ){
            this.oCmpOptions.AddAttrNumber      = this.getAttributes( dialog.getDlgValue( "lstAttrNames" ) );
            this.oCmpOptions.AddMatchCase        = (dialog.getDlgValue( "chkCaseSensitive" ) == 1)? true: false;
            this.oCmpOptions.AddLineBreaksSpaces = (dialog.getDlgValue( "chkInclBreaksSpaces" ) == 1)? true: false;
        }
    }
    // Set pre-Set values from registry to Dialog window
    cl_UISettings.prototype.setDlgPage30    = function( dialog, oSettings ){
        dialog.setDlgValue( "chkFirstModel", this.oCmpOptions.CmpExistFirstMod );
        dialog.setDlgValue( "chkSecondModel", this.oCmpOptions.CmpExistSecondMod );
        dialog.setDlgValue( "chkBothModels", this.oCmpOptions.CmpChangeBothMod );

        dialog.setDlgValue( "chkModelProperties", this.oCmpOptions.ItmModProperties );
        dialog.setDlgValue( "chkObjDefinition", this.oCmpOptions.ItmObjDefinitions.Checked );
        dialog.setDlgValue( "chkObjDefAttributes", this.oCmpOptions.ItmObjDefinitions.Attributes );
        dialog.setDlgValue( "chkObjDefSystemAttributes", this.oCmpOptions.ItmObjDefinitions.SystemAttributes );        
        dialog.setDlgValue( "chkObjOccs", this.oCmpOptions.ItmObjDefinitions.Occurrences.Checked );
        dialog.setDlgValue( "chkAppearSymbol", this.oCmpOptions.ItmObjDefinitions.Occurrences.Appearance );
        dialog.setDlgValue( "chkPositionSize", this.oCmpOptions.ItmObjDefinitions.Occurrences.Position );
        dialog.setDlgValue( "chkAttrPlacement", this.oCmpOptions.ItmObjDefinitions.Occurrences.AttrPlace );
        
        dialog.setDlgValue( "chkCxnsDefinition", this.oCmpOptions.ItmCxnDefinitions.Checked );
        dialog.setDlgValue( "chkCxnDefAttributes", this.oCmpOptions.ItmCxnDefinitions.Attributes );
        dialog.setDlgValue( "chkCxnOccs", this.oCmpOptions.ItmCxnDefinitions.Occurrences.Checked );
        dialog.setDlgValue( "chkCxnAppearance", this.oCmpOptions.ItmCxnDefinitions.Occurrences.Appearance );
        dialog.setDlgValue( "chkCxnAnchorPoints", this.oCmpOptions.ItmCxnDefinitions.Occurrences.Position );
        dialog.setDlgValue( "chkCxnAttrPlacement", this.oCmpOptions.ItmCxnDefinitions.Occurrences.AttrPlace );
        
        dialog.setDlgValue( "chkGraphicObjects", this.oCmpOptions.ItmGraphicObjects );
        dialog.setDlgValue( "chkOLEObjects", this.oCmpOptions.ItmOLEObjects );
        dialog.setDlgValue( "chkFFText", this.oCmpOptions.ItmFreeText );

        dialog.setDlgValue( "chkObjIdenticAttrs", this.oCmpOptions.AddIdenticalAttr );
        dialog.setDlgValue( "lstAttrNames", this.getAttrIdx( this.oCmpOptions.AddAttrNumber ) );
        dialog.setDlgValue( "chkCaseSensitive", this.oCmpOptions.AddMatchCase );
        dialog.setDlgValue( "chkInclBreaksSpaces", this.oCmpOptions.AddLineBreaksSpaces );
        // Enabling checkboxes
        dialog.setDlgEnable( "lstAttrNames", this.oCmpOptions.AddIdenticalAttr );
        dialog.setDlgEnable( "chkCaseSensitive", this.oCmpOptions.AddIdenticalAttr );
        dialog.setDlgEnable( "chkInclBreaksSpaces", this.oCmpOptions.AddIdenticalAttr );
    }
    // Stores settings via properties from Designer into oUsrSettings
    cl_UISettings.prototype.getSettingsFromDesigner = function( ){
        this.oCmpOptions.CmpExistFirstMod = getBoolPropertyValue("setItemExistingOnlyInFirstModel");
        this.oCmpOptions.CmpExistSecondMod = getBoolPropertyValue("setItemExistingOnlyInSecondModel");
        this.oCmpOptions.CmpChangeBothMod = getBoolPropertyValue("setModifiedItemsExistingInBothModel");

        this.oCmpOptions.ItmModProperties = getBoolPropertyValue("setModelProperties");
        
        this.oCmpOptions.ItmObjDefinitions.Checked = getBoolPropertyValue("setObjectDefinition");
        this.oCmpOptions.ItmObjDefinitions.Attributes = getBoolPropertyValue("setObjectAttributes");
        this.oCmpOptions.ItmObjDefinitions.SystemAttributes = getBoolPropertyValue("setObjectSystemAttributes");
        this.oCmpOptions.ItmObjDefinitions.Occurrences.Checked = getBoolPropertyValue("setObjectOccurrences");
        this.oCmpOptions.ItmObjDefinitions.Occurrences.Appearance = getBoolPropertyValue("setObjectAppearence");
        this.oCmpOptions.ItmObjDefinitions.Occurrences.Position = getBoolPropertyValue("setObjectPositionSize");
        this.oCmpOptions.ItmObjDefinitions.Occurrences.AttrPlace = getBoolPropertyValue("setObjectAttributePlacements");
        
        this.oCmpOptions.ItmCxnDefinitions.Checked = getBoolPropertyValue("setConnectionDefinition");
        this.oCmpOptions.ItmCxnDefinitions.Attributes = getBoolPropertyValue("setConnectionAttributes");
        this.oCmpOptions.ItmCxnDefinitions.Occurrences.Checked = getBoolPropertyValue("setConnectionOccurrences");
        this.oCmpOptions.ItmCxnDefinitions.Occurrences.Appearance = getBoolPropertyValue(" setConnectionAppearences");
        this.oCmpOptions.ItmCxnDefinitions.Occurrences.Position = getBoolPropertyValue("setConnectionPoints");
        this.oCmpOptions.ItmCxnDefinitions.Occurrences.AttrPlace = getBoolPropertyValue("setConnectionAttributePlacements");
        
        this.oCmpOptions.ItmGraphicObjects = getBoolPropertyValue("setGfxObjects");
        this.oCmpOptions.ItmOLEObjects = getBoolPropertyValue("setOleObjects");
        this.oCmpOptions.ItmFreeText = getBoolPropertyValue("setFreeformtTexts");
        
        var sAttrIdentify = getAttrPropertyValue("setAttributeIdentify");
        this.oCmpOptions.AddIdenticalAttr = (parseInt(sAttrIdentify) > 0);
        if( this.oCmpOptions.AddIdenticalAttr ){
            this.oCmpOptions.AddAttrNumber = sAttrIdentify;
            this.oCmpOptions.AddMatchCase = getBoolPropertyValue("setCaseSensitive");
            this.oCmpOptions.AddLineBreaksSpaces = getBoolPropertyValue("setIncludeLineBreaks");
        }
        this.oCmpOptions.MasterVariantComp = getBoolPropertyValue("setMasterVariantComparison");

        function getAttrPropertyValue(p_sPropKey) {
            var property = Context.getProperty(p_sPropKey);
            if (property != null) {
                return property;
            }
            return "-1";
        }
        
        function getBoolPropertyValue(p_sPropKey) {
            var property = Context.getProperty(p_sPropKey);
            if (property != null) {
                return (StrComp(property, "true") == 0);
            }
            return false;
        }
    }
}//END::cl_UISettings()
// END::Classes------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

// Output part-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
function defineStyles( p_Output ){
    // DO NOT TRANSLATE THESE STRINGS - MUST BE EXACTLY LIKE IT IS!!!
    p_Output.DefineF("TEXT_SUMM_HEADER", getString("TEXT_FONT_DEFAULT"), 11, CC_WHITE, CC_DARK_GREEN,  Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VBOTTOM | Constants.FMT_EXCELMODIFY, 1, 1, 0, 0, 2, 1);
    p_Output.DefineF("TEXT_STYLE_BOLD", getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_WHITE,  Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VBOTTOM | Constants.FMT_EXCELMODIFY, 1, 1, 0, 0, 2, 1);
    p_Output.DefineF("TEXT_STYLE_DEFAULT", getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_WHITE,  Constants.FMT_LEFT | Constants.FMT_VBOTTOM | Constants.FMT_EXCELMODIFY, 1, 1, 0, 0, 2, 1);
    p_Output.DefineF("TEXT_STYLE_BLUE", getString("TEXT_FONT_DEFAULT"), 10, CC_BLUE, CC_WHITE,  Constants.FMT_LEFT | Constants.FMT_VBOTTOM | Constants.FMT_EXCELMODIFY, 1, 1, 0, 0, 2, 1);
    p_Output.DefineF("TEXT_STYLE_RED", getString("TEXT_FONT_DEFAULT"), 10, CC_RED, CC_WHITE,  Constants.FMT_LEFT | Constants.FMT_VBOTTOM | Constants.FMT_EXCELMODIFY, 1, 1, 0, 0, 2, 1);
    p_Output.DefineF("TEXT_STYLE_TRANSPARENT", getString("TEXT_FONT_DEFAULT"), 10, CC_TRANSPARENT, CC_TRANSPARENT,  Constants.FMT_LEFT | Constants.FMT_VBOTTOM | Constants.FMT_EXCELMODIFY, 1, 1, 0, 0, 2, 1);
    
    p_Output.DefineF("TEXT_CODE_GREEN", getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_GREEN,  Constants.FMT_LEFT | Constants.FMT_VBOTTOM | Constants.FMT_EXCELMODIFY, 1, 1, 0, 0, 2, 1);
    p_Output.DefineF("TEXT_CODE_RED", getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_RED,  Constants.FMT_LEFT | Constants.FMT_VBOTTOM | Constants.FMT_EXCELMODIFY, 1, 1, 0, 0, 2, 1);
    p_Output.DefineF("TEXT_CODE_YELLOW", getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_YELLOW,  Constants.FMT_LEFT | Constants.FMT_VBOTTOM | Constants.FMT_EXCELMODIFY, 1, 1, 0, 0, 2, 1);
    // DO NOT TRANSLATE THESE STRINGS - MUST BE EXACTLY LIKE IT IS!!!
}//END::defineStyles()

function setNewFrameStyle( p_Output, p_Style ){
    // Usage: Frames{0|1} [Bottom, Left, Right, Top]; p_Style example: [1,1,1,1]
    p_Output.ResetFrameStyle( );
    p_Output.SetFrameStyle( Constants.FRAME_BOTTOM,    p_Style[0] );
    p_Output.SetFrameStyle( Constants.FRAME_LEFT,      p_Style[1] );
    p_Output.SetFrameStyle( Constants.FRAME_RIGHT,     p_Style[2] );
    p_Output.SetFrameStyle( Constants.FRAME_TOP,       p_Style[3] );
}//END::setNewFrameStyle()

function addCell( p_Output, p_fStyle, p_Text, p_PerCnt, p_txtStyle ){
    // Usage example: addCell( p_Output, [0,1,1,0], "text", 1, 1, 25, getString("TEXT_STYLE_DEFAULT") );
    if( p_fStyle.length > 0 ){
        setNewFrameStyle( p_Output, p_fStyle );
    }
    p_Output.TableCellF( p_Text, p_PerCnt, p_txtStyle );
}//END::addCell()

function addGraphic( p_Output, p_fStyle, p_Text, p_Picture, p_PerCnt, p_txtStyle ){
    var aPicSize    = resizePicture( p_Output, p_Picture, [200,200]);

    addCell( p_Output, p_fStyle, p_Text, p_PerCnt, p_txtStyle );
    p_Output.OutGraphic( p_Picture, -1, aPicSize["WIDTH"], aPicSize["HEIGHT"] );
}//END::addGraphic()

function addEmptyTableRow( p_Output, p_Num ){
    var aStyle  = [0,0,0,0];
    if( (p_Output == null) || (p_Num == null) ) return;
    p_Num   = (p_Num < 1)? 1: p_Num;
    
    for(var i=0; i<p_Num; i++){
        p_Output.TableRow();
        addCell( p_Output, aStyle, "", 35, "TEXT_STYLE_TRANSPARENT" );
        addCell( p_Output, aStyle, "", 20, "TEXT_STYLE_TRANSPARENT" );
        addCell( p_Output, aStyle, "", 20, "TEXT_STYLE_TRANSPARENT" );
        addCell( p_Output, aStyle, "", 25, "TEXT_STYLE_TRANSPARENT" );
    }
}//END::addEmptyTableRow()

function createSummaryStatistics( p_Output, oComparisionSet ){
    p_Output.BeginTable( 100, CC_BLACK, CC_WHITE, Constants.FMT_VCENTER | Constants.FMT_REPEAT_HEADER, 0 );
    
    // Output Header with: Name, DB, Server, Path
    p_Output.TableRow( );
        addCell( p_Output, [1,1,1,1], getString("TEXT_NAME_TAB"), 35, "TEXT_SUMM_HEADER" );
        addCell( p_Output, [1,1,1,1], getString("TEXT_DB"), 20, "TEXT_SUMM_HEADER" );
        addCell( p_Output, [1,1,1,1], getString("TEXT_SERVER"), 20, "TEXT_SUMM_HEADER" );
        addCell( p_Output, [1,1,1,1], getString("TEXT_PATH"), 25, "TEXT_SUMM_HEADER" );
    var aModels = oComparisionSet.aModels;
    for( var i=0; i<aModels.length; i++ ){// Output Models list...
        var nStyle  = (i==0)?"TEXT_STYLE_BOLD":"TEXT_STYLE_DEFAULT";
        p_Output.TableRow( );
            addCell( p_Output, [1,1,1,1], getModelName(aModels[i], gn_Lang), 35, nStyle );
//          addCell( p_Output, [1,1,1,1], _getModelDB( i, oComparisionSet ).Name( gn_Lang ), 20, nStyle );
            addCell( p_Output, [1,1,1,1], aModels[i].Database().Name( gn_Lang ), 20, nStyle );              // BLUE-9288
            addCell( p_Output, [1,1,1,1], _getModelDB( i, oComparisionSet ).ServerName(), 20, nStyle );
            addCell( p_Output, [1,1,1,1], aModels[i].Group( ).Path( gn_Lang ), 25, nStyle );
    }//END::for_i
    
    addEmptyTableRow( p_Output, 2 );
    
    // Output Statistics Header... Comparison settings, Settings, Results
    p_Output.TableRow( );
        addCell( p_Output, [1,1,1,1], getString("TEXT_COMP_SETTINGS"), 35, "TEXT_SUMM_HEADER" );
        addCell( p_Output, [1,1,1,1], getString("TEXT_SETTINGS"), 20, "TEXT_SUMM_HEADER" );
        addCell( p_Output, [1,1,1,1], getString("TEXT_RESULTS"), 20, "TEXT_SUMM_HEADER" );
        addCell( p_Output, [0,0,0,0], "", 25, "TEXT_STYLE_TRANSPARENT" );
    // Output Statistics...
    oComparisionSet.outputStatistics( p_Output, "Criterion", getString("TEXT_MODCOMP_CRITERION") );
    oComparisionSet.outputStatistics( p_Output, "AddIdenticalAttr", getString("TEXT_MATCHING_OBJECTS") );

    oComparisionSet.outputStatistics( p_Output, "CmpExistFirstMod", getString("TEXT_ITEM_EXIST_REF_MOD") );
    oComparisionSet.outputStatistics( p_Output, "CmpExistSecondMod", getString("TEXT_ITEM_EXIST_COMP_MOD") );
    oComparisionSet.outputStatistics( p_Output, "CmpChangeBothMod", getString("TEXT_ITEM_ALL_MODELS") );
    oComparisionSet.outputStatistics( p_Output, "ItmModProperties", getString("TEXT_MODEL_PROPERTIES") );

    oComparisionSet.outputStatistics( p_Output, "ItmObjDefinitions", getString("TEXT_OBJECT_DEF") );
        oComparisionSet.outputStatistics( p_Output, "ItmObjAttributes", getString("TEXT_OBJECT_ATTRS") );
        oComparisionSet.outputStatistics( p_Output, "ItmObjOccurrences", getString("TEXT_OBJ_OCCU") );
        oComparisionSet.outputStatistics( p_Output, "ItmObjAppearance", getString("TEXT_APPEAR_SYMBOL") );
        oComparisionSet.outputStatistics( p_Output, "ItmObjPosition", getString("TEXT_POSITION_SIZE") );
        oComparisionSet.outputStatistics( p_Output, "ItmObjAttrPlace", getString("TEXT_ATTR_PLACEMENT") );
    oComparisionSet.outputStatistics( p_Output, "ItmCxnDefinitions", getString("TEXT_CONNECTION_DEFS") );
        oComparisionSet.outputStatistics( p_Output, "ItmCxnAttributes", getString("TEXT_CONNECTION_ATTRS") );
        oComparisionSet.outputStatistics( p_Output, "ItmCxnOccurrences", getString("TEXT_CONNECTION_OCCUS") );
        oComparisionSet.outputStatistics( p_Output, "ItmCxnAppearance", getString("TEXT_CONNECTION_APPEAR") );
        oComparisionSet.outputStatistics( p_Output, "ItmCxnPosition", getString("TEXT_CONNECTION_POINTS") );
        oComparisionSet.outputStatistics( p_Output, "ItmCxnAttrPlace", getString("TEXT_ATTR_PLACEMENTS") );

    oComparisionSet.outputStatistics( p_Output, "ItmGraphicObjects", getString("TEXT_GRAPHIC_OBJ") );
    oComparisionSet.outputStatistics( p_Output, "ItmOLEObjects", getString("TEXT_OLE_OBJ") );
    oComparisionSet.outputStatistics( p_Output, "ItmFreeText", getString("TEXT_FREE_TEXT") );
        
    p_Output.EndTable( getString("TABNAME_SUMMARY"), 100, getString("TEXT_FONT_DEFAULT"), 8, CC_TRANSPARENT, CC_TRANSPARENT, Constants.FILLTYPE_SOLID, Constants.FMT_LEFT, 0);
    
    function _getModelDB( Flag, oComparisionSet ){
        if( (Flag != null) && (Flag != 0) ){
            if( oComparisionSet.nDBCompare == 1 ){
                return oComparisionSet.oCompDB;
            }
        }
        return oComparisionSet.oActDB;
    }//END::_getModelDB()
}//END::createSummaryStatistics()


function createDetailedOutput( p_Output, oComparisionSet, aComparisonTable ){
    p_Output.BeginTable( 100, CC_BLACK, CC_WHITE, Constants.FMT_VCENTER | Constants.FMT_REPEAT_HEADER, 0 );
    
    // Output Header with: Element, Type, Difference, Difference Details, Model Names
    p_Output.TableRow( );
        addCell( p_Output, [1,1,1,1], getString("TEXT_ELEMENT"), 15, "TEXT_SUMM_HEADER" );
        addCell( p_Output, [1,1,1,1], getString("TEXT_TYPE_TAB"), 15, "TEXT_SUMM_HEADER" );
        addCell( p_Output, [1,1,1,1], getString("TEXT_DIFFERENCE"), 15, "TEXT_SUMM_HEADER" );
        addCell( p_Output, [1,1,1,1], getString("TEXT_DIFF_DETAILS"), 25, "TEXT_SUMM_HEADER" );
        addCell( p_Output, [1,1,1,1], getModelName(oComparisionSet.oRefModel, gn_Lang), 15, "TEXT_SUMM_HEADER" );
    for( var i=0; i<gn_ModelCount; i++ ){
        addCell( p_Output, [1,1,1,1], getModelName(oComparisionSet.aCompModels[i], gn_Lang), 15, "TEXT_SUMM_HEADER" );
    }
    // Output data rows as Element, Type, Difference, Difference Details
    for( var iRow=0; iRow<aComparisonTable.length; iRow++ ){
        var rowObject   = aComparisonTable[iRow];
        var aElements   = rowObject.aElements;
        p_Output.TableRow( );
            addCell( p_Output, [1,1,1,1], rowObject.sName, 15, "TEXT_STYLE_DEFAULT" );
            addCell( p_Output, [1,1,1,1], rowObject.nType, 15, "TEXT_STYLE_DEFAULT" );// ArisData.ActiveFilter().ObjTypeName( rowObject.oRefObj.TypeNum() )
            addCell( p_Output, [1,1,1,1], ((rowObject.nDiffType == Constants.MODCOMP_DIFF_BOTH)?getString("TEXT_DIFFERENCE"):getString("TEXT_EXISTENCE")), 15, "TEXT_STYLE_DEFAULT" );
            addCell( p_Output, [1,1,1,1], rowObject.sDiffDetails, 25, "TEXT_STYLE_DEFAULT" );
        // Output column information - each column is one comparison model
        for( var iCol=0; iCol<(gn_ModelCount+1); iCol++ ){
            var colObject   = aElements[iCol];
            var colValue = (colObject != null) ? _getColumnValue( colObject ) : _getColumnValue( aElements[0] ); // 'colObject == null' means no difference -> current value = value of reference (= aElements[0])
            addCell( p_Output, [1,1,1,1], cutMaxLength( colValue ), 15, _getColumnStyle( colObject ) );
        }//END::for_iCol
    }//END::for_iRow
    //addCell( p_Output, [1,1,1,1], commonUtils.attsall.formatString( "Comparison model @0", [i+1]), 15, "TEXT_SUMM_HEADER" );

    p_Output.EndTable( getString("TABNAME_COMP_DETAILS"), 100, getString("TEXT_FONT_DEFAULT"), 8, CC_TRANSPARENT, CC_TRANSPARENT, Constants.FILLTYPE_SOLID, Constants.FMT_LEFT, 0);
    
    function _getColumnValue( oElement ){
        if( oElement == null ){
            return getString("TEXT_DOES_NOT_EXIST");
        }
        if( oElement.nDiffType == Constants.MODCOMP_DIFF_BOTH && oElement.bSubChange ){
            if( oElement.oSubObj == null ){
                return getString("TEXT_NOT_MAINTAINED");
            } else {
                return getString("TEXT_MANTAINED");
            }
        }
        return oElement.sValue;
    }
    
    function _getColumnStyle( oElement ){
        if( oElement == null ){
//            return "TEXT_STYLE_RED";
            return "TEXT_STYLE_DEFAULT";
        }
        if( oElement.nDiffType == Constants.MODCOMP_DIFF_BOTH && oElement.bSubChange ){
            return "TEXT_STYLE_DEFAULT";
        }
        if( oElement.nDiffType == Constants.MODCOMP_DIFF_LEFTONLY || oElement.nDiffType == Constants.MODCOMP_DIFF_RIGHTONLY ){
            if( oElement.oObj == null ){
                return "TEXT_STYLE_RED";
            } else {
                return "TEXT_STYLE_BLUE";
            }
        }
        return "TEXT_STYLE_DEFAULT";
    }
}//END::createDetailedOutput()


function createComparisonStatements( p_Output ){
    p_Output.BeginTable( 100, CC_BLACK, CC_WHITE, Constants.FMT_VCENTER | Constants.FMT_REPEAT_HEADER, 0 );
    
    // Output Header with: Summary, Code in green
    p_Output.TableRow( );
        addCell( p_Output, [1,1,1,1], getString("TABNAME_SUMMARY"), 70, "TEXT_SUMM_HEADER" );
        addCell( p_Output, [1,1,1,1], getString("TEXT_CODE"), 30, "TEXT_SUMM_HEADER" );

    if (IGNORE_DUPLICATED_RESULTS) {
        // BLUE-23799 - Ignore duplicated entries in table 'Comparison result' (optional)
        var summaryMap = new java.util.HashMap();
        for (var i=0; i<ga_Summary.length; i++ ) {
            summaryMap.put(ga_Summary[i].saction + "#" + ga_Summary[i].stext, ga_Summary[i]);
        }
        ga_Summary = new Array();
        var it = summaryMap.values().iterator();
        while (it.hasNext()) {
            ga_Summary.push(it.next());
        }
    }        
        
    for (var i=0; i<ga_Summary.length; i++ ){
        p_Output.TableRow( );
            addCell( p_Output, [1,1,1,1], cutMaxLength( ga_Summary[i].stext ), 70, "TEXT_STYLE_DEFAULT" );
            addCell( p_Output, [1,1,1,1], ga_Summary[i].saction, 30, _getCodeCellStyle( ga_Summary[i].saction ) );
    }//END::for_i
    
    p_Output.EndTable( getString("TABNAME_COMP_STATEMENTS"), 100, getString("TEXT_FONT_DEFAULT"), 8, CC_TRANSPARENT, CC_TRANSPARENT, Constants.FILLTYPE_SOLID, Constants.FMT_LEFT, 0);
    
    function _getCodeCellStyle( saction ) {
        if (StrComp(saction, gs_Updated) ==  0) return "TEXT_CODE_YELLOW";
        if (StrComp(saction, gs_Created) ==  0) return "TEXT_CODE_GREEN"; 
        if (StrComp(saction, gs_Deleted) ==  0) return "TEXT_CODE_RED"; 
        return "TEXT_STYLE_DEFAULT";
    }//END::_getCodeCellStyle()
}//END::createComparisonStatements()

function createGraphicOutputPreparation( p_Output, oComparisionSet ){
    p_Output.BeginTable( 200, CC_BLACK, CC_WHITE, Constants.FMT_VCENTER | Constants.FMT_REPEAT_HEADER, 0 );
    
    // Output Header with models name
    var aModels = oComparisionSet.aModels;
    p_Output.TableRow( );
    for( var i=0; i<aModels.length; i++ ){
        addCell( p_Output, [1,1,1,1], getModelName(aModels[i], gn_Lang), 200/aModels.length, "TEXT_SUMM_HEADER" );
    }

    //name to be recognized by createGraphicOutputUsingExcel()
    p_Output.EndTable( getString("TABNAME_GRAPHICS"), 100, getString("TEXT_FONT_DEFAULT"), 8, CC_TRANSPARENT, CC_TRANSPARENT, Constants.FILLTYPE_SOLID, Constants.FMT_LEFT, 0);
}//END::createGraphicOutputPreparation()

function createGraphicOutputUsingExcel(p_Output, p_sFileName, oComparisonSet ){
    
    if(ga_ModelGraphic.length==0)
        return
    
    var XlsWorkbook = Context.createExcelWorkbook(p_sFileName, p_sFileName)
    var XlsSheet = null
    var aSheets = XlsWorkbook.getSheets()//.getName()
    for(var i=0; i<aSheets.length; i++)
    {
        if((""+aSheets[i].getName()) == getString("TABNAME_GRAPHICS") )
        {
            XlsSheet = aSheets[i]
            break;
        }
    }
    
    if(XlsSheet!=null)
    {
        var FULL_SIZE = 200.0; //see output cell command above
        var colWidtPixels  = FULL_SIZE / ga_ModelGraphic.length * 6.75 
                
        var initialRow = 1;        
        for (var i=0; i<ga_ModelGraphic.length; i++ ){
            
            ga_ModelGraphic[i].setZoom(100)
            var cellWidthPixels = colWidtPixels
            var nPicWidth   = ga_ModelGraphic[i].getWidth(Constants.SIZE_PIXEL);
            var zoom = cellWidthPixels / nPicWidth
            if(zoom>1)
                zoom = 1;
            
            var nPicHeight  = zoom * ga_ModelGraphic[i].getHeight(Constants.SIZE_LOMETRIC)
            var nPicWidth   = zoom * ga_ModelGraphic[i].getWidth(Constants.SIZE_LOMETRIC)
            
            try {
                //get image data
                var imageData = ga_ModelGraphic[i].getImageData( "emf" ) 
                XlsSheet.insertPicture(i, initialRow, imageData, Constants.XL_PICTURE_TYPE_EMF, Constants.XL_INSERT_PICTURE_EXPAND_COLUMN, nPicWidth/10.0, nPicHeight/10.0)
            } catch(e) {
                // BLUE-27808 - Write error message to xls if model couldn't be exported
                var sText = getString("TEXT_MODEL_NOT_EXPORTED") + "\n\n" + e.message;
                var xlsCell = XlsSheet.cell(i, initialRow);
                xlsCell.setCellValue(sText);
                xlsCell.getCellStyle().setWrapText(true);
            }
        }//END::for_i        
    }

    XlsWorkbook.write()
}//END::createGraphicOutputUsingExcel()

function cutMaxLength(sValue) { // AGG-11826 The maximum length of cell contents (text) is 32,767 characters 
    const MAX_LENGTH = 32767;
    var sNewValue = "" + sValue;
    if (sNewValue.length > MAX_LENGTH) {
        return sNewValue.substr(0, MAX_LENGTH);
    }
    return sValue;
}

function RGB(r, g, b) {
    return (new java.awt.Color(r/255.0,g/255.0,b/255.0,1)).getRGB() & 0xFFFFFF;
}//END::RGB()

// END::Output-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

function getModelTypesIncludingUserDefined_Array(p_aOrgModelTypeNums) {
    var aModelTypes = new Array();
    
    for (var i = 0; i < p_aOrgModelTypeNums.length; i++) { 
        aModelTypes = aModelTypes.concat(getModelTypesIncludingUserDefined(p_aOrgModelTypeNums[i]));
    }    
    return aModelTypes;
}

function getModelName(oModel, nLocale) {
    // AGA-11063
    var sName = oModel.Name(nLocale, true);
    
    var nVersion = oModel.Database().getVersion();
    if (nVersion != -1) {
        sName += " [" + nVersion + "]";
    }
    return sName;
}
