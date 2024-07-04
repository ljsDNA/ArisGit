var g_oDatabase = ArisData.getActiveDatabase();
var currentLng = Context.getSelectedLanguage();
var oUser = ArisData.getActiveUser();

/* CONSTANTS */
var c_requestTypeExistingDocument = 0;
var c_requestTypeNewDocument = 1;
var c_requestTypeArchiveDocument = 2;

var c_documentCreationFolder = "Main group/Library/Technical terms/0. New proposed documents";
var c_documentCreationFolderSecret = "Main group/Library/Technical terms/2. Secret/2.0 New proposed documents/";
var c_documentPublishedFolder = "Main group/Library/Technical terms/1. Published";
var c_documentPublishedFolderSecret = "Main group/Library/Technical terms/2. Secret/2.1 Published";

var c_riskRegisterObjectGUID = "e18acc20-0b03-11ec-51c7-d05099dfe77e"

//Load attribute type values for Metadata dialog dropdown controls
var listPossibleOwners = getPossibleValues(AT_NTT_DOC_OWNER);
var listPossibleScopes = getPossibleValues(AT_NTT_DOC_SCOPE);
var listPossibleTypes = getPossibleValues(AT_NTT_DOC_TYPE);
var listPossibleConfidentialityLevels = getPossibleValues(AT_NTT_DOC_CONFIDENTIALITY);
var listPossibleLanguages = getPossibleValues(AT_NTT_DOC_LANGUAGE);

//draft
var listPossibleStatuses = getPossibleValues(AT_NTT_RM_RISK_STATUS); 
var listPossibleExecutiveManager = getPossibleValues(AT_NTT_RM_EXEC_MGMT_OWNERSHIP);  
var listPossiblePrincipalRisk = getPossibleValues(AT_NTT_RM_PRINCIPAL_RISK_IMPACTED); 
var listPossibleSubRisk = getPossibleValues(AT_NTT_RM_SUB_RISK_CATEGORY);
var listPossibleRiskTrend = getPossibleValues(AT_NTT_RM_RISK_TREND);
var listPossibleGDCEMEACountry = getPossibleValues(AT_NTT_RM_GDC_EMEA_AFFECTED_COUNTRY);
var listPossibleGDCEMEASite = getPossibleValues(AT_NTT_RM_GDC_EMEA_AFFECTED_SITE);

var listPossibleRiskReach = getPossibleValues(AT_NTT_RM_RISK_REACH);
var listPossibleRiskImpact = getPossibleValues(AT_NTT_RM_RISK_IMPACT);
var listPossibleRiskProbability = getPossibleValues(AT_NTT_RM_RISK_PROBABILITY);
var listPossibleRiskStrengthOfControls = getPossibleValues(AT_NTT_RM_STRENGTH_OF_CONTROLS);

var listPossibleRiskTreatmentStrategy = getPossibleValues(AT_NTT_RM_RISK_TREATMENT_STRATEGY);
var listPossibleRiskCanBeResolved = getPossibleValues(AT_NTT_RM_CAN_THIS_BE_FIXED);
var listPossibleRiskMitigationStatus = getPossibleValues(AT_NTT_RM_MITIGATION_STATUS);







//SHOW DIALOG to select update Type: NEW or EXISTING RISK
var g_requestType = null;
g_requestType = Dialogs.showDialog(new requestTypeDialog(), Constants.DIALOG_TYPE_ACTION, "Update Existing or Upload New Risk?");

try{
    g_oDatabase = ArisData.openDatabase( g_oDatabase.Name(-1), "system", g_strSystemPassword, "dd838074-ac29-11d4-85b8-00005a4053ff", Context.getSelectedLanguage());
    
    if(g_requestType != null)
    {
        var strDialogTitle = "Update Existing Risk"; 
        if(g_requestType == c_requestTypeNewDocument)
            strDialogTitle = "Upload a New Risk";
        
        //SHOW MAIN DIALOG
        var dialogResult = Dialogs.showDialog(new mainUserDialog(), Constants.DIALOG_TYPE_WIZARD, strDialogTitle);
        
        if(dialogResult!= null && dialogResult.bResult == true)
        {
            createDocumentAndLogObject(dialogResult.mapSelectedAttributeValues);                               
        } 
    }
}
catch(ex){
    g_oDatabase.close();
    Dialogs.MsgBox("There was an issue running the report!");
}



function createDocumentAndLogObject(mapDialogValues)
{
    var dbVersionLogs = ArisData.openDatabase( "NTT Document Version Logs", "system", g_strSystemPassword, "dd838074-ac29-11d4-85b8-00005a4053ff", Context.getSelectedLanguage(), false);
    var oLogObject;
    
    if(dbVersionLogs!=null && dbVersionLogs.IsValid())
    {
        var oDocument = null;
        
        mapDialogValues.put(AT_NTT_INITIATOR, oUser.Name(-1));
        
        if(g_requestType == c_requestTypeExistingDocument)
        {
            //change existing document
            mapDialogValues.put(AT_NTT_REQUEST_TYPE, "Existing_document");
            
            var strDocumentGUID = mapDialogValues.get(AT_NTT_DOC_GUID);
            var oDocument = g_oDatabase.FindGUID(strDocumentGUID);
        }
        else
        {
            //create a new document
            mapDialogValues.put(AT_NTT_REQUEST_TYPE, "New_document");
            //Get entered name for the new document from the Map
            var strDocumentName = mapDialogValues.get(AT_NTT_DOC_NEW_TITLE);
            
            if(mapDialogValues.get(AT_NTT_DOC_NEW_CONFIDENTIALITY).equals("Secret"))
                oDocument = g_oDatabase.Group(c_documentCreationFolderSecret + mapDialogValues.get(AT_NTT_DOC_NEW_OWNER), -1).CreateObjDef(Constants.OT_TECH_TRM, strDocumentName, -1);
            else
                oDocument = g_oDatabase.Group(c_documentCreationFolder, -1).CreateObjDef(Constants.OT_TECH_TRM, strDocumentName, -1);
            
            oDocument.Attribute(Constants.AT_DESC, -1).setValue(mapDialogValues.get(AT_NTT_DOC_NEW_DESCRIPTION));
            oDocument.Attribute(AT_NTT_DOC_OWNER, -1).setValue(mapDialogValues.get(AT_NTT_DOC_NEW_OWNER));
            oDocument.Attribute(AT_NTT_DOC_SCOPE, -1).setValue(mapDialogValues.get(AT_NTT_DOC_NEW_SCOPE));
            oDocument.Attribute(AT_NTT_DOC_TYPE, -1).setValue(mapDialogValues.get(AT_NTT_DOC_NEW_TYPE));
            oDocument.Attribute(AT_NTT_DOC_CONFIDENTIALITY, -1).setValue(mapDialogValues.get(AT_NTT_DOC_NEW_CONFIDENTIALITY));
            oDocument.Attribute(AT_NTT_DOC_LANGUAGE, -1).setValue(mapDialogValues.get(AT_NTT_DOC_NEW_LANGUAGE));
            oDocument.Attribute(Constants.AT_MAJOR_VERSION, -1).setValue(0);
            oDocument.Attribute(Constants.AT_MINOR_VERSION, -1).setValue(0);
            
            mapDialogValues.put(AT_NTT_DOC_GUID, oDocument.GUID());
        }
        
        //Set reorg mark so that the Document is not picked up and reorganized even if it has 0 occurences
        oDocument.SetReorgMark(1);
        
        //Create proper folder in the Log object Database
        var listPath = new Array();
        listPath.push("Main group");
        listPath.push(oDocument.Name(-1));
        var oGroup = dbVersionLogs.Group(listPath, -1);
        if(oGroup == null || !oGroup.IsValid())
        {
            oGroup = dbVersionLogs.Group("Main group", -1).CreateChildGroup(oDocument.Name(-1), -1);
        }
        
        //Create new Log Object
        var currentLogCount = dbVersionLogs.RootGroup().ObjDefList(true, [Constants.OT_CASUALOBJ]).length;
        oLogObject = oGroup.CreateObjDef(Constants.OT_CASUALOBJ, oDocument.Name(-1), -1);
        oLogObject.Attribute(Constants.AT_NAME, -1).setValue((currentLogCount+1).toString());
        
        //Set entered new metadata values to Log Object
        var hmIterator = mapDialogValues.entrySet().iterator();
        while (hmIterator.hasNext())
        {
            var mapElement = hmIterator.next();
            var intAttributeID = parseInt(mapElement.getKey());
            
            oLogObject.Attribute(intAttributeID, -1).setValue(mapElement.getValue());
            
        }
        oLogObject.Attribute(AT_NTT_DOC_NAME,-1).setValue(oDocument.Name(-1));
        
        
        //Finally start the APG Process
        var apgComponent = Context.getComponent("Process");
        var apgRunResult = apgComponent.run(g_strUpdateDocumentVersionAPG, [oLogObject]);
        
        dbVersionLogs.close();
    }
    else
        Dialogs.MsgBox("Error happened opening the version log database!")
    
    return oLogObject;
}



