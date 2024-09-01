/**
 * Copyright (C) 1992-2023 Software AG, Darmstadt, Germany and/or Software AG USA Inc., Reston, VA, USA,
 * and/or its subsidiaries and/or its affiliates and/or their licensors.
 *
 * Use, reproduction, transfer, publication or disclosure is prohibited
 * except as specifically provided for in your License Agreement with Software AG.
 *
 * Version: 10.0.22.0.3295151
 *
 * IMPORTANT NOTE:
 *     Please note that this is a standard script provided with the product.
 *     Any changes you make to this file will be overwritten during a product update and thus be irrecoverably lost.
 *     If you want to adapt this script according to your individual needs, we urgently recommend that you create a copy of this file
 *     and add your changes to the copy. The copied file will not be overwritten by a product update.
 *     After a product update, it is advisable that you check your copied file against the updated version of the original file
 *     and add all relevant changes or fixes to your copy.
 */

// BLUE-17650 - Import/Usage of 'convertertools.js' removed 

__usertype_toptiontype = function() {
    this.ncontext = 0;                // 0: database, 1: selected groups, 2: selected groups and child groups
    this.breplaceingroup = false;     // Search/replace group attributes
    this.breplaceinmodel = false;     // Search/replace model attributes
    this.breplaceinobjdef = false;    // Search/replace ObjDef attributes
    this.breplaceincxndef = false;    // Search/replace CxnDef attributes
    this.nattrtype = 0;
    this.ssearch = "";
    this.sreplace = "";
    this.bsearchexactly = false;
    this.bcasesensitive = false;
    this.bprotocol = false;
}

var g_omethodfilter = ArisData.getActiveDatabase().ActiveFilter();
var g_nloc = Context.getSelectedLanguage(); 

var g_ooutfile = null; 

