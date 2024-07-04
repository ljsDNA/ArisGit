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

/*************************************************************************************************************************************************************/ 
/* AGA-12165 To switch whether only users with assigned function rights or access rights in the database (= true) or all UMC-users (= false) are evaluated */
var g_bAssignedUsersOnly = true;
/*************************************************************************************************************************************************************/ 

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed" 

UNIT_TYPE = function(p_oPsuDef, p_sColHeaderName, p_sRowHeaderName, p_sRemarks) {
    this.oPsuDef = p_oPsuDef;
    this.sGroupPath = getGroupPath(p_oPsuDef);
    this.nPsuCount = getPsuCount(p_oPsuDef);
    this.sColHeaderName = p_sColHeaderName;
    this.sRowHeaderName = p_sRowHeaderName;
    this.sRemarks = p_sRemarks;
    this.accessRightsMapOfUserGroups = new java.util.HashMap();
    this.accessRightsMapOfUsers = new java.util.HashMap();
    
    function getGroupPath(p_oPsuDef) {
        var sPath = p_oPsuDef.Group().Path(g_nLoc);
        if (sPath.indexOf(g_sPsuPath) >= 0) {
            sPath = "..." + sPath.substr(g_sPsuPath.length);
        }
        return sPath;
    }
    
    function getPsuCount(p_oPsuDef) {
        return p_oPsuDef.Group().ObjDefList(false/*bRecursive*/, [Constants.OT_PROCESS_SUPPORT_UNIT]).length;
    }
}

var g_oDB = ArisData.getActiveDatabase();
var g_nLoc = Context.getSelectedLanguage();

var oFilter = g_oDB.ActiveFilter(); 
var myCOLHEAD_OBJ_TYPES = getHeaderTypes(oFilter, true/*bIsColHeader*/);
var myROWHEAD_OBJ_TYPES = getHeaderTypes(oFilter, false/*bIsColHeader*/);

var g_oPsmConfig = new psmConfig(false/*p_bMacro*/);

var g_oPsuGroup = g_oPsmConfig.getPsuGroup();
var g_sPsuPath = ""+g_oPsuGroup.Path(g_nLoc);

Context.createOutputObject().WriteReport();
var workbook = Context.createExcelWorkbook(Context.getSelectedFile(), Context.getSelectedFile());
var styles = getStyles();
var bFirstSheet = true;

main();

var sheets = workbook.getSheets();
for (var i = 0; i < sheets.length; i++) {
    sheets[i].createFreezePane(2/*colSplit*/, 1/*rowSplit*/);
}
workbook.write();


/*************************************************************************/

function main() {
    Context.writeStatus(getString("STATUS_GET_UNITS")) 
    var aUnits = getUnits();

    var aUserGroups = getUserGroups();
    var aUsers = getNonSystemUsers();

    var userGroupGuidSet = new java.util.HashSet();
    var userGuidSet = new java.util.HashSet();

    for (var i = 0; i < aUnits.length; i++) {
        Context.writeStatus(formatstring2(getString("STATUS_GET_ACCESSRIGHTS"), (i+1), aUnits.length));
        getAccessRightsOfUnit(aUnits[i], userGroupGuidSet, aUserGroups, Constants.CID_USERGROUP);
        getAccessRightsOfUnit(aUnits[i], userGuidSet, aUsers, Constants.CID_USER);
        aUnits[i].oPsuDef = null;   // release object
    }
    var adminUserGroupGuidSet = getAdminUserGuidSet(aUserGroups, Constants.CID_USERGROUP);
    var adminUserGuidSet = getAdminUserGuidSet(aUsers, Constants.CID_USER);
    
    aUserGroups = null;
    aUsers = null;
    
    Context.writeStatus(getString("STATUS_OUTPUT"))         
    outUnits(aUnits, userGroupGuidSet, userGuidSet, adminUserGroupGuidSet, adminUserGuidSet);
}

