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

 
Context.setProperty("use-new-output", false);   // AGA-10196 Only works with old output object, because HTML is generated directly 

const CRLF = "\r\n";
const CR   = "\r";
const LF   = "\n";
const TAB  = "\t";

// Einstellungen (werden aus der .ini-/.xml-Datei gelesen)
var g_stitle = "";                  // Ueberschrift 
var g_nmodeltypes = new Array();    // Auszuwertendes Modell 
var g_nobjtype = 0;                 // Auszuwertendes Objekt 
var g_nattribcreator = 0;           // Attribut fuer Ersteller 
var g_nattribcreationdate = 0;      // Attribut fuer Erstellungsdatum 
var g_nxattribtype = 0;             // Attribut fuer X-Koordinaten 
var g_nminx = 0;                    // Minimum X 
var g_nmaxx = 0;                    // Maximum X 
var g_ndefaultx = 0;                // Standardwert X 
var g_nyattribtype = 0;             // Attribut fuer Y-Koordinaten 
var g_nminy = 0;                    // Minimum Y
var g_nmaxy = 0;                    // Maximum Y 
var g_ndefaulty = 0;                // Standardwert Y
var g_nnumcharsforwidth2 = 0;       // Maximale Laenge Teilstring ohne Leerzeichen im Objektnamen, ab denen die AWST-Symbolgrösse 2 verwendet wird 
var g_nnumcharsforwidth3 = 0;       // Maximale Laenge Teilstring ohne Leerzeichen im Objektnamen, ab denen die AWST-Symbolgrösse 3 verwendet wird 
var g_smodelnamecaption = "";       // Bezeichnung vor dem Modellnamen 
//var g_sdateformat = "";           // Datumformat fuer Ausgabe (fuer Internationalisierung) 

var g_scaptcreatorname = "";
var g_scaptcreationdate = "";
var g_scoorddescx = "";
var g_scoorddescy = "";

var g_dspanx = 0.0; 
var g_dspany = 0.0; 

var g_nloc = Context.getSelectedLanguage(); 

var g_oOutfile = Context.createOutputObject(Constants.OUTTEXT, Context.getSelectedFile());
g_oOutfile.Init(g_nloc);

// Allgemeine Konstanten (Relevant fuer Internationalisierung)
var c_sdoubleformat = "0.0000"; 
// Nullwert fuer nicht gepflegtes Analyse-Attribut
var c_nnullvalue = - 1; 


main();

//--------------------------------------------------------------------

// Hauptprogramm
function main() {
    
    // Einstellungen aus .ini-/.xml-Datei laden
    readIniParameters();
    
    var bhandled = false;
    
    // Ausgewaehlte Modelle
    var omodellist = ArisData.getSelectedModels();
    
    if (omodellist.length > 0) {
        // fuer alle Modelle
        for (var i = 0 ; i < omodellist.length ; i++ ) {
            var omodel = omodellist[i];
            
            // Behandlung nur des eingestellten Modelltyp
            if (isvalidmodeltype(omodel)) {
                
                var smodelname = omodel.Name(g_nloc);
                
                var screatorname = "";
                if (omodel.Attribute(g_nattribcreator, g_nloc).IsMaintained()) {
                    screatorname = omodel.Attribute(g_nattribcreator, g_nloc).GetValue(true);
                }
                var screationdate = "";
                if (omodel.Attribute(g_nattribcreator, g_nloc).IsMaintained()) {
                    screationdate = omodel.Attribute(g_nattribcreationdate, g_nloc).GetValue(true);
                }
                
                writehead(screatorname, screationdate, smodelname);
                
                handlemodel(omodel);
                
                writetail();
                
                bhandled = true;
                break;
            }
        }
    }
    
    g_oOutfile.WriteReport();    
    
//    if (bhandled) {
        copyStaticFiles();
        copySymbolFile();   // BLUE-8302 
//    }   
}


