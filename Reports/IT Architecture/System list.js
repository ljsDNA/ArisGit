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

function OPTIONS_TYPE() {
    this.nSelection = 0;
    this.nState = 0;
    this.nAssign = 0;
    this.bSuppOnly = false;
    this.bShowCxns = false;
    this.bAddLegend = false;
}

// IT-STANDARD (IT-KOMPONENTE)
var aOT_IT_STANDARD = new Array();
aOT_IT_STANDARD.push(Constants.OT_TECH_TRM);
aOT_IT_STANDARD.push(Constants.OT_PERF);
aOT_IT_STANDARD.push(Constants.OT_INFO_CARR);
aOT_IT_STANDARD.push(Constants.OT_CLST);
aOT_IT_STANDARD.push(Constants.OT_NW_PROT);
aOT_IT_STANDARD.push(Constants.OT_FUNC);
aOT_IT_STANDARD.push(Constants.OT_APPL_SYS_TYPE);
aOT_IT_STANDARD.push(Constants.OT_HW_CMP_TYPE);

// IT-SYSTEM (ANWENDUNGSSYSTEM)
var aOT_IT_SYSTEM = new Array();
aOT_IT_SYSTEM.push(Constants.OT_APPL_SYS_TYPE);

// PROCESS
var aOT_PROCESS = new Array();
aOT_PROCESS.push(Constants.OT_FUNC);

var aMT_PROCESS_MODEL = new Array();
aMT_PROCESS_MODEL.push(Constants.MT_EEPC);
aMT_PROCESS_MODEL.push(Constants.MT_EEPC_MAT);
aMT_PROCESS_MODEL.push(Constants.MT_OFFICE_PROC);
aMT_PROCESS_MODEL.push(Constants.MT_IND_PROC);
aMT_PROCESS_MODEL.push(Constants.MT_PRCS_CHN_DGM);
aMT_PROCESS_MODEL.push(Constants.MT_PCD_MAT);
aMT_PROCESS_MODEL.push(Constants.MT_UML_ACTIVITY_DGM);
aMT_PROCESS_MODEL.push(Constants.MT_EEPC_COLUMN);
aMT_PROCESS_MODEL.push(Constants.MT_EEPC_ROW);
aMT_PROCESS_MODEL.push(Constants.MT_EEPC_TAB);
aMT_PROCESS_MODEL.push(Constants.MT_EEPC_TAB_HORIZONTAL);
aMT_PROCESS_MODEL.push(Constants.MT_VAL_ADD_CHN_DGM);

// CONNECTION TYPES BETWEEN IT SYSTEM AND PROCESS
var aCT_IT_SYSTEM_TO_PROCESS = new Array();
aCT_IT_SYSTEM_TO_PROCESS.push(Constants.CT_CAN_SUPP_1);
aCT_IT_SYSTEM_TO_PROCESS.push(Constants.CT_EXEC_2); // software robots

var g_nLoc = Context.getSelectedLanguage(); 
var g_oMethodFilter = ArisData.getActiveDatabase().ActiveFilter();

var g_oOutfile = Context.createOutputObject();

initStyles(g_oOutfile, getString("FONT"));

const CONV_RATE_PT_TO_MM = .3538;

// Column widths for the different output tables
var g_anColumnsProcessItSystem = convertToDoubles([44, 44, 12]);
var g_anColumnsProcessItSystemWithCxns = convertToDoubles([40, 16, 32, 12]);
var g_anColumnsItStandardItSystem = convertToDoubles([32, 24, 32, 12]);
var g_anColumnsProcessItSystemItStandard = convertToDoubles([26, 25, 12, 25, 12]);
var g_anColumnsProcessItSystemItStandardWithCxns = convertToDoubles([22, 16, 19, 12, 19, 12]);

main();

/* ---------------------------------------------------------------------------- */

