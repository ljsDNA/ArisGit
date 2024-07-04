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

/*      AZURE engine    */

const C_PLUGIN_NAME = "AZURE";

const C_BASE_URL = "https://api.cognitive.microsofttranslator.com";
const C_LANG_PATH = "languages";
const C_TRANSLATE_PATH = "translate";
const C_API_VERSION = "3.0";

//limits given by AZURE 
const C_HOUR_LIMIT = 2000000;   // max count of chars per hour
const C_ARRAY_LIMIT = 100;      // max array size of texts per request
const C_CHAR_LIMIT = 10000;     // max count of chars per request

//params default value for listbox options
const C_DEFAULT = "default";

//script commands
const C_LANG_COM = "getLangs";
const C_TRANS_COM = "translate";

//used when running script manualy
var defaultCommand = C_LANG_COM;
var usedCommand = getCommand();

//debug handling
var s_debugOut = "Debug output from " + C_PLUGIN_NAME + "\n";
var B_ALLOW_DEBUG = isDebugAllowed();

function addDebugRecord(msg){
    s_debugOut += (getCurrentTime() + " " + C_PLUGIN_NAME + ": " + msg + "\n");
}

//error handling
var s_errorOut = "";

function addErrorRecord(msg) {
    s_errorOut += (getCurrentTime() + " " + C_PLUGIN_NAME + ": " + msg + "\n");    
}

main();

function main() {
    try{
        switch (usedCommand) {
            case "getLangs":
                getLanguages();
                break;
            case "translate":
                translate();
                break;
            default:
                break;
        }
    } catch (e) {                                 
        addErrorRecord(e.message);        
    }

    Context.setProperty("errors", JSON.stringify(s_errorOut));
    if (B_ALLOW_DEBUG) Context.setProperty("debugOut", s_debugOut);
}

function getCurrentTime() {
    return new Date().toLocaleTimeString().split(" ")[0];
}

function isDebugAllowed() {
    if (Context == undefined || Context.getProperty("allow_debug") == null) return false;
    else return Context.getProperty("allow_debug");
}

function getCommand() {
    if (Context == undefined || Context.getProperty("command") == null) return defaultCommand;
    else return String(Context.getProperty("command"));
}

function getArisLangs() {
    if (Context == undefined || Context.getProperty("arisLangs") == null) return ["en-us", "de-de", "cs-cz", "zh-cn"];
    else return JSON.parse(Context.getProperty("arisLangs"));
}

function getLimitPerHour(conf) {
    if (conf.hourLimit == undefined || conf.hourLimit.length == 0 || isNaN(conf.hourLimit)) {
        if (B_ALLOW_DEBUG) addDebugRecord("Hourly char limit is not set or is not a numnber. Default value " +C_HOUR_LIMIT+ "is used.");        
        return C_HOUR_LIMIT;
    }
    else return parseInt(conf.hourLimit);
}

function getPluginData() {
    if (Context != undefined && Context.getProperty("pluginData") != null) return JSON.parse(Context.getProperty("pluginData"));
    else { 
        //translate configuration and translation of groups name for testing purpose                
        return {
            conf: {
                authKey: "",
                authToken: "",
                url: C_BASE_URL,
                apiVersion: C_API_VERSION,
                region: "global",
                category: "",  
                hourLimit: "",              
                textType: "default",                                
                profanityAction: "default",
                profanityMarker: "default",
                includeAlignment: false,
                includeSentenceLength: false,       
                allowFallback: false
            },
            src_lang: "en",
            groups: [
                {
                    langs: ["cs","de"],
                    attrs: [
                        "Main group",
                        "Second group"
                    ],
                },
            ]   
        };
    }
}

function getLanguages() {
    var arisLangs = getArisLangs();
    var pluginData = getPluginData();
    var supported = {
            source: [],
            target: [],
            arisLang: []
        }; 

    var supportedTranslatorLangs = getLanguagesFromTranslator(pluginData.conf);
    
    if (supportedTranslatorLangs != undefined) {    
        for (i = 0; i < arisLangs.length; i++) {

            //first try - want to find exactly the same lang code
            var engineLang = findLanguage(arisLangs[i], supportedTranslatorLangs);
            if (engineLang == undefined) {
                //second try - want to find at least the shorted lang code (from ARISs 'en-us' or 'en-gb' to 'en' only)
                //next example: chines language can be in translator zh-Hans and zh-Hant and Aris has only zh-CN. 
                //We will use the first one, but it could be not the best idea, desired lang could be the second one. 
                var shortLangCode = arisLangs[i].split("-")[0];
                engineLang = findLanguage(shortLangCode, supportedTranslatorLangs);
            }

            if (engineLang == undefined) continue;            
            
            //In this engine the source and target are same, cause translation service has no difference between source and target languages
            supported.source[i] = engineLang;
            supported.target[i] = engineLang;
            supported.arisLang[i] = arisLangs[i];
        }        
    }

    if (B_ALLOW_DEBUG) addDebugRecord(JSON.stringify(supported));  
    
    Context.setProperty("langs", JSON.stringify(supported));
}

