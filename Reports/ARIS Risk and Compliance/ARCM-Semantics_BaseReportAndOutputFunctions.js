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

//***************************************************************************************
// Functions for validation
//***************************************************************************************
var errorStringToSkip = "Signalizes error but shall not be output";

//calls validateObjectUniquenessOverModels(pObjectDef, pName, pRelevantModels, pSPC) with indentation SPC1
function validateObjectUniquenessOverModels(pObjectDef, pName, pRelevantModels){
    return validateObjectUniquenessOverModels(pObjectDef, pName, pRelevantModels, SPC1);    
}
 
function validateObjectUniquenessOverModels(pObjectDef, pName, pRelevantModels, pSPC){
    var szMsg = "";
    
    var aObjectOccsInModels = new Array();
    var aObjectOccsInModel;
    
    for (var m=0; m < pRelevantModels.length; m++){
        aObjectOccsInModel = pObjectDef.OccListInModel ( pRelevantModels[m] );
        aObjectOccsInModels = aObjectOccsInModels.concat(aObjectOccsInModel);
    }
    
    if (aObjectOccsInModels.length > 1) {
        
        szMsg = pSPC + getString("COMMON_2");
        for (var i = 0 ; i< aObjectOccsInModels.length; i++){
            szMsg += "\r\n" + pSPC + SPC1 + aObjectOccsInModels[i].Model().Name(gLanguage);
            szMsg += "\r\n" + pSPC + SPC2 + getString("COMMON_4") + "     " + getPathFormated( aObjectOccsInModels[i].Model().Group(), SPC3) + "\\" + aObjectOccsInModels[i].Model().Group().Name(gLanguage);
        }
    }

    if (!szMsg.equals("")) {
        szMsg = pSPC + new java.lang.String(getString("COMMON_5")).replaceFirst("%0", pName).replaceFirst("%1", pRelevantModels[0].Type()) + "\r\n" + szMsg;      
    }   
    return szMsg; 
}

//calls validateMandatoryObjectAttributes(pObject, pMandatoryConditions, pSPC, pHeaderString) with indentation SPC2 and no header string
function validateMandatoryObjectAttributes(pObject, pMandatoryConditions){
    return validateMandatoryObjectAttributes(pObject, pMandatoryConditions, SPC2, null);    
}

//calls validateMandatoryObjectAttributes(pObject, pMandatoryConditions, pSPC, pHeaderString) without header string
function validateMandatoryObjectAttributes(pObject, pMandatoryConditions, pSPC){
    return validateMandatoryObjectAttributes(pObject, pMandatoryConditions, pSPC, null);    
}

