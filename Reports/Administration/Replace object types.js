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

var ERROR_TABLES = function() {
    this.notcopiedattributes  = new Array();
    this.notcopiedlinks       = new Array();
    this.notcopiedobjects     = new Array();
    this.notcopiedconnections = new Array(); 
    this.notcopiedoccs        = new Array();
    this.notremovedoccs       = new Array(); 
}

var g_nloc = Context.getSelectedLanguage();
var g_odefaultfont = ArisData.getActiveDatabase().defaultFontStyle();
var g_oFilter = ArisData.ActiveFilter();

var g_bProtocol = false;    // BLUE-4508
var txtWarning = getString("TEXT1")+"\n\n"+getString("TEXT2");

var g_nFilteredAttribute = 0;
var g_nFilteredDefaultSymbol = 0;    // BLUE-27454

var nports = new Array(); 


// Datenstruktur fuer Objekt-, Attribut-, Symbol- und Kantentypen
__usertype_tType = function() {
  this.ntypenum = 0;
  this.sname = "";
}

_usertype_assignment = function(objDef, assignedModel) {
    this.objDef = objDef;
    this.assignedModel = assignedModel;
}

// Datenstruktur fuer Objekttypen-Aenderung (Seite 1, Liste unten)
__usertype_tobjecttypemappingentry = function() {
  this.sourceobjecttype = new __usertype_tType();
  this.targetobjecttype = new __usertype_tType();
}

// Datenstruktur fuer Symbolauswahl fuer umzusetzende Objekttypen (Seite 2, Liste links oben)
__usertype_tobjecttypemappingsymbolentry = function() {
  this.sourceobjecttype = new __usertype_tType();
  this.sourceobjectsymboltype = new __usertype_tType();
  this.targetobjecttype = new __usertype_tType();
}

// Datenstruktur fuer Symbol-Änderung (Seite 2, Liste unten)
__usertype_tobjectandsymboltypemappingentry = function() {
  this.sourceobjecttype = new __usertype_tType();
  this.sourceobjectsymboltype = new __usertype_tType();
  this.targetobjecttype = new __usertype_tType();
  this.targetobjectsymboltype = new __usertype_tType();
}

// Datenstruktur fuer Kantentypen-Auswahl fuer umzusetzende Kanten (Seite 3, Liste links oben)
__usertype_tobjecttypemappingconnectiontypeentry = function() {
  this.sourceobjecttype1 = new __usertype_tType();
  this.sourceconnectiontype = new __usertype_tType();
  this.sourceobjecttype2 = new __usertype_tType();
  this.targetobjecttype1 = new __usertype_tType();
  this.targetobjecttype2 = new __usertype_tType();
}

// Datenstruktur fuer Kantentypen-Aenderung (Seite 3, Liste unten)
__usertype_tconnectiontypemappingentry = function() {
  this.sourceobjecttype1 = new __usertype_tType();
  this.sourceconnectiontype = new __usertype_tType();
  this.sourceobjecttype2 = new __usertype_tType();
  this.targetobjecttype1 = new __usertype_tType();
  this.targetconnectiontype = new __usertype_tType();
  this.targetobjecttype2 = new __usertype_tType();
}

__usertype_tmappedobject = function() {
  this.sorigguid = "";
  this.scopyguid = "";
}

function main()
{
  nports[0]  = Constants.ATTROCC_TOPLEFT;
  nports[1]  = Constants.ATTROCC_TOP;
  nports[2]  = Constants.ATTROCC_TOPRIGHT;
  nports[3]  = Constants.ATTROCC_LEFT;
  nports[4]  = Constants.ATTROCC_CENTER;
  nports[5]  = Constants.ATTROCC_RIGHT;
  nports[6]  = Constants.ATTROCC_BOTTOMLEFT;
  nports[7]  = Constants.ATTROCC_BOTTOM;
  nports[8]  = Constants.ATTROCC_BOTTOMRIGHT;
  nports[9]  = Constants.ATTROCC_CENTERTOP;
  nports[10] = Constants.ATTROCC_CENTERBOTTOM;

  // Erhaelt Ergebnis Seite 1: Umsetzungstabelle fuer Objekttypen
  var objecttypemapping = new __holder(new Array()); 

  // Erhaelt Ergebnis Seite 2: Umsetzungstabelle fuer Objekttypen mit Symbolen
  var objectandsymboltypemapping = new __holder(new Array()); 

  // Erhaelt Ergebnis Seite 3: Umsetzungstabelle fuer Kantentypen
  var connectiontypemapping = new __holder(new Array()); 
  
  var nuserchoice =  Dialogs.MsgBox(txtWarning, Constants.MSGBOX_BTN_OKCANCEL, getString("TEXT3"));
  if (nuserchoice==Constants.MSGBOX_RESULT_OK) {
      nuserchoice = showchangeobjecttypedialog(objecttypemapping, objectandsymboltypemapping, connectiontypemapping);
    
      if (nuserchoice == -1) {
        var tErrorTables = new ERROR_TABLES();  

        performchanges(objecttypemapping.value, objectandsymboltypemapping, connectiontypemapping, tErrorTables);
    
        // Seite 4 (Ergebnisse) anzeigen falls erforderlich
        showchangeobjecttypedialog4(tErrorTables);
      }
  }
  if (!g_bProtocol) Context.setScriptError(Constants.ERR_NOFILECREATED);
}

// Umsetzungen lt. Einstellung vornehmen
function performchanges(objecttypemapping, objectandsymboltypemapping, connectiontypemapping, tErrorTables)
{
  var notcopiedattributes     = new Array();
  var notcopiedlinks          = new Array();
  var notcopiedobjects        = new Array();
  var notcopiedconnections    = new Array(); 
  var notcopiedoccs           = new Array();
  var notremovedoccs          = new Array(); 

  ArisData.Save(Constants.SAVE_ONDEMAND);       // BLUE-12362    

  var mappedobjects             = new Array(); 
  var mappedconnections         = new Array(); 
  var mappedobjectoccurences    = new Array(); 
  
  var srcObjectType = objecttypemapping[0].sourceobjecttype.ntypenum;
  var oobjdefs = ArisData.getActiveDatabase().Find(Constants.SEARCH_OBJDEF, srcObjectType);
  
  oobjdefs = filterSourceDefaultSymbol(oobjdefs);    // BLUE-27454
  oobjdefs = filterSourceAttribute(oobjdefs);

  var objdefguidstodelete = new __holder(new Array());   
  var objdefguidstoexemptfromdelete = new __holder(new Array());   
  var cxnguidstodelete = new __holder(new Array()); 

  var targetsymboltype;

  var objCount = 0;
  for (var i = 0 ; i < oobjdefs.length ; i++ ){
    var oobjdef = oobjdefs[i];

    targetsymboltype = gettargetsymboltypeforobjecttype(oobjdef.TypeNum(), objectandsymboltypemapping);

    if (targetsymboltype.ntypenum != 0) {
        
        var trgObjectType = objecttypemapping[0].targetobjecttype.ntypenum;   
        var ocopyofobjdef = copyobject(oobjdef, trgObjectType, notcopiedattributes, notcopiedlinks);
        updateTargetDefaultSymbol(oobjdef, ocopyofobjdef, objectandsymboltypemapping)  // BLUE-27454
        
        addtomappedobjects(createmappedobject(oobjdef.GUID(), ocopyofobjdef.GUID()), mappedobjects);
        
        objCount++;
        if (objCount % 100 == 0) {                
            ArisData.Save(Constants.SAVE_NOW);            // Store every 100 objDefs (BLUE-12362)
            ArisData.getActiveDatabase().clearCaches();
        }            
    } else {
        notcopiedobjects.push(oobjdef);  
    }
    addtostringlist(oobjdef.GUID(), objdefguidstodelete.value);
  }
  
  ArisData.Save(Constants.SAVE_NOW);                // Ensure saving (BLUE-12362)
  ArisData.getActiveDatabase().clearCaches();       // BLUE-5456    

  // Auspraegungen umsetzen
  var occCount = 0;
  for (var i = 0 ; i < mappedobjects.length; i++ ){
    oobjdef       = ArisData.getActiveDatabase().FindGUID(mappedobjects[i].sorigguid);
    ocopyofobjdef = ArisData.getActiveDatabase().FindGUID(mappedobjects[i].scopyguid);

    if (oobjdef.IsValid() && ocopyofobjdef.IsValid()) {
      var oobjoccs = oobjdef.OccList();
      for (var j = 0 ; j < oobjoccs.length ; j++ ){
        var oobjocc = oobjoccs[j];
        if (isOccInMatrix(oobjocc)) continue;   // BLUE-4829 Ignore matrix models here
        
        targetsymboltype = gettargetsymboltypeforobjectandsymboltype(oobjdef.TypeNum(), oobjocc.getSymbol(), objectandsymboltypemapping);

        if (targetsymboltype.ntypenum != 0) {
          var ocopyofobjocc = copyobjectoccurence(oobjocc, ocopyofobjdef, targetsymboltype);

          if (ocopyofobjocc == null || !ocopyofobjocc.IsValid()) {
            addtostringlist(oobjdef.GUID(), objdefguidstoexemptfromdelete.value);
            notcopiedoccs.push(oobjocc)
          }
          else {
            if (ocopyofobjocc.IsValid()) {
              addtomappedobjects(createmappedobject(oobjocc.ObjectID(0), ocopyofobjocc.ObjectID(0)), mappedobjectoccurences);
            }
            else {
              addtostringlist(oobjdef.GUID(), objdefguidstoexemptfromdelete.value);
              notcopiedoccs.push(oobjocc);
            }
          }
          
          occCount++;
          if (occCount % 100 == 0) {                
            ArisData.Save(Constants.SAVE_NOW);      // Store every 100 objOccs (BLUE-12362)
          }          
        }
      }
    }
  }
  ArisData.Save(Constants.SAVE_NOW);                // Ensure saving (BLUE-12362)

  // Kantenauspraegungen erstellen
 
  var setOfDoneCxnOccs = new java.util.HashSet();

  var cxnCount = 0;
  for (var i = 0 ; i < mappedobjectoccurences.length ; i++ ){
    oobjocc = ArisData.getActiveDatabase().FindOID(mappedobjectoccurences[i].sorigguid);
    ocopyofobjocc = ArisData.getActiveDatabase().FindOID(mappedobjectoccurences[i].scopyguid);
    var ocxnoccs = oobjocc.CxnOccList();
    for (var j = 0 ; j < ocxnoccs.length ; j++ ){
      var ocxnocc = ocxnoccs[j];
      
      if (!setOfDoneCxnOccs.add(ocxnocc)) {
        // BLUE-4504 Avoid creation of already created cxn occs (Bcause this cxn occ has already been copied)
        continue;
      }

      // Partner ermitteln
      var opartnerobjocc = ocxnocc.SourceObjOcc();
      var bpartneristarget = false;
      if (opartnerobjocc.IsEqual(oobjocc)) {
        opartnerobjocc = ocxnocc.TargetObjOcc();
        bpartneristarget = true;
      }

      // Anubis 436328 - Cxn, object and partner object type before changing (Remark: Must be assigned before mapping of partnerobjocc, see below)
      var ncxntypenum = ocxnocc.Cxn().TypeNum();
      var nobjtypenum = oobjocc.ObjDef().TypeNum(); 
      var npartnerobjtypenum = opartnerobjocc.ObjDef().TypeNum();    
      
      // Partner umgesetzt ?
      for (var k = 0 ; k < mappedobjectoccurences.length; k++ ){
        if (opartnerobjocc.ObjectID(0) == mappedobjectoccurences[k].sorigguid) {
          opartnerobjocc = ArisData.getActiveDatabase().FindOID(mappedobjectoccurences[k].scopyguid);
          break;
        }
      }

      var osrcobjocc = null;
      var otrgobjocc = null
      
      if (bpartneristarget) {
        osrcobjocc = ocopyofobjocc;
        otrgobjocc = opartnerobjocc;
      } else {
        osrcobjocc = opartnerobjocc;
        otrgobjocc = ocopyofobjocc;
      }

      var ocxndef = ocxnocc.CxnDef();
      var ocopyofcxndef = null;

      for (var k = 0 ; k < mappedconnections.length; k++ ){
        if (ocxndef.GUID() == mappedconnections[k].sorigguid) {
          ocopyofcxndef = ArisData.getActiveDatabase().FindGUID(mappedconnections[k].scopyguid);
          break;
        }
      }

      if (ocopyofcxndef == null || !ocopyofcxndef.IsValid()) {
        var targetconnectiontype = gettargetconnectiontypeforobjectpairandconnection(nobjtypenum, npartnerobjtypenum, ncxntypenum, connectiontypemapping);

        var ocopyofcxnocc = null;        
        
        if (targetconnectiontype.ntypenum != 0) {
          try { // BLUE-27400             
            var ocopyofcxnocc = ocxnocc.Model().CreateCxnOcc(osrcobjocc, otrgobjocc, targetconnectiontype.ntypenum, ocxnocc.PointList(), false, true);
          } catch (e) {
            // Exception already logged
          }  

          if (! (ocopyofcxnocc == null || !ocopyofcxnocc.IsValid()) ) {
            ocopyofcxnocc.ResetLine();
            ocopyofcxnocc.applyTemplate();                  // Anubis 445694
            ocopyofcxnocc.setZOrder(ocxnocc.getZOrder());   // Anubis 445675
            addtomappedobjects(createmappedobject(ocxndef.GUID(), ocopyofcxnocc.CxnDef().GUID()), mappedconnections);
            addtostringlist(ocxndef.GUID(), cxnguidstodelete);
            setEmbedding(ocxnocc, ocopyofcxnocc);           // BLUE-4503

            // MWZ, 03.07.06: Kantenattribute kopieren (Anfrage ID 123696 / Anubis: Request 191730)
            copycxnattributes(ocxndef, ocopyofcxnocc.CxnDef());
            
            cxnCount++;
            if (cxnCount % 100 == 0) {                
              ArisData.Save(Constants.SAVE_NOW);        // Store every 100 cxns (BLUE-12362)
            }            
            
          } else {
              notcopiedconnections.push(ocxndef);
          }
        } else {
          // vermerken, dass nicht kopiert wurde
          notcopiedconnections.push(ocxndef);          
        }
      }
      else {
        ocopyofcxnocc = ocxnocc.Model().CreateCxnOcc(osrcobjocc, otrgobjocc, ocopyofcxndef, ocxnocc.PointList(), false);  // (In the context of BLUE-4504)
        if (! (ocopyofcxnocc == null || !ocopyofcxnocc.IsValid()) ) {
          ocopyofcxnocc.ResetLine();
          ocopyofcxnocc.applyTemplate();                // Anubis 445694       
          ocopyofcxnocc.setZOrder(ocxnocc.getZOrder()); // Anubis 445675
          setEmbedding(ocxnocc, ocopyofcxnocc);         // BLUE-4503
          if (!ocxnocc.getVisible()) ocopyofcxnocc.setVisible(false);
        }

        cxnCount++;
        if (cxnCount % 100 == 0) {                
          ArisData.Save(Constants.SAVE_NOW);        // Store every 100 cxns (BLUE-12362)
        }            
      }
    }
  }
  ArisData.Save(Constants.SAVE_NOW);                // Ensure saving (BLUE-12362)

  // BLUE-4829 Update matrix models
  var matrixModels = getMatrixModels();
  if (matrixModels != null && matrixModels.length > 0) {

      notcopiedconnections = updateMatrixCxns(mappedobjects, mappedconnections, connectiontypemapping, notcopiedconnections);
      var aUpdatedModels = updateMatrixObjects(matrixModels, mappedobjects, objectandsymboltypemapping);
      updateMatrixCxnData(aUpdatedModels, objectandsymboltypemapping, connectiontypemapping);
  }
  ArisData.Save(Constants.SAVE_NOW);                // Ensure saving (BLUE-12362)
  
  tErrorTables.notcopiedattributes  = getTableEntries1(notcopiedattributes);
  tErrorTables.notcopiedlinks       = getTableEntries2(notcopiedlinks);
  tErrorTables.notcopiedobjects     = getTableEntries3(notcopiedobjects);  
  tErrorTables.notcopiedconnections = getTableEntries4(notcopiedconnections);
  tErrorTables.notcopiedoccs        = getTableEntries56(notcopiedoccs);

  // Alte Definitionen und Auspraegungen loeschen

  var delCount = 0;
  for (var i = 0 ; i < objdefguidstodelete.value.length ; i++ ){
    oobjdef = ArisData.getActiveDatabase().FindGUID(objdefguidstodelete.value[i]);

    if (oobjdef.IsValid()) {
      var bExemptFromDelete = false;
      for(var j = 0 ; j < objdefguidstoexemptfromdelete.value.length ; j++ ){
        if (StrComp(objdefguidstoexemptfromdelete.value[j], oobjdef.GUID()) == 0) {
          bExemptFromDelete = true;
        }
      }
      
      if(!bExemptFromDelete) {
        var oobjoccs = oobjdef.OccList();
        for (var j = 0 ; j < oobjoccs.length ; j++ ){
          oobjocc = oobjoccs[j];
          if (!oobjocc.Remove()) {
              notremovedoccs.push(oobjocc);
          }
        }
        var ogroup = oobjdef.Group();
        ogroup.Delete(oobjdef);
        
        delCount++;
        if (delCount % 100 == 0) {                
            ArisData.Save(Constants.SAVE_NOW);    // Store every 100 deleted objDefs (BLUE-12362)
        }        
      }
    }
  }
  tErrorTables.notremovedoccs   = getTableEntries56(notremovedoccs);  

  ArisData.Save(Constants.SAVE_NOW);                // Ensure saving (BLUE-12362)
  
  function setEmbedding(ocxnocc, ocopyofcxnocc) {
      // BLUE-4503 Check whether embeddings exist -> in this case create embeddings for copies, too
      if (ocxnocc.getVisible()) return;
      
      var oSrcObjOcc = ocxnocc.SourceObjOcc();
      var oTrgObjOcc = ocxnocc.TargetObjOcc();
      var oCopyOfSrcObjOcc = ocopyofcxnocc.SourceObjOcc();
      var oCopyOfTrgObjOcc = ocopyofcxnocc.TargetObjOcc();
      var nCxnType = ocopyofcxnocc.Cxn().TypeNum();

      if (isEmbedded(oSrcObjOcc, oTrgObjOcc)) {
          return oCopyOfSrcObjOcc.addEmbeddedObjOcc(oCopyOfTrgObjOcc, [nCxnType], true/*bFromSrcToTarget */);
      }
      if (isEmbedded(oTrgObjOcc, oSrcObjOcc)) {
          return oCopyOfTrgObjOcc.addEmbeddedObjOcc(oCopyOfSrcObjOcc, [nCxnType], false/*bFromSrcToTarget */);
      }

      function isEmbedded(oParentOcc, oChildOcc) {
          var oEmbeddedOccs = oParentOcc.getEmbeddedObjOccs();
          for (var i = 0; i < oEmbeddedOccs.length; i++) {
              if (oChildOcc.IsEqual(oEmbeddedOccs[i])) return true;
          }
          return false;
      }
  }
}

