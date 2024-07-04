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
// Delete empty synchronization models::@zona 2009.08.07;;17:58
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
// Fixes done: ANUBIS 425490; 425487; 434101-.info; 425496; 437793; 436732; 437825; 437871
//-------------------------------------------------------------------------------------------------

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

//-------------------------------------------------------------------------------------------------
// Declaration's part-------------------------------------------------------------------------
var gn_FTProcess    = Constants.AVT_PROC_1;
var gn_FTScenario   = Constants.AVT_SCEN;
var gn_FTProcStep   = Constants.AVT_SOLAR_PROCESS_STEP;
var gn_Empty        = -1;
var gn_ErrCount     = 0;

var gs_Lang         = Context.getSelectedLanguage();
var gs_Empty        = new Packages.java.lang.String("-");
var gs_cEmpty     	= new Packages.java.lang.String("");
var ga_SelGrps      = ArisData.getSelectedGroups();
var ga_SelMods      = ArisData.getSelectedModels();

var ga_DelMods      = new java.util.HashMap();
var ga_DelGrps      = new java.util.HashMap();
var ga_GrpsToDel    = new java.util.HashSet();
var ga_OKToDelGrp   = new java.util.HashSet();

var gb_IsModOpen    = false;
// END::Declaration's part------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// MAIN part---------------------------------------------------------------------------------
    ThrowAwayEmptyGrps( );// ANUBIS 437793
    if( (ga_SelGrps.length < 1) && (ga_SelMods.length > 0) ){// Only model(s) were selected ANUBIS 437793
        //Ask User to close opened models from selection
        gb_IsModOpen    = isModelOpened( ga_SelMods );//ANUBIS 425490
        if( gb_IsModOpen == false ){//ANUBIS 425490
            checkDelMods( ga_SelMods );
            DelEmptyGrps( ga_GrpsToDel.toArray() );
        }
    }
    else if( ga_SelGrps.length > 0 ){//Group(s) were selected ANUBIS 437793
        getScopeMods( ga_SelGrps );
        gb_IsModOpen    = isModelOpened( ga_SelMods );//ANUBIS 425490
        if( gb_IsModOpen == false ){//ANUBIS 425490
            checkDelMods( ga_SelMods );
            MergeGrps( ga_SelGrps );
            DelEmptyGrps( ga_GrpsToDel.toArray() );
        }
    }
    
    if( gb_IsModOpen == false ) { printOutReport(); }//ANUBIS 425490
// END::MAIN part---------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// Functions part------------------------------------------------------------------------------
function isModelOpened( p_aMods ){//Added on behalf of ANUBIS 425490
    for(var i=0; i<p_aMods.length; i++){
        ArisData.getActiveDatabase().setAutoTouch( false );
    
        try{
            p_aMods[i].setBgColor( p_aMods[i].getBgColor() );
        }//END::try
        catch(e){
            Dialogs.MsgBox( getString("ERROR_MSG_OPENED_MODELS"), Constants.MSGBOX_ICON_INFORMATION|Constants.MSGBOX_BTN_OK, getString("DIALOG_INFORMATION"));
            Context.setProperty(Constants.PROPERTY_SHOW_OUTPUT_FILE, false);
            return true;
        }//END::catch
        ArisData.getActiveDatabase().setAutoTouch( true );
    }//END::for_i
    
    return false;
}

function checkDelMods(p_SelMods){
    for(var i=0; i<p_SelMods.length; i++){
        // Model's type == FAD
        if( (p_SelMods[i].TypeNum() == Constants.MT_FUNC_ALLOC_DGM) && ( isModEmpty(p_SelMods[i]) || isModSelfFnc(p_SelMods[i]) ) && isObjDefValid(p_SelMods[i]) ){
            DeleteModel( p_SelMods[i] );
        }
        // Model's type == ... with Valid SAP attr
        if( isModSAP(p_SelMods[i]) && isModEmpty(p_SelMods[i]) && isObjDefValid(p_SelMods[i]) ){ // fix on ANUBIS 436732
            DeleteModel( p_SelMods[i] );
        }
    }//END::for_i
}

function DelEmptyGrps(p_Grps){
    var aProc   = new Array();
    
    for(var i=0; i<p_Grps.length; i++){
        var Idx = p_Grps[i].GUID();
        // If already processed
        if( aProc.contains(Idx) == true ) continue;
        // Recurse if has children
        var aChGrps = p_Grps[i].Childs();
        if( aChGrps.length > 0 ){
            aProc   = aProc.concat( DelEmptyGrps( aChGrps ) );
        }
        // Delete if empty
        if( (isGrpEmpty(p_Grps[i]) == true) && (isAllowedToDelete(p_Grps[i]) == true) ){//ANUBIS 425487
            var sPath   = p_Grps[i].Path( gs_Lang, true );
            var sName   = getAttrStrValue( p_Grps[i], Constants.AT_NAME, gs_Lang );
            if( DeleteGroup(p_Grps[i]) == true){
                ga_DelGrps.put( Idx, Packages.java.lang.String(sPath + "|" + sName) );
                if( aProc.contains(Idx) == false ) aProc.push(Idx);
                continue;
            }
        }//END::if_isGrpEmpty
    }//END::for_i
    
    return aProc;
    
}

