export class Node {
    /**
     * 
     * @param {any} value 
     */
    constructor(value) {
        this.value = value;
        /**
         * @type {Node|null}
         */
        this.next = null;
    }
}

class LinkedListQueue {
    constructor() {
        /**
         * @type {Node|null}
         */
        this.head = null;
        /**
         * @type {Node|null}
         */
        this.tail = null;
        /**
         * @type {number}
         */
        this.length = 0;
    }

    /**
     * 
     * @param  {...any} values 
     */
    enqueue(...values) {
        for (const value of values) {
            const newNode = new Node(value);
            if (!this.tail) {
                this.head = this.tail = newNode;
            } else {
                this.tail.next = newNode;
                this.tail = newNode;
            }
            this.length++;
        }
    }

    /**
     * 
     * @returns {any}
     */
    dequeue() {
        if (!this.head) return null;
        const value = this.head.value;
        this.head = this.head.next;
        if (!this.head) this.tail = null;
        this.length--;
        return value;
    }

    /**
     * 
     * @returns {any|null}
     */
    peek() {
        return this.head ? this.head.value : null;
    }

    /**
     * 
     * @returns {boolean}
     */
    isEmpty() {
        return this.length === 0;
    }

    /**
     * 
     * @returns {number}
     */
    size() {
        return this.length;
    }
}

export default LinkedListQueue;