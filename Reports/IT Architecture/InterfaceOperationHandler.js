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

/* const */ ImportProvider.NO_ERROR = "NO_ERROR"; /* no error */
/* const */ ImportProvider.TEMPORARY_ERROR = "TEMPORARY_ERROR"; /* i.e. open model */
/* const */ ImportProvider.METHOD_ERROR = "METHOD_ERROR"; /* item not found in ARIS method */
/* const */ ImportProvider.STRUCTURAL_ERROR = "STRUCTURAL_ERROR"; /* the structure of the received operation is invalid, configuration error) */
/* const */ ImportProvider.NOT_FOUND_ERROR = "NOT_FOUND_ERROR"; /* objects involved in the operation could not be found */
/* const */ ImportProvider.WRITE_ERROR = "WRITE_ERROR"; /* report framework write function failed (creating/deleting/...) */
/* const */ ImportProvider.UNKNOWN_ERROR = "UNKNOWN_ERROR"; /* everything else (class casts, null pointer etc.) */


function InterfaceOperationHandler() {

    var modelsToLayout = new Packages.java.util.HashSet();

    var createdItems;

    var interfaceDiagramType;
    var sourceSystemSymbol;
    var targetSystemSymbol;
    var protocolSymbol;
    var dataTypeSymbol;

    this.handle = function(db, processor) {
        var interfaceOperationBlocks = readInterfaces(db, processor);
        if(!interfaceOperationBlocks) {
            processor.setStatus(ImportProvider.SKIPPED,ImportProvider.NO_ERROR,"No Interfaces available",-1, false);
            return;
        }

        //iterate all interfaces
        var blockIt = interfaceOperationBlocks.keySet().iterator();
        while(blockIt.hasNext()) {
            try {
                var interfaceModelGUID = blockIt.next();
                var interfaceOperationBlock = interfaceOperationBlocks.get(interfaceModelGUID);
                initSymbolTypes(interfaceOperationBlock);
                //updated interface - only dataType changes (add, remove)
                if(interfaceOperationBlock.isOnlyDataTypeChanges()){
                    var addDataObjectIds = interfaceOperationBlock.getAddDataTypeGUID();
                    var removeDataObjectIds = interfaceOperationBlock.getRemoveDataTypeGUID();
                    var addDataObject = new java.util.LinkedList();
                    var removeDataObject = new java.util.LinkedList();

                    for(var i = 0; i< addDataObjectIds.size(); i++){
                        addDataObject.add(db.FindGUID(addDataObjectIds.get(i)));
                    }
                    for(var i = 0; i< removeDataObjectIds.size(); i++){
                        removeDataObject.add(db.FindGUID(removeDataObjectIds.get(i)));
                    }
                    // check if all objects have been found and operation can continue
                    var validDataObject = true;
                    for(var i=0; i< addDataObject.size(); i++){
                        validDataObject = validDataObject && addDataObject.get(i).IsValid();
                    }
                    for(var i=0; i< removeDataObject.size(); i++){
                        validDataObject = validDataObject && removeDataObject.get(i).IsValid();
                    }
                    if (!validDataObject ) {
                        interfaceOperationBlock.setStatus(processor ,2 ,ImportProvider.NOT_FOUND_ERROR, "One dataType object could not be found. Operation aborted.");
                        continue;
                    }

                    var interfaceModelObject = findInterfaceDetailModelByGUID(db, interfaceModelGUID);
                    if (!interfaceModelObject) {
                        interfaceOperationBlock.setStatus(processor ,2 ,ImportProvider.NOT_FOUND_ERROR, "Interface model could not be found. Operation aborted.");
                        continue;
                    }
                    
                    if(!isWriteable(interfaceModelObject.getInterfaceModel())) 
                            throw new OperationException(ImportProvider.TEMPORARY_ERROR, "Model is not writable. Its changes must be delayed too.");
                    
                    changeDataTypeForInterfaceDetailModel(interfaceModelObject, addDataObject, removeDataObject);
                    interfaceOperationBlock.setSuccessStatus(processor);
                    continue;
                }

                if(interfaceOperationBlock && interfaceOperationBlock.isValid()) {

                    // obtain basic operation settings & context object
                    var command = interfaceOperationBlock.getInterfaceCommand();

                    if(command != "set" && command != "unset") {
                        interfaceOperationBlock.setStatus(processor,2 ,ImportProvider.STRUCTURAL_ERROR, "Command" + command + "is unknown for this handler");
                        continue;
                    }
                    var sourceObject = db.FindGUID(interfaceOperationBlock.getSourceSystemGUID());
                    var targetObject = db.FindGUID(interfaceOperationBlock.getTargetSystemGUID());
                    var protocolObject = db.FindGUID(interfaceOperationBlock.getProtocolGUID());
                    var dataObject = new java.util.LinkedList();
                    var dataObjectIds = interfaceOperationBlock.getDataTypeGUID();
                    for(var i = 0; i< dataObjectIds.size(); i++){
                        dataObject.add(db.FindGUID(dataObjectIds.get(i)));
                    }
                                        
                    if(sourceObject.IsValid()){
                        var capitalChar = sourceObject.Name(interfaceOperationBlock.getSourceDiagLocale()).substring(0,1);
                        if((capitalChar >= 'a' && capitalChar <= 'z')  || (capitalChar >= 'A' && capitalChar <= 'Z')){
                            capitalChar = capitalChar.toUpperCase();
                        }else if(capitalChar >= '0' && capitalChar <= '9'){
                        }else{
                            capitalChar = null;
                        }
                        interfaceOperationBlock.setCapitalOrderChar(capitalChar);
                    }

                    var sourceDiagramGroup = interfaceOperationBlock.getGroupOfDiagram("sourceDiagram",sourceObject,targetObject,db);
                    var targetDiagramGroup = interfaceOperationBlock.getGroupOfDiagram("targetDiagram",sourceObject,targetObject,db);
                    var interfaceDiagramGroup = interfaceOperationBlock.getGroupOfDiagram("interfaceDiagram",sourceObject,targetObject,db);

                    if(!checkModelsWriteable(sourceObject, targetObject, sourceDiagramGroup, targetDiagramGroup, getInterfaceDiagramType())) {
                        throw new OperationException(ImportProvider.TEMPORARY_ERROR, "Model is not writable. Its changes must be delayed too.");
                    }
                    
                    // check if all objects have been found and operation can continue
                    var validDataObject = true;
                    for(var i=0; i< dataObject.size(); i++){
                        validDataObject = validDataObject && dataObject.get(i).IsValid();
                    }

                    if (!sourceObject.IsValid() || !targetObject.IsValid() || !protocolObject.IsValid() ||
                        !validDataObject || !interfaceDiagramGroup.IsValid() || !sourceDiagramGroup.IsValid() ||
                        !targetDiagramGroup.IsValid()) {

                        interfaceOperationBlock.setStatus(processor ,2 ,ImportProvider.NOT_FOUND_ERROR, "One object or model path could not be found. Operation aborted.");
                        continue;
                    }

                    var interfaceCxnDef = getInterfaceCxnDef(sourceObject,targetObject);

                    // Step 1 - operate source diagram: find or create -> find or create connection between source and target object
                    var createdCxnDef = handlePrgStructureDiagram(sourceObject,targetObject,sourceDiagramGroup,
                                                                        interfaceOperationBlock.getSourceDiagLocale() ,command,true,interfaceCxnDef,interfaceOperationBlock);

                    //interfaceCxnDef was create in interfaceModel
                    if(createdCxnDef && !interfaceCxnDef) {
                        interfaceCxnDef = createdCxnDef;
                    }

                    if(!interfaceCxnDef)
                        continue;

                    // Step 2 - operate target diagram: find or create -> find or create connection between source and target object
                    handlePrgStructureDiagram(sourceObject,targetObject, targetDiagramGroup,
                                        interfaceOperationBlock.getTargetDiagLocale(), command,false, interfaceCxnDef,interfaceOperationBlock);


                    // Interface-Connection is correct -->  Check assigned interface model
                    var interfaceModels = interfaceCxnDef.AssignedModels(getInterfaceDiagramType());
                    var interfaceModelObjects = findInterfaceDetailModels(sourceObject, targetObject, dataObject, protocolObject, interfaceModels);

                    //Set interface Model
                    if(command == "set") {
                        var found = false;
                        //already set
                        if(interfaceModelObjects.length > 0) {
                            for(var i=0;i<interfaceModelObjects.length;i++) {
                                //check if model contain all dataTypes
                                if(interfaceModelObjects[i].checkIfContainsDataType(dataObject)) {
                                    found = true;
                                    break;
                                }
                            }
                        }

                        if(found){
                            interfaceOperationBlock.setStatus(processor,1,ImportProvider.NO_ERROR, "Operation result already in place. Operation does not need to be performed.");
                        }else{
                            var createdModel = addInterfaceDetailModel(sourceObject,dataObject,targetObject,protocolObject,interfaceDiagramGroup,
                                                            interfaceOperationBlock.getInterfaceDiagLocale(), interfaceOperationBlock.getInterfaceName());
                            createdModel.ModifyGUID(interfaceModelGUID);
                            interfaceCxnDef.CreateAssignment(createdModel);
                            interfaceOperationBlock.setSuccessStatus(processor);
                        }
                    }

                    //Unset InterfaceModel
                    else if(command == "unset") {
                        if(interfaceModelObjects.length == 0) {
                            interfaceOperationBlock.setStatus(processor,1,ImportProvider.NO_ERROR, "InterfaceModel does not exisits, nothing to do");
                            continue;
                        }
                        else {
                            var modelName;
                            //iterate over interfaceModels and unset each of them (usually 1)
                            for(var i=0;i< interfaceModelObjects.length;i++ ) {
                              if(interfaceModelObjects[i].checkIfContainsDataType(dataObject)) {
                                var model = interfaceModelObjects[i].getInterfaceModel();
                                if(model)
                                    modelName = model.Attribute(Constants.AT_NAME, interfaceOperationBlock.getInterfaceDiagLocale()).getValue();

                                interfaceModelObjects[i].unset(sourceObject,targetObject,dataObject,interfaceDiagramGroup);
                              }
                            }
                        }

                        var interfaceModels = interfaceCxnDef.AssignedModels(getInterfaceDiagramType());
                        if(interfaceModels.length == 0) {
                            if(!interfaceCxnDef.Delete()) {
                                throw "Unable to delete interface-cxndef between source and target";
                            }
                        }

                        if(modelName)
                            interfaceOperationBlock.setInterfaceName(modelName);

                        interfaceOperationBlock.setSuccessStatus(processor);
                    }
                }
                else {
                    throw "Interface - Operations not valid!!!";
                    continue;
                }
            }catch (e) {
                if (e.errorCode == ImportProvider.TEMPORARY_ERROR) {
                    interfaceOperationBlock.setStatus(processor, 3 ,ImportProvider.TEMPORARY_ERROR, "Not all required models are writeble.");
                    processor.setStatus(ImportProvider.DELAYED, ImportProvider.TEMPORARY_ERROR, "", -1, false);
                } else {
                    var exceptionMessage = e + "";
                    interfaceOperationBlock.setStatus(processor,2,ImportProvider.UNKNOWN_ERROR, "Caught exception: " + exceptionMessage);
                    processor.setStatus(ImportProvider.FAILED, e.errorCode, "", -1, false);
                }
            }
        }

    }

    // handle structure diagram
    function handlePrgStructureDiagram(sourceObject,targetObject, diagramGroup, diagramlocale, command,isSourceObject, createdCxnDef,
                                        interfaceOperationBlock) {
        var objectName;
        var sourceModel;
        var interfaceCxnDef = createdCxnDef;

        if(isSourceObject)
            objectName = sourceObject.Attribute(Constants.AT_NAME, diagramlocale).getValue();
        else {
            objectName = targetObject.Attribute(Constants.AT_NAME, diagramlocale).getValue();
        }
        //no more than one model should be in this group
        var interfaceModels = diagramGroup.ModelListFilter(getInterfaceDiagramType());

        // ############## SET #############
        if(command == "set") {
            //setting up the model
            if (interfaceModels.length == 0) { // no model found --> model has to be created, also the occurrences and the connection-def
                sourceModel = diagramGroup.CreateModel(getInterfaceDiagramType(), objectName, diagramlocale);
                var sourceOcc = sourceModel.createObjOcc(getSourceSystemSymbol(), sourceObject, 300, 300, true);
                var targetOcc = sourceModel.createObjOcc(getTargetSystemSymbol(), targetObject, 400, 400, true);
                interfaceCxnDef = createSystemInterfaceCxn(sourceModel,sourceOcc, targetOcc,createdCxnDef,interfaceOperationBlock);
                if(!sourceOcc.IsValid() || !targetOcc.IsValid() || !interfaceCxnDef.IsValid()) {
                    throw "Unable to create interface - model for sytem: " + objectName;
                }
            }
            else {
                sourceModel = interfaceModels[0];
                var sourceOcc = getOrCreateOccInModel(sourceObject,sourceModel,getSourceSystemSymbol());
                var targetOcc = getOrCreateOccInModel(targetObject,sourceModel,getTargetSystemSymbol());
                interfaceCxnDef = createSystemInterfaceCxn(sourceModel,sourceOcc, targetOcc,createdCxnDef,interfaceOperationBlock);
            }
            //trigger template for created occs
            // bugfix anubis id:326204
                // sourceModel.setTemplate(sourceModel.getTemplate());
                // sourceModel.doLayout();
                modelsToLayout.add(sourceModel);
            // bugfix anubis id:326204

            return interfaceCxnDef;

        }
        // ########### UNSET ###############
        else if(command == "unset") {
            if(interfaceModels.length == 0) {
                interfaceOperationBlock.setStatus(processor, 1,ImportProvider.NO_ERROR, "No interface model available -> skipped");
            }
            else if(interfaceModels.length == 1) {
                sourceModel = interfaceModels[0];
                cleanInterfaceModel(sourceObject,targetObject,sourceModel,diagramGroup);
            }
            else {
                throw "Unable to unset interface, cause there are too many interface models";
            }
        }
    }

    /**
     * Removes SourceOcc and TargetOcc from InterfaceModel
     * @param sourceObject Source-System
     * @param targetObject Target-System
     * @param interfaceModel Interface-Model
     */
    function cleanInterfaceModel(sourceObject,targetObject,interfaceModel,diagramGroup) {
        var sourceSystemOccs = sourceObject.OccListInModel(interfaceModel);
        for(var i=0;i<sourceSystemOccs.length;i++) {
            var outGoingCxns = sourceSystemOccs[i].Cxns(Constants.EDGES_OUT);
            for(var j=0;j<outGoingCxns.length;j++) {
                var cxnOcc = outGoingCxns[j];
                var sourceOcc = cxnOcc.SourceObjOcc();
                var targetOcc = cxnOcc.TargetObjOcc();
                if (cxnOcc.CxnDef().TypeNum() == Constants.CT_SENDS_3 && targetOcc.ObjDef().equals(targetObject)) {

                    var interfaceModels = cxnOcc.CxnDef().AssignedModels(getInterfaceDiagramType());
                    if(interfaceModels.length <= 1) {
                        cxnOcc.Remove();
                    }

                    if(sourceOcc.Cxns().length <= 0 ) {
                        var objDefs = diagramGroup.ObjDefList();
                        var sourceDef = sourceOcc.ObjDef();
                        var found = false;
                        for(var k=0;k<objDefs.length;k++){
                            if(objDefs[k].equals(sourceDef)){
                                found = true;
                                break;
                            }
                        }
                        if(!found)
                            sourceOcc.Remove();
                    }
                    if(targetOcc.Cxns().length <= 0 ) {
                        var objDefs = diagramGroup.ObjDefList();
                        var targetDef = targetOcc.ObjDef();
                        var found = false;
                        for(var k=0;k<objDefs.length;k++){
                            if(objDefs[k].equals(targetDef)){
                                found = true;
                                break;
                            }
                        }
                        if(!found)
                            targetOcc.Remove();
                    }

                }
            }
        }
    }

    /**
     * If no Occurence of the given ObjDef exists, the method will create a new one
     * @param objectDef the object definition
     * @param systemModel the model
     * @param symbol Sysmbol to use for the occ
     */
    function getOrCreateOccInModel(objectDef, systemModel,symbol) {
        var systemOccs = objectDef.OccListInModel(systemModel);
        if (systemOccs.length == 0) {
            return systemModel.createObjOcc(symbol, objectDef, 400, 400, true);
        }
        else {
            return systemOccs[0]
        }
    }

    /**
     * Creates a Connection of type CT_SENDS_3 between the occurences of
     * sourceItSystem and targetItSystem. If the CxnDef is given, it will be used, otherwise
     * a new definition will be created.
     *
     * @param interfaceModel InterfaceModel MT_PRG_STRCT_CHRT
     * @param sourceOcc Occurence of the sourcSystem
     * @param targetOcc Occurence of the targetSystem
     * @param interfaceCxnDef Definition of the connection between source and target
     * @param interfaceOperationBlock
     * @return
     */
    function createSystemInterfaceCxn(interfaceModel,sourceOcc, targetOcc,interfaceCxnDef,interfaceOperationBlock) {
        if(!interfaceCxnDef) {
            var interfaceCxnOcc = interfaceModel.CreateCxnOcc(sourceOcc, targetOcc, Constants.CT_SENDS_3, new Array(), false);
            if (!interfaceCxnOcc.IsValid()) {
                interfaceOperationBlock.setStatus(processor,2, ImportProvider.WRITE_ERROR, "Interface-Connection could not be created. Operation aborted.");
                return null;
            }
            return interfaceCxnOcc.CxnDef();
        }
        else {
            if(interfaceCxnDef.OccListInModel(interfaceModel).length == 0) {
                var interfaceCxnOcc = interfaceModel.CreateCxnOcc(sourceOcc, targetOcc,interfaceCxnDef, new Array(), false);
                if (!interfaceCxnOcc.IsValid()) {
                    interfaceOperationBlock.setStatus(processor,2, ImportProvider.WRITE_ERROR, "Interface-Connection could not be created. Operation aborted.");
                    return null;
                }
            }
            return interfaceCxnDef;
        }
    }

    function changeDataTypeForInterfaceDetailModel(interfaceModel, addDataObject, removeDataObject){
        var sourceOcc = interfaceModel.getSourceSystemOccs().get(0);
        var targetOcc = interfaceModel.getTargetSystemOccs().get(0);
        
        addDataTypeForInterfaceModel(interfaceModel.getInterfaceModel(), addDataObject, sourceOcc, targetOcc);
        removeDataTypeForInterfaceModel(interfaceModel.getInterfaceModel(), removeDataObject, sourceOcc, targetOcc);
        modelsToLayout.add(interfaceModel.getInterfaceModel());
    }

    function addDataTypeForInterfaceModel(createdModel, dataObject, sourceOcc, targetOcc){
        for(var i = 0; i< dataObject.size(); i++){
            var newDataOcc = createdModel.createObjOcc(getDataTypeSymbol(),dataObject.get(i),0,0,true);
            createCxnOcc(sourceOcc.ObjDef(),dataObject.get(i),sourceOcc,newDataOcc,createdModel, Constants.CT_HAS_OUT);
            createCxnOcc(dataObject.get(i),targetOcc.ObjDef,newDataOcc,targetOcc,createdModel, Constants.CT_IS_INP_FOR);
        }
    }

    function removeDataTypeForInterfaceModel(model, dataObject, sourceOcc, targetOcc){
        var sourceDef = sourceOcc.ObjDef();
        var targetDef = targetOcc.ObjDef();

        for(var k=0; k<dataObject.size();k++){
            var dataTypeOccs = dataObject.get(k).OccListInModel(model);
            for(var i=0;i<dataTypeOccs.length;i++) {
                  var dataTypeOcc = dataTypeOccs[i];

                        var dataTypeCxns = dataTypeOcc.Cxns();
                        //find all Cxns from/to Datatype
                        // if there are connection to the specified systems, remove them with their def
                        for(var j=0;j<dataTypeCxns.length;j++) {
                            if(dataTypeCxns[j].CxnDef().TypeNum() == Constants.CT_IS_INP_FOR &&
                                    dataTypeCxns[j].TargetObjOcc().ObjDef().equals(targetDef)) {
                                dataTypeCxns[j].Remove(true);
                                continue;
                            }
                            if(dataTypeCxns[j].CxnDef().TypeNum() == Constants.CT_HAS_OUT &&
                                    dataTypeCxns[j].SourceObjOcc().ObjDef().equals(sourceDef)) {
                                dataTypeCxns[j].Remove(true);
                                continue;
                            }
                        }
                        dataTypeOcc.Remove(false);

            }
        }
    }
    /*
    Methods for interface model MT_PRG_STRCT_CHRT
    */
    function addInterfaceDetailModel(sourceObject,dataObject,targetObject,protocolObject,interfaceDiagramGroup,interfaceDiagLocale, interfaceName) {
        var createdModel = interfaceDiagramGroup.CreateModel(getInterfaceDiagramType(),interfaceName,interfaceDiagLocale);

        var sourceOcc = createdModel.createObjOcc(getSourceSystemSymbol(),sourceObject,0,0,true);
        var targetOcc = createdModel.createObjOcc(getTargetSystemSymbol(),targetObject,0,0,true);

        addDataTypeForInterfaceModel(createdModel, dataObject, sourceOcc, targetOcc);

        var protocolOcc = createdModel.createObjOcc(getProtocolSymbol(),protocolObject,0,0,true);
        createCxnOcc(sourceObject,protocolObject,sourceOcc,protocolOcc,createdModel, Constants.CT_USE_1);
        createCxnOcc(targetObject,protocolObject,targetOcc,protocolOcc,createdModel, Constants.CT_USE_1);

        // bugfix anubis id:326204
            // createdModel.setTemplate(createdModel.getTemplate());
            // createdModel.doLayout();
            modelsToLayout.add(createdModel);
        // bugfix anubis id:326204

        return createdModel;
    }

    //Creates a connection occ
    //if a def is avaible, it will be used, otherwise a new CxnDef will be created
    function createCxnOcc(sourceDef,targetDef,sourceOcc,targetOcc,interfaceModel, cxnType) {
        var sourceToTargetCxns = sourceDef.CxnListFilter(Constants.EDGES_OUT,cxnType);
        var created = false;
        for(var i=0;i<sourceToTargetCxns.length;i++) {
            if(sourceToTargetCxns[i].TargetObjDef().equals(targetDef)) {
                interfaceModel.CreateCxnOcc(sourceOcc,targetOcc,sourceToTargetCxns[i],new Array(),false);
                created = true;
                break;
            }
        }
        if(!created) {
            interfaceModel.CreateCxnOcc(true,sourceOcc,targetOcc,cxnType,new Array());
        }
    }

    function findInterfaceDetailModelByGUID(db, interfaceModelGUID) {
        var sourceDef = null;
        var targetDef = null;

        var interfaceModel = db.FindGUID(interfaceModelGUID);
        var superiorCxn = interfaceModel.SuperiorCxnDefs();
        for(var i=0; i< superiorCxn.length; i++){
            if(superiorCxn[i].TypeNum() == Constants.CT_SENDS_3){
                sourceDef = superiorCxn[i].SourceObjDef();
                targetDef = superiorCxn[i].TargetObjDef();
            }
        }

        if(!sourceDef || !targetDef)
            return null;

        var interfaceModelObject = new InterfaceModelObject(interfaceModel);

        var sourceOccs = sourceDef.OccListInModel(interfaceModel);
        for(var j=0;j<sourceOccs.length;j++) {
             interfaceModelObject.addSourceSystemOcc(sourceOccs[j]);
        }
        var targetOccs = targetDef.OccListInModel(interfaceModel);
        for(var j=0; j<targetOccs.length; j++){
            interfaceModelObject.addTargetSystemOcc(targetOccs[j]);
        }
        return interfaceModelObject;
    }

    function findInterfaceDetailModels(sourceDef, targetDef, dataDef, protocolDef, interfaceModels) {
        var interfaceModelObjects = new Array();
        for(var i=0;i<interfaceModels.length;i++) {
            var protocolOccs = protocolDef.OccListInModel(interfaceModels[i]);
            if(protocolOccs.length == 0 || protocolOccs.length > 1) {
                continue;//not relevant
            }
            var protocolCxns = protocolOccs[0].Cxns();
            var sourceFound = false;
            var targetFound = false;
            for(var j=0;j<protocolCxns.length;j++) {
                if(protocolCxns[j].SourceObjOcc().ObjDef().equals(sourceDef)) {
                    sourceFound = true;
                }
                if(protocolCxns[j].SourceObjOcc().ObjDef().equals(targetDef)) {
                    targetFound = true;
                }
            }
            if(sourceFound && targetFound) {
                var interfaceModelObject = new InterfaceModelObject(interfaceModels[i]);
                interfaceModelObject.protocolOcc = protocolOccs[0];
                var found = false;
                var sourceOccs = sourceDef.OccListInModel(interfaceModels[i]);
                for(var j=0;j<sourceOccs.length;j++) {
                    interfaceModelObject.addSourceSystemOcc(sourceOccs[j]);
                    var outgoingCxns = sourceOccs[j].Cxns(Constants.EDGES_OUT);
                    for(var k=0;k<outgoingCxns.length;k++) {
                        if(outgoingCxns[k].CxnDef().TypeNum() == Constants.CT_HAS_OUT) {
                            var dataOcc = outgoingCxns[k].TargetObjOcc();
                            var dataCxnsOut = dataOcc.Cxns(Constants.EDGES_OUT);
                            for(var m=0;m<dataCxnsOut.length;m++) {
                                if(dataCxnsOut[m].CxnDef().TypeNum() == Constants.CT_IS_INP_FOR &&
                                    dataCxnsOut[m].TargetObjOcc().ObjDef().equals(targetDef)) {
                                    //gefunden
                                    found = true;
                                    interfaceModelObject.addDataTypeOcc(dataOcc);
                                    interfaceModelObject.addTargetSystemOcc(dataCxnsOut[m].TargetObjOcc());
                                }
                            }
                        }
                    }
                }
                if(found) {
                    interfaceModelObjects.push(interfaceModelObject);
                }
            }
        }
        return interfaceModelObjects;
    }

    this.getModelsToLayout = function(){
        return modelsToLayout;
    }

    function getInterfaceDiagramType(){
        return interfaceDiagramType;
    }

    function getSourceSystemSymbol(){
        return sourceSystemSymbol;
    }

    function getTargetSystemSymbol(){
        return targetSystemSymbol;
    }

    function getProtocolSymbol(){
        return protocolSymbol;
    }

    function getDataTypeSymbol(){
        return dataTypeSymbol;
    }

    function initSymbolTypes(interfaceOperationBlock){
        interfaceDiagramType = interfaceOperationBlock.getInterfaceDiagramType();
        sourceSystemSymbol = interfaceOperationBlock.getSourceSystemSymbol();
        targetSystemSymbol = interfaceOperationBlock.getTargetSystemSymbol();
        protocolSymbol = interfaceOperationBlock.getProtocolSymbol();
        dataTypeSymbol = interfaceOperationBlock.getDataTypeSymbol();
    }
}

