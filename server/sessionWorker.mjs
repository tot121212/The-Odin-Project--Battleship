import { parentPort, workerData } from "worker_threads";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";
import {
    SERVER_ACTION,
    SESSION_ACTION,
    CLIENT_ACTION,
    RESPONSE,
} from "../shared/enums.shared.mjs";
import {
    createTimer,
    withRetries,
    createMessage,
    createSuccessMessage,
    createErrorMessage,
} from "../shared/utils.shared.mjs";

import { Game } from "./battleship.mjs";

const sessionID = workerData.sessionID;

const game = new Game();

const ConnectedClients = new Set();
/**
 * @type {Map<string, string>} clientToken to user.id Map
 */
const ClientTokenToUserIDMap = new Map();
/**
 * @type {Map<string, string>} user.id to clientToken Map
 */
const UserIDToClientTokenMap = new Map();

class Router {
    static EventEmitter = new EventEmitter();
    static {
        parentPort?.on("message", Router.recieve);
    }

    /**
     * @param {string} eventName
     * @param {(data: any) => void} callback
     */
    static on(eventName, callback) {
        Router.EventEmitter.on(eventName, callback);
    }

    /**
     * @param {string} eventName
     * @param {(data: any) => void} callback
     */
    static off(eventName, callback) {
        Router.EventEmitter.off(eventName, callback);
    }

    /**
     * @param {string} eventName
     * @param {(data: any) => void} callback
     */
    static once(eventName, callback) {
        Router.EventEmitter.once(eventName, callback);
    }

    /**
     * Recieve data from main thread and emit events through the Router
     * @param {object} json
     */
    static recieve(json) {
        console.log(
            `Session ${sessionID} is recieving a message from main thread`
        );
        if (!json || typeof json !== "object")
            throw new Error("json is not an object");

        if (json.transactionID) {
            Router.EventEmitter.emit(json.transactionID, json.data);
        } else if (json.type) {
            Router.EventEmitter.emit(json.type, json.data);
        }
    }

    /**
     * Removes the temporary listener
     * @param {(data: any) => void} onResponse
     * @param {boolean} listenerWasRemoved
     * @param {string} transactionID
     */
    static removeListenOnce = (
        onResponse,
        listenerWasRemoved,
        transactionID
    ) => {
        if (!onResponse) return;
        if (listenerWasRemoved) return;
        listenerWasRemoved = true;
        Router.off(transactionID, onResponse);
    };

    /**
     * Listens for a response from the client once with the transaction ID
     * @param {string} transactionID
     * @returns {[Promise<any>, () => void]}
     * @description Returns a promise that resolves when the client responds and a function to remove the listener, if it was not already removed
     */
    static listenOnce = (transactionID) => {
        let onResponse;
        let listenerWasRemoved = false;

        const responsePromise = new Promise((resolve, _) => {
            /**
             * @param {object} json
             */
            onResponse = (json) => {
                Router.removeListenOnce(
                    onResponse,
                    listenerWasRemoved,
                    transactionID
                );
                resolve(json);
            };

            Router.on(transactionID, onResponse);
        });
        return [
            responsePromise,
            () =>
                Router.removeListenOnce(
                    onResponse,
                    listenerWasRemoved,
                    transactionID
                ),
        ];
    };
}

/**
 * Client creates a new game
 * @param {object} data
 */
const onNewGame = (data) => {
    const clientToken = data.clientToken;
    try {
        if (typeof clientToken !== "string") {
            throw new Error("Client token is not valid");
        }

        const userID = onJoinGame(data);
        if (typeof userID !== "string") {
            throw new Error("User did not create a game and join successfully");
        }

        game.setHost(data.userID);
        if (game.getHost() !== data.userID)
            throw new Error("Host user ID is not set");

        parentPort?.postMessage(
            createSuccessMessage(
                data.transactionID,
                {
                    clientToken,
                    sessionID,
                },
                "New game created"
            )
        );
    } catch (error) {
        parentPort?.postMessage(
            createErrorMessage(
                data.transactionID,
                {
                    clientToken,
                    sessionID,
                },
                error.message
            )
        );
    }
};

/**
 * On client join, create a new user and send a response to the client with the sessionID
 * @param {object} data
 */
const onJoinGame = (data) => {
    console.log(`Client ${data.clientToken} is joining session ${sessionID}`);
    const clientToken = data.clientToken;
    try {
        // create new game user
        const userID = game.addUser(data.username);
        if (!userID) throw new Error("UserID is not valid");

        // map new game user id to clientToken
        ConnectedClients.add(clientToken);

        ClientTokenToUserIDMap.set(clientToken, userID);
        UserIDToClientTokenMap.set(userID, clientToken);

        parentPort?.postMessage(
            createSuccessMessage(
                data.transactionID,
                {
                    clientToken,
                    sessionID,
                },
                "Joined game"
            )
        );

        // clients can query for necessary data like the board, or lobby details
        // like a listing of other players in the lobby, etc

        return userID;
    } catch (error) {
        console.error(`Client ${data.clientToken} failed to join session ${sessionID}`);
        parentPort?.postMessage(
            createErrorMessage(
                data.transactionID,
                {
                    clientToken,
                    sessionID,
                },
                error.message
            )
        );
    }
};

