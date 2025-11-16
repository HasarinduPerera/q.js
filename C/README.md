# C.js - Classical Circuit Simulator

A classical (digital) circuit simulator inspired by the quantum circuit simulator Q.js. Build and test logic circuits using classical logic gates.

## Features

- **Classical Logic Gates**: AND, OR, NOT, NAND, NOR, XOR, XNOR, and more
- **Interactive Circuit Editor**: Visual circuit builder with drag-and-drop interface
- **Multiple Input Formats**: Create circuits programmatically or from text notation
- **Real-time Evaluation**: Instant circuit evaluation with detailed results
- **Undo/Redo Support**: Full history tracking for circuit modifications
- **Export Capabilities**: Export circuits to text and diagrams

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
	<link rel="stylesheet" href="C.css">
	<link rel="stylesheet" href="C-Circuit-Editor.css">
</head>
<body>
	<div id="circuit"></div>

	<script src="C.js"></script>
	<script src="C-Bit.js"></script>
	<script src="C-Gate.js"></script>
	<script src="C-History.js"></script>
	<script src="C-Circuit.js"></script>
	<script src="C-Circuit-Editor.js"></script>

	<script>
		// Create a simple circuit
		const circuit = new C.Circuit(3, 5)
		circuit.bits[0] = C.Bit.ONE
		circuit.bits[1] = C.Bit.ZERO
		circuit.bits[2] = C.Bit.ONE

		// Add gates
		circuit.set$('NOT', 1, 1)
		circuit.set$('AND', 2, 2)
		circuit.set$('OR', 3, 3)

		// Create interactive editor
		circuit.toDom(document.getElementById('circuit'))
	</script>
</body>
</html>
```

## Available Gates

- **NOT** - Inverts the input bit
- **AND** - Outputs 1 only if both inputs are 1
- **OR** - Outputs 1 if at least one input is 1
- **NAND** - Inverted AND gate
- **NOR** - Inverted OR gate
- **XOR** - Outputs 1 if inputs are different
- **XNOR** - Outputs 1 if inputs are the same
- **BUFFER** - Passes the input unchanged
- **PROBE** - Monitoring point (passes value through)

## API Reference

### C.Bit

Represents a classical bit with value 0 or 1.

```javascript
const bit0 = new C.Bit(0)  // Creates a bit with value 0
const bit1 = new C.Bit(1)  // Creates a bit with value 1

// Constants
C.Bit.ZERO   // Bit with value 0
C.Bit.ONE    // Bit with value 1
C.Bit.LOW    // Same as ZERO
C.Bit.HIGH   // Same as ONE
C.Bit.FALSE  // Same as ZERO
C.Bit.TRUE   // Same as ONE
```

### C.Gate

Represents a logic gate operation.

```javascript
// Get a gate by symbol
const notGate = C.Gate.findBySymbol('NOT')
const andGate = C.Gate.findBySymbol('AND')

// Apply gate to inputs
const input = new C.Bit(1)
const output = notGate.applyToInputs(input)  // Returns new C.Bit(0)
```

### C.Circuit

Represents a complete circuit with bits and gates.

```javascript
// Create a circuit with 3 bits and 5 time steps
const circuit = new C.Circuit(3, 5)

// Set input bit values
circuit.bits[0] = C.Bit.ONE
circuit.bits[1] = C.Bit.ZERO
circuit.bits[2] = C.Bit.ONE

// Add gates
circuit.set$('NOT', momentIndex, registerIndex)
circuit.set$('AND', 2, 1)

// Remove gates
circuit.clear$(momentIndex, registerIndex)

// Evaluate circuit
circuit.evaluate$()

// Get results
console.log(circuit.report$())
console.log(circuit.toDiagram())
```

### C.Circuit.Editor

Interactive DOM-based circuit editor.

```javascript
// Create editor
const editor = new C.Circuit.Editor(circuit, targetElement)

// Or use convenience method
const editor = circuit.toDom(targetElement)

// Create gate palette
const palette = C.Circuit.Editor.createPalette()
document.body.appendChild(palette)
```

## Text-Based Circuit Creation

Create circuits using simple text notation:

```javascript
const circuit = C.Circuit.fromText(`
	NOT-AND-I
	I---OR--I
	I---I---XOR
`)
```

Where:
- Each row represents a bit (wire)
- Gates are separated by `-` or spaces
- `I` represents an identity/no-op operation

## Examples

### Half Adder

```javascript
const halfAdder = new C.Circuit(2, 3)
halfAdder.bits[0] = C.Bit.ONE
halfAdder.bits[1] = C.Bit.ONE
halfAdder.set$('XOR', 1, 1)  // Sum output
halfAdder.set$('AND', 1, 2)  // Carry output
halfAdder.evaluate$()
console.log(halfAdder.report$())
```

### NOT Gate

```javascript
const notCircuit = new C.Circuit(1, 2)
notCircuit.bits[0] = C.Bit.ONE
notCircuit.set$('NOT', 1, 1)
notCircuit.evaluate$()
// Result: Bit 1 will be 0
```

### AND Gate

```javascript
const andCircuit = new C.Circuit(2, 2)
andCircuit.bits[0] = C.Bit.ONE
andCircuit.bits[1] = C.Bit.ONE
andCircuit.set$('AND', 1, 1)
andCircuit.evaluate$()
// Result: Bit 1 will be 1 (1 AND 1 = 1)
```

## Architecture

C.js follows a modular architecture:

- **C.js** - Main entry point and utilities
- **C-Bit.js** - Classical bit representation
- **C-Gate.js** - Logic gate definitions
- **C-Circuit.js** - Circuit structure and evaluation
- **C-History.js** - Undo/redo functionality
- **C-Circuit-Editor.js** - Interactive editor
- **C.css** - Core styles
- **C-Circuit-Editor.css** - Editor-specific styles

## Comparison with Q.js

| Feature | Q.js (Quantum) | C.js (Classical) |
|---------|---------------|------------------|
| Basic Unit | Qubit (superposition) | Bit (0 or 1) |
| Gates | Quantum gates (H, X, Y, Z, CNOT) | Logic gates (AND, OR, NOT, etc.) |
| State | Complex probability amplitudes | Deterministic 0 or 1 |
| Evaluation | Matrix multiplication | Boolean logic |
| Output | Probability distribution | Exact bit values |

## Browser Support

C.js works in all modern browsers that support ES6:

- Chrome/Edge 51+
- Firefox 54+
- Safari 10+

## License

Copyright © 2025, Classical Circuit Simulator (C.js)
Based on Q.js by Stewart Smith

## Credits

C.js is inspired by and based on [Q.js](https://quantumjavascript.app/) - a quantum circuit simulator by Stewart Smith.

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## Learn More

For more information about classical digital circuits and logic gates:
- [Digital Logic](https://en.wikipedia.org/wiki/Logic_gate)
- [Boolean Algebra](https://en.wikipedia.org/wiki/Boolean_algebra)
- [Digital Electronics](https://en.wikipedia.org/wiki/Digital_electronics)
