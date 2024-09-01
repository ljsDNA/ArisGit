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

 // Report Configuration
const SHOW_DIALOGS_IN_CONNECT = false;   // Show dialogs in ARIS Connect - Default=false (BLUE-12274)

/****************************************************/

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

//Arrays description
/*
oObjOccs[] - array of functions occurrences

oObjOccs_Symbols[] - array of symbols of functions occurrences

SheetsInfoRows[]
    .Path  - stores Path to the model
    .ModelType - Model Type
    .ModelName - Model Name
    .Func_idx - contains function index in oObjOccs array
    .FuncName - name of funtion occurrence
    .FuncSymbol - symbol number of function occurrence
      These 3 arrays linked by indexes:
    .AspectList - contain array of aspect object occurrences
    .AspectLinks - contain array of array of link types between aspect object occurrences and functions
    .AspectTypes - contains array of bject occurrences type (string)

SheetsHeader[] - contain current aspect element object occurences
    .Item - stores object occurence
    .ItemName - stores item name
    .ItemType - stores type of item

structAspects[] - array of aspects
    [j] - contains array of structures (index = function index in oObjOccs array)
        .FuncOcc - occurrence of function
        .FuncName - name of funtion occurrence
        .FuncSymbol - symbol number of function occurrence
        .Path - Path
        .ModelType - Model Type
        .ModelName - Model Name
        .AspectList - contain array of aspect object occurrences
        .AspectLinks - contain link types between aspect object occurrences and functions
        .AspectTypes - contains object occurrences type (string)
*/


//------------------------------------------------------------------------------------------------------------------------
// Global constants
//------------------------------------------------------------------------------------------------------------------------
//Report context constants
var CTX_INVALID             = 0;                                                //non initialized report context
var CTX_GROUP_REPORT_FLAG   = 1;                                                //create model reports from selected groups and subgroups
var CTX_MODEL_REPORT_FLAG   = 2;                                                //create report from selected models

//Output constants
var OUTPUT_EXCEL_MIN_CELL   = 1;                                                //Excel minimum cell number
var OUTPUT_EXCEL_MAX_CELL   = 255;                                              //Excel maxumum cell number


//------------------------------------------------------------------------------------------------------------------------
// Dialog resources
//------------------------------------------------------------------------------------------------------------------------
//User Options dialog (global variable g_dlgUserOptions)
//Do not localize
var RES_CONTEXT_ListBox     = "DROP_LIST_BOX_CONTEXT";                          //drop list box: for context selection
var g_ContextListBoxVal;                                                        //list: of selected context (models,groups)
var RES_SUBGROUPS_ChkBox    = "CHECK_BOX_SUBFOLDERS";                           //check box: for subfolders including
var RES_DATA_ChkBox         = "CHECK_BOX_DATA";                                 //check box: Data
var RES_IT_ChkBox           = "CHECK_BOX_IT";                                   //check box: IT
var RES_ORGELEMENTS_ChkBox  = "CHECK_BOX_ORGELEMENTS";                          //check box: Organizational elements
var RES_OBJKPI_ChkBox       = "CHECK_BOX_OBJKPI";                               //check box: Objectives and KPIs
var RES_PRODSERVICE_ChkBox  = "CHECK_BOX_PRODSERVICE";                          //check box: Product and Service
var RES_RISKS_ChkBox        = "CHECK_BOX_RISKS";                                //check box: Risks
var RES_OTHER_ChkBox        = "CHECK_BOX_OTHER";                                //check box: Other
var RES_TYPESINC_ChkBox     = "CHECK_BOX_TYPESINC";                             //check box: for object types including in report
var RES_SELECTALL_bttn      = "BUTTON_SELECTALL";                               //button: Select all
var RES_FUNCINC_ChkBox      = "CHECK_BOX_FUNCINC";                              //check box: function including in report
var RES_FADINC_ChkBox       = "CHECK_BOX_FADINC";                               //check box: FAD include
var RES_FADINSUPERIOR_ChkBox= "CHECK_BOX_FADINSUPERIOR";                        //check box: FAD info in superior model


//Aspects (don't localize)
var ASP_CONF_NAME           = "AspectsConfig";
var ASP_CONF_COLOR          = "AspectsColors";
var ASP_ORG_ELEMENTS        = "OrganizationalElements";
var ASP_IT                  = "IT";
var ASP_DATA                = "Data";
var ASP_RISKS               = "Risks";
var ASP_PROD_SERV           = "ProductsServices";
var ASP_OBJ_KPI             = "ObjectivesKPIs";
var ASP_OTHER               = "Other"
//------------------------------------------------------------------------------------------------------------------------
// Global variables
//------------------------------------------------------------------------------------------------------------------------

var g_nloc                  = Context.getSelectedLanguage();                    //selected language
var g_AllSymbolTypes        = rep_getAllSymbolNum();                            //All symbol types
var g_ActiveFilter          = ArisData.getActiveDatabase().ActiveFilter();      //Active filter
var g_oSelectedGroups       = ArisData.getSelectedGroups();                     //selected groups
var g_oSelectedModels       = ArisData.getSelectedModels();                     //selected models
var g_nEvalContext          = CTX_INVALID;                                      //selected context
var g_dlgUserOptions;                                                           //user options dialog
var g_Report                = new rep_Report();                                 //Report
var g_XMLconfigFile         = "Aspects_conf.xml";                               //Aspects configuration file (data type definitions for each aspect)
var g_CurAspectName         = "";                                               //Current aspect name for the listeners

// Dialog support depends on script runtime environment (STD resp. BP, TC)
var g_bDialogsSupported = isDialogSupported(); 
  
var g_bRunByService         = (Context.getProperty("Prop_ObjectData") != null); // Anubis 379731

var g_mCxnTypes             = new java.util.HashMap();                          // Mapping of CxnTypes


//------------------------------------------------------------------------------------------------------------------------
//                                          Main routine
//------------------------------------------------------------------------------------------------------------------------
function main(){
//Info: main routines
    g_nEvalContext = rep_getEvaluationContext();
    if (g_nEvalContext == CTX_INVALID) {
        if ( !g_bRunByService ) {
            showMessageBox(getString("TEXT_ERR_1"));
        }
        Context.setScriptError(Constants.ERR_NOFILECREATED);
        return;
    }
    
    if (g_bRunByService) {
        // Anubis 379731 - Called by APG service
        g_bRunByService = true;
        g_Report.SetOptionsByService();        

    } else {    
        if(g_bDialogsSupported) {
            g_dlgUserOptions = rep_createUserOptionsDialog();
            
            // Read dialog settings from config
            var sSection = "SCRIPT_dbb3c6e0_8c40_11dc_3c0c_00c09f4eb2d1";
            ReadSettingsDlgValue(g_dlgUserOptions, sSection, RES_SUBGROUPS_ChkBox, 0);
            ReadSettingsDlgValue(g_dlgUserOptions, sSection, RES_DATA_ChkBox, 0);
            ReadSettingsDlgValue(g_dlgUserOptions, sSection, RES_IT_ChkBox, 0);
            ReadSettingsDlgValue(g_dlgUserOptions, sSection, RES_ORGELEMENTS_ChkBox, 0);
            ReadSettingsDlgValue(g_dlgUserOptions, sSection, RES_OBJKPI_ChkBox, 0);
            ReadSettingsDlgValue(g_dlgUserOptions, sSection, RES_PRODSERVICE_ChkBox, 0);
            ReadSettingsDlgValue(g_dlgUserOptions, sSection, RES_RISKS_ChkBox, 0);
            ReadSettingsDlgValue(g_dlgUserOptions, sSection, RES_OTHER_ChkBox, 0);
            ReadSettingsDlgValue(g_dlgUserOptions, sSection, RES_TYPESINC_ChkBox, 0);
            ReadSettingsDlgValue(g_dlgUserOptions, sSection, RES_FUNCINC_ChkBox, 0);
            ReadSettingsDlgValue(g_dlgUserOptions, sSection, RES_FADINC_ChkBox, 0);
            ReadSettingsDlgValue(g_dlgUserOptions, sSection, RES_FADINSUPERIOR_ChkBox, 0);
            
            var oUserOptionsDialogResult = Dialogs.show(g_dlgUserOptions);
            
            if (oUserOptionsDialogResult == 0) {   //Cancel
                showMessageBox(getString("TEXT_27"));
                Context.setScriptError(Constants.ERR_CANCEL);
                return;
            }
            
            // Write dialog settings to config    
            WriteSettingsDlgValue(g_dlgUserOptions, sSection, RES_SUBGROUPS_ChkBox);
            WriteSettingsDlgValue(g_dlgUserOptions, sSection, RES_DATA_ChkBox);
            WriteSettingsDlgValue(g_dlgUserOptions, sSection, RES_IT_ChkBox);
            WriteSettingsDlgValue(g_dlgUserOptions, sSection, RES_ORGELEMENTS_ChkBox);
            WriteSettingsDlgValue(g_dlgUserOptions, sSection, RES_OBJKPI_ChkBox);
            WriteSettingsDlgValue(g_dlgUserOptions, sSection, RES_PRODSERVICE_ChkBox);
            WriteSettingsDlgValue(g_dlgUserOptions, sSection, RES_RISKS_ChkBox);
            WriteSettingsDlgValue(g_dlgUserOptions, sSection, RES_OTHER_ChkBox);
            WriteSettingsDlgValue(g_dlgUserOptions, sSection, RES_TYPESINC_ChkBox);
            WriteSettingsDlgValue(g_dlgUserOptions, sSection, RES_FUNCINC_ChkBox);
            WriteSettingsDlgValue(g_dlgUserOptions, sSection, RES_FADINC_ChkBox);
            WriteSettingsDlgValue(g_dlgUserOptions, sSection, RES_FADINSUPERIOR_ChkBox);
            
            g_Report.ReadOptions(g_dlgUserOptions);
        } else {
            g_Report.SetOptionsBP();
        }
    }
    g_Report.PrepareReport();
    
    
}//end: main()


