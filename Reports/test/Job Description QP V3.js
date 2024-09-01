//Context.setProperty("model-as-emf", true)
var oOutput = Context.createOutputObject()
var xlTableActive = false
oOutput.DefineF(getString("ID_STYLE_RD_DEFAULT"), getString("ID_DEFAULT_FONT"), 11, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1)
oOutput.DefineF(getString("ID_STYLE_RD_HEADING_1"), getString("ID_DEFAULT_FONT"), 18, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_TOCENTRY0, 0, 0, 4, 4, 0, 1)
oOutput.DefineF(getString("ID_STYLE_RD_HEADING_2"), getString("ID_DEFAULT_FONT"), 14, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_ITALIC | Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_TOCENTRY1, 0, 0, 2, 2, 0, 1)
oOutput.DefineF(getString("ID_STYLE_RD_TABLE_CONTENT"), getString("ID_DEFAULT_FONT"), 8, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1)
oOutput.DefineF(getString("ID_STYLE_RD_HEADING_3"), getString("ID_DEFAULT_FONT"), 12, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_ITALIC | Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_TOCENTRY2, 0, 0, 1, 1, 0, 1)
oOutput.DefineF(getString("ID_STYLE_RD_HEADING_4"), getString("ID_DEFAULT_FONT"), 12, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_ITALIC | Constants.FMT_BOLD | Constants.FMT_LEFT | Constants.FMT_VTOP | Constants.FMT_TOCENTRY3, 0, 0, 0, 0, 0, 1)
oOutput.DefineF(getString("ID_STYLE_RD_INFO"), getString("ID_DEFAULT_FONT"), 14, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_VTOP, 0, 0, 1.76, 8.82, 0, 1)
oOutput.DefineF(getString("ID_STYLE_RD_TABLE_HEAD"), getString("ID_DEFAULT_FONT"), 8, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1)
oOutput.DefineF(getString("ID_STYLE_RD_TITLE"), getString("ID_DEFAULT_FONT"), 21, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_CENTER | Constants.FMT_VTOP, 0, 0, 1.76, 8.82, 0, 1)
oOutput.DefineF(getString("ID_STYLE_RD_HEADER_FOOTER"), getString("ID_DEFAULT_FONT"), 10, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1)
setupOutputObject(oOutput)
oOutput.SetTitle(Context.getScriptInfo(Constants.SCRIPT_NAME))

var startObject = ArisData.getSelectedObjDefs() //dohvati objekt na kojem se pokrece report

var nLocale = Context.getSelectedLanguage() //dohvati jezik

main(startObject);

oOutput.WriteReport() //ispisi report

/** Apply default page format settings to output object
 * @param {Output} outputObj The output object
 */

function setupOutputObject(outputObj) {
    outputObj.SetAutoTOCNumbering(true)
    globalHeader(outputObj)

    globalFooter(outputObj)
}

