/*
 *
 *  Report Name: NTT-RM-02 Output risk version delta as Excel
 *  Version: 2.2
 *  Date: 2022-12-14
 *  Author: BPExperts GmbH [MaHi]
 *
 *
 *  Description:
 *  --- v2.2 ---
 *  # Always round the value of 'Estimated Mitigation Cost' to 2 digits, and show as formatted number in Excel cell
 *  # 
 *
 *
 *  --- v2.1 ---
 *  # Output file is better showing the difference between new risk case vs updated existing risk case
 *  # Add flag to hide the delta column (default: Hide delta column)
 *
 *
 *  --- v2.0 ---
 *  # Reversed logic to start report on quick model, and search for risk object (if existing)
 *
 *
 *  --- v1.1 ---
 *  # Improvements on the formatting of the output Excel
 *
 *
 *  --- v1.0 ---
 *  # Run report on risk object
 *  # Risk object attribute "Source" (AT_SRC) must have a GUID of the quick object stored
 *  # The quick object is looked up in the log database
 *
 *
*/


var g_oDatabase = ArisData.getActiveDatabase();
var g_oFilter = g_oDatabase.ActiveFilter();
var g_nLoc = Context.getSelectedLanguage();


/////////////////////////////////////////////////////////////////
/// BELOW THIS LINE, ONLY CHANGE CAREFULLY //////////////////////
/////////////////////////////////////////////////////////////////

const g_bShowDeltaColumn = false;

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
const g_sHeadlineNewRisk = "New Risk";
const g_sHeadlineDelta = "Change";

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



