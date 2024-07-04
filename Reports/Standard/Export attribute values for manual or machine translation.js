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

// BLUE-16474 Additional output of attributes of UML elements

var B_ALLOW_DEBUG = false;
var report = Context.getComponent("Report");

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

function CHECK_TYPE() {
    this.nexportoption = 0;
    this.ndatabase = 0;
    this.ngroup = 0;
    this.nmodel = 0;
    this.nobject = 0;
    this.ncxn = 0;
    this.nshortcut = 0;
    this.ntable = 0;
    this.ntext = 0;
    this.nfontstyle = 0;
    this.nlanguage = 0;
    this.nsourcelang = 0;
    this.ntargetlang = 0;
    this.brecursive = false;    //checked option 'Include subgroups'
    this.bwithtarget = false;   // only if source language <> target language then output of target language
    this.bonlynotmaint = false; //checked option 'Export only attributes not specified in target'
    this.bexpand = false;       //checked option 'Also include attributes not specified in source' BLUE-11810 Additional output of attributes which are maintained only in the target language
    this.ntranslationengine = "";
    this.atargetlangs = [];     //target languages for translation purpose only
    this.boverwrite = false;    //checked option 'Overwrite manual translations'
    this.bwritetodatabase = false;  //checked option 'Directly write translated values to database'
    this.btranslationmode = false;

    this.bCanceledByUser = false;
}

function LanguageSet() {
    this.arisLangs = new java.util.HashMap();
    this.getTag = function (localeId) {
        return this.arisLangs.get(localeId).LocaleInfo().getLocale().toLanguageTag().toLowerCase();
    };
    this.getDisplayName = function (localeId) {
        return this.arisLangs.get(localeId).LocaleInfo().getLocale().getDisplayName();
    };
    this.getLocaleObj = function (localeId) {
        return this.arisLangs.get(localeId).LocaleInfo().getLocale();
    };
}

var g_engines = initEngines();
const g_demoEngineIdx = getDemoEngineIdx();
const g_demoAuthKey = "demo_translation";

var g_languages = new LanguageSet();

var g_tcheck = new CHECK_TYPE();

var g_data;
var g_mapOfValuesByLanguages;

var g_omethodfilter = ArisData.ActiveFilter();
var g_nloc = Context.getSelectedLanguage();
var g_atargetLanguages = [];

var g_bColored = false; // global variable to change background color of table rows

var g_nwidth = 0;
var g_nrowmax = 0;
var g_nwidth = 30;
var g_nrowmax = 60000;

// BLUE-25934
const MAX_TEXT_LENGTH = 32767    // The maximum length of cell contents (text) is 32767 characters
var g_bTextError = false;

//output file components
var g_output;

var g_headlineCellWhiteStyle;
var g_headlineCellGreyStyle;
var g_attrCellStyle;
var g_attrCellGreyStyle;
var g_translatedAttrCellStyle;
var g_noTranslatedAttrCellStyle;

var g_headlineWhiteFont;
var g_headlineGreyFont;
var g_attrFont;

//debug output file 
var g_debugOut;

//errors string storage
var g_errorText = "";   
//error output file 
var g_errOut;

//used for log files naming as suffix
var dateNow = getDateAndTime();

main();

/* ------------------------------------------------------------------------------------ */

function main() {   
    run();

    //write error log
    if (g_errorText != undefined && g_errorText != "") {
        writeErrorReport();     
        Dialogs.MsgBox(getString("TEXT_18"));
    }
    //write debug log
    if (B_ALLOW_DEBUG) g_debugOut.WriteReport();
}

function run() {

    var bformat = false;
    if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) {     // BLUE-10385 Support XLSX format
        bformat = true;
    } else {
        if ( Dialogs.MsgBox(getString("TEXT1"), Constants.MSGBOX_BTN_YESNOCANCEL | Constants.MSGBOX_ICON_QUESTION, getString("TEXT2")) == Constants.MSGBOX_RESULT_YES) {    // BLUE-10385
            Context.setSelectedFormat(Constants.OutputXLS);
            Context.setSelectedFile(changeextension(Context.getSelectedFile(), "xls"));
            initOutputFileComponents();
            bformat = true;
        }
    }    

    if (bformat == true) {
        initDebugOutputFile();
        try {
            if (userdlg(g_tcheck)) {            
                // iterate through selected items
                var oselectedStartItems = getSelectedItems();

                if (!oselectedStartItems.isEmpty()) {             
                    if (!g_tcheck.bCanceledByUser) {
                        //if translation mode, this part is already performed before showing Summary page (page 3)
                        if (!g_tcheck.btranslationmode) {
                            g_atargetLanguages = g_tcheck.atargetlangs == undefined ? [] : getCleanTargetLangs(g_tcheck.atargetlangs);
                            var bRootGroupRecursive = isSelectedRootGroupAndRecursive(oselectedStartItems);
                            g_data = getArisDataItems(oselectedStartItems, bRootGroupRecursive);
                        }
                        
                        //translate items attributes
                        var translatedAttrValues = null;                    
                        if (g_tcheck.btranslationmode) {
                            //Show Warning dialog when Demo engine and Direct import are choosed together
                            if (getSelectedEngine(g_tcheck.ntranslationengine).id == "Demo" && g_tcheck.bwritetodatabase) {
                                var result = Dialogs.MsgBox(getString("TEXT65"), Constants.MSGBOX_ICON_WARNING | Constants.MSGBOX_BTN_YESNOCANCEL , getString("TEXT2"));
                                switch (result) {
                                    case 2: //Cancel script
                                        g_tcheck.bCanceledByUser = true;
                                        return;                                    
                                    case 6: //Yes, write translations to DB                          
                                        break;
                                    case 7: //No, do not write translations to DB
                                        g_tcheck.bwritetodatabase = false;
                                        break;
                                }
                            }
                            Context.writeStatus(getString("TEXT68"));
                            translatedAttrValues = translateAttributesMap(oselectedStartItems);
                        }                    

                        Context.writeStatus(getString("TEXT69"));
                        initOutputFileComponents();

                        // out database attributes
                        if (g_tcheck.ndatabase == 1) {
                            Context.writeOutput(getString("TEXT3"));
                            outitemlist(g_data.database, translatedAttrValues, false, getString("TEXT12"), 1);
                        }
                        // out group attributes
                        if (g_tcheck.ngroup == 1) {
                            Context.writeOutput(getString("TEXT4"));
                            outitemlist(g_data.groups, translatedAttrValues, false, getString("TEXT14"), 0);
                        }
                        // out model attributes
                        if (g_tcheck.nmodel == 1) {
                            Context.writeOutput(getString("TEXT5"));
                            outitemlist(g_data.models, translatedAttrValues, true, getString("TEXT15"), 0);
                        }
                        // out object attributes
                        if (g_tcheck.nobject == 1) {
                            Context.writeOutput(getString("TEXT6"));
                            outitemlist(g_data.objects, translatedAttrValues, true, getString("TEXT16"), 0);
                        }
                        // out UML element attributes (BLUE-16474)
                        if (g_tcheck.nobject == 1) {
                            outitemlist(g_data.umlElements, translatedAttrValues, true, getString("TEXT43"), 0);
                        }
                        // out cxn attributes
                        if (g_tcheck.ncxn == 1) {
                            Context.writeOutput(getString("TEXT7"));
                            outcxnlist(g_data.cxns, translatedAttrValues, getString("TEXT17"));
                        }
                        // out shortcut attributes
                        if (g_tcheck.nshortcut == 1) {
                            Context.writeOutput(getString("TEXT39"));
                            outitemlist(g_data.shortcuts, translatedAttrValues, false, getString("TEXT40"), 0);
                        }
                        // out text definition attributes
                        if (g_tcheck.ntext == 1) {
                            Context.writeOutput(getString("TEXT8"));
                            outitemlist(g_data.textdefs, translatedAttrValues, false, getString("TEXT18"), 0);
                        }
                        // out fontstyle attributes
                        if (g_tcheck.nfontstyle == 1) {
                            Context.writeOutput(getString("TEXT10"));
                            outitemlist(g_data.fontstyles, translatedAttrValues, false, getString("TEXT20"), 0);
                        }    
                        //if translation mode insert the legend sheet
                        if (g_tcheck.btranslationmode) {
                            addLegendSheet(); 
                        }

                        g_output.setActiveSheet(0);
                        g_output.write();                

                        if (g_bTextError) {
                            // BLUE-25934
                            Dialogs.MsgBox(getString("TEXT78"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, Context.getScriptInfo(Constants.SCRIPT_TITLE));
                        }

                        if (g_tcheck.bwritetodatabase) {
                            Context.writeStatus(getString("TEXT70"));
                            importTranslatedAttributes();
                        }
                    }
                } else {
                    Dialogs.MsgBox(getString("TEXT11"), Constants.MSGBOX_BTN_OK, getString("TEXT2"));       // BLUE-10385
                    Context.setScriptError(Constants.ERR_CANCEL);
                }
            } else {
                Context.setScriptError(Constants.ERR_CANCEL);
            }
        } catch (e) {
            if (e.message.toString() == getString("TEXT56")) Dialogs.MsgBox(getString("TEXT56"), Constants.MSGBOX_BTN_OK, getString("TEXT54"));
            else Dialogs.MsgBox(e.message, Constants.MSGBOX_ICON_ERROR | Constants.MSGBOX_BTN_OK, getString("TEXT54"));                        
            writeMsgToERROR(e.message);
            return;
        }
    }  else {
        Context.setScriptError(Constants.ERR_CANCEL);
    }    
}

function getStringifingParams(engine) {
    var engineConf = {};
    for (var key in engine.params) {
        if (key == "helpURL" || key == "mandatory" || key == "caution") continue;
        engineConf[key] = "" + engine.params[key].value; 
    }
    engineConf = convertEngineDialogParamsToPluginParams(engine.id, engineConf);
    return engineConf;
}

function convertEngineDialogParamsToPluginParams(engine, engineConf) {
    switch (engine) {
        case "DeepL" :
            return convertDeeplParams(engineConf);
        case "Google" :
            return convertGoogleParams(engineConf);
        case "Azure" :
            return convertAzureParams(engineConf);
        default :
            break;        
    }
}

function convertDeeplParams(engineConf) {
    switch (engineConf.splitSentences) {
        case getString("TEXT_64") : 
            engineConf.splitSentences = "default";
            break;
        case getString("TEXT_65") : 
            engineConf.splitSentences = "0";
            break;
        case getString("TEXT_66") : 
            engineConf.splitSentences = "1";
            break;
        case getString("TEXT_67") : 
            engineConf.splitSentences = "nonewlines";
            break;
        default: 
            break;    
    }
    
    switch (engineConf.formality) {
        case getString("TEXT_64") : 
            engineConf.formality = "default";
            break;
        case getString("TEXT_68") : 
            engineConf.formality = "more";
            break;
        case getString("TEXT_69") : 
            engineConf.formality = "less";
            break;
        default: 
            break;    
    }
    return engineConf;
}

function convertGoogleParams(engineConf) {
    switch (engineConf.format) {
        case getString("TEXT_64") : 
            engineConf.format = "default";
            break;
        case getString("TEXT_70") : 
            engineConf.format = "text";
            break;
        case getString("TEXT_71") : 
            engineConf.format = "html";
            break;
        default: 
            break;    
    }
    return engineConf;
}

function convertAzureParams(engineConf) {
    switch (engineConf.textType) {
        case getString("TEXT_64") : 
            engineConf.textType = "default";
            break;
        case getString("TEXT_71") : 
            engineConf.textType = "html";
            break;
        case getString("TEXT_72") : 
            engineConf.textType = "plain";
            break;
        default: 
            break;    
    }

    switch (engineConf.profanityAction) {
        case getString("TEXT_64") : 
            engineConf.profanityAction = "default";
            break;
        case getString("TEXT_73") : 
            engineConf.profanityAction = "NoAction";
            break;
        case getString("TEXT_74") : 
            engineConf.profanityAction = "Marked";
            break;
        case getString("TEXT_75") : 
            engineConf.profanityAction = "Deleted";
            break;
        default: 
            break;    
    }

    switch (engineConf.profanityMarker) {
        case getString("TEXT_64") : 
            engineConf.profanityMarker = "default";
            break;
        case getString("TEXT_76") : 
            engineConf.profanityMarker = "Asterisk";
            break;
        case getString("TEXT_77") : 
            engineConf.profanityMarker = "Tag";
            break;
        default: 
            break;    
    }
    return engineConf;
}

function initOutputFileComponents() {
    g_output = Context.createExcelWorkbook(Context.getSelectedFile());
    //font
    g_headlineWhiteFont = g_output.getFont(getString("TEXT13"), 10, Constants.C_WHITE, true, false, false, false, 0);
    g_headlineGreyFont = g_output.getFont(getString("TEXT13"), 10, Constants.C_GREY_50_PERCENT, true, false, false, false, 0);
    g_attrFont = g_output.getFont(getString("TEXT13"), 10, Constants.C_BLACK, false, false, false, false, 0);
    //cell style
    g_headlineCellWhiteStyle = g_output.createCellStyle(g_headlineWhiteFont, 1, 1, 1, 1, Constants.C_BLACK, Constants.C_BLACK, Constants.C_BLACK, Constants.C_BLACK,
                                                Constants.ALIGN_LEFT, Constants.VERTICAL_TOP, 0, getTableCellColor_Bk(true),
                                                Constants.SOLID_FOREGROUND, Constants.XL_CELL_DATAFORMAT_GENERAL, false, 0, false, 0, true);
    g_headlineCellWhiteStyle.setFillBackgroundColor(28822);
    g_headlineCellGreyStyle = g_output.createCellStyle(g_headlineGreyFont, 1, 1, 1, 1, Constants.C_BLACK, Constants.C_BLACK, Constants.C_BLACK, Constants.C_BLACK,
                                                Constants.ALIGN_LEFT, Constants.VERTICAL_TOP, 0, getTableCellColor_Bk(true),
                                                Constants.SOLID_FOREGROUND, Constants.XL_CELL_DATAFORMAT_GENERAL, false, 0, false, 0, true);
    g_headlineCellGreyStyle.setFillBackgroundColor(28822);
    g_attrCellStyle = g_output.createCellStyle(g_attrFont, 1, 1, 1, 1, Constants.C_BLACK, Constants.C_BLACK, Constants.C_BLACK, Constants.C_BLACK,
                                                Constants.ALIGN_LEFT, Constants.VERTICAL_TOP, 0, getTableCellColor_AttrBk(false),
                                                Constants.SOLID_FOREGROUND, Constants.XL_CELL_DATAFORMAT_GENERAL, false, 0, false, 0, true);
    g_attrCellGreyStyle = g_output.createCellStyle(g_attrFont, 1, 1, 1, 1, Constants.C_BLACK, Constants.C_BLACK, Constants.C_BLACK, Constants.C_BLACK,
                                                Constants.ALIGN_LEFT, Constants.VERTICAL_TOP, 0, getTableCellColor_AttrBk(true),
                                                Constants.SOLID_FOREGROUND, Constants.XL_CELL_DATAFORMAT_GENERAL, false, 0, false, 0, true); 
    //#98FB98 palegreen color = 10025880
    g_translatedAttrCellStyle = g_output.createCellStyle(g_attrFont, 1, 1, 1, 1, Constants.C_BLACK, Constants.C_BLACK, Constants.C_BLACK, Constants.C_BLACK,
                                                Constants.ALIGN_LEFT, Constants.VERTICAL_TOP, 0, 10025880,
                                                Constants.SOLID_FOREGROUND, Constants.XL_CELL_DATAFORMAT_GENERAL, false, 0, false, 0, true);
    //#FFA07A lightsalmon color = 16752762
    g_noTranslatedAttrCellStyle = g_output.createCellStyle(g_attrFont, 1, 1, 1, 1, Constants.C_BLACK, Constants.C_BLACK, Constants.C_BLACK, Constants.C_BLACK,
                                                Constants.ALIGN_LEFT, Constants.VERTICAL_TOP, 0, 16752762,
                                                Constants.SOLID_FOREGROUND, Constants.XL_CELL_DATAFORMAT_GENERAL, false, 0, false, 0, true);                                                
}

