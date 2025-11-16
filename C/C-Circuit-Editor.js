
//  Copyright © 2025, Classical Circuit Simulator (C.js)
//  Based on Q.js by Stewart Smith




C.Circuit.Editor = function( circuit, targetEl ){


	//  First order of business,
	//  we require a valid circuit.

	if( circuit instanceof C.Circuit !== true ) circuit = new C.Circuit()
	this.circuit = circuit
	this.index = C.Circuit.Editor.index ++


	//  C.Circuit.Editor is all about the DOM
	//  so we're going to get some use out of this
	//  stupid (but convenient) shorthand here.

	const createDiv = function(){

		return document.createElement( 'div' )
	}




	//  We want to "name" our circuit editor instance
	//  but more importantly we want to give it a unique DOM ID.

	this.name = typeof circuit.name === 'string' ?
		circuit.name :
		'C Editor '+ this.index


	//  If we've been passed a target DOM element
	//  we should use that as our circuit element.

	if( typeof targetEl === 'string' ) targetEl = document.getElementById( targetEl )
	const circuitEl = targetEl instanceof HTMLElement ? targetEl : createDiv()
	circuitEl.classList.add( 'C-circuit' )


	//  If the target element already has an ID
	//  then we want to use that as our domID.

	if( typeof circuitEl.getAttribute( 'id' ) === 'string' ){

		this.domId = circuitEl.getAttribute( 'id' )
	}


	//  Otherwise let's transform our name value
	//  into a usable domId.

	else {

		let domIdBase = this.name
			.replace( /^[^a-z]+|[^\w:.-]+/gi, '-' ),
		domId = domIdBase,
		domIdAttempt = 1

		while( document.getElementById( domId ) !== null ){

			domIdAttempt ++
			domId = domIdBase +'-'+ domIdAttempt
		}
		this.domId = domId
		circuitEl.setAttribute( 'id', this.domId )
	}




	//  We want a way to easily get to the circuit
	//  from this interface's DOM element.

	circuitEl.circuit = circuit
	this.domElement = circuitEl


	//  Create a toolbar for containing buttons.

	const toolbarEl = createDiv()
	circuitEl.appendChild( toolbarEl )
	toolbarEl.classList.add( 'C-circuit-toolbar' )


	//  Create a toggle switch for locking the circuit.

	const lockToggle = createDiv()
	toolbarEl.appendChild( lockToggle )
	lockToggle.classList.add( 'C-circuit-button', 'C-circuit-toggle', 'C-circuit-toggle-lock' )
	lockToggle.setAttribute( 'title', 'Lock / unlock' )
	lockToggle.innerText = '🔓'


	//  Create an "Undo" button

	const undoButton = createDiv()
	toolbarEl.appendChild( undoButton )
	undoButton.classList.add( 'C-circuit-button', 'C-circuit-button-undo' )
	undoButton.setAttribute( 'title', 'Undo' )
	undoButton.setAttribute( 'C-disabled', 'C-disabled' )
	undoButton.innerHTML = '⟲'
	window.addEventListener( 'C.History undo is depleted', function( event ){

		if( event.detail.instance === circuit )
			undoButton.setAttribute( 'C-disabled', 'C-disabled' )
	})
	window.addEventListener( 'C.History undo is capable', function( event ){

		if( event.detail.instance === circuit )
			undoButton.removeAttribute( 'C-disabled' )
	})


	//  Create an "Redo" button

	const redoButton = createDiv()
	toolbarEl.appendChild( redoButton )
	redoButton.classList.add( 'C-circuit-button', 'C-circuit-button-redo' )
	redoButton.setAttribute( 'title', 'Redo' )
	redoButton.setAttribute( 'C-disabled', 'C-disabled' )
	redoButton.innerHTML = '⟳'
	window.addEventListener( 'C.History redo is depleted', function( event ){

		if( event.detail.instance === circuit )
			redoButton.setAttribute( 'C-disabled', 'C-disabled' )
	})
	window.addEventListener( 'C.History redo is capable', function( event ){

		if( event.detail.instance === circuit )
			redoButton.removeAttribute( 'C-disabled' )
	})


	//  Create an "Evaluate" button

	const evaluateButton = createDiv()
	toolbarEl.appendChild( evaluateButton )
	evaluateButton.classList.add( 'C-circuit-button', 'C-circuit-button-evaluate' )
	evaluateButton.setAttribute( 'title', 'Evaluate circuit' )
	evaluateButton.innerText = 'RUN'


	//  Create a circuit board container

	const boardContainerEl = createDiv()
	circuitEl.appendChild( boardContainerEl )
	boardContainerEl.classList.add( 'C-circuit-board-container' )
	boardContainerEl.addEventListener( 'mousemove', C.Circuit.Editor.onPointerMove )
	boardContainerEl.addEventListener( 'mouseleave', function(){
		C.Circuit.Editor.unhighlightAll( circuitEl )
	})

	const boardEl = createDiv()
	boardContainerEl.appendChild( boardEl )
	boardEl.classList.add( 'C-circuit-board' )

	const backgroundEl = createDiv()
	boardEl.appendChild( backgroundEl )
	backgroundEl.classList.add( 'C-circuit-board-background' )


	//  Create background wires for each bit

	for( let i = 0; i < circuit.bandwidth; i ++ ){

		const rowEl = createDiv()
		backgroundEl.appendChild( rowEl )
		rowEl.style.position = 'relative'
		rowEl.style.gridRowStart = i + 2
		rowEl.style.gridColumnStart = 1
		rowEl.style.gridColumnEnd = C.Circuit.Editor.momentIndexToGridColumn( circuit.timewidth ) + 1
		rowEl.setAttribute( 'register-index', i + 1 )

		const wireEl = createDiv()
		rowEl.appendChild( wireEl )
		wireEl.classList.add( 'C-circuit-register-wire' )
	}


	//  Create background highlight bars for each column

	for( let i = 0; i < circuit.timewidth; i ++ ){

		const columnEl = createDiv()
		backgroundEl.appendChild( columnEl )
		columnEl.style.gridRowStart = 2
		columnEl.style.gridRowEnd = C.Circuit.Editor.registerIndexToGridRow( circuit.bandwidth ) + 1
		columnEl.style.gridColumnStart = i + 3
		columnEl.setAttribute( 'moment-index', i + 1 )
	}


	//  Create the circuit board foreground

	const foregroundEl = createDiv()
	boardEl.appendChild( foregroundEl )
	foregroundEl.classList.add( 'C-circuit-board-foreground' )


	//  Add register index symbols to left-hand column

	for( let i = 0; i < circuit.bandwidth; i ++ ){

		const
		registerIndex = i + 1,
		registersymbolEl = createDiv()

		foregroundEl.appendChild( registersymbolEl )
		registersymbolEl.classList.add( 'C-circuit-header', 'C-circuit-register-label' )
		registersymbolEl.setAttribute( 'title', 'Bit '+ registerIndex +' of '+ circuit.bandwidth )
		registersymbolEl.setAttribute( 'register-index', registerIndex )
		registersymbolEl.style.gridRowStart = C.Circuit.Editor.registerIndexToGridRow( registerIndex )
		registersymbolEl.innerText = 'B' + registerIndex
	}


	//  Add moment index symbols to top row

	for( let i = 0; i < circuit.timewidth; i ++ ){

		const
		momentIndex = i + 1,
		momentsymbolEl = createDiv()

		foregroundEl.appendChild( momentsymbolEl )
		momentsymbolEl.classList.add( 'C-circuit-header', 'C-circuit-moment-label' )
		momentsymbolEl.setAttribute( 'title', 'Moment '+ momentIndex +' of '+ circuit.timewidth )
		momentsymbolEl.setAttribute( 'moment-index', momentIndex )
		momentsymbolEl.style.gridColumnStart = C.Circuit.Editor.momentIndexToGridColumn( momentIndex )
		momentsymbolEl.innerText = momentIndex
	}


	//  Add input values

	circuit.bits.forEach( function( bit, i ){

		const
		rowIndex = i + 1,
		inputEl = createDiv()

		inputEl.classList.add( 'C-circuit-header', 'C-circuit-input' )
		inputEl.setAttribute( 'title', `Bit #${ rowIndex } starting value` )
		inputEl.setAttribute( 'register-index', rowIndex )
		inputEl.style.gridRowStart = C.Circuit.Editor.registerIndexToGridRow( rowIndex )
		inputEl.innerText = bit.value
		foregroundEl.appendChild( inputEl )
	})


	//  Add placeholder cells for each grid position

	for( let m = 0; m < circuit.timewidth; m ++ ){
		for( let r = 0; r < circuit.bandwidth; r ++ ){

			const
			momentIndex = m + 1,
			registerIndex = r + 1,
			cellEl = createDiv()

			cellEl.classList.add( 'C-circuit-cell' )
			cellEl.setAttribute( 'moment-index', momentIndex )
			cellEl.setAttribute( 'register-index', registerIndex )
			cellEl.style.gridRowStart = C.Circuit.Editor.registerIndexToGridRow( registerIndex )
			cellEl.style.gridColumnStart = C.Circuit.Editor.momentIndexToGridColumn( momentIndex )
			foregroundEl.appendChild( cellEl )
		}
	}


	//  Add operations

	circuit.operations.forEach( function( operation ){

		C.Circuit.Editor.set( circuitEl, operation )
	})


	//  Add event listeners

	circuitEl.addEventListener( 'mousedown', C.Circuit.Editor.onPointerPress )
	circuitEl.addEventListener( 'touchstart', C.Circuit.Editor.onPointerPress )
	window.addEventListener(

		'C.Circuit.set$',
		 C.Circuit.Editor.prototype.onExternalSet.bind( this )
	)
	window.addEventListener(

		'C.Circuit.clear$',
		C.Circuit.Editor.prototype.onExternalClear.bind( this )
	)


	//  Create results display area

	const resultsEl = createDiv()
	circuitEl.appendChild( resultsEl )
	resultsEl.classList.add( 'C-circuit-results' )


	//  Add reference text

	const referenceEl = document.createElement( 'p' )
	circuitEl.appendChild( referenceEl )
	referenceEl.innerHTML = `
		This circuit is accessible in your JavaScript console
		as <code>document.getElementById('${ this.domId }').circuit</code>`


	//  Log to console

	C.log( 0.5,

		`\n\nCreated a DOM interface for circuit #${ this.index }\n\n`,
		 circuit.toDiagram(),
		'\n\n\n'
	)
}


