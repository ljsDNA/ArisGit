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
 
var g_oPsmConfig = new psmConfig(false/*p_bMacro*/);
var g_nLoc = Context.getSelectedLanguage(); 
var g_oFilter = ArisData.ActiveFilter();
var g_iArchlevel = 2;
var g_aSystemAttr = [];
var g_aSystemInstAttr = [];
var g_aCompAttr = [];
var g_aAllocAttr = [];

var g_aLifecycleStandard = [Constants.AT_STATUS_STANDARDIZATION,
                            Constants.AT_EVALUATION_START, Constants.AT_EVALUATION_END,
                            Constants.AT_REQUESTED_FOR_STANDARD_START, Constants.AT_REQUESTED_FOR_STANDARD_END,
                            Constants.AT_TO_BE_PHASED_IN_START, Constants.AT_TO_BE_PHASED_IN_END,
                            Constants.AT_STANDARD_START, Constants.AT_STANDARD_END,
                            Constants.AT_TO_BE_PHASED_OUT_START, Constants.AT_TO_BE_PHASED_OUT_END];
                            
var g_aLifecycleOperation = [Constants.AT_SYSTEM_STATE,
                             Constants.AT_PLANNING_PHASE_START,Constants.AT_PLANNING_PHASE_END,
                             Constants.AT_PROCUREMENT_PHASE_START,Constants.AT_PROCUREMENT_PHASE_END,
                             Constants.AT_DEVELOPMENT_PHASE_START,Constants.AT_DEVELOPMENT_PHASE_END,
                             Constants.AT_TEST_PHASE_START,Constants.AT_TEST_PHASE_END,
                             Constants.AT_OPERATION_PHASE_START,Constants.AT_OPERATION_PHASE_END,
                             Constants.AT_DEACTIVATION_PHASE_START,Constants.AT_DEACTIVATION_PHASE_END];
                             
var g_aItPlanning = [Constants.AT_PROC_SUPPORT_STATUS,
                     Constants.AT_START_PLAN_PHASE_IN, Constants.AT_PHASE_IN_PLAN,
                     Constants.AT_PHASE_IN_AS_IS, Constants.AT_START_PLAN_PHASE_OUT,
                     Constants.AT_PHASE_OUT_PLAN, Constants.AT_PHASE_OUT_AS_IS,
                     Constants.AT_TO_BE];                             
                            
main();

function main(){
    var inputObj = new getInputSelection();
    var oOut = new outClass(); 
    outPSUs(oOut,inputObj.getPSUs());
    outAllocs(oOut,inputObj.getAllocations());
    outSystems(oOut,inputObj);
    outComponentCxns(oOut,inputObj.getComponentCxns());
    outComponents(oOut,inputObj);
    outArchElmts(oOut,inputObj);
    outSystemInstances(oOut,inputObj.getSystemInstances());
    outSystemCls(oOut,inputObj.getSystemClasses())
    oOut.writeOutput();
}