//------------------------------------------------------------------------------------------------------------------------
//                                      Reporting routines
//------------------------------------------------------------------------------------------------------------------------
function rep_Report(){
//Object: prepares and saves reports
    this.m_ObjectTypes      = new Array();              //Array contained object types
    this.m_ObjectTypes_Title= new Array();              //Array contained object types titles
    this.m_ObjectTypes_AspectName = new Array();        //Array contained internal aspect names
    //this.m_ObjectTypes_other= new Array();            //Array for other object types
    this.f_IncludeSubGroups = Boolean(false);           //Include subgroups (for group processing)
    this.f_ObjTypeInHeader  = Boolean(false);           //Incude object type in column header
    this.f_ListFuncInModel  = Boolean(false);           //List functions if occuring in models
    this.f_IncludeFAD       = Boolean(false);           //Include assigned Function Allocation Diagrams
    this.f_InegrateFADInfo  = Boolean(false);           //Integrate Function Allocation Diagram info in superior model
    this.f_ReportGroups     = Boolean(false);           //Report groups
    this.f_ReportModels     = Boolean(false);           //Report models
        
    this.ReadOptions = function(dlgDialog){
    //Info: function read user options from dialog "dlgDialog" and global variable "g_nEvalContext"
        if (dlgDialog.getDlgValue(RES_DATA_ChkBox) == true){
            this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_DATA);
            this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_7");
            this.m_ObjectTypes_AspectName.push(ASP_DATA);
        }
        if (dlgDialog.getDlgValue(RES_IT_ChkBox) == true) {
            this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_IT);
            this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_8");
            this.m_ObjectTypes_AspectName.push(ASP_IT);
        }
        if (dlgDialog.getDlgValue(RES_ORGELEMENTS_ChkBox) == true){
            this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_ORG_ELEMENTS);
            this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_9");
            this.m_ObjectTypes_AspectName.push(ASP_ORG_ELEMENTS);
        }
        if (dlgDialog.getDlgValue(RES_OBJKPI_ChkBox) == true) {
            this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_OBJ_KPI);
            this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_10");
            this.m_ObjectTypes_AspectName.push(ASP_OBJ_KPI);
        }
        if (dlgDialog.getDlgValue(RES_PRODSERVICE_ChkBox) == true){
            this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_PROD_SERV);
            this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_11");
            this.m_ObjectTypes_AspectName.push(ASP_PROD_SERV);
        }
        if (dlgDialog.getDlgValue(RES_RISKS_ChkBox) == true) {
            this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_RISKS);
            this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_12");
            this.m_ObjectTypes_AspectName.push(ASP_RISKS);
        }
        if (dlgDialog.getDlgValue(RES_OTHER_ChkBox) == true) {
            this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_OTHER);
            this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_13");
            this.m_ObjectTypes_AspectName.push(ASP_OTHER);
        }
        
        this.f_IncludeSubGroups = Boolean(dlgDialog.getDlgValue(RES_SUBGROUPS_ChkBox));
        this.f_ObjTypeInHeader = Boolean(dlgDialog.getDlgValue(RES_TYPESINC_ChkBox));
        this.f_ListFuncInModel = Boolean(dlgDialog.getDlgValue(RES_FUNCINC_ChkBox));
        this.f_IncludeFAD = Boolean(dlgDialog.getDlgValue(RES_FADINC_ChkBox));
        this.f_InegrateFADInfo = Boolean(dlgDialog.getDlgValue(RES_FADINSUPERIOR_ChkBox));
        if ((g_nEvalContext&CTX_GROUP_REPORT_FLAG) == CTX_GROUP_REPORT_FLAG) {
            this.f_ReportGroups = true;
        }
        if ((g_nEvalContext&CTX_MODEL_REPORT_FLAG) == CTX_MODEL_REPORT_FLAG) {
            this.f_ReportModels = true;
        }
    }//this.ReadOptions = function(dlgDialog)
    
    this.SetOptionsBP = function(){
    //Info: function pre-Set [user] options and global variable "g_nEvalContext"
    //RES_DATA_ChkBox == true
        this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_DATA);
        this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_7");
        this.m_ObjectTypes_AspectName.push(ASP_DATA);
    //RES_IT_ChkBox == true
        this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_IT);
        this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_8");
        this.m_ObjectTypes_AspectName.push(ASP_IT);
    //RES_ORGELEMENTS_ChkBox == true
        this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_ORG_ELEMENTS);
        this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_9");
        this.m_ObjectTypes_AspectName.push(ASP_ORG_ELEMENTS);
    //RES_OBJKPI_ChkBox == true
        this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_OBJ_KPI);
        this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_10");
        this.m_ObjectTypes_AspectName.push(ASP_OBJ_KPI);
    //RES_PRODSERVICE_ChkBox == true
        this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_PROD_SERV);
        this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_11");
        this.m_ObjectTypes_AspectName.push(ASP_PROD_SERV);
    //RES_RISKS_ChkBox == true
        this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_RISKS);
        this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_12");
        this.m_ObjectTypes_AspectName.push(ASP_RISKS);
    //RES_OTHER_ChkBox == true
        this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_OTHER);
        this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_13");
        this.m_ObjectTypes_AspectName.push(ASP_OTHER);
    
        this.f_IncludeSubGroups = false; //RES_SUBGROUPS_ChkBox     // BLUE-10824 Don't include subgroups
        this.f_ObjTypeInHeader = true; //RES_TYPESINC_ChkBox
        this.f_ListFuncInModel = true; //RES_FUNCINC_ChkBox
        this.f_IncludeFAD = true; //RES_FADINC_ChkBox
        this.f_InegrateFADInfo = true; //RES_FADINSUPERIOR_ChkBox
        if ((g_nEvalContext&CTX_GROUP_REPORT_FLAG) == CTX_GROUP_REPORT_FLAG) {
            this.f_ReportGroups = true;
        }
        if ((g_nEvalContext&CTX_MODEL_REPORT_FLAG) == CTX_MODEL_REPORT_FLAG) {
            this.f_ReportModels = true;
        }
    }//this.SetOptionsBP = function()    

    this.SetOptionsByService = function(){
        // Anubis 379731 - Called by APG service 
        g_bRunByService = true;        
        if (getBoolPropertyValue("Prop_ObjectData")) {              //RES_DATA_ChkBox == true
            this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_DATA);
            this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_7");
            this.m_ObjectTypes_AspectName.push(ASP_DATA);
        }
        if (getBoolPropertyValue("Prop_ObjectIT")) {                //RES_IT_ChkBox == true
            this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_IT);
            this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_8");
            this.m_ObjectTypes_AspectName.push(ASP_IT);
        }
        if (getBoolPropertyValue("Prop_ObjectOrga")) {              //RES_ORGELEMENTS_ChkBox == true
            this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_ORG_ELEMENTS);
            this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_9");
            this.m_ObjectTypes_AspectName.push(ASP_ORG_ELEMENTS);
        }
        if (getBoolPropertyValue("Prop_ObjectKPI")) {               //RES_OBJKPI_ChkBox == true
            this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_OBJ_KPI);
            this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_10");
            this.m_ObjectTypes_AspectName.push(ASP_OBJ_KPI);
        }
        if (getBoolPropertyValue("Prop_ObjectProductService")) {    //RES_PRODSERVICE_ChkBox == true
            this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_PROD_SERV);
            this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_11");
            this.m_ObjectTypes_AspectName.push(ASP_PROD_SERV);
        }
        if (getBoolPropertyValue("Prop_ObjectRisk")) {              //RES_RISKS_ChkBox == true
            this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_RISKS);
            this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_12");
            this.m_ObjectTypes_AspectName.push(ASP_RISKS);
        }
        if (getBoolPropertyValue("Prop_ObjectOther")) {             //RES_OTHER_ChkBox == true
            this.m_ObjectTypes[this.m_ObjectTypes.length] = rep_getAspectObjTypes(ASP_OTHER);
            this.m_ObjectTypes_Title[this.m_ObjectTypes_Title.length] = getString("TEXT_13");
            this.m_ObjectTypes_AspectName.push(ASP_OTHER);
        }
    
        this.f_IncludeSubGroups = getBoolPropertyValue("Prop_SubGroups");           //RES_SUBGROUPS_ChkBox
        this.f_ObjTypeInHeader = getBoolPropertyValue("Prop_ObjectTypeAsHeader");   //RES_TYPESINC_ChkBox
        this.f_ListFuncInModel = getBoolPropertyValue("Prop_ModelFunc");            //RES_FUNCINC_ChkBox
        this.f_IncludeFAD = getBoolPropertyValue("Prop_ModelAssignedFAD");          //RES_FADINC_ChkBox
        this.f_InegrateFADInfo = getBoolPropertyValue("Prop_ModelIntegrate");       //RES_FADINSUPERIOR_ChkBox
        if ((g_nEvalContext&CTX_GROUP_REPORT_FLAG) == CTX_GROUP_REPORT_FLAG) {
            this.f_ReportGroups = true;
        }
        if ((g_nEvalContext&CTX_MODEL_REPORT_FLAG) == CTX_MODEL_REPORT_FLAG) {
            this.f_ReportModels = true;
        }
    }//this.SetOptionsByService = function() 

    this.PrepareReport = function(){
    //Info: function preparing and saving report
        var oModelList = new Array();
        var oObjOccs = new Array();
        var oObjOccs_Symbols = new Array();
        var oObjOccs_Aspects = new Array();   //multidimention array of aspects
        var oObjOccs_AspCons = new Array();   //multidimention array of aspect connections
        var oObjOccs_AspTypes= new Array();   //multidimention array of aspect types
        var oObjOccs_Path = new Array();
        var oObjOccs_ModelName = new Array();
        var oObjOccs_ModelType = new Array();
        var FADs = new Array();
        var FADsInScope = new Array();
        var FADsRef = new Array();
        var structAspects = new Array();      //Aspect structure
        var oObjOccs_filteredout = new Array();
        
        //check for empty report
        if (this.m_ObjectTypes.length == 0){
            if ( g_bDialogsSupported && !g_bRunByService )
                showMessageBox(getString("TEXT_26"));
            Context.setScriptError(Constants.ERR_NOFILECREATED);
            return;
        }
        
        //------------get full model list--------------
        if (this.f_ReportModels) {  //include selected models in list
            oModelList = oModelList.concat(g_oSelectedModels);
        }
        if (this.f_ReportGroups) { //include models in selected groups
            for (i = 0; i < g_oSelectedGroups.length; i++) {
                oModelList = oModelList.concat(getModelsOfGroups(g_oSelectedGroups, Boolean(this.f_IncludeSubGroups)));
            }
        }

        //------------------- start collecting of data -------------------
        //for all selected models preparing object occ list
        for (var i = 0; i < oModelList.length; i++){
            var ObjOccsInModel;
            var ObjDefsInModel;
            var ObjOccsInModel_filtered = new Array();
            var ObjOccsInModel_filtered_Symbols = new Array();
            var oObjOccs_filteredout_tmp = new Array();
            var simbolNum;
            var currPath;
            var currModelType;
            var currModelName;
            var FADs_i;
            
            currPath = oModelList[i].Group().Path(g_nloc);
            currModelType = oModelList[i].Type();
            currModelName = oModelList[i].Name(g_nloc);
            if ((oModelList[i].OrgModelTypeNum() == Constants.MT_FUNC_ALLOC_DGM) && (this.f_InegrateFADInfo || this.f_IncludeFAD)){
                //process FAD giagrams in another cycle
                FADsInScope[FADsInScope.length] = oModelList[i];
                continue;
            }
            ObjOccsInModel = oModelList[i].ObjOccListFilter(Constants.OT_FUNC);
            if (ObjOccsInModel.length == 0){
                continue;
            }
            ObjOccsInModel.sort(rep_SortByName);
            //remove occs with same simbols (in current model)
            simbolNum = ObjOccsInModel[0].getSymbol();
            ObjOccsInModel_filtered[ObjOccsInModel_filtered.length] = ObjOccsInModel[0];
            ObjOccsInModel_filtered_Symbols[ObjOccsInModel_filtered_Symbols.length] = simbolNum;
            for (j = 1; j < ObjOccsInModel.length; j++){
                if (ObjOccsInModel_filtered[ObjOccsInModel_filtered.length-1].ObjDef().IsEqual(ObjOccsInModel[j].ObjDef())){
                    //filter out occurences with same object definition symbol
                    if (simbolNum != ObjOccsInModel[j].getSymbol()){
                        //add ocurrences with different symbol type ob object occurrence
                        ObjOccsInModel_filtered[ObjOccsInModel_filtered.length] = ObjOccsInModel[j];
                        simbolNum = ObjOccsInModel[j].getSymbol();
                        ObjOccsInModel_filtered_Symbols[ObjOccsInModel_filtered_Symbols.length] = simbolNum;
                    }
                    else{
                        //memorize filtered out objects occurrences
                        oObjOccs_filteredout_tmp[oObjOccs_filteredout_tmp.length] = {};
                        oObjOccs_filteredout_tmp[oObjOccs_filteredout_tmp.length - 1].Item = ObjOccsInModel[j];
                        oObjOccs_filteredout_tmp[oObjOccs_filteredout_tmp.length - 1].Symbol = simbolNum;
                        oObjOccs_filteredout_tmp[oObjOccs_filteredout_tmp.length - 1].Path = currPath;
                        oObjOccs_filteredout_tmp[oObjOccs_filteredout_tmp.length - 1].ModelType = currModelType;
                        oObjOccs_filteredout_tmp[oObjOccs_filteredout_tmp.length - 1].ModelName = currModelName;
                    }
                }
                else{
                    //object occurence is unique
                    ObjOccsInModel_filtered[ObjOccsInModel_filtered.length] = ObjOccsInModel[j];
                    ObjOccsInModel_filtered_Symbols[ObjOccsInModel_filtered_Symbols.length] = simbolNum;
                }
            }
            
            //adding Model names, Model types and Pathes
            for(var j = 0; j < ObjOccsInModel_filtered.length; j++){
               oObjOccs_Path[oObjOccs_Path.length] = currPath;
               oObjOccs_ModelName[oObjOccs_ModelName.length] = currModelName;
               oObjOccs_ModelType[oObjOccs_ModelType.length] = currModelType;
            }
            
            //selecting refereces FADs or add nulls
            FADs_i = new Array();
            for(var j = 0; j < ObjOccsInModel_filtered.length; j++){
                if (this.f_IncludeFAD || this.f_InegrateFADInfo){
                //save associated FADs
                    var FADs_tmp = ObjOccsInModel_filtered[j].ObjDef().AssignedModels(getModelTypesIncludingUserDefined(Constants.MT_FUNC_ALLOC_DGM));
                    if (FADs_tmp.length != 0){
                        FADs_i[FADs_i.length] = FADs_tmp;
                    }
                    else{
                        FADs_i[FADs_i.length] = new Array();
                    }
                    //add filtered out FAD links in current
                    for (var j_filt = 0; j_filt < oObjOccs_filteredout_tmp.length; j_filt++){
                        if ((ObjOccsInModel_filtered[j].ObjDef().IsEqual(oObjOccs_filteredout_tmp[j_filt].Item.ObjDef())) && 
                            (ObjOccsInModel_filtered[j].getSymbol() == oObjOccs_filteredout_tmp[j_filt].Symbol) && 
                            (currPath == oObjOccs_filteredout_tmp[j_filt].Path) &&
                            (currModelType == oObjOccs_filteredout_tmp[j_filt].ModelType) &&
                            (currModelName == oObjOccs_filteredout_tmp[j_filt].ModelName)){
                                //filtered out object is found, include references FADs
                                FADs_i[FADs_i.length - 1] = oObjOccs_filteredout_tmp[j_filt].Item.ObjDef().AssignedModels(getModelTypesIncludingUserDefined(Constants.MT_FUNC_ALLOC_DGM));
                        }
                    }
                }
                else{
                    //add empty
                    for(var k = 0; k < ObjOccsInModel_filtered[j].length; k++){
                        FADs_i[FADs_i.length] = new Array();
                    }
                }
            }
            
            oObjOccs = oObjOccs.concat(ObjOccsInModel_filtered);
            oObjOccs_Symbols = oObjOccs_Symbols.concat(ObjOccsInModel_filtered_Symbols);
            FADsRef = FADsRef.concat(FADs_i);
            
            oObjOccs_filteredout = oObjOccs_filteredout.concat(oObjOccs_filteredout_tmp);
        }//end: for all selected models preparing object occ list
        
        //filter references FADs
        if (!this.f_IncludeFAD && this.f_InegrateFADInfo){
            //include only in-scope FADs
            for (var i = 0; i < oObjOccs.length; i++){
                for (var j = 0; j < FADsRef[i].length; j++){
                    var bNotFound = true;
                    for (var k = 0; k < FADsInScope.length; k++){
                        if (FADsRef[i][j].IsEqual(FADsInScope[k])){
                            //remove this reference FAD
                            bNotFound = false;
                            break;
                        }
                    }
                    if (bNotFound){
                        FADsRef[i].splice(j ,1);
                    }
                }
            }
        }//end: filter references FADs
        
        //remove included FADs from FADsInScope
        if (this.f_InegrateFADInfo || this.f_IncludeFAD){
            for (var i = 0; i < oObjOccs.length; i++){
                for (var j = 0; j < FADsRef[i].length; j++){
                    for (var k = 0; k < FADsInScope.length; k++){
                        if (FADsRef[i][j].IsEqual(FADsInScope[k])){
                            //current FAD include in some another table,delete its from FADsInScope list
                            FADsInScope.splice(k ,1);
                        }
                    }
                }
            }
        }//end: remove included FADs from FADsInScope
        
        //prepare object Occ list for non included FADs
        for (var i = 0; i < FADsInScope.length; i++){
            var ObjOccsInModel;
            var ObjDefsInModel;
            var ObjOccsInModel_filtered = new Array();
            var ObjOccsInModel_filtered_Symbols = new Array();
            var simbolNum;
            var currPath;
            var currModelType;
            var currModelName;
            
            currPath = FADsInScope[i].Group().Path(g_nloc);
            currModelType = FADsInScope[i].Type();
            currModelName = FADsInScope[i].Name(g_nloc);
            ObjOccsInModel = FADsInScope[i].ObjOccListFilter(Constants.OT_FUNC);
            if (ObjOccsInModel.length == 0){
                continue;
            }
            ObjOccsInModel.sort(rep_SortByName);
            //remove occs with same simbols (in current model)
            simbolNum = ObjOccsInModel[0].getSymbol();
            ObjOccsInModel_filtered[ObjOccsInModel_filtered.length] = ObjOccsInModel[0];
            ObjOccsInModel_filtered_Symbols[ObjOccsInModel_filtered_Symbols.length] = simbolNum;
            for (j = 1; j < ObjOccsInModel.length; j++){
                if (ObjOccsInModel_filtered[ObjOccsInModel_filtered.length-1].ObjDef().IsEqual(ObjOccsInModel[j].ObjDef())){
                    if (simbolNum != ObjOccsInModel[j].getSymbol()){
                        ObjOccsInModel_filtered[ObjOccsInModel_filtered.length] = ObjOccsInModel[j];
                        simbolNum = ObjOccsInModel[j].getSymbol();
                        ObjOccsInModel_filtered_Symbols[ObjOccsInModel_filtered_Symbols.length] = simbolNum;
                    }
                }
                else{
                    ObjOccsInModel_filtered[ObjOccsInModel_filtered.length] = ObjOccsInModel[j];
                    ObjOccsInModel_filtered_Symbols[ObjOccsInModel_filtered_Symbols.length] = simbolNum;
                }
            }
            
            //adding Model names, Model types and Pathes
            for(var j = 0; j < ObjOccsInModel_filtered.length; j++){
               oObjOccs_Path[oObjOccs_Path.length] = currPath;
               oObjOccs_ModelName[oObjOccs_ModelName.length] = currModelName;
               oObjOccs_ModelType[oObjOccs_ModelType.length] = currModelType;
            }
            
            oObjOccs = oObjOccs.concat(ObjOccsInModel_filtered);
            oObjOccs_Symbols = oObjOccs_Symbols.concat(ObjOccsInModel_filtered_Symbols);
        }//end: prepare object Occ list for non included FADs
        
        //for all Aspects
        oObjOccs_Aspects = new Array();
        oObjOccs_AspCons = new Array();
        oObjOccs_AspTypes = new Array();
        structAspects = new Array();
        for(var i = 0; i < this.m_ObjectTypes.length; i++){
            oObjOccs_Aspects[i] = new Array();
            oObjOccs_AspCons[i] = new Array();
            oObjOccs_AspTypes[i] = new Array();
            structAspects[i] = new Array();
        }
        for(var i = 0; i < this.m_ObjectTypes.length; i++){
            //search aspect in object Occs list
            for(var j = 0; j < oObjOccs.length; j++){
                oObjOccs_Aspects[i][j] = new Array();
                oObjOccs_AspCons[i][j] = new Array();
                oObjOccs_AspTypes[i][j] = new Array();
                structAspects[i][j] = {};
                
                oObjOccs_Aspects[i][j] = rep_getObjOccsByObjDefTypes(oObjOccs[j], this.m_ObjectTypes[i], oObjOccs_AspCons[i][j], oObjOccs_AspTypes[i][j]);
                
                structAspects[i][j].FuncOcc = oObjOccs[j];
                structAspects[i][j].FuncName = oObjOccs[j].ObjDef().Name(g_nloc);
                structAspects[i][j].FuncSymbol = oObjOccs_Symbols[j];
                structAspects[i][j].Path = oObjOccs_Path[j];
                structAspects[i][j].ModelType = oObjOccs_ModelType[j];
                structAspects[i][j].ModelName = oObjOccs_ModelName[j];
                structAspects[i][j].AspectList = oObjOccs_Aspects[i][j];
                structAspects[i][j].AspectLinks = oObjOccs_AspCons[i][j];
                structAspects[i][j].AspectTypes = oObjOccs_AspTypes[i][j];
                
                //add object occurences of aspects from filtered out function occurrences
                for (var j_filt = 0; j_filt < oObjOccs_filteredout.length; j_filt++){
                    if (oObjOccs[j].ObjDef().IsEqual(oObjOccs_filteredout[j_filt].Item.ObjDef()) &&
                        (oObjOccs[j].getSymbol() == oObjOccs_filteredout[j_filt].Symbol) && 
                        (oObjOccs_Path[j] == oObjOccs_filteredout[j_filt].Path) &&
                        (oObjOccs_ModelType[j] == oObjOccs_filteredout[j_filt].ModelType) &&
                        (oObjOccs_ModelName[j] == oObjOccs_filteredout[j_filt].ModelName)){
                            //filtered out object is found, include references aspects occurrences
                            var addit_oObjOccs_AspCons = new Array();
                            var addit_oObjOccs_AspTypes = new Array();
                            var addir_oObjOccs_Aspects = new Array();
                            
                            addir_oObjOccs_Aspects = rep_getObjOccsByObjDefTypes(oObjOccs_filteredout[j_filt].Item, this.m_ObjectTypes[i], addit_oObjOccs_AspCons, addit_oObjOccs_AspTypes);
                            structAspects[i][j].AspectList = structAspects[i][j].AspectList.concat(addir_oObjOccs_Aspects);
                            structAspects[i][j].AspectLinks = structAspects[i][j].AspectLinks.concat(addit_oObjOccs_AspCons);
                            structAspects[i][j].AspectTypes = structAspects[i][j].AspectTypes.concat(addit_oObjOccs_AspTypes);
                            
                            //aspects from filtered out occurrenses was added, remove non-used occurrense
                            oObjOccs_filteredout.splice(j_filt, 1);
                        }
                }
                
                //include info from FAD
                if ((FADsRef[j] != null) && (FADsRef[j].length != 0)){
                    var FADs_tmp = FADsRef[j];
                    for(var k = 0; k < FADs_tmp.length; k++){
                        var ObjOccsFADlist = FADs_tmp[k].ObjOccListFilter(Constants.OT_FUNC);
                        var currObjOccFAD;
                        for (var l = 0; l < ObjOccsFADlist.length; l++){
                            if (String(ObjOccsFADlist[l].ObjDef().ObjectID()) == String(oObjOccs[j].ObjDef().ObjectID())){
                                currObjOccFAD = ObjOccsFADlist[l];
                                break;
                            }
                        }
                        if (currObjOccFAD == null){
                            throw getString("TEXT_24");
                        }
                        var additAspects = new Array();
                        var additAspCons = new Array();
                        var additAspTypes = new Array();
                        
                        additAspects = rep_getObjOccsByObjDefTypes(currObjOccFAD, this.m_ObjectTypes[i], additAspCons, additAspTypes);
                        if (additAspects.length != 0){
                            oObjOccs_Aspects[i][j] = oObjOccs_Aspects[i][j].concat(additAspects);
                            oObjOccs_AspCons[i][j] = oObjOccs_AspCons[i][j].concat(additAspCons);
                            oObjOccs_AspTypes[i][j] = oObjOccs_AspTypes[i][j].concat(additAspTypes);
                            
                            structAspects[i][j].AspectList = structAspects[i][j].AspectList.concat(additAspects);
                            structAspects[i][j].AspectLinks = structAspects[i][j].AspectLinks.concat(additAspCons);
                            structAspects[i][j].AspectTypes = structAspects[i][j].AspectTypes.concat(additAspTypes);
                        }
                    }
                }//end: include info from FAD
            }//end: search aspect in object Occs list
        }//end: for all Aspects
        
        //------------------- end collecting of data -------------------
        
        
        
        //------------------- start preparing report -------------------
        
        var wbExcellWorkBook = Context.createExcelWorkbook(Context.getSelectedFile());
        var bIsReportEmpty = true;
        
        for (var Aspect_idx = 0; Aspect_idx < structAspects.length; Aspect_idx++){
            //for all aspects
            var SheetsInfoRows = new Array();
            var SheetsHeader = new Array();
            
            //prepare list of information 
            var structAspect;
            var oSheetsInfoRow;
            for (var FuncInfo_idx = 0; FuncInfo_idx < structAspects[Aspect_idx].length; FuncInfo_idx++) {
                structAspect = structAspects[Aspect_idx][FuncInfo_idx];
                if (structAspect.AspectList.length>0) {
                    oSheetsInfoRow = {};
                    oSheetsInfoRow.Path = structAspect.Path;
                    oSheetsInfoRow.ModelType = structAspect.ModelType;
                    oSheetsInfoRow.ModelName = structAspect.ModelName;
                    oSheetsInfoRow.Func_idx = FuncInfo_idx;
                    oSheetsInfoRow.FuncName = structAspect.FuncName;
                    oSheetsInfoRow.FuncSymbol = structAspect.FuncOcc.SymbolName();
                    oSheetsInfoRow.AspectList = structAspect.AspectList;
                    oSheetsInfoRow.AspectLinks = structAspect.AspectLinks;
                    oSheetsInfoRow.AspectTypes = structAspect.AspectTypes;
                    SheetsInfoRows.push(oSheetsInfoRow);
                }
            }
            //end: prepare list of information rows
            
            SheetsInfoRows.sort(rep_SortStructBy5Items);

            //prepare list of objects for aspect
            var oSheetsHeader;
            var HashSetObjGUID = new java.util.HashSet();
            for (var SheetsInfoRows_idx=0; SheetsInfoRows_idx<SheetsInfoRows.length; SheetsInfoRows_idx++) {
                oSheetsInfoRow = SheetsInfoRows[SheetsInfoRows_idx];
                if (oSheetsInfoRow.AspectList.length>0) {
                    for (AspectList_idx=0; AspectList_idx<oSheetsInfoRow.AspectList.length; AspectList_idx++) {
                        var oItem = oSheetsInfoRow.AspectList[AspectList_idx].ObjDef();
                        if (!HashSetObjGUID.contains(oItem.GUID())) {
                            HashSetObjGUID.add(oItem.GUID());
                            oSheetsHeader = {};
                            oSheetsHeader.Item = oItem;
                            oSheetsHeader.ItemName = oItem.Name(g_nloc);
                            oSheetsHeader.ItemType = oItem.Type();
                            SheetsHeader.push(oSheetsHeader);
                        }
                    }
                }
            }
            
            SheetsHeader.sort(rep_SortStructByItemName);
                        
            //output sheet(s) for current aspect
            var SheetName = this.m_ObjectTypes_Title[Aspect_idx];
            var SheetOutputName;
            var SheetCount_max = rep_getSheetMaxNumber(this.f_ListFuncInModel, SheetsHeader.length);
            var SheetsHeader_idx = 0;
            
            for (var Sheet_idx = 0; Sheet_idx < SheetCount_max; Sheet_idx++){
                //prepare output name of sheet
                var oXlsSheet;
                
                if (SheetCount_max == 1){
                    SheetOutputName = SheetName;
                }
                else{
                    SheetOutputName = SheetName + " " + String((Sheet_idx + 1));
                }
                if (SheetsHeader.length == 0){
                    //current sheet is empty, it means that all othe sheets of current aspect is empty
                    //we must use break instead of continue operator
                    break;
                }
                else{
                    bIsReportEmpty = false;
                }
                
                //create sheet
                oXlsSheet = wbExcellWorkBook.createSheet(SheetOutputName);
                
                //Output data to sheet
                g_CurAspectName = this.m_ObjectTypes_AspectName[Aspect_idx];
                SheetsHeader_idx = rep_outputSheet(wbExcellWorkBook, oXlsSheet,
                  SheetsInfoRows, SheetsHeader, SheetsHeader_idx,
                  this.f_ListFuncInModel, this.f_ObjTypeInHeader);
            }
            
            
        }
        
        if (!bIsReportEmpty){
            //save excel file
            wbExcellWorkBook.write();
        }
        else{
            if( g_bDialogsSupported && !g_bRunByService) {
                showMessageBox(getString("TEXT_38"));
                Context.setScriptError(Constants.ERR_NOFILECREATED);
            } else {
                if (!g_bRunByService) {
                    // BLUE-10824 Output empty result in Connect
                    var oXlsSheet = wbExcellWorkBook.createSheet(getString("TEXT_39"));
                    var oXlsCell = oXlsSheet.cell(0,0);
                    oXlsCell.setCellValue(getString("TEXT_38"));
                }               
                wbExcellWorkBook.write();       // Anubis 400706
            }
        }
        
        //------------------- end preparing report -------------------
        
    }//this.PrepareReport = function()
    
}//rep_Report()