// Validation of the mandatory attributes defined in AAMExport_SemanticsReportProperties.js (function splitString())
// pMandatoryConditions is always an Array filled with conditions that apply for either
// 1.  single attribute (field) or
// 2a. single attribute (field) and a second attribute
// 2b. single attribute (field) and a additional condition for its value (at the moment only the RANGE condition for integer fields)
// All conditions are OR-connected i.e. at least one must be filled and valid.
// If at least one of the additional conditions is not fulfilled this works as an override and makes the whole condition group invalid. 
//
// pSPC the optional indentation of the returned message
function validateMandatoryObjectAttributes(pObject, pMandatoryConditions, pSPC, pHeaderString){

    var sOverallErrors = "";
    var sConditionGroupErrors = "";
    if (pSPC == null) {pSPC = "";}
    
    var aConditions;
    var bConditionsValid;
    var aFieldNotDefined, aFieldNotFilled, aFieldNotValid;
    
    //check each group of conditions (field names and additional conditions)
    for (var i=0; i<pMandatoryConditions.length; i++) {
   
        aConditions = pMandatoryConditions[i];
        bConditionsValid = false; 
        bAdditionalConditionsValid = true;
        
        //used for the classification of the seperate conditions
        aFieldNotDefined = new Array();
        aFieldNotFilled  = new Array();
        aFieldNotValid  = new Array();
        
        //check and classify each single condition
        for (var j=0; j<aConditions.length; j++) {

           var condition = aConditions[j];
           var additionalCondition = null;
           
           var field = condition;
           
           // check if the field starts with "!" as negation of a boolean attribute
           var bConditionNegation = field.substring(0,1) == "!"; 
           if (bConditionNegation) {
               field = field.substring(1, field.length);    
           }
           
           // check if we have additonal condition (e.g.[1..365]) to check         
           if (field.indexOf("[") != -1){
               additionalCondition = field.substring(field.indexOf("[")+1, field.indexOf("]"));
               field = field.substring(0, field.indexOf("["));          
           }
           
           //if either the field or its additional condition refer to unknown constants add a corresponding error message
           var fieldTypeNum;
           var fieldAttributeName = "";
           var additionId;
           try {
               fieldTypeNum  = checkAttributeConditionDefined(field, pSPC);
               fieldAttributeName = ArisData.ActiveFilter().AttrTypeName( fieldTypeNum );
           } catch (errorMessage) {             
               sConditionGroupErrors = sConditionGroupErrors + errorMessage;
               aFieldNotDefined.push(field);
               //check next condition
               continue;
           }
           
           try {
               if (additionalCondition != null) {
                    additionId   = checkAttributeConditionDefined(additionalCondition, pSPC);
               }
           } catch (errorMessage) {             
               sConditionGroupErrors = sConditionGroupErrors + errorMessage;
               aFieldNotDefined.push(field);
               //check next condition
               continue;
           }
           
           //determine field value
           var fieldValue = pObject.Attribute( fieldTypeNum , gLanguage).getValue();
           
           var bIsEmpty = fieldValue == null || fieldValue.equals("");
           var bIsBoolean = ArisData.getActiveDatabase().ActiveFilter().AttrBaseType(fieldTypeNum) == Constants.ABT_BOOL;
           
           //for non-boolean attributes:
           if ( !bIsBoolean ) {   
               // non-negated conditions are not fulfilled if the  value is empty
               if ( bIsEmpty && !bConditionNegation && !isEmptyAttibuteAllowed(pObject, fieldTypeNum) ) {                  
                   //skip multiple error messages referring to the same field
                   if (!isStringInArray(field, aFieldNotFilled)) {
                       if (sConditionGroupErrors.length != 0) {sConditionGroupErrors += "\n";}
                       sConditionGroupErrors += pSPC + "--> " + new java.lang.String(getString("COMMON_10")).replaceFirst("%0", fieldAttributeName);
                       aFieldNotFilled.push(field);
                   }
                   //check next condition
                   continue;
               }
               // negated conditions are not fulfilled if the value is not empty
               if ( !bIsEmpty && bConditionNegation ) { 
                   //check next condition
                   continue;
               }
           }
           
           //for boolean attributes:
           if (bIsBoolean) {                                    
               //no condition negation i.e. value TRUE is valid, value FALSE is invalid
               if ( bConditionNegation == false && ( bIsEmpty || isboolattributefalse(pObject, fieldTypeNum , gLanguage)) ) {
                   //check next condition
                   continue;       
               }
               if ( bConditionNegation == true && isboolattributetrue(pObject, fieldTypeNum , gLanguage) ) {
                   //check next condition
                   continue;      
               }
           }
           
           //if the field itself is valid check also the additional condition if present
           //this additional condition MUST be fulfilled - otherwise it is an error
           if (additionalCondition != null && ! (bIsEmpty && isEmptyAttibuteAllowed(pObject, fieldTypeNum))) {              
               var szResult = validateAdditionalAttributeCondition(pObject, fieldAttributeName, additionalCondition, fieldValue, aFieldNotFilled, pSPC);
               // generate error output if additional condition is not fulfilled
               if ( !szResult.equals("")){
                   if ( !szResult.equals(errorStringToSkip)){
                        sConditionGroupErrors += szResult;
                   }
                   aFieldNotValid.push(condition);
                   //an unfulfilled additional conditions makes the whole conditions group invalid (see RISK ASSERTION conditions for example)
                   bAdditionalConditionsValid = false;
                   //check next condition
                   continue;
               }
           }           
          
            //This field (and its additional condition if present) is valid i.e. at least one condition of the condition block is valid 
            bConditionsValid = true;
      
        }//end-for check all separate conditions of condition group
           
        //output generated warnings / error messages for all conditions of this condition group if
        //- either all conditions are invalid OR
        //- at least one additional condition was not fulfilled (DEACTIVATED)
        //if (!bConditionsValid || !bAdditionalConditionsValid) {
        if (!bConditionsValid ) {
            if (sOverallErrors != "") {sOverallErrors += "\r\n" + "\r\n";}
            sOverallErrors += pSPC + getString("COMMON_16") + " " + recombineConditionGroup(aConditions) + "\r\n";
            //this part of the error message is only meaningful if the boolean attribute is standalone i.e. not part of a "multi enum" attribute group
            if (aConditions.length == 1 && bIsEmpty && bIsBoolean) {
                sOverallErrors += pSPC + "--> " + new java.lang.String(getString("COMMON_10")).replaceFirst("%0", fieldAttributeName) + "\r\n";
            }
            sOverallErrors += sConditionGroupErrors;    
        }
        sConditionGroupErrors = "";

    }//end-for check all condition groups
     
    if (sOverallErrors != "" && pHeaderString != null) {
        sOverallErrors = pSPC + pHeaderString + sOverallErrors;
    }
    
    return sOverallErrors;       
}