function outComponentCxns(p_oOut,p_aComponentCxns){ 
    var iObjType = Constants.OT_APPL_SYS_TYPE;
    p_oOut.beginTab();
    p_oOut.writeHeader(concatStrObjType("GUID",iObjType),concatStrObjType("NAME",iObjType),concatStr("GUID","COMPONENT"),concatStr("NAME","COMPONENT"),concatStr("TYPE","COMPONENT"));
    for (var i = 0; i<p_aComponentCxns.length;i++){
        var oComponentCxn = p_aComponentCxns[i];
        var oSource = oComponentCxn.SourceObjDef();
        var oTarget = oComponentCxn.TargetObjDef();
        p_oOut.writeLine(oSource.GUID(),getTextAttr(oSource,Constants.AT_NAME),oTarget.GUID(),getTextAttr(oTarget,Constants.AT_NAME),oTarget.Type());
    }
    p_oOut.endTab("System_Component");
}
function outSystemCls(p_oOut,p_aSystemCls){ 
    var iObjType = Constants.OT_APPL_SYS_CLS;
    p_oOut.beginTab();    
    p_oOut.addCellContent([concatStrObjType("GUID",iObjType),concatStrObjType("NAME",iObjType)], p_oOut.getFmtBold());
    p_oOut.addAttrHeader(g_aLifecycleStandard, Constants.CID_OBJDEF, iObjType);
    p_oOut.writeLineFmtColored();
    for (var i = 0; i<p_aSystemCls.length;i++){
        var oSystemCls = p_aSystemCls[i];            
        p_oOut.addCellContent([oSystemCls.GUID(),getTextAttr(oSystemCls,Constants.AT_NAME)]);
        p_oOut.addAttrContent(g_aLifecycleStandard, oSystemCls);
        p_oOut.writeLineFmtColored();
    }
    p_oOut.endTab(g_oFilter.ObjTypeName(iObjType));
}
function outSystemInstances(p_oOut,p_aSystemInstances){ 
    var iObjType = Constants.OT_APPL_SYS;
    var iSys = Constants.OT_APPL_SYS_TYPE;
    p_oOut.beginTab();    
    p_oOut.addCellContent([concatStrObjType("GUID",iSys),concatStrObjType("NAME",iSys),concatStrObjType("GUID",iObjType),concatStrObjType("NAME",iObjType)], p_oOut.getFmtBold());
    p_oOut.addAttrHeader(g_aLifecycleOperation.concat(g_aSystemInstAttr), Constants.CID_OBJDEF, iObjType);
    p_oOut.writeLineFmtColored();
    for (var i = 0; i<p_aSystemInstances.length;i++){
        var oSystem = p_aSystemInstances[i][0];
        var oSystemInstance = p_aSystemInstances[i][1];            
        p_oOut.addCellContent([oSystem.GUID(),getTextAttr(oSystem,Constants.AT_NAME),oSystemInstance.GUID(),getTextAttr(oSystemInstance,Constants.AT_NAME)]);
        p_oOut.addAttrContent(g_aLifecycleOperation.concat(g_aSystemInstAttr), oSystemInstance);
        p_oOut.writeLineFmtColored();
    }
    p_oOut.endTab(g_oFilter.ObjTypeName(iObjType));
}
function outComponents(p_oOut,p_oInputObj){ 
    var iSys = Constants.OT_APPL_SYS_TYPE;    
    var iArchElmt = Constants.OT_ARCH_ELEMENT;
    var aComponents = p_oInputObj.getComponents()
    p_oOut.beginTab(); 
    p_oOut.addCellContent([concatStr("GUID","COMPONENT"),concatStr("NAME","COMPONENT"),concatStr("TYPE","COMPONENT")], p_oOut.getFmtBold());
    p_oOut.addAttrHeader(g_aLifecycleStandard.concat(g_aCompAttr), Constants.CID_OBJDEF, iSys);
    p_oOut.addCellContent([concatStrObjType("GUID",iArchElmt), concatStrObjType("NAME",iArchElmt)], p_oOut.getFmtBold());
    p_oOut.writeLineFmtColored();
    for (var i = 0; i<aComponents.length;i++){
        var oComponent = aComponents[i];
        var oArchElmt = p_oInputObj.getArchitectureElement(oComponent);
        sArchGUID = oArchElmt ? oArchElmt.GUID(): "";
        sArchName = oArchElmt ? getTextAttr(oArchElmt,Constants.AT_NAME): "";             
        p_oOut.addCellContent([oComponent.GUID(),getTextAttr(oComponent,Constants.AT_NAME),oComponent.Type()]);
        p_oOut.addAttrContent(g_aLifecycleStandard.concat(g_aCompAttr), oComponent);
        p_oOut.addCellContent([sArchGUID,sArchName]);
        p_oOut.writeLineFmtColored();
    }
    p_oOut.endTab(getString("COMPONENT"));
}
function getArchElmtHierarchieAsArray(p_oArchElmtObj){
    var aArchElmtHierarchie = new Array();
    aArchElmtHierarchie.push(new archHierarchieElmt(p_oArchElmtObj.oArchElmt))
    for (var i=0; i<g_iArchlevel; i++){
        if (i<p_oArchElmtObj.aArchElmtHierachie.length) aArchElmtHierarchie.push(new archHierarchieElmt(p_oArchElmtObj.aArchElmtHierachie[i]));
        else aArchElmtHierarchie.push(new archHierarchieElmt(null));
    }
    aArchElmtHierarchie.push(new archHierarchieElmt(p_oArchElmtObj.oStructElmt));
    return aArchElmtHierarchie;
}
function archHierarchieElmt(p_oObj){
    this.sArchGUID = p_oObj ? p_oObj.GUID(): "";
    this.sArchName = p_oObj ? getTextAttr(p_oObj,Constants.AT_NAME): "";
}
function outArchElmts(p_oOut,p_oInputObj){  
    var iArchElmt = Constants.OT_ARCH_ELEMENT;
    var iStructElmt = Constants.OT_STRCT_ELMT;
    var aArchitectureElementHierarchie = p_oInputObj.getArchitectureElementHierarchie()
    p_oOut.beginTab();  
    for (var i=0; i<g_iArchlevel+1; i++){
        p_oOut.addCellContent([concatStrObjType("GUID",iArchElmt)+i, concatStrObjType("NAME",iArchElmt)+i], p_oOut.getFmtBold());
    }  
    p_oOut.addCellContent([concatStrObjType("GUID",iStructElmt), concatStrObjType("NAME",iStructElmt)], p_oOut.getFmtBold());
    p_oOut.writeLineFmtColored();
    for (var i = 0; i<aArchitectureElementHierarchie.length;i++){
        var aArchElmtHierarchie = getArchElmtHierarchieAsArray(aArchitectureElementHierarchie[i]);
        for (var j = 0; j<aArchElmtHierarchie.length;j++){
            p_oOut.addCellContent([aArchElmtHierarchie[j].sArchGUID,aArchElmtHierarchie[j].sArchName]);
        } 
         p_oOut.writeLineFmtColored();
    }
    p_oOut.endTab(getString("ARCHITECTURE"));
}
function outSystems(p_oOut,p_oInput){ 
    var iObjType = Constants.OT_APPL_SYS_TYPE;
    var p_aSystems = p_oInput.getSystems()
    p_oOut.beginTab();
    p_oOut.addCellContent([concatStrObjType("GUID",iObjType),concatStrObjType("NAME",iObjType)], p_oOut.getFmtBold());
    p_oOut.addAttrHeader(g_aLifecycleStandard.concat(g_aSystemAttr), Constants.CID_OBJDEF, iObjType);
    p_oOut.addCellContent([getString("QUADRANT"),concatStr("GUID","QUADRANT"),concatStr("NAME","QUADRANT")], p_oOut.getFmtBold());
    p_oOut.writeLineFmtColored();
    for (var i = 0; i<p_aSystems.length;i++){
        var oSystem = p_aSystems[i];
        var oQuadrant = p_oInput.getQuadrant([oSystem]);
        sQuadrantName = "";
        sQuadrantGUID = "";
        sQuadrantID = "";
        if (oQuadrant){            
            sQuadrantName = getTextAttr(oQuadrant,Constants.AT_NAME);
            sQuadrantGUID = oQuadrant.GUID();
            sQuadrantID = getValue(oQuadrant, Constants.AT_QUADRANT);
        }        
        p_oOut.addCellContent([oSystem.GUID(),getTextAttr(oSystem,Constants.AT_NAME)]);
        p_oOut.addAttrContent(g_aLifecycleStandard.concat(g_aSystemAttr), oSystem);
        p_oOut.addCellContent([sQuadrantID, sQuadrantGUID, sQuadrantName]);
        p_oOut.writeLineFmtColored();
    }
    p_oOut.endTab(g_oFilter.ObjTypeName(iObjType));
}
function outAllocs(p_oOut,p_aAllocs){ 
    var iUnit = Constants.OT_PROCESS_SUPPORT_UNIT;
    p_oOut.beginTab();    
    p_oOut.addCellContent([concatStrObjType("GUID",iUnit),concatStr("GUID","ALLOCATION"),concatStr("NAME","ALLOCATION"),concatStr("TYPE","ALLOCATION")], p_oOut.getFmtBold());
    p_oOut.addAttrHeader(g_aItPlanning.concat(g_aAllocAttr), Constants.CID_CXNDEF, Constants.CT_BELONGS_TO_PROC_SUPPORT_UNIT);
    p_oOut.writeLineFmtColored();
    for (var i = 0; i<p_aAllocs.length;i++){
        var oAlloc = p_aAllocs[i];
        var oSource = oAlloc.SourceObjDef();
        var oTarget = oAlloc.TargetObjDef();              
        p_oOut.addCellContent([oTarget.GUID(),oSource.GUID(),getTextAttr(oSource,Constants.AT_NAME),oSource.Type()]);
        p_oOut.addAttrContent(g_aItPlanning, oAlloc);
        p_oOut.writeLineFmtColored();
    }
    p_oOut.endTab(getString("ALLOCATION"));
}
function outPSUs(p_oOut,p_aPSUs){ 
    var iUnit = Constants.OT_PROCESS_SUPPORT_UNIT;
    p_oOut.beginTab();
    p_oOut.writeHeader(concatStrObjType("GUID",iUnit),
                       concatStr("GUID","ROWHEADER"),concatStr("NAME","ROWHEADER"),concatStr("TYPE","ROWHEADER"),
                       concatStr("GUID","COLUMNHEADER"),concatStr("NAME","COLUMNHEADER"),concatStr("TYPE","COLUMNHEADER"),
                       g_oFilter.AttrTypeName(Constants.AT_PROCESSING_TYPE));
    for (var i = 0; i<p_aPSUs.length;i++){
        var oPSU = p_aPSUs[i];
        oColDef = getColHeaderDef(oPSU);
        sColGUID = "";
        sColName = "";
        sColType = "";
        if (oColDef) {
            sColGUID = oColDef.GUID();
            sColName = getTextAttr(oColDef,Constants.AT_NAME);
            sColType = oColDef.Type();            
        } 
        oRowDef = getRowHeaderDef(oPSU);
        sRowGUID = "";
        sRowName = "";
        sRowType = "";
        if (oRowDef) {
            sRowGUID = oRowDef.GUID();
            sRowName = getTextAttr(oRowDef,Constants.AT_NAME);
            sRowType = oRowDef.Type();            
        } 
        p_oOut.writeLine(oPSU.GUID(),sRowGUID,sRowName,sRowType,sColGUID,sColName,sColType,getValue(oPSU,Constants.AT_PROCESSING_TYPE));
    }
    p_oOut.endTab(g_oFilter.ObjTypeName(iUnit));
}
/*****************************************************************************/
    

