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

/**
 * Object which performs the calculation for one QMS usecase
 */
var UseCaseConventions = function(queryConfig) 
{
    const SEMANTICS_CHECK_GUID = "Conventions_SemanticCheckID";
    const ITEM_PROPERTIES = "Conventions_Properties";

    const m_valueAccess = Context.getParameterValueAccess();
    const m_semanticsCheckGuid = m_valueAccess.getParameterValue(SEMANTICS_CHECK_GUID);
    const m_properties = m_valueAccess.getParameterValue(ITEM_PROPERTIES);

    const m_outputParameters = new OutputParameters("Conventions");
    const m_output = createXmlOutput(m_outputParameters);
    m_output.setColumns(getOutputColumns(queryConfig));
    
    const reportComponent = Context.getComponent("Report");
    const language = Context.getSelectedLanguage();

    function getOutputColumns(queryConfig) 
    {
        const columns = new java.util.ArrayList();
        
        columns.add([getString("NAME.DBI"),"text"]);
        columns.add([getString("GUID.DBI"), "text"]);
        columns.add([getString("SEMANTIC_CHECK_RESULT.DBI"), "number"]);
        
        var itemTypes = m_valueAccess.getParameterValue("ItemTypes");
        
        for (var it = m_properties.getValueList().iterator(); it.hasNext();) 
        {
            var property = it.next();
            var localizedPropertyName = getLocalizedPropertyName(property, itemTypes, queryConfig);
            columns.add([localizedPropertyName, "text"]);
        }
        
        return toArray(columns);
    }
        
    /**
     * Returns properties which are required by this use case
     * sQuery - Name of the query ("chain" or "process") (JavaScript String)
     * return - Array of Strings (JavaScript String) with the property names
     */
    this.getPropertyTree = function(sQuery)
    {
        const resultList = new java.util.ArrayList();
        resultList.add("name");
        resultList.addAll(m_properties.getValueList())
        return toArray(resultList);
    }
    
    //todo needed?
    function getOutputColumnType(attributeTypeValue) 
	{
        if (isDate(attributeTypeValue)) 
		{
            return "date";
        }
        
        if (isNumber(attributeTypeValue)) 
		{
            return "number";
        }
        
        return "text";
    }

    //todo adapt or remove
    function isDate(attributeTypeValue) 
	{
        const attrTypeNum = getAttributeTypeNum(attributeTypeValue);
        
        const methodFilter = ArisData.getActiveDatabase().ActiveFilter();
        const baseType = methodFilter.AttrBaseType(attrTypeNum);

        return (baseType == Constants.ABT_DATE) || (baseType == Constants.ABT_TIME);
    }
    
    //todo adapt or remove
    function isNumber(attributeTypeValue) {
        const attrTypeNum = getAttributeTypeNum(attributeTypeValue);
        
        const methodFilter = ArisData.getActiveDatabase().ActiveFilter();
        const baseType = methodFilter.AttrBaseType(attrTypeNum);

        return (baseType == Constants.ABT_FLOAT) || (baseType == Constants.ABT_INTEGER);
    }
    
    this.processNodeList = function(nodeList)
    {
        var semanticCheckResult = execSemanticCheck(nodeList);

        for(var itNodes = nodeList.iterator(); itNodes.hasNext();)
        {
            var node = itNodes.next();
            processNode(node, semanticCheckResult);
        }
    }
    
    function processNode(node, semanticCheckResult)
    {
        var item = node.getItem()
        item.loadAll();
        
        var name = getStringValue(item, "name");
        var sGuid = item.getGuid();
        var sSemanticCheckResult = getSemanticCheckResult(semanticCheckResult, sGuid);

        const values = new java.util.ArrayList();
        
        values.add(name);
        values.add(sGuid);
        values.add(sSemanticCheckResult);
        
        for (var it = m_properties.getValueList().iterator(); it.hasNext();) 
        {
            var property = it.next();
            values.add(getStringValue(item, property));
        }

        m_output.addRow(toArray(values));
    }
    
    function getStringValue(item, whichOne)
    {
        var value = item.getProperty(whichOne).getString();
        if(value == null) 
        {
            value = new java.lang.String("");
        }
        value = value.replaceAll("\r\n", " ");
        value = value.replaceAll("\r", " ");
        value = value.replaceAll("\n", " ");    
        
        return value;
    }

    function getDateValue(item, whichOne)
    {
        var date = item.getProperty(whichOne).getDate();
        if(date == null)
        {
            return null;
        }
        
        var dateFormat = new java.text.SimpleDateFormat("yyyy-MM-dd")
        return dateFormat.format(date)
    }

    function execSemanticCheck(nodeList)
    {
        var arisModels = new Array();
        for(var itNodes = nodeList.iterator(); itNodes.hasNext();)
        {
            var node = itNodes.next();

            var sType = node.getItemType();
            var item = node.getItem()
            var arisModel = item.getObject();
            arisModels.push(arisModel);
        }
        
        var semanticCheckInfo = reportComponent.createSemCheckExecInfo(
        m_semanticsCheckGuid, 
        arisModels, 
        language,
        Constants.OUTTEXT,
        "TEMP_OUTPUT.TXT",
        "");
        
        var semanticCheckResult = reportComponent.execute(semanticCheckInfo);
        return semanticCheckResult;
    }

    function getSemanticCheckResult(semanticCheckResult, guid)
    {    
        var hasError = semanticCheckResult.getProperty(guid);
        if(hasError == "1")
        {
            return "1";
        }
        
        return "0";
    }    
        
    /**
     * Called when the calculations are finished
     */    
    this.finish = function()
    {
        uploadXmlOutputToADS(m_output, m_outputParameters);
    }
}
