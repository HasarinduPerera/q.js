
//  Copyright © 2025, Classical Circuit Simulator (C.js)
//  Based on Q.js by Stewart Smith




C.Circuit.Editor = function (circuit, targetEl) {


	//  First order of business,
	//  we require a valid circuit.

	if (circuit instanceof C.Circuit !== true) circuit = new C.Circuit()
	this.circuit = circuit
	this.index = C.Circuit.Editor.index++


	//  C.Circuit.Editor is all about the DOM
	//  so we're going to get some use out of this
	//  stupid (but convenient) shorthand here.

	const createDiv = function () {

		return document.createElement('div')
	}




	//  We want to "name" our circuit editor instance
	//  but more importantly we want to give it a unique DOM ID.

	this.name = typeof circuit.name === 'string' ?
		circuit.name :
		'C Editor ' + this.index


	//  If we've been passed a target DOM element
	//  we should use that as our circuit element.

	if (typeof targetEl === 'string') targetEl = document.getElementById(targetEl)
	const circuitEl = targetEl instanceof HTMLElement ? targetEl : createDiv()
	circuitEl.classList.add('C-circuit')


	//  If the target element already has an ID
	//  then we want to use that as our domID.

	if (typeof circuitEl.getAttribute('id') === 'string') {

		this.domId = circuitEl.getAttribute('id')
	}


	//  Otherwise let's transform our name value
	//  into a usable domId.

	else {

		let domIdBase = this.name
			.replace(/^[^a-z]+|[^\w:.-]+/gi, '-'),
			domId = domIdBase,
			domIdAttempt = 1

		while (document.getElementById(domId) !== null) {

			domIdAttempt++
			domId = domIdBase + '-' + domIdAttempt
		}
		this.domId = domId
		circuitEl.setAttribute('id', this.domId)
	}




	//  We want a way to easily get to the circuit
	//  from this interface's DOM element.

	circuitEl.circuit = circuit
	this.domElement = circuitEl


	//  Create a toolbar for containing buttons.

	const toolbarEl = createDiv()
	circuitEl.appendChild(toolbarEl)
	toolbarEl.classList.add('C-circuit-toolbar')


	//  Create a toggle switch for locking the circuit.

	const lockToggle = createDiv()
	toolbarEl.appendChild(lockToggle)
	lockToggle.classList.add('C-circuit-button', 'C-circuit-toggle', 'C-circuit-toggle-lock')
	lockToggle.setAttribute('title', 'Lock / unlock')
	lockToggle.innerText = '🔓'


	//  Create an "Undo" button

	const undoButton = createDiv()
	toolbarEl.appendChild(undoButton)
	undoButton.classList.add('C-circuit-button', 'C-circuit-button-undo')
	undoButton.setAttribute('title', 'Undo')
	undoButton.setAttribute('C-disabled', 'C-disabled')
	undoButton.innerHTML = '⟲'
	window.addEventListener('C.History undo is depleted', function (event) {

		if (event.detail.instance === circuit)
			undoButton.setAttribute('C-disabled', 'C-disabled')
	})
	window.addEventListener('C.History undo is capable', function (event) {

		if (event.detail.instance === circuit)
			undoButton.removeAttribute('C-disabled')
	})


	//  Create an "Redo" button

	const redoButton = createDiv()
	toolbarEl.appendChild(redoButton)
	redoButton.classList.add('C-circuit-button', 'C-circuit-button-redo')
	redoButton.setAttribute('title', 'Redo')
	redoButton.setAttribute('C-disabled', 'C-disabled')
	redoButton.innerHTML = '⟳'
	window.addEventListener('C.History redo is depleted', function (event) {

		if (event.detail.instance === circuit)
			redoButton.setAttribute('C-disabled', 'C-disabled')
	})
	window.addEventListener('C.History redo is capable', function (event) {

		if (event.detail.instance === circuit)
			redoButton.removeAttribute('C-disabled')
	})


	//  Create an "Evaluate" button

	const evaluateButton = createDiv()
	toolbarEl.appendChild(evaluateButton)
	evaluateButton.classList.add('C-circuit-button', 'C-circuit-button-evaluate')
	evaluateButton.setAttribute('title', 'Evaluate circuit')
	evaluateButton.innerText = 'RUN'


	//  Create a circuit board container

	const boardContainerEl = createDiv()
	circuitEl.appendChild(boardContainerEl)
	boardContainerEl.classList.add('C-circuit-board-container')
	boardContainerEl.addEventListener('mousemove', C.Circuit.Editor.onPointerMove)
	boardContainerEl.addEventListener('mouseleave', function () {
		C.Circuit.Editor.unhighlightAll(circuitEl)
	})

	const boardEl = createDiv()
	boardContainerEl.appendChild(boardEl)
	boardEl.classList.add('C-circuit-board')

	const backgroundEl = createDiv()
	boardEl.appendChild(backgroundEl)
	backgroundEl.classList.add('C-circuit-board-background')


	//  Create background wires for each bit

	for (let i = 0; i < circuit.bandwidth; i++) {

		const rowEl = createDiv()
		backgroundEl.appendChild(rowEl)
		rowEl.style.position = 'relative'
		rowEl.style.gridRowStart = i + 2
		rowEl.style.gridColumnStart = 1
		rowEl.style.gridColumnEnd = C.Circuit.Editor.momentIndexToGridColumn(circuit.timewidth) + 1
		rowEl.setAttribute('register-index', i + 1)

		const wireEl = createDiv()
		rowEl.appendChild(wireEl)
		wireEl.classList.add('C-circuit-register-wire')
	}

	//  Helper to draw intermediate wires
	C.Circuit.Editor.drawIntermediateWires = function (circuitEl) {
		const
			circuit = circuitEl.circuit,
			backgroundEl = circuitEl.querySelector('.C-circuit-board-background')

		// Clear existing intermediate wires
		const existing = backgroundEl.querySelectorAll('.C-circuit-intermediate-wire')
		existing.forEach(el => el.remove())

		// Find all intermediate wires
		const intermediateWires = new Set()
		circuit.operations.forEach(function (op) {
			if (op.outputWire && op.outputWire % 1 !== 0) {
				intermediateWires.add(op.outputWire)
			}
		})

		// Draw them
		intermediateWires.forEach(function (wireIndex) {
			const rowEl = createDiv()
			backgroundEl.appendChild(rowEl)
			rowEl.classList.add('C-circuit-intermediate-wire')
			rowEl.style.position = 'relative'

			// For single resolution grid:
			// Wire 1.5 -> Between Row 2 (Reg 1) and Row 3 (Reg 2)
			// We place it in Row 2 and align to bottom
			const floorIndex = Math.floor(wireIndex)
			rowEl.style.gridRowStart = floorIndex + 1

			rowEl.style.gridColumnStart = 1
			rowEl.style.gridColumnEnd = C.Circuit.Editor.momentIndexToGridColumn(circuit.timewidth) + 1
			rowEl.style.zIndex = '0'

			const wireEl = createDiv()
			rowEl.appendChild(wireEl)
			wireEl.classList.add('C-circuit-register-wire')

			// Style as intermediate wire (dashed, lower opacity)
			wireEl.style.borderTopStyle = 'dashed'
			wireEl.style.opacity = '0.3'

			// Position exactly at the bottom of this row (which is the top of the next row)
			wireEl.style.top = '100%'
			wireEl.style.marginTop = '-0.5px' // Center on the grid line
		})
	}

	// Initial draw
	C.Circuit.Editor.drawIntermediateWires(circuitEl)


	//  Create background highlight bars for each column

	for (let i = 0; i < circuit.timewidth; i++) {

		const columnEl = createDiv()
		backgroundEl.appendChild(columnEl)
		columnEl.style.gridRowStart = 2
		columnEl.style.gridRowEnd = C.Circuit.Editor.registerIndexToGridRow(circuit.bandwidth) + 1
		columnEl.style.gridColumnStart = i + 3
		columnEl.setAttribute('moment-index', i + 1)
	}


	//  Create the circuit board foreground

	const foregroundEl = createDiv()
	boardEl.appendChild(foregroundEl)
	foregroundEl.classList.add('C-circuit-board-foreground')


	//  Add register index symbols to left-hand column

	for (let i = 0; i < circuit.bandwidth; i++) {

		const
			registerIndex = i + 1,
			registersymbolEl = createDiv()

		foregroundEl.appendChild(registersymbolEl)
		registersymbolEl.classList.add('C-circuit-header', 'C-circuit-register-label')
		registersymbolEl.setAttribute('title', 'Bit ' + registerIndex + ' of ' + circuit.bandwidth)
		registersymbolEl.setAttribute('register-index', registerIndex)
		registersymbolEl.style.gridRowStart = C.Circuit.Editor.registerIndexToGridRow(registerIndex)
		registersymbolEl.innerText = 'B' + registerIndex
	}


	//  Add moment index symbols to top row

	for (let i = 0; i < circuit.timewidth; i++) {

		const
			momentIndex = i + 1,
			momentsymbolEl = createDiv()

		foregroundEl.appendChild(momentsymbolEl)
		momentsymbolEl.classList.add('C-circuit-header', 'C-circuit-moment-label')
		momentsymbolEl.setAttribute('title', 'Moment ' + momentIndex + ' of ' + circuit.timewidth)
		momentsymbolEl.setAttribute('moment-index', momentIndex)
		momentsymbolEl.style.gridColumnStart = C.Circuit.Editor.momentIndexToGridColumn(momentIndex)
		momentsymbolEl.innerText = momentIndex
	}


	//  Add input values

	circuit.bits.forEach(function (bit, i) {

		const
			rowIndex = i + 1,
			inputEl = createDiv()

		inputEl.classList.add('C-circuit-header', 'C-circuit-input')
		inputEl.setAttribute('title', `Bit #${rowIndex} starting value`)
		inputEl.setAttribute('register-index', rowIndex)
		inputEl.style.gridRowStart = C.Circuit.Editor.registerIndexToGridRow(rowIndex)
		inputEl.innerText = bit.value
		foregroundEl.appendChild(inputEl)
	})


	//  Add placeholder cells for each grid position

	for (let m = 0; m < circuit.timewidth; m++) {
		for (let r = 0; r < circuit.bandwidth; r++) {

			const
				momentIndex = m + 1,
				registerIndex = r + 1,
				cellEl = createDiv()

			cellEl.classList.add('C-circuit-cell')
			cellEl.setAttribute('moment-index', momentIndex)
			cellEl.setAttribute('register-index', registerIndex)
			cellEl.style.gridRowStart = C.Circuit.Editor.registerIndexToGridRow(registerIndex)
			cellEl.style.gridColumnStart = C.Circuit.Editor.momentIndexToGridColumn(momentIndex)
			foregroundEl.appendChild(cellEl)
		}
	}


	//  Add operations

	circuit.operations.forEach(function (operation) {

		C.Circuit.Editor.set(circuitEl, operation)
	})


	//  Add event listeners

	circuitEl.addEventListener('mousedown', C.Circuit.Editor.onPointerPress)
	circuitEl.addEventListener('touchstart', C.Circuit.Editor.onPointerPress)
	window.addEventListener(

		'C.Circuit.set$',
		C.Circuit.Editor.prototype.onExternalSet.bind(this)
	)
	window.addEventListener(

		'C.Circuit.clear$',
		C.Circuit.Editor.prototype.onExternalClear.bind(this)
	)


	//  Create results display area

	const resultsEl = createDiv()
	circuitEl.appendChild(resultsEl)
	resultsEl.classList.add('C-circuit-results')


	//  Add reference text

	const referenceEl = document.createElement('p')
	circuitEl.appendChild(referenceEl)
	referenceEl.innerHTML = `
		This circuit is accessible in your JavaScript console
		as <code>document.getElementById('${this.domId}').circuit</code>`


	//  Log to console

	C.log(0.5,

		`\n\nCreated a DOM interface for circuit #${this.index}\n\n`,
		circuit.toDiagram(),
		'\n\n\n'
	)
}


