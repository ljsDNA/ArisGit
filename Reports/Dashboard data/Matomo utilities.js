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

const PIWIK_REPORT_PERIODS_AND_DATES = [
    new PeriodAndDate("range", "last7"),
    new PeriodAndDate("range", "last30"),
    new PeriodAndDate("range", "last365")
];

const PARAMETER_VALUE_ACCESS = Context.getParameterValueAccess();

const PIWIK_SERVER_HOST = new java.lang.String(PARAMETER_VALUE_ACCESS.getParameterValue("Server_Host"));
const PIWIK_SERVER_PORT = PARAMETER_VALUE_ACCESS.getParameterValue("Server_Port");
const PIWIK_SERVER_PATH = new java.lang.String(PARAMETER_VALUE_ACCESS.getParameterValue("Server_Path"));

const PIWIK_AUTHENTICATION_TOKEN = PARAMETER_VALUE_ACCESS.getParameterValue("Authentication_Token");

const PIWIK_SITE_ID = PARAMETER_VALUE_ACCESS.getParameterValue("Site_Id");

const DATE_FILTERS_XML_STRING = new java.lang.String('<?xml version="1.0" encoding="UTF-8"?>' + 
                                '<date_filters>' + 
                                    '<date_filter>' + 
                                        '<label>Last Week</label>' + 
                                        '<value>last7</value>' + 
                                    '</date_filter>' + 
                                    '<date_filter>' + 
                                        '<label>Last Month</label>' + 
                                        '<value>last30</value>' + 
                                    '</date_filter>' + 
                                    '<date_filter>' + 
                                        '<label>Last Year</label>' + 
                                        '<value>last365</value>' + 
                                    '</date_filter>' + 
                                '</date_filters>');

const FILTER_LIMIT = 101;
const LANGUAGE = ArisData.getActiveDatabase().getDbLanguage().convertLocale(Context.getSelectedLanguage()).getLocale().getLanguage();

const HTTP_CLIENT = new HTTPClient("application/xml");

const PIWIK_REPORT_DIRECTORY_NAME = "Matomo";

function uploadDateFiltersXMLToADS() {
    var xmlDocument = new XMLDocument(DATE_FILTERS_XML_STRING);
    var xmlOutputObject = new XMLOutputObject(xmlDocument.getRoot(), DATE_FILTERS_XML_STRING);
    var dateFiltersDocumentTitle = new java.lang.String("MatomoDateFilters");

    uploadContentToADS(xmlOutputObject, PIWIK_REPORT_DIRECTORY_NAME, dateFiltersDocumentTitle.concat(".xml"), dateFiltersDocumentTitle, dateFiltersDocumentTitle);
}

function piwikAccessIsValid(expectedCustomDimensionDataById) {
    var dashboardsURL = new PiwikAPIURLBuilder(PIWIK_SERVER_HOST, PIWIK_SERVER_PORT, PIWIK_SERVER_PATH, "Dashboard.getDashboards").build();
    var siteFromIdURL = new PiwikAPIURLBuilder(PIWIK_SERVER_HOST, PIWIK_SERVER_PORT, PIWIK_SERVER_PATH, "SitesManager.getSiteFromId").
                            siteId(PIWIK_SITE_ID).
                            authenticationToken(PIWIK_AUTHENTICATION_TOKEN).
                            build();
    var pluginActivatedURL = new PiwikAPIURLBuilder(PIWIK_SERVER_HOST, PIWIK_SERVER_PORT, PIWIK_SERVER_PATH, "API.isPluginActivated").
                            siteId(PIWIK_SITE_ID).
                            queryParameter("pluginName", "CustomDimensions").
                            authenticationToken(PIWIK_AUTHENTICATION_TOKEN).
                            build();
    var sitesIdWithAdminAccessURL = new PiwikAPIURLBuilder(PIWIK_SERVER_HOST, PIWIK_SERVER_PORT, PIWIK_SERVER_PATH, "SitesManager.getSitesIdWithAdminAccess").
                            authenticationToken(PIWIK_AUTHENTICATION_TOKEN).
                            build();
    var configuredCustomDimensionsURL = new PiwikAPIURLBuilder(PIWIK_SERVER_HOST, PIWIK_SERVER_PORT, PIWIK_SERVER_PATH, "CustomDimensions.getConfiguredCustomDimensions").
                            siteId(PIWIK_SITE_ID).
                            authenticationToken(PIWIK_AUTHENTICATION_TOKEN).
                            build();
    
    try {
        getPiwikXMLDocument(dashboardsURL);
        
        if(!getPiwikXMLDocument(siteFromIdURL).asString().contains("<sitesearch>1</sitesearch>")) {
            throw "Site search is not enabled for the configured site on the Matomo server";
        }
        
        if(!getPiwikXMLDocument(pluginActivatedURL).asString().contains("<result>1</result>")) {
            throw "CustomDimensions plugin is either not installed or not active on the Matomo server";
        }
        
        if(getPiwikXMLDocument(sitesIdWithAdminAccessURL, true).asString().contains("<row>" + PIWIK_SITE_ID + "</row>")) {
            var customDimensionDataById = parsePiwikCustomDimensionsXMLDocument(getPiwikXMLDocument(configuredCustomDimensionsURL));
            var expectedCustomDimensionIds = expectedCustomDimensionDataById.keys();
            
            for(var i = 0; i < expectedCustomDimensionIds.length; i++) {
                var customDimensionId = expectedCustomDimensionIds[i];
                var customDimensionData = customDimensionDataById[customDimensionId];
                
                if(!customDimensionData) {
                    throw "Custom dimension " + customDimensionId + " does not exist for the configured site on the Matomo server";
                }
                
                var expectedCustomDimensionData = expectedCustomDimensionDataById[customDimensionId];
                
                if(customDimensionData.scope != expectedCustomDimensionData.scope) {
                    throw "Custom dimension " + customDimensionId + " of the configured site on the Matomo server does not have scope " + expectedCustomDimensionData.scope;
                }
                
                if(customDimensionData.active != expectedCustomDimensionData.active) {
                    throw "Custom dimension " + customDimensionId + " of the configured site on the Matomo server does not have active status " + expectedCustomDimensionData.active;
                }
            }
        }
                        
        return true;
    } catch (error) {
		Context.writeLog(error);
    }
    
    return false;
}

