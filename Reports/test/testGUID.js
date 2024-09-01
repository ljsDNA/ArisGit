var nLocale = Context.getSelectedLanguage();
var oOutput = Context.createOutputObject();


var scriptAdminComponent = Context.getComponent("ScriptAdmin");
var aScriptComponentInfo = scriptAdminComponent.getScriptComponents();

var ComponentID_CommonFiles = aScriptComponentInfo[0].getComponentID();
var ComponentID_Reports = aScriptComponentInfo[1].getComponentID();

var reportSubFolders = scriptAdminComponent.getCategories(ComponentID_Reports, nLocale);

var listReportsAndImports = new Array();

var scriptInfo = scriptAdminComponent.getScriptInfo(1, ComponentID_Reports, "5d887e70-3074-11ee-6800-14abc506e5a5", nLocale);

oOutput.OutputTxt(nLocale);
oOutput.WriteReport();