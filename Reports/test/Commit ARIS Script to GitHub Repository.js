var nLocale   = Context.getSelectedLanguage();
var scriptAdminComponent = Context.getComponent("ScriptAdmin");
var exportLocation = "C:\\ARISScriptExports";
var df = new java.text.SimpleDateFormat("yyyy_MM_dd_hh_mm");

var ooOutput = Context.createOutputObject();

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

var allClonedFiles = []; //array of .arx file names
var allClonedFilesArr = []; //array of .arx file names
var allClonedFilePaths = []; //array of .arx file paths
var scriptFolder = ""; //folder which contains selected script

var scriptNames = []; //dodano
var arxScriptNames = []; //dodano
var same = false; //dodano
var searchTxt = ""; //dodano
var allFolders = []; //dodano
var compReport = 1; //dodano
var suggestions = []; //dodano
var selected_folder = []; //dodano
var selected_values = []; //dodano
var _comment = ""; //dodano
var batchFilePath = "C:\\Nova mapa commit\\batchfile.bat"; //dodano
var branch = "";
var selected_item = [];

var aScriptInfos = scriptAdminComponent.getScriptInfos(compReport, null, nLocale);
var categories = scriptAdminComponent.getCategories(1, nLocale);

//var testFileName = "Find task \\ role connection to req in matrix model which does not have occ in the same validity model";
//var bFileOK = fileNameOk(testFileName);

var aScriptComponentInfo = scriptAdminComponent.getScriptComponents();

// get ComponentIDs
var ComponentID_CommonFiles = aScriptComponentInfo[0].getComponentID();
var ComponentID_Reports = aScriptComponentInfo[1].getComponentID();

// Set the Root folders for Common Files and Reports
var ExportFolder_CommonFiles ="Common files";
var ExportFolder_Reports ="Reports";

var outputLocation = exportLocation + "\\" + df.format( new Date() );

var writeErrorCount = 0;
var errors = [];

main();

oOutput.write();

///////////////////////////////////////////////////////////////////////////////////////////////////////
// Main function
///////////////////////////////////////////////////////////////////////////////////////////////////////
function main(){
    
     for(var i = 0; i < categories.length; i++)
        {
            allFolders.push(categories[i].getName());
        }
    
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
    
    //arxScriptNames = filterArxFiles(scriptNames);
    filesLister(outputLocation); //populates allClonedFiles and allClonedFilePaths
    
    var Dlg = null;
    Dlg = Dialogs.showDialog(new userDialog(), Constants.DIALOG_TYPE_ACTION, "Commit ARIS scripts to GitHub");
    
    //createBatchFile(gitUsername, gitEmail, gitRepo, decrypt(gitPAT, 11));
    
    var Dlg2 = null;
    Dlg2 = Dialogs.showDialog(new userDialog2(), Constants.DIALOG_TYPE_ACTION, "Commit ARIS Script to GitHub Repository");
    
    
    createDeleteBatchFile();
    deleteBatchFile("C:\\Nova mapa import\\deletebatchfile.bat");
    deleteBatchFile(batchFilePath);
}

