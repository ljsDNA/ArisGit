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

// ------------------------------------------------------------------------------
// Occurrences in models.
// In addition to the selected object definitions the occurrences
// in models and their activation state are listed.
// ------------------------------------------------------------------------------

// BLUE-17650 - Import/Usage of 'convertertools.js' removed 


var g_nloc = Context.getSelectedLanguage();

function main()
{
    var ooutfile = Context.createOutputObject();
    
    // Format definitions.
    ooutfile.DefineF("REPORT1", getString("TEXT1"), 24, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
    ooutfile.DefineF("REPORT2", getString("TEXT1"), 14, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    ooutfile.DefineF("REPORT3", getString("TEXT1"), 8, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
    ooutfile.DefineF("REPORT4", getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT | Constants.FMT_BOLD, 0, 21, 0, 0, 0, 1);
    
    // Header, footer and headline are created.
    reporthead(ooutfile);
    
    var oobjects = ArisData.getSelectedObjDefs();
    oobjects = ArisData.sort(oobjects, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, g_nloc);
    
    for (var i = 0; i < oobjects.length; i++) {
        var ocurrentobject = oobjects[i];
        var oobjoccs = ocurrentobject.OccList();
        
        if (oobjoccs.length == 0) {
            ooutfile.OutputLnF("", "REPORT4");
            ooutfile.OutputLnF(ocurrentobject.Type() + ": " + ocurrentobject.Name(g_nloc) + " " + getString("TEXT2"), "REPORT4");
        } else {
            ooutfile.OutputLnF("", "REPORT4");
            ooutfile.OutputLnF(ocurrentobject.Type() + ": " + ocurrentobject.Name(g_nloc), "REPORT4");
            ooutfile.BeginTable(100, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0);
            ooutfile.TableRow();
            // Table headline.
            ooutfile.TableCell(getString("TEXT3"), 70, getString("TEXT1"), 12, Constants.C_BLACK, getColorByRGB(212, 212, 212), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            ooutfile.TableCell(getString("TEXT4"), 30, getString("TEXT1"), 12, Constants.C_BLACK, getColorByRGB(212, 212, 212), 0, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

            for (var j = 0; j < oobjoccs.length; j++) {
                var oobjocc = oobjoccs[j];
                var ocurrentmodel = oobjocc.Model();
                
                ooutfile.TableRow();
                ooutfile.TableCell(ocurrentmodel.Group().Path(g_nloc) + "\\" + ocurrentmodel.Name(g_nloc), 70, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                ooutfile.TableCell(ocurrentmodel.Type(), 30, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
            }
            ooutfile.EndTable("", 100, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        }
    }   
    ooutfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());
}

// ----------------------------------------------------------
// Subroutine ReportHead
// Subprogram for creating the report heading.
// -----------------------------------------------------------
function reporthead(ooutfile)
{
    // BLUE-17783 Update report header/footer
    var borderColor = getColorByRGB( 23, 118, 191);
    
    // graphics used in header
    var pictleft = Context.createPicture(Constants.IMAGE_LOGO_LEFT);
    var pictright = Context.createPicture(Constants.IMAGE_LOGO_RIGHT);
    var sheadline = getString("TEXT5");
    
    // Header
    setFrameStyle(ooutfile, Constants.FRAME_BOTTOM);
    ooutfile.BeginHeader();
    ooutfile.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    ooutfile.TableRow();
    ooutfile.TableCell("", 26, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    ooutfile.OutGraphic(pictleft, - 1, 40, 15);
    ooutfile.TableCell(sheadline, 48, getString("TEXT1"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    ooutfile.TableCell("", 26, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    ooutfile.OutGraphic(pictright, - 1, 40, 15);
    ooutfile.EndTable("", 100, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    ooutfile.EndHeader();
    
    // Footer
    setFrameStyle(ooutfile, Constants.FRAME_TOP);
    ooutfile.BeginFooter();
    ooutfile.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    ooutfile.TableRow();
    ooutfile.TableCell("", 26, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    ooutfile.OutputField(Constants.FIELD_DATE, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    ooutfile.Output(" ", getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
    ooutfile.OutputField(Constants.FIELD_TIME, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
    ooutfile.TableCell(Context.getSelectedFile(), 48, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    ooutfile.TableCell("", 26, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
    ooutfile.Output(getString("TEXT6"), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
    ooutfile.OutputField(Constants.FIELD_PAGE, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
    ooutfile.Output(getString("TEXT7"), getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER, 0);
    ooutfile.OutputField(Constants.FIELD_NUMPAGES, getString("TEXT1"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER);
    ooutfile.EndTable("", 100, getString("TEXT1"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    ooutfile.EndFooter();
    
    ooutfile.ResetFrameStyle();
    
    // Headline
    ooutfile.OutputLnF("", "REPORT1");
    ooutfile.OutputLnF(getString("TEXT8"), "REPORT1");
    ooutfile.OutputLnF("", "REPORT1");
    
    // Information header.
    ooutfile.OutputLnF((getString("TEXT9") + ArisData.getActiveDatabase().ServerName()), "REPORT2");
    ooutfile.OutputLnF((getString("TEXT10") + ArisData.getActiveDatabase().Name(g_nloc)), "REPORT2");
    ooutfile.OutputLnF((getString("TEXT11") + ArisData.getActiveUser().Name(g_nloc)), "REPORT2");
    ooutfile.OutputLnF("", "REPORT2");
    
    
    function setFrameStyle(outfile, iFrame) { 
        outfile.SetFrameStyle(Constants.FRAME_TOP, 0); 
        outfile.SetFrameStyle(Constants.FRAME_LEFT, 0); 
        outfile.SetFrameStyle(Constants.FRAME_RIGHT, 0); 
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 0);
        
        outfile.SetFrameStyle(iFrame, 50, Constants.BRDR_NORMAL);
    }    
}


main();