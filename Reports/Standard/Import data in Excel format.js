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

// global declarations
var g_nLoc = Context.getSelectedLanguage();
var g_oMethodFilter = ArisData.getActiveDatabase().ActiveFilter();
var g_oGroup = ArisData.getSelectedGroups()[0];
var g_permModelTypes = g_oMethodFilter.ModelTypes(Constants.ARISVIEW_ALL);
var options = {};


var c_sSEPARATOR = "###";

var c_sMAP_OBJ  = "Mapping_Obj";
var c_sMAP_CXN  = "Mapping_Cxn";
var c_sMAP_ATTR = "Mapping_Attr";
var c_sMAP_SYM  = "Mapping_Sym";
var c_sMAP_MOD  = "Mapping_Mod";

var g_oOutfile = Context.createOutputObject(Context.getSelectedFormat(), Context.getSelectedFile());
g_oOutfile.Init(g_nLoc);
g_oOutfile.DefineF("OUT_HEAD", getString("TEXT_1"), 10, Constants.C_BLACK,
    Constants.C_TRANSPARENT, Constants.FMT_CENTER | Constants.FMT_BOLD, 0, 0, 0, 0, 0, 1);
g_oOutfile.DefineF("OUT_STD", getString("TEXT_1"), 10, Constants.C_BLACK,
    Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);
g_oOutfile.DefineF("OUT_STD2", getString("TEXT_1"), 10, Constants.C_BLACK,
    Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0, 0, 0, 0, 0, 1);
var g_bErrorExists = false;

// Tree map with created objects
var g_mapObjects = new java.util.TreeMap();
// Tree map with created cxns
var g_mapCxns = new java.util.TreeMap();

main();

/*----------------------------------------------------------------------------*/

function main()
{
    // TODO Remove. For debug only
    /*
    var allModels = g_oGroup.ModelList();
    for (var i=0; i < allModels.length; i++) {
        try {
            g_oGroup.Delete(allModels[i]);
        }
        catch (e) {
            ;
        }
    }
    var allObjects = g_oGroup.ObjDefList();
    for (var i=0; i < allObjects.length; i++) {
        try {
            g_oGroup.Delete(allObjects[i]);
        } catch (e) {
            ;
        }
    }*/
    var dialogResult = showOptionsDialog();
    
    if (dialogResult && dialogResult != Constants.MSGBOX_RESULT_CANCEL)
    {
        var file = getPathAndFile();
        if (file != null) {
            if (file.getData().length > 1) {
                // BLUE-28236 - Optimization for large import files
                ArisData.Save(Constants.SAVE_ONDEMAND);
                
                // out protocol            
                g_oOutfile.BeginTable(100, Constants.C_BLACK, Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0);  
                g_oOutfile.TableRow();
                g_oOutfile.TableCellF(getString("TEXT_2"), 20, "OUT_HEAD");
                g_oOutfile.TableCellF(getString("TEXT_3"), 20, "OUT_HEAD");
                g_oOutfile.TableCellF(getString("TEXT_4"), 60, "OUT_HEAD");
                
                var workbook = Context.getExcelReader(file.getData());
                // get mapping-tables            
                var mapObj = getMapping(workbook, c_sMAP_OBJ);
                var mapCxn = getMapping(workbook, c_sMAP_CXN);
                var mapAttr = getMapping(workbook, c_sMAP_ATTR);
                var mapSym = getMapping(workbook, c_sMAP_SYM);
                            
                if (userHasWriteRights())
                {
                    importObjects(workbook, mapObj, mapAttr, mapSym);
                    importCxns(workbook, mapCxn, mapAttr, mapObj);   // Anubis 425613: Create cxn defs before creating model -> cxn occs in model will be created based on cxn defs                    
                    var modelsObjs = importModelStructure(workbook, mapSym, mapCxn, mapObj);
                    importModelAtts(workbook, modelsObjs, mapAttr);
//                    importCxns(workbook, mapCxn, mapAttr, mapObj);
                } else {
                    outputError("", "", "", getString("TEXT_26"));
                }
                ArisData.Save(Constants.SAVE_NOW);
                ArisData.Save(Constants.SAVE_AUTO);                
            }
            
            g_oOutfile.TableRow();
            g_oOutfile.TableCellF(getString("TEXT_5"), 100, "OUT_STD");
                
            g_oOutfile.EndTable("", 100, getString("TEXT_1"), 10, Constants.C_BLACK,
                Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0);        
            g_oOutfile.WriteReport();
            Context.addActionResult(Constants.ACTION_UPDATE, "", g_oGroup);
            return;
        }
    }
    
    //cancel pressed in first or second dialog
    g_oOutfile.WriteReport()
    Context.deleteFile( Context.getSelectedFile() )
    Context.setScriptError(Constants.ERR_NOFILECREATED)
}

// Checks whether current user has write rights on selected group
function userHasWriteRights() {
    var oUser = ArisData.ActiveUser();
    if( (oUser.AccessRights(g_oGroup, true) & Constants.AR_WRITE) == Constants.AR_WRITE) {
            return true;
    }
    return false;
}

function helper_createAssignment(p_model, p_obj) {
    var allowedAssignments = g_oMethodFilter.Assignments(p_obj.TypeNum());
    if (!javaArrayContains(allowedAssignments, parseInt(p_model.TypeNum()))) {
        // If no assignment can be created than do nothing.
        ;
    } else {
        try {
            p_obj.CreateAssignment(p_model);
        }
        catch (e) {
            Dialogs.MsgBox(e.Description);
        }        
    }
}

function makeModelLayout(p_createdModels) {
    for (var i = 0; i < p_createdModels.length; i++) {
        p_createdModels[i].doLayout();      // Anubis 460771
    }
}

