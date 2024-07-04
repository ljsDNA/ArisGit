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

//init
const SUB_LIST_SIZE = 100;

var queryComponent = Context.getComponent("QueryComponent");
var queryContext = queryComponent.getQueryContext(ArisData.getActiveDatabase());
var queryConfig = queryContext.getConfig();

var usecaseList = new java.util.ArrayList();
usecaseList.add(new  UseCaseConventions(queryConfig));
usecaseList.add(new  UseCaseOwnerDistribution());
usecaseList.add(new ValidityDateUseCase());

var treeGraph = new TreeGraph();

loadData();
traverseGraph();
finish();

function loadData()
{
    const m_valueAccess = Context.getParameterValueAccess();
    var itemTypesToLoad = m_valueAccess.getParameterValue("ItemTypes");

    for(var itItemTypes = itemTypesToLoad.getValueList().iterator(); itItemTypes.hasNext(); )
    {
        var itemType = itItemTypes.next().toString();
        loadItemsOfType(queryContext, itemType);
    }
}

function loadItemsOfType(queryContext, itemType)
{
    var propertyTree = buildPropertyTree(itemType);
    var resultList = executeQuery(queryContext, itemType, propertyTree);
    addResultEntries(itemType, resultList);
}

function buildPropertyTree(itemType)
{
    var additionalProperties = new java.util.HashSet();
    for(var u = 0; u < usecaseList.size(); u++)
    {
        var usecase = usecaseList.get(u);
        var propertiesByUsecase = usecase.getPropertyTree(itemType);
        
        for(p = 0; p < propertiesByUsecase.length; p++)
        {
            var property = propertiesByUsecase[p];
            additionalProperties.add(property);
        }
    }

    var propertyTree = new java.lang.StringBuilder();
    for(var itProperty = additionalProperties.iterator(); itProperty.hasNext();)
    {
        var property = itProperty.next();
        if(propertyTree.length() > 0)
        {
            propertyTree.append(", ");
        }
        propertyTree.append(property);
    }
    
    return propertyTree;
}

function executeQuery(queryContext, sItemToLoad, sPropertyTree)
{
    var query = queryContext.createQuery(sItemToLoad, sPropertyTree);
    var resultList = query.execute();
    return resultList;
}

function addResultEntries(itemType, resultList)
{
    var resultEntries = resultList.getResults(); 
    var resultCount = resultEntries.size();
    for(var i = 0; i < resultCount; i++ ) 
    {
        var resultEntry = resultEntries.get(i);
        addResultEntry(itemType, resultEntry);
    }
}

function addResultEntry(itemType, resultEntry)
{
    var id = resultEntry.getId();
    var node = treeGraph.getNode(id);
    node.setItem(resultEntry);
    node.setItemType(itemType);
}

function traverseGraph()
{
    //in our case all nodes are root nodes
    var nodes = new java.util.ArrayList(treeGraph.getRootNodes());
    var nodeCount = nodes.size();

    for(var i = 0; i < nodeCount; i += SUB_LIST_SIZE) 
    {
        var nodesFrom = i;
        var nodesTo = Math.min(nodeCount, nodesFrom + SUB_LIST_SIZE);
        var nodesSubList = nodes.subList(nodesFrom, nodesTo);
        
        processSubList(nodesSubList);
    }
}

function processSubList(nodesSubList)
{
    var nodeCount = nodesSubList.size();
    for(var i = 0; i < nodeCount; i++)
    {
        var node = nodesSubList.get(i);
        processingNodeStarted(node);
    }

    for(var u = 0; u < usecaseList.size(); u++)
    {
        var usecase = usecaseList.get(u);
        processNodesByUsecase(usecase, nodesSubList);
    }

    for(var i = 0; i < nodeCount; i++)
    {
        var node = nodesSubList.get(i);
        processingNodeFinished(node);
    }
}

function processNodesByUsecase(usecase, nodes)
{
    usecase.processNodeList(nodes);
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
