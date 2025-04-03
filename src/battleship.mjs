import { v4 as uuidv4 } from "uuid";

import { DOM } from "./DOM.mjs";
import LinkedListQueue from "./llq.mjs";

import { Chance } from "chance";
const chance = new Chance();

import Vector2 from "./vector2.mjs";

const DIRECTION = {
    HORIZ: {
        LEFT: new Vector2(-1, 0),
        RIGHT: new Vector2(1, 0),
    },
    VERT: {
        DOWN: new Vector2(0, -1),
        UP: new Vector2(0, 1),
    },
    DIAG: {
        UP_LEFT: new Vector2(-1, -1),
        UP_RIGHT: new Vector2(1, -1),
        DOWN_LEFT: new Vector2(-1, 1),
        DOWN_RIGHT: new Vector2(1, 1),
    },
    getHorizVert: () => {
        return Object.values(DIRECTION.HORIZ).concat(
            Object.values(DIRECTION.VERT)
        );
    },
    getDiag: () => {
        return Object.values(DIRECTION.DIAG);
    },
    get: () => {
        return Object.values(DIRECTION.HORIZ)
            .concat(Object.values(DIRECTION.VERT))
            .concat(Object.values(DIRECTION.DIAG));
    },
};

// node representing a square of a ship
export class ShipPart {
    /**
     *
     * @param {Ship} parent
     */
    constructor(parent) {
        this.parent = parent;
    }

    hit() {
        if (!this.parent) throw new Error("No parent on ShipPart");
        this.parent.hit(this);
    }
}

// composition > inheritence
// to hit a ship we would go into the grid and search for a ship part thats there, and hit it
// ship thats part of a fleet
export class Ship {
    /**
     *
     * @param {number} length
     * @param {Vector2} face
     * @param {boolean} shouldCreateParts
     */
    constructor(
        length = 1,
        face = new Vector2(1, 0),
        shouldCreateParts = false
    ) {
        this.head = null; // head of the ship
        this.parts = new Set();
        this.damagedParts = new Set();
        this.face = face;
        /**
         * @type {Map<ShipPart, Vector2>}
         */
        this.partLocalPosMap = new Map(); // map of ship part to its local coordinate in layout of ship
        if (shouldCreateParts) this.createParts(length);
    }

    reset() {
        this.damagedParts.clear();
    }

    /**
     *
     * @param {number} length
     */
    createParts(length) {
        if (length <= 0) throw new Error("Ship length is invalid");
        this.parts = new Set();
        const headPart = new ShipPart(this);
        this.parts.add(headPart);
        this.partLocalPosMap.set(headPart, new Vector2(0, 0));
        this.head = headPart; // Initialize head before the loop
        if (length <= 1) return; // No need to create more parts if length is 1
        for (let i = 1; i < length; i++) {
            const newPart = new ShipPart(this);
            this.parts.add(newPart);
            this.partLocalPosMap.set(newPart, new Vector2(0, i));
        }
    }

    /**
     * Randomizes the face of the ship, either x or y,
     * Mutates the face of the ship and returns the new face
     * @returns {Vector2}
     * @example
     * const ship = new Ship();
     * const face = ship.face; // returns Vector2(1, 0)
     * ship.randomizeFace(); // returns a new face
     * face !== ship.face; // true because the face was mutated, vector2 is a reference type
     */
    randomizeFace() {
        if (!(this.face instanceof Vector2))
            throw new Error("Face is not a vector2");
        const XOrY = chance.integer({ min: 0, max: 1 });
        let randomFace = chance.integer({ min: 0, max: 1 });
        randomFace = randomFace ? -1 : 1;
        if (XOrY === 0) {
            this.face = new Vector2(randomFace, 0);
        } else {
            this.face = new Vector2(0, randomFace);
        }
        return this.face;
    }

    /**
     *
     * @param {ShipPart} part
     */
    hit(part) {
        this.damagedParts.add(part);
    }

    isSunk() {
        return this.damagedParts.size >= this.parts.size;
    }
}

// This is for if I want to add special powers to ships in the future

