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

Context.setProperty("excel-formulas-allowed", false); //default value is provided by server setting (tenant-specific): "abs.report.excel-formulas-allowed"

 // Report Configuration
const SHOW_DIALOGS_IN_CONNECT = false;  // Show dialogs in ARIS Connect - Default=false (BLUE-12274)
const OUT_GROUP_PATH = true;            // Output group path - Default=true 

/****************************************************/

//----------------------- GLOBAL CONSTANTS FOR MODEL\OBJECT\CONNECTION\ATTRIBUTE TYPES -------------------

//-----------------------------------------MODEL TYPES----------------------------------------------------
var MT = Array("MT_EEPC","MT_EEPC_COLUMN","MT_EEPC_TAB_HORIZONTAL","MT_EEPC_INST","MT_EEPC_MAT",
               "MT_EEPC_ROW","MT_EEPC_TAB","MT_OFFICE_PROC","MT_PRCS_CHN_DGM","MT_BPD_BPMN",
               "MT_SCEN_DGM","MT_IND_PROC","MT_PCD_MAT" ,
               "MT_ENTERPRISE_BPMN_COLLABORATION" ,"MT_ENTERPRISE_BPMN_PROCESS");       // BLUE-10581
               
//-----------------------------------------OBJECT TYPES---------------------------------------------------

//Organisational elements
var OT = Array("OT_ORG_UNIT","OT_ORG_UNIT_TYPE","OT_SYS_ORG_UNIT","OT_SYS_ORG_UNIT_TYPE","OT_POS",
               "OT_PERS_TYPE","OT_PERS","OT_GRP","OT_EMPL_INST","OT_LOC");

//Information systems types
var IT = Array("OT_APPL_SYS_CLS", "OT_APPL_SYS_TYPE", "OT_APPL_SYS", "OT_SCRN_DSGN", "OT_SCRN", 
               "OT_MOD_TYPE", "OT_MOD");

//Input/Output
var IO = Array("OT_CLST", "OT_ENT_TYPE", "OT_RELSHP_TYPE", "OT_ATTR_TYPE_GRP", "OT_ERM_ATTR", 
               "OT_COT_ATTR", "OT_OBJ_CX", "OT_TECH_TRM", "OT_BUSY_OBJ", "OT_KNWLDG_CAT", "OT_PACK", 
               "OT_CLS", "OT_INFO_CARR", "OT_LST", "OT_LST_DSGN", "OT_BUSINESS_RULE");


//---------------------------------------CONNECTION TYPES-------------------------------------------------

//Functions connections to organisational elements:
//--"Executes" connections
var CTF_EXEC = Array("CT_EXEC_1","CT_EXEC_2","CT_EXEC_3","CT_EXEC_4","CT_AGREES","CT_CONTR_TO_1","CT_CONTR_TO_2","CT_DECD_ON","CT_DECID_ON");
//--"Involved" connections
var CTF_INV = Array("CT_HAS_CONSLT_ROLE_IN_1","CT_HAS_CONSLT_ROLE_IN_2","CT_IS_DP_RESP_1","CT_IS_DP_RESP_2",
                     "CT_IS_TECH_RESP_1","CT_IS_TECH_RESP_2","CT_IS_TECH_RESP_3","CT_MUST_BE_INFO_ABT_1",
                     "CT_MUST_BE_INFO_ABT_2","CT_MUST_BE_INFO_ON_CNC_1","CT_MUST_BE_INFO_ON_CNC_2",
                     "CT_MUST_INFO_ABT_RES","CT_MUST_INFO_ABT_RES_OF");
                     
//IT connections
//--"Supports" connections
var CTF_IT_SUPP = Array("CT_CAN_SUPP_1","CT_SUPP_1","CT_SUPP_2","CT_SUPP_3","CT_SUPPORTS");
//--"Executes" connections
var CTF_IT_EXEC = Array("CT_EXEC_2");

//Input connections
var CTF_IN = Array("CT_IS_INP_FOR","CT_IS_GRANT_BY","CT_IS_CHCKD_BY","CT_PROV_INP_FOR","CT_PROV_INP_FOR_1");

//Output connections
var CTF_OUT = Array("CT_CRT_OUT_TO","CT_READ_1","CT_READ_2","CT_HAS_OUT","CT_CHNG","CT_ARCH","CT_CREATES",
                    "CT_CRT_1","CT_CRT_2","CT_CRT_3","CT_CRT_4","CT_CRT_6","CT_DEL","CT_DISTR");

//----------------------------------------ATTRIBUTE TYPES-------------------------------------------------

var AT = Array("AT_NUM_OF_EMPL","AT_DESC");

//=========================================================================================================

//Dialog support depends on script runtime environment (STD resp. BP, TC)
var g_bDialogsSupported = isDialogSupported(); 
  
var nloc    = Context.getSelectedLanguage();
var g_bRunByService = false;    // Anubis 379731

var dlgFuncOutput;
var colWidth;
// text constants
// dialog text constants
//Buttons names
var txtOutputOptionsDialogTitle = getString("TEXT1");
var txtReportCategory       = getString("TEXT2");
var txtFuncWeakRep          = getString("TEXT3");
var txtJobDesc              = getString("TEXT4");
var txtModel                = getString("TEXT5");
var txtModelPath            = getString("TEXT6");
var txtAttribute            = getString("TEXT10");
var txtIncludeFAD           = getString("TEXT7");
var txtOrgEl                = getString("TEXT8");
var txtOtherOrgEl           = getString("TEXT9");
var txtAttribute            = getString("TEXT10");
var txtExecuteConn          = getString("TEXT11");
var txtInvolvedConn         = getString("TEXT12");
var txtOther                = getString("TEXT_5");
var txtInput                = getString("TEXT_1");
var txtOutput               = getString("TEXT_2")
var txtSuppIT               = getString("TEXT_3");
var txtExecIT               = getString("TEXT_20");
var txtImpPotential         = getString("TEXT_4");

// output text constants
var txtObjectName           = getString("TEXT13");
var txtObjectType           = getString("TEXT14");
var txtRelationType         = getString("TEXT15");
var txtGroup                = getString("TEXT16");
var selObjTypeOrg           = null;
var selObjTypeFunc          = null;
// messagebox text constants
var txtNoOrgObject          = getString("TEXT17");

var aFilter = ArisData.getActiveDatabase().ActiveFilter();

