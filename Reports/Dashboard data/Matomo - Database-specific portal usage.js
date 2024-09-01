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

const PIWIK_VISIT_ACTION_RESOURCE_PATH_DIMENSION_ID = PARAMETER_VALUE_ACCESS.getParameterValue("Site_Visit_Action_Resource_Path_Dimension_Id");
const PIWIK_VISIT_ACTION_RESOURCE_TYPE_DIMENSION_ID = PARAMETER_VALUE_ACCESS.getParameterValue("Site_Visit_Action_Resource_Type_Dimension_Id");

const EXPECTED_CUSTOM_DIMENSION_DATA_BY_ID = createExpectedCustomDimensionDataById();

const BASE_SEGMENT = "dimension" + PIWIK_VISIT_ACTION_RESOURCE_PATH_DIMENSION_ID + "=^" + ArisData.getTenantName();

const ENCODED_GUID_LENGTH = 22;
const DECODED_GUID_LENGTH = 16;
const GUID_DECODING_DIVISION_LIMIT = ENCODED_GUID_LENGTH - (ENCODED_GUID_LENGTH % 4);
const PADDING_DIGIT = '~';

const DIGIT_VALUES = createDigitValues();

const GUID_BYTE_ARRAY_LENGTH = 16;
const BINARY_TO_HEX = createBinaryToHex();

const XML_SPECIAL_CHARACTER_ENCODER = org.apache.commons.lang3.StringEscapeUtils.ESCAPE_XML11;
const XML_ENCODER = org.apache.commons.lang3.StringEscapeUtils.ESCAPE_XML11.with(org.apache.commons.lang3.text.translate.NumericEntityEscaper.between(0x7f, java.lang.Integer.MAX_VALUE));

main();

function main() {
    uploadDateFiltersXMLToADS();

    if(!piwikAccessIsValid(EXPECTED_CUSTOM_DIMENSION_DATA_BY_ID)) {
        return;
    }

    var language = Context.getSelectedLanguage();
    var database = ArisData.getActiveDatabase();
    var databaseName = database.Name(language);
    var databaseVersionInfo = new DatabaseVersionInformation(-1);
    var filterLimit = FILTER_LIMIT;
    var piwikReportDirectoryName = databaseName + "\\" + PIWIK_REPORT_DIRECTORY_NAME;

    for(var i = 0; i < PIWIK_REPORT_PERIODS_AND_DATES.length; i++) {
        var periodAndDate = PIWIK_REPORT_PERIODS_AND_DATES[i];
        var period = periodAndDate.getPeriod();
        var date = periodAndDate.getDate();

        uploadPiwikPageTitlesReportToADS(period, date, language, databaseName, databaseVersionInfo, filterLimit, piwikReportDirectoryName);
        uploadPiwikCustomDimensionReportToADS(period, date, databaseName, databaseVersionInfo, filterLimit, piwikReportDirectoryName);
        uploadPiwikSiteSearchKeywordsReportToADS(period, date, databaseName, databaseVersionInfo, filterLimit, piwikReportDirectoryName);
    }
}

