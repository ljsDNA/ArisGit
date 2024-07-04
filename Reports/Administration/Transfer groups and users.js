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

function usertype_tsourcetargettype(p_sSourceGuid, p_sTargetGuid, p_bnewtarget) {
    this.sSourceGuid = p_sSourceGuid;
    this.sTargetGuid = p_sTargetGuid;
    this.bnewtarget = p_bnewtarget;
    return this;
}

function usertype_tconflicttype() {
    this.nuseroption = 0;                       // 0: Source overwrites, 1: Source overwrites + Mix, 2: Target preserved, 3: Target preserved + Mix
    this.naccessrightoption = 0;                // 0: Source overwrites, 1: Target preserved, 2: Source-Target Mix
    return this;
}

var g_nloc = Context.getSelectedLanguage(); 
var g_otargetfilter = null; 
var g_olanguagelist = null; 

var g_sdblist = new Array(); 

main();

/************************************************************/

function main() {
    var groupMap = new java.util.HashMap();
    var tuserlist = new Array(); 
    var tusergrouplist = new Array(); 
    
    var tconflict = new usertype_tconflicttype(); 
    
    var osourcedb = new __holder(null); 
    var otargetdb = new __holder(null); 
    
    if (initdatabasesandoptions(osourcedb, otargetdb, tconflict)) {
        
        g_otargetfilter = otargetdb.value.ActiveFilter();
        g_olanguagelist = getLanguageList(osourcedb.value, otargetdb.value);                                                    // Intersection of Language lists !!!
            
        if (setgroupstructure(groupMap, osourcedb.value, otargetdb.value)) {                                                    // Copy group structure         
                
            updateusergroups(tusergrouplist, osourcedb.value, otargetdb.value, tconflict);                                        // Copy user groups
            updateusers(tuserlist, osourcedb.value, otargetdb.value, tconflict);                                                  // Copy users
                
            setaccessrights(tusergrouplist, groupMap, osourcedb.value, otargetdb.value, tconflict, Constants.CID_USERGROUP);    // Access rights of user groups
            setaccessrights(tuserlist, groupMap, osourcedb.value, otargetdb.value, tconflict, Constants.CID_USER);              // Access rights of users
        }
        Context.setScriptError(Constants.ERR_NOFILECREATED);
        // close opened database
        if (otargetdb.value != null) {
            otargetdb.value.close();
        }
    } else {
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}

function setgroupstructure(groupMap, osourcedb, otargetdb) {
    var otargetgroup = new __holder(null); 
    
    ArisData.Save(Constants.SAVE_ONDEMAND);                                         // Save mode    
    
    var oSelectedGroups = ArisData.getSelectedGroups();     
    for (var i = 0 ; i < oSelectedGroups.length ; i++ ) {
        // Group path
        var sgroupname = "";
        var sgrouppath = ""+oSelectedGroups[i].Path(g_nloc);
        
        if (sgrouppath.startsWith("\\")) {
            sgrouppath = sgrouppath.substring(1);
        }
        
        var bgroupok = true;
        var brootgroup = true;
        while (sgrouppath != "" && bgroupok) {
            npos = sgrouppath.indexOf("\\");
            
            if (npos > -1) {
                sgroupname = sgrouppath.substring(0, npos);
                sgrouppath = sgrouppath.substring(npos+1);
            } else {
                sgroupname = sgrouppath;
                sgrouppath = "";
            }
            if (brootgroup) {
                brootgroup = false;
                osourcegroup = osourcedb.RootGroup();
                otargetgroup.value = otargetdb.RootGroup();
                
                if (!groupMap.containsKey(osourcegroup)) {
                    // Add groups (source, target) to group list
                    groupMap.put(osourcegroup, otargetgroup.value);
                }
            } else {
                bgroupok = false;
                // Get source child group
                var ochildgroups = osourcegroup.Childs();
                for (var i = 0 ; i < ochildgroups.length ; i++ ) {
                    var osourcegroup = ochildgroups[i];
                    
                    if (StrComp(osourcegroup.Name(g_nloc), sgroupname) == 0) {
                        bgroupok = true;
                        break;
                    }
                }
                // Get or create target child group
                if (bgroupok) {
                    otargetgroup.value = getorcreatetargetchildgroup(osourcegroup, otargetgroup);
                    if (otargetgroup.value != null) {
                        if (!groupMap.containsKey(osourcegroup)) {
                            // Add groups (source, target) to group list
                            groupMap.put(osourcegroup, otargetgroup.value);
                        }
                    } else {
                        bgroupok = false;
                    }
                }
            }
        }
        // Child groups
        if (bgroupok) {
            bgroupok = copychildgroups(groupMap, osourcegroup, otargetgroup);
        }
    }
    ArisData.Save(Constants.SAVE_NOW);                                              // Now save all unsaved items
    ArisData.Save(Constants.SAVE_IMMEDIATELY);                                      // Default
    
    return bgroupok;    
}

function copychildgroups(groupMap, osourcegroup, otargetgroup) {
    var otargetchild = new __holder(null); 
    var bgroupok = true;
    
    var osourcechilds = osourcegroup.Childs();
    for (var i = 0 ; i < osourcechilds.length; i++ ){
        var osourcechild = osourcechilds[i];
        otargetchild.value = getorcreatetargetchildgroup(osourcechild, otargetgroup);       // Get or create target child group
        if (otargetchild.value != null) {
            // Add groups (source, target) to group list
            groupMap.put(osourcechild, otargetchild.value);
            
            bgroupok = copychildgroups(groupMap, osourcechild, otargetchild);
        } else {
            bgroupok = false;
            break;
        }
    }
    return bgroupok;
}

function getorcreatetargetchildgroup(osourcechild, otargetgroup) {
    var otargetchild = new __holder(null); 

    var bchildexists = isChildGroupExisting(osourcechild, otargetgroup, otargetchild);
    if (!bchildexists) {
        var schildname = osourcechild.Name(g_nloc);         
        otargetchild.value = otargetgroup.value.CreateChildGroup(schildname, g_nloc);       // Create target child group
        if (otargetchild.value != null) {
            for (var nlanguage = 0 ; nlanguage < g_olanguagelist.length ; nlanguage++ ) {
                var ncurrentloc = g_olanguagelist[nlanguage].LocaleId();
                // Copy attributes
                var osourceattrlist = osourcechild.AttrList(ncurrentloc);                       
                for (var i = 0 ; i < osourceattrlist.length ; i++ ) {
                    var osourceattr = osourceattrlist[i];
                    var otargetattr = otargetchild.value.Attribute(osourceattr.TypeNum(), ncurrentloc);
                    
                    if (otargetattr.IsValid()) {
                        otargetattr.SetValue(osourceattr.MeasureValue(false), osourceattr.MeasureUnitTypeNum());
                    } else {
                        var sinfo = formatstring3(getString("TEXT4"), g_otargetfilter.ItemKindName(otargetchild.value.KindNum()), schildname, g_otargetfilter.AttrTypeName(otargetattr.TypeNum()));
                        Context.writeOutput(sinfo);
                    }
                }
            }
        } else {
            Context.writeOutput(formatstring1(getString("TEXT5"), schildname));
        }
    }
    return otargetchild.value;
}

function isChildGroupExisting(osourcechild, otargetgroup, otargetchild) {
    // Get target child group
    var ochildgroups = otargetgroup.value.Childs();
    if (ochildgroups.length > 0) {
        for (var i = 0; i < ochildgroups.length; i++ ) {
            otargetchild.value = ochildgroups[i];
            
            if (osourcechild.Attribute(Constants.AT_NAME, g_nloc).IsMaintained()) {
                var schildname = osourcechild.Name(g_nloc);      
                if (StrComp(otargetchild.value.Name(g_nloc), schildname) == 0) {
                    return true;
                }
            } else {
                
                for (var j = 0; j < g_olanguagelist.length; j++) {
                    var ncurrentloc = g_olanguagelist[j].LocaleId();
                    
                    if (osourcechild.Attribute(Constants.AT_NAME, ncurrentloc).IsMaintained()) {
                        var schildname = osourcechild.Name(ncurrentloc);      
                        if (StrComp(otargetchild.value.Name(ncurrentloc), schildname) == 0) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

function updateusergroups(tusergrouplist, osourcedb, otargetdb, tconflict) {
    var otargetusergroup = new __holder(null); 
    
    var osourceusergroups = getDbUserGroupList(osourcedb);  // AGA-12165
    for (var i = 0 ; i < osourceusergroups.length ; i++ ) {
        var osourceusergroup = osourceusergroups[i];
        var susergroupname = osourceusergroup.Name(g_nloc);
        
        // Check/Get user group name...
        var busergroupexists = getitembyname(otargetusergroup, susergroupname, otargetdb.UserGroupList());  // Always all UMC-user groups, not only assigned user groups (AGA-12165)
        if (!busergroupexists) continue;

        // Update: Function rights, method filters, attributes, prefix
        updateitemproperties(osourceusergroup, otargetusergroup.value, tconflict);            // Update properties

        if (otargetusergroup.value != null) {
            // Add user groups (source, target) to user group list
            tusergrouplist.push(new usertype_tsourcetargettype(osourceusergroup.GUID(), otargetusergroup.value.GUID(), !busergroupexists));            
        }
    }
}

function updateusers(tuserlist, osourcedb, otargetdb, tconflict) {
    var otargetuser = new __holder(null); 
    
    var osourceuserlist = getDbUserList(osourcedb); // AGA-12165
    for (var i = 0 ; i < osourceuserlist.length ; i++ ) {
        var osourceuser = osourceuserlist[i];
        var susername = osourceuser.Name(g_nloc);
        
        // Special case: System user getString("TEXT7")
        if (osourceuser.IsSystemUser() && (StrComp(susername, getString("TEXT7")) == 0)) {
            var otargetuserlist = otargetdb.UserList(null); // Always all UMC-users, not only assigned users (AGA-12165)
            for (var j = 0 ; j < otargetuserlist.length ; j++ ) {
                if (otargetuserlist[j].IsSystemUser() && (StrComp(otargetuserlist[j].Name(g_nloc), getString("TEXT7")) == 0)) {
                    otargetuser.value = otargetuserlist[j];
                    // Update: Function rights, method filters, attributes, prefix
                    updateitemproperties(osourceuser, otargetuser.value, tconflict);        // Update properties
                    break;
                }
            }
        } else {
            // Check/Get user name...
            var buserexists = getitembyname(otargetuser, susername, otargetdb.UserList(null));  // Always all UMC-users, not only assigned users (AGA-12165)
            if (!buserexists) continue;
                
            switch(tconflict.nuseroption) {
                // 0: Source overwrites, 1: Target preserved, 2: Target preserved + Mix
                case 0:
                    // Source user is system user
                    if (osourceuser.IsSystemUser()) {
                        otargetuser.value.SetSystemUser(true);                          // Set flag: system user
                    } else {
                        // Target user is system user
                        if (otargetuser.value.IsSystemUser()) {
                            otargetuser.value.SetSystemUser(false);                     // Delete flag: system user
                        }
                    }
                    break;
                case 1:
                case 2:
                    break;
            }
            // Update: Function rights, method filters, attributes, prefix
            updateitemproperties(osourceuser, otargetuser.value, tconflict);            // Update properties
        }
        if (otargetuser.value != null) {
            // Add users (source, target) to user list
            tuserlist.push(new usertype_tsourcetargettype(osourceuser.GUID(), otargetuser.value.GUID(), !buserexists));               
        }
    }
}

function updateitemproperties(osourceitem, otargetitem, tconflict) {
    var bissystemuser = false; 
    // Check if target user = system user
    if (otargetitem.KindNum() == Constants.CID_USER) {
        bissystemuser = otargetitem.IsSystemUser();
    } else {
        bissystemuser = false;
    }
    
    switch(tconflict.nuseroption) {
        // 0: Source overwrites, 1: Target preserved, 2: Target preserved + Mix
        case 0:
            if (!bissystemuser) {
                // Function rights
                otargetitem.SetFunctionRights(osourceitem.FunctionRights());
                // Filters
                otargetitem.SetFilters(osourceitem.GetFilters());
            }
            // Attributes
            for (var nlanguage = 0 ; nlanguage < g_olanguagelist.length ; nlanguage++ ) {
                var ncurrentloc = g_olanguagelist[nlanguage].LocaleId();
                
                var osourceattrlist = osourceitem.AttrList(ncurrentloc);
                var otargetattrlist = otargetitem.AttrList(ncurrentloc);
                
                // Delete (old) attributes
                for (var i = 0 ; i < otargetattrlist.length ; i++ ) {
                    otargetattrlist[i].Delete();
                }
                // Set (new) attributes
                for (var i = 0 ; i < osourceattrlist.length ; i++ ) {
                    var osourceattr = osourceattrlist[i];
                    var otargetattr = otargetitem.Attribute(osourceattr.TypeNum(), ncurrentloc);
                    
                    if (otargetattr.IsValid()) {
                        otargetattr.SetValue(osourceattr.MeasureValue(false), osourceattr.MeasureUnitTypeNum());
                    } else {
                        var sinfo = formatstring3(getString("TEXT4"), g_otargetfilter.ItemKindName(otargetitem.KindNum()), otargetitem.Name(g_nloc), g_otargetfilter.AttrTypeName(otargetattr.TypeNum()));
                        Context.writeOutput(sinfo);
                    }
                }
            }
            // Prefix
            otargetitem.SetPrefix(osourceitem.Prefix());
            break;
        case 2:
            if (!bissystemuser) {
                // Function rights
                var nnewfuncrights = mixitemfunctionrights(otargetitem.FunctionRights(), osourceitem.FunctionRights());
                otargetitem.SetFunctionRights(nnewfuncrights);
                // Filters
                snewfilters = mixitemfilters(otargetitem.GetFilters(), osourceitem.GetFilters());
                otargetitem.SetFilters(snewfilters);
            }
            // Attributes
            for (var nlanguage = 0 ; nlanguage < g_olanguagelist.length ; nlanguage++ ) {
                var ncurrentloc = g_olanguagelist[nlanguage].LocaleId();
                
                var osourceattrlist = osourceitem.AttrList(ncurrentloc);
                // Set attributes
                for (var i = 0 ; i < osourceattrlist.length ; i++ ) {
                    var osourceattr = osourceattrlist[i];
                    var otargetattr = otargetitem.Attribute(osourceattr.TypeNum(), ncurrentloc);
                    
                    if (!(otargetattr.IsMaintained())) {
                        if (otargetattr.IsValid()) {
                            otargetattr.SetValue(osourceattr.MeasureValue(false), osourceattr.MeasureUnitTypeNum());
                        } else {
                            var sinfo = formatstring3(getString("TEXT4"), g_otargetfilter.ItemKindName(otargetitem.KindNum()), otargetitem.Name(g_nloc), g_otargetfilter.AttrTypeName(otargetattr.TypeNum()));
                            Context.writeOutput(sinfo);
                        }
                    }
                }
            }
            // Prefix (not changed)
            break;
        case 1:
            // Not changed !!!
            break;
    }
}

function mixitemfunctionrights(nfuncrights1, nfuncrights2) {
    var nmixfuncrights = nfuncrights1;
    
    for (var i = 0 ; i < nfuncrights2.length ; i++ ) {
        var nfuncright = nfuncrights2[i];
        
        var bnewfuncright = true;
        for (var j = 0 ; j < nfuncrights1.length ; j++ ) {
            if (nfuncright == nfuncrights1[j]) {
                bnewfuncright = false;
                break;
            }
        }
        if (bnewfuncright) {
            nmixfuncrights.push(nfuncright);
        }
    }
    return nmixfuncrights;
}

function mixitemfilters(sfilters1, sfilters2) {
    var smixfilters = sfilters1;
    
    for (var i = 0 ; i < sfilters2.length ; i++ ) {
        var sfilter = sfilters2[i];
        
        var bnewfilter = true;
        for (var j = 0 ; j < sfilters1.length ; j++ ) {
            if (sfilter == sfilters1[j]) {
                bnewfilter = false;
                break;
            }
        }
        if (bnewfilter) {
            smixfilters.push(sfilter);
        }
    }
    return smixfilters;
}

function getitembyname(oitem, sitemname, oitemlist) {
    oitem.value = null;
    
    if (oitemlist.length > 0) {
        for (var i = 0 ; i < oitemlist.length ; i++ ) {
            if (StrComp(sitemname, oitemlist[i].Name(g_nloc)) == 0) {
                
                oitem.value = oitemlist[i];
                return true;
            }
        }
    }
    return false;
}

function setaccessrights(titemlist, groupMap, osourcedb, otargetdb, tconflict, nItemKind) {
    if (titemlist.length > 0 && groupMap.size() > 0) {
        for (var i = 0 ; i < titemlist.length ; i++ ) {
            var osourceitem = osourcedb.FindGUID(titemlist[i].sSourceGuid, nItemKind);
            var otargetitem = otargetdb.FindGUID(titemlist[i].sTargetGuid, nItemKind);
            var bnewtarget = titemlist[i].bnewtarget;
            
            // Check if target user = system user
            var bissystemuser = false;
            if (otargetitem.KindNum() == Constants.CID_USER) {
                bissystemuser = otargetitem.IsSystemUser();
            }           
            if (!bissystemuser) {
                switch(tconflict.naccessrightoption) {
                    // 0: Source overwrites, 1: Target preserved, 2: Source-Target Mix
                    case 0:
                        // Set source access rights
                        copyaccessrights(osourceitem, otargetitem, groupMap);
                        break;
                    case 1:
                        // Set only (source) access rights of NEW users/user groups
                        if (bnewtarget) {
                            copyaccessrights(osourceitem, otargetitem, groupMap);
                        }
                        break;
                    case 2:
                        // Mix (source + target) access rights
                        mixaccessrights(osourceitem, otargetitem, groupMap);
                        break;
                }
            }
        }
    }
}

function copyaccessrights(osourceitem, otargetitem, groupMap) {
    var sourceGroupSet = new java.util.HashSet(groupMap.keySet()); 

    // RWDV
    sourceGroupSet = copyaccessrights2(osourceitem, otargetitem, groupMap, sourceGroupSet, Constants.AR_READ_SUBMIT_WRITE_DELETE);
    // RWD_
    sourceGroupSet = copyaccessrights2(osourceitem, otargetitem, groupMap, sourceGroupSet, Constants.AR_READ_WRITE_DELETE);

    // RW_V
    sourceGroupSet = copyaccessrights2(osourceitem, otargetitem, groupMap, sourceGroupSet, Constants.AR_READ_SUBMIT_WRITE);
    // RW__
    sourceGroupSet = copyaccessrights2(osourceitem, otargetitem, groupMap, sourceGroupSet, Constants.AR_READ_WRITE);

    // R__V
    sourceGroupSet = copyaccessrights2(osourceitem, otargetitem, groupMap, sourceGroupSet, Constants.AR_READ_SUBMIT);
    // R___
    sourceGroupSet = copyaccessrights2(osourceitem, otargetitem, groupMap, sourceGroupSet, Constants.AR_READ);

    // NO = all groups without access right RWD, RW or R (!!!)
    sourceGroupSet = copyaccessrights2(osourceitem, otargetitem, groupMap, sourceGroupSet, Constants.AR_NORIGHTS);

    sourceGroupSet = null;
}

function copyaccessrights2(osourceitem, otargetitem, groupMap, sourceGroupSet, nAccessRights) {
    // Read access rights from source
    var oSourceGroups;
    if (nAccessRights == Constants.AR_NORIGHTS) {
        oSourceGroups = sourceGroupSet.toArray(ArisData.createTypedArray(Constants.CID_GROUP));
    } else {
        oSourceGroups = osourceitem.getAccessRights(nAccessRights);
    }
    // Write access rights to target
    var oTargetGroups = new Array();
    for (var i = 0 ; i < oSourceGroups.length ; i++ ) {
        
        if (groupMap.containsKey(oSourceGroups[i])) {
            oTargetGroups.push(groupMap.get(oSourceGroups[i]));
            sourceGroupSet.remove(oSourceGroups[i]);            // remove groups with these rights from set
        }
    }
    if(oTargetGroups.length > 0) {
        otargetitem.SetAccessRights(oTargetGroups, nAccessRights);    
    }
    oTargetGroups = null;

    return sourceGroupSet;
}

function mixaccessrights(osourceitem, otargetitem, groupMap) {
    var sourceGroupSet = new java.util.HashSet(groupMap.keySet()); 

    // RWDV -> all relevant target groups get this right
    sourceGroupSet = copyaccessrights2(osourceitem, otargetitem, groupMap, sourceGroupSet, Constants.AR_READ_SUBMIT_WRITE_DELETE);
    // RWD_ -> but not for target groups with existing right RWDV
    sourceGroupSet = mixaccessrights2(osourceitem, otargetitem, groupMap, sourceGroupSet, Constants.AR_READ_WRITE_DELETE);

    // RW_V -> but not for target groups with existing right RWDV
    sourceGroupSet = mixaccessrights2(osourceitem, otargetitem, groupMap, sourceGroupSet, Constants.AR_READ_SUBMIT_WRITE);
    // RW__ -> but not for target groups with existing right RWD_
    sourceGroupSet = mixaccessrights2(osourceitem, otargetitem, groupMap, sourceGroupSet, Constants.AR_READ_WRITE);

    // R__V -> but not for target groups with existing right RWDV
    sourceGroupSet = mixaccessrights2(osourceitem, otargetitem, groupMap, sourceGroupSet, Constants.AR_READ_SUBMIT);
    // R___ -> but not for target groups with existing right RWD_
    sourceGroupSet = mixaccessrights2(osourceitem, otargetitem, groupMap, sourceGroupSet, Constants.AR_READ);

    // NO -> there is nothing to do 
    sourceGroupSet = null;
}

function mixaccessrights2(osourceitem, otargetitem, groupMap, sourceGroupSet, nAccessRights) {
    // Read access rights from source
    var oSourceGroups = osourceitem.getAccessRights(nAccessRights);

    // Get relevant target groups
    var oTargetGroups = new Array();
    for (var i = 0 ; i < oSourceGroups.length ; i++ ) {
        
        if (groupMap.containsKey(oSourceGroups[i])) {
            oTargetGroups.push(groupMap.get(oSourceGroups[i]));
            sourceGroupSet.remove(oSourceGroups[i]);            // remove groups with these rights from set
        }
    }
    // Handling of source access right RWD_
    if (nAccessRights == Constants.AR_READ_WRITE_DELETE) {
        var oTargetGroups_RWDV = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_SUBMIT_WRITE_DELETE);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RWDV)  // remove groups with higher access rights

        var oTargetGroups_RWV = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_SUBMIT_WRITE);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RWV)  // remove groups with higher access rights
        // Merge access rights: Add access right 'rwd' to existing 'rwv'
        otargetitem.SetAccessRights(oTargetGroups_RWV, Constants.AR_READ_SUBMIT_WRITE_DELETE);

        var oTargetGroups_RV = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_SUBMIT);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RV)  // remove groups with higher access rights
        // Merge access rights: Add access right 'rwd' to existing 'rv'
        otargetitem.SetAccessRights(oTargetGroups_RV, Constants.AR_READ_SUBMIT_WRITE_DELETE);
        
        oTargetGroups_RWDV = null;
        oTargetGroups_RWV = null;
        oTargetGroups_RV = null;
    }
    
    // Handling of source access right RW_V
    if (nAccessRights == Constants.AR_READ_SUBMIT_WRITE) {
        var oTargetGroups_RWD = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_SUBMIT_WRITE_DELETE);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RWD)  // remove groups with higher access rights
        
        var oTargetGroups_RWD = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_WRITE_DELETE);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RWD)  // remove groups with higher access rights
        // Merge access rights: Add access right 'v' to existing 'rwd'
        otargetitem.SetAccessRights(oTargetGroups_RWD, Constants.AR_READ_SUBMIT_WRITE_DELETE);
        
        oTargetGroups_RWD = null;
    }
    // Handling of source access right RW__
    if (nAccessRights == Constants.AR_READ_WRITE) {
        var oTargetGroups_RWDV = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_SUBMIT_WRITE_DELETE);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RWDV)  // remove groups with higher access rights

        var oTargetGroups_RWD = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_WRITE_DELETE);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RWD)  // remove groups with higher access rights

        var oTargetGroups_RWV = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_SUBMIT_WRITE);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RWV)  // remove groups with higher access rights

        var oTargetGroups_RV = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_SUBMIT);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RV)  // remove groups with higher access rights
        // Merge access rights: Add access right 'w' to existing 'rv'
        otargetitem.SetAccessRights(oTargetGroups_RV, Constants.AR_READ_SUBMIT_WRITE);
        
        oTargetGroups_RWDV = null;
        oTargetGroups_RWD = null;
        oTargetGroups_RWV = null;
        oTargetGroups_RV = null;
    }

    // Handling of source access right R__V
    if (nAccessRights == Constants.AR_READ_SUBMIT) {
        var oTargetGroups_RWDV = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_SUBMIT_WRITE_DELETE);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RWDV)  // remove groups with higher access rights

        var oTargetGroups_RWD = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_WRITE_DELETE);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RWD)  // remove groups with higher access rights
        // Merge access rights: Add access right 'v' to existing 'rwd'
        otargetitem.SetAccessRights(oTargetGroups_RWD, Constants.AR_READ_SUBMIT_WRITE_DELETE);

        var oTargetGroups_RWV = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_SUBMIT_WRITE);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RWV)  // remove groups with higher access rights
        
        var oTargetGroups_RW = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_WRITE);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RW)  // remove groups with higher access rights
        // Merge access rights: Add access right 'v' to existing 'rw'
        otargetitem.SetAccessRights(oTargetGroups_RW, Constants.AR_READ_SUBMIT_WRITE);    
        
        oTargetGroups_RWDV = null;
        oTargetGroups_RWD = null;
        oTargetGroups_RWV = null;
        oTargetGroups_RW = null;
    }
    // Handling of source access right R___    
    if (nAccessRights == Constants.AR_READ) {
        var oTargetGroups_RWDV = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_SUBMIT_WRITE_DELETE);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RWDV)  // remove groups with higher access rights

        var oTargetGroups_RWD = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_WRITE_DELETE);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RWD)  // remove groups with higher access rights

        var oTargetGroups_RWV = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_SUBMIT_WRITE);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RWV)  // remove groups with higher access rights

        var oTargetGroups_RW = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_WRITE);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RW)  // remove groups with higher access rights

        var oTargetGroups_RV = otargetitem.getAccessRights(oTargetGroups, Constants.AR_READ_SUBMIT);
        oTargetGroups = removeGroups(oTargetGroups, oTargetGroups_RV)  // remove groups with higher access rights
        
        oTargetGroups_RWDV = null;
        oTargetGroups_RWD = null;
        oTargetGroups_RWV = null;
        oTargetGroups_RW = null;
        oTargetGroups_RV = null;
    }

    if(oTargetGroups.length > 0) {
        otargetitem.SetAccessRights(oTargetGroups, nAccessRights);    
    }
    oTargetGroups = null;

    return sourceGroupSet;
}

