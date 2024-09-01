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

OPTIONS_TYPE = function() {
    this.bAttr          = false;
    this.bCxn           = false;    
    this.bEnhancedCxns  = false;
    this.bEnhancedAttrs = false;
    this.bOccLevel      = false;
}

OBJECT_TYPE = function(p_typeNum, p_objArray) {
    this.typeNum    = p_typeNum;
    this.objArray   = p_objArray;
}

var c_nTABLE_SIZE = 250;
var c_nCELL_WIDTH = 20;

var g_oDB       = ArisData.getActiveDatabase();
var g_oFilter   = ArisData.ActiveFilter();
var g_nloc      = Context.getSelectedLanguage(); // Variable for the ID of the current language.
var g_ooutfile  = Context.createOutputObject(); // Object used for the output of the report.
var g_ntab      = 1; 

var g_bShowRelSelection = (getObjOccSelection().length > 0);        // ObjOccs selected -> show selection of relations       

/***********************************************************/

function outputObjectInformation() {
    var oModels = getModelSelection();
    
    var oObjDefs = getObjDefSelection();
    if (oObjDefs.length == 0) {
        if (!hasProperties()) Dialogs.MsgBox(getString("TEXT16"), Constants.MSGBOX_BTN_OK, getString("TEXT15"));
        return;
    }
    oObjDefs = ArisData.Unique( oObjDefs );
    oObjDefs = ArisData.sort( oObjDefs, Constants.SORT_TYPE, Constants.AT_NAME, g_nloc );

    var options = new OPTIONS_TYPE();
    if (getOptions(options)) {

        var objArrays   = getObjectArrays( oObjDefs );
        var cxnArrays   = [];
        if( (options.bAttr) || ((options.bCxn) && (options.bEnhancedCxns)) ){
            cxnArrays   = getCxnArrays( oObjDefs, oModels, options.bOccLevel );
        }
        if (options.bAttr) {
            // Evaluation of object attributes?
            outObjectAttributes( oObjDefs, options, cxnArrays );
        }
        if (options.bCxn) {
            // Output of object relationships?
            if ( options.bEnhancedCxns ) {
                outRelationsEnhanced( cxnArrays );
            } else {
                outRelationsDefault( objArrays, oModels, options.bOccLevel );
            }
        }
        g_ooutfile.WriteReport();
    } else {
        Context.setScriptError( Constants.ERR_CANCEL );
    }
}


function getModelSelection() {
    var oSelectedModels = ArisData.getSelectedModels();
    if (oSelectedModels.length == 0) {
        
        var oSelectedObjOccs = ArisData.getSelectedObjOccs();
        if (oSelectedObjOccs.length > 0) {
            for (var i = 0; i < oSelectedObjOccs.length; i++) {
                oSelectedModels.push(oSelectedObjOccs[i].Model());
            }
            oSelectedModels = ArisData.Unique(oSelectedModels);
        }
    }
    return oSelectedModels;
}


function getObjOccSelection() {
    var oSelectedObjOccs = ArisData.getSelectedObjOccs();
    if (oSelectedObjOccs.length == 0) {
        
        var oSelectedModels = ArisData.getSelectedModels();
        for (var i = 0; i < oSelectedModels.length; i++) {
            oSelectedObjOccs = oSelectedObjOccs.concat(oSelectedModels[i].ObjOccList());
        }
    }
    return oSelectedObjOccs;
}


function getObjDefSelection() {
    var oSelectedObjDefs = ArisData.getSelectedObjDefs();
    if (oSelectedObjDefs.length == 0) {
        
        var oSelectedModels = ArisData.getSelectedModels();
        for (var i = 0; i < oSelectedModels.length; i++) {
            oSelectedObjDefs = oSelectedObjDefs.concat(oSelectedModels[i].ObjDefList());
        }
        oSelectedObjDefs = ArisData.Unique(oSelectedObjDefs);
    }
    return oSelectedObjDefs;
}


