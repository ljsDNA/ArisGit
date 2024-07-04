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

var name = Context.getProperty("processName");
var guid = Context.getProperty("parentId");
var xpdl = Context.getProperty("process.xmlProcess");
var metadata  = Context.getProperty("process.metadata");
var group = ArisData.getActiveDatabase().FindGUID(guid);

var out = new XMLFormattedOut();
if(group == null)
    out.setSuccess(false, "Error: parent group not found.");
else{
    var comp = Context.getComponent("webMethodsIntegration");
    if(comp == null)
        out.setSuccess(false, "Error: webMethods integration component not found.");
    else{
        try{
            var guid = comp.createProcess(group, name,xpdl, metadata);
            out.addElement("id", guid);
	        out.setSuccess(true);
        }catch(error){
            out.setSuccess(false, error.toString());
        }
    }
}
out.write();