function initDebugOutputFile() {             
    if (B_ALLOW_DEBUG) {      
        var debugFile = "Debug_Export_translation_script_" + dateNow + ".txt";
        g_debugOut = Context.createOutputObject(Constants.OUTTEXT, debugFile);
        writeMsgToDebug("Debug ouput - Export attribute values for translation script\r\n");                
    }
}

function getOnlyDate() {
    return new Date().toISOString().split("T")[0];
}

function getCurrentTime() {
    return new Date().toLocaleTimeString().split(" ")[0].split(":").join("-");
}

function getDateAndTime() {
    return getOnlyDate() + "_" + getCurrentTime();
}

function writeErrorReport() {
    var errFile = "ERROR_Export_translation_script_" + dateNow + ".txt";
    g_errOut = Context.createOutputObject(Constants.OUTTEXT, errFile);  
    g_errOut.OutputLn(g_errorText, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);        
    g_errOut.WriteReport();
}

function writeMsgToERROR(msg) {
    if (msg != undefined && msg != "") g_errorText += "\r\n" + getDateAndTime() + " ERROR: " + msg;
}

function writeMsgToDebug(msg) {
    if (B_ALLOW_DEBUG && msg != undefined && msg != "") g_debugOut.OutputLn(getDateAndTime() + " DEBUG: "+ msg, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
}

function blackOutSensitiveData(msg) {
    var sensitiveKeys = ["authKey", "apiKey"];
    
    sensitiveKeys.forEach(function (keyWord, idx){
        var index = msg.search(keyWord);
        if (index >= 0) {
            var startIndex = index + keyWord.length + "\":\"".length;
            var endIndex = startIndex + keyWord.length;
            for (endIndex; endIndex < msg.length; endIndex++) {
                if (msg.charAt(endIndex) == "\"") break;
            }           

            var dots = "";
            for (var i = 0; i < endIndex - startIndex; i++) {
                dots += "*";
            }
            msg = msg.substring(0,startIndex) + dots + msg.substring(endIndex);
        }
    });

    return msg;
}

function prepareSummaryPageValues() {
    var oselectedStartItems = getSelectedItems();
    if (!oselectedStartItems.isEmpty()) {

        g_atargetLanguages = g_tcheck.atargetlangs == undefined ? [] : getCleanTargetLangs(g_tcheck.atargetlangs);
        var bRootGroupRecursive = isSelectedRootGroupAndRecursive(oselectedStartItems);
        g_data = getArisDataItems(oselectedStartItems, bRootGroupRecursive);

        //get map of source values for specified language according to selected options
        g_mapOfValuesByLanguages = getMapOfValueSetsToTranslate(g_data);
    } else {
        Dialogs.MsgBox(getString("TEXT11"), Constants.MSGBOX_BTN_OK, getString("TEXT2"));       // BLUE-10385
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}

function getCleanTargetLangs(langs) {
    var targetLangs = [];
    for (var i = 0; i < langs.length; i++) {
        if (langs[i] != g_tcheck.nsourcelang) targetLangs.push(langs[i]);
    }
    return targetLangs;
}

function initEngines() {
    var engines = [];
    engines[0] = {
        name: getString("TEXT_23"),
        id: "DeepL",
        params: {
			allowImport: {
				name: getString("TEXT_22"),
				type: "boolean",
				value: true,
				hidden: true
			},
            authKey: {
                name: getString("TEXT_24"),
                type: "string",
                value: "",
                hidden: false
            },            
			splitSentences: {
				name: getString("TEXT_25"),
				type: "list",
				values: [getString("TEXT_64"), getString("TEXT_65"), getString("TEXT_66"), getString("TEXT_67")],
                value: getString("TEXT_64"),
				hidden: false
			},
			preserveFormatting: {
				name: getString("TEXT_26"),
				type: "boolean",
				value: false,
				hidden: false
			},
			formality: {
				name: getString("TEXT_27"),
				type: "list",
				values: [getString("TEXT_64"), getString("TEXT_68"), getString("TEXT_69")],
				value: getString("TEXT_64"),
				hidden: false
			},            
            caution: {
				name: getString("TEXT_62"),
				type: "label",
				value: "",
				hidden: false
			},
            mandatory: {
				name: getString("TEXT_63"),
				type: "label",
				value: "",
				hidden: false
			},
            helpURL: {
				name: getString("TEXT_28"),
				type: "label",
				value: "",
				hidden: false
			}
		},
        allowed: true,
        rid: "56fd7f90-87e0-11eb-46cf-e454e8a63ab4",
        hid: "HID_a7088070-8650-11eb-46cf-e454e8a63ab4_dlg_04.hlp",
        langs: {source: [], target: [], arisLang: []}
    };
    engines[1] = {
        name: getString("TEXT_29"),
        id: "Google",
		params: {
			allowImport: {
				name: getString("TEXT_22"),
				type: "boolean",
				value: "true",
				hidden: "true"
			},
            authKey: {
                name: getString("TEXT_39"),
                type: "string",
                value: "",
                hidden: false
            },
            format: {
                name: getString("TEXT_61"),
                type: "list",
                values: [getString("TEXT_64"), getString("TEXT_70"), getString("TEXT_71")],
                value: getString("TEXT_64"),
                hidden: false
            },
            mandatory: {
				name: getString("TEXT_63"),
				type: "label",
				value: "",
				hidden: false
			},
            helpURL: {
				name: getString("TEXT_30"),
				type: "label",
				value: "",
				hidden: false
			}            
		},
        allowed: true,
        rid: "c7463cb0-f5ef-11eb-2380-e454e8a63b1c",
        hid: "HID_a7088070-8650-11eb-46cf-e454e8a63ab4_dlg_05.hlp",
        langs: {source: [], target: [], arisLang: []}
    };
    engines[2] = {
        name: getString("TEXT_31"),
		id: "Azure",
		params: {
			allowImport: {
				name: getString("TEXT_22"),
				type: "boolean",
				value: true,
				hidden: true
			},
            authKey: {
                name: getString("TEXT_391"),
                type: "string",
                value: "",
                hidden: false
            },
            authToken: {
                name: getString("TEXT_32"),
                type: "string",
                value: "",
                hidden: true
            },
            url: {
                name: getString("TEXT_33"),
                type: "string",
                value: "https://api.cognitive.microsofttranslator.com",
                hidden: false
            },
            apiVersion: {
                name: getString("TEXT_34"),
                type: "string",
                value: "3.0",
                hidden: false
            },
            region: {
                name: getString("TEXT_35"),
                type: "string",
                value: "",
                hidden: false
            },
            category: {
                name: getString("TEXT_36"),
                type: "string",
                value: "",
                hidden: false
            },
            hourLimit: {
                name: getString("TEXT_37"),
                type: "string",
                value: "2000000",
                hidden: false
            },
            textType: {
                name: getString("TEXT_38"),
                type: "list",
                values: [getString("TEXT_64"), getString("TEXT_72"), getString("TEXT_71")],
                value: getString("TEXT_64"),
                hidden: false
            },
            profanityAction: {
                name: getString("TEXT_41"),
                type: "list",
                values: [getString("TEXT_64"), getString("TEXT_73"), getString("TEXT_74"), getString("TEXT_75")],
                value: getString("TEXT_64"),
                hidden: false
            },
            profanityMarker: {
                name: getString("TEXT_46"),
                type: "list",
                values: [getString("TEXT_64"), getString("TEXT_76"), getString("TEXT_77")],
                value: getString("TEXT_64"),
                hidden: false
            },
            includeAlignment: {
                name: getString("TEXT_49"),
                type: "boolean",
                value: false,
                hidden: false
            },
            includeSentenceLength: {
                name: getString("TEXT_50"),
                type: "boolean",
                value: false,
                hidden: false
            },
            allowFallback: {
                name: getString("TEXT_51"),
                type: "boolean",
                value: true,
                hidden: false
            },
            mandatory: {
				name: getString("TEXT_63"),
				type: "label",
				value: "",
				hidden: false
			},
            helpURL: {
				name: getString("TEXT_52"),
				type: "label",
				value: "",
				hidden: false
			}
		},
        allowed: true,
        rid: "595a75d0-969b-11eb-7674-e454e8a63b1c",
        hid: "HID_a7088070-8650-11eb-46cf-e454e8a63ab4_dlg_06.hlp",
        langs: {source: [], target: [], arisLang: []}
    };    
    engines[3] = {
        name: getString("TEXT_53"),
		id: "Demo",
		params: {
			allowImport: {
				name: getString("TEXT_22"),
				type: "boolean",
				value: true,
				hidden: true
			},
            label: {
				name: getString("TEXT_54"),
				type: "label",
				value: "",
				hidden: false
			}
		},
        allowed: false,
        rid: "4f818150-a29b-11eb-6a24-b0262859a794",
        hid: "",
        langs: {source: [], target: [], arisLang: []}
    };

    return engines;
}

function getSelectedItems() {
    var selectedItems = {
        db : ArisData.getSelectedDatabases(),
        groups : ArisData.getSelectedGroups(),
        models : ArisData.getSelectedModels(),
        objects : ArisData.getSelectedObjDefs(),
        isEmpty : function () {
                    return this.db.length == 0 && this.groups.length == 0 && this.models.length == 0 && this.objects.length == 0;
                },
        //function getAnySelectedStartItems() is used only for create reportInfo object later on. Without it, it returns null.
        getAnySelectedStartItems : function () {
                    if (this.db.length != 0) return this.db;
                    if (this.groups.length != 0) return this.groups;
                    if (this.models.length != 0) return this.models;
                    if (this.objects.length != 0) return this.objects;
                }
    }
    return selectedItems;
}

function getArisDataItems(oselectedStartItems, bRootGroupRecursive) {
    var data = {
        database : [],
        groups : [],
        models : [],
        objects : [],
        umlElements : [],
        cxns : [],
        shortcuts : [],
        textdefs : [],
        fontstyles : []
    }
    // database item
    if (g_tcheck.ndatabase == 1) {
        data.database.push(ArisData.getActiveDatabase());
    }
    // group items
    if (g_tcheck.ngroup == 1 || g_tcheck.ncxn == 1 || g_tcheck.nshortcut == 1 || g_tcheck.ntext == 1) {
        if (bRootGroupRecursive) {
            data.groups = ArisData.getActiveDatabase().Find(Constants.SEARCH_GROUP);
        } else {
            for (var i = 0 ; i < oselectedStartItems.groups.length ; i++ ) {
                var ocurrgroup = oselectedStartItems.groups[i];
                data.groups.push(ocurrgroup);
                data.groups = data.groups.concat(filterArisGroups(ocurrgroup.Childs(g_tcheck.brecursive) ));
            }
        }
    }
    // model items
    if (g_tcheck.nmodel == 1 || g_tcheck.ncxn == 1 || g_tcheck.nshortcut == 1 || g_tcheck.ntext == 1) {
        if (bRootGroupRecursive) {
            data.models = ArisData.getActiveDatabase().Find(Constants.SEARCH_MODEL);
        } else {
            for (var i = 0 ; i < oselectedStartItems.groups.length ; i++ ) {
                var ocurrgroup = oselectedStartItems.groups[i];
                data.models = data.models.concat(ocurrgroup.ModelList(g_tcheck.brecursive));
            }
            data.models = data.models.concat(oselectedStartItems.models);
        }
    }
    // out object items
    if (g_tcheck.nobject == 1 || g_tcheck.ncxn == 1 || g_tcheck.nshortcut == 1) {
        if (bRootGroupRecursive) {
            data.objects = ArisData.getActiveDatabase().Find(Constants.SEARCH_OBJDEF);
        } else {
            for (var i = 0 ; i < oselectedStartItems.groups.length ; i++ ) {
                var ocurrgroup = oselectedStartItems.groups[i];
                data.objects = data.objects.concat(ocurrgroup.ObjDefList(g_tcheck.brecursive));
            }
            for (var i = 0 ; i < oselectedStartItems.models.length ; i++ ) {
                var ocurrmodel = oselectedStartItems.models[i];
                data.objects = data.objects.concat(ocurrmodel.ObjDefList());
            }
            data.objects = data.objects.concat(oselectedStartItems.objects);
        }
    }
    // out UML element items
    if (g_tcheck.nobject == 1) {
        data.umlElements = getUmlElements(bRootGroupRecursive, oselectedStartItems.groups);
    }
    // out cxn items
    if (g_tcheck.ncxn == 1) {
        if (bRootGroupRecursive) {
            data.cxns = ArisData.getActiveDatabase().Find(Constants.SEARCH_CXNDEF);
        } else {
            for (var j = 0 ; j < data.objects.length; j++ ) {
                data.cxns = data.cxns.concat(data.objects[j].CxnList(Constants.EDGES_INOUT));
            }
            data.cxns = ArisData.Unique(data.cxns);       // UNIQUE !
        }
    }
    // out shortcut items
    if (g_tcheck.nshortcut == 1) {
        if (bRootGroupRecursive) {
            data.shortcuts = ArisData.getActiveDatabase().Find(Constants.SEARCH_SHORTCUT);
        } else {
            for (var j = 0 ; j < data.groups.length ; j++ ) {
                data.shortcuts = data.shortcuts.concat(data.groups[j].Shortcuts(0, false));
            }
        }
    }
    // out text definition
    if (g_tcheck.ntext == 1) {
        data.textdefs = getTextDefs(data, bRootGroupRecursive);
    }
    // out fontstyle definition
    if (g_tcheck.nfontstyle == 1) {
        data.fontstyles = ArisData.getActiveDatabase().FontStyleList();
    }

    return data;
}

function getUmlElements(bRootGroupRecursive, oselectedGroups) {
    var aUml2ObjTypes = ArisData.ActiveFilter().getMetamodelItems(2/*UML2*/, Constants.CID_OBJDEF);
    if (aUml2ObjTypes.length == 0) return new Array();

    var oUmlElements = filterUmlElements( ArisData.getActiveDatabase().Find(Constants.SEARCH_GROUP, aUml2ObjTypes) );
    if (bRootGroupRecursive) {
        return oUmlElements;
    } else {
        return filterSelected(oUmlElements);
    }

    function filterSelected(oUmlElements) {
        var selectedUmlElements = new Array()
        for (var i in oUmlElements) {
            var oUmlElement = oUmlElements[i];

            if (isSelectedElement(oUmlElement)) {
                selectedUmlElements.push(oUmlElement);
            }
        }
        return selectedUmlElements;

        function isSelectedElement(oUmlElement) {
            if (g_tcheck.brecursive) {
                // UML elements in selected groups and their child groups
                for (var i in oselectedGroups) {
                    if (oUmlElement.IsChildGroupOf(oselectedGroups[i])) {
                        return true;
                    }
                }
            } else {
                // Only UML elements in selected groups (without child groups)
                var oParent = getParentGroup(oUmlElement);
                for (var i in oselectedGroups) {
                    if (oParent.IsEqual(oselectedGroups[i])) {
                        return true;
                    }
                }
            }
            return false;
        }

        function getParentGroup(oUmlElement) {
            var oParent = oUmlElement.Parent();
            if (oParent.IsValid()) {
                if (isArisGroup(oParent)) return oParent;

                return getParentGroup(oParent);
            }
            return null;
        }
    }
}

function isArisGroup(oGroup) { return oGroup.TypeNum() == 9999 }

function filterArisGroups(oGroups)  { return filterArisGroupsInt(oGroups, true) }
function filterUmlElements(oGroups) { return filterArisGroupsInt(oGroups, false) }
function filterArisGroupsInt(oGroups, bFilterThis) {
    var oFilteredGroups = new Array();
    for (var i in oGroups) {
        var oGroup = oGroups[i]
        if (isArisGroup(oGroup) == bFilterThis) {
            oFilteredGroups.push(oGroup);
        }
    }
    return oFilteredGroups;
}

function getTextDefs(data, bRootGroupRecursive) {
    // BLUE-12155 Remove all entries in this list where the attribute AT_MODEL_AT is maintained
    var oTextDefs_filtered = new Array();
    var oTextDefs = bRootGroupRecursive ? ArisData.getActiveDatabase().TextDefList() : getSpecificTextDefs(data);
    for (var i=0; i<oTextDefs.length; i++) {
        var oTextDef = oTextDefs[i];
        if (!oTextDef.Attribute(Constants.AT_MODEL_AT, g_nloc).IsMaintained()) oTextDefs_filtered.push(oTextDef);
    }
    return oTextDefs_filtered;
}

function getSpecificTextDefs(data) {
    var aTextDefs = new Array();
    for (var i=0; i< data.models.length; i++) {
        for (var j=0; j<data.models[i].TextDefList().length; j++) {
            aTextDefs.push(data.models[i].TextDefList()[j]);
        }
    }
    return aTextDefs;
}

function isSelectedRootGroupAndRecursive(p_oselectedItems) {
    if (p_oselectedItems.db.length > 0) return true;

    if (p_oselectedItems.groups.length > 0 && g_tcheck.brecursive) {
        if (p_oselectedItems.groups[0].IsEqual(ArisData.getActiveDatabase().RootGroup())) {
            return true;
        }
    }
    return false;
}

function addLegendSheet() {
    createNewSheet(getString("TEXT71"));
    var sheetWorkbook = g_output.getSheetAt(g_output.getActiveSheet());
    var row = sheetWorkbook.createRow(0);
    addCellToRow(getString("TEXT72"), g_headlineCellWhiteStyle, row, 0);
    addCellToRow(getString("TEXT73"), g_headlineCellWhiteStyle, row, 1);
    row = sheetWorkbook.createRow(1);
    addCellToRow("", g_translatedAttrCellStyle, row, 0);
    addCellToRow(getString("TEXT74"), g_attrCellGreyStyle, row, 1);
    row = sheetWorkbook.createRow(2);
    addCellToRow("", g_attrCellStyle, row, 0);
    addCellToRow(getString("TEXT75"), g_attrCellStyle, row, 1);
    row = sheetWorkbook.createRow(3);
    addCellToRow("", g_noTranslatedAttrCellStyle, row, 0);
    addCellToRow(getString("TEXT76"), g_attrCellGreyStyle, row, 1);
}

function outitemlist(oitemlist, translatedStrings, bwithtype, ssheetname, nguidentry) {
    var ncount_holder = new __holder(1);
    var nrow_holder = new __holder(2);

    if (oitemlist.length > 0) {
        createNewSheet(ssheetname);
        outitemheadlines(getItemKind(oitemlist[0]), bwithtype);

        g_bColored = false;
        for (var i = 0 ; i < oitemlist.length ; i++ ) {
            var oitem = oitemlist[i];
            // Output of item attributes
            outitemattributes(oitem, oitem.Name(g_nloc), bwithtype, ssheetname, ncount_holder, nrow_holder, nguidentry, translatedStrings);
        }

        if (ncount_holder.value > 1) {
            ssheetname = ssheetname + "_" + ncount_holder.value;
        }
    }
}

function createNewSheet(p_sheetName) {
    if (p_sheetName == undefined || p_sheetName.length == 0) {
        Dialogs.MsgBox("Name of new sheet is null.", Constants.MSGBOX_BTN_OK, getString("TEXT54"));
        Context.setScriptError(Constants.ERR_RUNTIME);
    }
    var newSheet = g_output.createSheet(p_sheetName);
    newSheet.setDefaultColumnWidth(30);
    var i = 0;
    while (g_output.getSheetName(i) != p_sheetName) {
        i++;
    }
    g_output.setActiveSheet(i);
}

function outcxnlist(ocxnlist, translatedStrings, ssheetname) {
    var ncount_holder = new __holder(1);
    var nrow_holder = new __holder(2);

    if (ocxnlist.length > 0) {
        createNewSheet(ssheetname);
        outcxnheadlines();

        g_bColored = false;
        for (var i = 0 ; i < ocxnlist.length ; i++ ) {
            var ocurrcxn = ocxnlist[i];
            // Output of cxn attributes
            outcxnattributes(ocurrcxn, ssheetname, ncount_holder, nrow_holder, translatedStrings);
        }

        if (ncount_holder.value > 1) {
            ssheetname = ssheetname + "_" + ncount_holder.value;
        }
    }
}

function getItemKind(item) {
    // AKC-7973 Add item kind information to output -> More performant search in import-report (f86fc130-eaea-11d8-12e0-9d2843560f51)
    var nKindNum = item.KindNum();
    switch (nKindNum) {
        case Constants.CID_GROUP:
        case Constants.CID_MODEL:
        case Constants.CID_OBJDEF:
        case Constants.CID_CXNDEF:
            return nKindNum;
    }
    return null;
}


function outitemheadlines(nKindNum, bwithtype) {
    var sKindNum = (nKindNum != null) ? nKindNum : "";  // AKC-7973

    var sheetWorkbook = g_output.getSheetAt(g_output.getActiveSheet());
    var headlineRow = sheetWorkbook.createRow(0);
    var columnIndex = -1;

    addCellToRow(getString("TEXT21"), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);
    if (bwithtype) {
        addCellToRow(getString("TEXT22"), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);
    }
    addCellToRow(getString("TEXT23"), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);
    addCellToRow(getString("TEXT24"), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);
    addCellToRow(getString("TEXT25"), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);
    addCellToRow(getString("TEXT26") + " " + g_languages.getDisplayName(g_tcheck.nsourcelang), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);

    if (g_tcheck.bwithtarget && !g_tcheck.btranslationmode) {
        addCellToRow(getString("TEXT27") + " " + g_languages.getDisplayName(g_tcheck.ntargetlang), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);
    } else if(g_tcheck.btranslationmode) {
        for (var i = 0; i < g_atargetLanguages.length; i++) {
            addCellToRow(getString("TEXT27") + " " + g_languages.getDisplayName(g_atargetLanguages[i]), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);
        }
    }

    //grey styled row 2
    headlineRow = sheetWorkbook.createRow(1);
    columnIndex = -1;

    addCellToRow("GUID", g_headlineCellGreyStyle, headlineRow, ++columnIndex);
    if (bwithtype) {
        addCellToRow("", g_headlineCellGreyStyle, headlineRow, ++columnIndex);
    }
    addCellToRow(sKindNum, g_headlineCellGreyStyle, headlineRow, ++columnIndex);
    addCellToRow("AttrType", g_headlineCellGreyStyle, headlineRow, ++columnIndex);
    addCellToRow("", g_headlineCellGreyStyle, headlineRow, ++columnIndex);
    addCellToRow(g_tcheck.nsourcelang, g_headlineCellGreyStyle, headlineRow, ++columnIndex);

    if (g_tcheck.bwithtarget && !g_tcheck.btranslationmode) {
        addCellToRow(g_tcheck.ntargetlang, g_headlineCellGreyStyle, headlineRow, ++columnIndex);
    } else if(g_tcheck.btranslationmode ) {
        for (var i = 0; i < g_atargetLanguages.length; i++) {
            addCellToRow(g_atargetLanguages[i], g_headlineCellGreyStyle, headlineRow, ++columnIndex);
        }
    }
}

//p_row - object of sheetRow
//p_col - index of column
function addCellToRow(p_value, p_cellStyle, p_row, p_col) {
    var cell = p_row.createCell(p_col);
    if (isValueInLimitForCell(p_value)) {
        cell.setCellStyle(p_cellStyle);        
        cell.setCellValue(p_value);
    } else {
        cell.setCellStyle(g_noTranslatedAttrCellStyle);
        cell.setCellValue(getString("TEXT77"));
    }        
}

function outcxnheadlines() {
    var sKindNum = Constants.CID_CXNDEF;  // AKC-7973

    var sheetWorkbook = g_output.getSheetAt(g_output.getActiveSheet());
    var headlineRow = sheetWorkbook.createRow(0);
    var columnIndex = -1;

    addCellToRow(getString("TEXT21"), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);
    addCellToRow(getString("TEXT28"), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);
    addCellToRow(getString("TEXT29"), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);
    addCellToRow(getString("TEXT30"), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);
    addCellToRow(getString("TEXT31"), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);
    addCellToRow(getString("TEXT25"), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);
    addCellToRow(getString("TEXT26")  + " " + g_languages.getDisplayName(g_tcheck.nsourcelang), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);

    if (g_tcheck.bwithtarget && !g_tcheck.btranslationmode) {
        addCellToRow(getString("TEXT27")  + " " + g_languages.getDisplayName(g_tcheck.ntargetlang), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);
    } else if(g_tcheck.btranslationmode) {
        for (var i = 0; i < g_atargetLanguages.length; i++) {
            addCellToRow(getString("TEXT27") + " " + g_languages.getDisplayName(g_atargetLanguages[i]), g_headlineCellWhiteStyle, headlineRow, ++columnIndex);
        }
    }

    //grey style row 2
    headlineRow = sheetWorkbook.createRow(1);
    columnIndex = -1;

    addCellToRow("GUID", g_headlineCellGreyStyle, headlineRow, ++columnIndex);
    addCellToRow(sKindNum, g_headlineCellGreyStyle, headlineRow, ++columnIndex);
    addCellToRow("", g_headlineCellGreyStyle, headlineRow, ++columnIndex);
    addCellToRow("", g_headlineCellGreyStyle, headlineRow, ++columnIndex);
    addCellToRow("AttrType", g_headlineCellGreyStyle, headlineRow, ++columnIndex);
    addCellToRow("", g_headlineCellGreyStyle, headlineRow, ++columnIndex);
    addCellToRow(g_tcheck.nsourcelang, g_headlineCellGreyStyle, headlineRow, ++columnIndex);

    if (g_tcheck.bwithtarget && !g_tcheck.btranslationmode) {
        addCellToRow(g_tcheck.ntargetlang, g_headlineCellGreyStyle, headlineRow, ++columnIndex);
    } else if(g_tcheck.btranslationmode) {
        for (var i = 0; i < g_atargetLanguages.length; i++) {
            addCellToRow(g_atargetLanguages[i], g_headlineCellGreyStyle, headlineRow, ++columnIndex);
        }
    }
}

function outitemattributes(ocurritem, sname, bwithtype, ssheetname, ncount_holder, nrow_holder, nguidentry, translatedStrings) {
    var ssheetnametmp = ssheetname;
    var sguid = "";

    switch(nguidentry) {
        case 0:
            sguid = ocurritem.GUID();
            break;
        case 1:
            sguid = "Database_" + ocurritem.Name(g_nloc);
            break;
    }

    var stype = "";
    if (bwithtype == true) {
        stype = ocurritem.Type();
    }

    // AttrList in source language
    var oattrlist = ocurritem.AttrList(g_tcheck.nsourcelang);

    if (g_tcheck.bexpand) {
        // BLUE-11810 Expand attribute list by attributes maintained in target language
        oattrlist = expandAttrList(ocurritem, oattrlist, g_tcheck.nsourcelang, g_tcheck.btranslationmode ? g_atargetLanguages : [g_tcheck.ntargetlang]);
    }

    var sheetWorkbook = g_output.getSheetAt(g_output.getActiveSheet());
    var columnIndex;
    for (var i = 0 ; i < oattrlist.length ; i++ ) {
        var ocurrattr = oattrlist[i];
        if (ocurrattr.IsChangeable() && ocurrattr.LanguageDependence() == 0) {
            switch(g_omethodfilter.AttrBaseType(ocurrattr.TypeNum())) {
                case Constants.ABT_BITMAP:
                case Constants.ABT_ITEMTYPE:
                case Constants.ABT_LONGTEXT:
                case Constants.ABT_VALUE:
                case Constants.ABT_COMBINED:
                    break;
                default:
                    var nattrtypenum = ocurrattr.TypeNum();
                    var sattrtype = ocurrattr.Type();
                    var ssourceval = getattributevalue(ocurrattr);

                    var olangattr = ocurritem.Attribute(nattrtypenum, g_tcheck.btranslationmode ? getMaintainedLang(ocurritem, nattrtypenum, g_tcheck.atargetlangs) : g_tcheck.ntargetlang);
                    var stargetval = "";
                    if ((!olangattr.IsMaintained() || !g_tcheck.bonlynotmaint)
                            || ((g_tcheck.btranslationmode && translatedStrings.containsKey(ssourceval.toString()))
                                    || (g_tcheck.btranslationmode && g_tcheck.bexpand))) {

                        if (olangattr.IsMaintained()) {
                            stargetval = getattributevalue(olangattr);
                        }

                        var tableRow = sheetWorkbook.createRow(nrow_holder.value);
                        var cellStyle = g_bColored ? g_attrCellGreyStyle : g_attrCellStyle;
                        columnIndex = -1;

                        addCellToRow(sguid, cellStyle, tableRow, ++columnIndex);
                        if (bwithtype) {
                            addCellToRow(stype, cellStyle, tableRow, ++columnIndex);
                        }
                        addCellToRow(sname, cellStyle, tableRow, ++columnIndex);
                        addCellToRow(getAttrTypeOrGuid(nattrtypenum), cellStyle, tableRow, ++columnIndex);
                        addCellToRow(sattrtype, cellStyle, tableRow, ++columnIndex);
                        addCellToRow(ssourceval, cellStyle, tableRow, ++columnIndex);

                        if (g_tcheck.bwithtarget && !g_tcheck.btranslationmode) {
                            addCellToRow(stargetval, cellStyle, tableRow, ++columnIndex);
                        } // else insert translated values
                        else if (g_tcheck.btranslationmode && g_atargetLanguages.length > 0) {
                            var translatedAttrValues = translatedStrings.get(ssourceval);
                            if (translatedAttrValues != undefined) {
                                for (var j = 0; j < translatedAttrValues.length; j++) {
                                    var translatedValue = translatedAttrValues[j];
									cellStyle = g_bColored ? g_attrCellGreyStyle : g_attrCellStyle;
                                    if (translatedValue != undefined) cellStyle = g_translatedAttrCellStyle;
                                    else {
                                        var langattr = ocurritem.Attribute(nattrtypenum, g_atargetLanguages[j]);
                                        translatedValue = "";
                                        if (langattr.IsMaintained()) translatedValue = getattributevalue(langattr);
                                        if (translatedValue == "") cellStyle = g_noTranslatedAttrCellStyle;
                                    }
                                    addCellToRow(translatedValue, cellStyle, tableRow, ++columnIndex);
                                }
                            } else {
                                for (var j = 0; j < g_atargetLanguages.length; j++) {
                                    var langattr = ocurritem.Attribute(nattrtypenum, g_atargetLanguages[j]);
                                    var targVal = "";
                                    if (langattr.IsMaintained()) targVal = getattributevalue(langattr);
                                    if (targVal == "") cellStyle = g_noTranslatedAttrCellStyle;
                                    addCellToRow(targVal, cellStyle, tableRow, ++columnIndex);
                                }
                            }
                        }

                        nrow_holder.value = nrow_holder.value + 1;
                        if (nrow_holder.value == g_nrowmax) {
                            ssheetnametmp = ssheetname + "_" + ncount_holder.value;
                            createNewSheet(ssheetnametmp);
                            outitemheadlines(getItemKind(ocurritem), bwithtype);
                            g_bColored = false;

                            ncount_holder.value = ncount_holder.value + 1;
                            nrow_holder.value = 2;
                        }
                        g_bColored = !g_bColored;   // Change background color
                    }
            }
        }
    }

    function expandAttrList(oItem, srcAttrList, srcLang, trgLang) {
        var setSrcAttrTypes = getSrcAttrTypes();

        for (var idx = 0; idx < trgLang.length; idx++) {
            var trgAttrList = oItem.AttrList(trgLang[idx]);
            for (var i in trgAttrList) {
                var nAttrTypeNum = trgAttrList[i].TypeNum();
                if (setSrcAttrTypes.contains(nAttrTypeNum)) continue;

                srcAttrList.push(oItem.Attribute(nAttrTypeNum, srcLang));   // Add attribute to attribute list
                setSrcAttrTypes.add(nAttrTypeNum);
            }
        }
        return srcAttrList;

        function getSrcAttrTypes() {
            var set = new java.util.HashSet();
            for (var i in srcAttrList) {
                set.add(srcAttrList[i].TypeNum());
            }
            return set;
        }

    }
}

// BLUE-25934 Output error in case of text is longer than 32767 characters in Excel cell
function isValueInLimitForCell(sAttrValue) {
    if (('' + sAttrValue).length <= MAX_TEXT_LENGTH) {
        return true;
    } else {     
        g_bTextError = true;
        return false;
    }
}

function outcxnattributes(ocurrcxn, ssheetname, ncount_holder, nrow_holder, translatedStrings) {
    var osourceobjdef = ocurrcxn.SourceObjDef();
    var otargetobjdef = ocurrcxn.TargetObjDef();

    var sguid = ocurrcxn.GUID();
    var stype = ocurrcxn.ActiveType();
    var ssource = osourceobjdef.Name(g_nloc) + " / " + osourceobjdef.Type();
    var starget = otargetobjdef.Name(g_nloc) + " / " + otargetobjdef.Type();

    var sheetWorkbook = g_output.getSheetAt(g_output.getActiveSheet());
    var columnIndex;
    // AttrList in source language
    var oattrlist = ocurrcxn.AttrList(g_tcheck.nsourcelang);
    for (var i = 0 ; i < oattrlist.length ; i++ ) {
        var ocurrattr = oattrlist[i];

        if (ocurrattr.IsChangeable() && ocurrattr.LanguageDependence() == 0) {
            switch(g_omethodfilter.AttrBaseType(ocurrattr.TypeNum())) {
                case Constants.ABT_BITMAP:
                case Constants.ABT_ITEMTYPE:
                case Constants.ABT_LONGTEXT:
                case Constants.ABT_VALUE:
                case Constants.ABT_COMBINED:
                    break;
                default:
                    var nattrtypenum = ocurrattr.TypeNum();
                    var sattrtype = ocurrattr.Type();
                    var ssourceval = getattributevalue(ocurrattr);

                    var olangattr = ocurrcxn.Attribute(nattrtypenum, g_tcheck.btranslationmode ? getMaintainedLang(ocurrcxn, nattrtypenum, g_tcheck.atargetlangs) : g_tcheck.ntargetlang);
                    var stargetval = "";
                    if ((!olangattr.IsMaintained()) || (!g_tcheck.bonlynotmaint)) {
                        if (olangattr.IsMaintained()) {
                            stargetval = getattributevalue(olangattr);
                        }

                        var tableRow = sheetWorkbook.createRow(nrow_holder.value);
                        var cellStyle = g_bColored ? g_attrCellGreyStyle : g_attrCellStyle;
                        columnIndex = -1;

                        addCellToRow(sguid, cellStyle, tableRow, ++columnIndex);
                        addCellToRow(stype, cellStyle, tableRow, ++columnIndex);
                        addCellToRow(ssource, cellStyle, tableRow, ++columnIndex);
                        addCellToRow(starget, cellStyle, tableRow, ++columnIndex);
                        addCellToRow(getAttrTypeOrGuid(nattrtypenum), cellStyle, tableRow, ++columnIndex);
                        addCellToRow(sattrtype, cellStyle, tableRow, ++columnIndex);
                        addCellToRow(ssourceval, cellStyle, tableRow, ++columnIndex);

                        if (g_tcheck.bwithtarget && !g_tcheck.btranslationmode) {
                            addCellToRow(stargetval, cellStyle, tableRow, ++columnIndex);
                        } // else insert translated values
                        else if (g_tcheck.btranslationmode && g_atargetLanguages.length > 0) {
                            var translatedAttrValues = translatedStrings.get(ssourceval);
                            if (translatedAttrValues != undefined) {
                                for (var j = 0; j < translatedAttrValues.length; j++) {
                                    var translatedValue = translatedAttrValues[j];
                                    if (translatedValue != undefined) cellStyle = g_translatedAttrCellStyle;
                                    else {
                                        var langattr = ocurrcxn.Attribute(nattrtypenum, g_atargetLanguages[j]);
                                        translatedValue = "";
                                        if (langattr.IsMaintained()) translatedValue = getattributevalue(langattr);
                                        if (translatedValue == "") cellStyle = g_noTranslatedAttrCellStyle;
                                    }
                                    addCellToRow(translatedValue, cellStyle, tableRow, ++columnIndex);
                                }
                            } else {
                                for (var j = 0; j < g_atargetLanguages.length; j++) {
                                    var langattr = ocurrcxn.Attribute(nattrtypenum, g_atargetLanguages[j]);
                                    var targVal = "";
                                    if (langattr.IsMaintained()) targVal = getattributevalue(langattr);
                                    if (targVal == "") cellStyle = g_noTranslatedAttrCellStyle;
                                    addCellToRow(targVal, cellStyle, tableRow, ++columnIndex);
                                }
                            }
                        }

                        nrow_holder.value = nrow_holder.value + 1;
                        if (nrow_holder.value == g_nrowmax) {
                            ssheetnametmp = ssheetname + "_" + ncount_holder.value;
                            createNewSheet(ssheetnametmp);
                            outcxnheadlines();
                            g_bColored = false;

                            ncount_holder.value = ncount_holder.value + 1;
                            nrow_holder.value = 2;
                        }
                        g_bColored = !g_bColored;   // Change background color
                    }
            }
        }
    }
}

function getMaintainedLang(ocurritem, nattrtypenum, atargetlangs) {
        for (var i = 0; i < atargetlangs.length; i++) {
            var olangattr = ocurritem.Attribute(nattrtypenum, atargetlangs[i]);
            if (!olangattr.IsMaintained()) return atargetlangs[i];
        }
        return atargetlangs[0];
    }

function getAttrTypeOrGuid(nattrtypenum) {
    // AGA-6929
    if (g_omethodfilter.isUserDefinedAttrType(nattrtypenum)) {
        return g_omethodfilter.UserDefinedAttributeTypeGUID(nattrtypenum);
    }
    return nattrtypenum;
}

function getattributevalue(ocurrattr) {
    return "" + ocurrattr.GetValue(false);
}

function translateAttributesMap(oselectedStartItems) {
    var dictionary = new java.util.HashMap();
    //testing object - in production you have to use mapOfValuesByLanguages for createGroups()
    //---- var exampleMapOfValues = createExampleMap();

    //transform the map of set values according to language groups
    var groupsToTranslate = [];
    createGroups(g_mapOfValuesByLanguages, groupsToTranslate);

    var selectedEngine = getSelectedEngine(g_tcheck.ntranslationengine);          

    //create object for plugin
    var objToTranslate = createJSONobj(selectedEngine, groupsToTranslate);

    // plugin DEBUG
    if (B_ALLOW_DEBUG) {            
        writeGroupsToDebug(groupsToTranslate, "before translation");        
        writeMsgToDebug("JSON obj to translate : \r\n" + blackOutSensitiveData(JSON.stringify(objToTranslate)));
    } 

    //send collection of string values to the translation service/plugin
    var reportResult = executeTranslation(objToTranslate, selectedEngine.rid, oselectedStartItems);

    //memory leak prevention, same content is still in groupsToTranslate without configs
    objToTranslate = null;

    var translations = JSON.parse(reportResult.getProperty("translated"));
    var errObj = JSON.parse(reportResult.getProperty("errors"));
    writeMsgToERROR(errObj);    

    //only debug purpose
    if (B_ALLOW_DEBUG) {     
        writeMsgToDebug("Debug output from translate script :\r\n" + reportResult.getProperty("debugOut"));
        writeMsgToDebug("JSON obj after translate : \r\n" + reportResult.getProperty("translated")); 
        if (translations != undefined) writeGroupsToDebug(translations.groups, "after translation");        
    }

    //merge translated values with source values
    dictionary = processResults(groupsToTranslate, translations);

    return dictionary;
}

function isDataSetEmpty(data) {
    return  data.database.legth == 0 && data.groups.legth == 0 && data.models.legth == 0
            && data.objects.legth == 0 && data.umlElements.legth == 0
            && data.cxns.legth == 0 && data.shortcuts.legth == 0
            && data.textdefs.legth == 0 && data.fontstyles.legth == 0;
}

//Returns map of value sets to trnaslate
//For each language can be different list of strings to translate.
function getMapOfValueSetsToTranslate(dataSet) {
    var valuesByLanguages = new java.util.HashMap();
    if (g_atargetLanguages.length <= 0 || isDataSetEmpty(dataSet)) return valuesByLanguages;

    //check if 'Overwrite manual translations' is TRUE OR 'Export and translate attributes not specified in target' IS NOT checked
    //true >> get one set of all source values
    //false >> get different Set of source values for specified language
    if (g_tcheck.boverwrite) {
        var valuesToTranslate = new java.util.HashSet();

        //collect attr values to translate - in this case -1 is given as language code, cause it does not matter on language, we will translate everything for all langs
        for (var dataSection in dataSet) {
            for (var j = 0 ; j < dataSet[dataSection].length; j++ ) {
                valuesToTranslate.addAll(getItemValuesToTranslate(dataSet[dataSection][j], Number(-1)));
            }
        }
        valuesByLanguages.put(Number(-1), valuesToTranslate);

    } else {

        for (var lang = 0; lang < g_atargetLanguages.length; lang++) {
            var valuesToTranslate = new java.util.HashSet();

            //collect attr values to translate
            for (var dataSection in dataSet) {
                for (var j = 0 ; j < dataSet[dataSection].length ; j++ ) {
                    valuesToTranslate.addAll(getItemValuesToTranslate(dataSet[dataSection][j], g_atargetLanguages[lang]));
                }
            }
            valuesByLanguages.put(g_atargetLanguages[lang], valuesToTranslate);
        }
    }

    return valuesByLanguages;
}

function getItemValuesToTranslate(ocurritem, tLang) {
    // AttrList in source language
    var oattrlist = ocurritem.AttrList(g_tcheck.nsourcelang);
    var valuesToTrans = new java.util.ArrayList();

    for (var i = 0 ; i < oattrlist.length ; i++ ) {
        var ocurrattr = oattrlist[i];

        if (ocurrattr.IsChangeable() && ocurrattr.LanguageDependence() == 0) {
            switch(g_omethodfilter.AttrBaseType(ocurrattr.TypeNum())) {
                case Constants.ABT_BITMAP:
                case Constants.ABT_ITEMTYPE:
                case Constants.ABT_LONGTEXT:
                case Constants.ABT_VALUE:
                case Constants.ABT_COMBINED:
                    break;
                default:
                    var nattrtypenum = ocurrattr.TypeNum();
                    var ssourceval = getattributevalue(ocurrattr);

                    // prevention against having items with whitespaces only
                    var whiteSpaceCheck = ssourceval.replace(/\s+/g,'');
                    if (whiteSpaceCheck == "") continue;

                    // BLUE-25934 Output error in case of texyt is longer than 32767 characters
					if (('' + ssourceval).length > MAX_TEXT_LENGTH) continue;

                    if (g_tcheck.boverwrite) {
                        valuesToTrans.add(ssourceval);
                    } else {
                        var olangattr = ocurritem.Attribute(nattrtypenum, tLang);
                        if (!olangattr.IsMaintained()) {
                            valuesToTrans.add(ssourceval);
                        }
                    }
            }
        }
    }
    return valuesToTrans;
}

//only testing purpose
function createExampleMap() {
    var exampleMapOfValues = java.util.HashMap();
    var lang10 = new java.util.ArrayList();
    lang10.addAll(["home", "river", "Road", "road"]);
    exampleMapOfValues.put("10", lang10);
    var lang20 = new java.util.ArrayList();
    lang20.addAll(["home", "river", "car"]);
    exampleMapOfValues.put("20", lang20);
    var lang30 = new java.util.ArrayList();
    lang30.addAll(["road", "car"]);
    exampleMapOfValues.put("30", lang30);
    var lang40 = new java.util.ArrayList();
    lang40.addAll(["harmonica"]);
    exampleMapOfValues.put("40", lang40);

    return exampleMapOfValues;
}

function createGroups(mapOfValuesByLanguages, groupsToTranslate) {
    if (mapOfValuesByLanguages.size() == 1) {
        var group = {
            langs : [],
            attrs : []
        }
        group.langs = g_atargetLanguages;
        var it = mapOfValuesByLanguages.entrySet().iterator();
        while(it.hasNext()) {
            group.attrs = it.next().getValue().toArray();
        }
        groupsToTranslate.push(group);
    } else {
        var keyArray = mapOfValuesByLanguages.keySet().toArray();
        for (var keyIndex = 0; keyIndex < keyArray.length; keyIndex++) {
            var key = keyArray[keyIndex];
            var sourceValues = mapOfValuesByLanguages.get(parseInt(key)).toArray();
            for (var valueIndex = 0; valueIndex < sourceValues.length; valueIndex++) {
                var value = sourceValues[valueIndex];
                var langs = createLangGroup(key, value, mapOfValuesByLanguages);
                handleValueAndGroup(value, langs, groupsToTranslate);
            }
            mapOfValuesByLanguages.remove(key.toString());
       }
    }
    //mapOfValuesByLanguages should be cleaned here as prevention against memory leak, we can get another huge list of translated values
    mapOfValuesByLanguages.clear();
}

function writeGroupsToDebug(groups, msg) {
    writeMsgToDebug(msg);
    g_debugOut.BeginList();
    if (groups[0].langs != undefined) {
        for (var i = 0; i < groups.length; i++) {
            g_debugOut.Output(JSON.stringify(groups[i].langs),"Arial",12,Constants.C_BLACK,Constants.C_BLUE, Constants.FMT_ITALIC,0);
            g_debugOut.OutputLn(JSON.stringify(groups[i].attrs),"Arial",12,Constants.C_BLACK,Constants.C_BLUE, Constants.FMT_ITALIC,0);
        }
    } else {
        for (var i = 0; i < groups.length; i++) {
            g_debugOut.OutputLn(JSON.stringify(groups[i].attrs),"Arial",12,Constants.C_BLACK,Constants.C_BLUE, Constants.FMT_ITALIC,0);
        }
    }
    g_debugOut.EndList();
}

function createLangGroup(keyLang, value, mapOfValuesByLanguages) {
    var langs = [];

    langs.push(keyLang);
    var keyArray = mapOfValuesByLanguages.keySet().toArray();
    for (var keyIndex = 0; keyIndex < keyArray.length; keyIndex++) {
        var key = keyArray[keyIndex];
        if (keyLang.toString() != key.toString()) {
            var valueList = mapOfValuesByLanguages.get(parseInt(key));
            if (!valueList.contains(value.toString())) continue;
            langs.push(key);
            valueList.remove(value.toString());
        }
    }
    return langs;
}

function handleValueAndGroup(value, langGroup, groupsToTranslate) {
    if (groupsToTranslate.length > 0) {

        for (var i = 0; i < groupsToTranslate.length; i++) {
            if (equalGroups(groupsToTranslate[i].langs, langGroup)) {
                groupsToTranslate[i].attrs.push(value);
                return;
            }
        }
    }

    var group = {
        langs : [],
        attrs : []
    }
    group.langs = langGroup;
    group.attrs.push(value);
    groupsToTranslate.push(group);
}

function equalGroups(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

function createJSONobj(engine, groupsToTranslate) {
    var engineConfig = getStringifingParams(engine);
    var translateObj = {
        conf: engineConfig,
        src_lang: getEngineSrcLangCode(engine, g_tcheck.nsourcelang),
        groups:[]
    };

    for (var i = 0; i < groupsToTranslate.length; i++) {
        var groupObj = {
                langs: [],
                attrs: []
            }
        groupObj.langs = getEngineTrgLangsCodes(engine, groupsToTranslate[i].langs); //groupsToTranslate[i].langs;
        groupObj.attrs = groupsToTranslate[i].attrs;
        translateObj.groups.push(groupObj);
    }

    return translateObj;
}

function getEngineTrgLangsCodes(engine, groupLangs) {
    var engLangsCodes = [];
    if (engine.id == "Demo") {
        return groupLangs;
    } else {
        for (var i = 0; i < groupLangs.length; i++) {
            var arisCode = g_languages.getTag(parseInt(groupLangs[i]));
            for (var j = 0; j < engine.langs.target.length; j++) {
                if (engine.langs.arisLang[j] == arisCode) { 
                    engLangsCodes.push("" + engine.langs.target[j]);        
                    j = engine.langs.target.length;
                }
            }        
        }
    }   
    return engLangsCodes;
}

function getEngineSrcLangCode(engine, arisLang) {
    var arisCode = g_languages.getTag(arisLang);
    if (engine.id == "Demo") {
        return "" + arisLang;
    } else {
        for (var i = 0; i < engine.langs.target.length; i++) {
            if (engine.langs.arisLang[i] == arisCode) { 
                return "" + engine.langs.source[i];
            }
        }
    }
    return "" + arisCode;
}

function executeTranslation(translationObj, RID, oselectedStartItems) {
    //getAnySelectedStartItems() is used only for creating reportInfo object. It is manadatory parameter. Script can be started only on some item.
    var reportInfo = report.createExecInfo(RID, oselectedStartItems.getAnySelectedStartItems(), g_tcheck.nsourcelang);
    reportInfo.setProperty ("pluginData", JSON.stringify(translationObj));
    reportInfo.setProperty ("command", "translate");
    reportInfo.setProperty ("allow_debug", B_ALLOW_DEBUG);
    return report.execute(reportInfo);

}

function processResults(groupsToTranslate, translations) {
    //key - source value; value - array of translated equivalents in exact order according to target languages array
    var mapOfTranslatedValues = new java.util.HashMap();
    if(translations == undefined || groupsToTranslate.length != translations.groups.length) {
        writeMsgToERROR(getString("TEXT_57"));
        return mapOfTranslatedValues;
    }

    for (var gIdx=0; gIdx < groupsToTranslate.length; gIdx++) {
        //iterate through source values of group
        if(groupsToTranslate[gIdx].attrs.length != translations.groups[gIdx].attrs.length) {
            writeMsgToERROR(getString("TEXT_58"));
            writeMsgToERROR(getString("TEXT_59") + JSON.stringify(groupsToTranslate[gIdx].attrs) + getString("TEXT_60") + JSON.stringify(translations.groups[gIdx].attrs));
            continue;
        }
        for (var sIdx=0; sIdx < groupsToTranslate[gIdx].attrs.length; sIdx++) {
            var arrayOfTranslations = [];
            if (translations.groups[gIdx].attrs != undefined) {
                arrayOfTranslations = createArrayOfTranslationsForValue(groupsToTranslate[gIdx].langs, translations.groups[gIdx].attrs[sIdx]);
            }
            mapOfTranslatedValues.put(groupsToTranslate[gIdx].attrs[sIdx].toString(), arrayOfTranslations);
            //memory leak prevention
            groupsToTranslate[gIdx].attrs[sIdx] = null;
        }
    }
    return mapOfTranslatedValues;
}

function createArrayOfTranslationsForValue(langs, group) {
    var result = new Array(g_atargetLanguages.length);
    for (var langIdx = 0; langIdx < langs.length; langIdx++) {
        var targetLangIdx = g_atargetLanguages.indexOf(parseInt(langs[langIdx]));
        if (targetLangIdx == -1) {
            writeMsgToERROR(getString("TEXT58") + " - " + lang);
            continue;
        }
        result[targetLangIdx] = group[langIdx];
        //memory leak prevention
        group[langIdx] = null;
    }
    return result;
}

//todo - propagate overflow message to dialog, that user can go back and change the set of groups, models, objects etc.
function getTextCountOfTranslatedItems() {
    var stringsForSummaryPage = [];
    var countOfAttrItems = 0;
    var countOfWords = 0;
    var countOfCharacters = 0;
    var isOverflowed = false;

    var it = g_mapOfValuesByLanguages.entrySet().iterator();
    while(it.hasNext()) {
        var valuesPerLanguage = it.next().getValue().toArray();
        countOfAttrItems += valuesPerLanguage.length;
        for (var i = 0; i < valuesPerLanguage.length; i++) {
            var wordsPerAttr = valuesPerLanguage[i].split(/\s+/);
            countOfWords += wordsPerAttr.length;
            if (!isOverflowed) {
                //to avoid overflow the number of characters - to do not get a wrong number
                if (sumDoesOverflow(countOfCharacters, valuesPerLanguage[i].length)) isOverflowed = true;
                else countOfCharacters += valuesPerLanguage[i].length;
            }
        }
    }

    if (g_tcheck.boverwrite) {
        countOfAttrItems = countOfAttrItems * g_tcheck.atargetlangs.length;
        countOfWords = countOfWords * g_tcheck.atargetlangs.length;
        //to avoid overflow the number of characters - to do not get a wrong number
        if (multiplicationDoesOverflow(countOfCharacters, g_tcheck.atargetlangs.length)) isOverflowed = true;
        else countOfCharacters = countOfCharacters * g_tcheck.atargetlangs.length;
    }

    countOfChars = isOverflowed ? getString("TEXT66") : countOfCharacters;

    stringsForSummaryPage[0] = getString("TEXT61") + " " + countOfAttrItems;
    stringsForSummaryPage[1] = getString("TEXT62") + " " + countOfWords;
    stringsForSummaryPage[2] = getString("TEXT63") + " " + countOfChars;
    return stringsForSummaryPage;
}

function sumDoesOverflow(a, b) {
    var c = a + b;
    return a !== c-b || b !== c-a;
}

function multiplicationDoesOverflow(a, b) {
    var c = a * b;
    return c != 0 && (a !== c/b || b !== c/a);
  }

function userDialogWizard()
{
    // all member functions except for getPages can access the property "dialog" of the dialog class. Type is "UserDialog" (see help).
    // examples:
    // - Get the page with the specified index (e.g. 0): this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_OPTION])
    // - Define the list of visible wizard pages (e.g. 0,1): this.dialog.setActiveWizardPages([0,1])
    var olanguages = getlanguages();
    var slanguages = new Array();
    var nlanguages = new Array();
    var isDemoActivated = false;
    var returnObj = null;

	//page numbers
	var PAGE_NUMBERS = {};
	var PAGE_EXPORT_OPTION = "ExportTypePage";
	var PAGE_EXPORT_ONLY = "ExportOnlyPage";
	var PAGE_ENGINE_LIST = "EngineListPage";
	var PAGE_EXPORT_AND_TRANSLATE_PAGE = "ExportAndTranslatePage";
	var PAGE_SUMMARY = "SummaryPage";

    this.getPages = function()
    {
		var pages = [];
		var pageIndex = 0;
        var dialogWidth = 570;
        var dialogHeight = 500;
        var dropdownLabelWidth = 180;
        var textBoxLabelWidth = 180;
        var checkboxWidth = 150;  
        var rightMargin = 35;

        /* Choose Export Type Page*/
        var startOffsetY = 15;
        var startOffsetX = 15;
        var iDialogTemplate0 = Dialogs.createNewDialogTemplate(0, 0, dialogWidth, dialogHeight, getString("TEXT46"));
        iDialogTemplate0.OptionGroup("ExportOption");
        iDialogTemplate0.OptionButton(startOffsetX, startOffsetY, dialogWidth - rightMargin, 15, getString("TEXT44"), "Option_ExportOnly");
        iDialogTemplate0.OptionButton(startOffsetX, startOffsetY + 20, dialogWidth - rightMargin, 15, getString("TEXT45"), "Option_ExportAndTranslate");
        iDialogTemplate0.HelpButton("HID_a7088070-8650-11eb-46cf-e454e8a63ab4_dlg_01.hlp");
		pages.push(iDialogTemplate0);
		PAGE_NUMBERS[PAGE_EXPORT_OPTION] = pageIndex++;

        /* Export Only Page*/
        startOffsetY = 15;
        startOffsetX = 15;
        var iDialogTemplate1 = Dialogs.createNewDialogTemplate(0, 0, dialogWidth, dialogHeight, getString("TEXT53"));
        iDialogTemplate1.Text(startOffsetX, startOffsetY, dropdownLabelWidth, 14, getString("TEXT32"), "Text1");
        iDialogTemplate1.DropListBox(startOffsetX + 120, startOffsetY, dialogWidth - dropdownLabelWidth - rightMargin, 70, null, "SourceLang");
        iDialogTemplate1.Text(startOffsetX, startOffsetY += 30, dropdownLabelWidth, 14, getString("TEXT33"), "Text2");
        iDialogTemplate1.DropListBox(startOffsetX + 120, startOffsetY, dialogWidth - dropdownLabelWidth - rightMargin, 70, null, "TargetLang");
        iDialogTemplate1.GroupBox(startOffsetX, startOffsetY += 30, dialogWidth - rightMargin, 110, getString("TEXT34"), "GroupBox1");
        iDialogTemplate1.CheckBox(startOffsetX + 20, startOffsetY += 20, checkboxWidth, 15, getString("TEXT12"), "Check_Database");
        iDialogTemplate1.CheckBox(startOffsetX + 20, startOffsetY += 20, checkboxWidth, 15, getString("TEXT14"), "Check_Group");
        iDialogTemplate1.CheckBox(startOffsetX + 20, startOffsetY += 20, checkboxWidth, 15, getString("TEXT15"), "Check_Model");
        iDialogTemplate1.CheckBox(startOffsetX + 20, startOffsetY += 20, checkboxWidth, 15, getString("TEXT16"), "Check_Object");
        iDialogTemplate1.CheckBox(startOffsetX + 180, startOffsetY += -60, checkboxWidth, 15, getString("TEXT17"), "Check_Cxn");
        iDialogTemplate1.CheckBox(startOffsetX + 180, startOffsetY += 20, checkboxWidth, 15, getString("TEXT40"), "Check_Shortcut");
        iDialogTemplate1.CheckBox(startOffsetX + 180, startOffsetY += 20, checkboxWidth, 15, getString("TEXT18"), "Check_Text");
        iDialogTemplate1.CheckBox(startOffsetX + 180, startOffsetY += 20, checkboxWidth, 15, getString("TEXT20"), "Check_FontStyle");
        iDialogTemplate1.CheckBox(startOffsetX, startOffsetY += 40, dialogWidth - rightMargin, 15, getString("TEXT41"), "Check_Only_NotMaintained");
        iDialogTemplate1.CheckBox(startOffsetX, startOffsetY += 20, dialogWidth - rightMargin, 15, getString("TEXT42"), "Check_Expand");     // BLUE-11810
        iDialogTemplate1.CheckBox(startOffsetX, startOffsetY += 20, dialogWidth - rightMargin, 15, getString("TEXT38"), "Check_Recursion");
        iDialogTemplate1.HelpButton("HID_a7088070-8650-11eb-46cf-e454e8a63ab4_dlg_02.hlp");
		pages.push(iDialogTemplate1);
		PAGE_NUMBERS[PAGE_EXPORT_ONLY] = pageIndex++;

        /* Engine List Page */
        var iDialogTemplate2 = Dialogs.createNewDialogTemplate(0, 0, dialogWidth, dialogHeight, getString("TEXT64"));
        startOffsetY = 15;
        startOffsetX = 15;
        iDialogTemplate2.Text(startOffsetX, startOffsetY, dialogWidth - rightMargin, 15, getString("TEXT67"));
        startOffsetY += 30;
        iDialogTemplate2.OptionGroup("TranslationEngineOption");
		PAGE_NUMBERS[PAGE_ENGINE_LIST] = pageIndex++;

		/* Engine Plugin Page(s) */
		var enginePages = [];
		for(var e in g_engines) {
			if (g_engines[e].allowed) {
				iDialogTemplate2.OptionButton(startOffsetX, startOffsetY, dialogWidth - rightMargin, 15, g_engines[e].name, g_engines[e].id);
				startOffsetY += 20;

				var iDialogTemplate = Dialogs.createNewDialogTemplate(0, 0, dialogWidth, dialogHeight, g_engines[e].name + " options");

                var pStartOffsetY = 0;
                var pStartOffsetX = 15;
                for(var p in g_engines[e].params){
                    var param = g_engines[e].params[p];
                    if (!param.hidden) {
                        switch(param.type) {
                          case "boolean":
                            iDialogTemplate.CheckBox(pStartOffsetX, pStartOffsetY += 20, dialogWidth - textBoxLabelWidth - rightMargin, 15, param.name, g_engines[e].id + "_CheckBox_" + p);
                            break;
                          case "string":
                            iDialogTemplate.Text(pStartOffsetX, pStartOffsetY += 25, textBoxLabelWidth, 15, param.name);
                            iDialogTemplate.TextBox(pStartOffsetX + textBoxLabelWidth, pStartOffsetY - 3, dialogWidth - textBoxLabelWidth - rightMargin, 15, g_engines[e].id + "_TextBox_" + p, 0);                           
                            if (p == "authKey") this.createAuthKeyValidator(g_engines[e].id + "_TextBox_" + p);
                            break;
                          case "list":
                            iDialogTemplate.Text(pStartOffsetX, pStartOffsetY += 35, dropdownLabelWidth, 15, param.name);
                            iDialogTemplate.DropListBox(pStartOffsetX + dropdownLabelWidth, pStartOffsetY - 3, dialogWidth - dropdownLabelWidth - rightMargin, 70, param.values, g_engines[e].id + "_DropListBox_" + p);
                            break;
                          case "label":
                            var newLines = param.name.split("\n").length;
                            iDialogTemplate.Text(pStartOffsetX, pStartOffsetY += 35, dialogWidth - rightMargin, (newLines*15), param.name);
                            pStartOffsetY += (newLines - 1) * 15;
                            default:
                        }
                    }
                }
                                
				if (g_engines[e].id != "Demo") iDialogTemplate.HelpButton(g_engines[e].hid);

				enginePages.push(iDialogTemplate);
				PAGE_NUMBERS[g_engines[e].id] = pageIndex++;
			}
		}
        
        iDialogTemplate2.HelpButton("HID_a7088070-8650-11eb-46cf-e454e8a63ab4_dlg_03.hlp");
		pages.push(iDialogTemplate2);
		for (var p in enginePages) {
			pages.push(enginePages[p]);
		}

        /* Export and Translate Options Page */
        var iDialogTemplate3 = Dialogs.createNewDialogTemplate(0, 0, dialogWidth, dialogHeight, getString("TEXT54"));
        startOffsetY = 15;
        startOffsetX = 15;
        iDialogTemplate3.Text(startOffsetX, startOffsetY, dropdownLabelWidth, 14, getString("TEXT32"), "Text2");
        iDialogTemplate3.DropListBox(startOffsetX + 120, startOffsetY, dialogWidth - dropdownLabelWidth - rightMargin, 70, null, "SourceLang2");
        iDialogTemplate3.Text(startOffsetX, startOffsetY += 30, dialogWidth - rightMargin, 14, getString("TEXT48"), "Text3");
        var tableHeight = 150;
        iDialogTemplate3.Table(startOffsetX, startOffsetY += 15, dialogWidth - rightMargin, tableHeight,
                [getString("TEXT49"), getString("TEXT50")],
                [Constants.TABLECOLUMN_BOOL_EDIT, Constants.TABLECOLUMN_SINGLELINE],
                ["10","85"],
                "TargetLangs",
                Constants.TABLE_STYLE_DEFAULT);
        iDialogTemplate3.CheckBox(startOffsetX, startOffsetY += tableHeight + 5, dialogWidth - rightMargin, 15, getString("TEXT51"), "Check_Overwrite");
        iDialogTemplate3.CheckBox(startOffsetX, startOffsetY += 20, dialogWidth - rightMargin, 15, getString("TEXT52"), "Check_WriteToDB");
        iDialogTemplate3.GroupBox(startOffsetX, startOffsetY += 30, dialogWidth - rightMargin, 110, getString("TEXT34"), "GroupBox2");
        iDialogTemplate3.CheckBox(startOffsetX + 20, startOffsetY += 20, checkboxWidth, 15, getString("TEXT12"), "Check_Database2");
        iDialogTemplate3.CheckBox(startOffsetX + 20, startOffsetY += 20, checkboxWidth, 15, getString("TEXT14"), "Check_Group2");
        iDialogTemplate3.CheckBox(startOffsetX + 20, startOffsetY += 20, checkboxWidth, 15, getString("TEXT15"), "Check_Model2");
        iDialogTemplate3.CheckBox(startOffsetX + 20, startOffsetY += 20, checkboxWidth, 15, getString("TEXT16"), "Check_Object2");
        iDialogTemplate3.CheckBox(startOffsetX + 180, startOffsetY += -60, checkboxWidth, 15, getString("TEXT17"), "Check_Cxn2");
        iDialogTemplate3.CheckBox(startOffsetX + 180, startOffsetY += 20, checkboxWidth, 15, getString("TEXT40"), "Check_Shortcut2");
        iDialogTemplate3.CheckBox(startOffsetX + 180, startOffsetY += 20, checkboxWidth, 15, getString("TEXT18"), "Check_Text2");
        iDialogTemplate3.CheckBox(startOffsetX + 180, startOffsetY += 20, checkboxWidth, 15, getString("TEXT20"), "Check_FontStyle2");
        iDialogTemplate3.CheckBox(startOffsetX, startOffsetY += 40, dialogWidth - rightMargin, 15, getString("TEXT41"), "Check_Only_NotMaintained2");
        iDialogTemplate3.CheckBox(startOffsetX, startOffsetY += 20, dialogWidth - rightMargin, 15, getString("TEXT42"), "Check_Expand2");
        iDialogTemplate3.CheckBox(startOffsetX, startOffsetY += 20, dialogWidth - rightMargin, 15, getString("TEXT38"), "Check_Recursion2");
        iDialogTemplate3.HelpButton("HID_a7088070-8650-11eb-46cf-e454e8a63ab4_dlg_07.hlp");
		pages.push(iDialogTemplate3);
		PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE] = pageIndex++;

        /* Summary Page */
        var iDialogTemplate4 = Dialogs.createNewDialogTemplate(0, 0, dialogWidth, dialogHeight, getString("TEXT59"));
        startOffsetY = 15;
        startOffsetX = 15;
        tableHeight = 100;
        iDialogTemplate4.Text(startOffsetX, startOffsetY, dialogWidth - dropdownLabelWidth - rightMargin, 70, null, "TTranslationEngine");
        iDialogTemplate4.Text(startOffsetX, startOffsetY +=30, dropdownLabelWidth, 14, getString("TEXT32"), "Text2");
        iDialogTemplate4.Text(startOffsetX + 120, startOffsetY, dialogWidth - dropdownLabelWidth - rightMargin, 70, null, "TSourceLang");
        iDialogTemplate4.Text(startOffsetX, startOffsetY += 30, dialogWidth - rightMargin, 14, getString("TEXT60"), "Text3");
        iDialogTemplate4.ListBox(startOffsetX, startOffsetY += 15, dialogWidth - rightMargin, tableHeight, null, "LTargetLangs");
        iDialogTemplate4.CheckBox(startOffsetX, startOffsetY += tableHeight + 5, dialogWidth - rightMargin, 15, getString("TEXT51"), "SCheck_Overwrite");
        iDialogTemplate4.CheckBox(startOffsetX, startOffsetY += 20, dialogWidth - rightMargin, 15, getString("TEXT52"), "SCheck_WriteToDB");
        iDialogTemplate4.GroupBox(startOffsetX, startOffsetY += 30, dialogWidth - rightMargin, 110, getString("TEXT34"), "GroupBox2");
        iDialogTemplate4.CheckBox(startOffsetX + 20, startOffsetY += 20, checkboxWidth, 15, getString("TEXT12"), "Check_Database3");
        iDialogTemplate4.CheckBox(startOffsetX + 20, startOffsetY += 20, checkboxWidth, 15, getString("TEXT14"), "Check_Group3");
        iDialogTemplate4.CheckBox(startOffsetX + 20, startOffsetY += 20, checkboxWidth, 15, getString("TEXT15"), "Check_Model3");
        iDialogTemplate4.CheckBox(startOffsetX + 20, startOffsetY += 20, checkboxWidth, 15, getString("TEXT16"), "Check_Object3");
        iDialogTemplate4.CheckBox(startOffsetX + 180, startOffsetY += -60, checkboxWidth, 15, getString("TEXT17"), "Check_Cxn3");
        iDialogTemplate4.CheckBox(startOffsetX + 180, startOffsetY += 20, checkboxWidth, 15, getString("TEXT40"), "Check_Shortcut3");
        iDialogTemplate4.CheckBox(startOffsetX + 180, startOffsetY += 20, checkboxWidth, 15, getString("TEXT18"), "Check_Text3");
        iDialogTemplate4.CheckBox(startOffsetX + 180, startOffsetY += 20, checkboxWidth, 15, getString("TEXT20"), "Check_FontStyle3");
        iDialogTemplate4.CheckBox(startOffsetX, startOffsetY += 40, dialogWidth - rightMargin, 15, getString("TEXT41"), "SCheck_Only_NotMaintained2");
        iDialogTemplate4.CheckBox(startOffsetX, startOffsetY += 20, dialogWidth - rightMargin, 15, getString("TEXT42"), "SCheck_Expand2");
        iDialogTemplate4.CheckBox(startOffsetX, startOffsetY += 20, dialogWidth - rightMargin, 15, getString("TEXT38"), "SCheck_Recursion2");
        iDialogTemplate4.Text(startOffsetX, startOffsetY +=30, dialogWidth - rightMargin, 14, getString("TEXT61"), "CountOfItems");
        iDialogTemplate4.Text(startOffsetX, startOffsetY +=20, dialogWidth - rightMargin, 14, getString("TEXT62"), "CountOfWords");
        iDialogTemplate4.Text(startOffsetX, startOffsetY +=20, dialogWidth - rightMargin, 14, getString("TEXT63"), "CountOfChars");
		pages.push(iDialogTemplate4);
		PAGE_NUMBERS[PAGE_SUMMARY] = pageIndex++;

        return pages;
    }

    // initialize dialog pages (are already created and pre-initialized with static data from XML or template)
    // parameter: Array of DialogPage
    // see Help: DialogPage
    // user can set control values
    this.init = function(aPages)
    {
        // initialize languages
        for (var i = 0 ; i < olanguages.length ; i++ ) {
            slanguages.push(getlanguagename(olanguages[i]));
            nlanguages.push(olanguages[i].LocaleId());
        }

        // Read dialog settings from config
        var sSection = "SCRIPT_a7088070-8650-11eb-46cf-e454e8a63ab4";

        //initialize Export Option Page
        if (getAllowedEngineNames().length === 0) {
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_OPTION]).getDialogElement("ExportOption").setSelection(0);
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_OPTION]).getDialogElement("Option_ExportAndTranslate").setEnabled(false);
            this.dialog.setActiveWizardPages([0,1]);
        } else {
            var exportOption = Context.getProfileInt(sSection, "ExportOption", 0);
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_OPTION]).getDialogElement("ExportOption").setSelection(exportOption);
        }

        //initialize Export Only Page
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("SourceLang").setItems(slanguages);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("TargetLang").setItems(slanguages);
        ReadSettingsListBoxByNumber(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("SourceLang"), sSection, "SourceLang", 0, nlanguages);
        ReadSettingsListBoxByNumber(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("TargetLang"), sSection, "TargetLang", 0, nlanguages);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Database").setChecked(Boolean(Context.getProfileInt(sSection, "Check_Database", 1)));
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Group").setChecked(Boolean(Context.getProfileInt(sSection, "Check_Group", 1)));
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Model").setChecked(Boolean(Context.getProfileInt(sSection, "Check_Model", 1)));
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Object").setChecked(Boolean(Context.getProfileInt(sSection, "Check_Object", 1)));
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Cxn").setChecked(Boolean(Context.getProfileInt(sSection, "Check_Cxn", 1)));
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Shortcut").setChecked(Boolean(Context.getProfileInt(sSection, "Check_Shortcut", 1)));
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Text").setChecked(Boolean(Context.getProfileInt(sSection, "Check_Text", 1)));
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_FontStyle").setChecked(Boolean(Context.getProfileInt(sSection, "Check_FontStyle", 1)));
        var checkOnlyNotMaintained = Context.getProfileInt(sSection, "Check_Only_NotMaintained", 0);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Only_NotMaintained").setChecked(Boolean(checkOnlyNotMaintained));
        this.Check_OnlyNotMaintainedUpdate(checkOnlyNotMaintained);
        var checkExpand = Context.getProfileInt(sSection, "Check_Expand", 0);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Expand").setChecked(Boolean(checkExpand));
        this.Check_ExpandUpdate(checkExpand);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Recursion").setChecked(Boolean(Context.getProfileInt(sSection, "Check_Recursion", 0)));
        if (ArisData.getSelectedGroups().length <= 0) {
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Recursion").setChecked(false);
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Recursion").setEnabled(false);
        }
        
        //initialize Engine List Page
		var translationEngineOption = Context.getProfileInt(sSection, "TranslationEngineOption", 0);
		this.dialog.getPage(PAGE_NUMBERS[PAGE_ENGINE_LIST]).getDialogElement("TranslationEngineOption").setSelection(translationEngineOption);

       //read translation engine params
        for(var e in g_engines) {
            if (g_engines[e].allowed) {
                var enginePage = this.dialog.getPage(PAGE_NUMBERS[g_engines[e].id]);
                for(var p in g_engines[e].params) {
                    var param = g_engines[e].params[p];
                    if (!param.hidden) {
                        switch(param.type) {
                          case "boolean":
                            var isChecked = Boolean(Context.getProfileInt(sSection, g_engines[e].id + "_CheckBox_" + p, param.value ? 1 : 0));
                            enginePage.getDialogElement(g_engines[e].id + "_CheckBox_" + p).setChecked(isChecked);
                            param.value = isChecked;
                            break;
                          case "string":
                            if (p != "authKey") {
                                var textValue = Context.getProfileString(sSection, g_engines[e].id + "_TextBox_" + p, param.value);
                                enginePage.getDialogElement(g_engines[e].id + "_TextBox_" + p).setText(textValue);
                                param.value = textValue;
                            }
                            break;
                          case "list":
                            var elem = enginePage.getDialogElement(g_engines[e].id + "_DropListBox_" + p);
                            ReadSettingsListBoxByString(elem, sSection, g_engines[e].id + "_DropListBox_" + p, param.value, param.values);
                            var selectedIndex = elem.getSelectedIndex();
                            param.value = param.values[selectedIndex];
                            break;
                          default:
                            break;
                        }
                    }
                }
            }
        }

        //initialize Export and Translate Options Page
        // ReadSettingsListBoxByNumber(this.dialog.getPage(PAGE_NUMBERS[PAGE_ENGINE_LIST]).getDialogElement("SourceLang2"), sSection, "SourceLang2", 0, nlanguages);
        var checkOverwrite = false;
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Overwrite").setChecked(checkOverwrite);
        this.overwriteOptionUpdate(checkOverwrite);

        this.initDirectWrite();

        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Database2").setChecked(ArisData.getSelectedDatabases().length !== 0);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Database2").setEnabled(ArisData.getSelectedDatabases().length !== 0);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Group2").setChecked(ArisData.getSelectedGroups().length !== 0);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Group2").setEnabled(ArisData.getSelectedGroups().length !== 0 || ArisData.getSelectedDatabases().length !== 0);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Model2").setChecked(ArisData.getSelectedModels().length !== 0);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Model2").setEnabled(ArisData.getSelectedModels().length !== 0 || ArisData.getSelectedGroups().length !== 0 || ArisData.getSelectedDatabases().length !== 0);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Object2").setChecked(ArisData.getSelectedObjDefs().length !== 0);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Cxn2").setChecked(false);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Shortcut2").setChecked(false);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Shortcut2").setEnabled(ArisData.getSelectedGroups().length !== 0 || ArisData.getSelectedDatabases().length !== 0);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Text2").setChecked(false);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Text2").setEnabled(ArisData.getSelectedModels().length !== 0 || ArisData.getSelectedGroups().length !== 0 || ArisData.getSelectedDatabases().length !== 0);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_FontStyle2").setChecked(false);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_FontStyle2").setEnabled(ArisData.getSelectedDatabases().length !== 0);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Only_NotMaintained2").setChecked(false);
        this.Check_OnlyNotMaintainedUpdate2(false);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Expand2").setChecked(Boolean(false));
        this.Check_Expand2Update(false);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Recursion2").setChecked(false);
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Recursion2").setEnabled(ArisData.getSelectedGroups().length !== 0);

        this.exportOptionUpdate(exportOption);

        //helper function
        function ReadSettingsListBoxByNumber(listElement, sSection, sField, nDefault, aList) {
            var nIndex = 0;
            var nValue = Context.getProfileInt(sSection, sField, nDefault);
            for (var i = 0 ; i < aList.length ; i++ ) {
                if (nValue == aList[i])  {
                    nIndex = i;
                    break;
                }
            }
            listElement.setSelection(nIndex);
        }
        function ReadSettingsListBoxByString(listElement, sSection, sField, sDefault, aList) {
            var nIndex = 0;
            var sValue = Context.getProfileString(sSection, sField, sDefault);
            for (var i = 0 ; i < aList.length ; i++ ) {
                if (sValue == aList[i])  {
                    nIndex = i;
                    break;
                }
            }
            listElement.setSelection(nIndex);
        }
    }

    //As prevention agains loading list of languages from translation service only if you go back from Summary page.
    //It will call the translation service if you go to the engine option dialog page
    this.wasSummaryPage = false;

    // called when the page is displayed
    // pageNumber: the current page number, 0-based
    // optional
    this.onActivatePage = function(pageNumber) {        
        switch (pageNumber) {
            case PAGE_NUMBERS[PAGE_ENGINE_LIST]: 
                //clean ERROR log file when changing translation plugin, to prevent generating error log with not relevant plugin error messages
                g_errorText = "";
                this.isAuthKeyInserted = false;                
                break;
            case PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]:
                if (!this.wasSummaryPage) {
                    this.setSrcLangItems();
                    this.setTargetLangItems();     
                }
                this.wasSummaryPage = false;
                break;
            case PAGE_NUMBERS[PAGE_SUMMARY]:
                this.wasSummaryPage = true;
                this.setTranslationEngine();
                this.setSelectedSourceLanguage();
                this.setSelectedTargetLangItems();
                this.setOverwrite();
                this.setWriteToDb();
                this.setDbCheckBox();
                this.setGroupCheckBox();
                this.setModelCheckBox();
                this.setObjectCheckBox();
                this.setCxnCheckBox();
                this.setShortcutCheckBox();
                this.setFormTextCheckBox();
                this.setFontStyleCheckBox();
                this.setNotMaintained();
                this.setExpand();
                this.setRecursion();
                this.setGtcheckVar();
                prepareSummaryPageValues();
                var summaryText = getTextCountOfTranslatedItems();
                this.setCountTranslatedItems(summaryText[0]);
                this.setCountTranslatedWords(summaryText[1]);
                this.setCountTranslatedChars(summaryText[2]);
                break;
            default:
                break;
        }

        if (pageNumber != PAGE_NUMBERS[PAGE_EXPORT_OPTION]
            && pageNumber != PAGE_NUMBERS[PAGE_EXPORT_ONLY]
            && pageNumber != PAGE_NUMBERS[PAGE_ENGINE_LIST]
            && pageNumber != PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]            
            && pageNumber != PAGE_NUMBERS[PAGE_SUMMARY]) 
        { 
            this.updateAuthKeyTextBoxStatus();
        }
    }

    // returns true if the page is in a valid state. In this case "Ok", "Finish", or "Next" is enabled.
    // called each time a dialog value is changed by the user (button pressed, list selection, text field value, table entry, radio button,...)
    // pageNumber: the current page number, 0-based
    this.isInValidState = function(pageNumber)
    {
        //checks engine options
        if (pageNumber != PAGE_NUMBERS[PAGE_EXPORT_OPTION]
            && pageNumber != PAGE_NUMBERS[PAGE_EXPORT_ONLY]
            && pageNumber != PAGE_NUMBERS[PAGE_ENGINE_LIST]
            && pageNumber != PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]            
            && pageNumber != PAGE_NUMBERS[PAGE_SUMMARY]) 
        {            
            return this.isAuthKeyInserted;
        }

        switch (pageNumber) {
            case PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]:
                return isSomeItemChecked(this.dialog) && isSomeLanguageSelected(this.dialog);
            case PAGE_NUMBERS[PAGE_SUMMARY]:
                break;
            default:
                break;
        }

        return true;

        // Checks if at least one item type to export is selected.
        function isSomeItemChecked(dialog) {
            return dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Database2").isChecked() ||
            dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Group2").isChecked() ||
            dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Model2").isChecked() ||
            dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Object2").isChecked() ||
            dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Cxn2").isChecked() ||
            dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Shortcut2").isChecked() ||
            dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Text2").isChecked() ||
            dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_FontStyle2").isChecked();
        }
        
        // Checks if at least one language target for translation is selected.
        function isSomeLanguageSelected(dialog) {
            return dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("TargetLangs").getItems()
                .reduce(function(isSelected, item) {
                    return isSelected || item[0] == 1;
                }, false);
        }
    }

    this.setGtcheckVar = function()
    {
        const selectedEngineIdx = isDemoActivated ? g_demoEngineIdx : this.dialog.getPage(PAGE_NUMBERS[PAGE_ENGINE_LIST]).getDialogElement("TranslationEngineOption").getSelectedIndex();
        var eng = getSelectedEngine(selectedEngineIdx);

        // get src langs
        var selected = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("SourceLang2").getSelectedIndex()
        var srcIdx = 0;
        var srcLang = nlanguages[0];
        for (var lIdx = 0; lIdx < nlanguages.length; lIdx++) {
            if (eng.langs.source[lIdx]) {
                if (srcIdx == selected) {
                    srcLang = nlanguages[lIdx];
                }
                srcIdx++;
            }
        }

        // get target langs
        var targetItems = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("TargetLangs").getItems();
        var targetLangs = [];
        var itemIdx = 0;
        for (var i = 0; i < nlanguages.length; i++) {
            if (eng.langs.target[i]) {
                var isSelected = targetItems[itemIdx][0];
                var languageCode = nlanguages[i];
                if (isSelected == 1) {
                    targetLangs.push(languageCode);
                }
                itemIdx++;
            }
        }

        g_tcheck.nexportoption = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_OPTION]).getDialogElement("ExportOption").getSelectedIndex();
        g_tcheck.ndatabase = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Database2").isChecked() ? 1 : 0;
        g_tcheck.ngroup = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Group2").isChecked() ? 1 : 0;
        g_tcheck.nmodel = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Model2").isChecked() ? 1 : 0;
        g_tcheck.nobject = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Object2").isChecked() ? 1 : 0;
        g_tcheck.ncxn = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Cxn2").isChecked() ? 1 : 0;
        g_tcheck.nshortcut = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Shortcut2").isChecked() ? 1 : 0;
        g_tcheck.ntext = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Text2").isChecked() ? 1 : 0;
        g_tcheck.nfontstyle = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_FontStyle2").isChecked() ? 1 : 0;
        g_tcheck.bonlynotmaint = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Only_NotMaintained2").isChecked();
        g_tcheck.bexpand = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Expand2").isChecked();
        g_tcheck.brecursive = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Recursion2").isChecked();
        g_tcheck.nsourcelang = srcLang;
        g_tcheck.bwithtarget = false;
        g_tcheck.ntranslationengine = isDemoActivated ? g_demoEngineIdx : this.dialog.getPage(PAGE_NUMBERS[PAGE_ENGINE_LIST]).getDialogElement("TranslationEngineOption").getSelectedIndex();
        g_tcheck.atargetlangs = targetLangs;
        g_tcheck.boverwrite = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Overwrite").isChecked();
        g_tcheck.bwritetodatabase = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_WriteToDB").isChecked();
        g_tcheck.btranslationmode = true;
    }

    // returns true if the "Finish" or "Ok" button should be visible on this page.
    // pageNumber: the current page number, 0-based
    // optional. if not present: always true
    this.canFinish = function(pageNumber)
    {
        return pageNumber == PAGE_NUMBERS[PAGE_EXPORT_ONLY] || pageNumber == PAGE_NUMBERS[PAGE_SUMMARY];
    }

    // returns true if the user can switch to another page.
    // pageNumber: the current page number, 0-based
    // optional. if not present: always true
    this.canChangePage = function(pageNumber)
    {        
        return true; //!this.canFinish(pageNumber);
    }

    // returns true if the user can switch to next page.
    // called when the "Next" button is pressed and thus not suitable for activation/deactivation of this button
    // can prevent the display of the next page
    // pageNumber: the current page number, 0-based
    // optional. if not present: always true
    this.canGotoNextPage = function(pageNumber)
    {                                                                                                
        return true; //!this.canFinish(pageNumber);
    }

    // returns true if the user can switch to previous page.
    // called when the "Back" button is pressed and thus not suitable for activation/deactivation of this button
    // can prevent the display of the previous page
    // pageNumber: the current page number, 0-based
    // optional. if not present: always true
    this.canGotoPreviousPage = function(pageNumber)
    {
        return pageNumber > PAGE_NUMBERS[PAGE_EXPORT_OPTION];
    }

    // called after "Ok"/"Finish" has been pressed and the current state data has been applied
    // can be used to update your data
    // pageNumber: the current page number
    // bOK: true=Ok/finish, false=cancel pressed
    this.onClose = function(pageNumber, bOk)
    {
        // Write dialog settings to config
        if (bOk) {
            var sSection = "SCRIPT_a7088070-8650-11eb-46cf-e454e8a63ab4";

            //Export Option Page
            Context.writeProfileInt(sSection, "ExportOption", this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_OPTION]).getDialogElement("ExportOption").getSelectedIndex());

            switch (pageNumber) {
                case PAGE_NUMBERS[PAGE_EXPORT_ONLY]:
                    WriteSettingsListBoxByNumber(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("SourceLang"), sSection, "SourceLang", nlanguages);
                    WriteSettingsListBoxByNumber(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("TargetLang"), sSection, "TargetLang", nlanguages);
                    Context.writeProfileInt(sSection, "Check_Database", this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Database").isChecked() ? 1 : 0);
                    Context.writeProfileInt(sSection, "Check_Group", this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Group").isChecked() ? 1 : 0);
                    Context.writeProfileInt(sSection, "Check_Model", this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Model").isChecked() ? 1 : 0);
                    Context.writeProfileInt(sSection, "Check_Object", this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Object").isChecked() ? 1 : 0);
                    Context.writeProfileInt(sSection, "Check_Cxn", this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Cxn").isChecked() ? 1 : 0);
                    Context.writeProfileInt(sSection, "Check_Shortcut", this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Shortcut").isChecked() ? 1 : 0);
                    Context.writeProfileInt(sSection, "Check_Text", this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Text").isChecked() ? 1 : 0);
                    Context.writeProfileInt(sSection, "Check_FontStyle", this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_FontStyle").isChecked() ? 1 : 0);
                    Context.writeProfileInt(sSection, "Check_Only_NotMaintained", this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Only_NotMaintained").isChecked() ? 1 : 0);
                    Context.writeProfileInt(sSection, "Check_Expand", this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Expand").isChecked() ? 1 : 0);
                    Context.writeProfileInt(sSection, "Check_Recursion", this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Recursion").isChecked() ? 1 : 0);

                    returnObj = {
                        exportOption: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_OPTION]).getDialogElement("ExportOption").getSelectedIndex(),
                        checkDatabase: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Database").isChecked() ? 1 : 0,
                        checkGroup: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Group").isChecked() ? 1 : 0,
                        checkModel: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Model").isChecked() ? 1 : 0,
                        checkObject: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Object").isChecked() ? 1 : 0,
                        checkCxn: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Cxn").isChecked() ? 1 : 0,
                        checkShortcut: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Shortcut").isChecked() ? 1 : 0,
                        checkText: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Text").isChecked() ? 1 : 0,
                        checkFontStyle: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_FontStyle").isChecked() ? 1 : 0,
                        checkOnlyNotMaintained: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Only_NotMaintained").isChecked(),
                        checkExpand: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Expand").isChecked(),
                        checkRecursion: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Recursion").isChecked(),
                        sourceLang: nlanguages[this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("SourceLang").getSelectedIndex()],
                        targetLang: nlanguages[this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("TargetLang").getSelectedIndex()],
                        checkTranslationMode: false
                    }
                    break;
                case PAGE_NUMBERS[PAGE_SUMMARY]:
                   const selectedEngineIdx = this.dialog.getPage(PAGE_NUMBERS[PAGE_ENGINE_LIST]).getDialogElement("TranslationEngineOption").getSelectedIndex();
                   Context.writeProfileInt(sSection, "TranslationEngineOption", selectedEngineIdx);

                   //write translation engine params
                    for(var e in g_engines) {
                        if (g_engines[e].allowed) {
                            var enginePage = this.dialog.getPage(PAGE_NUMBERS[g_engines[e].id]);
                            for(var p in g_engines[e].params) {
                                var param = g_engines[e].params[p];
                                if (!param.hidden) {
                                    switch(param.type) {
                                      case "boolean":
                                      var isChecked = enginePage.getDialogElement(g_engines[e].id + "_CheckBox_" + p).isChecked();
                                        param.value = isChecked;
                                        Context.writeProfileInt(sSection, g_engines[e].id + "_CheckBox_" + p, isChecked ? 1 : 0);
                                        break;
                                      case "string":
                                        if (p != "authKey") {
                                            var textValue = enginePage.getDialogElement(g_engines[e].id + "_TextBox_" + p).getText();
                                            param.value = String(textValue);
                                            Context.writeProfileString(sSection, g_engines[e].id + "_TextBox_" + p, String(textValue));
                                        }
                                        break;
                                      case "list":
                                        var elem = enginePage.getDialogElement(g_engines[e].id + "_DropListBox_" + p);
                                        var selectedIndex = elem.getSelectedIndex();
                                        param.value = param.values[selectedIndex];
                                        WriteSettingsListBoxByString(elem, sSection, g_engines[e].id + "_DropListBox_" + p, param.values);
                                        break;
                                    }
                                }
                            }
                        }
                    }


                    // WriteSettingsListBoxByNumber(this.dialog.getPage(PAGE_NUMBERS[PAGE_ENGINE_LIST]).getDialogElement("SourceLang2"), sSection, "SourceLang2", nlanguages);
                    var eng = isDemoActivated ? getSelectedEngine(g_demoEngineIdx) : getSelectedEngine(selectedEngineIdx);

                    // get src langs
                    var selected = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("SourceLang2").getSelectedIndex()
                    var srcIdx = 0;
                    var srcLang = nlanguages[0];
                    for (var lIdx = 0; lIdx < nlanguages.length; lIdx++) {
                        if (eng.langs.source[lIdx]) {
                            if (srcIdx == selected) {
                                srcLang = nlanguages[lIdx];
                            }
                            srcIdx++;
                        }
                    }

                    // get target langs
                    var targetItems = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("TargetLangs").getItems();
                    var targetLangs = [];
                    var itemIdx = 0;
                    for (var i = 0; i < nlanguages.length; i++) {
                        if (eng.langs.target[i]) {
                            var isSelected = targetItems[itemIdx][0];
                            var languageCode = nlanguages[i];
                            if (isSelected == 1) {
                                targetLangs.push(languageCode);
                            }
                            itemIdx++;
                        }

                        // Context.writeProfileInt(sSection, "lang_" + languageCode, isSelected);
                    }

                    returnObj = {
                        exportOption: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_OPTION]).getDialogElement("ExportOption").getSelectedIndex(),
                        translationEngine: isDemoActivated ? g_demoEngineIdx : this.dialog.getPage(PAGE_NUMBERS[PAGE_ENGINE_LIST]).getDialogElement("TranslationEngineOption").getSelectedIndex(),
                        sourceLang: srcLang,
                        targetLangs: targetLangs,
                        checkOverwrite: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Overwrite").isChecked(),
                        checkWriteToDB: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_WriteToDB").isChecked(),
                        checkDatabase: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Database2").isChecked() ? 1 : 0,
                        checkGroup: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Group2").isChecked() ? 1 : 0,
                        checkModel: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Model2").isChecked() ? 1 : 0,
                        checkObject: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Object2").isChecked() ? 1 : 0,
                        checkCxn: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Cxn2").isChecked() ? 1 : 0,
                        checkShortcut: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Shortcut2").isChecked() ? 1 : 0,
                        checkText: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Text2").isChecked() ? 1 : 0,
                        checkFontStyle: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_FontStyle2").isChecked() ? 1 : 0,
                        checkOnlyNotMaintained: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Only_NotMaintained2").isChecked(),
                        checkExpand: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Expand2").isChecked(),
                        checkRecursion: this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Recursion2").isChecked(),
                        checkTranslationMode: true
                    }
                    break;
            }            
        }
        else {
            returnObj = {
                canceledByUser : true
            };
        }

        // Helper function -  writes value of dialog list box to config file
        function WriteSettingsListBoxByNumber(listElement, sSection, sField, aList) {
            var nValue = aList[listElement.getSelectedIndex()];
            if (nValue != null) Context.writeProfileInt(sSection, sField, nValue);
        }
        function WriteSettingsListBoxByString(listElement, sSection, sField, aList) {
            var sValue = aList[listElement.getSelectedIndex()];
            if (sValue != null) Context.writeProfileString(sSection, sField, sValue);
        }
    }

    // the result of this function is returned as result of Dialogs.showDialog(). Can be any object.
    this.getResult = function()
    {
        return returnObj;
    }

    //true - if authKey textBox is not empty in selected engine option page 
    this.isAuthKeyInserted = false;

    //creates dynamically "on change" method for authKey textBox
    this.createAuthKeyValidator = function (autKeyTextBoxName) {
        this[autKeyTextBoxName + "_changed"] = function(newValue) {            
            if (newValue != "") this.isAuthKeyInserted = true;
            else this.isAuthKeyInserted = false;
        }
    }

    this.updateAuthKeyTextBoxStatus = function () {
        var engineIdx = this.dialog.getPage(PAGE_NUMBERS[PAGE_ENGINE_LIST]).getDialogElement("TranslationEngineOption").getSelectedIndex();
        var engine = getSelectedEngine(engineIdx);                
        if (this.dialog.getPage(PAGE_NUMBERS[engine.id]).getDialogElement(engine.id + "_TextBox_authKey").getText() != "") this.isAuthKeyInserted = true;
        else this.isAuthKeyInserted = false;
    }

    // other methods (all optional):
    // - [ControlID]_pressed(),
    // - [ControlID]_focusChanged(boolean lost=false, gained=true)
    // - [ControlID]_changed() for TextBox and DropListBox
    // - [ControlID]_selChanged(int newSelection)
    // - [ControlID]_cellEdited(row, column) for editable tables, row and column are 0-based
    this.ExportOption_selChanged = function(newSelection) {
        this.exportOptionUpdate(newSelection);
    }
        
    this.exportOptionUpdate = function (selection) {        
        switch (selection) {
            //export only
            case 0 :
                this.dialog.setActiveWizardPages([
				    PAGE_NUMBERS[PAGE_EXPORT_OPTION],
				    PAGE_NUMBERS[PAGE_EXPORT_ONLY]]);        
                break;
            //export and translate
            case 1 : 
                var engine = getSelectedEngine(this.dialog.getPage(PAGE_NUMBERS[PAGE_ENGINE_LIST]).getDialogElement("TranslationEngineOption").getSelectedIndex());
                if (engine.id == "Demo") {
                    engine = getSelectedEngine(0);
                    this.dialog.getPage(PAGE_NUMBERS[PAGE_ENGINE_LIST]).getDialogElement("TranslationEngineOption").setSelection(0);
                }
                this.dialog.setActiveWizardPages([
    				PAGE_NUMBERS[PAGE_EXPORT_OPTION],
				    PAGE_NUMBERS[PAGE_ENGINE_LIST],
				    PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE],
				    PAGE_NUMBERS[PAGE_SUMMARY],
                    PAGE_NUMBERS[engine.id]]);
                break;
            default : break;
        }
    }

	this.TranslationEngineOption_selChanged = function(newSelection) {
        this.initDirectWrite();
		this.translationEngineOptionUpdate(newSelection);
	}

	this.translationEngineOptionUpdate = function (selection) {
        this.dialog.setActiveWizardPages([
			PAGE_NUMBERS[PAGE_EXPORT_OPTION],
			PAGE_NUMBERS[PAGE_ENGINE_LIST],
			PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE],
			PAGE_NUMBERS[PAGE_SUMMARY],
            PAGE_NUMBERS[getSelectedEngine(selection).id]]);
    }

    this.Check_Overwrite_selChanged = function (newSelection) {
        this.overwriteOptionUpdate(newSelection);
    }

    this.Check_Only_NotMaintained_selChanged = function(newSelection) {
        this.Check_OnlyNotMaintainedUpdate(newSelection);
    }
    
    this.Check_Expand_selChanged = function(newSelection) {
        this.Check_ExpandUpdate(newSelection)
    }

    this.Check_Only_NotMaintained2_selChanged = function(newSelection) {
        this.Check_OnlyNotMaintainedUpdate2(newSelection);
    }
    
    this.Check_Expand2_selChanged = function(newSelection) {
        this.Check_Expand2Update(newSelection)
    }

    this.overwriteOptionUpdate = function(selection) {
        if (selection == 1) {
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Only_NotMaintained2").setChecked(false);
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Only_NotMaintained2").setEnabled(false);
        } else if (!this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Expand2").isChecked()) {
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Only_NotMaintained2").setEnabled(true);
        }
    }

    this.Check_OnlyNotMaintainedUpdate = function (selection) {
        if (selection == 1) {
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Expand").setChecked(false);
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Expand").setEnabled(false);
        } else {
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Expand").setEnabled(true);
        }
    }

    this.Check_ExpandUpdate = function(selection) {
        if (selection == 1) {
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Only_NotMaintained").setChecked(false);
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Only_NotMaintained").setEnabled(false);
        } else {
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_ONLY]).getDialogElement("Check_Only_NotMaintained").setEnabled(true);
        }
    }

    this.Check_OnlyNotMaintainedUpdate2 = function (selection) {
        if (selection == 1) {
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Expand2").setChecked(false);
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Expand2").setEnabled(false);
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Overwrite").setChecked(false);
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Overwrite").setEnabled(false);
        } else {
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Expand2").setEnabled(true);
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Overwrite").setEnabled(true);
        }
    }

    this.Check_Expand2Update = function(selection) {
        if (selection == 1) {
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Only_NotMaintained2").setChecked(false);
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Only_NotMaintained2").setEnabled(false);
        } else if (!this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Overwrite").isChecked()) {
            this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Only_NotMaintained2").setEnabled(true);
        }
    }

    this.setSrcLangItems = function() {        
        var eng = getSelectedEngine(this.dialog.getPage(PAGE_NUMBERS[PAGE_ENGINE_LIST]).getDialogElement("TranslationEngineOption").getSelectedIndex());        
        if (!eng) {
            this.dialog.setMsgBox (PAGE_EXPORT_AND_TRANSLATE_PAGE, "Internal ERROR", Constants.MSGBOX_ICON_ERROR, getString("TEXT2"));            
            return false;
        }
        this.updateEngineParamValues(eng);

        if (eng.params["authKey"].value == g_demoAuthKey) {
            isDemoActivated = true;            
            eng = getSelectedEngine(g_demoEngineIdx);
            this.updateEngineParamValues(eng);            
        } else {
            isDemoActivated = false;
        }
        
        this.initSupportedArisLangs(eng);

        var items = [];
        if (eng.langs && eng.langs.source) {
            for (var i = 0; i < nlanguages.length; i++) {
                if (eng.langs.source[i]) {
                    items.push(slanguages[i] + " (" + eng.langs.arisLang[i] + ")");
                }
            }
        } else {
            return false;
        }
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("SourceLang2").setItems(items);
        return true;
    }

    this.setTargetLangItems = function() {
        var eng = isDemoActivated ? getSelectedEngine(g_demoEngineIdx) : getSelectedEngine(this.dialog.getPage(PAGE_NUMBERS[PAGE_ENGINE_LIST]).getDialogElement("TranslationEngineOption").getSelectedIndex());
        if (!eng) return;

        var items = [];
        if (eng.langs && eng.langs.target) {
            for (var i = 0; i < nlanguages.length; i++) {
                if (eng.langs.target[i]) {
                    var item = [];
                    var isSelected = 0;
                    item.push(isSelected);
                    item.push(slanguages[i] + " (" + eng.langs.target[i] + ")");
                    items.push(item);
                }
            }
        }
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("TargetLangs").setItems(items);
    }

    this.updateEngineParamValues = function(engine) {
        if (engine.id == "Demo") return;        

        var enginePage = this.dialog.getPage(PAGE_NUMBERS[engine.id]);
        for(var p in engine.params) {
            var param = engine.params[p];
            if (!param.hidden) {
                switch(param.type) {
                  case "boolean":
                    var isChecked = enginePage.getDialogElement(engine.id + "_CheckBox_" + p).isChecked();
                    param.value = isChecked;
                    break;
                  case "string":
                    var textValue = enginePage.getDialogElement(engine.id + "_TextBox_" + p).getText();
                    param.value = String(textValue);
                    break;
                  case "list":
                    var elem = enginePage.getDialogElement(engine.id + "_DropListBox_" + p);
                    var selectedIndex = elem.getSelectedIndex();
                    param.value = param.values[selectedIndex];
                    break;
                }
            }
        }
    }

    this.initSupportedArisLangs = function(engine) {
        var arisLangs = getlanguages().map(function(x){return String(x.LocaleInfo().getLocale().toLanguageTag().toLowerCase())});
        var engineConf = {conf: getStringifingParams(engine)};
    
        engine.langs = this.getSupportedLangsByPlugin(engineConf, arisLangs, engine.rid);
    }
    
    this.getSupportedLangsByPlugin = function(engineConfParams, arisLangs, RID) {
        //var report = Context.getComponent("Report");
        var reportInfo = report.createExecInfo(RID, getSelectedItems().getAnySelectedStartItems(), -1);
        reportInfo.setProperty ("pluginData", JSON.stringify(engineConfParams));
        reportInfo.setProperty ("arisLangs", JSON.stringify(arisLangs));
        reportInfo.setProperty ("allow_debug", JSON.stringify(B_ALLOW_DEBUG));
        reportInfo.setProperty ("command", "getLangs");
        
        if (B_ALLOW_DEBUG) {
            writeMsgToDebug("get langs request pluginData: ");
            writeMsgToDebug(blackOutSensitiveData(JSON.stringify(engineConfParams)));
            writeMsgToDebug("get langs request arisLangs: ")
            writeMsgToDebug(JSON.stringify(arisLangs));
        }

        var reportResult = report.execute(reportInfo);  
    
        var errObj = JSON.parse(reportResult.getProperty("errors"));
        if (errObj != undefined && errObj.length > 0) {
            var errorMsg = "Request GET languages failed.\r\n" + errObj;
            if (errorMsg) this.dialog.setMsgBox (PAGE_EXPORT_AND_TRANSLATE_PAGE, errorMsg, Constants.MSGBOX_ICON_ERROR, getString("TEXT2"));
            //writeMsgToERROR(errObj);
        }
        if (B_ALLOW_DEBUG) writeMsgToDebug(reportResult.getProperty("debugOut"));        

        return JSON.parse(reportResult.getProperty("langs"));
    }

    this.setTranslationEngine = function() {
        const selectedEngineIdx = isDemoActivated ? g_demoEngineIdx : this.dialog.getPage(PAGE_NUMBERS[PAGE_ENGINE_LIST]).getDialogElement("TranslationEngineOption").getSelectedIndex();
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("TTranslationEngine").setText(getSelectedEngine(selectedEngineIdx).name);
    }

    this.setSelectedSourceLanguage = function() {
        var sourceLangs =  this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("SourceLang2").getItems();
        const langIdx = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("SourceLang2").getSelectedIndex();
        if (langIdx >= 0) {
            var selectedLang = sourceLangs[langIdx];
            this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("TSourceLang").setText(selectedLang);
        } else {
            this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("TSourceLang").setText(sourceLangs[0]);
        }
    }

    this.setSelectedTargetLangItems = function() {
        var targetLangs = [];
        const selectedEngineIdx = isDemoActivated ? g_demoEngineIdx : this.dialog.getPage(PAGE_NUMBERS[PAGE_ENGINE_LIST]).getDialogElement("TranslationEngineOption").getSelectedIndex();
        var eng = getSelectedEngine(selectedEngineIdx);
        var targetItems = this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("TargetLangs").getItems();
        var itemIdx = 0;
        for (var i = 0; i < nlanguages.length; i++) {
            if (eng.langs.target[i]) {
                var isSelected = targetItems[itemIdx][0];
                if (isSelected == 1) {
                    targetLangs.push(targetItems[itemIdx][1]);
                }
                itemIdx++;
            }
        }
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("LTargetLangs").setItems(targetLangs);
    }

    this.setOverwrite = function() {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("SCheck_Overwrite").setChecked(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Overwrite").isChecked());
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("SCheck_Overwrite").setEnabled(false);
    }

    this.setWriteToDb = function() {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("SCheck_WriteToDB").setChecked(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_WriteToDB").isChecked());
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("SCheck_WriteToDB").setEnabled(false);
    }

    this.setDbCheckBox = function() {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_Database3").setChecked(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Database2").isChecked());
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_Database3").setEnabled(false);
    }

    this.setGroupCheckBox = function() {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_Group3").setChecked(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Group2").isChecked());
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_Group3").setEnabled(false);
    }

    this.setModelCheckBox = function() {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_Model3").setChecked(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Model2").isChecked());
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_Model3").setEnabled(false);
    }

    this.setObjectCheckBox = function() {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_Object3").setChecked(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Object2").isChecked());
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_Object3").setEnabled(false);
    }

    this.setCxnCheckBox = function() {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_Cxn3").setChecked(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Cxn2").isChecked());
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_Cxn3").setEnabled(false);
    }

    this.setShortcutCheckBox = function() {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_Shortcut3").setChecked(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Shortcut2").isChecked());
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_Shortcut3").setEnabled(false);
    }

    this.setFormTextCheckBox = function() {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_Text3").setChecked(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Text2").isChecked());
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_Text3").setEnabled(false);
    }

    this.setFontStyleCheckBox = function() {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_FontStyle3").setChecked(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_FontStyle2").isChecked());
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("Check_FontStyle3").setEnabled(false);
    }

    this.setNotMaintained = function() {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("SCheck_Only_NotMaintained2").setChecked(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Only_NotMaintained2").isChecked());
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("SCheck_Only_NotMaintained2").setEnabled(false);
    }

    this.setExpand = function() {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("SCheck_Expand2").setChecked(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Expand2").isChecked());
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("SCheck_Expand2").setEnabled(false);
    }

    this.setRecursion = function() {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("SCheck_Recursion2").setChecked(this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_Recursion2").isChecked());
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("SCheck_Recursion2").setEnabled(false);
    }

    this.setCountTranslatedItems = function(summarytext) {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("CountOfItems").setText(summarytext);
    }

    this.setCountTranslatedWords = function(summarytext) {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("CountOfWords").setText(summarytext);
    }

    this.setCountTranslatedChars = function(summarytext) {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_SUMMARY]).getDialogElement("CountOfChars").setText(summarytext);
    }

    this.initDirectWrite = function() {
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_WriteToDB").setChecked(false);
        var eng = isDemoActivated ? getSelectedEngine(g_demoEngineIdx) : getSelectedEngine(this.dialog.getPage(PAGE_NUMBERS[PAGE_ENGINE_LIST]).getDialogElement("TranslationEngineOption").getSelectedIndex());
        this.dialog.getPage(PAGE_NUMBERS[PAGE_EXPORT_AND_TRANSLATE_PAGE]).getDialogElement("Check_WriteToDB").setEnabled(!(eng != null && eng.params.allowImport == "false"));
    }
}

