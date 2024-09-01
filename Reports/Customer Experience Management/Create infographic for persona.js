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

/************************************************************************************************************************************/

var b_DEBUG = false;     // false: default, true: Debug output -> table borders are shown

/************************************************************************************************************************************/
 
const c_BLACK = Constants.C_BLACK;
const c_WHITE = Constants.C_WHITE;
const c_TRANS = Constants.C_TRANSPARENT;
const c_BLUE  = RGB( 23, 118, 191);     // #1776bf
const c_GREY  = RGB(120, 120, 120);     // #787878

var nLoc = Context.getSelectedLanguage();

var oOut = Context.createOutputObject();
initOutput();
    
var oPersonas = getPersonas();
for (var i = 0; i < oPersonas.length; i++) {
    outNewpage(i);
    
    var oPersona = oPersonas[i];
    outName(oPersona);          // Name
    outData(oPersona);          // Portrait, [Age, Family status, Job role, Location, Customer segment], Quote
    outAbout(oPersona);         // About (Description)
    outDetails(oPersona);       // Personality, Goals, Frustrations
    outDescImages(oPersona);    // Descriptive images
}
oOut.WriteReport();

/************************************************************************************************************************************/

function outName(oPersona) {
    setCellSpacing(3, 3);    
    // Name
    beginTable();
    oOut.TableRow();
    oOut.TableCellF(oPersona.Name(nLoc), 100, "HEAD");
    endTable();
}

function outData(oPersona) {
    outEmptyLine();    
    beginTable();    

    // Portrait image
    setCellSpacing(0, 0); 
    oOut.TableRow();  
    outAttrImage(oPersona, Constants.AT_ADS_LINK_1, Constants.AT_PORTRAIT_IMAGE_LINK, 48, "IMG");
    outEmptyColumn();
    
    // Age, Family status, Job role, Location, Customer segment
    oOut.TableCellF("", 50, "TXT");
    beginTable();

    setCellSpacing(2, 2);    
    outVita(oPersona);
    
    // Quote
    setCellSpacing(4, 4);    
    oOut.TableRow();
    oOut.TableCellF(getQuote(), 100, "QUOT");

    endTable();
    
    endTable();

    function outVita(oPersona) {
        // Age, Family status, Job role, Location, Customer segment
        oOut.TableRow();
        oOut.TableCellF(getString("AGE"), 50, "HEAD2");
        oOut.TableCellF(getAttrValue(oPersona, Constants.AT_AGE), 50, "TXT2");
        oOut.TableRow();
        oOut.TableCellF(getString("JOB_ROLE"), 50, "HEAD2");
        oOut.TableCellF(getAttrValue(oPersona, Constants.AT_JOB_TITLE), 50, "TXT2");
        oOut.TableRow();
        oOut.TableCellF(getString("FAMILY_STATUS"), 50, "HEAD2");
        oOut.TableCellF(getAttrValue(oPersona, Constants.AT_FAMILY_STATUS), 50, "TXT2");
        oOut.TableRow();
        oOut.TableCellF(getString("LOCATION"), 50, "HEAD2");
        oOut.TableCellF(getAttrValue(oPersona, Constants.AT_LOCATION), 50, "TXT2");
        oOut.TableRow();
        oOut.TableCellF(getString("CUSTOMER_SEGMENT"), 50, "HEAD2");
        oOut.TableCellF(getCustomerSegment(), 50, "TXT2");
    }
    
    
    function getCustomerSegment() {
        var oCustomerSegments = oPersona.getConnectedObjs([Constants.OT_CUSTOMER_SEGMENT]);
        if (oCustomerSegments.length > 0) {
            return oCustomerSegments[0].Name(nLoc);
        }
        return "";
    }
    
    function getQuote() {
        var sQuote = getAttrValue(oPersona, Constants.AT_QUOTE);
        if (sQuote != "") sQuote = "\"" + sQuote + "\"";
        return sQuote;
    }    
}

function outAbout(oPersona) {
    outEmptyLine();
    setCellSpacing(2, 2);    
    // Description
    beginTable();
    oOut.TableRow();
    oOut.TableCellF(getString("ABOUT"), 100, "HEAD3");
    oOut.TableRow();  
    outAttrText(oPersona, Constants.AT_DESC, 100, "TXT");
    endTable();
}

