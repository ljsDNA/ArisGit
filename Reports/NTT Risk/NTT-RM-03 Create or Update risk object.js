/*
 *
 *  Report Name: NTT-RM-03 Create or Update risk object
 *  Version: 1.1
 *  Date: 2023-04-11
 *  Author: BPExperts GmbH [MaHi]
 *
 *
 *  Description:
 *  --- v1.1 ---
 *  # Rename risk (AT_NAME) in case the name changed (not only the 'Risk Name' attribute)
 *
 *
 *  --- v1.0 ---
 *  # Run report on quick object
 *  # Risk object in main DB is created or updated based on user input
 *
 *
*/


var g_oDatabase = ArisData.getActiveDatabase();
var g_oFilter = g_oDatabase.ActiveFilter();
var g_nLoc = Context.getSelectedLanguage();


/////////////////////////////////////////////////////////////////
/// BELOW THIS LINE, ONLY CHANGE CAREFULLY //////////////////////
/////////////////////////////////////////////////////////////////


const g_nFIST_ID = 10000;
const g_nIdAttrTypeNum = AT_NTT_RM_RISK_ID;//Attribute for Risk ID (stored in objDef and DB-level)

// Property names to get info from dialog
const g_sPropertyNameSelectedPrincipleRisk = "NTT_RM_INPUT_SELECTED_PRINCIPLE_RISK_NAME";
const g_sPropertyNameSelectedSubRisk = "NTT_RM_INPUT_SELECTED_SUB_RISK_NAME";
const g_sPropertyNameSelectedDepartment = "NTT_RM_INPUT_SELECTED_DEPARTMENT";

function getContextVariablesToBeUpdatedInRiskObjDef(){
    return [
        {'sPropertyName':g_sPropertyNameSelectedPrincipleRisk, 'sAttributeTypeNum': AT_NTT_RM_PRINCIPAL_RISK_IMPACTED},
        {'sPropertyName':g_sPropertyNameSelectedSubRisk, 'sAttributeTypeNum': AT_NTT_RM_SUB_RISK_CATEGORY},
        {'sPropertyName':g_sPropertyNameSelectedDepartment, 'sAttributeTypeNum': AT_NTT_RM_DEPARTMENT}
    ];
}

const g_sPropertyOutReportExecutionSuccessful = "NTT_RM_OUTPUT_REPORT_EXECUTION_SUCCESSFUL";    // "true" or "false"
const g_sPropertyOutReportExecutionLogMessage = "NTT_RM_OUTPUT_REPORT_EXECUTION_LOG_MESSAGE";




const g_sMainRiskFolderPath = "Main group/Risk Management/3. Risks";


const g_sExcelOutputFileNamePrefix = "Risk-Version-Delta-";
const g_sExcelOutputFileFormat = ".xlsx";

const g_nAttrNameColumn = 1;
const g_nRiskColumn = 2;
const g_nQuickColumn = 3;
const g_nDeltaColumn = 4;

const g_nColumnWidthAttrName = 36*256;// Unit is 1/256
const g_nColumnWidthRisk = 36*256;
const g_nColumnWidthQuick = 36*256;
const g_nColumnWidthDelta = 36*256;


const g_sHeadlineAttrName = "Attribute";
const g_sHeadlineCurrentRisk = "Current Risk";
const g_sHeadlineUpdatedRisk = "Updated Risk";
const g_sHeadlineDelta = "Delta";

const g_nRowHeadline = 0;
const g_nRowAttributeStart = 1;

var oDateFormat = new java.text.SimpleDateFormat("dd.MM.yyyy");


//const g_nReferenceToQuickObjAttrTypeNum = Constants.AT_SRC; // The attribute that stores the GUID of the quick object
const g_nReferenceToQuickObjAttrTypeNum = AT_NTT_RM_RISK_GUID; // The attribute that stores the GUID of the quick object

//const g_sMainDatabaseName = "NTT-IMPORT-Log-Dummy";
// const g_sMainDatabaseName = "NTT_RM";
// const g_sMainDatabaseUsername = "arisservice";
// const g_sMainDatabasePassword = "arisservice";
// const g_sMainDatabaseFilterGUID = "dd838074-ac29-11d4-85b8-00005a4053ff";


/*
function getRiskFolderMapping(){
    return {
        'Chief Executive Officer': 'ELT/Commercial',
        'SVP Finance & Real Estate': 'ELT/Commercial',
        'Global Lead for Design': 'ELT/Commercial',
        'SVP Legal, Governace & Human Resources': 'ELT/Commercial',
        'SVP Design, Construction & Operations': 'ELT/Commercial',
        'VP Sales & Commercial': 'ELT/Commercial',
        'SVP Design': 'ELT/Commercial',
        'SVP L,G & HR, VP S&C': 'ELT/Commercial',
        'SVP D, C & Operations': 'ELT/Commercial'
    };
      
}
*/

