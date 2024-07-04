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

// Name of the error file (transfered to the client and shown) 
var g_sErrorFile = "Errors_157ed0c0-f03d-11e2-2860-b1e8d209c4df.txt"
// Content of the error file
var g_sErrorText = "";

/****************************************************************************************/

var nLocale = Context.getSelectedLanguage();

var oDB = ArisData.getActiveDatabase();
var oGroup = ArisData.getSelectedGroups()[0];

var mUserMap      = importUsers();
var mUserGroupMap = importUserGroups();

assignUsersToUserGroups(mUserGroupMap, mUserMap);
createOrgCharts(mUserGroupMap);

Context.addActionResult(Constants.ACTION_UPDATE, "", oGroup);

outErrorLog();

/****************************************************************************************/

function importUsers() {
    var mUserMap = new java.util.HashMap();

    var umcUserList = oDB.UserList();
    var objdefUserList = oDB.Find(Constants.SEARCH_OBJDEF, Constants.OT_PERS);
    // add or update users
    for (var i = 0; i < umcUserList.length; i++) {
        var umcUser = umcUserList[i];
        var sUserName = umcUser.Name(nLocale);
        var existingUser = getObjectFromList(Constants.AT_LOGIN, sUserName, objdefUserList);
        var modeledUser = existingUser != null
                        ? existingUser
                        : oGroup.CreateObjDef(Constants.OT_PERS, sUserName, nLocale);
        if (modeledUser.IsValid()) {
            copyAttribute(umcUser, modeledUser, Constants.AT_NAME,       Constants.AT_LOGIN);
            copyAttribute(umcUser, modeledUser, Constants.AT_FIRST_NAME, Constants.AT_FIRST_NAME);
            copyAttribute(umcUser, modeledUser, Constants.AT_LAST_NAME,  Constants.AT_LAST_NAME);
            copyAttribute(umcUser, modeledUser, Constants.AT_EMAIL_ADDR, Constants.AT_EMAIL_ADDR);
            copyAttribute(umcUser, modeledUser, Constants.AT_PHONE_NUM,  Constants.AT_PHONE_NUM);
            copyAttribute(umcUser, modeledUser, Constants.AT_DESC,       Constants.AT_DESC);
            
            removeAttribute(modeledUser, Constants.AT_DEACT);

            mUserMap.put(umcUser.GUID(), modeledUser.GUID());
        } else {
            writeError(formatstring1("User '@1' could not be created.", sUserName));
        }
    }
    // mark users, which are not available in umc as deactivated
    for(var i=0; i<objdefUserList.length; i++){
        var objdefUser = objdefUserList[i];
        var objdefUserLogin = objdefUser.Attribute(Constants.AT_LOGIN, nLocale).getValue();
        if(getObjectFromList(Constants.AT_NAME, objdefUserLogin, umcUserList) == null){
            if(getAttributeValue(objdefUser, Constants.AT_DEACT) != 1){
                var objdefUserName = objdefUser.Attribute(Constants.AT_NAME, nLocale).getValue();
                if(setAttributeValue(objdefUser, Constants.AT_DEACT, 1)){
                    writeError(formatstring2("User '@1' with login '@2' was marked as deactivated.", objdefUserName, objdefUserLogin));
                }
            }
        }
    }
    return mUserMap;
}

function getObjectFromList(attrType, attrValue, objects){
    for(var i=0; i<objects.length; i++){
        var objAttrValue;
        if(objects[i].KindNum() == Constants.CID_OBJOCC){ // definition objects
            objAttrValue = objects[i].AttrOcc(attrType).AttrDef(nLocale).getValue();
        } else { // occurence objects
            objAttrValue = objects[i].Attribute(attrType, nLocale).getValue();
        }
        if(objAttrValue.toLowerCase() == attrValue.toLowerCase()){
            return objects[i];
        }
    }
    return null;
}

