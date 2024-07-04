var nLocale = Context.getSelectedLanguage();

var xlsTemplateFile = Context.getFile("template.xlsx", Constants.LOCATION_SCRIPT);
var oWorkBook = Context.createExcelWorkbook("Result.xlsx", xlsTemplateFile);
var oSheet = oWorkBook.getSheetAt(0);

var startRow = 1;

var scriptAdminComponent = Context.getComponent("ScriptAdmin");
var aScriptComponentInfo = scriptAdminComponent.getScriptComponents();

var ComponentID_Reports = aScriptComponentInfo[1].getComponentID();

var listReportsAndImports = new Array();

main();

function main()
{
    var reportSubFolders = scriptAdminComponent.getCategories(ComponentID_Reports, nLocale);
    for (var j=0; j<reportSubFolders.length; j++)
    {  
        var listScriptInfos = scriptAdminComponent.getScriptInfos(ComponentID_Reports, reportSubFolders[j].getCategoryID(), nLocale);
        
        for(var i = 0; i < listScriptInfos.length; i++)
            {          
                listReportsAndImports.push([listScriptInfos[i].getName(), reportSubFolders[j].getName(), listScriptInfos[i].getImports()]);
            }
    }
    
    listReportsAndImports.forEach(function(entry)
    {
        var report = entry[0];
        var group = entry[1];
        var imports = entry[2];
        
        if(imports == "")
            {
               var newRow = oSheet.createRow(startRow);
               newRow.createCell(0).setCellValue(report);
               newRow.createCell(1).setCellValue(group);
               newRow.createCell(2).setCellValue("none");
               startRow++;
            }
        else
            {
               for(var i = 0; i < imports.length; i++)
                   {
                       if(!imports[i].toString().includes("."))
                           {
                               var fileName = scriptAdminComponent.getScriptInfo(1, ComponentID_Reports, imports[i], nLocale).getName();
                               var newRow = oSheet.createRow(startRow);
                               newRow.createCell(0).setCellValue(report);
                               newRow.createCell(1).setCellValue(group);
                               newRow.createCell(2).setCellValue(fileName);
                               startRow++;
                           }
                        else
                            {
                               var newRow = oSheet.createRow(startRow);
                                newRow.createCell(0).setCellValue(report);
                                newRow.createCell(1).setCellValue(group);
                                newRow.createCell(2).setCellValue(imports[i]);
                                startRow++;
                            }
                   }
            }
    } );
    
    oWorkBook.write();
}