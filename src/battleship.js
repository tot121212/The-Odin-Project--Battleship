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
        this.parent.hit(this);
    }
}

// composition > inheritence
// to hit a ship we would go into the grid and search for a ship part thats there, and hit it
// ship thats part of a fleet
export class Ship{
    constructor(){
        // instead of a linked list, lets just store one node as the head, store the parts in an array, and store a map of the coordinates to each part
        this.length = 0;
        this.parts = new Set();
        this.damagedParts = new Set();
        this.face = new Vector2(0, 1); // facing up by default
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
            this.parts.add(new ShipPart(this));
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

// DONT LOOK!, IM NOT USING INHERITENCE???

export class AircraftCarrier extends Ship{
    constructor(){
        super();
        this.length = 5;
        this.createParts(this.length);
    }
}
export class Battleship extends Ship{
    constructor(){
        super();
        this.length = 4;
        this.createParts(this.length);
    }
}
export class Cruiser extends Ship{
    constructor(){
        super();
        this.length = 3;
        this.createParts(this.length);
    }
}
export class Submarine extends Ship{
    constructor(){
        super();
        this.length = 3;
        this.createParts(this.length);
    }
}
export class Destroyer extends Ship{
    constructor(){
        super();
        this.length = 2;
        this.createParts(this.length);
    }
}

export class Fleet{
    constructor(){
        this.ships = [new AircraftCarrier(), new Battleship(), new Cruiser(), new Submarine(), new Destroyer()];
    }
    [Symbol.iterator]() {
        let index = 0;
        const items = this.ships;

        return {
            next() {
                if (index < items.length) {
                    return { value: items[index++], done: false };
                }
                return { done: true };
            }
        };
    }
}

export class Square{
    /**
     * 
     * @param {Vector2} pos 
     */
    constructor(pos){
        this.pos = pos;
        this.wasShot = false;
        this.shipParts = new Set(); // we can call methods on the parts parent, so very nice
    }
}


export class Grid{
    /**
     * 
     * @param {number} gridSize 
     */
    constructor(gridSize){
        this.size = gridSize;
        this.grid = this.newGrid(this.size);
    }

    /**
     * 
     * @param {number} size
     * @returns {Array.<Array.<Square>>}
     */
    newGrid(size){
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

    get(){
        return this.grid;
    }

    /**
     * @param {Vector2} vec - Two element array containing x and y
     * @returns {Square|null} Square on grid
     */
    getSquare(vec) {
        if (!(vec instanceof Vector2)) return null;
        if (
            vec.x >= 0 &&
            vec.x < this.grid.length &&
            vec.y >= 0 &&
            vec.y < this.grid[vec.x].length
        ){
            return this.grid[vec.x][vec.y];
        } 
        return null;
    }

    /**
     * 
     * @param {Square} square
     * @return {Array.<Square>}
     */
    getAdjacencies(square){
        const acc = [];
        if (!(square instanceof Square)) return acc;
        const dirs =  [
            square.pos.add(new Vector2(1,1)),
            square.pos.add(new Vector2(-1,-1)),
            square.pos.add(new Vector2(-1,1)),
            square.pos.add(new Vector2(1,-1)),
        ]
        dirs.forEach((vec)=>{
            const sqr = this.getSquare(vec);
            if (sqr) acc.push(sqr);
        });
        return acc;
    }

    getSize(){
        return this.size;
    }

    /**
     * 
     * @param {ShipPart} part 
     * @param {Square} square 
     */
    addShipPart(part, square){
        square.shipParts.add(part);
    }

    /**
     * 
     * @param {ShipPart} part 
     * @param {Square} square 
     */
    removeShipPart(part, square){
        square.shipParts.delete(part);
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

    /**
     * 
     * @param {Square} square 
     * @returns 
     */
    attackSquare(square){
        if (!square || square.wasShot === true) return false;
        square.wasShot = true;
        square.shipParts.forEach(
            /**
            * @param {ShipPart} shipPart
            */
            (shipPart)=>{
                shipPart.hit();
            }
        );
        return true;
    }

    /**
     * @description Tree traversal to attack square or its adjacents, up to maxIter iterations
     * @param {Square} square
     * @param {Grid} grid
     * @param {number} maxIter
     */
    attackAdjacentSquare(square, grid, maxIter = 3){
        if (!square) return false;
        const queue = new LinkedListQueue();
        let queueIterations = 0;
        queue.enqueue(square, null);
        while (queue.length > 0 && queueIterations < maxIter){
            const curSquare = queue.dequeue();
            if (curSquare === null) {
                queueIterations += 1;
                continue;
            }
            if (!this.attackSquare(curSquare)) queue.enqueue(grid.getAdjacencies(square));
            else return true;
        }
        return false;
    }
    
    /**
     * 
     * @param {Grid} grid 
     */
    attackRandomly(grid){
        if (!grid) throw new Error("Grid doesn't exist");
        const lastIdx = grid.size-1;
        const pos = new Vector2(chance.integer({min: 0, max: lastIdx}), chance.integer({min: 0, max: lastIdx}));
        let square = grid.getSquare(pos);
        if (!square) throw new Error(`"Square does not exist at:", ${pos.x}, ${pos.y}`); // square doesnt exist
        if (!this.attackAdjacentSquare(square, grid)) return false; // square was not shot
        return true; // square was shot
    }
}

export class Game{
    /**
     * 
     * @param {Array.<User>} users 
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
        this.grids = this.createGrids(gridSize);
        this.randomizeShipLayouts();
        // allow players to move ships around to where they want them to be
        this.prepPhase();
        this.gameLoop(0);
    }

    /**
     * 
     * @param {Array.<User>} users 
     * @param {Array.<Bot>} bots 
     * @returns 
     */
    createPlayers(users, bots){
        return users.concat(bots).map((user) => new Player(user));
    }

    /**
     * 
     * @param {number} gridSize 
     * @returns 
     */
    createGrids(gridSize){
        return this.players.map((player)=> {
            const grid = new Grid(gridSize);
            this.playerGridMap.set(player, grid);
            return grid;
        });
    }

    /**
     * 
     * @param {Ship} ship
     * @param {Grid} grid
     * @param {Vector2} pos
     */
    placeShip(ship, grid, pos){
        // use ship face
        return false;
    }

    /**
     * 
     * @param {Ship} ship
     * @param {Grid} grid
     */
    randomizeShipLayout(ship, grid){
        let randomPos = ranTwoDVec(0,grid.size-1,0,grid.size-1);
        if (this.placeShip(ship, grid, randomPos)) return true;
        return false;
    }

    randomizeShipLayouts(){
        // pick random point on grid,
        // attempt to place ship,
        // if ship indices dont all exist,
        // try horizontal,
        // else pick another random point while ship isnt placed
        for (const player of this.players){
            const playerGrid = this.playerGridMap.get(player);
            for (const ship of player.fleet){
                if (ship){
                    while (!this.randomizeShipLayout(ship, playerGrid)){}
                } 
            }
        }
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