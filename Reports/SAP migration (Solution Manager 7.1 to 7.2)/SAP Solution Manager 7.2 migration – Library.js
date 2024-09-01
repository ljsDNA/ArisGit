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

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"
 
var Solar = Context.getComponent("Solar");

var nLoc = Context.getSelectedLanguage();
var oFilter = ArisData.ActiveFilter();

/************************************************************************************************************************************/

var g_aModelTypes_EPC   = extendModelTypes( [Constants.MT_EEPC, Constants.MT_EEPC_COLUMN, Constants.MT_EEPC_ROW] );
var g_aModelTypes_VACD  = extendModelTypes( [Constants.MT_VAL_ADD_CHN_DGM] );
var g_aModelTypes_BPMN  = extendModelTypes( [Constants.MT_BPMN_COLLABORATION_DIAGRAM, Constants.MT_BPMN_PROCESS_DIAGRAM] );

/************************************************************************************************************************************/
// common functions

const c_TCEMarker        = "b1e79fe0-5767-4988-b302-767810126663#00000000";
const c_TCEMarker_Prefix = "b1e79fe0-5767-4988-b302-767810126663";

function getSapID(oItem)      { return oItem.Attribute(Constants.AT_SAP_ID2, nLoc).getValue() }
function setSapID(oItem, sID) { return oItem.Attribute(Constants.AT_SAP_ID2, nLoc).setValue(sID) }
function deleteSapID(oItem)   { return oItem.Attribute(Constants.AT_SAP_ID2, nLoc).Delete() }

function getSrcID(oItem) { return oItem.Attribute(Constants.AT_SOLAR_SOURCE_ID, nLoc).getValue() }

function getTestSrcID(oItem)      { return oItem.Attribute(Constants.AT_SOLAR_TEST_SRC_ID, nLoc).getValue() }
function setTestSrcID(oItem, sID) { return oItem.Attribute(Constants.AT_SOLAR_TEST_SRC_ID, nLoc).setValue(sID) }

function getLogComp(oItem)           { return oItem.Attribute(Constants.AT_SOLAR_SAP_COMPONENT, nLoc).getValue() }
function setLogComp(oItem, sLogComp) { return oItem.Attribute(Constants.AT_SOLAR_SAP_COMPONENT, nLoc).setValue(sLogComp) }

function getSapType(oItem)             { return oItem.Attribute(getSapTypeAttr(oItem), nLoc).MeasureUnitTypeNum() }
function setSapType(oItem, nSapType)   { return oItem.Attribute(getSapTypeAttr(oItem), nLoc).SetValue(nSapType) }
function checkSapType(oItem, nSapType) { return getSapType(oItem) == nSapType }
function getSapTypeAttr(oItem)         { return (oItem.KindNum() == Constants.CID_MODEL) ? Constants.AT_SAP_MOD_TYPE : Constants.AT_SAP_FUNC_TYPE } 

function getSyncProject(oItem)         { return oItem.Attribute(Constants.AT_SOLAR_ORIGIN, nLoc).getValue() }
function setSyncProject(oItem, sValue) { return oItem.Attribute(Constants.AT_SOLAR_ORIGIN, nLoc).setValue(sValue) }
function deleteSyncProject(oItem)      { return oItem.Attribute(Constants.AT_SOLAR_ORIGIN, nLoc).Delete() }

function buildTestSyncProject(sSyncProject) {
    var sSyncProject = ""+sSyncProject;
    var nPos = sSyncProject.indexOf(":");
    var sTestSyncProject = "SM72_TEST_PROJECT_SYNC" + sSyncProject.substring(nPos, sSyncProject.length);
    return sTestSyncProject;
}

function isTestItem(oItem) {
    var sExtID = ""+oItem.Attribute(Constants.AT_SAP_ID/*External ID*/, nLoc).getValue();
    return sExtID.startsWith(c_TCEMarker_Prefix);
}

function isSapProject(oProjectDef)  {
    var sSyncProject = ""+oProjectDef.Attribute(Constants.AT_SOLAR_ORIGIN, nLoc).getValue();
    return sSyncProject.startsWith("PROJECT_SYNC:");
}

function checkTCEMarker(oItem) {
    var sExtID = oItem.Attribute(Constants.AT_SAP_ID/*External ID*/, nLoc).getValue();
    return StrComp(sExtID, c_TCEMarker) == 0;
}

