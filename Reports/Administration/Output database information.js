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

/*************************************************************************************************************************************************************/ 
/* AGA-12165 To switch whether only users with assigned function rights or access rights in the database (= true) or all UMC-users (= false) are evaluated */
var g_bAssignedUsersOnly = true;
/*************************************************************************************************************************************************************/ 

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

// text constants:
// dialog text constants
var txtOutputOptionsDialogTitle = getString("TEXT1");
var txtFunctionRights           = getString("TEXT2");
var txtOutputFormatTable        = getString("TEXT3");
var txtOutputFormatText         = getString("TEXT4");
var txtLanguages                = getString("TEXT5");
var txtFonts                    = getString("TEXT7");
var txtFontDescriptions         = getString("TEXT6");
var txtFontUsage                = getString("TEXT62");

// output text constants
var txtUserGroup                = getString("TEXT8");
var txtUser                     = getString("TEXT9");
var txtFunctionRightsName       = getString("TEXT10");
var txtFontFormat               = getString("TEXT11");
var txtFont                     = getString("TEXT12");
var txtStandard                 = getString("TEXT13");
var txtSize                     = getString("TEXT14");
var txtColor                    = getString("TEXT15");
var txtStyle                    = getString("TEXT16");
var txtCharset                  = getString("TEXT17");
var txtUsage                    = getString("TEXT63");
var txtDescription              = getString("TEXT18");
var txtLongname                 = getString("TEXT19");
var txtLegend                   = getString("TEXT20");

// font style text constants
var txtStyleBold                = getString("TEXT21");
var txtStyleBoldName            = getString("TEXT22");
var txtStyleItalic              = getString("TEXT23");
var txtStyleItalicName          = getString("TEXT24");
var txtStyleUnderline           = getString("TEXT25");
var txtStyleUnderlineName       = getString("TEXT26");
var txtStyleStrikethrough       = getString("TEXT_STRIKE_ABBR");
var txtStyleStrikethroughName   = getString("TEXT_STRIKE_NAME");
var txtStyleNormal              = getString("TEXT27");
var txtStyleNormalName          = getString("TEXT28");


// color text constants
var txtColorBlack               = getString("TEXT29");
var txtColorHazel               = getString("TEXT30");
var txtColorGreen               = getString("TEXT31");
var txtColorOlive               = getString("TEXT32");
var txtColorMarine              = getString("TEXT33");
var txtColorPurple              = getString("TEXT34");
var txtColorTeal                = getString("TEXT35");
var txtColorGrey                = getString("TEXT36");
var txtColorSilver              = getString("TEXT37");
var txtColorRed                 = getString("TEXT38");
var txtColorGrass               = getString("TEXT39");
var txtColorYellow              = getString("TEXT40");
var txtColorBlue                = getString("TEXT41");
var txtColorPink                = getString("TEXT42");
var txtColorLightBlue           = getString("TEXT43");
var txtColorWhite               = getString("TEXT44");

// charset text constants
var txtCharsetAnsi              = getString("TEXT45");
var txtCharsetSymbol            = getString("TEXT46");
var txtCharsetShiftjis          = getString("TEXT47");
var txtCharsetGreek             = getString("TEXT48");
var txtCharsetTurkish           = getString("TEXT49");
var txtCharsetHebrew            = getString("TEXT50");
var txtCharsetSimpleArabic      = getString("TEXT51");
var txtCharsetTraditArabic      = getString("TEXT52");
var txtCharsetUserArabic        = getString("TEXT53");
var txtCharsetUserHebrew        = getString("TEXT54");
var txtCharsetCyrillic          = getString("TEXT55");
var txtCharsetEasternEuropean   = getString("TEXT56");
var txtCharsetPC437             = getString("TEXT57");
var txtCharsetOEM               = getString("TEXT58");

var txtUnkown                   = getString("TEXT59");

/************************************************************************************/

var g_nloc = Context.getSelectedLanguage();

var actDatabase   = ArisData.getActiveDatabase();
var actFilter     = actDatabase.ActiveFilter();

