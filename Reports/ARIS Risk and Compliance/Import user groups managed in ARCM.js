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

var g_nLoc = Context.getSelectedLanguage();

var ARCM = Context.getComponent("ARCM");
var restrictionFactory = ARCM.getQueryRestrictionFactory();

var g_sDatabase;
var g_sImportGroupName = getString("DEFAULT_TARGET_GROUP_NAME");
var g_oTargetGroup;

var g_oClientSignStrings;

var g_hm_created_sign2usergroups = new java.util.HashMap(); //Format: String | JS Array < String | ArrayList<ARCMAppObject> >
var g_hm_updated_sign2usergroups = new java.util.HashMap(); //Format: String | HashMap < String | ArrayList<ARCMAppObject> >
var g_hm_unchanged_sign2usergroups = new java.util.HashMap(); //Format: String | HashMap < String | ArrayList<ARCMAppObject> >

var g_nCreateCount = 0;
var g_nUpdateCount = 0;
var g_nUnchangedCount = 0;

function main() {

    var aDatabases = ArisData.getSelectedDatabases();
    var oGroups = ArisData.getSelectedGroups();
    
    var oDatabase;
    if (ArisData.getSelectedDatabases().length > 0) {
        oDatabase = ArisData.getSelectedDatabases()[0];
        g_oTargetGroup = getOrCreateImportGroup(oDatabase);
    } else {
        g_oTargetGroup = ArisData.getSelectedGroups()[0];
        oDatabase = g_oTargetGroup.Database();
    }
    g_sDatabase = oDatabase.Name(g_nLoc);
    
    //look up all arcm client signs where the current database is linked to
    determineClientSigns(g_sDatabase);
    java.util.Collections.sort(g_oClientSignStrings);
    
    //if there are no environments connected to the datasbe then stop here with a short message
    if (g_oClientSignStrings.isEmpty()) {
        var sResult = getString("RESULT_NO_ENVIRONMENTS");
        sResult.replace("<database name>", g_sDatabase);
        outputResult(sResult);
        return;
    }
    
    //look up all USERGROUP objects with obj_origin 0 (ARCM) and role_level O (object specific) which belong to on of these client_signs
    var oUsergroupList = determineObjectspecificUsergroups(g_oClientSignStrings);
    if (oUsergroupList.isEmpty()) {
        return;
    }
    
    //look up matching OT_PERS_TYPE ObjDefs
    var iter = oUsergroupList.iterator();
    while (iter.hasNext()) {
        
        var bCreated = false;
        var bUpdated = false;
        
        var oUsergroupAppObject = iter.next();
        var sArcmGuid = oUsergroupAppObject.getValueAttribute("guid").getRawValue();
        var sName = oUsergroupAppObject.getValueAttribute("name").getRawValue();
        var sDescription = oUsergroupAppObject.getValueAttribute("description").getRawValue();
        var bDeactivated = oUsergroupAppObject.getValueAttribute("deactivated").getRawValue();
        
        var oObjDef = findMatchingObjDef(oDatabase, sArcmGuid);
        // if no matching ObjDef found then create one first, set name, ARCM GUID, role type and role level
        if (oObjDef == null || !oObjDef.IsValid() || oObjDef.TypeNum() != Constants.OT_PERS_TYPE ) {
            oObjDef = g_oTargetGroup.CreateObjDef(Constants.OT_PERS_TYPE, sName, g_nLoc);
            bCreated = true;
            oObjDef.Attribute(Constants.AT_ARCM_GUID, g_nLoc).setValue(sArcmGuid);
            setRoleAndRoleLevel(oUsergroupAppObject, oObjDef);
        }
        
        //update the attributes which are editable in ARCM
        var sCurrentName = oObjDef.Attribute(Constants.AT_NAME, g_nLoc).getValue();
        if (sCurrentName != sName) {
            oObjDef.Attribute(Constants.AT_NAME, g_nLoc).setValue(sName);
            bUpdated = true;
        }
        if (sDescription != null) {
            var sCurrentDescription = oObjDef.Attribute(Constants.AT_DESC, g_nLoc).getValue();
            if (!sCurrentDescription.replaceAll("\r", "").equals(sDescription)) {
                oObjDef.Attribute(Constants.AT_DESC, g_nLoc).setValue(sDescription);
                bUpdated = true;
            }
        }
        
        //update the deactivated flag
        var bCurrentDeactivated = oObjDef.Attribute(Constants.AT_DEACT, g_nLoc).getValue();
        if (bDeactivated != bCurrentDeactivated) {
            oObjDef.Attribute(Constants.AT_DEACT, g_nLoc).setValue(bDeactivated);
            bUpdated = true;
        }

        if (bCreated) {
            addUsergroupToHashMap(oUsergroupAppObject, g_hm_created_sign2usergroups);
            g_nCreateCount++;
        }
        else if (bUpdated) {
            addUsergroupToHashMap(oUsergroupAppObject, g_hm_updated_sign2usergroups);
            g_nUpdateCount++;
        }
        else {
            addUsergroupToHashMap(oUsergroupAppObject, g_hm_unchanged_sign2usergroups);
            g_nUnchangedCount++;
        }
    }
    
    var sResult = createOutputResult();
    outputResult(sResult);
}

