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

/*      DEEPL engine    */

const C_PLUGIN_NAME = "DEEPL";

const C_BASE_URL = "https://api.deepl.com";
const C_FREE_BASE_URL = "https://api-free.deepl.com";
const C_API_VERSION = "v2";

const C_LANG_PATH = "languages";
const C_TRANSLATE_PATH = "translate";

//params default value for listbox options
const C_DEFAULT = "default";

//limit given by DeepL
const C_ARRAY_LIMIT = 50;      // max array size of texts per request
const C_CHAR_LIMIT = 15000;     // max count of chars per request (30kbytes -> str.length/2 for UTF-8)

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

function getPluginData() {
    if (Context != undefined && Context.getProperty("pluginData") != null) return JSON.parse(Context.getProperty("pluginData"));
    else { 
        //testing purpose - default config
        return {
            conf: {
                authKey: "",
                split: "default",
                preserveFormatting: 0,
                formality: "default"
            },
            src_lang: "en",
            groups:
            [
                {
                    langs: ["cs", "de"],
                    attrs:['one', 'two', 'three', 'four', 'cat', 'dog', 'long description \nof some attr for example']
                },
                {
                    langs:["de"],
                    attrs:['test', 'if', 'it', 'really', 'works']
                }
                    
            ]
        };
    }
}

function getBaseURL(authKey) {
    if (authKey == undefined || authKey == "") return C_FREE_BASE_URL;
    return authKey.slice(-3) == ":fx" ? C_FREE_BASE_URL : C_BASE_URL;
}

function getLanguages() {
    var arisLangs = getArisLangs();  
    var pluginData = getPluginData();  
    var supported = {
        source: [],
        target: [],
        arisLang: []
    };

    var supportedLangs = getSupportedLanguages(pluginData.conf, "source");
    if (supportedLangs != undefined) {  //get source languages failed, do not continue 
        mergeLanguages(arisLangs, supportedLangs, supported, "source");
        supportedLangs = getSupportedLanguages(pluginData.conf, "target");
        mergeLanguages(arisLangs, supportedLangs, supported, "target");
    }
    if (B_ALLOW_DEBUG) addDebugRecord(JSON.stringify(supported));  
        
    Context.setProperty("langs", JSON.stringify(supported));
} 

//Documentation - https://www.deepl.com/docs-api/other-functions/listing-supported-languages/
function getSupportedLanguages(params, type) {
    
    //URL - https://api-free.deepl.com/v2/languages or https://api.deepl.com/v2/languages
    var link = getBaseURL(params.authKey) + "/" + C_API_VERSION + "/" + C_LANG_PATH + "?type=" + type;
    var url = new java.net.URL(link);

    var con = url.openConnection();
    con.setRequestProperty("Authorization", "DeepL-Auth-Key " + params.authKey);
    
    var status = con.getResponseCode();
    var response = readResponse(con, status);
    
    if (status == 200) {
        responseObj = JSON.parse("" + response);

        var langCode = [];
        for (var i = 0; i < responseObj.length; i++) {        
            if (params.formality != undefined && params.formality != C_DEFAULT && responseObj[i].supports_formality == false) continue;
            langCode.push(responseObj[i].language.toLowerCase());        
        }
        return langCode;
    }
    else {
        var parsableResponse = true;            
        try {
            responseObj = JSON.parse("" + response);                
        } catch (e) {
            parsableResponse = false;
        }
        
        if (parsableResponse) addErrorRecord("\n\t message: "+ responseObj.message +"\n\t url: "+ link);              
        else addErrorRecord(response);               

        if (B_ALLOW_DEBUG) addDebugRecord(response);
    }


    return;
}

function mergeLanguages(arisLangs, supportedLangs, supported, type) {
    if (supportedLangs != undefined) {    
        for (i = 0; i < arisLangs.length; i++) {

            //first try - want to find exactly the same lang code
            var engineLang = findLanguage(arisLangs[i], supportedLangs);
            if (engineLang == undefined) {
                //second try - want to find at least the shorted lang code (from ARISs 'en-us' or 'en-gb' to 'en' only)
                //next example: chines language can be in translator zh-Hans and zh-Hant and Aris has only zh-CN. 
                //We will use the first one, but it could be not the best idea, desired lang could be the second one. 
                var shortLangCode = arisLangs[i].split("-")[0];
                engineLang = findLanguage(shortLangCode, supportedLangs);
            }

            if (engineLang == undefined) continue;            
            
            //In this engine the source and target are same, cause translation service has no difference between source and target languages
            switch (type) {
                case "source": supported.source[i] = engineLang;
                    break;
                case "target": supported.target[i] = engineLang;
                    break;
                default: 
                    break;                        
            }                    
            supported.arisLang[i] = arisLangs[i];
        }        
    }    
}