function getRiskAttributes(){
    return [
        /*{
            'sXmlElementName': 'risk_risk_id',
            'sXlsImportColumn': 0,
            'sAttributeTypeNum': Constants.AT_AAM_RISK_ID,
            'sAttributeReadType': 'TRY_NUMBER_OR_STRING',
            'sValue': '',
            'sUnit': ''
        },*/
        {
            'sXmlElementName': 'risk_risk_status',
            'sXlsImportColumn': 1,
            'sAttributeTypeNum': AT_NTT_RM_RISK_STATUS,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_risk_identified_on',
            'sXlsImportColumn': 2,
            'sAttributeTypeNum': AT_NTT_RM_RISK_IDENTIFIED_ON,
            'sAttributeReadType': 'DATE',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_closing_remarks',
            'sXlsImportColumn': 3,
            'sAttributeTypeNum': AT_NTT_RM_CLOSING_REMARKS,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        /*{
            'sXmlElementName': 'risk_last_review',
            'sXlsImportColumn': 4,
            'sAttributeTypeNum': AT_NTT_RM_LAST_REVIEW,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },*/
        {
            'sXmlElementName': 'risk_exec_mgmt_ownership',
            'sXlsImportColumn': 5,
            'sAttributeTypeNum': AT_NTT_RM_EXEC_MGMT_OWNERSHIP,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_department',
            'sXlsImportColumn': 6,
            'sAttributeTypeNum': AT_NTT_RM_DEPARTMENT,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_principal_risk_impacted',
            'sXlsImportColumn': 7,
            'sAttributeTypeNum': AT_NTT_RM_PRINCIPAL_RISK_IMPACTED,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_sub_risk_category',
            'sXlsImportColumn': 8,
            'sAttributeTypeNum': AT_NTT_RM_SUB_RISK_CATEGORY,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_risk_category',
            'sXlsImportColumn': 9,
            'sAttributeTypeNum': AT_NTT_RM_RISK_CATEGORY,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_risk_name',
            'sXlsImportColumn': 10,
            'sAttributeTypeNum': AT_NTT_RM_RISK_NAME,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_risk_description',
            'sXlsImportColumn': 11,
            'sAttributeTypeNum': AT_NTT_RM_RISK_DESCRIPTION,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_risk_consequences',
            'sXlsImportColumn': 12,
            'sAttributeTypeNum': AT_NTT_RM_RISK_CONSEQUENCES,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_risk_identified_by',
            'sXlsImportColumn': 13,
            'sAttributeTypeNum': AT_NTT_RM_RISK_IDENTIFIED_BY,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_operational_ownership',
            'sXlsImportColumn': 14,
            'sAttributeTypeNum': AT_NTT_RM_OPERATIONAL_OWNERSHIP,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_gdc_emea_affected_country',
            'sXlsImportColumn': 15,
            'sAttributeTypeNum': AT_NTT_RM_GDC_EMEA_AFFECTED_COUNTRY,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_gdc_emea_affected_site',
            'sXlsImportColumn': 16,
            'sAttributeTypeNum': AT_NTT_RM_GDC_EMEA_AFFECTED_SITE,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_addected_building',
            'sXlsImportColumn': 17,
            'sAttributeTypeNum': AT_NTT_RM_AFFECTED_BUILDING,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_risk_reach',
            'sXlsImportColumn': 18,
            'sAttributeTypeNum': AT_NTT_RM_RISK_REACH,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_risk_impact',
            'sXlsImportColumn': 19,
            'sAttributeTypeNum': AT_NTT_RM_RISK_IMPACT,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_risk_probability',
            'sXlsImportColumn': 20,
            'sAttributeTypeNum': AT_NTT_RM_RISK_PROBABILITY,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_strength_of_controls',
            'sXlsImportColumn': 23,
            'sAttributeTypeNum': AT_NTT_RM_STRENGTH_OF_CONTROLS,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_risk_treatment_strategy',
            'sXlsImportColumn': 26,
            'sAttributeTypeNum': AT_NTT_RM_RISK_TREATMENT_STRATEGY,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_can_this_be_fixed',
            'sXlsImportColumn': 27,
            'sAttributeTypeNum': AT_NTT_RM_CAN_THIS_BE_FIXED,
            'sAttributeReadType': 'YES_NO',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_mitigation_name',
            'sXlsImportColumn': 28,
            'sAttributeTypeNum': AT_NTT_RM_MITIGATION_NAME,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_mitigation_description',
            'sXlsImportColumn': 29,
            'sAttributeTypeNum': AT_NTT_RM_MITIGATION_DESCRIPTION,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_mitigation_responsible',
            'sXlsImportColumn': 30,
            'sAttributeTypeNum': AT_NTT_RM_MITIGATION_RESPONSIBLE,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_mitigation_status',
            'sXlsImportColumn': 31,
            'sAttributeTypeNum': AT_NTT_RM_MITIGATION_STATUS,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_estimated_mitigation_costs',
            'sXlsImportColumn': 32,
            'sAttributeTypeNum': AT_NTT_RM_ESTIMATED_MITIGATION_COSTS,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_investment_committee_number',
            'sXlsImportColumn': 33,
            'sAttributeTypeNum': AT_NTT_RM_INVESTMENT_COMMITTEE_NUMBER,
            'sAttributeReadType': 'TRY_NUMBER_OR_STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_remarks',
            'sXlsImportColumn': 34,
            'sAttributeTypeNum': AT_NTT_RM_REMARKS,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_risk_trend',
            'sXlsImportColumn': 35,
            'sAttributeTypeNum': AT_NTT_RM_RISK_TREND,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_version_history_log',
            'sXlsImportColumn': 36,
            'sAttributeTypeNum': AT_NTT_RM_PROCESS_HISTORY_LOG,
            'sAttributeReadType': 'APPEND_STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_persons_to_be_notified',
            'sXlsImportColumn': 37,
            'sAttributeTypeNum': AT_NTT_RISK_PERSONS_TO_BE_NOTIFIED,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_strategic_risk',
            'sXlsImportColumn': 38,
            'sAttributeTypeNum': AT_NTT_RM_STRATEGIC_RISK,
            'sAttributeReadType': 'BOOL',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_financial_risk',
            'sXlsImportColumn': 39,
            'sAttributeTypeNum': AT_NTT_RM_FINANCIAL_RISK,
            'sAttributeReadType': 'BOOL',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_operational_risk',
            'sXlsImportColumn': 40,
            'sAttributeTypeNum': AT_NTT_RM_OPERATIONAL_RISK,
            'sAttributeReadType': 'BOOL',
            'sValue': '',
            'sUnit': ''
        },
        {
            'sXmlElementName': 'risk_compliance_risk',
            'sXlsImportColumn': 41,
            'sAttributeTypeNum': AT_NTT_RM_COMPLIANCE_RISK,
            'sAttributeReadType': 'BOOL',
            'sValue': '',
            'sUnit': ''
        }
        
    ];
    
}


/////////////////////////////////////////////////////////////////
/// DO NOT CHANGE ANYTHING BELOW THIS LINE //////////////////////
/////////////////////////////////////////////////////////////////


var g_oLoggerDateFormat = new java.text.SimpleDateFormat("yyyy.MM.dd HH:mm:ss:SSS");    // Timestamp format for logger
var g_oFileDateFormat = new java.text.SimpleDateFormat("yyyy-MM-dd--HH-mm-ss-SSS");    // Timestamp format for logger
var g_oImportDateFormat = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss:SSS");    // Timestamp format for logger
// The result object
var g_result = {
    bSuccess: true,
    aoMsg: []
}
const g_sCSVSeparator = ","; // separator for the CSV output file


/*
var g_oResult = {
    bSuccessful: true,
    asMsg: []
}
*/

var g_hmStyles = new java.util.HashMap();


var dateFormat = new java.text.SimpleDateFormat("MMMMM dd, yyyy");
var yearFormat = new java.text.SimpleDateFormat("yyyy");
var fileFormat = new java.text.SimpleDateFormat("yyyy.MM.dd");
var dateNow = new Date();





main();

function main()
{
    addLoggerLine(g_result, 'INFO', "Starting...");
    var oQuickObjDef = getQuickObjDef();
    
    var oMainDatabase = getMainDatabase();
    
    // Try to get the risk object, if it already exists
    var oRiskObjDef = getRiskObjDef(oMainDatabase, oQuickObjDef);
    
    if(oRiskObjDef==null){
        
        // NEW RISK OBJECT TO BE CREATED
        var oRiskGroup = getRiskFolder(oMainDatabase);//MainDB -> Look for the folder/group
        
        var sRiskName = readAttributeAsString(oQuickObjDef, AT_NTT_RM_RISK_NAME);
        if(sRiskName==null || ("".equals(sRiskName))){
            sRiskName = "(undefined)";
        }
        
        oRiskObjDef = createRiskObj(sRiskName, oRiskGroup);
        if(oRiskObjDef!=null && oRiskObjDef.IsValid()){
        
            setNewIdentifier(oRiskObjDef, "", oMainDatabase);
            
            copyAndOverwriteRiskInfo(oQuickObjDef, oRiskObjDef);
            updateRiskAttributesSelectedInDialog(oRiskObjDef);
            setLastReviewDate(oRiskObjDef);
    
            // SUB RISK
            var sSubRiskName = getSelectedDialogValueSubRiskName();
            connectRiskToSubRisk(oRiskObjDef, sSubRiskName, oMainDatabase);
            
            // Create assigned "Governance diagram"
            /*
            var sAffectedSiteName = readAttributeAsString(oRiskObjDef, AT_NTT_RM_GDC_EMEA_AFFECTED_SITE);
            var oAffectedSiteObjDef = getAffectedSiteObjDef(sAffectedSiteName, oMainDatabase);
            createAssignedGovernanceDiagram(oRiskObjDef, oAffectedSiteObjDef);
            */
            var sAffectedSiteName = readAttributeAsString(oRiskObjDef, AT_NTT_RM_GDC_EMEA_AFFECTED_SITE);
            if(getAssignedGovernanceDiagram(oRiskObjDef)==null){
                // There is no Governance Diagram yet, so create one now
                createAssignedGovernanceDiagram(oRiskObjDef);
            }
            // Now assign the new Affected Site
            assignedAffectedSiteInGovernanceDiagram(oRiskObjDef, sAffectedSiteName);
            
        }else{
            //g_oResult.bSuccessful=false;
            //g_oResult.asMsg.push("E001 - Could not create a new risk object.");
            g_result.bSuccess=false;
            addLoggerLine(g_result, 'FATAL', "E001 - Could not create a new risk object.");
        }
    }else if(oRiskObjDef!=null && oRiskObjDef.IsValid()){
        
        //EXISTING RISK TO BE UPDATED
        var oSelectedRiskGroup = getRiskFolder(oMainDatabase);//MainDB -> Look for the folder/group
        
        var sRiskName = readAttributeAsString(oQuickObjDef, AT_NTT_RM_RISK_NAME);
        if(sRiskName==null || ("".equals(sRiskName))){
            sRiskName = "(undefined)";
        }
        
        var bRiskMoved = moveRiskToSelectedFolder(oRiskObjDef, oSelectedRiskGroup);
        
        

        // SUB RISK
        var sSelectedSubRiskName = getSelectedDialogValueSubRiskName();
        var sCurrentSubRiskName = readAttributeAsString(oRiskObjDef, AT_NTT_RM_SUB_RISK_CATEGORY);
        if(!(""+sSelectedSubRiskName).equals(""+sCurrentSubRiskName)){
            removeCurrentSubRiskConnection(oRiskObjDef, sCurrentSubRiskName, oMainDatabase);
            connectRiskToSubRisk(oRiskObjDef, sSelectedSubRiskName, oMainDatabase);
        }
        
        
        // Create assigned "Governance diagram"
        checkAndUpdateAffectedSite(oRiskObjDef, oQuickObjDef);
        /*
        var sSelectedAffectedSiteName = readAttributeAsString(oQuickObjDef, AT_NTT_RM_GDC_EMEA_AFFECTED_SITE);
        var sCurrentAffectedSiteName = readAttributeAsString(oRiskObjDef, AT_NTT_RM_GDC_EMEA_AFFECTED_SITE);
        var oAffectedSiteObjDef = getAffectedSiteObjDef(sCurrentAffectedSiteName, oMainDatabase);
        createAssignedGovernanceDiagram(oRiskObjDef, oAffectedSiteObjDef);
        */
        
        copyAndOverwriteRiskInfo(oQuickObjDef, oRiskObjDef);
        updateRiskAttributesSelectedInDialog(oRiskObjDef);
        setLastReviewDate(oRiskObjDef);
        
        // Set risk name, in case it changed
        if(oRiskObjDef!=null && oRiskObjDef.Attribute(Constants.AT_NAME, g_nLoc)!=null){
            oRiskObjDef.Attribute(Constants.AT_NAME, g_nLoc).setValue(""+sRiskName);
        }
        
    }else{
        //g_oResult.bSuccessful=false;
        //g_oResult.asMsg.push("E002 - Could not create or update risk object.");
        g_result.bSuccess=false;
        addLoggerLine(g_result, 'FATAL', "E002 - Could not create or update risk object.");
    }
    
    
    //Context.setProperty(""+g_sPropertyOutReportExecutionSuccessful, (g_oResult.bSuccessful?"true":"false") );
    Context.setProperty(""+g_sPropertyOutReportExecutionSuccessful, (g_result.bSuccess?"true":"false") );
    generateOutputFileCSV(g_result, g_sCSVSeparator);        
    
}



function setLastReviewDate(oObjDef){
    
    if(oObjDef!=null){
        if(oObjDef.Attribute(AT_NTT_RM_LAST_REVIEW, g_nLoc)!=null){
            oObjDef.Attribute(AT_NTT_RM_LAST_REVIEW, g_nLoc).setValue(new Date());
        }
    }
 //   
}



function setNewIdentifier(oItem, sSuffix, oMainDatabase){
    
    var sIdToWrite = "" + g_nFIST_ID;
    
    if(oItem!=null && oItem.IsValid()){
        if(oItem.Attribute(g_nIdAttrTypeNum, g_nLoc)!=null){
                
            sIdToWrite = "" + getNewGlobalID(oMainDatabase) + sSuffix;
            
            oItem.Attribute(g_nIdAttrTypeNum, g_nLoc).setValue(""+sIdToWrite);
        }
    }
    return sIdToWrite;
}




function getNewGlobalID(oMainDatabase){
    
    var nLastId = g_nFIST_ID;
    
    if(oMainDatabase!=null){
        if(oMainDatabase.Attribute(g_nIdAttrTypeNum, g_nLoc)!=null){
            var sLastId = oMainDatabase.Attribute(g_nIdAttrTypeNum, g_nLoc).getValue();
            if(sLastId!=null){
                if("".equals(sLastId)){
                    nLastId = g_nFIST_ID;
                }
                try{
                    nLastId = java.lang.Integer.parseInt(""+sLastId);
                }catch(e){
                    nLastId = g_nFIST_ID;
                }
            }
        }
        
    }
    
    var sNewGlobalId = ""+(nLastId+1);
    var bWriteSuccessful = oMainDatabase.Attribute(g_nIdAttrTypeNum, g_nLoc).setValue(""+sNewGlobalId);
    
    if(!bWriteSuccessful){
        g_result.bSuccess=false;
        addLoggerLine(g_result, 'FATAL', "[getNewGlobalID] Could not write new global ID to database attribute!");
    }
    
    return sNewGlobalId;
}






function checkAndUpdateAffectedSite(oRiskObjDef, oQuickObjDef){


    var sSelectedAffectedSiteName = readAttributeAsString(oQuickObjDef, AT_NTT_RM_GDC_EMEA_AFFECTED_SITE);
    var sCurrentAffectedSiteName = readAttributeAsString(oRiskObjDef, AT_NTT_RM_GDC_EMEA_AFFECTED_SITE);
    
    if(!(""+sSelectedAffectedSiteName).equals(""+sCurrentAffectedSiteName)){
        if(getAssignedGovernanceDiagram(oRiskObjDef)==null){
            // There is no Governance Diagram yet, so create one now
            createAssignedGovernanceDiagram(oRiskObjDef);
        }else{
            // There is a Governance Diagram, so remove the old Afficted Site
            removeAffectedSiteFromGovernanceDiagram(oRiskObjDef, sCurrentAffectedSiteName);
        }
        // Now assign the new Affected Site
        assignedAffectedSiteInGovernanceDiagram(oRiskObjDef, sSelectedAffectedSiteName);
    }
    
    /*
    var oAffectedSiteObjDef = getAffectedSiteObjDef(sCurrentAffectedSiteName, oMainDatabase);
    createAssignedGovernanceDiagram(oRiskObjDef, oAffectedSiteObjDef);
    */
    
}


function getRiskFolder(oDatabase){
    oRiskGroup = null;
    
    var sSelectedDepartment = getSelectedDialogValueDepartment();
    //var sRiskFolderPath = getRiskFolderFromQuickObject(oQuickObjDef);
    
    // Try to get the actual risk group
    var oRiskGroup = oDatabase.Group("" + g_sMainRiskFolderPath+"/" + sSelectedDepartment, g_nLoc);
    
    if(oRiskGroup==null || !oRiskGroup.IsValid()){
        oRiskGroup = oDatabase.RootGroup(); //If risk group could not be found, return the root group
    }
    
    return oRiskGroup;
}

/*
function getRiskFolderFromQuickObject(oQuickObjDef){
    
    var sExecMgmtOwnership = readAttributeAsString(oQuickObjDef, AT_NTT_RM_EXEC_MGMT_OWNERSHIP);
    
    var oRiskFolderMapping = getRiskFolderMapping();
    
    return oRiskFolderMapping[""+sExecMgmtOwnership];
}
*/



function createRiskObj(sRiskName, oRiskGroup){
    var oRiskObjDef = null;

    if(sRiskName!=null && !("".equals(sRiskName))){
        
        oRiskObjDef = oRiskGroup.CreateObjDef(Constants.OT_RISK, ""+sRiskName, g_nLoc);
        if(oRiskObjDef!=null && oRiskObjDef.IsValid()){
            var bSymSet = oRiskObjDef.setDefaultSymbolNum(Constants.ST_RISK_1, true); // Propagate true, even though there shouldn't be any occs yet
        }
    }
    return oRiskObjDef;
}




function updateRiskAttributesSelectedInDialog(oRiskObjDef){

    if(oRiskObjDef!=null){
        var aoContextProperties = getContextVariablesToBeUpdatedInRiskObjDef();
        if(aoContextProperties!=null && aoContextProperties.length>0){
            for each(var oContextProperty in aoContextProperties){
                if(oContextProperty!=null && oContextProperty.sPropertyName!=null && oContextProperty.sAttributeTypeNum!=null){
                    var sValue = Context.getProperty(""+oContextProperty.sPropertyName);
                    oRiskObjDef.Attribute(oContextProperty.sAttributeTypeNum, g_nLoc).setValue(""+sValue);
                }
            }
        }
    }
        
}




function copyAndOverwriteRiskInfo(oQuickObjDef, oRiskObjDef){
    
    
    var aoRiskAttributes = getRiskAttributes();
    
    if(aoRiskAttributes!=null){
        for each(var oRiskAttribute in aoRiskAttributes){
            if(oRiskAttribute!=null){
                
                var vValue = readAttribute(oQuickObjDef, oRiskAttribute);
                
                writeAttribute(oRiskObjDef, oRiskAttribute, vValue)
                
                
            }
        }
    }
    
}





function moveRiskToSelectedFolder(oRiskObjDef, oSelectedRiskGroup){
    
    if(oRiskObjDef!=null && oRiskObjDef.IsValid() && oSelectedRiskGroup!=null){
        var sSelectedRiskGroupPath = oSelectedRiskGroup.Path(g_nLoc);
        var sCurrentRiskGroupPath = oRiskObjDef.Group().Path(g_nLoc);
        
        if(!(""+sCurrentRiskGroupPath).equals(""+sSelectedRiskGroupPath)){
            return oRiskObjDef.ChangeGroup(oSelectedRiskGroup);
        }
    }else{
        return false;
    }
    return true;
}








function initStyles(oWorkbook){
    var black = 0;
    
    
    if(oWorkbook!=null && g_hmStyles!=null){
        var oFont = oWorkbook.createFont();
        oFont.setFontName("Arial"); 
        oFont.setColor(black);
    
        var oCellStyleGeneral = oWorkbook.createCellStyle(oFont,1,1,1,1,Constants.C_GRAY,Constants.C_GRAY,Constants.C_GRAY,Constants.C_GRAY,Constants.ALIGN_LEFT,Constants.ALIGN_CENTER,Constants.C_TRANSPARENT,Constants.C_TRANSPARENT,Constants.SOLID_FOREGROUND);
        oCellStyleGeneral.setWrapText(true);  
        g_hmStyles.put("style-general", oCellStyleGeneral);
        
    
        var oCellStyleDelta = oWorkbook.createCellStyle(oFont,1,1,1,1,Constants.C_GRAY,Constants.C_GRAY,Constants.C_GRAY,Constants.C_GRAY,Constants.ALIGN_LEFT,Constants.ALIGN_CENTER,Constants.C_LIGHT_YELLOW,Constants.C_LIGHT_YELLOW,Constants.SOLID_FOREGROUND);
        oCellStyleDelta.setWrapText(true);  
        g_hmStyles.put("style-delta", oCellStyleDelta);
        
        
        var oFontBold = oWorkbook.createFont();
        oFontBold.setFontName("Arial"); 
        oFontBold.setColor(black);
        oFontBold.setBold(true);
        var oCellStyleHeadline = oWorkbook.createCellStyle(oFontBold,1,1,1,1,Constants.C_GRAY,Constants.C_GRAY,Constants.C_GRAY,Constants.C_GRAY,Constants.ALIGN_LEFT,Constants.ALIGN_CENTER,Constants.C_LIGHT_BLUE,Constants.C_LIGHT_BLUE,Constants.SOLID_FOREGROUND);
        oCellStyleHeadline.setWrapText(true);  
        g_hmStyles.put("style-headline", oCellStyleHeadline);
        
    }
       
}


function getStyle(sStyleName){
    
    if(g_hmStyles!=null){
        
        if(g_hmStyles.containsKey(""+sStyleName)){
            return g_hmStyles.get(""+sStyleName);
        }
    }
    return null;
}



function writeHeadlines(oSheet, nRow, oCellStyleHeadline){
    
    
    outputCellValue(oSheet, nRow, g_nAttrNameColumn, g_sHeadlineAttrName, oCellStyleHeadline);
    outputCellValue(oSheet, nRow, g_nRiskColumn, g_sHeadlineCurrentRisk, oCellStyleHeadline);
    outputCellValue(oSheet, nRow, g_nQuickColumn, g_sHeadlineUpdatedRisk, oCellStyleHeadline);
    outputCellValue(oSheet, nRow, g_nDeltaColumn, g_sHeadlineDelta, oCellStyleHeadline);
    
}


function outputCellValue(oSheet, nRow, nCol, sValue, oCellStyle){
    
    if(oSheet!=null){
        var oRow = null;
        var oCell = null;
        if(oSheet.getRowAt(nRow)!=null){
            oRow = oSheet.getRowAt(nRow);
        }else{
            oRow = oSheet.createRow(nRow);
        }
        if(oRow!=null){
            oCell = oRow.createCell(nCol);
        }

        if(oCell!=null){
            
            oCell.setCellStyle(oCellStyle);
            oCell.setCellValue(""+sValue);
        }
    }                
                
                
}


function getQuickObjDef(){
    
    if(ArisData.getSelectedObjDefs()!=null && ArisData.getSelectedObjDefs().length>0){
        if(ArisData.getSelectedObjDefs()[0]!=null && ArisData.getSelectedObjDefs()[0].IsValid()){
            return ArisData.getSelectedObjDefs()[0];
        }
    }
    return null;
}


function getMainDatabase(){
    
    var oMainDB = ArisData.openDatabase(g_sMainDatabaseName, g_sMainDatabaseUsername, g_sMainDatabasePassword, g_sMainDatabaseFilterGUID, g_nLoc, false);//Open with write access
    if(oMainDB!=null && oMainDB.IsValid())
    {
        return oMainDB;
    }

    return null;
}



function getRiskObjDef(oMainDatabase, oQuickObjDef){
    
    if(oQuickObjDef!=null && oQuickObjDef.IsValid()){
        if(oQuickObjDef.Attribute(g_nReferenceToQuickObjAttrTypeNum, g_nLoc)!=null){
            var sRiskObjGUID = "" + oQuickObjDef.Attribute(g_nReferenceToQuickObjAttrTypeNum, g_nLoc).getValue();
            
            if(sRiskObjGUID!=null && !("".equals(sRiskObjGUID)) && sRiskObjGUID.length==36){
                if(oMainDatabase!=null){
                    var oRiskObjDef = oMainDatabase.FindGUID(""+sRiskObjGUID);    
                    
                    if(oRiskObjDef!=null && oRiskObjDef.IsValid()){
                        return oRiskObjDef;
                    }
                }
            }
        }
    }
    return null;
}






function readAttribute(oObjDef, oRiskAttribute){
    
    var sValue = "";
    
    if(oObjDef!=null && oRiskAttribute!=null){
    
        //var sContextProperty = Context.getProperty(""+oRiskAttribute.sContextProperty);
                    
        
        switch(oRiskAttribute.sAttributeReadType){
            case "STRING":
                sValue = oObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).getValue();
                break;
            case "DATE":
                //var oDate = getDateFromString(""+sContextProperty);
                
                var oDate = oObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).MeasureValue();
                if(oDate!=null){
                    //sValue = oDateFormat.format(oDate);
                    sValue = oDate;
                }
                break;
            case "BOOL":
                if(oObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).IsMaintained()){
                    sValue = oObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).getValue();
                }else{
                    sValue = "";
                }
                break;/*
            case "YES_NO":
                var bValue = (""+sContextProperty).equals("Yes") ? true : false;
                oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(bValue);                        
                break;
            case "STATIC_BOOL_TRUE":
                oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(true);
                break;
            case "TRY_NUMBER_OR_STRING":
                if(sContextProperty==null){
                    sContextProperty="";
                }
                if(!isNaN(""+sContextProperty)){
                    //sContextProperty = java.lang.Integer.parseInt(""+sContextProperty);
                    sContextProperty = Math.round(""+sContextProperty);
                }
                oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(""+sContextProperty);
                break;*/
            default:
                sValue = oObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).getValue();
        }
    }else{

    }        
    
    return sValue;            
}