export class AircraftCarrier extends Ship {
    constructor(length = 5, face = undefined) {
        super(length, face);
        this.createParts(length);
    }
}
export class Battleship extends Ship {
    constructor(length = 4, face = undefined) {
        super(length, face);
        this.createParts(length);
    }
}
export class Cruiser extends Ship {
    constructor(length = 3, face = undefined) {
        super(length, face);
        this.createParts(length);
    }
}
export class Submarine extends Ship {
    constructor(length = 3, face = undefined) {
        super(length, face);
        this.createParts(length);
    }
}
export class Destroyer extends Ship {
    constructor(length = 2, face = undefined) {
        super(length, face);
        this.createParts(length);
    }
}

export class Fleet {
    /**
     *
     * @param {Ship[]} ships
     */
    constructor(
        ships = [
            new AircraftCarrier(),
            new Battleship(),
            new Cruiser(),
            new Submarine(),
            new Destroyer(),
        ]
    ) {
        this.ships = ships;
    }
}

export class Square {
    /**
     *
     * @param {Vector2|undefined} pos
     */
    constructor(pos) {
        /**
         * @type {Vector2|Undefined}
         */
        this.pos = pos;
        this.wasShot = false;
        /**
         * @type {Set<ShipPart>}
         */
        this.shipParts = new Set(); // we can call methods on the parts parent, so very nice
    }

    reset() {
        this.wasShot = false;
        this.shipParts.clear();
    }

    hasShipParts() {
        if (this.shipParts.size > 0) return true;
        return false;
    }

    /**
     *
     * @param {ShipPart} part
     */
    addShipPart(part) {
        this.shipParts.add(part);
    }

    /**
     *
     * @param {ShipPart} part
     */
    removeShipPart(part) {
        this.shipParts.delete(part);
    }

    attackShipParts() {
        if (this.wasShot === true) return false;
        this.wasShot = true;
        for (const part of this.shipParts) {
            part.hit();
        }
        return true;
    }
}

export class Grid {
    /**
     *
     * @param {number} gridSize
     */
    constructor(gridSize) {
        this.size = gridSize;
        this.grid = this.newGrid();
    }

    /**
     * @returns {Square[][]}
     */
    newGrid() {
        const grid = [];
        for (let i = 0; i < this.size; i++) {
            const row = [];
            for (let j = 0; j < this.size; j++) {
                row.push(new Square(new Vector2(i, j)));
            }
            grid.push(row);
        }
        return grid;
    }

    /**
     * Gets the grid
     * @returns {Square[][]}
     */
    get() {
        return this.grid;
    }

    /**
     * Flattens the grid and returns a new array of squares
     * @returns {Square[]}
     */
    flatten() {
        const oldArr = this.get();
        const newArr = [];
        for (const arr of oldArr) {
            newArr.push(...arr);
        }
        return newArr;
    }

    /**
     * Gets grid as an array of vector2, the vector2s are referenced from the squares
     * @returns {Vector2[]}
     */
    // getAsVector2(){
    //     return this.flatten().map((sqr)=>{
    //         return sqr.pos;
    //     });
    // }

    // these are inefficient but ill probably add a map later for occupied squares
    /**
     * Gets all squares occupied by **ShipPart**(s)
     * @returns {Square[]}
     */
    getOccupiedSquares() {
        return this.flatten().filter((sqr) => {
            return sqr.hasShipParts();
        });
    }

    /**
     * Gets all squares not occupied by **ShipPart**(s)
     * @returns {Square[]}
     */
    getUnoccupiedSquares() {
        return this.flatten().filter((sqr) => !sqr.hasShipParts());
    }

    /**
     * Gets all squares not occupied by **ShipPart**(s) shuffled randomly
     * @returns {Square[]}
     */
    getShuffledUnoccupiedSquares() {
        const unoccupiedSquares = this.getUnoccupiedSquares();
        return chance.shuffle(unoccupiedSquares);
    }

    /**
     * Gets square at 'grid[globalPos.x][globalPos.y]'
     * @param {Vector2} globalPos - Two element array containing x and y
     * @returns {Square|null} Square on grid
     */
    getSquare(globalPos) {
        if (
            globalPos &&
            globalPos instanceof Vector2 &&
            this.grid &&
            globalPos.x >= 0 &&
            globalPos.x < this.grid.length &&
            globalPos.y >= 0 &&
            globalPos.y < this.grid[globalPos.x].length
        ) {
            return this.grid[globalPos.x][globalPos.y];
        }
        return null;
    }

