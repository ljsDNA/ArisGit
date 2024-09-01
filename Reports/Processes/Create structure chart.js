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


// text constants
// dialog text constants
var txtOutputOptionsDialogTitle = getString("TEXT1");
var txtOrientation          = getString("TEXT2");
var txtOrientPortrait       = getString("TEXT3");
var txtOrientLandscape      = getString("TEXT4");

var txtRelationBase         = getString("TEXT5");
var txtRelBaseDefinition    = getString("TEXT6");
var txtRelBaseOccurence     = getString("TEXT7");

var txtLinkedModels         = getString("TEXT8");
var txtAllEvents            = getString("TEXT9");
var txtFuncDesc             = getString("TEXT10");

var txtModelName            = getString("TEXT11");
var txtNoModelSelected      = getString("TEXT12");
var txtNotLoopElement       = getString("TEXT13");
var txtErrorInLoopSearch    = getString("TEXT14");
var txtNoStartObjInModel    = getString("TEXT15");
var txtNoStartObjFound      = getString("TEXT16");
var txtNoObjectsInModel     = getString("TEXT17");

var txtFunctionDescs        = getString("TEXT18");
var txtFunction             = getString("TEXT19");
var txtDescription          = getString("TEXT20");

var txtErrorAborted = getString("TEXT21");

var txtLoop = "Loop";

var __enum_looptyp_keinloop = 0;
var __enum_looptyp_zielloop = 1;
var __enum_looptyp_startloop = 2;


// Spaltenstruktur
__usertype_column = function() {
  this.ocolumnobj = null;                 // Spaltenobjekt
  this.osplitcount = 0;                 // Anzahl der Splitzweige des Objektes
  this.llooptype = 0;                   // Looptyp 1= oSource/ 2 = oTarget
  this.boutputobject = false;            // gibt an ob Objekt in Zeile ausgegeben wird
  this.icolumnsize = 0;                 // Spaltengröße
  this.ieditcolumnsize = 0;             // bearbeitete Spaltengröße, zeigt an ob Objekt schon besucht wurde
}
// dient zur Spaltenbreiten Ermittlung

// Zeilenstruktur
__usertype_row = function() {
  this.columns = new Array();// __usertype_column()    // Spaltenvektor mit den Spalten einer Zeile
  this.columns_number = 0;                             // Spaltenanzahl einer Zeile
}

__usertype_loopstruct = function() {
  this.osource = null;    // Quellobjekt
  this.otarget = null;    // Zielobjekt
}

var g_nloc = 0; 
var g_oloopobj = new Array();   // __usertype_loopstruct() // Feld mit den Loopstartobjekten und -endobjekten.
var g_pagesize = 0;             // Änderung betrifft das Seitenformat
var g_objectkind = 0;           // Ausgabe der Beziehungen zu Organisationseinheiten
var g_funcdesc = false;         // Optionvariable ob Funktionsbeschreibungen mit ausgegeben werden
var g_bsequencevents = false;   // Optionsschalter für Folgeereignisse
var g_errortxt = ""; 


function main()
{
  var ocurrmodels = new __holder(null); 
  g_nloc = Context.getSelectedLanguage();

  // Überprüfung des Ausgabeformates und des Dialogergebnisses

  var holder_nOptOrientation    = new __holder(0);
  var holder_nOptRelationBase   = new __holder(0);
  var holder_bLinkedModels      = new __holder(false);
  var holder_bAllEvents         = new __holder(false);
  var holder_bFuncDesc          = new __holder(false);

  var nuserdialog = showOutputOptionsDialog(holder_nOptOrientation, holder_nOptRelationBase, 
                                          holder_bLinkedModels, holder_bAllEvents, holder_bFuncDesc);

  if(nuserdialog!=0) {
    // Startet das eigentliche Programm
    if(!(build_tree(ocurrmodels, holder_nOptOrientation.value, holder_nOptRelationBase.value, 
                holder_bLinkedModels.value, holder_bAllEvents.value, holder_bFuncDesc.value))) {
      Context.setScriptError(Constants.ERR_CANCEL);
      return;
    }
  }
}


