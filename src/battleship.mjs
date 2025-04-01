import { v4 as uuidv4 } from "uuid";

import { DOM } from "./DOM.mjs";
import { LinkedListQueue } from "./llq.mjs";

import { Chance } from "chance";
const chance = new Chance();

import { Vector2 } from "./vector2.mjs";

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
        this.parts = new Set();
        this.damagedParts = new Set();
        //this.baseFace = new Vector2(1, 0); // starts pointing right
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
        this.parts = new Set();
        for (let i = 0; i < length; i++) {
            const newPart = new ShipPart(this);
            this.parts.add(newPart);
            // if the vector were the key this wouldnt work because each vector is a unique obj
            // and not a primitive that is comparable like that
            this.partLocalPosMap.set(newPart, new Vector2(-i, 0));
        }
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

    printGrid() {
        console.log("Grid:");
        console.table(this.grid);
        console.log("\n");
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
        return this.flatten().filter((sqr) => {
            return !sqr.hasShipParts();
        });
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
     * @param {Vector2} pos
     * @returns {boolean|Error}
     */
    placeShip(ship, pos) {
        if (!(ship && pos)) return new Error("Ship, grid, or pos missing");
        /**
         * @type {Map<ShipPart, Square>}
         */
        const partToSquare = new Map();

        for (const part of ship.parts) {
            const partLocalPos = ship.partLocalPosMap.get(part); // get local pos of part
            if (!partLocalPos) throw new Error("Part local pos not found"); // throw because we dont expect part to not have a local pos

            const partGlobalPos = pos.add(partLocalPos); // get globalPos by adding both vec together
            if (!partGlobalPos) throw new Error("Part global pos not found");

            const square = this.getSquare(partGlobalPos);
            if (!square) return false; //return new Error("Square does not exist");
            if (square.hasShipParts()) return false;
            //if (square.shipParts.has(part)) return false; //return new Error("Square has that part already");
            partToSquare.set(part, square);
        }
        // after partToSquare is mapped fully, we know that all squares exist and dont already have ships on them
        for (const [part, square] of partToSquare) {
            square.addShipPart(part);
        }
        return true;
    }

    /**
     * Places **ship** at a random position on the **grid**,
     * mutating (popping from) **unoccupiedSquares** in the process,
     * returns the square the head of the ship was placed
     * ***IMPORTANT:*** input a shuffled array of unoccupied squares, it will attempt to shuffle them every operation if you dont
     * @param {Ship} ship
     * @param {Grid} grid
     * @param {Set<Square>} unoccupiedSquares
     * @returns {Square|null}
     */
    static placeShipRandomly(
        ship,
        grid,
        unoccupiedSquares = new Set(chance.shuffle(grid.getUnoccupiedSquares()))
    ) {
        let sqr;
        for (const uOSqr of unoccupiedSquares) {
            if (!uOSqr?.pos) continue;
            if (grid.placeShip(ship, uOSqr.pos) === true) return uOSqr;
        }
        return null;
    }

    /**
     * Adjacent directions of a square - (up, down, left, right)
     */
    static #adjacentDirs = [
        new Vector2(1, 0),
        new Vector2(-1, 0),
        new Vector2(0, 1),
        new Vector2(0, -1),
    ];

    /**
     * Gets existing adjacent positions to a given position
     * @param {Vector2} pos
     * @return {Vector2[]}
     */
    getAdjacentPositions(pos) {
        const acc = [];
        if (!pos || !(pos instanceof Vector2)) return acc;
        for (const vec of Grid.#adjacentDirs) {
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
        for (const vec of Grid.#adjacentDirs) {
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
        this.uuid = uuidv4(); // basically will generate a new unique id for each session of play
        this.name = parent.name;
        this.fleet = new Fleet(); // stores roots of ships
    }
    getUUID() {
        return this.uuid;
    }
}

export class Game {
    /**
     * @param {User[]} users Array of users
     * @param {number} amtOfBots Amount of bot players
     * @param {number} gridSize Size of grid as a num, x * x
     * @param {boolean} randomize Should the ship layouts be randomized at start
     */
    constructor(users, amtOfBots = 1, gridSize = 10, randomize = true) {
        this.gridSize = gridSize;
        this.randomize = randomize;

        this.users = users;
        this.amtOfBots = amtOfBots;
        this.bots = this.createBots();

        /**
         * @type {Map<Player, Grid>}
         */
        this.playerGridMap = new Map();
        this.uuidPlayerMap = new Map();
        this.players = this.createPlayers();
        this.grids = this.createGrids();
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
        return this.users.concat(this.bots).map((user) => {
            const player = new Player(user);
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
     * @returns {boolean}
     */
    randomizeShipLayouts() {
        // pick random point on grid,
        // attempt to place ship,
        // if ship indices dont all exist,
        // try horizontal,
        // else pick another random point while ship isnt placed
        for (const player of this.players) {
            const grid = this.getGrid(player);
            if (!grid) continue;
            for (const ship of player.fleet.ships) {
                if (!ship) continue;
                if (!Grid.placeShipRandomly(ship, grid)) return false;
            }
        }
        return true;
    }

    async prepPhase() {
        for (const player of this.players) {
            if (player.parent instanceof User) {
                // send get request for users updated grid
                // await player post of updated grid
                // could be done with workers but not the purpose of the project
                // verify their grid
                // replace their grid with identical one
                // update playerGridMap
            }
        }
        // allow players to move pieces randomly
        // bots are already random so ignore them
    }

    /**
     *
     * @param {number} curPlayerIdx
     */
    async gameLoop(curPlayerIdx) {
        while (true) {
            const curPlayer = this.players[curPlayerIdx];
            //await DOM.updateGrids();
            if (curPlayer.parent instanceof Bot) {
                // await curPlayer.fire();
            } else if (curPlayer.parent instanceof User) {
                //await DOM.getPlayerStrikePos(curPlayer);
            }
            curPlayerIdx = (curPlayerIdx + 1) % this.players.length;
        }
    }

    async startGame() {
        console.log("Starting game...");
        //DOM.loadUsers();
        console.log("Players:", this.players);
        console.log("Grids:", this.playerGridMap);

        if (this.randomize === true) {
            console.log("Randomizing ship layouts...");
            this.randomizeShipLayouts();
        }

        // await this.getInitialShipLayout();
        // this.prepPhase();
        // this.gameLoop(0);
    }
}
