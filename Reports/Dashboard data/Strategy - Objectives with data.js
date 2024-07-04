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

var nLoc = Context.getSelectedLanguage();
var oDB = ArisData.getActiveDatabase();

const outputParameters = new OutputParameters("");
const output = createXmlOutput(outputParameters);

outHeader();
main();
uploadXmlOutputToADS(output, outputParameters);

/*************************************************************************************************/

function main() {
    var oObjList = oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_OBJECTIVE]);
    for (var i in oObjList) {
        outArisAttributes(oObjList[i]);
    }    
}

function outHeader() {
   output.setColumns([["Objective name", "text"],
                      ["Objective GUID", "text"],
                      ["Goal accomplishment", "number"]]);
}

function outArisAttributes(oObj) {
    output.addRow([oObj.Name(nLoc), // Name
                   oObj.GUID(), // GUID
                   getGoalAccomplishment() // Goal accomplishment
                   ]);

    function zeroIfUnmaintained(oAttr) {
        if (oAttr.IsMaintained()) {
            return oAttr.getValue(); 
        }
        return 0;
    }

    function getInverse(oKpi) {
        var oAttr = oKpi.Attribute(Constants.AT_KEY_INDIC_RATING, nLoc);
        return oAttr.IsMaintained() && oAttr.MeasureUnitTypeNum() == Constants.AVT_INVERS_PROP ? true : false;
    }
    
    // Calculate the goal accomplishment of the objective as the weighted sum
    // of the goal accomplishments of all connected KPIs. Only return a result
    // if all input values for all KPIs are available. This behavior is in
    // line with the report 'Create BSC management view'.
    function getGoalAccomplishment() {
        var result = 0.0;
        var oCxnList = oObj.CxnListFilter(Constants.EDGES_OUT, Constants.CT_MEASURED_BY);
        if (oCxnList.length == 0) {
            return "";
        }
        for (var j in oCxnList) {
            var oCxn = oCxnList[j];
            var oWeighting = oCxn.Attribute(Constants.AT_WEIGHTING_1, nLoc);
            if (!oWeighting.IsMaintained()) {
                return "";
            }
            var oKpi = oCxn.TargetObjDef();
            var oActualValue = oKpi.Attribute(Constants.AT_ACT_VAL, nLoc);
            var oPlanValue = oKpi.Attribute(Constants.AT_PL_VAL, nLoc);
            var oMinValue = oKpi.Attribute(Constants.AT_PL_VAL_MIN, nLoc);
            var oMaxValue = oKpi.Attribute(Constants.AT_PL_VAL_MAX, nLoc);
            var bIsInverse = getInverse(oKpi);
            // Abort if the actual value or the plan value is not maintained
            // or if the max value is not maintained in the inverse case
            if (!oActualValue.IsMaintained() || !oPlanValue.IsMaintained() || (bIsInverse && !oMaxValue.IsMaintained())) {
                return "";
            }
            result += oWeighting.getValue() * calculateKpiGoalAccQuant(oActualValue.getValue(),
                                                                       oPlanValue.getValue(),
                                                                       zeroIfUnmaintained(oMinValue),
                                                                       zeroIfUnmaintained(oMaxValue),
                                                                       bIsInverse);
        }
        return result;
    }

    // Calculate the quantitative goal accomplishment of the KPI according to BSC methodology.
    // See "How to calculate the degree of goal accomplishment" in the ARIS help.
    // This function is also used in the report "EA - KPIs with data".
    function calculateKpiGoalAccQuant(actVal, plVal, minVal, maxVal, isInverse) {
        var result = "";
        if (isInverse) {
            result = (maxVal - actVal) / (maxVal - plVal);
        } else {
            result = (actVal - minVal) / (plVal - minVal);
        }
        return result;
    }
}
