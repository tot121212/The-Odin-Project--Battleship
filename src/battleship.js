export class ShipPart{
    constructor(){
        this.up = null;
        this.down = null;
        this.left = null;
        this.right = null;
        this.isDamaged = false;
    }
}

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

    constructor(length){
        if (length < 1) return {};
        this.length = length;
        this.head = this.createParts(length);
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

export class Square{
    constructor(x,y){
        this.coords = [x,y];
    }
}

export class Grid{
    constructor(x, y){
        this.gridSize = [x, y];
        this.squares = this.newGrid(this.gridSize);
    }
    printGrid(){
        console.log("\Grid:");
        console.table(this.squares);
        console.log("\n");
    }
    newGrid(coords){
        const [x,y] = coords;
        const grid = [];
        for (let i = 0; i < x; i++){
            const row = [];
            for (let j = 0; j < y; j++){
                row.push(new Square(i, j));
            }
            grid.push(row);
        }
        return grid;
    }
}