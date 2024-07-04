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
 * Utilities for the script 'Export item data to tables'
 */

/** 
 * This class is holding the TableObject 
 * With this class you can:
 * - create the table header(mandatory!)
 * - add rows to the table
 * - upload the table object to ARIS ADS
 *
 * @param parameterValueAccess accessor to the script configuration
 * @param itemTypeName name of the ARIS Connect item 
 * @param prefix prefix for the file names in ARIS ADS
 **/
var PropertyPathsOutputData = function(parameterValueAccess, itemTypeName, prefix) 
{
    const m_itemOutputParameters = new PropertyPathsOutputParameters(parameterValueAccess, itemTypeName, prefix);
    const m_itemOutput = createXmlOutput(m_itemOutputParameters);

   /** 
    * Creates the header for the table object
    * @param columns array of names defining the table header
   **/
    this.setColumns = function(columns) 
    {
        m_itemOutput.setColumns(columns);
    }
    
   /** 
    * Adds a row to the table object
    * @param row must have the same size as defined in the setColumns method
   **/
    this.addRow = function(row)
    {
        m_itemOutput.addRow(row);        
    }
   
   /** 
    * Upload the XML table object with the given parameters to ARIS ADS 
    **/
    this.uploadOutputToADS = function()
    {
        uploadXmlOutputToADS(m_itemOutput, m_itemOutputParameters);
    }
}

/** 
 * This class is holding the output parameters used for upload process to ARIS ADS
 * Creates all necessary meta names for ARIS ADS like folder name, file name, document name and document description
 *
 * @param parameterValueAccess accessor to the script configuration
 * @param itemTypeName type name of the item used for the file name
 * @param prefix prefix for the file names in ARIS ADS
 **/
var PropertyPathsOutputParameters = function(parameterValueAccess, itemTypeName, prefix) 
{
    const m_folderName = parameterValueAccess.getParameterValue("TABLE_FOLDER_NAME").getValue();

    var usedPrefix = "";
    if (null != prefix && 0 != prefix.length()) 
    {
        usedPrefix = "_" + prefix;        
    }
    var usedTableName = itemTypeName + usedPrefix + "_PROPERTIES.XML";

	var filePrefix = new java.lang.String(parameterValueAccess.getParameterValue("TABLE_FILE_NAME_PREFIX").getValue());
    var usedFilePrefix = "";
    if (0 != filePrefix.length()) 
    {
        usedFilePrefix = filePrefix.toUpperCase() + "_";        
    }    
    const m_fileName = usedFilePrefix + usedTableName.toUpperCase();
    const m_documentTitle = formatstring1(getString("DOCUMENT_TITLE.DBI"), itemTypeName);
    const m_description = formatstring1(getString("DOCUMENT_DESCRIPTION.DBI"), itemTypeName);
    
   /** 
    * Get the name of the ARIS ADS folder
   **/
   this.getFolderName = function()
    {
        return new java.lang.String(m_folderName);
    }
    
   /** 
    * Get the name of the ARIS ADS file name
   **/
    this.getFileName = function() 
    {
        return new java.lang.String(m_fileName);
    }
    
   /** 
    * Get the title of the ARIS ADS document
   **/
    this.getDocumentTitle = function() 
    {
        return new java.lang.String(m_documentTitle);
    }
    
   /** 
    * Get the description of the ARIS ADS document
   **/
    this.getDescription = function() 
    {
        return new java.lang.String(m_description);
    }
}

/** 
 * This method checks if the last property in the property path value is of type PropertyType.ItemList
 *
 * @param queryConfig interface of type IQueryConfig
 * @param itemType ARIS Connect item 
 * @param propertyList list of property path values
 * @return true if the last property in the property path value is of type PropertyType.ItemList(eg 'functions.roles'),
 * false otherwise
**/
function hasAtLeastOneItemAsProperty(queryConfig, itemType, propertyList)
{
    if (null == propertyList || propertyList.isEmpty())
    {
        return false;
    }
    for (var it = propertyList.iterator(); it.hasNext();) 
    {
        var property = it.next();
        if (isItemProperty(itemType.getValue(), property.getPropertyList(), queryConfig))
        {
            return true;
        }
    }
    return false;        
}
  
/** 
 * Class to create the headers for 1-N relations
**/  
var OneToManyRelationsColumns = function()
{    
    /** 
     * @param queryConfig interface of type IQueryConfig
     * @param itemType ARIS Connect item 
     * @param propertyList list of property path values
     * @return array of strings defining the table header
    **/
    this.getColumns = function(queryConfig, itemType, propertyList) 
    {
        const columns = new java.util.ArrayList();
        columns.add([getString("REFNAME.DBI"),"text"]);
        columns.add([getString("REFGUID.DBI"), "text"]);
        columns.add([getString("PROPERTY_TYPE.DBI"),"text"]);
        columns.add([getString("PROPERTY_VALUE.DBI"), "text"]);
        if (hasAtLeastOneItemAsProperty(queryConfig, itemType, propertyList)) 
        {
            columns.add([getString("PROPERTY_GUID.DBI"), "text"]);
        }
        return columns;
    }   
}