function getAdminUserGuidSet(aUsers, userKind) {
    var adminUserGuidSet = new java.util.HashSet();

    for (var i = 0; i < aUsers.length; i++) {
        var oUser = aUsers[i];
        var accessRights = oUser.AccessRights(g_oPsuGroup);
        
        if ((accessRights & Constants.AR_WRITE) == Constants.AR_WRITE) adminUserGuidSet.add(""+oUser.GUID());
    }
    return adminUserGuidSet;
}

function outUnits(aUnits, userGroupGuidSet, userGuidSet, adminUserGroupGuidSet, adminUserGuidSet) {
    var aUserGroupGuids = getArrayFromSet(userGroupGuidSet, Constants.CID_USERGROUP);
    var aUserGuids = getArrayFromSet(userGuidSet, Constants.CID_USER);

    var maxColCount = 250;
    var maxRowCount = 60000;

    var aUserGroupSheets = getSheets(aUserGroupGuids, Constants.CID_USERGROUP);
    var aUserSheets = getSheets(aUserGuids, Constants.CID_USER);    
    var rowIndex = 1;
    
    var bColored = false;
    var sColHeaderNameOfPredecessor = "";
    var sRowHeaderNameOfPredecessor = "";        

    for (var i = 0; i < aUnits.length; i++) {
        if ((rowIndex - 1) == maxRowCount) {
            // next sheets cause too much rows
            aUserGroupSheets = getSheets(aUserGroupGuids, Constants.CID_USERGROUP);
            aUserSheets = getSheets(aUserGuids, Constants.CID_USER);    
            rowIndex = 1;
        
            bColored = false;
            sColHeaderNameOfPredecessor = "";
            sRowHeaderNameOfPredecessor = "";        
        }
        var oUnit = aUnits[i];
        var sColHeaderName = oUnit.sColHeaderName;
        var sRowHeaderName = oUnit.sRowHeaderName;    

        outHeaders(aUserGroupSheets, sColHeaderName, sRowHeaderName);
        outHeaders(aUserSheets, sColHeaderName, sRowHeaderName);

        outAccessRights(aUserGroupSheets, oUnit, aUserGroupGuids, adminUserGroupGuidSet, Constants.CID_USERGROUP, bColored);
        outAccessRights(aUserSheets, oUnit, aUserGuids, adminUserGuidSet, Constants.CID_USER, bColored);

        rowIndex++;
        
        bColored = !bColored;
        sColHeaderNameOfPredecessor = sColHeaderName;
        sRowHeaderNameOfPredecessor = sRowHeaderName;      
        
        aUnits[i] = null;   // release object
    }
    
    function getSheets(aUserGuids, userKind) {
        var aSheets = new Array();
        
        var sheet = getNewSheet(userKind);
        aSheets.push(sheet);
        writeLeftColumnHeaders(sheet);
        var colIndex = 2;
        for (var i = 0; i < aUserGuids.length; i++) {
            if ((colIndex - 2) == maxColCount) {
                writeRightColumnHeaders(sheet, colIndex);

                // next sheet cause too much columns
                sheet = getNewSheet(userKind);
                aSheets.push(sheet);
                writeLeftColumnHeaders(sheet);
                colIndex = 2;
            }                

            var oUser = g_oDB.FindGUID(aUserGuids[i], userKind);
            colIndex = writeCell(sheet, 0, colIndex, "'"+oUser.Name(g_nLoc)+"'", "Head");
            sheet.setColumnWidth (colIndex-1, 5000);
        }
        writeRightColumnHeaders(sheet, colIndex);
        return aSheets;        
        
        function writeLeftColumnHeaders(sheet) {
            writeCell(sheet, 0, 0, getString("COL_HEADER"), "Head");
            sheet.setColumnWidth (0, 12000);
            writeCell(sheet, 0, 1, getString("ROW_HEADER"), "Head");
            sheet.setColumnWidth (1, 12000);
        }

        function writeRightColumnHeaders(sheet, colIndex) {
            writeCell(sheet, 0, colIndex, getString("GROUP_PATH"), "Head");
            sheet.setColumnWidth (colIndex, 12000);
            writeCell(sheet, 0, colIndex+1, getString("PSU_COUNT"), "Head");
            sheet.setColumnWidth (colIndex+1, 2000);
            writeCell(sheet, 0, colIndex+2, getString("REMARKS"), "Head");
            sheet.setColumnWidth (colIndex+2, 10000);
        }
        
        function getNewSheet(userKind) {
            var sFootText = (userKind == Constants.CID_USERGROUP) ? getString("SHEET_NAME_USERGROUPS") : getString("SHEET_NAME_USERS");
            
            if (bFirstSheet) { 
                bFirstSheet = false;
                var sheet = workbook.getSheetAt(0);
                if (sheet != null) {
                    workbook.setSheetName(0, sFootText);
                    return sheet;
                }
            } 
            return workbook.createSheet(sFootText);
        }
    }
    
    function writeCell(sheet, rowIndex, colIndex, value, styleIndex) {
        sheet.cell(rowIndex,colIndex).setCellStyle(styles[styleIndex]);
        sheet.cell(rowIndex,colIndex).setCellValue(value);
        return ++colIndex;
    }    

    function outHeaders(aSheets, sColHeaderName, sRowHeaderName) {
        for (var i = 0; i < aSheets.length; i++) {
            writeCell(aSheets[i], rowIndex, 0, sColHeaderName, getHeaderStyleIndex(sColHeaderName, sColHeaderNameOfPredecessor, bColored));
            writeCell(aSheets[i], rowIndex, 1, sRowHeaderName, getHeaderStyleIndex(sRowHeaderName, sRowHeaderNameOfPredecessor, bColored));
        }      
    }
    
    function outAccessRights(aSheets, oUnit, aUserGuids, adminUserSet, userKind, bColored) {
        var accessRightsMap = (userKind == Constants.CID_USERGROUP) ? oUnit.accessRightsMapOfUserGroups : oUnit.accessRightsMapOfUsers;

        var sheetIndex = 0;        
        var sheet = aSheets[sheetIndex];
        var colIndex = 2;    
        for (var i = 0; i < aUserGuids.length; i++) {
            if ((colIndex - 2) == maxColCount) {
                outFurtherInfo(sheet, oUnit, colIndex, bColored);
                
                // switch to next sheet
                sheetIndex++;
                colIndex = 2;
            }   
            sheet = aSheets[sheetIndex];
        
            var userGuid = aUserGuids[i];
            var sCurrentRights = getCurrentRights(userGuid, accessRightsMap);
            colIndex = writeCell(sheet, rowIndex, colIndex, sCurrentRights, getStyleIndex(userGuid, adminUserSet, sCurrentRights, bColored));
        }  
        outFurtherInfo(sheet, oUnit, colIndex, bColored);
        
        function getCurrentRights(userGuid, accessRightsMap) {
            if (accessRightsMap.containsKey(""+userGuid)) {
                return accessRightsMap.get(""+userGuid);
            }
            return "";
        }
        
        function getStyleIndex(userGuid, adminUserSet, sCurrentRights, bColored) {
            var styleIndex = "Center";
            if (adminUserSet.contains(""+userGuid)) {
                if (sCurrentRights.indexOf("rw") < 0) return styleIndex + "_Red";
            }
            if (bColored) styleIndex += "_Yellow";
            return styleIndex;
        }        
    }
    
    function outFurtherInfo(sheet, oUnit, colIndex, bColored) {
        colIndex = writeCell(sheet, rowIndex, colIndex, oUnit.sGroupPath, getStyleIndex_Path(oUnit.sGroupPath, bColored));
        colIndex = writeCell(sheet, rowIndex, colIndex, oUnit.nPsuCount, getStyleIndex_Count(oUnit.nPsuCount, bColored));
        colIndex = writeCell(sheet, rowIndex, colIndex, oUnit.sRemarks, getStyleIndex_Remarks(bColored));

        function getStyleIndex_Path(sGroupPath, bColored) {
            var styleIndex = "Left";
            if (!java.lang.String(sGroupPath).startsWith("...")) return styleIndex + "_Red";
            if (bColored) styleIndex += "_Yellow";
            return styleIndex;
        }        

        function getStyleIndex_Count(nPsuCount, bColored) {
            var styleIndex = "Right";
            if (nPsuCount > 1) return styleIndex + "_Red";
            if (bColored) styleIndex += "_Yellow";
            return styleIndex;
        }        
        
        function getStyleIndex_Remarks(bColored) {
            var styleIndex = "Left";
            if (bColored) styleIndex += "_Yellow";
            return styleIndex;
        }
    }
    
    function getHeaderStyleIndex(sHeaderName, sHeaderNameOfPredecessor, bColored) {
        var styleIndex = "Left";
        if (StrComp(sHeaderName, sHeaderNameOfPredecessor) == 0) styleIndex += "_Grey";
        if (bColored) styleIndex += "_Yellow";
        return styleIndex;
    }
}

