import WebSocket, { WebSocketServer } from "ws";
import { Worker } from "worker_threads";
import { port } from "../shared/websocket.config.mjs";
import { v4 as uuidv4 } from "uuid";
import {
    SESSION_ACTIONS,
    USER_ACTIONS,
} from "../shared/enums.mjs";

const sessionWorkerURL = new URL("./sessionWorker.mjs");

const wss = new WebSocketServer({ port });

/**
 * @type {Map<string, WebSocket>}
 */
const clients = new Map(); // clientID to client, clientID is to be passed to workers

/**
 * @type {Map<string, Worker>}
 */
const sessions = new Map(); // sessionID to session, sessionID is to be passed to workers

/**
 * Creates a new session and returns the sessionID
 * @param {Worker} worker
 * @param {string} sessionID
 * @returns {String} sessionID
 */
const createSession = (
    worker = new Worker(sessionWorkerURL),
    sessionID = uuidv4()
) => {
    sessions.set(sessionID, worker);
    if (!worker || !sessionID) throw new Error("Session could not be created");
    return sessionID;
};

/**
 * Deletes session from map using its ID
 * @param {string} sessionID
 */
const deleteSession = (sessionID) => {
    sessions.delete(sessionID);
};

/**
 * @param {string} sessionID
 * @param {string} action
 * @param {object} clientData
 */
const sendToSession = (sessionID, action, clientData) => {
    const session = sessions.get(sessionID);
    if (!session) throw new Error("Session no longer exists");

    session.postMessage({ client: { [action]: clientData } });
};

/**
 * @param {string} clientID
 * @param {string} action
 * @param {object} sessionData
 */
const sendToClient = (clientID, action, sessionData) => {
    const client = clients.get(clientID);
    if (!client) throw new Error("Client no longer exists");

    client.send(JSON.stringify({ server: { [action]: sessionData } }));
};

class ClientActionHandler {
    /**
     * Creates a new session and connects the initial client
     * @param {object} clientData
     */
    static onStartGame = (clientData) => {
        const sessionID = createSession();
        const clientID = clientData.clientID;
        if (typeof sessionID !== "string" || typeof clientID !== "string") return;

        sendToSession(sessionID, USER_ACTIONS.JOIN_GAME, clientData); // send host data to new session
    };

    static handlers = {
        startGame: ClientActionHandler.onStartGame
    }

    /**
     * @param {string} action 
     * @param {object} clientData 
     */
    static handleAction = (action, clientData)=>{
        if (ClientActionHandler.handlers[action]){
            ClientActionHandler.handlers[action](clientData);
        } else {
            console.error("Action not found");
        }
    }
}

/**
 * Parses json from client and sends to appropriate handler with the action specified
 * This way we can send signals to existing games and start new ones without issues
 * @param {object} clientID
 * @param {object} json
 */
const onJSON = (clientID, json) => {
    if (!json || typeof json !== "object") return; // cant do anything without json

    const { data, action } = json; // destructure data from json
    if (!data || !action) return;

    const clientData = { clientID, ...data }; // reconstruct including the clientID

    ClientActionHandler.handleAction(action, clientData);
};

wss.on("connection", (client) => {
    const clientID = uuidv4();
    clients.set(clientID, client);

    client.on("message", (buffer) => {
        if (!(buffer && buffer instanceof Buffer))
            throw new Error("Buffer is not valid");

        const message = buffer.toString();
        if (!(message && typeof message === "string"))
            throw new Error("Message is not valid");

        const json = JSON.parse(message);
        if (!(json && json instanceof Object))
            throw new Error("JSON parse is not valid");

        onJSON(clientID, json);
    });

    wss.on("close", () => {
        // clear client from db
        clients.delete(clientID); // deref client in clients list
    });
});