function main(){
  var ocurrentattribute = null;   // Current attribute.
  var ocurrentuser = null;   // Current user.

  var bchecktyp = false;   // For checking whether the object that is related to the current object is of the right type.
  var btruecxntype = false;   // Variable for the connection type.

  // Set
  var nvalidobjdefs = 0;

  // Precondition before loop: no object has the correct type.
  var bcheckfirst       = true;
  var outfile = Context.createOutputObject();
  outfile.DefineF("REPORT1", getString("TEXT20"), 24, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER, 0, 21, 0, 0, 0, 1);
  outfile.DefineF("REPORT2", getString("TEXT20"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);
  outfile.DefineF("REPORT3", getString("TEXT20"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 21, 0, 0, 0, 1);

  var omodels  = ArisData.getSelectedModels();
  var oobjdefs = ArisData.getSelectedObjDefs();

  if (oobjdefs.length>0) {
      selObjTypeOrg   = false;
      selObjTypeFunc  = false;

      for(var ch=0;ch<oobjdefs.length;ch++) {
          if (checkObj(oobjdefs[ch])) {
              selObjTypeOrg = true;
          }
          if (oobjdefs[ch].TypeNum() == Constants.OT_FUNC) {
              selObjTypeFunc = true;
          }
      }
      
      if (!selObjTypeOrg && !selObjTypeFunc) {
          Dialogs.MsgBox(txtNoOrgObject, Constants.MSGBOX_BTN_OK, getString("TEXT23"));
          return;
      }
  }

  if ((oobjdefs.length > 0)||(omodels.length > 0)){
    var holder_nOptReportCategory   = new __holder(0);
    var holder_bModelPath           = new __holder(false);
    var holder_bIncludeFAD          = new __holder(false);
    var holder_bAttribute           = new __holder(false);
    var holder_bInvolvedConn        = new __holder(false);
    var holder_bOExecuteConn        = new __holder(false);
    var holder_bOInvolvedConn       = new __holder(false);
    var holder_bInput               = new __holder(false);
    var holder_bOutput              = new __holder(false);
    var holder_bSuppIT              = new __holder(false);
    var holder_bExecIT              = new __holder(false);
    var holder_bImpPotential        = new __holder(false);

    if (Context.getProperty("Prop_JobDesc") != null) {
        // Anubis 379731 - Called by APG service 
        g_bRunByService = true;
        
        holder_nOptReportCategory.value   = getBoolPropertyValue("Prop_JobDesc") ? 1 : 0;
        holder_bModelPath.value           = getBoolPropertyValue("Prop_ModelPath");
        holder_bIncludeFAD.value          = getBoolPropertyValue("Prop_IncludeFAD");
        holder_bAttribute.value           = getBoolPropertyValue("Prop_Attributes");
        holder_bInvolvedConn.value        = getBoolPropertyValue("Prop_ContrToCxns");
        holder_bOExecuteConn.value        = getBoolPropertyValue("Prop_FurtherCarrOutCxns");
        holder_bOInvolvedConn.value       = getBoolPropertyValue("Prop_FurtherContrToCxns");
        holder_bInput.value               = getBoolPropertyValue("Prop_OtherInput");
        holder_bOutput.value              = getBoolPropertyValue("Prop_OtherOutput");
        holder_bSuppIT.value              = getBoolPropertyValue("Prop_OtherSuppIT");
        holder_bExecIT.value              = getBoolPropertyValue("Prop_OtherExecIT");
        holder_bImpPotential.value        = getBoolPropertyValue("Prop_OtherImpPotential");
    } else {    
        if( g_bDialogsSupported ){  // STD
            // Read dialog settings from config
            var sSection = "SCRIPT_b64bbf90_ffc5_11dc_1246_eac6a62b581c";
            holder_nOptReportCategory.value   = getSettings(sSection, "nOptReportCategory", holder_nOptReportCategory.value==1);    // BLUE-11220
            holder_bModelPath.value           = getSettings(sSection, "bModelPath", holder_bModelPath.value);
            holder_bIncludeFAD.value          = getSettings(sSection, "bIncludeFAD", holder_bIncludeFAD.value);
            holder_bAttribute.value           = getSettings(sSection, "bAttribute", holder_bAttribute.value);
            holder_bInvolvedConn.value        = getSettings(sSection, "bInvolvedConn", holder_bInvolvedConn.value); 
            holder_bOExecuteConn.value        = getSettings(sSection, "bOExecuteConn", holder_bOExecuteConn.value);
            holder_bOInvolvedConn.value       = getSettings(sSection, "bOInvolvedConn", holder_bOInvolvedConn.value);
            holder_bInput.value               = getSettings(sSection, "bInput", holder_bInput.value);
            holder_bOutput.value              = getSettings(sSection, "bOutput", holder_bOutput.value);
            holder_bSuppIT.value              = getSettings(sSection, "bSuppIT", holder_bSuppIT.value);
            holder_bExecIT.value              = getSettings(sSection, "bExecIT", holder_bExecIT.value);
            holder_bImpPotential.value        = getSettings(sSection, "bImpPotential", holder_bImpPotential.value);
            
            nuserdialog = showOutputOptionsDialog(holder_nOptReportCategory, holder_bModelPath, 
                                      holder_bIncludeFAD, holder_bAttribute, holder_bInvolvedConn, 
                                      holder_bOExecuteConn, holder_bOInvolvedConn,
                                      holder_bInput, holder_bOutput, holder_bSuppIT, holder_bExecIT, holder_bImpPotential);
            if (nuserdialog == 0) {
              // Anubis 406948  
              Context.setProperty(Constants.PROPERTY_SHOW_OUTPUT_FILE, false);
              Context.setProperty(Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false); 
              Context.setScriptError(Constants.ERR_CANCEL);
              return;
            } else {
                // Write dialog settings to config
            setSettings(sSection, "nOptReportCategory", holder_nOptReportCategory.value==1);    // BLUE-11220
            setSettings(sSection, "bModelPath", holder_bModelPath.value);
            setSettings(sSection, "bIncludeFAD", holder_bIncludeFAD.value);
            setSettings(sSection, "bAttribute", holder_bAttribute.value);
            setSettings(sSection, "bInvolvedConn", holder_bInvolvedConn.value); 
            setSettings(sSection, "bOExecuteConn", holder_bOExecuteConn.value);
            setSettings(sSection, "bOInvolvedConn", holder_bOInvolvedConn.value);
            setSettings(sSection, "bInput", holder_bInput.value);
            setSettings(sSection, "bOutput", holder_bOutput.value);
            setSettings(sSection, "bSuppIT", holder_bSuppIT.value);
            setSettings(sSection, "bExecIT", holder_bExecIT.value);
            setSettings(sSection, "bImpPotential", holder_bImpPotential.value);
            }
        } else {    // BP, TC
            //As default before change was made all = __holder(false);
            //except holder_nOptReportCategory   = new __holder(0);
            holder_nOptReportCategory.value   = 1;
            holder_bModelPath.value           = OUT_GROUP_PATH;
            holder_bIncludeFAD.value          = true;
            holder_bAttribute.value           = true;
            holder_bInvolvedConn.value        = true; 
            holder_bOExecuteConn.value        = true;
            holder_bOInvolvedConn.value       = true;
            holder_bInput.value               = true;
            holder_bOutput.value              = true;
            holder_bSuppIT.value              = true;
            holder_bExecIT.value              = true;
            holder_bImpPotential.value        = true;
            
            // BLUE-12609 - Show simplified dialog in ARIS Connect
            if (!Context.getEnvironment().equals(Constants.ENVIRONMENT_BP)) {  // Never show in Business Publisher
                holder_nOptReportCategory.value   = getSettings(sSection, "nOptReportCategory", holder_nOptReportCategory.value==1);
                var nuserdialog = showConnectOptionsDialog(holder_nOptReportCategory);
                if(nuserdialog == 0) {
                    Context.setScriptError(Constants.ERR_CANCEL);
                    return;
                }
                setSettings(sSection, "nOptReportCategory", holder_nOptReportCategory.value==1);
            }                    
        }
    }
    var nOptReportCategory    = holder_nOptReportCategory.value;
    var bModelPath            = holder_bModelPath.value;
    var bIncludeFAD           = holder_bIncludeFAD.value;
    var bAttribute            = holder_bAttribute.value;
    var bInvolvedConn         = holder_bInvolvedConn.value; 
    var bOExecuteConn         = holder_bOExecuteConn.value;
    var bOInvolvedConn        = holder_bOInvolvedConn.value;
    var bInput                = holder_bInput.value;
    var bOutput               = holder_bOutput.value;
    var bSuppIT               = holder_bSuppIT.value;
    var bExecIT               = holder_bExecIT.value;
    var bImpPotential         = holder_bImpPotential.value;

    var hdModelPath           = getString("TEXT6");
    var hdIncludeFAD          = getString("TEXT_8");
    var hdAttribute           = getString("TEXT_9");
    var hdInvolvedConn        = getString("TEXT_10"); 
    var hdOExecuteConn        = getString("TEXT_11");
    var hdOInvolvedConn       = getString("TEXT_12");
    var hdInput               = getString("TEXT_1");
    var hdOutput              = getString("TEXT_2");
    var hdSuppIT              = getString("TEXT_13");
    var hdExecIT              = getString("TEXT_21");
    var hdImpPotential        = getString("TEXT_14");

    var soutcxnname           = new __holder("");   // String for connection name output.
    var soutcxntargetobj      = new __holder("");   // String for target object output.
    var soutcxntargetobjtype  = new __holder("");   // String for target object type output.
    var otargetobjdef         = new __holder(null);
    var otargetsysdef         = new __holder(null);
    var lotargetobjdef        = new __holder(null);   

  //Collecting objects 
   var funcs = [];
   var context_mods = false;
   var ModObjs = new Array();
   var tModels = new Array();
   if(omodels.length>0)
      {
          context_mods = true;
          if(nOptReportCategory == 1){
          for(var i=0;i<omodels.length;i++){
              var temp = getConsts(OT);
              for(var j=0;j<temp.length;j++){
                ModObjs = ModObjs.concat(omodels[i].ObjDefListFilter(temp[j]));
                //funcs = funcs.concat(omodels[i].ObjDefListFilter(Constants.OT_FUNC));
               // if((omodels[i].OrgModelTypeNum()==Constants["MT_FUNC_ALLOC_DGM"])||(omodels[i].OrgModelTypeNum()==Constants["MT_BPD_BPMN"])){
                 //   FAD_l.push(omodels[i].ObjDefListFilter(temp[j]));
               // }
              }
          }
          }
          else if(nOptReportCategory == 0){
          for(var i=0;i<omodels.length;i++){
                  for(var j=0;j<MT.length;j++){
                      if(omodels[i].OrgModelTypeNum()==Constants[MT[j]]){             
                        tModels.push(omodels[i]);
                        ModObjs = ModObjs.concat(omodels[i].ObjDefListFilter(Constants.OT_FUNC));
                }
              }
          }
          }
          oobjdefs = ArisData.Unique(ModObjs);      // AGA-5976, Applix 298525 - Avoid redundant objects if multiple models are selected
      }
      
                /*if(bIncludeFAD&&!context_mods){
                   occs = occs.concat(getFAD_occs(ocurrentobjdef, occs)); 
                }*/
                if(bIncludeFAD&&context_mods&&(nOptReportCategory == 1)){
                   oobjdefs = ArisData.Unique(oobjdefs.concat(getFAD_mod_objdefs(oobjdefs))); 
                }
    if(nOptReportCategory == 0){
        omodels.splice(0);
        omodels = omodels.concat(tModels);
    }
    
    if(oobjdefs.length>0){
        nvalidobjdefs++;}
    
  // Create page header, page footer, headline and information header
  if (nOptReportCategory == 0){ setReportHeaderFooter(outfile, nloc, "FW");}
  else if (nOptReportCategory == 1){ setReportHeaderFooter(outfile, nloc, "JD");}
  
  //output format. false = DOC, true = XLS
  var format = false;
  if(Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX)
  {
	  format = true;
  }

    var colHeadings = new Array();
    oobjdefs = ArisData.sort(oobjdefs, Constants.SORT_TYPE, Constants.AT_NAME, Constants.SORT_NONE, nloc);
    var attrHM = new java.util.HashMap();

//FUNCTION WEAKNESS+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        if (nOptReportCategory==0){
//Headers----------------      
    if (format) {
        colHeadings.push(getString("TEXT_17"));
        if (bModelPath) colHeadings.push(getString("TEXT_18"));
    }
    colHeadings.push(getString("TEXT_6"));

    if (bOExecuteConn)  colHeadings.push(getString("TEXT_15"));
    if (bOInvolvedConn) colHeadings.push(getString("TEXT_16"));
    if (bInput)         colHeadings.push(hdInput);
    if (bOutput)        colHeadings.push(hdOutput);
    if (bSuppIT)        colHeadings.push(hdSuppIT);
    if (bExecIT)        colHeadings.push(hdExecIT);
    if (bImpPotential)  colHeadings.push(hdImpPotential);
//-----------------
    if(format){
     outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0); 
     writeTableHeaderWithColor(outfile, colHeadings, 8, 0xCCFFCC, Constants.C_BLACK);          
    }

        var total_arr = new Array();
    oobjdefs.sort(rep_SortObjByName);
        
    for (var i = 0 ; i < oobjdefs.length; i++ ){
      var ocurrentobjdef = oobjdefs[i];
      //XLS
      if(format){
           if(attrHM.containsKey(ocurrentobjdef.Type())){
              var tArr = new Array();
                  tArr=tArr.concat(attrHM.get(ocurrentobjdef.Type()));
              tArr.push(ocurrentobjdef.GUID());
              attrHM.put(ocurrentobjdef.Type(),tArr);              
          }
          else{
          attrHM.put(ocurrentobjdef.Type(),ocurrentobjdef.GUID());              
          }
      }
      var bFirst = true;
        
        nvalidobjdefs++;

                var occs;
                if(!bIncludeFAD){
                occs = getAllowed(ocurrentobjdef,MT);
                }
                if(bIncludeFAD){
                    var TT = MT.concat(new Array("MT_FUNC_ALLOC_DGM","MT_BPD_BPMN"));
                occs = getAllowed(ocurrentobjdef,TT);
                }

            var total = new java.util.HashMap();
            
        var total_arr = new Array();
    oobjdefs.sort(rep_SortObjByName);
        
    for (var i = 0 ; i < oobjdefs.length; i++ ){
      var ocurrentobjdef = oobjdefs[i];
      //XLS
      if(format){
           if(attrHM.containsKey(ocurrentobjdef.Type())){
              var tArr = new Array();
                  tArr=tArr.concat(attrHM.get(ocurrentobjdef.Type()));
              tArr.push(ocurrentobjdef.GUID());
              attrHM.put(ocurrentobjdef.Type(),tArr);              
          }
          else{
          attrHM.put(ocurrentobjdef.Type(),ocurrentobjdef.GUID());              
          }
      }
      var bFirst = true;
        
        nvalidobjdefs++;

                var occs;
                if(!bIncludeFAD){
                occs = getAllowed(ocurrentobjdef,MT);
                }
                if(bIncludeFAD){
                    var TT = MT.concat(new Array("MT_FUNC_ALLOC_DGM","MT_BPD_BPMN"));
                occs = getAllowed(ocurrentobjdef,TT);
                }

            //DOC
            if(!format){
            outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);                
            outfile.TableRow();
            outfile.TableCell(ocurrentobjdef.Name(nloc), 100, getString("TEXT20"), 12, Constants.C_BLACK, 0xFFFF99, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER|Constants.FMT_BOLD, 0);
            outfile.EndTable(" ", 100, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER|Constants.FMT_BOLD, 0);   
            }
            var current_mods = getModels(occs);
            
            var total = new java.util.HashMap();
            for(var ii=0;ii<current_mods.length;ii++){
            
            
            if(!format){
            outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
            outfile.TableRow();

            if (bModelPath){
            outfile.TableCell(current_mods[ii].Name(nloc)+"\n\(Path: "+current_mods[ii].Group().Path(nloc)+"\)", 100, getString("TEXT20"), 11, Constants.C_BLACK, 0xCCFFCC, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER|Constants.FMT_BOLD, 0);
            }
            else{
            outfile.TableCell(current_mods[ii].Name(nloc), 100, getString("TEXT20"), 11, Constants.C_BLACK, 0xCCFFCC, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER|Constants.FMT_BOLD, 0);
            }
            //forming headers
            writeTableHeaderWithColor(outfile, colHeadings, 8, 0xCCFFCC, Constants.C_BLACK);
            }

            //iteration over objects
            //var objdefs = omodels[i].ObjDefListFilter(Constants.OT_FUNC);
            
            //for(var m=0;m<objdefs.length;m++){
             //var occs = objdefs[m].OccListInModel(omodels[i]);
            
            for(var j=0;j<occs.length;j++){
                
                var table_arr = new java.util.HashMap();
                table_arr.put(getString("TEXT_6"),oobjdefs[i].Attribute(Constants.AT_NAME,nloc).getValue());
             if(!table_arr.isEmpty()){
                table_arr = getFurtherDetailsFW(table_arr, bOInvolvedConn, bOExecuteConn, bSuppIT, bExecIT, bInput, bOutput, bImpPotential, bIncludeFAD, current_mods[ii], nloc, oobjdefs[i]);
                total.put(table_arr.get(getString("TEXT_6")),table_arr);
             if(format){
              if (bModelPath){
                table_arr.put(getString("TEXT_18"),current_mods[ii].Group().Path(nloc));
                }
                table_arr.put(getString("TEXT_17"),current_mods[ii].Name(nloc));
                total.put(table_arr.get(getString("TEXT_6")),table_arr);
              }
              }

          }
            // MWZ on 2011/10/11: Completely refactored according to implementation of job description part
         
            if(!format&&!total.isEmpty()){                      // Anubis 550710
                var ttA = total.keySet().toArray().sort();
                table_output(outfile, total, ttA, colHeadings);
                bcheckfirst = false;  
                // (Anubis 379087)
                total = new java.util.HashMap();
                
            }
            else if(format&&!total.isEmpty()){                  // Anubis 550710
                total_arr.push(total);
                // (Anubis 305444)
                total = new java.util.HashMap();
                
            }
            
            if(!format){
                outfile.EndTable(" ", 100, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);        
            }
         }
     }
     if(format){
      table_outputEx(outfile,total_arr,colHeadings,0);
      outfile.EndTable(getString("TEXT_17"), 100, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
     }

 }
}//---FUNCTION WEAKNESS
    
//JOB DESCRIPTION+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
if(nOptReportCategory==1){
//Headers----------------   
    if (format) {
        colHeadings.push(getString("TEXT_19"));
        if (bModelPath) colHeadings.push(getString("TEXT_18"));
        colHeadings.push(getString("TEXT_17"));      
    }
    colHeadings.push(getString("TEXT_6"));
    colHeadings.push(getString("TEXT_7"));
    
    if (bOExecuteConn)  colHeadings.push(hdOExecuteConn);
    if (bOInvolvedConn) colHeadings.push(hdOInvolvedConn);
    if (bInput)         colHeadings.push(hdInput);
    if (bOutput)        colHeadings.push(hdOutput);
    if (bSuppIT)        colHeadings.push(hdSuppIT);
    if (bExecIT)        colHeadings.push(hdExecIT);
    if (bImpPotential)  colHeadings.push(hdImpPotential);
//-----------------       
    if(format){
     outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0); 
     writeTableHeaderWithColor(outfile, colHeadings, 8, 0xCCFFCC, Constants.C_BLACK);          
    }
    
    AT.sort(repSortAT);
    var total_arr = new Array();
    oobjdefs.sort(rep_SortObjByName);

        for(var i=0; i<oobjdefs.length;i++){
          var ocurrentobjdef = oobjdefs[i];
          bchecktyp = checkObj(ocurrentobjdef);//Check for correct type
            if (bchecktyp == true){
            nvalidobjdefs++;
                //Getting occs
                var occs;
                if(!bIncludeFAD){
                occs = getAllowed(ocurrentobjdef,MT);
                }
                if(bIncludeFAD){
                    var TT = MT.concat(new Array("MT_FUNC_ALLOC_DGM","MT_BPD_BPMN"));
                occs = getAllowed(ocurrentobjdef,TT);
                }
                /* Anubis 305442, MWZ on 2008/04/01 */
                    //Filtering models && occurences
                  if(context_mods){
                    //Adding FADs 
                    if(bIncludeFAD){
                        for(var m=0;m<occs.length;m++){
                            if(((occs[m].Model().OrgModelTypeNum()==Constants.MT_FUNC_ALLOC_DGM)||(occs[m].Model().OrgModelTypeNum()==Constants.MT_BPD_BPMN))&&!indexOf(omodels,occs[m].Model())){
                                omodels.push(occs[m].Model());
                            }
                        }
                    }
                    occs =  clear_occs(occs,omodels);
                  }

//        if(checkDef(ocurrentobjdef,occs)){    /* AGA-2279, MWZ, 2012/02/20, commented out*/
                  
          var exec = true;
          if(!bInvolvedConn){
            exec = checkDef_exec(ocurrentobjdef,omodels);//Verifying objdef in case that it does not executer
          }
          
          if(exec){
          //XLS
          if(format){
               if(attrHM.containsKey(ocurrentobjdef.Type())){
                  var tArr = new Array();
                  tArr=tArr.concat(attrHM.get(ocurrentobjdef.Type()));
                  tArr.push(ocurrentobjdef.GUID());
                  attrHM.put(ocurrentobjdef.Type(),tArr);              
              }
              else{
              attrHM.put(ocurrentobjdef.Type(),ocurrentobjdef.GUID());
              }
          }
          var bFirst = true;

            //DOC
            if(!format){
            outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);                
            outfile.TableRow();
            outfile.TableCell(ocurrentobjdef.Name(nloc), 100, getString("TEXT20"), 12, Constants.C_BLACK, 0xFFFF99, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER|Constants.FMT_BOLD, 0);
//ATTRIBUTES-------------------------------------------------------
            if(bAttribute){
               if(ocurrentobjdef.Type().equals(getString("TEXT_34"))&&ocurrentobjdef.Attribute(Constants.AT_DESC,nloc).IsMaintained()){
                outfile.TableRow();
                outfile.TableCell(aFilter.AttrTypeName(Constants.AT_DESC), 30, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER|Constants.FMT_BOLD, 0);
                outfile.TableCell(ocurrentobjdef.Attribute(Constants.AT_DESC,nloc).getValue(), 70, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);                   
               }
               else{
             for(var a=0;a<AT.length;a++){
                 if(ocurrentobjdef.Attribute(Constants[AT[a]],nloc).IsMaintained()){
                outfile.TableRow();
                outfile.TableCell(aFilter.AttrTypeName(Constants[AT[a]]), 30, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER|Constants.FMT_BOLD, 0);
                outfile.TableCell(ocurrentobjdef.Attribute(Constants[AT[a]],nloc).getValue(), 70, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
                }
              }
             }
            }
//-----------------------------------------------------------------     
            outfile.EndTable(" ", 100, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER|Constants.FMT_BOLD, 0);
            }
            var current_mods = getModels(occs);
            
            var total = new java.util.HashMap();
            for(var ii=0;ii<current_mods.length;ii++){
            
            
            if(!format){
            outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
            outfile.TableRow();

            if (bModelPath){
            outfile.TableCell(current_mods[ii].Name(nloc)+"\n\(Path: "+current_mods[ii].Group().Path(nloc)+"\)", 100, getString("TEXT20"), 11, Constants.C_BLACK, 0xCCFFCC, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER|Constants.FMT_BOLD, 0);
            }
            else{
            outfile.TableCell(current_mods[ii].Name(nloc), 100, getString("TEXT20"), 11, Constants.C_BLACK, 0xCCFFCC, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER|Constants.FMT_BOLD, 0);
            }
            //forming headers
            writeTableHeaderWithColor(outfile, colHeadings, 8, 0xCCFFCC, Constants.C_BLACK);
            }
            //iteration over object occs
            for(var j=0;j<occs.length;j++){
                
                
                var c_lgth = 0;
                var cur_model = occs[j].Model();
                //whether current occ is on current model
                if(cur_model.GUID().equals(current_mods[ii].GUID())){

              var aFuncSymbols = getSymbolsIncludingUserDefined_Array([Constants.ST_FUNC, Constants.ST_BPMN_TASK/*BLUE-10581*/]);
              var cObjs = occs[j].getConnectedObjOccs(aFuncSymbols);
              var oCxns = occs[j].Cxns();
//--------------------------------------------------------------------------
          ocxns = ArisData.sort(oCxns, Constants.SORT_TYPE, Constants.SORT_NONE, Constants.SORT_NONE, nloc);
            //iteration over cxns
          if (ocxns.length > 0){
            for (var jj = 0 ; jj < ocxns.length; jj++ ){
              var ocurrentcxn = ocxns[jj];
              soutcxnname.value             = "";
              soutcxntargetobj.value        = "";
              soutcxntargetobjtype.value    = "";
              otargetobjdef.value           = null;
              otargetsysdef.value           = null;
              btruecxntype                  = false;

              // Check of the current relation according to selected relation setting
             btruecxntype = getcxn2func(nloc, ocurrentobjdef, ocurrentcxn.CxnDef(), soutcxnname, soutcxntargetobj, soutcxntargetobjtype, otargetobjdef, bInvolvedConn);
                //е�?ли �?в�?зь е�?ть
             var table_arr = new java.util.HashMap();
             if (btruecxntype == true){
                bFirst = false;

                // BLUE-13488 - Handle multiple cxns to same activity
                var activityValue = total.get(otargetobjdef.value.Attribute(Constants.AT_NAME,nloc).getValue());
                if (activityValue != null) {
                    var participationValue = activityValue.get(getString("TEXT_7"));
                    if (participationValue != null) {
                        soutcxnname.value += ", " + participationValue;
                    }
                }
                table_arr.put(getString("TEXT_6"),otargetobjdef.value.Attribute(Constants.AT_NAME,nloc).getValue());
                table_arr.put(getString("TEXT_7"),soutcxnname.value);
             // }
               if(!table_arr.isEmpty()){
                  table_arr = getFurtherDetails(table_arr,cObjs, bOInvolvedConn, bOExecuteConn, bSuppIT, bExecIT, bInput, bOutput, bImpPotential, bIncludeFAD, cur_model, occs[j], nloc, otargetobjdef.value);
               }
               if (!format) {
                  total.put(table_arr.get(getString("TEXT_6")),table_arr);
               } else {
                if (bModelPath){
                
                  table_arr.put(getString("TEXT_18"),current_mods[ii].Group().Path(nloc));
                  }
                  table_arr.put(getString("TEXT_17"),current_mods[ii].Name(nloc));
                  table_arr.put(getString("TEXT_19"),ocurrentobjdef.Name(nloc));                
                  total.put(table_arr.get(getString("TEXT_6")),table_arr);
                }
              }   // Anubis 315741 - Scope extended 
            }
          }//:end cxns
         }//:end model
        }//:end occs
        
        if(!format&&!total.isEmpty()){
            var ttA = total.keySet().toArray().sort();
            table_output(outfile, total, ttA, colHeadings);
            bcheckfirst = false;  
            /* Anubis 379087, MWZ on 2009/03/31 */
            total = new java.util.HashMap();
            
        }
        else if(format&&!total.isEmpty()){
                total_arr.push(total);
                /* Anubis 305444, MWZ on 2008/04/01 */
                total = new java.util.HashMap();

        }
 
        if(!format){
            outfile.EndTable(" ", 100, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);        
        }
        
       }
         if(format&&(i==oobjdefs.length-1)){
           table_outputEx(outfile,total_arr,colHeadings,1);
        outfile.EndTable(getString("TEXT_17"), 100, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
        }
        
//ATTRIBUTE+EXCEL OUTPUT----------------------------------------------------------------------------------------
        if(format&&bAttribute&&(i==oobjdefs.length-1)){
              var tArr =  attrHM.keySet().toArray();
              for(var k=0;k<tArr.length;k++){
                  if(tArr[k].equals(getString("TEXT_34"))){
                      
                  outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
                  outfile.TableRow();
                  outfile.TableCell("", 30, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
                      
                      outfile.TableCell(ArisData.getActiveDatabase().ActiveFilter().AttrTypeName(Constants.AT_DESC), 15, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
                  
                  var inArr = attrHM.get(tArr[k].toString());
                  for(var cl=0;cl<inArr.length;cl++){
                     outfile.TableRow();  
                     var currOb = ArisData.getActiveDatabase().FindGUID(inArr[cl]);
                     
                     outfile.TableCell(currOb.Name(nloc), 15, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);

                    //for(var att = 0;att<AT.length;att++){
                        if(currOb.Attribute(Constants.AT_DESC,nloc).IsMaintained()){
                      outfile.TableCell(currOb.Attribute(Constants.AT_DESC,nloc).getValue(), 15, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
                  }
                 }
                  outfile.EndTable(tArr[k].toString(), 100, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                  }
                      else{
                  outfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0);
                  outfile.TableRow();
                  outfile.TableCell("", 30, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
                  for(var att = 0;att<AT.length;att++){
                      outfile.TableCell(ArisData.getActiveDatabase().ActiveFilter().AttrTypeName(Constants[AT[att]]), 15, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
                  }
                      var tmp = attrHM.get(tArr[k].toString());
                      var inArr = [];
                      if(tmp.length>0){
                        inArr = tmp;
                      }
                      else{
                        inArr.push(tmp);
                      }
                  for(var cl=0;cl<inArr.length;cl++){
                     outfile.TableRow();  
                     var currOb = ArisData.getActiveDatabase().FindGUID(inArr[cl]);
                     
                     outfile.TableCell(currOb.Name(nloc), 15, getString("TEXT20"), 10, Constants.C_BLACK, 0xFFFF99, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);

                    for(var att = 0;att<AT.length;att++){
                      outfile.TableCell(currOb.Attribute(Constants[AT[att]],nloc).getValue(), 15, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
                  }
                 }
                  outfile.EndTable(tArr[k].toString(), 100, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
              }
             }
            }
            }//::end check execute connection
            
            else {
                /* Anubis 305439, MWZ on 2008/04/01 */
                if(!bInvolvedConn){
                    if(format&&(i==oobjdefs.length-1)){
                        table_outputEx(outfile,total_arr,colHeadings,1);
                        outfile.EndTable(getString("TEXT_17"), 100, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
                    }
                }
            }
//       }//::end check object validity for current models
     }//:end check type
               
    }//::end iteration over objects
        
  }//::end job description


 }//---if oobjdefs.length, omodels.length - CTRL+G 137
  if ((nvalidobjdefs == 0)) {
      // No object of the function type was selected.
      if( g_bDialogsSupported && !g_bRunByService) {
          Dialogs.MsgBox(txtNoOrgObject, Constants.MSGBOX_BTN_OK, getString("TEXT23"));
          // Anubis 406948  
          Context.setProperty(Constants.PROPERTY_SHOW_OUTPUT_FILE, false);
          Context.setProperty(Constants.PROPERTY_SHOW_SUCCESS_MESSAGE, false); 
          Context.setScriptError(Constants.ERR_NOFILECREATED);  
      }
      else {
          if (!g_bRunByService) {
              // BLUE-10824 Output empty result in Connect
              outEmptyResult(outfile);
          }                                   
          outfile.WriteReport();
      }
  } else {
      if ((nOptReportCategory == 1)&&( Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX )){
          outfile.EndTable(getString("TEXT_17"), 100, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
      }
      outfile.WriteReport();
  }
}//---Main

//Check if array contains item
function indexOf(oArr,oItem){
    for(var i=0;i<oArr.length;i++){
        if(oArr[i].GUID().equals(oItem.GUID())){
            return true;
        }
    }
 return false;
}

//Check: objdef has exec connections occurences on given models
function checkDef_exec(ocurrentobjdef,omodels){
    var Cxn_types = getConsts(CTF_EXEC);
    var conns = [];
    for(var i=0;i<Cxn_types.length;i++){
        conns = conns.concat(ocurrentobjdef.CxnListFilter(Constants.EDGES_OUT, Cxn_types[i]));
    }
    if (conns.length > 0) {
        if (omodels.length == 0) return true;   // Anubis 315315 (running on ArisData.getSelectedObjDefs() ) 
    
        for(var i=0;i<conns.length;i++){
           
           for(var j=0;j<omodels.length;j++){
               if(conns[i].OccListInModel(omodels[j]).length>0){
                return true;
               }
           }
        }
    }
    return false;
}

//Checking either object have occurences in the selected occs
function checkDef(oObj,occs){
        for(var i=0;i<occs.length;i++){
            if(occs[i].ObjDef().GUID().equals(oObj.GUID())){
                return true;
            }
        }
   return false;
}

//Clearing object occs from others belonging to other models
function clear_occs(oOccs,oModels){
    var res_occs = [];
    for(var i=0;i<oModels.length;i++){
          for(var j=0;j<oOccs.length;j++){
            if(oOccs[j].Model().GUID().equals(oModels[i].GUID())){
                res_occs.push(oOccs[j]);
            }
          }  
    }
    return res_occs;
}

function clearOccs(occs){
    var tmp = new java.util.HashMap();
    var out_arr = [];
    for(var i=0;i<occs.length;i++){
        if(!tmp.containsKey(occs[i].ObjDef().GUID().toString())){
            tmp.put(occs[i].ObjDef().GUID().toString(),occs[i]);
            out_arr.push(occs[i]);
        }
    }

    return out_arr;
}

function getFAD_mod_objdefs(objdefs){
    var result = [];
    var cur_mods = [];
    var OT_cnst =  getConsts(OT);
    occs = [];
    var needed = [];
    
        for(var i=0;i<objdefs.length;i++){
            occs = occs.concat(objdefs[i].OccList());
        }    
    
    
        for(var i=0;i<occs.length;i++){
            cur_mods.push(occs[i].Model());
        }
        cur_mods = ArisData.Unique(cur_mods);
        
        
        for(var i=0;i<cur_mods.length;i++){
           var cur_funcs = cur_mods[i].ObjDefListFilter(Constants.OT_FUNC); 
               for(var j=0;j<cur_funcs.length;j++){
                var c_objects = cur_funcs[j].OccListInModel(cur_mods[i]);
                //var flag = true;
                for(var t=0;t<c_objects.length;t++){
                    var cCxns = c_objects[t].Cxns();
                    if(checkCxnType(cCxns)){
                        needed.push(cur_funcs[j]);
                    }
                }
                    
               }
        }
        
        for(var i=0;i<needed.length;i++){
            var fad = needed[i].AssignedModels(getModelTypesIncludingUserDefined_Array(new Array(Constants.MT_FUNC_ALLOC_DGM,Constants.MT_BPD_BPMN)));
            if(fad.length>0){
                for(var j=0;j<fad.length;j++){
                    var cur_objs = fad[j].ObjDefList();
                        for(var t=0;t<cur_objs.length;t++){
                            if(checkObj(cur_objs[t])){
                                result.push(cur_objs[t]);
                            }
                        }
                }
            }
        }
    return result;

}

function getModelTypesIncludingUserDefined_Array(p_aOrgModelTypeNums) {
    var aModelTypes = new Array();
    
    for (var i = 0; i < p_aOrgModelTypeNums.length; i++) { 
        aModelTypes = aModelTypes.concat(getModelTypesIncludingUserDefined(p_aOrgModelTypeNums[i]));
    }    
    return aModelTypes;
}

function getSymbolsIncludingUserDefined_Array(p_aOrgSymbolNums) {
    var aSymbols = new Array();
    
    for (var i = 0; i < p_aOrgSymbolNums.length; i++) { 
        aSymbols = aSymbols.concat(getSymbolsIncludingUserDefined(p_aOrgSymbolNums[i]));
    }    
    return aSymbols;
}



//Getting FAD orgs occurences for check Include FAD - MODEL CONTEXT
function getFAD_mod_occs(occs){
    var result = [];
    var cur_mods = [];
    var OT_cnst =  getConsts(OT);
    var needed = [];
        for(var i=0;i<occs.length;i++){
            cur_mods.push(occs[i].Model());
        }
        cur_mods = ArisData.Unique(cur_mods);
        
        
        for(var i=0;i<cur_mods.length;i++){
           var cur_funcs = cur_mods[i].ObjDefListFilter(Constants.OT_FUNC); 
               for(var j=0;j<cur_funcs.length;j++){
                var c_objects = cur_funcs[j].OccListInModel(cur_mods[i]);
                //var flag = true;
                for(var t=0;t<c_objects.length;t++){
                    var cCxns = c_objects[t].Cxns();
                    if(checkCxnType(cCxns)){
                        needed.push(cur_funcs[j]);
                    }
                }
                    
               }
        }
        
        for(var i=0;i<needed.length;i++){
            var fad = needed[i].AssignedModels(getModelTypesIncludingUserDefined_Array(new Array(Constants.MT_FUNC_ALLOC_DGM,Constants.MT_BPD_BPMN)));
            if(fad.length>0){
                for(var j=0;j<fad.length;j++){
                    var cur_objs = fad[j].ObjDefList();
                        for(var t=0;t<cur_objs.length;t++){
                            if(checkObj(cur_objs[t])){
                                result = result.concat(cur_objs[t].OccListInModel(fad[j]));
                            }
                        }
                }
            }
        }
    return result;
}
//Checkin either connection has corresponding type
function checkCxnType(cCxns){
    var tArr = CTF_EXEC.concat(CTF_INV);
    for(var i=0;i<CTF_EXEC.length;i++){
       for(var j=0;j<cCxns.length;j++){ 
        if(cCxns[j].Cxn().TypeNum() == Constants[CTF_EXEC[i]]){
            return false;
        }
       }
    }
 return true;
}


//Getting FAD orgs occurences for check Include FAD - OBJECT CONTEXT
function getFAD_occs(oCurObj, occs){
    var result = [];
    var Types = new Array("MT_FUNC_ALLOC_DGM","MT_BPD_BPMN");
    var fad_occs = getAllowed(oCurObj,Types);
    
    for(var i=0;i<fad_occs.length;i++){
       var sup_mod = fad_occs[i].Model().SuperiorObjDefs();
       var flag = true;
        for(var j=0;j<occs.length;j++){
            var aFuncSymbols = getSymbolsIncludingUserDefined_Array([Constants.ST_FUNC, Constants.ST_BPMN_TASK/*BLUE-10581*/]);
            
            var conn_objs = occs[j].getConnectedObjOccs(aFuncSymbols)[0];
            var f_conn_objs = fad_occs[i].getConnectedObjOccs(aFuncSymbols)[0];
                if(conn_objs.ObjDef().GUID().equals(f_conn_objs.ObjDef().GUID())){
                    flag = false;
                    break;
                }
        }
        if(flag){
            result.push(fad_occs[i]);
        }
    }
    return result;
}

//Getting connected objects and collecting info about them corresponding to selected report options
function getFurtherDetails(out_arr,cObjs, bOInvolvedConn, bOExecuteConn, bSuppIT, bExecIT, bInput, bOutput, bImpPotential, bIncludeFAD, cur_model, cocc, nloc, cObjDef){
                  var ot_arr = getConsts(OT);
//OTHER EXECUTE-------------------------------------------------------------------------------------                
              if(bOExecuteConn){
                  
               var output_arr = getCorrData(cObjDef,ot_arr,cur_model,cocc,nloc,CTF_EXEC);
                  

                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_11"),output_arr.sort().join(", \n"));
                }
                if(!out_arr.containsKey(getString("TEXT_11"))){
                   out_arr.put(getString("TEXT_11"),"");
                 }
             }
//------------------------------------------------------------------------------------------    
//OTHER INVOLVED----------------------------------------------------------------------------   
                if(bOInvolvedConn){
                  var output_arr = getCorrData(cObjDef,ot_arr,cur_model,cocc,nloc,CTF_INV);

                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_12"),output_arr.sort().join(", \n"));
                }
                if(!out_arr.containsKey(getString("TEXT_12"))){
                   out_arr.put(getString("TEXT_12"),"");
                 }
            }
//------------------------------------------------------------------------------------------
//FAD---------------------------------------------------------------------------------------
                if(bIncludeFAD){
                  var aModel = [];
                  if((cur_model.OrgModelTypeNum()!=Constants.MT_FUNC_ALLOC_DGM)&&(cur_model.OrgModelTypeNum()!=Constants.MT_BPD_BPMN)){
                      aModel = cObjDef.AssignedModels(getModelTypesIncludingUserDefined(Constants.MT_FUNC_ALLOC_DGM));
                  }
                //-----OTHER EXECUTE-----   
                 //Execute_FAD     
                 ot_arr = getConsts(OT);
                 var occsInModel = (aModel.lenght > 0) ? cObjDef.OccListInModel(aModel[0]) : [];       // BLUE-25927
                 
                 if(aModel.length>0 && occsInModel.length>0){               // BLUE-25927
                    var cOcc = occsInModel[0];
                    output_arr = getCorrData(cObjDef,ot_arr,aModel[0],cOcc,nloc,CTF_EXEC);
                 }
                   //Execute_THIS
               if(bOExecuteConn){
                     output_arr = output_arr.concat(getCorrData(cObjDef,ot_arr,cur_model,cocc,nloc,CTF_EXEC));   
                     }
                if(output_arr != null && output_arr.length>0){
                    out_arr.put(getString("TEXT_11"),output_arr.sort().join(","));
                }
               
                if(!out_arr.containsKey(getString("TEXT_11"))){
                   out_arr.put(getString("TEXT_11"),"");
                }
             //-----OTHER INVOLVED-----   
                if(output_arr != null) output_arr.splice(0);
                     //Involved_FAD     
                 if(aModel.length>0 && occsInModel.length>0){               // BLUE-25927
                    var cOcc = occsInModel[0];
                    output_arr = getCorrData(cObjDef,ot_arr,aModel[0],cOcc,nloc,CTF_INV);
                 }
                   //Involved_THIS
               if(bOInvolvedConn){
                     output_arr = output_arr.concat(getCorrData(cObjDef,ot_arr,cur_model,cocc,nloc,CTF_INV));   
                     }
                if(output_arr != null && output_arr.length>0){
                    out_arr.put(getString("TEXT_12"),output_arr.sort().join(","));
                }
               
                if(!out_arr.containsKey(getString("TEXT_12"))){
                   out_arr.put(getString("TEXT_12"),"");
                }
                
                //-----IT SUPPORT------
                var output_arr = new Array(); 
                ot_arr = getConsts(IT);
                if(aModel.length>0 && occsInModel.length>0){               // BLUE-25927
                    var cOcc = occsInModel[0];
                    output_arr = getCorrData(cObjDef,ot_arr,aModel[0],cOcc,nloc,CTF_IT_SUPP);
                }
                //IT SUPPORT_THIS
                if(bSuppIT){
                    output_arr = output_arr.concat(getCorrData(cObjDef,ot_arr,cur_model,cocc,nloc,CTF_IT_SUPP));   
                }
                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_13"),output_arr.sort().join(", \n"));
                }
                if(!out_arr.containsKey(getString("TEXT_13"))){
                    out_arr.put(getString("TEXT_13"),"");
                }
                
                //-----IT EXECUTE------
                output_arr.splice(0);
                ot_arr = getConsts(IT);
                if(aModel.length>0 && occsInModel.length>0){               // BLUE-25927
                    var cOcc = occsInModel[0];
                    output_arr = getCorrData(cObjDef,ot_arr,aModel[0],cOcc,nloc,CTF_IT_EXEC);
                }
                //IT EXECUTE_THIS
                if(bExecIT){
                    output_arr = output_arr.concat(getCorrData(cObjDef,ot_arr,cur_model,cocc,nloc,CTF_IT_EXEC));   
                }
                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_21"),output_arr.sort().join(", \n"));
                }
                if(!out_arr.containsKey(getString("TEXT_21"))){
                    out_arr.put(getString("TEXT_21"),"");
                }
                
             //-----INPUT-----
                output_arr.splice(0);
                     //Input_FAD     
                     ot_arr = getConsts(IO);
                 if(aModel.length>0 && occsInModel.length>0){               // BLUE-25927
                    var cOcc = occsInModel[0];
                    output_arr = getCorrData(cObjDef,ot_arr,aModel[0],cOcc,nloc,CTF_IN);
                 }
                   //Input_THIS
               if(bInput){
                     output_arr = output_arr.concat(getCorrData(cObjDef,ot_arr,cur_model,cocc,nloc,CTF_IN));   
                     }
                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_1"),output_arr.sort().join(", \n"));
                }

                if(!out_arr.containsKey(getString("TEXT_1"))){
                   out_arr.put(getString("TEXT_1"),"");
                }                
            //-----OUTPUT-----    
                output_arr.splice(0);
                     //Output_FAD                  
                 if(aModel.length>0 && occsInModel.length>0){               // BLUE-25927
                    var cOcc = occsInModel[0];
                    output_arr = getCorrData(cObjDef,ot_arr,aModel[0],cOcc,nloc,CTF_OUT);
                 }
                   //Output_THIS
               if(bOutput){
                     output_arr = output_arr.concat(getCorrData(cObjDef,ot_arr,cur_model,cocc,nloc,CTF_OUT));   
                     }
                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_2"),output_arr.sort().join(", \n"));
                }
                if(!out_arr.containsKey(getString("TEXT_2"))){
                   out_arr.put(getString("TEXT_2"),"");
                }
                }
//------------------------------------------------------------------------------------------
//THIS IT SUPPORT---------------------------------------------------------------------------   
                if(bSuppIT&&!bIncludeFAD){
                    ot_arr = getConsts(IT);
                    var output_arr = getCorrData(cObjDef,ot_arr,cur_model,cocc,nloc,CTF_IT_SUPP);
                    if(output_arr.length>0){
                        out_arr.put(getString("TEXT_13"),output_arr.sort().join(", \n"));
                    }
                    if(!out_arr.containsKey(getString("TEXT_13"))){
                        out_arr.put(getString("TEXT_13"),"");
                    }
                }
//------------------------------------------------------------------------------------------
//THIS IT EXECUTE---------------------------------------------------------------------------   
                if(bExecIT&&!bIncludeFAD){
                    ot_arr = getConsts(IT);
                    var output_arr = getCorrData(cObjDef,ot_arr,cur_model,cocc,nloc,CTF_IT_EXEC);
                    if(output_arr.length>0){
                        out_arr.put(getString("TEXT_21"),output_arr.sort().join(", \n"));
                    }
                    if(!out_arr.containsKey(getString("TEXT_21"))){
                        out_arr.put(getString("TEXT_21"),"");
                    }
                }
//------------------------------------------------------------------------------------------
                 ot_arr = getConsts(IO);
//THIS INPUT-----------------------------------------------------------------------------------   
                if(bInput&&!bIncludeFAD){
                var output_arr = getCorrData(cObjDef,ot_arr,cur_model,cocc,nloc,CTF_IN);

                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_1"),output_arr.sort().join(", \n"));
                }
                if(!out_arr.containsKey(getString("TEXT_1"))){
                   out_arr.put(getString("TEXT_1"),"");
                 }
            }
//------------------------------------------------------------------------------------------   
//THIS OUTPUT-----------------------------------------------------------------------------------   
                if(bOutput&&!bIncludeFAD){
                var output_arr = getCorrData(cObjDef,ot_arr,cur_model,cocc,nloc,CTF_OUT);

                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_2"),output_arr.sort().join(", \n"));
                }
                if(!out_arr.containsKey(getString("TEXT_2"))){
                   out_arr.put(getString("TEXT_2"),"");
                 }
            }
//------------------------------------------------------------------------------------------
//IMPROVEMENT POTENTIAL---------------------------------------------------------------------
            
             out_arr.put(getString("TEXT_14"),cObjDef.Attribute(Constants.AT_IMPROVE, nloc).getValue());    

//------------------------------------------------------------------------------------------
    return out_arr;
}

//FW report
function getFurtherDetailsFW(out_arr, bOInvolvedConn, bOExecuteConn, bSuppIT, bExecIT, bInput, bOutput, bImpPotential, bIncludeFAD, cur_model, nloc, cObjDef){

var output_arr = []; 
              var ot_arr = getConsts(OT);
//OTHER EXECUTE-------------------------------------------------------------------------------------
              if(bOExecuteConn&&!bIncludeFAD){
                  
               var output_arr = getCorrDataFW(cObjDef,ot_arr,cur_model,nloc,CTF_EXEC);
                  

                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_15"),output_arr.sort().join(", \n"));
                }
                if(!out_arr.containsKey(getString("TEXT_15"))){
                   out_arr.put(getString("TEXT_15"),"");
                 }               
             }
//------------------------------------------------------------------------------------------    
//OTHER INVOLVED----------------------------------------------------------------------------   
                if(bOInvolvedConn&&!bIncludeFAD){
                  var output_arr = getCorrDataFW(cObjDef,ot_arr,cur_model,nloc,CTF_INV);

                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_16"),output_arr.sort().join(", \n"));
                }
                if(!out_arr.containsKey(getString("TEXT_16"))){
                   out_arr.put(getString("TEXT_16"),"");
                 }
               }