function getStyles() {
    var aStyles = new Array();
    aStyles["Head"]             = getStyle(true,  false, Constants.C_GREY_80_PERCENT, Constants.ALIGN_CENTER);
    aStyles["Left"]             = getStyle(false, false, Constants.C_TRANSPARENT, Constants.ALIGN_LEFT);   
    aStyles["Left_Grey"]        = getStyle(false, true,  Constants.C_TRANSPARENT, Constants.ALIGN_LEFT);   
    aStyles["Center"]           = getStyle(false, false, Constants.C_TRANSPARENT, Constants.ALIGN_CENTER);   
    aStyles["Right"]            = getStyle(false, false, Constants.C_TRANSPARENT, Constants.ALIGN_RIGHT);   
    aStyles["Left_Yellow"]      = getStyle(false, false, Constants.C_LIGHT_YELLOW, Constants.ALIGN_LEFT);   
    aStyles["Left_Grey_Yellow"] = getStyle(false, true,  Constants.C_LIGHT_YELLOW, Constants.ALIGN_LEFT);   
    aStyles["Center_Yellow"]    = getStyle(false, false, Constants.C_LIGHT_YELLOW, Constants.ALIGN_CENTER);   
    aStyles["Right_Yellow"]     = getStyle(false, false, Constants.C_LIGHT_YELLOW, Constants.ALIGN_RIGHT);   
    aStyles["Left_Red"]         = getStyle(false, false, Constants.C_RED, Constants.ALIGN_LEFT);   
    aStyles["Center_Red"]       = getStyle(false, false, Constants.C_RED, Constants.ALIGN_CENTER);   
    aStyles["Right_Red"]        = getStyle(false, false, Constants.C_RED, Constants.ALIGN_RIGHT);   

    return aStyles;
    
    function getStyle(bBold, bGrey, forgroundColor, alignment) {
        var cellFont = workbook.createFont();
        if (bBold) cellFont.setBoldweight(Constants.XL_FONT_WEIGHT_BOLD);
        if (bGrey) cellFont.setColor(22);
        var cellStyle = workbook.createCellStyle(cellFont,0,0,0,0,0,0,0,0,0,0,0,0,0);
        cellStyle.setFillForegroundColor(forgroundColor);
        cellStyle.setFillPattern(1);
        cellStyle.setAlignment(alignment); 
        cellStyle.setWrapText(true);     
        cellStyle.setBorderLeft(Constants.BORDER_THIN);
        cellStyle.setBorderRight(Constants.BORDER_THIN);
        cellStyle.setBorderBottom(Constants.BORDER_THIN);
        cellStyle.setBorderTop(Constants.BORDER_THIN);        
        return cellStyle;                
    }
}

