import { objectHas, objectSet, objectGet, objectDelete, pathPartsFromPath, pathFromPathParts } from "./ObjectUtils.js";

class NestedObject {
	constructor(object = {}) {
		this._object = object;
	}

	has(pathOrPathParts) {
		return objectHas(this._object, pathOrPathParts);
	}

	delete(pathOrPathParts) {
		return objectDelete(this._object, pathOrPathParts);
	}

	get(pathOrPathParts) {
		return objectGet(this._object, pathOrPathParts);
	}

	set(pathOrPathParts, value) {
		return objectSet(this._object, pathOrPathParts, value);
	}

	static pathPartsFromPath = pathPartsFromPath;

	static pathFromPathParts = pathFromPathParts;
}

export default NestedObject;