function build_tree(ocurrmodels, nOptOrientation, nOptRelationBase, bLinkedModels, bAllEvents, bFuncDesc)
{
  // Beschreibung: Die Funktion Build_Tree ist Hauptfunktion des Report.Sie überprüft die
  // die Modelltypen, steuert den Strukturaufbau,den Spaltenaufbau,
  // die Ausgabe und die Fehlerausgabe.
  // D. h. die Funktion führt für jedes Modell folgende Schritte aus.
  // Sie überprüft den Modelltyp,initialisiert die Variablen(Felder),stellt
  // das Ausgabeformat ein. Dananch wird die Struktur der EPK ermittelt.
  // Der Spaltenaufbau errechnet und die Ausgabe kreiert.
  // 
  // Input value:     oModel  als aktulles Modell

  var rows = new __holder(new Array()); // __usertype_row() 
  var ocurrmodel = new __holder(null); 
  var berror = new __holder(false); 
  var bfirstmodel = false; 

  var outfile = Context.createOutputObject(Context.getSelectedFormat(), Context.getSelectedFile());
  outfile.Init(g_nloc);

  outfile.DefineF("REPORT1", getString("TEXT1"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
  outfile.DefineF("REPORT2", getString("TEXT1"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  outfile.DefineF("REPORT3", getString("TEXT1"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);


  // Stellt Papierformat ein
  if (nOptOrientation == 0) {
    outfile.SetPageWidth(210);
    outfile.SetPageHeight(297);
  }
  else if(nOptOrientation==1) {
    outfile.SetPageWidth(297);
    outfile.SetPageHeight(210);
  }

  g_bsequencevents  = !bAllEvents;          // Anubis 262703
  g_objectkind      = nOptRelationBase;


  // Kreiert die Kopf- und Fußzeile
  setReportHeaderFooter(outfile, g_nloc, true, true, true);

  // Übergibt selektierte Modelle an die Funktion
  ocurrmodels.value = find_model();
  if(ocurrmodels.value==null) {
    return false;
  }

  bfirstmodel = true;

  // iteriert über alle selektierten Modelle
  for (var i1 = 0 ; i1 < ocurrmodels.value.length ; i1++ ){
    ocurrmodel.value = ocurrmodels.value[i1];

    // Abfrage des Modelltyps
    switch(ocurrmodel.value.OrgModelTypeNum()) {        // TANR 216764
      case Constants.MT_EEPC:
      case Constants.MT_EEPC_MAT:
      case Constants.MT_EEPC_COLUMN:
      case Constants.MT_EEPC_ROW:
      case Constants.MT_EEPC_TAB:
      case Constants.MT_EEPC_TAB_HORIZONTAL:
      case Constants.MT_IND_PROC:
      case Constants.MT_OFFICE_PROC:
      case Constants.MT_PRCS_CHN_DGM:
      case Constants.MT_PCD_MAT:

        // Seitenumbruch
        if (bfirstmodel) {
          bfirstmodel = false;
        } else {
          outfile.OutputField(Constants.FIELD_NEWPAGE, getString("TEXT22"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER);
        }

        // Initialisiert die Felder
        initialobject(outfile, ocurrmodel.value);
        // Zeilenfeld initialisieren
        rows = new Array();
        berror.value = true;
        
        // Kreiert die Zeilenstruktur des Modells
        build_structure(outfile, ocurrmodel, rows, berror);
/*        
        //THA added (TANR 144525)
        if(rows[0].columns.length==0)
        {
            Dialogs.MsgBox(getString("TEXT21"), Constants.MSGBOX_BTN_OK, getString("TEXT23"));
            return false;
        }
*/        
        if (berror.value) {
          set_columnsize(rows);

          dummy_output(outfile, rows, ocurrmodel.value, bLinkedModels);
          // Ausgabe der Funktionen mit Beschreibungen
          if (bFuncDesc) {
            func_description(outfile, ocurrmodel.value);
          }
        }
      break;
    }
  }

  // Kreiert die Ausgabedokumente
  outfile.WriteReport(Context.getSelectedPath(), Context.getSelectedFile());

  if (berror.value) {
    if (Context.getSelectedFormat() == Constants.OUTWORD) {
      // Nachformatierung des Worddokumentes
      //formatdocument(Context.getSelectedPath(), Context.getSelectedFile());
    }
  }

  return true;
}




// Byval
function initialobject(outfile, ocurrmodel)
{
  // Looparray wird intialisiert
  g_oloopobj = new Array();         // Loopobjekte

//  g_oloopobj[0].osource = new __ObjOccDummy();
//  g_oloopobj[0].otarget = new __ObjOccDummy();

  // output of the model name
  outfile.OutputLn((txtModelName + " : " + ocurrmodel.Name(g_nloc)), getString("TEXT22"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
  outfile.OutputLn("", getString("TEXT22"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
  outfile.OutputLn("", getString("TEXT22"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
}




function find_model()
{
  var __functionResult = null;

  var omodels = ArisData.getSelectedModels();
  if (omodels.length > 0) {
    __functionResult = omodels;
  } else {
    Dialogs.MsgBox(txtNoModelSelected, Constants.MSGBOX_BTN_OK, getString("TEXT23"));
    __functionResult = null;
  }
  return __functionResult;
}




function check_sameobj(orows)
{
  var __functionResult = false;
  // Funktion testet wie oft ein Objekt in einer Zeile vorkommt

  var rowcount = 0; 
  var comparesize = 0; 

  var orowobjs = new Array();

  for (var i1 = 0 ; i1 < orows.columns.length ; i1++ ){
    orowobjs[orowobjs.length] = orows.columns[i1].ocolumnobj;
  }

  if (orowobjs.length != 0) {
    rowcount = orowobjs.length;
    orowobjs = ArisData.Unique(orowobjs);
    comparesize = orowobjs.length;
    if (rowcount == comparesize) {
      __functionResult = true;
    } else {
      __functionResult = false;
    }
  }

  return __functionResult;
}




// byval oObj ersetzt
function succesorrow(orows, boutput, oobj, icolumnpos)
{
  var __functionResult = 0;
  var inewcolumnsize = 0;
  var icolumnsize = 0;  // MWZ, 26.03.07
  
  for (var i1 = 0 ; i1 < orows.value.columns.length ; i1++ ) {
    var iincxns = oobj.InDegree(Constants.EDGES_ALL);

    if (orows.value.columns[i1].boutputobject) {
      var osuccessors = find_successor(orows.value.columns[i1].ocolumnobj);
      if (osuccessors.length != 0) {
        var isplit = check_split(new __holder(orows.value.columns[i1].ocolumnobj));
        for (var i2 = 0 ; i2 < osuccessors.length ; i2++ ){
          if (oobj.IsEqual(osuccessors[i2])) {
            if (orows.value.columns[i1].ieditcolumnsize > 1) {  // MWZ, 26.03.07    
            // Änderung eingefügt 0 durch 1 ersetzt 30.11
              icolumnsize = icolumnsize + (orows.value.columns[i1].icolumnsize / isplit);   // MWZ, 26.03.07
              inewcolumnsize = icolumnsize + check_neighbourobj(orows.value.columns[i1].ocolumnobj, orows, i1, icolumnpos);
              if (orows.value.columns[i1].ieditcolumnsize > 1) {
                edit_columnsize(orows, (orows.value.columns[i1].icolumnsize / isplit), i1);  // Änderung04.12
              }
              if(! (iincxns > 1 && boutput)) {
                __functionResult = inewcolumnsize;
                return __functionResult;
              }
            }
          }
        }
      }
    }
    else {
      if (oobj.IsEqual(orows.value.columns[i1].ocolumnobj)) {
        if (orows.value.columns[i1].ieditcolumnsize > 1) {
        // Änderung eingefügt 0 durch 1 ersetzt 30.11
          var icolumnsize = icolumnsize + orows.value.columns[i1].icolumnsize;
          inewcolumnsize = icolumnsize + check_neighbourobj(orows.value.columns[i1].ocolumnobj, orows, i1, icolumnpos);
          if (orows.value.columns[i1].ieditcolumnsize > 1) {
            edit_columnsize(orows, icolumnsize, i1);
          }

          if(! (iincxns > 1 && boutput)) {
            __functionResult = inewcolumnsize;
            return __functionResult;
          }
        }
      }
    }
  }

  __functionResult = inewcolumnsize;

  return __functionResult;
}



function check_row(orow)
{
  var __functionResult = 0;
  // prüft in aktueller Zeile alle Objekte auf Nachfolger
  // wenn Objekte keine Nachfolger besitzen werden sie von Spaltenanzahl der Zeile abgezogen

  var counter = orow.columns.length - 1;

  for (var i1 = 0 ; i1 < orow.columns.length ; i1++ ){
    if (orow.columns[i1].boutputobject) {
      var osuccessor = find_successor(orow.columns[i1].ocolumnobj);
      if (osuccessor.length == 0) {
        counter = counter - 1;
      }
    }
  }

  __functionResult = counter;

  return __functionResult;
}




// byval ersetzt oObj
function check_split(oobj)
{
  var __functionResult = 0;

  // Loop_Check
  // Funktion prüft bei einem Split alle Nachfolgeobjekte
  // Loops werden ausgeschlossen

  var lmarke = new __holder(0); 
  var ooutcxns = null; 
  var otargetobj = new __holder(null); 
  var i1 = 0; 
  var counter = 0; 

  lmarke.value = __enum_looptyp_keinloop;
  var isplit = oobj.value.OutDegree(Constants.EDGES_STRUCTURE);
  if (checkloopobj1(oobj, lmarke)) {
    if (lmarke.value == __enum_looptyp_startloop) {
      isplit = oobj.value.OutDegree(Constants.EDGES_STRUCTURE);
      ooutcxns = oobj.value.OutEdges(Constants.EDGES_STRUCTURE);
      for ( i1 = 0 ; i1 < ooutcxns.length ; i1++ ){
        otargetobj.value = ooutcxns[i1].TargetObjOcc();
        lmarke.value = __enum_looptyp_keinloop;
        if (checkloopobj1(otargetobj, lmarke)) {
          if (lmarke.value == __enum_looptyp_startloop) {
          } else if (lmarke.value == __enum_looptyp_zielloop) {
            counter = counter + 1;
          }
        }
        otargetobj.value = null;
      }
      isplit = isplit - counter;
    }
  }

  __functionResult = isplit;

  return __functionResult;
}




function spalte_erzeugen(ocurrobj, ocurrrow, lloopmarke, boutput, isplitcount)
{
  // Beschreibung: Funktion erzeugt eine neuen Spaltenvektor in der aktuellen Zeile
  // d.h. die Spalte der Zeile wird mit Werten gefüllt.
  // 
  // Input value: oCurrObj as aktuelle Objekt
  // oCurrRow als Zeilenfeld()
  // Übergabepara.: s übergibt die aktuelle Spalte
  // oCurrRow übergibt die aktuelle Zeile

  var s = new __usertype_column(); 
  s.ocolumnobj = ocurrobj;
  // aktuelle Objekt
  s.osplitcount = isplitcount;
  // Anzahl der Nachfolger der Vorgängerspalte
  s.llooptype = lloopmarke;
  // zeigt an ob es sich um ein Loopobjekt handelt
  s.boutputobject = boutput;
  // gibt an ob Objekt in der aktuellen Zeile ausgegeben wird

  spalte_hinzufuegen(s, ocurrrow);
}




function zeile_hinzufuegen(ocurrrow, orows)
{
  // Beschreibung: Funktion fügt eine neue Zeile in den Zeilenvektor  ein
  // und erhöht gleichzeitig das Feld um eins.
  // 
  // Input value: oCurrRow as aktuelle Zeile
  // oRows() als Zeilenfeld
  // Übergabepara.: s übergibt die aktuelle Spalte
  // oCurrRow übergibt die aktuelle Zeile

  var oldsize = 0; 

  // Abfrage des Zeilenvektors
  oldsize = orows.length;           // fügt aktuelle Zeile in ZeilenVektor
  orows[oldsize] = ocurrrow;        // erhöht Zeilenvektor um eins
}


function spalte_hinzufuegen(ocurrcolumn, orow)
{
  // Beschreibung: Funktion fügt eine neue Spalte in den Spaltenvektor der aktuellen Zeile
  // ein und erhöht gleichzeitig das Feld um eins.
  // 
  // Input value: oCurrColumn as aktuelle Spalte
  // oRow als Zeilenfeld()
  // Übergabepara.: s übergibt die aktuelle Spalte
  // oCurrRow übergibt die aktuelle Zeile

  var oldsize = 0; 
  // Vektorgröße

  // Abfrage des Spaltenvektor in aktueller Zeile
  oldsize = orow.value.columns.length;
  // fügt aktuelle Spalte in Spaltenvektor
  orow.value.columns[oldsize] = ocurrcolumn;
  // speichert Spaltenzahl zur aktuellen Zeile
  orow.value.columns_number = oldsize;
  // erhöht SpaltenVektor um eins
}


function addlist(osource, otarget)
{
  // Beschreibung: Funktion addiert die Elemente einer Liste zu einer anderen Liste
  // 
  // Input value: oSource als Quellliste
  // oTarget als Zielliste

  for (var i1 = 0 ; i1 < osource.length ; i1++ ){
    otarget[otarget.length] = osource[i1];
  }
}




function checkloopobj1(oobj, lloopmark)
{
  var __functionResult = false;

  // Function CheckLoopObj1
  // this function is used to look if it is an loop object and put a mark.
  // oTargObjOcc = target object
  // oSourObjOcc  = source object

  lloopmark.value = __enum_looptyp_keinloop;
  for (var i1 = 0 ; i1 < g_oloopobj.length ; i1++ ){
    if (oobj.value.IsEqual(g_oloopobj[i1].otarget)) {
      lloopmark.value = __enum_looptyp_zielloop;
      // Zielobjekt
      __functionResult = true;
      break;
    } else if (oobj.value.IsEqual(g_oloopobj[i1].osource)) {
      __functionResult = true;
      lloopmark.value = __enum_looptyp_startloop;
      // Quellobjekt
      break;
    }
  }

  return __functionResult;
}




function iselementinnextlist(ocurrelement, oelements)
{
  var __functionResult = false;

  // Function IsElementInList1 for checking whether the element is contained in the list.
  // Parameter
  // oCurrElement = Current element.
  // oElements = List of the elements.
  // nIndex = Position within the list.

  for (var i1 = 0 ; i1 < oelements.length+1 ; i1++ ) {
    if (ocurrelement.IsEqual(oelements[i1])) {
      __functionResult = true;
      break;
    }
  }

  return __functionResult;
}




function iselementinloopstr(ocurrelement)
{
  var __functionResult = 0;

  var counter = 0; 

  for (var i1 = 0 ; i1 < g_oloopobj.length ; i1++ ){
    if (ocurrelement.value.IsEqual(g_oloopobj[i1].otarget)) {
      counter = counter + 1;
    }
  }
  __functionResult = counter;

  return __functionResult;
}


function isloopstring(outfile, ocurrelement, g_oloopobj, ltype)
{
  var __functionResult = "";

  var soutloopstr = ""; 

  for (var i1 = 0 ; i1 < g_oloopobj.length; i1++ ){
    if (ltype == __enum_looptyp_zielloop) {
      if (ocurrelement.IsEqual(g_oloopobj[i1].otarget)) {
        if (soutloopstr == "") {
          soutloopstr = "-->"+txtLoop + (i1 + 1);
        } else {
          soutloopstr = soutloopstr + "  -->"+txtLoop + (i1 + 1);
        }
      }
    } else if (ltype == __enum_looptyp_startloop) {
      if (ocurrelement.IsEqual(g_oloopobj[i1].osource)) {
        if (soutloopstr == "") {
          soutloopstr = txtLoop + (i1 + 1) + " ---> ";
        } else {
          soutloopstr = soutloopstr + txtLoop + (i1 + 1) + " -->";
        }
      }
    } else {
      g_errortxt = txtNotLoopElement;
      logfile(outfile, g_errortxt);
    }
  }
  __functionResult = soutloopstr;

  return __functionResult;
}




function elementinlistcounter(ocurrelement, oelements)
{
  var __functionResult = 0;
  // Function IsElementInList1 for checking whether the element is contained in the list.
  // Parameter
  // oCurrElement = Current element.
  // oElements = List of the elements.
  // nIndex = Position within the list.

  var counter = 0; 

  for (var i1 = 0 ; i1 < oelements.value.length ; i1++ ){
    if (ocurrelement.value.IsEqual(oelements.value[i1])) {
      counter++;
    }
  }
  __functionResult = counter;

  return __functionResult;
}




function logfile(outfile, stext)
{
  // Beschreibung:Unterfunktion gibt Fehlermeldungen in TextFile aus
  // Input value : sText : Fehlertext der ausgegeben wird
  // Output value: kein Rückgabewert
  outfile.OutputLn(stext, getString("TEXT22"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
}

function searchandreplace(sinstring)
{
    var sstorestring = "" + sinstring;
    sstorestring = doReplace(sstorestring, "\\", "_");
    sstorestring = doReplace(sstorestring, "/", "_");
    sstorestring = doReplace(sstorestring, ":", "_");
    sstorestring = doReplace(sstorestring, "*", "_");
    sstorestring = doReplace(sstorestring, "?", "_");
    sstorestring = doReplace(sstorestring, String.fromCharCode(34), "_");
    sstorestring = doReplace(sstorestring, "<", "_");
    sstorestring = doReplace(sstorestring, ">", "_");
    sstorestring = doReplace(sstorestring, "|", "_");
    return sstorestring;
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

function set_columnsize(rows)
{
  // Beschreibung: Funktion errechnet alle Spaltengrößen der Ausgabe.Die Funktion startet
  // mit der ersten Zeile und errechnet hierfür die Spaltengrößen. Diese
  // werden dann mit der Funktion Rund_Columnwidth() gerundet.Danach werden
  // die weiteren Spaltengrößen aller Zeilen mit Hilfe der Funktion
  // Calculate_ColumnSize() berechnet. Zum Abschluß werden Unregelmäßig-
  // keiten in der Ausgabestruktur durch die Funktion Scaling_Down() be-
  // reinigt.Diese entstehen durch Rundungsfehlern bei der Berechnung der
  // Spaltengröße nach Splits.
  // 
  // Input value:     Rows() as Row d.h die Zeilenstruktur
  // Output value:    r als Row(Zeile)


  // Berechnung der Spaltenbreite der ersten Zeile
  var spaltenanzahl = rows[0].columns.length;
  
  var dfirstwidth = 1;
  if (spaltenanzahl > 0) {        // MWZ, TANR 144525
    dfirstwidth = 100 / spaltenanzahl;
  }
  var spaltengröße = Math.floor(dfirstwidth);

  for (var i1 = 0 ; i1 < rows[0].columns.length ; i1++ ){
    rows[0].columns[i1].icolumnsize = spaltengröße;
    rows[0].columns[i1].ieditcolumnsize = spaltengröße;
  }

  // Rundet erste Zeile
  rund_columnwidth(rows[0]);
  // ------------------------------------------------
  // Berechnung der restlichen Spaltengrößen aller Zeilen

  // Errechnet alle weiteren Spaltengrößen
  calculate_columnsize(rows, 1);
  // Nachkorrektur von Splitts
  // Call Scaling_Down(Rows())
}




function scaling_down(ocurrrow, onextrow)
{
  // Beschreibung: Funktion korrigiert alle Unregelmäßigkeiten in der Struktur, die durch
  // Rundungsfehler in der Spaltenbreitenberechnung nach Splits entstanden
  // sind.Hierzu wird jede neu kreierte Zeile wieder durchlaufen und auf
  // Splits überprüft.Wird ein Split gefunden wird der Rundungsfehler be-
  // stimmt und der Spaltengröße des ersten Nachfolgerobjekt zugeordnet.
  // 
  // Input value:     Rows() as Row d.h die Zeilenstruktur

  var oobj = new __holder(null); 

  for (var i2 = 0 ; i2 < ocurrrow.columns.length ; i2++ ) {
    var isplit = ocurrrow.columns[i2].osplitcount;
    if (isplit > 1) {
      var icolumnwidth = Math.floor(ocurrrow.columns[i2].icolumnsize / isplit);
      var rounding_failure = parseInt(ocurrrow.columns[i2].icolumnsize - (icolumnwidth * isplit));
      oobj.value = ocurrrow.columns[i2].ocolumnobj;
      var osuccessors = find_successor(oobj.value);
      add_columnsize(osuccessors, onextrow, rounding_failure);
    }
  }
}




function rund_row(ocurrrow)
{
  var icolumnsize = 0; 

  for (var i1 = 0 ; i1 < ocurrrow.columns.length; i1++ ){
    icolumnsize = icolumnsize + ocurrrow.columns[i1].icolumnsize;
  }

  var icomparesize = icolumnsize - 100;
  if ((icomparesize > 0 && icomparesize < 4)) {
    ocurrrow.columns[i1 - 1].icolumnsize = (ocurrrow.columns[i1 - 1].icolumnsize - icomparesize);
  } else if (icomparesize < 0 && Math.abs(icomparesize) < 4) {
    ocurrrow.columns[i1 - 1].icolumnsize = (ocurrrow.columns[i1 - 1].icolumnsize + icomparesize);
  }
}




function calculate_columnsize(rows, start)
{
  // Beschreibung: In dieser Funktion erfolgt die eigentliche Splatenberechnung der
  // ganzen Struktur.Die Berechnung startet immer an der jeweiligen
  // Stelle in der Struktur wo der Aufruf erfolgt. Dies kann am Anfang oder
  // in der Struktur sein.
  // Der Ablauf der Funktion ist wie folgt:
  // Gestartet wird mit dem ersten Element der aktuellen Zeile.Hiervon
  // werden dann die Vorgänger mit Hilfe der Funktion Find_Predecessor()
  // ermittelt. Gleichzeitig wird noch überprüft ob das aktuelle Objekt ein
  // Ausgabeobjekt ist und gespeichert.
  // Danach wird mit der Funktion SameObject() geprüft ob das Objekt in der
  // VorgängerZeile steht(d.h.Objekt ist kein Ausgabeobjekt und wird wieder-
  // holt), wenn ja wird die Splatengröße übernommen.
  // Liefert diese Funktion die Spaltengröße 0 oder das Objekt ist ein
  // Ausgabeobjekt,so wird die Funktion Search_ColumnSize aufgerufen.
  // Diese ererchnet dann die Spaltengröße des aktuellen Objekt.
  // Zusätzlich wird der errechnete Spaltengröße als EditSize gespeichert.
  // Dieser Wert dient zu Kontrolle und wird verrechnet wenn die nächste
  // Nachfolgerspalte kreiert wird. Der Wert welcher der neuen Spalte zuge-
  // ordnet wurde wird dem Editsize abgezogen. Dies verhindert das, Spalten-
  // größen mehrfach verrechnet werden.
  // 
  // Input value:     Rows() as Row d.h die Zeilenstruktur

  var opredecessors = null;   // Vorgänger
  var i2 = new __holder(0); 
  var boutput = false; 

  for (var i1 = start ; i1 < rows.length ; i1++ ){
    var bsuccesor = false;
    for ( i2.value = 0 ; i2.value < rows[i1].columns.length ; i2.value++ ){
      var oobj = rows[i1].columns[i2.value].ocolumnobj;
      // Überprüfung ob Ausgabeflag gesetzt ist
      // bOutputObject = 1 => Ausgabeobjekt
      if (rows[i1].columns[i2.value].boutputobject) {
        boutput = true;
      } else {
        boutput = false;
      }

      // Prüfung ob ein Objekt in einer Zeile mehrfach vorkommt
      // wenn ja wird neue Zeile über die Vorgänger der Zeilenobjekte erzeugt
      if (check_sameobj(rows[i1])) {
        // Findet Vorgänger des aktuellen Objektes
        if (oobj.ObjDef().TypeNum() == Constants.OT_FUNC && g_bsequencevents) {
          opredecessors = find_predecessor_func(oobj);
        } else {
          opredecessors = find_predecessor(oobj);
        }

        // Findet das aktuelle Objekt in der Vorgängerzeile,falls Objekt
        // wiederholt wird (nur Objekte mit Ausgabeflag = 0 können mehrfach in der Zeile vorkommen)
        var _row = rows[i1];
        var h_row = new __holder(rows[i1 - 1]);
        _row.columns[i2.value].icolumnsize = (_row.columns[i2.value].icolumnsize + sameobject(oobj, h_row , boutput, i2));
        rows[i1 - 1] = h_row.value;
        // Ist Rows(i1).Columns(i2).iColumnSize= 0 oder akt. Objekt ist ein Ausgabeobjekt
        if (_row.columns[i2.value].icolumnsize <= 1 || boutput) {
          // Errechnet die Spaltenbreite des aktuellen Objketes
          h_row = new __holder(rows[i1 - 1]);
          _row.columns[i2.value].icolumnsize += search_columnsize(boutput, opredecessors, h_row, i2, 1);
          rows[i1 - 1] = h_row.value;
        }
        _row.columns[i2.value].ieditcolumnsize = _row.columns[i2.value].icolumnsize;
      }
      else {
        var _row = rows[i1]
        // Spalte wird über die Nachfolger der Vorgängerspalte erzeugt
        // (Objekte kommen mehrfach in einer Zeile vor)
        bsuccesor = true;
        var h_row = new __holder(rows[i1 - 1]);
        _row.columns[i2.value].icolumnsize      = (_row.columns[i2.value].icolumnsize + succesorrow(h_row, boutput, oobj, i2));
        rows[i1 - 1] = h_row.value;
        _row.columns[i2.value].ieditcolumnsize  = _row.columns[i2.value].icolumnsize;
      }
    }
    if(i1 < rows.length-1) {
        var h_row = new __holder(rows[i1 + 1]);
        scaling_down(rows[i1],h_row);
        rows[i1 + 1] = h_row.value;
    }
    rund_row(rows[i1]);
  }
}




// Byval oObj ersetzt
function sameobject(oobj, ocurrrow, boutput, icolumnpos)
{
  var __functionResult = 0;
  // Beschreibung: Funktion prüft ob das aktuelle Objekt in der Vorgängerzeile steht.
  // Dies ist der Fall wenn das Objekt kein Ausgabeobjekt ist und wiederholt
  // wird.Trifft dies zu wird die Spaltengröße des Objekt zurückgeliefert.
  // Zusätzlich wird die Funktion  Check_NeighbourObj() aufgerufen , die
  // prüft ob Nachbarobjekte in dr Zeile enden.
  // 
  // Input value:     oObj as Object,oCurrRow als die VorgängerZeile des Objektes
  // bOutput as boolean gibt an ob das Objekt ein Ausgabeobjekt ist
  // iColumnpos as long- die Position des Objketes in der Struktur hier
  // in der gleichen Zeile
  // Output value:    Spaltenbreite

  var inewcolumnsize = 0; 

  if (ocurrrow.value.columns.length > 0) {
    // Liste von nächsten Objekten wird erzeugt
    for (var i1 = 0 ; i1 < ocurrrow.value.columns.length; i1++ ){
      if (oobj.IsEqual(ocurrrow.value.columns[i1].ocolumnobj)) {
        if (ocurrrow.value.columns[i1].ieditcolumnsize >= 1) {
          var icolumnsize = ocurrrow.value.columns[i1].icolumnsize;
          inewcolumnsize = inewcolumnsize + icolumnsize + check_neighbourobj(ocurrrow.value.columns[i1].ocolumnobj, ocurrrow, i1, icolumnpos);
          if (ocurrrow.value.columns[i1].ieditcolumnsize > 0) {
            edit_columnsize(ocurrrow, ocurrrow.value.columns[i1].icolumnsize, i1);
          }
          if (! boutput) {
            __functionResult = inewcolumnsize;
            break;
          }
        }
      }
    }
  }

  __functionResult = inewcolumnsize;

  return __functionResult;
}




// byval oPredecessors ersetzt
function search_columnsize(boutput, opredecessors, orow, icolumnpos, icountsameobj)
{
  var __functionResult = 0;
  // Beschreibung: Die Funktion errechnet die Spaltenbreite des aktuellen Objektes.
  // Hierfür werden die Vorgänger des Objektes mit der Vorgängerzeile auf
  // Gleichheit geprüft. Sind sie gleich werden noch die Nachbarobjekte
  // mit der Funktion Check_NeighbourObj()überprüft,d.h. es wird untersucht
  // ob sie in der Zeile enden ober einen Rücksprung haben.Wenn ja liefert
  // diese Funktion deren Größe zurück.
  // Diese wird dann der Objektspaltenbreite des aktuellen Objektes
  // hinzuaddiert.
  // Zusätzlich wird der Splitcount des Vorgängerobjektes untersucht. Ist
  // dieser > 1 so wird die Spaltenbreite noch durch den Split geteilt.
  // Ist das aktuelle Objekt kein Ausgabeobjekt wird die Funktion nur einmal
  // ausgeführt wenn eine Übereinstimmung war. Nur bei Ausgabeobjekten  wird
  // zusätzlich eine Zusammenfassung doppelter Objekte erreicht, da die
  // Funktion über alle Nachfolger läuft.
  // Input value: bOutput : gibt an ob aktuelles Objekt ein Ausgabeobjekt ist
  // oPredeccessors : sind die Vorgängerobjekte des akt. Objektes
  // row : ist die Vorgängerzeile der Zeile in der das jetzt zu bearbeitende
  // Objekt steht
  // iColumnpos: ist die Position des aktuellen Objektes in dessen Zeile
  // icountSameObj: Ist die Anzahl der gleichen Objekte in einer Zeile
  // 
  // Output value: errechnete Spaltengröße

  var inewcolumnsize = 0; 

  inewcolumnsize = 0;
  // Über alle Vorgänger

  for (var i1 = 0 ; i1 < opredecessors.length; i1++ ){
    // Über alle Objekte der Vorgängerzeile
    for (var i2 = 0 ; i2 < orow.value.columns.length ; i2++ ){
      // Ist Vorgänger gleich eienm Element in der Vorgängerseite
      if (opredecessors[i1].IsEqual(orow.value.columns[i2].ocolumnobj)) {
        // Ist Spaltengröße des Vorgänger noch nicht abgefragt worden
        if (orow.value.columns[i2].ieditcolumnsize >= 1) {
          // iSplit = oRow.Columns(i2).oSplitcount Änderung 03.12 ersetzt durch
          var h_ocolumnobj = new __holder(orow.value.columns[i2].ocolumnobj);
          var isplit = check_split(h_ocolumnobj);
          orow.value.columns[i2].ocolumnobj = h_ocolumnobj.value;
          // 03.12
          var icolumnsize = Math.floor(orow.value.columns[i2].icolumnsize / isplit);
          // Funktion prüft Objekte auf ihre Nachbarn
          var ineighboursize = check_neighbourobj(orow.value.columns[i2].ocolumnobj, orow, i2, icolumnpos);
          // addiert die Spaltenbreiten von Nachbarobjekten hinzu
          icolumnsize = icolumnsize + ineighboursize;
          inewcolumnsize = inewcolumnsize + icolumnsize;
          // Subrahiert die verarbeitete Spaltenbreite von dem iEditColumnSize-Wert
          edit_columnsize(orow, (icolumnsize - ineighboursize), i2);
          // Ist aktuelles Objekt kein Ausgabeobjekt wird die Funktion hier abgebrochen
          if (! boutput) {
            __functionResult = inewcolumnsize;
            return __functionResult;
          }
        }
      }
    }
  }
  __functionResult = inewcolumnsize;

  return __functionResult;
}




// ByVal oSuccessors
function add_columnsize(osuccessors, orow, rundungsfehler)
{
  for (var i1 = 0 ; i1 < osuccessors.length ; i1++ ) {
    for (var i2 = 0 ; i2 < orow.value.columns.length ; i2++ ){
      if (osuccessors[i1].IsEqual(orow.value.columns[i2].ocolumnobj)) {
        orow.value.columns[i2].icolumnsize += rundungsfehler;
        orow.value.columns[i2].ieditcolumnsize = (orow.value.columns[i2].icolumnsize + rundungsfehler);
        return;
      }
    }
  }
}




function rund_columnwidth(ocurrrow)
{
  // rundet auf 100 Prozent, indem man der letzten Spalte den Restbetrag zuaddiert
  if (ocurrrow.columns.length > 0) {        // MWZ, TANR 144525
  
      var owidth = 0; 
      for (var i1 = 0 ; i1 < ocurrrow.columns.length ; i1++ ){
        owidth = owidth + ocurrrow.columns[i1].icolumnsize;
      }
    
      var bcheck = 100 - owidth;
    
      if (bcheck > 0) {
        ocurrrow.columns[ocurrrow.columns.length-1].icolumnsize     += bcheck;
        ocurrrow.columns[ocurrrow.columns.length-1].ieditcolumnsize += bcheck;
      }
  }
}



// Byval ersetzt
function find_successor(ocurrobj)
{
  var __functionResult = null;

  // Beschreibung: Funktion sucht alle Nachfolger eines Objektes und schreibt diese in
  // eine Nachfolgerliste. Diese werden noch nach ihrer x-Position
  // sortiert.
  // 
  // Input value:    oCurrObj als Objekt (akt. Objekt)
  // Output value:   Nachfolgerliste as Objekt

  var llooptyp = new __holder(0); 
  var llooptyp1 = new __holder(0); 
  var osuccessors = new __holder(null); 

  llooptyp.value = __enum_looptyp_keinloop;
  llooptyp1.value = __enum_looptyp_keinloop;
  osuccessors.value = new Array();
  
/*  
  var ooutcxns = ocurrobj.OutEdges(Constants.EDGES_STRUCTURE);

  if (ooutcxns.length != 0) {
    for (var i1 = 0 ; i1 < ooutcxns.length ; i1++ ){
//      checkloopobj1(ocurrobj, llooptyp1);
      checkloopobj1(new __holder(ocurrobj), llooptyp1); // MWZ(28.07.06) - TANR 201536, CallID 125792
      checkloopobj1(new __holder(ooutcxns[i1].TargetObjOcc()), llooptyp);
      if (! (llooptyp.value == __enum_looptyp_zielloop&& llooptyp1.value == __enum_looptyp_startloop)) {
        osuccessors.value[osuccessors.value.length] = ooutcxns[i1].TargetObjOcc();
      }
    }
  }
*/

  // Anubis 403853  
  var oSuccObjOccs = getSuccessorObjects(ocurrobj);
  if (oSuccObjOccs.length != 0) {
    for (var i1 = 0; i1 < oSuccObjOccs.length; i1++) { 
      var oSuccObjOcc = oSuccObjOccs[i1] ;  
      checkloopobj1(new __holder(ocurrobj), llooptyp1); // MWZ(28.07.06) - TANR 201536, CallID 125792
      checkloopobj1(new __holder(oSuccObjOcc), llooptyp);
      if (! (llooptyp.value == __enum_looptyp_zielloop&& llooptyp1.value == __enum_looptyp_startloop)) {
        osuccessors.value[osuccessors.value.length] = oSuccObjOcc;
      }
    }
  }
  
  osuccessors.value = getSortedList(osuccessors.value);
  __functionResult = osuccessors.value;

  return __functionResult;
  
  function getSuccessorObjects(ocurrobj) {
      var oSuccessorObjects = new Array();
      var ooutcxns = ocurrobj.OutEdges(Constants.EDGES_STRUCTURE);
      for (var i = 0; i < ooutcxns.length; i++) {
          var oTargetObjOcc = ooutcxns[i].TargetObjOcc();
          oSuccessorObjects.push(oTargetObjOcc);
          
          if (g_bsequencevents && oTargetObjOcc.ObjDef().TypeNum() == Constants.OT_EVT) {
              var ooutcxns2 = oTargetObjOcc.OutEdges(Constants.EDGES_STRUCTURE);
              for (var j = 0; j < ooutcxns2.length; j++) {
                  var oTargetObjOcc2 = ooutcxns2[j].TargetObjOcc();
                  if (oTargetObjOcc2.ObjDef().TypeNum() == Constants.OT_FUNC) {
                      oSuccessorObjects.push(oTargetObjOcc2);
                  }
              }                    
          }
      }
      return oSuccessorObjects;
  }  
}



// ByVal ersetzt oCurrObj
function find_predecessor(ocurrobj)
{
  var __functionResult = null;
  // Beschreibung: Funktion sucht alle Vorgänger eines Objektes und schreibt diese in
  // eine Vorgängerliste. Diese werden noch nach ihrer x-Position
  // sortiert.
  // 
  // Input value:    oCurrObj als Objekt (akt. Objekt)
  // Output value:   Vorgängerliste as Objekt

  var opredecessors = new __holder(null); 
  opredecessors.value = new Array();
  var oincxns = ocurrobj.InEdges(Constants.EDGES_STRUCTURE);

  if (oincxns.length != 0) {
    for (var i1 = 0 ; i1 < oincxns.length ; i1++ ){
      opredecessors.value[opredecessors.value.length] = oincxns[i1].SourceObjOcc();
    }
  }
  opredecessors.value = getSortedList(opredecessors.value);
  __functionResult = opredecessors.value;

  return __functionResult;
}




// ByVal oCurrObj
function find_predecessor_func(ocurrobj)
{
  var __functionResult = null;

  var opredecessors = new __holder(null); 
  opredecessors.value = new Array();

  var oincxns = ocurrobj.InEdges(Constants.EDGES_STRUCTURE);

  if (oincxns.length != 0) {
    for (var i1 = 0 ; i1 < oincxns.length ; i1++ ){
      var osourceobj = oincxns[i1].SourceObjOcc();
      if (osourceobj.ObjDef().TypeNum() == Constants.OT_EVT) {
        var oinevcxns = osourceobj.InEdges(Constants.EDGES_STRUCTURE);
        if (oinevcxns.length != 0) {
          for (var i2 = 0 ; i2 < oinevcxns.length ; i2++ ){
            if (oinevcxns[i2].SourceObjOcc().ObjDef().TypeNum() == Constants.OT_FUNC) {             // MWZ, TANR: 242283
              opredecessors.value[opredecessors.value.length] = oinevcxns[i2].SourceObjOcc();       // MWZ, TANR: 242283
            } else {
              opredecessors.value[opredecessors.value.length] = osourceobj;
            }
          }
        } else {
          opredecessors.value[opredecessors.value.length] = osourceobj;
        }
      } else {
        opredecessors.value[opredecessors.value.length] = osourceobj;
      }
    }
  }
  opredecessors.value = getSortedList(opredecessors.value);
  __functionResult = opredecessors.value;

  return __functionResult;
}




// Byval oColumnObj ersetzt
function check_neighbourobj(ocolumnobj, orow, neighbourpos, icolumnpos)
{
  var __functionResult = 0;
  // Beschreibung: Funktion überprüft die Spaltenposition des aktuellen Objektes in der
  // Zeile. Ist sie Null, d.h. es ist das erste Objekt,welches Nachfolger
  // in der nächsten Zeile hat,so wird prüft die Funktion Check_Neighbours
  // nach links und rechts alle Nachfolgerobjekte auf End- oder Loopobjekte.
  // Wenn nicht Null, so werden nur die Nachfolgerobjekte nach rechts ge-
  // prüft.
  // 
  // Input value: oCurrObj als Objekt (akt. Objekt) ,oRow als Vorgängerzeile des akt.
  // Objektes
  // neigbourspos als Integer ist die Position des NachfolgeObjektes in
  // der Nachfolgerspalte
  // iColumnpos als Integer als Position des aktuellen Objektes in der
  // aktuellen Zeile
  // Output value:Spaltengröße als Long

  var icolumnsize = 0; 
  if (icolumnpos.value == 0) {
    // linke Nachbarn
    icolumnsize = check_neighbors(orow, (neighbourpos - 1), - 1, 0);
  }

  // rechte Nachbarn
  icolumnsize = icolumnsize + check_neighbors(orow, (neighbourpos + 1), 1, orow.value.columns.length-1);

  __functionResult = icolumnsize;

  return __functionResult;
}




function check_neighbors(orow, pos, direction, stoppoint)
{
  var __functionResult = 0;
  // Beschreibung: Funktion überprüft alle Nachfolger der Nachfolgerzeile ob sie Nach-
  // folgerobjekte haben oder Ende- oder Loopobjkete sind.
  // Wird ein End- oder Loopobjekt gefunden, so wird dessen Splategröße zu-
  // rüchgeliefert.Die Richtung und die Startposition für die Abarbeitung
  // der Zeile wird über die Funktion Check_NeighbourObj() bestimmt.
  // 
  // Input value: Row als Row Nachfolgerzeile des zu prüfenden Objektes
  // pos ist die Position des Nachfolgeobjektes in der Nachfolgerzeile
  // direction als eigenschaft der For Schleife (-1 zählt sie rückwärts
  // +1 zählt die For-Schleife vorwärts)
  // stopPoint ende der For- Schleife
  // Output value:   iSize as long (Spaltengröße)

  var oobj = new __holder(null);    
  var osuccessors = null; 
  var i = 0; 
  var icolumnsize = 0; 

//  for(var i = pos; i!=stoppoint; i+=direction) {
  for(var i = pos; (direction<0&&i>=stoppoint) || (direction>0&&i<=stoppoint); i+=direction) {
    // If oRow.Columns(i).bOutputObject Then 'Änderung 30.11.01
    oobj = orow.value.columns[i].ocolumnobj;
    osuccessors = find_successor(oobj);

    if (osuccessors.length == 0) {
      if (orow.value.columns[i].ieditcolumnsize >= 1) {
        icolumnsize = icolumnsize + orow.value.columns[i].icolumnsize;
        edit_columnsize(orow, orow.value.columns[i].icolumnsize, i);
      }
    }
    else {
      break;
    }
  }
  __functionResult = icolumnsize;

  return __functionResult;
}




function edit_columnsize(ocurrrow, isize, pos)
{
  // Beschreibung: Funktion subtrahiert die Spaltengröße wenn Objekt schon bearbeitet
  // wurde.
  // 
  // Input value:    oCurrObj als Objekt (akt. Objekt)
  // Row als Row ,pos als Objketposition

  // Spaltenbreite wird von der EditColumnsize subtrahiert, d. h. Objekt wurde bereits bearbeitet
  ocurrrow.value.columns[pos].ieditcolumnsize -= isize;
}



// Byval ersetzt oCurrModel
function build_structure(outfile, ocurrmodel, rows, berror)
{
  // Beschreibung: Funktion erstellt die Struktur der EPK.
  // Hierfür werden zuerst alle Loopobjekte in der EPK ermittelt.
  // Hierbei wird die EPK auf Objekte geprüft.
  // Dann werden die Startobjekte gesucht und die erste Zeile kreiert.
  // In der While Schleife wird die gesamte Struktur erstellt.
  // Hiefür werden jeweils die Nachfolgeobjekte der zuletzt kreierten Zeile
  // ermittelt. Werden keine Nachfolgeobjekte mehr gefunden so sind wir am
  // Ende der EPK angelangt und die While- Schleife wird beendet,d.h als
  // Abbruchbedingung dienen die nachfolgenden Objekte.
  // In der Schleife wird über die Funktion Search_NextRow die neue Zeile
  // erstellt.
  // Input value:     oModel  als aktulles Modell
  // oRows als Zeilenvektor
  // Output value:    r als Row(Zeile)

  var ocurrrow = new __holder(new __usertype_row()); 
  var counter = 0; 

  // Ermittlung der Loopobjekte
  if (! checkloop(outfile, ocurrmodel)) {
    // Erste Zeile wird kreiert
    ocurrrow.value = find_firstrow(outfile, ocurrmodel, rows);
    // solange Nachfolger
    counter = 0;
    // solange Nachfolgeobjekte der aktuellen Zeile existieren wird die Schleife wiederholt
    // Check_NextObjs liefert eine Liste der Nachfolgeobjekte der aktuellen Zeile zurück

    while ((check_nextobjs(ocurrrow.value))) {
      counter = counter + 1;
      if (counter == 200) {
        g_errortxt = txtErrorAborted;
        logfile(outfile, g_errortxt);
        berror.value = false;
        break;
      }

      ocurrrow.value = search_nextrow(ocurrrow, true);
      zeile_hinzufuegen(ocurrrow.value, rows);
    }
  } else {
    // Ein Fehler ist in der Loopsuche aufgetreten ;Funktion endet ; Fehlertext wird ausgegeben
    g_errortxt = txtErrorInLoopSearch;
    logfile(outfile, g_errortxt);
    berror.value = false;
  }
}




function check_nextobjs(orow)
{
  var __functionResult = false;

  // Beschreibung: Funktion prüft Objekte der aktuellen Zeile nach Nachfolgeobjekte und
  // liefert einen Boolschen Wert zurück.
  // Nur wenn Funktion True zurück liefert wird im Funktionsbaum weiter
  // abgearbeitet.
  // Sind keine Nachfolgeobjekte enthalten liefert die Funktion False zurück
  // Wenn vorhanden werden für alle Nachfolgeobjekte die Anzahl der aus-
  // gehenden Kanten ermittelt.Ist diese Null wird zum nächsten Objekt ge-
  // gangen.Ist es 1 wird geprüft ob Nachfolgeobjekt ein Startobjekt oder
  // ein LoopObjekt ist.Trifft dies zu liefert die Funktion False zurück.
  // Ist die Anzahl der ausgehenden Kanten eines Objektes > 1, dann wird
  // die Funktion abgebrochen und liefert true zurück.
  // 
  // Input value: oRow  als aktulle Zeile

  var lmarke = new __holder(0); 
  var oobj = new __holder(null); 
  var bcheck = false; 
  var bnextobjs = false; 
  var lnumber = 0; 

  lmarke.value = __enum_looptyp_keinloop;
  bnextobjs = false;
  for (var i1 = 0 ; i1 < orow.columns.length ; i1++ ){
    oobj.value = orow.columns[i1].ocolumnobj;
    var ooutcxns = oobj.value.OutEdges(Constants.EDGES_STRUCTURE);
    if (ooutcxns.length > 0) {
      lnumber = oobj.value.OutDegree(Constants.EDGES_STRUCTURE);
      if (lnumber > 1) {
        bnextobjs = true;
        break;
      } else if (lnumber == 1) {
        bcheck = checkloopobj1(oobj, lmarke);
        if (lmarke.value == __enum_looptyp_startloop) {
          bnextobjs = false;
        } else {
          bnextobjs = true;
          break;
        }
      }
    }
  }

  __functionResult = bnextobjs;

  return __functionResult;
}



function find_firstrow(outfile, omodel, orows)
{
  var __functionResult = new __usertype_row();

  // Beschreibung: Funktion ermittelt die erste Zeile. Hierfür werden alle Startobjekte
  // mit Hilfe der Funktion Search_StartObj ermittelt. Diese werden dann
  // in die Spalten eingetragen und eine neue Zeile im Zeilenvektor angelegt
  // Input value:     oModel  als aktulles Modell
  // oRows als Zeilenvektor
  // Output value:    r als Row(Zeile)
  // Funktionsaufruf.: Search_StartObj; Spalte_erzeugen;Zeile_hinzufuegen

  var r = new __holder(new __usertype_row()); 
  var ostartoccs = new __holder(null); 
  var bsearch = new __holder(false); 
  var lmarke = __enum_looptyp_keinloop;

  ostartoccs.value = new Array();
  // Spaltenfeld in der Zeile initialisieren

  // ReDim r.Columns(0)
  r.value.columns = new Array();

  search_startobj(outfile, omodel.value, ostartoccs, bsearch);

  if (bsearch.value) {
    // Iteration über alle Startobjekte
    for (var i1 = 0 ; i1 < ostartoccs.value.length ; i1++ ){
      var isplitcount = 1;
      // kein Split
      var boutput = true;
      // Zeigt das es sich um ein Ausgabeobjekt handelt

      // Funktion legt für aktuelles Startobjekt eine Spalte an
      spalte_erzeugen(ostartoccs.value[i1], r, lmarke, boutput, isplitcount);
    }

    // Funktion erzeugt eine neue Zeile, hier erste Zeile
    zeile_hinzufuegen(r.value, orows);
  }
  else {
    g_errortxt = txtNoStartObjInModel;
    logfile(outfile, g_errortxt);
  }

  __functionResult = r.value;

  return __functionResult;
}





// ByVal oModel
function search_startobj(outfile, omodel, ostartoccs, bsearch)
{
  // Beschreibung: Funktion prüft alle Objekte eines Modells auf eingehende Kanten.
  // Werden Objekte ohne eingehende Kanten gefunden (gleichbedeutend mit
  // Startobjekten)aber gleichzeitig mit ausgehenden Kanten, werden diese
  // in eine Liste geschrieben und mit der Funktion 'getSortedList' nach ihrer
  // x-Position geordnet.Die Funktion liefert die sortierte Liste der Start
  // Objekte und einen boolschen Ausdruck (True für gefunden) an die
  // an die Funktion Find_First_Row() zurück.
  // Input value: oModel als Modell
  // oStartOccs als Liste der Startobjekten
  // bsearch gibt an ob Startobjekte vorhanden sind
  // Übergabepara.: s übergibt die aktuelle Spalte
  // oCurrRow übergibt die aktuelle Zeile

  var ocurroccs = omodel.ObjOccList();
  bsearch.value = false;

  if (ocurroccs.length > 0) {
    bsearch.value = true;
    for (var i1 = 0 ; i1 < ocurroccs.length ; i1++ ){
      var ocurrocc = ocurroccs[i1];
      // inEdges = oCurrOcc.InDegree(EDGES_ALL)
      var inedges = ocurrocc.InDegree(Constants.EDGES_STRUCTURE);
      // MWZ, TANR: 30786
      var outedges = ocurrocc.OutDegree(Constants.EDGES_STRUCTURE);
      if (inedges == 0 && outedges > 0) {
        ostartoccs.value[ostartoccs.value.length] = ocurrocc;
      }
    }
  }
//  else {
  if (ostartoccs.value.length == 0) {    // MWZ, TANR 144525
    g_errortxt = txtNoStartObjFound;
    logfile(outfile, g_errortxt);
  }
  // BLUE-13269 Sort start objects according to their x position - as described in comment above
  ostartoccs.value = ostartoccs.value.sort(new ArraySortComparator(Constants.SORT_X, Constants.SORT_Y, Constants.SORT_NONE, g_nloc).compare);  

  //ostartoccs.value = getSortedList(ostartoccs.value);
}


function getSortedList(p_aObjOccList) {
    // Description	: Objects are sorted by their (vertical) y-position and (horizontal) x-position in the model                   
    // Input value  : Object list as object                                                      
    // Output value : Object list as object                                                      
    
    // MWZ, TANR 89361
    return p_aObjOccList.sort(new ArraySortComparator(Constants.SORT_Y, Constants.SORT_X, Constants.SORT_NONE, g_nloc).compare);
}


function nextoutput(ocurrrow)
{
  var __functionResult = null;
  // Beschreibung: Funktion schreibt alle Ausgabeobjekte einer Zeile in eine Liste
  // Funktion prüft alle Objekte einer Zeile auf ihr Ausgabeflag. Ist dieses
  // True,so wird das Objekt in eine Liste geschrieben.
  // 
  // Input value : oCurrRow As Row
  // Output value: Liste as object
  // Übergabepara.:

  var ocolumnsobjs = new Array();

  if (ocurrrow.value.columns.length > 0) {
    // Liste von nächsten Objekten wird erzeugt
    for (var i1 = 0 ; i1 < ocurrrow.value.columns.length ; i1++ ){
      if (ocurrrow.value.columns[i1].boutputobject) {
        var oobj = ocurrrow.value.columns[i1].ocolumnobj;
        ocolumnsobjs[ocolumnsobjs.length] = oobj;
      }
    }
  }

  __functionResult = ocolumnsobjs;

  return __functionResult;
}




// ByVal oCurrObj
function find_nextobj(ocurrobj)
{
  var __functionResult = null;

  // Beschreibung: Sucht und prüft die Folgeobjekte von Ausgabeobjekten
  // Funktion prüft das aktuelle Objekt und das Nachfolgeobjekte. Ist Objekt
  // vom Typ Funktion und das Folgeobjekt ein Ereignis,wird das Folgeobjekt
  // des Ereignis ermittelt. Ist diese wiederum eine Funktion wird diese
  // von der Funktion zurückgeliefert.Sonst wird das Folgeobjekt wieder zu-
  // geliefert.
  // Input value : oCurrObj As object,oNextObj As object
  // Output value: object

  var onextobjs = new __holder(null); 
  var onextobj = new __holder(null); 

  onextobjs.value = new Array();
  var ooutcxns = ocurrobj.value.OutEdges(Constants.EDGES_STRUCTURE);

  if (ooutcxns.length > 0) {
    var bobjcharacter = new __holder(0); 
    // prüft ob aktuelles Objekt ein Startobjekt eines Loopes ist
    // wenn ja wird das das Eigenschaftsattribut des aktuellen Objektes auf Startobjekt gesetzt
    checkloopobj1(ocurrobj, bobjcharacter);

    for (var i1 = 0 ; i1 < ooutcxns.length ; i1++ ){
      onextobj.value = ooutcxns[i1].TargetObjOcc();
      var btargetobj = new __holder(0); 

      // Unterdrückt die Ausgabe der Folgeereignisse
      var bcheck = checkloopobj1(onextobj, btargetobj);
      if (g_bsequencevents && ! bcheck) {
        onextobj.value = stopnext_event(ocurrobj.value, onextobj.value);
      }

      checkloopobj1(onextobj, btargetobj);
      if (! (btargetobj.value == __enum_looptyp_zielloop && bobjcharacter.value == __enum_looptyp_startloop)) {
        onextobjs.value[onextobjs.value.length] = onextobj.value;
      }
    }
  }

  __functionResult = getSortedList(onextobjs.value);

  return __functionResult;
}




// ByVal oCurrObj, oNextObj
function stopnext_event(ocurrobj, onextobj)
{
  var __functionResult = null;
  // Beschreibung: Ereignisse zwischen Funktionen werden ausgeblendet
  // Funktion prüft das aktuelle Objekt und das Nachfolgeobjekte.Ist Objekt
  // vom Typ Funktion und das Folgeobjekt ein Ereignis,wird das Folgeobjekt
  // des Ereignis ermittelt. Ist diese wiederum eine Funktion wird diese
  // von der Funktion zurückgeliefert.Sonst wird das Folgeobjekt wieder zu-
  // geliefert.
  // Input value : oCurrObj As object,oNextObj As object
  // Output value: object

  var onextcxns = null;   // Anzahl der ausgehenden Kanten des Ereignisses
  var otargetobj = null;   // Zielobjekt des Ereignisses

  // Abfrage ob aktuelles Objekt vom Typ Funktion ist
  if (ocurrobj.ObjDef().TypeNum() == Constants.OT_FUNC) {
    // Abfrage ob aktuelles Objekt vom Typ Ereignis ist
    if (onextobj.ObjDef().TypeNum() == Constants.OT_EVT) {
      // Liste der ausgehenden Kanten des Objekt Ereignis
      onextcxns = onextobj.OutEdges(Constants.EDGES_STRUCTURE);
      // wenn Ereignis nur eine ausgehende Kante besitzt
      if (onextcxns.length == 1) {
        // Zielobjekt des Ereignises
        otargetobj = onextcxns[0].TargetObjOcc();
        // wenn Zielobjekt vom Typ Funktion liefert die Funktion das
        // Zielobjekt zurück und wird beendet
        if (otargetobj.ObjDef().TypeNum() == Constants.OT_FUNC) {
          __functionResult = otargetobj;
          return __functionResult;
        }
      }
      // Ist nicht vom Typ Ereignis
    }

    // wenn Objekt nicht vom Typ Funktion ist  liefert die Funktion das Objekt zurück
  }

  __functionResult = onextobj;

  return __functionResult;
}




function search_nextrow(ocurrrow, bnext)
{
  var __functionResult = new __usertype_row();

  var tcharacter = new __holder(0);   // zeigt an ob Objekt ein Looptyp ist
  var oreturnrow = new __holder(new __usertype_row()); 
  var oobj = new __holder(null); 
  var onextobj = new __holder(null); 
  var onextrow_outobjs = new __holder(null); 
  var boutput = false; 

  // Variablen werden initialisiert
  tcharacter.value = __enum_looptyp_keinloop;

  oreturnrow.value.columns = new Array();

  for (var i1 = 0 ; i1 < ocurrrow.value.columns.length ; i1++ ){
    // Ist aktuelles Objekt ein Ausgabeobjekt
    if (ocurrrow.value.columns[i1].boutputobject) {
      oobj.value = ocurrrow.value.columns[i1].ocolumnobj;
      // Funktion liefert alle Nachfolger des aktuellen Objektes
      var onextobjs = find_nextobj(oobj);
      // Funktion liefert alle Nachfolger der Zeile,d. h. nur Nachfolger der Ausgabeobjekten
      onextrow_outobjs.value = nextoutput(ocurrrow);
      if (onextobjs.length > 0) {
        for (var i2 = 0 ; i2 < onextobjs.length ; i2++ ){
          onextobj.value = onextobjs[i2];
          var oincxns = onextobj.value.InDegree(Constants.EDGES_STRUCTURE);
          var ooutcxns = onextobj.value.OutDegree(Constants.EDGES_STRUCTURE);
          checkloopobj1(onextobj, tcharacter);
          // Folgeobjekt besitzt nur eine eingehende Kante
          if (oincxns == 1) {
            boutput = true;
            spalte_erzeugen(onextobj.value, oreturnrow, tcharacter.value, boutput, ooutcxns);
            // FolgeObjekt besitzt mehrere eingehende Kanten
          } else if (oincxns > 1) {
            // Funktion prüft Objekt auf Kriterien für ein AusgabeObjekt
            boutput = check_nextobj(onextobj, onextrow_outobjs, ocurrrow);
            // Ä	bOutput= Check_NextObj(oNextObj,oNextRow_OutObjs)
            spalte_erzeugen(onextobj.value, oreturnrow, tcharacter.value, boutput, ooutcxns);
          }
        }
      }
    } else {
      // alte Spalte wird kopiert wenn aktuelle Spalte kein Ausgabeobjekt ist
      spalte_erzeugen(ocurrrow.value.columns[i1].ocolumnobj, 
                      oreturnrow, 
                      ocurrrow.value.columns[i1].llooptype, 
                      ocurrrow.value.columns[i1].boutputobject, 
                      ocurrrow.value.columns[i1].osplitcount);
    }
  }

  // in Bufferzeile werden gleiche Ausgabeobjekte zusammengeführt
  oreturnrow.value = check_subsume_row(oreturnrow);

  __functionResult = oreturnrow.value;

  return __functionResult;
}




function check_subsume_row(ocurrrow)
{
  var __functionResult = new __usertype_row();

  var obufferrow = new __usertype_row(); 
  var oobj = new __holder(null); 
  var ocolumnsobjs = new __holder(null); 

  ocolumnsobjs.value = new Array();

  // ReDim obufferRow.Columns(0)
  obufferrow.columns = new Array();

  if (ocurrrow.value.columns.length > 0) {
    // Liste von Objekten der aktuellen Zeile, die als nächstes angelegt,
    // wird erzeugt
    for (var i1 = 0 ; i1 < ocurrrow.value.columns.length ; i1++ ) {
      oobj.value = ocurrrow.value.columns[i1].ocolumnobj;
      ocolumnsobjs.value[ocolumnsobjs.value.length] = oobj.value;
    }

    // Wiederholte Prüfung aller als nicht Ausgabeobjekte
    // gekennzeichneten Objekte

    for (var i1 = 0 ; i1 < ocurrrow.value.columns.length ; i1++ ) {
      if (! ocurrrow.value.columns[i1].boutputobject) {
        oobj.value = ocurrrow.value.columns[i1].ocolumnobj;
        var boutput = check_nextobj(oobj, ocolumnsobjs, ocurrrow);
        // Ä	bOutput= Check_NextObj(oObj,oColumnsObjs)
        ocurrrow.value.columns[i1].boutputobject = boutput;
        oobj.value = null;
      }
    }
  }

  __functionResult = subsume_row(ocurrrow.value);

  return __functionResult;
}




function subsume_row(ocurrrow)
{
  var __functionResult = new __usertype_row();

  var obufferrow = new __holder(new __usertype_row()); 

  // ReDim obufferRow.Columns(0)
  obufferrow.columns = new Array();

  if (ocurrrow.columns.length > 0) {
    spalte_erzeugen(ocurrrow.columns[0].ocolumnobj, 
                    obufferrow, 
                    ocurrrow.columns[0].llooptype, 
                    ocurrrow.columns[0].boutputobject, 
                    ocurrrow.columns[0].osplitcount);
   
    // Liste von nächsten Objekten wird erzeugt
    for (var i1 = 1 ; i1 < ocurrrow.columns.length ; i1++ ){
      // For i1 = 1 To UBound(obufferRow.Columns)-1
      var oobj = ocurrrow.columns[i1].ocolumnobj;
      // Nachbarobjekt
      var oneighbourobj = ocurrrow.columns[i1 - 1].ocolumnobj;
      // Sind benachbarte Objekte gleich, wird geprüft ob beide Objekte Ausgabeobjekte sind
      // ist das der Fall wird keine Spalte kreiert, dies führt zu einem zusammenfassen der
      // gleichen Objekte in einer Zeile
      if (oobj.IsEqual(oneighbourobj)) {
        if (ocurrrow.columns[i1 - 1].boutputobject && ocurrrow.columns[i1].boutputobject) {
          // Ist gleich und beide sind Ausgabeobjekte
        } else {
          // sind gleich aber sind keine Ausgabeobjekte
          spalte_erzeugen(oobj, obufferrow, 
                        ocurrrow.columns[i1].llooptype, 
                        ocurrrow.columns[i1].boutputobject, 
                        ocurrrow.columns[i1].osplitcount);
        }
      } else {
        // sind nicht gleich
        spalte_erzeugen(oobj, obufferrow, 
                      ocurrrow.columns[i1].llooptype, 
                      ocurrrow.columns[i1].boutputobject, 
                      ocurrrow.columns[i1].osplitcount);
      }
    }
  }

  __functionResult = obufferrow.value;

  return __functionResult;
}




// ByVal oNextObj,oRowNextObjs
function check_nextobj(onextobj, orownextobjs, ocurrrow)
{
  var __functionResult = false;

  var counter = 0; 
  var iloopcounter = 0; 
  var boutput = false; 

  var iincxns = onextobj.value.InDegree(Constants.EDGES_STRUCTURE);
  // zählt die Mergeobjekte in einer Zeile
  counter = elementinlistcounter(onextobj, orownextobjs);
  // sind mehrere gleiche Objekte in einer Zeile dann
  if (counter > 1) {
    iincxns = iincxns - (counter - 1);
    if (iincxns == 1 && same_nextoutput(onextobj, ocurrrow.value, counter)) {
      // If iInCxns = 1 Then
      boutput = true;
    } else {
      // Prüft ob Kanten von Rücksprüngen stammen
      iloopcounter = iselementinloopstr(onextobj);
      iincxns = iincxns - iloopcounter;
      if (iincxns == 1 && same_nextoutput(onextobj, ocurrrow.value, counter)) {
        // If iInCxns = 1 Then
        boutput = true;
      } else {
        boutput = false;
      }
    }
  }
  else {
    // Prüft ob Kanten von Rücksprüngen stammen
    iloopcounter = iselementinloopstr(onextobj);
    iincxns = iincxns - iloopcounter;
    if (iincxns == 1) {
      boutput = true;
    } else {
      boutput = false;
    }
  }

  __functionResult = boutput;

  return __functionResult;
}




// ByVal oObj
function same_nextoutput(oobj, ocurrrow, counter)
{
  var __functionResult = false;

  var neighbour = 0; 

  if (ocurrrow.columns.length > 0) {
    // Liste von nächsten Objekten wird erzeugt
    for (var i1 = 0 ; i1 < ocurrrow.columns.length ; i1++ ){
      neighbour = 0;
      if (oobj.value.IsEqual(ocurrrow.columns[i1].ocolumnobj)) {
        for (var i2 = i1 ; i2 < ocurrrow.columns.length-1 ; i2++ ){
          if (ocurrrow.columns[i2].ocolumnobj.IsEqual(ocurrrow.columns[i2 + 1].ocolumnobj)) {
            neighbour = neighbour + 1;
          } else {
            if (neighbour == (counter - 1)) {
              __functionResult = true;
            } else {
              __functionResult = false;
            }

            return __functionResult;
          }
        }

        if (neighbour == (counter - 1)) {
          __functionResult = true;
        } else {
          __functionResult = false;
        }

        return __functionResult;
      }
    }
  }

  return __functionResult;
}






function checkloop(outfile, ocurrmodel)
{
    var __functionResult = false;
    // Beschreibung:Unterfunktion sortiert alle Ausprägungen eines Modells nach ihrer Y-position im Modell.
    // Die sortierte Liste wird an die Unterfunktion  GetTheLoopObj übergeben
    // Input value : g_oLoopObj als Feld
    // : oCurrModel als aktuelles Model \bError als Fehlervariable
    
    var obufferobj = null;   // Vergleichobjekt
    var osortobjs = new __holder(null);   // Sortierte Liste
    var serrortxt = "";   // Fehlertext
    
    var cycleList = ocurrmodel.value.Cycles(true);
    if (cycleList.length > 0) {										   // MWZ, TANR: 242283
        osortobjs.value = new Array();
        var ooccobjs = ocurrmodel.value.ObjOccList();
        
        if (ooccobjs.length > 0) {
            while (ooccobjs.length > 1) {
                var obufferobj = ooccobjs[0];
                for (var i1 = 0 ; i1 < ooccobjs.length ; i1++ ) {
                    var ooccobj_y = ooccobjs[i1].Y();       // MWZ, TANR: 242283
                    var ooccbu_y  = obufferobj.Y();         // MWZ, TANR: 242283
                    
                    // Equation of the coordinate of the object
                    if (ooccobj_y < ooccbu_y) {
                        obufferobj = ooccobjs[i1];
                    }
                }
                
                // Create a new list
                osortobjs.value[osortobjs.value.length] = obufferobj;
                // Delete the old list
                ooccobjs = doDelete(ooccobjs, obufferobj);
            }
            
            if ((ooccobjs.length > 0)) {
                osortobjs.value[osortobjs.value.length] = ooccobjs[0];
            }
        }
        else {
            serrortxt = txtNoObjectsInModel;
            logfile(outfile, serrortxt);
            __functionResult = true;
            return __functionResult;
        }
        
        gettheloopobj(osortobjs);
        
        __functionResult = false;
        
        osortobjs.value = null;
    }    
    return __functionResult;
}




// ByVal oOccObjs
function gettheloopobj(ooccobjs)
{
  // Beschreibung:Funktion prüft ob Objekt ein Loopobjekt ist.Hierfür wird ein Koordinatenvergleich aller
  // Ausprägungen mit ihren Kantenobjekten durchgeführt.Besitzt eine Ausprägung ein Ziel-
  // objekt, deren y-Koordinate kleiner ist, so wird dies als Rücksprung gewertet. Daraus
  // folgt: Die aktuelle Ausprägung wird als Startobjekt und das Zielobjekt als Ziel des
  // Loop angesehen.Zur Kennzeichnung wird dann die Funktion "SetLoopObjects" aufgerufen.
  // 
  // Input value :g_oLoopObj als Array und aktuelles Objekt
  // oOccObjs als Liste aller Ausprägungen eines Modells als Objekt
  // Output value: kein Rückgabewert

  for (var i1 = 0 ; i1 < ooccobjs.value.length ; i1++ ){
      var ocxns = ooccobjs.value[i1].OutEdges(Constants.EDGES_STRUCTURE);
      for (var i2 = 0 ; i2 < ocxns.length ; i2++ ){
          var ocurrcxn = ocxns[i2];
          var ocurrtargetobj = ocurrcxn.TargetObjOcc();
          
          if (objectsInCycle(ooccobjs.value[i1], ocurrtargetobj)) {			// MWZ, TANR: 242283		
              var otaroccobj_y = ocurrtargetobj.Y();
              var ooccobj_y = ooccobjs.value[i1].Y();
              if (otaroccobj_y < ooccobj_y) {
                  setloopobjects(ooccobjs.value[i1], ocurrtargetobj);
              }
          }
      }
  }
  ooccobjs.value = null;
}


function objectsInCycle(oObjOcc1, oObjOcc2) {
    
    // MWZ, TANR: 242283		
    
    var bInCycle = false;
    var nIndex = 0;
    
    var cycleList = oObjOcc1.Model().Cycles(true);
    for (var i = 0; i <cycleList.length; i++) {
        var oCurrCycle = cycleList[i];
        if (iselementinlist(oObjOcc1, oCurrCycle, nIndex) && iselementinlist(oObjOcc2, oCurrCycle, nIndex)) {
            return true;
        }
    }
    return false;
}



// ByVal oSourceObj,oTargetObj
function setloopobjects(osourceobj, otargetobj)
{
  // Beschreibung:Unterfunktion schreibt gefundene LoopObjekte (Ziel- und Startobjekte) in ein Array.
  // Das Array ist vom Typ LoopStruct.
  // Input value : oSourceObj :gefundenes Startobjekt
  // : oTargetObj .gefundenes Zielobjekt
  var idx = g_oloopobj.length;
  
  // Setzt Liste
  g_oloopobj[idx] = new __usertype_loopstruct();
  g_oloopobj[idx].osource = osourceobj;
  g_oloopobj[idx].otarget = otargetobj;
}



function func_description(outfile, ocurrmodel)
{
  // Beschreibung: Funktion ermittelt die erste Zeile. Hierfür werden alle Startobjekte
  // mit Hilfe der Funktion Search_StartObj ermittelt. Diese werden dann
  // in die Spalten eingetragen und anschließend wird eine neue Zeile
  // im Zeilenvektor angelegt.
  // 
  // Input value:     oModel  als aktulles Modell
  // oRows als Zeilenvektor
  // Output value:    r als Row(Zeile)
  // Funktionsaufruf.: Search_StartObj; Spalte_erzeugen;Zeile_hinzufuegen

  outfile.OutputLn("", getString("TEXT22"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
  outfile.OutputLn(txtFunctionDescs, getString("TEXT22"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
  outfile.OutputLn("", getString("TEXT22"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);

  var oobjdefs = ocurrmodel.ObjDefListFilter(Constants.OT_FUNC);
  oobjdefs = ArisData.sort(oobjdefs, Constants.AT_NAME, Constants.SORT_NONE, Constants.SORT_NONE, g_nloc);

  outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
  outfile.TableRow();
  outfile.TableCell(txtFunction, 25, getString("TEXT22"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
  outfile.TableCell(txtDescription, 75, getString("TEXT22"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);

  for (var i1 = 0 ; i1 < oobjdefs.length ; i1++ ){
    var oobjdef = oobjdefs[i1];
    var oattr_desc = oobjdef.Attribute(Constants.AT_DESC, g_nloc);
    if (oattr_desc.GetValue(true) != "") {
      outfile.TableRow();
      outfile.TableCell(oobjdef.Name(g_nloc), 25, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
      outfile.TableCell(oattr_desc.GetValue(true), 75, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
    }
  }
  outfile.EndTable("", 100, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}




// ByVal oCurrModel
function dummy_output(outfile, rows, ocurrmodel, bLinkedModels)
{
  var ncellcolour = 0; 
  var soutloopstr = ""; 

  outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);

  for (var i1 = 0 ; i1 < rows.length; i1++ ){
    outfile.TableRow();

    for (var i2 = 0 ; i2 < rows[i1].columns.length ; i2++ ){
      var _row = rows[i1];
      var ocurrobj = _row.columns[i2].ocolumnobj;
      var nobjtypenum = ocurrobj.ObjDef().TypeNum();
      var nobjtypesym = ocurrobj.OrgSymbolNum();
      var sobjname = _row.columns[i2].ocolumnobj.ObjDef().Name(g_nloc);

      if (_row.columns[i2].boutputobject) {

        if (_row.columns[i2].llooptype == __enum_looptyp_zielloop) {
          // Erstellt Loopstring für Ausgabe
          soutloopstr = isloopstring(outfile, ocurrobj, g_oloopobj, __enum_looptyp_zielloop);
        } else if (_row.columns[i2].llooptype == __enum_looptyp_startloop) {
          soutloopstr = isloopstring(outfile, ocurrobj, g_oloopobj, __enum_looptyp_startloop);
        } else {
          soutloopstr = "";
        }

        var sorgstring = new __holder(""); 

        // Abfrage ob aktuelles Objekt ein Endobjekt ist
        var bendobj = check_obj(ocurrobj);
        ncellcolour = getColorByRGB(220, 220, 220);

        switch(nobjtypenum) {
          // Differenzierung der Objekte
          case Constants.OT_FUNC:
            if (nobjtypesym == Constants.ST_PRCS_IF) {
              getfunccellsettings(outfile, sobjname, soutloopstr, sorgstring.value, bendobj, 
                                 _row.columns[i2].icolumnsize, 1, 
                                 _row.columns[i2].llooptype);
            }
            else {
              var oorgs = null; 
              if (g_objectkind == 0) {
                oorgs = getorgunits_def(ocurrobj);
                // Beziehungen zu Oranisationseinheiten auf Definitionsebene
              } else if(g_objectkind == 1) {
                oorgs = getorgunits_occ(ocurrobj, bLinkedModels);
                // Beziehungen zu Oranisationseinheiten auf Ausprägungssebene
              }

              getorgstring(oorgs, sorgstring);
              getfunccellsettings(outfile, sobjname, soutloopstr, sorgstring.value, bendobj, 
                                  _row.columns[i2].icolumnsize, 2, 
                                  _row.columns[i2].llooptype);
            }
          break;

          case Constants.OT_EVT:
            getfunccellsettings(outfile, sobjname, soutloopstr, sorgstring.value, bendobj, 
                                _row.columns[i2].icolumnsize, 3, 
                                _row.columns[i2].llooptype);
          break;

          case Constants.OT_RULE:
            var stypobjname = ocurrobj.SymbolName();
            getfunccellsettings(outfile, stypobjname, soutloopstr, sorgstring.value, bendobj, 
                                _row.columns[i2].icolumnsize, 4, 
                                _row.columns[i2].llooptype);
          break;
        }
      }

      else {
        // Objekt( kein Outputflag = keine Ausgabe) wird wiederholt
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 0, Constants.BRDR_NORMAL);
        outfile.SetFrameStyle(Constants.FRAME_TOP, 0, Constants.BRDR_NORMAL);
        outfile.TableCell("", _row.columns[i2].icolumnsize, getString("TEXT22"), 8, Constants.C_BLACK, ncellcolour, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        outfile.ResetFrameStyle();
      }
    }
  }

  outfile.EndTable("", 100, getString("TEXT22"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}




function getfunccellsettings(outfile, sname, sloop, sorg, bend, size, art, loopkind)
{
  // Sub GetFuncCellSettings
  // this sub is used to set the frame style
  // Row = struct with information
  // sObjName = the func name
  // nIndex = position in the struct
  // nPos = position of the object in the List

  var ncellcolour = 0; 

  ncellcolour = getColorByRGB(223, 223, 223);

  switch(art) {
    // Prozessschnittstelle
    case 1:
      if (bend) {
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 62, Constants.BRDR_NORMAL);
      } else if (loopkind == __enum_looptyp_startloop) {
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 20, Constants.BRDR_DOUBLE);
      }

      outfile.SetFrameStyle(Constants.FRAME_LEFT, 20, Constants.BRDR_DOUBLE);
      outfile.SetFrameStyle(Constants.FRAME_RIGHT, 20, Constants.BRDR_DOUBLE);
      outfile.TableCell("", size, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
      outfile.OutputLn(sorg, getString("TEXT22"), 6, Constants.C_BLACK, ncellcolour, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);

      if (sloop != "") {
        outfile.OutputLn(sloop, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_RIGHT, 0);
        outfile.OutputLn(sname, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
      } else {
        outfile.OutputLn(sname, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
      }
      outfile.ResetFrameStyle();
      // Funktion
    break;

    case 2:
      if (bend) {
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 62, Constants.BRDR_NORMAL);
      } else if (loopkind == __enum_looptyp_startloop) {
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 20, Constants.BRDR_DOUBLE);
      }

      outfile.TableCell("", size, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);
      outfile.OutputLn(sorg, getString("TEXT22"), 6, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);

      if (sloop == "") {
        outfile.OutputLn(sname, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
      } else if (loopkind == __enum_looptyp_startloop) {
        outfile.OutputLn(sname, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        outfile.OutputLn(sloop, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_RIGHT, 0);
      } else {
        outfile.OutputLn(sloop, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
        outfile.OutputLn(sname, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
      }
// ---->      outfile.ResetFrameStyle();
      // Ereignis
    break;


    case 3:
      if (bend) {
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 62, Constants.BRDR_NORMAL);
      } else if (loopkind == __enum_looptyp_startloop) {
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 20, Constants.BRDR_DOUBLE);
      } else if (loopkind == __enum_looptyp_keinloop) {
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 0, Constants.BRDR_NORMAL);
      }

      outfile.TableCell("", size, getString("TEXT22"), 8, Constants.C_BLACK, ncellcolour, 0, Constants.FMT_LEFT, 0);

      if (sloop == "") {
        outfile.OutputLn(sname, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
      } else if (loopkind == __enum_looptyp_startloop) {
        outfile.OutputLn(sname, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        outfile.OutputLn(sloop, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_RIGHT, 0);
      } else {
        outfile.OutputLn(sloop, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
        outfile.OutputLn(sname, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
      }
      outfile.ResetFrameStyle();
      // Regel
    break;

    case 4:
      if (bend) {
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 62, Constants.BRDR_NORMAL);
      } else if (loopkind == __enum_looptyp_startloop) {
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 20, Constants.BRDR_DOUBLE);
      } else if (loopkind == __enum_looptyp_keinloop) {
        outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 0, Constants.BRDR_NORMAL);
      }

      outfile.TableCell("", size, getString("TEXT22"), 8, Constants.C_BLACK, ncellcolour, 0, Constants.FMT_LEFT, 0);

      if (sloop == "") {
        outfile.OutputLn(sname, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
      } else if (loopkind == __enum_looptyp_startloop) {
        outfile.OutputLn(sname, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        outfile.OutputLn(sloop, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_RIGHT, 0);
      } else {
        outfile.OutputLn(sloop, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0);
        outfile.OutputLn(sname, getString("TEXT22"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
      }
      outfile.ResetFrameStyle();
    break;
  }
}




function getorgunits_def(ocurrfunc)
{
  var __functionResult = null;
  // Beziehungen zu Oranisationseinheiten auf Definitionsebene

  var ocurrorgs = new Array();

  if (ocurrfunc.ObjDef().TypeNum() == Constants.OT_FUNC) {
  // check the object of type
    var ooutcxns = ocurrfunc.ObjDef().CxnList(Constants.EDGES_OUT);
    if (ooutcxns.length > 0) {
    // is the connecting list of out edges > null
      for (var i1 = 0 ; i1 < ooutcxns.length ; i1++ ){
        var ocxn = ooutcxns[i1];
        var ocurrtarget = ocxn.TargetObjDef();
        switch(ocurrtarget.TypeNum()) {
          // check the Type of the target Object
          case Constants.OT_SYS_ORG_UNIT:
          case Constants.OT_SYS_ORG_UNIT_TYPE:
          case Constants.OT_ORG_UNIT:
          case Constants.OT_ORG_UNIT_TYPE:
          case Constants.OT_PERS:
          case Constants.OT_PERS_TYPE:
          case Constants.OT_POS:
          case Constants.OT_LOC:
          case Constants.OT_GRP:
//          case Constants.OT_APPL_SYS_TYPE:
            ocurrorgs[ocurrorgs.length] = ocurrtarget;
          break;
        }
      }
    }

    var oincxns = ocurrfunc.ObjDef().CxnList(Constants.EDGES_IN);
    // check the in edges
    if (oincxns.length > 0) {
      for (var i1 = 0 ; i1 < oincxns.length ; i1++ ){
        var ocxn = oincxns[i1];
        var ocurrtarget = ocxn.SourceObjDef();
        switch(ocurrtarget.TypeNum()) {
          case Constants.OT_SYS_ORG_UNIT:
          case Constants.OT_SYS_ORG_UNIT_TYPE:
          case Constants.OT_ORG_UNIT:
          case Constants.OT_ORG_UNIT_TYPE:
          case Constants.OT_PERS:
          case Constants.OT_PERS_TYPE:
          case Constants.OT_POS:
          case Constants.OT_LOC:
          case Constants.OT_GRP:
//          case Constants.OT_APPL_SYS_TYPE:
            ocurrorgs[ocurrorgs.length] = ocurrtarget;
          break;
        }
      }
    }
  }
  __functionResult = ocurrorgs;

  return __functionResult;
}


function getConnectionsFromLinkedModel(ocurrfunc, mode)
{
  var result = new Array();
  var ocxnoccs
  if(mode==0) {
    ocxnoccs = ocurrfunc.OutEdges(Constants.EDGES_ALL);
  }
  else if(mode==1) {
    ocxnoccs = ocurrfunc.InEdges(Constants.EDGES_ALL);
  }

  for(var i=0;i<ocxnoccs.length;i++) {
    result[result.length] = ocxnoccs[i];
  }

  var oLinkedModels = ocurrfunc.ObjDef().AssignedModels();
  for(var i=0;i<oLinkedModels.length;i++) {
    extractConnectionsFromFuncAllocDgm(result, oLinkedModels[i], ocurrfunc, mode);
  }

  return result;
}

function extractConnectionsFromFuncAllocDgm(result, oModel, ocurrfunc, mode)
{
  if(oModel.OrgModelTypeNum()==Constants.MT_FUNC_ALLOC_DGM) {       // TANR 216764
    var occlist = ocurrfunc.ObjDef().OccListInModel(oModel);
    // vorkommen des objekts im funktionszuordnungsdiagramm bearbeiten
    for(var i=0;i<occlist.length;i++) {
      var occ = occlist[i];
      var cxns;
      if(mode==0) {
       cxns = occ.OutEdges(Constants.EDGES_ALL);
      } else if(mode==1) {
       cxns = occ.InEdges(Constants.EDGES_ALL);
      }

      // kanten des objekts im funktionszuordnungsdiagramm bearbeiten
      for(var j=0;j<cxns.length;j++) {
        var ocxn = cxns[j];

        // test ob bereit in result enthalten 
        bAlreadyInResult = false;
        for(var k=0;k<result.length;k++) {
          var ocxn2 = result[k];
          if(ocxn2.IsEqual(ocxn)) {
            bAlreadyInResult = true;
            break;
          }
        }

        if(!bAlreadyInResult)
          result[result.length] = ocxn;
      }
    }
  }
}

function getorgunits_occ(ocurrfunc, bLinkedModels)
{
  var __functionResult = null;
  // Beziehungen zu Oranisationseinheiten auf Ausprägungsebene

  var ocurrorgs = new Array();

  if (ocurrfunc.ObjDef().TypeNum() == Constants.OT_FUNC) {
  // check the object of type
    var ooutcxnoccs;
    if(bLinkedModels) {
      ooutcxnoccs = getConnectionsFromLinkedModel(ocurrfunc, 0);
    }
    else {
      ooutcxnoccs = ocurrfunc.OutEdges(Constants.EDGES_ALL);
    }

    if (ooutcxnoccs.length > 0) {
    // is the connecting list of out edges > null
      for (var i1 = 0 ; i1 < ooutcxnoccs.length ; i1++ ){
        var ocxnocc = ooutcxnoccs[i1];
        var ocurrtarget = ocxnocc.TargetObjOcc().ObjDef();
        switch(ocurrtarget.TypeNum()) {
          // check the Type of the target Object
          case Constants.OT_SYS_ORG_UNIT:
          case Constants.OT_SYS_ORG_UNIT_TYPE:
          case Constants.OT_ORG_UNIT:
          case Constants.OT_ORG_UNIT_TYPE:
          case Constants.OT_PERS:
          case Constants.OT_PERS_TYPE:
          case Constants.OT_POS:
          case Constants.OT_LOC:
          case Constants.OT_GRP:
//          case Constants.OT_APPL_SYS_TYPE:
            ocurrorgs[ocurrorgs.length] = ocurrtarget;
            // is the object type a person or person type ,then add to the list
          break;
        }
      }
    }

    var oincxnoccs;
    if(bLinkedModels) {
      oincxnoccs = getConnectionsFromLinkedModel(ocurrfunc, 1);
    }
    else {
      oincxnoccs = ocurrfunc.InEdges(Constants.EDGES_ALL);
    }

    // check the in edges
    if (oincxnoccs.length > 0) {
      for (var i1 = 0 ; i1 < oincxnoccs.length ; i1++ ){
        var ocxnocc = oincxnoccs[i1];
        var ocurrtarget = ocxnocc.SourceObjOcc().ObjDef();
        switch(ocurrtarget.TypeNum()) {
          case Constants.OT_SYS_ORG_UNIT:
          case Constants.OT_SYS_ORG_UNIT_TYPE:
          case Constants.OT_ORG_UNIT:
          case Constants.OT_ORG_UNIT_TYPE:
          case Constants.OT_PERS:
          case Constants.OT_PERS_TYPE:
          case Constants.OT_POS:
          case Constants.OT_LOC:
          case Constants.OT_GRP:
//          case Constants.OT_APPL_SYS_TYPE:
            // Personen,Personentyp, Anwendungsystemtyp
            ocurrorgs[ocurrorgs.length] = ocurrtarget;
          break;
        }
      }
    }
  }
  __functionResult = ocurrorgs;

  return __functionResult;
}



function getorgstring(oorgs, sorgstring)
{
  // Beschreibung:Unterfunktion schreibt die zugehörigen Rollen der Funktionen in den Ausgabestring
  // 
  // Input value :oOrgs als Rollenliste
  // :sOrgString als Ausgabestring

  sorgstring.value = "";
  if (oorgs.length == 1) {
    sorgstring.value = oorgs[0].Name(g_nloc);
  }
  else {
    for (var i1 = 0 ; i1 < oorgs.length ; i1++ ){
      if (sorgstring.value == "") {
        sorgstring.value = oorgs[i1].Name(g_nloc);
      } else {
        sorgstring.value = sorgstring.value + " / " + oorgs[i1].Name(g_nloc);
      }
    }
  }
}




function check_obj(ocurrobj)
{
  var __functionResult = false;
  // Funktion prüft ob aktuelles Objekt ein Endobjekt ist

  var ooutcxns = ocurrobj.OutDegree(Constants.EDGES_STRUCTURE);
  if (ooutcxns == 0) {
    __functionResult = true;
    return __functionResult;
  }

  __functionResult = false;

  return __functionResult;
}






// dialog item constants
var dicOrientation          = "optOrientation";
var dicRelationBase         = "optRelationBase";
var dicLinkedModels         = "chkLinkedModels";
var dicAllEvents            = "chkAllEvents";
var dicFuncDesc             = "chkFuncDesc";


/**
 *  function showOutputOptionsDialog
 *  shows output options dialog with specified initial settings
 *  @param bDisableOutputOptions flag for disabling output format settings
 *  @param holder_nOptOrientation receives orientation setting
 *  @param holder_nOptRelationBase receives relation base setting
 *  @param holder_bLinkedModels receives linked models setting
 *  @param holder_bAllEvents receives all events setting
 *  @param holder_bFuncDesc receives function description setting
 *  @return dialog return value
 */
function showOutputOptionsDialog(holder_nOptOrientation, holder_nOptRelationBase, 
                              holder_bLinkedModels, holder_bAllEvents, holder_bFuncDesc) 
{
  // Output format
  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 385, 150, txtOutputOptionsDialogTitle);

  userdialog.GroupBox(7, 10, 380, 50, txtOrientation);
  userdialog.OptionGroup(dicOrientation);
  userdialog.OptionButton(20, 25, 350, 15, txtOrientPortrait);
  userdialog.OptionButton(20, 40, 350, 15, txtOrientLandscape);

  userdialog.GroupBox(7, 70, 380, 50, txtRelationBase);
  userdialog.OptionGroup(dicRelationBase);
  userdialog.OptionButton(20, 85, 350, 15, txtRelBaseDefinition);
  userdialog.OptionButton(20, 100, 350, 15, txtRelBaseOccurence);

  userdialog.CheckBox(7, 130, 350, 15, txtLinkedModels, dicLinkedModels);
  userdialog.CheckBox(7, 145, 350, 15, txtAllEvents, dicAllEvents);
  userdialog.CheckBox(7, 160, 350, 15, txtFuncDesc, dicFuncDesc);

  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_af5576d0_eadf_11d8_12e0_9d2843560f51_dlg_01.hlp");
  
  dlgFuncOutput = Dialogs.createUserDialog(userdialog); 

  // Read dialog settings from config 
  var sSection = "SCRIPT_f5576d0_eadf_11d8_12e0_9d2843560f51";
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicOrientation,   holder_nOptOrientation.value);
  ReadSettingsDlgValue(dlgFuncOutput, sSection, dicRelationBase,  holder_nOptRelationBase.value);

  var vals = new Array( (holder_bLinkedModels.value?1:0), (holder_bAllEvents.value?1:0), (holder_bFuncDesc.value?1:0) );
  var dics = new Array(dicLinkedModels, dicAllEvents, dicFuncDesc);

  for(var i=0;i<dics.length;i++) {
    ReadSettingsDlgValue(dlgFuncOutput, sSection, dics[i], vals[i]);  
  }

  nuserdialog = Dialogs.show( __currentDialog = dlgFuncOutput);

  // Displays dialog and waits for the confirmation with OK.
  if (nuserdialog != 0) {
    holder_nOptOrientation.value   = dlgFuncOutput.getDlgValue(dicOrientation);
    holder_nOptRelationBase.value  = dlgFuncOutput.getDlgValue(dicRelationBase);
    var holders = new Array(holder_bLinkedModels, holder_bAllEvents, holder_bFuncDesc);
    for(var i=0;i<dics.length;i++) {
      holders[i].value = dlgFuncOutput.getDlgValue(dics[i])!=0;  
    }
    
    // Write dialog settings to config
    WriteSettingsDlgValue(dlgFuncOutput, sSection, dicOrientation);
    WriteSettingsDlgValue(dlgFuncOutput, sSection, dicRelationBase);
    for(var i=0;i<dics.length;i++) {
        WriteSettingsDlgValue(dlgFuncOutput, sSection, dics[i]);  
    }
  }
  return nuserdialog;  
}

function doDelete(arr, obj)
{
  if(typeof(arr)=="object" && arr.constructor.toString().indexOf("__isHolder")!=-1)
    arr = arr.value;
    
  if(arr==null||arr.length==0)
    return arr;

  if(!isNaN(obj)) {
    for(j=obj+1;j<arr.length;j++) {
      arr[j-1] = arr[j];
    }
    arr.length = arr.length - 1;
  
  } else {
    for(var i=0;i<arr.length;i++) {
      if(arr[i]==obj) {
        for(j=i+1;j<arr.length;j++) {
          arr[j-1] = arr[j];
        }
        arr.length = arr.length - 1;
        break;
      }
    }
  }
  return arr;
}


main();

/*
try
{
  main();
}
catch(__ex)
{
  if(__ex.constructor.toString().indexOf("__EndScriptException")==-1)
    throw __ex;
}
*/

















