var stringArray = ["option1", "OpTiOn2", "OPTION3", "option4", "option5", "Option6", "Option7"];

var db = ArisData.getActiveDatabase();
var nLocale = Context.getSelectedLanguage();
var applicationObjects = ArisData.getSelectedObjDefs();
var expenditureTypes = ["Please select", "CAPEX", "OPEX"];

main();

function main() {
    
    
    var Dlg = null;
    Dlg = Dialogs.showDialog(new mainUserDialog(applicationObjects), Constants.DIALOG_TYPE_PROPERTY, "Proximus applications");
}




function mainUserDialog(applicationObjects) {
    
    var pageIndexSelectApplication = 0;
    var pageIndexHistoryLog = 1;
    var searchTxt = "";
    var selected_values = [];
    var suggestions = [];
    var same = false;
    var laApplicationTableValues = [];
    
    for(var i = 0; i < applicationObjects.length; i++) {
        var laRowValues = [];
        laRowValues.push(applicationObjects[i].Name(-1));
        laRowValues.push("Application code");
        
        laApplicationTableValues.push(laRowValues);
    }
    
    
    this.init = function() {
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("app_code").setEnabled(false);
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("app_name").setEnabled(false);
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("name_and_team").setEnabled(false);
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("validation_message").setVisible(false);
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("selected_guid").setVisible(false);
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("tbl_applications").setItems(laApplicationTableValues);
    }
    
    this.getPages = function() {
        
        //SELECTION TAB
        var dlgApplicationSelection = Dialogs.createNewDialogTemplate(850, 550, "Proximus application selection");
        dlgApplicationSelection.GroupBox(15, 20, 815, 185, "Application selection");
        dlgApplicationSelection.Text(35, 40, 140, 15, "Search for application:");
        dlgApplicationSelection.TextBox(165, 40, 320, 15, "Application_txtSearch", 0);
        var laColumnHeaders=new Array();
        var laColumnWidths=[250,90];
        laColumnHeaders.push("Application name");
        laColumnHeaders.push("Application code");
        dlgApplicationSelection.Table(35, 65, 450, 85, laColumnHeaders, null, laColumnWidths, "tbl_applications", Constants.TABLE_STYLE_DEFAULT);
        dlgApplicationSelection.PushButton(35, 160, 50, 30, "<SYMBOL_ARROWDN>", "btn_select_application");
        dlgApplicationSelection.Text(105, 170, 250, 15, "Click after selecting specific application");
        dlgApplicationSelection.GroupBox(15, 220, 815, 385, "Information about selected application");
        dlgApplicationSelection.Text(35, 240, 200, 15, "Application code:");
        dlgApplicationSelection.TextBox(230, 240, 250, 15, "app_code", 0);
        dlgApplicationSelection.Text(35, 265, 200, 15, "Application name:");
        dlgApplicationSelection.TextBox(230, 265, 250, 15, "app_name", 0);
        dlgApplicationSelection.Text(35, 290, 200, 15, "Name and team:");
        dlgApplicationSelection.TextBox(230, 290, 250, 15, "name_and_team", 0);
        dlgApplicationSelection.Text(35, 315, 200, 15, "Expenditure type:");
        dlgApplicationSelection.ComboBox(230, 315, 250, 15, expenditureTypes, "expenditure_type");
        dlgApplicationSelection.Text(35, 340, 200, 15, "Asset number:");
        dlgApplicationSelection.TextBox(230, 340, 250, 15, "asset_number", 0);
        dlgApplicationSelection.Text(35, 365, 200, 15, "Central code WBS:");
        dlgApplicationSelection.TextBox(230, 365, 250, 15, "central_code_wbs", 0);
        dlgApplicationSelection.Text(35, 390, 200, 15, "Expenditure start date:");
        dlgApplicationSelection.DateChooser(230, 390, 250, 15, "expenditure_start_date");
        dlgApplicationSelection.Text(35, 415, 200, 15, "Depreciation period in months:");
        dlgApplicationSelection.TextBox(230, 415, 250, 15, "depreciation_period_months", 0);
        dlgApplicationSelection.Text(35, 440, 200, 15, "Expenditure change date:");
        dlgApplicationSelection.DateChooser(230, 440, 250, 15, "expenditure_change_date");
        dlgApplicationSelection.Text(35, 465, 200, 15, "Expenditure end date:");
        dlgApplicationSelection.DateChooser(230, 465, 250, 15, "expenditure_end_date");
        dlgApplicationSelection.Text(35, 490, 200, 15, "Timesheets enabled:");
        dlgApplicationSelection.CheckBox(230, 490, 100, 15, "", "timesheet_enabled");
        dlgApplicationSelection.Text(35, 515, 200, 15, "Notes:");
        dlgApplicationSelection.TextBox(230, 515, 250, 50, "notes", 1);
        dlgApplicationSelection.PushButton(325, 570, 63, 23, "Save", "btn_save");
        dlgApplicationSelection.Text(35, 580, 200, 15, "*Please fill in all of the fields! ", "validation_message");
        dlgApplicationSelection.TextBox(550, 580, 25, 15, "selected_guid", 0);
        
        //HISTORY LOG TAB
        var dlgHistoryLog = Dialogs.createNewDialogTemplate(850, 500, "History log");
        dlgHistoryLog.GroupBox(15, 20, 815, 185, "History log");
        dlgHistoryLog.Text(35, 40, 200, 15, "LOG", "history_log");
        
        
         var listPagesToShow = [];
         listPagesToShow.push(dlgApplicationSelection);
         listPagesToShow.push(dlgHistoryLog);
         
         return listPagesToShow;
    }
    
    this.Application_txtSearch_changed = function() {
        this.executeSearch(this.dialog.getPage(pageIndexSelectApplication).getDialogElement("Application_txtSearch"), laApplicationTableValues, this.dialog.getPage(pageIndexSelectApplication).getDialogElement("tbl_applications"), 0);
    };
    
    this.btn_select_application_pressed = function() {
        
        var selected_index = this.dialog.getPage(pageIndexSelectApplication).getDialogElement("tbl_applications").getSelectedCellIndex();
        
        var chosenObj = db.Find(Constants.SEARCH_OBJDEF, Constants.OT_RISK, Constants.AT_AAM_RISK_ID, nLocale, "OR 6", Constants.SEARCH_CMP_EQUAL); //Application Code
        
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("app_code").setText(chosenObj[0].Attribute(Constants.AT_AAM_RISK_ID, -1).getValue());
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("app_name").setText(chosenObj[0].Attribute(Constants.AT_NAME, -1).getValue());
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("name_and_team").setText(chosenObj[0].Attribute(Constants.AT_CREATOR, -1).getValue());
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("expenditure_type").setItems(expenditureTypes);
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("asset_number").setText("");
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("central_code_wbs").setText("");
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("expenditure_start_date").setDate("");
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("depreciation_period_months").setText("");
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("expenditure_change_date").setDate("");
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("expenditure_end_date").setDate("");
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("timesheet_enabled").setChecked(false);
        this.dialog.getPage(pageIndexSelectApplication).getDialogElement("notes").setText("");
        
        this.dialog.getPage(pageIndexHistoryLog).getDialogElement("history_log").setText("History log will be here hehe");
        
    }
    
    this.btn_save_pressed = function() {
        if(this.dialog.getPage(pageIndexSelectApplication).getDialogElement("app_code").getText() != "" &&
           this.dialog.getPage(pageIndexSelectApplication).getDialogElement("app_name").getText() != "" &&
           this.dialog.getPage(pageIndexSelectApplication).getDialogElement("name_and_team").getText() != "" &&
           this.dialog.getPage(pageIndexSelectApplication).getDialogElement("expenditure_type").getSelection() != 0 && 
           this.dialog.getPage(pageIndexSelectApplication).getDialogElement("asset_number").getText() != "" &&
           this.dialog.getPage(pageIndexSelectApplication).getDialogElement("central_code_wbs").getText() != "" &&
           this.dialog.getPage(pageIndexSelectApplication).getDialogElement("expenditure_start_date").getDate() != "" &&
           this.dialog.getPage(pageIndexSelectApplication).getDialogElement("depreciation_period_months").getText() != "" &&
           this.dialog.getPage(pageIndexSelectApplication).getDialogElement("expenditure_change_date").getDate() != "" &&
           this.dialog.getPage(pageIndexSelectApplication).getDialogElement("expenditure_end_date").getDate() != "" &&
           !this.dialog.getPage(pageIndexSelectApplication).getDialogElement("timesheet_enabled").isUndefined() &&
           this.dialog.getPage(pageIndexSelectApplication).getDialogElement("notes").getText() != "") {
               
               this.dialog.getPage(pageIndexSelectApplication).getDialogElement("validation_message").setVisible(false);

           }
           else {
               this.dialog.getPage(pageIndexSelectApplication).getDialogElement("validation_message").setVisible(true);
           }
    }

    this.executeSearch = function(oSearchBox, listUnfilteredValues, oTableDlgElement, intColumnIndexToSearch) {
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
}