function importUserGroups() {
    var mUserGroupMap = new java.util.HashMap();

    //add or update groups
    var umcUserGroupList = oDB.UserGroupList();
    var objdefUserGroupList = oDB.Find(Constants.SEARCH_OBJDEF, Constants.OT_PERS_TYPE);
    for (var i = 0; i < umcUserGroupList.length; i++) {
        var umcUserGroup = umcUserGroupList[i];
        var sUserGroupName = umcUserGroup.Name(nLocale);
        var existingGroup = getObjectFromList(Constants.AT_NAME, sUserGroupName, objdefUserGroupList);
        var modeledUserGroup = existingGroup != null
                             ? existingGroup
                             : oGroup.CreateObjDef(Constants.OT_PERS_TYPE, sUserGroupName, nLocale);
        if (modeledUserGroup.IsValid()) {
            copyAttribute(umcUserGroup, modeledUserGroup, Constants.AT_DESC, Constants.AT_DESC);

            removeAttribute(modeledUserGroup, Constants.AT_DEACT);
            
            mUserGroupMap.put(umcUserGroup.GUID(), modeledUserGroup.GUID());
        } else {
            writeError(formatstring1("User group '@1' could not be created.", sUserGroupName));
        }
    }
    // mark groups, which are not available in umc as deactivated
    for(var i=0; i<objdefUserGroupList.length; i++){
        var objdefUserGroup = objdefUserGroupList[i];
        var objdefUserGroupName = objdefUserGroup.Attribute(Constants.AT_NAME, nLocale).getValue();
        if(getObjectFromList(Constants.AT_NAME, objdefUserGroupName, umcUserGroupList) == null){
            if(getAttributeValue(objdefUserGroup, Constants.AT_DEACT) != 1){
                if(setAttributeValue(objdefUserGroup, Constants.AT_DEACT, 1)){
                    writeError(formatstring1("User group '@1' was marked as deactivated.", objdefUserGroupName));
                }
            }
        }
    }
    return mUserGroupMap;
}

function assignUsersToUserGroups(mUserGroupMap, mUserMap) {
    var userGroupIter = mUserGroupMap.keySet().iterator();
    while (userGroupIter.hasNext()) {
        var umcUserGroupGuid = userGroupIter.next();
        var modeledUserGroupGuid = mUserGroupMap.get(umcUserGroupGuid);

        var umcUserGroup = getIemByGuid(umcUserGroupGuid, Constants.CID_USERGROUP);
        var modeledUserGroup = getIemByGuid(modeledUserGroupGuid, Constants.CID_OBJDEF);
        if (umcUserGroup == null || modeledUserGroup == null) {
            continue;
        }

        var umcAssignedUsers = umcUserGroup.UserList();
        for (var i = 0; i < umcAssignedUsers.length; i++) {
            var modeledUser = getModeledUser(umcAssignedUsers[i]);
            if (modeledUser != null && getUserCxnToGroup(modeledUser, modeledUserGroup) == null) {
                var cxn = modeledUser.CreateCxnDef(modeledUserGroup, Constants.CT_EXEC_5);
                if (!cxn.IsValid()) {
                    writeError(formatstring2("Connection between '@1' and '@2' could not be created.", modeledUser.Name(nLocale), modeledUserGroup.Name(nLocale)));
                }
            }
        }
        // remove assigned users, which are not assigned in umc anymore
        var modeledGroupAssignedUsers = modeledUserGroup.getConnectedObjs(Constants.OT_PERS);
        for (var i=0; i<modeledGroupAssignedUsers.length; i++) {
            var modeledUser = modeledGroupAssignedUsers[i];
            var umcGroupUser = getObjectFromList(Constants.AT_NAME, modeledUser.Name(nLocale), umcAssignedUsers);
            if(umcGroupUser == null){
                var cxn = getUserCxnToGroup(modeledUser, modeledUserGroup);
                if(cxn.Delete(false)){
                    writeError(formatstring2("Connection between '@1' and '@2' was removed.", modeledUser.Name(nLocale), modeledUserGroup.Name(nLocale)));
                }
            }
        }
    }

    function getModeledUser(umcUser) {
        var umcUserGuid = umcUser.GUID();
        if (!mUserMap.containsKey(umcUserGuid)) {
            writeError(formatstring1("User with GUID '@1' could not be found.", umcUserGuid));
            return null;
        }
        var modeledUserGuid = mUserMap.get(umcUserGuid);
        return getIemByGuid(modeledUserGuid, Constants.CID_OBJDEF);
    }

    function getUserCxnToGroup(modeledUser, modeledUserGroup){
        var groupCxns = modeledUserGroup.CxnListFilter(Constants.EDGES_IN, Constants.CT_EXEC_5)
        if(groupCxns != null){
            for(var i=0; i<groupCxns.length; i++){
                if(groupCxns[i].SourceObjDef().Name(nLocale) == modeledUser.Name(nLocale)){
                    return groupCxns[i];
                }
            }
        }
        return null;
    }
}

