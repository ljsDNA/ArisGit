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
        Dialogs.MsgBox(getString("NO_PROCESS_TO_SHOW"), Constants.MSGBOX_ICON_INFORMATION, getString("PROCESS_SELECT"));
        return;            
    }
    
    Context.setSelectedFile(formatstring1(getString("CONFIRMATION_PROCESSES_FILENAME"), arisItemName));         
    g_ooutfile = Context.createOutputObject();
    initStyles(g_ooutfile, getString("FONT"));
    initCustomStyles(g_ooutfile, getString("FONT"));
    
    outTitlePage(g_ooutfile, getString("FONT"), formatstring1(getString("CONFIRMATION_PROCESSES_TITLE"), arisItemName), "", getTitlePageDetails(), getString("TITLE_PAGE"));
    outHeaderFooter(g_ooutfile, getString("FONT"), getString("FOOTER_RIGHT"));
    setTableBorders(g_ooutfile);  
       
    printListOfConfirmationProcesses(confirmationProcesses); 

    outLastPage(g_ooutfile);                  
    g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
}

/*
    Print table with all confirmation processes
*/
function printListOfConfirmationProcesses(processes){
    var attributeIds = ["name", "plannedstartdate", "plannedenddate", "owner_status", "documents", "addressee_users", "open_confirmations", "closed_confirmations", "overdue_confirmations"];
    var colsWidth = [22, 10, 10, 12, 9, 9, 9, 9, 10];
    
    //start landscape section
    g_ooutfile.BeginSection(g_ooutfile.GetPageWidth(), g_ooutfile.GetPageHeight(), 
                                    g_ooutfile.GetDistHeader(), g_ooutfile.GetDistFooter(), 
                                    g_ooutfile.GetLeftMargin(), g_ooutfile.GetRightMargin(), 
                                    g_ooutfile.GetTopMargin(), g_ooutfile.GetBottomMargin(), 
                                    false, Constants.SECTION_DEFAULT);
    outHeaderFooter(g_ooutfile, getString("FONT"), getString("FOOTER_RIGHT"));
    g_ooutfile.OutputLnF(getString("LIST_OF_PROCESSES"), "HEADING1_NOTOC");           
    g_ooutfile.BeginTable(100, COL_TBL_BORDER, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    
    var headerNames = getHeaderNames(processes.get(0), attributeIds);
    outTableHead(headerNames, colsWidth);
    
    for(var i = 0; i < processes.size(); i++){
        var process = processes.get(i);
        var rowValues = [];
        for(var j = 0; j < attributeIds.length; j++){       
            rowValues.push(getAttrValue(process, attributeIds[j]));     
        }
        outTableRow(rowValues, colsWidth);
    }
    g_ooutfile.EndTable("", 100, getString("FONT"), FONT_SIZE, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);  
    g_ooutfile.EndSection();
}

/*
    Print header row
*/
function outTableHead(headings, colsWidth) {
    g_ooutfile.TableRow();   
    for(var i = 0; i < headings.length; i++) {
        if(i == 0 || i == 3){
            g_ooutfile.TableCellF(headings[i], colsWidth[i], "TBL_HEADER_LEFT");
        } else {
            g_ooutfile.TableCellF(headings[i], colsWidth[i], "TBL_HEADER_CENTER");               
        }
    }
}

/*
    Print one table row
*/
function outTableRow(rowValues, colsWidth) {    
    g_ooutfile.TableRow();         
    for(var i = 0; i < rowValues.length; i++) {
        if (rowValues[i].icon) {                                       
            var image = rowValues[i].icon.getImage();
            g_ooutfile.TableCellF("", 3, "TBL_ICON");
            g_ooutfile.OutGraphic(Context.createPicture(image, Constants.IMAGE_FORMAT_PNG), -1, 1, 1);
            g_ooutfile.TableCellF(rowValues[i].uiValue, colsWidth[i] - 3, "TBL_ROW_LEFT");                  
        } else {
            g_ooutfile.TableCellF(rowValues[i].uiValue, colsWidth[i], "TBL_ROW_CENTER");
        }            
    }
}

/*
    Handling for special values which needs to be calculated 
*/
function getAttrValue(process, attributeType){
    if(attributeType.equals("name")){
        var attr = getAttribute(process, attributeType);
        attr.valueRows[0].valueCols[0].icon = process.getIcon();
        return attr.valueRows[0].valueCols[0];
    } 
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
            return getString("HEADER_CLOSED_CONFIRMATIONS"); 
        case "overdue_confirmations":
            return getString("HEADER_OVERDUE_CONFIRMATIONS");
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
	if(!isConfirmationAuditor() && !isConfirmationManager()){
        query.addRestriction(restrictionFactory.leftJoin("creator", restrictionFactory.eq("userid", ArisData.getActiveUser().Name(locale) + "")));
    }	
    query.addOrder(restrictionFactory.createAscendingOrder("name"));
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
    g_ooutfile.DefineF("TBL_HEADER_CENTER", font, FONT_SIZE_TBL_S, COL_TBL_HEAD_TXT, Constants.C_TRANSPARENT, Constants.FMT_CENTER | Constants.FMT_VBOTTOM, 0, 0, 0, 1, 0, 1.1);
    g_ooutfile.DefineF("TBL_ROW_CENTER", font, FONT_SIZE_TBL_S, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER | Constants.FMT_VTOP, 0, 0, 2, 2, 0, 1.1); 
    g_ooutfile.DefineF("TBL_ROW_LEFT", font, FONT_SIZE_TBL_S, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 2, 2, 0, 1.1); 
    g_ooutfile.DefineF("TBL_HEADER_LEFT", font, FONT_SIZE_TBL_S, COL_TBL_HEAD_TXT, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VBOTTOM, 0, 0, 0, 1, 0, 1.1);    
    g_ooutfile.DefineF("TBL_ICON", font, FONT_SIZE_TBL_S, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_RIGHT | Constants.FMT_VTOP, 0, 0, 2, 2, 0, 1.1);     
    g_ooutfile.DefineF("END_DETAILS", getString("FONT"), FONT_SIZE_TBL_HEAD, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 0, 1, 0, 1.1);
}

/*
    Print last page with technical details
*/
function outLastPage(g_ooutfile){   
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