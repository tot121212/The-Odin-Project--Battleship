class Vector2 {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    
    /**
     * Sets the x and y values of the vector
     * @param {number} x 
     * @param {number} y 
     */
    set(x, y){
      if (typeof x !== 'number') throw new Error("x is not a number");
      if (typeof y !== 'number') throw new Error("y is not a number");
      this.x = x;
      this.y = y;
    }

    /**
     * Duplicates 'this' and returns it
     * @returns {Vector2}
     */
    copy(){
      return new Vector2(this.x, this.y);
    }
    
    /**
     * Returns new Vector2 as a result of adding 'this' and 'vec' together,
     * If an argument is not provided or is not valid, will return a duplicate of 'this'
     * @param {Vector2|undefined} vec 
     * @returns {Vector2|void}
     */
    add(vec = undefined) {
        if (typeof vec !== 'object' || !(vec instanceof Vector2)) return this.copy();
        else return new Vector2(this.x + vec.x, this.y + vec.y);
    }
    
    /**
     * converts vector to an array with two elements, [x,y]
     * @returns {Array<number,number>}
     */
    toArray(){
      return [this.x, this.y];
    }
    /**
     * converts array to a string in the format of 'x,y'
     * @returns {string}
     */
    toString(){
      return `${this.x}, ${this.y}`;
    }

    /**
     * Returns new Vector2 as a result of multiplying 'this' by 'by'
     * If an argument is not provided or is not valid, will return a duplicate of 'this'
     * @param {Vector2} by 
     * @returns {Vector2}
     */
    transform(by){
      if (typeof by !== 'object' || !(by instanceof Vector2)) return this.copy();
      return new Vector2(
          this.x * by.x + this.y * by.y,
          this.x * by.y - this.y * by.x
      );
    }

    /**
     * Compares two Vector2 objects, returning true if they are equal and false if not
     * @param {Vector2} vec
     * @returns {boolean}
     */
    equals(vec){
      if (typeof vec !== 'object' || !(vec instanceof Vector2)) return false;
      return this.x === vec.x && this.y === vec.y;
    }
}

export default Vector2;