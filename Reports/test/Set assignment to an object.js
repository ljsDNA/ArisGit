var username = "system";
var password = "manager";
var nLocale = Context.getSelectedLanguage();
var selectedObject = ArisData.getSelectedObjDefs();
var filter = ArisData.ActiveFilter();
var userDb = ArisData.getActiveDatabase();
var db = ArisData.openDatabase( userDb.Name(-1), username, password, filter.GUID(), nLocale);

main();

function main() {
   
    var selectedModel = Dialogs.BrowseArisItems("Select a model", "Select a model for assignment", "(servername is obsolete)", db.Name(-1), Constants.CID_MODEL, [], "");

    var object = db.FindGUID(selectedObject[0].GUID());
    var model = db.FindOID(selectedModel);
   
    var result = object.CreateAssignment(model);
}