function getObjectArrays(oObjDefs) {
    var objectMap = new java.util.HashMap();
    
    for (var i = 0; i < oObjDefs.length; i++) {
        var oObjDef = oObjDefs[i];
        var typeNum = getTypeNum(oObjDef);
        
        if (!objectMap.containsKey(typeNum)) {
            objectMap.put(typeNum, new Array());
        }
        objectMap.get(typeNum).push(oObjDef);
    }

    var objArrays = new Array();
    var iter = objectMap.keySet().iterator();
    while (iter.hasNext()) {
        var typeNum = iter.next();
        var currObjArray = objectMap.get(typeNum);
        objArrays.push(new OBJECT_TYPE(typeNum, currObjArray));
    }
    return objArrays.sort(sortType);
    
    function sortType(a, b) {
        return StrComp(g_oFilter.ObjTypeName(a.typeNum), g_oFilter.ObjTypeName(b.typeNum));
    }
}


function getTargetObjects( p_Defs, p_Cxns ){
    var aOut    = new Array();
    for(var i = 0; i < p_Cxns.length; i++){
        var currCxnArray = p_Cxns[i].objArray;
        for (var j = 0 ; j<currCxnArray.length ; j++ ) {
            // var oSrcDef = currCxnArray[j].SourceObjDef();
            var oTrgDef = currCxnArray[j].TargetObjDef();
            if( !p_Defs.contains( oTrgDef ) ){
                aOut.push( oTrgDef );
            }
        }//END::for_j
    }//END::for_i
    
    return aOut;
}


function getEnhObjectArrays( p_Defs, p_Options, p_Cxns ){
     if( p_Options.bEnhancedAttrs && p_Options.bEnhancedCxns ){
        var aTargetObjs = getTargetObjects( p_Defs, p_Cxns );
        p_Defs  = p_Defs.concat( aTargetObjs );
    }
    return getObjectArrays( ArisData.Unique( p_Defs ) );
}


