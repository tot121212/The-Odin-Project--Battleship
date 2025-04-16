import { RESPONSE, ALL_ENUMS } from "./enums.shared.mjs";

/**
 * Creates a timer that rejects a promise after a given timeout
 * @param {number} timeout
 * @returns {Promise<any>}
 */
export const createTimer = (timeout) => {
    return new Promise((_, reject) => {
        setTimeout(() => reject("Timeout"), timeout);
    });
};

/**
 * Wraps a promise with a timer and returns the result of the promise or a timeout error
 * @param {Promise} promise
 * @param {number} timeLimit
 * @returns {Promise<any>}
 */
export const raceWithTimer = async (promise, timeLimit) => {
    return Promise.race([promise, createTimer(timeLimit)]);
};

/**
 * Wraps a callback with retries and returns a promise of the result of the operation
 * @callback callback
 * @returns {Promise<any>}
 * @param {callback} callback callback to wrap
 * @param {number} maxTries Number of retries
 * @param {number} timeLimit Time limit in milliseconds
 * @returns {Promise<any>}
 */
export const withRetries = async (callback, maxTries = 3, timeLimit = 5000) => {
    for (let tries = 0; tries < maxTries; tries++) {
        try {
            const result = await raceWithTimer(callback(), timeLimit);
            return result; // if successful, return and exit
        } catch (error) {
            if (tries >= maxTries - 1) {
                console.error(`Operation timed out after ${maxTries} tries`);
                return false;
            }
            console.log(`Try ${tries + 1} timed out, attempting retry...`);
        }
    }
};

/**
 * Creates a message based upon a shared format for all message avenues,
 * (client to main, main to session, session to client)
 * @param {string} transactionID
 * @param {string} type
 * @param {object} data
 * @returns {object} message
 */
export const createMessage = (transactionID, type, data) => {
    if (!transactionID || !type || !data)
        throw new Error("One or more required message fields are missing");
    if (
        typeof transactionID !== "string" ||
        typeof type !== "string" ||
        typeof data !== "object"
    )
        throw new Error("Invalid message data");
    if (!Object.values(ALL_ENUMS).includes(type)) {
        console.error("Invalid message type:", type);
        throw new Error("Invalid message type");
    }
    return {
        transactionID,
        type,
        data,
    };
};

/**
 * Creates a success message
 * @param {string} transactionID
 * @param {object} data
 * @param {string} successMessage
 * @returns {object} message
 */
export const createSuccessMessage = (transactionID, data, successMessage) => {
    return createMessage(transactionID, RESPONSE.SUCCESS, {
        msg: successMessage,
        ...data,
    });
};

/**
 * Creates an error message
 * @param {string} transactionID
 * @param {object} data
 * @param {string} errorMessage
 */
export const createErrorMessage = (transactionID, data, errorMessage) => {
    return createMessage(transactionID, RESPONSE.ERROR, {
        msg: errorMessage,
        ...data,
    });
};
