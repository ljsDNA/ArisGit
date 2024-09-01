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
 
var g_rowData = new Array();
var g_nLoc = Context.getSelectedLanguage();

// Mapping of reponsibility types (connection, attribute value type, report string)
var g_aRespTypes = [
    [Constants.CT_RESPONSIBILITY_SYSTEM,                      Constants.AVT_SUPPORT_TYPE_SYS_RESP,             "TEXT_62"],
    [Constants.CT_SUBSTITUTE_RESPONSIBILITY_SYSTEM,           Constants.AVT_SUPPORT_TYPE_SUBST_SYS_RESP,       "TEXT_63"],
    [Constants.CT_RESPONSIBILITY_OPERATING,                   Constants.AVT_SUPPORT_TYPE_OPERATION_RESP,       "RESP_OP"],
    [Constants.CT_SUBSTITUTE_RESPONSIBILITY_OPERATING,        Constants.AVT_SUPPORT_TYPE_SUBST_OPERATION_RESP, "RESP_OP_SUBST"],
    [Constants.CT_RESPONSIBILITY_HOTLINE_SUPPORT,             Constants.AVT_SUPPORT_TYPE_HOTLINE,              "RESP_HOT"],
    [Constants.CT_RESPONSIBILITY_1ST_LEVEL_SUPPORT,           Constants.AVT_SUPPORT_TYPE_1ST,                  "RESP_1ST"],
    [Constants.CT_RESPONSIBILITY_2ND_LEVEL_SUPPORT,           Constants.AVT_SUPPORT_TYPE_2ND,                  "RESP_2ND"],
    [Constants.CT_RESPONSIBILITY_3RD_LEVEL_SUPPORT,           Constants.AVT_SUPPORT_TYPE_3RD,                  "RESP_3RD"],
    [Constants.CT_RESPONSIBILITY_FACILITY_OPERATOR,           Constants.AVT_SUPPORT_TYPE_FACILITY_OPERATOR,    "RESP_FAC"],
    [Constants.CT_RESPONSIBILITY_OPERATIONAL_FAULT_RECORDING, Constants.AVT_SUPPORT_TYPE_FAILURE_RESP,         "RESP_FAIL"],
    [Constants.CT_RESPONSIBILITY_SYSTEM_INTEGRATION,          Constants.AVT_SUPPORT_TYPE_SYS_INTEGRATOR,       "RESP_SYSINT"],
    [Constants.CT_RESPONSIBILITY_APPLICATION,                 Constants.AVT_SUPPORT_TYPE_FREE_12,              "RESP_APP"]
];

var g_oOutfile = Context.createOutputObject();
setupOutputObject(g_oOutfile);

initStyles(g_oOutfile, getString("FONT"));

main();

/* ---------------------------------------------------------------------------- */

function main() {
    var sTitle;
    var sIndex = "";
    var oApplSysType = null;
    var oApplSysTypes = null;
    comparator = new ArraySortComparator(1, 1, 1, g_nLoc).compare;

    oApplSysTypes = ArisData.getSelectedObjDefs();
    oApplSysTypes.sort(comparator);

    var aTitleDetails = [];
    if (oApplSysTypes.length == 1) {
        aTitleDetails.push([getString("LABEL_SYSTEM"), oApplSysTypes[0].Name(g_nLoc)]);
    }
    outTitlePage(g_oOutfile, getString("FONT"), getString("TITLE"), getString("LABEL_DATE"), aTitleDetails);
    
    outHeaderFooter(g_oOutfile, getString("FONT"), getString("FOOTER_RIGHT"));

    // Table of contents
    g_oOutfile.OutputLnF(getString("TEXT_155"), "HEADING1_NOTOC");
    g_oOutfile.BeginParagraphF("Normal")
    g_oOutfile.OutputField(Constants.FIELD_TOC, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_RIGHT);
    g_oOutfile.EndParagraph();

    setTableBorders(g_oOutfile);

    for (var i=0; i<oApplSysTypes.length; i++) {
        oApplSysType = oApplSysTypes[i];

        g_oOutfile.BeginSection(false, Constants.SECTION_DEFAULT);
        g_oOutfile.OutputLnF(oApplSysType.Name(g_nLoc), "HEADING1");
        
        // System description
        sTitle = getString("TEXT_2");
        outHeading2(sTitle);
        outDescription(getString("TEXT_177"));
        outApplSysType_SystemDesc(oApplSysType);
        
        // Documents
        sTitle = getString("TEXT_68");
        outHeading3(sTitle);
        outDocsAndLinks(oApplSysType);
        
        // Main responsibilities
        outHeading3(getString("TEXT_61"));
        outMainResponsibilities(oApplSysType, sIndex);
        
        // Additional responsibilities
        outHeading3(getString("ADD_RESP"));
        outAdditionalResponsibilities(oApplSysType);
        
        // Process architecture
        sTitle = getString("TEXT_69");
        outHeading2(sTitle);
        outDescription(getString("TEXT_178"));
        
        // Capabilities (IS functions)
        outHeading3(getString("TEXT_70"));
        var oIsFunctions = getConnectedObjects(oApplSysType, Constants.EDGES_OUT, Constants.CT_CAN_SUPP_1, Constants.OT_IS_FUNC);
        outObjectList(oIsFunctions, true);
        
        // Usage
        sTitle = getString("TEXT_77");
        outHeading3(sTitle);
        var oUsages = getConnectedObjects(oApplSysType, Constants.EDGES_IN, Constants.CT_CAN_BE_USER, Constants.OT_ORG_UNIT);
        outProcessUsage(oUsages);
        
        // Supported processes
        sTitle = getString("TEXT_72");
        outHeading3(sTitle);
        var oProcesses = getConnectedObjects(oApplSysType, Constants.EDGES_OUT, Constants.CT_CAN_SUPP_1, Constants.OT_FUNC);
        outProcessHierarchy(oProcesses);
        
        // Information architecture
        sTitle = getString("TEXT_8");
        outHeading2(sTitle);
        outDescription(getString("TEXT_179"));
        
        // Interfaces
        sTitle2 = getString("TEXT_10");
        outHeading3(sTitle2);
        outInterfaces(oApplSysType);
        
        // Managed data
        var sTitle2 = getString("TEXT_9");
        outHeading3(sTitle2);
        var oData = getConnectedObjects(oApplSysType, Constants.EDGES_OUT, Constants.CT_IS_OWN, Constants.OT_CLST);
        outObjectList(oData , false);
        
        // Technical architecture
        sTitle = getString("TEXT_141");
        outHeading2(sTitle);
        outDescription(getString("TEXT_180"));
        outTechnicalArchitecture(oApplSysType);
        
        // IT infrastructure
        outHeading2(getString("TEXT_156"));
        outDescription(getString("TEXT_176"));
        outInstance(oApplSysType);
    }

    g_oOutfile.WriteReport();
}

