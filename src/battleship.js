// node representing a square of a ship
export class ShipPart{
    constructor(){
        this.up = null;
        this.down = null;
        this.left = null;
        this.right = null;
        this.isDamaged = false;
    }
}

// ship thats part of a fleet
export class Ship{
    createParts(length){
        const head = new ShipPart();
        let curIter = head;
        for (let i = 0; i < length-1; i++){
            curIter.down = new ShipPart();
            curIter = curIter.down;
        }
        return head;
    }
    constructor(){
        this.head = this.createParts(this.length);
        this.facing = [0,1];
        this.hits = 0;
        this.isSunk = false;
    }
    print() {
        let current = this.head;
        let shipRepresentation = "";
        while (current) {
            shipRepresentation += (current.hit ? 'X' : 'O') + " ";
            current = current.down;
        }
        console.log("Ship Visualization:");
        console.log(shipRepresentation.trim());
        console.log("Ship Length: " + this.length);
        console.log("Hits: " + this.hits);
        console.log("Sunk: " + (this.isSunk ? "Yes" : "No"));
    }
}

export class AircraftCarrier extends Ship{
    constructor(){
        this.length = 5;
    }
}
export class Battleship extends Ship{
    constructor(){
        this.length = 4;
    }
}
export class Cruiser extends Ship{
    constructor(){
        this.length = 3;
    }
}
export class Submarine extends Ship{
    constructor(){
        this.length = 3;
    }
}
export class Destroyer extends Ship{
    constructor(){
        this.length = 2;
    }
}

export class Fleet{
    constructor(){
        this.ships = [new AircraftCarrier(), new Battleship(), new Cruiser(), new Submarine(), new Destroyer()];
    }
}

export class Square{
    constructor(x,y){
        this.coords = [x,y];
        this.shipParts = [];
    }
}

export class Grid{
    constructor(gridSize){
        this.gridSize = gridSize;
        this.squares = this.newGrid(this.gridSize);
    }
    printGrid(){
        console.log("\Grid:");
        console.table(this.squares);
        console.log("\n");
    }
    newGrid(gridSize){
        const grid = [];
        for (let i = 0; i < gridSize.x; i++){
            const row = [];
            for (let j = 0; j < gridSize.y; j++){
                row.push(new Square(i, j));
            }
            grid.push(row);
        }
        return grid;
    }
}

export class User{
    constructor(name){
        this.name = name;
    }
}

export class Computer{
    constructor(name){
        this.name = name;
    }
}

export class Player{
    constructor(parent){
        this.parent = parent;
        this.name = parent.name;
        this.fleet = new Fleet(); // stores roots of ships
    }
}

export class Game{
    constructor(users, gridSize = {x:10,y:10}){
        const computers = [new Computer("Computer")];
        this.players = this.createPlayers(users, computers);
        this.grids = this.createGrids(users, gridSize);
        // lay ships out randomly
        // allow players to move ships around to where they want them to be
        // start game loop
        this.gameLoop(players[0]);
    }
    createPlayers(users, computers){
        return users.concat(computers).map((user) => new Player(user));
    }
    createGrids(users, gridSize){
        return users.map((user)=> grids[user.name] = new Grid(gridSize));
    }
    gameLoop(curPlayer){
        // wait for player to input
        
    }
}