function userdlg(tcheck) {

    var dlg = new userDialogWizard();
    var result = Dialogs.showDialog(dlg, Constants.DIALOG_TYPE_WIZARD_NONLINEAR, getString("TEXT2"));
    //Dialogs.MsgBox(result);

    if (result != null) {
        setGtcheck(result, tcheck);
        return true;
    } else {
        return false;
    }
}

function setGtcheck(result, tcheck) {
    /* Common for all export options */
    tcheck.nexportoption = result.exportOption;
    tcheck.ndatabase = result.checkDatabase;
    tcheck.ngroup = result.checkGroup;
    tcheck.nmodel = result.checkModel;
    tcheck.nobject = result.checkObject;
    tcheck.ncxn = result.checkCxn;
    tcheck.nshortcut = result.checkShortcut;
    tcheck.ntext = result.checkText;
    tcheck.nfontstyle = result.checkFontStyle;
    tcheck.bonlynotmaint = result.checkOnlyNotMaintained;
    tcheck.bexpand = result.checkExpand;
    tcheck.brecursive = result.checkRecursion;
    tcheck.nsourcelang = result.sourceLang;

    /* Export Only Options */
    tcheck.ntargetlang = result.targetLang;
    // only if source language <> target language then output of target language
    tcheck.bwithtarget = false;
    if (! (tcheck.nsourcelang == tcheck.ntargetlang)) {
        tcheck.bwithtarget = true;
    }

    /* Export and Translate Options */
    tcheck.ntranslationengine = result.translationEngine;
    tcheck.atargetlangs = result.targetLangs;
    tcheck.boverwrite = result.checkOverwrite;
    tcheck.bwritetodatabase = result.checkWriteToDB;
    tcheck.btranslationmode = result.checkTranslationMode;

    tcheck.bCanceledByUser = result.canceledByUser;
}

