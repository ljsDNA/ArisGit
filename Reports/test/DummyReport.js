function main() {           
   
   var outputFile = Context.createOutputObject(Constants.OutputDOCX, "html.docx");   
   
   var CDescription = "<p><strong>You shall be able to:</strong></p>\n<p>Explain malaria signs and symptoms.<br>Describe ways of transmission<br>Describe health risks related to malaria.<br>Describe geographic malaria risk areas.<br>Explain about primary prevention.<br>Explain medical / chemical prevention, benefits and risks.<br>Describe actions to be taken if malaria is confirmed or suspected.</p>\n<p><strong>Why:</strong><br>To apply knowledge of preventative measure related to Malaria to be able to carry out the correct actions if malaria symptoms occurs</p>\n<p><strong>Reference:</strong><br>ARIS SF305-1 and SF306.</p>";
   outputFile.OutputFormattedText(CDescription, false);
   
   var RatingElementDescription = "<p style=\"color: rgb(51, 51, 51); font-family: &quot;Helvetica Neue&quot;, Helvetica, Arial, sans-serif; font-size: 14px;\">Bemyndiget person elektro er utpekt av stedlig representant elektro for å ivareta rollen som bemyndiget iht R-13162 Instruks bemyndiget person elektro - SOKKEL i OM105.12.01.03</p><ul><li>Godkjenn og utpek Bemyndiget person gjøres av Ansvarshavende elektro eller anleggets Stedlig elektrorepresentant.</li><li>Stedlig elektrorepresentant gir kandidat status «Bemyndiget» i Sikkerhetskortet.</li><li>Ansvarlig leder oppdatere status i CAMS etter samhandling med Ansvarshavende/Stedlig elektrorepresentant.</li></ul>";
   
   
   outputFile.BeginTable(100,Constants.C_BLACK,Constants.C_WHITE,Constants.FMT_LEFT | Constants.FMT_ITALIC,0);
   
   outputFile.TableRow();
   outputFile.TableCell("The competence is documented by the following element(s):" ,80,"Arial",10,Constants.C_BLACK,Constants.C_WHITE,0,Constants.FMT_BOLD,0);
   outputFile.TableCell("Proficiency:" ,20,"Arial",10,Constants.C_BLACK,Constants.C_WHITE,0,Constants.FMT_BOLD | Constants.FMT_CENTER,0);
   
   outputFile.TableRow();
   outputFile.TableCell("" ,80,"Arial",10,Constants.C_BLACK,Constants.C_WHITE,0,Constants.FMT_LEFT,0);
   outputFile.OutputFormattedText(RatingElementDescription, false);
   outputFile.TableCell("Basic" ,20,"Arial",10,Constants.C_BLACK,Constants.C_WHITE,0,Constants.FMT_CENTER |Constants.FMT_VCENTER,0);
   
   outputFile.TableRow();
   outputFile.TableCell("" ,80,"Arial",10,Constants.C_BLACK,Constants.C_WHITE,0,Constants.FMT_LEFT,0);
   outputFile.OutputFormattedText(RatingElementDescription, false);
   outputFile.TableCell("Basic" ,20,"Arial",10,Constants.C_BLACK,Constants.C_WHITE,0,Constants.FMT_CENTER |Constants.FMT_VCENTER,0);
   
   outputFile.EndTable("",100, "Arial",10,Constants.C_BLACK,Constants.C_BLACK,0,Constants.FMT_LEFT | Constants.FMT_ITALIC,0);
   
   outputFile.WriteReport();
   
   var dummy = Context.getProperty("abcd");
   
   var dummm = 0;
}

main(); 