function writeAttribute(oObjDef, oRiskAttribute, vValue){
    
    var bSuccessful = false;
    
    if(oObjDef!=null && oRiskAttribute!=null){
    
        //var sContextProperty = Context.getProperty(""+oRiskAttribute.sContextProperty);
                    
        
        switch(oRiskAttribute.sAttributeReadType){
            case "STRING":
                bSuccessful = oObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(""+vValue);
                break;
            case "APPEND_STRING":
                var sCurrentValueInRiskObjDef = "";
                if(oObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc)!=null){
                    sCurrentValueInRiskObjDef = oObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).getValue();
                }
                bSuccessful = oObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(""+sCurrentValueInRiskObjDef+"\n"+vValue);
                break;
            case "DATE":
                //var oDate = getDateFromString(""+sContextProperty);
                
                bSuccessful = oObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(vValue);
                break;
            case "BOOL":
                var bVal = false;
                if(("").equals(vValue)){
                    oObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).Delete();
                }else{
                    bVal = (""+vValue).equals("True") ? true : false;
                    oObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(bVal);
                }
                                        
                break;/*
            case "YES_NO":
                var bValue = (""+sContextProperty).equals("Yes") ? true : false;
                oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(bValue);                        
                break;
            case "STATIC_BOOL_TRUE":
                oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(true);
                break;
            case "TRY_NUMBER_OR_STRING":
                if(sContextProperty==null){
                    sContextProperty="";
                }
                if(!isNaN(""+sContextProperty)){
                    //sContextProperty = java.lang.Integer.parseInt(""+sContextProperty);
                    sContextProperty = Math.round(""+sContextProperty);
                }
                oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(""+sContextProperty);
                break;*/
            default:
                bSuccessful = oObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(""+vValue);
        }
    }else{

    }        
    
    return bSuccessful;            
}


