import WebSocket, { WebSocketServer } from "ws";
import { Worker } from "worker_threads";
import { port } from "../shared/websocket.config.mjs";
import { v4 as uuidv4 } from "uuid";
import { SERVER_ACTION, CLIENT_ACTION } from "../shared/enums.mjs";
import assert, { ok } from "assert";

const sessionWorkerURL = new URL("./sessionWorker.mjs");

const wss = new WebSocketServer({ port });

class Session {
    /**
     * @param {string} sessionID
     * @param {Worker} worker
     */
    constructor(sessionID = uuidv4(), worker = new Worker(sessionWorkerURL)) {
        this.worker = worker;
        this.sessionID = sessionID;
        Session.#IDToSessionMap.set(sessionID, this);
        // send postMessages to the SessionRouter when recieved
        worker.on("message", SessionRouter.onMessage);
    }

    getID(){
        return this.sessionID;
    }

    /**
     * @type {Map<string, Session>}
     */
    static #IDToSessionMap = new Map(); // sessionID to session, sessionID is to be passed to workers

    /**
     * @param {string} id
     */
    static getSessionByID(id) {
        if (typeof id !== "string") return null;
        return this.#IDToSessionMap.get(id);
    }

    /**
     * Deletes session from map using its ID
     * @param {string} sessionID
     */
    static deleteByID = (sessionID) => {
        Session.#IDToSessionMap.delete(sessionID);
    };

    destroy() {
        Session.deleteByID(this.sessionID);
    }

    /**
     * Sends json to session by ID
     * @param {string} sessionID
     * @param {object} json
     */
    static staticSend = (sessionID, json) => {
        if (!(typeof sessionID === "string") || !(json instanceof Object))
            throw new Error("sessionID and/or JSON is/are not valid");

        const session = Session.#IDToSessionMap.get(sessionID);
        if (!session) throw new Error("Session no longer exists");

        session.worker.postMessage(json);
    };

    /**
     * Sends json to session
     * @param {object} json
     */
    send = (json) => {
        this.worker.postMessage(json);
    };
}

class Client {
    /**
     * @param {WebSocket} ws
     */
    constructor(ws, token = uuidv4()) {
        this.ws = ws;
        this.token = token;
        Client.TokenToClientMap.set(token, this);
    }

    /**
     * @type {Map<string, Client>}
     */
    static TokenToClientMap = new Map(); // clientToken to client, clientToken is to be passed to workers

    /**
     * Deletes client from map using its token
     * @param {string} token
     */
    static deleteByToken = (token) => {
        Client.TokenToClientMap.delete(token);
    };

    destroy() {
        Client.deleteByToken(this.token);
    }

    /**
     * Sends json to client by token
     * @param {string} clientToken
     * @param {object} json
     */
    static staticSend = (clientToken, json) => {
        if (!(typeof clientToken === "string") || !(json instanceof Object))
            throw new Error("Client.Token and/or JSON is/are not valid");

        const client = Client.TokenToClientMap.get(clientToken);
        if (!client) throw new Error("Session no longer exists");

        client.ws.send(JSON.stringify(json));
    };

    /**
     * @param {object} json
     */
    send = (json) => {
        Client.staticSend(this.token, json);
    };
}

// Route client to session
class ClientRouter {
    /**
     * @param {WebSocket} ws
     */
    static onConnection = (ws) => {
        const client = new Client(ws);
        /**
         * @param {any} buffer
         */
        const onMessage = (buffer) => {
            if (!(buffer && buffer instanceof Buffer))
                throw new Error("Buffer is not valid");

            const message = buffer.toString();
            if (!(message && typeof message === "string"))
                throw new Error("Message is not valid");

            const json = JSON.parse(message);
            if (!(json && json instanceof Object))
                throw new Error("JSON parse is not valid");

            if (json.type !== "ClientMessage")
                throw new Error("JSON is not a client message");

            // validate here

            json.data.token = client.token; // add clients token to json

            // we should now have json that looks like this
            // { type:"newGame", data:{clientToken, sessionID, data}}

            switch (json.type) {
                case CLIENT_ACTION.NEW_GAME:
                    /**
                     * @param {Object} json
                     */
                    const onClientNewSession = (json) => {
                        const hostClientData = json.data;
                        if (
                            typeof hostClientData.clientToken !== "string" ||
                            !(hostClientData.data instanceof Object)
                        )
                            throw new Error(
                                "Host client data does not contain adequate information to create a session"
                            );

                        const session = new Session();
                        json.sessionID = session.getID();
                        
                    };
                    onClientNewSession(json);

                const onClientMessage = (json) => {
                    const sessionID = json?.data?.sessionID;
                    if (!sessionID)
                        throw new Error("sessionID not provided");
                    const session = Session.getSessionByID(sessionID);
                    if (!session)
                        throw new Error(
                            "session at sessionID does not exist"
                        );
                    session.send(json);
                };
                onClientMessage(json);
                // session will send response to user
            }
        };
        client.ws.on("message", onMessage);

        const onClose = () => {
            client.destroy();
        };
        client.ws.on("close", onClose);
    };
}

// Route session to client
class SessionRouter {
    static onMessage = (json) => {
        // which client does this json need to go to
        // send to that client
    };
}

wss.on("connection", ClientRouter.onConnection);
