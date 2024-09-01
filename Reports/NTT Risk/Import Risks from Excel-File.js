/*
 *
 *  Report Name: Import Risks from Excel-File
 *  Version: 1.2
 *  Date: 2022-11-27
 *  Author: BPExperts GmbH [MaHi]
 *
 *
 *  Description:
 *  --- v1.2 ---
 *  # Improved layout functionality for sub-risk models
 *  # Write risk category to one of 4 bool attributes
 *
 *
 *  --- v1.1 ---
 *  # Create and assign Governance diagram, and connect affected site
 *  # Change to CSV output file
 *
 *
 *  --- v1.0 ---
 *  # Select Excel file for import
 *  # Import risks (create object, models, and write attributes)
 *
 *
*/


var g_oDatabase = ArisData.getActiveDatabase();
var g_oFilter = g_oDatabase.ActiveFilter();
var g_nLoc = Context.getSelectedLanguage();


/////////////////////////////////////////////////////////////////
/// BELOW THIS LINE, ONLY CHANGE CAREFULLY //////////////////////
/////////////////////////////////////////////////////////////////


const g_sSeparator = ","; // separator for the CSV output file

var g_nColRiskName = 10;//Column "Risk Name"
var g_nColRiskFolder = 6;//Column "Department" (=> this is the folder under "3.Risks")

var g_nColSubRisk = 8;//Column "Sub Risk"

var g_sRiskMainFolder = "/Main group/Risk Management";

///////////

const gc_hmRiskCategoryAttributeMapping = new java.util.HashMap();
gc_hmRiskCategoryAttributeMapping.put("Financial",AT_NTT_RM_FINANCIAL_RISK);
gc_hmRiskCategoryAttributeMapping.put("Operational",AT_NTT_RM_OPERATIONAL_RISK);
gc_hmRiskCategoryAttributeMapping.put("Strategic",AT_NTT_RM_STRATEGIC_RISK);
gc_hmRiskCategoryAttributeMapping.put("Compliance",AT_NTT_RM_COMPLIANCE_RISK);


//SETTINGS CONNECTIONS
var g_nRole2GroupCxnType = Constants.CT_GENERAL_2;    //Connection between Role-Group
var g_nPerson2GroupCxnType = Constants.CT_EXEC_5;    //Connection between Group and Person

// SETTINGS EXCEL
//var g_sSheetIndex = 0;   // Relevant sheet
var g_sSheetName = "Risk Register";
var g_nXlsStartRowIndex = 1;    // Row where the region cell is expected

//SETTINGS LAYOUT
var g_nRoleStartX = 25; //Starting X Coordinate of the first Role object
var g_nRoleY = 25; //Starting Y Coordinate of the first Role object
var g_nRoleXSpacing = 1500; //Spacing between 2 Role objects in the X axis
var g_nRoleGroupXSpacing = 350;
var g_nGroupPersonXSpacing = 150;
var g_nInitialGroupOccY = 300;
var g_nVerticalSpacingStep = 200;
//***END SETTINGS




// BELOW PLEASE CHANGE WITH CAUTION - CONFIG SETTINGS ARE ABOVE !!!
var g_oFilter = ArisData.ActiveFilter();

var g_oNewOrgChart = null;

var g_oDatabase = ArisData.getActiveDatabase();
g_oGroup = null;

var g_sCurrentRoleName = "";
var g_oCurrentRoleOccurance = null;

var g_sCurrentGroupName = "";
var g_oCurrentGroupOccurance = null;

var g_nCurrentY = g_nInitialGroupOccY;

//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////


var g_oSimpleDateFormat = new java.text.SimpleDateFormat("yyyy-MM-dd");

var g_oFormatter = new java.text.SimpleDateFormat("yyyy-MM-dd");