function getSelectedDialogValueDepartment(){
    //return "ELT";//DEBUG
    //return "Finance";//DEBUG
    //return ""+Context.getProperty("NTT_RM_INPUT_SELECTED_DEPARTMENT");
    return ""+Context.getProperty(g_sPropertyNameSelectedDepartment);
    
    
}


function getSelectedDialogValueSubRiskName(){
//    return "PR05.06: Terrorism";//DEBUG
    //return "PR08.03: Third Party Risk";//DEBUG
    //return ""+Context.getProperty("NTT_RM_INPUT_SELECTED_SUB_RISK_NAME");
    return ""+Context.getProperty(g_sPropertyNameSelectedSubRisk);
    
    
}


function getSelectedDialogValuePrincipleRiskName(){
    return ""+Context.getProperty(g_sPropertyNameSelectedPrincipleRisk);
}



function getSubRiskObjDef(sSubRiskName, oMainDatabase){
    
    var oSubRiskObjDef = null;
    
    if(sSubRiskName!=null && !("".equals(sSubRiskName))){
        // Find sub-risk objdef in DB
        
        var aoSubRiskObjDefs = oMainDatabase.Find(Constants.SEARCH_OBJDEF, Constants.OT_RISK_CATEGORY, Constants.AT_NAME, g_nLoc, ""+sSubRiskName, Constants.SEARCH_CMP_EQUAL);
        if(aoSubRiskObjDefs!=null){
            if(aoSubRiskObjDefs.length>0){
                oSubRiskObjDef = aoSubRiskObjDefs[0];
            }
        }
    }
        
    return oSubRiskObjDef;    
}