function createOrgCharts(mUserGroupMap) {
    var aUserGroups = getModeledUserGroups(mUserGroupMap)
    for (var i = 0; i < aUserGroups.length; i++) {
        var oUserGroup = aUserGroups[i];
        var sUserGroupName = oUserGroup.Name(nLocale);
        var existingModels = oGroup.ModelListFilter(sUserGroupName, nLocale, Constants.MT_ORG_CHRT);

        var oModel = existingModels != null && existingModels.length > 0
                   ? existingModels[0]
                   : oGroup.CreateModel(Constants.MT_ORG_CHRT, sUserGroupName, nLocale);
        if (!oModel.IsValid()) {
            writeError(formatstring1("Model '@1' could not be created.", sUserGroupName));
            continue;
        }
        var xPos = 100;
        var yPos = 100;
        var offset = 30;

        var existingUserGroupOccs = oModel.ObjOccListFilter(oUserGroup.Name(nLocale), nLocale, Constants.OT_PERS_TYPE);
        var oUserGroupOcc = existingUserGroupOccs != null && existingUserGroupOccs.length > 0
                          ? existingUserGroupOccs[0]
                          : oModel.createObjOcc(Constants.ST_EMPL_TYPE, oUserGroup, xPos, yPos, true);

        xPos = oUserGroupOcc.X() + oUserGroupOcc.Width();
        yPos = oUserGroupOcc.Y() + oUserGroupOcc.Height() + offset;

        var inCxns = oUserGroup.CxnListFilter(Constants.EDGES_IN, Constants.CT_EXEC_5).sort(sortSrcName);
        for (var j = 0; j < inCxns.length; j++) {
            var inCxn = inCxns[j];
            var oUser = inCxn.SourceObjDef();

            var existingUserOccs = oModel.ObjOccListFilter(oUser.Name(nLocale), nLocale, Constants.OT_PERS);
            var oUserOcc = existingUserOccs != null && existingUserOccs.length > 0
                         ? existingUserOccs[0]
                         : oModel.createObjOcc(Constants.ST_PERS_INT, oUser, xPos, yPos, true);

            if(existingUserOccs != null && existingUserOccs.length > 0){
                oUserOcc.SetPosition(xPos, yPos);
            }

            var existingCxn = getUserToGroupCxn(oUserOcc, oUserGroupOcc);
            if(!existingCxn){
                var cxn = oModel.CreateCxnOcc(oUserOcc, oUserGroupOcc, inCxn, getPoints(oUserOcc, oUserGroupOcc), false);
                cxn.applyTemplate(); // set cxn style
            } else {
                existingCxn.setPoints(getPoints(oUserOcc, oUserGroupOcc));
            }
            yPos = oUserOcc.Y() + oUserOcc.Height() + offset;
        }
        
        // remove users, which are not group members anymore, from org chart
        var oModelUsers = oModel.ObjOccListFilter(Constants.OT_PERS);
        var oUserGroupUsers = oUserGroupOcc.getConnectedObjOccs(Constants.ST_PERS_INT)
        for(var j=0; j<oModelUsers.length; j++){
            if(getObjectFromList(Constants.AT_NAME, oModelUsers[j].getObjDefName(nLocale), oUserGroupUsers) == null){
                var userName = oModelUsers[j].getObjDefName(nLocale);
                if(oModel.deleteOcc(oModelUsers[j], false)){
                    writeError(formatstring2("User '@1' was removed from group '@2'.", userName, oUserGroupOcc.getObjDefName(nLocale)));
                }
            }
        }
    }

    function getUserToGroupCxn(oUserOcc, oUserGroupOcc){
        var cxns = oUserOcc.CxnOccList();
        if(cxns != null){
            for(var i=0; i<cxns.length; i++){
                if(cxns[i].getTarget().getObjDefName(nLocale) == oUserGroupOcc.getObjDefName(nLocale)){
                    return cxns[i];
                }
            }
        }
        return null;
    }

    function sortSrcName(cxnA, cxnB) {
        return StrComp(cxnA.SourceObjDef().Name(nLocale), cxnB.SourceObjDef().Name(nLocale))
    }

    function getModeledUserGroups(mUserGroupMap) {
        var aModeledUserGroups = new Array();
        var userGroupIter = mUserGroupMap.keySet().iterator();
        while (userGroupIter.hasNext()) {
            var umcUserGroupGuid = userGroupIter.next();
            var modeledUserGroupGuid = mUserGroupMap.get(umcUserGroupGuid);

            var modeledUserGroup = getIemByGuid(modeledUserGroupGuid, Constants.CID_OBJDEF);
            if (modeledUserGroup != null) {
                aModeledUserGroups.push(modeledUserGroup);
            }
        }
        return aModeledUserGroups;
    }

    function getPoints(srcObjOcc,  trgObjOcc) {
        var point1 = new java.awt.Point(srcObjOcc.X(), srcObjOcc.Y() + srcObjOcc.Height()/2);
        var point2 = new java.awt.Point(trgObjOcc.X() + trgObjOcc.Width()/2, srcObjOcc.Y() + srcObjOcc.Height()/2);
        var point3 = new java.awt.Point(trgObjOcc.X() + trgObjOcc.Width()/2, trgObjOcc.Y() + trgObjOcc.Height());
        return [point1, point2, point3];
    }

}

