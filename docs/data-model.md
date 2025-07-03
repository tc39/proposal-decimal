# Decimal Data Model

## Overview

The Decimal proposal uses a subset of the IEEE 754-2019 Decimal128 format. This document explains the data model, design decisions, and technical details of how decimal values are represented and manipulated.

## IEEE 754-2019 Decimal128

Decimal128 is part of the IEEE 754 standard for floating-point arithmetic, added in the 2008 revision. (In fact, JS's Number type is also based on IEEE 754: binary64) It provides a 128-bit representation(each decimal value is stored in exactly 128 bits) for base-10 arithmetic with up to 34 significant digits and an exponent range of -6143 to +6144.

The choice of Decimal128 balances several considerations:

1. **Sufficient precision**: 34 digits covers virtually all practical use cases, including:
   - Financial calculations (even very large values that don't occur in everyday scenarios)
   - Scientific measurements
2. **Fixed size**: Unlike arbitrary-precision decimals, Decimal128 has predictable memory usage and performance characteristics
3. **Industry standard**: Widely supported in other languages
4. **Reasonable range**: Can represent values from ±10^-6143 to ±10^6144

### Special Values

#### NaN (Not a Number)

Decimal has a single, quiet NaN value, similar to JS's Number:

```javascript
const nan = new Decimal("NaN");
nan.isNaN; // => true

// NaN propagates through operations
nan.add(new Decimal("5")); // => NaN
nan.multiply(new Decimal("0")); // => NaN
```

#### Infinity

Positive and negative infinity are supported:

```javascript
const posInf = new Decimal("Infinity");
const negInf = new Decimal("-Infinity");

posInf.isFinite; // => false
posInf.add(new Decimal("1")); // => Infinity
posInf.negate(); // => -Infinity
```

#### Zero

Decimal supports both positive and negative zero:

```javascript
const posZero = new Decimal("0");
const negZero = new Decimal("-0");

// They are equal in value
posZero.equals(negZero); // => true

// But can be distinguished
Object.is(posZero, negZero); // => false
```

### Canonicalization

Decimal values are canonicalized, meaning different representations of the same mathematical value are normalized:

```javascript
// These all become the same Decimal value
new Decimal("1.20").toString(); // => "1.2"
new Decimal("1.200").toString(); // => "1.2"
new Decimal("01.2").toString(); // => "1.2"
new Decimal("1.2e0").toString(); // => "1.2"
```

This is a deliberate departure from the full IEEE 754 standard, which preserves trailing zeros.

## Arithmetic Operations

### Exact Arithmetic

Within the range and precision limits, Decimal arithmetic is exact:

```javascript
// These operations are exact
new Decimal("0.1").add(new Decimal("0.2")); // => 0.3 (exactly)
new Decimal("10").divide(new Decimal("3")).multiply(new Decimal("3")); // => 10 (exactly)
```

### Rounding

When a result would exceed 34 significant digits, the calculation is exact up to 34 digits with rounding occuring after the 34th digit:

```javascript
// Division may require rounding
const a = new Decimal("1");
const b = new Decimal("3");
const result = a.divide(b); // => 0.3333333333333333333333333333333333 (34 digits)
```

The default rounding mode is "half even" (banker's rounding), but other modes are available:

- **halfEven**: Round to nearest, ties to even (default)
- **halfExpand**: Round to nearest, ties away from zero
- **ceil**: Round towards positive infinity
- **floor**: Round towards negative infinity
- **trunc**: Round towards zero

### Overflow and Underflow

Operations that would exceed the exponent range result in infinity or zero:

```javascript
// Overflow to infinity
const big = new Decimal("1e6144");
big.multiply(new Decimal("10")); // => Infinity

// Underflow to zero
const small = new Decimal("1e-6143");
small.divide(new Decimal("10")); // => 0
```

## Comparison with Other Numeric Types

### vs Number (binary64)

| Aspect                       | Number (IEEE 754 binary64) | Decimal (IEEE 754 Decimal128) |
| ---------------------------- | -------------------------- | ----------------------------- |
| Base                         | Binary (base 2)            | Decimal (base 10)             |
| Precision                    | ~15-17 decimal digits      | Exactly 34 decimal digits     |
| Exact decimal representation | No                         | Yes                           |
| Range                        | ±1.8×10^308                | ±9.999...×10^6144             |
| Size                         | 64 bits                    | 128 bits                      |
| Special values               | ±0, ±Infinity, NaN         | ±0, ±Infinity, NaN            |

### vs BigInt

| Aspect            | BigInt           | Decimal               |
| ----------------- | ---------------- | --------------------- |
| Precision         | Arbitrary        | 34 significant digits |
| Non-integers      | No               | Yes                   |
| Memory usage      | Variable         | Fixed 128 bits        |
| Performance       | Varies with size | Consistent            |

## Design Decisions

### No Operator Overloading

Unlike some proposals, Decimal does not overload arithmetic operators:

```javascript
// This throws an error
const a = new Decimal("10");
const b = new Decimal("20");
// a + b; // TypeError!

// Use methods instead
a.add(b); // => Decimal("30")
```

This decision was made based on implementer feedback and concerns about performance implication, confusion with implicit conversions (given that Decimal is not proposed as a new primitive type).

### No Literal Syntax

There is no special literal syntax for Decimal values:

```javascript
// No decimal literal like 10.5m
// Use constructor instead
const decimal = new Decimal("10.5");
```

This simplifies the implementation and avoids syntax complexity.

### Canonicalization vs Cohort Preservation

IEEE 754 supports the concept of "cohorts", which are different representations of the same value (e.g., 1.20 vs 1.2). The Decimal proposal canonicalizes values, not preserving cohorts:

```javascript
new Decimal("1.20").toString(); // => "1.2" (trailing zero lost)
```
