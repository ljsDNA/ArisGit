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

/*      GOOGLE engine    */

const C_PLUGIN_NAME = "GOOGLE";

const C_BASE_URL = "https://translation.googleapis.com/language/translate/v2";
const C_LANG_PATH = "languages";

//limits given by google 
const C_ARRAY_LIMIT = 127;      // max array size of texts per request


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
    if (Context == undefined || Context.getProperty("arisLangs") == null) return ["en-US", "de-DE", "cs-CZ"];
    else return JSON.parse(Context.getProperty("arisLangs"));
}


function getPluginData() {
    if (Context != undefined && Context.getProperty("pluginData") != null) return JSON.parse(Context.getProperty("pluginData"));
    else { 
        //translate configuration and translation of groups name for testing purpose                
        return {
            conf: {
                authKey: "",
                format: "default"
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
            var shortLangCode = arisLangs[i].split("-")[0];
            for (j = 0; j < supportedTranslatorLangs.length; j++) {
                //1. Why the IF uses 'startWith()' function?
                //example: chines language can be in translator zh_Hans or zh_Hant and Aris has zh_CN. We will use the first one, but it could be not the best idea, first official lang could be the second  :) 
                //2. In this case source and target are same, cause translation service has no difference between source and target languages
                if (supportedTranslatorLangs[j].startsWith(shortLangCode)) {
                    supported.source[i] = supportedTranslatorLangs[j];
                    supported.target[i] = supportedTranslatorLangs[j];
                    supported.arisLang[i] = arisLangs[i];
                    break;
                }
            }
        }        
    }        

    if (B_ALLOW_DEBUG) addDebugRecord(JSON.stringify(supported));
       
    Context.setProperty("langs", JSON.stringify(supported));
}

/* Example response from google 
Documentation - https://cloud.google.com/translate/docs/reference/rest/v2/languages
{
    "data": {
        "languages": [
            {
                "language": "af"
            },
            {
                "language": "am"
            },
            {
                "language": "ar"
            },
            .
            .
            .
            {
                "language": "zh-TW"
            },
            {
                "language": "zu"
            }
        ]
    }
}

*/
function getLanguagesFromTranslator(params) {
    //URL - https://translation.googleapis.com/language/translate/v2/languages?key=
    var link = C_BASE_URL + "/" + C_LANG_PATH + "?" + "key=" + params.authKey;
    var url = new java.net.URL(link);

   var con = url.openConnection();
   var status = con.getResponseCode();
   var response = readResponse(con, status);
    
    // use for testing locally 
    //var status = 200;
    //  var response = '{"data": {"languages": [{"language": "en"},{"language": "de"},{"language": "ar"}]}}';
    
    if (status == 200) {
        responseObj = JSON.parse("" + response);

        var langCode = [];
        responseObj.data.languages.forEach(function (lang, j) {            
            langCode[j] = lang.language.toString();
        })
        return langCode;
    }
    else {
        responseObj = JSON.parse("" + response);        
        addErrorRecord("code: " +responseObj.error.code.toString() +"\nmessage: "+ responseObj.error.message 
                     + "\nurl: " + link + "\n\nVisit Google documentation: \nhttps://cloud.google.com/translate/docs/reference/rest/v2/languages#authorization");
        if (B_ALLOW_DEBUG) addDebugRecord(response);
    }
    return;
}

/*

Example of data source from main script.
"groups": [
        {
            "langs": [
                "ar_SA"
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
                "ar_SA",
                "cs_CZ"
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
                    "2. Processes translated - ar_SA"
                ],
                [
                    "6. Products translated - ar_SA"
                ],
                [
                    "7. Risk & Compliance translated - ar_SA"
                ],
                [
                    "4. IT systems translated - ar_SA"
                ]
            ]
        },
        {
            "attrs": [
                [
                    "1. Strategy translated - ar_SA",
                    "1. Strategy translated - cs_CZ"
                ],
                [
                    "3. Organization translated - ar_SA",
                    "3. Organization translated - cs_CZ"
                ],
                [
                    "5. Data translated - ar_SA",
                    "5. Data translated - cs_CZ"
                ]
            ]
        }
    ]
}
*/
function translate() {
    addDebugRecord("TRANSLATE START ");
    var translateData = getPluginData();      
    

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
            
            
            while ((indexHolder + idx < group.attrs.length)         //index is less than attributes array length
                    && idx < C_ARRAY_LIMIT )                        //limit strings per request
            {
                    requestBody[idx] = group.attrs[indexHolder + idx] ;                       
                    charCount += group.attrs[indexHolder + idx].length;
                    idx++;                
            }

                      

            if (B_ALLOW_DEBUG) {
                addDebugRecord("requestBody - length = " + requestBody.length); 
                addDebugRecord("new indexHolder = " + indexHolder);                               
                addDebugRecord("requestBody - count of chars  = " + charCount);                
                addDebugRecord("request Bodies " + JSON.stringify(requestBody));                                                
            }                            

            //send requests by groups and multiple languages for each group is single request in google        
            //and get object result from response
            if (requestBody.length != 0) {
                for (langIdx = 0; langIdx < group.langs.length; langIdx++) {
                    var lang = group.langs[langIdx];
                    /* for local testing */
                    // translatedObj = translateMock( translateData.conf,translateData.src_lang,lang,requestBody);

                    translatedObj = callTranslateService(
                        translateData.conf,
                        translateData.src_lang,
                        lang,
                        requestBody);


                    var res = transformResponse(translatedObj, requestBody.length);

                    for(i=0;i<res.length;i++){
                        if(response.groups[gIdx].attrs[indexHolder+i] == undefined){
                            response.groups[gIdx].attrs[indexHolder+i] = [];
                        } 
                        response.groups[gIdx].attrs[indexHolder+i][langIdx]=res[i];

                    }

                    if (B_ALLOW_DEBUG) addDebugRecord("Response : \n" + JSON.stringify(response.groups[gIdx].attrs));   
                }
                indexHolder += idx;
            }
        } while (indexHolder < group.attrs.length);
    });

    if (B_ALLOW_DEBUG) Context.setProperty("debugOut", s_debugOut);   
    
    Context.setProperty("translated", JSON.stringify(response));     
}