//------------------------------------------------------------------------------------------   
//FAD---------------------------------------------------------------------------------------
                if(bIncludeFAD){
                                    var aModel = [];
                  if((cur_model.OrgModelTypeNum()!=Constants.MT_FUNC_ALLOC_DGM)&&(cur_model.OrgModelTypeNum()!=Constants.MT_BPD_BPMN)){
                      aModel = cObjDef.AssignedModels(getModelTypesIncludingUserDefined(Constants.MT_FUNC_ALLOC_DGM));
                  }
                    output_arr.splice(0);
             //-----OTHER EXECUTE-----   
                
                     //Execute_FAD     
                     ot_arr = getConsts(OT);
                 if(aModel.length>0){
                    output_arr = getCorrDataFW(cObjDef,ot_arr,aModel[0], nloc,CTF_EXEC);
                 }
                   //Execute_THIS
               if(bInput){
                     output_arr = output_arr.concat(getCorrDataFW(cObjDef,ot_arr,cur_model,nloc,CTF_EXEC));   
                     }
                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_15"),output_arr.sort().join(","));
                }
               
                if(!out_arr.containsKey(getString("TEXT_15"))){
                   out_arr.put(getString("TEXT_15"),"");
                }                    
             //-----OTHER INVOLVED-----   
                output_arr.splice(0);
                     //Involved_FAD     
                     ot_arr = getConsts(CTF_INV);
                 if(aModel.length>0){
                    output_arr = getCorrDataFW(cObjDef,ot_arr,aModel[0], nloc,CTF_INV);
                 }
                   //Involved_THIS
               if(bInput){
                     output_arr = output_arr.concat(getCorrDataFW(cObjDef,ot_arr,cur_model,nloc,CTF_INV));   
                     }
                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_16"),output_arr.sort().join(","));
                }
               
                if(!out_arr.containsKey(getString("TEXT_16"))){
                   out_arr.put(getString("TEXT_16"),"");
                } 

                //-----IT SUPPORT------ 
                var output_arr = new Array(); 
                ot_arr = getConsts(IT);
                if(aModel.length>0){
                    output_arr = getCorrDataFW(cObjDef,ot_arr,aModel[0],nloc,CTF_IT_SUPP);
                }
                //IT SUPPORT_THIS
                if(bSuppIT){
                    output_arr = output_arr.concat(getCorrDataFW(cObjDef,ot_arr,cur_model,nloc,CTF_IT_SUPP));
                }
                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_13"),output_arr.sort().join(","));
                }
                if(!out_arr.containsKey(getString("TEXT_13"))){
                    out_arr.put(getString("TEXT_13"),"");
                }
                
                //-----IT EXECUTE------ 
                output_arr.splice(0);
                ot_arr = getConsts(IT);
                if(aModel.length>0){
                    output_arr = getCorrDataFW(cObjDef,ot_arr,aModel[0],nloc,CTF_IT_EXEC);
                }
                //IT EXECUTE_THIS
                if(bExecIT){
                    output_arr = output_arr.concat(getCorrDataFW(cObjDef,ot_arr,cur_model,nloc,CTF_IT_EXEC));
                }
                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_21"),output_arr.sort().join(","));
                }
                if(!out_arr.containsKey(getString("TEXT_21"))){
                    out_arr.put(getString("TEXT_21"),"");
                }

                //-----INPUT-----   
                output_arr.splice(0);
                     //Input_FAD     
                     ot_arr = getConsts(IO);
                 if(aModel.length>0){
                    output_arr = getCorrDataFW(cObjDef,ot_arr,aModel[0], nloc,CTF_IN);
                 }
                   //Input_THIS
               if(bInput){
                     output_arr = output_arr.concat(getCorrDataFW(cObjDef,ot_arr,cur_model,nloc,CTF_IN));   
                     }
                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_1"),output_arr.sort().join(","));
                }
               
                if(!out_arr.containsKey(getString("TEXT_1"))){
                   out_arr.put(getString("TEXT_1"),"");
                }                
            //-----OUTPUT-----    
                output_arr.splice(0);
                     //Output_FAD                  
                 if(aModel.length>0){
                    output_arr = getCorrDataFW(cObjDef,ot_arr,aModel[0],nloc,CTF_OUT);
                 }
                   //Output_THIS
               if(bOutput){
                     output_arr = output_arr.concat(getCorrDataFW(cObjDef,ot_arr,cur_model,nloc,CTF_OUT));   
                     }
                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_2"),output_arr.sort().join(","));
                }
                if(!out_arr.containsKey(getString("TEXT_2"))){
                   out_arr.put(getString("TEXT_2"),"");
                }
}
//------------------------------------------------------------------------------------------
// FAD ^^^^ END

