class Node {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

export class LinkedListQueue {
    constructor() {
        this.head = null;
        this.tail = null;
        this.length = 0;
    }

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
        if (!this.head) return undefined;
        const value = this.head.value;
        this.head = this.head.next;
        if (!this.head) this.tail = null;
        this.length--;
        return value;
    }

    peek() {
        return this.head ? this.head.value : undefined;
    }

    isEmpty() {
        return this.length === 0;
    }

    size() {
        return this.length;
    }
}