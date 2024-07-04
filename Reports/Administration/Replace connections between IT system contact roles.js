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
 
// Configuration settings 
var g_nAttrType =     Constants.AT_SUPPORT_TYPE;

var g_aCxnTypes =    [Constants.CT_IS_RESP_1];

var g_aSrcObjTypes = [Constants.OT_ORG_UNIT,
                      Constants.OT_PERS,
                      Constants.OT_PERS_TYPE,
                      Constants.OT_POS];
                     
var g_aTrgObjTypes = [Constants.OT_APPL_SYS,
                      Constants.OT_APPL_SYS_TYPE];

var g_aModelTypes =  [Constants.MT_ACS_DGM,
                      Constants.MT_ACS_DGM_PHYS,
                      Constants.MT_APPLICATION_COLLABORATION_DIAGRAM_PHYSICAL,
                      Constants.MT_PRG_STRCT_CHRT];

// Map: Attr value type -> Cxn type (cxn type = null: skipped)
var g_mapAttr2Cxn = new java.util.HashMap();
    g_mapAttr2Cxn.put( -1,                                              null);                                                     // <Attribute not maintained>
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_HOTLINE,              Constants.CT_RESPONSIBILITY_HOTLINE_SUPPORT);               // Hotline support (4783)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_1ST,                  Constants.CT_RESPONSIBILITY_1ST_LEVEL_SUPPORT);             // 1st level support (4784)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_2ND,                  Constants.CT_RESPONSIBILITY_2ND_LEVEL_SUPPORT);             // 2nd level support (4785)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_3RD,                  Constants.CT_RESPONSIBILITY_3RD_LEVEL_SUPPORT);             // 3rd level support (4786)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_SYS_INTEGRATOR,       Constants.CT_RESPONSIBILITY_SYSTEM_INTEGRATION);            // System integrator (4787)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_FACILITY_OPERATOR,    Constants.CT_RESPONSIBILITY_FACILITY_OPERATOR);             // Facility operator (4788)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_OPERATION_RESP,       Constants.CT_RESPONSIBILITY_OPERATING);                     // Operating responsibility (4789)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_SYS_RESP,             Constants.CT_RESPONSIBILITY_SYSTEM);                        // System responsibility (4790)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_FAILURE_RESP,         Constants.CT_RESPONSIBILITY_OPERATIONAL_FAULT_RECORDING);   // Operational fault recording (4791)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_FREE_11,              null);                                                     // Free support type 11 (4792)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_SUBST_SYS_RESP,       Constants.CT_SUBSTITUTE_RESPONSIBILITY_SYSTEM);             // System responsibility substitute (4793)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_FREE_1,               null);                                                     // Free support type 1 (4794)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_FREE_2,               null);                                                     // Free support type 2 (4795)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_FREE_3,               null);                                                     // Free support type 3 (4796)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_FREE_4,               null);                                                     // Free support type 4 (4797)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_FREE_5,               null);                                                     // Free support type 5 (4798)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_FREE_6,               null);                                                     // Free support type 6 (4799)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_FREE_7,               null);                                                     // Free support type 7 (4800)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_FREE_8,               null);                                                     // Free support type 8 (4801)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_FREE_9,               null);                                                     // Free support type 9 (4802)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_FREE_10,              null);                                                     // Free support type 10 (4803)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_FREE_12,              Constants.CT_RESPONSIBILITY_APPLICATION);                   // Application responsibility (4804)
    g_mapAttr2Cxn.put( Constants.AVT_SUPPORT_TYPE_SUBST_OPERATION_RESP, Constants.CT_SUBSTITUTE_RESPONSIBILITY_OPERATING);          // Operating responsibility substitute (4805)
    

/************************************************************************************************************************************/

