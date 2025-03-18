import { Grid, Ship, Player, Game, User } from "./battleship.js";

describe('Grid',()=>{
    test('Constructed adequately',()=>{
        const grid = new Grid({x:2,y:2});
        expect(grid.squares[0][0].coords).toEqual([0,0]);
        expect(grid.squares[1][1].coords).toEqual([1,1]);
        expect(grid.squares[2]).toBeUndefined();
    });
});

describe('Ship',()=>{
    test('Constructed adequately',()=>{
        const length = 3;
        const ship = new Ship(length);
        expect(ship.head).toBeDefined();
        expect(ship.length).toBe(length);
        expect(ship.hits).toBe(0);
        expect(ship.isSunk).toBe(false);
    });
    test('Constructs ship parts based on length',()=>{
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

describe('Player',()=>{
    test('Player is constructed correctly', ()=>{
        const user = {
            name: "Josh",
            lastShipGrid: null
        };
        const player = new Player(user);
        expect(player.name).toBe("Josh");
        expect(player.user).toEqual(user);
        expect(player.ships).toEqual([]);
    });
});


describe('Game',()=>{
    
});