function getAccessRightsOfUnit(oUnit, userGuidSet, aUsers, userKind) {
    var oUnitDef = oUnit.oPsuDef;
    
    for (var i = 0; i < aUsers.length; i++) {
        var oUser = aUsers[i];
        var accessRights = oUser.AccessRights(oUnitDef.Group());
        var sRights = getRights(accessRights);
        if (sRights != "") {
            if (userKind == Constants.CID_USERGROUP) {
                oUnit.accessRightsMapOfUserGroups.put(""+oUser.GUID(), sRights);
            } else {
                oUnit.accessRightsMapOfUsers.put(""+oUser.GUID(), sRights);
            }
            userGuidSet.add(""+oUser.GUID());
        }
        oUser = null;
    }
    
    function getRights(accessRights) {
        if ((accessRights & Constants.AR_CHNG) == Constants.AR_CHNG)    return "rwd";
        if ((accessRights & Constants.AR_WRITE) == Constants.AR_WRITE)  return "rw";
        if ((accessRights & Constants.AR_READ) == Constants.AR_READ)    return "r";
        return "";
    }
}

function getUserGroups() {
    var aUserGroupGuids = new Array();
    
    var oUserGroups = getDbUserGroupList(g_oDB);    // AGA-12165
    for (var i = 0; i < oUserGroups.length; i++) {
        aUserGroupGuids.push(oUserGroups[i]);
    }
    return aUserGroupGuids;
}

