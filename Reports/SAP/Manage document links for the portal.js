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

var aLinkAttrs  = [Constants.AT_EXT_1, Constants.AT_EXT_2, Constants.AT_EXT_3, Constants.AT_LINK];
var aTitleAttrs = [Constants.AT_TITL1, Constants.AT_TITL2, Constants.AT_TITL3, Constants.AT_TITL4];

var nLoc = Context.getSelectedLanguage();

function DLG_SETTINGS(p_nMode, p_sTitle, p_sURL) {
    this.nMode = p_nMode;     // 0,1: Create, 2: Delete
    this.sTitle  = p_sTitle;
    this.sURL    = p_sURL;
}

main();

/********************************************************************************************************/

function main() {
    var dlgSettings = getDialogSettings();
    if (dlgSettings == null) return;
    
    var errorLog = new __holder("");

    var oInfoCarriers = getInfoCarriers();
    for (var i = 0; i < oInfoCarriers.length; i++) {
        
        updateLink(oInfoCarriers[i], dlgSettings, errorLog);
    } 
    if (dlgSettings.nMode < 2) outErrorLog(errorLog);
}

function updateLink(oObjDef, dlgSettings, errorLog) {
    var sSapId = getSapId(oObjDef);
    var sLink = getCurrentLink(sSapId, dlgSettings.sURL);
    if (sLink == null) {
        errorLog.value += writeError(oObjDef, getString("ERR_WRONG_URL"));
        return;
    }
    var sTitle = dlgSettings.sTitle;        // AME-1295 
    switch (dlgSettings.nMode) {
        case 0:
            createLinkAttr(sLink, sTitle);
            break;
        case 1:
            createOnlyNewLinkAttr(sLink, sTitle);
            break;
        case 2:
            deleteLinkAttrs(sLink);
            break;
    }
    
    function createLinkAttr(sLink, sTitle) {
        // Check if this link already exists
        for (var i in aLinkAttrs) {
            var oAttrLink = oObjDef.Attribute(aLinkAttrs[i], nLoc);
            if (oAttrLink.IsMaintained()) {
                if (StrComp(oAttrLink.getValue(), sLink) == 0) return true;
            }
        }
        // Create new link
        for (var i in aLinkAttrs) {
            var oAttrLink = oObjDef.Attribute(aLinkAttrs[i], nLoc);
            if (oAttrLink.IsMaintained()) continue;
            
            oAttrLink.setValue(sLink);

            var oAttrTitle = oObjDef.Attribute(aTitleAttrs[i], nLoc);
            oAttrTitle.setValue(sTitle);

            return true;
        }
        errorLog.value += writeError(oObjDef, getString("ERR_NO_FREE_ATTR"));
        return false;
    }

    function createOnlyNewLinkAttr(sLink, sTitle) {
        // Check if any link  exists
        for (var i in aLinkAttrs) {
            var oAttrLink = oObjDef.Attribute(aLinkAttrs[i], nLoc);
            if (oAttrLink.IsMaintained()) return false;
        }
        // Create new link       
        var oAttrLink = oObjDef.Attribute(aLinkAttrs[0], nLoc);
        oAttrLink.setValue(sLink);
        
        var oAttrTitle = oObjDef.Attribute(aTitleAttrs[0], nLoc);
        oAttrTitle.setValue(sTitle);
        
        return true;
    }
    
    function deleteLinkAttrs(sLink) {
        for (var i = 0; i < aLinkAttrs.length; i++) {
            var oAttrLink = oObjDef.Attribute(aLinkAttrs[i], nLoc);
            if (StrComp(oAttrLink.getValue(), sLink) == 0) {
                oAttrLink.Delete();
                
                var oAttrTitle = oObjDef.Attribute(aTitleAttrs[i], nLoc);
                oAttrTitle.Delete();
            }
        }
    }
    
    function getCurrentLink(sSapId, sLink) {
        sLink = trimStr(sLink);
        
        var sPattern = "LOIO=";
        var nPos = sLink.indexOf(sPattern);
        if (nPos < 0) return null;

        nPos += sPattern.length;
        var sText_inFront = sLink.substr(0, nPos);
        var sLink2 = sLink.substr(nPos);

        var sPattern2 = "&";
        var nPos2 = sLink2.indexOf(sPattern2);
        if (nPos2 < 0) return null;

        var sText_behind = sLink2.substr(nPos2);

        return (""+ sText_inFront + sSapId + sText_behind);
        
        function trimStr(sString) {
            var jString = new java.lang.String(sString);
            return "" + jString.trim();
        }
    }   
}

