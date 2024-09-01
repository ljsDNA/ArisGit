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

/*
 * Transfromation Business BPMN to Solution BPMN
 * Script: Business BPMN to Solution BPMN Post Script
 * @author Thomas Kummer
 */ 

var TRANSFORMATION_NAME = "BusinessBPMN2SolutionBPMN";
var TRANSFORMATION_GUID = "d40f8321-8503-11e4-639b-5c260a367cde";
var TRANSFORMATION_ID_PREFIX = "TARGET_ID_";
var GUID_LENGTH= 36;
var MERGE_ID_PREFIX="[BusinessBPMN2SolutionBPMN/d40f8321-8503-11e4-639b-5c260a367cde=TARGET_ID_";

            
main();

function main(){
    
    var modelsDone = new java.util.HashSet();
    var model = ArisData.getSelectedModels()[0];
    var webMethodsIntegrationComponent = Context.getComponent("webMethodsIntegration");
    doCxnLayout(model);
    copyAttributes(model);
    copyAttrOccs(model);
    modelsDone.add(model);
    var dependingModels = webMethodsIntegrationComponent.getDependingModels(model);
    if(dependingModels != null){
        
        for(var i=0; i < dependingModels.length;i++){
            
            var dependingModel =  dependingModels[i]
            if(!modelsDone.contains(dependingModel)){
                doCxnLayout(dependingModel);
                layoutFAD(dependingModel); 
                copyAttributes(dependingModel);
                 if(dependingModel.TypeNum() != Constants.MT_FUNC_ALLOC_DGM){
                    copyAttrOccs(dependingModel);
                }
                modelsDone.add(dependingModel);
            }
           
        }
    }
}
            
//------------------------------ Layout functions ----------------------------------------------------------------------------------------------------            
function layoutFAD(model){
    if(model.TypeNum() == Constants.MT_FUNC_ALLOC_DGM){
        model.doLayout();
    }
}
   
function doCxnLayout(model){
	
    var vCxn = model.CxnOccList();
    var srcModel = getTransformationSrcObj(model); 

    for(var i = 0; i < vCxn.length; i++){
        var cxnOcc = vCxn[i];
        var srcCxnOcc = getSourceCxnOcc(cxnOcc, srcModel);
        if(srcCxnOcc != null){
            cxnOcc.setPoints(srcCxnOcc.getPoints());             
            cxnOcc.setVisible(srcCxnOcc.getVisible());
        }
    } 
    setZOrderCxnOcc(model);
} 


function setZOrderCxnOcc(model){
   var maxZOrder  = getMaxZOrder(model);
   maxZOrder = maxZOrder + 1;
   var vCxnOccs  = model.CxnOccList();
    for(var i=0; i< vCxnOccs.length; i++){
        var occ = vCxnOccs[i];
        if(occ.getVisible()){
            occ.setZOrder(maxZOrder);
        }
    }
}


function getMaxZOrder(model){
    var nMaxZOrder = 0;
    if (model != null) {
        var occs = model.ObjOccList();
        for (var i =0; i < occs.length; i++ ) {
            if (occs[i].getZOrder() > nMaxZOrder) {
                nMaxZOrder = occs[i].getZOrder();
            }
        }
    }
    return nMaxZOrder;
}   





//------------------------------ Copy attribute functions --------------------------------------------------------------------------------------------

function copyAttributes(model){
    var srcModel = getTransformationSrcObj(model);
    var database = model.Database();
    if(srcModel != null){
        copyAttributesImpl(srcModel, model, database);
    }
    
    // copy objDef attibutes 
    var vObjOccs = model.ObjOccList(); 
    for(var i = 0; i < vObjOccs.length; i++){
        var objOcc = vObjOccs[i];
        var objDef = objOcc.ObjDef();
        var srcObjDef = getTransformationSrcObj(objDef);
        if(srcObjDef != null){
            copyAttributesImpl(srcObjDef,objDef, database);
        }     
    }
    
    // copy cxnDef attibutes
    var vCxnOccs = model.CxnOccList();
    for(var i=0; i < vCxnOccs.length; i++){
        var cxnOcc = vCxnOccs[i];
        var cxnDef = cxnOcc.getDefinition();
        var srcCxnDef = getTransformationCxnSrcObj(cxnDef);
        if(srcCxnDef != null){
            copyAttributesImpl(srcCxnDef,cxnDef, database);
        }     
    }
}


