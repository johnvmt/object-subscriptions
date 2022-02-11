// v0.0.2
import ExtendedError from "./ExtendedError.js";
import NestedObject from "./NestedObject.js";
import NestedObjectTree from "./NestedObjectTree.js";

class NestedObjectWithSubscriptions extends NestedObject {
	constructor() {
		super();

		this._mutationCallbacks = new NestedObjectTree();
	}

	set(pathOrPathParts, value) {
		const pathParts = NestedObject.pathPartsFromPath(pathOrPathParts);
		const path = NestedObject.pathFromPathParts(pathOrPathParts);
		if(!this.has(pathParts) || this.get(pathParts) !== value) {
			const result = super.set(pathParts, value);
			this._emitMutation(path, pathParts, value, NestedObjectWithSubscriptions.MUTATIONS.SET);
			return result;
		}
	}

	delete(pathOrPathParts) {
		const pathParts = NestedObject.pathPartsFromPath(pathOrPathParts);
		const path = NestedObject.pathFromPathParts(pathOrPathParts);
		if(this.has(pathParts)) {
			const result = super.delete(pathParts);
			this._emitMutation(path, pathParts, undefined, NestedObjectWithSubscriptions.MUTATIONS.DELETE);
			return result;
		}
	}

	subscribe(pathOrPathParts, callback, options = {}) {
		const sanitizedOptions = {
			fetch: true,
			...options
		};

		let subscribed = true;

		const subscriptionPath = NestedObject.pathFromPathParts(pathOrPathParts);
		const subscriptionPathParts = NestedObject.pathPartsFromPath(pathOrPathParts);

		const onMutation = (mutatedPath, mutatedValue, mutation) => {
			callback(this.get(subscriptionPathParts), {
				mutatedPath: mutatedPath,
				mutatedValue: mutatedValue,
				mutation: mutation
			});
		}

		if(sanitizedOptions.fetch) // emit current value
			onMutation(subscriptionPath, this.get(subscriptionPathParts), NestedObjectWithSubscriptions.MUTATIONS.FETCH);

		this._addSubscription(subscriptionPathParts, onMutation);

		// return unsubscribe function
		return () => {
			if(subscribed === false)
				throw new ExtendedError("Already unsubscribed", {code: 'canceled_subscription'});

			subscribed = false;

			this._removeSubscription(subscriptionPathParts, onMutation);
		}
	}

	_addSubscription(pathParts, onMutation) {
		if(!this._mutationCallbacks.hasValue(pathParts))
			this._mutationCallbacks.setValue(pathParts, new Set());

		this._mutationCallbacks.getValue(pathParts).add(onMutation);
	}

	_removeSubscription(pathParts, onMutation) {
		const pathMutationCallbacks = this._mutationCallbacks.getValue(pathParts);

		pathMutationCallbacks.delete(onMutation);

		if(pathMutationCallbacks.size === 0)
			this._mutationCallbacks.deleteValue(pathParts);
	}

	_emitMutation(mutatedPath, mutatedPathParts, mutatedValue, mutation) {
		for(let mutationCallbacks of this._mutationCallbacks.familyValues(mutatedPathParts)) {
			for(let mutationCallback of mutationCallbacks) {
				mutationCallback(mutatedPath, mutatedValue, mutation);
			}
		}
	}

	static get MUTATIONS() {
		return Object.freeze({
			SET: 'SET',
			DELETE: 'DELETE',
			FETCH: 'FETCH'
		});
	}
}

export default NestedObjectWithSubscriptions;
