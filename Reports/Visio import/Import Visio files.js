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

// Version 2.0: uses internal implementation of Visio file reader / mapping reader through Context.getComponent("VisioImport")

var visioImport = Context.getComponent("VisioImport");
var bpmnSupport = visioImport.getBPMNSupport();
const SHOW_DIALOGS = !propertyIsSet("INTERNAL_CALL");    // true: script was launched in debug mode, false: script was launched via GUI
// prototype string functions
String.prototype.trim = function() { return ""+new java.lang.String(this).trim(); }
String.prototype.isGuid = function() {
    var result = this.match(/^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/);
    if (result != null)
        return true;
    return false;
}

// attribute mapping:
// read properties from "User" and "Prop" (maybe extend to "Field") sub-elements of page/model/shape

// 9.7: page/model attribute mappings:
var pagePropertiesList = [["Process_Name", Constants.AT_NAME_FULL],
                          ["sys_Description", Constants.AT_DESC],
                          ["sys_UserVersionNo", Constants.AT_REM]];

// 9.7: used by getObjectAttributeMapping
var objPropertiesList = [["Cost", Constants.AT_DESC],
                          ["Duration", Constants.AT_DESC],
                          ["Resources", Constants.AT_DESC],
                          ["ShowLoop", Constants.AT_DESC],
                          ["ShowCompensation", Constants.AT_DESC],
                          ["ShowMultipleInstances", Constants.AT_DESC],
                          ["Process_Name", Constants.AT_DESC],
                          ["Process_State", Constants.AT_DESC],
                          ["Process_Type", Constants.AT_DESC]];

//2Darray for generic Cxn attributes since 10.0.4
var cxnPropertyList = [["text", Constants.AT_CXN_ROLE, Constants.ATTROCC_TOP]] //Cxn attr and placement
//use this for BPMN2: ("Kurzbezeichnung" is the property to use, but element 0 is also used for found text)
//var cxnPropertyList = [["Kurzbezeichnung", Constants.AT_BPMN_CONDITION_EXPRESSION, Constants.ATTROCC_TOP]] 


// REPORT
var g_defaultMapping = "Generic" //org: Generic, JPMC
var g_nLoc = Context.getSelectedLanguage();
var g_nZorder = 0;
var bulkMode = false;
var skipDialogs = false;
var abort = false;
var open_models;
var selectedTemplate;

//for assignment creation
var mapCreateAssignments = new java.util.HashMap() //OBJDEF-GUID --> page nameU
var mapCreatedModels     = new java.util.HashMap() //page NameU -->  MODEL-GUID

function main()
{
    var visio = [];
    try
    {
        var gStart = ArisData.getSelectedGroups()[0];
        var data = Context.getProperty("vdx-file");
        var sFiles = [];
        var fileImported = [];
        if(data==null) {
            if (SHOW_DIALOGS) {
                sFiles = Dialogs.getFilePath(null, getString("ID_FILETYPE.DBI"), null, getString("SELECT_FILETYPE.DBT"), 8);
            } else {
                throw new Error('Error: No Visio file was provided via properties');
            }
            if(sFiles!=null){
                if (sFiles.length > 1) {bulkMode = true}
                
                for (var i = 0; i < sFiles.length; i++) {
                    if (abort) {
                       break;
                    }
                    
                    visio[i] = new T_Visio(sFiles[i].getData(), sFiles[i].getName());
                    fileImported[i] = visio[i].initVisioFile(i, sFiles.length);
                }
            }
            else
                return null; //pressed cancel
        } else {

            sFiles.length = 1;
            visio[0] = new T_Visio(data, Context.getProperty("vdx-filename"));
            fileImported[0] = visio[0].initVisioFile(1, 1);
            //help collecting garbage
            data = null
            Context.setProperty("vdx-file", null)
        }
        var gStart = ArisData.getSelectedGroups()[0];
        
        for (var i = 0; i < sFiles.length; i++) {
            if (fileImported[i]) {
                var nModelType = visio[i].getNewModelType();
                nModelType = postInitStep(visio[i], visio[i].getMapping().getSourceType(), nModelType); //interceptor defined in 02 user_defined_steps.js
                if(nModelType>-1){
                    // if(mNew!=null && mNew.IsValid()){
                        if(!visio[i].processModelGeneration(gStart,nModelType))
                            Context.setScriptError(Constants.ERR_CANCEL)
                    // }
                    Context.addActionResult(Constants.ACTION_UPDATE,"",gStart);
                }else{
                    showError(getString("FIND_MODELTYPE.ERR"));
                }
            }
        }
    }
    catch(ex)
    {
        var line = ex.lineNumber
        var message = ex.message
        var filename = ex.fileName
        //mostly in this case an OutOfMemoryError occured
        showError(getString("GENERAL_IMPORT_ERROR.ERR")+"\n"+message+"\nin "+filename+" ("+line+")");
        Context.setScriptError(Constants.ERR_CANCEL)
    }
    for (var i = 0; i < visio.length; i++) {
        visio[i].destroyLoader()
    }
}

function isExpress()
{
    return Context.getProperty("page-index")!=null;
}


//p_visioMappings : hashMap
//p_visioPages []: [0] internal name ("NameU"), [1] human-readable name ("Name")
function visioDialog(p_visioMappings, p_visioPages, overall) {
    var aMappingComplete = new Array();

    this.getPages = function() {
        var userDlg = Dialogs.createNewDialogTemplate(0, 0, 470, 270);
        userDlg.Text(10, 10, 450, 28, getString("DIALOG_IMPORT_TYPE.DBI"));
        userDlg.ComboBox(10, 38, 450, 300, [""], "FIELD_CB");

        userDlg.Text(10, 70, 450, 14, getString("DIALOG_PAGE_SELECTION.DBI"));
        var columnArray = ["", getString("DIALOG_COLUMN_HEADER.DBI")];
        var editorInfo = [Constants.TABLECOLUMN_BOOL_EDIT, Constants.TABLECOLUMN_DEFAULT];
        var columnInfo = [10, 90];
        userDlg.Table(10, 85, 450, 205, columnArray, editorInfo, columnInfo, "FIELD_TABLE", Constants.TABLE_STYLE_MULTISELECT);
        
        if (overall > 1) {
            userDlg.CheckBox(10, 310, 450, 20, "Skip further dialogs and use this template for all files", "FIELD_SKIP");
        }
        userDlg.HelpButton("HID_843f56b0-5a5f-11de-736f-001a6b3c78e6_dlg_01.hlp");

        return [userDlg];
    }
    
    this.init = function(aPages) {
        aMappingComplete = getMappingComplete();
        var aMappingList = getMappingList(aMappingComplete);

        aPages[0].getDialogElement("FIELD_CB").setItems(aMappingList);
        if (aMappingList.length == 1) {
            aPages[0].getDialogElement("FIELD_CB").setEnabled(false);
        }
        else
        {
            for(var i in aMappingList)
            {
                if(new java.lang.String(aMappingList[i]).indexOf(g_defaultMapping)>=0 )
                {
                    aPages[0].getDialogElement("FIELD_CB").setSelection(i)
                    break;
                }
            }
        }

        var tableEntries = getTableEntries();
        aPages[0].getDialogElement("FIELD_TABLE").setItems(tableEntries);


        function getMappingComplete() {
            var aMappingC = new Array();

            var iter = p_visioMappings.entrySet().iterator()
            while(iter.hasNext()) {
                var entry = iter.next()
                aMappingC.push([entry.getKey(), entry.getValue()]);
            }
            aMappingC = aMappingC.sort(sortMappingC)
            return aMappingC;
        }
        
        function sortMappingC(first, second)
        {
            return (""+first[1]).localeCompare(""+second[1])    
        }

        function getMappingList(aMappingC) {
            var aMappingL = new Array();
            for (var i in aMappingC) {
                aMappingL[i] = aMappingC[i][1];
            }
            return aMappingL;
        }

        function getTableEntries() {
            var tableEntries = new Array();
            for (var i in p_visioPages) {
                tableEntries.push([1, p_visioPages[i].getName() ]);
            }
            return tableEntries;
        }
    }
    
    this.FIELD_SKIP_selChanged = function(newSelection) {
        if (newSelection) {
            //this.dialog.getPage(0).getDialogElement("FIELD_CB").setEnabled(false);
            this.dialog.getPage(0).getDialogElement("FIELD_TABLE").setEnabled(false);
        } else {
            //this.dialog.getPage(0).getDialogElement("FIELD_CB").setEnabled(true);
            this.dialog.getPage(0).getDialogElement("FIELD_TABLE").setEnabled(true);
            /*var items = this.dialog.getPage(0).getDialogElement("FIELD_TABLE").getItems();
            for (var t=0; t<items[0].length; t++) {
                items[t][0].setEnabled(true);
            }*/
        }
    }
    
    this.isInValidState = function(pageNumber) { return true; }
    this.canFinish = function(pageNumber) { return true; }
    this.canChangePage = function(pageNumber) { return true; }

    var _closedByOk = false;
    this.onClose = function(pageNumber, bOk) {
        _closedByOk = bOk
    }

    this.getResult = function() {
        if(_closedByOk)
        {
            var nIndex = this.dialog.getPage(0).getDialogElement("FIELD_CB").getSelectedIndex();
            var skipDialogElement = this.dialog.getPage(0).getDialogElement("FIELD_SKIP");
            if (skipDialogElement!=null) {
                skipDialogs = skipDialogElement.isChecked();
            }
            var selectedMappingID = aMappingComplete[nIndex][0];
            
            var aSelectedPages = new Array();
            var aTableResult = this.dialog.getPage(0).getDialogElement("FIELD_TABLE").getItems();
            for (var i in aTableResult) {
                if (aTableResult[i][0] > 0) {
                    aSelectedPages.push( getTableEntryResult(aTableResult[i][1]) );
                }
            }
            return [selectedMappingID, aSelectedPages];
        }
        else
            return null;

        function getTableEntryResult(sReadableName) {
            for (var i in p_visioPages) {
                if( (""+p_visioPages[i].getName()).equals(sReadableName))//[1]=readable name
                    return p_visioPages[i].getNameU(); //[0]=internal name
            }
            return sReadableName; //should never occur
        }
    }
}