//THIS IT SUPPORT---------------------------------------------------------------------------
                if(bSuppIT&&!bIncludeFAD){
                    ot_arr = getConsts(IT);
                    var output_arr = getCorrDataFW(cObjDef,ot_arr,cur_model,nloc,CTF_IT_SUPP);
                    if(output_arr.length>0){
                        out_arr.put(getString("TEXT_13"),output_arr.sort().join(",\n"));
                    }
                    if(!out_arr.containsKey(getString("TEXT_13"))){
                        out_arr.put(getString("TEXT_13"),"");
                    }
                }
//------------------------------------------------------------------------------------------
//THIS IT EXECUTE---------------------------------------------------------------------------
                if(bExecIT&&!bIncludeFAD){
                    ot_arr = getConsts(IT);
                    var output_arr = getCorrDataFW(cObjDef,ot_arr,cur_model,nloc,CTF_IT_EXEC);
                    if(output_arr.length>0){
                        out_arr.put(getString("TEXT_21"),output_arr.sort().join(",\n"));
                    }
                    if(!out_arr.containsKey(getString("TEXT_21"))){
                        out_arr.put(getString("TEXT_21"),"");
                    }
                }
//------------------------------------------------------------------------------------------
                 ot_arr = getConsts(IO);
//THIS INPUT-----------------------------------------------------------------------------------   
                if(bInput&&!bIncludeFAD){
                var output_arr = getCorrDataFW(cObjDef,ot_arr,cur_model,nloc,CTF_IN);

                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_1"),output_arr.sort().join(",\n"));
                }
                if(!out_arr.containsKey(getString("TEXT_1"))){
                   out_arr.put(getString("TEXT_1"),"");
                 }
            }
