
//  Copyright © 2025, Classical Circuit Simulator (C.js)
//  Based on Q.js by Stewart Smith




const C = function(){


	//  Did we send arguments of the form
	//  ( bandwidth, timewidth )?

	if( arguments.length === 2 &&
		Array.from( arguments ).every( function( argument ){

		return C.isUsefulInteger( argument )

	})){

		return new C.Circuit( arguments[ 0 ], arguments[ 1 ])
	}


	//  Otherwise assume we are creating a circuit
	//  from a text block.

	return C.Circuit.fromText( arguments[ 0 ])
}




Object.assign( C, {

	verbosity: 0.5,
	log: function( verbosityThreshold, ...remainingArguments ){

		if( C.verbosity >= verbosityThreshold ) console.log( ...remainingArguments )
		return '(log)'
	},
	warn: function(){

		console.warn( ...arguments )
		return '(warn)'
	},
	error: function(){

		console.error( ...arguments )
		return '(error)'
	},
	extractDocumentation: function( f ){

		`
		I wanted a way to document code
		that was cleaner, more legible, and more elegant
		than the bullshit we put up with today.
		Also wanted it to print nicely in the console.
		`

		f = f.toString()

		const
		begin = f.indexOf( '`' ) + 1,
		end   = f.indexOf( '`', begin ),
		lines = f.substring( begin, end ).split( '\n' )


		function countPrefixTabs( text ){


			//  Is counting tabs "manually"
			//  actually more performant than regex?

			let count = index = 0
			while( text.charAt( index ++ ) === '\t' ) count ++
			return count
		}


		//-------------------  TO DO!
		//  we should check that there is ONLY whitespace between the function opening and the tick mark!
		//  otherwise it's not documentation.

		let
		tabs  = Number.MAX_SAFE_INTEGER

		lines.forEach( function( line ){

			if( line ){

				const lineTabs = countPrefixTabs( line )
				if( tabs > lineTabs ) tabs = lineTabs
			}
		})
		lines.forEach( function( line, i ){

			if( line.trim() === '' ) line = '\n\n'
			lines[ i ] = line.substring( tabs ).replace( / {2}$/, '\n' )
		})
		return lines.join( '' )
	},
	help: function( f ){

		if( f === undefined ) f = C
		return C.extractDocumentation( f )
	},
	constants: {},
	createConstant: function( key, value ){

		//Object.freeze( value )
		this[ key ] = value
		this.constants[ key ] = this[ key ]
		Object.freeze( this[ key ])
	},
	createConstants: function(){

		if( arguments.length % 2 !== 0 ){

			return C.error( 'C attempted to create constants with invalid (KEY, VALUE) pairs.' )
		}
		for( let i = 0; i < arguments.length; i += 2 ){

			this.createConstant( arguments[ i ], arguments[ i + 1 ])
		}
	},




	isUsefulNumber: function( n ){

		return isNaN( n ) === false &&
			( typeof n === 'number' || n instanceof Number ) &&
			n !==  Infinity &&
			n !== -Infinity
	},
	isUsefulInteger: function( n ){

		return C.isUsefulNumber( n ) && Number.isInteger( n )
	},
	loop: function(){},
	round: function( n, d ){

		if( typeof d !== 'number' ) d = 0
		const f = Math.pow( 10, d )
		return Math.round( n * f ) / f
	},
	toTitleCase: function( text ){

		text = text.replace( /_/g, ' ' )
		return text.toLowerCase().split( ' ' ).map( function( word ){

			return word.replace( word[ 0 ], word[ 0 ].toUpperCase() )

		}).join(' ')
	},
	centerText: function( text, length, filler ){

		if( length > text.length ){

			if( typeof filler !== 'string' ) filler = ' '

			const
			padLengthLeft  = Math.floor(( length - text.length ) / 2 ),
			padLengthRight = length - text.length - padLengthLeft

			return text
				.padStart( padLengthLeft + text.length, filler )
				.padEnd( length, filler )
		}
		else return text
	},





	namesIndex: 0,
	shuffledNames: [],
	shuffleNames$: function(){

		let m = []
		for( let c = 0; c < C.COLORS.length; c ++ ){

			for( let a = 0; a < C.DEVICES.length; a ++ ){

				m.push([ c, a, Math.random() ])
			}
		}
		C.shuffledNames = m.sort( function( a, b ){

			return a[ 2 ] - b[ 2 ]
		})
	},
	getRandomName$: function(){

		if( C.shuffledNames.length === 0 ) C.shuffleNames$()

		const
		pair = C.shuffledNames[ C.namesIndex ],
		name = C.COLORS[ pair[ 0 ]] +' '+ C.DEVICES[ pair[ 1 ]]

		C.namesIndex = ( C.namesIndex + 1 ) % C.shuffledNames.length
		return name
	},
	hueToColorName: function( hue ){

		hue = hue % 360
		hue = Math.floor( hue / 10 )
		return C.COLORS[ hue ]
	},
	colorIndexToHue: function( i ){

		return i * 10
	}




})




C.createConstants(

	'REVISION', 1,
	'EPSILON', Number.EPSILON * 6,

	'DEVICES', [
		'Amplifier',
		'Accumulator',
		'ALU',
		'Adder',
		'Buffer',
		'Comparator',
		'Counter',
		'Decoder',
		'Demux',
		'Driver',
		'Encoder',
		'Flip-flop',
		'Gate',
		'Inverter',
		'Latch',
		'LED',
		'Multiplexer',
		'NAND',
		'NOR',
		'Register',
		'Relay',
		'Resistor',
		'Selector',
		'Sensor',
		'Shifter',
		'Switch',
		'Timer',
		'Transistor',
		'XOR'
	],
	'COLORS', [

		'Red',         //    0  RED
		'Scarlet',     //   10
		'Tawny',       //   20
		'Carrot',      //   30
		'Pumpkin',     //   40
		'Mustard',     //   50
		'Lemon',       //   60  Yellow
		'Lime',        //   70
		'Spring bud',  //   80
		'Spring grass',//   90
		'Pear',        //  100
		'Kelly',       //  110
		'Green',       //  120  GREEN
		'Malachite',   //  130
		'Sea green',   //  140
		'Sea foam',    //  150
		'Aquamarine',  //  160
		'Turquoise',   //  170
		'Cyan',        //  180  Cyan
		'Pacific blue',//  190
		'Baby blue',   //  200
		'Ocean blue',  //  210
		'Sapphire',    //  220
		'Azure',       //  230
		'Blue',        //  240  BLUE
		'Cobalt',      //  250
		'Indigo',      //  260
		'Violet',      //  270
		'Lavender',    //  280
		'Purple',      //  290
		'Magenta',     //  300  Magenta
		'Hot pink',    //  310
		'Fuschia',     //  320
		'Ruby',        //  330
		'Crimson',     //  340
		'Carmine'      //  350
	]
)




console.log( `


  CCCCCC
CC      CC
CC
CC
CC
CC      CC
  CCCCCC    ${C.REVISION}



https://classical-circuit-simulator.js



` )


