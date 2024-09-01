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
 
var PROTOCOL = function(srcGuid, trgGuid, sStatus, sText) {
    this.srcGuid = srcGuid;
    this.trgGuid = trgGuid;
    this.sStatus = sStatus; 
    this.sText   = sText;
} 

var nLoc = Context.getSelectedLanguage();
var oDB = ArisData.getActiveDatabase();

var oOut = Context.createOutputObject();
oOut.DefineF("HEAD", getString("FONT"), 10, Constants.C_BLACK, Constants.C_GREY_80_PERCENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
oOut.DefineF("STD", getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
oOut.DefineF("RED", getString("FONT"), 10, Constants.C_RED, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
oOut.DefineF("BLUE", getString("FONT"), 10, Constants.C_BLUE, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);

main();

oOut.EndTable(getString("PROTOCOL"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
oOut.WriteReport();

/**************************************************************************************************************************/

function main() {
    var nCount = 0;
    var protocolString = Context.getProperty("protocol");
    if (protocolString == null) {
        Context.setProperty(Constants.PROPERTY_SHOW_OUTPUT_FILE, false)
        Context.setProperty(Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false)
        return;
    }
    
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    outHeader();
    
    var aProtocol = getProtocol(protocolString);
    for (var i in aProtocol) {
        
        outEntry(aProtocol[i]);
        
        nCount++;
        if (nCount == 65000) {
            oOut.EndTable(getString("PROTOCOL"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

            oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
            outHeader();
            
            nCount = 0;
        }
    }
}

function getProtocol(protocolString) {
    var aProtocol = new Array();
    
    var aProtocolTxt = protocolString.split("###");
    for (var i in aProtocolTxt) {
        var sRow = aProtocolTxt[i];
        var aRow = sRow.split("+++");
        
        var srcGuid = aRow[0];
        var trgGuid = aRow[1];
        var sStatus = aRow[2];
        var sText   = aRow[3];        
        
        aProtocol.push(new PROTOCOL(srcGuid, trgGuid, sStatus, sText));
    }
    return aProtocol;
}

function outHeader() {
    oOut.TableRow();
    oOut.TableCellF(getString("SOURCE_MODEL"), 50, "HEAD");
    oOut.TableCellF(getString("TYPE"), 40, "HEAD");
    oOut.TableCellF(getString("GUID"), 40, "HEAD");
    oOut.TableCellF(getString("TARGET_MODEL"), 50, "HEAD");
    oOut.TableCellF(getString("TYPE"), 40, "HEAD");
    oOut.TableCellF(getString("GUID"), 40, "HEAD");
    oOut.TableCellF(getString("STATUS"), 15, "HEAD");
    oOut.TableCellF(getString("TEXT"),  100, "HEAD");      
}

function outEntry(protocol) {
    //status: SUCCESS, SKIPPED, ERROR, WARNING
    
    var srcGuid = protocol.srcGuid;
    var srcModel = findModelByGuid(srcGuid);
    var srcName = getName(srcModel);
    var srcType = getType(srcModel);

    var trgGuid = protocol.trgGuid;
    var trgModel = findModelByGuid(trgGuid);
    var trgName = getName(trgModel);
    var trgType = getType(trgModel);
    
    oOut.TableRow();
    oOut.TableCellF(srcName,     50, getStyleSheet());
    oOut.TableCellF(srcType,     40, getStyleSheet());
    oOut.TableCellF(srcGuid,     40, getStyleSheet());
    oOut.TableCellF(trgName,     50, getStyleSheet());
    oOut.TableCellF(trgType,     40, getStyleSheet());
    oOut.TableCellF(trgGuid,     40, getStyleSheet());
    oOut.TableCellF(outStatus(), 15, getStyleSheet());      
    oOut.TableCellF(protocol.sText, 100, getStyleSheet()); 

    function getStyleSheet() {
        if (StrComp(protocol.sStatus, "ERROR") == 0)   return "RED";
        if (StrComp(protocol.sStatus, "WARNING") == 0) return "BLUE";
        return "STD";
    }
    function outStatus() {
        if (StrComp(protocol.sStatus, "SUCCESS") == 0) return getString("STATUS_SUCCESSFUL");
        if (StrComp(protocol.sStatus, "SKIPPED") == 0) return getString("STATUS_SKIPPED");
        if (StrComp(protocol.sStatus, "ERROR") == 0)   return getString("STATUS_ERROR");
        if (StrComp(protocol.sStatus, "WARNING") == 0) return getString("STATUS_WARNING");
        return "";
    }
    function findModelByGuid(sGuid) {
        if (sGuid == "") return null;
        return oDB.FindGUID(sGuid, Constants.CID_MODEL);
    }
    function getName(oModel) {
        if (oModel != null && oModel.IsValid()) 
            return oModel.Name(nLoc);
        return "";
    }
    function getType(oModel) {
        if (oModel != null && oModel.IsValid()) 
            return formatstring2("@1 (@2)", oModel.Type(), oModel.TypeNum());
        return "";
    }
}