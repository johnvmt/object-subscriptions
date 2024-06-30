import NestedObjectWithSubscriptions from "./NestedObjectWithSubscriptions.js";

class NestedObjectWithSubscriptionsChild {
    constructor(parent, pathOrPathParts, options = {}) {
        this._parent = parent;
        this._options = options;
        this._parentPathParts = this._parent.pathPartsFromPath(pathOrPathParts, this.options.separator);
    }

    /**
     * Returns parent NestedObjectWithSubscriptions
     * @returns {*}
     */
    get parent() {
        return this._parent;
    }

    /**
     * Returns merged child and parent options (notably: separator)
     * @returns {*}
     */
    get options() {
        return {
            ...this._parent.options,
            ...this._options
        };
    }

    /**
     * Returns a new child at the specified path (relative to this child's root)
     * @param childPathOrPathParts
     * @returns {NestedObjectWithSubscriptionsChild|*}
     */
    child(childPathOrPathParts) {
        return this._parent.child(this._parentPathPartsFromChildPathOrPathParts(childPathOrPathParts));
    }

    /**
     * Returns value at specified path (relative to this child's root)
     * @param childPathOrPathParts
     * @returns {*}
     */
    get(childPathOrPathParts) {
        return this._parent.get(this._parentPathPartsFromChildPathOrPathParts(childPathOrPathParts));
    }

    /**
     * Sets value at specified path (relative to this child's root)
     * @param childPathOrPathParts
     * @param value
     * @param tag
     * @returns {*}
     */
    set(childPathOrPathParts, value, tag = undefined) {
        return this._parent.set(this._parentPathPartsFromChildPathOrPathParts(childPathOrPathParts), value, tag);
    }

    /**
     * Deleted value at specified path (relative to this child's root)
     * @param childPathOrPathParts
     * @param tag
     * @returns {*}
     */
    delete(childPathOrPathParts, tag = undefined) {
        return this._parent.delete(this._parentPathPartsFromChildPathOrPathParts(childPathOrPathParts), tag);
    }

    /**
     * Subscribes to value at specified path (relative to this child's root)
     * @param childPathOrPathParts
     * @param callback
     * @param options
     * @returns {(function(): void)|*|Promise<PushSubscription>}
     */
    subscribe(childPathOrPathParts, callback, options = {}) {
        return this._parent.subscribe(this._parentPathPartsFromChildPathOrPathParts(childPathOrPathParts), callback, options);
    }

    /**
     * Returns calculation subscription using paths relative to this child's root
     * @param setChildPathOrPathParts
     * @param argsChildPathsOrPathsParts
     * @param calculator
     * @param options
     * @returns {(function(): void)|*}
     */
    calculate(setChildPathOrPathParts, argsChildPathsOrPathsParts, calculator, options = {}) {
        const setParentPathOrPathParts = this._parentPathPartsFromChildPathOrPathParts(setChildPathOrPathParts);
        const argsParentPathsOrPathsParts = argsChildPathsOrPathsParts.map(
            argsChildPathOrPathParts => this._parentPathPartsFromChildPathOrPathParts(argsChildPathOrPathParts)
        );

        return this._parent.calculate(setParentPathOrPathParts, argsParentPathsOrPathsParts, calculator, options);
    }

    /**
     * Returns path in parent from path that's relative to this child's root
     * @param childPathOrPathParts
     * @returns {*[]}
     * @private
     */
    _parentPathPartsFromChildPathOrPathParts(childPathOrPathParts) {
        return [
            ...this._parentPathParts,
            ...this._parent.pathPartsFromPath(childPathOrPathParts, this.options.separator)
        ];
    }

    /**
     * Returns mutation types
     * @returns {Readonly<{FETCH: string, DELETE: string, SET: string}>}
     * @constructor
     */
    static get MUTATIONS() {
        return NestedObjectWithSubscriptions.MUTATIONS;
    }
}

export default NestedObjectWithSubscriptionsChild;