function getBoolPropertyValue(p_sPropKey) {
    var property = Context.getProperty(p_sPropKey);
    if (property != null) {
        return (StrComp(property, "true") == 0);
    }
    return false;
}

// Debug functions
function debug_outputSheetsInfoRows(wb, SheetsInfoRows, sSheetName) {
  var oData = new DataAdapterSheetsInfoRows(SheetsInfoRows);
  
  var ws = wb.createSheet(sSheetName);
  var oXlsTable = new ExcelTable();
  oXlsTable.setData(oData);
  oXlsTable.setListener(ExcelTable_Listener);
  oXlsTable.outputTable(wb, ws, 0, 0);
}

// DataAdapterStruct
function DataAdapterSheetsInfoRows(oSheetsInfoRows)
{
  this.oSheetsInfoRows = oSheetsInfoRows;
  this.nCurRow = -1;
}

DataAdapterSheetsInfoRows.prototype.getHeader = function()
{
  if (this.oHeaders) return this.oHeaders;
  
  var arrHdr = new Array(getString("TEXT_31"), "ModelType", "ModelName", "Func_idx",
    "FuncName", "FuncSymbol", "AspectList", "AspectLinks", "AspectTypes");
  var oHeaders = new Array();
  this.oHeaders = oHeaders;
  var oHdr;
  for (var i=0; i<arrHdr.length; i++) {
      oHdr = {};
      oHdr.id = arrHdr[i];
      oHdr.sTitle = arrHdr[i];
      oHdr.nWidth = 100*Xcoeff;
      oHeaders.push(oHdr);
  }
  
  return oHeaders;
}

DataAdapterSheetsInfoRows.prototype.getNextRow = function()
{
  this.nCurRow++;
  var oSheetsInfoRows = this.oSheetsInfoRows;
  if (this.nCurRow>=oSheetsInfoRows.length) return null;
  
  var oHeaders = this.oHeaders;
  var oRow = new Array();
  var oSIR = oSheetsInfoRows[this.nCurRow];
  for (var i=0; i<oHeaders.length-3; i++) {
    oRow.push(eval("oSIR."+oHeaders[i].id));
  }
  for (var i=oHeaders.length-3; i<oHeaders.length; i++) {
    oRow.push(eval("oSIR."+oHeaders[i].id+".toString()"));
  }
  return oRow;
}

