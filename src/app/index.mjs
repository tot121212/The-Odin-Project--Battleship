import "./css-reset.css";
import "./style.css";

import { DOM } from "./DOM.mjs";

const socket = new WebSocket('ws://localhost:3762');

const getLocalUser = async ()=>{

}

const getNewGame = async ()=>{
    
}

document.addEventListener("DOMContentLoaded", async (e) => {
    console.log("DOMContentLoaded");
    // this would be an event handler to grab the user from a cookie or smthn if it existed
    const dom = new DOM();
    await getLocalUser();
    await getNewGame();
    dom.loadTemplate();
});