function removeGroups(oGroups, oGroups2Remove) {
    var oGroupsNew = new Array();

    var groups2RemoveSet = new java.util.HashSet(); 
    for (var i = 0 ; i < oGroups2Remove.length ; i++ ) {    
        groups2RemoveSet.add(oGroups2Remove[i]);
    }
    for (var i = 0 ; i < oGroups.length ; i++ ) {
        if (!groups2RemoveSet.contains(oGroups[i])) {
            oGroupsNew.push(oGroups[i]);
        }
    }
    return oGroupsNew;
}    

function getLanguageList(osourcedb, otargetdb) {
    // Intersection of source and target language lists !!!
    var oLangList = new Array();
    
    var oSourceLangList = osourcedb.LanguageList();
    var oTargetLangList = otargetdb.LanguageList();
    for (var i = 0 ; i < oSourceLangList.length ; i++ ) {    
        for (var j = 0 ; j < oTargetLangList.length ; j++ ) {
            var oTargetLang = oTargetLangList[j];
            if (oSourceLangList[i].LocaleId() == oTargetLang.LocaleId()) {
                oLangList.push(oTargetLang);
                break;
            }
        }
    }
    return oLangList;    
}    

function initdatabasesandoptions(osourcedb, otargetdb, tconflict) {
    var stargetdb = new __holder(""); 
    
    var binitok = dialog_selectdb(stargetdb);
    // --- Source DB ---
    if (binitok) {
        // Get DB and user
        osourcedb.value = ArisData.getActiveDatabase();
        var osourceuser = osourcedb.value.ActiveUser();
        var ssourcedb = osourcedb.value.Name(g_nloc);
        var susername = new __holder(osourceuser.Name(g_nloc));
        
        // Check function rights
        binitok = checkfunctionright(osourceuser.FunctionRights(), Constants.AT_USR_ADMIN);
        if (!binitok) {
            var smsgtext = formatstring1(getString("TEXT10"), osourcedb.value.ActiveFilter().AttrTypeName(Constants.AT_USR_ADMIN)) + "\r" + getString("TEXT11");
            Dialogs.MsgBox(smsgtext, Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, getString("TEXT2"));
        }
        // --- Target DB ---
        if (binitok) {
            // Get DB and user
            otargetdb.value = getTargetDB(stargetdb, susername);
            if (otargetdb.value == null) {
                binitok = false;
            }
            
            if (binitok && otargetdb.value.IsValid()) {
                var otargetuser = otargetdb.value.ActiveUser();
                
                if (!otargetuser.IsSystemUser()) {
                    var smsgtext = getString("TEXT12") + "\r" + getString("TEXT13");
                    if (Dialogs.MsgBox(smsgtext, Constants.MSGBOX_BTN_OKCANCEL | Constants.MSGBOX_ICON_QUESTION, getString("TEXT2")) == Constants.MSGBOX_RESULT_OK) {
                        binitok = true;
                    } else {
                        binitok = false;
                    }
                }
            } else {
                binitok = false;
            }
        }
    }
    if (binitok) {
        binitok = dialog_conflict(tconflict);
    }
    return binitok;
}

