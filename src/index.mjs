import "./css-reset.css";
import "./style.css";

import { Game, User } from "./battleship.mjs";
import { DOM } from "./DOM.mjs";

document.addEventListener("DOMContentLoaded", (e) => {
  console.log("DOMContentLoaded");
  const game = new Game([new User("Test")]);
  const dom = new DOM(game);
  dom.loadTemplate();
});
