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

/***************************************************
* Copyright (c) Software AG. All Rights Reserved. *
***************************************************/
var g_selectedGroups = ArisData.getSelectedGroups(); // selected group, where all objects and models are created
var g_nloc = Context.getSelectedLanguage();          // locale to be used
var g_deviceCounter = 0;                             // counter for found devices and child devices
var g_newModel;                                      // counter for found devices and child devices
var g_deviceTypesMap = [];                           // mapping for Types
var g_deviceNamesMap = [];                           // mapping Names 
var g_deviceDefMap = [];                             // mapping corresponding defs
var g_deviceCntMap = [];                             // mapping corresponding number of objects
var g_eventNamesMap = [];
var g_eventDefMap = [];
var g_c8y_servername = "";                           // server url for Cumulocity
var g_c8y_username = "";                             // user name
var g_c8y_password = "";                             // password
var g_c8yPage = 1;                                   // actual page

const goValueAccess = Context.getParameterValueAccess();

// credentials
var gsUserName = goValueAccess.getParameterValue("USER");

// ARIS
var gsModelName = goValueAccess.getParameterValue("MODEL");

// Cumulocity
const gsCumulocityUrl = goValueAccess.getParameterValue("URL");


/*====================================================================*/
// Start execution....
/*====================================================================*/
main();

/*====================================================================*/
// MAIN FUNCTION
/*====================================================================*/
//-----------------------------------------------
function main(){
    // show a dialog if there are already some IoT objects in the selected group
    if (!checkIfGroupIsEmpty(g_selectedGroups[0])){
        if (!askForUpdateOrNew())
            return;
    }
    
    // get url, username and password and save them for later use in global variables
    var dialogResult = Dialogs.showDialog(new optionsDialog(), Constants.DIALOG_TYPE_ACTION, Context.getScriptInfo(Constants.SCRIPT_TITLE));
    if (!dialogResult.bOk) { // stop script if cancel was pressed
        Context.setScriptError(Constants.ERR_CANCEL);
        Dialogs.MsgBox(getString("TEXT_IMPORTCANCELLED.DBI"));
        return;
    }   
    
    // try to create the new model
    if (!createMainModel(dialogResult.modelName))
        return;
    
    // connect to Cumulocity and get all Managed Objects 
    var WeAreReady = false;
    while (!WeAreReady){
        var result = c8y_GetDevices (g_c8y_servername);
        if (result == null){
            WeAreReady = true;
            continue;
        }
        // now check all results, search for devices and sensors
        if (result.managedObjects.length == 0){
            WeAreReady = true;
            continue;
        }
        // we now have a list of managed objects = devices. Handle all of them...
        for(var i=0; i<result.managedObjects.length; i++)
            handleManagedObject(result.managedObjects[i]);
    }
    
    // layout the new model
    g_newModel.doLayout();
    
    // done :-)
    Dialogs.MsgBox(g_deviceCounter == 0 ? getString("TEXT_NOOBJECTSIMPORTED.DBI") : g_deviceCounter + " " + getString("TEXT_OBJECTSIMPORTED.DBI"));    
}


/*====================================================================*/
// HANDLE DEVICES (== managedObjects)
/*====================================================================*/
//-----------------------------------------------
function handleManagedObject (managedObj){
    // filter: devices only
    if (managedObj.c8y_IsDevice == null)
        return;
    
    // get the type of the device - this is the name of the ARIS object to create
    var deviceName = getARISNameofDevice(managedObj)
    if (deviceName == null  || deviceName =="")
        return;
    
    // check if we already created this device - if yes, then ignore it
    var parentDef = findExistingDevice(deviceName);
    
    // if no def with this name has been created, then we will create a new one
    if (parentDef == null){
        parentDef = createObjDef(deviceName);
        if (parentDef != null){
            rememberDevice(deviceName, managedObj.type, parentDef);
            createObjOcc(g_newModel, parentDef);
        }
    }
    
    // find child devices, events and so on and store these in an assigned model    
    handleDeviceDetails(parentDef, managedObj, deviceName);
    
    // find all events created by the device    
    // handleEventDetails(parentDef, managedObj.id, deviceName);
    
    handleMeasurements (parentDef, managedObj.id, deviceName);
}