//------------------------------------------------------------------------------------------   
//THIS OUTPUT-----------------------------------------------------------------------------------   
                if(bOutput&&!bIncludeFAD){
                var output_arr = getCorrDataFW(cObjDef,ot_arr,cur_model,nloc,CTF_OUT);

                if(output_arr.length>0){
                    out_arr.put(getString("TEXT_2"),output_arr.sort().join(",\n"));
                }
                if(!out_arr.containsKey(getString("TEXT_2"))){
                   out_arr.put(getString("TEXT_2"),"");
                 }
            }
//------------------------------------------------------------------------------------------
//IMPROVEMENT POTENTIAL---------------------------------------------------------------------
            
             out_arr.put(getString("TEXT_14"),cObjDef.Attribute(Constants.AT_IMPROVE, nloc).getValue());    

//------------------------------------------------------------------------------------------
    return out_arr;
}

function getConnectedObjDefs(p_oObjDef, p_aObjTypes) {
    var aConnectedObjDefs = new Array();
    var oCxns = p_oObjDef.CxnListFilter(Constants.EDGES_INOUT);

    for (var i = 0; i < oCxns.length; i++ ) {
        var oCxn = oCxns[i];
        var oConnectedObjDef;
         if (p_oObjDef.IsEqual(oCxns[i].SourceObjDef())) {
            oConnectedObjDef = oCxns[i].TargetObjDef();
         } else {
            oConnectedObjDef = oCxns[i].SourceObjDef();
         }

         for (var j = 0; j < p_aObjTypes.length; j++ ) {
            if (oConnectedObjDef.TypeNum() == p_aObjTypes[j]) {
                aConnectedObjDefs.push(oConnectedObjDef);
                break;
            }
        }
    }
    return ArisData.Unique(aConnectedObjDefs);
}


