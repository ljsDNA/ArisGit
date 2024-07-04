//
// Created on 16/09/22 by Nikola Dlaka                                                                                                                   
// This include file contains the generic functions and classes to provide NTT Risk Register Logic
// 


// Usage example and testing section - please comment out after testing!


/*
var oRiskRegisterLogic = new RiskRegisterLogic("NTT\\Risk Register Configuration",
                                               "Risk Register-strength of controls.xlsx",
                                               "Risk Register-strength of controls",
                                               "Backend");
//Major;Less Likely;No Controls in Place;High;
var oScores = oRiskRegisterLogic.getRiskScores("Major", "Less Likely", "No Controls in Place");
var oScores = oRiskRegisterLogic.getRiskScores("Major", "Less Likely", "");
var oScores = oRiskRegisterLogic.getRiskScores("Major", "Less Likely", "No Controls in Place");
//var oScores = oRiskRegisterLogic.getRiskScores("Moderate", "Possible", "aaa");

var resultInherentScore = oScores.inherentScore; //should be High
var resultResidualScore = oScores.residualScore; //should be Medium  
*/

/*
var oCountrySiteMap = new CountrySiteMap("countrySiteMap.xlsx", "countrySiteMap")
var site = oCountrySiteMap.getSiteList("Germany")
*/


function RiskRegisterLogic(strFolder, strFilenameWithExtension, strFileTitle, strSheetName) {
    
    this.intImpactColumn = 18;
    this.intProbabilityColumn = 19;
    this.intInherentScoreColumn = 21;
    this.intStrenghtOfControlColumn = 23;
    this.intResidualScoreColumn = 27;
    this.keyDelimiter = ";;";
    this.riskRegisterConfigMap = new java.util.HashMap();
    
    //var oADSHelper = new ADSHelper();
    //var xlsConfigWorkbook = oADSHelper.getXLSDocumentFromADS(strFolder, strFilenameWithExtension, strFileTitle);
    var xlsData = Context.getFile(strFilenameWithExtension, Constants.LOCATION_SCRIPT);
    var xlsConfigWorkbook = Context.getExcelReader(xlsData);
    var xlsConfigSheet = getSheetByName(xlsConfigWorkbook, strSheetName);
    
    //Parse Configuration sheet
    var listXlsRows = xlsConfigSheet.getRows();
    for(var i=0; i < listXlsRows.length; i++){
        var strFirstCellValue = listXlsRows[i].getCellAt(this.intImpactColumn).getCellValue().trim();
        var strSecondCellValue = listXlsRows[i].getCellAt(this.intProbabilityColumn).getCellValue().trim();
        
        if(!strFirstCellValue.equals("") && !strSecondCellValue.equals("") && !strFirstCellValue.equals("Impact")){
            //Only then add Impact/Probability values combination
            var strImpact = strFirstCellValue;
            var strProbability = strSecondCellValue;
            var strStrengthOfControl = listXlsRows[i].getCellAt(this.intStrenghtOfControlColumn).getCellValue().trim();
            var strInherentScore = listXlsRows[i].getCellAt(this.intInherentScoreColumn).getCellValue().trim();
            var strResidualScore = listXlsRows[i].getCellAt(this.intResidualScoreColumn).getCellValue().trim();
            
            var strKey = strImpact + this.keyDelimiter + strProbability + this.keyDelimiter + strStrengthOfControl;
            strKey = cleanKey(strKey);
            var oScoreObject = {
                inherentScore : strInherentScore,
                residualScore : strResidualScore
            };
            
           
            if(!this.riskRegisterConfigMap.containsKey(strKey))
                this.riskRegisterConfigMap.put(strKey, oScoreObject);
        }
    }
    
    ////////////////////////////////////////////////////////////////////////////////////////////////
    // getScores function
    // returns: Object with inherentScore and residualScore properties
    // in case no scores found, returns null
    ///////////////////////////////////////////////////////////////////////////////////////////////
    this.getRiskScores = function(strImpact, strProbability, strStrengthOfControl){
        
        // default value is No Controls in Place 
        if(!strImpact.equals("") && !strProbability.equals("") && strStrengthOfControl.equals(""))
            strStrengthOfControl = "No Controls in Place";
        
        var strKey = strImpact + this.keyDelimiter + strProbability + this.keyDelimiter + strStrengthOfControl;
        strKey = cleanKey(strKey);
        
        if(!this.riskRegisterConfigMap.containsKey(strKey))
            return null;
        else{
            var returnObject = this.riskRegisterConfigMap.get(strKey);
            
            return returnObject;
        }
    }
    
    function cleanKey(strValue){
        strValue = strValue.replace(" ", "");
        
        return strValue.toLowerCase();
    }
    
    function getSheetByName(xlsConfigWorkbook, sheetName){
        var listSheets = xlsConfigWorkbook.getSheets();
        
        for(var i=0; i < listSheets.length; i++){
            if(listSheets[i].getName().equals(sheetName))
                return listSheets[i];
        }
        
        throw "Sheet with name: '" + sheetName + "' could not be found!";
    }
}


