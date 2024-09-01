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


var locale = Context.getSelectedLanguage();
var database = ArisData.getActiveDatabase();
var file = Context.createOutputObject();
var umcComponent = Context.getComponent("UMC");
var variantsComponent = Context.getComponent("Variants");
var BG_COLOR_MASTER = Constants.C_LAVENDER;
var BG_COLOR_VARIANT = Constants.C_WHITE;
var BG_COLOR_HIGHLIGHT = Constants.C_LIGHT_YELLOW;
var masterModelFound = false;

    
main();



function main()
{
    file.DefineF("REPORT1", "Arial", 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 0, 0, 0, 0, 1);
    file.DefineF("REPORT2", "Arial", 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
    file.DefineF("REPORT3", "Arial", 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
    setReportHeaderFooterWithTitle(file, locale, true, true, false, getString("TITLE.DBT"));
    
    var asn = variantsComponent.evaluateOldestRequiredASN(database);
    if (asn != null && asn > -1) {
        file.BeginParagraph(Constants.FMT_LEFT, 5, 5, 5, 5, 0);
        formatstring1(getString("OLDEST_REQUIRED_ASN.DBI"), asn)
        file.Output("OLDEST_REQUIRED_ASN.DBI", "Arial", 10, Constants.C_BLACK, Constants.C_WHITE, 0, 0);
        file.EndParagraph();
    }
    
    var masterModels = database.Find(Constants.SEARCH_MODEL);
    
    processModels(masterModels);
    
    file.WriteReport();
}



function processModels(masterModels) {
    
    masterModels = ArisData.sort(masterModels, Constants.AT_NAME, Constants.SORT_TYPE, Constants.SORT_NONE, locale);
    
    for (var j = 0; j < masterModels.length; j++) {
        var masterModel = masterModels[j];
        outputMasterModel(masterModel);
    }
    
    if (!masterModelFound) {
        file.BeginParagraph(Constants.FMT_LEFT, 5, 5, 5, 5, 0);
        file.Output(getString("NO_MASTER_MODELS.INF"), "Arial", 10, Constants.C_BLACK, Constants.C_WHITE, 0, 0);
        file.EndParagraph();
    }
}



function outputMasterModel(masterModel) {

        var variants = masterModel.Variants();
        
        if (!variants || variants.length == 0) {
            return;
        }
        
        masterModelFound = true;
        
        var masterOwner = getModelOwner(masterModel);
        
        file.BeginTable(100, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0);
        file.TableRow();
        file.TableCell(getString("MASTER_MODEL.DBI"), 30, "Arial", 10 ,Constants.C_BLACK, BG_COLOR_MASTER, 0, Constants.FMT_LEFT | Constants.FMT_BOLD, 0);
        file.TableCell(masterModel.Name(locale), 70, "Arial", 10 ,Constants.C_BLACK, BG_COLOR_MASTER, 0, Constants.FMT_LEFT | Constants.FMT_BOLD, 0);
        file.TableRow();
        file.TableCell(getString("GROUP.DBI"), 30, "Arial", 8 ,Constants.C_BLACK, BG_COLOR_MASTER, 0, Constants.FMT_LEFT, 0);
        file.TableCell(masterModel.Group().Path(locale), 70, "Arial", 8 ,Constants.C_BLACK, BG_COLOR_MASTER, 0, Constants.FMT_LEFT, 0);
        file.TableRow();
        file.TableCell(getString("PERSON_RESPONSIBLE.DBI"), 30, "Arial", 8, Constants.C_BLACK, BG_COLOR_MASTER, 0, Constants.FMT_LEFT, 0);
        file.TableCell(masterOwner, 70, "Arial", 8, Constants.C_BLACK, BG_COLOR_MASTER, 0, Constants.FMT_LEFT, 0);
        file.TableRow();
        file.TableCell(getString("NUMBER_OF_VARIANTS.DBI"), 30, "Arial", 8, Constants.C_BLACK, BG_COLOR_MASTER, 0, Constants.FMT_LEFT, 0);
        file.TableCell(variants.length, 70, "Arial", 8, Constants.C_BLACK, BG_COLOR_MASTER, 0, Constants.FMT_LEFT, 0);
        file.TableRow();
        
        file.EndTable(" ", 100, "Arial", 10,Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT, 0);
        
        outputVariantModels(variants);
}



function outputVariantModels(variants) {
    variants = ArisData.sort(variants, Constants.AT_NAME, Constants.SORT_TYPE, Constants.SORT_NONE, locale);
    
    for (var i = 0; i < variants.length; i++) {
        var variantModel = variants[i];
        outputVariantModel(variantModel);
    }
}



function outputVariantModel(variantModel) {
    var variantOwner = getModelOwner(variantModel);
    var rolloutState = getRolloutState(variantModel);
    var lastRolloutTime = getLastRolloutTime(variantModel);
    var masterVersion = getMasterVersion(variantModel, rolloutState);
    
    file.BeginTable(95, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_RIGHT, 0);
    file.TableRow();
    file.TableCell(getString("VARIANT_MODEL.DBI"), 30, "Arial", 8 ,Constants.C_BLACK, BG_COLOR_VARIANT, 0, Constants.FMT_LEFT | Constants.FMT_BOLD, 0);
    file.TableCell(variantModel.Name(locale), 70, "Arial", 8 ,Constants.C_BLACK, BG_COLOR_VARIANT, 0, Constants.FMT_LEFT | Constants.FMT_BOLD, 0);
    file.TableRow();
    file.TableCell(getString("GROUP.DBI"), 30, "Arial", 8 ,Constants.C_BLACK, BG_COLOR_VARIANT, 0, Constants.FMT_LEFT, 0);
    file.TableCell(variantModel.Group().Path(locale), 70, "Arial", 8 ,Constants.C_BLACK, BG_COLOR_VARIANT, 0, Constants.FMT_LEFT, 0);
    file.TableRow();
    file.TableCell(getString("PERSON_RESPONSIBLE.DBI"), 30, "Arial", 8, Constants.C_BLACK, BG_COLOR_VARIANT, 0, Constants.FMT_LEFT, 0);
    file.TableCell(variantOwner, 70, "Arial", 8, Constants.C_BLACK, BG_COLOR_VARIANT, 0, Constants.FMT_LEFT, 0);
    file.TableRow();
    file.TableCell(getString("ROLLOUT_STATE.DBI"), 30, "Arial", 8, Constants.C_BLACK, BG_COLOR_VARIANT, 0, Constants.FMT_LEFT, 0);
    file.TableCell(rolloutState, 70, "Arial", 8, Constants.C_BLACK, (rolloutState == "Pending") ? BG_COLOR_HIGHLIGHT : BG_COLOR_VARIANT, 0, Constants.FMT_LEFT, 0);
    if (lastRolloutTime != null && lastRolloutTime != "") {
        file.TableRow();
        file.TableCell(getString("ROLLOUT_STATE_LAST_CHANGED.DBI"), 30, "Arial", 8, Constants.C_BLACK, BG_COLOR_VARIANT, 0, Constants.FMT_LEFT, 0);
        file.TableCell(lastRolloutTime, 70, "Arial", 8, Constants.C_BLACK, BG_COLOR_VARIANT, 0, Constants.FMT_LEFT, 0);
    }
    if (masterVersion != null && masterVersion != "") {
        file.TableRow();
        file.TableCell(getString("MASTER_VERSION.DBI"), 30, "Arial", 8, Constants.C_BLACK, BG_COLOR_VARIANT, 0, Constants.FMT_LEFT, 0);
        file.TableCell(masterVersion, 70, "Arial", 8, Constants.C_BLACK, BG_COLOR_VARIANT, 0, Constants.FMT_LEFT, 0);
    }
    file.TableRow();
    file.EndTable("\n", 95, "Arial", 8, Constants.C_BLACK, BG_COLOR_VARIANT, 0, Constants.FMT_RIGHT, 0);
}



function getMasterVersion(model, rolloutState) {
    if (rolloutState == "Pending") {
        return model.Attribute(Constants.AT_NEW_MASTER_ASN, locale).getValue();
    } else if (rolloutState == "Canceled" || rolloutState == "Finished") {
        return model.Attribute(Constants.AT_BASE_MASTER_ASN, locale).getValue();
    }
    return "";
}



function getRolloutState(model) {
    var attr = model.Attribute(Constants.AT_ROLL_OUT_STATE, locale);
    
    if (!attr.IsMaintained()) {
        return "Unknown";
    }
    
    return attr.getValue();
}



function getModelOwner(model) {
    var attr = model.Attribute(Constants.AT_PERS_RESP, locale, true);
    var userId = attr.getValue();
    var attr = model.Attribute(Constants.AT_PERS_RESP, locale, true);
    var userName = "";
    
    if (umcComponent != null) {
        var umcUser = umcComponent.getUserByName(attr.getValue());
        if (umcUser != null) {
            userName = umcUser.getFirstName() + " " + umcUser.getLastName();
        }
    }
    
    if ((userName == null || userName == "") && (userId == null || userId == "")) {
        return "-";
    }
    if (userName == null || userName == "") {
        return userId;
    }
    if (userId == null || userId == "") {
        return userName;
    }
    
    return userName + " (" + userId + ")";
}



function getLastRolloutTime(model) {
    var attr = model.Attribute(Constants.AT_LAST_ROLL_OUT_STATE_CHANGE, locale, true);
    return attr.getValue();
}
