import "./css-reset.css";
import "./style.css";

import { Game, User } from "./battleship.mjs";
import { DOM } from "./DOM.mjs";

document.addEventListener("DOMContentLoaded", (e) => {
    console.log("DOMContentLoaded");
    // this would be an event handler to grab the user from a cookie or smthn if it existed
    const mainUser = new User("User 1");
    const game = new Game(mainUser);
    const dom = new DOM(game);
    dom.loadTemplate();
});
