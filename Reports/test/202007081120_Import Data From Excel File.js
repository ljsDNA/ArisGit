var nLocale = Context.getSelectedLanguage()
var selectedDb = ArisData.getSelectedDatabases()
var models = new Array()

var excelFile = getExcelFile() //get excell file
var sheets = excelFile.getSheets() //get all sheets

for (var i = 0; i < sheets.length; i++) {
    //get number of rows in excel table
    var rowCount = 0
    while (sheets[i].getCell(rowCount, 0) != null) {
        rowCount++
    }

    //get marked models
    for (var j = 1; j < rowCount; j++) {
        Context.writeStatus("1. Reading excel file row " + (j + 1) + "/" + rowCount)
        var valueTemp = sheets[i].getCell(j, 9).getCellValue()
        if (valueTemp.toUpperCase() == "ARCHIVE") {
            models.push(sheets[i].getCell(j, 2).getCellValue())
        }
    }
}

models = ArisData.Unique(models)
var check = checkModels(models)

if (check == true) {
    //UPDATE ATT ON MODELS TO DO
    for (var i = 0; i < models.length; i++) {
        var attValue_YES = ArisData.ActiveFilter().UserDefinedAttributeValueTypeNum("adde7a20-75f9-11e0-61d8-00237d347a8a", "adde7a22-75f9-11e0-61d8-00237d347a8a")
        var archivingStatusAtt = models[i].Attribute(ArisData.ActiveFilter().UserDefinedAttributeTypeNum("adde7a20-75f9-11e0-61d8-00237d347a8a"), nLocale).setValue(attValue_YES)
    }
}


function checkModels(models) {
    for (var i = 0; i < models.length; i++) {
        Context.writeStatus("2. Analyzing models " + (i + 1) + "/" + (models.length))
        var checkFlag = selectedDb[0].FindGUID(models[i])

        if (checkFlag.IsValid() == false) {
            Dialogs.MsgBox(models[i] + " Model GUID is not found in the database. Excel file is not valid", Constants.MSGBOX_ICON_ERROR | Constants.MSGBOX_BTN_OK + 512, "Excel File Error")
            return false;
        }
    }

    return true;
}

function getExcelFile() {
    var sdefname = ""
    sdefext = __toString("*.xls!!Excel|*.xls; *.xlsx||")
    var sdefdir = ""
    var stitle = "Chose excel file"

    var files = Dialogs.BrowseForFiles(sdefname, sdefext, sdefdir, stitle, 0)

    var excelFile = Context.getExcelReader(files[0].getData())

    return excelFile;
}