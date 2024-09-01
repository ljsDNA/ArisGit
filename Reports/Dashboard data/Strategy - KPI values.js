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

const outputParameters = new OutputParameters("");
const xOutput = createXmlOutput(outputParameters);

var nLocale = Context.getSelectedLanguage();
var aDatabases = ArisData.getActiveDatabase();
    
main();

/*************************************************************************************************/

//------functions------
function main()
{
    outHeader();
    readDatabase();
    uploadXmlOutputToADS(xOutput, outputParameters);
}

/**
**  Function to read models from the database
**  @return void
**/
function readDatabase()
{
    var aModels = aDatabases.Find(Constants.SEARCH_MODEL, [Constants.MT_KPI_ALLOC_DGM]);
    for (var i in aModels) 
    {
        getArisAttributes(aModels[i]);
    }  
}

/**
**  Function to search for KPI object in the model
**  @return void
**/
function getArisAttributes(oModel)
{
    var allOccs = oModel.ObjOccList();

    for(var i in allOccs) 
    {
        var curOcc = allOccs[i];
        var curObj = curOcc.ObjDef();
        
        if(curObj.TypeNum() == Constants.OT_KPI)
        {
            getKpiValue(curObj, oModel);
        } 
    }
}

/**
**  Function for reading the KPI attributes and output to an XML in ADS
**  @return void
**/
function getKpiValue(oKPI, oModel)
{
    var actVal = getKpiValue(Constants.AT_ACT_VAL);
    var plVal = getKpiValue(Constants.AT_PL_VAL);
    var preVal = getKpiValue(Constants.AT_PREVIOUS_VALUE);
    var tol = getKpiValue(Constants.AT_VAL_TOL);
    
    xOutput.addRow([oKPI.Name(nLocale), oKPI.GUID(),actVal, plVal, preVal, tol, oModel.GUID()]);
    
    function getKpiValue(nAttrType)
    {
         var oAttr = oKPI.Attribute(nAttrType, nLocale);
         if (!oAttr.IsMaintained()) return "";
         return oAttr = oAttr.getValue();
    }
}

/**
**  Function to set the columns of the xml file
**  @return void
**/
function outHeader()
{
     xOutput.setColumns([
                       ["KPI name","text"],
                       ["KPI GUID","text"],
                       ["KPI actual value", "number"],
                       ["KPI plan value", "number"],
                       ["KPI previous value", "number"],
                       ["KPI tol value", "number"],
                       ["Model GUID", "text"]
                       ]);   
}