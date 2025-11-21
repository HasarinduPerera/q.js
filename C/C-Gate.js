
//  Copyright © 2025, Classical Circuit Simulator (C.js)




C.Gate = function (params) {

	Object.assign(this, params)
	this.index = C.Gate.index++

	if (typeof this.symbol !== 'string') this.symbol = '?'


	//  We use symbols as unique identifiers
	//  among gate CONSTANTS
	//  so if you use the same symbol for a non-constant
	//  that's not a deal breaker
	//  but it is good to know.

	const
		scope = this,
		foundConstant = Object
			.values(C.Gate.constants)
			.find(function (gate) {

				return gate.symbol === scope.symbol
			})

	if (foundConstant) {

		C.warn(`C.Gate is creating a new instance, #${this.index}, that uses the same symbol as a pre-existing Gate constant:`, foundConstant)
	}

	if (typeof this.name !== 'string') this.name = 'Unknown'
	if (typeof this.nameCss !== 'string') this.nameCss = 'unknown'
	if (typeof this.inputCount !== 'number') this.inputCount = 1
	if (typeof this.wireSpan !== 'number') this.wireSpan = this.inputCount


	//  Every gate must have an applyToInputs method.
	//  If it doesn't exist, we'll create a default one.

	if (typeof this.applyToInputs !== 'function') {

		this.applyToInputs = function (...inputs) {
			return inputs[0] !== undefined ? inputs[0] : new C.Bit(0)
		}
	}
}




Object.assign(C.Gate, {

	index: 0,
	constants: {},
	createConstant: C.createConstant,
	createConstants: C.createConstants,
	findBy: function (key, value) {

		return (

			Object
				.values(C.Gate.constants)
				.find(function (item) {

					if (typeof value === 'string' &&
						typeof item[key] === 'string') {

						return value.toLowerCase() === item[key].toLowerCase()
					}
					return value === item[key]
				})
		)
	},
	findBySymbol: function (symbol) {

		return C.Gate.findBy('symbol', symbol)
	},
	findByName: function (name) {

		return C.Gate.findBy('name', name)
	}
})




Object.assign(C.Gate.prototype, {

	clone: function (params) {

		return new C.Gate(Object.assign({}, this, params))
	},
	set$: function (key, value) {

		this[key] = value
		return this
	},
	setSymbol$: function (value) {

		return this.set$('symbol', value)
	}
})




C.Gate.createConstants(


	//  Single input gates

	'IDENTITY', new C.Gate({

		symbol: 'I',
		name: 'Identity',
		nameCss: 'identity',
		inputCount: 1,
		applyToInputs: function (a) {
			return new C.Bit(a.value)
		}
	}),
	'BUFFER', new C.Gate({

		symbol: 'BUF',
		name: 'Buffer',
		nameCss: 'buffer',
		inputCount: 1,
		applyToInputs: function (a) {
			return new C.Bit(a.value)
		}
	}),
	'NOT', new C.Gate({

		symbol: 'NOT',
		name: 'NOT',
		nameCss: 'not',
		inputCount: 1,
		applyToInputs: function (a) {
			return new C.Bit(a.value === 0 ? 1 : 0)
		}
	}),


	//  Two input gates

	'AND', new C.Gate({

		symbol: 'AND',
		name: 'AND',
		nameCss: 'and',
		inputCount: 2,
		wireSpan: 2,
		applyToInputs: function (a, b) {
			return new C.Bit((a.value && b.value) ? 1 : 0)
		}
	}),
	'OR', new C.Gate({

		symbol: 'OR',
		name: 'OR',
		nameCss: 'or',
		inputCount: 2,
		wireSpan: 2,
		applyToInputs: function (a, b) {
			return new C.Bit((a.value || b.value) ? 1 : 0)
		}
	}),
	'NAND', new C.Gate({

		symbol: 'NAND',
		name: 'NAND',
		nameCss: 'nand',
		inputCount: 2,
		wireSpan: 2,
		applyToInputs: function (a, b) {
			return new C.Bit((a.value && b.value) ? 0 : 1)
		}
	}),
	'NOR', new C.Gate({

		symbol: 'NOR',
		name: 'NOR',
		nameCss: 'nor',
		inputCount: 2,
		wireSpan: 2,
		applyToInputs: function (a, b) {
			return new C.Bit((a.value || b.value) ? 0 : 1)
		}
	}),
	'XOR', new C.Gate({

		symbol: 'XOR',
		name: 'XOR',
		nameCss: 'xor',
		inputCount: 2,
		wireSpan: 2,
		applyToInputs: function (a, b) {
			return new C.Bit((a.value !== b.value) ? 1 : 0)
		}
	}),
	'XNOR', new C.Gate({

		symbol: 'XNOR',
		name: 'XNOR',
		nameCss: 'xnor',
		inputCount: 2,
		wireSpan: 2,
		applyToInputs: function (a, b) {
			return new C.Bit((a.value === b.value) ? 1 : 0)
		}
	}),


	//  Three input gates

	'AND3', new C.Gate({

		symbol: 'AND3',
		name: 'AND (3-input)',
		nameCss: 'and3',
		inputCount: 3,
		wireSpan: 3,
		applyToInputs: function (a, b, c) {
			return new C.Bit((a.value && b.value && c.value) ? 1 : 0)
		}
	}),
	'OR3', new C.Gate({

		symbol: 'OR3',
		name: 'OR (3-input)',
		nameCss: 'or3',
		inputCount: 3,
		wireSpan: 3,
		applyToInputs: function (a, b, c) {
			return new C.Bit((a.value || b.value || c.value) ? 1 : 0)
		}
	}),


	//  Special gates

	'PROBE', new C.Gate({

		symbol: 'P',
		name: 'Probe',
		nameCss: 'probe',
		inputCount: 1,
		applyToInputs: function (a) {
			// Just passes through the value but can be monitored
			return new C.Bit(a.value)
		}
	})
)


