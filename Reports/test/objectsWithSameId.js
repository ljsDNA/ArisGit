var oOutput = Context.createOutputObject();
var nLocale = Context.getSelectedLanguage();

var arrayOfObjects = [
  { ID: 1, name: 'Object 1' },
  { ID: 2, name: 'Object 2' },
  { ID: 1, name: 'Object 3' },
  { ID: 3, name: 'Object 4' },
  { ID: 2, name: 'Object 5' }
];

var result = findObjectsWithSameID(arrayOfObjects);


var stringg = "isti attr imaju" + result[0][0].ID + " i " + result[0][1].ID

oOutput.OutputTxt(stringg);
oOutput.WriteReport();

function findObjectsWithSameID(inputArray) {
  var idToObjectMap = {};

  for (var i = 0; i < inputArray.length; i++) {
    var currentObject = inputArray[i];
    var id = currentObject.ID;

    if (idToObjectMap[id] === undefined) {
      idToObjectMap[id] = [currentObject];
    } else {
      idToObjectMap[id].push(currentObject);
    }
  }

  var resultArray = [];

  for (var id in idToObjectMap) {
    if (idToObjectMap[id].length > 1) {
      resultArray.push(idToObjectMap[id]);
    }
  }

  return resultArray;
}


