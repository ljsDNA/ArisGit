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
 * Report for loading the data for all QMS aggregated maturity use cases and calling the single use case reports.
 *
 * This report builds a TreeGraph of Itemhierarchy. The hierarchy is defined by ARIS-Connect.
 */

var queryComponent = Context.getComponent("QueryComponent");
var queryContext = queryComponent.getQueryContext(ArisData.getActiveDatabase());
var queryConfig = queryContext.getConfig();

var usecaseList = new java.util.ArrayList();
usecaseList.add(new MaturityLevelAndMandatoryPropertiesUseCase(queryConfig));
usecaseList.add(new UseCaseModelStatus());
usecaseList.add(new UseCaseModelAge());
usecaseList.add(new UseCaseRepresentativeObjects());

var hierarchyDescription = new java.util.HashMap();
var treeGraph = new TreeGraph();

loadData();
traverseGraph();
finish();

function loadData()
{
    setHierarchyDescription(queryContext);
    loadHierarchyData(queryContext);
    buildTreeStructure();
}

function loadHierarchyData(queryContext)
{
    for(var itHierarchyEntries = hierarchyDescription.entrySet().iterator(); itHierarchyEntries.hasNext();)
    {
        var hierarchyEntry = itHierarchyEntries.next();
        var sItemType = hierarchyEntry.getKey();
        var childProperties = hierarchyEntry.getValue();

        var sPropertyTree = buildPropertyTree(sItemType, childProperties);     
        var resultList = executeQuery(queryContext, sItemType, sPropertyTree);
        addResultsToTreeGraph(sItemType, resultList);
    }
}

function setHierarchyDescription(queryContext)
{
    const m_valueAccess = Context.getParameterValueAccess();
    var hierarchyToLoad = m_valueAccess.getParameterValue("Hierarchy");

    var config = queryContext.getConfig();
    var hierarchyDefinition = config.getHierachyDefinition(hierarchyToLoad);
    if(hierarchyDefinition == null)
    {
        return;
    }
        
    var hierarchyStructureList = hierarchyDefinition.getStructure();
    for(var itHierarchyStructure = hierarchyStructureList.iterator(); itHierarchyStructure.hasNext();)
    {
        var hierarchyStructure = itHierarchyStructure.next();
        addHierarchyStructure(hierarchyStructure);
    }
}

function addHierarchyStructure(hierarchyStructure)
{
    var itemTypeDef = hierarchyStructure.getItemTypeDefinition();
    var sItemType = itemTypeDef.getName();
    
    var childProperties = new java.util.ArrayList();
    var childPropertyDefs = hierarchyStructure.getChildPropertyDefs();
    for(var itChildPropertyDefs = childPropertyDefs.iterator(); itChildPropertyDefs.hasNext();)
    {
        var childPropertyDef = itChildPropertyDefs.next();
        var sChildProperty = childPropertyDef.getName();
        
        childProperties.add(sChildProperty);
    }
    
    hierarchyDescription.put(sItemType, childProperties);
}

function buildPropertyTree(sItemType, childProperties)
{
    var propertyTree = new java.lang.StringBuilder();

    for(var i = 0; i < childProperties.size(); i++)
    {
        if(i > 0)
        {
            propertyTree.append(", ");
        }
        propertyTree.append(childProperties.get(i));
    }
    
    var additionalProperties = new java.util.HashSet();
    
    for(var u = 0; u < usecaseList.size(); u++)
    {
        var usecase = usecaseList.get(u);
        var propertiesByUsecase = usecase.getPropertyTree(sItemType);
        
        for(var p = 0; p < propertiesByUsecase.length; p++)
        {
            var property = propertiesByUsecase[p];
            additionalProperties.add(property);
        }
    }

    for(var itProperty = additionalProperties.iterator(); itProperty.hasNext();)
    {
        var property = itProperty.next();
        if(propertyTree.length() > 0)
        {
            propertyTree.append(", ");
        }
        propertyTree.append(property);
    }
    
    return propertyTree.toString();
}

function executeQuery(queryContext, sItemType, sPropertyTree)
{
    var query = queryContext.createQuery(sItemType, sPropertyTree);
    var resultList = query.execute();
    return resultList;
}

function addResultsToTreeGraph(sItemType, resultList)
{
    var resultEntries = resultList.getResults(); 
    var resultCount = resultEntries.size();
    for(var i = 0; i < resultCount; i++ ) 
    {
        var resultEntry = resultEntries.get(i);
        addResultEntryToTreeGraph(sItemType, resultEntry);
    }
}

function addResultEntryToTreeGraph(sItemType, resultEntry)
{
    var id = resultEntry.getId();
    var node = treeGraph.getNode(id);
    node.setItem(resultEntry);
    node.setItemType(sItemType);
}

function buildTreeStructure()
{
    var treeNodes = treeGraph.getAllNodes();
    var treeNodesArray = toArray(treeNodes);
    treeNodesArray.sort(compareTreeNodes);
    
    for(var i = 0; i < treeNodesArray.length; i++)
    {
        var node = treeNodesArray[i];
        addChildNodes(node);
    }
}

function compareTreeNodes(node1, node2)
{
    var id1 = node1.getKey();
    var id2 = node2.getKey();
    
    return id2.compareTo(id2);
}

function addChildNodes(node)
{
    var sItemType = node.getItemType();
    var childProperties = hierarchyDescription.get(sItemType);
    
    for(var i = 0; i < childProperties.size(); i++)
    {
        var childProperty = childProperties.get(i);
        addChildNodesOfProperty(node, childProperty);
    }
}

function addChildNodesOfProperty(node, childProperty)
{
    var item = node.getItem();

    var childEntries = item.getProperty(childProperty).getResultList();
    var childCount = childEntries.size();

    if (childCount == 0)
    {
        return false
    }
    
    for(var i=0; i < childCount; i++)
    {
        var childEntry = childEntries.get(i);
        var idChild = childEntry.getId();
        
        if(treeGraph.containsNode(idChild))
        {
            var childNode = treeGraph.getNode(idChild);   
            node.addChildNode(childNode);
        }
    }
}

function traverseGraph()
{
    var callbackList = new java.util.ArrayList()

    for(var u = 0; u < usecaseList.size(); u++)
    {
        var usecase = usecaseList.get(u);
        callbackList.add(usecase.processNode)
    }

    treeGraph.traverse(callbackList, processingNodeStarted, processingNodeFinished)
}

function processingNodeStarted(node)
{
    var resultEntry = node.getItem()
    if(resultEntry == null)
    {
        return
    }

    resultEntry.loadAll(true)
}

function processingNodeFinished(node)
{
    var resultEntry = node.getItem()
    if(resultEntry == null)
    {
        return
    }

    resultEntry.releaseData();
}

function finish()
{
    for(var u = 0; u < usecaseList.size(); u++)
    {
        var usecase = usecaseList.get(u);
        usecase.finish();
    }
}
