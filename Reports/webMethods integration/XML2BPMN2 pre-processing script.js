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
 * BPMN 2.0 Import transformation pre-processing script
 * @author y12501
 */

/*
 * variable/class       instanceof
 * -------------------------------------------------
 * Context              AReportContext
 * fileBytes            Array<byte> of the file
 * xmlReader            com.aris.modeling.server.bl.logic.webreport.javascript.logic.context.AXMLReader
 * xmlRoot              org.jdom2.Element
 */
var outfile = Context.createOutputObject();
var fileBytes = Context.getProperty("FILE_BYTES");
var nsARIS = org.jdom2.Namespace.getNamespace("aris", "http://www.softwareag.com/BPMN/20151112/EXTENSION");
var nsBPMN = org.jdom2.Namespace.getNamespace("bpmn", "http://www.omg.org/spec/BPMN/20100524/MODEL");
var nsBPMNDI = org.jdom2.Namespace.getNamespace("bpmndi", "http://www.omg.org/spec/BPMN/20100524/DI");
var nsDC = org.jdom2.Namespace.getNamespace("dc", "http://www.omg.org/spec/DD/20100524/DC");
var nsDI = org.jdom2.Namespace.getNamespace("di", "http://www.omg.org/spec/DD/20100524/DI");
var PROCESS_TYPES = ['process', 'globalProcess'];
var EVENT_TYPES = ['event', 'startEvent', 'catchEvent', 'intermediateCatchEvent', 'boundaryEvent', 'endEvent', 'implicitThrowEvent', 'intermediateThrowEvent', 'throwEvent'];
var DATA_OBJ_REFERENCE_TYPES = ['dataObjectReference', 'dataStoreReference'];
var EVENT_DEFINITION_TYPES = ['cancelEventDefinition', 'compensateEventDefinition', 'conditionalEventDefinition', 'errorEventDefinition', 'escalationEventDefinition', 'linkEventDefinition', 'messageEventDefinition', 'signalEventDefinition', 'terminateEventDefinition', 'timerEventDefinition'];
var SUBPROCESS_TYPES = ['subProcess', 'adHocSubProcess', 'transaction'];
var OBJ_DEF_MAP = "ID_OF_";
var NEXT_RANDOM_ID = 1;
const MODEL_ID_DEFINITION = "DEFINITION_LEVEL";

var debugMode = fileBytes == null;
if (debugMode) {
    fileBytes = getImportFile().getData();
}

Array.prototype.contains = function (element) {
    return this.indexOf(element + "") > -1;
};

if (fileBytes != null) {
    var xmlReader = Context.getXMLParser(fileBytes);

    if (xmlReader.isValid()) {
        var xmlRoot = xmlReader.getRootElement();
        var xmlDocument = xmlReader.getDocument();

        var normalizer = new BPMNNormalizer(xmlRoot);
        normalizer.normalize();

        var sapNormalizer = new SAPNormalizer(xmlRoot);
        sapNormalizer.normalize();

        normalizer.forceIdAttribute();

        computeCollaborations(xmlRoot);
        compute(xmlRoot);
        computeBPMNDI();
        computeGuidMapping(xmlRoot);

        normalizer.fixMessageFlowBetweenDifferentModels();

        saveModifiedFile();
    } else {
        writeLog("File is not valid...")
    }
} else {
    writeLog("Could not read file...");
}

if (debugMode) {
    outfile.WriteReport();
}


function saveModifiedFile() {
    var fileBytes = getXmlContent();
    Context.setPropertyBytes("FILE_BYTES", fileBytes);

    var xmlContent = new java.lang.String(fileBytes, "UTF-8");
    writeLog("Modified XML file content:\n====================================================\n" + xmlContent);
}

function getXmlContent() {
    var document = xmlReader.getDocument();
    var xmlOutputter = Context.createXMLOutputObject("BPMN 2.0 Import pre-script result.xml", document);

    if (typeof(xmlOutputter.getDocumentContent) === "function") {
        return xmlOutputter.getDocumentContent();
    } else {
        // fallback mechanism due to backward compatibility prior 9.8 SR6
        var jdomOutputter = new org.jdom2.output.XMLOutputter(org.jdom2.output.Format.getPrettyFormat().setEncoding("UTF-8"));
        var xmlContent = jdomOutputter.outputString(document);
        return xmlContent.getBytes();
    }
}

