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

var mapUnit2Children = new java.util.HashMap();
var mapUnit2Systems  = new java.util.HashMap();
var mapUnit2Funcs    = new java.util.HashMap();
var mapFunc2Children = new java.util.HashMap();
var mapFunc2Systems  = new java.util.HashMap();

//init
var queryComponent = Context.getComponent("QueryComponent");
var queryContext = queryComponent.getQueryContext(ArisData.getActiveDatabase(), Context.getFile("ea_unit_system.xml",Constants.LOCATION_SCRIPT));

var queryUnit = queryContext.createQuery("orgUnit", "children(name), name, positions(name, functions(name)), roles(name, functions(name)), functions(name), systems(name)");
var queryFunc = queryContext.createQuery("function", "children(name), name, systems(name)");

executeQueryUnit(queryUnit);
executeQueryFunc(queryFunc);

const outputParameters = new OutputParameters("");
const output = createXmlOutput(outputParameters);
outHeader();

main();

uploadXmlOutputToADS(output, outputParameters);

/*************************************************************************************************/

function main() {
    var it = mapFunc2Systems.keySet().iterator();
    while (it.hasNext()) {
        var funcOID = it.next();
        var aSystemOIDs = pickSystemsOfFunc(funcOID, new java.util.HashSet());
        
        mapFunc2Systems.put(funcOID, aSystemOIDs);
    }            

    it = mapUnit2Systems.keySet().iterator();
    while (it.hasNext()) {
        var unitOID = it.next();
        var aSystemOIDs = pickSystemsOfUnit(unitOID, new java.util.HashSet());
        
        for (var i in aSystemOIDs) {
            outData(unitOID, aSystemOIDs[i]);
        }
    }            
}

function pickSystemsOfFunc(funcOID, setDoneFuncs) {
    if (setDoneFuncs.add(funcOID)) {
        var aSystemOIDs = getSystemOIDs(funcOID);
        
        var aChildOIDs = mapFunc2Children.get(funcOID);
        if (aChildOIDs != null) {
        
            for (var i in aChildOIDs) {
                var sChildOID = aChildOIDs[i];
                aSystemOIDs = concatValues( aSystemOIDs, pickSystemsOfFunc(sChildOID, setDoneFuncs) );
            }
        }
        return aSystemOIDs;
    }
    return [];
    
    function getSystemOIDs(funcOID) {
        var aSystemOIDs = mapFunc2Systems.get(funcOID);
        if (aSystemOIDs == null) return [];
        return aSystemOIDs;
    }      
}

function pickSystemsOfUnit(unitOID, setDoneUnits) {
    if (setDoneUnits.add(unitOID)) {
        var aSystemOIDs = concatValues( getSystemOIDs(unitOID), getFuncSystemOIDs(unitOID) );
        
        var aChildOIDs = mapUnit2Children.get(unitOID);
        if (aChildOIDs != null) {
        
            for (var i in aChildOIDs) {
                var sChildOID = aChildOIDs[i];
                aSystemOIDs = concatValues( aSystemOIDs, pickSystemsOfUnit(sChildOID, setDoneUnits) );
            }
        }
        return aSystemOIDs;
    }
    return [];
    
    function getSystemOIDs(unitOID) {
        var aSystemOIDs = mapUnit2Systems.get(unitOID);
        if (aSystemOIDs == null) return [];
        return aSystemOIDs;
    }      

    function getFuncSystemOIDs(unitOID) {
        var aFuncOIDs = mapUnit2Funcs.get(unitOID);
        if (aFuncOIDs == null) return [];
        
        var aSystemOIDs = new Array();
        for (var i in aFuncOIDs) {
            var aFuncSystemOIDs = mapFunc2Systems.get(aFuncOIDs[i]);
            if (aFuncOIDs != null) {
                aSystemOIDs = concatValues( aSystemOIDs, aFuncSystemOIDs );
            }            
        }
        return aSystemOIDs;
    } 
}

function executeQueryUnit(queryUnit) {
    var resultList = queryUnit.execute();    
    resultList.loadAll();

    for (var i=0; i<resultList.size(); i++) {
        var result = resultList.get(i);
        var unitOID = result.getId();
        
        var aChildOIDs  = getOIDsFromInnerList(result, "children");
        var aSystemOIDs = getOIDsFromInnerList(result, "systems");
        
        addMapEntry(mapUnit2Children, unitOID, aChildOIDs);
        addMapEntry(mapUnit2Systems, unitOID, aSystemOIDs);
        
        var aRoleFuncOIDs = getOIDsFromInnerList2(result, "roles", "functions");
        var aPosFuncOIDs = getOIDsFromInnerList2(result, "positions", "functions");

        addMapEntry(mapUnit2Funcs, unitOID, aRoleFuncOIDs);
        addMapEntry(mapUnit2Funcs, unitOID, aPosFuncOIDs);
    }
}

function executeQueryFunc(queryFunc) {
    var resultList = queryFunc.execute();    
    resultList.loadAll();
    
    for (var i=0; i<resultList.size(); i++) {
        var result = resultList.get(i);
        var funcOID = result.getId();
        
        var aChildOIDs  = getOIDsFromInnerList(result, "children");
        var aSystemOIDs = getOIDsFromInnerList(result, "systems");

        addMapEntry(mapFunc2Children, funcOID, aChildOIDs);
        addMapEntry(mapFunc2Systems, funcOID, aSystemOIDs);
    }
}

function getOIDsFromInnerList(result, property) {
    var aOIDs = new Array();
    var resultList = result.getProperty(property).getResultList();
    for (var i=0; i<resultList.size(); i++) {
        
        aOIDs.push(resultList.get(i).getId());
    }
    return aOIDs;
}

function getOIDsFromInnerList2(result, property, property2) {
    var aOIDs = new Array();
    var resultList = result.getProperty(property).getResultList();
    for (var i=0; i<resultList.size(); i++) {
        var resultList2 = resultList.get(i).getProperty(property2).getResultList();
        for (var j=0; j<resultList2.size(); j++) {
            
            aOIDs.push(resultList2.get(j).getId());
        }
    }
    return aOIDs;
}

function addMapEntry(map, key, aValues) {
    var aOldValues =  map.get(key);
    if (aOldValues != null) {
        aValues = concatValues(aValues, aOldValues);
    }
    map.put(key, aValues);
}

function concatValues(aValues, aOldValues) {
    // Concats arrays of OIDs (= strings)
    for (var i in aOldValues) {
        value = aOldValues[i];
        if (isValueInList(value, aValues)) continue;

        aValues.push(value);
    }
    return aValues;
    
    function isValueInList(value, aValues) {
        for (var i in aValues) {
            // Comparison of OIDs (= strings)
            if (StrComp(value, aValues[i]) == 0) return true;
        }
        return false;
    }
}

function outHeader() {
    output.setColumns([["Unit",        "text"],
                       ["Unit-Guid",   "text"],
                       ["System",      "text"],
                       ["System-Guid", "text"]]);    
}

function outData(unitOID, systemOID) {
    var oUnit = getItemByOID(unitOID);
    var oSystem = getItemByOID(systemOID);
    if (oUnit == null || oSystem == null) return;
    
    output.addRow([oUnit.Name(nLoc),
                   oUnit.GUID(),
                   oSystem.Name(nLoc),
                   oSystem.GUID()]);
    
    function getItemByOID(sOID) {
        var oItem = oDB.FindOID(sOID);
        if (oItem.IsValid()) return oItem;
        return null;
    }
}