function outDetails(oPersona) {
    outEmptyLine();
    setCellSpacing(2, 2);
    // Personality, Goals, Frustrations
    beginTable();
    oOut.TableRow();   
    oOut.TableCellF(getString("PERSONALITY"), 32, "HEAD3");
    outEmptyColumn();    
    oOut.TableCellF(getString("GOALS"), 32, "HEAD3");
    outEmptyColumn();    
    oOut.TableCellF(getString("FRUSTRATIONS"), 32, "HEAD3");
    oOut.TableRow();   
    outAttrText(oPersona, Constants.AT_PERSONALITY, 32, "TXT");
    outEmptyColumn();
    outAttrText(oPersona, Constants.AT_GOALS, 32, "TXT");
    outEmptyColumn();
    outAttrText(oPersona, Constants.AT_FRUSTRATIONS, 32, "TXT");
    endTable();
}

function outDescImages(oPersona) {
    outEmptyLine();    
    setCellSpacing(0, 0);    
    // Portrait image
    beginTable();
    oOut.TableRow();
    outAttrImage(oPersona, Constants.AT_ADS_LINK_2, Constants.AT_DESC_IMAGE_LINK_1, 32, "IMG");
    outEmptyColumn();
    outAttrImage(oPersona, Constants.AT_ADS_LINK_3, Constants.AT_DESC_IMAGE_LINK_2, 32, "IMG");
    outEmptyColumn();
    outAttrImage(oPersona, Constants.AT_ADS_LINK_4, Constants.AT_DESC_IMAGE_LINK_3, 32, "IMG");
    endTable();
}

function outAttrText(item, attrType, width, styleSheet) {
    var styledValue = item.Attribute(attrType, nLoc).getStyledValue();
    if (!styledValue.containsOnlyPlainText()) {

        styledValue = styledValue.getMergedFormatting(getString("FONT"), 12, c_GREY, Constants.FMT_LEFT, true);        
        oOut.TableCellF("", width, styleSheet);
        oOut.OutputFormattedText(styledValue.getHTML());
        return;
    }
    oOut.TableCellF(getAttrValue(item, attrType), width, styleSheet);
}

function outAttrImage(item, attrTypeADS, attrTypeWeb, width, styleSheet) {
    oOut.TableCellF("", width, styleSheet);

    // ADS attribute (BLUE-16025)
    var oPic = getPictureADS(item, attrTypeADS);
    if (oPic == null) {
        // Web attribute
        oPic = getPictureWeb(item, attrTypeWeb);
    }
        
    if (oPic != null) {
        oOut.OutGraphic(oPic, -1, 100, 100);
    }        
    
    function getPictureADS(item, attrTypeADS) {
        try {
            var compADS = Context.getComponent("ADS");
            if (compADS != null) {  
                
                var sAdsLink = getAttrValue(item, attrTypeADS);
                if (sAdsLink != "") {
                    var doc = compADS.getDocumentByHyperlink(sAdsLink);
                    var is = doc.getDocumentContent();
                    var imageInByte = org.apache.commons.io.IOUtils.toByteArray(is);
                    return Context.createPicture(imageInByte, getImageFormat(doc));
                }
            }
            return null;
        } catch(e) {
            Context.writeLog(e.message);
            return null;
        }
        
        function getImageFormat(doc) {
            var imgFormat = Constants.IMAGE_FORMAT_JPG;
            try {
                var fileName = new java.lang.String(doc.getDocumentMetaInfo().getFileName());
                if (fileName.endsWith(".png")) {
                    imgFormat = Constants.IMAGE_FORMAT_PNG;
                }
            } catch(e) {}
            return imgFormat;
        }
    }
    
    function getPictureWeb(item, attrTypeWeb) {
        try {
            var sUrl = getAttrValue(item, attrTypeWeb);
            if (sUrl != "") {
                
                var originalImage = javax.imageio.ImageIO.read(new java.net.URL(sUrl));
                var baos = new java.io.ByteArrayOutputStream();
                javax.imageio.ImageIO.write( originalImage, "png", baos );
                baos.flush();
                var imageInByte = baos.toByteArray();
                baos.close();
                
                return Context.createPicture(imageInByte, Constants.IMAGE_FORMAT_PNG);
            }
            return null;
        } catch(e) {
            Context.writeLog(e.message);
            return null;
        }
    }
}