//-----------------------------------------------
function handleDeviceDetails(parentDef, managedObj, deviceName){
    if (managedObj.childDevices.references.length == 0)
        return; // nothing to do
    
    var assignedModel;
    var newParentOcc;
    
    try{    
        // check if the parent device already has as an assignment
        var alreadyassigned = parentDef.AssignedModels(Constants.MT_IOT_OBJECT_CONTEXT);
        if (alreadyassigned.length>0){
            // yes, it has an assignment - search now for the occ in the model
            assignedModel = alreadyassigned[0];
            newParentOcc = findOccInModel(parentDef, assignedModel)
        }
        else {
            // create the assignement and create an occ for the parent
            assignedModel = g_selectedGroups[0].CreateModel(Constants.MT_IOT_OBJECT_CONTEXT, deviceName, g_nloc);
            parentDef.CreateAssignment(assignedModel, false);
            newParentOcc = createObjOcc(assignedModel, parentDef);
        }
        
        // now get the child devices and also add them
        if (managedObj.childDevices.references.length > 0)
            handleChildDevices(managedObj.childDevices.references, newParentOcc, deviceName, assignedModel);        
        
        // layout the new model
        assignedModel.doLayout();
        
    } catch (e) {
        Dialogs.MsgBox(getString("TEXT_ARISERROR.DBI"));
        Context.writeLog(e.toString());
        return;
    }
}

//-----------------------------------------------
function c8y_GetDevices(stringUrl, username, password){
    stringUrl += "/inventory/managedObjects?pageSize=100&currentPage=" + g_c8yPage;
    g_c8yPage++;
    return c8y_CallURL(stringUrl);
}

//-----------------------------------------------
function c8y_GetDeviceInfo(stringUrl){
    return c8y_CallURL(stringUrl);
}

/*====================================================================*/
// HANDLE CHILD DEVICES
/*====================================================================*/
//-----------------------------------------------
function handleChildDevices(childDevices, parentOcc, parentName, assignedModel){
    var newchildOcc;
    var childname ="";
    
    // now check all child devices    
    try{
        for (var j=0; j<childDevices.length; j++){
            var childDevice = childDevices[j];
            // get all further information for the child device
            var deviceInfo = c8y_GetDeviceInfo (childDevice.managedObject.self);
            // get the name of the device and check if we already have this device
            childname = getARISNameofDevice (deviceInfo);
            var childDef = findExistingDevice(childname);
            if (childDef == null){
                // we don't have it - so create it and remember it
                childDef = createObjDef(childname);
                newchildOcc = createObjOcc(assignedModel, childDef);
                rememberDevice(childname, childname, childDef);
            }
            else // we have it already - search for it the model
                newchildOcc = findOccInModel(childDef, assignedModel);
            var point = [new java.awt.Point(10,10), new java.awt.Point(100,100)];
            assignedModel.CreateCxnOcc(parentOcc, newchildOcc, Constants.CT_IOT_ENCOMPASSES, point, false, true);
        }
    } catch (e) {
        Dialogs.MsgBox(getString("TEXT_ARISERROR.DBI"));
        Context.writeLog(e.toString());
        return;
    }
}

/*====================================================================*/
// HANDLE MEASUREMENTS
/*====================================================================*/
function handleMeasurements(parentDef, deviceid, deviceName){
   var assignedModel;
    var newParentOcc;
    
    // check if the parent device already has as an assignment
    var alreadyassigned = parentDef.AssignedModels(Constants.MT_IOT_OBJECT_CONTEXT);
    if (alreadyassigned.length>0){
        // yes, it has an assignment - search now for the occ in the model
        assignedModel = alreadyassigned[0];
        newParentOcc = findOccInModel(parentDef, assignedModel)
    }
    else {
        // create the assignement and create an occ for the parent
        assignedModel = g_selectedGroups[0].CreateModel(Constants.MT_IOT_OBJECT_CONTEXT, deviceName, g_nloc);
        parentDef.CreateAssignment(assignedModel, false);
        newParentOcc = createObjOcc(assignedModel, parentDef);
    }
    
    handleMeasurementsForDevice(deviceid, newParentOcc, assignedModel);
    handleChildAdditionsForDevice(deviceid, newParentOcc, assignedModel);
        
    assignedModel.doLayout();
}