/**
* checks if the attribute according to parameter "fieldTypeNum" may be empty for the given object, depending on other attribute values of the object.
* Example: If "Frequency" is "Event driven only", then "Start date" and "Duration" may be empty.
* Returns true if the given attribute may be empty based on the object's other attribute values, else false.
* Simple implementation since this report will be replaced soon.
**/
function isEmptyAttibuteAllowed(pObject, fieldTypeNum){
    if(fieldTypeNum == Constants.AT_AAM_TESTDEF_START_DATE || fieldTypeNum == Constants.AT_AAM_TEST_DURATION) {
        if(pObject.Attribute(Constants.AT_AAM_TEST_FREQUENCY, g_nLoc).MeasureUnitTypeNum() == Constants.AVT_AAM_TEST_FREQUENCY_EVENT_DRIVEN){
            return true;
        }    
    }
    if(fieldTypeNum == Constants.AT_CTRL_EXECUTION_TASK_START_DATE || fieldTypeNum == Constants.AT_CTRL_EXECUTION_TASK_DURATION) {
        if(pObject.Attribute(Constants.AT_CTRL_EXECUTION_TASK_FREQUENCY, g_nLoc).MeasureUnitTypeNum() == Constants.AVT_AAM_CTRL_FREQUENCY_EVENT_DRIVEN){
            return true;
        }    
    }
    if(fieldTypeNum == Constants.AT_GRC_START_DATE_OF_RISK_ASSESSMENTS || fieldTypeNum == Constants.AT_GRC_RISK_ASSESSMENT_DURATION) {
        if(pObject.Attribute(Constants.AT_GRC_ASSESSMENT_FREQUENCY, g_nLoc).MeasureUnitTypeNum() == Constants.AVT_RM_ASSESSMENT_FREQUENCY_EVENT_DRIVEN){
            return true;
        }    
    }
    if(fieldTypeNum == Constants.AT_SURVEYTASK_START_DATE || fieldTypeNum == Constants.AT_SURVEYTASK_DURATION) {
        if(pObject.Attribute(Constants.AT_SURVEYTASK_FREQUENCY, g_nLoc).MeasureUnitTypeNum() == Constants.AVT_EVENT_DRIVEN){
            return true;
        }    
    }
    if(fieldTypeNum == Constants.AT_START_DATE_OF_POLICY_REVIEWS || fieldTypeNum == Constants.AT_REVIEW_EXECUTION_TIME_LIMIT) {
        if(pObject.Attribute(Constants.AT_REVIEW_FREQUENCY, g_nLoc).MeasureUnitTypeNum() == Constants.AVT_RM_ASSESSMENT_FREQUENCY_EVENT_DRIVEN){
            return true;
        }    
    }
    
    return false;
}