//Gettin corresponding data
function getCorrData(cObjDef,ot_arr,cur_model,cocc,nloc,CTF_L){
    
    var output_arr = new Array();    
  var c_def = getConnectedObjDefs(cObjDef,ot_arr);
                
  for(var mm=0;mm<c_def.length;mm++){
                    
    var l_Occs = c_def[mm].OccListInModel(cur_model);
                    
    for(var l=0;l<l_Occs.length;l++){
                        
    if(!l_Occs[l].ObjDef().ObjectID().equals(cocc.ObjDef().ObjectID())){
                            
     if(l>0){
      if(!l_Occs[l].ObjectID().equals(l_Occs[l-1].ObjectID())&&check_cxn(l_Occs[l],cObjDef,cur_model,CTF_L)){
         output_arr.push(l_Occs[l].ObjDef().Attribute(Constants.AT_NAME,nloc).getValue());
      }
     }
     else if((l==0)&&check_cxn(l_Occs[l],cObjDef,cur_model,CTF_L)){
        output_arr.push(l_Occs[l].ObjDef().Attribute(Constants.AT_NAME,nloc).getValue());
      }
     }
    }
  }
  return output_arr;
}


//For FW report
function getCorrDataFW(cObjDef,ot_arr,cur_model, nloc,CTF_L){
    
    var output_arr = new Array();    
  var c_def = cObjDef.getConnectedObjs(ot_arr);
                
  for(var mm=0;mm<c_def.length;mm++){
                    
    var l_Occs = c_def[mm].OccListInModel(cur_model);
                    
    for(var l=0;l<l_Occs.length;l++){
                        
     if(l>0){
      if(!l_Occs[l].ObjectID().equals(l_Occs[l-1].ObjectID())&&check_cxn(l_Occs[l],cObjDef,cur_model,CTF_L)){
         output_arr.push(l_Occs[l].ObjDef().Attribute(Constants.AT_NAME,nloc).getValue());
      }
     }
     else if((l==0)&&check_cxn(l_Occs[l],cObjDef,cur_model,CTF_L)){
        output_arr.push(l_Occs[l].ObjDef().Attribute(Constants.AT_NAME,nloc).getValue());
      }
    }
  }
  return output_arr;
}

function getcxn2func(nloc, ocurrentobjdef, ocurrentcxn, soutcxnname, soutcxntargetobj, soutcxntargetobjtype, ootherobjdef,invConn)
{
  // Get string for  connection name output and string for target object output
  // Check if current connection is connection from/to function

  var __functionResult = false;

  var osourceobjdef = ocurrentcxn.SourceObjDef();
  var otargetobjdef = ocurrentcxn.TargetObjDef();
  var typeNum;

  if ((ocurrentobjdef.IsEqual(osourceobjdef))) {
    // if object definiton is source of connection
    soutcxnname.value           = ocurrentcxn.ActiveType();
    soutcxntargetobj.value      = otargetobjdef.Name(nloc);
    soutcxntargetobjtype.value  = otargetobjdef.Type();
    ootherobjdef.value          = otargetobjdef;
    typeNum = otargetobjdef.TypeNum();
  } else {
    // if object definiton is target of connection
    soutcxnname.value           = ocurrentcxn.PassiveType();
    soutcxntargetobj.value      = osourceobjdef.Name(nloc);
    soutcxntargetobjtype.value  = osourceobjdef.Type();
    ootherobjdef.value          = osourceobjdef;
    typeNum = osourceobjdef.TypeNum();
  }
     if (typeNum == Constants.OT_FUNC) {
      __functionResult = true;
     }
     
     if(invConn){CTF = CTF_INV.concat(CTF_EXEC) ;}
     else {CTF = CTF_EXEC;}
     
     if (__functionResult){
         for(var i=0;i<CTF.length;i++){
        if(ocurrentcxn.TypeNum() == Constants[CTF[i]]){
            return true;
        }
        }
    }
  return false;
}

// dialog item constants
var dicReportCategory       = "optReportCategory";
var dicFuncWeakRep          = "dicFuncWeakRep";
var dicJobDesc              = "dicJobDesc";
var dicModelPath            = "chkModelPath";
var dicIncludeFAD           = "chkIncludeFAD";
var dicAttribute            = "chkAttribute";
var dicInvolvedConn         = "chkInvolvedConn";
var dicExecuteConn          = "chkExecuteConn";
var dicOInvolvedConn        = "chkOInvolvedConn";
var dicOExecuteConn         = "chkOExecuteConn";
var dicInput                = "chkInput";
var dicOutput               = "chkOutput"
var dicSuppIT               = "chkSuppIT";
var dicExecIT               = "chkExecIT";
var dicImpPotential         = "chkImpPotential";
 
 //---------------------------------------------------------------------------
 //-------------------OPTIONS FORM------------------------------------------
