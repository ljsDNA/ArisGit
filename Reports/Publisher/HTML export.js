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

var oBusinessPublisher=Context.getComponent("BusinessPublisher");
var databaseToexport = ArisData.getActiveDatabase();
var groupSelection = ArisData.getSelectedGroups();
var modelSelection = ArisData.getSelectedModels();

Context.setSelectedFile("index.htm")
var output = Context.createOutputObject()
var fileLocalPath = output.getCurrentPath()
output.WriteReport()

var selectedLocaleId = getProperty("WP_SelectedLocaleId",Context.getSelectedLanguage());
var sLanguageWithFallback = getProperty("languageWithFallback",null);
if(sLanguageWithFallback != null) {
	localeIdWithFallback = getLocaleIdForLanguageWithFallback(sLanguageWithFallback);
	if(localeIdWithFallback != null) {
		selectedLocaleId = localeIdWithFallback;
	}
} 

oBusinessPublisher.setHtmlExportProperty("WP_InitialScale", getProperty("WP_InitialScale","100"));
oBusinessPublisher.setHtmlExportProperty("WP_ZoomSteps", getProperty("WP_ZoomSteps","25,50,125"));
oBusinessPublisher.setHtmlExportProperty("WP_AssigLevel", getProperty("WP_AssigLevel","0"));
oBusinessPublisher.setHtmlExportProperty("WP_DocsDir", getProperty("WP_DocsDir","."));
oBusinessPublisher.setHtmlExportProperty("WP_LinkList",getProperty("WP_LinkList",""));
oBusinessPublisher.setHtmlExportProperty("WP_ModelSort", getProperty("WP_ModelSort","0"));
oBusinessPublisher.setHtmlExportProperty("WP_ObjectSort", getProperty("WP_ObjectSort","0"));
oBusinessPublisher.setHtmlExportProperty("WP_AttributeSort", getProperty("WP_AttributeSort","0"));
oBusinessPublisher.setHtmlExportProperty("WP_SelectedMethodLanguage", getProperty("WP_SelectedMethodLanguage","en_US"));
oBusinessPublisher.setHtmlExportProperty("WP_SelectedLocaleId", selectedLocaleId);
oBusinessPublisher.setHtmlExportProperty("WP_Filter", getProperty("WP_Filter",Context.getScriptInfo(12)));
oBusinessPublisher.setHtmlExportProperty("WP_SelectedOutputPath", fileLocalPath.getAbsolutePath()); 
oBusinessPublisher.setHtmlExportProperty("WP_UpdateWeb", getProperty("WP_UpdateWeb","false"));
oBusinessPublisher.setHtmlExportProperty("WP_CopyDocs", getProperty("WP_CopyDocs","false"));
oBusinessPublisher.setHtmlExportProperty("WP_BlackWhite", getProperty("WP_BlackWhite","false"));
oBusinessPublisher.setHtmlExportProperty("WP_Transparent", getProperty("WP_Transparent","false"));
oBusinessPublisher.setHtmlExportProperty("WP_UsePrintScale", getProperty("WP_UsePrintScale","false"));
oBusinessPublisher.setHtmlExportProperty("WP_TreeView", getProperty("WP_TreeView","group_view"));
oBusinessPublisher.setHtmlExportProperty("WP_ExportObjects", getProperty("WP_ExportObjects","true"));
oBusinessPublisher.setHtmlExportProperty("WP_ObjectTypes", getProperty("WP_ObjectTypes",""));
oBusinessPublisher.setHtmlExportProperty("WP_ConsiderHierarchies", getProperty("WP_ConsiderHierarchies","true"));
oBusinessPublisher.setHtmlExportProperty("WP_UsePrintScale", getProperty("WP_UsePrintScale","false"));
oBusinessPublisher.setHtmlExportProperty("WP_QuoteOutput", getProperty("WP_QuoteOutput","false"));


oBusinessPublisher.setSelectedGroupItems(groupSelection);
oBusinessPublisher.setSelectedModelItems(modelSelection);