function getlanguages() {
    var olanguages = new Array();

    var olanguagelist = ArisData.getActiveDatabase().LanguageList();
    // get selected language (-> first entry in list)
    for (var  i = 0 ; i < olanguagelist.length ; i++ ) {
        if (olanguagelist[i].LocaleId() == g_nloc) {
            olanguages.push(olanguagelist[i]);
            break;
        }
    }
    // get all other languages
    for (var i = 0 ; i < olanguagelist.length ; i++ ) {
        if (olanguagelist[i].LocaleId() != g_nloc) {
            olanguages.push(olanguagelist[i]);
        }
        g_languages.arisLangs.put(olanguagelist[i].LocaleId(), olanguagelist[i]);
    }
    return olanguages;
}

function getlanguagename(olanguage) {
    //  return olanguage.Name(g_nloc);

    // TANR 241433
    var oLocaleInfo = olanguage.LocaleInfo()
    var oLocale = oLocaleInfo.getLocale();

    return oLocale.getDisplayName();
}

function getAllowedEngineNames() {
    var names = [];
    for(var e in g_engines){
        if (g_engines[e].allowed) {
            names.push(g_engines[e].name);
        }
    }
    return names;
}

function getSelectedEngine(index) {
    var counter = 0;
    for(var e in g_engines){        
        if (counter === index) {
            return g_engines[e];
        }
        counter++;        
    }
    return null;
}

