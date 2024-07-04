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

var PROCESS = Context.getComponent("Process");
const m_valueAccess = Context.getParameterValueAccess();
var CHANGE_REQUEST_WORKFLOW_GUID = m_valueAccess.getParameterValue("ProcessInstances_ChangeRequest");
var APPROVE_WORKFLOW_GUID        = m_valueAccess.getParameterValue("ProcessInstances_Approval");
var SHARE_WORKFLOW_GUID          = m_valueAccess.getParameterValue("ProcessInstances_Share");
   
var gMapInstanceIdToInstance = new java.util.HashMap();

main();

function main() {

    // instances for Change request
    var ChangeRequest_instancesOutputParameters = new OutputParameters("ChangeRequestInstances");
    var ChangeRequest_instancesOutput = createXmlOutput(ChangeRequest_instancesOutputParameters);
    outInstancesHeader(ChangeRequest_instancesOutput);  
    var ChangeRequest_filter = PROCESS.createInstanceFilter();
    ChangeRequest_filter.setProcessId(CHANGE_REQUEST_WORKFLOW_GUID);
    var ChangeRequest_Instances = PROCESS.getInstancesByFilter(ChangeRequest_filter);    
    outInstancesData(ChangeRequest_instancesOutput, ChangeRequest_Instances);
    uploadGovernanceXmlOutputToADS(ChangeRequest_instancesOutput, ChangeRequest_instancesOutputParameters);
    
    // instances for Approval
    var Approve_instancesOutputParameters = new OutputParameters("ApproveInstances");
    var Approve_instancesOutput = createXmlOutput(Approve_instancesOutputParameters);
    outInstancesHeader(Approve_instancesOutput);   
    var Approve_filter = PROCESS.createInstanceFilter();
    Approve_filter.setProcessId(APPROVE_WORKFLOW_GUID);
    var Approve_Instances = PROCESS.getInstancesByFilter(Approve_filter);    
    outInstancesData(Approve_instancesOutput, Approve_Instances);
    uploadGovernanceXmlOutputToADS(Approve_instancesOutput, Approve_instancesOutputParameters);
    
    // instances for Share
    var Share_instancesOutputParameters = new OutputParameters("ShareInstances");
    var Share_instancesOutput = createXmlOutput(Share_instancesOutputParameters);
    outInstancesHeader(Share_instancesOutput);   
    var Share_filter = PROCESS.createInstanceFilter();
    Share_filter.setProcessId(SHARE_WORKFLOW_GUID);
    var Share_Instances = PROCESS.getInstancesByFilter(Share_filter);    
    outInstancesData(Share_instancesOutput, Share_Instances);
    uploadGovernanceXmlOutputToADS(Share_instancesOutput, Share_instancesOutputParameters);
    
    // all process instances
    var instancesOutputParameters = new OutputParameters("Instances");
    var instancesOutput = createXmlOutput(instancesOutputParameters);
    outInstancesHeader(instancesOutput);
    var instances = PROCESS.getInstances();    
    outInstancesData(instancesOutput, instances);
    uploadGovernanceXmlOutputToADS(instancesOutput, instancesOutputParameters);
    
    // human tasks for Change request
    var ChangeRequest_humanTaskOutputParameters = new OutputParameters("ChangeRequest_HumanTasks");
    var ChangeRequest_humanTaskOutput = createXmlOutput(ChangeRequest_humanTaskOutputParameters);
    outHumanTasksHeader(ChangeRequest_humanTaskOutput);
    var ChangeRequest_humanTaskFilter = PROCESS.createHumanTaskFilter();
    var ChangeRequest_humantasks = new java.util.ArrayList();        
    for(var i = 0 ; i < ChangeRequest_Instances.size() ; i++) {       
        ChangeRequest_humanTaskFilter.setInstanceId(ChangeRequest_Instances.get(i).getId());       
        ChangeRequest_humantasks.addAll(PROCESS.getHumanTasksByFilter(ChangeRequest_humanTaskFilter));
    }    
    outHumanTasksData(ChangeRequest_humanTaskOutput, ChangeRequest_humantasks);
    uploadGovernanceXmlOutputToADS(ChangeRequest_humanTaskOutput, ChangeRequest_humanTaskOutputParameters);    
    
    // human tasks for Approve
    var Approve_humanTaskOutputParameters = new OutputParameters("Approve_HumanTasks");
    var Approve_humanTaskOutput = createXmlOutput(Approve_humanTaskOutputParameters);
    outHumanTasksHeader(Approve_humanTaskOutput);
    var Approve_humanTaskFilter = PROCESS.createHumanTaskFilter();
    var Approve_humantasks = new java.util.ArrayList();        
    for(var i = 0 ; i < Approve_Instances.size() ; i++) {       
        Approve_humanTaskFilter.setInstanceId(Approve_Instances.get(i).getId());       
        Approve_humantasks.addAll(PROCESS.getHumanTasksByFilter(Approve_humanTaskFilter));
    } 
    outHumanTasksData(Approve_humanTaskOutput, Approve_humantasks);
    uploadGovernanceXmlOutputToADS(Approve_humanTaskOutput, Approve_humanTaskOutputParameters); 
    
    // all human tasks 
    var humanTaskOutputParameters = new OutputParameters("HumanTasks");
    var humanTaskOutput = createXmlOutput(humanTaskOutputParameters);
    outHumanTasksHeader(humanTaskOutput);
    var humantasks = PROCESS.getHumanTasks();        
    outHumanTasksData(humanTaskOutput, humantasks);
    uploadGovernanceXmlOutputToADS(humanTaskOutput, humanTaskOutputParameters); 
    
    // all human task assignments 
    var humanTaskAssignmentsOutputParameters = new OutputParameters("HumanTaskAssignments");
    var humanTaskAssignmentsOutput = createXmlOutput(humanTaskAssignmentsOutputParameters);
    outHumanTaskAssignmentsHeader(humanTaskAssignmentsOutput);
    var humantaskAssignments = PROCESS.getHumanTaskAssignments();        
    outHumanTaskAssignmentsData(humanTaskAssignmentsOutput, humantaskAssignments);
    uploadGovernanceXmlOutputToADS(humanTaskAssignmentsOutput, humanTaskAssignmentsOutputParameters); 
    
}

