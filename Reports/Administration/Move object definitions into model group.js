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


//method filter we are working with
var g_omethodfilter = ArisData.getActiveDatabase().ActiveFilter();
var g_nloc          = Context.getSelectedLanguage();

//initial type numbers for objects, which go to the predefined folder
var ot_predef_numbers = g_omethodfilter.GetTypes(Constants.CID_OBJDEF);
var ot_predef_names=[];

//object type numbers allowed by method (filters, etc)
var ot_allowed_numbers = g_omethodfilter.GetTypes(Constants.CID_OBJDEF);
var ot_allowed_names =[]; //will be initialized later

//model type numbers allowed by method (filters, etc)
var mt_allowed_numbers = g_omethodfilter.GetTypes(Constants.CID_MODEL);
var mt_allowed_names =[]; //will be initialized later

//user preferences passed from the used dialog to the rest of the script
var mt_pref_numbers =[]; //array of model type arrays - one mt array for each obj type
var ot_pref_numbers =[];  //array of obj types which are moved to models
var mt_pref_names =[];
var ot_pref_names =[];

//names for model type listbox and their numbers
var mt_lb_names=[];
var mt_lb_numbers=[];

//group for predefined objects
var initFolder="";
//if user pressed Cancel button
var CancelIsPressed=false;
//if user wants to change the predefined group
var bShowGroupSelectionDialog=false;
//Selected group OID for predefined folder
var FID = (ArisData.getSelectedGroups()[0]).ObjectID();
//if we should inform user that some object moves are non-successful
//because of right violations
var bShowEndMsg=false;

//is search&move recursive?
var bRecurs=false;

//Move objects without occurrences to the selected target group (BLUE-27498)
var bMoveObjWithoutOcc=false;

//initialize arrays for object type names allowed by method 
//and objects to move to the predefined group
for (i=0;i<ot_allowed_numbers.length;i++)
{
  human_name = getHumanName(Constants.CID_OBJDEF, ot_allowed_numbers[i]); // BLUE-5324
  ot_predef_names.push(human_name);
  ot_allowed_names.push(human_name);
}    

//initialize arrays for model type names allowed by method 
for (i=0;i<mt_allowed_numbers.length;i++)
{
  human_name = getHumanName(Constants.CID_MODEL, mt_allowed_numbers[i]); // BLUE-5324
  mt_allowed_names.push(human_name);
}  

//sort alphabetically objects to move to the predefined group
ot_predef_names.sort(SortByJSstring);
//and find their numbers
ot_predef_numbers=CorrelateNumbersToNames(ot_predef_names, Constants.CID_OBJDEF);

main();

/*
The main function
Contains calling user dialogs and moving objects according user input
No parameters
*/

function main()
{
    if (!g_omethodfilter.IsFullMethod()){
        dResult = Dialogs.MsgBox(getString("INFO_1"), 
        Constants.MSGBOX_BTN_YESNO+Constants.MSGBOX_ICON_QUESTION, getString("SCRIPT_NAME"));
        if (dResult==Constants.MSGBOX_RESULT_NO){
           Context.setScriptError(Constants.ERR_CANCEL);
           return;
        }       
    }
    nDialogResult=ShowMoveOptionsDialog(); 
    if(CancelIsPressed == true){
        Context.setScriptError(Constants.ERR_CANCEL);
        return;
    } 
    //ANUBIS entry 331692
    dResult = Dialogs.MsgBox(getString("INFO_4"), Constants.MSGBOX_BTN_OKCANCEL+Constants.MSGBOX_ICON_INFORMATION, getString("SCRIPT_NAME"));
    if (dResult==Constants.MSGBOX_RESULT_CANCEL){
        Context.setScriptError(Constants.ERR_CANCEL);
        return;
    }       
    
 //move objects 
   var sg = ArisData.getSelectedGroups()[0];
   MoveObjects(sg,bRecurs);
   if    (bShowEndMsg)
   {
       //inform the user if some objects were not moved due to right violations and/or method filer violations
       Dialogs.MsgBox(getString("INFO_2"),
       Constants.MSGBOX_BTN_OK+Constants.MSGBOX_ICON_INFORMATION, 
       getString("SCRIPT_NAME"));
   }
   else
   {
       //inform the user if all objects were moved 
       Dialogs.MsgBox(getString("INFO_3"),
       Constants.MSGBOX_BTN_OK+Constants.MSGBOX_ICON_INFORMATION, 
       getString("SCRIPT_NAME"));      
   }
}   


