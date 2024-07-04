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
 * Object which collects the representive objects for items in the connect hierarchy
 */
var UseCaseRepresentativeObjects = function() 
{
    const REPRESENTATIVEOBJECTS_PROPERTIES = "RepresentativeObjects_Properties";

    const m_valueAccess = Context.getParameterValueAccess();

    const m_representativeObjectsProperties = m_valueAccess.getParameterValue(REPRESENTATIVEOBJECTS_PROPERTIES);

    const m_itemTypesWithReferenceProperties = new java.util.HashMap();
    for(var it = m_representativeObjectsProperties.getKeyList().iterator(); it.hasNext();) 
    {
        var itemTypeValue = it.next();
        m_itemTypesWithReferenceProperties.put(itemTypeValue.getValue(), itemTypeValue);
    }
    
    const m_representativeObjectsOutputParameters = new OutputParameters("RepresentativeObjects");

    var m_representativeObjectsOutput = createXmlOutput(m_representativeObjectsOutputParameters);
    m_representativeObjectsOutput.setColumns
    ([
        ["SOURCE_GUID","text"],
        ["TARGET_GUID", "text"],
    ]);

    /**
     * Returns properties which are required by this use case
     * sQuery - Name of the query ("chain" or "process") (JavaScript String)
     * return - Array of Strings (JavaScript String) with the property names
     */
    this.getPropertyTree = function(sQuery)
    {
        const allProperties = new java.util.ArrayList();
        allProperties.add("name");

        const itemType = new java.lang.String(sQuery);
        const referenceProperties = m_representativeObjectsProperties.getValue(m_itemTypesWithReferenceProperties.get(itemType));
        if(referenceProperties != null)
        {
            allProperties.addAll(referenceProperties.getValueList());
        }
         
        return toArray(allProperties);
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

        var sourceGuid = item.getGuid();
        if(sourceGuid == null)
        {
            return "";
        }
        
        var referenceProperties = m_representativeObjectsProperties.getValue(m_itemTypesWithReferenceProperties.get(sItemType));
        if(referenceProperties == null)
        {
            return "";
        }
        
        for(var itReferenceProperty = referenceProperties.getValueList().iterator(); itReferenceProperty.hasNext();)
        {
            var referenceProperty = itReferenceProperty.next();
            writeSourceAndTargetGuids(item, sourceGuid, referenceProperty);
        }
        
        return "";
    }
    
    function writeSourceAndTargetGuids(item, sourceGuid, referenceProperty)
    {
        var referencedItems = item.getProperty(referenceProperty)
        if(referencedItems == null)
        {
            return;
        }

        if(referencedItems.getType() != Constants.QUERY_PROPERTYTYPE_ITEMLIST || !referencedItems.isResultList())
        {
            return;
        }

        var itemList = referencedItems.getResultList();
        for(var itItems = itemList.iterator(); itItems.hasNext();)
        {
            var targetItem = itItems.next();
            var targetGuid = targetItem.getGuid();

            m_representativeObjectsOutput.addRow([sourceGuid, targetGuid]);
        }
    }

    /**
     * Called when the calculations are finished
     */    
    this.finish = function()
    {
        uploadXmlOutputToADS(m_representativeObjectsOutput, m_representativeObjectsOutputParameters);
    }
}
