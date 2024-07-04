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

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed" 
 
// Fill input
var username = Context.getProperty("user.name");
var password = Context.getProperty("user.password");
var guid = Context.getProperty("serviceDetail.guid");
var name = Context.getProperty("serviceDetail.name");
var type = Context.getProperty("serviceDetail.type");
var owner = Context.getProperty("serviceDetail.owner");
var version = Context.getProperty("serviceDetail.version");
var lifeCycleState = Context.getProperty("serviceDetail.lifeCycleState");
var description = Context.getProperty("serviceDetail.description");
var organization = Context.getProperty("serviceDetail.organization");
var deleted = Context.getProperty("serviceDetail.deleted");
var url = Context.getProperty("serviceDetail.url");
var baseServiceGuids = Context.getProperty("baseServiceKeys.key"); 
var operations = Context.getProperty("serviceDetail.operationInfo");

var webMethodsComponent = Context.getComponent("webMethodsIntegration");
var serviceObject = webMethodsComponent.createServiceObject();
serviceObject.setGuid(guid.substring(5, guid.length()));
serviceObject.setName(name);
serviceObject.setType(type);
serviceObject.setOwner(owner);
serviceObject.setVersion(version);
serviceObject.setDescription(description);
serviceObject.setOrganization(organization);
serviceObject.setDeleted(deleted);
serviceObject.setLifeCycleState(lifeCycleState);
serviceObject.setUrl(url);
parseBaseServiceGuids(serviceObject,baseServiceGuids,webMethodsComponent)
parseOperations(serviceObject,operations,webMethodsComponent);

var result = webMethodsComponent.updateService(username, password, serviceObject, ArisData.getActiveDatabase().RootGroup());

if(deleted){
    handleDeletion(guid);
}
handleResult(result); 

function handleDeletion(guid){
    var database = ArisData.getActiveDatabase();
    var language = database.getDbLanguage();
    var languageName = language.Name(language.LocaleId());
    
    var objectGuid = guid;
    // uddi: has to be remoced from the guid
    if(objectGuid.startsWith("uddi:")){
        objectGuid = objectGuid.substring(5,objectGuid.length());
    }
    var sstObjDef = database.FindGUID(objectGuid);
    var webMethodsComponent = Context.getComponent("webMethodsIntegration");
    if(sstObjDef.IsValid()){
        webMethodsComponent.serviceRequstFinished(database, sstObjDef, languageName);
    } 
}

function handleResult(result){
    var outFile = Context.createOutputObject();
    outFile.OutputTxt("<CentraSiteUpdateErrorMessageType>\r\n");
    outFile.OutputTxt("\t<ErrorMessage>\r\n");
    outFile.OutputTxt("\t\t<success>"+ result.getSuccess() +"</success>");
    if(!result.getSuccess()){
        outFile.OutputTxt("\t\t<errorMessage>"+ result.getMessage() +"</errorMessage>");
    }
    outFile.OutputTxt("\t</ErrorMessage>\r\n");
    if(!result.getSuccess()){
        outFile.OutputTxt("\t<CentraSiteUpdateErrorType>"+ result.getType() +"</CentraSiteUpdateErrorType>\r\n");
    }
    outFile.OutputTxt("</CentraSiteUpdateErrorMessageType>\r\n");
    outFile.WriteReport();
} 

function parseBaseServiceGuids(service, baseServiceGuidString, component){
    if(baseServiceGuidString == null || "".equals(baseServiceGuidString))
        return;
    var vBaseServiceGuids = baseServiceGuidString.split("\b");
    service.setBaseServiceGuids(vBaseServiceGuids);
 }
 
function parseOperations(service, operationString, component){
    if("".equals(operationString))
        return;
    var vOperations = operationString.split("\b");
    for (var i = 0; i < vOperations.length; i ++ ) {
        operationPoperties = vOperations[i].split("\f");
        var operation = component.createOperationObject(); 
        for (var j = 0; j < operationPoperties.length; j+=2){
            var value = operationPoperties[j+1];
            var property = operationPoperties[j];
            if(property.equals("Name")){
                operation.setName(value);  
            }
            if(property.equals("Key")){
                operation.setKey(value.substring(5,value.length));
            }
            if(property.equals("Description")){
                operation.setDescription(value);
            }
            if(property.equals("ServiceKey")){
                operation.setServiceKey(value.substring(5,value.length)); 
            }
        }
        service.addOperation(operation);
    }
 }
 


 
