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

var MAX_RANK = 10;

var nLoc = Context.getSelectedLanguage();
var oDB = ArisData.getActiveDatabase();

const outputParameters = new OutputParameters("");
const output = createXmlOutput(outputParameters);

outHeader();
main();
uploadXmlOutputToADS(output, outputParameters);

/*************************************************************************************************/

function SUPPORTS(oVacdModel, nCount) {
    this.oVacdModel = oVacdModel;
    this.nCount = nCount;
    this.sRank = 0;
}

function main() {
    var mapSystemSupports = new java.util.HashMap();    // Map: System -> VACD|Number of supported functions
    var mapVacdFunctions = getVacdFunctions();          // Map: VACD -> Belonging functions (= Functions in assigned EPCs)

    var oSystemDefs = oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_APPL_SYS_TYPE]);    
    for (var i in oSystemDefs) {
        var oSystemDef = oSystemDefs[i];
        
        var aSupports = getSupportsData(oSystemDef, mapVacdFunctions);
        if (aSupports.length > 0) {
            mapSystemSupports.put(oSystemDef, setRank(aSupports));
        }
    }
    outData(mapSystemSupports);
}

function getSupportsData(oSystemDef, mapVacdFunctions) {
    var aSupports = new Array();

    var oSuppFuncDefs = oSystemDef.getConnectedObjs([Constants.OT_FUNC], Constants.EDGES_OUT, [Constants.CT_CAN_SUPP_1]);
    if (oSuppFuncDefs.length > 0) {

        var iter = mapVacdFunctions.keySet().iterator();
        while (iter.hasNext()) {
            var nCount = 0;
            
            var oVacdModel = iter.next();
            var setFunctionDefs = mapVacdFunctions.get(oVacdModel);
            
            for (var j in oSuppFuncDefs) {
                if (setFunctionDefs.contains(oSuppFuncDefs[j])) nCount++;
            }
            if (nCount > 0) {
                aSupports.push(new SUPPORTS(oVacdModel, nCount));
            }
        }
    }
    return aSupports;
}

function setRank(aSupports) {
    aSupports = aSupports.sort(sortCount);
    var idx = Math.min(MAX_RANK, aSupports.length);
    
    for (var i in aSupports) {
        if (idx > 0) {
            aSupports[i].sRank = get2Digits(idx);
        }
        idx--;
    }
    return aSupports;
    
    function get2Digits(n){
        return (n > 9) ? "" + n : "0" + n;
    }    
    
    function sortCount(suppA, suppB) {
        return suppB.nCount - suppA.nCount; // sort descending
    }
}

function getVacdFunctions() {
    var mapVacdFunctions = new java.util.HashMap();

    var oVacdModels = oDB.Find(Constants.SEARCH_MODEL, [Constants.MT_VAL_ADD_CHN_DGM]);
    for (var i in oVacdModels) {
        var oVacdModel = oVacdModels[i];
    
        var oFuncDefs = new Array();
        getFunctionsOfModel(oVacdModel, oFuncDefs);
        
        if (oFuncDefs.length > 0) {
            mapVacdFunctions.put(oVacdModel, getSetFromArray(oFuncDefs));
        }
    }
    return mapVacdFunctions;
    
    function getFunctionsOfModel(oModel, p_oAllFuncDefs) {
        var oFuncDefs = oModel.ObjDefListByTypes([Constants.OT_FUNC]);
        for (var i in oFuncDefs) {
            var oFuncDef = oFuncDefs[i];
            if (isInList(oFuncDef, p_oAllFuncDefs)) continue;
            
            if (oModel.TypeNum() == Constants.MT_EEPC) {
                p_oAllFuncDefs.push(oFuncDef);  // Add only functions of (assigned) EPC models
            }
            var oAssignedEpcModels = oFuncDef.AssignedModels([Constants.MT_EEPC]);
            for (var j in oAssignedEpcModels) {
                
                getFunctionsOfModel(oAssignedEpcModels[j], p_oAllFuncDefs);
            }
        }
        
        function isInList(oObjDef, oObjDefList) {
            for (var i in oObjDefList) {
                if (oObjDefList[i].IsEqual(oObjDef)) return true;
            }
            return false;
        }
    }
    
    function getSetFromArray(aArray) {
        var set = new java.util.HashSet();
        for (var i in aArray) {
            set.add(aArray[i])
        }
        return set;
    }
}

function outHeader() {
   output.setColumns([["System", "text"],
                      ["SystemGuid", "text"],
                      ["SuppVacd", "text"],
                      ["SuppVacdGuid", "text"],
                      ["SuppCount", "number"],
                      ["Rank", "text"]]);
}

function outData(mapSystemSupports) {
    var iter = mapSystemSupports.keySet().iterator();
    while (iter.hasNext()) {
        var oSystemDef = iter.next();
        var aSupports = mapSystemSupports.get(oSystemDef);
        for (var i in aSupports) {

            output.addRow([oSystemDef.Name(nLoc),
                           oSystemDef.GUID(),
                           aSupports[i].oVacdModel.Name(nLoc),
                           aSupports[i].oVacdModel.GUID(),
                           aSupports[i].nCount,
                           aSupports[i].sRank]);
        }
    }
}


