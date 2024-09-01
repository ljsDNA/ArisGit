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
// Requirements document
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// Pre-Run part------------------------------------------------------------------------------------
// DELETE AFTER COMPLETITION!!!
// Always uncomment in case of testing directly!!!
/*        Context.setProperty( "NameOfService", "Some Test Service" );
        Context.setProperty( "PathOfService", "2#####4#####k##" );
        Context.setProperty( "ServiceDeveloperInfo", "Some info text provided for the developer.\nThere can be contained several lines..." );
        Context.setProperty( "Capabilities", "44####4#####p##,3t####4#####p##,3y####4#####p##" );
        Context.setProperty( "Kpis", "3n####4#####p##,3h####4#####p##,4f####4#####p##" );
        Context.setProperty( "DataObjs", "7k####4#####p##,73####4#####p##,6x####4#####p##" );
        Context.setProperty( "IncludeExtendedData", "true" );
        Context.setProperty( "Models", "9g####4#####u##,79####4#####u##,31####4#####u##" );
        Context.setProperty( "9g####4#####u##", "Some text about this model." );
        Context.setProperty( "79####4#####u##", "Some other text." );
        Context.setProperty( "31####4#####u##", "Test message about the model - any text would do.\nAnother line of test text message about the model." );
        Context.setProperty( "9g####4#####u##_LINK", "http://The link for starting the ARIS webstart client and open model 9g####4#####u##_LINK" );
        Context.setProperty( "79####4#####u##_LINK", "http://The link for starting the ARIS webstart client and open model 79####4#####u##_LINK" );
        Context.setProperty( "31####4#####u##_LINK", "http://The link for starting the ARIS webstart client and open model 31####4#####u##_LINK" );
        Context.setProperty( "ReportId", "" );// Use any existing report ID WebMethods/bac8a710-3b66-11e0-548e-f0337f1d5693
*/
// DELETE AFTER COMPLETITION!!!
// END::Pre-Run part-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// Declaration's part------------------------------------------------------------------------------
    var gn_Lang         = Context.getSelectedLanguage();
    var gn_Format   	= Context.getSelectedFormat(); 
    var gs_Empty    	= java.lang.String( convToBytes(""), "UTF-8" );
    var go_ActDB        = ArisData.getActiveDatabase();
    var ga_SelObjDefs   = ArisData.getSelectedObjDefs();

    // DO NOT TRANSLATE THESE STRINGS - MUST BE EXACTLY LIKE IT IS!!!
    var gs_NameOfService        = reqdocu_CheckInput( Context.getProperty( "NameOfService" ) );
    var gs_PathOfService        = reqdocu_CheckInput( Context.getProperty( "PathOfService" ) );
    var gs_ServiceDeveloperInfo = reqdocu_CheckInput( Context.getProperty( "ServiceDeveloperInfo" ) );
    var gs_Capabilities         = reqdocu_CheckInput( Context.getProperty( "Capabilities" ) );
    var gs_Kpis                 = reqdocu_CheckInput( Context.getProperty( "Kpis" ) );
    var gs_DataObjs             = reqdocu_CheckInput( Context.getProperty( "DataObjs" ) );
    var gs_IncludeExtendedData  = reqdocu_CheckInput( Context.getProperty( "IncludeExtendedData" ) );
    var gs_Models               = reqdocu_CheckInput( Context.getProperty( "Models" ) );
    var gs_ReportId             = reqdocu_CheckInput( Context.getProperty( "ReportId" ) );
    // DO NOT TRANSLATE THESE STRINGS - MUST BE EXACTLY LIKE IT IS!!!
    
    var go_CapaLib  = new cl_Library();
    var go_KPILib   = new cl_Library();
    var go_DataLib  = new cl_Library();
    
    var CC_BLACK            = Constants.C_BLACK;
    var CC_TRANSPAR         = Constants.C_TRANSPARENT;
    var CC_LAGUNA_BLUE      = RGB(3, 130, 153);
    var CC_GLACIER_WHITE    = RGB(226, 231, 221);
    
    var ga_ExcludedAttr = [Constants.AT_CREAT_TIME_STMP, Constants.AT_CREATOR, Constants.AT_LAST_CHNG_2, Constants.AT_LUSER ];
// END::Declaration's part-------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// MAIN part---------------------------------------------------------------------------------------
    // Do not show anything - call execution and quit
    Context.setProperty( Constants.PROPERTY_SHOW_OUTPUT_FILE, false );
    Context.setProperty( Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false );
    
    if( !checkInputProperty( "ALLMISSING" ) ){
        // Set default report output options
        Context.setProperty( Constants.PROPERTY_SHOW_OUTPUT_FILE, true );
        Context.setProperty( Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false );
        Context.setProperty( "use-new-output", true );
        var outFile = Context.createOutputObject( Context.getSelectedFormat(), Context.getSelectedFile() );
            outFile.Init( gn_Lang );
        
        defineStyles( outFile );
        reqdocu_HeaderAndTOC( outFile );
        
        // DO NOT TRANSLATE THESE STRINGS - MUST BE EXACTLY LIKE IT IS!!!
        if( checkInputProperty( "GSI" ) )  { reqdocu_GeneralServiceInformation( outFile ); }
        if( checkInputProperty( "CAPA" ) ) { reqdocu_Capabilities( outFile ); }
        if( checkInputProperty( "KPIS" ) ) { reqdocu_KPIs( outFile ); }
        if( checkInputProperty( "DATA" ) ) { reqdocu_Data( outFile ); }
        if( checkInputProperty( "MODS" ) ) { reqdocu_Models( outFile ); }
        if( checkInputProperty( "REPID" ) ) { reqdocu_AdditionalReportInfo( outFile ); }
            go_CapaLib.Destroy();
            go_KPILib.Destroy();
        if( checkInputProperty( "EXTDATA" ) ) { reqdocu_ExtendedDataInfo( outFile ); }
            go_DataLib.Destroy();
        // DO NOT TRANSLATE THESE STRINGS - MUST BE EXACTLY LIKE IT IS!!!
        outFile.WriteReport();
    }