function main() {
    var tOptions = new OPTIONS_TYPE();
    
    if (dlgSelectOptions(tOptions)) {
        outTitlePage(g_oOutfile, getString("FONT"), getReportTitle(tOptions.nSelection), getString("LABEL_DATE"), null, getString("TITLE_PAGE"));
        outHeaderFooter(g_oOutfile, getString("FONT"), getString("FOOTER_RIGHT"));
        
        setTableBorders(g_oOutfile);
        
        switch(tOptions.nSelection) {
            case 0: // ItStandard_ItSystem
                g_oOutfile.BeginTable(100, g_anColumnsItStandardItSystem, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_REPEAT_HEADER | Constants.FMT_LEFT, 0);  
                g_oOutfile.TableRow();
                g_oOutfile.TableCellF(getString("TEXT_2"), 1, 1, "TBL_HEAD");
                g_oOutfile.TableCellF(getString("TEXT_3"), 1, 1, "TBL_HEAD");
                g_oOutfile.TableCellF(getString("TEXT_4"), 1, 1, "TBL_HEAD");
                g_oOutfile.TableCellF(getString("TEXT_5"), 1, 1, "TBL_HEAD");
                
                var oItStandards = getSelectedObjects_ItStandard(0);
                outItStandard_ItSystem(oItStandards, tOptions.nState);
                break;
            case 1: // Process_ItSystem
                if (tOptions.bShowCxns) {
                    g_oOutfile.BeginTable(100, g_anColumnsProcessItSystemWithCxns, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_REPEAT_HEADER | Constants.FMT_LEFT, 0);  
                    g_oOutfile.TableRow();
                    g_oOutfile.TableCellF(getString("TEXT_6"), 1, 1, "TBL_HEAD");
                    g_oOutfile.TableCellF(getString("TEXT_24"), 1, 1, "TBL_HEAD");
                    g_oOutfile.TableCellF(getString("TEXT_4"), 1, 1, "TBL_HEAD");
                    g_oOutfile.TableCellF(getString("TEXT_5"), 1, 1, "TBL_HEAD");
                } else {
                    g_oOutfile.BeginTable(100, g_anColumnsProcessItSystem, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_REPEAT_HEADER | Constants.FMT_LEFT, 0);  
                    g_oOutfile.TableRow();
                    g_oOutfile.TableCellF(getString("TEXT_6"), 1, 1, "TBL_HEAD");
                    g_oOutfile.TableCellF(getString("TEXT_4"), 1, 1, "TBL_HEAD");
                    g_oOutfile.TableCellF(getString("TEXT_5"), 1, 1, "TBL_HEAD");
                }
            
                var oProcesses = getSelectedObjects_Process(tOptions.nAssign);
                var oAllProcesses = new Array();    // List of all processes - to avoid redundancies in assignments
                oAllProcesses = oAllProcesses.concat(oProcesses);
                outProcess_ItSystem(oProcesses, oAllProcesses, tOptions.nState, tOptions.nAssign, tOptions.bSuppOnly, 0, false, tOptions.bShowCxns);
                break;
            case 2: // Process_ItSystem_ItStandard
                if (tOptions.bShowCxns) {
                    g_oOutfile.BeginTable(100, g_anColumnsProcessItSystemItStandardWithCxns, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_REPEAT_HEADER | Constants.FMT_LEFT, 0);  
                    g_oOutfile.TableRow();            
                    g_oOutfile.TableCellF(getString("TEXT_6"), 1, 1, "TBL_HEAD");
                    g_oOutfile.TableCellF(getString("TEXT_24"), 1, 1, "TBL_HEAD");
                    g_oOutfile.TableCellF(getString("TEXT_4"), 1, 1, "TBL_HEAD");
                    g_oOutfile.TableCellF(getString("TEXT_5"), 1, 1, "TBL_HEAD");
                    g_oOutfile.TableCellF(getString("TEXT_7"), 1, 1, "TBL_HEAD");
                    g_oOutfile.TableCellF(getString("TEXT_5"), 1, 1, "TBL_HEAD");
                } else {
                    g_oOutfile.BeginTable(100, g_anColumnsProcessItSystemItStandard, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_REPEAT_HEADER | Constants.FMT_LEFT, 0);
                    g_oOutfile.TableRow();            
                    g_oOutfile.TableCellF(getString("TEXT_6"), 1, 1, "TBL_HEAD");
                    g_oOutfile.TableCellF(getString("TEXT_4"), 1, 1, "TBL_HEAD");
                    g_oOutfile.TableCellF(getString("TEXT_5"), 1, 1, "TBL_HEAD");
                    g_oOutfile.TableCellF(getString("TEXT_7"), 1, 1, "TBL_HEAD");
                    g_oOutfile.TableCellF(getString("TEXT_5"), 1, 1, "TBL_HEAD");
                }
                
                var oProcesses = getSelectedObjects_Process(tOptions.nAssign);
                var oAllProcesses = new Array();    // List of all processes - to avoid redundancies in assignments
                oAllProcesses = oAllProcesses.concat(oProcesses);
                outProcess_ItSystem_ItStandard(oProcesses, oAllProcesses, tOptions.nState, tOptions.nAssign, tOptions.bSuppOnly, 0, false, tOptions.bShowCxns);
                break;
        }  
        g_oOutfile.EndTable("", 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);        

        if (tOptions.bAddLegend) {
            var oLegendPicture = getLegendPicture(undefined, getString("TEXT_8"), getString("FONT"));
            if ((Context.getSelectedFormat() != Constants.OutputXLS) && (Context.getSelectedFormat() != Constants.OutputXLSX)) {
                g_oOutfile.OutputLn("", getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
                g_oOutfile.OutGraphic(oLegendPicture, 110, 500, 500);
            } else {
                g_oOutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_WHITE, Constants.FMT_LEFT, 0);
                g_oOutfile.TableRow();
                g_oOutfile.TableCell("", 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
                g_oOutfile.OutGraphic(oLegendPicture, -1, 80, 80);	// BLUE-18528
                g_oOutfile.EndTable(getString("TEXT_21"), 100, getString("TEXT_2"), FONT_SIZE, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT, 0);
            }
        }
        g_oOutfile.WriteReport();
    } else {
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}

function getSelectedObjects_ItStandard(p_nAssign) {
    return getSelectedObjects(aOT_IT_STANDARD, null, p_nAssign);
}

function getSelectedObjects_Process(p_nAssign) {
    return getSelectedObjects(aOT_PROCESS, aMT_PROCESS_MODEL, p_nAssign);
}
    
function getSelectedObjects(p_aObjTypeNums, p_aModelTypeNums, p_nAssign) {
    var oSelObjDefs = new Array();

    if (p_aModelTypeNums != null) {
        if(ArisData.getSelectedModels().length > 0) {
            var mList = ArisData.getSelectedModels();
            for (var i = 0; i < mList.length; i++) {

                for (var j = 0; j < p_aModelTypeNums.length; j++) {                
                    if (mList[i].TypeNum() == p_aModelTypeNums[j]) {
                        
                        for (var k = 0; k < p_aObjTypeNums.length; k++) {
                            oSelObjDefs = oSelObjDefs.concat(mList[i].ObjDefListFilter(p_aObjTypeNums[k]));
                        }
                        break;
                    }
                }
            }
        }
    }
    if(ArisData.getSelectedObjDefs().length > 0) {    
        var oList = ArisData.getSelectedObjDefs();
        for (var i = 0; i < oList.length; i++) {
            var oObjDef = oList[i];
            for (var j = 0; j < p_aObjTypeNums.length; j++) {
                if (oObjDef.TypeNum() == p_aObjTypeNums[j]) {
                    oSelObjDefs.push(oObjDef);
                    break;
                }
            }
        }
    }
    oSelObjDefs = ArisData.Unique(oSelObjDefs);
    oSelObjDefs.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_TYPE, Constants.SORT_NONE, g_nLoc).compare);
    return oSelObjDefs;
}