function DeleteGroup(p_Grp){
    if( p_Grp.Parent().IsValid() == true ){
        return ( p_Grp.Parent().Delete(p_Grp) );
    }
    return false;
}//END::func_DeleteGroup

function isAllowedToDelete( p_Grp ){
    if( ga_OKToDelGrp.contains( p_Grp ) == true )    return true;
    return false;
}

function getScopeMods( p_Grps ){
    for(var i=0; i<p_Grps.length; i++){
        GatherMods( p_Grps[i].ModelList(true) );    // BLUE-16023
    }//END::for_i
}

function GatherMods( p_Mods ){
    for(var i=0; i<p_Mods.length; i++){
        if( ga_SelMods.contains(p_Mods[i]) == false ) ga_SelMods.push(p_Mods[i]);
    }
}

function ThrowAwayEmptyGrps( ){// fix for ANUBIS 437825
    var aTmp        = new Array();
    var aGrpsWChlds = ga_SelGrps.copy();

    for(var i=0; i<ga_SelGrps.length; i++){
        var aChlds  = ga_SelGrps[i].Childs(true);
        aGrpsWChlds = aGrpsWChlds.concat( aChlds );
    }
    
    for(var i=0; i<aGrpsWChlds.length; i++){
        if( isGrpEmpty( aGrpsWChlds[i] ) == false ){
            aTmp.push( aGrpsWChlds[i] );
        }
    }//END::for_i

    ga_OKToDelGrp   = aTmp;
}

function MergeGrps( p_Grps ){
    for(var i=0; i<p_Grps.length; i++){
        ga_GrpsToDel.add(p_Grps[i]);
        ga_OKToDelGrp.add(p_Grps[i]); // fix for ANUBIS 437825
    }
}

function DeleteModel(p_Mod){
    var oGrp    = p_Mod.Group();
    var sPath   = oGrp.Path( gs_Lang, true );
    var sName   = getAttrStrValue( p_Mod, Constants.AT_NAME, gs_Lang );
    var Idx     = p_Mod.GUID();
    if( oGrp.Delete(p_Mod) == true ){
        ga_DelMods.put( Idx, Packages.java.lang.String(sPath + "|" + sName) );
        ga_GrpsToDel.add( oGrp );
        ga_OKToDelGrp.add( oGrp );// fix for ANUBIS 437825
    }//END::if_rDel
}

function isGrpEmpty(p_Grp){
    // Childs
    if( (p_Grp.Childs()).length > 0 )       return false;
    // Models
    if( (p_Grp.ModelList()).length > 0 )    return false;
    // ObjDefs
    if( (p_Grp.ObjDefList()).length > 0 )   return false;

    return true;
}

function isModEmpty(p_Mod){
    if( p_Mod.ObjOccList().length > 0 ) return false;
    return true;
}

function isModSelfFnc(p_Mod){
    //fixed on behalf of ANUBIS 425496
    var aOccs       = p_Mod.ObjOccList();
    var aSupDefs    = p_Mod.SuperiorObjDefs();
    for(var i=0; i<aOccs.length; i++){
        if( aSupDefs.contains( aOccs[i].ObjDef() ) == false )  return false;
    }//END::for_i
    
    return true;
}

function isObjDefValid(p_Mod){
    var aSupObjDefs = p_Mod.SuperiorObjDefs();
    var aRef        = [gn_FTProcess, gn_FTProcStep, gn_FTScenario];

    if( aSupObjDefs.length < 1 )    { return false; } // fix for ANUBIS 436732
    
    for(var i=0; i<aSupObjDefs.length; i++){
        if( aRef.contains( getAttrIntValue(aSupObjDefs[i], Constants.AT_SAP_FUNC_TYPE, gs_Lang) ) == false )    { return false; }
    }
    
    return true;
}

function isModSAP(p_Mod){
    var aRef    = [gn_FTProcess, gn_FTScenario];
    return (( aRef.contains( getAttrIntValue(p_Mod, Constants.AT_SAP_MOD_TYPE, gs_Lang) ) == true )? true:   false);
}

function getAttrIntValue(p_objDef, p_attrTypeNum, p_Lang){
    var attr    = p_objDef.Attribute(p_attrTypeNum, p_Lang, true);
    if(attr.IsValid() == false) return 0;
    return attr.MeasureUnitTypeNum();
}

function getAttrStrValue(p_objDef, p_attrTypeNum, p_Lang){
    var attr    = p_objDef.Attribute(p_attrTypeNum, p_Lang, true);
    if(attr.IsValid() == false) return gs_cEmpty;
    return Packages.java.lang.String( attr.getValue() );
}

function setAttrStrValue(p_objDef, p_attrTypeNum, p_Val, p_Lang){
    var attr    = p_objDef.Attribute(p_attrTypeNum, p_Lang, true);
    if (attr.IsValid()) { return attr.setValue(p_Val); }
    return false;
}

