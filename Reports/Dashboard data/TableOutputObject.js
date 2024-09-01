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

//
// provides 2 output objects:
// XMLOutputObject
// JSONOutputObject
//
// methods: 
// - constructor (no parameters)
// - setColumns(column array)
// - addRow(row items array) //items of 1 row, must have same size as |column array|
// - writeReport()
/** example
//var sampleOutput = new XMLOutputObject()
var sampleOutput = new JSONOutputObject()
sampleOutput.setColumns([["id","number"], ["name", "text"]]) //array: [name, type] valid values for type: "number", "text", "date"
sampleOutput.addRow(["1234567890", "my first name"])
sampleOutput.addRow(["0987654321", "my second name"])
sampleOutput.writeReport()
*/

// 2016-05-31 Additional parameter 'p_sFileName' added

var XMLOutputObject = function(p_sFileName, p_bUseSimpleFormat) {

    //private property
    var m_bUseSimpleFormat = p_bUseSimpleFormat
    var m_sFileName = p_sFileName
    
    Context.setSelectedFormat(Constants.OutputXML)
    var m_output = Context.createXMLOutputObject(p_sFileName, "amzresult")
    m_output.setEncoding("UTF-8")

    //private property
    var m_eRoot = m_output.getRootElement() 
    
    //private property
    var m_eHeader = null;
    if(!m_bUseSimpleFormat)
        m_eHeader = m_output.addElement(m_eRoot, "metainfos");
    
    //private property
    var m_eData = m_output.addElement(m_eRoot, "data");
    
    //private property
    var m_aColumnNames;
    var m_aDatatypes;

    this.setColumns = function(aColumns)
    {
        m_aColumnNames = new Array();
        m_aDatatypes   = new Array();
        
        var eColumns = null;
        if (!m_bUseSimpleFormat)
            eColumns = m_output.addElement(m_eHeader, "columns");

        for(var i=0; i<aColumns.length; i++)
        {
            m_aColumnNames.push(aColumns[i][0]);
            m_aDatatypes.push(aColumns[i][1]);
            
            if (!m_bUseSimpleFormat) {
                var eColumn = m_output.addElement(eColumns, "column");
                eColumn.setAttribute("idx", ""+i);
                eColumn.setAttribute("datatype", aColumns[i][1]);
                eColumn.setAttribute("name", aColumns[i][0]);
                eColumn.setText(aColumns[i][0]);
            }
        }
        
        if(!m_bUseSimpleFormat)
        {
            var eParameters = m_output.addElement(m_eHeader, "parameters");
            var eParameter = m_output.addElement(eParameters, "parameter");
            eParameter.setAttribute("datatype", "TEXT");
            eParameter.setText("param");
        }
    }
    
    this.addRow = function(aCellValues)
    {
        if(aCellValues.length != m_aColumnNames.length)
            throw "addRow: Incorrect column count " + aCellValues.length + ". Should be " + m_aColumnNames.length
        
        var eRow = m_output.addElement(m_eData, "row");
        for(var i=0; i<aCellValues.length; i++)
        {
            var eText;
            if(m_bUseSimpleFormat)
            {
                var sElementName = m_aColumnNames[i]
                while(sElementName.indexOf(" ")>=0)
                    sElementName = sElementName.replace(" ", "-")    
                eText = m_output.addElement(eRow, sElementName);
            }
            else
                eText = m_output.addElement(eRow, m_aDatatypes[i]);
            
            eText.setAttribute("idx", ""+i);
            eText.setText(aCellValues[i]);
        }
    }
    
    this.writeReport = function() {
        m_output.WriteReport()
    }    
    
    this.getFileName = function() {
        return m_sFileName;
    }    

    this.getRootElement = function() {
        return m_eRoot;
    }
    
    this.cloneHeader = function() {
        // Can fail when simple format is used because then there is
        // no header
        return m_eHeader.clone();
    }
    
    this.getContentAsByteArray = function() {
        return m_output.getDocumentContent();
    }
}

var JSONOutputObject = function() {
    
    Context.setSelectedFile("result.json")
    Context.setSelectedFormat(Constants.OutputTXT)
    //private property
    var m_output = Context.createOutputObject()

    //private property
    var m_columns
    this.setColumns = function(aColumns)
    {
        m_columns = new Array()
        for(var i=0; i<aColumns.length; i++)
        {
            m_columns.push(aColumns[i][0])
        }
    }
    this.getColumns = function()
    {
        return m_columns;
    }
    
    //private property
    var m_rows = new Array()
    this.addRow = function(aCellValues)
    {
        m_rows.push(aCellValues)
    }
    
    this.writeReport = function() {
        var result = {"columns" : m_columns, "rows" : m_rows}
        m_output.OutputTxt ( JSON.stringify(result) ) 
        m_output.WriteReport()
    }
}
