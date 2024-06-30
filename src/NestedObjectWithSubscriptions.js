// v0.0.2
import ExtendedError from "./ExtendedError.js";
import NestedObject from "./NestedObject.js";
import NestedObjectTree from "./NestedObjectTree.js";
import NestedObjectWithSubscriptionsChild from "./NestedObjectWithSubscriptionsChild.js";

class NestedObjectWithSubscriptions extends NestedObject {
	constructor(object, options) {
		super(object, options);
		this._mutationCallbacks = new NestedObjectTree(options);
	}

	child(pathOrPathParts) {
		return new NestedObjectWithSubscriptionsChild(this, pathOrPathParts);
	}

	set(pathOrPathParts, value, tag) {
		const pathParts = this.pathPartsFromPath(pathOrPathParts);
		const path = this.pathFromPathParts(pathOrPathParts);
		if(!this.has(pathParts) || this.get(pathParts) !== value) {
			const result = super.set(pathParts, value);
			this._emitMutation(path, pathParts, value, NestedObjectWithSubscriptions.MUTATIONS.SET, tag);
			return result;
		}
	}

	delete(pathOrPathParts, tag = undefined) {
		const pathParts = this.pathPartsFromPath(pathOrPathParts);
		const path = this.pathFromPathParts(pathOrPathParts);
		if(this.has(pathParts)) {
			const result = super.delete(pathParts);
			this._emitMutation(path, pathParts, undefined, NestedObjectWithSubscriptions.MUTATIONS.DELETE, tag);
			return result;
		}
	}

	subscribe(pathOrPathParts, callback, options = {}) {
		const mergedOptions = {
			fetch: true, // get result immediately
			...options
		};

		let subscribed = true;

		const subscriptionPath = this.pathFromPathParts(pathOrPathParts);
		const subscriptionPathParts = this.pathPartsFromPath(pathOrPathParts);

		const onMutation = (mutatedPath, mutatedValue, mutation, tag) => {
			callback(this.get(subscriptionPathParts), {
				mutatedPath: mutatedPath,
				mutatedValue: mutatedValue,
				mutation: mutation,
				tag: tag
			});
		}

		if(mergedOptions.fetch) // emit current value
			onMutation(subscriptionPath, this.get(subscriptionPathParts), NestedObjectWithSubscriptions.MUTATIONS.FETCH);

		this._addSubscription(subscriptionPathParts, onMutation);

		// return unsubscribe function
		return () => {
			if(subscribed === false)
				throw new ExtendedError("Already unsubscribed", {code: "canceled_subscription"});

			subscribed = false;

			this._removeSubscription(subscriptionPathParts, onMutation);
		}
	}

	/**
	 * Calculate a new value from values in the object, and store the result
	 * @param argsPathsOrPathsParts
	 * @param calculator
	 * @param setPathOrPathPartsOrCallback
	 * @param options
	 * @returns {(function(): void)|*}
	 */
	calculate(argsPathsOrPathsParts, calculator, setPathOrPathPartsOrCallback, options = {}) {
		const argsPathsParts = argsPathsOrPathsParts.map(argsPathsPart => this.pathPartsFromPath(argsPathsPart));

		const callback = typeof setPathOrPathPartsOrCallback === "function"
			? setPathOrPathPartsOrCallback
			: undefined;

		const setPathParts = typeof setPathOrPathPartsOrCallback !== "function"
			? this.pathFromPathParts(setPathOrPathPartsOrCallback)
			: undefined;

		const mergedOptions = {
			fetch: true, // calculate immediately if true
			defer: false, // wait for the next tick if true
			...options
		};

		let subscribed = true;

		const pushResult = (result) => {
			if(callback)
				callback(result);

			if(setPathParts)
				this.set(setPathParts, result);
		}



		const calculate = () => {
			const resultOrPromise = calculator(...argsPathsParts.map(argPathParts => this.get(argPathParts))) // spread args

			if(resultOrPromise instanceof Promise)
				resultOrPromise.then(pushResult);
			else // result
				pushResult(resultOrPromise);
		}

		let deferPromise;
		const onArgMutated = () => {
			if(mergedOptions.defer) { // wait until next tick, so that all args can be sent
				if(!deferPromise) { // no deferral in progress
					deferPromise = Promise
						.resolve()
						.then(calculate)
						.finally(() => {
							deferPromise = undefined;
						});
				}
			}
			else // calculate immediately
				calculate();
		}

		const argSubscriptions = [];

		// subscribe to all args
		for(let argPathOrPathParts of argsPathsOrPathsParts) {
			argSubscriptions.push(this.subscribe(argPathOrPathParts, onArgMutated, {fetch: false})); // do not trigegr when adding individual args
		}

		if(mergedOptions.fetch)
			onArgMutated();

		// return unsubscribe function
		return () => {
			if(subscribed === false)
				throw new ExtendedError("Already unsubscribed", {code: "canceled_subscription"});

			subscribed = false;

			// unsubscribe from all args
			for(let argUnsubscribe of argSubscriptions) {
				argUnsubscribe();
			}
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

	_emitMutation(mutatedPath, mutatedPathParts, mutatedValue, mutation, tag = undefined) {
		for(let mutationCallbacks of this._mutationCallbacks.familyValues(mutatedPathParts)) {
			for(let mutationCallback of mutationCallbacks) {
				mutationCallback(mutatedPath, mutatedValue, mutation, tag);
			}
		}
	}

	static get MUTATIONS() {
		return Object.freeze({
			SET: "SET",
			DELETE: "DELETE",
			FETCH: "FETCH"
		});
	}
}

export default NestedObjectWithSubscriptions;