function computeCollaborations(xmlElement) {
    var collaborations = xmlElement.getChildren("collaboration", nsBPMN);
    for (var iterator = collaborations.iterator(); iterator.hasNext();) {
        var collaboration = iterator.next();
        var collaborationId = collaboration.getAttribute("id").getValue();
        setModelPrescriptProperty("MODEL_" + collaborationId, collaborationId);

        var collaborationChildren = collaboration.getDescendants(new org.jdom2.filter.ElementFilter());
        while (collaborationChildren.hasNext()) {
            var child = collaborationChildren.next();
            var childId = child.getAttribute("id").getValue();
            var childName = child.getName();

            if (!"participant".equals(childName)) {
                setModelPrescriptProperty(childId, collaborationId);
            } else {
                var shape = getElementByAttributeValue("//bpmndi:BPMNShape", "bpmnElement", childId);
                if (shape == null) {
                    setModelPrescriptProperty(childId, MODEL_ID_DEFINITION);
                } else {
                    setModelPrescriptProperty(childId, collaborationId);
                }

                var processId = child.getAttribute("processRef");

                if (processId != null) {
                    var processIdValue = processId.getValue();
                    setModelPrescriptPropertyIfUnset(processIdValue, collaborationId);
                    setModelPrescriptPropertyIfUnset("MODEL_" + processIdValue, collaborationId);
                }
            }
        }
    }
}

function compute(xmlElement, modelId) {
    if (modelId == null) {
        modelId = MODEL_ID_DEFINITION;
    }

    var children = xmlElement.getChildren();
    for (var iterator = children.iterator(); iterator.hasNext();) {
        var child = iterator.next();
        if (!nsBPMN.equals(child.getNamespace())) continue;

        var childId = child.getAttribute("id").getValue();
        var childName = child.getName();
        var childModelId = setModelPrescriptPropertyIfUnset(childId, modelId);

        if (PROCESS_TYPES.contains(childName) || SUBPROCESS_TYPES.contains(childName)) {
            childModelId = setModelPrescriptPropertyIfUnset("MODEL_" + childId, childId);

            var dataAssociations = child.getChildren("dataOutputAssociation", nsBPMN).toArray();
            var dataInputAssociations = child.getChildren("dataInputAssociation", nsBPMN).toArray();
            dataAssociations = dataAssociations.concat(dataInputAssociations);
            for (var i = 0; i < dataAssociations.length; i++) {
                var association = dataAssociations[i];
                var associationId = association.getAttribute("id").getValue();
                setModelPrescriptPropertyIfUnset(associationId, modelId);
            }
        }

        compute(child, childModelId);
    }
}

function computeGuidMapping(xmlElement) {
    var id = xmlElement.getAttribute("id").getValue();
    var name = xmlElement.getName();
    var mappedId = id;
    var children = xmlElement.getChildren();

    if (EVENT_TYPES.contains(name)) {
        for (var i = children.size() - 1; i >= 0; --i) {
            var child = children.get(i);
            var childName = child.getName();

            if (EVENT_DEFINITION_TYPES.contains(childName)) {
                mappedId = child.getAttribute("id").getValue();
                break;
            }
        }
    }

    if (name.equals("dataInput") || name.equals("dataOutput")) {
        var parent = xmlElement.getParentElement();
        var parentName = parent.getName();

        if (parentName.equals("ioSpecification")) {
            var flowNode = parent.getParentElement();
            var flowNodeName = flowNode.getName();
            if (!"process".equals(flowNodeName)) {
                mappedId = flowNode.getAttribute("id").getValue();
            }
        }
    }

    if (name.equals("dataObjectReference")) {
        mappedId = xmlElement.getAttribute("dataObjectRef").getValue();
    }

    if (name.equals("dataStoreReference")) {
        mappedId = xmlElement.getAttribute("dataStoreRef").getValue();
    }

    setPrescriptProperty(OBJ_DEF_MAP + id, mappedId);

    // proceed with child elements ...
    for (var iterator = children.iterator(); iterator.hasNext();) {
        var child = iterator.next();
        computeGuidMapping(child);
    }
}


/**
 * Create mapping of visualization information (BPMNDI) to model id and store them in the properties for the trafo.
 */
function computeBPMNDI() {
    var diagramElements = xmlRoot.getChildren("BPMNDiagram", nsBPMNDI);
    for (var iterator = diagramElements.iterator(); iterator.hasNext();) {
        var diagram = iterator.next();
//        mapDiagramToNewModel(diagram);
        mapDiagramToExistingModel(diagram);
    }
}

/**
 * Takes the id attribute of the BPMNDiagram element as MODEL_ID and maps all occurrencies to it.
 *
 * @param diagram BPMNDiagram element
 */
function mapDiagramToNewModel(diagram) {
    var modelId = diagram.getAttribute("id").getValue();
    var children = diagram.getDescendants(new org.jdom2.filter.ElementFilter());
    while (children.hasNext()) {
        var child = children.next();
        var childId = child.getAttribute("id").getValue();
        setModelPrescriptProperty(childId, modelId);
    }
}


/**
 * Takes the MODEL_ID of the definition (based on the bpmnElement target of the BPMNPlane) and maps all occurrencies to
 * the same model.
 * <b>WARNING:</b> Make sure the given diagram is 'clean' and represents its definition 1:1.
 *
 * @param diagram BPMNDiagram element
 */