DataAdapterSheetsInfoRows.prototype.getBottom = function()
{  
  return null;
}

// SheetsHeader
function debug_outputSheetsHeader(wb, SheetsHeader, sSheetName) {
  var oData = new DataAdapterSheetsHeader(SheetsHeader);
  
  var ws = wb.createSheet(sSheetName);
  var oXlsTable = new ExcelTable();
  oXlsTable.setData(oData);
  oXlsTable.setListener(ExcelTable_Listener);
  oXlsTable.outputTable(wb, ws, 0, 0);
}

// DataAdapterStruct
function DataAdapterSheetsHeader(oSheetsHeader)
{
  this.oSheetsHeader = oSheetsHeader;
  this.nCurRow = -1;
}

DataAdapterSheetsHeader.prototype.getHeader = function()
{
  if (this.oHeaders) return this.oHeaders;
  
  var arrHdr = new Array("Item", "ItemName", "ItemType");
  var oHeaders = new Array();
  this.oHeaders = oHeaders;
  var oHdr;
  for (var i=0; i<arrHdr.length; i++) {
      oHdr = {};
      oHdr.id = arrHdr[i];
      oHdr.sTitle = arrHdr[i];
      oHdr.nWidth = 100*Xcoeff;
      oHeaders.push(oHdr);
  }
  
  return oHeaders;
}

DataAdapterSheetsHeader.prototype.getNextRow = function()
{
  this.nCurRow++;

  var oSheetsHeader = this.oSheetsHeader;
  var oSH = oSheetsHeader[this.nCurRow];
  
  if (this.nCurRow>=oSheetsHeader.length) return null;
  
  var oHeaders = this.oHeaders;
  var oRow = new Array();
  for (var i=0; i<oHeaders.length; i++) {
    oRow.push(eval("oSH."+oHeaders[i].id));
  }
    
  return oRow;
}

DataAdapterSheetsHeader.prototype.getBottom = function()
{  
  return null;
}

// structAspects
function debug_outputStructAspects(wb, structAspects, sSheetName) {
  var oData = new DataAdapterStructAspects(structAspects);
  
  var ws = wb.createSheet(sSheetName);
  var oXlsTable = new ExcelTable();
  oXlsTable.setData(oData);
  oXlsTable.setListener(ExcelTable_Listener);
  oXlsTable.outputTable(wb, ws, 0, 0);
}

// DataAdapterStructAspects
function DataAdapterStructAspects(oStructAspects)
{
  this.oStructAspects = oStructAspects;
  this.nCurRow = -1;
  this.idx_i = 0;
  this.idx_j = 0;
  this.idx_AspectIdx = -1;
}

DataAdapterStructAspects.prototype.getHeader = function()
{
  if (this.oHeaders) return this.oHeaders;
  
  var arrHdr = new Array("[i]", "[j]", "FuncOcc", "FuncName",
    "FuncSymbol", getString("TEXT_31"), "ModelType", "ModelName",
    "AspectList[]", "AspectLinks[]", "AspectTypes[]");
  
  var oHeaders = new Array();
  this.oHeaders = oHeaders;
  var oHdr;
  for (var i=0; i<arrHdr.length; i++) {
      oHdr = {};
      oHdr.id = arrHdr[i];
      oHdr.sTitle = arrHdr[i];
      oHdr.nWidth = 100*Xcoeff;
      oHeaders.push(oHdr);
  }
  
  return oHeaders;
}

DataAdapterStructAspects.prototype.getNextRow = function()
{
  this.nCurRow++;
  
  this.idx_AspectIdx++;
  
  var oStructAspects = this.oStructAspects;
  if (this.idx_j>=oStructAspects[this.idx_i].length) return null;
  
  var oSA = oStructAspects[this.idx_i][this.idx_j];
  var nMaxLen = Math.max(oSA.AspectList.length,oSA.AspectLinks.length,oSA.AspectTypes.length);
  if (this.idx_AspectIdx>0 && this.idx_AspectIdx>=nMaxLen) {
    this.idx_AspectIdx = 0;
    this.idx_j++;
    if (this.idx_j>=oStructAspects[this.idx_i].length) {
      this.idx_j = 0;
      this.idx_i++;
    }
  }
  
  if (this.idx_i>=oStructAspects.length) return null;
  
  var oHeaders = this.oHeaders;
  var oRow = new Array();
  oSA = oStructAspects[this.idx_i][this.idx_j];
  
  oRow.push(this.idx_i);
  oRow.push(this.idx_j);
  
  for (var i=2; i<8; i++) {
    oRow.push(eval("oSA."+oHeaders[i].id));
  }
  
  if (oSA.AspectList[this.idx_AspectIdx]) {
    var sObjName = oSA.AspectList[this.idx_AspectIdx].ObjDef().Name(g_nloc);
  }
  oRow.push(sObjName);
  if (oSA.AspectLinks[this.idx_AspectIdx]) {
    var sLinks = oSA.AspectLinks[this.idx_AspectIdx].toString();
  }
  oRow.push(sLinks);
      
  oRow.push(oSA.AspectTypes[this.idx_AspectIdx]);
  
  return oRow;
}

DataAdapterStructAspects.prototype.getBottom = function()
{  
  return null;
}

// ---------------------

function rep_outputSheet(wb, ws, 
  SheetsInfoRows, SheetsHeader, SheetsHeader_idx,
  f_ListFuncInModel, f_ObjTypeInHeader)
{
  var oData = new DataAdapter(SheetsInfoRows, SheetsHeader, SheetsHeader_idx,
    f_ListFuncInModel, f_ObjTypeInHeader);
  
  var oXlsTable = new ExcelTable();
  oXlsTable.setData(oData);
  if (f_ListFuncInModel) {
    oXlsTable.setListener(ExcelTable_WithFunc_Listener);
  } else {
    oXlsTable.setListener(ExcelTable_WithoutFunc_Listener);
  }
  
  // Define fonts and styles
  var fStandart = wb.createFont();
  fStandart.setFontName("Arial");
  fStandart.setFontHeightInPoints(10);
  
  //added font style...
  var fStandardGray = wb.createFont();
  fStandardGray.setFontName("Arial");
  fStandardGray.setFontHeightInPoints(10);
  fStandardGray.setColor(22);
  
  var fBold = wb.createFont();
  fBold.setFontName("Arial");
  fBold.setFontHeightInPoints(10);
  fBold.setBoldweight(0x2bc);
  
  if (f_ListFuncInModel) {
    // header
    oXlsTable.oStyles.stHeader = wb.createCellStyle(fBold,
      2,1,2,1, 0,0,0,0, Constants.ALIGN_CENTER, Constants.VERTICAL_TOP,
      0, rep_getAspectColor(g_CurAspectName), Constants.SOLID_FOREGROUND);
    oXlsTable.oStyles.stHeader.setWrapText(true);
    
    oXlsTable.oStyles.stHeaderL = wb.createCellStyle(fBold,
      2,1,2,2, 0,0,0,0, Constants.ALIGN_CENTER, Constants.VERTICAL_TOP,
      0, rep_getAspectColor(g_CurAspectName), Constants.SOLID_FOREGROUND);
    oXlsTable.oStyles.stHeaderL.setWrapText(true);
    
    oXlsTable.oStyles.stHeaderR = wb.createCellStyle(fBold,
      2,2,2,1, 0,0,0,0, Constants.ALIGN_CENTER, Constants.VERTICAL_TOP,
      0, rep_getAspectColor(g_CurAspectName), Constants.SOLID_FOREGROUND);
    oXlsTable.oStyles.stHeaderR.setWrapText(true);
    
    oXlsTable.oStyles.stPreHead = wb.createCellStyle(fBold,
      0,0,0,0, 0,0,0,0, Constants.ALIGN_LEFT, Constants.VERTICAL_TOP,
      0, 0, Constants.NO_FILL);
    oXlsTable.oStyles.stPreHead.setWrapText(false);
    
    // group row
    oXlsTable.oStyles.stGrpLeftL = wb.createCellStyle(fBold,
      2,1,2,2, 0,0,0,0, Constants.ALIGN_LEFT, Constants.VERTICAL_TOP,
      0, rep_getAspectColor(g_CurAspectName), Constants.SOLID_FOREGROUND);
    oXlsTable.oStyles.stGrpLeftL.setWrapText(true);
    
    oXlsTable.oStyles.stGrpLeft = wb.createCellStyle(fBold,
      2,1,2,1, 0,0,0,0, Constants.ALIGN_LEFT, Constants.VERTICAL_TOP,
      0, rep_getAspectColor(g_CurAspectName), Constants.SOLID_FOREGROUND);
    oXlsTable.oStyles.stGrpLeft.setWrapText(true);
          
    oXlsTable.oStyles.stGrpLeftR = wb.createCellStyle(fBold,
      2,2,2,1, 0,0,0,0, Constants.ALIGN_LEFT, Constants.VERTICAL_TOP,
      0, rep_getAspectColor(g_CurAspectName), Constants.SOLID_FOREGROUND);
    oXlsTable.oStyles.stGrpLeftR.setWrapText(true);
    
    oXlsTable.oStyles.stGrpData = wb.createCellStyle(fBold,
      2,1,2,1, 0,0,0,0, Constants.ALIGN_CENTER, Constants.VERTICAL_TOP,
      0, rep_getAspectColor(g_CurAspectName), Constants.SOLID_FOREGROUND);
    oXlsTable.oStyles.stGrpData.setWrapText(true);
          
    oXlsTable.oStyles.stGrpDataR = wb.createCellStyle(fBold,
      2,2,2,1, 0,0,0,0, Constants.ALIGN_CENTER, Constants.VERTICAL_TOP,
      0, rep_getAspectColor(g_CurAspectName), Constants.SOLID_FOREGROUND);
    oXlsTable.oStyles.stGrpDataR.setWrapText(true);
    
    // data row
    oXlsTable.oStyles.stLeft = wb.createCellStyle(fStandardGray,
      1,1,1,1, 0,0,0,0, Constants.ALIGN_LEFT, Constants.VERTICAL_TOP,
      0, 0, Constants.NO_FILL);
    oXlsTable.oStyles.stLeft.setWrapText(true);
          
    oXlsTable.oStyles.stLeftFunc = wb.createCellStyle(fBold,
      1,1,1,1, 0,0,0,0, Constants.ALIGN_LEFT, Constants.VERTICAL_TOP,
      0, 0, Constants.NO_FILL);
    oXlsTable.oStyles.stLeftFunc.setWrapText(true);
    
    oXlsTable.oStyles.stLeftFuncSymb = wb.createCellStyle(fStandart,
      1,2,1,1, 0,0,0,0, Constants.ALIGN_LEFT, Constants.VERTICAL_TOP,
      0, 0, Constants.NO_FILL);
    oXlsTable.oStyles.stLeftFuncSymb.setWrapText(true);
    
    oXlsTable.oStyles.stDataOdd = wb.createCellStyle(fBold,
      1,1,1,1, 0,0,0,0, Constants.ALIGN_CENTER, Constants.VERTICAL_TOP,
      0, rep_getAspectColor(g_CurAspectName), Constants.SOLID_FOREGROUND);
    oXlsTable.oStyles.stDataOdd.setWrapText(true);
          
    oXlsTable.oStyles.stDataEven = wb.createCellStyle(fBold,
      1,1,1,1, 0,0,0,0, Constants.ALIGN_CENTER, Constants.VERTICAL_TOP,
      0, 0, Constants.NO_FILL);
    oXlsTable.oStyles.stDataEven.setWrapText(true);
  } else {
    // header
    oXlsTable.oStyles.stHeader = wb.createCellStyle(fBold,
      2,1,2,1, 0,0,0,0, Constants.ALIGN_CENTER, Constants.VERTICAL_TOP,
      0, rep_getAspectColor(g_CurAspectName), Constants.SOLID_FOREGROUND);
    oXlsTable.oStyles.stHeader.setWrapText(true);
    
    oXlsTable.oStyles.stHeaderL = wb.createCellStyle(fBold,
      2,1,2,2, 0,0,0,0, Constants.ALIGN_CENTER, Constants.VERTICAL_TOP,
      0, rep_getAspectColor(g_CurAspectName), Constants.SOLID_FOREGROUND);
    oXlsTable.oStyles.stHeaderL.setWrapText(true);
    
    oXlsTable.oStyles.stHeaderR = wb.createCellStyle(fBold,
      2,2,2,1, 0,0,0,0, Constants.ALIGN_CENTER, Constants.VERTICAL_TOP,
      0, rep_getAspectColor(g_CurAspectName), Constants.SOLID_FOREGROUND);
    oXlsTable.oStyles.stHeaderR.setWrapText(true);
            
    // data row
    oXlsTable.oStyles.stLeft = wb.createCellStyle(fStandardGray,
      1,1,1,1, 0,0,0,0, Constants.ALIGN_LEFT, Constants.VERTICAL_TOP,
      0, 0, Constants.NO_FILL);
    oXlsTable.oStyles.stLeft.setWrapText(true);
    
    oXlsTable.oStyles.stLeftModel = wb.createCellStyle(fBold,
      1,2,1,1, 0,0,0,0, Constants.ALIGN_LEFT, Constants.VERTICAL_TOP,
      0, 0, Constants.NO_FILL);
    oXlsTable.oStyles.stLeftModel.setWrapText(true);
     
    oXlsTable.oStyles.stDataOdd = wb.createCellStyle(fBold,
      1,1,1,1, 0,0,0,0, Constants.ALIGN_CENTER, Constants.VERTICAL_TOP,
      0, rep_getAspectColor(g_CurAspectName), Constants.SOLID_FOREGROUND);
    oXlsTable.oStyles.stDataOdd.setWrapText(true);
    
    oXlsTable.oStyles.stDataEven = wb.createCellStyle(fBold,
      1,1,1,1, 0,0,0,0, Constants.ALIGN_CENTER, Constants.VERTICAL_TOP,
      0, 0, Constants.NO_FILL);
    oXlsTable.oStyles.stDataEven.setWrapText(true);

    oXlsTable.oStyles.stPreHead = wb.createCellStyle(fBold,
      0,0,0,0, 0,0,0,0, Constants.ALIGN_LEFT, Constants.VERTICAL_TOP,
      0, 0, Constants.NO_FILL);
    oXlsTable.oStyles.stPreHead.setWrapText(false);
  }
  oXlsTable.outputTable(wb, ws, 0, 0);
  
  // Output legeng
  if (f_ListFuncInModel) {
    var arrLinks = new Array();
    var oSIR;
    for (var SIR_idx=0; SIR_idx<SheetsInfoRows.length; SIR_idx++) {
      oSIR = SheetsInfoRows[SIR_idx];
      for (var AspLinks_idx=0; AspLinks_idx<oSIR.AspectLinks.length; AspLinks_idx++) {
        arrLinks = arrLinks.concat(oSIR.AspectLinks[AspLinks_idx]);
      }
    }
    arrLinks.sort(IntNumSort);
    var arrLegend = new Array();
    var rowLegend;
    if (arrLinks.length>0) {
      rowLegend = new Array();
      rowLegend.push(arrLinks[0]);
      rowLegend.push(g_ActiveFilter.ActiveCxnTypeName(getMappedCxnTypeKey(arrLinks[0])));
      arrLegend.push(rowLegend);
      for (arrLinks_idx=1; arrLinks_idx<arrLinks.length; arrLinks_idx++) {
        if (arrLinks[arrLinks_idx-1] != arrLinks[arrLinks_idx]) {
          rowLegend = new Array();
          rowLegend.push(arrLinks[arrLinks_idx]);
          rowLegend.push(g_ActiveFilter.ActiveCxnTypeName(getMappedCxnTypeKey(arrLinks[arrLinks_idx])));
          arrLegend.push(rowLegend);
        }
      }
    }
    var arrHdr = new Array(getString("TEXT_30"), "");
    var oData_Legend = new DataAdapter_Legend(arrHdr, arrLegend, null, f_ListFuncInModel);
    
    var oXlsTable_Legend = new ExcelTable();
    oXlsTable_Legend.setData(oData_Legend);
    oXlsTable_Legend.setListener(ExcelTable_Legend_Listener);
    oXlsTable_Legend.outputTable(wb, ws, oData.nCurRow+2, 0);
  }
  
  // Freeze panes
  if (f_ListFuncInModel) {
    ws.createFreezePane(5,2);
  } else {
    ws.createFreezePane(3,2);
  }
  
  return oData.idx_Max;  
}