    /**
     * Place ship, from pos, towards the opposite direction of the ship.face vector, by the ship.length, ensuring that the grid at those positions is valid
     * @param {Ship} ship
     * @param {Vector2} startingPos
     * @returns {boolean|Error}
     */
    placeShip(ship, startingPos) {
        if (!(ship && startingPos))
            return new Error("Ship, grid, or pos missing");
        const randFace = ship.randomizeFace();
        if (!randFace) throw new Error("Random face not found");
        /**
         * @type {Map<ShipPart, Square>}
         */
        const partToSquare = new Map();

        for (const part of ship.parts) {
            const partLocalPos = ship.partLocalPosMap.get(part); // get local pos of part
            if (!partLocalPos) throw new Error("Part local pos not found"); // throw because we dont expect part to not have a local pos

            const transform = partLocalPos.transform(randFace);
            if (!transform) throw new Error("Transform not found");

            const partGlobalPos = startingPos.add(transform);
            if (!partGlobalPos) throw new Error("Part global pos not found");

            const square = this.getSquare(partGlobalPos);
            if (!square) return false;
            if (square.hasShipParts()) return false;
            partToSquare.set(part, square);
        }
        // after partToSquare is mapped fully, we know that all squares exist and dont already have ships on them
        for (const [part, square] of partToSquare) {
            square.addShipPart(part);
        }
        console.log(
            "Placed ship at ",
            startingPos,
            " with parts ",
            partToSquare
        );
        return true;
    }

    /**
     * Places **ship** at a random position on the **grid**,
     * mutating (popping from) **unoccupiedSquares** in the process,
     * returns the square the head of the ship was placed
     * ***IMPORTANT:*** input a shuffled array of unoccupied squares, it will attempt to shuffle them every operation if you dont
     * @param {Ship} ship
     * @param {Square[]} unoccupiedSquares
     * @returns {Square|null}
     */
    placeShipRandomly(ship, unoccupiedSquares) {
        if (!(ship instanceof Ship)) return null;
        if (unoccupiedSquares.length <= 0) return null;
        for (const unoccupiedSquare of unoccupiedSquares) {
            if (!unoccupiedSquare?.pos) continue;
            if (this.placeShip(ship, unoccupiedSquare.pos) === true)
                return unoccupiedSquare; // square is now occupied
        }
        return null;
    }

    /**
     * Gets existing adjacent positions to a given position
     * @param {Vector2} pos
     * @return {Vector2[]}
     */
    getAdjacentPositions(pos) {
        const acc = [];
        if (!pos || !(pos instanceof Vector2)) return acc;
        for (const vec of DIRECTION.getHorizVert()) {
            const globalPos = pos.add(vec);
            if (!globalPos) continue;
            if (!this.getSquare(globalPos)) continue;
            acc.push(globalPos);
        }
        return acc;
    }

    /**
     * Gets existing adjacent squares to a given square
     * @param {Square} square
     * @return {Square[]}
     */
    getAdjacentSquares(square) {
        const acc = [];
        if (!square || !(square instanceof Square)) return acc;
        for (const vec of DIRECTION.getHorizVert()) {
            const globalPos = square.pos?.add(vec);
            if (!globalPos) continue;
            const sqr = this.getSquare(globalPos);
            if (!sqr) continue;
            acc.push(sqr);
        }
        return acc;
    }

    getSize() {
        return this.size;
    }

    /**
     *
     * @param {Vector2} pos
     * @returns {boolean}
     */
    attackPos(pos) {
        const square = this.getSquare(pos);
        if (square) return square.attackShipParts();
        return false;
    }

    /**
     * Search for a square until we find one that isn't already hit, for maxIter amt of times
     * @param {Vector2} pos
     * @param {number} maxIter
     * @returns {Vector2|null}
     */
    attackPosRecurse(pos, maxIter = 3) {
        if (!(pos instanceof Vector2) || typeof maxIter !== "number")
            return null;
        if (maxIter < 0) return null;

        const queue = new LinkedListQueue();
        if (!(queue instanceof LinkedListQueue)) return null;

        let curIter = 0;
        let prevChecks = new Set();
        queue.enqueue(pos, null);
        while (queue.length > 0 && curIter < maxIter) {
            const curPos = queue.dequeue();
            if (curPos === null) {
                curIter += 1;
                continue;
            }

            if (prevChecks.has(curPos)) continue;
            else prevChecks.add(curPos);

            if (!this.attackPos(curPos))
                queue.enqueue(this.getAdjacentPositions(curPos));
            return curPos;
        }
        return null;
    }