function mapDiagramToExistingModel(diagram) {
    var diagramId = diagram.getAttribute("id").getValue();
    var plane = diagram.getChild("BPMNPlane", nsBPMNDI);
    var planeId = plane.getAttribute("id").getValue();
    var targetId = plane.getAttribute("bpmnElement").getValue();
    var modelId = getModelPrescriptProperty("MODEL_" + targetId);

    setModelPrescriptPropertyIfUnset("MODEL_" + diagramId, modelId);
    setModelPrescriptPropertyIfUnset(planeId, modelId);

    var nodes = plane.getChildren();
    for (var iterator = nodes.iterator(); iterator.hasNext();) {
        var node = iterator.next();
        mapToExistingModel(node);
    }
}


function mapToExistingModel(element) {
    var elementId = element.getAttribute("id").getValue();
    var targetId = element.getAttribute("bpmnElement");

    if (targetId != null) {
        var targetIdValue = targetId.getValue();
        var modelId = getModelPrescriptProperty(targetIdValue);
        setModelPrescriptPropertyIfUnset(elementId, modelId);
    }
}


/*----------------------------------------------------------------------------
 *
 * HELPER
 *
 ----------------------------------------------------------------------------*/
function getPrescriptProperty(key) {
    var value = Context.getProperty(key);
    writeLog("Getting prescript property: " + key + " = " + value);
    if (value == null) {
        writeLog("WARNING: prescripts property unset: " + key);
    }
    return  value;
}


function setPrescriptProperty(key, value) {
    Context.setProperty(key, value);
    writeLog("Setting prescript property: " + key + " = " + value);
}


function getModelPrescriptProperty(key) {
    return getPrescriptProperty("MODEL_ID_OF_" + key)
}


function setModelPrescriptProperty(key, value) {
    setPrescriptProperty("MODEL_ID_OF_" + key, value);
}


function setModelPrescriptPropertyIfUnset(key, value) {
    var currentValue = Context.getProperty("MODEL_ID_OF_" + key);
    if (currentValue == null) {
        setModelPrescriptProperty(key, value);
        return value;
    }
    return currentValue;
}


function getElementsByRegex(regex) {
    var elementsExpression = getNewXPathInstance(regex);
    return elementsExpression.selectNodes(xmlDocument);
}


/**
 *
 * @param element source element
 * @param attribute
 * @param targetElement
 * @param targetAttribute
 * @return {Array} 2-dimensional array. First element is the found element, second is the found referenced target
 * element; or null, if no target could be found, or if the attribute could not be found on source element.
 */
function getElementsWithThereReferencedElement(element, attribute, targetElement, targetAttribute) {
    var result = [];
    var elements = getElementsByRegex(element);

    for (var i = 0; i < elements.size(); i++) {
        var myElement = elements.get(i);
        var targetValue = null;

        if (attribute === null) {
            targetValue = myElement.getText();
        } else {
            var elementAttribute = myElement.getAttribute(attribute);
            if (elementAttribute != null) {
                targetValue = elementAttribute.getValue()
            }
        }
        var bpmndiElement;
        if (targetValue != null) bpmndiElement = getElementByAttributeValue(targetElement, targetAttribute, targetValue);
        result[i] = [myElement, bpmndiElement];
    }
    return result;
}

/**
 *
 * @param element searched element name(s). String or array of strings.
 * @param attribute searched attribute name
 * @param value searched attribute value
 * @returns {java.util.List} List of matching nodes
 */
function getElementsByAttributeValue(element, attribute, value) {
    var elements = [].concat(element);
    var regex = []

    for (var i = 0; i < elements.length; i++) {
        regex.push(elements[i] + "[@" + attribute + "='" + value + "']");
    }
    return getElementsByRegex(regex.join(" | "));
}

function getElementByAttributeValue(element, attribute, value) {
    var expression = getNewXPathInstance(element + "[@" + attribute + "='" + value + "']");
    return expression.selectSingleNode(xmlDocument);
}

function getNewXPathInstance(pattern) {
    var instance = org.jdom2.xpath.XPath.newInstance(pattern);
    instance.addNamespace(nsARIS);
    instance.addNamespace(nsBPMN);
    instance.addNamespace(nsBPMNDI);
    return instance;
}

function setArisAttribute(parent, typeNum, value) {
    var attributeElement = getArisAttribute(parent, typeNum);
    if (attributeElement == null) {
        var attributesElem = getArisAttributesExtensionElement(parent);
        attributeElement = new org.jdom2.Element("attribute", attributesElem.getNamespace());
        attributeElement.setAttribute("id", this.getNextRandomId());
        attributeElement.setAttribute("typeNum", typeNum);
        attributesElem.addContent(attributeElement);
    }

    attributeElement.setText(value);
}

function getArisAttribute(element, typeNum) {
    var typeNumAttr = element.getAttribute("typeNum");
    if (element.getName() != "attribute" || typeNumAttr == null || typeNumAttr.getValue() != typeNum) {
        var attributesElem = getArisAttributesExtensionElement(element);
        element = getElementByAttributeValue("//aris:attribute", "typeNum", typeNum);
    }

    return element;
}