function getAssignedSubRiskDiagram(oSubRiskObjDef){
    var oAssignedSubRiskDiagram = null;
    
    if(oSubRiskObjDef!=null){
        // Try to find the Sub Risk Model
        
        var aoAssignedSubRiskDiagrams = oSubRiskObjDef.AssignedModels([Constants.MT_RISK_DGM]);
        if(aoAssignedSubRiskDiagrams!=null){
            if(aoAssignedSubRiskDiagrams.length>0){
                oAssignedSubRiskDiagram = aoAssignedSubRiskDiagrams[0];
            }
        }
    }
    return oAssignedSubRiskDiagram;
}


function getSubRiskObjOcc(oAssignedSubRiskDiagram){
    var oSubRiskObjOcc = null;
    
    var aoSubRiskObjOccs = oAssignedSubRiskDiagram.ObjOccListBySymbol([Constants.ST_RISK_CATEGORY]);
    if(aoSubRiskObjOccs!=null && aoSubRiskObjOccs.length>0){
        oSubRiskObjOcc = aoSubRiskObjOccs[0];
    }
    return oSubRiskObjOcc;
}





function readAttributeAsString(oObjDef, sAttrTypeNum){
    var sValue = "";
    
    if(oObjDef!=null && oObjDef.IsValid()){
        
        if(oObjDef.Attribute(sAttrTypeNum, g_nLoc)!=null){
            sValue = "" + oObjDef.Attribute(sAttrTypeNum, g_nLoc).getValue();
        }
    }
    return sValue;
}