function outItStandard_ItSystem(p_oItStandards, p_nState) {
    var bColoredTableCell = false;        
    
    for (var i = 0; i < p_oItStandards.length; i++) {
        var oItStandard = p_oItStandards[i];
        var sItStandard_Name = "" + oItStandard.Name(g_nLoc);
        var sItStandard_Type = "" + oItStandard.Type();
        var oItSystems = getItSystemsOfItStandard(oItStandard, p_nState);
        var nRowSpanFirstCol = oItSystems.length;
        if (oItSystems.length > 0) {
            for (var j = 0; j < oItSystems.length; j++) {
                var oItSystem = oItSystems[j];
                outLine_4_ItStandardItSystem(sItStandard_Name, sItStandard_Type, "" + oItSystem.Name(g_nLoc), getStatePicture_Standardization(oItSystem), bColoredTableCell, nRowSpanFirstCol);
                nRowSpanFirstCol = null;
            }
        } else {
            outLine_4_ItStandardItSystem(sItStandard_Name, sItStandard_Type, "—", null, bColoredTableCell, 1)
        }
        bColoredTableCell = !bColoredTableCell;
    }
}

function outProcess_ItSystem(p_oProcesses, p_oAllProcesses, p_nState, p_nAssign, p_bSuppOnly, p_nCurrLevel, p_bColored, p_bShowCxns) {
    var bColoredTableCell = p_bColored;
    
    for (var i = 0; i < p_oProcesses.length; i++) {
        var oProcess = p_oProcesses[i];
        var sProcess_Name = oProcess.Name(g_nLoc);
        
        var mapItSystems = getItSystemsOfProcessWithCxns(oProcess, p_nState);
        if (!mapItSystems.isEmpty()) {
            var aoItSystems = mapItSystems.keySet().toArray();
            aoItSystems.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_TYPE, Constants.SORT_NONE, g_nLoc).compare);
            var nRowSpanFirstCol = aoItSystems.length;
            for (var j = 0; j < aoItSystems.length; j++) {
                var oItSystem = aoItSystems[j];
                var sItSystemName = oItSystem.Name(g_nLoc);
                if (p_bShowCxns) {
                    var anCxnTypes = mapItSystems.get(oItSystem);
                    var sCxnNames = "";
                    for (var k=0; k<anCxnTypes.length; k++) {
                        sCxnNames += ArisData.ActiveFilter().PassiveCxnTypeName(anCxnTypes[k]);
                        if (k < anCxnTypes.length-1) sCxnNames += ", ";
                    }
                    outLine_4_ProcessItSystem(sProcess_Name, sCxnNames, "" + sItSystemName, getStatePicture_Standardization(oItSystem), bColoredTableCell, p_nCurrLevel, nRowSpanFirstCol);
                } else {
                    outLine_3(sProcess_Name, "" + oItSystem.Name(g_nLoc), getStatePicture_Standardization(oItSystem), bColoredTableCell, p_nCurrLevel, nRowSpanFirstCol);
                }
                nRowSpanFirstCol = null;
            }
            bColoredTableCell = !bColoredTableCell;
        } else if (mapItSystems.isEmpty() && !p_bSuppOnly) {
            if (p_bShowCxns) {
                outLine_4_ProcessItSystem(sProcess_Name, "", "—", null, bColoredTableCell, p_nCurrLevel, 1);
            } else {
                outLine_3(sProcess_Name, "—", null, bColoredTableCell, p_nCurrLevel, 1);
            }
            bColoredTableCell = !bColoredTableCell;
        }

        // Out processes from assigned models
        if (p_nAssign > 0) {
            var nNextLevel = p_nCurrLevel + 1;
            if (nNextLevel <= p_nAssign) {            
                
                var oAssProcesses = getProcessesFromAssignedModels(oProcess, p_oAllProcesses, aOT_PROCESS, aMT_PROCESS_MODEL);
                bColoredTableCell = outProcess_ItSystem(oAssProcesses, p_oAllProcesses, p_nState, p_nAssign, p_bSuppOnly, nNextLevel, bColoredTableCell, p_bShowCxns);
            }
        }           
    }
    return bColoredTableCell;
}

