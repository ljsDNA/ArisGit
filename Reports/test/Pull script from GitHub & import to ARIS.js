var nLocale   = Context.getSelectedLanguage();
var oOutput = Context.createOutputObject();
var scriptAdminComponent = Context.getComponent("ScriptAdmin");

var batchFilePath = "C:\\Nova mapa import\\batchfile.bat";
var rootDirectory = "C:\\CloneARIS"; //location of cloned GitHub Repository

var allClonedFiles = []; //array of .arx file names
var allClonedFilePaths = []; //array of .arx file paths

var suggestions = []; //array of suggested scripts by search
var selected_values = []; //array of selected scripts
var selected_item = [];

main();

oOutput.WriteReport();

function main()
{
    var categoriesID = 0;
    var compReport = 1;
    var selectedFilePath = "";
    
    var Dlg = null;
    Dlg = Dialogs.showDialog(new userDialog(), Constants.DIALOG_TYPE_ACTION, "Initial commit to export ARIS scripts to GitHub repository");
    
    //createBatchFile(gitUsername, gitEmail, gitRepo, gitPAT);
    
    filesLister(rootDirectory); //populates allClonedFiles and allClonedFilePaths
    
    var Dlg2 = null;
    Dlg2 = Dialogs.showDialog(new userDialog2(), Constants.DIALOG_TYPE_ACTION, "Pull ARIS script from GitHub");
    
    
    //oOutput.OutputTxt(allClonedFiles.findIndex(function(subArray){return subArray[0] === selected_item[0][0];}));
    var index = -1;
    
    for (var i = 0; i < allClonedFiles.length; i++) {
        if (allClonedFiles[i][0] == selected_item[0][0].toString()) {
            index = i;
            break;
        }
    }
    
    selectedFilePath = allClonedFilePaths[index];

    var fileData = Packages.java.nio.file.Files.readAllBytes(Packages.java.nio.file.Paths.get(selectedFilePath));  //load file content in byte stream
    
    var path = selectedFilePath.toString();
    var parts = path.replace("\\", ";").split(";");
    var folder = parts[parts.length - 2];
    
    
    
    /////////////////////////////////////////////////////////////////////////////////
    //get category_ID (folder on ARIS server where script is located)
    if(selected_item[0][1].toString() == "Common files")
        {
            var id = scriptAdminComponent.importFile(0, null, selected_item[0][0].toString(), fileData);
        }
    else
        {
            var aScriptInfos = scriptAdminComponent.getScriptInfos(compReport, null, nLocale);
            var categories = scriptAdminComponent.getCategories(1, nLocale);
            for(var i = 0; i < categories.length; i++)
                {
                    if(categories[i].getName().equals(folder.toString()))
                        {
                            categoriesID = categories[i].getCategoryID();
                            
                            if(selected_item[0][0].toString().endsWith(".arx"))
                                {
                                    scriptAdminComponent.importScript(1, categoriesID, fileData, null);  //import script
                                }
                            else
                                {
                                    var id = scriptAdminComponent.importFile(1, categoriesID, selected_item[0][0].toString(), fileData);
                                }
                            
                            break;
                        }
                }
        }
    /////////////////////////////////////////////////////////////////////////////////
    
    //var id = scriptAdminComponent.importFile(1, categoriesID, selected_item[0][0].toString(), fileData);
    //scriptAdminComponent.importScript(1, categoriesID, fileData, null);  //import script
    
    createDeleteBatchFile();
    deleteBatchFile("C:\\Nova mapa import\\deletebatchfile.bat");
    deleteBatchFile(batchFilePath);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// User Dialog for GitHub info insert
///////////////////////////////////////////////////////////////////////////////////////////////////////

function userDialog () {
    
    var pageIndexSelectDocument = 0;
    
    this.getPages = function(){
        
    var userDlg = Dialogs.createNewDialogTemplate(650, 300, "Insert required info to pull from GitHub and import to ARIS");   
    
    userDlg.GroupBox(15, 20, 630, 55, "Information");
    userDlg.Text(35, 35, 600, 15, "Please enter the required informations below. ​All fields are mandatory!");
    userDlg.Text(35, 50, 600, 15, "* PAT refers to Personal Access Token which you need to generate in GitHub. Always check expiration date!");
    
    userDlg.GroupBox(15, 85, 630, 220, "Insert informations:");
    userDlg.Text(35, 100, 400, 15, "Please enter your GitHub PAT (Personal Access Token):");
    userDlg.TextBox(35, 115, 400, 23, "Git_PAT",1);
    userDlg.Text(35, 150, 400, 15, "Please enter your username:");
    userDlg.TextBox(35, 165, 400, 23, "Git_USERNAME",1);
    userDlg.Text(35, 200, 400, 15, "Please enter your email:");
    userDlg.TextBox(35, 215, 400, 23, "Git_EMAIL",1);
    userDlg.Text(35, 250, 400, 15, "Please enter your GitHub repository name:");
    userDlg.TextBox(35, 265, 400, 23, "Git_REPO",1);
    userDlg.PushButton(500, 180, 70, 40, "<SYMBOL_ARROWRIGHT>", "Document" + "_btnAdd");
    
    
    userDlg.OKButton();
    userDlg.CancelButton();
    
    //*********************************************************************************************************
                //ACTION HANDLERS
    //*********************************************************************************************************
    //Save comment
    this.Document_btnAdd_pressed = function() 
    {
        var gitPAT = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Git_PAT").getText();
        var gitUsername = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Git_USERNAME").getText();
        var gitEmail = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Git_EMAIL").getText();
        var gitRepo = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Git_REPO").getText();
        
        createBatchFile(gitUsername, gitEmail, gitRepo, gitPAT);
    }
    
    var listPagesToShow = [];
    listPagesToShow.push(userDlg);
         
    return listPagesToShow;
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// User Dialog for script selection
///////////////////////////////////////////////////////////////////////////////////////////////////////

function userDialog2 () {
    
    var pageIndexSelectDocument = 0;
    var suggestions =  new Array();
    var laFilteredTableValues = new Array();
    
    this.getPages = function(){
        
    var userDlg = Dialogs.createNewDialogTemplate(650, 300, "Select Scripts to push to GitHub"); 
    
    var userDlg = Dialogs.createNewDialogTemplate(650, 300, "Select Scripts to push to GitHub"); 
    userDlg.GroupBox(15, 20, 620, 275, "Select script to be pulled");    
    userDlg.Text(35, 35, 200, 15, "Select script");
    userDlg.Text(35, 55, 100, 15, "Search by name:");
    userDlg.TextBox(130, 55, 155, 13, "Document_txtSearch", 0);
    //userDlg.ListBox(35, 75, 250, 180, allClonedFiles, "All_scripts", 0);  //ListBox of all scripts  
    userDlg.PushButton(300, 145, 50, 30, "<SYMBOL_ARROWRIGHT>", "Document" + "_btnAdd");
    userDlg.Text(365, 55, 200, 15, "Selected script");
    //userDlg.ListBox(365, 75, 250, 180, [], "Selected_scripts");  //ListBox of selected scripts
    userDlg.PushButton(365, 260, 70, 20, "Delete", "Document" + "_btnDel");  //Delete button
    
    var laColumnHeaders=new Array();
    var laColumnWidths=[200,50];
    laColumnHeaders.push("Name");
    laColumnHeaders.push("Type");
    userDlg.Table(35, 75, 250, 180, laColumnHeaders,null,laColumnWidths,"tblDocuments",Constants.TABLE_STYLE_DEFAULT);
    
    userDlg.Table(365, 75, 250, 180, laColumnHeaders,null,laColumnWidths,"tblDocuments2",Constants.TABLE_STYLE_DEFAULT);
    
    userDlg.OKButton();
    userDlg.CancelButton();
    
    this.init = function()
    {
        this.dialog.getPage(pageIndexSelectDocument).getDialogElement("tblDocuments").setItems(allClonedFiles);
    }
    
     
    //*********************************************************************************************************
                //ACTION HANDLERS
    //*********************************************************************************************************
    
    
    //Search all scripts
    this.Document_txtSearch_changed = function() {
        this.executeSearch(this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Document_txtSearch"), allClonedFiles, this.dialog.getPage(pageIndexSelectDocument).getDialogElement("tblDocuments"), 0);
    };
    
    this.executeSearch = function(oSearchBox, listUnfilteredValues, oTableDlgElement,intColumnIndexToSearch) {
        var lsFilterText = oSearchBox.getText();
        
        suggestions = listUnfilteredValues.filter(
        function(element)
        {
            return element[0].toLowerCase().startsWith(lsFilterText.toLowerCase());
        }
        );
        
        listUnfilteredValues.forEach(function(row) {
            {
                if (row[intColumnIndexToSearch].toLowerCase().indexOf(lsFilterText.toLowerCase()) !== -1) {
                    laFilteredTableValues.push(row);
                }
            }
        });
        oTableDlgElement.setItems(suggestions);
    }
    
    //Add selected script    
    this.Document_btnAdd_pressed = function() 
    {   
        var selected_index = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("tblDocuments").getSelection();

        //1. Check if anything is selected. 2.Check if script is already selected
        if(this.dialog.getPage(pageIndexSelectDocument).getDialogElement("tblDocuments2").getItems()[0] == undefined)
            {
                if(suggestions[0] == null)
                    {
                        selected_values.push([allClonedFiles[selected_index[0]][0], allClonedFiles[selected_index[0]][1]]);
                        this.dialog.getPage(pageIndexSelectDocument).getDialogElement("tblDocuments2").setItems(selected_values);
                        selected_values.splice(0, 1);            
                    }
                else
                    {
                        selected_values.push([suggestions[selected_index[0]][0], suggestions[selected_index[0]][1]]);
                        this.dialog.getPage(pageIndexSelectDocument).getDialogElement("tblDocuments2").setItems(selected_values);
                        selected_values.splice(0, 1);
                    }
            }
    }
    
    //Delete selected script
    this.Document_btnDel_pressed = function() 
    {
        this.dialog.getPage(pageIndexSelectDocument).getDialogElement("tblDocuments2").setItems([]);
    }
    
    this.onClose = function()
    {
        selected_item = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("tblDocuments2").getItems();
    }
    
    var listPagesToShow = [];
    listPagesToShow.push(userDlg);
         
    return listPagesToShow;
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////
// function createBatchFile
///////////////////////////////////////////////////////////////////////////////////////////////////////

function createBatchFile(gitUsername, gitEmail, gitRepo, gitPAT)
{
        var stringBuilder = new Packages.java.lang.StringBuilder();
        stringBuilder.append("mkdir C:\\CloneARIS \n");
        stringBuilder.append("cd C:\\CloneARIS \n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\" clone https://" + gitPAT + "@github.com/" + gitUsername + "/" + gitRepo + ".git");
        
        var result = stringBuilder.toString();
        
        try
        {
            var fileWriter = new Packages.java.io.FileWriter(batchFilePath);
            var printWriter = new Packages.java.io.PrintWriter(fileWriter);
            
            printWriter.print(result);
            
            printWriter.close();
            fileWriter.close();
            
                //PROCESS

            var process = Context.execute("\"C:\\Nova mapa import\\batchfile.bat\"");
            
            //FOR DEBUGGING PURPOSES
            var inReader = new java.io.BufferedReader(new java.io.InputStreamReader(process.getInputStream()));
        
            //OUTPUT FILE
            var sResult = "";
            var text;
            //while loop is used for waiting the process to finish or to write an output report for debugging
            while((text = inReader.readLine()) != null)
                {
                    //sResult += text + "|    |";
                }
            //oOutput.OutputTxt(sResult);
        }
        catch(e)
        {
            //logIssue(result, e.toString());
        }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// function deleteBatchFile - deletes batch file after execution
///////////////////////////////////////////////////////////////////////////////////////////////////////

function deleteBatchFile(batchPath)
{
    var file = Packages.java.io.File(batchPath);
    file.delete();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// function createDeleteBatchFile - creates batch file to delete files
///////////////////////////////////////////////////////////////////////////////////////////////////////

function createDeleteBatchFile()
{
        var stringBuilder = new Packages.java.lang.StringBuilder();
        stringBuilder.append("rmdir /s /q " + "\"C:\\CloneARIS\"" + " \n");
        
        var result = stringBuilder.toString();
        
        try
        {
            var fileWriter = new Packages.java.io.FileWriter("C:\\Nova mapa import\\deletebatchfile.bat");
            var printWriter = new Packages.java.io.PrintWriter(fileWriter);
            
            printWriter.print(result);
            
            printWriter.close();
            fileWriter.close();
            
                //PROCESS

            var process = Context.execute("\"C:\\Nova mapa import\\deletebatchfile.bat\"");
            
            //FOR DEBUGGING PURPOSES
            var inReader = new java.io.BufferedReader(new java.io.InputStreamReader(process.getInputStream()));
        
            //OUTPUT FILE
            var sResult = "";
            var text;
            //while loop is used for waiting the process to finish or to write an output report for debugging
            while((text = inReader.readLine()) != null)
                {
                    //sResult += text + "|    |";
                }
            //oOutput.OutputTxt(sResult);
        }
        catch(e)
        {
            
        }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// function filesLister - finds all files and file paths
// function commonFilesLister - finds all common files and file paths
// function arxFilesLister - finds all .arx files and file paths
///////////////////////////////////////////////////////////////////////////////////////////////////////

function filesLister(directoryPath)
{
    commonFilesLister(directoryPath);
    arxFilesLister(directoryPath);
}

function commonFilesLister(directoryPath)
{
    var commonDirectory = new Packages.java.io.File(directoryPath + "\\" + gitRepo + "\\Common files");
    
    if(!commonDirectory.exists() || !commonDirectory.isDirectory())
        {
            return;
        }
    
    var commonFiles = commonDirectory.listFiles();
    if(commonFiles != null)
        {
            for(var i = 0; i < commonFiles.length; i++)
                {
                   if(commonFiles[i].getName())
                        {
                            allClonedFiles.push([commonFiles[i].getName(), "Common files"]);
                            allClonedFilePaths.push(commonFiles[i].getAbsolutePath());
                        }
                }
        }
}

function arxFilesLister(directoryPath)
{
    var arxFile = [];
    
    var directory = new Packages.java.io.File(directoryPath);
    
    if(!directory.exists() || !directory.isDirectory())
        {
            return;
        }
    
    var files = directory.listFiles();
    if(files != null)
        {
            for(var i = 0; i < files.length; i++)
                {
                    if(files[i].isDirectory())
                        {
                            arxFile.push(arxFilesLister(files[i].getAbsolutePath()));
                        }
                    if(files[i].getName().endsWith(".arx") ||
                       files[i].getName().endsWith(".jpg") ||
                       files[i].getName().endsWith(".png") ||
                       files[i].getName().endsWith(".xlsx") ||
                       files[i].getName().endsWith(".gif") ||
                       files[i].getName().endsWith(".txt") ||
                       files[i].getName().endsWith(".css") ||
                       files[i].getName().endsWith(".xml") ||
                       files[i].getName().endsWith(".emf") 
                    )
                        {
                            allClonedFiles.push([files[i].getName(), "Reports"]);
                            allClonedFilePaths.push(files[i].getAbsolutePath());
                        }
                }
        }
}