function filterSourceAttribute(oObjDefs) {
    if (g_nFilteredAttribute > 0) {
        var oFilteredObjDefs = new Array();
        for (var i in oObjDefs) {
            var oObjDef = oObjDefs[i];
            if (oObjDef.Attribute(g_nFilteredAttribute, g_nloc).IsMaintained()) {
                oFilteredObjDefs.push(oObjDef);        
            }
        }
        return oFilteredObjDefs;
    }
    return oObjDefs;
}

function filterSourceDefaultSymbol(oObjDefs) {
    if (g_nFilteredDefaultSymbol > 0) {
        var oFilteredObjDefs = new Array();
        for (var i in oObjDefs) {
            var oObjDef = oObjDefs[i];
            if (oObjDef.getDefaultSymbolNum() == g_nFilteredDefaultSymbol) {
                oFilteredObjDefs.push(oObjDef);        
            }
        }
        return oFilteredObjDefs;
    }
    return oObjDefs;
}

function updateTargetDefaultSymbol(srcObjDef, trgObjDef, objectandsymboltypemapping) {
    if (g_nFilteredDefaultSymbol > 0) {
        var targetSymbolType = gettargetsymboltypeforobjectandsymboltype(srcObjDef.TypeNum(), srcObjDef.getDefaultSymbolNum(), objectandsymboltypemapping);
        var targetDefaultSymbol = targetSymbolType.ntypenum;
        if (targetDefaultSymbol > 0) {
            
            trgObjDef.setDefaultSymbolNum(targetDefaultSymbol, false/*bPropagate*/);
        }
    }
}

function copycxnattributes(ocxndef, ocopyofcxndef)
{
  // MWZ, 03.07.06: Kantenattribute kopieren (Anfrage ID 123696 / Anubis: Request 191730)

  var languageList = ArisData.getActiveDatabase().LanguageList();
  for (var i = 0 ; i < languageList.length ; i++ ) {
    var olanguage = languageList[i];
    var nloc = olanguage.localeId();
    
    var oattrlist = ocxndef.AttrList(nloc);
    for (var j = 0 ; j < oattrlist.length ; j++ ) {
      var oattr = oattrlist[j];

      if (oattr.IsValid()) {

        var ocopyofattr = ocopyofcxndef.Attribute(oattr.TypeNum(), nloc);

        if (ocopyofattr.IsValid()) {
          switch(g_oFilter.AttrBaseType(oattr.TypeNum())) {
            case Constants.ABT_BOOL:
            case Constants.ABT_COMBINED:
            case Constants.ABT_LONGTEXT:
            case Constants.ABT_VALUE:
            case Constants.ABT_BLOB:    // BLUE-10802
              ocopyofattr.SetValue(oattr.MeasureValue(false), oattr.MeasureUnitTypeNum());

            break;
            default:
              ocopyofattr.SetValue(oattr.GetValue(false), oattr.MeasureUnitTypeNum());
            }
        }
      }
    }
  }
}


function gettargetconnectiontypeforobjectpairandconnection(nobjtypenum, npartnerobjtypenum, ncxntypenum, connectiontypemapping)
{
  var __functionResult = new __usertype_tType();

  for (var i = 0 ; i < connectiontypemapping.value.length; i++ ){
    // Anubis 436328
    if (((connectiontypemapping.value[i].sourceobjecttype1.ntypenum == nobjtypenum && 
          connectiontypemapping.value[i].sourceobjecttype2.ntypenum == npartnerobjtypenum) 
       || (connectiontypemapping.value[i].sourceobjecttype2.ntypenum == nobjtypenum && 
          connectiontypemapping.value[i].sourceobjecttype1.ntypenum == npartnerobjtypenum)) 
     && connectiontypemapping.value[i].sourceconnectiontype.ntypenum == ncxntypenum) {
         
      __functionResult = connectiontypemapping.value[i].targetconnectiontype;
      return __functionResult;
    }
  }

  __functionResult.ntypenum = 0;
  __functionResult.sname = "";

  return __functionResult;
}





function gettargetsymboltypeforobjecttype(nobjecttypenum, objectandsymboltypemapping)
{
  var __functionResult = new __usertype_tType();

  var idxwithsymbolmapping = 0; 
  var bfoundsymbolmapping = false; 

  for (var i = 0 ; i < objectandsymboltypemapping.value.length; i++ ){
    if (objectandsymboltypemapping.value[i].sourceobjecttype.ntypenum == nobjecttypenum) {
      if (objectandsymboltypemapping.value[i].sourceobjectsymboltype.ntypenum == 0) {
        __functionResult = objectandsymboltypemapping.value[i].targetobjectsymboltype;
        return __functionResult;
      }
      else {
        bfoundsymbolmapping = false;
        for (var j = i ; j < objectandsymboltypemapping.value.length; j++ ){
          if (objectandsymboltypemapping.value[j].sourceobjecttype.ntypenum == nobjecttypenum && 
             objectandsymboltypemapping.value[j].targetobjectsymboltype.ntypenum != 0) {
            bfoundsymbolmapping = true;
            idxwithsymbolmapping = j;
            break;
          }
        }

        if (bfoundsymbolmapping) {
          __functionResult = objectandsymboltypemapping.value[idxwithsymbolmapping].targetobjectsymboltype;
        } else {
          __functionResult.ntypenum = 0;
          __functionResult.sname = "";
        }
        return __functionResult;
      }
    }
  }

  __functionResult.ntypenum = -1;
  __functionResult.sname = "";
  return __functionResult;
}



function gettargetsymboltypeforobjectandsymboltype(nobjecttypenum, nsymboltypenum, objectandsymboltypemapping)
{
  var __functionResult = new __usertype_tType();

  for (var i = 0 ; i < objectandsymboltypemapping.value.length; i++ ){
    if (objectandsymboltypemapping.value[i].sourceobjecttype.ntypenum == nobjecttypenum && 
        (objectandsymboltypemapping.value[i].sourceobjectsymboltype.ntypenum == 0 || 
         objectandsymboltypemapping.value[i].sourceobjectsymboltype.ntypenum == nsymboltypenum)) {
      __functionResult = objectandsymboltypemapping.value[i].targetobjectsymboltype;
      return __functionResult;
    }
  }

  __functionResult.ntypenum = 0;
  __functionResult.sname = "";
  return __functionResult;
}



function addtostringlist(sstringtoadd, listtoaddto)
{
  listtoaddto[listtoaddto.length] = sstringtoadd;
}



function copyobject(oobjdef, trgObjectType, notcopiedattributes, notcopiedlinks)
{
  var ocopyofobjdef = oobjdef.Group().CreateObjDef(trgObjectType, oobjdef.Name(g_nloc), g_nloc);

  var bdonotshownotcopiedattribute = false; 

  var langList = ArisData.getActiveDatabase().LanguageList();
  for (var i = 0 ; i < langList.length ; i++ ){
    var olanguage = langList[i];
    var nloc = olanguage.LocaleId();
    var oattrlist = oobjdef.AttrList(nloc);

    for (var j = 0 ; j < oattrlist.length ; j++ ){
      var oattr = oattrlist[j];
      if (oattr.IsValid()) {
        var ocopyofattr = ocopyofobjdef.Attribute(oattr.TypeNum(), nloc);
        if (ocopyofattr.IsValid()) {
          switch(g_oFilter.AttrBaseType(oattr.TypeNum())) {
            case Constants.ABT_BOOL:
            case Constants.ABT_COMBINED:
            case Constants.ABT_LONGTEXT:
            case Constants.ABT_VALUE:
            case Constants.ABT_BLOB:    // BLUE-10802
              ocopyofattr.SetValue(oattr.MeasureValue(false), oattr.MeasureUnitTypeNum());
            break;

            default:
              ocopyofattr.SetValue(oattr.GetValue(false), oattr.MeasureUnitTypeNum());
            }
        }
        else {
          notcopiedattributes.push(oattr);
        }
      }
    }
  }

  var oassignedmodels = oobjdef.AssignedModels();
  for (var i = 0 ; i < oassignedmodels.length ; i++ ){
    var omodel = oassignedmodels[i];

    if (! ocopyofobjdef.CreateAssignment(omodel)) {
      notcopiedlinks.push(new _usertype_assignment(ocopyofobjdef, omodel));  
    }
  }

  return ocopyofobjdef;
}




function copyobjectoccurence(oobjocc, ocopyofobjdef, symboltype)
{
  var __functionResult = null;

  var ocopyofobjocc = null;
  try { // BLUE-27400
    ocopyofobjocc = oobjocc.Model().CreateObjOcc(symboltype.ntypenum, ocopyofobjdef, oobjocc.X(), oobjocc.Y());
  } catch (e) {
    // Exception already logged
  }
            
  if (ocopyofobjocc == null || !ocopyofobjocc.IsValid()) {
    __functionResult = null;
    return __functionResult;
  }
  ocopyofobjocc.setZOrder(oobjocc.getZOrder()); // Anubis 445675, 476233
  ocopyofobjocc.SetSize(oobjocc.Width(), oobjocc.Height());  // (In the context of BLUE-4503)

  var oattroccs = null;   var oattrocc = null;   var ocopyofattroccs = null;   var ocopyofattrocc = null; 
  oattroccs = oobjocc.AttrOccList();
  ocopyofattroccs = ocopyofobjocc.AttrOccList();

  var nport = 0;   var nposition = 0; 

  for (var i = 0 ; i < oattroccs.length ; i++ ){
    oattrocc = oattroccs[i];
    ocopyofattrocc = ocopyofobjocc.AttrOcc(oattrocc.AttrDef(g_nloc).TypeNum());
    var portOptions = oattrocc.GetPortOptions();
    if (portOptions.length == 2) {
      nport = portOptions[0];
      nposition = portOptions[1]; 
      /*
      ocopyofattrocc.Create(nport, oattrocc.FontStyleSheet());
      ocopyofattrocc.SetPortOptions(nport, nposition);
      */
      if (ocopyofattrocc.IsValid()) {
        if (ocopyofattrocc.Exist()) {
          ocopyofattrocc.SetPortOptions(nport, nposition);
        } else {
          ocopyofattrocc.Create(nport, g_odefaultfont);
          ocopyofattrocc.SetPortOptions(nport, nposition);
        }
        // BLUE-8550 Copy properties of free placed attributes
        if (nport = Constants.ATTROCC_PORT_FREE) {
            var textSize = oattrocc.getTextBoxSize();
            ocopyofattrocc.setTextBoxSize( textSize.getWidth(), textSize.getHeight() );
            ocopyofattrocc.SetOffset( oattrocc.OffsetX(), oattrocc.OffsetY() );
        }
        ocopyofattrocc.setAlignment( oattrocc.getAlignment() );
        ocopyofattrocc.setRotation( oattrocc.getRotation() );
      }      
    }
  }

  __functionResult = ocopyofobjocc;
  return __functionResult;
}


function createmappedobject(sorigguid, scopyguid)
{
  var result = new __usertype_tmappedobject(); 
  result.sorigguid = sorigguid;
  result.scopyguid = scopyguid;
  __functionResult = result;
  return result;
}


