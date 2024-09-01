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

/*
 Methods supporting the 'best match' approach to models' identification
 */

function BestMatchSupport(database) {
    /** Used for quick access to the ARIS database. */
    var db = database;

    /** Used for quick access to the ARIS method. */
    var arisMetaModel = db.ActiveFilter();
     
    /**
     * List of models which have been checked for write access for
     * the current operation.
     */
    var checkedModels = new Packages.java.util.HashSet();
    
    var foundModels = new Packages.java.util.HashMap();
    
    // the list of nodes 
    
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

    this.processModelApplyingBestMatchApproach = function(parentItem, node, mode) {
        var childNodes = getRealChildren(node);
        var childMode = getFollowChildMode(mode);
        var typeNum = getModelTypeNum(node);
        var group;
    
        // distinguish required and optional model's nodes
        var requiredNodes = new Packages.java.util.ArrayList();
        var optionalNodes = new Packages.java.util.ArrayList();
    
        var optionalNodesTags = new Array();
        
        var theModel = null;
    
        for (var r = 0; r < childNodes.length; r++) {
            if (childNodes[r].getAttribute("optional").isEmpty()) {
                requiredNodes.add(childNodes[r]);
            }
            else
                optionalNodes.add(childNodes[r]);
            
            optionalNodesTags.push(childNodes[r].getTagName());
        }
    
        if (!optionalNodesTags.contains("modelType"))
            requiredNodes.add(node);
    
        if (!foundModels.containsKey(node)) {
            var requiredModelsList = new Array();
    
            // find the list of potential target models by processing its required criteria
            if (requiredNodes.size() > 0) {
                var requiredModelsList = processModelsRequiredCriteria(requiredNodes, node, childMode);
    
                if (requiredModelsList.length == 0) {
                    requiredModelsList[0] = this.createNewModelByCriteria(node, childNodes);
                    if (requiredModelsList[0] == null || !requiredModelsList[0].IsValid())
                        throw new OperationException(ImportProvider.NOT_FOUND_ERROR, "processModel(): The newly created model could not be found.");
                }
            }
    
            // process the optional criteria of all models that correspond to processed required criteria
            if (optionalNodes.size() > 0 && requiredModelsList.length != 1) {
                var optionalModelsList = new Packages.java.util.HashMap();
    
                var optionalModelsList = processModelsOptionalCriteria(optionalNodes, childNodes, requiredModelsList);
    
                var maxLoad = findMaxLoadNumber(optionalModelsList);
                var modelsSet = findBestMatchModelsSet(optionalModelsList, maxLoad);
    
                if (modelsSet != null && modelsSet.length > 0)
                    theModel = db.FindGUID(modelsSet[0]);
                else {
                    if(requiredModelsList != null && requiredModelsList.length > 0)
                        theModel = requiredModelsList[0];
                    else
                        theModel = null;
                }
            } else {
                theModel = requiredModelsList[0];
            }
        } else 
            theModel = foundModels.get(node);
        
        // if the model can not be written to, stop processing the operation
        if (theModel != null && checkedModels.add(theModel))
            if (!isWritable(theModel))
                throw new OperationException(ImportProvider.TEMPORARY_ERROR, "processModel(): The model is not writable. Try again later.");
        
        // remember the model for the given node if everythin was ok
        if (theModel != null)
            foundModels.put(node, theModel);
    
        return theModel;
    }
    
    
    this.getRequiredNodesTags = function(node) {
        var childNodes = getRealChildren(node);
        var requiredNodesTags = new Array();
        for (var r = 0; r < childNodes.length; r++) {
            if (childNodes[r].getAttribute("optional").isEmpty()) {
                requiredNodesTags.push(childNodes[r].getTagName());
            }
        }
        return requiredNodesTags;
    }
    
    
    this.createNewModelByCriteria = function(node, childNodes) {
        var modelName = null;
        var modelGroupPath = null;
        var locale = null;
        var assigned = false;
        var occurrence = null;
        var group = null;
        var modelType = null;
        var oldModelType = null;
        childNodes.push(node);
    
        for (var i = 0; i < childNodes.length; i++) {
            if (childNodes[i].getTagName().equals("attribute") && childNodes[i].getAttribute("typeNum").equals("AT_NAME")) {
                modelName = childNodes[i].getAttribute("value");
            } else if (childNodes[i].getTagName().equals("group")) {
                modelGroupPath = childNodes[i].getAttribute("path");
                locale = childNodes[i].getAttribute("locale");
            } else if (childNodes[i].getTagName().equals("occurrence")) {
                occurrence = childNodes[i].getAttribute("typeNum");
            } else if (childNodes[i].getTagName().equals("assignment")) {
                assigned = true;
            } else if (childNodes[i].getTagName().equals("modelType")) {
                modelType = getModelType(childNodes[i]);
                // 'model' is present in order to backcompatibility issues (i.e. when user definer model type within node 'model' and not within the node 'modelType')
            } else if (childNodes[i].getTagName().equals("model")) {
                if(!childNodes[i].getAttribute("typeNum").isEmpty()) {
                    oldModelType = getModelType(childNodes[i])
                }
            }
        }
    
        // locale
        if (locale == null || locale == "" || locale == 0)
            locale = -1;
        
        // modelType - choosing oldModelType only when modelType is not defined (backcompatibility), otherwise modelType has higher priority
        if (modelType == null && oldModelType != null)
            modelType = oldModelType;
    
        // modelName
        if (modelName != null) {
            modelName = translatePlaceholder(modelName, locale);
        } else {
            modelName = contextItem.Attribute(Constants.AT_NAME, locale).value();
        }
    
        // modelGroupPath => modelGroup
        if (modelGroupPath != null) {
            modelGroupPath = translatePlaceholder(modelGroupPath, locale);
                // check if relative path is used
                if (modelGroupPath.substring(0, 1) == ".") {
                    switch (contextItem.KindNum()) {
                        case Constants.CID_OBJDEF:
                        case Constants.CID_MODEL:
                            var contextItemGroup = contextItem.Group().Path(locale);
                            modelGroupPath = contextItemGroup + modelGroupPath.substring(1);
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
                            modelGroupPath = contextItemGroup + modelGroupPath.substring(1);
                            break;
                    }
                }
            
            group = db.Group(getPath(modelGroupPath), locale);
            if (group == null || !group.IsValid()) {
                group = createGroup(modelGroupPath, locale);
            }
        } else {
            group = contextItem.Group();
        }
    
        // create new model
        var modelArray = group.ModelListFilter(modelName, locale, modelType, Constants.AT_NAME);
        var model = null;
        if (modelArray.length == 0)
            model = group.CreateModel(modelType, modelName, locale);
        else
            model = modelArray[0];
    
        if (model == null || !model.IsValid())
            throw new OperationException(ImportProvider.WRITE_ERROR, "processModel(): Could not create new model");
    
        if (group.ModelList().contains(model)) {
            var contextItemOcc = contextItem.OccListInModel(model);
            
            if (occurrence != null) {
                if(contextItemOcc.length == 0) {
                    var occ = model.CreateObjOcc(eval("Constants." + occurrence), contextItem, 300, 300, true);
                    if (occ == null || !occ.IsValid())
                        throw new OperationException(ImportProvider.WRITE_ERROR, "processOcc(): Could not create occurrence");
                    
                } else {
                    if(contextItemOcc.length > 1) 
                        throw new OperationException(ImportProvider.WRITE_ERROR, "processOcc(): There exist more than one contextItem occurrence in specified model");
                    
                    var occ = contextItemOcc[0];
                    if(occ.SymbolNum() != eval("Constants." + occurrence)) {
                        try {
                            occ.setSymbol(eval("Constants." + occurrence));
                        } catch(e) {
                            // symbol couldn't be changed
                        }
                    }
                }            
            } else {
                var occ = null;
                if(contextItemOcc.length == 0) 
                    occ = model.CreateObjOcc((contextItem.GetDefaultSymbolNum() != 0)? contextItem.GetDefaultSymbolNum() : getBestSymbolTypeNum(model, contextItem), contextItem, 300, 300, true);
                else
                    occ = contextItemOcc[0];
                
                if (occ == null || !occ.IsValid())
                    throw new OperationException(ImportProvider.WRITE_ERROR, "processOcc(): Could not create occurrence");            
            }
            
            if (assigned) {
                var contextItemOcc = contextItem.OccListInModel(model);
                var occ = null;
                if(contextItemOcc.length == 0) 
                    occ = model.CreateObjOcc((contextItem.GetDefaultSymbolNum() != 0)? contextItem.GetDefaultSymbolNum() : getBestSymbolTypeNum(model, contextItem), contextItem, 300, 300, true);
                else
                    occ = contextItemOcc[0];    
                
                if (occ == null || !occ.IsValid())
                    throw new OperationException(ImportProvider.WRITE_ERROR, "processOcc(): Could not create occurrence");         
                    
                var assign = contextItem.CreateAssignment(model);
                if (!assign)
                    throw new OperationException(ImportProvider.WRITE_ERROR, "processAssign(): Could not create new assignment");       
            }        
        }
    
        return model;
    }
    
    function preProcessModelsRequiredCriteria(modelGroup, modelName, modelType, locale) {
        // preprocessing the required criteria modelGroup, modelName and modelType (other required criteria are handled elsewhere, this is only preprocessing
        // in order to get the smallest possible set of potential models)
        var filterModelList = new Array();
    
        if (modelType != null && modelGroup != null && modelName != null) {
            filterModelList = modelGroup.ModelListFilter(modelName, locale, modelType, Constants.AT_NAME);
        } else if (modelType != null && modelGroup != null) {
            filterModelList = modelGroup.ModelList(false, modelType);
        } else if (modelType != null && modelName != null) {
            filterModelList = db.Find(Constants.SEARCH_MODEL, modelType, Constants.AT_NAME, locale, modelName, Constants.SEARCH_CMP_EQUAL);
        } else if (modelGroup != null && modelName != null) {
            filterModelList = modelGroup.ModelListFilter(modelName, locale);
        } else if (modelType != null) {
            filterModelList = db.Find(Constants.SEARCH_MODEL, modelType);
        } else if (modelGroup != null) {
            filterModelList = modelGroup.ModelList();
        } else if (modelName != null) {
            filterModelList = db.Find(Constants.SEARCH_MODEL, Constants.AT_NAME, locale, modelName, Constants.SEARCH_CMP_EQUAL)
        } else {
            filterModelList = db.Find(Constants.SEARCH_MODEL);
        }
    
        return filterModelList;
    }
    
    function processModelsOptionalCriteria(optionalNodes, childNodes, requiredModels) {
        var modelGroup = null;
        var modelName = null;
        var modelType = null;
        var occurrenceSymbol = null;
        var assigned = false;
        var locale = -1;
    
        for (var i = 0; i < optionalNodes.size(); i++) {
            if (optionalNodes.get(i).getTagName() == "group") {
                var groupNode = getModelNode(childNodes, "group");
                modelGroup = checkOptionalNodeContent(groupNode, null);
                locale = (modelGroup != null && !groupNode.getAttribute("locale").isEmpty()) ? groupNode.getAttribute("locale") : -1;
            } else if (optionalNodes.get(i).getTagName() == "attribute" && optionalNodes.get(i).getAttribute("typeNum").equals("AT_NAME")) {
                var nameNode = getModelNode(childNodes, "name");
                modelName = checkOptionalNodeContent(nameNode, locale);
            } else if (optionalNodes.get(i).getTagName() == "modelType") {
                var typeNumNode = getModelNode(childNodes, "modelType");
                modelType = checkOptionalNodeContent(typeNumNode, locale);
            } else if (optionalNodes.get(i).getTagName() == "occurrence") {
                var occurrenceNode = getModelNode(childNodes, "occurrence");
                occurrenceSymbol = checkOptionalNodeContent(occurrenceNode, locale);
            } else if (optionalNodes.get(i).getTagName() == "assignment") {
                var assignedNode = getModelNode(childNodes, "assignment");
                assigned = checkOptionalNodeContent(assignedNode, locale);
            }
        }
    
        // create map of required models with contained optional criteria
        var requiredModelsMap = preProcessOptionalModelCriteria(requiredModels, optionalNodes);
        var optionalMap = new Packages.java.util.HashMap();
    
        // create map of required model guid and a sum of the weights of fulfiled optional criteria (i.e. guid = 24)
        var iterator = requiredModelsMap.entrySet().iterator();
        while (iterator.hasNext()) {
            var element = iterator.next();
            if (modelType != null && element.getValue().getTypeNum() == modelType)
                optionalMap = addToLoadMap(optionalMap, element.getKey(), typeNumNode.getAttribute("optional"));
            if (modelName != null && element.getValue().getName() == modelName)
                optionalMap = addToLoadMap(optionalMap, element.getKey(), nameNode.getAttribute("optional"));
            if (modelGroup != null && element.getValue().getGroup().equals(modelGroup))
                optionalMap = addToLoadMap(optionalMap, element.getKey(), groupNode.getAttribute("optional"));
            if (occurrenceSymbol != null && element.getValue().getOccurrence().contains(eval("Constants." + occurrenceSymbol)))
                optionalMap = addToLoadMap(optionalMap, element.getKey(), occurrenceNode.getAttribute("optional"));
            if (assigned && element.getValue().getAssignement())
                optionalMap = addToLoadMap(optionalMap, element.getKey(), assignedNode.getAttribute("optional"));
        }
         
        return optionalMap;
    }
    
    Array.prototype.max = function() {
        var max = this[0];
        var len = this.length;
        for (var i = 1; i < len; i++) if (this[i] > max) max = this[i];
        return max;
    }
    
    function findMaxLoadNumber(modelsMap) {
        var numArray = new Array();
        if (modelsMap != null && modelsMap.size() > 0) {
            var it = modelsMap.values().iterator();
            while (it.hasNext()) {
                var next = it.next();
                if (next != null)
                    numArray.push(parseInt(next));
            }
            return numArray.max();
        } else
            return -1;
    }
    
    function findBestMatchModelsSet(modelsMap, maxLoad) {
        var bestMatchArray = new Array();
        if (modelsMap != null && modelsMap.size() > 0 && maxLoad != -1) {
            var it = modelsMap.entrySet().iterator();
            while (it.hasNext()) {
                var mapEntry = it.next();
                if (parseInt(mapEntry.getValue()) == maxLoad)
                    bestMatchArray.push(mapEntry.getKey());
            }
            return bestMatchArray;
        } else
            return null;
    
    }
    
    function checkOptionalNodeContent(node, locale) {
        if (node != null && !node.getAttribute("optional").isEmpty()) {
            var nodeTag = node.getTagName();
            if (!isNaN(node.getAttribute("optional"))) {
                if (nodeTag == "group") {
                    try {
                        return processGroup(null, node, M_CHECK);
                    } catch(e) {
                        return null;
                    }
                }
                else if (nodeTag == "attribute")
                    return translatePlaceholder(node.getAttribute("value"), locale);
                else if (nodeTag == "occurrence")
                    return node.getAttribute("typeNum");
                else if (nodeTag == "assignment")
                    return true;
                else if (nodeTag == "modelType") {
                    try {
                        return arisMetaModel.UserDefinedModelTypeNum(node.getAttribute("typeNum"));
                    } catch (e) {
                        return eval("Constants." + node.getAttribute("typeNum"));
                    }
                }
            }
            else
                throw new OperationException(ImportProvider.STRUCTURAL_ERROR, "processModelsOptionalCriteria(): Optional parameter must be number, instead, it is: " + node.getAttribute("optional"));
        }
        return null;
    }
    
    function addLoadToCorrespondingModels(models, optModelsList, load) {
        if (models.length > 0) {
            for (var i = 0; i < models.length; i++) {
                models[i] = db.FindGUID(models[i]);
                if (!optModelsList.containsKey(models[i])) {
                    optModelsList.put(models[i], parseInt(load));
                } else {
                    var modelValue = optModelsList.get(models[i]);
                    modelValue = parseInt(modelValue) + parseInt(load);
                    optModelsList.remove(models[i]);
                    optModelsList.put(models[i], modelValue);
                }
            }
        }
    }
    
    function createGroup(modelGroupPath, locale) {
        var groupPath = getPath(modelGroupPath);
        var rootGroup = db.RootGroup();
        var lastPath = null;
        var isNewPathSection = false;
    
        for (var i = 0; i < groupPath.length; i++) {
            
            if(i == 0) {
                if(groupPath[i] != rootGroup.Path(locale))
                    throw new OperationException(ImportProvider.STRUCTURAL_ERROR, 
                    "Invalid roout group: " + groupPath[i]);             
                
                lastPath = rootGroup;
                continue;
            }
            
            if(!isNewPathSection) {
                var childs = lastPath.Childs()
                var foundChild = null;
                
                for(var j = 0; j < childs.length; j++) {
                    if(groupPath[i] == childs[j].Name(locale)) {
                        foundChild = childs[j];
                        break;
                    }
                }
                
                if(foundChild != null) {
                    lastPath = foundChild;
                    continue;
                } 
                
                isNewPathSection = true;
            }
            
            var newPath = lastPath.CreateChildGroup(groupPath[i], locale);
            if(!newPath.IsValid())
                throw new OperationException(ImportProvider.STRUCTURAL_ERROR, 
                    "Could not create child group: " + groupPath[i] + " under: " + lastPath.Path(locale));
                    
           lastPath = newPath;
            
        }

        return lastPath;
    }
    
    // processing all models required criteria
    function processModelsRequiredCriteria(requiredNodes, node, childMode) {
        var childNodes = getRealChildren(node);
        var typeNumNode = null;
        var modelGroup = null;
        var modelName = null;
        var modelType = null;
        var occurrence = false;
        var occurrenceSymbol = false;
        var assigned = false;
        var locale = -1;
    
        // checking out which criteria are actually required and setting them the value according the configuration
        for (var i = 0; i < requiredNodes.size(); i++) {
            if (requiredNodes.get(i).getTagName() == "group") {
                var groupNode = getModelNode(childNodes, "group");
                try {
                    modelGroup = processGroup(null, groupNode, M_CHECK);
                } catch(e) {
                    return new Array();
                }
                locale = (modelGroup != null && !groupNode.getAttribute("locale").isEmpty()) ? groupNode.getAttribute("locale") : -1;
            } else if (requiredNodes.get(i).getTagName() == "attribute" && requiredNodes.get(i).getAttribute("typeNum").equals("AT_NAME")) {
                var nameNode = getModelNode(childNodes, "name");
                modelName = translatePlaceholder(nameNode.getAttribute("value"), locale);
            } else if (requiredNodes.get(i).getTagName() == "modelType") {
                typeNumNode = getModelNode(childNodes, "modelType");
                modelType = getModelType(typeNumNode);
            } else if (requiredNodes.get(i).getTagName() == "model") {
                // backcompatibility issue: check if typeNum is defined in old way (as a model node attribute)
                if (!node.getAttribute("typeNum").isEmpty()) {
                    modelType = getModelType(node);
                }
            } else if (requiredNodes.get(i).getTagName() == "occurrence") {
                occurrence = true;
                var occurrNode = getModelNode(childNodes, "occurrence")
                occurrenceSymbol = occurrNode.getAttribute("typeNum");
            } else if (requiredNodes.get(i).getTagName() == "assignment") {
                assigned = true;
            }
        }
    
        // preprocess the list of models with modelGroup, name and type
        var filteredModelsList = preProcessModelsRequiredCriteria(modelGroup, modelName, modelType, locale);
        var requiredModelsList = new Array();
    
        // check other required criteria - if they're defined (e.g. occurrence and assignment). Dealing now with already filtered model list.
        for (var i = 0; i < filteredModelsList.length; i++) {
            if (assigned) {
                if (!contextItem.AssignedModels().contains(filteredModelsList[i]))
                    continue;
            }
    
            if (occurrence) {
                if (filteredModelsList[i].ObjOccListBySymbol(eval("Constants." + occurrenceSymbol)).length == 0)
                    continue;
            }
            requiredModelsList.push(filteredModelsList[i]);
        }
    
        return requiredModelsList;
    }
    
    function getModelType(node) {
        try {
            return arisMetaModel.UserDefinedModelTypeNum(node.getAttribute("typeNum"));
        } catch (e) {
            return eval("Constants." + node.getAttribute("typeNum"));
        }
    }
    
    function getModelTypeNum(node) {
        var childNodes = getRealChildren(node);
        var modelType = getNamedChildren(childNodes, "modelType");
        var typeNum = null;
    
        // if 'modelType' element is not present, take value of typeNum in 'model' element. If both of them are present, take 'modelType' value
        if (modelType != null) {
            if (modelType[0].getAttribute("optional").isEmpty()) {
                try {
                    typeNum = arisMetaModel.UserDefinedModelTypeNum(modelType[0].getAttribute("typeNum"));
                } catch (e) {
                    typeNum = eval("Constants." + modelType[0].getAttribute("typeNum"));
                }
            }
        }
        else {
            try {
                typeNum = arisMetaModel.UserDefinedModelTypeNum(node.getAttribute("typeNum"));
            } catch (e) {
                typeNum = eval("Constants." + node.getAttribute("typeNum"));
            }
        }
    
        return typeNum;
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
    
    function getModelNode(childNodes, nodeTag) {
        var node = null;
    
        // find name attribute
        if (nodeTag == "name") {
            var attrNodes = getNamedChildren(childNodes, "attribute");
            if (attrNodes != null) {
                for (var i = 0; i < attrNodes.length; i++) {
                    if (attrNodes[i].getAttribute("typeNum").equals("AT_NAME")) {
                        node = attrNodes[i];
                        continue;
                    }
                }
            }
        } else
            node = (getNamedChildren(childNodes, nodeTag) != null && getNamedChildren(childNodes, nodeTag).length > 0) ? getNamedChildren(childNodes, nodeTag)[0] : null;
        return node;
    }
    
    
    function RequiredModel(typeNum, name, group, occurrence, assignement) {
        this.typeNum = typeNum;
        this.name = name;
        this.group = group;
        this.occurrence = occurrence;
        this.assignement = assignement;
    
        this.getTypeNum = function() {
            return this.typeNum;
        };
        this.getName = function() {
            return this.name;
        };
        this.getGroup = function() {
            return this.group;
        };
        this.getOccurrence = function() {
            return this.occurrence;
        };
        this.getAssignement = function() {
            return this.assignement;
        };
    }
    
    function preProcessOptionalModelCriteria(requiredModels, optionalNodes) {
        var typeNumOp = null;
        var nameOp = null;
        var groupOp = null;
        var occurrenceOp = null;
        var assignementOp = null;
    
        var typeNumCheck = false;
        var nameCheck = false;
        var groupCheck = false;
        var occurrenceCheck = false;
        var assignementCheck = false;
    
        var modelsMap = new Packages.java.util.HashMap();
        var locale = -1;
    
        if (requiredModels.length == 0)
            requiredModels = db.Find(Constants.SEARCH_MODEL);
    
        for (var i = 0; i < optionalNodes.size(); i++) {
            var nodeTag = optionalNodes.get(i).getTagName();
    
            if (nodeTag.equals("modelType"))
                typeNumCheck = true;
            else if (nodeTag.equals("attribute"))
                nameCheck = true;
            else if (nodeTag.equals("group")) {
                groupCheck = true;
                (!optionalNodes.get(i).getAttribute("locale").isEmpty()) ? optionalNodes.get(i).getAttribute("locale") : -1;
            } else if (nodeTag.equals("occurrence"))
                occurrenceCheck = true;
            else if (nodeTag.equals("assignment"))
                assignementCheck = true;
        }
    
        for (var j = 0; j < requiredModels.length; j++) {
            var model = requiredModels[j];
            if (model == null || !model.IsValid())
                continue;
    
            if (typeNumCheck) {
                typeNumOp = model.TypeNum();
            }
    
            if (nameCheck) {
                nameOp = model.Name(locale);
            }
    
            if (groupCheck) {
                groupOp = model.Group();
            }
    
            if (occurrenceCheck) {
                var occList = model.ObjOccList();
                var occSymbolList = new Array();
                for (var k = 0; k < occList.length; k++) {
                    occSymbolList.push(occList[k].getSymbol());
                }
                occurrenceOp = occSymbolList;
            }
    
            if (assignementCheck) {
                if (contextItem.AssignedModels().contains(model))
                    assignementOp = true;
                else
                    assignementOp = false;
            }
    
            modelsMap.put(model.GUID(), new RequiredModel(typeNumOp, nameOp, groupOp, occurrenceOp, assignementOp));
        }
        return modelsMap;
    }
    
    function addToLoadMap(map, guid, load) {
        if (!map.containsKey(guid)) {
            map.put(guid, parseInt(load));
        } else {
            var modelValue = map.get(guid);
            modelValue = parseInt(modelValue) + parseInt(load);
            map.remove(guid);
            map.put(guid, modelValue);
        }
        return map;
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
    
    function translatePlaceholder(value, locale) {
        var kindNum = contextItem.KindNum();
        
        
        // handle the case when the value is set only for db language
        var dbLocale = getDefaultDBLang(db);
        var isNameMaintained = contextItem.Attribute(1,locale).IsMaintained();
        if(!isNameMaintained)
           locale = dbLocale;
        
        if(value.search("\\@\\{name\\}") != -1) {
            value = value.replaceAll("\\@\\{name\\}", contextItem.Name(locale));
        } else if(value.search("\\@\\{toObjectName\\}") != -1) {
            (kindNum == Constants.CID_CXNDEF) ? value = value.replaceAll("\\@\\{toObjectName\\}", contextItem.TargetObjDef().Name(locale)) : value = value.replaceAll("\\@\\{toObjectName\\}", contextItem.Name(locale));
        } else if(value.search("\\@\\{fromObjectName\\}") != -1) {
            (kindNum == Constants.CID_CXNDEF) ? value = value.replaceAll("\\@\\{fromObjectName\\}", contextItem.SourceObjDef().Name(locale)) : value = value.replaceAll("\\@\\{fromObjectName\\}", contextItem.Name(locale));
        }
            
        return value;
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
    
    function getDefaultDBLang(db) {
        var langList = db.LanguageList();
        for (dbLang in langList) {
            if (langList[dbLang].isDefault()) {
                return "" + langList[dbLang].LocaleId();
            }
        }
        return "";
    }
}