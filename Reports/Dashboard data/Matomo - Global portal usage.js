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

const PIWIK_VISIT_TENANT_DIMENSION_ID = PARAMETER_VALUE_ACCESS.getParameterValue("Site_Visit_Tenant_Dimension_Id");

const EXPECTED_CUSTOM_DIMENSION_DATA_BY_ID = createExpectedCustomDimensionDataById();

const PIWIK_VISITS_SUMMARY_OVER_TIME_REPORT_PERIODS_AND_DATES = [
    new PeriodAndDate("day", "last7"),
    new PeriodAndDate("day", "last30"),
    new PeriodAndDate("day", "last365")
];

const SEGMENTATION_STRING = "dimension" + PIWIK_VISIT_TENANT_DIMENSION_ID + "==" + ArisData.getTenantName();

const XML_ENCODER = org.apache.commons.lang3.StringEscapeUtils.ESCAPE_XML11.with(org.apache.commons.lang3.text.translate.NumericEntityEscaper.between(0x7f, java.lang.Integer.MAX_VALUE));

main();

function main() {
    uploadDateFiltersXMLToADS();
    
    if(!piwikAccessIsValid(EXPECTED_CUSTOM_DIMENSION_DATA_BY_ID)) {
        return;
    }
    
    var filterLimit = FILTER_LIMIT;

    for(var i = 0; i < PIWIK_REPORT_PERIODS_AND_DATES.length; i++) {
        var periodAndDate = PIWIK_REPORT_PERIODS_AND_DATES[i];
        var period = periodAndDate.getPeriod();
        var date = periodAndDate.getDate();

        uploadPiwikVisitsSummaryReportToADS(period, date, filterLimit);
        uploadPiwikBrowserVersionsReportToADS(period, date, filterLimit);
        uploadPiwikBrowserEnginesReportToADS(period, date, filterLimit);
        uploadPiwikLanguageReportToADS(period, date, filterLimit);
        uploadPiwikOsVersionsReportToADS(period, date, filterLimit);
    }
    
    for(var i = 0; i < PIWIK_VISITS_SUMMARY_OVER_TIME_REPORT_PERIODS_AND_DATES.length; i++) {
        var periodAndDate = PIWIK_VISITS_SUMMARY_OVER_TIME_REPORT_PERIODS_AND_DATES[i];
        var period = periodAndDate.getPeriod();
        var date = periodAndDate.getDate();

        uploadPiwikVisitsSummaryReportToADS(period, date, filterLimit);
    }
}

function uploadPiwikVisitsSummaryReportToADS(period, date, filterLimit) {
    var url = buildPiwikVisitsSummaryReportURL(period, date, filterLimit);
    var xmlDocument;

    try {
		xmlDocument = getPiwikXMLDocument(url);
	} catch (error) {
		Context.writeLog(error);
		
		return;
	}

    if(period == "range") {        
        var xPathExpression = "/result/nb_uniq_visitors";
        var numberOfUniqueVisitorsString = xmlDocument.getTextContents(xPathExpression);
        
        if(numberOfUniqueVisitorsString.length == 0) {
            Context.writeLog("Did not find nb_uniq_visitors in Matomo visitsSummary report for the range period. Please check if unique visitor processing for the range period is enabled in the Matomo server configuration");
        }
    }
    
    uploadPiwikReportXMLToADS(PIWIK_REPORT_DIRECTORY_NAME, "VisitsSummary", xmlDocument.getRoot(), xmlDocument.asString(), period, date);
}

function buildPiwikVisitsSummaryReportURL(period, date, filterLimit) {
    return buildPiwikReportURL(
            "VisitsSummary.get", 
            period, 
            date,
            null,
            SEGMENTATION_STRING,
            "nb_visits,nb_uniq_visitors,avg_time_on_site",
            filterLimit,
            null);
}

function uploadPiwikBrowserVersionsReportToADS(period, date, filterLimit) {
    var url = buildPiwikBrowserVersionsReportURL(period, date, filterLimit);
    var xmlDocument;

    try {
		xmlDocument = getPiwikXMLDocument(url);
	} catch (error) {
		Context.writeLog(error);
		
		return;
	}

    var piwikReportXML = xmlDocument.asString();
    var xPathExpression = "/result/row/label";
    var browserVersionLabels = xmlDocument.getTextContents(xPathExpression);
    
    for(var i = 0; i < browserVersionLabels.length; i++) {
        var browserVersionLabel = browserVersionLabels[i];
        piwikReportXML = piwikReportXML.replace(browserVersionLabel, XML_ENCODER.translate(browserVersionLabel));
    }
    
    uploadPiwikReportXMLToADS(PIWIK_REPORT_DIRECTORY_NAME, "BrowserVersions", xmlDocument.getRoot(), piwikReportXML, period, date);
}

