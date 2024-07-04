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

/* 
// FOR DEBUG ONLY
Context.setProperty("process", "true");
Context.setProperty("data", "true");
Context.setProperty("screen", "true");
Context.setProperty("service", "true");
*/

const c_PROCESS = "process";
const c_DATA    = "data";
const c_SCREEN  = "screen";
const c_SERVICE = "service";

/* Layout constants */
const c_Panel           = Constants.ST_BLOCK_PANEL;
const c_Row             = Constants.ST_STATIC_ROW;
const c_Cell            = Constants.ST_STATIC_CELL;
const c_PropGroup       = Constants.ST_PROPERTY_GRP;
const c_PropSubgroup    = Constants.ST_PROPERTY_SUBGRP;
const c_PropLine        = Constants.ST_PROPERTY_LINE;
const c_RadioBtnGroup   = Constants.ST_RADIOBUTTON_GRP;
const c_CheckBoxBtnGroup= Constants.ST_CHECKBOX_GRP;
const c_Dropdown        = Constants.ST_DROPDOWN;
const c_ComboBox        = Constants.ST_COMBOBOX_1;
const c_RadioBtn        = Constants.ST_RADIOBUTTON;
const c_CheckBox        = Constants.ST_CHECKBOX;
const c_SelectItem      = Constants.ST_SELECT_ITEM;
const c_DateInput       = Constants.ST_DATE_INPUT;
const c_TextInput       = Constants.ST_TEXT_INPUT;
const c_MultilineInput  = Constants.ST_MULTILINE_INPUT;
const c_CommandBtn      = Constants.ST_COMMAND_BUTTON;
const c_IconBtn         = Constants.ST_COMMAND_ICON;
const c_LinkBtn         = Constants.ST_COMMAND_LINK;
const c_ControlLabel    = Constants.ST_CONTROL_LABEL;
const c_OutputText      = Constants.ST_OUTPUT_TEXT;
const c_Icon            = Constants.ST_ICON;
const c_Header          = Constants.ST_HEADER;
const c_FormattedText   = Constants.ST_FORMATTED_TEXT;
const c_Table           = Constants.ST_TABLE;
const c_List            = Constants.ST_LIST_1;

var g_layoutDelta = 10;

var g_oCheckedDataModels = new Array();
var g_oCheckedScreenModels = new Array();
 
if (checkActiveFilter()) {
    var oSelModels = getSelectedBPMNModels();
    var mapInfoMarks = initInfoMarks(oSelModels);
    
    check_Process( mapInfoMarks, oSelModels );
    check_Data( mapInfoMarks, oSelModels );
    check_Screen( mapInfoMarks, oSelModels );
    check_Service( mapInfoMarks, oSelModels );

    gb_DGRMS_OPEN_SET = displayErrors();
    
    outInfoMarks( mapInfoMarks );
    
    writeDetailedResult(mapInfoMarks);
}
writeProperties( );

function writeDetailedResult( mapInfoMarks){
        var bos = new java.io.ByteArrayOutputStream() ;
        var out = new java.io.ObjectOutputStream(bos) ;
        out.writeObject(mapInfoMarks);
        out.close();
        Context.setPropertyBytes("DETAILED_RESULT", bos.toByteArray());
}

// Process semantic checks for solution export
function check_Process( mapInfoMarks, oSelModels ) {
    if (!getBoolPropertyValue(c_PROCESS)) return;
    
    var oProcessModels = filterProcessModels(oSelModels);
    check_ModelForErrors_Process( mapInfoMarks, oProcessModels );
    check_Uniqueness( mapInfoMarks, oProcessModels );
}    

// Data semantic checks for solution export
function check_Data( mapInfoMarks, oSelModels ) {
    if (!getBoolPropertyValue(c_DATA)) return;
    
    var oDataModels = filterDataModels(oSelModels);
    check_ModelForErrors_Data( mapInfoMarks, oDataModels );

    // Check assigned models of selected process models
    var oProcessModels = filterProcessModels(oSelModels);
    for (var i = 0; i < oProcessModels.length; i++) {    
        var aAssignedDataModels = getAssignedDataModels( oProcessModels[i] );
        check_ModelForErrors_Data( mapInfoMarks, aAssignedDataModels );
        
        // Special case: Process model is not assigned with a data model -> Check namespace of data objects
        check_Data_DataObject(mapInfoMarks, oProcessModels[i] );        
    }
}

// Screen semantic checks for solution export
function check_Screen( mapInfoMarks, oSelModels ) {
    if (!getBoolPropertyValue(c_SCREEN)) return;

    // Check SCREEN models
    var oScreenModels = filterScreenModels(oSelModels);
    check_ModelForErrors_Screen( mapInfoMarks, oScreenModels );

    // Check assigned models of selected process models
    var oProcessModels = filterProcessModels(oSelModels);
    for (var i = 0; i < oProcessModels.length; i++) {    
        var aAssignedScreenModels = getAssignedScreenModels( oProcessModels[i] );
        check_ModelForErrors_Screen( mapInfoMarks, aAssignedScreenModels );
    }
}

// Service semantic checks for solution export
function check_Service( mapInfoMarks, oSelModels ) {
    var oProcessModels = filterProcessModels(oSelModels);
    
    for (var i = 0; i < oProcessModels.length; i++) {    
        check_ServiceTask( mapInfoMarks, oProcessModels[i] );
        check_SyncAgainstCentraSite( mapInfoMarks, oProcessModels[i] ); 
    }
}

/***********************************************************************************************************************/
/* PROCESS                                                                                                             */
/***********************************************************************************************************************/

function check_ModelForErrors_Process( mapInfoMarks, aModels ) {
    // Extended copy of function "check_ModelForErrors()" in report 0d9d24f0-3826-11e0-4f01-fab72ea9ba8a (Consistency check - Library)
    for(var i=0; i< aModels.length; i++){
        var bCycle = false;
        check_ManualTask( mapInfoMarks, aModels[i] );
        check_UserTask( mapInfoMarks, aModels[i] );
        var bPure_process = getBoolPropertyValueWithNull("PURE_PROCESS");
        if(bPure_process == null){
            var mode = g_oDB.Attribute(Constants.AT_M2E_SCENARIO_TYPE, gn_Lang);                           
            bPure_process = !(mode.MeasureUnitTypeNum() == Constants.AVT_M2E_SCENARIO_TYPE_WITH_SERVICES); 
        }
        if(!bPure_process){
            check_ServiceTask( mapInfoMarks, aModels[i] );
            check_SyncAgainstCentraSite( mapInfoMarks, aModels[i] );
        }
        check_AbstractTask( mapInfoMarks, aModels[i] );
        check_SpecialTaskRelations( mapInfoMarks, aModels[i] );
        check_AllOccInModel( mapInfoMarks, aModels[i] );            // contains checks against configuration, too
        check_TextAnnotations( mapInfoMarks, aModels[i] );
        check_MessageFlow( mapInfoMarks, aModels[i] );
        check_NestedLanes( mapInfoMarks, aModels[i] );
        check_CallActivitiesValid(mapInfoMarks, aModels[i]);
        check_AssignedFadModel( mapInfoMarks, aModels[i] );
        bCycle = checkTaskHierarchyCycle( mapInfoMarks, aModels[i] );
        checkTaskAssignment( mapInfoMarks, aModels[i] );
        
        check_Pools( mapInfoMarks, aModels[i] );
        check_wMChecks( mapInfoMarks, aModels[i] );
        check_error_handler(mapInfoMarks, aModels[i] );
        
        // additionally...
        check_Process_ProcessDocument(mapInfoMarks, aModels[i]);
        check_Process_ProcessStartDocument(mapInfoMarks, aModels[i]);
        check_Process_ProcessEndDocument(mapInfoMarks, aModels[i]);
        check_Process_DataObjectAssignment(mapInfoMarks, aModels[i]);
        check_Process_ScreenDesignConnection(mapInfoMarks, aModels[i]);
        
        var aSubProcessModels   = getAssignedSubProcessModels( aModels[i] );
        if( !bCycle && aSubProcessModels.length > 0 ) { 
            check_ModelForErrors_Process( mapInfoMarks, aSubProcessModels );
        }
    }
}   

function check_Process_ProcessDocument(mapInfoMarks, oModel) {
    if (!getBoolPropertyValue(c_DATA)) return;
    // The process has maximal one "Data object" (symbol does not matter, object type is cluster) without connection occurence
    var oProcessDocuments = getProcessDocuments();
    if (oProcessDocuments.length > 1) {
        for (var i = 0; i < oProcessDocuments.length; i++) {
            setInfoMark(mapInfoMarks, oProcessDocuments[i], getString("ERR_AT_MOST_ONE_PROCESS_DOCUMENT"), Constants.MODEL_INFO_ERROR);
        }
    }
    validateCxnsOfProcessDocuments();

    function validateCxnsOfProcessDocuments() {
        for (var i = 0; i < oProcessDocuments.length; i++) {
            var oProcessDocument = oProcessDocuments[i];
            var oConnObjOccs = oProcessDocument.getConnectedObjOccs(null);
            for (var j = 0; j < oConnObjOccs.length; j++) {
                var oConnObjOcc = oConnObjOccs[j];

                if (isEvent(oConnObjOcc) || isTask(oConnObjOcc)) {
                    setInfoMark(mapInfoMarks, oProcessDocument, formatstring1(getString("WRG_CXN_IGNORED"), oConnObjOcc.ObjDef().Name(gn_Lang)), Constants.MODEL_INFO_WARNING);
                }
            }            
        }
        
        function isEvent(oObjOcc) {
            return oObjOcc.ObjDef().TypeNum() == Constants.OT_EVT;
        }
        
        function isTask(oObjOcc) {
            var aTaskSymbols = getTaskSymbols();
            for (var i = 0; i < aTaskSymbols.length; i++) {
                if (oObjOcc.SymbolNum() == aTaskSymbols[i]) return true;
            }
            return false;
        }
    }
   
    
    function getProcessDocuments() {
        // Process Document = Data object without cxn to Message Start/End Event
        var oProcessDocuments = new Array();
        var oDataObjects = oModel.ObjOccListFilter(Constants.OT_CLST);
        for (var i = 0; i < oDataObjects.length; i++) {
            var oDataObject = oDataObjects[i];
            if (isProcessDocument(oDataObject)) {
                oProcessDocuments.push(oDataObject);
            }
        }
        return oProcessDocuments;
        
        function isProcessDocument(oDataObject) {
            var oConnObjOccs = oDataObject.getConnectedObjOccs(null);
            for (var j = 0; j < oConnObjOccs.length; j++) {
                if (oConnObjOccs[j].SymbolNum() == Constants.ST_BPMN_MESSAGE_START_EVENT ||
                    oConnObjOccs[j].SymbolNum() == Constants.ST_BPMN_MESSAGE_END_EVENT) return false;
            }
            return true;
        }
    }  
}

