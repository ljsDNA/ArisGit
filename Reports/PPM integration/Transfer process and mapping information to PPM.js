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


// dialog y offsets
var gDialogLineY = 0;
const gHEADER = 50;
const gTEXT = 25;
const gINPUT = 15;
const gSAME = 0;
const gSTART = 15;

const goValueAccess = Context.getParameterValueAccess();

// credentials
var gsUserName = goValueAccess.getParameterValue("USER");

// PPM
const gsUrl = goValueAccess.getParameterValue("URL");

// Client
const gsClient =  goValueAccess.getParameterValue("CLIENT");

// selected locale for report
const gnLocale = Context.getSelectedLanguage();  

var SHOW_DIALOGS = Context.getProperty("INTERNAL_CALL") == null;

main();

function main() {
    
    try {  
        var oSelEpc;
        if (SHOW_DIALOGS) { 
            var oSelEpcs = ArisData.getSelectedModels(); //  Models EPC            
            if(oSelEpcs.length > 1) {
                Dialogs.MsgBox(getString("TEXT_ONLY_ONE_EPC"));
                Context.setScriptError(Constants.ERR_CANCEL);
                return;                  
            }        
            oSelEpc = oSelEpcs[0];
            var settings = Dialogs.showDialog(new optionsDialog(), Constants.DIALOG_TYPE_WIZARD, Context.getScriptInfo(Constants.SCRIPT_TITLE));
            if (!settings.bOk) {
                // stop script if cancel was pressed
                Dialogs.MsgBox(getString("TEXT_CANCELLED"));
                Context.setScriptError(Constants.ERR_CANCEL);
                return;                
            }    
        }
        else {
            var oSelEpcs = ArisData.getSelectedModels(); //  Models EPC            
            oSelEpc = oSelEpcs[0];
            settings = {
                "sUserName":Context.getProperty("sUserName"), 
                "sPassword":Context.getProperty("sPassword"), 
                "sUrl":Context.getProperty("sUrl"), 
                "sClient":Context.getProperty("sClient"),  
                "bOk": true
            };            
        }
    
       var sEpcGUID = oSelEpc.GUID();            
       var stransferData = createTransferData(oSelEpc)    
       
       var language = getLanguage();
       
       // this is a kind of chakc user and password
       restCall((settings.sUrl + "/ppmserver/" + settings.sClient + "/rest/conformance/v1/configuration") + (language == null ? "" : "?language=" + language), "OPTIONS", "json", basicAutehntication, settings, stransferData);
       // post data to ppm server
       restCall((settings.sUrl + "/ppmserver/" + settings.sClient + "/rest/conformance/v1/configuration") + (language == null ? "" : "?language=" + language), "POST", "json", basicAutehntication, settings, stransferData);
       if (SHOW_DIALOGS) { 
           Dialogs.MsgBox(getString("TEXT_IMPORT_SUCCESSFUL"));                                 
       }    
       Context.setProperty("reportstate", "successful");
    }  
    catch(ex) {              
        Context.writeLog(ex.toString());            
        if(ex instanceof Exception) {  
            // expected exceptions
            var sMessage = ex.iCode == undefined ?  ex.sMessage : commonUtils.attsall.formatString(getString("TEXT_ERROR_MESSAGE"), [ex.iCode, ex.sMessage]);
            if(SHOW_DIALOGS) {
                Dialogs.MsgBox(formatMessage(sMessage, 60), Constants.MSGBOX_ICON_ERROR, getString("TEXT_ERROR.DBT"));  
            }
            Context.setProperty("reportstate", sMessage);            
            return;
        }
        // unexpected execptions
        Context.setProperty("reportstate", ex.message);        
        throw ex;
    }     
}    

function getLanguage() {               
    var languageList =ArisData.getActiveDatabase().LanguageList();
    for(var i = 0; i < languageList.length; i++) {
        var language = languageList[i];
        var localeInfo = language.LocaleInfo();
        if(language.LocaleId() == gnLocale) {
            return localeInfo.getLocale().getLanguage();
        }
    }        
    return null;
}