function getArisAttributesExtensionElement(parent) {
    if (elementEquals(parent, "attributes", nsARIS)) {
        return parent;
    }
    var arisExtension = getArisExtensionElement(parent);
    return getOrCreateChild(arisExtension, "attributes", nsARIS);
}

function getArisExtensionElement(parent) {
    if (elementEquals(parent, "extension", nsARIS)) {
        return parent;
    }
    var extensionElements = getExtensionElements(parent);
    return getOrCreateChild(extensionElements, "extension", nsARIS);
}

function getExtensionElements(parent) {
    if (elementEquals(parent, "extensionElements", nsBPMN)) {
        return parent;
    }
    return getOrCreateChild(parent, "extensionElements", nsBPMN);
}

function elementEquals(element, name, namespace) {
    return element.getName() == name && element.getNamespaceURI() == element.getNamespace().getURI();
}

function getOrCreateChild(parent, childName, childNamespace) {
    var child = parent.getChild(childName, childNamespace);
    if (child === null) {
        var namespace = parent.getNamespace();
        if (namespace.getURI() != childNamespace.getURI()) {
            namespace = childNamespace;
        }
        child = new org.jdom2.Element(childName, namespace);
        child.setAttribute("id", this.getNextRandomId());
        parent.addContent(child);
    }
    return child;
}


