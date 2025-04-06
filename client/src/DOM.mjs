import Vector2 from "../../server/vector2.mjs";
import Images from "./ImageImporter.mjs";

export class DOM {
    constructor() {
        /**
         * @type {Object|null}
         */
        this.gameData = null;
        /**
         * @type {Set}
         */
        this.grids = new Set();
        /**
         * @type {Element|null}
         */
        this.content = document.querySelector(".content");
    }

    setgameData(gameData){
        this.gameData = gameData;
    }

    onStartGame(e){
        const startButton = e.target;
        // @ts-ignore
        startButton.classList.add("hidden");
        this.gameData.startGame();
        this.updateGrids();
        document.querySelector(".grids")?.classList.remove("hidden");
        console.log("DOM: Started game");
    }

    onSubmitShipLayout(e){
        /**
         * @type {HTMLDivElement|null}
         */
        const user = document.querySelector(".user");
        if (!user) throw new Error("No user found");
        const userID = user.dataset.id;
        if (!userID) throw new Error("No userID found");
        const layout = document.querySelector(`.grid[data-user-id=${userID}]`);
        if (!layout) throw new Error("Layout not found for user");
        //this.game.submitShipLayout(layout, userID);
        // confirm that ship pos and faces are valid
        // wipe grid and replace ships with faces
    }

    onStrikeSquare(e){
        const playerID = e.target.closest(".grid").dataset.playerID;
        const squarePos = e.target.dataset.idx;
        const posAsArr = squarePos.split(",").map(Number);
        if (posAsArr.length !== 2) console.error("Strike pos has invalid amt of args");
        for (const num of posAsArr){
            if (!Number.isInteger(num)) console.error("Pos x or y is not a number");
        }
        // supposed to simulate api call
        const result = this.gameData.strikePos(new Vector2(posAsArr[0],posAsArr[1]), playerID);
        if (typeof result === "string"){
            console.log(result);
            return false;
        } else {
            return true;
        }
    }

    loadTemplate() {
        const newGridsContainer = this.createGridContainer();
        if (!newGridsContainer)
            throw new Error("HTML: Grids failed to initialize");
        this.content?.append(newGridsContainer);
        this.content?.addEventListener("click", (e) => {
            if (!e?.target) return;
            if (!(e.target instanceof Element)) return;

            if (e.target.classList.contains("start-game")) {
                if (!this.gameData.hasUsers()) return;
                this.onStartGame(e);
            }

            else if (e.target.classList.contains("submit-ship-layout")){
                if (!(e.target instanceof HTMLButtonElement)) return;
                this.onSubmitShipLayout(e);
            }

            else if (e.target.classList.contains("square")) {
                this.onStrikeSquare(e);
            }
        });
    }

    /**
     * @param {number} colIdx 
     * @param {number} rowIdx 
     * @returns 
     */
    static createSquare(colIdx, rowIdx){
        const squareElement = document.createElement("button");
        squareElement.classList.add(
            "square",
            "grabbable",
            "img-container"
        );
        squareElement.dataset.idx = rowIdx.toString() + "," + colIdx.toString();
        DOM.drawSquare(squareElement);
        
        return squareElement;
    }

    /**
     * 
     * @param {*} column
     * @param {number} colIdx
     */
    static createColumn(column, colIdx) {
        const columnElement = document.createElement("div");
        columnElement.classList.add("column");
        columnElement.dataset.idx = colIdx.toString();
        let rowIdx = 0;
        for (const square of column) {
            columnElement.append(this.createSquare(colIdx, rowIdx));
            rowIdx += 1;
        }
        return columnElement;
    }

    /**
     * Creates grid element for provided grid, associating it with the given player
     * @param {Object} grid
     * @param {string} playerID
     * @returns {Element|null}
     */
    static createGrid(grid, playerID) {
        const gridElement = document.createElement("div");
        gridElement.classList.add("grid");
        gridElement.dataset.playerID = playerID;
        const playerGrid = grid.get();
        // load grid into html
        let colIdx = 0;
        for (const column of playerGrid) {
            gridElement.append(this.createColumn(column, colIdx));
            colIdx += 1;
        }
        
        return gridElement;
    }

    /**
     * Initializes grids for the gameData passed as an argument, then returns the gridContainer created
     * @returns {Element}
     */
    createGridContainer() {
        const gridContainer = document.createElement("div");
        gridContainer.classList.add("grids");
        for (const entry of this.gameData.playerGridMap.entries()) {
            const [player, grid] = entry;
            const gridElement = DOM.createGrid(grid, player.getUUID());
            if (!gridElement) throw new Error("Grid was not creatable");
            this.grids.add(gridElement);
            gridContainer.append(gridElement);
        }
        if (!(gridContainer.children.length > 0))
            throw new Error("Grids container is empty");
        gridContainer.classList.add("hidden");
        return gridContainer;
    }

