import WebSocket, { WebSocketServer } from "ws";
import { Worker } from "worker_threads";
import { port } from "../shared/websocket.config.mjs";
import { v4 as uuidv4 } from "uuid";
import {
    SERVER_ACTION,
    CLIENT_ACTION,
    SESSION_ACTION,
    RESPONSE,
} from "../shared/enums.shared.mjs";
import {
    createMessage,
    createSuccessMessage,
    createErrorMessage,
} from "../shared/utils.shared.mjs";
const sessionWorkerPath = "./sessionWorker.mjs";

const WSS = new WebSocketServer({ port });

class Session {
    constructor(
        sessionID = uuidv4(),
        worker = new Worker(sessionWorkerPath, {
            workerData: {
                sessionID: this.sessionID,
            },
        })
    ) {
        this.sessionID = sessionID;
        this.worker = worker;
        this.clients = new Set();
    }

    getID = () => {
        return this.sessionID;
    };

    getWorker = () => {
        return this.worker;
    };
}

/**
 * Handles session instances and send/recieve messages to/from them
 */
class SessionHandler {
    /**
     * Session ID to Session
     * @type {Map<string, Session>}
     */
    static #SessionIDToSessionMap = new Map();

    /**
     * Check if session exists
     * @param {string} sessionID
     * @returns {boolean}
     */
    static has = (sessionID) => {
        return SessionHandler.#SessionIDToSessionMap.has(sessionID);
    };

    /**
     * Get session by session ID
     * @param {string} sessionID
     * @returns {Session|undefined}
     */
    static get = (sessionID) => {
        return SessionHandler.#SessionIDToSessionMap.get(sessionID);
    };

    /**
     * Set session by session ID
     * @param {string} sessionID
     * @param {Session} session
     */
    static set = (sessionID, session) => {
        SessionHandler.#SessionIDToSessionMap.set(sessionID, session);
    };

    /**
     * Remove session by session ID
     * @param {string} sessionID
     */
    static remove = (sessionID) => {
        SessionHandler.#SessionIDToSessionMap.delete(sessionID);
    };

    /**
     * Creates a new session
     * @returns {string|undefined} sessionID
     */
    static create = () => {
        console.log("Creating session");
        const session = new Session();
        const sessionID = session.getID();
        SessionHandler.set(sessionID, session);
        session.getWorker().on("message", SessionHandler.recieve);
        return sessionID;
    };

    /**
     * Deletes session using its ID
     * @param {string} sessionID
     */
    static delete = (sessionID) => {
        console.log("Deleting session");
        const session = SessionHandler.get(sessionID);
        if (!session) throw new Error("Session no longer exists");
        session.getWorker().terminate();
        SessionHandler.remove(sessionID);
    };

    /**
     * Sends data to session by ID, returns true if successful
     * @param {string} sessionID
     * @param {object} message
     * @returns {boolean}
     */
    static send = (sessionID, message) => {
        console.log("Sending to session");
        if (!(typeof sessionID === "string") || !(message instanceof Object))
            return false;

        const session = SessionHandler.get(sessionID);
        if (!session) return false;

        session.getWorker().postMessage(message);
        return true;
    };

    /**
     * On message from session
     * @param {object} message
     */
    static recieve = (message) => {
        console.log("Recieving from session");
        if (!(message instanceof Object))
            throw new Error("Message is not valid");
        const clientToken = message.data.clientToken;
        if (clientToken) {
            const client = ClientHandler.get(clientToken);
            if (!client) throw new Error("Client no longer exists");
            ClientHandler.send(clientToken, message);
        }
    };
}

class Client {
    /**
     * @param {WebSocket} ws
     * @param {string} token
     */
    constructor(ws, token = uuidv4()) {
        this.ws = ws;
        this.token = token;
        this.connectedSessions = new Set();
    }

    getWS = () => {
        return this.ws;
    };

    getToken = () => {
        return this.token;
    };

    /**
     * Sends message to client
     * @param {object} message
     */
    send = (message) => {
        this.ws.send(JSON.stringify(message));
    };

    /**
     * Add session to client
     * @param {string} sessionID
     */
    addSession = (sessionID) => {
        if (typeof sessionID !== "string")
            throw new Error("sessionID is not valid");
        this.connectedSessions.add(sessionID);
    };

    /**
     * Remove session from client
     * @param {string} sessionID
     */
    removeSession = (sessionID) => {
        if (typeof sessionID !== "string")
            throw new Error("sessionID is not valid");
        this.connectedSessions.delete(sessionID);
    };

