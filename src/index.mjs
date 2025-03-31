import './css-reset.css';
import './style.css';

import {Game, User} from "./battleship.mjs";
import {DOM} from "./DOM.mjs";

window.onload = (()=>{
    console.log("Script loaded", 0);
    const game = new Game([new User('Test')]);
    DOM.loadTemplate(game);
});