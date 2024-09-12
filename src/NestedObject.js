import {
	traverseObject,
	objectHas,
	objectSet,
	objectSetImmutable,
	objectGet,
	objectDelete,
	objectDeleteImmutable,
	pathPartsFromPath,
	pathFromPathParts
} from "object-path-utilities";

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

	delete(pathOrPathParts, options = {}) {
		const mergedOptions = {
			immutable: false,
			...this._options,
			...options
		};
		const pathParts = pathPartsFromPath(pathOrPathParts, mergedOptions.separator);

		if(mergedOptions.immutable) {
			this._object = objectDeleteImmutable(this._object, pathParts, mergedOptions);
			return this._options;
		}
		else {
			if(pathParts.length === 0)
				delete this._object;
			else
				return objectDelete(this._object, pathParts, this._options);
		}
	}

	get(pathOrPathParts) {
		return objectGet(this._object, pathOrPathParts, this._options);
	}

	set(pathOrPathParts, value, options = {}) {
		const mergedOptions = {
			immutable: false,
			...this._options,
			...options
		};
		const pathParts = pathPartsFromPath(pathOrPathParts, mergedOptions.separator);

		if(mergedOptions.immutable) {
			this._object = objectSetImmutable(this._object, pathParts, value, mergedOptions);
			return this._object;
		}
		else {
			if(pathParts.length === 0) {
				this._object = value;
				return value;
			}
			else
				return objectSet(this._object, pathParts, value, mergedOptions);
		}
	}

	pathPartsFromPath(pathOrPathParts) {
		return pathPartsFromPath(pathOrPathParts, this._options.separator);
	}

	pathFromPathParts(pathOrPathParts) {
		return pathFromPathParts(pathOrPathParts, this._options.separator);
	}
}

export default NestedObject;
