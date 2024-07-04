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
// This report shows how to create a profile defining stereotypes with atttributes,
// how to apply the profile and its stereotypes to UML elements and how to specify 
// values for the stereotype attributes by using the OMF / UML 2 report API.
//
// This report should be started on an empty database and is not available to
// ARIS users by default.
//
// Copyright (c) Software AG. All Rights Reserved.
//-----------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------
// 1. Initialize some basic variables

// The OMF component is the central entry point to the OMF and UML 2 specific report API:
var omf = Context.getComponent("OMF");

// The selected database:
var database = ArisData.getSelectedDatabases()[0];

// The OMF repository manages all OMF / UML 2 objects of a database session:
var omfRepository = omf.getRepository(database);

// The UML 2 element factory provides methods for creating UML root elements (the first
// parameter is the name and the second the major version of the metamodel):
var umlFactory = omf.getElementFactoryByName("UML", 2);

// The root group of the selected database as OMF object
var rootGroup = omfRepository.getRootGroup();


//-----------------------------------------------------------------------------------
// 2. Generate the UML meta model in the database.
//    They meta model generator creates UML representations of the corresponding meta
//    elements which are required for creating UML profiles.

generateMetaModels();

//-----------------------------------------------------------------------------------
// 3. Create a UML profile defining two stereotypes with some attributes.
//    The following variables represent the user-defined UML profile and its members.
//    They are used in the next step to identify the corresponding meta profile and its
//    elements.
var PROFILE_NAME = "AnalysisProfile";
var ENUMERATION_NAME = "Priority";
var LITERAL_HIGH_NAME = "high";
var LITERAL_LOW_NAME = "low";
var USE_CASE_STEREOTYPE_NAME = "BusinessUseCase";
var USE_CASE_DIAGRAM_STEREOTYPE_NAME = "BusinessUseCaseDiagram";
var PROPERTY_PRIORITY_NAME = "priority";
var PROPERTY_IS_FINISHED_NAME = "isFinished";
var PROPERTY_EFFORT_NAME = "effort";
var PROPERTY_STAKEHOLDERS_NAME = "stakeholders";

var umlProfile;
var umlEnumeration;
var umlEnumerationLiteral_High;
var umlEnumerationLiteral_Low;
var umlStereotype_BusinessUseCase;
var umlStereotype_BusinessUseCaseDiagram;
var umlProperty_IsFinished;
var umlProperty_Effort;
var umlProperty_Priority;
var umlProperty_Stakeholders;

createUmlProfile();

//-----------------------------------------------------------------------------------
// 4. Identify the meta profile and its elements

var metaProfile;
var metaEnumerationLiteral_High;
var metaEnumerationLiteral_Low;
var metaStereotype_BusinessUseCase;
var metaStereotype_BusinessUseCaseDiagram;
var metaProperty_UseCase_IsFinished;
var metaProperty_UseCase_Effort;
var metaProperty_UseCase_Priority;
var metaProperty_Diagram_Stakeholders;

// There are two alternatives for identifying the meta profile and its elements.
// Exactly one of them must be uncommented in this example script.

// If the UML profile and its elements are created or already loaded by the script,
// they can directly be migrated into an OMF meta profile by using the ProfileElemntAccess
// interface:
identifyMetaProfileByUmlProfile();

// If only the names of the profile and its elements are known (presuming that there 
// is only one UML profile with that name in the database), the meta profile can be
// identified by its name by using the OmfProfileManager interface.
// (This alternative can also be used for applying predefined profiles and stereotypes
// which do not have a representation as UML elements in a database.)
// identifyMetaProfileByName();


//-----------------------------------------------------------------------------------
// 5. Create a UML model containing a use case diagram and apply the profile

createUmlModel();