/*
    Object to handle InterfaceModels
*/
function InterfaceModelObject(interfaceModelOverview) {

    var interfaceModel = interfaceModelOverview;
    var sourceSystemOccs = new java.util.LinkedList();
    var targetSystemOccs = new java.util.LinkedList();
    var dataTypeOccs = new java.util.LinkedList();
    this.protocolOcc;

    //adds a sourceSystemOcc to the object
    this.addSourceSystemOcc = function(sourceOcc) {
        if(!sourceSystemOccs.contains(sourceOcc)) {
            sourceSystemOccs.add(sourceOcc);
        }
    }
    //adds a targetSystemOcc to the object
    this.addTargetSystemOcc = function(targetOcc) {
        if(!targetSystemOccs.contains(targetOcc)) {
            targetSystemOccs.add(targetOcc);
        }
    }
    //adds a datatypeOcc to the object
    this.addDataTypeOcc = function(dataTypeOcc) {
        if(!dataTypeOccs.contains(dataTypeOcc)) {
           dataTypeOccs.add(dataTypeOcc);
        }
    }

    this.getSourceSystemOccs= function(){
        return sourceSystemOccs;
    }

    this.getTargetSystemOccs = function(){
        return targetSystemOccs;
    }

    //checks if all object-occs availble
    this.isValid = function() {
        if(sourceSystemOccs.size() > 0 && targetSystemOccs.size() > 0
            && dataTypeOccs.size() > 0 && this.protocolOcc) {
            return true;
        }
        else {
            return false;
        }
    }

    this.checkIfContainsDataType = function(dataType) {
        if(this.isValid()) {
            for(var i =0; i<dataType.size(); i++){
                var dataTypeDef = dataType.get(i);
                var found = false;
                for( var j = 0; j<dataTypeOccs.size(); j++){
                    if(dataTypeOccs.get(j).ObjDef().equals(dataTypeDef)){
                        found = true;
                        continue;
                    }
                }
                if(!found)
                    return false;
            }
            return true;
        }
        return false;
    }

    //unsets's the occs in the imterface model
    this.unset = function(sourceObject,targetObject,dataTypeObject,diagramGroup) {
        if(this.isValid()) {
            //more datatype occ in the model, so remove only selected
            if(dataTypeOccs.size() > dataTypeObject.size()) {
                for(var i=0;i<dataTypeOccs.size();i++) {
                  var dataTypeOcc = dataTypeOccs.get(i);
                  //find datatype
                  for(var j=0; j< dataTypeObject; j++) {
                    if(dataTypeOcc.ObjDef().equals(dataTypeObject.get(j))) {
                        var dataTypeCxns = dataTypeOcc.Cxns();
                        //find all Cxns from/to Datatype
                        // if there are connection to the specified systems, remove them with their def
                        for(var j=0;j<dataTypeCxns.length;j++) {
                            if(dataTypeCxns[j].CxnDef().TypeNum() == Constants.CT_IS_INP_FOR &&
                                    dataTypeCxns[j].TargetObjOcc().ObjDef().equals(targetObject)) {
                                dataTypeCxns[j].Remove(true);
                                continue;
                            }
                            if(dataTypeCxns[j].CxnDef().TypeNum() == Constants.CT_HAS_OUT &&
                                    dataTypeCxns[j].SourceObjOcc().ObjDef().equals(sourceObject)) {
                                dataTypeCxns[j].Remove(true);
                                continue;
                            }
                        }
                        dataTypeOcc.Remove(false);
                    }
                  }
                }
            }
            else {
                //Remove all Cxns from/to ItSystem with CxnDef
                for(var i =0; i< dataTypeOccs.size(); i++) {
                    var dataTypeCxns = dataTypeOccs.get(i).Cxns();
                    for(var j=0;j<dataTypeCxns.length;j++) {
                        if(dataTypeCxns[j].CxnDef().TypeNum() == Constants.CT_IS_INP_FOR &&
                                      dataTypeCxns[j].TargetObjOcc().ObjDef().equals(targetObject)) {
                            dataTypeCxns[j].Remove(true);
                            continue;
                        }
                        if(dataTypeCxns[j].CxnDef().TypeNum() == Constants.CT_HAS_OUT &&
                            dataTypeCxns[j].SourceObjOcc().ObjDef().equals(sourceObject)) {
                            dataTypeCxns[j].Remove(true);
                            continue;
                        }
                    }
                    //Remove datatype without def
                    dataTypeOccs.get(i).Remove(false);
                }

                var protoCxns = this.protocolOcc.Cxns();
                for(var i=0;i<protoCxns.length;i++) {
                    var sourceOcc = protoCxns[i].SourceObjOcc();
                    if(sourceOcc.ObjDef().equals(sourceObject) || sourceOcc.ObjDef().equals(targetObject)) {
                        var protoCxnDef = protoCxns[i].CxnDef();
                        if(protoCxnDef.OccList().length > 1)
                            protoCxns[i].Remove(false);
                        else {
                            protoCxns[i].Remove(true);
                        }
                        sourceOcc.Remove(false);
                    }
                }
                this.protocolOcc.Remove(false);
            }
            if(interfaceModel.ObjOccList().length == 0) {
                diagramGroup.Delete(interfaceModel);
            }
        }
    }
    this.getInterfaceModel = function() {
        return interfaceModel;
    }
}

