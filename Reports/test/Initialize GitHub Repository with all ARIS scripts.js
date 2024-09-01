//var oOutput = Context.createOutputObject();

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

var dfFormat = df.format( new Date() );
var outputLocation = exportLocation + "/" + dfFormat; 

var writeErrorCount = 0;
var errors = [];


var exportLocationCmdFormat = "C:\\ARISScriptExports"; //format that supports cd/mkdir/rmir commands in cmd
var dirPath = exportLocationCmdFormat + "\\" + dfFormat; //same


main();

oOutput.WriteReport();

///////////////////////////////////////////////////////////////////////////////////////////////////////
// Main function
///////////////////////////////////////////////////////////////////////////////////////////////////////

function main()
{
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
            
            var listScriptInfos = scriptAdminComponent.getScriptInfos(ComponentID_Reports, reportSubFolders[j].getCategoryID(), nLocale);
            exportScripts(ComponentID_Reports, reportSubFolders[j].getCategoryID(),
                            ExportFolder_Reports, reportSubFolders[j].getName(), listScriptInfos);
        //}
    }
    
    var Dlg = null;
    Dlg = Dialogs.showDialog(new userDialog(), Constants.DIALOG_TYPE_ACTION, "Initial commit to export ARIS scripts to GitHub repository");
    
    //createBatchFile(gitUsername, gitEmail, gitRepo, decrypt(gitPAT, 11), dirPath);
    
    //PROCESS

    var process = Context.execute("\"C:\\Nova mapa\\batchfile.bat\"");
    
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
    
    
    var dummy = 0;
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



function userDialog () {
    
    var pageIndexSelectDocument = 0;
    
    this.getPages = function(){
        
    var userDlg = Dialogs.createNewDialogTemplate(650, 300, "Insert required info to push to GitHub");   
    
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
        
        createBatchFile(gitUsername, gitEmail, gitRepo, gitPAT, dirPath);
    }
    
    var listPagesToShow = [];
    listPagesToShow.push(userDlg);
         
    return listPagesToShow;
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// function createBatchFile
///////////////////////////////////////////////////////////////////////////////////////////////////////

function createBatchFile(gitUsername, gitEmail, gitRepo, gitPAT, gitPath)
{
        var stringBuilder = new Packages.java.lang.StringBuilder();
        stringBuilder.append("cd " + dirPath + "\n");
        //stringBuilder.append("echo \"*.js\"" + " >> .gitignore" + "\n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\" init \n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\" config --global --add safe.directory " + gitPath + " \n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\" --git-dir=" + "\"" + gitPath + "\\.git\" --work-tree=" + "\"" + gitPath + "\"\ config user.name \"" + gitUsername + "\" \n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\" --git-dir=" + "\"" + gitPath + "\\.git\" --work-tree=" + "\"" + gitPath + "\"\ config user.email \"" + gitEmail + "\" \n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\" --git-dir=" + "\"" + gitPath + "\\.git\" --work-tree=" + "\"" + gitPath + "\"\ add . " + "\n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\" --git-dir=" + "\"" + gitPath + "\\.git\" --work-tree=" + "\"" + gitPath + "\"\ commit -m \"Initial commit\"" + "\n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\" --git-dir=" + "\"" + gitPath + "\\.git\" --work-tree=" + "\"" + gitPath + "\"\ branch -M main " + "\n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\" --git-dir=" + "\"" + gitPath + "\\.git\" --work-tree=" + "\"" + gitPath + "\"\ remote add origin https://github.com/" + gitUsername + "/" + gitRepo + ".git " + "\n");
        stringBuilder.append("\"C:\\Program Files\\Git\\bin\\git.exe\" --git-dir=" + "\"" + gitPath + "\\.git\" --work-tree=" + "\"" + gitPath + "\"\ push https://" + gitPAT + "@github.com/" + gitUsername + "/" + gitRepo + ".git main " + "\n");
        
        var result = stringBuilder.toString();
        var filePath = "C:\\Nova mapa\\batchfile.bat";
        
        try
        {
            var fileWriter = new Packages.java.io.FileWriter(filePath);
            var printWriter = new Packages.java.io.PrintWriter(fileWriter);
            
            printWriter.print(result);
            
            printWriter.close();
            fileWriter.close();
        }
        catch(e)
        {
            logIssue(result, e.toString());
        }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// function encrypt - used for simple Caesar shift encryption in order to push config.js file to GitHub
///////////////////////////////////////////////////////////////////////////////////////////////////////
function encrypt(plaintext, _shift)
{
    var encrypted = "";
    
    for(var i = 0; i < plaintext.length; i++)
        {
            var character = plaintext[i];
            
            if(/[a-zA-Z]/.test(character))
                {
                    var base = character === character.toUpperCase() ? "A".charCodeAt(0) : "a".charCodeAt(0);
                    var encryptedChar = String.fromCharCode((character.charCodeAt(0) - base + _shift) % 26 + base);
                    
                    encrypted += encryptedChar;
                }
            else
                {
                    encrypted += character;
                }
        }
        
    return encrypted;
}

function decrypt(ciphertext, _shift)
{
    return encrypt(ciphertext, 26 - _shift);
}








