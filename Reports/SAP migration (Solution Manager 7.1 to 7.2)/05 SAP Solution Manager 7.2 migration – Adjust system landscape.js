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

var bAutoTouch = false;         // true: Date of last change is changed (= Standard behaviour)     
                                // false: Models get not touched -> Date of last change is not changed

/************************************************************************************************************************************/

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

function TYPE_COMP(sGuid, sSapID, sLogComp) {
    this.sGuid    = sGuid;      // Guid
    this.sSapID   = sSapID;     // Mapped SAP ID
    this.sLogComp = sLogComp;   // SAP component
}

if ( checkEntireMethod() ) {
    
    var oDB_SM71 = ArisData.getActiveDatabase();    // Active database which gets migrated (SM71)
    var oDB_SM72 = getSM72Database();               // Reference database (SM72)
    
    var SAPLogin = getSAPLogin();                   // Get SAP login data
    
    if (!bAutoTouch) oDB_SM71.setAutoTouch(false);  // No touch !!!
    
    var oOut;
    if (oDB_SM72 != null && SAPLogin != null) { 
        oOut = Context.createOutputObject();
        initOutput(oOut);
        
        // Update process steps, master data and org units
        var oTestStepDefs71 = new Array();   // Array of process steps with TCE marker which couldn't be update in following step
        var mapLogComps = updateProcessSteps_MasterData_OrgUnits(oTestStepDefs71);
        if (mapLogComps != null) {  // *** Otherwise error in SAP connection ***
            
            outMapLogComps(mapLogComps);
            
            // Update system landscape
            updateSystemLandscapes(mapLogComps);    
            
            var sDefaultLogComp = null;     // Default logical component - determined supsequently by user (via dialog) if needed
             
            // Update screens
            sDefaultLogComp = updateScreens(mapLogComps, sDefaultLogComp);
            
            // Update test steps (= process steps with TCE marker which couldn't be update in above)
            updateTestSteps(oTestStepDefs71, mapLogComps, sDefaultLogComp);
            
            oOut.WriteReport();    
        }
        oDB_SM72.close();
    }
}

/************************************************************************************************************************************/

