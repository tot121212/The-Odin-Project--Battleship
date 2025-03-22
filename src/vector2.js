export class Vector2 {
    /**
     * 
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }

    /**
     * Returns new Vector2 as a result of adding "this" and "other" together
     * @param {Vector2} other 
     * @returns {Vector2}
     */
    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }
    /**
     * Rotates vector 90 degrees counter clockwise
     * @param {Vector2} vec
     */
    rotateCounterClock90Deg(vec){
      return new Vector2(-vec.y, vec.x);
    }
    /**
     * Rotates vector 90 degrees clockwise
     * @param {Vector2} vec
     */
    rotateClock90Deg(vec) {
      return new Vector2(vec.y, -vec.x);
    }
    
}