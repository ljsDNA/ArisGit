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


var ARCM = Context.getComponent("ARCM");
var locale = Context.getSelectedLanguage();
 
main();
 
function main() {
    if(!isConfirmationAdmin() && !isConfirmationAuditor() && !isConfirmationManager()) {
        Dialogs.MsgBox(formatstring3(getString("FUNCTION_PRIVILEGES_MISSING"), getPrivilegesDisplayName("CFM_ADMIN"), getPrivilegesDisplayName("CFM_MANAGER"), getPrivilegesDisplayName("CFM_AUDITOR")), Constants.MSGBOX_ICON_ERROR, "Error");
        return;            
    }
    
     if(!hasOperateLicense()) {
        Dialogs.MsgBox(formatstring1(getString("OPERATE_PRIVILEGES_MISSING"),getPrivilegesDisplayName("LICENSE_YRCOP")), Constants.MSGBOX_ICON_ERROR, "Error");
        return;            
    }
    
    var arisItems = getSelection();
    var arisItem = arisItems[0];
    var arisItemName = arisItem.Name(locale);
    var arisItemGUID = arisItem.GUID();
    var confirmationProcesses = getConfirmationProcessesByGUID(arisItemGUID);
    if(confirmationProcesses.isEmpty()) {
        Dialogs.MsgBox(getString("NO_PROCESS_TO_SELECT"), Constants.MSGBOX_ICON_INFORMATION, getString("PROCESS_SELECT"));
        return;            
    }
    
    var selectedConfirmationProcess = Dialogs.showDialog(new selectProcessDialog(confirmationProcesses), Constants.DIALOG_TYPE_ACTION, getString("PROCESS_SELECT"));    
    if(selectedConfirmationProcess == null) {
        Dialogs.MsgBox(getString("ABORT_SELECTION"), Constants.MSGBOX_ICON_INFORMATION, getString("PROCESS_SELECT"));
        return;
    }
    
    Context.setSelectedFile(formatstring1(getString("CONFIRMATION_PROCESS_FILENAME"), arisItemName));    
    g_ooutfile = Context.createOutputObject();
    initStyles(g_ooutfile, getString("FONT"));
    initCustomStyles(g_ooutfile, getString("FONT"));  

    outTitlePage(g_ooutfile, getString("FONT"), formatstring1(getString("CONFIRMATION_PROCESS_TITLE"), arisItemName), "", getTitlePageDetails(), getString("TITLE_PAGE"));   
    outHeaderFooter(g_ooutfile, getString("FONT"), getString("FOOTER_RIGHT"));
    setTableBorders(g_ooutfile);
       
    printConfirmationProcessDetails(selectedConfirmationProcess);   
    printConfirmationsStatus(selectedConfirmationProcess);
    printListOfDocuments(selectedConfirmationProcess);      
    printListOfConfirmations(selectedConfirmationProcess);
    printListOfRemovedConfirmations(selectedConfirmationProcess);
            
    outLastPage(g_ooutfile);
    g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
}

