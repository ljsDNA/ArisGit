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

if (checkActiveFilter()) {
    var oSelModels = getSelectedBPMNModels();
    var checkMerge = new checkOpenMergeConflicts();
    if (!checkMerge.getAllMods2Open(oSelModels)){
        var mapInfoMarks = initInfoMarks(oSelModels);
        check_ModelForErrors( mapInfoMarks, oSelModels );
        check_Uniqueness( mapInfoMarks, oSelModels );
        
        gb_DGRMS_OPEN_SET = displayErrors();
        
        outInfoMarks( mapInfoMarks );
        
        writeDetailedResult(mapInfoMarks);
        
    } else { 
        if(isSilent()){
             Context.setProperty("SILENT_MESSAGE", getString("MSG_MERGE_INCOMPLETE"));
             Context.setProperty("SILENT_ERROR", "true"); 
        }else{
            Dialogs.MsgBox(getString("MSG_MERGE_INCOMPLETE"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_ERROR, Context.getScriptInfo(Constants.SCRIPT_NAME) );       
            gb_c_ERROR_MARK_SET     = true;
            gb_DGRMS_OPEN_SET       = true;
        }
    }   
}
writeProperties( );


function writeDetailedResult( mapInfoMarks){
        var bos = new java.io.ByteArrayOutputStream() ;
        var out = new java.io.ObjectOutputStream(bos) ;
        out.writeObject(mapInfoMarks);
        out.close();
        Context.setPropertyBytes("DETAILED_RESULT", bos.toByteArray());
}



/*************************************************************************************************************************************/

function checkActiveFilter() {
    var bIsFilterOk = checkFilter(ArisData.ActiveFilter());
    
    if (!bIsFilterOk) {
        gb_c_ERROR_MARK_SET = true;
        
        if (!isSilent() && !getBoolPropertyValue("SHOW_RESULTS_WITHOUT_CALLBACK")) {
            Dialogs.MsgBox(getString("MSG_FILTER_ERROR"), Constants.MSGBOX_BTN_OK | Constants.MSGBOX_ICON_ERROR, Context.getScriptInfo(Constants.SCRIPT_NAME) );
        }
    }
    return bIsFilterOk;
}

function displayErrors() {
    if (isSilent()){
        if(gb_c_ERROR_MARK_SET){
             Context.setProperty("SILENT_ERROR", "true");     
        } else if(gb_c_INFO_MARK_SET || gb_c_WARNING_MARK_SET){
             Context.setProperty("SILENT_WARNING", "true");  
        }
        return false;
    } 
   
   
   if (gb_c_ERROR_MARK_SET) 
        return true;
    
    if (gb_c_INFO_MARK_SET || gb_c_WARNING_MARK_SET) {
       
            
       
        if (getBoolPropertyValue("SHOW_RESULTS_WITHOUT_CALLBACK")) return true;
        
        dlgRes = Dialogs.MsgBox(getString("MSG_SHOW_DIAGRAMS"), Constants.MSGBOX_BTN_YESNO | Constants.MSGBOX_ICON_QUESTION, Context.getScriptInfo(Constants.SCRIPT_NAME) );
        if (dlgRes == Constants.MSGBOX_RESULT_YES) return true;
    }
    return false;
}        