function getSM72Database() {
    var sDatabase = Dialogs.BrowseArisItems(getString("DLG_SELECT_DB_TITLE"), getString("DLG_SELECT_DB_DESC"), ArisData.getActiveDatabase().ServerName(), Constants.CID_DATABASE);
    if (sDatabase == "") return null;
    return ArisData.openDatabase(sDatabase, true/*p_bReadOnly*/);
}

function isModelOfType_EPC(oModel)   { return isTypeInList(oModel.TypeNum(), g_aModelTypes_EPC) }
function isModelOfType_VACD(oModel)  { return isTypeInList(oModel.TypeNum(), g_aModelTypes_VACD) }
function isModelOfType_BPMN(oModel)  { return isTypeInList(oModel.TypeNum(), g_aModelTypes_BPMN) }
function isModelOfType_EBPMN(oModel) { return isTypeInList(oModel.TypeNum(), g_aModelTypes_EBPMN) }

function extendModelTypes(p_aOrgModelTypeNums) {
    var aModelTypes = new Array();
    for (var i = 0; i < p_aOrgModelTypeNums.length; i++) { 
        aModelTypes = aModelTypes.concat(getModelTypesIncludingUserDefined(p_aOrgModelTypeNums[i]));
    }    
    return aModelTypes;
}

function extendSymbols(p_aOrgSymbolNums) {
    var aSymbols = new Array();
    for (var i = 0; i < p_aOrgSymbolNums.length; i++) { 
        aSymbols = aSymbols.concat(getSymbolsIncludingUserDefined(p_aOrgSymbolNums[i]));
    }    
    return aSymbols;
}

function getDefaultFunctionSymbol(oModel) {
    if (isModelOfType_EPC(oModel))  return Constants.ST_SOLAR_FUNC;         // SAP function
    if (isModelOfType_VACD(oModel)) return Constants.ST_SOLAR_VAC;          // SAP function (value-added chain)
    if (isModelOfType_BPMN(oModel)) return Constants.ST_BPMN_USER_TASK;     // User task        
  //if (isModelOfType_EBPMN(oModel))
    
    var aSymbols = oFilter.Symbols(oModel.TypeNum(), Constants.OT_FUNC);
    if (aSymbols.length > 0) return aSymbols[0];
    return null;
}

function copyAttrs(oItemSrc/*Reference*/, oItemTrg/*To be changed*/) {
    var bCopyOk = true;    
    
    var oAttrList = oItemSrc.AttrList(nLoc);
    for (var j in oAttrList) {
        var oAttrSrc = oAttrList[j];
        if (ignoreAttrType(oAttrSrc.TypeNum())) continue;
        
        var oAttrTrg = oItemTrg.Attribute(oAttrSrc.TypeNum(), nLoc);
        if (!oAttrTrg.IsValid()) {
            bCopyOk = false;
            continue;
        }
        switch(oFilter.AttrBaseType(oAttrSrc.TypeNum())) {
            case Constants.ABT_BOOL:
            case Constants.ABT_COMBINED:
            case Constants.ABT_LONGTEXT:
            case Constants.ABT_VALUE:
            case Constants.ABT_BLOB:
            case Constants.ABT_FOREIGN_ID:
                if (!oAttrTrg.SetValue(oAttrSrc.MeasureValue(false), oAttrSrc.MeasureUnitTypeNum())) bCopyOk = false;
                break;
            default:
                if (!oAttrTrg.SetValue(oAttrSrc.GetValue(false), oAttrSrc.MeasureUnitTypeNum())) bCopyOk = false;
        }
    }
    return bCopyOk;
    
    function ignoreAttrType(nAttrType) {
        var aIgnoredAttrTypes = [Constants.AT_TYPE_6, Constants.AT_CREAT_TIME_STMP, Constants.AT_CREATOR, Constants.AT_LAST_CHNG_2, Constants.AT_LUSER];
        return isTypeInList(nAttrType, aIgnoredAttrTypes);
    }
}

function copyAttr(oItemSrc/*Reference*/, oItemTrg/*To be changed*/, nAttrType) {
    var oAttrSrc = oItemSrc.Attribute(nAttrType, nLoc);
    if (oAttrSrc.IsMaintained()) {
        var oAttrTrg = oItemTrg.Attribute(nAttrType, nLoc);
        return oAttrTrg.setValue(oAttrSrc.getValue());
    }
    return false;
}

