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

/**
 * TODO description
 * TODO usage
 * Note, api user is responsible for quoting
 * var xmlFormattedOut = new XMLFormattedOut();
 * xmlFormattedOut.addElement("idList").addElement("id", 1234567);
 * //xmlFormattedOut.setError(false, "unknown error");
 * xmlFormattedOut.setError(true);
 * xmlFormattedOut.write();
 */

 
 function XMLFormattedOut(name){
	this.ERROR = new Element("errorMessage", "");
	if(name != null){
        this.RESULT = new Element(name, "");
    }else{
        this.RESULT = new Element("result", "");
    }
    this.header = null;
	this.isOutDone = false;
//	this.appendError = true;
	this.elements = new Array();

	function Element(name, value) {
		this.elName = makeValid(name);
		this.elValue = makeValid(value);
		this.elAttributes = {};
		this.elements = new Array();

        function makeValid(arg) {
            if (arg == null || arg == undefined) {
                return "";
            }
            return org.apache.commons.lang3.StringEscapeUtils.escapeXml(arg.toString());
        }

		this.addElement = function(name, value) {
			var element = new Element(name, value);
			this.elements.push(element);
			return element;
		}
		this.addAttribute = function(name, value) {
			this.elAttributes[makeValid(name)] = makeValid(value);
		}
		this.name = function() {
			return this.elName;
		}
		this.value = function() {
			return this.elValue;
		}
		this.attributes = function() {
			return this.elAttributes;
		}
		this.subElements = function() {
			return this.elements;
		}
	}

	function writeElement(element) {
		function writeAttributes(attributes) {
			var result = "";
			for (attribute in attributes) {
				result += attribute + "=\"" + attributes[attribute] + "\" ";
			}
			return result.length == 0 ? result : " " + result;
		}
		function writeSubElements(elements) {
			var result = "";
			for (idx in elements) {
				result += writeElement(elements[idx]);
			}
			return result;
		}

//        if (!this.appendError && this.ERROR == element) {
//            return "";
//        }
		var result = "<" + element.name();
		result += writeAttributes(element.attributes());
		if (element.value() == "") {
			result += ">" + writeSubElements(element.subElements()) + "</" + element.name() + ">";
		} else {
			result += ">" + element.value() + "</" + element.name() + ">";
		}
		return result;
	}

	this.write = function() {
		if (!this.isOutDone) {
			this.RESULT.elements = this.elements;
			var outfile = Context.createOutputObject();
            if(this.header != null){
                outfile.OutputTxt(this.header);
            }
			outfile.OutputTxt(writeElement(this.RESULT));
			outfile.WriteReport();
			this.isOutDone = true;
		}
	}

	this.addElement = function(name, value) {
		var element = new Element(name, value == undefined ? "" : value);
		this.elements.push(element);
		return element;
	}
    
    
    this.setHeader = function(value) {
		this.header = value;
	}
    /* not tested yet
	this.addElementAttribute = function(name, attribute, value) {
		var newElement = null;
		for (element in this.elements) {
			if (this.elements[element].name() == name) {
				newElement = element;
				break;
			}
		}
		if (newElement == null) {
			newElement = new Element(name);
			this.elements.push(newElement);
		}
		newElement.addAttribute(attribute, value);
	} */

	this.setSuccess = function(result, message) {
        this.ERROR.addElement("success", result);
        if (!result) {
            this.ERROR.addElement("errorMessage", message);
        }
		this.elements.push(this.ERROR);
	}
//	this.appendError = function (append) {
//		this.append = new Boolean(append);
//	}
}
