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

// BLUE-17650 - Import/Usage of 'convertertools.js' removed 

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed" 

// Type declaration
function tComponenType(sName, sRelease, sFullName, bInBrackets) {
    this.sName = sName;
    this.sRelease = sRelease;
    this.sFullName = sFullName;
    this.bInBrackets = bInBrackets;
    return this;
}

function tCompListType(sEntry, bSelected, tComponent) {
	this.sEntry = sEntry;
	this.bSelected = bSelected;
	this.tComponent = tComponent;
    return this;
}

function tScenarioType(oObjDef, tCompList) {
	this.oObjDef = oObjDef;
	this.tCompList = tCompList;
    return this;
}

// Const declaration
var c_sSep_List     = "|";      // Separator: Component lists (|)
var c_sSep_Comp     = ";";      // Separator: Components in list (;)
var c_sSep_Bracket  = "(";      // Separator: Left bracket (()
var c_sSep_Rel1     = ".";      // Separator: Release versions (.)
var c_sSep_Rel2     = "X";      // Separator: Release versions (X)
var c_sSep_Rel3     = " ";      // Separator: Release versions (Blank)
var c_sSep_Name     = " ";      // Separator: Component name and release ( )
var c_sMark         = "x"; 

var g_nLoc = Context.getSelectedLanguage();

function main() {

    var tScenario = new Array();
    init_getscenariocomponents(ArisData.getSelectedObjDefs(), new __holder(tScenario));

    var tNeededComponents = new Array();
    phase1_getbasecomponents(new __holder(tNeededComponents), new __holder(tScenario));
    phase2_getneededcomponents(new __holder(tNeededComponents), new __holder(tScenario));

    out_writescenarios(tScenario);
    out_writeneededcomponents(tNeededComponents);

    out_outputtable(tNeededComponents, tScenario);
}

function init_getscenariocomponents(oObjDefList, tScenario_Holder) {

    for (var i = 0 ; i < oObjDefList.length ; i++ ){
        var oObjDef = oObjDefList[i];
        var oAttribute = oObjDef.Attribute(Constants.AT_SOLAR_SAP_COMPONENT, g_nLoc);
        
        if (oAttribute.IsMaintained()) {
            var tNewScenario = new tScenarioType(oObjDef, new Array())          
            init_getcomponentlists(oAttribute, new __holder(tNewScenario));
            
            tScenario_Holder.value[tScenario_Holder.value.length] = tNewScenario;
        } else {
            Context.writeOutput(formatstring1(getString("TEXT_1"), oObjDef.Name(g_nLoc)));
        }
    }
}

function init_getcomponentlists(oAttribute, tCurrScenario_Holder) {
    
    var sAttrValue = ""+oAttribute.GetValue(false);
    var nPos = sAttrValue.indexOf(c_sSep_List);
    var sComponentList = "";
    
    while (nPos >= 0) {
        // Separator found
        sComponentList = doTrim(sAttrValue.substr(0, nPos));        
        init_getcurrentcomponentlist(sComponentList, tCurrScenario_Holder);
        
        sAttrValue = sAttrValue.substr(nPos + 1);
        nPos = sAttrValue.indexOf(c_sSep_List);
    }
    // Last component list
    if (sAttrValue != "") {
        sComponentList = doTrim(sAttrValue);        
        init_getcurrentcomponentlist(sComponentList, tCurrScenario_Holder);
    }
}

function init_getcurrentcomponentlist(sComponentList, tCurrScenario_Holder) {
    
    if (sComponentList != "") {
        var tNewCompList = new tCompListType(sComponentList, false, new Array());        
        init_getcomponents(sComponentList, new __holder(tNewCompList));

        tCurrScenario_Holder.value.tCompList[tCurrScenario_Holder.value.tCompList.length] = tNewCompList;
    }
}

