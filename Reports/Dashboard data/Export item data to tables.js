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
 * Report for creating table data based on ARIS Connect item properties.
 * These item properties are defined as property paths in the report configuration
 *
 * The report creates two tables for each ARIS Connect item: the first one for 1-1 relations and the second one for 1-N relations
 */

/** 
 * Definition of global variables
**/ 
const m_queryComponent = Context.getComponent("QueryComponent");
const m_queryContext = m_queryComponent.getQueryContext(ArisData.getActiveDatabase());
const m_queryConfig = m_queryContext.getConfig();

const propertyPathKey = "EXPORTED_ITEM_TYPE_PROPERTIES";
const m_valueAccess = Context.getParameterValueAccess();

// Start the script
evaluatePropertyPaths();

/** 
 * Main algorithm to create table objects for the given script configuration
**/
function evaluatePropertyPaths()
{
    const propertyPaths = m_valueAccess.getParameterValue(propertyPathKey);
    
    // To avoid unnecessary caches start the algorithm for every item type
    for (var it = propertyPaths.getKeyList().iterator(); it.hasNext();)
     {
        var itemType = it.next();
        var propertyList = propertyPaths.getValue(itemType);
        if (null != itemType && null != propertyList) 
        {
            var propertyPathList = propertyList.getValueList();
            // Create data container for the properties
            var propertyPathsPropertiesHolder = new PropertyPathsPropertiesHolder(m_queryConfig, itemType, propertyPathList); 

            // Create item type related output object
            var itemTypeOutputData = createOutputObjectForItemType(itemType, propertyPathsPropertiesHolder);

            // Load all query results for the item/properties
            var itemTypeQueryResults = loadQueryResultsForPropertyPaths(itemType, propertyPathsPropertiesHolder);

            // Create table objects from data
            processResultList(itemType, propertyPathsPropertiesHolder, itemTypeOutputData, itemTypeQueryResults);

            // Cleanup and upload of the table objects to ARIS ADS
            finish(itemTypeOutputData);
        }
    } 
}

/** 
 * Load for the given item item properties the data from the server 
 * @param itemType ARIS Connect item type
 * @param propertyPathsPropertiesHolder container for the properties
 * @return a list of query results
**/
function loadQueryResultsForPropertyPaths(itemType, propertyPathsPropertiesHolder)
{ 
    var propertyList = propertyPathsPropertiesHolder.getPropertyPathValueList();
    var propertyTree = buildPropertyTree(itemType, propertyList);     
    var itemTypeQueryResults = executeQuery(m_queryContext, itemType, propertyTree);
    return itemTypeQueryResults;
}

/** 
 * Create a string from the given properties used as a query string for the query component
 * @param itemType ARIS Connect item type
 * @param properties list of propertyPathValues 
 * @return the string for the query component
**/
function buildPropertyTree(itemType, properties)
{
    var propertyTree = new java.lang.StringBuilder();
    propertyTree.append("name");
    for(var i = 0; i < properties.size(); i++)
    {
        propertyTree.append(", ");
        var property = properties.get(i);
        var queryString = property.getQueryString();
        propertyTree.append(queryString);
        if (isItemProperty(itemType.getValue(), property.getPropertyList(), m_queryConfig) && 
            !queryString.endsWith(".name"))
        {
            propertyTree.append(", " + queryString + ".name");
        }            
    }
    return propertyTree.toString();
}

/** 
 * Fetch data from server
 * @param queryContext interface of type IQueryContext to fetch the data from the server
 * @param itemType ARIS Connect item type
 * @param propertyTree query string
 * @return list of query results
**/
function executeQuery(queryContext, itemType, propertyTree)
{
    var query = queryContext.createQuery(itemType, propertyTree);
    var resultList = query.execute();
    return resultList;
}

/** 
 * Create table object for ARIS ADS
 * @param itemType ARIS Connect item type
 * @param propertyPathsPropertiesHolder holder of the item related properties
 * @return holder for the output objects
**/
function createOutputObjectForItemType(itemType, propertyPathsPropertiesHolder)
{
    var singleProperties = propertyPathsPropertiesHolder.getOneToOneRelationsProperties();
    var multipleProperties = propertyPathsPropertiesHolder.getOneToManyRelationsProperties();
    var dataHolder = new PropertyPathsOutputDataHolder(m_queryConfig, m_valueAccess, itemType, singleProperties, multipleProperties);
    return dataHolder;
}