//-----------------------------------------------
function handleMeasurementsForDevice(deviceid, parentOcc, assignedModel){
    var WeAreReady = false;
    var pagenr = 1;
    var events;
    
    var result = c8y_getMeasurements (deviceid);
    if (result == null || result.length==0)
        return;
    for (var i=0; i<result.length; i++){
        event = result[i];
        handleEvent(event, parentOcc, assignedModel);
    }
}    

//-----------------------------------------------
function c8y_getMeasurements (deviceid){
    var measurements = c8y_CallURL(g_c8y_servername+"/inventory/managedObjects/"+deviceid+"/supportedMeasurements");
    return measurements.c8y_SupportedMeasurements;
}    

//-----------------------------------------------
function handleChildAdditionsForDevice(deviceid, parentOcc, assignedModel){
    var WeAreReady = false;
    var pagenr = 1;
    var reference;
    
    var result = c8y_getChildAdditions (deviceid);
    if (result == null || result.length==0)
        return;
    for (var i=0; i<result.length; i++){
        reference = result[i];
        var rule = reference.managedObject
        handleRule(rule, parentOcc, assignedModel);
    }
}    

//-----------------------------------------------
function c8y_getChildAdditions (deviceid){
    var childAdditions = c8y_CallURL(g_c8y_servername+"/inventory/managedObjects/"+deviceid+"/childAdditions");
    return childAdditions.references;
}    

/*====================================================================*/
// HANDLE EVENTS
/*====================================================================*/

//-----------------------------------------------
function handleEventDetails(parentDef, deviceid, deviceName){
    var assignedModel;
    var newParentOcc;
    
    // check if the parent device already has as an assignment
    var alreadyassigned = parentDef.AssignedModels(Constants.MT_IOT_OBJECT_CONTEXT);
    if (alreadyassigned.length>0){
        // yes, it has an assignment - search now for the occ in the model
        assignedModel = alreadyassigned[0];
        newParentOcc = findOccInModel(parentDef, assignedModel)
    }
    else {
        // create the assignement and create an occ for the parent
        assignedModel = g_selectedGroups[0].CreateModel(Constants.MT_IOT_OBJECT_CONTEXT, deviceName, g_nloc);
        parentDef.CreateAssignment(assignedModel, false);
        newParentOcc = createObjOcc(assignedModel, parentDef);
    }
    
    handleEventsForDevice(deviceid, newParentOcc, assignedModel);
    assignedModel.doLayout();
}

//-----------------------------------------------
function handleEventsForDevice(deviceid, parentOcc, assignedModel){
    var WeAreReady = false;
    var pagenr = 1;
    var events;
    
    while (!WeAreReady){
        var result = c8y_getEvents (deviceid, pagenr);
        
        if (result == null || result.events.length==0){
            WeAreReady = true;
            continue;
        }
        
        for (var i=0; i<result.events.length; i++){
            event = result.events[i];
            handleEvent(event, parentOcc, assignedModel);
        }
        
        pagenr++;
    }
}    

//-----------------------------------------------
function c8y_getEvents (deviceid, pagenr){
    var events = c8y_CallURL(g_c8y_servername+"/event/events?source="+deviceid+"&pageSize=100&currentPage=" + pagenr);
    return events;
}    

//-----------------------------------------------
function handleEvent(event, parentOcc, assignedModel){
    eventDef = createEventDef(getEventName(event));
    //TODO check if occ already exists
    eventocc = findOccInModel(eventDef, assignedModel);
    eventocc = createEventOcc(assignedModel, eventDef);
    var point = [new java.awt.Point(10,10), new java.awt.Point(100,100)];
    assignedModel.CreateCxnOcc(parentOcc, eventocc, Constants.CT_IOT_OUTPUT_EVT, point, false, true);
}

//-----------------------------------------------
function handleRule(rule, parentOcc, assignedModel){
    eventDef = createEventDef(getEventName(rule.name));
    //TODO check if occ already exists
    eventocc = findOccInModel(eventDef, assignedModel);
    eventocc = createEventOcc(assignedModel, eventDef);
    var point = [new java.awt.Point(10,10), new java.awt.Point(100,100)];
    assignedModel.CreateCxnOcc(parentOcc, eventocc, Constants.CT_IOT_OUTPUT_EVT, point, false, true);
}

