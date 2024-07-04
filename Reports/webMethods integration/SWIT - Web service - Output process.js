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

main();

function main()
{
    var modelGuid = Context.getProperty("modelId");
    
    if(modelGuid == null)
    {
        handleError("Model GUID is null");
        return;
    }

    var bpmnModel = ArisData.getActiveDatabase().FindGUID(modelGuid);
    
    if(bpmnModel == null || !bpmnModel.IsValid())
    {
        handleError("Model not found. The model does either not exist anymore or the user does not have the necessary access privileges."); 
        return;
    }
    
    var xpdlAttribute = bpmnModel.Attribute(Constants.AT_INTEGR_TRANSFER_XPDL, 0); //locale id will be -1 (language independend)
    var metadataAttribute = bpmnModel.Attribute(Constants.AT_INTEGR_TRANSFER_METADATA, 0); //locale id will be -1 (language independend)

    var out = new XMLFormattedOut();
    var process = out.addElement("process");

    var xmlProcess = new java.lang.String(xpdlAttribute.MeasureValue(), java.nio.charset.StandardCharsets.UTF_8);
    var comp = Context.getComponent("webMethodsIntegration");
    xmlProcess = comp.encodeBase64(xmlProcess);
    process.addElement("xmlProcess", xmlProcess);
    
    var metadata = new java.lang.String(metadataAttribute.MeasureValue(), java.nio.charset.StandardCharsets.UTF_8);
    metadata = comp.encodeBase64(metadata);
    process.addElement("metadata", metadata);

    out.setSuccess(true);
    out.write();
}

function handleError(p_errorMessage)
{
	var errOut = new XMLFormattedOut();
	errOut.setSuccess(false, p_errorMessage);
	errOut.write();
}