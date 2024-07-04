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

var COL_LOGO = getColorByRGB( 23, 118, 191);
var COL_HEAD = getColorByRGB(  0, 111, 151);
var COL_SUB =  getColorByRGB(  4, 178, 224);
 
var IOT_OBJECT = function(objDef, objOccs) {
    this.objDef = objDef;
    this.objOccs = objOccs;
}

var nLoc = Context.getSelectedLanguage();

var oOut = Context.createOutputObject();
oOut.DefineF("HEAD_TOC", getString("FONT"), 14, COL_HEAD, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_TOCENTRY0, 0, 21, 0, 0, 0, 1);
oOut.DefineF("HEAD", getString("FONT"), 14, COL_HEAD, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0, 21, 0, 0, 0, 1);
oOut.DefineF("SUB", getString("FONT"), 12, COL_SUB, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

oOut.DefineF("BOLD", getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0, 21, 0, 0, 0, 1);
oOut.DefineF("STD", getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

outTOC();
outHeaderAndFooter();
initFrameStyle();
    
var aIoTObjects = getIoTObjects();    // = Array(IoTObjDef, Array(IoTObjOccs))
for (var i= 0; i <aIoTObjects.length; i++) {
    var oIoTObjDef  = aIoTObjects[i].objDef;
    var oIoTObjOccs = aIoTObjects[i].objOccs;

    outHeader(oIoTObjDef.Name(nLoc));
    outAttributes(oIoTObjDef);
    
    // Evaluation based on occurrences
    outParents(oIoTObjOccs);
    outChildren(oIoTObjOccs);
    outSensors(oIoTObjOccs);
    outActuators(oIoTObjOccs);
    
    // Evaluation based on definition
    outProtocols(oIoTObjDef);
    outInputData(oIoTObjDef);
    outInputEvents(oIoTObjDef);
    outOutputEvents(oIoTObjDef);
    outFunctions(oIoTObjDef);
    outRisks(oIoTObjDef);

    if (i < aIoTObjects.length-1) oOut.OutputField(Constants.FIELD_NEWPAGE, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT);
    
}
oOut.WriteReport();

function outParents(oIoTObjOccs) {
    var oParentDefs = getConnectedObjDefs( oIoTObjOccs, [Constants.ST_IOT_OBJECT], Constants.EDGES_IN, [Constants.CT_IOT_ENCOMPASSES] );
    outItemList(oParentDefs, getString("PARENT_OBJECTS"));
}

function outChildren(oIoTObjDef) {
    var oChildDefs = getConnectedObjDefs( oIoTObjOccs, [Constants.ST_IOT_OBJECT], Constants.EDGES_OUT, [Constants.CT_IOT_ENCOMPASSES] );
    outItemList(oChildDefs, getString("CHILD_OBJECTS"));
}

function outSensors(oIoTObjDef) {
    var oSensorDefs = getConnectedObjDefs( oIoTObjOccs, [Constants.ST_IOT_SENSOR_COMP], Constants.EDGES_OUT, [Constants.CT_IOT_ENCOMPASSES] );
    outItemList(oSensorDefs, getString("SENSOR_OBJECTS"));
}

function outActuators(oIoTObjDef) {
    var oActuatorDefs = getConnectedObjDefs( oIoTObjOccs, [Constants.ST_IOT_ACTUATOR_COMP], Constants.EDGES_OUT, [Constants.CT_IOT_ENCOMPASSES] );
    outItemList(oActuatorDefs, getString("ACTUATOR_OBJECTS"));
}

function outProtocols(oIoTObjDef) {
    var oProtocolDefs = oIoTObjDef.getConnectedObjs( [Constants.OT_NW_PROT], Constants.EDGES_OUT, [Constants.CT_USE_1] );
    outItemList(oProtocolDefs, getString("PROTOCOL_OBJECTS"));
}

function outInputData(oIoTObjDef) {
    var oInputDataDefs = oIoTObjDef.getConnectedObjs( [Constants.OT_CLST, Constants.OT_ERM_ATTR], Constants.EDGES_IN, [Constants.CT_IS_INP_FOR] );
    outItemListWithTypes(oInputDataDefs, getString("INPUT_DATA_OBJECTS"));
}

function outInputEvents(oIoTObjDef) {
    var oInputEventDefs = oIoTObjDef.getConnectedObjs( [Constants.OT_EVT], Constants.EDGES_IN, [Constants.CT_IOT_INPUT_EVT] );
    outItemList(oInputEventDefs, getString("INPUT_EVENT_OBJECTS"));
}

function outOutputEvents(oIoTObjDef) {
    var oOutputEventDefs = oIoTObjDef.getConnectedObjs( [Constants.OT_EVT], Constants.EDGES_OUT, [Constants.CT_IOT_OUTPUT_EVT] );
    outItemList(oOutputEventDefs, getString("OUTPUT_EVENT_OBJECTS"));
}

function outFunctions(oIoTObjDef) {
    var oFunctionDefs = oIoTObjDef.getConnectedObjs( [Constants.OT_FUNC], Constants.EDGES_OUT, [Constants.CT_IS_USED_BY] );
    outItemListWithModels(oFunctionDefs, getString("FUNCTION_OBJECTS"));
}

function outRisks(oIoTObjDef) {
    var oRiskDefs = oIoTObjDef.getConnectedObjs( [Constants.OT_RISK], Constants.EDGES_IN, [Constants.CT_AFFECTS] );
    outItemList(oRiskDefs, getString("RISK_OBJECTS"));
}


function outAttributes(oIoTObjDef) {
    var aHead = [getString("NAME"), getString("VALUE")];
    
    var aData = new Array();
    aData.push( [getAttrName(Constants.AT_DESC), oIoTObjDef.Attribute(Constants.AT_DESC, nLoc).getValue()] );
    aData.push( [getAttrName(Constants.AT_IOT_OBJECT_TYPE), oIoTObjDef.Attribute(Constants.AT_IOT_OBJECT_TYPE, nLoc).getValue()] );
    
    outData(getString("ATTRIBUTES"), aHead, aData);
      
    function getAttrName(attrType) { return ArisData.ActiveFilter().AttrTypeName(attrType) }
}

function outItemList(oItems, sHead) {
    var oItems = ArisData.sort(oItems, Constants.AT_NAME, nLoc);
    if (oItems.length == 0) return;

    var aHead = [getString("NAME")];
    
    var aData = new Array();
    for (var i in oItems) {
        aData.push( [oItems[i].Name(nLoc)] );
    }
    outData(sHead, aHead, aData);
}

function outItemListWithTypes(oItems, sHead) {
    var oItems = ArisData.sort(oItems, Constants.AT_NAME, nLoc);
    if (oItems.length == 0) return;
    
    var aHead = [getString("NAME"), getString("TYPE")];
    
    var aData = new Array();
    for (var i in oItems) {
        aData.push( [oItems[i].Name(nLoc), oItems[i].Type()] );
    }
    outData(sHead, aHead, aData);    
}

function outItemListWithModels(oItems, sHead) {
    var oItems = ArisData.sort(oItems, Constants.AT_NAME, nLoc);
    if (oItems.length == 0) return;
    
    var aHead = [getString("NAME"), getString("MODEL"), getString("MODEL_TYPE")];
    
    var aData = new Array();
    for (var i in oItems) {
        
        outModels(oItems[i]);
    }
    outData(sHead, aHead, aData);     
    
    function outModels(oObjDef) {
        var oModels = new Array()
        var oObjOccs = oObjDef.OccList();
        for (var i in oObjOccs) {
            oModels.push(oObjOccs[i].Model());
        }

        oModels = ArisData.sort(oModels, Constants.AT_NAME, nLoc);
        if (oModels.length > 0) {
            for (var i in oModels) {
                aData.push( [oObjDef.Name(nLoc), oModels[i].Name(nLoc), oModels[i].Type()] );
            }      
        } else {
            aData.push( [oObjDef.Name(nLoc), "", ""] );
        }
    }
}

function getConnectedObjDefs(oObjOccList, aSymbolTypes, nDirection, aCxnTypes) {
    var oConnObjDefs = new Array();
    for (var i in oObjOccList) {

        var oCxnOccs = oObjOccList[i].Cxns(nDirection);
        for (var j in oCxnOccs) {
            var oCxnOcc = oCxnOccs[j]
            if (!isRelevantCxnType(oCxnOcc.Cxn(), aCxnTypes)) continue;
        
            var oConnObjOcc = (nDirection == Constants.EDGES_OUT) ? oCxnOcc.TargetObjOcc() : oCxnOcc.SourceObjOcc();
            if (!isRelevantSymbolType(oConnObjOcc, aSymbolTypes)) continue;
            
            oConnObjDefs.push(oConnObjOcc.ObjDef());
        }
    }
    return ArisData.Unique(oConnObjDefs);
}

function getIoTObjects() {
    var aSymbolTypes = [Constants.ST_IOT_OBJECT];
    var oSelectedIoTObjOccs = new Array();
    
    var oObjOccs = new Array(); 
     
    var oSelectedObjDefs = ArisData.getSelectedObjDefs();
    for (var i in oSelectedObjDefs) {
        oObjOccs = oObjOccs.concat(oSelectedObjDefs[i].OccList());
    }
    
    var oSelModels = ArisData.getSelectedModels();
    for (var i in oSelModels) {
        var oObjOccsInModel = oSelModels[i].ObjOccListBySymbol(aSymbolTypes);
        for (var j in oObjOccsInModel) {
            var oObjDef = oObjOccsInModel[j].ObjDef();
            oObjOccs = oObjOccs.concat(oObjDef.OccList());
        }
    }
    oSelectedIoTObjOccs = filterSymbols(oObjOccs, aSymbolTypes);

    var mapIoTObjects = new java.util.HashMap();
    for (var i in oSelectedIoTObjOccs) {
        var oIoTObjOcc = oSelectedIoTObjOccs[i];

        var key = oIoTObjOcc.ObjDef();        
        var value = mapIoTObjects.get(key);
        if (value == null) value = new Array();
        value.push(oIoTObjOcc);

        mapIoTObjects.put(key, value);
    }
    
    var aIoTObjects = new Array();
    var iter = mapIoTObjects.keySet().iterator();
    while (iter.hasNext()) {
        var key = iter.next();
        value = mapIoTObjects.get(key);
        aIoTObjects.push(new IOT_OBJECT(key, value))
    
    }
    return aIoTObjects.sort(sortDefName);
    
    function sortDefName(a, b) { return StrComp(a.objDef.Name(nLoc), b.objDef.Name(nLoc)) }
}

function filterSymbols(oObjOccs, aSymbolTypes) {
    var oFilteredObjOccs = new Array();
    for (var i in oObjOccs) {
        for (var j in aSymbolTypes) {
            var oObjOcc = oObjOccs[i];
            if (!isRelevantSymbolType(oObjOcc, aSymbolTypes)) continue;
            
            oFilteredObjOccs.push(oObjOcc);
        }
    }
    return oFilteredObjOccs;
}

function isRelevantCxnType(oCxn, aCxnTypes) {
    var cxnType = oCxn.TypeNum();
    for (var i in aCxnTypes) {
        if (cxnType == aCxnTypes[i]) return true;
    }
    return false;
}

function isRelevantSymbolType(oObjOcc, aSymbolTypes) {
    var symbolType = oObjOcc.SymbolNum();
    for (var i in aSymbolTypes) {
        if (symbolType == aSymbolTypes[i]) return true;
    }
    return false;
}

/************************************************************************************************************************************/
// Output

function outHeader(sText) {   
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(sText, "HEAD_TOC"); 
    oOut.OutputLnF("", "STD");
}

function outHeader2(sText) {
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(sText, "SUB"); 
    oOut.OutputLnF("", "STD");
}

function outData(sHead, aHead, aData) {
    outHeader2(sHead);
    setBorderLine(Constants.FRAME_BOTTOM, 10);
    
    oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0);
    outTableHeader(aHead);
    initFrameStyle();
    outTableContent(aData);
    oOut.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT , 0);

    oOut.OutputLnF("", "STD"); 
    
    function outTableHeader(aHead) {
        oOut.TableRow();
        if (aHead.length == 1) {
            oOut.TableCellF(aHead[0], 100, "BOLD");
        } 
        else if (aHead.length == 2) {
            oOut.TableCellF(aHead[0], 40, "BOLD");
            oOut.TableCellF(aHead[1], 60, "BOLD");
        } 
        else if (aHead.length == 3) {
            oOut.TableCellF(aHead[0], 35, "BOLD");
            oOut.TableCellF(aHead[1], 35, "BOLD");
            oOut.TableCellF(aHead[2], 30, "BOLD");
        }
    }

    function outTableContent(aData) {
        oOut.TableRow();
        if (aData[0].length == 1) {
            for (var i in aData) {
                oOut.TableRow();
                oOut.TableCellF(aData[i][0], 100, "STD");
            }
        } 
        else if (aData[0].length == 2) {
            for (var i in aData) {
                oOut.TableRow();
                oOut.TableCellF(aData[i][0], 40, "STD");
                oOut.TableCellF(aData[i][1], 60, "STD");
            }
        }
        else if (aData[0].length == 3) {
            for (var i in aData) {
                oOut.TableRow();
                oOut.TableCellF(aData[i][0], 35, "STD");
                oOut.TableCellF(aData[i][1], 35, "STD");
                oOut.TableCellF(aData[i][2], 30, "STD");
            }
        }
    }
}