function uploadPiwikPageTitlesReportToADS(period, date, language, databaseName, databaseVersionInfo, filterLimit, piwikReportDirectoryName) {
    var url = buildPiwikPageTitlesReportURL(period, date, databaseName, databaseVersionInfo, filterLimit);
    var xmlDocument;

    try {
        xmlDocument = getPiwikXMLDocument(url);
    } catch (error) {
        Context.writeLog(error);

        return;
    }

    var lessThanVersion3Point8XPathExpression = "/result/row/subtable/row/subtable/row/subtable/row/subtable/row/subtable/row";
    var currentXPathExpression = "/result/row";

    if(period != "range" && (date.startsWith("last") || date.startsWith("previous"))) {
        lessThanVersion3Point8XPathExpression = "/results" + lessThanVersion3Point8XPathExpression;
        currentXPathExpression = "/results" + currentXPathExpression;
    }

    var itemIdentifierElements = xmlDocument.getDescendants(lessThanVersion3Point8XPathExpression);

    if(itemIdentifierElements.length == 0) {
        itemIdentifierElements = xmlDocument.getDescendants(currentXPathExpression);
    }

    if(itemIdentifierElements.length == 0) {
        Context.writeLog("Did not find any item identifiers in Matomo pageTitles report");
    	/**uploadPiwikReportXMLToADS(piwikReportDirectoryName, "PageTitles", xmlDocument.getRoot(), reportXML, period, date);**/
        return;
    }

    var reportXML = createPageTitlesReportXML(itemIdentifierElements, databaseName);

    xmlDocument = new XMLDocument(reportXML);

    var itemIdentifierStrings = xmlDocument.getTextContents("/result/row/label");

    if(itemIdentifierStrings.length == 0) {
        Context.writeLog("Did not find any item identifiers in newly generated pageTitles report");

        return;
    }

    var itemIdentityLabelsByDatabaseName;

    try {
        itemIdentityLabelsByDatabaseName = parseItemIdentifierStrings(itemIdentifierStrings);
    } catch (error) {
        Context.writeLog(error);

        return;
    }

    var itemIdentityLabelsByASN = itemIdentityLabelsByDatabaseName[databaseName];

    if(!itemIdentityLabelsByASN) {
        Context.writeLog("Did not find any items for the database " + databaseName + " in the Matomo pageTitles report");

        return;
    }

    var asn = databaseVersionInfo.getASN();
    var itemIdentityLabels = itemIdentityLabelsByASN[asn];

    if(!itemIdentityLabels || itemIdentityLabels.isEmpty()) {
        Context.writeLog("Did not find any items for asn " + asn + " of database " + databaseName + " in the Matomo pageTitles report");

        return;
    }

    var databaseVersion = ArisData.openDatabaseVersion(databaseName, asn, true);
    var itemsByGUIDString = findGUIDs(databaseVersion, itemIdentityLabels.getGUIDStrings());

    if(itemsByGUIDString.isEmpty()) {
        Context.writeLog("Did not find any items for the identifiers in the Matomo pageTitles report");

        return;
    }

    var itemIdentifierStrings = itemIdentityLabels.getIdentifierStrings();

    for(var i = 0; i < itemIdentifierStrings.length; i++) {
        var itemIdentifierString = itemIdentifierStrings[i];
        var guidString = itemIdentityLabels.getGUIDString(itemIdentifierString);
        var item = itemsByGUIDString[guidString];
        var itemName;

        if(item) {
            itemName = XML_ENCODER.translate(item.Name(language, true));
        } else {
            itemName = "??? (" + itemIdentifierString + ")";
        }
        reportXML = reportXML.replace(itemIdentifierString, itemName);
    }

    uploadPiwikReportXMLToADS(piwikReportDirectoryName, "PageTitles", xmlDocument.getRoot(), reportXML, period, date);
}

function createPageTitlesReportXML(itemIdentifierElements, databaseName) {
    var reportXML = '<?xml version="1.0" encoding="utf-8" ?><result>';

    for(var i = 0; i < itemIdentifierElements.length; i++) {
        var itemIdentifierElement = itemIdentifierElements[i];

        var label = itemIdentifierElement.getFirstChild("label");

        if(label == null) {
            Context.writeLog("Did not find any label for the identifiers in the Matomo pageTitles report");
        }

        label = label.getTextContent();

        if(!label.match("/" + databaseName + "/")){
            continue
        }

        var nbHits = itemIdentifierElement.getFirstChild("nb_hits");

        if(nbHits == null) {
            Context.writeLog("Did not find nb_hits for the identifiers in the Matomo pageTitles report");
        }

        nbHits = nbHits.getTextContent();

        if(label.includes("/items")) {
            var lastIndexOfSlash = label.lastIndexOf("/");
            label = label.substring(lastIndexOfSlash + 1);
        }

        reportXML = reportXML + '<row><label>' + label + '</label><nb_hits>' + nbHits + '</nb_hits></row>'
    }

    return new java.lang.String(reportXML + '</result>');
}

function buildPiwikPageTitlesReportURL(period, date, databaseName, databaseVersionInfo, filterLimit) {
    return buildPiwikReportURL(
    "Actions.getPageTitles",
    period,
    date,
    null,
    buildSegmentationString("items", databaseName, databaseVersionInfo, null),
    "nb_hits",
    filterLimit,
    "nb_hits");
}

function uploadPiwikCustomDimensionReportToADS(period, date, databaseName, databaseVersionInfo, filterLimit, piwikReportDirectoryName) {
    uploadPiwikReportToADS(
    buildPiwikCustomDimensionReportURL(period, date, databaseName, databaseVersionInfo, filterLimit),
    piwikReportDirectoryName,
    "CustomDimension",
    period,
    date
    );
}