    /**
     *
     * @returns {boolean}
     */
    attackRandomly() {
        const lastIdx = this.size - 1;
        const pos = new Vector2(
            chance.integer({ min: 0, max: lastIdx }),
            chance.integer({ min: 0, max: lastIdx })
        );
        if (!this.attackPosRecurse(pos)) return false; // square was not shot
        return true; // square was shot
    }
}

export class User {
    /**
     *
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
    }
}

export class Bot {
    /**
     *
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
    }
}

export class Player {
    // player is only used when a game starts so it doesnt inherit nor become inherited either
    /**
     *
     * @param {User|Bot} parent
     */

    constructor(parent) {
        this.parent = parent;
        /**
         * @type {string}
         */
        this.uuid = uuidv4(); // basically will generate a new unique id for each session of play
        /**
         * @type {string}
         */
        this.name = parent.name;
        /**
         * @type {Fleet}
         */
        this.fleet = new Fleet(); // stores roots of ships
        /**
         * @type {boolean}
         */
        this.ready = false;

        this.attackPos = null; // position to attack in play phase
    }

    getUUID() {
        return this.uuid;
    }

    isReady(){
        return this.ready;
    }

    /**
     * 
     * @param {boolean} bool 
     */
    setReady(bool){
        if (bool){
            this.ready = true;
        } else {
            this.ready = false;
        }
    }
}

export class Game {
    /**
     * @param {User} host Main user of game
     * @param {number} amtOfBots Amount of bot players
     * @param {number} gridSize Size of grid as a num, x * x
     * @param {boolean} randomize Should the ship layouts be randomized at start
     */
    constructor(
        host,
        amtOfBots = 1,
        gridSize = 10,
        randomize = true,
        prepPhaseTime = 20000,
        playerTurnLength = 10000
    ) {
        this.host = host;

        this.gridSize = gridSize;
        this.randomize = randomize;

        this.users = [host];
        this.amtOfBots = amtOfBots;
        this.bots = this.createBots();

        /**
         * @type {Map<Player, Grid>}
         */
        this.playerGridMap = new Map();
        this.uuidPlayerMap = new Map();
        this.players = this.createPlayers();
        this.grids = this.createGrids();

        this.prepPhaseTime = prepPhaseTime;
        this.playerTurnLength = playerTurnLength;
    }

    /**
     * Reset game board after a finished session
     */
    reset() {
        this.grids.forEach((grid) => {
            grid.get().forEach((row) => {
                row.forEach((sqr) => {
                    sqr.reset();
                });
            });
        });
        this.players.forEach((player) => {
            player.fleet.ships.forEach((ship) => {
                ship.reset();
            });
        });
    }

    hasUsers() {
        return this.users.length > 0;
    }

    /**
     * @returns {Bot[]}
     */
    createBots() {
        let bots = [];
        for (let i = 0; i < this.amtOfBots; i++) {
            bots.push(new Bot(`Bot ${i + 1}`)); // Create a new Bot instance and add it to the array
        }
        return bots;
    }

    /**
     * @returns {Player[]}
     */
    createPlayers() {
        return this.users.concat(this.bots).map((p) => {
            const player = new Player(p);
            this.uuidPlayerMap.set(player.getUUID(), player);
            return player;
        });
    }

    /**
     * Creates grids for each player, mapping them to a hashmap of the player and its grid
     * @returns {Grid[]}
     */
    createGrids() {
        return this.players.map(
            /**
             *
             * @param {Player} player
             * @returns
             */
            (player) => {
                const grid = new Grid(this.gridSize);
                this.playerGridMap.set(player, grid);
                return grid;
            }
        );
    }

    /**
     *
     * @param {Player} player
     * @returns
     */
    getGrid(player) {
        return this.playerGridMap.get(player);
    }