function IntNumSort(a, b) {
  return parseInt(a) - parseInt(b);
}

// DataAdapter
function DataAdapter_Legend(arrHdr, arrData, arrBottom, f_ListFuncInModel)
{
  this.arrHdr = arrHdr;
  this.arrData = arrData;
  this.arrBottom = arrBottom;
  this.nCurRow = -1;
  this.f_ListFuncInModel = f_ListFuncInModel;
}

DataAdapter_Legend.prototype.getHeader = function()
{
  var Headers = new Array();
  var oHdr;
  for (var i=0; i<this.arrHdr.length; i++) {
      oHdr = {};
      oHdr.id = i+1;
      oHdr.sTitle = this.arrHdr[i];
      oHdr.nWidth = -1;
      Headers.push(oHdr);
  }
  
  return Headers;
}

DataAdapter_Legend.prototype.getNextRow = function()
{
  if (!this.arrData) return null;
  
  this.nCurRow++;
  if (this.nCurRow >= this.arrData.length) return null;
  var oRow = this.arrData[this.nCurRow];
  return oRow;
}

DataAdapter_Legend.prototype.getBottom = function()
{
  if (!this.arrBottom) return null;
  
  var oBottoms = new Array();
  var oBtm;
  for (var i=0; i<this.arrBottom.length; i++) {
      oBtm = {};
      oBtm.sTitle = this.arrBottom[i];
      oBottoms.push(oBtm);
  }
  
  return oBottoms;
}

DataAdapter_Legend.prototype.getPreHead = function()
{
  var f_ListFuncInModel = this.f_ListFuncInModel;
  var outTxt = getString("TEXT_36");

  if (!f_ListFuncInModel) outTxt = getString("TEXT_37");

  return outTxt;
}

function ExcelTable_WithFunc_Listener(msg, oXlsTbl, oCell, oHdr, param1) {
  switch (msg) {
  case ETBL_MSG_HDR_CELL_OUT_DONE:
    if (oHdr.id == 1) {
      oCell.setCellStyle(oXlsTbl.oStyles.stHeaderL);
    } else if (oHdr.id == 5) {
      oCell.setCellStyle(oXlsTbl.oStyles.stHeaderR);
    } else if (oHdr.id == oXlsTbl.oData.oHeaders.length) {
      oCell.setCellStyle(oXlsTbl.oStyles.stHeaderR);
    } else {
      oCell.setCellStyle(oXlsTbl.oStyles.stHeader);
    }
    return true;
  case ETBL_MSG_DATA_CELL_OUT_DONE:
    var oStyle;
    if (oXlsTbl.oData.bIsAggregateRow == true) {
      if (param1 == "PreHead")
        oStyle = oXlsTbl.oStyles.stPreHead;
      else if (oHdr.id == 1)
        oStyle = oXlsTbl.oStyles.stGrpLeftL;
      else if (oHdr.id < 5)
        oStyle = oXlsTbl.oStyles.stGrpLeft;
      else if (oHdr.id == 5)
        oStyle = oXlsTbl.oStyles.stGrpLeftR;
      else if (oHdr.id == oXlsTbl.oData.oHeaders.length)
        oStyle = oXlsTbl.oStyles.stGrpDataR;
      else
        oStyle = oXlsTbl.oStyles.stGrpData;
    } else {
      if (param1 == "PreHead")
        oStyle = oXlsTbl.oStyles.stPreHead;
      else if (oHdr.id == 4)
        oStyle = oXlsTbl.oStyles.stLeftFunc;
      else if (oHdr.id == 5)
        oStyle = oXlsTbl.oStyles.stLeftFuncSymb
      else if (oHdr.id < 6)
        oStyle = oXlsTbl.oStyles.stLeft;
      else if (oHdr.id % 2 == 0)
        oStyle = oXlsTbl.oStyles.stDataOdd;
      else
        oStyle = oXlsTbl.oStyles.stDataEven;
    }
    oCell.setCellStyle(oStyle);
    return true;
  }
  return false;
}

function ExcelTable_WithoutFunc_Listener(msg, oXlsTbl, oCell, oHdr, param1) {
  switch (msg) {
  case ETBL_MSG_HDR_CELL_OUT_DONE:
    if (oHdr.id == 1) {
      oCell.setCellStyle(oXlsTbl.oStyles.stHeaderL);
    } else if (oHdr.id == 3) {
      oCell.setCellStyle(oXlsTbl.oStyles.stHeaderR);
    } else if (oHdr.id == oXlsTbl.oData.oHeaders.length) {
      oCell.setCellStyle(oXlsTbl.oStyles.stHeaderR);
    } else {
      oCell.setCellStyle(oXlsTbl.oStyles.stHeader);
    }
    return true;
  case ETBL_MSG_DATA_CELL_OUT_DONE:
    var oStyle;
    if (param1 == "PreHead")
      oStyle = oXlsTbl.oStyles.stPreHead;
    else if (oHdr.id == 3)
      oStyle = oXlsTbl.oStyles.stLeftModel;
    else if (oHdr.id < 3)
      oStyle = oXlsTbl.oStyles.stLeft;
    else if (oHdr.id % 2 == 0)
      oStyle = oXlsTbl.oStyles.stDataOdd;
    else
      oStyle = oXlsTbl.oStyles.stDataEven;
    oCell.setCellStyle(oStyle);
    return true;
  }
  return false;
}

function ExcelTable_Legend_Listener(msg, oXlsTbl, oCell, oHdr, param1) {
  switch (msg) {
  case ETBL_MSG_HDR_CELL_OUT_DONE:
    var oStyle = oXlsTbl.oStyles.oHeaderStyle;
    if (!oStyle) {
      var oFont = oXlsTbl.workbook.createFont();
      oFont.setFontName("Arial");
      oFont.setFontHeightInPoints(10);
      oFont.setBoldweight(0x2bc);
      oStyle = oXlsTbl.workbook.createCellStyle(oFont,
        1,1,1,1, 0,0,0,0, Constants.ALIGN_LEFT, Constants.VERTICAL_TOP,
        0, rep_getAspectColor(g_CurAspectName), Constants.SOLID_FOREGROUND);
      oStyle.setWrapText(true);
      oXlsTbl.oStyles.oHeaderStyle = oStyle;
    }
    oCell.setCellStyle(oStyle);
    return true;
  case ETBL_MSG_DATA_CELL_OUT_DONE:
    var oStyle = oXlsTbl.oStyles.oDataStyle;
    if (!oStyle) {
        var oFont = oXlsTbl.workbook.createFont();
        oFont.setFontName("Arial");
        oFont.setFontHeightInPoints(10);
        oStyle = oXlsTbl.workbook.createCellStyle(oFont,
        1,1,1,1, 0,0,0,0, Constants.ALIGN_LEFT, Constants.VERTICAL_TOP,
        0, 0, Constants.NO_FILL);
        oStyle.setWrapText(true);
        oXlsTbl.oStyles.oDataStyle = oStyle;
    }
    oCell.setCellStyle(oStyle);
    return true;
  }
  return false;
}

function ExcelTable_Listener(msg, oXlsTbl, oCell, oHdr, param1) {
  switch (msg) {
  case ETBL_MSG_HDR_CELL_OUT_DONE:
    var oStyle = oXlsTbl.oStyles.oHeaderStyle;
    if (!oStyle) {
      var oFont = oXlsTbl.workbook.createFont();
      oFont.setFontName("Arial");
      oFont.setFontHeightInPoints(10);
      oFont.setBoldweight(0x2bc);
      oStyle = oXlsTbl.workbook.createCellStyle(oFont,
        1,1,1,1, 0,0,0,0, Constants.ALIGN_CENTER, Constants.VERTICAL_TOP,
        0, 0xC0C0C0, Constants.SOLID_FOREGROUND);
      oStyle.setWrapText(true);
      oXlsTbl.oStyles.oHeaderStyle = oStyle;
    }
    oCell.setCellStyle(oStyle);
    return true;
  case ETBL_MSG_DATA_CELL_OUT_DONE:
    var oStyle = oXlsTbl.oStyles.oDataStyle;
    if (!oStyle) {
        var oFont = oXlsTbl.workbook.createFont();
        oFont.setFontName("Arial");
        oFont.setFontHeightInPoints(10);
        oStyle = oXlsTbl.workbook.createCellStyle(oFont,
        1,1,1,1, 0,0,0,0, Constants.ALIGN_CENTER, Constants.VERTICAL_TOP,
        0, 0, Constants.NO_FILL);
        oStyle.setWrapText(true);
        oXlsTbl.oStyles.oDataStyle = oStyle;
    }
    oCell.setCellStyle(oStyle);
    return true;
  }
  return false;
}

// DataAdapter
function DataAdapter(SheetsInfoRows, SheetsHeader, SheetsHeader_idx,
  f_ListFuncInModel, f_ObjTypeInHeader)
{
  this.SheetsInfoRows = SheetsInfoRows;
  this.SheetsHeader = SheetsHeader;
  this.SheetsHeader_idx = SheetsHeader_idx;
  this.f_ListFuncInModel = f_ListFuncInModel;
  this.f_ObjTypeInHeader = f_ObjTypeInHeader;
  // privat
  this.nCurRow = -1;
  this.oHeaders;
  this.idx_Max = 0;
  this.currFunc_idx = 0;
  this.nextGrpFunc_idx = 0;
}

DataAdapter.prototype.getPreHead = function()
{
  var f_ListFuncInModel = this.f_ListFuncInModel;
  var outTxt = getString("TEXT_36");

  if (!f_ListFuncInModel) outTxt = getString("TEXT_37");

  return outTxt;
}

DataAdapter.prototype.getHeader = function()
{
  if (this.oHeaders) return this.oHeaders;
      
  var SheetsInfoRows = this.SheetsInfoRows;
  var SheetsHeader = this.SheetsHeader;
  var SheetsHeader_idx = this.SheetsHeader_idx;
  var f_ListFuncInModel = this.f_ListFuncInModel;
  var f_ObjTypeInHeader = this.f_ObjTypeInHeader;
  
  var oHdr;
  var arrHdr = new Array(getString("TEXT_31"), getString("TEXT_32"), getString("TEXT_33"));
  if (f_ListFuncInModel) {
    arrHdr.push(getString("TEXT_34"));
    arrHdr.push(getString("TEXT_35"));
  }
  var iLeft = arrHdr.length;
  var i, idx_Max;
  var iDataCell = (OUTPUT_EXCEL_MAX_CELL-iLeft);
  idx_Max = (parseInt(this.SheetsHeader_idx/iDataCell)+1)*iDataCell;
  idx_Max = Math.min(idx_Max, this.SheetsHeader.length);
  this.idx_Max = idx_Max;
  
  for (i=SheetsHeader_idx; i<idx_Max; i++) {
    var sHdrTitle = SheetsHeader[i].ItemName;
    if (f_ObjTypeInHeader) {
      sHdrTitle += " ("+SheetsHeader[i].ItemType+")";
    }
    arrHdr.push(sHdrTitle);
  }

  var Headers = new Array();
  
  for (var i=0; i<arrHdr.length; i++) {
      oHdr = {};
      oHdr.id = i+1;
      oHdr.sTitle = arrHdr[i];
      oHdr.nWidth = 74*Xcoeff;
      Headers.push(oHdr);
  }
  
  Headers[0].nWidth = 196*Xcoeff;
  Headers[1].nWidth = 104*Xcoeff;
  Headers[2].nWidth = 199*Xcoeff;
  
  for (var i=0; i<Headers.length-iLeft; i++) {
      Headers[iLeft+i].Item = SheetsHeader[SheetsHeader_idx+i].Item;
  }
  
  this.oHeaders = Headers;
  return Headers;
}

