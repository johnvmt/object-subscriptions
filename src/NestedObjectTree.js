import NestedObject from "./NestedObject.js";

class NestedObjectTree {
    constructor(options = {}) {
        this._tree = new NestedObject(options);
        this._options = options;
    }

    /**
     * Returns true if tree has value at path, false otherwise
     * @param pathOrPathParts
     * @returns {boolean|boolean|*}
     */
    hasValue(pathOrPathParts) {
        return this._tree.has(this._hierarchyValuePathParts(pathOrPathParts));
    }

    /**
     * Returns value if tree has value at path, undefined otherwise
     * @param pathOrPathParts
     * @returns {*}
     */
    getValue(pathOrPathParts) {
        return this._tree.get(this._hierarchyValuePathParts(pathOrPathParts));
    }

    /**
     * Creates or overwrites value at path
     * @param pathOrPathParts
     * @param value
     */
    setValue(pathOrPathParts, value) {
        return this._tree.set(this._hierarchyValuePathParts(pathOrPathParts), value);
    }

    /**
     * Deletes value at path, if it exists, and prunes tree above it
     * @param pathOrPathParts
     * @returns {*}
     */
    deleteValue(pathOrPathParts) {
        const hierarchyPathParts = this._hierarchyPathParts(pathOrPathParts);
        const hierarchyValuePathParts = [...hierarchyPathParts, "value"];
        const deleteResult = this._tree.delete(hierarchyValuePathParts);

        this._pruneNodes(hierarchyPathParts);

        return deleteResult;
    }

    /**
     * Split path parts
     * @param pathOrPathParts
     * @returns {*}
     */
    pathPartsFromPath(pathOrPathParts) {
        return this._tree.pathPartsFromPath(pathOrPathParts, this._options.separator);
    }

    /**
     * Join path parts
     * @param pathOrPathParts
     * @returns {*}
     */
    pathFromPathParts(pathOrPathParts) {
        return this._tree.pathFromPathParts(pathOrPathParts, this._options.separator);
    }

    /**
     * Yield all nodes that are descendents or ancestors
     * Descendants first, then ancestors (depth first)
     * @param pathOrPathParts
     * @returns {Generator<*, void, *>}
     */
    * familyNodes(pathOrPathParts) {
        const hierarchyPathParts = this._hierarchyPathParts(pathOrPathParts);
        yield * this._hierarchyFamilyNodes(hierarchyPathParts);
    }

    /**
     * Yield values from all nodes that are descendents or ancestors
     * Descendants first, then ancestors (depth first)
     * @param pathOrPathParts
     * @returns {Generator<*, void, *>}
     */
    * familyValues(pathOrPathParts) {
        for(let node of this.familyNodes(pathOrPathParts)) {
            if(node.hasOwnProperty("value"))
                yield node.value;
        }
    }

    /**
     * Yield all nodes that are descendents, depth-first
     * Default: starts at root
     * @param pathOrPathParts
     * @returns {Generator<*, void, *>}
     */
    * depthFirstNodes(pathOrPathParts = []) {
        const hierarchyPathParts = this._hierarchyPathParts(pathOrPathParts);
        yield * this._hierarchyDescendantNodes(hierarchyPathParts);
    }

    /**
     * Yield values from all nodes that are descendents, depth-first
     * @param pathOrPathParts
     * @returns {Generator<*, void, *>}
     */
    * depthFirstValues(pathOrPathParts) {
        for(let node of this.depthFirstNodes(pathOrPathParts)) {
            if(node.hasOwnProperty("value"))
                yield node.value;
        }
    }

    /**
     * Yield all nodes that are ancestors (parents) of node, deepest first
     * @param pathOrPathParts
     * @returns {Generator<*, void, *>}
     */
    * ancestorNodes(pathOrPathParts) {
        let hierarchyPathParts = this._hierarchyPathParts(pathOrPathParts);
        yield * this._hierarchyAncestorNodes(hierarchyPathParts);
    }