function findLanguage(arisLang, supportedLangs) {
    for (j = 0; j < supportedLangs.length; j++) {                
        if (supportedLangs[j].startsWith(arisLang)) {            
            return supportedLangs[j];
        }
    }
    return null;
}

/*
Limits for translation : https://docs.aws.amazon.com/translate/latest/dg/what-is-limits.html#limits

Example of data source from main script.
"groups": [
        {
            "langs": [
                "ar-sa"
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
                "ar-sa",
                "cs-cz"
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
                    "2. Processes translated - ar-sa"
                ],
                [
                    "6. Products translated - ar-sa"
                ],
                [
                    "7. Risk & Compliance translated - ar-sa"
                ],
                [
                    "4. IT systems translated - ar-sa"
                ]
            ]
        },
        {
            "attrs": [
                [
                    "1. Strategy translated - ar-sa",
                    "1. Strategy translated - cs-cz"
                ],
                [
                    "3. Organization translated - ar-sa",
                    "3. Organization translated - cs-cz"
                ],
                [
                    "5. Data translated - ar-sa",
                    "5. Data translated - cs-cz"
                ]
            ]
        }
    ]
}
*/
function translate() {    
    var deepLTranslate = getPluginData();
    
    const conf = deepLTranslate.conf;
    var response = {
        groups: []
    }

    var urlLink = getBaseURL(conf.authKey) + "/" + C_API_VERSION + "/" + C_TRANSLATE_PATH; 
    var confParams = getParamString(conf, deepLTranslate.src_lang);

    deepLTranslate.groups.forEach(function (group, gIdx) {
        response.groups[gIdx] = {};
        response.groups[gIdx].attrs = [];

        var indexHolder = 0;
        
        //create as many text parameters per request as possible according to the given limits per request
        do {
            var idx = 0;
            var charCount = urlLink.length;
            var paramTextSize = "&text=".length;
            var textParams = [];               

            while ((indexHolder + idx) < group.attrs.length                                     //index is less than attributes array length
                    && idx < C_ARRAY_LIMIT                                                      //and index is less than DeepL array limit                     
                    && (charCount + paramTextSize + group.attrs[indexHolder + idx].length) <= C_CHAR_LIMIT)     //count of chars is less than DeepL limit
            {
                    textParams.push(group.attrs[indexHolder + idx]); 
                    charCount += (paramTextSize + group.attrs[indexHolder + idx].length);                                                              
                    idx++;                
            }                                                                            

            // Testing locally -  please, comment out the function callTranslateService(..) 
            //                    and call function translateTest(..)           
            
            //send group of texts for one target language in single request               
            if (textParams.length != 0) {
                group.langs.forEach(function (trgLang, langIdx) {                                          

                    if (B_ALLOW_DEBUG) {
                        addDebugRecord("texts to translate - length = " + textParams.length); 
                        addDebugRecord("request - count of chars  = " + charCount); 
                        addDebugRecord("indexHolder = " + indexHolder);                                                                                                          
                    }                    

                    //var translations = translateTest(deepLTranslate.src_lang, textArray, trgLang);
                    var translatedObj = callTranslateService(conf.authKey, urlLink, confParams, textParams, trgLang, 3);  
                    
                    processResponse(translatedObj, response.groups[gIdx].attrs, indexHolder, langIdx, textParams.length);  
                    if (B_ALLOW_DEBUG) addDebugRecord("Response : \n" + JSON.stringify(response.groups[gIdx].attrs));
                });
            }   

            indexHolder += idx;  

        } while (indexHolder < group.attrs.length);
    });

    if (B_ALLOW_DEBUG) Context.setProperty("debugOut", s_debugOut);    

    Context.setProperty("translated", JSON.stringify(response));     
}

//result for testing
function translateTest(srcLang, textArray, trgLang) {
    var translations = [];
    textArray.forEach(function (text, tIdx) {
        translations.push({
            "detected_source_language": srcLang,
            "text": text + " translated - " + trgLang
        });
    });   

    return {"translations" : translations};
}

