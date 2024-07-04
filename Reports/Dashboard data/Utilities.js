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

function toArray(collection) {
    const array = new Array(collection.size());
    const it = collection.iterator();
    
    for (var i = 0; i < array.length; i++) {
        array[i] = it.next();
    }
    
    return array;
}

function createOutputObject(parameterKey) {
    const outputObjectName = Context.getParameterValueAccess().getParameterValue(parameterKey);
    const outputObject = new XMLOutputObject(outputObjectName, false);
    return outputObject;
}

function getAttributeTypeNum(arisTypeValue) {
    
    if (!arisTypeValue.isUserDefined()) {
        return arisTypeValue.getTypeNumber();
    }
    
    const methodFilter = ArisData.getActiveDatabase().ActiveFilter();
    const typeNum = methodFilter.UserDefinedAttributeTypeNum(arisTypeValue.getTypeGuid().toString());
    return typeNum;
}

function containsStringValue(parameterValueList, stringValue)
{
    var valueAsJavaString = new java.lang.String(stringValue);
    for(var itValues = parameterValueList.getValueList().iterator(); itValues.hasNext();)
    {
        var value = itValues.next();
        if(value.getValue().equals(valueAsJavaString))
        {
            return true;
        }
    }
    
    return false;
}

function getLocalizedPropertyName(propertyName, itemTypeListValue, queryConfig) {
    var itemTypeValueList = itemTypeListValue.getValueList();
    
    for (var it = itemTypeValueList.iterator(); it.hasNext();) {
        var itemTypeValue = it.next();
        var itemTypeDefinition = queryConfig.getItemTypeDefinition(itemTypeValue.getValue());
        
        if (itemTypeDefinition == null) {
            continue;
        }
        
        var propertyDefinitions = itemTypeDefinition.getPropertyDefs(propertyName);
        
        if ((propertyDefinitions == null) || propertyDefinitions.isEmpty()) {
            continue;
        }
        
        for (var it2 = propertyDefinitions.iterator(); it2.hasNext();) {
            var propertyDefinition = it2.next();
            var localizedPropertyName = propertyDefinition.getLocalizedName();
            
            if (localizedPropertyName != null) {
                return localizedPropertyName;
            }
        }        
    }
    
    return propertyName;
}

function getLocalizedPropertyPathString(itemTypeName, propertyNameList, queryConfig) {
    const propertyDefinitionList = getPropertyDefinitionList(itemTypeName, propertyNameList, queryConfig);
    
    var localizedPropertyPathString = buildPropertyPathString(propertyDefinitionList, ".");
    return localizedPropertyPathString;
}

function buildPropertyPathString(propertyDefinitionList, separator) {
    var stringBuilder = new java.lang.StringBuilder();
    
    for (var i = 0; i < propertyDefinitionList.size(); i++) {
        stringBuilder.append(propertyDefinitionList.get(i).getLocalizedName());
        
        if (i < propertyDefinitionList.size() - 1) {
            stringBuilder.append(separator);
        }
    }    
    return stringBuilder.toString();
}

function getPropertyDefinitionList(itemTypeName, propertyNameList, queryConfig)
 {
    const propertyDefinitionList = new java.util.ArrayList();
    const initialItemTypeDefinition = queryConfig.getItemTypeDefinition(itemTypeName);
    
    if (null != initialItemTypeDefinition) 
    {
        var currentItemTypeDefinitions = new java.util.HashSet();
        currentItemTypeDefinitions.add(initialItemTypeDefinition);
        
        for (var i = 0; i < propertyNameList.size(); i++) 
        {
            var propertyName = propertyNameList.get(i);

            var propertyDefinitionForLevel = null;
            var nextItemTypeDefinitions = new java.util.HashSet();
            
            for (var it = currentItemTypeDefinitions.iterator(); it.hasNext();) 
            {
                var itemTypeDefinition = it.next();
                var propertyDefinitions = itemTypeDefinition.getPropertyDefs(propertyName);
                
                if ((propertyDefinitions == null) || propertyDefinitions.isEmpty())
                {
                    continue;
                }
                
                for (var it2 = propertyDefinitions.iterator(); it2.hasNext();) 
                {
                    var propertyDefinition = it2.next();
                    
                    if (null == propertyDefinitionForLevel) 
                    {
                        propertyDefinitionForLevel = propertyDefinition;
                    }                    
                    if (i == propertyNameList.size() - 1) 
                    {
                        break;
                    }                    
                    var targetItemTypeDefinitions = propertyDefinition.getTargetItemTypeDefinitions();
                    if (targetItemTypeDefinitions != null) 
                    {
                        nextItemTypeDefinitions.addAll(targetItemTypeDefinitions);
                    }                
                }
                
                if (null != propertyDefinitionForLevel)
                {
                    propertyDefinitionList.add(i, propertyDefinitionForLevel);
                }
    
                if (i == propertyNameList.size() - 1) 
                {
                    break;
                }
            }            
            currentItemTypeDefinitions = nextItemTypeDefinitions;
        }
    }
    return propertyDefinitionList;
}

function isItemProperty(itemTypeName, propertyNameList, queryConfig) 
{
    const propertyDefinitionList = getPropertyDefinitionList(itemTypeName, propertyNameList, queryConfig);
    if (null == propertyDefinitionList || propertyDefinitionList.isEmpty())
    {
        return false;
    }
    const lastPropertyDefinition = propertyDefinitionList.get(propertyDefinitionList.size()-1);
    const propType = lastPropertyDefinition.getPropertyType();
    return Constants.QUERY_PROPERTYTYPE_ITEMLIST == propType;
}

function getStringValue(iResult, thisProperty)
{
    var value = iResult.getProperty(thisProperty).getString();
    if(null == value) 
    {
        value = new java.lang.String("");
    }
    value = value.replaceAll("\r\n", " ");
    value = value.replaceAll("\r", " ");
    value = value.replaceAll("\n", " "); 
    return value;
}

function getPropertyEnumerationValues(sItemTypes, sProperty)
{
    var enumerationValues = new java.util.HashSet();
    var arisMetaModel = ArisData.getActiveDatabase().ActiveFilter();

    var queryComponent = Context.getComponent("QueryComponent");
    var queryContext = queryComponent.getQueryContext(ArisData.getActiveDatabase());
    var queryConfig = queryContext.getConfig();
    
    for(var itItemTypes = sItemTypes.getValueList().iterator(); itItemTypes.hasNext(); )
    {
        var itemType = itItemTypes.next().toString();
        var itemTypeDefinition = queryConfig.getItemTypeDefinition(itemType);
        var propertyDefs = itemTypeDefinition.getPropertyDefs(sProperty);
        
        for(var itPropertyDefs = propertyDefs.iterator(); itPropertyDefs.hasNext(); )
        {
            var propertyDef = itPropertyDefs.next();
            var attrTypeNum = propertyDef.getAttrTypeNum();
            if(attrTypeNum != null)
            {
                var iValues = arisMetaModel.AttrValueTypeNums(attrTypeNum);
    
                for(var i = 0; i < iValues.length; i++)
                {
                    var sValue = arisMetaModel.AttrValueType(attrTypeNum, iValues[i]);
                    enumerationValues.add(sValue);
                }
            }
        }
    }
    
    return enumerationValues;
}
