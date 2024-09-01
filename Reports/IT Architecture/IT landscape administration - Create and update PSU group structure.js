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

 
var g_oDB = ArisData.getSelectedDatabases()[0];
var g_nLoc = Context.getSelectedLanguage();
var g_oPsmConfig = new psmConfig(false);
var oPSURoot = g_oPsmConfig.getPsuGroup();
var oStopWatch// = new stopWatch("createPSUStructure");
var PSU_GROUP_AT_IDENTIFIER = Constants.AT_REFERENCE_ID;
main();

function main(){
    var oClassGroupCreator = new classGroupCreator(g_oDB);
    var oClassRightsMover = new classRightsMover();
    if (oPSURoot.Childs().length==0) oClassRightsMover.deleteRights(oPSURoot);
    var oPSUs = g_oDB.Find(Constants.SEARCH_OBJDEF,Constants.OT_PROCESS_SUPPORT_UNIT);
    if (oStopWatch) oStopWatch.stopOver("Init");
    for (var i=0; i< oPSUs.length; i++){
        var oPSU = oPSUs[i];
        var oPSUGrp = oPSU.Group();
        var oNewPSUGrp = oClassGroupCreator.createGroup4PSU(oPSU);   
        if (!oPSUGrp.equals(oNewPSUGrp)){
            oClassRightsMover.addGroup(oPSU.Group(),oNewPSUGrp);
            oPSU.ChangeGroup(oNewPSUGrp);
        }    
    }
    if (oStopWatch) oStopWatch.stopOver("CreateGroups and Move");
    oClassRightsMover.transferRights();
    if (oStopWatch) oStopWatch.end("Transfer Rights");
}
function classRightsMover(){    
    this.oGroups4Transfer = new java.util.HashMap();
    this.oUserGroups = getDbUserGroupList(g_oDB);   // AGA-12165
    this.getNonSystemUser = function(){
        var oUsers = getDbUserList(g_oDB);          // AGA-12165
        var oUsersNonSystem = new Array();
        for (var i=0; i<oUsers.length; i++){
            if (!oUsers[i].IsSystemUser()) oUsersNonSystem.push(oUsers[i]);
        }
        return oUsersNonSystem;
    }
    this.oUsers = this.getNonSystemUser();
    this.addGroup = function(p_oSourceGrp,p_oTargetGrp){
        var aGrpArray;
        if (this.oGroups4Transfer.containsKey(p_oSourceGrp)){
           aGrpArray = this.oGroups4Transfer.get(p_oSourceGrp); 
        } else {
           aGrpArray = new Array();
           this.oGroups4Transfer.put(p_oSourceGrp, aGrpArray);
        }
        aGrpArray.push(p_oTargetGrp);
    }
    this.transferRights4List = function(oList){
        for (var i=0;i<oList.length;i++){
            var oItem = oList[i];
            var oEntrySet = this.oGroups4Transfer.entrySet();
            var oIterator = oEntrySet.iterator();
            while(oIterator.hasNext()){
                var oEntry = oIterator.next();
                //var oSourceGroup = g_oDB.FindGUID(oEntry.getKey(),Constants.CID_GROUP);
                var oSourceGroup = oEntry.getKey();
                var iRights = oItem.AccessRights(oSourceGroup);
                if (iRights != Constants.AR_NORIGHTS) {
                    var aTargetGroups = oEntry.getValue();
                    oItem.SetAccessRights(aTargetGroups,iRights);
                }    
            }            
        }
    }  
    this.getGroupArray = function(aTransferArray){
        var aGrp = new Array();
        aTransferArray.end = aTransferArray.first + aTransferArray.max;
        var aGrpGUIDs = aTransferArray.aArray;
        var aGrps = aTransferArray.aArray;
        if (aTransferArray.end>=aGrps.length) {
            aTransferArray.end = aGrps.length;
            aTransferArray.more = false;
        }
        for (var i=aTransferArray.first;i<aTransferArray.end;i++){
           aGrp.push(g_oDB.FindGUID(aGrpGUIDs[i],Constants.CID_GROUP)); 
        }
        aTransferArray.first = aTransferArray.end;
        return aGrp;
    }
    this.transferRights = function(){
       this.transferRights4List(this.oUserGroups); 
       this.transferRights4List(this.oUsers);
    }
    this.deleteRights = function(p_oGroup){
        this.deleteRight(this.oUserGroups,p_oGroup);
        this.deleteRight(this.oUsers,p_oGroup);
    }
    this.deleteRight = function(p_oList,p_oGroup){
        for (var i=0;i<p_oList.length;i++){
            var oItem = p_oList[i];
            oItem.SetAccessRights([p_oGroup],Constants.AR_NORIGHTS);
        }
    }
}

