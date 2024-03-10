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
		this._options = {
			separator: ".", // default separator for path parts
			...options
		};
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
		const pathParts = pathPartsFromPath(pathOrPathParts, this._options.separator);
		if(pathParts.length === 0)
			delete this._object;
		else
			return objectDelete(this._object, pathParts, this._options);
	}

	get(pathOrPathParts) {
		return objectGet(this._object, pathOrPathParts, this._options);
	}

	set(pathOrPathParts, value) {
		const pathParts = pathPartsFromPath(pathOrPathParts, this._options.separator);
		if(pathParts.length === 0) {
			this._object = value;
			return value;
		}
		else
			return objectSet(this._object, pathParts, value, this._options);
	}

	pathPartsFromPath(pathOrPathParts) {
		return pathPartsFromPath(pathOrPathParts, this._options.separator);
	}

	pathFromPathParts(pathOrPathParts) {
		return pathFromPathParts(pathOrPathParts, this._options.separator);
	}
}

export default NestedObject;
