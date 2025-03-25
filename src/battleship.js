import { DOM } from "./DOM.js";
import { LinkedListQueue } from "./llq.js";

import { Chance } from "chance";
const chance = new Chance();

import { Vector2 } from "./vector2.js";
import { ranTwoDVec } from "./ranTwoDVec.js";

// node representing a square of a ship
export class ShipPart{
    /**
     * 
     * @param {Ship} parent 
     */
    constructor(parent){
        this.parent = parent;
    }

    hit(){
        if (!this.parent) throw new Error("No parent on ShipPart");
        this.parent.hit(this);
    }
}

// composition > inheritence
// to hit a ship we would go into the grid and search for a ship part thats there, and hit it
// ship thats part of a fleet
export class Ship{
    /**
     * 
     * @param {number} length 
     * @param {Vector2} face 
     * @param {boolean} shouldCreateParts 
     */
    constructor(length = 1, face = new Vector2(1, 0), shouldCreateParts = false){
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

    reset(){
        this.damagedParts.clear();
    }

    /**
     * 
     * @param {number} length 
     */
    createParts(length){
        this.parts = new Set();
        for (let i = 0; i < length; i++){
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
    hit(part){
        this.damagedParts.add(part);
    }

    isSunk(){
        return this.damagedParts.size >= this.parts.size;
    }
}

// This is for if I want to add special powers to ships in the future

export class AircraftCarrier extends Ship{
    constructor(length = 5, face = undefined){
        super(length, face);
        this.createParts(length);
    }
}
export class Battleship extends Ship{
    constructor(length = 4, face = undefined){
        super(length, face);
        this.createParts(length);
    }
}
export class Cruiser extends Ship{
    constructor(length = 3, face = undefined){
        super(length, face);
        this.createParts(length);
    }
}
export class Submarine extends Ship{
    constructor(length = 3, face = undefined){
        super(length, face);
        this.createParts(length);
    }
}
export class Destroyer extends Ship{
    constructor(length = 2, face = undefined){
        super(length, face);
        this.createParts(length);
    }
}

export class Fleet{
    /**
     * 
     * @param {Ship[]} ships 
     */
    constructor(ships = [new AircraftCarrier(), new Battleship(), new Cruiser(), new Submarine(), new Destroyer()]){
        this.ships = ships;
    }
}

export class Square{
    /**
     * 
     * @param {Vector2} pos 
     */
    constructor(pos){
        /**
         * @type {Vector2}
         */
        this.pos = pos;
        this.wasShot = false;
        /**
         * @type {Set<ShipPart>}
         */
        this.shipParts = new Set(); // we can call methods on the parts parent, so very nice
    }

    /**
     * 
     * @param {ShipPart} part
     */
    addShipPart(part){
        this.shipParts.add(part);
    }

    /**
     * 
     * @param {ShipPart} part
     */
    removeShipPart(part){
        this.shipParts.delete(part);
    }

    attackShipParts(){
        if (this.wasShot === true) return false;
        this.wasShot = true;
        for (const part of this.shipParts){
            part.hit();
        }
        return true;
    }
}


export class Grid{
    /**
     * 
     * @param {number} gridSize 
     */
    constructor(gridSize){
        this.size = gridSize;
        this.grid = Grid.newGrid(this.size);
    }

    /**
     * 
     * @param {number} size
     * @returns {Square[][]}
     */
    static newGrid(size){
        const grid = [];
        for (let i = 0; i < size; i++){
            const row = [];
            for (let j = 0; j < size; j++){
                row.push(new Square(new Vector2(i, j)));
            }
            grid.push(row);
        }
        return grid;
    }

    printGrid(){
        console.log("\Grid:");
        console.table(this.grid);
        console.log("\n");
    }

    /**
     * 
     * @returns {Square[][]}
     */
    get(){
        return this.grid;
    }

    /**
     * @param {Vector2} globalPos - Two element array containing x and y
     * @returns {Square|null} Square on grid
     */
    getSquare(globalPos) {
        if (globalPos &&
            globalPos instanceof Vector2 &&
            this.grid &&
            globalPos.x >= 0 && 
            globalPos.x < this.grid.length &&
            globalPos.y >= 0 && 
            globalPos.y < this.grid[globalPos.x].length
        ){
            return this.grid[globalPos.x][globalPos.y];
        }
        return null;
    }

    /**
     * Adjacent directions of a square - (up, down, left, right)
     */
    static #adjacentDirs = [
        new Vector2(1,0),
        new Vector2(-1,0),
        new Vector2(0,1),
        new Vector2(0,-1),
    ];

    /**
     * Gets existing adjacent positions to a given position
     * @param {Vector2} pos
     * @return {Vector2[]}
     */
    getAdjacentPositions(pos){
        const acc = [];
        if (!pos || !(pos instanceof Vector2)) return acc;
        for (const vec of Grid.#adjacentDirs){
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
    getAdjacentSquares(square){
        const acc = [];
        if (!square || !(square instanceof Square)) return acc;
        for (const vec of Grid.#adjacentDirs){
            const globalPos = square.pos.add(vec);
            if (!globalPos) continue;
            const sqr = this.getSquare(globalPos);
            if (!sqr) continue;
            acc.push(sqr);
        }
        return acc;
    }

    getSize(){
        return this.size;
    }

    /**
     * 
     * @param {Vector2} pos 
     * @returns {boolean}
     */
    attackPos(pos){
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
    attackPosRecurse(pos, maxIter = 3){
        if (!(pos instanceof Vector2) || typeof maxIter !== 'number') return null;
        if (maxIter < 0) return null;

        const queue = new LinkedListQueue();
        if (!(queue instanceof LinkedListQueue)) return null;
        
        let curIter = 0;
        let prevChecks = new Set();
        queue.enqueue(pos, null);
        while (queue.length > 0 && curIter < maxIter){
            const curPos = queue.dequeue();
            if (curPos === null) {curIter += 1; continue;}

            if (prevChecks.has(curPos)) continue;
            else prevChecks.add(curPos);

            if (!this.attackPos(curPos)) queue.enqueue(this.getAdjacentPositions(curPos));
            return curPos;
        }
        return null;
    }

    /**
     * 
     * @returns {boolean}
     */
    attackRandomly(){
        const lastIdx = this.size-1;
        const pos = new Vector2(chance.integer({min: 0, max: lastIdx}), chance.integer({min: 0, max: lastIdx}));
        if (!this.attackPosRecurse(pos)) return false; // square was not shot
        return true; // square was shot
    }
}

export class User{
    /**
     * 
     * @param {string} name 
     */
    constructor(name){
        this.name = name;
    }
}

export class Bot{
    /**
     * 
     * @param {string} name 
     */
    constructor(name){
        this.name = name;
    }
}

export class Player{ // player is only used when a game starts so it doesnt inherit nor become inherited either
    /**
     * 
     * @param {User|Bot} parent 
     */
    constructor(parent){
        this.parent = parent;
        this.name = parent.name;
        this.fleet = new Fleet(); // stores roots of ships
    }
}

export class Game{
    /**
     * 
     * @param {User[]} users 
     * @param {number} amtOfBots 
     * @param {number} gridSize 
     */
    constructor(users, amtOfBots = 1, gridSize = 10){
        //HtmlHandler.loadUsers()
        const bots = [];
        for (let i = 0; i < amtOfBots; i++) {
            bots.push(new Bot(`Bot ${i + 1}`)); // Create a new Bot instance and add it to the array
        }
        this.playerGridMap = new Map();
        this.players = this.createPlayers(users, bots);
        console.log("Players created:",this.players);
        this.grids = this.createGrids(gridSize);
        console.log("Grids created:",this.playerGridMap);
        this.randomizeShipLayouts();
        console.log("Randomized ship layouts...");
        // // allow players to move ships around to where they want them to be
        // this.prepPhase();
        // this.gameLoop(0);
    }

    /**
     * 
     * @param {User[]} users 
     * @param {Bot[]} bots 
     * @returns {Player[]}
     */
    createPlayers(users, bots){
        return users.concat(bots).map((user) => new Player(user));
    }

    /**
     * 
     * @param {number} gridSize 
     * @returns {Grid[]}
     */
    createGrids(gridSize){
        return this.players.map((player)=> {
            const grid = new Grid(gridSize);
            this.playerGridMap.set(player, grid);
            return grid;
        });
    }

    /**
     * Place ship, from pos, towards the opposite direction of the ship.face vector, by the ship.length, ensuring that the grid at those positions is valid
     * @param {Ship} ship
     * @param {Grid} grid
     * @param {Vector2} pos
     * @returns {boolean}
     */
    placeShip(ship, grid, pos){
        try {
            if (!(ship && grid && pos)) throw new Error("Ship, grid, or pos missing");
            // make array with positions of all squares needed to place ship
            // take pos and modulate with the local position of each part to get each parts global position
            const partToSquare = new Map();
            // @ts-ignore
            
            for (const part of ship.parts){
                // @ts-ignore
                const partLocalPos = ship.partLocalPosMap.get(part); // get local pos of part
                if (!partLocalPos) throw new Error("Part local pos not found");
                const partGlobalPos = pos.add(new Vector2(partLocalPos[0], partLocalPos[1])); // get globalPos by adding both vec together
                if (!partGlobalPos) throw new Error("Part global pos not found");
                const square = grid.getSquare(partGlobalPos);
                if (!square) throw new Error("Square does not exist");
                if (square.shipParts.has(part)) throw new Error("Square has that part already");
                partToSquare.set(part, square);
            }
            // after partToSquare is mapped fully, we know that all squares exist and dont already have ships on them
            for (const [part, square] of partToSquare){
                square.addShipPart(part);
            }
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    /**
     * 
     * @param {Ship} ship
     * @param {Grid} grid
     * @returns {boolean}
     */
    randomizeShipLayout(ship, grid){
        let randomPos = ranTwoDVec(0,grid.size-1,0,grid.size-1);
        if (this.placeShip(ship, grid, randomPos)) return true;
        return false;
    }

    /**
     * @returns {boolean}
     */
    randomizeShipLayouts(){
        // pick random point on grid,
        // attempt to place ship,
        // if ship indices dont all exist,
        // try horizontal,
        // else pick another random point while ship isnt placed
        for (const player of this.players){
            const playerGrid = this.playerGridMap.get(player);
            for (const ship of player.fleet.ships){
                if (ship){
                    if (!this.randomizeShipLayout(ship, playerGrid)) return false;
                }
            }
        }
        return true;
    }

    async prepPhase(){
        for (const player of this.players){
            if (player.parent instanceof User){
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
    async gameLoop(curPlayerIdx){
        while (true) {
            const curPlayer = this.players[curPlayerIdx];
            //await HtmlHandler.updateGrids();
            if (curPlayer.parent instanceof Bot){
                // await curPlayer.fire()
            } else if (curPlayer.parent instanceof User){
                //await HtmlHandler.getPlayerStrikePos(curPlayer);
            }
            curPlayerIdx = (curPlayerIdx + 1) % this.players.length;
        }
    }
}