//  Augment C.Circuit to have this functionality.

C.Circuit.toDom = function( circuit, targetEl ){

	return new C.Circuit.Editor( circuit, targetEl ).domElement
}
C.Circuit.prototype.toDom = function( targetEl ){

	return new C.Circuit.Editor( this, targetEl ).domElement
}




Object.assign( C.Circuit.Editor, {

	index: 0,
	help: function(){ return C.help( this )},
	dragEl: null,
	currentGateSymbol: 'NOT',  // Default gate for placement
	gateList: [ 'NOT', 'AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUF' ],
	gridColumnToMomentIndex: function( gridColumn  ){ return +gridColumn - 2 },
	momentIndexToGridColumn: function( momentIndex ){ return momentIndex + 2 },
	gridRowToRegisterIndex:  function( gridRow ){ return +gridRow - 1 },
	registerIndexToGridRow:  function( registerIndex ){ return registerIndex + 1 },
	gridSize: 4,
	pointToGrid: function( p ){

		const rem = parseFloat( getComputedStyle( document.documentElement ).fontSize )
		return 1 + Math.floor( p / ( rem * C.Circuit.Editor.gridSize ))
	},
	gridToPoint: function( g ){

		const  rem = parseFloat( getComputedStyle( document.documentElement ).fontSize )
		return rem * C.Circuit.Editor.gridSize * ( g - 1 )
	},
	getInteractionCoordinates: function( event, pageOrClient ){

		if( typeof pageOrClient !== 'string' ) pageOrClient = 'client'
		if( event.changedTouches &&
			event.changedTouches.length ) return {

			x: event.changedTouches[ 0 ][ pageOrClient +'X' ],
			y: event.changedTouches[ 0 ][ pageOrClient +'Y' ]
		}
		return {

			x: event[ pageOrClient +'X' ],
			y: event[ pageOrClient +'Y' ]
		}
	},


	set: function( circuitEl, operation ){

		const
		circuit = circuitEl.circuit,
		foregroundEl = circuitEl.querySelector( '.C-circuit-board-foreground' ),
		momentIndex = operation.momentIndex,
		registerIndex = operation.registerIndices[ 0 ]

		//  Check if operation already exists
		const existingEl = foregroundEl.querySelector(
			`.C-circuit-operation[moment-index="${momentIndex}"][register-index="${registerIndex}"]`
		)
		if( existingEl ){
			existingEl.remove()
		}

		//  Create operation element
		const operationEl = document.createElement( 'div' )
		foregroundEl.appendChild( operationEl )
		operationEl.classList.add( 'C-circuit-operation' )
		operationEl.classList.add( 'C-gate--' + operation.gate.nameCss )
		operationEl.setAttribute( 'gate-symbol', operation.gate.symbol )
		operationEl.setAttribute( 'moment-index', momentIndex )
		operationEl.setAttribute( 'register-index', registerIndex )
		operationEl.style.gridRowStart = C.Circuit.Editor.registerIndexToGridRow( registerIndex )
		operationEl.style.gridColumnStart = C.Circuit.Editor.momentIndexToGridColumn( momentIndex )
		operationEl.innerText = operation.gate.symbol

		return operationEl
	},


	clear: function( circuitEl, operation ){

		const foregroundEl = circuitEl.querySelector( '.C-circuit-board-foreground' )
		const operationEl = foregroundEl.querySelector(
			`.C-circuit-operation[moment-index="${operation.momentIndex}"][register-index="${operation.registerIndices[0]}"]`
		)
		if( operationEl ){
			operationEl.remove()
		}
	},


	unhighlightAll: function( circuitEl ){

		Array.from( circuitEl.querySelectorAll(

			'.C-circuit-board-background > div,'+
			'.C-circuit-board-foreground > div'
		))
		.forEach( function( el ){

			el.classList.remove( 'C-circuit-cell-highlighted' )
		})
	},


	onPointerMove: function( event ){

		const
		{ x, y } = C.Circuit.Editor.getInteractionCoordinates( event ),
		foundEls = document.elementsFromPoint( x, y ),
		boardContainerEl = foundEls.find( function( el ){

			return el.classList.contains( 'C-circuit-board-container' )
		})

		//  Are we dragging something?
		if( C.Circuit.Editor.dragEl !== null ){

			event.preventDefault()

			C.Circuit.Editor.dragEl.style.left = ( x + window.pageXOffset + C.Circuit.Editor.dragEl.offsetX ) +'px'
			C.Circuit.Editor.dragEl.style.top  = ( y + window.pageYOffset + C.Circuit.Editor.dragEl.offsetY ) +'px'

			if( !boardContainerEl && C.Circuit.Editor.dragEl.circuitEl ){
				C.Circuit.Editor.dragEl.classList.add( 'C-circuit-clipboard-danger' )
			}
			else {
				C.Circuit.Editor.dragEl.classList.remove( 'C-circuit-clipboard-danger' )
			}
		}

		if( !boardContainerEl ) return

		const circuitEl = boardContainerEl.closest( '.C-circuit' )
		if( circuitEl.classList.contains( 'C-circuit-locked' )) return

		//  Unhighlight everything first
		Array.from( boardContainerEl.querySelectorAll(`

			.C-circuit-board-background > div,
			.C-circuit-board-foreground > div

		`)).forEach( function( el ){

			el.classList.remove( 'C-circuit-cell-highlighted' )
		})

		//  Calculate which cell we're over
		const
		boardElBounds = boardContainerEl.getBoundingClientRect(),
		xLocal        = x - boardElBounds.left + boardContainerEl.scrollLeft + 1,
		yLocal        = y - boardElBounds.top  + boardContainerEl.scrollTop + 1,
		columnIndex   = C.Circuit.Editor.pointToGrid( xLocal ),
		rowIndex      = C.Circuit.Editor.pointToGrid( yLocal ),
		momentIndex   = C.Circuit.Editor.gridColumnToMomentIndex( columnIndex ),
		registerIndex = C.Circuit.Editor.gridRowToRegisterIndex( rowIndex )

		if( momentIndex > circuitEl.circuit.timewidth ||
			registerIndex > circuitEl.circuit.bandwidth ) return

		if( momentIndex < 1 || registerIndex < 1 ) return

		//  Highlight the current cell
		Array.from( boardContainerEl.querySelectorAll(`

			div[moment-index="${ momentIndex }"],
			div[register-index="${ registerIndex }"]
		`))
		.forEach( function( el ){

			el.classList.add( 'C-circuit-cell-highlighted' )
		})
	},


	onPointerPress: function( event ){

		//  Safety check
		if( C.Circuit.Editor.dragEl !== null ){
			C.Circuit.Editor.onPointerRelease( event )
			return
		}

		const
		targetEl  = event.target,
		circuitEl = targetEl.closest( '.C-circuit' ),
		paletteEl = targetEl.closest( '.C-circuit-palette' )

		if( !circuitEl && !paletteEl ) return

		const dragEl = document.createElement( 'div' )
		dragEl.classList.add( 'C-circuit-clipboard' )
		const { x, y } = C.Circuit.Editor.getInteractionCoordinates( event )

		//  Handle circuit interactions
		if( circuitEl ){

			const
			circuit = circuitEl.circuit,
			circuitIsLocked = circuitEl.classList.contains( 'C-circuit-locked' ),
			lockEl = targetEl.closest( '.C-circuit-toggle-lock' )

			//  Toggle lock
			if( lockEl ){
				if( circuitIsLocked ){
					circuitEl.classList.remove( 'C-circuit-locked' )
					lockEl.innerText = '🔓'
				}
				else {
					circuitEl.classList.add( 'C-circuit-locked' )
					lockEl.innerText = '🔒'
					C.Circuit.Editor.unhighlightAll( circuitEl )
				}
				event.preventDefault()
				event.stopPropagation()
				return
			}

			if( circuitIsLocked ) return

			const
			undoEl = targetEl.closest( '.C-circuit-button-undo' ),
			redoEl = targetEl.closest( '.C-circuit-button-redo' ),
			evaluateEl = targetEl.closest( '.C-circuit-button-evaluate' ),
			cellEl = targetEl.closest( '.C-circuit-cell' ),
			operationEl = targetEl.closest( '.C-circuit-operation' )

			event.preventDefault()
			event.stopPropagation()

			//  Handle toolbar buttons
			if( undoEl ){
				circuit.history.undo$()
				return
			}
			if( redoEl ){
				circuit.history.redo$()
				return
			}
			if( evaluateEl ){
				circuit.evaluate$()
				const resultsEl = circuitEl.querySelector( '.C-circuit-results' )
				resultsEl.innerText = circuit.report$()
				return
			}

			//  Handle clicking on existing operation - cycle through gates
			if( operationEl ){

				const
				momentIndex = +operationEl.getAttribute( 'moment-index' ),
				registerIndex = +operationEl.getAttribute( 'register-index' ),
				currentSymbol = operationEl.getAttribute( 'gate-symbol' ),
				currentIndex = C.Circuit.Editor.gateList.indexOf( currentSymbol ),
				nextIndex = ( currentIndex + 1 ) % C.Circuit.Editor.gateList.length,
				nextSymbol = C.Circuit.Editor.gateList[ nextIndex ]

				circuit.clear$( momentIndex, registerIndex )
				circuit.set$( nextSymbol, momentIndex, registerIndex )

				return
			}

			//  Handle clicking on empty cell - place gate
			if( cellEl ){

				const
				momentIndex = +cellEl.getAttribute( 'moment-index' ),
				registerIndex = +cellEl.getAttribute( 'register-index' )

				circuit.set$( C.Circuit.Editor.currentGateSymbol, momentIndex, registerIndex )

				return
			}
		}

		//  Handle palette interactions - drag gate from palette
		else if( paletteEl ){

			const operationEl = targetEl.closest( '.C-circuit-operation' )

			if( !operationEl ) return

			const
			bounds   = operationEl.getBoundingClientRect(),
			gateSymbol = operationEl.getAttribute( 'gate-symbol' )

			//  Set as current gate and clone for dragging
			C.Circuit.Editor.currentGateSymbol = gateSymbol

			dragEl.appendChild( operationEl.cloneNode( true ))
			dragEl.originEl = paletteEl
			dragEl.offsetX  = bounds.left - x
			dragEl.offsetY  = bounds.top  - y
			dragEl.timestamp = Date.now()

			document.body.appendChild( dragEl )
			C.Circuit.Editor.dragEl = dragEl
			C.Circuit.Editor.onPointerMove( event )
		}
	},


	onPointerRelease: function( event ){

		if( C.Circuit.Editor.dragEl === null ) return

		event.preventDefault()
		event.stopPropagation()

		const
		dragEl = C.Circuit.Editor.dragEl,
		{ x, y } = C.Circuit.Editor.getInteractionCoordinates( event ),
		foundEls = document.elementsFromPoint( x, y ),
		boardContainerEl = foundEls.find( function( el ){
			return el.classList.contains( 'C-circuit-board-container' )
		})

		//  If we found a circuit board, place the gate
		if( boardContainerEl ){

			const
			circuitEl = boardContainerEl.closest( '.C-circuit' ),
			circuit = circuitEl.circuit,
			boardElBounds = boardContainerEl.getBoundingClientRect(),
			xLocal = x - boardElBounds.left + boardContainerEl.scrollLeft + 1,
			yLocal = y - boardElBounds.top  + boardContainerEl.scrollTop + 1,
			columnIndex = C.Circuit.Editor.pointToGrid( xLocal ),
			rowIndex = C.Circuit.Editor.pointToGrid( yLocal ),
			momentIndex = C.Circuit.Editor.gridColumnToMomentIndex( columnIndex ),
			registerIndex = C.Circuit.Editor.gridRowToRegisterIndex( rowIndex )

			if( momentIndex >= 1 && momentIndex <= circuit.timewidth &&
				registerIndex >= 1 && registerIndex <= circuit.bandwidth ){

				circuit.set$( C.Circuit.Editor.currentGateSymbol, momentIndex, registerIndex )
			}
		}

		//  Clean up drag element
		dragEl.remove()
		C.Circuit.Editor.dragEl = null
	},


	createPalette: function( targetEl ){

		if( typeof targetEl === 'string' ) targetEl = document.getElementById( targetEl )

		const
		paletteEl = targetEl instanceof HTMLElement ? targetEl : document.createElement( 'div' )

		paletteEl.classList.add( 'C-circuit-palette' )

		C.Circuit.Editor.gateList.forEach( function( symbol ){

			const gate = C.Gate.findBySymbol( symbol )
			if( !gate ) return

			const operationEl = document.createElement( 'div' )
			paletteEl.appendChild( operationEl )
			operationEl.classList.add( 'C-circuit-operation' )
			operationEl.classList.add( 'C-gate--'+ gate.nameCss )
			operationEl.setAttribute( 'gate-symbol', symbol )
			operationEl.setAttribute( 'title', gate.name )

			const tileEl = document.createElement( 'div' )
			operationEl.appendChild( tileEl )
			tileEl.classList.add( 'C-circuit-operation-tile' )
			tileEl.innerText = symbol
		})

		return paletteEl
	}
})


//  Add window event listeners for pointer move and release
window.addEventListener( 'mousemove', C.Circuit.Editor.onPointerMove )
window.addEventListener( 'touchmove', C.Circuit.Editor.onPointerMove )
window.addEventListener( 'mouseup', C.Circuit.Editor.onPointerRelease )
window.addEventListener( 'touchend', C.Circuit.Editor.onPointerRelease )




C.Circuit.Editor.prototype.onExternalSet = function( event ){

	if( event.detail.circuit === this.circuit ){

		C.Circuit.Editor.set( this.domElement, {

			gate: event.detail.circuit.get(
				event.detail.momentIndex,
				event.detail.registerIndices[ 0 ]
			).gate,
			momentIndex: event.detail.momentIndex,
			registerIndices: event.detail.registerIndices
		})
	}
}


C.Circuit.Editor.prototype.onExternalClear = function( event ){

	if( event.detail.circuit === this.circuit ){

		C.Circuit.Editor.clear( this.domElement, {

			momentIndex: event.detail.momentIndex,
			registerIndices: event.detail.registerIndices
		})
	}
}