function getAttrValue(oItem, attrTypeNum){
    var val = undefined;
    if (g_oFilter.IsValidAttrType(oItem.KindNum(),oItem.TypeNum(),attrTypeNum)){        
        switch (g_oFilter.AttrBaseType(attrTypeNum)) {
            case Constants.ABT_BOOL :                         
                val = getBoolValue(oItem, attrTypeNum);
                break;
            case Constants.ABT_DATE :
                val = getDateValue(oItem, attrTypeNum);
                break;
            case Constants.ABT_LONGTEXT :
                val = getTextAttr(oItem, attrTypeNum);
                break;
            case Constants.ABT_MULTILINE :
                val = getTextAttr(oItem, attrTypeNum);
                break;
            case Constants.ABT_SINGLELINE :
                val = getTextAttr(oItem, attrTypeNum);
                break;
            case Constants.ABT_VALUE :
                val = getValue(oItem, attrTypeNum);
                break;
        }                
    }
    return val;
}
function getTextAttr(oItem, attrTypeNum) {    
    var oAttr = oItem.Attribute (attrTypeNum, g_nLoc, true/*Fallback*/);
    if (!oAttr.IsMaintained()) return "";
    return oAttr.GetValue(false);
}

function getValue(oItem, attrTypeNum) {
    var oAttr = oItem.Attribute(attrTypeNum, g_nLoc,true/*Fallback*/);
    if (!oAttr.IsMaintained()) return "";
    return oAttr.getValue();
}