/*
    Print details with the attribute values of selected confirmation process
*/
function printConfirmationProcessDetails(process, attributeIds){
    var attributeIds = ["name", "plannedstartdate", "plannedenddate", "owner_status", "confirmation_text", "documents", "addressee_users"];   
    g_ooutfile.OutputLnF(getString("DETAILS"), "HEADING1_NOTOC");    
    g_ooutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    for (var i = 0; i < attributeIds.length; i++) {
        var attribute = getAttrValue(process, attributeIds[i]);
        var attributeUiName = getHeaderName(process, attributeIds[i]);                   
        printDetailsRow(attributeUiName, attribute.uiValue, attribute.icon);   
    }
    g_ooutfile.EndTable("", 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}

/*
    Print one row of details section
*/
function printDetailsRow(attrName, attrValue, icon){
    g_ooutfile.TableRow();
    g_ooutfile.TableCellF(attrName, 40, "TBL_STD");
    // if row value contains hyperlink, print as styled HTML
    if(containsHyperLink(attrValue)){
        g_ooutfile.TableCellF("", 60, "TBL_STD");
        g_ooutfile.OutputFormattedText(createStyledHTMLValue(attrValue), false);     
    // if row value contains icon, print as 2 columns (icon + text value)
    } else if(icon){
        var image = icon.getImage();
        g_ooutfile.TableCellF("", 5, "TBL_STD");
        g_ooutfile.OutGraphic(Context.createPicture(image, Constants.IMAGE_FORMAT_PNG), 0, 0.5, 0.5);                                       
        g_ooutfile.TableCellF(attrValue, 55, "TBL_STD");         
    // print simple text value    
    } else {
        g_ooutfile.TableCellF(attrValue, 60, "TBL_STD");
    }
}

/*
    Return true if value contains hyperlink, otherwise false 
*/
function containsHyperLink(value){
    return (value instanceof  String && value.contains('a target="_blank" href'));
}

/*
    Return styled HTML text value
*/
function createStyledHTMLValue(value){
    return "<html><body style='font-family:" + getString("FONT") + "; font-size:" + FONT_SIZE + "pt;'>" + value + "</body></html>";
}

/*
    Print table with statistic of confirmations states
*/
function printConfirmationsStatus(process){ 
    g_ooutfile.OutputLnF("", "HEADING1_NOTOC");
    g_ooutfile.OutputLnF(getString("CONFIRMATIONS_STATUS"), "HEADING1_NOTOC");
    
    var attributeIds = ["open_confirmations", "closed_confirmations", "overdue_confirmations"];
    var colsWidth = [33, 33, 34];
    var headerNames = getHeaderNames(process, attributeIds);
         
    g_ooutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    outTableHead(headerNames, colsWidth, "CENTER");
          
    var rowValues = [];
    for(var j = 0; j < attributeIds.length; j++){           
        rowValues.push(getAttrValue(process, attributeIds[j]));            
    }
    outTableRow(rowValues, colsWidth, "CENTER");
    g_ooutfile.EndTable("", 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);     
}

/*
    Print table with the attribute values of all included documents
*/
function printListOfDocuments(process){
    var attr = process.getListAttribute("documents");
    var documents = attr.getConnectedObjects();
    // not printed in case if no document is included
    if(documents.size() == 0){
        return;
    }
    g_ooutfile.BeginSection(false, Constants.SECTION_COVER);
    g_ooutfile.OutputLnF(getString("LIST_OF_DOCUMENTS"), "HEADING1_NOTOC");
    
    var attributeIds = ["name", "title", "document_description", "create_date"];
    var colsWidth = [25, 25, 35, 15];
    var headerNames = getHeaderNames(documents.get(0), attributeIds);
         
    g_ooutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    outTableHead(headerNames, colsWidth, "LEFT");
    
    for(var i = 0; i < documents.size(); i++){      
        var document = documents.get(i);
        var rowValues = [];
        for(var j = 0; j < attributeIds.length; j++){                  
            rowValues.push(getAttrValue(document, attributeIds[j]));            
        }
        outTableRow(rowValues, colsWidth, "LEFT");
    }
    g_ooutfile.EndTable("", 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);  
    g_ooutfile.EndSection();
}

/*
    Print table with all confirmations related to selected confirmation process
*/
function printListOfConfirmations(process){
    g_ooutfile.BeginSection(false, Constants.SECTION_COVER);
    g_ooutfile.OutputLnF(getString("LIST_OF_CONFIRMATIONS"), "HEADING1_NOTOC");
    var processID = process.getId();     
    var confirmations = getConfirmationsByProcessOVID(processID);
    var attributeIds = ["owner", "execution_date", "owner_status"];
    var colsWidth = [34, 33, 33];
    var headerNames = getHeaderNames(confirmations.get(0), attributeIds);
         
    g_ooutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    outTableHead(headerNames, colsWidth, "LEFT");
    
    for(var i = 0; i < confirmations.size(); i++){
        var confirmation = confirmations.get(i);
        var rowValues = [];
        for(var j = 0; j < attributeIds.length; j++){          
            rowValues.push(getAttrValue(confirmation, attributeIds[j]));                      
        }
        outTableRow(rowValues, colsWidth, "LEFT");
    }
    g_ooutfile.EndTable("", 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);  
    g_ooutfile.EndSection();
}

/*
    Print table with removed confirmations related to selected confirmation process
*/
function printListOfRemovedConfirmations(process){  
    var processID = process.getId();     
    var removedConfirmations = getRemovedConfirmationsByProcessOVID(processID);
     // not printed in case if no document is included
    if(removedConfirmations.size() == 0){
        return;
    }
    g_ooutfile.BeginSection(false, Constants.SECTION_COVER);
    g_ooutfile.OutputLnF(getString("LIST_OF_REMOVED_CONFIRMATIONS"), "HEADING1_NOTOC");
    var attributeIds = ["owner", "change_date", "owner_status"];
    var colsWidth = [34, 33, 33];
    var headerNames = getHeaderNames(removedConfirmations.get(0), attributeIds);
         
    g_ooutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    outTableHead(headerNames, colsWidth, "LEFT");
    
    for(var i = 0; i < removedConfirmations.size(); i++){
        var confirmation = removedConfirmations.get(i);
        var rowValues = [];
        for(var j = 0; j < attributeIds.length; j++){          
            rowValues.push(getAttrValue(confirmation, attributeIds[j]));                      
        }
        outTableRow(rowValues, colsWidth, "LEFT");
    }
    g_ooutfile.EndTable("", 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);  
    g_ooutfile.EndSection();
}

/*
    Print header row
*/
function outTableHead(headings, colsWidth, allignment) {
    g_ooutfile.TableRow();   
    for(var i = 0; i < headings.length; i++) {       
        g_ooutfile.TableCellF(headings[i], colsWidth[i], "TBL_HEADER_" + allignment );        
    }
}

/*
    Print one table row
*/
function outTableRow(rowValues, colsWidth, allignment) {
    g_ooutfile.TableRow();  
    for(var i = 0; i < rowValues.length; i++) {      
        if (rowValues[i].icon) {                           
            var image = rowValues[i].icon.getImage();
            g_ooutfile.TableCellF("", colsWidth[i] * 0.15, "TBL_ROW_" + allignment);
            g_ooutfile.OutGraphic(Context.createPicture(image, Constants.IMAGE_FORMAT_PNG), 0, 0.5, 0.5);                                       
            g_ooutfile.TableCellF(rowValues[i].uiValue, colsWidth[i] * 0.85, "TBL_ROW_" + allignment);                  
        } else {
            g_ooutfile.TableCellF(rowValues[i].uiValue, colsWidth[i], "TBL_ROW_" + allignment);
        }          
    }
}

/*
    Handling for special attribute values which needs to be calculated
*/
function getAttrValue(process, attributeType){
    if(attributeType.equals("documents")){
         var attr = process.getListAttribute(attributeType);
         var numberOfDocuments = {};
         numberOfDocuments.uiValue = attr.getConnectedObjects().size();
         return numberOfDocuments;
    }
    if(attributeType.equals("addressee_users")){
        var numberOfAddresses = {};
        numberOfAddresses.uiValue = calculateNumberOfAddresses(process);  
        return numberOfAddresses;
    }
    if(attributeType.equals("create_date")){
        var attr = process.getValueAttribute(attributeType);
        var createDate = {};
        createDate.uiValue = formatDate(attr.uiValue);  
        return createDate;
    }  
    return getAttribute(process, attributeType).valueRows[0].valueCols[0];
}

/*
    Return all table header names
*/
function getHeaderNames(object, attributeIds){
        var headerNames = [];
        for(var i = 0; i< attributeIds.length; i++){
             headerNames.push(getHeaderName(object, attributeIds[i]));
        }
        return headerNames;
}

/*
    Return special attribute name from String table , or name of attribute type as default
*/
function getHeaderName(object, attributeType) {
    switch(attributeType) {  
        case "plannedstartdate":
            return getString("HEADER_START_DATE");
        case "plannedenddate":
            return getString("HEADER_END_DATE");                    
        case "documents":
            return getString("HEADER_DOCUMENTS");
        case "addressee_users":
            return getString("HEADER_ADDRESSEES");
        case "open_confirmations":
            return getString("HEADER_OPEN_CONFIRMATIONS");
        case "closed_confirmations":
            return getString("HEADER_ACCEPTED_CONFIRMATIONS"); 
        case "overdue_confirmations":
            return getString("HEADER_OVERDUE_CONFIRMATIONS");
        case "owner":
            return getString("HEADER_ADDRESSEE");
        case "change_date":
            return getString("HEADER_REMOVAL_DATE");                
    }     
    return getAttributeTypeName(object, attributeType);            
}

/*
    Return number of addresses as attidtion of confirmations in all states
*/
function calculateNumberOfAddresses(process){
    var open = parseInt(process.getValueAttribute("open_confirmations").getRawValue());
    var accepted = parseInt(process.getValueAttribute("closed_confirmations").getRawValue());
    var notCompleted = parseInt(process.getValueAttribute("overdue_confirmations").getRawValue());
    return open + accepted + notCompleted;
}

/*
    Return list of confirmation processes related to item with specific GUID
*/
function getConfirmationProcessesByGUID(arisItemGUID){
    var restrictionFactory = ARCM.getQueryRestrictionFactory();
    var query = ARCM.createQuery(Constants.CONFIRMATIONPROCESS, locale);
    query.addRestriction(restrictionFactory.leftJoin("confirmationscheduler", restrictionFactory.eq("aris_db_name", ArisData.getActiveDatabase().Name(locale) + "")));
    query.addRestriction(restrictionFactory.eq("connect_item_guid", arisItemGUID));    
    query.addRestriction(restrictionFactory.ne("owner_status", "retired"));
	if(!isConfirmationAuditor() && !isConfirmationManager()){
        query.addRestriction(restrictionFactory.leftJoin("creator", restrictionFactory.eq("userid", ArisData.getActiveUser().Name(locale) + "")));
    }	
    query.addOrder(restrictionFactory.createAscendingOrder("name"));
    return query.getResult();
}

/*
    Return list of confirmations related to confirmation process with specific ID
*/
function getConfirmationsByProcessOVID(processID){
    var restrictionFactory = ARCM.getQueryRestrictionFactory();
    var query = ARCM.createQuery(Constants.CONFIRMATION, locale);
    query.addRestriction(restrictionFactory.leftJoin("confirmationprocess", restrictionFactory.eq("obj_id", processID + "")));
    query.addRestriction(restrictionFactory.ne("owner_status", "removed"));
    query.addOrder(restrictionFactory.createAscendingOrder("owner"));
    return query.getResult();
}

/*
    Return list of removed confirmations related to confirmation process with specific ID
*/
function getRemovedConfirmationsByProcessOVID(processID){
    var restrictionFactory = ARCM.getQueryRestrictionFactory();
    var query = ARCM.createQuery(Constants.CONFIRMATION, locale);
    query.addRestriction(restrictionFactory.leftJoin("confirmationprocess", restrictionFactory.eq("obj_id", processID + "")));
    query.addRestriction(restrictionFactory.eq("owner_status", "removed"));
    query.addOrder(restrictionFactory.createAscendingOrder("owner"));
    return query.getResult();
}

/*
    Return the selected ARIS item of the report 
*/
function getSelection() {
    var  selection = ArisData.getSelectedObjDefs();   
    if (selection.length == 0) {
        selection = ArisData.getSelectedModels();
    } 
    return selection;
}

/*
    Get details which should be printed on first page
*/
function getTitlePageDetails(){
    var titleDetails = [];
    titleDetails.push(["", ArisData.getActiveUser().Name(locale)]);   
    return titleDetails;
}

/*
    Init custom styles which are not part of commonStyles.js
*/
function initCustomStyles(g_ooutfile, font){
    g_ooutfile.DefineF("TBL_HEADER_LEFT", font, FONT_SIZE_TBL_S, COL_TBL_HEAD_TXT, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0, 0, 0, 1, 0, 1.1); // Table head left align
    g_ooutfile.DefineF("TBL_ROW_LEFT", font, FONT_SIZE_TBL_S, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 2, 2, 0, 1.1); //Table row left align
    g_ooutfile.DefineF("TBL_HEADER_CENTER", font, FONT_SIZE_TBL_S, COL_TBL_HEAD_TXT, Constants.C_TRANSPARENT, Constants.FMT_CENTER | Constants.FMT_VBOTTOM, 0, 0, 0, 1, 0, 1.1); // Table head center align
    g_ooutfile.DefineF("TBL_ROW_CENTER", font, FONT_SIZE_TBL_S, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER | Constants.FMT_VTOP, 0, 0, 2, 2, 0, 1.1); //Table row center align
}

/*
    Dialog where one confirmation process is selected   
*/
function selectProcessDialog(confirmationProcesses) {       
    var isOk = false;
    var hasEmptyList = true; 
    
     // transform the all client data
    var processNames =  new Array();    
    if (confirmationProcesses.size() == 1){
        var process = confirmationProcesses.get(0);
        var processName = process.getValueAttribute("name").getUiValue();
        var processStartDate = process.getValueAttribute("plannedstartdate").getUiValue();
        var processEndDate = process.getValueAttribute("plannedenddate").getUiValue();
        processNames.push(processName + " (" + processStartDate + " - " + processEndDate + ")");
        hasEmptyList = false;
    } else {
        processNames.push(getString("PLEASE_SELECT"));
        for (var i = 0; i < confirmationProcesses.size(); i++) {
            var item = confirmationProcesses.get(i);
            var itemName = item.getValueAttribute("name").getUiValue();
            var itemStartDate = item.getValueAttribute("plannedstartdate").getUiValue();
            var itemEndDate = item.getValueAttribute("plannedenddate").getUiValue();
            processNames.push(itemName + " (" + itemStartDate + " - " + itemEndDate + ")");
            hasEmptyList = false;
        }
    }    
  
    // structure of the dialog page
    this.getPages = function() {
        
        var posX = 10;
        var doubleLineLableOffset = 12;
        var textHeight = 16;
		var comboTextHeight = 20;
        var dlgWidth = 460;
        var dlgHeight = 100 + doubleLineLableOffset;
        var lineWidth = dlgWidth - 10;
        var textBoxWidth = dlgWidth - 16;      
        
        var iDialogTemplate = Dialogs.createNewDialogTemplate(dlgWidth, dlgHeight, "First page");
                                           
        iDialogTemplate.Text(posX, 15, lineWidth, textHeight + doubleLineLableOffset, getString("PROCESS_SELECT_TEXT"));
        iDialogTemplate.ComboBox(posX, 45, textBoxWidth, comboTextHeight, processNames, "PROCESS_CB");                      
        
        return [iDialogTemplate];
    }

    // init of dialog
    this.init = function(aPages) {  
         
        var processComboBox = this.getDialogElement("PROCESS_CB");
        var comboBoxValues = processComboBox.getItems();
        if(comboBoxValues.length < 2){
            processComboBox.setEnabled(false);
        }                                                  
    }

    // dilaog will close
    this.onClose = function(pageNumber, bOk) {
        isOk = bOk;
    }

    // check if content of page is valid
    this.isInValidState = function(pageNumber) {       
        return isValidSelection(this.getDialogElement("PROCESS_CB"));       
    }
    
    function isValidSelection(comboBox){
        if(hasEmptyList){
            return false;
        }
        if(comboBox.getItems().length == 1){
            return true;
        }
        var index = comboBox.getSelection();
        if(index == 0) {
            return false;
        }
        return true;        
    }
    
    // result of the dialog
    this.getResult = function() {
        if(!isOk) {
            return null;
        }                                          
        var index = this.getDialogElement("PROCESS_CB").getSelection();  
        if(confirmationProcesses.size() == 1) {
            return confirmationProcesses.get(0);
        }
        // First entry in the combox is "Please select" but the clients entry doesn't have this entry. So index is one to high.
        return confirmationProcesses.get(index - 1);
    }             

    // get dialog element by id
    this.getDialogElement = function(id) {
        return this.dialog.getPage(0).getDialogElement(id);
    }
}

/*
    Return true if current value is of type date, false if otherwise
*/
function isDate(date) {
   return (new Date(date) !== "Invalid Date" && !isNaN(new Date(date)) ) ? true : false;
}

/*
    Return formatted date
*/
function formatDate(value){
    if(!isDate(value)){
        return "";
    }
    return new Date(value).toLocaleDateString(); 
}

/*
    Print last page with technical details
*/
function outLastPage(g_ooutfile){
    g_ooutfile.DefineF("END_DETAILS", getString("FONT"), FONT_SIZE_TBL_HEAD, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 0, 1, 0, 1.1);
    g_ooutfile.OutputLnF("" , "TITLE_DETAILS");
    g_ooutfile.OutputLnF(getString("SERVER") + ArisData.getActiveDatabase().ServerName() , "END_DETAILS");
    g_ooutfile.OutputLnF(getString("DATABASE") +  ArisData.getActiveDatabase().Name(locale), "END_DETAILS");
}

/*
    This method is overwritten because fontsize is constanst and cannot be modified externally
*/
function outTitlePage(p_oOut, p_sFont, p_sTitle, p_sDate, p_aDetails, p_sLabelTitlePage) {
     p_oOut.BeginSection(false, Constants.SECTION_COVER);
    var nHeightUpperPart = Math.round(p_oOut.getPageHeight()/1.618);
    var nHeightLowerPart = p_oOut.getPageHeight() - nHeightUpperPart;

    p_oOut.BeginTable(100, [new java.lang.Double(100), new java.lang.Double(0)], Constants.C_TRANSPARENT, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    // Logo
    p_oOut.TableRow();
    p_oOut.DefineF("TITLE_LOGO", p_sFont, FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1.1);
    p_oOut.TableCellF("", 1, 1, "TITLE_LOGO");
    p_oOut.OutGraphic(Context.createPicture(Constants.IMAGE_LOGO_LEFT), -1, 70, 70);
    p_oOut.TableCell("", 1, 1, p_sFont, FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    var oRule = Context.createPicture();
    var nRuleHeight = Math.round((nHeightUpperPart - p_oOut.getTopMargin())/2) - 2; // Without the small reduction the cells get too tall
    oRule.FillRect(0, 0, 0, nRuleHeight, Constants.C_TRANSPARENT);
    p_oOut.OutGraphic(oRule, -1, 0, nRuleHeight);
    // Title
    p_oOut.TableRow();
    p_oOut.DefineF("TITLE", p_sFont, FONT_SIZE * 2.4, COL_HEADING, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD | Constants.FMT_VBOTTOM, 0, 0, 0, 5, 0, 1.1);
    p_oOut.TableCellF(p_sTitle, 1, 1, "TITLE");
    p_oOut.TableCell("", 1, 1, p_sFont, FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0);
    p_oOut.OutGraphic(oRule, -1, 0, (nHeightUpperPart - p_oOut.getTopMargin())/2);
    // Details
    p_oOut.TableRow();
    var nColorTitleDetails = Constants.C_WHITE;     
    p_oOut.DefineF("TITLE_DETAILS_FIRST_LINE", p_sFont, FONT_SIZE, nColorTitleDetails, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 5, 1, 0, 1.1);
    p_oOut.DefineF("TITLE_DETAILS", p_sFont, FONT_SIZE, nColorTitleDetails, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 0, 1, 0, 1.1);
    
    p_oOut.TableCellF("", 1, 1, "TITLE_DETAILS_FIRST_LINE");
    if (p_sDate != null) {
        p_oOut.OutputF(p_sDate + " ", "TITLE_DETAILS_FIRST_LINE");
        p_oOut.OutputField(Constants.FIELD_DATE, p_sFont, FONT_SIZE, nColorTitleDetails, Constants.C_TRANSPARENT, Constants.FMT_LEFT);
        p_oOut.Output(" " , p_sFont, FONT_SIZE, nColorTitleDetails, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        p_oOut.OutputField(Constants.FIELD_TIME, p_sFont, FONT_SIZE, nColorTitleDetails, Constants.C_TRANSPARENT, Constants.FMT_LEFT);
        p_oOut.OutputLnF("", "TITLE_DETAILS_FIRST_LINE");
    }
    if (p_aDetails != null) {
        for (var i=0; i<p_aDetails.length; i++) {
            p_oOut.OutputLnF(p_aDetails[i][0] + " " + p_aDetails[i][1], "TITLE_DETAILS");
        }
    }
   
    p_oOut.TableCell("", 1, 1, p_sFont, FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
    p_oOut.EndTable((p_sLabelTitlePage != null && isSpreadsheet()) ? p_sLabelTitlePage : "", 100, p_sFont, FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER, 0);

    var oBackground = Context.createPicture();
    var nSizeMultiplier = 1000;
    // Making the rectangle very large minimizes the empty areas generated by OutGraphicAbsolute to the right and at the bottom
    oBackground.FillRect(0, 0, p_oOut.getPageWidth()*nSizeMultiplier, nHeightLowerPart*nSizeMultiplier, COL_HEADING);
    // Add a little bit of height and width to push the empty areas out of the page
    p_oOut.OutGraphicAbsolute(oBackground, 0, nHeightUpperPart, p_oOut.getPageWidth() + 5, nHeightLowerPart + 5, true);
    p_oOut.EndSection();
}