/** 
 * Create rows for the given query results
 * At the end the query results will be released
 * 
 * @param itemType ARIS Connect item type
 * @param propertyPathsPropertiesHolder holder of the item related properties
 * @param itemTypeOutputData table object
 * @param itemTypeQueryResults list of query results
**/
function processResultList(itemType, propertyPathsPropertiesHolder, itemTypeOutputData, itemTypeQueryResults)
{
    const resultCount = itemTypeQueryResults.size();
    for(var i = 0; i < resultCount; i++)
    {
        var resultEntry = itemTypeQueryResults.get(i);
        processingResultEntry(itemType, propertyPathsPropertiesHolder, itemTypeOutputData, resultEntry);
    }
    for(var i = 0; i < resultCount; i++)
    {
        var resultEntry = itemTypeQueryResults.get(i);
        processingResultFinished(resultEntry);
    }
}

/** 
 * Create rows for 1-1 related properties and the given query results
 * 
 * @param itemType ARIS Connect item type
 * @param itemSingleProperties 1-1 relation properties
 * @param itemOutput table object
 * @param resultEntry a single query results
**/
function processSingleProperties(itemType, itemSingleProperties, itemOutput, resultEntry)
{
    if (null == itemSingleProperties ||
        null == resultEntry)
    {
        return;
    }
    const values = new java.util.ArrayList();
    var itemName = getStringValue(resultEntry, "name");
    values.add(itemName);
    var itemGuid = resultEntry.getGuid();
    values.add(itemGuid);
    
    for (var iter = itemSingleProperties.iterator(); iter.hasNext();) 
    {
        var singleProperty = iter.next();
        var value = getStringValue(resultEntry, singleProperty);
        values.add(value);
    }
    itemOutput.getOneToOneRelationsOutput().addRow(toArray(values));    
}

/** 
 * Create rows for 1-N related properties and the given query results
 * 
 * @param itemType ARIS Connect item type
 * @param itemMultipleProperties 1-N relation properties
 * @param itemOutput table object
 * @param resultEntry a single query results
**/
function processMultipleProperties(itemType, itemMultipleProperties, itemOutput, resultEntry)
{
    if (null == itemMultipleProperties ||
        0 == itemMultipleProperties.size() ||
        null == resultEntry)
    {
        return;
    }
    const refName = resultEntry.getName();
    const refGuid = resultEntry.getGuid();
    
    const allResultProperties = new java.util.HashMap();
    const hasItemProperty = hasAtLeastOneItemAsProperty(m_queryConfig, itemType, itemMultipleProperties);
    for (var iter = itemMultipleProperties.iterator(); iter.hasNext();) 
    {
        var multipleProperty = iter.next();
        var propertyList = multipleProperty.getPropertyList();
        var isSimpleProperty = !isItemProperty(itemType.getValue(), propertyList, m_queryConfig);
        var localizedPropertyPathString = getLocalizedPropertyPathString(itemType, propertyList, m_queryConfig);

        var allResultEntriesForProperty = getResultEntriesForPropertyPath(resultEntry, multipleProperty);
        for (var entryIter = allResultEntriesForProperty.iterator(); entryIter.hasNext();) 
        {
            var entry = entryIter.next();
            var row = new java.util.ArrayList();
            row.add(refName);
            row.add(refGuid);
            row.add(localizedPropertyPathString);
            
            var itemProperty = "";
            if (isSimpleProperty)
            {
                var propToUse = propertyList.get(propertyList.size()-1);
                itemProperty = getStringValue(entry, propToUse);
            }
            else 
            {
                itemProperty = getStringValue(entry, "name");
            }
            row.add(itemProperty);
            
            if (hasItemProperty)
            {
                var itemGUID =  isSimpleProperty ? "" : entry.getGuid();
                row.add(itemGUID);
            }
            itemOutput.getOneToManyRelationsOutput().addRow(toArray(row));    
        }
    }
}

/** 
 * Create rows for 1-1 and 1-N related properties and the given query result
 * 
 * @param itemType ARIS Connect item type
 * @param propertyPathsPropertiesHolder holder for properties
 * @param itemTypeOutputData table object
 * @param resultEntry a single query results
**/
function processingResultEntry(itemType, propertyPathsPropertiesHolder, itemTypeOutputData, resultEntry)
{
    if(null == resultEntry || null == itemType)
    {
        return;
    }
    resultEntry.loadAll(true);
    processSingleProperties(itemType, propertyPathsPropertiesHolder.getOneToOneRelationsProperties(), itemTypeOutputData, resultEntry);
    processMultipleProperties(itemType, propertyPathsPropertiesHolder.getOneToManyRelationsProperties(), itemTypeOutputData, resultEntry);
}


/** 
 * Release fetched server data
 * 
 * @param resultEntry a single query results
**/
function processingResultFinished(resultEntry)
{
    if(null == resultEntry)
    {
        return;
    }
    resultEntry.releaseData();
}

/** 
 * Upload the table object to ARIS ADS
 * 
 * @param itemTypeOutputData data to upload to ARIS ADS
**/
function finish(itemTypeOutputData)
{
    itemTypeOutputData.uploadOutputToADS();
}