//xxx
DataAdapter.prototype.getNextRow = function()
{
  this.nCurRow++;
  
  var i;
  var idx_Max = this.idx_Max;
  
  var SheetsInfoRows = this.SheetsInfoRows;
  var SheetsHeader = this.SheetsHeader;
  var SheetsHeader_idx = this.SheetsHeader_idx;
  var f_ListFuncInModel = this.f_ListFuncInModel;
  var currFunc_idx = this.currFunc_idx;
  
  var nCurRow = this.nCurRow;
  var oHdr;
  
  var oRow = new Array();
  
  if (f_ListFuncInModel) {
    if (currFunc_idx >= SheetsInfoRows.length) return null;
    
    var oSheetsInfoRow = SheetsInfoRows[currFunc_idx];
    oRow.push(oSheetsInfoRow.Path);
    oRow.push(oSheetsInfoRow.ModelType);
    oRow.push(oSheetsInfoRow.ModelName);
    
    if (this.nextGrpFunc_idx==currFunc_idx) {
      this.bIsAggregateRow = true;
      
      oRow.push("");
      oRow.push("");
      var bAddNextRow = false;
      var arrLinks = new Array();
      for (var i=5; i<this.oHeaders.length; i++) {
        arrLinks[i-5] = new Array();
      }
      do {
        var oSIR = SheetsInfoRows[this.nextGrpFunc_idx];
        for (var i=5; i<this.oHeaders.length; i++) {
          var oHdr = this.oHeaders[i];
          var nObjIdx;
          for (nObjIdx=0; nObjIdx<oSIR.AspectList.length; nObjIdx++) {
            if (oSIR.AspectList[nObjIdx].ObjDef().IsEqual(oHdr.Item)) {
              arrLinks[i-5] = arrLinks[i-5].concat(oSIR.AspectLinks[nObjIdx]);
            }
          }
        }
        this.nextGrpFunc_idx++;
        oSIR = SheetsInfoRows[this.nextGrpFunc_idx];
        bAddNextRow = this.nextGrpFunc_idx < SheetsInfoRows.length &&
          oSIR.Path == oSheetsInfoRow.Path &&
          oSIR.ModelType == oSheetsInfoRow.ModelType &&
          oSIR.ModelName == oSheetsInfoRow.ModelName;
      } while (bAddNextRow);
      
      for (var Links_idx=0; Links_idx<arrLinks.length; Links_idx++) {
        arrLinks[Links_idx].sort(IntNumSort);
        var sLinks = "";
        if (arrLinks[Links_idx].length>0) {
          sLinks = arrLinks[Links_idx][0];
          for (i=1; i<arrLinks[Links_idx].length; i++) {
            if (arrLinks[Links_idx][i-1] != arrLinks[Links_idx][i]) sLinks += ", " + arrLinks[Links_idx][i];
          }
        }
        oRow.push(sLinks);
      }
      
      return oRow;
    }
    this.bIsAggregateRow = false;
    
    oRow.push(oSheetsInfoRow.FuncName);
    oRow.push(oSheetsInfoRow.FuncSymbol);
    
    for (var i=5; i<this.oHeaders.length; i++) {
        var oHdr = this.oHeaders[i];
        var nObjIdx;
        var sLinks = "";
        for (nObjIdx=0; nObjIdx<oSheetsInfoRow.AspectList.length; nObjIdx++) {
            if (oSheetsInfoRow.AspectList[nObjIdx].ObjDef().IsEqual(oHdr.Item)) {
                oSheetsInfoRow.AspectLinks[nObjIdx].sort(IntNumSort);
                sLinks = oSheetsInfoRow.AspectLinks[nObjIdx].join(", ");
                break;
            }
        }
        oRow.push(sLinks);
    }
    
    currFunc_idx++;
    this.currFunc_idx = currFunc_idx;
  }
  else {
    //output number of occurrences
    if (currFunc_idx >= SheetsInfoRows.length) return null;
    
    var oSheetsInfoRow = SheetsInfoRows[currFunc_idx];
    
    var oRowValue = new Array();
    for (var i=3; i<this.oHeaders.length; i++) {
        oRowValue[i-3] = 0;
    }
    
    var bAddNextRow = false;
    do {
        var oSIR = SheetsInfoRows[currFunc_idx];
        for (var i=3; i<this.oHeaders.length; i++) {
            var oHdr = this.oHeaders[i];
            var nObjIdx;
            for (nObjIdx=0; nObjIdx<oSIR.AspectList.length; nObjIdx++) {
                if (oSIR.AspectList[nObjIdx].ObjDef().IsEqual(oHdr.Item)) {
                    oRowValue[i-3]++;
                }
            }
        }
        currFunc_idx++;
        oSIR = SheetsInfoRows[currFunc_idx];
        bAddNextRow = currFunc_idx < SheetsInfoRows.length &&
          oSIR.Path == oSheetsInfoRow.Path &&
          oSIR.ModelType == oSheetsInfoRow.ModelType &&
          oSIR.ModelName == oSheetsInfoRow.ModelName;
    } while (bAddNextRow);
    
    // Set row data
    oRow.push(SheetsInfoRows[currFunc_idx-1].Path);
    oRow.push(SheetsInfoRows[currFunc_idx-1].ModelType);
    oRow.push(SheetsInfoRows[currFunc_idx-1].ModelName);
    
    for (var i=3; i<this.oHeaders.length; i++) {
        if (oRowValue[i-3]>0)
          oRow.push(oRowValue[i-3]);
        else
          oRow.push("");
    }
    
    this.currFunc_idx = currFunc_idx;
  }
  
  return oRow;
}

// Returns index of item in array or -1 if array doesn't contains item
// arr - array
// itm - item
function IndexOf(arr, itm) {
    for (var i=0; i<arr.length; i++) {
        if (arr[i]==itm){
            return i;
        }
    }
    return -1;
}

DataAdapter.prototype.getBottom = function()
{
  return null;
}

// ExcelTable - output

// Coefficients for converting values from pixels to excel units
var Xcoeff = 36.55;
var Ycoeff = 15.06;

// Messages to listener
var ETBL_MSG_HDR_CELL_OUT = 1;
var ETBL_MSG_HDR_CELL_OUT_DONE = 2;
var ETBL_MSG_DATA_CELL_OUT = 3;
var ETBL_MSG_DATA_CELL_OUT_DONE = 4;
var ETBL_MSG_BTM_CELL_OUT = 5;
var ETBL_MSG_BTM_CELL_OUT_DONE = 6;

function ExcelTable()
{
  this.nCurRow = 0;
  this.nCurCol = 0;
}

// ExcelTable public methods
ExcelTable.prototype.setData = function(oData)
{
  this.oData = oData;
  this.oStyles = {};
}

ExcelTable.prototype.outputTable = function(wb, ws, YOffset, XOffset)
{
  this.workbook = wb;
  this.worksheet = ws;
  this.nXOffset = XOffset;
  this.nYOffset = YOffset;
  this.outputHeader();
  this.outputData();
  this.outputBottom();
}

ExcelTable.prototype.setListener = function(oListener)
{
  this.oListener = oListener;
}

// ExcelTable privat methods
// Output header
ExcelTable.prototype.outputHeader = function()
{
  var nHdr;
  var oHdr;
  var oCell;
  var oHeaders = this.oData.getHeader();
  this.nCurRow = 0;
  this.nCurCol = 0;
  //added A1 cell output...
  if( oHeaders[0].sTitle == getString("TEXT_31") ){
      var txtPreHead = this.oData.getPreHead();
      var myoHdr = oHeaders[2];
      oCell = this.worksheet.cell(this.nCurRow, this.nCurCol);
      oCell.setCellValue(txtPreHead);
      this.oListener(ETBL_MSG_DATA_CELL_OUT_DONE, this, oCell, myoHdr, "PreHead");
    //  this.worksheet.groupColumn(0,2);
      this.nCurRow++;
  }

  for (nHdr=0; nHdr<oHeaders.length; nHdr++) {
    oHdr = oHeaders[nHdr];
    oCell = this.worksheet.cell(this.nCurRow+this.nYOffset, 
      this.nCurCol+this.nXOffset);
    // Send message to listener
    if (!this.oListener || !this.oListener(ETBL_MSG_HDR_CELL_OUT, this, oCell, oHdr)) {
      // If message unhandled
      if (oHdr.nWidth>=0) {
        this.worksheet.setColumnWidth(this.nCurCol+this.nXOffset, oHdr.nWidth);
      }
      oCell.setCellValue(oHdr.sTitle);
    }
    // Send message to listener
    if (this.oListener) this.oListener(ETBL_MSG_HDR_CELL_OUT_DONE, this, oCell, oHdr);
    this.nCurCol++;
  }
  this.nCurRow++;
}

// Output data part
ExcelTable.prototype.outputData = function()
{
  var oRow;
  var oCell;
  var nHdr;
  var oHdr;
  var oHeaders = this.oData.getHeader();
  while (oRow = this.oData.getNextRow()) {
    this.nCurCol = 0;
    for (nHdr=0; nHdr<oHeaders.length; nHdr++) {
      oHdr = oHeaders[nHdr];
      oCellData = oRow[nHdr];
      oCell = this.worksheet.cell(this.nCurRow+this.nYOffset, 
        this.nCurCol+this.nXOffset);
      // Send message to listener
      if (!this.oListener || !this.oListener(ETBL_MSG_DATA_CELL_OUT, this, oCell, oHdr, oCellData)) {
        // If message unhandled
        this.outputCell(oCell, oHdr, oCellData);
      }
      // Send message to listener
      if (this.oListener) this.oListener(ETBL_MSG_DATA_CELL_OUT_DONE, this, oCell, oHdr, oCellData);
      this.nCurCol++;
    }
    this.nCurRow++;
  }
}

// Output cell
ExcelTable.prototype.outputCell = function(oCell, oHdr, oCellData)
{
  oCell.setCellValue(oCellData);
}

// Output bottom
ExcelTable.prototype.outputBottom = function()
{
  var oBottoms = this.oData.getBottom();
  if (!oBottoms) return;
  var oHeaders = this.oData.getHeader();
  var nBtm;
  var oBtm;
  var oCell;
  this.nCurCol = 0;
  for (nBtm=0; nBtm<oBottoms.length; nBtm++) {
    oBtm = oBottoms[nBtm];
    oHdr = oHeaders[nBtm];
    oCell = this.worksheet.cell(this.nCurRow+this.nYOffset, 
      this.nCurCol+this.nXOffset);
    // Send message to listener
    if (!this.oListener || !this.oListener(ETBL_MSG_BTM_CELL_OUT, this, oCell, oHdr, oBtm)) {
      // If message unhandled
      oCell.setCellValue(oBtm.sTitle);
    }
    // Send message to listener
    if (this.oListener) this.oListener(ETBL_MSG_BTM_CELL_OUT_DONE, this, oCell, oHdr, oBtm);
    this.nCurCol++;
  }
  this.nCurRow++;
}                    

//----------------------------------- Utility routines ----------------------------------------------
//
//

function rep_getAllSymbolNum(){
//function return all symbol num
    var allModels = ArisData.getActiveDatabase().ActiveFilter().GetTypes(Constants.CID_MODEL);
    var allObjOccs = new Array();
    var allObjOccs_unique = new Array();
    
    allObjOccs = allObjOccs.concat(ArisData.getActiveDatabase().ActiveFilter().Symbols(allModels[0]));
    for (var i = 0; i < allModels.length; i++){
        var allObjOccs_tmp = new Array();
        allObjOccs_tmp = allObjOccs_tmp.concat(ArisData.getActiveDatabase().ActiveFilter().Symbols(allModels[i]));
        for (var j = 0 ; j < allObjOccs_tmp.length; j++){
            var bResult = false;
            for (var k = 0; k < allObjOccs.length; k++){
                if (allObjOccs_tmp[j] != allObjOccs[k]){
                    bResult = true;
                    break;
                }
            }
            if(bResult){
                allObjOccs = allObjOccs.concat(allObjOccs_tmp[j]);
            }
        }
    }
    //select unique symbol nums
    for (var i = 0; i < allObjOccs.length; i++){
        var bUnique = true;
        for (var j = 0; j < allObjOccs_unique.length; j++){
            if (allObjOccs[i] == allObjOccs_unique[j]){
                bUnique = false;
                break;
            }
        }
        if (bUnique){
            allObjOccs_unique[allObjOccs_unique.length] = allObjOccs[i];
        }
    }
    return allObjOccs_unique;
}//rep_getAllSymbolNum()


function rep_getObjOccsByObjDefTypes(oObjOcc, arrObjectTypes, out_ObjCnxs, out_ObjTypes){
//function search object Occs by its object definitions types
//out_ObjCnxs - returns array of connection types between function and objects
//out_ObjTypes - returns object types of Occs
    var oObjOccsResult = new Array();
    var oAllConnectedObjOccs = new Array();
    var InputCxn_forObjOcc = oObjOcc.Cxns(Constants.EDGES_IN);
    var OutputCxn_forObjOcc = oObjOcc.Cxns(Constants.EDGES_OUT);
    
    oAllConnectedObjOccs = oObjOcc.getConnectedObjOccs(g_AllSymbolTypes);
    
    //select object Occs with special types
    for (var i = 0; i < oAllConnectedObjOccs.length; i++){
        for (var j = 0; j < arrObjectTypes.length; j++){
            if (oAllConnectedObjOccs[i].ObjDef().TypeNum() == arrObjectTypes[j]){
                //we find connected object occurrence in array,
                //getting it's connection type
                var out_ObjCnxs_single = new Array();
                
                //check for input link type
                for (var k = 0; k < InputCxn_forObjOcc.length; k++){
                    if (InputCxn_forObjOcc[k].SourceObjOcc().ObjDef().IsEqual(oAllConnectedObjOccs[i].ObjDef())){
//                        out_ObjCnxs_single.push(InputCxn_forObjOcc[k].Cxn().TypeNum());
                        out_ObjCnxs_single.push(getMappedCxnType(InputCxn_forObjOcc[k].Cxn()));
                    }
                }
                //check for output link type
                for (var k = 0; k < OutputCxn_forObjOcc.length; k++){
                    if (OutputCxn_forObjOcc[k].TargetObjOcc().ObjDef().IsEqual(oAllConnectedObjOccs[i].ObjDef())){
//                        out_ObjCnxs_single.push(OutputCxn_forObjOcc[k].Cxn().TypeNum());
                        out_ObjCnxs_single.push(getMappedCxnType(OutputCxn_forObjOcc[k].Cxn()));
                    }
                }
                if (out_ObjCnxs_single.length == 0){
                    throw getString("TEXT_28");
                }
                
                oObjOccsResult[oObjOccsResult.length] = oAllConnectedObjOccs[i];
                out_ObjCnxs[out_ObjCnxs.length] = out_ObjCnxs_single;
                out_ObjTypes[out_ObjTypes.length] = oAllConnectedObjOccs[i].ObjDef().Type();
                break;
            }
        }
    }
    
    return oObjOccsResult;
}//rep_getObjOccsByObjDefTypes(oObjOcc, arrObjectTypes, out_ObjCnxs)


