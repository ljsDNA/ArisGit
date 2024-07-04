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
 * Import controller
 * 
 * This script processes all existing import configuration pairs.
 * Configuration is read from Configuration.js.
 *
 * @author MIPO 
 */
 
main();

function main() {
    for (var i = 0; i < configuration.length; i++) {
        var db = null;
        try {
            db = ArisData.openDatabase(configuration[i]["database"]);
        }
        catch(e)
        {            
            Dialogs.MsgBox(getString("CANNOT_OPEN_DB_MESSAGE") + " " + configuration[i]["database"]+"\n"+e.toString(), Constants.MSGBOX_ICON_ERROR, getString("CANNOT_OPEN_DB_TITLE"));
            continue;
        }

        if (db != null) {
            try
            {
                process( 
                    db,
                    configuration[i]["url"],
                    configuration[i]["export"],
                    configuration[i]["secret"],
                    configuration[i]["history"],
                    configuration[i]["layouter"],
                    configuration[i]["itemFinder"],
                    configuration[i]["postImportProcessor"]
                );
            }
            catch(ex)
            {
                db.close()
                var line = ex.lineNumber
                var message = ex.message
                var filename = ex.fileName
                var exJava = ex.javaException
                if(exJava!=null)
                {
                    message = message + "\n java exception " + exJava
                    /*
                    var aStackTrace = exJava.getStackTrace()
                    for(var iST=0; iST<aStackTrace.length; iST++)
                    {
                        message = message + "\n" + aStackTrace[iST].toString()
                    }
                    */
                }
                Dialogs.MsgBox(configuration[i]["database"]+":\n"+message, Constants.MSGBOX_ICON_ERROR, getString("CANNOT_OPEN_DB_TITLE"));
            }                            
            db.close();
        } else {
            Dialogs.MsgBox(getString("CANNOT_OPEN_DB_MESSAGE") + " " + configuration[i]["database"], Constants.MSGBOX_ICON_ERROR, getString("CANNOT_OPEN_DB_TITLE"));
        }
    }
}

function process(db, url, exportName, secret, historyAttribute, layouterName, itemFinderName, postImportProcessorName) {
    // create new import provider using the configured attribute for writing the 
    var provider = new ImportProvider(db, url, exportName, secret);
    provider.setHistoryAttribute(historyAttribute);

    // obtain the item finder 
    var itemFinder;
    if(!itemFinderName) { // in case no item finder is defined
        itemFinder = new DefaultItemFinder();
    } else {
        itemFinder = eval("new " + itemFinderName + "()");
    }
    provider.setItemFinder(itemFinder);
    
    var modelsToLayout = new Packages.java.util.HashSet();

    delayedGUIDSet = new Packages.java.util.HashSet();

    // loop over all handlers for which operations were retrieved    
    var handlerIt = provider.getHandlerSet().iterator();
    while (handlerIt.hasNext()) {
        
        // obtain handler name and set handler to active so its operations can be accessed
        var handlerName = "" + handlerIt.next();
        provider.setActiveHandler(handlerName);
        var handler;
        
        var handlerObjectName = handlerMappings[0][handlerName];
        if(!handlerObjectName) {
            handler = new DefaultOperationHandler();
        }
        else {
            handler = eval("new " + handlerObjectName + "()");
        }

        // apply post import function when set and supported
        if (
            postImportProcessorName != null && postImportProcessorName != ""
            && handler.registerPostImportFunction
        ) {
            var postImportProcessor = eval ("new " + postImportProcessorName + "()");
            handler.registerPostImportFunction(postImportProcessor.process);
        }   
        
        // run operations through handler
        handler.handle(db, provider);
        
        //get all models to layout
        var iterator = handler.getModelsToLayout().iterator();
        while (iterator.hasNext()) {
            var model = iterator.next();
            modelsToLayout.add(model);
        }
       
    }
    
    var layouter = null;
    if(!layouterName) {
        layouter = new DefaultLayouter();
    }else {
        layouter = eval("new " + layouterName + "()");  
    }
    
    // layout all models which were touched during the import
    layouter.doLayout(modelsToLayout);       
}
