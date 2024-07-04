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
 * Sort input array or aris data selected objects according to passed "selectedOrder" property value
 */
function makeAPGorder(inputSelectedItems){
    var g_database = ArisData.getActiveDatabase();
	var sSelectedOrder = Context.getProperty("selectedOrder");
	var sOrder = new Array();
	if (sSelectedOrder != null && (!(sSelectedOrder instanceof java.lang.String) || sSelectedOrder.length() > 0)) {
		sOrder = sSelectedOrder.split(";");
	}
	if (sOrder.length == 0 ) {
		return inputSelectedItems;
	}

	for(var i in sOrder){
        if(sOrder[i].length == 38) {
            // type prefix + GUID, cut off prefix
		    sOrder[i] = sOrder[i].substring(2) + "";
        } else {
            sOrder[i] = sOrder[i] + "";
        }
	}

	var count = 0;
	var outputSelectedItems = new Array();
	for (var i in inputSelectedItems){
		count = sOrder.indexOf(inputSelectedItems[i].GUID()+"");
		outputSelectedItems[count] = g_database.FindGUID(sOrder[count]);
	}
	return outputSelectedItems;
}

function dateToString(p_date) {
	return Context.getComponent("Process").dateToString(p_date);
}

function stringToDate(p_string) {
	return Context.getComponent("Process").stringToDate(p_string);
}

function stringToUTCDate(p_string){
    d = Context.getComponent("Process").stringToDate(p_string);
    if(p_string && p_string.endsWith("Z")){
        // this is already UTC zulu format, just keep it
    } else {
        d.setTime( d.getTime() - d.getTimezoneOffset()*60*1000 );
    }
    return d;
}

function maskXMLCharacters(p_string) {
	return Context.getComponent("Process").maskReservedXMLCharacters(p_string);
}
