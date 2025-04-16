import { port } from "../../shared/websocket.config.mjs";
import { v4 as uuidv4 } from "uuid";

import { createMessage } from "../../shared/utils.shared.mjs";
import {
    CLIENT_ACTION,
    SERVER_ACTION,
    RESPONSE,
} from "../../shared/enums.shared.mjs";

import "./css-reset.css";
import "./style.css";

import { DOM } from "./DOM.mjs";

const newUser = () => {
    console.log("Creating new user");
    const user = {
        privateID: uuidv4(),
    };
    Object.freeze(user);
    localStorage.setItem("user", JSON.stringify(user));
    return user;
};

const getLocalUser = () => {
    const user = localStorage.getItem("user");
    let parsedUser;
    if (!user) 
        parsedUser = newUser();
    else 
        parsedUser = JSON.parse(user);
    console.log("User:", parsedUser, "loaded from local storage");
    return parsedUser;
};

export const UserInfo = {
    user: getLocalUser(),
    /**
     * @type {string|undefined}
     */
    clientToken: undefined,
}

/**
 * Maps global enums to functions specified by using,
 * EnumToFunctionMap.set(ENUM, Function);
 * @type {Map<string, function>}
 */
const EnumToFunctionMap = new Map();

/**
 * Gets the function from the enum
 * @param {string} type
 * @returns {function|null}
 */
const getFunctionFromEnum = (type) => {
    const f = EnumToFunctionMap.get(type);
    if (!f) return null;
    return f;
};

export class Router {
    /**
     * @type {WebSocket}
     */
    static socket;

    static connectToWSS() {
        console.log("Connecting to WSS");
        Router.socket = new WebSocket(`ws://localhost:${port}/myws`);
        Router.socket.onerror = () => {
            console.log("Error connecting to WSS");
            setTimeout(() => {
                Router.connectToWSS();
            }, 1000);
        };
        Router.socket.onopen = () => {
            console.log("Socket is open");
            Router.socket?.addEventListener("message", Router.onMessage);
        };
    }

    /**
     * On recieve client token, send connect message to server
     * @param {object} message
     */
    static onRecieveClientToken(message) {
        console.log("Recieved a client token");
        if (UserInfo.clientToken) {
            console.warn("Client token already set");
            return;
        }
        const token = message.data.clientToken;
        if (!token || typeof token !== "string") {
            console.warn("Client token is not valid");
            return;
        }
        UserInfo.clientToken = token;
        console.log("Client token set to:", UserInfo.clientToken);
        
        
        const json = JSON.stringify(
            createMessage(uuidv4(), CLIENT_ACTION.CONNECT, {
                clientToken: UserInfo.clientToken,
                userPrivateID: UserInfo.user.privateID,
            })
        );
        console.log("Sending user information back to server");
        Router.socket?.send(json);
    }
    static {
        EnumToFunctionMap.set(
            SERVER_ACTION.SEND_CLIENT_TOKEN,
            Router.onRecieveClientToken
        );
    }

    /**
     * On server message
     * @param {MessageEvent} messageEvent
     */
    static onMessage(messageEvent) {
        const unparsedMessage = messageEvent.data;
        const message = JSON.parse(unparsedMessage);
        if (!message || typeof message !== "object") return;
        const type = message.type;
        const f = getFunctionFromEnum(type);
        if (!f) return;
        console.log("Recieved message type: ", type);
        f(message);
    }
}

let dom;
document.addEventListener("DOMContentLoaded", (e) => {
    console.log("Page loaded");
    dom = new DOM();
    Router.connectToWSS();
    dom.init();
});