// Imports models, objects and cxns from "Model_Structure" sheet
function importModelStructure(p_workbook, p_mapSym, p_mapCxn, p_mapObj) {
    var sheetName = "Model_Structure";
    var sheet = getSheetByName(p_workbook, sheetName);
    if (sheet == null) {
        // Error: "Model_Structure" sheet is not found
        outputError(sheetName, "", "", "'"+sheetName + "' " + getString("TEXT_19"));
        return;
    } else {
        var numOfModelTypeColumn = getColumnNumber(sheet, "M_TYPE");
        var numOfSymbolColumn = getColumnNumber(sheet, "SYMBOL");
        var numOfCxnColumn = getColumnNumber(sheet, "CXNS");
        var numOfObjNameColumn = getColumnNumber(sheet, "Object_Name");
        if (numOfModelTypeColumn == null || numOfSymbolColumn == null ||
                numOfCxnColumn == null || numOfObjNameColumn == null) {
            // Error: at least one of required column headers is not found
            outputError(sheetName, "", "", getString("TEXT_21"));
        } else {
            // Read objects
            var rowNum = 1;
            var mapModels = getMapping(p_workbook, c_sMAP_MOD);
            var modelsObjs = new java.util.TreeMap();
            var createdModels = new Array();
            var createdRootObjects = new Array();
            var createdObjOccs = new Array();
            var cxnsRows = collectCxnRowNumbers(p_workbook, p_mapCxn, p_mapObj);
                
            if (isMatrixModel(sheet, mapModels, numOfModelTypeColumn)) {                
                // BLUE-21510 Import matrix model
                importMatrixModel(sheet, mapModels, rowNum, numOfObjNameColumn,
                    numOfModelTypeColumn, numOfSymbolColumn, numOfCxnColumn, numOfObjNameColumn,
                    p_mapSym, sheetName, null, null, p_mapCxn, createdModels, createdRootObjects,
                    modelsObjs, createdObjOccs, cxnsRows);    
                    
            } else {
                importColumnOfModelStructure(sheet, mapModels, rowNum, numOfObjNameColumn,
                    numOfModelTypeColumn, numOfSymbolColumn, numOfCxnColumn, numOfObjNameColumn,
                    p_mapSym, sheetName, null, null, p_mapCxn, createdModels, createdRootObjects,
                    modelsObjs, createdObjOccs, cxnsRows);
                makeModelLayout(createdModels, modelsObjs);
            }
        }
    }
    ArisData.Save(Constants.SAVE_NOW);
    ArisData.getActiveDatabase().clearCaches();
    
    return modelsObjs;
}

function isMatrixModel(p_sheet, p_mapModels, p_numOfModelTypeColumn) {
    var rowNum = 1;
    var modelType = getCellEntry(p_sheet.cell(rowNum, p_numOfModelTypeColumn));
    return parseInt(p_mapModels.get(modelType)) == Constants.MT_MATRIX_MOD;
}

function javaArrayContains(p_Array, element) {
    for (var i = 0 ; i < p_Array.length; i++) {
      if (p_Array[i] == element) return true;
    }
    return false;
}

function createModel(p_mapModels, p_modelType, p_objName, p_objType, p_createdModels,
        p_modelsObjs, p_sheetName, p_rowNum, p_colNum) {
    // Check if this model type is permitted by method filter
    if (!javaArrayContains(g_permModelTypes, parseInt(p_mapModels.get(p_modelType)))) {
        // Error: model type is not allowed by the filter
        outputError(p_sheetName, p_rowNum+1, p_colNum+1,
            formatstring1(getString("TEXT_27"), p_modelType));
        return null;
    } else {
        try {
            var modelObj = g_oGroup.CreateModel(p_mapModels.get(p_modelType), p_objName, g_nLoc);
        }
        catch (e) {
            Dialogs.MsgBox(getString("TEXT_30")+e.Description);
        }    
        if (modelObj != null) {
            p_modelsObjs.put(p_objName + c_sSEPARATOR + p_objType, modelObj);
            p_modelsObjs.put(p_objName + c_sSEPARATOR + p_modelType, modelObj);
//          p_createdModels.push(p_objName + c_sSEPARATOR + p_objType);
            p_createdModels.push(modelObj)      // Anubis 460771
        }
        return modelObj;        
    }
}

function importMatrixModel(p_sheet, p_mapModels, p_rowNum, p_colNum, p_numOfModelTypeColumn,
        p_numOfSymbolColumn, p_numOfCxnColumn, p_numOfObjNameColumn, p_mapSym, p_sheetName,
        p_modelObj, p_rootObj, p_mapCxn, p_createdModels, p_createdRootObjects, p_modelsObjs,
        p_createdObjOccs, p_cxnsRows) {
            
    var colNum = p_colNum;
    var oMatrixModel = p_modelObj;

    var rowSymbolSet = new java.util.HashSet();
    var colSymbolSet = new java.util.HashSet();
    var aMatrixCxnData = new Array();
    
    var srcSymbol = null;
    var trgSymbol = null;    
    var srcObjDef = null;
    var trgObjDef = null;    
    
    var isRoot = true;
    for (var rowNum = p_rowNum; ; rowNum++) {
        var bIsRowHeader = true;
        var objName = getCellEntry(p_sheet.cell(rowNum, colNum));
        
        if (objName == "") {
            objName = getCellEntry(p_sheet.cell(rowNum, colNum+1));
            bIsRowHeader = false;
            
            trgObjDef = null;    
        } else {
            srcObjDef = null;
            trgObjDef = null;    
        }

        if (objName == "") {
            break;
        }
        var modelType = getCellEntry(p_sheet.cell(rowNum, p_numOfModelTypeColumn));
        var symName   = getCellEntry(p_sheet.cell(rowNum, p_numOfSymbolColumn));
        var cxnName   = getCellEntry(p_sheet.cell(rowNum, p_numOfCxnColumn));
        
        var temp = modelStructure_createObject(symName, p_mapSym, rowNum,
            p_numOfSymbolColumn, p_sheetName, isRoot, p_mapModels, modelType, objName,
            p_createdModels, p_modelsObjs, p_rootObj, p_sheet, p_numOfCxnColumn, p_mapCxn,
            oMatrixModel, p_createdObjOccs, p_cxnsRows, p_numOfModelTypeColumn);

        if (temp != null) {                
            oObjDef = temp[0];
            oMatrixModel = temp[1].getMatrixModel();          

            var nSymbol = oObjDef.getDefaultSymbolNum();
            
            if (!isContainedInMatrixHeader(oMatrixModel, oObjDef, bIsRowHeader)) {         
                // Ensure that header objects are only created once
                oMatrixModel.createHeaderCell(null, oObjDef, nSymbol, -1, bIsRowHeader);
            }

            if (bIsRowHeader) {
                srcSymbol = nSymbol;
                srcObjDef = oObjDef;
                rowSymbolSet.add(nSymbol);
            } else {
                trgSymbol = nSymbol;                
                trgObjDef = oObjDef;               
                colSymbolSet.add(nSymbol);
            }
            
            if (srcObjDef != null && trgObjDef != null) {
                var cxnType = getCxnNum(cxnName);
                if (cxnType != null) {
                    createCxn(srcObjDef, trgObjDef, cxnType);
                    
                    if (srcSymbol == trgSymbol) {
                        aMatrixCxnData.push(oMatrixModel.createNewMatrixConnectionDataObject(srcSymbol, trgSymbol, cxnType, true, true, false));        
                        aMatrixCxnData.push(oMatrixModel.createNewMatrixConnectionDataObject(srcSymbol, trgSymbol, cxnType, false, true, false));
                    } else {
                        aMatrixCxnData.push(oMatrixModel.createNewMatrixConnectionDataObject(srcSymbol, trgSymbol, cxnType, null, true, false));        
                    }
                }
            }
        }
        isRoot = false;
    }
    oMatrixModel.setCxnData(aMatrixCxnData);
    
    if (oMatrixModel != null) {
        var aRowSymbols = [].concat(rowSymbolSet.toArray());
        var aColSymbols = [].concat(colSymbolSet.toArray());        
        
        oMatrixModel.setVisibleObjectSymbolTypes(aRowSymbols, true);
        oMatrixModel.setVisibleObjectSymbolTypes(aColSymbols, false);    
    }    

    function getCxnNum(cxnName) {
        if (cxnName != "") {
            var cxnNum = p_mapCxn.get(cxnName);
            if (cxnNum != null) {
                return cxnNum;
            }
        }
        // Error
        outputError(p_sheetName, p_rowNum+1, "",
        formatstring1(getString("TEXT_12"), cxnName));
        return null;
    }

    function isContainedInMatrixHeader(oMatrixModel, oObjDef, bIsRowHeader) {
        var matrixHeader = oMatrixModel.getHeader(bIsRowHeader);
        var matrixHeaderCells = matrixHeader.getCells();
        for (var i=0; i< matrixHeaderCells.length; i++) {
            if (oObjDef.IsEqual(matrixHeaderCells[i].getDefinition())) {
                return true;
            }
        }
        return false;
    }
}

