import { Vector2 } from "./vector2.mjs";
import { Game, Player, Grid, Square } from "./battleship.mjs";
import ImageImporter from "./ImageImporter.mjs";
const SVG = ImageImporter.SVG;

export class DOM{
    static GridElementSet = new Set();
    static Content = document.body.querySelector('.content');

    /**
     * Creates grid element for provided grid, associating it with the given player
     * @param {Grid} grid 
     * @param {string} playerUUID 
     * @returns {HTMLElement|null}
     */
    static getGrid(grid, playerUUID){
        const gridElement = document.createElement("div");
        gridElement.classList.add('grid');
        gridElement.dataset.uuid = playerUUID;
        const playerGrid = grid.getGrid();
        // load grid into html
        let colIdx = 0;
        for (const column of playerGrid){
            const columnElement = document.createElement("div");
            columnElement.classList.add('column');
            columnElement.dataset.idx = colIdx.toString();
            let sqrIdx = 0;
            for (const square of column){
                const squareElement = document.createElement("button");
                squareElement.classList.add('square', 'grabbable');
                squareElement.dataset.idx = sqrIdx.toString();
                this.drawSquare(squareElement);
                columnElement.append(squareElement);
                sqrIdx+=1;
            }
            gridElement.append(columnElement);
            colIdx+=1;
        }
        DOM.GridElementSet.add(gridElement);
        return gridElement;
    }

    /**
     * Initializes grids for the game passed as an argument, then returns the gridContainer created
     * @param {Game} game
     * @returns {HTMLElement}
     */
    static getGridContainer(game){
        DOM.GridElementSet.clear();
        const gridsContainer = document.createElement("div");
        gridsContainer.classList.add('grids-container');
        for(const entry of game.playerGridMap.entries()){
            /** @type {[Player, Grid]} */
            const [player, grid] = entry;
            const newGrid = DOM.getGrid(grid, player.getUUID());
            if(!newGrid) throw new Error("Grid was not creatable");
            gridsContainer.append(newGrid);
        }
        if(!(gridsContainer.children.length > 0)) throw new Error("Grids container is empty");
        return gridsContainer;
    }

    /**
     * 
     * @param {HTMLElement} squareElement 
     * @param {Square|null} square
     */
    static fillSquareData(squareElement, square){
        if (!squareElement) throw new Error("HTML Square does not exist")
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
        //console.log("Filled square data for ", squareElement.tagName, "with square ", square);
    }

    static SVG = (()=>{
        const SVGNameToAlt = {
            "squareOutline": "□",
            "skullOutline": "💀",
            "squareRounded": "■",
        };

        /**
         * Creates a new object for an svg and adds data, type, and alt
         * @param {string|undefined} svgPath // Path to svg
         * @param {string} alt // Alt for if file not found
         * @returns {HTMLElement}
         */
        const newObject = (svgPath, alt)=>{
            const obj = document.createElement('object');
            obj.data = svgPath ?? "";
            obj.type = "image/svg+xml";
            obj.setAttribute("alt", alt);
            return obj;
        }

        /**
         * Create svg object
         * @param {string} svgName
         * @param {string[]} classes
         * @param {string} alt
         * @returns {HTMLElement}
         */
        const newObjectFromName = (svgName, classes = [svgName], alt = (SVGNameToAlt.get(svgName) ?? svgName))=>{
            const path = SVG.NameToPath.get(svgName) ?? undefined;
            const obj = newObject(path, alt);
            obj.classList.add(...classes);
            return obj;
        }

        return { newObject, newObjectFromName };
    })();

    /**
     * Draw all square elements initially, mutates squareElement
     * @param {HTMLElement} squareElement 
     */
    static drawSquare(squareElement){
        const squareOutline = DOM.SVG.newObjectFromName("squareOutline");
        const squareFilled = DOM.SVG.newObjectFromName("squareFilled");
        const squareSkull = DOM.SVG.newObjectFromName("squareSkull");
        squareFilled.hidden = true;
        squareSkull.hidden = true;
        squareElement.append(squareOutline, squareFilled, squareSkull);
    }

    /**
     * Shows and hides appropriate svg objects for html representation of square
     * @param {HTMLElement} squareElement
     */
    static updateSquare(squareElement){
        const hasShipPart = squareElement.dataset.hasShipPart;
        const squareFilledObj = squareElement.querySelector("object.squareFilled");
        if (hasShipPart === "t"){
            squareFilledObj?.classList.remove("hidden");
        } else if (hasShipPart === "f"){
            squareFilledObj?.classList.add("hidden");
        }

        const wasShot = squareElement.dataset.wasShot;
        const squareSkull = squareElement.querySelector("object.squareSkull");
        if (wasShot === "t"){
            squareSkull?.classList.remove("hidden");
        } else if (wasShot === "f"){
            squareSkull?.classList.add("hidden");
        }
    }

    /**
     * Updates the grid based on whether it has shipParts or was
     * @param {Game} game
     */
    static updateGrids(game){
        for (const gridElement of DOM.GridElementSet){
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
                    DOM.updateSquare(squareElement);
                }
            }
        }
        //console.log("Updated grid");
    }

    /**
     * 
     * @param {Game} game 
     */
    static loadTemplate(game) {
        const newGridsContainer = DOM.getGridContainer(game);
        if(!newGridsContainer) throw new Error("HTML: Grids failed to initialize");
        DOM.Content?.append(newGridsContainer);
        //console.log("Appended grid containers");
        DOM.updateGrids(game);
    }
    
    static async getPlayerStrikePos(){
        // await post request that player sends to continue game, strikePos
        // verify strikePos is a array with two elements
        return;
    }
    
}