function getPersonas() {
    var oPersonas = new Array();
    var oSelObjDefs = ArisData.getSelectedObjDefs();

    for (var i in oSelObjDefs) {
        var oObjDef = oSelObjDefs[i];
        if (oObjDef.TypeNum() == Constants.OT_PERSONA) {
            oPersonas.push(oObjDef);
        }
    }
    return oPersonas;
}

function getAttrValue(item, attrType) {
    return item.Attribute(attrType, nLoc).getValue();
}

function RGB(r, g, b) {
    return (new java.awt.Color(r/255.0,g/255.0,b/255.0,1)).getRGB() & 0xFFFFFF;
}

function initOutput() {
    oOut.DefineF("HEAD",  getString("FONT"), 24, c_WHITE, c_BLUE,  Constants.FMT_CENTER | Constants.FMT_VCENTER, 0, 0, 0, 0, 0, 1);
    oOut.DefineF("HEAD2", getString("FONT"), 12, c_BLUE,  c_TRANS, Constants.FMT_LEFT | Constants.FMT_VCENTER, 0, 0, 0, 0, 0, 1);
    oOut.DefineF("HEAD3", getString("FONT"), 14, c_BLUE,  c_TRANS, Constants.FMT_LEFT | Constants.FMT_VCENTER, 0, 0, 0, 0, 0, 1);
    oOut.DefineF("TXT",   getString("FONT"), 12, c_GREY, c_TRANS, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1);
    oOut.DefineF("TXT2",  getString("FONT"), 12, c_GREY, c_TRANS, Constants.FMT_LEFT | Constants.FMT_VCENTER, 0, 0, 0, 0, 0, 1);
    oOut.DefineF("QUOT",  getString("FONT"), 14, c_WHITE, c_BLUE,  Constants.FMT_CENTER | Constants.FMT_VCENTER | Constants.FMT_ITALIC, 0, 0, 0, 0, 0, 1);
    oOut.DefineF("IMG",   getString("FONT"), 12, c_TRANS, c_TRANS,  Constants.FMT_CENTER | Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1);
    oOut.DefineF("EMPT",  getString("FONT"), 12, c_TRANS, c_TRANS, Constants.FMT_LEFT, 0, 0, 0, 0, 0, 1);

    // Apply default page format settings to output object  
	oOut.SetPageWidth(210);
	oOut.SetPageHeight(297);
	oOut.SetLeftMargin(10);
	oOut.SetRightMargin(10);
	oOut.SetTopMargin(10);
	oOut.SetBottomMargin(10);

    setFrameStyle(0);
}

function setFrameStyle(nTwThickness) {
    if (b_DEBUG) {
        nTwThickness = 15;
    }
    oOut.SetFrameStyle(Constants.FRAME_TOP, nTwThickness);
    oOut.SetFrameStyle(Constants.FRAME_LEFT, nTwThickness);
    oOut.SetFrameStyle(Constants.FRAME_RIGHT, nTwThickness);
    oOut.SetFrameStyle(Constants.FRAME_BOTTOM, nTwThickness);
}

function outEmptyLine() {
    oOut.OutputLn("", getString("FONT"), 10, c_TRANS,c_TRANS, Constants.FMT_LEFT, 0);
}

function outEmptyColumn() {
    oOut.TableCellF("", 2, "EMPT");
}

function setCellSpacing(top, bottom) {
    oOut.setCellSpacing(top, bottom, 0, 0);
}

function outNewpage(i) {
    if (i == 0) return;
    oOut.OutputField(Constants.FIELD_NEWPAGE, getString("FONT"), 10, c_BLACK, c_TRANS, Constants.FMT_LEFT);
}

function beginTable() {
    oOut.BeginTable(100, c_BLACK, c_TRANS, Constants.FMT_LEFT, 0);
}

function endTable() {
    oOut.EndTable("", 100, getString("FONT"), 10, c_BLACK, c_TRANS, 0, Constants.FMT_LEFT, 0);
}



