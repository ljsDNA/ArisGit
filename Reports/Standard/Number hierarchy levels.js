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


var g_nloc = Context.getSelectedLanguage();
var g_nattrpos = Constants.ATTROCC_TOPRIGHT;
var g_odefaultfont = getDefaultFont();

function main()
{
    var omethodfilter = ArisData.getActiveDatabase().ActiveFilter();   
    if (checkmethodfilter(omethodfilter)) {				// Check method filter
        var omodels = ArisData.getSelectedModels();
        if (omodels.length > 0) {
            
            for ( i = 0 ; i < (omodels.length - 1)+1 ; i++ ){
                var ocurrentmodel = omodels[i];
                
                if (!ocurrentmodel.canWrite(true/*p_bCheckAccessPermissions*/)) {
                    // BLUE-11382 Model is opened
                    Dialogs.MsgBox(formatstring1(getString("TEXT7"), ocurrentmodel.Name(g_nloc)), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, getString("TEXT3"));
                    continue;
                } 
				
				var odoneobjdefs = new __holder(new Array());   // List containing the done elements (Def).
				var odoneobjoccs = new __holder(new Array());   // List containing the done elements (Occ).
                
                if (omethodfilter.GraphType(ocurrentmodel.TypeNum()) == Constants.GT_TREE) {
                    
                    ocurrentmodel.BuildGraph(true);				                    // Model graph (to get the start nodes)
                    
                    var orootobjoccs = ocurrentmodel.StartNodeList();				// Get start nodes (root objects)
                    if (orootobjoccs.length > 0) {
						var scurrattr = "";					
                        
                        // iterate through root objects
                        for (var j = 0; j < orootobjoccs.length; j++) {
                            var ocurrentobjocc = orootobjoccs[j];
                            var ocurrentobjdef = ocurrentobjocc.ObjDef();
                            
                            var ocurrattrocc = ocurrentobjocc.AttrOcc(Constants.AT_HIER_NUM);
                            if (ocurrattrocc.IsValid()) {
							
                                var ocurrattrdef = ocurrentobjdef.Attribute(Constants.AT_HIER_NUM, g_nloc);
                                scurrattr = ""+(j + 1);
                                ocurrattrdef.SetValue(scurrattr, 0);		// Number of root = j + 1 -> attribut
                                
                                if (ocurrattrocc.Exist()) {
                                    ocurrattrocc.SetPortOptions(g_nattrpos, Constants.ATTROCC_TEXT);
                                }
                                else {
                                    ocurrattrocc.Create(g_nattrpos, g_odefaultfont);
                                }
                            }
                            outnextnode(ocurrentobjocc, odoneobjoccs, odoneobjdefs, scurrattr, Constants.EDGES_ALL);      // Get next node and set attribut
                        }
                    }
                }else {
                    Dialogs.MsgBox(getString("TEXT1") + ocurrentmodel.Name(g_nloc) + getString("TEXT2"), Constants.MSGBOX_BTN_OK, getString("TEXT3"));
                }
            }
        } else {
            Dialogs.MsgBox(getString("TEXT4"), Constants.MSGBOX_BTN_OK, getString("TEXT3"));
        }
    }
    Context.setScriptError(Constants.ERR_NOFILECREATED);
}


function outnextnode(ocurrentobjocc, odoneobjoccs, odoneobjdefs, scurrattr, nedgetype)
{
    // List of predecessors
    var onextcxns = ocurrentobjocc.OutEdges(nedgetype);     // Edges to predecessor
    if (onextcxns.length == 0) {
        return;
    }
    
    var onextobjoccs = new Array();    
    for (var i = 0; i < onextcxns.length; i++) {
        onextobjoccs[onextobjoccs.length] = onextcxns[i].TargetObjOcc();        // (Predecessor-)node
    }
    
    // Set predecessors and number
    if (onextobjoccs.length == 0) {
        return;
    }
    
    var nnextnum = 0;       // Number    
    
    onextobjoccs = ArisData.sort(onextobjoccs, Constants.SORT_GEOMETRIC, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
    for (var j = 0; j < onextobjoccs.length; j++) {
        nnextnum++;         // Number for next node
        
        var onextobjocc = onextobjoccs[j];
        if (notinocclist(onextobjocc, odoneobjoccs) == true) {
            odoneobjoccs.value[odoneobjoccs.value.length] = onextobjocc;
            
            var snextattr = scurrattr + "." + nnextnum;       // Build number
            setattribute(onextobjocc, odoneobjdefs, snextattr);
            outnextnode(onextobjocc, odoneobjoccs, odoneobjdefs, snextattr, Constants.EDGES_ALL);     // get next node
        }
    }
}

function setattribute(onextobjocc, odoneobjdefs, snextattr)
{
    var onextattrocc = onextobjocc.AttrOcc(Constants.AT_HIER_NUM);
    if (onextattrocc.IsValid()) {
        var onextobjdef = onextobjocc.ObjDef();
        var onextattrdef = onextobjdef.Attribute(Constants.AT_HIER_NUM, g_nloc);
        
        if (notindeflist(onextobjdef, odoneobjdefs.value) == true) {
            onextattrdef.SetValue(snextattr, 0);  // Number -> Attribut
            odoneobjdefs.value[odoneobjdefs.value.length] = onextobjdef;
        }
        if (onextattrocc.Exist()) {
            onextattrocc.SetPortOptions(g_nattrpos, Constants.ATTROCC_TEXT);
        } else {
            onextattrocc.Create(g_nattrpos, g_odefaultfont);
        }
    }
}

function notindeflist(ocurrentobjdef, odoneobjdefs)
{
    if (odoneobjdefs.length > 0) {
        for (var i = 0; i < odoneobjdefs.length; i++) {
            if (odoneobjdefs[i].IsEqual(ocurrentobjdef)) {
                return false;
            }
        }
    }
    return true;
}

function notinocclist(ocurrentobjocc, odoneobjoccs)
{
    if (odoneobjoccs.value.length > 0) {
        for (var i = 0; i < odoneobjoccs.value.length; i++) {
            if (odoneobjoccs.value[i].IsEqual(ocurrentobjocc)) {
                return false;
            }
        }
    }
    return true;
}

function checkmethodfilter(omethodfilter)
{
    if (omethodfilter.IsValidAttrType(Constants.CID_OBJDEF, Constants.OT_FUNC, Constants.AT_HIER_NUM)) {
        return true;
    } else {
        var serror = formatstring1(getString("TEXT5"), omethodfilter.Name(g_nloc)) + "\r\n" + "\r\n" + 
        formatstring2(getString("TEXT6"), omethodfilter.ObjTypeName(Constants.OT_FUNC), omethodfilter.AttrTypeName(Constants.AT_HIER_NUM));
        Dialogs.MsgBox(serror, Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_ERROR, getString("TEXT3"));
        return false;
    }
}

function getDefaultFont() {
    var ofontstylelist = ArisData.getActiveDatabase().FontStyleList();
    for (var i = 0; i < ofontstylelist.length; i++) {
        if (ofontstylelist[i].IsDefaultFontStyle()) {
            return ofontstylelist[i];
        }
    }
    return null;
}


main();
