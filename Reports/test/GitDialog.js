var nLocale = Context.getSelectedLanguage();
var oOutput = Context.createOutputObject();

var scriptAdminComponent = Context.getComponent("ScriptAdmin");
var aScriptComponentInfo = scriptAdminComponent.getScriptComponents();
var compReport = 1;

var stringArray = ["option1", "option2", "option3", "option4", "option5", "Option6", "Option7"];
var suggestions = [];

var comentt = "";
var branch = "";

var aScriptInfos = scriptAdminComponent.getScriptInfos(compReport, null, nLocale);
var categories = scriptAdminComponent.getCategories(1, nLocale);

var sve = [];

    for(var i = 0; i < categories.length; i++)
        {
            sve.push(categories[i].getName());
        }


var Dlg = null;
Dlg = Dialogs.showDialog(new userDialog(), Constants.DIALOG_TYPE_ACTION, "Export ARIS scripts to GitHub");

var both = "branch is: " + branch + "and comment is: " + commentt;

oOutput.OutputTxt(both);
oOutput.WriteReport();


//var Dlg2 = null;
//Dlg2 = Dialogs.showDialog(new userDialog2(), Constants.DIALOG_TYPE_ACTION, "Export ARIS scripts to GitHub");


function userDialog () {
    
    var pageIndexSelectDocument = 0;
    var searchTxt = "";
    var selected_values = [];
    var same = false;
    
    this.getPages = function(){
        
    var userDlg = Dialogs.createNewDialogTemplate(650, 470, "Select Scripts to push to GitHub");   
    
    userDlg.GroupBox(15, 20, 620, 275, "Select scripts to be pushed");    
    userDlg.Text(35, 35, 200, 15, "Select script");
    userDlg.Text(35, 55, 150, 15, "Search by script name:");
    userDlg.TextBox(170, 55, 115, 13, "Document_txtSearch", 0);
    userDlg.ListBox(35, 75, 250, 180, stringArray, "All_scripts", 0);  //ListBox of all scripts  
    userDlg.PushButton(300, 145, 50, 30, "<SYMBOL_ARROWRIGHT>", "Document" + "_btnAdd");
    userDlg.Text(365, 55, 200, 15, "Selected scripts");
    userDlg.ListBox(365, 75, 250, 180, [], "Selected_scripts");  //ListBox of selected scripts
    userDlg.PushButton(35, 260, 70, 20, "Select all", "Document" + "_btnAddAll");  //Select all items button
    userDlg.PushButton(365, 260, 70, 20, "Delete", "Document" + "_btnDel");  //Delete button
    userDlg.PushButton(455, 260, 75, 20, "Delete all", "Document" + "_btnDelAll");  //Delete all button
    
    userDlg.GroupBox(15, 310, 620, 60, "Branch");
    userDlg.Text(35, 325, 250, 15, "Please insert name of the branch: ");
    userDlg.TextBox(220, 321, 265, 22, "Git_branch", 0);
    userDlg.PushButton(500, 315, 50, 30, "<SYMBOL_ARROWRIGHT>", "Document" + "_btnAddBranch");
    
    userDlg.GroupBox(15, 385, 620, 90, "Comment");
    userDlg.Text(35, 400, 200, 15, "Please enter your commit comment:");
    userDlg.TextBox(35, 420, 450, 35, "Git_comment",1);
    userDlg.PushButton(500, 420, 50, 30, "<SYMBOL_ARROWRIGHT>", "Document" + "_btnAddComm");
    //userDlg.OKButton();
    //userDlg.CancelButton();
    
    
    //*********************************************************************************************************
                //ACTION HANDLERS
    //*********************************************************************************************************
    
    this.init = function()
    {
        //this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Cancel").setEnabled(false);
        //this.dialog.getPage(pageIndexSelectDocument).getDialogElement("OK").setEnabled(false);
    }
    
    //Search all scripts
    this.Document_txtSearch_changed = function() {
        searchTxt = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Document_txtSearch").getText();
        
        suggestions = stringArray.filter(
        function(element)
        {
            return element.toLowerCase().startsWith(searchTxt.toLowerCase());
        }
        );
        
        this.dialog.getPage(pageIndexSelectDocument).getDialogElement("All_scripts").setItems(suggestions);
    };
    
    //Add selected script    
    this.Document_btnAdd_pressed = function() 
    {   
        var selected_index = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("All_scripts").getSelectedIndex();
        if(suggestions[0] == null)
            {
                var selected_value = stringArray[selected_index];
            }
        else
            {
                var selected_value = suggestions[selected_index];
            }
        
        
        if(!(stringArray[selected_index] === undefined)){
            for(var i = 0; i < selected_values.length; i++){
                    if(selected_values[i] == stringArray[selected_index]){
                        same = true;
                        break;
                    }
                    else{
                        same = false;
                    }
            }
            if(!same){
                selected_values.push(selected_value);
                this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Selected_scripts").setItems(selected_values);
            }
        }
    }
    
    //Add all scripts
    this.Document_btnAddAll_pressed = function() 
    {
        var all_items = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("All_scripts").getItems();
        this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Selected_scripts").setItems(all_items);
    }
    
    //Delete all selected scripts
    this.Document_btnDelAll_pressed = function ()
    {
        selected_values = [];
        this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Selected_scripts").setItems(selected_values);
    }
    
    //Delete selected script
    this.Document_btnDel_pressed = function() 
    {
        selected_values = [];
        var selected_index = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Selected_scripts").getSelectedIndex();
        var selected_array = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Selected_scripts").getItems();
        
        selected_array.splice(selected_index, 1);
        selected_values = selected_array;
        
        this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Selected_scripts").setItems(selected_array);
    }
    
    //Save comment
    this.Document_btnAddComm_pressed = function() 
    {
        var _comment = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Git_comment").getText();
    }
    
    var listPagesToShow = [];
    listPagesToShow.push(userDlg);
         
    return listPagesToShow;
    }
    
    this.onClose = function() 
    {
        //var file = null;
        //var path = "";
        //var selected_array = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Selected_scripts").getItems();
        
        //var array_to_delete = arrayDifference(stringArray, selected_array);
        
        /*for(var i = 0; i < selected_array.length(); i++)
            {
                path = array_to_delete[i] + ".txt";
                file = new Packages.java.io.File("C:/arisTest/" + path);
                file.delete();
            }*/
         //path = selected_array[0] + ".txt";
         //file = new Packages.java.io.File("C:/arisTest/" + path);
         //file.delete();
         commentt = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Git_comment").getText();
         branch = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Git_branch").getText();
    }
    
    function arrayDifference(arr1, arr2) {
        return arr1.filter(function(item) 
        {
             return !arr2.includes(item);
        });
}
}