//-----------------------------------------------
function getEventName(event){
    return event;   //.type; ("+event.fragment+")";
}    

//-----------------------------------------------
function createEventDef (name){
    var objDef = findExistingEvent(name);
    if (objDef == null){
        objDef = g_selectedGroups[0].CreateObjDef(Constants.OT_EVT, name, g_nloc);
        rememberEvent(name, objDef);
    }
    return objDef;
}

//-----------------------------------------------
function createEventOcc (model, objDef){
    //check if occ already exists
    eventOcc = findOccInModel(objDef, model);
    if (eventOcc == null)
        eventOcc = model.createObjOcc(Constants.ST_EV, objDef, 500, 500, true, true);
    return eventOcc;
}

//-----------------------------------------------
function rememberExistingEvents (group){
    var objdefs = group.ObjDefList();
    for (var i= 0; i<objdefs.length; i++){
        if (objdefs[i].TypeNum() == Constants.OT_EVT){
            name = objdefs[i].Name(g_nloc);
            rememberExistingEvent(name, name, objdefs[i]);
        }            
    }        
}    

//-----------------------------------------------
function rememberExistingEvent(name, type, ObjDef){
    g_eventNamesMap.push(name);
    g_eventDefMap.push(ObjDef);
}

//-----------------------------------------------
function findExistingEvent(name){
    for (var m=0; m<g_eventNamesMap.length; m++){
        if (g_eventNamesMap[m] == name){
            return g_eventDefMap[m];
        }
    }
    return null;
}

//-----------------------------------------------
function rememberEvent(name, ObjDef){
    g_eventNamesMap.push(name);
    g_eventDefMap.push(ObjDef);
}

/*====================================================================*/
// HELPERS FOR DEVICES
/*====================================================================*/

//-----------------------------------------------
// if there are already devices in the selected group, then
// get all of them and remember them in the map 
function rememberExistingDevices (group){
    var objdefs = group.ObjDefList();
    for (var i= 0; i<objdefs.length; i++){
        if (objdefs[i].TypeNum() == Constants.OT_IOT_OBJECT){
            name = objdefs[i].Name(g_nloc);
            rememberExistingDevice(name, name, objdefs[i]);
        }            
    }        
}

//-----------------------------------------------
function rememberExistingDevice(name, type, ObjDef){
    g_deviceTypesMap.push(type);
    g_deviceNamesMap.push(name);
    g_deviceDefMap.push(ObjDef);
    g_deviceCntMap.push(1);
    addAttribute(ObjDef, Constants.AT_NO_OF_DEPLOYED_DEVICES, 1); 
}

//-----------------------------------------------
function getARISNameofDevice (device){
    // if hardware model is defined, then we will take that
    if (device.c8y_Hardware != null && device.c8y_Hardware.model != null && device.c8y_Hardware.model != "")
        return device.c8y_Hardware.model;
    // otherwise we try to take the type as name
    if (device.type != null)
        return device.type;
    // if nothing is maintained, then simply take the name....
    return device.name;
}    

//-----------------------------------------------
// a new device was found. Check if we already handled
// a device with this name. If so, then update the device counter
// and return the ObjDef
function findExistingDevice(name){
    for (var m=0; m<g_deviceNamesMap.length; m++){
        if (g_deviceNamesMap[m] == name){
            g_deviceCntMap[m]++;
            addAttribute(g_deviceDefMap[m], Constants.AT_NO_OF_DEPLOYED_DEVICES, g_deviceCntMap[m]); 
            markDeviceAsSynced (g_deviceDefMap[m]);
            return g_deviceDefMap[m];
        }
    }
    return null;
}

//-----------------------------------------------
function rememberDevice(name, type, ObjDef){
    g_deviceTypesMap.push(type);
    g_deviceNamesMap.push(name);
    g_deviceDefMap.push(ObjDef);
    g_deviceCntMap.push(1);
    addAttribute(ObjDef, Constants.AT_NO_OF_DEPLOYED_DEVICES, 1); 
    addAttribute(ObjDef, Constants.AT_CUMULOCITY_TYPE, "TRUE"); 
    markDeviceAsSynced (ObjDef);
    ObjDef.setDefaultSymbolNum ( Constants.ST_IOT_OBJECT, true);
}

