const svgPath = "./assets/svg/";
const svgMap = {
    skullOutline: await import(`${svgPath}` + 'skull-outline.svg'),
    squareOutline: await import(`${svgPath}` + 'square-outline.svg'),
    squareRounded: await import(`${svgPath}` + 'square-rounded.svg'),
};

import { Vector2 } from "./vector2.mjs";
import { Game, Player, Grid, Square } from "./battleship.mjs";
import { NodePath } from "@babel/core";

export class DOM{
    static gridElementRefs = new Set();

    /**
     * 
     * @param {Grid} grid 
     * @param {Player} player 
     * @returns {HTMLElement}
     */
    static initializeGrid(grid, player){
        const gridElement = document.createElement("div");
        gridElement.classList.add('grid');
        gridElement.dataset.uuid = player.getUUID();
        const playerGrid = grid.getGrid();
        // load grid into html
        let colIdx = 0;
        for (const column of playerGrid){
            const columnElement = document.createElement("div");
            columnElement.classList.add('column');
            columnElement.dataset.idx = colIdx.toString();
            let sqrIdx = 0;
            for (const square of column){
                const squareElement = document.createElement("div");
                squareElement.classList.add('square');
                squareElement.dataset.idx = sqrIdx.toString();
                columnElement.appendChild(squareElement);
                sqrIdx+=1;
            }
            gridElement.appendChild(columnElement);
            colIdx+=1;
        }
        DOM.gridElementRefs.add(gridElement);
        return gridElement;
    }

    /**
     * Initializes grids for the game passed as an argument, then returns the updated gridElements
     * @param {Game} game 
     * @returns {boolean}
     */
    static initializeGrids(game){
        DOM.gridElementRefs.clear();
        for(const entry of game.playerGridMap.entries()){
            /** @type {[Player, Grid]} */
            const [player, grid] = entry;
            if(!DOM.initializeGrid(grid, player)) return false;
        }
        return true;
    }

    /**
     * 
     * @param {HTMLElement} squareElement 
     * @param {Square|null} square
     */
    static fillSquareData(squareElement, square){
        if (!square) throw new Error("Grid square does not exist");
        if (square.hasShipParts()){
            squareElement.dataset.hasShipPart = "t";
        } else {
            squareElement.dataset.hasShipPart = "f";
        }
        if (square.wasShot === true){
            squareElement.dataset.wasShot = "t";
        } else {
            squareElement.dataset.wasShot = "f";
        }
    }

    /**
     * Fills the square using the dataset with symbols and squares
     * @param {HTMLElement} squareElement
     */
    static drawSquare(squareElement){
        // create elements for each state
    }

    /**
     * Updates the grid based on whether it has shipParts or was
     * @param {Game} game
     */
    static updateGrids(game){
        for (const gridElement of DOM.gridElementRefs){
            const player = game.uuidPlayerMap.get(gridElement.dataset.uuid);
            const grid = game.playerGridMap.get(player);
            if (!player || !grid) throw new Error("Player or Grid no longer exist");
            for (const columnElement of gridElement.children){
                const colIdxToNum = Number(columnElement.dataset.idx);
                for (const squareElement of columnElement.children){
                    const sqrIdxToNum = Number(squareElement.dataset.idx);
                    const squarePos = new Vector2(colIdxToNum, sqrIdxToNum);
                    const square = grid.getSquare(squarePos);
                    DOM.fillSquareData(squareElement, square);
                    DOM.drawSquare(squareElement);
                }
            }
        }
    }

    /**
     * 
     * @param {Game} game 
     */
    static loadTemplate(game) {
        if(!DOM.initializeGrids(game)) throw new Error("HTML: Grids failed to initialize");
        DOM.updateGrids(game);
    }
    
    static async getPlayerStrikePos(){
        // await post request that player sends to continue game, strikePos
        // verify strikePos is a array with two elements
        return;
    }
    
}