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
 
var g_Output    = Context.createOutputObject();
var g_Locale    = 1033;
var UMC         = Context.getComponent("UMC");

var licenseCodesAndNames = new java.util.TreeMap(); 

main();

function main() {
    initializeOutput();
    startTableSheet();
    
    writeHeaderSection();
    writeRuleReport();
    
    g_Output.WriteReport();
}

function writeHeaderSection() {
    newTableRow();
    writeHeader(getString("REPORT_TITLE"), 13);
    writeHeader(formatstring1(getString("GENERATED_TIME"), currentTime()), 7);
    newTableRow();
    writeDescription(getString("REPORT_DESCRIPTION"), 7);
    newTableRow();
    writeTableCell("");
    writeLastActivationTime();
    writeAggregationInterval();
    newTableRow();
    writeTableCell("");
    newTableRow();
}

function writeLastActivationTime() {
    newTableRow();
    writeSubTitleLevelThree(monitoringStatusMessage(), 7);
}

function writeAggregationInterval() {
    newTableRow();
    var interval = UMC.getLicenseMonitoringInterval();
    writeSubTitleLevelThree(formatstring1(getString("INTERVAL_DESCRIPTION"), interval), 7);
}

function writeRuleReport() {
    var rule = UMC.getLicenseRule();
    var ruleType = rule.getType();
    
    if (ruleType == "DBP") {
        writeDBPReport();
    } else if (ruleType == "BASE_PEAK") {
        writeBasePeakReport();
    } else if (ruleType == "AGGREGATE_SCORE") {
        writeAggregateScoreReport(rule);
    }
}

function writeDBPReport() {
    writeSubTitle(getString("RULES_SUBTITLE"), 7);
    newTableRow();
    writeSubTitleLevelThree("    " + getString("CONCURRENT_LICENSE_RULE"), 7)
    newTableRow();
    writeDescription("        " + getString("CONCURRENT_LICENSE_RULE_DESC1"), 7);
    newTableRow();
    writeDescription("        " + getString("CONCURRENT_LICENSE_RULE_DESC2"), 7);
/**
    newTableRow();
    writeSubSubSubTitle("    " + getString("CONCURRENT_USER_RULE"), 7)
    newTableRow();
    writeDescription("        " + getString("CONCURRENT_USER_RULE_DESC1"), 7);
    newTableRow();
    writeDescription("        " + getString("CONCURRENT_USER_RULE_DESC2"), 7);
    **/
    newTableRow();
    writeTableCell("");
    newTableRow();
    writeTableCell("");
    newTableRow();
    
    writeTableHeaderCell(getString("DATE"), 20);
    writeTableHeaderCell(getString("LICENSE_GROUP"), 50);
    writeTableHeaderCell(getString("VIOLATION"), 30);
    writeTableHeaderCell(getString("VIOLATION_SCORE"), 20);
    
    var dateViolationMap = UMC.getAllLicenseRuleViolations();
    var dates = dateViolationMap.keySet();
    var datesIter = dates.iterator();
    while(datesIter.hasNext()) {
        newTableRow();
        var date = datesIter.next();
        var violationMapList = dateViolationMap.get(date);
        var violationMapListItr = violationMapList.iterator();
        var isEven = false;
        while(violationMapListItr.hasNext()) {
            newTableRow();
            var violationMap = violationMapListItr.next();
            writeTableCell(date, 20, isEven);
            writeTableCell(violationMap.get("VIOLATING_GROUP"), 50, isEven);
            if (violationMap.get("IS_CONCURRENT_LICENSE_VIOLATION") == "true") {
                writeTableCell(getString("CONCURRENT_LICENSE_RULE"), 30, isEven);
            } else {
                writeTableCell(getString("CONCURRENT_USER_RULE"), 30, isEven);
            }
            writeTableCell(violationMap.get("VIOLATION_SCORE"), 20, isEven);
            isEven = !isEven;
        }
    }
}