function copyAttributesImpl(objSrc, objDes, database){
    var vLanguages = database.LanguageList();
    var filter = database.ActiveFilter();
    for(var i = 0; i < vLanguages.length; i++){
        var language = vLanguages[i];
        var languageId =  language.LocaleId();
        var vAttrList = objSrc.AttrList(languageId);
        
        for(var j=0; j < vAttrList.length; j++){
            var attr = vAttrList[j];
            if(filter.IsValidAttrType(objDes.KindNum(), objDes.TypeNum(), attr.TypeNum())){
                var desAttr = objDes.Attribute(attr.TypeNum(), languageId);
                if(!desAttr.IsMaintained()){
                    desAttr.setValue(attr.getValue());
                }
            }    
        }
        
    }    
}

//------------------------------ Copy AttrOccs ----------------------------------------------------------------------------------------------------

function copyAttrOccs(model){
    var srcModel = getTransformationSrcObj(model);
    if(srcModel != null && srcModel.IsValid()){
        var vObjOccs = model.ObjOccList();
        for(var i=0; i<vObjOccs.length; i++){
            var objOcc = vObjOccs[i];
            var srcObjOcc = getTransformationSrcOcc(objOcc, srcModel);
            if(srcObjOcc != null){
                var vSrcAttrOccs = srcObjOcc.AttrOccList();
                for(var j=0; j < vSrcAttrOccs.length; j++){
                    var srcAttrOcc =  vSrcAttrOccs[j];
                    var attrOcc = objOcc.AttrOcc(srcAttrOcc.AttrTypeNum())
                    if(attrOcc != null){
                        coppyAttrOccImpl(srcAttrOcc, attrOcc);
                    }
                }
            }
        }
        
        var vCxnOccs = model.CxnOccList();
        for(var i=0; i<vCxnOccs.length; i++){
            var cxnOcc = vCxnOccs[i];
            var srcCxnOcc = getSourceCxnOcc(cxnOcc, srcModel);
            if(srcCxnOcc != null){
                var vSrcAttrOccs = srcCxnOcc.AttrOccList();
                for(var j=0; j < vSrcAttrOccs.length; j++){
                    var srcAttrOcc =  vSrcAttrOccs[j];
                    var attrOcc = cxnOcc.AttrOcc(srcAttrOcc.AttrTypeNum())
                    if(attrOcc != null){
                        coppyAttrOccImpl(srcAttrOcc, attrOcc);
                    }
                }
            }
        } 
    }   
}

function coppyAttrOccImpl(srcAttrOcc,attrOcc){
    attrOcc.setAlignment(srcAttrOcc.getAlignment());
    attrOcc.setFontStyleSheet(srcAttrOcc.getFontStyleSheet());
    attrOcc.SetOffset(srcAttrOcc.OffsetX(), srcAttrOcc.OffsetY());
    attrOcc.setOrderNum(srcAttrOcc.getOrderNum());
    var vIntValue = srcAttrOcc.GetPortOptions();
    if(vIntValue != null && vIntValue.length >= 1)
        attrOcc.SetPortOptions(vIntValue[0],vIntValue[1]);
    
    attrOcc.setRotation(srcAttrOcc.getRotation());
    var dimension = srcAttrOcc.getTextBoxSize();
    if(dimension != null)
        attrOcc.setTextBoxSize(dimension.getWidth(), dimension.getHeight());
}


//------------------------------ Helper functions ----------------------------------------------------------------------------------------------------
function getTransformationSrcObj(def){
    
    var database = ArisData.getActiveDatabase();
    var srcGuid = def.Attribute(
                        Constants.AT_MOD_TRANSFORM_SRC_OBJ,
                        database.getDbLanguage().LocaleId());
    if(srcGuid != null){
        var strValueSrcGuid = srcGuid.getValue();
        if(strValueSrcGuid != null && strValueSrcGuid.length() > 0){
            if(strValueSrcGuid.length() > 32){
              
                var length = MERGE_ID_PREFIX.length;
                
                strValueSrcGuid = strValueSrcGuid.substring(0,GUID_LENGTH);
            }
                
            return database.FindGUID(strValueSrcGuid);
        }
    }
    return null;
} 

