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

/***************************************************
* Copyright (c) Software AG. All Rights Reserved. *
***************************************************/

// BLUE-17650 - Import/Usage of 'convertertools.js' removed  


var g_nloc = Context.getSelectedLanguage(); 

function main()
{
	var oobjocc 	  = new __holder(null); 
    var bsap2customer = new __holder(false); 
    var brecursive    = new __holder(false); 
	
    // Object-occurences selected
    var oobjocclist = ArisData.getSelectedObjOccs();
    if (oobjocclist.length > 0) {
        
        if (Dialogs.MsgBox(getString("TEXT_1"), Constants.MSGBOX_BTN_YESNO | Constants.MSGBOX_ICON_QUESTION, getString("TEXT_11")) == Constants.MSGBOX_RESULT_YES) {
            brecursive.value = true;
        }
        
        for (var i = 0; i < oobjocclist.length; i++) {
            oobjocc.value = oobjocclist[i];
            
            bsap2customer.value = issapocc(oobjocc);
            
            updateobjectscoping(oobjocc, brecursive, bsap2customer);
            oobjocc.value = null;
        }
    } else {
        // Object-definitions selected      
        var oobjdeflist = ArisData.getSelectedObjDefs();
        
        if (userdlg(bsap2customer, brecursive)) {
            for (var i = 0; i < oobjdeflist.length; i++) {
                var bscopingok = true;
                
                var oobjdef = oobjdeflist[i];
                if (oobjdef.TypeNum() == Constants.OT_FUNC) {
                    
                    // Get reference occurence
                    if (bsap2customer.value) {
                        oobjocc.value = getsapocc(oobjdef);                 // Get SAP occurence
                    } else {
                        oobjocc.value = getcustomerocc(oobjdef);            // Get Customer occurence
                    }
                    
                    if (! ( typeof(oobjocc.value) == "object" && oobjocc.value == null)) {
                        updateobjectscoping(oobjocc, brecursive, bsap2customer);
                    } else {
                        bscopingok = false;
                    }
                } else {
                    bscopingok = false;
                }
                
                if (! (bscopingok)) {
                    Context.writeOutput(formatstring2(getString("TEXT_2"), oobjdef.Name(g_nloc), oobjdef.Type()));
                }
            }
        }
    }   
    Context.setScriptError(Constants.ERR_NOFILECREATED);
}


function updateobjectscoping(oreferenceocc, brecursive, bsap2customer)
{
    // Update scope infos of occurence
    if (! (( typeof(oreferenceocc.value) == "object" && oreferenceocc.value == null))) {
        
        updatescopeinfo(oreferenceocc);
    }
    
    if (oreferenceocc.value.ObjDef().TypeNum() == Constants.OT_FUNC) {
		var oreferencedef = new __holder(null); 
        oreferencedef.value = oreferenceocc.value.ObjDef();
        
        // Update transaction in assigned FAD-model
        updatetransactionsinassignedfadmodel(oreferencedef.value);
        
        if (brecursive.value) {
            
            // Only assignments of SAP-functions in SAP-process or
            // of customer-functions in customer-process
            if ((bsap2customer.value && issapocc(oreferenceocc)) || (! (bsap2customer.value) && iscustomerocc(oreferenceocc))) {
                
                // Get assigned eEPC-models
                if (! (isprocessstep(oreferencedef.value))) {
                    
                    // Get assigned eEPC-models
                    var oassignedepcmodels = getassignedepcmodels(oreferencedef, bsap2customer);
                    for (var i = 0; i < oassignedepcmodels.length; i++) {
                        
                        var oobjocclist = oassignedepcmodels[i].ObjOccListFilter(Constants.OT_FUNC);
                        for (var j = 0; j < oobjocclist.length; j++) {
							var onextobjocc = new __holder(null); 
                            onextobjocc.value = oobjocclist[j];
                            
                            if (! (onextobjocc.value.ObjDef().IsEqual(oreferenceocc.value.ObjDef()))) {
                                // else cycle possible                                
                                updateobjectscoping(onextobjocc, brecursive, bsap2customer);
                            }
                        }
                    }
                }
            }
        }
    }
}