function outProcess_ItSystem_ItStandard(p_oProcesses, p_oAllProcesses, p_nState, p_nAssign, p_bSuppOnly, p_nCurrLevel, p_bColored, p_bShowCxns) {
    var bColoredTableCell = p_bColored;
    for (var i = 0; i < p_oProcesses.length; i++) {
        var oProcess = p_oProcesses[i];
        var sProcessName = oProcess.Name(g_nLoc);

        var mapItSystems = getItSystemsOfProcessWithCxns(oProcess, false); // 2nd Parameter = false: All IT systems selected - they will be marked in output
        if (!mapItSystems.isEmpty()) {
            var aoItSystems = mapItSystems.keySet().toArray();
            aoItSystems.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_TYPE, Constants.SORT_NONE, g_nLoc).compare);
            var nRowSpanFirstCol = getAllItStandards(aoItSystems, p_nState).length;
            for (var j = 0; j < aoItSystems.length; j++) {
                var oItSystem = aoItSystems[j];

                var sItSystemName = "" + oItSystem.Name(g_nLoc);

                var sCxnNames = "";
                if (p_bShowCxns) {
                    var anCxnTypes = mapItSystems.get(oItSystem);
                    for (var k=0; k<anCxnTypes.length; k++) {
                        sCxnNames += ArisData.ActiveFilter().PassiveCxnTypeName(anCxnTypes[k]);
                        if (k < anCxnTypes.length-1) sCxnNames += ", ";
                    }
                }

                var oItSystem_Pic = getStatePicture_Standardization(oItSystem);
                
                var bGrayed = !checkState(oItSystem, p_nState);
                
                var oItStandards = getItStandardsOfItSystem(oItSystem, p_nState);
                var nRowSpanSecondCol = oItStandards.length;
                if (oItStandards.length > 0) {
                    for (var k = 0; k < oItStandards.length; k++) {
                        var oItStandard = oItStandards[k];
                        
                        if (p_bShowCxns) {
                            outLine_6(sProcessName, sCxnNames, sItSystemName, oItSystem_Pic, "" + oItStandard.Name(g_nLoc), getStatePicture_Standardization(oItStandard), bColoredTableCell, bGrayed, p_nCurrLevel, nRowSpanFirstCol, nRowSpanSecondCol);
                        } else {
                            outLine_5(sProcessName, sItSystemName, oItSystem_Pic, "" + oItStandard.Name(g_nLoc), getStatePicture_Standardization(oItStandard), bColoredTableCell, bGrayed, p_nCurrLevel, nRowSpanFirstCol, nRowSpanSecondCol);
                        }
                        nRowSpanFirstCol = null;
                        nRowSpanSecondCol = null;
                    }
                } else {
                    if (p_bShowCxns) {
                        outLine_6(sProcessName, sCxnNames, sItSystemName, oItSystem_Pic, "—", null, bColoredTableCell, bGrayed, p_nCurrLevel, nRowSpanFirstCol, nRowSpanSecondCol);
                    } else {
                        outLine_5(sProcessName, sItSystemName, oItSystem_Pic, "—", null, bColoredTableCell, bGrayed, p_nCurrLevel, nRowSpanFirstCol, nRowSpanSecondCol);
                    }
                    nRowSpanFirstCol = null;
                    nRowSpanSecondCol = null;
                }
            }
            bColoredTableCell = !bColoredTableCell;
        } else if (mapItSystems.isEmpty() && !p_bSuppOnly) {
            if (p_bShowCxns) {
                outLine_6(sProcessName, "", "—", null, "—", null, bColoredTableCell, false, p_nCurrLevel, 1, 1);
            } else {
                outLine_5(sProcessName, "—", null, "—", null, bColoredTableCell, false, p_nCurrLevel, 1, 1);
            }
            bColoredTableCell = !bColoredTableCell;
        }

        // Out processes from assigned models
        if (p_nAssign > 0) {
            var nNextLevel = p_nCurrLevel + 1;
            if (nNextLevel <= p_nAssign) {            
                
                var oAssProcesses = getProcessesFromAssignedModels(oProcess, p_oAllProcesses, aOT_PROCESS, aMT_PROCESS_MODEL);
                bColoredTableCell = outProcess_ItSystem_ItStandard(oAssProcesses, p_oAllProcesses, p_nState, p_nAssign, p_bSuppOnly, nNextLevel, bColoredTableCell, p_bShowCxns);
            }
        }           
    }
    return bColoredTableCell;    
}

function getAllItStandards(p_aoItSystems, p_nState) {
    var aoResult = [];
    for (var i=0; i<p_aoItSystems.length; i++) {
        aoResult = aoResult.concat(getItStandardsOfItSystem(p_aoItSystems[i], p_nState));
    }
    return aoResult;
}

function getProcessesFromAssignedModels(p_oProcess, p_oAllProcesses, p_aObjTypeNums, p_aModelTypeNums) {
    var oAssProcesses = new Array();
    
    var oAssignedModels = p_oProcess.AssignedModels();
    for (var i = 0; i < oAssignedModels.length; i++) {
        
        var oModel = oAssignedModels[i];
        for (var j = 0; j < p_aModelTypeNums.length; j++) {                
            if (oModel.TypeNum() == p_aModelTypeNums[j]) {
            
                for (var k = 0; k < p_aObjTypeNums.length; k++) {
                    var oOccuredProcesses = oModel.ObjDefListFilter(p_aObjTypeNums[k]);
                    for (var m = 0; m < oOccuredProcesses.length; m++) {
                        
                        var oNextProcess = oOccuredProcesses[m];
                        if (!isElementInList(oNextProcess, p_oAllProcesses)) {
                            oAssProcesses.push(oNextProcess);
                            p_oAllProcesses.push(oNextProcess);
                        }
                    }
                }
            }
        }
    }        
    oAssProcesses = ArisData.Unique(oAssProcesses);
    oAssProcesses.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_TYPE, Constants.SORT_NONE, g_nLoc).compare);
    return oAssProcesses;
}