/** 
 * Class to create the headers for 1-1 relations
**/  
var OneToOneRelationsColumns = function()
{
   /** 
    * @param queryConfig interface of type IQueryConfig
    * @param itemType ARIS Connect item 
    * @param propertyList list of property path values
    * @return array of strings defining the property related columns
    **/
    this.getColumnsForProperties = function(queryConfig, itemType, propertyList) 
    {
        var columns = new java.util.ArrayList();
        for (var it = propertyList.iterator(); it.hasNext();) 
        {
            var property = it.next();
            var localizedPropertyPathString = getLocalizedPropertyPathString(itemType.getValue(), property.getPropertyList(), queryConfig);
            columns.add([localizedPropertyPathString, "text"]);
        }        
        return columns;
    }    
    
    /** 
     * @param queryConfig interface of type IQueryConfig
     * @param itemType ARIS Connect item 
     * @param propertyList list of property path values
     * @return array of strings defining the table header
    **/
    this.getColumns = function(queryConfig, itemType, propertyList)
    {
        const columns = new java.util.ArrayList();
        columns.add([getString("NAME.DBI"),"text"]);
        columns.add([getString("GUID.DBI"), "text"]);        
        columns.addAll(this.getColumnsForProperties(queryConfig, itemType, propertyList))
        return columns;
    }
}

/** 
 * This class is holding all table objects 
 *
 * @param queryConfig accessor for the configuration in ARIS Connect(of type IQueryConfig)
 * @param valueAccess accessor to the script configuration
 * @param itemType ARIS Connect item 
 * @param singleProperties 1-1 relation properties
 * @param multipleProperties 1-N relation properties
 **/
var PropertyPathsOutputDataHolder = function(queryConfig, valueAccess, itemType, singleProperties, multipleProperties)
{    
    const oneToOneRelationsColumns = new OneToOneRelationsColumns();
    const m_oneToOneRelationsOutput = new PropertyPathsOutputData(valueAccess, itemType.getValue(), new java.lang.String(""));
    m_oneToOneRelationsOutput.setColumns(toArray(oneToOneRelationsColumns.getColumns(queryConfig, itemType, singleProperties)));
    
    const oneToManyRelationsColumns = new OneToManyRelationsColumns();
    const m_oneToManyRelationsOutput = new PropertyPathsOutputData(m_valueAccess, itemType.getValue(),new java.lang.String("ITEM"));
    m_oneToManyRelationsOutput.setColumns(toArray(oneToManyRelationsColumns.getColumns(queryConfig, itemType, multipleProperties)));
    
    /** 
     * @return the output object for 1-1 relations
    **/
    this.getOneToOneRelationsOutput = function() 
    {
        return m_oneToOneRelationsOutput;
    }
    
    /** 
     * @return the output object for 1-N relations
    **/
    this.getOneToManyRelationsOutput = function() 
    {
        return m_oneToManyRelationsOutput;
    }
    
    /** 
     * Uploads all table objects to ARIS ADS
    **/
    this.uploadOutputToADS = function()
    {
        m_oneToOneRelationsOutput.uploadOutputToADS();
        m_oneToManyRelationsOutput.uploadOutputToADS();
    }    
}

/** 
 * In the case the propertyPath contains e.g. 'functions.roles' we need the result entries for only the 'roles' property.
 * So this method navigates the resultEntry to the last property
 *
 * @param resultEntry entry containing all relevant data for the output
 * @param propertyPath property path value like 'functions.roles'
 * @return array of result entries related to the propertyPath
**/
function getResultEntriesForPropertyPath(resultEntry, propertyPath)
{
    const resultEntries = new java.util.ArrayList();
    var propertyPathList = propertyPath.getPropertyList();
    var currentResultEntryList = java.util.Collections.singletonList(resultEntry);
    for (var j = 0; j < propertyPathList.size(); j++)
    {
        var property = propertyPathList.get(j);
        var isLastPropertyInChain = (j == propertyPathList.size() - 1);
        var newResultEntryList = new java.util.ArrayList();

        for (var k = 0; k < currentResultEntryList.size(); k++) 
        {
            var currentResultEntry = currentResultEntryList.get(k);
            if (null != currentResultEntry) 
            {
                if (!isLastPropertyInChain) 
                {
                    var resultList = currentResultEntry.getProperty(property).getResultList();
                    newResultEntryList.addAll(resultList.getResults());
                } 
                else 
                {
                    resultEntries.addAll(getResultEntriesForProperty(currentResultEntry, property));
                }                    
            }
        }
        currentResultEntryList = newResultEntryList;
        if (null == currentResultEntryList || 0 == currentResultEntryList.size())
        {
            return resultEntries;
        }
    }
    return resultEntries;
}