function parsePiwikCustomDimensionsXMLDocument(xmlDocument) {
    var customDimensionIds = xmlDocument.getTextContents("/result/row/idcustomdimension");
    var customDimensionScopes = xmlDocument.getTextContents("/result/row/scope");
    var customDimensionActiveStatuses = xmlDocument.getTextContents("/result/row/active");
    
    var customDimensionDataById = new Map();
    
    for(var i = 0; i < customDimensionIds.length; i++) {
        var customDimensionId = customDimensionIds[i];
        var customDimensionScope = customDimensionScopes[i];
        var customDimensionActiveStatus = customDimensionActiveStatuses[i];
        
        customDimensionDataById[customDimensionId] = createCustomDimensionData(customDimensionScope, customDimensionActiveStatus == "1");
    }
    
    return customDimensionDataById;
}

function buildPiwikReportURL(method, period, date, additionalParameters, segmentation, additionalColumns, filterLimit, filterSortColumn) {
    var piwikAPIURLBuilder = new PiwikAPIURLBuilder(PIWIK_SERVER_HOST, PIWIK_SERVER_PORT, PIWIK_SERVER_PATH, method).
                                siteId(PIWIK_SITE_ID).
                                period(period).
                                date(date).
                                language(LANGUAGE);
    
    if(additionalParameters) {
        for(var additionalParameterName in additionalParameters) {
            piwikAPIURLBuilder.queryParameter(additionalParameterName, additionalParameters[additionalParameterName]);
        }
    }
    
    piwikAPIURLBuilder.segment(segmentation);
    
    if(additionalColumns) {
        additionalColumns = "," + additionalColumns;
    } else {
        additionalColumns = "";
    }

    piwikAPIURLBuilder.showColumns("label" + additionalColumns).authenticationToken(PIWIK_AUTHENTICATION_TOKEN);

    if(filterLimit) {
        piwikAPIURLBuilder.filterLimit(filterLimit);
    }
    
    if(filterSortColumn) {
        piwikAPIURLBuilder.filterSortColumn(filterSortColumn);
    }
    
    return piwikAPIURLBuilder.build();
}

function uploadPiwikReportToADS(url, directoryName, reportName, period, date) {
    var xmlDocument;
	
	try {
		xmlDocument = getPiwikXMLDocument(url, true);
	} catch (error) {
		Context.writeLog(error);
		
		return;
	}

    uploadPiwikReportXMLToADS(
        directoryName,
        reportName,
        xmlDocument.getRoot(),
        xmlDocument.asString(),
        period, 
        date);
}

function getPiwikXMLDocument(url) {
    return getPiwikXMLDocument(url, false);
}