function findLanguage(arisLang, supportedLangs) {
    for (j = 0; j < supportedLangs.length; j++) {                
        if (supportedLangs[j].startsWith(arisLang)) {            
            return supportedLangs[j];
        }
    }
    return null;
}

/* Example response from AZURE
Documentation - https://docs.microsoft.com/en-us/azure/cognitive-services/translator/reference/v3-0-languages

{
  "translation": {
    "af": { "name": "Afrikaans", "nativeName": "Afrikaans", "dir": "ltr" },
    .
    .
    "cs": { "name": "Czech", "nativeName": "Čeština", "dir": "ltr" },
    "cy": { "name": "Welsh", "nativeName": "Cymraeg", "dir": "ltr" },
    "da": { "name": "Danish", "nativeName": "Dansk", "dir": "ltr" },
    "de": { "name": "German", "nativeName": "Deutsch", "dir": "ltr" },
    "el": { "name": "Greek", "nativeName": "Ελληνικά", "dir": "ltr" },
    "en": { "name": "English", "nativeName": "English", "dir": "ltr" },
    "es": { "name": "Spanish", "nativeName": "Español", "dir": "ltr" },
    .
    .
    "zh-Hant": { "name": "Chinese Traditional", "nativeName": "繁體中文 (繁體)", "dir": "ltr"}
  }
}

*/
function getLanguagesFromTranslator(params) {
    //URL - https://api.cognitive.microsofttranslator.com/languages?api-version=3.0&scope=translation
    var link = params.url + "/" + C_LANG_PATH + "?" + "api-version=" + params.apiVersion + "&scope=translation";
    var url = new java.net.URL(link);

    var con = url.openConnection();
    var status = con.getResponseCode();
    var response = readResponse(con, status);
    
    if (status == 200) {
        responseObj = JSON.parse("" + response);

        var azureLangCode = [];
        Object.keys(responseObj.translation).forEach(function (lang, j) {            
            azureLangCode[j] = lang.toString();
        })
        return azureLangCode;
    }
    else {
        responseObj = JSON.parse("" + response);        
        addErrorRecord("\n\tcode: " +responseObj.error.code.toString() +"\n\t message: "+ responseObj.error.message +"\n\t url: "+ link);
        if (B_ALLOW_DEBUG) addDebugRecord(response);
    }
    return;
}

