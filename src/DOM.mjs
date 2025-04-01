import { Vector2 } from "./vector2.mjs";
import { Game, Player, Grid, Square } from "./battleship.mjs";
import Images from "./ImageImporter.mjs";

export class DOM {
    /**
     *
     * @param {Game} game
     */
    constructor(game) {
        /**
         * @type {Game}
         */
        this.CurGame = game;
        /**
         * @type {Set}
         */
        this.GridElementSet = new Set();
        /**
         * @type {Element|null}
         */
        this.Content = document.querySelector(".content");
    }

    loadTemplate() {
        const newGridsContainer = this.getGridContainer(this.CurGame);
        if (!newGridsContainer)
            throw new Error("HTML: Grids failed to initialize");
        //console.log("Appended grid containers");
        this.updateGrids(this.CurGame);
        this.Content?.append(newGridsContainer);
        this.Content?.addEventListener("click", (e) => {
            if (!e || !e.target) return;
        });
    }

    /**
     * Creates grid element for provided grid, associating it with the given player
     * @param {Grid} grid
     * @param {string} playerUUID
     * @returns {Element|null}
     */
    createGridElements(grid, playerUUID) {
        const gridElement = document.createElement("div");
        gridElement.classList.add("grid");
        gridElement.dataset.uuid = playerUUID;
        const playerGrid = grid.get();
        // load grid into html
        let colIdx = 0;
        for (const column of playerGrid) {
            const columnElement = document.createElement("div");
            columnElement.classList.add("column");
            columnElement.dataset.idx = colIdx.toString();
            let sqrIdx = 0;
            for (const square of column) {
                const squareElement = document.createElement("button");
                squareElement.classList.add(
                    "square",
                    "grabbable",
                    "img-container"
                );
                squareElement.dataset.idx = sqrIdx.toString();
                DOM.drawSquare(squareElement);
                columnElement.append(squareElement);
                sqrIdx += 1;
            }
            gridElement.append(columnElement);
            colIdx += 1;
        }
        this.GridElementSet.add(gridElement);
        return gridElement;
    }

    /**
     * Initializes grids for the game passed as an argument, then returns the gridContainer created
     * @param {Game} game
     * @returns {Element}
     */
    getGridContainer(game) {
        this.GridElementSet.clear();
        const gridsContainer = document.createElement("div");
        gridsContainer.classList.add("grids-container");
        for (const entry of game.playerGridMap.entries()) {
            /** @type {[Player, Grid]} */
            const [player, grid] = entry;
            const newGrid = this.createGridElements(grid, player.getUUID());
            if (!newGrid) throw new Error("Grid was not creatable");
            gridsContainer.append(newGrid);
        }
        if (!(gridsContainer.children.length > 0))
            throw new Error("Grids container is empty");
        return gridsContainer;
    }

    /**
     *
     * @param {HTMLButtonElement} squareElement
     * @param {Square|null} square
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
        //console.log("Filled square data for ", squareElement.tagName, "with square ", square);
    }

    static SVG = (() => {
        const NameToAlt = new Map([
            ["squareOutline", "□"],
            ["skullOutline", "💀"],
            ["squareRounded", "■"],
        ]);

        /**
         * Creates a new object for an svg and adds data, type, and alt
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
         * Create svg object
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
        const squareOutline = DOM.SVG.createImgElementFromName("squareOutline");
        const squareRounded = DOM.SVG.createImgElementFromName("squareRounded");
        const squareSkull = DOM.SVG.createImgElementFromName("skullOutline");
        squareOutline.hidden = true;
        squareRounded.hidden = true;
        squareSkull.hidden = true;
        squareElement.append(squareOutline, squareRounded, squareSkull);
    }

    /**
     * Shows and hides appropriate svg objects for html representation of square
     * @param {HTMLButtonElement} squareElement
     */
    static updateSquare(squareElement) {
        const hasShipPart = squareElement.dataset.hasShipPart;
        const squareFilledObj = squareElement.querySelector(
            "object.squareFilled"
        );
        if (hasShipPart === "t") {
            squareFilledObj?.classList.remove("hidden");
        } else {
            squareFilledObj?.classList.add("hidden");
        }

        const wasShot = squareElement.dataset.wasShot;
        const squareSkull = squareElement.querySelector("object.squareSkull");
        if (wasShot === "t") {
            squareSkull?.classList.remove("hidden");
        } else {
            squareSkull?.classList.add("hidden");
        }
    }

    /**
     * Updates the grid based on whether it has shipParts or was
     * @param {Game} game
     */
    updateGrids(game) {
        for (const gridElement of this.GridElementSet) {
            const player = game.uuidPlayerMap.get(gridElement.dataset.uuid);
            const grid = game.playerGridMap.get(player);
            if (!player || !grid)
                throw new Error("Player or Grid no longer exist");
            for (const columnElement of gridElement.children) {
                const colIdxToNum = Number(columnElement.dataset.idx);
                for (const squareElement of columnElement.children) {
                    if (squareElement.dataset.update === "t") {
                        const sqrIdxToNum = Number(squareElement.dataset.idx);
                        const squarePos = new Vector2(colIdxToNum, sqrIdxToNum);
                        const square = grid.getSquare(squarePos);
                        DOM.fillSquareData(squareElement, square);
                        DOM.updateSquare(squareElement);
                    }
                }
            }
        }
        //console.log("Updated grid");
    }

    static onStartGame(game) {}

    static async getPlayerStrikePos() {
        // await post request that player sends to continue game, strikePos
        // verify strikePos is a array with two elements
        return;
    }
}
