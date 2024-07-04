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

/*      DEMO engine     */

const C_PLUGIN_NAME = "DEMO";

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

//for log purpose
function getCurrentTime() {
    return new Date().toLocaleTimeString().split(" ")[0];
}

/*get values for script from context or use default values*/
function isDebugAllowed() {
    if (Context == undefined || Context.getProperty("allow_debug") == null) return false;
    else return Boolean(Context.getProperty("allow_debug"));
}

function getCommand() {
    if (Context == undefined || Context.getProperty("command") == null) return defaultCommand;
    else return String(Context.getProperty("command"));
}

function getArisLangs() {
    if (Context == undefined || Context.getProperty("arisLangs") == null) return ["en_US", "de_DE", "cz_CZ"];
    else return JSON.parse(Context.getProperty("arisLangs"));
}
 
function getPluginData() {
    if (Context != undefined && Context.getProperty("pluginData") != null) return JSON.parse(Context.getProperty("pluginData"));
    else {    
        return {
            conf: {},
            src_lang: "en_US",
            groups: [
                {
                    langs: ["cs_CZ","de_DE"],
                    attrs: ["Main group", "Second group"]                     
                }
            ]   
        };
    }
}
 
/*  Get languages from translation service

 * Some translators can have different list for supported languages for sources and different for targets.
 * We have to keep aris code of language for later use.
 * source   ["cs", "de", "en"] 
 * target   ["cs", , "en"] 
 * arisLang ["cs_CZ", "de_DE", "en_US"]
    
----------------------------------------------------------------------------------------------------------
Example code
----------------------------------------------------------------------------------------------------------
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
            var shortLangCode = arisLangs[i].split("_")[0];
            for (j = 0; j < supportedTranslatorLangs.length; j++) {
                                
                //1. Why the IF use 'startWith()' function?
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
    addDebugRecord(JSON.stringify(supported));
    
    if (B_ALLOW_DEBUG) Context.setProperty("debugOut", s_debugOut);    
    Context.setProperty("errors", JSON.stringify(s_errorOut));
    Context.setProperty("langs", JSON.stringify(supported));
}

function getLanguagesFromTranslator(params) {
    //URL - https://translator.com/languages
    var link = params.url + "/languages";
    var url = new java.net.URL(link);

    var con = url.openConnection();
    var status = con.getResponseCode();
    var response = readResponse(con, status);
    
    if (status == 200) {
        responseObj = JSON.parse("" + response);

        var langCodes = [];
        Object.keys(responseObj).forEach(function (lang, j) {            
            langCodes[j] = lang.toString();
        })
        return langCodes;
    }
    else {
        responseObj = JSON.parse("" + response);        
        addErrorRecord("\n\tcode: " +responseObj.error.code.toString() +"\n\t message: "+ responseObj.error.message +"\n\t url: "+ link);
        if (B_ALLOW_DEBUG) addDebugRecord(response);responseObj = JSON.parse("" + response);                
    }
    return;
}

*/
function getLanguages() {
    var arisLangs = getArisLangs();
    var supported = {
        source: [],
        target: [],
        arisLang: []
    };

    arisLangs.forEach(function(v, i) {
        supported.source[i] = arisLangs[i];
        supported.target[i] = arisLangs[i];
        supported.arisLang[i] = arisLangs[i];
    });

    if (B_ALLOW_DEBUG) addDebugRecord(JSON.stringify(supported));                    
    
    Context.setProperty("langs", JSON.stringify(supported));
} 

/*  Get translations from translation service
 * 
 * This is just example. Each translator has different shape of url, request body and response.
----------------------------------------------------------------------------------------------------------
Example code
----------------------------------------------------------------------------------------------------------

function translate() {
    var translateData = getPluginData();    
    
    var response = {
        groups: [],
    };

    translateData.groups.forEach(function (g, gIdx) {
        var requestBody = [];
        response.groups[gIdx] = {};
        response.groups[gIdx].attrs = [];
        g.attrs.forEach(function (attr, attrIdx) {
            requestBody[attrIdx] = { key: attr };
        });

        // Testing purpose locally "translated" values, please, comment out calling the function callTranslateService(..) 
        //response.groups[gIdx].attrs = translateMock(
        //    translateData.conf,           
        //    translateData.srcLang,
        //    g.langs,
        //    requestBody            
        //);

        response.groups[gIdx].attrs = callTranslateService(
            translateData.conf,           
            translateData.src_lang,
            g.langs,
            requestBody            
        );
    });
        
    if (B_ALLOW_DEBUG) {
        addDebugRecord("Response : \n" + JSON.stringify(response.groups[gIdx].attrs));    
        Context.setProperty("debugOut", s_debugOut);    
    }
    Context.setProperty("errors", JSON.stringify(s_errorOut));
    Context.setProperty("translated", JSON.stringify(response)); 
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

function callTranslateService(conf, srcLang, dstLangs, requestBody) 
{   
    var urlLink = buildURL(conf, srcLang, dstLangs);       
    var url = new java.net.URL(urlLink);
    var con = url.openConnection();

    con.setRequestMethod("POST");
    con.setRequestProperty("Ocp-Apim-Subscription-Key", conf.authKey);
    con.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
    con.setDoOutput(true);

    var out = new java.io.DataOutputStream(con.getOutputStream());
    
    out.writeBytes(JSON.stringify(requestBody));
    out.flush();
    out.close();

    var status = con.getResponseCode();    
    var response = readResponse(con, status);
    if (status == 200) {                            
        return JSON.parse("" + response);
    } else {   
       responseObj = JSON.parse("" + response);         
        var msg = "\n\tcode: " +responseObj.error.code.toString() +"\n\tmessage: "+ responseObj.error.message 
                    +"\n\turl: "+ urlLink +"\n\trequestBody: "+ JSON.stringify(requestBody);
        addErrorRecord(msg);       
        
        if (B_ALLOW_DEBUG) {
            addDebugRecord("requestBody = " + JSON.stringify(requestBody));
            addDebugRecord("response " + msg);
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
    if (conf.textType != undefined && conf.textType != "default") parameters.put("textType", conf.profanityAction);
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
    
    //Example request : https://translator.com/translate?api-version=3.0&from=en&to=zh-Hans&to=de
    return conf.url + "/translate?" + paramString;
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

*/

function translate() {
    var testTranslator = getPluginData();

    const conf = testTranslator.conf;
    
    var response = {
        groups: []
    }

    testTranslator.groups.forEach(function (g, gIdx) {
        response.groups[gIdx] = {};
        response.groups[gIdx].attrs = [];
        g.langs.forEach(function (lang, langIdx) {
            g.attrs.forEach(function (attr, attrIdx) {
                if (langIdx === 0) {
                    response.groups[gIdx].attrs[attrIdx] = [];
                }
                response.groups[gIdx].attrs[attrIdx][langIdx] = attr + " translated - " + lang;
            })
        })

    });    

    if (B_ALLOW_DEBUG) addDebugRecord(JSON.stringify(response));

    Context.setProperty("translated", JSON.stringify(response));  
}

/* Example of request data and mandatory response shape
----------------------------------------------------------------------------------------------------------  
Request     'conf' is unique for each traslation service
----------------------------------------------------------------------------------------------------------
{
    "conf": {
        "allowImport": "true",
        "label": ""
    },
    "src_lang": "en_US",
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
}
----------------------------------------------------------------------------------------------------------
Response    Attributes have to be in same order as in request.
            If multilingual case, attributes have to be in same order as in request 
            and the translated values of attribute gathered in the array 
            have to be ordered as languages in 'langs' array of group.
----------------------------------------------------------------------------------------------------------
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