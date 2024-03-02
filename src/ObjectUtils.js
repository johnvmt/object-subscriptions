// Object Utils v1.0.14
function objectFilterExclude(rawObject, pathsOrPathsParts = [], deepClone = true) {
	const clone = objectClone(rawObject, deepClone);
	for(let objectPath of pathsOrPathsParts) {
		objectDelete(clone, objectPath);
	}
	return clone;
}

function objectFilterInclude(rawObject, pathsOrPathsParts = [], options = {}) {
	const filteredObject = {};

	for(let pathOrPathParts of pathsOrPathsParts) {
		const pathParts = pathPartsFromPath(pathOrPathParts, options.separator);
		if(objectHas(rawObject, pathParts, options))
			objectSet(filteredObject, pathParts, objectGet(rawObject, pathParts, options), options);
	}

	return filteredObject;
}

function objectClone(rawObject, deep = true) {
	if(typeof value === "object" && value !== null) {
		if(deep)
			return structuredClone(rawObject);
		else
			return { ...rawObject };
	}
	else // scalar
		return rawObject;
}

function indexArrayBy(array, pathOrParts, options = {}) {
	const pathParts = pathPartsFromPath(pathOrParts, options.separator);
	return array.reduce((indexed, item) => {
		if ((item instanceof Object)) {
			const indexValue = objectGet(item, pathParts, options);
			if (indexValue !== undefined)
				indexed[indexValue] = item;
		}

		return indexed;
	}, {});
}

function objectDeepEqual(x, y) {
	if(x === y)
		return true;

	else if((typeof x === 'object' && x !== null) && (typeof y === 'object' && y !== null)) {
		if(Object.keys(x).length !== Object.keys(y).length)
			return false;

		for(let prop in x) {
			if(x.hasOwnProperty(prop) && y.hasOwnProperty(prop)) {
				if (!objectDeepEqual(x[prop], y[prop]))
					return false;
			}
			else
				return false;
		}
		return true;
	}
	else
		return (x === y);
}

function objectDiffs(x, y) {
	const diffPaths = [];

	const objectDiffsX = (x, y, prefix = []) => {
		if(typeof x === 'object' && x !== null) {
			for(let prop in x) {
				if(x.hasOwnProperty(prop)) {
					if(typeof x[prop] === 'object' && x[prop] !== null) // x[prop] is an object
						objectDiffsX(x[prop], (typeof y === 'object' && y !== null) ? y[prop] : undefined, prefix.concat([prop]));
					else if (typeof y !== 'object' || y === null || x[prop] !== y[prop]) // x[prop] is not an object and doesnt match y[prop]
						diffPaths.push(prefix.concat([prop]))
				}
			}
		}
	}

	const objectDiffsY = (y, x, prefix = []) => {
		if(typeof y === 'object' && x !== null) {
			for(let prop in y) {
				if(y.hasOwnProperty(prop)) {
					if(typeof y[prop] === 'object' && y[prop] !== null) // y[prop] is an object
						objectDiffsY(y[prop], (typeof x === 'object') ? x[prop] : undefined, prefix.concat([prop]));
					else if (typeof x !== 'object' || x[prop] === undefined) // y[prop] is not an object and doesnt match x[prop]
						diffPaths.push(prefix.concat([prop]))
				}
			}
		}
	}

	objectDiffsX(x, y);
	objectDiffsY(y, x);

	return diffPaths;
}

// TODO add prune
function objectDelete(object, objectPath, options = {}) {
	const pathParts = pathPartsFromPath(objectPath, options.separator);

	if(pathParts.length === 0) { // delete root
		for(let property in object) {
			if(object.hasOwnProperty(property))
				delete object[property];
		}
	}
	else {
		const parentObjectPath = pathParts.slice(0, pathParts.length - 1);
		if(!objectHas(object, parentObjectPath, options))
			return undefined;

		delete objectGet(object, parentObjectPath, options)[pathParts[pathParts.length - 1]];
	}
}

function objectHas(object, objectPath, options = {}) {
	const pathParts = pathPartsFromPath(objectPath, options.separator);

	if(pathParts.length === 0)
		return true;
	else if(!(object instanceof Object) || !(pathParts[0] in object))
		return false;
	else
		return objectHas(object[pathParts[0]], pathParts.slice(1), options);
}

function objectGet(object, objectPath, options = {}) {
	const pathParts = pathPartsFromPath(objectPath, options.separator);

	if(pathParts.length === 0)
		return object;
	else if(!(object instanceof Object))
		return undefined;
	else
		return objectGet(object[pathParts[0]], pathParts.slice(1), options);
}

function objectSet(object, objectPath, value, options = {}) {
	const pathParts = pathPartsFromPath(objectPath, options.separator);

	if(pathParts.length === 0) // setting whole object, cannot set in place
		return value;
	else { // setting part of object
		const objectKey = pathParts[0];
		if(pathParts.length === 1)
			object[objectKey] = value;
		else {
			if(typeof object[objectKey] !== 'object' || object[objectKey] === null) {
				object[objectKey] = (options.array && (typeof objectKey === 'number' || (typeof objectKey === 'string' && /^\d+$/.test(objectKey))))
					? []
					: {};
			}

			objectSet(object[objectKey], pathParts.slice(1), value, options);
		}
		return object;
	}
}