///////////////////////////////////////////////////////////////////////////////////////////////////////
// First Dialog to get the the Request Type: New Risk or Update Existing Risk 
///////////////////////////////////////////////////////////////////////////////////////////////////////
function requestTypeDialog() {
    
    var oResult = null;
    
    this.getPages = function() {
        
         var dlgTemplateDocument = Dialogs.createNewDialogTemplate(350, 100, "Please select what do you intend to do?");
         dlgTemplateDocument.GroupBox(15, 20, 320, 100, "Update existing or upload a new Risk?");
         dlgTemplateDocument.OptionGroup("OPT_REQUEST_TYPE");
         dlgTemplateDocument.OptionButton(35, 35, 200, 15, "Update Existing Risk");
         dlgTemplateDocument.OptionButton(35, 60, 200, 15, "Upload a New Risk");
         //dlgTemplateDocument.OptionButton(35, 85, 200, 15, "Archive Document");
  
         
   
         //Check which pages should be showed based on the selected Function Type
         var listPagesToShow = [];
         listPagesToShow.push(dlgTemplateDocument);
         
         return listPagesToShow;
     
    }
    
    this.onClose = function(pageNumber, bOk)
     {
         if(bOk)
             oResult = this.dialog.getPage(0).getDialogElement( "OPT_REQUEST_TYPE" ).getValue();
     }
    
     
     this.getResult = function() {
        
        return oResult;
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// mainUserDialog 
///////////////////////////////////////////////////////////////////////////////////////////////////////
function returnDTO( mapSelectedAttributeValues, bResult )
{
    this.mapSelectedAttributeValues = mapSelectedAttributeValues;

    this.bResult = bResult;
}

function mainUserDialog() {

    var objResult;    
    
    //var contentApproversMap = new java.util.TreeMap();
    var operationalOwnershipMap = new java.util.TreeMap();
    
    //var finalApproversMap = new java.util.TreeMap();
    var personNotifiedMap = new java.util.TreeMap();
    
    var selectedDocumentsMap = new java.util.TreeMap();
    
    var pageIndexSelectDocument = 0;
    var pageIndexDocumentMetadata = 1;
    var pageIndexDocumentMetadata2 = 2;
    var pageIndexDocumentMetadata3 = 3; 
    var pageIndexAddApprovers = 4; //changed from 3 to 4
    var bMetadataPageFilledInitially = false;
    
    
    //Load data for User Selection Table
    var laUsersTableValues = new Array();
    var laSelectedUsersTableValues = new Array();
    //var laSelectedFinalApprovers = new Array();
    var laSelectedPersonNotified = new Array();
    
    var UMC = Context.getComponent("UMC");
    var listAllUsers = ArisData.Unique(UMC.getAllUsers().toArray());
    for(var i=0; i < listAllUsers.length; i++)
    {
        var laRowValues=new Array();
        laRowValues.push(listAllUsers[i].getLastName());
        laRowValues.push(listAllUsers[i].getFirstName());
        laRowValues.push(listAllUsers[i].getName());
        laRowValues.push(listAllUsers[i].getEmail());
       
        laUsersTableValues.push(laRowValues);
    }
    laUsersTableValues.sort();
    
    if(g_requestType != c_requestTypeNewDocument)
    {
        //Load data for Documents Table
        var laDocumentTableValues = new Array();
        
        //GET RISK OBJECTS
        var riskCategoryL0 = g_oDatabase.FindGUID(c_riskRegisterObjectGUID, Constants.CID_OBJDEF)     
        var listRiskObjects = new Array()     
        if(riskCategoryL0.IsValid()){
            //get L1 category
            var riskCategoryL1 = riskCategoryL0.getConnectedObjs([Constants.OT_RISK_CATEGORY], Constants.EDGES_OUT, [Constants.CT_BELONG_CAT])            
            //get L2 category
            for(var i=0; i < riskCategoryL1.length; i++){              
                var riskCategoryL2 = riskCategoryL1[i].getConnectedObjs([Constants.OT_RISK_CATEGORY], Constants.EDGES_OUT, [Constants.CT_BELONG_CAT])            
                //get risk objects
                for(var j=0; j < riskCategoryL2.length; j++){                 
                   var riskObjects = riskCategoryL2[j].getConnectedObjs([Constants.OT_RISK], Constants.EDGES_OUT, [Constants.CT_SUBS_1])
                   listRiskObjects = listRiskObjects.concat(riskObjects)
                }
            }       
        }
        
        //var listAllDocuments = g_oDatabase.Find(Constants.SEARCH_OBJDEF, [Constants.OT_TECH_TRM]);
        var listPublishedDocuments = g_oDatabase.Group(c_documentPublishedFolder, -1).ObjDefList(true, [Constants.OT_TECH_TRM]);
        var listPublishedSecretDocuments = g_oDatabase.Group(c_documentPublishedFolderSecret, -1).ObjDefList(true, [Constants.OT_TECH_TRM]);
        var listAllDocuments = listPublishedDocuments.concat(listPublishedSecretDocuments);
        
        listAllDocuments = listRiskObjects //TEMP
        
        for(var i=0; i < listAllDocuments.length; i++)
        {
            
            var laRowValues=new Array();
            laRowValues.push(listAllDocuments[i].Name(currentLng));
            laRowValues.push(listAllDocuments[i].Attribute(Constants.AT_DESC, currentLng).getValue());
            laRowValues.push(listAllDocuments[i].GUID());
    
            laDocumentTableValues.push(laRowValues);
        }
        laDocumentTableValues.sort();
    }
    
    
    this.getPages = function() {
        
         //1.Select Document Page
         if(g_requestType == c_requestTypeExistingDocument)
         {
             var dlgTemplateDocument = Dialogs.createNewDialogTemplate(850, 500, "Select Risk to update");
             dlgTemplateDocument.GroupBox(15, 20, 815, 65, "Information");
             dlgTemplateDocument.Text(35, 35, 600, 15, "Please select the risk to update using the search table below. ​Mandatory fields are marked with *!");
             dlgTemplateDocument.Text(35, 50, 600, 15, "After entering the description of the new version (description of the change in comparison with the previous");
             dlgTemplateDocument.Text(35, 65, 600, 15, " Version), please continue with \"Next\".");
      
             dlgTemplateDocument.GroupBox(15, 80 +15, 815, 280+15, "Select Risk to be updated:");
             dlgTemplateDocument.Text(35, 95 +15, 160, 15, "Search with Risk Name:", "txLblsearchDocument");
             dlgTemplateDocument.TextBox(195, 95+15, 220, 15, "Document_txtSearch",0);
             
             var laColumnHeaders=new Array();
             var laColumnWidths=[250,150,0];
             laColumnHeaders.push("Name");
             laColumnHeaders.push("Description");
             laColumnHeaders.push("GUID");
             dlgTemplateDocument.Table(35, 115+15, 400, 235, laColumnHeaders,null,laColumnWidths,"tblDocuments",Constants.TABLE_STYLE_DEFAULT);
             
             dlgTemplateDocument.Text(465, 115+15, 150, 15, "Select");
             dlgTemplateDocument.PushButton(455, 130 + 15, 50, 30, "<SYMBOL_ARROWRIGHT>", "Document" + "_btnAdd");
             
             dlgTemplateDocument.Text(525, 95+15, 150, 15, "Selected Risk: *", "lblSelectedDocument");
             dlgTemplateDocument.ListBox(525, 115 +15, 285, 30, [] , "Document_selection",0);
             
             dlgTemplateDocument.Text(525, 155+15, 160, 15, "Risk Description:");
             dlgTemplateDocument.TextBox(525, 170+15, 285, 35, "Document_currentDESC",1);
             
             dlgTemplateDocument.Text(525, 210+15, 160, 15, "Risk Version:");
             dlgTemplateDocument.TextBox(525, 225+15, 285, 15, "Document_currentVERSION",0);
             
             dlgTemplateDocument.Text(525, 250+15, 150, 15, "Occurs in Models:", "lblOccInProcesses");
             dlgTemplateDocument.ListBox(525, 265+15, 285, 85, [] , "Occ_selection",0);
             
             dlgTemplateDocument.GroupBox(15, 370+30, 815, 115, "Version Description");
             dlgTemplateDocument.Text(35, 385+30, 600, 15, "Please enter your description of the changes for new risk: *");
             dlgTemplateDocument.TextBox(35, 400+30, 400, 35, "Document_newversiondescription",1);
             
             /* dlgTemplateDocument.Text(525, 385+30, 200, 15, "Please indicate update type: *");
             dlgTemplateDocument.ComboBox(525, 400+30, 200, 25, [" ","Minor change", "Major change"], "Document_CHANGETYPE"); */
             
             dlgTemplateDocument.PushButton(525, 400 + 30, 50, 30, "<SYMBOL_ARROWRIGHT>", "Risk" + "_btnAddUserResponsible");
         }
         else
         {
             //Don't show the select Document search page in case of NEW Document
             pageIndexSelectDocument = -1;
             pageIndexDocumentMetadata = 0;
             pageIndexDocumentMetadata2 = 1;
             pageIndexDocumentMetadata3 = 2;
             //pageIndexDocumentMetadata3
             pageIndexAddApprovers = 3; //changed from 2 to 3
         }
         
         //2. Change Document Metadata - Page 1
         var strMetadataTitle = "Change Risk Metadata(1)";
         var strMetadataInfo1= "Please indicate if the risk metadata must be updated by checking the box above.";
         var strMetadataInfo2 = "Continue with the necessary update of the fields below and/or continue with \"Next\".​";
         if(g_requestType != c_requestTypeExistingDocument)
         {
             strMetadataTitle = "Enter Risk Metadata(1)";
             strMetadataInfo1 = "Please enter the required metadata for the new risk below.";
             strMetadataInfo2 = "After all information is entered, please go forward with 'Next' to define the pprovers.";
         }
 
         var dlgTemplateMetadata = Dialogs.createNewDialogTemplate(850, 500, strMetadataTitle);
         dlgTemplateMetadata.GroupBox(15, 20, 815, 50, "Information");
         dlgTemplateMetadata.Text(35, 35, 600, 15, strMetadataInfo1);
         dlgTemplateMetadata.Text(35, 50, 600, 15, strMetadataInfo2);
  
         dlgTemplateMetadata.GroupBox(15, 80, 815, 390, "Risk Metadata");
         dlgTemplateMetadata.CheckBox(35, 95, 780, 15 , "Please indicate if the risk metadata must be updated by checking this box.​", "CHKBOX_CHANGE_METADATA", 0);
         
         //draft
         dlgTemplateMetadata.Text(35, 130, 140, 15, "Risk ID:");
         dlgTemplateMetadata.TextBox(195, 130, 250, 15, "Risk_ID",0);
         
         dlgTemplateMetadata.Text(35, 155, 140, 15, "Status:");
         dlgTemplateMetadata.ComboBox(195, 155, 250, 25, listPossibleStatuses, "Risk_STATUS");
         
         dlgTemplateMetadata.Text(35, 180, 140, 15, "Closing Remarks:");
         dlgTemplateMetadata.TextBox(195, 180, 250, 40, "Risk_CLOSING_REMARKS",1);
         
         dlgTemplateMetadata.Text(35, 225, 140, 15, "Identified:");
         dlgTemplateMetadata.DateChooser(195, 225, 250, 15, "Risk_IDENTIFIED")
                
         dlgTemplateMetadata.Text(35, 250, 140, 15, "Risk identified by:");
         dlgTemplateMetadata.TextBox(195, 250, 250, 15, "Risk_IDENTIFIED_BY",0);

        dlgTemplateMetadata.Text(35, 275, 140, 15, "Executive manager ownership:");
        dlgTemplateMetadata.ComboBox(195, 275, 250, 25, listPossibleExecutiveManager, "Risk_EXECUTIVE_MANAGER");
        
        dlgTemplateMetadata.Text(35, 300, 140, 15, "Principal Risk:");
        dlgTemplateMetadata.ComboBox(195, 300, 250, 25, listPossiblePrincipalRisk, "Risk_PRINCIPAL_RISK");
        
        dlgTemplateMetadata.Text(35, 325, 140, 15, "Sub Risk:");
        dlgTemplateMetadata.ComboBox(195, 325, 250, 25, listPossibleSubRisk, "Risk_SUB_RISK");
        
        dlgTemplateMetadata.Text(35, 370, 140, 15, "Risk Category:");
        dlgTemplateMetadata.CheckBox(195, 350, 780, 15, "Strategic Risk", "Risk_STRATEGIC",2)
        dlgTemplateMetadata.CheckBox(195, 365, 780, 15, "Financial Risk", "Risk_FINANCIAL",2)
        dlgTemplateMetadata.CheckBox(195, 380, 780, 15, "Operational Risk", "Risk_OPERATIONAL",2)
        dlgTemplateMetadata.CheckBox(195, 395, 780, 15, "Compliance Risk", "Risk_COMPLIANCE",2)
        
        dlgTemplateMetadata.Text(35, 420, 140, 15, "Risk Trend:");
        dlgTemplateMetadata.ComboBox(195, 420, 250, 25, listPossibleRiskTrend, "Risk_RISK_TREND");
        
        
         // dlgTemplateMetadata.Text(35, 225, 140, 15, "Owner:");
         // dlgTemplateMetadata.ComboBox(195, 225, 250, 25, listPossibleOwners, "Document_OWNER");
         // 
         // dlgTemplateMetadata.Text(35, 260, 140, 15, "Scope:");
         // dlgTemplateMetadata.ComboBox(195, 260, 250, 25, listPossibleScopes, "Document_SCOPE");
         // 
         // dlgTemplateMetadata.Text(35, 295, 140, 15, "Type:");
         // dlgTemplateMetadata.ComboBox(195, 295, 250, 25, listPossibleTypes, "Document_TYPE");
         // 
         // dlgTemplateMetadata.Text(35, 330, 140, 15, "Confidentiality:");
         // dlgTemplateMetadata.ComboBox(195, 330, 250, 25, listPossibleConfidentialityLevels, "Document_CONFIDENTIALITY");
         // 
         // dlgTemplateMetadata.Text(35, 365, 140, 15, "Language:");
         // dlgTemplateMetadata.ComboBox(195, 365, 250, 25, listPossibleLanguages, "Document_LANGUAGE");
         
         dlgTemplateMetadata.Text(35, 445, 760, 45, "TXT_METADATA_MESSAGE");
         
         //3. Change Document Metadata - Page 2
         var strMetadataTitle2 = "Change Risk Metadata(2)";
         if(g_requestType != c_requestTypeExistingDocument)
         {
             strMetadataTitle2 = "Enter Risk Metadata(2)";
         }
 
         var dlgTemplateMetadata2 = Dialogs.createNewDialogTemplate(850, 500, strMetadataTitle2);
         dlgTemplateMetadata2.GroupBox(15, 20, 815, 50, "Information");
         dlgTemplateMetadata2.Text(35, 35, 600, 15, strMetadataInfo1);
         dlgTemplateMetadata2.Text(35, 50, 600, 15, strMetadataInfo2);
         
         dlgTemplateMetadata2.GroupBox(15, 80, 815, 390, "Document Metadata");
         
         
         //draft
         dlgTemplateMetadata2.Text(35, 130, 140, 15, "Risk Description:");
         dlgTemplateMetadata2.TextBox(195, 130, 250, 50, "Risk_DESCRIPTION",1);
         
         dlgTemplateMetadata2.Text(35, 190, 140, 15, "Risk Consequence(s):");
         dlgTemplateMetadata2.TextBox(195, 190, 250, 50, "Risk_CONSEQUENCES",1);
         
        dlgTemplateMetadata2.Text(35, 260, 140, 15, "Operational ownership:");
        dlgTemplateMetadata2.ComboBox(195, 260, 250, 25, ["TODO"], "Risk_OPERATIONAL_OWNERSHIP");
        
        dlgTemplateMetadata2.Text(35, 285, 140, 15, "GDC EMEA Country:");
        dlgTemplateMetadata2.ComboBox(195, 285, 250, 25, listPossibleGDCEMEACountry, "Risk_GDC_EMEA_COUNTRY");
        
        dlgTemplateMetadata2.Text(35, 310, 140, 15, "GDC EMEA Affected Site:");
        dlgTemplateMetadata2.ComboBox(195, 310, 250, 25, listPossibleGDCEMEASite, "Risk_GDC_EMEA_SITE"); 
        
        dlgTemplateMetadata2.Text(35, 335, 140, 15, "Corresponding building:");
        dlgTemplateMetadata2.TextBox(195, 335, 250, 15, "Risk_CORRESPONDING_BUILDING",0);
        
        dlgTemplateMetadata2.Text(35, 360, 140, 15, "Reach:");
        dlgTemplateMetadata2.ComboBox(195, 360, 250, 25, listPossibleRiskReach, "Risk_REACH");
        
        dlgTemplateMetadata2.Text(35, 385, 140, 15, "Impact:");
        dlgTemplateMetadata2.ComboBox(195, 385, 250, 25, listPossibleRiskImpact, "Risk_IMPACT");
        
        //COLOR BOX 
         dlgTemplateMetadata2.Text(515, 400, 140, 15, "Gross Risk (Inherent)");
         dlgTemplateMetadata2.Picture(470, 390, 40, 40, "PICTURE_ORANGE");
         dlgTemplateMetadata2.Picture(470, 390, 40, 40, "PICTURE_GREEN");
         dlgTemplateMetadata2.Picture(470, 390, 40, 40, "PICTURE_REDLIGHT");
         dlgTemplateMetadata2.Picture(470, 390, 40, 40, "PICTURE_REDDARK");
        
        dlgTemplateMetadata2.Text(35, 410, 140, 15, "Probability:");
        dlgTemplateMetadata2.ComboBox(195, 410, 250, 25, listPossibleRiskProbability, "Risk_PROBABILITY");
        
        dlgTemplateMetadata2.Text(35, 435, 140, 15, "Strength of Controls:");
        dlgTemplateMetadata2.ComboBox(195, 435, 250, 25, listPossibleRiskStrengthOfControls, "Risk_STRENGTH_OF_CONTROLS");
        
        dlgTemplateMetadata2.Text(35, 460, 760, 45, "TXT_METADATA_MESSAGE_2");
         
         //COLOR TEST 95
         //dlgTemplateMetadata2.CheckBox(35, 480, 780, 15 , "Test Farbscale​", "CHKBOX_TEST", 0);
         
         
         
         //4. Change Document Metadata - Page 3
         var strMetadataTitle3 = "Change Risk Metadata(3)";
         if(g_requestType != c_requestTypeExistingDocument)
         {
             strMetadataTitle3 = "Enter Risk Metadata(3)";
         }
 
         var dlgTemplateMetadata3 = Dialogs.createNewDialogTemplate(850, 500, strMetadataTitle3);
         dlgTemplateMetadata3.GroupBox(15, 20, 815, 50, "Information");
         dlgTemplateMetadata3.Text(35, 35, 600, 15, strMetadataInfo1);
         dlgTemplateMetadata3.Text(35, 50, 600, 15, strMetadataInfo2);
        
         dlgTemplateMetadata3.GroupBox(15, 80, 815, 390, "Document Metadata");
         
         
         //draft
        dlgTemplateMetadata3.Text(35, 130, 140, 15, "Treatment strategy:");
        dlgTemplateMetadata3.ComboBox(195, 130, 250, 25, listPossibleRiskTreatmentStrategy, "Risk_TREATMENT_STRATEGY");
        
        dlgTemplateMetadata3.Text(35, 155, 140, 15, "Can it be resolved:");
        dlgTemplateMetadata3.ComboBox(195, 155, 250, 25, listPossibleRiskCanBeResolved, "Risk_CAN_BE_RESOLVED");
        
         dlgTemplateMetadata3.Text(35, 180, 140, 15, "Mitigation Name:");
         dlgTemplateMetadata3.TextBox(195, 180, 250, 15, "Risk_MITIGATION_NAME",0);
         
        dlgTemplateMetadata3.Text(35, 205, 140, 15, "Mitigation Description:");
        dlgTemplateMetadata3.TextBox(195, 205, 250, 40, "Risk_MITIGATION_DESCRIPTION",1);  
        
         dlgTemplateMetadata3.Text(35, 250, 140, 15, "Mitigation Responsible:");
         dlgTemplateMetadata3.TextBox(195, 250, 250, 15, "Risk_MITIGATION_RESPONSIBLE",0);
         
        dlgTemplateMetadata3.Text(35, 275, 140, 15, "Estimated Mitigation Costs:");
         dlgTemplateMetadata3.TextBox(195, 275, 250, 15, "Risk_ESTIMATED_MTG_COSTS",0);
         
        dlgTemplateMetadata3.Text(35, 300, 140, 15, "Investment Committee Number:");
        dlgTemplateMetadata3.TextBox(195, 300, 250, 15, "Risk_INVEST_COM_NUM",0);
         
        dlgTemplateMetadata3.Text(35, 325, 140, 15, "Mitigation Status:");
        dlgTemplateMetadata3.ComboBox(195, 325, 250, 25, listPossibleRiskMitigationStatus, "Risk_MITIGATION_STATUS");
        
        dlgTemplateMetadata3.Text(35, 350, 140, 15, "Remarks:");
        dlgTemplateMetadata3.TextBox(195, 350, 250, 40, "Risk_REMARKS",1);  
         
         
         dlgTemplateMetadata3.Text(35, 420, 760, 45, "TXT_METADATA_MESSAGE_3");

         
         //5. Select Approvers Page
         var dlgTemplateAddApprowers = Dialogs.createNewDialogTemplate(850, 500, "Define Risk Responsibilities");
         dlgTemplateAddApprowers.GroupBox(15, 20, 815, 80, "Information");
         dlgTemplateAddApprowers.Text(35, 35, 600, 15, "Please define the \"Operational Ownership\" and the \"Persons to be notified\" for the new version.​");
         //dlgTemplateAddApprowers.Text(35, 50, 600, 15, "NOTE: \"Content Approver\" and \"Final Approver\" must not be the same persons!​ Only one \"Final Approver\" ​​");
         //dlgTemplateAddApprowers.Text(35, 65, 600, 15, "is allowed! In exceptional cases, more than one \"Content Approver\" may be required.");
        
         dlgTemplateAddApprowers.GroupBox(15, 80+30, 815, 390, "Define Responsibilities:");
         dlgTemplateAddApprowers.Text(35, 95+30, 160, 15, "Search with User Last Name:", "txLblsearchUser");
         dlgTemplateAddApprowers.TextBox(195, 95+30, 220, 15, "User_txtSearch",0);
         
         var laColumnHeaders=new Array();
         var laColumnWidths=[75, 75, 50, 100];
         laColumnHeaders.push("Last Name");
         laColumnHeaders.push("First Name");
         laColumnHeaders.push("Approver(s)");
         laColumnHeaders.push("Email");
         dlgTemplateAddApprowers.Table(35, 115+30, 400, 335, laColumnHeaders,null,laColumnWidths,"tblUsers",Constants.TABLE_STYLE_DEFAULT);
        
         //dlgTemplateAddApprowers.PushButton(455, 125+30, 50, 30, "<SYMBOL_ARROWRIGHT>", "ContentApprover" + "_btnAdd");
         //dlgTemplateAddApprowers.PushButton(455, 175+30, 50, 30, "<SYMBOL_ARROWLEFT>", "ContentApprover" + "_btnDelete");
         
         dlgTemplateAddApprowers.PushButton(455, 125+30, 50, 30, "<SYMBOL_ARROWRIGHT>", "OperationalOwnership" + "_btnAdd");
         dlgTemplateAddApprowers.PushButton(455, 175+30, 50, 30, "<SYMBOL_ARROWLEFT>", "OperationalOwnership" + "_btnDelete");
         
         //dlgTemplateAddApprowers.Text(525, 95+30, 300, 15, "Content Approver(s) (AT LEAST 1 User):", "lblSelectedContentApprovers");
         //dlgTemplateAddApprowers.ListBox(525, 115+30, 285, 100, [] , "ContentApprover_selection",0);
         
         dlgTemplateAddApprowers.Text(525, 95+30, 300, 15, "Operational Ownership:", "lblSelectedOperationalOwnerships");
         dlgTemplateAddApprowers.ListBox(525, 115+30, 285, 100, [] , "OperationalOwnership_selection",0);
         
         
         //dlgTemplateAddApprowers.PushButton(455, 270+30, 50, 30, "<SYMBOL_ARROWRIGHT>", "FinalApprover" + "_btnAdd");
         //dlgTemplateAddApprowers.PushButton(455, 320+30, 50, 30, "<SYMBOL_ARROWLEFT>", "FinalApprover" + "_btnDelete");
         
         dlgTemplateAddApprowers.PushButton(455, 270+30, 50, 30, "<SYMBOL_ARROWRIGHT>", "PersonNotified" + "_btnAdd");
         dlgTemplateAddApprowers.PushButton(455, 320+30, 50, 30, "<SYMBOL_ARROWLEFT>", "PersonNotified" + "_btnDelete");
         
         //dlgTemplateAddApprowers.Text(525, 270+30, 300, 15, "Final Approver (ONLY 1 User):", "lblSelectedFinalApprovers");
         //dlgTemplateAddApprowers.ListBox(525, 290+30, 285, 60, [] , "FinalApprover_selection",0);
         
         dlgTemplateAddApprowers.Text(525, 270+30, 300, 15, "Person to be notified:", "lblSelectedPersonNotified");
         dlgTemplateAddApprowers.ListBox(525, 290+30, 285, 60, [] , "PersonNotified_selection",0);
         
         
   
         //Check which pages should be showed
         var listPagesToShow = [];
         
         if(g_requestType == c_requestTypeExistingDocument)
            listPagesToShow.push(dlgTemplateDocument);
         listPagesToShow.push(dlgTemplateMetadata);
         listPagesToShow.push(dlgTemplateMetadata2);
         listPagesToShow.push(dlgTemplateMetadata3);
         listPagesToShow.push(dlgTemplateAddApprowers);
         
         
         return listPagesToShow;
     
    }
    
    this.init = function(aPages) {
        
        var oOrangePicData = Context.getFile("Orange.png", Constants.LOCATION_SCRIPT);
        var oGreenPicData = Context.getFile("Green.png", Constants.LOCATION_SCRIPT);
        var oRedLightPicData = Context.getFile("RedLight.png", Constants.LOCATION_SCRIPT);
        var oRedDarkData = Context.getFile("RedDark.png", Constants.LOCATION_SCRIPT);
        aPages[pageIndexDocumentMetadata2].getDialogElement( "PICTURE_ORANGE" ).setPicture(oOrangePicData, "png");
        aPages[pageIndexDocumentMetadata2].getDialogElement( "PICTURE_GREEN" ).setPicture(oGreenPicData, "png");
        aPages[pageIndexDocumentMetadata2].getDialogElement( "PICTURE_REDLIGHT" ).setPicture(oRedLightPicData, "png");
        aPages[pageIndexDocumentMetadata2].getDialogElement( "PICTURE_REDDARK" ).setPicture(oRedDarkData, "png");
        
        aPages[pageIndexDocumentMetadata2].getDialogElement( "PICTURE_ORANGE" ).setVisible(false);
        aPages[pageIndexDocumentMetadata2].getDialogElement( "PICTURE_GREEN" ).setVisible(false);
        aPages[pageIndexDocumentMetadata2].getDialogElement( "PICTURE_REDLIGHT" ).setVisible(false);
        aPages[pageIndexDocumentMetadata2].getDialogElement( "PICTURE_REDDARK" ).setVisible(false);
        
        //draft
        aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_STRATEGIC" ).setChecked(null);
        aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_FINANCIAL" ).setChecked(null);
        aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_OPERATIONAL" ).setChecked(null);
        aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_COMPLIANCE" ).setChecked(null);
        
        if(g_requestType == c_requestTypeExistingDocument)
        {
            aPages[pageIndexSelectDocument].getDialogElement( "tblDocuments" ).setItems(laDocumentTableValues);
            aPages[pageIndexSelectDocument].getDialogElement( "Occ_selection" ).setEnabled(false);
            aPages[pageIndexSelectDocument].getDialogElement( "Document_currentDESC" ).setEnabled(false);
            aPages[pageIndexSelectDocument].getDialogElement( "Document_currentVERSION" ).setEnabled(false);

            
            //page 1
            aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_ID" ).setEnabled(false);
            aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_STATUS" ).setEnabled(false);
            aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_CLOSING_REMARKS" ).setEnabled(false);
            aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_IDENTIFIED" ).setEnabled(false);
            aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_IDENTIFIED_BY" ).setEnabled(false);
            aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_EXECUTIVE_MANAGER" ).setEnabled(false);
            aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_PRINCIPAL_RISK" ).setEnabled(false);
            aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_SUB_RISK" ).setEnabled(false);
            aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_STRATEGIC" ).setEnabled(false);
            aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_FINANCIAL" ).setEnabled(false);
            aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_OPERATIONAL" ).setEnabled(false);
            aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_COMPLIANCE" ).setEnabled(false);
            aPages[pageIndexDocumentMetadata].getDialogElement( "Risk_RISK_TREND" ).setEnabled(false);
            
            //page 2
        aPages[pageIndexDocumentMetadata2].getDialogElement( "Risk_DESCRIPTION" ).setEnabled(false);
        aPages[pageIndexDocumentMetadata2].getDialogElement( "Risk_CONSEQUENCES" ).setEnabled(false);  
        aPages[pageIndexDocumentMetadata2].getDialogElement( "Risk_OPERATIONAL_OWNERSHIP" ).setEnabled(false);   
        aPages[pageIndexDocumentMetadata2].getDialogElement( "Risk_GDC_EMEA_COUNTRY" ).setEnabled(false);      
        aPages[pageIndexDocumentMetadata2].getDialogElement( "Risk_GDC_EMEA_SITE" ).setEnabled(false);       
        aPages[pageIndexDocumentMetadata2].getDialogElement( "Risk_CORRESPONDING_BUILDING" ).setEnabled(false);     
        aPages[pageIndexDocumentMetadata2].getDialogElement( "Risk_REACH" ).setEnabled(false);
        aPages[pageIndexDocumentMetadata2].getDialogElement( "Risk_IMPACT" ).setEnabled(false);
        aPages[pageIndexDocumentMetadata2].getDialogElement( "Risk_PROBABILITY" ).setEnabled(false);   
        aPages[pageIndexDocumentMetadata2].getDialogElement( "Risk_STRENGTH_OF_CONTROLS" ).setEnabled(false);
        
                //page 3
        aPages[pageIndexDocumentMetadata3].getDialogElement( "Risk_TREATMENT_STRATEGY" ).setEnabled(false);
        aPages[pageIndexDocumentMetadata3].getDialogElement( "Risk_CAN_BE_RESOLVED" ).setEnabled(false);     
        aPages[pageIndexDocumentMetadata3].getDialogElement( "Risk_MITIGATION_NAME" ).setEnabled(false);        
        aPages[pageIndexDocumentMetadata3].getDialogElement( "Risk_MITIGATION_DESCRIPTION" ).setEnabled(false);     
        aPages[pageIndexDocumentMetadata3].getDialogElement( "Risk_MITIGATION_RESPONSIBLE" ).setEnabled(false);        
        aPages[pageIndexDocumentMetadata3].getDialogElement( "Risk_ESTIMATED_MTG_COSTS" ).setEnabled(false);         
        aPages[pageIndexDocumentMetadata3].getDialogElement( "Risk_INVEST_COM_NUM" ).setEnabled(false);
        aPages[pageIndexDocumentMetadata3].getDialogElement( "Risk_MITIGATION_STATUS" ).setEnabled(false);      
        aPages[pageIndexDocumentMetadata3].getDialogElement( "Risk_REMARKS" ).setEnabled(false);
            
            
            aPages[pageIndexAddApprovers].getDialogElement( "tblUsers" ).setItems(laUsersTableValues);
        }
        else if(g_requestType == c_requestTypeNewDocument)
        {
            aPages[pageIndexDocumentMetadata].getDialogElement( "CHKBOX_CHANGE_METADATA" ).setChecked(true);
            aPages[pageIndexDocumentMetadata].getDialogElement( "CHKBOX_CHANGE_METADATA" ).setVisible(false);
            aPages[pageIndexAddApprovers].getDialogElement( "tblUsers" ).setItems(laUsersTableValues);
        }
                               
    }
    
    //********************************************************************
    //*****  Action Handlers - SELECT DOCUMENT
    //********************************************************************
    this.Document_txtSearch_changed = function() {
        this.executeSearch(this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Document_txtSearch"), laDocumentTableValues, this.dialog.getPage(pageIndexSelectDocument).getDialogElement("tblDocuments"), 0);
    };
    
    this.Document_btnAdd_pressed = function() {
        selectedDocumentsMap.clear();
        this.dialog.getPage(pageIndexSelectDocument).getDialogElement( "Occ_selection" ).setItems(new Array());
        
        if(this.addToSelection(this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Document_selection"), this.dialog.getPage(pageIndexSelectDocument).getDialogElement("tblDocuments"), selectedDocumentsMap, pageIndexSelectDocument))
        {
            
            try{
                var strDocumentGUID = selectedDocumentsMap.values().toArray()[0];
                var oDocument = g_oDatabase.FindGUID(strDocumentGUID);
                
                var listOccurances = oDocument.OccList();
                var occurancesArray = new Array();
                for each(var oDocOcc in listOccurances)
                {
                    occurancesArray.push(oDocOcc.Model().Name(currentLng));
                }
                this.dialog.getPage(pageIndexSelectDocument).getDialogElement( "Occ_selection" ).setItems(occurancesArray);
                
                this.dialog.getPage(pageIndexSelectDocument).getDialogElement( "Document_currentDESC" ).setText(oDocument.Attribute(Constants.AT_DESC, currentLng).getValue());
                
                var strMajorVersion = oDocument.Attribute(Constants.AT_MAJOR_VERSION, currentLng).getValue();
                if(strMajorVersion.equals(""))
                    strMajorVersion = "1";
                var strMinorVersion = oDocument.Attribute(Constants.AT_MINOR_VERSION, currentLng).getValue();
                if(strMinorVersion.equals(""))
                    strMinorVersion = "0";
                this.dialog.getPage(pageIndexSelectDocument).getDialogElement( "Document_currentVERSION" ).setText(strMajorVersion + "." + strMinorVersion);
                
            }
            catch(ex)
            {}
        }
    };
    
    this.Risk_btnAddUserResponsible_pressed = function() {
    }
    
    //********************************************************************
    //*****  Action Handlers - DOCUMENT METADATA PAGE 1
    //********************************************************************
     this.CHKBOX_CHANGE_METADATA_selChanged = function(newSelection) {
          
         if(newSelection == 0)
         {
             /* this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement("Document_TITLE").setEnabled(false);
             this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement("Document_DESC").setEnabled(false);
             this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement("Document_OWNER").setEnabled(false);
             this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement("Document_SCOPE").setEnabled(false);
             this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement("Document_CONFIDENTIALITY").setEnabled(false);
             this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement("Document_LANGUAGE").setEnabled(false);
             this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement("Document_TYPE").setEnabled(false); */
             
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_ID" ).setEnabled(false);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_STATUS" ).setEnabled(false);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_CLOSING_REMARKS" ).setEnabled(false);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_IDENTIFIED" ).setEnabled(false);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_IDENTIFIED_BY" ).setEnabled(false);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_EXECUTIVE_MANAGER" ).setEnabled(false);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_PRINCIPAL_RISK" ).setEnabled(false);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_SUB_RISK" ).setEnabled(false);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_STRATEGIC" ).setEnabled(false);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_FINANCIAL" ).setEnabled(false);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_OPERATIONAL" ).setEnabled(false);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_COMPLIANCE" ).setEnabled(false);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_RISK_TREND" ).setEnabled(false);
            
            //page 2
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_DESCRIPTION" ).setEnabled(false);
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_CONSEQUENCES" ).setEnabled(false);  
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_OPERATIONAL_OWNERSHIP" ).setEnabled(false);   
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_GDC_EMEA_COUNTRY" ).setEnabled(false);      
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_GDC_EMEA_SITE" ).setEnabled(false);       
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_CORRESPONDING_BUILDING" ).setEnabled(false);     
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_REACH" ).setEnabled(false);
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_IMPACT" ).setEnabled(false);
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_PROBABILITY" ).setEnabled(false);   
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_STRENGTH_OF_CONTROLS" ).setEnabled(false);
        
        //page 3
         this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_TREATMENT_STRATEGY" ).setEnabled(false);
        this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_CAN_BE_RESOLVED" ).setEnabled(false);     
         this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_MITIGATION_NAME" ).setEnabled(false);        
        this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_MITIGATION_DESCRIPTION" ).setEnabled(false);     
         this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_MITIGATION_RESPONSIBLE" ).setEnabled(false);        
        this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_ESTIMATED_MTG_COSTS" ).setEnabled(false);         
        this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_INVEST_COM_NUM" ).setEnabled(false);
        this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_MITIGATION_STATUS" ).setEnabled(false);      
        this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_REMARKS" ).setEnabled(false);
            
         }
         else
         {
            //this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_ID" ).setEnabled(true); //DISABLE Risk ID element as it is generated by script
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_STATUS" ).setEnabled(true);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_CLOSING_REMARKS" ).setEnabled(true);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_IDENTIFIED" ).setEnabled(true);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_IDENTIFIED_BY" ).setEnabled(true);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_EXECUTIVE_MANAGER" ).setEnabled(true);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_PRINCIPAL_RISK" ).setEnabled(true);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_SUB_RISK" ).setEnabled(true);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_STRATEGIC" ).setEnabled(true);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_FINANCIAL" ).setEnabled(true);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_OPERATIONAL" ).setEnabled(true);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_COMPLIANCE" ).setEnabled(true);
            this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_RISK_TREND" ).setEnabled(true);
            
            //page 2
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_DESCRIPTION" ).setEnabled(true);
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_CONSEQUENCES" ).setEnabled(true);  
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_OPERATIONAL_OWNERSHIP" ).setEnabled(true);   
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_GDC_EMEA_COUNTRY" ).setEnabled(true);      
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_GDC_EMEA_SITE" ).setEnabled(true);       
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_CORRESPONDING_BUILDING" ).setEnabled(true);     
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_REACH" ).setEnabled(true);
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_IMPACT" ).setEnabled(true);
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_PROBABILITY" ).setEnabled(true);   
        this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_STRENGTH_OF_CONTROLS" ).setEnabled(true);
        
                //page 3
         this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_TREATMENT_STRATEGY" ).setEnabled(true);
        this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_CAN_BE_RESOLVED" ).setEnabled(true);     
         this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_MITIGATION_NAME" ).setEnabled(true);        
        this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_MITIGATION_DESCRIPTION" ).setEnabled(true);     
         this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_MITIGATION_RESPONSIBLE" ).setEnabled(true);        
        this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_ESTIMATED_MTG_COSTS" ).setEnabled(true);         
        this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_INVEST_COM_NUM" ).setEnabled(true);
        this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_MITIGATION_STATUS" ).setEnabled(true);      
        this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_REMARKS" ).setEnabled(true);
         }
    };
    
    //********************************************************************
    //*****  Action Handlers - DOCUMENT METADATA PAGE 2
    //********************************************************************
     this.Risk_IMPACT_selChanged = function(newSelection) {
                 
          var impactValue = listPossibleRiskImpact[newSelection]
          var probabilityValue = listPossibleRiskProbability[this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("Risk_PROBABILITY").getSelectedIndex()]          
          var colorCode = getColorCode(impactValue, probabilityValue)
          
          this.setColorBox(colorCode)

    };
    
    this.Risk_PROBABILITY_selChanged = function(newSelection) {
                    
          var impactValue = listPossibleRiskImpact[this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("Risk_IMPACT").getSelectedIndex()]
          var probabilityValue = listPossibleRiskProbability[newSelection]          
          var colorCode = getColorCode(impactValue, probabilityValue)
          
          this.setColorBox(colorCode)

    };
    
    //********************************************************************
    //*****  Action Handlers - DOCUMENT METADATA PAGE 2
    //********************************************************************
     this.CHKBOX_TEST_selChanged = function(newSelection) {
          
         if(newSelection == 0)
         {
             this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_GREEN").setVisible(false);
             this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_ORANGE").setVisible(true);
             
         }
         else
         {
             this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_GREEN").setVisible(true);
             this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_ORANGE").setVisible(false);
             
         }
    };
    
    //********************************************************************
    //*****  Action Handlers - ADD APPROVERS
    //********************************************************************
    this.User_txtSearch_changed = function() {
        this.executeSearch(this.dialog.getPage(pageIndexAddApprovers).getDialogElement("User_txtSearch"), laUsersTableValues, this.dialog.getPage(pageIndexAddApprovers).getDialogElement("tblUsers"), 0);
    };
    
    
    this.OperationalOwnership_btnAdd_pressed = function() {
        this.addUserToSelection(this.dialog.getPage(pageIndexAddApprovers).getDialogElement("OperationalOwnership_selection"),
        this.dialog.getPage(pageIndexAddApprovers).getDialogElement("tblUsers"),
        operationalOwnershipMap,
        laSelectedUsersTableValues);
        if(laSelectedUsersTableValues.length == 1)
        {
            this.dialog.getPage(pageIndexAddApprovers).getDialogElement("OperationalOwnership_btnAdd").setEnabled(false);
            this.dialog.getPage(pageIndexAddApprovers).getDialogElement("OperationalOwnership_btnDelete").setEnabled(true);
        }
        
    };
    
    // this.ContentApprover_btnAdd_pressed = function() {
        // this.addUserToSelection(this.dialog.getPage(pageIndexAddApprovers).getDialogElement("ContentApprover_selection"),
        // this.dialog.getPage(pageIndexAddApprovers).getDialogElement("tblUsers"),
        // contentApproversMap,
        // laSelectedUsersTableValues);
    // };

    this.OperationalOwnership_btnDelete_pressed = function() {
        if(laSelectedUsersTableValues.length == 0)
            return;
        this.deleteUserFromSelection(this.dialog.getPage(pageIndexAddApprovers).getDialogElement("OperationalOwnership_selection"),
        this.dialog.getPage(pageIndexAddApprovers).getDialogElement("tblUsers"),
        operationalOwnershipMap,
        laSelectedUsersTableValues);
        if(laSelectedUsersTableValues.length == 0)
        {
            this.dialog.getPage(pageIndexAddApprovers).getDialogElement("OperationalOwnership_btnAdd").setEnabled(true);
            this.dialog.getPage(pageIndexAddApprovers).getDialogElement("OperationalOwnership_btnDelete").setEnabled(false);
        }
        
    };
    
    // this.ContentApprover_btnDelete_pressed = function() {
        // if(laSelectedUsersTableValues.length == 0)
            // return;
        // this.deleteUserFromSelection(this.dialog.getPage(pageIndexAddApprovers).getDialogElement("ContentApprover_selection"),
        // this.dialog.getPage(pageIndexAddApprovers).getDialogElement("tblUsers"),
        // contentApproversMap,
        // laSelectedUsersTableValues);
    // };

    this.PersonNotified_btnAdd_pressed = function() {
        this.addUserToSelection(this.dialog.getPage(pageIndexAddApprovers).getDialogElement("PersonNotified_selection"),
        this.dialog.getPage(pageIndexAddApprovers).getDialogElement("tblUsers"),
        personNotifiedMap,
        laSelectedPersonNotified);
        if(laSelectedPersonNotified.length == 1)
        {   
            this.dialog.getPage(pageIndexAddApprovers).getDialogElement("PersonNotified_btnAdd").setEnabled(false);
            this.dialog.getPage(pageIndexAddApprovers).getDialogElement("PersonNotified_btnDelete").setEnabled(true);
        }
    };
    
    // this.FinalApprover_btnAdd_pressed = function() {
        // this.addUserToSelection(this.dialog.getPage(pageIndexAddApprovers).getDialogElement("FinalApprover_selection"),
        // this.dialog.getPage(pageIndexAddApprovers).getDialogElement("tblUsers"),
        // finalApproversMap,
        // laSelectedFinalApprovers);
        // if(laSelectedFinalApprovers.length == 1)
        // {
        // 
            // this.dialog.getPage(pageIndexAddApprovers).getDialogElement("FinalApprover_btnAdd").setEnabled(false);
            // this.dialog.getPage(pageIndexAddApprovers).getDialogElement("FinalApprover_btnDelete").setEnabled(true);
        // }
    // };
    
    this.PersonNotified_btnDelete_pressed = function() {
        this.deleteUserFromSelection(this.dialog.getPage(pageIndexAddApprovers).getDialogElement("PersonNotified_selection"),
        this.dialog.getPage(pageIndexAddApprovers).getDialogElement("tblUsers"),
        personNotifiedMap,
        laSelectedPersonNotified);
        if(laSelectedPersonNotified.length == 0)
        {
            this.dialog.getPage(pageIndexAddApprovers).getDialogElement("PersonNotified_btnAdd").setEnabled(true);
            this.dialog.getPage(pageIndexAddApprovers).getDialogElement("PersonNotified_btnDelete").setEnabled(false);
        }
    };
    
    // this.FinalApprover_btnDelete_pressed = function() {
        // this.deleteUserFromSelection(this.dialog.getPage(pageIndexAddApprovers).getDialogElement("FinalApprover_selection"),
        // this.dialog.getPage(pageIndexAddApprovers).getDialogElement("tblUsers"),
        // finalApproversMap,
        // laSelectedFinalApprovers);
        // if(laSelectedFinalApprovers.length == 0)
        // {
            // this.dialog.getPage(pageIndexAddApprovers).getDialogElement("FinalApprover_btnAdd").setEnabled(true);
            // this.dialog.getPage(pageIndexAddApprovers).getDialogElement("FinalApprover_btnDelete").setEnabled(false);
        // }
    // };

    
    
    //********************************************************************
    //*****  UTILITY DIALOG FUNCTIONS
    //********************************************************************
    
    this.setColorBox = function(colorCode){      
        if(colorCode == 0){ //green
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_GREEN").setVisible(true);
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_ORANGE").setVisible(false);
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_REDLIGHT").setVisible(false);
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_REDDARK").setVisible(false);
          }
          else if(colorCode == 1){ //orange
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_GREEN").setVisible(false);
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_ORANGE").setVisible(true);
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_REDLIGHT").setVisible(false);
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_REDDARK").setVisible(false);
          }
          else if(colorCode == 2){ //red light
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_GREEN").setVisible(false);
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_ORANGE").setVisible(false);
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_REDLIGHT").setVisible(true);
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_REDDARK").setVisible(false);
          }
          else if(colorCode == 3){ //red dark
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_GREEN").setVisible(false);
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_ORANGE").setVisible(false);
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_REDLIGHT").setVisible(false);
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_REDDARK").setVisible(true);
          }
          else{ //empty
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_GREEN").setVisible(false);
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_ORANGE").setVisible(false);
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_REDLIGHT").setVisible(false);
            this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement("PICTURE_REDDARK").setVisible(false);
          } 
    }
    
    this.executeSearch = function(oSearchBox, listUnfilteredValues, oTableDlgElement,intColumnIndexToSearch) {
        var lsFilterText = oSearchBox.getText();
        var laFilteredTableValues = new Array();
        
        listUnfilteredValues.forEach(function(row) {
            {
                if (row[intColumnIndexToSearch].toLowerCase().indexOf(lsFilterText.toLowerCase()) !== -1) {
                    laFilteredTableValues.push(row);
                }
            }
        });
        oTableDlgElement.setItems(laFilteredTableValues);
    }
    
    this.addToSelection = function(oSelectionBox, lTable, oSelectedMap, intPageIndex) {
        var selectedIndexs = lTable.getSelection();
        var tableRows = lTable.getItems();
        
        if (selectedIndexs != null && selectedIndexs.length > 0)
        {
            for each(var index in selectedIndexs){
                var tableRow = tableRows[index];
                if(tableRow != null){
                    if(intPageIndex == pageIndexSelectDocument)
                    {
                        var strKey = tableRow[0].toString();
                        var strValue = tableRow[2].toString();
                    }
                    
                    oSelectedMap.put(strKey, strValue);
                }
            }
            
            var listSelectionBoxValues = new Array();
            var itr = oSelectedMap.keySet().iterator();
            while(itr.hasNext()){
                listSelectionBoxValues.push(itr.next().toString());
            }
            oSelectionBox.setItems(listSelectionBoxValues); 
           
           return true;
        }
        
        return false;
    }
    this.addUserToSelection = function(oSelectionBox, lTable, oSelectedMap, listSelectedUsersArray) {
        var selectedIndexs = lTable.getSelection();
        var tableRows = lTable.getItems();
        
        if (selectedIndexs != null && selectedIndexs.length > 0)
        {
            for each(var index in selectedIndexs){
                var tableRow = tableRows[index];
                if(tableRow != null){
                    
                    var strKey = tableRow[0].toString() + ", " + tableRow[1].toString() + " (" + tableRow[2].toString() + ")";
                    var strValue = tableRow[2].toString();
                    
                    listSelectedUsersArray.push(tableRow);
                    this.removeFromTable(tableRow[2].toString(), laUsersTableValues);
                    lTable.setItems(laUsersTableValues);
                    
                    oSelectedMap.put(strKey, strValue);
                }
            }   
           
           var listSelectionBoxValues = new Array();
           for each(var oTableRow in listSelectedUsersArray)
           {
               listSelectionBoxValues.push(oTableRow[0].toString() + ", " + oTableRow[1].toString() + " (" + oTableRow[2].toString() + ")");
           }
           oSelectionBox.setItems(listSelectionBoxValues); 
           
           return true;
        }
        
        return false;
    }
    this.removeFromTable = function(strId, oTable)
    {
        var index = 0;
        for each(var oTableRow in oTable)
        {
            if(oTableRow[2].equals(strId))
            {
                oTable.splice(index, 1);
                return;
            }
            index++;
        }
    }
    
    this.deleteFromSelection = function(oSelectionBox, oSelectedMap) {
        var selectedUserIndexs = oSelectionBox.getSelection();
        var l_a_String_listItems = oSelectedMap.keySet();
        
        if(selectedUserIndexs != null && selectedUserIndexs.length > 0)
        {
            for each(var index in selectedUserIndexs)
            {
                var key = l_a_String_listItems.toArray()[index];
                if(key != null){
                    oSelectedMap.remove(key.toString());
                }
         
            }
            
            var itemsForSelection = new Array();
            var itr = oSelectedMap.keySet().iterator();
            while(itr.hasNext()){
               itemsForSelection.push(itr.next());
             }
            
           oSelectionBox.setItems(itemsForSelection); 
        }
        
    }
    this.deleteUserFromSelection = function(oSelectionBox, lTable, oSelectedMap, listSelectedUsersArray) {
        var selectedUserIndexs = oSelectionBox.getSelection();
        var l_a_String_listItems = oSelectedMap.keySet();
        
        if(selectedUserIndexs != null && selectedUserIndexs.length > 0)
        {
            for each(var index in selectedUserIndexs)
            {
                var key = l_a_String_listItems.toArray()[index];
                if(key != null){
                    oSelectedMap.remove(key.toString());
                }
                
                laUsersTableValues.push(listSelectedUsersArray[index]);
                laUsersTableValues.sort();
                listSelectedUsersArray.splice(index,1);
                lTable.setItems(laUsersTableValues);
         
            }
            var listSelectionBoxValues = new Array();
            for each(var oTableRow in listSelectedUsersArray)
            {
                listSelectionBoxValues.push(oTableRow[0].toString() + ", " + oTableRow[1].toString() + " (" + oTableRow[2].toString() + ")");
            }
            oSelectionBox.setItems(listSelectionBoxValues); 
           
           return true;
        }
        
        return false;
    }
    
    //********************************************************************
    //*****  DIALOG EVENT HANDLER FUNCTIONS
    //********************************************************************
    this.canGotoNextPage = function(pageNumber)
    {
        if(pageNumber==pageIndexSelectDocument)
        {
/*             if(g_requestType != c_requestTypeArchiveDocument && 
                pageNumber==pageIndexSelectDocument &&
                this.dialog.getPage(pageIndexSelectDocument).getDialogElement( "Document_CHANGETYPE" ).getValue() == 1) //Minor change
                return false; */
        
            if(selectedDocumentsMap.size()==0 || this.dialog.getPage(pageIndexSelectDocument).getDialogElement( "Document_newversiondescription" ).getText().equals(""))
                return false;
            else
                return true;
        }
        else
            return true;
    }
    this.canGotoPreviousPage = function(pageNumber)
    {
        return true;
    }
    
    this.onActivatePage = function(pageNumber)
    {
        if(!bMetadataPageFilledInitially && (pageNumber==pageIndexDocumentMetadata || pageNumber==pageIndexDocumentMetadata2 || pageNumber==pageIndexDocumentMetadata3))
        { 
            if(g_requestType == c_requestTypeExistingDocument)
            {
                var strDocumentGUID = selectedDocumentsMap.values().toArray()[0];
                var oDocument = g_oDatabase.FindGUID(strDocumentGUID);
                
                
               
                //Page 1 
                this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_ID" ).setText(oDocument.Attribute(AT_NTT_RM_RISK_ID, currentLng).getValue());
                
                var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_RM_RISK_STATUS, currentLng).getValue(), listPossibleStatuses);
                this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_STATUS" ).setSelection(intValue);
                
                this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_CLOSING_REMARKS" ).setText(oDocument.Attribute(AT_NTT_RM_CLOSING_REMARKS, currentLng).getValue());
                
                var dateValue = getDateValue(oDocument.Attribute(AT_NTT_RM_RISK_IDENTIFIED_ON, currentLng).getValue())
                this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_IDENTIFIED" ).setDate(dateValue);
                
                this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_IDENTIFIED_BY" ).setText(oDocument.Attribute(AT_NTT_RM_RISK_IDENTIFIED_BY, currentLng).getValue());
                
                var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_RM_EXEC_MGMT_OWNERSHIP, currentLng).getValue(), listPossibleExecutiveManager);
                this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_EXECUTIVE_MANAGER" ).setSelection(intValue);
                
                var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_RM_PRINCIPAL_RISK_IMPACTED, currentLng).getValue(), listPossiblePrincipalRisk);
                this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_PRINCIPAL_RISK" ).setSelection(intValue);
                
                var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_RM_SUB_RISK_CATEGORY, currentLng).getValue(), listPossibleSubRisk);
                this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_SUB_RISK" ).setSelection(intValue);
                
                var checkBoxValue = getCheckedValue(oDocument.Attribute(AT_NTT_RM_STRATEGIC_RISK, currentLng).getValue())
                this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_STRATEGIC" ).setChecked(checkBoxValue);
                
                var checkBoxValue = getCheckedValue(oDocument.Attribute(ATT_NTT_RM_FINANCIAL_RISK, currentLng).getValue())
                this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_FINANCIAL" ).setChecked(checkBoxValue);
                
                var checkBoxValue = getCheckedValue(oDocument.Attribute(ATT_NTT_RM_OPERATIONAL_RISK, currentLng).getValue())
                this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_OPERATIONAL" ).setChecked(checkBoxValue);
                
                var checkBoxValue = getCheckedValue(oDocument.Attribute(ATT_NTT_RM_COMPLIANCE_RISK, currentLng).getValue())
                this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_COMPLIANCE" ).setChecked(checkBoxValue);
                
                var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_RM_RISK_TREND, currentLng).getValue(), listPossibleRiskTrend);
                this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Risk_RISK_TREND" ).setSelection(intValue);
                
                //Page 2
                this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_DESCRIPTION" ).setText(oDocument.Attribute(AT_NTT_RM_RISK_DESCRIPTION, currentLng).getValue());
                this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_CONSEQUENCES" ).setText(oDocument.Attribute(AT_NTT_RM_RISK_CONSEQUENCES, currentLng).getValue());
                
                //TODO Operational ownership
                
                var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_RM_GDC_EMEA_AFFECTED_COUNTRY, currentLng).getValue(), listPossibleGDCEMEACountry);
                this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_GDC_EMEA_COUNTRY" ).setSelection(intValue);
                
                var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_RM_GDC_EMEA_AFFECTED_SITE, currentLng).getValue(), listPossibleGDCEMEASite);
                this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_GDC_EMEA_SITE" ).setSelection(intValue);
                
                this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_CORRESPONDING_BUILDING" ).setText(oDocument.Attribute(AT_NTT_RM_AFFECTED_BUILDING, currentLng).getValue());
                
                var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_RM_RISK_REACH, currentLng).getValue(), listPossibleRiskReach);
                this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_REACH" ).setSelection(intValue);
                
                var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_RM_RISK_REACH, currentLng).getValue(), listPossibleRiskReach);
                this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_REACH" ).setSelection(intValue);
                
                var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_RM_RISK_IMPACT, currentLng).getValue(), listPossibleRiskImpact);
                this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_IMPACT" ).setSelection(intValue);
                
                var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_RM_RISK_PROBABILITY, currentLng).getValue(), listPossibleRiskProbability);
                this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_PROBABILITY" ).setSelection(intValue);
                
                var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_RM_STRENGTH_OF_CONTROLS, currentLng).getValue(), listPossibleRiskStrengthOfControls);
                this.dialog.getPage(pageIndexDocumentMetadata2).getDialogElement( "Risk_STRENGTH_OF_CONTROLS" ).setSelection(intValue);
                
                //Page 3
                var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_RM_RISK_TREATMENT_STRATEGY, currentLng).getValue(), listPossibleRiskTreatmentStrategy);
                this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_TREATMENT_STRATEGY" ).setSelection(intValue);
                
                var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_RM_CAN_THIS_BE_FIXED, currentLng).getValue(), listPossibleRiskCanBeResolved);
                this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_CAN_BE_RESOLVED" ).setSelection(intValue);
                
                this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_MITIGATION_NAME" ).setText(oDocument.Attribute(AT_NTT_RM_MITIGATION_NAME, currentLng).getValue());     
                this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_MITIGATION_DESCRIPTION" ).setText(oDocument.Attribute(AT_NTT_RM_MITIGATION_DESCRIPTION, currentLng).getValue());       
                this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_MITIGATION_RESPONSIBLE" ).setText(oDocument.Attribute(AT_NTT_RM_MITIGATION_RESPONSIBLE, currentLng).getValue());
                this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_ESTIMATED_MTG_COSTS" ).setText(oDocument.Attribute(AT_NTT_RM_ESTIMATED_MITIGATION_COSTS, currentLng).getValue());   
                this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_INVEST_COM_NUM" ).setText(oDocument.Attribute(AT_NTT_RM_INVESTMENT_COMMITTEE_NUMBER, currentLng).getValue());   

                var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_RM_CAN_THIS_BE_FIXED, currentLng).getValue(), listPossibleRiskCanBeResolved);
                this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_CAN_BE_RESOLVED" ).setSelection(intValue);

                this.dialog.getPage(pageIndexDocumentMetadata3).getDialogElement( "Risk_REMARKS" ).setText(oDocument.Attribute(AT_NTT_RM_REMARKS, currentLng).getValue());  //DRAFT CHECK CLOSING REMARKS                   
                
                // this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_TITLE" ).setText(oDocument.Name(currentLng).split("-")[3]);
                // this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_DESC" ).setText(oDocument.Attribute(Constants.AT_DESC, currentLng).getValue());
                // var intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_DOC_OWNER, currentLng).getValue(), listPossibleOwners);
                // this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_OWNER" ).setSelection(intValue);
                // 
                // intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_DOC_SCOPE, currentLng).getValue(), listPossibleScopes);
                // this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_SCOPE" ).setSelection(intValue);
                // 
                // intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_DOC_TYPE, currentLng).getValue(), listPossibleTypes);
                // this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_TYPE" ).setSelection(intValue);
                // 
                // intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_DOC_CONFIDENTIALITY, currentLng).getValue(), listPossibleConfidentialityLevels);
                // this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_CONFIDENTIALITY" ).setSelection(intValue);
                // 
                // intValue = getSelectedIndexForValue(oDocument.Attribute(AT_NTT_DOC_LANGUAGE, currentLng).getValue(), listPossibleLanguages);
                // this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_LANGUAGE" ).setSelection(intValue);
                
                bMetadataPageFilledInitially = true;
            }
        }
        //draft color test
        if(pageNumber==pageIndexDocumentMetadata2){
                var strDocumentGUID = selectedDocumentsMap.values().toArray()[0];
                var oDocument = g_oDatabase.FindGUID(strDocumentGUID);
                               
          var impactValue = oDocument.Attribute(AT_NTT_RM_RISK_IMPACT, currentLng).getValue();
          var probabilityValue = oDocument.Attribute(AT_NTT_RM_RISK_PROBABILITY, currentLng).getValue();         
          var colorCode = getColorCode(impactValue, probabilityValue)
          
          this.setColorBox(colorCode)
          

        }
    }

     this.isInValidState = function( pageNumber )
     {
         if(pageNumber==pageIndexSelectDocument)
        {
            if(selectedDocumentsMap.size()==0 ||
                this.dialog.getPage(pageNumber).getDialogElement( "Document_newversiondescription" ).getText().equals(""))
                return false;
            else
                return true;
        }
        else if(pageNumber==pageIndexDocumentMetadata)
        {
            /* var selectedConfidentiality = listPossibleConfidentialityLevels[this.dialog.getPage(pageNumber).getDialogElement( "Document_CONFIDENTIALITY" ).getValue()];
            var selectedOwner = listPossibleOwners[this.dialog.getPage(pageNumber).getDialogElement( "Document_OWNER" ).getValue()];
            var selectedLanguage = listPossibleLanguages[this.dialog.getPage(pageNumber).getDialogElement( "Document_LANGUAGE" ).getValue()];
            var selectedScope = listPossibleScopes[this.dialog.getPage(pageNumber).getDialogElement( "Document_SCOPE" ).getValue()];
            var selectedType = listPossibleTypes[this.dialog.getPage(pageNumber).getDialogElement( "Document_TYPE" ).getValue()]; */
            
            //draft
            var selectedPossibleStatus = listPossibleStatuses[this.dialog.getPage(pageNumber).getDialogElement( "Risk_STATUS" ).getValue()];
            var selectedPossibleExecutiveManager = listPossibleExecutiveManager[this.dialog.getPage(pageNumber).getDialogElement("Risk_EXECUTIVE_MANAGER").getValue()];
            var selectedPossiblePrincipalRisk = listPossiblePrincipalRisk[this.dialog.getPage(pageNumber).getDialogElement("Risk_PRINCIPAL_RISK").getValue()]; 
            var selectedPossibleSubRisk = listPossibleSubRisk[this.dialog.getPage(pageNumber).getDialogElement("Risk_SUB_RISK").getValue()]; 
            var selectedPossibleRiskTrend = listPossibleRiskTrend[this.dialog.getPage(pageNumber).getDialogElement("Risk_RISK_TREND").getValue()]; 
            
/*             if( (selectedConfidentiality.equals("Please select") || selectedOwner.equals("Please select") || selectedLanguage.equals("Please select") ||
                selectedScope.equals("Please select") || selectedType.equals("Please select") || 
                this.dialog.getPage(pageNumber).getDialogElement( "Document_TITLE" ).getText().equals("")|| 
                this.dialog.getPage(pageNumber).getDialogElement( "Document_DESC" ).getText().equals(""))
                && this.dialog.getPage(pageNumber).getDialogElement( "CHKBOX_CHANGE_METADATA" ).isChecked()) */
            
            //draft
            if(selectedPossibleStatus.equals("Please select") || selectedPossibleExecutiveManager.equals("Please select") || selectedPossiblePrincipalRisk.equals("Please select") || selectedPossibleSubRisk.equals("Please select") 
                || selectedPossibleRiskTrend.equals("Please select") || this.dialog.getPage(pageNumber).getDialogElement( "Risk_STRATEGIC" ).isUndefined()|| this.dialog.getPage(pageNumber).getDialogElement( "Risk_FINANCIAL" ).isUndefined()
                || this.dialog.getPage(pageNumber).getDialogElement( "Risk_COMPLIANCE" ).isUndefined() || this.dialog.getPage(pageNumber).getDialogElement( "Risk_OPERATIONAL" ).isUndefined()
                || this.dialog.getPage(pageNumber).getDialogElement( "Risk_ID" ).getText().equals("") || this.dialog.getPage(pageNumber).getDialogElement( "Risk_CLOSING_REMARKS" ).getText().equals("")
                || this.dialog.getPage(pageNumber).getDialogElement( "Risk_IDENTIFIED_BY" ).getText().equals("") || this.dialog.getPage(pageNumber).getDialogElement( "Risk_IDENTIFIED" ).getDate().equals(""))
            { 
                this.dialog.getPage(pageNumber).getDialogElement( "TXT_METADATA_MESSAGE" ).setText("Please fill in all of the values!");
                return false;
            }
            else
            {
                this.dialog.getPage(pageNumber).getDialogElement( "TXT_METADATA_MESSAGE" ).setText("");
                return true;
            }
        }
        else if(pageNumber==pageIndexDocumentMetadata2) //PAGE 2 CHECK
        {
             //var selectedPossibleOperationalOwnership = listPossibleStatuses[this.dialog.getPage(pageNumber).getDialogElement( "Risk_OPERATIONAL_OWNERSHIP" ).getValue()];
              var selectedPossibleGDCEMEACountry = listPossibleStatuses[this.dialog.getPage(pageNumber).getDialogElement( "Risk_GDC_EMEA_COUNTRY" ).getValue()];
               var selectedPossibleGDCEMEASite = listPossibleStatuses[this.dialog.getPage(pageNumber).getDialogElement( "Risk_GDC_EMEA_SITE" ).getValue()];
                var selectedPossibleReach = listPossibleStatuses[this.dialog.getPage(pageNumber).getDialogElement( "Risk_REACH" ).getValue()];
                 var selectedPossibleImpact = listPossibleStatuses[this.dialog.getPage(pageNumber).getDialogElement( "Risk_IMPACT" ).getValue()];
                  var selectedPossibleProbability = listPossibleStatuses[this.dialog.getPage(pageNumber).getDialogElement( "Risk_PROBABILITY" ).getValue()];
                   var selectedPossibleStrengthOfControls = listPossibleStatuses[this.dialog.getPage(pageNumber).getDialogElement( "Risk_STRENGTH_OF_CONTROLS" ).getValue()];
                        
            //draft
            if(selectedPossibleGDCEMEACountry.equals("Please select") || selectedPossibleGDCEMEASite.equals("Please select") || selectedPossibleReach.equals("Please select")
                || selectedPossibleImpact.equals("Please select") || selectedPossibleProbability.equals("Please select") || selectedPossibleStrengthOfControls.equals("Please select") 
            || this.dialog.getPage(pageNumber).getDialogElement( "Risk_DESCRIPTION" ).getText().equals("") || this.dialog.getPage(pageNumber).getDialogElement( "Risk_CONSEQUENCES" ).getText().equals(""))
            { 
                this.dialog.getPage(pageNumber).getDialogElement( "TXT_METADATA_MESSAGE_2" ).setText("Please fill in all of the values!");
                return false;
            }
            else
            {
                this.dialog.getPage(pageNumber).getDialogElement( "TXT_METADATA_MESSAGE_2" ).setText("");
                return true;
            }
            
        }
                else if(pageNumber==pageIndexDocumentMetadata3) //PAGE 3 CHECK
        {
             //var selectedPossibleOperationalOwnership = listPossibleStatuses[this.dialog.getPage(pageNumber).getDialogElement( "Risk_OPERATIONAL_OWNERSHIP" ).getValue()];
              var selectedPossibleTreatmentStrategy = listPossibleStatuses[this.dialog.getPage(pageNumber).getDialogElement( "Risk_TREATMENT_STRATEGY" ).getValue()];
               var selectedPossibleCanBeResolved = listPossibleStatuses[this.dialog.getPage(pageNumber).getDialogElement( "Risk_CAN_BE_RESOLVED" ).getValue()];
                
                 
                        
            //draft
            if(selectedPossibleTreatmentStrategy.equals("Please select") || selectedPossibleCanBeResolved.equals("Please select"))
            { 
                this.dialog.getPage(pageNumber).getDialogElement( "TXT_METADATA_MESSAGE_3" ).setText("Please fill in all of the values!");
                return false;
            }
            else
            {
                this.dialog.getPage(pageNumber).getDialogElement( "TXT_METADATA_MESSAGE_3" ).setText("");
                return true;
            }
            
        }
        else
            return true;
     }
     
     this.canFinish = function( pageNumber ) {
        if(pageNumber==pageIndexAddApprovers)
        {
            if(laSelectedPersonNotified.length == 1 && laSelectedUsersTableValues.length > 0) //was laSelectedFinalApprovers changed to laSelectedPersonNotified
                return true;
            else
                return false;
        }        
        return false;
     }
        
        //MAP RESULTS DRAFT
     this.onClose = function(pageNumber, bOk)
     {
         var mapDialogResults = new java.util.HashMap();
         
         //Existing document
         if(g_requestType == c_requestTypeExistingDocument)
         {
             mapDialogResults.put(AT_NTT_DOC_GUID, selectedDocumentsMap.values().toArray()[0]);
             mapDialogResults.put(AT_NTT_DATABASE_NAME, g_oDatabase.Name(-1));
             mapDialogResults.put(AT_NTT_DOC_NEW_VERSION_DESCRIPTION, this.dialog.getPage(pageIndexSelectDocument).getDialogElement( "Document_newversiondescription" ).getText());
             
             var intChangeType = this.dialog.getPage(pageIndexSelectDocument).getDialogElement( "Document_CHANGETYPE" ).getValue();
             if(intChangeType == 1)
                mapDialogResults.put(AT_NTT_UPDATE_TYPE, "Minor change");
             else
                mapDialogResults.put(AT_NTT_UPDATE_TYPE, "Major change");
            
             if(intChangeType == 2)
             {
                 mapDialogResults.put(AT_NTT_DOC_METADATA_CHANGED, this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "CHKBOX_CHANGE_METADATA" ).isChecked());
                 mapDialogResults.put(AT_NTT_DOC_NEW_TITLE, this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_TITLE" ).getText());
                 mapDialogResults.put(AT_NTT_DOC_NEW_DESCRIPTION, this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_DESC" ).getText());
                 
                 mapDialogResults.put(AT_NTT_DOC_NEW_OWNER, listPossibleOwners[this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_OWNER" ).getValue()]);
                 mapDialogResults.put(AT_NTT_DOC_NEW_SCOPE, listPossibleScopes[this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_SCOPE" ).getValue()]);
                 mapDialogResults.put(AT_NTT_DOC_NEW_TYPE, listPossibleTypes[this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_TYPE" ).getValue()]);
                 mapDialogResults.put(AT_NTT_DOC_NEW_CONFIDENTIALITY, listPossibleConfidentialityLevels[this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_CONFIDENTIALITY" ).getValue()]);
                 mapDialogResults.put(AT_NTT_DOC_NEW_LANGUAGE, listPossibleLanguages[this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_LANGUAGE" ).getValue()]);
                 
                 
                 //Add approvers to result //CHANGE TO operationalOwnership is saved in laSelectedUsersTableValues
                 var listContentApproversUsernames = new Array();
                 var listContentApproverNames = new Array();
                 for each(var userRow in laSelectedUsersTableValues)
                 {
                     listContentApproversUsernames.push(userRow[2]);
                     listContentApproverNames.push(userRow[0] + " " + userRow[1]);
                 }
                 mapDialogResults.put(AT_NTT_DOC_CONTENT_APPROVERS, listContentApproversUsernames.join(";"));
                 mapDialogResults.put(AT_NTT_DOC_CONTENT_APPROVERNAMES, listContentApproverNames.join("\r\n"));
                 mapDialogResults.put(AT_NTT_DOC_FINAL_APPROVER, laSelectedFinalApprovers[0][2]); //change laSelectedFinalApprovers to laSelectedPersonNotified 
             }
             else
             {
                 mapDialogResults.put(AT_NTT_DOC_METADATA_CHANGED, "false");
                 mapDialogResults.put(AT_NTT_DOC_CONTENT_APPROVERS, "");
                 mapDialogResults.put(AT_NTT_DOC_CONTENT_APPROVERNAMES, "");
                 mapDialogResults.put(AT_NTT_DOC_FINAL_APPROVER, "arisservice");
             }
         }
         else if(g_requestType == c_requestTypeNewDocument)
         {
             //NEW Document upload
             mapDialogResults.put(AT_NTT_DOC_GUID, "");
             mapDialogResults.put(AT_NTT_DATABASE_NAME, g_oDatabase.Name(-1));
             mapDialogResults.put(AT_NTT_DOC_NEW_VERSION_DESCRIPTION, "Initial document version.");
             mapDialogResults.put(AT_NTT_UPDATE_TYPE, "Major change");
             
             mapDialogResults.put(AT_NTT_DOC_METADATA_CHANGED, this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "CHKBOX_CHANGE_METADATA" ).isChecked());
             mapDialogResults.put(AT_NTT_DOC_NEW_TITLE, this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_TITLE" ).getText());
             mapDialogResults.put(AT_NTT_DOC_NEW_DESCRIPTION, this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_DESC" ).getText());
             
             mapDialogResults.put(AT_NTT_DOC_NEW_OWNER, listPossibleOwners[this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_OWNER" ).getValue()]);
             mapDialogResults.put(AT_NTT_DOC_NEW_SCOPE, listPossibleScopes[this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_SCOPE" ).getValue()]);
             mapDialogResults.put(AT_NTT_DOC_NEW_TYPE, listPossibleTypes[this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_TYPE" ).getValue()]);
             mapDialogResults.put(AT_NTT_DOC_NEW_CONFIDENTIALITY, listPossibleConfidentialityLevels[this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_CONFIDENTIALITY" ).getValue()]);
             mapDialogResults.put(AT_NTT_DOC_NEW_LANGUAGE, listPossibleLanguages[this.dialog.getPage(pageIndexDocumentMetadata).getDialogElement( "Document_LANGUAGE" ).getValue()]);
             
             
             //Add approvers to result //CHANGE TO operationalOwnership is saved in laSelectedUsersTableValues
             var listContentApproversUsernames = new Array();
             var listContentApproverNames = new Array();
             for each(var userRow in laSelectedUsersTableValues)
             {
                 listContentApproversUsernames.push(userRow[2]);
                 listContentApproverNames.push(userRow[0] + " " + userRow[1]);
             }
             mapDialogResults.put(AT_NTT_DOC_CONTENT_APPROVERS, listContentApproversUsernames.join(";"));
             mapDialogResults.put(AT_NTT_DOC_CONTENT_APPROVERNAMES, listContentApproverNames.join("\r\n"));
             mapDialogResults.put(AT_NTT_DOC_FINAL_APPROVER, laSelectedFinalApprovers[0][2]); //change laSelectedFinalApprovers to laSelectedPersonNotified 
                
         }
         
         
         if(bOk==true)
         {
            objResult = new returnDTO(mapDialogResults, true);
         }
         else
         {
            objResult = new returnDTO(mapDialogResults, false);
         }
     }
     
     this.getResult = function() {
        
        return objResult;
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////
// HELPER FUNCTIONS 
///////////////////////////////////////////////////////////////////////////////////////////////////////
function getPossibleValues(intAttrType)
{
    var retArray = new Array();
  
    var listValueTypes = g_oFilter.AttrValueTypeNums(intAttrType);
    for each(var valueTypeNum in listValueTypes)
    {
        retArray.push(g_oFilter.AttrValueType(intAttrType, valueTypeNum));
    }
    if( intAttrType != AT_NTT_DOC_CONFIDENTIALITY)
    {
    retArray = retArray.sort();
    }
    
    if(g_requestType != c_requestTypeExistingDocument)
        retArray.unshift("Please select");
    return retArray;
}
function getSelectedIndexForValue(strValue, listArray)
{
    for(var i=0;i<=listArray.length-1;i++)
    {
        if(listArray[i].equals(strValue))
            return i;
    }
    return 0; //draft changed to 0 form -1
}

function getDateValue(dateStr){
    
    formatter = new java.text.SimpleDateFormat("MM/dd/yyyy");
    strdate = new Date(dateStr);
    strgenerationm = formatter.format(strdate);
    return strgenerationm
}

function getCheckedValue(checkStr){
    if(checkStr.toLowerCase() == "true")
        return true
    else if (checkStr.toLowerCase() == "false")
        return false
    else
        return null
}

function getColorCode(impactValue, probabilityValue){
    
    var impact = impactValue.toLowerCase()
    var probability = probabilityValue.toLowerCase()
    
    if(impact == "insignificant" && (probability == "unlikely" || probability == "less likely" || probability == "possible")){
     return 0 //green 
    }
    else if(impact == "insignificant" && (probability == "certain" || probability == "likely")){
     return 1 //orange
    }   
    else if(impact == "minor" && probability == "unlikely"){
     return 0 //green   
    }  
    else if(impact == "minor" && (probability == "less likely" || probability == "possible" || probability == "likely" || probability == "certain")){
     return 1 //orange
    }   
    else if(impact == "moderate" && (probability == "less likely" || probability == "unlikely")){
     return 1 //orange
    }    
    else if(impact == "moderate" && (probability == "possible" || probability == "likely" || probability == "certain")){
     return 2 //red light
    }    
    else if(impact == "major" && probability == "unlikely"){
     return 1 //orange
    }     
     else if(impact == "major" && (probability == "less likely" || probability == "possible")){
     return 2 //red light
     }    
     else if(impact == "major" && (probability == "likely" || probability == "certain")){
     return 3 //red dark
    }   
    else if(impact == "extreme" && (probability == "less likely" || probability == "unlikely")){
     return 2 //red light
    }   
    else if(impact == "extreme" && (probability == "possible" || probability == "likely" || probability == "certain")){
     return 3 //red dark
    }  
    else{
    return -1
    }
}