function userDialog2 () {
    
    var pageIndexSelectDocument = 0;
    var searchTxt = "";
    var selected_values = [];
    var same = false;
    
    this.getPages = function(){
        
    var userDlg = Dialogs.createNewDialogTemplate(650, 470, "Select Scripts to push to GitHub");   
    
    userDlg.GroupBox(15, 20, 620, 275, "Select scripts to be pushed");    
    userDlg.Text(35, 35, 200, 15, "Select script");
    userDlg.Text(35, 55, 150, 15, "Search by script name:");
    userDlg.TextBox(170, 55, 115, 13, "Document_txtSearch", 0);
    userDlg.ListBox(35, 75, 250, 180, stringArray, "All_scripts", 0);  //ListBox of all scripts  
    userDlg.PushButton(300, 145, 50, 30, "<SYMBOL_ARROWRIGHT>", "Document" + "_btnAdd");
    userDlg.Text(365, 55, 200, 15, "Selected scripts");
    userDlg.ListBox(365, 75, 250, 180, [], "Selected_scripts");  //ListBox of selected scripts
    userDlg.PushButton(35, 260, 70, 20, "Select all", "Document" + "_btnAddAll");  //Select all items button
    userDlg.PushButton(365, 260, 70, 20, "Delete", "Document" + "_btnDel");  //Delete button
    userDlg.PushButton(455, 260, 75, 20, "Delete all", "Document" + "_btnDelAll");  //Delete all button
    
    userDlg.GroupBox(15, 310, 620, 60, "Folder");
    userDlg.Text(35, 325, 250, 15, "Please select folder where ARIS script is located:");
    userDlg.ComboBox(300, 325, 300, 25, sve, "Risk_STATUS");
    
    userDlg.GroupBox(15, 385, 620, 90, "Comment");
    userDlg.Text(35, 400, 200, 15, "Please enter your commit comment:");
    userDlg.TextBox(35, 420, 400, 35, "Git_comment",1);
    userDlg.PushButton(450, 420, 50, 30, "<SYMBOL_ARROWRIGHT>", "Document" + "_btnAddComm");
    userDlg.OKButton();
    userDlg.CancelButton();
    
    var listPagesToShow = [];
    listPagesToShow.push(userDlg);
         
    return listPagesToShow;
}
}