function addtomappedobjects(mappedobjecttoadd, mappedobjects)
{
  mappedobjects[mappedobjects.length] = mappedobjecttoadd;
}




function getmappedobjectguid(guid, mappedobjects)
{
  var __functionResult = "";

  if (mappedobjects.length > 0) {
    for (var i = 0 ; i < mappedobjects.length; i++ ){
      if (mappedobjects[i].sorigguid == guid) {
        __functionResult = mappedobjects[i].scopyguid;
        return __functionResult;
      }
    }
  }
  __functionResult = "";
  return __functionResult;
}



// --------------------------------
// Dialoge anzeigen
function showchangeobjecttypedialog(objecttypemapping, objectandsymboltypemapping, connectiontypemapping)
{
  var __functionResult = 0;

  // Seite 1 Anzeigen
  __functionResult = showchangeobjecttypedialog1(objecttypemapping);
  if (__functionResult != -1) {
    return __functionResult;
  }

  // Seite 2 Anzeigen
  __functionResult = showchangeobjecttypedialog2(objecttypemapping, objectandsymboltypemapping);
  if (__functionResult != -1) {
    return __functionResult;
  }

  // Seite 3 Anzeigen
  __functionResult = showchangeobjecttypedialog3(objecttypemapping, objectandsymboltypemapping, connectiontypemapping);
  if (__functionResult != -1) {
    return __functionResult;
  }

  __functionResult = -1;
  return __functionResult;
}


var g_dlg1_sourceobjecttypes = new Array(); 
var g_dlg1_targetobjecttypes = new Array(); 
var g_dlg1_attributetypes    = new Array();
var g_dlg1_objecttypemapping = new Array(); 
var g_dlg1_symboltypelist = new Array(); 

// --------------------------------
// Dialogseite 1 anzeigen
function showchangeobjecttypedialog1(objecttypemapping)
{
  var __functionResult = 0;

  var sourceobjecttypenames = new Array();   // Array mit Quellobjektnamen
  var targetobjecttypenames = new Array();   // Array mit Zielobjektnamen
  var attributetypenames    = new Array();   // Array mit Attributnamen
  var mappingtexts          = new Array();   // Array mit Mapping-Texten (unteres Listenfeld)

  // Attribut-Typenliste und Namensarray initialisieren
  g_dlg1_attributetypes = initattributetypes();
  attributetypenames = getattributetypenames(g_dlg1_attributetypes);
  // Namensarray

  // Quellobjekt-Typenliste und Namensarray initialisieren
  g_dlg1_sourceobjecttypes = getobjecttypesforactivedatabase();
  // Vorhandene Objekttypen fuer Aktive Datenbank ermitteln
  if (g_dlg1_sourceobjecttypes.length > 0) {
    sourceobjecttypenames = getobjecttypenames(g_dlg1_sourceobjecttypes);
  }
  // Namensarray

  // Zielobjekt-Typenliste und Namensarray initialisieren
  g_dlg1_targetobjecttypes = getobjecttypesforactivedatabase();
  // Alle Objekttypen sind potentiell als Zielobjekttypen erlaubt
  if (g_dlg1_targetobjecttypes.length > 0) {
    targetobjecttypenames = getobjecttypenames(g_dlg1_targetobjecttypes);
  }
  // Namensarray

  g_dlg1_objecttypemapping = objecttypemapping.value;

  var userdialog = Dialogs.createNewDialogTemplate(660, 360, getString("TEXT4"), "dlgfuncchangeobjecttype1");
  // %GRID:10,7,1,1
  userdialog.Text(20, 14, 620, 14, getString("TEXT5"));
  userdialog.Text(20, 33, 310, 14, getString("TEXT6"));
  userdialog.ListBox(20, 49, 310, 117, sourceobjecttypenames, "lstSourceObjects");
  userdialog.Text(340, 33, 300, 14, getString("TEXT7"));
  userdialog.ListBox(340, 49, 300, 117, targetobjecttypenames, "lstTargetObjects");
  userdialog.PushButton(20, 170, 150, 21, getString("TEXT11"), "butAdd");
  userdialog.Text(20, 201, 620, 14, getString("TEXT12"));
  userdialog.ListBox(20, 217, 620, 22, mappingtexts, "lstMappings");
  userdialog.PushButton(20, 243, 150, 21, getString("TEXT13"), "butRemove");
  
  userdialog.CheckBox(20, 280, 500, 15, getString("TEXT8"), "chkAttributFilter");
  userdialog.Text(44, 302, 130, 14, getString("TEXT10"));
  userdialog.DropListBox(194, 300, 270, 30, attributetypenames, "lstAttributes");
  
  userdialog.CheckBox(20, 325, 500, 15, getString("TEXT44"), "chkDefaultSymbol");
  userdialog.Text(44, 347, 150, 14, getString("TEXT45"));
  userdialog.DropListBox(194, 345, 270, 30, [], "lstDefaultSymbols");
  
  
  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_5df77ad0_7500_11d9_768f_a722316b722b_dlg_01.hlp");

  var dlg = Dialogs.createUserDialog(userdialog); 

  var nuserchoice = Dialogs.show( __currentDialog = dlg);  // Dialog anzeigen
  if (nuserchoice == -1) {
  // OK
    objecttypemapping.value = g_dlg1_objecttypemapping;
  }

  // Ergebnis des Dialogs liefern
  __functionResult = nuserchoice;
  return __functionResult;
}



function dlgfuncchangeobjecttype1(dlgitem, action, suppvalue)
{
  var __functionResult = false;

  var idxsource = 0;   var idxtarget = 0;   var idxmapping = 0;   var idxattribfilter = 0;   var nattribtypenum = 0; 
  var sourceobjecttype;   
  var targetobjecttype;
  var sourceobjectnames = new Array();   
  var targetobjectnames = new Array();   
  var objecttypemappingtexts = new Array(); 

  switch(action) {
    case 1:
      // Initiale Abhaengigkeiten der Dialogelemente erfuellen
      __functionResult = false;

      __currentDialog.setDlgEnable("lstAttributes", __currentDialog.getDlgValue("chkAttributFilter") != 0);
      __currentDialog.setDlgEnable("lstDefaultSymbols", __currentDialog.getDlgValue("chkDefaultSymbol") != 0);
      
      __currentDialog.setDlgEnable("butAdd", false);
      __currentDialog.setDlgEnable("butRemove", false);
      __currentDialog.setDlgEnable("OK", false);
    break;



    case 2:
      // Abhaengigkeiten der Dialogelemente bei Button/Checkbox/Optionsfeld-Betaetigung erfuellen
      __functionResult = true;

      switch(dlgitem) {
        case "chkAttributFilter":
          __currentDialog.setDlgEnable("lstAttributes", __currentDialog.getDlgValue("chkAttributFilter") != 0);
        break;

        case "chkDefaultSymbol":
          __currentDialog.setDlgEnable("lstDefaultSymbols", __currentDialog.getDlgValue("chkDefaultSymbol") != 0);
        break;

        case "lstSourceObjects":
        case "lstTargetObjects":
          idxsource = __currentDialog.getDlgValue("lstSourceObjects");
          idxtarget = __currentDialog.getDlgValue("lstTargetObjects");
          __currentDialog.setDlgEnable("butAdd", idxsource != -1 && idxtarget != -1);
        break;


        case "butAdd":
          idxsource = __currentDialog.getDlgValue("lstSourceObjects");
          idxtarget = __currentDialog.getDlgValue("lstTargetObjects");

          // Nur wenn in beiden Listen Eintraege ausgewaehlt sind
          if (idxsource != -1 && idxtarget != -1) {
            // Umsetzung in identischen Objekttyp verhindern
            if (g_dlg1_sourceobjecttypes[idxsource].ntypenum != g_dlg1_targetobjecttypes[idxtarget].ntypenum) {
                
              // Mapping hinzufuegen
              addobjecttypemapping(g_dlg1_sourceobjecttypes[idxsource], g_dlg1_targetobjecttypes[idxtarget], g_dlg1_objecttypemapping);

              // Stringlisten ermitteln und anzeigen
              objecttypemappingtexts = getobjecttypemappingtexts(g_dlg1_objecttypemapping);
              __currentDialog.setDlgListBoxArray("lstMappings", objecttypemappingtexts);
              
              __currentDialog.setDlgSelection("lstSourceObjects", -1);
              __currentDialog.setDlgSelection("lstTargetObjects", -1);             
              
              __currentDialog.setDlgEnable("lstSourceObjects", false);
              __currentDialog.setDlgEnable("lstTargetObjects", false);
              
              __currentDialog.setDlgEnable("butAdd", false);
              __currentDialog.setDlgEnable("butRemove", true);
              
              g_dlg1_symboltypelist = getsymboltypesforobject(g_dlg1_sourceobjecttypes[idxsource].ntypenum, false);
              if (g_dlg1_symboltypelist.length > 0) {
                symboltypenames = getsymboltypenames(g_dlg1_symboltypelist);
                __currentDialog.setDlgListBoxArray("lstDefaultSymbols", symboltypenames);
                __currentDialog.setDlgSelection("lstDefaultSymbols", 0);
              }
              
            }
          }
          __currentDialog.setDlgEnable("OK", (g_dlg1_objecttypemapping.length > 0));
        break;


        case "butRemove":
          // Mapping entfernen
          g_dlg1_objecttypemapping = [];
          __currentDialog.setDlgListBoxArray("lstMappings", []);
            
          __currentDialog.setDlgEnable("lstSourceObjects", true);
          __currentDialog.setDlgEnable("lstTargetObjects", true);
              
          __currentDialog.setDlgEnable("butRemove", false);
          
          __currentDialog.setDlgListBoxArray("lstDefaultSymbols", []);
          
          __currentDialog.setDlgEnable("OK", (g_dlg1_objecttypemapping.length > 0));
        break;

        case "OK":
          if (__currentDialog.getDlgValue("chkAttributFilter") != 0) {
            var idxattribfilter = __currentDialog.getDlgValue("lstAttributes");
            g_nFilteredAttribute = g_dlg1_attributetypes[idxattribfilter].ntypenum;
          } else {
            g_nFilteredAttribute = 0;
          } 
          
          if (__currentDialog.getDlgValue("chkDefaultSymbol") != 0) {
            var idxDefaultSymbol = __currentDialog.getDlgValue("lstDefaultSymbols");
            g_nFilteredDefaultSymbol = g_dlg1_symboltypelist[idxDefaultSymbol].ntypenum;
          } else {
            g_nFilteredDefaultSymbol = 0;
          }
          __functionResult = false;
        break;

        case "Cancel":
          __functionResult = false;
        break;
      }

    break;
  }

  return __functionResult;
}




var g_dlg2_objecttypemapping            = new Array(); 
var g_dlg2_objecttypemappingsymbols     = new Array(); 
var g_dlg2_objectandsymboltypemapping   = new Array(); 
var g_dlg2_targetobjecttype             = new __usertype_tType(); 
var g_dlg2_symboltypelist               = new Array(); 

// --------------------------------
// Dialogseite 2 anzeigen
// 
function showchangeobjecttypedialog2(objecttypemapping, objectandsymboltypemapping)
{
  var __functionResult = 0;

  // Variablen mit Listeninhalten
  var objectmappingtexts            = new Array();   // Array mit Zielobjekttypennamen
  var symboltypenames               = new Array();   // Array mit Zielsymboltypennamen
  var objectandsymbolmappingtexts   = new Array();   // Array mit ObjektundSymbolMapping-Texten (unteres Listenfeld)

  g_dlg2_objecttypemapping          = objecttypemapping.value;
  g_dlg2_objecttypemappingsymbols   = buildobjecttypemappingsymbolsfromobjecttypemapping(objecttypemapping.value);
  objectmappingtexts                = getobjecttypemappingsymboltexts(g_dlg2_objecttypemappingsymbols);

  
  if (g_dlg2_objecttypemappingsymbols.length > 0) {
    g_dlg2_targetobjecttype = g_dlg2_objecttypemappingsymbols[0].targetobjecttype;
    g_dlg2_symboltypelist = getsymboltypesforobject(g_dlg2_targetobjecttype.ntypenum, true);
    if (g_dlg2_symboltypelist.length > 0) {
      symboltypenames = getsymboltypenames(g_dlg2_symboltypelist);
    }
  }
  else {
    g_dlg2_targetobjecttype.ntypenum = 0;
    g_dlg2_targetobjecttype.sname = "";
    g_dlg2_symboltypelist = new Array();
  }


  var userdialog = Dialogs.createNewDialogTemplate(780, 399, getString("TEXT4"), "dlgfuncchangeobjecttype2");
  // %GRID:10,7,1,1
  userdialog.Text(20, 7, 740, 24, getString("TEXT14"));
  userdialog.Text(20, 42, 470, 14, getString("TEXT15"));
  userdialog.ListBox(20, 56, 470, 140, objectmappingtexts, "lstObjectMapping");
  userdialog.Text(500, 42, 260, 14, getString("TEXT16"));
  userdialog.ListBox(500, 56, 260, 140, symboltypenames, "lstSymbols");
  userdialog.PushButton(20, 200, 190, 21, getString("TEXT11"), "butAdd");
  userdialog.Text(20, 231, 740, 14, getString("TEXT12"));
  userdialog.ListBox(20, 245, 740, 105, objectandsymbolmappingtexts, "lstObjectAndSymbolMapping");
  userdialog.PushButton(20, 354, 190, 21, getString("TEXT13"), "butRemove");
//  userdialog.TextBox(300, 350, 400, 40, "txtDebug");
  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_5df77ad0_7500_11d9_768f_a722316b722b_dlg_02.hlp");
  

  var dlg = Dialogs.createUserDialog(userdialog); 

  // Dialog anzeigen
  var nuserchoice = Dialogs.show( __currentDialog = dlg);

  if (nuserchoice == -1) {
    objectandsymboltypemapping.value = g_dlg2_objectandsymboltypemapping;
  }

  // Ergebnis des Dialogs liefern
  __functionResult = nuserchoice;
  return __functionResult;
}




function buildobjecttypemappingsymbolsfromobjecttypemapping(objecttypemapping)
{
  var __functionResult;

  var objecttypemappingsymbols = new Array(); 

  var numobjecttypemappingsymbols = 0;   var offset = 0; 
  var sourceobjectsymbols = new Array(); 
  var sourceobjecttype = new __usertype_tType(); 

  numobjecttypemappingsymbols = 0;

  for (var i = 0 ; i < objecttypemapping.length; i++ ){
    sourceobjecttype = objecttypemapping[i].sourceobjecttype;
    sourceobjectsymbols = getsymboltypesforobject(sourceobjecttype.ntypenum, false);

    // Symboltypen des Quellobjekttypes
    if (sourceobjectsymbols.length > 0) {
      offset = numobjecttypemappingsymbols;
      if (sourceobjectsymbols.length > 1) {
      // Anzahl der Eintraege erhoehen
        numobjecttypemappingsymbols += sourceobjectsymbols.length + 1;
      } else {
        numobjecttypemappingsymbols += sourceobjectsymbols.length;
      }

      // Eintrag fuer "Alle Symboltypen" anlegen
      if (sourceobjectsymbols.length > 1) {
        objecttypemappingsymbols[offset]                                    = new __usertype_tobjecttypemappingsymbolentry();
        objecttypemappingsymbols[offset].sourceobjecttype                   = sourceobjecttype;
        objecttypemappingsymbols[offset].sourceobjectsymboltype.ntypenum     = 0;
        objecttypemappingsymbols[offset].sourceobjectsymboltype.sname        = getString("TEXT17");
        objecttypemappingsymbols[offset].targetobjecttype                   = objecttypemapping[i].targetobjecttype;
        offset++;
      }

      // Eintraege fuer restliche Symboltypen anlegen
      for (var j = 0 ; j < sourceobjectsymbols.length; j++ ){
        objecttypemappingsymbols[offset+j]                        = new __usertype_tobjecttypemappingsymbolentry();
        objecttypemappingsymbols[offset+j].sourceobjecttype       = sourceobjecttype;
        objecttypemappingsymbols[offset+j].sourceobjectsymboltype = sourceobjectsymbols[j];
        objecttypemappingsymbols[offset+j].targetobjecttype       = objecttypemapping[i].targetobjecttype;
      }
    }
  }

  __functionResult = objecttypemappingsymbols;
  return __functionResult;
}