/*
* After a word a line line has more then iWidth chars a new line will started.
* sMessage: message could have multi lines.
* iWidth: width in chars
*/
function formatMessage(sMessage, iWidth) {
    var sResult = "";

    var lines = sMessage.split("\n");
    for(var x = 0; x < lines.length; x++) {
        var line = lines[x];
        var words = line.split(" ");
        var iCounter = 0;
        for(var i = 0; i < words.length; i++) {
            var sWord = words[i];
            if(iCounter > iWidth) {
                iCounter = 0;
                sResult += sWord + "\n";
            }
            else {
               iCounter += sWord.length + 1;
               sResult += sWord + " ";
            }
        }
        sResult += "\n";
    }    
    return sResult;    
}

/*
* Converts Epc to json
* oEpc: Epc model 
* return json
*/
function getJsonFromModel(oEpc) {
    var oPPM = Context.getComponent("PPM");    
    var str = oPPM.modelToJson(oEpc, gnLocale) + "";
    return JSON.parse(str);
}

/*
* Returns matrix from from epc
* oEpc: Epc model 
* return matrix model
*/
function getMatrixModelFromEPc(oEpc) {
    var guid = oEpc.Attribute(Constants.AT_REFERENCED_MAPPING_MATRIX, gnLocale).MeasureValue();
    return ArisData.getActiveDatabase().FindGUID(guid); 
}

/*
* Create data from epc model to transfer to PPM
* oEpc: Epc model 
* return transfer data as string in json format
*/
function createTransferData(oEpc) {     
    var json = getJsonFromModel(oEpc);    
    var oMatrixModel = getMatrixModelFromEPc(oEpc);
    if(!oMatrixModel.IsValid()) {
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_MATRIX_MODEL_NOT_FOUND"), [oEpc.Name(gnLocale)]));
    }
    var mappings = createMapping(oMatrixModel);
    var arisExclusions = createArisGapList(oMatrixModel);    
    var ppmExculsions = createPpmGapList(oMatrixModel);    
        
    var data = {
        "epc" : 
            json,
        "mappings" : 
            mappings,
        "arisexclusions" :
            arisExclusions,
        "ppmexclusions" :
            ppmExculsions   
    }
    
    var attr = oEpc.Attribute(Constants.AT_REFERENCED_PPM_PROCESS_TYPE, gnLocale);
    var type = attr.getValue().split("\\\\");
    
    if(type.length > 0) {
        if(type[0] != "root") {
            data["processtypegroup"] = type[0];
        }
    }
    if(type.length == 2) {
        data["processtype"] = type[1];
    }
    return JSON.stringify(data);     
}

/*
* Create mapping between PPM functions and ARIS functions
* oMatrixModel: matrix model 
* return mapping
*/
function createMapping(oMatrixModel) {
    var mappings = [];
    var oMatrix = oMatrixModel.getMatrixModel(); 
    var oCxnDatas = oMatrix.getContentCells();
    for(i = 0; i < oCxnDatas.length; i++) {
        var oCxnData = oCxnDatas[i];
        var oPPMObj = oCxnDatas[i].getRowHeader().getDefinition();
        var oArisObj = oCxnDatas[i].getColumnHeader().getDefinition();
        var oGUID = oArisObj.GUID() + "";
        var sPPM = oPPMObj.Name(gnLocale) + "";
        // filter GAP object
        if(oPPMObj.TypeNum() == Constants.OT_FUNC && oArisObj.TypeNum() == Constants.OT_FUNC) {
            mappings.push({ "aris" : oGUID, "ppm" : sPPM});
        }
    }
    return mappings;
}

/*
* Create list of ARIS functions connected to a GAP object
* oMatrixModel: matrix model 
* return gap list
*/
function createArisGapList(oMatrixModel) {
    var list = [];
    var oMatrix = oMatrixModel.getMatrixModel(); 
    var oCxnDatas = oMatrix.getContentCells();
    for(i = 0; i < oCxnDatas.length; i++) {
        var oCxnData = oCxnDatas[i];
        var oPPMObj = oCxnDatas[i].getRowHeader().getDefinition();
        var oArisObj = oCxnDatas[i].getColumnHeader().getDefinition();
        var oGUID = oArisObj.GUID() + "";
        var sPPM = oPPMObj.Name(gnLocale) + "";
        if(oPPMObj.TypeNum() == Constants.OT_GAP) {
            list.push(oGUID);
        }
    }
    return list;
}