function buildPiwikCustomDimensionReportURL(period, date, databaseName, databaseVersionInfo, filterLimit) {
    var additionalParameters = new Array();

    additionalParameters["idDimension"] = PIWIK_VISIT_ACTION_RESOURCE_TYPE_DIMENSION_ID;

    return buildPiwikReportURL(
    "CustomDimensions.getCustomDimension",
    period,
    date,
    additionalParameters,
    buildSegmentationString("items", databaseName, databaseVersionInfo, null),
    "nb_hits",
    filterLimit,
    "nb_hits");
}

function uploadPiwikSiteSearchKeywordsReportToADS(period, date, databaseName, databaseVersionInfo, filterLimit, piwikReportDirectoryName) {
    var url = buildPiwikSiteSearchKeywordsReportURL(period, date, databaseName, databaseVersionInfo, filterLimit);
    var xmlDocument;

    try {
        xmlDocument = getPiwikXMLDocument(url);
    } catch (error) {
        Context.writeLog(error);

        return;
    }

    var piwikReportXML = xmlDocument.asString();
    var xPathExpression = "/result/row/label";
    var siteSearchKeywords = xmlDocument.getTextContents(xPathExpression);

    for(var i = 0; i < siteSearchKeywords.length; i++) {
        var siteSearchKeyword = siteSearchKeywords[i];
        piwikReportXML = piwikReportXML.replace(XML_SPECIAL_CHARACTER_ENCODER.translate(siteSearchKeyword), XML_ENCODER.translate(siteSearchKeyword));
    }

    uploadPiwikReportXMLToADS(piwikReportDirectoryName, "SiteSearchKeywords", xmlDocument.getRoot(), piwikReportXML, period, date);
}

function buildPiwikSiteSearchKeywordsReportURL(period, date, databaseName, databaseVersionInfo, filterLimit) {
    return buildPiwikReportURL(
    "Actions.getSiteSearchKeywords",
    period,
    date,
    null,
    buildSegmentationString("searches", databaseName, databaseVersionInfo, "publishing"),
    "nb_visits,nb_hits",
    filterLimit,
    "nb_visits");
}

function buildSegmentationString(resourceSegment, databaseName, databaseVersionInfo, additionalSegments) {
    var segmentationString = BASE_SEGMENT + "/" + resourceSegment + "/abs/" + databaseName + "/" + databaseVersionInfo.getLabel();

    if(additionalSegments) {
        segmentationString = segmentationString + "/" + additionalSegments;
    }

    if(!segmentationString.endsWith("/")) {
        segmentationString = segmentationString + "/";
    }

    return segmentationString;
}

function parseItemIdentifierStrings(itemIdentifierStrings) {
    var itemIdentityLabelsByDatabaseName = new Array();

    for(var i = 0; i < itemIdentifierStrings.length; i++) {
        try {
            var itemIdentifierString = itemIdentifierStrings[i];
            if(itemIdentifierString != null && new java.lang.String(itemIdentifierString).equals("Others")) {
                Context.writeLog("Found itemIdentifierString with value 'Others'. Entry will be skipped");
                continue;
            }
            var itemIdentifier = parseItemIdentifierString(itemIdentifierString);

            var databaseName = itemIdentifier.getDatabaseName();
            var itemIdentityLabelsByASN = itemIdentityLabelsByDatabaseName[databaseName];

            if(!itemIdentityLabelsByASN) {
                itemIdentityLabelsByASN = new Array();
                itemIdentityLabelsByDatabaseName[databaseName] = itemIdentityLabelsByASN;
            }

            var asn = itemIdentifier.getASN();
            var itemIdentityLabels = itemIdentityLabelsByASN[asn];

            if(!itemIdentityLabels) {
                itemIdentityLabels = new ItemIdentityLabels();
                itemIdentityLabelsByASN[asn] = itemIdentityLabels;
            }

            itemIdentityLabels.add(itemIdentifierString, toGUIDString(uncompressGUID(itemIdentifier.getItemId())));
        } catch (error) {
            Context.writeLog(error);
        }
    }

    return itemIdentityLabelsByDatabaseName;
}

function parseItemIdentifierString(itemIdentifierString) {
    var itemIdentifierSegments = itemIdentifierString.split("\\.");

    if(itemIdentifierSegments.length < 4) {
        throw "Unexpected item identifier format";
    }

    var databaseName = unescapeDatabaseName(new java.lang.String(itemIdentifierSegments[2]));
    var itemId = new java.lang.String(itemIdentifierSegments[3]);
    var asn = -1;

    if(itemIdentifierSegments.length > 4) {
        asn = parseInt(itemIdentifierSegments[4]);
    }

    return new ItemIdentifier(databaseName, asn, itemId);
}