var progressSting = oBusinessPublisher.getProgressMessage(databaseToexport);
Context.writeStatus(progressSting);

var nDlgResult = -1;
var keyOK = false;
var firstAttemp = true;
var finished = false;
var pathToLayout = getProperty("WP_Layout", "ed514f40-dc0f-11da-1db1-0014220e1757");
var htmlExportSuccessful = oBusinessPublisher.createHTMLExport(databaseToexport, pathToLayout);

if(nDlgResult!=0 && htmlExportSuccessful) {

    //add all created files to the report file transfer:
    var aCreatedFiles = fileLocalPath.listFiles()
    for(var i=0; i<aCreatedFiles.length; i++)
    {
        if(aCreatedFiles[i].isFile())
            Context.addOutputFileName( aCreatedFiles[i].getName() )
    }
    Context.storeLargeResult()
}

else if(nDlgResult==0) {
    Context.setProperty( Constants.PROPERTY_SHOW_OUTPUT_FILE, false );
    Context.setProperty( Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false );
}

var isFinished = function () {
    finished = oBusinessPublisher.isFinished();
}


function showOutputOptionsDialog() {
    while (!keyOK && nDlgResult!=0) {
        var ofilter     = ArisData.getActiveDatabase().ActiveFilter();
        var userdialog  = Dialogs.createNewDialogTemplate(0, 0, 610, 100, getString("TEXT_DLG_TITLE_ENTER_KEY"));
    
        if (!firstAttemp) {
            userdialog.Text(25, 18, 400, 15, getString("TEXT_DLG_KEY_NOT_CORRECT"));
        }
        userdialog.Text(25, 42, 170, 15, getString("TEXT_DLG_ENTER_KEY"));
        userdialog.TextBox(220, 42, 350, 21, "VAR_TEXTBOX");
        
        userdialog.OKButton();
        userdialog.CancelButton();
        
        firstAttemp = false;
        
        dlg = Dialogs.createUserDialog(userdialog);
        nDlgResult = Dialogs.show( dlg );
        
        if(nDlgResult!=0) {
            s = dlg.getDlgText("VAR_TEXTBOX");
            keyOK = oBusinessPublisher.uploadKey(s);
        }
        
    }
        
}

function getProperty(propertyKey, defaultValue) {
    var propertyValue = Context.getProperty(propertyKey); 
    if(propertyValue != null) {
        return propertyValue;
    } else {
        return defaultValue;
    }
}

function getLocaleIdForLanguageWithFallback(sLanguage) {
	var langList = databaseToexport.LanguageList();
	if (sLanguage) {
		sLanguage = String(sLanguage);
		sLanguage = ("" + sLanguage.replace(/^\s+|\s+$/g, ""));
		if (sLanguage.length > 0){
			try {
                var jLang = org.apache.commons.lang3.LocaleUtils.toLocale(sLanguage);
                for (index in langList) {
                    var dbLang = langList[index];
                    var dbLocaleInfo = dbLang.LocaleInfo();
                    var dbLocale = dbLocaleInfo.getLocale();
                    var comparisonResult = jLang.getCountry() == "" ?
                            jLang.getLanguage() == dbLocale.getLanguage() :
                                jLang.equals(dbLocale);
                    if (comparisonResult) {
                        return "" + dbLocaleInfo.getLocaleID().toString();
                    }
                }
            } catch(exception) {
                // invalid language
            }
		}
	}
	// language not found in db, use default as fallback
	var fallbackLocaleId = null;
	var fallbackLanguage = null;
	for (index in langList) {
		var dbLang = langList[index];
		var dbLocaleInfo = dbLang.LocaleInfo();
		if (dbLang.isDefault()) {
			fallbackLanguage = dbLocaleInfo.getLocale().toString();
			fallbackLocaleId = "" + dbLocaleInfo.getLocaleID().toString();
		}
	}
	Context.setProperty("warning", "Language '" + sLanguage + "' is missed in database; Default language '" + fallbackLanguage + "' will be used instead. ");
	return fallbackLocaleId;
}