function isTypeInList(nTypeNum, aTypeNums) {
    for (var i in aTypeNums) {
        if (nTypeNum == aTypeNums[i]) return true;
    }
    return false;
}

function canModelBeChanged(oModel) {
    return oModel.canWrite(true/*p_bCheckAccessPermissions*/);      // BLUE-14566 
}

function getSearchItem(oDB, nAttrType, nAttrValueType) {
    if (nAttrValueType != null) {
        var sAttrValue = oFilter.AttrValueType(nAttrType, nAttrValueType);
        return oDB.createSearchItem(nAttrType, nLoc, sAttrValue, Constants.SEARCH_CMP_EQUAL, true/*bCaseSensitive*/, false/*bAllowWildcards*/);
    }
    return oDB.createSearchItem(nAttrType, nLoc, true/*bExistence*/);
}

function getMappedSapID(sSapID, sapIDMapping) {
    if (sSapID != "") return sapIDMapping.get(sSapID);
    return null;
}

function getSapIDMapping(itemList, SAPLogin)     { return getSolarIDMapping(itemList, SAPLogin, true/*bSapID*/) }
function getTestSrcIDMapping(itemList, SAPLogin) { return getSolarIDMapping(itemList, SAPLogin, false/*bSapID*/) }

function getSolarIDMapping(itemList, SAPLogin, bSapID) {
    var aSapIDs = getSapIDs(itemList, bSapID);
    if (aSapIDs.length == 0) {
        if (bSapID) showErrorMessage(getString("ERROR_MSG_NO_ITEMS_FOR_MIGRATION"));
        return null;
    }

    var aMigrationIDs = Solar.getMigrationIds(aSapIDs, getAnyObjDef(), SAPLogin);
    if (aMigrationIDs == null) {
        // *** Error in SAP connection ***
        showErrorMessage(getString("ERROR_MSG_SAP_CONNECTION"));
    } else {
        if (aMigrationIDs.size() == 0) {
            var sError = (bSapID) ? getString("ERROR_MSG_EMPTY_SAPID_MAPPING") : getString("ERROR_MSG_EMPTY_TESTSRCID_MAPPING")
            showErrorMessage(sError);
        }
    }
    return aMigrationIDs;
    
    function getSapIDs(itemList, bSapID) {
        var aSapIDs = new Array();
        for (var i in itemList) {
            var sSapID = bSapID ? getSapID(itemList[i]) : getTestSrcID(itemList[i]);      // Get SAP ID resp. test source ID  
            if (sSapID != "") aSapIDs.push(sSapID);
        }
        return aSapIDs;
    }
    
    function getAnyObjDef() {
        // Find an arbitrary ObjDef in database
        return ArisData.getActiveDatabase().Find(Constants.SEARCH_OBJDEF)[0];
    }
}

function checkEntireMethod() {
    var oFilter = ArisData.ActiveFilter();
    var isEntireMethod = oFilter.IsFullMethod()

    if (!isEntireMethod) {
        showErrorMessage(getString("ERROR_MSG_ENTIRE_METHOD"));
    }
    
    return isEntireMethod;
}

function showErrorMessage(sMessage) {
    Dialogs.MsgBox(sMessage, Constants.MSGBOX_ICON_ERROR | Constants.MSGBOX_BTN_OK, Context.getScriptInfo(Constants.SCRIPT_TITLE));    
}

/************************************************************************************************************************************/
// SAP login
     