function getDateValue(oItem, attrTypeNum) {
    var oAttr = oItem.Attribute(attrTypeNum, g_nLoc);
    if (!oAttr.IsMaintained()) return "";
    var dateformat = new java.text.SimpleDateFormat("dd.MM.yyyy");
    return dateformat.format(oAttr.MeasureValue());
}

function getBoolValue(oItem, attrTypeNum) {
    if (!oItem.Attribute(attrTypeNum, g_nLoc).IsMaintained()) return "";
    if (isboolattributetrue(oItem, attrTypeNum, g_nLoc)) return "True";
    return "False";
}

function outClass(){
    var iFmtNormal = Constants.FMT_LEFT | Constants.FMT_VTOP;
    var iFmtBold = iFmtNormal | Constants.FMT_BOLD;    
    var oOut = Context.createOutputObject();
    oOut.DefineF("Normal","Arial",12,Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 5, 0, 0, 0, 0, 0);  
    oOut.DefineF("Header","Arial",12,Constants.C_BLACK, Constants.C_TRANSPARENT, iFmtBold, 5, 0, 0, 0, 0, 0)
    var aRowToWrite = new Array();
    
    this.getFmtNormal = function(){
        return iFmtNormal;
    }
    this.setFmtNormal = function(p_iFmt){
        iFmtNormal = p_iFmt;
    }
    this.getFmtBold = function(){
        return iFmtBold;
    }
    this.addCellContent = function(p_aValue, p_iFmt, p_iBkColor, p_iFrontColor){
        for (var i=0;i<p_aValue.length;i++) {
            aRowToWrite.push(new fmtOutClass(p_aValue[i], p_iFmt, p_iBkColor, p_iFrontColor));
        }    
    }
    this.addAttrContent = function(p_aTypes, oItem){
        for (var i = 0; i<p_aTypes.length; i++){
            if (g_oFilter.IsValidAttrType(oItem.KindNum(),oItem.TypeNum(),p_aTypes[i])) {                
                this.addCellContent([getAttrValue(oItem, p_aTypes[i])]);
            }    
        }
    }
    this.addAttrHeader = function(p_aTypes, p_iKindNum, p_iTypeNum){
        for (var i = 0; i<p_aTypes.length; i++){
            if (g_oFilter.IsValidAttrType(p_iKindNum,p_iTypeNum,p_aTypes[i]))
                this.addCellContent([g_oFilter.AttrTypeName(p_aTypes[i])], iFmtBold);
        }
    }
    this.writeLineFmt = function(p_iFmt, aColValues){
        var iFmt = p_iFmt ? p_iFmt : "Normal";
        oOut.TableRow();
        var iLen = aColValues.length;
        var iWidth = iLen>1 ? Math.ceil(270/iLen):100; 
        for (var i=0; i<aColValues.length; i++) {
            oOut.TableCellF(aColValues[i],iWidth,iFmt);
        }        
    } 
    this.writeLineFmtColored = function(p_aColValues){
        oOut.TableRow();
        if (p_aColValues == undefined) {
            p_aColValues = aRowToWrite;
            aRowToWrite = new Array();
        } 
        var iLen = p_aColValues.length;
        var iWidth = iLen>1 ? Math.ceil(270/iLen):100; 
        for (var i=0; i<p_aColValues.length; i++) {
            var oColValues = p_aColValues[i];
            oOut.TableCell (oColValues.oValue, iWidth, "Arial",12, oColValues.iFrontColor, oColValues.iBkColor,0,oColValues.iFmt,0);
        }        
    }
    this.writeHeader = function(){
        this.writeLineFmt("Header", arguments)
    }    
    this.writeLine = function(){
        this.writeLineFmt("Normal", arguments)
    }
    this.beginTab = function(){
        oOut.BeginTable(100,Constants.C_BLACK,Constants.C_WHITE,Constants.FMT_LEFT ,0);
    }
    this.endTab = function(p_sName){
        oOut.EndTable(p_sName,100, "Arial",12,Constants.C_BLACK,Constants.C_BLACK,0,Constants.FMT_LEFT ,0); 
    }
    this.writeOutput = function(){
        oOut.WriteReport();
    }    
    function fmtOutClass(p_oValue, p_iFmt, p_iBkColor, p_iFrontColor){
        this.oValue = p_oValue;
        this.iFmt = p_iFmt ? p_iFmt : Constants.FMT_LEFT | Constants.FMT_VTOP;
        this.iBkColor = p_iBkColor ? p_iBkColor : Constants.C_TRANSPARENT;
        this.iFrontColor = p_iFrontColor ? p_iFrontColor : Constants.C_BLACK;        
    }
}
function concatStrObjType(p_sStrKey, p_iObjTypeNum){
    return getString(p_sStrKey) + " " + g_oFilter.ObjTypeName(p_iObjTypeNum);
}

function concatStr(p_sStrKey1, p_sStrKey2){
    return getString(p_sStrKey1) + " " + getString(p_sStrKey2);
}
