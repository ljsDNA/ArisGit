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

var redundancies = [];
const outputParameters = new OutputParameters("");
const output = createXmlOutput(outputParameters);

outHeader();
main();
uploadXmlOutputToADS(output, outputParameters);

/*************************************************************************************************/

function main() {
    var oSystems = oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_APPL_SYS_TYPE]);
    for (i in oSystems) {
        for (j in oSystems) {
            if (i != j) {
                addRedundancy(oSystems[i], oSystems[j]);
            }
        }
    }
    // Sort redundancies descending according to percentage of overlapping capabilities
    redundancies.sort(function(a, b){return b[2] - a[2]});
    // Add a rank for sorting in MashZone
    var rankDigits = redundancies.length.toString().length;
    for (i in redundancies) {
        var rank = (redundancies.length - i).toString();
        while (rank.length < rankDigits) rank = "0".concat(rank);
        redundancies[i].push(rank);
    }
    // Write to XML
    outData();
}

function addRedundancy(oSystemA, oSystemB) {
    var oCapabilitiesA = oSystemA.getConnectedObjs([Constants.OT_IS_FUNC], Constants.EDGES_OUT, [Constants.CT_CAN_SUPP_1]);
    var oCapabilitiesB = oSystemB.getConnectedObjs([Constants.OT_IS_FUNC], Constants.EDGES_OUT, [Constants.CT_CAN_SUPP_1]);
    var capCountB = 0;
    var capCountCommon = 0;
    while (oCapabilitiesA.length > 0) {
        var oCapability = oCapabilitiesA.pop();
        var capIndexB = getIndexInList(oCapability, oCapabilitiesB);
        if (capIndexB >= 0) {
            capCountCommon++;
            oCapabilitiesB.splice(capIndexB, 1);
        }
    }
    capCountB = oCapabilitiesB.length;
    if (capCountCommon > 0) {
        var capCountTotal = capCountCommon + capCountB;
        redundancies.push([oSystemA, oSystemB, capCountCommon/capCountTotal*100, capCountB/capCountTotal*100]);
    }
}

function getIndexInList(item, aList) {
    for (var idx=0; idx < aList.length; idx++) {
        if (item.IsEqual(aList[idx])) return idx;
    }
    return -1;  // Not found in list
}

function outHeader() {
   output.setColumns([["SystemA", "text"],
                      ["SystemA-Guid", "text"],
                      ["SystemB", "text"],
                      ["SystemB-Guid", "text"],
                      ["CapabilitiesPercentCommon", "number"],
                      ["CapabilitiesPercentB", "number"],
                      ["Rank", "text"]]);
}

function outData() {
    for (i in redundancies) {
        output.addRow([redundancies[i][0].Name(nLoc),
                       redundancies[i][0].GUID(),
                       redundancies[i][1].Name(nLoc),
                       redundancies[i][1].GUID(),
                       redundancies[i][2],
                       redundancies[i][3],
                       redundancies[i][4]]);
    }
}