    /**
     * Prints a visual representation of the grid for each player
     */
    printGrids() {
        for (const [player, grid] of this.playerGridMap.entries()) {
            console.log(`Grid for ${player.name}:`);
            const visualGrid = grid.get()
                .map((column) =>
                    column.map((square) => {
                        if (square.wasShot)
                            return square.hasShipParts() ? "X" : "O";
                        if (square.hasShipParts()) {
                            const shipPart = [...square.shipParts][0];
                            if (shipPart === shipPart.parent.head) {
                                const face = shipPart.parent.face;
                                if (face.x === 1 && face.y === 0) return "R";
                                if (face.x === -1 && face.y === 0) return "L";
                                if (face.x === 0 && face.y === 1) return "D";
                                if (face.x === 0 && face.y === -1) return "U";
                            }
                            return "O";
                        }
                        return ".";
                    })
                )

            const transposedGrid = visualGrid[0].map((_, colIdx) =>
                visualGrid.map((row) => row[colIdx])
            );
            console.table(transposedGrid);
        }
    }

    /**
     * 
     * @param {Player} player 
     * @returns 
     */
    randomizeShipLayout(player){
        const grid = this.getGrid(player);
        if (!grid) return false;
        const unoccupiedSquares = grid.getShuffledUnoccupiedSquares();
        if (unoccupiedSquares.length === 0) return false;
        for (const ship of player.fleet.ships) {
            if (!ship) continue;
            if (!grid.placeShipRandomly(ship, unoccupiedSquares))
                return false;
        }
        return true;
    }

    /**
     * @returns {boolean}
     */
    randomizeShipLayouts() {
        if (!this.randomize) return true;
        for (const player of this.players) {
            this.randomizeShipLayout(player);
        }
        console.log("Ship layouts randomized for players:", this.playerGridMap);
        return true;
    }
    /**
     * Prep grids with updated player ship head positions and faces, we can rebuild them with just that info
     */
    async prepPhase() {
        const notReadyPlayers = new Set();
        const readyPlayers = new Set();
        for (const player of this.players){
            if (player.parent instanceof Bot){ // skip the bots for quicker prep
                readyPlayers.add(player);
            } else if (player.parent instanceof Player){
                notReadyPlayers.add(player);
            }
        }
        let prep = new Promise((resolve, reject)=>{
            console.log("Prep phase started");

            setTimeout(() => {  // set interval before forcing the next phase
                clearInterval(interval);
                console.log("Preparation phase ended. Proceeding to the game...");
                reject("Force end prep phase");
            }, this.prepPhaseTime);
    
            
            const checkIfPlayersIsPrepped = () => {
                for (const player of notReadyPlayers) {
                    if (player.parent instanceof User) {
                        console.log(`Checking ship layout for player: ${player.name}`);
                        // logic to fetch and verify user ship data
                        if (player.isReady()){
                            readyPlayers.add(player);
                            notReadyPlayers.delete(player);
                            console.log(`Player ${player.name} is ready`);
                        }
                    } else if (player.parent instanceof Bot){
                        readyPlayers.add(player);
                    }
                }
                if (readyPlayers.size === this.players.length){
                    clearInterval(interval);
                    resolve("All players have prepped");
                }
            }
            const interval = setInterval(checkIfPlayersIsPrepped, Math.max(this.prepPhaseTime/10-1, 1));
        });
        await prep;
    }

    
    /**
     * loop where the game will run
     */
    async playPhase() {
        let queue = new LinkedListQueue();
        for (const player of this.players){
            queue.enqueue(player);
        }
        let curPlayer;
        let play = new Promise(async (resolve, reject) => {
            curPlayer = queue.dequeue();
            queue.enqueue(curPlayer);
            const playerInput = new Promise((playerResolve,playerReject)=>{
                setTimeout(()=>{playerReject("Player took too long")}, this.playerTurnLength);
                if (curPlayer.parent instanceof Bot){
                }
            });
            await playerInput;
            if (curPlayer.parent instanceof Bot) {
                // await curPlayer.fire();
            } else if (curPlayer.parent instanceof User) {
                //await DOM.getPlayerStrikePos(curPlayer);
            }
            
        });
        await play;
    }

    startGame() {
        console.log("Starting game...");
        //DOM.loadUsers();
        console.log("Players:", this.players);
        console.log("Grids:", this.playerGridMap);

        this.randomizeShipLayouts();

        this.printGrids();
        this.prepPhase();
        // await this.gameLoop(0);
        // end game loop
    }
}