function outApplSysType_SystemDesc(p_ObjDef) {
    p_oObjDef = p_ObjDef;

    // General
    outHeading3(getString("TEXT_54"));
    
    g_oOutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    // System name -> Name
    outInfo(getString("TEXT_28"), getAttrValue(p_oObjDef, Constants.AT_NAME, false), true);
    // Short description
    outInfo(getString("TEXT_18"), getAttrValue(p_oObjDef, Constants.AT_NAME_FULL, false), false);
    // Description -> System description
    outInfo(getString("TEXT_2"), getAttrValue(p_oObjDef, Constants.AT_DESC, false), true);
    // Manufacturer of the application -> Manufacturer
    outInfo(getString("TEXT_55"), getAttrValue(p_oObjDef, Constants.AT_MNFCT_1, false), false);
    // Version
    outInfo(getString("TEXT_56"), getAttrValue(p_oObjDef, Constants.AT_REL_3, false), true);
    // Individual development/Standard software -> Individual development
    outInfo(getString("TEXT_57"), getAttrValue(p_oObjDef, Constants.AT_INDIVIDUAL_DEVELOPMENT, false), false);
    // Guaranty/Warranty until
    outInfo(getString("TEXT_35"), getAttrValue(p_oObjDef, Constants.AT_GUARANTY, false), true);
    g_oOutfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);

    // Usage
    outHeading3(getString("TEXT_60"));
    g_oOutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    // Number of internal users
    outInfo(getString("TEXT_21"), getAttrValue(p_oObjDef, Constants.AT_NUMBER_USER_INTERNAL, false), true);
    // Number of external users
    outInfo(getString("TEXT_22"), getAttrValue(p_oObjDef, Constants.AT_NUMBER_USER_EXTERNAL, false), false);
    // Criticality (importance of the application system)
    outInfo(getString("TEXT_58"), getAttrValue(p_oObjDef, Constants.AT_CRITICALITY, false), true);
    g_oOutfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);

    // Service level agreements
    outHeading3(getString("TEXT_5"));
    g_oOutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    // Availability
    outInfo(getString("TEXT_34"), getAttrValue(p_oObjDef, Constants.AT_AVAILABILITY, false), true);
    // Max. downtime per month -> Maximum downtime
    outInfo(getString("TEXT_59"), getAttrValue(p_oObjDef, Constants.AT_MAX_DOWNTIME, false), false);
    g_oOutfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
}

    
// Documents
function outDocsAndLinks(p_oObjDef) {
    var requirementsSpecification = new Array();
    var technicalSpecification = new Array();
    var userGuide = new Array();
    var backupPlan = new Array();
    var emergencyPlan = new Array();
    var additionalDocuments = new Array();
    var undefinedDocuments = new Array();

    var oInfoCarriers = getConnectedObjects(p_oObjDef, Constants.EDGES_IN, Constants.CT_PROV_INP_FOR, Constants.OT_INFO_CARR);

    if (oInfoCarriers.length == 0 || oInfoCarriers == null)
        outDescription(getString("TEXT_153"));
    else {
        var sAttrID;
        for (var i = 0; i < oInfoCarriers.length; i++) {
            var oInfoCarr = oInfoCarriers[i]
            sAttrID = getFallbackAttrValue(oInfoCarr, Constants.AT_ID, true);
            if (sAttrID == getString("TEXT_84")) {
                requirementsSpecification.push(oInfoCarr);
            } else if (sAttrID == getString("TEXT_85")) {
                technicalSpecification.push(oInfoCarr);
            } else if (sAttrID == getString("TEXT_86")) {
                userGuide.push(oInfoCarr);
            } else if (sAttrID == getString("TEXT_87")) {
                backupPlan.push(oInfoCarr);
            } else if (sAttrID == getString("TEXT_88")) {
                emergencyPlan.push(oInfoCarr);
            } else if (sAttrID == getString("TEXT_89")) {
                additionalDocuments.push(oInfoCarr);
            } else
                undefinedDocuments.push(oInfoCarr);
        }

        if (requirementsSpecification.length != 0 || technicalSpecification.length != 0 || userGuide.length != 0 || backupPlan.length != 0 ||
                emergencyPlan.length != 0 ||
                additionalDocuments.length != 0) {
            g_oOutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            writeDocTable(requirementsSpecification, getString("TEXT_78"));
            writeDocTable(technicalSpecification, getString("TEXT_79"));
            writeDocTable(userGuide, getString("TEXT_80"));
            writeDocTable(backupPlan, getString("TEXT_81"));
            writeDocTable(emergencyPlan, getString("TEXT_82"));
            writeDocTable(additionalDocuments, getString("TEXT_83"));
            g_oOutfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
        }
        else
            outDescription(getString("TEXT_153"));    
    }
}

function outLink(p_oObjDef, p_nAttrTitle, p_nAttrLink) {
    var sAttrLink = getAttrValue(p_oObjDef, p_nAttrLink, true);
    if (sAttrLink.length > 0) {
        var sAttrTitle = "";
        if (p_nAttrTitle != null)
            sAttrTitle = getFallbackAttrValue(p_oObjDef, p_nAttrTitle, true);

        if (sAttrTitle.length == 0)
            sAttrTitle = ArisData.getActiveDatabase().ActiveFilter().AttrTypeName(p_nAttrLink);

        outInfo(sAttrTitle, sAttrLink);
    }
}

function PERSON_ROLE(p_oPerson, p_nRole) {
    this.oPerson = p_oPerson;
    this.nRole = p_nRole;
}

/*
 * Get the person objects attached to the application system.
 *
 * p_oApplSysOrApplSysType: Application system type object
 *
 * p_anRespTypes: Responsibility types used for filtering the result. These
 *   are the value types from the attribute 'Responsibility type'. In
 *   g_aRespTypes they are mapped to the respective specific connection types.
 *   Therefore the latter are found as well.
 */
function getPersons(p_oApplSysOrApplSysType, p_anRespTypes) {
    var aPersonsWithRoles = new Array();
    // Get the persons that are connected with generic 'is responsible for' connections
    var aoCxns = p_oApplSysOrApplSysType.CxnListFilter(Constants.EDGES_IN, Constants.CT_IS_RESP_1);
    for (var i=0; i<aoCxns.length; i++) {
        var oCxn = aoCxns[i];
        var oSrcObj = oCxn.SourceObjDef();
        var nActualRespType = getAttrMeasureUnitTypeNum(oCxn, Constants.AT_SUPPORT_TYPE);
        if (oSrcObj.TypeNum() == Constants.OT_PERS &&
            ((p_anRespTypes != null && p_anRespTypes.contains(nActualRespType)) ||
            (p_anRespTypes == null && nActualRespType == -1))) {
            aPersonsWithRoles.push(new PERSON_ROLE(oSrcObj, nActualRespType));
        }
    }
    // Get the persons that are connected with specialized 'is responsible (...) for' connections
    if (p_anRespTypes != null) {
        var mapRespTypes = new java.util.HashMap(); // Helper map to easily get the connection type for a certain AVT
        for (var i=0; i<g_aRespTypes.length; i++) {
            mapRespTypes.put(g_aRespTypes[i][1], g_aRespTypes[i][0]);
        }
        for (var i=0; i<p_anRespTypes.length; i++) {
            var nRespType = p_anRespTypes[i];
            var nCxnType = mapRespTypes.get(nRespType);
            var aoCxns = p_oApplSysOrApplSysType.CxnListFilter(Constants.EDGES_IN, nCxnType);
            for (var j=0; j<aoCxns.length; j++) {
                var oCxn = aoCxns[j];
                var oSrcObj = oCxn.SourceObjDef();
                if (oSrcObj.TypeNum() == Constants.OT_PERS) {
                    aPersonsWithRoles.push(new PERSON_ROLE(oSrcObj, nRespType));
                }
            }
        }
    }
    return aPersonsWithRoles;
}