// END::MAIN part----------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// Functions part----------------------------------------------------------------------------------
    function convToBytes( p_Val ){
        return java.lang.String( p_Val ).getBytes("UTF-8");
    }//END::convToBytes()

    function getAttrValue( p_Obj, p_attrTypeNum ){
        if( (p_Obj != null) && (p_Obj.IsValid()) ){
            var oObj    = (p_Obj.KindNum() == Constants.CID_OBJOCC)?p_Obj.ObjDef():p_Obj;
            var p_Attr  = oObj.Attribute( p_attrTypeNum, gn_Lang, true );
            if( (p_Attr.IsValid() == false) || (p_Attr.IsMaintained() == false) ){
                return null;
            }
            var aOut    = [];
                aOut["NAME"]    = java.lang.String( convToBytes(p_Attr.Type()), "UTF-8");
            switch( ArisData.ActiveFilter().AttrBaseType( p_Attr.TypeNum() ) ){
                case Constants.ABT_MULTILINE:
                    aOut["VALUE"]   = java.lang.String( convToBytes( p_Attr.GetValue(false)), "UTF-8" );
                    break;
                case Constants.ABT_BOOL:
                    aOut["VALUE"]   =  java.lang.Boolean.parseBoolean( p_Attr.GetValue(false));
                    break;
                case Constants.ABT_VALUE:
                    aOut["VALUE"]   =  p_Attr.getValue();
                    break;
                case Constants.ABT_SINGLELINE:
                    aOut["VALUE"]   =  java.lang.String( convToBytes( p_Attr.GetValue(true)), "UTF-8" );
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
    
    function getAttrStrValue(p_objDef, p_attrTypeNum ){
        if( (p_objDef == null) || (!p_objDef.IsValid()) ){ return gs_Empty; }
        
        var oObj    = ((p_objDef.IsValid()) && (p_objDef.KindNum() == Constants.CID_OBJOCC) )?p_objDef.ObjDef():p_objDef;
        var attr    = oObj.Attribute(p_attrTypeNum, gn_Lang, true);
        
        if(!attr.IsValid() ){ return gs_Empty; }
        
        return java.lang.String( convToBytes( attr.GetValue(true) ), "UTF-8");
    }//END::getAttrStrValue()

    
    function RGB(r, g, b) {
    	return (new java.awt.Color(r/255.0,g/255.0,b/255.0,1)).getRGB() & 0xFFFFFF;
    }//END::RGB()
    
    function getPathOfOID( p_Val ){
        if( (p_Val != null) && (p_Val.length() >0) ){
            var oObj    = go_ActDB.FindOID( p_Val );
            var oObjGrp = null;
            if( (oObj.IsValid()) && (oObj.KindNum() == Constants.CID_OBJOCC) ){
                oObjGrp = oObj.Model().Group();
            }
            else if( (oObj.IsValid()) && ((oObj.KindNum() == Constants.CID_OBJDEF) || (oObj.KindNum() == Constants.CID_MODEL)) ){
                oObjGrp = oObj.Group();
            }
            else if( (oObj.IsValid()) && (oObj.KindNum() == Constants.CID_GROUP) ){
                oObjGrp = oObj;
            }
            
            if( oObjGrp != null ){
                return java.lang.String( oObjGrp.Path( gn_Lang, true ) );
            }
        }
        return gs_Empty;
    }
    
    function getPathOfObjDef( p_Val ){
        if( p_Val.IsValid() ){
            return java.lang.String( p_Val.Group().Path( gn_Lang, true ) );
        }
        return gs_Empty;
    }//END::getPathOfObjDef()
    
    function CxnByActName( aCxn, bCxn ){
        return java.lang.String(aCxn.CxnDef().ActiveType()).compareTo( java.lang.String(bCxn.CxnDef().ActiveType()) );
    }

    function ModByName( aMod, bMod ){
        return getAttrStrValue( aMod, Constants.AT_NAME ).compareTo( getAttrStrValue( bMod, Constants.AT_NAME ) );
    }

    function SortLibByName( aObj, bObj ){
        return aObj.GetName().compareTo( bObj.GetName() );
    }
    
    function SortLibByNameType( aObj, bObj ){
        return aObj.GetNameType().compareTo( bObj.GetNameType() );
    }

    function SortAttrByTypeName( aNum, bNum ){
        return java.lang.String( ArisData.ActiveFilter().AttrTypeName( aNum ) ).compareTo( java.lang.String( ArisData.ActiveFilter().AttrTypeName( bNum ) ) );
    }
    
    function defineStyles( p_Output ){
        // DO NOT TRANSLATE THESE STRINGS - MUST BE EXACTLY LIKE IT IS!!!
        p_Output.DefineF("TEXT_HEADER", getString("TEXT_FONT_DEFAULT"), 14, CC_BLACK, CC_TRANSPAR,  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 0, 0, 0, 1);
        p_Output.DefineF("TEXT_HEADER_TBL", getString("TEXT_FONT_DEFAULT"), 10, CC_GLACIER_WHITE, CC_LAGUNA_BLUE,  Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 1, 0, 0, 1);
        p_Output.DefineF("TEXT_LEFTCOL_TBL", getString("TEXT_FONT_DEFAULT"), 10, CC_LAGUNA_BLUE, CC_GLACIER_WHITE,  Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 1, 0, 0, 1);
        p_Output.DefineF("TEXT_FOOTER", getString("TEXT_FONT_DEFAULT"), 8, CC_BLACK, CC_TRANSPAR,  Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 0, 0, 0, 1);
        p_Output.DefineF("TEXT_DEFAULT", getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_TRANSPAR,  Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 0, 0, 0, 1);
        p_Output.DefineF("TEXT_DEFAULT_LINK", getString("TEXT_FONT_DEFAULT"), 10, CC_LAGUNA_BLUE, CC_TRANSPAR,  Constants.FMT_LEFT| Constants.FMT_VCENTER| Constants.FMT_UNDERLINE, 1, 0, 0, 0, 0, 1);
        p_Output.DefineF("TEXT_DEFAULT_BOLD", getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_TRANSPAR,  Constants.FMT_BOLD|Constants.FMT_LEFT| Constants.FMT_VCENTER, 1, 0, 1, 0, 0, 1);
        p_Output.DefineF("TEXT_DEFAULT_IR", getString("TEXT_FONT_DEFAULT"), 10, CC_BLACK, CC_TRANSPAR,  Constants.FMT_LEFT| Constants.FMT_VCENTER, 15, 0, 1, 0, 0, 1);
        
        p_Output.DefineF("TOCENTRY_0", getString("TEXT_FONT_DEFAULT"), 12, CC_BLACK, CC_TRANSPAR,  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VCENTER| Constants.FMT_TOCENTRY0, 1, 0, 0, 0, 0, 1);
        p_Output.DefineF("TOCENTRY_1", getString("TEXT_FONT_DEFAULT"), 11, CC_BLACK, CC_TRANSPAR,  Constants.FMT_BOLD| Constants.FMT_LEFT| Constants.FMT_VCENTER| Constants.FMT_TOCENTRY1, 1, 0, 0, 0, 0, 1);
        
        p_Output.SetTOCFormat(0, getString("TEXT_FONT_DEFAULT"), 11, CC_BLACK, CC_TRANSPAR, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1.2)        
        p_Output.SetTOCFormat(1, getString("TEXT_FONT_DEFAULT"), 11, CC_BLACK, CC_TRANSPAR, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1.2)        
        // DO NOT TRANSLATE THESE STRINGS - MUST BE EXACTLY LIKE IT IS!!!
    }//END::defineStyles()

    function setNewFrameStyle(p_Output, p_Style){
        // Usage: Frames{0|1} [Bottom, Left, Right, Top]
        p_Output.ResetFrameStyle();
        p_Output.SetFrameStyle( Constants.FRAME_BOTTOM,    p_Style[0] );
        p_Output.SetFrameStyle( Constants.FRAME_LEFT,      p_Style[1] );
        p_Output.SetFrameStyle( Constants.FRAME_RIGHT,     p_Style[2] );
        p_Output.SetFrameStyle( Constants.FRAME_TOP,       p_Style[3] );
    }//END::setNewFrameStyle()

    function addCell( p_Output, p_fStyle, p_Text, p_PerCnt, p_txtStyle ){
        // Usage: addCell( p_Output, [0,1,1,0], "text", 1, 1, 25, getString("TEXT_STYLE_DEFAULT") );
        if( p_fStyle.length > 0 )   { setNewFrameStyle(p_Output, p_fStyle ); }
        p_Output.TableCellF( p_Text, p_PerCnt, p_txtStyle );
    }//END::addCell()


    function reqdocu_CheckInput( p_Val ){
        return ((p_Val != null) && (p_Val.length() > 0))?p_Val:gs_Empty;
    }//END::reqdocu_CheckInput()
    
    function checkInputProperty( p_Flag ){
        switch( p_Flag ){
            case "ALLMISSING":
                if( (gs_Capabilities == null) && (gs_DataObjs == null) && (gs_IncludeExtendedData == null) && (gs_Kpis == null) &&
                    (gs_Models == null) && (gs_NameOfService == null) && (gs_PathOfService == null) && (gs_ReportId == null) && (gs_ServiceDeveloperInfo == null) ){
                        return true;
                }
                if( (gs_NameOfService != null)  && (java.lang.String(gs_NameOfService).length() < 1)    &&
                    (gs_PathOfService != null)  && (java.lang.String(gs_PathOfService).length() < 1)    &&
                    (gs_Capabilities != null)   && (java.lang.String(gs_Capabilities).length() < 1)     &&
                    (gs_Kpis != null)           && (java.lang.String(gs_Kpis).length() < 1)             &&
                    (gs_DataObjs != null)       && (java.lang.String(gs_DataObjs).length() < 1)         &&
                    (gs_Models != null)         && (java.lang.String(gs_Models).length() < 1)           ){
                        return true;
                }            
                break;
            case "GSI":
                if( (gs_NameOfService != null) && (java.lang.String(gs_NameOfService).length() > 0) &&
                    (gs_PathOfService != null) && (java.lang.String(gs_PathOfService).length() > 0) ){
                    return true;
                }
                break;
            case "CAPA":
                if( (gs_Capabilities != null) && (java.lang.String(gs_Capabilities).length() > 0) ){
                    var aCheck  = gs_Capabilities.split(",");
                    if( aCheck.length > 0 ) { return true; }
                }
                break;
            case "KPIS":
                if( (gs_Kpis != null) && (java.lang.String(gs_Kpis).length() > 0) ){
                    var aCheck  = gs_Kpis.split(",");
                    if( aCheck.length > 0 ) { return true; }
                }
                break;
            case "DATA":
                if( (gs_DataObjs != null) && (java.lang.String(gs_DataObjs).length() > 0) ){
                    var aCheck  = gs_DataObjs.split(",");
                    if( aCheck.length > 0 ) { return true; }
                }
                break;
            case "MODS":
                if( (gs_Models != null) && (java.lang.String(gs_Models).length() > 0) ){
                    var aCheck  = gs_DataObjs.split(",");
                    if( aCheck.length > 0 ) { return true; }
                }
                break;
            case "REPID":
                if( (gs_ReportId != null) && (java.lang.String(gs_ReportId).length() > 0) ){
                    return true;
                }
                break;
            case "EXTDATA":
                if( (gs_IncludeExtendedData != null) && (java.lang.String(gs_IncludeExtendedData).length() > 0) ){
                    if( gs_IncludeExtendedData.compareTo("true") == 0 ){
                        return true;
                    }
                }
                break;
        }
        
        return false;
    }//END::checkInputProperty()
    

    function getAllowedObjAttributes( p_Obj ){
        var aOut    = [];
        if( (p_Obj != null) && (p_Obj.IsValid()) ){
            var oObj        = ( p_Obj.KindNum() == Constants.CID_OBJOCC )?p_Obj.ObjDef():p_Obj;
            var aObjAttr    = ( oObj.KindNum() == Constants.CID_MODEL )?ArisData.ActiveFilter().AttrTypes( Constants.CID_MODEL, oObj.TypeNum() ):ArisData.ActiveFilter().AttrTypes( Constants.CID_OBJDEF, oObj.TypeNum() );

            for(var i=0; i<aObjAttr.length; i++){
                if( ga_ExcludedAttr.contains( aObjAttr[i] ) == false ){
                    aOut.push( aObjAttr[i] );
                }
            }//END::for_xI
        }
        aOut.sort( SortAttrByTypeName );
        return aOut;
    }//END::getAllowedObjAttributes()

        
    function reqdocu_HeaderAndTOC( p_Output ){
        if ( gn_Format == Constants.OUTPDF || gn_Format == Constants.OUTWORD ||  gn_Format == Constants.OUTRTF ){
            // Output Index table
            p_Output.BeginSection (false, Constants.SECTION_INDEX);
                setReportHeaderFooter( p_Output, gn_Lang, false, false, false);
                p_Output.SetAutoTOCNumbering(true);
                p_Output.OutputLnF( commonUtils.attsall.formatString( getString("DOCU_HEADER"), [gs_NameOfService] ), "TEXT_HEADER" );
                p_Output.OutputField(Constants.FIELD_TOC, getString("DOCU_TOC"),12,Constants.C_BLACK,Constants.C_WHITE,Constants.FMT_RIGHT);
            p_Output.EndSection();
        }
        else{
            setReportHeaderFooter( p_Output, gn_Lang, true, true, true);
        }
    }//END::reqdocu_HeaderAndTOC()

    
    function reqdocu_OutputDetails( p_Output, p_Obj ){
        p_Output.addLocalBookmark( p_Obj.GetCBMK() );
        p_Output.OutputLnF( p_Obj.GetName(), "TOCENTRY_1" );

        p_Output.BeginParagraphF( "TEXT_DEFAULT" );
            p_Output.OutputLnF( getString("TEXT_ATTR"), "TEXT_DEFAULT_BOLD" );
        p_Output.EndParagraph( );
        p_Obj.PrintAttrTable( p_Output, "TEXT_DEFAULT" );
        p_Obj.PrintConnections( p_Output, "TEXT_DEFAULT" );
        p_Obj.PrintModels( p_Output, "TEXT_DEFAULT" );
    }//END::reqdocu_OutputDetails()
        
    
    function reqdocu_OutputNamesLinks( p_Output, p_Lib, p_Flag ){
        if( p_Lib.LibSize() > 0 ){
            p_Output.BeginList( Constants.BULLET_DEFAULT );
                p_Lib.PrintLinks( p_Output, "TEXT_DEFAULT", p_Flag );
            p_Output.EndList();
            p_Output.OutputLnF( "", "TEXT_DEFAULT" );
        }
    }//END::reqdocu_OutputNamesLinks()


    function reqdocu_FindModelsByOID( p_OIDs ){
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


    function reqdocu_PrinModInfo( p_Output, p_Style, p_Model ){
        if( (p_Output != null) && (p_Style != null) && (p_Model != null) && (p_Model.IsValid()) ){    
            var p_Name  = getAttrStrValue( p_Model, Constants.AT_NAME );
            var p_Type  = p_Model.Type();
            var p_Link  = reqdocu_GetModelLink( p_Model );
            var p_Info  = reqdocu_GetModelInfo( p_Model );
            
            p_Output.BeginParagraphF( "TEXT_DEFAULT" );
                p_Output.OutputF( getString("TEXT_NAME"), "TEXT_DEFAULT_BOLD" );
                p_Output.OutputLnF( "\t" + p_Name, p_Style);
                p_Output.OutputF( getString("TEXT_TYPE"), "TEXT_DEFAULT_BOLD" );
                p_Output.OutputLnF( "\t" + p_Type, p_Style);
                p_Output.OutputF( getString("TEXT_BM_GIVEN_INFO"), "TEXT_DEFAULT_BOLD" );
                p_Output.OutputLnF( "\t" + p_Info, p_Style);
                p_Output.OutputF( getString("TEXT_LINK"), "TEXT_DEFAULT_BOLD" );
                p_Output.OutputLinkF( commonUtils.attsall.formatString( getString("TEXT_LINK_LINK"), ["\t", p_Name] ), p_Link, "TEXT_DEFAULT_LINK");
            p_Output.EndParagraph( );
        }
        
        function reqdocu_GetModelLink( p_Model ){
            var sID = p_Model.ObjectID();
            if( (sID != null) ){
                return (Context.getProperty( sID + "_LINK" ) != null)?Context.getProperty( sID + "_LINK" ):gs_Empty;
            }
            return gs_Empty;
        }//END::mod_GetModelLink()

        function reqdocu_GetModelInfo( p_Model ){
            var sID = p_Model.ObjectID();
            if( (sID != null) ){
                return (Context.getProperty( sID ) != null)?Context.getProperty( sID ):gs_Empty;
            }
            return gs_Empty;
        }//END::mod_GetModelInfo()
    }//END::reqdocu_PrinModInfo()

    
    function reqdocu_PrintModAttr( p_Output, p_Style, p_Model ){
        if( (p_Style != null) && (p_Output != null) && (p_Model != null) && (p_Model.IsValid()) ){
            var aAttr   = getAllowedObjAttributes( p_Model );
            if( (aAttr != null) && (aAttr.length > 0) ){
                p_Output.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_VCENTER | Constants.FMT_REPEAT_HEADER, 0 );
                p_Output.TableRow();// Output Header
                    addCell( p_Output, [1,1,1,1], getString("TEXT_TBL_ATTR_NAME"), 40, "TEXT_HEADER_TBL" );
                    addCell( p_Output, [1,1,1,1], getString("TEXT_TBL_ATTR_VALUE"), 60, "TEXT_HEADER_TBL" );
                    
                for( var i=0; i<aAttr.length; i++ ){
                    var aReadAttr   = getAttrValue( p_Model, aAttr[i] );
                    if( aReadAttr != null ){
                        p_Output.TableRow();
                            addCell( p_Output, [], aReadAttr["NAME"], 40, "TEXT_LEFTCOL_TBL" );
                            addCell( p_Output, [], aReadAttr["VALUE"], 60, p_Style );
                    }
                }//END::for_i
                p_Output.EndTable( "Attributes", 100, getString("TEXT_FONT_DEFAULT"), 8, Constants.C_TRANSPARENT, Constants.C_TRANSPARENT, Constants.FILLTYPE_SOLID, Constants.FMT_LEFT, 0);// DO NOT TRANSLATE THIS - MASH ZONE REQUIREMENT
            }
        }
    }//END::reqdocu_PrintModAttr()

    
    function reqdocu_GetAllLibModels( p_Lib ){
        var aOut    = new Array();

        if( !p_Lib.IsEmpty() ){
            _getPushModels( p_Lib.GetMods( "BS" ) );
            _getPushModels( p_Lib.GetMods( "ADD" ) );
            aOut.clearDuplicities();
        }

        return aOut;
        
        function _getPushModels( p_Models ){
            if( (p_Models != null) && (p_Models.length > 0) ){
                for(var j=0; j<p_Models.length; j++){
                    aOut.push( p_Models[j] );
                }//END::for_j
            }
        }//END::_getPushModels()
    }//END::reqdocu_GetAllLibModels()

    
    function reqdocu_GetCrossLibModels( p_Flag, p_Libs ){
        var aOut    = new Array();

        if( (p_Libs != null) && (p_Flag != null) && ((p_Flag == "BS") || (p_Flag == "ADD")) ){
            for( var idx=0; idx<p_Libs.length; idx++ ){
                if( !(p_Libs[idx].IsEmpty()) ){
                    _getPushModels( p_Libs[idx].GetMods( p_Flag ) );
                }
            }//END::for_idx
            aOut.clearDuplicities();
        }
        return aOut;
        
        function _getPushModels( p_Models ){
            if( (p_Models != null) && (p_Models.length > 0) ){
                for( var j=0; j<p_Models.length; j++ ){
                    aOut.push( p_Models[j] );
                }//END::for_j
            }
        }//END::_getPushModels()
    }//END::reqdocu_GetCrossLibModels()

    
    function reqdocu_GetBSOccModels( p_Defs ){
        var aOut    = new Array();

        if( (p_Defs != null) ){
            for( var idx=0; idx<p_Defs.length; idx++ ){
                var oObj    = ((p_Defs[idx].IsValid()) && (p_Defs[idx].KindNum() == Constants.CID_OBJOCC) )?p_Defs[idx].ObjDef():p_Defs[idx];
                if( oObj.IsValid() ){
                    var aOccs   = oObj.OccList();
                    for( var j=0; j<aOccs.length; j++ ){
                        aOut.push( aOccs[j].Model() );
                    }//END::for_j
                }
            }//END::for_idx
            aOut.clearDuplicities();
        }
            
        return aOut;
    }//END::reqdocu_GetBSOccModels()

    function reqdocu_PrintOccsTable( p_Output, p_Style,  p_Model ){
        if( (p_Style != null) && (p_Output != null) && (p_Model != null) && (p_Model.IsValid()) ){
            var aOccs   = p_Model.ObjOccList();
            if( (aOccs != null) && (aOccs.length >0) ){
                p_Output.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_VCENTER | Constants.FMT_REPEAT_HEADER, 0 );
                p_Output.TableRow();// Output Header
                    addCell( p_Output, [1,1,1,1], getString("TEXT_NAME"), 50, "TEXT_HEADER_TBL" );
                    addCell( p_Output, [1,1,1,1], getString("TEXT_TYPE"), 50, "TEXT_HEADER_TBL" );
                for(var j=0; j<aOccs.length; j++){
                    p_Output.TableRow();
                        addCell( p_Output, [], getAttrStrValue(aOccs[j], Constants.AT_NAME), 50, "TEXT_LEFTCOL_TBL" );
                        addCell( p_Output, [], aOccs[j].ObjDef().Type(), 50, p_Style );
                }//END::for_j
                p_Output.EndTable( "Attributes", 100, getString("TEXT_FONT_DEFAULT"), 8, Constants.C_TRANSPARENT, Constants.C_TRANSPARENT, Constants.FILLTYPE_SOLID, Constants.FMT_LEFT, 0);// DO NOT TRANSLATE THIS - MASH ZONE REQUIREMENT
            }
        }
    }//END::reqdocu_PrintOccsTable()


    function reqdocu_GetObjNameType( p_Obj ){
        var oObj    = ((p_Obj.IsValid()) && (p_Obj.KindNum() == Constants.CID_OBJOCC) )?p_Obj.ObjDef():p_Obj;
        var sName   = getAttrStrValue( oObj, Constants.AT_NAME );
        return (sName.equals( gs_Empty ))?gs_Empty:sName.concat(" (").concat( oObj.Type() ).concat(" )");
    }//END::reqdocu_GetObjNameType()


    function reqdocu_PrintCxnsTable( p_Output, p_Style,  p_Model ){
        if( (p_Style != null) && (p_Output != null) && (p_Model != null) && (p_Model.IsValid()) ){
            var aOccs   = p_Model.CxnOccList();
            if( (aOccs != null) && (aOccs.length >0) ){
                p_Output.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_VCENTER | Constants.FMT_REPEAT_HEADER, 0 );
                p_Output.TableRow();// Output Header
                    addCell( p_Output, [1,1,1,1], "Source", 33, "TEXT_HEADER_TBL" );
                    addCell( p_Output, [1,1,1,1], "Connection type", 33, "TEXT_HEADER_TBL" );
                    addCell( p_Output, [1,1,1,1], "Target", 33, "TEXT_HEADER_TBL" );
                for(var j=0; j<aOccs.length; j++){
                    p_Output.TableRow();
                        addCell( p_Output, [], reqdocu_GetObjNameType( (aOccs[j].SourceObjOcc()) ), 33, p_Style );
                        addCell( p_Output, [], aOccs[j].CxnDef().ActiveType(), 33, p_Style );
                        addCell( p_Output, [], reqdocu_GetObjNameType( (aOccs[j].TargetObjOcc()) ), 33, p_Style );
                }//END::for_j
                p_Output.EndTable( "Attributes", 100, getString("TEXT_FONT_DEFAULT"), 8, Constants.C_TRANSPARENT, Constants.C_TRANSPARENT, Constants.FILLTYPE_SOLID, Constants.FMT_LEFT, 0);// DO NOT TRANSLATE THIS - MASH ZONE REQUIREMENT
            }
        }
    }//END::reqdocu_PrintCxnsTable()


// GSI ----------------------------------------------------------------------------------------
    function reqdocu_GeneralServiceInformation( p_Output ){
        p_Output.BeginSection (false, Constants.SECTION_DEFAULT);
            setReportHeaderFooter( p_Output, gn_Lang, false, false, false);
            p_Output.addLocalBookmark( "RD_GSI" );
            p_Output.OutputLnF( getString("TEXT_HD_GSI"), "TOCENTRY_0" );
            
            p_Output.BeginParagraphF( "TEXT_DEFAULT" );
                p_Output.OutputF( getString("TEXT_NAME"), "TEXT_DEFAULT_BOLD" );
                p_Output.OutputLnF( "\t" + gs_NameOfService, "TEXT_DEFAULT" );
                p_Output.OutputF( getString("TEXT_ARIS_PATH"), "TEXT_DEFAULT_BOLD" );
                p_Output.OutputLnF( "\t" + getPathOfOID(gs_PathOfService), "TEXT_DEFAULT" );
                p_Output.OutputF( getString("TEXT_GSI_SERV_DEV_INFO"), "TEXT_DEFAULT_BOLD" );
                p_Output.OutputLnF( "\t" + gs_ServiceDeveloperInfo, "TEXT_DEFAULT" );
            p_Output.EndParagraph();
            p_Output.OutputLnF( "", "TEXT_DEFAULT" );
            
            p_Output.OutputLnF( getString("TEXT_GSI_BUSINESS_SERV"), "TOCENTRY_1" );
            
            ga_SelObjDefs.sort( ModByName );
            for(var idx=0; idx<ga_SelObjDefs.length; idx++){
                    gsi_BusinessServiceAttributes( p_Output, ga_SelObjDefs[idx] );
            }//END::for_idx
        p_Output.EndSection();
        
        
        function gsi_BusinessServiceAttributes( p_Output, p_Obj ){
            if( p_Obj.IsValid() ){
                var oObj    = ( p_Obj.KindNum() == Constants.CID_OBJOCC )?p_Obj.ObjDef():p_Obj;
                var aAttr   = getAllowedObjAttributes( oObj );

                p_Output.BeginParagraphF( "TEXT_DEFAULT" );
                    p_Output.OutputF( getString("TEXT_NAME"), "TEXT_DEFAULT_BOLD" );
                    p_Output.OutputLnF( "\t" + getAttrStrValue(oObj, Constants.AT_NAME ), "TEXT_DEFAULT" );
                    p_Output.OutputF( getString("TEXT_ARIS_PATH"), "TEXT_DEFAULT_BOLD" );
                    p_Output.OutputLnF( "\t" + getPathOfObjDef(oObj), "TEXT_DEFAULT" );
                    p_Output.OutputLnF( getString("TEXT_ATTR"), "TEXT_DEFAULT_BOLD" );
                p_Output.EndParagraph();
                
                p_Output.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_VCENTER | Constants.FMT_REPEAT_HEADER, 0 );
                p_Output.TableRow();// Output Header
                    addCell( p_Output, [1,1,1,1], getString("TEXT_TBL_ATTR_NAME"), 40, "TEXT_HEADER_TBL" );
                    addCell( p_Output, [1,1,1,1], getString("TEXT_TBL_ATTR_VALUE"), 60, "TEXT_HEADER_TBL" );
                    
                for( var i=0; i<aAttr.length; i++ ){
                    var aReadAttr   = getAttrValue( oObj, aAttr[i] );
                    if( aReadAttr != null ){
                        p_Output.TableRow();
                            addCell( p_Output, [], aReadAttr["NAME"], 40, "TEXT_LEFTCOL_TBL" );
                            addCell( p_Output, [], aReadAttr["VALUE"], 60, "TEXT_DEFAULT" );
                    }
                }//END::for_idx
                p_Output.EndTable( "Attributes", 100, getString("TEXT_FONT_DEFAULT"), 8, Constants.C_TRANSPARENT, Constants.C_TRANSPARENT, Constants.FILLTYPE_SOLID, Constants.FMT_LEFT, 0);// DO NOT TRANSLATE THIS - MASH ZONE REQUIREMENT
            }
        }//END::gsi_BusinessServiceAttributes()
    }//END::reqdocu_GeneralServiceInformation()

    
    // CAPA ---------------------------------------------------------------------------------------
    function reqdocu_Capabilities( p_Output ){
        go_CapaLib.Initialize( gs_Capabilities );
        go_CapaLib.SortLib( SortLibByName );
            
        p_Output.BeginSection (false, Constants.SECTION_DEFAULT);
            setReportHeaderFooter( p_Output, gn_Lang, false, false, false);
            p_Output.addLocalBookmark( "RD_CAPA" );
            p_Output.OutputLnF( getString("TEXT_HD_CAPA"), "TOCENTRY_0" );
            
            p_Output.BeginParagraphF( "TEXT_DEFAULT" );
                p_Output.OutputLnF( getString("TEXT_NAME_OF_CAPA"), "TEXT_DEFAULT_BOLD" );
            p_Output.EndParagraph();
            reqdocu_OutputNamesLinks( p_Output, go_CapaLib, null );
            for(var idx=0; idx<go_CapaLib.LibSize(); idx++){
                reqdocu_OutputDetails( p_Output, go_CapaLib.Get(idx) );
            }//END::for_idx
        p_Output.EndSection();
    }//END::reqdocu_Capabilities()

    
    // KPIS ---------------------------------------------------------------------------------------
    function reqdocu_KPIs( p_Output ){
        go_KPILib.Initialize( gs_Kpis );
        go_KPILib.SortLib( SortLibByName );
        
        p_Output.BeginSection (false, Constants.SECTION_DEFAULT);
            setReportHeaderFooter( p_Output, gn_Lang, false, false, false);
            p_Output.addLocalBookmark( "RD_KPIS" );
            p_Output.OutputLnF( getString("TEXT_HD_KPIS"), "TOCENTRY_0" );
            
            p_Output.BeginParagraphF( "TEXT_DEFAULT" );
                p_Output.OutputLnF( getString("TEXT_NAME_OF_KPIS"), "TEXT_DEFAULT_BOLD" );
            p_Output.EndParagraph();
            reqdocu_OutputNamesLinks( p_Output, go_KPILib, null );
            for(var idx=0; idx<go_KPILib.LibSize(); idx++){
                reqdocu_OutputDetails( p_Output, go_KPILib.Get(idx) );
            }//END::for_idx
        p_Output.EndSection();
    }//END::reqdocu_KPIs()
    
    
    // DATA ---------------------------------------------------------------------------------------
    function reqdocu_Data( p_Output ){
        go_DataLib.Initialize( gs_DataObjs );
        go_DataLib.SortLib( SortLibByNameType );
        
        p_Output.BeginSection (false, Constants.SECTION_DEFAULT);
            setReportHeaderFooter( p_Output, gn_Lang, false, false, false);
            p_Output.addLocalBookmark( "RD_DATA" );
            p_Output.OutputLnF( getString("TEXT_HD_DATA"), "TOCENTRY_0" );
            
            p_Output.BeginParagraphF( "TEXT_DEFAULT" );
                p_Output.OutputLnF( getString("TEXT_NAME_OF_DATA"), "TEXT_DEFAULT_BOLD" );
            p_Output.EndParagraph();
            reqdocu_OutputNamesLinks( p_Output, go_DataLib, "DATA" );
            for(var idx=0; idx<go_DataLib.LibSize(); idx++){
               reqdocu_OutputDetails( p_Output, go_DataLib.Get(idx) );
            }//END::for_idx
        p_Output.EndSection();
    }//END::reqdocu_Data()
        
    // MODS ---------------------------------------------------------------------------------------
    function reqdocu_Models( p_Output ){
        p_Output.BeginSection (false, Constants.SECTION_DEFAULT);
            setReportHeaderFooter( p_Output, gn_Lang, false, false, false);
            p_Output.addLocalBookmark( "RD_MOD" );
            p_Output.OutputLnF( getString("TEXT_HD_MOD"), "TOCENTRY_0" );
            p_Output.OutputLnF( "", "TEXT_DEFAULT" );
           
            p_Output.OutputLnF( getString("TEXT_NAME_OF_MODELS"), "TOCENTRY_1" );
            p_Output.OutputLnF( "", "TEXT_DEFAULT" );
            var BS_Models   = mod_GetBSModels( "BS" );
            mod_PrintModels( p_Output, "TEXT_DEFAULT", BS_Models );
            p_Output.OutputLnF( "", "TEXT_DEFAULT" );

            p_Output.OutputLnF( getString("TEXT_NAME_OF_ADD_MODELS"), "TOCENTRY_1" );
            var ADD_Models  = mod_GetAddModels( "ADD", BS_Models );
            mod_PrintModels( p_Output, "TEXT_DEFAULT", ADD_Models );
            p_Output.OutputLnF( "", "TEXT_DEFAULT" );
        p_Output.EndSection();
        
        function mod_PrintModels( p_Output, p_Style, p_Models ){
            for(var i=0; i<p_Models.length; i++){
                p_Output.OutputLnF( "", "TEXT_DEFAULT" );
                reqdocu_PrinModInfo( p_Output, p_Style, p_Models[i] );
                reqdocu_PrintModAttr( p_Output, p_Style, p_Models[i] );
            }//END::for_i
        }//END::mod_PrintModels()

        function mod_GetBSModels( p_Flag ){
            var aOut    = new Array();
                aOut    = aOut.concat( reqdocu_GetBSOccModels( ga_SelObjDefs ) );
                aOut    = aOut.concat( reqdocu_GetCrossLibModels( "BS", [go_CapaLib, go_DataLib, go_KPILib] ) );
                aOut.clearDuplicities();
            return aOut;
        }//END::mod_GetBSModels()

        function mod_GetAddModels( p_Flag, p_RefMods ){
            var aOut    = new Array();
                aOut    = reqdocu_FindModelsByOID( gs_Models ).concat( reqdocu_GetCrossLibModels( "ADD", [go_CapaLib, go_DataLib, go_KPILib] ) );
                aOut.clearDuplicities();
                aOut    = _FilterModels( aOut, p_RefMods );
            return aOut;
            
            function _FilterModels( p_Models, p_RefMods ){
                var aOut    = new Array();
                
                for( var j=0; j<p_Models.length; j++ ){
                    if( !(p_RefMods.contains( p_Models[j] )) ){
                        aOut.push( p_Models[j] );
                    }
                }//END::for_j
                
                return aOut;
            }//END::_FilterModels()
        }//END::mod_GetAddModels()
        
    }//END::reqdocu_Models()

    
    // REPID --------------------------------------------------------------------------------------
    function reqdocu_AdditionalReportInfo( p_Output ){
        p_Output.BeginSection (false, Constants.SECTION_DEFAULT);
            setReportHeaderFooter( p_Output, gn_Lang, false, false, false);
            p_Output.addLocalBookmark( "RD_REPID" );
            p_Output.OutputLnF( getString("TEXT_HD_REPID"), "TOCENTRY_0" );

            addRID_runReportDisplayResult( p_Output, gs_ReportId );

        p_Output.EndSection();
        
        function addRID_runReportDisplayResult( p_Output, gs_ReportId ){
            var initialObjects  = ga_SelObjDefs.copy();
            var reportComponent = Context.getComponent( "Report" );
            //create RTF because only RTF and DOC can be read again (pdf is not readable for our API)
            var execInfo        = reportComponent.createExecInfo( gs_ReportId, initialObjects, gn_Lang, Constants.OUTRTF, "_tmpFile.rtf" );
            execInfo.setProperty("use-new-output","true") //force using new output object implementation
            var reportResult    = reportComponent.execute( execInfo );
            var aResultFileData = reportResult.getResultFileData();
            if( (aResultFileData != null) && (aResultFileData.length > 0) ){
                for(var i=0; i<aResultFileData.length; i++){
                    var oObject         = Context.getOutputObject( "" + aResultFileData[i].getName(), aResultFileData[i].getData() );
                    p_Output.InsertDocument( oObject, false, false );
                }//END::for_each
            }
        }//END::addRID_runReportDisplayResult()
    }//END::reqdocu_AdditionalReportInfo()


    // EXTDATA ------------------------------------------------------------------------------------
    function reqdocu_ExtendedDataInfo( p_Output ){
        var aModels = reqdocu_GetAllLibModels( go_DataLib )
            aModels.sort( ModByName );
        if( (aModels != null) && (aModels.length > 0) ){
            p_Output.BeginSection (false, Constants.SECTION_DEFAULT);
                setReportHeaderFooter( p_Output, gn_Lang, false, false, false);
                p_Output.addLocalBookmark( "RD_EXTDATA" );
                p_Output.OutputLnF( getString("TEXT_HD_EXTDATA"), "TOCENTRY_0" );
                extdata_PrintExtDataInfo( aModels );
            p_Output.EndSection();
        }
        
        function extdata_PrintExtDataInfo( p_Models ){
            for(var idx=0; idx<p_Models.length; idx++){
                extdata_PrintModHeader( p_Output, "TEXT_DEFAULT", p_Models[idx], idx );
                extdata_PrintOccsTable( p_Output, "TEXT_DEFAULT", p_Models[idx] );
                extdata_PrintCxnsTable( p_Output, "TEXT_DEFAULT", p_Models[idx] );
            }//END::for_idx
            
            function extdata_PrintModHeader( p_Output, p_Style, p_Model, p_Idx ){
                p_Output.addLocalBookmark( "EXTDATA" + p_Idx );
                p_Output.OutputLnF( getAttrStrValue( p_Model, Constants.AT_NAME ), "TOCENTRY_1" );
                p_Output.BeginParagraphF( p_Style );
                    p_Output.OutputLnF( getString("TEXT_ATTR"), "TEXT_DEFAULT_BOLD" );
                p_Output.EndParagraph( );
                reqdocu_PrintModAttr( p_Output, p_Style,  p_Model );
            }//END::extdata_PrintModHeader()

            function extdata_PrintOccsTable( p_Output, p_Style, p_Model ){
                p_Output.BeginParagraphF( p_Style );
                    p_Output.OutputLnF( getString("TEXT_OCCURRENCES"), "TEXT_DEFAULT_BOLD" );
                p_Output.EndParagraph( );
                reqdocu_PrintOccsTable( p_Output, p_Style,  p_Model );
            }//END::extdata_PrintOccsTable()
            
            function extdata_PrintCxnsTable( p_Output, p_Style, p_Model ){
                p_Output.BeginParagraphF( p_Style );
                    p_Output.OutputLnF( getString("TEXT_CONNECTIONS"), "TEXT_DEFAULT_BOLD" );
                p_Output.EndParagraph( );
                reqdocu_PrintCxnsTable( p_Output, p_Style,  p_Model );
            }//END::extdata_PrintCxnsTable()
        }//END::extdata_PrintExtDataInfo()
    }//END::reqdocu_ExtendedDataInfo()
