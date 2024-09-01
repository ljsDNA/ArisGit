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

var sBusinessProcess = "Business Processes";
var sProcessStepLib  = "Process Step Library";
                                
/************************************************************************************************************************************/

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

if ( checkEntireMethod() ) {
    
    var oDB_SM71 = ArisData.getActiveDatabase();        // Active database which gets migrated (SM71)
    var oDB_SM72 = getSM72Database();                   // Reference database (SM72)
    
    var SAPLogin = getSAPLogin();                       // Get SAP login data
    
    if (!bAutoTouch) oDB_SM71.setAutoTouch(false);      // No touch !!!
    
    var oOut;
    if (oDB_SM72 != null && SAPLogin != null) { 
        oOut = Context.createOutputObject();

        initOutput(oOut);
        oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
        outHeader();
        
        var oSapProjectDefs     = getSapProjectDefs();                      // SAP type = "Project" + Synch. project = "PROJECT_SYNC:..."
        var oTestProjectDefs    = getTestProjectDefs();                     // SAP type = "Project" + Synch. project = "TEST_PROJECT_SYNC:..." + TCE marker
        var oIntTestProjectDefs = getIntegratedTestProjectDefs();           // SAP type = "Project" + Synch. project = "PROJECT_SYNC:..." + TCE marker
        
        var oBusProcRootModels = updateSapProjects(oSapProjectDefs);        // Update SAP projects
      
        updateTestProjects(oTestProjectDefs, oBusProcRootModels);           // Update Test projects
        
        updateIntegrationProjects(oIntTestProjectDefs, oBusProcRootModels); // Update integration test projects

        for (var j in oBusProcRootModels) {
            oBusProcRootModels[j].changeFlag(Constants.MODEL_LAYOUTONOPEN, true);
        }
        oOut.EndTable(getString("PROTOCOL"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        oOut.WriteReport();
    }
}

/************************************************************************************************************************************/

function updateSapProjects(oSapProjectDefs) {
    var oBusProcRootModels = new Array();
    
    for (var i in oSapProjectDefs) {
        var oProjectDef = oSapProjectDefs[i];
        var oOldProjectModel = getAssignedProjectModel(oProjectDef);
        if (oOldProjectModel == null) continue;
        
        oProjectDef.DeleteAssignment(oOldProjectModel);
        setSapType(oOldProjectModel, Constants.AVT_SM72_FOLDER);        // Change SAP type: Project -> Folder
        // Step 1 - Create new project model
        var oGroup = oOldProjectModel.Group();
        var oNewProjectModel = createNewProjectModel(oGroup, oOldProjectModel, oProjectDef);
        if (oNewProjectModel == null) continue;
        
        setSapType(oNewProjectModel, Constants.AVT_SOLAR_PROJECT);  // Set SAP type: Project
        if (!createAssignment(oProjectDef, oNewProjectModel)) bResult = false;
    
        outData(oProjectDef, oNewProjectModel, getString("STEP1_MODEL_CREATED"), true, "");
        
        // Step 2 - Create objects 'Business Processes' and 'Process Step Library'
        var bResult = true;
        var oBusProcDef = createFuncDef(oGroup, sBusinessProcess);
        if (oBusProcDef != null) {
            setSapType(oBusProcDef, Constants.AVT_SM72_FOLDER);     // Set SAP type: Folder
    
            var oBusProcOcc = createFuncOcc(oNewProjectModel, oBusProcDef);       
            if (oBusProcOcc == null) bResult = false;
        } else bResult = false;
        
        var oProcStepLibDef = createFuncDef(oGroup, sProcessStepLib);
        if (oProcStepLibDef != null) {
            setSapType(oProcStepLibDef, Constants.AVT_SM72_STEP_REPOSITORY_FOLDER);  // Set SAP type: Step repository folder
    
            var oProcStepLibOcc = createFuncOcc(oNewProjectModel, oProcStepLibDef);
            if (oProcStepLibOcc == null) bResult = false;
        } else bResult = false;
    
        if (bResult) {
            outData(oProjectDef, oNewProjectModel, getString("STEP2_OBJECTS_CREATED"), true, "");
        }
        
        // Step 3 - Assign scenarios to 'Business Processes'
        if (oBusProcDef != null) {
            if (createAssignment(oBusProcDef, oOldProjectModel)) {
                
                oOldProjectModel.Attribute(Constants.AT_NAME, nLoc).setValue(sBusinessProcess); // Overwrite model name
                oOldProjectModel.Attribute(Constants.AT_SAP_ID2, nLoc).Delete();                // Delete SAP ID (will be updated with report 'SM72 Migration – Adjust Ids')

                oBusProcRootModels.push(oOldProjectModel);
                
                outData(oProjectDef, oNewProjectModel, getString("STEP3_SCEANRIOS_ASSIGNED"), true, "");
            }
        }
        oNewProjectModel.changeFlag(Constants.MODEL_LAYOUTONOPEN, true);
    }
    return oBusProcRootModels;
}

function updateTestProjects(oTestProjectDefs, oBusProcRootModels) {
    for (var i in oTestProjectDefs) {
        var oProjectDef = oTestProjectDefs[i];
        setTCEProfile(oProjectDef);
        
        updateSapID(oProjectDef);

        deleteFADAssignment(oProjectDef);
        adaptSapType(oProjectDef, Constants.AVT_SM72_FOLDER);     // Set SAP type of object and assigned model: Folder

        var oProjectDef72 = getProjectDef72();
        if (oProjectDef72 != null) {
            var sTestSyncProject = buildTestSyncProject(getSyncProject(oProjectDef72));
            setSyncProject(oProjectDef, sTestSyncProject);            
        }
        
        for (var j in oBusProcRootModels) {
            createFuncOcc(oBusProcRootModels[j], oProjectDef);
        }
        outData(oProjectDef, getSingleBusProcRootModel(), getString("STEP4_TESTPROJECT_ASSIGNED"), true, "");
    }
    
    function updateSapID(oProjectDef) {
        var oFolderModel71 = getAssignedIntegrationModel(oProjectDef);
        if (oFolderModel71 != null) {
            var oFolderDef72 = getScenarioFolder72(oFolderModel71);
            if (oFolderDef72 != null) {
                // Set SAP ID of migrated tes project root
                return setSapID(oProjectDef, getSapID(oFolderDef72));
            }
        }
        return deleteSapID(oProjectDef);
    }
    
    function getProjectDef72() {
        var sProject = oFilter.AttrValueType(Constants.AT_SAP_FUNC_TYPE, Constants.AVT_SOLAR_PROJECT) // = 'Project'
        var searchItem = oDB_SM72.createSearchItem(Constants.AT_SAP_FUNC_TYPE, nLoc, sProject, Constants.SEARCH_CMP_EQUAL, true/*bCaseSensitive*/, false/*bAllowWildcards*/);
        var oProjectDefs72 = oDB_SM72.Find(Constants.SEARCH_OBJDEF, [Constants.OT_FUNC], searchItem);
        if (oProjectDefs72.length > 0) return oProjectDefs72[0];
        return null;
    }
    
    function deleteFADAssignment(oProjectDef) {
        var oAssignedFadModels = oProjectDef.AssignedModels( extendModelTypes([Constants.MT_FUNC_ALLOC_DGM]) );
        for (var i in oAssignedFadModels) {
            oProjectDef.DeleteAssignment(oAssignedFadModels[i]);
        }
    }
    
    function adaptSapType(oObjDef, nSapType) {
        setSapType(oObjDef, nSapType);
        
        var oAssignedModels = oObjDef.AssignedModels();
        for (var i in oAssignedModels) {
            var oAssignedModel = oAssignedModels[i];
            if (checkTCEMarker(oAssignedModel)) {
                setSapType(oAssignedModel, nSapType);   // set SAP type of assigned model
            }
        }
    }
}

function updateIntegrationProjects(oIntTestProjectDefs, oBusProcRootModels) {
    for (var i in oIntTestProjectDefs) {
        var oProjectDef = oIntTestProjectDefs[i];
        var oIntegrationModel = getAssignedIntegrationModel(oProjectDef);
        if (oIntegrationModel == null) continue;
        
        deleteTCEProfile(oProjectDef);
        deleteTCEMarker(oProjectDef);
        
        var oCustFolderDef72 = getCustomerFolder72(oIntegrationModel);
        if (oCustFolderDef72 != null) {
            // Create customer folder
            var oCustFolderDef71 = getOrCreateCustomerFolder71(oCustFolderDef72, oIntegrationModel.Group());
            if (oCustFolderDef71 != null) {
                // Change assignment
                oProjectDef.DeleteAssignment(oIntegrationModel);
                createAssignment(oCustFolderDef71, oIntegrationModel);
                
                setSapType(oIntegrationModel, Constants.AVT_SM72_FOLDER);     // Set SAP type of integration model: Folder
                
                setTCEProfile(oCustFolderDef71);
                setTCEMarker(oCustFolderDef71); 
                
                var sTestSyncProject = buildTestSyncProject(getSyncProject(oCustFolderDef71));
                setSyncProject(oCustFolderDef71, sTestSyncProject); 

                for (var j in oBusProcRootModels) {
                    getOrCreateFuncOcc(oBusProcRootModels[j], oCustFolderDef71);
                }                
            }
        }
        outData(oProjectDef, getSingleBusProcRootModel(), getString("STEP5_INTEGRATIONPROJECT_ASSIGNED"), true, "");   
    }
    
    function getCustomerFolder72(oIntegrationModel) { return getScenarioFolder72(oIntegrationModel) }
    
    function getOrCreateCustomerFolder71(oFolderDef72, oGroup) {
        var sSapID = getSapID(oFolderDef72);
        var oFolderDefs71 = oDB_SM71.Find(Constants.SEARCH_OBJDEF, Constants.AT_SAP_ID2, nLoc, sSapID, Constants.SEARCH_CMP_CASESENSITIVE | Constants.SEARCH_CMP_EQUAL);
        if (oFolderDefs71.length > 0) {
            return oFolderDefs71[0];
        }
        var oFolderDef71 = createFuncDef(oGroup, oFolderDef72.Name(nLoc));
        if (oFolderDef71 != null) copyAttrs(oFolderDef72/*Reference*/, oFolderDef71/*To be changed*/);
        return oFolderDef71;
    }
    
    function getOrCreateFuncOcc(oModel, oObjDef) {
        var oOccList = oObjDef.OccListInModel(oModel);
        if (oOccList.length > 0) return oOccList[0];
        
        return createFuncOcc(oModel, oObjDef); 
    }
}


function getScenarioFolder72(oModel71) {
    var mapSM72SourceID = getMap72( searchScenarios(oDB_SM72, Constants.AT_SOLAR_SOURCE_ID) );  // Map: Source ID -> Guid
    
    var oFolderDefs72 = new Array();
    
    var oScenarioDefs71 = getScenarioDefs(oModel71);
    if (oScenarioDefs71.length == 0) return null;
    
    var mapSapIDs = getSapIDMapping(oScenarioDefs71, SAPLogin);
    if (mapSapIDs == null) return null;   // *** Error in SAP connection ***
    
    var oScenarioDefs72 = new Array();
    for (var i in oScenarioDefs71) {
        var sErrorText = "";
        
        var oScenarioDef71 = oScenarioDefs71[i];
        var sMappedSapID = getMappedSapID(getSapID(oScenarioDef71), mapSapIDs);
        if (sMappedSapID != null) {
            var sGuid72 = mapSM72SourceID.get(sMappedSapID);
            if (sGuid72 != null) {
                var oScenarioDef72 = oDB_SM72.FindGUID(sGuid72, Constants.CID_OBJDEF);
                if (oScenarioDef72.IsValid()) {
                    oScenarioDefs72.push(oScenarioDef72);
                }
                } else { sErrorText = formatstring1(getString("ERROR_MSG_SOURCEID_NOT_FOUND"), sMappedSapID) }
            } else {     sErrorText = formatstring1(getString("ERROR_MSG_SAPID_NOT_MAPPED"), sSapID) }
            
            if (sErrorText != "") outData(oScenarioDef71, oModel71, "", false, sErrorText);
    }
    
    for (var i in oScenarioDefs72) {
        var oScenarioOccs = oScenarioDefs72[i].OccList();
        for (var j in oScenarioOccs) {
            var oModel = oScenarioOccs[j].Model();
            if (!checkSapType(oModel, Constants.AVT_SM72_FOLDER)) continue;
            
            var oSuperiorObjDefs = oModel.SuperiorObjDefs();
            for (var k in oSuperiorObjDefs) {
                var oObjDef = oSuperiorObjDefs[k];
                if (oObjDef.TypeNum() != Constants.OT_FUNC) continue;
                if (!checkSapType(oObjDef, Constants.AVT_SM72_FOLDER)) continue;
                
                oFolderDefs72.push(oObjDef);
            }
        }
    }
    oFolderDefs72 = ArisData.Unique(oFolderDefs72);
    if (oFolderDefs72.length == 0) return null;
    
    if (oFolderDefs72.length > 1) {
        var sErrorText = getString("ERROR_MSG_MULTIPLE_FOLDERS");
        outData(null, oModel71, "", false, sErrorText);
    }
    return oFolderDefs72[0];
}

function getScenarioDefs(oModel) {
    var oScenarioDefs = new Array();
    var oFuncDefs = oModel.ObjDefListFilter(Constants.OT_FUNC);
    for (var i in oFuncDefs) {
        var oFuncDef = oFuncDefs[i];
        if (checkSapType(oFuncDef, Constants.AVT_SCEN/*Scenario*/)) oScenarioDefs.push(oFuncDef);
    }
    return oScenarioDefs;
}

function getSingleBusProcRootModel() {
    if (oBusProcRootModels.length == 1) return oBusProcRootModels[0];
    return null;
}

function setTCEMarker(oItem)    { oItem.Attribute(Constants.AT_SAP_ID/*External ID*/, nLoc).setValue(c_TCEMarker) }
function deleteTCEMarker(oItem) { oItem.Attribute(Constants.AT_SAP_ID/*External ID*/, nLoc).Delete() }

function setTCEProfile(oItem) {
    var sTCEProfile = ":profil:SM72:/profil::level:3:/level::supModels:273%272%140%246%247%12%13%134%:/supModels::supFunctions:829%284%1117%1657%1119%1656%1118%575%574%1344%512%1120%1388%1389%1390%772%1384%1385%1386%1387%1383%1621%1622%538%71%76%77%78%72%73%895%84%869%83%82%335%1066%1064%374%584%585%1063%105%1320%1323%1325%355%1221%1217%141%1218%1479%1478%1477%1476%1475%398%1484%1483%1482%1481%1480%1526%1532%1535%1509%1510%1266%907%1267%904%903%902%901%1513%1515%1514%896%738%1432%1408%456%1419%455%715%984%511%719%978%230%979%229%228%982%227%983%980%981%975%720%1214%1213%964%:/supFunctions::moveLevel:false:/moveLevel::modelSymbolMatrix:0%13%829%1%13%829%2%13%829%3%13%829%:/modelSymbolMatrix::projectType:3:/projectType:";
    oItem.Attribute(Constants.AT_TCE_PROJ_PROPS, nLoc).setValue(sTCEProfile);
}

function deleteTCEProfile(oItem) { oItem.Attribute(Constants.AT_TCE_PROJ_PROPS, nLoc).Delete() }

function getSapProjectDefs()  {
    // SAP type = "Project" + Synch. project = "PROJECT_SYNC:..."                
    var oSapProjectDefs = new Array();
    var oProjectDefs = getProjectDefs();
    for (var i in oProjectDefs) {
        var oProjectDef = oProjectDefs[i];
        if ( isSapProject(oProjectDef) ) {
            oSapProjectDefs.push(oProjectDef);
        }
    }
    return oSapProjectDefs;
}

function getTestProjectDefs()  {
    // SAP type = "Project" + Synch. project = "TEST_PROJECT_SYNC:..." + TCE marker
    var oTestProjectDefs = new Array();
    var oProjectDefs = getProjectDefs();
    for (var i in oProjectDefs) {
        var oProjectDef = oProjectDefs[i];
        if ( !isSapProject(oProjectDef) && checkTCEMarker(oProjectDef) ) {
            oTestProjectDefs.push(oProjectDef);
        }
    }
    return oTestProjectDefs;
}

function getIntegratedTestProjectDefs()  {
    // SAP type = "Project" + Synch. project = "PROJECT_SYNC:..." + TCE marker
    var oIntTestProjectDefs = new Array();
    var oSapProjectDefs = getSapProjectDefs();
    for (var i in oSapProjectDefs) {
        var oProjectDef = oSapProjectDefs[i];
        if ( checkTCEMarker(oProjectDef) ) {
            oIntTestProjectDefs.push(oProjectDef);
        }
    }
    return oIntTestProjectDefs;
}

function getProjectDefs() {
    var sProject = oFilter.AttrValueType(Constants.AT_SAP_FUNC_TYPE, Constants.AVT_SOLAR_PROJECT) // = 'Project'
    var searchItem = oDB_SM71.createSearchItem(Constants.AT_SAP_FUNC_TYPE, nLoc, sProject, Constants.SEARCH_CMP_EQUAL, true/*bCaseSensitive*/, false/*bAllowWildcards*/);
    return oDB_SM71.Find(Constants.SEARCH_OBJDEF, [Constants.OT_FUNC], searchItem);
}

function getAssignedProjectModel(oObjDef)     { return getAssignedModelByType(oObjDef, Constants.AVT_SOLAR_PROJECT/*Project*/) }
function getAssignedIntegrationModel(oObjDef) { return getAssignedModelByType(oObjDef, Constants.AVT_INTEGR/*Integration*/) }
    
function getAssignedModelByType(oObjDef, nSapType) {    
    var oAssignedModels = oObjDef.AssignedModels( g_aModelTypes_EPC.concat(g_aModelTypes_VACD, g_aModelTypes_BPMN) );
    for (var i in oAssignedModels) {
        var oAssignedModel = oAssignedModels[i];
        if (checkSapType(oAssignedModel, nSapType)) return oAssignedModel;
    }
    return null;
}

function createNewProjectModel(oGroup, oOldProjectModel, oProjectDef) {
     var oNewProjectModel = oGroup.CreateModel(oOldProjectModel.TypeNum(), getName(oOldProjectModel), nLoc);
     if (oNewProjectModel.IsValid()) {
         return oNewProjectModel;
     }
     outData(oProjectDef, null, "", false, getString("ERROR_MSG_CREATE_MODEL"))
     return null;         
}

function createAssignment(oObjDef, oModel) {
    var result = oObjDef.CreateAssignment(oModel, false/*bPlaceOccAccordingToMethod*/);
    if (!result) {
        outData(null, null, "", false, formatstring2(getString("ERROR_MSG_ASSIGN_MODEL"), getName(oModel), getName(oObjDef)));
    }
    return result;
}

function createFuncOcc(oModel, oObjDef) {
    var nSymbolNum = getDefaultFunctionSymbol(oModel);
    if (nSymbolNum != null) {
        var oObjOcc = oModel.createObjOcc(nSymbolNum, oObjDef, 0, 0, true);
        oObjDef.SetDefaultSymbolNum(nSymbolNum, true/*bPropagate*/);
        
        if (oObjOcc.IsValid()) return oObjOcc;
    }
    outData(null, oModel, "", false, formatstring2(getString("ERROR_MSG_CREATE_OCCURRENCE"), getName(oObjDef), getName(oModel)));
    return null;
}
  
function createFuncDef(oGroup, sName) {
    var oFuncDef = oGroup.CreateObjDef(Constants.OT_FUNC, sName, nLoc);
    if (oFuncDef.IsValid()) return oFuncDef;

    outData(null, null, "", false, formatstring2(getString("ERROR_MSG_CREATE_OBJECT"), sName, oGroup.Path(nLoc)));    
    return null;
}

function getName(oItem) {
    if (oItem == null) return "";
    return oItem.Name(nLoc);
}

function getMap72(itemList) {
    var map = new java.util.HashMap();
    
    for (var i in itemList) {
        var item = itemList[i];
        map.put(getSrcID(item), item.GUID());
    }
    return map;
}

function searchScenarios(oDB, nAttrType) {
    var searchItemA = getSearchItem(oDB, nAttrType, null);                                          // SAP ID / Source ID
    var searchItemB = getSearchItem(oDB, Constants.AT_SAP_FUNC_TYPE, Constants.AVT_SCEN);           // Scenario
    return oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_FUNC], searchItemA.and(searchItemB));
}