// Recursively read columns objects and their children
function importColumnOfModelStructure(p_sheet, p_mapModels, p_rowNum, p_colNum, p_numOfModelTypeColumn,
        p_numOfSymbolColumn, p_numOfCxnColumn, p_numOfObjNameColumn, p_mapSym, p_sheetName,
        p_modelObj, p_rootObj, p_mapCxn, p_createdModels, p_createdRootObjects, p_modelsObjs,
        p_createdObjOccs, p_cxnsRows) {
    var objName;
    var colNum = p_colNum;
    var isRoot = false;
    if (colNum == p_numOfObjNameColumn) {
        isRoot = true;
    }
    for (var rowNum = p_rowNum; ; rowNum++) {
        var objName = getCellEntry(p_sheet.cell(rowNum, colNum));
        if (objName == "")
        {
            return rowNum-1;
        } else {
            var modelType = getCellEntry(p_sheet.cell(rowNum, p_numOfModelTypeColumn));
            var symName = getCellEntry(p_sheet.cell(rowNum, p_numOfSymbolColumn));
            var temp = modelStructure_createObject(symName, p_mapSym, rowNum,
                p_numOfSymbolColumn, p_sheetName, isRoot, p_mapModels, modelType, objName,
                p_createdModels, p_modelsObjs, p_rootObj, p_sheet, p_numOfCxnColumn, p_mapCxn,
                p_modelObj, p_createdObjOccs, p_cxnsRows, p_numOfModelTypeColumn);
            if (temp != null) {                
                // If object def and occ were successefully created, then                
                // read children
                objOcc = temp[0];
                var modelObj = temp[1];
                rowNum = importColumnOfModelStructure(p_sheet, p_mapModels, rowNum+1, p_colNum+1,
                    p_numOfModelTypeColumn, p_numOfSymbolColumn, p_numOfCxnColumn, p_numOfObjNameColumn,
                    p_mapSym, p_sheetName, modelObj, objOcc, p_mapCxn, p_createdModels,
                    p_createdRootObjects, p_modelsObjs, p_createdObjOccs, p_cxnsRows);
            }
        }
    }
}

function modelStructure_createObject(p_symName, p_mapSym, p_rowNum, p_numberOfSymbolColumn,
        p_sheetName, p_isRoot, p_mapModels, p_modelType, p_objName, p_createdModels,
        p_modelsObjs, p_rootObj, p_sheet, p_numOfCxnColumn, p_mapCxn, p_modelObj,
        p_createdObjOccs, p_cxnsRows, p_numOfModelTypeColumn) {
    if (p_symName != "") {
        // Symbol name is defined. Try to map it.
        var symbol = p_mapSym.get(p_symName);
        if (symbol == null) {
            outputError(p_sheetName, p_rowNum+1, p_numberOfSymbolColumn+1, "'"+p_symName+"' "+getString("TEXT_20"));
            return;
        }
    } else {
        // Try to get symbol type by method if only one is possible
        var symbol = getAllowedSymbolType(p_modelObj.TypeNum());
        if (symbol == null) {
            outputError(p_sheetName, p_rowNum+1, p_numberOfSymbolColumn+1,
                formatstring1(getString("TEXT_33"), p_objName));
            return;
        }
    }            

    // Get object type by its symbol
    var objType = ArisData.getActiveDatabase().ActiveFilter().SymbolObjType(symbol);
    if (objType != null) {
        // If root object then create new model. Otherwise use existing
        if (p_isRoot) {
            ArisData.Save(Constants.SAVE_NOW);
            ArisData.getActiveDatabase().clearCaches();
        
            p_modelObj = createModel(p_mapModels, p_modelType, p_objName, objType,
                p_createdModels, p_modelsObjs, p_sheetName, p_rowNum, p_numOfModelTypeColumn);
        }
        // Create object only if it's not already created
        var objectDef = g_mapObjects.get(p_objName + c_sSEPARATOR + objType);
        if (objectDef == null) {
            try {
                objectDef = g_oGroup.CreateObjDef(objType, p_objName, g_nLoc);
                if (symbol != null) {
                    objectDef.setDefaultSymbolNum(symbol, false);   // BLUE-17200
                }
            }
            catch (exc) {
                var createException = exc;
            }
        }
        if (objectDef == null || !objectDef.IsValid()) {
            var error = formatstring1(getString("TEXT_6"), p_objName);
            if (createException != null) error += " "+createException;
            outputError(p_sheetName, p_rowNum+1, "", error);
        } else {
            if (isMatrixModel(p_sheet, p_mapModels, p_numOfModelTypeColumn)) {
                g_mapObjects.put(p_objName + c_sSEPARATOR + objType, objectDef);
                var temp = new Array();
                temp[0] = objectDef;
                temp[1] = p_modelObj;
                return temp;
            } else {
                // mapping entry
                g_mapObjects.put(p_objName + c_sSEPARATOR + objType, objectDef);
                var objOcc = modelStructure_createObjOcc(p_modelObj, symbol, objectDef,
                    p_rootObj, p_sheet, p_rowNum, p_numOfCxnColumn, p_mapCxn, p_createdObjOccs,
                    p_isRoot, p_cxnsRows, p_sheetName);
                var temp = new Array();
                temp[0] = objOcc;
                temp[1] = p_modelObj;
                return temp;
            }
        }            
    }
    return null;
}

