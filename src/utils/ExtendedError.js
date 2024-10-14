// extended error v0.0.1
class ExtendedError extends Error {
    constructor(message, props) {
        super(message);
        Object.assign(this, props);
    }
}

export default ExtendedError;
