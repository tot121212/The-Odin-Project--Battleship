import { parentPort, workerData } from 'worker_threads';

import {Game} from "./battleship.mjs";

const game = new Game();
/**
 * @type {Map<string, WebSocket>} userId to websocket
 */
const users = new Map();

parentPort?.on('message', (obj)=>{
    if (obj?.client){
    }
});