function getsapocc(oobjdef)
{
	var oobjocclist = oobjdef.OccList();
    for (var i = 0; i < oobjocclist.length; i++) {
		var oobjocc = new __holder(null); 
        oobjocc.value = oobjocclist[i];
        
        if ((oobjocc.value.OrgSymbolNum() != Constants.ST_SOLAR_SL_OCC)  && (oobjocc.value.OrgSymbolNum() != Constants.ST_SOLAR_SL_VAC_OCC)) {

			if (issapocc(oobjocc)) {
				return oobjocc.value;		// exit after first SAP occ found (!!!)
            }
        }
    }
	return null;
}

function getcustomerocc(oobjdef)
{
    var oobjocclist = oobjdef.OccList();
    for (var i = 0; i < oobjocclist.length; i++) {
		var oobjocc = new __holder(null); 
        oobjocc.value = oobjocclist[i];
        
        if (iscustomerocc(oobjocc)) {
			return oobjocc.value;			// exit after first Customer occ found (!!!)
        }
    }
    return null;
}

function issapocc(oobjocc)
{
    // SAP: (Function) Occurence in model WITH maintained SAP-model-type
    if (oobjocc.value.ObjDef().TypeNum() == Constants.OT_FUNC) {
        var omodel = oobjocc.value.Model();
        if (hasrightmodeltype(omodel) && omodel.Attribute(Constants.AT_SAP_MOD_TYPE, g_nloc).IsMaintained()) {
            return true;
        }
    }
    return false;
}

function iscustomerocc(oobjocc)
{
    // Customer: (Function) Occurence in model WITHOUT maintained SAP-model-type
    if (oobjocc.value.ObjDef().TypeNum() == Constants.OT_FUNC) {
        var omodel = oobjocc.value.Model();
        if (hasrightmodeltype(omodel) && omodel.Attribute(Constants.AT_SAP_MOD_TYPE, g_nloc).IsMaintained()) {
            return true;
        }
    }
	return false
}

function iscustomeritem(oitem)
{
	// Customer: WITHOUT maintained Attribute: SAP-function-/model-type
    switch(oitem.KindNum()) {
        case Constants.CID_OBJDEF:
			if (! (oitem.Attribute(Constants.AT_SAP_FUNC_TYPE, g_nloc).IsMaintained())) {
				return true;
			}
        case Constants.CID_MODEL:
			if (! (oitem.Attribute(Constants.AT_SAP_MOD_TYPE, g_nloc).IsMaintained())) {
				return true;
			}
    }
    return false;
}

function issapitem(oitem)
{
    // SAP: WITH maintained Attribute: SAP-function-/model-type    
    switch(oitem.value.KindNum()) {
        case Constants.CID_OBJDEF:
			if (oitem.value.Attribute(Constants.AT_SAP_FUNC_TYPE, g_nloc).IsMaintained()) {
				return true;
			}
        case Constants.CID_MODEL:
			if (oitem.value.Attribute(Constants.AT_SAP_MOD_TYPE, g_nloc).IsMaintained()) {
				return true;
			}
    }
    return false;
}

function isprocessstep(oobjdef)
{
    var bisprocessstep = false; 
    
    if (oobjdef.Attribute(Constants.AT_SAP_FUNC_TYPE, g_nloc).IsMaintained()) {
        var nfunctype = oobjdef.Attribute(Constants.AT_SAP_FUNC_TYPE, g_nloc).MeasureUnitTypeNum();
        
        if (nfunctype == Constants.AVT_SOLAR_PROCESS_STEP) {
            bisprocessstep = true;
        }
    }
    return bisprocessstep;
}


function updatescopeinfo(oreferenceocc)
{
	var bscope = oreferenceocc.value.getActive();
    
    var oobjocclist = oreferenceocc.value.ObjDef().OccList();
    for (var j = 0; j < oobjocclist.length; j++) {
        var oobjocc = oobjocclist[j];
        var oobjdef = oobjocc.ObjDef();
        
        if (! (oobjocc.IsEqual(oreferenceocc.value))) {
            
            if (oobjocc.getActive() != bscope) {
                oobjocc.setActive(bscope);                      // Set scoping
                
                if (bscope) {
                    Context.writeOutput(formatstring3(getString("TEXT_3"), oobjdef.Name(g_nloc), oobjdef.Type(), oobjocc.Model().Name(g_nloc)));
                } else {
                    Context.writeOutput(formatstring3(getString("TEXT_4"), oobjdef.Name(g_nloc), oobjdef.Type(), oobjocc.Model().Name(g_nloc)));
                }
            }
        }
    }
}