function check_Process_ProcessStartDocument(mapInfoMarks, oModel) {
    // A start event can have a "has as output" connection to a data object (symbol does not matter, object type is cluster). 
    // The symbol of the start event needs to be "message start event". 
    // If the symbol is not "message start event" than the SemCheck should set a warning mark.  
    var oStartEvents = oModel.ObjOccListBySymbol(getStartEventSymbols());
    for (var i = 0; i < oStartEvents.length; i++) {
        var oStartEvent = oStartEvents[i];

        var oConnDataObjects = getConnectedDataObjects(oStartEvent, Constants.EDGES_OUT, Constants.CT_HAS_OUT);
        if (oConnDataObjects.length == 0) continue;

        if (oStartEvent.SymbolNum() != Constants.ST_BPMN_MESSAGE_START_EVENT) {            
            setInfoMark(mapInfoMarks, oStartEvent, getString("WRG_NO_MSG_START_EVT"), Constants.MODEL_INFO_WARNING);
        }
    }
}

function check_Process_ProcessEndDocument(mapInfoMarks, oModel) {
    //A end event can have a "has as input" connection to a data object (symbol does not matter, object type is cluster). 
    // The symbol of the end event needs to be "message end event". 
    // If the symbol is not "message end event" than the SemCheck should set a warning mark.     
    var oEndEvents = oModel.ObjOccListBySymbol(getEndEventSymbols());
    for (var i = 0; i < oEndEvents.length; i++) {
        var oEndEvent = oEndEvents[i];

        var oConnDataObjects = getConnectedDataObjects(oEndEvent, Constants.EDGES_IN, Constants.CT_IS_INP_FOR);
        if (oConnDataObjects.length == 0) continue;

        if (oEndEvent.SymbolNum() != Constants.ST_BPMN_MESSAGE_END_EVENT) {            
            setInfoMark(mapInfoMarks, oEndEvent, getString("WRG_NO_MSG_END_EVT"), Constants.MODEL_INFO_WARNING);
        }
    }
}

function check_Process_DataObjectAssignment(mapInfoMarks, oModel) {
    if (!getBoolPropertyValue(c_DATA)) return;
    // The data object can have one assignment to a Document structure (Solution design) model. 
    // If more then Only o is assigned an error mark should be set to the data object. 
    // Add warning mark if no " Document structure (Solution design)" is assigned to a "Data object" (Cluster symbol is not important).
    var oDataObjects = oModel.ObjOccListFilter(Constants.OT_CLST);
    for (var i = 0; i < oDataObjects.length; i++) {
        var oDataObject = oDataObjects[i];
        var oAssignedModels = oDataObject.ObjDef().AssignedModels(getDataModelTypes());
        if (oAssignedModels.length == 0) {
            setInfoMark(mapInfoMarks, oDataObject, getString("WRG_ASSIGNMENT_MISSING"), Constants.MODEL_INFO_WARNING);
        }
        else if (oAssignedModels.length > 1) {
            setInfoMark(mapInfoMarks, oDataObject, getString("ERR_MULTIPLE_ASSIGNMENTS"), Constants.MODEL_INFO_ERROR);
        }
    }
}

function check_Process_ScreenDesignConnection(mapInfoMarks, oModel) {
    // If an that that is not a user task (e.g. Service Task etc.) has an connection to a "Screen Design" object add a warning should be outputted 
    // that screen is not allowed for this kind of task and that the screen will not be exported. 
    // Every user task should have a Function Allocation Diagram assigned and in the FAD the User Task should be connected to a Screen(Solution Design).
    // The screen object should have one assignment to the new  model type Solution Screen Design.
    // If the User task has not a Screen object connected in the FAD a warning should be outputted.
    // Also a warning should be outputted if no model is assigned to the Screen design.
    var oTasks = oModel.ObjOccListBySymbol(getTaskSymbols());
    for (var i = 0; i < oTasks.length; i++) {
        var oTask = oTasks[i];
        var oConnScreenDesigns = getScreenConnections(oTask, false/*bIsUserTask*/)
        
        if (oTask.SymbolNum() == Constants.ST_BPMN_USER_TASK) {
            if (oConnScreenDesigns.length == 0) {
                setInfoMark(mapInfoMarks, oTask, getString("WRG_SCREEN_MISSING"), Constants.MODEL_INFO_WARNING);
            } else {
                validateAssignmentOfScreens(oConnScreenDesigns);
            }
        } else {
            if (oConnScreenDesigns.length > 0) {
                setInfoMark(mapInfoMarks, oTask, getString("WRG_SCREEN_NOT_ALLOWED"), Constants.MODEL_INFO_WARNING);
            }
        }
    }
            
    function getScreenConnections(oTask) {
        var oAssFadModels = oTask.ObjDef().AssignedModels(Constants.MT_FUNC_ALLOC_DGM);
        if (oAssFadModels.length > 0) {

            var oAssTasks = oTask.ObjDef().OccListInModel(oAssFadModels[0]);
            for (var j = 0; j < oAssTasks.length; j++) {
                var oAssTask = oAssTasks[j];
                
                var oConnScreenDesigns = oAssTask.getConnectedObjOccs(Constants.ST_SCREEN_SD);
                if (oConnScreenDesigns.length > 0) {
                    return oConnScreenDesigns;
                }
            }
        }
        return new Array();
    }

    function validateAssignmentOfScreens(oScreenDesigns) {
        for (var i = 0; i < oConnScreenDesigns.length; i++) {
            var oScreenDesign = oScreenDesigns[i];
            var oAssScreenModels = oScreenDesign.ObjDef().AssignedModels(Constants.MT_SCREEN_DESIGN_SD);
            if (oAssScreenModels.length == 0) {                
                setInfoMark(mapInfoMarks, oScreenDesign, getString("WRG_ASSIGNED_SSD_MISSING"), Constants.MODEL_INFO_WARNING);
            }
        }
    }
}

/***********************************************************************************************************************/
/* DATA                                                                                                                */
/***********************************************************************************************************************/

function check_ModelForErrors_Data( mapInfoMarks, oDataModels ) {    
    for(var i = 0; i < oDataModels.length; i++) {
        var oDataModel = oDataModels[i];
        if (isModelAlreadyChecked(oDataModel, g_oCheckedDataModels)) continue;
        
        check_Data_DataObject( mapInfoMarks, oDataModel );
        check_Data_Assignment( mapInfoMarks, oDataModel );
        check_Data_Attributes( mapInfoMarks, oDataModel );
        check_Data_MultipleTypeDefinitions( mapInfoMarks, oDataModel );
        check_Data_Restrictions( mapInfoMarks, oDataModel );
        check_Data_TypeDefinitionsOfRestrictions( mapInfoMarks, oDataModel );
        check_Data_RecursiveRestrictions( mapInfoMarks, oDataModel );
        check_Data_ElementsWithoutConnectionToDataObject( mapInfoMarks, oDataModel );
        check_Data_UnnamedElements( mapInfoMarks, oDataModel );
        check_Data_ElementsWithSameName( mapInfoMarks, oDataModel );
        check_Data_OccurrenceCopies( mapInfoMarks, oDataModel );    
        
        var oAssignedDataModels = getAssignedDataModels( oDataModel );
        check_ModelForErrors_Data( mapInfoMarks, oAssignedDataModels );
    }
}

function check_Data_DataObject(mapInfoMarks, oModel) {
    // The "Document structure (Solution design)" should contain exactly one "Data Object". 
    // If more than one "Data object" exists in the model a error mark is set. Message:  "Only one data object allowed per model for solution export.". 
    // The object requires a valid URN/URL as value for the attribute webMethods/Namespace(Solution design) else error marks should be set (error no namespace for data object).  
    var oDataObjects = oModel.ObjOccListFilter(Constants.OT_CLST);
    for (var i = 0; i < oDataObjects.length; i++) {
        var oDataObject = oDataObjects[i];
        
        if (isDataModel(oModel) && oDataObjects.length > 1) {
            setInfoMark(mapInfoMarks, oDataObject, getString("ERR_ONLY_ONE_DATAOBJECT"), Constants.MODEL_INFO_ERROR);
        }
        
        validateURL(oDataObject);
    }

    function validateURL(oDataObject) {
        if (!isRelevantDataObject(oDataObject)) return;
        
        var bIsValid = true;
        var oAttr = oDataObject.ObjDef().Attribute(Constants.AT_NAMESPACE_SD, gn_Lang);
        if (!oAttr.IsMaintained()) bIsValid = false;
        
        try {
            var url = java.net.URL(oAttr.getValue());
        } catch(ex) { 
            bIsValid = false; 
        }
        
        if (!bIsValid) {
            setInfoMark(mapInfoMarks, oDataObject, getString("ERR_INVALID_URL"), Constants.MODEL_INFO_ERROR);
        }
        
        function isRelevantDataObject(oDataObject) {
            // Special case: Data object in process model -> Only relevant if data object is not assigned with data model
            if (isProcessModel(oDataObject.Model())) {
                return (oDataObject.ObjDef().AssignedModels(getDataModelTypes()).length == 0);
            }
            return true;
        }
    }
    
    function isProcessModel(oModel) {
        var aProcessModelTypes = getProcessModelTypes();
        for (var i = 0; i < aProcessModelTypes.length; i++) {
            if (oModel.TypeNum() == aProcessModelTypes[i]) return true;
        }
        return false;
    }

    function isDataModel(oModel) {
        var aDataModelTypes = getDataModelTypes();
        for (var i = 0; i < aDataModelTypes.length; i++) {
            if (oModel.TypeNum() == aDataModelTypes[i]) return true;
        }
        return false;
    }
}

