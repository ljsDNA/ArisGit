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

function getInputSelection(){
    this.aPSUs = new Array();
    this.aAllocations = new Array();
    this.aSystems = new Array();
    this.aUses = new Array();
    this.aComponents = new Array();
    this.aComponentCxns = new Array();
    this.aSystemInstances = new Array();
    this.aSystemClasses = new Array();
    this.aQuadrants = new Array();    
    this.oArchtectureElements = new java.util.HashMap();   
    this.aArchtectureElements =  new Array(); 
    var aColHeader = new Array();
    var aRowHeader = new Array();
    var aRowHeaderMap = new java.util.HashMap();
    var oVisitedArchElmt = new java.util.HashMap(); 
    var SYSTEM_TYPES = [Constants.OT_APPL_SYS_TYPE];
    var SYSTEM_CLS_TYPES = [Constants.OT_APPL_SYS_CLS];
    var SYSTEM_ARCHELMT_TYPE = [Constants.OT_ARCH_ELEMENT];
    var SYSTEM_ARCH_TYPES = [Constants.OT_ARCH_ELEMENT, Constants.OT_STRCT_ELMT];
    var COMPONENT_OBJ_TYPES = [Constants.OT_APPL_SYS_TYPE, Constants.OT_TECH_TRM, Constants.OT_NW_PROT,Constants.OT_FUNC,Constants.OT_INFO_CARR,Constants.OT_CLST,Constants.OT_PERF,Constants.OT_HW_CMP_TYPE];
    var CMP_SYS_CXN = [Constants.CT_USE_1,Constants.CT_CAN_RUN_ON];
    var INSTANCE_SYS_CXN = [Constants.CT_IS_OF_TYPE_3];
    var QUADRANT_SYS_CXN = [Constants.CT_BELONGS_TO_CLS];
    var CMP_AE_CXN = [Constants.CT_BELONGS_TO_1];
    var bSelectivSelection = false; //Selections like allocations, components, quadrants, instances reducing the focus only on the context of the seletion
                                    //Headers, PSU's or Models containing those always include all allocations and there depended objects
    var oSelectedObjDefs = ArisData.getSelectedObjDefs();
    var oAllocCheck;
    for (var i = 0; i < oSelectedObjDefs.length; i++) {
        var oObjDef = oSelectedObjDefs[i];
        var iTypeNum = oObjDef.TypeNum();
        if (oObjDef.TypeNum() == Constants.OT_PROCESS_SUPPORT_UNIT) {
            this.aPSUs.push(oObjDef);
        } else if (isAssignedObj(iTypeNum)){
            if (g_oPsmConfig.isValidAllocation(oObjDef)){//object is a valid allocation
                switch (iTypeNum) {
                    case Constants.OT_APPL_SYS_TYPE://Selected object is a IT system type                         
                        var oAttr = oObjDef.Attribute(Constants.AT_SYSTEM_TYPE,-1);                       
                        if (oAttr.MeasureUnitTypeNum()==Constants.AVT_SYSTEM_TYPE_COMPONENT) {//Selected object is a IT component type
                            this.aComponents.push(oObjDef);
                        } else {
                            this.aSystems.push(oObjDef);
                        }    
                        bSelectivSelection=true;
                        break;
                    case Constants.OT_APPL_SYS://Selected object is a IT system instance
                        this.aSystemInstances.push(oObjDef);
                        bSelectivSelection=true;
                        break;
                    case Constants.OT_APPL_SYS_CLS://Selected object is a IT system class
                        this.aSystemClasses.push(oObjDef);
                        bSelectivSelection=true;
                        break;
                }        
            } else {
                switch (iTypeNum) {
                    case Constants.OT_APPL_SYS_TYPE:      
                        var oAttr = oObjDef.Attribute(Constants.AT_SYSTEM_TYPE,-1);                       
                        if (oAttr.MeasureUnitTypeNum()==Constants.AVT_SYSTEM_TYPE_COMPONENT) {//Selected object is a IT component type
                            this.aComponents.push(oObjDef);
                            bSelectivSelection=true;
                        }
                        break;
                    case Constants.OT_APPL_SYS://Selected object is a IT system instance, but not a valid allocation
                        this.aSystemInstances.push(oObjDef);
                        bSelectivSelection=true;
                        break;
                    case Constants.OT_APPL_SYS_CLS:
                        var oAttr = oObjDef.Attribute(Constants.AT_QUADRANT,-1);//Selected object is a portfolio quadrant                        
                        if (oAttr.IsMaintained()) {
                            this.aQuadrants.push(oObjDef);                            
                            bSelectivSelection=true;
                        }    
                        break;
                }        
            }    
        } else if (isColHeaderObj(iTypeNum)){
            aColHeader.push(oObjDef);
        } else if (isRowHeaderObj(iTypeNum)){
            if (!aRowHeaderMap.containsKey(oObjDef)){
                aRowHeader.push(oObjDef);
                aRowHeaderMap.put(oObjDef,oObjDef);
            }    
        } else if (iTypeNum===Constants.OT_ARCH_ELEMENT) {
              this.aComponents = this.aComponents.concat(getComp4Arch(oObjDef));
              bSelectivSelection=true;
        }      
    }
    if (bSelectivSelection) {
        this.aComponents = ArisData.Unique(this.aComponents);
        this.aSystems = this.aSystems.concat(getRelatedObjs(this.aComponents,SYSTEM_TYPES,Constants.EDGES_IN,CMP_SYS_CXN));        
        this.aComponents = new Array();
        this.aSystemInstances = ArisData.Unique(this.aSystemInstances);
        this.aSystems = this.aSystems.concat(getRelatedObjs(this.aSystemInstances,SYSTEM_TYPES,Constants.EDGES_OUT,INSTANCE_SYS_CXN));
        this.aSystemClasses = ArisData.Unique(this.aSystemClasses);
        this.aSystems = this.aSystems.concat(getRelatedObjs(this.aSystemClasses,SYSTEM_TYPES,Constants.EDGES_IN,QUADRANT_SYS_CXN));
        this.aQuadrants = ArisData.Unique(this.aQuadrants);  
        this.aSystems = this.aSystems.concat(getRelatedObjs(this.aQuadrants,SYSTEM_TYPES,Constants.EDGES_IN,QUADRANT_SYS_CXN));
        this.aSystems = ArisData.Unique(this.aSystems);         
        this.aSystemInstances = ArisData.Unique(getRelatedObjs(this.aSystems,[Constants.OT_APPL_SYS],Constants.EDGES_IN,INSTANCE_SYS_CXN));
    } else {    
        var oSelectedModels = ArisData.getSelectedModels();
        for (var i = 0; i < oSelectedModels.length; i++) {
            aColHeader = aColHeader.concat(oSelectedModels[i].ObjDefListByTypes(COLHEAD_OBJ_TYPES));
            var aNewRowHeader = oSelectedModels[i].ObjDefListByTypes(ROWHEAD_OBJ_TYPES);
            for (var j = 0; j < aNewRowHeader.length; j++) {
                var oObjDef = aNewRowHeader[j];    
                if (!aRowHeaderMap.containsKey(oObjDef)){
                    aRowHeader.push(oObjDef);
                    aRowHeaderMap.put(oObjDef,oObjDef);
                }    
            }   
        }
        aColHeader = ArisData.Unique(aColHeader);
        this.aPSUs = this.aPSUs.concat(getPSUforHeader(aColHeader,aRowHeader,aRowHeaderMap));
    }    
    this.aPSUs = ArisData.Unique(this.aPSUs);
    
    this.getPSUs = function(){        
        if (bSelectivSelection && this.aAllocations.length == 0){
            var aAllocObj = this.aSystems;
            aAllocObj = aAllocObj.concat(this.aSystemInstances);
            aAllocObj = aAllocObj.concat(this.aSystemClasses);
            for (i=0;i<aAllocObj.length;i++){
                var aCxns = aAllocObj[i].CxnListFilter(Constants.EDGES_OUT,Constants.CT_BELONGS_TO_PROC_SUPPORT_UNIT);
                for (j=0; j<aCxns.length;j++){
                    var oCxn = aCxns[j];
                    var oUnitDef = oCxn.TargetObjDef();
                    var isMaintained = oCxn.Attribute(Constants.AT_PROC_SUPPORT_STATUS, -1).IsMaintained();                    
                    if (oAllocCheck) isMaintained = isMaintained && oAllocCheck.isAllocated(oCxn);
                    if (isMaintained){
                        this.aAllocations.push(oCxn);
                        this.aPSUs.push(oUnitDef);
                    }
                }
            }
        } 
        return this.aPSUs//.sort(sortUnit);
    }
    this.getAllocations = function(){ 
        if (!bSelectivSelection && this.aAllocations.length == 0){
            for (i=0;i<this.aPSUs.length;i++){
                var aCxns = this.aPSUs[i].CxnListFilter(Constants.EDGES_IN,Constants.CT_BELONGS_TO_PROC_SUPPORT_UNIT);
                for (j=0; j<aCxns.length;j++){
                    var oCxn = aCxns[j];
                    var oAllocDef = oCxn.SourceObjDef();
                    var isMaintained = oCxn.Attribute(Constants.AT_PROC_SUPPORT_STATUS, -1).IsMaintained();
                    if (oAllocCheck) isMaintained = isMaintained && oAllocCheck.isAllocated(oCxn);
                    if (isMaintained){
                        if (g_oPsmConfig.isValidAllocation(oAllocDef)){//object is a valid allocation
                            this.aAllocations.push(oCxn);
                            var iTypeNum = oAllocDef.TypeNum();
                            switch (iTypeNum) {
                                case Constants.OT_APPL_SYS_TYPE://Selected object is a IT system type
                                    this.aSystems.push(oAllocDef);
                                    break;
                                case Constants.OT_APPL_SYS://Selected object is a IT system instance
                                    this.aSystemInstances.push(oAllocDef);
                                    break;
                                case Constants.OT_APPL_SYS_CLS://Selected object is a IT system class
                                    this.aSystemClasses.push(oAllocDef);
                                    break;
                            }   
                        }    
                    }
                }
            }
            this.aSystems = ArisData.Unique(this.aSystems);
            this.aSystemInstances = ArisData.Unique(this.aSystemInstances);
            this.aSystemClasses = ArisData.Unique(this.aSystemClasses);
        }    
        return this.aAllocations;
    }
     
    this.initPSUsAllocations = function(){
        if (this.aAllocations.length == 0){            
            if (bSelectivSelection){
                this.getPSUs();
            } else {
                this.getAllocations();
            }    
        }
    }
    this.getSystems = function(){
        this.initPSUsAllocations();
        return this.aSystems.sort(sortByName);
    }
    this.getSystemClasses = function(){
        this.initPSUsAllocations();
        return this.aSystemClasses.sort(sortByName);
    }
    this.getComponentCxns = function(){  
        this.initPSUsAllocations(); 
        for (i=0;i<this.aSystems.length;i++){
            var aCxns = this.aSystems[i].CxnListFilter(Constants.EDGES_OUT,CMP_SYS_CXN);
            for (j=0; j<aCxns.length;j++){
                var oCxn = aCxns[j];
                var oComponent = oCxn.TargetObjDef();
                if (isComponent(oComponent.TypeNum()) && this.getArchitectureElement(oComponent)){
                    this.aComponentCxns.push(oCxn);
                    this.aComponents.push(oComponent);
                }
            }
        }        
        return this.aComponentCxns;
    }    
    this.getComponents = function(){  
        if (this.aComponentCxns.length==0) this.getComponentCxns(); 
        this.aComponents = ArisData.Unique(this.aComponents);
        return this.aComponents.sort(sortComponent);
    }  
    this.setAllocCheck = function(p_iModelView, p_oAnalysisDate){
        oAllocCheck = new allocationCheckerClass(p_iModelView, p_oAnalysisDate);
    }      
    function oArchElement(p_oArchElmt){
        this.oArchElmt = p_oArchElmt;
        this.aArchElmtHierachie = new Array();
        this.oStructElmt = null;
        this.addElmt = function(p_oArchElmt){
            this.aArchElmtHierachie.push(p_oArchElmt);
        }
        this.setStructElmt = function(p_oStructElmt){
            this.oStructElmt = p_oStructElmt;
        }
    }
    this.getArchitectureElement = function(p_oOpponent, p_aTypes){
        var aTypes = p_aTypes ? p_aTypes : SYSTEM_ARCHELMT_TYPE;
        if (this.oArchtectureElements.containsKey(p_oOpponent)) {
            return this.oArchtectureElements.get(p_oOpponent);
        } else {   
            var aArchitectureElem = getRelatedObjs([p_oOpponent],aTypes ,Constants.EDGES_OUT,CMP_AE_CXN);
            if (aArchitectureElem.length == 1) {
                this.oArchtectureElements.put(p_oOpponent, aArchitectureElem[0]);
                if (isComponent(p_oOpponent.TypeNum())) this.aArchtectureElements.push(new oArchElement(aArchitectureElem[0]));
                return aArchitectureElem[0];
            }  
        }    
        return null;
    }
    this.getArchitectureElementHierarchie = function(){ 
        var aUniqueArchElmts = new Array();
        var oArchElmtsMap = new java.util.HashMap();        
        for (var i=0; i<this.aArchtectureElements.length;i++){             
            var oArchElmtObj = this.aArchtectureElements[i];            
            var oArchElmt = oArchElmtObj.oArchElmt;
            if (!oArchElmtsMap.containsKey(oArchElmt)){
                oArchElmtsMap.put(oArchElmt,oArchElmt);
                aUniqueArchElmts.push(oArchElmtObj);
                var found = true
                do {
                    oArchElmt = this.getArchitectureElement(oArchElmt, SYSTEM_ARCH_TYPES); 
                    if (oArchElmt!= null){
                        if (oArchElmt.TypeNum() == Constants.OT_ARCH_ELEMENT) {
                           oArchElmtObj.addElmt(oArchElmt); 
                        } else {
                            oArchElmtObj.setStructElmt(oArchElmt);
                            found = false;
                        }  
                    } else found = false;
                } while (found);
            } 
        } 
        return aUniqueArchElmts.sort(sortArchElmt);
    }
    this.getSystemInstances = function(){        
        this.initPSUsAllocations();    
        var aSystemAndInstances = [];   
        for (i=0;i<this.aSystems.length;i++){
            var aCxns = this.aSystems[i].CxnListFilter(Constants.EDGES_IN,INSTANCE_SYS_CXN);
            for (j=0; j<aCxns.length;j++){
                var oCxn = aCxns[j];
                var oInstance = oCxn.SourceObjDef();
                aSystemAndInstances.push([this.aSystems[i],oInstance]);
            }
        }    
        return aSystemAndInstances;
    }
    function getComp4Arch(p_oObjDef){         
        if (oVisitedArchElmt.containsKey(p_oObjDef)) return [];
        oVisitedArchElmt.put(p_oObjDef,p_oObjDef);
        var aComponents = getRelatedObjs([p_oObjDef],COMPONENT_OBJ_TYPES ,Constants.EDGES_IN,CMP_AE_CXN);
        var aArchitectureElem = getRelatedObjs([p_oObjDef],SYSTEM_ARCHELMT_TYPE ,Constants.EDGES_IN,CMP_AE_CXN);
        for (var i=0;i<aArchitectureElem.length;i++){
            aComponents = aComponents.concat(getComp4Arch(aArchitectureElem[i]));
        }
        return aComponents;
    }
    function isComponent(p_iTypeNum){
        return COMPONENT_OBJ_TYPES.indexOf(p_iTypeNum) >= 0;
    }
    function getRelatedObjs(p_aOpponentObjs,p_aRelatedObjTypes,p_RelationDirection,p_aRelationCxnTypes){
        var aRelObjs = new Array();
        for (var i=0; i<p_aOpponentObjs.length; i++){
            aRelObjs = aRelObjs.concat(p_aOpponentObjs[i].getConnectedObjs(p_aRelatedObjTypes, p_RelationDirection, p_aRelationCxnTypes))
        }    
        return aRelObjs;
    }
    
    function getPSUforHeader(p_aColHeader,p_aRowHeader,p_aRowHeaderMap){
        var aNewPSUs = new Array();
        if (p_aColHeader.length!=0 && p_aRowHeader.length!=0) {
            for (var i=0; i<p_aColHeader.length; i++){
                var aUnitDefs = p_aColHeader[i].getConnectedObjs(Constants.OT_PROCESS_SUPPORT_UNIT);
                for (var j=0; j<aUnitDefs.length; j++){
                    var oRowHeader = getRowHeaderDef(aUnitDefs[j]);
                    if (p_aRowHeaderMap.containsKey(oRowHeader)){
                        aNewPSUs.push(aUnitDefs[j]);
                    }
                }    
            }
        } else {            
            for (var i=0; i<p_aColHeader.length; i++){
                aNewPSUs = aNewPSUs.concat(p_aColHeader[i].getConnectedObjs(Constants.OT_PROCESS_SUPPORT_UNIT));
            }               
            for (var i=0; i<p_aRowHeader.length; i++){
                aNewPSUs = aNewPSUs.concat(p_aRowHeader[i].getConnectedObjs(Constants.OT_PROCESS_SUPPORT_UNIT));
            }    
        }   
        return aNewPSUs;
    }
    this.getQuadrant = function(p_aSystem){
        var aPossibleQuadrants = getRelatedObjs(p_aSystem,SYSTEM_CLS_TYPES,Constants.EDGES_OUT,QUADRANT_SYS_CXN);
        var aQuadrants = new Array();
        for (var i=0; i<aPossibleQuadrants.length; i++){
            var oPossibleQuadrant = aPossibleQuadrants[i];
            var oAttr = oPossibleQuadrant.Attribute(Constants.AT_QUADRANT,-1);//Selected object is a portfolio quadrant                        
            if (oAttr.IsMaintained()) {                
                aQuadrants.push(oPossibleQuadrant);
            }    
        } 
        if (aQuadrants.length == 1) return aQuadrants[0];
        return null;
    }
}

