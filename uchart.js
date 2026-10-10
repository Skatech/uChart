"use strict"

class Rect {
    /** @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2 */
    constructor(x1, y1, x2, y2) {
        this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2;
    }

    get width() {
        return this.x2 - this.x1
    }

    get height() {
        return this.y2 - this.y1
    }

    /** @param {number} x @param {number} y */
    addPoint(x, y) {
        this.x1 = Math.min(x, this.x1)
        this.y1 = Math.min(y, this.y1)
        this.x2 = Math.max(x, this.x2)
        this.y2 = Math.max(y, this.y2)
    }

    /** @param {Rect} rect */
    addRect(rect) {
        this.addPoint(rect.x1, rect.y1)
        this.addPoint(rect.x2, rect.y2)
    }
    
    static createWeak() {
        return new Rect(Number.MAX_VALUE, Number.MAX_VALUE,
            Number.MIN_VALUE, Number.MIN_VALUE)
    }
}

class ChartX {
    /** Constructs chart
     * @param {Object} options
     * @param {undefined|string} options.title
     * @param {undefined|string} options.color
     * @param {undefined|number} options.bold
     * @param {undefined|number[]} options.data */
    constructor(options = {}) {
        this.data = options.data ?? []
        this.title = options.title
        this.color = options.color
        this.bold = options.bold
        this.bounds = new Rect()
        this.recalculateBounds()
    }

    get count() {
        return this.data.length / 2
    }

    /** @param {number} idx */
    x(idx) {
        return this.data[idx * 2]
    }
    
    /** @param {number} idx */
    y(idx) {
        return this.data[idx * 2 + 1]
    }

    /** @param {number} x @param {number} y */
    add(x, y) {
        this.data.push(x, y); this.bounds.addPoint(x, y)
    }

    recalculateBounds() {
        this.bounds = Rect.createWeak()
        for (let i = 0, n = this.count; i < n; ++i)
            this.bounds.addPoint(this.x(i), this.y(i))
    }

    /** @param {number} count @param {(i:number) => number} fnx @param {(x:number) => number} fny */
    static makeData(count, fnx, fny) {
        const data = []
        for (let i = 0; i < count; ++i) {
            const x = fnx(i)
            data.push(x, fny(x))
        }
        return data
    }
}

class ChartPanelX {
    /** Constructs chart control
     * @param {HTMLCanvasElement} canvas @param {Object} options
     * @param {undefined|{ left: number, bottom: number, right: number, top: number }} options.offsets - by default: { left: 20, bottom: 20, right: 10, top: 10 }
     * @param {undefined|number} options.tickCountX - by default: 5
     * @param {undefined|number} options.tickCountY - by default: 5
     * @param {undefined|number} options.tickStepX  - by default: undefined = auto-select
     * @param {undefined|number} options.tickStepY  - by default: undefined = auto-select
     * @param {undefined|number} options.gridBold   - by default: 0.33
     * @param {undefined|string} options.gridColor  - by default: ButtonBorder color
     * @param {undefined|number} options.chartBold   - by default: 0.66
     * @param {undefined|string} options.chartColor  - by default: AccentColor color
     * @param {undefined|string} options.backgroundColor - by default: undefined
     * @param {undefined|boolean} options.crosshair - by default: false
     * @param {undefined|ChartX[]} options.charts */
    constructor(canvas, options = {}) {
        this.charts = options.charts ?? []
        this.canvas = canvas
        this.canvas.width = this.canvas.clientWidth
        this.canvas.height = this.canvas.clientHeight
        this.canvas.style.backgroundColor = options.backgroundColor
        this.offsets = options.offsets ?? { left: 20, bottom: 20, right: 10, top: 10 }
        this.TickCountX = options.tickCountX ?? 5
        this.TickCountY = options.tickCountY ?? 5
        this.TickStepX = options.tickStepX
        this.TickStepY = options.tickStepY
        this.GridBold = 0.33
        this.GridColor = "ButtonBorder"
        this.ChartBold = 0.66
        this.ChartColor = "AccentColor"
        this.enableCrossHair(options.crosshair ?? false)
        this.draw()
    }

    /** @param {boolean} enable */
    enableCrossHair(enable) {
        this.canvas.onmousemove = enable ? this.draw.bind(this) : undefined
        this.draw()
    }

    /** @param {number} width @param {number} steps @return {number} */
    getBestTickStep(width, steps) {
        const variants = [1, 2, 5] // 0.75-1.5 1.5-3 3.75-7.5
        const step = width / steps
        for(let ivar = 0, mult = 1; true;) {
            const variant = mult * variants[ivar]
            if (ivar < 1 && variant * 0.75 > step) {
                mult /= 10
            }
            else {
                if (variant * 1.5 >= step) {
                    return variant
                }
                if (++ivar == variants.length) {
                    mult *= 10
                    ivar = 0
                }
            }
        }
    }

