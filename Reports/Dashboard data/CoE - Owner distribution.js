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
 * Object which performs the calculation for one QMS usecase
 */
var UseCaseOwnerDistribution = function() 
{
    var Counter = function(sOwner)
    {
        var m_sOwner = sOwner;
        var m_iModelCount = 0;
        var m_countByStatus = new java.util.HashMap();
        
        this.countModel = function(sStatus)
        {
            m_iModelCount++;
            
            var statusCount = m_countByStatus.get(sStatus);
            if(statusCount == null)
            {
                statusCount = new java.lang.Integer(0);
            }

            var statusCountNew = new java.lang.Integer(statusCount.intValue() + 1);
            m_countByStatus.put(sStatus, statusCountNew);
        }
        
        this.getOwner = function()
        {
            if(m_sOwner == "")
            {
                return getString("OWNER_NOT_SET.DBI");
            }
            return m_sOwner;
        }
        
        this.getModelCount = function()
        {
            return m_iModelCount;
        }
        
        this.getStatusCount = function(sStatus)
        {
            var statusCount = m_countByStatus.get(sStatus);
            return (statusCount == null) ? 0 : statusCount;            
        }
    }

    const ITEM_TYPES = "ItemTypes";
    const MODEL_OWNER_PROPERTY = "OwnerDistribution_OwnerProperty";
    const MODEL_STATUS_PROPERTY = "OwnerDistribution_StatusProperty";
    const NUMBER_OF_OWNERS = "OwnerDistribution_NumberOfOwners";

    const m_valueAccess = Context.getParameterValueAccess();

    const m_itemTypes = m_valueAccess.getParameterValue(ITEM_TYPES);
    const m_modelOwnerProperty = m_valueAccess.getParameterValue(MODEL_OWNER_PROPERTY);
    const m_modelStatusProperty = m_valueAccess.getParameterValue(MODEL_STATUS_PROPERTY);
    const m_numberOfOwnersForOutput = m_valueAccess.getParameterValue(NUMBER_OF_OWNERS);
    
    var m_modelCountByOwner = new java.util.HashMap();
    
    var m_usedModelStatusValues = getPropertyEnumerationValues(m_itemTypes, m_modelStatusProperty);
    
    /**
     * Returns properties which are required by this use case
     * sQuery - Name of the query ("chain" or "process") (JavaScript String)
     * return - Array of Strings (JavaScript String) with the property names
     */
    this.getPropertyTree = function(sQuery)
    {
        return ["name", m_modelOwnerProperty, m_modelStatusProperty];
    }
    
    /**
     * Performs calculation for one data node, called when the data tree is travesed.
     * For details see TreeGraph.traverse();
     *
     * The provide node has as item a result object of the data query
     */
    this.processNodeList = function(nodeList)
    {
        for(var itNodes = nodeList.iterator(); itNodes.hasNext();)
        {
            var node = itNodes.next();
            processNode(node);
        }
    }
    
    function processNode(node)
    {
        var item = node.getItem()
        item.loadAll(true);
        
        var sOwner = getStringValue(item, m_modelOwnerProperty);
        var sStatus = getStringValue(item, m_modelStatusProperty);
        
        countModel(sOwner, sStatus);
    }
    
    function countModel(sOwner, sStatus)
    {
        var counter = m_modelCountByOwner.get(sOwner);
        if(counter == null)
        {
            counter = new Counter(sOwner);
            m_modelCountByOwner.put(sOwner, counter);               
        }
        
        counter.countModel(sStatus);
    }
    
    function getStringValue(item, whichOne)
    {
        var value = item.getProperty(whichOne).getString();
        if(value == null) 
        {
            return "";
        }
        value = value.replaceAll("\r\n", " ");
        value = value.replaceAll("\r", " ");
        value = value.replaceAll("\n", " ");    
        
        return value;
    }

    /**
     * Called when the calculations are finished
     */    
    this.finish = function()
    {
        var countersOrdered = getCountersOrdered();
        
        const outputParameters = new OutputParameters("OwnerDistribution");
        const output = createXmlOutput(outputParameters);
        output.setColumns
        ([
            [getString("ORDER.DBI"), "text"],
            [getString("OWNER.DBI"),"text"],
            [getString("MODEL_COUNT.DBI"), "number"],
            [getString("STATUS.DBI"), "text"],
            [getString("STATUS_COUNT.DBI"), "number"],
        ]);

        var iOrder = m_numberOfOwnersForOutput;
        for(var i = 0; i < countersOrdered.length; i++)
        {
            if(i == m_numberOfOwnersForOutput)
            {
                break;
            }

            var sOrder = get2Digits(iOrder);
            if(iOrder > 0)
            {
                iOrder--;
            }
            
            var counter = countersOrdered[i];
            addCounterValues(output, sOrder, counter);
        }
        
        uploadXmlOutputToADS(output, outputParameters);
    }

    function get2Digits(n)
    {
        return (n > 9) ? "" + n : "0" + n;
    }
    
    function getCountersOrdered()
    {
        var countersOrdered = new Array()
        for(var itCounter = m_modelCountByOwner.values().iterator(); itCounter.hasNext();)
        {
            var counter = itCounter.next();
            countersOrdered.push(counter);
        }

        countersOrdered.sort(
            function(counter1, counter2)
            {
                return counter2.getModelCount() - counter1.getModelCount();
            });
            
        return countersOrdered;
    }
    
    function addCounterValues(output, sOrder, counter)
    {
        for(var itStatusValues = m_usedModelStatusValues.iterator(); itStatusValues.hasNext();)
        {
            var sStatusValue = itStatusValues.next();
            addCounterValue(output, sOrder, counter, sStatusValue, sStatusValue);
        }
        addCounterValue(output, sOrder, counter, getString("STATUS_NOT_SET.DBI"), "");
    }

    function addCounterValue(output, sOrder, counter, sStatusText, sStatusValue)
    {
        output.addRow([sOrder, counter.getOwner(), counter.getModelCount(), sStatusText, counter.getStatusCount(sStatusValue)]);
    }
}
