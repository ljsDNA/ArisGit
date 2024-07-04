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
 
//-------------------------------------------------------------------------------------------------
// Output hierarchy (for MashZone); 2011/01/24;
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
// Declaration's part------------------------------------------------------------------------------
    var gn_Lang             = Context.getSelectedLanguage();
    var gs_Empty            = java.lang.String( convToBytes("") );
    var go_ActDB            = ArisData.getActiveDatabase();
    var go_Filter           = ArisData.ActiveFilter();
    var gs_XMLConfigFile    = "HierarchyConfig.xml";
    var c_nTABLE_SIZE       = 250;
    var c_nCELL_WIDTH       = 20;
    var c_xmlHierarchy      = "Hierarchy";
    var c_xmlAddSubgrps     = "addSubgroups";
    var c_xmlAbortCycs      = "abortOnCycles";
    var c_xmlCnx            = "Cxn";
    var c_xmlType           = "type";
    var c_xmlSource         = "Source";
    var c_xmlTarget         = "Target";
    var gb_Cycles           = false;

// END::Declaration's part-------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// MAIN part---------------------------------------------------------------------------------------

    var nROW_MAX = 65500;   // BLUE-5538

    // Do not show anything - call execution and quit
    Context.setProperty( Constants.PROPERTY_SHOW_OUTPUT_FILE, false );
    Context.setProperty( Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false );
    var ga_Config   = ohMZ_ReadXMLConfig( gs_XMLConfigFile );
    var ga_Scope    = ohMZ_GetScope( ga_Config.OptSubgrps(), ga_Config.GetAllSrcTrg() );
    
    if( (ga_Config != null) && (ga_Config.LibSize() > 0) && (ga_Scope != null) && (ga_Scope.length > 0) ){
        // Set default report output options
        Context.setProperty( Constants.PROPERTY_SHOW_OUTPUT_FILE, true );
        Context.setProperty( Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false );

        var outFile = Context.createOutputObject( Context.getSelectedFormat(), Context.getSelectedFile() );
            outFile.Init( gn_Lang );
        
        var aPath       = ohMZ_PathBuilder( ga_Config, ga_Scope );
        if( aPath != null ){
            ohMZ_HierarchyTable( outFile, aPath );
            ohMZ_AttributeTable( outFile, readDefsFromPath( aPath ) );
        }
        ohMZ_ErrorsTable( outFile );
        outFile.WriteReport();
    }