function InterfaceOperationBlock() {
    var interfaceOperation;

    var sourceDiagramXMLElement;
    var targetDiagramXMLElement;
    var interfaceDiagramXMLElement;
    var interfaceName;

    var sourceDiagLocale;
    var targetDiagLocale;
    var interfaceDiagLocale;
    var capitalOrderChar;

    this.sourceSystemOperation;
    this.targetSystemOperation;
    this.dataTypeOperation = new java.util.LinkedList();
    this.protocolOperation;
    this.nameOperation;

    this.onlyDataTypeChanges=false;

    var interfaceDiagramType;
    var sourceSystemSymbol;
    var targetSystemSymbol;
    var protocolSymbol;
    var dataTypeSymbol;

    this.setInterfaceOperation = function(operation) {
        interfaceOperation = operation;
        sourceDiagramXMLElement = interfaceOperation.getElementsByTagName("sourceDiagram").item(0);
        targetDiagramXMLElement = interfaceOperation.getElementsByTagName("targetDiagram").item(0);
        interfaceDiagramXMLElement = interfaceOperation.getElementsByTagName("interfaceDiagram").item(0);

        sourceDiagLocale = sourceDiagramXMLElement.getAttribute("locale");
        targetDiagLocale = targetDiagramXMLElement.getAttribute("locale");
        interfaceDiagLocale = interfaceDiagramXMLElement.getAttribute("locale");
    }

    this.getSourceSystemGUID = function() {
        return this.sourceSystemOperation.getElementsByTagName("objectGUID").item(0).getAttribute("value");
    }

    this.getTargetSystemGUID = function() {
        return this.targetSystemOperation.getElementsByTagName("objectGUID").item(0).getAttribute("value");
    }
    this.getDataTypeGUID = function() {
        var result = new java.util.LinkedList();
        for (var i = 0; i < this.dataTypeOperation.size(); i++){
            result.add(this.dataTypeOperation.get(i).getElementsByTagName("objectGUID").item(0).getAttribute("value"));
        }
        return result;
    }
    this.getAddDataTypeGUID = function() {
        var result = new java.util.LinkedList();
        for (var i = 0; i < this.dataTypeOperation.size(); i++){
            if(this.dataTypeOperation.get(i).getAttribute("command")=="set"){
                result.add(this.dataTypeOperation.get(i).getElementsByTagName("objectGUID").item(0).getAttribute("value"));
            }
        }
        return result;
    }
    this.getRemoveDataTypeGUID = function() {
        var result = new java.util.LinkedList();
        for (var i = 0; i < this.dataTypeOperation.size(); i++){
            if(this.dataTypeOperation.get(i).getAttribute("command")=="unset"){
                result.add(this.dataTypeOperation.get(i).getElementsByTagName("objectGUID").item(0).getAttribute("value"));
            }
        }
        return result;
    }
    this.getProtocolGUID = function() {
        return this.protocolOperation.getElementsByTagName("objectGUID").item(0).getAttribute("value");
    }

    this.getInterfaceCommand = function() {
        return interfaceOperation.getAttribute("command");
    }

    this.getInterfaceName = function() {
        if(!interfaceName) {
            if(this.nameOperation) {
                interfaceName = this.nameOperation.getElementsByTagName("name").item(0).getAttribute("value");
            }
        }

        return interfaceName;
    }

    this.getDateTypeName = function (operation){
        return operation.getElementsByTagName("name").item(0).getAttribute("value")
                + ", "+operation.getElementsByTagName("objectGUID").item(0).getAttribute("value");
    }

    this.getDataTypeLocale = function (operation){
        return operation.getElementsByTagName("name").item(0).getAttribute("locale");
    }

    this.setInterfaceName = function(name) {
        interfaceName = name;
    }

    this.getSourceDiagLocale = function() {
        return sourceDiagLocale;
    }

    this.getTargetDiagLocale = function() {
        return targetDiagLocale;
    }

    this.getInterfaceDiagLocale = function() {
        return interfaceDiagLocale;
    }



    this.isValid = function() {
        var validDataType = true;
        for(var i = 0; i< this.dataTypeOperation.size(); i++){
            validDataType = validDataType && this.dataTypeOperation.get(i);
        }
        if(interfaceOperation && this.sourceSystemOperation && this.targetSystemOperation
                                && validDataType && this.protocolOperation) {
            return true;
        }
        else {
            return false;
        }
    }

    this.isOnlyDataTypeChanges = function(){
        var validDataType = true;
        for(var i = 0; i< this.dataTypeOperation.size(); i++) {
            validDataType = validDataType && this.dataTypeOperation.get(i);
        }

        if(!interfaceOperation && !this.sourceSystemOperation && !this.targetSystemOperation
                                && validDataType && !this.protocolOperation) {
            return true;
        }
        return false;
    }

    this.getGroupOfDiagram = function(diagramName, sourceDef, targetDef, db) {
        var xmlGroupElement;

        switch(diagramName) {
            case "sourceDiagram":
                    xmlGroupElement = sourceDiagramXMLElement;
                    break;
            case "targetDiagram":
                    xmlGroupElement = targetDiagramXMLElement;
                    break;
            case "interfaceDiagram":
                    xmlGroupElement = interfaceDiagramXMLElement;
                    break;
        }

        var useFallbackPath = xmlGroupElement.getAttribute("fallbackPath");

        var grouppath = xmlGroupElement.getAttribute("path");

        // try to resolve the ${alphabeticalOrderChar} marker if defined
        var capitalChar = this.getCapitalOrderChar();

        if(capitalChar != null && capitalChar != "") {
            grouppath = grouppath.replaceAll("\\$\\{capitalOrderChar\\}", capitalChar);
        }

        var grouplocale = xmlGroupElement.getAttribute("locale");
        if(grouplocale == "") {
            grouplocale = -1;
        }

        var sourceGroupPath = this.getEscapedPath(sourceDef.Group(), grouplocale);
        var targetGroupPath = this.getEscapedPath(targetDef.Group(), grouplocale);

        grouppath = grouppath.replaceAll("\\$\\{sourcegroup\\}", sourceGroupPath);
        grouppath = grouppath.replaceAll("\\$\\{targetgroup\\}", targetGroupPath);

        var result = db.Group(getPath(grouppath), grouplocale);

        if((result == null || !result.IsValid()) && useFallbackPath){
            grouppath = xmlGroupElement.getAttribute("fallbackPath");
            result = db.Group(getPath(grouppath), grouplocale);
        }
        return result;
    }

    /**
    * Return path for group (the special character "/" "\" for group names are escaped)
    * @param group
    *
    * @return path for group
    */
    this.getEscapedPath = function(group, grouplocale){
        var groups = new java.util.LinkedList();
        do{
            var groupName = group.Name(grouplocale);
            groupName = groupName.replaceAll("/","//").replaceAll("\\\\","/\\\\\\\\");
            groups.add(groupName);
            group = group.Parent();
        } while(group.IsValid());

        var result ="";
        for(var i =groups.size()-1; i>=0; i--){
            result+=groups.get(i);
            if(i!=0)
                result+="\\\\";
        }
        return result;
    }

    this.setStatus = function(processor, status, errorCode, message) {
        if(interfaceOperation)
            processor.setStatusForElement(interfaceOperation, status,errorCode ,message ,0, true, this.getInterfaceName());
        if(this.sourceSystemOperation)
            processor.setStatusForElement(this.sourceSystemOperation ,status ,errorCode , message ,interfaceDiagLocale, false);
        if(this.targetSystemOperation)
            processor.setStatusForElement(this.targetSystemOperation ,status ,errorCode , message ,interfaceDiagLocale, false);
        if(this.protocolOperation)
            processor.setStatusForElement(this.protocolOperation ,status ,errorCode , message ,interfaceDiagLocale, false);
        if(this.dataTypeOperation){
            for(var i=0; i< this.dataTypeOperation.size(); i++){
                if(this.dataTypeOperation.get(i)){
                    var value = this.getDateTypeName(this.dataTypeOperation.get(i));
                    var dataTypeLocale = this.getDataTypeLocale(this.dataTypeOperation.get(i));
                    processor.setStatusForElement(this.dataTypeOperation.get(i) ,status ,errorCode , message ,0, true, value);
                }
            }
        }
        if(this.nameOperation)
            processor.setStatusForElement(this.nameOperation ,status ,errorCode , message ,interfaceDiagLocale, false);
    }

    this.setSuccessStatus = function(processor) {
        if(!this.isOnlyDataTypeChanges()){
            processor.setStatusForElement(interfaceOperation, 0 ,ImportProvider.NO_ERROR , "Interface successfull" , 0, true, this.getInterfaceName());
            processor.setStatusForElement(this.sourceSystemOperation ,0 ,ImportProvider.NO_ERROR ,"source system successfull" ,interfaceDiagLocale, false);
            processor.setStatusForElement(this.targetSystemOperation ,0 ,ImportProvider.NO_ERROR , "target system successfull" ,interfaceDiagLocale, false);
            processor.setStatusForElement(this.protocolOperation ,0 ,ImportProvider.NO_ERROR , "protocol successfull" ,interfaceDiagLocale, false);
        }

        for(var i=0; i< this.dataTypeOperation.size(); i++){
                var value = this.getDateTypeName(this.dataTypeOperation.get(i));
                var dataTypeLocale = this.getDataTypeLocale(this.dataTypeOperation.get(i));
                processor.setStatusForElement(this.dataTypeOperation.get(i) ,0 ,ImportProvider.NO_ERROR , "dataType successfull" ,0, true, value);
        }

        if(!this.isOnlyDataTypeChanges()){
            if(this.nameOperation)
                processor.setStatusForElement(this.nameOperation, 0, null, null, -1, false);
        }
    }

    this.getCapitalOrderChar = function() {
        return capitalOrderChar;
    }

    this.setCapitalOrderChar = function(capitalChar){
        capitalOrderChar = capitalChar;
    }


    this.getInterfaceDiagramType = function(){
        if(interfaceOperation){
            return this.getTypeNum(interfaceOperation);
        }
        return null;
    }

    this.getSourceSystemSymbol = function(){
        if(this.sourceSystemOperation){
            return this.getTypeNum(this.sourceSystemOperation);
        }
        return null;
    }

    this.getTargetSystemSymbol = function(){
        if(this.targetSystemOperation){
            return this.getTypeNum(this.targetSystemOperation);
        }
        return null;
    }

    this.getProtocolSymbol = function(){
        if(this.protocolOperation){
            return this.getTypeNum(this.protocolOperation);
        }
        return null;
    }

    this.getDataTypeSymbol = function(){
        if(this.dataTypeOperation && this.dataTypeOperation.size() >0){
            return this.getTypeNum(this.dataTypeOperation.get(0));
        }
        return null;
    }
    this.getTypeNum = function(operation){
        return operation.getElementsByTagName("typeNum").item(0).getAttribute("value");
    }
}