function ShowMoveOptionsDialog()    
{    
//main dialog for setting options for move objects   

var MoveOptionsDialog = Dialogs.createNewDialogTemplate(785, 350, getString("SELECT_RULES"), "ProcessMoveOptionsDlgEvents");
  //MoveOptionsDialog.GroupBox(0, 0, 780, 308, "Options for moving object definitions", "opt_gb");
  MoveOptionsDialog.GroupBox(5, 5, 780, 55, getString("GROUP"), "groups_gb");
      MoveOptionsDialog.Text(20, 20, 550, 14, getString("PREDEF_GROUP_COMMENT"), "Text3");
      MoveOptionsDialog.TextBox(20, 35, 700, 14, "pre_def_group_tb");
      MoveOptionsDialog.PushButton(745, 33, 30, 16, "...", "predef_grp_btn");
  MoveOptionsDialog.GroupBox(5, 60, 780, 290, getString("OBJECT"), "obg_gb");
      MoveOptionsDialog.Text(15, 75, 720, 14, getString("MOD_PRTY_COMMENT"), "mod_prty_comment");
      MoveOptionsDialog.Text(15, 95, 233, 36, getString("OBJ_TO_PREDEF_GRP"), "ot_to_predef_grp_comment");
      MoveOptionsDialog.Text(295, 95, 233, 36, getString("OBJ_TO_MOVE_TO_MODEL"), "ot_comment");
      MoveOptionsDialog.Text(545, 95, 233, 36, getString("MODEL_PRTY"), "predef_grp_comment");
      MoveOptionsDialog.ListBox(15, 131, 233, 170, [], "predef_ot_lb");//ot_predef_names ANUBIS entry 331692
      MoveOptionsDialog.ListBox(295, 131, 233, 170, [], "ot_lb");//ANUBIS entry 331692
      MoveOptionsDialog.ListBox(545, 131, 233, 170, [], "mt_lb");//ANUBIS entry 331692
      MoveOptionsDialog.PushButton(253, 191, 35, 16, ">", "add_ot_btn");
      MoveOptionsDialog.PushButton(253, 211, 35, 16, "<", "del_ot_btn");
      MoveOptionsDialog.PushButton(622, 305, 35, 16, "/\\", "up_btn");
      MoveOptionsDialog.PushButton(660, 305, 35, 16, "\\/", "down_btn");
      MoveOptionsDialog.CheckBox(295, 305, 15, 15, "", "obj_wo_occ_cb");
      MoveOptionsDialog.Text(319, 309, 210, 40, getString("OBJ_WITHOUT_OCC"));      
      MoveOptionsDialog.CheckBox(5, 355, 240, 15, getString("SUBGROUP_COMMENT"), "subgroups_cb");
  MoveOptionsDialog.OKButton();
  MoveOptionsDialog.CancelButton();
//  MoveOptionsDialog.HelpButton("HID_d10e4b80_8bc7_11dc_54ef_0014c2e1019c_dlg_01.hlp");  
  
  var dMoveOptionsDialog = Dialogs.createUserDialog(MoveOptionsDialog); 
  CurrDlg = dMoveOptionsDialog;
  
  //disable up/down buttons - there is nothing to move with them 
  //before the dialog is displayed at least once
  
  CurrDlg.setDlgEnable("up_btn", false);
  CurrDlg.setDlgEnable("down_btn", false);
  CurrDlg.setDlgEnable("del_ot_btn",false); 
  CurrDlg.setDlgEnable("pre_def_group_tb",false);   
  
  //the main group of the database is an initial value for a pre-defined group
//  rootname=ArisData.getActiveDatabase().RootGroup().Attribute(Constants.AT_NAME, g_nloc).getValue();
 initFolder = (ArisData.getActiveDatabase().FindOID(FID)).Name(g_nloc);

  //reorgLB ANUBIS entry 331692
  reorgLB(CurrDlg, initFolder);
  
  //loop until the user decides that all options are set
  //and switch between the main dialog and group selection dialog
    for(;;)
  {
    bShowGroupSelectionDialog = false;
    nMoveOptionsDialog = Dialogs.show(CurrDlg);
    // Displays dialog and waits for the confirmation with OK.
    if (nMoveOptionsDialog == 0) {
      return nMoveOptionsDialog;
    }
    //if the user decides to change the pre-defined group
    //he will get the group selection dialog

    if(bShowGroupSelectionDialog) {
        FID1=FID;
        //OID of a group selected by user
        FID = Dialogs.BrowseArisItems (getString("SCRIPT_NAME"),
        getString("SELECT_PREDEF_GROUP"),
        ArisData.getActiveDatabase().ServerName(),
        ArisData.getActiveDatabase().Name(g_nloc),
        Constants.CID_GROUP);
        //user pressed Cancel in the BrowseArisItems dialog
        // - so we restore the previous OID
        if (FID=="") FID=FID1; 
        //predefined group to place objects
        initFolder = (ArisData.getActiveDatabase().FindOID(FID)).Name(g_nloc);     
      continue;
    }
     break;
  }
return  nMoveOptionsDialog;
}
  