function addUsergroupToHashMap(p_oUsergroupAppObject, p_oHashMap) {
    var sSign = p_oUsergroupAppObject.getValueAttribute("client_sign").getUiValue();
    var oList = p_oHashMap.get(sSign);
    if (oList == null) {
        oList = new java.util.ArrayList();
        p_oHashMap.put(sSign, oList);
    }
    oList.add(p_oUsergroupAppObject);
}

// ----------------------------------------------------------------------
// ---------------------------- group import ----------------------------

function getOrCreateImportGroup(oDatabase) {
    var aChildGroups = oDatabase.RootGroup().Childs(false);
    for (var g=0; g<aChildGroups.length; g++) {
        if (aChildGroups[g].Name(g_nLoc) == g_sImportGroupName) {
            return aChildGroups[g];
        }
    }
    return oDatabase.RootGroup().CreateChildGroup(g_sImportGroupName, g_nLoc);
}


function determineClientSigns(sDatabaseName) {
    
    g_oClientSignStrings = new java.util.ArrayList();
    
    var query = ARCM.createQuery("CLIENT", Context.getSelectedLanguage());
    query.addRestriction(restrictionFactory.eq("origin", sDatabaseName));
    
    var result = query.getResult();
    for (var r=0; r<result.size(); r++) {
        var oClientAppObject = result.get(r);
        g_oClientSignStrings.add(oClientAppObject.getValueAttribute("sign").getRawValue());
    }
}


function determineObjectspecificUsergroups(oClientSignStringList) {
    
    var query = ARCM.createQuery("USERGROUP", Context.getSelectedLanguage());
    
    query.addRestriction(restrictionFactory.eq("obj_origin", Constants.ARCM_ENUM_OBJ_ORIGIN_ARCM));
    query.addRestriction(restrictionFactory.eq("rolelevel", Constants.ARCM_ENUM_USERROLE_LEVEL_OBJECT));
    query.addRestriction(restrictionFactory.in("client_sign", oClientSignStringList));
    query.setIncludeDeactivatedObjects(true);
    
    return query.getResult();
}


function findMatchingObjDef(oDatabase, sArcmGuid) {

    var searchItem = oDatabase.createSearchItem(Constants.AT_ARCM_GUID, g_nLoc, sArcmGuid, Constants.SEARCH_CMP_EQUAL, false, false);
    var result = oDatabase.Find(Constants.SEARCH_OBJDEF, null, searchItem);
    if (result.length > 0) {
        return result[0];
    } else {
        return null;
    }
}


function setRoleAndRoleLevel(p_oAppObject, p_oObjDef) {
    
    var sRoleEnumItemID = p_oAppObject.getEnumAttribute("role").getSelectedItems().get(0).getId();
    var iRoleConstant = eval("Constants.AVT_ARCM_ROLE_" + sRoleEnumItemID.toUpperCase());
    p_oObjDef.Attribute(Constants.AT_ARCM_ROLE, g_nLoc).setValue(iRoleConstant);
    
    var sRoleLevelEnumItemID = p_oAppObject.getEnumAttribute("rolelevel").getSelectedItems().get(0).getId();
    var iRoleLevelConstant = eval("Constants.AVT_ARCM_ROLE_LEVEL_" + sRoleLevelEnumItemID.toUpperCase());
    p_oObjDef.Attribute(Constants.AT_ARCM_ROLE_LEVEL, g_nLoc).setValue(iRoleLevelConstant);
    
}

// ---------------------------- group import ----------------------------
// ----------------------------------------------------------------------


// ----------------------------------------------------------------------
// -------------------------- result creation ---------------------------

// ....
function UserGroupInfo(p_oAppObject, p_sSuffixPropString) {
    this.oAppObject = p_oAppObject;
    this.sSuffixPropString = p_sSuffixPropString;
    this.sDisplayName = p_oAppObject.getValueAttribute("name").getRawValue();
}

