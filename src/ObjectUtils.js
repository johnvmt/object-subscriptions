// Object Utils v1.0.7
function objectFilterExclude(rawObject, pathsOrPathsParts = []) {
	const clone = objectClone(rawObject);
	for(let pathorPathParts of pathsOrPathsParts) {
		objectDelete(clone, pathorPathParts);
	}
	return clone;
}

function objectFilterInclude(rawObject, pathsOrPathsParts = []) {
	const filteredObject = {};

	for(let pathOrPathParts of pathsOrPathsParts) {
		const pathParts = pathPartsFromPath(pathOrPathParts);
		if(objectHas(rawObject, pathParts))
			objectSet(filteredObject, pathParts, objectGet(rawObject, pathParts));
	}

	return filteredObject;
}

function objectClone(rawObject) {
	return JSON.parse(JSON.stringify(rawObject));
}

function indexArrayBy(array, pathOrPathParts) {
	const pathParts = pathPartsFromPath(pathOrPathParts);
	return array.reduce((indexed, item) => {
		if ((item instanceof Object)) {
			const indexValue = objectGet(item, pathParts);
			if (indexValue !== undefined)
				indexed[indexValue] = item;
		}

		return indexed;
	}, {});
}

function objectDeepEqual(x, y) {
	if((typeof x === 'object' && x !== null) && (typeof y === 'object' && y !== null)) {
		if (Object.keys(x).length !== Object.keys(y).length)
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
		if(typeof x === "object" && x !== null) {
			for(let prop in x) {
				if(x.hasOwnProperty(prop)) {
					if(typeof x[prop] === "object" && x[prop] !== null) // x[prop] is an object
						objectDiffsX(x[prop], (typeof y === "object" && y !== null) ? y[prop] : undefined, prefix.concat([prop]));
					else if (typeof y !== "object" || y === null || x[prop] !== y[prop]) // x[prop] is not an object and doesnt match y[prop]
						diffPaths.push(prefix.concat([prop]))
				}
			}
		}
	}

	const objectDiffsY = (y, x, prefix = []) => {
		if(typeof y === "object" && x !== null) {
			for(let prop in y) {
				if(y.hasOwnProperty(prop)) {
					if(typeof y[prop] === "object" && y[prop] !== null) // y[prop] is an object
						objectDiffsY(y[prop], (typeof x === "object") ? x[prop] : undefined, prefix.concat([prop]));
					else if (typeof x !== "object" || x[prop] === undefined) // y[prop] is not an object and doesnt match x[prop]
						diffPaths.push(prefix.concat([prop]))
				}
			}
		}
	}

	objectDiffsX(x, y);
	objectDiffsY(y, x);

	return diffPaths;
}

function objectDelete(object, pathorPathParts) {
	const pathParts = pathPartsFromPath(pathorPathParts);

	if(pathParts.length === 0) { // delete root
		for(let property in object) {
			if(object.hasOwnProperty(property))
				delete object[property];
		}
	}
	else {
		const parentObjectPath = pathParts.slice(0, pathParts.length - 1);
		if(!objectHas(object, parentObjectPath))
			return undefined;

		delete objectGet(object, parentObjectPath)[pathParts[pathParts.length - 1]];
	}
}

function objectHas(object, pathorPathParts) {
	const pathParts = pathPartsFromPath(pathorPathParts);

	if(pathParts.length === 0)
		return true;
	else if(!(object instanceof Object) || !object.hasOwnProperty(pathParts[0]))
		return false;
	else
		return objectHas(object[pathParts[0]], pathParts.slice(1));
}

function objectGet(object, pathorPathParts) {
	const pathParts = pathPartsFromPath(pathorPathParts);

	if(pathParts.length === 0)
		return object;
	else if(!(object instanceof Object))
		return undefined;
	else
		return objectGet(object[pathParts[0]], pathParts.slice(1));
}

function objectSet(object, pathorPathParts, value) {
	const pathParts = pathPartsFromPath(pathorPathParts);
	const objectKey = pathParts[0];
	if(pathParts.length === 1)
		object[objectKey] = value;
	else {
		if(typeof object[objectKey] !== 'object' || object[objectKey] === null)
			object[objectKey] = {};
		objectSet(object[objectKey], pathParts.slice(1), value);
	}
}

function flattenObject(object, flattened = {}, prefixPathParts = []) {
	return flattenInternal(object);

	function flattenInternal(object, flattened = {}, prefixPathParts = []) {
		if(!(object instanceof Object))
			return object;

		for(let prop in object) {
			if(object.hasOwnProperty(prop)) {
				const fullPathParts = prefixPathParts.concat([prop]);
				if(typeof object[prop] === "object" && object[prop] !== null)
					flattenInternal(object[prop], flattened, fullPathParts);
				else
					flattened[pathFromPathParts(fullPathParts)] = object[prop]
			}
		}

		return flattened;
	}

}

function pathPartsFromPath(pathOrPathParts) {
	return Array.isArray(pathOrPathParts)
		? pathOrPathParts
		: pathOrPathParts.split('.');
}

function pathFromPathParts(pathOrPathParts) {
	return Array.isArray(pathOrPathParts)
		? pathOrPathParts.join('.')
		: pathOrPathParts;
}

export {
	objectFilterExclude,
	objectFilterInclude,
	objectClone,
	indexArrayBy,
	objectDeepEqual,
	objectDelete,
	objectHas,
	objectGet,
	objectSet,
	flattenObject,
	pathPartsFromPath,
	pathFromPathParts
}