/*
Limits for translation : https://docs.microsoft.com/en-us/azure/cognitive-services/translator/request-limits

Example of data source from main script.
"groups": [
        {
            "langs": [
                "ar-SA"
            ],
            "attrs": [
                "2. Processes",
                "6. Products",
                "7. Risk & Compliance",
                "4. IT systems"
            ]
        },
        {
            "langs": [
                "ar-SA",
                "cs-CZ"
            ],
            "attrs": [
                "1. Strategy",
                "3. Organization",
                "5. Data"
            ]
        }
    ]

Manadatory shape of response for the main script.
{
    "groups": [
        {
            "attrs": [
                [
                    "2. Processes translated - ar-SA"
                ],
                [
                    "6. Products translated - ar-SA"
                ],
                [
                    "7. Risk & Compliance translated - ar-SA"
                ],
                [
                    "4. IT systems translated - ar-SA"
                ]
            ]
        },
        {
            "attrs": [
                [
                    "1. Strategy translated - ar-SA",
                    "1. Strategy translated - cs-CZ"
                ],
                [
                    "3. Organization translated - ar-SA",
                    "3. Organization translated - cs-CZ"
                ],
                [
                    "5. Data translated - ar-SA",
                    "5. Data translated - cs-CZ"
                ]
            ]
        }
    ]
}
*/
function translate() {
    var translateData = getPluginData();    
    var speedLimit =  Math.floor(getLimitPerHour(translateData.conf) / 60); //speedLimit is amount of chars per minute    
    var actualSpeed = 0;

    var response = {
        groups: []
    };   
    
    var startTime = Date.now();
    translateData.groups.forEach(function (group, gIdx) {                
        response.groups[gIdx] = {};
        response.groups[gIdx].attrs = [];
        var indexHolder = 0;
        
        //create as many requests as needed according to the given limits per request
        do {
            var idx = 0;
            var charCount = 0;  
            var requestBody = [];   
            
            //check if script exceeds the speet limit in next loop
            if ((indexHolder + idx) < group.attrs.length 
                && (actualSpeed + group.attrs[indexHolder + idx].length) > speedLimit) {                      
                
                if (B_ALLOW_DEBUG) addDebugRecord("Wait a minute. Speed limit roughly exceeded."); 
                letsWaitToNextMinute(startTime);
                if (B_ALLOW_DEBUG) addDebugRecord("Lets continue."); 
                actualSpeed = 0;
                startTime = Date.now();
            }
            
            while ((indexHolder + idx < group.attrs.length)                                 //index is less than attributes array length
                    && idx < C_ARRAY_LIMIT                                                  //index is less than AZURE array limit
                    && (charCount + group.attrs[indexHolder + idx].length) <= C_CHAR_LIMIT  //count of chars is less than AZURE limit
                    && (actualSpeed + group.attrs[indexHolder + idx].length) <= speedLimit) //actual total amount of chars is less than AZURE minute limit
            {
                    requestBody[idx] = { Text: group.attrs[indexHolder + idx] };                       
                    charCount += group.attrs[indexHolder + idx].length;
                    actualSpeed += group.attrs[indexHolder + idx].length;
                    idx++;                
            }

            indexHolder += idx;            

            if (B_ALLOW_DEBUG) {
                addDebugRecord("requestBody - length = " + requestBody.length); 
                addDebugRecord("new indexHolder = " + indexHolder);                               
                addDebugRecord("requestBody - count of chars  = " + charCount);                
                addDebugRecord("actual speed  = " + actualSpeed + "; limit = " + speedLimit);                                                
            }                            

            /* Testing locally -  please, comment out calling the function callTranslateService(..) 
            response.groups[gIdx].attrs = translateMock(
                translateData.conf,           
                translateData.srcLang,
                g.langs,
                requestBody            
            );*/

            //send requests by groups and multiple languages for each group is single request in azure        
            //and get object result from response
            if (requestBody.length != 0) {
                translatedObj = callTranslateService(
                                    translateData.conf,           
                                    translateData.src_lang,
                                    group.langs,
                                    requestBody);
                
                response.groups[gIdx].attrs = response.groups[gIdx].attrs.concat(transformResponse(translatedObj, requestBody.length));  
                if (B_ALLOW_DEBUG) addDebugRecord("Response : \n" + JSON.stringify(response.groups[gIdx].attrs));
            }   

        } while (indexHolder < group.attrs.length);
    });

    if (B_ALLOW_DEBUG) Context.setProperty("debugOut", s_debugOut);  
    
    Context.setProperty("translated", JSON.stringify(response));     
}

/*Example of response - translatedObj
[
    {
        "translations": [
            {
                "text": "Hlavní skupina",
                "to": "cs"
            },
            {
                "text": "Hauptgruppe",
                "to": "de"
            }
        ]
    },
    {
        "translations": [
            {
                "text": "Druhá skupina",
                "to": "cs"
            },
            {
                "text": "Zweite Gruppe",
                "to": "de"
            }
        ]
    }
]

Manadatory shape of response for main script
{
"groups": [        
    {
        "attrs": [
            [
                "Hlavní skupina",
                "Hauptgruppe"
            ],
            [
                "Druhá skupina",
                "Zweite Gruppe"
            ]
        ]
    }
]
*/
function transformResponse(translatedObj, itemsCount) {
    var attrs = [];

    //Return even empty groups, but thanks to this, the main script is able to parse 'partialy' translated response and export it to XLS.
    //In main script is a check, if groups count from request matchs groups count from response.
    if(translatedObj == undefined) {        
        for (i = 0; i < itemsCount; i++) {
            attrs.push([]);
        }
    } else {
        for (i = 0; i < translatedObj.length; i++) {
            var translatedAttr = [];
            for (j = 0; j < translatedObj[i].translations.length; j++) {
                translatedAttr.push(translatedObj[i].translations[j].text);
            };
            attrs.push(translatedAttr);
        };
    }
    return attrs;
}

//mock result for testing
function translateMock(auth, srcLang, dstLangs, requestBody) {
    var attr = [];
    requestBody.forEach(function (txt, idxSrc) {
        dstLangs.forEach(function (lang, langIdx) {
            if (langIdx === 0) {
                attr[idxSrc] = [];
            }
            attr[idxSrc][langIdx] = txt.Text + " - translated to " + lang;
        });
    });

    return attr;
}

function letsWaitToNextMinute(startTime) {    
    do {
        currentTime = Date.now();
    } while (currentTime - startTime < 60000);
}

