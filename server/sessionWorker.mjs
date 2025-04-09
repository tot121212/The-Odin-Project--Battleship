import { parentPort, workerData } from 'worker_threads';
import { SERVER_ACTION, CLIENT_ACTION} from "../shared/enums.mjs";
import {Game} from "./battleship.mjs";

const game = new Game();
/**
 * @type {Map<string, string>} User to ClientToken Map
 */
const UserToClientTokenMap = new Map();

// session will recieve:
    // { type:CLIENT_ACTION.JOIN_GAME { clientToken, ...data } }
parentPort?.on('message', (json)=>{
    // if type:joinGame 
        // store client token
        // add as user to game
        // map user to client
});

// get client from UserToClientMap
parentPort?.postMessage({JASON_BOURNE: 0});