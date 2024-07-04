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
 
var nLoc = Context.getSelectedLanguage();
var oDB = ArisData.getActiveDatabase();
var oOut;

var filter = oDB.ActiveFilter();
var PROJECT = filter.AttrValueType(Constants.AT_SAP_FUNC_TYPE, Constants.AVT_SOLAR_PROJECT);
var FIORI_APPL = filter.AttrValueType(Constants.AT_SOLAR_TRANSACTION_TYPE, Constants.AVT_SM72_EXEC_FIORI);

var aData = selectData();
if (aData != null) {
    oOut = Context.createOutputObject();
    initOutput();
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    outHeader();    
    
    var syncProject = aData[0];
    var logComp     = aData[1];
    var url         = aData[2];

    var oScreenDefs = getScreenDefs(syncProject, logComp);
    for (var i in oScreenDefs) {
        var oScreenDef = oScreenDefs[i];
        var bResult = oScreenDef.Attribute(Constants.AT_EXT_1, nLoc).setValue(url);

        outData(oScreenDef, bResult)
    }    
    oOut.EndTable(getString("PROTOCOL"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOut.WriteReport();  
}

/************************************************************************************************************************************/

function getProjectDefs() {
    var searchItem  = getSearchItem(Constants.AT_SAP_FUNC_TYPE, PROJECT);                   // SAP function type = 'Project'
    var searchItem2 = getSearchItem(Constants.AT_SOLAR_ORIGIN, null);                       // Synchronization project maintained
    var oProjectDefs = oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_FUNC], searchItem.and(searchItem2));   
    return ArisData.sort(oProjectDefs, Constants.AT_NAME, nLoc);
}

function getScreenDefs(syncProject, logComp) {
    var searchItem  = getSearchItem(Constants.AT_SOLAR_TRANSACTION_TYPE, FIORI_APPL);       // Transaction type = 'Fiori Application'
    var searchItem2 = getSearchItem(Constants.AT_SOLAR_ORIGIN, syncProject);                // Synchronization project = <syncProject>
    searchItem = searchItem.and(searchItem2);
    
    if (logComp != null) {
        var searchItem3 = getSearchItem(Constants.AT_SOLAR_SAP_COMPONENT, logComp);         // SAP component = <logComp>
        searchItem = searchItem.and(searchItem3);
    }
    var oScreenDefs = oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_SCRN], searchItem);
    return ArisData.sort(oScreenDefs, Constants.AT_NAME, nLoc);
}

function getSearchItem(nAttrType, sAttrValue) {
    if (sAttrValue == null) {
        return oDB.createSearchItem(nAttrType, nLoc, true/*bExistence*/);
    }
    return oDB.createSearchItem(nAttrType, nLoc, sAttrValue, Constants.SEARCH_CMP_EQUAL, true/*bCaseSensitive*/, false/*bAllowWildcards*/);
}

/************************************************************************************************************************************/
// Dialog

