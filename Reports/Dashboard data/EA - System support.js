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
    var oSystems = oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_APPL_SYS_TYPE]);
    for (i in oSystems) {
        var mapOrgUnitSupports = new java.util.HashMap();
        var mapFunctionSupports = new java.util.HashMap();
        var oSystem = oSystems[i];
        // Determine active support connections
        var oSupportCxns = oSystem.CxnListFilter(Constants.EDGES_OUT, Constants.CT_BELONGS_TO_PROC_SUPPORT_UNIT);
        var oActiveSupportCxns = [];
        for (j in oSupportCxns) {
            var oCxn = oSupportCxns[j];
            var status = oCxn.Attribute(Constants.AT_PROC_SUPPORT_STATUS, nLoc).MeasureUnitTypeNum();
            if (status == Constants.AVT_PHASED_IN ||
                status == Constants.AVT_START_PLANNING_PHASE_OUT ||
                status == Constants.AVT_TO_BE_PHASED_OUT) {
                    oActiveSupportCxns.push(oCxn);
            }
        }
        // Record and count the supports for all org units and functions
        for (j in oActiveSupportCxns) {
            var psu = oActiveSupportCxns[j].TargetObjDef();
            var oOrgUnit = psu.getConnectedObjs([Constants.OT_ORG_UNIT], Constants.EDGES_IN, [Constants.CT_CAN_BE_USER])[0];
            if (oOrgUnit) { // Only org units, no locations
                var oFunc = psu.getConnectedObjs([Constants.OT_FUNC], Constants.EDGES_OUT, [Constants.CT_CAN_SUPP_1])[0];
                if (oOrgUnit != undefined)
                    mapOrgUnitSupports = addSupport(mapOrgUnitSupports, oOrgUnit);
                if (oFunc != undefined)
                    mapFunctionSupports = addSupport(mapFunctionSupports, oFunc);
            }
        }
        // Sort the maps and add a rank
        mapOrgUnitSupports = sortAndRank(mapOrgUnitSupports);
        mapFunctionSupports = sortAndRank(mapFunctionSupports);
        // Write XML
        outData(oSystem, mapOrgUnitSupports, "OrgUnit");
        outData(oSystem, mapFunctionSupports, "Function");
    }
}

function sortAndRank(mapSupports) {
    // Convert to array
    var array = [];
    var iter = mapSupports.keySet().iterator();
    while (iter.hasNext()) {
        var key = iter.next();
        array.push([key, mapSupports.get(key)]);
    }
    // Sort descending according to count
    array.sort(function(a, b){return b[1] - a[1]});
    // Add a rank for sorting in MashZone
    var rankDigits = array.length.toString().length;
    for (i in array) {
        var rank = (array.length - i).toString();
        while (rank.length < rankDigits) rank = "0".concat(rank);
        array[i].push(rank);
    }
    // Convert back to hashmap
    var mapResult = new java.util.HashMap();
    for (i in array) {
        var entry = array[i];
        // key: object; value: [count, rank]
        mapResult.put(entry[0], [entry[1], entry[2]]);
    }
    return mapResult;
}

function addSupport(mapSupports, oObj) {
    var count = mapSupports.containsKey(oObj) ? mapSupports.get(oObj) : 0;
    mapSupports.put(oObj, ++count);
    return mapSupports;
}

function outHeader() {
   output.setColumns([["System", "text"],
                      ["SystemGuid", "text"],
                      ["SupportedObj", "text"],
                      ["SupportedObjGuid", "text"],
                      ["SupportedObjType", "text"],
                      ["SupportCount", "number"],
                      ["Rank", "text"]]);
}

function outData(oSystem, mapSupports, type) {
    var systemName = oSystem.Attribute(Constants.AT_NAME, nLoc).getValue();
    var systemGuid = oSystem.GUID();
    var iter = mapSupports.keySet().iterator();
    while (iter.hasNext()) {
        var support = iter.next();
        output.addRow([systemName, systemGuid, support.Attribute(Constants.AT_NAME, nLoc).getValue(), support.GUID(), type, mapSupports.get(support)[0], mapSupports.get(support)[1]]);
    }
}