function check_Data_Assignment(mapInfoMarks, oModel) {
    // The "Document structure (Solution design)" model can be assigned to a "Data object" (see process section). 
    // In this case the "Data object" with the assignment must be identical with the "Data object" in the   "Document structure (Solution design)" model.
    var oSuperiorDataObjDefs = oModel.getSuperiorObjDefs();
    if (oSuperiorDataObjDefs.length == 0) return;
    
    var oDataObjects = oModel.ObjOccListFilter(Constants.OT_CLST);
    for (var i = 0; i < oDataObjects.length; i++) {
        var oDataObject = oDataObjects[i];
        bMatchToSupObj = false;
        for (var j = 0; j < oSuperiorDataObjDefs.length; j++) {
            if (oDataObject.ObjDef().IsEqual(oSuperiorDataObjDefs[j])) {
                bMatchToSupObj = true;
                break;
            }
        }
        if (!bMatchToSupObj) {
            setInfoMark(mapInfoMarks, oDataObject, getString("ERR_INVALID_SUPERIOR_OBJ"), Constants.MODEL_INFO_ERROR);
        }
    }
    
    function getSuperiorDataObjectDefs() {
        var oSupDataObjDefs = new Array();
        var oSupObjDefs = oModel.getSuperiorObjDefs();    
        for (var i = 0; i < oSupObjDefs.length; i++) {
            var oObjDef = oSupObjDefs[i];
            if (oObjDef.TypeNum() == Constants.OT_CLST) {
                oSupDataObjDefs.push(oObjDef);
            }
        }
        return oSupDataObjDefs;
    }
}
    
function check_Data_Attributes(mapInfoMarks, oModel) {
    // If attributes are defined for the "Data object"  via "consists of" connection (see picture) the following restriction should be checked. 
    // Every attribute definition is only connected once to the "Data object". If not error mark should be set.
    // Every attribute should have type defined  in only one of the following ways  if not a warning mark should be set. 
    //     the "D attribute (Solution design)" has a value set for the attribute "Workflow/Data type"
    //     the "D attribute (Solution design)"  has a connection (occ in the model) to a "Data type(Solution design)" via "references(CT_REFERENCES)" connection.
    //     the "D attribute (Solution design)"  has a connection (occ in the model) to a "Restriction (Solution design)" via "references(CT_REFERENCES)" connection.
    // If the  "Workflow/Data type" attribute is set for the  "D attribute (Solution design)" object and a   "Data type(Solution design)" /"Restriction (Solution design)"  is connected a warring mark should be set that informs the user that the attribute is ignored. 
    // if the "D attribute (Solution design)" has a  "references(CT_REFERENCES)" connection "Data type(Solution design)" and a "references(CT_REFERENCES)" connection to a  "Restriction (Solution design)" then a error mark should be set (same message as in section "Multiple type definitions")    
    var oDAttributes = getAttributeObjects(oModel, [Constants.ST_DESC_ATTR_SD]);
    for (var i = 0; i < oDAttributes.length; i++) {
        var oDAttribute = oDAttributes[i];

        var oConnDataObjects = getConnectedDataObjects(oDAttribute, Constants.EDGES_IN, Constants.CT_CONS_OF_2);
        if (oConnDataObjects.length > 1) {
            setInfoMark(mapInfoMarks, oDAttribute, getString("ERR_NO_UNIQUE_CXN"), Constants.MODEL_INFO_ERROR);
        }
        validateTypeDefinition(oDAttribute);
    }
    
    function validateTypeDefinition(oDAttribute) {
        var nTypeDefsByAttr = 0;
        var nTypeDefsByDataType = 0;
        var nTypeDefsByRestriction = 0;
        
        if ( oDAttribute.ObjDef().Attribute(Constants.AT_DATA_TYPE, gn_Lang).IsMaintained() ) {
            nTypeDefsByAttr = 1;
        }
        if ( getConnectedObjectsBySymbol(oDAttribute, Constants.EDGES_OUT, Constants.CT_REFERENCES, Constants.ST_DATA_TYPE_SD).length > 0 ) {
            nTypeDefsByDataType = 1;
        }
        if ( getConnectedObjectsBySymbol(oDAttribute, Constants.EDGES_OUT, Constants.CT_REFERENCES, Constants.ST_RESTRICTION_SD).length > 0 ) {
            nTypeDefsByRestriction = 1;
        }
        // Validation...
        if ( (nTypeDefsByAttr + nTypeDefsByDataType + nTypeDefsByRestriction) == 0 ) {
            setInfoMark(mapInfoMarks, oDAttribute, getString("WRG_NO_TYPE_DEF"), Constants.MODEL_INFO_WARNING);
        }         
        
        if ( (nTypeDefsByAttr + nTypeDefsByDataType + nTypeDefsByRestriction) > 1 ) {
            setInfoMark(mapInfoMarks, oDAttribute, getString("WRG_TYPE_DEF_NOT_UNIQUE"), Constants.MODEL_INFO_WARNING);
        }         

        if ( (nTypeDefsByAttr > 0) && ((nTypeDefsByDataType + nTypeDefsByRestriction) > 0) ) {
            setInfoMark(mapInfoMarks, oDAttribute, getString("WRG_ATTR_IGNORED"), Constants.MODEL_INFO_WARNING);
        }         

        if ( (nTypeDefsByDataType + nTypeDefsByRestriction) > 1 ) {
            setInfoMark(mapInfoMarks, oDAttribute, getString("ERR_MULT_TYPE_DEF"), Constants.MODEL_INFO_ERROR);
        }         
    }
}
    
function check_Data_MultipleTypeDefinitions(mapInfoMarks, oModel) {
    // If the "D attribute (Solution design)" has more than one  "Data type(Solution design)"/"Restriction (Solution design)" connected, then a error mark should be set (Multiple type definition). 
    var oDAttributes = getAttributeObjects(oModel, [Constants.ST_DESC_ATTR_SD]);
    for (var i = 0; i < oDAttributes.length; i++) {
        var oDAttribute = oDAttributes[i];

        var oConnDataTypes = getConnectedObjectsBySymbol(oDAttribute, Constants.EDGES_OUT, Constants.CT_REFERENCES, Constants.ST_DATA_TYPE_SD);
        var oConnRestrictions = getConnectedObjectsBySymbol(oDAttribute, Constants.EDGES_OUT, Constants.CT_REFERENCES, Constants.ST_RESTRICTION_SD);            

        if (oConnDataTypes.length > 1 || oConnRestrictions.length > 1) {
            setInfoMark(mapInfoMarks, oDAttribute, getString("ERR_MULT_TYPE_DEF"), Constants.MODEL_INFO_ERROR);
        }
    }
}
    
function check_Data_Restrictions(mapInfoMarks, oModel) {
    // Attributes can have as data type a "Restriction (Solution design)" (connected via "references(CT_REFERENCES)").  
    // If the "Restriction (Solution design)" object has no outgoing "uses" connections (occs) then a error mark should be set. Message: "Base type for restriction Restriction unknown".
    // If the "Restriction (Solution design)" object has outgoing "uses" connections (occs) to "D attributes (Solution design)" then all "D attributes (Solution design)" should belong to exact one "Entity type" (connection "is describing for"). The connection to the entity type is not visible in the model only on definition level.
    // The  "Restriction (Solution design)"  can have one (optional) connection "is restriction of" to a  "Data type(Solution design)".  
    //      If more then one connection exists to a  "Data type(Solution design)" then a Error mark should be set ("Multiple base type definition")
    //      if one connection exists then all  "D attributes (Solution design)" that are connected ("uses" connection)  must belong (connection "is describing for" at def level) to the  "Data type(Solution design)" that is connected via "is restriction of connection"
    var oAttributes = getAttributeObjects(oModel, [Constants.ST_DESC_ATTR_SD]);
    for (var i = 0; i < oAttributes.length; i++) {
        var oAttribute = oAttributes[i];
        // Attribute -> Restrictions
        var oConnRestrictions = getConnectedObjectsBySymbol(oAttribute, Constants.EDGES_OUT, Constants.CT_REFERENCES, Constants.ST_RESTRICTION_SD);
        for (var j = 0; j < oConnRestrictions.length; j++) {
            var oRestriction = oConnRestrictions[j];

            // Remark; This check is done first because possible result (oConnDataTypeDef) is needed for checks below;
            // Restriction -> Data types
            var oConnDataTypes = getConnectedObjectsBySymbol(oRestriction, Constants.EDGES_OUT, Constants.CT_IS_RESTRICTION_OF, Constants.ST_DATA_TYPE_SD);
            if (oConnDataTypes.length > 1) {
                setInfoMark(mapInfoMarks, oRestriction, getString("ERR_MULT_BASE_TYPE"), Constants.MODEL_INFO_ERROR);
            }
            var oRefDataTypeDef = null;
            if (oConnDataTypes.length == 1) {
                oRefDataTypeDef = oConnDataTypes[0].ObjDef();
            }
            
            var oConnObjects = getConnectedObjectsBySymbol(oRestriction, Constants.EDGES_OUT, Constants.CT_USES_SD, null);
            if (oConnObjects.length == 0) {
                setInfoMark(mapInfoMarks, oRestriction, getString("ERR_TYPE_UNKNOWN"), Constants.MODEL_INFO_ERROR);
            }
            // Restriction -> D-Attributes
            var oConnDAttributes = getConnectedObjectsBySymbol(oRestriction, Constants.EDGES_OUT, Constants.CT_USES_SD, Constants.ST_DESC_ATTR_SD);
            if (oConnDAttributes.length > 0) {
                validateConnectedEntityTypes(oConnDAttributes, oRefDataTypeDef);
            }
        }
    }
    
    function validateConnectedEntityTypes(oDAttributes, oRefDataTypeDef) {
        var oRefEntityTypeDef = null;
        for (var i = 0; i < oDAttributes.length; i++) {
            var bIsEntityOk = true;
            var oDAttribute = oDAttributes[i];
            var oCxns2EntityTypeDefs = oDAttribute.ObjDef().CxnListFilter(Constants.EDGES_OUT, Constants.CT_IS_DESC_FOR_1);
            // Check connected entity types in general
            if (oCxns2EntityTypeDefs.length > 0) {
                var oConnEntityTypeDef = oCxns2EntityTypeDefs[0].TargetObjDef(); 
                if (oRefEntityTypeDef == null) {
                    oRefEntityTypeDef = oConnEntityTypeDef;
                }
                if (!oRefEntityTypeDef.IsEqual(oConnEntityTypeDef)) bIsEntityOk = false;
            } else {
                bIsEntityOk = false;
            }
            if (!bIsEntityOk)
                setInfoMark(mapInfoMarks, oDAttribute, getString("ERR_WRONG_ENTITY_TYPE"), Constants.MODEL_INFO_ERROR);
            
            // check connected data type
            if (oRefDataTypeDef == null) continue;
            var bIsDataTypeOk = false;
            for (var j = 0; j < oCxns2EntityTypeDefs.length; j++) {
                var oConnDataTypeDef = oCxns2EntityTypeDefs[j].TargetObjDef(); 
                if (oRefDataTypeDef.IsEqual(oConnDataTypeDef)) {
                    bIsDataTypeOk = true;
                    break;
                }
            }
            if (!bIsDataTypeOk)
                setInfoMark(mapInfoMarks, oDAttribute, formatstring1(getString("ERR_WRONG_DATA_TYPE"), oRefDataTypeDef.Name(gn_Lang)), Constants.MODEL_INFO_ERROR);
        }
    }
}
   
