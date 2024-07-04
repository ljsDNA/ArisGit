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
**  Report script to get information about customer segmentation map, customer segments and customer journeys
**  @author C. Hopf
**/
//------variables------
    //------constants------
    const outputParameters = new OutputParameters("");
    const xOutput = createXmlOutput(outputParameters);//new XMLOutputObject(Context.getSelectedFile(),false);
    //------global------
    var nLocale = Context.getSelectedLanguage();
//------script------
main();
//------functions------
function main() {
    outHeader();
    readModels();
    uploadXmlOutputToADS(xOutput, outputParameters);
    //xOutput.writeReport();  
}

/**
**  Function to read models from the database
**  @return void
**/
function readModels() {
    var aDatabases = [ArisData.getActiveDatabase()];
    for(var x in aDatabases) {
        var curDatabase = aDatabases[x];
        var allModels = curDatabase.Find(Constants.SEARCH_MODEL, Constants.MT_CUSTOMER_SEGMENTATION_MAP);
        if(allModels.length > 0) {
            for(var i in allModels) {
                var curModel = allModels[i];
                checkMapType(curModel);
            }
        } else {
            Dialogs.MsgBox(getString("ERROR_NO_MAPS"));
        }
    }
}

/**
**  Function to inspect the handed model and his occurences, objects and edges
**  @param model = the model that must be checked
**  @return void
**/
function inspectModel(model) {
    var allOccs = model.ObjOccList();
    for(var i in allOccs) {
        var curOcc = allOccs[i];
        var curObj = curOcc.ObjDef();
        if(curObj.TypeNum() == Constants.OT_CUSTOMER_SEGMENT) {
            getXmlData(model,"",curOcc);
        }
    }
}

function checkMapType(model) {
    var set = false;
    
    var lanes = model.GetLanes(Constants.LANE_VERTICAL);
    for(var h in lanes) {
        var curLane = lanes[h];
        if(curLane.TypeNum() == Constants.LT_SUPERIOR_CUSTOMER_SEGMENT) {
            set = true;
            var hlanes = model.GetLanes(Constants.LANE_HORIZONTAL);
            for(var i in hlanes) {
                var curHlane = hlanes[i];
                if(curHlane.TypeNum() == Constants.LT_CUSTOMER_SEGMENT) {
                    var superSegs = lanes[0].ObjOccs(curHlane);
                    var superSeg = superSegs[0];
                    var aOccs = curHlane.ObjOccs();
                    for(var j in aOccs) {
                        var curOcc = aOccs[j];
                        if(curOcc.ObjDef().Name(nLocale) != superSeg.ObjDef().Name(nLocale)) {
                            getXmlData(model,superSeg,curOcc);
                        }
                    }
                }
            }
        }
    }
    if(!set) {
        inspectModel(model);
    }
}