// END::Output Functions part----------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// Classes-----------------------------------------------------------------------------------------
    function cl_Cxns(){
        this.CxnsArray  = new java.util.HashSet();
        this.CxnsBSMod  = new java.util.HashSet();
        this.CxnsAddMod = new java.util.HashSet();
        
        cl_Cxns.prototype.AddCxn        = function( p_Val ){
            if( p_Val != null ){
                this.CxnsArray.add( p_Val );
                this.CxnsBSMod.add( p_Val.Model() );
            }
        }
        
        cl_Cxns.prototype.AddMod        = function( p_Val ){
            if( p_Val != null ) { this.CxnsAddMod.add( p_Val ); }            
        }
        
        cl_Cxns.prototype.Initialize    = function( p_Obj ){
            if( p_Obj != null ){
                var aObjOcc     = (p_Obj.KindNum() == Constants.CID_OBJOCC)?[p_Obj]:p_Obj.OccList();
                for(var i=0; i<aObjOcc.length; i++){
                    if( aObjOcc[i].IsValid() ){
                        var aCnxs   = aObjOcc[i].Cxns();
                        var bFound  = false;
                        for( var j=0; j<aCnxs.length; j++){
                            if( aCnxs[j].IsValid() ){
                                var oTrgObj = commonUtils.search.searchConnectedObjOcc(aObjOcc[i], aCnxs[j]);
                                if( ga_SelObjDefs.contains( oTrgObj.ObjDef() ) ){// AddCxns
                                    this.AddCxn( aCnxs[j] );
                                    bFound  = true;
                                    break;
                                }
                            }
                        }//END::for_j                                
                        if( !bFound ){// AddMods
                            this.AddMod( aObjOcc[i].Model() );
                        }
                    }
                }//END::for_i
            }
        }
        
        cl_Cxns.prototype.GetCxnsArray  = function( ){
            var aOut    = [];
            if( this.CxnsArray.size() > 0 ){
                aOut    = this.CxnsArray.toArray();
                aOut.sort( CxnByActName );
            }
            return aOut;
        }
        
        cl_Cxns.prototype.GetAddMods    = function( ){
            var aOut    = [];
            if( this.CxnsAddMod.size() > 0 ){
                aOut    = this.CxnsAddMod.toArray();
                aOut.sort( ModByName );
            }
            return aOut;
        }
        
        cl_Cxns.prototype.GetBSMods     = function( ){
            var aOut    = [];
            if( this.CxnsBSMod.size() > 0 ){
                aOut    = this.CxnsBSMod.toArray();
                aOut.sort( ModByName );
            }
            return aOut;
        }

        cl_Cxns.prototype.PrintCxnsTable    = function( p_Output, p_Style ){
            var aCxns   = this.GetCxnsArray();
            if( (aCxns.length > 0) && (p_Output != null) && (p_Style != null) ){
                p_Output.BeginParagraphF( "TEXT_DEFAULT" );
                    p_Output.OutputLnF( getString("TEXT_CONNECTIONS_TO_BS"), "TEXT_DEFAULT_BOLD" );
                p_Output.EndParagraph( );

                p_Output.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_VCENTER | Constants.FMT_REPEAT_HEADER, 0 );
                p_Output.TableRow();// Output Header
                    addCell( p_Output, [1,1,1,1], getString("TEXT_TBL_CXNS_TYPE"), 40, "TEXT_HEADER_TBL" );
                    addCell( p_Output, [1,1,1,1], getString("TEXT_TBL_MOD"), 60, "TEXT_HEADER_TBL" );
                        
                for( var i=0; i<aCxns.length; i++ ){
                    p_Output.TableRow();
                        addCell( p_Output, [], aCxns[i].CxnDef().ActiveType(), 40, "TEXT_LEFTCOL_TBL" );
                        addCell( p_Output, [], "", 60, p_Style );
                        p_Output.OutputLinkF( getAttrStrValue( aCxns[i].Model(), Constants.AT_NAME ), "RD_MOD", p_Style );
                }//END::for_i
                p_Output.EndTable( "", 100, getString("TEXT_FONT_DEFAULT"), 8, Constants.C_TRANSPARENT, Constants.C_TRANSPARENT, Constants.FILLTYPE_SOLID, Constants.FMT_LEFT, 0);// DO NOT TRANSLATE THIS - MASH ZONE REQUIREMENT
            }
        }
        
        cl_Cxns.prototype.PrintModsList    = function( p_Output, p_Style, p_Val ){
            var aMods   = this.GetAddMods();
            if( (aMods.length > 0) && (p_Output != null) && (p_Style != null) ){
                p_Output.BeginParagraphF( "TEXT_DEFAULT" );
                    p_Output.OutputLnF( "", "TEXT_DEFAULT" );
                p_Output.EndParagraph( );
                p_Output.BeginParagraphF( "TEXT_DEFAULT" );
                    p_Output.OutputLnF( commonUtils.attsall.formatString(getString("TEXT_LIST_OF_ADDIT_MODS"), [p_Val]), "TEXT_DEFAULT_BOLD" );
                p_Output.EndParagraph( );

                p_Output.BeginList( Constants.BULLET_DEFAULT );
                for(var i=0; i<aMods.length; i++){
                    p_Output.OutputLinkF( getAttrStrValue( aMods[i], Constants.AT_NAME ), "RD_MOD" , p_Style );
                    p_Output.OutputLnF( "", "TEXT_DEFAULT_IR" );
                }//END::for_i
                p_Output.EndList();
            }
        }
    }//END::cl_Cxns()
    
    function cl_CapaObj(){
        this.COID   = null;
        this.CBMK   = null;
        this.CCxns  = new cl_Cxns();
        
        cl_CapaObj.prototype.Initialize     = function( p_Val ){
            if( (p_Val !=  null) && (p_Val.length > 0) ){
                this.COID   = p_Val;
                this.CBMK   = "BMK_" + p_Val;
                return true;
            }
            return false;
        }
    
        cl_CapaObj.prototype.GetCOID        = function( ){
            return this.COID;
        }
    
        cl_CapaObj.prototype.GetCBMK        = function( ){
            return this.CBMK;
        }

        cl_CapaObj.prototype.GetAddMods     = function( ){
            return this.CCxns.GetAddMods();
        }
        
        cl_CapaObj.prototype.GetBSMods     = function( ){
            return this.CCxns.GetBSMods();
        }

        cl_CapaObj.prototype.GetObj         = function( ){
            var oObj    = go_ActDB.FindOID( this.COID );
            if( (oObj.IsValid()) && ((oObj.KindNum() == Constants.CID_OBJOCC) || ((oObj.KindNum() == Constants.CID_OBJDEF))) ){
                return oObj;
            }
            return null;
        }

        cl_CapaObj.prototype.GetName        = function( ){
            var oObj    = go_ActDB.FindOID( this.COID );
            return getAttrStrValue( oObj, Constants.AT_NAME );
        }

        cl_CapaObj.prototype.GetNameType    = function( ){
            var oObj    = go_ActDB.FindOID( this.COID );
            return reqdocu_GetObjNameType( oObj );
        }

        cl_CapaObj.prototype.PrintLink      = function( p_Output, p_Style, p_Flag ){
            if( (p_Output != null) && (p_Style != null) ){
                if( (p_Flag != null) && (p_Flag == "DATA") ){
                    p_Output.OutputLinkF( this.GetNameType(), this.CBMK , p_Style );
                }
                else{
                    p_Output.OutputLinkF( this.GetName(), this.CBMK , p_Style );
                }
                p_Output.OutputLnF( "", "TEXT_DEFAULT_IR" );
            }
        }
        
        cl_CapaObj.prototype.PrintAttrTable = function( p_Output, p_Style ){
            var oObj    = this.GetObj();
            if( oObj != null ){
                var aAttr   = getAllowedObjAttributes( oObj );
                if( (p_Output != null) && (p_Style != null) && (aAttr != null) && (aAttr.length > 0) ){
                    p_Output.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_VCENTER | Constants.FMT_REPEAT_HEADER, 0 );
                    p_Output.TableRow();// Output Header
                        addCell( p_Output, [1,1,1,1], getString("TEXT_TBL_ATTR_NAME"), 40, "TEXT_HEADER_TBL" );
                        addCell( p_Output, [1,1,1,1], getString("TEXT_TBL_ATTR_VALUE"), 60, "TEXT_HEADER_TBL" );
                        
                    for( var i=0; i<aAttr.length; i++ ){
                        var aReadAttr   = getAttrValue( oObj, aAttr[i] );
                        if( aReadAttr != null ){
                            p_Output.TableRow();
                                addCell( p_Output, [], aReadAttr["NAME"], 40, "TEXT_LEFTCOL_TBL" );
                                addCell( p_Output, [], aReadAttr["VALUE"], 60, p_Style );
                        }
                    }//END::for_i
                    p_Output.EndTable( "Attributes", 100, getString("TEXT_FONT_DEFAULT"), 8, Constants.C_TRANSPARENT, Constants.C_TRANSPARENT, Constants.FILLTYPE_SOLID, Constants.FMT_LEFT, 0);// DO NOT TRANSLATE THIS - MASH ZONE REQUIREMENT
                }
            }
        }
        
        cl_CapaObj.prototype.PrintConnections   = function( p_Output, p_Style ){
            if( (p_Output != null) && (p_Style != null) ){
                this.CCxns.PrintCxnsTable( p_Output, p_Style );
            }
        }

        cl_CapaObj.prototype.PrintModels        = function( p_Output, p_Style ){
            if( (p_Output != null) && (p_Style != null) ){
                this.CCxns.PrintModsList( p_Output, p_Style, this.GetName() );
            }
        }
        
        cl_CapaObj.prototype.FindCnxs       = function( ){
            if( this.COID != null ){
                this.CCxns.Initialize( this.GetObj() );
            }
        }
        
        cl_CapaObj.prototype.Destroy        = function( ){
            this.COID   = null;
            this.CBMK   = null;
        }
    }//END::cl_CapaObj()

    function cl_Library(){
        this.aObj   = [];
        
        cl_Library.prototype.LibSize    = function( ){
            return this.aObj.length;
        }
        
        cl_Library.prototype.IsEmpty    = function( ){
            if( this.LibSize() > 0 ) return false;
            else true;
        }

        cl_Library.prototype.Get            = function( p_Val ){
            if( (p_Val != null) && (p_Val < this.LibSize()) ){
                return this.aObj[ p_Val ];
            }
            return null;
        }

        cl_Library.prototype.GetMods    = function( p_Flag ){
            var hs_Out  = new java.util.HashSet();
            if( this.LibSize() > 0 ){
                for(var i=0; i<this.LibSize(); i++){
                    var aMods   = ( p_Flag == "ADD")?this.Get(i).GetAddMods():this.Get(i).GetBSMods();
                    for(var j=0; j<aMods.length; j++){
                        hs_Out.add( aMods[j] );
                    }//END::for_j
                }//END::for_i
                return hs_Out.toArray();
            }
            return [];
        }
        
        cl_Library.prototype.SortLib    = function( p_Val ){
            this.aObj.sort( p_Val );
        }
        
        cl_Library.prototype.Add        = function( p_Val ){
            var newObj  = new cl_CapaObj();
            
            if( newObj.Initialize( p_Val ) ){
                this.aObj.push( newObj );
                newObj.FindCnxs();
            }
        }
    
        cl_Library.prototype.Initialize = function( p_Val ){
            if( (p_Val != null) && (p_Val.length() > 0) ){
                var aVal    = p_Val.split( "," );
                for(var i=0; i<aVal.length; i++){
                    this.Add( aVal[i] );
                }//END::for_i
            }
        }

        cl_Library.prototype.PrintLinks     = function( p_Output, p_Style, p_Flag ){
            if( (p_Style != null) && (p_Output != null) ){
                for( var i=0; i<this.LibSize(); i++){
                    this.Get(i).PrintLink( p_Output, p_Style, p_Flag );
                }//END::for_i
            }
        }
        
        cl_Library.prototype.Destroy        = function( ){
            for(var i=0; i<this.LibSize(); i++){
                this.Get(i).Destroy();
            }
            this.aObj   = null;
        }
    }//END::clLibrary()
// END::Classes------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------