/*
 Checks the given condition (normal and additional). If is no RANGE condition and refers to a unknown Constant 
 this function throws error string as exception, otherwise it returns the integer Constant.
 If it is a RANGE condition this function returns nothing.
*/
function checkAttributeConditionDefined(pCondition, pSPC) {
    if ( pCondition.toUpperCase().indexOf("RANGE") == -1 ) {
        
        // check if the field starts with "!" as negation of a boolean attribute
        var bConditionNegation = pCondition.substring(0,1) == "!";
        if (bConditionNegation) {
            pCondition = pCondition.substring(1, pCondition.length);    
        }
        
        var typeNum = getAttributeTypeNum(pCondition);
        
        if (typeNum == null) {
            throw pSPC + SPC1 + "--> " + new java.lang.String(getString("COMMON_9")).replaceFirst("%0", pCondition) + "\r\n"; 
        } else {
            return typeNum;
        }
    }
}

/*
 sub-function of validateMandatoryObjectAttributes to perform the
 validation of additional attribute condition (e.g. [Range 1..365])
 other conditions should be implemented here
*/
function validateAdditionalAttributeCondition(pObject, pBaseField, pAdditionalCondition, pAttributeValue, aFieldNotFilled, pSPC) {
    var szMsg = "";
    //special handling of keyword RANGE
    if ( pAdditionalCondition.toUpperCase().indexOf("RANGE") > -1 ){
        var posAn1 = pAdditionalCondition.toUpperCase().indexOf("RANGE")+5;
        var posEn1 = pAdditionalCondition.indexOf("..");
        var posAn2 = posEn1+2;     

        // MWZ, TANR 180984        
        var iMinValue  = Number(pAdditionalCondition.substring(posAn1, posEn1).replace(" ", ""));
        var iMaxValue  = Number(pAdditionalCondition.substring(posAn2).replace(" ", ""));
        var iAttrValue = Number(pAttributeValue);

        if  (!(isNaN(iMinValue) || isNaN(iMaxValue) || isNaN(iAttrValue))) {
                if ( iAttrValue < iMinValue || iAttrValue > iMaxValue ){                       
                    szMsg = new java.lang.String(getString("COMMON_6")).replaceFirst("%0", pAttributeValue) + "\r\n";
                    szMsg = szMsg + SPC2 + SPC1 + new java.lang.String(getString("COMMON_7")).replaceFirst("%0", pAdditionalCondition);      
                }
        }      
    }
    // MWZ, TANR 180982
    // pAdditionalCondition consists of a single attribute name
    else {     
       bAdditionalConditionValid = true;
       
       // check if the field starts with "!" as negation of a boolean attribute
       var bConditionNegation = pAdditionalCondition.substring(0,1) == "!"; 
       if (bConditionNegation) {
           pAdditionalCondition = pAdditionalCondition.substring(1, pAdditionalCondition.length);    
       }   
       var id = getAttributeTypeNum(pAdditionalCondition);
             
       // check of the additional condition attribute
       if ( id != null ) {
            var oAttr = pObject.Attribute( id , gLanguage);
            var sAttrName = ArisData.ActiveFilter().AttrTypeName( id );
            
            // an empty value is never valid for a mandatory attribute
            if ( !oAttr.IsMaintained() || oAttr.getValue().equals("") ) {
                //skip multiple error messages referring to the same field
                if (!isStringInArray(pAdditionalCondition, aFieldNotFilled)) {
                    szMsg += new java.lang.String(getString("COMMON_10")).replaceFirst("%0", sAttrName);
                    aFieldNotFilled.push(pAdditionalCondition);
                } else {
                    //Signalize error but do not output the "not maintained" string a second time since this was
                    //already done before (aFieldNotFilled contains the additionalCondition field already)
                    return errorStringToSkip;    
                }
            }
             
            // if the ID refers to a boolean attribute
            if (ArisData.getActiveDatabase().ActiveFilter().AttrBaseType(id) == Constants.ABT_BOOL) {                  
                if ( bConditionNegation == false && isboolattributefalse(pObject, id , gLanguage) ) {
                    szMsg += sAttrName + " " + getString("COMMON_12");
                }
                if ( bConditionNegation == true && isboolattributetrue(pObject, id , gLanguage) ) {
                    szMsg += sAttrName + " " + getString("COMMON_11");
                }
            }     
       }   
       // should not happen since id is checked before this funtion is called
       else {}     
    }
    
    if (szMsg.length > 0) {
        var sAdditionalConditionMessage = pSPC + SPC1 + "--> " + new java.lang.String(getString("COMMON_8")).replaceFirst("%0", pBaseField) + "\r\n";
        sAdditionalConditionMessage += pSPC + SPC2 + szMsg;
        return sAdditionalConditionMessage;
    } else {
        return szMsg;
    }
}