function BPMNNormalizer(xmlElement) {
    this.xmlRoot = xmlElement;

    this.normalize = function () {
        this._removeElements("//bpmn:extensionElements");
        this.forceIdAttribute();

        this.addDataStoreDummies();
        this.cleanUp();

        this.referenceParentTaskOrEventInDataAssociation();
        this.fixTextAnnotations();
        this.forceUniqueUnnamedParticipant();
        this.replaceEventDefinitions();
        this.addArisExtensionForCollapsedMarker();
    };


    /**
     *
     */
    this.addArisExtensionForCollapsedMarker = function () {
        var activites = getElementsByRegex("//bpmn:subProcess | //bpmn:adHocSubProcess | //bpmn:transaction | //bpmn:callActivity");
        for (var i = 0; i < activites.size(); i++) {
            var activity = activites.get(i);
            var activityId = activity.getAttribute("id").getValue();

            var shape = getElementByAttributeValue("//bpmndi:BPMNShape", "bpmnElement", activityId);
            var isExpanded = shape == null ? null : shape.getAttribute("isExpanded");
            var isExpandedValue = isExpanded == null ? null : isExpanded.getValue();

            if (isExpandedValue == null || isExpandedValue == "false") {
                // default: collapsed; attribute 'isExpanded' not specified or false
                var isCollapsed = true;
                var activityName = activity.getName();

                if (activityName == "callActivity") {
                    var calledElementId = activity.getAttribute("calledElement");
                    calledElementId = calledElementId == null ? null : calledElementId.getValue();
                    var calledElement = calledElementId == null ? null : getElementByAttributeValue("//bpmn:*", "id", calledElementId);
                    var calledElementName = calledElement == null ? null : calledElement.getName();
                    isCollapsed = PROCESS_TYPES.contains(calledElementName);
                }

                if (isCollapsed) {
                    activity.setAttribute("isCollapsed", "true", nsARIS);
                }
            }
        }
    };


    /**
     * Removes all unsupported elements from the BPMN file.
     */
    this.cleanUp = function () {
        this.removeNotSupportedElements();
        this.removeBPMNDIElementsWithZeroSize();

        this.removeBrokenConnections();
        this.removeBPMNDIwithoutElement();

        this.removeBrokenConnections();
        this.removeBPMNDIwithoutElement();
    };


    this.fixTextAnnotations = function () {
        this.twistAssociationFromTextAnnotations();
        this.replaceTextAnnotationsAccociatedToConnection();
        this.ensureNameLength();
    }


    /**
     * Ensure max length of 250 chars on name attribute - if exceeded, full text will be imported into attribute AT_REM.
     * Move the full text to extensionElement and strip the name field itself to 250 chars.
     */
    this.ensureNameLength = function () {
        var textAnnotations = getElementsByRegex("//bpmn:textAnnotation");
        for (var i = 0; i < textAnnotations.size(); i++) {
            var textAnnotation = textAnnotations.get(i);
            var textElement = textAnnotation.getChild("text", nsBPMN);
            if (textElement == null) continue;

            var text = textElement.getText().trim();
            if (text.length() <= 250) continue;

            var strippedText = text.slice(0, 250).trim();
            textElement.setText(strippedText);

            setArisAttribute(textAnnotation, Constants.AT_REM, text);
        }
    };


    /**
     * Text Annotations has to be source element of an association in ARIS (means: <i>Text Annotations --> Element</i>).
     * Since BPMN 2.0 supports both directions we need to correct the associations direction if it is twisted.
     */
    this.twistAssociationFromTextAnnotations = function () {
        var textAnnotations = getElementsByRegex("//bpmn:textAnnotation");

        for (var i = 0; i < textAnnotations.size(); i++) {
            var textAnnotation = textAnnotations.get(i);
            var textAnnotationId = textAnnotation.getAttribute("id").getValue();
            var associations = getElementsByAttributeValue("//bpmn:association", "targetRef", textAnnotationId);

            for (var j = 0; j < associations.size(); j++) {
                var association = associations.get(j);
                var associationId = association.getAttribute("id").getValue();

                var targetRef = association.getAttribute("targetRef").getValue();
                var sourceRef = association.getAttribute("sourceRef").getValue();
                association.setAttribute("targetRef", sourceRef);
                association.setAttribute("sourceRef", targetRef);

                var bpmnEdges = getElementsByAttributeValue("//bpmndi:BPMNEdge", "bpmnElement", associationId);

                for (var k = 0; k < bpmnEdges.size(); k++) {
                    var bpmnEdge = bpmnEdges.get(k);
                    var waypoints = bpmnEdge.getChildren("waypoint", nsDI);

                    for (var q = waypoints.size() - 1; q >= 0; q--) {
                        var element = waypoints.get(q);
                        element.detach();
                        bpmnEdge.addContent(element);
                    }
                }
            }
        }
    };


    /**
     * textAnnotation - - association - -> sequenceFlow (or association)
     */
    this.replaceTextAnnotationsAccociatedToConnection = function () {
        var textAnnotations = getElementsByRegex("//bpmn:textAnnotation");
        var textAnnotationsWithRemovedAssociation = [];

        for (var i = 0; i < textAnnotations.size(); i++) {
            var textAnnotation = textAnnotations.get(i);
            var textAnnotationId = textAnnotation.getAttribute("id").getValue();

            var associations = getElementsByAttributeValue("//bpmn:association", "sourceRef", textAnnotationId);
            for (var j = 0; j < associations.size(); j++) {
                var association = associations.get(j);
                var targetRef = association.getAttribute("targetRef").getValue();

                var targetCxns = getElementsByAttributeValue(["//bpmn:sequenceFlow", "//bpmn:association"], "id", targetRef);
                for (var k = 0; k < targetCxns.size(); k++) {
                    var connection = targetCxns.get(k);
                    var connectionId = connection.getAttribute("id").getValue();

                    var text = textAnnotation.getChild("text", nsBPMN);
                    if (text != null) {
                        setArisAttribute(connection, Constants.AT_BPMN_TEXT_ANNOTATION_1, text.getText().trim());
                    }

                    association.detach();
                    textAnnotationsWithRemovedAssociation.push(textAnnotation);
                }
            }
        }

        this.removeTextAnnotationsWithNoAssociation(textAnnotationsWithRemovedAssociation);
    };


    this.removeTextAnnotationsWithNoAssociation = function (textAnnotations) {
        for (var i = 0; i < textAnnotations.length; i++) {
            var textAnnotation = textAnnotations[i];
            var textAnnotationId = textAnnotation.getAttribute("id").getValue();
            var associations = getElementsByAttributeValue("//bpmn:association", "sourceRef", textAnnotationId);

            if (associations.size() == 0) {
                textAnnotation.detach();
            }
        }
    };


    this.replaceEventDefinitions = function() {
        var refs = getElementsByRegex("//bpmn:eventDefinitionRef");

        for (var i = 0; i < refs.size(); i++) {
            var ref = refs.get(i);
            var event = ref.getParent();
            var eventDefId = ref.getText();
            var eventDef = getElementsByRegex("//bpmn:*[@id='" + eventDefId + "']").get(0);
            var newEventDef = eventDef.clone();

            var refPosition = event.indexOf(ref);
            event.addContent(refPosition, newEventDef);
            ref.detach()
        }
    };


    /**
     * Every element must have its unique id!
     */
    this.forceIdAttribute = function () {
        // navigate to document node
        var element = this.xmlRoot;
        while (element instanceof org.jdom2.Element) {
            element = element.getParent();
        }

        var children = element.getDescendants(new org.jdom2.filter.ElementFilter());
        while (children.hasNext()) {
            var child = children.next();
            var childId = child.getAttribute("id");
            if (childId == null) {
                var randomId = getNextRandomId();
                child.setAttribute("id", randomId);
            }
        }
    };


    /**
     * Every element must have its unique id!
     */
    this.fixMessageFlowBetweenDifferentModels = function () {
        var messageFlows = getElementsByRegex("//bpmn:messageFlow");

        for (var i = 0; i < messageFlows.size(); i++) {
            var flow = messageFlows.get(i);
            var sourceRef = flow.getAttribute("sourceRef").getValue();
            var targetRef = flow.getAttribute("targetRef").getValue();

            var sourceModelId = getModelPrescriptProperty(sourceRef);
            var targetModelId = getModelPrescriptProperty(targetRef);

            if (sourceModelId != targetModelId) {
                var sourceModelElement = getElementByAttributeValue("//bpmn:*", "id", sourceModelId);
                var targetModelElement = getElementByAttributeValue("//bpmn:*", "id", targetModelId);

                var sourceModelElementName = sourceModelElement.getName();
                var targetModelElementName = targetModelElement.getName();

                if (SUBPROCESS_TYPES.contains(sourceModelElementName)) {
                    flow.setAttribute("sourceRef", sourceModelId);
                } else if (SUBPROCESS_TYPES.contains(targetModelElementName)) {
                    flow.setAttribute("targetRef", targetModelId);
                } else {
                    // messageFlow to element in called process (via callActivity) - valid scenario?
//                    var callingSourceModel = getElementsByAttributeValue("//bpmn:callActivity", "calledElement", sourceModelId);
//                    var callingTargetModel = getElementsByAttributeValue("//bpmn:callActivity", "calledElement", targetModelId);
                }
            }
        }
    };


    /**
     * Only one participant of an collaboration element can be unnamed. Set the name attribute for participants,
     * if the collaboration already has one unnamed participant.
     */
    this.forceUniqueUnnamedParticipant = function () {
        var collaborations = this.xmlRoot.getChildren("collaboration", nsBPMN);
        for (var iterator = collaborations.iterator(); iterator.hasNext();) {
            var collaboration = iterator.next();
            var participants = collaboration.getChildren("participant", nsBPMN);

            for (var participantIterator = participants.iterator(); participantIterator.hasNext();) {
                var participant = participantIterator.next();
                var participantName = participant.getAttribute("name");
                if (participantName == null || participantName.getValue().length() < 1) {
                    participant.setAttribute("name", " ");
                }
            }
        }
    };


    this.removeNotSupportedElements = function () {
        // choreography and conversation
        this._removeElements("//bpmn:callChoreography");
        this._removeElements("//bpmn:choreographyActivity");
        this._removeElements("//bpmn:choreography");
        this._removeElements("//bpmn:choreographyTask");
        this._removeElements("//bpmn:globalChoreographyTask");
        this._removeElements("//bpmn:conversationNode");
        this._removeElements("//bpmn:callConversation");
        this._removeElements("//bpmn:conversation");
        this._removeElements("//bpmn:globalConversation");
        this._removeElements("//bpmn:subConversation");
        this._removeElements("//bpmn:conversationAssociation");
        this._removeElements("//bpmn:choreographyRef");
        this._removeElements("//bpmn:conversationLink");

        // resources and references to resources
        this._removeElements("//bpmn:resource");
        this._removeElements("//bpmn:resourceRole");
        this._removeElements("//bpmn:performer");
        this._removeElements("//bpmn:humanPerformer");
        this._removeElements("//bpmn:potentialOwner");

        // default elements
        this._removeElements("//bpmn:property");
    };

    this.removeBrokenConnections = function () {
        this._removeParentIfReferencedElementMissing("//bpmn:dataInputAssociation/sourceRef", null, "//bpmn:*", "id");
        this._removeParentIfReferencedElementMissing("//bpmn:dataOutputAssociation/targetRef", null, "//bpmn:*", "id");

        this._removeElementIfReferencedElementMissing("//bpmn:sequenceFlow", "sourceRef", "//bpmn:*", "id");
        this._removeElementIfReferencedElementMissing("//bpmn:sequenceFlow", "targetRef", "//bpmn:*", "id");
        this._removeElementIfReferencedElementMissing("//bpmn:association", "sourceRef", "//bpmn:*", "id");
        this._removeElementIfReferencedElementMissing("//bpmn:association", "targetRef", "//bpmn:*", "id");
        this._removeElementIfReferencedElementMissing("//bpmn:messageFlow", "sourceRef", "//bpmn:*", "id");
        this._removeElementIfReferencedElementMissing("//bpmn:messageFlow", "targetRef", "//bpmn:*", "id");
        this._removeElementIfReferencedElementMissing("//bpmn:dataObjectReference", "dataObjectRef", "//bpmn:*", "id");
        this._removeElementIfReferencedElementMissing("//bpmn:dataStoreReference", "dataStoreRef", "//bpmn:*", "id");
        this._removeElementIfReferencedElementMissing("//bpmn:boundaryEvent", "attachedToRef", "//bpmn:*", "id");
        this._removeElementIfReferencedElementMissing("//bpmn:eventDefinitionRef", null, "//bpmn:*", "id");
        this._removeElementIfReferencedElementMissing("//bpmn:linkEventDefinition/source", null, "//bpmn:*", "id");
        this._removeElementIfReferencedElementMissing("//bpmn:linkEventDefinition/target", null, "//bpmn:*", "id");
        this._removeElementIfReferencedElementMissing("//bpmn:incoming", null, "//bpmn:*", "id");
        this._removeElementIfReferencedElementMissing("//bpmn:outgoing", null, "//bpmn:*", "id");

        this._removeAttributeIfReferencedElementMissing("//bpmn:callActivity", "calledElement", "//bpmn:*", "id");
        this._removeAttributeIfReferencedElementMissing("//bpmn:participant", "processRef", "//bpmn:process", "id");
    };

    /**
     * Checks if data store references have defined a dataStore. If no, a dummy one is created
     */
    this.addDataStoreDummies = function() {
        var dataStoreReferences = getElementsByRegex("//bpmn:dataStoreReference");

        for (var i = 0; i < dataStoreReferences.size(); i++) {
            var dataStoreReference = dataStoreReferences.get(i);
            var dataStoreReferenceId = dataStoreReference.getAttribute("id");
            var dataStoreRef = dataStoreReference.getAttribute("dataStoreRef");

            if (dataStoreRef == null) {
                // create a dummy dataStore
                var dataStoreId = "DUMMY_" + dataStoreReferenceId.getValue();
                var dataStore = new org.jdom2.Element("dataStore", nsBPMN);
                dataStore.setAttribute("id", dataStoreId);
                dataStoreReference.setAttribute("dataStoreRef", dataStoreId);

                var rootElement = getElementsByRegex("//bpmn:definitions").get(0);
                rootElement.addContent(dataStore);
            }
        }
    }


    this.referenceParentTaskOrEventInDataAssociation = function () {
        function referenceParentTaskOrEvent(elementName, sourceOrTargetName) {
            var associations = getElementsByRegex("//bpmn:" + elementName);

            for (var j = 0; j < associations.size(); j++) {
                var association = associations.get(j);
                var taskOrEvent = association.getParentElement();
                var taskOrEventId = taskOrEvent.getAttribute("id").getValue();

                var sourceOrTarget = getOrCreateChild(association, sourceOrTargetName, nsBPMN);
                sourceOrTarget.setText(taskOrEventId);
            }
        }

        referenceParentTaskOrEvent("dataInputAssociation", "targetRef");
        referenceParentTaskOrEvent("dataOutputAssociation", "sourceRef");
    }


    /**
     * Remove BPMNShape elements with height and width set to 0; and BPMNEdge elements with x and y set to 0.
     * BPMNPlane elements will be removed if they are empty after removeing such BPMNShape/BPMNEdge elements.
     */
    this.removeBPMNDIElementsWithZeroSize = function () {
        var planes = getElementsByRegex("//bpmndi:BPMNPlane");

        for (var i = 0; i < planes.size(); i++) {
            var plane = planes.get(i);

            var hasElementsRemoved = this._removeBPMNShapeWithZeroSize(plane);
            hasElementsRemoved |= this._removeBPMNEdgeWithZeroSizeWaypoints(plane);

            if (hasElementsRemoved) {
                var hasRemainingEdge = plane.getChild("BPMNEdge", nsBPMNDI) != null;
                var hasRemainingShape = plane.getChild("BPMNShape", nsBPMNDI) != null;

                if (!hasRemainingEdge && !hasRemainingShape) {
                    plane.detach()
                }
            }
        }
    };

    this._removeBPMNShapeWithZeroSize = function (plane) {
        var hasElementsRemoved = false;
        var shapes = plane.getChildren("BPMNShape", nsBPMNDI).toArray();
        for (var j = 0; j < shapes.length; j++) {
            var shape = shapes[j];
            var bounds = shape.getChild("Bounds", nsDC);
            var boundsHeight = bounds.getAttribute("height").getValue();
            var boundsWidth = bounds.getAttribute("width").getValue();

            if (parseFloat(boundsHeight) === 0 && parseFloat(boundsWidth) === 0) {
                shape.detach();
                hasElementsRemoved = true;
            }
        }

        return hasElementsRemoved;
    };

    this._removeBPMNEdgeWithZeroSizeWaypoints = function (plane) {
        var hasElementsRemoved = false;
        var edges = plane.getChildren("BPMNEdge", nsBPMNDI).toArray();
        for (var k = 0; k < edges.length; k++) {
            var edge = edges[k];
            var waypoints = edge.getChildren("waypoint", nsDI).toArray();
            var waypointsRemoved = 0;

            for (var l = 0; l < waypoints.length; l++) {
                var waypoint = waypoints[l];
                var waypointX = waypoint.getAttribute("x").getValue();
                var waypointY = waypoint.getAttribute("y").getValue();

                if (parseFloat(waypointX) === 0 && parseFloat(waypointY) === 0) {
                    waypoint.detach();
                    waypointsRemoved++;
                }
            }

            if (waypointsRemoved > 0 && waypointsRemoved === waypoints.length) {
                edge.detach();
                hasElementsRemoved = true;
            }
        }

        return hasElementsRemoved;
    };

    this.removeBPMNDIwithoutElement = function () {
        this._removeElementIfReferencedElementMissing("//bpmndi:BPMNPlane", "bpmnElement", "//bpmn:*", "id");
        this._removeElementIfReferencedElementMissing("//bpmndi:BPMNShape", "bpmnElement", "//bpmn:*", "id");
        this._removeElementIfReferencedElementMissing("//bpmndi:BPMNEdge", "bpmnElement", "//bpmn:*", "id");
        this._removeEmptyDiagrams();
    };

    this._removeElements = function (regex) {
        var elements = getElementsByRegex(regex);

        for (var i = 0; i < elements.size(); i++) {
            var element = elements.get(i);
            element.detach()
        }
    };

    this._removeElementIfReferencedElementMissing = function (element, attribute, targetElement, targetAttribute) {
        var elementsWithReferencedElement = getElementsWithThereReferencedElement(element, attribute, targetElement, targetAttribute);

        for (var i = 0; i < elementsWithReferencedElement.length; i++) {
            var myElement = elementsWithReferencedElement[i];
            if (myElement[0] != null && myElement[1] == null) {
                myElement[0].detach();
            }
        }
    };

    this._removeParentIfReferencedElementMissing = function (element, attribute, targetElement, targetAttribute) {
        var elementsWithReferencedElement = getElementsWithThereReferencedElement(element, attribute, targetElement, targetAttribute);

        for (var i = 0; i < elementsWithReferencedElement.length; i++) {
            var myElement = elementsWithReferencedElement[i];
            if (myElement[0] != null && myElement[1] == null) {
                myElement[0].getParentElement().detach();
            }
        }
    };

    this._removeAttributeIfReferencedElementMissing = function (element, attributeName, targetElement, targetAttributeName) {
        var elementsWithReferencedElement = getElementsWithThereReferencedElement(element, attributeName, targetElement, targetAttributeName);

        for (var i = 0; i < elementsWithReferencedElement.length; i++) {
            var myElement = elementsWithReferencedElement[i];
            if (myElement[0] != null && myElement[1] == null) {
                myElement[0].removeAttribute(attributeName);
            }
        }
    };

    this._removeEmptyDiagrams = function () {
        var diagrams = getElementsByRegex("//bpmndi:BPMNDiagram");

        for (var i = 0; i < diagrams.size(); i++) {
            var diagram = diagrams.get(i);
            var plane = diagram.getChild("BPMNPlane", nsBPMNDI);

            if (plane === null) {
                diagram.detach()
            }
        }
    };
}