function outObjectAttributes( p_Defs, p_Options, p_Cxns ){
    var objArrays   = getEnhObjectArrays( p_Defs, p_Options, p_Cxns );
    for (var i = 0; i < objArrays.length; i++) {
        var typeNum = objArrays[i].typeNum;
        var currObjArray = objArrays[i].objArray;
        
        var mAttrMap = g_oDB.ItemAttrMap(currObjArray, g_nloc);                
        // List is filled with the valid attribute type numbers of the current object type.
        var lobjattrtypenumlist = getSortedAttrTypeList(mAttrMap, g_oFilter.AttrTypes(Constants.CID_OBJDEF, typeNum));
        
        // Checks whether there are more than 256 attributes.
        var nstartpar = 0;
        var nendpar = (lobjattrtypenumlist.length < c_nTABLE_SIZE) ? lobjattrtypenumlist.length : c_nTABLE_SIZE;
        var bend = false;
        
        if (p_Options.bEnhancedCxns) g_ntab = -1; // Output without leading index
        
        while (! (bend)) {
            g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            g_ooutfile.TableRow();
            // Output of attribute types of the current object.
            g_ooutfile.TableCell(g_oFilter.AttrTypeName(Constants.AT_NAME), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);       // TANR 528974
            g_ooutfile.TableCell(g_oFilter.AttrTypeName(Constants.AT_TYPE_6), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);     // TANR 528974
            g_ooutfile.TableCell(getString("TEXT15"), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
            for (var j = nstartpar; j < nendpar; j++) {
                var nTypeNum = lobjattrtypenumlist[j];
                if (nTypeNum == Constants.AT_NAME) continue;
                if (nTypeNum == Constants.AT_TYPE_6) continue;  // BLUE-13386                        
                
                g_ooutfile.TableCell(g_oFilter.AttrTypeName(nTypeNum), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            }
            var bColored = false;   // variable to change background color of table rows                        
            
            for (var g = 0 ; g < currObjArray.length ; g++ ) {
                var ocurrentobject = currObjArray[g];
                
                g_ooutfile.TableRow();
                g_ooutfile.TableCell(getItemName(ocurrentobject), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                g_ooutfile.TableCell(ocurrentobject.Type(), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                g_ooutfile.TableCell(ocurrentobject.GUID(), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                
                // Output of attributes.
                var sGuid = ocurrentobject.GUID();
                if (mAttrMap.containsKey(sGuid)) {
                    var mAttrMap2 = mAttrMap.get(sGuid);
                    
                    for (var j = nstartpar ; j < nendpar ; j++ ){
                        var sAttrValue = "";
                        var nTypeNum = new java.lang.Integer(lobjattrtypenumlist[j]);
                        if (nTypeNum == Constants.AT_NAME) continue;
                        if (nTypeNum == Constants.AT_TYPE_6) continue;  // BLUE-13386                        
                        
                        if (mAttrMap2.containsKey(nTypeNum)) {
                            sAttrValue = mAttrMap2.get(nTypeNum).GetValue(true);
                        }
                        g_ooutfile.TableCell(sAttrValue, c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);                    
                    }
                }
                bColored = !bColored; // Change background color 
            }
            
            var sFootText = getFooterText(currObjArray[0].Type(), g_ntab);
            g_ooutfile.EndTable(sFootText, 100, getString("TEXT14"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            g_ntab = Math.abs(g_ntab)+1;
            
            if (nendpar < lobjattrtypenumlist.length) {
                var nreminder = lobjattrtypenumlist.length - nendpar;
                nstartpar = nendpar;
                nendpar = nendpar + Math.min(nreminder, c_nTABLE_SIZE);
            } else {
                bend = true;
            }
        }
    }//END::for_i
}//END::outObjectAttributes()

function outRelationsEnhanced( cxnArrays ) {
    for(var i = 0; i < cxnArrays.length; i++){
        var typeNum = cxnArrays[i].typeNum;
        var currCxnArray = cxnArrays[i].objArray;
        var cxnAttrTypes = getCxnAttrTypes(currCxnArray);
        
        // Checks whether there are more than 256 attributes.
        var nstartpar = 0;
        var nendpar = (cxnAttrTypes.length < c_nTABLE_SIZE) ? cxnAttrTypes.length : c_nTABLE_SIZE;
        var bend = false;

        g_ntab = -1; // Output without leading index

        while (! (bend)) {
            g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            g_ooutfile.TableRow();
            // Output of attribute types of the current cxn.
            g_ooutfile.TableCell(getString("TEXT18"), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
            g_ooutfile.TableCell(getString("TEXT19"), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
            g_ooutfile.TableCell(getString("TEXT20"), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
            g_ooutfile.TableCell(getString("TEXT21"), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
            g_ooutfile.TableCell(getString("TEXT22"), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
            g_ooutfile.TableCell(getString("TEXT23"), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
            for (var j = nstartpar; j < nendpar; j++) {
                var nTypeNum = cxnAttrTypes[j];
                g_ooutfile.TableCell(g_oFilter.AttrTypeName(nTypeNum), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            }
            var bColored = false;   // variable to change background color of table rows                        
            
            for (var g = 0 ; g < currCxnArray.length ; g++ ) {
                var currCxn = currCxnArray[g];
                var currSourceDef = currCxn.SourceObjDef();
                var currTargetDef = currCxn.TargetObjDef();
                
                g_ooutfile.TableRow();
                g_ooutfile.TableCell(getItemName(currSourceDef), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                g_ooutfile.TableCell(currSourceDef.Type(), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                g_ooutfile.TableCell(currSourceDef.GUID(), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                g_ooutfile.TableCell(getItemName(currTargetDef), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                g_ooutfile.TableCell(currTargetDef.Type(), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                g_ooutfile.TableCell(currTargetDef.GUID(), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
                
                // Output of attributes.
                for (var j = nstartpar ; j < nendpar ; j++ ){
                    var nTypeNum = cxnAttrTypes[j];
                    var sAttrValue = currCxn.Attribute(nTypeNum, g_nloc).getValue();
                    g_ooutfile.TableCell(sAttrValue, c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);                    
                }
                bColored = !bColored; // Change background color 
            }
            
            var sFootText = getFooterText(getCxnTypeName(typeNum), g_ntab);
            g_ooutfile.EndTable(sFootText, 100, getString("TEXT14"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            g_ntab = Math.abs(g_ntab)+1;
            
            if (nendpar < cxnAttrTypes.length) {
                var nreminder = cxnAttrTypes.length - nendpar;
                nstartpar = nendpar;
                nendpar = nendpar + Math.min(nreminder, c_nTABLE_SIZE);
            } else {
                bend = true;
            }
        }
    }//END::for_i
    
    function getCxnTypeName(typeNum) {
        var sCxnType = ArisData.ActiveFilter().ActiveCxnTypeName(typeNum)
        if (isCxnTypeUnique(typeNum)) {
            return sCxnType;
        }
        return formatstring2("@1 (@2)", sCxnType, typeNum);     // BLUE-21184 - Ensure that cxn type name is unique

        function isCxnTypeUnique(typeNum) {
            var sCxnType = g_oFilter.ActiveCxnTypeName(typeNum);          
            for(var i = 0; i < cxnArrays.length; i++) {
                if (cxnArrays[i].typeNum == typeNum) continue;
                if (StrComp(sCxnType, g_oFilter.ActiveCxnTypeName(cxnArrays[i].typeNum)) == 0) {
                    return false;
                }
            }
            return true;
        }        
    }
    
    function getCxnAttrTypes(currCxnArray) {
        var attrSet = new java.util.HashSet();

        for(var i = 0; i < currCxnArray.length; i++) {
            var attrList = currCxnArray[i].AttrList(g_nloc, true); 
            for(var j = 0; j < attrList.length; j++) {

                attrSet.add(getTypeNum(attrList[j]));
            }                
        }
        return attrSet.toArray().sort(sortAttrTypes);
        
        function sortAttrTypes(a, b) {
            return a - b;
        }    
    }
}//END::outRelationsEnhanced()


function getCxnArrays(oObjDefs, oModels, bOccLevel) {
    var cxnMap = new java.util.HashMap();
    
    for (var i = 0; i < oObjDefs.length; i++) {
        var oObjDef = oObjDefs[i];
        var cxnList = oObjDef.CxnList();
        for (var j = 0; j < cxnList.length; j++) {
            var oCxn = cxnList[j];
            
            if (checkCxnOcc(oCxn, oModels, bOccLevel)) {
                var typeNum = getTypeNum(oCxn);
                
                if (!cxnMap.containsKey(typeNum)) {
                    cxnMap.put(typeNum, new Array());
                }
                cxnMap.get(typeNum).push(oCxn);
            }
        }
    }
    
    var cxnArrays = new Array();
    var iter = cxnMap.keySet().iterator();
    while (iter.hasNext()) {
        var typeNum = iter.next();
        var currCxnArray = cxnMap.get(typeNum);
        cxnArrays.push(new OBJECT_TYPE(typeNum, ArisData.Unique(currCxnArray).sort(sortCxnArray)));
    }
    return cxnArrays.sort(sortCxnType);
    
    function sortCxnType(a, b) {
        return StrComp(g_oFilter.ActiveCxnTypeName(a.typeNum), g_oFilter.ActiveCxnTypeName(b.typeNum));
    }
    
    function sortCxnArray(a, b) {
        result = StrComp(a.SourceObjDef().Type(), b.SourceObjDef().Type());
        if (result == 0) result = StrComp(a.TargetObjDef().Type(), b.TargetObjDef().Type());
        if (result == 0) result = StrComp(a.SourceObjDef().Name(g_nloc), b.SourceObjDef().Name(g_nloc));
        if (result == 0) result = StrComp(a.TargetObjDef().Name(g_nloc), b.TargetObjDef().Name(g_nloc));
        return result;
    }
}//END::getCxnArrays()


function outRelationsDefault(objArrays, oModels, bOccLevel) {
    for (var i1 = 0; i1 < objArrays.length; i1++) {
        var objArray1 = objArrays[i1].objArray;

        for (var i2 = 0; i2 < objArrays.length; i2++) {
            var objArray2 = objArrays[i2].objArray;
        
            var cxnArrays = new Array();
            var legendSet = new java.util.TreeSet();
            
            for (var j1 = 0; j1< objArray1.length; j1++) {
                cxnArrays[j1] = new Array();
                
                var objDef1 = objArray1[j1];
                var cxnList = objDef1.CxnList();
                for (var j2 = 0; j2 < objArray2.length; j2++) {
                    cxnArrays[j1][j2] = new Array();
                    
                    var objDef2 = objArray2[j2];
                    for (var k = 0; k < cxnList.length; k++) {
                        var oCxn = cxnList[k];
                        
                        if (checkCxnOcc(oCxn, oModels, bOccLevel)) {
                            var sCxnTypeAndName = "";
                            if (oCxn.SourceObjDef().IsEqual(objDef1) && oCxn.TargetObjDef().IsEqual(objDef2)) {
                                sCxnTypeAndName = oCxn.ActiveType() + " (" + oCxn.TypeNum() + ")";
                            } else if (oCxn.SourceObjDef().IsEqual(objDef2) && oCxn.TargetObjDef().IsEqual(objDef1)) {
                                sCxnTypeAndName = oCxn.PassiveType() + " (" + oCxn.TypeNum() + ")";
                            }
                            if (sCxnTypeAndName.length != "") {
                                cxnArrays[j1][j2].push(sCxnTypeAndName);
                                legendSet.add(sCxnTypeAndName);
                            }
                        }
                    }
                }
            }
            outRelationTable(objArray1, objArray2, cxnArrays, legendSet);
        }
    }
    
    function outRelationTable(objArray1, objArray2, cxnArrays, legendSet) {
        if (legendSet.size() == 0) return;    // legend is empty because no cxn found -> no output 
        
        var aLegend = legendSet.toArray();
        
        var nstartpar = 0;
        var nendpar = (objArray2.length < c_nTABLE_SIZE) ? objArray2.length : c_nTABLE_SIZE;
        var bend = false;
        
        while (! (bend)) {
            g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        
            g_ooutfile.TableRow();
            g_ooutfile.TableCell("", c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
            for (var j = nstartpar; j < nendpar; j++) {
                g_ooutfile.TableCell(objArray2[j].Name(g_nloc), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            }
            var bColored = false;   // variable to change background color of table rows                        
            for (var i = 0; i < objArray1.length; i++) {
                g_ooutfile.TableRow();
                g_ooutfile.TableCell(objArray1[i].Name(g_nloc), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, COL_SAG_GREY_2, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
                for (var j = nstartpar; j < nendpar; j++) {
                    var sCxnValue = "";
                    var cxnArray = cxnArrays[i][j];
                    for (var k = 0; k < cxnArray.length; k++) {
                        cxnArray[k] = getCxnIndex(cxnArray[k], aLegend);
                    }
                    g_ooutfile.TableCell(cxnArray.sort().toString(), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
                }
                bColored = !bColored;
            }
            outLegend(aLegend);
        
            var sFootText = getFooterText(objArray1[0].Type() + " - " + objArray2[0].Type(), g_ntab);
            g_ooutfile.EndTable(sFootText, 100, getString("TEXT14"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            g_ntab++;        
            if (nendpar < objArray2.length) {
                var nreminder = objArray2.length - nendpar;
                nstartpar = nendpar;
                nendpar = nendpar + Math.min(nreminder, c_nTABLE_SIZE);
            } else {
                bend = true;
            }
        }
        
        function getCxnIndex(cxnTypeAndName, aLegend) {
            for (var i = 0; i < aLegend.length; i++) {
                if (StrComp(cxnTypeAndName, aLegend[i]) == 0) return (i+1);
            }
            return -1 // should never be reached
        }
        
        function outLegend(aLegend) {
            g_ooutfile.TableRow();                
            g_ooutfile.TableCell("", c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            g_ooutfile.TableCell("", c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            g_ooutfile.TableRow();        
            g_ooutfile.TableCell(getString("TEXT11"), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            g_ooutfile.TableCell("", c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            var bColored = false
            for (var i = 0; i < aLegend.length; i++) {
                g_ooutfile.TableRow();
                g_ooutfile.TableCell((i+1), c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
                g_ooutfile.TableCell(aLegend[i], c_nCELL_WIDTH, getString("TEXT14"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                bColored = !bColored;
            }
        }
    }
}//END::outRelationsDefault()

// -----------------------------------------------------------------
// Subroutine getSortedAttrTypeList
// Returns sorted list of maintained attribute type numbers.
// -----------------------------------------------------------------
function getSortedAttrTypeList(mAttrMap, aAllowedAttrs) {
    // Allowed attr types (sorted)
    var mSortedAttrs = new java.util.HashMap(); 
    for (var i = 0 ; i < aAllowedAttrs.length ; i++ ) {
        mSortedAttrs.put(new java.lang.Integer(aAllowedAttrs[i]), i);
    }
    // Maintained attr types
    var attrSet = new java.util.HashSet();    
    var iter = mAttrMap.keySet().iterator();
    while (iter.hasNext()) {
        var mAttrMap2 = mAttrMap.get(iter.next());
        var iter2 = mAttrMap2.keySet().iterator();
        while (iter2.hasNext()) {
            attrSet.add(iter2.next());
        }
    }
    // Return sorted list of maintained attr types
    var aAttrList = attrSet.toArray();
    return aAttrList.sort(sortByOrderNum);
    
    function sortByOrderNum(a, b) {
        return mSortedAttrs.get(new java.lang.Integer(a)) - mSortedAttrs.get(new java.lang.Integer(b));
    }    
}

// ********************************************************************************************************************
// *  Subroutine UserDlg1																	*
// *	This subprogram is needed for interrogating the user about the necessary settings for the report.		*
// ********************************************************************************************************************
function hasProperties() {
    return Context.getProperty("Prop_attributes") != null || Context.getProperty("Prop_cxns") != null;

}

function getOptions(options) {
    if (hasProperties()) {
        options.bAttr           = getBoolPropertyValue("Prop_attributes");
        options.bEnhancedAttrs  = getBoolPropertyValue("Prop_enhancedAttrs");
        options.bCxn            = getBoolPropertyValue("Prop_cxns");    
        options.bEnhancedCxns   = getBoolPropertyValue("Prop_enhancedCxns");
        options.bOccLevel       = g_bShowRelSelection && getBoolPropertyValue("Prop_occurenceLevel");
        return true;
    }
    return userdlg(options);
}

function userdlg(options) {
    var nuserdlg    = 0;   // Variable for the user dialog box
    var nattributes = 0;
    var nrelations  = 0;
    var nCxnsEnh    = 0;
    var nAttrsEnh   = 0;
    var nkindofrel  = 0;
    
    var bcheckdlg = false; 
    while (! bcheckdlg) {
        var userdialog = Dialogs.createNewDialogTemplate(0, 0, 360, 110, getString("TEXT1"), "dlgfuncuserdlg");
        userdialog.GroupBox(10, 0, 380, 55, getString("TEXT2"));
        userdialog.CheckBox(20, 15, 200, 15, getString("TEXT3"), "chkAttr");
        userdialog.CheckBox(40, 30, 320, 15, getString("TEXT24"), "chkEnhAttrs");
        
        userdialog.GroupBox(10, 65, 380, 80, getString("TEXT4"));
        userdialog.CheckBox(20, 80, 200, 15, getString("TEXT5"), "chkRel");
        userdialog.CheckBox(40, 95, 300, 15, getString("TEXT17"), "chkEnhCxns");
        userdialog.OptionGroup("optRelBase");
        userdialog.OptionButton(40, 110, 200, 15, getString("TEXT6"));
        userdialog.OptionButton(40, 125, 200, 15, getString("TEXT7"));
        userdialog.OKButton();
        userdialog.CancelButton();
        //    userdialog.HelpButton("HID_6ff15de0_eae1_11d8_12e0_9d2843560f51_dlg_01.hlp");
        
        var dlg1 = Dialogs.createUserDialog(userdialog); 
        
        // Read dialog settings from config    
        var sSection = "SCRIPT_6ff15de0_eae1_11d8_12e0_9d2843560f51";
        ReadSettingsDlgValue(dlg1, sSection, "chkAttr", 0);
        ReadSettingsDlgValue(dlg1, sSection, "chkEnhAttrs", 0);
        ReadSettingsDlgValue(dlg1, sSection, "chkRel", 0);
        ReadSettingsDlgValue(dlg1, sSection, "chkEnhCxns", 0);
        ReadSettingsDlgValue(dlg1, sSection, "optRelBase", 0);
        
        nuserdlg = Dialogs.show( __currentDialog = dlg1);
        // Showing dialog and waiting for confirmation with OK
        nattributes = dlg1.getDlgValue("chkAttr");
        nrelations  = dlg1.getDlgValue("chkRel");
        nCxnsEnh    = dlg1.getDlgValue("chkEnhCxns");
        nAttrsEnh   = dlg1.getDlgValue("chkEnhAttrs");
        nkindofrel  = dlg1.getDlgValue("optRelBase");

        if (nuserdlg == 0 || nattributes == 1 || nrelations == 1) {
            bcheckdlg = true;
        } else {
            if (!hasProperties()) Dialogs.MsgBox(getString("TEXT9"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_INFORMATION, "");
        }
    }
    
    // Write dialog settings to config  
    if (nuserdlg != 0) {
        WriteSettingsDlgValue(dlg1, sSection, "chkAttr");
        WriteSettingsDlgValue(dlg1, sSection, "chkEnhAttrs");
        WriteSettingsDlgValue(dlg1, sSection, "chkRel");
        WriteSettingsDlgValue(dlg1, sSection, "chkEnhCxns");
        WriteSettingsDlgValue(dlg1, sSection, "optRelBase");
        
        options.bAttr           = (nattributes != 0);
        options.bCxn            = (nrelations != 0);    
        options.bEnhancedCxns   = (nCxnsEnh != 0); 
        options.bEnhancedAttrs  = (nAttrsEnh != 0); 
        options.bOccLevel       = (nkindofrel != 0);
        return true;
    }
    return false;
}

function dlgfuncuserdlg(dlgItem, act, suppVal) {
    var bResult = true;
    switch(act)   {
        case 1:
            var bCxnsEnable = __currentDialog.getDlgValue("chkRel") != 0;
            __currentDialog.setDlgEnable("chkEnhCxns", bCxnsEnable);
            __currentDialog.setDlgEnable("optRelBase", bCxnsEnable && g_bShowRelSelection);
            if (!g_bShowRelSelection) __currentDialog.setDlgValue("optRelBase", 0);
            // Enable Enhanced Attributes output
            __currentDialog.setDlgEnable("chkEnhAttrs", (__currentDialog.getDlgValue("chkAttr") != 0) && 
                                                        (__currentDialog.getDlgValue("chkEnhCxns") != 0));
            // Enable Ok-Button
            __currentDialog.setDlgEnable("OK", (__currentDialog.getDlgValue("chkRel") != 0) || 
                                               (__currentDialog.getDlgValue("chkAttr") != 0));
            bResult = false;
            break;
        case 2:
            if (dlgItem == "chkRel") {
                var bCxnsEnable = __currentDialog.getDlgValue("chkRel")!=0;
                __currentDialog.setDlgEnable("chkEnhCxns", bCxnsEnable);
                __currentDialog.setDlgEnable("optRelBase", bCxnsEnable && g_bShowRelSelection);
                // Enable Ok-Button        
                __currentDialog.setDlgEnable("OK", (__currentDialog.getDlgValue("chkRel") != 0) || 
                                                   (__currentDialog.getDlgValue("chkAttr") != 0));
            } else if(dlgItem == "chkEnhCxns") {
                // Enable Enhanced Attributes output
                __currentDialog.setDlgEnable("chkEnhAttrs", (__currentDialog.getDlgValue("chkAttr") != 0) && 
                                                            (__currentDialog.getDlgValue("chkEnhCxns") != 0));
            } else if(dlgItem == "chkAttr") {
                // Enable Enhanced Attributes output
                __currentDialog.setDlgEnable("chkEnhAttrs", (__currentDialog.getDlgValue("chkAttr") != 0) && 
                                                            (__currentDialog.getDlgValue("chkEnhCxns") != 0));
                // Enable Ok-Button        
                __currentDialog.setDlgEnable("OK", (__currentDialog.getDlgValue("chkRel") != 0) || 
                                                   (__currentDialog.getDlgValue("chkAttr") != 0));
            } else if(dlgItem == "OK") {
                bResult = false;
            } else if(dlgItem == "Cancel") {
                bResult = false;
            }
            break;
    }
    return bResult;
}

function getBoolPropertyValue(p_sPropKey) {
    var property = Context.getProperty(p_sPropKey);
    if (property != null) {
        return (StrComp(property, "true") == 0);
    }
    return false;
}

function getItemName(oItem) {
    var sName = oItem.Name(g_nloc);
    if (sName.length == 0) sName = getString("TEXT12");
    return sName;
}

function getTypeNum(oItem) {
    return new java.lang.Integer(oItem.TypeNum());
}

function checkCxnOcc(oCxn, oModels, bOccLevel) {
    if (!bOccLevel) return true;
    for (var i = 0; i < oModels.length; i++) {
        if (oCxn.OccListInModel(oModels[i]).length > 0) return true;
    }
    return false;
}        

function getFooterText(sText, nIndex) {
    if (nIndex > 0) sText = "" + nIndex + ". " + sText;

    var npos = serchforspecialchar(sText);
    if (npos >= 0 && npos <= 31 ) {
        npos = Math.min(npos, 28);
        sText = sText.substr(0, npos);
        sText = sText + "...";
    } else {
        if (sText.length > 31) {
            sText = sText.substr(0, 28);
            sText = sText + "...";
        }
    }
    return sText;
}
