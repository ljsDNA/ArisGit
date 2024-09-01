var nLocale   = Context.getSelectedLanguage();
var scriptAdminComponent = Context.getComponent("ScriptAdmin");
var exportLocation = "C:/ARISScriptExports";
var df = new java.text.SimpleDateFormat("yyyy_MM_dd_hh_mm");

/* CREATE OUTPUT SHEETS */
var oOutput = Context.createExcelWorkbook(Context.getSelectedFile());
var oExportedFilesSheet = oOutput.createSheet("Exported Files");
var headerRow = oExportedFilesSheet.createRow(0);
headerRow.createCell(0).setCellValue("Folder");
headerRow.createCell(1).setCellValue("File");
var oIssuesSheet = oOutput.createSheet("Issues");
headerRow = oIssuesSheet.createRow(0);
headerRow.createCell(0).setCellValue("Report Folder");
headerRow.createCell(1).setCellValue("Report Name");
headerRow.createCell(2).setCellValue("Issue description");
var intCurrentIssueRow = 1;
var intCurrentExportedFileRow = 1;

var scriptNames = []; //dodano
var same = false; //dodano
var searchTxt = ""; //dodano

//var testFileName = "Find task \\ role connection to req in matrix model which does not have occ in the same validity model";
//var bFileOK = fileNameOk(testFileName);

var aScriptComponentInfo = scriptAdminComponent.getScriptComponents();

// get ComponentIDs
var ComponentID_CommonFiles = aScriptComponentInfo[0].getComponentID();
var ComponentID_Reports = aScriptComponentInfo[1].getComponentID();

// Set the Root folders for Common Files and Reports
var ExportFolder_CommonFiles ="Common files";
var ExportFolder_Reports ="Reports";

var outputLocation = exportLocation + "/" + df.format( new Date() ); 

var writeErrorCount = 0;
var errors = [];

main();

oOutput.write();