//function for processing the main dialog events
function ProcessMoveOptionsDlgEvents(dlgitem, action, suppvalue)
{ 

     switch(action) {
    case 1:
      //after folder selection or during the first displaying of the dialog
      CurrDlg.setDlgText("pre_def_group_tb",initFolder); 
      break;
      return false;
    case 2:
      switch(dlgitem) {
        //object types listbox   
        case "subgroups_cb":
              bRecurs=(CurrDlg.getDlgValue(dlgitem)==1);
              return false;
        case "obj_wo_occ_cb":   // BLUE-27498
              bMoveObjWithoutOcc=(CurrDlg.getDlgValue(dlgitem)==1);
              return false;
        case "ot_lb":
               ind = CurrDlg.getDlgValue("ot_lb");
               //set a list of model names correspondent to selected object type name
               CurrDlg.setDlgListBoxArray("mt_lb", mt_pref_names[ind]);
               //select 1st line in the model types listbox
               if (mt_lb_names.length>0) CurrDlg.setDlgValue("mt_lb",0);
               //and enable/disable up/down buttons 
               //according to number of model listbox strings
               SetModelDialogButtons();
               return true;
               break;
        case "OK":
               return false;
               break;
        case "Cancel":
               CancelIsPressed=true;
               return false;
               break;
        case "predef_grp_btn":
           //open a groupselectiondialog 
           bShowGroupSelectionDialog=true;            
           return false;
           break;             
        case "up_btn":
            //selected object and model name
            o_mt=CurrDlg.getDlgValue("ot_lb");
            n_mt=CurrDlg.getDlgValue("mt_lb");
            mt_lb_names = CurrDlg.getDlgListBoxArray("mt_lb");
            if (n_mt>0)
            {
              //move a model name up in the model list
               mt_lb_names1 = MoveItemUpDown(mt_lb_names, n_mt, true);
               //refill the model listbox and change selection 
               CurrDlg.setDlgListBoxArray("mt_lb", mt_lb_names1);
               CurrDlg.setDlgValue("mt_lb",n_mt-1);
               //renew arrays of model order preference according to current listbox data
               mt_pref_names[o_mt]=mt_lb_names1;
               mt_pref_numbers[o_mt]=CorrelateNumbersToNames(mt_lb_names,Constants.CID_MODEL);
             }
             SetModelDialogButtons();
             return true;
             break;
        case "down_btn":
            //selected object and model name
            o_mt=CurrDlg.getDlgValue("ot_lb");
            n_mt=CurrDlg.getDlgValue("mt_lb");
            mt_lb_names = CurrDlg.getDlgListBoxArray("mt_lb");
            if (n_mt<mt_lb_names.length-1)
            {
                //move a model name down in the model list
                mt_lb_names1 = MoveItemUpDown(mt_lb_names, n_mt, false);
               //refill the model listbox and change selection 
                CurrDlg.setDlgListBoxArray("mt_lb", mt_lb_names1);
                CurrDlg.setDlgValue("mt_lb",n_mt+1);
               //renew arrays of model order preference according to current listbox data
                mt_pref_names[o_mt]=mt_lb_names1;
                mt_pref_numbers[o_mt]=CorrelateNumbersToNames(mt_lb_names,Constants.CID_MODEL);
             }   
             SetModelDialogButtons();
           return true;
           break;
        case "add_ot_btn":
              //current data in both object listboxes
              var n_ot= CurrDlg.getDlgValue("predef_ot_lb");
              if (n_ot < 0) n_ot = 0;                   // BLUE-5310 - Set selection in the left list box (= list box with objects to be moved to the selected target group)              
              ot_predef_names=CurrDlg.getDlgListBoxArray("predef_ot_lb"); 
              ot_pref_names=CurrDlg.getDlgListBoxArray("ot_lb");
              //add selected obj name from the predefined list of object types
              //to the list of object types to be moved
              new_name=ot_predef_names[n_ot];
              ot_pref_names.push(new_name);
              //and delete it from the predefined list of object types  
              ot_predef_names.splice(n_ot,1);
              //sort both lists alphabetically
              ot_pref_names.sort(SortByJSstring);       
              ot_predef_names.sort(SortByJSstring);  
              //renew listboxes and selections
              CurrDlg.setDlgListBoxArray("ot_lb", ot_pref_names);
              CurrDlg.setDlgListBoxArray("predef_ot_lb", ot_predef_names);
              CurrDlg.setDlgValue("predef_ot_lb", Math.min(n_ot,ot_predef_names.length-1));
              ot_pref_numbers=CorrelateNumbersToNames(ot_pref_names, Constants.CID_OBJDEF);
              ot_predef_numbers=CorrelateNumbersToNames(ot_predef_names, Constants.CID_OBJDEF);
             //renew model type preference arrays             
              ot_num=FindElementInArray(ot_pref_names, new_name);
              CurrDlg.setDlgValue("ot_lb", Math.max(0,ot_num));
             // setiings for model lisbox and lists of model number priorities
              if (ot_num>=0)  
              {     
                  mt_lb_names = SetStringsForModelListbox(ot_pref_numbers[ot_num]);
                  CurrDlg.setDlgListBoxArray("mt_lb", mt_lb_names);
                  CurrDlg.setDlgValue("mt_lb",0);
                  SetModelDialogButtons();
                  if (mt_lb_names.length>=0)
                  {
                      mt_lb_numbers = CorrelateNumbersToNames(mt_lb_names,Constants.CID_MODEL);
                      mt_pref_numbers.splice(ot_num,0,mt_lb_numbers);
                      mt_pref_names.splice(ot_num,0,mt_lb_names);
                  }     
                }
            //enable/disable buttons    
            CurrDlg.setDlgEnable("del_ot_btn",true);    
            if (ot_predef_numbers.length<=0) CurrDlg.setDlgEnable("add_ot_btn",false);  
            return true;
            break;
        case "del_ot_btn":
              //current data in both object listboxes
              ot_predef_names=CurrDlg.getDlgListBoxArray("predef_ot_lb"); 
              ot_pref_names=CurrDlg.getDlgListBoxArray("ot_lb");
                var n_ot1= CurrDlg.getDlgValue("ot_lb");
              //insert selected obj type to the list of predefined object types 
              new_name=ot_pref_names[n_ot1];
              ot_predef_names.push(new_name);
              //and delete it from the  list of object types to be moved to models
              ot_pref_names.splice(n_ot1,1);
              //and delete this from model type lists, too
              mt_pref_names.splice(n_ot1,1);
              mt_pref_numbers.splice(n_ot1,1);
              //sort both lists alphabetically
              //ot_pref_names.sort(SortByJSstring);       
              ot_predef_names.sort(SortByJSstring);  
              //renew listboxes and selections
              CurrDlg.setDlgListBoxArray("ot_lb", ot_pref_names);
              CurrDlg.setDlgListBoxArray("predef_ot_lb", ot_predef_names);
              CurrDlg.setDlgSelection("predef_ot_lb", 0);                   // BLUE-5310 - Set selection in the left list box (= list box with objects to be moved to the selected target group)
              newnum=Math.min(n_ot1,ot_pref_names.length-1)
              CurrDlg.setDlgValue("ot_lb", newnum);
              ot_pref_numbers=CorrelateNumbersToNames(ot_pref_names, Constants.CID_OBJDEF);
              ot_predef_numbers=CorrelateNumbersToNames(ot_predef_names, Constants.CID_OBJDEF);
                //renew model listbox and buttons
              if (ot_pref_numbers.length>0)
              {
               ind = CurrDlg.getDlgValue("ot_lb");
               //set a list of model names correspondent to selected object type name
               //bug fixed here - N.E.
               CurrDlg.setDlgListBoxArray("mt_lb", mt_pref_names[ind]);
              }
              else
              {
                CurrDlg.setDlgListBoxArray("mt_lb",[]);
                CurrDlg.setDlgEnable("del_ot_btn",false);   
              }   
              CurrDlg.setDlgEnable("add_ot_btn",true);
            //renew model type preference arrays 
              SetModelDialogButtons();
            return true;
            break;
        case "mt_lb":
          SetModelDialogButtons();
          return false;
        break;
      }
    break;
  }
return false;
}