function init_getcomponents(sComponentList, tCurrCompList_Holder) {

    var nPos = sComponentList.indexOf(c_sSep_Comp);
    var sComponent = ""; 
    
    while (nPos >= 0) {
        // Separator found
        sComponent = doTrim(sComponentList.substr(0, nPos));       
        init_getcurrentcomponent(sComponent, tCurrCompList_Holder);
        
        sComponentList = sComponentList.substr(nPos + 1);
        nPos = sComponentList.indexOf(c_sSep_Comp);
    }
    // Last component
    if (sComponentList != "") {
        sComponent = doTrim(sComponentList);        
        init_getcurrentcomponent(sComponent, tCurrCompList_Holder);
    }
}

function init_getcurrentcomponent(sComponent, tCurrCompList_Holder) {
  
    if (sComponent != "") {
        var tNewComponent = new tComponenType("", "", "", false);        
        init_getnameandrelease(sComponent, new __holder(tNewComponent));
        
        tCurrCompList_Holder.value.tComponent[tCurrCompList_Holder.value.tComponent.length] = tNewComponent;
    }
}

function init_getnameandrelease(p_sComponent, tCurrComponent_Holder) {

    var sComponent = p_sComponent;
    var bNameReleaseOk = false;
    var bInBrackets = false; 
    
    var nPosBracket = sComponent.lastIndexOf(c_sSep_Bracket);
    if (nPosBracket >= 0) {
        sComponent = doTrim(sComponent.substr(0, nPosBracket));
        bInBrackets = true;
    }
    
    var nPos3 = sComponent.lastIndexOf(c_sSep_Rel1);
    if (nPos3 == -1) {
        nPos3 = sComponent.lastIndexOf(c_sSep_Rel2);
    }
    
    if (nPos3 >= 0) {
        var sName = doTrim(sComponent.substr(0, nPos3));
        
        var nPos4 = sName.lastIndexOf(c_sSep_Name);
        if (nPos4 >= 0) {
          tCurrComponent_Holder.value.sName = doTrim(sName.substr(0, nPos4));
          tCurrComponent_Holder.value.sRelease = doTrim(sComponent.substr(nPos4 + 1));
          tCurrComponent_Holder.value.sFullName = p_sComponent;
          tCurrComponent_Holder.value.bInBrackets = bInBrackets;
        
          bNameReleaseOk = true;
        }
    } else {
        nPos3 = sComponent.lastIndexOf(c_sSep_Rel3);
        if (nPos3 >= 0) {        
            tCurrComponent_Holder.value.sName = doTrim(sComponent.substr(0, nPos3));
            tCurrComponent_Holder.value.sRelease = doTrim(sComponent.substr(nPos3 + 1));
            tCurrComponent_Holder.value.sFullName = p_sComponent;
            tCurrComponent_Holder.value.bInBrackets = bInBrackets;
        
            bNameReleaseOk = true;
        }
    }
    
    if (! (bNameReleaseOk == true)) {
        tCurrComponent_Holder.value.sName = p_sComponent;
        Context.writeOutput(formatstring1(getString("TEXT_2"), sComponent));
    }
}

function phase1_getbasecomponents(tNeededComponents_Holder, tScenario_Holder) {
    
    for (var i = 0 ; i < tScenario_Holder.value.length ; i++ ){
        
        if (tScenario_Holder.value[i].tCompList.length > 0) {
            for (var m = 0 ; m < tScenario_Holder.value[i].tCompList[0].tComponent.length ; m++ ){
            
                // Get reference component
                var sRefName = tScenario_Holder.value[i].tCompList[0].tComponent[m].sName;
                var sRefRelease = tScenario_Holder.value[i].tCompList[0].tComponent[m].sRelease;
                var bAddComponent = true;
                
                // Compare current ref component with components in other component lists of the same scenario
                for (var j = 1 ; j < tScenario_Holder.value[i].tCompList.length ; j++ ){
                
                    var bFoundComponent = false;
                    for (var k = 0 ; k < tScenario_Holder.value[i].tCompList[j].tComponent.length ; k++ ){
                    
                        if (StrComp(sRefName, tScenario_Holder.value[i].tCompList[j].tComponent[k].sName) == 0) {
                            
                            if (common_isnewerrelease(sRefRelease, tScenario_Holder.value[i].tCompList[j].tComponent[k].sRelease)) {
                                // Get the older release
                                sRefRelease = tScenario_Holder.value[i].tCompList[j].tComponent[k].sRelease;
                            }
                            bFoundComponent = true;
                            break;
                        }
                    }

                    if (! (bFoundComponent)) {
                        bAddComponent = false;
                        break;
                    }
                }
                
                if (bAddComponent) {
                    common_addneededcomponent(tNeededComponents_Holder, sRefName, sRefRelease);
                }
            }
        }
        // Scenario has only one component list
        else {
            // Add all components of this component list
            common_addneededcomponentsofcomplist(tNeededComponents_Holder, tScenario_Holder.value[i].tCompList[0]);
            
            tScenario_Holder.value[i].tCompList[0].bSelected = true;           // Set marker
        }
    }
}

