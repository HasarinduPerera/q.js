
//  Copyright © 2025, Classical Circuit Simulator (C.js)
//  Based on Q.js by Stewart Smith




C.Circuit = function (bandwidth, timewidth) {


	//  What number Circuit is this
	//  that we're attempting to make here?

	this.index = C.Circuit.index++


	//  How many bits (wires) shall we use?

	if (!C.isUsefulInteger(bandwidth)) bandwidth = 3
	this.bandwidth = bandwidth


	//  How many operations can we perform on each bit?
	//  Each operation counts as one moment; one clock tick.

	if (!C.isUsefulInteger(timewidth)) timewidth = 5
	this.timewidth = timewidth


	//  We'll start with ZERO bits as inputs
	//  but we can of course modify this after initialization.

	this.bits = new Array(bandwidth).fill(C.Bit.ZERO)


	//  What operations will we perform on our bits?

	this.operations = []


	//  Does our circuit need evaluation?
	//  Certainly, yes!
	// (And will again each time it is modified.)

	this.needsEvaluation = true


	//  When our circuit is evaluated
	//  we store those results in this array.

	this.results = []


	//  Undo / Redo history.

	this.history = new C.History(this)
}




Object.assign(C.Circuit, {

	index: 0,
	help: function () { return C.help(this) },
	constants: {},
	createConstant: C.createConstant,
	createConstants: C.createConstants,


	fromText: function (text) {


		//  This is a quick way to enable `fromText()`
		//  to return a default new C.Circuit().

		if (text === undefined) return new C.Circuit()


		//  Is this a String Template -- as opposed to a regular String?
		//  If so, let's convert it to a regular String.
		//  Yes, this maintains the line breaks.

		if (text.raw !== undefined) text = '' + text.raw
		return C.Circuit.fromTableTransposed(

			text
				.trim()
				.split(/\r?\n/)
				.filter(function (item) { return item.length })
				.map(function (item, r) {

					return item
						.trim()
						.split(/[-+\s+=+]/)
						.filter(function (item) { return item.length })
						.map(function (item, m) {

							const matches = item.match(/(^\w+)(\.(\w+))*(#(\d+))*/)
							return {

								gateSymbol: matches[1],
								operationMomentId: matches[3],
								mappingIndex: +matches[5]
							}
						})
				})
		)
	},




	fromTableTransposed: function (table) {

		const
			bandwidth = table.length,
			timewidth = table.reduce(function (max, moments) {

				return Math.max(max, moments.length)

			}, 0),
			circuit = new C.Circuit(bandwidth, timewidth)

		circuit.bandwidth = bandwidth
		circuit.timewidth = timewidth
		for (let r = 0; r < bandwidth; r++) {

			const registerIndex = r + 1
			for (let m = 0; m < timewidth; m++) {

				const
					momentIndex = m + 1,
					operation = table[r][m]

				if (operation.gateSymbol !== 'I') {

					const
						gate = C.Gate.findBySymbol(operation.gateSymbol),
						registerIndices = []

					if (C.isUsefulInteger(operation.mappingIndex)) {

						registerIndices[operation.mappingIndex] = registerIndex
					}
					else registerIndices[0] = registerIndex
					circuit.operations.push({

						gate,
						momentIndex,
						registerIndices,
						operationMomentId: operation.operationMomentId
					})
				}
			}
		}
		circuit.sort$()
		return circuit
	},




	evaluate: function (circuit) {


		window.dispatchEvent(new CustomEvent(

			'C.Circuit.evaluate began', {

			detail: { circuit }
		}
		))


		//  Our circuit's operations must be in the correct order
		//  before we attempt to step through them!

		circuit.sort$()


		//  Create initial state array with input bit values
		//  Also create intermediate wire storage (e.g., wire 1.5, 2.5, etc.)

		const state = {}

		// Initialize main wires
		circuit.bits.forEach(function (bit, index) {
			state[index + 1] = bit.value
		})


		//  Evaluate each moment in the circuit

		const operationsTotal = circuit.operations.length
		let operationsCompleted = 0

		circuit.operations.forEach(function (operation, i) {

			const gate = operation.gate

			// Handle both old and new operation formats
			let inputWires, outputWire

			if (operation.inputWires && operation.outputWire) {
				// New multi-wire format
				inputWires = operation.inputWires
				outputWire = operation.outputWire
			} else {
				// Old format - fallback to registerIndices
				inputWires = operation.registerIndices.slice(0, gate.inputCount)
				outputWire = operation.registerIndices[operation.registerIndices.length - 1]
			}

			//  Get input values for this gate from specified wires
			const inputs = inputWires.map(function (wireIndex) {
				const value = state[wireIndex] !== undefined ? state[wireIndex] : 0
				return new C.Bit(value)
			}).filter(function (bit) {
				return bit !== undefined && bit !== null
			})

			// Skip if we don't have enough inputs
			if (inputs.length < gate.inputCount) {
				console.warn('Gate', gate.symbol, 'needs', gate.inputCount, 'inputs but only has', inputs.length)
				return
			}

			//  Apply gate operation
			const output = gate.applyToInputs(...inputs)

			//  Update the state at the output wire position
			//  (This may be an intermediate wire like 1.5)
			state[outputWire] = output.value

			// Capture state for this moment
			if (!circuit.trace) circuit.trace = []
			// Ensure trace has entries up to this moment
			for (let m = 0; m <= operation.momentIndex; m++) {
				if (!circuit.trace[m]) {
					circuit.trace[m] = Object.assign({}, state)
				}
			}
			// Update current moment trace
			circuit.trace[operation.momentIndex] = Object.assign({}, state)


			operationsCompleted++
			const progress = operationsCompleted / operationsTotal

			window.dispatchEvent(new CustomEvent('C.Circuit.evaluate progressed', {
				detail: {

					circuit,
					progress,
					operationsCompleted,
					operationsTotal,
					momentIndex: operation.momentIndex,
					inputWires: inputWires,
					outputWire: outputWire,
					gate: operation.gate.name,
					state: Object.assign({}, state)

				}
			}))

		})


		//  Store results for main wires only (not intermediate wires)

		circuit.results = circuit.bits.map(function (bit, index) {
			const wireIndex = index + 1
			return new C.Bit(state[wireIndex] !== undefined ? state[wireIndex] : 0)
		})

		// Also store intermediate wire values for visualization
		circuit.intermediateWires = state

		// Ensure trace is fully populated
		if (!circuit.trace) circuit.trace = []
		if (!circuit.trace[0]) {
			const initialState = {}
			circuit.bits.forEach((bit, i) => initialState[i + 1] = bit.value)
			circuit.trace[0] = initialState
		}
		for (let i = 1; i <= circuit.timewidth; i++) {
			if (!circuit.trace[i]) {
				circuit.trace[i] = Object.assign({}, circuit.trace[i - 1])
			}
		}


		circuit.needsEvaluation = false


		window.dispatchEvent(new CustomEvent('C.Circuit.evaluate completed', {
			detail: {

				circuit,
				results: circuit.results,
				intermediateWires: circuit.intermediateWires,
				trace: circuit.trace

			}
		}))


		return circuit.results
	}
})




Object.assign(C.Circuit.prototype, {

	clone: function () {

		const
			original = this,
			clone = new C.Circuit(original.bandwidth, original.timewidth)

		clone.bits = original.bits.slice()
		clone.results = original.results.slice()
		clone.operations = original.operations.slice()
		clone.needsEvaluation = original.needsEvaluation

		return clone
	},
	evaluate$: function () {

		C.Circuit.evaluate(this)
		return this
	},
	report$: function () {

		if (this.needsEvaluation) this.evaluate$()

		const
			circuit = this

		let text = this.results.reduce(function (text, bit, i) {

			return text + '\n'
				+ 'Bit ' + (i + 1) + ': '
				+ bit.value
				+ ' (' + (bit.value === 1 ? 'HIGH' : 'LOW') + ')'

		}, '')

		// Add intermediate wires to report
		if (this.intermediateWires) {
			Object.keys(this.intermediateWires).sort().forEach(function (key) {
				const wireIndex = parseFloat(key)
				// Only show fractional wires (intermediate ones)
				if (wireIndex % 1 !== 0) {
					const value = circuit.intermediateWires[key]
					text += '\n' + 'Wire ' + wireIndex + ': ' + value + ' (' + (value === 1 ? 'HIGH' : 'LOW') + ')'
				}
			})
		}

		return text + '\n'
	},




	////////////////
	//            //
	//   Output   //
	//            //
	////////////////


	//  This is absolutely required by toTable.

	sort$: function () {


		//  Sort this circuit's operations
		//  primarily by momentIndex,
		//  then by the first registerIndex.

		this.operations.sort(function (a, b) {

			if (a.momentIndex === b.momentIndex) {

				return Math.min(...a.registerIndices) - Math.min(...b.registerIndices)
			}
			else {

				return a.momentIndex - b.momentIndex
			}
		})
		return this
	},





	///////////////////
	//               //
	//   Exporters   //
	//               //
	///////////////////


	toTable: function () {

		const
			table = new Array(this.timewidth),
			circuit = this

		table.timewidth = this.timewidth
		table.bandwidth = this.bandwidth


		//  First, let's establish a "blank" table
		//  that contains an identity operation
		//  for each register during each moment.

		table.fill(0).forEach(function (element, index, array) {

			const operations = new Array(circuit.bandwidth)
			operations.fill(0).forEach(function (element, index, array) {

				array[index] = {

					symbol: 'I',
					symbolDisplay: 'I',
					name: 'Identity',
					nameCss: 'identity',
					gateInputIndex: 0
				}
			})
			array[index] = operations
		})


		//  Now let's populate that table
		//  with this circuit's non-identity operations.

		this.operations.forEach(function (operation) {

			const
				m = operation.momentIndex - 1,
				r = operation.registerIndices[0] - 1

			table[m][r] = {

				symbol: operation.gate.symbol,
				symbolDisplay: operation.gate.symbol,
				name: operation.gate.name,
				nameCss: operation.gate.nameCss,
				gateInputIndex: 0
			}
		})

		return table
	},
	toText: function () {

		const
			circuit = this,
			table = this.toTable()

		return table.reduce(function (text, moment, m) {

			const line = moment.reduce(function (line, operation, r) {

				return line + operation.symbol.padEnd(6, ' ')

			}, '')
			return text + '\n' + line

		}, '')
	},
	toDiagram: function () {

		const
			circuit = this,
			table = this.toTable()

		let output = '\n'

		for (let r = 0; r < this.bandwidth; r++) {

			output += 'Bit ' + (r + 1) + ' ──'

			for (let m = 0; m < this.timewidth; m++) {

				const operation = table[m][r]
				output += '─' + operation.symbol.padEnd(4, '─') + '─'
			}

			output += '\n'
		}

		return output
	},




	/////////////////
	//             //
	//   Setters   //
	//             //
	/////////////////


	set$: function (gateSymbol, momentIndex, ...registerIndices) {

		const
			circuit = this,
			gate = typeof gateSymbol === 'string' ? C.Gate.findBySymbol(gateSymbol) : gateSymbol

		if (gate === undefined) {

			return C.error(`C.Circuit could not find a gate with the symbol "${gateSymbol}" to set on circuit #${this.index}.`)
		}

		//  Do we already have a record of an operation
		//  at this moment and register?

		const operationIndex = this.operations.findIndex(function (operation) {

			return (

				operation.momentIndex === momentIndex &&
				operation.registerIndices[0] === registerIndices[0]
			)
		})

		if (operationIndex >= 0) {


			//  If so, we need to clear it first
			//  and record this in our history.

			const priorOperation = this.operations[operationIndex]

			this.operations.splice(operationIndex, 1)
			this.history.createEntry$()
			this.history.record$({

				redo: {

					name: 'set$',
					func: circuit.set$,
					args: [gate.symbol, momentIndex].concat(registerIndices)
				},
				undo: [{

					name: 'clear$',
					func: circuit.clear$,
					args: [momentIndex].concat(registerIndices)
				}, {

					name: 'set$',
					func: circuit.set$,
					args: [priorOperation.gate.symbol, momentIndex].concat(priorOperation.registerIndices)
				}]
			})
		}
		else {


			//  Otherwise we're free to just add it.

			this.history.createEntry$()
			this.history.record$({

				redo: {

					name: 'set$',
					func: circuit.set$,
					args: [gate.symbol, momentIndex].concat(registerIndices)
				},
				undo: [{

					name: 'clear$',
					func: circuit.clear$,
					args: [momentIndex].concat(registerIndices)
				}]
			})
		}


		//  Actually add the operation now.
		//  For multi-wire gates, we need to track input and output wires separately

		// Use ALL registerIndices as input wires (not just inputCount)
		const inputWires = registerIndices.slice()
		let outputWire

		// Calculate output wire position
		if (gate.wireSpan > 1) {

			// For multi-wire gates, output to intermediate wire
			// Example: AND gate on wires 1,2 outputs to wire 1.5
			const minWire = Math.min(...inputWires)
			const maxWire = Math.max(...inputWires)
			const rawOutput = minWire + (maxWire - minWire) / 2

			// Round to nearest 0.5 to avoid quarter wires (e.g. 2.25)
			// 1.5 + 3 -> 2.25 -> rounds to 2.5
			outputWire = Math.round(rawOutput * 2) / 2

		} else {

			// Single wire gate outputs to same wire
			outputWire = inputWires[0]
		}

		this.operations.push({

			gate,
			momentIndex,
			registerIndices,
			inputWires,
			outputWire
		})
		this.needsEvaluation = true
		this.sort$()

		window.dispatchEvent(new CustomEvent('C.Circuit.set$', {
			detail: {

				circuit,
				momentIndex,
				registerIndices
			}
		}))

		return this
	},
	clear$: function (momentIndex, ...registerIndices) {

		const
			circuit = this,
			operationIndex = this.operations.findIndex(function (operation) {

				return (

					operation.momentIndex === momentIndex &&
					operation.registerIndices[0] === registerIndices[0]
				)
			})

		if (operationIndex >= 0) {

			this.operations.splice(operationIndex, 1)
			this.needsEvaluation = true

			window.dispatchEvent(new CustomEvent('C.Circuit.clear$', {
				detail: {

					circuit,
					momentIndex,
					registerIndices
				}
			}))
		}

		return this
	},
	get: function (momentIndex, registerIndex) {

		return this.operations.find(function (operation) {

			return (

				operation.momentIndex === momentIndex &&
				operation.registerIndices.includes(registerIndex)
			)
		})
	}
})


