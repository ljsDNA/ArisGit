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
 * Script: SWIT - Library
 * @author Markus Brueck
 */

/*
 * variable/class         instanceof
 * -------------------------------------------------
 * Context                com.aris.modeling.server.bl.logic.webreport.javascript.logic.context.AReportContext
 * ArisData               com.aris.modeling.server.bl.common.reportobjects.aris.logic.AArisReportRoot
 * integrationComponent = Context.getComponent("webMethodsIntegration")
 *                        com.aris.modeling.server.bl.logic.centrasiteintegration.scriptinterface.ICentraSiteScriptInterface
 */

//const START_SWIT_WORKFLOW = 'start_swit_workflow'
const DELIMITER = "|";
const TASKID_DELIMITER = "\b";

// ProcessId
// -------------------------------
// Clean up                                  = 160e3a91-1dba-11e2-6840-dc1dc9c69013
// Clean up (With CentraSite services)       = 23cca871-1db4-11e2-6840-dc1dc9c69013
// Delegate                                  = 576bd0e1-0ba1-11e2-7b4b-0050569d00be
// Delegate (With CentraSite services)       = d6ed7b41-d52c-11e0-404a-95928a359e1f
// Share with IT                             = 3dee2621-bf72-11e1-587a-bbac95aad440
// Share with IT (With CentraSite services)  = be2157e1-0835-11e0-6297-c1b6c637b6d6
const UPDATE_FROM_IT_SIMPLE_PROCESS_ID = "fd3ccf71-0ba0-11e2-7b4b-0050569d00be";
const UPDATE_FROM_IT_COMPLEX_PROCESS_ID = "a37506a1-f6ea-11df-26f8-001d09f09839";


var transitionMap = {};
transitionMap["start_swit_workflow"] = "start_swit_workflow";
transitionMap["import_process"] = "680863e1-c7e6-11df-788d-001e4f30035e";
transitionMap["review_process"] = "review_process";
transitionMap["request_review"] = "0754e0c4-cf84-11df-26f8-001d09f09839";
transitionMap["finish_implementation"] = "0754e0c6-cf84-11df-26f8-001d09f09839";
transitionMap["update_process"] = "0754e0f0-cf84-11df-26f8-001d09f09839";
transitionMap["delegate_process"] = "82a68675-ec04-11df-26f8-001d09f09839";
transitionMap["update_from_it"] = "update_from_it";
transitionMap["accept_final_review"] = "accept_final_review";
transitionMap["reject_final_review"] = "reject_final_review";
transitionMap["send_process_back_to_it"] = "send_process_back_to_it";
transitionMap["abort_process"] = "abort_process";

/**
 *
 * @param transitionGUID GUID of the selected transition (GUID of the previously used AGE task)
 * @return {String} name of the transition
 */
function getTransitionName(transitionGUID) {
    for (var transitionEntry in transitionMap) {
        if (transitionMap[transitionEntry] == transitionGUID)
            return transitionEntry
    }
    return null;
}


/**
 *
 * @param value
 * @return {Boolean} true, if parameter is empty or null.
 */
function isNullOrEmpty(value) {
    if (value == null || value.length == 0) {
        return true;
    } else {
        return false;
    }
}


/**
 *
 * @param dbName
 * @param modelGuid
 * @return {String}
 */
function joinToTaskId(dbName, modelGuid) {
    return dbName + DELIMITER + modelGuid;
}


/**
 *
 * @param dbNameWithModelGuid
 * @return {Object} returns object with member <b>dbName</b> and <b>modelGuid</b>.
 */
function splitTaskId(dbNameWithModelGuid) {
    var splitter = dbNameWithModelGuid.split(DELIMITER);
    return {'dbName':splitter[0], 'modelGuid':splitter[1]};
}


/**
 *
 * @param object
 * @param array
 * @return {Boolean}
 */
function isInArray(object, array) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] == object) {
            return true;
        }
    }
    return false;
}

/**
 * 
 * @param object
 * @param list
 * @return {Boolean}
 */
function isInList(object, list) {
    for (var i = 0; i < list.size(); i++) {
        if (list.get(i) == object) {
            return true;
        }
    }
    return false;
}

//    var modelId = Context.getProperty("modelId");
//
//    if (modelId == null || modelId.trim().length() == 0) {
//        handleError("'modelId' property not specified!");
//        return;
//    }
//
//    if (modelId.startsWith("M:")) {
//        modelId = modelId.substring(2, modelId.length());
//    }
//
//    var model = ArisData.getActiveDatabase().FindGUID(modelId);
//
//    if (model == null || !model.IsValid()) {
//        handleError("Model is not valid!");
//        return;
//    }


/***************************************************
 *                                                 *
 *  Request and Response classes                   *
 *                                                 *
 ***************************************************/


/**
 * com.idsscheer.aris.services.webmethods.jaxws.FinishTask
 *
 * @constructor
 */
function FinishTaskRequest() {
    this.task = new TaskType();
    this.user = new ArisUserType();

    this.checkValues = function () {
        var result = this.task.checkValues();
        if (result != null) {
            result = this.user.checkValues();
        }
        return result;
    };
}

/**
 * com.idsscheer.aris.services.webmethods.jaxws.StartProcessPossibleRequest
 *
 * @constructor
 */
