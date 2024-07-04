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
 * The mapping operation handler takes care of carrying out all operations
 * generated based on mappings from the standard mapping layer.
 *
 * @author MKOCH
 */
function MappingOperationHandler() {
    /** Used for quick access to the ARIS database. */
    var db;

    /** Used for quick access to the ARIS method. */
    var arisMetaModel;

    /**
     * Set containing GUIDs of objects whose assignment to a context
     * object was delayed. (So changes to these objects have to be delayed too.)
     */
    //    var delayedGUIDSet = new Packages.java.util.HashSet();

    /**
     * List of models which have been modified by this handler and
     * need to be re-layouted after completion.
     */
    var modelsToLayout = new Packages.java.util.HashSet();

    /**
     * Map mapping context object ids to a set of their changed properties.
     * Is used to call post-processing handler after the import.
     */
    var affectedContextObjectMap = new Packages.java.util.HashMap();


    /**
     * Items which were created in control mode. This serves as stack
     * for a primitive roll back function in case something goes wrong
     * after some item(s) have already been created.
     */
    var createdItems;

    /**
     * When connection occurrences are removed, the objects occurrences
     * which were connected are put into this array, so they can later
     * be identified.
     */
    var affectedOccurrences;

    /**
     * The context item of the operation.
     */
    //var contextItem;

    /**
     * The context node of the operation.
     */
    var contextNode;

    /**
     * The mapped item type name the current operation.
     */
    var mappedItemTypeNameOfCurrentOperation;

    /**
     * The mapped item property name the current operation.
     */
    var mappedItemPropertyNameOfCurrentOperation;

    /**
     * The item finder used to find items.
     */
    var itemFinder;

    /**
     * The best match support, supporting the 'best match' approach to models' identification.
     */
    var bestMatchSupport;
    
    /**
     * Function which post processes the description after each operation
     * before it is added to the history.
     */
    var postProcessDescFunction = null;

    var postImportFunction = null;

    /* const */
    var M_CHECK = 0;
    /* const */
    var M_CHECK_UNSET = 1;
    /* const */
    var M_CHECK_SET = 2;
    /* const */
    var M_SET = 3;
    /* const */
    var M_UNSET = 4;


    this.handle = function(database, processor) {
        db = database;
        arisMetaModel = db.ActiveFilter();
        itemFinder = processor.getItemFinder();
        bestMatchSupport = new BestMatchSupport(db);

        while ((operation = processor.next()) != null) {
            try {
                lastOccurrence = null;
                createdItems = new Array();
                affectedOccurrences = new Array();
                modelFound = false;

                // obtain basic operation settings & context object
                var command = "" + operation.getAttribute("command");

                // obtain object type name an set as mappedItemTypeNameOfCurrentOperation
                mappedItemTypeNameOfCurrentOperation = "" + operation.getAttribute("objectType");

                // obtain property name an set as mappedItemTypeNameOfCurrentOperation
                mappedItemPropertyNameOfCurrentOperation = "" + operation.getAttribute("property");

                // get the context node
                var childNodes = getRealChildren(operation);

                // abort if the operation does not define a context 
                if (childNodes.length <= 0) {
                    processor.setStatus(ImportProvider.FAILED, ImportProvider.NOT_FOUND_ERROR, "Operation does not define a context. Operation aborted.", 0, true, description);
                    continue;
                }
                contextNode = childNodes[0];

                // get value description for status
                var targetNode = getTargetNode(operation);
                var targetGUID = null;
                var description;
                if (targetNode.getTagName() == "object") {
                    targetGUID = targetNode.getAttribute("value");
                    description = targetNode.getAttribute("name") + ", " + targetGUID + "\n"
                } else {
                    description = targetNode.getAttribute("value");
                    //if (description == null || description == "")
                    //    description = " ";
                }

                preControlContextObjectState(contextNode, description);

                contextItem = processContext(contextNode);

                var isContextOfTypeConnection = (contextNode.getTagName() == "connection");

                if (contextItem == null && isContextOfTypeConnection && command == "unset" && targetGUID != null) {
                    processor.setStatus(ImportProvider.SKIPPED, ImportProvider.NO_ERROR, "Operation result already in place. Operation does not need to be performed.", locale, true, description);
                }               
                // abort if the context object does not exist
                if (contextItem == null) {
                    processor.setStatus(ImportProvider.FAILED, ImportProvider.NOT_FOUND_ERROR, "Context object does not exist. Operation aborted.", 0, true, description);
                    continue;
                }
                var contextItemGUID = contextItem.GUID();

                // get value locale for status
                var locale = targetNode.getAttribute("locale");
                if (locale == null || locale.equals(""))
                    locale = 0;

                // abort if the object is in delayed mode
                if (delayedGUIDSet.contains(targetGUID))
                    throw new OperationException(ImportProvider.TEMPORARY_ERROR, "handle(): Context object is in delayed mode. Its changes must be delayed too.", locale, description);

                // check current mapping state & bail out if change already in place
                var mode = M_CHECK;
                if (command == "unset")
                    mode = M_CHECK_UNSET;


                var exists = null;

                // to ensure right handling of connection attributes we need to preprocess the operation structure for attribute operations
                if (targetNode.getTagName() == "attribute")
                    contextNode = preProcessAttributeOperation(contextNode);

                // if context is connection and target of type object (targetGUID != null) do only exits-check
                if (isContextOfTypeConnection) {
                    exists = processConnection(null, contextNode, mode);
                    if (targetGUID != null && targetGUID != "") {
                        if ((exists != null || exists == true) ^ command == "unset") {
                            processor.setStatus(ImportProvider.SKIPPED, ImportProvider.NO_ERROR, "Operation result already in place. Operation does not need to be performed.", locale, true, description);
                            markAffectedContextObject();
                        } else {
                            processor.setStatus(ImportProvider.SKIPPED, ImportProvider.FAILED, "Incomplete operation with connection context found.", locale, true, description);
                            markAffectedContextObject();
                        }
                        continue;
                    }
                } else
                    exists = processObject(null, contextNode, mode);
                    
                if ((exists != null || exists == true) ^ command == "unset") {                    
                    var cxnDefExist = checkCxnDefExistance(contextNode);
                    
                    if(cxnDefExist != null) {
                        var skip = (cxnDefExist && command=="set" || !cxnDefExist && command=="unset")? true : false;
                    
                        if(skip)
                            processor.setStatus(ImportProvider.SKIPPED, ImportProvider.NO_ERROR, "Operation result already in place. Operation does not need to be performed.", locale, true, description);        
                        else
                            processor.setStatus(ImportProvider.FAILED, ImportProvider.NOT_FOUND_ERROR, "Operation failed. The object wasn't found in the expected model.", locale, true, description); 
                    
                    markAffectedContextObject();
                    continue;  
                    }
                }               

                // perform change
                description = callPostProcessDescFunction(description);

                switch (command) {
                    case "set":
                        if (isContextOfTypeConnection) {
                            if (!processConnection(null, contextNode, M_SET))
                                throw new OperationException(ImportProvider.NOT_FOUND_ERROR, "handle(): Set operation could not be completed because operation describes non-existing structure.", locale, description);
                        } else if (!processObject(null, contextNode, M_SET))
                            throw new OperationException(ImportProvider.NOT_FOUND_ERROR, "handle(): Set operation could not be completed because operation describes non-existing structure.", locale, description);


                        autoCreateConnectionOccurrences();
                        processor.setStatus(ImportProvider.SUCCEEDED, ImportProvider.NO_ERROR, "Operation completed successfully.", locale, true, description);
                        markAffectedContextObject();
                        break;

                    case "unset":
                        if (isContextOfTypeConnection) {
                            if (!processConnection(null, contextNode, M_UNSET))
                                throw new OperationException(ImportProvider.NOT_FOUND_ERROR, "handle(): Unset operation could not be completed because operation describes non-existing structure.", locale, description);
                        } else if (!processObject(null, contextNode, M_UNSET))
                            throw new OperationException(ImportProvider.NOT_FOUND_ERROR, "handle(): Unset operation could not be completed because operation describes non-existing structure.", locale, description);

                        processor.setStatus(ImportProvider.SUCCEEDED, ImportProvider.NO_ERROR, "Operation completed successfully.", locale, true, description);
                        markAffectedContextObject();
                        break;

                    default:
                        processor.setStatus(ImportProvider.FAILED, ImportProvider.UNKNOWN_ERROR, "Unknown command. Operation aborted.", locale, true, description);
                }

            } catch (e) {
                if (e.errorCode == ImportProvider.TEMPORARY_ERROR) {
                    // once an operation has been delayed, all changes to the same
                    // context object must be delayed to preserve execution order
                    delayedGUIDSet.add(contextItemGUID);
                    // if the delayed change involved a target object, changes
                    // to this object must also be delayed (it might need to be
                    // created by the operation before changes to it can be carried out)
                    if (targetGUID != null)
                        delayedGUIDSet.add(targetGUID);
                    processor.setStatus(ImportProvider.DELAYED, e.errorCode, e.message, locale, true, description);

                } else {
                    var errorCode = e.errorCode;
                    if (errorCode == null)
                        errorCode = ImportProvider.UNKNOWN_ERROR;
                    var message = e.message;
                    if (message == null)
                        message = "" + e;
                    processor.setStatus(ImportProvider.FAILED, errorCode, message, locale, true, description);
                }
                performRollback(createdItems);
            }
        }

        // calls the post import function for each affected context object
        callPostImportFunction();
    }

    //////////////////////////////////////////////////////////////////
    //
    // Functions to process the nodes
    //
    /////////////////////////////////////////////////////////////////

    /**
     * Generic method for processing child nodes of the given type for a given parent object.
     *
     * @param parentItem parent item
     * @param childNodes all child nodes
     * @param nodeName name of the children to process
     * @param mode processing mode
     */
    function process(parentItem, childNodes, nodeName, mode) {
        var functionName = "process" + nodeName.substring(0, 1).toUpperCase() + nodeName.substring(1, nodeName.length);

        // get all nodes of the given type
        var nodes = getNamedChildren(childNodes, nodeName);

        // if there are no nodes, apply fallback were defined or assume processing finished successfully
        if (nodes == null) {
            switch (nodeName) {
                case "group":
                    if (contextItem.KindNum() == Constants.CID_CXNDEF)
                        return contextItem.SourceObjDef().Group(); // as default the group of the context source object is used
                    else
                        return contextItem.Group(); // as default the group of the context object is used
                default: return true;
            }
        }

        // when processing attribute node(s), allow more than one
        if (nodeName.equals("attribute")) {
            var success = true;
            for (var i = 0; i < nodes.length; i++)
                if (!eval(functionName + "(parentItem, nodes[i], mode)"))
                    success = false;
            return success;

            // otherwise only use the first node
        } else {
            // otherwise return the result of the responsible processing method for the first item
            return eval(functionName + "(parentItem, nodes[0], mode)");
        }
    }

    /**
     * Processes a single object node.
     * Objects can occur as children of connections and object occurrences.
     * Objects can have connections, occurences, assignments, groups and attributes as children.
     *
     * @param parentItem item which the attribute belongs to
     * @param node operation node which describes the attribute
     * @param mode processing mode for the node
     */
    function processContext(node) {
        var objectGuid = node.getAttribute("value");

        var typeNum = "" + node.getAttribute("typeNum");
        if (isNaN(typeNum)) {
            typeNum = eval("Constants." + node.getAttribute("typeNum"));
        }

        var childNodes = getRealChildren(node);

        // determine object(s) for the current node
        var theCandidate = null;
        if (objectGuid != null && objectGuid != "") {
            var object = findItem(objectGuid, null);
            if (object != null && object != undefined && object.IsValid()) {
                theCandidate = object;
            }
        }

        // try to find the proper context item
        if (theCandidate != null)
            if (typeNum != null && theCandidate.TypeNum() == typeNum)
                if (process(theCandidate, childNodes, "attribute", M_CHECK_SET))
                    return theCandidate;

        return null;
    }

    /**
     * Processes a single object node.
     * Objects can occur as children of connections and object occurrences.
     * Objects can have connections, occurences, assignments, groups and attributes as children.
     *
     * @param parentItem item which the attribute belongs to
     * @param node operation node which describes the attribute
     * @param mode processing mode for the node
     */
    function processObject(parentItem, node, mode) {
        var ownFunction = node.getAttribute("function");
        var objectGuid = node.getAttribute("value");

        // get the guid if the object is determined by specific guid
        if (node.getAttribute("guid") != null && node.getAttribute("guid") != "")
            objectGuid = node.getAttribute("guid");

        var propertyValueMap = getPropertyValueMapForNode(node);

        var typeNum = "" + node.getAttribute("typeNum");
        if (isNaN(typeNum)) {
            typeNum = eval("Constants." + node.getAttribute("typeNum"));
        }

        var isControlled = ownFunction.indexOf("control") >= 0;
        var childNodes = getRealChildren(node);

        // determine object(s) for the current node
        var objectList = new Array();
        if (parentItem == null || !parentItem.IsValid()) {
            if (objectGuid != null && objectGuid != "") {
                var object = findItem(objectGuid, propertyValueMap);
                if (object != null && object != undefined && object.IsValid()) {
                    objectList.push(object);
                    // the guid of the returned item can change in case
                    // the item finder used an other criteria to retrieve the item
                    objectGuid = object.GUID();
                }
            }
        } else {
            switch (parentItem.KindNum()) {
                case Constants.CID_CXNDEF:
                    //TODO: only the object on the correct side should be considered
                    objectList.push(parentItem.SourceObjDef());
                    objectList.push(parentItem.TargetObjDef());
                    break;
                case Constants.CID_OBJOCC:
                    objectList.push(parentItem.ObjDef());
                    break;
                default:
                //TODO: Fall back to all objects of the given type?
                //objectList = db.Find(Constants.SEARCH_OBJDEF, typeNum);
            }
        }

        // try to find the proper object
        var childMode = getFollowChildMode(mode);
        var theObject = null;

        for (var oidx = 0; oidx < objectList.length; oidx++) {
            if (typeNum != null && objectList[oidx].TypeNum() != typeNum)
                continue;
            if (objectGuid != null && objectGuid != "" && !objectList[oidx].GUID().equals(objectGuid))
                continue;
            if (!process(objectList[oidx], childNodes, "attribute", childMode))
                continue;
            if (!process(objectList[oidx], childNodes, "group", childMode))
                continue;
            if (!process(objectList[oidx], childNodes, "occurrence", childMode))
                continue;
            if (!process(objectList[oidx], childNodes, "assignment", childMode))
                continue;
            if (!process(objectList[oidx], childNodes, "connection", childMode))
                continue;

            theObject = objectList[oidx];
            break;
        }

        // take further actions depending on current mode
        switch (mode) {
            case M_CHECK:
            case M_CHECK_UNSET:
                return theObject;

            case M_CHECK_SET:
                if (theObject != null)
                    return theObject;
                return isControlled;

            case M_SET:
                var objectGroup = process(theObject, childNodes, "group", mode);

                // objects which are controled by the import will not be created if they already exit      
                if (isControlled && (theObject == null || !theObject.IsValid())) {
                    theObject = objectGroup.CreateObjDef(typeNum, "", -1);

                    if (!theObject.IsValid())
                        throw new OperationException(ImportProvider.WRITE_ERROR, "processObject(): Could not create object with typeNum=" + typeNum);

                    // set the object guid after object has been created
                    if (objectGuid != null && objectGuid != "")
                        theObject.ModifyGUID(objectGuid);

                    createdItems.push(theObject);


                } else {
                    // if the object could not be found and cannot be created, return null in any case
                    if (theObject == null || !theObject.IsValid())
                        throw new OperationException(ImportProvider.NOT_FOUND_ERROR, "processObject(): Could not find object with typenum=" + typeNum + ", guid=" + objectGuid);
                }

                process(theObject, childNodes, "attribute", mode)
                process(theObject, childNodes, "assignment", mode)
                process(theObject, childNodes, "connection", mode)
                process(theObject, childNodes, "occurrence", mode)

                return theObject;

            case M_UNSET:
                process(theObject, childNodes, "attribute", mode);
                process(theObject, childNodes, "group", mode);
                process(theObject, childNodes, "assignment", mode);
                process(theObject, childNodes, "connection", mode);
                process(theObject, childNodes, "occurrence", mode);

                if (isControlled) {
                    // object was found and can be deleted if there is no occurence left
                    var theOccList = theObject.OccList();
                    // this part has been removed to handle following add and delete operation for new created object of same identity.

                    // if(theOccList.length == 0)
                    //if (!theObject.Group().Delete(theObject))
                    //    throw new OperationException(ImportProvider.WRITE_ERROR, "processObject(): Could not delete object");

                    /*
                     for (var oidx = 0; oidx < theOccList.length; oidx++)
                     if (!theOccList[oidx].Remove(true))  //if the last one delete obj.definition
                     throw new OperationException(ImportProvider.WRITE_ERROR, "processObject(): Could not delete occurrence of Object");
                     */
                }

                return theObject;

            default:
                throw new OperationException(ImportProvider.UNKNOWN_ERROR, "processObject(): Encountered unknown mode: " + mode);
        }
    }

    /**
     * Processes a single connection node.
     * Connections can occur as children of objects.
     * Connections can have objects, assignments and attributes as children.
     *
     * @param parentItem item which the attribute belongs to
     * @param node operation node which describes the attribute
     * @param mode processing mode for the node
     */
    function processConnection(parentItem, node, mode) {
        var theConnection = null;
        var propertyValueMap = getPropertyValueMapForNode(node);

        // extract data from node
        var ownFunction = node.getAttribute("function");
        var connectionGuid = node.getAttribute("value");
        var typeNum = eval("Constants." + node.getAttribute("typeNum"));

        var direction = node.getAttribute("direction")
        if (direction == "in") {
            direction = Constants.EDGES_IN;
        } else {
            direction = Constants.EDGES_OUT;
        }

        var isControlled = ownFunction.indexOf("control") >= 0;
        var childNodes = getRealChildren(node);

        // get all connection candidates for the current node
        var connectionList = new Array();
        if (parentItem != null) {
            switch (parentItem.KindNum()) {
                case Constants.CID_OBJDEF:
                    connectionList = parentItem.CxnListFilter(direction, typeNum);
                    break;
                default:
                    throw new OperationException(ImportProvider.STRUCTURAL_ERROR, "processConnection(): Connections must have object as parent. Parent kind is: " + parentItem.KindNum());
            }
        } else {
            // in case no parentItem is passed the connection is the context of operation -> try to find the connection
            if (connectionGuid != null && connectionGuid != "") {
                theCandidate = findItem(connectionGuid, propertyValueMap);
                if (theCandidate != null && theCandidate.IsValid())
                    connectionList.push(theCandidate);
            }
        }


        // try to find the proper connection
        var childMode = getFollowChildMode(mode);
        var model;
        for (var cidx = 0; cidx < connectionList.length; cidx++) {
            if (!process(connectionList[cidx], childNodes, "attribute", childMode))
                continue;
            if (!process(connectionList[cidx], childNodes, "object", childMode))
                continue;
            if (!process(connectionList[cidx], childNodes, "assignment", childMode))
                continue;

            theConnection = connectionList[cidx];
            break;
        }

        // take further actions depending on current mode
        switch (mode) {
            case M_CHECK:
            case M_CHECK_UNSET:
                return theConnection;

            case M_CHECK_SET:
                if (theConnection != null)
                    return theConnection;
                return isControlled;

            case M_SET:
                if (isControlled) {
                    var objectDef = process(null, childNodes, "object", mode);
                    if (!objectDef)
                        return null;
                                     
                        if (direction == Constants.EDGES_IN) {     
                            theConnection = objectDef.CreateCxnDef(parentItem, typeNum);
                        } else {
                            theConnection = parentItem.CreateCxnDef(objectDef, typeNum);
                        }                    
                        
                    if (!theConnection.IsValid())
                        throw new OperationException(ImportProvider.WRITE_ERROR, "processConnection(): Connection could not be created.");

                    // creating a new connection will produce a new GUID, so we need to map them
                    if (connectionGuid != null && connectionGuid != "")
                        theConnection.ModifyGUID(connectionGuid);

                    createdItems.push(theConnection);


                } else {
                    // if the connection could not be found and cannot be created, return null in any case
                    if (theConnection == null || !theConnection.IsValid())
                        throw new OperationException(ImportProvider.NOT_FOUND_ERROR, "processConnection(): Could not find connection with typenum=" + typeNum);
                    process(theConnection, childNodes, "object", mode);
                }

                process(theConnection, childNodes, "attribute", mode);
                process(theConnection, childNodes, "assignment", mode);

                return theConnection;

            case M_UNSET:
                process(theConnection, childNodes, "assignment", mode);

                if (isControlled) {
                    // connection was found and can be deleted
                    // find all connection occurrences first and delete them
                    var cxnOccs = theConnection.OccList();
                    for (var oidx = 0; oidx < cxnOccs.length; oidx++) {
                        if (!isWritable(cxnOccs[oidx].Model()))
                            throw new OperationException(ImportProvider.TEMPORARY_ERROR, "processConnection(): Cannot write model containing connection occurrence.");

                        affectedOccurrences.push(cxnOccs[oidx].SourceObjOcc());
                        affectedOccurrences.push(cxnOccs[oidx].TargetObjOcc());

                        if (!cxnOccs[oidx].Remove())
                            throw new OperationException(ImportProvider.WRITE_ERROR, "processConnection(): Could not delete connection occurrence.");
                    }
                    if (!theConnection.Delete())
                        throw new OperationException(ImportProvider.WRITE_ERROR, "processConnection(): Could not delete connection with typeNum=" + typeNum);

                } else {
                    // attributes only need to be deleted if the connection
                    // itself is not controlled by the operation
                    process(theConnection, childNodes, "attribute", mode);
                }

                process(theConnection, childNodes, "object", mode);

                return theConnection;

            default:
                throw new OperationException(ImportProvider.UNKNOWN_ERROR, "processConnection(): Encountered unknown mode: " + mode);
        }
    }

    /**
     * Processes a single object occurence.
     * Occurrences can occur as children of objects and models.
     * Occurrences can have objects and models as children.
     *
     * @param parentItem item which the attribute belongs to
     * @param node operation node which describes the attribute
     * @param mode processing mode for the node
     */
    function processOccurrence(parentItem, node, mode) {
        var ownFunction = node.getAttribute("function");
        var typeNum = null;
        if (node.getAttribute("typeNum") != "" && node.getAttribute("typeNum") != null) {
            try {
                typeNum = arisMetaModel.UserDefinedSymbolTypeNum(node.getAttribute("typeNum"));
            } catch (e) {
                typeNum = eval("Constants." + node.getAttribute("typeNum"));
            }
        }
        var isControlled = ownFunction.indexOf("control") >= 0;
        var childNodes = getRealChildren(node);

        // get all occurrence candidates for the current node
        var occurrenceList = new Array();
        if (parentItem != null && parentItem.IsValid()) {
            switch (parentItem.KindNum()) {
                case Constants.CID_OBJDEF:
                    var model = process(null, childNodes, "model", M_CHECK_SET);
                    if (!model)
                        throw new OperationException(ImportProvider.STRUCTURAL_ERROR, "processOccurrence(): Found occurrence node which does not specify a model.");
                    occurrenceList = parentItem.OccListInModel(model);
                    break;

                case Constants.CID_MODEL:
                    occurrenceList = parentItem.ObjOccList();
                    break;

                default:
                    throw new OperationException(ImportProvider.STRUCTURAL_ERROR, "processOccurrence(): Connections must have object as parent. Parent kind is: " + parentItem.KindNum());
            }
        }

        // try to find the proper occurrence
        var childMode = getFollowChildMode(mode);
        var theOccurrence = null;
        var occurrenceQuality1 = null; // occurrence which matches affected object occurrences
        var occurrenceQuality2 = null; // occurrence which has no connections
        var occurrenceQuality3 = null; // any occurrence matching type and children
        for (var oidx = 0; oidx < occurrenceList.length; oidx++) {
            // check basic criteria: symbol type num & children
            if (typeNum != null && occurrenceList[oidx].SymbolNum() != typeNum)
                continue;
            if (!process(occurrenceList[oidx], childNodes, "object", childMode))
                continue;
            if (!process(occurrenceList[oidx], childNodes, "model", childMode))
                continue;
            occurrenceQuality3 = occurrenceList[oidx];

            // check number of existing connections
            if (occurrenceList[oidx].Cxns().length > 0)
                continue;
            occurrenceQuality2 = occurrenceList[oidx];

            // check if a connection to this occurrence has just been deleted
            for (var aoidx = 0; aoidx < affectedOccurrences.length; aoidx++)
                if (occurrenceList[oidx].equals(affectedOccurrences[aoidx])) {
                    occurrenceQuality1 = occurrenceList[oidx];
                    break;
                }
            break;
        }

        // use the best match
        if (occurrenceQuality1 != null)
            theOccurrence = occurrenceQuality1;
        else if (occurrenceQuality2 != null)
            theOccurrence = occurrenceQuality2;
        else
            theOccurrence = occurrenceQuality3;

        // take further actions depending on current mode
        switch (mode) {
            case M_CHECK:
            case M_CHECK_UNSET:
                return theOccurrence;

            case M_CHECK_SET:
                if (theOccurrence != null)
                    return theOccurrence;
                return isControlled;



            case M_SET:
                var object = process(theOccurrence, childNodes, "object", mode);
                var model = process(theOccurrence, childNodes, "model", mode);
                switch (parentItem.KindNum()) {
                    case Constants.CID_OBJDEF: object = parentItem; break;
                    case Constants.CID_MODEL: model = parentItem; break;
                    default:
                }

                if (isControlled) {
                    if (typeNum == null)
                        typeNum = getBestSymbolTypeNum(model, object);
                    theOccurrence = model.createObjOcc(typeNum, object, 300, 300, true);
                    if (!theOccurrence.IsValid())
                        throw new OperationException(ImportProvider.WRITE_ERROR, "processOccurrence(): Could not create occurrence.");
                    createdItems.push(theOccurrence);
                    modelsToLayout.add(model);
                } else {
                    if (theOccurrence == null || !theOccurrence.IsValid())
                        throw new OperationException(ImportProvider.NOT_FOUND_ERROR, "processOccurrence(): Could not find occurrence.");
                }

                return theOccurrence;

            case M_UNSET:

                if (isControlled) {
                    if (!theOccurrence.Remove())
                        throw new OperationException(ImportProvider.WRITE_ERROR, "processOccurrence(): Could not delete occurrence with typeNum=" + typeNum);
                }

                process(theOccurrence, childNodes, "object", childMode);
                process(theOccurrence, childNodes, "model", childMode);
                return theOccurrence;

            default:
                throw new OperationException(ImportProvider.UNKNOWN_ERROR, "processOccurrence(): Encountered unknown mode: " + mode);
        }
    }

    /**
     * Processes a single model.
     * Models can occur as children of occurrences and assignments (models).
     * Models can have occurrences, groups and attributes as children.
     * Models cannot be modified by the import.
     *
     * @param parentItem item which the attribute belongs to
     * @param node operation node which describes the attribute
     * @param mode processing mode for the node
     */
    function processModel(parentItem, node, mode) {
        var theModel = bestMatchSupport.processModelApplyingBestMatchApproach(parentItem, node, mode);
       
        var childNodes = getRealChildren(node);

        // take further actions depending on current mode
        switch (mode) {
            case M_CHECK:
            case M_CHECK_UNSET:
            case M_CHECK_SET:
                return theModel;

            case M_SET:
            case M_UNSET:
                // if no model was found, nothing can be done
                if (theModel == null || !theModel.IsValid())
                    throw new OperationException(ImportProvider.NOT_FOUND_ERROR, "processModel(): The model could not be found.");

                var requiredNodesTags = bestMatchSupport.getRequiredNodesTags(node);
                if (requiredNodesTags.contains("attribute")) process(theModel, childNodes, "attribute", mode);
                if (requiredNodesTags.contains("group")) process(theModel, childNodes, "group", mode);
                process(theModel, childNodes, "occurrence", mode);
                return theModel;

            default:
                throw new OperationException(ImportProvider.UNKNOWN_ERROR, "processModel(): Encountered unknown mode: " + mode);
        }
    }

    /**
     * Processes a single assignment.
     * Assignments can occur as children of objects and connections.
     * Assignments must have models as children.
     *
     * @param parentItem item which the attribute belongs to
     * @param node operation node which describes the attribute
     * @param mode processing mode for the node
     */
    function processAssignment(parentItem, node, mode) {
        var ownFunction = node.getAttribute("function");
        var childNodes = getRealChildren(node);

        // get all assignment candidates for the current node
        var assignmentList = null;
        switch (parentItem.KindNum()) {
            case Constants.CID_OBJDEF:
            case Constants.CID_CXNDEF:
                assignmentList = parentItem.AssignedModels();
                break;
            default:
                throw new OperationException(ImportProvider.STRUCTURAL_ERROR, "processAssignment(): Assignment must have object or connection as parent.");
        }

        // try to find proper assigned model
        var theAssignedModel = null;
        var childMode = getFollowChildMode(mode);
        for (var aidx = 0; aidx < assignmentList.length; aidx++) {
            if (!process(assignmentList[aidx], childNodes, "model", childMode))
                continue;

            theAssignedModel = assignmentList[aidx];
        }

        // take further actions depending on current mode
        switch (mode) {
            case M_CHECK:
            case M_CHECK_UNSET:
            case M_CHECK_SET:
                return theAssignedModel;

            case M_SET:
            case M_UNSET:
                // if no assignment was found, nothing can be done
                if (theAssignedModel == null || !theAssignedModel.IsValid())
                    throw new OperationException(ImportProvider.NOT_FOUND_ERROR, "processAssignment(): The assignment could not be found.");

                process(theAssignedModel, childNodes, "model", mode);
                return theAssignedModel;

            default:
                throw new OperationException(ImportProvider.UNKNOWN_ERROR, "processAssignment(): Encountered unknown mode: " + mode);
        }
    }

    /**
     * Processes a single attribute node.
     * Attributes are end nodes and cannot have any children.
     *
     * @param parentItem item which the attribute belongs to
     * @param node operation node which describes the attribute
     * @param mode processing mode for the node
     */
    function processAttribute(parentItem, node, mode) {
        // extract attribute information from operation node
        var ownFunction = node.getAttribute("function");
        var typeNum = node.getAttribute("typeNum");

        if ("" + parseInt(typeNum) != typeNum) {
            try {
                typeNum = arisMetaModel.UserDefinedAttributeTypeNum(typeNum);
            } catch (e) {
                typeNum = eval("Constants." + typeNum);
            }
        }

        var value = convertAttributeValue(typeNum, (node.hasAttribute("value")) ? node.getAttribute("value") : null);

        var isControlled = ownFunction.indexOf("control") >= 0;
        var modifier = node.getAttribute("modifier");
        var locale = node.getAttribute("locale");
        if (locale == 0 || locale == null || locale == "")
            locale = -1;

        // in case parent item is a model check if the value contains a object name marker '@{name}'
        // the marker is replaced by the context item name
        if (value != null && parentItem != null && parentItem.KindNum() == Constants.CID_MODEL && !isControlled) {
            value = value.replaceAll("\\@\\{name\\}", contextItem.Name(locale));
            if (contextItem != null && contextItem.KindNum() == Constants.CID_CXNDEF) {
                value = value.replaceAll("\\@\\{toObjectName\\}", contextItem.TargetObjDef().Name(locale));
                value = value.replaceAll("\\@\\{fromObjectName\\}", contextItem.SourceObjDef().Name(locale));
            } else {
                value = value.replaceAll("\\@\\{toObjectName\\}", contextItem.Name(locale));
                value = value.replaceAll("\\@\\{fromObjectName\\}", contextItem.Name(locale));
            }
        }

        // try to locate defined attribute
        var attribute = parentItem.Attribute(typeNum, locale);
        var match = true;

        if (!attribute.IsMaintained())
            match = false;

        if (value != null) {
            switch (arisMetaModel.AttrBaseType(typeNum)) {
                case Constants.ABT_VALUE:
                    if (attribute.MeasureUnitTypeNum() != value)
                        match = false;
                    break;

                default:
                    //replace line separator and compare values
                    if (attribute.value() instanceof String && value instanceof String) {
                        if (attribute.value().replaceAll("\r", "").replaceAll("\n", " ") != value.replaceAll("\r", "").replaceAll("\n", " ") + "")
                            match = false;
                    } else {
                        if (attribute.value() != value + "")
                            match = false;
                    }
            }
        }
        
        // handle db language locale attribute
        var isAttrInDBLocaleSet = true;
        var dbLocale = getDefaultDBLang(db);
        var attributeDbLocale = parentItem.Attribute(typeNum, dbLocale);
        
        if (!attributeDbLocale.IsMaintained())
            isAttrInDBLocaleSet = false;
       
        if (modifier == "inverse")
            match = !match;

        // take action depending on mode
        switch (mode) {
            case M_CHECK_UNSET:
                if (ownFunction.indexOf("target") >= 0 && attribute.IsMaintained())
                    return attribute;
            // otherwise treat like M_CHECK

            case M_CHECK:
                if (match)
                    return attribute;
                else
                    return null;

            case M_CHECK_SET:
                if (isControlled || match)
                    return attribute;
                else
                    return null;

            case M_SET:
                // when the mode is "inverse", make sure the attribute is not there
                if (isControlled) {
                    if (modifier == "inverse")
                        attribute.Delete();
                    else {
                        
                        // check if combined value (AGA-10456)
                        if(arisMetaModel.AttrBaseType(typeNum) == Constants.ABT_COMBINED) {
                            if(!setCombinedAttributeValue(attribute, value)) 
                                throw new OperationException(ImportProvider.WRITE_ERROR, "processAttribute(): Could not set combined attribute with typeNum=" + typeNum);
                        } else if (!attribute.setValue(value))
                            throw new OperationException(ImportProvider.WRITE_ERROR, "processAttribute(): Could not set attribute with typeNum=" + typeNum);
                    }
                    // handle attribute value in Db locale language
                    if(!isAttrInDBLocaleSet && attribute.IsMaintained() && attributeDbLocale.TypeNum() == 1) {
                        if (modifier == "inverse")
                            attributeDbLocale.Delete();
                        else
                            attributeDbLocale.setValue(value);
                    }
                }
                return attribute;

            case M_UNSET:
                if (isControlled)
                    if (!attribute.Delete())
                        throw new OperationException(ImportProvider.WRITE_ERROR, "processAttribute(): Could not delete attribute with typeNum=" + typeNum);
                
                    // handle attribute value in Db locale language
                    if(isAttrInDBLocaleSet && !attribute.IsMaintained() && attributeDbLocale.TypeNum() == 1) {
                        attributeDbLocale.Delete();
                    }
                return true;

            default:
                throw new OperationException(ImportProvider.UNKNOWN_ERROR, "processAttribute(): Encountered unknown mode: " + mode);
        }
    }

    /**
     * Processes a single group node.
     * Groups are end nodes and cannot have any children.
     *
     * @param parentItem item which the group belongs to
     * @param node operation node which describes the group
     * @param mode processing mode for the node
     */
    function processGroup(parentItem, node, mode) {
        // no differentiation between modes, as groups cannot be created or removed
        // --> Just find the group and return
        var groupPath = node.getAttribute("path");
        var groupGUID = node.getAttribute("value");
        var locale = node.getAttribute("locale");
        if (locale == 0)
            locale = -1;

        var theGroup;
        if (groupGUID != null && groupGUID != "")
            theGroup = db.FindGUID(groupGUID, Constants.CID_GROUP);
        else if (groupPath != null && groupPath != "") {
            // check if relative path is used
            if (groupPath.substring(0, 1) == ".")
                switch (contextItem.KindNum()) {
                    case Constants.CID_OBJDEF:
                    case Constants.CID_MODEL:
                        var contextItemGroup = contextItem.Group().Path(locale);
                        groupPath = contextItemGroup + groupPath.substring(1);
                        break;
                    case Constants.CID_CXNDEF:
                        var direction = contextNode.getAttribute("direction");
                        var item;
                        if (direction == "in") {
                            item = contextItem.TargetObjDef();
                        } else {
                            item = contextItem.SourceObjDef();
                        }
                        var contextItemGroup = item.Group().Path(locale);
                        groupPath = contextItemGroup + groupPath.substring(1);
                        break;
                }


            // resolve the object name marker '@{name}' within the group path
            // the marker is replaced by the context item name
            groupPath = (new java.lang.String(groupPath));
            
            // check if the name value is maintained in selected locale and if not, use the database language
            var nameValue = "";
            var dbLocaleId = getDefaultDBLang(db);
            if(!contextItem.Attribute(Constants.AT_NAME, locale).IsMaintained())
                nameValue = contextItem.Attribute(Constants.AT_NAME, dbLocaleId).value();
            else
                nameValue = contextItem.Attribute(Constants.AT_NAME, locale).value();
            
            groupPath = groupPath.replaceAll("\\@\\{name\\}", nameValue);

            if (contextItem != null && contextItem.KindNum() == Constants.CID_CXNDEF) {
                groupPath = groupPath.replaceAll("\\@\\{toObjectName\\}", contextItem.TargetObjDef().Name(locale));
                groupPath = groupPath.replaceAll("\\@\\{fromObjectName\\}", contextItem.SourceObjDef().Name(locale));
            } else {
                groupPath = groupPath.replaceAll("\\@\\{toObjectName\\}", contextItem.Name(locale));
                groupPath = groupPath.replaceAll("\\@\\{fromObjectName\\}", contextItem.Name(locale));
            }

            theGroup = db.Group(getPath(groupPath), locale);

            if (theGroup == null || !theGroup.IsValid()) { //fix for new line separator in group name
                groupPath = groupPath.replaceAll("\n", "\r\n");
                theGroup = db.Group(getPath(groupPath), locale);
            }
        } else
            throw new OperationException(ImportProvider.STRUCTURAL_ERROR, "processGroup(): GUID or path must be specified for groups.");

        if (theGroup == null || !theGroup.IsValid())
            throw new OperationException(ImportProvider.NOT_FOUND_ERROR, "processGroup(): Specified group is not valid: " + groupPath);

        // only return the group (success) when the parent either does not exist yet or is in the same group
        if (parentItem == null)
            return theGroup;
        else
        if (parentItem.Group().equals(theGroup))
            return theGroup;
        else
            return null;
    }

    Array.prototype.contains = function(obj) {
        var i = this.length;
        while (i--) {
            if (!isNaN(this[i])) {
                if (this[i] == obj)
                    return true;
            } else if (this[i].equals(obj)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Inner class defining an exception object.
     * @param p_permanent (boolean) true when the exception means a permanent failure for the import operation; false otherwise
     * @param errorCode one of the defined constants
     * @param p_message exception message to be logged
     */
    function OperationException(errorCode, message) {
        this.errorCode = errorCode;
        this.message = message;
    }

    /**
     * Try a roll back of a set operation by deleting all created items.
     * This should be replaced with a safe transaction mechanism in the reporting framework.
     * Limitations:
     *  - cannot recover deleted items
     *  - cannot recover previous attribute values
     *  - cannot delete created object definitions (reporting framework does not allow this)
     */
    function performRollback(createdItems) {
        createdItems = createdItems.reverse();
        for (var cidx = 0; cidx < createdItems.length; cidx++) {
            try {
                switch (createdItems[cidx].KindNum()) {
                    case Constants.CID_OBJDEF:
                        // object definitions cannot be deleted
                        // createdItems[cidx].Group().Delete(createdItems[cidx]);
                        break;

                    case Constants.CID_CXNDEF:
                        createdItems[cidx].Delete();
                        break;

                    case Constants.CID_OBJOCC:
                    case Constants.CID_CXNOCC:
                        createdItems[cidx].Remove();
                        break;

                    case Constants.CID_GROUP:
                        createdItems[cidx].Parent().Delete(createdItems[cidx]);
                        break;

                    case Constants.CID_MODEL:
                        if (createdItems[cidx].Group() != null)
                            createdItems[cidx].Group().Delete(createdItems[cidx]);
                        break;

                }
            } catch (e) { /* if roll back is broken, we're out of luck */
            }
        }
    }

    /**
     * Determines if a model can be written (including its object & connection occurrences)
     * by trying to set its flags. This will fail when the model is opened by a client.
     * @return true when the model is writable (not openend); false otherwise
     */
    function isWritable(theModel) {
        var theFlags = theModel.Flags();
        try {
            return theModel.SetFlags(theFlags);
        } catch (e) {
            return false;
        }
    }

    function getRealChildren(startNode) {
        var childrenArray = new Array();
        var nodeChildren = startNode.getChildNodes();
        for (var gidx = 0; gidx < nodeChildren.getLength(); gidx++) {
            var childNode = nodeChildren.item(gidx);
            if (childNode.getNodeType() != childNode.ELEMENT_NODE) {
                continue;
            }
            else {
                childrenArray.push(childNode);
            }
        }
        return childrenArray;
    }

    function getNamedChildren(childNodeArray, nodeType) {
        var nodesToBeFound = new Array();
        for (var i = 0; i < childNodeArray.length; i++) {
            if (childNodeArray[i].getTagName() == nodeType) {
                nodesToBeFound.push(childNodeArray[i]);
            }
        }
        if (nodesToBeFound.length > 0) {
            return nodesToBeFound;
        }
        else {
            return null;
        }
    }

    /**
     * Converts an attribute value as contained in the import document
     * into a value as expected by the report framework.
     *
     * @param rawValue attribute value from the import document
     * @return attribute value used by the report framework
     */
    function convertAttributeValue(typeNum, rawValue) {
        if (rawValue == null || rawValue == "")
            return rawValue;

        switch (arisMetaModel.AttrBaseType(typeNum)) {
            case Constants.ABT_BOOL:
                var values = arisMetaModel.AttrValueTypeNums(typeNum);
                // for boolean value attributes the larger value is always true
                for (var i = 0; i < values.length; i++)
                    if (values[i] < rawValue)
                        return true;
                return false;

            case Constants.ABT_VALUE:
                if (rawValue.indexOf("AVT_") >= 0)
                    return eval("Constants." + rawValue);
                else if (arisMetaModel.isUserDefinedAttrType(typeNum)) {
                    // check if value is defined by int value or GUID
                    if ("" + parseInt(rawValue) == rawValue)
                        return parseInt(rawValue);
                    else
                        return arisMetaModel.UserDefinedAttributeValueTypeNum(
                                arisMetaModel.UserDefinedAttributeTypeGUID(typeNum),
                                rawValue);
                } else
                    return parseInt(rawValue);

            case Constants.ABT_DATE:
                return dateFormat.format(new Packages.java.util.Date(parseInt(rawValue)));

            case Constants.ABT_TIME:
                return timeFormat.format(new Packages.java.util.Date(parseInt(rawValue)));

            case Constants.ABT_TIMESTAMP:
                return timestampFormat.format(new Packages.java.util.Date(parseInt(rawValue)));

            default:
                // for all other types hope the data has the proper format
                return rawValue;
        }
    }

    /**
     * Automatically creates connection occurrences for all connections
     * which connect to objects for which object occurences were created.
     */
    function autoCreateConnectionOccurrences() {

        // extract all connection definitions and object occurrences
        // which were created while processing the operation
        var createdConnections = new Array();
        var createdObjectOccurrences = new Array();
        for (var i = 0; i < createdItems.length; i++)
            switch (createdItems[i].KindNum()) {
                case Constants.CID_CXNDEF: createdConnections.push(createdItems[i]); break;
                case Constants.CID_OBJOCC: createdObjectOccurrences.push(createdItems[i]); break;
                default: // don't care
            }

        // process all object occurrences by creating occurrences of all
        // directly connected connections
        for (var oidx = 0; oidx < createdObjectOccurrences.length; oidx++) {
            var objectOccurrence = createdObjectOccurrences[oidx];
            var model = objectOccurrence.Model();
            var object = objectOccurrence.ObjDef();

            for (var cidx = 0; cidx < createdConnections.length; cidx++) {
                var connection = createdConnections[cidx];
                var otherObject = null;
                if (connection.SourceObjDef().equals(object))
                    otherObject = connection.TargetObjDef();
                if (connection.TargetObjDef().equals(object))
                    otherObject = connection.SourceObjDef();

                // if no opponent object was found, it means the connection
                // does not relate to the occurrence and is therefore not relevant
                if (otherObject == null)
                    continue;

                // if the other object has no occurrence in the same model,
                // it is also not relevant
                var otherObjectOccurrences = otherObject.OccListInModel(model);
                if (otherObjectOccurrences.length == 0)
                    continue;

                // if one of the occurrences was created in this run,
                // use it, otherwise simply use first occurrence in list
                var otherObjectOccurrence = null;
                for (var ooidx = 0; ooidx < otherObjectOccurrences.length && otherObjectOccurrence == null; ooidx++)
                    for (var soidx = 0; soidx < createdObjectOccurrences.length && otherObjectOccurrence == null; soidx++)
                        if (otherObjectOccurrences[ooidx].equals(createdObjectOccurrences[soidx]))
                            otherObjectOccurrence = otherObjectOccurrences[ooidx];
                if (otherObjectOccurrence == null)
                    otherObjectOccurrence = otherObjectOccurrences[0];

                // create the connection occurrence
                var newConnectionOccurrence;
                if (connection.SourceObjDef().equals(object))
                    newConnectionOccurrence = model.CreateCxnOcc(objectOccurrence, otherObjectOccurrence, connection, new Array(), false);
                else
                    newConnectionOccurrence = model.CreateCxnOcc(otherObjectOccurrence, objectOccurrence, connection, new Array(), false);

                if (!newConnectionOccurrence.IsValid())
                    throw new OperationException(ImportProvider.NOT_FOUND_ERROR, "processGroup(): Specified group is not valid: " + groupPath);

                createdItems.push(newConnectionOccurrence);
                return;
            }
        }
    }

    function getTargetNode(startNode) {
        var childrenNodes = getRealChildren(startNode);
        for (var cidx = 0; cidx < childrenNodes.length; cidx++) {
            var ownFunction = childrenNodes[cidx].getAttribute("function");
            if (ownFunction != null && ownFunction != "" && ownFunction.indexOf("target") >= 0) {
                return childrenNodes[cidx];
            }
            else {
                var newChildrenNodes = getRealChildren(childrenNodes[cidx]);
                if (newChildrenNodes.length > 0) {
                    var targetNode = getTargetNode(childrenNodes[cidx]);
                    return targetNode;
                }
            }
        }
        return null;
    }

    /**
     * Gets the db item for the given guid using the passed property map
     * for unique identification of the item.
     * @param guid the item guid to find.
     * @param propertyValueMap the property value map used for unique identification of the item.
     *
     * @return the found item
     */
    function findItem(guid, propertyValueMap) {
        return itemFinder.findItem(
                mappedItemPropertyNameOfCurrentOperation,
                mappedItemTypeNameOfCurrentOperation,
                guid,
                propertyValueMap,
                db);
    }


    /**
     * Gets all property name, value pairs defined for the given node as a map
     * of property name/property value. If the nodes doesn't define any property
     * an empty map is returned.
     * @param the node the node to look up
     *
     * @return  map of property name/property value pairs
     */
    function getPropertyValueMapForNode(node) {

        var propertyValueMap = new Packages.java.util.HashMap();
        var childNodes = getRealChildren(node);

        // get property nodes for object identification if defined
        var propertyNodes = getNamedChildren(childNodes, "property");
        if (propertyNodes == null)
            return propertyValueMap;

        for (var i = 0; i < propertyNodes.length; i++) {

            propertyName = propertyNodes[i].getAttribute("name");
            propertyValue = propertyNodes[i].getAttribute("value");

            if (propertyName != null && propertyValue != null)
                propertyValueMap.put(propertyName, propertyValue);

        }

        return propertyValueMap;

    }


    /**
     * Gets a working symbol num for creating occurrences in the given model,
     * while trying to benefit from a default symbol if any is set.
     *
     * @param model model for which to query the symbols
     * @param object object for which to query the symbols
     * @return symbol type num
     */
    function getBestSymbolTypeNum(model, object) {
        var allowedSymbolNums = arisMetaModel.Symbols(model.TypeNum(), object.TypeNum());

        // if the default symbol num is allowed in the current model, it is the best guess
        var defaultSymbolNum = object.GetDefaultSymbolNum();
        for (var i = 0; i < allowedSymbolNums.length; i++)
            if (defaultSymbolNum == allowedSymbolNums[i])
                return defaultSymbolNum;

        // otherwise simply select the first symbol from the list
        return allowedSymbolNums[0];
    }

    /**
     * Inner class defining an definition / occurrence pair.
     */
    function DefOccPair(def, occ) {
        this.def = def;
        this.occ = occ;
    }

    this.registerPostProcessDescFunction = function(func) {
        postProcessDescFunction = func;
    }

    function callPostProcessDescFunction(description) {
        try {
            if (postProcessDescFunction != null) {
                return postProcessDescFunction(description)
            }
            else {
                return description;
            }
        } catch(e) {
            return description;
        }
    }

    this.getModelsToLayout = function() {
        return modelsToLayout;
    }

    /**
     * Marks the current context object as modified by the import.
     * This information is used to call post processing handlers after all mappings operations were imported.
     */
    function markAffectedContextObject() {
        var guid = contextItem.GUID();

        // get or create set containing changed properties for the current context item
        var propertySet = affectedContextObjectMap.get(guid);
        if (propertySet == null) {
            propertySet = new Packages.java.util.HashSet();
            affectedContextObjectMap.put(guid, propertySet);
        }

        // add current type:property to set
        propertySet.add(mappedItemTypeNameOfCurrentOperation + ":" + mappedItemPropertyNameOfCurrentOperation);
    }

    /**
     * Calls post import handler for each context object which was affected by the import.
     */
    function callPostImportFunction() {
        // if no handler was set, abort
        if (postImportFunction == null)
            return;

        try {
            var entries = affectedContextObjectMap.entrySet().iterator();
            while (entries.hasNext()) {
                var entry = entries.next();
                postImportFunction(entry.getKey(), entry.getValue());
            }

        } catch(e) {
            // The post import function must not throw any exceptions and do
            // all necessary logging itself.
            // This catch only makes sure that the import is not affected by
            // incorrect implementations.
        }
    }


    /**
     * Ensures that for attribute operations the corresponding and appropriated operations/data structure
     * will only be created if those not yet exist. To ensure this requirement the following preprocessing
     * is done:
     *
     * - Check if the whole structure except the attribute exist
     * (true) -> remove all "control" tags except for the target attribute
     * (false) return the original structure
     *
     * @param contextNode the context note of the attribute operation
     *
     * @return the adapted operation structure
     */
    function preProcessAttributeOperation(contextNode) {

        contextNodeCp = contextNode.cloneNode(true);
        theAttributeNode = getTargetNode(contextNodeCp);
        theAttributeParentNode = theAttributeNode.getParentNode();
        theAttributeParentNode.removeChild(theAttributeNode);

        // now remove all "control" tags
        setAllFunctionValuesToFilter(contextNodeCp);

        // check structure except attribute
        var isContextOfTypeConnection = (contextNodeCp.getTagName() == "connection");
        if (isContextOfTypeConnection) {
            exists = processConnection(null, contextNodeCp, M_CHECK);
        } else
            exists = processObject(null, contextNodeCp, M_CHECK);

        if (exists != null || exists == true) {
            theAttributeParentNode.appendChild(theAttributeNode);
            return contextNodeCp;
        } else {
            return contextNode;
        }
    }

    function getFollowChildMode(mode) {
        switch (mode) {
            case M_CHECK:
                return M_CHECK;

            case M_UNSET:
            case M_CHECK_UNSET:
                return M_CHECK_UNSET;

            case M_CHECK_SET:
            case M_SET:
                return M_CHECK_SET;

            default:
                throw new OperationException(ImportProvider.UNKNOWN_ERROR, "getFollowChildMode(): Unknown mode encountered: " + mode);
        }
    }

    /**
     * Sets all function values for the passed structure to "filter".
     *
     * @param startNode to node where the recursive precedure is started.
     */
    function setAllFunctionValuesToFilter(startNode) {

        var ownFunction = startNode.getAttribute("function");
        if (ownFunction != null && ownFunction != "") {
            startNode.setAttribute("function", "filter");
        }

        var childrenNodes = getRealChildren(startNode);
        for (var cidx = 0; cidx < childrenNodes.length; cidx++) {
            setAllFunctionValuesToFilter(childrenNodes[cidx]);
        }
    }

    /**
     * Sets the post import function to be called once all operations were processed.
     */
    this.registerPostImportFunction = function(func) {
        postImportFunction = func;
    }

    // control if context object is in delayed state
    function preControlContextObjectState(contextNode, description) {
        var contextItemGUID = contextNode.getAttribute("value");

        // abort if the object is in delayed mode
        if (delayedGUIDSet.contains(contextItemGUID))
            throw new OperationException(ImportProvider.TEMPORARY_ERROR, "handle(): Context object is in delayed mode. Its changes must be delayed too.", -1, description);
    }
    
    /**
     * Check if between 2 objDef's exists connection of specified typeNum (and in case of mapped connection, also of specified GUID).
     * If it exists, it returns the concrete CxnDef (and eventually just another occurrence is created, not the CxnDef)
     */
    function checkIfCxnDefExist(objDef1, objDef2, typeNum, cxnGUID, node) {
        var cxnDefList = objDef1.CxnListFilter(Constants.EDGES_INOUTASSIGN, typeNum);
        for(var i = 0; i<cxnDefList.length; i++) {
            if(cxnDefList[i].SourceObjDef().equals(objDef2) || cxnDefList[i].TargetObjDef().equals(objDef2)) {
                var attrNode = getCxnAttributeNode(node);
                if(cxnGUID != null && cxnGUID != "" && cxnDefList[i].GUID() == cxnGUID) {
                    if(attrNode != null) {
                        if(!checkAttributeValue(cxnDefList[i], attrNode))
                            return null;
                    }
                    return cxnDefList[i];
                } else if(cxnGUID == null || cxnGUID == "") {
                    if(attrNode != null) {
                        if(!checkAttributeValue(cxnDefList[i], attrNode))
                            return null;
                    }
                    return cxnDefList[i];
                }
            }
        }
        return null;
    }
    
    // check if imported connection has attribute (takes from import config xml) and if yes, return this node
    function getCxnAttributeNode(node) {
        var children = getRealChildren(node);    
        var attrChild = null;
        if(children != null) {
            var attrChildren = getNamedChildren(children,"attribute");
            if(attrChildren != null && attrChildren.length > 0)
                // according to config rules, connection can have only one attr node
                attrChild = attrChildren[0];
        }
        return attrChild;
    }
    
    // check the value of specific attribute (if it exists) a return true if it matches the expecting value
    function checkAttributeValue(cxnDef, attrNode) {
        // get attr TypeNums
        var typeNum = attrNode.getAttribute("typeNum");

        if ("" + parseInt(typeNum) != typeNum) {
            try {
                typeNum = arisMetaModel.UserDefinedAttributeTypeNum(typeNum);
            } catch (e) {
                typeNum = eval("Constants." + typeNum);
            }
        }
        
        // find locale and check if the attribute typeNum of cxn is matching the typeNum of attrNode
        var locale = attrNode.getAttribute("locale");
        if (locale == 0 || locale == null || locale == "")
            locale = -1;
        var cxnAttr = cxnDef.Attribute(typeNum,locale);
        
        // check if matching attribute typeNum has value
        var cxnAttrValue = "";
        if(cxnAttr != null) {
            cxnAttrValue = cxnAttr.MeasureUnitTypeNum();    
        }
        
        // if it has value, get it and check if it matches the expecting value
        if(cxnAttrValue != "" && cxnAttrValue != null) {
            var value = convertAttributeValue(typeNum, (attrNode.hasAttribute("value")) ? attrNode.getAttribute("value") : null);
            if(!attrNode.hasAttribute("value"))
                return false;
            else {
                if(cxnAttrValue == value)
                    return true;
            }
        }
        
        return false;
    }
    
     /**
     * Pre-check if cxnDef between contextItem and object exists (and therefore if it needs to be created/deleted)
     */
    function checkCxnDefExistance(contextNode) {
        // find parameters of specified connection and object
        var cxnNodes = getNamedChildren(getRealChildren(contextNode), "connection");
        if (cxnNodes == null) return null;
        var cxnNode = cxnNodes[0];
        var cxnType = eval("Constants." + cxnNode.getAttribute("typeNum"));
        
        // in case of mappedConnection, the value of connection is also defined
        var cxnGUID = cxnNode.getAttribute("value");
        var objCxns = contextItem.CxnListFilter(Constants.EDGES_INOUTASSIGN, cxnType);     
        var object = db.FindGUID((getNamedChildren(getRealChildren(cxnNode), "object")[0]).getAttribute("value"));
        
        // check if specified CxnDef exists or was deleted
        var seekedCxnDef = null;
        for(var i = 0; i<objCxns.length; i++) {
            if(objCxns[i].SourceObjDef().equals(object) || objCxns[i].TargetObjDef().equals(object)) {
                seekedCxnDef = objCxns[i];
                break;
            }
        }
        
        // check in case of mapped connection - seekedCxnDef has to be of specified GUID ("value" attribute) - if it doesn't exist, return null
        if(cxnGUID != "" && cxnGUID != null && seekedCxnDef != null && seekedCxnDef.GUID() != cxnGUID) 
            return null;
        
        // if specified cxnDef exists, then operation can be skipped
        if(seekedCxnDef == null)
            return false;
        else
            return true;
    } 
    
    function getDefaultDBLang(db) {
	    var langList = db.LanguageList();
	    for (dbLang in langList) {
		    if (langList[dbLang].isDefault()) {
			    return "" + langList[dbLang].LocaleId();
		    }
	    }
	    return "";
    }
    
    function setCombinedAttributeValue(attribute, value) {
        if(value != null && !value.equals("")) {
            var combinedValues = value.split("~");
            if(combinedValues.length == 2) {
                return attribute.setValue(combinedValues[0], combinedValues[1]);
            }
        }
        return false;
    }

    /** format for ABT_TIMESTAMP */
    var timestampFormat = new Packages.java.text.SimpleDateFormat("HH:mm:ss;MM/dd/yyyy");
    // timestamp attributes are always formated in GMT0 representation
    timestampFormat.setTimeZone(new Packages.java.util.TimeZone.getTimeZone("GMT0"));
    
    /** format for ABT_DATE */
    var dateFormat = new Packages.java.text.SimpleDateFormat("MM/dd/yyyy");
    /** format for ABT_TIME */
    var timeFormat = new Packages.java.text.SimpleDateFormat("HH:mm:ss");
    
}