function buildPiwikBrowserVersionsReportURL(period, date, filterLimit) {
    return buildPiwikReportURL(
            "DevicesDetection.getBrowserVersions", 
            period, 
            date,
            null,
            SEGMENTATION_STRING,
            "nb_visits",
            filterLimit,
            "nb_visits");
}

function uploadPiwikBrowserEnginesReportToADS(period, date, filterLimit) {
    var url = buildPiwikBrowserEnginesReportURL(period, date, filterLimit);
    var xmlDocument;

    try {
		xmlDocument = getPiwikXMLDocument(url);
	} catch (error) {
		Context.writeLog(error);
		
		return;
	}

    var piwikReportXML = xmlDocument.asString();
    var xPathExpression = "/result/row/label";
    var browserEngineLabels = xmlDocument.getTextContents(xPathExpression);
    
    for(var i = 0; i < browserEngineLabels.length; i++) {
        var browserEngineLabel = browserEngineLabels[i];
        piwikReportXML = piwikReportXML.replace(browserEngineLabel, XML_ENCODER.translate(browserEngineLabel));
    }
    
    uploadPiwikReportXMLToADS(PIWIK_REPORT_DIRECTORY_NAME, "BrowserEngines", xmlDocument.getRoot(), piwikReportXML, period, date);
}

function buildPiwikBrowserEnginesReportURL(period, date, filterLimit) {
    return buildPiwikReportURL(
            "DevicesDetection.getBrowserEngines", 
            period, 
            date,
            null,
            SEGMENTATION_STRING,
            "nb_visits",
            filterLimit,
            "nb_visits");
}

function uploadPiwikLanguageReportToADS(period, date, filterLimit) {
    var url = buildPiwikLanguageReportURL(period, date, filterLimit);
    var xmlDocument;

    try {
		xmlDocument = getPiwikXMLDocument(url);
	} catch (error) {
		Context.writeLog(error);
		
		return;
	}

    var piwikReportXML = xmlDocument.asString();
    var xPathExpression = "/result/row/label";
    var languageLabels = xmlDocument.getTextContents(xPathExpression);
    
    for(var i = 0; i < languageLabels.length; i++) {
        var languageLabel = languageLabels[i];
        piwikReportXML = piwikReportXML.replace(languageLabel, XML_ENCODER.translate(languageLabel));
    }
    
    uploadPiwikReportXMLToADS(PIWIK_REPORT_DIRECTORY_NAME, "Language", xmlDocument.getRoot(), piwikReportXML, period, date);
}

function buildPiwikLanguageReportURL(period, date, filterLimit) {
    return buildPiwikReportURL(
            "UserLanguage.getLanguage", 
            period, 
            date,
            null,
            SEGMENTATION_STRING,
            "nb_visits",
            filterLimit,
            "nb_visits");
}

function uploadPiwikOsVersionsReportToADS(period, date, filterLimit) {
    var url = buildPiwikOsVersionsReportURL(period, date, filterLimit);
    var xmlDocument;

    try {
		xmlDocument = getPiwikXMLDocument(url);
	} catch (error) {
		Context.writeLog(error);
		
		return;
	}

    var piwikReportXML = xmlDocument.asString();
    var xPathExpression = "/result/row/label";
    var osVersionLabels = xmlDocument.getTextContents(xPathExpression);
    
    for(var i = 0; i < osVersionLabels.length; i++) {
        var osVersionLabel = osVersionLabels[i];
        piwikReportXML = piwikReportXML.replace(osVersionLabel, XML_ENCODER.translate(osVersionLabel));
    }
    
    uploadPiwikReportXMLToADS(PIWIK_REPORT_DIRECTORY_NAME, "OsVersions", xmlDocument.getRoot(), piwikReportXML, period, date);
}

function buildPiwikOsVersionsReportURL(period, date, filterLimit) {
    return buildPiwikReportURL(
            "DevicesDetection.getOsVersions", 
            period, 
            date,
            null,
            SEGMENTATION_STRING,
            "nb_visits",
            filterLimit,
            "nb_visits");
}

function createExpectedCustomDimensionDataById() {
    var expectedCustomDimensionDataById = new Map();
    expectedCustomDimensionDataById[PIWIK_VISIT_TENANT_DIMENSION_ID] = createCustomDimensionData("visit", true);
    
    return expectedCustomDimensionDataById;
}