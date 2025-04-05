import { Grid, Player, User, Ship, Battleship, Game } from "./battleship.mjs";
import Vector2 from "./vector2.mjs";

describe("Ships", () => {
    /**
     * @type {Ship}
     */
    let ship;
    describe("Ship", () => {
        beforeEach(() => {
            ship = new Ship(4, undefined, true);
        });
        describe("ShipPart", () => {
            test("Ship is hit", () => {
                let part = ship.parts.values().next().value;
                part.hit();
                expect(ship.damagedParts.has(part)).toBe(true);
            });
        });
        test("Ship sinks", () => {
            for (const part of ship.parts.values()) {
                part.hit();
            }
            expect(ship.isSunk()).toBe(true);
        });
    });
});

describe("Grid", () => {
    let gridObj;
    let gridSize = 0;
    beforeEach(() => {
        gridObj = new Grid(gridSize);
    });
    gridSize = 10;
    test("Grid is of correct bounds", () => {
        const squareA = gridObj.getSquare(new Vector2(0, 0));
        expect(squareA?.pos.x).toBe(0);
        expect(squareA?.pos.y).toBe(0);

        const squareB = gridObj.getSquare(new Vector2(4, 5));
        expect(squareB?.pos.x).toBe(4);
        expect(squareB?.pos.y).toBe(5);

        const squareC = gridObj.getSquare(new Vector2(9, 9));
        expect(squareC?.pos.x).toBe(9);
        expect(squareC?.pos.y).toBe(9);

        const squareD = gridObj.getSquare(new Vector2(gridSize, gridSize));
        expect(squareD).toBe(null);

        const squareE = gridObj.getSquare(
            new Vector2(gridSize + 10, gridSize + 10)
        );
        expect(squareE).toBe(null);
    });

    test("Adjacencies are of correct amount", () => {
        /**
         * @type {Vector2[]}
         */
        const adj1 = gridObj.getAdjacentPositions(new Vector2(0, 0));
        expect(adj1.length).toBe(2);
        const adj2 = gridObj.getAdjacentPositions(
            new Vector2(gridSize - 1, gridSize - 1)
        );
        expect(adj2.length).toBe(2);
    });

    test("Gets shuffled Vector2 array correctly", () => {
        const shuffled = gridObj;
    });

    describe("Ship with ShipParts on Grid", () => {
        /**
         * @type {Ship}
         */
        let ship;
        let shipPartPosArr = [];
        beforeEach(() => {
            ship = new Battleship();
            shipPartPosArr = [];
            let x = 0;
            let y = 0;
            for (const part of ship.parts) {
                const pos = new Vector2(x, y);
                const square = gridObj.getSquare(pos);
                if (!square) continue;
                square.addShipPart(part);
                shipPartPosArr.push(pos);
                y += 1;
            }
        });
        test("Attack a coordinate and ship is damaged", () => {
            const pos = shipPartPosArr[0];
            gridObj.attackPos(pos);
            const square = gridObj.getSquare(pos);
            expect(square.wasShot).toBe(true);
            const part = square.shipParts.values().next().value;
            expect(ship.damagedParts.has(part));
        });
        test("Attack multiple coordinates and ship is sunk", () => {
            for (const pos of shipPartPosArr) {
                gridObj.attackPos(pos);
            }
            const pos = shipPartPosArr[0];
            const square = gridObj.getSquare(pos);
            expect(square.wasShot).toBe(true);
            const part = square.shipParts.values().next().value;
            expect(ship.damagedParts.has(part));
            expect(ship.isSunk()).toBe(true);
        });
    });
});

describe("Player", () => {
    let parent, player;
    beforeEach(() => {
        parent = new User("Josh");
        player = new Player(parent);
    });
    test("Player initializes its fleet", () => {
        expect(player.name).toBe("Josh");
        expect(player.parent).toBeDefined();
        expect(player.fleet.ships.length).toBeGreaterThan(0);
    });
});

describe("Game", () => {
    const mainUser = new User("Test Player");
    const amtOfBots = 1;
    const gridSize = 10;
    const randomizeLayouts = false;
    /**
     * @type {Game}
     */
    let game;
    /**
         * @type {Grid}
         */
    let grid;
    /**
     * @type {Ship}
     */
    let ship;
    beforeEach(() => {
        game = new Game(mainUser, amtOfBots, gridSize, randomizeLayouts);
        
        grid = game.grids[0];

        const length = gridSize;
        const face = new Vector2(1, 0);
        const shouldCreateParts = true;
        ship = new Ship(length, face, shouldCreateParts);
    });

    describe("Ship Placement", () => {
        test("places ship", () => {
            const pos = new Vector2(gridSize - 1, 0);
            grid.placeShip(ship, pos);

            const square = grid.getSquare(pos);
            if (!square) {
                expect(square).not.toBeNull();
                return;
            }
            expect(square.shipParts.size === 1).toBe(true);
        });
        test("handles out of bounds", () => {
            const pos = new Vector2(0, 0);
            grid.placeShip(ship, pos);

            const square = grid.getSquare(pos);
            if (!square) {
                expect(square).not.toBeNull();
                return;
            }
            expect(square.shipParts.size === 0).toBe(true);
        });
        test("handles spot taken already", () => {
            const pos = new Vector2(gridSize - 1, 0);
            grid.placeShip(ship, pos);
            grid.placeShip(new Ship(3), pos);

            const square = grid.getSquare(pos);
            if (!square) {
                expect(square).not.toBeNull();
                return;
            }
            expect(square.shipParts.size === 1).toBe(true);
        });
    });

    describe("Striking",()=>{
        
    });
});
