var currentLng = Context.getSelectedLanguage();

var objects = ArisData.getSelectedObjDefs()

var obj = objects[0]

var str = obj.Attribute(ATT_NTT_RM_FINANCIAL_RISK, currentLng).getValue()

var a = getCheckedValue(str)

var dateStr = obj.Attribute(AT_NTT_RM_RISK_IDENTIFIED_ON, currentLng).getValue()

    
    formatter = new java.text.SimpleDateFormat("MM/dd/yyyy");
    strdate = new Date(dateStr);
    strgenerationm = formatter.format(strdate);

var a=2

function getCheckedValue(checkStr){
    if(checkStr.toLowerCase() == "true")
        return true
    else if (checkStr.toLowerCase() == "false")
        return false
    else
        return null
}