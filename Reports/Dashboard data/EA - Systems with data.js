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

var g_nLoc = Context.getSelectedLanguage();
var g_oDB = ArisData.getActiveDatabase();

const outputParameters = new OutputParameters("");
const output = createXmlOutput(outputParameters);

outHeader();
main();
uploadXmlOutputToADS(output, outputParameters);

/*************************************************************************************************/

function main() {
    var oSystems = g_oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_APPL_SYS_TYPE]);    
    for (var i in oSystems) {
        outArisAttributes(oSystems[i]);
    }    
}

function outHeader() {
   output.setColumns([["System", "text"],
                      ["System-Guid", "text"],
                      ["Data center costs", "number"],
                      ["Criticality", "text"],
                      ["Criticality (numeric)", "number"],
                      ["Interface count", "number"],
                      ["Technical fit", "number"],
                      ["Business value", "number"],
                      ["Risk score", "number"]]);
}

function outArisAttributes(oSystem) {
    output.addRow([oSystem.Name(g_nLoc),
                   oSystem.GUID(),
                   getMeasureValue(Constants.AT_COST_COMP_CNT), // Data center costs
                   getValue(Constants.AT_CRITICALITY), // Criticality
                   getNumericCriticality(), // Criticality (numeric)
                   getInterfaceCount(oSystem), // Interface count
                   getTechnicalFit(), // Technical fit
                   getBusinessValue(), // Business value
                   getRiskScore()] // Risk score
                   ); 

    function getValue(nAttrType) {
        var oAttr = oSystem.Attribute(nAttrType, g_nLoc);
        if (oAttr.IsMaintained()) {
            return oAttr.getValue(); 
        }
        return "";
    }

    function getMeasureValue(nAttrType) {
        var oAttr = oSystem.Attribute(nAttrType, g_nLoc);
        if (oAttr.IsMaintained()) {
            return oAttr.MeasureValue(); 
        }
        return "";
    }

    // Return a numeric value between 1 and 5 for the Criticality attribute
    function getNumericCriticality() {
        var oAttr = oSystem.Attribute(Constants.AT_CRITICALITY, g_nLoc);
        if (oAttr.IsMaintained()) {
            var numCrit = 0;
            switch (oAttr.MeasureUnitTypeNum()) {
                case Constants.AVT_VERY_LOW_1:
                numCrit = 1;
                break;
                case Constants.AVT_LOW_3:
                numCrit = 2;
                break;
                case Constants.AVT_AVG_1:
                numCrit = 3;
                break;
                case Constants.AVT_HIGH_1:
                numCrit = 4;
                break;
                case Constants.AVT_VERY_HIGH_1:
                numCrit = 5;
                break;
            }
            return numCrit;
        }
        return "";
    }
    
    function getInterfaceCount(sourceSystem) {
        var interfaceCxnDefList = sourceSystem.CxnListFilter(Constants.EDGES_INOUT, Constants.CT_SENDS_3);
        if(interfaceCxnDefList != null)
            return interfaceCxnDefList.length;
    
        return 0;
    }
    
    function getTechnicalFit() {
        // For now only the standardization of components/technologies
        // is considered for technical fit
        return getComponentStandardization();
    }
    
    // Calculate the average of standardization states across all
    // components/technologies used by the system. This is a numeric
    // value between 1 and 5.
    function getComponentStandardization() {
        var aoConnectedSystems = oSystem.getConnectedObjs([Constants.OT_APPL_SYS_TYPE], Constants.EDGES_OUT, [Constants.CT_USE_1]);
        var nValidCount = 0;
        var nScoreSum = 0;
        var oConnSystem, oStandardAttr;
        for (var i=0; i<aoConnectedSystems.length; i++) {
            oConnSystem = aoConnectedSystems[i];
            oSysTypeAttr = oConnSystem.Attribute(Constants.AT_SYSTEM_TYPE, -1);
            oStandardAttr = oConnSystem.Attribute(Constants.AT_STATUS_STANDARDIZATION, -1);
            if (oSysTypeAttr.IsMaintained()
                && oSysTypeAttr.MeasureUnitTypeNum()==Constants.AVT_SYSTEM_TYPE_COMPONENT
                && oStandardAttr.IsMaintained()) {
                switch (oStandardAttr.MeasureUnitTypeNum()) {
                    case Constants.AVT_STATUS_STANDARDIZATION_NON_STANDARD:
                    nScoreSum += 1;
                    break;
                    case Constants.AVT_STATUS_STANDARDIZATION_IN_EVALUATION:
                    nScoreSum += 1;
                    break;
                    case Constants.AVT_STATUS_STANDARDIZATION_REQ_FOR_STANDARD:
                    nScoreSum += 2;
                    break;
                    case Constants.AVT_STATUS_STANDARDIZATION_TO_BE_PHASED_IN:
                    nScoreSum += 3;
                    break;
                    case Constants.AVT_STATUS_STANDARDIZATION_IS_STANDARD:
                    nScoreSum += 5;
                    break;
                    case Constants.AVT_STATUS_STANDARDIZATION_STANDARD_LTD_USE:
                    nScoreSum += 4;
                    break;
                    case Constants.AVT_STATUS_STANDARDIZATION_TO_BE_PHASED_OUT:
                    nScoreSum += 2;
                    break;
                    case Constants.AVT_STATUS_STANDARDIZATION_IS_PHASED_OUT:
                    nScoreSum += 1;
                    break;
                    case Constants.AVT_STATUS_STANDARDIZATION_REFUSED:
                    nScoreSum += 1;
                    break;
                }
                nValidCount++;
            }
        }
        return nValidCount > 0 ? Math.round(nScoreSum*100/nValidCount)/100 : "";
    }
    
    function getBusinessValue() {
        var result = "";
        var critScore = getNumericCriticality();
        var usersScore = getUsersScore();
        var suppFuncsScore = getSuppFuncsScore();
        if (critScore != "" && usersScore != "") {
            result = Math.round((critScore + usersScore + suppFuncsScore) * 100 / 3) / 100;
        }
        return result;
    }
    
    // Return a score between 1 and 5 for the number of
    // internal and external users.
    // 
    // The score rises linearly with an exponential
    // increase of the user numbers, leading to a lower
    // value per user the greater the user base is.
    function getUsersScore() {
        var result = "";
        var nIntUsers = getNumUsers(Constants.AT_NUMBER_USER_INTERNAL);
        var nExtUsers = getNumUsers(Constants.AT_NUMBER_USER_EXTERNAL);
        if (nIntUsers || nExtUsers) {
            var nTotalUsers = 0;
            if (nIntUsers) nTotalUsers += nIntUsers;
            if (nExtUsers) nTotalUsers += nExtUsers;
            if (nTotalUsers > 4096) {
                result = 5;
            } else if (nTotalUsers > 512) {
                result = 4;
            } else if (nTotalUsers > 64) {
                result = 3;
            } else if (nTotalUsers > 8) {
                result = 2;
            } else {
                result = 1;
            }
        }
        return result;
    }
    
    function getNumUsers(p_nAttrType) {
        var result = null;
        var oAttr = oSystem.Attribute(p_nAttrType, g_nLoc);
        if (oAttr.IsMaintained()) {
            switch(oAttr.MeasureUnitTypeNum()) {
                case Constants.AVT_NUMBER_USER_0:
                result = 0;
                break;
                case Constants.AVT_NUMBER_USER_100:
                result = 100;
                break;
                case Constants.AVT_NUMBER_USER_500:
                result = 500;
                break;
                case Constants.AVT_NUMBER_USER_1000:
                result = 1000;
                break;
                case Constants.AVT_NUMBER_USER_2500:
                result = 2500;
                break;
                case Constants.AVT_NUMBER_USER_5000: 
                result = 5000;
                break;
                case Constants.AVT_NUMBER_USER_10000:
                result = 10000;
                break;
                case Constants.AVT_NUMBER_USER_MORE_10000:
                result = 100000;
                break;
            }
        }
        return result;
    }

    // Return a score for the number of supported functions.
    // 
    // Just like in case of the score for number of users the
    // values linearize an exponential rise of the number of
    // supported functions.
    function getSuppFuncsScore() {
        var result = 1;
        var aoSuppFuncs = oSystem.getConnectedObjs([Constants.OT_FUNC], Constants.EDGES_OUT, [Constants.CT_CAN_SUPP_1]);
        if (aoSuppFuncs.length > 1000) {
            result = 5;
        } else if (aoSuppFuncs.length > 100) {
            result = 4;
        } else if (aoSuppFuncs.length > 10) {
            result = 3;
        } else if (aoSuppFuncs.length > 0) {
            result = 2;
        }
        return result;
    }

    // Return a score for the IT risk of the system.
    // 
    // The system score is the maximum risk score across all risks that are
    // connected to the system. The score for one risk is calculated by adding
    // the reduced occurrence frequency to the reduced amount of damages. Each
    // of these qualitative assessment attributes can have five states which
    // are given numbers from 1 (very low) to 5 (very high). Thus, the score
    // can range from 2 to 10.
    function getRiskScore() {
        var aoConnectedRisks = oSystem.getConnectedObjs([Constants.OT_RISK], Constants.EDGES_IN, [Constants.CT_AFFECTS]);
        var nValidCount = 0;
        var nMaxScore = 0;
        var nCurScore, oConnRisk, oAmOfDamAttr, oOccFreqAttr;
        for (var i=0; i<aoConnectedRisks.length; i++) {
            nCurScore = 0;
            oConnRisk = aoConnectedRisks[i];
            oAmOfDamAttr = oConnRisk.Attribute(Constants.AT_RED_LOSS_QUAL, -1);
            oOccFreqAttr = oConnRisk.Attribute(Constants.AT_RED_FREQU_LOSS_QUAL, -1);
            if (oAmOfDamAttr.IsMaintained() && oOccFreqAttr.IsMaintained()) {
                switch (oAmOfDamAttr.MeasureUnitTypeNum()) {
                    case Constants.AVT_INSIGNIF:
                    nCurScore += 1;
                    break;
                    case Constants.AVT_LOW_2:
                    nCurScore += 2;
                    break;
                    case Constants.AVT_AVG:
                    nCurScore += 3;
                    break;
                    case Constants.AVT_HIGH:
                    nCurScore += 4;
                    break;
                    case Constants.AVT_CATASTROPH:
                    nCurScore += 5;
                    break;
                }
                switch (oOccFreqAttr.MeasureUnitTypeNum()) {
                    case Constants.AVT_VERY_LOW:
                    nCurScore += 1;
                    break;
                    case Constants.AVT_LOW_1:
                    nCurScore += 2;
                    break;
                    case Constants.AVT_AVG:
                    nCurScore += 3;
                    break;
                    case Constants.AVT_HIGH:
                    nCurScore += 4;
                    break;
                    case Constants.AVT_VERY_HIGH:
                    nCurScore += 5;
                    break;
                }
                if (nCurScore > nMaxScore)
                    nMaxScore = nCurScore;
            }
        }
        return nMaxScore > 0 ? nMaxScore : "";
    }
}
