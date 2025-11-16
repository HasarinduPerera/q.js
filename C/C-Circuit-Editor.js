
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


	//  Add operations

	circuit.operations.forEach( function( operation ){

		C.Circuit.Editor.set( circuitEl, operation )
	})


	//  Add event listeners

	circuitEl.addEventListener( 'click', C.Circuit.Editor.onCircuitClick )
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
	gridColumnToMomentIndex: function( gridColumn  ){ return +gridColumn - 2 },
	momentIndexToGridColumn: function( momentIndex ){ return momentIndex + 2 },
	gridRowToRegisterIndex:  function( gridRow ){ return +gridRow - 1 },
	registerIndexToGridRow:  function( registerIndex ){ return registerIndex + 1 },
	gridSize: 4,


	set: function( circuitEl, operation ){

		const
		circuit = circuitEl.circuit,
		foregroundEl = circuitEl.querySelector( '.C-circuit-board-foreground' ),
		momentIndex = operation.momentIndex,
		registerIndex = operation.registerIndices[ 0 ]

		//  Check if operation already exists
		const existingEl = foregroundEl.querySelector(
			`[moment-index="${momentIndex}"][register-index="${registerIndex}"]`
		)
		if( existingEl && existingEl.classList.contains( 'C-circuit-operation' )){
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
			`[moment-index="${operation.momentIndex}"][register-index="${operation.registerIndices[0]}"]`
		)
		if( operationEl ){
			operationEl.remove()
		}
	},


	onCircuitClick: function( event ){

		const
		circuitEl = event.currentTarget,
		circuit = circuitEl.circuit

		//  Handle toolbar buttons
		if( event.target.classList.contains( 'C-circuit-button-undo' )){
			circuit.history.undo$()
		}
		else if( event.target.classList.contains( 'C-circuit-button-redo' )){
			circuit.history.redo$()
		}
		else if( event.target.classList.contains( 'C-circuit-button-evaluate' )){
			circuit.evaluate$()
			const resultsEl = circuitEl.querySelector( '.C-circuit-results' )
			resultsEl.innerText = circuit.report$()
		}
		else if( event.target.classList.contains( 'C-circuit-toggle-lock' )){
			if( circuitEl.hasAttribute( 'locked' )){
				circuitEl.removeAttribute( 'locked' )
				event.target.innerText = '🔓'
			} else {
				circuitEl.setAttribute( 'locked', 'locked' )
				event.target.innerText = '🔒'
			}
		}
	},


	createPalette: function( targetEl ){

		if( typeof targetEl === 'string' ) targetEl = document.getElementById( targetEl )

		const
		paletteEl = targetEl instanceof HTMLElement ? targetEl : document.createElement( 'div' )

		paletteEl.classList.add( 'C-circuit-palette' )

		'NOT AND OR NAND NOR XOR XNOR BUF'
		.split( ' ' )
		.forEach( function( symbol ){

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


