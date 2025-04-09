/**
 * Enum for client actions that are sent to a server
 */
export const CLIENT_ACTION = {
    NEW_GAME: "newGame",

    JOIN_GAME: "joinGame",
    LEAVE_GAME: "leaveGame",

    START_GAME: "startGame",
    
    ATTACK_POS: "attackPos",
    SUBMIT_PREP: "submitPrep",
};

/**
 * Enum for server actions that are sent to a client
 */
export const SERVER_ACTION = {
    GET_SQUARES: "sendSquares",
    GET_BOARD: "sendBoard",

    POST_SQUARES: "requestSquares",
    POST_BOARD: "requestBoard",

    START_GAME: "startGame",

    START_PREP: "startPrep",
    END_PREP: "endPrep",
    START_TURN: "startTurn",
    END_TURN: "endTurn",

    END_GAME: "endGame",
};