/**
 * Sends a grid to a client and listens for a response
 * @param {string} token
 * @param {any} grid
 * @param {Set<string>} pendingClients
 * @returns {Promise<any>}
 */
const sendGrid = (token, grid, pendingClients) => {
    const transactionID = uuidv4();
    const [promise, removeListenOnce] = Router.listenOnce(transactionID); // listen first, then send
    promise.then((responseMessage) => {
        if (
            responseMessage.transactionID === transactionID &&
            responseMessage.type === RESPONSE.SUCCESS
        ) {
            const token = responseMessage.data.clientToken;
            if (!token) throw new Error("Token is not valid");
            if (pendingClients.has(token)) {
                pendingClients.delete(token);
                removeListenOnce();
                console.log(
                    `Session ${sessionID} has sent a grid to client`,
                    token,
                    "successfully"
                );
            }
        }
    });
    console.log(`Session ${sessionID} is sending a grid to client`, token);
    parentPort?.postMessage(
        createMessage(transactionID, SESSION_ACTION.POST_GRID, {
            clientToken: token,
            sessionID,
            grid,
        })
    );
    return promise;
};

/**
 * starts the game
 * @param {object} data
 */
const onStartGame = async (data) => {
    console.log(`Session ${sessionID} is starting the game`);
    const initiatorClientToken = data.clientToken;
    const initiatorUserID = ClientTokenToUserIDMap.get(initiatorClientToken);
    if (!initiatorUserID) return;
    if (initiatorUserID !== game.hostUserID) return;

    game.createGrids();

    // store grids so we dont have to get them each iteration
    const ClientTokenToGridMap = new Map();
    for (const token of ConnectedClients) {
        
        const userID = ClientTokenToUserIDMap.get(token);
        if (!userID) continue;

        const player = game.getPlayer(userID);
        if (!player) continue;

        const gridObj = game.getGrid(player);
        if (!gridObj) continue;

        const grid = gridObj.get();
        if (!grid) continue;

        ClientTokenToGridMap.set(token, grid);
        console.log(
            "Session",
            sessionID,
            "has stored a grid reference for client",
            token
        );
    }

    const timeLimit = 5000;
    const pendingClients = new Set(...ConnectedClients); // once this is empty, we can start the game

    const sendGrids = async () => {
        const promises = [];
        for (const token of pendingClients) {
            const promise = Promise.race([
                sendGrid(
                    token,
                    ClientTokenToGridMap.get(token),
                    pendingClients
                ),
                createTimer(timeLimit),
            ]);
            promises.push(promise);
        }
        return Promise.all(promises);
    };

    const result = await withRetries(sendGrids, 3, timeLimit);
    if (!result) throw new Error("Failed to send grids");
    console.log(
        `Session ${sessionID} has sent grids to all clients successfully`
    );

    // send all clients proxy grids for other players
    // await all client confirmations that grids were recieved correctly
    // if so, break,

    // provide option to host to wait again or kick non conforming players
    // send all clients response that game has started
    for (const token of ConnectedClients) {
        console.log(
            "Session",
            sessionID,
            "is sending a message to client",
            token,
            "that the game has started"
        );
        parentPort?.postMessage(
            createMessage(uuidv4(), CLIENT_ACTION.START_GAME, {
                clientToken: token,
                sessionID,
            })
        );
    }

    // start prep phase
    startPrep();
};

const startPrep = () => {
    console.log(`Session ${sessionID} is starting the prep phase`);
    for (const token of ConnectedClients) {
        parentPort?.postMessage(
            createMessage(uuidv4(), SESSION_ACTION.START_PREP, {
                clientToken: token,
                sessionID,
            })
        );
    }
};

parentPort?.on("message", (json) => {
    console.log(
        `Session ${sessionID} is recieving a message from the main thread`
    );
    if (typeof json !== "object") throw new Error("json is not an object");

    // react to client action
    if (json.type in CLIENT_ACTION) {
        switch (json.type) {
            case CLIENT_ACTION.NEW_GAME:
                console.log(
                    `Client is creating a new game on session ${sessionID}`
                );
                onNewGame(json.data);
                break;
            case CLIENT_ACTION.START_GAME:
                console.log(
                    `Client is starting a game on session ${sessionID}`
                );
                onStartGame(json.data);
                break;
            case CLIENT_ACTION.JOIN_GAME:
                console.log(`Client is joining a game on session ${sessionID}`);
                onJoinGame(json.data);
                break;
            default:
                console.log(
                    `Client is sending an unknown action to session ${sessionID}`
                );
                break;
        }
    }
});