function classGroupCreator(){
    var sName = ArisData.ActiveFilter().ObjTypeName(Constants.OT_PROCESS_SUPPORT_UNIT);
    this.oDBLanguages = g_oDB.LanguageList(); 
    this.rootPSUs = oPSURoot;
    this.rootPSUErrors = null;
    this.rootPSUMultiRef = null;
    this.rootPSUNoRef = null;
    this.headerTypeMap = new java.util.HashMap();
    this.headerMap = new java.util.HashMap();          
    this.getPSURoot = function(){
        return this.rootPSUs;
    }  
    this.createGroup4PSU = function(p_oPSU){        
        var colHeaders = p_oPSU.getConnectedObjs(new Array(Constants.OT_FUNC,Constants.OT_FUNC_CLUSTER,Constants.OT_IS_FUNC));
        var rowHeaders = p_oPSU.getConnectedObjs(new Array(Constants.OT_ORG_UNIT, Constants.OT_LOC, Constants.OT_ORG_UNIT_TYPE,Constants.OT_PERS, Constants.OT_PERS_TYPE, Constants.OT_POS, Constants.OT_GRP, Constants.OT_PERF));
        if (colHeaders.length==1 && rowHeaders.length==1) {            
            var colheader = colHeaders[0];  
            var colHeaderGrp = this.getGroup4Header(this.rootPSUs,colheader,this.headerTypeMap,this.headerMap,"col");   
            var rowheader=rowHeaders[0]; 
            return this.getGroup4Header(colHeaderGrp,rowheader,this.headerTypeMap,this.headerMap,colheader.GUID()+"row");
        } else { 
            if (this.rootPSUErrors == null) this.rootPSUErrors = this.rootPSUs.CreateChildGroup("Errors", g_nLoc);
            if (colHeaders.length==1){
                var colheader = colHeaders[0];  
                return this.getGroup4Header(this.rootPSUErrors,colheader,this.headerTypeMap,this.headerMap,"colError");
            } else if (rowHeaders.length==1) {
                var rowheader=rowHeaders[0]; 
                return this.getGroup4Header(this.rootPSUErrors,rowheader,this.headerTypeMap,this.headerMap,"rowError");
            } else if (colHeaders.length==0 && rowHeaders.length==0) {
                if (this.rootPSUNoRef == null) this.rootPSUNoRef = this.rootPSUErrors.CreateChildGroup("keine Referencen", g_nLoc);
                return this.rootPSUNoRef;    
            } else {            
                if (this.rootPSUMultiRef == null) this.rootPSUMultiRef = this.rootPSUErrors.CreateChildGroup("zuviele Referencen", g_nLoc);
                return this.rootPSUMultiRef;
            } 
        }
    }
    this.getGroup4Header = function(p_oGroup, p_oHeader, p_oTypeMap, p_oHeaderMap,p_keyExtend){
        var oOTGrp = this.getOrCreateGroup(p_oGroup, p_oTypeMap, p_oHeader, p_keyExtend, false); 
        var sHeaderName = "" + p_oHeader.Name(g_nLoc,true).trim();
        return this.getOrCreateGroup(oOTGrp,p_oHeaderMap,  p_oHeader, p_keyExtend, true);
        /*var oOTGrp = this.getOrCreateGroup(p_oGroup, p_oTypeMap, p_oHeader.TypeNum()+p_keyExtend, p_oHeader.Type()); 
        var sHeaderName = "" + p_oHeader.Name(g_nLoc,true).trim();
        return this.getOrCreateGroup(oOTGrp,p_oHeaderMap, p_oHeader.GUID()+p_keyExtend , sHeaderName);*/
    }
    this.setGrpName = function(p_oHeader, p_oGrp){
       for (var i=0;i<this.oDBLanguages.length;i++){
          var oLang = this.oDBLanguages[i].LocaleId(); 
          var sName =  "" + p_oHeader.Name(oLang,true).trim();
          p_oGrp.Attribute(Constants.AT_NAME, oLang).setValue(sName);        
       } 
    }
    this.getOrCreateGroup = function(p_ParentGrp, p_oMap, p_oHeader,p_keyExtend, p_bName){
        var sKey="";
        var sName = "";
        if (p_bName) {
            sKey = p_oHeader.GUID()+p_keyExtend;
            sName = "" + p_oHeader.Name(g_nLoc,true).trim();
        } else {
            sKey = p_oHeader.TypeNum()+p_keyExtend;
            sName =  p_oHeader.Type();
        }    
        if (p_oMap.containsKey(sKey)) return p_oMap.get(sKey);
        else {
           var oGrp = p_ParentGrp.CreateChildGroup(sName, g_nLoc);
           if (p_bName) {
               oGrp.Attribute(PSU_GROUP_AT_IDENTIFIER, g_nLoc).setValue(p_oHeader.GUID());
               this.setGrpName(p_oHeader, oGrp);
           } else {
               oGrp.Attribute(PSU_GROUP_AT_IDENTIFIER, g_nLoc).setValue(p_oHeader.TypeNum());               
               for (var i=0;i<this.oDBLanguages.length;i++){
                  var oLang = this.oDBLanguages[i].LocaleId();   
                  oGrp.Attribute(Constants.AT_NAME, oLang).setValue(sName);        
               } 
           }    
           p_oMap.put(sKey,oGrp);
           return oGrp;
        }
    }  
    this.setExistingSubGrps = function(p_oParent, p_sExtend){
        var subGrps = p_oParent.Childs();
        for (var i = 0; i<subGrps.length; i++){ 
            var oGrp = subGrps[i];
            var sId = oGrp.Attribute(PSU_GROUP_AT_IDENTIFIER, g_nLoc).getValue();
            var sKey = sId + p_sExtend;
            var oSourceObj = g_oDB.FindGUID(sId,Constants.CID_OBJDEF);
            this.setGrpName(oSourceObj, oGrp);
            this.headerMap.put(sKey,oGrp);
            if (p_sExtend=="col") this.setExistingTypeGrps(oGrp,sId+"row");
        }    
    }    
    this.setExistingTypeGrps = function(p_oParent, p_sExtend){
        var subGrps = p_oParent.Childs();
        for (var i = 0; i<subGrps.length; i++){ 
            var oGrp = subGrps[i];
            var sId = oGrp.Attribute(PSU_GROUP_AT_IDENTIFIER, g_nLoc).getValue();
            var sKey = sId + p_sExtend;
            this.headerTypeMap.put(sKey,oGrp);
            this.setExistingSubGrps(oGrp,p_sExtend);
        }    
    }
    this.setExistingTypeGrps(this.rootPSUs,"col");
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
