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

/*
 * Service Enabling for M2E
 * Script: SWIT - Get User Tasks
 * @author Markus Brueck
 */

var debugMode = false;
var debugMessage = "";
if (debugMode) {
    activateDebugMode();
}

var request = new GetUserTasksRequest();
var success = true;
var successMessage = "";

main();

function main() {
    var out = new XMLFormattedOut();
    var result = request.checkValues();
    debugMessage = debugMessage + "\nTaskIds: " + request.transitions + "\nUser: " + request.user.name + "\nPassword: " + request.user.password;

    if (result == null) {
        doYourBest(out);
    } else {
        handleError(result);
    }

    if (success) {
        // out.setSuccess(success, "");
    } else if (debugMode) {
        debugMessage = debugMessage + "\nMessage: " + successMessage;
        dummyOutput(out);
    } else {
        // out.setSuccess(success, successMessage);
        out = new XMLFormattedOut();
    }
    out.write();
}

function handleError(reason) {
    success = false;
    successMessage = reason;
}

function doYourBest(out) {
    var integrationComponent = Context.getComponent("webMethodsIntegration");
    var databaseNames = ArisData.GetDatabaseNames();

    for (var i = 0; i < databaseNames.length; i++) {
        var dbName = databaseNames[i];

        var database = null;
        try {
            database = integrationComponent.openDatabase(ArisData, dbName, request.user.name, request.user.password, 1033, true);
        } catch (e) {
        }

        if (database == null) {
            // the user has no access to the database or the wM integration filter
            continue;
        }

        try {
            var switStates = integrationComponent.getSWITStates(database);
            if (switStates == null) {
                continue;
//                handleError("Unable to find Share with IT processes for database " + dbName);
//                return;
            }

            for (var j = 0; j < switStates.size(); j++) {
                var switState = switStates.get(j);

                var model = switState.getModel();
                var modelName = switState.getModelName(request.user.language);
                var modelGUID = switState.getModel().GUID();
                var transitions = switState.getTransactionIds();
                var isSimpleScenario = integrationComponent.isSimpleScenario(model);

                for (var k = 0; k < transitions.size(); k++) {
                    var transition = transitions.get(k);

                    if (isInArray(transition, request.transitions)) {
                        var transitionTitle = transition; // initiate value with transition name (for test purposes)
                        var isAssigned = "false";

                        if (transition == "import_process") {
                            transitionTitle = "Import process: " + modelName;
                        } else if (transition == "request_review") {
                            transitionTitle = "Request review for process: " + modelName;
                        } else if (transition == "finish_implementation") {
                            transitionTitle = "Finish implemenatation for process: " + modelName;
                        } else if (transition == "update_process") {
                            transitionTitle = "Upload implemented process for update in ARIS: " + modelName;
                        } else if (transition == "delegate_process") {
                            transitionTitle = "Delegate implementation for process: " + modelName;
                        }


                        // ProcessId
                        // -------------------------------
                        // Clean up                                  = 160e3a91-1dba-11e2-6840-dc1dc9c69013
                        // Clean up (With CentraSite services)       = 23cca871-1db4-11e2-6840-dc1dc9c69013
                        // Delegate                                  = 576bd0e1-0ba1-11e2-7b4b-0050569d00be
                        // Delegate (With CentraSite services)       = d6ed7b41-d52c-11e0-404a-95928a359e1f
                        // Share with IT                             = 3dee2621-bf72-11e1-587a-bbac95aad440
                        // Share with IT (With CentraSite services)  = be2157e1-0835-11e0-6297-c1b6c637b6d6
                        // Update from IT                            = fd3ccf71-0ba0-11e2-7b4b-0050569d00be
                        // Update from IT (With CentraSite services) = a37506a1-f6ea-11df-26f8-001d09f09839
                        var processId = "unknown";
                        if (isSimpleScenario) {
                            processId = "3dee2621-bf72-11e1-587a-bbac95aad440"
                        } else {
                            processId = "be2157e1-0835-11e0-6297-c1b6c637b6d6"
                        }


                        // Overall Task
                        // -------------------------------
                        var task = out.addElement("task");

                        // Context
                        // -------------------------------
                        var context = task.addElement("context");
                        context.addElement("dataBaseName", dbName);
                        context.addElement("userName", request.user.name);
                        context.addElement("language", request.user.language);
                        var selectedArisModels = context.addElement("selectedArisModels");
                        selectedArisModels.addElement("guid", "M:" + modelGUID);
                        selectedArisModels.addElement("name", modelName);

                        // Task
                        // -------------------------------
                        var task_task = task.addElement("task");
                        task_task.addElement("name", transitionTitle);
                        task_task.addElement("assigned", isAssigned);
                        task_task.addElement("taskId", transitionMap[transition]);
                        // Unknown <- bd53ccd5-60c6-4408-adec-d46b2e461d4f
                        task_task.addElement("id", joinToTaskId(dbName, modelGUID));

                        // CentraSite
                        // -------------------------------
                        var centrasite = task.addElement("centrasite");
                        centrasite.addElement("modelid", "M:" + modelGUID);
                        centrasite.addElement("csid", getCSId(model));
                        centrasite.addElement("csurl", getCSUrl(database));

                        // ProcessId
                        // -------------------------------
                        task.addElement("processId", processId);
                    }
                }
            }
        } catch (e) {
            handleError("An unexpected error occured.");
        } finally {
            database.close()
        }
    }
}


function getCSId(model) {
    if (model != null && model.IsValid()) {
        var attr = model.Attribute(Constants.AT_CENTRASITE_ID, Context.getSelectedLanguage());
        return attr.getValue();
    }
    return "";
}


function getCSUrl(database) {
    var url;

    try {
        url = integrationComponent.getCSUrl(database);
    } catch (e) {
    }

    if (url == null) {
        var attr = database.Attribute(Constants.AT_CENTRASITE_SERVER, Context.getSelectedLanguage());
        url = attr.getValue();
    }

    return url;
}

function dummyOutput(out) {
    // Overall Task
    // -------------------------------
    var task = out.addElement("task");

    // Context
    // -------------------------------
    var context = task.addElement("context");
    context.addElement("dataBaseName", "");
    context.addElement("language", "");
    var selectedArisModels = context.addElement("selectedArisModels");
    selectedArisModels.addElement("guid", "");
    selectedArisModels.addElement("name", "");

    // Task
    // -------------------------------
    var task_task = task.addElement("task");
    task_task.addElement("name", debugMessage);
    task_task.addElement("assigned", "");
    task_task.addElement("taskId", "");
    task_task.addElement("id", "");

    // CentraSite
    // -------------------------------
    var centrasite = task.addElement("centrasite");
    centrasite.addElement("modelid", "");
    centrasite.addElement("csid", "");
    centrasite.addElement("csurl", "");

    // ProcessId
    // -------------------------------
    task.addElement("processId", "");
}

function activateDebugMode() {
    Context.setProperty("taskID", "680863e1-c7e6-11df-788d-001e4f30035e0754e0c4-cf84-11df-26f8-001d09f098390754e0c6-cf84-11df-26f8-001d09f0983982a68675-ec04-11df-26f8-001d09f098390754e0f0-cf84-11df-26f8-001d09f09839");
    Context.setProperty("user.name", "system");
    Context.setProperty("user.password", "d12173f23e5f6e5d3cf163169b1068a4");
    Context.setProperty("user.language", "en");
}