function getPiwikXMLDocument(url, emptyReportIsAllowed) {
    var httpResponse = HTTP_CLIENT.get(url);
	var responseCode = httpResponse.getCode();
	
	if(responseCode != 200) {
		throw "Received " + responseCode + " response code while accessing " + getPartialURLString(url);
	}
	
    var piwikReportXML = httpResponse.getBody();

	if(piwikReportXML.trim().isEmpty()) {
		throw "Received empty response while accessing " + getPartialURLString(url);
	}
	
	if(!piwikReportXML.contains("<?xml")) {
		if(piwikReportXML.contains("<!DOCTYPE html>") || piwikReportXML.contains("<html>")) {
			throw "Received response body seems to be an HTML document. It must be XML. Please check if the parameters used to access the Matomo server (host, port, path) are valid";
		} else {
			throw "Matomo report document is of unexpected format";
		}
	}
	
    if(!emptyReportIsAllowed && piwikReportIsEmpty(piwikReportXML)) {
		throw "Matomo report is empty";
        
        return;
	}
    
	var error = extractPiwikErrorMessage(piwikReportXML);
	
	if(error) {
		throw "Received error while accessing Matomo: " + error;
	}
	
    return new XMLDocument(piwikReportXML);
}

function piwikReportIsEmpty(piwikReportXML) {
	return piwikReportXML.contains("<result />");
}

function extractPiwikErrorMessage(piwikReportXML) {
	var errorMessagePrefix = '<error message="';
	var errorMessagePostfix = '" />';
    
    var errorMessageBeginIndex = piwikReportXML.indexOf(errorMessagePrefix);
    
    if(errorMessageBeginIndex == -1) {
		return null;
	}

	return piwikReportXML.substring(errorMessageBeginIndex + errorMessagePrefix.length, piwikReportXML.indexOf(errorMessagePostfix));
}

function uploadPiwikReportXMLToADS(directoryName, reportName, xmlRoot, xmlString, period, date) {
    var xmlOutputObject = new XMLOutputObject(xmlRoot, xmlString);
    var reportDocumentTitle = new java.lang.String("Matomo" + reportName + "Report_" + period + "_" + date);
    
    uploadContentToADS(xmlOutputObject, directoryName, reportDocumentTitle.concat(".xml"), reportDocumentTitle, reportDocumentTitle);
}

function getPartialURLString(url) {
	return url.getProtocol() + "://" + url.getHost() + ":" + url.getPort() + url.getPath();
}

function createCustomDimensionData(scope, active) {
    var customDimensionData = new Map();
    customDimensionData["scope"] = scope;
    customDimensionData["active"] = active;
    
    return customDimensionData;
}

function Map() {
    this.keys = function() {
        var keys = new Array();
        
        for(var key in this) {
            if(this.hasOwnProperty(key) && typeof this[key] != "function") {
               keys.push(key);
            }
        }
        
        return keys;
    }
    
    this.isEmpty = function() {
        return this.keys().length == 0;
    }
}

function PeriodAndDate(period, date) {    
    this.getPeriod = function() {
        return period;
    }
    
    this.getDate = function() {
        return date;
    }
}

function PiwikAPIURLBuilder(host, port, path, method) {
	if(!path.endsWith("index.php")) {
		if(!path.endsWith("/")) {
			path = path + "/";
		}
		
		path = path + "index.php";
	}
	
    this.urlBuilder = new URLBuilder(host, port, path).
                        queryParameter("module", "API").
                        queryParameter("method", method).
                        queryParameter("format", "xml").
                        queryParameter("expanded", "1");

    this.siteId = function(siteId) {
        return this.queryParameter("idSite", siteId);
    }
    
    this.period = function(period) {
        return this.queryParameter("period", period);
    }
    
    this.date = function(date) {
        return this.queryParameter("date", date);
    }
    
    this.segment = function(segment) {
        return this.queryParameter("segment", segment);
    }
    
    this.showColumns = function(columns) {
        return this.queryParameter("showColumns", columns);
    }
    
    this.authenticationToken = function(authenticationToken) {
        return this.queryParameter("token_auth", authenticationToken);
    }
    
    this.filterLimit = function(filterLimit) {
        return this.queryParameter("filter_limit", filterLimit);
    }
    
    this.filterSortColumn = function(filterSortColumn) {
        this.queryParameter("filter_sort_column", filterSortColumn);
        
        return this.queryParameter("filter_sort_order", "desc");
    }
    
    this.language = function(language) {
        return this.queryParameter("language", language);
    }
    
    this.queryParameter = function(name, value) {
        this.urlBuilder.queryParameter(name, value);
        
        return this;
    }
    
    this.build = function() {
        return this.urlBuilder.build();
    }
}