/************************************************************************************************************************************/
// Output

function outHeader() {
    oOut.TableRow();
    oOut.TableCellF(getString("STEPS"),                  60, "HEAD");
    oOut.TableCellF(getString("PROJECT_NAME"),           40, "HEAD");
    oOut.TableCellF(getString("PROJECT_SEARCHID"),       50, "HEAD");
    oOut.TableCellF(getString("PROJECT_MODEL_NAME"),     40, "HEAD");
    oOut.TableCellF(getString("PROJECT_MODEL_SEARCHID"), 50, "HEAD");
    oOut.TableCellF(getString("RESULT"),                 60, "HEAD");
}

function outData(oProjectDef, oNewProjectModel, sStep, bResult, sErrorText) {
    var styleSheet = bResult ? "STD" : "RED";
    oOut.TableRow();
    oOut.TableCellF(sStep,                          60, styleSheet);
    oOut.TableCellF(outName(oProjectDef),           40, styleSheet);
    oOut.TableCellF(outSearchID(oProjectDef),       50, styleSheet);
    oOut.TableCellF(outName(oNewProjectModel),      40, styleSheet);
    oOut.TableCellF(outSearchID(oNewProjectModel),  50, styleSheet);
    oOut.TableCellF(outResult(bResult, sErrorText), 60, styleSheet);
}