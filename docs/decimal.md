# Decimal

A `Decimal` represents an exact base-10 decimal number, stored in IEEE 754-2019 Decimal128 format. This provides up to 34 significant digits of precision for exact decimal arithmetic.

<!-- prettier-ignore-start -->
```javascript
// Exact decimal arithmetic
const price = new Decimal("19.99");
const tax = new Decimal("0.0825");
const total = price.multiply(new Decimal("1").add(tax)); // => Decimal("21.64")
total.toString(); // => "21.64"
```
<!-- prettier-ignore-end -->

`Decimal` values are canonicalized, meaning that different representations of the same mathematical value are normalized. For example, "1.20" and "1.2" both result in the same `Decimal` value.

## Constructor

### **new Decimal**(_value_: string | number | bigint) : Decimal

**Parameters:**

- `value` (string | number | bigint): The value to convert to a Decimal.

**Returns:** a new `Decimal` object.

Creates a new `Decimal` object representing an exact decimal number.

The most reliable way to create a `Decimal` is from a string, which preserves the exact decimal representation. Creating from a `Number` may introduce rounding errors if that number cannot be exactly represented in binary floating-point.

Example usage:

```js
// From string (recommended for exact values)
d1 = new Decimal("123.456");
d2 = new Decimal("-0.0078");
d3 = new Decimal("6.022e23"); // Scientific notation

// From number (be aware of binary floating-point limitations)
d4 = new Decimal(42);
d5 = new Decimal(0.1); // Actually Decimal("0.1000000000000000055511151231257827...")

// From bigint
d6 = new Decimal(123n);
```

## Special Values

### NaN (Not a Number)

`Decimal` has its own NaN value, distinct from JavaScript's global `NaN`:

```js
const notANumber = new Decimal("NaN");
notANumber.toString(); // => "NaN"

// Operations with NaN propagate
notANumber.add(new Decimal("5")).toString(); // => "NaN"
```

### Infinity

`Decimal` supports positive and negative infinity, distinct from JavaScript's `Infinity`:

```js
const posInf = new Decimal("Infinity");
const negInf = new Decimal("-Infinity");

posInf.toString(); // => "Infinity"
negInf.toString(); // => "-Infinity"

// Arithmetic with infinity
posInf.add(new Decimal("1")).toString(); // => "Infinity"
new Decimal("1").divide(new Decimal("0")).toString(); // => "Infinity"
```

## Methods

### **significand()** : bigint

Returns the significand (mantissa) of the decimal number as a bigint, without regard to the exponent.

```js
new Decimal("123.45").significand(); // => 12345n
new Decimal("0.00123").significand(); // => 123n
```

### **exponent()** : number

Returns the base-10 exponent of the decimal number.

```js
new Decimal("123.45").exponent(); // => -2 (representing 12345 × 10^-2)
new Decimal("1.23e5").exponent(); // => 3 (representing 123 × 10^3)
```

### **isNaN()** : boolean

Returns true if the value is NaN (Not a Number).

```js
new Decimal("NaN").isNaN(); // => true
new Decimal("123").isNaN(); // => false
```

### **isFinite()** : boolean

Returns true if the value is finite (not NaN or infinity).

```js
new Decimal("123").isFinite(); // => true
new Decimal("Infinity").isFinite(); // => false
new Decimal("NaN").isFinite(); // => false
```

## Arithmetic Methods

All arithmetic methods return a new `Decimal` object. The original object is never modified.

### **add**(_other_: Decimal) : Decimal

Returns the sum of this decimal and another Decimal.

```js
const a = new Decimal("10.25");
const b = new Decimal("5.75");
a.add(b).toString(); // => "16"

const c = new Decimal("3.5");
a.add(c).toString(); // => "13.75"
```

### **subtract**(_other_: Decimal) : Decimal

Returns the difference between this decimal and another Decimal.

```js
const a = new Decimal("10.25");
const b = new Decimal("5.75");
a.subtract(b).toString(); // => "4.5"

const c = new Decimal("3.5");
a.subtract(c).toString(); // => "6.75"
```

### **multiply**(_other_: Decimal) : Decimal

Returns the product of this decimal and another Decimal.

```js
const price = new Decimal("19.99");
const quantity = new Decimal("3");
price.multiply(quantity).toString(); // => "59.97"
```