function SortByGroup(sA, sB){
    var aTmp    = sA.split("|");
    var valA    = Packages.java.lang.String( aTmp[0] );
        aTmp    = null;
    var aTmp    = sB.split("|");
    var valB    = Packages.java.lang.String( aTmp[0] );
        aTmp    = null;

    return valA.compareToIgnoreCase(valB);// fix for ANUBIS 437871
}

function RGB(r, g, b) {
	return (new java.awt.Color(r/255.0,g/255.0,b/255.0,1)).getRGB() & 0xFFFFFF;
}
// END::Functions part-----------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//------------------------------------------------------------------------------------------------
// Report print out part---------------------------------------------------------------------
function formats(p_output){
    p_output.DefineF("header", getString("ID_DEFAULT_FONT"), 14, Constants.C_BLUE_GREY, Constants.C_WHITE, Constants.FMT_LEFT|Constants.FMT_BOLD|Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1);
    p_output.DefineF("caption", getString("ID_DEFAULT_FONT"), 12, Constants.C_BLACK, RGB(255,255,153), Constants.FMT_LEFT|Constants.FMT_BOLD|Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1);
    p_output.DefineF("subCaption", getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, RGB(217,217,217), Constants.FMT_CENTER|Constants.FMT_BOLD|Constants.FMT_VCENTER, 0, 0, 0, 0, 0, 1);
    p_output.DefineF("basic", getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, RGB(242,242,242), Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
}

function tableHeader(p_Output, p_Label){
    var format = Context.getSelectedFormat();
    var PDF    = Constants.OUTPDF;
    
    p_Output.TableRow();
    if( format != PDF ) { p_Output.TableCellF( p_Label, 100, "caption"); }
    else{
        p_Output.ResetFrameStyle();
        p_Output.SetFrameStyle(Constants.FRAME_RIGHT,0);
        p_Output.TableCellF("", 1, "caption");
        p_Output.ResetFrameStyle();
        p_Output.SetFrameStyle(Constants.FRAME_LEFT,0);
        p_Output.TableCellF( p_Label, 99, "caption");
    }

    p_Output.TableRow();
    p_Output.TableCellF(getString("TBL_COL_PATH"), 60, "subCaption");
    p_Output.TableCellF(getString("TBL_COL_NAME"), 40, "subCaption");
}

function printCategory( p_Out, p_Label, p_Set ){
    var aValues = new Array();
    
    tableHeader( p_Out, p_Label );
    aValues = (p_Set.values()).toArray();
    aValues.sort(SortByGroup);

    for(var i=0; i<aValues.length; i++){
        var aTmp    = aValues[i].split("|");
        var sPath   = aTmp[0];
        var sName   = aTmp[1];
        
        p_Out.TableRow();
        p_Out.TableCellF( (gs_cEmpty.equals(sPath) == true)?(gs_Empty):(sPath) , 60 , "basic");
        p_Out.TableCellF( (gs_cEmpty.equals(sName) == true)?(gs_Empty):(sName) , 40 , "basic");
    }//END::for_i
}

function printOutReport(){
    var go_output   = Context.createOutputObject();
    var format      = Context.getSelectedFormat();
    var PDF         = Constants.OUTPDF;
    var sScrName    = "";

    if( format != PDF ){
        sScrName    = Context.getScriptInfo(Constants.SCRIPT_NAME);
    }
    
    setupOutput(go_output);
    formats( go_output );

    go_output.BeginTable(100, Constants.C_WHITE, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    printCategory( go_output, getString("TBL_HEADER_MODS"), ga_DelMods );
    printCategory( go_output, getString("TBL_HEADER_GRPS"), ga_DelGrps );
    go_output.EndTable(sScrName, 100, getString("ID_DEFAULT_FONT"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT|Constants.FMT_VCENTER, 0);

    go_output.WriteReport();
}

function setupOutput(outputObj)
{
    if( gs_Lang == Constants.LCID_ENGLISHUS ){
        outputObj.SetPageWidth(279.40);
        outputObj.SetPageHeight(215.90);
        outputObj.SetLeftMargin(20);
        outputObj.SetRightMargin(20);
        outputObj.SetTopMargin(30);
        outputObj.SetBottomMargin(20);
        outputObj.SetDistHeader(8);
        outputObj.SetDistFooter(8);
    }
    else{
        outputObj.SetPageWidth(297.20);
        outputObj.SetPageHeight(210.10);
        outputObj.SetLeftMargin(20);
        outputObj.SetRightMargin(20);
        outputObj.SetTopMargin(30);
        outputObj.SetBottomMargin(20);
        outputObj.SetDistHeader(8);
        outputObj.SetDistFooter(8);
    }
    // outputObj.SetAutoTOCNumbering(true);
    globalHeader( outputObj );
    globalFooter( outputObj );
}

function globalHeader( p_output ) {
	p_output.BeginHeader();
	p_output.EndHeader();
}

function globalFooter( p_output ) {
	p_output.BeginFooter()
	p_output.EndFooter()
}
// END::Report print out part--------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