function getXmlData(model,superSeg,curPersona) {
    //Getting the modeldata and the customer segment data
    var modelName = model.Name(nLocale);
    var modelGuid = model.GUID();
    var superName = "";
    var superGuid = "";
    if(superSeg != "") {
        superName = superSeg.ObjDef().Name(nLocale);
        superGuid = superSeg.ObjDef().GUID();
    }
    var segName = curPersona.ObjDef().Name(nLocale);
    var segGuid = curPersona.ObjDef().GUID();
    
    var segOcc = curPersona
    
    if(curPersona.ObjDef().TypeNum() != 477) {
        segOcc = superSeg;
    }
    
    //Getting attribute relevance and loyalty
    var relevance = getAttrValue(segOcc.ObjDef(),Constants.AT_RELEVANCE);
    var loyalty = getAttrValue(segOcc.ObjDef(),Constants.AT_LOYALTY);
    
    segOcc = curPersona;
    
    //Getting connected objects and save them into array lists
    var prodOccArray = getConnectedOccs(curPersona,Constants.OT_PERF,Constants.CT_DEMANDED_BY);
    var revOccArray = getConnectedOccs(curPersona,Constants.OT_REVENUE,Constants.CT_IS_RELATED_TO_1);
    var riskOccArray = getConnectedOccs(curPersona,Constants.OT_RISK,Constants.CT_IS_ASSOCIATED_WITH);
    var initOccArray = getConnectedOccs(curPersona,Constants.OT_FUNC_INST,Constants.CT_SUPPORTS_1);
    var jrnOccArray = getConnectedOccs(curPersona,Constants.OT_CUSTOMER_JOURNEY,Constants.CT_EXPERIENCES);
    
    //Check if there exists objects in the arrays
    var prodSkip = checkArray(prodOccArray);
    var revSkip = checkArray(revOccArray);
    var riskSkip = checkArray(riskOccArray);
    var initSkip = checkArray(initOccArray);
    var jrnSkip = checkArray(jrnOccArray);
    
    getAndWriteData();
    
    //-----INNER FUNCTIONS-----
    function getAndWriteData() {
        if(prodSkip) {
            getRevData("");
        } else {
            for(var i in prodOccArray) {
                var curProdOcc = prodOccArray[i];
                getRevData(curProdOcc.ObjDef().Name(nLocale),curProdOcc.ObjDef().GUID());
            }
        }
    }
    
    function getRevData(prodName,prodGuid) {
        if(revSkip) {
            getRiskData(prodName,prodGuid,"","","");
        } else {
            for(var i in revOccArray) {
                var curRevOcc = revOccArray[i];
                getRiskData(prodName,prodGuid,curRevOcc.ObjDef().Name(nLocale),curRevOcc.ObjDef().GUID(),getAttrValue(curRevOcc.ObjDef(),Constants.AT_TOTAL_REVENUE));
            }
        }
    }
    
    function getRiskData(prodName,prodGuid,revName,revGuid,totalRevenue) {
        if(riskSkip) {
            getInitData(prodName,prodGuid,revName,revGuid,totalRevenue,"","","","");
        } else {
            for(var i in riskOccArray) {
                var curRiskOcc = riskOccArray[i];
                getInitData(prodName,prodGuid,revName,revGuid,totalRevenue,curRiskOcc.ObjDef().Name(nLocale),curRiskOcc.ObjDef().GUID(),getAttrValue(curRiskOcc.ObjDef(),Constants.AT_AAM_IMPACT),getAttrValue(curRiskOcc.ObjDef(),Constants.AT_AAM_PROBABILITY));
            }
        }
    }
    
    function getInitData(prodName,prodGuid,revName,revGuid,totalRevenue,riskName,riskGuid,impact,proba) {
        if(initSkip) {
            getJrnData(prodName,prodGuid,revName,revGuid,totalRevenue,riskName,riskGuid,impact,proba,"","");
        } else {
            for(var i in initOccArray) {
                var curInitOcc = initOccArray[i];
                getJrnData(prodName,prodGuid,revName,revGuid,totalRevenue,riskName,riskGuid,impact,proba,curInitOcc.ObjDef().Name(nLocale),curInitOcc.ObjDef().GUID());
            }
        }
    }
    
    function getJrnData(prodName,prodGuid,revName,revGuid,totalRevenue,riskName,riskGuid,impact,proba,initName,initGuid) {
        if(jrnSkip) {
            buildRow(modelName,modelGuid,superName,superGuid,segName,segGuid,relevance,loyalty,prodName,prodGuid,revName,revGuid,totalRevenue,riskName,riskGuid,impact,proba,initName,initGuid,"","","","","","","","","","","","","","","");
        } else {
            for(var i in jrnOccArray) {
                var curJrnOcc = jrnOccArray[i];
                buildWithAssignment(model,superName,superGuid,segOcc,prodName,prodGuid,revName,revGuid,totalRevenue,riskName,riskGuid,impact,proba,initName,initGuid,curJrnOcc,relevance,loyalty);
            }
        }
    }
}

//<<<<<INNER FUNCTIONS>>>>>

function buildWithAssignment(model,superName,superGuid,segOcc,prodName,prodGuid,revName,revGuid,totalRevenue,riskName,riskGuid,impact,proba,initName,initGuid,jrnOcc,relevance,loyalty) {
    var jrnAssg = hasAssignment(jrnOcc.ObjDef(),Constants.MT_CUSTOMER_JOURNEY_MAP);
    if(jrnAssg == false) {
        buildRow(model.Name(nLocale),model.GUID(),superName,superGuid,segOcc.ObjDef().Name(nLocale),segOcc.ObjDef().GUID(),relevance,loyalty,prodName,prodGuid,revName,revGuid,totalRevenue,riskName,riskGuid,impact,proba,initName,initGuid,jrnOcc.ObjDef().Name(nLocale),jrnOcc.ObjDef().GUID(),getAttrValue(jrnOcc.ObjDef(),Constants.AT_OVERALL_CUSTOMER_EXPERIENCE),"","","","","","","","","","","","");
    } else {
        var allAssignments = jrnOcc.ObjDef().AssignedModels();
        for(var i in allAssignments) {
            var curAssignment = allAssignments[i];
            if(curAssignment.TypeNum() == Constants.MT_CUSTOMER_JOURNEY_MAP) {
                buildJourneyMapXml(model,superName,superGuid,segOcc,prodName,prodGuid,revName,revGuid,totalRevenue,riskName,riskGuid,impact,proba,initName,initGuid,jrnOcc.ObjDef().Name(nLocale),jrnOcc.ObjDef().GUID(),getAttrValue(jrnOcc.ObjDef(),Constants.AT_OVERALL_CUSTOMER_EXPERIENCE),curAssignment,relevance,loyalty);
            }
        }
    }
}