function getNonSystemUsers() {
    var aUserGuids = new Array();
    
    var oUsers = getDbUserList(g_oDB);              // AGA-12165
    for (var i = 0; i < oUsers.length; i++) {
        if (!oUsers[i].IsSystemUser()) aUserGuids.push(oUsers[i]);
    }
    return aUserGuids;
}

function getUnits() {
    var aPsuDefs = new Array();
    // Objects selected
    var selectedObjDefs = ArisData.getSelectedObjDefs();
    if (selectedObjDefs.length > 0) {
        for (var i = 0; i < selectedObjDefs.length; i++) {
            var oObjDef = selectedObjDefs[i];
            
            if (isUnitObj(oObjDef.TypeNum())) {
                aPsuDefs.push(oObjDef);
                continue;
            }
            if (isColHeaderObj(oObjDef.TypeNum())) {
                aPsuDefs = aPsuDefs.concat(getUnitDefsOfHeader([oObjDef], true/*bIsColHeader*/));
                continue;
            }
            if (isRowHeaderObj(oObjDef.TypeNum())) {
                aPsuDefs = aPsuDefs.concat(getUnitDefsOfHeader([oObjDef], false/*bIsColHeader*/));
                continue;
            }             
        }
        aPsuDefs = ArisData.Unique(aPsuDefs);        
        return getUnitData(aPsuDefs);
    }
    // Models selected    
    var selectedModels = ArisData.getSelectedModels();
    if (selectedModels.length > 0) {
        for (var i = 0; i < selectedModels.length; i++) {
            var oModel = selectedModels[i];
            var aColHeaderDefs = oModel.ObjDefListByTypes(myCOLHEAD_OBJ_TYPES);
            var aRowHeaderDefs = oModel.ObjDefListByTypes(myROWHEAD_OBJ_TYPES);
            aPsuDefs = aPsuDefs.concat(getUnitDefs(aColHeaderDefs, aRowHeaderDefs));
        }
        aPsuDefs = ArisData.Unique(aPsuDefs);
        return getUnitData(aPsuDefs);
    }
    // Database selected
    var aPsuDefs = g_oDB.Find(Constants.SEARCH_OBJDEF, Constants.OT_PROCESS_SUPPORT_UNIT);
    return getUnitData(aPsuDefs);    

    function getUnitData(aPsuDefs) {
        var aUnits = new Array();
        for (var i = 0; i < aPsuDefs.length; i++) {
            var oPsuDef = aPsuDefs[i];
            var sRemarks = "";
            
            var sColHeaderName = "";
            var aColHeaderDefs = oPsuDef.getConnectedObjs(myCOLHEAD_OBJ_TYPES, Constants.EDGES_INOUT, COLHEAD_CXN_TYPES);
            if (aColHeaderDefs.length > 0) {
                sColHeaderName = aColHeaderDefs[0].Name(g_nLoc);
                if (aColHeaderDefs.length > 1) sRemarks = addRemark(sRemarks, getString("MSG_MULTI_COL_HEADERS"));
            } else {
                sRemarks = addRemark(sRemarks, getString("MSG_NO_COL_HEADERS"));
            }
            
            var sRowHeaderName = "";        
            var aRowHeaderDefs = oPsuDef.getConnectedObjs(myROWHEAD_OBJ_TYPES, Constants.EDGES_INOUT, ROWHEAD_CXN_TYPES);
            if (aRowHeaderDefs.length > 0) {
                sRowHeaderName = aRowHeaderDefs[0].Name(g_nLoc);
                if (aRowHeaderDefs.length > 1) sRemarks = addRemark(sRemarks, getString("MSG_MULTI_ROW_HEADERS"));
            } else {
                sRemarks = addRemark(sRemarks, getString("MSG_NO_ROW_HEADERS"));
            }
            aUnits.push(new UNIT_TYPE(oPsuDef, sColHeaderName, sRowHeaderName, sRemarks));
            aPsuDefs[i]  = null;    // release object
        }
        return aUnits.sort(sortByHeaderNames);

        function sortByHeaderNames(unitA, unitB) {
            result = StrComp(unitA.sColHeaderName, unitB.sColHeaderName);
            if (result == 0) result = StrComp(unitA.sRowHeaderName, unitB.sRowHeaderName);
            return result;
        }
    }
    
    function getUnitDefs(aColHeaderDefs, aRowHeaderDefs) {
        var aUnitDefs = new Array();
        var aUnitDefsOfColHeader = getUnitDefsOfHeader(aColHeaderDefs, true/*bIsColHeader*/);
        var aUnitDefsOfRowHeader = getUnitDefsOfHeader(aRowHeaderDefs, false/*bIsColHeader*/);        
        for (var j = 0; j < aUnitDefsOfColHeader.length; j++) {
            var aUnitDef = aUnitDefsOfColHeader[j];
            if (aUnitDefsOfRowHeader.some(function(element){return element.equals(aUnitDef)})) {
                aUnitDefs.push(aUnitDef);
            }
        }
        return ArisData.Unique(aUnitDefs).sort(SortByNameReport);
    }    
}