function modelStructure_createObjOcc(p_modelObj, p_symbol, p_objectDef, p_rootObj,
    p_sheet, p_rowNum, p_numOfCxnColumn, p_mapCxn, p_createdObjOccs, p_isRoot,
    p_cxnsRows, p_sheetName) {
    if (p_modelObj != null)
    {
        if (p_symbol) {
            // Check if symbol is allowed by the method
            var allowedSymbols = g_oMethodFilter.Symbols(p_modelObj.TypeNum(), p_objectDef.TypeNum());
            if (!javaArrayContains(allowedSymbols, parseInt(p_symbol))) {
                outputError(p_sheetName, p_rowNum+1, "",
                    formatstring3(getString("TEXT_31"),
                            g_oMethodFilter.getAPIName(Constants.CID_OBJOCC, p_symbol),
                            g_oMethodFilter.getAPIName(Constants.CID_MODEL, p_modelObj.TypeNum()),
                            g_oMethodFilter.getAPIName(Constants.CID_OBJDEF, p_objectDef.TypeNum())
                        )
                    );
                return null;
            } else {
                try {
                    var objOcc = p_modelObj.createObjOcc(p_symbol, p_objectDef, 1, 1, true);
                }
                catch (exc) {
                    var objOccException = exc;
                }
                if (objOcc != null) {
                    var objName = p_objectDef.Name(g_nLoc);                    //
                    // If occ was already created during this run and object is root,
                    // then create assignment (but only if options specify to do that
                    var objIdentifier = objName+c_sSEPARATOR+p_objectDef.TypeNum(); // AGA-5592, Applix 297918 - Identifier contains now object name and type (was name and symbol before: 'objName+c_sSEPARATOR+p_symbol')
                    if (options.createAssignments && p_isRoot && p_createdObjOccs[objIdentifier]) {
                        helper_createAssignment(p_modelObj, p_objectDef);
                    }
                    p_createdObjOccs[objIdentifier] = true;
                    modelStructure_createCxnOcc(p_rootObj, p_sheet, p_rowNum,
                        p_numOfCxnColumn, p_mapCxn, p_modelObj, objOcc, p_cxnsRows, p_sheetName);
                }
            }
        }
    }
    return objOcc;
}
                    

function modelStructure_createCxnOcc(p_rootObj, p_sheet, p_rowNum, p_numOfCxnColumn, p_mapCxn,
        p_modelObj, p_objOcc, p_cxnsRows, p_sheetName) {
    if (p_rootObj != null) {
        var sourceName = p_objOcc.ObjDef().Name(g_nLoc);
        var targetName = p_rootObj.ObjDef().Name(g_nLoc);
        var sourceNameAndType = sourceName+c_sSEPARATOR+p_objOcc.ObjDef().TypeNum();
        var targetNameAndType = targetName+c_sSEPARATOR+p_objOcc.ObjDef().TypeNum();        
        var cxnName = getCellEntry(p_sheet.cell(p_rowNum, p_numOfCxnColumn));
        // If cxn name is empty in Model_Structure sheet then
        if (cxnName == "") {
            // Read cxn from Cxns sheet
            cxnName = p_cxnsRows[sourceName+c_sSEPARATOR+targetName] ||
                        p_cxnsRows[sourceNameAndType+c_sSEPARATOR+targetNameAndType];
        }
        // If cxn name is empty in Cxns sheet then            
        if (cxnName == null) {
            // try to get by method if it (method) allows exactly one type
            if (typeof(p_sourceObjOcc) != "undefined" && typeof(p_targetObjOcc) != "undefined") {
                var cxnNum = getAllowedCxnType(p_sourceObjOcc.ObjDef(), p_targetObjOcc.ObjDef());
            }
        }
        
        if ((cxnName == "" || cxnName == null) && cxnNum == null) {
            outputError(p_sheetName, p_rowNum+1, "", getString("TEXT_25"));
        } else {
            // Create cxn
            var oCxn = createCxnOcc(p_modelObj, p_rootObj, p_objOcc,
                cxnName, p_sheetName, p_rowNum, p_mapCxn, cxnNum);
            if (oCxn == null || !oCxn.IsValid()) {
                var error = formatstring3(getString("TEXT_9"), sourceName, targetName, cxnName);
                outputError(p_sheetName, p_rowNum+1, "", error);
            } else {
                // Remember cxn
                g_mapCxns.put(sourceName+c_sSEPARATOR+targetName, oCxn.CxnDef());
                g_mapCxns.put(sourceNameAndType+c_sSEPARATOR+targetNameAndType, oCxn.CxnDef());
            }
        }
    }
}

// Returns a new created cxn occ
function createCxnOcc(p_model, p_sourceObjOcc, p_targetObjOcc, p_cxnName,
        p_sheetName, p_rowNum, p_mapCxn, p_cxnNum) {
    if (p_model == null) return null;
    if (p_cxnNum == null) {
        var cxnNum = p_mapCxn.get(p_cxnName);
        if (cxnNum == null) {
            outputError(p_sheetName, p_rowNum+1, "",
                formatstring1(getString("TEXT_12"), p_cxnName));
            return null;
        }
    } else {
        var cxnNum = p_cxnNum;
    }
    var sourcePoint = new java.awt.Point(1,1);
    var targetPoint = new java.awt.Point(1,1);
    var pointArray = new Array(sourcePoint, targetPoint);    
    // check whether cxn type is allowed by the filter
    var allowedCxns = g_oMethodFilter.CxnTypes(p_model.TypeNum(), p_sourceObjOcc.SymbolNum(),
        p_targetObjOcc.SymbolNum());
    if (javaArrayContains(allowedCxns, parseInt(cxnNum))) {
        // cxn from source -> target
        try {
            var oCxn = p_model.CreateCxnOcc(p_sourceObjOcc, p_targetObjOcc, cxnNum, pointArray);
        }
        // Do nothing because in next step will swap source and target and try again
        catch (e) {
            ;
        }        
    }
    if (oCxn == null || !oCxn.IsValid()) {
        allowedCxns = g_oMethodFilter.CxnTypes(p_model.TypeNum(), p_targetObjOcc.SymbolNum(),
            p_sourceObjOcc.SymbolNum());
        if (!javaArrayContains(allowedCxns, parseInt(cxnNum))) {
            outputError(p_sheetName, p_rowNum+1, "",
                formatstring1(getString("TEXT_28"),
                p_cxnName+" ("+g_oMethodFilter.getAPIName(Constants.CID_CXNDEF, cxnNum)+")"));
            return null;
        } else {
            // cxn from target -> source
            try {
                oCxn = p_model.CreateCxnOcc(p_targetObjOcc, p_sourceObjOcc, cxnNum, pointArray);
            }
            catch (e) {
                Dialogs.MsgBox(getString("TEXT_29")+e.Description);
            }
        }
    }    
    return oCxn;
}