function unescapeDatabaseName(databaseName) {
    return databaseName.replaceAll("~d", ".").replaceAll("~~", "~");
}

function toGUIDString(guidBytes) {
    var chars = new Array();
    var dstPos = 0;

    for(var i = 0; i < GUID_BYTE_ARRAY_LENGTH; i++) {
        var v = toIntValue(guidBytes[i]) & 0xff;

        var byteAsChars = BINARY_TO_HEX[v];
        chars[dstPos++] = byteAsChars[0];
        chars[dstPos++] = byteAsChars[1];

        if(dstPos == 8 || dstPos == 13 || dstPos==18 || dstPos==23) {
            chars[dstPos++] = '-';
        }
    }

    return new java.lang.StringBuilder().append(chars).toString();
}

function toIntValue(byteValue) {
    return java.lang.Byte(byteValue).intValue();
}

function uncompressGUID(compressedGUID) {
    var uncompressedGUID = new Array();
    var word = 0;
    var wordCursor = 0;
    var i = 0;

    while(i < GUID_DECODING_DIVISION_LIMIT) {
        word  = DIGIT_VALUES[compressedGUID.charAt(i++)] << 18;
        word += DIGIT_VALUES[compressedGUID.charAt(i++)] << 12;
        word += DIGIT_VALUES[compressedGUID.charAt(i++)] <<  6;
        word += DIGIT_VALUES[compressedGUID.charAt(i++)];

        switch (DECODED_GUID_LENGTH - wordCursor) {
            case 1:
            uncompressedGUID[wordCursor] = toByteValue(word >> 16);
            break;

            case 2:
            uncompressedGUID[wordCursor++] = toByteValue(word >> 16);
            uncompressedGUID[wordCursor]   = toByteValue(word >>  8);
            break;

            default:
            uncompressedGUID[wordCursor++] = toByteValue(word >> 16);
            uncompressedGUID[wordCursor++] = toByteValue(word >>  8);
            uncompressedGUID[wordCursor++] = toByteValue(word);
            break;
        }
    }

    // last 2 unpadded digits
    word  = DIGIT_VALUES[compressedGUID.charAt(20)] << 18;
    word += DIGIT_VALUES[compressedGUID.charAt(21)] << 12;

    uncompressedGUID[wordCursor] = toByteValue(word >> 16);

    return uncompressedGUID;
}

function toByteValue(intValue) {
    return new java.lang.Integer(intValue).byteValue();
}

function findGUIDs(database, guidStrings) {
    var itemsByGUIDString = new Map();
    var items = database.FindGUID(guidStrings);

    for(var i = 0; i < items.length; i++) {
        var item = items[i];
        var guidString = item.GUID();

        itemsByGUIDString[guidString] = item;
    }

    return itemsByGUIDString;
}

function DatabaseVersionInformation(asn) {
    this.getLabel = function() {
        if(asn == -1) {
            return "Workspace";
        } else {
            return "Version " + asn;
        }
    }

    this.getASN = function() {
        return asn;
    }
}

function ItemIdentifier(databaseName, asn, itemId) {
    this.getDatabaseName = function() {
        return databaseName;
    }

    this.getASN = function() {
        return asn;
    }

    this.getItemId = function() {
        return itemId;
    }
}

function ItemIdentityLabels() {
    this.identifierStrings = new Array();
    this.guidStrings = new Array();
    this.guidStringsByIdentifierString = new Map();

    this.add = function(identifierString, guidString) {
        this.identifierStrings.push(identifierString);
        this.guidStrings.push(guidString);
        this.guidStringsByIdentifierString[identifierString] = guidString;
    }

    this.getIdentifierStrings = function() {
        return this.identifierStrings;
    }

    this.getGUIDStrings = function() {
        return this.guidStrings;
    }

    this.getGUIDString = function(identifierString) {
        return this.guidStringsByIdentifierString[identifierString];
    }

    this.isEmpty = function() {
        return this.guidStringsByIdentifierString.isEmpty();
    }
}

function createExpectedCustomDimensionDataById() {
    var expectedCustomDimensionDataById = new Map();
    expectedCustomDimensionDataById[PIWIK_VISIT_ACTION_RESOURCE_PATH_DIMENSION_ID] = createCustomDimensionData("action", true);
    expectedCustomDimensionDataById[PIWIK_VISIT_ACTION_RESOURCE_TYPE_DIMENSION_ID] = createCustomDimensionData("action", true);

    return expectedCustomDimensionDataById;
}