function updatetransactionsinassignedfadmodel(oobjdef)
{
    var oassignedmodels = oobjdef.AssignedModels();
    for (var i = 0; i < oassignedmodels.length; i++) {
        var oassignedmodel = oassignedmodels[i];
        
        if (oassignedmodel.OrgModelTypeNum() == Constants.MT_FUNC_ALLOC_DGM) {        // TANR 216764
            
            var oobjocclist = oassignedmodel.ObjOccListFilter(Constants.OT_SCRN);
            for (var j = 0; j < oobjocclist.length; j++) {
                
                updatescopeinfo(new __holder(oobjocclist[j]));		// Update transaction scoping
            }
        }
    }
}

function getassignedepcmodels(oobjdef, bsap2customer)
{
    // Get SAP function Type of SAP function
    var ssapfunctype = "";
    if (bsap2customer.value) {
        if (issapitem(oobjdef)) {
            ssapfunctype = ""+oobjdef.value.Attribute(Constants.AT_SAP_FUNC_TYPE, g_nloc).GetValue(false);
        }
    }
    
    var omodellist = new Array();
	
    var oassignedmodels = oobjdef.value.AssignedModels();   
    for (var i = 0; i < oassignedmodels.length; i++) {
		var oassignedmodel = new __holder(null); 
        oassignedmodel.value = oassignedmodels[i];
        
        if (hasrightmodeltype(oassignedmodel.value)) {
            // Customer...
            if ((! (bsap2customer.value) && iscustomeritem(oassignedmodel.value))) {
                
                // Add only eEPC models without SAP modelType
                omodellist[omodellist.length] = oassignedmodel.value;
            } 
			else if ((bsap2customer.value && issapitem(oassignedmodel))) {
                var ssapmodeltype = oassignedmodel.value.Attribute(Constants.AT_SAP_MOD_TYPE, g_nloc).GetValue(false);
                
                // Add only eEPC models with the same SAP modelType
                if (StrComp(ssapfunctype, ssapmodeltype) == 0) {
                    omodellist[omodellist.length] = oassignedmodel.value;
                }
            }
        }
    }
    return omodellist;
}


function userdlg(bsap2customer, brecursive)
{
    var userdialog = Dialogs.createNewDialogTemplate(0, 0, 540, 189, getString("TEXT_5"));
    // %GRID:10,7,1,1
    userdialog.GroupBox(20, 7, 500, 98, getString("TEXT_6"), "GroupBox1");
    userdialog.Text(30, 30, 480, 28, getString("TEXT_7"), "Text2");
    userdialog.OptionGroup("Options");
    userdialog.OptionButton(40, 65, 400, 15, getString("TEXT_8"), "OptionButton1");
    userdialog.OptionButton(40, 85, 400, 15, getString("TEXT_9"), "OptionButton2");
    userdialog.CheckBox(20, 120, 500, 15, getString("TEXT_10"), "Check_Recursion");
    userdialog.OKButton();
    userdialog.CancelButton();
    //  userdialog.HelpButton("HID_1d276620_76c0_11d9_21e3_000802c68187_dlg_01.hlp");
    
    var dlg = Dialogs.createUserDialog(userdialog); 
    
    // Read dialog settings from config 
    var sSection = "SCRIPT_1d276620_76c0_11d9_21e3_000802c68187";
    ReadSettingsDlgValue(dlg, sSection, "Options", 0);  
    ReadSettingsDlgValue(dlg, sSection, "Check_Recursion", 1);
    
    var nuserdlg = Dialogs.show( __currentDialog = dlg);		// Showing dialog and waiting for confirmation with OK
    
    bsap2customer.value = dlg.getDlgValue("Options") != 0;
    brecursive.value 	= dlg.getDlgValue("Check_Recursion") != 0;
    
    if (nuserdlg == 0) {
        return  false;
    } else {
        // Write dialog settings to config     
        WriteSettingsDlgValue(dlg, sSection, "Options");  
        WriteSettingsDlgValue(dlg, sSection, "Check_Recursion");    
		
		return true;
    }
}

function hasrightmodeltype(omodel)
{
    var bhasrighttype = false; 
    
    var nmodeltypenum = omodel.OrgModelTypeNum();       // TANR 216764
    if (nmodeltypenum == Constants.MT_EEPC || 
        nmodeltypenum == Constants.MT_EEPC_COLUMN || 
        nmodeltypenum == Constants.MT_VAL_ADD_CHN_DGM) {
            
		bhasrighttype = true;
	}
	return bhasrighttype;
}


main();
