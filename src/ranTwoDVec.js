import { Chance } from "chance";
const chance = new Chance();
import {Vector2} from "./vector2.js";
/**
 * 
 * @param {number} minX
 * @param {number} maxX
 * @param {number} minY
 * @param {number} maxY
 * @returns {Vector2}
 */
export const ranTwoDVec = (minX, maxX, minY, maxY)=>{
    return new Vector2(chance.integer({min:minX, max: maxX}), chance.integer({min:minY, max: maxY}));
}