/*
Example request
"https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hans&to=de"
     -H "Ocp-Apim-Subscription-Key: <client-secret>" -H "Content-Type: application/json; charset=UTF-8" 
     -d "[{'Text':'Hello, what is your name?'}, {'Text':'I am fine, thank you.'}]"

Translate documentation
https://docs.microsoft.com/en-us/azure/cognitive-services/translator/reference/v3-0-translate

Errors handling documentation 
https://docs.microsoft.com/en-us/azure/cognitive-services/translator/reference/v3-0-reference#errors
*/
function callTranslateService(conf, srcLang, dstLangs, requestBody) 
{   
    var urlLink = buildURL(conf, srcLang, dstLangs);       
    var url = new java.net.URL(urlLink);
    var con = url.openConnection();

    con.setRequestMethod("POST");
    con.setRequestProperty("Ocp-Apim-Subscription-Key", conf.authKey);
    if (conf.region != undefined && conf.region != "") con.setRequestProperty("Ocp-Apim-Subscription-Region", conf.region);
    con.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
    con.setDoOutput(true);   

    /*requestBody
    [{"Text":"Main group"},{"Text":"Second group"}]   
    */
    var out = new java.io.BufferedWriter(new java.io.OutputStreamWriter(con.getOutputStream(), "UTF-8"));
    out.write(JSON.stringify(requestBody));       
    out.flush();
    out.close();
        
    var status = con.getResponseCode();    
    var response = readResponse(con, status);
    if (status == 200) {   
        if (B_ALLOW_DEBUG) addDebugRecord(response);                                 
        return JSON.parse("" + response);
    } else {   
        responseObj = JSON.parse("" + response);         
        var msg = "\n\tcode: " +responseObj.error.code.toString() +"\n\tmessage: "+ responseObj.error.message 
                    +"\n\turl: "+ urlLink +"\n\trequestBody: "+ JSON.stringify(requestBody);
        addErrorRecord(msg);       
        
        if (B_ALLOW_DEBUG) {
            addDebugRecord("requestBody = " + JSON.stringify(requestBody));
            addDebugRecord("response = " + msg);
        }
    }    
}

function buildURL(conf, srcLang, dstLangs) {    
    var parameters = new java.util.HashMap();    
    //api-version
    parameters.put("api-version", conf.apiVersion);

    //translated source language
    parameters.put("from", srcLang);
    
    //translate to one or many languages ... default separator is comma    
    parameters.put("to", dstLangs.join());    
    
    //optional parameters
    if (conf.textType != undefined && conf.textType != C_DEFAULT) parameters.put("textType", conf.profanityAction);
    if (conf.profanityAction != undefined && conf.profanityAction != C_DEFAULT) parameters.put("profanityAction", conf.profanityAction);
    if (conf.profanityMarker != undefined && conf.profanityMarker != C_DEFAULT) parameters.put("profanityMarker", conf.profanityMarker);
    if (conf.includeAlignment != undefined && conf.includeAlignment) parameters.put("includeAlignment", conf.includeAlignment);
    if (conf.includeSentenceLength != undefined && conf.includeSentenceLength) parameters.put("includeSentenceLength", conf.includeSentenceLength);
    if (conf.allowFallback != undefined && conf.allowFallback) parameters.put("allowFallback", conf.allowFallback);    

    var paramStringBuilder = new java.lang.StringBuilder();
    var it = parameters.entrySet().iterator();
    while (it.hasNext()) {
        var entry = it.next();
        var key = entry.getKey();
        var value = entry.getValue();
        paramStringBuilder.append(java.net.URLEncoder.encode(key, "UTF-8"));
        paramStringBuilder.append("=");
        paramStringBuilder.append(java.net.URLEncoder.encode(value, "UTF-8"));
        if (it.hasNext()) paramStringBuilder.append("&");
    }   

    var paramString = paramStringBuilder.toString();    
    return conf.url + "/" + C_TRANSLATE_PATH + "?" + paramString;
}

function readResponse(connection, status) {
    var content = new java.lang.StringBuffer();
    
    if (status == 200) {
        var inStream = new java.io.BufferedReader(
            new java.io.InputStreamReader(connection.getInputStream(), "UTF-8")
        );
        var inputLine;    
        while ((inputLine = inStream.readLine()) != null) {
            content.append(inputLine);
        }
        inStream.close();
    } 
    else {
        var errStream = new java.io.BufferedReader(
            new java.io.InputStreamReader(connection.getErrorStream(), "UTF-8")
        );
        var inputLine;    
        while ((inputLine = errStream.readLine()) != null) {
            content.append(inputLine);
        }
        errStream.close();
    }

    return content;
}