function getTargetDB(stargetdb, susername) {
    var oTargetDB = null;
    try {
        oTargetDB = ArisData.openDatabase(stargetdb.value);    
    } catch (e) {
    }
    while (oTargetDB == null || !oTargetDB.IsValid()) {
        var spwd = new __holder(""); 
        if (dialog_connect(stargetdb, susername, spwd)) {
            try {
                oTargetDB = ArisData.openDatabase(stargetdb.value, susername.value, spwd.value, "dd838074-ac29-11d4-85b8-00005a4053ff", g_nloc);
            } catch (e) {
            }
        } else {
            break;
        }
    }
    return oTargetDB;
}

function checkfunctionright(nrights, ncurrentright) {
    if (nrights.length > 0) {
        for (var i = 0 ; i < nrights.length ; i++ ) {
            if (ncurrentright == nrights[i]) {
                return true;
            }
        }
    }
    return false;
}

function dialog_conflict(tconflict) {
    var userdialog = Dialogs.createNewDialogTemplate(0, 0, 400, 180, getString("TEXT14"));
    userdialog.GroupBox(20, 10, 360, 80, getString("TEXT15"), "GroupBox2");
    userdialog.OptionGroup("UserOption");
    userdialog.OptionButton(40, 30, 300, 15, getString("TEXT16"), "OptionButton3");
    userdialog.OptionButton(40, 50, 300, 15, getString("TEXT17"), "OptionButton4");
    userdialog.OptionButton(40, 70, 300, 15, getString("TEXT18"), "OptionButton2");
    userdialog.GroupBox(20, 100, 360, 80, getString("TEXT19"), "GroupBox3");
    userdialog.OptionGroup("AccessRightOption");
    userdialog.OptionButton(40, 120, 300, 15, getString("TEXT16"), "OptionButton5");
    userdialog.OptionButton(40, 140, 300, 15, getString("TEXT17"), "OptionButton6");
    userdialog.OptionButton(40, 160, 300, 15, getString("TEXT20"), "OptionButton7");
    userdialog.OKButton();
    userdialog.CancelButton();
    
    var dlg = Dialogs.createUserDialog(userdialog); 
    
    var nuserdlg = Dialogs.show( __currentDialog = dlg);      // Show dialog (wait for ok).
    
    // User option
    // 0: Source overwrites, 1: Source overwrites + Mix, 2: Target preserved, 3: Target preserved + Mix
    tconflict.nuseroption   = dlg.getDlgValue("UserOption");                    // 0: Source overwrites, 1: Target preserved, 2: Source-Target Mix
    // Func right option
    tconflict.naccessrightoption = dlg.getDlgValue("AccessRightOption");        // 0: Source overwrites, 1: Target preserved, 2: Source-Target Mix

    if (nuserdlg != 0) {
        return true;
    }
    return false;
}