function check_Data_TypeDefinitionsOfRestrictions(mapInfoMarks, oModel) {
    // The attributes defined for a restriction (connected via uses connection) can also have a type definition (via "references" connection).   
    //if a restriction attribute has a connected a type (via "references" connection) then the connected type must have a "has relationship to" connection (definition level) to the base type of the restriction.
    var oAttributes = getAttributeObjects(oModel, [Constants.ST_DESC_ATTR_SD]);
    for (var i = 0; i < oAttributes.length; i++) {
        var oAttribute = oAttributes[i];
        // Attribute -> Restrictions
        var oConnRestrictions = getConnectedObjectsBySymbol(oAttribute, Constants.EDGES_OUT, Constants.CT_REFERENCES, Constants.ST_RESTRICTION_SD);
        for (var j = 0; j < oConnRestrictions.length; j++) {
            var oRestriction = oConnRestrictions[j];
            // Restriction -> Data types
            var oConnDataTypesOfRestr = getConnectedObjectsBySymbol(oRestriction, Constants.EDGES_OUT, Constants.CT_IS_RESTRICTION_OF, Constants.ST_DATA_TYPE_SD);
            if (oConnDataTypesOfRestr.length > 0) {
                // Restriction -> D-Attributes
                var oConnDAttributes = getConnectedObjectsBySymbol(oRestriction, Constants.EDGES_OUT, Constants.CT_USES_SD, Constants.ST_DESC_ATTR_SD);
                for (var k = 0; k < oConnDAttributes.length; k++) {
                    var oConnDAttribute = oConnDAttributes[k];
                    // D-Attribute -> Data types
                    var oConnDataTypesOfAttr = getConnectedObjectsBySymbol(oConnDAttribute, Constants.EDGES_OUT, Constants.CT_REFERENCES, Constants.ST_DATA_TYPE_SD);
                    for (var m = 0; m < oConnDataTypesOfAttr.length; m++) {
                        validateRelationship(oConnDataTypesOfAttr[m], oConnDataTypesOfRestr[0]);
                    }
                }
            }
        }
    }
}

function check_Data_RecursiveRestrictions(mapInfoMarks, oModel) {
    // Restriction can be defined recursive.  The attribute of a restriction can have as type a other restriction.
    // The base-type of the restriction must have a  "has relationship to" connection (definition level) to the base type of the second restriction.
    // Both base-types must not have occurrences in the model or have a "is restriction of" connection to the "Restriction (Solution Design)" object. 
    // The base types can also be implicitly defined via "is describing for" connection (definition level) between the "D attribute (Solution Design)" and the Entity Base type object (see section Restrictions).
    var oAttributes = getAttributeObjects(oModel, [Constants.ST_DESC_ATTR_SD]);
    for (var i = 0; i < oAttributes.length; i++) {
        var oAttribute = oAttributes[i];
        // Attribute -> Restrictions
        var oConnRestrictions = getConnectedObjectsBySymbol(oAttribute, Constants.EDGES_OUT, Constants.CT_REFERENCES, Constants.ST_RESTRICTION_SD);
        for (var j = 0; j < oConnRestrictions.length; j++) {
            var oRestriction = oConnRestrictions[j];
            // Restriction -> Data types
            var oConnDataTypesOfRestr = getConnectedObjectsBySymbol(oRestriction, Constants.EDGES_OUT, Constants.CT_IS_RESTRICTION_OF, Constants.ST_DATA_TYPE_SD);
            if (oConnDataTypesOfRestr.length > 0) {
                // Restriction -> D Attributes
                var oConnDAttributes = getConnectedObjectsBySymbol(oRestriction, Constants.EDGES_OUT, Constants.CT_USES_SD, Constants.ST_DESC_ATTR_SD);
                for (var k = 0; k < oConnDAttributes.length; k++) {
                    var oConnDAttribute = oConnDAttributes[k];
    
                    // D-Attributes -> Restrictions (= Restrictions of connected D-Attributes)
                    var oConnRestrictions2 = getConnectedObjectsBySymbol(oConnDAttribute, Constants.EDGES_OUT, Constants.CT_REFERENCES, Constants.ST_RESTRICTION_SD);
                    for (var m = 0; m < oConnRestrictions2.length; m++) {
                        var oRestriction2 = oConnRestrictions2[m];
                        // Restriction -> Data types
                        var oConnDataTypesOfRestr2 = getConnectedObjectsBySymbol(oRestriction2, Constants.EDGES_OUT, Constants.CT_IS_RESTRICTION_OF, Constants.ST_DATA_TYPE_SD);
    
                        for (var n = 0; n < oConnDataTypesOfRestr2.length; n++) {
                            validateRelationship(oConnDataTypesOfRestr2[n], oConnDataTypesOfRestr[0]);
                        }
                    }
                }
            }
        }
    }
}
    
function check_Data_ElementsWithoutConnectionToDataObject(mapInfoMarks, oModel) {
    // All elements should have a (indirect) connection to the "Data object".  
    // Every  "D attribute (Solution design)" should have a "consists of" connection to the "Data object". 
    // Every "Data type (Solution design)" should have  a "consists of" connection to the "Data object" or a "references" connection to a "D attribute (Solution design)". 
    // If this condition is false for a element in the model than a error mark should be set for this element. 
    var oElements = oModel.ObjOccListFilter();
    for (var i = 0; i < oElements.length; i++) {
        var oElement = oElements[i];
        if (oElement.ObjDef().TypeNum() == Constants.OT_CLST) continue;
        // D attribute
        if (oElement.SymbolNum() == Constants.ST_DESC_ATTR_SD) {
            var oConnDataObjects = getConnectedDataObjects(oElement, Constants.EDGES_IN, Constants.CT_CONS_OF_2);
            var oConnRestrictions = getConnectedObjectsBySymbol(oElement, Constants.EDGES_IN, Constants.CT_USES_SD, Constants.ST_RESTRICTION_SD);
            
            if ( !(oConnDataObjects.length + oConnRestrictions.length > 0) )
                setInfoMark(mapInfoMarks, oElement, getString("ERR_CXN_MISSSING_FOR_D_ATTR"), Constants.MODEL_INFO_ERROR);

        }
        // Data type
        if (oElement.SymbolNum() == Constants.ST_DATA_TYPE_SD) {
            var oConnDAttributes = getConnectedObjectsBySymbol(oElement, Constants.EDGES_IN, Constants.CT_REFERENCES, Constants.ST_DESC_ATTR_SD);
            var oConnRestrictions = getConnectedObjectsBySymbol(oElement, Constants.EDGES_IN, Constants.CT_IS_RESTRICTION_OF, Constants.ST_RESTRICTION_SD);
            
            if ( !(oConnDAttributes.length + oConnRestrictions.length > 0) )
                setInfoMark(mapInfoMarks, oElement, getString("ERR_CXN_MISSSING_FOR_DATA_TYPE"), Constants.MODEL_INFO_ERROR);
        }
        // Restriction
        if (oElement.SymbolNum() == Constants.ST_RESTRICTION_SD) {
            var oConnDAttributes = getConnectedObjectsBySymbol(oElement, Constants.EDGES_IN, Constants.CT_REFERENCES, Constants.ST_DESC_ATTR_SD);

            if ( !(oConnDAttributes.length > 0) )
                setInfoMark(mapInfoMarks, oElement, getString("ERR_CXN_MISSSING_FOR_RESTR"), Constants.MODEL_INFO_ERROR);
        }
    }      
}
    
