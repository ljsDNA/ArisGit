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

var sModelid = Context.getProperty("modelId"); 
var sMetadataKeys = Context.getProperty("keys"); 
var aMetadataKeys = new Array();
if (sMetadataKeys != null) 
{
    aMetadataKeys = sMetadataKeys.split("\b");
}

var sMetadataValues = Context.getProperty("values"); 
var aMetadataValues = new Array();
if (sMetadataValues != null) 
{
    aMetadataValues = sMetadataValues.split("\b");
}

var mapKeyValue = new java.util.HashMap();
for (var t = 0; t < aMetadataKeys.length; t++)
{
    mapKeyValue.put(new java.lang.String(aMetadataKeys[t]), new java.lang.String(aMetadataValues[t]));
}

var comp = Context.getComponent("webMethodsIntegration");
var model = ArisData.getActiveDatabase().FindGUID(sModelid);
if (model.IsValid())
{
    var result = comp.setARISMetaData(model, mapKeyValue);
                      
    if (!result.succeeded())
    {
        handleResult(result.getErrorMsg());
    }
    else
    {
        var out = new XMLFormattedOut();
        out.setSuccess(true); 
        out.write();
    }
}
else
{
    handleResult("Model with GUID " + sModelid + " not found in " + ArisData.getActiveDatabase().toString());
}

function handleResult(p_errorMessage) {
	var errOut = new XMLFormattedOut();
	errOut.setSuccess(false, p_errorMessage);
	errOut.write();
}