function getItSystemsOfItStandard(p_oItStandard, p_nState) {
    var oItSystems = new Array();
    // get connected obj defs (sources and targets)
    var oConnObjDefs = new Array();
    
    if (p_oItStandard.TypeNum() == Constants.OT_HW_CMP_TYPE) {
        nCxnTypeNum = Constants.CT_CAN_RUN_ON;
    } else {
        //OT_TECH_TRM, OT_PERF, OT_INFO_CARR, OT_CLST, OT_NW_PROT, OT_FUNC, OT_APPL_SYS_TYPE
        nCxnTypeNum = Constants.CT_USE_1;
    }
    var oInCxns = p_oItStandard.CxnListFilter(Constants.EDGES_IN, nCxnTypeNum);
    for (var i = 0; i < oInCxns.length; i++) {
        oConnObjDefs.push(oInCxns[i].SourceObjDef());
    }
    
    // check objects: state-attribute and object type
    for (var i = 0; i < oConnObjDefs.length; i++) {
        var oConnObjDef = oConnObjDefs[i];
        if (checkState(oConnObjDef, p_nState)) {
           for (var j = 0; j < aOT_IT_SYSTEM.length; j++) {
                if (oConnObjDef.TypeNum() == aOT_IT_SYSTEM[j]) {
                    oItSystems.push(oConnObjDef);
                    break;
                }        
           }
        }
    }
    oItSystems = ArisData.Unique(oItSystems);
    oItSystems.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_TYPE, Constants.SORT_NONE, g_nLoc).compare);
    return oItSystems;
}

function getItSystemsOfProcessWithCxns(p_oProcess, p_nState) {
    var mapItSystems = new java.util.HashMap();
    var oInCxns = p_oProcess.CxnListFilter(Constants.EDGES_IN, aCT_IT_SYSTEM_TO_PROCESS);
    for (var i = 0; i < oInCxns.length; i++) {
        var oCxnDef = oInCxns[i];
        var oObjDef = oCxnDef.SourceObjDef();
        if (checkState(oObjDef, p_nState)) {
           for (var j = 0; j < aOT_IT_SYSTEM.length; j++) {
                if (oObjDef.TypeNum() == aOT_IT_SYSTEM[j]) {
                    var anCxnTypes = mapItSystems.get(oObjDef);
                    if (anCxnTypes != null) {
                        anCxnTypes.push(oCxnDef.TypeNum());
                    } else {
                        anCxnTypes = [oCxnDef.TypeNum()];
                    }
                    mapItSystems.put(oObjDef, anCxnTypes);
                    break;
                }        
           }
        }
    }
    return mapItSystems;
}

function getItStandardsOfItSystem(p_oItSystem, p_nState) {
    var oItStandards = new Array();
    // get connected obj defs (sources and targets)
    var oConnObjDefs = new Array();
    var oInCxns = p_oItSystem.CxnList(Constants.EDGES_IN);
    for (var i = 0; i < oInCxns.length; i++) {
        oConnObjDefs.push(oInCxns[i].SourceObjDef());
    }
    var oOutCxns = p_oItSystem.CxnList(Constants.EDGES_OUT);
    for (var i = 0; i < oOutCxns.length; i++) {
        oConnObjDefs.push(oOutCxns[i].TargetObjDef());
    }
    // check objects: state-attribute and object type
    for (var i = 0; i < oConnObjDefs.length; i++) {
        var oConnObjDef = oConnObjDefs[i];
        if (checkState(oConnObjDef, p_nState)) {
           for (var j = 0; j < aOT_IT_STANDARD.length; j++) {
                if (oConnObjDef.TypeNum() == aOT_IT_STANDARD[j]) {
                    oItStandards.push(oConnObjDef);
                    break;
                }        
           }
        }
    }
    oItStandards = ArisData.Unique(oItStandards);
    oItStandards.sort(new ArraySortComparator(Constants.AT_NAME, Constants.SORT_TYPE, Constants.SORT_NONE, g_nLoc).compare);
    return oItStandards;
}

function checkState(p_oObjDef, p_nState) {
    if (p_nState <= 0) {
        return true;
    }
    // check state-attribute
    if (p_oObjDef.Attribute(cAT_SC_State, g_nLoc).MeasureUnitTypeNum() == p_nState) {
        return true;
    }
    return false;
}

function outLine_3(p_Name1, p_Name2, p_State2, p_bColored, p_nLevel, p_nRowSpanFirstCol) {
    var styleSheet1 = getStyleColored("TBL_STD", p_bColored);
    var styleSheet2 = getStyleColored("TBL_STD", p_bColored);
    
    g_oOutfile.TableRow();
    if (p_nRowSpanFirstCol != null) {
        g_oOutfile.TableCellF(p_Name1, p_nRowSpanFirstCol, 1, getStyleTableIndent(p_nLevel, p_bColored));
    }
    g_oOutfile.TableCellF(p_Name2, 1, 1, styleSheet1);
    g_oOutfile.TableCellF("", 1, 1, styleSheet2);
    if (p_State2 != null) {
        g_oOutfile.OutGraphic(p_State2, -1, FONT_SIZE*CONV_RATE_PT_TO_MM, FONT_SIZE*CONV_RATE_PT_TO_MM);
    }
}

