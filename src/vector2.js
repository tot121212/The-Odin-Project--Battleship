export class Vector2 {
    /**
     * 
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
      if (!(typeof x === 'number')) throw new Error("x is not a number");
      if (!(typeof y === 'number')) throw new Error("y is not a number");
      this.x = x;
      this.y = y;
    }

    /**
     * Returns new Vector2 as a result of adding "this" and "other" together
     * @param {Vector2} vec 
     * @returns {Vector2|null}
     */
    add(vec) {
        if (!vec || (!(vec instanceof Vector2))) return null;
        else return new Vector2(this.x + vec.x, this.y + vec.y);
    }
    /**
     * converts vector to an array with two elements, x and y
     * @returns {Array<number,number>}
     */
    toArray(){
      return [this.x, this.y];
    }
    /**
     * Rotates vector 90 degrees counter clockwise
     * @param {Vector2} vec
     * @returns {Vector2|null}
     */
    rotateCounterClock90Deg(vec){
      if (!vec || !(vec instanceof Vector2)) return null;
      else return new Vector2(-vec.y, vec.x);
    }
    /**
     * Rotates vector 90 degrees clockwise
     * @param {Vector2} vec
     */
    rotateClock90Deg(vec) {
      if (!vec || !(vec instanceof Vector2)) return null;
      return new Vector2(vec.y, -vec.x);
    }
}