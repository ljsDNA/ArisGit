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

var MODEL_AGE_LT_1_MONTH = 0;
var MODEL_AGE_1_TO_3_MONTHS = 1;
var MODEL_AGE_3_TO_12_MONTHS = 2;
var MODEL_AGE_GT_ONE_YEAR = 3;
var MODEL_AGE_UNKNOWN = 4;

var MODEL_AGE_GROUPS_COUNT = 5;

var MODEL_AGE_STRINGS = 
[
    getString("MODEL_AGE_LT_1_MONTH.DBI"),
    getString("MODEL_AGE_1_TO_3_MONTHS.DBI"),
    getString("MODEL_AGE_3_TO_12_MONTHS.DBI"),
    getString("MODEL_AGE_GT_ONE_YEAR.DBI"),
    getString("MODEL_AGE_UNKNOWN.DBI"),
];

/**
 * Object which performs the calculation for one QMS usecase
 */
var UseCaseModelAge = function() 
{
    const ITEM_TYPES = "ModelAge_ItemTypes";
    const LAST_CHANGE_PROPERTY = "ModelAge_LastChangeProperty";

    const m_valueAccess = Context.getParameterValueAccess();
    const m_lastChangeProperty = m_valueAccess.getParameterValue(LAST_CHANGE_PROPERTY);
    const m_itemTypesToEvaluate = m_valueAccess.getParameterValue(ITEM_TYPES);

    const m_outputParameters = new OutputParameters("ModelAge");

    var m_output = createXmlOutput(m_outputParameters);
    m_output.setColumns([
        [getString("NAME.DBI"),"text"],
        [getString("GUID.DBI"), "text"],
        [getString("MODEL_AGE.DBI"), "text"],
        [getString("MODEL_COUNT.DBI"), "number"],
    ]);
    
    /**
     * Returns properties which are required by this use case
     * sQuery - Name of the query ("chain" or "process") (JavaScript String)
     * return - Array of Strings (JavaScript String) with the property names
     */
    this.getPropertyTree = function(sQuery)
    {
        if(containsStringValue(m_itemTypesToEvaluate, sQuery))
        {
            return ["name", m_lastChangeProperty];
        }

        return ["name"];
    }
    
    var ModelAgeCounter = function()
    {
        var m_modelCountByAge = [0, 0, 0, 0, 0];
        
        this.countModel= function(modelAge)
        {
            m_modelCountByAge[modelAge]++;
        }

        this.aggregateModelCounter = function(modelAgeCounter)
        {
            for(i= 0; i < MODEL_AGE_GROUPS_COUNT; i++)
            {
                m_modelCountByAge[i] = m_modelCountByAge[i] + modelAgeCounter.getModelCount(i);
            }
        }
        
        this.getModelCount = function(modelAge)
        {
            return m_modelCountByAge[modelAge];
        }
    }
    
    /**
     * Performs calculation for one data node, called when the data tree is travesed.
     * For details see TreeGraph.traverse();
     *
     * The provide node has as item a result object of the data query
     */
    this.processNode = function(node, childResults)
    {
        var item = node.getItem()
        var sItemType = node.getItemType();

        var aggregatedModelAges = new ModelAgeCounter();

        if(containsStringValue(m_itemTypesToEvaluate, sItemType))
        {
            var modelAge = getModelAge(item);
            aggregatedModelAges.countModel(modelAge);
        }

        aggregateModelAges(aggregatedModelAges, node, childResults);
        writeModelAges(item, aggregatedModelAges);
        
        return aggregatedModelAges;
    }

    function aggregateModelAges(aggregatedModelAges, node, childResults)
    {
        var children = node.getChildren();
        for(var itChildren = children.iterator(); itChildren.hasNext();)
        {
            var childNode = itChildren.next();
            var childResult = childResults.get(childNode);
            aggregatedModelAges.aggregateModelCounter(childResult);
        }
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

    function getModelAge(modelItem)
    {
        var propertyLastChange = modelItem.getProperty(m_lastChangeProperty).getDate();
        if(propertyLastChange == null)
        {
            return MODEL_AGE_UNKNOWN;
        }

        var lastChange = new Date(propertyLastChange.getTime());    
        var monthLastChange = lastChange.getFullYear() * 12 + lastChange.getMonth();

        var today = new Date();
        var monthToday = today.getFullYear() * 12 + today.getMonth();
        
        if(monthToday < monthLastChange)
        {
            //Last change is in future
            return MODEL_AGE_LT_1_MONTH;
        }

        var ageInMonths = monthToday - monthLastChange;
        
        var dayOfLastChange = lastChange.getDate();
        var dayOfToday = today.getDate();
        
        if(dayOfLastChange > dayOfToday)
        {
            ageInMonths--;
        }
        
        if(ageInMonths <= 0)
        {
            return MODEL_AGE_LT_1_MONTH;
        }
        if(ageInMonths < 3)
        {
            return MODEL_AGE_1_TO_3_MONTHS;
        }
        if(ageInMonths < 12)
        {
            return MODEL_AGE_3_TO_12_MONTHS;
        }
           
        return MODEL_AGE_GT_ONE_YEAR;
    }

    function writeModelAges(item, aggregatedModelAges)
    {
        var sName = getStringValue(item, "name");
        var sGuid = item.getGuid();
        
        for(i = 0; i < MODEL_AGE_GROUPS_COUNT - 1; i++)
        {
            var nModelCount = aggregatedModelAges.getModelCount(i);
            if(nModelCount > 0 || i != MODEL_AGE_UNKNOWN)
            {
                var sModelAge = MODEL_AGE_STRINGS[i];
                m_output.addRow([sName, sGuid, sModelAge, nModelCount]);
            }
        }
    }
    
    /**
     * Called when the calculations are finished
     */    
    this.finish = function()
    {
        uploadXmlOutputToADS(m_output, m_outputParameters);
    }
}