function check_Data_UnnamedElements(mapInfoMarks, oModel) {
    // Add a warning mark if a ObjOcc in the model is not  named.
    var oObjOccs = oModel.ObjOccList();
    for (var i = 0; i < oObjOccs.length; i++) {
        var oObjOcc = oObjOccs[i];
        if (!oObjOcc.ObjDef().Attribute(Constants.AT_NAME, gn_Lang).IsMaintained()) {
            setInfoMark(mapInfoMarks, oObjOcc, getString("WRG_UNNAMED"), Constants.MODEL_INFO_WARNING);
        }
    }
}

function check_Data_ElementsWithSameName(mapInfoMarks, oModel) {
    const c_ConsistOf_DataType = 0;
    const c_Uses_Restriction   = 1;    
    
    // Warn if Attributes connected to one type/ data object have the same name.
    var oDAttributes = getAttributeObjects(oModel, [Constants.ST_DESC_ATTR_SD]);
    
    validateElementNames(oDAttributes, c_ConsistOf_DataType);
    validateElementNames(oDAttributes, c_Uses_Restriction);
    
    function validateElementNames(oDAttributes, nConnType) {
        for (var i = 0; i < oDAttributes.length; i++) {
            var oDAttribute_A = oDAttributes[i];
            var oConnDataObjects_A = getConnectedObjects(oDAttribute_A);
            for (var j = 0; j < oConnDataObjects_A.length; j++) {
                var oConnDataObject_A = oConnDataObjects_A[j];
                
                for (var k = 0; k < oDAttributes.length; k++) {
                    var oDAttribute_B = oDAttributes[k];
                    if (oDAttribute_B.IsEqual(oDAttribute_A)) continue;
                    
                    var oConnDataObjects_B = getConnectedObjects(oDAttribute_B);
                    for (var m = 0; m < oConnDataObjects_B.length; m++) {
                        var oConnDataObject_B = oConnDataObjects_B[m];
                        if (!oConnDataObject_A.IsEqual(oConnDataObject_B)) continue;
                        
                        var sNameA = oDAttribute_A.ObjDef().Name(gn_Lang);
                        var sNameB = oDAttribute_B.ObjDef().Name(gn_Lang);
                        if (StrComp(sNameA, sNameB) == 0) {
                            setInfoMark(mapInfoMarks, oDAttribute_A, formatstring1(getString("WRG_SAME_NAME"), sNameA), Constants.MODEL_INFO_WARNING);
                        }
                    }
                }
            }
        }
        
        function getConnectedObjects(oDAttribute) {
            if (nConnType == c_ConsistOf_DataType)  return getConnectedDataObjects(oDAttribute, Constants.EDGES_IN, Constants.CT_CONS_OF_2);
            if (nConnType == c_Uses_Restriction)    return getConnectedObjectsBySymbol(oDAttribute, Constants.EDGES_IN, Constants.CT_USES_SD, Constants.ST_RESTRICTION_SD);
            return [];
        }
    }
}

function check_Data_OccurrenceCopies(mapInfoMarks, oModel) {
    // Occurrence copies of restrictions and attributes  (in one model) are not allowed (Error).
    // Warn if Attributes connected to one type/ data object have the same name.
    var oCheckedItems = new Array();
    var oDAttributes = getAttributeObjects(oModel, [Constants.ST_DESC_ATTR_SD]);
    for (var i = 0; i < oDAttributes.length; i++) {
        validateOccurrenceCopies(oDAttributes[i].ObjDef());
    }
    
    var oRestrictions = oModel.ObjOccListBySymbol(Constants.ST_RESTRICTION_SD);    
    for (var i = 0; i < oRestrictions.length; i++) {
        validateOccurrenceCopies(oRestrictions[i].ObjDef());
    }    
    
    function validateOccurrenceCopies(oObjDef) {
        if (iselementinlist(oObjDef, oCheckedItems, new __holder(0))) return;
        
        var oObjOccList = oObjDef.OccListInModel(oModel);
        if (oObjOccList.length <= 1) return;
        
        for (var i = 0; i < oObjOccList.length; i++) {
            setInfoMark(mapInfoMarks, oObjOccList[i], getString("ERR_OCCURENCE_COPY"), Constants.MODEL_INFO_ERROR);
        }
        oCheckedItems.push(oObjDef);
    }
}

function getAssignedDataModels(p_oModel) {
    var aAssignedModels = new Array();
    var aOccs   = p_oModel.ObjOccList();
    for(var i=0; i<aOccs.length; i++){
        aAssignedModels = aAssignedModels.concat( aOccs[i].ObjDef().AssignedModels( getDataModelTypes() ) );
    }
    aAssignedModels.clearDuplicities();
    return aAssignedModels;
}

/***********************************************************************************************************************/
/* SCREEN                                                                                                              */
/***********************************************************************************************************************/

function check_ModelForErrors_Screen( mapInfoMarks, oScreenModels ) {    
    for(var i = 0; i < oScreenModels.length; i++) {
        var oScreenModel = oScreenModels[i];
        if (isModelAlreadyChecked(oScreenModel, g_oCheckedScreenModels)) continue;
        
        check_Screen_OnlyOneRoot( mapInfoMarks, oScreenModel);
        check_Screen_ValidRoot( mapInfoMarks, oScreenModel ); 
        check_Screen_Circle( mapInfoMarks, oScreenModel );
        if(!gb_c_ERROR_MARK_SET){ // if an error exists in the circle check the other tests might produce a stacktrace overflow
            check_Screen_AllowedChildren( mapInfoMarks, oScreenModel );
            check_Screen_OnlyOneParent( mapInfoMarks, oScreenModel );
            check_Screen_Location( mapInfoMarks, oScreenModel );
            check_Data_Overlapping( mapInfoMarks, oScreenModel );
            check_Screen_ChildrenNumber( mapInfoMarks, oScreenModel );
            check_Screen_Layout( mapInfoMarks, oScreenModel );
            check_Screen_ControlID( mapInfoMarks, oScreenModel );
        }
        var oAssignedScreenModels = getAssignedScreenModels( oScreenModel );
        check_ModelForErrors_Screen( mapInfoMarks, oAssignedScreenModels );
    }
}

function check_Screen_OnlyOneRoot(mapInfoMarks, oModel) {
    // Only one root element allowed 
    // Only one objocc allowed which has no incoming "contains" connection.
    // Set Error mark should be set (Error multiple root elements)
    var oRootElements = getRootElements(oModel);
    if (oRootElements.length <= 1) return;
    
    for (var i = 0; i < oRootElements.length; i++) {
        setInfoMark(mapInfoMarks, oRootElements[i], getString("ERR_MULTIPLE_ROOT"), Constants.MODEL_INFO_ERROR);
    }
}

function check_Screen_ValidRoot(mapInfoMarks, oModel) {
    // Root object must be a valid root object
    // Root objocc must be a allowed root object (see table Screen Design Export column "Root element")
    // Set Error mark should be set (Error wrong root element type
    var oRootElements = getRootElements(oModel);
    for (var i = 0; i < oRootElements.length; i++) {
        if (!isValidRootElement(oRootElements[i])) {
            setInfoMark(mapInfoMarks, oRootElements[i], getString("ERR_INVALID_ROOT_TYPE"), Constants.MODEL_INFO_ERROR);
        }
    }
    
    function isValidRootElement(oRootElement) {
        var aRootElementSymbols = getRootElementSymbols();
        for (var i = 0; i < aRootElementSymbols.length; i++) {
            if(oRootElement.SymbolNum() == aRootElementSymbols[i]) return true;
        }
        return false;
    }
}

function check_Screen_Circle(mapInfoMarks, oModel) {
    // No circular dependencies between elements with "contains" connections
    // E.g: If element A contains element B and element  B  contains element C then element C can not contain element A.
    // Error mark should be set (Circular dependencies between elements)
    var aCycles = oModel.Cycles();
    for (var i = 0; i < aCycles.length; i++) {
        
        validateCycle(aCycles[i]);
    }

    function validateCycle(oCycleElements) {
        if (isContainsCycle(oCycleElements)) {
            for (var i = 0; i < oCycleElements.length; i++) {
                setInfoMark(mapInfoMarks, oCycleElements[i], getString("ERR_CIRCULAR_DEPENDENCIES"), Constants.MODEL_INFO_ERROR);
            }
        }
        
        function isContainsCycle(oCycleElements) {
            return isParentCycle(oCycleElements) || isChildCycle(oCycleElements);
            
            function isParentCycle(oCycleElements) {
                for (var i = 0; i < oCycleElements.length; i++) {
                    var oElementA = oCycleElements[i];
                    var oElementB = (i+1 < oCycleElements.length) ? oCycleElements[i+1] : oCycleElements[0];
                    
                    if (!isParent(oElementA, oElementB)) return false;
                }
                return true;
            }
            
            function isChildCycle(oCycleElements) {
                for (var i = 0; i < oCycleElements.length; i++) {
                    var oElementA = oCycleElements[i];
                    var oElementB = (i+1 < oCycleElements.length) ? oCycleElements[i+1] : oCycleElements[0];
                    
                    if (!isChild(oElementA, oElementB)) return false;
                }
                return true;
            }    
        }
    }
}

function check_Screen_AllowedChildren(mapInfoMarks, oModel) {
    // Check allowed children of elements
    // Every element has a set of allowed children only this elements can be added as children  (see table Screen Design Export column "Children")
    // Error mark should be set (Circular dependencies between elements)
    var childElementMap = getChildElementMap();
    
    var oElements = getLayoutElements(oModel);
    for (var i = 0; i < oElements.length; i++) {
        var oElement = oElements[i];
        var oChildElements = getChildElements(oElement);
        for (var j = 0; j < oChildElements.length; j++) {
            var oChildElement = oChildElements[j]

            if (!isValidChildElementType(childElementMap, oElement.SymbolNum(), oChildElement.SymbolNum())) {
                setInfoMark(mapInfoMarks, oChildElement, formatstring1(getString("ERR_NOT_ALLOWED_CHILD"), oElement.ObjDef().Name(gn_Lang)), Constants.MODEL_INFO_ERROR);
            }
        }
    }
}

