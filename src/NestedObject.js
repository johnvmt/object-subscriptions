import {
	traverseObject,
	objectHas,
	objectSet,
	objectGet,
	objectDelete,
	pathPartsFromPath,
	pathFromPathParts
} from "./ObjectUtils.js";

class NestedObject {
	constructor(object = {}, options = {}) {
		this._object = object;
		this._options = options;
	}

	* entries(options = {}) {
		yield * traverseObject(this._object, { ...this._options, ...options});
	}

	get options() {
		return this._options;
	}

	has(pathOrPathParts) {
		return objectHas(this._object, pathOrPathParts, this._options);
	}

	delete(pathOrPathParts) {
		return objectDelete(this._object, pathOrPathParts, this._options);
	}

	get(pathOrPathParts) {
		return objectGet(this._object, pathOrPathParts, this._options);
	}

	set(pathOrPathParts, value) {
		return objectSet(this._object, pathOrPathParts, value, this._options);
	}

	pathPartsFromPath(pathOrPathParts) {
		return pathPartsFromPath(pathOrPathParts, this._options.separator);
	}

	pathFromPathParts(pathOrPathParts) {
		return pathFromPathParts(pathOrPathParts, this._options.separator);
	}
}

export default NestedObject;