### **divide**(_other_: Decimal) : Decimal

Returns the quotient of this decimal divided by another Decimal.

```js
const total = new Decimal("100");
const parts = new Decimal("3");
total.divide(parts).toString(); // => "33.33333333333333333333333333333333"
```

### **remainder**(_other_: Decimal) : Decimal

Returns the remainder of dividing this decimal by another Decimal.

```js
const a = new Decimal("10");
const b = new Decimal("3");
a.remainder(b).toString(); // => "1"
```

### **abs**() : Decimal

Returns the absolute value.

```js
new Decimal("-123.45").abs().toString(); // => "123.45"
new Decimal("123.45").abs().toString(); // => "123.45"
```

### **negate**() : Decimal

Returns the negation of this value.

```js
new Decimal("123.45").negate().toString(); // => "-123.45"
new Decimal("-123.45").negate().toString(); // => "123.45"
```

## Rounding Methods

All rounding methods follow IEEE 754-2019 rounding modes.

### **round**(_scale_?: number, _roundingMode_?: string) : Decimal

Rounds to a given number of decimal places.

**Parameters:**

- `scale` (number): Number of decimal places to round to (default: 0)
- `roundingMode` (string): One of "ceil", "floor", "trunc", "halfEven" (default), or "halfExpand"

```js
const d = new Decimal("123.456");
d.round().toString(); // => "123"
d.round(2).toString(); // => "123.46"
d.round(2, "floor").toString(); // => "123.45"
```

## Comparison Methods

### **equals**(_other_: Decimal) : boolean

Returns true if this decimal equals another Decimal.

```js
const a = new Decimal("123.45");
const b = new Decimal("123.45");
const c = new Decimal("123.46");
a.equals(b); // => true
a.equals(c); // => false
```

### **lessThan**(_other_: Decimal) : boolean

Returns true if this decimal is less than another Decimal.

```js
const a = new Decimal("10");
const b = new Decimal("20");
a.lessThan(b); // => true
b.lessThan(a); // => false
```

### **lessThanOrEqual**(_other_: Decimal) : boolean

Returns true if this decimal is less than or equal to another Decimal.

### **greaterThan**(_other_: Decimal) : boolean

Returns true if this decimal is greater than another Decimal.

### **greaterThanOrEqual**(_other_: Decimal) : boolean

Returns true if this decimal is greater than or equal to another Decimal.

### **compare**(_other_: Decimal) : number

Returns -1, 0, or 1 depending on whether this decimal is less than, equal to, or greater than another Decimal.

```js
const a = new Decimal("10");
const b = new Decimal("20");
const c = new Decimal("30");

a.compare(b); // => -1
b.compare(b); // => 0
c.compare(b); // => 1
```

## Conversion Methods

### **toString**() : string

Returns a string representation of the decimal value.

```js
new Decimal("123.45").toString(); // => "123.45"
new Decimal("1.23e5").toString(); // => "123000"
```

### **toFixed**({_digits_: number}) : string

Returns a string with a fixed number of decimal places.

```js
const d = new Decimal("123.456");
d.toFixed({ digits: 0 }); // => "123"
d.toFixed({ digits: 2 }); // => "123.46"
d.toFixed({ digits: 5 }); // => "123.45600"
```

### **toExponential**({_digits_: number}?) : string

Returns a string in exponential notation.

```js
const d = new Decimal("123.456");
d.toExponential(); // => "1.23456e+2"
d.toExponential({ digits: 2 }); // => "1.23e+2"
```

### **toPrecision**({ _digits_: number}) : string

Returns a string with the specified number of significant digits.

```js
const d = new Decimal("123.456");
d.toPrecision({ digits: 2 }); // => "1.2e+2"
d.toPrecision({ digits: 5 }); // => "123.46"
```

### **toNumber**() : number

Converts to a JavaScript Number. Note: This may lose precision.

```js
new Decimal("123.45").toNumber(); // => 123.45
new Decimal("123.456789012345678901234567890123").toNumber(); // => 123.45678901234568
```

### **toBigInt**() : bigint

Converts to a BigInt, throwing if the number isn't actually an integer:

```js
new Decimal("123").toBigInt(); // => 123n
new Decimal("123.99").toBigInt(); // throws
```

### **valueOf**()

This method always throws, since there is currently no primitive that would exactly match the numeric representation of a Decimal.
```