function readInterfaces(db, processor) {
    var operation;
    var interfaceOperationBlocks = new java.util.HashMap();

    //first, read the complete interfaceOperations
    while ((operation = processor.next()) != null) {
         var interfaceOperationBlock;
         try {
            var propertyName = "" + operation.getAttribute("property");
            if(propertyName == "interfaces") {
                var interfaceGuid = operation.getElementsByTagName("objectGUID").item(0).getAttribute("value");
                interfaceOperationBlock = interfaceOperationBlocks.get(interfaceGuid);
                if(!interfaceOperationBlock) {
                    interfaceOperationBlock = new InterfaceOperationBlock();
                    interfaceOperationBlocks.put(interfaceGuid,interfaceOperationBlock);
                }
                interfaceOperationBlock.setInterfaceOperation(operation);
                continue;
            }
            else if(propertyName == "sourceSystem" || propertyName == "targetSystem"
                        || propertyName == "protocol" || propertyName == "dataType" || propertyName == "name") {

                var blockGuid = operation.getElementsByTagName("object").item(0).getAttribute("value");
                interfaceOperationBlock = interfaceOperationBlocks.get(blockGuid);
                if(!interfaceOperationBlock) {
                    interfaceOperationBlock = new InterfaceOperationBlock();
                    interfaceOperationBlocks.put(blockGuid,interfaceOperationBlock);
                }

                switch (propertyName) {
                    case "sourceSystem":
                            interfaceOperationBlock.sourceSystemOperation = operation;
                            break;
                    case "targetSystem":
                            interfaceOperationBlock.targetSystemOperation = operation;
                            break;
                    case "protocol":
                            interfaceOperationBlock.protocolOperation = operation;
                            break;
                    case "dataType":
                            interfaceOperationBlock.dataTypeOperation.add(operation);
                            break;
                    case "name":
                            interfaceOperationBlock.nameOperation = operation;
                }
            }
            else {
                continue;
            }
        } catch (e) {
            var exceptionMessage = e + "";
            processor.setStatus(ImportProvider.FAILED,ImportProvider.UNKNOWN_ERROR, "Caught exception while reading interfaceObjects: " + exceptionMessage,-1,false);
            continue;
        }
    }
    return interfaceOperationBlocks;
}