// END::MAIN part----------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// Functions part----------------------------------------------------------------------------------
    function convToBytes( p_Val ){
        return java.lang.String( p_Val ).getBytes();
    }//END::convToBytes()


    function getAttrValue( p_Obj, p_attrTypeNum ){
        if( (p_Obj != null) && (p_Obj.IsValid()) ){
            var oObj    = (p_Obj.KindNum() == Constants.CID_OBJOCC)?p_Obj.ObjDef():p_Obj;
            var p_Attr  = oObj.Attribute( p_attrTypeNum, gn_Lang, true );
            if( (p_Attr.IsValid() == false) || (p_Attr.IsMaintained() == false) ){
                return gs_Empty;
            }

            switch( ArisData.ActiveFilter().AttrBaseType( p_Attr.TypeNum() ) ){
                case Constants.ABT_MULTILINE:
                    return java.lang.String( convToBytes( p_Attr.GetValue(false) ) );
                    break;
                case Constants.ABT_BOOL:
                    return java.lang.Boolean.parseBoolean( p_Attr.GetValue(false) );
                    break;
                case Constants.ABT_VALUE:
                    return p_Attr.getValue();
                    break;
                case Constants.ABT_SINGLELINE:
                    return java.lang.String( convToBytes( p_Attr.GetValue(true) ) );
                    break;
                case Constants.ABT_INTEGER:
                    return parseInt( p_Attr.GetValue(false) );
                    break;
                case Constants.ABT_RANGEINTEGER:
                    return parseInt( p_Attr.GetValue(false) );
                    break;
                case Constants.ABT_FLOAT:
                    return parseFloat( p_Attr.GetValue(false) );
                    break;
                case Constants.ABT_RANGEFLOAT:
                    return parseFloat( p_Attr.GetValue(false) );
                    break;
                case Constants.ABT_DATE:
                    return p_Attr.getValueStd();
                    break;
                case Constants.ABT_TIME:
                    return p_Attr.getValueStd();
                    break;
                case Constants.ABT_TIMESTAMP:
                    return p_Attr.getValueStd();
                    break;
                case Constants.ABT_TIMESPAN:
                    return p_Attr.getValueStd();
                    break;
                case Constants.ABT_FILE:
                    return p_Attr.MeasureValue(false);
                    break;
                case Constants.ABT_FOREIGN_ID:
                    return p_Attr.GetValue(false);
                    break;
                case Constants.ABT_COMBINED:
                    return p_Attr.getMeasureValueAsString();
                    break;
                case Constants.ABT_ITEMTYPE:
                    return p_Attr.GetValue(false);
                    break;
                case Constants.ABT_LONGTEXT:
                    return p_Attr.MeasureValue(false);
                    break;
                case Constants.ABT_BITMAP:
                    return p_Attr.MeasureValue();
                    break;
                case Constants.ABT_BLOB:
                    return p_Attr.MeasureValue();
                    break;
            }//END::switch()
            return gs_Empty;
        }
    }//END::getAttrValue()

    
    function RGB(r, g, b) {
    	return (new java.awt.Color(r/255.0,g/255.0,b/255.0,1)).getRGB() & 0xFFFFFF;
    }//END::RGB()
    
    
    function ohMZ_GetScope( op_AddSubGrp, op_DefTypes ){
        var aOut    = new Array();
            aOut    = aOut.concat( _DefsFromArray( "DB", ArisData.getSelectedDatabases() ) );
            aOut    = aOut.concat( _DefsFromGrps( op_AddSubGrp, ArisData.getSelectedGroups() ) );
            aOut    = aOut.concat( _DefsFromArray( "MOD", ArisData.getSelectedModels() ) );
            aOut    = aOut.concat( ArisData.getSelectedObjDefs() );
            aOut    = aOut.concat( _DefsFromArray( "OCC", ArisData.getSelectedObjOccs() ) );

        if( aOut.length > 0 ){
            aOut    = ArisData.Unique( aOut );
            aOut    = _FilterDefs( op_DefTypes, aOut );
        }
        return aOut;
        
        function _FilterDefs( op_DefTypes, p_Array ){
            var outDefs = [];
            for(var i=0; i<p_Array.length; i++ ){
                if( op_DefTypes.contains( p_Array[i].TypeNum() ) ){
                    outDefs.push( p_Array[i] );
                }
            }//END::for_i
            return outDefs;
        }//END::_FilterDefs()
        
        function _DefsFromArray( p_Flag, p_Array ){
            var outDefs = [];
            if( (p_Array != null) && (p_Array.length > 0) ){
                for( var i=0; i<p_Array.length; i++){
                    var aTmp    = [];
                    if( p_Flag == "DB" ) { aTmp     = p_Array[i].Find( Constants.SEARCH_OBJDEF ); }
                    if( p_Flag == "MOD" ) { aTmp    = p_Array[i].ObjDefList(); }
                    if( p_Flag == "OCC" ) { aTmp    = [p_Array[i].ObjDef()]; }

                    if( (aTmp != null) && (aTmp.length > 0) ){
                        outDefs = outDefs.concat( aTmp );
                    }
                }//END::for_i
            }
            return ArisData.Unique( outDefs );
        }//END::_DefsFromArray()
        
        function _DefsFromGrps( p_Option, p_Grps ){
            var outDefs = [];

            if( p_Option ){
                var aTmp    = [];
                    aTmp    = aTmp.concat( p_Grps );
                for( var i=0; i<p_Grps.length; i++){
                    aTmp    = aTmp.concat( p_Grps[i].Childs( true ) );
                }//END::for_i
                p_Grps  = ArisData.Unique( aTmp );
            }
            
            for( var i=0; i<p_Grps.length; i++){
                var aTmp    = p_Grps[i].ObjDefList();
                if( (aTmp != null) && (aTmp.length > 0) ){
                    outDefs = outDefs.concat( aTmp );
                }
            }//END::for_i

            return ArisData.Unique( outDefs );
        }//END::_DefsFromGrps()
    }//END::ohMZ_GetScope()


    function getTypeNum( oItem ){
        return new java.lang.Integer( oItem.TypeNum() );
    }//END::getTypeNum()
    
    function getObjTypeName(p_TypeNum ){
        return go_Filter.ObjTypeName( p_TypeNum );
    }//END::getObjTypeName()

    function getAttrTypeName(p_TypeNum ){
        return go_Filter.AttrTypeName( p_TypeNum );
    }//END::getAttrTypeName()
    

    function getItemName( oItem ){
        var sName = oItem.Name( gn_Lang );
        if (sName.length == 0) sName = getString("TEXT_UNTITLED");
        return sName;
    }//END::getItemName()


    function readDefsFromPath( p_Path ){
        var aOut    = new Array();
        if( p_Path != null ){
            for( var i=0; i<p_Path.length; i++ ){
                var actPath = p_Path[i];
                for( var j=0; j<actPath.length; j++ ){
                    aOut.add( actPath[j] );
                }//END::for_j
            }//END::for_i
        }
        return aOut;
    }//END::readDefsFromPath()

    
    function getAllowedMaintainedObjAttributes( p_Obj ){
        var aOut    = [];
        if( (p_Obj != null) && (p_Obj.IsValid()) ){
            var oObj        = ( p_Obj.KindNum() == Constants.CID_OBJOCC )?p_Obj.ObjDef():p_Obj;
            var aObjAttr    = go_Filter.AttrTypes( Constants.CID_OBJDEF, oObj.TypeNum() );
            for( var i=0; i<aObjAttr.length; i++ ){
                var attr    = oObj.Attribute( aObjAttr[i], gn_Lang, true);
                if( (attr != null) && (attr.IsMaintained())  ){
                    aOut.push( aObjAttr[i] );
                }
            }//END::for_xI
        }
        aOut.sort( sortAttrName );
        return aOut;
    }//END::getAllowedObjAttributes()

        
    function createAttrList( p_Defs ){
        var aOut    = new Array();
        if( (p_Defs != null) && (p_Defs.length > 0) ){
            for( var i=0; i<p_Defs.length; i++ ){
                var attrNums    = getAllowedMaintainedObjAttributes( p_Defs[i] );
                for( var j=0; j< attrNums.length; j++ ){
                    aOut.add( attrNums[j] );
                }//END::for_j
            }//END::for_i
        }
        return aOut;
    }//END::createAttrList()
    
    function sortByName( a, b ){
        return ( a.Name( gn_Lang ).compareToIgnoreCase( b.Name( gn_Lang ) ) );
    }//END::sortByName()
    

    function sortAttrName( a, b ){
        return ( getAttrTypeName(a).compareToIgnoreCase( getAttrTypeName(b) ) );
    }//END::sortAttrName()
    
    
    function ohMZ_HierarchyTable( outFile, aPath ){
        if( (outFile != null) && (aPath != null) ){
            var colNum      = getTableColumnCount( aPath );
            var colWidth    = countColWidth( colNum );

            outFile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            outputTableHeader( outFile, colNum, colWidth );
            var bColored = false;   // variable to change background color of table rows
            var nRowCount = 1;
            var nTableCount = 1;
            
            for( var i=0; i<aPath.length; i++ ){
                var actPath = aPath[i];
                
                if (nRowCount == nROW_MAX) {    // BLUE-5538
                    outFile.EndTable(getTableName(nTableCount), 100, getString("TEXT_FONT_DEFAULT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    outFile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
                    outputTableHeader( outFile, colNum, colWidth );
                    bColored = false;   // variable to change background color of table rows
                    nRowCount = 1;
                    nTableCount++;
                }
                nRowCount++;
                
                outFile.TableRow();
                for( var j=0; j<actPath.length; j++ ){
                    outFile.TableCell( actPath[j].Name( gn_Lang ), colWidth, getString("TEXT_FONT_DEFAULT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                }//END::for_j
                bColored    = !bColored; // Change background color
            }//END::for_i
            outFile.EndTable(getTableName(nTableCount), 100, getString("TEXT_FONT_DEFAULT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            nTableCount++;
        }
        
        function getTableName(nTableCount) {
            var sTableName = "Hierarchy";
            if (nTableCount > 1) sTableName += "_" + nTableCount;
            return sTableName;
        }

        function outputTableHeader( p_Out, p_Col, p_Width ){
            p_Out.TableRow();
            for(var i=0; i<p_Col; i++ ){
                p_Out.TableCell( ("Level " + i), p_Width, getString("TEXT_FONT_DEFAULT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
            }//END::for_i
        }//END::outputTableHeader()
        
        function countColWidth( p_Val ){
            var nWidth  = 100;
            if( (p_Val != null) && (p_Val != 0) ){
                return Math.floor( 100 / p_Val );
            }
            return nWidth;
        }//END::countColWidth()
        
        function getTableColumnCount( p_Array ){
            var nCounter    = 0;
            for(var i=0; i< p_Array.length; i++ ){
                if( (p_Array[i].length) > nCounter ){
                    nCounter    = p_Array[i].length;
                }
            }//END::for_i
            return nCounter;
        }//END::getTableColumnCount()
    }//END::ohMZ_HierarchyTable()
    
    
    function ohMZ_ErrorsTable( outFile ){
        if( gb_Cycles ){
            var sOut    = ( ga_Config.OptCycles() )?getString("TEXT_ERROR_ABORT_TRUE"):getString("TEXT_ERROR_ABORT_FALSE");
    
            outFile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            outFile.TableRow();
                outFile.TableCell( sOut, 100, getString("TEXT_FONT_DEFAULT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(false), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
            outFile.EndTable("Errors", 100, getString("TEXT_FONT_DEFAULT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        }
    }//END::ohMZ_ErrorsTable()
    
    
    function ohMZ_AttributeTable( outFile, p_Defs ){
        var aAttrList   = createAttrList( p_Defs );
            p_Defs.sort( sortByName );
            aAttrList.sort( sortAttrName );
        var attrColNum  = getAttrColumnCount( aAttrList );

        outFile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        outputTableHeader( outFile, attrColNum, aAttrList );
        var bColored = false;   // variable to change background color of table rows
        for( var i=0; i<p_Defs.length; i++ ){
            var oObj    = p_Defs[i];
            outFile.TableRow();
                outFile.TableCell( getItemName( oObj ), c_nCELL_WIDTH, getString("TEXT_FONT_DEFAULT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                outFile.TableCell( getObjTypeName( getTypeNum( oObj ) ), c_nCELL_WIDTH, getString("TEXT_FONT_DEFAULT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                outFile.TableCell( oObj.GUID(), c_nCELL_WIDTH, getString("TEXT_FONT_DEFAULT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                // Output Attributes
                for( var j=0; j<attrColNum; j++ ){
                    outFile.TableCell( getAttrValue( oObj, aAttrList[j] ), c_nCELL_WIDTH, getString("TEXT_FONT_DEFAULT"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                }//END::for_j
            bColored    = !bColored; // Change background color
        }//END::for_i
        outFile.EndTable("Objects", 100, getString("TEXT_FONT_DEFAULT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        
        function outputTableHeader( p_Out, p_Col, p_AttrList ){
            p_Out.TableRow();
                p_Out.TableCell(getString("TEXT_TBL_NAME"), c_nCELL_WIDTH, getString("TEXT_FONT_DEFAULT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                p_Out.TableCell(getString("TEXT_TBL_TYPE"), c_nCELL_WIDTH, getString("TEXT_FONT_DEFAULT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                p_Out.TableCell(getString("TEXT_TBL_GUID"), c_nCELL_WIDTH, getString("TEXT_FONT_DEFAULT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);            
            for(var i=0; i<p_Col; i++ ){
                p_Out.TableCell( go_Filter.AttrTypeName( p_AttrList[i] ), c_nCELL_WIDTH, getString("TEXT_FONT_DEFAULT"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
            }//END::for_i
        }//END::outputTableHeader()
        
        function getAttrColumnCount( p_Array ){
            if( p_Array != null ){
                return (p_Array.length > c_nTABLE_SIZE)? c_nTABLE_SIZE:p_Array.length;
            }
            return 0;
        }//END::getTableColumnCount()
    }//END::ohMZ_AttributeTable()


    function ohMZ_PathBuilder( p_Config, p_Scope ){

        function getConnectedDef( p_Obj, aCxns ){
            var aOut    = [];

            for( var i=0; i<aCxns.length; i++ ){
                var oSrc    = aCxns[i].SourceObjDef();
                var oTrg    = aCxns[i].TargetObjDef();
                if( (p_Obj.equals( oSrc )) && (ga_Config.IsValidTrg(aCxns[i].TypeNum(), oTrg.TypeNum())) ){
                    aOut.push( oTrg );
                }
                else if( (p_Obj.equals( oTrg )) && (ga_Config.IsValidSrc(aCxns[i].TypeNum(), oSrc.TypeNum())) ){
                    aOut.push( oSrc );
                }
            }//END::for_i
            
            return aOut;
        }//END::getConnectedDef()

        
        function getValidCxnsList( p_Obj, p_Dir ){
            var aOut        = new Array();
            var aStdCxns    = p_Obj.CxnList( p_Dir );
            
            for( var i=0; i<aStdCxns.length; i++ ){
                if( ga_Config.IsValidCxn( aStdCxns[i].TypeNum() ) ){
                    aOut.push( aStdCxns[i] );
                }
            }//END::for_i
        
            return aOut;
        }
        
        function isRootLeafNode( aCxns ){
            if( (aCxns != null) && (aCxns.length < 1) ){
                return true;
            }
            return false;
        }//END::isRootLeafNode()


        function existPathInAllPath( p_Path ){
            if( (aAllThreads != null) && (aAllThreads.length > 0) && (p_Path != null) && (p_Path.length > 0) ){
                for( var i=0; i<aAllThreads.length; i++ ){
                    var refPath = aAllThreads[i];
                    var bResult = true;
                    for( var j=0; j<p_Path.length; j++ ){
                        if( !(refPath[j].equals( p_Path[j] )) ){
                            bResult   = false;
                            break;
                        }
                    }//END::for_j
                    if( bResult )   return true;
                }//END::for_i
            }
            return false;
        }//END::existPathInAllPath()
        
        function createAndSaveWholePath( aPThread, aSThread ){
            if( (aAllThreads != null) && (aPThread != null) && (aSThread != null) && (aPThread.length > 0) && (aSThread.length > 0) ){
                for( var i=0; i<aPThread.length; i++ ){
                    // aPThread[i] = removeLastElm( aPThread[i] );
                    for( var j=0; j<aSThread.length; j++ ){
                        var actPath = aPThread[i].concat( aSThread[j] );
                        // If actPath !exists in aAllThreads then add
                        if( !existPathInAllPath( actPath ) ){
                            aAllThreads.push( actPath );
                        }
                    }//END::for_j
                }//END::for_i
            }
            return aAllThreads;
        }//END::createAndSaveWholePath()
        
        function storeFoundPath( p_Path, p_Dir ){
            if( (p_Path != null) && (p_Path.length > 0) && (p_Dir != null) ){
                if( p_Dir == Constants.EDGES_IN ){
                    aPredThread.push( reverse( p_Path ) );
                }
                if( p_Dir == Constants.EDGES_OUT ){
                    aSuccThread.push( p_Path.copy() );
                }
            }
            
            function reverse( aPath ){
                var aOut    = [];
                for( var i=(aPath.length-1); i>0; i-- ){
                    aOut.push( aPath[i] );
                }//END::for_i
                return aOut;
            }//END::reverse()
        }//END::storeFoundPath()
        
        function Recursion( p_Obj, p_Dir ){
            var bAbort  = false;
            if( aActThread.contains( p_Obj ) ){// Cycle found
                gb_Cycles   = true;
                return ga_Config.OptCycles();// Abort building Path if option Abort On Cycles == true
            }
            else if( !bAbort ){
                aActThread.push( p_Obj );
                nameThread.push( p_Obj.Name(gn_Lang) );
                var aCxns   = getValidCxnsList( p_Obj, p_Dir );
                if( isRootLeafNode( aCxns ) ){// Root found
                    storeFoundPath( aActThread, p_Dir );// Store found partial path into relevant thread
                }
                else{
                    var aConnected  = getConnectedDef( p_Obj, aCxns );
                    for( var i=0; i<aConnected.length; i++ ){
                        bAbort  = Recursion( aConnected[i], p_Dir );
                        if( bAbort ) { break; }
                    }//END:for_i
                }
            }
            
            aActThread.pop();
            nameThread.pop();
            return bAbort;
        }//END::Recursion()

        var aAllThreads = new Array();
        var aActThread  = new Array();
        var nameThread  = new Array();
        var aPredThread = new Array();
        var aSuccThread = new Array();
        var con         = [ Constants.EDGES_IN, Constants.EDGES_OUT ];

        for( var i=0; i<p_Scope.length; i++ ){
            for( j=0; j<con.length; j++ ){
                aActThread  = new Array();
                nameThread  = new Array();
                if( (con[j] == Constants.EDGES_IN) && (ga_Config.IsValidTrgDef( p_Scope[i].TypeNum() )) ||
                    (con[j] == Constants.EDGES_OUT) && (ga_Config.IsValidSrcDef( p_Scope[i].TypeNum() )) ){

                    if( Recursion( p_Scope[i], con[j] ) ) { return null; }
                }
            }//END::for_j
        }//END::for_i

        return createAndSaveWholePath( aPredThread, aSuccThread );
    }//END::ohMZ_PathBuilder()


    //---------------------------------------------------------------------------------------------
    //XML functions--------------------------------------------------------------------------------
    function ohMZ_ReadXMLConfig( p_XMLFile ){
        var oConfig     = new cl_Config();
        
        var fileData    = Context.getFile( gs_XMLConfigFile, Constants.LOCATION_SCRIPT );
        var xmlReader   = Context.getXMLParser( fileData );
        
        if( xmlReader.isValid() ){
            var xmlRoot     = xmlReader.getRootElement();
            var xmlCxnList  = xmlRoot.getChildren( c_xmlCnx );

            oConfig = _readHierarchyParameters( oConfig, xmlRoot );
            oConfig = _readCxnsParameters( oConfig, xmlCxnList );

            return oConfig;
        }
        return null;

        function _readHierarchyParameters( p_Config, p_Hierarchy ){
            p_Config.SetSubgrps( xml_getXmlAttr_Bool( p_Hierarchy, c_xmlAddSubgrps) );
            p_Config.SetCycles( xml_getXmlAttr_Bool( p_Hierarchy, c_xmlAbortCycs) );
            return p_Config;
        }//END::_readHierarchyParameters()
        
        function _readCxnsParameters( p_Config, p_CxnsList ){
            if( !p_CxnsList.isEmpty() ){
                var Iterator    = p_CxnsList.iterator();
                while( Iterator.hasNext() ){
                    var iKey        = Iterator.next();
                    var nCxnType    = xml_getTypeNum( xml_getXmlAttr(iKey, c_xmlType) );
                    var aSrcOTypes  = xml_getSrcTrgEntry( iKey.getChildren(c_xmlSource) );
                    var aTrgOTypes  = xml_getSrcTrgEntry( iKey.getChildren(c_xmlTarget) );
                    if( nCxnType != null ){
                        p_Config.AddCxn( nCxnType, aSrcOTypes, aTrgOTypes );
                    }
                }//END::while()
            }
            return p_Config;
        }//END::_readCxnsParameters()
    }//END::ohMZ_ReadXMLConfig()
    
    function xml_getSrcTrgEntry( p_List ){
        if( p_List.isEmpty() ) { return []; }
        
        var aOut        = [];
        var Iterator    = p_List.iterator();
        while( Iterator.hasNext() ){
            var iKey        = Iterator.next();
            var nTypeNum    = xml_getTypeNum( xml_getXmlAttr(iKey, c_xmlType) );
            if( nTypeNum != null ) { aOut.push( nTypeNum ); }
        }//END::while()
    
        return ArisData.Unique( aOut );
    }//END::xml_getSrcTrgEntry()
    
    function xml_getXmlAttr_Bool( p_Entry, sAttrName) {
        var attr    = p_Entry.getAttribute( sAttrName ).getValue();
        return ( StrComp( attr, "true" ) == 0 );
    }//END::xml_getXmlAttr_Bool()

    function xml_getXmlAttr( p_Entry, sAttrName) {
        var oAttr   = p_Entry.getAttribute( sAttrName );
        return ( (oAttr !=null)?oAttr.getValue():null );
    }//END::xml_getXmlAttr()

    function xml_getTypeNum( p_typeNum ){
        if( (p_typeNum == null) || (String(p_typeNum).length < 1) ){
            return null;
        }
        var nTypeNum = p_typeNum;
        if( isNaN(p_typeNum) ){
            nTypeNum = Constants[p_typeNum];
            if( (typeof(nTypeNum) == "undefined") || isNaN(nTypeNum) || !go_Filter.IsValidObjType(nTypeNum) ){
                return null;
            }
        }
        return parseInt( nTypeNum );
    }//END::xml_getTypeNum()
    //END::XML functions---------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------
    
// END::Output Functions part----------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------------------------------------
// Classes-----------------------------------------------------------------------------------------
    function cl_Cxns(){
        this.Num    = null;
        this.Src    = [];
        this.Trg    = [];
        
        cl_Cxns.prototype.Set           = function( p_Num, p_Src, p_Trg ){
            if( (p_Num != null) && (p_Src != null) && (p_Trg != null) ){
                this.Num    = p_Num;
                this.Src    = p_Src;
                this.Trg    = p_Trg;
                return true;
            }
            return false;
        }

        cl_Cxns.prototype.GetNum        = function( ){
            return this.Num;
        }

        cl_Cxns.prototype.GetSrc        = function( ){
            return this.Src;
        }

        cl_Cxns.prototype.GetTrg        = function( ){
            return this.Trg;
        }
    }//END::cl_Cxns()
    
    function cl_Config(){
        this.AddSubgrps     = false;
        this.AbortOnCycs    = true;
        this.aCxns          = [];
        this.aCxnNum        = [];
        this.aSrc           = [];
        this.aTrg           = [];
        
        cl_Config.prototype.LibSize     = function( ){
            return this.aCxns.length;
        }
        
        cl_Config.prototype.SetSubgrps  = function( p_Val ){
            if( p_Val != null ){
                this.AddSubgrps = p_Val;
            }
        }
        
        cl_Config.prototype.SetCycles   = function( p_Val ){
            if( p_Val != null ){
                this.AbortOnCycs    = p_Val;
            }
        }
        
        cl_Config.prototype.PushSrc     = function( p_Vals ){
            if( p_Vals != null ){
                for( var i=0; i<p_Vals.length; i++){
                    this.aSrc.add( p_Vals[i] );
                }//END::for_i
            }
        }
        
        cl_Config.prototype.PushTrg     = function( p_Vals ){
            if( p_Vals != null ){
                for( var i=0; i<p_Vals.length; i++){
                    this.aTrg.add( p_Vals[i] );
                }//END::for_i
            }
        }

        cl_Config.prototype.AddCxn      = function( p_Num, p_Src, p_Trg ){
            var newCxn  = new cl_Cxns();
            if( newCxn.Set(p_Num, p_Src, p_Trg) ){
                this.aCxns.push( newCxn );
                this.aCxnNum.add( p_Num );
                this.PushSrc( p_Src );
                this.PushTrg( p_Trg );
            }
        }
        
        cl_Config.prototype.GetAllCxnNum    = function( ){
            return this.aCxnNum;
        }
        
        cl_Config.prototype.GetAllSrc   = function( ){
            return this.aSrc;
        }
        
        cl_Config.prototype.GetAllTrg   = function( ){
            return this.aTrg;
        }
        
        cl_Config.prototype.GetAllSrcTrg    = function( ){
            var aSrc    = [];
            var aTrg    = [];
                aSrc    = this.GetAllSrc();
                aTrg    = this.GetAllTrg();
            return ( ArisData.Unique( aSrc.concat(aTrg) ) );
        }

        cl_Config.prototype.GetCxnSrc   = function( p_Cxn ){
            var aOut    = new Array();
            if( p_Cxn != null ){
                for( var i=0; i<this.aCxns.length; i++ ){
                    if( this.aCxns[i].GetNum() == p_Cxn ){
                        aOut    = aOut.concat( this.aCxns[i].GetSrc() );
                    }
                }//END::for_i
            }
            return ( ArisData.Unique( aOut ) );
        }
        
        cl_Config.prototype.GetCxnTrg   = function( p_Cxn ){
            var aOut    = new Array();
            if( p_Cxn != null ){
                for( var i=0; i<this.aCxns.length; i++ ){
                    if( this.aCxns[i].GetNum() == p_Cxn ){
                        aOut    = aOut.concat( this.aCxns[i].GetTrg() );
                    }
                }//END::for_i
            }
            return ( ArisData.Unique( aOut ) );
        }

        cl_Config.prototype.IsValidCxn  = function( p_Val ){
            if( p_Val != null ){
                var aCxns   = this.GetAllCxnNum();
                if( (aCxns != null) && (aCxns.contains( p_Val )) ){
                    return true;
                }
            }
            return false;
        }
        
        cl_Config.prototype.IsValidSrc  = function( p_Cxn, p_Val ){
            if( (p_Val != null) && (this.IsValidCxn( p_Cxn )) ){
                var aSrc    = this.GetCxnSrc( p_Cxn );
                if( (aSrc != null) && (aSrc.contains( p_Val )) ){
                    return true;
                }
            }
            return false;
        }

        cl_Config.prototype.IsValidTrg  = function( p_Cxn, p_Val ){
            if( (p_Val != null) && (this.IsValidCxn( p_Cxn )) ){
                var aTrg    = this.GetCxnTrg(p_Cxn );
                if( (aTrg != null) && (aTrg.contains( p_Val )) ){
                    return true;
                }
            }
            return false;
        }

        cl_Config.prototype.IsValidSrcDef   = function( p_Val ){
            if( p_Val != null ){
                return this.GetAllSrc().contains( p_Val );
            }
            return false;
        }

        cl_Config.prototype.IsValidTrgDef   = function( p_Val ){
            if( p_Val != null ){
                return this.GetAllTrg().contains( p_Val );
            }
            return false;
        }
        
        cl_Config.prototype.OptSubgrps  = function( ){
            return this.AddSubgrps;
        }

        cl_Config.prototype.OptCycles   = function( ){
            return this.AbortOnCycs;
        }
    }//END::cl_Config()
// END::Classes------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------