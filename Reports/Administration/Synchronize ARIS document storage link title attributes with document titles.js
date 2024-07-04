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

var adsComp = Context.getComponent("ADS");
if (adsComp != null) {

    doUpdate();
}

/******************************************************************************************************/ 

function doUpdate() {
    var oDB = ArisData.getActiveDatabase();
    oDB.setAutoTouch(false);      // No touch !!!
    
    var langList = oDB.LanguageList();
    for (var i in langList) {
        var nLoc = langList[i].LocaleId(); 
        var searchItem = getSearchItem(oDB, nLoc);
        
        var oObjDefs = oDB.Find(Constants.SEARCH_OBJDEF, null, searchItem);
        updateADSLinkTitles(oObjDefs, nLoc);
        
        var oModels = oDB.Find(Constants.SEARCH_MODEL, null, searchItem);    
        updateADSLinkTitles(oModels, nLoc);
    }
}

function getSearchItem(oDB, nLoc) {
    var searchItem = oDB.createSearchItem(Constants.AT_ADS_LINK_1, nLoc, true);
    searchItem = searchItem.or(oDB.createSearchItem(Constants.AT_ADS_LINK_2, nLoc, true));
    searchItem = searchItem.or(oDB.createSearchItem(Constants.AT_ADS_LINK_3, nLoc, true));
    searchItem = searchItem.or(oDB.createSearchItem(Constants.AT_ADS_LINK_4, nLoc, true));    
    return searchItem;
}

function updateADSLinkTitles(oItems, nLoc) {
    for (var i in oItems) {
        var oItem = oItems[i];
        updateADSLinkTitle(oItem, nLoc, Constants.AT_ADS_LINK_1, Constants.AT_ADS_TITL1);
        updateADSLinkTitle(oItem, nLoc, Constants.AT_ADS_LINK_2, Constants.AT_ADS_TITL2);
        updateADSLinkTitle(oItem, nLoc, Constants.AT_ADS_LINK_3, Constants.AT_ADS_TITL3);
        updateADSLinkTitle(oItem, nLoc, Constants.AT_ADS_LINK_4, Constants.AT_ADS_TITL4);
    }
}
        
function updateADSLinkTitle(oItem, nLoc, atnLink, atnTitle) {
    var attrLink = oItem.Attribute(atnLink, nLoc);
    if (attrLink.IsMaintained()) {
        
        var sLink = attrLink.getValue();
        try {
            var document = adsComp.getDocumentByHyperlink(sLink);
            var docMetaInfo = document.getDocumentMetaInfo();
            
            var sTitle = docMetaInfo.getDocumentName();
            if (sTitle != "") {
                attrTitle = oItem.Attribute(atnTitle, nLoc);
                attrTitle.setValue(sTitle);
            }
        } catch(ex) {
            var sErrorText = errorLog(ex);
            Context.writeLog(sErrorText);
            //Dialogs.MsgBox(sErrorText);
        }
    }
    
    function errorLog(ex) {
        var sAttrType = ArisData.ActiveFilter().AttrTypeName(atnTitle);
        var sItemKind = ArisData.ActiveFilter().ItemKindName(oItem.KindNum());

        var sItem = formatstring3("@1 '@2' (@3)", sItemKind, oItem.Name(nLoc), oItem.GUID());
        var sErrorText = formatstring2("ERROR: Attribute '@1' not updated: @2", sAttrType, sItem);
        sErrorText += formatstring2(", Hyperlink = @1, LocaleID = @2", sLink, nLoc);
        return formatstring2("@1 - Exception: @2", sErrorText, ex.message)
    }
}
