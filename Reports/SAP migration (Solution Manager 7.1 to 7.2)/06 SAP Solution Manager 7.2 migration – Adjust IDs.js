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

function TYPE_SRCID(sGuid, sSapID) {
    this.sGuid  = sGuid;
    this.sSapID = sSapID;
    this.bUpdated = false;
}

function TYPE_MISSING_SRCID(sSrcID, sGuid) {
    this.sSrcID = sSrcID;
    this.sGuid  = sGuid;
}

if ( checkEntireMethod() ) {
    
    var oDB_SM71 = ArisData.getActiveDatabase();        // Active database which gets migrated (SM71)
    var oDB_SM72 = getSM72Database();                   // Reference database (SM72)
    
    var SAPLogin = getSAPLogin();                       // Get SAP login data
    
    if (!bAutoTouch) oDB_SM71.setAutoTouch(false);      // No touch !!!
    
    var g_sSynchProject72 = null;
    
    var oOut;
    if (oDB_SM72 != null && SAPLogin != null) { 
        oOut = Context.createOutputObject();
        initOutput(oOut);   
        
        if ( updateProjectIDs()) {
        
            var objectSapIDMapping71 = getSapIDMapping( searchAllObjects(oDB_SM71, Constants.AT_SAP_ID2), SAPLogin );               // Map: SAP ID -> Mapped SAP ID
            var modelSapIDMapping71  = getSapIDMapping( searchModels(oDB_SM71, Constants.AT_SAP_ID2), SAPLogin );                   // Map: SAP ID -> Mapped SAP ID
            var testSrcIDMapping71   = getTestSrcIDMapping( searchAllObjects(oDB_SM71, Constants.AT_SOLAR_TEST_SRC_ID), SAPLogin ); // Map: Test source ID -> Mapped SAP ID
            
            if (objectSapIDMapping71 != null && modelSapIDMapping71 != null) {  // Otherwise error in SAP connection
                var aMissingSrcIDs = new Array();

                updateObjectSapID(objectSapIDMapping71, aMissingSrcIDs, [Constants.OT_FUNC], Constants.AVT_SCEN );               // Update Scenarios
                updateObjectSapID(objectSapIDMapping71, aMissingSrcIDs, [Constants.OT_FUNC], Constants.AVT_PROC_1 );             // Update Processes
                updateObjectSapID(objectSapIDMapping71, aMissingSrcIDs, [Constants.OT_FUNC], Constants.AVT_SOLAR_PROCESS_STEP ); // Update Processs steps
                updateObjectSapID(objectSapIDMapping71, aMissingSrcIDs, [Constants.OT_ENT_TYPE], null );                         // Update Master data (Entity type)
                updateObjectSapID(objectSapIDMapping71, aMissingSrcIDs, [Constants.OT_SYS_ORG_UNIT_TYPE] ,null );                // Update Org Units (System organizational unit type)
            
                updateModelSapID(modelSapIDMapping71);                                                                           // Update models

                if (testSrcIDMapping71 != null) {   // BLUE-13910
                    updateTestSourceID(testSrcIDMapping71);                                                                      // Update test source IDs
                }
                outMissingSourceIDs(aMissingSrcIDs);
                
                outMapSapIDs(objectSapIDMapping71, getString("SHEETNAME_MAPPED_OBJECT_SAPIDS"));
                outMapSapIDs(modelSapIDMapping71, getString("SHEETNAME_MAPPED_MODEL_SAPIDS"));

                if (testSrcIDMapping71 != null) {   // BLUE-13910
                    outMapSapIDs(testSrcIDMapping71,   getString("SHEETNAME_MAPPED_TESTSOURCEIDS"));
                }                            
                oOut.WriteReport();
            }
        }
    }
}

/************************************************************************************************************************************/