function isvalidmodeltype(omodel) {
    for (var i = 0 ; i < g_nmodeltypes.length ; i++ ) {
        if (omodel.TypeNum() == g_nmodeltypes[i] || omodel.OrgModelTypeNum() == g_nmodeltypes[i]) {     // TANR 216764
            return true;
        }
    }
    return false;
}


function handlemodel(omodel) {
    var xval = 0.0; 
    var yval = 0.0; 
    var nsize = 0; 
    
    var oobjocclist = omodel.ObjOccListFilter(g_nobjtype);
    
    g_oOutfile.OutputTxt("  var objects = Array(); " + CRLF + CRLF);
    
    if (oobjocclist.length > 0) {
        for (var i = 0 ; i < oobjocclist.length ; i++ ) {
            var oobjocc = oobjocclist[i];
            var oobjdef = oobjocc.ObjDef();
            
            // normalisierten X-Wert berechnen
            if (oobjdef.Attribute(g_nxattribtype, g_nloc).IsMaintained()) {
//                xval = oobjdef.Attribute(g_nxattribtype, g_nloc).GetValue(true) / g_dspanx;
                xval = (oobjdef.Attribute(g_nxattribtype, g_nloc).MeasureUnitTypeNum() - g_nminx) / g_dspanx;
            } else {
                xval = g_ndefaultx / g_dspanx;
            }
            
            // normalisierten Y-Wert berechnen
            if (oobjdef.Attribute(g_nyattribtype, g_nloc).IsMaintained()) {
//                yval = oobjdef.Attribute(g_nyattribtype, g_nloc).GetValue(true) / g_dspany;
                yval = oobjdef.Attribute(g_nyattribtype, g_nloc).MeasureValue() / g_dspany;
            } else {
                yval = g_ndefaulty / g_dspany;
            }
            
            var sname = "" + oobjdef.Name(g_nloc);
            
            var nmaxwidth = getmaxwidth(sname);
            
            if (nmaxwidth >= g_nnumcharsforwidth2) {
                if (nmaxwidth >= g_nnumcharsforwidth3) {
                    nsize = 3;
                } else {
                    nsize = 2;
                }
            } else {
                nsize = 1;
            }
            
            g_oOutfile.OutputTxt("  objects[" + i + "]        = Array();" + CRLF);
            g_oOutfile.OutputTxt("  objects[" + i + "][0]     = Array();" + CRLF);
            g_oOutfile.OutputTxt("  objects[" + i + "][0][0]  = " + formatdouble(doFormat(xval, c_sdoubleformat)) + (";" + CRLF));
            g_oOutfile.OutputTxt("  objects[" + i + "][0][1]  = " + formatdouble(doFormat(yval, c_sdoubleformat)) + (";" + CRLF));
            g_oOutfile.OutputTxt("  objects[" + i + "][1]     = \'" + ((replaceforjsstring(sname) + "\';") + CRLF));
            g_oOutfile.OutputTxt("  objects[" + i + "][2]     = " + nsize + ";" + CRLF);
            
            g_oOutfile.OutputTxt(CRLF);
        }
    }
}