// Main responsibilities and contacts
function outMainResponsibilities(p_oApplSysOrApplSysType, p_sIndex) {
    var anRespTypes = [Constants.AVT_SUPPORT_TYPE_SYS_RESP, Constants.AVT_SUPPORT_TYPE_SUBST_SYS_RESP];
    var aPersonsWithRoles = getPersons(p_oApplSysOrApplSysType, anRespTypes);
    // Sort the array of persons in descending order
    aPersonsWithRoles.sort(sortPersonWithRoleReverse);
    // Start the output table
    g_oOutfile.BeginTable(100, convertToDoubles([32, 68]), COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    var bColoredRow = true;
    // Helper map for getting the label for a certain responsibility type
    var mapStringsForRespTypes = new java.util.HashMap();
    for (var i=0; i<g_aRespTypes.length; i++) {
        mapStringsForRespTypes.put(g_aRespTypes[i][1], g_aRespTypes[i][2]);
    }
    // Add persons
    for (var i=0; i<anRespTypes.length; i++) {
        var nRespType = anRespTypes[i];
        var sRespTypeString = mapStringsForRespTypes.get(nRespType);
        var bPersonMaintained = false;
        var j = aPersonsWithRoles.length;
        while (j--) {
            var oPersRole = aPersonsWithRoles[j];
            if (oPersRole.nRole == nRespType) {
                outPersonWithDetails(oPersRole.oPerson, getString(sRespTypeString), bColoredRow);
                bColoredRow = !bColoredRow;
                aPersonsWithRoles.splice(j, 1);
                bPersonMaintained = true;
            }
        }
        if (!bPersonMaintained) {
            outPersonWithDetails(null, getString(sRespTypeString), bColoredRow);
            bColoredRow = !bColoredRow;
        }
    }
    // Add the responsible org unit
    var oOrgUnits = getConnectedObjects(p_oApplSysOrApplSysType, Constants.EDGES_IN, Constants.CT_IS_RESP_1, Constants.OT_ORG_UNIT);
    if (oOrgUnits.length > 0) {
        outOrgUnits(oOrgUnits, p_oApplSysOrApplSysType, p_sIndex, bColoredRow);
        bColoredRow = !bColoredRow;
    } else {
        outInfoWithRowSpanOnFirstCol(getString("TEXT_66"), "—", bColoredRow, 1);
        bColoredRow = !bColoredRow;
    }
    // Close the table
    g_oOutfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
}

// Additional responsibilities
function outAdditionalResponsibilities(p_oApplSysOrApplSysType) {
    var anRespTypes = [
        Constants.AVT_SUPPORT_TYPE_OPERATION_RESP,
        Constants.AVT_SUPPORT_TYPE_SUBST_OPERATION_RESP,
        Constants.AVT_SUPPORT_TYPE_HOTLINE,
        Constants.AVT_SUPPORT_TYPE_1ST,
        Constants.AVT_SUPPORT_TYPE_2ND,
        Constants.AVT_SUPPORT_TYPE_3RD,
        Constants.AVT_SUPPORT_TYPE_FACILITY_OPERATOR,
        Constants.AVT_SUPPORT_TYPE_FAILURE_RESP,
        Constants.AVT_SUPPORT_TYPE_SYS_INTEGRATOR,
        Constants.AVT_SUPPORT_TYPE_FREE_12
    ];
    var aPersonsWithRoles = getPersons(p_oApplSysOrApplSysType, anRespTypes);
    // Sort the array of persons in descending order
    aPersonsWithRoles.sort(sortPersonWithRoleReverse);
    // Start the output table
    g_oOutfile.BeginTable(100, convertToDoubles([32, 68]), COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    var bColoredRow = true;
    // Helper map for getting the label for a certain responsibility type
    var mapStringsForRespTypes = new java.util.HashMap();
    for (var i=0; i<g_aRespTypes.length; i++) {
        mapStringsForRespTypes.put(g_aRespTypes[i][1], g_aRespTypes[i][2]);
    }
    var bAdditionalRespMaintained = false;
    // Add persons
    for (var i=0; i<anRespTypes.length; i++) {
        var nRespType = anRespTypes[i];
        var sRespTypeString = mapStringsForRespTypes.get(nRespType);
        var j = aPersonsWithRoles.length;
        while (j--) {
            var oPersRole = aPersonsWithRoles[j];
            if (oPersRole.nRole == nRespType) {
                outPersonWithDetails(oPersRole.oPerson, getString(sRespTypeString), bColoredRow);
                bColoredRow = !bColoredRow;
                aPersonsWithRoles.splice(j, 1);
                bAdditionalRespMaintained = true;
            }
        }
    }
    // Add the rest of the persons without a special responsibility
    aPersonsWithRoles = getPersons(p_oApplSysOrApplSysType, null);
    aPersonsWithRoles.sort(sortPersonWithRoleReverse);
    var i = aPersonsWithRoles.length;
    while (i--) {
        outPersonWithDetails(aPersonsWithRoles[i].oPerson, getString("TEXT_67"), bColoredRow);
        bColoredRow = !bColoredRow;
        bAdditionalRespMaintained = true;
    }
    if (!bAdditionalRespMaintained) {
        outPersonWithDetails(null, getString("TEXT_67"), bColoredRow);
        bColoredRow = !bColoredRow;
    }
    // Close the table
    g_oOutfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
    // No additional responsibilities maintained
}

function outPersonWithDetails(p_oPers, p_sLabel, p_bColoredRow) {
    var sName = "—";
    var sPhoneNum = "";
    var sEmail = "";
    if (p_oPers != null) {
        sName = getAttrValue(p_oPers, Constants.AT_NAME, true);
        if (sName.length <= 0) sName = "—";
        sPhoneNum = getAttrValue(p_oPers, Constants.AT_PHONE_NUM, false);
        sEmail = getAttrValue(p_oPers, Constants.AT_EMAIL_ADDR, false);
    }
    var nRowSpan = 1;
    if (sPhoneNum.length > 0) nRowSpan++;
    if (sEmail.length > 0) nRowSpan++;
    outInfoWithRowSpanOnFirstCol(p_sLabel, sName, p_bColoredRow, nRowSpan);
    if (sPhoneNum.length > 0) outInfoWithRowSpanOnFirstCol("", sPhoneNum, p_bColoredRow, null);
    if (sEmail.length > 0) outInfoWithRowSpanOnFirstCol("", sEmail, p_bColoredRow, null);
}

function sortPersonWithRole(a, b) {
    if (a.nRole < b.nRole)
        return -1;
    if (a.nRole > b.nRole)
        return 1;
    if (a.nRole == b.nRole) {
        var tmp_lhs = new java.lang.String(getObjName(a.oPerson));
        return tmp_lhs.compareTo(new java.lang.String(getObjName(b.oPerson)));
    }
}

function sortPersonWithRoleReverse(a, b) {
    if (a.nRole > b.nRole)
        return -1;
    if (a.nRole < b.nRole)
        return 1;
    if (a.nRole == b.nRole) {
        var tmp_lhs = new java.lang.String(getObjName(b.oPerson));
        return tmp_lhs.compareTo(new java.lang.String(getObjName(a.oPerson)));
    }
}

function outOrgUnits(p_oObjDefs, p_oApplSysOrApplSysType, p_bColoredRow) {
    var oOrgUnits = ArisData.Unique(p_oObjDefs);

    var aOrgUnitsWithRoles = new Array();
    var sRole = null;
    var sName = "";
    
    for (var i = 0; i < oOrgUnits.length; i++) {
        var oOrgUnit = oOrgUnits[i];

        var aRoles = getRoleArray(oOrgUnit, p_oApplSysOrApplSysType);
        for (var j = 0; j < aRoles.length; j++) {
            aOrgUnitsWithRoles.push(new PERSON_ROLE(oOrgUnit, aRoles[j]))
        }
    }
    aOrgUnitsWithRoles.sort(sortPersonWithRole);

    for (var i = 0; i < aOrgUnitsWithRoles.length; i++) {
        sRole = aOrgUnitsWithRoles[i].nRole;
        if (sRole != null && sRole == (Constants.AVT_SUPPORT_TYPE_SYS_RESP)) {
            var oOrgUnit = aOrgUnitsWithRoles[i].oPerson;
            sName = getAttrValue(oOrgUnit, Constants.AT_NAME, true);
        } 
    }

    // FIXME: Why do we only write out one name if we try to handle multiple org units in the code above?
    outInfoWithRowSpanOnFirstCol(getString("TEXT_66"), sName.length > 0 ? sName : "—", p_bColoredRow, 1);
}

// Capabilities and Managed Data
function outObjectList(p_oObjDefList, capabilities) {
    if (p_oObjDefList.length == 0) {
        if(capabilities) {
            outDescription(getString("TEXT_1"));
        } else {
            outDescription(getString("TEXT_154"));
        }
        return;
    }
    g_oOutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    p_oObjDefList = workaroundForArrayNamesSort(p_oObjDefList);
    //p_oObjDefList = p_oObjDefList.sort(comparator);
    var bColoredTableCell = true;
    for (var i = 0; i < p_oObjDefList.length; i++) {
        //var sName = getAttrValue(p_oObjDefList[i], Constants.AT_NAME, true);
        var sName = p_oObjDefList[i];
        g_oOutfile.TableRow();
        g_oOutfile.TableCellF(sName, 100, getStyleColored("TBL_STD", bColoredTableCell));
        bColoredTableCell = !bColoredTableCell;
    }
    g_oOutfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
}

// Usage
function outProcessUsage(p_oObjDefList) {
    if (p_oObjDefList.length == 0) {
        outDescription(getString("TEXT_20"));
        return;
    }
    g_oOutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    //p_oObjDefList.sort(comparator);
    p_oObjDefList = workaroundForArrayNamesSort(p_oObjDefList);
    var bColoredTableCell = true;
    for (var i = 0; i < p_oObjDefList.length; i++) {
        //var sProcessName = getAttrValue(p_oObjDefList[i], Constants.AT_NAME, true);
        var sProcessName = p_oObjDefList[i];
        g_oOutfile.TableRow();
        g_oOutfile.TableCellF(sProcessName, 100, getStyleColored("TBL_STD", bColoredTableCell));
        bColoredTableCell = !bColoredTableCell;
    }
    g_oOutfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
}

// Supported processes
function outProcessHierarchy(p_oObjDefList) {
    if (p_oObjDefList.length == 0) {
        outDescription(getString("TEXT_151"));
        return;
    }
    g_oOutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    //p_oObjDefList.sort(comparator);
    p_oObjDefList = workaroundForArrayNamesSort(p_oObjDefList);
    var bColoredTableCell = true;
    for (var i = 0; i < p_oObjDefList.length; i++) {
        var sName = p_oObjDefList[i];
        //var sName = getAttrValue(p_oObjDefList[i], Constants.AT_NAME, true);
        g_oOutfile.TableRow();
        g_oOutfile.TableCellF(sName, 100, getStyleColored("TBL_STD", bColoredTableCell));
        bColoredTableCell = !bColoredTableCell;
    }
    g_oOutfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
}

// Interfaces
function outInterfaces(p_oApplSystem) {
    oApplSystems = new Array();
    oApplSystems.push(p_oApplSystem);

    var aRowData = getTableContent(oApplSystems, false);
    var bColoredTableCell = false;
    if (aRowData.length > 0) {

        g_oOutfile.BeginTable(100, convertToDoubles([20, 10, 20, 20, 30]), COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        g_oOutfile.TableRow();
        // System
        g_oOutfile.TableCellF(getString("TEXT_146"), 1, 1, "TBL_HEAD");
        // Direction
        g_oOutfile.TableCellF("↔", 1, 1, "TBL_HEAD");
        // External system
        g_oOutfile.TableCellF(getString("TEXT_147"), 1, 1, "TBL_HEAD");
        // Protocol
        g_oOutfile.TableCellF(getString("TEXT_41"), 1, 1, "TBL_HEAD");
        // Data type
        g_oOutfile.TableCellF(getString("TEXT_148"), 1, 1, "TBL_HEAD");

        for (var i = 0; i < aRowData.length; i++) {
            var sDirection = aRowData[i].sDirection == DIRECTION_OUT ? "→" : "←";
            var aoData = aRowData[i].oData;
            var nRowSpan = aoData != null && aoData.length > 1 ? aoData.length : 1;
            g_oOutfile.TableRow();
            g_oOutfile.TableCellF(getName(aRowData[i].oSource), nRowSpan, 1, getStyleColored("TBL_STD", bColoredTableCell));
            g_oOutfile.TableCellF(sDirection, nRowSpan, 1, getStyleColored("TBL_STD", bColoredTableCell));
            g_oOutfile.TableCellF(getName(aRowData[i].oTarget), nRowSpan, 1, getStyleColored("TBL_STD", bColoredTableCell));
            g_oOutfile.TableCellF(getName(aRowData[i].oProtocol), nRowSpan, 1, getStyleColored("TBL_STD", bColoredTableCell));
            g_oOutfile.TableCellF(aoData != null && aoData.length > 0 ? getName(aoData[0]) : "", 1, 1, getStyleColored("TBL_STD", bColoredTableCell));
            if (aoData != null && aoData.length > 1) {
                for (j=1; j<aoData.length; j++) {
                    g_oOutfile.TableRow();
                    g_oOutfile.TableCellF(getName(aoData[j]), 1, 1, getStyleColored("TBL_STD", bColoredTableCell));
                }
            }
            bColoredTableCell = !bColoredTableCell;
        }
        g_oOutfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
        outAssignedModel(p_oApplSystem, Constants.MT_PRG_STRCT_CHRT);
    } else {
        outDescription(getString("TEXT_43"));
    }
}

// Technical architecture
function outTechnicalArchitecture(oApplSysType) {
    
    var oIrrelevantArchElements = getConnectedObjects(oApplSysType, Constants.EDGES_IN, Constants.CT_IS_NOT_RELEVANT_FOR, Constants.OT_ARCH_ELEMENT);
    var oComponents = getConnectedObjects(oApplSysType, Constants.EDGES_OUT, Constants.CT_USE_1, Constants.OT_APPL_SYS_TYPE);
    var oHWComponents = getConnectedObjects(oApplSysType, Constants.EDGES_OUT, Constants.CT_CAN_RUN_ON, Constants.OT_HW_CMP_TYPE);
    var oTechTrmComponents = getConnectedObjects(oApplSysType, Constants.EDGES_IN, Constants.CT_IS_INP_FOR, Constants.OT_TECH_TRM);
    var oProtocols = getConnectedObjects(oApplSysType, Constants.EDGES_OUT, Constants.CT_USE_1, Constants.OT_NW_PROT);
    
    // create arrays of elements
    var managementProcesses = new Array(); var primaryProcesses = new Array(); var supportProcesses = new Array(); var databases = new Array();
    var dataWarehouse = new Array(); var email = new Array(); var collaboration = new Array(); var businessIntelligence = new Array();
    var documentAndContentManagement = new Array(); var systemAndApplicationIntegration = new Array(); var enterpriseApplicationsIntegration = new Array();
    var workflow = new Array(); var directoryServices = new Array(); var officeApplications = new Array(); var projectManagement = new Array();
    var typeOfSWDistribution = new Array(); var businessProcessDesign = new Array(); var businessProcessImplementation = new Array(); var businessProcessControlling = new Array();
    var userAuthentication = new Array(); var userManagement = new Array(); var authorizationAccessManagement = new Array(); var authorizationAndAcessControl = new Array();
    var enterpriseUserDirectory = new Array(); var runtimeEnvironment = new Array(); var operatingSystems = new Array(); var hardwareServer = new Array();
    var storageSolutions = new Array(); var networkComponents = new Array(); var networkProtocols = new Array(); var richClientTechn = new Array();
    var thinClientTechn = new Array(); var htmlPortalClientTechn= new Array(); var webServer = new Array(); var webAppServer = new Array(); var portalTechn = new Array();
    var methodologyDev = new Array(); var frameworksSWTechn = new Array(); var programmingLanguages = new Array(); var development = new Array();
    var testTools = new Array(); var changeConfManagementTools = new Array(); var modelingTools = new Array(); var irrelevantIDs = new Array();    
    
    for(var i = 0; i<oIrrelevantArchElements.length; i++) {
        var sArchID = getAttrValue(oIrrelevantArchElements[i], Constants.AT_ARCH_ELEMENT, true);    
        irrelevantIDs.push(sArchID);
    }
    
    sArchID = null;
    oComponents = oComponents.concat(oIrrelevantArchElements);
    
    for(var j = 0; j<oComponents.length; j++) {
        // 1. find out to which architecture component belongs
        var oArch = getConnectedObjects(oComponents[j], Constants.EDGES_OUT, Constants.CT_BELONGS_TO_1, Constants.OT_ARCH_ELEMENT);
        
        if(oIrrelevantArchElements.contains(oComponents[j])) {
            oArch = new Array(oComponents[j]);
            oComponents[j] = "IR";
        }
        
        // 2. find ID of architecture
        for(var k = 0; k<oArch.length; k++) {
        var sArchID = getAttrValue(oArch[k], Constants.AT_ARCH_ELEMENT, true);

        switch(sArchID) {
            case "ManagementProcesses": managementProcesses.push(oComponents[j]); break;
            case "PrimaryProcesses": primaryProcesses.push(oComponents[j]); break;
            case "SupportProcesses": supportProcesses.push(oComponents[j]); break;
            case "databases": databases.push(oComponents[j]); break;
            case "Warehouse": dataWarehouse.push(oComponents[j]); break;
            case "eMail": email.push(oComponents[j]); break;
            case "Collaboration": collaboration.push(oComponents[j]); break;
            case "BusinessIntelligence": businessIntelligence.push(oComponents[j]); break;
            case "DocumentAndContentManagement": documentAndContentManagement.push(oComponents[j]); break;
            case "SystemAndApplicationManagement": systemAndApplicationIntegration.push(oComponents[j]); break;
            case "EnterpriseAppIntegration": enterpriseApplicationsIntegration.push(oComponents[j]); break;
            case "Workflow": workflow.push(oComponents[j]); break;
            case "DirectoryServices": directoryServices.push(oComponents[j]); break;
            case "OfficeApplications": officeApplications.push(oComponents[j]); break;
            case "ProjectManagement": projectManagement.push(oComponents[j]); break;
            case "BusinessProcessDesign": businessProcessDesign.push(oComponents[j]); break;
            case "BusinessProcessImplementation": businessProcessImplementation.push(oComponents[j]); break;
            case "BusinessProcessControlling": businessProcessControlling.push(oComponents[j]); break;
            case "UserAuthentication": userAuthentication.push(oComponents[j]); break;
            case "UserManagement": userManagement.push(oComponents[j]); break;
            case "AuthorizationAccessManagement": authorizationAccessManagement.push(oComponents[j]); break;
            case "AuthorizationAndAccessControl": authorizationAndAcessControl.push(oComponents[j]); break;
            case "EnterpriseUserDirectory": enterpriseUserDirectory.push(oComponents[j]); break;
            case "RuntimeEnvironment": runtimeEnvironment.push(oComponents[j]); break;
            case "OperatingSystems": operatingSystems.push(oComponents[j]); break;
            case "StorageSolutions": storageSolutions.push(oComponents[j]); break;
            case "NetworkComponents": networkComponents.push(oComponents[j]); break;
            case "RichClientTechnology": richClientTechn.push(oComponents[j]); break;
            case "ThinClientTechnology": thinClientTechn.push(oComponents[j]); break;
            case "HTMLPortalClientTechnology": htmlPortalClientTechn.push(oComponents[j]); break;
            case "WebServer" : webServer.push(oComponents[j]); break;
            case "WebApplicationServer": webAppServer.push(oComponents[j]); break;
            case "PortalTechnology": portalTechn.push(oComponents[j]); break;
            case "FrameworksAndSoftwareTechnologie": frameworksSWTechn.push(oComponents[j]); break;
            case "ProgrammingLanguages": programmingLanguages.push(oComponents[j]); break;
            case "ChangeConfManagementTools": changeConfManagementTools.push(oComponents[j]); break;
            case "ModelingTools": modelingTools.push(oComponents[j]); break;
            case "integratedDesktopEnvironment": development.push(oComponents[j]); break;
            case "testTools": testTools.push(oComponents[j]); break;
            default:
        }
    }
    }
    
    sArchID = null;
    oHWComponents = oHWComponents.concat(oIrrelevantArchElements);
     for(var l = 0; l<oHWComponents.length; l++) {
        // 1. find out to which architecture component belongs
        var oArch = getConnectedObjects(oHWComponents[l], Constants.EDGES_OUT, Constants.CT_BELONGS_TO_1, Constants.OT_ARCH_ELEMENT);
        
        if(oIrrelevantArchElements.contains(oHWComponents[l])) {
            oArch = new Array(oHWComponents[l]);
            oHWComponents[l] = "IR";
        }
        // 2. find ID of architecture
        for(var m = 0; m<oArch.length; m++) {
        var sArchID = getAttrValue(oArch[m], Constants.AT_ARCH_ELEMENT, true);
        
        switch(sArchID) {
            case "HardwareServer": hardwareServer.push(oHWComponents[l]); break;
            case "StorageSolutions": storageSolutions.push(oHWComponents[l]); break;
            default:
        }
    }
    }
    
    sArchID = null;
    oTechTrmComponents = oTechTrmComponents.concat(oIrrelevantArchElements);
    for(var n = 0; n<oTechTrmComponents.length; n++) {
        // 1. find out to which architecture component belongs
        var oArch = getConnectedObjects(oTechTrmComponents[n], Constants.EDGES_OUT, Constants.CT_BELONGS_TO_1, Constants.OT_ARCH_ELEMENT);
        
        if(oIrrelevantArchElements.contains(oTechTrmComponents[n])) {
            oArch = new Array(oTechTrmComponents[n]);
            oTechTrmComponents[n] = "IR";
        }
        // 2. find ID of architecture
        for(var o = 0; o<oArch.length; o++) {
        var sArchID = getAttrValue(oArch[o], Constants.AT_ARCH_ELEMENT, true);
        
        switch(sArchID) {
            case "MethodologyDevelopment": methodologyDev.push(oTechTrmComponents[n]); break;
            case "TypeOfSoftwareDistribution": typeOfSWDistribution.push(oTechTrmComponents[n]); break;
            default:
        }
    }
    }
    
    sArchID = null;
    oProtocols = oProtocols.concat(oIrrelevantArchElements);
    for(var p = 0; p<oProtocols.length; p++) {
        // 1. find out to which architecture component belongs
        var oArch = getConnectedObjects(oProtocols[p], Constants.EDGES_OUT, Constants.CT_BELONGS_TO_1, Constants.OT_ARCH_ELEMENT);
        
        if(oIrrelevantArchElements.contains(oProtocols[p])) {
            oArch = new Array(oProtocols[p]);
            oProtocols[p] = "IR";
        }
        
        // 2. find ID of architecture
        for(var q = 0; q<oArch.length; q++) {
        var sArchID = getAttrValue(oArch[q], Constants.AT_ARCH_ELEMENT, true);
        
        switch(sArchID) {
            case "NetworkProtocols": networkProtocols.push(oProtocols[p]); break;
            default:
        }
    }
    }
    
    var BusinessProcSCSNames = [getString("TEXT_74"), getString("TEXT_75"), getString("TEXT_76")];
    var StandardTechnBSNames = [getString("TEXT_92"), getString("TEXT_93"), getString("TEXT_94"), getString("TEXT_95"), getString("TEXT_96"), getString("TEXT_97"), getString("TEXT_98"), getString("TEXT_99"), getString("TEXT_100"), getString("TEXT_101")];
    var OfficeApplicationsNames = [getString("TEXT_102"), getString("TEXT_103"), getString("TEXT_104")];
    var BusinessProcManNames = [getString("TEXT_105"), getString("TEXT_106"), getString("TEXT_107")];
    var AimNames = [getString("TEXT_108"), getString("TEXT_109"), getString("TEXT_110"), getString("TEXT_111"), getString("TEXT_112"), getString("TEXT_113")];
    var InfrastructureNames = [getString("TEXT_114"), getString("TEXT_115"), getString("TEXT_116"), getString("TEXT_117"), getString("TEXT_118")];
    var FrontEndTechNames = [getString("TEXT_119"), getString("TEXT_120"), getString("TEXT_121")];
    var WebTechNames = [getString("TEXT_122"), getString("TEXT_123"), getString("TEXT_124")];
    var DevelopmentNames = [getString("TEXT_125"), getString("TEXT_126"), getString("TEXT_127")];
    var DevToolsNames = [getString("TEXT_128"), getString("TEXT_129"), getString("TEXT_130"), getString("TEXT_131")];   
    
    
    fillTechnicalArchitectureTable(getString("TEXT_73"), BusinessProcSCSNames, new Array(managementProcesses, primaryProcesses, supportProcesses));
    fillTechnicalArchitectureTable(getString("TEXT_133"), StandardTechnBSNames, new Array(databases, dataWarehouse, email, collaboration, businessIntelligence,documentAndContentManagement, systemAndApplicationIntegration, enterpriseApplicationsIntegration, workflow, directoryServices));
    fillTechnicalArchitectureTable(getString("TEXT_102"), OfficeApplicationsNames, new Array(officeApplications, projectManagement, typeOfSWDistribution));
    fillTechnicalArchitectureTable(getString("TEXT_134"), BusinessProcManNames, new Array(businessProcessDesign, businessProcessImplementation, businessProcessControlling));
    fillTechnicalArchitectureTable(getString("TEXT_135"), AimNames, new Array(userAuthentication, userManagement, authorizationAccessManagement, authorizationAndAcessControl, enterpriseUserDirectory, runtimeEnvironment));
    fillTechnicalArchitectureTable(getString("TEXT_136"), InfrastructureNames, new Array(operatingSystems, networkProtocols, hardwareServer, storageSolutions, networkComponents));
    fillTechnicalArchitectureTable(getString("TEXT_137"), FrontEndTechNames, new Array(richClientTechn, thinClientTechn, htmlPortalClientTechn));
    fillTechnicalArchitectureTable(getString("TEXT_138"), WebTechNames, new Array(webServer, webAppServer, portalTechn));
    fillTechnicalArchitectureTable(getString("TEXT_139"), DevelopmentNames, new Array(methodologyDev, frameworksSWTechn, programmingLanguages));
    fillTechnicalArchitectureTable(getString("TEXT_140"), DevToolsNames, new Array(development, testTools, changeConfManagementTools, modelingTools));
}

function outInstance(oApplSysType) {
    var oInstances = getConnectedObjects(oApplSysType, Constants.EDGES_IN, Constants.CT_IS_OF_TYPE_3, Constants.OT_APPL_SYS);
    //oInstances.sort(comparator);
    var oInstancesNames = workaroundForArrayNamesSort(oInstances);
    oInstances = sortObjectsForWorkaround(oInstances, oInstancesNames);
    
    for (var i = 0; i < oInstances.length; i++) {

        var oResponsible = getConnectedObjects(oInstances[i], Constants.EDGES_IN, Constants.CT_IS_RESP_1, Constants.OT_PERS);
        var oUnit = getConnectedObjects(oInstances[i], Constants.EDGES_IN, Constants.CT_IS_RESP_1, Constants.OT_ORG_UNIT);
        var oHardware = getConnectedObjects(oInstances[i], Constants.EDGES_IN, Constants.CT_IS_PLTFRM_OF, Constants.OT_HW_CMP);

        g_oOutfile.OutputLnF(getAttrValue(oInstances[i], Constants.AT_NAME, true), "HEADING3");
        if (oResponsible.length == 0 && oUnit.length == 0 && oHardware.length == 0)
            outDescription(getString("TEXT_160"));
        if (oResponsible.length > 0 || oUnit.length > 0) {
            outInstanceResponsibility(oResponsible, oUnit);
        }
        if (oHardware.length > 0) {
            outInstanceHardware(oHardware);
        }
    }
}

function outInstanceResponsibility(p_oResponsible, p_oUnit) {
    var sResponsibleName = getAttrValue(p_oResponsible[0], Constants.AT_NAME, true);
    var sUnitName = getFallbackAttrValue(p_oUnit[0], Constants.AT_NAME, true);

    g_oOutfile.OutputLnF(getString("TEXT_61"), "MINISEC");
    var bColoredTableCell = true;
    g_oOutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    if (p_oResponsible.length > 0) {
        outInfo(getString("TEXT_62"), sResponsibleName, bColoredTableCell);
        var sPhone = getAttrValue(p_oResponsible[0], Constants.AT_PHONE_NUM, true);
        if (sPhone.length > 0) {
            outInfo("", sPhone, bColoredTableCell);
        }
        var sMail = getAttrValue(p_oResponsible[0], Constants.AT_EMAIL_ADDR, true);
        if (sMail.length > 0) {
            outInfo("", sMail, bColoredTableCell);
        }
        bColoredTableCell = false;
    }
    if (p_oUnit.length > 0) {
        outInfo(getString("TEXT_66"), sUnitName, bColoredTableCell);
    }
    g_oOutfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
}

function outInstanceHardware(p_oHardware) {
    g_oOutfile.OutputLnF(getString("TEXT_149"), "MINISEC");
    var bColoredTableCell = true;
    g_oOutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    g_oOutfile.TableRow();
    g_oOutfile.TableCellF(getString("TEXT_28"), 50, "TBL_HEAD");
    g_oOutfile.TableCellF(getString("TEXT_145"), 50, "TBL_HEAD");
    for (var i = 0; i < p_oHardware.length; i++) {
        var sHWName = getAttrValue(p_oHardware[i], Constants.AT_NAME, true);
        var sHWState = getAttrValue(p_oHardware[i], Constants.AT_OPERATING_STATE, true);
        g_oOutfile.TableRow();
        g_oOutfile.TableCellF(sHWName, 50, getStyleColored("TBL_STD", bColoredTableCell));
        g_oOutfile.TableCellF(sHWState, 50, getStyleColored("TBL_STD", bColoredTableCell));
        bColoredTableCell = !bColoredTableCell;
    }
    g_oOutfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
}

///////////////////////////////// Helper functions

function getObjName(p_oItem) {
    if (p_oItem == null)
        return "—";
    return p_oItem.Name(g_nLoc);
}

function outHeading1(p_sText) {
    g_oOutfile.OutputLnF(p_sText, "HEADING1");
}

function outHeading2(p_sText) {
    g_oOutfile.OutputLnF(p_sText, "HEADING2");
}

function outHeading3(p_sText) {
    g_oOutfile.OutputLnF(p_sText, "MINISEC");
}

function outDescription(p_sText) {
    g_oOutfile.OutputLnF(p_sText, "STD");
}

function outInfo(p_sLabel, p_sInfo) {
    g_oOutfile.TableRow();
    g_oOutfile.TableCellF(p_sLabel, 32, "TBL_STD"/*"TBL_FIRSTCOL"*/); // Formerly the first column had special formatting.
    g_oOutfile.TableCellF(p_sInfo, 68, "TBL_STD");
}

function outInfo(p_sLabel, p_sInfo, p_bColored) {
    g_oOutfile.TableRow();
    g_oOutfile.TableCellF(p_sLabel, 32, getStyleColored("TBL_STD", p_bColored));
    g_oOutfile.TableCellF(p_sInfo, 68, getStyleColored("TBL_STD", p_bColored));
}

function outInfoWithRowSpanOnFirstCol(p_sLabel, p_sInfo, p_bColored, p_nRowSpan) {
    g_oOutfile.TableRow();
    if (p_nRowSpan) {
        g_oOutfile.TableCellF(p_sLabel, p_nRowSpan, 1, getStyleColored("TBL_STD", p_bColored));
    }
    g_oOutfile.TableCellF(p_sInfo, 1, 1, getStyleColored("TBL_STD", p_bColored));
}

function outInfo3(p_sLabel, p_sName, p_sStatus, p_bColored) {
    g_oOutfile.TableRow();
    g_oOutfile.TableCellF(p_sLabel, 40, getStyleColored("TBL_STD", p_bColored));
    g_oOutfile.TableCellF(p_sName, 35, getStyleColored("TBL_STD", p_bColored));
    g_oOutfile.TableCellF(p_sStatus, 25, getStyleColored("TBL_STD", p_bColored));
}

function outAssignedModel(p_oObjDef, p_nModelTypeNum) {
    var oAssignedModels = p_oObjDef.AssignedModels();
    for (var i = 0; i < oAssignedModels.length; i++) {
        var oModel = oAssignedModels[i];

        if (oModel.TypeNum() == p_nModelTypeNum) {
            var pic = oModel.Graphic(false,false,-1);
            var nPicWidthMM = parseInt(g_oOutfile.GetPageWidth() - g_oOutfile.GetLeftMargin() - g_oOutfile.GetRightMargin());
            var nPicHeightMM = parseInt(g_oOutfile.GetPageHeight() - g_oOutfile.GetTopMargin() - g_oOutfile.GetBottomMargin() - 60);
            g_oOutfile.OutputLn("", getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            g_oOutfile.OutGraphic(pic, -1, nPicWidthMM, nPicHeightMM);
            g_oOutfile.OutputLn("", getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            g_oOutfile.OutputLn("", getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
            break;
        }
    }
}

function getAttrValue(p_oItem, p_nAttrType, p_bRemoveLF) {
    var oAttr = null;
    if (p_oItem != null) {
        var list = p_oItem.AttrList(g_nLoc);
        for(var m = 0; m<list.length; m++) {
            var attr = list[m];
            if(attr.TypeNum() == p_nAttrType) {
                oAttr = attr;
                continue;
            }
        }

        if(oAttr != null) {
            return "" + oAttr.getValue();
        }
    }
    return "";
}

function getFallbackAttrValue(p_oItem, p_nAttrType, p_bRemoveLF) {
    var oAttr = null;
    if (p_oItem != null) {
        var list = p_oItem.AttrList(g_nLoc, true);
        for(var m = 0; m<list.length; m++) {
            var attr = list[m];
            if(attr.TypeNum() == p_nAttrType) {
                oAttr = attr; 
                continue;
            }
        }

        if(oAttr != null) {
            return "" + oAttr.getValue();
        }
    }
    return "";
}

function getAttrMeasureUnitTypeNum(p_oItem, p_nAttrType) {
    var oAttr = null;
    if (p_oItem != null) {
        var list = p_oItem.AttrList(g_nLoc, true);
        for(var m = 0; m<list.length; m++) {
            var attr = list[m];
            if(attr.TypeNum() == p_nAttrType) {
                oAttr = attr; 
                continue;
            }
        }

        if(oAttr != null) {
            return "" + oAttr.MeasureUnitTypeNum();
        }
    }
      return -1;
    /*
    if (p_oItem != null) {
        var oAttr = p_oItem.Attribute(p_nAttrType, g_nLoc);
        if (oAttr != null && oAttr.IsMaintained()) {
            return oAttr.MeasureUnitTypeNum();
        }
    }
    return -1;
    */
}

function getConnectedObjects(p_oObjDef, p_cxnKind, p_cxnTypeNum, p_connectObjTypeNum) {
    var aConnectObjDefs = new Array();

    var oCxns = p_oObjDef.CxnListFilter(p_cxnKind, p_cxnTypeNum);
    for (var i = 0; i < oCxns.length; i++) {
        var oConnectObjDef;
        if (p_cxnKind == Constants.EDGES_OUT) {
            oConnectObjDef = oCxns[i].TargetObjDef();
        } else {
            oConnectObjDef = oCxns[i].SourceObjDef();
        }
        if (oConnectObjDef.TypeNum() == p_connectObjTypeNum) {
            aConnectObjDefs.push(oConnectObjDef);
        }
    }
    aConnectObjDefs.sort(comparator);

    return aConnectObjDefs;
}

function getRoleArray(p_oPerson, p_oApplSysOrApplSysType) {
    var aRoles = new Array();
    var oCxns = new Array();
    var oCxns = p_oApplSysOrApplSysType.CxnListFilter(Constants.EDGES_IN, Constants.CT_IS_RESP_1);
    for (var i = 0; i < oCxns.length; i++) {
        var oCxn = oCxns[i];
        if (oCxn.SourceObjDef().IsEqual(p_oPerson)) {
            aRoles.push(getAttrMeasureUnitTypeNum(oCxn, Constants.AT_SUPPORT_TYPE));
        }
    }
    return aRoles;
}

function outTableHeader(headerText) {
    g_oOutfile.TableRow();
    g_oOutfile.TableCellF(headerText, 100, "TBL_HEAD");
}

function outTechArchTableHeader() {
    g_oOutfile.TableRow();
    g_oOutfile.TableCellF(getString("TEXT_48"), 40, "TBL_HEAD");
    g_oOutfile.TableCellF(getString("TEXT_159"), 35, "TBL_HEAD");
    g_oOutfile.TableCellF(getString("TEXT_25"), 25, "TBL_HEAD");
}

function getDataTypeNamesList(dataTypeList) {
    var sResult = "";
    if (dataTypeList != null) {
        for (var i = 0; i < dataTypeList.length; i++) {
            sResult += getName(dataTypeList[i]);
            if (i < dataTypeList.length-1) sResult += "\n";
        }
    }
    return sResult;
}

function writeDocTable(docArray, docType) {
    var oDoc;
    var sAttrTitle;
    var sAttrLink;
    for (var j = 0; j < docArray.length; j++) {
        oDoc = docArray[j];
        sAttrLink = getFallbackAttrValue(oDoc, Constants.AT_EXT_1, true);
        sAttrTitle = getFallbackAttrValue(oDoc, Constants.AT_TITL1, true);
        if (sAttrTitle.length == 0) {
            sAttrTitle = oDoc.Name(g_nLoc);
        }
        var sTitleAndLink = sAttrTitle;
        if (sAttrLink.length > 0) {
            sTitleAndLink += "\n" + sAttrLink;
        }
        outInfo(docType, sTitleAndLink);
    }
}

function fillTechnicalArchitectureTable(tableName, names, elementsArray) {
    outHeading3(tableName);
    
    g_oOutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    outTechArchTableHeader();
    var bColoredTableCell = true;
    for(var i = 0; i<names.length; i++) {
        processTableRow(names[i], elementsArray[i], bColoredTableCell);
        bColoredTableCell = !bColoredTableCell;
    }
    g_oOutfile.EndTable("", 100, getString("FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}

function processTableRow(rowName, elementsArray, p_bColored) {
    if(elementsArray.length == 0) {
        outInfo3(rowName, "", "", p_bColored);
        return;
    }
    if(elementsArray.contains("IR")) {
        outInfo3(rowName, getString("TEXT_132"), "", p_bColored);
        return;
    }
    for (var i = 0; i < elementsArray.length; i++) {
        if (i == 0)
            outInfo3(rowName, getAttrValue(elementsArray[i], Constants.AT_NAME, true), getAttrValue(elementsArray[i], Constants.AT_STATUS_STANDARDIZATION, true), p_bColored);
        else
            outInfo3("", getAttrValue(elementsArray[i], Constants.AT_NAME, true), getAttrValue(elementsArray[i], Constants.AT_STATUS_STANDARDIZATION, true), p_bColored);
    }        
}

// only use as a workaround in case when sorting of object names doesn't work!
function workaroundForArrayNamesSort(array) {
    var listToSort = new Array();

    for(var i = 0; i<array.length; i++) {
        listToSort.push(array[i].Name(g_nLoc));
    }
    listToSort.sort();
    return listToSort;
}

function sortObjectsForWorkaround(array, listToSort) {
    var map = new Packages.java.util.HashMap();
    for(var i = 0; i<array.length; i++) {
        map.put(array[i].Name(g_nLoc), array[i]);
    }

    var sortedList = new Array();
    for(var j = 0; j<listToSort.length; j++) {
        sortedList.push(map.get(listToSort[j]));
    }
    return sortedList;    
}

function setupOutputObject(outputObj)
{
    outputObj.SetPageWidth(210.10)
    outputObj.SetPageHeight(297.20)
    outputObj.SetLeftMargin(20)
    outputObj.SetRightMargin(20)
    outputObj.SetTopMargin(30)
    outputObj.SetBottomMargin(30)
    outputObj.SetDistHeader(10)
    outputObj.SetDistFooter(10)
    outputObj.SetAutoTOCNumbering(true)
}