    /**
     *
     * @param {HTMLButtonElement} squareElement
     * @param {Object|null} square
     */
    static fillSquareData(squareElement, square) {
        if (!squareElement) throw new Error("HTML Square does not exist");
        if (!square) throw new Error("Grid square does not exist");
        if (square.hasShipParts()) {
            squareElement.dataset.hasShipPart = "t";
        } else {
            squareElement.dataset.hasShipPart = "f";
        }
        if (square.wasShot === true) {
            squareElement.dataset.wasShot = "t";
        } else {
            squareElement.dataset.wasShot = "f";
        }
    }

    static IMG = (() => {
        const NameToAlt = new Map([
            ["squareOutline", "□"],
            ["skullOutline", "💀"],
            ["squareRounded", "■"],
        ]);

        /**
         * Creates a new object for an IMG and adds data, type, and alt
         * @param {string} path
         * @param {string} alt
         * @returns {HTMLElement}
         */
        const createImgElement = (path, alt) => {
            const imgElement = document.createElement("img");
            imgElement.src = path ?? "";
            imgElement.alt = alt;
            return imgElement;
        };

        /**
         * Create IMG object
         * @param {string} name
         * @param {string[]} classes
         * @param {string} alt
         * @returns {HTMLElement}
         */
        const createImgElementFromName = (
            name,
            classes = [name],
            alt = NameToAlt.get(name) ?? name
        ) => {
            /**
             * @type {string}
             */
            const path = Images.get(name);
            const imgElement = createImgElement(path, alt);
            imgElement.classList.add(...classes);

            return imgElement;
        };

        return { createImgElement, createImgElementFromName };
    })();

    /**
     * Draw all square elements initially, mutates squareElement
     * @param {HTMLButtonElement} squareElement
     */
    static drawSquare(squareElement) {
        const squareOutline = DOM.IMG.createImgElementFromName("squareOutline");
        const squareRounded = DOM.IMG.createImgElementFromName("squareRounded");
        const skullOutline = DOM.IMG.createImgElementFromName("skullOutline");
        squareOutline.classList.add("hidden");
        squareRounded.classList.add("hidden");
        skullOutline.classList.add("hidden");
        squareElement.dataset.update = "t";
        squareElement.append(squareOutline, squareRounded, skullOutline);
    }

    /**
     * Shows and hides appropriate IMG objects for html representation of square
     * @param {HTMLButtonElement} squareElement
     */
    static updateSquare(squareElement) {
        const hasShipPart = squareElement.dataset.hasShipPart;
        const squareRounded = squareElement.querySelector("img.squareRounded");
        if (!squareRounded)
            throw new Error("Square rounded element does not exist");
        if (hasShipPart === "t") {
            squareRounded.classList.remove("hidden");
        } else {
            squareRounded.classList.add("hidden");
        }

        const wasShot = squareElement.dataset.wasShot;
        const skullOutline = squareElement.querySelector("img.skullOutline");
        if (!skullOutline)
            throw new Error("Square skull element does not exist");
        if (wasShot === "t") {
            skullOutline.classList.remove("hidden");
        } else {
            skullOutline.classList.add("hidden");
        }
    }

    /**
     * Updates the grid based on whether it hasShipParts() or wasShot
     */
    updateGrids() {
        for (const gridElement of this.grids) {
            // DO NOT DO THIS
            // SEND A REQUEST TO GAME TO GET UPDATED SQUARE INFORMATION AT A PER INDEX BASIS
            // THE GAME SHOULD HANDLE WHAT DATA HAS BEEN CHANGED OR NOT AND
            // SEND YOU ONLY THE SQUARES THAT ACTUALLY NEED TO BE UPDATED
            const player = this.gameData.uuidPlayerMap.get(gridElement.dataset.playerID);
            const grid = this.gameData.playerGridMap.get(player);
            if (!player || !grid)
                throw new Error("Player or Grid no longer exist");
            for (const columnElement of gridElement.children) {
                const colIdxToNum = Number(columnElement.dataset.idx);
                for (const squareElement of columnElement.children) {
                    //console.log("Square element: ", squareElement);
                    if (squareElement.dataset.update === "t") {
                        const sqrIdxToNum = Number(squareElement.dataset.idx);
                        const squarePos = new Vector2(colIdxToNum, sqrIdxToNum);
                        const square = grid.getSquare(squarePos);
                        if (!square) throw new Error("Square does not exist");
                        DOM.fillSquareData(squareElement, square);
                        DOM.updateSquare(squareElement);
                        squareElement.dataset.update = "f";
                        //console.log("Updated square ", squareElement.tagName, "with square ", square);
                    }
                }
            }
        }
    }

    static async getPlayerStrikePos() {
        // await post request that player sends to continue gameData, strikePos
        // verify strikePos is a array with two elements
        return;
    }
}