function phase2_getneededcomponents(tNeededComponents_Holder, tScenario_Holder) {

    var nIndex_Ref = 0; 

    var nCountComp_Ref_Holder = new __holder(0); 
    var nCountName_Ref_Holder = new __holder(0); 
    var nCountRelease_Ref_Holder = new __holder(0); 
    var nCountComp_New_Holder = new __holder(0); 
    var nCountName_New_Holder = new __holder(0); 
    var nCountRelease_New_Holder = new __holder(0); 
    
    for (var i = 0 ; i < tScenario_Holder.value.length ; i++ ){   
        // Only scenarios with more than one component list
        if (tScenario_Holder.value[i].tCompList.length > 0) {
            
            nIndex_Ref = 0;
            // first component list
            phase2_getcomponentdiff(tNeededComponents_Holder.value, 
                                    tScenario_Holder.value[i].tCompList[nIndex_Ref], 
                                    nCountComp_Ref_Holder, 
                                    nCountName_Ref_Holder, 
                                    nCountRelease_Ref_Holder);
            
            for (var j = 1 ; j < tScenario_Holder.value[i].tCompList.length ; j++ ){
                // other component lists
                phase2_getcomponentdiff(tNeededComponents_Holder.value, 
                                        tScenario_Holder.value[i].tCompList[j], 
                                        nCountComp_New_Holder, 
                                        nCountName_New_Holder, 
                                        nCountRelease_New_Holder);
                
                if ((nCountName_New_Holder.value < nCountName_Ref_Holder.value) || 
                   ((nCountName_New_Holder.value == nCountName_Ref_Holder.value) && (nCountRelease_New_Holder.value < nCountRelease_Ref_Holder.value)) || 
                   (((nCountName_New_Holder.value == nCountName_Ref_Holder.value) && (nCountRelease_New_Holder.value == nCountRelease_Ref_Holder.value)) && (nCountComp_New_Holder.value < nCountComp_Ref_Holder.value))) {
                
                    nIndex_Ref = j;
                    nCountComp_Ref_Holder.value = nCountComp_New_Holder.value;
                    nCountName_Ref_Holder.value = nCountName_New_Holder.value;
                    nCountRelease_Ref_Holder.value = nCountRelease_New_Holder.value;
                }
            }
        
            // Add all components of this component list
            common_addneededcomponentsofcomplist(tNeededComponents_Holder, tScenario_Holder.value[i].tCompList[nIndex_Ref]);
            
            tScenario_Holder.value[i].tCompList[nIndex_Ref].bSelected = true;       // Set marker
        }
    }
}

function phase2_getcomponentdiff(tNeededComponents, tCurrCompList, nCountComp_Holder, nCountName_Holder, nCountRelease_Holder) {

    var nIndex_Holder = new __holder(0); 
    
    // Init !!!
    nCountName_Holder.value = 0;
    nCountRelease_Holder.value = 0;
    nCountComp_Holder.value = tCurrCompList.tComponent.length;
    
    for (var i = 0 ; i < nCountComp_Holder.value ; i++ ){
        var sName = tCurrCompList.tComponent[i].sName;
        
        if (common_iscomponentinlist(sName, tNeededComponents, nIndex_Holder)) {
            var sRelease = tCurrCompList.tComponent[i].sRelease;
            
            if (common_isnewerrelease(sRelease, tNeededComponents[nIndex_Holder.value].sRelease)) {
                nCountRelease_Holder.value = nCountRelease_Holder.value + 1;
            }
        } else {
            nCountName_Holder.value = nCountName_Holder.value + 1;
        }
    }
}