function buildJourneyMapXml(model,superName,superGuid,segOcc,prodName,prodGuid,revName,revGuid,totalRevenue,riskName,riskGuid,impact,proba,initName,initGuid,jrnName,jrnGuid,cusExp,asgModel,relevance,loyalty) {
    var allSteps = asgModel.ObjOccListFilter(Constants.OT_CUSTOMER_JOURNEY_STEP);
    if(allSteps.length != 0) {
        for(var i in allSteps) {
            var curStep = allSteps[i];
            getTpData(curStep);
        }
    } else {
        buildRow(model.Name(nLocale),model.GUID(),superName,superGuid,segOcc.ObjDef().Name(nLocale),segOcc.ObjDef().GUID(),relevance,loyalty,prodName,prodGuid,revName,revGuid,totalRevenue,riskName,riskGuid,impact,proba,initName,initGuid,jrnName,jrnGuid,cusExp,asgModel.Name(nLocale),asgModel.GUID(),"","","","","","","","","","","","");
    }
    
    function getTpData(stepOcc) {
        var touchpoints = getTouchpointOccs(stepOcc);
        if(touchpoints.length == 0) {
            buildRow(model.Name(nLocale),model.GUID(),superName,superGuid,segOcc.ObjDef().Name(nLocale),segOcc.ObjDef().GUID(),relevance,loyalty,prodName,prodGuid,revName,revGuid,totalRevenue,riskName,riskGuid,impact,proba,initName,initGuid,jrnName,jrnGuid,cusExp,asgModel.Name(nLocale),asgModel.GUID(),stepOcc.ObjDef().Name(nLocale),stepOcc.ObjDef().GUID(),"","","","","","","","");
        } else {
            for(var x in touchpoints) {
                var curTp = touchpoints[x];
                getChannelData(stepOcc,curTp);
            }
        }
    }
    
    function getChannelData(stepOcc,tpOcc) {
        var chanOccs = getChannelOccs(tpOcc);
        if(chanOccs.length == 0) {
            getUnitData(stepOcc,tpOcc,"","");
        } else {
            for(var y in chanOccs) {
                var curChanOcc = chanOccs[y];
                getUnitData(stepOcc,tpOcc,curChanOcc.ObjDef().Name(nLocale),getAttrValue(curChanOcc.ObjDef(),Constants.AT_MEDIA_TYPE_1));
            }
        }
    }
    
    function getUnitData(stepOcc,tpOcc,chanName,mediatype) {
        var unitOccs = getUnitOccs(tpOcc);
        if(unitOccs.length == 0) {
            getFuncData(stepOcc,tpOcc,chanName,mediatype,"");
        } else {
            for(var i in unitOccs) {
                var curUnitOcc = unitOccs[i];
                getFuncData(stepOcc,tpOcc,chanName,mediatype,curUnitOcc.ObjDef().Name(nLocale));
            }
        }
    }
    
    function getFuncData(stepOcc,tpOcc,chanName,mediatype,unitName) {
        var funcOccs = getFunctionOccs(tpOcc);
        if(funcOccs.length == 0) {
            buildRow(model.Name(nLocale),model.GUID(),superName,superGuid,segOcc.ObjDef().Name(nLocale),segOcc.ObjDef().GUID(),relevance,loyalty,prodName,prodGuid,revName,revGuid,totalRevenue,riskName,riskGuid,impact,proba,initName,initGuid,jrnName,jrnGuid,cusExp,asgModel.Name(nLocale),asgModel.GUID(),stepOcc.ObjDef().Name(nLocale),stepOcc.ObjDef().GUID(),tpOcc.ObjDef().Name(nLocale),getAttrValue(tpOcc.ObjDef(),Constants.AT_CUSTOMER_FEELING),getAttrValue(tpOcc.ObjDef(),Constants.AT_PAIN_POINT),getAttrValue(tpOcc.ObjDef(),Constants.AT_MOMENT_OF_TRUTH),chanName,mediatype,unitName,"");
        } else {
            for(var i in funcOccs) {
                var curFunc = funcOccs[i];
                buildRow(model.Name(nLocale),model.GUID(),superName,superGuid,segOcc.ObjDef().Name(nLocale),segOcc.ObjDef().GUID(),relevance,loyalty,prodName,prodGuid,revName,revGuid,totalRevenue,riskName,riskGuid,impact,proba,initName,initGuid,jrnName,jrnGuid,cusExp,asgModel.Name(nLocale),asgModel.GUID(),stepOcc.ObjDef().Name(nLocale),stepOcc.ObjDef().GUID(),tpOcc.ObjDef().Name(nLocale),getAttrValue(tpOcc.ObjDef(),Constants.AT_CUSTOMER_FEELING),getAttrValue(tpOcc.ObjDef(),Constants.AT_PAIN_POINT),getAttrValue(tpOcc.ObjDef(),Constants.AT_MOMENT_OF_TRUTH),chanName,mediatype,unitName,curFunc.ObjDef().Name(nLocale));
            }
        }
    }
    
}