/*Shape of response - translation from EN to CS
{
    "translations":[
        {
            "detected_source_language": "EN",
            "text": "jeden"
        },
        {
            "detected_source_language": "EN",
            "text": "dva"
        },
        ......     
        {
            "detected_source_language": "EN",
            "text": "dlouhý popis\nnějakého atributu, například"
        }
        ......
    ]
}
*/  
function processResponse(translatedObj, responseGroupAttrArray, indexHolder, langIdx, textCount) {
    //Return even empty groups, but thanks to this, the main script is able to parse 'partialy' translated response and export it to XLS.
    //In main script is a check, if groups count from request matchs groups count from response.
    if (translatedObj == undefined) {        
        for (i = 0; i < textCount; i++) {
            responseGroupAttrArray[indexHolder + i] = [];
        }
    } else {
        translatedObj.translations.forEach(function (translation, tIdx) {
            if (responseGroupAttrArray[indexHolder + tIdx] == undefined) responseGroupAttrArray[indexHolder + tIdx] = [];
            responseGroupAttrArray[indexHolder + tIdx][langIdx] = translation.text;
        });
    }
}

function getParamString(conf, srcLang) {    
    
    var parameters = new java.util.HashMap();        
    
    //translated source language
    parameters.put("source_lang", srcLang.toUpperCase());    
    
    //optional parameters
    if (conf.split != undefined && conf.split != C_DEFAULT) parameters.put("split_sentences", conf.split);
    if (conf.preserveFormatting != undefined && conf.preserveFormatting != 0) parameters.put("preserve_formatting", conf.preserveFormatting);
    if (conf.formality != undefined && conf.formality != C_DEFAULT) parameters.put("formality", conf.formality);    
        
    return buildParamString(parameters);
}

//build param string from map
function buildParamString(parameters) {
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
    };

    return paramStringBuilder.toString();
}

//build param string from array
function buildTextToTranslate(textParams, trgLang) {
    var paramStringBuilder = new java.lang.StringBuilder();    
    textParams.forEach(function (text, tIdx) {        
        paramStringBuilder.append("text=");
        paramStringBuilder.append(java.net.URLEncoder.encode(text, "UTF-8"));
        paramStringBuilder.append("&");
    });        
    paramStringBuilder.append("target_lang=" + trgLang.toUpperCase());
    return paramStringBuilder.toString();    
}

function callTranslateService(authKey, urlLink, confParams, textParams, trgLang, loopMax) {
    
    var url = new java.net.URL(urlLink);
    var con = url.openConnection();
    
    con.setRequestMethod("POST");
    con.setRequestProperty("Authorization", "DeepL-Auth-Key " + authKey);    
    con.setDoOutput(true);

    var requestParams = confParams + "&" + buildTextToTranslate(textParams, trgLang);
    
    var out = new java.io.DataOutputStream(con.getOutputStream());
    out.writeBytes(requestParams);
    out.flush();
    out.close();

    var status = con.getResponseCode();    
    var response = readResponse(con, status);
    if (status == 200) {   
        if (B_ALLOW_DEBUG) addDebugRecord(response);                                 
        return JSON.parse("" + response);
    } else {
        if (loopMax > 0 && (status == 429 || status == 529)) {
            //429,529	Too many requests. Please wait and resend your request.        
            responseObj = JSON.parse("" + response);        
            addErrorRecord("\n\t message: "+ responseObj.message +"\n\t link: "+ urlLink + "?" + requestParams); 
            if (B_ALLOW_DEBUG) addDebugRecord("response = " + response);  
            
            letsWait(Date.now(), 60000); //60 sec
            loopMax--;        
            return callTranslateService(authKey, urlLink, confParams, textParams, trgLang, loopMax);
        } else {
            var parsableResponse = true;            
            try {
                responseObj = JSON.parse("" + response);                
            } catch (e) {
                parsableResponse = false;
            }
            
            if (parsableResponse) addErrorRecord("\n\t message: "+ responseObj.message +"\n\t link: "+ urlLink + "?" + requestParams);              
            else addErrorRecord(response);

            if (B_ALLOW_DEBUG) addDebugRecord("response = " + response);        
        }
    }
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

        if (connection.getErrorStream() == null) {
            try {
                connection.getInputStream();
            } catch (e) {
                content.append(e.message);
                content.append("\n\nVisit DeepL documentation: "); 
                content.append("\nwww.deepl.com/docs-api/accessing-the-api/error-handling/");
            }

        } else {
            var errStream = new java.io.BufferedReader(
                new java.io.InputStreamReader(connection.getErrorStream(), "UTF-8")
            );
            var inputLine;    
            while ((inputLine = errStream.readLine()) != null) {
                content.append(inputLine);
            }
            errStream.close();        
        }
    }

    return content;
}

function letsWait(startTime, timeOut) {    
    do {
        currentTime = Date.now();
    } while (currentTime - startTime < timeOut);
}