/*
  Function for make buttons under model listbox enabled or disabled
  accordig to which string is selected and how many strings is available  
  No parameters
*/
function SetModelDialogButtons()
{
    if (CurrDlg.getDlgListBoxArray("mt_lb").length>1)
  {
    CurrDlg.setDlgEnable("up_btn", true);
    CurrDlg.setDlgEnable("down_btn", true);
    if (CurrDlg.getDlgValue("mt_lb")==0) CurrDlg.setDlgEnable("up_btn", false);
    if (CurrDlg.getDlgValue("mt_lb")==CurrDlg.getDlgListBoxArray("mt_lb").length-1)
        CurrDlg.setDlgEnable("down_btn", false);   
   }
   else
   {
    CurrDlg.setDlgEnable("up_btn", false);
    CurrDlg.setDlgEnable("down_btn", false);
   }   
}

/*
  Function for finding an element in array of strings  
  Parameters:
  array_to_search - string array where the string should be found
  string_to_find - string which should be found
  result is the index of the string, or -1, if the string is not found
*/
function FindElementInArray(array_to_search, string_to_find)
{
    var j=-1;  
     for (j=0;j<array_to_search.length;j++)
    {
      if (string_to_find.equals(""+array_to_search[j])) break;
    }     
    return j;    
}    