function copyAttribute(fromObjDef, toObjDef, fromAttrType, toAttrType) {
    var fromAttr = fromObjDef.Attribute(fromAttrType, nLocale);
    if (fromAttr.IsMaintained()) {
        return setAttributeValue(toObjDef, toAttrType, fromAttr.getValue());
    }
    return false;
}

function setAttributeValue(toObjDef, toAttrType, value){
    var toAttr = toObjDef.Attribute(toAttrType, nLocale);
    if (toAttr.IsValid()) {
        return toAttr.setValue(value);
    }
    return false;
}

function getAttributeValue(objDef, attrType){
    var attr = objDef.Attribute(attrType, nLocale);
    if (attr.IsMaintained()) {
        return attr.getValue();
    }
    return null;
}

function removeAttribute(objDef, attrType){
    var attr = objDef.Attribute(attrType, nLocale);
    if (attr.IsValid()) {
        return attr.Delete();
    }
    return false;
}

function getIemByGuid(sGuid, nItemKind) {
    var item = oDB.FindGUID(sGuid, nItemKind);
    if (item == null || !item.IsValid()) {
        writeError(formatstring1("Item with GUID '@1' could not be found.", sGuid));
        return null;
    }
    return item;
}

function writeError(sError) {
    if (g_sErrorText.length > 0) g_sErrorText += "\n";
    g_sErrorText += sError;
}

function outErrorLog() {
    if (g_sErrorText.length == 0) return;

    var oOut = Context.createOutputObject(Constants.OUTTEXT, g_sErrorFile);
    oOut.OutputLn(g_sErrorText, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    oOut.WriteReport();

    Dialogs.shell(g_sErrorFile);
    Context.deleteFile(g_sErrorFile);

    Context.setScriptError(Constants.ERR_NOFILECREATED);
}
