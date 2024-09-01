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

//-----------------------------------------------------------------------------------
// This report creates a new package in the selected group containing a class diagram
// and two classes connected by a unidirectional binary association.
//
// It shows how to create new elements and diagrams by using the OMF / UML 2 specific
// report API.
//
// This report is not available to ARIS users by default.
//
// Copyright (c) Software AG. All Rights Reserved.
//-----------------------------------------------------------------------------------


// The ARIS group for which this report has been started:
var arisGroup = ArisData.getSelectedGroups()[0];

// The OMF component is the central entry point to the OMF and UML 2 specific report API:
var omf = Context.getComponent("OMF");

// The UML 2 element factory provides methods for creating UML root elements (the first
// parameter is the name and the second the major version of the metamodel):
var umlFactory = omf.getElementFactoryByName("UML", 2);

// Get an OmfScriptingArisGroup interface for the selected ARIS group:
var omfGroup = omf.toOmfObject(arisGroup);

// The OMF repository manages all OMF / UML 2 objects of a database session:
var omfRepository = omfGroup.omfGetRepository();

// Create a new UML 2 Package in the selected group by using the UML element factory:
var umlPackage = umlFactory.createPackage(omfGroup);

// Set the name of the new package (the language parameter null indicates that
//the current maintenance language will be used):
umlPackage.setName("TestPackage", null);

// Create two UML 2 Classes in the package:
var umlClass1 = umlPackage.createPackagedElementAsClass();
umlClass1.setName("TestClass1", null);

var umlClass2 = umlPackage.createPackagedElementAsClass();
umlClass2.setName("TestClass2", null);

// Create a UML 2 Property as owned attribute of TestClass1:
var umlProperty1 = umlClass1.createOwnedAttributeAsProperty();
umlProperty1.setName("testClass2", null);

// Set the type of the property:
umlProperty1.setType(umlClass2);

// Set its multiplicity to [1..*] (1 is default for lower and upper bound,
// therefore only the upper bound is set bere):
umlProperty1.setUpper(Constants.UML2_UNLIMITED_VALUE);

// Create a UML 2 Association in the package:
var umlAssociation = umlPackage.createPackagedElementAsAssociation();
umlAssociation.omfSetName("A_testClass2_testClass1", null);

// Create a new UML 2 Property as non-navigable association end connecting
// the associtaion to TestClass1 (an owned end is automatically also a member end):
var umlProperty2 = umlAssociation.createOwnedEndAsProperty();
umlProperty2.setName("testClass1", null);
umlProperty2.setType(umlClass1);

// Use the attribute of TestClass1 as second member end of the association
// connecting it to TestClass2:
umlAssociation.addMemberEnd(umlProperty1);

// Create a new UML 2 class diagram in the package:
var umlClassDiagram = umlPackage.omfCreateDiagram(Constants.UML2_CLASS_DIAGRAM);
umlClassDiagram.omfSetName("Test class diagram", null);

// Create a node presentation of the package in the diagram:
var packageNode = 
        umlClassDiagram.omfCreateNodePresentation(
                Constants.UML2_SYMBOL_PACKAGE, umlPackage, null, 
                new java.awt.Rectangle(100, 100, 2000, 1000));

// Create a node presentation embedded in the package presentation for each class:
var classNode1 = 
        umlClassDiagram.omfCreateNodePresentation(
                Constants.UML2_SYMBOL_CLASS, umlClass1, packageNode, 
                new java.awt.Rectangle(200, 400, 400, 200));
var classNode2 = 
        umlClassDiagram.omfCreateNodePresentation(
                Constants.UML2_SYMBOL_CLASS, umlClass2, packageNode,  
                new java.awt.Rectangle(1200, 400, 400, 200));

// Unlike classic ARIS connection occurences which always represent exactly one connection definition, 
// edge presentations in UML can either visualize a direct connection between two elements or 
// a chain of elements and connections. In OMF the constructs represented by an edge presentation are
// called "Relationships". An OMF relationships is a virtual construct and is always related to an
// edge symbol.
// For managing such relationships the OMF relationship factory is required:
var relationshipFactory = omfRepository.getRelationshipFactory();

// For creating an edge presentation of an already existing binary association the corresponding
// relationship consisting of the association itself and its both member ends must be identified.
var elementList = java.util.Arrays.asList(umlClass1, umlProperty2, umlAssociation, umlProperty1, umlClass2);
var relationship = relationshipFactory.fromElements(Constants.UML2_SYMBOL_ASSOCIATION, elementList);

// The following call would create a new UML 2 Association with two new UML 2 Properties as owned ends
// connecting both classes instead of using the existing one:
// var relationship = 
//        relationshipFactory.createNewRelationship(
//                Constants.UML2_SYMBOL_ASSOCIATION, umlPackage, umlClass1, umlClass2);

// The alignment of the edge presentation:
var edgePoints = new java.util.ArrayList();
edgePoints.add(new java.awt.Point(600, 500));
edgePoints.add(new java.awt.Point(1200, 500));

// Create an edge presentation of the association:
var associationPresentation =
        umlClassDiagram.omfCreateEdgePresentation(relationship, classNode1, classNode2, edgePoints);

// Hide the name of the association in the diagram
associationPresentation.omfSetPresentationOptionValue(Constants.UML2_GENERAL_SHOW_NAME, false);

// All changes dony by using the OMF / UML 2 API must be save expliciety:
omfRepository.saveModifiedObjects();


