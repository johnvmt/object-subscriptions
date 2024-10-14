import NestedObjectWithSubscriptions from "./NestedObjectWithSubscriptions.js";
import {
    pathPartsFromPath,
    pathFromPathParts
} from "object-path-utilities";

class NestedObjectWithSubscriptionsChild {
    constructor(root, pathOrPathParts, options = {}) {
        this._root = root;
        this._options = options;
        this._rootPathParts = this._root.pathPartsFromPath(pathOrPathParts, this.options.separator);
    }

    /**
     * Returns parent NestedObjectWithSubscriptions
     * @returns {*}
     */
    get parent() {
        return this._root;
    }

    /**
     * Returns merged child and parent options (notably: separator)
     * @returns {*}
     */
    get options() {
        return {
            ...this._root.options,
            ...this._options
        };
    }

    /**
     * Returns a new child at the specified path (relative to this child's root)
     * @param childPathOrPathParts
     * @returns {NestedObjectWithSubscriptionsChild|*}
     */
    child(childPathOrPathParts) {
        return this._root.child(this._rootPathPartsFromChildPathOrPathParts(childPathOrPathParts));
    }

    /**
     * Returns value at specified path (relative to this child's root)
     * @param childPathOrPathParts
     * @returns {*}
     */
    get(childPathOrPathParts) {
        return this._root.get(this._rootPathPartsFromChildPathOrPathParts(childPathOrPathParts));
    }

    /**
     * Sets value at specified path (relative to this child's root)
     * @param childPathOrPathParts
     * @param value
     * @param tag
     * @returns {*}
     */
    set(childPathOrPathParts, value, tag = undefined) {
        return this._root.set(this._rootPathPartsFromChildPathOrPathParts(childPathOrPathParts), value, tag);
    }

    /**
     * Deleted value at specified path (relative to this child's root)
     * @param childPathOrPathParts
     * @param tag
     * @returns {*}
     */
    delete(childPathOrPathParts, tag = undefined) {
        return this._root.delete(this._rootPathPartsFromChildPathOrPathParts(childPathOrPathParts), tag);
    }

    /**
     * Subscribes to value at specified path (relative to this child's root)
     * @param childPathOrPathParts
     * @param callback
     * @param options
     * @returns {(function(): void)|*|Promise<PushSubscription>}
     */
    subscribe(childPathOrPathParts, callback, options = {}) {
        return this._root.subscribe(
            this._rootPathPartsFromChildPathOrPathParts(childPathOrPathParts),
            // override callback
            (value, rootMutationMetadata) => {
                callback(value, this._childMutationMetadataFromRootMutationMetadata(rootMutationMetadata))
            },
            options
        );
    }

    /**
     * Returns calculation subscription using paths relative to this child's root
     * @param argsPathsOrPathsParts
     * @param calculator
     * @param setPathOrPathPartsOrCallbackOrOptions
     * @param optionsOrUndefined
     * @returns {(function(): void)|*}
     */
    calculate(argsPathsOrPathsParts, calculator, setPathOrPathPartsOrCallbackOrOptions, optionsOrUndefined) {
        // convert to root path parts
        const rootArgsPathsParts = argsPathsOrPathsParts.map(argsPathsPart => this._rootPathPartsFromChildPathOrPathParts(argsPathsPart));

        const rootSetPathParts = (typeof setPathOrPathPartsOrCallbackOrOptions === "string" || Array.isArray(setPathOrPathPartsOrCallbackOrOptions))
            ? this._rootPathPartsFromChildPathOrPathParts(setPathOrPathPartsOrCallbackOrOptions)
            : undefined;

        return this._root.calculate(
            rootArgsPathsParts,
            calculator,
            // path in root or callback or options
            rootSetPathParts ?? setPathOrPathPartsOrCallbackOrOptions,
            optionsOrUndefined
        );
    }

    /**
     * Returns path in parent from path that's relative to this child's root
     * @param childPathOrPathParts
     * @returns {*[]}
     * @private
     */
    _rootPathPartsFromChildPathOrPathParts(childPathOrPathParts) {
        return [
            ...this._rootPathParts,
            ...this._root.pathPartsFromPath(childPathOrPathParts, this.options.separator)
        ];
    }

    _childPathPartsFromRootPathOrPathParts(parentPathOrPathParts) {
        const parentPathParts = this.pathPartsFromPath(parentPathOrPathParts);
        return parentPathParts.slice(this._rootPathParts.length); // slice off parent path parts
    }

    pathPartsFromPath(pathOrPathParts) {
        return pathPartsFromPath(pathOrPathParts, this._options.separator);
    }

    pathFromPathParts(pathOrPathParts) {
        return pathFromPathParts(pathOrPathParts, this._options.separator);
    }

    _childMutationMetadataFromRootMutationMetadata(rootMutationMetadata) {
        const rootMutatedPathParts = rootMutationMetadata.mutatedPathParts;

        // add child paths
        const childMutatedPathParts = this._childPathPartsFromRootPathOrPathParts(rootMutatedPathParts);
        const childMutatedPath = this.pathFromPathParts(childMutatedPathParts);

        return {
            ...rootMutationMetadata,
            mutatedPath: childMutatedPath,
            mutatedPathParts: childMutatedPathParts
        }
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