function getMappedCxnType(p_cxn) {
    var cxnTypeNum = p_cxn.TypeNum();
    
    if (!g_mCxnTypes.containsKey(cxnTypeNum)) {
        g_mCxnTypes.put(cxnTypeNum, g_mCxnTypes.size()+1)
    }
    return parseInt(g_mCxnTypes.get(cxnTypeNum));
}

function getMappedCxnTypeKey(p_value) {
    var keySet = g_mCxnTypes.keySet();
    var keyIter = keySet.iterator();
    while (keyIter.hasNext()) {
        var key = keyIter.next()
        var value = g_mCxnTypes.get(key);
        if (value == p_value) {
            return key;
        }
    }
    return -1;
}


function rep_getAspectObjTypes(Aspect){
//Info: function return object types from XML-conf file (see g_XMLconfigFile)
    var AspectObjTypes = new Array();
    var AspectObjTypes_tmp = new Array();
    var AspectObjTypes_str;
    var Error = "";
    var Error_num = 0;
    var ErrorLevel = 1;
    
    if ((Aspect == ASP_ORG_ELEMENTS) || (Aspect == ASP_OTHER)){
        AspectObjTypes_str = Context.getPrivateProfileString(ASP_CONF_NAME, ASP_ORG_ELEMENTS, "null", g_XMLconfigFile);
        if (AspectObjTypes_str == "null") {//no XML-configuration file
            var Write_str = new Array();

            Write_str[Write_str.length] = "OT_ORG_UNIT_TYPE";
            Write_str[Write_str.length] = "OT_ORG_UNIT";
            Write_str[Write_str.length] = "OT_SYS_ORG_UNIT";
            Write_str[Write_str.length] = "OT_SYS_ORG_UNIT_TYPE";
            Write_str[Write_str.length] = "OT_POS";
            Write_str[Write_str.length] = "OT_PERS";
            Write_str[Write_str.length] = "OT_PERS_TYPE";
            Write_str[Write_str.length] = "OT_GRP";
            Write_str[Write_str.length] = "OT_EMPL_INST";
            Write_str[Write_str.length] = "OT_LOC";
            Context.writePrivateProfileString(ASP_CONF_NAME, ASP_ORG_ELEMENTS, Write_str, g_XMLconfigFile);
            AspectObjTypes_str = Context.getPrivateProfileString(ASP_CONF_NAME, ASP_ORG_ELEMENTS, "null", g_XMLconfigFile);
        }
        var AspectObjTypes_str_tmp = AspectObjTypes_str.split(",");
        for(var i = 0; i < AspectObjTypes_str_tmp.length; i++){
            var Tmp = Constants[AspectObjTypes_str_tmp[i]];
            if (Tmp != null){
                AspectObjTypes_tmp = AspectObjTypes_tmp.concat(Tmp);
            }
            else{
                Error = AspectObjTypes_str_tmp[i];
                Error_num = Error_num + 1;
            }
        }
        ErrorLevel = 0;
    }
    if ((Aspect == ASP_IT) || (Aspect == ASP_OTHER)){
        AspectObjTypes_str = Context.getPrivateProfileString(ASP_CONF_NAME, ASP_IT, "null", g_XMLconfigFile);
        if (AspectObjTypes_str == "null") {//no XML-configuration file
            var Write_str = new Array();
            
            Write_str[Write_str.length] = "OT_APPL_SYS_CLS";
            Write_str[Write_str.length] = "OT_APPL_SYS_TYPE";
            Write_str[Write_str.length] = "OT_APPL_SYS";
            Write_str[Write_str.length] = "OT_SCRN_DSGN";
            Write_str[Write_str.length] = "OT_SCRN";
            Write_str[Write_str.length] = "OT_MOD_TYPE";
            Write_str[Write_str.length] = "OT_MOD";
            Context.writePrivateProfileString(ASP_CONF_NAME, ASP_IT, Write_str, g_XMLconfigFile);
            AspectObjTypes_str = Context.getPrivateProfileString(ASP_CONF_NAME, ASP_IT, "null", g_XMLconfigFile);
        }
        var AspectObjTypes_str_tmp = AspectObjTypes_str.split(",");
        for(var i = 0; i < AspectObjTypes_str_tmp.length; i++){
            var Tmp = Constants[AspectObjTypes_str_tmp[i]];
            if (Tmp != null){
                AspectObjTypes_tmp = AspectObjTypes_tmp.concat(Tmp);
            }
            else{
                Error = AspectObjTypes_str_tmp[i];
                Error_num = Error_num + 1;
            }
        }
        ErrorLevel = 0;
    }
    if ((Aspect == ASP_DATA) || (Aspect == ASP_OTHER)){
        AspectObjTypes_str = Context.getPrivateProfileString(ASP_CONF_NAME, ASP_DATA, "null", g_XMLconfigFile);
        if (AspectObjTypes_str == "null") {//no XML-configuration file
            var Write_str = new Array();
            
            Write_str[Write_str.length] = "OT_CLST";
            Write_str[Write_str.length] = "OT_ENT_TYPE";
            Write_str[Write_str.length] = "OT_RELSHP_TYPE";
            Write_str[Write_str.length] = "OT_ATTR_TYPE_GRP";
            Write_str[Write_str.length] = "OT_ERM_ATTR";
            Write_str[Write_str.length] = "OT_COT_ATTR";
            Write_str[Write_str.length] = "OT_OBJ_CX";
            Write_str[Write_str.length] = "OT_TECH_TRM";
            Write_str[Write_str.length] = "OT_BUSY_OBJ";
            Write_str[Write_str.length] = "OT_KNWLDG_CAT";
            Write_str[Write_str.length] = "OT_PACK";
            Write_str[Write_str.length] = "OT_CLS";
            Write_str[Write_str.length] = "OT_INFO_CARR";
            Write_str[Write_str.length] = "OT_LST";
            Write_str[Write_str.length] = "OT_LST_DSGN";
            Write_str[Write_str.length] = "OT_BUSINESS_RULE";
            Context.writePrivateProfileString(ASP_CONF_NAME, ASP_DATA, Write_str, g_XMLconfigFile);
            AspectObjTypes_str = Context.getPrivateProfileString(ASP_CONF_NAME, ASP_DATA, "null", g_XMLconfigFile);
        }
        var AspectObjTypes_str_tmp = AspectObjTypes_str.split(",");
        for(var i = 0; i < AspectObjTypes_str_tmp.length; i++){
            var Tmp = Constants[AspectObjTypes_str_tmp[i]];
            if (Tmp != null){
                AspectObjTypes_tmp = AspectObjTypes_tmp.concat(Tmp);
            }
            else{
                Error = AspectObjTypes_str_tmp[i];
                Error_num = Error_num + 1;
            }
        }
        ErrorLevel = 0;
    }
    if ((Aspect == ASP_RISKS) || (Aspect == ASP_OTHER)){
        AspectObjTypes_str = Context.getPrivateProfileString(ASP_CONF_NAME, ASP_RISKS, "null", g_XMLconfigFile);
        if (AspectObjTypes_str == "null") {//no XML-configuration file
            var Write_str = new Array();
            
            Write_str[Write_str.length] = "OT_RISK";
            Write_str[Write_str.length] = "OT_RISK_CATEGORY";
            Context.writePrivateProfileString(ASP_CONF_NAME, ASP_RISKS, Write_str, g_XMLconfigFile);
            AspectObjTypes_str = Context.getPrivateProfileString(ASP_CONF_NAME, ASP_RISKS, "null", g_XMLconfigFile);
        }
        var AspectObjTypes_str_tmp = AspectObjTypes_str.split(",");
        for(var i = 0; i < AspectObjTypes_str_tmp.length; i++){
            var Tmp = Constants[AspectObjTypes_str_tmp[i]];
            if (Tmp != null){
                AspectObjTypes_tmp = AspectObjTypes_tmp.concat(Tmp);
            }
            else{
                Error = AspectObjTypes_str_tmp[i];
                Error_num = Error_num + 1;
            }
        }
        ErrorLevel = 0;
    }
    if ((Aspect == ASP_PROD_SERV) || (Aspect == ASP_OTHER)){
        AspectObjTypes_str = Context.getPrivateProfileString(ASP_CONF_NAME, ASP_PROD_SERV, "null", g_XMLconfigFile);
        if (AspectObjTypes_str == "null") {//no XML-configuration file
            var Write_str = new Array();
            
            Write_str[Write_str.length] = "OT_PERF";
            Context.writePrivateProfileString(ASP_CONF_NAME, ASP_PROD_SERV, Write_str, g_XMLconfigFile);
            AspectObjTypes_str = Context.getPrivateProfileString(ASP_CONF_NAME, ASP_PROD_SERV, "null", g_XMLconfigFile);
        }
        var AspectObjTypes_str_tmp = AspectObjTypes_str.split(",");
        for(var i = 0; i < AspectObjTypes_str_tmp.length; i++){
            var Tmp = Constants[AspectObjTypes_str_tmp[i]];
            if (Tmp != null){
                AspectObjTypes_tmp = AspectObjTypes_tmp.concat(Tmp);
            }
            else{
                Error = AspectObjTypes_str_tmp[i];
                Error_num = Error_num + 1;
            }
        }
        ErrorLevel = 0;
    }
    if ((Aspect == ASP_OBJ_KPI) || (Aspect == ASP_OTHER)){
        AspectObjTypes_str = Context.getPrivateProfileString(ASP_CONF_NAME, ASP_OBJ_KPI, "null", g_XMLconfigFile);
        if (AspectObjTypes_str == "null") {//no XML-configuration file
            var Write_str = new Array();
            
            Write_str[Write_str.length] = "OT_OBJECTIVE";
            Write_str[Write_str.length] = "OT_KPI";
            Context.writePrivateProfileString(ASP_CONF_NAME, ASP_OBJ_KPI, Write_str, g_XMLconfigFile);
            AspectObjTypes_str = Context.getPrivateProfileString(ASP_CONF_NAME, ASP_OBJ_KPI, "null", g_XMLconfigFile);
        }
        var AspectObjTypes_str_tmp = AspectObjTypes_str.split(",");
        for(var i = 0; i < AspectObjTypes_str_tmp.length; i++){
            var Tmp = Constants[AspectObjTypes_str_tmp[i]];
            if (Tmp != null){
                AspectObjTypes_tmp = AspectObjTypes_tmp.concat(Tmp);
            }
            else{
                Error = AspectObjTypes_str_tmp[i];
                Error_num = Error_num + 1;
            }
        }
        ErrorLevel = 0;
    }
    
    if (ErrorLevel != 0){
        throw getString("TEXT_ERR_2");
    }
    
    for (i = 0; i < AspectObjTypes_tmp.length; i++){
        AspectObjTypes[i] = Number(AspectObjTypes_tmp[i]);
    }
    
    if (Aspect == ASP_OTHER){
        var allAttr = ArisData.getActiveDatabase().ActiveFilter().ObjTypes();
        
        for (var i = 0; i < AspectObjTypes.length; i++){
            for (var j = 0; j < allAttr.length; j++){
                if (allAttr[j] == AspectObjTypes[i]){
                    allAttr.splice(j, 1);
                    //AspectObjTypes.splice(i ,1);
                }
            }
        }
        AspectObjTypes = allAttr;
    }
    
    if (Error_num != 0){
        throw getString("TEXT_21") + " \"" + g_XMLconfigFile + "\"\r\n" + 
                getString("TEXT_22") + " " + Error + "\r\n" +
                getString("TEXT_23") + " " + Error_num;
    }
    
    return AspectObjTypes;    
}//rep_getAspectObjTypes(Aspect)


function rep_getAspectColor(Aspect){
    var hmAspColor = new java.util.HashMap();
    var hmColorNum = new java.util.HashMap();
    
    hmAspColor.put(ASP_DATA, "gray");
    hmAspColor.put(ASP_IT, "blue");
    hmAspColor.put(ASP_ORG_ELEMENTS, "yellow");
    hmAspColor.put(ASP_OBJ_KPI, "brown");
    hmAspColor.put(ASP_PROD_SERV, "green");
    hmAspColor.put(ASP_RISKS, "red");
    hmAspColor.put(ASP_OTHER, "gray");
    
    hmColorNum.put("gray", "0xC0C0C0");
    hmColorNum.put("blue", "0xCCFFFF");
    hmColorNum.put("yellow", "0xFFFF99");
    hmColorNum.put("brown", "0x99CC00");
    hmColorNum.put("green", "0x00FF00");
    hmColorNum.put("red", "0xFF0000");
    hmColorNum.put("gray", "0xC0C0C0");    
    
    AspectColor_str = hmAspColor.get(Aspect);
    AspectColor_str = getOrCreatePrivateProfileString(ASP_CONF_NAME, Aspect+"Color", AspectColor_str, g_XMLconfigFile);
    
    var nColor = hmColorNum.get(AspectColor_str.toLowerCase());
    if (nColor == null) {
      throw getString("TEXT_ERR_3")+AspectColor_str+
        getString("TEXT_ERR_4")+Aspect;
    }
    
    AspectColor = parseInt(nColor);
    
    return AspectColor;
}//rep_getAspectColor(Aspect)

function getOrCreatePrivateProfileString(sSection, sEntry, sDefault, sFile) {
  var str = Context.getPrivateProfileString(sSection, sEntry, "null", sFile);
  if (str == "null") {//no XML-value
      Context.writePrivateProfileString(sSection, sEntry, sDefault, sFile);
      return sDefault;
  }
  return str;
}


