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
 
var DATA = function(itemGuid, sStatus, sText) {
    this.itemGuid = itemGuid;
    this.sStatus  = sStatus; 
    this.sText    = sText;
} 

var nLoc = Context.getSelectedLanguage();
var oDB = ArisData.getActiveDatabase();

var oOut = Context.createOutputObject();
oOut.DefineF("HEAD", getString("FONT"), 10, Constants.C_BLACK, Constants.C_GREY_80_PERCENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
oOut.DefineF("STD", getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
oOut.DefineF("RED", getString("FONT"), 10, Constants.C_RED, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);

main();

oOut.EndTable(getString("PROTOCOL"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
oOut.WriteReport();

/**************************************************************************************************************************/

function main() {
    var dataString = Context.getProperty("data");
    if (dataString == null) {
        Context.setProperty(Constants.PROPERTY_SHOW_OUTPUT_FILE, false)
        Context.setProperty(Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false)
        return;
    }
    
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    outHeader();
    
    var aData = getData(dataString);
    for (var i in aData) {
        
        outItem(aData[i]);
    }
}

function getData(dataString) {
    var aData = new Array();
    
    var aDataTxt = dataString.split("###");
    for (var i in aDataTxt) {
        var sRow = aDataTxt[i];
        var aRow = sRow.split("+++");
        
        var itemGuid = aRow[0];
        var sStatus  = aRow[1];
        var sText    = aRow[2];        
        
        aData.push(new DATA(itemGuid, sStatus, sText));
    }
    return aData;
}

function outHeader() {
    oOut.TableRow();
    oOut.TableCellF(getString("NAME"),   50, "HEAD");
    oOut.TableCellF(getString("TYPE"),   40, "HEAD");
    oOut.TableCellF(getString("GUID"),   40, "HEAD");
    oOut.TableCellF(getString("PATH"),   50, "HEAD");
    oOut.TableCellF(getString("STATUS"), 15, "HEAD");
    oOut.TableCellF(getString("TEXT"),  100, "HEAD");      
}

function outItem(data) {
    //status: UPDATED, SKIPPED, ERROR
    
    var sGuid = data.itemGuid;
    var sName = getString("UNKNOWN");
    var sType = getString("UNKNOWN");
    var sPath = getString("UNKNOWN");

    var item = oDB.FindGUID(sGuid);
    if (item.IsValid()) {
        sName = item.Name(nLoc);
        sType = formatstring2("@1 (@2)", item.Type(), item.TypeNum());
        sPath = item.Group().Path(nLoc);
    }
    
    oOut.TableRow();
    oOut.TableCellF(sName,         50, getStyleSheet());
    oOut.TableCellF(sType,         40, getStyleSheet());
    oOut.TableCellF(sGuid,         40, getStyleSheet());
    oOut.TableCellF(sPath,         50, getStyleSheet());
    oOut.TableCellF(outStatus(),   15, getStyleSheet());      
    oOut.TableCellF(data.sText,   100, getStyleSheet()); 

    function getStyleSheet() {
        if (StrComp(data.sStatus, "ERROR") == 0) return "RED";
        return "STD";
    }
    
    function outStatus() {
        if (StrComp(data.sStatus, "ERROR") == 0)   return getString("STATUS_ERROR");
        if (StrComp(data.sStatus, "SKIPPED") == 0) return getString("STATUS_SKIPPED");
        if (StrComp(data.sStatus, "UPDATED") == 0) return getString("STATUS_UPDATED");
        return "";
    }
}