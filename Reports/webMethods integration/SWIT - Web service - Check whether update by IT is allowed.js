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

var STATE_COMPLETED = Constants.AVT_INTEGR_STATUS_IMPLEMENTED;

main();

function main()
{       
    var modelId = Context.getProperty("modelId");
    
    if(modelId == null || modelId.trim().length() == 0)
    {
        handleError("'modelId' property not specified!");
        return;
    }
    
    if(modelId.startsWith("M:"))
    {
        modelId = modelId.substring(2, modelId.length());    
    }
    
    var model = ArisData.getActiveDatabase().FindGUID(modelId);

    if(model == null || !model.IsValid())
    {
        handleError("Model is not valid!");
        return;
    }
    
    var shareWithITCompleted = false;    
    var integrationStateAttribute = model.Attribute(Constants.AT_INTEGR_STATUS, Context.getSelectedLanguage());

    if(integrationStateAttribute != null)
    {
        var integrationStateValueTypeNumber = integrationStateAttribute.MeasureUnitTypeNum();
        
        if(integrationStateValueTypeNumber == STATE_COMPLETED)
        {
            shareWithITCompleted = true;
        }    
    }    

    var webMethodsIntegrationComponent = Context.getComponent("webMethodsIntegration");
    var workflowIds = webMethodsIntegrationComponent.getIdsOfPossibleWorkflows(model);     
         
    var xmlOutput = new XMLFormattedOut();    
    xmlOutput.addElement("shareWithITCompleted", shareWithITCompleted); 
    xmlOutput.addElement("shareWithITGuid", workflowIds.getShareWithITWorkflowId()); 
    xmlOutput.addElement("updateFromITGuid", workflowIds.getUpdateFromITWorkflowId()); 
    xmlOutput.addElement("delegateGuid", workflowIds.getDelegateWorkflowId()); 
    xmlOutput.setSuccess(true); 
    xmlOutput.write();
}

function handleError(errorMessage)
{
    var xmlOutput = new XMLFormattedOut(); 
    xmlOutput.setSuccess(false, errorMessage); 
    xmlOutput.write();
}