function getobjecttypemappingsymboltexts(objecttypemappingsymbols)
{
  var __functionResult = new Array();
  if (objecttypemappingsymbols.length == 0) {
    return __functionResult;
  }

  var stexts = new Array(); 
  for (var i = 0 ; i < objecttypemappingsymbols.length ; i++ ){
    stexts[i] = objecttypemappingsymbols[i].sourceobjecttype.sname + 
                " (" +
                objecttypemappingsymbols[i].sourceobjectsymboltype.sname + ") => " + 
                objecttypemappingsymbols[i].targetobjecttype.sname;
  }
  __functionResult = stexts;
  return __functionResult;
}


var g_tmp_debugmessage = "";



function dlgfuncchangeobjecttype2(dlgitem, action, suppvalue)
{
  var __functionResult = false;

  var idxobjectmapping = 0;   var idxsymbol = 0;   var idxobjectandsymbolmapping = 0; 
  var sourceobjecttype;
  var sourceobjectsymboltype;
  var targetobjecttype; 
  var targetobjectsymboltype; 
  var symboltypenames               = new Array();   
  var objectmappingtexts            = new Array();   
  var objectandsymbolmappingtexts   = new Array(); 


  switch(action) {
    case 1:
      // Initiale Abhaengigkeiten der Dialogelemente erfuellen
      __functionResult = false;
      if (g_dlg2_objecttypemappingsymbols.length == 0) {
        __currentDialog.setDlgEnable("OK", true);
      } else {
        __currentDialog.setDlgEnable("OK", false);
      }
      __currentDialog.setDlgEnable("butAdd", true);
      __currentDialog.setDlgEnable("butRemove", false);
    break;



    case 2:
      __functionResult = true;
      // nicht beenden, ggfs bei OK beenden

      switch(dlgitem) {
        case "lstObjectMapping":
          idxobjectmapping  = __currentDialog.getDlgValue("lstObjectMapping");
          idxsymbol         = __currentDialog.getDlgValue("lstSymbols");

          if (idxobjectmapping != -1) {
            targetobjecttype = g_dlg2_objecttypemappingsymbols[idxobjectmapping].targetobjecttype;
            if (targetobjecttype.ntypenum != g_dlg2_targetobjecttype.ntypenum) {
              g_dlg2_targetobjecttype = targetobjecttype;
              g_dlg2_symboltypelist = getsymboltypesforobject(g_dlg2_targetobjecttype.ntypenum, true);
              if (g_dlg2_symboltypelist.length > 0) {
                symboltypenames = getsymboltypenames(g_dlg2_symboltypelist);
              }
              __currentDialog.setDlgListBoxArray("lstSymbols", symboltypenames);
            }
            idxsymbol = __currentDialog.getDlgValue("lstSymbols");
          }
          __currentDialog.setDlgEnable("butAdd", idxsymbol != -1 && idxobjectmapping != -1);
        break;


        case "lstSymbols":
          idxsymbol         = __currentDialog.getDlgValue("lstSymbols");
          idxobjectmapping  = __currentDialog.getDlgValue("lstObjectMapping");
          __currentDialog.setDlgEnable("butAdd", idxsymbol != -1 && idxobjectmapping != -1);
        break;


        case "lstObjectAndSymbolMapping":
          idxobjectandsymbolmapping = __currentDialog.getDlgValue("lstObjectAndSymbolMapping");
          __currentDialog.setDlgEnable("butRemove", idxobjectandsymbolmapping != -1);
        break;


        case "butAdd":
          idxobjectmapping  = __currentDialog.getDlgValue("lstObjectMapping");
          idxsymbol         = __currentDialog.getDlgValue("lstSymbols");

          if (idxobjectmapping != -1 && idxsymbol != -1) {
            sourceobjecttype        = g_dlg2_objecttypemappingsymbols[idxobjectmapping].sourceobjecttype;
            sourceobjectsymboltype  = g_dlg2_objecttypemappingsymbols[idxobjectmapping].sourceobjectsymboltype;
            targetobjecttype        = g_dlg2_objecttypemappingsymbols[idxobjectmapping].targetobjecttype;
            targetobjectsymboltype  = g_dlg2_symboltypelist[idxsymbol];

            g_dlg2_objecttypemappingsymbols = removeobjecttypemappingsymbol(sourceobjecttype, sourceobjectsymboltype, idxobjectmapping, g_dlg2_objecttypemappingsymbols);
            objectmappingtexts = getobjecttypemappingsymboltexts(g_dlg2_objecttypemappingsymbols);
            __currentDialog.setDlgListBoxArray("lstObjectMapping", objectmappingtexts);

            g_dlg2_objectandsymboltypemapping = addobjectandsymboltypemapping(sourceobjecttype, sourceobjectsymboltype, targetobjecttype, targetobjectsymboltype, g_dlg2_objectandsymboltypemapping);
            objectandsymbolmappingtexts = getobjectandsymboltypemappingtexts(g_dlg2_objectandsymboltypemapping);
            __currentDialog.setDlgListBoxArray("lstObjectAndSymbolMapping", objectandsymbolmappingtexts);
            if (g_dlg2_objecttypemappingsymbols.length > 0) {
              symboltypenames = getsymboltypenames(g_dlg2_symboltypelist);
            }
            __currentDialog.setDlgListBoxArray("lstSymbols", symboltypenames);
            __currentDialog.setDlgEnable("OK", g_dlg2_objecttypemappingsymbols.length == 0);
            __currentDialog.setDlgEnable("butAdd", false);
          }
        break;


        case "butRemove":
          g_tmp_debugmessage = "";
          idxobjectandsymbolmapping = __currentDialog.getDlgValue("lstObjectAndSymbolMapping");
          if (idxobjectandsymbolmapping != -1) {
            sourceobjecttype        = g_dlg2_objectandsymboltypemapping[idxobjectandsymbolmapping].sourceobjecttype;
            sourceobjectsymboltype  = g_dlg2_objectandsymboltypemapping[idxobjectandsymbolmapping].sourceobjectsymboltype;
            targetobjecttype        = g_dlg2_objectandsymboltypemapping[idxobjectandsymbolmapping].targetobjecttype;
            targetobjectsymboltype  = g_dlg2_objectandsymboltypemapping[idxobjectandsymbolmapping].targetobjectsymboltype;
            g_dlg2_objectandsymboltypemapping = removeobjectandsymboltypemapping(idxobjectandsymbolmapping, g_dlg2_objectandsymboltypemapping);
            objectandsymbolmappingtexts = getobjectandsymboltypemappingtexts(g_dlg2_objectandsymboltypemapping);
            __currentDialog.setDlgListBoxArray("lstObjectAndSymbolMapping", objectandsymbolmappingtexts);

            var bTypeMappingSymbolsEmpty = g_dlg2_objecttypemappingsymbols.length==0;
            addobjecttypemappingsymbol(sourceobjecttype, sourceobjectsymboltype, targetobjecttype, g_dlg2_objecttypemappingsymbols);
            objectmappingtexts = getobjecttypemappingsymboltexts(g_dlg2_objecttypemappingsymbols);
            __currentDialog.setDlgListBoxArray("lstObjectMapping", objectmappingtexts);

            __currentDialog.setDlgEnable("OK", g_dlg2_objecttypemappingsymbols.length == 0);

            if(bTypeMappingSymbolsEmpty && g_dlg2_objecttypemappingsymbols.length>0) {
              g_dlg2_targetobjecttype = g_dlg2_objecttypemappingsymbols[0].targetobjecttype;
              g_dlg2_symboltypelist = getsymboltypesforobject(g_dlg2_targetobjecttype.ntypenum, true);
              if (g_dlg2_symboltypelist.length > 0) {
                symboltypenames = getsymboltypenames(g_dlg2_symboltypelist);
              }
            }
            else {
              idxobjectmapping = __currentDialog.getDlgValue("lstObjectMapping");
              if (idxobjectmapping != -1) {
                g_dlg2_targetobjecttype = g_dlg2_objecttypemappingsymbols[idxobjectmapping].targetobjecttype;
                g_dlg2_symboltypelist = getsymboltypesforobject(g_dlg2_targetobjecttype.ntypenum, true);
                if (g_dlg2_symboltypelist.length > 0) {
                  symboltypenames = getsymboltypenames(g_dlg2_symboltypelist);
                }
              } else {
                g_dlg2_targetobjecttype.ntypenum = 0;
                g_dlg2_targetobjecttype.sname = "";
                __currentDialog.setDlgEnable("butAdd", false);
              }
            }

            __currentDialog.setDlgListBoxArray("lstSymbols", symboltypenames);
            __currentDialog.setDlgEnable("butRemove", false);
//            __currentDialog.setDlgText("txtDebug", g_tmp_debugmessage);
          }
        break;



        case "OK":
        case "Cancel":
          __functionResult = false;
        break;
      }
    break;
  }

  return __functionResult;
}



function addobjecttypemappingsymbol(sourceobjecttype, sourceobjectsymboltype, targetobjecttype, objecttypemappingsymbols)
{
  var idxtoinsert = 0; 

  idxtoinsert = -1;

  if (objecttypemappingsymbols.length > 0) {
    for (var i = 0 ; i < objecttypemappingsymbols.length ; i++ ){
      if (objecttypemappingsymbols[i].sourceobjecttype.ntypenum > sourceobjecttype.ntypenum) {
        idxtoinsert = i;
        break;
      } else if (objecttypemappingsymbols[i].sourceobjecttype.ntypenum == sourceobjecttype.ntypenum) {
        if (objecttypemappingsymbols[i].sourceobjectsymboltype.ntypenum > sourceobjectsymboltype.ntypenum) {
          idxtoinsert = i;
          break;
        }
      }
    }
  }
  if (idxtoinsert == -1) {
    idxtoinsert = objecttypemappingsymbols.length;
  }
  

  if (sourceobjectsymboltype.ntypenum == 0) {
    g_tmp_debugmessage = g_tmp_debugmessage + "sourceobjectsymboltype.ntypenum is 0" + "\r\n";
    
    var sourceobjectsymbols = new Array(); 
    var numtoadd = 0;     var offset = 0; 

    sourceobjectsymbols = getsymboltypesforobject(sourceobjecttype.ntypenum);

    // Symboltypen des Quellobjekttypes
    if (sourceobjectsymbols.length > 0) {
      offset = idxtoinsert;
      if (sourceobjectsymbols.length > 1) {
        // Anzahl der Eintraege erhoehen
        numtoadd = sourceobjectsymbols.length+1;
      } else {
        numtoadd = sourceobjectsymbols.length;
      }
      
      // Anubis 305143
      for(var i = 0; i < numtoadd; i++) {
        objecttypemappingsymbols.push(new __usertype_tobjecttypemappingsymbolentry());
      }      

      // Eintrag fuer "Alle Symboltypen" anlegen
      g_tmp_debugmessage = g_tmp_debugmessage + "Eintrag fuer 'Alle Symboltypen' anlegen" + "\r\n";

      for(var i = objecttypemappingsymbols.length-1; i>idxtoinsert+numtoadd-1; i--) {
        objecttypemappingsymbols[i] = objecttypemappingsymbols[i - numtoadd];
      }      

      if (sourceobjectsymbols.length > 1) {
        g_tmp_debugmessage = g_tmp_debugmessage + "sourceobjectsymbols.length > 1, offset="+offset+"]"+ "\r\n";
        objecttypemappingsymbols[offset]                                    = new __usertype_tobjecttypemappingsymbolentry();
        objecttypemappingsymbols[offset].sourceobjecttype                   = sourceobjecttype;
        objecttypemappingsymbols[offset].sourceobjectsymboltype.ntypenum    = 0;
        objecttypemappingsymbols[offset].sourceobjectsymboltype.sname       = getString("TEXT17");
        objecttypemappingsymbols[offset].targetobjecttype                   = targetobjecttype;
        offset++;
      }

      // Eintraege fuer restliche Symboltypen anlegen
      for (var i = 0 ; i < sourceobjectsymbols.length ; i++ ){
        objecttypemappingsymbols[offset+i]                          = new __usertype_tobjecttypemappingsymbolentry();
        objecttypemappingsymbols[offset+i].sourceobjecttype         = sourceobjecttype;
        objecttypemappingsymbols[offset+i].sourceobjectsymboltype   = sourceobjectsymbols[i];
        objecttypemappingsymbols[offset+i].targetobjecttype         = targetobjecttype;
      }
    }
  }
  
  else {

    // Eintrag fuer "Alle Symboltypen" anlegen
    for(var i = objecttypemappingsymbols.length; i>idxtoinsert; i--) {
      objecttypemappingsymbols[i] = objecttypemappingsymbols[i-1];
    }

    objecttypemappingsymbols[idxtoinsert]                           = new __usertype_tobjecttypemappingsymbolentry();
    objecttypemappingsymbols[idxtoinsert].sourceobjecttype          = sourceobjecttype;
    objecttypemappingsymbols[idxtoinsert].sourceobjectsymboltype    = sourceobjectsymboltype;
    objecttypemappingsymbols[idxtoinsert].targetobjecttype          = targetobjecttype;
  }
}