function globalHeader(outputObj) {
    outputObj.BeginHeader()
    if (Context.getSelectedFormat() != Constants.OUTEXCEL)
        outputObj.BeginTable(100, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT, 0)
    outputObj.TableRow()
    outputObj.ResetFrameStyle()
    outputObj.SetFrameStyle(Constants.FRAME_TOP, 0, 0)
    outputObj.SetFrameStyle(Constants.FRAME_LEFT, 0, 0)
    outputObj.SetFrameStyle(Constants.FRAME_BOTTOM, 51, Constants.BRDR_NORMAL)
    outputObj.SetFrameStyle(Constants.FRAME_RIGHT, 0, 0)
    outputObj.TableCell("", 36.72, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
    outputObj.BeginParagraph(Constants.FMT_LEFT, 0.71, 0.71, 0, 0, 0)
    var image = Context.createPicture("logo_report.png")
    outputObj.OutGraphic(image, -1, 55, 20)

    outputObj.EndParagraph()
    outputObj.TableCell("", 63.28, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
    outputObj.BeginParagraphF(getString("ID_STYLE_RD_DEFAULT"))
    outputObj.OutputLnF("", getString("ID_STYLE_RD_DEFAULT"))
    outputObj.EndParagraph()
    outputObj.BeginParagraph(Constants.FMT_LEFT, 0.71, 0.71, 0, 0, 0)
    outputObj.OutputLn(getString("ID_REPORTDEF_10"), getString("ID_REPORTDEF_11"), 24, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0.71)
    outputObj.EndParagraph()
    if (Context.getSelectedFormat() != Constants.OUTEXCEL)
        outputObj.EndTable("", 100, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0)
    else
        outputObj.TableRow()
    outputObj.EndHeader()
}

function globalFooter(outputObj) {
    outputObj.BeginFooter()
    if (Context.getSelectedFormat() != Constants.OUTEXCEL)
        outputObj.BeginTable(100, Constants.C_TRANSPARENT, Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_NOBORDER, 0)
    outputObj.TableRow()
    outputObj.ResetFrameStyle()
    outputObj.SetFrameStyle(Constants.FRAME_TOP, 0, 0)
    outputObj.SetFrameStyle(Constants.FRAME_LEFT, 0, 0)
    outputObj.SetFrameStyle(Constants.FRAME_BOTTOM, 0, 0)
    outputObj.SetFrameStyle(Constants.FRAME_RIGHT, 0, 0)
    outputObj.TableCell("", 1.66, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0)
    outputObj.TableCell("", 98.34, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_CENTER, 0)
    outputObj.BeginParagraph(Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
    outputObj.Output(getString("ID_REPORTDEF_2"), getString("ID_REPORTDEF_11"), 11, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0.71)
    outputObj.OutputField(Constants.FIELD_PAGE, getString("ID_REPORTDEF_11"), 11, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_CENTER)
    outputObj.Output(getString("ID_REPORTDEF_3"), getString("ID_REPORTDEF_11"), 11, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0.71)
    outputObj.OutputField(Constants.FIELD_NUMPAGES, getString("ID_REPORTDEF_11"), 11, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_CENTER)
    outputObj.OutputLn("", getString("ID_REPORTDEF_11"), 11, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_CENTER, 0.71)
    outputObj.EndParagraph()
    if (Context.getSelectedFormat() != Constants.OUTEXCEL)
        outputObj.EndTable("", 100, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0)
    else
        outputObj.TableRow()
    outputObj.EndFooter()
}

/**
 * @param {Output} p_output The output object
 * @param {ObjDef[]} p_aObjDef 
 */

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//                                                                              FUNCTIONS
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------


function main(startObject) {
    for (var i = 0; i < startObject.length; i++) {
        if (startObject[i].TypeNum() == Constants.OT_PERS_TYPE) {  //start na Role
            var positions = getConnectedPositionsFromRole(startObject[i]) //dohvati sve pozicije spojene na rolu DONE!
        }
          
        if(startObject[i].TypeNum() == Constants.OT_POS){   //start na Position
        var positions = startObject
        }
        
        for (var j = 0; j < positions.length; j++) { //piči kroz pozicije uzimaj jednu po jednu

            oOutput.BeginSection(false, Constants.SECTION_DEFAULT); //zapocni novu stranicu

            globalHeader(oOutput)
            globalFooter(oOutput)

            emptyrow(1)

            //1. ZAGLAVLJE
            oOutput.BeginParagraphF(getString("ID_STYLE_RD_DEFAULT"))
            oOutput.OutputLnF("Job Title: " + positions[j].Name(nLocale), getString("ID_STYLE_RD_DEFAULT")) //ispisi ime pozicije
            oOutput.EndParagraph()

            oOutput.BeginParagraphF(getString("ID_STYLE_RD_DEFAULT"))
            oOutput.OutputLnF("Position No.: " + getObjectDefAtrValue(positions[j], AT_POSITION_NO), getString("ID_STYLE_RD_DEFAULT")) //
            oOutput.EndParagraph()

            oOutput.BeginParagraphF(getString("ID_STYLE_RD_DEFAULT"))
            oOutput.OutputLnF("Reports to.: " + getReportsToValue(positions[j]), getString("ID_STYLE_RD_DEFAULT")) //
            oOutput.EndParagraph()

            oOutput.BeginParagraphF(getString("ID_STYLE_RD_DEFAULT"))
            oOutput.OutputLnF("Directorate / Dept.: " + getDirectorateDeptValue(positions[j]), getString("ID_STYLE_RD_DEFAULT")) //
            oOutput.EndParagraph()

            emptyrow(1)

            //2. PRIMARY PURPOSE OF THE JOB
            oOutput.BeginParagraphF(getString("ID_STYLE_RD_DEFAULT"))
            oOutput.Output("Primary purpose of the Job", getString("ID_STYLE_RD_DEFAULT"), 16, RGB(0, 0, 0),  RGB(198, 217, 241), Constants.FMT_BOLD | Constants.FMT_LEFT, 0)
            oOutput.EndParagraph()

            emptyrow(1)

            oOutput.BeginParagraphF(getString("ID_STYLE_RD_DEFAULT"))
            oOutput.OutputLnF(positions[j].Attribute(Constants.AT_DESC, nLocale).GetValue(false), getString("ID_STYLE_RD_DEFAULT")) //
            oOutput.EndParagraph()

            emptyrow(1);

            //3. JOB DIMENSIONS
            oOutput.BeginParagraphF(getString("ID_STYLE_RD_DEFAULT"))
            oOutput.Output("Job Dimensions", getString("ID_STYLE_RD_DEFAULT"), 16, RGB(0, 0, 0),  RGB(198, 217, 241), Constants.FMT_BOLD | Constants.FMT_LEFT, 0)
            oOutput.EndParagraph()

            emptyrow(1)

            jobDimensionsTable(positions[j]) //ispisi tablicu

            emptyrow(1)

            //3. PRINCIPAL ACCOUNTABILITIES  
            oOutput.BeginParagraphF(getString("ID_STYLE_RD_DEFAULT"))
            oOutput.Output("Principal Accountabilities", getString("ID_STYLE_RD_DEFAULT"), 16, RGB(0, 0, 0),  RGB(198, 217, 241), Constants.FMT_BOLD | Constants.FMT_LEFT, 0)
            oOutput.EndParagraph()

            emptyrow(1)

            //************************************************************************************************************************************
            //trenutno lovi funkcije sa ROLE na kojoj se pokrece report, treba mozda promijeniti na poziciju zamini startObject[0] sa positions[j]
            var allFunctionsFromPosition = startObject[0].getConnectedObjs([Constants.OT_FUNC], Constants.EDGES_INOUTASSIGN, new Array(Constants.CT_EXEC_1, Constants.CT_EXEC_2))

            for (var k = 0; k < allFunctionsFromPosition.length; k++) {
                oOutput.BeginParagraphF(getString("ID_STYLE_RD_DEFAULT"))
                oOutput.OutputLnF("• "+allFunctionsFromPosition[k].Name(nLocale), getString("ID_STYLE_RD_DEFAULT"))
                oOutput.EndParagraph()
            }

            emptyrow(1)

            //4. DECISION MAKING AUTHORITY
            oOutput.BeginParagraphF(getString("ID_STYLE_RD_DEFAULT"))
            //oOutput.Output("Decision Making Authority", getString("ID_STYLE_RD_DEFAULT"), 16, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_BOLD | Constants.FMT_LEFT, 0)
            oOutput.Output("Decision Making Authority", getString("ID_STYLE_RD_DEFAULT"), 16, RGB(0, 0, 0), RGB(198, 217, 241), Constants.FMT_BOLD | Constants.FMT_LEFT, 0)
            oOutput.EndParagraph()

            emptyrow(1)

            for (var k = 0; k < allFunctionsFromPosition.length; k++) {
                //if(getObjectDefAtrValue(allFunctionsFromPosition[k], AT_CODICE) == 1){ //Podesi da radi sa boolean     
                var attrListFunction = allFunctionsFromPosition[k].AttrList(nLocale, [ArisData.ActiveFilter().UserDefinedAttributeTypeNum(AT_JD_RELEVANT)])
                if (attrListFunction[0] != undefined && attrListFunction[0].GetValue(false) == 1) {
                    oOutput.BeginParagraphF(getString("ID_STYLE_RD_DEFAULT"))
                    oOutput.OutputLnF("• "+allFunctionsFromPosition[k].Name(nLocale), getString("ID_STYLE_RD_DEFAULT"))
                    oOutput.EndParagraph()
                }
            }

            emptyrow(1)

            //5. CONTEXT / SPECIAL FEATURES / CHALLENGES
            oOutput.BeginParagraphF(getString("ID_STYLE_RD_DEFAULT"))
            oOutput.Output("Context / Special Features / Challenges", getString("ID_STYLE_RD_DEFAULT"), 16, RGB(0, 0, 0),  RGB(198, 217, 241), Constants.FMT_BOLD | Constants.FMT_LEFT, 0)
            oOutput.EndParagraph()
            emptyrow(1)
            oOutput.BeginParagraphF(getString("ID_STYLE_RD_DEFAULT"))
            oOutput.OutputLnF(positions[j].Attribute(Constants.AT_SHORT_DESC, nLocale).GetValue(false), getString("ID_STYLE_RD_DEFAULT"))
            oOutput.EndParagraph()

            emptyrow(1);

            //5. QUALIFICATIONS/KNOWLEDGE/SKILLS/EXPERIENCE
            oOutput.BeginParagraphF(getString("ID_STYLE_RD_DEFAULT"))
            oOutput.Output("Qualifications/Knowledge/Skills/Experience", getString("ID_STYLE_RD_DEFAULT"), 16, RGB(0, 0, 0),  RGB(198, 217, 241), Constants.FMT_BOLD | Constants.FMT_LEFT, 0)
            oOutput.EndParagraph()
            emptyrow(1)
            tableQualificationsKnowledgeSkillsExperience(positions[j]);

            //6. TABLE BOTTOM OF REPORT
            emptyrow(2)

            oOutput.BeginTable(100, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0)
            oOutput.TableRow()
            oOutput.ResetFrameStyle()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0)
            oOutput.BeginParagraph(Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn(" ", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_VBOTTOM | Constants.FMT_CENTER | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
            oOutput.ResetFrameStyle()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
            oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn("Signature", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
            oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn("Ref. Ind. or Staff No.", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
            oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn("Date", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
                //new row
            oOutput.TableRow()
            oOutput.ResetFrameStyle()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0)
            oOutput.BeginParagraph(Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn("Prepared by", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_VBOTTOM | Constants.FMT_CENTER | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
            oOutput.ResetFrameStyle()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
            oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn(" ", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
            oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn(" ", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
            oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn(" ", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
                //new row
            oOutput.TableRow()
            oOutput.ResetFrameStyle()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0)
            oOutput.BeginParagraph(Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn("Reviewed by Supervisor", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_VBOTTOM | Constants.FMT_CENTER | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
            oOutput.ResetFrameStyle()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
            oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn(" ", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
            oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn(" ", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
            oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn(" ", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
                //new row
            oOutput.TableRow()
            oOutput.ResetFrameStyle()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0)
            oOutput.BeginParagraph(Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn("Approved by Department Manager", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_VBOTTOM | Constants.FMT_CENTER | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
            oOutput.ResetFrameStyle()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
            oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn(" ", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
            oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn(" ", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
            oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn(" ", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
                //new row
            oOutput.TableRow()
            oOutput.ResetFrameStyle()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0)
            oOutput.BeginParagraph(Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn("Date Received by HRO", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_VBOTTOM | Constants.FMT_CENTER | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
            oOutput.ResetFrameStyle()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
            oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn(" ", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
            oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn(" ", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()
            oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
            oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
            oOutput.OutputLn(" ", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
            oOutput.EndParagraph()

            oOutput.EndTable("", 100, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);

            oOutput.EndSection(); //zavrsi stranicu
        }

    }
}

function getConnectedPositionsFromRole(startObject) { //dohvati sve pozicije vezane na rolu na kojoj je pokrenut report
    var positionsFromRole = collect(startObject.AssignedModels([Constants.MT_ORG_CHRT]))
    return positionsFromRole
}

function collect(p_array) { //pomocna funkcija od funkcije getConnectedPositionsFromRole(startObject)
    var result = new Array();
    for (var i = 0; i < p_array.length; i++) {
        result = result.concat(p_array[i].ObjDefListByTypes([Constants.OT_POS]))
    }
    return ArisData.Unique(result)
}


function getObjectDefAtrValue(objectDefList, atribut) {
    //getObjectDefAtrValue(objectOccList[i], "AT_IME_I_PREZIME_NA_POZICIJI")  
    if (objectDefList.Attribute(ArisData.ActiveFilter().UserDefinedAttributeTypeNum(atribut), nLocale).GetValue(false) != undefined) {
        var atrValue = objectDefList.Attribute(ArisData.ActiveFilter().UserDefinedAttributeTypeNum(atribut), nLocale).GetValue(false)
        return atrValue
    } else {
        var atrValue = ""
        return atrValue
    }
}

function tableQualificationsKnowledgeSkillsExperience(position) {

    var allModelsFromPosition = collectModelsFromObject(position.OccList()) //dohvati sve modele sa pozicije
    var positionAllDiagramModels = new Array();

    //ArisData.ActiveFilter().UserDefinedModelTypeNum("01347b01-3dcf-11e6-2d2b-005056842832")]
    for (var i = 0; i < allModelsFromPosition.length; i++) { //u  varijablu orgChartModels spremi sve modele tipa position allocation diagram 
        if (allModelsFromPosition[i].TypeNum() == ArisData.ActiveFilter().UserDefinedModelTypeNum(CM_POSITION_ALLOCATION_DIAGRAM)) { //ako je position allocation diagram - ovo je custom model
            positionAllDiagramModels.push(allModelsFromPosition[i])
        }
    }
    if (positionAllDiagramModels[0] != undefined){

        var functionsFromPossitionAllDiagram = positionAllDiagramModels[0].ObjOccListFilter(Constants.OT_FUNC) //objekti funkcija u modelu, 

        //oOutput.BeginTable(100, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0)
        oOutput.BeginTable(100, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_NOLINEBREAK, 0)
        oOutput.TableRow()
        oOutput.ResetFrameStyle()
        oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0)
        oOutput.BeginParagraph(Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
        oOutput.OutputLn("Function", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_VBOTTOM | Constants.FMT_CENTER | Constants.FMT_BOLD, 0.71)
        oOutput.EndParagraph()
        oOutput.ResetFrameStyle()
        oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
        oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
        oOutput.OutputLn("Competency", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
        oOutput.EndParagraph()
        oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
        oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
        oOutput.OutputLn("Skill", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
        oOutput.EndParagraph()
        oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
        oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
        oOutput.OutputLn("Knowledge", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
        oOutput.EndParagraph()

        for (var j = 0; j < functionsFromPossitionAllDiagram.length; j++) {

            var competencyObjects = functionsFromPossitionAllDiagram[j].getConnectedObjOccs([Constants.ST_SURVEY_OPTION], Constants.EDGES_INOUT) //objekti competency spojeni na funkciju 

            for (var k = 0; k < competencyObjects.length; k++) {
                // var skillObjects = competencyObjects[k].getConnectedObjOccs(Constants.OT_WH_EQUIP_TYPE, Constants.EDGES_INOUT) //objekti skill spojeni na competency
                //var knowledgeObjects = competencyObjects[k].getConnectedObjOccs(Constants.OT_KNWLDG_CAT, Constants.EDGES_INOUT) //objekti knowledge spojeni na competency
                //var connectedObjects= competencyObjects[k].getConnectedObjOccs(new Array(Constants.OT_KNWLDG_CAT,Constants.OT_WH_EQUIP_TYPE), Constants.EDGES_INOUT) //oboje u istu varijablu NE RADI KAKO TRIBA

                var connectedObjects = competencyObjects[k].getConnectedObjOccs(new Array(Constants.ST_KNWLDG_CAT_1, Constants.ST_KNWLDG_CAT_2, ArisData.ActiveFilter().UserDefinedSymbolTypeNum(CS_SKILL)), Constants.EDGES_INOUT)

                for (var v = 0; v < connectedObjects.length; v++) {

                    if (connectedObjects[v].SymbolNum() == ArisData.ActiveFilter().UserDefinedSymbolTypeNum(CS_SKILL)) {
                        oOutput.TableRow()
                        oOutput.ResetFrameStyle()
                        oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0)
                        oOutput.BeginParagraph(Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
                        oOutput.OutputLn(functionsFromPossitionAllDiagram[j].ObjDef().Name(nLocale), getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_VBOTTOM | Constants.FMT_CENTER | Constants.FMT_BOLD, 0.71)
                        oOutput.EndParagraph()
                        oOutput.ResetFrameStyle()
                        oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
                        oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
                        oOutput.OutputLn(competencyObjects[k].ObjDef().Name(nLocale), getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
                        oOutput.EndParagraph()
                        oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
                        oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
                        oOutput.OutputLn(connectedObjects[v].ObjDef().Name(nLocale), getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
                        oOutput.EndParagraph()
                        oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
                        oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
                        oOutput.OutputLn(" ", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
                        oOutput.EndParagraph()
                    } else if (connectedObjects[v].SymbolNum() == Constants.ST_KNWLDG_CAT_1 || Constants.ST_KNWLDG_CAT_2) {
                        oOutput.TableRow()
                        oOutput.ResetFrameStyle()
                        oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0)
                        oOutput.BeginParagraph(Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
                        oOutput.OutputLn(functionsFromPossitionAllDiagram[j].ObjDef().Name(nLocale), getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_VBOTTOM | Constants.FMT_CENTER | Constants.FMT_BOLD, 0.71)
                        oOutput.EndParagraph()
                        oOutput.ResetFrameStyle()
                        oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
                        oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
                        oOutput.OutputLn(competencyObjects[k].ObjDef().Name(nLocale), getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
                        oOutput.EndParagraph()
                        oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
                        oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
                        oOutput.OutputLn(" ", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
                        oOutput.EndParagraph()
                        oOutput.TableCell("", 100 / 4, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
                        oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
                        oOutput.OutputLn(connectedObjects[v].ObjDef().Name(nLocale), getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
                        oOutput.EndParagraph()
                    }
                }
            }
        }
        oOutput.EndTable("", 100, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
    }
}

function getReportsToValue(position) { //algoritam dohvati sve modele u kojima se nalazi occurence pozicije, uzme samo one koji su organizational unit, zatim ide kroz svakoga posebno i sa zadnje razine 

    var allModelsFromPosition = collectModelsFromObject(position.OccList()) //dohvati sve modele sa pozicije
    var orgChartModels = new Array();

    for (var i = 0; i < allModelsFromPosition.length; i++) { //u  varijablu orgChartModels spremi sve modele tipa organizational chart
        if (allModelsFromPosition[i].TypeNum() == Constants.MT_ORG_CHRT) {
            orgChartModels.push(allModelsFromPosition[i])
        }
    }

    for (var i = 0; i < orgChartModels.length; i++) {
        var positionsFromOrgChartModel = orgChartModels[i].ObjOccListFilter(Constants.OT_POS)

        for (var j = 0; j < positionsFromOrgChartModel.length; j++) {
            if (positionsFromOrgChartModel[j].ObjDef().Name(nLocale) == position.Name(nLocale))
                var positionFound = positionsFromOrgChartModel[j]
        }

        var objectLevel_1 = positionFound.getConnectedObjOccs(new Array(Constants.ST_ORG_UNIT_1, Constants.ST_ORG_UNIT_2, Constants.ST_ORG_PIC, Constants.ST_ORG_UNIT_3), Constants.EDGES_INOUT)

        if (objectLevel_1[0] != undefined) {
            var objectLevel_2 = objectLevel_1[0].getConnectedObjOccs(new Array(Constants.ST_ORG_UNIT_1, Constants.ST_ORG_UNIT_2, Constants.ST_ORG_PIC, Constants.ST_ORG_UNIT_3), Constants.EDGES_IN)
            if (objectLevel_2[0] != undefined) {
                var positionConnectedToLevel2 = objectLevel_2[0].getConnectedObjOccs(new Array(Constants.ST_POS, Constants.ST_POS_1, Constants.ST_POS_2, Constants.ST_ORG_UNIT_3), Constants.EDGES_IN)
                var positionConnectedToLevel2Name = positionConnectedToLevel2[0].ObjDef().Name(nLocale)
            }
        }
    }

    return positionConnectedToLevel2Name


}

//ista kao getReportsToValue ali hvata ime sa objekta na levelu 2
function getDirectorateDeptValue(position) {

    var allModelsFromPosition = collectModelsFromObject(position.OccList()) //dohvati sve modele sa pozicije
    var orgChartModels = new Array();

    for (var i = 0; i < allModelsFromPosition.length; i++) { //u  varijablu orgChartModels spremi sve modele tipa organizational chart
        if (allModelsFromPosition[i].TypeNum() == Constants.MT_ORG_CHRT) {
            orgChartModels.push(allModelsFromPosition[i])
        }
    }

    for (var i = 0; i < orgChartModels.length; i++) {
        var positionsFromOrgChartModel = orgChartModels[i].ObjOccListFilter(Constants.OT_POS)

        for (var j = 0; j < positionsFromOrgChartModel.length; j++) {
            if (positionsFromOrgChartModel[j].ObjDef().Name(nLocale) == position.Name(nLocale))
                var positionFound = positionsFromOrgChartModel[j]
        }

        var objectLevel_1 = positionFound.getConnectedObjOccs(new Array(Constants.ST_ORG_UNIT_1, Constants.ST_ORG_UNIT_2, Constants.ST_ORG_PIC, Constants.ST_ORG_UNIT_3), Constants.EDGES_INOUT)

        if (objectLevel_1[0] != undefined) {
            var objectLevel_2 = objectLevel_1[0].getConnectedObjOccs(new Array(Constants.ST_ORG_UNIT_1, Constants.ST_ORG_UNIT_2, Constants.ST_ORG_PIC, Constants.ST_ORG_UNIT_3), Constants.EDGES_IN) //postavi da trazi samo ulazne veze!!!!
            if (objectLevel_2[0] != undefined) {

                var objectLevel_2_Name = objectLevel_2[0].ObjDef().Name(nLocale)
            }
        }
    }
    return objectLevel_2_Name
}

function collectModelsFromObject(p_array) {
    var result = new Array();
    for (var i = 0; i < p_array.length; i++) {
        result.push(p_array[i].Model())
    }
    return ArisData.Unique(result)
}

function emptyrow(number) {
    for (var i = 0; i < number; i++)
        oOutput.OutputLnF("", getString("ID_STYLE_RD_DEFAULT"))
}

function jobDimensionsTable(position) { //ispisuje tablicu za dio Job Dimensions

    oOutput.BeginTable(100, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0)
    oOutput.TableRow()
        //oOutput.ResetFrameStyle()
    oOutput.SetFrameStyle(Constants.FRAME_BOTTOM, 0, Constants.BRDR_NORMAL)
    oOutput.SetFrameStyle(Constants.FRAME_TOP, 15, Constants.BRDR_NORMAL)
    oOutput.SetFrameStyle(Constants.FRAME_LEFT, 15, Constants.BRDR_NORMAL)
    oOutput.TableCell("", 100 / 3, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0)
    oOutput.BeginParagraph(Constants.FMT_VBOTTOM | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
    oOutput.OutputLn("Number of staff supervised", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_VBOTTOM | Constants.FMT_CENTER | Constants.FMT_BOLD, 0.71)
    oOutput.EndParagraph()
    oOutput.ResetFrameStyle()
    oOutput.TableCell("", 100 / 3, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
    oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
    oOutput.OutputLn("Direct Reports:", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
    oOutput.EndParagraph()
    oOutput.TableCell("", 100 / 3, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
    oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
    oOutput.OutputLn(getObjectDefAtrValue(position, AT_DIRECT_REPORTS), getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
    oOutput.EndParagraph()

    oOutput.TableRow()
        //oOutput.ResetFrameStyle()
    oOutput.SetFrameStyle(Constants.FRAME_TOP, 0, Constants.BRDR_NORMAL)
    oOutput.TableCell("", 100 / 3, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_CENTER, 0)
    oOutput.BeginParagraph(Constants.FMT_VTOP | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
    oOutput.OutputLn("", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_VTOP | Constants.FMT_CENTER | Constants.FMT_BOLD, 0.71)
    oOutput.EndParagraph()
    oOutput.ResetFrameStyle()
    oOutput.TableCell("", 100 / 3, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
    oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
    oOutput.OutputLn("Total (whole team):", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
    oOutput.EndParagraph()
    oOutput.TableCell("", 100 / 3, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
    oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
    oOutput.OutputLn(getObjectDefAtrValue(position, AT_TOTAL_REPORTS), getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
    oOutput.EndParagraph()

    oOutput.TableRow()
    oOutput.ResetFrameStyle()
    oOutput.TableCell("", 100 / 3, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VCENTER | Constants.FMT_CENTER, 0)
    oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
    oOutput.OutputLn("Financial Data (QR mil/yr.):", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_VCENTER | Constants.FMT_CENTER | Constants.FMT_BOLD, 0.71)
    oOutput.EndParagraph()
    oOutput.TableCell("", 100 / 3, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
    oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
    oOutput.OutputLn("CAPEX/OPEX/Contracts:", getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
    oOutput.EndParagraph()
    oOutput.TableCell("", 100 / 3, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_VTOP | Constants.FMT_LEFT, 0)
    oOutput.BeginParagraph(Constants.FMT_VCENTER | Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
    oOutput.OutputLn(getObjectDefAtrValue(position, AT_CAPEX_OPEX_CONTRACTS), getString("ID_DEFAULT_FONT"), 9.5, RGB(0, 0, 0), Constants.C_TRANSPARENT, Constants.FMT_LEFT | Constants.FMT_BOLD, 0.71)
    oOutput.EndParagraph()

    oOutput.EndTable("", 100, "Arial", 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT | Constants.FMT_VTOP, 0);
}

function RGB(r, g, b) {
    return (new java.awt.Color(r / 255.0, g / 255.0, b / 255.0, 1)).getRGB() & 0xFFFFFF
}