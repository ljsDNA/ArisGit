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
    var xpdl = Context.getProperty("process.xmlProcess");

    if(xpdl == null)
    {
        handleError("XPDL is null");
        return;
    }
    
    var metadata = Context.getProperty("process.metadata");

    if(metadata == null)
    {
        handleError("Metadata is null");
        return;
    }
        
    var guid = Context.getProperty("modelId");
    
    if(guid == null)
    {
        handleError("Model GUID is null");
        return;
    }

    var bpmnModel = ArisData.getActiveDatabase().FindGUID(guid);    
    
    if(bpmnModel == null || !bpmnModel.IsValid()){
        
        handleError("Model not found. The model does either not exist anymore or the user does not have the necessary access privileges.");
        return; 
    }
    
    var statusAttribute = bpmnModel.Attribute(Constants.AT_INTEGR_STATUS, 0);
    var status = statusAttribute.MeasureUnitTypeNum();
    
    if(!(status == Constants.AVT_INTEGR_STATUS_IN_DEVELOPMENT  
         || status == Constants.AVT_INTEGR_STATUS_PROCESS_UPDATE_REQUESTED
         || status == Constants.AVT_INTEGR_STATUS_IMPLEMENTED)){
        handleError("Model is in an illegal state!");
        return;
    }         
    
    var webMethodsIntegrationComponent = Context.getComponent("webMethodsIntegration");
    var unlockResult = webMethodsIntegrationComponent.lock(bpmnModel, false, true, false);
        
	if(!unlockResult.succeeded())
	{
        handleError(unlockResult.getErrorMsg());
		return;
	}
    
    ArisData.getActiveDatabase().refreshObjects(new Array(bpmnModel), true);
    
    var xpdlAttribute = bpmnModel.Attribute(Constants.AT_INTEGR_TRANSFER_XPDL, 0); 
    var metadataAttribute = bpmnModel.Attribute(Constants.AT_INTEGR_TRANSFER_METADATA, 0);
        
    var xpdlByteArray = webMethodsIntegrationComponent.getXMLByteArray(xpdl);
    var metadataByteArray = webMethodsIntegrationComponent.getXMLByteArray(metadata);
    
    if(xpdlByteArray.length == 0)
    {
        handleError("XPDL is empty");
        return;
    }
    
    if(metadataByteArray.length == 0)
    {
        handleError("Metadata is empty");
        return;
    }
    
    var success = xpdlAttribute.setValue(xpdlByteArray);
    var error = null;
    
    if(!success)
    {
        error = "Can not set XPDL attribute";
    }
    else
    {
        var scriptResult = webMethodsIntegrationComponent.setARISMetaData(bpmnModel, metadataByteArray);
        
        if(!scriptResult.succeeded())
        {
            error = "Can not set metadata attribute";
        }
    }

    var lockResult = webMethodsIntegrationComponent.lock(bpmnModel, true, true, false);

	if(!lockResult.succeeded())
	{
        error = lockResult.getErrorMsg();
	}
    
    if(error != null)
    {
        handleError(error);
        return;
    }
    
    var errOut = new XMLFormattedOut();
	errOut.setSuccess(true);
	errOut.write();
}

function handleError(p_errorMessage)
{
    var errOut = new XMLFormattedOut();
	errOut.setSuccess(false, p_errorMessage);
	errOut.write();
}