// Returns a new created cxn
function createCxn(p_oSourceObjDef, p_oTargetObjDef, p_nTypeNum) {
    // cxn from source -> target
    var oCxn = p_oSourceObjDef.CreateCxnDef(p_oTargetObjDef, p_nTypeNum);
    if (oCxn == null || !oCxn.IsValid()) {
        // cxn from target -> source
        oCxn = p_oTargetObjDef.CreateCxnDef(p_oSourceObjDef, p_nTypeNum);
    }
    return oCxn;
}

// Adds attributes from 'Model_Att' sheet to created models
function importModelAtts(p_workbook, p_modelsObjs, p_mapAttr) {
    var sheetName = "Model_Att";
    var sheet = getSheetByName(p_workbook, sheetName);
    if (sheet == null) {
        // Error: "Model_Att" sheet is not found
        outputError("", "", "", sheetName + " " + getString("TEXT_19"));
        return;
    } else {
        var numOfTypeCol = getColumnNumber(sheet, "M_TYPE");
        var numOfNameCol = getColumnNumber(sheet, "NAME");
        if (numOfTypeCol == null || numOfNameCol == null) {
            // Error: at least one of required column headers is not found
            outputError(sheetName, "", "", getString("TEXT_23"));
        } else {
            // Read models line by line
            var rowNum = 1;
            while (getCellEntry(sheet.cell(rowNum, numOfNameCol)).length > 0) {
                var typeName = getCellEntry(sheet.cell(rowNum, numOfTypeCol));
                var modelName = getCellEntry(sheet.cell(rowNum, numOfNameCol));
                if (typeName == "") {
                    outputError(sheetName, rowNum+1, numOfTypeCol+1,
                        formatstring1(getString("TEXT_24"), modelName));
                } else {
                    var modelObj = p_modelsObjs.get(modelName+c_sSEPARATOR+typeName);
                    if (modelObj != null) {
                        writeAttributes(modelObj, sheet, sheetName, rowNum, numOfNameCol+1, p_mapAttr, Constants.CID_MODEL);
                    }
                }
                rowNum++;
            }
        }
    }
    ArisData.Save(Constants.SAVE_NOW);
    ArisData.getActiveDatabase().clearCaches();
}

// Imports objects from "Objects" sheet
function importObjects(p_workbook, p_mapObj, p_mapAttr, p_mapSym) {
    var sheetName = "Objects";
    var aSheets = getImportSheets(p_workbook, sheetName);           // Anubis 377894: Import all pages "Objects..." (again)
    if (aSheets.length == 0) {
        // Error: "Objects" sheet is not found
        outputError("", "", "", sheetName + " " + getString("TEXT_19"));
        return;
    }

    for (var i = 0; i < aSheets.length; i++ ) {
        var nSheet = aSheets[i];
        var sheet = p_workbook.getSheetAt(nSheet);
        sheetName = p_workbook.getSheetName(nSheet);
    
        var numberOfSymbolColumn = getColumnNumber(sheet, "SYMBOL");
        var numberOfTypeColumn = getColumnNumber(sheet, "O_TYPE");
        var numberOfNameColumn = getColumnNumber(sheet, "NAME");
        if ( (numberOfSymbolColumn == null && numberOfTypeColumn == null) || numberOfNameColumn == null) {
            // Error: at least one of required column headers is not found
            outputError(sheetName, "", "", getString("TEXT_8"));
        } else {
            // Read objects line by line
            var rowNumber = 1;
            while (getCellEntry(sheet.cell(rowNumber, numberOfNameColumn)).length > 0) {
                var symName = (numberOfSymbolColumn != null) ? getCellEntry(sheet.cell(rowNumber, numberOfSymbolColumn)) : "";
                var objectName = getCellEntry(sheet.cell(rowNumber, numberOfNameColumn));
                var objType;
                var symbol = null;
                // Get object type by symbol if it exists
                if (symName != "") {
                    symbol = p_mapSym.get(symName);
                    if (symbol == null) {
                        outputError(sheetName, rowNumber, numberOfSymbolColumn+1,
                            "'"+symName+"' "+getString("TEXT_20"));
                    } else {
                        // Get object type by its symbol
                        objType = ArisData.getActiveDatabase().ActiveFilter().SymbolObjType(symbol);
                    }
                } else {
                    // otherwise get object type directly
                    var typeName = (numberOfTypeColumn != null) ? getCellEntry(sheet.cell(rowNumber, numberOfTypeColumn)) : "";
                    if (typeName != "") {
                        objType = p_mapObj.get(typeName);
                        if (objType == null) {
                            outputError(sheetName, rowNumber, numberOfSymbolColumn+1,
                                formatstring1(getString("TEXT_7"), typeName));
                        }
                    } else {
                        outputError(sheetName, rowNumber+1, "", getString("TEXT_22"));
                    }
                }
                if (objType != null) {
                    try {
                        // Create object
                        var objectDef = g_oGroup.CreateObjDef(objType, objectName, g_nLoc);
                        if (symbol != null) {
                            objectDef.setDefaultSymbolNum(symbol, false);                       // Anubis 360570, Applix 199638 - set default symbol
                        }
                    }
                    catch (exc) {
                        var createException = exc;
                    }
                    if (objectDef == null || !objectDef.IsValid()) {
                        var error = formatstring1(getString("TEXT_6"), objectName);
                        if (createException != null) error += " "+createException;
                        outputError(sheetName, rowNumber+1, "", error);
                    } else {
                        // Mapping entry 
                        g_mapObjects.put(objectName, objectDef);
                        g_mapObjects.put(objectName + c_sSEPARATOR + objType, objectDef);
                        writeAttributes(objectDef, sheet, sheetName, rowNumber, numberOfNameColumn + 1,
                            p_mapAttr, Constants.CID_OBJDEF);
                    }
                }
                rowNumber++;
            }
        }        
    }
    ArisData.Save(Constants.SAVE_NOW);
    ArisData.getActiveDatabase().clearCaches();
}