/**
** Function to write a row into the xml file
** @return void
**/
function buildRow(rootName,rootGuid,segName,segGuid,persona,personaGuid,relevance,loyalty,product,productGuid,revenue,revenueGuid,totalRevenue,risk,riskGuid,impact,proba,initV,initGuid,jrnName,jrnGuid,experience,modelName,modelGuid,stepName,stepGuid,tpName,feeling,pp,mot,chanName,mediatype,unitName,funcName) {
    xOutput.addRow([
        rootName,
        rootGuid,
        segName,
        segGuid,
        persona,
        personaGuid,
        relevance,
        loyalty,
        product,
        productGuid,
        revenue,
        revenueGuid,
        totalRevenue,
        risk,
        riskGuid,
        impact,
        proba,
        initV,
        initGuid,
        jrnName,
        jrnGuid,
        experience,
        modelName,
        modelGuid,
        stepName,
        stepGuid,
        tpName,
        feeling,
        pp,
        mot,
        chanName,
        mediatype,
        unitName,
        funcName
        ]);
}

/**
**  Function to set the columns of the xml file
**  @return void
**/
function outHeader() {
    xOutput.setColumns([
                       ["Customer segmentation map","text"],
                       ["Customer segmentation map (GUID)", "text"],
                       ["Superior customer segment", "text"],
                       ["Superior customer segment (GUID)", "text"],
                       ["Customer segment/Persona", "text"],
                       ["Customer segment/Persona (GUID)", "text"],
                       ["Relevance", "text"],
                       ["Loyalty", "text"],
                       ["Product/Service", "text"],
                       ["Product/Service (GUID)", "text"],
                       ["Revenue", "text"],
                       ["Revenue (GUID)", "text"],
                       ["Total revenue","text"],
                       ["Risk", "text"],
                       ["Risk (GUID)", "text"],
                       ["Impact", "text"],
                       ["Probability", "text"],
                       ["Initiative", "text"],
                       ["Initiative (GUID)", "text"],
                       ["Customer journey", "text"],
                       ["Customer journey (GUID)", "text"],
                       ["Overall customer experience", "text"],
                       ["Customer journey map", "text"],
                       ["Customer journey map (GUID)", "text"],
                       ["Customer journey step", "text"],
                       ["Customer journey step (GUID)", "text"],
                       ["Customer touchpoint", "text"],
                       ["Customer feeling", "text"],
                       ["Pain point", "number"],
                       ["Moment of truth", "number"],
                       ["Distribution channel", "text"],
                       ["Media type", "text"],
                       ["Organizational unit", "text"],
                       ["Function", "text"]
                       ]);
}

/**
**  Function to get the connected occurences of the handed occurence
**  @return occs = Array of all found occs
**/
function getConnectedOccs(srcOcc,searchedType,connectionType) {
    var occs = new Array();
    
    var allCxnOccs = srcOcc.CxnOccList();
    for(var i in allCxnOccs) {
        var curCxnOcc = allCxnOccs[i];
        var curCxnDef = curCxnOcc.getDefinition();
        var curTarOcc = curCxnOcc.getTarget();
        var curSrcOcc = curCxnOcc.getSource();
        if(curCxnDef.TypeNum() == connectionType && (curTarOcc.ObjDef().TypeNum() == searchedType || curSrcOcc.ObjDef().TypeNum() == searchedType)) {
            if(curTarOcc.ObjDef().TypeNum() == searchedType) {
                occs.push(curTarOcc);
            } else {
                occs.push(curSrcOcc);
            }
        }
    }
    return occs;
}