function writehead(screatorname, screationdate, smodeltitle) {
    g_oOutfile.OutputTxt("<html>");
    g_oOutfile.OutputTxt("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">" + CRLF);    
    g_oOutfile.OutputTxt("<head>");
    g_oOutfile.OutputTxt(TAB + ("<title>" + getString("TEXT_1") + "</title>" + CRLF));
    g_oOutfile.OutputTxt(TAB + ("<link rel=\'stylesheet\' href=\'pb.css\'></link>" + CRLF));
    g_oOutfile.OutputTxt(TAB + ("<script language=\'JavaScript\' src=\'pb.js\' type=\'Text/javascript\'></script>" + CRLF));
    g_oOutfile.OutputTxt(TAB + ("<script language=\'JavaScript\' type=\'Text/javascript\'>" + CRLF));
    g_oOutfile.OutputTxt(TAB + ("<!--" + CRLF));
    g_oOutfile.OutputTxt(TAB + TAB + "var capt_creatorName   = \'" + replaceforjsstring(g_scaptcreatorname) + ("\';" + CRLF));
    g_oOutfile.OutputTxt(TAB + TAB + "var creatorName        = \'" + replaceforjsstring(screatorname) + ("\';" + CRLF));
    g_oOutfile.OutputTxt(TAB + TAB + "var capt_creationDate  = \'" + replaceforjsstring(g_scaptcreationdate) + ("\';" + CRLF));
    g_oOutfile.OutputTxt(TAB + TAB + "var creationDate       = \'" + replaceforjsstring(screationdate) + ("\';" + CRLF));
    g_oOutfile.OutputTxt(TAB + TAB + "var capt_modelTitle    = \'" + replaceforjsstring(g_smodelnamecaption) + ("\';" + CRLF));
    g_oOutfile.OutputTxt(TAB + TAB + "var modelTitle         = \'" + replaceforjsstring(smodeltitle) + "\';" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "var coordDescX         = \'" + replaceforjsstring(g_scoorddescx) + "\';" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "var coordDescY         = \'" + replaceforjsstring(g_scoorddescy) + "\';" + CRLF);
    g_oOutfile.OutputTxt(CRLF);
}


function writetail() {
    g_oOutfile.OutputTxt(TAB + "//-->" + CRLF);
    g_oOutfile.OutputTxt(TAB + "</script>" + CRLF);
    g_oOutfile.OutputTxt(TAB + "</head>" + CRLF);
    g_oOutfile.OutputTxt(TAB + "<body" + CRLF);
    g_oOutfile.OutputTxt(TAB + "<div style=\'position:absolute; top:2px; Left:0px; width:800px\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "<table width=\'100%\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "<colgroup><col width=\'60\'><col width=\'*\'><col width=\'60\'></colgroup>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "<tr>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + "<td><img src=\'spacer.gif\' width=\'40\'></td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + "<td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + (TAB + "<table width=\'100%\'>") + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + ((((TAB + TAB) + "<tr><td class=\'header\'><h1>") + g_stitle) + "</h1></td></tr>") + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + "</table>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + "</td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + "<td><img src=\'spacer.gif\' width=\'40\'></td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "</tr>" + CRLF);
    g_oOutfile.OutputTxt(TAB + "</table>" + CRLF);
    g_oOutfile.OutputTxt(TAB + "</div>" + CRLF);
    g_oOutfile.OutputTxt(CRLF);
    g_oOutfile.OutputTxt(TAB + "<div style=\'position:absolute; top:580px; Left:337px; heigth:40px; width:315px;\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "<table width=\'100%\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + "<tr valign=\'top\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + "<td width=\'2\'><img src=\'spacer.gif\' height=\'26\'></td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + "<td class=\'legend arrowright\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + "<script language=\'javaScript\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + "<!--" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + "document.write(coordDescX);" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + "// -->" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + "</script>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + "</td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + "<td class=\'arrowrighthead\' width=\'30\' height=\'26\'>&nbsp;</td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + "</tr>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "</table>" + CRLF);
    g_oOutfile.OutputTxt(TAB + "</div>" + CRLF);
    g_oOutfile.OutputTxt(TAB + "" + CRLF);
    g_oOutfile.OutputTxt(TAB + "<div style=\'position:absolute; top:153px; left:35px; width:60px; height:300px;\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "<table width=\'100%\' class=\'arrowup\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + "<tr height=\'300\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + "<td class=\'legend\' width=\'65\' align=\'center\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + "<script language=\'javaScript\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + "<!--" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + "document.write(coordDescY);" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + "// -->" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + "</script>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + "</td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + "</tr>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "</table>" + CRLF);
    g_oOutfile.OutputTxt(TAB + "</div>" + CRLF);
    g_oOutfile.OutputTxt(TAB + "" + CRLF);
    g_oOutfile.OutputTxt(TAB + "<div style=\'position:absolute; top:48px; Left:135px; width:724px;\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "<table width=\'100%\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "<tr height=\'262\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + "<td class=\'pbarea1\'><img src=\'spacer.gif\' width=\'360\' height=\'260\'></td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + "<td class=\'pbarea2\'><img src=\'spacer.gif\' width=\'360\' height=\'260\'></td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "</tr>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "<tr height=\'262\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + "<td class=\'pbarea3\'><img src=\'spacer.gif\' width=\'360\' height=\'260\'></td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + "<td class=\'pbarea4\'><img src=\'spacer.gif\' width=\'360\' height=\'260\'></td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "</tr>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "</table>" + CRLF);
    g_oOutfile.OutputTxt(TAB + "</div>" + CRLF);
    g_oOutfile.OutputTxt(CRLF);
    g_oOutfile.OutputTxt(TAB + "<div style=\'position:absolute; top:610px; Left:0px; width:800px\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "<table width=\'100%\'>" + CRLF);
//  g_oOutfile.OutputTxt(TAB + TAB + "<colgroup><col width=\'60\'><col width=\'*\'><col width=\'60\'></colgroup>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "<tr>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + "<td><img src=\'spacer.gif\' width=\'40\'></td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + "<td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + "<table width=\'100%\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + "<tr valign=\'top\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + "<td align=\'Left\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "<b>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "<script language=\'javaScript\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "<!--" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + TAB + "document.write(capt_modelTitle);" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "// -->" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "</script>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + ":</b>&nbsp;&nbsp;" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "<script language=\'javaScript\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "<!--" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + TAB + "document.write(modelTitle);" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "// -->" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "</script>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + "</td>" + CRLF);
    g_oOutfile.OutputTxt(CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + "<td align=\'Left\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "<b>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "<script language=\'javaScript\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "<!--" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + TAB + "document.write(capt_creatorName);" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "// -->" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "</script>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + ":</b>&nbsp;&nbsp;" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "<script language=\'javaScript\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "<!--" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + TAB + "document.write(creatorName);" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "// -->" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "</script>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + "</td>" + CRLF);
    g_oOutfile.OutputTxt(CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + "<td align=\'Left\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "<b>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "<script language=\'javaScript\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "<!--" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + TAB + "document.write(capt_creationDate);" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "// -->" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "</script>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + ":</b>&nbsp;&nbsp;" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "<script language=\'javaScript\'>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "<!--" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + TAB + "document.write(creationDate);" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "// -->" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + TAB + "</script>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + "</td>" + CRLF);
    g_oOutfile.OutputTxt(CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + "<td></td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + TAB + "<td align=\'right\'>&copy; Software AG 2019</td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + TAB + "</tr>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + TAB + "</table>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + TAB + "</td>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "</tr>" + CRLF);
    g_oOutfile.OutputTxt(TAB + TAB + "</table>" + CRLF);
    g_oOutfile.OutputTxt(TAB + "</div>" + CRLF);
    g_oOutfile.OutputTxt(CRLF);
    g_oOutfile.OutputTxt(TAB + "<script language=\'JavaScript\' src=\'pbwrite.js\' type=\'Text/javascript\'></script>" + CRLF);
    g_oOutfile.OutputTxt(CRLF);
    g_oOutfile.OutputTxt(TAB + "</body>" + CRLF);
    g_oOutfile.OutputTxt("</html>" + CRLF);
}


function replaceforjsstring(s) {
    var s_new = "" + s;
    s_new = doReplace(s_new, CR, " ");
    s_new = doReplace(s_new, LF, " ");
    s_new = doReplace(s_new, TAB, " ");
    s_new = doReplace(s_new, String.fromCharCode(0), " ");    
    s_new = doReplace(s_new, "&", "&amp;");
    s_new = doReplace(s_new, "\"", "&quot;");
    s_new = doReplace(s_new, "<", "&lt;");
    s_new = doReplace(s_new, ">", "&gt;");
    s_new = doReplace(s_new, "\\", "\\\\");
    s_new = doReplace(s_new, "\'", "\\\'");
    return s_new;
}


function replaceforhtmlstring(s) {
    var s_new = "" + s;
    s_new = doReplace(s_new, "&", "&amp;");
    s_new = doReplace(s_new, "\"", "&quot;");
    s_new = doReplace(s_new, "<", "&lt;");
    s_new = doReplace(s_new, ">", "&gt;");
    s_new = doReplace(s_new, "\'", "&apos;");
    return s_new;
}


function formatdouble(s) {
    return doReplace(s, ",", ".");
}


function getmaxwidth(sname) {
    var maxwidth = 0; 
    var idx = 1; 
    
    while (idx < sname.length) {
        var nspacepos = getnextwsindex(sname, idx);
        if ((nspacepos - idx) > maxwidth) {
            maxwidth = nspacepos - idx;
        }
        if (nspacepos > idx) {
            idx = nspacepos;
        }else {
            idx = idx + 1;
        }
    }
    if (maxwidth == 0) {
        maxwidth = sname.length;
    }
    return maxwidth;
}


function getnextwsindex(s, idx) {
    var min = 100000;    
    
    var nextwsindex = doInStr(idx, s, " ");
    if (nextwsindex > 0 && nextwsindex < min) {
        min = nextwsindex;
    }
    nextwsindex = doInStr(idx, s, LF);
    if (nextwsindex > 0 && nextwsindex < min) {
        min = nextwsindex;
    }
    nextwsindex = doInStr(idx, s.value, CR);
    if (nextwsindex > 0 && nextwsindex < min) {
        min = nextwsindex;
    }
    return min;
}


function readIniParameters() {
    g_stitle                = getString("TEXT_1"); 
    g_nmodeltypes           = getEntriesFromList(getIniEntry_string("ModelTypes"));
    g_nobjtype              = getTypeNum(getIniEntry_string("ObjType")); 
    g_nattribcreator        = getTypeNum(getIniEntry_string("AttribCreator")); 
    g_nattribcreationdate   = getTypeNum(getIniEntry_string("AttribCreationDate")); 
    g_nxattribtype          = getTypeNum(getIniEntry_string("AttribX"));
    g_nminx                 = getIniEntry_int("MinX"); 
    g_nmaxx                 = getIniEntry_int("MaxX"); 
    g_ndefaultx             = getIniEntry_int("DefaultX"); 
    g_nyattribtype          = getTypeNum(getIniEntry_string("AttribY"));
    g_nminy                 = getIniEntry_int("MinY"); 
    g_nmaxy                 = getIniEntry_int("MaxY"); 
    g_ndefaulty             = getIniEntry_int("DefaultY");
    g_nnumcharsforwidth2    = getIniEntry_int("NumCharsForWidth2"); 
    g_nnumcharsforwidth3    = getIniEntry_int("NumCharsForWidth3"); 
    g_smodelnamecaption     = getString("TEXT_2"); 
//    g_sdateformat           = "dd.mm.yyyy hh:nn:ss";     
    
    // Aktueller Filter
    var ofilter = ArisData.getActiveDatabase().ActiveFilter();
    
    // Attributnamen per Filter auslesen
    g_scaptcreatorname = ofilter.AttrTypeName(g_nattribcreator);
    g_scaptcreationdate = ofilter.AttrTypeName(g_nattribcreationdate);
    g_scoorddescx = ofilter.AttrTypeName(g_nxattribtype);
    g_scoorddescy = ofilter.AttrTypeName(g_nyattribtype);
    
    g_dspanx = g_nmaxx - g_nminx;
    g_dspany = g_nmaxy - g_nminy;
}


function getIniEntry_string(p_sEntry) {
    var sFile = "systemEvaluation.xml"; 
    var sSection = "SYSTEMEVALUATION"; 
    return Context.getPrivateProfileString(sSection, p_sEntry, "", sFile);
}

function getIniEntry_int(p_sEntry) {
    var sFile = "systemEvaluation.xml"; 
    var sSection = "SYSTEMEVALUATION"; 
    return Context.getPrivateProfileInt(sSection, p_sEntry, 0, sFile);
}


function getTypeNum(p_typeNum) {
    var sTypeNum = new java.lang.String(p_typeNum);
    if (sTypeNum.length() > 0) {    
        if (isNaN(sTypeNum)) {
            return eval("Constants." + sTypeNum);
        } else {
            return p_typeNum;
        }
    } else {
        return -1;
    }
}


function getEntriesFromList(p_sList) {
    var aEntries = new Array();
    
    var sTokenizer = new java.util.StringTokenizer(p_sList, ";");
    while(sTokenizer.hasMoreTokens()) {
        aEntries.push(getTypeNum(sTokenizer.nextToken()));
    }
    return aEntries;
}


function copyStaticFiles() {
    var sStaticFile = "static.xml"; 
    var sStaticSection = "STATIC"; 
    
    var nFileCount = Context.getPrivateProfileInt(sStaticSection, "FileCount", 0, sStaticFile);
    if (nFileCount > 0) {
        for (var i = 1 ; i <= nFileCount ; i++ ) {        
            var sEntry = "File" + i;
            var sFile = "" + Context.getPrivateProfileString(sStaticSection, sEntry, "", sStaticFile);
            if (sFile.length > 0) {
                copyStaticFile(sFile);  // BLUE-3064
            }
        }
    }
    
    function copyStaticFile(sFile) {
        if (is_js_txt(sFile)) {
            copyAndRename(sFile);
        } else {
            Context.addOutputFileName(sFile, Constants.LOCATION_SCRIPT);
        }
        
        function is_js_txt(sFile) {
            var sFileTmp = new java.lang.String(sFile);
            return sFileTmp.endsWith(".js.txt"); 
        }
        function copyAndRename(sFile) {
            var nIdx = sFile.lastIndexOf(".txt");
            var sFileNew = sFile.substring(0, nIdx);
            
            var res = Context.getFile(sFile, Constants.LOCATION_SCRIPT);
            Context.setFile(sFileNew, Constants.LOCATION_OUTPUT, res);
        }
    }
}

function copySymbolFile() {
    if (isOldPalette()) {
        // Copy "awst.gif"
        Context.addOutputFileName("awst.gif", Constants.LOCATION_SCRIPT);
    } else {
        // Rename and copy "awst_new.gif" -> "awst.gif" (BLUE-8302)
        var res = Context.getFile("awst_new.gif", Constants.LOCATION_SCRIPT);
        Context.setFile("awst.gif", Constants.LOCATION_OUTPUT, res);
    }            
    
    function isOldPalette() {
        var sPaletteGuid = ArisData.getActiveDatabase().getPaletteGUID();
        return StrComp(sPaletteGuid, "77788534-58b0-49cd-886c-965135949e74") == 0;
    }
}

function doReplace(string, pattern, replacement) {
  if (pattern == "") {
      return string;
  }
  var result = "";
  var tail   = "" + string;

  for(;;) {
    var idx = tail.indexOf(pattern);
    if (idx == -1) break;

    var newTail = tail.substr(idx + pattern.length);
    var head = "";
    if(idx > 0) {
      head = tail.substr(0, idx);
    }
    result = result + head + replacement;
    tail = newTail;
  }
  return result + tail;
}

function doFormat(value, strFormat) {
    var decFormat = new java.text.DecimalFormat(""+strFormat);
    return decFormat.format(value);
}

function doInStr(startIdx, string, pattern) {
    string = "" + string;
    return string.indexOf(pattern, startIdx-1)+1;
}