function updateProcessSteps_MasterData_OrgUnits(oTestStepDefs) {
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    outHeader();    

    var aObjDefEntries71 = getObjDefs71();      // [TYPE_COMP(Guid, Mapped SAP ID, Log.Component)]
    if (aObjDefEntries71 == null) return null;  // *** Error in SAP connection ***
        
    var mapSrcIDs72  = getSourceIDs72();        // Map: Source ID -> Log.Component
    
    var mapLogComps = new java.util.HashMap();  // Map: Log.Component(SM71) -> Log.Component(SM72)
    
    for (var i in aObjDefEntries71) {
        var bUpdated = false;
        var sErrorText = "";
        
        var sLogComp71 = "";
        var sLogComp72 = "";

        var tEntry71 = aObjDefEntries71[i];   
        
        var sGuid = tEntry71.sGuid;
        var oObjDef = oDB_SM71.FindGUID(sGuid, Constants.CID_OBJDEF);
        if (oObjDef.IsValid()) {
            var sSapID = tEntry71.sSapID;
            
            sLogComp71 = tEntry71.sLogComp;
            sLogComp72 = mapSrcIDs72.get(sSapID);       // Mapping: SAP ID (SM71) = Source ID (SM72)
            
            if (sLogComp72 != null) {
                bUpdated =  setLogComp(oObjDef, sLogComp72);
                if (bUpdated) {
                    
                    sErrorText = updateMapLogComps(mapLogComps, oObjDef, sLogComp71, sLogComp72);
                    bUpdated = (sErrorText == "");
                    
                } else { sErrorText = formatstring1(getString("ERROR_MSG_UPDATE_LOGCOMP"), sLogComp72) }
            } else { 
                if (isTestStep(oObjDef)) {

                    oTestStepDefs.push(oObjDef);        // Object is process step with TCE marker -> will be updated later...
                    continue;

                } else { sErrorText = formatstring1(getString("ERROR_MSG_SOURCEID_NOT_FOUND"), sSapID) }
            } 
        } else         { sErrorText = formatstring1(getString("ERROR_MSG_GUID_NOT_FOUND"), sGuid) } 
        
        outData(oObjDef, sLogComp71, (sLogComp72!=null)?sLogComp72:"", bUpdated, sErrorText);
    }
    oOut.EndTable(getString("SHEETNAME_OBJECTS"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
    return mapLogComps;
    
    function isTestStep(oObjDef) {
        // Object is a function, is a process step and is a test object
        return oObjDef.TypeNum() == Constants.OT_FUNC && checkSapType(oObjDef, Constants.AVT_SOLAR_PROCESS_STEP) && isTestItem(oObjDef);
    }
    
    function updateMapLogComps(mapLogComps, oObjDef, sLogComp71, sLogComp72) {
        if (oObjDef.TypeNum() != Constants.OT_FUNC) {
            var sOldLogComp = mapLogComps.get(sLogComp71);
            if (sOldLogComp != null) {
                var sErrorText = "";
                if ( StrComp(sOldLogComp, sLogComp72) != 0 ) {
                    sErrorText = formatstring1(getString("ERROR_MSG_WRONG_LOGCOMP"), sOldLogComp);
                }
                return sErrorText;
            }
        }
        mapLogComps.put(sLogComp71, sLogComp72);
        return "";
    }  
}

function updateSystemLandscapes(mapLogComps) {
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    outHeader();    

    var oAstDefs71 = getSystemApplTypes(oDB_SM71); 
    var oAstDefs72 = getSystemApplTypes(oDB_SM72);
    
    for (var i in oAstDefs71) {
        var bUpdated = false;
        var sErrorText = "";
        
        var oAstDef71 = oAstDefs71[i];
        var sLogComp71 = getLogCompViaSapAreaID(oAstDef71);
        var sLogComp72 = mapLogComps.get(sLogComp71);
        if (sLogComp72 != null) {
            var oAstDef72 = getObjDefByLogComp(sLogComp72, oAstDefs72);
            if (oAstDef72 != null) {
                bUpdated = copyAttrs(oAstDef72/*Reference*/, oAstDef71/*To be changed*/);
                if (bUpdated) {
                } else { sErrorText = getString("ERROR_MSG_UPDATE_ATTRS") }
            } else {     sErrorText = formatstring1(getString("ERROR_MSG_SYSTEM_NOT_FOUND"), sLogComp72) }
        } else {         sErrorText = formatstring1(getString("ERROR_MSG_LOGCOMP_NOT_MAPPED"), sLogComp71) }

        outData(oAstDef71, sLogComp71, (sLogComp72!=null)?sLogComp72:"", bUpdated, sErrorText);
    }
    oOut.EndTable(getString("SHEETNAME_SYSTEMS"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

    function getLogCompViaSapAreaID(oItem) {
        var sSapAreaID = ""+oItem.Attribute(Constants.AT_SOLAR_AREA_ID, nLoc).getValue();     //SAP area ID
        var nIndex = sSapAreaID.indexOf(":");
        if (nIndex >= 0) return sSapAreaID.substr(0, nIndex);
        return "";
    }

    function getObjDefByLogComp(sLogComp72, oObjDefs) {
        for (var i in oObjDefs) {
            var oObjDef = oObjDefs[i];
            if ( StrComp(sLogComp72, getLogCompViaSapAreaID(oObjDef)) == 0 ) return oObjDef;
        }
        return null;
    }    
}

function updateTestSteps(oTestStepDefs71, mapLogComps, sDefaultLogComp) {
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    outHeader();    

    updateLogicalComponents(oTestStepDefs71, mapLogComps, sDefaultLogComp);
    
    oOut.EndTable(getString("SHEETNAME_UNMAPPEDSTEPS"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}

function updateScreens(mapLogComps, sDefaultLogComp) {
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    outHeader();    
    
    prepareUrlScreens(oDB_SM71);

    var oScreenDefs71 = searchScreenDefs(oDB_SM71);
    var sDefaultLogComp = updateLogicalComponents(oScreenDefs71, mapLogComps, sDefaultLogComp);

    oOut.EndTable(getString("SHEETNAME_SCREENS"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
    return sDefaultLogComp;
}

function updateLogicalComponents(oObjDefs71, mapLogComps, sDefaultLogComp) {
    for (var i in oObjDefs71) {
        var bUpdated = false;
        var sErrorText = "";
        
        var oObjDef71 = oObjDefs71[i];
        var sLogComp71 = getLogComp(oObjDef71);
        var sLogComp72 = getLogComp72(sLogComp71, mapLogComps);
        if (sLogComp72 != null) {
            
            bUpdated = setLogComp(oObjDef71, sLogComp72);
            if (bUpdated) {
            } else { sErrorText = formatstring1(getString("ERROR_MSG_UPDATE_LOGCOMP"), sLogComp72) }            
        } else {     sErrorText = formatstring1(getString("ERROR_MSG_LOGCOMP_NOT_MAPPED"), sLogComp71) }

        outData(oObjDef71, sLogComp71, (sLogComp72!=null)?sLogComp72:"", bUpdated, sErrorText);
    }
    return sDefaultLogComp;

    function getLogComp72(sLogComp71, mapLogComps) {
        if (sLogComp71 != "") {
            return mapLogComps.get(sLogComp71);
        }
        // Logical component not maintained            
        if (sDefaultLogComp == null) {
            sDefaultLogComp = getDefaultLogicalComponent(mapLogComps);  // Show dialog to select default log comp
        }
        return sDefaultLogComp;
    }
}

function prepareUrlScreens(oDB) {
    var oScreenDefs = searchUrlScreenDefs(oDB);
    for (var i in oScreenDefs) {
        var oScreenDef = oScreenDefs[i];
        var sLogComp = getLogComp(oScreenDef);
        if (sLogComp != "") continue;

        updateLogComp(oScreenDef);
    }
    
    function updateLogComp(oScreenDef) {
        var oProcStepDef = null;
        var oScreenOccs = oScreenDef.OccList();
        for (var i in oScreenOccs) {
            var oModel = oScreenOccs[i].Model();
            if (oModel.OrgModelTypeNum() != Constants.MT_FUNC_ALLOC_DGM) continue;
            
            oProcStepDef = getProcStep(oModel);
            if (oProcStepDef != null) {
                setLogComp(oScreenDef, getLogComp(oProcStepDef));
                break;
            }        
        }
        if (oProcStepDef == null) {
            outData(oScreenDef, "", "", false, getString("ERROR_MSG_URL_SCREEN_NOT_ASSIGNED"));
        }

        function getProcStep(oModel) {
            var oFuncDefs = oModel.ObjDefListByTypes([Constants.OT_FUNC]);
            for (var i in oFuncDefs) {
                var oFuncDef = oFuncDefs[i];
                if (oFuncDef.Attribute(Constants.AT_SAP_FUNC_TYPE, nLoc).MeasureUnitTypeNum() ==Constants.AVT_SOLAR_PROCESS_STEP) return oFuncDef
            }
            return null;
        }
    }
}

function getSystemApplTypes(oDB) {
    var oAstDefs = new Array();
    
    var oProjectDefs = searchProjectDefs(oDB);
    for (var i in oProjectDefs) {
        var oAssignedFadModels = oProjectDefs[i].AssignedModels(extendModelTypes([Constants.MT_FUNC_ALLOC_DGM]));
        for (var j in oAssignedFadModels) {
            oAstDefs = oAstDefs.concat( oAssignedFadModels[j].ObjDefListByTypes([Constants.OT_APPL_SYS_TYPE]) );
        }
    }
    return oAstDefs;
}

function getObjDefs71() {
    var aObjDefEntries71 = new Array();

    var oObjDefs = searchObjects(oDB_SM71, false/*bCheckSrcID*/);
    var mapSapIDs = getSapIDMapping(oObjDefs, SAPLogin);
    
    if (mapSapIDs == null) return null;   // *** Error in SAP connection ***
    
    for (var i in oObjDefs) {
        var oObjDef = oObjDefs[i];
        var sMappedSapID = getMappedSapID(getSapID(oObjDef), mapSapIDs)
        aObjDefEntries71.push(new TYPE_COMP(oObjDef.GUID(), sMappedSapID, getLogComp(oObjDef))); 
    }
    return aObjDefEntries71;
}

function getSourceIDs72() {
    var map = new java.util.HashMap();
    
    var oObjDefs = searchObjects(oDB_SM72, true/*bCheckSrcID*/);
    for (var i in oObjDefs) {
        var oObjDef = oObjDefs[i];
        map.put(getSrcID(oObjDef), getLogComp(oObjDef));
    }
    return map;
}

function searchObjects(oDB, bCheckSrcID) {
    var aObjDefs = searchProcessSteps(oDB, bCheckSrcID);
    aObjDefs = aObjDefs.concat(searchMasterData(oDB, bCheckSrcID));
    aObjDefs = aObjDefs.concat(searchOrgUnits(oDB, bCheckSrcID));
    return aObjDefs;    
}

function searchProcessSteps(oDB, bCheckSrcID) {
    var searchItemA = getSearchItem(oDB, Constants.AT_SAP_FUNC_TYPE, Constants.AVT_SOLAR_PROCESS_STEP); // Sap function type = 'Processs step'    
    var searchItemB = getSearchItem(oDB, Constants.AT_SAP_ID2, null);                                   // SAP ID maintained
    var searchItemC = getSearchItem(oDB, Constants.AT_SOLAR_SOURCE_ID, null);                           // Source ID maintained (SM72 only)
    
    var searchItem = searchItemA.and(searchItemB);
    if (bCheckSrcID) searchItem = searchItem.and(searchItemC);
    return oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_FUNC], searchItem);
}

function searchMasterData(oDB, bCheckSrcID) {
    var nAttrType = (bCheckSrcID) ? Constants.AT_SOLAR_SOURCE_ID : Constants.AT_SAP_ID2;                // SAP ID / Source ID
    var searchItem = getSearchItem(oDB, nAttrType, null);
    return oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_ENT_TYPE], searchItem);                      // Entity type
}

function searchOrgUnits(oDB, bCheckSrcID) {
    var nAttrType = (bCheckSrcID) ? Constants.AT_SOLAR_SOURCE_ID : Constants.AT_SAP_ID2;                // SAP ID / Source ID
    var searchItem = getSearchItem(oDB, nAttrType, null);
    return oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_SYS_ORG_UNIT_TYPE], searchItem);             // System organizational unit type
}

function searchProjectDefs(oDB) {
    var searchItem = getSearchItem(oDB, Constants.AT_SAP_FUNC_TYPE, Constants.AVT_SOLAR_PROJECT);       // Sap function type = 'Project'    
    return oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_FUNC], searchItem);
}