function getTransformationCxnSrcObj(def){
    
    var database = ArisData.getActiveDatabase();
    var mergeId = def.Attribute(
                        Constants.AT_MOD_TRANSFORM_MERGE_IDENTIFIERS,
                        database.getDbLanguage().LocaleId());
    if(mergeId != null){
        var strMergeId = mergeId.getValue();
        if(strMergeId != null && strMergeId.length() > MERGE_ID_PREFIX.length + GUID_LENGTH){
            var srcGUID = strMergeId.substring(MERGE_ID_PREFIX.length,MERGE_ID_PREFIX.length + GUID_LENGTH);    
            return database.FindGUID(srcGUID);
        }
    }
    return null;
} 




function getTransformationSrcOcc(objOcc,srcModel){
    if(objOcc != null && srcModel != null && srcModel.IsValid()){
        var def = objOcc.ObjDef();
        srcDef = getTransformationSrcObj(def);
        if(srcDef != null){
            vSrcSourceOccsInSrcModel = srcDef.OccList( new Array(srcModel));
            for(var i=0; i< vSrcSourceOccsInSrcModel.length; i++){
                var srcX = vSrcSourceOccsInSrcModel[i].X();
                var srcY = vSrcSourceOccsInSrcModel[i].Y();
                if(srcX == objOcc.X() && srcY == objOcc.Y()){ 
                    return vSrcSourceOccsInSrcModel[i];
                }  
            }
        }
    }
    return null;
}   



function getSourceCxnOcc(cxnOcc, srcModel){
    var cxnSourceOcc = cxnOcc.getSource();
    var cxnTargetOcc = cxnOcc.getTarget();
    var cxnDef = cxnOcc.getDefinition();
    var srcCxnDef = getTransformationCxnSrcObj(cxnDef);
    var source = cxnDef.SourceObjDef();   
    var target = cxnDef.TargetObjDef();   
    var srcSource = getTransformationSrcObj(source);
    var srcTarget = getTransformationSrcObj(target);
    
    if(srcSource != null && srcTarget != null){
        vSrcSourceOccsInSrcModel = srcSource.OccList([srcModel]);
        var srcSourceOccsInSrcModel = null;
        for(var j =0; j < vSrcSourceOccsInSrcModel.length; j++){
            var srcX = vSrcSourceOccsInSrcModel[j].X();
            var srcY = vSrcSourceOccsInSrcModel[j].Y();
            if(srcX == cxnSourceOcc.X() && srcY == cxnSourceOcc.Y()){ 
                srcSourceOccsInSrcModel = vSrcSourceOccsInSrcModel[j];
                break;
            }
        }
        
        vSrcTargetOccsInSrcModel = srcTarget.OccList([srcModel]);
        var srcTargetOccsInSrcModel = null;
        for(var j =0; j < vSrcTargetOccsInSrcModel.length; j++){
            var srcX = vSrcTargetOccsInSrcModel[j].X();
            var srcY = vSrcTargetOccsInSrcModel[j].Y();
            if(srcX == cxnTargetOcc.X() && srcY == cxnTargetOcc.Y()){ 
                srcTargetOccsInSrcModel = vSrcTargetOccsInSrcModel[j];
                break;
            }
        }
        if(srcSourceOccsInSrcModel != null && srcTargetOccsInSrcModel != null){
            vSrcCxnOccOut = srcSourceOccsInSrcModel.Cxns(Constants.EDGES_OUT);
            for(var j =0; j < vSrcCxnOccOut.length; j++){
                if(vSrcCxnOccOut[j].getDefinition().equals(srcCxnDef)){
                   return vSrcCxnOccOut[j];
                }        
            } 
        }   
    }
    return null;
}     