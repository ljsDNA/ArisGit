/*
 *
 *  Report Name: NTT-RM-01 Init dialog values (Plausibility Check)
 *  Version: 1.0
 *  Date: 2022-10-06
 *  Author: BPExperts GmbH [MaHi]
 *
 *
 *  Description:
 *  --- v1.0 ---
 *  # The report collects available attribute values from ARIS method
 *  # Pass on the lists to APG via context property
 *  # 
 *
 *
*/


var g_oDatabase = ArisData.getActiveDatabase();
var g_oFilter = g_oDatabase.ActiveFilter();
var g_nLoc = Context.getSelectedLanguage();


/////////////////////////////////////////////////////////////////
/// BELOW THIS LINE, ONLY CHANGE CAREFULLY //////////////////////
/////////////////////////////////////////////////////////////////

var g_sSeparator = "###";


/////////////////////////////////////////////////////////////////
/// DO NOT CHANGE ANYTHING BELOW THIS LINE //////////////////////
/////////////////////////////////////////////////////////////////


 
main();


function main(){ 
    
    var oQuickObjDef = null;
    var aoSelectedObjDefs = ArisData.getSelectedObjDefs();
    if(aoSelectedObjDefs!=null && aoSelectedObjDefs.length>0){
        oQuickObjDef = aoSelectedObjDefs[0];
    }
    
    if(oQuickObjDef!=null){
        
    
        // 1) Principle risks    
        var asAvailablePrincipalRisk = getAvailableValuesByMethod(AT_NTT_RM_PRINCIPAL_RISK_IMPACTED);
    
        var sAvailablePrincipleRisks = "";
        if(asAvailablePrincipalRisk!=null && asAvailablePrincipalRisk.length>0){
            sAvailablePrincipleRisks = "" + asAvailablePrincipalRisk.join(""+g_sSeparator);
        }
    
        Context.setProperty("406e31e0-4358-11ed-17de-00ff6aada4fe.separator", g_sSeparator);
        Context.setProperty("406e31e0-4358-11ed-17de-00ff6aada4fe.availableValues",""+sAvailablePrincipleRisks);
        
        var sSelectedPrincipleRisk = getAttributeValue(oQuickObjDef, AT_NTT_RM_PRINCIPAL_RISK_IMPACTED);
        Context.setProperty("406e31e0-4358-11ed-17de-00ff6aada4fe.value",""+sSelectedPrincipleRisk);
    
    
    
        
        // 2) Sub-Risks
        var asAvailableSubRisk = getAvailableValuesByMethod(AT_NTT_RM_SUB_RISK_CATEGORY);
        
        var sAvailableSubRisks = "";
        if(asAvailableSubRisk!=null && asAvailableSubRisk.length>0){
            sAvailableSubRisks = "" + asAvailableSubRisk.join(""+g_sSeparator);
        }
        
        Context.setProperty("46199c60-4358-11ed-17de-00ff6aada4fe.separator", g_sSeparator);
        Context.setProperty("46199c60-4358-11ed-17de-00ff6aada4fe.availableValues",""+sAvailableSubRisks);
    
        var sSelectedSubRisk = getAttributeValue(oQuickObjDef, AT_NTT_RM_SUB_RISK_CATEGORY);
        Context.setProperty("46199c60-4358-11ed-17de-00ff6aada4fe.value",""+sSelectedSubRisk);

        // 3) Department
        var asAvailableDepartments = getAvailableValuesByMethod(AT_NTT_RM_DEPARTMENT);//AT_NTT_RM_DEPARTMENT

        var sAvailableDepartments = "";
        if(asAvailableDepartments!=null && asAvailableDepartments.length>0){
            sAvailableDepartments = "" + asAvailableDepartments.join(""+g_sSeparator);
        }
        
        Context.setProperty("fab2bdd0-5b51-11ed-2f63-00ff6aada4fe.separator", g_sSeparator);
        Context.setProperty("fab2bdd0-5b51-11ed-2f63-00ff6aada4fe.availableValues",""+sAvailableDepartments);

        var sSelectedDepartment = getAttributeValue(oQuickObjDef, AT_NTT_RM_DEPARTMENT);
        Context.setProperty("fab2bdd0-5b51-11ed-2f63-00ff6aada4fe.value",""+sSelectedDepartment);
    }
    
}





function getAvailableValuesByMethod(intAttrType) {
    var retArray = new Array();

    var listValueTypes = g_oFilter.AttrValueTypeNums(intAttrType);
    for each(var valueTypeNum in listValueTypes) {
        retArray.push(g_oFilter.AttrValueType(intAttrType, valueTypeNum));
    }

    return retArray;
}


function getAttributeValue(oObjDef, nAttrTypeNum){
    var sValue = "";
    
    if(oObjDef!=null && oObjDef.IsValid()){
        if(nAttrTypeNum!=null && !("".equals(nAttrTypeNum))){
            if(oObjDef.Attribute(nAttrTypeNum, g_nLoc)!=null){
                sValue = "" + oObjDef.Attribute(nAttrTypeNum, g_nLoc).getValue();
                
            }
        }
        
    }
    return sValue;
}



