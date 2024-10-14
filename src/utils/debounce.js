// debounce v0.0.1
const debounce = (callback, delay, immediate) => {
    let timeout = null;
    let lastCallbackDate = null;
    let nextExecutionCallbackArgs = null;

    return (...callbackArgs) => {
        const nowDate = new Date();
        nextExecutionCallbackArgs = callbackArgs;

        const executeCallback = () => {
            lastCallbackDate = new Date();
            callback(...nextExecutionCallbackArgs);
        };

        if(timeout === null) { // don't run if timeout !== null, because it's already counting down
            if(immediate && (lastCallbackDate === null || nowDate - lastCallbackDate > delay)) // never run, or last run was longer than "delay" ago
                executeCallback();
            else {
                const callbackDelay = immediate
                    ? delay - (nowDate - lastCallbackDate)
                    : lastCallbackDate === null
                        ? delay
                        : Math.min(delay, delay - (nowDate - lastCallbackDate));
                timeout = setTimeout(() => {
                    timeout = null;
                    executeCallback()
                }, callbackDelay);
            }
        }
    }
}

export default debounce;
