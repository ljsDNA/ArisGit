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
 * Default layouter for models which were changed during the import.
 *
 * @author JURM
 */
function DefaultLayouter() {
    
    this.doLayout = function(modelsToLayout) {

        var modelIt = modelsToLayout.iterator();
        while (modelIt.hasNext()) {
            var model = modelIt.next();
            
            // bugfix anubis id: 326204
            try {
               // get the layout parameters for the model type
               var modelOptions = ArisData.getModelOptions();
               var layoutParameters = modelOptions.getLayoutParameters(model.TypeNum());
               if(layoutParameters != undefined && layoutParameters != null) {
                    //set layout strategy to hierarchy layout
                    layoutParameters.setStrategy(2);
               }
            } catch(e) {
                // ignore
            }
            // bugfix anubis id: 326204
            
            // apply the template of the model to all newly added items
            var template = model.getTemplate();
            model.setTemplate(template);
            // start the layouting algorithm
            model.doLayout();   
        }
    }
  
}

