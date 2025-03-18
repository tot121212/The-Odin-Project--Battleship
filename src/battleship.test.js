import { Grid, Ship } from "./battleship.js";

describe('Grid',()=>{
    test('Grid is constructed correctly',()=>{
        const grid = new Grid(2,2);
        expect(grid.squares[0][0].coords).toEqual([0,0]);
        expect(grid.squares[1][1].coords).toEqual([1,1]);
        expect(grid.squares[2]).toBeUndefined();
    });
});

describe('Ship',()=>{
    test('Ship is constructed adequately',()=>{
        const length = 3;
        const ship = new Ship(length);
        expect(ship.head).toBeDefined();
        expect(ship.length).toBe(length);
        expect(ship.hits).toBe(0);
        expect(ship.isSunk).toBe(false);
    });
    test('Properly constructs ship parts based on length',()=>{
        const length = 3;
        const ship = new Ship(length);
        expect(ship.head).toBeDefined();
        let curIter = ship.head;
        let i = 0;
        while(i<length-1){
            expect(curIter.down).toBeDefined();
            curIter = curIter.down;
            i++;
        }
        expect(curIter.down).toBe(null);
    });
});