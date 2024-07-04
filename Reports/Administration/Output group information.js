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

// BLUE-17650 - Import/Usage of 'convertertools.js' removed 

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

function DLG_OPTIONS() {
    this.bRecursive;
    this.nOption;    
}

var g_bTablePerGroup = false;    // (true/false) - true: create new table for every group
if (Context.getSelectedFormat() == Constants.OUTPDF) g_bTablePerGroup = false;              // Anubis 363294

var g_nMaxExcelRows = 60000;
var g_nRowCount = 0;

var g_ooutfile = null;          // Object used for the output of the report.
var g_nloc = Context.getSelectedLanguage();

var g_ousergroups = null;       // List of user groups.
var g_ousers = null;            // List of users.
var g_mUserGroupUsers = null;   // Map: User groups -> users in user groups   

var g_bIsDbVersionable = ArisData.getActiveDatabase().isVersionable();
var g_nWidthAR = g_bIsDbVersionable ? 9 : 12;

function main() {
    if (ArisData.getSelectedGroups().length == 0) {
        Dialogs.MsgBox(getString("TEXT25"), Constants.MSGBOX_BTN_OK, getString("TEXT4"));
        return;
    }
    var oDB = ArisData.getActiveDatabase();    
    
    var dlgOptions = new DLG_OPTIONS();
    if (!userDialog(dlgOptions)) return;
    
    g_ooutfile = Context.createOutputObject();
    g_ooutfile.DefineF("REPORT1", getString("TEXT21"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
    g_ooutfile.DefineF("REPORT2", getString("TEXT21"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    g_ooutfile.DefineF("REPORT3", getString("TEXT21"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    setReportHeaderFooter(g_ooutfile, g_nloc, true, true, true);
    
    g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0);     // Anubis 363294 
    writeTableHeader(dlgOptions.nOption);
    
    if (dlgOptions.nOption == 2) {
        g_ousergroups = getDbUserGroupList(oDB);    // AGA-12165
        g_mUserGroupUsers = getUserGroupUsers(g_ousergroups);
        g_ousers = getUserList(oDB, g_mUserGroupUsers, g_ousergroups);
    }
    var bColored_holder = new __holder(false);  // variable to change background color of table rows
        
    var aGroupGuids = getGroupGuids(dlgOptions.bRecursive);
    for (var i = 0; i < aGroupGuids.length; i++) {
        ulist(oDB.FindGUID(aGroupGuids[i], Constants.CID_GROUP), dlgOptions.nOption, bColored_holder);
        checkNewTable(dlgOptions.nOption, bColored_holder);
    }    
    g_ooutfile.EndTable("", 100, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    g_ooutfile.WriteReport();
}

function checkNewTable(nOption, bColored_holder) {
    var bNewTable = g_bTablePerGroup;
    if (!bNewTable) {
        if ( (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) && g_nRowCount > g_nMaxExcelRows) {
            g_nRowCount = 0;
            bNewTable = true;
        }
    }
    
    if (bNewTable) {
        g_ooutfile.EndTable("", 100, getString("TEXT1"), 10, 0, - 1, 0, 136, 0);
        g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0);     // Anubis 363294 
        if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) writeTableHeader(nOption);
        bColored_holder.value = false;
    }
}

function userDialog(dlgOptions) {
    var userdialog = Dialogs.createNewDialogTemplate(0, 0, 600, 190, getString("TEXT4"));        
    userdialog.Text(10, 10, 560, 15, getString("TEXT8"));
    userdialog.Text(10, 25, 560, 15, getString("TEXT9"));
    userdialog.Text(10, 40, 560, 15, getString("TEXT10"));
    userdialog.CheckBox(10, 65, 560, 15, getString("TEXT11"), "Check");
    userdialog.GroupBox(7, 90, 586, 65, getString("TEXT12"));
    userdialog.OptionGroup("options");
    userdialog.OptionButton(20, 105, 560, 15, getString("TEXT13"));
    userdialog.OptionButton(20, 120, 560, 15, getString("TEXT14"));
    userdialog.OptionButton(20, 135, 560, 15, getString("TEXT15"));
    userdialog.OKButton();
    userdialog.CancelButton();

    var dlg = Dialogs.createUserDialog(userdialog); 
    
    // Read dialog settings from config
    var sSection = "SCRIPT_14ee3c30_eae4_11d8_12e0_9d2843560f51";
    ReadSettingsDlgValue(dlg, sSection, "Check", 0);
    ReadSettingsDlgValue(dlg, sSection, "options", 0);

    var nuserdialog = Dialogs.show( __currentDialog = dlg);

   // Write dialog settings to config  
    if (nuserdialog != 0) {
        WriteSettingsDlgValue(dlg, sSection, "Check");
        WriteSettingsDlgValue(dlg, sSection, "options");
        
        dlgOptions.bRecursive = dlg.getDlgValue("Check") == 1;
        dlgOptions.nOption = dlg.getDlgValue("options");
        return true;
    }
    return false;
}
 
function writeTableHeader(nOption) {
    g_ooutfile.TableRow();
    g_nRowCount++;
    g_ooutfile.TableCell(getString("TEXT16"), 24, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    switch(nOption) {
        case 0:
            g_ooutfile.TableCell(getString("TEXT17"), 76, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            break;
        case 1:
            g_ooutfile.TableCell(getString("TEXT18"), 76, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            break;
        case 2:
            g_ooutfile.TableCell(getString("TEXT19"), 20, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            g_ooutfile.TableCell(getString("TEXT20"), 20, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            g_ooutfile.TableCell(getString("TEXT21"), 36, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
            g_ooutfile.TableRow();
            g_nRowCount++;
            g_ooutfile.TableCell("", 24, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(false), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            g_ooutfile.TableCell("", 20, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(false), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            g_ooutfile.TableCell("", 20, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(false), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            g_ooutfile.TableCell(getString("TEXT22"), g_nWidthAR, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
            g_ooutfile.TableCell(getString("TEXT23"), g_nWidthAR, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
            g_ooutfile.TableCell(getString("TEXT24"), g_nWidthAR, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
            if (g_bIsDbVersionable) {
                g_ooutfile.TableCell(getString("TEXT26"), g_nWidthAR, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
            }
            break;
    }
}

function ulist(ocurrentgroup, nDlgOptions, bColored_holder) {
    var nindent = getIndent(ocurrentgroup);
    
    switch(nDlgOptions) {
        case 0:
            g_ooutfile.TableRow();
            g_nRowCount++;
            g_ooutfile.TableCell(ocurrentgroup.Name(g_nloc), 24, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, nindent);
            var ocurrentattribute = ocurrentgroup.Attribute(Constants.AT_DESC, g_nloc);
            g_ooutfile.TableCell(ocurrentattribute.GetValue(true), 76, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            break;
        
        case 1:
            g_ooutfile.TableRow();
            g_nRowCount++;
            g_ooutfile.TableCell(ocurrentgroup.Name(g_nloc), 24, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, nindent);
            g_ooutfile.TableCell(ocurrentgroup.Path(g_nloc), 76, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            break;
        
        case 2:
            g_ooutfile.TableRow();
            g_nRowCount++;
            g_ooutfile.TableCell(ocurrentgroup.Name(g_nloc), 24, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, nindent);
            g_ooutfile.TableCell("", 20, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            g_ooutfile.TableCell("", 20, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            g_ooutfile.TableCell("", g_nWidthAR, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            g_ooutfile.TableCell("", g_nWidthAR, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            g_ooutfile.TableCell("", g_nWidthAR, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            if (g_bIsDbVersionable) {
                g_ooutfile.TableCell("", g_nWidthAR, getString("TEXT1"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            }
            
            var bUserColored_holder = new __holder(false);  // variable to change background color of table rows (users, usergroups)
            
            usergroupout(ocurrentgroup, bUserColored_holder);
            
            if (g_ousers.length > 0) {
                g_ooutfile.TableRow();
                g_nRowCount++;
                g_ooutfile.TableCell("", 24, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                g_ooutfile.TableCell("---", 20, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                g_ooutfile.TableCell("", 20, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                g_ooutfile.TableCell("", g_nWidthAR, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                g_ooutfile.TableCell("", g_nWidthAR, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                g_ooutfile.TableCell("", g_nWidthAR, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                if (g_bIsDbVersionable) {
                    g_ooutfile.TableCell("", g_nWidthAR, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                }
                userout(g_ousers, ocurrentgroup, bUserColored_holder);
            }
            break;
    }
    bColored_holder.value = !bColored_holder.value; // Change background color
}



// ---------------------------------
// Output of users.
// ---------------------------------
function userout(ousers, ocurrentgroup, bUserColored_holder) {
    // Output of users.
    for (var k = 0 ; k < ousers.length ; k++ ){
        var ocurrentuser = ousers[k];
        var ocurrentattribute = ocurrentuser.Attribute(1000, g_nloc);
        
        var currentAccessRights = ocurrentuser.AccessRights(ocurrentgroup);
        var bread = (currentAccessRights & Constants.AR_READ) == Constants.AR_READ;
        var bwrite = (currentAccessRights & Constants.AR_WRITE) == Constants.AR_WRITE;
        var bdelete = (currentAccessRights & Constants.AR_DELETE) == Constants.AR_DELETE;    
        var bsubmit = g_bIsDbVersionable && ((currentAccessRights & Constants.AR_SUBMIT) == Constants.AR_SUBMIT);
        
        g_ooutfile.TableRow();
        g_nRowCount++;
        g_ooutfile.TableCell("", 24, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        g_ooutfile.TableCell("", 20, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        g_ooutfile.TableCell(ocurrentattribute.GetValue(true), 20, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

        g_ooutfile.TableCell((bread ? "X" : ""), g_nWidthAR, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
        g_ooutfile.TableCell((bwrite ? "X" : ""), g_nWidthAR, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
        g_ooutfile.TableCell((bdelete ? "X" : ""), g_nWidthAR, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
        if (g_bIsDbVersionable) {
            g_ooutfile.TableCell((bsubmit ? "X" : ""), g_nWidthAR, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
        }
        bUserColored_holder.value = !bUserColored_holder.value; // Change background color
    }
}

// -------------------------------
// Output of user groups.
// -------------------------------
function usergroupout(ocurrentgroup, bUserColored_holder) {
    for (var k = 0 ; k < g_ousergroups.length ; k++ ){
        var ocurrentusergroup = g_ousergroups[k];
        var ocurrentattribute = ocurrentusergroup.Attribute(1000, g_nloc);
        
        var currentAccessRights = ocurrentusergroup.AccessRights(ocurrentgroup);
        var bread = (currentAccessRights & Constants.AR_READ) == Constants.AR_READ;
        var bwrite = (currentAccessRights & Constants.AR_WRITE) == Constants.AR_WRITE;
        var bdelete = (currentAccessRights & Constants.AR_DELETE) == Constants.AR_DELETE;    
        var bsubmit = g_bIsDbVersionable && ((currentAccessRights & Constants.AR_SUBMIT) == Constants.AR_SUBMIT);
        
        g_ooutfile.TableRow();
        g_nRowCount++;
        g_ooutfile.TableCell("", 24, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        g_ooutfile.TableCell(ocurrentattribute.GetValue(true), 20, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        g_ooutfile.TableCell("", 20, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, 136, 0);

        g_ooutfile.TableCell((bread ? "X" : ""), g_nWidthAR, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
        g_ooutfile.TableCell((bwrite ? "X" : ""), g_nWidthAR, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
        g_ooutfile.TableCell((bdelete ? "X" : ""), g_nWidthAR, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
        if (g_bIsDbVersionable) {
            g_ooutfile.TableCell((bsubmit ? "X" : ""), g_nWidthAR, getString("TEXT1"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bUserColored_holder.value), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
        }
        bUserColored_holder.value = !bUserColored_holder.value; // Change background color
        
        if (g_mUserGroupUsers.containsKey(ocurrentusergroup.GUID())) {
            userout(g_mUserGroupUsers.get(ocurrentusergroup.GUID()), ocurrentgroup, bUserColored_holder);
        }
    }
}

// ------------------------------------------------------------------
// Creates array with all groups (sorted)
// ------------------------------------------------------------------
function getGroupGuids(bRecursive) {
    var aGroupGuids = new Array();
    
    var oGroups = ArisData.getSelectedGroups();
    if (bRecursive) {
        var oGroups_tmp = oGroups;
        for (var i = 0 ; i < oGroups_tmp.length ; i++ ) {
            oGroups = oGroups.concat(oGroups_tmp[i].Childs(true));
        }
    }
    oGroups = ArisData.sort(oGroups, Constants.SORT_GROUPPATH, g_nloc);  

    for (var i = 0 ; i < oGroups.length ; i++ ) {
        aGroupGuids.push(oGroups[i].GUID());
    }
    oGroups = null;
    
    return aGroupGuids;
}

// ------------------------------------------------------------------
// Creates map: User group -> Users in user group
// ------------------------------------------------------------------
function getUserGroupUsers(ousergroups) {
    var mUserGroupUsers = new java.util.HashMap();
    for (var i = 0 ; i < ousergroups.length ; i++ ) {
        var oUserGroup = ousergroups[i];
        mUserGroupUsers.put(oUserGroup.GUID(), oUserGroup.UserList()); 
    }
    return mUserGroupUsers;
}

// ------------------------------------------------------------------
// Creates list of users who are not contained in any user group.
// ------------------------------------------------------------------
function getUserList(oDB, mUserGroupUsers, ousergroups) {
    var oUserList = new Array(); 
    
    var setGroupUsers = new java.util.HashSet();
    for (var i = 0 ; i < ousergroups.length ; i++ ){
        var oUsers = mUserGroupUsers.get(ousergroups[i].GUID());
        for (var j = 0 ; j < oUsers.length ; j++ ) {        
            // users in user groups        
            setGroupUsers.add(oUsers[j]);
        }
    }
    var oAllUsers = getDbUserList(oDB); // AGA-12165
    for (var i = 0 ; i < oAllUsers.length ; i++ ) {
        var oCurrentUser = oAllUsers[i];
        if (!setGroupUsers.contains(oCurrentUser)) {
            oUserList.push(oCurrentUser);
        }
    }
    return oUserList;
    
    function getDbUserList(p_oDatabase) {
        // AGA-12165
        if (g_bAssignedUsersOnly) {
            return p_oDatabase.AssignedUsers();
        }
        return p_oDatabase.UserList();
    }
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


function getIndent(ocurrentgroup) {
    var nIndent = 0;
    var sPath = new String(ocurrentgroup.Path(g_nloc));
    for (var i = 0; i < sPath.length; i++) {
        if (sPath[i] == "\\") nIndent++;
    }
    return nIndent;
}

main();