function rep_getEvaluationContext() {
//Info: function return evaluation context
//Return: Report context constants (see Global Variables)

    var evalContext = CTX_INVALID;
    
    if ((g_oSelectedGroups != null) && (g_oSelectedGroups.length != 0)){
        evalContext = evalContext|CTX_GROUP_REPORT_FLAG; 
    }
    if ((g_oSelectedModels != null) && (g_oSelectedModels.length != 0)){
        evalContext = evalContext|CTX_MODEL_REPORT_FLAG; 
    }
    return evalContext;
}//end: rep_getEvaluationContext()

function rep_getSheetMaxNumber(listFuncInModel_flag, dataCellCount){
//function calculate number of sheets
    var SheetCount_max;             //result
    var MainCell_num;               //Cells with technical information
    var DataCell_num;               //Cells with data information (aspect items info)
    
    MainCell_num = 3;               //Path, Model type and Model name
    if (listFuncInModel_flag){    //if we outputs function in model
        MainCell_num += 2;          //function and function symbol
    }
    DataCell_num = dataCellCount;
    
    if (OUTPUT_EXCEL_MAX_CELL <= MainCell_num){
        throw getString("TEXT_29");
    }    
    
    if (DataCell_num == 0){
        return 1;
    }
    SheetCount_max = Math.ceil((DataCell_num)/(OUTPUT_EXCEL_MAX_CELL - MainCell_num));
    
    return SheetCount_max;
}//

//----------------------------------- Sorting routines ----------------------------------------------
//
//

function rep_SortByName(a, b){
//Info: function uses in sort()
//Info: function compares "a" and "b" by name
//Info: "a" and "b" are occurrences
    var a_Name = a.ObjDef().Attribute(Constants.AT_NAME, g_nloc).getValue();
    var b_Name = b.ObjDef().Attribute(Constants.AT_NAME, g_nloc).getValue();
    var stringTmp = new java.lang.String(a_Name);
    
    return stringTmp.compareTo(new java.lang.String(b_Name));
}//end: rep_SortByName(a, b)

function rep_SortBySimbolName(a, b){
//Info: function uses in sort()
//Info: function compares "a" and "b" by simbol type
//Info: "a" and "b" are occurrences
    var a_Name = a.getSymbol();
    var b_Name = b.getSymbol();
    var stringTmp = new java.lang.String(a_Name);
    
    return stringTmp.compareTo(new java.lang.String(b_Name));
}//end: rep_SortBySimbolName(a, b)

function rep_SortByGUID(a, b){
//Info: function uses in sort()
//Info: function compares "a" and "b" by simbol type
//Info: "a" and "b" are occurrences
    var a_Name = a.ObjDef().GUID();
    var b_Name = b.ObjDef().GUID();
    var stringTmp = new java.lang.String(a_Name);
    
    return stringTmp.compareTo(new java.lang.String(b_Name));
}//end: rep_SortByGUID(a, b)

function rep_SortStructByItemName(a ,b){
//Info: function uses in sort()
//Info: function compares "a" and "b" by structure item name
//Info: "a" and "b" are structures
    var a_Name = a.ItemName;
    var b_Name = b.ItemName;
    var stringTmp = new java.lang.String(a_Name);
    
    return stringTmp.compareTo(new java.lang.String(b_Name));
}//end: rep_SortStructByItemName(a ,b)


function rep_SortStructByPath(a, b){
//Info: function uses in sort()
//Info: function compares "a" and "b" by structure items: Path
//Info: "a" and "b" are structures
    var a1_Name = new java.lang.String(a.Path);
    var b1_Name = new java.lang.String(b.Path);

    return a1_Name.compareTo(b1_Name);
}//end: rep_SortStructByPath(a, b)

function rep_SortStructByModelType(a, b){
//Info: function uses in sort()
//Info: function compares "a" and "b" by structure items: ModelType
//Info: "a" and "b" are structures
    var a1_Name = new java.lang.String(a.ModelType);
    var b1_Name = new java.lang.String(b.ModelType);

    return a1_Name.compareTo(b1_Name);
}//end: rep_SortStructByModelType(a, b)

function rep_SortStructByModelName(a, b){
//Info: function uses in sort()
//Info: function compares "a" and "b" by structure items: ModelName
//Info: "a" and "b" are structures
    var a1_Name = new java.lang.String(a.ModelName);
    var b1_Name = new java.lang.String(b.ModelName);

    return a1_Name.compareTo(b1_Name);
}//end: rep_SortStructByModelName(a, b)


function rep_SortStructBy5Items(a, b){
//Info: function uses in sort()
//Info: function compares "a" and "b" by structure items: Path, ModelType, ModelName
//Info: "a" and "b" are structures
    var a1_Name = new java.lang.String(a.Path);
    var b1_Name = new java.lang.String(b.Path);
    var a2_Name = new java.lang.String(a.ModelType);
    var b2_Name = new java.lang.String(b.ModelType);
    var a3_Name = new java.lang.String(a.ModelName);
    var b3_Name = new java.lang.String(b.ModelName);
    var a4_Name = new java.lang.String(a.FuncName);
    var b4_Name = new java.lang.String(b.FuncName);
    var a5_Name = new java.lang.String(a.FuncSymbol);
    var b5_Name = new java.lang.String(b.FuncSymbol);
    var bResult;
    
    bResult = a1_Name.compareTo(b1_Name);
    if (bResult == 0){
        bResult = a2_Name.compareTo(b2_Name);
        if (bResult == 0){
            bResult = a3_Name.compareTo(b3_Name);
            if (bResult == 0){
                bResult = a4_Name.compareTo(b4_Name);
                if (bResult == 0){
                    bResult = a5_Name.compareTo(b5_Name);
                }
            }
        }
    }

    return bResult;
}//end: rep_SortStructBy3Items(a, b)

//------------------------------------------------------------------------------------------------------------------------
//                                      Dialogs routines
//------------------------------------------------------------------------------------------------------------------------

function rep_createUserOptionsDialog(){
//Info: function creates user dialog for several user options: Objects, Models, etc.
//      function uses g_nEvalContext variable
//Return: DialogTemplate

    var oDialogTemplate = Dialogs.createNewDialogTemplate(20, 20, 480, 406, getString("TEXT_1"), "rep_dlgFunc_UserOptionsDialog");
    
    oDialogTemplate.OKButton();
    oDialogTemplate.CancelButton();
    //oDialogTemplate.HelpButton("HID_dbb3c6e0_8c40_11dc_3c0c_00c09f4eb2d1_dlg_01.hlp");
    
    //Report Context--------------------------------------------
    oDialogTemplate.GroupBox(10, 14, 460, 70, getString("TEXT_2"));
    
    g_ContextListBoxVal = new Array();
    
    if ((g_nEvalContext&CTX_GROUP_REPORT_FLAG) == CTX_GROUP_REPORT_FLAG){
        g_ContextListBoxVal[g_ContextListBoxVal.length] = getString("TEXT_3");
    }
    if ((g_nEvalContext&CTX_MODEL_REPORT_FLAG) == CTX_MODEL_REPORT_FLAG){
        g_ContextListBoxVal[g_ContextListBoxVal.length] = getString("TEXT_4");
    }
    if ((g_nEvalContext&(CTX_MODEL_REPORT_FLAG|CTX_GROUP_REPORT_FLAG)) == (CTX_MODEL_REPORT_FLAG|CTX_GROUP_REPORT_FLAG)){
        g_ContextListBoxVal[g_ContextListBoxVal.length] = getString("TEXT_5");
    }
    oDialogTemplate.DropListBox(30, 35, 250, 70, g_ContextListBoxVal, RES_CONTEXT_ListBox, 0); //Not editable + not sorted
    
    if ((g_nEvalContext&CTX_GROUP_REPORT_FLAG) == CTX_GROUP_REPORT_FLAG){
        oDialogTemplate.CheckBox(30, 60, 280, 16, getString("TEXT_6"), RES_SUBGROUPS_ChkBox, 1);
    }
    
    //Objects--------------------------------------------
    oDialogTemplate.GroupBox(10,91,460,210,getString("TEXT_16"));
    oDialogTemplate.CheckBox(30, 112, 280, 16, getString("TEXT_7"), RES_DATA_ChkBox);
    oDialogTemplate.CheckBox(30, 133, 280, 16, getString("TEXT_8"), RES_IT_ChkBox);
    oDialogTemplate.CheckBox(30, 154, 280, 16, getString("TEXT_9"), RES_ORGELEMENTS_ChkBox);
    oDialogTemplate.CheckBox(30, 175, 280, 16, getString("TEXT_10"), RES_OBJKPI_ChkBox);
    oDialogTemplate.CheckBox(30, 196, 280, 16, getString("TEXT_11"), RES_PRODSERVICE_ChkBox);
    oDialogTemplate.CheckBox(30, 217, 280, 16, getString("TEXT_12"), RES_RISKS_ChkBox);
    oDialogTemplate.CheckBox(30, 238, 280, 16, getString("TEXT_13"), RES_OTHER_ChkBox);
    oDialogTemplate.CheckBox(30, 273, 420, 16, getString("TEXT_14"), RES_TYPESINC_ChkBox);
    oDialogTemplate.PushButton(330, 112, 110, 21, getString("TEXT_20"), RES_SELECTALL_bttn);
    
    //Models---------------------------------------------
    oDialogTemplate.GroupBox(10, 308, 460, 91, getString("TEXT_15"));
    oDialogTemplate.CheckBox(30, 329, 420, 16, getString("TEXT_17"), RES_FUNCINC_ChkBox);
    oDialogTemplate.CheckBox(30, 350, 420, 16, getString("TEXT_18"), RES_FADINC_ChkBox);
    oDialogTemplate.CheckBox(30, 371, 420, 16, getString("TEXT_19"), RES_FADINSUPERIOR_ChkBox);
    
    //set init dialog value
    var oOptionsDialog = Dialogs.createUserDialog(oDialogTemplate);
    oOptionsDialog.setDlgValue("DROP_LIST_BOX_CONTEXT", g_ContextListBoxVal.length - 1);
    oOptionsDialog.setDlgValue("CHECK_BOX_SUBFOLDERS", 1);
    
    return oOptionsDialog;
}//end: rep_createUserOptionsDialog()

function rep_dlgFunc_UserOptionsDialog(dlgitem, action, suppvalue){
//Info: UserOptionsDialog dealog message-routine function (see template from rep_createUserOptionsDialog() )
    
    var result = false;
    
    switch(action) {
    case 1: //init dialog. returning true would terminate the dialog
            // it is also possible to init the dialog here (instead of before showing the dialog)
    case 2://CheckBox, DropListBox, ListBox or OptionGroup: value changed . CancelButton, OKButton or PushButton: button pressed
    {
        if (dlgitem == RES_SELECTALL_bttn){
            g_dlgUserOptions.setDlgValue(RES_DATA_ChkBox, true);
            g_dlgUserOptions.setDlgValue(RES_IT_ChkBox, true);
            g_dlgUserOptions.setDlgValue(RES_ORGELEMENTS_ChkBox, true);
            g_dlgUserOptions.setDlgValue(RES_OBJKPI_ChkBox, true);
            g_dlgUserOptions.setDlgValue(RES_PRODSERVICE_ChkBox, true);
            g_dlgUserOptions.setDlgValue(RES_RISKS_ChkBox, true);
            g_dlgUserOptions.setDlgValue(RES_OTHER_ChkBox, true);
            result = true;
        }
        if (dlgitem == RES_CONTEXT_ListBox){
            if (g_ContextListBoxVal[g_dlgUserOptions.getDlgValue(RES_CONTEXT_ListBox)] == getString("TEXT_4")){ //Selected models
                g_nEvalContext = CTX_MODEL_REPORT_FLAG;
                g_dlgUserOptions.setDlgVisible(RES_SUBGROUPS_ChkBox, false);
            }
            else{
                g_dlgUserOptions.setDlgVisible(RES_SUBGROUPS_ChkBox, true);
                if (g_ContextListBoxVal[g_dlgUserOptions.getDlgValue(RES_CONTEXT_ListBox)] == getString("TEXT_3")){ //Selected groups
                    g_nEvalContext = CTX_GROUP_REPORT_FLAG;
                }
                if (g_ContextListBoxVal[g_dlgUserOptions.getDlgValue(RES_CONTEXT_ListBox)] == getString("TEXT_5")){ //Selected groups and models
                    g_nEvalContext = CTX_GROUP_REPORT_FLAG|CTX_MODEL_REPORT_FLAG;
                }
            }
        }
    }
    break;
  }
  
  return result;
}//end: rep_dlgFunc_UserOptionsDialog()

function getModelsOfGroups(oGroups, bRecursive) {
    var aModelTypes = Context.getDefinedItemTypes(Constants.CID_MODEL);
    var oModels = new Array();

    for (var i = 0; i < oGroups.length; i++) {
        oModels = oModels.concat(filterModels(oGroups[i], aModelTypes));
    }
    return oModels;
    
    function filterModels(oGroup, aTypeNums) {
        if (aTypeNums.length == 0 || (aTypeNums.length == 1 && aTypeNums[0] == -1)) {
            // All/None type nums selected
            return oGroup.ModelList(bRecursive);
        }
        return oGroup.ModelList(bRecursive, aTypeNums);
    }
}

function showMessageBox(sMessage) {
    if (Context.getEnvironment().equals(Constants.ENVIRONMENT_BP)) return;  // Never show in Business Publisher (BLUE-12274)
    Dialogs.MsgBox(sMessage);
}

function isDialogSupported() {
    // Dialog support depends on script runtime environment (STD resp. BP, TC)
    var env = Context.getEnvironment();
    if (env.equals(Constants.ENVIRONMENT_STD)) return true;
    if (env.equals(Constants.ENVIRONMENT_TC)) return SHOW_DIALOGS_IN_CONNECT;
    return false;
}

//------------------------------------------------------------------------------------------------------------------------
// Start report
//------------------------------------------------------------------------------------------------------------------------
try {
    main();
}
catch(err){
    if ( !g_bRunByService )
        showMessageBox(getString("TEXT_25") + err);
}

//------------------------------------------------------------------------------------------------------------------------
// Stop report
//------------------------------------------------------------------------------------------------------------------------