function writeBasePeakReport() {
    writeTableHeaderCell(getString("DATE"), 20);
    writeTableHeaderCell(getString("LICENSE_NAME"), 50);
    writeTableHeaderCell(getString("LICENSE_CODE"), 20);
    writeTableHeaderCell(getString("BASE_USAGE"), 20);
    writeTableHeaderCell(getString("ACTUAL_USAGE"), 20);
    writeTableHeaderCell(getString("OVER_USAGE"), 20);
    
    fillLicenseCodeAndName();
    
    var dateViolationMap = UMC.getAllLicenseRuleViolations();
    var dates = dateViolationMap.keySet();
    var datesIter = dates.iterator();
    while(datesIter.hasNext()) {
        newTableRow();
        var date = datesIter.next();
        var violationMapList = dateViolationMap.get(date);
        var violationMapListItr = violationMapList.iterator();
        var isEven = false;
        while(violationMapListItr.hasNext()) {
            newTableRow();
            var violationMap = violationMapListItr.next();
            writeTableCell(date, 20, isEven);
            writeTableCell(licenseCodesAndNames.get(violationMap.get("LICENSE_CODE")), 50, isEven);
            writeTableCell(violationMap.get("LICENSE_CODE"), 20, isEven);
            writeTableCell(violationMap.get("BASE_USAGE_VALUE"), 20, isEven);
            writeTableCell(violationMap.get("ACTUAL_USAGE_VALUE"), 20, isEven);
            writeTableCell((parseInt(violationMap.get("ACTUAL_USAGE_VALUE")) - parseInt(violationMap.get("BASE_USAGE_VALUE"))), 20, isEven);
            isEven = !isEven
        }
    }
}

function writeAggregateScoreReport(rule) {
    var thresholdValue = rule.getThreshold();  
    writeSubTitle(getString("THRESHOLD_SCORE") +  " - " + thresholdValue ,7);
    newTableRow();
    writeTableCell("");
    newTableRow();
    writeTableHeaderCell(getString("DATE"), 20);
    writeTableHeaderCell(getString("TOTAL_USAGE"), 30);
    writeTableHeaderCell(getString("OVER_USAGE_ABOVE_BASE"), 30);
    
    var dateViolationMap = UMC.getAllLicenseRuleViolations();
    var dates = dateViolationMap.keySet();
    var datesIter = dates.iterator();
    var isEven = false;
    while(datesIter.hasNext()) {
        newTableRow();
        var date = datesIter.next();
        var violationMapList = dateViolationMap.get(date);
        var violationMapListItr = violationMapList.iterator();
        while(violationMapListItr.hasNext()) {
            newTableRow();
            var violationMap = violationMapListItr.next();
            writeTableCell(date, 20, isEven);
            writeTableCell(violationMap.get("ACTUAL_SCORE"), 30, isEven);
            writeTableCell((parseFloat(violationMap.get("ACTUAL_SCORE")) - rule.getThreshold()), 30, isEven);   
            isEven = !isEven
        }
    }
}

function fillLicenseCodeAndName() {
    var licenses = UMC.getAllLicenses();
    for(var i = 0 ; i < licenses.size() ; i++) {
        licenseCodesAndNames.put(licenses.get(i).getProduct().getCode(), licenses.get(i).getProduct().getName());
    }
}

function monitoringStatusMessage() {
    //var activationDate = UMC.getLicenseMonitoringActivationTime();   
    var monActive = UMC.isLicenseMonitoringActive();
    if (monActive) {
        /**if (activationDate != null) {
            return formatstring1(getString("ACTIVATE_TIME_CURRENTLY_ACTIVATE"), formatTime(activationDate));
        } else {*/
            return getString("MONITORING_ACTIVE");
        /**}*/
    } else {
        /**if (activationDate != null) {
              return formatstring1(getString("ACTIVATE_TIME_CURRENTLY_INACTIVE"), formatTime(activationDate)); 
        } else {*/
            return getString("MONITORING_INACTIVATED");
        /**}*/
    }
}

function newTableRow() {
    if(!addTableRow()) {
        endTableSheet(getIndexedSheetName(g_CurrentSheetStartName, g_CurrentRowName));
        startTableSheet();
        g_CurrentSheetStartName = g_CurrentRowName;
        addTableRow();
    }
}