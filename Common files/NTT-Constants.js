// **** CONFIGURATION     *** ///
const g_strUpdateDocumentVersionAPG = "dac63741-6763-11ed-30e7-001dd8d80275"; //01 Submit document for approval
const g_strArchivingProcessAPG = "4be7ae91-ec7b-11ec-51c7-d05099dfe77e"; // 02 Document annual revision
const g_strArchiveDocumentProcessAPG = "30914d11-a91c-11ec-51c7-d05099dfe77e"; //03 Archive docuemnt
const g_strScheduledAnnualRevisionAPG = "9bb05601-bf4b-11ec-51c7-d05099dfe77e"; //04 Schedule annual revision
const g_strSystemPassword = "manager";

//Here a new secret area is defined. New values are separated by commas, new values must be **identical** to the attribute value
var listPossibleSecretOwners = ["01-Executive Office", "02-Legal", "08-Human Resources", "19-Security Management"];
// **** CONFIGURATION END *** ///


var g_oDatabase = ArisData.getActiveDatabase();
var g_oFilter = g_oDatabase.ActiveFilter();


//var AT_NTT_DOC_DESCRIPTION = g_oFilter.UserDefinedAttributeTypeNum("006d3621-18fa-11eb-08b8-06718b59490c");
var AT_NTT_DOC_OWNER = g_oFilter.UserDefinedAttributeTypeNum("976e5401-8028-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_SCOPE = g_oFilter.UserDefinedAttributeTypeNum("0dcc5411-8026-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_TYPE = g_oFilter.UserDefinedAttributeTypeNum("08ff5880-791c-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_CONFIDENTIALITY = g_oFilter.UserDefinedAttributeTypeNum("5f256991-8027-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_LANGUAGE = g_oFilter.UserDefinedAttributeTypeNum("b984fea1-802c-11ec-51c7-d05099dfe77e");

var AT_NTT_DOC_GUID = g_oFilter.UserDefinedAttributeTypeNum("58ea72c1-8368-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_CONTENT_APPROVERS = g_oFilter.UserDefinedAttributeTypeNum("919ae381-8367-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_FINAL_APPROVER = g_oFilter.UserDefinedAttributeTypeNum("a564ce81-8367-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_METADATA_CHANGED = g_oFilter.UserDefinedAttributeTypeNum("6ade2911-8366-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_USED_INPROCESSES_INITIATOR = g_oFilter.UserDefinedAttributeTypeNum("4aa06051-8366-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_NEW_CONFIDENTIALITY = g_oFilter.UserDefinedAttributeTypeNum("527767f1-8367-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_NEW_DESCRIPTION = g_oFilter.UserDefinedAttributeTypeNum("f7b12f91-8366-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_NEW_LANGUAGE = g_oFilter.UserDefinedAttributeTypeNum("640aeaf1-8367-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_NEW_OWNER = g_oFilter.UserDefinedAttributeTypeNum("158e4c00-8367-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_NEW_SCOPE = g_oFilter.UserDefinedAttributeTypeNum("27b02c51-8367-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_NEW_TITLE = g_oFilter.UserDefinedAttributeTypeNum("e7d19e20-8366-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_NEW_TYPE = g_oFilter.UserDefinedAttributeTypeNum("444fe6c1-8367-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_NEW_VERSION_DESCRIPTION = g_oFilter.UserDefinedAttributeTypeNum("1b0ad3c1-8366-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_NAME = g_oFilter.UserDefinedAttributeTypeNum("f0123f30-85e7-11ec-51c7-d05099dfe77e");
var AT_NTT_UPDATE_TYPE = g_oFilter.UserDefinedAttributeTypeNum("8b5c25b1-86b4-11ec-51c7-d05099dfe77e");
var AT_NTT_DATABASE_NAME = g_oFilter.UserDefinedAttributeTypeNum("1e70a940-86c2-11ec-51c7-d05099dfe77e");
var AT_NTT_INITIATOR = g_oFilter.UserDefinedAttributeTypeNum("12e1a7d1-8773-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_CONTENT_APPROVERNAMES = g_oFilter.UserDefinedAttributeTypeNum("944c9a40-877e-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_STATUS = g_oFilter.UserDefinedAttributeTypeNum("182a3e21-87fd-11ec-51c7-d05099dfe77e");
var AT_NTT_DOC_VERSION_HISTORY_LOG = g_oFilter.UserDefinedAttributeTypeNum("199a41e1-8368-11ec-51c7-d05099dfe77e");
var AT_NTT_APPROVAL_DATE = g_oFilter.UserDefinedAttributeTypeNum("49ffb900-9097-11ec-51c7-d05099dfe77e");

var AT_NTT_REQUEST_TYPE = g_oFilter.UserDefinedAttributeTypeNum("e58cb510-988c-11ec-51c7-d05099dfe77e");
var AT_NTT_EXPIRY_DATE = g_oFilter.UserDefinedAttributeTypeNum("afca5d21-9bba-11ec-51c7-d05099dfe77e");
var AT_NTT_NEW_FILE_NAME = g_oFilter.UserDefinedAttributeTypeNum("8b935041-9bc6-11ec-51c7-d05099dfe77e");
var AT_NTT_NEW_FILE_EXTENSION = g_oFilter.UserDefinedAttributeTypeNum("ac473361-9bc6-11ec-51c7-d05099dfe77e");

var AT_NTT_DOC_ARCHIVING_COMMENT = g_oFilter.UserDefinedAttributeTypeNum("283783d1-c228-11ec-51c7-d05099dfe77e");


/************************************************
 *** NTT RISK MANAGEMENT
 ************************************************/
 
 
 
 const g_sMainDatabaseName = "NTT";
const g_sMainDatabaseUsername = "arisservice";
const g_sMainDatabasePassword = "arisservice";  // DEV
//const g_sMainDatabasePassword = "cleared";  // NTT TEST/PROD
const g_sMainDatabaseFilterGUID = "dd838074-ac29-11d4-85b8-00005a4053ff";   // Entire Method


//var AT_NTT_RM_RISK_ID = Constants.AT_AAM_RISK_ID;
var AT_NTT_RM_RISK_ID = g_oFilter.UserDefinedAttributeTypeNum("1c10b2a0-65d1-11ed-4bb3-00155de02457");
var AT_NTT_RM_RISK_STATUS = g_oFilter.UserDefinedAttributeTypeNum("a76b3b91-1a19-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_RISK_IDENTIFIED_ON = g_oFilter.UserDefinedAttributeTypeNum("254e20e0-19f2-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_CLOSING_REMARKS = g_oFilter.UserDefinedAttributeTypeNum("35c75311-1a1a-11ec-51c7-d05099dfe77e");
//var AT_NTT_RM_LAST_REVIEW = g_oFilter.UserDefinedAttributeTypeNum("50c80381-1a1a-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_LAST_REVIEW = g_oFilter.UserDefinedAttributeTypeNum("432feaf0-6cce-11ed-4bb3-00155de02457");
var AT_NTT_RM_EXEC_MGMT_OWNERSHIP = g_oFilter.UserDefinedAttributeTypeNum("1928dfb1-19ef-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_DEPARTMENT = g_oFilter.UserDefinedAttributeTypeNum("a11bfa10-1fcf-11ed-4bb3-00155de02457");
var AT_NTT_RM_PRINCIPAL_RISK_IMPACTED = g_oFilter.UserDefinedAttributeTypeNum("2890e971-19ea-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_SUB_RISK_CATEGORY = g_oFilter.UserDefinedAttributeTypeNum("bcd1c391-19ed-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_RISK_CATEGORY = g_oFilter.UserDefinedAttributeTypeNum("68dc4261-1a1a-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_RISK_NAME = g_oFilter.UserDefinedAttributeTypeNum("68b1aa20-6689-11ed-4bb3-00155de02457");
var AT_NTT_RM_RISK_DESCRIPTION = Constants.AT_DESC;
var AT_NTT_RM_RISK_CONSEQUENCES = g_oFilter.UserDefinedAttributeTypeNum("b1312cd1-1a18-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_RISK_IDENTIFIED_BY = g_oFilter.UserDefinedAttributeTypeNum("6855ddc1-d058-11ec-7ed1-00155de02457");
var AT_NTT_RM_OPERATIONAL_OWNERSHIP = g_oFilter.UserDefinedAttributeTypeNum("3b643b40-19f1-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_GDC_EMEA_AFFECTED_COUNTRY = g_oFilter.UserDefinedAttributeTypeNum("ea7fa270-d05a-11ec-7ed1-00155de02457");
var AT_NTT_RM_GDC_EMEA_AFFECTED_SITE = g_oFilter.UserDefinedAttributeTypeNum("4014d2f0-1f98-11ed-4bb3-00155de02457");
var AT_NTT_RM_AFFECTED_BUILDING = g_oFilter.UserDefinedAttributeTypeNum("45256fa0-d05d-11ec-7ed1-00155de02457");
var AT_NTT_RM_RISK_REACH = g_oFilter.UserDefinedAttributeTypeNum("0b1dd640-19e6-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_RISK_IMPACT = g_oFilter.UserDefinedAttributeTypeNum("b63bdcc1-1a13-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_RISK_PROBABILITY = g_oFilter.UserDefinedAttributeTypeNum("dc8d47b1-1a13-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_STRENGTH_OF_CONTROLS = g_oFilter.UserDefinedAttributeTypeNum("88fcd870-1a15-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_RISK_TREATMENT_STRATEGY = g_oFilter.UserDefinedAttributeTypeNum("177ceb51-1a19-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_CAN_THIS_BE_FIXED = g_oFilter.UserDefinedAttributeTypeNum("ad02fc40-d05e-11ec-7ed1-00155de02457");
var AT_NTT_RM_MITIGATION_NAME = g_oFilter.UserDefinedAttributeTypeNum("50f70800-d05f-11ec-7ed1-00155de02457");
var AT_NTT_RM_MITIGATION_DESCRIPTION = g_oFilter.UserDefinedAttributeTypeNum("64283571-d05f-11ec-7ed1-00155de02457");
var AT_NTT_RM_MITIGATION_RESPONSIBLE = g_oFilter.UserDefinedAttributeTypeNum("7434f161-d05f-11ec-7ed1-00155de02457");
var AT_NTT_RM_MITIGATION_STATUS = g_oFilter.UserDefinedAttributeTypeNum("05980750-d060-11ec-7ed1-00155de02457");
var AT_NTT_RM_ESTIMATED_MITIGATION_COSTS = g_oFilter.UserDefinedAttributeTypeNum("b4be8ca0-d05f-11ec-7ed1-00155de02457");
var AT_NTT_RM_INVESTMENT_COMMITTEE_NUMBER = g_oFilter.UserDefinedAttributeTypeNum("e0881d10-d05f-11ec-7ed1-00155de02457");
var AT_NTT_RM_REMARKS = g_oFilter.UserDefinedAttributeTypeNum("19d04481-d060-11ec-7ed1-00155de02457");
var AT_NTT_RM_RISK_TREND = g_oFilter.UserDefinedAttributeTypeNum("58679551-19f8-11ec-51c7-d05099dfe77e");

var AT_NTT_RM_STRATEGIC_RISK = g_oFilter.UserDefinedAttributeTypeNum("4d525571-2104-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_FINANCIAL_RISK = g_oFilter.UserDefinedAttributeTypeNum("60434591-2104-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_OPERATIONAL_RISK = g_oFilter.UserDefinedAttributeTypeNum("38e52591-2104-11ec-51c7-d05099dfe77e");
var AT_NTT_RM_COMPLIANCE_RISK = g_oFilter.UserDefinedAttributeTypeNum("b28cee50-d059-11ec-7ed1-00155de02457");

var AT_NTT_RM_RISK_GUID = g_oFilter.UserDefinedAttributeTypeNum("d3e6cfa1-39bb-11ed-30e7-001dd8d80275");
var AT_NTT_RISK_NEW_VERSION_DESCRIPTION = g_oFilter.UserDefinedAttributeTypeNum("1839a7e1-39bc-11ed-30e7-001dd8d80275")
var AT_NTT_RISK_PERSONS_TO_BE_NOTIFIED = g_oFilter.UserDefinedAttributeTypeNum("5ec38461-39bc-11ed-30e7-001dd8d80275")
var AT_NTT_RM_RISK_ATT_LOG = g_oFilter.UserDefinedAttributeTypeNum("8d3c9dc0-3b17-11ed-30e7-001dd8d80275")

var AT_NTT_RM_PROCESS_HISTORY_LOG = g_oFilter.UserDefinedAttributeTypeNum("393fe951-8368-11ec-51c7-d05099dfe77e");

var AT_NTT_RM_RISK_WORKFLOW_STATUS = g_oFilter.UserDefinedAttributeTypeNum("47989500-6667-11ed-4bb3-00155de02457");
	

/************************************************
 ************************************************/
 
 
 
/* Get file extension of the current document in ADS */
function getCurrentADSDocExtension(oDocument){
    var adsReport = Context.getComponent("ADS");
    
    var oCurrentDocument = adsReport.getDocumentByHyperlink(oDocument.Attribute(Constants.AT_ADS_LINK_1, -1).getValue());
    var oCurrentDocumentMetadata = oCurrentDocument.getDocumentMetaInfo();
    
    return getFileNameAndExtension(oCurrentDocumentMetadata.getFileName())[1];
    
}
/* CREATE CONTCATENATED DOC NAME */
function createConcatenatedDocumentName(oDocument, mapDialogValues, strUpdateType)
{
    var strReturn = "";
    
    if(strUpdateType.equals("Major change"))
    {
        strReturn = mapDialogValues.get(AT_NTT_DOC_NEW_OWNER).substring(0,2) + "-" +
                mapDialogValues.get(AT_NTT_DOC_NEW_SCOPE) + "-" +
                mapDialogValues.get(AT_NTT_DOC_NEW_TITLE) + "-" +
                mapDialogValues.get(AT_NTT_DOC_NEW_TYPE).split("-")[1] + "-" +
                mapDialogValues.get(AT_NTT_DOC_NEW_LANGUAGE).substring(0,2);
    }
    else
    {
        strReturn = oDocument.Attribute(AT_NTT_DOC_OWNER, -1).getValue().substring(0,2) + "-" +
                oDocument.Attribute(AT_NTT_DOC_SCOPE, -1).getValue() + "-" +
                oDocument.Attribute(Constants.AT_NAME, -1).getValue().split("-")[3] + "-" +
                oDocument.Attribute(AT_NTT_DOC_TYPE, -1).getValue().split("-")[1] + "-" +
                oDocument.Attribute(AT_NTT_DOC_LANGUAGE, -1).getValue().substring(0,2);
    }
            
    var strADSDocName = strReturn;
            
    if(oDocument != null)
    {
      strReturn += "-V" + oDocument.Attribute(Constants.AT_MAJOR_VERSION , -1).getValue() + "." + oDocument.Attribute(Constants.AT_MINOR_VERSION , -1).getValue();
    }
    else
    {
        strReturn += "-V0.0"
    }
    
    var listDocNames = new Array();
    listDocNames.push(strReturn);
    listDocNames.push(strADSDocName);
    
    return listDocNames;
}


/* CHANGE ADS DOCUMENT NAME */
function updateADSDocumentName(adsRepository, oADSDocument, strNewName)
{
    var oCurrentMetaInfo = oADSDocument.getDocumentMetaInfo();
    
    var strCurrentFileName = oCurrentMetaInfo.getFileName();
    var strNewFileName = strNewName + "." + getFileNameAndExtension(strCurrentFileName)[1];

    var oNewMetaInfo = adsRepository.createDocumentMetaInfo(strNewName,
                       strNewFileName,
                       oCurrentMetaInfo.getDescription());
                      
    adsRepository.updateDocument(oADSDocument, oNewMetaInfo);
}

function getFileNameAndExtension(strFileName)
{
    var strFileNameList = new Array();
    var strExtension = "";
    
    var listFilenameParts = strFileName.split("\\.");
    
    var i=0;
    for each(var oPart in listFilenameParts)
    {
        if(i!= listFilenameParts.length -1)
            strFileNameList.push(oPart);
        else
            strExtension = oPart;
        i++
    }
    
    var retList = new Array();
    retList.push(strFileNameList.join("."));
    retList.push(strExtension);
    
    return retList;
}
