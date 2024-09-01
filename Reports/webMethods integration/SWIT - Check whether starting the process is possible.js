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
 * Script: SWIT - Is Start Process Possible
 * @author Markus Brueck
 */

//activateDebugMode();
var request = new StartProcessPossibleRequest();
var isStartProcessPossible = false;
var updateFromITGuid = "";
var success = false;
var successMessage = "";

main();

function main() {
    var out = new XMLFormattedOut();
    var result = request.checkValues();
//    result =  "\dbname: " + request.dbName + "\nModelId: " + request.modelId + "\nUser: " + request.user.name + "\nPassword: " + request.user.password;

    if (result == null) {
        doYourBest();
    } else {
        handleError(result);
    }

    out.addElement("startProcessPossible", isStartProcessPossible);
    if (isStartProcessPossible) {
        out.addElement("updateFromITGuid", updateFromITGuid);
        out.addElement("delegateGuid", "");
    }
    out.setSuccess(success, successMessage);
    out.write();
}

function handleError(reason) {
    isStartProcessPossible = false;
    success = false;
    successMessage = reason;
}

function doYourBest() {
    var integrationComponent = Context.getComponent("webMethodsIntegration");
    var database = null;

    try {
        database = integrationComponent.openDatabase(ArisData, request.dbName, request.user.name, request.user.password, 1033, true);
    } catch (e) {
    }

    if (database == null) {
        // the user has no access to the database or the wM integration filter
        handleError("database login failed");
        return;
    }

    try {
        var modelGuid = request.modelId.substring(2);
        var switState = integrationComponent.getSWITState(database, modelGuid);
        var transitions = switState.getTransactionIds();

        if (isInList("update_from_it", transitions)) {
            var model = switState.getModel();
            var isSimpleScenario = integrationComponent.isSimpleScenario(model);

            if (isSimpleScenario) {
                updateFromITGuid = UPDATE_FROM_IT_SIMPLE_PROCESS_ID;
            } else {
                updateFromITGuid = UPDATE_FROM_IT_COMPLEX_PROCESS_ID;
            }
            isStartProcessPossible = true;
        }

        success = true;
    } catch (e) {
        handleError("Share with IT process could not be found.");
    } finally {
        database.close();
    }
}

function activateDebugMode() {
    Context.setProperty('dbname', 'marb');
    Context.setProperty('modelId', 'M:f2e95f90-ce12-11e2-2bbb-dd85ceef4f27');
    Context.setProperty("user.name", "system");
    Context.setProperty("user.password", "d12173f23e5f6e5d3cf163169b1068a4");
    Context.setProperty("user.language", "en");
}
