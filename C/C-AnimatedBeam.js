
//  Copyright © 2025, Classical Circuit Simulator (C.js)
//  Animated Beam System for visualizing data flow




C.AnimatedBeam = function (params) {

    // Unique identifier for this beam instance
    this.id = 'beam-' + C.AnimatedBeam.index++

    // Source and target elements
    this.fromElement = params.fromElement
    this.toElement = params.toElement
    this.containerElement = params.containerElement || document.body

    // Visual properties
    this.color = params.color || 'var(--C-color-green)'
    this.duration = params.duration || 1000  // milliseconds
    this.strokeWidth = params.strokeWidth || 2
    this.value = params.value !== undefined ? params.value : 1  // 0 or 1

    // Animation state
    this.isAnimating = false
    this.svg = null
    this.path = null
    this.animationElement = null

    // Create the SVG elements
    this.create()
}




Object.assign(C.AnimatedBeam, {

    index: 0,
    activeBeams: [],

    // Color mapping for bit values
    getColorForValue: function (value) {
        return value === 1 ? 'var(--C-color-green)' : 'var(--C-color-titanium)'
    },

    // Clear all active beams
    clearAll: function () {
        C.AnimatedBeam.activeBeams.forEach(function (beam) {
            beam.destroy()
        })
        C.AnimatedBeam.activeBeams = []
    },

    // Create beam between two elements
    createBeam: function (fromEl, toEl, containerEl, value) {
        const beam = new C.AnimatedBeam({
            fromElement: fromEl,
            toElement: toEl,
            containerElement: containerEl,
            value: value,
            color: C.AnimatedBeam.getColorForValue(value)
        })
        C.AnimatedBeam.activeBeams.push(beam)
        return beam
    }
})




Object.assign(C.AnimatedBeam.prototype, {

    create: function () {

        // Get positions of from and to elements
        const fromRect = this.fromElement.getBoundingClientRect()
        const toRect = this.toElement.getBoundingClientRect()
        const containerRect = this.containerElement.getBoundingClientRect()

        // Calculate center points
        const fromX = fromRect.left + fromRect.width / 2 - containerRect.left
        const fromY = fromRect.top + fromRect.height / 2 - containerRect.top
        const toX = toRect.left + toRect.width / 2 - containerRect.left
        const toY = toRect.top + toRect.height / 2 - containerRect.top

        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        this.svg.setAttribute('class', 'C-animated-beam')
        this.svg.setAttribute('id', this.id)
        this.svg.style.position = 'absolute'
        this.svg.style.top = '0'
        this.svg.style.left = '0'
        this.svg.style.width = '100%'
        this.svg.style.height = '100%'
        this.svg.style.pointerEvents = 'none'
        this.svg.style.zIndex = '5'

        // Create defs for gradient
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
        gradient.setAttribute('id', this.id + '-gradient')
        gradient.setAttribute('gradientUnits', 'userSpaceOnUse')

        // Create gradient stops
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
        stop1.setAttribute('offset', '0%')
        stop1.setAttribute('stop-color', this.color)
        stop1.setAttribute('stop-opacity', '0')

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
        stop2.setAttribute('offset', '50%')
        stop2.setAttribute('stop-color', this.color)
        stop2.setAttribute('stop-opacity', '1')

        const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
        stop3.setAttribute('offset', '100%')
        stop3.setAttribute('stop-color', this.color)
        stop3.setAttribute('stop-opacity', '0')

        gradient.appendChild(stop1)
        gradient.appendChild(stop2)
        gradient.appendChild(stop3)
        defs.appendChild(gradient)
        this.svg.appendChild(defs)

        // Create path
        this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

        // Create curved path for more visual appeal
        const midX = (fromX + toX) / 2
        const midY = (fromY + toY) / 2
        const dx = toX - fromX
        const dy = toY - fromY

        // Control point for bezier curve (perpendicular offset)
        const offset = 20
        const perpX = -dy / Math.sqrt(dx * dx + dy * dy) * offset
        const perpY = dx / Math.sqrt(dx * dx + dy * dy) * offset

        const pathData = `M ${fromX},${fromY} Q ${midX + perpX},${midY + perpY} ${toX},${toY}`

        this.path.setAttribute('d', pathData)
        this.path.setAttribute('fill', 'none')
        this.path.setAttribute('stroke', `url(#${this.id}-gradient)`)
        this.path.setAttribute('stroke-width', this.strokeWidth)
        this.path.setAttribute('stroke-linecap', 'round')

        this.svg.appendChild(this.path)
        this.containerElement.appendChild(this.svg)

        return this
    },

    animate: function () {

        if (this.isAnimating) return this

        this.isAnimating = true

        const scope = this
        const gradient = this.svg.querySelector('linearGradient')

        if (!gradient) return this

        // Animate gradient position along the line
        let progress = 0
        const animate = function () {

            progress += 0.02  // Animation speed
            if (progress > 2) progress = 0  // Loop

            // Update gradient stops to create moving effect
            const stop1 = gradient.children[0]
            const stop2 = gradient.children[1]
            const stop3 = gradient.children[2]

            const offset1 = Math.max(0, Math.min(100, (progress - 0.5) * 50))
            const offset2 = Math.max(0, Math.min(100, progress * 50))
            const offset3 = Math.max(0, Math.min(100, (progress + 0.5) * 50))

            stop1.setAttribute('offset', offset1 + '%')
            stop2.setAttribute('offset', offset2 + '%')
            stop3.setAttribute('offset', offset3 + '%')

            if (scope.isAnimating) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)

        return this
    },

    stop: function () {

        this.isAnimating = false
        return this
    },

    destroy: function () {

        this.stop()
        if (this.svg && this.svg.parentNode) {
            this.svg.parentNode.removeChild(this.svg)
        }

        // Remove from active beams list
        const index = C.AnimatedBeam.activeBeams.indexOf(this)
        if (index > -1) {
            C.AnimatedBeam.activeBeams.splice(index, 1)
        }

        return this
    }
})