function check_Screen_OnlyOneParent(mapInfoMarks, oModel) {
    // Check elements have only one parent element
    // Every element should only have one incoming "contains" connection 
    //Error mark should be set (Element with multiple parent elements)
    var oElements = getLayoutElements(oModel);
    for (var i = 0; i < oElements.length; i++) {
        var oElement = oElements[i];
        var oParentElements = getParentElements(oElement);
        
        if (oParentElements.length > 1) {
            setInfoMark(mapInfoMarks, oElement, getString("ERR_MULTIPLE_PARENTS"), Constants.MODEL_INFO_ERROR);
        }
    }
}

function check_Screen_Location(mapInfoMarks, oModel) {
    // Element should be located in his patent element  (except root element which has no parent)
    // Every parent element should be  located in the bounds of his parent element.
    // Warning mark should be set (Element should be located in parent element)
    
    var oElements = getLayoutElements(oModel);
    for (var i = 0; i < oElements.length; i++) {
        var oElement = oElements[i];

        var oParentElements = getParentElements(oElement);
        for (var j = 0; j < oParentElements.length; j++) {
            
            if (!isLocatedIn(oElement, oParentElements[j])) {
                setInfoMark(mapInfoMarks, oElement, getString("WRG_LOCATION_OUTSIDE_OF_PARENT"), Constants.MODEL_INFO_WARNING);
            }
        }
    }
    
    function isLocatedIn(oElement, oParentElement) {
        var rectangle = getRectangle(oElement);
        var parentRectangle = getRectangle(oParentElement);

        return (rectangle.getX() >= parentRectangle.getX() &&
                rectangle.getX() + rectangle.getWidth() <= parentRectangle.getX() + parentRectangle.getWidth() &&
                rectangle.getY() >= parentRectangle.getY() &&
                rectangle.getY() + rectangle.getHeight() <= parentRectangle.getY() + parentRectangle.getHeight());
    }
}

function check_Data_Overlapping(mapInfoMarks, oModel) {
    // Elements should not be overlapping each other (except a contains connection exist between the elements) 
    // Warning mark should be set (Element should not be overlapping each other)
    var oElements = getLayoutElements(oModel);
    for (var i = 0; i < oElements.length; i++) {
        var oElementA = oElements[i];
        for (var j = 0; j < oElements.length; j++) {
            var oElementB = oElements[j];
            if (oElementA.IsEqual(oElementB)) continue;
            if (hasContainsCxn(oElementA, oElementB)) continue;
                    
            var rectangleA = getRectangle(oElementA);
            var rectangleB = getRectangle(oElementB);
            
            if (rectangleA.intersects(rectangleB)) {
                setInfoMark(mapInfoMarks, oElementA, getString("WRG_ELEMENT_OVERLAP"), Constants.MODEL_INFO_WARNING);
            }
        }
    }
    
    function hasContainsCxn(oElementA, oElementB) {
        if (isParent_transitive(oElementA, oElementB)) return true;
        if (isChild_transitive(oElementA, oElementB)) return true;        
        return false;
    }
}

function check_Screen_ChildrenNumber(mapInfoMarks, oModel) {
    // Children number
    // Per default only one child is allowed (for elements which have allowed children) except the    children which are marked with "*" in the table Screen Design Export column "Children"
    // Error mark should be set (Element only one child of the type .. is allowed)
    var childElementMap = getChildElementMap();
    var multipleChildElementMap = getMultipleChildElementMap();
    
    var oElements = getLayoutElements(oModel);
    for (var i = 0; i < oElements.length; i++) {
        var oElement = oElements[i];

        var sRefSymbolNum = null;
        var bIsMultiChildRef = false;
        
        var oChildElements = ArisData.sort(getChildElements(oElement), Constants.SORT_Y, Constants.SORT_X, gn_Lang);
        for (var j = 0; j < oChildElements.length; j++) {
            var oChildElement = oChildElements[j];
            if (!isValidChildElementType(childElementMap, oElement.SymbolNum(), oChildElement.SymbolNum())) continue;
            // get 'symbol reference'
            if (sRefSymbolNum == null) {
                sRefSymbolNum = oChildElement.SymbolNum();
                bIsMultiChildRef = isValidChildElementType(multipleChildElementMap, oElement.SymbolNum(), oChildElement.SymbolNum());
                continue;
            }
            // check all other symbols against the 'symbol reference'
            if (!(bIsMultiChildRef && isValidChildElementType(multipleChildElementMap, oElement.SymbolNum(), oChildElement.SymbolNum()))) {
                var sSymbolName = oChildElement.SymbolName();
                setInfoMark(mapInfoMarks, oElement, formatstring1(getString("ERR_NO_FURTHER_CHILDREN_ALLOWED"), sSymbolName), Constants.MODEL_INFO_ERROR);
            }                
        }            
    }
}

function check_Screen_Layout(mapInfoMarks, oModel) {
    // Layout of elements with multiple children
    // The elements which allow multiple children (children marked with "*") have in the table on page  Screen Design Export  a layout type  (column Layout)
    // If the layout value is vertical all children of the element should be in a vertical layout (ordered below each other ), if the value is in the table horizontal the layout of the children should be horizontal (in a line next to each other). In the other case this rule can be ignored.
    // Warning mark should be set (Element should be ordered horizontal/vertical)
    var multipleChildElementMap = getMultipleChildElementMap();
    var childElementLayoutMap = getChildElementLayoutMap();
    
    var oElements = getLayoutElements(oModel);
    for (var i = 0; i < oElements.length; i++) {
        var oElement = oElements[i];

        var childTypeMap = new java.util.HashMap();
        var oChildElements = getFilteredMultipleChildElements(oElement);
        if (oChildElements <= 1) continue;

        if (!childElementLayoutMap.containsKey(oElement.SymbolNum())) continue;
        var bVertical = (childElementLayoutMap.get(oElement.SymbolNum()) == true);  // Maybe 'Boolean' instead of 'boolean' 

        validateLayoutOfChildElements(oChildElements, bVertical);
    }
        
    function validateLayoutOfChildElements(oChildElements, bVertical) {
        if (bVertical) {
            oChildElements = ArisData.sort(oChildElements, Constants.SORT_Y, Constants.SORT_X, gn_Lang);
        } else {
            oChildElements = ArisData.sort(oChildElements, Constants.SORT_X, Constants.SORT_Y, gn_Lang);
        }
        for (var i = 0; i < oChildElements.length-1; i++) {
            var bLayoutOk = true;
            var oChildElement     = oChildElements[i];
            var oNextChildElement = oChildElements[i+1];            
            
            if (bVertical) {
                if (oChildElement.Y() + oChildElement.Height() > oNextChildElement.Y()) bLayoutOk = false;
                if (Math.abs(oChildElement.X() - oNextChildElement.X()) > g_layoutDelta) bLayoutOk = false;
            } else {
                if (oChildElement.X() + oChildElement.Width() > oNextChildElement.X()) bLayoutOk = false;
                if (Math.abs(oChildElement.Y() - oNextChildElement.Y()) > g_layoutDelta) bLayoutOk = false;
            }
            
            if (!bLayoutOk) {
                if (bVertical)
                    setInfoMark(mapInfoMarks, oNextChildElement, formatstring1(getString("WRG_LAYOUT_VERTICAL"), oNextChildElement.SymbolName()), Constants.MODEL_INFO_WARNING);
                else
                    setInfoMark(mapInfoMarks, oNextChildElement, formatstring1(getString("WRG_LAYOUT_HORIZONTAL"), oNextChildElement.SymbolName()), Constants.MODEL_INFO_WARNING);
            }
        }
    }
    
    function getFilteredMultipleChildElements(oElement) {
        var multipleChildElementTypes = getMultipleChildElementTypes(oElement.SymbolNum());
        if (multipleChildElementTypes == null) return [];
        
        var oFilteredChildElements = new Array();
        var oChildElements = getChildElements(oElement);
        for (var i = 0; i < oChildElements.length; i++) {
            var oChildElement = oChildElements[i];
            
            for (var j = 0; j < multipleChildElementTypes.length; j++) {
                if (oChildElement.SymbolNum() == multipleChildElementTypes[j]) {
                    oFilteredChildElements.push(oChildElement)
                    break;
                }
            }
        }
        return oFilteredChildElements;
        
        function getMultipleChildElementTypes(elementType) {
            if (multipleChildElementMap.containsKey(elementType)) {
                return multipleChildElementMap.get(elementType);
            }
            return null;
        }
    }
}

function check_Screen_ControlID(mapInfoMarks, oModel) {
    // All elements in the model should have a unique value for the attribute "Control ID" or a unset value
    // Error mark should be set (Multiple elements with same control ID)
    var controlIdMap = new java.util.HashMap();
    
    var oElements = getLayoutElements(oModel);
    for (var i = 0; i < oElements.length; i++) {
        var oElement = oElements[i];
        var oAttr = oElement.ObjDef().Attribute(Constants.AT_CONTROL_ID, gn_Lang);
        if (!oAttr.IsMaintained()) continue;
        
        var key = new java.lang.String(oAttr.getValue());
        var value = [oElement];
        if (controlIdMap.containsKey(key)) {
            value = value.concat(controlIdMap.get(key));
        }
        controlIdMap.put(key, value);
    }

    var iter = controlIdMap.keySet().iterator();
    while (iter.hasNext()) {
        var key = iter.next();
        var value = controlIdMap.get(key);  // Array of elements with this attribute value (cmp. 'key')

        if (value.length > 1) {
            for (var i = 0; i < value.length; i++) {
                var oElement = value[i];
                setInfoMark(mapInfoMarks, oElement, formatstring1(getString("ERR_SAME_CONTROLID"), key), Constants.MODEL_INFO_ERROR);
            }
        }
    }
}

