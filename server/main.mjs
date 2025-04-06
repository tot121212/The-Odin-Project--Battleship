import { WebSocketServer } from "ws";
import { port } from "../shared/websocket.config.mjs";

const wss = new WebSocketServer({port : port});

wss.on('connection', ws => {
    ws.on('message', message => {
        console.log(message.toString());
        ws.send("Hello client");
    });
});