//filter .arx files from an array
function filterArxFiles(filesArray)
{
    return filesArray.filter(function(file) 
    {
        return file.endsWith(".arx");
    });
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
    var suggestions =  new Array();
    var laFilteredTableValues = new Array();
    
    this.getPages = function(){
        
    var userDlg = Dialogs.createNewDialogTemplate(650, 400, "Select Script to be pushed to GitHub"); 
    
    userDlg.GroupBox(15, 20, 620, 275, "Select script to be pushed");    
    userDlg.Text(35, 35, 200, 15, "Select script");
    userDlg.Text(35, 55, 150, 15, "Search by script name:");
    userDlg.TextBox(170, 55, 115, 13, "Document_txtSearch", 0);
    userDlg.PushButton(300, 145, 50, 30, "<SYMBOL_ARROWRIGHT>", "Document" + "_btnAdd");
    userDlg.Text(365, 55, 200, 15, "Selected script");
    userDlg.PushButton(365, 260, 70, 20, "Delete", "Document" + "_btnDel");  //Delete button
    
    var laColumnHeaders=new Array();
    var laColumnWidths=[200,50];
    laColumnHeaders.push("Name");
    laColumnHeaders.push("Type");
    userDlg.Table(35, 75, 250, 180, laColumnHeaders,null,laColumnWidths,"tblDocuments",Constants.TABLE_STYLE_DEFAULT); //all scripts
    userDlg.Table(365, 75, 250, 180, laColumnHeaders,null,laColumnWidths,"tblDocuments2",Constants.TABLE_STYLE_DEFAULT); //selected scripts
    
    userDlg.GroupBox(15, 310, 620, 60, "Branch");
    userDlg.Text(35, 325, 250, 15, "Please insert name of the branch: ");
    userDlg.TextBox(220, 321, 265, 22, "Git_branch", 0);
    
    userDlg.GroupBox(15, 385, 620, 90, "Comment");
    userDlg.Text(35, 400, 200, 15, "Please enter your commit comment:");
    userDlg.TextBox(35, 420, 450, 35, "Git_comment",1);

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
    this.Document_txtSearch_changed = function() 
    {
        this.executeSearch(this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Document_txtSearch"), allClonedFiles, this.dialog.getPage(pageIndexSelectDocument).getDialogElement("tblDocuments"), 0);
    };
    
    this.executeSearch = function(oSearchBox, listUnfilteredValues, oTableDlgElement,intColumnIndexToSearch) 
    {
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
                        //selected_values.splice(0, 1);            
                    }
                else
                    {
                        selected_values.push([suggestions[selected_index[0]][0], suggestions[selected_index[0]][1]]);
                        this.dialog.getPage(pageIndexSelectDocument).getDialogElement("tblDocuments2").setItems(selected_values);
                        //selected_values.splice(0, 1);
                    }
            }
    }
    
    //Delete selected script
    this.Document_btnDel_pressed = function() 
    {
        this.dialog.getPage(pageIndexSelectDocument).getDialogElement("tblDocuments2").setItems([]);
    }
    
    //Save comment
    this.Document_btnAddComm_pressed = function() 
    {
        _comment = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Git_comment").getText();
    }
    
    //on close get text from comment and branch, and get ARIS location folder name
    this.onClose = function()
    {
        _comment = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Git_comment").getText();
        branch = this.dialog.getPage(pageIndexSelectDocument).getDialogElement("Git_branch").getText();
        
        //var path = allClonedFilePaths[allClonedFiles.indexOf(selected_values[0][0])];
        var path = allClonedFilePaths[allClonedFilesArr.indexOf(selected_values[0][0])];
        
        var match = path.match(/\\([^\\]+)\\[^\\]+$/); //match the substring between the second-to-last and last backslashes in the file path
        scriptFolder = match[1];
        
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
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\" clone https://" + gitPAT + "@github.com/" + gitUsername + "/" + gitRepo + ".git \n");
        //stringBuilder.append("\copy /Y \"" + outputLocation + "\\Reports\\" + allFolders[selected_folder] + "\\" + selected_values[0] + "\" \"" + "C:\\CloneARIS\\" + gitRepo + "\\Reports\\" + allFolders[selected_folder] + "\\" + selected_values[0] + "\"" +" \n");
        
        if(selected_item[0][1].toString() == "Common files")
            {
                stringBuilder.append("\copy /Y \"" + outputLocation + "\\Common files\\" + selected_values[0] + "\" \"" + "C:\\CloneARIS\\" + gitRepo + "\\Reports\\" + scriptFolder + "\\" + selected_values[0][0] + "\"" +" \n"); //TU SAN STA
            }
            
        stringBuilder.append("\copy /Y \"" + outputLocation + "\\Reports\\" + scriptFolder + "\\" + selected_values[0][0] + "\" \"" + "C:\\CloneARIS\\" + gitRepo + "\\Reports\\" + scriptFolder + "\\" + selected_values[0][0] + "\"" +" \n");
        stringBuilder.append("\copy /Y \"" + outputLocation + "\\Reports\\" + scriptFolder + "\\" + selected_values[0][0].replace("arx", "js") + "\" \"" + "C:\\CloneARIS\\" + gitRepo + "\\Reports\\" + scriptFolder + "\\" + selected_values[0][0].replace("arx", "js") + "\"" +" \n");
        stringBuilder.append("cd " + gitRepo + " \n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\"" + " config user.name " + "\"" + gitUsername + "\" \n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\"" + " config user.email " + "\"" + gitEmail + "\" \n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\" branch " + branch + "\n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\" checkout " + branch + "\n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\" add . \n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\" commit -m " + "\"" + _comment + "\"" + " \n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\"" + " push --force https://" + gitPAT + "@github.com/" + gitUsername + "/" + gitRepo + ".git " + branch + "\n");
        
        var result = stringBuilder.toString();
        
        //ooOutput.OutputTxt(result);
        //ooOutput.WriteReport();
        
        
        try
        {
            var fileWriter = new Packages.java.io.FileWriter(batchFilePath);
            var printWriter = new Packages.java.io.PrintWriter(fileWriter);
            
            printWriter.print(result);
            
            printWriter.close();
            fileWriter.close();
            
                //PROCESS

            var process = Context.execute("\"C:\\Nova mapa commit\\batchfile.bat\"");
            
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
            logIssue(result, e.toString());
        }
}

        function userDialog2 () {
            
            var pageIndexSelectDocument = 0;
            
            this.getPages = function(){
                
            var userDlg2 = Dialogs.createNewDialogTemplate(650, 300, "Insert required info to pull from GitHub and import to ARIS");   
            
            userDlg2.GroupBox(15, 20, 630, 55, "Information");
            userDlg2.Text(35, 35, 600, 15, "Please enter the required informations below. ​All fields are mandatory!");
            userDlg2.Text(35, 50, 600, 15, "* PAT refers to Personal Access Token which you need to generate in GitHub. Always check expiration date!");
            
            userDlg2.GroupBox(15, 85, 630, 220, "Insert informations:");
            userDlg2.Text(35, 100, 400, 15, "Please enter your GitHub PAT (Personal Access Token):");
            userDlg2.TextBox(35, 115, 400, 23, "Git_PAT",1);
            userDlg2.Text(35, 150, 400, 15, "Please enter your username:");
            userDlg2.TextBox(35, 165, 400, 23, "Git_USERNAME",1);
            userDlg2.Text(35, 200, 400, 15, "Please enter your email:");
            userDlg2.TextBox(35, 215, 400, 23, "Git_EMAIL",1);
            userDlg2.Text(35, 250, 400, 15, "Please enter your GitHub repository name:");
            userDlg2.TextBox(35, 265, 400, 23, "Git_REPO",1);
            userDlg2.PushButton(500, 180, 70, 40, "<SYMBOL_ARROWRIGHT>", "Document" + "_btnAdd");
            
            
            userDlg2.OKButton();
            userDlg2.CancelButton();
            
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
            
            this.onClose = function() 
            {
                
            }
            
            var listPagesToShow = [];
            listPagesToShow.push(userDlg2);
                 
            return listPagesToShow;
            }
        }
        

///////////////////////////////////////////////////////////////////////////////////////////////////////
// function deleteBatchFile
///////////////////////////////////////////////////////////////////////////////////////////////////////
function deleteBatchFile(batchPath)
{
    var file = Packages.java.io.File(batchPath);
    file.delete();
}

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
            logIssue(result, e.toString());
        }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
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
                   if(commonFiles[i].getName().endsWith(".js"))
                        {
                            allClonedFiles.push([commonFiles[i].getName(), "Common files"]);
                            allClonedFilesArr.push(commonFiles[i].getName());
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
                            allClonedFiles.push([String(files[i].getName()), "Reports"]);
                            allClonedFilesArr.push(String(files[i].getName()));
                            allClonedFilePaths.push(files[i].getAbsolutePath());
                        }
                }
        }
}

