
//  Copyright © 2025, Classical Circuit Simulator (C.js)




C.Bit = function( value, symbol, name ){


	//  Normalize input to 0 or 1
	if( typeof value === 'boolean' ){
		this.value = value ? 1 : 0
	}
	else if( typeof value === 'number' ){
		this.value = value ? 1 : 0  // Any non-zero number becomes 1
	}
	else {
		this.value = 0  // Default to 0
	}

	this.index = C.Bit.index ++


	//  Used for notation

	if( typeof symbol === 'string' ) this.symbol = symbol
	if( typeof name  === 'string' ) this.name  = name
	if( this.symbol === undefined || this.name === undefined ){

		const found = Object.values( C.Bit.constants ).find( function( bit ){

			return value === bit.value
		})
		if( found === undefined ){

			this.symbol = '?'
			this.name  = 'Unnamed'
		}
		else {

			if( this.symbol === undefined ) this.symbol = found.symbol
			if( this.name  === undefined ) this.name  = found.name
		}
	}
}




Object.assign( C.Bit, {

	index: 0,
	help: function(){ return C.help( this )},
	constants: {},
	createConstant:  C.createConstant,
	createConstants: C.createConstants,



	findBy: function( key, value ){

		return (

			Object
			.values( C.Bit.constants )
			.find( function( item ){

				if( typeof value === 'string' &&
					typeof item[ key ] === 'string' ){

					return value.toLowerCase() === item[ key ].toLowerCase()
				}
				return value === item[ key ]
			})
		)
	},
	findBySymbol: function( symbol ){

		return C.Bit.findBy( 'symbol', symbol )
	},
	findByName: function( name ){

		return C.Bit.findBy( 'name', name )
	},
	findByValue: function( value ){

		return Object.values( C.Bit.constants ).find( function( bit ){

			return bit.value === value
		})
	},
	areEqual: function( bit0, bit1 ){

		return bit0.value === bit1.value
	},
	toText: function( bit ){

		return bit.value.toString()
	},
	toBinary: function( bit ){

		return bit.value
	}

})




C.Bit.createConstants(

	//  Binary states

	'ZERO', new C.Bit( 0, '0', 'Zero' ),
	'ONE',  new C.Bit( 1, '1', 'One' ),
	'LOW',  new C.Bit( 0, 'L', 'Low' ),
	'HIGH', new C.Bit( 1, 'H', 'High' ),
	'FALSE', new C.Bit( 0, 'F', 'False' ),
	'TRUE',  new C.Bit( 1, 'T', 'True' )
)




Object.assign( C.Bit.prototype, {

	copy$: function( bit ){

		if( bit instanceof C.Bit !== true )
			return C.error( `C.Bit attempted to copy something that was not a bit in this bit #${this.index}.`, this )

		this.value = bit.value
		return this
	},
	clone: function(){

		return new C.Bit( this.value )
	},
	isEqualTo: function( otherBit ){

		return C.Bit.areEqual( this, otherBit )  // Returns a Boolean
	},
	applyGate: function( gate, ...args ){

		return C.Bit.applyGate( this, gate, ...args )
	},
	toText: function(){

		return C.Bit.toText( this )  // Returns a String
	},
	toBinary: function(){

		return C.Bit.toBinary( this )  // Returns 0 or 1
	},
	applyGate$: function( gate ){

		return this.copy$( C.Bit.applyGate( this, gate ))
	},
	NOT: function(){

		return new C.Bit( this.value === 0 ? 1 : 0 )
	},
	NOT$: function(){

		this.value = this.value === 0 ? 1 : 0
		return this
	}
})