function common_addneededcomponentsofcomplist(tNeededComponents_Holder, tCurrCompList) {

    for (var i = 0 ; i < tCurrCompList.tComponent.length ; i++ ){
    // Add all components of this component list
        common_addneededcomponent(tNeededComponents_Holder, tCurrCompList.tComponent[i].sName, tCurrCompList.tComponent[i].sRelease);
    }
}

function common_addneededcomponent(tNeededComponents_Holder, sName, sRelease) {

    var bNewComponent = true;
    
    for (var i = 0 ; i < tNeededComponents_Holder.value.length ; i++ ){
        
        if (StrComp(sName, tNeededComponents_Holder.value[i].sName) == 0) {
        
            if (common_isnewerrelease(sRelease, tNeededComponents_Holder.value[i].sRelease)) {
            
                tNeededComponents_Holder.value[i].sRelease = sRelease;
            }
            bNewComponent = false;
            break;
        }
    }

    if (bNewComponent) {
        
        var tNewComponent = new tComponenType(sName, sRelease, "", false);        
        tNeededComponents_Holder.value[tNeededComponents_Holder.value.length] = tNewComponent;
    }
}

function common_isnewerrelease(sReleaseA, sReleaseB) {
       
    var sReleaseA1_Holder = new __holder(""); 
    var sReleaseA2_Holder = new __holder(""); 
    var sReleaseB1_Holder = new __holder(""); 
    var sReleaseB2_Holder = new __holder(""); 
    
    common_splitreleaseversion(sReleaseA, sReleaseA1_Holder, sReleaseA2_Holder);
    common_splitreleaseversion(sReleaseB, sReleaseB1_Holder, sReleaseB2_Holder);
    
    if (StrComp(sReleaseA1_Holder.value, sReleaseB1_Holder.value) > 0 || 
           (StrComp(sReleaseA1_Holder.value, sReleaseB1_Holder.value) == 0 && 
            StrComp(sReleaseA2_Holder.value, sReleaseB2_Holder.value) > 0)) {
    
        return true;
    } else {
        return false;
    }
}

function common_splitreleaseversion(sRelease, sRelease1_Holder, sRelease2_Holder) {

    var nPos3 = sRelease.lastIndexOf(c_sSep_Rel1);
    if (nPos3 == -1) {
        nPos3 = sRelease.lastIndexOf(c_sSep_Rel2);
    }
    
    if (nPos3 >= 0) {
        sRelease1_Holder.value = doTrim(sRelease.substr(0, nPos3));
        sRelease2_Holder.value = doTrim(sRelease.substr(nPos3 + 1));
    } else {
        sRelease1_Holder.value = sRelease;
        sRelease2_Holder.value = "";
    }
}

function common_iscomponentinlist(sName, tComponents, nIndex_Holder) {

    var __functionResult = false;
    
    for (var i = 0 ; i < tComponents.length ; i++ ){
    
        if (StrComp(sName, tComponents[i].sName) == 0) {
        
          __functionResult = true;
          nIndex_Holder.value = i;
          break;
        }
    }
    return __functionResult;
}

function out_writescenarios(tScenario) {

    for (var i = 0 ; i < tScenario.length ; i++ ){
        Context.writeOutput("");
        Context.writeOutput(tScenario[i].oObjDef.Name(g_nLoc) + ":");
        
        for (var j = 0 ; j < tScenario[i].tCompList.length ; j++ ){
            var sOut = "   " + tScenario[i].tCompList[j].sEntry;
            if (tScenario[i].tCompList[j].bSelected == true) {
              sOut = sOut + "   " + "(x)";
            }
            Context.writeOutput(sOut);
        }
    }
}

