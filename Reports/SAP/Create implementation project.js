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

DATA = function (p1, p2, p3, p4, p5, p6) {
    this.sProjectId = p1;
    this.sSystemId  = p2;
    this.sUser      = p3;
    this.sPwd       = p4;
    this.sLanguage  = p5;
    this.sClient    = p6;
}

const c_sDbName = "Rollout Support_Tmp_" + (new Date()).getTime();  // BLUE-11214

main();

/***********************************************************************************************/

function main()
{
    var sourceGroup = ArisData.getSelectedGroups()[0];
    if (isMainGroup(sourceGroup)) return;
    
    var tData = getUserData();
    if (tData == null) return;
    
    var db = createDatabase();
    if (db == null) return;
    
    try {
        if (downloadProject(db, tData, 10)) {
            var targetGroup = createVariantCopy(sourceGroup, 80);
            transformTarget(db, targetGroup, 90);    
        }
    } catch(e) {
        var sError = "" + e.message;
        var nIndex = sError.indexOf(":");
        if (nIndex >= 0) sError = sError.substr(nIndex+1, sError.length-nIndex); 
        Dialogs.MsgBox(sError, Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_ERROR, Context.getScriptInfo(Constants.SCRIPT_TITLE));
    }   
    deleteDatabase(db);
}