// Collects cxn types of cxns
function collectCxnRowNumbers(p_workbook, p_mapCxn, p_mapObj) {
    // In this array report collects cxn types
    var cxnsRows = new Array();
    var sheetName = "Cxns";
    var bAddType = false;            
    var sheet = getSheetByName(p_workbook, sheetName);    
    var nColumnType = getColumnNumber(sheet, "C_TYPE");
    var nColumnSource = getColumnNumber(sheet, "SOURCE");
    var nColumnTarget = getColumnNumber(sheet, "TARGET");    
    var nColumnSOType = getColumnNumber(sheet, "SO_TYPE");
    var nColumnTOType = getColumnNumber(sheet, "TO_TYPE");    
    if (nColumnSOType != null && nColumnTOType != null) {
        bAddType = true;
    }    
    if (nColumnType != null && nColumnSource != null && nColumnTarget != null) {
        // read cxn entries
        var nRow = 1;
        while (getCellEntry(sheet.cell(nRow, nColumnSource)).length > 0) {
            var sCxnType = getCellEntry(sheet.cell(nRow, nColumnType));
            // If cxn type is empty then just ignore this record
            if (sCxnType != "") {
                var nTypeNum = mapTypeNum(p_mapCxn, sCxnType);            
                var sSourceName = getCellEntry(sheet.cell(nRow, nColumnSource));
                var sTargetName = getCellEntry(sheet.cell(nRow, nColumnTarget));            
                if (bAddType) {
                    // Anubis 341513
                    var sourceTypeName = getCellEntry(sheet.cell(nRow, nColumnSOType));                
                    var targetTypeName = getCellEntry(sheet.cell(nRow, nColumnTOType));                
                }
                if (nTypeNum != null) {
                    if (bAddType && (sourceTypeName != "" && targetTypeName != "")) {
                        // get object by name and type
                        var sourceType = p_mapObj.get(sourceTypeName);
                        if (sourceType == null)
                        {
                            var sError = formatstring1(getString("TEXT_12"), sourceTypeName);
                            outputError(sheetName, parseInt(nRow+1), nColumnSOType+1, sError);
                        }
                        var targetType = p_mapObj.get(targetTypeName);
                        if (targetType == null)
                        {
                            var sError = formatstring1(getString("TEXT_12"), targetTypeName);
                            outputError(sheetName, parseInt(nRow+1), nColumnTOType+1, sError);
                        }
                        var sSourceNameAndType = sSourceName+c_sSEPARATOR+parseInt(sourceType);
                        var sTargetNameAndType = sTargetName+c_sSEPARATOR+parseInt(targetType);
                        cxnsRows[sSourceNameAndType+c_sSEPARATOR+sTargetNameAndType] = sCxnType;
                    }
                    // Remember cxn without object type only when they are empty
                    if (!bAddType || (sourceTypeName == "" && targetTypeName == "")) {
                        cxnsRows[sSourceName+c_sSEPARATOR+sTargetName] = sCxnType;
                    }
                } else {
                    var sError = formatstring1(getString("TEXT_12"), sCxnType);
                    outputError(sheetName, parseInt(nRow+1), "", sError);
                }
            }
            nRow++;
        }
    } else {
        outputError(sheetName, "", "", getString("TEXT_13"));
    }
    return cxnsRows;
}

// Imports all cxns
function importCxns(p_workbook, p_mapCxn, p_mapAttr, p_mapObj) {
    var aSheets = getImportSheets(p_workbook, "Cxns");
    var bAddType = false;

    for (var i = 0; i < aSheets.length; i++ ) {
        var nSheet = aSheets[i];
        var sheet = p_workbook.getSheetAt(nSheet);
        var sSheetName = p_workbook.getSheetName(nSheet);
        
        var nColumnType = getColumnNumber(sheet, "C_TYPE");
        var nColumnSource = getColumnNumber(sheet, "SOURCE");
        var nColumnTarget = getColumnNumber(sheet, "TARGET");
        
        var nColumnSOType = getColumnNumber(sheet, "SO_TYPE");
        var nColumnTOType = getColumnNumber(sheet, "TO_TYPE");
        if (nColumnSOType != null && nColumnTOType != null) {
            bAddType = true;
        }
        
        if (nColumnType != null && nColumnSource != null && nColumnTarget != null) {
            // read cxn entries
            var nRow = 1;
            while (getCellEntry(sheet.cell(nRow, nColumnSource)).length > 0) {
                var sCxnType = getCellEntry(sheet.cell(nRow, nColumnType));
                var nTypeNum = mapTypeNum(p_mapCxn, sCxnType);
                
                var sSourceName = getCellEntry(sheet.cell(nRow, nColumnSource));
                var sTargetName = getCellEntry(sheet.cell(nRow, nColumnTarget));
                
                if (bAddType) {
                    // get object by name and type
                    var sourceType = p_mapObj.get(getCellEntry(sheet.cell(nRow, nColumnSOType)));
                    var targetType = p_mapObj.get(getCellEntry(sheet.cell(nRow, nColumnTOType)));
                    var sSourceNameAndType = sSourceName+c_sSEPARATOR+parseInt(sourceType);
                    var sTargetNameAndType = sTargetName+c_sSEPARATOR+parseInt(targetType);
                }
                
                // If cxn was already created, then use it. Otherwise create.
                if (bAddType) {
                    var oCxn = g_mapCxns.get(sSourceNameAndType+c_sSEPARATOR+sTargetNameAndType);;
                } else {
                    var oCxn = g_mapCxns.get(sSourceName+c_sSEPARATOR+sTargetName);
                }
                if (oCxn == null) {
                    var oSourceObjDef = getArisObject(sSourceName);
                    var oTargetObjDef = getArisObject(sTargetName);
                    if (bAddType) {
                        // get object by name and type                        
                        oSourceObjDef = getArisObject(sSourceNameAndType);
                        oTargetObjDef = getArisObject(sTargetNameAndType);
                    }
                    if (oSourceObjDef == null) {
                        var sError = formatstring1(getString("TEXT_10"), sSourceName);
                        outputError(sSheetName, parseInt(nRow+1), "", sError);
                    } else if (oTargetObjDef == null) {
                        var sError = formatstring1(getString("TEXT_11"), sTargetName);
                        outputError(sSheetName, parseInt(nRow+1), "", sError);
                    } else {                        
                        if (nTypeNum == null) {
                            // when only one cxn type is allowed
                            nTypeNum = getAllowedCxnType(oSourceObjDef, oTargetObjDef);
                        }
                        if (nTypeNum != null) {
                            var oCxn = createCxn(oSourceObjDef, oTargetObjDef, nTypeNum);
                            if (oCxn != null && oCxn.IsValid()) {
                                writeAttributes(oCxn, sheet , sSheetName, nRow, nColumnTarget + 1,
                                    p_mapAttr, Constants.CID_CXNDEF);
                            } else {
                                var sError = formatstring3(getString("TEXT_9"), sSourceName, sTargetName, sCxnType);
                                outputError(sSheetName, parseInt(nRow+1), "", sError);
                            }
                        } else {
                            var sError = formatstring1(getString("TEXT_12"), sCxnType);
                            outputError(sSheetName, parseInt(nRow+1), "", sError);
                        }
                    }
                } else {
                    writeAttributes(oCxn, sheet , sSheetName, nRow, nColumnTarget + 1, p_mapAttr, Constants.CID_CXNDEF);
                }
                nRow++;
            }
        } else {
            var sError = getString("TEXT_13");
            outputError(sSheetName, "", "", sError);
        }
    }
    ArisData.Save(Constants.SAVE_NOW);
    ArisData.getActiveDatabase().clearCaches();
}