function objectSetImmutable(object, objectPath, value, options = {}) {
	const pathParts = pathPartsFromPath(objectPath, options.separator);

	if(pathParts.length === 0)
		return value;
	else { // setting part of object
		const objectKey = pathParts[0];
		if(typeof object !== 'object' || object === null) { // create it
			if((options.array && (typeof objectKey === 'number' || (typeof objectKey === 'string' && /^\d+$/.test(objectKey)))))
				object = [];
			else
				object = {};
		}

		if(Array.isArray(object)) {
			const arrayClone = [...object];
			if((options.array && (typeof objectKey === 'number' || (typeof objectKey === 'string' && /^\d+$/.test(objectKey)))))
				arrayClone[Number(objectKey)] = objectSetImmutable(object[objectKey], pathParts.slice(1), value, options);
			else
				arrayClone[objectKey] = objectSetImmutable(object[objectKey], pathParts.slice(1), value, options);

			return arrayClone;
		}
		else
			return {...object, ...{[objectKey]: objectSetImmutable(object[objectKey], pathParts.slice(1), value, options)}}
	}
}

function objectDeleteImmutable(object, objectPath, options = {}) {
	if(!objectHas(object, objectPath, options)) // nothing to remove
		return object;

	const pathParts = pathPartsFromPath(objectPath, options.separator);

	const parentObjectPath = pathParts.slice(0, -1);
	const removeProp = pathParts[pathParts.length - 1];
	const parentObject = objectGet(object, parentObjectPath, options);

	const parentObjectClone = {...parentObject};
	delete parentObjectClone[removeProp];
	return objectSetImmutable(object, parentObjectPath, parentObjectClone, options);
}

function flattenObjectProps(object, options = {}) {
	// internal handler
	function flattenObjectPropsInternal(object, flattened, prefixParts) {
		if(!object instanceof Object)
			return flattened;

		for(let prop in object) {
			if(object.hasOwnProperty(prop)) {
				flattened.push(pathFromPathParts(prefixParts.concat([prop]), options.separator));
				if(typeof object[prop] === 'object' && object[prop] !== null)
					flattenObjectProps(object[prop], flattened, prefixParts.concat([prop]), options);
			}
		}

		return flattened;
	}

	return flattenObjectPropsInternal(object, [], []);

}

function flattenObject(object, options = {}) {
	// internal handler
	function flattenObjectInternal(object, flattened, prefixPathParts) {
		if(!object instanceof Object)
			return flattened;

		for(let prop in object) {
			if(object.hasOwnProperty(prop)) {
				if(typeof object[prop] === 'object' && object[prop] !== null)
					flattenObjectInternal(object[prop], flattened, prefixPathParts.concat([prop]), options);
				else
					flattened[pathFromPathParts(prefixPathParts.concat([prop]), options.separator)] = object[prop];
			}
		}

		return flattened;
	}

	return flattenObjectInternal(object, {}, []);
}

function * traverseObject(objectOrPrimitive, options = {}) {
	function * traverseObjectInternal(objectOrPrimitive, prefixPathParts) {
		const pathOrPathParts = options.pathParts
			? prefixPathParts
			: pathFromPathParts(prefixPathParts, options.separator);

		const objectOrPrimitiveIsBranch = typeof objectOrPrimitive === 'object' && objectOrPrimitive !== null;

		if(options.branchNodes || !objectOrPrimitiveIsBranch)
			yield [pathOrPathParts, objectOrPrimitive];

		if(objectOrPrimitiveIsBranch) { // object
			for(let [pathPart, childObjectOrPrimitive] of Object.entries(objectOrPrimitive)) {
				yield * traverseObjectInternal(childObjectOrPrimitive, [...prefixPathParts, pathPart]);
			}
		}
	}

	yield * traverseObjectInternal(objectOrPrimitive, []);
}

function sanitizePathParts(pathParts) {
	return pathParts.filter(pathPart => pathPart.length);
}

function pathPartsFromPath(objectPathOrParts, separator = '.') {
	const pathParts = Array.isArray(objectPathOrParts)
		? objectPathOrParts
		: objectPathOrParts.split(separator);

	return sanitizePathParts(pathParts);
}

function pathFromPathParts(objectPathOrParts, separator = '.') {
	return Array.isArray(objectPathOrParts)
		? sanitizePathParts(objectPathOrParts).join(separator)
		: objectPathOrParts;
}

export {
	objectFilterExclude,
	objectFilterInclude,
	objectClone,
	objectDiffs,
	indexArrayBy,
	objectDeepEqual,
	objectDelete,
	objectHas,
	objectGet,
	objectSet,
	objectSetImmutable,
	objectDeleteImmutable,
	traverseObject,
	flattenObject,
	flattenObjectProps,
	pathPartsFromPath,
	pathFromPathParts,
}

export default {
	objectFilterExclude,
	objectFilterInclude,
	objectClone,
	objectDiffs,
	indexArrayBy,
	objectDeepEqual,
	objectDelete,
	objectHas,
	objectGet,
	objectSet,
	objectSetImmutable,
	objectDeleteImmutable,
	traverseObject,
	flattenObject,
	flattenObjectProps,
	pathPartsFromPath,
	pathFromPathParts
}
