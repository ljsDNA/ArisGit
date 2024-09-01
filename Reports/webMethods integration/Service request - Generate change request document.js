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

//-------------------------------------------------------------------------------------------------
// Change request document; 2011/01/14;09:34
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// Pre-Run part------------------------------------------------------------------------------------
// DELETE AFTER COMPLETITION!!!
// Always uncomment in case of testing directly!!!
        // Context.setProperty( "ChangeDescription", "Some text passed to the script as property." );
        // Context.setProperty( "Models", "9g####4#####u##,79####4#####u##,31####4#####u##" );
        // Context.setProperty( "9g####4#####u##_LINK", "http://The link for starting the ARIS webstart client and open model 9g####4#####u##_LINK" );
        // Context.setProperty( "79####4#####u##_LINK", "http://The link for starting the ARIS webstart client and open model 79####4#####u##_LINK" );
        // Context.setProperty( "31####4#####u##_LINK", "http://The link for starting the ARIS webstart client and open model 31####4#####u##_LINK" );
// DELETE AFTER COMPLETITION!!!
// END::Pre-Run part-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// Declaration's part------------------------------------------------------------------------------
    var gn_Lang         = Context.getSelectedLanguage();
    var gn_Format   	= Context.getSelectedFormat(); 
    var gs_Empty    	= java.lang.String( convToBytes(""), "UTF-8" );
    var go_ActDB        = ArisData.getActiveDatabase();

    // DO NOT TRANSLATE THESE STRINGS - MUST BE EXACTLY LIKE IT IS!!!
    var gs_ChangeDescription    = ((Context.getProperty( "ChangeDescription" ) != null) && (Context.getProperty( "ChangeDescription" ).length() >0) )?Context.getProperty( "ChangeDescription" ):gs_Empty;
    var gs_Models               = ((Context.getProperty( "Models" ) != null) && (Context.getProperty( "Models" ).length() >0) )?Context.getProperty( "Models" ):gs_Empty;
    // DO NOT TRANSLATE THESE STRINGS - MUST BE EXACTLY LIKE IT IS!!!

    var CC_BLACK            = Constants.C_BLACK;
    var CC_TRANSPAR         = Constants.C_TRANSPARENT;
    var CC_LAGUNA_BLUE      = RGB(3, 130, 153);
    var CC_GLACIER_WHITE    = RGB(226, 231, 221);

// END::Declaration's part-------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// MAIN part---------------------------------------------------------------------------------------
    // Do not show anything - call execution and quit
    Context.setProperty( Constants.PROPERTY_SHOW_OUTPUT_FILE, false );
    Context.setProperty( Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false );
    var ga_SelObj   = crd_GetInput( ArisData.getSelectedObjDefs(), ArisData.getSelectedObjOccs() );
    
    if( (ga_SelObj != null) && (ga_SelObj.IsValid()) ){
        // Set default report output options
        Context.setProperty( Constants.PROPERTY_SHOW_OUTPUT_FILE, true );
        Context.setProperty( Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false );
        
        var outFile = Context.createOutputObject( Context.getSelectedFormat(), Context.getSelectedFile() );
            outFile.Init( gn_Lang );
        
        defineStyles( outFile );
        crd_HeaderAndTOC( outFile, "NOTOC" );
            crd_ServiceInformation( outFile );
            crd_ChangeInformation( outFile );
            crd_ModelInformation( outFile );
        outFile.EndSection();            
        outFile.WriteReport();
    }