var dlgResult = Dialogs.MsgBox(getString("WARNING"), Constants.MSGBOX_BTN_OKCANCEL | Constants.MSGBOX_ICON_WARNING, Context.getScriptInfo(Constants.SCRIPT_TITLE));
if (dlgResult == Constants.MSGBOX_RESULT_OK) {
    
    ArisData.Save(Constants.SAVE_ONDEMAND);
    
    var nLoc = Context.getSelectedLanguage();
    var langList = ArisData.getActiveDatabase().LanguageList();
    var oFilter = ArisData.ActiveFilter();
    
    var oOut = Context.createOutputObject();
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
    initOutput();
    outHeader();
    
    var oCxnDefs = ArisData.getActiveDatabase().Find(Constants.SEARCH_CXNDEF, g_aCxnTypes);
    for (var i in oCxnDefs) {
        var oCxnDef = oCxnDefs[i];
        if (!isRelevantCxn(oCxnDef)) continue;
    
        replaceCxn(oCxnDef);
        ArisData.Save(Constants.SAVE_NOW);
    }
    oOut.EndTable(getString("PROTOCOL"), 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOut.WriteReport();
}

/************************************************************************************************************************************/

function replaceCxn(oCxnDef) {
    var bDefCopySuccess = true;
    var bOccCopySuccess = true;
    var bDeleteSuccess = true;
    
    var oSourceObjDef = oCxnDef.SourceObjDef();
    var oTargetObjDef = oCxnDef.TargetObjDef();

    var nCxnType = oCxnDef.TypeNum();
    var nRespType = getResponibilityType(oCxnDef);
    var nNewCxnType = getNewCxnType(nRespType);
    if (nNewCxnType == null) {

        outData(nCxnType, nRespType, nNewCxnType, oSourceObjDef, oTargetObjDef, bDefCopySuccess, bOccCopySuccess, bDeleteSuccess);     // SKIPPED        
        return;
    }
    var oNewCxnDef = getOrCreateCxnDef(oCxnDef, nNewCxnType);
    if (oNewCxnDef.IsValid()) {

        copyAssignments(oCxnDef, oNewCxnDef);
        copyAttrs(oCxnDef, oNewCxnDef);  
        
        // Copy cxn occurrences    
        var oCxnOccs = oCxnDef.OccList();
        for (var i in oCxnOccs) {
            var oCxnOcc = oCxnOccs[i];
            var oModel = oCxnOcc.Model();
            
            if (checkItemType(oModel.TypeNum(), g_aModelTypes)) {
                var oSrcObjOcc = oCxnOcc.SourceObjOcc();
                var oTrgObjOcc = oCxnOcc.TargetObjOcc();
                var oNewCxnOcc = null;
                
                if (isEmbeddedCxn(oSrcObjOcc, oTrgObjOcc)) {
                    var bResult;
                    if (oTrgObjOcc.IsEqual(oSrcObjOcc.getParentObjOcc())) {  
                        // -> switch direction
                        bResult = oTrgObjOcc.addEmbeddedObjOcc(oSrcObjOcc, [nNewCxnType], false/* bFromSrcToTarget*/);
                    } else {
                        bResult = oSrcObjOcc.addEmbeddedObjOcc(oTrgObjOcc, [nNewCxnType], true/* bFromSrcToTarget*/);
                    }
                    if (bResult) {
                        oNewCxnOcc = getCopiedCxnOcc(oSrcObjOcc, oTrgObjOcc, nNewCxnType);
                    }
                } else {
                    oNewCxnOcc = oModel.CreateCxnOcc(oSrcObjOcc, oTrgObjOcc, oNewCxnDef, oCxnOcc.PointList(), false/*bDiagonal*/)
                }
                
                if (oNewCxnOcc != null && oNewCxnOcc.IsValid()) {
                    
                    oNewCxnOcc.setVisible(oCxnOcc.getVisible());
                    oNewCxnOcc.setZOrder(oCxnOcc.getZOrder());
                    
                    copyAttrOccs(oCxnOcc, oNewCxnOcc);

                    // copy line style
                    var lineStyle = oCxnOcc.getLineStyle();
                    if (!lineStyle.isDefault()) {
                        oNewCxnOcc.setLineStyle(lineStyle);
                    }
                
                    // copy arrows
                    var nSrcArrow = oCxnOcc.getSourceArrow();
                    if (nSrcArrow > 0) oNewCxnOcc.setSourceArrow(nSrcArrow); 
                    var nTrgArrow = oCxnOcc.getTargetArrow();
                    if (nTrgArrow > 0) oNewCxnOcc.setTargetArrow(nTrgArrow);
                    
                } else {
                    bOccCopySuccess = false;
                }
            } else {
                bOccCopySuccess = false;
            }
        }
    } else {
        bDefCopySuccess = false;
    }
    if (bDefCopySuccess && bOccCopySuccess) {
        // Delete cxn
        bDeleteSuccess = oCxnDef.Delete(false/*boolean bCheckForOccs*/);
    }
    
    outData(nCxnType, nRespType, nNewCxnType, oSourceObjDef, oTargetObjDef, bDefCopySuccess, bOccCopySuccess, bDeleteSuccess);
    
    function getOrCreateCxnDef(oCxnDef, nNewCxnType) {
        var oSourceObjDef = oCxnDef.SourceObjDef();
        var oTargetObjDef = oCxnDef.TargetObjDef();
        var oCxnDefs = oSourceObjDef.CxnListFilter(Constants.EDGES_OUT, nNewCxnType);
        for (var i in oCxnDefs) {
            if (oCxnDefs[i].TargetObjDef().IsEqual(oTargetObjDef)) return oCxnDefs[i];
        }
        return oSourceObjDef.CreateCxnDef(oTargetObjDef, nNewCxnType);
    }
    
    function isEmbeddedCxn(oSrcObjOcc, oTrgObjOcc) {
        if (oSrcObjOcc.IsEqual(oTrgObjOcc.getParentObjOcc())) return true;
        if (oTrgObjOcc.IsEqual(oSrcObjOcc.getParentObjOcc())) return true;
        return false;
    }
    
    function copyAssignments(oItem, oNewItem) {
        var oAssModels = oItem.AssignedModels() ;
        for (var i in oAssModels) {
            oNewItem.CreateAssignment(oAssModels[i]);
        }
    }
    
    function copyAttrs(oItem, oNewItem) {
        for (var i in langList) {
            var loc = langList[i].LocaleId();
            var oAttrList = oItem.AttrList(loc);
            for (var j in oAttrList) {
                var oAttr = oAttrList[j];
                
                var oNewAttr = oNewItem.Attribute(oAttr.TypeNum(), loc);
                if (!oNewAttr.IsValid()) continue;
                
                switch(oFilter.AttrBaseType(oAttr.TypeNum())) {
                    case Constants.ABT_BOOL:
                    case Constants.ABT_COMBINED:
                    case Constants.ABT_LONGTEXT:
                    case Constants.ABT_VALUE:
                    case Constants.ABT_BLOB:
                        oNewAttr.SetValue(oAttr.MeasureValue(false), oAttr.MeasureUnitTypeNum());
                        break;
                    default:
                        oNewAttr.SetValue(oAttr.GetValue(false), oAttr.MeasureUnitTypeNum());
                }
            }
        }
    }

    function copyAttrOccs(oOcc, oNewOcc) {
        for (var i in langList) {
            var loc = langList[i].LocaleId();
            var oAttrOccList = oOcc.AttrOccList();
            for (var j in oAttrOccList) {
                var oAttrOcc = oAttrOccList[j];
                var aPortOptions = oAttrOcc.GetPortOptions();
                
                var oNewAttrOcc = oNewOcc.AttrOcc(oAttrOcc.AttrTypeNum());
                if (!oNewAttrOcc.IsValid()) continue;
                
                if (!oNewAttrOcc.Exist()) {
                    oNewAttrOcc.Create(aPortOptions[0], oAttrOcc.FontStyleSheet());
                }
                oNewAttrOcc.setFontStyleSheet(oAttrOcc.FontStyleSheet()); 
                oNewAttrOcc.SetPortOptions(aPortOptions[0], aPortOptions[1]);
                if (aPortOptions[0] == Constants.ATTROCC_PORT_FREE) {
                    oNewAttrOcc.SetOffset(oAttrOcc.OffsetX(), oAttrOcc.OffsetY());
                }
            }
        }
    }
    
    function getCopiedCxnOcc(srcObjOcc, trgObjOcc, nNewCxnType) {
        var oRelevantCxnOccs = new Array();
        var oCxnOccs = srcObjOcc.Cxns(Constants.EDGES_OUT);
        for (var i in oCxnOccs) {
            var oCxnOcc = oCxnOccs[i];
            if (oCxnOcc.CxnDef().TypeNum() == nNewCxnType && trgObjOcc.IsEqual(oCxnOcc.TargetObjOcc())) {
                oRelevantCxnOccs.push(oCxnOcc);
            }
        }
        if (oRelevantCxnOccs.length == 1) return oRelevantCxnOccs[0];   // Unique copy
        return null;    // No cxn found or cxns not unique
    }   
}

function isRelevantCxn(oCxnDef) {
    return checkItemType(oCxnDef.SourceObjDef().TypeNum(), g_aSrcObjTypes) && 
           checkItemType(oCxnDef.TargetObjDef().TypeNum(), g_aTrgObjTypes)
}

function checkItemType(nTypeNum, aTypeNums) {
    for (var i in aTypeNums) {
        if (nTypeNum == aTypeNums[i]) return true;
    }
    return false;
}

function getResponibilityType(oCxnDef) {
    var oAttr = oCxnDef.Attribute(g_nAttrType, nLoc);
    if (!oAttr.IsMaintained()) return -1;
    return oAttr.MeasureUnitTypeNum();
}

function getNewCxnType(nRespType) {
    if (!g_mapAttr2Cxn.containsKey(nRespType)) return null;    
    return g_mapAttr2Cxn.get(nRespType);
} 


/************************************************************************************************************************************/
// Output

function initOutput() {
    oOut.DefineF("HEAD", getString("FONT"), 10, Constants.C_BLACK, Constants.C_GREY_80_PERCENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("STD",  getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("BLUE", getString("FONT"), 10, Constants.C_BLUE, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
    oOut.DefineF("RED",  getString("FONT"), 10, Constants.C_RED, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 21, 0, 0, 0, 1);
}

function outHeader() {
    var sRespType = ArisData.ActiveFilter().AttrTypeName(g_nAttrType);
    oOut.TableRow();
    oOut.TableCellF(getString("OLD_CXN_TYPE"), 40, "HEAD");
    oOut.TableCellF(sRespType,                 40, "HEAD");
    oOut.TableCellF(getString("NEW_CXN_TYPE"), 40, "HEAD");
    oOut.TableCellF(getString("RESULT"),       40, "HEAD");
    oOut.TableCellF(getString("SRC_OBJECT"),  100, "HEAD");
    oOut.TableCellF(getString("TRG_OBJECT"),  100, "HEAD");
}

function outData(nOldCxnType, nRespType, nNewCxnType, oSourceObjDef, oTargetObjDef, bDefCopySuccess, bOccCopySuccess, bDeleteSuccess) {
    var styleSheet = getStyleSheet();
    oOut.TableRow();
    oOut.TableCellF(getCxnTypeName(nOldCxnType),   40, styleSheet);
    oOut.TableCellF(getRespType(),                 40, styleSheet);
    oOut.TableCellF(getCxnTypeName(nNewCxnType),   40, styleSheet);
    oOut.TableCellF(getResult(),                   40, styleSheet);
    oOut.TableCellF(getObjectInfo(oSourceObjDef), 100, styleSheet);
    oOut.TableCellF(getObjectInfo(oTargetObjDef), 100, styleSheet);
    
    function getStyleSheet() {
        if (nNewCxnType == null) return "BLUE";
        if (bDefCopySuccess && bOccCopySuccess && bDeleteSuccess)  return "STD";
        return "RED";
    }
    
    function getRespType() {
        if (nRespType == -1) return getString("NOT_MAINTAINED")
        return formatstring2("@1 [@2]", ArisData.ActiveFilter().AttrValueType(g_nAttrType, nRespType), g_nAttrType);
    }
    
    function getCxnTypeName(nCxnType) {
        if (nCxnType == null) return "";
        return formatstring2("@1 [@2]", ArisData.ActiveFilter().ItemTypeName(Constants.CID_CXNDEF, nCxnType), parseInt(nCxnType)); 
    }

    function getResult() {
        if (nNewCxnType == null) return getString("SKIPPED");
        if (!bDefCopySuccess) return formatstring2("@1 - @2", getString("ERROR"), getString("CXN_NOT_CREATED")); 
        if (!bOccCopySuccess) return formatstring2("@1 - @2", getString("ERROR"), getString("CXNOCC_NOT_CREATED")); 
        if (!bDeleteSuccess)  return formatstring2("@1 - @2", getString("ERROR"), getString("CXN_NOT_DELETED")); 
        return getString("SUCCESSFUL");
    }
    
    function getObjectInfo(oObjDef) {
        return formatstring2("@1: @2", getString("NAME"), oObjDef.Name(nLoc)) + "\n" +
               formatstring2("@1: @2", getString("TYPE"), formatstring2("@1 [@2]", oObjDef.Type(), oObjDef.TypeNum())) + "\n" +
               formatstring2("@1: @2", getString("GUID"), oObjDef.GUID()) + "\n" + 
               formatstring2("@1: @2", getString("PATH"), oObjDef.Group().Path(nLoc));
    }
}