function getDemoEngineIdx() {       
    var counter = 0;
    for(var e in g_engines){
        if (g_engines[e].id == "Demo") {            
                return counter;                        
        }
        counter++;
    }
    return null;
}

//IMPORT TRANSLATED VALUES TO DATABASE 
function importTranslatedAttributes() {
    if (B_ALLOW_DEBUG) writeMsgToDebug("\r\nStart IMPORT script.\r\n");

    var byteOutputObj = Context.getFile(Context.getSelectedFile(), Constants.LOCATION_OUTPUT);
    //only for testing purpose of import, here you can generate byte stream to debug log and copy/paste it to import script
    //if (B_ALLOW_DEBUG) writeMsgToDebug(byteOutputObj.join());
    
    var importConfig = createImportConfig();    
    //var report = Context.getComponent("Report");

    //getAnySelectedStartItems() is used only for creating reportInfo object. It is manadatory parameter. Script can be started only on some item.
    //Import translated attributes (core) = 612ff240-01c5-11ec-02b3-0a002700000f
    var reportInfo = report.createExecInfo("612ff240-01c5-11ec-02b3-0a002700000f", getSelectedItems().getAnySelectedStartItems(), g_tcheck.nsourcelang);
    reportInfo.setProperty ("pluginData", JSON.stringify(importConfig));
    reportInfo.setPropertyBytes ("byteOutput", byteOutputObj);
    reportInfo.setProperty ("command", "import_with_analyze");
    reportInfo.setProperty ("allow_debug", B_ALLOW_DEBUG);
    
    var reportResult =  report.execute(reportInfo);

    if (B_ALLOW_DEBUG) {     
        writeMsgToDebug("Debug output from IMPORT script :\r\n" + JSON.parse(reportResult.getProperty("debugOut")));
        writeMsgToDebug("JSON result after IMPORT : \r\n" + reportResult.getProperty("results"));                
    }
       
    var errObj = JSON.parse(reportResult.getProperty("errors"));
    writeMsgToERROR(errObj);
    
    //import result dialogs    
    var results = JSON.parse(reportResult.getProperty("results"));
    if (results != undefined) results.forEach(function(result, idx) {
        Dialogs.MsgBox(result.message, Constants.MSGBOX_BTN_OK, getString("TEXT54"));
    });
}

function createImportConfig() {
    return {
        srcLang: g_tcheck.nsourcelang,
        trgLangs: g_tcheck.atargetlangs,
        presentlangArr: [],
        btouch: false        
    };
}
