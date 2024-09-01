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
 
const COMP_REPORT   = 1;
const COMP_MACRO    = 7;
const COMP_SEMCHECK = 3;

var nLoc = Context.getSelectedLanguage();
var oOut = Context.createOutputObject();

var scriptAdmin = Context.getComponent("ScriptAdmin");

outScripts(COMP_REPORT, getString("REPORTS"));
outScripts(COMP_MACRO, getString("MACROS"));
outScripts(COMP_SEMCHECK, getString("SEMANTICCHECKS"));

oOut.WriteReport();  

/*************************************************************************/  

function outScripts(componentID, componentName) {
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    outHead();

    var bColored = false;
    
    var aCategories = scriptAdmin.getCategories(componentID, nLoc).sort(sortCategory);
    for (var i in aCategories) {
        var category = aCategories[i];
        var aScriptInfos = scriptAdmin.getScriptInfos(componentID, category.getCategoryID(), nLoc).sort(sortName);
        if (aScriptInfos.length > 0) {
            var bFirst = true;

            for (var j in aScriptInfos) {
                var scriptInfo = aScriptInfos[j];
                if (scriptInfo.isSimpleFile()) continue;

                outScript(getCategoryName(category), scriptInfo, bColored, bFirst);
                bFirst = false;
            }
            bColored = !bColored;
        }
    }
    oOut.EndTable(componentName, 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
    
    function getCategoryName(category) {
        if (componentID == COMP_SEMCHECK) {
            if (category.getCategoryID() == "9b676eb9-ec3d-4b53-b508-a62475f4d433") return getString("RULETYPES");
            if (category.getCategoryID() == "54e057ed-80b1-4521-9545-6496bcd27cd1") return getString("PROFILES");        
        }
        return category.getName();
    }
}

function outScript(sCategoryName, scriptInfo, bColored, bFirst) {
    var bgColor = bColored ? RGB( 220, 230, 241) : Constants.C_TRANSPARENT;
    var catColor = bFirst ? Constants.C_BLACK : Constants.C_GREY_80_PERCENT;

    oOut.TableRow();
    oOut.TableCell(sCategoryName, 50, getString("FONT"), 10, catColor, bgColor, 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
    oOut.TableCell(scriptInfo.getID(), 40, getString("FONT"), 10, Constants.C_BLACK, bgColor, 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
    oOut.TableCell(scriptInfo.getName(), 50, getString("FONT"), 10, Constants.C_BLACK, bgColor, 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
    oOut.TableCell(scriptInfo.getDescription(), 100, getString("FONT"), 10, Constants.C_BLACK, bgColor, 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
}

function outHead() {
    var bgColor = RGB( 54, 96, 146);

    oOut.TableRow();
    oOut.TableCell(getString("CATEGORY"), 50, getString("FONT"), 10, Constants.C_WHITE, bgColor, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
    oOut.TableCell(getString("IDENTIFIER"), 40, getString("FONT"), 10, Constants.C_WHITE, bgColor, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
    oOut.TableCell(getString("NAME"), 50, getString("FONT"), 10, Constants.C_WHITE, bgColor, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
    oOut.TableCell(getString("DESCRIPTION"), 100, getString("FONT"), 10, Constants.C_WHITE, bgColor, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
}

function RGB(r, g, b) {
	return (new java.awt.Color(r/255.0,g/255.0,b/255.0,1)).getRGB();
}

function sortName(a, b) {
    return StrComp(a.getName(), b.getName());
}
function sortCategory(a, b) {
    var result = sortName(a, b);
    if (result == 0) result = -1 * StrComp(a.getCategoryID(), b.getCategoryID()); // -1 to sort semchecks in expected order: 1. rule types, 2. profiles
    return result;
}