/**
 * Runs the meta model generator in the root group.
 * It will create a UML 2 Model with stereotype «Metamodel» for each OMF meta model contained in the list.
 *
 * The generated UML representations of the meta models and their elements have the same GUIDs as the meta
 * elements. Therfore the generated meta models can only excist once in a database. If there are already
 * generated meta elemenbts in the selected database they will be moved to the target group of the 
 * meta model generator.
 *
 * Usually it is sufficcient to run the meta model generator once in a database.
 */
function generateMetaModels() {
    // The meta model manager provides access to the meta models:
    var metaModelManager = omf.getMetaModelManager();
    
    // Add all supported meta models to a list:
    var metaModels = new Packages.java.util.ArrayList();
    metaModels.addAll(metaModelManager.getMetaModels());

    // Run the UML meta model generator in the root group. The parameter
    // UML2_LANGUAGE_OPTION_ORIGINAL_EXPRESSIONS specifies that the meta element names are created in the
    // default language of the selected database only and that the original names are used.
    omf.generateMetaModels(rootGroup, metaModels, Constants.UML2_LANGUAGE_OPTION_ORIGINAL_EXPRESSIONS);
    
    // Save the generated meta models:
    omfRepository.saveModifiedObjects();
}

/**
 * Creates a UML profile defining a stereotype extending UseCases and a diagram stereotype
 * extenbding Use Case Diagrams.
 */
function createUmlProfile() {
    // Create a new profile in the root group:
    umlProfile = umlFactory.createProfile(rootGroup);
    umlProfile.setName(PROFILE_NAME, null);
    
    // Create a meta model reference connectingh the profile with the generated UML 2 meta model:
    var metamodelReference = umlProfile.createMetamodelReference();
    var umlMetaModel = getUmlElement(Constants.UML2_META_MODEL);
    metamodelReference.setImportedPackage(umlMetaModel);
    
    // Create a stereotype «BusinessUseCase» extending UseCases
    var umlMetaClass_UseCase = getUmlElement(Constants.UML2_USE_CASE);
    umlStereotype_BusinessUseCase = createUmlStereotype(USE_CASE_STEREOTYPE_NAME, umlMetaClass_UseCase);

    // Create a stereoytpe attribute BusinessUseCase::isFinished: Boolean
    var umlPrimitiveType_Boolean = getUmlElement(Constants.PRIMITIVE_TYPES2_BOOLEAN);
    umlProperty_IsFinished = 
            createUmlStereotypeAttribute(
                    umlStereotype_BusinessUseCase, PROPERTY_IS_FINISHED_NAME, umlPrimitiveType_Boolean);
    
    // Create a stereoytpe attribute BusinessUseCase::effort: Integer
    var umlPrimitiveType_Integer = getUmlElement(Constants.PRIMITIVE_TYPES2_INTEGER);
    umlProperty_Effort = 
            createUmlStereotypeAttribute(
                    umlStereotype_BusinessUseCase, PROPERTY_EFFORT_NAME, umlPrimitiveType_Integer);

    // Create a stereoytpe attribute BusinessUseCase::priority: Priority
    createUmlEnumerationPriority();
    umlProperty_Priority = 
            createUmlStereotypeAttribute(
                        umlStereotype_BusinessUseCase, PROPERTY_PRIORITY_NAME, umlEnumeration);
    
    // Create a stereotype «BusinessUseCaseDiagram» extending Use Case Diagrams
    var umlMetaDiagram_UseCaseDiagram = getUmlElement(Constants.UML2_USE_CASE_DIAGRAM);
    umlStereotype_BusinessUseCaseDiagram = 
            createUmlStereotype(USE_CASE_DIAGRAM_STEREOTYPE_NAME, umlMetaDiagram_UseCaseDiagram);

    var umlPrimitiveType_String = getUmlElement(Constants.PRIMITIVE_TYPES2_STRING);
    umlProperty_Stakeholders = 
            createUmlStereotypeAttribute(
                    umlStereotype_BusinessUseCaseDiagram, PROPERTY_STAKEHOLDERS_NAME, umlPrimitiveType_String);
    
    // Save akll changes
    omfRepository.saveModifiedObjects();

    // Load the created UML profile as meta profile into the profile manager
    omfRepository.refreshProfileManager(true);
}