// Returns cxn type num, when only one allowed
function getAllowedCxnType(p_oSourceObjDef, p_oTargetObjDef) {
    var nCxnTypeNum = null;
    var nAllowedCxnTypes = g_oMethodFilter.CxnTypesFromObj(p_oSourceObjDef.TypeNum(), p_oTargetObjDef.TypeNum());
    if (nAllowedCxnTypes.length == 0) {
        nAllowedCxnTypes = g_oMethodFilter.CxnTypesFromObj(p_oTargetObjDef.TypeNum(), p_oSourceObjDef.TypeNum());
    }
    if (nAllowedCxnTypes.length == 1) {
        // only one cxn type allowed from source to target            
        nCxnTypeNum = nAllowedCxnTypes[0];
    }
    return nCxnTypeNum;
}

// Returns cxn type num, when only one allowed
function getAllowedSymbolType(p_modelTypeNum) {
    var allowedSymbolTypes = g_oMethodFilter.Symbols(p_modelTypeNum);
    if (allowedSymbolTypes.length == 1) {
        return allowedSymbolTypes[0];
    } else {
        return null;
    }
}

// Returns indices of sheets with name 'p_sheetName'
function getImportSheets(p_workbook, p_sheetName) {
    var aSheets = new Array();

    var sheets = p_workbook.getSheets();
    for (var nSheet = 0; nSheet < sheets.length; nSheet++ ) {
        var sSheetName = "" + p_workbook.getSheetName(nSheet);
        sSheetName = sSheetName.substr(0, p_sheetName.length);
        
        if (sSheetName == p_sheetName) {
            aSheets.push(nSheet);
        }
    }
    return aSheets;    
}

// Returns sheet with name 'p_sheetName'
function getSheetByName(p_workbook, p_sheetName) {
    var sheets = p_workbook.getSheets();
    for (var nSheet = 0; nSheet < sheets.length; nSheet++ ) {        
        if (p_workbook.getSheetName(nSheet) == p_sheetName) {
            return p_workbook.getSheetAt(nSheet);
        }
    }
    return null;
}

// Writes attributes of item 'p_oItem'  in row 'p_nRow'
// Starts with column 'p_nFirstColumn' 
function writeAttributes(p_oItem, p_sheet, p_sSheetName, p_nRow, p_nFirstColumn, p_mapAttr, p_itemKind) {    
    var nColumn = p_nFirstColumn;
    // iterate over headline
    while (getCellEntry(p_sheet.cell(0, nColumn)).length > 0) {
        var sAttrType = getCellEntry(p_sheet.cell(0, nColumn));
        var nTypeNum = mapTypeNum(p_mapAttr, sAttrType);
        var sAttrValue = getCellEntry(p_sheet.cell(p_nRow, nColumn));
        if (nTypeNum != null && !isNaN(nTypeNum)) {
            if (sAttrValue != "") {
                if (!g_oMethodFilter.IsValidAttrType(p_itemKind, p_oItem.TypeNum(), nTypeNum)) {   // BLUE-5892
                    outputError(p_sSheetName, p_nRow+1, "",
                        formatstring1(getString("TEXT_32"),
                            g_oMethodFilter.getAPIName(Constants.CID_ATTRDEF, nTypeNum)));
                } else {                                
                    var oAttr = p_oItem.Attribute(nTypeNum, g_nLoc);
                    if (oAttr.IsValid()) {
                        // write current attribute                    
                        if (sAttrValue.length > 0) {                               
                            vAttrValue = getCorrectValue(nTypeNum, sAttrValue, p_sheet.cell(p_nRow, nColumn));    

                            var bOk = false;
                            if (g_oMethodFilter.AttrBaseType(nTypeNum) == Constants.ABT_LONGTEXT) {
                                // BLUE-15218 Special handling for simulation attributes
                                bOk = setSimulationAttr(oAttr, vAttrValue);
                            } else {
                                try {
                                    bOk = oAttr.setValue(vAttrValue);
                                } catch (exc) {
                                    var attrException = exc;    // BLUE-24338 - Handling of invalid attribute values
                                }                                 
                            }

                            if (bOk != true) {
                                var sError = formatstring2(getString("TEXT_14"), sAttrValue, sAttrType);
                                if (attrException != null) sError += "\nEXCEPTION: " + attrException.message;   // BLUE-24338
                                outputError(p_sSheetName, parseInt(p_nRow+1), parseInt(nColumn+1), sError);
                            }
                        }
                    } else {
                        var sError = formatstring1(getString("TEXT_15"), sAttrType);
                        outputError(p_sSheetName, parseInt(p_nRow+1), parseInt(nColumn+1), sError);
                    }
                }
            }
        } else {
            var sError = formatstring1(getString("TEXT_16"), sAttrType);
            outputError(p_sSheetName, parseInt(p_nRow+1), parseInt(nColumn+1), sError);
        }
        nColumn++;
    }
}