function getAffectedSiteObjDef(sAffectedSiteName, oMainDatabase){
    var oAffectedSiteObjDef = null;
    
    if(sAffectedSiteName!=null && !("".equals(sAffectedSiteName))){
        var aoObjDefs = oMainDatabase.Find(Constants.SEARCH_OBJDEF, [Constants.OT_ORG_UNIT], Constants.AT_NAME, g_nLoc, ""+sAffectedSiteName, Constants.SEARCH_CMP_EQUAL);
        if(aoObjDefs!=null && aoObjDefs.length>0){
            // There should only be one site
            oAffectedSiteObjDef = aoObjDefs[0];
        }
    }
    return oAffectedSiteObjDef;
}



function getAssignedGovernanceDiagram(oRiskObjDef){
    
    if(oRiskObjDef!=null && oRiskObjDef.IsValid()){
        var aoAssignedGovernanceDiagrams = oRiskObjDef.AssignedModels([Constants.MT_BUSY_CONTR_DGM]);
        if(aoAssignedGovernanceDiagrams!=null && aoAssignedGovernanceDiagrams.length>0){
            for each(var oAssignedGovernanceDiagram in aoAssignedGovernanceDiagrams){
                if(oAssignedGovernanceDiagram!=null && oAssignedGovernanceDiagram.IsValid()){
                    return oAssignedGovernanceDiagram;
                }
            }
        }
    }
    
    return null;
}


function createAssignedGovernanceDiagram(oRiskObjDef){
    
    if(oRiskObjDef!=null && oRiskObjDef.IsValid()){
        
        var oRiskGroup = oRiskObjDef.Group();
        if(oRiskGroup!=null){

            var oAssignedGovernanceDiagram = oRiskGroup.CreateModel(Constants.MT_BUSY_CONTR_DGM, ""+oRiskObjDef.Name(g_nLoc), g_nLoc);
            if(oAssignedGovernanceDiagram==null){
                return false;
            }
            
            return oRiskObjDef.CreateAssignment(oAssignedGovernanceDiagram, false);
            
        }
    }
    return false;
}



function getRiskObjOccInGovernanceDiagram(oRiskObjDef, oAssignedGovernanceDiagram){
    
    if(oRiskObjDef!=null && oRiskObjDef.IsValid()){
        if(oAssignedGovernanceDiagram!=null){
            var aoRiskObjOccs = oRiskObjDef.OccList([oAssignedGovernanceDiagram]);
            
            if(aoRiskObjOccs!=null && aoRiskObjOccs.length>0){
                for each(var oRiskObjOcc in aoRiskObjOccs){
                    if(oRiskObjOcc!=null && oRiskObjOcc.IsValid()){
                        return oRiskObjOcc;
                    }
                }
            }
            
        }
        
    }
    return null;
    
}

function assignedAffectedSiteInGovernanceDiagram(oRiskObjDef, sAffectedSiteName){
    
    var oAffectedSiteObjDef = null;
    var oRiskObjOcc = null;
    
    if(oRiskObjDef!=null && oRiskObjDef.IsValid()){
        oAffectedSiteObjDef = getAffectedSiteObjDef(sAffectedSiteName, oRiskObjDef.Database());
        var oAssignedGovernanceDiagram = getAssignedGovernanceDiagram(oRiskObjDef);
            
        if(oAssignedGovernanceDiagram!=null && oAssignedGovernanceDiagram.IsValid()){
            
            oRiskObjOcc = getRiskObjOccInGovernanceDiagram(oRiskObjDef, oAssignedGovernanceDiagram);
            // If there is no risk occ yet, i.e. because the diagram was just created, then create an obj occ
            if(oRiskObjOcc==null){
                var nPosX = 100;
                var nPosY = 100;
                oRiskObjOcc = oAssignedGovernanceDiagram.createObjOcc(Constants.ST_RISK_1, oRiskObjDef, nPosX, nPosY, true); 
            }
            
            // AFFECTED SITE
            if(oRiskObjOcc!=null){
                // Create objOcc in governance diagram
                var nPosX = 1000;
                var nPosY = 100;
                
                if(oAffectedSiteObjDef!=null && oAffectedSiteObjDef.IsValid()){
                    var oAffectedSiteObjOcc = oAssignedGovernanceDiagram.createObjOcc(Constants.ST_ORG_UNIT_2, oAffectedSiteObjDef, nPosX, nPosY, true); 
                    
                    if(oAffectedSiteObjOcc!=null && oAffectedSiteObjOcc.IsValid()){
                        
                        var oCxnPoints = [];
                        oCxnPoints.push(new java.awt.Point(oAffectedSiteObjOcc.X(), oAffectedSiteObjOcc.Y() + (oAffectedSiteObjOcc.Height()/2) ));
                        oCxnPoints.push(new java.awt.Point(oRiskObjOcc.X()+oRiskObjOcc.Width(), oRiskObjOcc.Y() + (oRiskObjOcc.Height()/2) ));
                        var bCxnCreated = oAssignedGovernanceDiagram.CreateCxnOcc(oRiskObjOcc, oAffectedSiteObjOcc, Constants.CT_IS_UNDER_RESP_OF, oCxnPoints);
                        
                        if(bCxnCreated){
                            
                            
                            
                            var bTemplateApplied = oAssignedGovernanceDiagram.setTemplate("90035e81-4129-11d4-857d-00005a4053ff", true);
                            var bTemplateApplied = oAssignedGovernanceDiagram.setTemplate("4b99e420-1b24-11e9-7336-00155de0641b", true);
                            if(bTemplateApplied){
                                
                            }else{
                                //g_oResult.bSuccessful=false;
                                //g_oResult.asMsg.push("Could NOT apply template to Governance diagram!");
                                g_result.bSuccess=false;
                                addLoggerLine(g_result, 'FATAL', "Could NOT apply template to Governance diagram!");
                            }
                            
                            
                        }else{
                            //g_oResult.bSuccessful=false;
                            //g_oResult.asMsg.push("Could not create connection from risk to affected site objOcc.");
                            g_result.bSuccess=false;
                            addLoggerLine(g_result, 'FATAL', "Could not create connection from risk to affected site objOcc.");
                        }
                    }else{
                        //g_oResult.bSuccessful=false;
                        //g_oResult.asMsg.push("Could not create affected site objOcc in Governance diagram!");
                        g_result.bSuccess=false;
                        addLoggerLine(g_result, 'FATAL', "Could not create affected site objOcc in Governance diagram!");
                        return null;
                    }
                }else{
                    //g_oResult.bSuccessful=false;
                    //g_oResult.asMsg.push("Affected site ObjDef is null! Could NOT create occurrence in Governance Model");
                    g_result.bSuccess=false;
                    addLoggerLine(g_result, 'FATAL', "Affected site ObjDef is null! Could NOT create occurrence in Governance Model");
                }
            }
            
            
            
        }else{
            //g_oResult.bSuccessful=false;
            //g_oResult.asMsg.push("Could not find Governance diagram to risk objdef");
            g_result.bSuccess=false;
            addLoggerLine(g_result, 'FATAL', "Could not find Governance diagram to risk objdef");
        }
    }else{
        //g_oResult.bSuccessful=false;
        //g_oResult.asMsg.push("Risk obj def is null!");
        g_result.bSuccess=false;
        addLoggerLine(g_result, 'FATAL', "Risk obj def is null!");
    }
        
        
    
}




