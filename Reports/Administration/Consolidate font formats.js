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

var db = ArisData.getActiveDatabase();
var nloc = Context.getSelectedLanguage();
var aFilter = db.ActiveFilter();
var fnts = db.FontStyleList();
var aUserRights = ArisData.ActiveUser().FunctionRights();


var txtOutputOptionsDialogTitle = getString("TEXT_7");
var dlgFuncOutput;
var master_entries = new Array();
var slave_entries = new Array();
var out_slaves = new Array();
var out_master = new Array();
var proceed = false;
var hasRights = false;
var master_f = new java.util.HashMap();
var slave_f = new java.util.HashMap();

function main(){
        
        for(var i=0;i<aUserRights.length;i++){
            if(aUserRights[i]==Constants.AT_FONT_ADMIN){hasRights=true; break;}
        }
        
        if(!hasRights){
            Dialogs.MsgBox(getString("TEXT_5"),
                            Constants.MSGBOX_BTN_OK|Constants.MSGBOX_ICON_ERROR,getString("TEXT_6"));
            return;
        }

        for(var i=0;i<fnts.length;i++){
            if(isboolattributetrue(fnts[i], Constants.AT_MASTER_FONT, nloc)){           // Anubis 377862, Applix 206461
                master_entries.push(fnts[i].Name(nloc));
                master_f.put(fnts[i].Name(nloc),fnts[i]);
            }
            else{
                slave_entries.push(fnts[i].Name(nloc));
                slave_f.put(fnts[i].Name(nloc),fnts[i]);                
            }
         }
        
        if(master_entries.length==0){
            Dialogs.MsgBox(getString("TEXT_8"),
                            Constants.MSGBOX_BTN_OK|Constants.MSGBOX_ICON_ERROR,getString("TEXT_10"));
                            return;
        }
        
        if(slave_entries.length==0){
            Dialogs.MsgBox(getString("TEXT_9"),
                            Constants.MSGBOX_BTN_OK|Constants.MSGBOX_ICON_ERROR,getString("TEXT_11"));
                            return;
        }
        
        dlgFuncOutput = createDiag(master_entries.sort(),slave_entries.sort());//,out_master,out_slaves);
        if(dlgFuncOutput!=0){
         proceed = (Dialogs.MsgBox(getString("TEXT_4"),
                    Constants.MSGBOX_BTN_YESNO|Constants.MSGBOX_ICON_WARNING,"Warning!")==6)?true:false;
        }
        
  //if user accepts proceeding    
  //consolidation is started
  if(proceed){
    var mas_font = master_f.get(master_entries[out_master[0]]);
    var sla_font = new Array();
    
    for(var i=0; i < out_slaves.length; i++){
       sla_font.push(slave_f.get(slave_entries[out_slaves[i]]));
    }
    
    mas_font.Consolidate(sla_font, true, true);
  }//:end consolidation
}//:end main()

var dicMasterFont = "dicMasterFont";
var dicSlaveFonts = "dicSlaveFonts";

function createDiag(master_entr,slave_entr){
    var userdialog = Dialogs.createNewDialogTemplate(0, 0, 650, 205, txtOutputOptionsDialogTitle);
    
    userdialog.Text(10,10,500,10,getString("TEXT_1"));
    
    userdialog.GroupBox(10,25,300,175,getString("TEXT_2"));
    userdialog.ListBox(25,40,270,150,master_entr,dicMasterFont);        // Anubis 490094

    userdialog.GroupBox(330,25,300,175,getString("TEXT_3"));
    userdialog.ListBox(345,40,270,150,slave_entr,dicSlaveFonts,1);      // Anubis 490094
    
    
    userdialog.OKButton();
    userdialog.CancelButton();
//    userdialog.HelpButton("HID_dfa43b30_9cb8_11dc_431a_00c09f4eb3b0_dlg_01.hlp");
    
    dlgFuncOutput = Dialogs.createUserDialog(userdialog);
    
    // BLUE-17437 - Preselect master and slave font
    dlgFuncOutput.setDlgSelection(dicMasterFont, 0);
    dlgFuncOutput.setDlgSelection(dicSlaveFonts, [0]);
  
    nuserdialog = Dialogs.show(__currentDialog = dlgFuncOutput);
    
    if(nuserdialog!=0){
        out_master = dlgFuncOutput.getDlgSelection(dicMasterFont); 
        out_slaves = dlgFuncOutput.getDlgSelection(dicSlaveFonts);   
    }
    
  return nuserdialog;
}

main();