/*
* Create list of PPM functions connected to a GAP object
* oMatrixModel: matrix model 
* return gap list
*/
function createPpmGapList(oMatrixModel) {
    var list = [];
    var oMatrix = oMatrixModel.getMatrixModel(); 
    var oCxnDatas = oMatrix.getContentCells();
    for(i = 0; i < oCxnDatas.length; i++) {
        var oCxnData = oCxnDatas[i];
        var oPPMObj = oCxnDatas[i].getRowHeader().getDefinition();
        var oArisObj = oCxnDatas[i].getColumnHeader().getDefinition();
        var oGUID = oArisObj.GUID() + "";
        var sPPM = oPPMObj.Name(gnLocale) + "";
        if(oArisObj.TypeNum() == Constants.OT_GAP) {
            list.push(sPPM);
        }
    }
    return list;
}

/*
* Return the result of the rest call as string
* settings: parameter for the restcall
* return: result as string
*/
function restCall(sUrl, kind, format, authenticationFunc, settings, data){
    var sResult = "";

    var oUrl;
    var protocol = sUrl.split(":");
    if(!sUrl.startsWith("http:") && !sUrl.startsWith("https:")) {
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_PROTOCOL.DBI"), [protocol[0]]));
    }        
    if(protocol.length < 3) {
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_PORT_URL.DBI"), [sUrl]));
    } 
    try {
        oUrl = new java.net.URL(sUrl);
    }
    catch(ex) {        
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_MALFORMED_URL.DBI"), [sUrl]));
    }
    
    var oConn = oUrl.openConnection();
    oConn.setRequestMethod(kind);
    oConn.setRequestProperty("Accept", "application/" + format);
    
    authenticationFunc(oConn, settings.sUserName, settings.sPassword); 
    if(kind == "POST") {
        try {
            postFunc(oConn, data, format);
        }
        catch(ex) {
            throw new Exception(commonUtils.attsall.formatString(getString("TEXT_COULD_NOT_CONNECT"), [settings.sUrl]));        
        }          
    }
    if(kind == "OPTIONS") {
        try {
            optionsFunc(oConn, data, format);
        }
        catch(ex) {
            throw new Exception(commonUtils.attsall.formatString(getString("TEXT_COULD_NOT_CONNECT"), [settings.sUrl]));        
        }                  
    }
    errorHandlingRestCall(oConn, settings);
    var iCode = oConn.getResponseCode();
    // now read the data   
    var inputStream = iCode == java.net.HttpURLConnection.HTTP_OK ? oConn.getInputStream() : oConn.getErrorStream();
    if(inputStream == null) {
        var iErrorCode = oConn.getResponseCode();
        if(iErrorCode == java.net.HttpURLConnection.HTTP_NOT_FOUND) {
            throw new Exception(commonUtils.attsall.formatString(getString("TEXT_REST_SERVICE_NOT_FOUND"), [sUrl]), iCode);             
        }
        else {
            throw new Exception(commonUtils.attsall.formatString(getString("TEXT_COULD_NOT_CONNECT"), [sUrl]), iCode);            
        }
    }
        
    var oReader = new java.io.BufferedReader(new java.io.InputStreamReader(inputStream, "UTF-8"));

    var sOutput;
    while((sOutput = oReader.readLine()) != null) {
        sResult += sOutput;
    }
    // disconnect again
    oConn.disconnect();
    if(iCode != java.net.HttpURLConnection.HTTP_OK) {
        var json = JSON.parse(sResult);
        throw new Exception(json["message"], iCode);
    }
    return sResult;
}

function basicAutehntication(oConn, sUserName, sPassword) {    
    var sUerCredentials = sUserName + ":"+ sPassword;
    var sAuthorization = "Basic " + javax.xml.bind.DatatypeConverter.printBase64Binary(new java.lang.String(sUerCredentials).getBytes("UTF-8"));
    oConn.setRequestProperty("Authorization", sAuthorization);            
}

function noAutehntication(oConn, sUserName, sPassword) {    
}

function postFunc(oConn, data, format) {
    oConn.setRequestProperty("Content-Type", "application/" + format);   
    oConn.setDoOutput(true);
    var stream = oConn.getOutputStream();
    var bytes =  new java.lang.String(data).getBytes("UTF-8");    
    stream.write(bytes);
    stream.flush();
    stream.close();
}