function searchScreenDefs(oDB) {
    return oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_SCRN]);
}

function searchUrlScreenDefs(oDB) {
    var searchItemA = getSearchItem(oDB, Constants.AT_SOLAR_TRANSACTION_TYPE, Constants.AVT_LONG_URL);                   // Long URL
    var searchItemB = getSearchItem(oDB, Constants.AT_SOLAR_TRANSACTION_TYPE, Constants.AVT_SOLAR_PREDEFINED_URL);       // Predefined URLs from directory
    var searchItemC = getSearchItem(oDB, Constants.AT_SOLAR_TRANSACTION_TYPE, Constants.AVT_SOLAR_SAP_URL_APPLICATION);  // SAP URL application
    
    return oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_SCRN], searchItemA.or(searchItemB).or(searchItemC));
}

function getDefaultLogicalComponent(mapLogComps) {
    var aLogComps72 = getLogComps72(mapLogComps);

    return Dialogs.showDialog(new myDialog(), Constants.DIALOG_TYPE_ACTION, getString("DLG_TITLE"));    
    
    function myDialog() {
        var bDialogOk = true;
        
        // returns DialogTemplate[] (see help) or the dialog XML ID
        // non-optional
        this.getPages = function() {
            var iDialogTemplate = Dialogs.createNewDialogTemplate(400, 200, "");
            iDialogTemplate.Text(10, 12, 400, 45, getString("DLG_TEXT"));  
            iDialogTemplate.ComboBox(10, 55, 220, 15, aLogComps72, "COMBOBOX_LOGCOMP");
            
            return [iDialogTemplate];
        }
        
        // mandatory
        this.isInValidState = function(pageNumber) {
            return true;
        }
        
        //optional - called after ok/finish has been pressed and the current state data has been applied
        this.onClose = function(pageNumber, bOk) {
            bDialogOk = bOk;
        }        
        
        // optional - the result of this function is returned as result of Dialogs.showDialog(). Can be any object.
        this.getResult = function() {
            if (bDialogOk) {
                var page = this.dialog.getPage(0);
                return aLogComps72[page.getDialogElement("COMBOBOX_LOGCOMP").getSelectedIndex()]
            }
            return "";
        }
    }
    
    function getLogComps72(mapLogComps) {
        var aLogComps72 = new Array();
        var iter = mapLogComps.keySet().iterator();
        while (iter.hasNext()) {
            var sLogComp71 = iter.next();
            var sLogComp72 = mapLogComps.get(sLogComp71);
            aLogComps72.push(sLogComp72);
        }
        return aLogComps72;
    }    
}