function URLBuilder(host, port, path) {
    if(!path.startsWith("/")) {
        path = "/" + path;
    }
    
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = "";
    
    this.queryParameter = function(name, value) {
        if(this.query.length > 0) {
            this.query = this.query + "&";
        }
        
        this.query = this.query + name + "=" + java.net.URLEncoder.encode(value, "UTF-8");
        
        return this;
    }
    
    this.build = function() {
        if(this.port == 443){
            return new java.net.URL("https://" + this.host + ":" + this.port + this.path + "?" + this.query);
        }else{
            return new java.net.URL("http://" + this.host + ":" + this.port + this.path + "?" + this.query);
        }

    }
}

function HTTPClient(acceptableConentType) {
    this.get = function(url) {

        obj = { getAcceptedIssuers : function() { return null; }, checkClientTrusted: function() { return; }, checkServerTrusted: function() { return; } };
        //var o = new JavaAdapter(javax.net.ssl.X509TrustManager, obj);
        //var oo = new Array();
        //oo.push(o);

        //var sc = javax.net.ssl.SSLContext.getInstance("SSL");
        //sc.init(null, oo, new java.security.SecureRandom());
        //javax.net.ssl.HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());

        var httpConnection = url.openConnection();
        httpConnection.setRequestMethod("GET");
        httpConnection.setRequestProperty("Accept", acceptableConentType);
        httpConnection.setRequestProperty("AccessMode", "HttpClient");

        var responseCode;

        try {
            responseCode = httpConnection.getResponseCode();
        } catch (error) {
            httpConnection.disconnect();

            throw "Could not connect to " + getPartialURLString(url) + ". " + error;
        }

        var responseBody = "";

        if(responseCode == 200) {
            var bufferedReader = new java.io.BufferedReader(new java.io.InputStreamReader(httpConnection.getInputStream(), "UTF-8"));
            var line;

            while((line = bufferedReader.readLine()) != null) {
                responseBody = responseBody + line;
            }
        }

        httpConnection.disconnect();

        return new HTTPResponse(responseCode, new java.lang.String(responseBody));
    }
}

function HTTPResponse(code, body) {
    this.getCode = function() {
        return code;
    }
    
    this.getBody = function() {
        return body;
    }
}

function XMLDocument(xmlString) {
    xmlString = new java.lang.String(xmlString);

    var documentBuilderFactory = javax.xml.parsers.DocumentBuilderFactory.newInstance();
    var documentBuilder = documentBuilderFactory.newDocumentBuilder();
    var stringReader = new java.io.StringReader(xmlString);
    var inputSource = new org.xml.sax.InputSource(stringReader);
    
    this.xmlDocument = documentBuilder.parse(inputSource);
    this.root = new XMLRoot(this.xmlDocument.getDocumentElement());

    this.getRoot = function() {
        return this.root;
    }
                
    var xPathfactory = javax.xml.xpath.XPathFactory.newInstance();
    
    this.xPath = xPathfactory.newXPath();
    
    this.getDescendants = function(xPathExpressionString) {
        var xPathExpression = this.xPath.compile(xPathExpressionString);
        var nodeList = xPathExpression.evaluate(this.xmlDocument, javax.xml.xpath.XPathConstants.NODESET);
        var results = new Array();
        
        for(var i = 0; i < nodeList.getLength(); i++) {
            results.push(new XMLElement(nodeList.item(i)));
        }
        
        return results;
    }
    
    this.getTextContents = function(xPathExpressionString) {
        var xPathExpression = this.xPath.compile(xPathExpressionString);
        var nodeList = xPathExpression.evaluate(this.xmlDocument, javax.xml.xpath.XPathConstants.NODESET);
        var results = new Array();
        
        for(var i = 0; i < nodeList.getLength(); i++) {
            results.push(nodeList.item(i).getTextContent());
        }
        
        return results;
    }
    
    this.asString = function() {
        return xmlString;
    }
}

function XMLElement(node) {
    this.node = node;
    
    this.getFirstChild = function(elementName) {
        var childNodes = this.node.getChildNodes();
        
        for(var i = 0; i < childNodes.getLength(); i++) {
            var childNode = childNodes.item(i);
            
            if(childNode.getNodeName() == elementName) {
                return new XMLElement(childNode);
            }
        }
        
        return null;
    }
    
    this.getTextContent = function() {
        return this.node.getTextContent();
    }
}

function XMLRoot(xmlDocumentElement) {
    this.getName = function() {
        return xmlDocumentElement.getTagName();
    }       
}

function XMLOutputObject(xmlRoot, xmlContent) {
    this.cloneHeader = function() {
        return "";
    }
    
    this.getRootElement = function() {
        return xmlRoot;
    }
        
    this.getContentAsByteArray = function() {
        return xmlContent.getBytes();
    }
}