function showOutputOptionsDialog(holder_nOptReportCategory, holder_bModelPath, 
                              holder_bIncludeFAD, holder_bAttribute, 
                              holder_bInvolvedConn, holder_bOExecuteConn, holder_bOInvolvedConn, 
                              holder_bInput, holder_bOutput, holder_bSuppIT, holder_bExecIT, holder_bImpPotential)
{
  // Output format
  var userdialog = Dialogs.createNewDialogTemplate(0, 0, 470, 280, txtOutputOptionsDialogTitle,"dlg_Listener");

  userdialog.GroupBox(7, 10, 463, 50, txtReportCategory);
  userdialog.OptionGroup(dicReportCategory);
  userdialog.OptionButton(20, 20, 300, 15, txtFuncWeakRep, dicFuncWeakRep);
  userdialog.OptionButton(20, 35, 300, 15, txtJobDesc, dicJobDesc);

  userdialog.GroupBox(7, 65, 463, 50, txtModel);
  userdialog.CheckBox(20, 75, 300, 15, txtModelPath, dicModelPath);
  userdialog.CheckBox(20, 90, 300, 15, txtIncludeFAD, dicIncludeFAD);
  
  userdialog.GroupBox(7, 120, 463, 50, txtOrgEl);
  userdialog.CheckBox(20, 130, 300, 15, txtAttribute, dicAttribute);
  userdialog.CheckBox(20, 145, 300, 15, txtInvolvedConn, dicInvolvedConn);
  
  userdialog.GroupBox(7, 175, 463, 50, txtOtherOrgEl);
  userdialog.CheckBox(20, 185, 300, 15, txtExecuteConn, dicOExecuteConn);
  userdialog.CheckBox(20, 200, 300, 15, txtInvolvedConn, dicOInvolvedConn);
  
//---------------------------------------  
  userdialog.GroupBox(7, 230, 463, 95, txtOther);
  userdialog.CheckBox(20, 240, 300, 15, txtInput, dicInput);
  userdialog.CheckBox(20, 255, 300, 15, txtOutput, dicOutput);
  userdialog.CheckBox(20, 270, 300, 15, txtSuppIT, dicSuppIT);
  userdialog.CheckBox(20, 285, 300, 15, txtExecIT, dicExecIT);
  userdialog.CheckBox(20, 300, 300, 15, txtImpPotential, dicImpPotential);    
//---------------------------------------  

  userdialog.OKButton();
  userdialog.CancelButton();
//  userdialog.HelpButton("HID_b64bbf90_ffc5_11dc_1246_eac6a62b581c_dlg_01.hlp");  

  dlgFuncOutput = Dialogs.createUserDialog(userdialog); 
  dlgFuncOutput.setDlgValue(dicReportCategory, holder_nOptReportCategory.value);

  var vals = new Array( (holder_bModelPath.value?1:0), (holder_bIncludeFAD.value?1:0), (holder_bAttribute.value?1:0), 
                        (holder_bInvolvedConn.value?1:0), (holder_bOExecuteConn.value?1:0), (holder_bOInvolvedConn.value?1:0),
                        (holder_bInput.value?1:0), (holder_bOutput.value?1:0), (holder_bSuppIT.value?1:0), (holder_bExecIT.value?1:0), (holder_bImpPotential.value?1:0));
  var dics = new Array(dicModelPath, dicIncludeFAD, dicAttribute, dicInvolvedConn, dicOExecuteConn, 
                       dicOInvolvedConn,dicInput, dicOutput, dicSuppIT, dicExecIT, dicImpPotential);

  for(var i=0;i<dics.length;i++) {
    dlgFuncOutput.setDlgValue(dics[i], vals[i]);  
  }

  nuserdialog = Dialogs.show( __currentDialog = dlgFuncOutput);

  // Displays dialog and waits for the confirmation with OK.
  if (nuserdialog != 0) {
    holder_nOptReportCategory.value = dlgFuncOutput.getDlgValue(dicReportCategory);

    var holders = new Array(holder_bModelPath, holder_bIncludeFAD, holder_bAttribute, holder_bInvolvedConn,
                              holder_bOExecuteConn, holder_bOInvolvedConn, holder_bInput, holder_bOutput, 
                              holder_bSuppIT, holder_bExecIT, holder_bImpPotential);
    for(var i=0;i<dics.length;i++) {
      holders[i].value = dlgFuncOutput.getDlgValue(dics[i])!=0;  
    }
  }
  return nuserdialog;  
}

//Dialog listener
function dlg_Listener(dlgitem, action, suppvalue){
    var result = false;
    
    switch(action) {
    case 1: {
        if(dlgFuncOutput.getDlgValue(dicReportCategory)==0){
            dlgFuncOutput.setDlgEnable(dicAttribute, false);
            dlgFuncOutput.setDlgEnable(dicInvolvedConn, false);
        }
        if(selObjTypeOrg==false){	// BLUE-21090 Option 'Job description' only available if function(s) selected
            dlgFuncOutput.setDlgEnable(dicJobDesc, false);
        }
        if(selObjTypeFunc==false){
            dlgFuncOutput.setDlgEnable(dicFuncWeakRep, false);
            dlgFuncOutput.setDlgValue(dicReportCategory,1);
            dlgFuncOutput.setDlgEnable(dicAttribute, true);
            dlgFuncOutput.setDlgEnable(dicInvolvedConn, true);
        }
    }
            // it is also possible to init the dialog here (instead of before showing the dialog)
    case 2://CheckBox, DropListBox, ListBox or OptionGroup: value changed . CancelButton, OKButton or PushButton: button pressed
    {
        if (dlgitem.equals(dicReportCategory)&&(suppvalue==0)){
            dlgFuncOutput.setDlgEnable(dicAttribute, false);
            dlgFuncOutput.setDlgEnable(dicInvolvedConn, false);
            result = true;
        }
        if (dlgitem.equals(dicReportCategory)&&(suppvalue==1)){
            dlgFuncOutput.setDlgEnable(dicAttribute, true);
            dlgFuncOutput.setDlgEnable(dicInvolvedConn, true);
            result = true;
        }        
    }
    case 3://ComboBox oder TextBox: Der Text des Dialogelements wurde geändert und das Element verliert den Focus. SuppValue enthält die Länge des Texts.
    case 4://Das Dialogelement DlgItem erhält den Focus. SuppValue ist das Element, das den Focus verliert (Index, 0-basiert)
    case 5://Idle processing.
    case 6://Funktionstaste (F1-F24) wurde gedrückt. DlgItem hat den Fokus. SuppValue enthält die Nummer der Funktionstaste und den Zustand der Umschalt- (+ 0x0100), Strg- (+ 0x0200) und Alt-Taste (+ 0x0400)
    case 7://Doppelklick auf einer Tabelle oder einem Listenelement (ohne Editor). Tabelle: Spalte=SuppValue/10000 Index der Zeile = SuppValue - column*10000
    case 8://TableEditChange: Der Anwender hat eine Tabellenzelle editiert. SuppValue enthält den Index der geänderten Spalte und Zeile
    break;
  }

  return result;    
}

function showConnectOptionsDialog(holder_nOptReportCategory) {
    // Output format
    var userdialog = Dialogs.createNewDialogTemplate(0, 0, 470, 70, txtOutputOptionsDialogTitle);
    
    userdialog.GroupBox(7, 10, 463, 50, txtReportCategory);
    userdialog.OptionGroup(dicReportCategory);
    userdialog.OptionButton(20, 25, 300, 15, txtFuncWeakRep, dicFuncWeakRep);
    userdialog.OptionButton(20, 40, 300, 15, txtJobDesc, dicJobDesc);
    
    userdialog.OKButton();
    userdialog.CancelButton();
    //  userdialog.HelpButton("HID_b64bbf90_ffc5_11dc_1246_eac6a62b581c_dlg_02.hlp");   
    
    dlgFuncOutput = Dialogs.createUserDialog(userdialog); 
    dlgFuncOutput.setDlgValue(dicReportCategory, holder_nOptReportCategory.value);
    
    nuserdialog = Dialogs.show( __currentDialog = dlgFuncOutput);
    
    // Displays dialog and waits for the confirmation with OK.
    if (nuserdialog != 0) {
        holder_nOptReportCategory.value = dlgFuncOutput.getDlgValue(dicReportCategory);
    }
    return nuserdialog;  
}