/** 
 * To get the desired values from the IResult we have two cases:
 * 1. The property is an item list. In this case we can get the name or the guid from the every item
 * 2. The property is an single attribute. In this case we need the IResult to get the property from this entry.
 *
 * @param resultEntry entry containing all relevant data for the output
 * @param property a single property 'roles' or 'description'
 * @return list of all relevant result entries related to the property
**/
function getResultEntriesForProperty(resultEntry, property) 
{
    var propertyResultList = new java.util.ArrayList(); 
    // get the result property of type IResultProperty(for the given property)
    var resultProperty = resultEntry.getProperty(property);
    if (null == resultProperty) 
    {
        // return empty list
        return propertyResultList;
    }
    if (resultProperty.isResultList()) 
    {
        // In the case the result property itself is a IResultList than navigate!
        var resultList = resultProperty.getResultList();
        if (null == resultList)
        {
            // return empty list
            return propertyResultList;
        }
        var allResultsList = resultList.getResults();
        propertyResultList.addAll(allResultsList);
        return propertyResultList;
    }
    // If the result entry if not from type IResultList then we have a simple property and so we need the parent result entry to get the proper property!
    propertyResultList.add(resultEntry);
    return propertyResultList;
}


/** 
 * Helper method to get property definitions for a given item property
 *
 * @param queryConfig accessor for the configuration in ARIS Connect(of type IQueryConfig)
 * @param itemType ARIS Connect item
 * @param property property to get the definitions for
 * @return set of type IProperty
**/
function getPropertyDefinitions(queryConfig, itemType, property)
{
    const itemTypeDefinition = queryConfig.getItemTypeDefinition(itemType);
    if (null == itemTypeDefinition) 
    {
        return null;
    }
    const propDefSet = itemTypeDefinition.getPropertyDefs(property);
    return propDefSet;        
}


/** 
 * This class is holding the information for 1-1 and 1-N relation properties
 *
 * @param queryConfig accessor for the configuration in ARIS Connect(of type IQueryConfig)
 * @param itemType ARIS Connect item
 * @param propertyPathList list of property paths values
 **/
var PropertyPathsPropertiesHolder = function(queryConfig, itemType, propertyPathList) 
{
    /** 
     * Helper method to evaluate if the given propDefSet contains only 1-1 relation properties
     *
     * @param propDefSet set of type IProperty
    **/
    this.isSingleProperty = function(propDefSet)
    {
        if (1 < propDefSet.size())
        {
            return false;
        }
        const firstProp = propDefSet.iterator().next();
        const propType = firstProp.getPropertyType();
        return Constants.QUERY_PROPERTYTYPE_ITEMLIST != propType;
    }

    /** 
     * Splits the list of properties for 1-1 and 1-N relations 
     *
     * @param itemType ARIS Connect item
     * @param valueList list of property paths values
    **/
    this.splitProperties = function(itemType, valueList)
    {
        for (var propIter = valueList.iterator(); propIter.hasNext();)
         {
            // getting the property path value 
            var property = propIter.next();
            var definingProperties = property.getPropertyList();
            if (definingProperties.size() > 1)
            {
                m_oneToManyRelationsProperties.add(property);
                continue;
            }
            var propDefSet = getPropertyDefinitions(queryConfig, itemType, property);
            if (null != propDefSet && 0 != propDefSet.size())
            {
                if (this.isSingleProperty(propDefSet))
                {
                    m_oneToOneRelationsProperties.add(property);
                }
                else
                {
                    m_oneToManyRelationsProperties.add(property);
                }        
            }
        } 
    }

    const m_propertyPathList = propertyPathList;
    
    const m_oneToOneRelationsProperties = new java.util.ArrayList();
    const m_oneToManyRelationsProperties = new java.util.ArrayList();

    const m_itemType = itemType;
    
    this.splitProperties(itemType, propertyPathList);
    
    /** 
     * @return list of property path values
    **/
    this.getPropertyPathValueList = function()
    {
        return m_propertyPathList;        
    }

    /** 
     * @return list of 1-1 relation properties
    **/
    this.getOneToOneRelationsProperties = function()
    {
        return m_oneToOneRelationsProperties;        
    }
    
    /** 
     * @return list of 1-N relation properties
    **/
    this.getOneToManyRelationsProperties = function()
    {
        return m_oneToManyRelationsProperties;        
    }
}