function selectData() {
    return Dialogs.showDialog(new myDialog(), Constants.DIALOG_TYPE_ACTION, getString("DLG_TITLE"));    
    
    function myDialog() {
        var bDialogOk = true;
        
        var oProjectDefs = getProjectDefs();
        var aLogComps = [];

        this.getPages = function() {
            var iDialogTemplate = Dialogs.createNewDialogTemplate(450, 100, "");
            
            iDialogTemplate.Text(10, 13, 190, 15, getString("DLG_BRANCHID"));  
            iDialogTemplate.ComboBox(200, 10, 250, 21, [], "COMBOBOX_BRANCH");
            iDialogTemplate.Text(10, 43, 190, 15, getString("DLG_LOGCOMP"));  
            iDialogTemplate.ComboBox(200, 40, 250, 21, [], "COMBOBOX_LOGCOMP");
            iDialogTemplate.Text(10, 73, 190, 15, getString("DLG_URL"));  
            iDialogTemplate.TextBox(200, 70, 250, 21, "TEXTBOX_URL");
            iDialogTemplate.HelpButton("HID_b26d9300-7b91-11e8-6435-f48e38b51809_dlg.hlp");
            return [iDialogTemplate];
        }

        this.init = function(aPages) {
            var page = aPages[0];
            
            var aBranchIDs = getBranchIDs();
            if (aBranchIDs.length > 0) {
                var branchIdx = 0;
                page.getDialogElement("COMBOBOX_BRANCH").setItems(aBranchIDs);
                page.getDialogElement("COMBOBOX_BRANCH").setSelection(branchIdx);
                
                aLogComps = getLogicalComponents(oProjectDefs[branchIdx]);
                page.getDialogElement("COMBOBOX_LOGCOMP").setItems(aLogComps);
                page.getDialogElement("COMBOBOX_LOGCOMP").setSelection(0);      // Preselect index (to ensure that 'getSelectedIndex()' below returns a valid result)                
            }
        }

        this.isInValidState = function(pageNumber) {
            var page = this.dialog.getPage(pageNumber);
            return page.getDialogElement("COMBOBOX_LOGCOMP").getItems().length > 0
                && page.getDialogElement("COMBOBOX_LOGCOMP").getItems().length > 0
                && page.getDialogElement("TEXTBOX_URL").getText() != "";
        }
        
        this.COMBOBOX_BRANCH_selChanged = function() {
            var page = this.dialog.getPage(0);
            var branchIdx = page.getDialogElement("COMBOBOX_BRANCH").getSelectedIndex();
            
            aLogComps = getLogicalComponents(oProjectDefs[branchIdx]);
            page.getDialogElement("COMBOBOX_LOGCOMP").setItems(aLogComps);
        }        
        
        this.onClose = function(pageNumber, bOk) {
            bDialogOk = bOk;
        }        

        this.getResult = function() {       
            if (bDialogOk) {
                var page = this.dialog.getPage(0);
                
                var branchIdx = page.getDialogElement("COMBOBOX_BRANCH").getSelectedIndex();
                var syncProject = getSyncProject(oProjectDefs[branchIdx]);
                
                var logCompIdx = page.getDialogElement("COMBOBOX_LOGCOMP").getSelectedIndex();
                var logComp = aLogComps[logCompIdx]; 
                
                var url = page.getDialogElement("TEXTBOX_URL").getText();
                
                return [syncProject, logComp, url];
            }
            return null;            
        }
        
        function getBranchIDs() {
            var aProjectNames = new Array();
            for (var i in oProjectDefs) {
                aProjectNames.push(oProjectDefs[i].Attribute(Constants.AT_NAME, nLoc).getValue());
            }
            return aProjectNames;
        }
        
        function getSyncProject(oProjectDef) {
            return oProjectDef.Attribute(Constants.AT_SOLAR_ORIGIN, nLoc).getValue();
        }
        
        function getLogicalComponents(oProjectDef) {    
            var syncProject = getSyncProject(oProjectDef);
            var oScreenDefs = getScreenDefs(syncProject, null);
            
            var setLogComps = new java.util.HashSet();
            for (var i in oScreenDefs) {
                setLogComps.add(oScreenDefs[i].Attribute(Constants.AT_SOLAR_SAP_COMPONENT, nLoc).getValue());
            }
            var aLogComps = new Array();
            var iter = setLogComps.iterator();
            while (iter.hasNext()) {
                aLogComps.push(iter.next());
            }    
            return aLogComps;
        }
    }
}

/************************************************************************************************************************************/
// Output

function initOutput() {
    oOut.DefineF("HEAD", getString("FONT"), 10, Constants.C_BLACK, Constants.C_GREY_80_PERCENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("STD",  getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("RED",  getString("FONT"), 10, Constants.C_RED, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
}

function outHeader() {
    oOut.TableRow();
    oOut.TableCellF(getString("OBJECT_NAME"),     80, "HEAD");
    oOut.TableCellF(getString("OBJECT_SEARCHID"), 50, "HEAD");
    oOut.TableCellF(getString("RESULT"),          20, "HEAD");
}

function outData(oItem, bResult) {
    var styleSheet = bResult ? "STD" : "RED";
    oOut.TableRow();
    oOut.TableCellF(outName(oItem),     80, styleSheet);
    oOut.TableCellF(outSearchID(oItem), 50, styleSheet);
    oOut.TableCellF(outResult(bResult), 20, styleSheet);

    function outName(oItem)     { return oItem.Name(nLoc) }
    function outSearchID(oItem) { return "$$w id=" + oItem.GUID() }
    function outResult(bResult) { return bResult ? getString("SUCCESSFUL") : getString("FAILED") }
}