//  Augment C.Circuit to have this functionality.

C.Circuit.toDom = function (circuit, targetEl) {

	return new C.Circuit.Editor(circuit, targetEl).domElement
}
C.Circuit.prototype.toDom = function (targetEl) {

	return new C.Circuit.Editor(this, targetEl).domElement
}




Object.assign(C.Circuit.Editor, {

	index: 0,
	help: function () { return C.help(this) },
	dragEl: null,
	currentGateSymbol: 'NOT',  // Default gate for placement
	gateList: ['NOT', 'AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUF'],
	gridColumnToMomentIndex: function (gridColumn) { return +gridColumn - 2 },
	momentIndexToGridColumn: function (momentIndex) { return momentIndex + 2 },
	gridRowToRegisterIndex: function (gridRow) { return +gridRow - 1 },
	registerIndexToGridRow: function (registerIndex) { return registerIndex + 1 },
	gridSize: 4,
	pointToGrid: function (p) {

		const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
		return 1 + Math.floor(p / (rem * C.Circuit.Editor.gridSize))
	},
	gridToPoint: function (g) {

		const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
		return rem * C.Circuit.Editor.gridSize * (g - 1)
	},
	getInteractionCoordinates: function (event, pageOrClient) {

		if (typeof pageOrClient !== 'string') pageOrClient = 'client'
		if (event.changedTouches &&
			event.changedTouches.length) return {

				x: event.changedTouches[0][pageOrClient + 'X'],
				y: event.changedTouches[0][pageOrClient + 'Y']
			}
		return {

			x: event[pageOrClient + 'X'],
			y: event[pageOrClient + 'Y']
		}
	},

	// Helper to get visual representation for gate
	getGateIcon: function (gate) {
		const icons = {
			'NOT': '¬',      // NOT symbol
			'AND': '∧',      // AND symbol
			'OR': '∨',       // OR symbol
			'NAND': '⊼',     // NAND symbol
			'NOR': '⊽',      // NOR symbol
			'XOR': '⊕',      // XOR symbol (circled plus)
			'XNOR': '⊙',     // XNOR symbol (circled dot)
			'BUF': '▷',      // Buffer (triangle)
			'AND3': '∧₃',    // 3-input AND
			'OR3': '∨₃',     // 3-input OR
			'I': '—',        // Identity (line)
			'P': '◉'         // Probe (filled circle)
		}
		return icons[gate.symbol] || gate.symbol
	},

	set: function (circuitEl, operation) {

		const
			circuit = circuitEl.circuit,
			foregroundEl = circuitEl.querySelector('.C-circuit-board-foreground'),
			momentIndex = operation.momentIndex,
			registerIndex = operation.registerIndices[0],
			gate = operation.gate

		//  Check if operation already exists
		const existingEl = foregroundEl.querySelector(
			`.C-circuit-operation[moment-index="${momentIndex}"][register-index="${registerIndex}"]`
		)
		if (existingEl) {
			existingEl.remove()
		}

		//  Create operation element (matches Q.js structure)
		const operationEl = document.createElement('div')
		foregroundEl.appendChild(operationEl)
		operationEl.classList.add('C-circuit-operation')
		operationEl.classList.add('C-circuit-operation-' + operation.gate.nameCss)

		operationEl.setAttribute('gate-symbol', operation.gate.symbol)
		operationEl.setAttribute('moment-index', momentIndex)
		operationEl.setAttribute('register-index', registerIndex)

		// Handle fractional register indices (intermediate wires)
		if (registerIndex % 1 !== 0) {
			// Place in the row above (floor) and offset down by half a row (2rem)
			operationEl.style.gridRowStart = Math.floor(registerIndex) + 1
			operationEl.style.transform = 'translateY(2rem)'
		} else {
			operationEl.style.gridRowStart = C.Circuit.Editor.registerIndexToGridRow(registerIndex)
		}

		operationEl.style.gridColumnStart = C.Circuit.Editor.momentIndexToGridColumn(momentIndex)

		// Make multi-wire gates span across rows visually
		if (gate.wireSpan > 1) {
			const endRegister = operation.registerIndices[operation.registerIndices.length - 1]
			// Ensure gridRowEnd is an integer
			let endRow = Math.floor(C.Circuit.Editor.registerIndexToGridRow(endRegister + 1))

			// Fix for fractional start (intermediate wires):
			// Since we shift the whole block down by 0.5 row (2rem) using transform,
			// we need to compensate to avoid it being too tall/low.
			if (registerIndex % 1 !== 0) {
				if (endRegister % 1 === 0) {
					// If ending on an integer wire (e.g. 1.5 -> 3), we still overshoot by 0.5 row due to the shift
					// So reduce height by 2rem
					operationEl.style.height = 'calc(100% - 2rem)'
				}
			}

			operationEl.style.gridRowEnd = endRow
			console.log('Setting gate to span from row', registerIndex, 'to', endRegister, '- gridRowEnd:', endRow)
		}

		// Create operation tile (like Q.js)
		const tileEl = document.createElement('div')
		tileEl.classList.add('C-circuit-operation-tile')

		// Use icon instead of plain text
		const icon = C.Circuit.Editor.getGateIcon(gate)
		tileEl.innerHTML = icon

		// Add title attribute for clarity
		tileEl.setAttribute('title', gate.name)

		operationEl.appendChild(tileEl)

		return operationEl
	},


	clear: function (circuitEl, operation) {

		const foregroundEl = circuitEl.querySelector('.C-circuit-board-foreground')
		const operationEl = foregroundEl.querySelector(
			`.C-circuit-operation[moment-index="${operation.momentIndex}"][register-index="${operation.registerIndices[0]}"]`
		)
		if (operationEl) {
			operationEl.remove()
		}
	},


	unhighlightAll: function (circuitEl) {

		Array.from(circuitEl.querySelectorAll(

			'.C-circuit-board-background > div,' +
			'.C-circuit-board-foreground > div'
		))
			.forEach(function (el) {

				el.classList.remove('C-circuit-cell-highlighted')
			})
	},


	onPointerMove: function (event) {

		const
			{ x, y } = C.Circuit.Editor.getInteractionCoordinates(event),
			foundEls = document.elementsFromPoint(x, y),
			boardContainerEl = foundEls.find(function (el) {

				return el.classList.contains('C-circuit-board-container')
			})

		//  Are we dragging something?
		if (C.Circuit.Editor.dragEl !== null) {

			event.preventDefault()

			C.Circuit.Editor.dragEl.style.left = (x + window.pageXOffset + C.Circuit.Editor.dragEl.offsetX) + 'px'
			C.Circuit.Editor.dragEl.style.top = (y + window.pageYOffset + C.Circuit.Editor.dragEl.offsetY) + 'px'

			if (!boardContainerEl && C.Circuit.Editor.dragEl.circuitEl) {
				C.Circuit.Editor.dragEl.classList.add('C-circuit-clipboard-danger')
			}
			else {
				C.Circuit.Editor.dragEl.classList.remove('C-circuit-clipboard-danger')
			}
		}

		if (!boardContainerEl) return

		const circuitEl = boardContainerEl.closest('.C-circuit')
		if (circuitEl.classList.contains('C-circuit-locked')) return

		//  Unhighlight everything first
		Array.from(boardContainerEl.querySelectorAll(`

			.C-circuit-board-background > div,
			.C-circuit-board-foreground > div

		`)).forEach(function (el) {

			el.classList.remove('C-circuit-cell-highlighted')
		})

		//  Calculate which cell we're over
		const
			boardElBounds = boardContainerEl.getBoundingClientRect(),
			xLocal = x - boardElBounds.left + boardContainerEl.scrollLeft + 1,
			yLocal = y - boardElBounds.top + boardContainerEl.scrollTop + 1,
			columnIndex = C.Circuit.Editor.pointToGrid(xLocal),
			rowIndex = C.Circuit.Editor.pointToGrid(yLocal),
			momentIndex = C.Circuit.Editor.gridColumnToMomentIndex(columnIndex),
			registerIndex = C.Circuit.Editor.gridRowToRegisterIndex(rowIndex)

		if (momentIndex > circuitEl.circuit.timewidth ||
			registerIndex > circuitEl.circuit.bandwidth) return

		if (momentIndex < 1 || registerIndex < 1) return

		//  Highlight the current cell
		Array.from(boardContainerEl.querySelectorAll(`

			div[moment-index="${momentIndex}"],
			div[register-index="${registerIndex}"]
		`))
			.forEach(function (el) {

				el.classList.add('C-circuit-cell-highlighted')
			})
	},


	onPointerPress: function (event) {

		//  Safety check
		if (C.Circuit.Editor.dragEl !== null) {
			C.Circuit.Editor.onPointerRelease(event)
			return
		}

		const
			targetEl = event.target,
			circuitEl = targetEl.closest('.C-circuit'),
			paletteEl = targetEl.closest('.C-circuit-palette')

		if (!circuitEl && !paletteEl) return

		const dragEl = document.createElement('div')
		dragEl.classList.add('C-circuit-clipboard')
		const { x, y } = C.Circuit.Editor.getInteractionCoordinates(event)

		//  Handle circuit interactions
		if (circuitEl) {

			const
				circuit = circuitEl.circuit,
				circuitIsLocked = circuitEl.classList.contains('C-circuit-locked'),
				lockEl = targetEl.closest('.C-circuit-toggle-lock')

			//  Toggle lock
			if (lockEl) {
				if (circuitIsLocked) {
					circuitEl.classList.remove('C-circuit-locked')
					lockEl.innerText = '🔓'
				}
				else {
					circuitEl.classList.add('C-circuit-locked')
					lockEl.innerText = '🔒'
					C.Circuit.Editor.unhighlightAll(circuitEl)
				}
				event.preventDefault()
				event.stopPropagation()
				return
			}

			if (circuitIsLocked) return

			const
				undoEl = targetEl.closest('.C-circuit-button-undo'),
				redoEl = targetEl.closest('.C-circuit-button-redo'),
				evaluateEl = targetEl.closest('.C-circuit-button-evaluate'),
				cellEl = targetEl.closest('.C-circuit-cell'),
				operationEl = targetEl.closest('.C-circuit-operation')

			event.preventDefault()
			event.stopPropagation()

			//  Handle toolbar buttons
			if (undoEl) {
				circuit.history.undo$()
				return
			}
			if (redoEl) {
				circuit.history.redo$()
				return
			}
			if (evaluateEl) {
				circuit.evaluate$()
				const resultsEl = circuitEl.querySelector('.C-circuit-results')
				resultsEl.innerText = circuit.report$()
				return
			}
			//  Handle clicking on existing operation - cycle through gates (DISABLED)
			//  Handle clicking on existing operation - drag to move
			if (operationEl) {

				const
					momentIndex = +operationEl.getAttribute('moment-index'),
					registerIndex = +operationEl.getAttribute('register-index'),
					gateSymbol = operationEl.getAttribute('gate-symbol'),
					bounds = operationEl.getBoundingClientRect()

				// Set as current gate
				C.Circuit.Editor.currentGateSymbol = gateSymbol

				// Create drag element
				const dragEl = document.createElement('div')
				dragEl.classList.add('C-circuit-clipboard')

				const clonedOp = operationEl.cloneNode(true)
				// Remove grid positioning from the clone so it sits inside the clipboard correctly
				clonedOp.style.gridRowStart = ''
				clonedOp.style.gridColumnStart = ''
				clonedOp.style.gridRowEnd = ''
				clonedOp.style.gridColumnEnd = ''
				clonedOp.style.left = ''
				clonedOp.style.top = ''
				clonedOp.style.position = '' // Reset position just in case

				dragEl.appendChild(clonedOp)

				dragEl.originEl = circuitEl
				dragEl.offsetX = 0
				dragEl.offsetY = 0
				dragEl.timestamp = Date.now()

				document.body.appendChild(dragEl)
				C.Circuit.Editor.dragEl = dragEl

				// Remove the original gate from the circuit (pick it up)
				circuit.clear$(momentIndex, registerIndex)

				// Start dragging immediately
				C.Circuit.Editor.onPointerMove(event)

				return
			}
			//  Handle clicking on empty cell - place gate
			if (cellEl) {

				const
					momentIndex = +cellEl.getAttribute('moment-index'),
					registerIndex = +cellEl.getAttribute('register-index'),
					gate = C.Gate.findBySymbol(C.Circuit.Editor.currentGateSymbol)

				console.log('Placing gate:', C.Circuit.Editor.currentGateSymbol, 'at moment', momentIndex, 'register', registerIndex)
				console.log('Gate object:', gate)
				console.log('Gate wireSpan:', gate ? gate.wireSpan : 'undefined')

				// For multi-wire gates, automatically span across wires
				if (gate && gate.wireSpan > 1) {
					// Place gate spanning from current wire to wire+wireSpan-1
					const wireIndices = []
					for (let i = 0; i < gate.wireSpan; i++) {
						const wireIdx = registerIndex + i
						if (wireIdx <= circuit.bandwidth) {
							wireIndices.push(wireIdx)
						}
					}
					console.log('Multi-wire gate - wireIndices:', wireIndices, 'need:', gate.wireSpan)
					// Only place if we have enough wires
					if (wireIndices.length === gate.wireSpan) {
						circuit.set$(C.Circuit.Editor.currentGateSymbol, momentIndex, ...wireIndices)
					} else {
						console.warn('Not enough wires to place gate')
					}
				} else {
					// Single-wire gate
					console.log('Single-wire gate')
					circuit.set$(C.Circuit.Editor.currentGateSymbol, momentIndex, registerIndex)
				}

				return
			}
		}

		//  Handle palette interactions - drag gate from palette
		else if (paletteEl) {

			const operationEl = targetEl.closest('.C-circuit-operation')

			if (!operationEl) return

			const
				bounds = operationEl.getBoundingClientRect(),
				gateSymbol = operationEl.getAttribute('gate-symbol')

			//  Set as current gate and clone for dragging
			C.Circuit.Editor.currentGateSymbol = gateSymbol

			dragEl.appendChild(operationEl.cloneNode(true))
			dragEl.originEl = paletteEl
			dragEl.offsetX = bounds.left - x
			dragEl.offsetY = bounds.top - y
			dragEl.timestamp = Date.now()

			document.body.appendChild(dragEl)
			C.Circuit.Editor.dragEl = dragEl
			C.Circuit.Editor.onPointerMove(event)
		}
	},

	onPointerMove: function (event) {

		const dragEl = C.Circuit.Editor.dragEl
		if (!dragEl) return

		event.preventDefault()
		event.stopPropagation()

		const { x, y } = C.Circuit.Editor.getInteractionCoordinates(event)

		// Simple centering: 
		// Gate is 4rem x 4rem (approx 64px x 64px)
		// Center it on the mouse cursor
		// We use fixed positioning (viewport coordinates)
		dragEl.style.left = (x - 32) + 'px'
		dragEl.style.top = (y - 32) + 'px'
	},



	onPointerRelease: function (event) {

		if (C.Circuit.Editor.dragEl === null) return

		event.preventDefault()
		event.stopPropagation()

		const
			dragEl = C.Circuit.Editor.dragEl,
			{ x, y } = C.Circuit.Editor.getInteractionCoordinates(event),
			foundEls = document.elementsFromPoint(x, y),
			boardContainerEl = foundEls.find(function (el) {
				return el.classList.contains('C-circuit-board-container')
			})

		//  If we found a circuit board, place the gate
		if (boardContainerEl) {

			const
				circuitEl = boardContainerEl.closest('.C-circuit'),
				circuit = circuitEl.circuit,
				boardElBounds = boardContainerEl.getBoundingClientRect(),
				xLocal = x - boardElBounds.left + boardContainerEl.scrollLeft + 1,
				yLocal = y - boardElBounds.top + boardContainerEl.scrollTop + 1,
				columnIndex = C.Circuit.Editor.pointToGrid(xLocal),

				// Calculate fractional register index for intermediate wires
				rem = parseFloat(getComputedStyle(document.documentElement).fontSize),
				gridSize = C.Circuit.Editor.gridSize,
				gridUnit = rem * gridSize,
				// For single resolution:
				// Row 2 -> Reg 1
				// Row 3 -> Reg 2
				// Center of Row 2 is at 2.5 grid units. We want this to be Index 1.0.
				// Boundary between Row 2/3 is at 3.0 grid units. We want this to be Index 1.5.
				// So: Index = Row - 1.5
				rawGridRow = 1 + (yLocal / gridUnit),
				exactRegisterIndex = rawGridRow - 1.5

			let registerIndex = Math.round(exactRegisterIndex)

			// Check if we should snap to half-integer (intermediate wire)
			// Only if we are close to X.5
			const diff = Math.abs(exactRegisterIndex - registerIndex)
			if (diff > 0.25) { // If we are far from integer, snap to half
				registerIndex = Math.floor(exactRegisterIndex) + 0.5
			}

			const momentIndex = C.Circuit.Editor.gridColumnToMomentIndex(columnIndex)
			// const registerIndex = C.Circuit.Editor.gridRowToRegisterIndex(rowIndex) // Replaced by fractional calc above

			if (momentIndex >= 1 && momentIndex <= circuit.timewidth &&
				registerIndex >= 1 && registerIndex <= circuit.bandwidth) {

				console.log('=== DRAG AND DROP ===')
				console.log('Current gate symbol:', C.Circuit.Editor.currentGateSymbol)
				console.log('Dropping at moment:', momentIndex, 'register:', registerIndex)

				const gate = C.Gate.findBySymbol(C.Circuit.Editor.currentGateSymbol)
				console.log('Gate found:', gate)
				console.log('Gate wireSpan:', gate ? gate.wireSpan : 'undefined')

				// Check if this is a multi-wire gate
				if (gate && gate.wireSpan > 1) {
					console.log('Multi-wire gate detected!')
					const wireIndices = []
					// First wire is always the drop location (e.g. 1.5)
					wireIndices.push(registerIndex)

					// For subsequent wires, we want to skip the "component" wires if starting on a fraction
					// If start is 1.5 (between 1 and 2), next wire should be 3 (not 2.5, not 2)
					const startInteger = Math.ceil(registerIndex)

					for (let i = 1; i < gate.wireSpan; i++) {
						const wireIdx = startInteger + i
						console.log(`Calculating wire ${i}: startInteger=${startInteger} + i=${i} = ${wireIdx}`)
						if (wireIdx <= circuit.bandwidth) {
							wireIndices.push(wireIdx)
						}
					}
					console.log('Wire indices:', wireIndices, 'needed:', gate.wireSpan)
					if (wireIndices.length === gate.wireSpan) {
						console.log('Placing multi-wire gate with wires:', wireIndices)
						circuit.set$(C.Circuit.Editor.currentGateSymbol, momentIndex, ...wireIndices)
					} else {
						console.warn('Not enough wires available')
					}
				} else {
					console.log('Single-wire gate, placing at register:', registerIndex)
					circuit.set$(C.Circuit.Editor.currentGateSymbol, momentIndex, registerIndex)
				}
			}
		}
		//  Clean up drag element
		dragEl.remove()
		C.Circuit.Editor.dragEl = null
	},


	createPalette: function (targetEl) {

		if (typeof targetEl === 'string') targetEl = document.getElementById(targetEl)

		const
			paletteEl = targetEl instanceof HTMLElement ? targetEl : document.createElement('div')

		paletteEl.classList.add('C-circuit-palette')

		C.Circuit.Editor.gateList.forEach(function (symbol) {

			const gate = C.Gate.findBySymbol(symbol)
			if (!gate) return

			const operationEl = document.createElement('div')
			paletteEl.appendChild(operationEl)
			operationEl.classList.add('C-circuit-operation')
			operationEl.classList.add('C-circuit-operation-' + gate.nameCss)
			operationEl.setAttribute('gate-symbol', symbol)
			operationEl.setAttribute('title', gate.name)

			const tileEl = document.createElement('div')
			operationEl.appendChild(tileEl)
			tileEl.classList.add('C-circuit-operation-tile')

			// Use icon instead of plain text (same as in circuit)
			const icon = C.Circuit.Editor.getGateIcon(gate)
			tileEl.innerHTML = icon
		})

		// CRITICAL: Add event listeners to enable drag and drop!
		paletteEl.addEventListener('mousedown', C.Circuit.Editor.onPointerPress)
		paletteEl.addEventListener('touchstart', C.Circuit.Editor.onPointerPress)

		return paletteEl
	}
})


//  Add window event listeners for pointer move and release
window.addEventListener('mousemove', C.Circuit.Editor.onPointerMove)
window.addEventListener('touchmove', C.Circuit.Editor.onPointerMove)
window.addEventListener('mouseup', C.Circuit.Editor.onPointerRelease)
window.addEventListener('touchend', C.Circuit.Editor.onPointerRelease)




C.Circuit.Editor.prototype.onExternalSet = function (event) {

	if (event.detail.circuit === this.circuit) {

		C.Circuit.Editor.set(this.domElement, {

			gate: event.detail.circuit.get(
				event.detail.momentIndex,
				event.detail.registerIndices[0]
			).gate,
			momentIndex: event.detail.momentIndex,
			registerIndices: event.detail.registerIndices
		})

		// Redraw intermediate wires
		C.Circuit.Editor.drawIntermediateWires(this.domElement)
	}
}


C.Circuit.Editor.prototype.onExternalClear = function (event) {

	if (event.detail.circuit === this.circuit) {

		C.Circuit.Editor.clear(this.domElement, {

			momentIndex: event.detail.momentIndex,
			registerIndices: event.detail.registerIndices
		})

		// Redraw intermediate wires
		C.Circuit.Editor.drawIntermediateWires(this.domElement)
	}
}