var outfile = Context.createOutputObject();
outfile.DefineF("REPORT1", getString("TEXT60"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
outfile.DefineF("REPORT2", getString("TEXT60"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
outfile.DefineF("REPORT3", getString("TEXT60"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

// array holding function right attributes
var g_aFuncRights = ArisData.ActiveFilter().AttrTypesOfAttrGroup(Constants.AT_USR_PRIV_GRP, -1, -1, true, true).sort(sortAttrName);  // BLUE-13068

var dlgDBInfo;

/************************************************************************************/

function main()
{
  // dialog settings, default values
  var holder_nOptOutputFormat       = new __holder(0);
  var holder_bFunctionRights        = new __holder(true);
  var holder_bLanguages             = new __holder(true);
  var holder_bFonts                 = new __holder(true);
  var holder_bFontUsage             = new __holder(false);  
  var holder_bFontDescription       = new __holder(false);

  // show output options dialog
  var nDialogResult = showOutputOptionsDialog(holder_nOptOutputFormat,
                                              holder_bFunctionRights,
                                              holder_bLanguages,
                                              holder_bFonts,
                                              holder_bFontUsage,
                                              holder_bFontDescription);

  // check for cancel
  if(nDialogResult == 0) {
    Context.setScriptError(Constants.ERR_CANCEL);
    return;
  }

  // evaluate user settings
  var nOptOutputFormat      = holder_nOptOutputFormat.value;
  var bFunctionRights       = holder_bFunctionRights.value;
  var bLanguages            = holder_bLanguages.value;
  var bFonts                = holder_bFonts.value;
  var bFontUsage            = holder_bFontUsage.value;
  var bFontDescription      = holder_bFontDescription.value;


  // set report header/footer 
  setReportHeaderFooter(outfile, g_nloc, true, true, true);

  if(bFunctionRights) {
    var aColSizes = getColumnSizes();   
    outfile.OutputLn(getString("TEXT2") + ":", getString("TEXT60"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    writeFunctionRights(nOptOutputFormat, aColSizes);
  }

  if(bLanguages) {
    outfile.OutputLn(getString("TEXT5") + ":", getString("TEXT60"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    writeLanguages();
  }

  if(bFonts) {
    outfile.OutputLn(getString("TEXT7") + ":", getString("TEXT60"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    writeFonts(bFontUsage, bFontDescription);
  }

  outfile.WriteReport();
}


/**
 *  function writeFunctionRights
 *  writes function rights to output file using specified settings
 *  @param nOptOutputFormat output format
 *
 */
function writeFunctionRights(nOptOutputFormat, aColSizes)
{
    var bColored = false;   // variable to change background color of table rows    

    if(nOptOutputFormat==0) {
        outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        writeFunctionRightsHeader(aColSizes);
    }else if(nOptOutputFormat==1) {
        outfile.OutputLn("", getString("TEXT60"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 20);
    }

    var usergroups = getDbUserGroupList();  // AGA-12165
    usergroups = ArisData.sort(usergroups, Constants.AT_NAME_LGINDEP, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
        
    for (var k = 0; k < usergroups.length; k++) {
        var ocurrentusergroup = usergroups[k];
        writeUserGroup(ocurrentusergroup, nOptOutputFormat, bColored, aColSizes);
        bColored = !bColored;

        var ouserlist = ocurrentusergroup.UserList();
        ouserlist = ArisData.sort(ouserlist, Constants.AT_NAME_LGINDEP, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);

        for (var i = 0; i < ouserlist.length; i++) {
            var ocurruser = ouserlist[i];
            writeUser(ocurruser, nOptOutputFormat, bColored, aColSizes, 10);
            bColored = !bColored;
        }
    }
    
    if(nOptOutputFormat==0) {
        emptytabelrow(bColored, aColSizes); // empty line
    }
    bColored = !bColored;

    // Output all users that do not belong to one group.
    var oallusers = getDbUserList(); // AGA-12165
    oallusers = ArisData.sort(oallusers, Constants.AT_NAME_LGINDEP, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);
        
    for (var i = 0 ; i < oallusers.length; i++) {
        var oauser = oallusers[i];
        var ousergrouplist = getUserGroupsOfUser(oauser);
        if (ousergrouplist.length < 1) {
            writeUser(oauser, nOptOutputFormat, bColored, aColSizes, 0);        
            bColored = !bColored; // Change background color
        }
    }
    
    if(nOptOutputFormat==0) {
        outfile.EndTable("", 100, getString("TEXT60"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
    } 
    outfile.OutputLn("", getString("TEXT60"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 20);
}

function writeFunctionRightsHeader(aColSizes) {
    outfile.TableRow();
    outfile.TableCell(txtUserGroup, aColSizes[0], "Arial", 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    outfile.TableCell(txtUser, aColSizes[1], "Arial", 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    for(var i = 0; i < g_aFuncRights.length; i++) {
        // Function rights
        outfile.TableCell(" "+getFunctionRightName(g_aFuncRights[i]), aColSizes[2], "Arial", 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VCENTER | Constants.FMT_VERT_UP, 0);
    }
} 

/**
 *  function writeUserGroup
 *  writes user group to output file using specified settings
 *  @param ousergroup user group
 *  @param nOptOutputFormat output format
 *
 */
function writeUserGroup(ousergroup, nOptOutputFormat, bColored, aColSizes)
{
  var lstUserGroupRights = ousergroup.FunctionRights().sort(sortAttrName); 

  if(nOptOutputFormat==0) {    // output format table
    outfile.TableRow();
    outfile.TableCell(ousergroup.Name(g_nloc), aColSizes[0], getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    outfile.TableCell("", aColSizes[1], getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

    for(var i=0;i<g_aFuncRights.length;i++) {
      writeFunctionRight(lstUserGroupRights, g_aFuncRights[i], bColored, aColSizes[2]);
    }
  }

  else if(nOptOutputFormat==1) {    // output format text
    outfile.OutputLn(txtUserGroup+": "+ ousergroup.Name(g_nloc), getString("TEXT60"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);

    if (lstUserGroupRights.length > 0) {
      outfile.OutputLn(txtFunctionRightsName, getString("TEXT60"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 5);
      for ( var i = 0; i < lstUserGroupRights.length ; i++ ) {
        outfile.OutputLn(getFunctionRightName(lstUserGroupRights[i]), getString("TEXT60"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 10);
      }
      outfile.OutputLn("", getString("TEXT60"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 20);
    }
  }

}



/**
 *  function writeUser
 *  writes user to output file using specified settings
 *  @param ouser user
 *  @param nOptOutputFormat output format
 *
 */
function writeUser(ouser, nOptOutputFormat, bColored, aColSizes, indent)
{
  var lstUserRights = ouser.FunctionRights().sort(sortAttrName); 

  if(nOptOutputFormat==0) {    // output format table
    outfile.TableRow();
    outfile.TableCell("", aColSizes[0], getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    outfile.TableCell(ouser.Name(g_nloc), aColSizes[1], getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    
    for(var i=0;i<g_aFuncRights.length;i++) {
      writeFunctionRight(lstUserRights, g_aFuncRights[i], bColored, aColSizes[2]);
    }
  }

  else if(nOptOutputFormat==1) { // output format text
    outfile.OutputLn(txtUser+": " + ouser.Name(g_nloc), getString("TEXT60"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, indent);

    if (lstUserRights.length > 0) {
      outfile.OutputLn(txtFunctionRightsName, getString("TEXT60"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, indent+5);
      for ( var i = 0; i < lstUserRights.length ; i++ ){
        outfile.OutputLn(getFunctionRightName(lstUserRights[i]), getString("TEXT60"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, indent+10);
      }
      outfile.OutputLn("", getString("TEXT60"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    }
  }
}



/**
 *  function writeLanguages
 *  writes languages to output file using specified settings
 */
function writeLanguages()
{
  outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);

  outfile.TableRow();
  outfile.TableCell(getString("TEXT61"), 100, getString("TEXT60"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
  var bColored = false;   // variable to change background color of table rows
  
  var olanguagelist = ArisData.sort(actDatabase.LanguageList(), Constants.AT_NAME, g_nloc); 
  for ( i = 0 ; i < olanguagelist.length; i++ ) {
    var olanguage = olanguagelist[i];
    if (olanguage.LocaleId() != 0) {
      outfile.TableRow();
      outfile.TableCell(getLanguageName(olanguage), 100, getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      bColored = !bColored; // Change background color
    }
  }

  // Space
  outfile.EndTable("", 100, getString("TEXT60"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
  outfile.OutputLn("", getString("TEXT60"), 12, Constants.C_BLUE, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_UNDERLINE | Constants.FMT_LEFT, 0);
}

/**
 *  function writeFonts
 *  writes fonts to output file using specified settings
 *  @param bUsage flag for writing font usage
 *  @param bDescription flag for writing font description and long name
 */
function writeFonts(bUsage, bDescription)
{
  var nwidth1 = 16; 
  var nwidth2 = 12; 
  var nwidth3 = 12;  

  if (bUsage && bDescription) {
    nwidth1 = 12;
    nwidth2 = 7;
  } else {
      if (bDescription) {
        nwidth1 = 12;
        nwidth2 = 9;
        nwidth3 = 13;    
      }
      if (bUsage) {
        nwidth1 = 15;
        nwidth2 = 10;
      }
  }

  outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);

  var colHeadings = new Array(txtFontFormat, txtFont, txtStandard, txtSize, txtColor, txtStyle, txtCharset);
  var colWidths =   new Array(nwidth1, nwidth1, nwidth2, nwidth2, nwidth1, nwidth2, nwidth1);

  if(bUsage) {        
      colHeadings.push(txtUsage);
      colWidths.push(nwidth2);      
  }
  if(bDescription) {  
      colHeadings.push(txtDescription, txtLongname);
      colWidths.push(nwidth1, nwidth3);      
  }

  writeTableHeaderWithColorWidths(outfile, colHeadings, 10, getTableCellColor_Bk(true), Constants.C_WHITE, colWidths);
 var bColored = false;   // variable to change background color of table rows
 
  var ofontstylelist = ArisData.sort(actDatabase.FontStyleList(), Constants.AT_NAME, g_nloc); 
  
  for ( var i = 0 ; i < ofontstylelist.length; i++ ) {
    var ofontstyle = ofontstylelist[i];
    var ofont = ofontstyle.Font(g_nloc);

    outfile.TableRow();
    outfile.TableCell(ofontstyle.Name(g_nloc), nwidth1, getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    outfile.TableCell(ofont.Name(), nwidth1, getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
    if (ofontstyle.IsDefaultFontStyle() == true) {
      outfile.TableCell("X", nwidth2, getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
    }
    else {
      outfile.TableCell("", nwidth2, getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
    }

    outfile.TableCell(ofont.Size(), nwidth2, getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
    outfile.TableCell(getColorValueString(ofont.Color()), nwidth1, getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
    outfile.TableCell(getFontStyleString(ofont.Style()), nwidth2, getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
    outfile.TableCell(getCharsetValueString(ofont.CharSet()), nwidth1, getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);

    if (bUsage) {
        if (ofontstyle.getUsages().length > 0) {
            outfile.TableCell("X", nwidth2, getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
        } else {
            outfile.TableCell("", nwidth2, getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
        }
    }
    
    if (bDescription) {
      // Description = 9,  Langbezeichnung = 28
      var odescrattr     = ofontstyle.Attribute(9, g_nloc);
      var olongdescrattr = ofontstyle.Attribute(28, g_nloc);

      outfile.TableCell(odescrattr.GetValue(true),     nwidth1, getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      outfile.TableCell(olongdescrattr.GetValue(true), nwidth3, getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }
    bColored = !bColored; // Change background color
  }

  outfile.EndTable("", 100, getString("TEXT60"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
  outfile.OutputLn("", getString("TEXT60"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0);

  writeFontLegend();
}


/**
 *  function writeFontLegend
 *  writes font legend to specified output file
 */
function writeFontLegend()
{
  outfile.OutputLn(txtLegend, getString("TEXT60"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);

  var legendItemName = new Array(txtStyleBoldName,  txtStyleItalicName, txtStyleUnderlineName, txtStyleStrikethroughName,  txtStyleNormalName);
  var legendItem     = new Array(txtStyleBold,      txtStyleItalic,     txtStyleUnderline,     txtStyleStrikethrough,      txtStyleNormal);

  for(var i=0;i<legendItemName.length;i++) {
    outfile.OutputLn(legendItemName[i] + " = " + legendItem[i], getString("TEXT60"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
  }
}



// ----------------------------------------------------------------------------------------------
// Is the value contained in the list?
// ----------------------------------------------------------------------------------------------
function inlist(lst, lref)
{
  for ( var i = 0 ; i < lst.length ; i++ ) {
    if (lref == lst[i]) {
      return true;
    }
  }
  return false;
}



/**
 *  function writeFunctionRight
 *  writes "X" if  right lref is contained in function right list lstrights
 *  @param lstrights array holding rights of user
 *  @param lref function right to test
 */
function writeFunctionRight(aFuncRights, lref, bColored, colSize)
{
  var txtContent = "";
  if (inlist(aFuncRights, lref)) {
    txtContent = "X";
  }
  outfile.TableCell(txtContent, colSize, getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
}



// ---------------------------------------------------------------------------------------------
// Output space (in table).
// ---------------------------------------------------------------------------------------------
function emptytabelrow(bColored, aColSizes)
{
  outfile.TableRow();
  outfile.TableCell("", aColSizes[0], getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT, 0);
  outfile.TableCell("", aColSizes[1], getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT, 0);
  for(var i=0;i<g_aFuncRights.length;i++) {
    outfile.TableCell("", aColSizes[2], getString("TEXT60"), 10, Constants.C_BLACK, getTableCellColor_AttrBk(bColored), 0, Constants.FMT_LEFT, 0);
  }
}

function hexToRgb(hex) {
    var bigint = parseInt(hex, 10);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return (r<16?'0'+r.toString(16):r.toString(16)) + (g<16?'0'+g.toString(16):g.toString(16)) + (b<16?'0'+b.toString(16):b.toString(16));
}

/** 
 *  function getColorValueString
 *  converts color value in readable string
 *  @param colorValue color value
 *  @return string with color name
 */
function getColorValueString(colorValue)
{
    var colornames = {
        c00ffff: txtColorLightBlue, 
        c000000: txtColorBlack, 
        c0000ff: txtColorBlue, 
        cff00ff: txtColorPink,
        c808080: txtColorGrey, 
        c008000: txtColorGreen, 
        c00ff00: txtColorGrass, 
        c800000: txtColorHazel,
        c000080: txtColorMarine, 
        c808000: txtColorOlive, 
        c800080: txtColorPurple, 
        cff0000: txtColorRed,
        cc0c0c0: txtColorSilver, 
        c008080: txtColorTeal, 
        cffffff: txtColorWhite, 
        cffff00: txtColorYellow
    }    
    var hexvalue = hexToRgb(colorValue);
    var result = colornames['c'+hexvalue]
    if(result==null)
    {
        result = hexvalue;
    }
    return result;
}



/** 
 *  function getCharsetValueString
 *  converts charset value in readable string
 *  @param charsetValue charset value
 *  @return string with charset name
 */
function getCharsetValueString(charsetValue)
{
  switch(charsetValue) {
    case 0:
      return txtCharsetAnsi;
    case 2:
      return txtCharsetSymbol;
    case 128:
      return txtCharsetShiftjis;
    case 161:
      return txtCharsetGreek;
    case 162:
      return txtCharsetTurkish;
    case 177:
      return txtCharsetHebrew;
    case 178:
      return txtCharsetSimpleArabic;
    case 179:
      return txtCharsetTraditArabic;
    case 180:
      return txtCharsetUserArabic;
    case 181:
      return txtCharsetUserHebrew;
    case 204:
      return txtCharsetCyrillic;
    case 238:
      return txtCharsetEasternEuropean;
    case 254:
      return txtCharsetPC437;
    case 255:
      return txtCharsetOEM;
    default:
      return txtUnkown;
  }
}




/** 
 *  function getFontStyleString
 *  converts font style in readable string
 *  @param fontStyle font style
 *  @return string with font style description
 */
// -------------------------------------------------------------------------
// Returns the font style as text (b,i,u  (bold, italic, underlined, strikethrough)).
function getFontStyleString(fontStyle)
{
  var ldummy = 0; 
  var sback = ""; 
  var bfound = false; 

  // unused bits are deleted.
  ldummy = fontStyle & (Constants.FMT_BOLD | Constants.FMT_ITALIC | Constants.FMT_UNDERLINE | Constants.FMT_STRIKETHROUGH);
  
  if ((ldummy & Constants.FMT_BOLD) > 0) {
    sback = txtStyleBold;
    bfound = true;
  }

  if ((ldummy & Constants.FMT_ITALIC) > 0) {
    if (bfound == true) {
      sback = sback + ",";
    }

    sback = sback + txtStyleItalic;
    bfound = true;
  }

  if ((ldummy & Constants.FMT_UNDERLINE) > 0) {
    if (bfound == true) {
      sback = sback + ",";
    }

    sback = sback + txtStyleUnderline;
    bfound = true;
  }

  if ((ldummy & Constants.FMT_STRIKETHROUGH) > 0) {
    if (bfound == true) {
      sback = sback + ",";
    }

    sback = sback + txtStyleStrikethrough;
    bfound = true;
  }

  if (ldummy == 0) {
    sback = txtStyleNormal;
  }

  return sback;
}




function getLanguageName(olanguage)
{
    // BLUE-5340
    var oLocaleInfo = olanguage.LocaleInfo()
    var oLocale = oLocaleInfo.getLocale();
    
    return oLocale.getDisplayName();  
}



// dialog item code constants
var dicFuncRights = "chkFuncRights";
var dicOutputFormat = "optOutputFormat";
var dicLangs = "chkLangs";
var dicFonts = "chkFonts";
var dicFontUsage = "chkFontUsage";
var dicFontDesc = "chkFontDesc";

/**
 *  shows output options dialog
 *  user input is stored in supplied parameters
 * @param holder_nOptOutputFormat receives output format
 * @param holder_bLanguages receives option languages
 * @param holder_bFonts receives option fonts
 * @param holder_bFontDescription receives option font description
 * @return dialog result
 *
 */
function showOutputOptionsDialog(  holder_nOptOutputFormat, holder_bFunctionRights,
                                holder_bLanguages, holder_bFonts, holder_bFontUsage, holder_bFontDescription)
{
  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 380, 110, txtOutputOptionsDialogTitle, "dlgFuncOutputOptions");
  userdialog.CheckBox(10, 0, 370, 15, txtFunctionRights, dicFuncRights);
  userdialog.OptionGroup(dicOutputFormat);
  userdialog.OptionButton(30, 15, 350, 15, txtOutputFormatTable);
  userdialog.OptionButton(30, 30, 350, 15, txtOutputFormatText);
  userdialog.CheckBox(10, 45, 370, 15, txtLanguages, dicLangs);
  userdialog.CheckBox(10, 75, 370, 15, txtFonts, dicFonts);
  userdialog.CheckBox(30, 90, 350, 15, txtFontUsage, dicFontUsage);
  userdialog.CheckBox(30, 105, 350, 15, txtFontDescriptions, dicFontDesc);
  userdialog.OKButton();
  userdialog.CancelButton();
  userdialog.HelpButton("HID_14854130_eae4_11d8_12e0_9d2843560f51_dlg_01.hlp");

  dlgDBInfo = Dialogs.createUserDialog(userdialog); 

  var nValOptOutputFormat   = holder_nOptOutputFormat.value;
  var nValChkFuncRights     = holder_bFunctionRights.value?1:0;
  var nValChkLangs          = holder_bLanguages.value?1:0;
  var nValChkFonts          = holder_bFonts.value?1:0;
  var nValChkFontUsage      = holder_bFontUsage.value?1:0;
  var nValChkFontDescs      = holder_bFontDescription.value?1:0;

  // Read dialog settings from config
  var sSection = "SCRIPT_14854130_eae4_11d8_12e0_9d2843560f51";  
  ReadSettingsDlgValue(dlgDBInfo, sSection, dicOutputFormat, nValOptOutputFormat);
  ReadSettingsDlgValue(dlgDBInfo, sSection, dicFuncRights, nValChkFuncRights);
  ReadSettingsDlgValue(dlgDBInfo, sSection, dicLangs, nValChkLangs);
  ReadSettingsDlgValue(dlgDBInfo, sSection, dicFonts, nValChkFonts);
  ReadSettingsDlgValue(dlgDBInfo, sSection, dicFontUsage, nValChkFontUsage);
  ReadSettingsDlgValue(dlgDBInfo, sSection, dicFontDesc, nValChkFontDescs);

  var nuserdlg = Dialogs.show( __currentDialog = dlgDBInfo);
  
  // Write dialog settings to config  
  if (nuserdlg != 0) {
    WriteSettingsDlgValue(dlgDBInfo, sSection, dicOutputFormat);
    WriteSettingsDlgValue(dlgDBInfo, sSection, dicFuncRights);
    WriteSettingsDlgValue(dlgDBInfo, sSection, dicLangs);
    WriteSettingsDlgValue(dlgDBInfo, sSection, dicFonts);
    WriteSettingsDlgValue(dlgDBInfo, sSection, dicFontUsage);
    WriteSettingsDlgValue(dlgDBInfo, sSection, dicFontDesc);
  }

  // store settings in holders
  holder_nOptOutputFormat.value     = dlgDBInfo.getDlgValue(dicOutputFormat);

  var holders = new Array(holder_bFunctionRights, holder_bLanguages, holder_bFonts, holder_bFontUsage, holder_bFontDescription);  
  var dics    = new Array(dicFuncRights, dicLangs, dicFonts, dicFontUsage, dicFontDesc);
  
  for(var i=0;i<holders.length;i++) {
    holders[i].value = (dlgDBInfo.getDlgValue(dics[i])!=0);
  }

  return nuserdlg;
}

/** 
  *  Dialog function for output options dialog
  * @param dlgItem   dialog item name
  * @param act action
  * @param suppVal support value
  * @return bool value, for act!=1, true means continue dialog and false ends dialog, vice versa for act=1 
  */
function dlgFuncOutputOptions(dlgItem, act, suppVal)
{
  var bResult = true;
  switch(act)
  {
    case 1:
      var bEnableRights = (dlgDBInfo.getDlgValue(dicFuncRights) != 0);
      dlgDBInfo.setDlgEnable(dicOutputFormat, bEnableRights);
    
      var bEnableFonts = (dlgDBInfo.getDlgValue(dicFonts) != 0);
      dlgDBInfo.setDlgEnable(dicFontUsage, bEnableFonts);
      dlgDBInfo.setDlgEnable(dicFontDesc, bEnableFonts);
    
      bResult = false;
      break;

    case 2:
      if(dlgItem==dicFuncRights) {
        var bEnable = dlgDBInfo.getDlgValue(dicFuncRights)!=0;
        dlgDBInfo.setDlgEnable(dicOutputFormat, bEnable);
      }
      else if(dlgItem==dicLangs) {
        var bEnable = dlgDBInfo.getDlgValue(dicLangs)!=0;
      }
      else if(dlgItem==dicFonts) {
        var bEnable = dlgDBInfo.getDlgValue(dicFonts)!=0;
        dlgDBInfo.setDlgEnable(dicFontUsage, bEnable);
        dlgDBInfo.setDlgEnable(dicFontDesc, bEnable);
      }
      else if(dlgItem=="OK")
        bResult = false;
      else if(dlgItem=="Cancel")
        bResult = false;
      break;
  }

  return bResult;
}

function getDbUserList() {
    // AGA-12165
    if (g_bAssignedUsersOnly) {
        return actDatabase.AssignedUsers();
    }
    return actDatabase.UserList();
}

function getDbUserGroupList() {
    var userGroups = actDatabase.UserGroupList();
    // AGA-12165
    if (g_bAssignedUsersOnly) {
        return filterAssignedUserGroups(userGroups);
    }
    return userGroups;
}

function getUserGroupsOfUser(oUser) {
    var userGroups = oUser.UserGroups();
    // BLUE-19266
    if (g_bAssignedUsersOnly) {
        return filterAssignedUserGroups(userGroups);
    }
    return userGroups;
}

function filterAssignedUserGroups(userGroups) {
    var assignedUserGroups = new Array();
    for (var i = 0; i < userGroups.length; i++) {
        var userGroup = userGroups[i];
        if (userGroup.IsAssigned()) {
            assignedUserGroups.push(userGroup);
        }
    }
    return assignedUserGroups;
}

function getColumnSizes() {
    var nCount = g_aFuncRights.length;
    var colSize_2 = Math.round(60/nCount);
    var colSize_0 = Math.round((100-nCount*colSize_2)/2);
    var colSize_1 = 100-colSize_0-nCount*colSize_2;
    return [colSize_0, colSize_1, colSize_2]
}

function getFunctionRightName(attrType) {
    var attrAPIName = actFilter.getAPIName(Constants.CID_ATTRDEF, attrType);
    var sAttrName = getString(attrAPIName);
    if (sAttrName == "") {
        var sAttrName = actFilter.AttrTypeName(attrType);
    }
    return sAttrName;
}

function sortAttrName(attrTypeA, attrTypeB) {
    return StrComp(getFunctionRightName(attrTypeA), getFunctionRightName(attrTypeB));
}


main();



