function getRiskAttributes(){
    return [
        {
            'sXmlElementName': 'risk_risk_id',
            'sXlsImportColumn': 0,
            'sAttributeTypeNum': AT_NTT_RM_RISK_ID,
            'sAttributeReadType': 'TRY_NUMBER_OR_STRING',
            'sValue': '',
            'sUnit': ''
        },
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
        {
            'sXmlElementName': 'risk_last_review',
            'sXlsImportColumn': 4,
            'sAttributeTypeNum': AT_NTT_RM_LAST_REVIEW,
            'sAttributeReadType': 'DATE',
            'sValue': '',
            'sUnit': ''
        },
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
            'sAttributeReadType': 'FUNCTION_WRITE_TO_BOOL',
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



main(); // Run the report!


/**
 *  Main function going through the Excel-content
 **/
function main()
{
    //READ EXCEL FILE
    var xlsFile = getXlsFile();
    if(xlsFile==null){
        Dialogs.MsgBox("Die ausgewählte Datei konnte nicht als Exceldatei gelesen werden!");
        return false;
    }
    
    //var oSheet = getSheet(xlsFile, g_sSheetIndex);
    var oSheet = getSheetByName(xlsFile, g_sSheetName);
    if(oSheet==null){
        Dialogs.MsgBox("Sheet with name '" + g_sSheetName + "' could not be found in selected file.\nPlease check if the correct file format is selected.", Constants.MSGBOX_ICON_ERROR, "Sheet not found");
        return false;
    }
    
    
    
    var oMainRiskFolder = ArisData.getSelectedGroups()[0];
    if(oMainRiskFolder!=null && oMainRiskFolder.IsValid()){
        var sRiskImportModelName = "" + g_oImportDateFormat.format(new Date()) + "_" + g_oDatabase.ActiveUser().Name(g_nLoc);
        var oRiskImportModel = oMainRiskFolder.CreateModel(Constants.MT_RISK_DGM, sRiskImportModelName, g_nLoc);
        
        //Loop through Excel Sheet Rows
        var nCurrentRow = g_nXlsStartRowIndex;
        var nRiskCounter = 0;
        while(isCellMaintained(oSheet, nCurrentRow, g_nColRiskName)){
            addLoggerLine(g_result, 'INFO', "---");
            
            var sRiskName = getCellString(oSheet, nCurrentRow, g_nColRiskName);
            if(sRiskName!=null && sRiskName.length>250){
                addLoggerLine(g_result, 'FATAL', "Risk name text is too long! Cutting it to 250 characters..."); 
                sRiskName = (""+sRiskName).substring(0,250);
            }
            
            var sRiskFolderPath = oMainRiskFolder.Path(g_nLoc);
            if(isCellMaintained(oSheet, nCurrentRow, g_nColRiskFolder)){
                sRiskFolderPath = getCellString(oSheet, nCurrentRow, g_nColRiskFolder);
            }else{
                addLoggerLine(g_result, 'WARN', "Department not maintained. Using the main risk folder instead: " + oMainRiskFolder.Path(g_nLoc));    
            }
            
            /////////////////
            addLoggerLine(g_result, 'INFO', "Creating risk object from row " + nCurrentRow);    
            var oRiskObjDef = createRiskObj(sRiskName, oMainRiskFolder, sRiskFolderPath);
            if(oRiskObjDef!=null && oRiskObjDef.IsValid()){
                createObjOccInRiskImportModel(oRiskObjDef, oRiskImportModel, nRiskCounter);
            
                // Set all Risk Category Bool attributes to false as default. The actual selected bool attribute will be set to true in the writeRiskInfo function
                setRiskCategoryBoolAttributes(oRiskObjDef, false);
                var aoRiskAttributes = getRiskAttributes();
                writeRiskInfo(oRiskObjDef, aoRiskAttributes, oSheet, nCurrentRow);
                
                
                // SUB RISK
                var bRiskConnectedToSubRisk = connectRiskToSubRisk(oRiskObjDef, oSheet, nCurrentRow, oMainRiskFolder);
                
                
                // Create assigned "Governance diagram"
                var sAffectedSiteName = getAffectedSiteName(oRiskObjDef);
                var oAffectedSiteObjDef = getAffectedSiteObjDef(sAffectedSiteName);
                createAssignedGovernanceDiagram(oRiskObjDef, oAffectedSiteObjDef);
                
            }
            ////////////////////////////////////
            
        
        
            
            nCurrentRow+=1; //Go to the next row
            nRiskCounter++;
        }
        
        
    }

    
    
    
    //Dialogs.MsgBox("Report has completed! Please refresh the folder in ARIS and open the model again to see the changes.")
    
    
    // Finally generate the TXT output file!
    //generateOutputFile(g_result);
    generateOutputFileCSV(g_result, g_sSeparator);

    
    
}





function createRiskObj(sRiskName, oMainRiskFolder, sRiskFolderPath){
    var oRiskObjDef = null;
    
        
    // Get the name, i.e. for new sub-group
    //var sRiskName = Context.getProperty("sRiskName");
    
    //var sRiskName = "Test ABC";
    if(sRiskName!=null && !("".equals(sRiskName))){
        
        
        var sMainRiskFolderPath = oMainRiskFolder.Path(g_nLoc);
        var oRiskGroup = g_oDatabase.Group("" + sMainRiskFolderPath+"\\" + sRiskFolderPath, g_nLoc);
        if(oRiskGroup==null || !oRiskGroup.IsValid()){
            addLoggerLine(g_result, 'WARN', "Couldn't find specified folder '" + "" + sMainRiskFolderPath+"\\" + sRiskFolderPath + "'" );
            addLoggerLine(g_result, 'WARN', "Using the main folder instead: '" + oMainRiskFolder.Path(g_nLoc) + "'" );
            oRiskGroup = oMainRiskFolder;//If the child-group could not be found, use the user-selected group
        }

        addLoggerLine(g_result, 'INFO', "Trying to create risk '" + sRiskName + "' in folder '" + oRiskGroup.Path(g_nLoc) + "'");
        oRiskObjDef = oRiskGroup.CreateObjDef(Constants.OT_RISK, ""+sRiskName, g_nLoc);
        if(oRiskObjDef!=null && oRiskObjDef.IsValid()){
            addLoggerLine(g_result, 'INFO', "Risk ObjDef created successfully!");
            var bSymSet = oRiskObjDef.setDefaultSymbolNum(Constants.ST_RISK_1, true); // Propagate true, even though there shouldn't be any occs yet
            if(bSymSet){
                addLoggerLine(g_result, 'INFO', "Default symbol set successfully!");
            }else{
                addLoggerLine(g_result, 'WARN', "Could NOT set default symbol!");
            }
        }else{
            addLoggerLine(g_result, 'WARN', "Could NOT create risk ObjDef!");
        }
        
        
    }else{
        addLoggerLine(g_result, 'WARN', "No risk name found in Excel!");
    }
    return oRiskObjDef;
    
}


function createObjOccInRiskImportModel(oRiskObjDef, oRiskImportModel, nRiskCounter){
    var nPosX = 200;
    var nPosY = 200 + (nRiskCounter*300);
    
    return oRiskImportModel.createObjOcc(Constants.ST_RISK_1, oRiskObjDef, nPosX, nPosY, true); 
    
}




function setRiskCategoryBoolAttributes(oRiskObjDef, bValue){
    
    if(oRiskObjDef!=null){
        var anAttrTypeNums = gc_hmRiskCategoryAttributeMapping.values().toArray();
        if(anAttrTypeNums!=null && anAttrTypeNums.length>0){
            for each(var nAttrTypeNum in anAttrTypeNums){
                if(nAttrTypeNum!=null && !("").equals(""+nAttrTypeNum)){
                    if(oRiskObjDef.Attribute(nAttrTypeNum, g_nLoc)!=null){
                        oRiskObjDef.Attribute(nAttrTypeNum, g_nLoc).setValue(bValue);
                    }
                }
            }
        }
    }
    
}


function writeRiskInfo(oRiskObjDef, aoRiskAttributes, oSheet, nCurrentRow){
    
    
    
    // Finde das Maßnahme-Objekt
    //var oMassnahmeObjDef = getMassnahmenObjectInMassnahmenModel(oMassnahmenModel);

    // Write attributes to vorhaben/massnahmen object
    if(aoRiskAttributes!=null){
        for each(var oRiskAttribute in aoRiskAttributes){
            if(oRiskAttribute!=null && oRiskAttribute.sXlsImportColumn!=null && !("".equals(oRiskAttribute.sXlsImportColumn)) && oRiskAttribute.sXmlElementName!=null){
                //var sContextProperty = Context.getProperty(""+oRiskAttribute.sContextProperty);
                
                
                var sContextProperty = "";
                if(oRiskAttribute.sXlsImportColumn>=0){
                    sContextProperty = getCellString(oSheet, nCurrentRow, oRiskAttribute.sXlsImportColumn);
                }
                
                var bWriteOk = false;
                switch(oRiskAttribute.sAttributeReadType){
                    case "STRING":
                        if(sContextProperty==null){
                            sContextProperty="";
                        }
                        bWriteOk = oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(""+sContextProperty);
                        break;
                    case "DATE":
                        //var oDate = getDateFromString(""+sContextProperty);
                        var oDate = getCellValueAsDate(oSheet, nCurrentRow, oRiskAttribute.sXlsImportColumn)
                        if(oDate!=null){
                            bWriteOk = oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(oDate);
                        }
                        break;
                    case "BOOL":
                        var bValue = (""+sContextProperty).equals("wahr") ? true : false;
                        bWriteOk = oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(bValue);                        
                        break;
                    case "YES_NO":
                        var bValue = (""+sContextProperty).equals("Yes") ? true : false;
                        bWriteOk = oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(bValue);                        
                        break;
                    case "STATIC_BOOL_TRUE":
                        bWriteOk = oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(true);
                        break;
                    case "TRY_NUMBER_OR_STRING":
                        if(sContextProperty==null){
                            sContextProperty="";
                        }
                        if(!isNaN(""+sContextProperty)){
                            //sContextProperty = java.lang.Integer.parseInt(""+sContextProperty);
                            sContextProperty = Math.round(""+sContextProperty);
                        }
                        bWriteOk = oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(""+sContextProperty);
                        break;
                    case "FUNCTION_WRITE_TO_BOOL":
                        if(sContextProperty!=null && !("").equals(""+sContextProperty)){
                            if(gc_hmRiskCategoryAttributeMapping!=null && gc_hmRiskCategoryAttributeMapping.size()>0){
                                // Check if there is a value stored
                                if(gc_hmRiskCategoryAttributeMapping.containsKey(""+sContextProperty)){
                                    var nRiskCatAttrTypeNum = ""+gc_hmRiskCategoryAttributeMapping.get(""+sContextProperty);//i.e. "Operational" => AT_NTT_RM_OPERATIONAL_RISK
                                    if(nRiskCatAttrTypeNum!=null && !("").equals(""+nRiskCatAttrTypeNum)){
                                        if(oRiskObjDef.Attribute(nRiskCatAttrTypeNum, g_nLoc)!=null){
                                            bWriteOk = oRiskObjDef.Attribute(nRiskCatAttrTypeNum, g_nLoc).setValue(true);
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    default:
                        bWriteOk = oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(""+sContextProperty);
                }
                
                if(bWriteOk){
                    addLoggerLine(g_result, 'INFO', "--- Attribut written OK '" + oRiskAttribute.sXmlElementName + "' -> " + oRiskAttribute.sAttributeTypeNum);
                }else{
                    addLoggerLine(g_result, 'WARN', "--- Could NOT write attribut '" + oRiskAttribute.sXmlElementName + "' -> " + oRiskAttribute.sAttributeTypeNum);                    
                }
                
            }
            
        }
    }
    
    
    
}

function getDateFromString(sDate) {
    try {
        return g_oFormatter.parse(""+sDate);
        //return new SimpleDateFormat("yyyy-MM-dd").parse(sDate);
    } catch(e) {
        return null;
    }
}


function connectRiskToSubRisk(oRiskObjDef, oSheet, nCurrentRow, oMainRiskFolder){
    
    var oRiskMgmtGroup = oMainRiskFolder.Parent();
    var oSubRiskObjOcc = null;
    
    // Get Sub-Risk name
    var sSubRiskName = "";
    if(isCellMaintained(oSheet, nCurrentRow, g_nColSubRisk)){
        sSubRiskName = getCellString(oSheet, nCurrentRow, g_nColSubRisk);
    }
    if(sSubRiskName!=null && !("".equals(sSubRiskName))){
        // Find sub-risk objdef in DB
        var oSubRiskObjDef = null;
        var aoSubRiskObjDefs = g_oDatabase.Find(Constants.SEARCH_OBJDEF, Constants.OT_RISK_CATEGORY, Constants.AT_NAME, g_nLoc, ""+sSubRiskName, Constants.SEARCH_CMP_EQUAL);
        if(aoSubRiskObjDefs!=null){
            if(aoSubRiskObjDefs.length>1){
                addLoggerLine(g_result, 'WARN', "Found more than one sub-risk objDefs with name '" + sSubRiskName + "' in database!");
                oSubRiskObjDef = aoSubRiskObjDefs[0];
            }else if (aoSubRiskObjDefs.length==1){
                addLoggerLine(g_result, 'INFO', "Found sub-risk objDefs with name '" + sSubRiskName + "' in database!");
                oSubRiskObjDef = aoSubRiskObjDefs[0];
            }else{
                addLoggerLine(g_result, 'WARN', "Cannot find sub-risk '" + sSubRiskName + "' in database!");
            }
        }else{
            addLoggerLine(g_result, 'WARN', "Cannot find sub-risk '" + sSubRiskName + "' in database!");
        }
        
        // Sub-risk not found?
        if(oSubRiskObjDef==null){
            // Create the sub-risk
            addLoggerLine(g_result, 'INFO', "Sub-risk objDef was not found, so try to create one...");
            
            addLoggerLine(g_result, 'INFO', "Try to create sub-risk objDef '" + sSubRiskName + "' in folder '" + oRiskMgmtGroup.Path(g_nLoc) + "'...");
            oSubRiskObjDef = oRiskMgmtGroup.CreateObjDef(Constants.OT_RISK_CATEGORY, ""+sSubRiskName, g_nLoc);
            if(oSubRiskObjDef!=null && oSubRiskObjDef.IsValid()){
                oSubRiskObjDef.setDefaultSymbolNum(Constants.ST_RISK_CATEGORY, true); // Propagate true, even though there shouldn't be any occs yet
                addLoggerLine(g_result, 'INFO', "Sub-risk objDef '" + sSubRiskName + "' created in folder '" + oRiskMgmtGroup.Path(g_nLoc) + "' and default symbol set to '" + Constants.ST_RISK_CATEGORY + "'");
            }else{
                addLoggerLine(g_result, 'WARN', "Could not create sub-risk '" + sSubRiskName + "'! The risk will not be connected to a sub-risk!");
                return null;
            }
        }
        
        
        // Check if Sub Risk Model already exists
        var oAssignedSubRiskDiagram = null;
        var aoAssignedSubRiskDiagrams = oSubRiskObjDef.AssignedModels([Constants.MT_RISK_DGM]);
        if(aoAssignedSubRiskDiagrams!=null){
            if(aoAssignedSubRiskDiagrams.length>1){
                addLoggerLine(g_result, 'WARN', "Found more than one sub-risk-diagrams assigned to the sub-risk objDef.");
                oAssignedSubRiskDiagram = aoAssignedSubRiskDiagrams[0];
            }else if (aoAssignedSubRiskDiagrams.length==1){
                addLoggerLine(g_result, 'INFO', "Found one sub-risk-diagrams assigned to the sub-risk objDefs with name '" + sSubRiskName + "' in database!");
                oAssignedSubRiskDiagram = aoAssignedSubRiskDiagrams[0];
            }else{
                addLoggerLine(g_result, 'WARN', "Cannot find any sub-risk-diagrams assigned to the sub-risk '" + sSubRiskName + "' in database!");
            }
        }else{
            addLoggerLine(g_result, 'WARN', "Cannot find any sub-risk-diagrams assigned to the sub-risk '" + sSubRiskName + "' in database!");
        }
        
        var oSubRiskGroup = null;
        if(oAssignedSubRiskDiagram==null){
            var aoChildGroups = oRiskMgmtGroup.Childs();
            if(aoChildGroups!=null && aoChildGroups.length>0){
                for each(var oChildGroup in aoChildGroups){
                    if(oChildGroup!=null){
                        if(("2. Sub Risks").equals(oChildGroup.Name(g_nLoc))){
                            oSubRiskGroup = oChildGroup;
                            addLoggerLine(g_result, 'INFO', "Found sub-risk-group '2. Sub Risks'");
                        }
                    }
                }
            }
            
            if(oSubRiskGroup==null){
                addLoggerLine(g_result, 'WARN', "Cannot find sub-risk group '2. Sub Risks'. Using the main risk management group instead.");
                oSubRiskGroup = oRiskMgmtGroup;
            }
            
            addLoggerLine(g_result, 'INFO', "Trying to create sub-risk model '" + sSubRiskName + "'");
            oAssignedSubRiskDiagram = oSubRiskGroup.CreateModel(Constants.MT_RISK_DGM, ""+sSubRiskName, g_nLoc);
            if(oAssignedSubRiskDiagram!=null && oAssignedSubRiskDiagram.IsValid()){
                addLoggerLine(g_result, 'INFO', "Sub-risk model '" + sSubRiskName + "' created in folder '" + oSubRiskGroup.Path(g_nLoc) + "'");
            }else{
                addLoggerLine(g_result, 'WARN', "Could not create sub-risk model.");
                return null;
            }
            
            
            var bAssignmentCreated = oSubRiskObjDef.CreateAssignment(oAssignedSubRiskDiagram, false);
        
            
            if(bAssignmentCreated){
                addLoggerLine(g_result, 'INFO', "Assignment created for sub-risk model to sub-risk objdef");
                var nPosX = 100;
                var nPosY = 100;
                oSubRiskObjOcc = oAssignedSubRiskDiagram.createObjOcc(Constants.ST_RISK_CATEGORY, oSubRiskObjDef, nPosX, nPosY, true); 
            }else{
                addLoggerLine(g_result, 'WARN', "Could not assign sub-risk model to sub-risk objdef");
            }
        
        
        }else{//Assigned sub-risk diagram already exists
            // Find the root objOcc, meaning the sub-risk
            var aoSubRiskObjOccs = oAssignedSubRiskDiagram.ObjOccListBySymbol([Constants.ST_RISK_CATEGORY]);
            if(aoSubRiskObjOccs!=null && aoSubRiskObjOccs.length>0){
                oSubRiskObjOcc = aoSubRiskObjOccs[0];
                addLoggerLine(g_result, 'INFO', "Found sub-risk objOcc in already existing sub-risk diagram!");
            }else{
                addLoggerLine(g_result, 'WARN', "Could not find sub-risk objOcc in already existing sub-risk diagram!");
            }
            
        }
        
        
        
        
        
        if(oSubRiskObjOcc!=null){
            // Create objOcc in sub-risk diagram
            var nPosX = 200;
            var nPosY = 200;
            
            var oRiskObjOcc = oAssignedSubRiskDiagram.createObjOcc(Constants.ST_RISK_1, oRiskObjDef, nPosX, nPosY, true); 
            
            if(oRiskObjOcc!=null && oRiskObjOcc.IsValid()){
                addLoggerLine(g_result, 'INFO', "Created risk objOcc in sub-risk diagram.");
                var oCxnPoints = [];
                oCxnPoints.push(new java.awt.Point(oRiskObjOcc.X(), oRiskObjOcc.Y() + (oRiskObjOcc.Height()/2) ));
                oCxnPoints.push(new java.awt.Point(oSubRiskObjOcc.X()+oSubRiskObjOcc.Width(), oSubRiskObjOcc.Y() + (oSubRiskObjOcc.Height()/2) ));
                var bCxnCreated = oAssignedSubRiskDiagram.CreateCxnOcc(oSubRiskObjOcc, oRiskObjOcc, Constants.CT_SUBS_1, oCxnPoints);
                
                if(bCxnCreated){
                    addLoggerLine(g_result, 'INFO', "Created connection from sub-risk to risk objOcc.");
                    
                }else{
                    addLoggerLine(g_result, 'WARN', "Could not create connection from sub-risk to risk objOcc.");
                }
            }else{
                addLoggerLine(g_result, 'WARN', "Could not create risk objOcc in sub-risk diagram!");
                return null;
            }
        }
        
        var bTemplateApplied = oAssignedSubRiskDiagram.setTemplate("90035e81-4129-11d4-857d-00005a4053ff", true);
        var bTemplateApplied = oAssignedSubRiskDiagram.setTemplate("4b99e420-1b24-11e9-7336-00155de0641b", true);
        if(bTemplateApplied){
            addLoggerLine(g_result, 'INFO', "Template applied to risk model");
        }else{
            addLoggerLine(g_result, 'WARN', "Could NOT apply template to risk model!");
        }

                                
        // Auto-layout
        //oAssignedSubRiskDiagram.doLayout();
        applyLayoutToSubRiskDiagram(oAssignedSubRiskDiagram);
    }
    return true;
}






function createAssignedGovernanceDiagram(oRiskObjDef, oAffectedSiteObjDef){
    
    addLoggerLine(g_result, 'INFO', "Trying to create the assigned Governance diagram...");
        
    if(oRiskObjDef!=null && oRiskObjDef.IsValid()){
        
        var oRiskGroup = oRiskObjDef.Group();
        if(oRiskGroup!=null){
            addLoggerLine(g_result, 'INFO', "Target group: " + oRiskGroup.Path(g_nLoc));
            
            
            
            
            addLoggerLine(g_result, 'INFO', "Trying to create Governance diagram with name '" + oRiskObjDef.Name(g_nLoc) + "'");
            oAssignedGovernanceDiagram = oRiskGroup.CreateModel(Constants.MT_BUSY_CONTR_DGM, ""+oRiskObjDef.Name(g_nLoc), g_nLoc);
            if(oAssignedGovernanceDiagram!=null && oAssignedGovernanceDiagram.IsValid()){
                addLoggerLine(g_result, 'INFO', "Governance diagram '" + oAssignedGovernanceDiagram.Name(g_nLoc) + "' created in folder '" + oRiskGroup.Path(g_nLoc) + "'");
            }else{
                addLoggerLine(g_result, 'WARN', "Could not create Governance diagram.");
                return null;
            }
            
            
            var bAssignmentCreated = oRiskObjDef.CreateAssignment(oAssignedGovernanceDiagram, false);
        
            
            if(bAssignmentCreated){
                addLoggerLine(g_result, 'INFO', "Assignment created for Governance diagram to risk objdef");
                var nPosX = 100;
                var nPosY = 100;
                oRiskObjOcc = oAssignedGovernanceDiagram.createObjOcc(Constants.ST_RISK_1, oRiskObjDef, nPosX, nPosY, true); 
                
                
                // AFFECTED SITE
                if(oRiskObjOcc!=null){
                    // Create objOcc in governance diagram
                    var nPosX = 1000;
                    var nPosY = 100;
                    
                    if(oAffectedSiteObjDef!=null && oAffectedSiteObjDef.IsValid()){
                        var oAffectedSiteObjOcc = oAssignedGovernanceDiagram.createObjOcc(Constants.ST_ORG_UNIT_2, oAffectedSiteObjDef, nPosX, nPosY, true); 
                        
                        if(oAffectedSiteObjOcc!=null && oAffectedSiteObjOcc.IsValid()){
                            addLoggerLine(g_result, 'INFO', "Created objOcc for Affected Site in Governance diagram.");
                            var oCxnPoints = [];
                            oCxnPoints.push(new java.awt.Point(oAffectedSiteObjOcc.X(), oAffectedSiteObjOcc.Y() + (oAffectedSiteObjOcc.Height()/2) ));
                            oCxnPoints.push(new java.awt.Point(oRiskObjOcc.X()+oRiskObjOcc.Width(), oRiskObjOcc.Y() + (oRiskObjOcc.Height()/2) ));
                            var bCxnCreated = oAssignedGovernanceDiagram.CreateCxnOcc(oRiskObjOcc, oAffectedSiteObjOcc, Constants.CT_IS_UNDER_RESP_OF, oCxnPoints);
                            
                            if(bCxnCreated){
                                addLoggerLine(g_result, 'INFO', "Created connection from risk to affected site objOcc.");
                                
                                
                                var bTemplateApplied = oAssignedGovernanceDiagram.setTemplate("90035e81-4129-11d4-857d-00005a4053ff", true);
                                var bTemplateApplied = oAssignedGovernanceDiagram.setTemplate("4b99e420-1b24-11e9-7336-00155de0641b", true);
                                if(bTemplateApplied){
                                    addLoggerLine(g_result, 'INFO', "Template applied to Governance diagram");
                                }else{
                                    addLoggerLine(g_result, 'WARN', "Could NOT apply template to Governance diagram!");
                                }
                                
                                
                            }else{
                                addLoggerLine(g_result, 'WARN', "Could not create connection from risk to affected site objOcc.");
                            }
                        }else{
                            addLoggerLine(g_result, 'WARN', "Could not create affected site objOcc in Governance diagram!");
                            return null;
                        }
                    }else{
                        addLoggerLine(g_result, 'WARN', "Affected site ObjDef is null! Could NOT create occurrence in Governance Model");
                    }
                }
                
                
                
            }else{
                addLoggerLine(g_result, 'WARN', "Could not assign Governane diagram to risk objdef");
            }
            
            
        }else{
            addLoggerLine(g_result, 'WARN', "Couldn't find folder for risk '" + oRiskObjDef.Name(g_nLoc) + "'" );
        }
        
    }else{
        addLoggerLine(g_result, 'WARN', "Risk obj def is null!");
    }
        
        
    
}


function getAffectedSiteName(oRiskObjDef){
    var sAffectedSiteName = "";
    
    if(oRiskObjDef!=null && oRiskObjDef.IsValid()){
        
        if(oRiskObjDef.Attribute(AT_NTT_RM_GDC_EMEA_AFFECTED_SITE, g_nLoc)!=null){
            sAffectedSiteName = "" + oRiskObjDef.Attribute(AT_NTT_RM_GDC_EMEA_AFFECTED_SITE, g_nLoc).getValue();
        }
    }
    return sAffectedSiteName;
}


function getAffectedSiteObjDef(sAffectedSiteName){
    var oAffectedSiteObjDef = null;
    
    if(sAffectedSiteName!=null && !("".equals(sAffectedSiteName))){
        var aoObjDefs = g_oDatabase.Find(Constants.SEARCH_OBJDEF, [Constants.OT_ORG_UNIT], Constants.AT_NAME, g_nLoc, ""+sAffectedSiteName, Constants.SEARCH_CMP_EQUAL);
        if(aoObjDefs!=null && aoObjDefs.length>0){
            // There should only be one site
            oAffectedSiteObjDef = aoObjDefs[0];
        }
    }
    return oAffectedSiteObjDef;
}



////////////////////////////
////////////////////////////
////////////////////////////
////////////////////////////
////////////////////////////




/**
 *  Find the Excel file and return the Excel-file-object
 **/
function getXlsFile(){
    var oXlsFile = null;
    var selFiles = Dialogs.getFilePath("MyFile.xls",
                                    "*.xlsx!!Worksheet Files NEW|*.xlsx|Worksheet Files|*.xls|All Files|*.*||",
                                    "",
                                    "Select all files to be opened",
                                    0);
    return selFiles[0].getData();
    
    

    /*
    if(xlsFileName!=null && !xlsFileName.equals("")){
        try{
            oXlsFile = Context.getFile(xlsFileName, Constants.LOCATION_SCRIPT);
        }catch(e){
            Dialogs.MsgBox("Could not find Excel-file '" + xlsFileName + "'", Constants.MSGBOX_ICON_ERROR, "File not found");
        }
    }
    return oXlsFile;
    */
}


/**
 *  Find the sheet in the loaded Excel-file
 **/
function getSheet(xlsFile, sheetIndex){
    
    if(xlsFile!=null)
    {
        try
        {
        return Context.getExcelReader(xlsFile).getSheetAt(sheetIndex);
        }
        catch(ex)
        {Dialogs.MsgBox("Selected file is not in a correct format!");return null;}
    }
    
    return null;
}


function getSheetByName(xlsFile, sSheetName){
    
    if(xlsFile!=null && !("".equals(sSheetName)))
    {
        try
        {
            var aoSheets = Context.getExcelReader(xlsFile).getSheets();
            if(aoSheets!=null && aoSheets.length>0){
                for each(var oSheet in aoSheets){
                    if(oSheet!=null){
                        if((""+sSheetName).equals(oSheet.getName())){
                            return oSheet;
                        }
                    }
                }
            }
        }
        catch(ex){
            Dialogs.MsgBox("Could not find sheet '" + sSheetName + "'!");
        }
    }
    
    return null;
}


/**
 *  Return true if the cell is NOT empty, otherwise false
 */
function isCellMaintained(oSheet, nRow, nCol){
    
    if(oSheet!=null && nRow>-1 && nCol>-1){
        if(oSheet.getRowAt(nRow)!=null && oSheet.getRowAt(nRow).getCellAt(nCol)!=null){
            var sCell = oSheet.getRowAt(nRow).getCellAt(nCol).getCellValue();
            if(sCell!=null && !"".equals(sCell)){
                return true;
            }
        }
    }
    return false;   
}



/**
 *  Return cell-value as string
 */
function getCellString(oSheet, nRow, nCol){
    var sCellValue = "";
    
    if(oSheet!=null && nRow>-1 && nCol>-1){
        if(oSheet.getRowAt(nRow)!=null && oSheet.getRowAt(nRow).getCellAt(nCol)!=null && oSheet.getRowAt(nRow).getCellAt(nCol).getCellValue()!=null){
            sCellValue = oSheet.getRowAt(nRow).getCellAt(nCol).getCellValue();
        }
    }
    return ""+sCellValue;   
}



function getCellValueAsDate(oSheet, nRow, nCol){
    var oCellDateValue = null;
    
    if(oSheet!=null && nRow>-1 && nCol>-1){
        if(oSheet.getRowAt(nRow)!=null && oSheet.getRowAt(nRow).getCellAt(nCol)!=null && oSheet.getRowAt(nRow).getCellAt(nCol).getDateCellValue()!=null){
            oCellDateValue = oSheet.getRowAt(nRow).getCellAt(nCol).getDateCellValue();
        }
    }
    return oCellDateValue;   
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
            Dialogs.MsgBox("Output format must be TXT");
        }
    }else{
        Dialogs.MsgBox("Error: No result object was created. Please consult your ARIS Administrator.", Constants.MSGBOX_ICON_ERROR, "No result object");
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
            Dialogs.MsgBox("Output format must be TXT");
        }
    }else{
        Dialogs.MsgBox("Error: No result object was created. Please consult your ARIS Administrator.", Constants.MSGBOX_ICON_ERROR, "No result object");
        Context.setScriptError(Constants.ERR_CANCEL);
    }
}