function getInfoCarriers() {
    var oInfoCarriers = new Array();
    
    var oSelGroups = ArisData.getSelectedGroups();
    for (var i = 0; i < oSelGroups.length; i++) {
        var oGroup = oSelGroups[i];
        var searchItem = ArisData.getActiveDatabase().createSearchItem(Constants.AT_SAP_ID2, nLoc, true/*bExistence*/);
        oInfoCarriers = oInfoCarriers.concat(oGroup.ObjDefList(true/*bRecursive*/, Constants.OT_INFO_CARR, searchItem));
    }
    return oInfoCarriers;
}

function getSapId(oObjDef) {
    var oAttr = oObjDef.Attribute(Constants.AT_SAP_ID2, nLoc);
    if (!oAttr.IsMaintained()) return "";
    return "" + oAttr.getValue();
}

function outErrorLog(errorLog) {
    var sError = errorLog.value;
    if (sError.length == 0) {
        Dialogs.MsgBox(getString("MSG_SUCCESS"), Constants.MSGBOX_ICON_INFORMATION | Constants.MSGBOX_BTN_OK, Context.getScriptInfo(Constants.SCRIPT_TITLE));
        return;
    }
    var oOut = Context.createOutputObject();
    oOut.OutputLn(sError, "Arial", 10, Constants.C_BLACK,Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    oOut.WriteReport();
}

function writeError(oObjDef, sErrorText) {
    return formatstring3("@1 [SAP-ID: @2] - @3\n", oObjDef.Name(nLoc), getSapId(oObjDef), sErrorText);
}

function getDialogSettings() {
    return Dialogs.showDialog(new linkDialog(), Constants.DIALOG_TYPE_ACTION, Context.getScriptInfo(Constants.SCRIPT_TITLE));

    function linkDialog() {
        var bCanceled = true;
        
        this.getPages = function() {
            var iDlgTempl = Dialogs.createNewDialogTemplate(510, 200, "");
            iDlgTempl.Text(10, 10, 500, 15, getString("DLG_TXT_HEADLINE"));
            iDlgTempl.Text(10, 35, 60, 15, getString("DLG_TXT_TITLE_"));
            iDlgTempl.TextBox(70, 35, 380, 21, "TXT_TITLE");
            iDlgTempl.Text(10, 65, 60, 15, getString("DLG_TXT_URL_"));
            iDlgTempl.TextBox(70, 65, 440, 100, "TXT_URL", 1);
            iDlgTempl.OptionGroup("OPT_GRP");
                iDlgTempl.OptionButton (70, 175, 440, 21, getString("DLG_OPT_CREATE_LINK"));            // = 0
                iDlgTempl.OptionButton (70, 195, 440, 21, getString("DLG_OPT_CREATE_ONLY_NEW_LINK"));   // = 1
                iDlgTempl.OptionButton (70, 215, 440, 21, getString("DLG_OPT_DELETE_LINKS"));            // = 2
            
            return [iDlgTempl];
        }
        this.isInValidState = function(pageNumber) {
            return true;
        }
        this.onClose = function(pageNumber, bOk) {
            if (bOk) bCanceled = false;
        }
        this.getResult = function() {
            if (bCanceled) return null;

            var nMode = this.dialog.getPage(0).getDialogElement("OPT_GRP").getValue();
            var sTitle  = "" + this.dialog.getPage(0).getDialogElement("TXT_TITLE").getText();
            var sURL    = "" + this.dialog.getPage(0).getDialogElement("TXT_URL").getText();
            return new DLG_SETTINGS(nMode, sTitle, sURL);
        }
    }
}    
    

/************************************************************/
    
