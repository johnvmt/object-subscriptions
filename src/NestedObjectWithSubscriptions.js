// v0.0.3
import ExtendedError from "./utils/ExtendedError.js";
import NestedObject from "./NestedObject.js";
import NestedObjectTree from "./NestedObjectTree.js";
import NestedObjectWithSubscriptionsChild from "./NestedObjectWithSubscriptionsChild.js";
import debounce from "./utils/debounce.js";

class NestedObjectWithSubscriptions extends NestedObject {
	constructor(object, options) {
		super(object, options);
		this._mutationCallbacks = new NestedObjectTree(options);
	}

	/**
	 * Returns a nested object from a path
	 * @param pathOrPathParts
	 * @param options
	 * @returns {NestedObjectWithSubscriptionsChild}
	 */
	child(pathOrPathParts, options = {}) {
		const mergedOptions = {
			...this.options,
			...options
		}
		return new NestedObjectWithSubscriptionsChild(this, pathOrPathParts, mergedOptions);
	}

	/**
	 * Set a value on a path in the object
	 * @param pathOrPathParts
	 * @param value
	 * @param options
	 * @returns {{}|*}
	 */
	set(pathOrPathParts, value, options = {}) {
		const pathParts = this.pathPartsFromPath(pathOrPathParts);
		const path = this.pathFromPathParts(pathOrPathParts);
		const mergedOptions = {
			...this.options,
			...options
		};

		const previousValue = this.get(pathParts);

		if(!this.has(pathParts) || previousValue !== value) {
			const result = super.set(pathParts, value, mergedOptions);
			this._emitMutation(path, pathParts, {
				mutation: NestedObjectWithSubscriptions.MUTATIONS.SET,
				mutatedValue: value,
				previousValue: previousValue,
				tag: mergedOptions.tag
			});
			return result;
		}
	}

	/**
	 * Delete a path in the object
	 * @param pathOrPathParts
	 * @param options
	 * @returns {*|{separator: string}}
	 */
	delete(pathOrPathParts, options = {}) {
		const pathParts = this.pathPartsFromPath(pathOrPathParts);
		const path = this.pathFromPathParts(pathOrPathParts);
		const mergedOptions = {
			...this.options,
			...options
		};

		if(this.has(pathParts)) {
			const previousValue = this.get(pathParts);
			const result = super.delete(pathParts, mergedOptions);
			this._emitMutation(path, pathParts, {
				mutation: NestedObjectWithSubscriptions.MUTATIONS.DELETE,
				mutatedValue: undefined,
				previousValue: previousValue,
				tag: mergedOptions.tag
			});
			return result;
		}
	}

	/**
	 * Subscribes to mutations on a path in the object
	 * @param pathOrPathParts
	 * @param callback
	 * @param options
	 * @returns {(function(): void)|*}
	 */
	subscribe(pathOrPathParts, callback, options = {}) {
		const mergedOptions = {
			fetch: true, // get result immediately
			...options
		};

		let subscribed = true;

		const subscriptionPath = this.pathFromPathParts(pathOrPathParts);
		const subscriptionPathParts = this.pathPartsFromPath(pathOrPathParts);

		const onMutation = (mutationMetadata) => {
			callback(this.get(subscriptionPathParts), mutationMetadata);
		}

		if(mergedOptions.fetch) {// emit current value
			onMutation({
				mutation: NestedObjectWithSubscriptions.MUTATIONS.FETCH,
				mutatedPath: subscriptionPath,
				mutatedPathParts: subscriptionPathParts,
				mutatedValue: this.get(subscriptionPathParts)
			});
		}

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
	 * Calculate a new value from values in the object, and optionally store the result
	 * @param argsPathsOrPathsParts
	 * @param calculator
	 * @param setPathOrPathPartsOrCallbackOrOptions
	 * @param optionsOrUndefined
	 * @returns {(function(): void)|*}
	 */
	calculate(argsPathsOrPathsParts, calculator, setPathOrPathPartsOrCallbackOrOptions, optionsOrUndefined) {
		const argsPathsParts = argsPathsOrPathsParts.map(argsPathsPart => this.pathPartsFromPath(argsPathsPart));

		const callback = typeof setPathOrPathPartsOrCallbackOrOptions === "function"
			? setPathOrPathPartsOrCallbackOrOptions
			: undefined;

		const setPathParts = (typeof setPathOrPathPartsOrCallbackOrOptions === "string" || Array.isArray(setPathOrPathPartsOrCallbackOrOptions))
			? this.pathFromPathParts(setPathOrPathPartsOrCallbackOrOptions)
			: undefined;

		let options = {};
		if(typeof optionsOrUndefined === "object")
			options = optionsOrUndefined;
		else if(typeof setPathOrPathPartsOrCallbackOrOptions === "object" && !Array.isArray(setPathOrPathPartsOrCallbackOrOptions))
			options = setPathOrPathPartsOrCallbackOrOptions;

		let mergedOptions = {
			fetch: true, // calculate immediately if true
			defer: false, // wait for the next tick if true (debounce = 0)
			debounce: false,
			immediate: true,
			...options
		};

		// for compatibility, set debounce when defer is set
		if(mergedOptions.defer && !mergedOptions.debounce) {
			mergedOptions.debounce = 0;
			mergedOptions.immediate = false;
		}

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

		const debouncedCalculate = (typeof mergedOptions.debounce === "number")
			? debounce(calculate, mergedOptions.debounce, mergedOptions.immediate)
			: calculate; // no debounce

		const argSubscriptions = [];

		// subscribe to all args
		for(let argPathOrPathParts of argsPathsOrPathsParts) {
			argSubscriptions.push(this.subscribe(argPathOrPathParts, debouncedCalculate, {fetch: false})); // do not trigegr when adding individual args
		}

		if(mergedOptions.fetch)
			debouncedCalculate();

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

	/**
	 * Adds a mutation to the tracked list
	 * @param pathParts
	 * @param onMutation
	 * @private
	 */
	_addSubscription(pathParts, onMutation) {
		if(!this._mutationCallbacks.hasValue(pathParts))
			this._mutationCallbacks.setValue(pathParts, new Set());

		this._mutationCallbacks.getValue(pathParts).add(onMutation);
	}

	/**
	 * Deletes a subscription
	 * @param pathParts
	 * @param onMutation
	 * @private
	 */
	_removeSubscription(pathParts, onMutation) {
		const pathMutationCallbacks = this._mutationCallbacks.getValue(pathParts);

		pathMutationCallbacks.delete(onMutation);

		if(pathMutationCallbacks.size === 0)
			this._mutationCallbacks.deleteValue(pathParts);
	}

	/**
	 * Emits mutation to all listeners
	 * @param mutatedPath
	 * @param mutatedPathParts
	 * @param mutationMetadata
	 * @private
	 */
	_emitMutation(mutatedPath, mutatedPathParts, mutationMetadata) {
		const mergedMutationMetadata = {
			mutatedPath: mutatedPath,
			mutatedPathParts: mutatedPathParts,
			...mutationMetadata
		};

		for(let mutationCallbacks of this._mutationCallbacks.familyValues(mutatedPathParts)) {
			for(let mutationCallback of mutationCallbacks) {
				mutationCallback(mergedMutationMetadata);
			}
		}
	}

	/**
	 * Returns mutation types
	 * @returns {Readonly<{FETCH: string, DELETE: string, SET: string}>}
	 * @constructor
	 */
	static get MUTATIONS() {
		return Object.freeze({
			SET: "SET",
			DELETE: "DELETE",
			FETCH: "FETCH"
		});
	}
}

export default NestedObjectWithSubscriptions;