/**
 * This method returns the generated UML element corresponding to the given meta element.
 */
function getUmlElement(metaElement) {
    var item = database.FindGUID(metaElement.getGuid());
    return omf.toOmfObject(item);
}

/**
 * Creates a UML enumertaion "Priority" with two literals "high" and "low" in the profile
 */
function createUmlEnumerationPriority() {
    umlEnumeration = umlProfile.createPackagedElementAsEnumeration();
    umlEnumeration.setName(ENUMERATION_NAME, null);
    umlEnumerationLiteral_High = umlEnumeration.createOwnedLiteral();
    umlEnumerationLiteral_High.setName(LITERAL_HIGH_NAME, null);
    umlEnumerationLiteral_Low = umlEnumeration.createOwnedLiteral();
    umlEnumerationLiteral_Low.setName(LITERAL_LOW_NAME, null);
}

/**
 * Creates a UML stereotype with the given name extending the meta class represented by the given UML class
 */
function createUmlStereotype(name, umlMetaClass) {
    var umlStereotype = umlProfile.createPackagedElementAsStereotype();
    umlStereotype.setName(name, null);
    var property = umlStereotype.createOwnedAttributeAsProperty();
    property.setName("base_" + umlMetaClass.getName(null), null);
    property.setType(umlMetaClass);
    var extension = umlProfile.createPackagedElementAsExtension();
    extension.setName("E_" + name + "_" + umlMetaClass.getName(null), null);
    extension.addMemberEnd(property);
    var extensionEnd = extension.createOwnedEndAsExtensionEnd();
    extensionEnd.setName("extension_" + name, null);
    extensionEnd.setType(umlStereotype);
	// According to the UML2 specification, ExtensionEnds must always have isComposite = true:
    extensionEnd.setAggregation(Constants.UML2_AGGREGATION_KIND_COMPOSITE);
    return umlStereotype;
}

/**
 * Creates an attribute with the given name and type for the given stereotype
 */
function createUmlStereotypeAttribute(umlStereotype, name, type) {
    var property = umlStereotype.createOwnedAttributeAsProperty();
    property.setName(name, null);
    property.setType(type);
    return property;
}

/**
 * Identifies the meta profile and its stereotypes by using the corresponding UML profile.
 */
function identifyMetaProfileByUmlProfile() {

    // The ProfileElementsAccess provides methods for navigating between UML 2 profile elements
    // and their representation in the OMF meta layer:
    var profileElementsAccess = omfRepository.getProfileElementsAccess();
    
    metaProfile = profileElementsAccess.elementToProfile(umlProfile);
    
    metaStereotype_BusinessUseCase = 
            profileElementsAccess.elementToStereotype(umlStereotype_BusinessUseCase);
    metaProperty_IsFinished = 
            metaStereotype_BusinessUseCase.getAttributeByName(PROPERTY_IS_FINISHED_NAME);
    metaProperty_Effort = 
            metaStereotype_BusinessUseCase.getAttributeByName(PROPERTY_EFFORT_NAME);
    metaProperty_Priority = 
            metaStereotype_BusinessUseCase.getAttributeByName(PROPERTY_PRIORITY_NAME);

    metaStereotype_BusinessUseCaseDiagram = 
            profileElementsAccess.elementToStereotype(umlStereotype_BusinessUseCaseDiagram);
    metaProperty_Stakeholders = 
            metaStereotype_BusinessUseCaseDiagram.getAttributeByName(PROPERTY_STAKEHOLDERS_NAME);
    
    var metaEnumeration_Priority = metaProperty_Priority.getType();
    metaEnumerationLiteral_High = metaEnumeration_Priority.getLiteralByName(LITERAL_HIGH_NAME);
    metaEnumerationLiteral_Low = metaEnumeration_Priority.getLiteralByName(LITERAL_LOW_NAME);
}