function SAPNormalizer(xmlElement) {
    this.xmlRoot = xmlElement;
    this.xPointTypes = ["beforeActivity", "afterActivity"];
    this.xPointElementName = "xPoint";

    this.normalize = function () {
        var textAnnotations = getElementsByRegex("//bpmn:textAnnotation");
        for (var i = 0; i < textAnnotations.size(); i++) {
            var textAnnotation = textAnnotations.get(i);
            var text = textAnnotation.getChild("text", nsBPMN);

            if (text != null) {
                var textValue = text.getText().trim();

                for (var j = 0; j < this.xPointTypes.length; j++) {
                    var type = this.xPointTypes[j];
                    var index = textValue.toLowerCase().indexOf(type.toLowerCase() + ":");

                    if (index === 0) {
                        var typeLen = type.length;
                        var value = textValue.substring(typeLen + 1);

                        var extensionElements = getExtensionElements(textAnnotation);
                        var xpoint = this.createXPointElement(type);
                        extensionElements.addContent(xpoint);
                        text.setText(value);
                    }
                }
            }
        }
    };

    this.createXPointElement = function (type) {
        var xpoint = new org.jdom2.Element(this.xPointElementName);
        xpoint.setAttribute("id", getNextRandomId());
        xpoint.setAttribute("type", type);
        return xpoint;
    };
}