function StartProcessPossibleRequest() {
    this.user = new ArisUserType();
    this.dbName = Context.getProperty("dbname");

    /**
     * GUID of the model, prefixed by 'M:'
     * @type {String}
     */
    this.modelId = Context.getProperty("modelId");

    this.checkValues = function () {
        var result = this.user.checkValues();
        if (result != null) {
            return result;
        } else if (isNullOrEmpty(this.dbName)) {
            return "dbname is mandatory";
        } else if (isNullOrEmpty(this.modelId)) {
            return "modelID is mandatory";
        }
        return null;
    };
}


/**
 * com.idsscheer.aris.services.webmethods.jaxws.GetUserTasksRequest
 *
 * @constructor
 */
function GetUserTasksRequest() {
    var taskIdListJoined = Context.getProperty("taskID");
    var array = new Array();

    if (taskIdListJoined != null) {
        if (taskIdListJoined.indexOf(transitionMap['import_process']) !== -1) {
            array.push("import_process");
        }
        if (taskIdListJoined.indexOf(transitionMap['request_review']) !== -1) {
            array.push("request_review");
        }
        if (taskIdListJoined.indexOf(transitionMap['finish_implementation']) !== -1) {
            array.push("finish_implementation");
        }
        if (taskIdListJoined.indexOf(transitionMap['delegate_process']) !== -1) {
            array.push("delegate_process");
        }
        if (taskIdListJoined.indexOf(transitionMap['update_process']) !== -1) {
            array.push("update_process");
        }
    }
    //taskIdListJoined = "680863e1-c7e6-11df-788d-001e4f30035e\b3b389c01-c7e8-11df-788d-001e4f30035e\b82a6868f-ec04-11df-26f8-001d09f09839\b"
    //var taskIdListSplitted = taskIdListJoined.split("\b");
    //if (taskIdListSplitted.length > 1) {
    // remove last entry since it is a 'end-of-list-tag'
    //taskIdListSplitted.pop();
    //}

    this.transitions = array;
    this.user = new ArisUserType();

    this.checkValues = function () {
        if (isNullOrEmpty(taskIdListJoined)) {
            return "At least one taskId has to be defined.";
        }

        return this.user.checkValues();
    };
}

/**
 * com.idsscheer.aris.services.webmethods.jaxws.StartProcess
 *
 * @constructor
 */
function StartProcessRequest() {
    this.processId = Context.getProperty("processId");
    this.context = new ContextType();
    this.user = new ArisUserType();

    this.checkValues = function () {
        var contextResult = this.context.checkValues();
        var userResult = this.user.checkValues();

        if (contextResult != null) {
            return contextResult;
        } else if (userResult != null) {
            return userResult;
        } else if (isNullOrEmpty(this.processId)) {
            return "processId is mandatory";
        }
        return null;
    };
}

/**
 * com.idsscheer.aris.services.webmethods.jaxws.TaskType
 *
 * @constructor
 */
function TaskType() {
    this.name = Context.getProperty("task.name");
    this.assigned = Context.getProperty("task.assigned");

    /**
     * GUID of the APG task.
     * @type {String}
     */
    this.taskId = Context.getProperty("task.taskId");

    /**
     * Name of the transition.
     * @type {String}
     */
    this.transition = getTransitionName(this.taskId);

    this.id = Context.getProperty("task.id");

    var task = splitTaskId(this.id + '');
    this.dbName = task.dbName;
    this.modelGuid = task.modelGuid

    this.checkValues = function () {
        if (isNullOrEmpty(this.name)) {
            return "task name is mandatory";
        } else if (isNullOrEmpty(this.assigned)) {
            return "assigned is mandatory";
        } else if (isNullOrEmpty(this.taskId)) {
            return "taskId is mandatory";
        } else if (isNullOrEmpty(this.id) || isNullOrEmpty(this.dbName) || isNullOrEmpty(this.modelGuid)) {
            return "id is mandatory or could not be parsed";
        }
        return null;
    };
}

/**
 * com.idsscheer.aris.services.webmethods.jaxws.ContextType
 *
 * @constructor
 */
function ContextType() {
    this.dbName = Context.getProperty("context.dataBaseName");
    this.username = Context.getProperty("context.userName");
    this.language = Context.getProperty("context.language");

    //TODO: get list of selected aris models!
    this.selectedArisModels = Context.getProperty("context.selectedArisModels");

    this.checkValues = function () {
        if (isNullOrEmpty(this.dbName)) {
            return "task name is mandatory";
        } else if (isNullOrEmpty(this.username)) {
            return "assigned is mandatory";
        } else if (isNullOrEmpty(this.language)) {
            return "taskId is mandatory";
        } else if (false /* selectedArisModels */) {
            return "at least one aris model must be specified"
        }
        return null;
    };
}

/**
 * com.idsscheer.aris.services.webmethods.jaxws.ArisUserType
 *
 * @constructor
 */
function ArisUserType() {
    this.name = Context.getProperty("user.name");
    this.password = Context.getProperty("user.password");
    this.language = Context.getProperty("user.language");

    this.checkValues = function () {
        if (isNullOrEmpty(this.name)) {
            return "user name is mandatory";
        } else if (isNullOrEmpty(this.password)) {
            return "user password is mandatory";
        }
        return null;
    };
}