/*
 * Write a error message for wrong number of linked ObjDefs.
 * Neither deactivated ObjDefs are taken into account nor deactivated connections. 
 */
function getConnectionCountValidationOutput(pOccurenceMin, pOccurenceMax, pExportInfo, pChildExportInfoSet, pCheckedObjectString, pSPC){
    
    var szMsg = "";
    if (pSPC == null) {pSPC = "";}
    
    var connections = 0;
    var oObjDef = pExportInfo.getObjDef();
    var aChildExportInfoArray = convertHashSetToJSArray(pChildExportInfoSet);
    
    for (var c=0; c<aChildExportInfoArray.length; c++) {
        if ( !isboolattributetrue(aChildExportInfoArray[c].getObjDef(), Constants.AT_DEACT, gLanguage) 
        && !isLinkDeactivated(oObjDef, aChildExportInfoArray[c].getObjDef())) {
            connections++;
        }
    }
	
    if (connections < pOccurenceMin || connections > pOccurenceMax) {
        if ( pOccurenceMax == OCCURRENCE_INFINITE ){
			szMsg = pSPC + new java.lang.String(getString("COMMON_14")).replaceFirst("%0", pCheckedObjectString).replaceFirst("%1", pOccurenceMin).replaceFirst("%3", connections);
        }
        else{
            szMsg = pSPC + new java.lang.String(getString("COMMON_13")).replaceFirst("%0", pCheckedObjectString).replaceFirst("%1", pOccurenceMin).replaceFirst("%2", pOccurenceMax).replaceFirst("%3", connections);
        }
        
        if (aChildExportInfoArray.length > 0){
            for (var ou=0; ou<aChildExportInfoArray.length; ou++){
                szMsg += "\r\n" + pSPC + SPC1 + aChildExportInfoArray[ou].getObjDef().Name(gLanguage);
            }  
        }
   }   
   return szMsg;
}

/*
 * Write a error message when both the specified start and end date are maintained at the given ObjDef and if the end date lies before the start date. 
 */
function validateStartEndDate(p_oObjDef, p_iStartDateTypeNum, p_iEndDateTypeNum, p_sSPC) {

	var szMsg = "";
	var surveyTaskStartDate = p_oObjDef.Attribute(p_iStartDateTypeNum, g_nLoc).MeasureValue();
    var surveyTaskEndDate = p_oObjDef.Attribute(p_iEndDateTypeNum, g_nLoc).MeasureValue();
    if((surveyTaskStartDate != null) && (surveyTaskEndDate != null)){
        if (surveyTaskEndDate.compareTo(surveyTaskStartDate) < 0) {
			szMsg = p_sSPC + new java.lang.String(getString("COMMON_17")).replaceFirst("%0", ArisData.ActiveFilter().AttrTypeName( p_iEndDateTypeNum )).replaceFirst("%1", ArisData.ActiveFilter().AttrTypeName( p_iStartDateTypeNum ));
        }    
    }
	return szMsg;
}