function createDigitValues() {
    var digitValues = new Array();    
    digitValues[0] = -1;
    digitValues[1] = -1;
    digitValues[2] = -1;
    digitValues[3] = -1;
    digitValues[4] = -1;
    digitValues[5] = -1;
    digitValues[6] = -1;
    digitValues[7] = -1;
    digitValues[8] = -1;
    digitValues[9] = -1;
    digitValues[10] = -1;
    digitValues[11] = -1;
    digitValues[12] = -1;
    digitValues[13] = -1;
    digitValues[14] = -1;
    digitValues[15] = -1;
    digitValues[16] = -1;
    digitValues[17] = -1;
    digitValues[18] = -1;
    digitValues[19] = -1;
    digitValues[20] = -1;
    digitValues[21] = -1;
    digitValues[22] = -1;
    digitValues[23] = -1;
    digitValues[24] = -1;
    digitValues[25] = -1;
    digitValues[26] = -1;
    digitValues[27] = -1;
    digitValues[28] = -1;
    digitValues[29] = -1;
    digitValues[30] = -1;
    digitValues[31] = -1;
    digitValues[32] = -1;
    digitValues[33] = -1;
    digitValues[34] = -1;
    digitValues[35] = -1;
    digitValues[36] = -1;
    digitValues[37] = -1;
    digitValues[38] = -1;
    digitValues[39] = -1;
    digitValues[40] = -1;
    digitValues[41] = -1;
    digitValues[42] = -1;
    digitValues[43] = -1;
    digitValues[44] = -1;
    digitValues[45] = 62;
    digitValues[46] = -1;
    digitValues[47] = -1;
    digitValues[48] = 52;
    digitValues[49] = 53;
    digitValues[50] = 54;
    digitValues[51] = 55;
    digitValues[52] = 56;
    digitValues[53] = 57;
    digitValues[54] = 58;
    digitValues[55] = 59;
    digitValues[56] = 60;
    digitValues[57] = 61;
    digitValues[58] = -1;
    digitValues[59] = -1;
    digitValues[60] = -1;
    digitValues[61] = -1;
    digitValues[62] = -1;
    digitValues[63] = -1;
    digitValues[64] = -1;
    digitValues[65] = 0;
    digitValues[66] = 1;
    digitValues[67] = 2;
    digitValues[68] = 3;
    digitValues[69] = 4;
    digitValues[70] = 5;
    digitValues[71] = 6;
    digitValues[72] = 7;
    digitValues[73] = 8;
    digitValues[74] = 9;
    digitValues[75] = 10;
    digitValues[76] = 11;
    digitValues[77] = 12;
    digitValues[78] = 13;
    digitValues[79] = 14;
    digitValues[80] = 15;
    digitValues[81] = 16;
    digitValues[82] = 17;
    digitValues[83] = 18;
    digitValues[84] = 19;
    digitValues[85] = 20;
    digitValues[86] = 21;
    digitValues[87] = 22;
    digitValues[88] = 23;
    digitValues[89] = 24;
    digitValues[90] = 25;
    digitValues[91] = -1;
    digitValues[92] = -1;
    digitValues[93] = -1;
    digitValues[94] = -1;
    digitValues[95] = 63;
    digitValues[96] = -1;
    digitValues[97] = 26;
    digitValues[98] = 27;
    digitValues[99] = 28;
    digitValues[100] = 29;
    digitValues[101] = 30;
    digitValues[102] = 31;
    digitValues[103] = 32;
    digitValues[104] = 33;
    digitValues[105] = 34;
    digitValues[106] = 35;
    digitValues[107] = 36;
    digitValues[108] = 37;
    digitValues[109] = 38;
    digitValues[110] = 39;
    digitValues[111] = 40;
    digitValues[112] = 41;
    digitValues[113] = 42;
    digitValues[114] = 43;
    digitValues[115] = 44;
    digitValues[116] = 45;
    digitValues[117] = 46;
    digitValues[118] = 47;
    digitValues[119] = 48;
    digitValues[120] = 49;
    digitValues[121] = 50;
    digitValues[122] = 51;
    digitValues[123] = -1;
    digitValues[124] = -1;
    digitValues[125] = -1;
    digitValues[126] = 0;
    digitValues[127] = -1;
    digitValues[128] = -1;
    digitValues[129] = -1;
    digitValues[130] = -1;
    digitValues[131] = -1;
    digitValues[132] = -1;
    digitValues[133] = -1;
    digitValues[134] = -1;
    digitValues[135] = -1;
    digitValues[136] = -1;
    digitValues[137] = -1;
    digitValues[138] = -1;
    digitValues[139] = -1;
    digitValues[140] = -1;
    digitValues[141] = -1;
    digitValues[142] = -1;
    digitValues[143] = -1;
    digitValues[144] = -1;
    digitValues[145] = -1;
    digitValues[146] = -1;
    digitValues[147] = -1;
    digitValues[148] = -1;
    digitValues[149] = -1;
    digitValues[150] = -1;
    digitValues[151] = -1;
    digitValues[152] = -1;
    digitValues[153] = -1;
    digitValues[154] = -1;
    digitValues[155] = -1;
    digitValues[156] = -1;
    digitValues[157] = -1;
    digitValues[158] = -1;
    digitValues[159] = -1;
    digitValues[160] = -1;
    digitValues[161] = -1;
    digitValues[162] = -1;
    digitValues[163] = -1;
    digitValues[164] = -1;
    digitValues[165] = -1;
    digitValues[166] = -1;
    digitValues[167] = -1;
    digitValues[168] = -1;
    digitValues[169] = -1;
    digitValues[170] = -1;
    digitValues[171] = -1;
    digitValues[172] = -1;
    digitValues[173] = -1;
    digitValues[174] = -1;
    digitValues[175] = -1;
    digitValues[176] = -1;
    digitValues[177] = -1;
    digitValues[178] = -1;
    digitValues[179] = -1;
    digitValues[180] = -1;
    digitValues[181] = -1;
    digitValues[182] = -1;
    digitValues[183] = -1;
    digitValues[184] = -1;
    digitValues[185] = -1;
    digitValues[186] = -1;
    digitValues[187] = -1;
    digitValues[188] = -1;
    digitValues[189] = -1;
    digitValues[190] = -1;
    digitValues[191] = -1;
    digitValues[192] = -1;
    digitValues[193] = -1;
    digitValues[194] = -1;
    digitValues[195] = -1;
    digitValues[196] = -1;
    digitValues[197] = -1;
    digitValues[198] = -1;
    digitValues[199] = -1;
    digitValues[200] = -1;
    digitValues[201] = -1;
    digitValues[202] = -1;
    digitValues[203] = -1;
    digitValues[204] = -1;
    digitValues[205] = -1;
    digitValues[206] = -1;
    digitValues[207] = -1;
    digitValues[208] = -1;
    digitValues[209] = -1;
    digitValues[210] = -1;
    digitValues[211] = -1;
    digitValues[212] = -1;
    digitValues[213] = -1;
    digitValues[214] = -1;
    digitValues[215] = -1;
    digitValues[216] = -1;
    digitValues[217] = -1;
    digitValues[218] = -1;
    digitValues[219] = -1;
    digitValues[220] = -1;
    digitValues[221] = -1;
    digitValues[222] = -1;
    digitValues[223] = -1;
    digitValues[224] = -1;
    digitValues[225] = -1;
    digitValues[226] = -1;
    digitValues[227] = -1;
    digitValues[228] = -1;
    digitValues[229] = -1;
    digitValues[230] = -1;
    digitValues[231] = -1;
    digitValues[232] = -1;
    digitValues[233] = -1;
    digitValues[234] = -1;
    digitValues[235] = -1;
    digitValues[236] = -1;
    digitValues[237] = -1;
    digitValues[238] = -1;
    digitValues[239] = -1;
    digitValues[240] = -1;
    digitValues[241] = -1;
    digitValues[242] = -1;
    digitValues[243] = -1;
    digitValues[244] = -1;
    digitValues[245] = -1;
    digitValues[246] = -1;
    digitValues[247] = -1;
    digitValues[248] = -1;
    digitValues[249] = -1;
    digitValues[250] = -1;
    digitValues[251] = -1;
    digitValues[252] = -1;
    digitValues[253] = -1;
    digitValues[254] = -1;
    digitValues[255] = -1;
    
    return digitValues;
}

function createBinaryToHex() {
    var binaryToHex = new Array();
    
    for(var i = 0; i < 256; i++) {
        var hexValues = new Array();
        hexValues[0] = java.lang.Character.forDigit((i & 0xF0) >>> 4, 16);
        hexValues[1] = java.lang.Character.forDigit(i & 0x0F, 16);
        binaryToHex[i] = hexValues;
    }
    
    return binaryToHex;
}