function updateObjectSapID(sapIDMapping71, aMissingSrcIDs, aObjTypes, nSapType) {
    var mapSapIDs71 = getMap71_SapID(searchObjects(oDB_SM71, Constants.AT_SAP_ID2, aObjTypes, nSapType));          // Map: SAP ID -> Array(Guid)
    var mapSrcIDs72 = getMap72_SrcID(searchObjects(oDB_SM72, Constants.AT_SOLAR_SOURCE_ID, aObjTypes, nSapType));  // Map: Source ID -> Array(TYPE_SRCID(Guid, SAP ID, update-flag))

    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    outHeader();    
    
    var iter = mapSapIDs71.keySet().iterator();
    while (iter.hasNext()) {
        var bDone = false;
        var sErrorText = "";
         
        var sSapID = iter.next();
        var aGuids = mapSapIDs71.get(sSapID);
        
        var sMappedSapID = getMappedSapID(sSapID, sapIDMapping71);
        if (sMappedSapID != null) {
            
            var aEntries72 = mapSrcIDs72.get(sMappedSapID);            
            if (aEntries72 != null) {
                bDone = true;
                var aGuids_NotYetDone = updateGuids_Step1(aGuids, aEntries72);
                updateGuids_Step2(aGuids_NotYetDone, aEntries72);
                
            } else { sErrorText = formatstring1(getString("ERROR_MSG_SOURCEID_NOT_FOUND"), sMappedSapID) }
        } else {     sErrorText = formatstring1(getString("ERROR_MSG_SAPID_NOT_MAPPED"), sSapID) }

        if (!bDone) {
            for (var i in aGuids) {
                var oObjDef71 = oDB_SM71.FindGUID(aGuids[i], Constants.CID_OBJDEF);
                if (isTestItem(oObjDef71)) {
                    
                    deleteSapID(oObjDef71);         // Delete SAP ID of test objects
                    deleteSyncProject(oObjDef71);   // Delete SAP Origin of test objects
                    
                    outData(oObjDef71, sSapID, "", false, sErrorText + "\n" + getString("MSG_SAPID_DELETED"));
                    
                } else { outData(oObjDef71, sSapID, "", false, sErrorText) }
            }            
        }
    }
    oOut.EndTable(getFooter(), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    getMissingSrcIDs(mapSrcIDs72, aMissingSrcIDs);
    
    function getMissingSrcIDs(mapSrcIDs72, aMissingSrcIDs) {
        var bFirst = true;
        var iter = mapSrcIDs72.keySet().iterator();
        while (iter.hasNext()) {
            var sSrcID = iter.next();
            var aEntries72 = mapSrcIDs72.get(sSrcID);
            for (var i in aEntries72) {
                tEntry72 = aEntries72[i];
                if (!tEntry72.bUpdated) aMissingSrcIDs.push(new TYPE_MISSING_SRCID(sSrcID, tEntry72.sGuid));
            }
        }
    }

    function updateGuids_Step1(aGuids, aEntries72) {
        var aGuids_NotYetDone = new Array();
        var oOriginDef71 = getOriginDef71(aGuids);

        // Update origin object
        for (var i in aGuids) {
            var sGuid = aGuids[i];
            var oObjDef71 = oDB_SM71.FindGUID(sGuid, Constants.CID_OBJDEF);
            if (oObjDef71.IsEqual(oOriginDef71)) {
                
                var sInfoText = (aGuids.length == 1) ? getString("INFO_MSG_SINGLE") : getString("INFO_MSG_ORIGINAL");
                var bDone = doUpdateMatching(oObjDef71, aEntries72, sInfoText);
                if (!bDone) aGuids_NotYetDone.push(sGuid);
                break;
            }
        }
        // Update others (= shortcuts)
        for (var i in aGuids) {
            var sGuid = aGuids[i];
            var oObjDef71 = oDB_SM71.FindGUID(sGuid, Constants.CID_OBJDEF);
            if (oObjDef71.IsEqual(oOriginDef71)) continue;  // Origin object already mapped (see above)

            var bDone = doUpdateMatching(oObjDef71, aEntries72, getString("INFO_MSG_SHORTCUT"));
            if (!bDone) aGuids_NotYetDone.push(sGuid);
        }
        return aGuids_NotYetDone;
        
        function doUpdateMatching(oObjDef71, aEntries72, sInfoText) {
            var bDone = false;
            var tEntry72 = getMatchingEntry(oObjDef71, aEntries72);
            if (tEntry72 != null) {
                bDone = true;
                if (doUpdateSapID(oObjDef71, tEntry72.sSapID, sInfoText)) tEntry72.bUpdated = true;
            }
            return bDone;
        }
    }
    
    function updateGuids_Step2(aGuids_NotYetDone, aEntries72) {
        //Update guids which couldn't be updated in step1
        for (var i in aGuids_NotYetDone) {
            var bDone = false;
            var sGuid = aGuids_NotYetDone[i];	// Bugfix SR5
            var oObjDef71 = oDB_SM71.FindGUID(sGuid, Constants.CID_OBJDEF);
            
            for (var i in aEntries72) {
                tEntry72 = aEntries72[i];
                if (tEntry72.bUpdated) continue;
                
                bDone = true;
                if (doUpdateSapID(oObjDef71, tEntry72.sSapID, getString("INFO_MSG_NOTYETDONE"))) {
                    tEntry72.bUpdated = true;
                    break;
                }
            }
            if (!bDone) outData(oObjDef71, sSapID, "", false, getString("ERROR_MSG_NO_FURTHER_SAPID"));
        }
    }
    
    function getMatchingEntry(oObjDef71, aEntries72) {
        if (checkSapType(oObjDef71, Constants.AVT_SCEN)) {
            for (var i in aEntries72) {
                tEntry72 = aEntries72[i];
                if (!tEntry72.bUpdated) return tEntry72;
            }
        } else {
            var oParent71 = getParent(oObjDef71);
            if (oParent71 != null) {
                for (var i in aEntries72) {
                    tEntry72 = aEntries72[i];
                    if (tEntry72.bUpdated) continue;
                    
                    var oObjDef72 = oDB_SM72.FindGUID(tEntry72.sGuid, Constants.CID_OBJDEF);
                    var oParent72 = getParent(oObjDef72);
                    if (oParent72 != null) {
                        if (StrComp(getSapID(oParent71), getSapID(oParent72)) == 0) return tEntry72;
                    }
                }
            }
        }
        return null;
    }        
    
    function getOriginDef71(aGuids) {
        var oOriginDef = oDB_SM71.FindGUID(aGuids[0], Constants.CID_OBJDEF);
        for (var i=1; i<aGuids.length; i++) {
            var oObjDef = oDB_SM71.FindGUID(aGuids[i], Constants.CID_OBJDEF);
            if (isOlder(oObjDef, oOriginDef)) oOriginDef = oObjDef;
        }
        return oOriginDef;
        
        function isOlder(oItem1, oItem2) { return oItem1.Attribute(Constants.AT_CREAT_TIME_STMP, nLoc).getValueGMT0()  < oItem2.Attribute(Constants.AT_CREAT_TIME_STMP, nLoc).getValueGMT0() }
    }
            
    function getFooter() {
        var sFooter = oFilter.ObjTypeName(aObjTypes[0]);
        if (nSapType != null) sFooter = oFilter.AttrValueType(Constants.AT_SAP_FUNC_TYPE, nSapType);
        return sFooter;
    }   
}

function updateModelSapID(sapIDMapping71) {
    var mapSapIDs71 = getMap71_SapID(searchModels(oDB_SM71, Constants.AT_SAP_ID2));               // Map: SAP ID -> Array(Guid)
    var mapSrcIDs72 = getMap72_SrcID(searchAllObjects(oDB_SM72, Constants.AT_SOLAR_SOURCE_ID));   // Map: Source ID -> Array(Guid) (Objects !!!)

    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    outHeader();    
   
    var iter = mapSapIDs71.keySet().iterator();
    while (iter.hasNext()) {
        var sSapID = iter.next();
        var aGuids = mapSapIDs71.get(sSapID);
        
        for (var i in aGuids) {     
            var sGuid = aGuids[i];
            var oModel71 = oDB_SM71.FindGUID(sGuid, Constants.CID_MODEL);
            
            if (oModel71.TypeNum() == Constants.MT_SOLAR_ORG_ELEM_MAP_CUST_TO_SAP) {
                // Ignore models of type 'SAP Solutions organizational elements mapping'
                continue;
            }
            
            var parentObjDef71 = getParentObject(oModel71)
            if (parentObjDef71 != null) {

                var sNewSapID = getSapID(parentObjDef71);
                doUpdateSapID(oModel71, sNewSapID, getString("INFO_MSG_SAPID_FROM_PARENT"));
            } else {
                var bDone = false;                
                var sErrorText = "";
                
                sMappedSapID = getMappedSapID(oModel71, sapIDMapping71);
                if (sMappedSapID != null) {
                    var aEntries72 = mapSrcIDs72.get(sMappedSapID);
                    if (aEntries72 != null) {
                        bDone = true;
                        var tEntry72 = aEntries72[0];
                        var sNewSapID = tEntry72.sSapID;
                        doUpdateSapID(oModel71, sNewSapID, "");
                        
                    } else { sErrorText = formatstring1(getString("ERROR_MSG_SOURCEID_NOT_FOUND"), sMappedSapID) }
                } else {     sErrorText = formatstring1(getString("ERROR_MSG_SAPID_NOT_MAPPED"), sSapID) }
                
                if (!bDone) {
                    if (isTestModel(oModel71)) {
                        // Delete SAP ID of test model
                        deleteSapID(oModel71);
                        sErrorText += "\n" + getString("MSG_SAPID_DELETED");
                    }
                    outData(oModel71, sSapID, "", false, sErrorText);
                }    
            }
        }
    }
    oOut.EndTable(getString("SHEETNAME_MODELS"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
    function isTestModel(oModel) {
        if (isTestItem(oModel)) return true;
        
        if (oModel71.OrgModelTypeNum() == Constants.MT_FUNC_ALLOC_DGM) {
            var oParentDefs = oModel.SuperiorObjDefs();
            for (var i in oParentDefs) {
                var oParentDef = oParentDefs[i];
                if (oParentDef.TypeNum() == Constants.OT_FUNC && isTestItem(oParentDef) && getSapID(oParentDef) == "") {
                    // Parent object is a function, is a test object and has no SAP ID
                    return true;
                }
            }
        }
        return false;
    }    
}

function updateTestSourceID(sapIDMapping71) {
    var mapTestSrcIDs71 = getMap71_TestSrcID(searchAllObjects(oDB_SM71, Constants.AT_SOLAR_TEST_SRC_ID));   // Map: Test source ID -> Array(Guid)
    var mapSrcIDs72     = getMap72_SrcID(searchAllObjects(oDB_SM72, Constants.AT_SOLAR_SOURCE_ID));         // Map: Source ID -> Array(Guid) (Objects !!!)

    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    outHeader();    
   
    var iter = mapTestSrcIDs71.keySet().iterator();
    while (iter.hasNext()) {
        var sTestSrcID = iter.next();
        var aGuids = mapTestSrcIDs71.get(sTestSrcID);

        for (var i in aGuids) {
            var bDone = false;                
            var sErrorText = "";
            
            var sGuid = aGuids[i];
            var oObjDef71 = oDB_SM71.FindGUID(sGuid, Constants.CID_OBJDEF);
            
            var sMappedSapID = getMappedSapID(sTestSrcID, sapIDMapping71);
            if (sMappedSapID != null) {
                var aEntries72 = mapSrcIDs72.get(sMappedSapID);            
                if (aEntries72 != null) {
                    bDone = true;
                    var tEntry72 = aEntries72[0];
                    var sNewTestSrcID = tEntry72.sSapID;
                    doUpdateTestSourceID(oObjDef71, sNewTestSrcID, "");

                } else { sErrorText = formatstring1(getString("ERROR_MSG_SOURCEID_NOT_FOUND"), sMappedSapID) }
            } else {     sErrorText = formatstring1(getString("ERROR_MSG_TESTSOURCEID_NOT_MAPPED"), sTestSrcID) }
            
            if (!bDone) { outData(oObjDef71, sTestSrcID, "", false, sErrorText) }
        }                
    }
    oOut.EndTable(getString("SHEETNAME_TESTSOURCEIDS"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}

function doUpdateSapID(oItem71, sNewSapID, sInfoText) {
    var sOldSapID = getSapID(oItem71);
    var bUpdated = setSapID(oItem71, sNewSapID);

    var sText = bUpdated ? sInfoText : formatstring1(getString("ERROR_MSG_UPDATE_SAPID"), sNewSapID);
    outData(oItem71, sOldSapID, sNewSapID, bUpdated, sText);
    
    if (oItem71.KindNum() == Constants.CID_OBJDEF) {
        // Update synchronization project
        updateSyncProject(oItem71);
        
        // Delete SAP area ID (BLUE-13962)
        deleteAreaID(oItem71);
    }
    return bUpdated;
    
    function deleteAreaID(oItem) { return oItem.Attribute(Constants.AT_SOLAR_AREA_ID, nLoc).Delete() }
}

function doUpdateTestSourceID(oItem71, sNewTestSrcID, sInfoText) {
    var sOldTestSrcID = getTestSrcID(oItem71);
    var bUpdated = setTestSrcID(oItem71, sNewTestSrcID);

    var sText = bUpdated ? sInfoText : formatstring1(getString("ERROR_MSG_UPDATE_TESTSOURCEID"), sNewSapID);
    outData(oItem71, sOldTestSrcID, sNewTestSrcID, bUpdated, sText);

    return bUpdated;
}

function getParent(oObjDef) {
    var oOccList = oObjDef.OccList();
    for (var i in oOccList) {
        var oModel = oOccList[i].Model();
        if (checkSapType(oModel, getParentSapType(oObjDef))) {
            var oParentObjDef = getParentObject(oModel);
            if (oParentObjDef != null) {
                return oParentObjDef;
            }
        }
    }
    return null;
    
    function getParentSapType(oItem) {
        // Functions
        if (checkSapType(oItem, Constants.AVT_PROC_1))              return Constants.AVT_SCEN;      // Process -> Scenario  
        if (checkSapType(oItem, Constants.AVT_SOLAR_PROCESS_STEP))  return Constants.AVT_PROC_1;    // Processs step -> Process
        // Master data
        if (oItem.TypeNum() == Constants.OT_ENT_TYPE)               return Constants.AVT_SCEN;      // Master data -> Scenario  
        // Org Unit
        if (oItem.TypeNum() == Constants.OT_SYS_ORG_UNIT_TYPE)      return Constants.AVT_SCEN;      // Org Unit -> Scenario  
        return null;
    }
}

function getParentObject(oModel) {
   var oSupObjDefs = oModel.SuperiorObjDefs();
   for (var i in oSupObjDefs) {
       var oObjDef = oSupObjDefs[i];
       if (checkSapType(oObjDef, getSapType(oModel))) return oObjDef;
   }
   return null;
}

function outMissingSourceIDs(aMissingSrcIDs) {
    if (aMissingSrcIDs.length == 0) return;

    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    outHeader();
    
    for (var i in aMissingSrcIDs) {
        var sSrcID = aMissingSrcIDs[i].sSrcID;
        var item = oDB_SM72.FindGUID(aMissingSrcIDs[i].sGuid, Constants.CID_OBJDEF);
        outData(item, "", getSapID(item), false, formatstring1(getString("ERROR_MSG_SOURCEID_NOT_MAPPED"), sSrcID));
    }
    oOut.EndTable(getString("SHEETNAME_MISSING_SOURCEIDS"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}

function updateProjectIDs() {
    var bOk = true;
    try {
        var oProjectDef72     = getProjectDefs(oDB_SM72)[0];
        var oProjectModel72   = getAssignedProjectModel(oProjectDef72);
        var oBusProcDef72     = getBusProcDef(oProjectModel72);
        var oProcStepLibDef72 = getProcStepLibDef(oProjectModel72);
        
        g_sSynchProject72 = getSyncProject(oProjectDef72);
        
        var oProjectDefs71 = getProjectDefs(oDB_SM71);
        for (var i in oProjectDefs71) {
            var oProjectDef71 = oProjectDefs71[i];
            
            if ( !isSapProject(oProjectDef71) && checkTCEMarker(oProjectDef71) ) {          // BLUE-13897 Additional check of TCE marker
                setSyncProject(oProjectDef71, buildTestSyncProject(g_sSynchProject72));
            } else {
                
                setSyncProject(oProjectDef71, g_sSynchProject72);
            
                var oProjectModel71 = getAssignedProjectModel(oProjectDef71);
                if (oProjectModel71 == null) continue;
            
                copyAttrs(oProjectDef72/*Reference*/, oProjectDef71/*To be changed*/);
                copyConfiguration(oProjectDef72/*Reference*/, oProjectDef71/*To be changed*/)       // Copy attr "Configuration"
                setSapID(oProjectModel71, getSapID(oProjectDef71));
        
                var oBusProcDef71 = getBusProcDef(oProjectModel71);
                setSapID(oBusProcDef71, getSapID(oBusProcDef72));
                setSyncProject(oBusProcDef71, g_sSynchProject72);
                
                var oFolderModel71 = getAssignedFolderModel(oBusProcDef71);
                setSapID(oFolderModel71, getSapID(oBusProcDef71));
                
                var oProcStepLibDef71 = getProcStepLibDef(oProjectModel71);
                setSapID(oProcStepLibDef71, getSapID(oProcStepLibDef72));
                setSyncProject(oProcStepLibDef71, g_sSynchProject72);
            }
        }
    } catch(ex) {
        showErrorMessage(formatstring1(getString("ERROR_MSG_UPDATE_PROJECTIDS"), ex.message));
        bOk = false;
    }
    return bOk;
     
    function getBusProcDef(oProjectModel)     { return getFuncDefWithSapType(oProjectModel, Constants.AVT_SM72_FOLDER) }
    function getProcStepLibDef(oProjectModel) { return getFuncDefWithSapType(oProjectModel, Constants.AVT_SM72_STEP_REPOSITORY_FOLDER) }

    function getFuncDefWithSapType(oProjectModel, nSapType) {
        var oFuncDefs = oProjectModel.ObjDefListByTypes([Constants.OT_FUNC]);
        for (var i in oFuncDefs) {
            var oFuncDef = oFuncDefs[i];
            if (checkSapType(oFuncDef, nSapType)) return oFuncDef;
        }
        return null;
    }

    function getAssignedProjectModel(oObjDef) { return getAssignedModelWithSapType(oObjDef, Constants.AVT_SOLAR_PROJECT) }
    function getAssignedFolderModel(oObjDef)  { return getAssignedModelWithSapType(oObjDef, Constants.AVT_SM72_FOLDER) }
    
    function getAssignedModelWithSapType(oObjDef, nSapType) {
        var oAssignedModels = oObjDef.AssignedModels( g_aModelTypes_EPC.concat(g_aModelTypes_VACD, g_aModelTypes_BPMN) );
        for (var i in oAssignedModels) {
            var oAssignedModel = oAssignedModels[i];
            if (checkSapType(oAssignedModel, nSapType)) return oAssignedModel;
        }
        return null;
    }

    function getProjectDefs(oDB) {
        var sProject = oFilter.AttrValueType(Constants.AT_SAP_FUNC_TYPE, Constants.AVT_SOLAR_PROJECT) // = 'Project'
        var searchItem = oDB.createSearchItem(Constants.AT_SAP_FUNC_TYPE, nLoc, sProject, Constants.SEARCH_CMP_EQUAL, true/*bCaseSensitive*/, false/*bAllowWildcards*/);
        
        return oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_FUNC], searchItem);
    }                      
}

function copyConfiguration(oItemSrc/*Reference*/, oItemTrg/*To be changed*/) {
    return copyAttr(oItemSrc, oItemTrg, Constants.AT_SOLAR_CONFIGURATION);      // Configuration (3448)
}

function updateSyncProject(oItem71) {
    if (isTestItem(oItem71)) {
        setSyncProject(oItem71, buildTestSyncProject(g_sSynchProject72));
    } else {
        setSyncProject(oItem71, g_sSynchProject72);
    }
     
}

function updateTestSourceIDs(mapSM71SapID, mapSM72SourceID) {
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    outHeader();        

    var iter = mapSM71SapID.keySet().iterator();
    while (iter.hasNext()) {
        var bUpdated = false;
        var sErrorText = "";
      
        var sSapID = "";
        var sMappedSapID = "";
        var sNewSapID = "";
        
        var sGuid = iter.next();
        var item = oDB_SM71.FindGUID(sGuid, Constants.CID_OBJDEF);
        if (item.IsValid()) {
            var tEntry71 = mapSM71SapID.get(sGuid);
            sSapID = tEntry71.sSapID;
            sMappedSapID = tEntry71.sMappedSapID;
            if (sMappedSapID != null) {
                var aEntries72 = mapSM72SourceID.get(sMappedSapID);
                if (aEntries72 != null) {
                    for (var i in aEntries72) {
                        tEntry72 = aEntries72[i];
                        var sNewSapID = tEntry72.sSapID;
                        bUpdated = setTestSrcID(item, sNewSapID);
                    }
                }
            }
        }
        outData(item, sSapID, sNewSapID, bUpdated, sErrorText);
    }
    oOut.EndTable(getString("SHEETNAME_TESTSOURCEIDS"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}

function searchAllObjects(oDB, nAttrType) {
    var aObjDefs = new Array();
    aObjDefs = aObjDefs.concat( searchObjects(oDB, nAttrType, [Constants.OT_FUNC], Constants.AVT_SCEN) );               // Scenario
    aObjDefs = aObjDefs.concat( searchObjects(oDB, nAttrType, [Constants.OT_FUNC], Constants.AVT_PROC_1) );             // Process
    aObjDefs = aObjDefs.concat( searchObjects(oDB, nAttrType, [Constants.OT_FUNC], Constants.AVT_SOLAR_PROCESS_STEP) ); // Processs step
    aObjDefs = aObjDefs.concat( searchObjects(oDB, nAttrType, [Constants.OT_ENT_TYPE], null) );                         // Master data (Entity type)
    aObjDefs = aObjDefs.concat( searchObjects(oDB, nAttrType, [Constants.OT_SYS_ORG_UNIT_TYPE] ,null) );                // Org Unit (System organizational unit type)
    return aObjDefs;    
}

function searchObjects(oDB, nAttrType, aObjTypes, nSapType) {
    var searchItem = getSearchItem(oDB, nAttrType, null);                               // SAP ID / Source ID
    if (nSapType != null) {
        var searchItem2 = getSearchItem(oDB, Constants.AT_SAP_FUNC_TYPE, nSapType);     // Scenario / Process / Process step
        searchItem = searchItem.and(searchItem2);
    }
    return oDB.Find(Constants.SEARCH_OBJDEF, aObjTypes, searchItem);
}

function searchModels(oDB, nAttrType) {
    var searchItem = getSearchItem(oDB, nAttrType, null);            // SAP ID / Source ID
    return oDB.Find(Constants.SEARCH_MODEL, null, searchItem);
}

function getMap71_SapID(itemList)     { return getMap71(itemList, true/*bSapID*/) }     // Map SAP IDs
function getMap71_TestSrcID(itemList) { return getMap71(itemList, false/*bSapID*/) }    // Map Test source IDs

function getMap71(itemList, bSapID) {
    var map = new java.util.HashMap();
    
    for (var i in itemList) {
        var item = itemList[i];
        var sSapID = bSapID ? getSapID(item) : getTestSrcID(item);      // Get SAP ID resp. test source ID
        
        var arr = map.containsKey(sSapID) ? map.get(sSapID) : [];
        arr.push(item.GUID());        
        map.put(sSapID, arr);
    }
    return map;
}


function getMap72_SrcID(itemList) {
    var map = new java.util.HashMap();
    
    for (var i in itemList) {
        var item = itemList[i];
        var sSrcID = getSrcID(item);
        
        var arr = map.containsKey(sSrcID) ? map.get(sSrcID) : [];
        arr.push(new TYPE_SRCID(item.GUID(), getSapID(item)));        
        map.put(sSrcID, arr);
    }
    return map;
}

/************************************************************************************************************************************/
// Output

function outHeader() {
    oOut.TableRow();
    oOut.TableCellF(getString("NAME"),      40, "HEAD");
    oOut.TableCellF(getString("TYPE"),      40, "HEAD");
    oOut.TableCellF(getString("SEARCHID"),  50, "HEAD");
    oOut.TableCellF(getString("OLD_SAPID"), 45, "HEAD");
    oOut.TableCellF(getString("NEW_SAPID"), 45, "HEAD");
    oOut.TableCellF(getString("RESULT"),    60, "HEAD");
}

function outData(item, sOldSapID, sNewSapID, bResult, sErrorText) {
    var styleSheet = bResult ? "STD" : "RED";
    oOut.TableRow();
    oOut.TableCellF(outName(item),                  40, styleSheet);
    oOut.TableCellF(outType(item),                  40, styleSheet);
    oOut.TableCellF(outSearchID(item),              50, styleSheet);
    oOut.TableCellF(outID(sOldSapID),               45, styleSheet);
    oOut.TableCellF(outID(sNewSapID),               45, styleSheet);
    oOut.TableCellF(outResult(bResult, sErrorText), 60, styleSheet);
}

function outMapSapIDs(sapIDMapping, sSheetname) {
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    oOut.TableRow();
    oOut.TableCellF(getString("SAPID"), 50, "HEAD");
    oOut.TableCellF(getString("SAPID_MAPPED"), 50, "HEAD");
    
    var iter = sapIDMapping.keySet().iterator();
    while (iter.hasNext()) {
        var sSapID = iter.next();
        var sMappedSapID = getMappedSapID(sSapID, sapIDMapping)
        if (sMappedSapID != null) {
            oOut.TableRow();
            oOut.TableCellF(sSapID, 50, "STD");
            oOut.TableCellF(sMappedSapID, 50, "STD");
        }
    }
    oOut.EndTable(sSheetname, 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}
