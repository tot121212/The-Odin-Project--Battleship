import './style.css';

import {Game, User} from "./battleship.mjs";
import {DOM} from "./DOM.mjs";

document.addEventListener("DOMContentLoaded", (e)=>{
    const game = new Game([new User('Test')]);
    DOM.loadTemplate(game);
});