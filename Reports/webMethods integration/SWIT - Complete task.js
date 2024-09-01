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
 * Script: SWIT - Finish Task
 * @author Markus Brueck
 */

//activateDebugMode();
var request = new FinishTaskRequest();
var success = false;
var successMessage = "Share with IT task could not be executed.";

main();

function main() {
    var out = new XMLFormattedOut();
    var result = request.checkValues();
//    result =  "\nTaskId: " + request.task.taskId + "\nTask.Id : " + request.task.id + " (DB: " + request.task.dbName + ", Model: " + request.task.modelGuid + ")\nUser: " + request.user.name + "\nPassword: " + request.user.password;

    if (result == null) {
        doYourBest();
    } else {
        handleError(result);
    }

    if (success) {
        out.setSuccess(success, "");
    } else {
        out.setSuccess(success, successMessage);
    }
    out.write();
}

function doYourBest() {
    var integrationComponent = Context.getComponent("webMethodsIntegration");
    var database = null;

    try {
        //database = integrationComponent.openDatabase(ArisData, request.task.dbName, request.user.name, request.user.password, 1033, false);
        database = ArisData.getActiveDatabase(); // Workaround - will use entire method!!!
    } catch (exception) {
        // the user has no access to the database or the wM integration filter
        handleError("Could not login to ARIS database.", exception);
        return;
    }

    executeTransition(integrationComponent, database);
    database.close();
}

function executeTransition(integrationComponent, database) {
    var exception = null;
    var transitions = null;

    try {
        var switState = integrationComponent.getSWITState(database, request.task.modelGuid);
        transitions = switState.getTransactionIds();
    } catch (e) {
        exception = e;
    }

    if (exception != null || transitions == null) {
        handleError("Unable to find Share with IT process.", exception);
        return;
    }

    for (var k = 0; k < transitions.size(); k++) {
        var transition = transitions.get(k);

        if (transition == request.task.transition) {
            var properties = integrationComponent.createMap();

            if (transition == "import_process") {
                properties.put("developer_name", request.user.name);
            }

            try {
                switState.executeTransaction(transition, properties);
                success = true;
            } catch (err) {
                handleError("Exception occured during execution of the task.", err);
            }

            break;
        }
    }
}

/**
 * With optional 2th parameter with an exception.
 * @param message
 */
function handleError(message, err) {
    success = false;
    successMessage = message;

    if (arguments.length > 1 && arguments[1] != null && arguments[1] instanceof java.lang.Throwable) {
        successMessage = successMessage + "\n\nException Message:\n" + arguments[1].getLocalizedMessage();
    }
}

function activateDebugMode() {
    Context.setProperty('task.name', 'Finish implemenatation for process: Simple SWIT');
    Context.setProperty('task.assigned', 'false');
    Context.setProperty("task.taskId", "680863e1-c7e6-11df-788d-001e4f30035e");
    Context.setProperty("task.id", "marb_simple|8ec5a691-9e01-11e2-1447-d491e8d707c5");
    Context.setProperty("user.name", "system");
    Context.setProperty("user.password", "d12173f23e5f6e5d3cf163169b1068a4");
    Context.setProperty("user.language", "en");
}
