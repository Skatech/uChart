"use strict"

class LinearFunction {
    /** @param {number} k @param {number} b */
    constructor(k, b) {
        this.k = k
        this.b = b
    }

    /** @param {number} y */
    getX(y) {
        return (y - this.b) / this.k
    }

    /** @param {number} x */
    getY(x) {
        return this.k * x + this.b
    }

    toString() {
        return `y = ${this.k} * x + ${this.b}`
    }

    /** @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2 */
    static fromPoints(x1, y1, x2, y2) {
        const k = (y2 - y1) / (x2 - x1)
        const b = y1 - k * x1
        return new LinearFunction(k, b)
    }
}