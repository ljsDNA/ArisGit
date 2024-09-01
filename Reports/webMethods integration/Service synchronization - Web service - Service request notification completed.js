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

//informs AIS about a finished request

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

var dbname = Context.getProperty("dbname");
var language = Context.getProperty("language");
var objectGuid = Context.getProperty("objectGuid");

// The requst type is "implemented" or "canceled". Currently there is no automatic handling in ARIS concerning 
// the type of the request.
var requestType = Context.getProperty("requestType");

var database = ArisData.getActiveDatabase();

// uddi: has to be remoced from the guid
if(objectGuid.startsWith("uddi:")){
    objectGuid = objectGuid.substring(5,objectGuid.length());
}

var sstObjDef = database.FindGUID(objectGuid);

var errOut = new XMLFormattedOut();
if (sstObjDef.IsValid()){
    var webMethodsComponent = Context.getComponent("webMethodsIntegration");
    var finishedSuccessful;
    var message;

    var result = webMethodsComponent.serviceRequstFinished(database, sstObjDef, language);  

    
    if(!result.succeeded()){
	    errOut.setSuccess(false, result.getErrorMsg());
	    
    }else{
        errOut.setSuccess(true, "Succesful")
    }
} else{
    errOut.setSuccess(false, getString("TEXT1") + "\n" + getString("TEXT2") + " " +database.Name(-1,true) + "\n" + getString("TEXT3") + " " + objectGuid );

}

errOut.write();
