/**
 * Enum for client actions that are sent to a server
 */
export const CLIENT_ACTION = {
    WS_OPEN: "WS_OPEN",

    CONNECT: "CONNECT",
    DISCONNECT: "DISCONNECT",

    NEW_GAME: "NEW_GAME",

    JOIN_GAME: "JOIN_GAME",
    LEAVE_GAME: "LEAVE_GAME",

    START_GAME: "Client.StartGame",
    
    ATTACK_POS: "Client.AttackPos",
    SUBMIT_PREP: "Client.SubmitPrep",
};

/**
 * Enum for server actions that are sent to a client
 */
export const SESSION_ACTION = {
    GET_SQUARES: "GET_SQUARES",
    GET_GRID: "GET_GRID",

    POST_SQUARES: "POST_SQUARES",
    POST_GRID: "POST_GRID",
    POST_PROXY_GRID: "POST_PROXY_GRID",

    START_PREP: "START_PREP",
    END_PREP: "END_PREP",
    START_TURN: "START_TURN",
    END_TURN: "END_TURN",

    END_GAME: "END_GAME",
};

export const SERVER_ACTION = {
    SEND_CLIENT_TOKEN: "SEND_CLIENT_TOKEN",
    CLOSE_SESSION: "CLOSE_SESSION",
}

export const RESPONSE = {
    SUCCESS: "SUCCESS",
    ERROR: "ERROR",
}

export const ALL_ENUMS = {
    ...SESSION_ACTION,
    ...CLIENT_ACTION,
    ...SERVER_ACTION,
    ...RESPONSE,
}

Object.freeze(CLIENT_ACTION);
Object.freeze(SESSION_ACTION);
Object.freeze(SERVER_ACTION);
Object.freeze(RESPONSE);

Object.freeze(ALL_ENUMS);
