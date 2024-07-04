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


const outputParameters = new OutputParameters("");
const output = createXmlOutput(outputParameters);

var locale = Context.getSelectedLanguage();
var database = ArisData.getActiveDatabase();
var currentDate;
var umcComponent = Context.getComponent("UMC");
    
main();

/*************************************************************************************************/

//------functions------
function main()
{
    currentDate = new Date();
    
    outHeader();
    readDatabase();
    uploadXmlOutputToADS(output, outputParameters);
}

/**
**  Function to read models from the database
**  @return void
**/
function readDatabase() {
    var masterModels = database.Find(Constants.SEARCH_MODEL);
    
    for (var j = 0; j < masterModels.length; j++) {
        var masterModel = masterModels[j];
        var variants = masterModel.Variants();
        
        if (!variants || variants.length == 0) {
            continue;
        }
        
        var masterOwnerUserId = getOwnerUserId(masterModel);
        var masterOwnerName = getOwnerName(masterModel);
        
        for (var i = 0; i < variants.length; i++) {
            var variantModel = variants[i];
            var variantOwnerUserId = getOwnerUserId(variantModel);
            var variantOwnerName = getOwnerName(variantModel);
            var rollout_state = getRolloutState(variantModel);
            var masterVersion = getMasterVersion(variantModel);
            var last_rollout_time = getLastRolloutTime(variantModel);
            
            output.addRow([
                masterModel.Name(locale), 
                masterModel.Group().Path(locale), 
                masterModel.GUID(),
                masterOwnerUserId,
                masterOwnerName,
                variantModel.Name(locale), 
                variantModel.Group().Path(locale),
                variantModel.ARISView(),
                variantModel.GUID(),
                variantOwnerUserId,
                variantOwnerName,
                rollout_state,
                masterVersion,
                last_rollout_time,
                currentDate]);
        }
    }
}

function outHeader() {
     output.setColumns([
       ["Master Model","text"],
       ["Master Model Path","text"],
       ["Master Model GUID","text"],
       ["Master Owner User ID", "text"],
       ["Master Owner Name", "text"],
       ["Variant Model","text"],
       ["Variant Model Path","text"],
       ["Variant Model View","text"],
       ["Variant Model GUID","text"],
       ["Variant Owner User ID", "text"],
       ["Variant Owner Name", "text"],
       ["Rollout State","text"],
       ["Master Version","text"],
       ["Last change of state","text"],
       ["Last updated","text"]
       ]);   
}

function getRolloutState(model) {
    var attr = model.Attribute(Constants.AT_ROLL_OUT_STATE, locale);
    
    if (!attr.IsMaintained()) {
        return "Unknown";
    }
    
    return attr.getValue();
}

function getMasterVersion(model) {
    var attr = model.Attribute(Constants.AT_NEW_MASTER_ASN, locale);
    
    if (!attr.IsMaintained()) {
        return "";
    }
    
    return attr.getValue();
}

function getOwnerUserId(model) {
    var attr = model.Attribute(Constants.AT_PERS_RESP, locale, true);
    return attr.getValue();
}

function getOwnerName(model) {
    var attr = model.Attribute(Constants.AT_PERS_RESP, locale, true);
    var userName = "";
    if (umcComponent != null) {
        var umcUser = umcComponent.getUserByName(attr.getValue());
        if (umcUser != null) {
            userName = umcUser.getFirstName() + " " + umcUser.getLastName();
        }
    }
    return userName;
}

function getLastRolloutTime(model) {
    var attr = model.Attribute(Constants.AT_LAST_ROLL_OUT_STATE_CHANGE, locale, true);
    return attr.getValue();
}
