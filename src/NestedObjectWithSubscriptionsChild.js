import NestedObjectWithSubscriptions from "./NestedObjectWithSubscriptions.js";

class NestedObjectWithSubscriptionsChild {
    constructor(parent, pathOrPathParts) {
        this._parent = parent;
        this._parentPathParts = this._parent.pathPartsFromPath(pathOrPathParts);
    }

    get parent() {
        return this._parent;
    }

    child(childPathOrPathParts) {
        return this._parent.child(this._parentPathPartsFromChildPathOrPathParts(childPathOrPathParts));
    }

    get(childPathOrPathParts) {
        return this._parent.get(this._parentPathPartsFromChildPathOrPathParts(childPathOrPathParts));
    }

    set(childPathOrPathParts, value) {
        return this._parent.set(this._parentPathPartsFromChildPathOrPathParts(childPathOrPathParts), value);
    }

    delete(childPathOrPathParts) {
        return this._parent.delete(this._parentPathPartsFromChildPathOrPathParts(childPathOrPathParts));
    }

    subscribe(childPathOrPathParts, callback, options = {}) {
        return this._parent.subscribe(this._parentPathPartsFromChildPathOrPathParts(childPathOrPathParts), callback, options);
    }

    calculate(setChildPathOrPathParts, argsChildPathsOrPathsParts, calculator, options = {}) {
        const setParentPathOrPathParts = this._parentPathPartsFromChildPathOrPathParts(setChildPathOrPathParts);
        const argsParentPathsOrPathsParts = argsChildPathsOrPathsParts.map(
            argsChildPathOrPathParts => this._parentPathPartsFromChildPathOrPathParts(argsChildPathOrPathParts)
        );

        return this._parent.calculate(setParentPathOrPathParts, argsParentPathsOrPathsParts, calculator, options);
    }

    _parentPathPartsFromChildPathOrPathParts(childPathOrPathParts) {
        return [
            ...this._parentPathParts,
            ...this._parent.pathPartsFromPath(childPathOrPathParts)
        ];
    }

    static get MUTATIONS() {
        return NestedObjectWithSubscriptions.MUTATIONS;
    }
}

export default NestedObjectWithSubscriptionsChild;