/************************************************************************************************************************************/
// Output

function outHeader() {
    oOut.TableRow();
    oOut.TableCellF(getString("NAME"),        40, "HEAD");
    oOut.TableCellF(getString("TYPE"),        40, "HEAD");
    oOut.TableCellF(getString("SEARCHID"),    50, "HEAD");
    oOut.TableCellF(getString("OLD_LOGCOMP"), 45, "HEAD");
    oOut.TableCellF(getString("NEW_LOGCOMP"), 45, "HEAD");
    oOut.TableCellF(getString("RESULT"),      60, "HEAD");
}

function outData(oObjDef, sOldLogComp, sNewLogComp, bResult, sErrorText) {
    var styleSheet = bResult ? "STD" : "RED";
    oOut.TableRow();
    oOut.TableCellF(outName(oObjDef),               40, styleSheet);
    oOut.TableCellF(outType(oObjDef),               40, styleSheet);
    oOut.TableCellF(outSearchID(oObjDef),           50, styleSheet);
    oOut.TableCellF(sOldLogComp,                    45, styleSheet);
    oOut.TableCellF(sNewLogComp,                    45, styleSheet);
    oOut.TableCellF(outResult(bResult, sErrorText), 60, styleSheet);
}

function outMapLogComps(mapLogComps) {
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    oOut.TableRow();
    oOut.TableCellF(getString("OLD_LOGCOMP"), 45, "HEAD");
    oOut.TableCellF(getString("NEW_LOGCOMP"), 45, "HEAD");
    
    var iter = mapLogComps.keySet().iterator();
    while (iter.hasNext()) {
        var sLogComp71 = iter.next();
        var sLogComp72 = mapLogComps.get(sLogComp71);
        
        oOut.TableRow();
        oOut.TableCellF(sLogComp71, 45, "STD");
        oOut.TableCellF(sLogComp72, 45, "STD");
    }
    oOut.EndTable(getString("SHEETNAME_LOGCOMP"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}