function dialog_selectdb(stargetdb) {
    g_sdblist = getdatabaselist();
    
    var userdialog = Dialogs.createNewDialogTemplate(420, 130, getString("TEXT23"));
    userdialog.GroupBox(20, 7, 380, 100, getString("TEXT24"), "GroupBox1");
    userdialog.Text(40, 25, 340, 40, getString("TEXT27"), "Text3");
    userdialog.Text(40, 75, 130, 14, getString("TEXT26"), "Text2");
    userdialog.DropListBox(170, 75, 210, 100, g_sdblist, "DB_ListBox");
    userdialog.OKButton();
    userdialog.CancelButton();
    //  userdialog.HelpButton("HID_e6ff0fd0_eae7_11d8_12e0_9d2843560f51_dlg_01.hlp");  
    
    var dlg = Dialogs.createUserDialog(userdialog); 
    var nuserdlg = 1;
    var binputok = false;
    dlg.setDlgEnable("Server_ListBox", false);
    
    while (! (binputok || nuserdlg == 0)) {
        nuserdlg = Dialogs.show( __currentDialog = dlg);        // Show dialog (wait for ok).
        
        if (! (nuserdlg == 0)) {
            if (dlg.getDlgValue("DB_ListBox") >= 0) {                                   // Check wether database selected
                stargetdb.value = g_sdblist[dlg.getDlgValue("DB_ListBox")];             // Get database name
                if (StrComp(stargetdb.value, ArisData.getActiveDatabase().Name(g_nloc)) == 0) {
                    binputok = false;
                    Dialogs.MsgBox(getString("TEXT28"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, getString("TEXT2"));
                } else {
                    binputok = true;
                }
            } else {
                binputok = false;
                Dialogs.MsgBox(getString("TEXT29"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, getString("TEXT2"));
            }
        }
    }
    
    if (nuserdlg != 0) {
        return true;
    }
    return false;
}

function getdatabaselist() {
    var sdatabaselist   = ArisData.GetDatabaseNames();   
    sdatabaselist.sort( sortByName );
    return sdatabaselist;
}

var collator = function() {// ANUBIS 460232 fix; zona
    try {
        var langList = ArisData.getActiveDatabase().LanguageList();
        if (langList.length == 0) return null;
        var locale = langList[0].convertLocale(g_nloc).getLocale();
        return java.text.Collator.getInstance(locale); 
    } catch(e) {
        return null;
    }
}();

function sortByName(a, b) {// ANUBIS 460232 fix; zona
    var s1 = new java.lang.String( a );
    var s2 = new java.lang.String( b );

    if (collator != null) {
        return collator.compare(s1, s2);
    }
    return s1.compareToIgnoreCase(s2);
}

function dialog_connect(sdatabase, suser, spwd) {
    var userdialog = Dialogs.createNewDialogTemplate(0, 0, 420, 231, getString("TEXT30"));
    // %GRID:10,7,1,1
    userdialog.Text(20, 10, 380, 28, getString("TEXT31"), "Text1");
    userdialog.Text(20, 40, 150, 14, getString("TEXT33"), "Text4");
    userdialog.Text(180, 40, 220, 14, sdatabase.value, "Text5");
    userdialog.Text(20, 60, 380, 14, "___________________________________________________________________________", "Text6");
    userdialog.Text(20, 90, 150, 14, getString("TEXT34"), "Text7");
    userdialog.TextBox(180, 90, 220, 21, "UserText");
    userdialog.Text(20, 120, 140, 14, getString("TEXT35"), "Text8");
    userdialog.TextBox(180, 120, 220, 21, "PwdText", - 1);
    userdialog.OKButton();
    userdialog.CancelButton();
    //  userdialog.HelpButton("HID_e6ff0fd0_eae7_11d8_12e0_9d2843560f51_dlg_02.hlp");  
    
    var dlg = Dialogs.createUserDialog(userdialog); 
    dlg.setDlgText("UserText", suser.value);
    dlg.setDlgText("PwdText", spwd.value);
    
    var nuserdlg = Dialogs.show( __currentDialog = dlg);      // Showing dialog and waiting for confirmation with OK
    
    suser.value = dlg.getDlgText("UserText");
    spwd.value = dlg.getDlgText("PwdText");
    
    if (nuserdlg != 0) {
        return true
    }
    return false;
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