function outInstancesData(output, instances) {
    for (var i = 0 ; i < instances.size() ; i++) {
        var instance = instances.get(i);
        
        gMapInstanceIdToInstance.put(instance.getId(), instance);
        
        var contextItems = instance.getContextItems();
        var contextType = "";
        var contextId = "";
        var contextName = "";
        var contextDatabase = "";
        var contextServer = "";
        if(contextItems.size() > 0) {
            var firstContextItem = contextItems.get(0);
            contextType = firstContextItem.getType();
            contextId = firstContextItem.getId();
            if(!contextType.equals("DOCUMENT")) {
                contextName = firstContextItem.getName();
                contextDatabase = firstContextItem.getDatabase();
                contextServer = firstContextItem.getServer();
            }
        }
        
        output.addRow([instance.getId(),
                       instance.getStatus(),
                       instance.getStartDate(),
                       instance.getEndDate(),
                       contextServer,
                       contextDatabase,
                       instance.getInitiator(),
                       //"", //"umc_user_first_name",
                       //"", //"umc_user_last_name",
                       //"", //"language",
                       contextId,
                       contextName]);
    }
}

function outHumanTasksData(output, humantasks) {
    for (var i = 0 ; i < humantasks.size() ; i++) {
        var humanTask = humantasks.get(i);
        var processName = gMapInstanceIdToInstance.get(humanTask.getInstanceId()).getProcessName();
        output.addRow([humanTask.getId(),
                       //"", //"callback_id",
                       humanTask.getName(),
                       humanTask.getDescription(),
                       processName,
                       humanTask.getInstanceId(),
                       //"", //"a_form_id",
                       humanTask.getStatus(),
                       humanTask.getExecutorDisplayName(),//"", //"participant",
                       //"", //"completition_policy",
                       humanTask.getDialogName(),//"", //"a_form_name",
                       humanTask.getCreationDate(),                  
                       humanTask.getPriority()]);
    }
}

function outHumanTaskAssignmentsData(output, humantaskassignments) {
    for (var i = 0 ; i < humantaskassignments.size() ; i++) {
        var humanTaskAssignment = humantaskassignments.get(i);
        output.addRow([humanTaskAssignment.getId(),
                       humanTaskAssignment.getHumanTaskId(),
                       humanTaskAssignment.getStatus(),
                       humanTaskAssignment.getAssignee(),
                       humanTaskAssignment.getAssignedDate(),                  
                       humanTaskAssignment.getCompletedDate()]);
    }
}


function outInstancesHeader(output) {
    output.setColumns([["id","text"],
                       ["status","text"],
                       ["starttime", "date"],
                       ["endtime", "date"],
                       ["aris_server_name", "text"],
                       ["aris_db_name", "text"],
                       ["umc_user_login", "text"],
                       //["umc_user_first_name", "text"],
                       //["umc_user_last_name", "text"],
                       //["language", "text"],
                       ["model_guid", "text"],
                       ["model_name", "text"]]);
}

function outHumanTasksHeader(output) {
    output.setColumns([["id","text"],
                       //["callback_id","text"],
                       ["name", "text"],
                       ["description", "text"],
                       ["process_name", "text"],
                       ["instance_id", "text"],
                       //["a_form_id", "text"],
                       ["status", "text"],
                       ["participant", "text"],
                       //["completition_policy", "text"],
                       ["a_form_name", "text"],
                       ["created", "date"],                       
                       ["priority", "text"]]);
}

function outHumanTaskAssignmentsHeader(output) {
    output.setColumns([["id","text"],
                       ["humantask_id","text"],
                       ["status", "text"],
                       ["assignee", "text"],
                       ["assigned_date", "date"],                       
                       ["completed_date", "date"]]);
}

function uploadGovernanceXmlOutputToADS(outputObject, outputParameters) {
   uploadContentToADS(outputObject, 
                      outputParameters.getFolderName(),
                      outputParameters.getFileName(),
                      outputParameters.getDocumentTitle(),
                      outputParameters.getDescription());
}