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

// This report generates a csv-file containing all completed APG activities on the current system

var CSV_DELIMETER = ";"
var MAX_INSTANCE_COUNTER = 999999;
var DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS"
var PROCESS_ID_FILTER = "";
var TYPE_FILTER = []; // ["INTERMEDIATE_RULE","GATEWAY_FORK_XOR_DATA"];
var NAME_FILTER = []; // ["XOR NOP"];

var OUT = Context.createOutputObject();
main();
OUT.WriteReport();

function main() {
    var PROCESS = Context.getComponent("Process");
    var filter = PROCESS.createInstanceFilter();
    if(PROCESS_ID_FILTER.length >0) filter.setProcessId(PROCESS_ID_FILTER);
    var instances = PROCESS.getInstancesByFilter(filter);
    var mapInstanceIdToProcessName = new java.util.HashMap();
    var mapInstanceIdToContextName = new java.util.HashMap();
    var mapInstanceIdToContextId = new java.util.HashMap();
    var mapInstanceIdToContextType = new java.util.HashMap();
    var mapInstanceIdToContextDatabase = new java.util.HashMap();
    for(var i = 0 ; i < instances.size() && i < MAX_INSTANCE_COUNTER; i++) {
        var nextInstance = instances.get(i);
        mapInstanceIdToProcessName.put(nextInstance.getId(),nextInstance.getProcessName());
        
        var contextItems = nextInstance.getContextItems();
        var contextNames = new java.util.ArrayList();
        var contextTypes = new java.util.ArrayList();
        var contextIds = new java.util.ArrayList();
        var contextDatabases = new java.util.ArrayList();
        if(contextItems != null) {
            for(var j = 0 ; j < contextItems.size() ; j++) {
                var nextContextItem = contextItems.get(j);
                var nextContextType = nextContextItem.getType();
                if("MODEL".equals(nextContextType) || "OBJ_DEF".equals(nextContextType) || "GROUP".equals(nextContextType)) {
                    contextNames.add(nextContextItem.getName());
                    contextIds.add(nextContextItem.getId());
                    contextDatabases.add(nextContextItem.getDatabase());
                } else {
                    contextNames.add("");
                    contextIds.add("");
                    contextDatabases.add("");
                }
                contextTypes.add(nextContextType);
            }
        }
        mapInstanceIdToContextName.put(nextInstance.getId(),java.lang.String.join(",", contextNames));
        mapInstanceIdToContextId.put(nextInstance.getId(),java.lang.String.join(",", contextIds));
        mapInstanceIdToContextType.put(nextInstance.getId(),java.lang.String.join(",", contextTypes));
        mapInstanceIdToContextDatabase.put(nextInstance.getId(),java.lang.String.join(",", contextDatabases));
    }
    var activities = PROCESS.getCompletedActivities(mapInstanceIdToProcessName.keySet());

    print("Process name"+CSV_DELIMETER);
    print("Instance id"+CSV_DELIMETER);
    print("Id"+CSV_DELIMETER);
    print("Execution id"+CSV_DELIMETER);
    print("Name"+CSV_DELIMETER);
    print("Type"+CSV_DELIMETER);
    print("Status"+CSV_DELIMETER);
    print("Start date"+CSV_DELIMETER);
    print("End date"+CSV_DELIMETER);
    print("Context name"+CSV_DELIMETER);
    print("Context id"+CSV_DELIMETER);
    print("Context type"+CSV_DELIMETER);
    print("Context database");
    printLn("");
    for(var i = 0; i < activities.size() ; i++) {
        var nextActivity = activities.get(i);
        
        if(TYPE_FILTER.indexOf(""+nextActivity.getType())>=0 || NAME_FILTER.indexOf(""+nextActivity.getName())>=0) {
            continue;
        }
        
        var instanceId = nextActivity.getInstanceId();
            
        print(escapeTextOutput(mapInstanceIdToProcessName.get(instanceId)) + CSV_DELIMETER);
        print(nextActivity.getInstanceId() + CSV_DELIMETER);
        print(nextActivity.getId() + CSV_DELIMETER);
        print(nextActivity.getExecutionId() + CSV_DELIMETER);
        print(escapeTextOutput(nextActivity.getName()) + CSV_DELIMETER);
        print(nextActivity.getType() + CSV_DELIMETER);
        print(nextActivity.getStatus() + CSV_DELIMETER);
        print(nextActivity.getStartDate(DATETIME_FORMAT) + CSV_DELIMETER);
        print(nextActivity.getEndDate(DATETIME_FORMAT) + CSV_DELIMETER);
        print(escapeTextOutput(mapInstanceIdToContextName.get(instanceId)) + CSV_DELIMETER);
        print(escapeTextOutput(mapInstanceIdToContextId.get(instanceId)) + CSV_DELIMETER);
        print(escapeTextOutput(mapInstanceIdToContextType.get(instanceId)) + CSV_DELIMETER);
        print(escapeTextOutput(mapInstanceIdToContextDatabase.get(instanceId)));
        printLn("");
    }
}

function escapeTextOutput(output) {
    output = "" + output;
    output = output.replace(/"/g, '""');
    output = "\""+output+"\"";
    return output;
}
function print(value) {
    OUT.OutputTxt(value);
}
function printLn(value) {
    OUT.OutputTxt(value + "\n");
}