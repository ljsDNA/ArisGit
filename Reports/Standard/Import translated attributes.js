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

// BLUE-17650 - Import/Usage of 'convertertools.js' removed


// Name of the error file (transfered to the client and shown)
var g_sErrorFile = "ERROR_Import_translated_attributes_" +Date.now() +".txt"
// Content of the error file
var g_sErrorText = "";

// global declarations
var g_nloc = Context.getSelectedLanguage();
var g_btouch = false;

var g_ntargetlangArr = [];
var slanguages = [];
var nlanguages = [];
var olanguages = getlanguages();

function main()
{
    var simportfile = new __holder("");
    if (getimportfile(simportfile)) {        

        for (var langIndex = 0; langIndex < olanguages.length; langIndex++) {
            langLocale = olanguages[langIndex].LocaleId();
            slanguages.push(getlanguagename(olanguages[langIndex]));
            nlanguages.push(langLocale);
        }

        var byteOutputObj = simportfile.value.getData();
        var app = Context.getExcelReader(byteOutputObj);
        var sheets = app.getSheets();

        var presentlangArr = analyzeLanguagesInFile(sheets);

        if ( userdlg(presentlangArr) ) {
            
            //call external script 'Import translated attributes (core)' and send the config
            var config = createImportConfig(presentlangArr);
            var results = importTranslatedAttributes(config, byteOutputObj);          

            if (results != undefined) results.forEach(function(result, idx) {
                Dialogs.MsgBox(result.message, Constants.MSGBOX_BTN_OK, getString("TEXT10"));
            });            

            Context.setScriptError(Constants.ERR_NOFILECREATED);
        } else {
            Context.setScriptError(Constants.ERR_CANCEL);
        }
        
        if (g_sErrorText.length > 0 && Context.getEnvironment() != Constants.ENVIRONMENT_TC) {
            var oOut = Context.createOutputObject(Constants.OUTTEXT, g_sErrorFile);
            oOut.OutputLn(g_sErrorText, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            oOut.WriteReport();
            Dialogs.shell(g_sErrorFile);
            Context.deleteFile(g_sErrorFile);
        }
    } else {
        Dialogs.MsgBox(getString("TEXT14"), Constants.MSGBOX_BTN_OK, getString("TEXT10"));
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}

function importTranslatedAttributes(config, byteOutputObj) {
    var report = Context.getComponent("Report");

    //getAnySelectedStartItems() is used only for creating reportInfo object. It is manadatory parameter. Script can be started only on some item.
    var reportInfo = report.createExecInfo("612ff240-01c5-11ec-02b3-0a002700000f", getSelectedItems().getAnySelectedStartItems(), g_nloc);
    reportInfo.setProperty ("pluginData", JSON.stringify(config));
    reportInfo.setPropertyBytes ("byteOutput", byteOutputObj);
    reportInfo.setProperty ("command", "import");
    
    var reportResult =  report.execute(reportInfo);   

    var errors = JSON.parse(reportResult.getProperty("errors"));
    if (errors != undefined && errors != "") g_sErrorText += errors;

    return JSON.parse(reportResult.getProperty("results"));
}

function createImportConfig(presentlangArr) {
    return {
        srcLang: g_nloc,
        trgLangs: g_ntargetlangArr,
        presentlangArr: presentlangArr,
        btouch: g_btouch
    };
}

function getSelectedItems() {
    var selectedItems = {
        db : ArisData.getSelectedDatabases(),
        groups : ArisData.getSelectedGroups(),
        models : ArisData.getSelectedModels(),
        objects : ArisData.getSelectedObjDefs(),
        isEmpty : function () {
                    return this.db.length == 0 && this.groups.length == 0 && this.models.length == 0 && this.objects.length == 0;
                },
        //function getAnySelectedStartItems() is used only for create reportInfo object later on. Without it, it returns null.
        getAnySelectedStartItems : function () {
                    if (this.db.length != 0) return this.db;
                    if (this.groups.length != 0) return this.groups;
                    if (this.models.length != 0) return this.models;
                    if (this.objects.length != 0) return this.objects;
                }
    }
    return selectedItems;
}

function optionsDialog(presentlangArr) {

    var bOkClicked = false;

    this.getPages = function() {

        var userdialog = Dialogs.createNewDialogTemplate(0, 0, 400, 165, getString("TEXT10"));
        // %GRID:10,7,1,1
        userdialog.GroupBox(30, 15, 340, 300, getString("TEXT15"), "GroupBox1");
        userdialog.Table(60,30,280,265,
            [getString("TEXT18"), getString("TEXT19")],
            [Constants.TABLECOLUMN_BOOL_EDIT, Constants.TABLECOLUMN_SINGLELINE],
            [20,80],
            "dstLangs" ,
            Constants.TABLE_STYLE_DEFAULT);
        userdialog.CheckBox(30, 320, 20, 14, "", "CheckTouch");
        userdialog.Text(60, 320, 310, 28, getString("TEXT17"));
        //userdialog.CheckBox(30, 85, 20, 14, "", "CheckTouch");
        //userdialog.Text(60, 85, 310, 28, getString("TEXT17"));
        userdialog.OKButton();
        userdialog.CancelButton();

        return [userdialog];
    }

    this.init = function(aPages) {
        var dlgPage = this.dialog.getPage(0);
        var items = [];

        for (var i = 0; i < presentlangArr.length; i++) {
            var idOfLang = presentlangArr[i];

            for (var j = 0; j < nlanguages.length; j++) {
                if (nlanguages[j] == idOfLang) {
                    var item = [];
                   //  var isSelected = Context.getProfileInt(sSection, "lang_" + nlanguages[i], 0);
                    item.push(false);
                    item.push(slanguages[j]);
                    items.push(item);
                    break;
                }
            }
        }
        dlgPage.getDialogElement("dstLangs").setItems(items);
    }

    this.onClose = function(pageNumber, bOk) {
        bOkClicked = bOk;
    }

    this.getResult = function() {
        if (bOkClicked) {
            var dlgPage = this.dialog.getPage(0);
            var items = dlgPage.getDialogElement("dstLangs").getItems();
            var targetLangs = [];
            for (var i = 0; i < items.length; i++) {
                var isSelected = items[i][0];
                var languageCode = presentlangArr[i];
                if (isSelected == 1) {
                    targetLangs.push(languageCode);
                }
                // Context.writeProfileInt(sSection, "lang_" + languageCode, isSelected);
            }
            var checkTouch = dlgPage.getDialogElement("CheckTouch").isChecked();
            return {localeIds: targetLangs, checkTouch: checkTouch};
        }
    }
}

function userdlg(presentlangArr)
{

    var dialogResult = getLangsFromUser(presentlangArr);
    // var dlg = Dialogs.createUserDialog(userdialog);

    // Read dialog settings from config
    // var sSection = "SCRIPT_f86fc130_eaea_11d8_12e0_9d2843560f51";
    // ReadSettingsDlgValue(dlg, sSection, "TargetLang", 0);
    // ReadSettingsDlgValue(dlg, sSection, "CheckTouch", 0);

    // var nuserdlg = Dialogs.show( __currentDialog = dlg);		// Show dialog (wait for ok).

    // Write dialog settings to config
    // if (nuserdlg != 0) {
    //     WriteSettingsDlgValue(dlg, sSection, "TargetLang");
    //     WriteSettingsDlgValue(dlg, sSection, "CheckTouch");
    // }

    if (dialogResult != null) {
        g_btouch = dialogResult.checkTouch;
        g_ntargetlangArr = dialogResult.localeIds;
    }
    return dialogResult != null;
}


function getlanguages()
{
    var olanguages = [];
    var olanguagelist = ArisData.getActiveDatabase().LanguageList();

    // Selected language
    for (var i = 0; i < olanguagelist.length; i++) {
        if (olanguagelist[i].LocaleId() == g_nloc) {
            olanguages[olanguages.length] = olanguagelist[i];
            break;
        }
    }

    // all other languages
    for (var i = 0 ; i < olanguagelist.length; i++) {
        if (olanguagelist[i].LocaleId() != g_nloc) {
            olanguages[olanguages.length] = olanguagelist[i];
        }
    }
    return olanguages;
}

function getlanguagename(olanguage) {
    // TANR 241433
    var oLocaleInfo = olanguage.LocaleInfo()
    var oLocale = oLocaleInfo.getLocale();

    return oLocale.getDisplayName();
}

function getimportfile(sImportFile)
{
    // Init
    var sdefname = "";
    var sdefext  = "*.xls!!Excel|*.xls; *.xlsx||";     // BLUE-10385 Support XLSX format
    var sdefdir  = Context.getProfileString("Report", "Output Directory", "");
    var stitle   = getString("TEXT16");

    var sfiles = Dialogs.BrowseForFiles(sdefname, sdefext, sdefdir, stitle, 0);

    if (sfiles != null && sfiles.length > 0) {
        sImportFile.value = sfiles[0];

        return true;
    }
    return false;
}

function writeMsg(smsg) {
    Context.writeOutput(smsg);

    if (g_sErrorText.length > 0) g_sErrorText += "\r\n";
    g_sErrorText += smsg;
}

function getLangsFromUser(presentlangArr) {
    return Dialogs.showDialog(new optionsDialog(presentlangArr), Constants.DIALOG_TYPE_ACTION, getString("TEXT10"));
}

function analyzeLanguagesInFile(sheets){

    var presentlangArr = [];
    // var yposattrArray = [];
    

    for (var i = 0; i < sheets.length; i++) {
        var currentSheet = sheets[i];
		var ypos1 = 0;
        while (currentSheet.getCell(0, ypos1) != null) {
            var cell = currentSheet.getCell(1, ypos1);
            if(cell == null) {
                ypos1++;        // Anubis 342158
                continue;
            }
            var svalue = cell.getCellValue();
            var parsedInt = parseInt(svalue);

            for (var j = 0; j < nlanguages.length; j++) {
                if (parsedInt == nlanguages[j]) {
                    // yposattr = ypos1;
                    //  yposattrArray.push(ypos1);
                    var isPresent = false;
                    for (var langArrIter = 0; langArrIter < presentlangArr.length; langArrIter++) {
                        if (presentlangArr[langArrIter] == parsedInt) {
                            isPresent = true;
                            break;
                        }
                    }
                    if (!isPresent){
                        presentlangArr.push(parsedInt);
                    }
                    break;
                }
            }
            ypos1++;
        }
    }

    return presentlangArr;
}

main();