function getSAPLogin() {
    return Dialogs.showDialog(new myDialog(), Constants.DIALOG_TYPE_ACTION, getString("DLG_LOGIN_TITLE"));    
    
    function myDialog() {
        var sSection = "SCRIPT_c0d4a0c0_9081_11e6_5696_782bcb2095a0";
        var bDialogOk = true;
        
        this.getPages = function() {
            var iDialogTemplate = Dialogs.createNewDialogTemplate(50, 200, "");
            
            iDialogTemplate.Text(10, 10, 120, 15, getString("DLG_USER"));  
            iDialogTemplate.TextBox(130, 10, 200, 15, "TXT_USER");
            iDialogTemplate.Text(10, 35, 120, 15, getString("DLG_LOGIN_PWD"));  
            iDialogTemplate.TextBox(130, 35, 200, 15, "TXT_PWD", -1/*Hidden*/);
            iDialogTemplate.Text(10, 60, 120, 15, getString("DLG_LOGIN_CLIENT"));  
            iDialogTemplate.TextBox(130, 60, 200, 15, "TXT_CLIENT");
            iDialogTemplate.Text(10, 85, 120, 15, getString("DLG_LOGIN_LANGUAGE"));  
            iDialogTemplate.TextBox(130, 85, 200, 15, "TXT_LANG");
            iDialogTemplate.Text(10, 110, 120, 15, getString("DLG_LOGIN_APPSRV"));  
            iDialogTemplate.TextBox(130, 110, 200, 15, "TXT_APP_SRV");
            iDialogTemplate.Text(10, 135, 120, 15, getString("DLG_LOGIN_SYSNUM"));  
            iDialogTemplate.TextBox(130, 135, 200, 15, "TXT_SYS_NUM");
            iDialogTemplate.Text(10, 160, 120, 15, getString("DLG_LOGIN_ROUTER"));  
            iDialogTemplate.TextBox(130, 160, 200, 15, "TXT_ROUTER");
            
            return [iDialogTemplate];
        }
        
        this.init = function(aPages) {
            var page = aPages[0];
            readConfigText(page, "TXT_USER");
          //readConfigText(page, "TXT_PWD");
            readConfigText(page, "TXT_CLIENT");
            readConfigText(page, "TXT_LANG");
            readConfigText(page, "TXT_APP_SRV");
            readConfigText(page, "TXT_SYS_NUM");
            readConfigText(page, "TXT_ROUTER");
        }            

        this.isInValidState = function(pageNumber) {
            return true;
        }
        
        this.onClose = function(pageNumber, bOk) {
            bDialogOk = bOk;
        }        
        
        this.getResult = function() {
            if (bDialogOk) {
                var page = this.dialog.getPage(0);
                
                writeConfigText(page, "TXT_USER");
              //writeConfigText(page, "TXT_PWD");
                writeConfigText(page, "TXT_CLIENT");
                writeConfigText(page, "TXT_LANG");
                writeConfigText(page, "TXT_APP_SRV");
                writeConfigText(page, "TXT_SYS_NUM");
                writeConfigText(page, "TXT_ROUTER");                
                
                var options = Solar.createOptions();
                options.setSAPLogonUser(         page.getDialogElement("TXT_USER").getText());
                options.setSAPLogonPassword(     page.getDialogElement("TXT_PWD").getText());
                options.setSAPLogonClient(       page.getDialogElement("TXT_CLIENT").getText());
                options.setSAPLogonLanguage(     page.getDialogElement("TXT_LANG").getText());
                options.setSAPLogonAppServer(    page.getDialogElement("TXT_APP_SRV").getText());
                options.setSAPLogonSystemNumber( page.getDialogElement("TXT_SYS_NUM").getText());
                options.setSAPLogonRouterString( page.getDialogElement("TXT_ROUTER").getText());
                return options;
            }
            return null;
        }
        
        // Read dialog settings from config
        function readConfigText(page, sField) {
            var sText = Context.getProfileString(sSection, sField, ""/*sDefault*/);
            page.getDialogElement(sField).setText(sText);
        }
        
        // Writes dialog text to config file
        function writeConfigText(page, sField) {
            var sText = page.getDialogElement(sField).getText();
            Context.writeProfileString(sSection, sField, sText);
        }        
    }
}

/************************************************************************************************************************************/
// Output

function initOutput(oOut) {
    oOut.DefineF("HEAD", getString("FONT"), 10, Constants.C_BLACK, Constants.C_GREY_80_PERCENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("STD",  getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("RED",  getString("FONT"), 10, Constants.C_RED, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
}

function outName(oItem) {
    if (oItem != null && oItem.IsValid()) return oItem.Name(nLoc);
    return "";
}

function outType(oItem) {
    if (oItem != null && oItem.IsValid()) return oItem.Type();
    return "";
}

function outSearchID(oItem) {
    if (oItem != null && oItem.IsValid()) return "$$w id=" + oItem.GUID();
    return "";
}

function outID(sID) {
    if (sID != null) return sID;
    return "";
}

function outChange(bResult, sOld, sNew) {
    if (!bResult) return "";
    return formatstring2("@1 -> @2", sOld, sNew)
}

function outResult(bResult, sErrorText) {
    var sResult = bResult ? getString("SUCCESSFUL") : getString("FAILED");
    if (sErrorText.length > 0) sResult += " - " + sErrorText;
    return sResult;
}