/*Example of response - translatedObj
{
    "data": {
        "translations": [
            {
                "translatedText": "Hlavní skupina"
            },
            {
                "translatedText": "Druhá skupina"
            }
        ]
    }
}
{
    "data": {
        "translations": [
            {
                "translatedText": "Hauptgruppe"
            },
            {
                "translatedText": "Zweite Gruppe"
            }
        ]
    }
}

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

    var data = translatedObj.data;
    //Return even empty groups, but thanks to this, the main script is able to parse 'partialy' translated response and export it to XLS.
    //In main script is a check, if groups count from request matchs groups count from response.
    if(data == undefined) {        
        for (i = 0; i < itemsCount; i++) {
            attrs.push([]);
        }
    } else {
            for (j = 0; j < data.translations.length; j++) {
                attrs.push(data.translations[j].translatedText);
            };

    }
    addDebugRecord("transform response attrs + " + JSON.stringify(attrs));
    return attrs;
}



//mock result for testing
function translateMock(auth, srcLang, lang, requestBody) {
    var result = {};

    var data = {};
    var translations = [];
    requestBody.forEach(function (txt, idxSrc) {
        translations[idxSrc] = [];
        translations[idxSrc] = { translatedText: txt + " - translated to " + lang };

    });
    data.translations = translations;
    result.data = data;
    return result;
}

function letsWaitToNextMinute(startTime) {    
    do {
        currentTime = Date.now();
    } while (currentTime - startTime < 60000);
}


function callTranslateService(conf, srcLang, dstLang, requestBody) 
{   
    var urlLink = buildURL(conf, srcLang, dstLang);       
    var url = new java.net.URL(urlLink);
    var con = url.openConnection();

    con.setRequestMethod("POST");
    con.setRequestProperty("Ocp-Apim-Subscription-Key", conf.authKey);
    if (conf.region != undefined && conf.region != "") con.setRequestProperty("Ocp-Apim-Subscription-Region", conf.region);
    con.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
    con.setDoOutput(true);

    var out = new java.io.BufferedWriter(new java.io.OutputStreamWriter(con.getOutputStream(), "UTF-8"));

    /*requestBody
    {"q": ["Hallo Welt","Guten Tag"],}   
    */
   var body ={"q":[]};

   requestBody.forEach(function (txt,index){
       body.q[index] = txt;
   })
    out.write(JSON.stringify(body));
    out.flush();
    out.close();
        
    var status = con.getResponseCode();    
    var response = readResponse(con, status);
    if (status == 200) {   
        if (B_ALLOW_DEBUG) addDebugRecord(response);                                 
        return JSON.parse("" + response);
    } else { 
        var msg;
        if(status == 404){
            msg = "code: 404 \nmessage: page not found" + "\nurl: "+ urlLink + "\nrequestBody: "+ JSON.stringify(body);
        }  else {
            responseObj = JSON.parse("" + response);         
            msg = "code: " +responseObj.error.code.toString() +"\nmessage: "+ responseObj.error.message 
                 +"\nurl: " + urlLink + "\nrequestBody: "+ JSON.stringify(body);
        }

        addErrorRecord(msg);       
        
        if (B_ALLOW_DEBUG) {
            addDebugRecord("requestBody = " + JSON.stringify(body));
            addDebugRecord("response = " + msg);
        }
    }    
}

function buildURL(conf, srcLang, dstLang) {    
    var parameters = new java.util.HashMap();   

    parameters.put("key", conf.authKey);
    if (conf.format != undefined && conf.format != C_DEFAULT) parameters.put("format", conf.format);
    //translated source language
    parameters.put("source", srcLang);    
    //translate target    
    parameters.put("target", dstLang);

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
    return C_BASE_URL + "/" + "?" + paramString;
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