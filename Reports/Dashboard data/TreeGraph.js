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
 * Directed tree-like graph.
 *
 * Basically this graph has a structure similar to a tree, i.e. it has root nodes and each node can have child nodes.
 * Also like a tree it does not have cycles in its structure, which means that a node 'X' which is part of the parent
 * hierarchy of a node 'Y' cannot be part of the sub node hierarchy of 'Y'.
 *
 * The difference to a tree is the fact that a node in this tree graph can have more than one parent node.
 *
 * Example for such a tree graph with two root nodes A and B:
 *
 *        A     B
 *      /  \  /  \
 *     C    D      E
 *   /  \   |    /
 *  F    G  H  /
 *     /  \  /
 *    I    J
 *
 * (C) Copyright Software AG
 */
var TreeGraph = function() {
    var m_nodes = new java.util.HashMap();
    
    /**
     * Returns a tree graph node for the given key. 
     * 
     * If the graph does not yet contain a node for the given key, a new node is created and
     * added to the graph.
     * 
     * Parameters:
     *
     * key: key for identifying the node
     */
    this.getNode = function(key) {
        var node = m_nodes.get(key);
        
        if (node == null) {
            node = new TreeGraphNode(key);
            m_nodes.put(key, node);
        }
        
        return node;
    }
    
    /**
     * Returns whether there is already a node in the tree graph corresponding to the given key.
     */
    this.containsNode = function(key) {
        return m_nodes.containsKey(key);
    }

    /**
     * Returns all nodes.
     */
    this.getAllNodes = function() {
        var allNodes = new java.util.HashSet(m_nodes.values());
        return allNodes;
    }
    
    /**
     * Returns all root nodes.
     */
    this.getRootNodes = function() {
        var rootNodes = new java.util.HashSet();
        
        for (var it = m_nodes.values().iterator(); it.hasNext();) {
            var node = it.next();
            
            if (node.isRootNode()) {
                rootNodes.add(node);
            }
        }
        
        return rootNodes;
    }

    /**
     * Normalizes the structure so that each node does not have more than one parent node.
     *
     * The follwoing rules apply:
     *
     * 1) If a node 'N' has more than one parent node and one of these parent modes is located
     *    at a higher hierarchy level than all other parent nodes this node will become the
     *    only parent node of 'N'.
     *
     * 2) If a node 'N' has more than one parent node and no unique parent node can be identified
     *    according to rule 1) the closest parent node of the parent nodes of 'N' will become the
     *    new parent node of 'N'.
     *
     * 3) If a node 'N' has more than one parent node and no unique parent node can be identified
     *    according to rules 1) and 2) 'N' will be moved to the root of the hierarchy.
     *
     * Example for such a normalization:
     *
     * Original structure:         Normalized structure:
     * 
     *        A     B                 A     D     B
     *      /  \  /  \                |     |     |
     *     C    D      E     ==>      C     H     E
     *   /  \   |    /              /  \          |
     *  F    G  H  /               F    G         J
     *     /  \  /                      |
     *    I    J                        I
     */
    this.normalize = function() {
         var nodesWithMultipleParents = this.getAllNodesWithMultipleParents();
         
         if (nodesWithMultipleParents.isEmpty()) {
             return;
         }
         
         var remainingNodesWithMultipleParents = removeNodesWithUniqueHighLevelParentFromOtherParentsRepeatedly(nodesWithMultipleParents);
         makeNodesHavingOneParentAtMaximum(remainingNodesWithMultipleParents);
    }
    
    /**
     * Returns all nodes in the graph having more than one parent node
     */
    this.getAllNodesWithMultipleParents = function() {
        var nodesWithMultipleParents = new java.util.HashSet();
        
        for (var it = m_nodes.values().iterator(); it.hasNext();) {
            var node = it.next();
            var parentNodes = node.getParents();
            
            if (parentNodes.size() > 1) {
                nodesWithMultipleParents.add(node);
            }
        }
        
        return nodesWithMultipleParents;
    }

    /**
     * Applys rule 1 to each of the nodes in the given collection multiple times:
     *
     * If there is a single parent node of a given node 'N' having the lowest hierarchy
     * level number of all parent nodes, 'N' will be removed from all other parent nodes.
     *
     * Because each removal from a parent node changes the state, this algorithm is applied again until
     * it does not remove a node from a parent node any klonger.
     */ 
    function removeNodesWithUniqueHighLevelParentFromOtherParentsRepeatedly(nodes) {
         var remainingNodesWithMultipleParents = nodes;
          
         for (;;) {
             var previousNumberOfNodesWithMultipleParents = remainingNodesWithMultipleParents.size();
             remainingNodesWithMultipleParents = removeNodesWithUniqueHighLevelParentFromOtherParentsOnce(remainingNodesWithMultipleParents);
             
             if (remainingNodesWithMultipleParents.isEmpty() 
                    || (remainingNodesWithMultipleParents.size() == previousNumberOfNodesWithMultipleParents)) {
                 break;
             }
             
             previousNumberOfNodesWithMultipleParents = remainingNodesWithMultipleParents.size();
         }
            
         return remainingNodesWithMultipleParents;
    }

    /**
     * Applys rule 1 to each of the nodes in the given collection once:
     *
     * If there is a single parent node of a given node 'N' having the lowest hierarchy
     * level number of all parent nodes, 'N' will be removed from all other parent nodes.
     */ 
    function removeNodesWithUniqueHighLevelParentFromOtherParentsOnce(nodes) {
        var remainingNodesWithMultipleParents = new java.util.HashSet();
        var nodeArray = toSortedArray(nodes);
        
        for (var i = 0; i < nodeArray.length; i++) {
            var hasBeenRemovedFromParents = removeFromOtherParentsIfNodeHasUniqueHighLevelParent(nodeArray[i]);
            
            if (!hasBeenRemovedFromParents) {
                remainingNodesWithMultipleParents.add(nodeArray[i]);
            }
        }
        
        return remainingNodesWithMultipleParents;
    }

    /**
     * Makes each of the given nodes having one parent at maximum by applying the following rules:
     *
     * 1) If a node 'N' has more than one parent node and one of these parent modes is located
     *    at a higher hierarchy level than all other parent nodes this node will become the
     *    only parent node of 'N'.
     *
     * 2) If a node 'N' has more than one parent node and no unique parent node can be identified
     *    according to rule 1) the closest parent node of the parent nodes of 'N' will become the
     *    new parent node of 'N'.
     *
     * 3) If a node 'N' has more than one parent node and no unique parent node can be identified
     *    according to rules 1) and 2) 'N' will be moved to the root of the hierarchy.
     *
     */ 
    function makeNodesHavingOneParentAtMaximum(nodes) {
        var nodeArray = toSortedArray(nodes);
        
        for (var i = 0; i < nodeArray.length; i++) {
            var hasBeenRemovedFromParents = removeFromOtherParentsIfNodeHasUniqueHighLevelParent(nodeArray[i]);
                
            if (!hasBeenRemovedFromParents) {
                removeFromAllParentsAndAddToCommonSuperiorParent(node);
            }
        }
    }

    /**
     * If there is a single parent node of the given node having the lowest hierarchy
     * level number of all parent nodes, the given node will be removed from all other parent nodes.
     *
     * Returns 'true' if the rule could be applied succwessfully, false otherwise.
     */ 
    function removeFromOtherParentsIfNodeHasUniqueHighLevelParent(node) {
        var sortedParentNodes = toArray(node.getParents());
        
        if ((sortedParentNodes.length <= 1) 
                && (sortedParentNodes[0].getHierarchyLevel() == sortedParentNodes[1].getHierarchyLevel())) {
            return false;
        }
            
        for (var i = 1; i < sortedParentNodes.length; i++) {
            sortedParentNodes[i].removeChildNode(node);
        }
        
        return true;
    }

    function removeFromAllParentsAndAddToCommonSuperiorParent(node) {
        var parentNodes = node.getParents();
        var newParentNode = findCommonSuperiorParentOfHighestLevelParents(node);
        
        for (var it = parentNodes.iterator(); it.hasNext();) {
            var parentNode = it.next();
            
            if (parentNode != newParentNode) {
                parentNode.removeChildNode(node);
            }
        }
        
        if ((newParentNode != null) && !newParentNode.getChildNodes().contains(node)) {
            newParentNode.addChilödNode(node);
        }
            
    }
    
    function findCommonSuperiorParentOfHighestLevelParents(node) {
        var parentNodes = node.getParents();
        
        if (parentNodes.isEmpty()) {
            return null;
        }
        
        if (parentNodes.size() == 1) {
            return parentNodes.iterator().next();
        }
        
        var parentNodeArray = toSortedArray(parentNodes);
        var hierachyLevel = parentNodeArray[0].getHierarchyLevel();
        
        if (parentNodeArray[0].getHierarchyLevel() > parentNodeArray[1].getHierarchyLevel()) {
            return parentNodeArray[0];
        }
        
        var pathToRoot = getPathToRoot(parentNodeArray[0]);
        
        for (var i = 1; i < parentNodeArray.size(); i++) {
            var otherPathToRoot = getPathToRoot(parentNodeArray[i]);
            
            pathToRoot.retainAll(otherPathToRoot);
            
            if (pathToRoot.isEmpty()) {
                break;
            }
        }
        
        if (pathToRoot.isEmpty()) {
            return null;
        }
        
        return pathToRoot.get(0);
    }
    
    function getPathToRoot(node) {
        var parentNodes = node.getParents();
        
        if (parentNodes.size() != 1) {
            return java.util.Collections.emptyList();
        }
        
        var parentNode = parentNodes.iterator().next();
        var parentPathToRoot = getPathToRoot(parentNode);
        var pathToRoot = new java.utile.ArrayList();
        pathToRoot.add(parentNode);
        pathToRoot.addAll(parentPathToRoot);
        return pathToRoot;
    }
        
    /**
     * Converts the given Java Collection of TreeNodes into a JavaScript array sorted by
     * the hierarchy level of the contained nodes
     */
    function toSortedArray(nodeCollection) {
        var nodeArray = toArray(nodeCollection);
        nodeArray.sort(compareByHierarchyLevel);
        return nodeArray;
    }
    
    /**
     * Compares two TreeNodes by their hierarchy level
     */
    function compareByHierarchyLevel(node1, node2) {
        var result = node1.getHierarchyLevel() - node2.getHierarchyLevel();
    }
    
    /**
     * Traverses the tree recursively from the leaf nodes to the root nodes.
     *
     * Parameters:
     *                   
     * useCases: java.util.List collection of callback functions. 
     *           Each use case function will be called once for each single node, passing
     *           the node itself and the  results the callback function returned for the
     *           direct child nodes of the current node.
     *           The use case functions must conform to the following signature:
     *           Object function(TreeGraphNode currentNode, java.util.Map<TreeGraphNode, Object> childNodeResults)
     *
     * processingNodeStarted: callback function which will be invoked for each single node before
     *                        the uses caes are invoked for the node.
     *                        It must conform to the following signature:
     *                        void function(TreeGraphNode currentNode)
     *
     * processingNodeFinished: callback function which will be invoked for each single node before
     *                         the uses caes are invoked for the node.
     *                         It must conform to the following signature:
     *                         void function(TreeGraphNode currentNode)
     */
    this.traverse = function(useCases, processingNodeStarted, processingNodeFinished) {
        var traversedNodes = new java.util.HashSet();
        var resultCache = new java.util.HashMap();
        var rootNodes = this.getRootNodes();
        
        for (var it = rootNodes.iterator(); it.hasNext();) {
            var rootNode = it.next();
            traverseNode(rootNode, useCases, processingNodeStarted, processingNodeFinished, traversedNodes, resultCache);
        }
    }
    
    /**
     * Used internally for traversing the tree graph
     */
    function traverseNode(node, useCases, processingNodeStarted, processingNodeFinished, traversedNodes, resultCache) {
        var useCaseResultsOfChildren = new java.util.ArrayList();

        for (var i = 0; i < useCases.size(); i++) {
            var resultMap = new java.util.HashMap();
            useCaseResultsOfChildren.add(resultMap);
        }
        
        for (var it = node.getChildren().iterator(); it.hasNext();) {
            var childNode = it.next();
            var resultList;
            
            if (resultCache.containsKey(childNode)) {
                resultList = resultCache.get(childNode);
                
                if (haveAllOtherParentsBeenTraversed(childNode, node, traversedNodes)) {
                    resultCache.remove(childNode);
                }
            } else {
                resultList = traverseNode(childNode, useCases, processingNodeStarted, processingNodeFinished, traversedNodes, resultCache);
                
                if (!haveAllOtherParentsBeenTraversed(childNode, node, traversedNodes)) {
                    resultCache.put(childNode, resultList);
                }
            }
            
            for (var i = 0; i < resultList.size(); i++) {
                var resultsOfChildren = useCaseResultsOfChildren.get(i);
                resultsOfChildren.put(childNode, resultList.get(i));
            }
        }
        
        processingNodeStarted(node);
            
        var resultList = new java.util.ArrayList();
        
        for (var i = 0; i < useCases.size(); i++) {
            var useCase = useCases.get(i);
            var resultsOfChildren = useCaseResultsOfChildren.get(i);
            var resultOfNode = useCase(node, resultsOfChildren);
            resultList.add(resultOfNode);
        }
        
        processingNodeFinished(node);

        traversedNodes.add(node);

        return resultList;
    }
    
    /**
     * Checks whether all parent nodes of the given node but the given parent node are contained
     * in the given set of already traversed nodes
     */
    function haveAllOtherParentsBeenTraversed(childNode, currentParentNode, traversedNodes) {
        var parentNodes = childNode.getParents();
        
        for (var it = parentNodes.iterator(); it.hasNext();) {
            var parentNode = it.next();
            
            if (parentNode == currentParentNode) {
                continue;
            }
            
            if (!traversedNodes.contains(parentNode)) {
                return false;
            }
        }
        
        return true;
    }
}