function getCorrectValue(p_nTypeNum, p_sAttrValue, p_cell) {
    var nBaseType = g_oMethodFilter.AttrBaseType(p_nTypeNum);
    var vAttrValue = p_sAttrValue;
    
    switch (nBaseType) {
        case Constants.ABT_BOOL:
        case Constants.ABT_INTEGER:
        case Constants.ABT_RANGEINTEGER:    // BLUE-11053 
            if (!(isNaN(p_sAttrValue))) {
                vAttrValue = parseInt(p_sAttrValue);
                
            }
            break;
        case Constants.ABT_DATE:
        case Constants.ABT_TIME:
        case Constants.ABT_TIMESTAMP:        
            // Anubis 315284
            if (p_cell.isCellADate()) {
                vAttrValue = p_cell.getDateCellValue();
            }
            break;
            
    }
    return vAttrValue
}

// Returns type num: value of map 'p_map' with key 'p_key'
function mapTypeNum(p_map, p_key) {
    return p_map.get(p_key);
}

// Returns object: value of global map 'g_mapObjects' with key 'p_sObjName'
function getArisObject(p_sObjName) {
    return g_mapObjects.get(p_sObjName);
}

// Returns TreeMap with keys/values of sheet 'p_sheetName'
function getMapping(p_workbook, p_sheetName) {
    var sheets = p_workbook.getSheets();
    for (var nSheet = 0; nSheet < sheets.length; nSheet++ ) {
        var sSheetName = "" + p_workbook.getSheetName(nSheet);
        if (sSheetName == p_sheetName) {
        
            var sheet = p_workbook.getSheetAt(nSheet);
            var typeMap = new java.util.TreeMap();
            
            var nRow = 0;
            while (getCellEntry(sheet.cell(nRow, 0)).length > 0) {
                var sKey = getCellEntry(sheet.cell(nRow, 0));
                var sValue = getCellEntry(sheet.cell(nRow, 1));
                var nValue = getTypeNum(sValue, p_sheetName);
                
                if (nValue != null && nValue > 0) {
                    typeMap.put(sKey, nValue);
                } else {
                    var sError = formatstring1(getString("TEXT_17"), sValue);
                    outputError(p_sheetName, parseInt(nRow+1), "", sError);
                }
                nRow++;
            }
            return typeMap;
        }
    }
    return null;
}

// Returns cell entry as 'string'
function getCellEntry(p_cell) {
    var cellEntry;
    if (p_cell.getCellType().getType() == 1/*Numeric*/) {
        cellEntry = p_cell.getNumericCellValue();   // BLUE-27629
    } else {
        cellEntry = p_cell.getCellValue();
    }
    
    if (cellEntry != null) {
        return ("" + cellEntry);
    }
    return "";
}

// Returns type num as integer or null
function getTypeNum(p_typeNum, p_sheetName) {
    var nTypeNum = p_typeNum;       // Anubis 327908
    
    if (isNaN(p_typeNum)) {
        if (isGuid(p_typeNum)) {
            // userdefined attribute/model/symbol type number
            try {
                if (p_sheetName == c_sMAP_ATTR) return g_oMethodFilter.UserDefinedAttributeTypeNum(p_typeNum);  
                if (p_sheetName == c_sMAP_MOD)  return g_oMethodFilter.UserDefinedModelTypeNum(p_typeNum);
                if (p_sheetName == c_sMAP_SYM)  return g_oMethodFilter.UserDefinedSymbolTypeNum(p_typeNum);
            } catch(e) {
                return null;
            }
            return null;
        }
        nTypeNum = Constants[p_typeNum];
        if (typeof(nTypeNum) == "undefined" || isNaN(nTypeNum)) {
            return null;
        }
    }
    return parseInt(nTypeNum);
}

// Checks, whether it's a GUID
function isGuid(p_sGuid) {
    var sGuid = new String(p_sGuid);
    if (sGuid.length != 36) return false;
    if (sGuid.charAt(8)  != '-') return false;
    if (sGuid.charAt(13) != '-') return false;
    if (sGuid.charAt(18) != '-') return false;
    if (sGuid.charAt(23) != '-') return false;    
    return true;
}

// Returns index of column with text 'p_columnName' in first row or null
function getColumnNumber(p_sheet, p_columnName) {
    var nColumn = 0;
    while (getCellEntry(p_sheet.cell(0, nColumn)).length > 0) {
        var sColumnName = getCellEntry(p_sheet.cell(0, nColumn));
        if (sColumnName == p_columnName) {
            return nColumn;
        }
        nColumn++;
    }
    return null;
}

// Writes error text to output object and sets variable 'g_bErrorExists'
function outputError(p_page, p_row, p_column, p_error) {
    g_oOutfile.TableRow();
    g_oOutfile.TableCellF(p_page, 20, "OUT_STD");
    g_oOutfile.TableCellF(p_row + " / " + p_column, 20, "OUT_STD2");
    g_oOutfile.TableCellF(p_error, 60, "OUT_STD");            

    g_bErrorExists = true;
}

// Returns file object / Browse-dialog
function getPathAndFile() {
    // Init
    var sdefname = "";
    var sdefext = "*.xls!!Excel 97-2003 Workbook|*.xls|Excel Workbook|*.xlsx||";
    var sdefdir = Context.getProfileString("Report", "Output Directory", "");
    var stitle = getString("TEXT_18");
    
    var files = Dialogs.getFilePath(sdefname, sdefext, sdefdir, stitle, 0);
    if (files != null && files.length > 0) {
        return files[0];
    }
    return null;
}

//Options dialog
function showOptionsDialog() {
    var dialogResult = Dialogs.MsgBox(getString("TEXT_35"), 
        Constants.MSGBOX_BTN_YESNOCANCEL, null);
    options.createAssignments = (dialogResult == Constants.MSGBOX_RESULT_YES); 
    return dialogResult;
}

// BLUE-15218 Special handling for simulation attributes
function setSimulationAttr(oAttr, vValue) {
    var sValue = new java.lang.String(vValue);
    var start = sValue.indexOf("("); 
    var end = sValue.indexOf(")"); 
    
    if (start >= 0 && end >= 0) {
        end++;    
        
        var textVal = sValue.substring(start, end);
        var longVal = getLongValue(sValue.substring(end).trim(), oAttr.TypeNum());
        
        return oAttr.setValue(textVal, longVal);    
    }
    return false;

    function getLongValue(sLong, atn) {        
        var aAttrValueTypes = g_oMethodFilter.AttrValueTypeNums(atn);
        for (var i in aAttrValueTypes) {
            var avtn = aAttrValueTypes[i];
            var sAttrValueType = ArisData.ActiveFilter().AttrValueType(atn, avtn);
            if (StrComp(sAttrValueType, sLong) == 0) {
                
                return avtn;
            }
        }
        return -1;
    }
}