// TODO: Merge outLine_4 functions into one
function outLine_4_ProcessItSystem(p_sProcName, p_sCxnTypes, p_sSysName, p_oSysState, p_bColored, p_nLevel, p_nRowSpanFirstCol) {
    var styleSheet1 = getStyleColored("TBL_STD", p_bColored);
    var styleSheet2 = getStyleColored("TBL_STD", p_bColored);    
    
    g_oOutfile.TableRow();
    if (p_nRowSpanFirstCol != null) {
        g_oOutfile.TableCellF(p_sProcName, p_nRowSpanFirstCol, 1, getStyleTableIndent(p_nLevel, p_bColored));
    }
    g_oOutfile.TableCellF(p_sCxnTypes, 1, 1, styleSheet1);    
    g_oOutfile.TableCellF(p_sSysName, 1, 1, styleSheet1);

    g_oOutfile.TableCellF("", 1, 1, styleSheet2);
    if (p_oSysState != null) {
        g_oOutfile.OutGraphic(p_oSysState, -1, FONT_SIZE*CONV_RATE_PT_TO_MM, FONT_SIZE*CONV_RATE_PT_TO_MM);
    }
}

function outLine_4_ItStandardItSystem(p_sProcName, p_sCxnTypes, p_sSysName, p_oSysState, p_bColored, p_nRowSpanFirstCol) {
    outLine_4(p_sProcName, p_sCxnTypes, p_sSysName, p_oSysState, p_bColored, 0, p_nRowSpanFirstCol);
}

function outLine_4(p_Name1, p_Type1, p_Name2, p_State2, p_bColored, p_nLevel, p_nRowSpanFirstCol) {
    var styleSheet1 = getStyleColored("TBL_STD", p_bColored);
    var styleSheet2 = getStyleColored("TBL_STD", p_bColored);
    
    g_oOutfile.TableRow();
    if (p_nRowSpanFirstCol != null) {
        g_oOutfile.TableCellF(p_Name1, p_nRowSpanFirstCol, 1, getStyleTableIndent(p_nLevel, p_bColored));
        g_oOutfile.TableCellF(p_Type1, p_nRowSpanFirstCol, 1, styleSheet1);    
    }
    g_oOutfile.TableCellF(p_Name2, 1, 1, styleSheet1);

    g_oOutfile.TableCellF("", 1, 1, styleSheet2);
    if (p_State2 != null) {
        g_oOutfile.OutGraphic(p_State2, -1, FONT_SIZE*CONV_RATE_PT_TO_MM, FONT_SIZE*CONV_RATE_PT_TO_MM);
    }
}

function outLine_5(p_Name1, p_Name2, p_State2, p_Name3, p_State3, p_bColored, p_bGrayed, p_nLevel, p_nRowSpanFirstCol, p_nRowSpanSecondCol) {
    var styleSheet1 = getStyleColored("TBL_STD", p_bColored);
    var styleSheet2 = getStyleColored("TBL_STD", p_bColored);
    if (p_bGrayed)
        styleSheet2 = getStyleColored("TBL_LIGHT", p_bColored);
    var styleSheet3 = getStyleColored("TBL_STD", p_bColored);
    
    g_oOutfile.TableRow();
    if (p_nRowSpanFirstCol != null) {
        g_oOutfile.TableCellF(p_Name1, p_nRowSpanFirstCol, 1, getStyleTableIndent(p_nLevel, p_bColored));
    }
    if (p_nRowSpanSecondCol != null) {
        g_oOutfile.TableCellF(p_Name2, p_nRowSpanSecondCol, 1, styleSheet2);
        g_oOutfile.TableCellF("", p_nRowSpanSecondCol, 1, styleSheet3);
        if (p_State2 != null) {
            g_oOutfile.OutGraphic(p_State2, -1, FONT_SIZE*CONV_RATE_PT_TO_MM, FONT_SIZE*CONV_RATE_PT_TO_MM);
        }
    }
    g_oOutfile.TableCellF(p_Name3, 1, 1, styleSheet2);
    g_oOutfile.TableCellF("", 1, 1, styleSheet3);
    if (p_State3 != null) {
        g_oOutfile.OutGraphic(p_State3, -1, FONT_SIZE*CONV_RATE_PT_TO_MM, FONT_SIZE*CONV_RATE_PT_TO_MM);
    }
}

function outLine_6(p_Name1, p_Name2, p_Cxns, p_State2, p_Name3, p_State3, p_bColored, p_bGrayed, p_nLevel, p_nRowSpanFirstCol, p_nRowSpanSecondCol) {
    var styleSheet1 = getStyleColored("TBL_STD", p_bColored);
    var styleSheet2 = getStyleColored("TBL_STD", p_bColored);
    if (p_bGrayed)
        styleSheet2 = getStyleColored("TBL_LIGHT", p_bColored);
    var styleSheet3 = getStyleColored("TBL_STD", p_bColored);
    
    g_oOutfile.TableRow();
    if (p_nRowSpanFirstCol != null) {
        g_oOutfile.TableCellF(p_Name1, p_nRowSpanFirstCol, 1, getStyleTableIndent(p_nLevel, p_bColored));
    }
    if (p_nRowSpanSecondCol != null) {
        g_oOutfile.TableCellF(p_Name2, p_nRowSpanSecondCol, 1, styleSheet2);
        g_oOutfile.TableCellF(p_Cxns, p_nRowSpanSecondCol, 1, styleSheet2);
        g_oOutfile.TableCellF("", p_nRowSpanSecondCol, 1, styleSheet3);
        if (p_State2 != null) {
            g_oOutfile.OutGraphic(p_State2, -1, FONT_SIZE*CONV_RATE_PT_TO_MM, FONT_SIZE*CONV_RATE_PT_TO_MM);
        }
    }
    g_oOutfile.TableCellF(p_Name3, 1, 1, styleSheet2);
    g_oOutfile.TableCellF("", 1, 1, styleSheet3);
    if (p_State3 != null) {
        g_oOutfile.OutGraphic(p_State3, -1, FONT_SIZE*CONV_RATE_PT_TO_MM, FONT_SIZE*CONV_RATE_PT_TO_MM);
    }
}

