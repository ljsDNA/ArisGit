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

var oOutput = Context.createOutputObject()
oOutput.DefineF("ID_STYLE_RD_HEADER_FOOTER", getString("ID_DEFAULT_FONT"), 9, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_LEFT| Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1)
oOutput.DefineF("ID_STYLE_RD_HEADING_4", getString("ID_DEFAULT_FONT"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_ITALIC | Constants.FMT_BOLD | Constants.FMT_LEFT| Constants.FMT_VTOP| Constants.FMT_TOCENTRY3 , 0, 0, 0, 0, 0, 1)
oOutput.DefineF("ID_STYLE_RD_HEADING_2", getString("ID_DEFAULT_FONT"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_ITALIC | Constants.FMT_BOLD | Constants.FMT_LEFT| Constants.FMT_VTOP| Constants.FMT_TOCENTRY1 , 0, 0, 2, 2, 0, 1)
oOutput.DefineF("ID_STYLE_RD_TABLE_CONTENT", getString("ID_DEFAULT_FONT"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_LEFT| Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1)
oOutput.DefineF("ID_STYLE_RD_DEFAULT", getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_LEFT| Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1)
oOutput.DefineF("ID_STYLE_RD_INFO", getString("ID_DEFAULT_FONT"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD | Constants.FMT_CENTER| Constants.FMT_VTOP, 0, 0, 1.76, 8.82, 0, 1)
oOutput.DefineF("ID_STYLE_RD_HEADING_3", getString("ID_DEFAULT_FONT"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_ITALIC | Constants.FMT_BOLD | Constants.FMT_LEFT| Constants.FMT_VTOP| Constants.FMT_TOCENTRY2 , 0, 0, 1, 1, 0, 1)
oOutput.DefineF("ID_STYLE_RD_HEADING_1", getString("ID_DEFAULT_FONT"), 18, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD | Constants.FMT_LEFT| Constants.FMT_VTOP| Constants.FMT_TOCENTRY0 , 0, 0, 4, 4, 0, 1)
oOutput.DefineF("ID_STYLE_RD_TITLE", getString("ID_DEFAULT_FONT"), 21, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD | Constants.FMT_CENTER| Constants.FMT_VTOP, 0, 0, 1.76, 8.82, 0, 1)
oOutput.DefineF("ID_STYLE_RD_TABLE_HEAD", getString("ID_DEFAULT_FONT"), 8, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD | Constants.FMT_CENTER| Constants.FMT_VTOP, 0, 0, 0, 0, 0, 1)
setupOutputObject( oOutput )
oOutput.SetTitle(Context.getScriptInfo(Constants.SCRIPT_NAME))

var nLocale = Context.getSelectedLanguage()
writeFirstPage( oOutput )
createSection1(oOutput, ArisData.getSelectedDatabases())
createSection2(oOutput, ArisData.getSelectedModels())
oOutput.WriteReport()

/** Apply default page format settings to output object
 * @param {Output} outputObj The output object
 */
function setupOutputObject(outputObj)
{
	outputObj.SetPageWidth(210.10)
	outputObj.SetPageHeight(297.20)
	outputObj.SetLeftMargin(20)
	outputObj.SetRightMargin(20)
	outputObj.SetTopMargin(30)
	outputObj.SetBottomMargin(30)
	outputObj.SetDistHeader(10)
	outputObj.SetDistFooter(10)
	outputObj.SetAutoTOCNumbering(true)
	globalHeader(outputObj)

	globalFooter(outputObj)
}
function globalHeader(outputObj) {
	outputObj.BeginHeader()
		outputObj.BeginTable(100, Constants.C_WHITE, Constants.C_TRANSPARENT,  Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0)
			outputObj.TableRow()
				outputObj.SetFrameStyle( Constants.FRAME_TOP, 0, 0)
				outputObj.SetFrameStyle( Constants.FRAME_LEFT, 0, 0)
				outputObj.SetFrameStyle( Constants.FRAME_BOTTOM, 0, 0)
				outputObj.SetFrameStyle( Constants.FRAME_RIGHT, 0, 0)
				outputObj.TableCell("", 24.27, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0,  Constants.FMT_VCENTER |  Constants.FMT_CENTER, 0)
			outputObj.BeginParagraph( Constants.FMT_CENTER, 1, 1, 0, 0, 0)
						var image = Context.createPicture("LOGO_L.gif")
			outputObj.OutGraphic(image, -1, 37, 13 )

			outputObj.EndParagraph()
				outputObj.ResetFrameStyle()
				outputObj.SetFrameStyle( Constants.FRAME_TOP, 0, 0)
				outputObj.SetFrameStyle( Constants.FRAME_LEFT, 0, 0)
				outputObj.SetFrameStyle( Constants.FRAME_BOTTOM, 0, 0)
				outputObj.SetFrameStyle( Constants.FRAME_RIGHT, 0, 0)
				outputObj.TableCell("", 50.76, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0,  Constants.FMT_VCENTER |  Constants.FMT_CENTER, 0)
			outputObj.BeginParagraph( Constants.FMT_CENTER, 1, 1, 0, 0, 0)
			outputObj.OutputLn(Context.getScriptInfo(Constants.SCRIPT_NAME), getString("ID_DEFAULT_FONT"), 12, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_CENTER, 1)
			outputObj.EndParagraph()
				outputObj.ResetFrameStyle()
				outputObj.SetFrameStyle( Constants.FRAME_TOP, 0, 0)
				outputObj.SetFrameStyle( Constants.FRAME_LEFT, 0, 0)
				outputObj.SetFrameStyle( Constants.FRAME_BOTTOM, 0, 0)
				outputObj.SetFrameStyle( Constants.FRAME_RIGHT, 0, 0)
				outputObj.TableCell("", 24.96, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0,  Constants.FMT_VCENTER |  Constants.FMT_CENTER, 0)
			outputObj.BeginParagraph( Constants.FMT_CENTER, 1, 1, 0, 0, 0)
						var image = Context.createPicture("LOGO_R.gif")
			outputObj.OutGraphic(image, -1, 19, 13 )

			outputObj.EndParagraph()
				outputObj.ResetFrameStyle()
		outputObj.EndTable("", 100, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0)
	outputObj.EndHeader()
}
function globalFooter(outputObj) {
	outputObj.BeginFooter()
		outputObj.BeginTable(100, Constants.C_WHITE, Constants.C_TRANSPARENT,  Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0)
			outputObj.TableRow()
				outputObj.SetFrameStyle( Constants.FRAME_TOP, 0, 0)
				outputObj.SetFrameStyle( Constants.FRAME_LEFT, 0, 0)
				outputObj.SetFrameStyle( Constants.FRAME_BOTTOM, 0, 0)
				outputObj.SetFrameStyle( Constants.FRAME_RIGHT, 0, 0)
				outputObj.TableCell("", 50, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0,  Constants.FMT_VTOP |  Constants.FMT_LEFT, 0)
			outputObj.BeginParagraph( Constants.FMT_LEFT, 0.71, 0.71, 0, 0, 0)
			outputObj.Output(getString("ID_REPORTDEF_7"), getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_LEFT, 0.71)
			outputObj.OutputField(Constants.FIELD_FILENAME, getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_LEFT)
			outputObj.OutputLn("", getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_LEFT, 0.71)
			outputObj.EndParagraph()
				outputObj.ResetFrameStyle()
				outputObj.SetFrameStyle( Constants.FRAME_TOP, 0, 0)
				outputObj.SetFrameStyle( Constants.FRAME_LEFT, 0, 0)
				outputObj.SetFrameStyle( Constants.FRAME_BOTTOM, 0, 0)
				outputObj.SetFrameStyle( Constants.FRAME_RIGHT, 0, 0)
				outputObj.TableCell("", 50, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0,  Constants.FMT_VTOP |  Constants.FMT_RIGHT, 0)
			outputObj.BeginParagraph( Constants.FMT_RIGHT, 0.71, 0.71, 0, 0, 0)
			outputObj.Output(getString("ID_REPORTDEF_8"), getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_RIGHT, 0.71)
			outputObj.OutputField(Constants.FIELD_PAGE, getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_RIGHT)
			outputObj.Output(getString("ID_REPORTDEF_9"), getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_RIGHT, 0.71)
			outputObj.OutputField(Constants.FIELD_NUMPAGES, getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_RIGHT)
			outputObj.OutputLn("", getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_RIGHT, 0.71)
			outputObj.EndParagraph()
				outputObj.ResetFrameStyle()
		outputObj.EndTable("", 100, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0)
	outputObj.EndFooter()
}

/** writes a cover page to output object
 * @param {Output} outputObj The ARIS output object
 */
function writeFirstPage(outputObj)
{
	outputObj.BeginSection(297.20, 210.10, 28.34467120181406, 28.34467120181406, 20, 20, 30, 30, false, Constants.SECTION_COVER)
		outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraph( Constants.FMT_CENTER, 0, 0, 0, 0, 0)
	outputObj.OutputLn(getString("ID_REPORTDEF_1"), getString("ID_DEFAULT_FONT"), 36, RGB(255,0,102), Constants.C_TRANSPARENT,  Constants.FMT_ITALIC | Constants.FMT_BOLD  |  Constants.FMT_CENTER, 0)
	outputObj.EndParagraph()
	outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraph( Constants.FMT_CENTER, 0, 0, 0, 0, 0)
	outputObj.Output(getString("ID_REPORTDEF_2"), getString("ID_DEFAULT_FONT"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_CENTER, 0)
	outputObj.OutputField(Constants.FIELD_DATE, getString("ID_DEFAULT_FONT"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_CENTER)
	outputObj.OutputLn("", getString("ID_DEFAULT_FONT"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_CENTER, 0)
	outputObj.EndParagraph()
	outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	outputObj.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	outputObj.EndParagraph()
	outputObj.BeginParagraph( Constants.FMT_CENTER, 0, 0, 0, 0, 0)
	outputObj.OutputLn(getString("ID_REPORTDEF_3"), getString("ID_DEFAULT_FONT"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_ITALIC | Constants.FMT_BOLD  |  Constants.FMT_CENTER, 0)
	outputObj.EndParagraph()
	outputObj.BeginParagraph( Constants.FMT_CENTER, 0, 0, 0, 0, 0)
	outputObj.OutputLn(getString("ID_REPORTDEF_4"), getString("ID_DEFAULT_FONT"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_ITALIC  |  Constants.FMT_CENTER, 0)
	outputObj.EndParagraph()
	outputObj.BeginParagraph( Constants.FMT_CENTER, 0, 0, 0, 0, 0)
	outputObj.OutputLn(getString("ID_REPORTDEF_5"), getString("ID_DEFAULT_FONT"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_ITALIC  |  Constants.FMT_CENTER, 0)
	outputObj.EndParagraph()
	outputObj.BeginParagraph( Constants.FMT_CENTER, 0, 0, 0, 0, 0)
	outputObj.OutputLn(getString("ID_REPORTDEF_6"), getString("ID_DEFAULT_FONT"), 14, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_ITALIC  |  Constants.FMT_CENTER, 0)
	outputObj.EndParagraph()

	outputObj.EndSection()

}
/**
 * @param {Output} p_output The output object
 * @param {Database[]} p_aDatabase 
*/
function createSection1(p_output, p_aDatabase)
{
	p_output.BeginSection(false, Constants.SECTION_INDEX)
	setupOutputObject( p_output ) //use defaults
	p_output.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	p_output.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	p_output.EndParagraph()
	p_output.BeginParagraphF("ID_STYLE_RD_TITLE")
	p_output.OutputLnF(getString("ID_REPORTDEF_10"), "ID_STYLE_RD_TITLE")
	p_output.EndParagraph()
	p_output.BeginParagraphF("ID_STYLE_RD_TITLE")
	p_output.OutputLnF("", "ID_STYLE_RD_TITLE")
	p_output.EndParagraph()
	p_output.BeginParagraphF("ID_STYLE_RD_DEFAULT")
		//to format the TOC output use output.SetTOCFormat(iLevel, sFont, iFontSize, nFontColor, nBackgroundColor, nFormat, nLeftIndentation, nRightIndentation, nDistTop, nDistBottom)
	p_output.OutputField( Constants.FIELD_TOC, getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_LEFT)
	p_output.EndParagraph()
	p_output.EndSection()


}

/**
 * @param {Output} p_output The output object
 * @param {Model[]} p_aModel 
*/
function createSection2(p_output, p_aModel)
{
	// do not create new section if all data is empty
	if(p_aModel.length==0)
		return

	p_output.BeginSection(false, Constants.SECTION_DEFAULT)
	setupOutputObject( p_output ) //use defaults
	p_output.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	p_output.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	p_output.EndParagraph()
	p_output.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	p_output.OutputLnF("", "ID_STYLE_RD_DEFAULT")
	p_output.EndParagraph()
	// repetition of queried data:
	for(var i=0; i<p_aModel.length; i++) {
		p_output.BeginParagraphF("ID_STYLE_RD_DEFAULT")
		p_output.OutputLnF("", "ID_STYLE_RD_DEFAULT")
		p_output.EndParagraph()
		p_output.BeginParagraphF("ID_STYLE_RD_DEFAULT")
		p_output.OutputLnF("", "ID_STYLE_RD_DEFAULT")
		p_output.EndParagraph()
		p_output.addLocalBookmark ( "6" )
		p_output.BeginParagraphF("ID_STYLE_RD_HEADING_1")
		p_output.Output(getString("ID_REPORTDEF_11"), getString("ID_DEFAULT_FONT"), 18, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD  |  Constants.FMT_LEFT| Constants.FMT_TOCENTRY0 , 0)
	writeData(p_output, p_aModel[i].Name(nLocale))
		p_output.EndParagraph()
		p_output.BeginParagraphF("ID_STYLE_RD_DEFAULT")
		p_output.OutputLnF("", "ID_STYLE_RD_DEFAULT")
		p_output.EndParagraph()
		p_output.BeginParagraphF("ID_STYLE_RD_DEFAULT")
		p_output.OutputLn(getString("ID_REPORTDEF_12"), getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD  |  Constants.FMT_LEFT, 0)
		p_output.EndParagraph()
		p_output.BeginParagraphF("ID_STYLE_RD_DEFAULT")
		p_output.OutputLnF("", "ID_STYLE_RD_DEFAULT")
		p_output.EndParagraph()
		p_output.BeginParagraphF("ID_STYLE_RD_DEFAULT")
	writeData1(p_output, p_aModel[i].Graphic(false, false, nLocale))
		p_output.EndParagraph()
		p_output.BeginParagraphF("ID_STYLE_RD_DEFAULT")
		p_output.OutputLnF("", "ID_STYLE_RD_DEFAULT")
		p_output.EndParagraph()
		p_output.BeginParagraphF("ID_STYLE_RD_DEFAULT")
		p_output.OutputLnF("", "ID_STYLE_RD_DEFAULT")
		p_output.EndParagraph()
		dtable(p_output, p_aModel[i].ObjDefListByTypes([Constants.OT_FUNC]))
	}

	// createSection2 local functions:
	/**
	 * @param {Output} p_output The output object
	 * @param {String } p_String
	*/
	function writeData(p_output, p_String) {
				p_output.OutputLn(p_String, getString("ID_DEFAULT_FONT"), 18, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD  |  Constants.FMT_LEFT| Constants.FMT_TOCENTRY0 , 0)
	}
	/**
	 * @param {Output} p_output The output object
	 * @param {IPictureBase } p_IPictureBase
	*/
	function writeData1(p_output, p_IPictureBase) {
				p_output.OutGraphic(p_IPictureBase, -1, p_output.getCurrentMaxWidth(), p_output.GetPageHeight() - p_output.GetTopMargin() - p_output.GetBottomMargin() -10)
	}
		/**
		 * @param {Output} p_output The output object
		 * @param {ObjDef[]} p_aObjDef 
		*/
		function dtable(p_output, p_aObjDef)
		{
			// do not create new table if all data is empty
			if(p_aObjDef.length==0)
				return
		
			p_output.BeginTable(100, Constants.C_BLACK, Constants.C_WHITE,  Constants.FMT_LEFT | Constants.FMT_REPEAT_HEADER, 0)
			p_output.TableRow()
				p_output.TableCell("", 25, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, RGB(204,255,204), 0,  Constants.FMT_VTOP |  Constants.FMT_CENTER, 0)
			p_output.BeginParagraph( Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
			p_output.OutputLn(getString("ID_REPORTDEF_13"), getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD  |  Constants.FMT_CENTER, 0.71)
			p_output.EndParagraph()
				p_output.TableCell("", 25, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, RGB(204,255,204), 0,  Constants.FMT_VTOP |  Constants.FMT_CENTER, 0)
			p_output.BeginParagraph( Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
			p_output.OutputLn(getString("ID_REPORTDEF_14"), getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD  |  Constants.FMT_CENTER, 0.71)
			p_output.EndParagraph()
				p_output.TableCell("", 25, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, RGB(204,255,204), 0,  Constants.FMT_VTOP |  Constants.FMT_CENTER, 0)
			p_output.BeginParagraph( Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
			p_output.OutputLn(getString("ID_REPORTDEF_15"), getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD  |  Constants.FMT_CENTER, 0.71)
			p_output.EndParagraph()
				p_output.TableCell("", 25, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, RGB(204,255,204), 0,  Constants.FMT_VTOP |  Constants.FMT_CENTER, 0)
			p_output.BeginParagraph( Constants.FMT_CENTER, 0.71, 0.71, 0, 0, 0)
			p_output.OutputLn(getString("ID_REPORTDEF_16"), getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_BOLD  |  Constants.FMT_CENTER, 0.71)
			p_output.EndParagraph()
			// repetition of queried data:
			for(var i1=0; i1<p_aObjDef.length; i1++) {
				p_output.TableRow()
					p_output.TableCell("", 25, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_WHITE, 0,  Constants.FMT_VTOP |  Constants.FMT_LEFT, 0)
				p_output.BeginParagraph( Constants.FMT_LEFT, 0.71, 0.71, 0, 0, 0)
			writeData2(p_output, p_aObjDef[i1].Attribute(Constants.AT_NAME, nLocale).GetValue(false))
				p_output.EndParagraph()
					p_output.TableCell("", 25, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_WHITE, 0,  Constants.FMT_VTOP |  Constants.FMT_LEFT, 0)
				p_output.BeginParagraph( Constants.FMT_LEFT, 0.71, 0.71, 0, 0, 0)
			writeData3(p_output, p_aObjDef[i1].Attribute(Constants.AT_DESC, nLocale).GetValue(false))
				p_output.EndParagraph()
					p_output.TableCell("", 25, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_WHITE, 0,  Constants.FMT_VTOP |  Constants.FMT_LEFT, 0)
				p_output.BeginParagraph( Constants.FMT_LEFT, 0.71, 0.71, 0, 0, 0)
			writeData4(p_output, p_aObjDef[i1].Attribute(Constants.AT_TIME_AVG_PRCS, nLocale).GetValue(false))
				p_output.EndParagraph()
					p_output.TableCell("", 25, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_WHITE, 0,  Constants.FMT_VTOP |  Constants.FMT_LEFT, 0)
				p_output.BeginParagraph( Constants.FMT_LEFT, 0.71, 0.71, 0, 0, 0)
			writeData5(p_output, p_aObjDef[i1].Attribute(Constants.AT_COST_AVG_TOT, nLocale).GetValue(false))
				p_output.EndParagraph()
			}

			p_output.EndTable("", 100, getString("ID_DEFAULT_FONT"), 10, Constants.C_BLACK, Constants.C_TRANSPARENT, 0, Constants.FMT_LEFT, 0)

			// dtable local functions:
			/**
			 * @param {Output} p_output The output object
			 * @param {Object } p_Object
			*/
			function writeData2(p_output, p_Object) {
								p_output.OutputLn(p_Object, getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_LEFT, 0.71)
			}
			/**
			 * @param {Output} p_output The output object
			 * @param {Object } p_Object
			*/
			function writeData3(p_output, p_Object) {
								p_output.OutputLn(p_Object, getString("ID_DEFAULT_FONT"), 11, RGB(153,153,153), Constants.C_TRANSPARENT,  Constants.FMT_LEFT, 0.71)
			}
			/**
			 * @param {Output} p_output The output object
			 * @param {Object } p_Object
			*/
			function writeData4(p_output, p_Object) {
								p_output.OutputLn(p_Object, getString("ID_DEFAULT_FONT"), 11, RGB(255,0,102), Constants.C_TRANSPARENT,  Constants.FMT_LEFT, 0.71)
			}
			/**
			 * @param {Output} p_output The output object
			 * @param {Object } p_Object
			*/
			function writeData5(p_output, p_Object) {
								p_output.OutputLn(p_Object, getString("ID_DEFAULT_FONT"), 11, Constants.C_BLACK, Constants.C_TRANSPARENT,  Constants.FMT_LEFT, 0.71)
			}
		}
		
	p_output.EndSection()


}


function RGB(r, g, b) {
	return (new java.awt.Color(r/255.0,g/255.0,b/255.0,1)).getRGB() & 0xFFFFFF
}
