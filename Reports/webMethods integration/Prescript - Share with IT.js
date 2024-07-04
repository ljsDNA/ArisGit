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

var xmlData = Context.getProperty("FILE_BYTES");
//var xmlData = getImportFile().getData();
if (xmlData != null) {
    var xmlReader = Context.getXMLParser(xmlData);  // Parses the specified XML file and returns an object that provides access to the XML document.
    if (xmlReader.isValid()) 
    {
        var xmlRoot = xmlReader.getRootElement();   // Root element of the XML document
        var sIDProcess = xmlRoot.getAttribute("Id").getValue()
        setProperty("PACKAGEID", sIDProcess);
        
        addActivities(xmlRoot);
        addArtifacts(xmlRoot);
        addTransitions(xmlRoot);
        addAssociations(xmlRoot);
    }
}

function addAssociations(xmlRoot)
{         
    var xmlAssociations = getAssociationsGraphics(xmlRoot);
    mapPageIds(xmlAssociations[0], xmlAssociations[1]);
        
    var xmlWorklflows = getWorkflows(xmlRoot);
    var iterWorkflow = xmlWorklflows.iterator();
    while(iterWorkflow.hasNext()) 
    {
        //all items of subprocesses
        var xmlWorkflow = iterWorkflow.next();
        var xmlActivitySets = getActivitySets(xmlWorkflow);
        var iterActivitySets = xmlActivitySets.iterator();
        while(iterActivitySets.hasNext()) 
        {
            var xmlActivitySet = iterActivitySets.next();
            var xmlSetAssociations = getAssociations(xmlActivitySet);
            mapChildren(xmlSetAssociations, xmlActivitySet);
        }
    }    
}

function addTransitions(xmlRoot)
{
    var xmlWorklflows = getWorkflows(xmlRoot);
    var iterWorkflow = xmlWorklflows.iterator();
    while(iterWorkflow.hasNext()) 
    {
        var xmlWorkflow = iterWorkflow.next();
        var xmlTransitions = getTransitionsGraphics(xmlWorkflow);
        mapPageIds(xmlTransitions[0], xmlTransitions[1]);
        
        //all items of subprocesses
        var xmlActivitySets = getActivitySets(xmlWorkflow);
        var iterActivitySets = xmlActivitySets.iterator();
        while(iterActivitySets.hasNext()) 
        {
            var xmlActivitySet = iterActivitySets.next();   
            var xmlSetTransitions = getTransitions(xmlActivitySet); 
            mapChildren(xmlSetTransitions, xmlActivitySet);
        }
    }     
}

function addArtifacts(xmlRoot)
{      
    var artifactsMapping = getArtifactsWithGraphics(xmlRoot);
    mapPageIds(artifactsMapping[0], artifactsMapping[1]);
    
    
    var xmlWorklflows = getWorkflows(xmlRoot);
    var iterWorkflow = xmlWorklflows.iterator();
    while(iterWorkflow.hasNext()) 
    {
        //all items of subprocesses
        var xmlWorkflow = iterWorkflow.next();
        var xmlActivitySets = getActivitySets(xmlWorkflow);
        var iterActivitySets = xmlActivitySets.iterator();
        while(iterActivitySets.hasNext()) 
        {
            var xmlActivitySet = iterActivitySets.next();
            var xmlSetArtifacts = getArtifacts(xmlActivitySet);
            mapChildren(xmlSetArtifacts, xmlActivitySet);
        }
    }
}

function addActivities(xmlRoot)
{
    var xmlWorklflows = getWorkflows(xmlRoot);
    var iterWorkflow = xmlWorklflows.iterator();
    while(iterWorkflow.hasNext()) 
    {
        var xmlWorkflow = iterWorkflow.next();
        var xmlActivities = getActivitiesGraphics(xmlWorkflow);
        mapPageIds(xmlActivities[0], xmlActivities[1]);
        
        //all items of subprocesses
        var xmlActivitySets = getActivitySets(xmlWorkflow);
        var iterActivitySets = xmlActivitySets.iterator();
        while(iterActivitySets.hasNext()) 
        {
            var xmlActivitySet = iterActivitySets.next();   
            var xmlSetActivities = getActivities(xmlActivitySet); 
            mapChildren(xmlSetActivities, xmlActivitySet);
        }
    }     
}

//------------- XPDL paths -------------

function getAssociationsGraphics(xmlRoot)
{
    return getGraphicsInfoToObject(xmlRoot, "Associations", "Association", "ConnectorGraphicsInfos", "ConnectorGraphicsInfo");
}

function getAssociations(xmlRoot)
{
    return getChildren(xmlRoot, "Associations", "Association");   
}

function getArtifactsWithGraphics(xmlRoot)
{
    return getGraphicsInfoToObject(xmlRoot, "Artifacts", "Artifact", "NodeGraphicsInfos", "NodeGraphicsInfo");
}

function getArtifacts(xmlRoot)
{
    return getChildren(xmlRoot, "Artifacts", "Artifact");    
}

function getWorkflows(xmlRoot)
{
    return getChildren(xmlRoot, "WorkflowProcesses", "WorkflowProcess");
}

function getActivitySets(xmlWorkflow)
{
    return getChildren(xmlWorkflow, "ActivitySets", "ActivitySet");
}

function getActivitiesGraphics(xmlParent)
{
    return getGraphicsInfoToObject(xmlParent, "Activities", "Activity", "NodeGraphicsInfos", "NodeGraphicsInfo");
}