function optionsFunc(oConn, data, format) {
    oConn.setRequestProperty("Content-Type", "application/" + format);   
}



/*
* Handling error that occurs via rest call.
* oConn: Rest call connection.
* settings: of the rest cal.
*/
function errorHandlingRestCall(oConn, settings) {
    var iCode;
    try {
        iCode = oConn.getResponseCode();
    }
    catch(ex) {
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_COULD_NOT_CONNECT"), [settings.sUrl]));        
    }       
          
    // username or password wrong
    if (iCode == java.net.HttpURLConnection.HTTP_UNAUTHORIZED) {
        throw new Exception(getString("TEXT_LOGINFAILED"), iCode);					
    }
    if (iCode == java.net.HttpURLConnection.HTTP_BAD_REQUEST) {
        // Request parameter nout found
        throw new Exception(getString("TEXT_PARAMTER_NOT_FOUND"), iCode);
    }
    if (iCode == java.net.HttpURLConnection.HTTP_FORBIDDEN) {
        // No access previliges to favourite
       throw new Exception(getString("TEXT_NO_ACCESS_PRIVILAGES"), iCode);					
    }
    if (iCode == java.net.HttpURLConnection.HTTP_NOT_FOUND) {
        // Rest service not found. Please check URL part between port and parameter.
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_WRONG_CLIENT"), [settings.sClient]), iCode);					
    }    
    if (iCode == java.net.HttpURLConnection.HTTP_BAD_GATEWAY) {
        // Rest service not found. Please check URL part between port and parameter.
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_WRONG_CLIENT"), [settings.sClient]), iCode);					
    }    
    if (iCode == java.net.HttpURLConnection.HTTP_UNAVAILABLE) {
        // Rest service not found. Please check URL part between port and parameter.
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_WRONG_CLIENT"), [settings.sClient]), iCode);					
    }      
    if(iCode == java.net.HttpURLConnection.HTTP_INTERNAL_ERROR) {
        // Server sends special error message. In this case ignore error handling here
        return;
    }
    // something unexpected happened
    if (iCode != java.net.HttpURLConnection.HTTP_OK) {
        throw new Exception(commonUtils.attsall.formatString(getString("TEXT_COULD_NOT_CONNECT"), [settings.sUrl]), iCode);					
    }          
}

/*
* General excpetion "class"
* sMessage: exception message
* iCode: code of exception
*/
function Exception(sMessage, iCode) {
  this.sMessage = sMessage;
  this.iCode = iCode;    
}

/*
* Open settings dialog for PPM request
* Return all settings for processing.
*/