/*
  Function for finding an element in array of numbers  
  Parameters:
  numarray -  array where the number should be found
  numvalue - number which should be found
  result is the index of the number, or -1, if the string is not found
*/
function FindNumInArray(numarray, numvalue)
{
    for (j=0;j<numarray.length;j++)
    {
      if (numarray[j]==numvalue) {return j; break;}    
    }     
    return -1;
}


/*
  Function which moves an element of a string array of a "pos" position up or down 
  Parameters:
  st_array - string array where the string should be moved
  pos - string index in the array
  is_up = true - string should be moved up, is_up = false - string should be moved down
  result is the new version of the same array
*/
function MoveItemUpDown(st_array, pos, is_up)
{
    if ((pos<0) || (pos>st_array.length-1)) return st_array;
    curr_element=st_array[pos];
    st_array.splice(pos,1);
    st_array.splice(pos+(is_up?-1:1),0,curr_element);
    return st_array;
} 


/*
  Function which finds an object or model type number 
  Parameters:
  TypeName - the name of the object type
  ItemTypeCID - ARIS constant for the object kind
  result is the type number (or -1, if there is no type number for this TypeName)
*/
function GetItemTypeNumber(TypeName, ItemTypeCID)
{ 
    numbers=g_omethodfilter.GetTypes(ItemTypeCID);  
    var j=-1;  
     for (j=0;j<numbers.length;j++)
    {
      human_name = getHumanName(ItemTypeCID, numbers[j]);   // BLUE-5324
      if (human_name.equals(TypeName)) break;
    }     
    return numbers[j];
}       