function isWriteable(theModel) {
        var theFlags = theModel.Flags();
        try {
            return theModel.SetFlags(theFlags);
        } catch (e) {
            return false;
        }
}


function checkModelsWriteable(sourceObject, targetObject, sourceDiagramGroup, targetDiagramGroup, interfaceDiagramType) {

    var writeable = true;
    var sourceModels = sourceDiagramGroup.ModelListFilter(interfaceDiagramType);
    for(var i=0;i<sourceModels.length;i++) {
        var objOccs = sourceModels[i].ObjOccListFilter(sourceObject.TypeNum());
        for(var j=0;j<objOccs.length;j++) {
            if(objOccs[j].ObjDef().equals(sourceObject)) {
                writeable = writeable && isWriteable(sourceModels[i]);
                break;
            }
        }
        if(!writeable) {
            return false;
        }
    }

    var targetModels = targetDiagramGroup.ModelListFilter(interfaceDiagramType);

    for(var i=0;i<targetModels.length;i++) {
        var objOccs = targetModels[i].ObjOccListFilter(targetObject.TypeNum());
        for(var j=0;j<objOccs.length;j++) {
            if(objOccs[j].ObjDef().equals(targetObject)) {
               writeable = writeable && isWriteable(targetModels[i]);
               break;
            }
        }
        if(!writeable) {
            return false;
        }
    }

    var interfaceCxnDef = getInterfaceCxnDef(sourceObject, targetObject);
    if(interfaceCxnDef) {
        var interfaceModels = interfaceCxnDef.AssignedModels(interfaceDiagramType);
        for(var i=0;i<interfaceModels.length;i++) {
            writeable = writeable && isWriteable(interfaceModels[i]);
        }
    }
    return writeable;
}

function getInterfaceCxnDef(sourceObject, targetObject) {
    var cxnDefs = sourceObject.CxnListFilter(Constants.EDGES_OUT, Constants.CT_SENDS_3);
    for(var i=0;i<cxnDefs.length;i++) {
        if(cxnDefs[i].TargetObjDef().equals(targetObject)) {
            return cxnDefs[i];
        }
    }
    return null;
}

function OperationException(errorCode, message) {
        this.errorCode = errorCode;
        this.message = message;
}