function removeobjecttypemappingsymbol(sourceobjecttype, sourceobjectsymboltype, idxmapping, objecttypemappingsymbols)
{
  var bremoveall = false; 
  var startidxtoremove = 0;   var endidxtoremove = 0;   var numremoved = 0; 

  bremoveall = (sourceobjectsymboltype.ntypenum == 0);
  // ALLE SYMBOLTYPEN -> Alle Eintraege fuer den Ausgangsobjekttyp entfernen

  // Pruefen, ob voriger Eintrag der getString("TEXT17")-Eintrag ist und naechster Eintrag nicht vorhanden ist oder zu anderem Objekttyp gehoert -> letzter Eintrag
  if (! bremoveall) {
    // Voriger Eintrag ist getString("TEXT17")-Eintrag

    var btestfurther = false; 

    if (idxmapping == 0) {
      btestfurther = true;
    } else if (objecttypemappingsymbols[idxmapping-1].sourceobjecttype.ntypenum == sourceobjecttype.ntypenum && 
              objecttypemappingsymbols[idxmapping-1].sourceobjectsymboltype.ntypenum == 0) {
      btestfurther = true;
    } else {
      btestfurther = false;
    }

    if (btestfurther) {
      if (idxmapping == (objecttypemappingsymbols.length - 1)) {
      // Naechster Eintrag nicht vorhanden
        bremoveall = true;
      } else if (objecttypemappingsymbols[idxmapping+1].sourceobjecttype.ntypenum != sourceobjecttype.ntypenum) {
          // Naechster Eintrag gehoert zu anderem Objekttyp
        bremoveall = true;
      }
    }
  }

  startidxtoremove  = idxmapping;
  endidxtoremove    = idxmapping;

  if (bremoveall) {
    for (var i=(idxmapping - 1) ; i >=0 ; i-- ){
      if (objecttypemappingsymbols[i].sourceobjecttype.ntypenum == sourceobjecttype.ntypenum) {
        startidxtoremove = i;
      } else {
        break;
      }
    }

    for (var i=(idxmapping + 1) ; i < objecttypemappingsymbols.length; i++ ){
      if (objecttypemappingsymbols[i].sourceobjecttype.ntypenum == sourceobjecttype.ntypenum) {
        endidxtoremove = i;
      } else {
        break;
      }
    }
  }

  numremoved = (endidxtoremove - startidxtoremove) + 1;

  for (var i=(endidxtoremove + 1) ; i < objecttypemappingsymbols.length; i++ ){
    objecttypemappingsymbols[i - numremoved] = objecttypemappingsymbols[i];
  }

  objecttypemappingsymbols = truncarray(objecttypemappingsymbols,numremoved);

  return objecttypemappingsymbols;
}


function truncarray(arr, amount) {
  var result = new Array();
  for(var i = 0; i<arr.length-amount;i++) {
    result[i] = arr[i];
  }
  return result;
}


function addobjectandsymboltypemapping(sourceobjecttype, sourceobjectsymboltype, targetobjecttype, targetobjectsymboltype, objectandsymboltypemapping)
{
  var startidxtoremove = 0;   var endidxtoremove = 0;   var numtoremove = 0;   var idxtoinsert = 0; 

  if (sourceobjectsymboltype.ntypenum == 0) {
    // ALLE SYMBOLTYPEN -> bestehende entfernen
    startidxtoremove = -1;
    for (var i = 0 ; i < objectandsymboltypemapping.length; i++ ){
      if (objectandsymboltypemapping[i].sourceobjecttype.ntypenum == sourceobjecttype.ntypenum) {
        startidxtoremove = i;
        break;
      }
    }

    if (startidxtoremove > - 1) {
      endidxtoremove = startidxtoremove;
      for (var i = (startidxtoremove + 1) ; i < objectandsymboltypemapping.length; i++ ){
        if (objectandsymboltypemapping[i].sourceobjecttype.ntypenum == sourceobjecttype.ntypenum) {
          endidxtoremove = i;
        } else {
          break;
        }
      }

      numtoremove = (endidxtoremove - startidxtoremove) + 1;
      for (var i=(endidxtoremove + 1) ; i < objectandsymboltypemapping.length ; i++ ){
        objectandsymboltypemapping[i-numtoremove] = objectandsymboltypemapping[i];
      }
      objectandsymboltypemapping = truncarray(objectandsymboltypemapping, numtoremove);
    }
  }

  idxtoinsert = -1;
  for (var i = 0 ; i < objectandsymboltypemapping.length ; i++ ){
    if (objectandsymboltypemapping[i].sourceobjecttype.ntypenum > sourceobjecttype.ntypenum) {
      idxtoinsert = i;
      break;
    } else if (objectandsymboltypemapping[i].sourceobjecttype.ntypenum == sourceobjecttype.ntypenum) {
      if (objectandsymboltypemapping[i].sourceobjectsymboltype.ntypenum > sourceobjectsymboltype.ntypenum) {
        idxtoinsert = i;
        break;
      }
    }
  }

  if (idxtoinsert == -1) {
    idxtoinsert = objectandsymboltypemapping.length;
  }

  for(var i = objectandsymboltypemapping.length; i>idxtoinsert; i--) {
    objectandsymboltypemapping[i] = objectandsymboltypemapping[i-1];
  }
  
  objectandsymboltypemapping[idxtoinsert]                           = new __usertype_tobjectandsymboltypemappingentry();
  objectandsymboltypemapping[idxtoinsert].sourceobjecttype          = sourceobjecttype;
  objectandsymboltypemapping[idxtoinsert].sourceobjectsymboltype    = sourceobjectsymboltype;
  objectandsymboltypemapping[idxtoinsert].targetobjecttype          = targetobjecttype;
  objectandsymboltypemapping[idxtoinsert].targetobjectsymboltype    = targetobjectsymboltype;
  
  return objectandsymboltypemapping;
}


function removeobjectandsymboltypemapping(idxmapping, objectandsymboltypemapping)
{
  return removefromarray(objectandsymboltypemapping, idxmapping);
}


function removefromarray(arr, index) {
  for (var i = (index + 1) ; i < arr.length; i++ ){
    arr[i - 1] = arr[i];
  }
  arr.length = arr.length-1;
  return arr;
}


function getobjectandsymboltypemappingtexts(objectandsymboltypemapping)
{
  var __functionResult = new Array();

  if (objectandsymboltypemapping.length == 0) {
    return __functionResult;
  }

  var result = new Array();
  for (var i = 0 ; i < objectandsymboltypemapping.length ; i++ ){
    result[i] = objectandsymboltypemapping[i].sourceobjecttype.sname + " (" + 
                objectandsymboltypemapping[i].sourceobjectsymboltype.sname + ") => " + 
                objectandsymboltypemapping[i].targetobjecttype.sname + " (" + 
                objectandsymboltypemapping[i].targetobjectsymboltype.sname + ")";
  }
  __functionResult = result;
  return __functionResult;
}


var g_dlg3_objecttypemapping = new Array(); 
var g_dlg3_objectandsymboltypemapping = new Array(); 
var g_dlg3_connectiontypemapping = new Array(); 
var g_dlg3_objecttypemappingconnectiontypes = new Array(); 
var g_dlg3_connectiontypelist = new Array(); 


// --------------------------------
// Dialogseite 3 anzeigen
// 
function showchangeobjecttypedialog3(objecttypemapping, objectandsymboltypemapping, connectiontypemapping)
{
  var __functionResult = 0;

  var objectmappingconnectiontypenames  = new Array();   // Array mit Zielbeziehungsnamen
  var connectionstypenames              = new Array();   // Array mit Zielkantentypennamen
  var connectionmappingtexts            = new Array();   // Array mit VerbindungsMapping-Texten (unteres Listenfeld)

  g_dlg3_objecttypemappingconnectiontypes   = getobjecttypemappingconnections(objectandsymboltypemapping.value, objecttypemapping);
  objectmappingconnectiontypenames          = getobjecttypemappingconnectiontexts(g_dlg3_objecttypemappingconnectiontypes);

  if (g_dlg3_objecttypemappingconnectiontypes.length > 0) {
    var targetobjecttype1 = g_dlg3_objecttypemappingconnectiontypes[0].targetobjecttype1;
    var targetobjecttype2 = g_dlg3_objecttypemappingconnectiontypes[0].targetobjecttype2;
    g_dlg3_connectiontypelist   = getconnectionsforobjecttypes(targetobjecttype1, targetobjecttype2);
    connectionstypenames        = getconnectionnames(g_dlg3_connectiontypelist);
  }

  var userdialog = Dialogs.createNewDialogTemplate(990, 427, getString("TEXT4"), "dlgfuncchangeobjecttype3");
  // %GRID:10,7,1,1
  userdialog.Text(20, 7, 390, 24, getString("TEXT18"));
  userdialog.Text(20, 42, 400, 14, getString("TEXT19"));
  userdialog.ListBox(20, 56, 700, 126, objectmappingconnectiontypenames, "lstObjectMappingConnection");
  userdialog.Text(730, 42, 160, 14, getString("TEXT20"));
  userdialog.ListBox(730, 56, 240, 126, connectionstypenames, "lstConnections");
  userdialog.PushButton(20, 186, 190, 21, getString("TEXT11"), "butAdd");
  userdialog.Text(20, 217, 190, 14, getString("TEXT12"));
  userdialog.ListBox(20, 231, 950, 154, connectionmappingtexts, "lstConnectionMapping");
  userdialog.PushButton(20, 389, 190, 21, getString("TEXT13"), "butRemove");
  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_5df77ad0_7500_11d9_768f_a722316b722b_dlg_03.hlp");


  var dlg = Dialogs.createUserDialog(userdialog); 

  // Dialog anzeigen
  var nuserchoice = Dialogs.show( __currentDialog = dlg);

  if (nuserchoice == -1) {
    connectiontypemapping.value = g_dlg3_connectiontypemapping;
  }

  // Ergebnis des Dialogs liefern
  __functionResult = nuserchoice;
  return __functionResult;
}



function getconnectionsforobjecttypes(objecttype1, objecttype2)
{
  var connectiontypelist = new Array(); 

  var cxntypes = g_oFilter.CxnTypesFromObj(objecttype1.ntypenum, objecttype2.ntypenum);

  if (cxntypes.length>0) {
    connectiontypelist[0]          = new __usertype_tType();
    connectiontypelist[0].ntypenum = 0;
    connectiontypelist[0].sname = getString("TEXT22");
    for (var i = 0; i < cxntypes.length; i++) {
      connectiontypelist[i+1]           = new __usertype_tType();
      connectiontypelist[i+1].ntypenum  = cxntypes[i];
      connectiontypelist[i+1].sname     = g_oFilter.ActiveCxnTypeName(cxntypes[i]);
    }
  }

  return connectiontypelist;
}



function getconnectionnames(connectiontypelist)
{
  var result = new Array(); 
  
  if (connectiontypelist.length > 0) {
    for (var i = 0 ; i < connectiontypelist.length ; i++ ){
      result[i] = connectiontypelist[i].sname + " (#" + connectiontypelist[i].ntypenum + ")";

    }
  }
  return result;
}



function getobjecttypemappingconnections(objectandsymboltypemapping, objecttypemapping)
{
  var __functionResult;

  var objecttypemappingconnectiontypes = new Array(); 

  var sourceobjecttype;   
  var targetobjecttype;
  var targetobjecttype2;
  var sourcesymboltype;
  var targetsymboltype;
  var sourceconntype;
  var partnerobjecttypes = new Array();

  var cxntypes = new Array();   
  var numobjecttypemappingconnectiontypes = 0;

  for (var i = 0 ; i < objecttypemapping.value.length ; i++ ){
    sourceobjecttype = objecttypemapping.value[i].sourceobjecttype;
    targetobjecttype = objecttypemapping.value[i].targetobjecttype;
    partnerobjecttypes = getpartnerobjecttypesforconnection(sourceobjecttype, objecttypemapping);

    for (var j = 0 ; j < partnerobjecttypes.length ; j++ ){
      targetobjecttype2 = getmappedobjecttype(partnerobjecttypes[j], objecttypemapping);

      cxntypes = g_oFilter.CxnTypesFromObj(targetobjecttype.ntypenum, targetobjecttype2.ntypenum);
      if (cxntypes.length > 0) {

        cxntypes = g_oFilter.CxnTypesFromObj(sourceobjecttype.ntypenum, partnerobjecttypes[j].ntypenum);
        if (cxntypes.length > 0) {

          for (var k = 0 ; k < cxntypes.length ; k++ ){
            var idx = numobjecttypemappingconnectiontypes + k;
            objecttypemappingconnectiontypes[idx]                              = new __usertype_tobjecttypemappingconnectiontypeentry();
            objecttypemappingconnectiontypes[idx].sourceobjecttype1             = sourceobjecttype;
            objecttypemappingconnectiontypes[idx].sourceconnectiontype.ntypenum = cxntypes[k];
            objecttypemappingconnectiontypes[idx].sourceconnectiontype.sname    = g_oFilter.ActiveCxnTypeName(cxntypes[k]);
            objecttypemappingconnectiontypes[idx].sourceobjecttype2             = partnerobjecttypes[j];
            objecttypemappingconnectiontypes[idx].targetobjecttype1             = targetobjecttype;
            objecttypemappingconnectiontypes[idx].targetobjecttype2             = targetobjecttype2;
          }
          numobjecttypemappingconnectiontypes += cxntypes.length;
        }
      }

      if (sourceobjecttype.ntypenum != partnerobjecttypes[j].ntypenum) {
      // wenn nicht Beziehung innerhalb eines Objekttyps, umgekehrte Beziehungen ermitteln
        cxntypes = g_oFilter.CxnTypesFromObj(targetobjecttype2.ntypenum, targetobjecttype.ntypenum);
        if (cxntypes.length > 0) {
          cxntypes = g_oFilter.CxnTypesFromObj(partnerobjecttypes[j].ntypenum, sourceobjecttype.ntypenum);
          if (cxntypes.length > 0) {
            for (var k = 0 ; k < cxntypes.length ; k++ ){
            var idx = numobjecttypemappingconnectiontypes + k;
              objecttypemappingconnectiontypes[idx]                                 = new __usertype_tobjecttypemappingconnectiontypeentry();
              objecttypemappingconnectiontypes[idx].sourceobjecttype1               = partnerobjecttypes[j];
              objecttypemappingconnectiontypes[idx].sourceconnectiontype.ntypenum   = cxntypes[k];
              objecttypemappingconnectiontypes[idx].sourceconnectiontype.sname      = g_oFilter.PassiveCxnTypeName(cxntypes[k]);
              objecttypemappingconnectiontypes[idx].sourceobjecttype2               = sourceobjecttype;
              objecttypemappingconnectiontypes[idx].targetobjecttype1               = targetobjecttype2;
              objecttypemappingconnectiontypes[idx].targetobjecttype2               = targetobjecttype;
            }
            numobjecttypemappingconnectiontypes += cxntypes.length;
          }
        }
      }
    }
  }

  __functionResult = objecttypemappingconnectiontypes;

  return __functionResult;
}





function getobjecttypemappingconnectiontexts(objecttypemappingconnectiontypes)
{
  var result = new Array(); 
  
  if (objecttypemappingconnectiontypes.length > 0) {
    for (var i = 0 ; i < objecttypemappingconnectiontypes.length; i++ ){
      result[i] = objecttypemappingconnectiontypes[i].sourceobjecttype1.sname + "-" + 
                  objecttypemappingconnectiontypes[i].sourceobjecttype2.sname + " / " + 
                  objecttypemappingconnectiontypes[i].sourceconnectiontype.sname + " / " + 
                  objecttypemappingconnectiontypes[i].targetobjecttype1.sname + "-" + 
                  objecttypemappingconnectiontypes[i].targetobjecttype2.sname + " (#" + 
                  objecttypemappingconnectiontypes[i].sourceconnectiontype.ntypenum + ")";
    }
  }
  return result;
}