    /**
     * Get all sessions of client
     * @returns {Set<string>} sessionIDs
     */
    getSessions = () => {
        return this.connectedSessions;
    };
}

// Handles client connections
class ClientHandler {
    /**
     * @type {Map<string, Client>}
     */
    static #ClientTokenToClientMap = new Map(); // clientToken to client, clientToken is to be passed to workers

    /**
     * Get client by client token
     * @param {string} clientToken
     * @returns {Client|undefined}
     */
    static get = (clientToken) => {
        return ClientHandler.#ClientTokenToClientMap.get(clientToken);
    };

    /**
     * Set client
     * @param {string} clientToken
     * @param {Client} client
     */
    static set = (clientToken, client) => {
        ClientHandler.#ClientTokenToClientMap.set(clientToken, client);
    };

    /**
     * Remove client
     * @param {string} clientToken
     */
    static remove = (clientToken) => {
        ClientHandler.#ClientTokenToClientMap.delete(clientToken);
    };

    /**
     * Check if client exists
     * @param {string} clientToken
     * @returns {boolean}
     */
    static has = (clientToken) => {
        return ClientHandler.#ClientTokenToClientMap.has(clientToken);
    };

    
    /**
     * Creates a new client
     * @param {WebSocket} ws
     * @param {string} token
     * @returns {string} token
     */
    static create = (ws, token = uuidv4()) => {
        console.log("Creating client");
        const client = new Client(ws, token);
        ClientHandler.set(token, client);
        return token;
    };

    /**
     * Sends message to client by token, make sure to include clientToken in message itself
     * @param {string} clientToken
     * @param {object} message
     */
    static send = (clientToken, message) => {
        
        if (!(typeof clientToken === "string") || !(message instanceof Object))
            throw new Error("Client.Token and/or JSON is/are not valid");

        const client = ClientHandler.get(clientToken);
        if (!client) throw new Error("Session no longer exists");

        console.log("Sending to client: ", clientToken, "\nmessage: ", message);
        client.ws.send(JSON.stringify(message));
    };

    // /**
    //  * Recieves message from client
    //  * @param {object} message
    //  */
    // static recieve = (message) => {
    //     if (!(message instanceof Object)) throw new Error("Message is not valid");

    //     if (message.data.clientToken){
    //         const client = ClientHandler.get(message.data.clientToken);
    //         if (!client) throw new Error("Client no longer exists");

    //         SessionHandler.send(message.data.sessionID, message);
    //     } else if (message.data.sessionID){
    //         const session = SessionHandler.get(message.data.sessionID);
    //         if (!session) throw new Error("Session no longer exists");

    //         session.send(message);
    //     } else {
    //         throw new Error("Message is not valid");
    //     }
    // }

    /**
     * @param {WebSocket} ws
     */
    static onWSSConnection = (ws) => {
        console.log("A client has connected");

        const clientToken = ClientHandler.create(ws);
        if (!clientToken) throw new Error("Client token is not valid");

        console.log("Client token created:", clientToken);

        const client = ClientHandler.get(clientToken);
        if (!client) throw new Error("Client no longer exists");

        // send client token to client
        ClientHandler.send(
            clientToken,
            createMessage(
                uuidv4(),
                SERVER_ACTION.SEND_CLIENT_TOKEN,
                {
                    clientToken: clientToken,
                },
            )
        );

        client.ws.on("message", ClientHandler.onWSMessage);
        client.ws.on("close", () => ClientHandler.onWSClose(clientToken));
    };

    /**
     * Route ws messages to either server or session
     * @param {any} buffer
     */
    static onWSMessage = (buffer) => {
        console.log("Recieving message from client");
        try {
            const json = ClientHandler.convertBufferToJSON(buffer);
            if (!json) throw new Error("JSON is not valid");

            switch (json.type) {
                // Case for if client starts new game
                case CLIENT_ACTION.NEW_GAME:
                case CLIENT_ACTION.JOIN_GAME:
                case CLIENT_ACTION.LEAVE_GAME:
                    ClientHandler.onWSSendToServer(json);
                    break;
                case CLIENT_ACTION.DISCONNECT: // permeate disconnect to all sessions of client
                    ClientHandler.onWSSendToSession(json);
                    ClientHandler.remove(json.data.clientToken);
                    break;
                case CLIENT_ACTION.CONNECT:
                    ClientHandler.onWSSendToServer(json);
                    break;
                default:
                    throw new Error("Invalid message type");
            }
        } catch (error) {
            console.error(error);
        }
    };