/*
  Function which finds which model types can contain occurences of specified object type 
  Parameters:
  ot_num -  object type number
  result is an  array of model names where occurences of a specified object type 
  are allowed by method filter 
*/
function SetStringsForModelListbox(ot_num)
{
    var mt_names = [];
    var sym_array=[];
    //allowed model types
    for (i=0;i<mt_allowed_numbers.length;i++)
    {
      //check if the selected object type in the first listbox allowed in the model type  
     sym_array = g_omethodfilter.Symbols(mt_allowed_numbers[i],ot_num); 
     //if some symbols of this obj type allowed in this model type  
     if (sym_array.length >0)  
      { 
        human_name = getHumanName(Constants.CID_MODEL, mt_allowed_numbers[i]) // BLUE-5324
        mt_names.push(human_name);
       } 
    }
return mt_names;    
}


/*
  Function which creates an array of object/model type numbers
  by a corresponding array of object/model type names
   Parameters:
  names -  object type names
  ItemTypeCID - ARIS constant for the object kind
  result is an  array of of object/model type numbers 
*/
function CorrelateNumbersToNames(names, ItemTypeCID)
{
   var numbers=[]; 
   for (i=0;i<names.length;i++){
   numbers[i]=GetItemTypeNumber(names[i], ItemTypeCID); }
   return numbers;
}


/*
  Function which compares strings case-independently
   Parameters:
  a,b - strings to compare
*/
function SortByJSstring(a,b)
{
  var stringA = new java.lang.String(a);
  var stringB = new java.lang.String(b);  
  return stringA.toLowerCase().compareTo(stringB.toLowerCase());
}