function outTOC() {
    if (Context.getSelectedFormat() != Constants.OutputHTML) {
        // Output Index table
        oOut.BeginSection (false, Constants.SECTION_INDEX);
        oOut.SetTOCFormat(0, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_RIGHT, 0, 0, 0, 0, 0, 1.5) 
        outHeaderAndFooter();
        oOut.SetAutoTOCNumbering(true);
        oOut.OutputLnF(" ","HEAD");
        oOut.OutputLnF(getString("TOC"),"HEAD");    
        oOut.OutputLnF(" ","HEAD");
        oOut.OutputField(Constants.FIELD_TOC,getString("FONT"),10,Constants.C_BLACK,Constants.C_TRANSPARENT,Constants.FMT_RIGHT);
        oOut.EndSection();
    }
}

function setBorderLine(idFrame, nTwThickness) {
    initFrameStyle();
    oOut.SetFrameStyle(idFrame, nTwThickness);
}

function initFrameStyle() {
    oOut.SetFrameStyle(Constants.FRAME_TOP, 0, Constants.BRDR_NORMAL);
    oOut.SetFrameStyle(Constants.FRAME_LEFT, 0, Constants.BRDR_NORMAL);
    oOut.SetFrameStyle(Constants.FRAME_RIGHT, 0, Constants.BRDR_NORMAL);
    oOut.SetFrameStyle(Constants.FRAME_BOTTOM, 0, Constants.BRDR_NORMAL);
}