function removeAffectedSiteFromGovernanceDiagram(oRiskObjDef, sCurrentAffectedSiteName){
    
    
    
    var oAffectedSiteObjDef = null;
    var oAssignedGovernanceDiagram = null;
    
    if(oRiskObjDef!=null && oRiskObjDef.IsValid()){
        
        oAffectedSiteObjDef = getAffectedSiteObjDef(sCurrentAffectedSiteName, oRiskObjDef.Database());
        if(oAffectedSiteObjDef!=null && oAffectedSiteObjDef.IsValid()){
            
            oAssignedGovernanceDiagram = getAssignedGovernanceDiagram(oRiskObjDef);
            if(oAssignedGovernanceDiagram!=null && oAssignedGovernanceDiagram.IsValid()){
                var aoRiskObjOccs = oRiskObjDef.OccList([oAssignedGovernanceDiagram]);
                if(aoRiskObjOccs!=null && aoRiskObjOccs.length>0){
                    for each(var oRiskObjOcc in aoRiskObjOccs){//There should only be ONE risk obj occ, but anyway
                        if(oRiskObjOcc!=null && oRiskObjOcc.IsValid()){
                            
                            // Get all outgoing cxns
                            var aoCxnOccs = oRiskObjOcc.Cxns(Constants.EDGES_OUT);
                            if(aoCxnOccs!=null && aoCxnOccs.length>0){
                                for each(var oCxnOcc in aoCxnOccs){
                                    if(oCxnOcc!=null && oCxnOcc.getDefinition()!=null){
                                        
                                        if(oCxnOcc.getDefinition().TypeNum()==Constants.CT_IS_UNDER_RESP_OF &&
                                            oCxnOcc.TargetObjOcc().SymbolNum()==Constants.ST_ORG_UNIT_2 &&
                                            oCxnOcc.TargetObjOcc().ObjDef().TypeNum()==Constants.OT_ORG_UNIT){
                                                
                                            // Verify that the GUIDs match
                                            if( (""+oCxnOcc.TargetObjOcc().ObjDef().GUID()).equals( ""+oAffectedSiteObjDef.GUID() ) ){
                                                var oAffectedSiteObjOcc = oCxnOcc.TargetObjOcc();   //Store it, so that we can remove it after removing the cxn
                                                
                                                oCxnOcc.Remove(true);   // Remove cxn-occ WITH def
                                                
                                                oAffectedSiteObjOcc.Remove(false);  // Remove occ, but keep the def
                                            }
                                            
                                        }
                                    }
                                }
                            }
                            
                        }
                    }
                }
            }
        }
    }
    
}




function removeCurrentSubRiskConnection(oRiskObjDef, sSubRiskName, oMainDatabase){
    
    if(oMainDatabase!=null){
        if(!("").equals(""+sSubRiskName)){
            // Find the SUB RISK MODEL
            var aoSubRiskModels = oMainDatabase.Find(Constants.SEARCH_MODEL, Constants.MT_RISK_DGM, Constants.AT_NAME, g_nLoc, ""+sSubRiskName, Constants.SEARCH_CMP_EQUAL);
            if(aoSubRiskModels!=null && aoSubRiskModels.length>0){
                for each(var oSubRiskModel in aoSubRiskModels){
                    
                    // Find the RISK OBJ OCCS in the sub risk model
                    var aoRiskObjOccs = oRiskObjDef.OccListInModel(oSubRiskModel);
                    if(aoRiskObjOccs!=null && aoRiskObjOccs.length>0){
                        for each(var oRiskObjOcc in aoRiskObjOccs){
                            
                            // Get the cxn
                            var aoCxnOccs = oRiskObjOcc.Cxns();
                            if(aoCxnOccs!=null && aoCxnOccs.length>0){  // There should be only ONE CxnOcc anyway
                                for each(var oCxnOcc in aoCxnOccs){
                                    if(oCxnOcc!=null && oCxnOcc.CxnDef()!=null){
                                        if(oCxnOcc.CxnDef().TypeNum()==Constants.CT_SUBS_1){
                                            oCxnOcc.Remove(true); // Remove the CxnOcc with CxnDef
                                        }
                                    }
                                }
                            }
                            
                            // Now remove the Occ
                            oRiskObjOcc.Remove(false); // Only remove the ObjOcc, but keep the ObjDef
                            
                        }
                    }
                    
                    applyLayoutToSubRiskDiagram(oSubRiskModel);
                }
            }
        }
        
    }
    
}





function connectRiskToSubRisk(oRiskObjDef, sSubRiskName, oMainDatabase){
    
    if(oMainDatabase!=null && !("".equals(sSubRiskName)) && oRiskObjDef!=null){
        var oSubRiskObjDef = getSubRiskObjDef(sSubRiskName, oMainDatabase)
        var oAssignedSubRiskDiagram = getAssignedSubRiskDiagram(oSubRiskObjDef)
        
        if(oAssignedSubRiskDiagram!=null){
            var oSubRiskObjOcc = getSubRiskObjOcc(oAssignedSubRiskDiagram);
        
            if(oSubRiskObjOcc!=null){
                // Create objOcc in sub-risk diagram
                var nPosX = 200;
                var nPosY = 200;
                
                var oRiskObjOcc = oAssignedSubRiskDiagram.createObjOcc(Constants.ST_RISK_1, oRiskObjDef, nPosX, nPosY, true); 
                
                if(oRiskObjOcc!=null && oRiskObjOcc.IsValid()){
                    var oCxnPoints = [];
                    oCxnPoints.push(new java.awt.Point(oRiskObjOcc.X(), oRiskObjOcc.Y() + (oRiskObjOcc.Height()/2) ));
                    oCxnPoints.push(new java.awt.Point(oSubRiskObjOcc.X()+oSubRiskObjOcc.Width(), oSubRiskObjOcc.Y() + (oSubRiskObjOcc.Height()/2) ));
                    var bCxnCreated = oAssignedSubRiskDiagram.CreateCxnOcc(oSubRiskObjOcc, oRiskObjOcc, Constants.CT_SUBS_1, oCxnPoints);
                    
                }
            }
        
            var bTemplateApplied = oAssignedSubRiskDiagram.setTemplate("90035e81-4129-11d4-857d-00005a4053ff", true);
            var bTemplateApplied = oAssignedSubRiskDiagram.setTemplate("4b99e420-1b24-11e9-7336-00155de0641b", true);
                                    
            // Auto-layout
            //oAssignedSubRiskDiagram.doLayout();
            applyLayoutToSubRiskDiagram(oAssignedSubRiskDiagram);
            
            return true;
        }
    }
        
    return false;
}