function getUnitDefsOfHeader(aHeaderDefs, bIsColHeader) {
    var aHeaderUnitDefs = new Array();
    for (var k = 0; k < aHeaderDefs.length; k++) {
        aHeaderUnitDefs = aHeaderUnitDefs.concat(aHeaderDefs[k].getConnectedObjs(UNIT_OBJ_TYPES, Constants.EDGES_INOUT, (bIsColHeader ? COLHEAD_CXN_TYPES : ROWHEAD_CXN_TYPES)))
    }
    return ArisData.Unique(aHeaderUnitDefs);
}

function getArrayFromSet(guidSet, itemKind) {
    return guidSet.toArray().sort(sortGuidsByName);
    
    function sortGuidsByName(guidA, guidB) {
        var objA = g_oDB.FindGUID(guidA, itemKind);
        var objB = g_oDB.FindGUID(guidB, itemKind);        
        return StrComp(objA.Name(g_nLoc), objB.Name(g_nLoc));
    }
}

function addRemark(sRemarks, nextRemark) {
    if (sRemarks.length > 0) sRemarks += "\n";
    return sRemarks + nextRemark;
}

function getDbUserList(p_oDatabase) {
    // AGA-12165
    if (g_bAssignedUsersOnly) {
        return p_oDatabase.AssignedUsers();
    }
    return p_oDatabase.UserList();
}

function getDbUserGroupList(p_oDatabase) {
    var userGroups = p_oDatabase.UserGroupList();
    // AGA-12165
    if (g_bAssignedUsersOnly) {
        var assignedUserGroups = new Array();
        for (var i = 0; i < userGroups.length; i++) {
            var userGroup = userGroups[i];
            if (userGroup.IsAssigned()) {
                assignedUserGroups.push(userGroup);
            }
        }
        return assignedUserGroups;
    }
    return userGroups;
}