function ADSHelper() {

    //Read an XML file from ADS
    //Returns the XLS Workbook object to be able to read the file
    this.getXLSDocumentFromADS = function(p_adsFolderName, p_adsFileName, p_documentTitle){
        var adsReport = Context.getComponent("ADS")
    
        var repository = adsReport.getADSRepository("portal");
        var rootFolder = repository.getRootFolder();
        var folderName = p_adsFolderName;
        var adsFolder = repository.getFolder(rootFolder, folderName);
        
        var oDocument = repository.getDocument(adsFolder, p_documentTitle, p_adsFileName);
        
        var byteContent = this.readBytesFromInputStream(oDocument.getDocumentContent());
        var xlsWorkbook = Context.getExcelReader(byteContent);
        
        return xlsWorkbook;
    }
    
    // Upload XML Document to ADS    
    this.uploadXMLDocumentToADS = function(p_XMLOutputObject, p_adsFolderName, p_adsFileName, p_documentTitle, p_documentDescription) {
        var adsReport = Context.getComponent("ADS"); 
    
        var repository = adsReport.getADSRepository("portal")
        var rootFolder = repository.getRootFolder();
        var folderName = "Dashboarding\\" + p_adsFolderName;
        var adsFolder = repository.getFolder(rootFolder, folderName);
        if (!adsFolder) 
            adsFolder = repository.createFolder(rootFolder, folderName);
    
        var myDocInfo = repository.createDocumentMetaInfo(p_documentTitle, p_adsFileName, p_documentDescription);
        var contentByteArray = p_XMLOutputObject.getDocumentContent();
        var document = repository.createAndOverwriteExistingDocument(adsFolder, myDocInfo, new java.io.ByteArrayInputStream(contentByteArray));
    }
    
    //Read an XML file from ADS
    //Returns the XMLOutputObject to be able to write to the returned XML object
    this.getXMLDocumentFromADS = function(p_adsFolderName, p_adsFileName, p_documentTitle){
        var adsReport = Context.getComponent("ADS")
    
        var repository = adsReport.getADSRepository("portal");
        var rootFolder = repository.getRootFolder();
        var folderName = "Dashboarding\\" + p_adsFolderName;
        var adsFolder = repository.getFolder(rootFolder, folderName);
        
        var oDocument = repository.getDocument(adsFolder, p_documentTitle, p_adsFileName);
        
        var byteContent = this.readBytesFromInputStream(oDocument.getDocumentContent());
        var oXMLReader = Context.getXMLParser(byteContent);
        
        var returnXMLDocument = Context.createXMLOutputObject(p_adsFileName, oXMLReader.getDocument())
        return returnXMLDocument;
    }
    
    this.readBytesFromInputStream = function(inputStream){
        var bos = new java.io.ByteArrayOutputStream();
    
        var next = inputStream.read();
        while (next > -1) {
            bos.write(next);
            next = inputStream.read();
        }
        
        bos.flush();
        var result = bos.toByteArray();
        bos.close();
        
        return result;
    }
}

function CountrySiteMap(strFilenameWithExtension, strSheetName){

    this.intCountryColumn = 0;
    this.intSiteColumn = 1;   
    this.countrySiteMap = new java.util.HashMap();

    var xlsData = Context.getFile(strFilenameWithExtension, Constants.LOCATION_SCRIPT);
    var xlsConfigWorkbook = Context.getExcelReader(xlsData);
    var xlsConfigSheet = getSheetByName(xlsConfigWorkbook, strSheetName);
    
    //Parse Configuration sheet
    var listXlsRows = xlsConfigSheet.getRows();
    
    //get country list
    var country = new Array()
    for(var i=0; i < listXlsRows.length; i++){
        var strFirstCellValue = listXlsRows[i].getCellAt(this.intCountryColumn).getCellValue().trim();         
        if(!strFirstCellValue.equals("") && !strFirstCellValue.equals("Country")){
            country.push(strFirstCellValue)
        }       
    }
    
    country = ArisData.Unique(country)
    this.countrySiteMap.put("Please select", ["Please select"])
    for(var i=0; i < country.length; i++){
        var tempSiteArray = new Array()
        tempSiteArray.push("Please select")
        this.countrySiteMap.put(country[i].toString(), tempSiteArray)       
    }
    
    for(var i=0; i < listXlsRows.length; i++){
        var strFirstCellValue = listXlsRows[i].getCellAt(this.intCountryColumn).getCellValue().trim();
        var strSecondCellValue = listXlsRows[i].getCellAt(this.intSiteColumn).getCellValue().trim();
        
        if(!strFirstCellValue.equals("") && !strSecondCellValue.equals("") && !strFirstCellValue.equals("Country") && !strSecondCellValue.equals("Site")){           
            var tempSiteArray = this.countrySiteMap.get(strFirstCellValue)
            tempSiteArray.push(strSecondCellValue)
            this.countrySiteMap.put(strFirstCellValue.toString(), tempSiteArray)      
        }
    }
   
    this.getSiteList = function(strCountry){
       if(strCountry != "")
       return this.countrySiteMap.get(strCountry)       
    }

        function getSheetByName(xlsConfigWorkbook, sheetName){
        var listSheets = xlsConfigWorkbook.getSheets();
        
        for(var i=0; i < listSheets.length; i++){
            if(listSheets[i].getName().equals(sheetName))
                return listSheets[i];
        }
        
        throw "Sheet with name: '" + sheetName + "' could not be found!";
    }
}