function applyLayoutToSubRiskDiagram(oSubRiskDiagram){
    
    var nSubRiskPosX = 100;
    var nSubRiskPosY = 100;
    
    
    var nRiskPosX = 600;
    var nRiskPosY = 300;
    var nRiskPosYStep = 200;
    var nCounter = 0;
    
    // 1) Find Sub-Risk ObjOcc (there should only be one)
    var oRiskCategoryObjOcc = null;
    var aoSubRiskObjOccs = oSubRiskDiagram.ObjOccListBySymbol([Constants.ST_RISK_CATEGORY]);
    if(aoSubRiskObjOccs!=null && aoSubRiskObjOccs.length>0){
        for each(var oObjOcc in aoSubRiskObjOccs){
            if(oObjOcc!=null && oObjOcc.IsValid()){
                oRiskCategoryObjOcc = oObjOcc;
            }
        }
    }
    
    if(oRiskCategoryObjOcc!=null && oRiskCategoryObjOcc.IsValid()){
        
        // 2) Position the Sub-Risk ObjOcc
        oRiskCategoryObjOcc.SetPosition(nSubRiskPosX, nSubRiskPosY);
        
        
        // 3) Find all risk objoccs
        var aoRiskObjOccs = oSubRiskDiagram.ObjOccListBySymbol([Constants.ST_RISK_1]);
        aoRiskObjOccs = ArisData.sort(aoRiskObjOccs, Constants.AT_NAME, g_nLoc);
        
        for each(var oRiskObjOcc in aoRiskObjOccs){
            if(oRiskObjOcc!=null){
                oRiskObjOcc.SetPosition(nRiskPosX, nRiskPosY+(nCounter*nRiskPosYStep));
                nCounter++;
            }
        }

        
        // 4) Set cxn points
        var aoCxnObjOccs = oRiskCategoryObjOcc.Cxns(Constants.EDGES_OUT);
        for each(var oCxnObjOcc in aoCxnObjOccs){
            if(oCxnObjOcc!=null){
                var oRiskObjOcc = oCxnObjOcc.TargetObjOcc();
                
                var oCxnPoints = [];
                oCxnPoints.push(new java.awt.Point(oRiskCategoryObjOcc.X()+(oRiskCategoryObjOcc.Width()/2), oRiskCategoryObjOcc.Y() + (oRiskCategoryObjOcc.Height()) ));
                oCxnPoints.push(new java.awt.Point(oRiskCategoryObjOcc.X()+(oRiskCategoryObjOcc.Width()/2), oRiskObjOcc.Y() + (oRiskObjOcc.Height()/2) ));
                oCxnPoints.push(new java.awt.Point(oRiskObjOcc.X(), oRiskObjOcc.Y() + (oRiskObjOcc.Height()/2) ));
                oCxnObjOcc.SetPointList(oCxnPoints);
            }
        }
    }else{
        g_result.bSuccess=false;
        addLoggerLine(g_result, 'FATAL', "[applyLayoutToSubRiskDiagram] Could not find sub risk obj occ (ST_RISK_CATEGORY)");
    }
}











/********************************************************
 *  Adds a line to the logger result object with the 
 *  current date/time as timestamp
 ********************************************************/
function addLoggerLine(jsonResult, sType, sMsg){
    
    if(jsonResult!=null && jsonResult.aoMsg!=null){
        jsonResult.aoMsg.push({sType: sType, sTimestamp: g_oLoggerDateFormat.format(new Date()), sMsg: sMsg});
    }
}



/********************************************************
 *  Generates the output TXT file based on the result object
 ********************************************************/
function generateOutputFile(jsonResult){

    if(jsonResult!=null){
        if(Context.getSelectedFormat()==Constants.OutputTXT){
            var oOutFile = Context.createOutputObject();
            if(oOutFile!=null){
                if(jsonResult.bSuccess){
                    oOutFile.OutputTxt("--- The report finished SUCCESSFULLY ---\n");
                }else{
                    oOutFile.OutputTxt("--- The report finished WITH ERRORS ---\n");
                }
                oOutFile.OutputTxt("---------------------------------------\n\n");
                if(jsonResult.aoMsg!=null && jsonResult.aoMsg.length>0){
                    for(var i=0; i<jsonResult.aoMsg.length; i++){
                        oOutFile.OutputTxt("" + jsonResult.aoMsg[i].sTimestamp + " [" + jsonResult.aoMsg[i].sType + "] " + jsonResult.aoMsg[i].sMsg + "\n");
                    }
                }
                
                oOutFile.OutputTxt("\n");
                oOutFile.OutputTxt("---------------------------------------\n");
                oOutFile.OutputTxt("---------------- EOF ------------------\n");
                oOutFile.OutputTxt("---------------------------------------\n");
                
                oOutFile.WriteReport();
            }
        }else{
            //Dialogs.MsgBox("Output format must be TXT");
        }
    }else{
        //Dialogs.MsgBox("Error: No result object was created. Please consult your ARIS Administrator.", Constants.MSGBOX_ICON_ERROR, "No result object");
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}


/********************************************************
 *  Generates the output TXT file based on the result object
 ********************************************************/
function generateOutputFileCSV(jsonResult, sSeparator){
    
    if(jsonResult!=null){
        if(Context.getSelectedFormat()==Constants.OutputTXT){
            //var oOutFile = Context.createOutputObject();
            var oOutFile = Context.createOutputObject(Constants.OutputTXT, "import-risks-log.csv");
            if(oOutFile!=null){
                
                // Header
                oOutFile.OutputTxt("timestamp" + sSeparator + "type" + sSeparator + "description" + "\n");
                
                if(jsonResult.bSuccess){
                    oOutFile.OutputTxt("0" + sSeparator + "INFO" + sSeparator + "--- The report finished SUCCESSFULLY ---\n");
                }else{
                    oOutFile.OutputTxt("0" + sSeparator + "INFO" + sSeparator + "--- The report finished WITH ERRORS ---\n");
                }
                oOutFile.OutputTxt("0" + sSeparator + "INFO" + sSeparator + "---------------------------------------\n");
                if(jsonResult.aoMsg!=null && jsonResult.aoMsg.length>0){
                    for(var i=0; i<jsonResult.aoMsg.length; i++){
                        oOutFile.OutputTxt("" + jsonResult.aoMsg[i].sTimestamp + sSeparator + jsonResult.aoMsg[i].sType + sSeparator + new java.lang.String(""+jsonResult.aoMsg[i].sMsg).replaceAll(",", "") + "\n");
                    }
                }
                
                oOutFile.OutputTxt("0" + sSeparator + "INFO" + sSeparator + "---------------------------------------\n");
                oOutFile.OutputTxt("0" + sSeparator + "INFO" + sSeparator + "---------------- EOF ------------------\n");
                oOutFile.OutputTxt("0" + sSeparator + "INFO" + sSeparator + "---------------------------------------\n");
                
                oOutFile.WriteReport();
            }
        }else{
            //Dialogs.MsgBox("Output format must be TXT");
        }
    }else{
        //Dialogs.MsgBox("Error: No result object was created. Please consult your ARIS Administrator.", Constants.MSGBOX_ICON_ERROR, "No result object");
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}








