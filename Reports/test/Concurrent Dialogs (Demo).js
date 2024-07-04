Dialogs.showDialog(new mainDialog(), Constants.DIALOG_TYPE_ACTION, "Main dialog");


/************************************************************/
    
    function mainDialog() {
        this.getPages = function() {
            var iDialogTemplate1 = Dialogs.createNewDialogTemplate(400, 500, "Page 1");
            iDialogTemplate1.PushButton(30, 10, 200, 15, "Browse Aris Items", "Btn_Browse_Aris_Items");
            iDialogTemplate1.TextBox(30, 30, 400, 15, "TXT_EDIT_1");
            iDialogTemplate1.TextBox(30, 50, 400, 80, "TXT_EDIT_2", 1);
            iDialogTemplate1.PushButton(30, 140, 200, 15, "Browse Files", "Btn_Browse_Files");
            iDialogTemplate1.TextBox(30, 160, 400, 15, "TXT_EDIT_3");
            iDialogTemplate1.TextBox(30, 180, 400, 80, "TXT_EDIT_4", 1);
            iDialogTemplate1.PushButton(30, 270, 200, 15, "Browse Folders", "Btn_Browse_Folders");
            iDialogTemplate1.TextBox(30, 290, 400, 15, "TXT_EDIT_5");
            iDialogTemplate1.TextBox(30, 310, 400, 80, "TXT_EDIT_6", 1);
            iDialogTemplate1.PushButton(30, 400, 200, 15, "Show Message Box 1", "Btn_Msg_Box1");
            iDialogTemplate1.PushButton(250, 400, 200, 15, "Show Message Box 2", "Btn_Msg_Box2");
            iDialogTemplate1.PushButton(30, 420, 200, 15, "Show Message Box 3", "Btn_Msg_Box3");
            iDialogTemplate1.PushButton(250, 420, 200, 15, "Show Message Box 4", "Btn_Msg_Box4");
            iDialogTemplate1.PushButton(30, 440, 200, 15, "Show Message Box 5", "Btn_Msg_Box5");
            iDialogTemplate1.PushButton(250, 440, 200, 15, "Show Message Box 6", "Btn_Msg_Box6");
            iDialogTemplate1.TextBox(30, 460, 400, 15, "TXT_EDIT_7");
            return [iDialogTemplate1];
        }
        
        this.init = function(aPages) { 
        }

        this.isInValidState = function(pageNumber) { return true; }
//        this.canFinish = function(pageNumber) { return true; }
//        this.canChangePage = function(pageNumber) { return true; }
//        this.onClose = function(pageNumber, bOk) { }


        //Subdialog Browse Aris Items
        this.Btn_Browse_Aris_Items_pressed = function() {
            var serverName = ArisData.getActiveDatabase().ServerName();
            var dbName     = ArisData.getActiveDatabase().Name(Context.getSelectedLanguage())
            this.dialog.setBrowseArisItems("BrowseArisItemsSbdlg", "Title", "Description", serverName, dbName, Constants.CID_MODEL, []);
        }
        
        this.BrowseArisItemsSbdlg_subDialogClosed = function(subResult, bOk) {
            var itemNames = "";
            var aOIDs = subResult.split(";");
            for (var i = 0; i < aOIDs.length; i++) {
                var item = ArisData.getActiveDatabase().FindOID(aOIDs[i]);
                Context.writeLog(item);
                
                if (item != null && item.IsValid()) {
                    itemNames += item.Name(Context.getSelectedLanguage()) + "\n";
                }
            }
            this.dialog.getPage(0).getDialogElement("TXT_EDIT_1").setText("subResult = " + subResult);
            this.dialog.getPage(0).getDialogElement("TXT_EDIT_2").setText(itemNames);
        }
        
        //Subdialog Browse Files        
        this.Btn_Browse_Files_pressed = function() {
            this.dialog.setBrowseFiles("BrowseFilesSbdlg", "MyFile.xls",
                                       "*.xls!!Chart Files (*.xlc)|*.xlc|Worksheet Files (*.xls)|*.xls|Data Files (*.xlc;*.xls)|*.xlc; *.xls|All Files (*.*)|*.*||",
                                       "", "Select all files to be openend", 8/*Allow multiple selection*/)
        }
        
        this.BrowseFilesSbdlg_subDialogClosed = function(subResult, bOk) {
            var fileNames = "";
            for (var i = 0; i < subResult.length; i++) {
                fileNames += subResult[i].getName() + "\n";
            }            
            this.dialog.getPage(0).getDialogElement("TXT_EDIT_3").setText("subResult = " + subResult);
            this.dialog.getPage(0).getDialogElement("TXT_EDIT_4").setText(fileNames);
        }
        
        //Subdialog Browse Folders        
         this.Btn_Browse_Folders_pressed = function() {
            this.dialog.setBrowseFolders("BrowseFoldersSbdlg", "Select all files to be openend", "", 1);
        }
        
        this.BrowseFoldersSbdlg_subDialogClosed = function(subResult, bOk) {
            var fileNames = "";
            for (var i = 0; i < subResult.length; i++) {
                fileNames += subResult[i].getName() + "\n";
            }
            this.dialog.getPage(0).getDialogElement("TXT_EDIT_5").setText("subResult = " + subResult);
            this.dialog.getPage(0).getDialogElement("TXT_EDIT_6").setText(fileNames);
        }
        
        //Subdialog Message Box
        
        this.Msg_Box1_subDialogClosed = function(subResult, bOk) {
            subDlg_result = subResult;
            this.dialog.getPage(0).getDialogElement("TXT_EDIT_7").setText("subResult = " + subResult);
        }
        this.Msg_Box2_subDialogClosed = function(subResult, bOk) {
            subDlg_result = subResult;
            this.dialog.getPage(0).getDialogElement("TXT_EDIT_7").setText("subResult = " + subResult);
        }
        this.Msg_Box3_subDialogClosed = function(subResult, bOk) {
            subDlg_result = subResult;
            this.dialog.getPage(0).getDialogElement("TXT_EDIT_7").setText("subResult = " + subResult);
        }
        this.Msg_Box4_subDialogClosed = function(subResult, bOk) {
            subDlg_result = subResult;
            this.dialog.getPage(0).getDialogElement("TXT_EDIT_7").setText("subResult = " + subResult);
        }
        this.Msg_Box5_subDialogClosed = function(subResult, bOk) {
            subDlg_result = subResult;
            this.dialog.getPage(0).getDialogElement("TXT_EDIT_7").setText("subResult = " + subResult);
        }
        this.Msg_Box6_subDialogClosed = function(subResult, bOk) {
            subDlg_result = subResult;
            this.dialog.getPage(0).getDialogElement("TXT_EDIT_7").setText("subResult = " + subResult);
        }
        /*
        MSGBOX_RESULT_OK (1) : OK pressed 
        MSGBOX_RESULT_CANCEL (2) : Cancel pressed 
        MSGBOX_RESULT_ABORT (3) : Cancel (from Cancel, Retry, Ignore) pressed 
        MSGBOX_RESULT_RETRY (4) : Retry pressed 
        MSGBOX_RESULT_IGNORE (5) : Ignore pressed 
        MSGBOX_RESULT_YES (6) : Yes pressed 
            MSGBOX_RESULT_NO (7) : No pressed
            */
        this.Btn_Msg_Box1_pressed = function() {
            this.dialog.setMsgBox("Msg_Box1", "My message 1", Constants.MSGBOX_BTN_ABORTRETRYIGNORE, "Dialog Title");
        }
        this.Btn_Msg_Box2_pressed = function() {
            this.dialog.setMsgBox("Msg_Box2", "My message 2", Constants.MSGBOX_BTN_OK, "Dialog Title");
        }
        this.Btn_Msg_Box3_pressed = function() {
            this.dialog.setMsgBox("Msg_Box3", "My message 3", Constants.MSGBOX_BTN_OKCANCEL, "Dialog Title");
        }
        this.Btn_Msg_Box4_pressed = function() {
            this.dialog.setMsgBox("Msg_Box4", "My message 4", Constants.MSGBOX_BTN_RETRYCANCEL, "Dialog Title");
        }
        this.Btn_Msg_Box5_pressed = function() {
            this.dialog.setMsgBox("Msg_Box5", "My message 5", Constants.MSGBOX_BTN_YESNO, "Dialog Title");
        }
        this.Btn_Msg_Box6_pressed = function() {
            this.dialog.setMsgBox("Msg_Box6", "My message 6", Constants.MSGBOX_BTN_YESNOCANCEL, "Dialog Title");
        }
        
        this.getResult = function() {
            var a = this.dialog.getPage(0).getDialogElement("TXT_EDIT_1").getText();
            var b = this.dialog.getPage(0).getDialogElement("TXT_EDIT_3").getText();
            var c = this.dialog.getPage(0).getDialogElement("TXT_EDIT_5").getText();
            var d = this.dialog.getPage(0).getDialogElement("TXT_EDIT_7").getText();
            return a +"\n" + b +"\n" +c +"\n" +d;
        }
    }
