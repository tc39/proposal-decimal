import { Decimal } from 'proposal-decimal';

console.log('=== Testing Decimal API ===\n');

// Basic creation
console.log('Creating Decimal:');
const d1 = new Decimal('123.45');
console.log('new Decimal("123.45"):', d1.toString());

// Properties
console.log('\nProperties:');
console.log('isNaN():', d1.isNaN());
console.log('isFinite():', d1.isFinite());
console.log('exponent():', d1.exponent());
console.log('significand():', d1.significand());

// Arithmetic
console.log('\nArithmetic:');
const d2 = new Decimal('10');
console.log('d1.add(d2):', d1.add(d2).toString());
console.log('d1.multiply(d2):', d1.multiply(d2).toString());

// Rounding
console.log('\nRounding:');
const d3 = new Decimal('123.456');
console.log('d3.round(2):', d3.round(2).toString());

