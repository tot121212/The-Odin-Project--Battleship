import { parentPort, workerData } from 'worker_threads';
import { SERVER_ACTION, CLIENT_ACTION} from "../shared/enums.mjs";
import {Game} from "./battleship.mjs";

const game = new Game();
/**
 * @type {Map<string, WebSocket>} userId to websocket
 */
const users = new Map();

// session will recieve:
    // { client: { [action]: clientData } }
parentPort?.on( 'message', (json)=>{
});