    /** @param {undefined|{offsetX:number, offsetY:number}} crosshair */
    draw(crosshair) {
        const ctx = this.canvas.getContext("2d")
        ctx.lineJoin = "round"
        ctx.imageSmoothingEnabled = false;
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        const bounds = this.charts.reduce((r, c) => { r.addRect(c.bounds)
                return r }, this.charts.length ? Rect.createWeak() : new Rect(0,0,0,0))
        const chartleft = this.offsets.left, chartright = this.canvas.width - this.offsets.right
        const chartbottom = this.canvas.height - this.offsets.bottom, charttop = this.offsets.top
        const scalex = (chartright - chartleft) / bounds.width
        const scaley = (chartbottom - charttop) / bounds.height
        const tickStepX = this.TickStepX ?? this.getBestTickStep(bounds.width, this.TickCountX)
        const tickStepY = this.TickStepY ?? this.getBestTickStep(bounds.height, this.TickCountY)

        ctx.lineWidth = this.GridBold
        ctx.fillStyle = ctx.strokeStyle = this.GridColor
        ctx.beginPath()
        for (let x = bounds.x1 - (bounds.x1 + tickStepX) % tickStepX; x <= bounds.x2; x += tickStepX) {
            const sx = Math.round((x - bounds.x1) * scalex + chartleft) + 0.5
            ctx.moveTo(sx, charttop)
            ctx.lineTo(sx, chartbottom)

            const marker = x.toString()
            const metric = ctx.measureText(marker)
            ctx.fillText(marker, sx - metric.width / 2, chartbottom
                + metric.fontBoundingBoxAscent + metric.fontBoundingBoxDescent)
        }
        for (let y = bounds.y1 - (bounds.y1 + tickStepY) % tickStepY; y <= bounds.y2; y += tickStepY) {
            const sy = Math.round(chartbottom - (y - bounds.y1) * scaley) + 0.5
            ctx.moveTo(chartleft, sy)
            ctx.lineTo(chartright, sy)

            const marker = y.toString()
            const metric = ctx.measureText(marker)
            ctx.fillText(marker, Math.max(3, chartleft - metric.width - 3), sy + metric.fontBoundingBoxAscent / 2)
        }
        ctx.stroke()

        for(const chart of this.charts) {
            ctx.lineWidth = chart.bold ?? this.ChartBold
            ctx.fillStyle = ctx.strokeStyle = chart.color ?? this.ChartColor
            ctx.beginPath()
            for (let i = 0, n = chart.count; i < n; ++i) {
                const x = chart.x(i), y = chart.y(i)
                const sx = (x - bounds.x1) * scalex + chartleft
                const sy = chartbottom - (y - bounds.y1) * scaley
                if (i > 0) {
                    ctx.lineTo(sx, sy)
                }
                else {
                    if (chart.title?.length) {
                        const metric = ctx.measureText(chart.title) 
                        ctx.fillText(chart.title, sx,
                            sy + metric.fontBoundingBoxAscent + metric.fontBoundingBoxDescent)
                    }
                    ctx.moveTo(sx, sy)
                }
            }
            ctx.stroke()
        }

        if (crosshair) {
            const x = crosshair.offsetX, y = crosshair.offsetY
            if (x >= chartleft && chartright >= x && y >= charttop && chartbottom >= y) {
                ctx.lineWidth = this.ChartBold
                ctx.fillStyle = ctx.strokeStyle = this.ChartColor
                ctx.beginPath()
                ctx.moveTo(chartleft, y + 0.5)
                ctx.lineTo(chartright, y + 0.5)
                ctx.moveTo(x + 0.5, charttop)
                ctx.lineTo(x + 0.5, chartbottom)

                const cx = (chartright + chartleft) / 2
                const cy = (chartbottom + charttop) / 2
                const mx = x < cx ? x + 30 : x - 30
                const my = y < cy ? y + 30 : y - 30
                const xv = (x - chartleft) / scalex + bounds.x1
                const yv = (chartbottom - y) / scaley + bounds.y1
                const marker = `${xv.toFixed(2)}, ${yv.toFixed(2)}`
                const metric = ctx.measureText(marker)
                ctx.fillText(marker, mx - metric.width / 2, my
                    + (metric.fontBoundingBoxAscent + metric.fontBoundingBoxDescent) / 2)
                ctx.stroke()
            }
        }
    }
}

function runTests() {
    const r = new ChartX({ title: "Sin(x)", color: "#ff0000", bold: 0.75,
        data: ChartX.makeData(181, i => i * 2, x => Math.sin(x * Math.PI / 180) + 0)})

    const r1 = new ChartX({ title: "Lin", color: "#ffff00", bold: 0.5,
        data: [45, -1, 360-45, 1]})

    window.c = new ChartPanelX(document.querySelector("canvas"),
        { backgroundColor: undefined, charts: [r, r1]/*, tickStepX: 45*/, crosshair: true })
}