function allocationCheckerClass(p_iModelView, p_oAnalysisDate){
    var iModelView = p_iModelView ? p_iModelView : Constants.AVT_PSV_AS_IS;
    var oAnalysisDate = p_oAnalysisDate ? p_oAnalysisDate : new java.util.Date();
    this.isAllocated = function(p_oCxnDef){  
        var oAllocDates = new getAllocState(p_oCxnDef);
        if (oAllocDates.procSupportStatus==null || oAllocDates.procSupportStatus==0) return false;
        if (iModelView==g_oFilter.AttrValueType(Constants.AT_PROCESS_SUPPORT_VIEW, Constants.AVT_PSV_ALL)){         // BLUE-10439
            return true;
        }          
        if (iModelView==g_oFilter.AttrValueType(Constants.AT_PROCESS_SUPPORT_VIEW, Constants.AVT_PSV_TO_BE)){       // BLUE-10439
            return (oAllocDates.isToBe==true);
        }   
        if (iModelView==Constants.AVT_PSV_AS_IS){
            if (oAllocDates.procSupportStatus==g_oFilter.AttrValueType(Constants.AT_PROC_SUPPORT_STATUS, Constants.AVT_TO_BE_PHASED_IN)){
                return false;
            }
            if (oAllocDates.procSupportStatus==g_oFilter.AttrValueType(Constants.AT_PROC_SUPPORT_STATUS, Constants.AVT_PHASED_IN)|| 
                oAllocDates.procSupportStatus==g_oFilter.AttrValueType(Constants.AT_PROC_SUPPORT_STATUS, Constants.AVT_START_PLANNING_PHASE_OUT) || 
                oAllocDates.procSupportStatus==g_oFilter.AttrValueType(Constants.AT_PROC_SUPPORT_STATUS, Constants.AVT_TO_BE_PHASED_OUT)){
                if (nullOrGreaterEqual(oAnalysisDate,oAllocDates.PhaseIn)) { 
                    // AST is or has been phased in at analysis date 
                    return true;
                } else {
                    // At analysis date the AST hasn't been phased in
                    return false;
                }    
            } else if (oAllocDates.procSupportStatus==g_oFilter.AttrValueType(Constants.AT_PROC_SUPPORT_STATUS, Constants.AVT_PHASED_OUT)){ 
                if (nullOrGreaterEqual(oAnalysisDate,oAllocDates.PhaseIn) && notNullAndLower(oAnalysisDate,oAllocDates.PhaseOut)) { 
                    // AST is or has been phased in and has not been phased out at analysis date
                    return true;
                } else {
                    return false;
                }    
            }
            return false;
        }  
        if (iModelView==Constants.AVT_PSV_PLAN){
            
            if (nullOrGreaterEqual(oAnalysisDate,oAllocDates.startPlanPhaseIn)) { 
                // AST is or has been phased in at analysis date
                if (oAllocDates.procSupportStatus==g_oFilter.AttrValueType(Constants.AT_PROC_SUPPORT_STATUS, Constants.AVT_PHASED_OUT)) {
                    if (notNullAndLower(oAnalysisDate,oAllocDates.PhaseOut)) {
                        // AST is or has been phased in and has not been phased out at analysis date
                        return true;
                    } else {
                        // AST is or has been phased out at analysis date
                        return false;
                    }   
                } else {
                    // At analysis date the AST is or has been phased in
                    return true;
                }    
            }
            return false;
        }
        return false;
    }  
    function getAllocState(p_oCxnDef){   
        this.startPlanPhaseIn = getDateValue2(p_oCxnDef,Constants.AT_START_PLAN_PHASE_IN);  
        this.PhaseInPlan = getDateValue2(p_oCxnDef,Constants.AT_PHASE_IN_PLAN);
        this.PhaseIn = getDateValue2(p_oCxnDef,Constants.AT_PHASE_IN_AS_IS);
        this.startPlanPhaseOut = getDateValue2(p_oCxnDef,Constants.AT_START_PLAN_PHASE_OUT);
        this.PhaseOutPlan = getDateValue2(p_oCxnDef,Constants.AT_PHASE_OUT_PLAN);
        this.PhaseOut = getDateValue2(p_oCxnDef,Constants.AT_PHASE_OUT_AS_IS);  
        this.procSupportStatus = getValue(p_oCxnDef,Constants.AT_PROC_SUPPORT_STATUS);
    }
    function nullOrGreaterEqual(date1,date2){
        if (date2==null){
            return true;
        } else {
            return date1.compareTo(date2) >= 0;
        }
    }
    function notNullAndLower(date1,date2){
        if (date2==null){
            return false;
        } else {
            return date1.compareTo(date2) < 0;
        }
    }
}
function getRowHeaderDef(oUnitDef) { 
    var oRowHeaderDefs = oUnitDef.getConnectedObjs(ROWHEAD_OBJ_TYPES);
    if (oRowHeaderDefs.length != 1) return null;
    return oRowHeaderDefs[0];
}
function getColHeaderDef(oUnitDef) { 
    var oColHeaderDefs = oUnitDef.getConnectedObjs(COLHEAD_OBJ_TYPES);
    if (oColHeaderDefs.length != 1) return null;
    return oColHeaderDefs[0];
}
function sortUnit(oUnitDefA, oUnitDefB) {
    var result = sortByRowHeaderName(oUnitDefA, oUnitDefB);
    if (result == 0) result = sortByColHeaderName(oUnitDefA, oUnitDefB);
    return result;
}
function sortByRowHeaderName(oUnitDefA, oUnitDefB) {
    return sortByName(getRowHeaderDef(oUnitDefA), getRowHeaderDef(oUnitDefB));
}
function sortByColHeaderName(oUnitDefA, oUnitDefB) {
    return sortByName(getColHeaderDef(oUnitDefA), getColHeaderDef(oUnitDefB));
}
function sortArchElmt(oArchElmtA, oArchElmtB) {    
    var result = sortByName(oArchElmtA.oStructElmt, oArchElmtB.oStructElmt);
    if (result == 0) result = sortByName(oArchElmtA.oArchElmt, oArchElmtB.oArchElmt);
    return result;
}
function sortComponent(oComponentA, oComponentB) {    
    var result = oComponentA.TypeNum() - oComponentB.TypeNum();
    if (result == 0) result = sortByName(oComponentA, oComponentB);
    return result;
}
function sortByName(itemA, itemB) {
    if (itemB==null) {
        return 1;
    }    
    if (itemA==null) {
        return -1;
    }    
    return StrComp(itemA.Name(g_nLoc,true), itemB.Name(g_nLoc,true));
}