//-----------------------------------------------
function markDeviceAsSynced(ObjDef){
    var attribute = ObjDef.Attribute(Constants.AT_LAST_CUMULOCITY_SYNCH, g_nloc);
    attribute.setValue( new Date() )
}


/*====================================================================*/
// HELPERS
/*====================================================================*/

//-----------------------------------------------
function createMainModel(name){
    // try to create the new model
    g_newModel = g_selectedGroups[0].CreateModel(Constants.MT_IOT_OBJECT_DEFINITION, name, g_nloc);
    if (g_newModel == null){
        Dialogs.MsgBox(getString("TEXT_CREATEMODELFAILED.DBI"));
        return false;
    }
    return true;
}    

//-----------------------------------------------
function createObjDef (name){
    var objDef = g_selectedGroups[0].CreateObjDef(Constants.OT_IOT_OBJECT, name, g_nloc);
    if (objDef == null)
        return null;
    g_deviceCounter++;
    return objDef;
}

//-----------------------------------------------
function createObjOcc (model, objDef){
    try{
        var result = model.createObjOcc(Constants.ST_IOT_OBJECT, objDef, 500, 500, true, true);
        return result;
    } catch (e) {
        Dialogs.MsgBox(getString("TEXT_ARISERROR.DBI"));
        Context.writeLog(e.toString());
        return;
    }
}

//-----------------------------------------------
function checkIfGroupIsEmpty (group){
    var objdefs = group.ObjDefList();
    for (var i= 0; i<objdefs.length; i++){
        if (objdefs[i].TypeNum() == Constants.OT_IOT_OBJECT)
            return false;
    }        
    // no IoT object found
    return true;
}

//-----------------------------------------------
function findOccInModel(objdef, model){
    var occs = model.ObjOccList();
    for (var i = 0; i < occs.length; i++) {
        if (occs[i].ObjDef().ObjectID() == objdef.ObjectID())
            return occs[i];
    }
    return null;
}    

//-----------------------------------------------
function addAttribute(objDef, attrnum, value){
    if (value == null)
        return;
    var attribute = objDef.Attribute(attrnum, g_nloc);
    attribute.setValue(value);
}


/*====================================================================*/
// DIALOGES
/*====================================================================*/

//-----------------------------------------------
function optionsDialog() {
    var result = {userName: null, password: null, url: null, modelName: null, bOk: false};
    var URL_TEXTBOX = "URLTEXTBOX";
    var USER_TEXTBOX = "USERTEXTBOX";
    var NAME_TEXTBOX = "NAMETEXTBOX";
    var PASSWORD_TEXTBOX = "PASSWORDTEXTBOX";
    
    this.getPages = function () {
        var dialogTemplate = Dialogs.createNewDialogTemplate(220, 60, "LOGIN");	 
        
        dialogTemplate.Text(5, 5, 500, 14, "Cumulocity");	
        dialogTemplate.Text(5, 35, 50, 14, getString("TEXT_SERVERURL.DBI"));	
        dialogTemplate.TextBox(5, 50, 500, 20, URL_TEXTBOX);   
        dialogTemplate.Text(5, 75, 245, 14, getString("TEXT_USERNAME.DBI"));				
        dialogTemplate.TextBox(5, 90, 245, 20, USER_TEXTBOX);	  
        dialogTemplate.Text(260, 75, 245, 14, getString("TEXT_PASSWORD.DBI"));
        dialogTemplate.TextBox(260, 90, 245, 20,PASSWORD_TEXTBOX,-1);			
        dialogTemplate.Text(5, 140, 50, 14, "ARIS");	
        dialogTemplate.Text(5, 170, 200, 14, getString("TEXT_MODELNAME.DBI"));
        dialogTemplate.TextBox(5, 185, 500, 20,NAME_TEXTBOX);			
        
        return [dialogTemplate];
    }
    
    this.init = function(dialog){		
        dialog[0].getDialogElement(URL_TEXTBOX).setText(gsCumulocityUrl);
        dialog[0].getDialogElement(USER_TEXTBOX).setText(gsUserName);
        dialog[0].getDialogElement(PASSWORD_TEXTBOX).setText("");

        dialog[0].getDialogElement(NAME_TEXTBOX).setText(gsModelName);
        dialog[0].setFocusedElement(PASSWORD_TEXTBOX);
    }
        
    this.onClose = function (pageNumber, bOk) {
        result.bOk = bOk;
    }
    
    this.getResult = function () {
        result.userName = this.dialog.getPage(0).getDialogElement(USER_TEXTBOX).getText();
        result.password = this.dialog.getPage(0).getDialogElement(PASSWORD_TEXTBOX).getText();
        result.url =  this.dialog.getPage(0).getDialogElement(URL_TEXTBOX).getText();
        result.modelName =  this.dialog.getPage(0).getDialogElement(NAME_TEXTBOX).getText();
        // remember the login data for later calls to cumulocity
        g_c8y_servername = result.url;
        g_c8y_username = result.userName;
        g_c8y_password = result.password;
        return result;  
    }
}

