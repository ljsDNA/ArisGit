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

//IMPORT TRANSLATED VALUES TO DATABASE - copied and edited from Import translated attributes (GUID f86fc130-eaea-11d8-12e0-9d2843560f51)

const C_SCRIPT_NAME = "IMPORT_SCRIPT";

// global declarations
var g_omethodfilter;
var g_nloc;
var g_workbook;

// var g_ntargetlang = 0;
var g_ntargetlangArr;
var slanguages;
var nlanguages;
var olanguages;

var g_btouch;
var itemsToTouchSet;

//script commands
const C_IMPORT_COM = "import";
const C_IMPORT_ANALYZE_COM = "import_with_analyze";

//used when running script manualy
var defaultCommand = C_IMPORT_COM;
var usedCommand = getCommand();

//debug handling
var s_debugOut = "Debug output from " + C_SCRIPT_NAME + "\n";
var B_ALLOW_DEBUG = isDebugAllowed();

function addDebugRecord(msg){
    s_debugOut += (getCurrentTime() + " " + C_SCRIPT_NAME + ": " + msg + "\n");
}

//error handling
var s_errorOut = "";

function addErrorRecord(msg) {
    s_errorOut += (getCurrentTime() + " " + C_SCRIPT_NAME + ": " + msg + "\n");    
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

function getPluginData() {
    if (Context != undefined && Context.getProperty("pluginData") != null) return JSON.parse(Context.getProperty("pluginData"));
    else { 
        //configuration of import for testing purpose                
        if (usedCommand == C_IMPORT_COM) 
            return {            
                srcLang: "1033",
                trgLangs: ["1029", "1031"],
                presentlangArr: ["1029", "1031", "1033"],
                btouch: false
            };
        else 
            return {
                srcLang: "1033",
                trgLangs: ["1029", "1031"],
                presentlangArr: [],
                btouch: false
            };
    }
}

main();

function main() {
    try{
        var config = getPluginData();
        initImportVariables(config);

        loadExcelWorkbook();        
        if (B_ALLOW_DEBUG) addDebugRecord("Command: " + usedCommand);
        
        switch (usedCommand) {
            case "import":                          //used for import from Import translations script                                              
                importTranslatedAttributes(config.presentlangArr);
                break;
            case "import_with_analyze":             //used for direct import from Export translations script                                                
                var langsInFile = analyzeLanguagesInFile();
                importTranslatedAttributes(langsInFile);
                break;
            default:
                break;
        }

    } catch (e) {                                
        addErrorRecord(e.message);        
    }
    
    Context.setProperty("errors", JSON.stringify(s_errorOut));
    if (B_ALLOW_DEBUG) Context.setProperty("debugOut", JSON.stringify(s_debugOut));
}

function loadExcelWorkbook() {
    var byteStream = Context.getProperty("byteOutput");
    //for testing use this byteStream. It is the translation of groups name with Demo engine to Czech lang. UMG Main group and 7 groups inside of Main group.
    //var byteStream = [-48,-49,17,-32,-95,-79,26,-31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,59,0,3,0,-2,-1,9,0,6,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,2,0,0,0,1,0,0,0,-2,-1,-1,-1,0,0,0,0,1,0,0,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,82,0,111,0,111,0,116,0,32,0,69,0,110,0,116,0,114,0,121,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,22,0,5,1,-1,-1,-1,-1,-1,-1,-1,-1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,16,0,0,0,0,0,0,87,0,111,0,114,0,107,0,98,0,111,0,111,0,107,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,0,2,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-53,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-2,-1,-1,-1,-3,-1,-1,-1,-2,-1,-1,-1,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,-2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,16,0,0,0,17,0,0,0,18,0,0,0,19,0,0,0,20,0,0,0,21,0,0,0,22,0,0,0,23,0,0,0,24,0,0,0,25,0,0,0,26,0,0,0,27,0,0,0,28,0,0,0,29,0,0,0,30,0,0,0,31,0,0,0,32,0,0,0,33,0,0,0,34,0,0,0,35,0,0,0,36,0,0,0,37,0,0,0,38,0,0,0,39,0,0,0,40,0,0,0,41,0,0,0,42,0,0,0,43,0,0,0,44,0,0,0,45,0,0,0,46,0,0,0,47,0,0,0,48,0,0,0,49,0,0,0,50,0,0,0,51,0,0,0,52,0,0,0,53,0,0,0,54,0,0,0,55,0,0,0,56,0,0,0,57,0,0,0,58,0,0,0,59,0,0,0,60,0,0,0,61,0,0,0,62,0,0,0,63,0,0,0,-2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,9,8,16,0,0,6,5,0,-45,16,-52,7,65,0,0,0,6,0,0,0,-110,0,-30,0,56,0,0,0,0,0,-1,-1,-1,0,0,112,-106,0,-14,-14,-14,0,0,0,-1,0,-1,-1,0,0,-1,0,-1,0,0,-1,-1,0,-128,0,0,0,0,-128,0,0,0,0,-128,0,-128,-128,0,0,-128,0,-128,0,0,-128,-128,0,-64,-64,-64,0,-128,-128,-128,0,-103,-103,-1,0,-103,51,102,0,-1,-1,-52,0,-52,-1,-1,0,102,0,102,0,-1,-128,-128,0,0,102,-52,0,-52,-52,-1,0,0,0,-128,0,-1,0,-1,0,-1,-1,0,0,0,-1,-1,0,-128,0,-128,0,-128,0,0,0,0,-128,-128,0,0,0,-1,0,0,-52,-1,0,-52,-1,-1,0,-52,-1,-52,0,-1,-1,-103,0,-103,-52,-1,0,-1,-103,-52,0,-52,-103,-1,0,-1,-52,-103,0,51,102,-1,0,51,-52,-52,0,-103,-52,0,0,-1,-52,0,0,-1,-103,0,0,-1,102,0,0,102,102,-103,0,-106,-106,-106,0,0,51,102,0,51,-103,102,0,0,51,0,0,51,51,0,0,-103,51,0,0,-103,51,102,0,51,51,-103,0,51,51,51,0,-31,0,2,0,-80,4,-63,0,2,0,0,0,-30,0,0,0,92,0,112,0,12,0,0,83,66,82,65,80,80,55,48,83,82,86,36,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,66,0,2,0,-80,4,97,1,2,0,0,0,61,1,2,0,0,0,-100,0,2,0,14,0,25,0,2,0,0,0,18,0,2,0,0,0,19,0,2,0,0,0,-81,1,2,0,0,0,-68,1,2,0,0,0,61,0,18,0,104,1,14,1,92,58,-66,35,56,0,0,0,0,0,1,0,88,2,64,0,2,0,0,0,-115,0,2,0,0,0,34,0,2,0,0,0,14,0,2,0,1,0,-73,1,2,0,0,0,-38,0,2,0,0,0,49,0,21,0,-56,0,0,0,-1,127,-112,1,0,0,0,0,0,0,5,0,65,114,105,97,108,49,0,21,0,-56,0,0,0,-1,127,-112,1,0,0,0,0,0,0,5,0,65,114,105,97,108,49,0,21,0,-56,0,0,0,-1,127,-112,1,0,0,0,0,0,0,5,0,65,114,105,97,108,49,0,21,0,-56,0,0,0,-1,127,-112,1,0,0,0,0,0,0,5,0,65,114,105,97,108,49,0,21,0,-56,0,0,0,9,0,-68,2,0,0,0,0,0,0,5,0,65,114,105,97,108,49,0,21,0,-56,0,0,0,23,0,-68,2,0,0,0,0,0,0,5,0,65,114,105,97,108,49,0,21,0,-56,0,0,0,8,0,-112,1,0,0,0,0,0,0,5,0,65,114,105,97,108,30,4,26,0,5,0,21,0,0,34,36,34,35,44,35,35,48,95,41,59,40,34,36,34,35,44,35,35,48,41,30,4,31,0,6,0,26,0,0,34,36,34,35,44,35,35,48,95,41,59,91,82,101,100,93,40,34,36,34,35,44,35,35,48,41,30,4,32,0,7,0,27,0,0,34,36,34,35,44,35,35,48,46,48,48,95,41,59,40,34,36,34,35,44,35,35,48,46,48,48,41,30,4,37,0,8,0,32,0,0,34,36,34,35,44,35,35,48,46,48,48,95,41,59,91,82,101,100,93,40,34,36,34,35,44,35,35,48,46,48,48,41,30,4,53,0,42,0,48,0,0,95,40,34,36,34,42,32,35,44,35,35,48,95,41,59,95,40,34,36,34,42,32,40,35,44,35,35,48,41,59,95,40,34,36,34,42,32,34,45,34,95,41,59,95,40,64,95,41,30,4,44,0,41,0,39,0,0,95,40,42,32,35,44,35,35,48,95,41,59,95,40,42,32,40,35,44,35,35,48,41,59,95,40,42,32,34,45,34,95,41,59,95,40,64,95,41,30,4,61,0,44,0,56,0,0,95,40,34,36,34,42,32,35,44,35,35,48,46,48,48,95,41,59,95,40,34,36,34,42,32,40,35,44,35,35,48,46,48,48,41,59,95,40,34,36,34,42,32,34,45,34,63,63,95,41,59,95,40,64,95,41,30,4,52,0,43,0,47,0,0,95,40,42,32,35,44,35,35,48,46,48,48,95,41,59,95,40,42,32,40,35,44,35,35,48,46,48,48,41,59,95,40,42,32,34,45,34,63,63,95,41,59,95,40,64,95,41,-32,0,20,0,0,0,0,0,-11,-1,32,0,0,0,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,1,0,0,0,-11,-1,32,0,0,-12,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,1,0,0,0,-11,-1,32,0,0,-12,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,2,0,0,0,-11,-1,32,0,0,-12,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,2,0,0,0,-11,-1,32,0,0,-12,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,0,0,0,0,-11,-1,32,0,0,-12,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,0,0,0,0,-11,-1,32,0,0,-12,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,0,0,0,0,-11,-1,32,0,0,-12,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,0,0,0,0,-11,-1,32,0,0,-12,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,0,0,0,0,-11,-1,32,0,0,-12,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,0,0,0,0,-11,-1,32,0,0,-12,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,0,0,0,0,-11,-1,32,0,0,-12,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,0,0,0,0,-11,-1,32,0,0,-12,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,0,0,0,0,-11,-1,32,0,0,-12,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,0,0,0,0,-11,-1,32,0,0,-12,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,0,0,0,0,1,0,32,0,0,0,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,1,0,43,0,-11,-1,32,0,0,-8,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,1,0,41,0,-11,-1,32,0,0,-8,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,1,0,44,0,-11,-1,32,0,0,-8,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,1,0,42,0,-11,-1,32,0,0,-8,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,1,0,9,0,-11,-1,32,0,0,-8,0,0,0,0,0,0,0,0,-64,32,-32,0,20,0,5,0,0,0,0,0,9,0,0,-72,17,17,8,4,8,4,0,4,10,5,-32,0,20,0,6,0,0,0,0,0,9,0,0,-72,17,17,8,4,8,4,0,4,10,5,-32,0,20,0,7,0,0,0,0,0,9,0,0,-72,17,17,8,4,8,4,0,4,9,32,-32,0,20,0,7,0,0,0,0,0,9,0,0,-72,17,17,8,4,8,4,0,4,11,32,-109,2,4,0,16,-128,3,-1,-109,2,4,0,17,-128,6,-1,-109,2,4,0,18,-128,4,-1,-109,2,4,0,19,-128,7,-1,-109,2,4,0,0,-128,0,-1,-109,2,4,0,20,-128,5,-1,96,1,2,0,0,0,-123,0,14,0,114,10,0,0,0,0,6,0,71,114,111,117,112,115,-116,0,4,0,1,0,1,0,-82,1,4,0,1,0,1,4,23,0,8,0,1,0,0,0,0,0,0,0,-4,0,123,3,49,0,0,0,32,0,0,0,4,0,0,71,85,73,68,4,0,0,78,97,109,101,21,0,0,65,116,116,114,105,98,117,116,101,32,116,121,112,101,32,110,117,109,98,101,114,14,0,0,65,116,116,114,105,98,117,116,101,32,110,97,109,101,57,0,0,65,116,116,114,105,98,117,116,101,32,118,97,108,117,101,32,40,115,111,117,114,99,101,32,108,97,110,103,117,97,103,101,41,32,69,110,103,108,105,115,104,32,40,85,110,105,116,101,100,32,83,116,97,116,101,115,41,49,0,0,65,116,116,114,105,98,117,116,101,32,118,97,108,117,101,32,40,116,97,114,103,101,116,32,108,97,110,103,117,97,103,101,41,32,67,104,105,110,101,115,101,32,40,67,104,105,110,97,41,8,0,0,65,116,116,114,84,121,112,101,0,0,0,36,0,0,52,97,55,49,51,100,101,48,45,53,100,48,50,45,49,49,101,51,45,48,102,100,97,45,102,100,56,49,101,57,56,54,100,55,101,50,10,0,0,77,97,105,110,32,103,114,111,117,112,28,0,0,77,97,105,110,32,103,114,111,117,112,32,116,114,97,110,115,108,97,116,101,100,32,45,32,50,48,53,50,36,0,0,100,102,53,99,53,100,54,48,45,50,52,99,50,45,49,49,100,99,45,50,55,50,57,45,48,48,48,98,99,100,48,99,99,101,52,101,11,0,0,54,46,32,80,82,79,68,85,67,84,83,29,0,0,54,46,32,80,82,79,68,85,67,84,83,32,116,114,97,110,115,108,97,116,101,100,32,45,32,50,48,53,50,36,0,0,98,98,101,49,51,53,54,57,45,48,55,97,49,45,49,49,100,99,45,50,55,50,57,45,48,48,48,98,99,100,48,99,99,101,52,101,7,0,0,53,46,32,68,65,84,65,25,0,0,53,46,32,68,65,84,65,32,116,114,97,110,115,108,97,116,101,100,32,45,32,50,48,53,50,36,0,0,97,50,51,55,100,48,51,48,45,48,55,97,52,45,49,49,100,99,45,50,55,50,57,45,48,48,48,98,99,100,48,99,99,101,52,101,13,0,0,52,46,32,73,84,32,83,89,83,84,69,77,83,31,0,0,52,46,32,73,84,32,83,89,83,84,69,77,83,32,116,114,97,110,115,108,97,116,101,100,32,45,32,50,48,53,50,36,0,0,97,49,99,49,102,54,54,49,45,101,97,100,49,45,49,49,100,99,45,52,102,101,99,45,48,48,48,99,50,57,99,97,101,54,56,55,20,0,0,55,46,32,82,73,83,75,32,38,32,67,79,77,80,76,73,65,78,67,69,38,0,0,55,46,32,82,73,83,75,32,38,32,67,79,77,80,76,73,65,78,67,69,32,116,114,97,110,115,108,97,116,101,100,32,45,32,50,48,53,50,36,0,0,101,101,48,53,102,48,48,48,45,101,57,57,102,45,49,49,100,98,45,50,55,50,57,45,48,48,48,98,99,100,48,99,99,101,52,101,15,0,0,51,46,32,79,82,71,65,78,73,90,65,84,73,79,78,33,0,0,51,46,32,79,82,71,65,78,73,90,65,84,73,79,78,32,116,114,97,110,115,108,97,116,101,100,32,45,32,50,48,53,50,36,0,0,48,99,53,98,97,50,54,48,45,101,57,97,49,45,49,49,100,98,45,50,55,50,57,45,48,48,48,98,99,100,48,99,99,101,52,101,12,0,0,50,46,32,80,82,79,67,69,83,83,69,83,30,0,0,50,46,32,80,82,79,67,69,83,83,69,83,32,116,114,97,110,115,108,97,116,101,100,32,45,32,50,48,53,50,36,0,0,49,49,57,49,97,101,57,48,45,48,50,102,55,45,49,49,100,99,45,50,55,50,57,45,48,48,48,98,99,100,48,99,99,101,52,101,11,0,0,49,46,32,83,84,82,65,84,69,71,89,29,0,0,49,46,32,83,84,82,65,84,69,71,89,32,116,114,97,110,115,108,97,116,101,100,32,45,32,50,48,53,50,-1,0,34,0,8,0,-43,6,0,0,12,0,0,0,-118,7,0,0,-63,0,0,0,99,8,0,0,-102,1,0,0,102,9,0,0,-99,2,0,0,10,0,0,0,9,8,16,0,0,6,16,0,-69,13,-52,7,-63,0,0,0,6,0,0,0,11,2,20,0,0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,-126,15,0,0,13,0,2,0,1,0,12,0,2,0,100,0,15,0,2,0,1,0,17,0,2,0,0,0,16,0,8,0,-4,-87,-15,-46,77,98,80,63,95,0,2,0,1,0,42,0,2,0,0,0,43,0,2,0,0,0,-126,0,2,0,1,0,-128,0,8,0,0,0,0,0,0,0,0,0,37,2,4,0,0,0,-1,0,-127,0,2,0,-63,4,20,0,0,0,21,0,0,0,-125,0,2,0,0,0,-124,0,2,0,0,0,-95,0,34,0,9,0,100,0,1,0,1,0,1,0,0,0,44,1,44,1,0,0,0,0,0,0,-32,63,0,0,0,0,0,0,-32,63,1,0,85,0,2,0,30,0,0,2,14,0,0,0,0,0,10,0,0,0,0,0,6,0,0,0,8,2,16,0,0,0,0,0,6,0,-1,0,0,0,0,0,0,1,15,0,8,2,16,0,1,0,0,0,6,0,-1,0,0,0,0,0,0,1,15,0,8,2,16,0,2,0,0,0,6,0,-1,0,0,0,0,0,0,1,15,0,8,2,16,0,3,0,0,0,6,0,-1,0,0,0,0,0,0,1,15,0,8,2,16,0,4,0,0,0,6,0,-1,0,0,0,0,0,0,1,15,0,8,2,16,0,5,0,0,0,6,0,-1,0,0,0,0,0,0,1,15,0,8,2,16,0,6,0,0,0,6,0,-1,0,0,0,0,0,0,1,15,0,8,2,16,0,7,0,0,0,6,0,-1,0,0,0,0,0,0,1,15,0,8,2,16,0,8,0,0,0,6,0,-1,0,0,0,0,0,0,1,15,0,8,2,16,0,9,0,0,0,6,0,-1,0,0,0,0,0,0,1,15,0,-3,0,10,0,0,0,0,0,21,0,0,0,0,0,-3,0,10,0,0,0,1,0,21,0,1,0,0,0,-3,0,10,0,0,0,2,0,21,0,2,0,0,0,-3,0,10,0,0,0,3,0,21,0,3,0,0,0,-3,0,10,0,0,0,4,0,21,0,4,0,0,0,-3,0,10,0,0,0,5,0,21,0,5,0,0,0,-3,0,10,0,1,0,0,0,22,0,0,0,0,0,3,2,14,0,1,0,1,0,22,0,0,0,0,0,-128,-119,-61,64,-3,0,10,0,1,0,2,0,22,0,6,0,0,0,-3,0,10,0,1,0,3,0,22,0,7,0,0,0,3,2,14,0,1,0,4,0,22,0,0,0,0,0,0,36,-112,64,3,2,14,0,1,0,5,0,22,0,0,0,0,0,0,8,-96,64,-3,0,10,0,2,0,0,0,23,0,8,0,0,0,-3,0,10,0,2,0,1,0,23,0,9,0,0,0,3,2,14,0,2,0,2,0,23,0,0,0,0,0,0,0,-16,63,-3,0,10,0,2,0,3,0,23,0,1,0,0,0,-3,0,10,0,2,0,4,0,23,0,9,0,0,0,-3,0,10,0,2,0,5,0,23,0,10,0,0,0,-3,0,10,0,3,0,0,0,24,0,11,0,0,0,-3,0,10,0,3,0,1,0,24,0,12,0,0,0,3,2,14,0,3,0,2,0,24,0,0,0,0,0,0,0,-16,63,-3,0,10,0,3,0,3,0,24,0,1,0,0,0,-3,0,10,0,3,0,4,0,24,0,12,0,0,0,-3,0,10,0,3,0,5,0,24,0,13,0,0,0,-3,0,10,0,4,0,0,0,23,0,14,0,0,0,-3,0,10,0,4,0,1,0,23,0,15,0,0,0,3,2,14,0,4,0,2,0,23,0,0,0,0,0,0,0,-16,63,-3,0,10,0,4,0,3,0,23,0,1,0,0,0,-3,0,10,0,4,0,4,0,23,0,15,0,0,0,-3,0,10,0,4,0,5,0,23,0,16,0,0,0,-3,0,10,0,5,0,0,0,24,0,17,0,0,0,-3,0,10,0,5,0,1,0,24,0,18,0,0,0,3,2,14,0,5,0,2,0,24,0,0,0,0,0,0,0,-16,63,-3,0,10,0,5,0,3,0,24,0,1,0,0,0,-3,0,10,0,5,0,4,0,24,0,18,0,0,0,-3,0,10,0,5,0,5,0,24,0,19,0,0,0,-3,0,10,0,6,0,0,0,23,0,20,0,0,0,-3,0,10,0,6,0,1,0,23,0,21,0,0,0,3,2,14,0,6,0,2,0,23,0,0,0,0,0,0,0,-16,63,-3,0,10,0,6,0,3,0,23,0,1,0,0,0,-3,0,10,0,6,0,4,0,23,0,21,0,0,0,-3,0,10,0,6,0,5,0,23,0,22,0,0,0,-3,0,10,0,7,0,0,0,24,0,23,0,0,0,-3,0,10,0,7,0,1,0,24,0,24,0,0,0,3,2,14,0,7,0,2,0,24,0,0,0,0,0,0,0,-16,63,-3,0,10,0,7,0,3,0,24,0,1,0,0,0,-3,0,10,0,7,0,4,0,24,0,24,0,0,0,-3,0,10,0,7,0,5,0,24,0,25,0,0,0,-3,0,10,0,8,0,0,0,23,0,26,0,0,0,-3,0,10,0,8,0,1,0,23,0,27,0,0,0,3,2,14,0,8,0,2,0,23,0,0,0,0,0,0,0,-16,63,-3,0,10,0,8,0,3,0,23,0,1,0,0,0,-3,0,10,0,8,0,4,0,23,0,27,0,0,0,-3,0,10,0,8,0,5,0,23,0,28,0,0,0,-3,0,10,0,9,0,0,0,24,0,29,0,0,0,-3,0,10,0,9,0,1,0,24,0,30,0,0,0,3,2,14,0,9,0,2,0,24,0,0,0,0,0,0,0,-16,63,-3,0,10,0,9,0,3,0,24,0,1,0,0,0,-3,0,10,0,9,0,4,0,24,0,30,0,0,0,-3,0,10,0,9,0,5,0,24,0,31,0,0,0,-41,0,24,0,60,4,0,0,-76,0,84,0,96,0,88,0,88,0,88,0,88,0,88,0,88,0,88,0,62,2,18,0,-74,6,0,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,29,0,15,0,3,0,0,0,0,0,0,1,0,0,0,0,0,0,0,10,0,0,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1];
    
    if (B_ALLOW_DEBUG) addDebugRecord("byteOutput length: " + byteStream.length);
    
    g_workbook = Context.createExcelWorkbook("hogofogo.xls", byteStream);

    if (B_ALLOW_DEBUG) addDebugRecord("Sheets in excel workbook: " + g_workbook.getSheetCount());    
}

function initImportVariables(config) {
    g_omethodfilter = ArisData.ActiveFilter();
    g_btouch = config.btouch;
    itemsToTouchSet = new java.util.HashSet();    

    g_nloc = config.srcLang;                    //source lang - 1033
    g_ntargetlangArr = config.trgLangs;         //trg langs - [1029, 1031]    
    olanguages = getlanguages();                //aris langs
    slanguages = [];
    nlanguages = [];    
    
    for (var langIndex = 0; langIndex < olanguages.length; langIndex++) {
        langLocale = olanguages[langIndex].LocaleId();
        slanguages.push(getlanguagename(olanguages[langIndex])); //English (United States),Arabic (Saudi Arabia),Chinese (China),Czech (Czechia),Dani...
        nlanguages.push(langLocale); //1033,1025,2052,1029,1030,1031,1032,2057,1034,1035,1036,1038,1040,1041,1042,1043,1045,1046,1049,1051,1053,1055,1058
    }
}

function getDate() {
    var dateISO = new Date().toISOString(); //2021-05-20T20:11:00.185Z
    var date = dateISO.slice(0,10);
    var time = dateISO.slice(11,19).replace(":", "_").replace(":", "_");
    return date + " " + time;
}

function getlanguages()
{
    var olanguages = [];
    var olanguagelist = ArisData.getActiveDatabase().LanguageList();

    // Selected language
    for (var i = 0; i < olanguagelist.length; i++) {
        if (olanguagelist[i].LocaleId() == g_nloc) {
            olanguages[olanguages.length] = olanguagelist[i];
            break;
        }
    }

    // all other languages
    for (var i = 0 ; i < olanguagelist.length; i++) {
        if (olanguagelist[i].LocaleId() != g_nloc) {
            olanguages[olanguages.length] = olanguagelist[i];
        }
    }    
    return olanguages;
}

function getlanguagename(olanguage) {
    // TANR 241433
    var oLocaleInfo = olanguage.LocaleInfo()
    var oLocale = oLocaleInfo.getLocale();

    return oLocale.getDisplayName();
}

function importTranslatedAttributes(p_presentlangArr)
{    
    var results = [];
    if (g_workbook.getSheetCount() > 0) {
        
        ArisData.Save(Constants.SAVE_ONDEMAND);        
        
        var sheets = g_workbook.getSheets();

        var presentlangArr = p_presentlangArr;
        if (B_ALLOW_DEBUG) addDebugRecord("Detected laguages: " + JSON.stringify(p_presentlangArr));
        ArisData.getActiveDatabase().setAutoTouch(false);     // No touch !!!

        var bsheetok = true;
        var bitemok  = true;
        var battrok  = true;

        var attributesSaved = 0;

        for (var sheetIndex = 0; sheetIndex < sheets.length; sheetIndex++) {
            var currentSheet = sheets[sheetIndex];
            var yposattrArray = [];
            var yposguid = -1;
            var ypostype = -1;
            var nKindNum = null;		// AKC-7973

            // Find column with attributes
            var ypos = 0;            
            while (currentSheet.getCell(0, ypos) != null) {
                var cell = currentSheet.getCell(1, ypos);
                if(cell == null) {
                    ypos = ypos + 1;        // Anubis 342158
                    continue;
                }
                var cellValue = cell.getCellValue();            
                if (cellValue != "") {
                    if (StrComp(cellValue, "GUID") == 0) {
                        yposguid = ypos;
                    } else if (StrComp(cellValue, "AttrType") == 0) {
                        ypostype = ypos;
                    } else {

                        var parsedInt = parseInt(cellValue);
                        var isLangAttr = false;
                        for (var presentLangIndex = 0; presentLangIndex < presentlangArr.length; presentLangIndex++) {
                            if (parsedInt == presentlangArr[presentLangIndex]) {
                                yposattrArray[presentLangIndex] = ypos;
                                isLangAttr = true;
                                break;
                            }
                        }
                        if (!isLangAttr && isKindNum(cellValue)) {
                            // AKC-7973 Export report (f889d8e0-eaea-11d8-12e0-9d2843560f51) writes kind num to output for more performant search
                            nKindNum = parseInt(cellValue);
                        }
                    }
                }
                ypos++;
            }

            for (var i = 0; i < presentlangArr.length; i++) {
                var yposattr = yposattrArray[i];
                if (yposattr == null) {
                    continue;
                }
                var ycurrlang = presentlangArr[i];
                var isSelectedLang = false;
                for (var j = 0; j < g_ntargetlangArr.length; j++) {
                    if (g_ntargetlangArr[j] == ycurrlang) {
                        isSelectedLang = true;
                        break;
                    }
                }

                if (!isSelectedLang) {
                    continue;
                }

                if (yposguid >= 0 && ypostype >= 0 && yposattr >= 0) {
                    var xpos = 2;

                    while (currentSheet.getCell(xpos, yposguid) != null) {

                        var cellGUID = currentSheet.getCell(xpos, yposguid);
                        if(cellGUID == null) {
                            xpos = xpos + 1;        // Anubis 342158
                            continue;
                        }
                        var sguid = cellGUID.getCellValue();
                        var cellType = currentSheet.getCell(xpos, ypostype);
                        if(cellType == null) {
                            xpos = xpos + 1;        // Anubis 342158
                            continue;
                        }
                        var nattrtypenum = getAttrTypeNum(cellType.getCellValue());       // AGA-6929

                        var cellAttr = currentSheet.getCell(xpos, yposattr);
                        if(cellAttr == null) {
                            xpos = xpos + 1;        // Anubis 342158
                            continue;
                        }
                        var svalue = new java.lang.String(cellAttr.getCellValue());

                        // Breaks in Excel -> Breaks in ARIS
                        svalue = svalue.replaceAll("\r\n", "\n");
                        svalue = svalue.replaceAll("\n", "\r\n");
                        //do not save empty attribute value - as a prevention after failed connection during export and translate process
                        if (svalue == "") {
                            xpos++;
                            continue;
                        }
                        
                        var ocurritem = new __holder(null);
                        var bitemisvalid = getitembyguid(ocurritem, sguid, nKindNum);
                        if (bitemisvalid) {

                            var ocurrattr = ocurritem.value.Attribute(nattrtypenum, ycurrlang);
                            if (ocurrattr.IsValid()) {

                                var soldValue = ocurrattr.getValue();
                                if (StrComp(soldValue, svalue) != 0) {      // Write only changed values (TANR 240279)

                                    changeAutoTouch(ocurritem.value);       // Change AutoTouch (TANR 240279)
                                    try {
                                        if (ocurrattr.setValue(svalue) == false) {
                                            var smsg = getString("TEXT1") + ocurritem.value.Name(g_nloc) + getString("TEXT2") + ocurrattr.Type() + getString("TEXT3");
                                            addErrorRecord(smsg);
                                            bitemisvalid = false;
                                        } else {
                                            attributesSaved++;
                                        }
                                    } catch(e) {                                   
                                        var smsg = getString("TEXT1") + ocurritem.value.Name(g_nloc) + getString("TEXT2") + ocurrattr.Type() + getString("TEXT3");
                                        addErrorRecord(smsg);
                                        battrok = false;
                                    }

                                    ArisData.getActiveDatabase().setAutoTouch(false);     // No touch !!!
                                }
                            } else {
                                var smsg = getString("TEXT1") + ocurritem.value.Name(g_nloc) + getString("TEXT4") + nattrtypenum;
                                addErrorRecord(smsg);
                                battrok = false;
                            }
                        } else {
                            var smsg = getString("TEXT5") + sguid + getString("TEXT6");
                            addErrorRecord(smsg);
                            bitemok = false;
                        }

                        if (xpos % 100 == 0) {
                            ArisData.Save(Constants.SAVE_NOW);    // Store every 100 rows per sheet (AKC-7973)
                        }

                        xpos++;
                    }
                    ArisData.Save(Constants.SAVE_NOW);
                } else {
                    if (currentSheet.getCell(0,0) != null) {
                        if (yposattrArray.length == 0) {
                            var smsg = getString("TEXT7") + g_workbook.getSheetName(i) + getString("TEXT8");
                            addErrorRecord(smsg);
                        }
                        bsheetok = false;
                    }
                }
            }
        }
                
        if (battrok == false) {            
            results.push({'message': getString("TEXT9")});
            if (B_ALLOW_DEBUG) addDebugRecord(getString("TEXT9"));
        }
        
        if (bitemok == false) {                        
            results.push({'message': getString("TEXT11")});
            if (B_ALLOW_DEBUG) addDebugRecord(getString("TEXT11"));
        }
        
        if (bsheetok == false) {           
            results.push({'message': getString("TEXT12")});
            if (B_ALLOW_DEBUG) addDebugRecord(getString("TEXT12"));
        }

        ArisData.Save(Constants.SAVE_IMMEDIATELY);          // Ensure that everything is stored (AKC-7973)
        ArisData.getActiveDatabase().setAutoTouch(true);
        
        results.push({'message': (getString("TEXT20") + " " + attributesSaved)});        
        Context.setProperty("results", JSON.stringify(results));        
        if (B_ALLOW_DEBUG) addDebugRecord(getString("TEXT20") + " " + attributesSaved);
    } else {
        results.push({'message': getString("TEXT14")});
        Context.setProperty("results", JSON.stringify(results));
        addErrorRecord(getString("TEXT14"));
        if (B_ALLOW_DEBUG) addDebugRecord(getString("TEXT14"));
    }
}

function isKindNum(sValue) {
    // AKC-7973
    if (isNaN(sValue)) return false;

    var nKindNum = parseInt(sValue);
    switch (nKindNum) {
        case Constants.CID_GROUP:
        case Constants.CID_MODEL:
        case Constants.CID_OBJDEF:
        case Constants.CID_CXNDEF:
            return true;
    }
    return false;
}

function  getAttrTypeNum(sAttrTypeOrGuid) {
    // AGA-6929
    if (isNaN(sAttrTypeOrGuid)) {
        if (ATSALL.isGuid(sAttrTypeOrGuid)) {
            // userdefined attribute type number
            return g_omethodfilter.UserDefinedAttributeTypeNum(sAttrTypeOrGuid);
        } else {
            return -1;
        }
    }
    return parseInt(sAttrTypeOrGuid);
}

function changeAutoTouch(oitem) {
    if (g_btouch) {
        if ((oitem.KindNum() == Constants.CID_OBJDEF || oitem.KindNum() == Constants.CID_MODEL || oitem.KindNum() == Constants.CID_TEXTDEF)) {

            if (itemsToTouchSet.add(oitem.GUID())) {
                ArisData.getActiveDatabase().setAutoTouch(true);
            }
        }
    }
}

function getitembyguid(ocurritem, sguid, nKindNum)
{
    // Init
    ocurritem.value = null;
    var bitemisvalid = false;

    if (sguid.startsWith("Database_")) {                 // sGuid = "Database_" + <Database.Name>
        var sentry = sguid.substring("Database_".length);

        if (StrComp(ArisData.getActiveDatabase().Name(g_nloc), sentry) == 0) {
            ocurritem.value = ArisData.getActiveDatabase();
            bitemisvalid = true;
        }
    } else if (sguid.startsWith("LocaleID_")) {          // sGuid = "LocaleID_" + <Language.localeId>
        var sentry = sguid.substring("LocaleID_".length);

        var olanguagelist = ArisData.getActiveDatabase().LanguageList();
        if (olanguagelist.length > 0) {
            for (var i = 0; i < olanguagelist.length; i++) {
                var ocurrlanguage = olanguagelist[i];

                if (StrComp(ocurrlanguage.localeId(), sentry) == 0) {
                    ocurritem.value = ocurrlanguage;
                    bitemisvalid = true;
                }

                if (bitemisvalid) {
                    break;
                }
            }
        }
    } else {                                                            // sGuid = <GUID>
        if (nKindNum != null) {
            ocurritem.value = ArisData.getActiveDatabase().FindGUID(sguid, nKindNum);     // AKC-7973 More performent search
        } else {
            ocurritem.value = ArisData.getActiveDatabase().FindGUID(sguid);
        }
        bitemisvalid = ocurritem.value.IsValid();
    }
    return bitemisvalid;
}

function analyzeLanguagesInFile(){

    var presentlangArr = [];
    // var yposattrArray = [];

    var sheets = g_workbook.getSheets();

    for (var i = 0; i < sheets.length; i++) {
        var currentSheet = sheets[i];
		var ypos1 = 0;
        while (currentSheet.getCell(0, ypos1) != null) {
            var cell = currentSheet.getCell(1, ypos1);
            if(cell == null) {
                ypos1++;        // Anubis 342158
                continue;
            }
            var svalue = cell.getCellValue();
            var parsedInt = parseInt(svalue);

            for (var j = 0; j < nlanguages.length; j++) {
                if (parsedInt == nlanguages[j]) {
                    // yposattr = ypos1;
                    //  yposattrArray.push(ypos1);
                    var isPresent = false;
                    for (var langArrIter = 0; langArrIter < presentlangArr.length; langArrIter++) {
                        if (presentlangArr[langArrIter] == parsedInt) {
                            isPresent = true;
                            break;
                        }
                    }
                    if (!isPresent){
                        presentlangArr.push(parsedInt);
                    }
                    break;
                }
            }
            ypos1++;
        }
    }
    
    return presentlangArr;
}