function isMainGroup(oGroup) {
    var rootGroup = ArisData.getActiveDatabase().RootGroup();
    var result = rootGroup.IsEqual(oGroup);
    if (result) {
        Dialogs.MsgBox(getString("ERROR_MSG_ROOTGROUP"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, Context.getScriptInfo(Constants.SCRIPT_TITLE));
    }
    return result;
}

function getUserData() 
{
    var userdialog = Dialogs.createNewDialogTemplate(0, 0, 470, 200, getString("PROJECT_AND_LOGIN_DATA"));
    
    userdialog.GroupBox(10, 10, 450, 70, getString("PROJECT_DATA"));
    userdialog.Text(35, 27, 200, 15, getString("PROJECT_ID"));
    userdialog.TextBox(235, 25, 200, 21, "txtProjectId");
    userdialog.Text(35, 52, 200, 15, getString("SYSTEM_ID"));
    userdialog.TextBox(235, 50, 200, 21, "txtSystemId");
    
    userdialog.GroupBox(10, 90, 450, 120, getString("LOGIN_DATA"));
    userdialog.Text(35, 107, 200, 15, getString("USER"));
    userdialog.TextBox(235, 105, 200, 21, "txtUser");
    userdialog.Text(35, 132, 200, 15, getString("PWD"));
    userdialog.TextBox(235, 130, 200, 21, "txtPwd", -1);
    userdialog.Text(35, 157, 200, 15, getString("LANGUAGE"));
    userdialog.TextBox(235, 155, 200, 21, "txtLanguage");
    userdialog.Text(35, 182, 200, 15, getString("CLIENT"));
    userdialog.TextBox(235, 180, 200, 21, "txtClient");
    
    userdialog.OKButton();
    userdialog.CancelButton();
    userdialog.HelpButton("HID_62111cc0_e3c4_11e2_5bf1_c62d313f4e9b_dlg_01.hlp");  
    
    var sProjectId = ""; var sSystemId = ""; var sUser = ""; var sPwd = ""; var sLanguage = ""; var sClient = "";

    while (true) {
        var dlg = Dialogs.createUserDialog(userdialog); 
        
        // Read dialog settings from config    
        var sSection = "SCRIPT_62111cc0_e3c4_11e2_5bf1_c62d313f4e9b";
        ReadSettingsDlgText_2(dlg, sSection, "txtProjectId", sProjectId);
        ReadSettingsDlgText_2(dlg, sSection, "txtSystemId", sSystemId);
        ReadSettingsDlgText_2(dlg, sSection, "txtUser", sUser);
        ReadSettingsDlgText_2(dlg, sSection, "txtLanguage", sLanguage);
        ReadSettingsDlgText_2(dlg, sSection, "txtClient", sClient);
        
        var nuserdlg = Dialogs.show( __currentDialog = dlg);
        if (nuserdlg == 0) return null;
        
        sProjectId = dlg.getDlgText("txtProjectId");
        sSystemId  = dlg.getDlgText("txtSystemId");
        sUser      = dlg.getDlgText("txtUser");
        sPwd       = dlg.getDlgText("txtPwd");
        sLanguage  = dlg.getDlgText("txtLanguage");
        sClient    = dlg.getDlgText("txtClient");
        
        if (sProjectId == "" || sSystemId == "" || sUser == "" || sPwd == "" || sLanguage == "" || sClient == "") {
            Dialogs.MsgBox(getString("DLG_ERROR_MSG"), Constants.MSGBOX_BTN_OK, getString("PROJECT_AND_LOGIN_DATA"));          
        } else { 
            WriteSettingsDlgText(dlg, sSection, "txtProjectId");
            WriteSettingsDlgText(dlg, sSection, "txtSystemId");
            WriteSettingsDlgText(dlg, sSection, "txtUser");
            WriteSettingsDlgText(dlg, sSection, "txtLanguage");
            WriteSettingsDlgText(dlg, sSection, "txtClient");
            
            return new DATA(sProjectId, sSystemId, sUser, sPwd, sLanguage, sClient);
        }
    }
    return null;
    
    function ReadSettingsDlgText_2(dlg, sSection, sField, sDefault) {
        if (sDefault != "") {
            dlg.setDlgText(sField, sDefault);
        } else {
            ReadSettingsDlgText(dlg, sSection, sField, sDefault);
        }
    }
}

function transformTarget(db, targetGroup, percentFinished)
{
    Context.writeStatus(getString("STATUS_TRANFORM_TARGET"), percentFinished);
    
    var Solar = Context.getComponent("Solar");
    var result = Solar.transformTemplate(targetGroup, db);
    if (result.getLogFileName() != null && result.getLogFileName().length() > 0)
    {
        saveLogFile(result.getLogFileName(), true);       
    }
    else
    {
        var ooutfile = Context.createOutputObject ();
        ooutfile.OutputTxt(getString("RESULT_") + result.getResult() + "\n");
        ooutfile.OutputTxt(getString("MESSAGE_") + result.getErrorMessage() + "\n");
        ooutfile.WriteReport();  
    }    
}

function createVariantCopy(sourceGroup, percentFinished)
{
    Context.writeStatus(getString("STATUS_CREATE_VARIANT_COPY"), percentFinished);
    
    var source = new Array();
    source[0] = sourceGroup;
    var merge = Context.getComponent("Merge");    
    var targetGroup = sourceGroup.Parent().CreateChildGroup("VariantCopy", -1);
    merge.createVariant(source, targetGroup);
    return targetGroup;
}

function createDatabase()
{
    var server = Context.getComponent("ServerAdmin");   
    server.createArisDatabase(c_sDbName, false);     
    return ArisData.openDatabase(c_sDbName, false);
}

function deleteDatabase()
{
    var server = Context.getComponent("ServerAdmin");   
    server.deleteArisDatabase(c_sDbName, null);     
}

function downloadProject(database, tData, percentFinished)
{
    Context.writeStatus(getString("STATUS_DOWNLOAD_PROJECT"), percentFinished);
    
    var Solar = Context.getComponent("Solar");
    var options = Solar.createOptions(database.RootGroup(), tData.sProjectId, tData.sSystemId);
    options.setSAPLogonUser(tData.sUser);
    options.setSAPLogonPassword(tData.sPwd);
    options.setSAPLogonLanguage(tData.sLanguage);
    options.setSAPLogonClient(tData.sClient);

    var result = Solar.synchronize(database.RootGroup(), options);
    if (result.getLogFileName() != null && result.getLogFileName().length() > 0)
    {
        saveLogFile(result.getLogFileName(), false);     
        return true;
    }
    else
    {
        var ooutfile = Context.createOutputObject();
        ooutfile.OutputTxt(getString("RESULT_") + " " + result.getResult() + "\n");
        ooutfile.OutputTxt(getString("MESSAGE_") + " " + result.getErrorMessage() + "\n");
        ooutfile.WriteReport(); 
        return false;
    }
}

function saveLogFile(sFnm, bDisplay) 
{    
    try 
    {   
        var inputStream = null;
        var source = new java.io.File(sFnm);
        inputStream = new java.io.FileInputStream(source);
        var fileName = source.getName();
        if (bDisplay) {
            Context.setSelectedFile(fileName);
        }
        var buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, source.length());
        var i = inputStream.read(buffer);
        inputStream.close();
        inputStream = null;
        Context.setFile(fileName, Constants.LOCATION_OUTPUT, buffer);
    }
    catch(e) 
    {
        if(inputStream!=null) inputStream.close(); 
        return null;
    }
    Context.addOutputFileName(fileName);
}