/**
 * Node in a directed tree-like graph.
 *
 * This node should never be created directly. Instead of this the function 'getNode()' of the corresponding
 * tree graph must be called.
 */
var TreeGraphNode = function(key) {
    var m_key = key;
    var m_item = null;
    var m_itemType = null;
    var m_parentNodes = new java.util.HashSet();
    var m_childNodes = new java.util.HashSet();
    var m_hierarchyLevel = -1;

    /**
     * Returns the key of this node.
     */
    this.getKey = function() {
        return m_key;
    }
    
    /**
     * Adds a child node to this node.
     *
     * If the new child node is already part of the parent hierarchy of this node, it will not be added in order
     * to avoid cycles in the tree graph.
     *
     * Returns true if the node could be added as child node and false if the node was not added because it
     * this would have created a cycle.
     */
    this.addChildNode = function(childNode) {

        if ((childNode == this) || this.isChildNodeOf(childNode)) {
            return false;
        }
        
        m_childNodes.add(childNode);
        childNode.addParentNodeInternal(this);
        return true;
    }
    
    /**
     * Removes a child node from this node.
     *
     * Retrurns true if the child node has been removed and false if the given node is nota child node of this node.
     */
    this.removeChildNode = function(childNode) {

        if (!m_childNodes.contains(childNode)) {
            return false;
        }
        
        m_childNodes.remove(childNode);
        childNode.removeParentNodeInternal(this);
        return true;
    }
    
    /**
     * Internal function: adds the given node as parent node to this node.
     *
     * This function is internally called by addChildNode() and must not be called from outside.
     */
    this.addParentNodeInternal = function(parentNode) {
        m_parentNodes.add(parentNode);
        m_hierarchyLevel = -1;
    }
    
    /**
     * Internal function: removes the given parent node from this node.
     *
     * This function is internally called by removeChildNode() and must not be called from outside.
     */
    this.removeParentNodeInternal = function(parentNode) {
        m_parentNodes.remove(parentNode);
        m_hierarchyLevel = -1;
    }
    
    /**
     * Sets the item represented by this node.
     */
    this.setItem = function(item) {
        m_item = item;
    }
    
    /**
     * Returns the item represented by this node.
     */
    this.getItem = function() {
        return m_item;
    }
    
    /**
     * Specifies the type of the item represented by this node.
     */
    this.setItemType = function(itemType) {
        m_itemType = itemType;
    }
    
    /**
     * Returns the item type represented by this node.
     */
    this.getItemType = function() {
        return m_itemType;
    }
    
    /**
     * Checks whether the given node is part of the parent hierarchy of this node.
     */
    this.isChildNodeOf = function(graphNode) {
        
        if (graphNode.isLeafNode()) {
            return false;
        }
        
        if (m_parentNodes.contains(graphNode)) {
            return true;
        }

        var allParentNodes = this.getAllParentNodes();
		return allParentNodes.contains(graphNode);
    }

    /**
     * Returns all parent nodes of this node.
     */
    this.getAllParentNodes = function() {
        var allParentNodes = new java.util.HashSet();
		
		if (m_parentNodes.isEmpty()) {
			return allParentNodes;
		}
		
		this.addAllParentNodes(allParentNodes);
		return allParentNodes;
    }

    /**
     * Adds recursively all parent nodes of this node to the given set.
     */
    this.addAllParentNodes = function(allParentNodes) {
		
		if (m_parentNodes.isEmpty()) {
			return;
		}
 		
		for (var it = m_parentNodes.iterator(); it.hasNext();) {
			var parentNode = it.next();
			
			if (allParentNodes.contains(parentNode)) {
				continue;
			}
			
			allParentNodes.add(parentNode);
			parentNode.addAllParentNodes(allParentNodes);
		}
    }
    
    /**
     * Checks whether one the given nodes (a java.util.collection of nodes) 
     *  is part of the parent hierarchy of this node.
     */
    this.isChildNodeOfOne = function(nodesCollection) {
        
        for (var it = nodesCollection.iterator(); it.hasNext();) {

            var otherNode = it.next()
            if (this.isChildNodeOf(otherNode)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Returns all parent nodes of this node.
     */
    this.getParents = function() {
        return java.util.Collections.unmodifiableSet(m_parentNodes);
    }
    
    /**
     * Returns all child nodes of this node.
     */
    this.getChildren = function() {
        return java.util.Collections.unmodifiableSet(m_childNodes);
    }
    
    /**
     * Returns whether this node is a root node, i.e. whether it does not have parent nodes.
     */
    this.isRootNode = function() {
        return m_parentNodes.isEmpty();
    }
    
    /**
     * Returns whether this node is a leaf node, i.e. whether it does not have child nodes.
     */
    this.isLeafNode = function() {
        return m_childNodes.isEmpty();
    }
    
    /**
     * Returns the hierarchy level of this node, i.e. the length of its shortest path to the root.
     */
    this.getHierarchyLevel = function() {
        
        if (m_hierarchyLevel < 0) {
        
            if (m_parentNodes.isEmpty()) {
                m_hierarchyLevel = 0;
            } else {
                m_hierarchyLevel = Number.MAX_SAFE_INTEGER;
        
                for (var it = m_parentNodes.iterator(); it.hasNext();) {
                    var parentNode = it.next();
                    var parentHierarchyLevel = parentNode.getHierarchyLevel();
                    
                    if (parentHierarchyLevel + 1 < m_hierarchyLevel) {
                        m_hierarchyLevel = parentHierarchyLevel + 1;
                    }
                }
            }
        }
        
        return m_hierarchyLevel;
    }
}