function getmappedobjecttype(objecttype, objecttypemapping)
{
  var __functionResult;;

  for (var i = 0 ; i < objecttypemapping.value.length; i++ ){
    if (objecttypemapping.value[i].sourceobjecttype.ntypenum == objecttype.ntypenum) {
      __functionResult = objecttypemapping.value[i].targetobjecttype;
      return __functionResult;
    }
  }

  __functionResult = objecttype;
  return __functionResult;
}



function getpartnerobjecttypesforconnection(sourceobjecttype, objecttypemapping)
{
  var __functionResult;

  var objecttype;
  var partnerobjecttypes = new Array(); 

  var idxtoinsert = -1;   var cxntypes = new Array(); 

  var allobjecttypes = initobjecttypes();

  // Cxn type nums from source object to connected objects
  for (var i = 0 ; i < allobjecttypes.length; i++ ){
    objecttype = allobjecttypes[i];
    cxntypes = g_oFilter.CxnTypesFromObj(sourceobjecttype.ntypenum, objecttype.ntypenum);
    if (cxntypes.length == 0) {
        // Vice versa - Cxn type nums from connected objects to source object (TANR 248686)
        cxntypes = g_oFilter.CxnTypesFromObj(objecttype.ntypenum, sourceobjecttype.ntypenum);        
    } 
    if (cxntypes.length > 0) {
      idxtoinsert = 0;
      for (var j = 0 ; j < partnerobjecttypes.length; j++ ){
        if (partnerobjecttypes[j].ntypenum > objecttype.ntypenum) {
          idxtoinsert = j;
          break;
        }
      }
      if (idxtoinsert == -1) {
        idxtoinsert = j;
      }

      for(var j = partnerobjecttypes.length; j>idxtoinsert; j--) {
        partnerobjecttypes[j] = partnerobjecttypes[j-1];
      }
      partnerobjecttypes[idxtoinsert] = objecttype;
    }
  }
  
  __functionResult = partnerobjecttypes;
  return __functionResult;
}




function dlgfuncchangeobjecttype3(dlgitem, action, suppvalue)
{
  var __functionResult = false;

  var idxobjectmappingconnection = 0;   
  var idxconnection = 0;   
  var idxconnectionmapping = 0; 
  var connectionstypenames = new Array();   
  var objectmappingconnectiontypetexts = new Array(); 
  var connectiontypemappingtexts = new Array(); 

  var sourceobjecttype1, sourceobjecttype2;
  var targetobjecttype1, targetobjecttype2;
  var sourceconnectiontype, targetconnectiontype;

  switch(action) {
    case 1:
      // Initiale Abhaengigkeiten der Dialogelemente erfuellen
      __functionResult = false;

      __currentDialog.setDlgEnable("butAdd", true);
      __currentDialog.setDlgEnable("butRemove", false);
    break;



    case 2:
      __functionResult = true;

      switch(dlgitem) {
        case "lstObjectMappingConnection":
          idxobjectmappingconnection    = __currentDialog.getDlgValue("lstObjectMappingConnection");
          idxconnection                 = __currentDialog.getDlgValue("lstConnections");
          if (idxobjectmappingconnection != -1) {
            targetobjecttype1 = g_dlg3_objecttypemappingconnectiontypes[idxobjectmappingconnection].targetobjecttype1;
            targetobjecttype2 = g_dlg3_objecttypemappingconnectiontypes[idxobjectmappingconnection].targetobjecttype2;
            g_dlg3_connectiontypelist = getconnectionsforobjecttypes(targetobjecttype1, targetobjecttype2);
            connectionstypenames = getconnectionnames(g_dlg3_connectiontypelist);
            __currentDialog.setDlgListBoxArray("lstConnections", connectionstypenames);
            idxconnection = __currentDialog.getDlgValue("lstConnections");
          }
          __currentDialog.setDlgEnable("butAdd", idxobjectmappingconnection != -1 && idxconnection != -1);
        break;


        case "lstConnections":
          idxobjectmappingconnection    = __currentDialog.getDlgValue("lstObjectMappingConnection");
          idxconnection                 = __currentDialog.getDlgValue("lstConnections");
          __currentDialog.setDlgEnable("butAdd", idxobjectmappingconnection != -1 && idxconnection != -1);
        break;


        case "lstConnectionMapping":
          idxconnectionmapping = __currentDialog.getDlgValue("lstConnectionMapping");
          __currentDialog.setDlgEnable("butRemove", idxconnectionmapping != -1);
        break;


        case "butAdd":
          idxobjectmappingconnection    = __currentDialog.getDlgValue("lstObjectMappingConnection");
          idxconnection                 = __currentDialog.getDlgValue("lstConnections");

          if (idxobjectmappingconnection != -1 && idxconnection != -1) {
            sourceobjecttype1       = g_dlg3_objecttypemappingconnectiontypes[idxobjectmappingconnection].sourceobjecttype1;
            sourceconnectiontype    = g_dlg3_objecttypemappingconnectiontypes[idxobjectmappingconnection].sourceconnectiontype;
            sourceobjecttype2       = g_dlg3_objecttypemappingconnectiontypes[idxobjectmappingconnection].sourceobjecttype2;
            targetobjecttype1       = g_dlg3_objecttypemappingconnectiontypes[idxobjectmappingconnection].targetobjecttype1;
            targetobjecttype2       = g_dlg3_objecttypemappingconnectiontypes[idxobjectmappingconnection].targetobjecttype2;
            targetconnectiontype    = g_dlg3_connectiontypelist[idxconnection];

            g_dlg3_objecttypemappingconnectiontypes = removeobjecttypemappingconnectiontype(idxobjectmappingconnection, g_dlg3_objecttypemappingconnectiontypes);
            objectmappingconnectiontypetexts        = getobjecttypemappingconnectiontexts(g_dlg3_objecttypemappingconnectiontypes);
            __currentDialog.setDlgListBoxArray("lstObjectMappingConnection", objectmappingconnectiontypetexts);

            addconnectiontypemapping(sourceobjecttype1, sourceconnectiontype, sourceobjecttype2, targetobjecttype1, targetconnectiontype, targetobjecttype2, g_dlg3_connectiontypemapping);
            connectiontypemappingtexts = getconnectiontypemappingtexts(g_dlg3_connectiontypemapping);
            __currentDialog.setDlgListBoxArray("lstConnectionMapping", connectiontypemappingtexts);

            __currentDialog.setDlgEnable("butAdd", false);
          }
        break;


        case "butRemove":
          idxconnectionmapping = __currentDialog.getDlgValue("lstConnectionMapping");
          if (idxconnectionmapping != -1) {
            sourceobjecttype1       = g_dlg3_connectiontypemapping[idxconnectionmapping].sourceobjecttype1;
            sourceconnectiontype    = g_dlg3_connectiontypemapping[idxconnectionmapping].sourceconnectiontype;
            sourceobjecttype2       = g_dlg3_connectiontypemapping[idxconnectionmapping].sourceobjecttype2;
            targetobjecttype1       = g_dlg3_connectiontypemapping[idxconnectionmapping].targetobjecttype1;
            targetconnectiontype    = g_dlg3_connectiontypemapping[idxconnectionmapping].targetconnectiontype;
            targetobjecttype2       = g_dlg3_connectiontypemapping[idxconnectionmapping].targetobjecttype2;

            g_dlg3_connectiontypemapping = removeconnectiontypemapping(idxconnectionmapping, g_dlg3_connectiontypemapping);
            connectiontypemappingtexts  = getconnectiontypemappingtexts(g_dlg3_connectiontypemapping);
            __currentDialog.setDlgListBoxArray("lstConnectionMapping", connectiontypemappingtexts);

            addobjecttypemappingconnectiontype(sourceobjecttype1, sourceconnectiontype, sourceobjecttype2, targetobjecttype1, targetobjecttype2, g_dlg3_objecttypemappingconnectiontypes);
            objectmappingconnectiontypetexts = getobjecttypemappingconnectiontexts(g_dlg3_objecttypemappingconnectiontypes);
            __currentDialog.setDlgListBoxArray("lstObjectMappingConnection", objectmappingconnectiontypetexts);

            __currentDialog.setDlgEnable("butRemove", false);
          }
        break;



        case "OK":
        case "Cancel":
          __functionResult= false;
        break;
      }
    break;
  }

  return __functionResult;
}



function getconnectiontypemappingtexts(connectiontypemapping)
{
  var result = new Array(); 

  if (connectiontypemapping.length > 0) {
    for (var i = 0 ; i < connectiontypemapping.length; i++ ){
      result[i] = connectiontypemapping[i].sourceobjecttype1.sname + "-" + 
                  connectiontypemapping[i].sourceobjecttype2.sname + " / " + 
                  connectiontypemapping[i].sourceconnectiontype.sname + " / " + 
                  connectiontypemapping[i].targetobjecttype1.sname + "-" + 
                  connectiontypemapping[i].targetobjecttype2.sname + " / " + 
                  connectiontypemapping[i].targetconnectiontype.sname;
    }
  }
  return result;
}



function addconnectiontypemapping(sourceobjecttype1, sourceconnectiontype, sourceobjecttype2, targetobjecttype1, targetconnectiontype, targetobjecttype2, connectiontypemapping)
{
  var idxtoinsert = -1;

  for (var i = 0 ; i < connectiontypemapping.length ; i++ ){
    if (connectiontypemapping[i].sourceobjecttype1.ntypenum > sourceobjecttype1.ntypenum) {
      idxtoinsert = i;
      break;
    } else if (connectiontypemapping[i].sourceobjecttype1.ntypenum == sourceobjecttype1.ntypenum) {
      if (connectiontypemapping[i].sourceobjecttype2.ntypenum > sourceobjecttype2.ntypenum) {
        idxtoinsert = i;
        break;
      } else if (connectiontypemapping[i].sourceobjecttype2.ntypenum == sourceobjecttype2.ntypenum) {
        if (connectiontypemapping[i].sourceconnectiontype.ntypenum > sourceconnectiontype.ntypenum) {
          idxtoinsert = i;
          break;
        }
      }
    }
  }

  if (idxtoinsert == -1) {
    idxtoinsert = connectiontypemapping.length;
  }

  for(var i = connectiontypemapping.length; i>idxtoinsert; i--) {
    connectiontypemapping[i] = connectiontypemapping[i-1];
  }

  connectiontypemapping[idxtoinsert] = new __usertype_tconnectiontypemappingentry();
  connectiontypemapping[idxtoinsert].sourceobjecttype1 = sourceobjecttype1;
  connectiontypemapping[idxtoinsert].sourceconnectiontype = sourceconnectiontype;
  connectiontypemapping[idxtoinsert].sourceobjecttype2 = sourceobjecttype2;
  connectiontypemapping[idxtoinsert].targetobjecttype1 = targetobjecttype1;
  connectiontypemapping[idxtoinsert].targetconnectiontype = targetconnectiontype;
  connectiontypemapping[idxtoinsert].targetobjecttype2 = targetobjecttype2;
}




function removeconnectiontypemapping(idxobjectmappingconnection, connectiontypemapping)
{
  return removefromarray(connectiontypemapping, idxobjectmappingconnection);
}



function addobjecttypemappingconnectiontype(sourceobjecttype1, sourceconnectiontype, sourceobjecttype2, targetobjecttype1, targetobjecttype2, objecttypemappingconnectiontypes)
{
  var idxtoinsert = -1; 

  for (var i = 0 ; i < objecttypemappingconnectiontypes.length; i++ ){
    if (objecttypemappingconnectiontypes[i].sourceobjecttype1.ntypenum > sourceobjecttype1.ntypenum) {
      idxtoinsert = i;
      break;
    } else if (objecttypemappingconnectiontypes[i].sourceobjecttype1.ntypenum == sourceobjecttype1.ntypenum) {
      if (objecttypemappingconnectiontypes[i].sourceobjecttype2.ntypenum > sourceobjecttype2.ntypenum) {
        idxtoinsert = i;
        break;
      } else if (objecttypemappingconnectiontypes[i].sourceobjecttype2.ntypenum == sourceobjecttype2.ntypenum) {
        if (objecttypemappingconnectiontypes[i].sourceconnectiontype.ntypenum > sourceconnectiontype.ntypenum) {
          idxtoinsert = i;
          break;
        }
      }
    }
  }

  if (idxtoinsert == -1) {
    idxtoinsert = objecttypemappingconnectiontypes.length;
  }

  for(var i = objecttypemappingconnectiontypes.length; i>idxtoinsert; i--) {
    objecttypemappingconnectiontypes[i] = objecttypemappingconnectiontypes[i-1];
  }

  objecttypemappingconnectiontypes[idxtoinsert] = new __usertype_tobjecttypemappingconnectiontypeentry();
  objecttypemappingconnectiontypes[idxtoinsert].sourceobjecttype1       = sourceobjecttype1;
  objecttypemappingconnectiontypes[idxtoinsert].sourceconnectiontype    = sourceconnectiontype;
  objecttypemappingconnectiontypes[idxtoinsert].sourceobjecttype2       = sourceobjecttype2;
  objecttypemappingconnectiontypes[idxtoinsert].targetobjecttype1       = targetobjecttype1;
  objecttypemappingconnectiontypes[idxtoinsert].targetobjecttype2       = targetobjecttype2;
}




function removeobjecttypemappingconnectiontype(idxobjectmappingconnection, objecttypemappingconnectiontypes)
{
  return removefromarray(objecttypemappingconnectiontypes, idxobjectmappingconnection);
}





