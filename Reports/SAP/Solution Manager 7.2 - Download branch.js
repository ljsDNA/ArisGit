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


main();

function main()
{
    ROLE_CONSIDER_ORGUNITS = 1;
    ROLE_CONSIDER_POSITIONS = 2;
    ROLE_CONSIDER_JOBS = 4;
    ROLE_CONSIDER_USERS = 8;

    if (ArisData.getSelectedGroups().length == 1)
    {
        var SM72 = Context.getComponent("SM72");
        var options = SM72.createOptions(ArisData.getSelectedGroups()[0], "051MZ7Q57jQfur5CU3eUcG");

        options.setSAPLogonUser("User");
        options.setSAPLogonPassword("Password");
        options.setSAPLogonLanguage("E");
        
        var result = SM72.synchronize(ArisData.getSelectedGroups()[0], options);
        if (result.getLogFileName() != null && result.getLogFileName().length() > 0)
        {
            saveLogFile(result.getLogFileName());       
        }
        else
        {
            var ooutfile = Context.createOutputObject ();
            ooutfile.OutputTxt("<result>\r\n");
            ooutfile.OutputTxt("\t<success>" + result.getResult() + "</success>\r\n");
            ooutfile.OutputTxt("\t<error code=\"0\" message=\"" + result.getErrorMessage() + "\"/>\r\n");
            ooutfile.OutputTxt("</result>\n\n");
            ooutfile.WriteReport(); 
        }
    }  
}

function saveLogFile(sFnm) 
{    
    try 
    {   
        var inputStream = null;
        var source = new java.io.File(sFnm);
        inputStream = new java.io.FileInputStream(source);
        var output = Context.createOutputObject();
        Context.setSelectedFile(source.getName());
                       
        var buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, source.length());
        var i = inputStream.read(buffer);
        inputStream.close();
        inputStream = null;
        Context.setFile(source.getName(), Constants.LOCATION_OUTPUT, buffer)
    }
    catch(e) 
    {
        if(inputStream!=null) inputStream.close(); 
        return null;
    }
    output.WriteReport()
}