function out_writeneededcomponents(tNeededComponents) {

    if (tNeededComponents.length > 0 && tNeededComponents[0].sName != "") {
        Context.writeOutput("");
        Context.writeOutput(getString("TEXT_3"));
        
        var sOut = "";
        for (var i = 0 ; i < tNeededComponents.length ; i++ ){
            sOut = sOut + tNeededComponents[i].sName + c_sSep_Name + tNeededComponents[i].sRelease;
            if (i < tNeededComponents.length-1) {
                sOut = sOut + c_sSep_Comp + " ";
            }
        }
        Context.writeOutput(sOut);
        Context.writeOutput("");
    }
}

function out_outputtable(tNeededComponents, tScenario) {
    
    var nIndex_Holder = new __holder(0); 
    var sOut = ""; 
    var sSheetText = ""; 
    
    if (tScenario.length > 0) {
        var nRowWidth = parseInt(100 / (tNeededComponents.length + 1));
        
        var oOutFile = Context.createOutputObject(Context.getSelectedFormat(), Context.getSelectedFile());
        oOutFile.Init(g_nLoc);
        
        if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX ) {
            out_outputexcelcover(oOutFile);         // Output cover sheet
        } else {
            out_outputheaderfooter(oOutFile);       // Output header and footer
        }
        
        oOutFile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        oOutFile.TableRow();
        oOutFile.TableCell("", nRowWidth, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        
        for (var k = 0 ; k < tNeededComponents.length ; k++ ){
          sOut = tNeededComponents[k].sName + c_sSep_Name + tNeededComponents[k].sRelease;
          oOutFile.TableCell(sOut, nRowWidth, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
        }
        
        for (var i = 0 ; i < tScenario.length ; i++ ){
            oOutFile.TableRow();
            oOutFile.TableCell(tScenario[i].oObjDef.Name(g_nLoc), nRowWidth, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            
            for (var j = 0 ; j < tScenario[i].tCompList.length ; j++ ){
                
                if (tScenario[i].tCompList[j].bSelected) {
                    for (var k = 0 ; k < tNeededComponents.length ; k++ ){
                    
                        if (common_iscomponentinlist(tNeededComponents[k].sName, tScenario[i].tCompList[j].tComponent, nIndex_Holder)) {
                            
                            sOut = c_sMark;
                            
                            if (common_isnewerrelease(tNeededComponents[k].sRelease, tScenario[i].tCompList[j].tComponent[nIndex_Holder.value].sRelease) || tNeededComponents[k].bInBrackets) {
                                sOut = sOut + "   [" + tScenario[i].tCompList[j].tComponent[nIndex_Holder.value].sFullName + "]";
                            }
                            oOutFile.TableCell(sOut, nRowWidth, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
                        } else {
                            oOutFile.TableCell("", nRowWidth, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
                        }
                    }
                }
            }
        }
        if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) {
            sSheetText = getString("TEXT_5");
        }
        oOutFile.EndTable(sSheetText, 100, getString("TEXT_4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);        
        oOutFile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
    } else {
        Dialogs.MsgBox(getString("TEXT_6"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, getString("TEXT_5"));
        Context.setScriptError(Constants.ERR_NOFILECREATED);
    }
}

function out_outputexcelcover(oOutFile) {

    oOutFile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    oOutFile.TableRow();
    oOutFile.TableCell("", 50, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOutFile.TableCell("", 50, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOutFile.TableRow();
    oOutFile.TableCell(Context.getScriptInfo(Constants.SCRIPT_TITLE), 50, getString("TEXT_4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOutFile.TableCell("", 50, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
    oOutFile.TableRow();
    oOutFile.TableCell(getString("TEXT_7"), 50, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOutFile.TableCell(ArisData.getActiveDatabase().ServerName(), 50, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOutFile.TableRow();
    oOutFile.TableCell(getString("TEXT_8"), 50, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOutFile.TableCell(ArisData.getActiveDatabase().Name(g_nLoc), 50, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOutFile.TableRow();
    oOutFile.TableCell(getString("TEXT_9"), 50, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOutFile.TableCell(ArisData.getActiveUser().Name(g_nLoc), 50, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOutFile.TableRow();
    oOutFile.TableCell(getString("TEXT_10"), 50, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOutFile.TableCell("", 50, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VCENTER, 0);
    oOutFile.OutputField(Constants.FIELD_DATE, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT);
    oOutFile.Output(" ", getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    oOutFile.OutputField(Constants.FIELD_TIME, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT);
    oOutFile.EndTable(getString("TEXT_11"), 100, getString("TEXT_4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}

function out_outputheaderfooter(oOutFile){
    
    oOutFile.DefineF("REPORT1", getString("TEXT_4"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
    oOutFile.DefineF("REPORT2", getString("TEXT_4"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    
    // BLUE-17783 Update report header/footer
    var borderColor = getColorByRGB( 23, 118, 191);
    
    // graphics used in header
    var pictleft  = Context.createPicture(Constants.IMAGE_LOGO_LEFT);
    var pictright = Context.createPicture(Constants.IMAGE_LOGO_RIGHT);
    
    // Header + footer
    setFrameStyle(oOutFile, Constants.FRAME_BOTTOM);    
    oOutFile.BeginHeader();
    oOutFile.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    oOutFile.TableRow();
    oOutFile.TableCell("", 26, getString("TEXT_4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    oOutFile.OutGraphic(pictleft, - 1, 40, 15);
    oOutFile.TableCell(Context.getScriptInfo(Constants.SCRIPT_TITLE), 48, getString("TEXT_4"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    oOutFile.TableCell("", 26, getString("TEXT_4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    oOutFile.OutGraphic(pictright, - 1, 40, 15);
    oOutFile.EndTable("", 100, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOutFile.EndHeader();
    
	setFrameStyle(oOutFile, Constants.FRAME_TOP);
    oOutFile.BeginFooter();
    oOutFile.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    oOutFile.TableRow();
    oOutFile.TableCell("" + (new __date()) + " " + (new __time()), 26, getString("TEXT_4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    oOutFile.TableCell(Context.getSelectedFile(), 48, getString("TEXT_4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    oOutFile.TableCell("", 26, getString("TEXT_4"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    oOutFile.Output(getString("TEXT_12"), getString("TEXT_4"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
    oOutFile.OutputField(Constants.FIELD_PAGE, getString("TEXT_4"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
    oOutFile.Output(getString("TEXT_13"), getString("TEXT_4"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
    oOutFile.OutputField(Constants.FIELD_NUMPAGES, getString("TEXT_4"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
    oOutFile.EndTable("", 100, getString("TEXT_4"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOutFile.EndFooter();
    
	oOutFile.ResetFrameStyle();
    
    // Headline
    oOutFile.OutputLnF("", "REPORT1");
    oOutFile.OutputLnF(getString("TEXT_14"), "REPORT1");
    oOutFile.OutputLnF("", "REPORT1");
    
    // Information header.
    oOutFile.OutputLnF((getString("TEXT_7") + ArisData.getActiveDatabase().ServerName()), "REPORT2");
    oOutFile.OutputLnF((getString("TEXT_8") + ArisData.getActiveDatabase().Name(g_nLoc)), "REPORT2");
    oOutFile.OutputLnF((getString("TEXT_9") + ArisData.getActiveUser().Name(g_nLoc)), "REPORT2");
    oOutFile.OutputLnF("", "REPORT2");
    
    function setFrameStyle(outfile, iFrame) { 
        outfile.SetFrameStyle(Constants.FRAME_TOP, 0); 
        outfile.SetFrameStyle(Constants.FRAME_LEFT, 0); 
        outfile.SetFrameStyle(Constants.FRAME_RIGHT, 0); 
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 0);
        
        outfile.SetFrameStyle(iFrame, 50, Constants.BRDR_NORMAL);
    }    
}

function doTrim(string) {
    var javaStr = new java.lang.String(string);
    javaStr = javaStr.trim();
    return ""+javaStr;  // return javascript string
}


main();