//Setting Header and Footer
function setReportHeaderFooter(outfile, nloc, report_type)
{
  var ocurrentuser = null;   // Current user.
  
  var R_type="";
  if(report_type.equals("FW")){ R_type = getString("TEXT_32");}
  else if(report_type.equals("JD")){ R_type = getString("TEXT_33");}    
    
  // BLUE-17783 Update report header/footer
  var borderColor = getColorByRGB( 23, 118, 191);
    
  // graphics used in header
  var pictleft  = Context.createPicture(Constants.IMAGE_LOGO_LEFT); 
  var pictright = Context.createPicture(Constants.IMAGE_LOGO_RIGHT); 

  // header + footer settings
  setFrameStyle(outfile, Constants.FRAME_BOTTOM);
  outfile.BeginHeader();
  outfile.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
  outfile.TableRow();
  outfile.TableCell("", 26, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
  outfile.OutGraphic(pictleft, - 1, 40, 15);
  outfile.TableCell(R_type, 48, getString("TEXT20"), 13, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER|Constants.FMT_BOLD, 0);
  outfile.TableCell("", 26, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
  outfile.OutGraphic(pictright, - 1, 40, 15);
  outfile.EndTable("", 100, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
  outfile.EndHeader();

  setFrameStyle(outfile, Constants.FRAME_TOP);
  outfile.BeginFooter();
  outfile.BeginTable(100, borderColor, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
  outfile.TableRow();
  outfile.TableCell("", 20, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
  outfile.TableCell("", 60, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
  outfile.Output("Page ", getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER|Constants.FMT_BOLD, 0);
  outfile.OutputField(Constants.FIELD_PAGE, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER|Constants.FMT_BOLD);
  outfile.Output(" of ", getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER|Constants.FMT_BOLD, 0);
  outfile.OutputField(Constants.FIELD_NUMPAGES, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_CENTER|Constants.FMT_BOLD);
  outfile.TableCell("", 20, getString("TEXT20"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);
  outfile.EndTable("", 100, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
  outfile.EndFooter();
  
  outfile.ResetFrameStyle();
  
  
  function setFrameStyle(outfile, iFrame) { 
    outfile.SetFrameStyle(Constants.FRAME_TOP, 0); 
    outfile.SetFrameStyle(Constants.FRAME_LEFT, 0); 
    outfile.SetFrameStyle(Constants.FRAME_RIGHT, 0); 
    outfile.SetFrameStyle(Constants.FRAME_BOTTOM, 0);
        
    outfile.SetFrameStyle(iFrame, 50, Constants.BRDR_NORMAL);
  }  
}

/**
 *  function writeTableHeader
 *  writes table header for specified column headings
 *  @param outfile     file to write header to
 *  @param colHeadings array with column headings
 *  @param fontSize    font size
 */
function writeTableHeader(outfile, colHeadings, fontSize)
{
  writeTableHeaderWithColor(outfile, colHeadings, fontSize, Constants.C_TRANSPARENT, Constants.C_BLACK);
}


/**
 *  function writeTableHeader
 *  writes table header for specified column headings
 *  @param outfile     file to write header to
 *  @param colHeadings array with column headings
 *  @param fontSize    font size
 *  @param backColor   background color
 *  @param textColor   text color
 */
function writeTableHeaderWithColor(outfile, colHeadings, fontSize, backColor, textColor)
{
  outfile.TableRow();
  var cW=nLayout(colHeadings);
  for(var i=0;i<colHeadings.length;i++)
    outfile.TableCell(colHeadings[i], cW.get(colHeadings[i]), getString("TEXT20"), fontSize, textColor, backColor, 0, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_VTOP, 0);
}

//Table column layout
function nLayout(col){
    var cWidth = new java.util.HashMap();

    switch(col.length){
    case 1:{
        cWidth.put(col[0],100);
        break;
    }        
    case 2:{
        cWidth.put(col[0],50);
        cWidth.put(col[1],50);
        break;
    }
    case 3:{
        cWidth.put(col[0],34);
        cWidth.put(col[1],33);    
        cWidth.put(col[2],33);
        break;
    }
    case 4:{
        for(var i=0;i<col.length;i++){
            cWidth.put(col[i],25);
        }
        break;
    }        
    case 5:{
        for(var i=0;i<col.length;i++){
            cWidth.put(col[i],20);
        }
        break;
    }
    case 6:{
        var tX = Math.round(100/6);
        var imP = false;
        for(var i=0;i<col.length;i++){
            if(col[i].equals(getString("TEXT_14"))){
                imP=true;
            }
        }
        cWidth.put(col[0],tX);
        cWidth.put(col[1],tX-1);    
        cWidth.put(col[2],tX);
        cWidth.put(col[3],tX);
        if(imP){        
        cWidth.put(col[4],tX-1);
        cWidth.put(col[5],tX);
        }
        else{
        cWidth.put(col[4],tX);
        cWidth.put(col[5],tX-1);
        }
        break;        
    }
    case 7:{
        var tX = Math.round(100/7);
        var imP = false;
        for(var i=0;i<col.length;i++){
            if(col[i].equals(getString("TEXT_14"))){
                imP=true;
            }
        }
        cWidth.put(col[0],tX+1);
        cWidth.put(col[1],tX);    
        cWidth.put(col[2],tX);
        cWidth.put(col[3],tX);
        cWidth.put(col[4],tX);        
        if(imP){        
        cWidth.put(col[5],tX);
        cWidth.put(col[6],tX+1);
        }
        else{
        cWidth.put(col[5],tX+1);
        cWidth.put(col[6],tX);
        }
        break;        
    }
    case 8:{
        var tX = Math.round(100/8);

        cWidth.put(col[0],tX);
        cWidth.put(col[1],tX-1);    
        cWidth.put(col[2],tX-1);
        cWidth.put(col[3],tX-1);
        cWidth.put(col[4],tX);        
        cWidth.put(col[5],tX);
        cWidth.put(col[6],tX-1);
        cWidth.put(col[7],tX);
        break;        
    }
    case 9:{
        var tX = Math.round(100/9);

        cWidth.put(col[0],tX);
        cWidth.put(col[1],tX);    
        cWidth.put(col[2],tX);
        cWidth.put(col[3],tX);
        cWidth.put(col[4],tX);        
        cWidth.put(col[5],tX);
        cWidth.put(col[6],tX);
        cWidth.put(col[7],tX);
        cWidth.put(col[8],tX+1);        
        break;        
    }    
    case 10:{
        for(var i=0;i<col.length;i++){
            cWidth.put(col[i],10);
        }
        break;
    }    
    case 11:{
        for(var i=0;i<col.length-1;i++){
            cWidth.put(col[i],9);
        }
        cWidth.put(col[col.length-1],10);
        break;
    }
    case 12:{
        for (var i=0; i<col.length; i++) {
            if ((i+1) % 3 == 0) {
                cWidth.put(col[i], 9);
            } else {
                cWidth.put(col[i], 8);
            }
        }
        break;
    }
  }
  return cWidth;
}

//For all occurences the uniqe relevant models are returned
function getModels(obj_occ){
    var models=new Array();
    for(var i=0;i<obj_occ.length;i++){
        models.push(obj_occ[i].Model());
    }
    return ArisData.Unique(models);
}

//Check for proper connection type. 
function check_cxn(occ_1,odef,cur_model,CTF){
    occ_2 = odef.OccList(new Array(cur_model));
    
    for(var m=0; m<occ_2.length;m++){
     lCxns = occ_2[m].Cxns();
    
        for(var i=0;i<lCxns.length;i++){
          for(var j=0;j<CTF.length;j++){
            if(lCxns[i].CxnDef().TypeNum()==Constants[CTF[j]]){
                var sObjOcc = lCxns[i].SourceObjOcc();
                var tObjOcc = lCxns[i].TargetObjOcc();
                if(sObjOcc.ObjectID().equals(occ_1.ObjectID())||tObjOcc.ObjectID().equals(occ_1.ObjectID())){
                 return true;
                }
            }
        }
        }
    }
    return false;    
}

function getAllowed(tObjDef,TA){
   var typs = getConsts(TA);
    var occs = tObjDef.OccList();
    var outArr = new Array();
    for(var j=0;j<occs.length;j++){
    for(var i=0;i<typs.length;i++){
        if(occs[j].Model().OrgModelTypeNum()==typs[i]){
         outArr.push(occs[j]);            
        }       
     }
    }
    return outArr;
}

function checkObj(ocurrentobjdef){
    for(var i=0;i<OT.length;i++){
     if(ocurrentobjdef.TypeNum()==Constants[OT[i]]){
        return true;
     }
    }    
return false;
}

function getConsts(TA){
    var arr = new Array();
    for(var i=0;i<TA.length;i++)
    {
        var nTypeNum = eval("Constants." + TA[i]);
        if (isNaN(nTypeNum)) continue;              // BLUE-11252 Filter out undefined types

        arr.push(nTypeNum);
    }   
    return arr;
}
//Output to DOC
function table_output(oFile, hMap, keyArr, colHeadings){
    var cW=nLayout(colHeadings);
    for(var j=0;j<keyArr.length;j++){
       oFile.TableRow();
       var lhMap = hMap.get(keyArr[j].toString());
    for(var i=0; i< colHeadings.length;i++){
        oFile.TableCell(lhMap.get(colHeadings[i]), cW.get(colHeadings[i]), getString("TEXT20"), 8, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);        
    }
    }
}

function rep_SortObjByName(a,b){
//Info: function uses in sort()
//Info: function compares "a" and "b" by AT_NAME value
//Info: "a" and "b" are ARIS objects
  
    var a1_Name = new java.lang.String(a.Attribute(Constants.AT_NAME, nloc).getValue());
    var b1_Name = new java.lang.String(b.Attribute(Constants.AT_NAME, nloc).getValue());

    var bResult;
    
    bResult = a1_Name.compareTo(b1_Name);

    return bResult;
}

function repSortAT(a,b){
//Info: function uses in sort()
//Info: function compares "a" and "b" by attribute type names
//Info: "a" and "b" are int constants

    
    var a1_Name = new java.lang.String(aFilter.AttrTypeName(Constants[a]));
    var b1_Name = new java.lang.String(aFilter.AttrTypeName(Constants[b]));

    var bResult;
    
    bResult = a1_Name.compareTo(b1_Name);

    return bResult;
   
}

function rep_SortHMapBy3(a, b){
//Info: function uses in sort()
//Info: function compares "a" and "b" by HashMap items: Role, Process, Activity
//Info: "a" and "b" are HashMaps

    var a1_Name = new java.lang.String(a.get(getString("TEXT_19")));
    var b1_Name = new java.lang.String(b.get(getString("TEXT_19")));

    var a2_Name = new java.lang.String(a.get(getString("TEXT_17")));
    var b2_Name = new java.lang.String(b.get(getString("TEXT_17")));

    var a3_Name = new java.lang.String(a.get(getString("TEXT_6")));
    var b3_Name = new java.lang.String(b.get(getString("TEXT_6")));

    var bResult;
    

    bResult = a1_Name.compareTo(b1_Name);
    if (bResult == 0){
        bResult = a2_Name.compareTo(b2_Name);
        if (bResult == 0){
            bResult = a3_Name.compareTo(b3_Name);
        }
    }
    return bResult;

}//end: rep_SortHMap(a, b)

function rep_SortHMapBy2(a, b){
//Info: function uses in sort()
//Info: function compares "a" and "b" by HashMap items:  Process, Activity
//Info: "a" and "b" are HashMaps

    var a1_Name = new java.lang.String(a.get(getString("TEXT_17")));
    var b1_Name = new java.lang.String(b.get(getString("TEXT_17")));

    var a2_Name = new java.lang.String(a.get(getString("TEXT_6")));
    var b2_Name = new java.lang.String(b.get(getString("TEXT_6")));

    var bResult;
    

    bResult = a1_Name.compareTo(b1_Name);
    if (bResult == 0){
        bResult = a2_Name.compareTo(b2_Name);
    }
    return bResult;

}//end: rep_SortHMap(a, b)


//Output to XLS
function table_outputEx(oFile,hMapArr,colHeadings,repType){
    
   // var keyArr = hMap.keySet().toArray().sort();
    var loc_arr = new Array();
    for(var i=0;i<hMapArr.length;i++){
    //var lhMap = hMap.get(keyArr[j].toString()); 
     var keyArr = hMapArr[i].keySet().toArray().sort(); 
       for(var j=0;j<keyArr.length;j++){
           var xKey = keyArr[j].toString();
           loc_arr.push(hMapArr[i].get(xKey));
       }
    }
    
    if(repType==1){
        loc_arr.sort(rep_SortHMapBy3);
    }
    else if(repType==0){
        loc_arr.sort(rep_SortHMapBy2);
    }
    
    var cW=nLayout(colHeadings);
    
    for(var j=0;j<loc_arr.length;j++){
       oFile.TableRow();
       //var lhMap = hMap.get(keyArr[j].toString());
    for(var i=0; i< colHeadings.length;i++){
        oFile.TableCell(loc_arr[j].get(colHeadings[i]), cW.get(colHeadings[i]), getString("TEXT20"), 8, Constants.C_BLACK, Constants.C_WHITE, 0, Constants.FMT_CENTER | Constants.FMT_VCENTER, 0);        
    }
    }
    return true;
}

//
function clearFAD(functions){
    for(var i=0; i<functions.length;i++){
        functions[i].AssignedModels();
    }
}

function getSettings(sSection, sField, bDefault) {
    return (Context.getProfileInt(sSection, sField, bDefault?1:0) == 1);
}

function setSettings(sSection, sField, bSet) {
    Context.writeProfileInt(sSection, sField, bSet?1:0);
}

function getBoolPropertyValue(p_sPropKey) {
    var property = Context.getProperty(p_sPropKey);
    if (property != null) {
        return (StrComp(property, "true") == 0);
    }
    return false;
}

function outEmptyResult(outfile) {    
    if ( Context.getSelectedFormat() == Constants.OutputXLS || Context.getSelectedFormat() == Constants.OutputXLSX ) {
        outfile.TableRow();
        outfile.TableCell(getString("TEXT17"), 100, getString("TEXT20"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_EXCELMODIFY, 0);
    } else {         
        outfile.OutputLn(getString("TEXT17"), getString("TEXT20"), 10, Constants.C_RED, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);
    }
}

function isDialogSupported() {
    // // Dialog support depends on script runtime environment (STD resp. BP, TC)
    var env = Context.getEnvironment();
    if (env.equals(Constants.ENVIRONMENT_STD)) return true;
    if (env.equals(Constants.ENVIRONMENT_TC)) return SHOW_DIALOGS_IN_CONNECT;
    return false;
}

main();
