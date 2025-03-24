class Node {
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

export class LinkedListQueue {
    constructor() {
        this.head = null;
        this.tail = null;
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

    dequeue() {
        if (!this.head) return null;
        const value = this.head.value;
        this.head = this.head.next;
        if (!this.head) this.tail = null;
        this.length--;
        return value;
    }

    peek() {
        return this.head ? this.head.value : null;
    }

    isEmpty() {
        return this.length === 0;
    }

    size() {
        return this.length;
    }
}