function T_Visio(sFile, sFileName){
    var _method = ArisData.ActiveFilter();
    var m_loader;
    var _fVisioName
    var _sUsedTemplate = null;
    var _mapping;
    var _pageIndex = -1;
    var _pagesToBeImported = new java.util.HashSet()

    this.getLoader = function()
    {
        return m_loader
    }

    this.destroyLoader = function()
    {
        if(m_loader!=null)
            m_loader.destroy()
        m_loader = null;
    }

    this.initVisioFile = function(current, overall){
        var bInit = false;
        var data = Context.getProperty("vdx-file")
        if(data==null)
        {
            if(sFile!=null){
                bInit = initVisioData(sFile, sFileName, current, overall)
            }
            else {
                return null; //pressed cancel
            }
                
            
            sFile = null //help collecting garbage
        }
        else
        {
            bInit = initVisioData(data, Context.getProperty("vdx-filename"), current, overall)
            //help collecting garbage
            data = null
            Context.setProperty("vdx-file", null)
        }

        return bInit;

        //initializes m_loader, _fVisioName, _mapping and _sUsedTemplate
	    function initVisioData(data, name, current, overall)
	    {
            Context.writeStatus(formatstring1(getString("STATUS_READ.INF"), name), current+1)
	        var bInit = false;
	        try{
                m_loader = visioImport.loadDrawingFile(name, data)
                _fVisioName = m_loader.getFileName()
                var sTemplateName = m_loader.getUsedTemplate().toUpperCase();
                var mappingFile = Context.getProperty("mapping-filename");// -> "mapping.xml" or null (express 1.0)
                if(mappingFile==null)
                    mappingFile = "mapping.xml"; //fallback if report started from within debugger
                _mapping = visioImport.getMapping( Context.getFile(mappingFile,Constants.LOCATION_SCRIPT),
                                                   Context.getFile("visioshapes.xml",Constants.LOCATION_SCRIPT),
                                                   ArisData.getActiveDatabase().ActiveFilter());
                _sUsedTemplate = initTablesAndTemplate(_mapping, sTemplateName, name, current, overall)
                if(_sUsedTemplate==null) { //user pressed cancel
                    if (!SHOW_DIALOGS) {
                        return null;
                    }
                    
                    var answer = Constants.MSGBOX_RESULT_YES;
                    
                    if (overall > 1) {
                        var answer = Dialogs.MsgBox(getString("DIALOG_ABORT.DBI"), Constants.MSGBOX_BTN_YESNO, getString("VISIO_IMPORT.DBT"));
                    }
                    if (answer == Constants.MSGBOX_RESULT_YES) {
                        abort = true;
                    }
                    return null;
                }
                
                _sUsedTemplate = "" + _sUsedTemplate
                if(_sUsedTemplate.length==0)
                {
                    showError(formatstring1(getString("INCORRECT_VIS_FILE_VERSION.ERR"), _fVisioName));
                    return false;
                }
                
                if (skipDialogs) {
                    selectedTemplate = _sUsedTemplate;
                }
                
                

                if(_mapping.initMapping(_sUsedTemplate))
                {
                    bInit = true;
                    m_loader.setUsedTemplate( _mapping.getSourceType() )
                }
                else
                {
                    showError(getString("MAPPING_READ_ERROR.ERR"));
                }
	        }catch(e){
                showError(e.toString());
	        }
	        return bInit;
	    }
    }

    function initTablesAndTemplate(_mapping, sTemplateName, name, current, overall)
    {
        var aAvailableTemplates = new Array();
        var sCurrentTemplate = new java.lang.String(sTemplateName)
        if(sCurrentTemplate.length()>0)
            sCurrentTemplate = _mapping.findDrawingTypeByAlias(sCurrentTemplate)
        var mapIDsToNames = null;
        try {
            mapIDsToNames = _mapping.getDrawingTypeNameMap(sCurrentTemplate)
        } catch(e)
        {
            showError(e.toString());
        }
        if(mapIDsToNames.size()==0) //user tries to import an unmapped drawing type
        {
            showError(getString("FIND_MODELTYPE.ERR"));
        }
        var aPages = m_loader.getPageNames()
        return showSelectionDialog(mapIDsToNames, aPages, sCurrentTemplate, name, current, overall);
    }

    function showSelectionDialog(p_mappingIDsToNames, p_aVisioPages, p_sTemplateName, name, current, overall)
    {
        if (skipDialogs) {
            for (var i = 0; i < p_aVisioPages.length; i++) {
                _pagesToBeImported.add("" + p_aVisioPages[i].getNameU())
            }
            return selectedTemplate;
        }
        
        if(p_mappingIDsToNames.size()==1 && p_aVisioPages.length==1)
        {
            //nothing to select
            _pagesToBeImported.add("" + p_aVisioPages[0].getNameU())
            return p_sTemplateName
        }
        else
        {
            if (SHOW_DIALOGS) {
                
                var title = "";
                if (overall > 1) {
                    title = formatstring2(getString("DIALOG_SELECT_INPUT_SETTINGS_MULTIPLE_FILES.DBT"), current+1, overall) + ": " + name;
                } else {
                    title = formatstring1(getString("DIALOG_SELECT_INPUT_SETTINGS_ONE_FILE.DBT"), name); 
                }
                
                var result = Dialogs.showDialog(new visioDialog(p_mappingIDsToNames, p_aVisioPages, overall), Constants.DIALOG_TYPE_ACTION, title);
                
                if(result==null)
                    return null;
    
                for(var i in result[1])
                    _pagesToBeImported.add( "" + result[1][i] )
                
                return result[0]
            } else {
                for (var i = 0; i < p_aVisioPages.length; i++) {
                    _pagesToBeImported.add("" + p_aVisioPages[i].getNameU())
                }
                return p_mappingIDsToNames.keySet().toArray()[0];
            }
        }
    }

    this.getMapping = function() //returns T_Mapping
    {
        return _mapping;
    }

    this.getSymbolByNameU = function(sShapeNameU)
    {
        return _mapping.getSymbolByNameU(sShapeNameU)
    }

    this.getGroupName = function()
    {
        var sGroupName = _fVisioName;
        var nIndex = sGroupName.lastIndexOf(".");
        if(nIndex>-1){
            sGroupName = sGroupName.substring(0,nIndex);
        }
        return sGroupName;
    }

    this.getModelName = function(vPage){
        _pageIndex++;

        var sFileName = "";
        if(isExpress())
        {
            sFileName = _fVisioName;
            var nIndex = sFileName.lastIndexOf(".");
            if(nIndex>-1){
                sFileName = sFileName.substring(0,nIndex);
                if(_pageIndex>0)
                    sFileName = sFileName+"_"+_pageIndex;
            }

            sFileName = sFileName + "_";
        }

        if(vPage!=null)
        {
            var namePg = vPage.getName();
            if(namePg==null)
                namePg = vPage.getNameU();
            if(namePg!=null)
                sFileName = sFileName + namePg;
            else
                sFileName = this.getGroupName()
        }

        return sFileName;
    }

    // import page properties
    this.importPageProperties = function(vPage, mNew, g_nLoc){

        var pageProperties = m_loader.getChildrenRecursive(vPage,"Prop");
        var itMap = pageProperties.entrySet().iterator()
        while (itMap.hasNext()){
            var currentPageProperty = itMap.next();
            var arisModelAttribute = checkPropertyMapping( currentPageProperty.getKey() );
            if (arisModelAttribute != null){
                var arisModelAttributeValue = currentPageProperty.getValue();
                if (arisModelAttributeValue != null && arisModelAttributeValue != "")
                    mNew.Attribute(arisModelAttribute, g_nLoc).setValue(arisModelAttributeValue);
            }
        }

        function checkPropertyMapping(value){
            for (var i = 0; i < pagePropertiesList.length; i++){
                var pagePropertiesListItem = pagePropertiesList[i];
                if (pagePropertiesListItem[0].equals(value)) return pagePropertiesListItem[1];
            }
            return null;
        }
    }


    this.removeModel = function(mRemove){
        if(mRemove.Group().Delete(mRemove))
            _pageIndex--;
    }
    this.getNewModelType = function(){
        var sTemplateName = m_loader.getUsedTemplate()
        var nType = -1;
        if(!sTemplateName.equals("")){
            nType = _mapping.getModelTypeByVisioTemplate(sTemplateName);
        }
        return nType;
    }


    this.createCxnOcc = function(model, occSource, occTarget, type, aPoints)
    {
        //care for correct cxn point direction
        var rectSource = new java.awt.Rectangle(occSource.X()-1, occSource.Y()-1, occSource.Width()+2, occSource.Height()+2);
        var rectTarget = new java.awt.Rectangle(occTarget.X()-1, occTarget.Y()-1, occTarget.Width()+2, occTarget.Height()+2);

        // AGA-10727
        if (aPoints == null) {
            aPoints = calcNewCxnPoints(occSource, occTarget);
        }

        if(aPoints.length > 0)
        {
            if(rectTarget.contains( aPoints[0] ) || rectSource.contains(aPoints[aPoints.length-1]) ) //bad direction
            {
                Context.writeLog("Maybe incorrect cxn direction between "+occSource.ObjDef().Name(-1)+" and "+occTarget.ObjDef().Name(-1)+": "+aPoints)
                //aPoints = aPoints.reverse()
            }
        }

        return model.CreateCxnOcc(occSource, occTarget,type, aPoints);
    }

    function calcNewCxnPoints(occSrc, occTrg) {
        var startPoint;
        var endPoint;
        var bTop = false;
        if (occSrc.Y() + occSrc.Height() < occTrg.Y()) {
            // src_bottom->...
            startPoint = new java.awt.Point(occSrc.X() + occSrc.Width()/2, occSrc.Y() + occSrc.Height());
            if (occSrc.X() > occTrg.X() + occTrg.Width()/2) {
                // ...->trg_right
                endPoint = new java.awt.Point(occTrg.X() + occTrg.Width(), occTrg.Y() + occTrg.Height()/2)
            } else if (occSrc.X() + occSrc.Width() < occTrg.X() + occTrg.Width()/2) {
                // ...->trg_left
                endPoint = new java.awt.Point(occTrg.X(), occTrg.Y() + occTrg.Height()/2);
            } else {
                // ...->trg_top
                endPoint = new java.awt.Point(occTrg.X() + occTrg.Width()/2, occTrg.Y());
            }
        } else if (occSrc.Y() > occTrg.Y() + occTrg.Height()) {
            // src_top->...
            startPoint = new java.awt.Point(occSrc.X() + occSrc.Width()/2, occSrc.Y());
            if (occSrc.X() + occSrc.Width()/2 < occTrg.X()) {
                // ...->trg_left
                endPoint = new java.awt.Point(occTrg.X(), occTrg.Y() + occTrg.Height()/2);
            } else if (occSrc.X() + occSrc.Width()/2 > occTrg.X() + occTrg.Width()) {
                // ...->trg_right
                endPoint = new java.awt.Point(occTrg.X() + occTrg.Width(), occTrg.Y() + occTrg.Height()/2)
            } else {
                // ...->trg_bottom
                endPoint = new java.awt.Point(occTrg.X() + occTrg.Width()/2, occTrg.Y() + occTrg.Height());
            }
        } else if (occSrc.X() < occTrg.X()) {
            // src_right->trg_left
            startPoint = new java.awt.Point(occSrc.X() + occSrc.Width(), occSrc.Y() + occSrc.Height()/2);
            endPoint = new java.awt.Point(occTrg.X(), occTrg.Y() + occTrg.Height()/2);
        } else {
            // src_left->trg_right
            startPoint = new java.awt.Point(occSrc.X(), occSrc.Y() + occSrc.Height()/2);
            endPoint = new java.awt.Point(occTrg.X() + occTrg.Width(), occTrg.Y() + occTrg.Height()/2);
        }
        return [startPoint, endPoint];
    }

    function checkMethodFilter(nModelType)
    {
        if(!_method.IsValidModelType(nModelType))
            return false;

        var aSymbols = _mapping.getAllUsedSymbols()
        for(var i=0; i<aSymbols.length; i++)
        {
            if(aSymbols[i]>0)
            {
                 if(!_method.IsValidSymbol(nModelType, aSymbols[i]))
                     return false;
            }
        }
        return true;
    }

    this.processModelGeneration = function(gStart,nModelType){
        var javaInt = new java.lang.Integer(0);
        // var mapMaster = getMasterMapping();
        var mapMaster = m_loader.getMasterMapping(_mapping);

        if(false==checkMethodFilter(nModelType))
        {
            Dialogs.MsgBox(getString("METHOD_FILTER_INSUFF.ERR"));
            return false;
        }

        var nCurrentPage = -1;
        var nSinglePage = Context.getProperty("page-index")
        if(nSinglePage!=null)
            nSinglePage = java.lang.Integer.valueOf(nSinglePage)

        var pgs = m_loader.getPages();
        if(pgs.length>0){
            var gModel = gStart;
            if( !isExpress() ) //an individual group for each visio file
            {
                gModel = gStart.CreateChildGroup(this.getGroupName(), g_nLoc);
            }

            var nPagesTotal = pgs.length;
            var nPercentageInc = 95 / nPagesTotal
            var nPercentage    = 5; //start value after parsing input

            for(var itrPage in pgs){
                var vPage = pgs[itrPage];
                nCurrentPage++;
                g_nZorder = 0;

                if(nSinglePage!=null) // create only the model with given page index
                {
                    nPercentageInc = 95;
                    if(nCurrentPage!=nSinglePage)
                        continue;
                }

                var sModelName = this.getModelName(vPage)
                Context.writeStatus(getString("STATUS_IMPORT_DRW.INF"), nPercentage)

                if( !_pagesToBeImported.contains( ""+vPage.getNameU() ) )
                {
                    nPagesTotal--;
                    nPercentageInc = 95 / nPagesTotal
                    nPercentage += nPercentageInc
                    continue;
                }

                var mNew = gModel.CreateModel(nModelType, sModelName, g_nLoc);
                var importPageProperties = this.importPageProperties(vPage, mNew, g_nLoc);
                mNew.setAttrOccHandling(Constants.ATTROCCHANDLING_BREAKATTR)
                mNew.changeFlag(Constants.MODEL_LAYOUTONOPEN, false); //we get the coordinates from Visio XML

                var shapes = processShapesToPlace(mNew,mapMaster,vPage, null, this, null);
                processComments(mNew, vPage, this)
                //sets the Z order according to the object size to avoid overlapping of big objects over smaller ones
                setZOrder(mNew);

                nPercentage += nPercentageInc/3;
                Context.writeStatus(getString("STATUS_IMPORT_CXNS.INF"), nPercentage)
                var connects = m_loader.getConnects(vPage);   //VConnect[]
                var connections = getARISConnections(vPage, shapes, connects, this);
                shapes.clear();
                var pt = new java.awt.Point(0,0);
                for(var i=0,leni=connections.length;i<leni;i++){
                    var conn = connections[i];
                    if(conn.src!=null && conn.trg!=null)
                    {
                        if(conn.src.bObjOcc==false || conn.trg.bObjOcc==false)
                        {
                            //in this case a visio object has been converted into a FFT or GfxOcc
                            //==>no cxns!
                            Context.writeOutput( formatstring3("Cxn: source (@1) or target (@2) shape of connection in model '@3' not mapped to ARIS object. Connection not imported.", conn.src.nID, conn.trg.nID, sModelName) )
                            continue;
                        }

                        var bCreated = false;
                        var type = _mapping.getCxnType(conn.src.sNameU,conn.trg.sNameU);
                        type = _mapping.getFallbackCxnType(conn.src.ocShape,conn.trg.ocShape, type);
                        if(type>-1){
                            var ccCreated = this.createCxnOcc(mNew,conn.src.ocShape,conn.trg.ocShape,type,conn.points);
                            if(ccCreated!=null)
                            {
                                g_nZorder++
                                ccCreated.setZOrder(g_nZorder);
                                ccCreated.applyTemplate()
                                if(conn.text.length > 0)
                                {
                                    ccCreated.CxnDef().Attribute(cxnPropertyList[0][1], g_nLoc, false).setValue(conn.text);
                                    if(!ccCreated.AttrOcc(cxnPropertyList[0][1]).Exist())
                                        ccCreated.AttrOcc(cxnPropertyList[0][1]).Create(cxnPropertyList[0][2], ArisData.getActiveDatabase().defaultFontStyle() )
                                }
                                for(var iCxnAttr=0; iCxnAttr<cxnPropertyList.length; iCxnAttr++)
                                {
                                    for (var j=0; j<conn.properties.size(); j++) {
                                        if( conn.properties.get(j).equals(cxnPropertyList[iCxnAttr][0]) )
                                        {
                                            ccCreated.CxnDef().Attribute(cxnPropertyList[iCxnAttr][1], g_nLoc, false).setValue( conn.properties.get(cxnPropertyList[iCxnAttr][0] ) );
                                            if(!ccCreated.AttrOcc(cxnPropertyList[iCxnAttr][1]).Exist())
                                                ccCreated.AttrOcc(cxnPropertyList[iCxnAttr][1]).Create(cxnPropertyList[iCxnAttr][2], ArisData.getActiveDatabase().defaultFontStyle() )
                                        }
                                    }
                                }
                                
                                for (var k=0; k<conn.properties.size(); k++) {
                                    var property = conn.properties.get(k);
                                    var label = property.label;
                                    if (label == null) {
                                        label = property.rowName;
                                    }
                                    var nATN = _mapping.getAttr(conn.src.sNameU, conn.trg.sNameU, label, property.dataType);
                                    if(nATN>0)
                                    {
                                        convertProperties(nATN, property, ccCreated.CxnDef());
                                    }
                                }

                                bCreated = true;
                            }
                        }
                        if(!bCreated){ // Fallback, if connection in this direction is not allowed the other direction is tried.
                            type = _mapping.getCxnType(conn.trg.sNameU,conn.src.sNameU);
                            type = _mapping.getFallbackCxnType(conn.trg.ocShape,conn.src.ocShape, type);
                            if(type>-1){
                                //other direction -> reverse cxn point order
                                conn.points = conn.points.reverse()
                                var ccCreated = this.createCxnOcc(mNew,conn.trg.ocShape,conn.src.ocShape,type,conn.points);
                                if(ccCreated!=null)
                                {
                                    g_nZorder++
                                    ccCreated.setZOrder(g_nZorder);
                                    ccCreated.applyTemplate()
                                    if(conn.text.length > 0)
                                    {
                                        ccCreated.CxnDef().Attribute(cxnPropertyList[0][1], g_nLoc, false).setValue(conn.text);
                                        if(!ccCreated.AttrOcc(cxnPropertyList[0][1]).Exist())
                                        ccCreated.AttrOcc(cxnPropertyList[0][1]).Create(cxnPropertyList[0][2], ArisData.getActiveDatabase().defaultFontStyle() )
                                    }
                                    bCreated = true;
                                }
                            }
                        }
                        if(!bCreated){
                            Context.writeOutput( formatstring3("Cxn: no valid ARIS connection type found for connection from shape @1 to shape @2 in model '@3'.",conn.src.nID, conn.trg.nID, sModelName) )
                        }
                    }
                }
                nPercentage += nPercentageInc/3;
                Context.writeStatus(getString("STATUS_IMPORT_CXNS.INF"), nPercentage)


                if(bpmnSupport.isBPMNModelType(nModelType))
                    bpmnSupport.postProcessBPMN(mNew, true, false)
                
                var createdModel = mNew;
                mNew = postProcessCreatedModel(mNew, vPage, m_loader);//interceptor defined in 02 user_defined_steps.js
                if(mNew!=null)
                {
                    createdModel = mNew; //could be re-generated
                    if (!bulkMode && SHOW_DIALOGS && open_models==null) {
                        var answer = Dialogs.MsgBox(getString("DIALOG_OPEN_MODEL.DBI"), Constants.MSGBOX_BTN_YESNO, getString("VISIO_IMPORT.DBT"));
                        open_models = (answer == Constants.MSGBOX_RESULT_YES);
                    }
                    
                    if (open_models) {
                        mNew.openModel() //opens the model after import
                    }
                }
                mapCreatedModels.put( ""+vPage.getNameU(), createdModel.GUID())
                mapCreatedModels.put( getBetterFindableName(""+vPage.getNameU()), createdModel.GUID())

                nPercentage += nPercentageInc/3;
            }
        }

        var itAssignment = mapCreateAssignments.entrySet().iterator() //OBJDEF-GUID --> page nameU
        while(itAssignment.hasNext())
        {
            var currAssignment = itAssignment.next();
            var targetModel    = mapCreatedModels.get( currAssignment.getValue() ) //page NameU -->  MODEL-GUID
            if(targetModel==null)
                targetModel    = mapCreatedModels.get( getBetterFindableName(currAssignment.getValue()) ) //page NameU -->  MODEL-GUID

            if(targetModel!=null)
            {
                var objDef = ArisData.getActiveDatabase().FindGUID(currAssignment.getKey(), Constants.CID_OBJDEF)
                var model = ArisData.getActiveDatabase().FindGUID(targetModel, Constants.CID_MODEL)
                if(objDef!=null && objDef.IsValid() && model!=null && model.IsValid())
                {
                    objDef.CreateAssignment(model)
                }
            }
            else
            {
                Context.writeLog("Assignment creation: model '"+currAssignment.getValue()+"' not found in list of created models:")
                var itModel = mapCreatedModels.entrySet().iterator() //OBJDEF-GUID --> page nameU
                while(itModel.hasNext())
                {
                    Context.writeLog("- "+itModel.next().getKey())
                }
                Context.writeLog("- - - end of list - - -")
            }
        }

        // mNew.doLayout();
        return true
    }

    function getBetterFindableName(sName)
    {
        var sInternal = new java.lang.String(sName)
        sInternal = sInternal.replaceAll("-", "")
        sInternal = sInternal.replaceAll(" ","")
        return ""+sInternal
    }

    SizeComparatorGfx = function(occA, occB)
    {
        var sizeA = occA.getWidth() * occA.getHeight()
        var sizeB = occB.getWidth() * occB.getHeight()
        if(sizeA == sizeB)
            return 0;
        return (sizeA < sizeB) ? 1 : -1;
    }
    SizeComparator = function(occA, occB)
        {
        var sizeA = occA.Width() * occA.Height()
            var sizeB = occB.Width() * occB.Height()
            if(sizeA == sizeB)
            return 0;
        return (sizeA < sizeB) ? 1 : -1;
    }

    function getGroupingMembers(grouping, aObjOccs, aGfxOccs, aTextOccs, mapRefZOrder)
    {
        var aGroupingMember = grouping.getMembers()
        if (typeof aGroupingMember == 'undefined' || aGroupingMember == null) {
            Context.writeLog("invalid grouping: "+grouping)
        }
        for(var i=0; i<aGroupingMember.length; i++)
        {
            if(aGroupingMember[i].getItemKind()==Constants.CID_OBJOCC)
            {
                aObjOccs.push( aGroupingMember[i] )
                mapRefZOrder.put(aGroupingMember[i].ObjectID(), grouping)
            }
            else if(aGroupingMember[i].getItemKind()==Constants.CID_GFXOBJ)
            {
                aGfxOccs.push( aGroupingMember[i] )
            }
            else if(aGroupingMember[i].getItemKind()==Constants.CID_TEXTOCC)
            {
                aTextOccs.push( aGroupingMember[i] )
            }
            else if(aGroupingMember[i].getItemKind()==Constants.CID_UNION)
            {
                getGroupingMembers(aGroupingMember[i], aObjOccs, aGfxOccs, aTextOccs)
            }
        }
    }

    /**
    * sets the Z order according to the object size to avoid overlapping of big objects over smaller ones
    * @param {Model} model containing ObjOccs, TextOccs and GfxOccs
    * @returns {} nothing
    */
    function setZOrder(mNew)
    {
        g_nZorder = 0;

        var aGfx = mNew.getGfxObjects();
        var aObjOccs = mNew.ObjOccList();
        var aTextOccs = mNew.TextOccList();
        var mapRefZorder = new java.util.HashMap()

        //groupings
        var aGroupings = mNew.getGroupings()
        for(var i=0; i<aGroupings.length; i++)
        {
            getGroupingMembers(aGroupings[i], aObjOccs, aGfx, aTextOccs, mapRefZorder)
        }

        //graphical objects first (background)
        aGfx = aGfx.sort(SizeComparatorGfx)
        for(var i=0; i<aGfx.length; i++)
        {
            aGfx[i].setZOrder(g_nZorder++)
        }

        //now all objoccs
        aObjOccs = aObjOccs.sort(SizeComparator)
        for(var i=0; i<aObjOccs.length; i++)
        {
            aObjOccs[i].setZOrder(g_nZorder++)
            if(mapRefZorder.get( aObjOccs[i].ObjectID() )!=null)
            {
                mapRefZorder.get( aObjOccs[i].ObjectID() ).setZOrder(g_nZorder++)
            }
        }

        //on top: all texts
        for(var i=0; i<aTextOccs.length; i++)
        {
            aTextOccs[i].setZOrder(g_nZorder++)
        }
    }

    /**
    * @param {java.util.HashMap} shapes key is the ID of a shape, value is the corresponding object of type VIS_Shape
    * @param {org.jdom2.Element[]} connects List of objects of type org.jdom2.Element
    * @returns {VIS_Connection[]} list of connection definitions.
    */
    function getConnectStartMainShape(tVisio, vPage, shapes, objid)
    {
        if(shapes.containsKey(java.lang.Integer.valueOf(objid)))
        {
            //the start/end shape is a "toplevel" shape. default case.
            return shapes.get(java.lang.Integer.valueOf(objid));
        }
        else
        {
            //the connection docks somewhere to a nested shape of the toplevel shape
            var aShapeTL = tVisio.getLoader().getPageShapes(vPage)
            for(var itShape in aShapeTL)
            {
                var vShapeTL = aShapeTL[itShape];
                if(isSubTreeContainingShapeId(tVisio.getLoader(), vShapeTL, objid))
                {
                    //return the toplevel shape (VIS_Shape) of the subtree containing the shape with the given ID
                    return shapes.get(java.lang.Integer.valueOf( vShapeTL.getID() ));
                }
            }
        }
        return null;
    }

    function isSubTreeContainingShapeId(p_loader, vShapeTL, objid)
    {
        var aShape = p_loader.getChildShapes(vShapeTL)
        for(var itShape in aShape)
        {
            var vShape = aShape[itShape];
            if( parseInt(vShape.getID()) == parseInt(objid) )
                return true;
            else
                if(isSubTreeContainingShapeId(p_loader, vShape, objid))
                    return true;
        }
        return false;
    }

    /**
     * @param vPage VPage[]: page item
    * @param shapes {java.util.HashMap}: shapes key is the ID of a shape, value is the corresponding
    * object of type VIS_Shape
    * @param connects VConnect[] : List of connections
    * @param tVisio main class
    * @returns {VIS_Connection[]} list of connection definitions.
    */
    function getARISConnections(vPage, shapes, connects, tVisio){
        var map = new java.util.HashMap();
        var javaInt = new java.lang.Integer(0);

        var visPointOfReference = tVisio.getLoader().createNewVisPointOfReference(vPage)

        for(var i=0;i<connects.length;i++)
        {
            var connEl = connects[i];
            var connid = connEl.getFromSheet();
            var dir = connEl.getFromCell();
            var objid = connEl.getToSheet();
            if(connid!=null && dir!=null && objid!=null){
                var obj = getConnectStartMainShape(tVisio, vPage, shapes, objid)//if(shapes.containsKey(javaInt.valueOf(objid))){var obj = shapes.get(javaInt.valueOf(objid));
                if(obj!=null) {
                    if(obj.ocShape!=null){
                        // var ocObj = obj.ocShape;

                        if(dir.equals("BeginX")){ // Connect for source object
                            var conn = null
                            if(map.containsKey(javaInt.valueOf(connid))){
                                conn = map.get(javaInt.valueOf(connid));
                            }
                            else
                            {
                                conn = new VIS_Connection();
                                conn.initPoints(tVisio, visPointOfReference, connid, vPage, connEl)
                            }

                            conn.src = obj;
                            map.put(javaInt.valueOf(connid),conn);
                        }else if(dir.equals("EndX")){ // connect for target object
                            var conn = null
                            if(map.containsKey(javaInt.valueOf(connid))){
                                conn = map.get(javaInt.valueOf(connid));
                            }
                            else
                            {
                                conn = new VIS_Connection();
                                conn.initPoints(tVisio, visPointOfReference, connid, vPage, connEl)
                            }

                            conn.trg = obj;
                            map.put(javaInt.valueOf(connid),conn);
                        }else{
                            Context.writeOutput("FromCell attribute must either contain value BeginX or EndX!")
                        }
                    }
                }else{
                    Context.writeOutput("Connected object (target) does not exist in mapping.")
                }
            }else{
                Context.writeOutput("Incomplete connection data specified in Visio-XML!")
            }
        }
        return map.values().toArray();
    }

    function VIS_ShapeToProcess(p_loader){
        var m_loader = p_loader;
        var vShape = null;
        var bIsGrouping = false;
        var bIsFreeFormText = false;
        var nSymbol = 0;//0:mapped to free-form-text or gfx, >0:ARIS symbol number
        var properties = null;//Visio elements <Prop NameU="P-name"><Value ...>the value</Value></Prop>

        //init element and properties
        this.init = function(vShape)
        {
            this.vShape = vShape;
            this.oldProperties = m_loader.getShapeProperties(vShape);//pre10.0.4 version should use: thafixed_getShapeProperties(vShape)
            this.properties = m_loader.getVisioShapeProperties(vShape);
        }
    }
    
    function thafixed_getShapeProperties(vShape)
    {
        //default code: return m_loader.getShapeProperties(vShape);
        var result = new java.util.HashMap()
        var namespace = vShape.getShapeElement().getNamespace()
        
        var elPropList = vShape.getShapeElement().getChildren("User", namespace)
        var itelPropList = elPropList.iterator();
        while(itelPropList.hasNext())
        {
            var elProp = itelPropList.next()
            var elValue = elProp.getChild("Value", namespace);
            var sName = elProp.getAttributeValue("NameU");
            if (sName != null && elValue != null)
                result.put("" + sName, "" + elValue.getText());
        }

        elPropList = vShape.getShapeElement().getChildren("Prop", namespace)
        var itelPropList = elPropList.iterator();
        while(itelPropList.hasNext())
        {
            var elProp = itelPropList.next()
            var elValue = elProp.getChild("Value", namespace);
            var sName = elProp.getAttributeValue("NameU");
            if (sName != null && elValue != null)
                result.put("" + sName, "" + elValue.getText());
        }
        
        elPropList = vShape.getShapeElement().getChildren("Field", namespace)
        var itelPropList = elPropList.iterator();
        while(itelPropList.hasNext())
        {
            var elProp = itelPropList.next()
            var elValue = elProp.getChild("Value", namespace);
            var sName = elProp.getAttributeValue("NameU");
            if (sName != null && elValue != null)
                result.put("" + sName, "" + elValue.getText());
        }

        return result;
    }

    function VIS_Connection(){
        this.src; // source-shape of Type VIS_Shape
        this.trg; // target-shape of Type VIS_Shape
        this.points;
        this.text;
        this.properties;

        // initializes the connection points
        this.initPoints = function(tVisio, visPointOfReference, sConnId, vPageOrShape, elConnect)
        {
            this.text = ""

            var lstVShape
            if("Page".equals(""+vPageOrShape.name()))
                lstVShape = tVisio.getLoader().getPageShapes(vPageOrShape)
            else
                lstVShape = tVisio.getLoader().getChildShapes(vPageOrShape)

            var elShapeV = null;
            for(var itShape in lstVShape )
            {
                var vShape = lstVShape[itShape]

                var sType = vShape.getType()
                if(sType!=null && sType.equals("Group"))
                {
                    var newVisPointOfReference = visPointOfReference.copy();
                    newVisPointOfReference.initPointRef(tVisio.getLoader(), vShape, true)
                    var result = this.initPoints(tVisio, newVisPointOfReference, sConnId, vShape, elConnect)
                    if(result)
                        return true; //initialized during recursion
                }

                if(sConnId.equals(vShape.getID()) )
                {
                    elShapeV = vShape;
                    break;
                }
            }

            if(elShapeV!=null)
            {
                //lines are inside the box of the cxn:
                var newVisPointOfReference = visPointOfReference.copy();
                newVisPointOfReference.initPointRef(tVisio.getLoader(), elShapeV, true)

                this.points = tVisio.getLoader().getLinePoints(elShapeV, newVisPointOfReference)

                this.text = getShapeText(tVisio, elShapeV );
                this.properties =  tVisio.getLoader().getVisioShapeProperties(elShapeV);//pre10.0.4 version should use: thafixed_getShapeProperties(elShapeV);
                return true
            }//elShapeV!=null
        }
        return false;
    }

//BLUE-4197, Vodafone: Visio import with linefeeds in object names
//BLUE-4198, replace strange linefeed characters in attributes
function getShapeText(tVisio, vShape)
{
    var sText = getTextInternal(tVisio, vShape)

    var idx = searchFor8232(sText);
    while (idx >= 0) {
        var sNewText = sText.substring(0, idx) + "\n" + sText.substring(idx+1, sText.length)
        sText = sNewText;

        idx = searchFor8232(sText);
    }
    return sText!=null? sText : "";

    //search for text recursively
    function getTextInternal(tVisio, vShape)
    {
        // First check if connected text attribute is maintained
        var eText = ""+vShape.getText();
        if (eText.length>0)
            return eText;
        else
        {
            var shapes = tVisio.getLoader().getChildShapes( vShape );
            for (var itShape in shapes)
            {
                var text = getTextInternal(tVisio, shapes[itShape]);
                if(text!=null)
                    return text;
            }
            return null;
        }
    }

    function searchFor8232(sText) {
        if(sText==null)
            return -1;

        for (var i = 0; i < sText.length; i++) {
            if (sText.charCodeAt(i) == 8232)
                return i;
        }
        return -1;
    }
}



    function processComments(mModel, vPage, tVisio)
    {
        visPointOfReference = m_loader.createNewVisPointOfReference(vPage)

        //map ID(Integer->name)
        var mapReviewers = m_loader.getReviewers()
        var vAnnotationArray = m_loader.getPageAnnotations(vPage)

        for(var iAnn in vAnnotationArray)
        {
            var vAnn = vAnnotationArray[iAnn];

            var ptPosition = visPointOfReference.getLinePoint(vAnn.ptRaw);
            var ocShape = mModel.CreateTextOcc( ptPosition.getX(), ptPosition.getY(), vAnn.comment )
            ocShape.setDisplayAsPostIt(true)

            var sReviewer = mapReviewers.get(vAnn.nReviewerID)
            if( sReviewer!=null )
            {
                ocShape.TextDef().Attribute(Constants.AT_NAME, g_nLoc).setStyledValue("<html><b>"+sReviewer+"</b><br>"+vAnn.comment+"</html>") 
                break;
            }
        }
    }

    function T_Shape2Aris(p_toProcess, p_arisOcc)
    {
        //public members
        this.shapeToProcess = p_toProcess;//VIS_ShapeToProcess
        this.shapeArisOcc = p_arisOcc;//VIS_Shape
    }



    /**
    * @param {Model} mModel model to place new occurrences.
    * @param {java.util.HashMap} mapReferenceShape shapes of masters-element: master-ID -> VIS_Master
    * @param {org.jdom2.Element} elPage page-element of which shapes are searched.
    * @param {Array<String>} aAggregatedTexts: null for toplevel. an array in case of a _mapped_ toplevel shape (corresponding symbol exists!) which is a group in visio
    * key: master id as integer; value: object of type VIS_Master.
    */
    function processShapesToPlace(mModel,mapReferenceShape,vPageOrShape, visPointOfReference, tVisio, aAggregatedTexts){
        var javaInt = new java.lang.Integer(0);
        var shapeS = new java.util.HashMap();

        var listAllCreatedShapes = new java.util.LinkedList();//T_Shape2Aris=(shapeToProcess VIS_ShapeToProcess + shapeArisOcc VIS_Shape)

        var childShapes = null;//VShape
        if(visPointOfReference==null) // tolevel call for a page
        {
            visPointOfReference = tVisio.getLoader().createNewVisPointOfReference(vPageOrShape)
            childShapes = tVisio.getLoader().getPageShapes(vPageOrShape)  //VShape[]
        }
        else
        {
            childShapes = tVisio.getLoader().getChildShapes(vPageOrShape)  //VShape[]
        }

        ArisData.Save(Constants.SAVE_ONDEMAND)
        for(var itrShape in childShapes)
        {
            var vShape = childShapes[itrShape];  //VShape
            var sMaster = vShape.getMaster();
            var sType = vShape.getType()
            var shapesToProcess = new Array(); //[VIS_ShapeToProcess:vShape, bIsGrouping]

            //check grouping first, because in visio a grouping can have a master shape (ex: "Legend")
            if(sType!=null && sType.equals("Group"))
            {
                // search alle shapes refering master-shape
                var visShapeToProcess = new VIS_ShapeToProcess( tVisio.getLoader() )
                visShapeToProcess.init( vShape );
                visShapeToProcess.bIsGrouping = true;
                visShapeToProcess.nSymbol = 0;

                if(sMaster!=null && !mapReferenceShape.containsKey(javaInt.valueOf(sMaster)))
                {
                    Context.writeLog("The following MasterID is missing in mapping: "+sMaster )
                }

                if(sMaster==null) //a shape in the model without reference to the master
                {
                    if( tVisio.getLoader().isShapeFreeFormText(vShape) )
                    {
                        visShapeToProcess.nSymbol = 0;
                        visShapeToProcess.bIsFreeFormText = true
                    }
                    else
                    {
                        visShapeToProcess.nSymbol = tVisio.getSymbolByNameU("any")
                        visShapeToProcess.bIsFreeFormText = (visShapeToProcess.nSymbol==0)
                    }
                    if(visShapeToProcess!=null && visShapeToProcess.nSymbol >=0)
                        shapesToProcess.push(visShapeToProcess);
                }
                else if(sMaster!=null && mapReferenceShape.containsKey(javaInt.valueOf(sMaster))) //for example in OrgCharts the toplevel shape is a group (having a Master shape): stores the object name
                {
                    visShapeToProcess.bIsFreeFormText = true

                    var masterSymbolNum = mapReferenceShape.get(javaInt.valueOf(sMaster)).getMasterSymbolNum()
                
                    if( masterSymbolNum == undefined)
                        Dialogs.MsgBox("mapReferenceShape.get("+nMasterID+").getMasterSymbolNum() is undefined!")
                    else
                    {
                         if(masterSymbolNum>0)
                         {
                             visShapeToProcess.bIsFreeFormText = false;
                             visShapeToProcess.nSymbol = masterSymbolNum;
                         }
                         else if(masterSymbolNum==-2)
                         {
                             //a mapped object which should not be mapped at top level, but treated as a grouping only!
                             //9.5:
                             //visShapeToProcess.bIsFreeFormText = false;
                             //visShapeToProcess.nSymbol = -1;
                             //JPMC
                             visShapeToProcess = null;

                            /* //this code would use information from the master shape if present:
                            //but in case of "legend" this is not a good idea, because it has a default width (does not match the placed legend object!)
                            //                                                 and an "undefined" text section is written instead of the shape names.
                            var elTShapeList = m_loader.getMasterShapeRootShapes(sMaster)
                            var itTShape = elTShapeList.iterator();
                            while(itTShape.hasNext())
                            {
                                var elTemplateShape = itTShape.next()

                                var xfCorrectPosition = vShape.getChild("XForm",_ns)
                                var xfTplPosition = elTemplateShape.getChild("XForm",_ns)
                                xfTplPosition.getChild("PinX",_ns).setText(xfCorrectPosition.getChild("PinX",_ns).getText())
                                xfTplPosition.getChild("PinY",_ns).setText(xfCorrectPosition.getChild("PinY",_ns).getText())
                                xfTplPosition.getChild("LocPinX",_ns).setText(xfCorrectPosition.getChild("LocPinX",_ns).getText())
                                xfTplPosition.getChild("LocPinY",_ns).setText(xfCorrectPosition.getChild("LocPinY",_ns).getText())
                                xfTplPosition.getChild("Width",_ns).setText(xfCorrectPosition.getChild("Width",_ns).getText())
                                xfTplPosition.getChild("Height",_ns).setText(xfCorrectPosition.getChild("Height",_ns).getText())
                                var visMasterShapeToProcess = new VIS_ShapeToProcess()
                                visMasterShapeToProcess.init(vShape, tVisio.getNamespace())
                                visMasterShapeToProcess.bIsGrouping = true;
                                visMasterShapeToProcess.bIsFreeFormText = false;
                                visMasterShapeToProcess.nSymbol = -1;
                                shapesToProcess.push(visMasterShapeToProcess);
                            }
                            */
                         }
                         else if(masterSymbolNum==-1)
                         {
                             //stupid visio cxn object
                             visShapeToProcess = null;
                         }
                    }
                }

                if(visShapeToProcess!=null)
                    shapesToProcess.push(visShapeToProcess);
            }
            else if(sMaster!=null && mapReferenceShape.containsKey(javaInt.valueOf(sMaster)))
            {
                //"Master" is undefined for groupings, so here we process only non-groupings
                // shape refereing master-shape
                var visShapeToProcess = new VIS_ShapeToProcess( tVisio.getLoader() )
                visShapeToProcess.init(vShape);
                visShapeToProcess.bIsGrouping = false;
                visShapeToProcess.bIsFreeFormText = false
                visShapeToProcess.nSymbol = 0

                var masterSymbolNum = mapReferenceShape.get(javaInt.valueOf(sMaster)).getMasterSymbolNum()
                if( masterSymbolNum == undefined)
                    Dialogs.MsgBox("mapReferenceShape.get("+nMasterID+").getMasterSymbolNum() is undefined!")
                else
                {
                    if(masterSymbolNum>0)
                    {
                        visShapeToProcess.nSymbol = masterSymbolNum;
                    }
                    else if(masterSymbolNum==-1)
                    {
                        //stupid visio cxn object
                        visShapeToProcess = null;
                    }
                }

                if(visShapeToProcess!=null)
                    shapesToProcess.push(visShapeToProcess);
            }
            else if(sType!=null && sType.equals("Shape") && sMaster==null)
            {
                if((""+vPageOrShape.name()).equals("Shape")) //we have a grouped shape whitout a master here: if parent is to be imported: create simple graphical objects herer
                {
                    //add our text to parent's text (do nothing here, will be done later)
                }
                else
                {
                    //shape without a master ==> a free-form text
                    var visShapeToProcess = new VIS_ShapeToProcess( tVisio.getLoader() )
                    visShapeToProcess.init(vShape)
                    visShapeToProcess.bIsGrouping = false;

                    if( tVisio.getLoader().isShapeFreeFormText(vShape) )
                    {
                        visShapeToProcess.nSymbol = 0;
                        visShapeToProcess.bIsFreeFormText = true
                    }
                    else
                    {
                        visShapeToProcess.nSymbol = tVisio.getSymbolByNameU("any")
                        visShapeToProcess.bIsFreeFormText = (visShapeToProcess.nSymbol==0)
                        postProcessShapeWithoutMaster(tVisio, mapReferenceShape, visShapeToProcess)
                    }
                    shapesToProcess.push(visShapeToProcess);
                }
            }

            // ****************************************************
            // shapes refering master-shapes has to be processed.
            // createOcc of shape-elements
            for(var i=0;i<shapesToProcess.length;i++)
            {
                var occsToBeGrouped = new Array();
                var aAggregatedTextsNew = null;
                var toplevelShape       = null;

                if(shapesToProcess[i].bIsGrouping)
                {
                    // a grouping where the group element has a master shape
                    var visShape = null;

                    if(shapesToProcess[i].nSymbol>0) //a mapped ARIS symbol
                    {
                        var bSubShapesProcessed = false;
                        visShape = createVisualShape(tVisio,mModel, shapesToProcess[i], mapReferenceShape, visPointOfReference, aAggregatedTexts)
                        if(visShape!=null)
                        {
                            occsToBeGrouped.push( visShape.ocShape );
                            shapeS.put(visShape.nID, visShape);
                            bSubShapesProcessed = processSubShapesOfArisObject(tVisio, visShape, shapesToProcess[i]) //interceptor for user defined behaviour
                        }
                        toplevelShape = visShape

                        if(!bSubShapesProcessed)
                            aAggregatedTextsNew = new Array() //we have found a mapped shape which contains a sub-ordinate grouping in visio: collect the texts below!
                    }
                    else if(shapesToProcess[i].nSymbol==0)//Visio shape mapped to 0 ==> graphical object or free form text
                    {
                        var ocShape = createTextOcc(tVisio, mModel, shapesToProcess[i].vShape, visPointOfReference, aAggregatedTexts)
                        if(ocShape!=null)
                        {
                            visShape = createVisualShapeForGfxOrFFT(shapesToProcess[i], ocShape)
                            shapeS.put(visShape.nID, visShape);
                            occsToBeGrouped.push( ocShape );
                        }
                    }
                    else if(shapesToProcess[i].bIsFreeFormText) //no master shape
                    {
                        var ocShape = createTextOcc(tVisio, mModel, shapesToProcess[i].vShape, visPointOfReference, aAggregatedTexts)
                        if(ocShape!=null)
                        {
                            visShape = createVisualShapeForGfxOrFFT(shapesToProcess[i], ocShape)
                            shapeS.put(visShape.nID, visShape);
                            occsToBeGrouped.push( ocShape );
                        }
                    }

                    if(visShape!=null)
                    {
                        listAllCreatedShapes.add( new T_Shape2Aris(shapesToProcess[i], visShape) );
                    }
                    //recursion using the grouping as parent "<page>" elemtent

                    //transfer coordinate offset for contained shapes
                    var newVisPointOfReference = visPointOfReference.copy();
                    newVisPointOfReference.initPointRef(tVisio.getLoader(), shapesToProcess[i].vShape, true)

                    var aToAggregate = (aAggregatedTextsNew!=null)?aAggregatedTextsNew:aAggregatedTexts;
                    var mapResult = null;
                    if(shapesToProcess[i].nSymbol<=0) //not a mapped ARIS symbol -> evaluate the tree beneath (for reals symbols this would return a bunch of trash gfx objs)
                        mapResult = processShapesToPlace(mModel,mapReferenceShape,shapesToProcess[i].vShape, newVisPointOfReference, tVisio, aToAggregate)
                    if(mapResult!=null && mapResult.size()>0)
                    {
                        var itMerge = mapResult.entrySet().iterator()
                        while(itMerge.hasNext())
                        {
                            var oShape = itMerge.next();
                            occsToBeGrouped.push( oShape.getValue().ocShape );
                            shapeS.put(oShape.getKey(),oShape.getValue());
                        }
                        //THA: next line commented out because of SAG-Model had strange groupings of ObjOcc+4mini-shapes
                        //...but minishapes should be away now, after only rects sized > (0,0) are imported
                        mModel.createGrouping( occsToBeGrouped )
                    }

                    //handle subordinate texts of mapped shapes
                    if(aAggregatedTexts!=null && aAggregatedTextsNew!=null)
                    {
                        for(var i=0; i<aAggregatedTextsNew.length; i++)
                            aAggregatedTexts.push(aAggregatedTextsNew[i])
                    }
                    else if(aAggregatedTextsNew!=null && toplevelShape!=null)//a toplevel mapped shape which has collected subordinate texts
                    {
                        var sName = String(toplevelShape.ocShape.ObjDef().Attribute(Constants.AT_NAME,g_nLoc).getValue());
                        for(var j=0; j<aAggregatedTextsNew.length; j++)
                        {
                            if(sName.length>0)
                                sName = sName + "\n"
                            sName = sName + aAggregatedTextsNew[j]
                        }
                        toplevelShape.ocShape.ObjDef().Attribute(Constants.AT_NAME,g_nLoc).setValue(sName)
                    }

                    continue; //all done
                }
                else if( shapesToProcess[i].bIsFreeFormText )
                {
                    var ocShape = createTextOcc(tVisio, mModel, shapesToProcess[i].vShape, visPointOfReference, aAggregatedTexts)
                    if(ocShape!=null)
                    {
                        var visShape = createVisualShapeForGfxOrFFT(shapesToProcess[i], ocShape)
                        shapeS.put(visShape.nID, visShape);
                        listAllCreatedShapes.add( new T_Shape2Aris(shapesToProcess[i], visShape) );
                    }
                }
                else //place an obj occ in the model
                {
                    var vShape = shapesToProcess[i].vShape;    //VShape
                    // try{
                        if(shapesToProcess[i].nSymbol>-1)
                        {
                            if(shapesToProcess[i].nSymbol>0) //a mapped ARIS symbol
                            {
                                var visShape = createVisualShape(tVisio, mModel, shapesToProcess[i], mapReferenceShape, visPointOfReference, aAggregatedTexts)
                                if(visShape!=null)
                                {
                                    shapeS.put(visShape.nID, visShape);
                                    listAllCreatedShapes.add( new T_Shape2Aris(shapesToProcess[i], visShape) );
                                }
                            }
                            else //Visio shape mapped to 0 ==> graphical object or free form text
                            {
                                var ocShape = createTextOcc(tVisio, mModel, shapesToProcess[i].vShape, visPointOfReference, aAggregatedTexts)
                                if(ocShape!=null)
                                {
                                    var visShape = createVisualShapeForGfxOrFFT(shapesToProcess[i], ocShape)
                                    shapeS.put(visShape.nID, visShape);
                                    listAllCreatedShapes.add( new T_Shape2Aris(shapesToProcess[i], visShape) );
                                }
                            }
                        }
                        else if(vShape.getType()!=null && vShape.getType().equals("Group"))
                        { // search underlying shape elements
                            var ptPosAbsolute = 0;
                            var sMasterID = vShape.getMaster()
                            try {
                                var nMasterID = javaInt.valueOf( sMasterID );
                                processShapeTreeBeneath(mModel,vShape,mapReferenceShape.get(nMasterID),visPointOfReference,shapeS,tVisio, mapReferenceShape);
                            }
                            catch(e)
                            {
                               var line = e.lineNumber
                               var message = e.message
                               var filename = e.fileName
                               Dialogs.MsgBox("Error: cannot access master of a Visio shape group.\n"+message+" ("+line+")")
                            }
                        }
                    // }catch(e){
                        // TODO Fehlermeldung
                        // Dialogs.MsgBox("Fehler");
                    // }
                }
            }
        }
        ArisData.Save(Constants.SAVE_NOW)
        ArisData.Save(Constants.SAVE_AUTO)

        if(aAggregatedTexts==null) //only for toplevel!
        {
            postProcessCreatedObjects(tVisio, listAllCreatedShapes);
        }

        return shapeS;
    }

    /**
    * @param {Model} ARIS model object
    * @param {VIS_ShapeToProcess} the shape element to be processed
    * @param {int} nMasterID: the ID of the Master-Shape
    * @param {visPointOfReference} point of reference for determining the coordinates
    * @returns {VIS_Shape} or null: the created shape
    */
    function createVisualShape(tVisio, mModel, shapeToProcess, mapReferenceShape, visPointOfReference, aAggregatedTexts)
    {
        var javaInt = new java.lang.Integer(0);

        // createOcc
        var ocShape = createArisObject(tVisio, mModel, shapeToProcess.nSymbol, shapeToProcess.vShape, visPointOfReference, shapeToProcess.properties, mapReferenceShape);
        if(ocShape!=null && ocShape.IsValid()){
            // TODO alle occs zurückgeben inkl. nameU usw., damit kanten gezogen werden könenn
            var nID = -1;
            try{ nID = javaInt.valueOf(shapeToProcess.vShape.getID()); }catch(e){}

            var sNameUShape;
            var sMasterID = shapeToProcess.vShape.getMaster()
            if(sMasterID!=null && sMasterID.length()>0)
            {
                var nMasterID = javaInt.valueOf(shapeToProcess.vShape.getMaster());
                sNameUShape = mapReferenceShape.get(nMasterID).getMasterNameU();
            }
            else
            {
                sNameUShape = "Shape";//no master
            }

            var visShape = new VIS_Shape();
            visShape.nID = nID;
            visShape.sNameU = sNameUShape;
            visShape.ocShape = ocShape;
            visShape.bObjOcc = true;
            return visShape;
        }
        else
            return null;
    }

    /**
    * @param {Model} ARIS model object
    * @param {VIS_ShapeToProcess} the shape element already processed
    * @param {Occ} TextOcc or GfxOcc
    * @returns {VIS_Shape} or null: the created shape
    */
    function createVisualShapeForGfxOrFFT(shapeToProcess, ocShape)
    {
        var nID = -1;
        try{ nID = java.lang.Integer.valueOf(shapeToProcess.vShape.getID()); }catch(e){}

        var visShape = new VIS_Shape();
        visShape.nID = nID;
        visShape.sNameU = "Shape";
        visShape.ocShape = ocShape;
        visShape.bObjOcc = false;
        return visShape;
    }

    /**
    * @param {Model} mModel
    * @param {vShape} vShapeTopLevel  shape with Master-ID as reference to masters
    * @param {VIS_Master} visMasterInfo
    * @param {org.jdom2.Element} elPage actual Page-Element.
    * @returns {}
    */
    function processShapeTreeBeneath(mModel,vShapeTopLevel,visMasterInfo,visPointOfReference,shapesToAdd, tVisio, mapReferenceShape){
        var javaInt = new java.lang.Integer(0);

        var shapes = tVisio.getLoader().getChildShapes( vShapeTopLevel );
        for(var itr in shapes){
            // try{
                var vShape = shapes[itr];
                var sMasterShapeID = vShape.getMaster();
                if(sMasterShapeID!=null){
                    var nSymNum = visMasterInfo.getShapeSymbolNumOfMasterShapeByShapeID(sMasterShapeID);
                    if(nSymNum>-1){
                        var ocNew = createArisObject(tVisio, mModel,nSymNum,vShape,visPointOfReference,null, mapReferenceShape);
                        if(ocNew!=null && ocNew.IsValid()){
                            var sNameUShape = visMasterInfo.getShapeNameUOfMasterByShapeID(sMasterShapeID);
                            var visShape = new VIS_Shape();
                            visShape.nID = javaInt.valueOf(vShape.getID());
                            visShape.sNameU = sNameUShape;
                            visShape.ocShape = ocNew;
                            visShape.bObjOcc = true;
                            shapesToAdd.put(visShape.nID,visShape);
                            return true;
                        }
                    }
                    else
                    {
                        var result = false
                        if(vShape.getType()!=null && vShape.getType().equals("Group"))
                        {
                            result =processShapeTreeBeneath(mModel,vShape,visMasterInfo,visPointOfReference,shapesToAdd,tVisio, mapReferenceShape)
                        }

                        if(!result)
                        {
                            //fallback: no shape found
                            var sNameUShape = vShapeTopLevel.getNameU();
                            if(sNameUShape!=null)
                            {
                                nSymNum = tVisio.getSymbolByNameU(sNameUShape)
                                if(nSymNum == undefined)
                                {
                                    Dialogs.MsgBox("tVisio.getSymbolByNameU("+sNameUShape+")")
                                    continue
                                }
                                var ocNew = createArisObject(tVisio, mModel,nSymNum,vShape,visPointOfReference,null, mapReferenceShape);
                                if(ocNew!=null && ocNew.IsValid()){
                                    var visShape = new VIS_Shape();
                                    visShape.nID = javaInt.valueOf(vShape.getID());
                                    visShape.sNameU = sNameUShape;
                                    visShape.ocShape = ocNew;
                                    visShape.bObjOcc = true;
                                    shapesToAdd.put(visShape.nID,visShape);
                                    return true;
                                }
                            }
                        }
                    }
                }

            // }catch(e){
                // TODO Fehlermeldung Visio-XML-Struktur falsch interpretiert
                // Dialogs.MsgBox("Visio-XML-Struktur falsch interpretiert")
            // }
        }
        return false;
    }

    function createArisObject(tVisio, mNew,nSymNum,vShape,visPointOfReference, shapeProperties, mapReferenceShape){

        var sText = getShapeText(tVisio, vShape);
        var gModel = mNew.Group();
        var objtype = _method.SymbolObjType(nSymNum);
        if(objtype!=null && objtype>-1)
        {
            sText = new String(sText) //JS string!
            var sName = sText
            if(sName.length>250) //max. length for AT_NAME
            {
                sName = sName.substr(0,249) //now this has become a JS string object!
            }
            var odShape = createNewObjDef(gModel, objtype, nSymNum, sName, g_nLoc); //defined in imported "02 user_defined_steps.js" to enable customized handling!
            if(odShape!=null && odShape.IsValid()){

                var sModelLink = m_loader.getHyperlink(vShape);
                if(sModelLink.length>0)
                {
                    mapCreateAssignments.put(odShape.GUID(), sModelLink)
                }

                if(sName.length<sText.length)
                {
                    try{
                        odShape.Attribute(Constants.AT_DESC, g_nLoc).setValue(sText)
                    } catch(e) {;}
                }

                //shape properties <prop>: use object attribute mapping
                if(shapeProperties==null) //not read yet
                {
                    var visShapeDummy = new VIS_ShapeToProcess( tVisio.getLoader() )
                    visShapeDummy.init(vShape);
                    shapeProperties = visShapeDummy.properties;
                }
                
                for (var k=0; k<shapeProperties.size(); k++) {
                    var property = shapeProperties.get(k);
                    var nATN = getObjectAttributeMapping(property)
                    if(nATN>0)
                    {
                        try{
                            odShape.Attribute(nATN, g_nLoc).setValue(property.value)
                        } catch(e) {;}
                    }
                    else
                    {
                        try{
                            var label = property.label;
                            if (label == null) {
                                label = property.rowName;
                            }
                            
                            var sNameUShape;
                            if (vShape.getNameU()==null) {
                                var sMasterID = vShape.getMaster();
                                if(sMasterID!=null && sMasterID.length()>0)
                                {
                                    var javaInt = new java.lang.Integer(0);
                                    var nMasterID = javaInt.valueOf(vShape.getMaster());
                                    sNameUShape = mapReferenceShape.get(nMasterID).getMasterNameU();
                                } else {
                                    sNameUShape = vShape.getNameU();
                                }
                            } else {
                                sNameUShape = vShape.getNameU();
                            }
                            
                            var splitted = sNameUShape.split("\\.");
                            
                            if (splitted.length > 1 && !splitted[splitted.length-1].isNaN) {
                                sNameUShape = sNameUShape.substring(0, sNameUShape.lastIndexOf("."))
                           }
                            
                            nATN = _mapping.getAttr(sNameUShape, label, property.dataType);
                            if(nATN>0)
                            {
                                convertProperties(nATN, property, odShape);
                            }
                            else
                            {
                                Context.writeLog("Visio object property not mapped: " + property.label + ". For object: " + sName);
                            }
                        } catch(e) {;}
                    }
                }
                
                var ptPosition = getARISPosition(tVisio, visPointOfReference,vShape);
                var ocShape = mNew.createObjOcc(nSymNum,odShape,ptPosition.getX(),ptPosition.getY(),true);
                if(ocShape!=null && ocShape.IsValid())
                {
                    //set the object's type name displayed in the "properties" window
                    if(_method.isUserDefinedSymbol(nSymNum))
                        odShape.setDefaultSymbolGUID(_method.UserDefinedSymbolTypeGUID(nSymNum),false)
                    else
                        odShape.setDefaultSymbolNum(nSymNum,false);

                    var ptSize = getArisSize(visPointOfReference, vShape)
                    if(ptSize!=null)
                    {
                        ocShape.SetSize(ptSize.x,ptSize.y); //this moves the position (seems trying to be intelligent... :-( )
                        ocShape.SetPosition(ptPosition.getX(),ptPosition.getY())
                    }

                    var sFill = m_loader.getShapeFillPattern(vShape)
                    if(sFill!=null && shouldUseVisioFillColor(nSymNum)) //interceptor defined in 02 user_defined_steps.js
                    {
                        try
                        {
                            if( !sFill.equals("0") )
                            {
                                var color = m_loader.getColor( m_loader.getShapeFillForeground(vShape) )
                                if(color!=null)
                                    ocShape.setFillColor( color );
                            }
                        }
                        catch(e){;}
                    }

                    var nHAlign = m_loader.getAlignH(vShape);
                    var nVAlign = m_loader.getAlignV(vShape);
                    if(nHAlign!=1 || nVAlign!=1)
                    {
                        var attrOcc = ocShape.AttrOcc(Constants.AT_NAME)
                        switch(nHAlign)
                        {
                            case 0:
                            attrOcc.setAlignment(Constants.ATTROCC_ALIGN_LEFT)
                            break;
                            case 1:
                            attrOcc.setAlignment(Constants.ATTROCC_ALIGN_CENTER)
                            break;
                            case 2:
                            case 3:
                            attrOcc.setAlignment(Constants.ATTROCC_ALIGN_RIGHT)
                            break;
                        }

                        var aOptions = attrOcc.GetPortOptions()
                        if(aOptions.length>0 && (aOptions[0]==Constants.ATTROCC_CENTER || aOptions[0]==Constants.ATTROCC_PORT_FREE ))
                        {
                            attrOcc.SetPortOptions(Constants.ATTROCC_PORT_FREE, 0)
                            attrOcc.setTextBoxSize(ptSize.x,ptSize.y) //defines a text box with same size as the occ
                            attrOcc.SetOffset ( 0, 0) //text box fills entire occ interior
                        }
                        /*
                        //since ARIS doesn't know "bottom"-aligned text in the box, or "vertically centered in box" we could move
                        //the entire box, but this doesn't look nice:
                        var vPosition = 0 //centered
                        var nFontHeight = ArisData.getActiveDatabase().defaultFontStyle().Font(Context.getSelectedLanguage()).Size()
                        if(nVAlign==0) //top
                            vPosition = -ptSize.y/2 + 2*nFontHeight + 5
                        if(nVAlign==2) //bottom
                            vPosition = ptSize.y/2 - 2*nFontHeight - 5

                        attrOcc.SetOffset ( 0, vPosition)
                        */
                    }

                    return ocShape;
                }else{
                    // TODO Fehlermeldung
                }
            }else{
                // TODO Fehlermeldung
            }
        }else{
            // TODO Fehlermeldung
        }
        return null;

        function getObjectAttributeMapping(property)
        {
            var sKey = property.label;
            
            if (sKey == null) {
                sKey = property.rowName;
            }
            
            for (var i = 0; i < objPropertiesList.length; i++){
                if (objPropertiesList[i][0].equals(sKey))
                    return objPropertiesList[i][1];
            }
            return -1;
        }

    }
    
    function convertProperties(nATN, property, def) {
        try{
            if (property.dataType == "CY" && property.formula) {
                var result = parseCurrency(property.formula);
                if (result[1] >= 0) {
                    def.Attribute(nATN, g_nLoc).setValue(result[0], result[1]);
                }
            } else if (property.dataType == "ED" || property.dataType == "DE") {
                def.Attribute(nATN, g_nLoc).setValue(property.value, Constants.AVT_DAYS);
            } else if (property.dataType == "EM") {
                def.Attribute(nATN, g_nLoc).setValue(property.value, Constants.AVT_MINS);
            } else if (property.dataType == "EW") {
                def.Attribute(nATN, g_nLoc).setValue(property.value, Constants.AVT_WEEKS);
            } else if (property.dataType == "EH") {
                var result = parseDuration(property.formula);
                def.Attribute(nATN, g_nLoc).setValue(property.value, Constants.AVT_HOURS);
            } else if (property.dataType == "ES") {
                def.Attribute(nATN, g_nLoc).setValue(property.value, Constants.AVT_SECS);
            } else if (property.dataType == "DATE") {
                var result = parseDate(property.value);
                def.Attribute(nATN, g_nLoc).setValue(result);
            } else {
                def.Attribute(nATN, g_nLoc).setValue(property.value);
            }
        } catch(e) {;}
    }
    
    /**
     * converts a visio currency string CY(0.02,"USD") into a value and currency type number pair
     */
    function parseCurrency(currency) {
        var matches = currency.match(/\((.*?)\)/); // extract the substring inside the brackets
        if (matches) {var textInsideBrackets = matches[1];}
        var parameters = textInsideBrackets.split(','); // split the two comma separated parameters
        var cmatches = currency.match(/\"(.*?)\"/); // remove leading and trailing quotation marks
        if (cmatches) {var currency_code = cmatches[1];}
        var filter = ArisData.getActiveDatabase().ActiveFilter();
        var typeNum = filter.fromAPIName("AVT_"+currency_code);
        return [parameters[0], typeNum];
    }
    
    /**
     * converts a visio date string 2020-02-03T00:00:00 into a date and currency type number pair
     */
    function parseDate(date) {
        var datetime = date.split('T');
        var parsedDate = datetime[0].split('-');
        return parsedDate[1] + "/" + parsedDate[2] + "/" + parsedDate[0];
    }
    
    /**
     * creates an Aris free-form text. If the Visio-shape has a boxed background, this is created as a graphic.
     */
    function createTextOcc(tVisio, mModel, vShape, visPointOfReference, aAggregatedTexts)
    {
        var elText = vShape.getText();

        //check if we need a background graphic/shape
        var sLine = m_loader.getShapeLinePattern( vShape );
        if(sLine==null)
        {
            sLine = "0"
        }

        var sFill = m_loader.getShapeFillPattern( vShape );
        if(sFill==null)
        {
            sFill = "0"
        }

        var sText = null;
        var nHAlign = 1; //centered
        var nVAlign = 1; //centered
        if(elText!=null)
        {
            sText = getShapeText(tVisio, vShape);

            //collect sub-texts of a mapped toplevel shape only
            //example: Entity-Relationship diagram
            if(aAggregatedTexts!=null)
            {
                if(sText!=null && sText.length()>0)
                {
                    aAggregatedTexts.push(sText)
                }
                return null;
            }

            nHAlign = tVisio.getLoader().getAlignH(vShape) //0=left, 1=centered, 2=right (3=justified)
            nVAlign = tVisio.getLoader().getAlignV(vShape) //0=top, 1=centered, 2=bottom
        }
        else //text==null
        {
            //no text, no lines, no filling => no shape!
            if( sLine.equals("0") && sFill.equals("0"))
                return null;
        }

        //for FFTs in Visio this is the V-center(!) left point
        var ptPosition = getARISPosition(tVisio, visPointOfReference, vShape);
        var ptSize = getArisSize(visPointOfReference, vShape)
        if(ptSize==null) //this seems to happen in ER-Diagrams
        {
            ptSize = new java.awt.Point(250,150)
        }

        var rect = null;
        if( (ptSize.getX()>0 && ptSize.getY()>0) && (!sLine.equals("0") || !sFill.equals("0")) )
        {
            rect = mModel.createRoundedRectangle ( ptPosition.getX(), ptPosition.getY(), ptSize.getX(), ptSize.getY())
            if(rect!=null)
            {
                if( !sLine.equals("0") )
                {
                    var sRounding = m_loader.getShapeLineRounding(vShape);
                    if(sRounding == null || isNaN(parseFloat(sRounding))) {
                        sRounding = "0";
                    }
                    if(!sRounding.equals("0"))
                    {
                        var rounding = visPointOfReference.applyScale(parseFloat(sRounding)) / 2;
                        rect.setRoundness(rounding, rounding)
                    }

                    //line color
                    var colorLine = m_loader.getColor( m_loader.getShapeLineColor(vShape) )
                    if(colorLine!=null)
                        rect.setPenColor( colorLine );
                }
                if( !sFill.equals("0") )
                {
                    var color = m_loader.getColor( m_loader.getShapeFillForeground(vShape) )
                    if(color!=null)
                        rect.setFillColor( color );
                }
                else
                    rect.setFillColor( -1 );
            }
        }

        if(sText!=null)
        {
            var vPosition = ptPosition.getY() + ptSize.getY()/2 //centered
            var nFontHeight = ArisData.getActiveDatabase().defaultFontStyle().Font(Context.getSelectedLanguage()).Size()
            if(nVAlign==0) //top
                vPosition = ptPosition.getY() + 2*nFontHeight + 5
            if(nVAlign==2) //bottom
                vPosition = ptPosition.getY() + ptSize.getY() - 2*nFontHeight - 5

            var hPosition =  ptPosition.getX() + ptSize.getX()/2 //centered
            if(nHAlign==0) //left
                hPosition = ptPosition.getX() + 5
            if(nHAlign==2) //right
                hPosition = ptPosition.getX() + ptSize.getX() - 5

            var ocShape = mModel.CreateTextOcc( hPosition, vPosition, sText )
            switch(nHAlign)
            {
                case 0:
                ocShape.setAlignment(Constants.ATTROCC_ALIGN_LEFT)
                break;
                case 1:
                ocShape.setAlignment(Constants.ATTROCC_ALIGN_CENTER)
                break;
                case 2:
                case 3:
                ocShape.setAlignment(Constants.ATTROCC_ALIGN_RIGHT)
                break;
            }
            if(rect!=null)
                return mModel.createGrouping([rect, ocShape])
            return ocShape;
        }
        return rect;
    }

    /**
    * @param {org.jdom2.Element} vGroupShape shape-element with attribute "Type" is "Group"
    * @returns {org.jdom2.Element[]} List of child elements of elGroupShape where attribut Master
    * is available. elements betweend elGroupShape and the "master"-element are ignored.
    */
    function getMasterShapePage(vGroupShape){
        var resList = new Array();
        try{
            var elShapeList = m_loader.getChildShapes(vGroupShape)
            for(var itr in elShapeList){
                var vShape = elShapeList[itr];
                var sMaster = vShape.getMaster();
                if(sMaster!=null && sMaster.length()>0 ){
                    resList.push(vShape);
                }else{
                    resList = resList.concat(getMasterShapePage(vShape));
                }
            }
        }catch(e){
            // TODO Fehlermeldung
        }
        return resList;
    }

    /**
    * calculates the size of the aris objocc that represents the shape vShape
    * @param visPointOfReference
    * @param {VShape} vShape shape-element size for the corresponding aris objocc is calculated.
    * @returns {java.awt.geom.Point2D.Float} size of objocc representing vShape.
    */
    function getArisSize(visPointOfReference, vShape)
    {
        var vShapeSize = m_loader.getShapeSize(vShape)
        if(vShapeSize==null)
            return null;

        var lWidth  = visPointOfReference.applyScale(vShapeSize.ptRaw.x, vShapeSize.unitX);

        var lHeight = visPointOfReference.applyScale(vShapeSize.ptRaw.y, vShapeSize.unitY);
        if(lHeight>=0 && lHeight<10)
            lHeight = 10;

        if(lWidth>=0 && lHeight>=0)
            return new java.awt.geom.Point2D.Float(lWidth,lHeight);
        else
            return null;
    }


    /**
    * calculates the position of the aris objocc that represents the shape vShape
    * @param {VIS_PointOfReference} visPointOfReference page-element representing the page of shape vShape
    * @param {VShape} vShape shape-element position for the corresponding aris
    * objocc is calculated.
    * @returns {java.awt.Point} position of objocc representing vShape.
    */
    function getARISPosition(tVisio, visPointOfReference,vShape){
        return visPointOfReference.getArisPosition(tVisio.getLoader(), vShape)
    }
}

/**
* @class VIS_Shape is used to encapsulate shape information to create connections
* in aris.
*/
function VIS_Shape(){
    this.nID = -1;   // id of shape to place, neede for creating connections
    this.sNameU = ""; // neede to lookup cxntype
    this.ocShape; // objcoc or Textocc or Gfxocc
    this.bObjOcc = false;
}

//replaces java.awt.Point, which hold only int members
function PointFloat() {
    this.ptX = 0
    this.ptY = 0
}

function propertyIsSet(name) {
    return Context.getProperty(name) != null;
}

function showError(message) {
    if (SHOW_DIALOGS) {
        Dialogs.MsgBox(message)
    } else {
        throw new Error(message);
    } 
}

main();