function getActivities(xmlParent)
{
    return getChildren(xmlParent, "Activities", "Activity");    
}

function getTransitionsGraphics(xmlParent)
{
    return getGraphicsInfoToObject(xmlParent, "Transitions", "Transition", "ConnectorGraphicsInfos", "ConnectorGraphicsInfo");
}

function getTransitions(xmlParent)
{
    return getChildren(xmlParent, "Transitions", "Transition");    
}

//returns the children which contain PageIDs
function getGraphicsInfoToObject(xmlNode, subnodeName, childnodeName, graphicsInfos, graphicsInfo)
{
    var graphics = new Packages.java.util.ArrayList();
    var nodes = new Packages.java.util.ArrayList();
        
    var xmlRoots = xmlNode.getChildren(subnodeName, xmlNode.getNamespace());
    var iterRoots = xmlRoots.iterator();
    //level e. q. Artifacts, Activities
    while(iterRoots.hasNext()) 
    {      
        var xmlObjects = iterRoots.next();
        var xmlChildren = xmlObjects.getChildren(childnodeName, xmlNode.getNamespace());
        var iterChildren = xmlChildren.iterator();
        //level e. q. Artifact, Activity
        while(iterChildren.hasNext()) 
        {              
            var xmlObject = iterChildren.next();
            var xmlChildGraphics = xmlObject.getChildren(graphicsInfos, xmlNode.getNamespace())
            var iterGraphics = xmlChildGraphics.iterator();
            //level e. q. NodeGraphicsInfos, ConnectorGraphicsInfos
            while(iterGraphics.hasNext()){                
                
                var xmlGraphic = iterGraphics.next();
                var xmlSubGraphic = xmlGraphic.getChildren(graphicsInfo, xmlNode.getNamespace())
                var iterGraphic = xmlSubGraphic.iterator();
                //level e. q. NodeGraphicsInfo, ConnectorGraphicsInfo
                while(iterGraphic.hasNext()){
                    nodes.add(xmlObject);
                    graphics.add(iterGraphic.next());
                }
            }
        }
    }
    //return nodes with their graphicsInfos (order is important!)    
    return [graphics, nodes];
}


//returns the Ids of the children (only needed for subprocesses)
function getChildren(xmlNode, subnodeName, childnodeName)
{
    var ret = new Packages.java.util.ArrayList();
    var xmlRoots = xmlNode.getChildren(subnodeName, xmlNode.getNamespace());
    var iterRoots = xmlRoots.iterator();
    while(iterRoots.hasNext()) 
    {
        var xmlRoot = iterRoots.next();
        var xmlChildren = xmlRoot.getChildren(childnodeName, xmlNode.getNamespace());
        var iterChildren = xmlChildren.iterator();
        while(iterChildren.hasNext()) 
        {
            ret.add(iterChildren.next());    
        }
    }    
    return ret;
}

//maps Ids to their elements (only needed for subprocesses)
function mapChildren(xmlParent, xmlProcess)
{
    var sIDProcess = xmlProcess.getAttribute("Id").getValue();
    var iterChildren = xmlParent.iterator();
    while(iterChildren.hasNext()) 
    {
        var sID = iterChildren.next().getAttribute("Id").getValue();
        setProperty(sID, sIDProcess);        
    }
}

//maps PageIDs to their elements
function mapPageIds(xmlPageIDs, xmlIDs){
    var iterXMLIDs = xmlIDs.iterator();
    var iterPageIDs = xmlPageIDs.iterator();
    while(iterPageIDs.hasNext()) 
    {
        var sID = iterXMLIDs.next().getAttribute("Id").getValue();
        var sModelID = iterPageIDs.next().getAttribute("PageId").getValue();
        setProperty(sID, sModelID);        
    }  
}

//deletes sufixes from the Ids(also PageIDs) and stores the Ids to element keys
function setProperty(key, value)
{
    if(value != null){
        value = value.toString();
        if (value.length() == 47 && value.substring(36, 47) == "ACTIVITYSET"){
            value = value.substring(0, 36);    
        }
        else
        {
            var nIndex = 0;
            var nIndexActivity = value.lastIndexOf("ACTIVITYSET"); 
            var nIndexSubProcess = value.lastIndexOf("_SubProcess"); 
            var nIndexPage = value.lastIndexOf("PAGE");
            if (nIndexActivity != -1)
            {
                nIndex = nIndexActivity;      
            }
            else if (nIndexSubProcess != -1)
            {
                nIndex = nIndexSubProcess;     
            }
            else if (nIndexPage != -1)
            {
                nIndex = nIndexPage;
            }            
            if (nIndex > 0)
            {
                value = value.substring(0, nIndex);
            }
        }
    }
    Context.setProperty("PRESCRIPT_" + key, value);
}

function getProperty(key, value)
{
    return Context.getProperty("PRESCRIPT_" + key);
}
//ONLY for testing
function getImportFile() {
    var sdefname = "";
    var sdefext = "*.xml!!xml file|*.xml||";
    var sdefdir = "";
    var stitle = "Import xml file";

    var aFiles = Dialogs.getFilePath(sdefname, sdefext, sdefdir, stitle, 0);    // Displays a file selection dialog on the client and makes the content of the selected files available in the report
    if (aFiles != null && aFiles.length > 0) {
        return aFiles[0];
    }
    return null;
}