/*
  Function which moves objects to predefined folder or to folder
  where the model is found which contains an occurence of this object
  according to preferences selected by user
   Parameters:
  curr_group -  group selected by user
  bRecurs - true, if the search for objects is recursive
*/
function MoveObjects(curr_group, bRecurs)
{
    //move objects
    //objects to move to predefined group 
    predef_group=ArisData.getActiveDatabase().FindOID(FID);
    if (ot_predef_numbers.length>0)
    {
        var o_predef = curr_group.ObjDefList(bRecurs, ot_predef_numbers);
        for (i=0;i<o_predef.length;i++)
        { //move objects to predefined group   
            oObj=o_predef[i];
            if (!(oObj.Group()==predef_group))  bIsMoved = oObj.ChangeGroup(predef_group);
            if (!bIsMoved) bShowEndMsg=true;
        }
    }
    //objects to move to models
    if (ot_pref_numbers.length>0)
    {    
       //objects to move to models
        var o_pref = curr_group.ObjDefList(bRecurs, ot_pref_numbers);
        if (o_pref.length>=0) 
        {
            for (i=0;i<o_pref.length;i++)
            {   //move objects to preferred group
                oObj=o_pref[i];
                bIsMoved=false;
                //current object type
                oObjTypeNum=oObj.TypeNum();
                //where is this object type in the list of moved object types?
                //(as we need to find a corresponding model type list)
                ObjTypePos=FindNumInArray(ot_pref_numbers, oObjTypeNum);
                //find object occurences
                oOccList=oObj.OccList();
                
                if (oOccList.length == 0 && !bMoveObjWithoutOcc) {
                    // BLUE-27498 - Don't move to target group
                    continue;  
                }
                
               //iterate through model type list for the object type
                for (j=0;j<mt_pref_numbers[ObjTypePos].length;j++)
                {   
                    mt_numbers=mt_pref_numbers[ObjTypePos];
                    //iterate through object occurences
                    for (k=0;k<oOccList.length;k++)
                    {
                      //a model for a current occurence
                       oMdl=oOccList[k].Model();  
                       if (oMdl.TypeNum()==mt_numbers[j]) 
                       {
                           //we have found an occurence for the model type  
                           //  - and this is the topmost model type
                           gr_to_move=oMdl.Group();
                           //move to the appropriate group
                           bIsMoved=oObj.ChangeGroup(gr_to_move);
                           //and do not continue searching occurences anymore
                           //bIsMoved=true;
                           if (bIsMoved) break;
                       }
                       if (bIsMoved) break;
                    }
                     if (bIsMoved) break;
                }
                if (!bIsMoved) bIsMoved=oObj.ChangeGroup(predef_group);
                if (!bIsMoved) bShowEndMsg=true;
            }
        }
    }
}

//ANUBIS entry 331692
function reorgLB(pCurrDlg, pInitFolder){
    ot_pref_names = ArrCopy(ot_predef_names);
    ot_pref_numbers = ArrCopy(ot_predef_numbers);
    ot_predef_names = [];
    ot_predef_numbers = [];

    CurrDlg.setDlgListBoxArray("ot_lb", ot_pref_names);
    CurrDlg.setDlgValue("ot_lb", 0);
    SetModelDialogButtons();
    for(var num=0; num <ot_pref_names.length; num++){
        mt_lb_names = SetStringsForModelListbox(ot_pref_numbers[num]);
        //CurrDlg.setDlgListBoxArray("mt_lb", mt_lb_names);
        //CurrDlg.setDlgValue("mt_lb",num);
        SetModelDialogButtons();
        if (mt_lb_names.length>=0){
          mt_lb_numbers = CorrelateNumbersToNames(mt_lb_names,Constants.CID_MODEL);
          mt_pref_numbers.splice(num,0,mt_lb_numbers);
          mt_pref_names.splice(num,0,mt_lb_names);
        }
    }
        mt_lb_names = SetStringsForModelListbox(ot_pref_numbers[0]);
        CurrDlg.setDlgListBoxArray("mt_lb", mt_lb_names);
        CurrDlg.setDlgValue("mt_lb",num);
    
        //enable/disable buttons    
        CurrDlg.setDlgEnable("del_ot_btn",true);    
        if (ot_predef_numbers.length<=0) CurrDlg.setDlgEnable("add_ot_btn",false);  
}//End reorgLB

function ArrCopy(inArr){
    var resArr = new Array();
    for(var i=0; i<inArr.length; i++){
        resArr.push(inArr[i]);
    }
return resArr;
}// End of ANUBIS entry 331692

function getHumanName(nKindNum, nTypeNum) {
    //BLUE-5324 Unique name: Type name + type number
    var sTypeName = "" + g_omethodfilter.ItemTypeName(nKindNum, nTypeNum);
    return formatstring2("@1 (@2)", sTypeName, nTypeNum);
}