/**
**	Function to check if the handed object has an assignment of the handed modeltype
**	@param obj = object that must be checked
**	@param modeltype = typenumber of the searched model
**	@return boolean = true: object has assignment with the searched modeltype | false: object has no assignment with the searched modeltype
**/
function hasAssignment(obj,modeltype) {
	var allAssignments = obj.AssignedModels();
	for(var i in allAssignments) {
		var currentAssignment = allAssignments[i];
		if(currentAssignment.TypeNum() == modeltype) {
			return true;
		}
	}
	return false;
}

/**
** Function to get all touchpoint occurences of a customer journey step
** @return touchpoints = Array of touchpoint occs
**/
function getTouchpointOccs(step) {
    var touchpoints = new Array();
    
    var allCxnOccs = step.CxnOccList();
    for(var i in allCxnOccs) {
        var curCxnOcc = allCxnOccs[i];
        var curCxnDef = curCxnOcc.getDefinition();
        var curSrcOcc = curCxnOcc.getSource();
        if(curCxnDef.TypeNum() == Constants.CT_IS_RELATED_TO && curSrcOcc.ObjDef().TypeNum() == Constants.OT_CUSTOMER_TOUCHPOINT) {
            touchpoints.push(curSrcOcc);
        }
    }
    return touchpoints;
}

/**
** Function to get all channel occurences of a customer touchpoint
** @return channels = Array of channel occs
**/
function getChannelOccs(touchpoint) {
    var channels = new Array();
    
    var allCxnOccs = touchpoint.CxnOccList();
    for(var i in allCxnOccs) {
        var curCxnOcc = allCxnOccs[i];
        var curCxnDef = curCxnOcc.getDefinition();
        var curSrcOcc = curCxnOcc.getSource();
        if(curCxnDef.TypeNum() == Constants.CT_SPECIFIES && curSrcOcc.ObjDef().TypeNum() == Constants.OT_SALES_CHAN) {
            channels.push(curSrcOcc);
        }
    }
    return channels;
}

/**
** Function to check if the given array is empty
**/
function checkArray(array) {
    if(array.length == 0) {
        return true;
    } else {
        return false;
    }
}

/**
** Function to get all ownership occurences of a customer touchpoint
** @return units = Array of ownership occs
**/
function getUnitOccs(touchpoint) {
    var units = new Array();
    
    var allCxnOccs = touchpoint.CxnOccList();
    for(var i in allCxnOccs) {
        var curCxnOcc = allCxnOccs[i];
        var curCxnDef = curCxnOcc.getDefinition();
        var curSrcOcc = curCxnOcc.getSource();
        if(curCxnDef.TypeNum() == Constants.CT_OWNS_3 && (curSrcOcc.ObjDef().TypeNum() == Constants.OT_ORG_UNIT || curSrcOcc.ObjDef().TypeNum() == Constants.OT_ORG_UNIT_TYPE)) {
            units.push(curSrcOcc);
        }
    }
    return units;
}

/**
** Function to get all function occurences of a customer touchpoint
** @return functions = Array of function occs
**/
function getFunctionOccs(touchpoint) {
    var functions = new Array();
    
    var allCxnOccs = touchpoint.CxnOccList();
    for(var i in allCxnOccs) {
        var curCxnOcc = allCxnOccs[i];
        var curCxnDef = curCxnOcc.getDefinition();
        var curTarOcc = curCxnOcc.getTarget();
        if(curCxnDef.TypeNum() == Constants.CT_IS_RELATED_TO_1 && curTarOcc.ObjDef().TypeNum() == Constants.OT_FUNC) {
            functions.push(curTarOcc);
        }
    }
    return functions;
}

/**
**  Function to get the value of the searched attribute
**  @param obj = handed object
**  @param attrType = TypeNum of the searched attribute
**  @return "" if the searched attribute don't exists, value if the attribute exists
**/
function getAttrValue(obj, attrType) {
    var curAttr = obj.Attribute(attrType, nLocale);
    if (!curAttr.IsMaintained()) return "";
    
    return curAttr.getValue();
}