///////////////////////////////////////////////////////////////////////////////////////////////////////
// Main function
///////////////////////////////////////////////////////////////////////////////////////////////////////
function main(){
    
    // prepare target folder
    createFolder(outputLocation);
    emptyFolder(outputLocation);
    
    //Export Common Files
    var listCommonFilesScriptInfos = scriptAdminComponent.getScriptInfos(ComponentID_CommonFiles, null, nLocale);
    exportScripts(ComponentID_CommonFiles, null, 
                    ExportFolder_CommonFiles, null, listCommonFilesScriptInfos);
    
    // get all Report folders / Categories
    var reportSubFolders = scriptAdminComponent.getCategories(ComponentID_Reports, nLocale);
    for (var j=0; j<reportSubFolders.length; j++)
    {
        //Filter only Reports in Folders containing some string
        //if ( reportSubFolders[j].getName().indexOf("Equinor") != -1 || reportSubFolders[j].getName().equals("APG_Scripts") ) { 
            
            var listScriptInfos = scriptAdminComponent.getScriptInfos(ComponentID_Reports, reportSubFolders[j].getCategoryID(), nLocale);
            exportScripts(ComponentID_Reports, reportSubFolders[j].getCategoryID(),
                            ExportFolder_Reports, reportSubFolders[j].getName(), listScriptInfos);
        //}
    }
    var Dlg = null;
    Dlg = Dialogs.showDialog(new userDialog(), Constants.DIALOG_TYPE_ACTION, "Export ARIS scripts to GitHub");    //dodano i ovo i crta povise
}
function logExportedFile(strFolder, strName){
    if(strFolder == null)
        strFolder = "Common files";
    
    var dataRow = oExportedFilesSheet.createRow(intCurrentExportedFileRow);
    dataRow.createCell(0).setCellValue(strFolder);
    dataRow.createCell(1).setCellValue(strName);
    scriptNames.push(strName); //dodano
    intCurrentExportedFileRow++;
}
function logIssue(strFolder, strName, strIssue){
    if(strFolder == null)
        strFolder = "Common files";
    
    var dataRow = oIssuesSheet.createRow(intCurrentIssueRow);
    dataRow.createCell(0).setCellValue(strFolder);
    dataRow.createCell(1).setCellValue(strName);
    dataRow.createCell(2).setCellValue(strIssue);
    intCurrentIssueRow++;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// function createFolder
///////////////////////////////////////////////////////////////////////////////////////////////////////
function createFolder(location) {
    var dir =new Packages.java.io.File(location);
    if (dir!=null) {
        if (! dir.exists()) {
             Packages.org.apache.commons.io.FileUtils.forceMkdir(dir);
        }
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// function emptyFolder
///////////////////////////////////////////////////////////////////////////////////////////////////////
function emptyFolder(location) {
    var dir =new Packages.java.io.File(location);
    if (dir!=null) {
        if (dir.exists()) {
             Packages.org.apache.commons.io.FileUtils.cleanDirectory(dir);
        }
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// function validateStringFilenameUsingRegex
// Checks if given filename is ok, returns true if illegal charachter is used
///////////////////////////////////////////////////////////////////////////////////////////////////////
function fileNameOk(filename) {
    var REGEX_PATTERN = "^[A-za-z0-9._-\)\(]{1,255}$";
    
    if (filename.indexOf("\\") != -1 || filename.indexOf("/") != -1) {
        return false;
    }
    return true;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// function exportScripts
///////////////////////////////////////////////////////////////////////////////////////////////////////
function exportScripts(componentID, categoryID, exportRootFolder, subFolderName, aScriptInfos) {
    
    //Create subfolder
    if(subFolderName != null && !subFolderName.equals(""))
        createFolder(outputLocation + "/" + exportRootFolder + "/"  + subFolderName);
    
     for(var k=0; k<aScriptInfos.length; k++)
     {
        var scriptID = aScriptInfos[k].getID();
        var fileName = aScriptInfos[k].getName();
        var fileNameARX = aScriptInfos[k].getName();
        var isJSFile = true;
        var isOtherFile = false;
        
        
        
        // export *.js files and scripts
        //if (fileName.indexOf(".js")!=-1 || ! aScriptInfos[k].isSimpleFile() ) {
            
            //Validate file name
            if(!fileNameOk(fileName)){
                logIssue(subFolderName, fileName, "Report name contains illegal characters!");
                continue;
            }
            
            if (fileName.indexOf(".js")==-1) {
                if(
                    fileName.indexOf(".jpg") != -1 || 
                    fileName.indexOf(".png") != -1 || 
                    fileName.indexOf(".xlsx") != -1 || 
                    fileName.indexOf(".gif") != -1 || 
                    fileName.indexOf(".txt") != -1 || 
                    fileName.indexOf(".css") != -1 || 
                    fileName.indexOf(".xml") != -1 || 
                    fileName.indexOf(".emf") != -1
                    )
                    {
                        isJSFile = true;
                    }else{
                        isJSFile = false;
                        fileName = fileName + ".js";
                        fileNameARX = fileNameARX + ".arx";
                    }
            }
            // script
            var zipEntry = scriptAdminComponent.exportFile( componentID, categoryID, scriptID );
            var arxByteArray = null;
            if(componentID == ComponentID_Reports)
                arxByteArray = scriptAdminComponent.exportScript(componentID, scriptID, new Array());
           
            var file =null;
            var fileARX = null;
            if(subFolderName != null){
                file =new Packages.java.io.File(outputLocation + "/" + exportRootFolder + "/" + subFolderName + "/" + fileName);
                fileARX =new Packages.java.io.File(outputLocation + "/" + exportRootFolder + "/" + subFolderName + "/" + fileNameARX);
            }
            else{
                file =new Packages.java.io.File(outputLocation + "/" + exportRootFolder + "/" + fileName);
                fileARX =new Packages.java.io.File(outputLocation + "/" + exportRootFolder + "/" + fileNameARX);
            }
            
            try {
                Packages.org.apache.commons.io.FileUtils.writeByteArrayToFile(file, zipEntry.getData());
                logExportedFile(subFolderName, fileName);
                if(arxByteArray != null && !isJSFile){
                    Packages.org.apache.commons.io.FileUtils.writeByteArrayToFile(fileARX, arxByteArray);
                    logExportedFile(subFolderName, fileNameARX);
                }
            } catch ( err ) {
                logIssue(subFolderName, fileName, err.toString());
            }
            
        //}
     }

}    

//dodano sve nize
function userDialog () {
    
    var pageIndexSelectDocument = 0;
    var selected_values = [];
    
    this.getPages = function(){
        
    var userDlg = Dialogs.createNewDialogTemplate(650, 400, "Select Scripts to push to GitHub"); 
    
    userDlg.GroupBox(15, 20, 620, 275, "Select scripts to be pushed");    
    userDlg.Text(35, 35, 200, 15, "Select script");
    userDlg.Text(35, 55, 150, 15, "Search by script name:");
    userDlg.TextBox(170, 55, 115, 13, "Document_txtSearch", 0);
    userDlg.ListBox(35, 75, 250, 180, scriptNames, "All_scripts", 0);  //ListBox of all scripts  
    userDlg.PushButton(300, 145, 50, 30, "<SYMBOL_ARROWRIGHT>", "Document" + "_btnAdd");
    userDlg.Text(365, 55, 200, 15, "Selected scripts");
    userDlg.ListBox(365, 75, 250, 180, [], "Selected_scripts");  //ListBox of selected scripts
    userDlg.PushButton(35, 260, 70, 20, "Select all", "Document" + "_btnAddAll");  //Select all items button
    userDlg.PushButton(365, 260, 70, 20, "Delete", "Document" + "_btnDel");  //Delete button
    userDlg.PushButton(455, 260, 75, 20, "Delete all", "Document" + "_btnDelAll");  //Delete all button
    
    userDlg.GroupBox(15, 305, 620, 90, "Comment");
    userDlg.Text(35, 320, 200, 15, "Please enter your commit comment:");
    userDlg.TextBox(35, 340, 400, 35, "Git_comment",1);
    userDlg.PushButton(450, 340, 50, 30, "<SYMBOL_ARROWRIGHT>", "Document" + "_btnAddComm");
    userDlg.OKButton();
    userDlg.CancelButton();
    
     
    //*********************************************************************************************************
                //ACTION HANDLERS
    //*********************************************************************************************************
    
    //Search all scripts
    this.Document_txtSearch_changed = function() {
        searchTxt = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Document_txtSearch").getText();
        
        var suggestions = scriptNames.filter(
        function(element)
        {
            return element.startsWith(searchTxt);
        }
        );
        
        this.dialog.getPage(pageIndexSelectDocument).getDialogElement("All_scripts").setItems(suggestions);
    };
    
    //Add selected script    
    this.Document_btnAdd_pressed = function() 
    {   
        var selected_index = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("All_scripts").getSelectedIndex();
        
        //1. Check if anything is selected. 2.Check if script is already selected
        if(!(scriptNames[selected_index] === undefined)){
            for(var i = 0; i < selected_values.length; i++){
                    if(selected_values[i] == scriptNames[selected_index]){
                        same = true;
                        break;
                    }
                    else{
                        same = false;
                    }
            }
            if(!same){
                selected_values.push(scriptNames[selected_index]);
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
}
