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

var bAutoTouch = false;         // true: Date of last change is changed (= Standard behaviour)     
                                // false: Models get not touched -> Date of last change is not changed

/************************************************************************************************************************************/

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

if ( checkEntireMethod() ) {
    
    var oDB = ArisData.getActiveDatabase();
    
    if (!bAutoTouch) oDB.setAutoTouch(false);     // No touch !!!
    
    var oOut = Context.createOutputObject();
    initOutput(oOut);
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    outHeader();
    
    var oScreenDefs = searchUrlScreenDefs();
    for (var i in oScreenDefs) {
        
        replaceTransactionType(oScreenDefs[i]);
    }
    oOut.EndTable(getString("PROTOCOL"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOut.WriteReport();
}

/************************************************************************************************************************************/

function replaceTransactionType(oScreenDef) {
    var oAttr = oScreenDef.Attribute(Constants.AT_SOLAR_TRANSACTION_TYPE, nLoc);
    var sOldValue = oAttr.getValue();

    var bResult = oAttr.SetValue(Constants.AVT_SOLAR_URL);   // Web address or File
    var sErrorText = bResult ? "" : formatstring1(getString("ERROR_MSG_ATTRIBUTE"), oFilter.AttrTypeName(Constants.AT_SOLAR_TRANSACTION_TYPE));

    outData(oScreenDef, sOldValue, oAttr.getValue(), bResult, sErrorText);
}

function searchUrlScreenDefs() {
    var searchItemA = getSearchItem(oDB, Constants.AT_SOLAR_TRANSACTION_TYPE, Constants.AVT_LONG_URL);                   // Long URL
    var searchItemB = getSearchItem(oDB, Constants.AT_SOLAR_TRANSACTION_TYPE, Constants.AVT_SOLAR_PREDEFINED_URL);       // Predefined URLs from directory
    var searchItemC = getSearchItem(oDB, Constants.AT_SOLAR_TRANSACTION_TYPE, Constants.AVT_SOLAR_SAP_URL_APPLICATION);  // SAP URL application
    
    return oDB.Find(Constants.SEARCH_OBJDEF, [Constants.OT_SCRN], searchItemA.or(searchItemB).or(searchItemC));
}

/************************************************************************************************************************************/
// Output

function outHeader() {
    oOut.TableRow();
    oOut.TableCellF(getString("OBJECT_NAME"),     40, "HEAD");
    oOut.TableCellF(getString("OBJECT_SEARCHID"), 50, "HEAD");
    oOut.TableCellF(getString("ATTR_CHANGE"),     60, "HEAD");
    oOut.TableCellF(getString("RESULT"),          60, "HEAD");
}

function outData(oObjDef, sOldValue, sNewValue, bResult, sErrorText) {
    var styleSheet = bResult ? "STD" : "RED";
    oOut.TableRow();
    oOut.TableCellF(outName(oObjDef),                         40, styleSheet);
    oOut.TableCellF(outSearchID(oObjDef),                     50, styleSheet);
    oOut.TableCellF(outChange(bResult, sOldValue, sNewValue), 60, styleSheet);
    oOut.TableCellF(outResult(bResult, sErrorText),           60, styleSheet);
}