function main()
{
  var toption = new __holder(new __usertype_toptiontype()); 

  if (calldialogs(toption)) {

    // Protocol
    if (toption.value.bprotocol) {
      g_ooutfile = Context.createOutputObject(Context.getSelectedFormat(), Context.getSelectedFile());
      g_ooutfile.Init(g_nloc);

      g_ooutfile.DefineF("Out", getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);

      g_ooutfile.OutputLnF(Context.getScriptInfo(Constants.SCRIPT_TITLE), "Out");
      g_ooutfile.OutputLnF("", "Out");
      g_ooutfile.OutputField(Constants.FIELD_DATE, "Arial", 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
      g_ooutfile.Output(" ", "Arial", 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
      g_ooutfile.OutputField(Constants.FIELD_TIME, "Arial", 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
      g_ooutfile.OutputLnF("", "Out");
      g_ooutfile.OutputLnF("", "Out");
      g_ooutfile.OutputLnF((getString("TEXT2") + ArisData.getActiveDatabase().ServerName()), "Out");
      g_ooutfile.OutputLnF((getString("TEXT3") + ArisData.getActiveDatabase().Name(g_nloc)), "Out");
      g_ooutfile.OutputLnF((getString("TEXT4") + ArisData.getActiveUser().Name(g_nloc)), "Out");
      g_ooutfile.OutputLnF("", "Out");
      g_ooutfile.OutputLnF(((getString("TEXT5") + " ") + toption.value.ssearch), "Out");
      g_ooutfile.OutputLnF(((getString("TEXT6") + " ") + toption.value.sreplace), "Out");
      g_ooutfile.OutputLnF("", "Out");
    }

    // Replace selected attributes
    if (toption.value.nattrtype > 0) {
      searchreplaceselectedattributes(toption);

      // Replace all maintained attributes
    }
    else {
      searchreplacemaintainedattributes(toption);

    }

    // Protocol
    if (toption.value.bprotocol) {
      g_ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());

      g_ooutfile = null;
    }
    else {
      Context.setScriptError(Constants.ERR_NOFILECREATED);
    }
  }
  g_omethodfilter = null;
}


function searchreplaceselectedattributes(toption)
{
  var ogrouplist = new __holder(null); 
  var omodellist = null; 
  var oobjdeflist = null; 
  var ocxndeflist = null; 

  var ncompare = 0; 
  var i = 0; 
  var bchildgroups = new __holder(false); 

  // --- Get lists to replace ---

  switch(toption.value.ncontext) {
    // Context 0: database, 1: selected groups, 2: selected groups and child groups
    case 0:
      // Groups...
      if (toption.value.breplaceingroup) {
        ogrouplist.value = finditemlist2replace(toption, Constants.SEARCH_GROUP);
      }
      // Models...
      if (toption.value.breplaceinmodel) {
        omodellist = finditemlist2replace(toption, Constants.SEARCH_MODEL);
      }
      // ObjDefs...
      if (toption.value.breplaceinobjdef) {
        oobjdeflist = finditemlist2replace(toption, Constants.SEARCH_OBJDEF);
      }
      // Cxns...
      if (toption.value.breplaceincxndef) {
        ocxndeflist = finditemlist2replace(toption, Constants.SEARCH_CXNDEF);
      }

    break;
    case 1:
    case 2:
      // Groups...
      ogrouplist.value = new Array();
      if (toption.value.ncontext == 1) {
        bchildgroups.value = false;
      } else {
        bchildgroups.value = true;
      }

      for ( i = 0 ; i < ArisData.getSelectedGroups().length ; i++ ){
        getlistof_groups(ogrouplist, ArisData.getSelectedGroups()[i], bchildgroups);
        // Get selected groups (and child groups)
      }

      // Models...
      if (toption.value.breplaceinmodel) {
        omodellist = new Array();
        getlistof_models(omodellist, ogrouplist.value);
        // Get models of selected context
      }

      // ObjDefs...
      if (toption.value.breplaceinobjdef) {
        oobjdeflist = new Array();
        getlistof_objects(oobjdeflist, ogrouplist.value);
        // Get ObjDefs of selected context
      }

      // Cxns...
      if (toption.value.breplaceincxndef) {
        if (! (toption.value.breplaceinobjdef)) {
          oobjdeflist = new Array();
          getlistof_objects(oobjdeflist, ogrouplist.value);
          // (Get ObjDefs of selected context)
        }

        ocxndeflist = new Array();
        getlistof_cxns(ocxndeflist, oobjdeflist);
        ocxndeflist = ArisData.Unique(ocxndeflist);            // UNIQUE !
        // Get Cxns of selected context
      }

    break;
  }

  // --- Replace selected attributes in lists ---

  // Groups...
  if (toption.value.breplaceingroup) {
    outputinfo((getString("TEXT7") + "..."), toption);
    replaceselectedattributes(toption, ogrouplist.value);
  }

  // Models...
  if (toption.value.breplaceinmodel) {
    outputinfo((getString("TEXT8") + "..."), toption);
    replaceselectedattributes(toption, omodellist);
  }

  // ObjDefs...
  if (toption.value.breplaceinobjdef) {
    outputinfo((getString("TEXT9") + "..."), toption);
    replaceselectedattributes(toption, oobjdeflist);
  }

  // Cxns...
  if (toption.value.breplaceincxndef) {
    outputinfo((getString("TEXT10") + "..."), toption);
    replaceselectedattributes(toption, ocxndeflist);
  }

  ogrouplist.value = null;
  omodellist = null;
  oobjdeflist = null;
  ocxndeflist = null;
}


function finditemlist2replace(toption, nsearchkind)
{
  var __functionResult = null;

  var ssearch = ""; 
  var ncompare = 0; 

  if (toption.value.bsearchexactly) {
      ssearch = "" + toption.value.ssearch;		// BLUE-14582 - Search exactly				
  } else {
      ssearch = "*" + toption.value.ssearch + "*";
  }

  if (toption.value.bcasesensitive) {
    ncompare = Constants.SEARCH_CMP_EQUAL | Constants.SEARCH_CMP_CASESENSITIVE | Constants.SEARCH_CMP_WILDCARDS;
  }
  else {
    ncompare = Constants.SEARCH_CMP_EQUAL | Constants.SEARCH_CMP_WILDCARDS;
  }
    // No ItemType selected: -1
  __functionResult = ArisData.getActiveDatabase().Find(nsearchkind, -1, toption.value.nattrtype, g_nloc, ssearch, ncompare);

  return __functionResult;
}


function replaceselectedattributes(toption, oitemlist)
{
  var oitem = null; 
  var oattribute = null; 

  var ncompare = 0; 

  if (oitemlist.length > 0) {
    for (var i = 0 ; i < oitemlist.length ; i++ ){
      oitem = oitemlist[i];
      oattribute = oitem.Attribute(toption.value.nattrtype, g_nloc);

      replaceattribute(toption, oitem, oattribute);

      oitem = null;
      oattribute = null;
    }
  }
}


function searchreplacemaintainedattributes(toption)
{
  var ogrouplist = new __holder(null); 
  var omodellist = null; 
  var oobjdeflist = null; 
  var ocxndeflist = null; 

  var ncompare = 0; 
  var i = 0; 
  var bchildgroups = new __holder(false); 

  // --- Get lists to replace ---

  switch(toption.value.ncontext) {
    // Context 0: database, 1: selected groups, 2: selected groups and child groups
    case 0:
      // Groups...
      ogrouplist.value = new Array();
      getlistof_groups(ogrouplist, ArisData.getActiveDatabase().RootGroup(), new __holder(true));
      // Get all groups of database

    break;
    case 1:
    case 2:
      // Groups...
      ogrouplist.value = new Array();
      if (toption.value.ncontext == 1) {
        bchildgroups.value = false;
      }
      else {
        bchildgroups.value = true;
      }

      var selGroups = ArisData.getSelectedGroups();
      for ( i = 0 ; i < selGroups.length ; i++ ){
        getlistof_groups(ogrouplist, selGroups[i], bchildgroups);
        // Get selected groups (and child groups)
      }

    break;
  }

  // Models...
  if (toption.value.breplaceinmodel) {
    omodellist = new Array();
    getlistof_models(omodellist, ogrouplist.value);
    // Get models of selected context
  }
  // ObjDefs...
  if (toption.value.breplaceinobjdef) {
    oobjdeflist = new Array();
    getlistof_objects(oobjdeflist, ogrouplist.value);
    // Get ObjDefs of selected context
  }
  // Cxns...
  if (toption.value.breplaceincxndef) {
    if (! (toption.value.breplaceinobjdef)) {
      oobjdeflist = new Array();
      getlistof_objects(oobjdeflist, ogrouplist.value);
      // (Get ObjDefs of selected context)
    }

    ocxndeflist = new Array();
    getlistof_cxns(ocxndeflist, oobjdeflist);
    // Get Cxns of selected context
  }

  // --- Replace maintained attributes in lists ---

  // Groups...
  if (toption.value.breplaceingroup) {
    outputinfo((getString("TEXT7") + "..."), toption);
    replacemaintainedattributes(toption, ogrouplist.value);
  }
  // Models...
  if (toption.value.breplaceinmodel) {
    outputinfo((getString("TEXT8") + "..."), toption);
    replacemaintainedattributes(toption, omodellist);
  }
  // ObjDefs...
  if (toption.value.breplaceinobjdef) {
    outputinfo((getString("TEXT9") + "..."), toption);
    replacemaintainedattributes(toption, oobjdeflist);
  }
  // Cxns...
  if (toption.value.breplaceincxndef) {
    outputinfo((getString("TEXT10") + "..."), toption);
    replacemaintainedattributes(toption, ocxndeflist);
  }

  ogrouplist.value = null;
  omodellist = null;
  oobjdeflist = null;
  ocxndeflist = null;
}


function replacemaintainedattributes(toption, oitemlist)
{
  var oitem = null; 
  var oattributelist = null; 
  var oattribute = null; 

  if (oitemlist.length > 0) {
    for (var i = 0 ; i < oitemlist.length ; i++ ){
      oitem = oitemlist[i];
      oattributelist = oitem.AttrList(g_nloc);

      if (oattributelist.length > 0) {
        for (var j = 0 ; j < oattributelist.length ; j++ ){
          oattribute = oattributelist[j];

          if (checkattrbasetype(oattribute.TypeNum())) {
          // Check attr base type
            if (checkattreditflag(oattribute.TypeNum())) {
            // Check edit flag

              replaceattribute(toption, oitem, oattribute);
            }
          }
          oattribute = null;
        }
      }
      oitem = null;
      oattributelist = null;
    }
  }
}


function replaceattribute(toption, oitem, oattribute)
{
    var sname = oitem.Name(g_nloc);     // Name of item
    
    switch(oitem.KindNum()) {
        // "Path" of item
        case Constants.CID_GROUP:
            if (oitem.TypeNum() == Constants.OT_GROUP) {        // BLUE-6789 - check whether ARIS group (or UML group)
                var spath = getString("TEXT11") + oitem.Path(g_nloc) + ")";
            } else {
                var spath = getString("TEXT11") + oitem.Group().Path(g_nloc) + ")";
            }
            break;
        case Constants.CID_CXNDEF:
            var spath = formatstring3(getString("TEXT12"), oitem.ActiveType(), oitem.SourceObjDef().Name(g_nloc), oitem.TargetObjDef().Name(g_nloc));
            break;
        default:
            var spath = getString("TEXT11") + oitem.Group().Path(g_nloc) + ")";
    }
    
    var oldValue = ""+oattribute.GetValue(false);      // value to replace

    var pattern = updatePattern(toption.value.ssearch);                     // Anubis 514349, Call-ID 263961
    var modifiers = toption.value.bcasesensitive ? "g" : "gi";
    var regExp = new RegExp(pattern, modifiers);
    var newString = ""+toption.value.sreplace;
    
    var newValue = oldValue.replace(regExp, newString);
    
    if (StrComp(oldValue, newValue) != 0) {
        // Replace attribute value
        if (oattribute.SetValue(newValue, 0)) {
            var sinfo = "    " + sname + spath + " : " + oattribute.Type();
            outputinfo(sinfo, toption);
            // oitem.Touch();
        } else {
            var sinfo = formatstring3(getString("TEXT13"), g_omethodfilter.ItemKindName(oitem.KindNum()), sname, oattribute.Type());    // BLUE-15226
            outputinfo(sinfo, toption);
        }
    }
    
    function updatePattern(sPattern) {
        sPattern = ""+sPattern;
        sPattern = sPattern.replace(/\\/g,"\\\\");
        sPattern = sPattern.replace(/\$/g,"\\\$");
        sPattern = sPattern.replace(/\./g,"\\\.");
        sPattern = sPattern.replace(/\+/g,"\\\+");
        sPattern = sPattern.replace(/\*/g,"\\\*");
        sPattern = sPattern.replace(/\^/g,"\\\^");
        sPattern = sPattern.replace(/\?/g,"\\\?");
        sPattern = sPattern.replace(/\(/g,"\\\(");
        sPattern = sPattern.replace(/\)/g,"\\\)");
        sPattern = sPattern.replace(/\[/g,"\\\[");
        sPattern = sPattern.replace(/\]/g,"\\\]");
        sPattern = sPattern.replace(/\{/g,"\\\{");
        sPattern = sPattern.replace(/\}/g,"\\\}");
        return sPattern;
    }    
}


function createattrtypelist(toption, sattrtypelist, nattrtypelist)
{
  var AttrType_Set = new java.util.HashSet();
  
  var nAttrTypes;
  var nAttrType;
  
  if (toption.breplaceingroup) {            
      nAttrTypes = g_omethodfilter.AttrTypes(Constants.CID_GROUP);          // Groups...
      for (var i= 0; i < nAttrTypes.length; i++) {
          nAttrType = new java.lang.Integer(nAttrTypes[i]);

          if (checkattrbasetype(nAttrType)) {          
            AttrType_Set.add(nAttrType);                                      // Correct base type and edit flag?
          }
      }
  }    
    
  if (toption.breplaceinmodel) {
      nAttrTypes = g_omethodfilter.AttrTypes(Constants.CID_MODEL);          // Models...
      for (var i= 0; i < nAttrTypes.length; i++) {
          nAttrType = new java.lang.Integer(nAttrTypes[i]);

          if (checkattrbasetype(nAttrType)) {          
            AttrType_Set.add(nAttrType);                                      // Correct base type and edit flag?
          }
      }
  }

  if (toption.breplaceinobjdef) {
      nAttrTypes = g_omethodfilter.AttrTypes(Constants.CID_OBJDEF);          // ObjDefs...
      for (var i= 0; i < nAttrTypes.length; i++) {
          nAttrType = new java.lang.Integer(nAttrTypes[i]);

          if (checkattrbasetype(nAttrType)) {          
            AttrType_Set.add(nAttrType);                                      // Correct base type and edit flag?
          }
      }
  }

  if (toption.breplaceincxndef) {
      nAttrTypes = g_omethodfilter.AttrTypes(Constants.CID_CXNDEF);          // ObjDefs...
      for (var i= 0; i < nAttrTypes.length; i++) {
          nAttrType = new java.lang.Integer(nAttrTypes[i]);

          if (checkattrbasetype(nAttrType)) {          
            AttrType_Set.add(nAttrType);                                      // Correct base type and edit flag?
          }
      }
  }
    
  nattrtypelist.value = AttrType_Set.toArray();
  nattrtypelist.value.sort(sortByName);

  sattrtypelist.value = new Array(nattrtypelist.value.length);
  for (i = 0 ; i < sattrtypelist.value.length; i++ ){
    sattrtypelist.value[i] = g_omethodfilter.AttrTypeName(nattrtypelist.value[i]) + " (" + nattrtypelist.value[i] + ")";
  }
}

var collator = function() {
    try {
        var langList = ArisData.getActiveDatabase().LanguageList();
        if (langList.length == 0) return null;
        
        var locale = langList[0].convertLocale(g_nloc).getLocale();
        return java.text.Collator.getInstance(locale); 
    } catch(e) {
        return null;
    }

}();

function sortByName(a, b) {
    var s1 = new java.lang.String(g_omethodfilter.AttrTypeName(a));
    var s2 = new java.lang.String(g_omethodfilter.AttrTypeName(b));
    
    if (collator != null) {
        return collator.compare(s1, s2);
    }
    return s1.compareToIgnoreCase(s2);
}


function checkattrbasetype(nattrtype)
{
  var __functionResult = false;

  switch(g_omethodfilter.AttrBaseType(nattrtype)) {
    case Constants.ABT_BITMAP:
    case Constants.ABT_BLOB:
    case Constants.ABT_BOOL:
    case Constants.ABT_COMBINED:
    case Constants.ABT_DATE:
    case Constants.ABT_ITEMTYPE:
    case Constants.ABT_FOREIGN_ID:
    case Constants.ABT_LONGTEXT:
    case Constants.ABT_TIME:
    case Constants.ABT_TIMESPAN:
    case Constants.ABT_TIMESTAMP:
    case Constants.ABT_VALUE:

      __functionResult = false;
    break;
    default:

      __functionResult = true;
    }

  return __functionResult;
}


function checkattreditflag(nattrtype)
{
  var __functionResult = false;

  var nattrprop = 0; 
  nattrprop = g_omethodfilter.AttrProperties(nattrtype);

  if ((nattrprop && 2)) {
    // Attribute is NOT write protected
    __functionResult = true;
  }
  else {
    __functionResult = false;
  }

  return __functionResult;
}


function calldialogs(toption)
{
  var __functionResult = false;

  var bdialogsok = false; 
  var smsgtext = ""; 

  bdialogsok = false;

  if (dialog_context(toption)) {
  // Context dialog
    if (dialog_select(toption)) {
    // Select dialog
      if (dialog_search(toption)) {
      // Search dialog

        smsgtext = getString("TEXT14") + "\r" + getString("TEXT15");

        if (        Dialogs.MsgBox(smsgtext, Constants.MSGBOX_BTN_OKCANCEL | Constants.MSGBOX_ICON_QUESTION, getString("TEXT16")) == Constants.MSGBOX_RESULT_OK) {

          bdialogsok = true;
        }
      }
    }
  }

  if (! (bdialogsok)) {
    Context.setScriptError(Constants.ERR_CANCEL);
  }

  __functionResult = bdialogsok;

  return __functionResult;
}


function outputinfo(sinfo, toption)
{
  Context.writeOutput(sinfo);

  // Protocol
  if (toption.value.bprotocol) {
    g_ooutfile.OutputLnF(sinfo, "Out");
  }
}


function dialog_context(toption)
{
  var __functionResult = false;

  var nuserdlg = 0;   // Variable for the user dialog box

  var userdialog = Dialogs.createNewDialogTemplate(450, 250, getString("TEXT17"), "dialogfunc_context");
  // %GRID:10,7,1,1
  userdialog.GroupBox(20, 10, 420, 230, getString("TEXT18"), "GroupBox1");
  userdialog.OptionGroup("Options1");
  userdialog.OptionButton(40, 50, 300, 15, getString("TEXT19"), "OptionButton1");
  userdialog.OptionButton(40, 70, 300, 15, getString("TEXT20"), "OptionButton2");
  userdialog.CheckBox(70, 90, 280, 15, getString("TEXT21"), "CheckBox1");
  userdialog.Text(40, 30, 320, 15, getString("TEXT22"), "Text1");
  userdialog.GroupBox(33, 115, 390, 95, getString("TEXT23"), "GroupBox2");
  userdialog.CheckBox(70, 125, 200, 15, getString("TEXT24"), "CheckBox2");
  userdialog.CheckBox(70, 165, 200, 15, getString("TEXT25"), "CheckBox4");
  userdialog.CheckBox(70, 145, 200, 15, getString("TEXT26"), "CheckBox3");
  userdialog.CheckBox(70, 185, 200, 15, getString("TEXT27"), "CheckBox5");
  userdialog.OKButton();
  userdialog.CancelButton();
  userdialog.HelpButton("HID_3f064f40_eae8_11d8_12e0_9d2843560f51_dlg_01.hlp");
  
  var dlg = Dialogs.createUserDialog(userdialog); 

  // Read dialog settings from config
  var sSection = "SCRIPT_3f064f40_eae8_11d8_12e0_9d2843560f51";  
  ReadSettingsDlgValue(dlg, sSection, "Options1", 0);  
  ReadSettingsDlgValue(dlg, sSection, "CheckBox1", 0);  
  ReadSettingsDlgValue(dlg, sSection, "CheckBox2", 0);  
  ReadSettingsDlgValue(dlg, sSection, "CheckBox3", 0);  
  ReadSettingsDlgValue(dlg, sSection, "CheckBox4", 0);  
  ReadSettingsDlgValue(dlg, sSection, "CheckBox5", 0);  
  
  nuserdlg = Dialogs.show( __currentDialog = dlg);   // Show dialog (wait for ok)
  
  // Write dialog settings to config  
  if (nuserdlg != 0) {
      WriteSettingsDlgValue(dlg, sSection, "Options1");  
      WriteSettingsDlgValue(dlg, sSection, "CheckBox1");  
      WriteSettingsDlgValue(dlg, sSection, "CheckBox2");  
      WriteSettingsDlgValue(dlg, sSection, "CheckBox3");  
      WriteSettingsDlgValue(dlg, sSection, "CheckBox4");  
      WriteSettingsDlgValue(dlg, sSection, "CheckBox5");  
  }

  // Set context
  // 0: database, 1: selected groups, 2: selected groups and child groups
  if (dlg.getDlgValue("Options1") == 0) {
    toption.value.ncontext = 0;
  }
  else {
    if (dlg.getDlgValue("CheckBox1") == 0) {
      toption.value.ncontext = 1;
    }
    else {
      toption.value.ncontext = 2;
    }
  }

  // Items for search/replace
  if (dlg.getDlgValue("CheckBox2") == 1) {
    toption.value.breplaceingroup = true;
  }
  else {
    toption.value.breplaceingroup = false;
  }

  if (dlg.getDlgValue("CheckBox3") == 1) {
    toption.value.breplaceinmodel = true;
  }
  else {
    toption.value.breplaceinmodel = false;
  }

  if (dlg.getDlgValue("CheckBox4") == 1) {
    toption.value.breplaceinobjdef = true;
  }
  else {
    toption.value.breplaceinobjdef = false;
  }

  if ((dlg.getDlgValue("Options1") == 0 && dlg.getDlgValue("CheckBox5") == 1)) {
    toption.value.breplaceincxndef = true;
  }
  else {
    toption.value.breplaceincxndef = false;
  }

  if (nuserdlg == 0) {
    __functionResult = false;
  }
  else {
    __functionResult = true;
  }

  return __functionResult;
}


function dialogfunc_context(dlgitem, action, suppvalue)
{
  var __functionResult = false;

  switch(action) {
    // Initialization of the dialog.
    case 1:
      var bEnable_CheckBox1 = __currentDialog.getDlgValue("Options1") == 1;
      var bEnable_CheckBox5 = __currentDialog.getDlgValue("Options1") == 0;      
      __currentDialog.setDlgEnable("CheckBox1", bEnable_CheckBox1);
      __currentDialog.setDlgEnable("CheckBox5", bEnable_CheckBox5);      

      // A dialog item is selected in the dialog box.
    break;
    case 2:
      // Which DialogElement was selected?
      switch(dlgitem) {
        case "Options1":
          switch(suppvalue) {
            case 0:
              __currentDialog.setDlgEnable("CheckBox1", false);
              __currentDialog.setDlgEnable("CheckBox5", true);

            break;
            case 1:
              __currentDialog.setDlgEnable("CheckBox1", true);
              __currentDialog.setDlgEnable("CheckBox5", false);
            break;
          }

        break;
      }

    break;
  }

  return __functionResult;
}


function dialog_select(toption)
{
  var __functionResult = false;

  var sattrtypelist = new __holder(new Array()); 
  var nattrtypelist = new __holder(new Array()); 

 // Create attribute type list
  createattrtypelist(toption.value, sattrtypelist, nattrtypelist);
  
  var nuserdlg = 0;   // Variable for the user dialog box

  var userdialog = Dialogs.createNewDialogTemplate(450, 250, getString("TEXT28"), "dialogfunc_select");
  // %GRID:10,7,1,1
  userdialog.GroupBox(20, 10, 420, 100, getString("TEXT29"), "GroupBox1");
  userdialog.Text(40, 35, 370, 14, getString("TEXT30"), "Text1");
  userdialog.OptionGroup("Options2");
  userdialog.OptionButton(40, 55, 370, 15, getString("TEXT31"), "OptButton1");
  userdialog.OptionButton(40, 75, 140, 15, getString("TEXT32"), "OptButton2");
  userdialog.DropListBox(190, 74, 230, 150, sattrtypelist.value, "AttrTypeSelect");
  userdialog.OKButton();
  userdialog.CancelButton();
  userdialog.HelpButton("HID_3f064f40_eae8_11d8_12e0_9d2843560f51_dlg_02.hlp");  

  var dlg = Dialogs.createUserDialog(userdialog);
  
  // Read dialog settings from config
  var sSection = "SCRIPT_3f064f40_eae8_11d8_12e0_9d2843560f51";  
  ReadSettingsDlgValue(dlg, sSection, "Options2", 0);
  ReadSettingsListBoxByNumber(dlg, sSection, "AttrTypeSelect", 0, nattrtypelist.value);
  
  var smsgtext = ""; 
  var binputok = false; 

  nuserdlg = 1;
  binputok = false;

  while (! (binputok || nuserdlg == 0)) {
    nuserdlg = Dialogs.show( __currentDialog = dlg);
    // Show dialog (wait for ok)

    if (dlg.getDlgValue("Options2") == 0) {
      toption.value.nattrtype = - 1;
      // All attributes selected
      binputok = true;

    }
    else {
      // Attribute type selected
      if (dlg.getDlgValue("AttrTypeSelect") >= 0) {
        toption.value.nattrtype = nattrtypelist.value[dlg.getDlgValue("AttrTypeSelect")];
        binputok = true;
      }
      else {
        binputok = false;
                Dialogs.MsgBox(getString("TEXT33"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, getString("TEXT16"));
      }
    }
  }

  if (nuserdlg == 0) {
    __functionResult = false;
  }
  else {
    __functionResult = true;
    
    // Write dialog settings to config  
    WriteSettingsDlgValue(dlg, sSection, "Options2");  
    WriteSettingsListBoxByNumber(dlg, sSection, "AttrTypeSelect", nattrtypelist.value);
  }

  return __functionResult;
}


function dialogfunc_select(dlgitem, action, suppvalue)
{
    var __functionResult = false;
    
    switch(action) {
        case 1:
            var bEnable = (__currentDialog.getDlgValue("Options2") == 1);
            __currentDialog.setDlgEnable("AttrTypeSelect", bEnable);
            break;
        case 2:
            switch(dlgitem) {
                case "Options2":
                    switch(suppvalue) {
                        case 0:
                            __currentDialog.setDlgEnable("AttrTypeSelect", false);
                            break;
                        case 1:
                            __currentDialog.setDlgEnable("AttrTypeSelect", true);
                            break;
                    }
                    break;
            }
            break;
    }
    return __functionResult;
}

function dialog_search(toption)
{
    var __functionResult = false;
    
    var nuserdlg = 0;   // Variable for the user dialog box
    
    var userdialog = Dialogs.createNewDialogTemplate(450, 250, getString("TEXT34"));
    // %GRID:10,7,1,1
    userdialog.Text(20, 15, 110, 14, getString("TEXT5"), "Text1");
    userdialog.Text(20, 45, 110, 14, getString("TEXT6"), "Text2");
    userdialog.TextBox(130, 12, 310, 21, "SearchText");
    userdialog.TextBox(130, 43, 310, 21, "ReplaceText");
    userdialog.CheckBox(140, 75, 300, 15, getString("TEXT39"), "CheckExact");         // BLUE-14582 - Search exactly
    userdialog.CheckBox(140, 95, 300, 15, getString("TEXT35"), "CheckCaseSens");
    userdialog.CheckBox(140, 115, 300, 15, getString("TEXT36"), "CheckProtocol");
    userdialog.OKButton();
    userdialog.CancelButton();
    userdialog.HelpButton("HID_3f064f40_eae8_11d8_12e0_9d2843560f51_dlg_03.hlp");
    
    var dlg = Dialogs.createUserDialog(userdialog); 
    var binputok = false; 
    
    // Read dialog settings from config
    var sSection = "SCRIPT_3f064f40_eae8_11d8_12e0_9d2843560f51";  
    ReadSettingsDlgValue(dlg, sSection, "CheckExact", 0);
    ReadSettingsDlgValue(dlg, sSection, "CheckCaseSens", 0);
    ReadSettingsDlgValue(dlg, sSection, "CheckProtocol", 0);
    
    nuserdlg = 1;
    binputok = false;
    
    while (! (binputok || nuserdlg == 0)) {
        dlg.setDlgText("SearchText", toption.value.ssearch);
        dlg.setDlgText("ReplaceText", toption.value.sreplace);
        
        nuserdlg = Dialogs.show( __currentDialog = dlg);
        // Show dialog (wait for ok).
        
        toption.value.bsearchexactly = dlg.getDlgValue("CheckExact") == 1;      // Search exactly
        toption.value.bcasesensitive = dlg.getDlgValue("CheckCaseSens") == 1;   // Case sensitive
        toption.value.bprotocol      = dlg.getDlgValue("CheckProtocol") == 1;   // Out protocol  
        
        toption.value.ssearch = dlg.getDlgText("SearchText");
        toption.value.sreplace = dlg.getDlgText("ReplaceText");
        
        if (! (nuserdlg == 0)) {
            if (toption.value.ssearch != "") {
                binputok = true;
            }
            else {
                binputok = false;
                Dialogs.MsgBox(getString("TEXT38"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_WARNING, getString("TEXT16"));
                // Out error text
            }
        }
    }
    
    if (nuserdlg == 0) {
        __functionResult = false;
    }
    else {
        __functionResult = true;
        
        // Write dialog settings to config     
        WriteSettingsDlgValue(dlg, sSection, "CheckExact");
        WriteSettingsDlgValue(dlg, sSection, "CheckCaseSens");
        WriteSettingsDlgValue(dlg, sSection, "CheckProtocol");
    }
    
    return __functionResult;
}


main();