function getReportTitle(p_nSelection) {
    switch(p_nSelection) {
        case 0:
        return getString("TEXT_9");
        case 1:
        return getString("TEXT_10");
        case 2:
        return getString("TEXT_11");
    }
}

function isElementInList(p_oCurrElement, p_aElements) {
    for ( i = 0 ; i < p_aElements.length  ; i++ ) {
        if (p_oCurrElement.IsEqual(p_aElements[i])) {
            return true;
        }
    }
    return false;
}

function dlgSelectOptions(p_tOptions) {
    var nuserdlg = 0;   // Variable for the user dialog box
    
    var stateMap = dlgGetStateMap();
    var sStates = new Array();
    
    var iter = stateMap.keySet().iterator();
    while (iter.hasNext()) {
        sStates.push(stateMap.get(iter.next()));    
    }
    
    var binputOk = false;
    while (!(binputOk)) {
        var userdialog = Dialogs.createNewDialogTemplate(550, 190, getString("TEXT_12"), "dlgFuncSelectOptions");
        // %GRID:10,7,1,1
        userdialog.GroupBox(10, 10, 530, 85, getString("TEXT_13"));
        userdialog.OptionGroup("var_options");
        userdialog.OptionButton(20, 30, 500, 15, getString("TEXT_9"), "var_opt0");
        userdialog.OptionButton(20, 50, 500, 15, getString("TEXT_10"), "var_opt1");
        userdialog.OptionButton(20, 70, 500, 15, getString("TEXT_11"), "var_opt2");
        userdialog.GroupBox(10, 100, 530, 120, getString("TEXT_14"));
        userdialog.CheckBox(20, 115, 330, 15, getString("TEXT_15"), "var_state");
        userdialog.DropListBox(350, 115, 180, 70, sStates, "var_stateValue");
        userdialog.CheckBox(20, 135, 330, 15, getString("TEXT_16"), "var_assign");
        userdialog.TextBox(350, 135, 30, 18, "var_assignLevel");    
        userdialog.Text(390, 138, 140, 15, getString("TEXT_17"), "var_assignText");
        userdialog.CheckBox(20, 155, 330, 15, getString("TEXT_22"), "var_suppOnly");        
        userdialog.CheckBox(20, 175, 330, 15, getString("TEXT_23"), "var_showCxns");        
        userdialog.CheckBox(20, 195, 330, 15, getString("TEXT_18"), "var_addLegend");
        userdialog.OKButton();
        userdialog.CancelButton();
        userdialog.HelpButton("HID_cd76a550_9888_11da_5b38_eb0b96d9f8a4_dlg_01.hlp");        
    
        var dlg = Dialogs.createUserDialog(userdialog);

        // Read dialog settings from config    
        var sSection = "SCRIPT_cd76a550_9888_11da_5b38_eb0b96d9f8a4";
        ReadSettingsDlgValue(dlg, sSection, "var_options", 0);                        
        ReadSettingsDlgValue(dlg, sSection, "var_state", 0);
        ReadSettingsDlgValue(dlg, sSection, "var_stateValue", 0);
        ReadSettingsDlgValue(dlg, sSection, "var_assign", 0);
        ReadSettingsDlgText(dlg, sSection, "var_assignLevel", "");
        ReadSettingsDlgValue(dlg, sSection, "var_suppOnly", 0);
        ReadSettingsDlgValue(dlg, sSection, "var_addLegend", 0);
        ReadSettingsDlgValue(dlg, sSection, "var_showCxns", 0);
        
        nuserdlg = Dialogs.show( __currentDialog = dlg);        // Showing dialog and waiting for confirmation with OK

        binputOk = true;
        if( !(nuserdlg == 0) && (dlg.getDlgValue("var_assign") == 1)) {
            var levelValue = dlg.getDlgText("var_assignLevel"); 
            if (isNaN(levelValue) || levelValue <= 0) {
                Dialogs.MsgBox(getString("TEXT_19"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, getString("TEXT_20"));
                binputOk = false;
            }
        }
    }    

    p_tOptions.nSelection = dlg.getDlgValue("var_options");
    
    if (dlg.getDlgValue("var_state") == 1) {
        p_tOptions.nState = dlgGetStateValue(stateMap, sStates[dlg.getDlgValue("var_stateValue")]);
    }
    if (dlg.getDlgValue("var_assign") == 1) {    
        p_tOptions.nAssign = dlg.getDlgText("var_assignLevel");
    }

    p_tOptions.bSuppOnly = (dlg.getDlgValue("var_suppOnly") == 1);      // only system supported processes
    p_tOptions.bAddLegend = (dlg.getDlgValue("var_addLegend") == 1);    // Add legend
    p_tOptions.bShowCxns = (dlg.getDlgValue("var_showCxns") == 1);  // Display connection colomn
    
    if (nuserdlg == 0) {
        return false;
    } else {
        // Write dialog settings to config    
        WriteSettingsDlgValue(dlg, sSection, "var_options");
        WriteSettingsDlgValue(dlg, sSection, "var_state");
        WriteSettingsDlgValue(dlg, sSection, "var_stateValue");
        WriteSettingsDlgValue(dlg, sSection, "var_assign");
        WriteSettingsDlgText(dlg, sSection, "var_assignLevel");
        WriteSettingsDlgValue(dlg, sSection, "var_suppOnly");        
        WriteSettingsDlgValue(dlg, sSection, "var_addLegend");
        WriteSettingsDlgValue(dlg, sSection, "var_showCxns");
    }
    return true;
}

function dlgFuncSelectOptions(dlgitem, action, suppvalue) {
    var result = false;
    
    switch(action) {
        case 1:
            // Init
            __currentDialog.setDlgEnable("var_opt0", false);
            __currentDialog.setDlgEnable("var_opt1", false);
            __currentDialog.setDlgEnable("var_opt2", false);

            var oItStandards = getSelectedObjects_ItStandard(0);        
            if (oItStandards.length > 0) {
                // IT Standard(s) selected
                __currentDialog.setDlgEnable("var_opt0", true);
            }
            var oProcesses = getSelectedObjects_Process(0);
            if (oProcesses.length > 0) {
                // Process(es) selected
                __currentDialog.setDlgEnable("var_opt1", true);
                __currentDialog.setDlgEnable("var_opt2", true);
            }
            if ((oItStandards.length == 0) && (oProcesses.length > 0)) {
                __currentDialog.setDlgValue("var_options", 1);
            } else {
                if (__currentDialog.getDlgValue("var_options") == 0 && !(__currentDialog.getDlgEnable("var_opt0"))) {
                    __currentDialog.setDlgValue("var_options", 1);
                }
                if (__currentDialog.getDlgValue("var_options") == 1 && !(__currentDialog.getDlgEnable("var_opt1"))) {
                    __currentDialog.setDlgValue("var_options", 0);
                }
                if (__currentDialog.getDlgValue("var_options") == 2 && !(__currentDialog.getDlgEnable("var_opt2"))) {
                    __currentDialog.setDlgValue("var_options", 0);
                }
            }
            
            if (__currentDialog.getDlgValue("var_options") == 0) {
                __currentDialog.setDlgEnable("var_assign", false);
                __currentDialog.setDlgEnable("var_assignLevel", false);
                __currentDialog.setDlgEnable("var_suppOnly", false);
                __currentDialog.setDlgEnable("var_showCxns", false);
            } else {
                if (__currentDialog.getDlgValue("var_assign") == 0) {
                    __currentDialog.setDlgEnable("var_assignLevel", false);
                }
            }
            
            if (__currentDialog.getDlgValue("var_state") == 0) {
                __currentDialog.setDlgEnable("var_stateValue", false);
            }

            break;
        case 2:
            switch(dlgitem) {
                case "var_options":
                     if (__currentDialog.getDlgValue("var_options") == 0) {
                        __currentDialog.setDlgEnable("var_assign", false);
                        __currentDialog.setDlgValue("var_assign", 0);
                        __currentDialog.setDlgEnable("var_assignLevel", false);
                        __currentDialog.setDlgEnable("var_suppOnly", false);
                        __currentDialog.setDlgValue("var_suppOnly", 0);
                        __currentDialog.setDlgEnable("var_showCxns", false);
                        __currentDialog.setDlgValue("var_showCxns", 0);
                    } else {
                        __currentDialog.setDlgEnable("var_assign", true);
                        __currentDialog.setDlgEnable("var_suppOnly", true);
                        __currentDialog.setDlgEnable("var_showCxns", true);
                    }
                    result = true;
                    break;
                case "var_state":
                    if (__currentDialog.getDlgValue("var_state") == 0) {
                        __currentDialog.setDlgEnable("var_stateValue", false);
                    } else {
                        __currentDialog.setDlgEnable("var_stateValue", true);
                    }
                    result = true;
                    break;
                case "var_assign":
                    if (__currentDialog.getDlgValue("var_assign") == 0) {
                        __currentDialog.setDlgEnable("var_assignLevel", false);
                    } else {
                        __currentDialog.setDlgEnable("var_assignLevel", true);
                    }
                    result = true;
                    break;
            }
    }
    return result;
}

function dlgGetStateMap() {
    var stateMap = new java.util.TreeMap(); 

    var nAttrValues = g_oMethodFilter.AttrValueTypeNums(cAT_SC_State);
    for (var i = 0 ; i < nAttrValues.length ; i++ ) {
        var nCurrAttrValue = nAttrValues[i];
        var sCurrAttrValue = "" + g_oMethodFilter.AttrValueType(cAT_SC_State, nCurrAttrValue);  // BLUE-14868
        
        if (sCurrAttrValue.replace(" ", "").length > 0) {
            stateMap.put(nCurrAttrValue, sCurrAttrValue);        // Key: AttrValueType, Value: AttrValueTypeNum
        }
    }
    return stateMap;
}

function dlgGetStateValue(p_stateMap, p_sStateValue) {
    var iter = p_stateMap.keySet().iterator();
    while (iter.hasNext()) {
        var sKey = iter.next();  
        var sMapValue = p_stateMap.get(sKey)
        
        if (sMapValue == p_sStateValue) {
            return parseInt(sKey);
        }
    }
    return 0;
}
