

//var oModel = ArisData.getSelectedModels()[0];
var oRiskCategoryObjOcc = ArisData.getSelectedObjOccs()[0];
var oModel = oRiskCategoryObjOcc.Model();

applyCustomLayout(oModel, oRiskCategoryObjOcc);

function applyCustomLayout(oModel, oRiskCategoryObjOcc){
    
    var x=600;
    var y=300;
    var ystep = 200;
    var nCounter = 0;
    
    //Constants.OT_RISK_CATEGORY
    
    
    var aoObjOccs = oModel.ObjOccListBySymbol([Constants.ST_RISK_1]);
    
    aoObjOccs = ArisData.sort( aoObjOccs, Constants.AT_NAME, Context.getSelectedLanguage() );
    
    for each(var oObjOcc in aoObjOccs){
        if(oObjOcc!=null){
            oObjOcc.SetPosition(x,y+(nCounter*ystep));
            
            
            
            
            
            
            nCounter++;
        }
        
    }
    
    
    
    // Points
    
    var aoCxnObjOccs = oRiskCategoryObjOcc.Cxns(Constants.EDGES_OUT);
    for each(var oCxnObjOcc in aoCxnObjOccs){
        if(oCxnObjOcc!=null){
            var oRiskObjOcc = oCxnObjOcc.TargetObjOcc();
            
            var oCxnPoints = [];
            oCxnPoints.push(new java.awt.Point(oRiskCategoryObjOcc.X()+(oRiskCategoryObjOcc.Width()/2), oRiskCategoryObjOcc.Y() + (oRiskCategoryObjOcc.Height()) ));
            oCxnPoints.push(new java.awt.Point(oRiskCategoryObjOcc.X()+(oRiskCategoryObjOcc.Width()/2), oRiskObjOcc.Y() + (oRiskObjOcc.Height()/2) ));
            oCxnPoints.push(new java.awt.Point(oRiskObjOcc.X(), oRiskObjOcc.Y() + (oRiskObjOcc.Height()/2) ));
            oCxnObjOcc.SetPointList(oCxnPoints);
            
        }
    }
    

    
    
}