// END::MAIN part----------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// Functions part----------------------------------------------------------------------------------
    function convToBytes( p_Val ){
        return java.lang.String( p_Val ).getBytes("UTF-8");
    }//END::convToBytes()


    function getAttrStrValue(p_objDef, p_attrTypeNum ){
        if( (p_objDef == null) || (!p_objDef.IsValid()) ){ return gs_Empty; }
        
        var oObj    = ((p_objDef.IsValid()) && (p_objDef.KindNum() == Constants.CID_OBJOCC) )?p_objDef.ObjDef():p_objDef;
        var attr    = oObj.Attribute(p_attrTypeNum, gn_Lang, true);
        
        if(!attr.IsValid() ){ return gs_Empty; }
        
        return java.lang.String( convToBytes( attr.GetValue(true) ), "UTF-8" );
    }//END::getAttrStrValue()

    
    function RGB(r, g, b) {
    	return (new java.awt.Color(r/255.0,g/255.0,b/255.0,1)).getRGB() & 0xFFFFFF;
    }//END::RGB()
    
    
    function defineStyles( p_Output ){
        // DO NOT TRANSLATE THESE STRINGS - MUST BE EXACTLY LIKE IT IS!!!
        p_Output.DefineF("TEXT_HEADER", getString("TEXT_FONT_DEFAULT"), 14, CC_BLACK, CC_TRANSPAR,  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 10, 0, 0, 1);
        p_Output.DefineF("TEXT_FOOTER", getString("TEXT_FONT_DEFAULT"), 8, CC_BLACK, CC_TRANSPAR,  Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 1, 0, 0, 1);
        p_Output.DefineF("TEXT_DEFAULT", getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_TRANSPAR,  Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 1, 0, 0, 1);
        p_Output.DefineF("TEXT_DEFAULT_LINK", getString("TEXT_FONT_DEFAULT"), 10, CC_LAGUNA_BLUE, CC_TRANSPAR,  Constants.FMT_LEFT| Constants.FMT_VCENTER| Constants.FMT_UNDERLINE, 1, 0, 1, 0, 0, 1);
        p_Output.DefineF("TEXT_DEFAULT_BOLD", getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_TRANSPAR,  Constants.FMT_BOLD|Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 2, 0, 0, 1);
        p_Output.DefineF("TEXT_DEFAULT_BOLD_TOP", getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_TRANSPAR,  Constants.FMT_BOLD|Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 5, 0, 0, 1);
        // DO NOT TRANSLATE THESE STRINGS - MUST BE EXACTLY LIKE IT IS!!!
    }//END::defineStyles()

    
    function crd_GetInput( p_Defs, p_Occs ){
        return (p_Defs.length > 0)?p_Defs[0]:p_Occs[0].ObjDef();
    }//END::crd_GetInput()
    
    
    function crd_HeaderAndTOC( p_Output, p_Flag ){
        if ( (p_Flag == "TOC") && (gn_Format == Constants.OUTPDF || gn_Format == Constants.OUTWORD ||  gn_Format == Constants.OUTRTF) ){
            // Output Index table
            p_Output.BeginSection (false, Constants.SECTION_INDEX);
                setReportHeaderFooter( p_Output, gn_Lang, false, false, false);
                p_Output.SetAutoTOCNumbering(true);
                p_Output.OutputLnF( formatString( getString("DOCU_HEADER"), [] ), "TEXT_HEADER" );
                p_Output.OutputField(Constants.FIELD_TOC, getString("DOCU_TOC"),12,Constants.C_BLACK,Constants.C_WHITE,Constants.FMT_RIGHT);
            p_Output.EndSection();
        }
        else if( p_Flag == "TOC" ){
            // Other formats with Index table
            p_Output.BeginSection (false, Constants.SECTION_DEFAULT);
            setReportHeaderFooter( p_Output, gn_Lang, true, true, true);
        }
        else{
            // No Index table required
            p_Output.BeginSection (false, Constants.SECTION_DEFAULT);
            setReportHeaderFooter( p_Output, gn_Lang, false, false, false);
        }
    }//END::crd_HeaderAndTOC()

    
    function crd_FindModelsByOID( p_OIDs ){
        var aOut    = [];
        if( (p_OIDs != null) && (p_OIDs.length() > 0) ){
            var aInMods = p_OIDs.split( "," );
            for(var j=0; j<aInMods.length; j++){
                var oMod    = go_ActDB.FindOID( aInMods[j] );
                if( (oMod.IsValid()) && (oMod.KindNum() == Constants.CID_MODEL) ){
                    aOut.push( oMod );
                }
            }//END::for_j
        }
        return aOut;
    }//END::reqdocu_FindModelsByOID()


    function crd_PrinModInfo( p_Output, p_Style, p_Model ){
        if( (p_Output != null) && (p_Style != null) && (p_Model != null) && (p_Model.IsValid()) ){    
            var p_Name  = getAttrStrValue( p_Model, Constants.AT_NAME );
            var p_Type  = p_Model.Type();
            var p_Link  = reqdocu_GetModelLink( p_Model );
            
            p_Output.BeginParagraphF( "TEXT_DEFAULT_BOLD_TOP" );
                p_Output.OutputF( getString("TEXT_NAME"), "TEXT_DEFAULT_BOLD_TOP" );
                p_Output.OutputLnF( java.lang.String("  ").concat( p_Name ), p_Style);
                p_Output.OutputF( getString("TEXT_TYPE"), "TEXT_DEFAULT_BOLD_TOP" );
                p_Output.OutputLnF( java.lang.String("   ").concat( p_Type ), p_Style);
                p_Output.OutputF( getString("TEXT_LINK"), "TEXT_DEFAULT_BOLD_TOP" );
                p_Output.OutputF( java.lang.String("     "), "TEXT_DEFAULT" );
                p_Output.OutputLinkF( commonUtils.attsall.formatString( getString("TEXT_LINK_LINK"), [p_Name] ), p_Link, "TEXT_DEFAULT_LINK");
            p_Output.EndParagraph( );
        }
        
        function reqdocu_GetModelLink( p_Model ){
            var sID = p_Model.ObjectID();
            if( (sID != null) ){
                return (Context.getProperty( sID + "_LINK" ) != null)?Context.getProperty( sID + "_LINK" ):gs_Empty;
            }
            return gs_Empty;
        }//END::mod_GetModelLink()
    }//END::reqdocu_PrinModInfo()


    // ServiceInformation -------------------------------------------------------------------------
    function crd_ServiceInformation( p_Output ){
            p_Output.addLocalBookmark( "CRD_SI" );
            p_Output.BeginParagraphF( "TEXT_HEADER" );
                p_Output.OutputLnF( getString("TEXT_HD_SERVICEINFO"), "TEXT_HEADER" );
            p_Output.EndParagraph();
            
            p_Output.BeginParagraphF( "TEXT_DEFAULT" );
                p_Output.OutputF( getString("TEXT_NAME"), "TEXT_DEFAULT_BOLD_TOP" );
                p_Output.OutputLnF( java.lang.String("  ").concat( getAttrStrValue( ga_SelObj, Constants.AT_NAME ) ), "TEXT_DEFAULT" );
                p_Output.OutputF( "GUID:", "TEXT_DEFAULT_BOLD_TOP" );
                p_Output.OutputLnF( java.lang.String("  ").concat( ga_SelObj.GUID() ), "TEXT_DEFAULT" );
            p_Output.EndParagraph();
    }//END::crd_ServiceInformation()

    
    // ChangeInformation --------------------------------------------------------------------------
    function crd_ChangeInformation( p_Output ){
            p_Output.addLocalBookmark( "CRD_CHI" );
            p_Output.BeginParagraphF( "TEXT_HEADER" );
                p_Output.OutputLnF( getString("TEXT_HD_CHANGEINFO"), "TEXT_HEADER" );
            p_Output.EndParagraph();
            
            p_Output.BeginParagraphF( "TEXT_DEFAULT" );
                p_Output.OutputLnF( java.lang.String( convToBytes(gs_ChangeDescription), "UTF-8" ), "TEXT_DEFAULT" );
            p_Output.EndParagraph();
    }//END::crd_ChangeInformation()

    
    // ModelInformation ---------------------------------------------------------------------------
    function crd_ModelInformation( p_Output ){
        if( (gs_Models != null) && (gs_Models.length() > 0) ){
            p_Output.addLocalBookmark( "CRD_MOD" );
            p_Output.BeginParagraphF( "TEXT_HEADER" );
                p_Output.OutputLnF( getString("TEXT_HD_MOD"), "TEXT_HEADER" );
            p_Output.EndParagraph();
            var aModels = crd_FindModelsByOID( gs_Models );
            for(var idx=0; idx<aModels.length; idx++){
                crd_PrinModInfo( p_Output, "TEXT_DEFAULT", aModels[idx] );
            }//END::for_idx
        }
    }//END::crd_ModelInformation()
// END::Output Functions part----------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