function getRootElements(oModel) {
    var oRootElements = new Array();
    var oObjOccs = getLayoutElements(oModel);
    for (var i = 0; i < oObjOccs.length; i++) {
        var oObjOcc = oObjOccs[i];
        var oIncomingContainsCxns = getContainsCxns(oObjOcc, Constants.EDGES_IN);
        if (oIncomingContainsCxns.length == 0) {
            oRootElements.push(oObjOcc);
        }
    }
    return oRootElements;
}

function getContainsCxns(oObjOcc, nDirection) {
    var oContainsCxns = new Array();
    var oCxns = oObjOcc.Cxns(nDirection);
    for (var i = 0; i < oCxns.length; i++) {
        var oCxnOcc = oCxns[i];
        if (oCxnOcc.CxnDef().TypeNum() == Constants.CT_CONTAINS_2) {
            oContainsCxns.push(oCxnOcc);
        }
    }
    return oContainsCxns;
}

function isParent(oElementA, oElementB) {
    // checks if ElementB is parent of ElementA
    var oParentElements = getParentElements(oElementA);
    for (var i = 0; i < oParentElements.length; i++) {
        if (oElementB.IsEqual(oParentElements[i])) return true;
    }     
    return false;
}

function isParent_transitive(oElementA, oElementB) {
    // checks if ElementB is transitive parent of ElementA
    var oParentElements = getParentElements(oElementA);
    for (var i = 0; i < oParentElements.length; i++) {
        // check direct parent
        if (oElementB.IsEqual(oParentElements[i])) return true;
        // check transitive parent
        if (isParent_transitive(oParentElements[i], oElementB)) return true;
    }
    return false;
}

function isChild(oElementA, oElementB) {
    // checks if ElementB is child of ElementA
    var oChildElements = getChildElements(oElementA);
    for (var i = 0; i < oChildElements.length; i++) {
        if (oElementB.IsEqual(oChildElements[i])) return true;
    }        
    return false;
}

function isChild_transitive(oElementA, oElementB) {
    // checks if ElementB is tranitive child of ElementA
    var oChildElements = getChildElements(oElementA);
    for (var i = 0; i < oChildElements.length; i++) {
        // check direct child
        if (oElementB.IsEqual(oChildElements[i])) return true;
        // check transitive child
        if (isChild_transitive(oChildElements[i], oElementB)) return true;
    }        
    return false;
}
    
function getParentElements(oObjOcc) {
    var oParents = new Array();
    var oIncomingContainsCxns = getContainsCxns(oObjOcc, Constants.EDGES_IN);
    for (var i = 0; i < oIncomingContainsCxns.length; i++) {
        oParents.push(oIncomingContainsCxns[i].SourceObjOcc());
    }
    return oParents;
}

function getChildElements(oObjOcc) {
    var oChildren = new Array();
    var oOutgoingContainsCxns = getContainsCxns(oObjOcc, Constants.EDGES_OUT);
    for (var i = 0; i < oOutgoingContainsCxns.length; i++) {
        oChildren.push(oOutgoingContainsCxns[i].TargetObjOcc());
    }
    return oChildren;
}

function getRectangle(oObjOcc) {
    return new java.awt.Rectangle(oObjOcc.X(), oObjOcc.Y(), oObjOcc.Width(), oObjOcc.Height());
}

function getAssignedScreenModels(p_oModel) {
    var aAssignedModels = new Array();
    var aOccs   = p_oModel.ObjOccList();
    for(var i=0; i<aOccs.length; i++){
        aAssignedModels = aAssignedModels.concat( aOccs[i].ObjDef().AssignedModels( getScreenModelTypes() ) );
    }
    aAssignedModels.clearDuplicities();
    return aAssignedModels;
}

function isValidChildElementType(childElementMap, elementType, childElementType) {
    if (childElementMap.containsKey(elementType)) {
        var aChildElementTypes = childElementMap.get(elementType);
        for (var i = 0; i < aChildElementTypes.length; i++) {
            if (childElementType == aChildElementTypes[i]) return true;
        }
    }
    return false;
}

function getLayoutElements(oModel) {
    var oVertLanes = oModel.GetLanes(Constants.LANE_VERTICAL);
    for (var i = 0; i < oVertLanes.length; i++) {
        var oVertLane = oVertLanes[i];
        if (oVertLane.TypeNum() != Constants.LT_LAYOUT) continue;
        
        // return only elements in lane "Layout"
        return oVertLane.ObjOccs();
    }
    return [];
}

/***********************************************************************************************************************/
/* SERVICE                                                                                                             */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* common                                                                                                              */
/***********************************************************************************************************************/

function validateRelationship(oDataTypeOfAttr, oRefDataType) {
    if (!validateRelationship2())
        setInfoMark(mapInfoMarks, oDataTypeOfAttr, formatstring1(getString("ERR_RELATION_TO_DATA_TYPE_OF_RESTR"), oRefDataType.ObjDef().Name(gn_Lang)), Constants.MODEL_INFO_ERROR);
    
    function validateRelationship2() {
        var oInCxns = oDataTypeOfAttr.ObjDef().CxnListFilter(Constants.EDGES_IN, Constants.CT_HAS_REL_WITH);
        for (var i = 0; i < oInCxns.length; i++) {
            if (validateRelationship3(oInCxns[i].SourceObjDef())) return true;
        }
        var oOutCxns = oDataTypeOfAttr.ObjDef().CxnListFilter(Constants.EDGES_OUT, Constants.CT_HAS_REL_WITH);
        for (var i = 0; i < oOutCxns.length; i++) {
            if (validateRelationship3(oOutCxns[i].TargetObjDef())) return true;
        }
        return false;
        
        function validateRelationship3(oObjDef) {
            return oObjDef.IsEqual(oRefDataType.ObjDef());
        }
    }
}

function getAttributeObjects(oModel, aAttrSymbolNums) {
    return oModel.ObjOccListBySymbol(aAttrSymbolNums);
    /*
    var oRelevantAttributes = new Array();
    var oAttributes = oModel.ObjOccListBySymbol(aAttrSymbolNums);
    for (var i = 0; i < oAttributes.length; i++) {
        var oAttribute = oAttributes[i];
        var oConnDataObjects = getConnectedDataObjects(oAttribute, Constants.EDGES_IN, Constants.CT_CONS_OF_2);
        if (oConnDataObjects.length > 0) {
            oRelevantAttributes.push(oAttribute);
        }
    }
    return oRelevantAttributes;
    */    
}
    
function getConnectedDataObjects(oObjOcc, nInOut, nCxnTypeNum) {
    var oDataObjects = new Array();
    var oCxnOccs = oObjOcc.Cxns(nInOut);
    for (var i = 0; i < oCxnOccs.length; i++) {
        var oCxnOcc = oCxnOccs[i];
        if (oCxnOcc.CxnDef().TypeNum() != nCxnTypeNum) continue;
        
        var oConnDataObject = (nInOut == Constants.EDGES_OUT) ? oCxnOcc.TargetObjOcc() : oCxnOcc.SourceObjOcc();
        if (oConnDataObject.ObjDef().TypeNum() == Constants.OT_CLST) {
            oDataObjects.push(oConnDataObject);
        }
    }
    return oDataObjects;
}    

function getConnectedObjectsBySymbol(oObjOcc, nInOut, nCxnTypeNum, nConnSymbolNum) {
    var oConnObjects = new Array();
    var oCxnOccs = oObjOcc.Cxns(nInOut);
    for (var i = 0; i < oCxnOccs.length; i++) {
        var oCxnOcc = oCxnOccs[i];
        if (oCxnOcc.CxnDef().TypeNum() != nCxnTypeNum) continue;
        
        var oConnObject = (nInOut == Constants.EDGES_OUT) ? oCxnOcc.TargetObjOcc() : oCxnOcc.SourceObjOcc();
        if (nConnSymbolNum == null /*no symbol restriction*/ || nConnSymbolNum == oConnObject.SymbolNum()) {
            oConnObjects.push(oConnObject);
        }
    }
    return oConnObjects;
}

function isOccInList(oObjOcc, oObjOccList) {
    for (var i = 0; i < oObjOccList.length; i++) {
        if (oObjOcc.IsEqual(oObjOccList[i])) return true;
    }
    oObjOccList.push(oObjOcc);
    return false;
}

function filterProcessModels(oModels) {
    if (!getBoolPropertyValue(c_PROCESS)) return [];
    return filterModels( oModels, getProcessModelTypes() );
}

function filterDataModels(oModels) {
    if (!getBoolPropertyValue(c_DATA)) return [];
    return filterModels( oModels, getDataModelTypes() );
}

function filterScreenModels(oModels) {
    if (!getBoolPropertyValue(c_SCREEN)) return [];
    var directModels = filterModels( oModels, getScreenModelTypes() );   
    var assignedModels = getAssignedScreenModels();
    return directModels.concat(assignedModels);
    
    
    function getAssignedScreenModels() {
        var oScreenModels = new Array();
        var oProcessModels = filterModels( oModels, getProcessModelTypes() );
        for (var i = 0; i < oProcessModels.length; i++) {
            
            var oTasks = oProcessModels[i].ObjOccListBySymbol(getTaskSymbols());
            for (var j = 0; j < oTasks.length; j++) {
                var oTaskDef = oTasks[j].ObjDef();
                var oAssFadModels = oTaskDef.AssignedModels(Constants.MT_FUNC_ALLOC_DGM);
                if (oAssFadModels.length == 0) continue;
                
                var oAssTasks = oTaskDef.OccListInModel(oAssFadModels[0]);
                for (var k = 0; k < oAssTasks.length; k++) {
                    var oAssTask = oAssTasks[k];                    
                    var oConnScreenDesigns = oAssTask.getConnectedObjOccs(Constants.ST_SCREEN_SD);
                    if (oConnScreenDesigns.length == 0) continue;

                    var oAssScreenModels = oConnScreenDesigns[k].ObjDef().AssignedModels(Constants.MT_SCREEN_DESIGN_SD);
                    if (oAssScreenModels.length > 0) {
                        oScreenModels = oScreenModels.concat(oAssScreenModels);
                    }
                }
            }
        }
        return oScreenModels;
    }
}