function outHeaderAndFooter() {
    setBorderLine(Constants.FRAME_BOTTOM, 50);
    oOut.BeginHeader();
    oOut.BeginTable(100, COL_LOGO, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    oOut.TableRow();
    oOut.TableCell("", 26, "Arial", 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VCENTER, 0);
    oOut.OutGraphic(Context.createPicture(Constants.IMAGE_LOGO_LEFT), - 1, 40, 15);
    oOut.TableCell(Context.getScriptInfo(Constants.SCRIPT_TITLE), 48, "Arial", 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    oOut.TableCell("", 26, "Arial", 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_RIGHT | Constants.FMT_VCENTER, 0);
    oOut.OutGraphic(Context.createPicture(Constants.IMAGE_LOGO_RIGHT), - 1, 40, 15);
    oOut.EndTable("", 100, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOut.EndHeader();

    setBorderLine(Constants.FRAME_TOP, 50);
    oOut.BeginFooter();
    oOut.BeginTable(100, COL_LOGO, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    oOut.TableRow();
    oOut.TableCell("", 26, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VCENTER, 0);
    oOut.OutputField(Constants.FIELD_DATE, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT);
    oOut.Output(" ", "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    oOut.OutputField(Constants.FIELD_TIME, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT);
    oOut.TableCell(Context.getSelectedFile(), 48, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    oOut.TableCell("", 26, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_RIGHT | Constants.FMT_VCENTER, 0);
    oOut.Output("Page ", "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_RIGHT, 0);
    oOut.OutputField(Constants.FIELD_PAGE, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_RIGHT);
    oOut.Output(" of ", "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_RIGHT, 0);
    oOut.OutputField(Constants.FIELD_NUMPAGES, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_RIGHT);
    oOut.EndTable("", 100, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    oOut.EndFooter();
    
    initFrameStyle();
}
