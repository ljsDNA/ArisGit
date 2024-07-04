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

function MEASFUNC_TYPE(p_oobjocc, p_dinfl) {    
    this.oobjocc = p_oobjocc;
    this.dinfl = p_dinfl;
}

function INFLUENCE_TYPE(p_oobjocc, p_dinfl, p_sperspname) {        
    this.oobjectobjocc = p_oobjocc;
    this.dinfl = p_dinfl;
    this.sperspname = p_sperspname;
    this.tmeaslist = new Array();
    this.tfunclist = new Array();
}

function MEASFUNCDEF_TYPE(p_oobjdef) {    
    this.oobjdef = p_oobjdef;
    this.dinflsum = 0.0;
}

// global declarations
var g_ooutfile;
var g_nloc = Context.getSelectedLanguage();
var g_bnoperspect = false;
// Colors
var g_nyellow = getColorByRGB(255, 255, 153);
var g_ngrey   = getColorByRGB(220, 220, 220);
var g_nblue   = getColorByRGB(153, 204, 255);

var cnoperspect = getString("TEXT_1"); 

function main() {
    var sname = ""; 
    var bformat = false; 
    var boutput = false; 
    var bsingleout_holder = new __holder(false); 
    
    if (Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX) {
        bformat = true;
    } else {
        if (Dialogs.MsgBox(getString("TEXT_2"), Constants.MSGBOX_BTN_YESNOCANCEL | Constants.MSGBOX_ICON_QUESTION, getString("TEXT_3")) == Constants.MSGBOX_RESULT_YES) {
            Context.setSelectedFormat(Constants.OutputXLS);
            Context.setSelectedFile(changeextension(Context.getSelectedFile(), "xls"));
            bformat = true;
        }
    }
    if (bformat) {
        g_ooutfile = Context.createOutputObject();
        //        g_ooutfile.Init(g_nloc);
        
        var oselectedmodels = ArisData.getSelectedModels();
        if (oselectedmodels.length > 0) {
            
            if (userdlg(bsingleout_holder)) {
                boutput = true;
                var otargetobjoccs = new Array();
                
                for (var i = 0; i < oselectedmodels.length ; i++) {
                    var ocurrentmodel = oselectedmodels[i];
                    
                    var ncount = gettargets(ocurrentmodel, otargetobjoccs);
                    if (ncount > 0) {
                        var tinfluence = new Array();
                        var oallmeasdefs = new Array();
                        var oallfuncdefs = new Array();
                        
                        for (var j = 0; j < otargetobjoccs.length; j++) {
                            var ocurrentobjocc = otargetobjoccs[j];
                            var dinfl = (1 / ncount);
                            
                            getinfluence(ocurrentobjocc, dinfl, tinfluence, oallmeasdefs, oallfuncdefs);
                            
                            if (bsingleout_holder.value) {
                                if (tinfluence.length > 0) {
                                    sname = getstring31(ocurrentobjocc.ObjDef().Name(g_nloc));
                                    outinfluence(ocurrentmodel, tinfluence, oallmeasdefs, oallfuncdefs, sname);
                                    // Reset
                                    var tinfluence = new Array();
                                    var oallmeasdefs = new Array();
                                    var oallfuncdefs = new Array();
                                }
                            }
                        }
                        
                        if (! bsingleout_holder.value) {
                            if (tinfluence.length > 0) {
                                sname = getstring31(ocurrentobjocc.ObjDef().Name(g_nloc));
                                outinfluence(ocurrentmodel, tinfluence, oallmeasdefs, oallfuncdefs, sname);
                            }
                        }
                    } else {
                        var smsg = getString("TEXT_4") + "\r\n";
                        smsg = smsg + getString("TEXT_5") + "\r\n";
                        smsg = smsg + getString("TEXT_6");
                        Dialogs.MsgBox(smsg, Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, getString("TEXT_3"));
                        
                        boutput = false;
                        break;
                    }
                    otargetobjoccs = new Array();
                }
            }
            
        }
    }
    if (boutput) {
        g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
    } else {
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}

function getinfluence(ocurrentobjocc, dinfl, tinfluence, oallmeasdefs, oallfuncdefs) {
    var nindex = objectinlist(ocurrentobjocc, tinfluence)
    if (nindex >= 0) {
        var doldinfl = tinfluence[nindex].dinfl;
        tinfluence[nindex].dinfl = getSum(dinfl, doldinfl);
    } else {
        nindex = tinfluence.length;
        tinfluence[nindex] = new INFLUENCE_TYPE(ocurrentobjocc, dinfl, getperspective(ocurrentobjocc));
        
        getmeasuresandfunctions(tinfluence[nindex], ocurrentobjocc, oallmeasdefs, oallfuncdefs);
    }
    
    var ocxnocclist = ocurrentobjocc.InEdges(Constants.EDGES_ALL);
    if (ocxnocclist.length > 0) {
        var nvaluesum = getcxnvaluesum(ocxnocclist);
        
        for (var i = 0; i < ocxnocclist.length; i++) {
            var ocurrentcxnocc = ocxnocclist[i];
            var osourceobjocc = ocurrentcxnocc.SourceObjOcc();
            
            var nvalue = getcxnvalue(ocurrentcxnocc);
            if (nvalue > 0) {
                var dnewinfl = dinfl * (nvalue / nvaluesum);
                
                getinfluence(osourceobjocc, dnewinfl, tinfluence, oallmeasdefs, oallfuncdefs);
            }
        }
    }
}

function objectinlist(osourceobjocc, tinfluence) {
    for (var i = 0; i <tinfluence.length; i++) {
        if (osourceobjocc.IsEqual(tinfluence[i].oobjectobjocc)) {
            return i;
        }
    }
    return -1;    
}

function gettargets(ocurrentmodel, otargetobjoccs) {
    var oobjocclist = ocurrentmodel.ObjOccList();
    if (oobjocclist.length > 0) {
        for (var i = 0; i < oobjocclist.length; i++) {
            var ocurrentobjocc = oobjocclist[i];
            
            switch(ocurrentobjocc.ObjDef().TypeNum()) {
                case Constants.OT_OBJECTIVE:
                case Constants.OT_CRIT_FACT:
                var bisok = true;
                var ocxnocclist = ocurrentobjocc.OutEdges(Constants.EDGES_ALL);
                if (ocxnocclist.length > 0) {
                    for (var j = 0; j < ocxnocclist.length; j++) {
                        var ocurrentcxnocc = ocxnocclist[j];
                        
                        switch(ocurrentcxnocc.CxnDef().TypeNum()) {
                            case Constants.CT_HAS_VERY_WEAK_INFL:
                            case Constants.CT_HAS_WEAK_INFL:
                            case Constants.CT_HAS_NORMAL_INFL:
                            case Constants.CT_HAS_STRONG_INFL:
                            case Constants.CT_HAS_FULL_INFL:
                            bisok = false;
                            break;
                        }
                    }
                }
                if (bisok) {
                    otargetobjoccs.push(ocurrentobjocc);
                }
                break;
            }
        }
    }
    return otargetobjoccs.length;
}

function getperspective(osourceobjocc) {
    var result = "";
    var bisok = false; 
    
    var ocxnocclist = osourceobjocc.InEdges(Constants.EDGES_ALL);
    if (ocxnocclist.length > 0) {
        for (var i = 0; i < ocxnocclist.length; i++) {
            var ocurrentobjocc = ocxnocclist[i].SourceObjOcc();
            if (ocurrentobjocc.ObjDef().TypeNum() == Constants.OT_PERSPECT) {
                bisok = true;
                result = ocurrentobjocc.ObjDef().Name(g_nloc);
                break;
            }
        }
    }
    
    // No cxn to perspective object
    if (! bisok) {
        g_bnoperspect = true;
        result = cnoperspect;
    }
    return result;
}

function getmeasuresandfunctions(tinfluence, osourceobjocc, oallmeasdefs, oallfuncdefs) {
    var n_holder = new __holder(0);
    var oassobjocc = getassignedobjective(osourceobjocc);
    if (oassobjocc != null) {
        var oincxnoccs = oassobjocc.InEdges(Constants.EDGES_ALL);
        if (oincxnoccs.length > 0) {
            for (var i = 0; i < oincxnoccs.length; i++) {
                var oincxnocc = oincxnoccs[i];
                var ocurrentobjocc = oincxnocc.SourceObjOcc();
                var ocurrentobjdef = ocurrentobjocc.ObjDef();
                
                var dinfl = 0.0;
                if (oincxnocc.CxnDef().Attribute(Constants.AT_DEGREE_OF_INFL, g_nloc).IsMaintained()) {
                    dinfl = oincxnocc.CxnDef().Attribute(Constants.AT_DEGREE_OF_INFL, g_nloc).GetValue(false);
                }
                
                switch(ocurrentobjocc.ObjDef().TypeNum()) {
                    case Constants.OT_FUNC_INST:
                    tinfluence.tmeaslist.push(new MEASFUNC_TYPE(ocurrentobjocc, dinfl));
                    
                    if (! iselementinlist(ocurrentobjdef, oallmeasdefs, n_holder)) {
                        oallmeasdefs.push(ocurrentobjdef);
                    }
                    break;
                    case Constants.OT_FUNC:
                    tinfluence.tfunclist.push(new MEASFUNC_TYPE(ocurrentobjocc, dinfl));
                    
                    if (! iselementinlist(ocurrentobjdef, oallfuncdefs, n_holder)) {
                        oallfuncdefs.push(ocurrentobjdef);
                    }
                    break;
                }
            }
        }
    }
}

function getassignedobjective(osourceobjocc) {
    var oassmodels = osourceobjocc.ObjDef().AssignedModels();
    if (oassmodels.length > 0) {
        for (var i = 0; i < oassmodels.length; i++) {
            var oassmodel = oassmodels[i];
            if (oassmodel.OrgModelTypeNum() == Constants.MT_KPI_ALLOC_DGM) {
                // only first model of type is written into list - Cond.: for every target object exists only one assigned model
                var oassobjoccs = osourceobjocc.ObjDef().OccListInModel(oassmodel);
                if (oassobjoccs.length > 0) {
                    for (var j = 0; j < oassobjoccs.length; j++) {
                        var oassobjocc = oassobjoccs[j];
                        
                        switch(oassobjocc.ObjDef().TypeNum()) {
                            case Constants.OT_OBJECTIVE:
                            case Constants.OT_CRIT_FACT:
                            
                            return oassobjocc;
                        }
                    }
                    
                }
            }
        }
        
    }
    return null;
}

function getcxnvalue(ocurrentcxnocc) {
    switch(ocurrentcxnocc.CxnDef().TypeNum()) {
        case Constants.CT_HAS_VERY_WEAK_INFL:
            return 1;
        case Constants.CT_HAS_WEAK_INFL:
            return 2;
        case Constants.CT_HAS_NORMAL_INFL:
            return 3;
        case Constants.CT_HAS_STRONG_INFL:
            return 4;
        case Constants.CT_HAS_FULL_INFL:
            return 5;
        default:
            return 0;
    }
}

function getcxnvaluesum(ocxnocclist) {
    var nvaluesum = 0; 
    for(var i = 0; i < ocxnocclist.length; i++) {
        nvaluesum = getSum(nvaluesum, getcxnvalue(ocxnocclist[i]));
    }
    return nvaluesum;
}

function outinfluence(ocurrentmodel, tinfluence, oallmeasdefs, oallfuncdefs, sname) {
    var tmeasdeflist = new Array(); 
    var tfuncdeflist = new Array(); 
    var sperspname = new Array();     
    
    g_ooutfile.DefineF("HEAD1_grey", getString("TEXT_7"), 10, Constants.C_BLACK, g_ngrey, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("HEAD2_blue", getString("TEXT_7"), 10, Constants.C_BLACK, g_nblue, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_VERT_UP, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("HEAD2_yellow", getString("TEXT_7"), 10, Constants.C_BLACK, g_nyellow, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_VERT_UP, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("HEAD3_grey", getString("TEXT_7"), 10, Constants.C_BLACK, g_ngrey, Constants.FMT_BOLD | Constants.FMT_RIGHT | Constants.FMT_VCENTER, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("HEAD4_blue", getString("TEXT_7"), 10, Constants.C_BLACK, g_nblue, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_VCENTER, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("HEAD4_yellow", getString("TEXT_7"), 10, Constants.C_BLACK, g_nyellow, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_VCENTER, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("HEAD5_grey", getString("TEXT_7"), 10, Constants.C_BLACK, g_ngrey, Constants.FMT_BOLD | Constants.FMT_RIGHT | Constants.FMT_VERT_UP, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("TEXT1", getString("TEXT_7"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("TEXT1_grey", getString("TEXT_7"), 10, Constants.C_BLACK, g_ngrey, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("TEXT1_grey_it", getString("TEXT_7"), 10, Constants.C_BLACK, g_ngrey, Constants.FMT_ITALIC | Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("TEXT2_blue", getString("TEXT_7"), 10, Constants.C_BLACK, g_nblue, Constants.FMT_CENTER | Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("TEXT2_yellow", getString("TEXT_7"), 10, Constants.C_BLACK, g_nyellow, Constants.FMT_CENTER | Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("TEXT3_grey", getString("TEXT_7"), 10, Constants.C_BLACK, g_ngrey, Constants.FMT_RIGHT | Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("TEXT4_blue", getString("TEXT_7"), 10, Constants.C_BLACK, g_nblue, Constants.FMT_CENTER | Constants.FMT_VERT_UP, 0, 0, 0, 0, 0, 1);
    g_ooutfile.DefineF("TEXT4_yellow", getString("TEXT_7"), 10, Constants.C_BLACK, g_nyellow, Constants.FMT_CENTER | Constants.FMT_VERT_UP, 0, 0, 0, 0, 0, 1);
    
    oallmeasdefs.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc).compare);
    oallfuncdefs.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc).compare);
    
    g_ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF("", 25, "TEXT1");
    g_ooutfile.TableCellF("", 25, "TEXT1");
    g_ooutfile.TableCellF("", 15, "TEXT1");
    g_ooutfile.TableCellF(getString("TEXT_8"), 15, "HEAD5_grey");
    
    for (var i = 0; i < oallmeasdefs.length; i++) {
        tmeasdeflist.push(new MEASFUNCDEF_TYPE(oallmeasdefs[i]));
        g_ooutfile.TableCellF(oallmeasdefs[i].Name(g_nloc), 5, "HEAD2_blue");   // Measure name
    }
    
    for (var i = 0; i < oallfuncdefs.length; i++) {
        tfuncdeflist.push(new MEASFUNCDEF_TYPE(oallfuncdefs[i]));
        g_ooutfile.TableCellF(oallfuncdefs[i].Name(g_nloc), 5, "HEAD2_yellow"); // Function name
    }
    
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF(getString("TEXT_9"), 25, "HEAD1_grey");
    g_ooutfile.TableCellF(getString("TEXT_10"), 25, "HEAD1_grey");
    g_ooutfile.TableCellF(getString("TEXT_11"), 15, "HEAD1_grey");
    g_ooutfile.TableCellF(getString("TEXT_12"), 15, "HEAD1_grey");
    
    for (var i = 0; i < oallmeasdefs.length; i++) {
        g_ooutfile.TableCellF("", 5, "HEAD2_blue");
    }
    
    for (var i = 0; i < oallfuncdefs.length; i++) {
        g_ooutfile.TableCellF("", 5, "HEAD2_yellow");
    }
    
    // List of perspective names
    var operspobjocclist = ocurrentmodel.ObjOccListFilter(Constants.OT_PERSPECT);
    if (operspobjocclist.length > 0) {
        operspobjocclist.sort(new ArraySortComparator(Constants.SORT_GEOMETRIC, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc).compare);     // Sort geometric
        for(var i = 0; i < operspobjocclist.length; i++) {
            sperspname.push(operspobjocclist[i].ObjDef().Name(g_nloc));
        }
    }
    if (g_bnoperspect) {
        // objects without cxn to perspective?
        sperspname.push(cnoperspect);
    }
    
    for (var i = 0; i < sperspname.length; i++) {
        var bfirst = true;
        for (var j = 0; j < tinfluence.length; j++) {
            
            if (StrComp(sperspname[i], tinfluence[j].sperspname) == 0) {
                g_ooutfile.TableRow();
                if (bfirst) {
                    // Perspective name
                    if (StrComp(sperspname[i], cnoperspect) == 0) {
                        g_ooutfile.TableCellF(sperspname[i], 25, "TEXT1_grey_it");
                    } else {
                        g_ooutfile.TableCellF(sperspname[i], 25, "TEXT1_grey");
                    }
                    bfirst = false;
                } else {
                    g_ooutfile.TableCellF("", 25, "TEXT1_grey");
                }
                
                g_ooutfile.TableCellF(tinfluence[j].oobjectobjocc.ObjDef().Name(g_nloc), 25, "TEXT1_grey");     // Objective name
                g_ooutfile.TableCellF(round4(tinfluence[j].dinfl), 15, "HEAD3_grey");                           // Objective influence
                
                var nindex = j;
                var nprio = getobjectiveprio(tinfluence, nindex);
                g_ooutfile.TableCellF(nprio, 15, "TEXT3_grey");         // Objective priority
                
                for (var k = 0; k < oallmeasdefs.length; k++) {
                    var oobjdef = oallmeasdefs[k];
                    
                    var dinfl = getinfldegree(oobjdef, tinfluence[j], true);
                    if (dinfl > 0) {
                        g_ooutfile.TableCellF(dinfl, 5, "TEXT2_blue");  // Measure influence degree
                        
                        var doldinfl = tmeasdeflist[k].dinflsum;
                        tmeasdeflist[k].dinflsum = getSum(doldinfl, (tinfluence[j].dinfl * dinfl));
                    } else {
                        g_ooutfile.TableCellF("", 5, "TEXT1");
                    }
                }
                
                for (var k = 0; k < oallfuncdefs.length; k++) {
                    var oobjdef = oallfuncdefs[k];
                    
                    var dinfl = getinfldegree(oobjdef, tinfluence[j], false);
                    if (dinfl > 0) {
                        g_ooutfile.TableCellF(dinfl, 5, "TEXT2_yellow");    // Function influence degree
                        
                        var doldinfl = tfuncdeflist[k].dinflsum;
                        tfuncdeflist[k].dinflsum = getSum(doldinfl, (tinfluence[j].dinfl * dinfl));
                    } else {
                        g_ooutfile.TableCellF("", 5, "TEXT1");
                    }
                }
            }
        }
    }
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF("", 25, "TEXT1");
    g_ooutfile.TableCellF("", 25, "TEXT1");
    g_ooutfile.TableCellF("", 15, "TEXT1");
    g_ooutfile.TableCellF(getString("TEXT_13"), 15, "HEAD1_grey");
    
    for (var i = 0; i < tmeasdeflist.length; i++) {
        g_ooutfile.TableCellF(round4(tmeasdeflist[i].dinflsum), 5, "HEAD4_blue");       // Measure influence
    }
    
    for (var i = 0; i < tfuncdeflist.length; i++) {
        g_ooutfile.TableCellF(round4(tfuncdeflist[i].dinflsum), 5, "HEAD4_yellow");     // Function influence
    }
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF("", 25, "TEXT1");
    g_ooutfile.TableCellF("", 25, "TEXT1");
    g_ooutfile.TableCellF("", 15, "TEXT1");
    
    g_ooutfile.TableCellF(getString("TEXT_12"), 15, "HEAD1_grey");
    
    for (var i = 0; i < tmeasdeflist.length; i++) {
        var nindex = i;
        var nprio = getmeasfuncprio(tmeasdeflist, nindex);
        g_ooutfile.TableCellF(nprio, 5, "TEXT2_blue");      // Measure priority
    }
    
    for (var i = 0; i < tfuncdeflist.length; i++) {
        var nindex = i;
        var nprio = getmeasfuncprio(tfuncdeflist, nindex);
        g_ooutfile.TableCellF(nprio, 5, "TEXT2_yellow");    // Function priority
    }
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF("", 25, "TEXT1");
    g_ooutfile.TableCellF("", 25, "TEXT1");
    g_ooutfile.TableCellF("", 15, "TEXT1");
    g_ooutfile.TableCellF(getString("TEXT_14"), 15, "HEAD5_grey");
    
    for (var i = 0; i < tmeasdeflist.length; i++) {
        var scosts = "";
        var oattribute = tmeasdeflist[i].oobjdef.Attribute(Constants.AT_COST_AVG_TOT, g_nloc);
        if (oattribute.IsMaintained()) {
            scosts = oattribute.GetValue(false);
        }
        g_ooutfile.TableCellF(scosts, 5, "TEXT4_blue");     // Measure costs
    }
    
    for(var i = 0; i < tfuncdeflist.length; i++) {
        var scosts = "";
        var oattribute = tfuncdeflist[i].oobjdef.Attribute(Constants.AT_COST_AVG_TOT, g_nloc);
        if (oattribute.IsMaintained()) {
            scosts = oattribute.GetValue(false);
        }
        g_ooutfile.TableCellF(scosts, 5, "TEXT4_yellow");   // Function costs
    }
    g_ooutfile.EndTable(sname, 100, getString("TEXT_7"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
    // Reset measure and function lists
    tmeasdeflist = new Array();
    tfuncdeflist = new Array();
}


function getobjectiveprio(tinfluence, nindex) {
    var nprio = 1;
    
    var dinfl_1 = tinfluence[nindex].dinfl;
    for (var i = 0; i < tinfluence.length; i++) {
        if (i != nindex) {
            var dinfl_2 = tinfluence[i].dinfl;
            if (dinfl_1 < dinfl_2) {
                nprio = nprio + 1;
            }
        }
    }
    return nprio;
}

function getmeasfuncprio(tmeasfuncdeflist, nindex) {
    var nprio = 1;
    
    var dinfl_1 = tmeasfuncdeflist[nindex].dinflsum;
    for (var i = 0; i < tmeasfuncdeflist.length; i++) {
        if (i != nindex) {
            var dinfl_2 = tmeasfuncdeflist[i].dinflsum;
            if (dinfl_1 < dinfl_2) {
                nprio = nprio + 1;
            }
        }
    }
    return nprio;
}

function getinfldegree(ocurrentobjdef, tinfluence, bismeas) {
    var dinfl = 0.0; 
    
    if (bismeas) {
        for (var i = 0; i < tinfluence.tmeaslist.length; i++) {
            if (ocurrentobjdef.IsEqual(tinfluence.tmeaslist[i].oobjocc.ObjDef())) {
                dinfl = getSum(dinfl, tinfluence.tmeaslist[i].dinfl);
            }
        }
    } else {
        for (var i = 0; i < tinfluence.tfunclist.length; i++) {
            if (ocurrentobjdef.IsEqual(tinfluence.tfunclist[i].oobjocc.ObjDef())) {
                dinfl = getSum(dinfl, tinfluence.tfunclist[i].dinfl);
            }
        }
    }
    return dinfl;
}

function getstring31(soutstring) {
    var soutstr = ""+soutstring;
    var nendpos = 28;
    
    var npos = serchforspecialchar(soutstr);
    if (npos != -1 && npos < nendpos) {
        soutstr = soutstr.substr(0, npos) + "...";
    } else {
        var nlength = soutstr.length;
        if (nlength > 31) {
            soutstr = soutstr.substr(0, nendpos) + "...";
        }
    }
    return soutstr;
}

function round4(ndigit) {
    return Math.floor(ndigit * 10000 + 0.5) / 10000;    
}

function userdlg(bsingleout_holder) {
    var result = false;
    var smultiout = getString("TEXT_15");
    var ssingleout = getString("TEXT_16");
    
    var userdialog = Dialogs.createNewDialogTemplate(0, 0, 450, 110, getString("TEXT_17"));
    // %GRID:10,7,1,1
    userdialog.Text(20, 10, 400, 14, getString("TEXT_18"));
    userdialog.OptionGroup("Options1");
    userdialog.OptionButton(30, 30, 400, 15, smultiout);
    userdialog.OptionButton(30, 50, 400, 15, ssingleout);
    userdialog.OKButton();
    userdialog.CancelButton();
//    userdialog.HelpButton("HID_b766e770_c4c8_11dc_1e13_0014224a1763_dlg_01.hlp");
    
    var dlg = Dialogs.createUserDialog(userdialog); 
    
    // Read dialog settings from config
    var sSection = "SCRIPT_b766e770_c4c8_11dc_1e13_0014224a1763";
    ReadSettingsDlgValue(dlg, sSection, "Options1", 0);
    
    var nuserdlg = Dialogs.show( __currentDialog = dlg);        // Showing dialog and waiting for confirmation with OK
    
    if (dlg.getDlgValue("Options1") == 0) {
        bsingleout_holder.value = false;
    } else {
        bsingleout_holder.value = true;
    }
    
    if (nuserdlg == 0) {
        result = false;
    } else {
        // Write dialog settings to config    
        WriteSettingsDlgValue(dlg, sSection, "Options1");

        result = true;
    }
    return result;
}

function getSum(value1, value2) {
    return (Number(value1) + Number(value2));
}


main();