function optionsDialog() {
	var result = {
        "sUserName": null, 
        "sPassword": null, 
        "sClient": null, 
        "sUrl": null, 
        "bOk": false
    };
    
	var USER_TEXTBOX = "USER_TEXTBOX";
	var PASSWORD_TEXTBOX = "PASSWORD_TEXTBOX";

	var URL_TEXTBOX = "URL_TEXTBOX";
  	var CLIENT_TEXTBOX = "CLIENT_TEXTBOX";
    	    
	this.getPages = function () {
        
		var credentialDialogTemplate = Dialogs.createNewDialogTemplate(220, 60, getString("TEXT_PPM_CREDENTIALS"));	 
        gDialogLineY = 0;

		credentialDialogTemplate.Text(5, nextLine(gSTART), 245, 14, getString("TEXT_USERNAME"));				
		credentialDialogTemplate.TextBox(5, nextLine(gINPUT), 500, 20, USER_TEXTBOX);	  
		credentialDialogTemplate.Text(5, nextLine(gTEXT), 245, 14, getString("TEXT_PASSWORD"));
		credentialDialogTemplate.TextBox(5, nextLine(gINPUT), 500, 20,PASSWORD_TEXTBOX,-1);	
        if(Context.getEnvironment() == Constants.ENVIRONMENT_STD) { 
            credentialDialogTemplate.HelpButton("HID_5c1bdc70-dff9-11e7-258d-080027571b9c_1.hlp");		
        }
		var settingsDialogTemplate = Dialogs.createNewDialogTemplate(220, 60, getString("TEXT_PPM_SETTINGS"));	 
        gDialogLineY = 0;
        
		settingsDialogTemplate.Text(5, nextLine(gSTART), 500, 14, getString("TEXT_URL"));	
		settingsDialogTemplate.TextBox(5, nextLine(gINPUT), 500, 20, URL_TEXTBOX);           
       	settingsDialogTemplate.Text(5, nextLine(gTEXT), 200, 14, getString("TEXT_CLIENT"));
    	settingsDialogTemplate.TextBox(5, nextLine(gINPUT), 500, 20, CLIENT_TEXTBOX);		
        if(Context.getEnvironment() == Constants.ENVIRONMENT_STD) { 
            settingsDialogTemplate.HelpButton("HID_5c1bdc70-dff9-11e7-258d-080027571b9c_2.hlp");		
        }

		return [credentialDialogTemplate, settingsDialogTemplate];
	}
	
	this.init = function(dialog){		
		dialog[0].getDialogElement(USER_TEXTBOX).setText(gsUserName);
   		dialog[0].getDialogElement(PASSWORD_TEXTBOX).setText("");        

		dialog[0].setFocusedElement(PASSWORD_TEXTBOX);
        
		dialog[1].getDialogElement(URL_TEXTBOX).setText(gsUrl);
  		dialog[1].getDialogElement(CLIENT_TEXTBOX).setText(gsClient); 
	}	
        
	this.onClose = function (pageNumber, bOk) {
		result.bOk = bOk;
	}

	this.getResult = function () {
        result.sUserName = this.dialog.getPage(0).getDialogElement(USER_TEXTBOX).getText();
		result.sPassword = this.dialog.getPage(0).getDialogElement(PASSWORD_TEXTBOX).getText();
        
		result.sUrl =  this.dialog.getPage(1).getDialogElement(URL_TEXTBOX).getText();
   		result.sClient =  this.dialog.getPage(1).getDialogElement(CLIENT_TEXTBOX).getText();        
        
        return result;  
	}    
   
     // returns true if the page is in a valid state. In this case "Ok", "Finish", or "Next" is enabled.
     // called each time a dialog value is changed by the user (button pressed, list selection, text field value, table entry, radio button,...)
     // pageNumber: the current page number, 0-based
     this.isInValidState = function(pageNumber){
        if(pageNumber == 0) { 
            return isCredentialPageValid(this.dialog.getPage(pageNumber));
        }
        if(pageNumber == 1) {
            return isSettingPageValid(this.dialog.getPage(pageNumber));
        }
     }    
    
     // returns true if the "Finish" or "Ok" button should be visible on this page.
     // pageNumber: the current page number, 0-based
     // optional. if not present: always true
     this.canFinish = function(pageNumber)
     {
        return isCredentialPageValid(this.dialog.getPage(0)) && isSettingPageValid(this.dialog.getPage(1));
     }
    
     // returns true if the user can switch to another page.
     // pageNumber: the current page number, 0-based
     // optional. if not present: always true
     this.canChangePage = function(pageNumber)
     {
        return true;
     }
    
     // returns true if the user can switch to next page.
     // called when the "Next" button is pressed and thus not suitable for activation/deactivation of this button
     // can prevent the display of the next page
     // pageNumber: the current page number, 0-based
     // optional. if not present: always true
     this.canGotoNextPage = function(pageNumber)
     {
        return true;
     }
    
     // returns true if the user can switch to previous page.
     // called when the "Back" button is pressed and thus not suitable for activation/deactivation of this button
     // can prevent the display of the previous page
     // pageNumber: the current page number, 0-based
     // optional. if not present: always true
     this.canGotoPreviousPage = function(pageNumber)
     {
        return true;
     }    
     
     function isCredentialPageValid(page) {
        return isValidPage(page, [USER_TEXTBOX, PASSWORD_TEXTBOX]);
     }
     
     function isSettingPageValid(page) {
        return isValidPage(page, [URL_TEXTBOX, CLIENT_TEXTBOX]);
     }
          
     function isValidPage(page, fields) {
        for(var i = 0; i < fields.length; i++) {
            var sFieldId = fields[i];
            if(page.getDialogElement(sFieldId).getText().isEmpty()) {
                return false;
            }            
        }
        return true;         
     }   
}

/*
* Automatically calculate nect row position in settings dialog.
*/
function nextLine(sKind) {
    gDialogLineY += sKind;
    return gDialogLineY;
}