function getRiskAttributes(){
    return [
        {
            'sXmlElementName': 'risk_risk_id',
            'sXlsImportColumn': 0,
            'sAttributeTypeNum': Constants.AT_AAM_RISK_ID,
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
            'sAttributeReadType': 'STRING',
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
        /*{
            'sXmlElementName': 'risk_risk_category',
            'sXlsImportColumn': 9,
            'sAttributeTypeNum': AT_NTT_RM_RISK_CATEGORY,
            'sAttributeReadType': 'STRING',
            'sValue': '',
            'sUnit': ''
        },*/
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
            'sAttributeReadType': 'NUMBER',
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


var g_hmStyles = new java.util.HashMap();


var dateFormat = new java.text.SimpleDateFormat("MMMMM dd, yyyy");
var yearFormat = new java.text.SimpleDateFormat("yyyy");
var fileFormat = new java.text.SimpleDateFormat("yyyy.MM.dd");
var dateNow = new Date();





main();

function main()
{
    //var nCurrentRow = 1;
        
    var oWorkbook = Context.createExcelWorkbook(""+g_sExcelOutputFileNamePrefix + g_sExcelOutputFileFormat);
    
    initStyles(oWorkbook);
    
    var oSheet = oWorkbook.createSheet("Risk Version Delta");
    oSheet.setColumnWidth(g_nAttrNameColumn, g_nColumnWidthAttrName);
    oSheet.setColumnWidth(g_nRiskColumn, g_nColumnWidthRisk);
    oSheet.setColumnWidth(g_nQuickColumn, g_nColumnWidthQuick);
    oSheet.setColumnWidth(g_nDeltaColumn, g_nColumnWidthDelta);
    
    
    var oQuickObjDef = getQuickObjDef();
    
    var oMainDatabase = getMainDatabase();
    var oRiskObjDef = getRiskObjDef(oMainDatabase, oQuickObjDef);
    //oQuickObjDef=oRiskObjDef;


    writeHeadlines(oSheet, g_nRowHeadline, getStyle("style-headline"), oRiskObjDef);
    
    if(oQuickObjDef!=null && oSheet!=null){
        writeAttributes(oRiskObjDef, oQuickObjDef, oSheet);
        
    }
    
    
    oWorkbook.write();
    
    
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
        
        var oCellStyleGeneralNumber = oWorkbook.createCellStyle(oFont,1,1,1,1,Constants.C_BLACK,Constants.C_GRAY,Constants.C_GRAY,Constants.C_GRAY,Constants.ALIGN_LEFT,Constants.ALIGN_CENTER,Constants.C_TRANSPARENT,Constants.C_TRANSPARENT,Constants.SOLID_FOREGROUND);
        oCellStyleGeneralNumber.setWrapText(true);
        oCellStyleGeneralNumber.setDataFormat(Constants.XL_CELL_DATAFORMAT_DIG_1_2_00);
        g_hmStyles.put("style-general-number", oCellStyleGeneralNumber);

        
        var oCellStyleDelta = oWorkbook.createCellStyle(oFont,1,1,1,1,Constants.C_GRAY,Constants.C_GRAY,Constants.C_GRAY,Constants.C_GRAY,Constants.ALIGN_LEFT,Constants.ALIGN_CENTER,Constants.C_LIGHT_YELLOW,Constants.C_LIGHT_YELLOW,Constants.SOLID_FOREGROUND);
        oCellStyleDelta.setWrapText(true);  
        g_hmStyles.put("style-delta", oCellStyleDelta);
        
        var oCellStyleDeltaNumber = oWorkbook.createCellStyle(oFont,1,1,1,1,Constants.C_BLACK,Constants.C_GRAY,Constants.C_GRAY,Constants.C_GRAY,Constants.ALIGN_LEFT,Constants.ALIGN_CENTER,Constants.C_LIGHT_YELLOW,Constants.C_LIGHT_YELLOW,Constants.SOLID_FOREGROUND);
        oCellStyleDeltaNumber.setWrapText(true);  
        oCellStyleDeltaNumber.setDataFormat(Constants.XL_CELL_DATAFORMAT_DIG_1_2_00);
        g_hmStyles.put("style-delta-number", oCellStyleDeltaNumber);

        
        var oFontBold = oWorkbook.createFont();
        oFontBold.setFontName("Arial"); 
        oFontBold.setColor(black);
        oFontBold.setBold(true);
        var oCellStyleHeadline = oWorkbook.createCellStyle(oFontBold,1,1,1,1,Constants.C_GRAY,Constants.C_GRAY,Constants.C_GRAY,Constants.C_GRAY,Constants.ALIGN_LEFT,Constants.ALIGN_CENTER,Constants.C_LIGHT_BLUE,Constants.C_LIGHT_BLUE,Constants.SOLID_FOREGROUND);
        oCellStyleHeadline.setWrapText(true);  
        g_hmStyles.put("style-headline", oCellStyleHeadline);
        
    }
       
}


function getStyle(sStyleName, sAttributeType){
    
    if(sAttributeType!=null && !("").equals(""+sAttributeType)){
        if(("NUMBER").equals(""+sAttributeType)){
            sStyleName=""+sStyleName+"-number";
        }
    }
    
    if(g_hmStyles!=null){
        
        if(g_hmStyles.containsKey(""+sStyleName)){
            return g_hmStyles.get(""+sStyleName);
        }
    }
    return null;
}



function writeHeadlines(oSheet, nRow, oCellStyleHeadline, oRiskObjDef){
    
    
    outputCellValue(oSheet, nRow, g_nAttrNameColumn, g_sHeadlineAttrName, oCellStyleHeadline);
    if(oRiskObjDef!=null && oRiskObjDef.IsValid()){
        outputCellValue(oSheet, nRow, g_nRiskColumn, g_sHeadlineCurrentRisk, oCellStyleHeadline);
        outputCellValue(oSheet, nRow, g_nQuickColumn, g_sHeadlineUpdatedRisk, oCellStyleHeadline);
        if(g_bShowDeltaColumn){
            outputCellValue(oSheet, nRow, g_nDeltaColumn, g_sHeadlineDelta, oCellStyleHeadline);
        }
    }else{
        outputCellValue(oSheet, nRow, g_nQuickColumn-1, g_sHeadlineNewRisk, oCellStyleHeadline);
        //outputCellValue(oSheet, nRow, g_nDeltaColumn-1, g_sHeadlineDelta, oCellStyleHeadline);

    }
    
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
    
    var oMainDB = ArisData.openDatabase(g_sMainDatabaseName, g_sMainDatabaseUsername, g_sMainDatabasePassword, g_sMainDatabaseFilterGUID, g_nLoc, true);//Open in read-only mode
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



function writeAttributes(oRiskObjDef, oQuickObjDef, oSheet){
    
    
    var nColumnOffset = 0;
    if(oRiskObjDef==null){
        nColumnOffset=-1;
    }
    
    var nCurrentRow = g_nRowAttributeStart;
    var aoRiskAttributes = getRiskAttributes();
    
    
    if(aoRiskAttributes!=null){
        for each(var oRiskAttribute in aoRiskAttributes){
            if(oRiskAttribute!=null){
                
                // Write the name of the attribute
                //var sAttrName = oRiskAttribute.sXmlElementName;
                var sAttrName = getAttributeName(oRiskAttribute);
                outputAttributeValue(oSheet, nCurrentRow, g_nAttrNameColumn, sAttrName, oRiskAttribute, getStyle("style-general"));
                
                var sQuickValue = readAttribute(oQuickObjDef, oRiskAttribute);
                
                
                var sDelta = "";
                // Check if risk object exists (only for "update"-case)
                if(oRiskObjDef!=null && oRiskObjDef.IsValid()){
                    var sQuickCellStyle = "style-general";
                    var sRiskValue = readAttribute(oRiskObjDef, oRiskAttribute);
                    outputAttributeValue(oSheet, nCurrentRow, g_nRiskColumn, sRiskValue, oRiskAttribute, getStyle("style-general", oRiskAttribute.sAttributeReadType));
                    
                    if(isValueDifferent(sRiskValue, sQuickValue, oRiskAttribute)){
                        sQuickCellStyle = "style-delta";
                        sDelta = "Value has changed!";
                        if(g_bShowDeltaColumn){
                            outputAttributeValue(oSheet, nCurrentRow, g_nDeltaColumn+nColumnOffset, sDelta, oRiskAttribute, getStyle("style-delta", oRiskAttribute.sAttributeReadType));
                        }
                    }
                    outputAttributeValue(oSheet, nCurrentRow, g_nQuickColumn+nColumnOffset, sQuickValue, oRiskAttribute, getStyle(sQuickCellStyle, oRiskAttribute.sAttributeReadType));
                }else{
                    //sDelta = "New proposed risk object!";
                    outputAttributeValue(oSheet, nCurrentRow, g_nQuickColumn+nColumnOffset, sQuickValue, oRiskAttribute, getStyle("style-general", oRiskAttribute.sAttributeReadType));
                    
                }
                /*
                if(!("".equals(sDelta))){
                    outputAttributeValue(oSheet, nCurrentRow, g_nDeltaColumn+nColumnOffset, sDelta, oRiskAttribute, getStyle("style-delta"));
                }
                */
                
                
                
            }
            nCurrentRow++;
        }
    }
    
    
    
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
                    sValue = oDateFormat.format(oDate);
                }
                break;/*
            case "BOOL":
                var bValue = (""+sContextProperty).equals("wahr") ? true : false;
                oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(bValue);                        
                break;
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




function outputAttributeValue(oSheet, nCurrentRow, g_nRiskColumn, sValue, oRiskAttribute, oCellStyle){
    
    
    if(oSheet!=null){
        var oRow = null;
        var oCell = null;
        if(oSheet.getRowAt(nCurrentRow)!=null){
            oRow = oSheet.getRowAt(nCurrentRow);
        }else{
            oRow = oSheet.createRow(nCurrentRow);
        }
        if(oRow!=null){
            oCell = oRow.createCell(g_nRiskColumn);
        }
        //var oCell = oSheet.getRowAt(nCurrentRow).createCell(g_nRiskColumn);
        if(oCell!=null){
            
            oCell.setCellStyle(oCellStyle);
            
            
            switch(oRiskAttribute.sAttributeReadType){
                case "STRING":
                    oCell.setCellValue(""+sValue);
                    break;
                case "NUMBER":
                    if(sValue==null){
                        sValue="";
                    }
                    if(!isNaN(""+sValue)){
                        try{
                            //sValue = Float.parseFloat(""+sValue);
                            /*var oBigDecimal = new java.math.BigDecimal(""+sValue);
                            oBigDecimal = oBigDecimal.setScale(2, RoundingMode.HALF_UP);
                            sValue = oBigDecimal.doubleValue();
                            */
                            var fValue = Math.round(sValue * 100.0) / 100.0;
                            oCell.setCellValue(fValue);
                        }catch(e){
                            oCell.setCellValue(""+sValue);
                        }
                        //sContextProperty = java.lang.Integer.parseInt(""+sContextProperty);
                        /*try{
                            sValue = Math.round(""+sValue);
                        }catch(e){
                            
                        }*/
                    }else{
                        oCell.setCellValue(""+sValue);
                    }
                    break;
                /*case "DATE":
                    oCell.setCellValue(""+sValue);
                    break;*/
                    /*
                case "BOOL":
                    var bValue = (""+sContextProperty).equals("wahr") ? true : false;
                    oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(bValue);                        
                    break;
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
                    oCell.setCellValue(""+sValue);
            }
        }
    }
    
}



function isValueDifferent(sRiskValue, sQuickValue, oRiskAttribute){
    
    var bIsDifferent = false;
    
    
    switch(oRiskAttribute.sAttributeReadType){
            case "STRING":
                bIsDifferent = !(""+sRiskValue).equals(""+sQuickValue);
                break;
            /*case "DATE":
                bIsDifferent  = !(sRiskValue.getTime()==sQuickValue.getTime());
                break;*/
                /*
            case "BOOL":
                var bValue = (""+sContextProperty).equals("wahr") ? true : false;
                oRiskObjDef.Attribute(oRiskAttribute.sAttributeTypeNum, g_nLoc).setValue(bValue);                        
                break;
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
                bIsDifferent = !(""+sRiskValue).equals(""+sQuickValue);
        }
    
    return bIsDifferent;
}


function getAttributeName(oRiskAttribute){
    return ""+g_oFilter.AttrTypeName(oRiskAttribute.sAttributeTypeNum);
}



function getAvailableValuesByMethod(intAttrType) {
    var retArray = new Array();

    var listValueTypes = g_oFilter.AttrValueTypeNums(intAttrType);
    for each(var valueTypeNum in listValueTypes) {
        retArray.push(g_oFilter.AttrValueType(intAttrType, valueTypeNum));
    }

    return retArray;
}