function getNextRandomId() {
    return "UNKNOWN_ID_" + NEXT_RANDOM_ID++;
}


/*----------------------------------------------------------------------------
 *
 * TEST Section (only for debug purposes)
 *
 ----------------------------------------------------------------------------*/
/**
 * Displays a file selection dialog on the client and makes the content of the selected files available in the report.
 * @returns {*}
 */
function getImportFile() {
    var title = "Import BPMN 2.0 file";
    var directory = "";
    var initialFilename = "";
    var allowedFileTypes = "*.bpmn!!BPMN file|*.bpmn|*.xml|";

    var selectedFiles = Dialogs.getFilePath(initialFilename, allowedFileTypes, directory, title, 0);
    if (selectedFiles != null && selectedFiles.length > 0) {
        return selectedFiles[0];
    }
    return null;
}

function writeLog(text) {
    outfile.OutputLn(text, "Arial", 10, Constants.C_BLACK, Constants.C_WHITE, Constants.FMT_LEFT, 0);
}

function printDescription(xmlElement, modelId) {
    var id = xmlElement.getAttribute("bpmnElement").getValue();
    var name = xmlElement.getAttribute("name");
    if (name != null) {
        name = name.getValue();
    }

    writeLog("Element " + name + "with ID \"" + id + "\" found for model \"" + modelId + "\".");
}
