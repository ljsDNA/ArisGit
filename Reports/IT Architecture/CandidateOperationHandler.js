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
 * The CandidateOperationHandler handles the creation of non-central candidate elements
 *
 * @author Y10382
 */

 function CandidateOperationHandler() {
    
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
    
     
    var db;
    var operationProperty;
    var itemFinder;
    var createdItems;
    var arisMetaModel;
    var candidateModelFound;
    var bestMatchSupport;
    var modelsToLayout = new Packages.java.util.HashSet();
    
    
    this.handle = function(database, processor) {
        db = database;
        itemFinder = processor.getItemFinder();
        createdItems = new Array();
        arisMetaModel = db.ActiveFilter();
        bestMatchSupport = new BestMatchSupport(db);

        while ((operation = processor.next()) != null) {
            try {
                // finding object node - 1st child of operation node
                var childNodes = getRealChildren(operation);
                var description = " ";
                candidateModelFound = false;

                // abort if the operation does not define a context 
                if (childNodes.length <= 0) {
                    processor.setStatus(ImportProvider.FAILED, ImportProvider.NOT_FOUND_ERROR, "Operation does not define a context. Operation aborted.", 0, true, description);
                    continue;
                }

                var objectNode = childNodes[0];

                operationProperty = "" + operation.getAttribute("property");
                
                    // getting guid of context object so in case of temporary error, its further processing would be delayed
                    var objectGuid = getRealChildren(objectNode)[0].getAttribute("value");
                    var handled = processElementHandling(objectNode);
                    if (handled) {
                        if (delayedGUIDSet.contains(objectGuid))
                            throw new OperationException(ImportProvider.TEMPORARY_ERROR, "Context object is in delayed mode. Its changes must be delayed too.", -1, description);

                        processor.setStatus(ImportProvider.SUCCEEDED, ImportProvider.NO_ERROR, "Operation completed successfully.", -1, true, description);
                    }
                    else
                        processor.setStatus(ImportProvider.FAILED, ImportProvider.NOT_FOUND_ERROR, "Operation failed. Handling the creation of non-central element was unsuccessful.", 0, true, description);


            } catch(e) {
                if (e.errorCode == ImportProvider.TEMPORARY_ERROR) {
                    delayedGUIDSet.add(objectGuid);
                    processor.setStatus(ImportProvider.DELAYED, e.errorCode, e.message, -1, true, description);
                } else {
                    var errorCode = e.errorCode;
                    if (errorCode == null)
                        errorCode = ImportProvider.UNKNOWN_ERROR;
                    var message = e.message;
                    if (message == null)
                        message = "" + e;
                    processor.setStatus(ImportProvider.FAILED, errorCode, message, -1, true, description);
                }
                performRollback(createdItems);
            }
        }
    }
    
    // finds out the type of non-central element and checks if the type of operation equals to 'create'
    function processElementHandling(objectNode) {
        var objectChildren = getRealChildren(objectNode);
        var object = null;
        var processed = false;

        if (objectChildren != null && objectChildren.length > 0)
            object = objectChildren[0];

        var oFunction = object.getAttribute("function");
        var oTypeNum = object.getAttribute("typeNum");
        var oGuid = object.getAttribute("value");

        if (oFunction.equals("create")) {
            processed = createElement(object, oTypeNum, oGuid);            
            
        } else
            processor.setStatus(ImportProvider.FAILED, ImportProvider.NOT_FOUND_ERROR, "Unknown function", 0, true, "");

        return processed;
    }
    
    // handles creation of specific element
    function createElement(element, typeNum, guid) {
        var elementChildren = getRealChildren(element);
        var attributes = getNamedChildren(elementChildren, "attribute");
        var model = null;
        var modelNode = null;

        // checks if object with specified guid doesnt already exist
        var theObject = db.FindGUID(guid);

        if (theObject == null || !theObject.IsValid()) {
            theObject = db.RootGroup().CreateObjDef(typeNum, "", -1);

            if (!theObject.IsValid())
                throw new OperationException(ImportProvider.WRITE_ERROR, "Could not create object with typeNum=" + typeNum);

            // set the object guid after object has been created
            if (guid != null && guid != "")
                theObject.ModifyGUID(guid);

        } else if (theObject.KindNum() == Constants.CID_OBJDEF) {
            // if object with such guid exists, delete it and create the new one
            theObject.Group().Delete(theObject);
            var newObject = db.RootGroup().CreateObjDef(typeNum, "", -1);
            newObject.ModifyGUID(guid);
            theObject = newObject;
        } else
            throw new OperationException(ImportProvider.WRITE_ERROR, "Could not create object with typenum=" + typeNum + ", guid=" + guid);

        // process the elements children
        if (theObject != null && theObject.IsValid()) {
            // if the object was successfully created, consider it as contextItem and add it to createdItems (for rollback issues)
            contextItem = theObject;
            createdItems.push(theObject);
            for (var i = 0; i < elementChildren.length; i++) {
                if (elementChildren[i].getTagName().equals("attribute"))
                    if (!processAttribute(theObject, elementChildren[i], 3))
                        throw new OperationException(ImportProvider.WRITE_ERROR, "Could not create attribute");

                if (elementChildren[i].getTagName().equals("model")) {
                    modelNode = elementChildren[i];
                }
            }

            if (modelNode != null)
                model = bestMatchSupport.createNewModelByCriteria(modelNode, getRealChildren(modelNode));

            if ((model = processCandidateModel(theObject, modelNode, M_CHECK)) != null) {
                // change group of created object from Root group to group where related model is placed
                theObject.ChangeGroup(model.Group());
                modelsToLayout.add(model);
                createdItems.push(model);
                return true;
            }        
        }

        return false;
    }
    
    function findItem(guid) {
        return itemFinder.findItem(
                null,
                null,
                guid,
                null,
                db);
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
                    else
                    if (!attribute.setValue(value))
                        throw new OperationException(ImportProvider.WRITE_ERROR, "processAttribute(): Could not set attribute with typeNum=" + typeNum);
                
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

    function processCandidateModel(parentItem, node, mode) {
        return bestMatchSupport.processModelApplyingBestMatchApproach(parentItem, node, mode, candidateModelFound);
    }

    Array.prototype.toArrayList = function() {
        var arrayList = new Packages.java.util.ArrayList();
        for (var i = 0; i < this.length; i++) {
            arrayList.add(this[i]);
        }
        return arrayList;
    }

    this.getModelsToLayout = function() {
        return modelsToLayout;
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
    
     /** format for ABT_TIMESTAMP */
    var timestampFormat = new Packages.java.text.SimpleDateFormat("HH:mm:ss;MM/dd/yyyy");
    /** format for ABT_DATE */
    var dateFormat = new Packages.java.text.SimpleDateFormat("MM/dd/yyyy");
    /** format for ABT_TIME */
    var timeFormat = new Packages.java.text.SimpleDateFormat("HH:mm:ss");

    
 }