    /**
     * Deletes client and permeates through to all sessions that the client is in
     * @param {string} clientToken
     */
    static onWSClose = (clientToken) => {
        console.log("Client has disconnected");
        const client = ClientHandler.get(clientToken);
        if (!client) throw new Error("Client no longer exists");

        for (const sessionID of client.getSessions()) {
            ClientHandler.onWSMessage({
                type: CLIENT_ACTION.LEAVE_GAME,
                data: {
                    clientToken,
                    sessionID,
                },
            });
        }
    };

    /**
     * Converts buffer to JSON
     * @param {Buffer} buffer
     * @returns {Object} json
     */
    static convertBufferToJSON = (buffer) => {
        console.log("Converting buffer to JSON");
        try {
            if (!(buffer && buffer instanceof Buffer))
                throw new Error("Buffer is not valid");

            const message = buffer.toString();
            if (!(message && typeof message === "string"))
                throw new Error("Message is not valid");

            const json = JSON.parse(message);
            if (!(json && json instanceof Object))
                throw new Error("JSON parse is not valid");
            return json;
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    /**
     * On client send message to server
     * @param {object} json
     */
    static onWSSendToServer = (json) => {
        console.log("A client is sending a message to the server");
        const clientToken = json.data.clientToken;
        if (!clientToken){
            console.error("clientToken not provided");
            return;
        }
        const client = ClientHandler.get(clientToken);
        if (!client){
            console.error("Client does not exist");
            return;
        }

        switch (json.type) {
            // Case for if client starts new game
            case CLIENT_ACTION.NEW_GAME:
                ClientHandler.onWSNewSession(json);
                break;
            case CLIENT_ACTION.JOIN_GAME:
                ClientHandler.onWSJoinSession(json);
                break;
        }
    };

    /**
     * On client send message to session
     * @param {object} json
     */
    static onWSSendToSession = (json) => {
        console.log("A client is sending a message to a session");
        const sessionID = json?.data?.sessionID;
        if (!sessionID) throw new Error("sessionID not provided");
        SessionHandler.send(sessionID, json);
    };

    /**
     * On client send message to server to create a new session
     * @param {Object} json
     */
    static onWSNewSession = (json) => {
        console.log("A client is creating a new session");
        const transactionID = json.transactionID;
        if (!transactionID) throw new Error("transactionID not provided");

        const clientToken = json.data.clientToken;
        if (!clientToken) throw new Error("clientToken not provided");
        if (!ClientHandler.has(clientToken))
            throw new Error("client not found");

        const sessionID = json.data.sessionID;
        if (!sessionID) throw new Error("sessionID not provided");
        if (!SessionHandler.has(sessionID))
            throw new Error("session not found");

        // send sessionID back to client because they need it to join in the first place
        ClientHandler.send(
            clientToken,
            createSuccessMessage(
                transactionID,
                {
                    responseTo: CLIENT_ACTION.NEW_GAME,
                    clientToken,
                    sessionID,
                },
                "Session created successfully"
            )
        );
        const client = ClientHandler.get(clientToken);
        if (!client) throw new Error("Client no longer exists");
        client.addSession(sessionID);
    };

    /**
     * On client message server to join specific session
     * @param {object} json
     */
    static onWSJoinSession = (json) => {
        try {
            console.log("A client is joining a session");
            const transactionID = json.transactionID;
            if (!transactionID) throw new Error("Transaction ID not provided");

            const clientToken = json.data.clientToken;
            if (!clientToken) throw new Error("Client token not provided");
            if (!ClientHandler.has(clientToken))
                throw new Error("Client not found");

            const sessionID = json.data.sessionID;
            if (!sessionID) throw new Error("Session ID not provided");
            if (!SessionHandler.has(sessionID))
                throw new Error("Session not found");

            // tell session a player wants to join
            SessionHandler.send(
                sessionID,
                createMessage(transactionID, CLIENT_ACTION.JOIN_GAME, {
                    clientToken,
                    // session doesn't need its own ID, so we dont need to send it
                }) // session will send response to user through SessionHandler
            );
        } catch (error) {
            console.error(error);
        }
    };
}

WSS.on("connection", ClientHandler.onWSSConnection);