// --------------------------------
// Dialogseite 4 anzeigen
// 
function showchangeobjecttypedialog4(tErrorTables)
{
  if (isSuccessful()) {
      // BLUE-4735 	
      Dialogs.MsgBox(getString("TEXT42"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_INFORMATION, Context.getScriptInfo(Constants.SCRIPT_TITLE));
      return;
  }
    
  var userdialog = Dialogs.createNewDialogTemplate(630, 510, getString("TEXT4"));
  // %GRID:10,7,1,1
  userdialog.Text(20, 7, 590, 24, getString("TEXT23"), "Text1");
  userdialog.GroupBox(20, 41, 590, 77, getString("TEXT24"));
   userdialog.Table(30, 55, 570, 56, [getString("TEXT30"), getString("TEXT31")], [Constants.TABLECOLUMN_DEFAULT, Constants.TABLECOLUMN_DEFAULT], [], "TABLE_1", Constants.TABLE_STYLE_DEFAULT);
  userdialog.GroupBox(20, 118, 590, 77, getString("TEXT25"));
   userdialog.Table(30, 132, 570, 56, [getString("TEXT30"), getString("TEXT32")], [Constants.TABLECOLUMN_DEFAULT, Constants.TABLECOLUMN_DEFAULT], [], "TABLE_2", Constants.TABLE_STYLE_DEFAULT);
  userdialog.GroupBox(20, 195, 590, 77, getString("TEXT26"));
   userdialog.Table(30, 209, 570, 56, [getString("TEXT30"), getString("TEXT33")], [Constants.TABLECOLUMN_DEFAULT, Constants.TABLECOLUMN_DEFAULT], [], "TABLE_3", Constants.TABLE_STYLE_DEFAULT);
  userdialog.GroupBox(20, 272, 590, 77, getString("TEXT27"));
   userdialog.Table(30, 286, 570, 56, [getString("TEXT34"), getString("TEXT35"), getString("TEXT36")], [Constants.TABLECOLUMN_DEFAULT, Constants.TABLECOLUMN_DEFAULT, Constants.TABLECOLUMN_DEFAULT], [], "TABLE_4", Constants.TABLE_STYLE_DEFAULT);
  userdialog.GroupBox(20, 349, 590, 77, getString("TEXT37"));
   userdialog.Table(30, 363, 570, 56, [getString("TEXT38"), getString("TEXT30")], [Constants.TABLECOLUMN_DEFAULT, Constants.TABLECOLUMN_DEFAULT], [], "TABLE_5", Constants.TABLE_STYLE_DEFAULT);
  userdialog.GroupBox(20, 426, 590, 77, getString("TEXT39"));
   userdialog.Table(30, 440, 570, 56, [getString("TEXT38"), getString("TEXT30")], [Constants.TABLECOLUMN_DEFAULT, Constants.TABLECOLUMN_DEFAULT], [], "TABLE_6", Constants.TABLE_STYLE_DEFAULT);

  userdialog.CheckBox(20, 510, 350, 15, getString("TEXT40"), "CheckProtocol");
   
  userdialog.OKButton();
//  userdialog.HelpButton("HID_5df77ad0_7500_11d9_768f_a722316b722b_dlg_04.hlp");
  
  var dlg = Dialogs.createUserDialog(userdialog); 
  dlg.setDlgListBoxArray("TABLE_1", tErrorTables.notcopiedattributes);
  dlg.setDlgListBoxArray("TABLE_2", tErrorTables.notcopiedlinks);
  dlg.setDlgListBoxArray("TABLE_3", tErrorTables.notcopiedobjects);  
  dlg.setDlgListBoxArray("TABLE_4", tErrorTables.notcopiedconnections);
  dlg.setDlgListBoxArray("TABLE_5", tErrorTables.notcopiedoccs);
  dlg.setDlgListBoxArray("TABLE_6", tErrorTables.notremovedoccs);
  dlg.setDlgValue("CheckProtocol", 1);

  Dialogs.show(__currentDialog = dlg);
  
  if (dlg.getDlgValue("CheckProtocol") == 1) {
    // BLUE-4508 Create output file with the information of the dialog
    outProtocol(tErrorTables);
  }
  
  function isSuccessful() {
      if(tErrorTables.notcopiedattributes.length == 0 && 
         tErrorTables.notcopiedlinks.length == 0 &&
         tErrorTables.notcopiedobjects.length == 0 &&
         tErrorTables.notcopiedconnections.length == 0 &&
         tErrorTables.notcopiedoccs.length == 0 &&
         tErrorTables.notremovedoccs.length == 0) { return true };

      return false;
  }
  
}

function outProtocol(tErrorTables) {
    g_bProtocol = true;

    oOut = Context.createOutputObject();
    oOut.DefineF("HEAD", getString("TEXT41"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
    oOut.DefineF("STD", getString("TEXT41"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
    oOut.DefineF("COL", getString("TEXT41"), 10, Constants.C_WHITE, getTableCellColor_Bk(true), Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);

    oOut.OutputLnF(getString("TEXT23"), "HEAD");
    oOut.OutputLnF("", "STD");
    oOut.OutputLnF(getString("TEXT24"), "HEAD");  // Attributes not copied
    outTable_2(tErrorTables.notcopiedattributes, getString("TEXT30"), getString("TEXT31"));
    oOut.OutputLnF(getString("TEXT25"), "HEAD");  // Assignments not copied
    outTable_2(tErrorTables.notcopiedlinks, getString("TEXT30"), getString("TEXT32"));
    oOut.OutputLnF(getString("TEXT26"), "HEAD");  // Source objects not transferred
    outTable_2(tErrorTables.notcopiedobjects, getString("TEXT30"), getString("TEXT33"));
    oOut.OutputLnF(getString("TEXT27"), "HEAD");  // Source connections not transferred
    outTable_3(tErrorTables.notcopiedconnections, getString("TEXT34"), getString("TEXT35"), getString("TEXT36"));
    oOut.OutputLnF(getString("TEXT37"), "HEAD");  // Object occurrence not copied
    outTable_2(tErrorTables.notcopiedoccs, getString("TEXT38"), getString("TEXT30"));
    oOut.OutputLnF(getString("TEXT39"), "HEAD");  // Object occurrence not deleted
    outTable_2(tErrorTables.notremovedoccs, getString("TEXT38"), getString("TEXT30"));
    oOut.WriteReport();
 
    function outTable_2(aContent, sHead1, sHead2) {
        oOut.OutputLnF("", "STD");
        oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        oOut.TableRow();
        oOut.TableCellF(sHead1, 50, "COL");
        oOut.TableCellF(sHead2, 50, "COL");
        if (aContent.length == 0) {
            oOut.TableRow();
            oOut.TableCellF("", 50, "STD");
            oOut.TableCellF("", 50, "STD");
        } else {
            var i = 0;
            while (aContent.length > i) {
                oOut.TableRow();
                oOut.TableCellF(aContent[i++], 50, "STD");
                oOut.TableCellF(aContent[i++], 50, "STD");
            }
        }
        oOut.EndTable("", 100, getString("TEXT41"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        oOut.OutputLnF("", "STD");
        oOut.OutputLnF("", "STD");        
    }   

    function outTable_3(aContent, sHead1, sHead2, sHead3) {
        oOut.OutputLnF("", "STD");
        oOut.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
        oOut.TableRow();
        oOut.TableCellF(sHead1, 33, "COL");
        oOut.TableCellF(sHead2, 34, "COL");
        oOut.TableCellF(sHead3, 33, "COL");        
        if (aContent.length == 0) {
            oOut.TableRow();
            oOut.TableCellF("", 33, "STD");
            oOut.TableCellF("", 34, "STD");
            oOut.TableCellF("", 33, "STD");
        } else {
            var i = 0;
            while (aContent.length > i) {
                oOut.TableRow();
                oOut.TableCellF(aContent[i++], 33, "STD");
                oOut.TableCellF(aContent[i++], 34, "STD");
                oOut.TableCellF(aContent[i++], 33, "STD");
            }
        }
        oOut.EndTable("", 100, getString("TEXT41"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);        
        oOut.OutputLnF("", "STD");
        oOut.OutputLnF("", "STD");
    } 
}

function getTableEntries1(notcopiedattributes) {
    var aTableEntries = new Array();
    notcopiedattributes = ArisData.Unique(notcopiedattributes);       // Filter out different languages
    notcopiedattributes = notcopiedattributes.sort(sortAttrs);
    
    for (var i = 0; i < notcopiedattributes.length; i++) {
        var oAttr = notcopiedattributes[i];
        aTableEntries.push(oAttr.getParentItem().Name(g_nloc));
        aTableEntries.push(oAttr.Type());
    }
    return aTableEntries;
    
    function sortAttrs(attrA, attrB) {
        result = StrComp(attrA.getParentItem().Name(g_nloc), attrB.getParentItem().Name(g_nloc));
        if (result == 0) result = StrComp(attrA.Type(), attrB.Type());
        return result;
    }
} 

function getTableEntries2(notcopiedlinks) {
    var aTableEntries = new Array();
    notcopiedlinks = notcopiedlinks.sort(sortLinks);
    
    for (var i = 0; i < notcopiedlinks.length; i++) {
        var oLink = notcopiedlinks[i];
        aTableEntries.push(oLink.objDef.Name(g_nloc));
        aTableEntries.push(oLink.assignedModel.Name(g_nloc));
    }
    return aTableEntries;
    
    function sortLinks(linkA, linkB) {
        result = StrComp(linkA.objDef.Name(g_nloc), linkB.objDef.Name(g_nloc));
        if (result == 0) result = StrComp(linkA.assignedModel.Name(g_nloc), linkB.assignedModel.Name(g_nloc));
        return result;
    }
}

function getTableEntries3(notcopiedobjects) {
    var aTableEntries = new Array();
    notcopiedobjects = notcopiedobjects.sort(sortObjs);
    
    for (var i = 0; i < notcopiedobjects.length; i++) {
        var oObj = notcopiedobjects[i];
        aTableEntries.push(oObj.Name(g_nloc));
        aTableEntries.push(oObj.Type());
    }
    return aTableEntries;
    
    
    function sortObjs(objA, objB) {
        result = StrComp(objA.Type(), objB.Type());
        if (result == 0) result = StrComp(objA.Name(g_nloc), objB.Name(g_nloc));
        return result;
    }
}  

function getTableEntries4(notcopiedconnections) {
    var aTableEntries = new Array();
    notcopiedconnections = ArisData.Unique(notcopiedconnections);       // Filter out different directions
    notcopiedconnections = notcopiedconnections.sort(sortCxns);
    
    for (var i = 0; i < notcopiedconnections.length; i++) {
        var oCxn = notcopiedconnections[i];
        aTableEntries.push(oCxn.SourceObjDef().Name(g_nloc));
        aTableEntries.push(oCxn.ActiveType());
        aTableEntries.push(oCxn.TargetObjDef().Name(g_nloc));
    }
    return aTableEntries;
    
    
    function sortCxns(cxnA, cxnB) {
        result = StrComp(cxnA.ActiveType(), cxnB.ActiveType());
        if (result == 0) result = StrComp(cxnA.SourceObjDef().Name(g_nloc), cxnB.SourceObjDef().Name(g_nloc));
        if (result == 0) result = StrComp(cxnA.TargetObjDef().Name(g_nloc), cxnB.TargetObjDef().Name(g_nloc));
        return result;
    }
}  

function getTableEntries56(occList) {
    var aTableEntries = new Array();
    occList = occList.sort(sortObjOccs);
    
    for (var i = 0; i < occList.length; i++) {
        var oObjOcc = occList[i];
        aTableEntries.push(oObjOcc.Model().Name(g_nloc));
        aTableEntries.push(oObjOcc.ObjDef().Name(g_nloc));
    }
    return aTableEntries;
    
    function sortObjOccs(objOccA, objOccB) {
        result = StrComp(objOccA.Model().Name(g_nloc), objOccB.Model().Name(g_nloc));
        if (result == 0) result = StrComp(objOccA.ObjDef().Name(g_nloc), objOccB.ObjDef().Name(g_nloc));
        return result;
    }
}


function getObjectNameAndType(objecttype) {
    return formatstring2("@1 (#@2)", objecttype.sname, objecttype.ntypenum);
}


// ------------------------------------------------------------
// Liefert Array mit Objekttypenamen fuer Objekttyp-Array
// 
function getobjecttypenames(objecttypes)
{
  var result = new Array(); 
  for (var i = 0 ; i < objecttypes.length; i++ ){
    result[i] = getObjectNameAndType(objecttypes[i]);
  }
  return result;
}



// ------------------------------------------------------------
// Liefert Array mit Symboltypenamen fuer Symboltyp-Array
// 
function getsymboltypenames(symboltypes)
{
  var result = new Array(); 
  for (var i = 0 ; i < symboltypes.length; i++ ){
    result[i] = symboltypes[i].sname;
  }
  return result;
}


// ------------------------------------------------------------
// Liefert Array mit Objekttype-Mappingtexten fuer ObjekttypMapping-Array
// 
function getobjecttypemappingtexts(objecttypemapping)
{
  var result = new Array(); 
  for (var i = 0 ; i < objecttypemapping.length; i++ ){
      result[i] = getObjectNameAndType(objecttypemapping[i].sourceobjecttype) + " -> " + 
                  getObjectNameAndType(objecttypemapping[i].targetobjecttype);
  }
  return result
}




// ------------------------------------------------------------
// Liefert Array mit Attributtypenamen fuer Attributtyp-Array
// 
function getattributetypenames(attributetypes)
{
  var result = new Array(); 
  for (var i = 0 ; i < attributetypes.length; i++ ){
    result[i] = attributetypes[i].sname;
  }
  return result;
}






// ==================================================================================
// =
// =  Initialisierung der Typenlisten
// =
// ==================================================================================

// -------------------------------------------
// Liefert verfuegbare Objekttypen
// 
function initobjecttypes()
{
    var result = new Array();
    
    var typenums = g_oFilter.ObjTypes();
    for (var i = 0; i < typenums.length; i++) {
        
        result[i] = new __usertype_tType();
        result[i].ntypenum = typenums[i];
        result[i].sname = g_oFilter.ObjTypeName(typenums[i]);
    }
    return result;
}

// -------------------------------------------
// Liefert verfuegbare Attributtypen
// 
function initattributetypes()
{
    var result = new Array();
    
    // Hier noch weitere sinnvolle Werte angeben
    result[0] = new __usertype_tType();
    result[0].ntypenum = Constants.AT_NAME;
    result[1] = new __usertype_tType();
    result[1].ntypenum = Constants.AT_ID;
    result[2] = new __usertype_tType();
    result[2].ntypenum = Constants.AT_DESC;
    result[3] = new __usertype_tType();
    result[3].ntypenum = Constants.AT_CREATOR;
    
    for (var i = 0 ; i < result.length; i++) {
        result[i].sname = g_oFilter.AttrTypeName(result[i].ntypenum);
    }
    return result;
}

// ---------------------------------------------
// Ermittelt Symboltypen fuer angegebenen Objekttyp
// 
function getsymboltypesforobject(objecttypenum, binsertnosymboltype)
{
    var symboltypelist = new Array(); 
    
    if (binsertnosymboltype!=null && binsertnosymboltype) {
        symboltypelist[0] = new __usertype_tType();
        symboltypelist[0].ntypenum = 0;
        symboltypelist[0].sname = getString("TEXT29");  
    }
    
    var symbolSet = new java.util.HashSet();
    
    var modeltypenums = g_oFilter.ModelTypes(Constants.ARISVIEW_ORG | Constants.ARISVIEW_FUNC | Constants.ARISVIEW_DATA | Constants.ARISVIEW_CTRL);  
    for (var i = 0; i < modeltypenums.length; i++) {

        var modelSymbols = g_oFilter.Symbols(modeltypenums[i], objecttypenum).sort(sortSymbolName);
        for (var j = 0; j < modelSymbols.length; j++) {

            symbolSet.add(modelSymbols[j]);
        }    
    }
    var symboltypenums = (symbolSet.toArray()).sort(sortSymbolName);
    for (var i = 0; i < symboltypenums.length; i++) {

        var ntypenum = symboltypenums[i];
        
        var symboltype = new __usertype_tType();
        symboltype.ntypenum = ntypenum;
        symboltype.sname = getSymbolName(ntypenum);
        symboltypelist.push(symboltype);
    }
    return symboltypelist;

    
    function sortSymbolName(symbolType1, symbolType2) {
        return StrCompIgnoreCase(getSymbolName(symbolType1), getSymbolName(symbolType2));
    }
}

function getSymbolName(symbolType) {
    return g_oFilter.SymbolName(symbolType) + " (#"+symbolType+")"
}

function getobjecttypesforactivedatabase() {
    var objtypenums = g_oFilter.ObjTypes().sort(sortObjTypeName);
    
    var objecttypelist = new Array(); 
    for (var i = 0 ; i < objtypenums.length ; i++ ){
        
        var objecttype = new __usertype_tType();
        objecttype.ntypenum = objtypenums[i];
        objecttype.sname = g_oFilter.ObjTypeName(objtypenums[i]);
        objecttypelist.push(objecttype);
    }
    return objecttypelist;
    
    function sortObjTypeName(objType1, objType2) {
        return StrCompIgnoreCase(g_oFilter.ObjTypeName(objType1), g_oFilter.ObjTypeName(objType2));
    }
}

// ==================================================================================
// =
// =  Listen-Verwaltungsfunktionen
// =
// ==================================================================================


// ------------------------------------------------------------
// Fuegt dem Array einen Eintrag hinzu
// 
function addobjecttype(objecttype, objecttypelist)
{
  var idxtoinsert = -1;
  
  for (var i = 0 ; i < objecttypelist.length ; i++ ){
    if (StrCompIgnoreCase(objecttype.sname, objecttypelist[i].sname) < 0) {
      idxtoinsert = i;
      break;
    }
  }

  if (idxtoinsert == -1) {
    idxtoinsert = objecttypelist.length;
  }

  for(var i = objecttypelist.length; i>idxtoinsert; i--) {
    objecttypelist[i] = objecttypelist[i-1];
  }

  objecttypelist[idxtoinsert] = objecttype;
}

// ------------------------------------------------------------
// Fuegt dem Mapping einen Eintrag hinzu
// 

function addobjecttypemapping(sourceobjecttype, targetobjecttype, objecttypemapping)
{
  objecttypemapping[0] = new __usertype_tobjecttypemappingentry();
  objecttypemapping[0].sourceobjecttype = sourceobjecttype;
  objecttypemapping[0].targetobjecttype = targetobjecttype;
}

// ------------------------------------------------------------
// BLUE-4829 - Functions for update of matrix models
// 
function isOccInMatrix(oObjOcc) {
    var modelType = oObjOcc.Model().TypeNum();
    return g_oFilter.isMatrixModel(modelType);
}

function getMatrixModels(aObjDefs) {
    var matrixModelTypes = new Array();
    var modelTypes = g_oFilter.ModelTypes(Constants.ARISVIEW_ALL);
    
    for (var i = 0; i < modelTypes.length; i++) {
        var modelType = modelTypes[i];
        if (g_oFilter.isMatrixModel(modelType)) {
            matrixModelTypes.push(modelType);
        }
    }
    if (matrixModelTypes.length == 0) return null;
    return ArisData.getActiveDatabase().Find(Constants.SEARCH_MODEL, matrixModelTypes);
}

function updateMatrixCxns(mappedobjects, mappedconnections, connectiontypemapping, notcopiedconnections) {
    for (var i = 0; i < mappedobjects.length; i++) {
        oobjdef       = ArisData.getActiveDatabase().FindGUID(mappedobjects[i].sorigguid);
        ocopyofobjdef = ArisData.getActiveDatabase().FindGUID(mappedobjects[i].scopyguid);
        if (!oobjdef.IsValid() || !ocopyofobjdef.IsValid()) continue;
        
        var ocxndefs = oobjdef.CxnList();
        for (var j = 0; j < ocxndefs.length; j++) {
            var ocxndef = ocxndefs[j];
            
            // Partner ermitteln
            var opartnerobjdef = ocxndef.SourceObjDef();
            var bpartneristarget = false;
            if (opartnerobjdef.IsEqual(oobjdef)) {
                opartnerobjdef = ocxndef.TargetObjDef();
                bpartneristarget = true;
            }
            
            // ( Anubis 436328 - Cxn, object and partner object type before changing (Remark: Must be assigned before mapping of partnerobjocc, see below) )
            var ncxntypenum = ocxndef.TypeNum();
            var nobjtypenum = oobjdef.TypeNum(); 
            var npartnerobjtypenum = opartnerobjdef.TypeNum();    
            
            // Partner umgesetzt ?
            for (var k = 0; k < mappedobjects.length; k++) {
                if (opartnerobjdef.GUID() == mappedobjects[k].sorigguid) {
                    opartnerobjdef = ArisData.getActiveDatabase().FindGUID(mappedobjects[k].scopyguid);
                    break;
                }
            }
            
            var osrcobjdef; var otrgobjdef;
            if (bpartneristarget) {
                osrcobjdef = ocopyofobjdef;
                otrgobjdef = opartnerobjdef;
            } else {
                osrcobjdef = opartnerobjdef;
                otrgobjdef = ocopyofobjdef;
            }
            
            var ocopyofcxndef = null;
            for (var k = 0 ; k < mappedconnections.length; k++ ){
                if (ocxndef.GUID() == mappedconnections[k].sorigguid) {
                    ocopyofcxndef = ArisData.getActiveDatabase().FindGUID(mappedconnections[k].scopyguid);
                    break;
                }
            }
            
            if (ocopyofcxndef != null && ocopyofcxndef.IsValid()) continue;

            var targetconnectiontype = gettargetconnectiontypeforobjectpairandconnection(nobjtypenum, npartnerobjtypenum, ncxntypenum, connectiontypemapping);
            if (targetconnectiontype.ntypenum != 0) {
                ocopyofcxndef = osrcobjdef.CreateCxnDef(otrgobjdef, targetconnectiontype.ntypenum);
                
                if (! (ocopyofcxndef == null || !ocopyofcxndef.IsValid()) ) {
                    copycxnattributes(ocxndef, ocopyofcxndef);
                } else {
                    notcopiedconnections.push(ocxndef);
                }
            } else {
                // vermerken, dass nicht kopiert wurde
                notcopiedconnections.push(ocxndef);          
            }
        }
    }
    return notcopiedconnections;
}           

function updateMatrixObjects(matrixModels, mappedobjects, objectandsymboltypemapping) {
    var aUpdatedModels = new Array();       // Needed to update MatrixCxnData afterwards
    var mapHeaderCell2Parent = new java.util.HashMap();
    var mapHeaderCell2Copy = new java.util.HashMap();    
    
    for (var i = 0; i < mappedobjects.length; i++) {
        oobjdef       = ArisData.getActiveDatabase().FindGUID(mappedobjects[i].sorigguid);
        ocopyofobjdef = ArisData.getActiveDatabase().FindGUID(mappedobjects[i].scopyguid);
        if (!oobjdef.IsValid() || !ocopyofobjdef.IsValid()) continue;
        
        // create/delete occs
        for (var j = 0; j < matrixModels.length; j++) {
            var bIsUpdated = false;
            var oModel = matrixModels[j];
            if (oobjdef.OccListInModel(oModel).length == 0) continue;
            
            var nSymbolNums = getUsedSymbolNums(oobjdef, oModel);
            for ( var s = 0 ; s < nSymbolNums.length; s++ ){
                
                targetsymboltype = gettargetsymboltypeforobjectandsymboltype(oobjdef.TypeNum(), nSymbolNums[s], objectandsymboltypemapping);                    
                if (targetsymboltype.ntypenum != 0) {
                    var srcSymbol = nSymbolNums[s];
                    var trgSymbol = targetsymboltype.ntypenum;
                    if (updateObjectsInMatrix(oModel, oobjdef, ocopyofobjdef, srcSymbol, trgSymbol)) bIsUpdated = true;
                }
            }
            if (bIsUpdated) aUpdatedModels.push(oModel);
        }
    }
    
    // Update parent assignment
    var iter = mapHeaderCell2Parent.keySet().iterator();
    while (iter.hasNext()) {
        bUpdate = false;
        var headerCell = iter.next();
        var parent = mapHeaderCell2Parent.get(headerCell);
        
        if (mapHeaderCell2Copy.containsKey(headerCell)) {       // check header cell
            bUpdate = true;
            headerCell = mapHeaderCell2Copy.get(headerCell);
        }
        if (mapHeaderCell2Copy.containsKey(parent)) {           // check parent
            bUpdate = true;
            var bIsExpanded = parent.isExpanded();
            
            parent = mapHeaderCell2Copy.get(parent);
            parent.setExpanded(bIsExpanded);
        }
        if (bUpdate) {
            headerCell.setParent(parent);
        }
    }
    
    // Delete obsolete (= copied) header cells
    var iter = mapHeaderCell2Copy.keySet().iterator();
    while (iter.hasNext()) {
        var headerCell = iter.next();
        var matrix = headerCell.getMatrix();
        var parent = headerCell.getParent();
        if (!mapHeaderCell2Copy.containsKey(parent)) {
            matrix.deleteHeaderCell(headerCell);    // deletes headerCell incl. children
        }
    }

    return ArisData.Unique(aUpdatedModels);

    function updateObjectsInMatrix(omodel, oobjdef, ocopyofobjdef, srcSymbol, trgSymbol) {
        var bIsUpdated = false;
        var matrix = omodel.getMatrixModel();
        
        getParentMapping(true);
        getParentMapping(false);        
        
        updateObjectsInHeader(true);   // Row header cells
        updateObjectsInHeader(false);  // Column header cells
        
        return bIsUpdated;
        
        function updateObjectsInHeader(rowHeader) {
            var headerCells = getHeaderCells(rowHeader);
            if (headerCells.length > 0) {
                updateVisibleSymbols(rowHeader);
            }         
            for (var h = 0; h < headerCells.length; h++) {
                bIsUpdated = true;
                var headerCell = headerCells[h]; 
                var parent = headerCell.getParent();
                var children = headerCell.getChildren();
    
                // create new header cell
                var copyHeaderCell = matrix.createHeaderCell(headerCell, ocopyofobjdef, trgSymbol, headerCell.getSize(), rowHeader);

                mapHeaderCell2Copy.put(headerCell, copyHeaderCell);
            }
            return bIsUpdated;
        }
        
        function getHeaderCells(rowHeader) {
            var myHeaderCells = new Array();
            
            var allHeaderCells = matrix.getHeader(rowHeader).getCells();
            for (var h = 0; h < allHeaderCells.length; h++) {
                var headerCell = allHeaderCells[h];
                if (headerCell.getDefinition() != null && headerCell.getDefinition().IsEqual(oobjdef) && headerCell.getSymbolNum() == srcSymbol) {
                    myHeaderCells.push(headerCell);
                }
            }
            return myHeaderCells;
        }
        
        function updateVisibleSymbols(rowHeader) {
            var nSymbolNums = matrix.getVisibleObjectSymbolTypes(rowHeader);
            if (!isExistingSymbol(trgSymbol, nSymbolNums)) {
                nSymbolNums.push(trgSymbol);
                matrix.setVisibleObjectSymbolTypes(nSymbolNums, rowHeader);
            }
        }
        
        function getParentMapping(rowHeader) {
            var allHeaderCells = matrix.getHeader(rowHeader).getCells();
            for (var h = 0; h < allHeaderCells.length; h++) {
                var headerCell = allHeaderCells[h];
                var parent = headerCell.getParent();
                if (parent != null) {
                    mapHeaderCell2Parent.put(headerCell, parent);
                }
            }
        }
    }
    
    function getUsedSymbolNums(oobjdef, oModel) {
        var nSymbolNums = new Array();
        
        var oobjoccs = oobjdef.OccListInModel(oModel);
        for (var i = 0 ; i < oobjoccs.length; i++ ) {
            var nSymbol = oobjoccs[i].SymbolNum();
            if (!isExistingSymbol(nSymbol, nSymbolNums)) {
                nSymbolNums.push(nSymbol);
            }
        }
        return nSymbolNums;
    }    

    function isExistingSymbol(nSymbolNum, nSymbolNums) {
        for (var s = 0; s < nSymbolNums.length; s++) {
            if (nSymbolNums[s] == nSymbolNum) return true;
        }
        return false;
    }
}

function updateMatrixCxnData(aUpdatedModels, objectandsymboltypemapping, connectiontypemapping) {
    var modelCount = 0;
    for (var i = 0; i < aUpdatedModels.length; i++) {
        var matrix = aUpdatedModels[i].getMatrixModel();

        var aNewCxnData = new Array();
        
        var aCxnData = matrix.getCxnData();
        for (var j = 0; j < aCxnData.length; j++) { 
            var cxnData = aCxnData[j];
            var cxnType = cxnData.getCxnType();
            var srcSymbol = cxnData.getSourceSymbolTypeNum();
            var trgSymbol = cxnData.getTargetSymbolTypeNum();
            
            var srcObjType = g_oFilter.SymbolObjType(srcSymbol);
            var trgObjType = g_oFilter.SymbolObjType(trgSymbol);

            var copyCxnType = gettargetconnectiontypeforobjectpairandconnection(srcObjType, trgObjType, cxnType, connectiontypemapping).ntypenum;
            var copySrcSymbol = gettargetsymboltypeforobjectandsymboltype(srcObjType, srcSymbol, objectandsymboltypemapping).ntypenum;
            var copyTrgSymbol = gettargetsymboltypeforobjectandsymboltype(trgObjType, trgSymbol, objectandsymboltypemapping).ntypenum;
            
            if (copyCxnType == 0) continue;
            if (copySrcSymbol == 0) copySrcSymbol = srcSymbol;
            if (copyTrgSymbol == 0) copyTrgSymbol = trgSymbol;            
            if (!isValidCxnData(copyCxnType, copySrcSymbol, copyTrgSymbol)) continue;
            if (isExistingCxnData(aCxnData, copyCxnType, copySrcSymbol, copyTrgSymbol)) continue;
            
            var newCxnData = matrix.createNewMatrixConnectionDataObject(copySrcSymbol, copyTrgSymbol, copyCxnType, 
                                                                        cxnData.isFromRowToCol(), cxnData.isVisible(), cxnData.isDefault());
            aNewCxnData.push(newCxnData);
        }
        if (aNewCxnData.length > 0) {
            aCxnData = aCxnData.concat(aNewCxnData);
            matrix.setCxnData(aCxnData);
        }
        
        modelCount++;
        if (modelCount % 50 == 0) {                
            ArisData.Save(Constants.SAVE_NOW);    // Store every 50 matrix models (BLUE-BLUE-12362)
        }        
    }
    
    function isValidCxnData(cxnType, srcSymbol, trgSymbol) {
        var allowedCxnTypes = g_oFilter.CxnTypesFromObj(g_oFilter.SymbolObjType(srcSymbol), g_oFilter.SymbolObjType(trgSymbol));
        for (var t = 0; t < allowedCxnTypes.length; t++) {
            if (allowedCxnTypes[t] == cxnType) return true;
        }
        return false;
    }
                        
    function isExistingCxnData(aCxnData, p_cxnType, p_srcSymbol, p_trgSymbol) {
        for (var t = 0; t < aCxnData.length; t++) {
            var cxnData = aCxnData[j];
            
            if (p_cxnType == cxnData.getCxnType() &&
                p_srcSymbol == cxnData.getSourceSymbolTypeNum() &&
                p_trgSymbol == cxnData.getTargetSymbolTypeNum()) return true;
        }
        return false;
    }    
}

function StrCompIgnoreCase(Str1, Str2) {
    var tmp_Str1 = new java.lang.String(Str1);
    var res = tmp_Str1.compareToIgnoreCase(new java.lang.String(Str2));
    return (res < 0) ? -1 : ((res > 0) ? 1 : 0);
}



main();