function createOutputResult() {
    
    var sSigns = "\n - " + convertArrayListToJSArray(g_oClientSignStrings).join("\n - ");
    
    var sResult =   getString("RESULT_INTRODUCTION")
                    + "\n" + getString("RESULT_ENVIRONMENTS").replace("<database name>", g_sDatabase) + ":" + sSigns
                    + "\n"
                    + "\n" + getString("RESULT_USERGROUPS_CREATED") + ": " + g_nCreateCount
                    + "\n" + getString("RESULT_USERGROUPS_UPDATED") + ": " + g_nUpdateCount
                    + "\n" + getString("RESULT_USERGROUPS_UNCHANGED") + ": " + g_nUnchangedCount
                    + "\n"
                    + "\n" + getString("RESULT_TARGETGROUP") + ":"
                    + "\n\"" + g_oTargetGroup.Path(g_nLoc) + "\"\n";
     
     var signIter = g_oClientSignStrings.iterator();
     while (signIter.hasNext()) {
         var sSign = signIter.next();
         var sHeader = getString("RESULT_ENVIRONMENT_HEADER") + ": " + sSign
         sResult    += "\n"
                    + "\n" + sHeader
                    + "\n" + createSeparator(sHeader)
                    + "\n";
                    
         //collect all AppObjects for this client
         var aUserGroupInfos = new Array();
         
         convertAppObjsToUserGroupInfos(aUserGroupInfos, sSign, g_hm_created_sign2usergroups, "RESULT_USERGROUP_MARKER_CREATED");
         convertAppObjsToUserGroupInfos(aUserGroupInfos, sSign, g_hm_updated_sign2usergroups, "RESULT_USERGROUP_MARKER_UPDATED");
         convertAppObjsToUserGroupInfos(aUserGroupInfos, sSign, g_hm_unchanged_sign2usergroups, "RESULT_USERGROUP_MARKER_UNCHANGED");
         aUserGroupInfos.sort(sortByDisplayName);
         
         if (aUserGroupInfos.length == 0) {
             sResult += "\n" + getString("RESULT_ENVIRONMENT_CONTENT_NONE");
         } else {
             for (var u=0; u<aUserGroupInfos.length; u++) {
                 sResult += "\n    - \"" + aUserGroupInfos[u].sDisplayName + "\" " + getString(aUserGroupInfos[u].sSuffixPropString);
             }
         }
     }
    
     return sResult;
}

/*---------------------------------------------------------------------------------------
    Converts a Java ArrayList to a JavaScript Array.
 ---------------------------------------------------------------------------------------*/   
function convertArrayListToJSArray(p_hashSet) {
    var jsArray = new Array();
    if (p_hashSet == null) {return jsArray;} 
    var it = p_hashSet.iterator();
    while (it.hasNext()) {
        jsArray.push(it.next());
    }
    return jsArray;
}

/*---------------------------------------------------------------------------------------
    Converts a ArrayList of user group AppObjects to UserGroupInfo objects 
 ---------------------------------------------------------------------------------------*/ 
function convertAppObjsToUserGroupInfos(p_aUserGroupInfos, p_sSign, p_hm_sign2usergroups, p_sSuffixProperty) {
    var o_userGroupsList = p_hm_sign2usergroups.get(p_sSign);
    if (o_userGroupsList != null) {
         var groupIter = o_userGroupsList.iterator();
         while (groupIter.hasNext()) {
             var oGroup = groupIter.next();
             var oUserGroupInfo = new UserGroupInfo(oGroup, p_sSuffixProperty);
             p_aUserGroupInfos.push(oUserGroupInfo);
         }
     }
}

/*---------------------------------------------------------------------------------------
 Sort two UserGroupInfos objects lexically by their display name.
---------------------------------------------------------------------------------------*/
function sortByDisplayName( firstUserGroupInfo, secondUserGroupInfo ) {
    if (firstUserGroupInfo == null || secondUserGroupInfo == null) {return 0;}
    var firstDisplayName = firstUserGroupInfo.sDisplayName + "";
    var secondDisplayName = secondUserGroupInfo.sDisplayName + "";
    return firstDisplayName.localeCompare(secondDisplayName);      
}

/*---------------------------------------------------------------------------------------
    Creates an underline string consisting of "-" chars as long as the given heading.
 ---------------------------------------------------------------------------------------*/
function createSeparator(sHeading) {
    var sSeparator = "";
    for (var c=0; c<sHeading.length; c++) {
        sSeparator += "-";
    }
    return sSeparator;
}

// -------------------------- result creation ---------------------------
// ----------------------------------------------------------------------


// ----------------------------------------------------------------------
// -------------------------- output creation ---------------------------

function outputResult(sResult) {
    
    var scriptAdmin = Context.getComponent("ScriptAdmin");
    var scriptID = Context.getScriptInfo(Constants.SCRIPT_ID);
    var scriptInfo = scriptAdmin.getScriptInfo(Constants.SCRIPT_ID, null, scriptID, g_nLoc);
    
    if (scriptInfo.hasDialogSupport()) {
        var infoDialogDefinition = new InfoDialog(sResult);
        var displayedInfoDialog = Dialogs.showDialog(infoDialogDefinition, Constants.DIALOG_TYPE_ACTION, getString("DIALOG_TITLE"));
    }
    else {
        var oOut = Context.createOutputObject();
        oOut.OutputTxt(sResult);
        oOut.WriteReport();
    }
}

function InfoDialog(p_sText) {
    
    // structure of the dialog page
    this.getPages = function() {
        var dlgWidth = 1024;
        var dlgHeight = 576;
        var borderOffset = 10;
        
        var dialogTemplate = Dialogs.createNewDialogTemplate(dlgWidth, dlgHeight, getString("DIALOG_TITLE"));  
        dialogTemplate.TextBox (10, 10, dlgWidth - (2*borderOffset), dlgHeight - (2*borderOffset), "textContent", 1);
        return [dialogTemplate];
    };
    
    // init of dialog
    this.init = function(aPages) {        
        aPages[0].getDialogElement("textContent").setText(p_sText);
    }
}

main();