//-----------------------------------------------
function askForUpdateOrNew(){
    var btnPressed = Dialogs.MsgBox(getString("TEXT_NOTEMPTY.DBI"),  Constants.MSGBOX_ICON_QUESTION | Constants.MSGBOX_BTN_YESNO + 512, getString("TEXT_WARNING.DBT"));
    if (btnPressed == Constants.MSGBOX_RESULT_NO){
        Context.setScriptError(Constants.ERR_CANCEL);
        Dialogs.MsgBox(getString("TEXT_IMPORTCANCELLED.DBI"));
        return false;
    }
    // if no was choosen, then read all existing devices and put them in the map
    if (btnPressed == Constants.MSGBOX_RESULT_YES){
        rememberExistingDevices (g_selectedGroups[0]);
        rememberExistingEvents (g_selectedGroups[0]);
    }
    return true;
}

/*====================================================================*/
// CALLS TO CUMULOCITY
/*====================================================================*/

//-----------------------------------------------
function c8y_CallURL(stringUrl){
    var result = "";
    var errortxt = "";
    try {
        // build up connection to Cumulocity with basic authentication
        var url = new java.net.URL(stringUrl);
        var Connection = url.openConnection();
        Connection.setRequestMethod("GET");
        Connection.setRequestProperty("Accept", "application/json");
        var userCredentials = g_c8y_username + ":"+ g_c8y_password;
        var authorization = "Basic " + javax.xml.bind.DatatypeConverter.printBase64Binary(new java.lang.String(userCredentials).getBytes("UTF-8"));
        Connection.setRequestProperty("Authorization", authorization);
        // username or password wrong
        if (Connection.getResponseCode() == 401) {
            throw commonUtils.attsall.formatString(getString("TEXT_LOGINFAILED.DBI"), [Connection.getResponseCode()]);					
        }
        
        // not found - means no result....
        if (Connection.getResponseCode() == 404) {
            return null;
        }

        // something unexpected happened
        if (Connection.getResponseCode() != 200) {
            throw commonUtils.attsall.formatString(getString("TEXT_CONNECTIONFAILED.DBI"), [Connection.getResponseCode()]);					
       }

        // now read the data             
        var br = new java.io.BufferedReader(new java.io.InputStreamReader(Connection.getInputStream(), "UTF-8"));
        var output;
        while ((output = br.readLine()) != null) {
            result = result + output;
        }

    } catch (e) {
        var msg = e.toString();
        if(e.javaException instanceof java.net.MalformedURLException) {
            var protocol = stringUrl.split(":");
            if(protocol.length == 1) {
                msg = commonUtils.attsall.formatString(getString("TEXT_MALFORMED_URL.DBI"), [stringUrl]);
            } 
            else {
                if(protocol[0].toLowerCase() != "http" || protocol[0].toLowerCase() != "https") {
                    msg = commonUtils.attsall.formatString(getString("TEXT_PROTOCOL.DBI"), [protocol[0]]);
                }
            }
        }
        if(e.javaException instanceof java.net.UnknownHostException) {
            var msg = commonUtils.attsall.formatString(getString("TEXT_UNKNOWN_HOST.DBI"), [stringUrl]);
        }        
        Dialogs.MsgBox(msg, Constants.MSGBOX_ICON_ERROR | Constants.MSGBOX_BTN_OK + 512, getString("TEXT_ERROR.DBT"));
        Context.writeLog(msg);
        return null;
    }
        
    // parse the JSON array and return the parsed result
    var parsed = JSON.parse(result);
    return parsed;
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
