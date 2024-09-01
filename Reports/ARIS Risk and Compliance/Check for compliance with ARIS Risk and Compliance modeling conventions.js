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

var REPORT_SEMANTICSCHECK_HIERARCHYSTRUCTURE        = "844c6cb0-c480-11da-14e3-00123f5c9b19";
var REPORT_SEMANTICSCHECK_RISK                      = "d9cd78b0-c63c-11da-14e3-00123f5c9b19";
var REPORT_SEMANTICSCHECK_CONTROL                   = "31f6bee0-c618-11da-14e3-00123f5c9b19";
var REPORT_SEMANTICSCHECK_TESTDEFINITION            = "a210dab0-c575-11da-14e3-00123f5c9b19";
var REPORT_SEMANTICSCHECK_USERGROUP                 = "d2e3ee40-c8c0-11da-14e3-00123f5c9b19";
var REPORT_SEMANTICSCHECK_USER                      = "c6f82c40-c8c0-11da-14e3-00123f5c9b19";
var REPORT_SEMANTICSCHECK_QUESTIONNAIRE_TEMPLATE    = "27cca360-49e3-11de-5f40-00237de75f8a";
var REPORT_SEMANTICSCHECK_AUDIT_TEMPLATE            = "3571b490-adf2-11e0-09f3-005056c00008";
var REPORT_SEMANTICSCHECK_POLICY_DEFINITION         = "8c0e95e0-6d21-11e1-1b6c-782bcb1f48e1";
 
var OUTPUTFILENAME = Context.getSelectedFile();

var HEADER = "***************************************************************************************\r\n"+
             "***************************************************************************************\r\n\r\n"+
             "      " + getString("TEXT_2")+
             "\r\n\r\n***************************************************************************************\r\n"+
             "***************************************************************************************\r\n\r\n\r\n";

var g_nLoc = Context.getSelectedLanguage();
             
function main() {
    var selection = ArisData.getSelectedGroups();
    if (selection.length == 0) {
        var databases = ArisData.getSelectedDatabases();
        if (databases.length != 0) {
            selection = new Array();
            selection.push(databases[0].RootGroup());
        }
    }
    
    //no selection -> nothing to do
    if (selection.length == 0) {
        return;
    }
    
    //ensure bottom up skip before calling startClassification()
    g_bSkipBottomUpRecursion = true;

    initMappingAndStartClassification();
    
    var reportComponent = Context.getComponent("Report");
    var aPropertyNames = null;
    var szOutput = "";
    
    var reports = new Array( 
                             REPORT_SEMANTICSCHECK_HIERARCHYSTRUCTURE
                             ,REPORT_SEMANTICSCHECK_RISK
                             ,REPORT_SEMANTICSCHECK_CONTROL
                             ,REPORT_SEMANTICSCHECK_TESTDEFINITION
                             ,REPORT_SEMANTICSCHECK_USERGROUP
                             ,REPORT_SEMANTICSCHECK_USER
                             ,REPORT_SEMANTICSCHECK_QUESTIONNAIRE_TEMPLATE
							 ,REPORT_SEMANTICSCHECK_AUDIT_TEMPLATE
                             //,REPORT_SEMANTICSCHECK_POLICY_DEFINITION
                             );
    var displayInfo = new Array( 
                                 "DISPLAY_SC_HIERARCHYSTRUCTURE"
                                 ,"DISPLAY_SC_RISK"
                                 ,"DISPLAY_SC_CONTROL"
                                 ,"DISPLAY_SC_TESTDEFINITION"
                                 ,"DISPLAY_SC_USERGROUP"
                                 ,"DISPLAY_SC_USER"
                                 ,"DISPLAY_SC_QUESTIONNAIRE_TEMPLATE"
                                 ,"DISPLAY_SC_AUDIT_TEMPLATE"
                                 //,"DISPLAY_SC_POLICY_DEFINITION"
                                 );
    
    //in case of mapping errors no sub report execution can be done; output the mapping errors instead
    if (g_aMappingInitMessages.length > 0) {
        szOutput = g_aMappingInitMessages.join("\n");
    }
    //execute the sub reports
    else {
        
        //TODO g_aTopologicalSortingMessages and g_aHierarchyIntersectionMessages shall be added to output by hierarchy semantic report
        
        for (var i=0; i<reports.length; i++) {
            var reportExecInfo = reportComponent.createExecInfo(reports[i], selection, Context.getSelectedLanguage(), Constants.OutputTXT, Context.getSelectedFile());
       
            //set information that report is executed by master report
            reportExecInfo.setProperty("combined_check", "true");
            
            //pass classification results to the sub report context
            reportExecInfo.setProperty("g_aMappingInitMessages", Context.getProperty("g_aMappingInitMessages"));
            reportExecInfo.setProperty("g_aTopologicalSortingMessages", Context.getProperty("g_aTopologicalSortingMessages"));
            reportExecInfo.setProperty("g_aHierarchyIntersectionMessages", Context.getProperty("g_aHierarchyIntersectionMessages"));
            reportExecInfo.setProperty("g_classification_hm_mappingObjectID2exportInfos", Context.getProperty("g_classification_hm_mappingObjectID2exportInfos"));
            reportExecInfo.setProperty("g_classification_hm_parent2children", Context.getProperty("g_classification_hm_parent2children"));
            reportExecInfo.setProperty("g_classification_hm_child2parents", Context.getProperty("g_classification_hm_child2parents"));
            
            //write some execution info for the displayed dialog
            var indexInfo = new java.lang.String(getString("TEXT_3")).replaceFirst("%0", (i+1)).replaceFirst("%1", (displayInfo.length + 1));
            Context.writeStatus(getString(displayInfo[i]) + " (" + indexInfo + ")");
            
            //execute                
            result = reportComponent.execute(reportExecInfo);
    
            //in case of script error abort with error dialog
            if (result.getProperty("exception")) {
                var message = result.getProperty("scriptName") + ":\n" + result.getProperty("exception");
                Dialogs.MsgBox(message, Constants.MSGBOX_ICON_ERROR, getString("TEXT_ERROR_MESSAGE_TITEL.DBT"));
                return;
            }
            
            //add sub report output to overall output
            if ((result.getProperty("reportdata") != null) && (!result.getProperty("reportdata").equals(""))){            
                szOutput += result.getProperty("reportdata") + "\r\n\r\n\r\n";
            }
        }
    }
    
    //output file
    if (szOutput != null) {
        szOutput = HEADER + szOutput;
        writeErrorreport(szOutput, OUTPUTFILENAME);
    }
}             

main();