//***************************************************************************************
// Functions for output formatting
//***************************************************************************************
/*
 * Add a given header to the given overall validation message
 * Example: Risk report header for the validation messages of risk1, risk2, risk3, enclosed by two "*********" lines.
 */
function addOutputHeader(p_sOverallMessages, p_sHeaderText) {
    if (p_sHeaderText == null || p_sHeaderText == "") {return p_sOverallMessages;}
     
    var sHeader = "***************************************************************************\r\n"
                + p_sHeaderText
                + "\r\n***************************************************************************";
    if (p_sOverallMessages == null || p_sOverallMessages == "") {return sHeader;}
    
    return sHeader + "\r\n" + "\r\n" + p_sOverallMessages;
}
 
/*
 * Add a complete validation message block concerning a single object to the other object messages, separated
 * by a "---------" line.
 * Example: Add the error messages for risk3 after the existing error messages of risk1 and risk2.
 */
function addCompleteObjectValidationOutput(p_sOverallMessages, p_sObjectMessages) {
    if (p_sObjectMessages == null || p_sObjectMessages == "") {return p_sOverallMessages;}
    if (p_sOverallMessages == null || p_sOverallMessages == "") {return p_sObjectMessages;}
    return p_sOverallMessages + "\r\n" + "\r\n" + UDL + p_sObjectMessages;
}

/**
 * Add the given object info string above the given validation messages. 
 */
function addObjectValidationInfo(p_sObjectInfo, p_sValidationMessages, p_oObjDef, p_SPC) {
    return  p_sObjectInfo + "\r\n"
            + p_SPC + getString("COMMON_4") + " " + getPathFormated(p_oObjDef.Group(), p_SPC) + "\\" 
            + p_oObjDef.Group().Name(gLanguage)
            + "\r\n" + "\r\n" + p_sValidationMessages;    
}
 
/*
 * Add a single validation message to the other messages concerning the same object .
 * Example: Add the 'Mandatory attributes not filled' message for risk1 to all other validation messages of risk1.
 */
function addSingleValidationOutput(p_sSingleMessage, p_sOverallObjectMessages, p_SPC) {
    if (p_SPC == null || p_SPC == undefined) {p_SPC = "";}
    if (p_sSingleMessage == null || p_sSingleMessage == "") {return p_sOverallObjectMessages;}
    if (p_sOverallObjectMessages == null || p_sOverallObjectMessages == "") {return p_SPC + p_sSingleMessage;}
    return p_sOverallObjectMessages + "\r\n" + "\r\n" + p_SPC + p_sSingleMessage;
}

function getPathFormated(pGroup, pDistanceString){   
    
    var szPath = pGroup.Parent().Path(gLanguage);
    if ( szPath.length() <= MAX_CHARACTERS_IN_ROW ){
        return szPath;
    } else {
        
        var sResult = new Packages.java.lang.String("");
        var sRestPathString = szPath;
        while (sRestPathString != null) {
            if (sRestPathString.length() <= MAX_CHARACTERS_IN_ROW ) {
                sResult += "\r\n" + pDistanceString + sRestPathString;
                sRestPathString = null;
            } else {
                sResult += "\r\n" + pDistanceString + sRestPathString.substring(0, MAX_CHARACTERS_IN_ROW);
                sRestPathString = sRestPathString.substring(MAX_CHARACTERS_IN_ROW);
            }
        }
        
        return sResult;
    }      
}

function getUnderline(p_sHeader, pSPC) {
	var sUnderline = "";
	var sJSheader = p_sHeader + "";
	for (var i=0; i<sJSheader.length; i++) {
		sUnderline += "-";
	}
	if (pSPC != null) {sUnderline = pSPC + sUnderline;}
	return sUnderline;
}


function isStringInArray(sString, jsStringArray) {
    for (var i=0; i<jsStringArray.length; i++) {
        if (sString == jsStringArray[i]) {
            return true;
        }
    }
    return false;
}