function filterModels(oModels, aModelTypes) {
    var oFilteredModels = new Array();

    for (var i = 0; i < oModels.length; i++) {
        var oModel = oModels[i];
        if (isInFilter(oModel)) oFilteredModels.push(oModel)
    }
    return oFilteredModels;    

    function isInFilter(oModel) {
        for (var j = 0; j < aModelTypes.length; j++) {
            if (oModel.TypeNum() == aModelTypes[j]) return true;
        }
        return false;
    }
} 

function isModelAlreadyChecked(oModel, oCheckedModels) {
    for (var i = 0; i < oCheckedModels.length; i++) {
        if (oModel.IsEqual(oCheckedModels[i])) return true;
    }
    oCheckedModels.push(oModel);
    return false;
}

function getProcessModelTypes() {
    return [Constants.MT_BPMN_COLLABORATION_DIAGRAM];
}

function getDataModelTypes() {
    return [Constants.MT_DOCUMENT_STRUCTURE_SD];
}

function getScreenModelTypes() {
    return [Constants.MT_SCREEN_DESIGN_SD];
}

function getStartEventSymbols() {
    return [Constants.ST_BPMN_MESSAGE_START_NI,             // Message start event (non-interrupting)
            Constants.ST_BPMN_TIMER_START_NI,               // Timer start event (non-interrupting)
            Constants.ST_BPMN_ERROR_START,                  // Error start event
            Constants.ST_BPMN_ESCALATION_START,             // Escalation start event
            Constants.ST_BPMN_ESCALATION_START_NI,          // Escalation start event (non-interrupting)
            Constants.ST_BPMN_COMPENSATION_START,	        // Compensation start event
            Constants.ST_BPMN_CONDITIONAL_START_NI,	        // Conditional start event (non-interrupting)
            Constants.ST_BPMN_SIGNAL_START_NI,	            // Signal start event (non-interrupting)
            Constants.ST_BPMN_MULTIPLE_START_NI,            // Multiple start event (non-interrupting)
            Constants.ST_BPMN_PARALLEL_MULTIPLE_START,	    // Parallel multiple start event
            Constants.ST_BPMN_PARALLEL_MULTIPLE_START_NI,   // Parallel multiple start event (non-interrupting)
            Constants.ST_BPMN_START_EVENT,                  // Start event
            Constants.ST_BPMN_MESSAGE_START_EVENT,          // Message start event
            Constants.ST_BPMN_TIMER_START_EVENT,            // Timer start event
            Constants.ST_BPMN_RULE_START_EVENT,             // Conditional start event
            Constants.ST_BPMN_MULTIPLE_START_EVENT,         // Multiple start event
            Constants.ST_BPMN_SIGNAL_START_EVENT]           // Signal start event
}

function getEndEventSymbols(oModel) {
    return [Constants.ST_BPMN_ESCALATION_END,           // Escalation end event
            Constants.ST_BPMN_END_EVENT,                // End event
            Constants.ST_BPMN_MESSAGE_END_EVENT,        // Message end event
            Constants.ST_BPMN_ERROR_END_EVENT,          // Error end event
            Constants.ST_BPMN_CANCEL_END_EVENT,         // Cancel end event
            Constants.ST_BPMN_COMPENSATION_END_EVENT,   // Compensation end event
            Constants.ST_BPMN_MULTIPLE_END_EVENT,       // Multiple end event
            Constants.ST_BPMN_TERMINATE_END_EVENT,      // Terminate end event
            Constants.ST_BPMN_SIGNAL_END_EVENT]         // Signal end event
}

function getTaskSymbols() {
    return [Constants.ST_BPMN_TASK,                     // Task
            Constants.ST_BPMN_MANUAL_TASK,              // Manual task
            Constants.ST_BPMN_USER_TASK,                // User task
            Constants.ST_BPMN_SCRIPT_TASK,              // Script task
            Constants.ST_BPMN_BUSINESS_RULE_TASK,       // Business rule task
            Constants.ST_BPMN_RECEIVE_TASK,             // Receive task
            Constants.ST_BPMN_SEND_TASK,                // Send task
            Constants.ST_BPMN_SERVICE_TASK];            // Service task
}

function getRootElementSymbols() {
    return [Constants.ST_BLOCK_PANEL,           // Panel
            Constants.ST_PROPERTY_GRP,          // Property group
            Constants.ST_PROPERTY_SUBGRP]       // Property sub group
}

function getChildElementMap() {
    var childElementMap = new java.util.HashMap();
    addToMap(c_Panel,            [c_Row, c_PropGroup, c_PropSubgroup, c_RadioBtnGroup, c_CheckBoxBtnGroup, c_Dropdown, c_ComboBox, c_RadioBtn, c_CheckBox, c_DateInput, c_TextInput, c_MultilineInput, c_CommandBtn, c_IconBtn, c_LinkBtn, c_OutputText, c_Icon, c_Header , c_FormattedText , c_Table , c_List, c_ControlLabel]);
    addToMap(c_Row,              [c_Cell]);
    addToMap(c_Cell,             [c_Row, c_Panel, c_PropGroup, c_PropSubgroup, c_RadioBtnGroup, c_CheckBoxBtnGroup, c_Dropdown, c_ComboBox, c_RadioBtn, c_CheckBox, c_DateInput, c_TextInput, c_MultilineInput, c_CommandBtn, c_IconBtn, c_LinkBtn, c_OutputText, c_Icon, c_Header , c_FormattedText, c_Table, c_List, c_ControlLabel]);
    addToMap(c_PropGroup,        [c_PropLine]);
    addToMap(c_PropSubgroup,     [c_PropLine]);
    addToMap(c_PropLine,         [c_Panel, c_RadioBtnGroup, c_CheckBoxBtnGroup, c_Dropdown, c_ComboBox, c_RadioBtn, c_CheckBox, c_DateInput, c_TextInput, c_MultilineInput, c_CommandBtn, c_IconBtn, c_LinkBtn, c_OutputText, c_Icon, c_Header , c_FormattedText, c_Table, c_List, c_ControlLabel]);
    addToMap(c_RadioBtnGroup,    [c_RadioBtn]);
    addToMap(c_CheckBoxBtnGroup, [c_CheckBox]);
    addToMap(c_Dropdown,         [c_SelectItem]);
    addToMap(c_ComboBox,         [c_SelectItem]);
    return childElementMap;
    
    function addToMap(nElementType, aChildElementTypes) {
        childElementMap.put(nElementType, aChildElementTypes);
    }
}

function getMultipleChildElementMap() {
    var multipleChildElementMap = new java.util.HashMap();
    addToMap(c_Panel,            [c_Row]);
    addToMap(c_Row,              [c_Cell]);
    addToMap(c_Cell,             [c_Row]);
    addToMap(c_PropGroup,        [c_PropLine]);
    addToMap(c_PropSubgroup,     [c_PropLine]);
    addToMap(c_PropLine,         [c_Panel, c_RadioBtnGroup, c_CheckBoxBtnGroup, c_Dropdown, c_ComboBox, c_RadioBtn, c_CheckBox, c_DateInput, c_TextInput, c_MultilineInput, c_CommandBtn, c_IconBtn, c_LinkBtn, c_OutputText, c_Icon, c_Header , c_FormattedText, c_Table, c_List, c_ControlLabel]);
    addToMap(c_RadioBtnGroup,    [c_RadioBtn]);
    addToMap(c_CheckBoxBtnGroup, [c_CheckBox]);
    addToMap(c_Dropdown,         [c_SelectItem]);
    addToMap(c_ComboBox,         [c_SelectItem]);
    return multipleChildElementMap;

    function addToMap(nElementType, aChildElementTypes) {
        multipleChildElementMap.put(nElementType, aChildElementTypes);
    }
}

function getChildElementLayoutMap() {
    var childElementLayoutMap = new java.util.HashMap();
    childElementLayoutMap.put(c_Panel,            true/*vertical*/);
    childElementLayoutMap.put(c_Row,              false/*horizontal*/);    
    childElementLayoutMap.put(c_Cell,             true/*vertical*/);
    childElementLayoutMap.put(c_PropGroup,        true/*vertical*/);
    childElementLayoutMap.put(c_PropSubgroup,     true/*vertical*/);
    childElementLayoutMap.put(c_PropLine,         false/*horizontal*/);    
    childElementLayoutMap.put(c_RadioBtnGroup,    false/*horizontal*/);    
    childElementLayoutMap.put(c_CheckBoxBtnGroup, true/*vertical*/);
    childElementLayoutMap.put(c_Dropdown,         true/*vertical*/);
    return childElementLayoutMap;
}

/*************************************************************************************************************************************/

function checkActiveFilter() {
    var bIsFilterOk = checkFilter(ArisData.ActiveFilter());
    if (!bIsFilterOk) {
        gb_c_ERROR_MARK_SET = true;
    }
    return bIsFilterOk;
}

function displayErrors() {
    if (isSilent()){
        if(gb_c_ERROR_MARK_SET){
             Context.setProperty("SILENT_ERROR", "true");     
        } else if(gb_c_INFO_MARK_SET || gb_c_WARNING_MARK_SET){
             Context.setProperty("SILENT_WARNING", "true");  
        }
        return false;
    } 
   
   if (gb_c_ERROR_MARK_SET) 
        return true;
    
    if (gb_c_INFO_MARK_SET || gb_c_WARNING_MARK_SET) {
       if (getBoolPropertyValue("SHOW_RESULTS_WITHOUT_CALLBACK")) return true;
        
        dlgRes = Dialogs.MsgBox(getString("MSG_SHOW_DIAGRAMS"), Constants.MSGBOX_BTN_YESNO | Constants.MSGBOX_ICON_QUESTION, Context.getScriptInfo(Constants.SCRIPT_NAME) );
        if (dlgRes == Constants.MSGBOX_RESULT_YES) return true;
    }
    return false;
}