    /**
     * Yield values from all nodes that are ancestors (parents) of node, deepest first
     * @param pathOrPathParts
     * @returns {Generator<*, void, *>}
     */
    * ancestorValues(pathOrPathParts) {
        for(let node of this.ancestorNodes(pathOrPathParts)) {
            if(node.hasOwnProperty("value"))
                yield node.value;
        }
    }

    /**
     * Yield all nodes that are descendents or ancestors, depth-first, using hierarchy path parts
     * @param hierarchyPathParts
     * @returns {Generator<*, void, *>}
     * @private
     */
    * _hierarchyFamilyNodes(hierarchyPathParts) {
        yield * this._hierarchyDescendantNodes(hierarchyPathParts);
        yield * this._hierarchyAncestorNodes(hierarchyPathParts);
    }

    /**
     * Yield all nodes that are descendents, depth-first, using hierarchy path parts
     * @param hierarchyPathParts
     * @returns {Generator<*, void, *>}
     * @private
     */
    * _hierarchyDescendantNodes(hierarchyPathParts) {
        if(this._tree.has(hierarchyPathParts))
            yield * this._depthFirstTraverseNodes(this._tree.get(hierarchyPathParts));
    }

    /**
     * Yield all nodes that are ancestors (parents) of node, deepest first, using hierarchy path parts
     * @param hierarchyPathParts
     * @returns {Generator<*, void, *>}
     * @private
     */
    * _hierarchyAncestorNodes(hierarchyPathParts) {
        while(!this._isHierarchyRootPath(hierarchyPathParts)) { // while not the root node
            hierarchyPathParts = this._hierarchyParentPathParts(hierarchyPathParts); // get path to parent node
            if(this._tree.has(hierarchyPathParts))
                yield this._tree.get(hierarchyPathParts);
        }
    }

    /**
     * Yield callbacks in node and child nodes
     * @param node
     * @returns {Generator<*, void, *>}
     * @private
     */
    * _depthFirstTraverseNodes(node) {
        if(node) {
            // go to all leaves
            if(node.hasOwnProperty("children")) {
                for(let [childPathPart, childNode] of Object.entries(node.children))
                    yield * this._depthFirstTraverseNodes(childNode);
            }

            yield node;
        }
    }

    /**
     * Prune empty nodes above the passed node
     * @param hierarchyPathParts
     * @private
     */
    _pruneNodes(hierarchyPathParts) {
        const node = this._tree.get(hierarchyPathParts);

        if(!node.hasOwnProperty("value") && !node.hasOwnProperty("children") && !this._isHierarchyRootPath(hierarchyPathParts)) {
            // not root
            // if root, cannot remove children from nonexistant parent
            // if not root delete this node, since it has no value and no children
            const hierarchyParentPathParts = this._hierarchyParentPathParts(hierarchyPathParts);
            const childPathPart = hierarchyPathParts[hierarchyPathParts.length - 1]; // key of child; eg: path2 from path1.children.path2

            const parentNode = this._tree.get(hierarchyParentPathParts);

            delete parentNode.children[childPathPart]; // delete this child from parent

            if(Object.keys(parentNode.children).length === 0) { // this was the parent's only child
                delete parentNode.children;
                this._pruneNodes(hierarchyParentPathParts);
            }
        }
    }

    _isHierarchyRootPath(hierarchyPathOrPathParts) {
        return this._tree.pathPartsFromPath(hierarchyPathOrPathParts).length < 2;
    }

    _hierarchyParentPathParts(hierarchyPathOrPathParts) {
        const hierarchyPathParts = this._tree.pathPartsFromPath(hierarchyPathOrPathParts);
        return hierarchyPathParts.slice(0, -2);
    }

    _hierarchyPathParts(pathOrPathParts) {
        const pathParts = this._tree.pathPartsFromPath(pathOrPathParts);

        // children, <part1>, children, <part2>
        return pathParts.reduce((emitterPathParts, pathPart) => [...emitterPathParts, "children", pathPart], []);
    }

    _hierarchyValuePathParts(pathOrPathParts) {
        // children, <part1>, children, <part2>, value
        return [
            ...this._hierarchyPathParts(pathOrPathParts),
            "value"
        ];
    }
}

export default NestedObjectTree;