/**
 * Identifies the meta profile and its stereotypes by using their names.
 */
function identifyMetaProfileByName() {

    // The profile manager provides access to all meta profiles supported by its repository:
    var profileManager = omfRepository.getProfileManager();
    
    metaProfile = profileManager.getProfileByName(PROFILE_NAME);
    
    metaStereotype_BusinessUseCase = 
            metaProfile.getApplicableStereotypeByName(USE_CASE_STEREOTYPE_NAME);
    metaProperty_IsFinished = 
            metaStereotype_BusinessUseCase.getAttributeByName(PROPERTY_IS_FINISHED_NAME);
    metaProperty_Effort = 
            metaStereotype_BusinessUseCase.getAttributeByName(PROPERTY_EFFORT_NAME);
    metaProperty_Priority = 
            metaStereotype_BusinessUseCase.getAttributeByName(PROPERTY_PRIORITY_NAME);

    metaStereotype_BusinessUseCaseDiagram = 
            metaProfile.getApplicableStereotypeByName(USE_CASE_DIAGRAM_STEREOTYPE_NAME);
    metaProperty_Stakeholders = 
            metaStereotype_BusinessUseCaseDiagram.getAttributeByName(PROPERTY_STAKEHOLDERS_NAME);
    
    var metaEnumeration_Priority = metaProperty_Priority.getType();
    metaEnumerationLiteral_High = metaEnumeration_Priority.getLiteralByName(LITERAL_HIGH_NAME);
    metaEnumerationLiteral_Low = metaEnumeration_Priority.getLiteralByName(LITERAL_LOW_NAME);
}

/**
 * Create a UML model containing a use case diagram with a use case and applies the profile
 * and its sterotypes to the model and its content
 */
function createUmlModel() {
    // Create a new mpodel in the main group:
    var umlModel = umlFactory.createModel(rootGroup);
    umlModel.setName("MyModel", null);
    
    // Apply the meta profile to the model:
    umlModel.omfApplyProfile(metaProfile);
    
    // Create a new use case diagram in the model:
    var umlUseCaseDiagram = umlModel.omfCreateDiagram(Constants.UML2_USE_CASE_DIAGRAM);
    umlUseCaseDiagram.omfSetName("MyUseCases", null);

    // Apply the meta stereotype «BusinessUseCaseDiagram» to the diagram:
    var diagramStereotypeApplication = umlUseCaseDiagram.omfApplyStereotype(metaStereotype_BusinessUseCaseDiagram);
    
    // Specifiy a value for the stereotype attribute "stakeholders":
    diagramStereotypeApplication.omfSet(metaProperty_Stakeholders, "John Doe", null);
    
    // Create a new use case in the model:
    var umlUseCase = umlModel.createPackagedElementAsUseCase();
    umlUseCase.setName("MyUseCase", null);

    // Apply the meta stereotype «BusinessUseCase» to the use case:
    var stereotypeApplication = umlUseCase.omfApplyStereotype(metaStereotype_BusinessUseCase);
    
    // Specifiy values for the stereotype attribute:
    stereotypeApplication.omfSet(metaProperty_IsFinished, true, null);
    stereotypeApplication.omfSet(metaProperty_Effort, new java.lang.Integer(42), null);
    stereotypeApplication.omfSet(metaProperty_Priority, metaEnumerationLiteral_High, null);

    // Create a node presentation of the use case in the diagram:
    var useCasePresentation = 
            umlUseCaseDiagram.omfCreateNodePresentation(
                    Constants.UML2_SYMBOL_USE_CASE, umlUseCase, null, 
                    new java.awt.Rectangle(200, 200, 800, 400));

    // Save the model
    omfRepository.saveModifiedObjects();
}
