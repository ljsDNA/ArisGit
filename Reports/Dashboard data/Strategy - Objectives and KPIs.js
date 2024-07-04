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
        var oObj = oObjList[i];
        var oCxnList = oObj.CxnListFilter(Constants.EDGES_OUT, Constants.CT_MEASURED_BY);
        for (var j in oCxnList) {
            var oCxn = oCxnList[j];
            outRow(oObj, oCxn.TargetObjDef());
        }
    }    
}

function outHeader() {
   output.setColumns([["Objective name", "text"],
                      ["Objective GUID", "text"],
                      ["KPI name", "text"],
                      ["KPI GUID", "text"]]);
}

function outRow(oObj, oKpi, sWeighting) {
    output.addRow([oObj.Name(nLoc), // Objective name
                   oObj.GUID(), // Objective GUID
                   oKpi.Name(nLoc), // KPI name
                   oKpi.GUID() // KPI GUID
                   ]);
}
