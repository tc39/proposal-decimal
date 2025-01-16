# Ecma TC39 Decimal & Measure Proposal

**Stage**: 1

**Champions**:

- Andrew Paprocki (Bloomberg)
- Ben Allen (Igalia)
- Jesse Alama (Igalia)
- Jirka Maršík (Oracle)

**Authors**: Ben Allen, Jesse Alama, Waldemar Horwat

## Overview

The Decimal & Measure proposal aims to add two key capabilities to JavaScript:

1. Exact decimal arithmetic
2. Representation of measurements with units and precision tracking

Currently, JavaScript developers face several challenges when working with numbers and measurements:

- Binary floating-point numbers (JavaScript's `Number` type) cannot exactly represent many decimal values, with errors propagating in arithmetic
- No built-in way to track precision in measurements
- No support for handling units and conversions between them
- Difficulty in properly localizing measurements and preserving any underlying numerical precision

## Use Cases and Goals

### Exact Decimal Arithmetic and Financial Calculations

Key needs:

- Exact representation of decimal numbers
- Preservation of trailing zeros when needed
- Currency calculations without rounding errors
- Data exchange with financial systems

Why JavaScript?

- Modern web applications should be able to handle financial calculations client-side for better interactivity
- Growing use of JavaScript in financial backend systems (Node.js, Deno)
- Serverless architectures often require JavaScript for financial logic
- Need for consistent decimal handling across full-stack JavaScript applications, especially in a microservice setup

### Measurements with units

Key needs:

- Physical measurements with proper unit handling
- Precision tracking
- Unit conversions
- Localization of measurements

Why JavaScript?

- Web interfaces increasingly handle unit conversions client-side for responsive UX
- Scientific/technical web applications need to handle measurements
- Cross-platform applications need consistent measurement handling, including fidelity with the underlying numeric value

### Data Exchange

Key needs:

- Preserving exact decimal values when communicating with external systems
- Maintaining precision information in data pipelines
- Round-trip compatibility with databases and APIs

Why JavaScript?

- JavaScript apps consuming and produce a lot of API data
- Modern architectures often involve JavaScript microservices
- Need to maintain numeric precision when interfacing with databases
- Growing use of JavaScript for ETL (Extract, Transform, Load) processes

### Scientific and Technical Calculations

Key needs:

- Support for many significant digits, with verifiable digit-by-digit correctness
- Unit conversions (e.g., feet to meters)
- Precision tracking in calculations

Why JavaScript?

- Enabling JavaScript in scientific web applications, such as educational software or browser-based simulation and modeling tools
- Need for scientific calculations in educational software
- Web-based data visualization tools handling scientific data

## Design

We propose two new classes: `Decimal`, for storing exact decimal data, and `Measure`, for storing a number (not necessarily a JS `Number`), along with an optional unit and precision.

### Decimal Class

The `Decimal` class represents exact decimal values using a fixed 128-bit representation based on IEEE 754 Decimal128, with values are always normalized (that is, precision/quantum is not tracked, so that trailing zeros aren't supported).

With this model, we propose to support NaN, positive and negative infinity, and -0. This is to (1) ensure maximum compatibility with other systems that might also be based on IEEE 754. (However, as with JS's `Number`, we intend to support just *one* decimal NaN rather than boxed NaNs), and (2) advanced uses

#### API

##### Arithmetic

- absolute value
- negation (sign switch)
- addition and subtraction
- multiplication and division

We also support rounding, with all five IEEE 754 rounding modes (round-ties-to-even being the default, as with `Number` and the various mathematical operations in `Math`).

##### Comparisons

- `lessThan`
- `equals`

Becuase of NaN pollution, we also include:

- `notEqual`
- `greaterThan`
- `lessThanOrEqual`
- `greaterThanOrEqual`

##### Serialization

- `toString(): string`
- `toFixed(numDigits: number): string`
- `toPrecision({ precision?: number})`
- `toLocaleString(locale?: string): string`

#### Examples

```javascript
const price = new Decimal("1234.50");
console.log(price.toString()); // "1234.5"  // Note: normalized
console.log(price.toLocaleString("de-DE")); // "1.234,5"
```

### Measure Class

The `Measure` class represents values with units and, optionally, precision. It can track precision either through fractional digits or significant digits.

```javascript
interface MeasureOptions {
  unit?: string;
  precision?: number;
  precisionType?: 'fractionalDigits' | 'significantDigits';
  exponent?: number;
  usage?: string;
}
```

sets us up to discuss how to construct measurements:

```javascript
class Measure {
  constructor(value: Decimal | string | number, options?: MeasureOptions)

  // Get underlying mathematical value (normalized)
  getValue(): Decimal

  // Formatting
  toString(): string
  toLocaleString(
    locales?: string | string[],
    options?: Intl.NumberFormatOptions & {
      unit?: 'long' | 'short' | 'narrow',
      localeMeasurementSystem?: boolean
    }
  ): string
}
```

## Extended Examples

### Decimal Formatting and Localization

```javascript
const price = new Decimal("1234.50");

// Basic locale formatting
console.log(price.toLocaleString("en-US")); // "1,234.5"
console.log(price.toLocaleString("de-DE")); // "1.234,5"
console.log(price.toLocaleString("zh-CN")); // "1,234.5"

// Currency formatting
console.log(
  price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  }),
); // "$1,234.50"
```

### Measurements with Precision and Pluralization

```javascript
// Product ratings showing precision affects pluralization
const weights = [
  new Measure("1", { unit: "kilogram" }),
  new Measure("1.0", { unit: "kilogram" }),
  new Measure("2.0", { unit: "kilogram" }),
  new Measure("4.5", { unit: "kilogram" }),
];
```

Precision affects pluralization:

```javascript
console.log(weights.map((r) => r.toLocaleString("en-US")));
// [
//   "1 kilogram",      // singular
//   "1.0 kilograms",   // plural due to decimal
//   "2.0 kilograms",   // plural
//   "4.5 kilograms"    // plural
// ]
```

### Scientific and Technical Measurements

Consider an example about temperature, using different precision types.

```javascript
const temperatures = [
  new Measure("22.50", {
    unit: "celsius",
    precision: 2, // fractional digits (the default)
  }),
  new Measure("295.65", {
    unit: "kelvin",
    precision: 4,
    precisionType: "significantDigits", // <--***--<
  }),
];

// Locale-aware temperature formatting
console.log(temperatures[0].toLocaleString("en-US")); // "72.50°F"
```

### Complex Calculations Preserving Precision

```javascript
// Calculate total cost including tax with specific precision
const items = [
  { price: new Decimal("29.95"), quantity: 2 },
  { price: new Decimal("9.99"), quantity: 1 },
  { price: new Decimal("0.50"), quantity: 5 },
];

const taxRate = new Decimal("0.0725"); // 7.25% tax

// Calculate subtotal
const subtotal = items.reduce(
  (sum, item) => sum.add(item.price.multiply(new Decimal(item.quantity))),
  new Decimal("0"),
);

// Calculate tax and total
const tax = subtotal.multiply(taxRate);
const total = subtotal.add(tax);

// Create measure objects for formatting
const totalMeasure = new Measure(total, {
  precision: 2,
  unit: "USD",
});

console.log(totalMeasure.toLocaleString("en-US")); // "$77.64"
```

## Design Rationale

### Fixed Bit-Width Representation

The proposal uses IEEE 754 Decimal128 as its underlying representation for several reasons:

1. It provides sufficient precision for most real-world use cases (up to 34 significant decimal digits)
2. Established standard with well-defined semantics (JS already builds on IEEE 754)
3. Implementations exist in hardware and software, including some out-of-the-box compiler support
4. Reasonable memory footprint compared to arbitrary-precision alternatives
5. Backstopped by a maximum amount of data, preventing complex calculations from consuming too many resources

### Precision Handling

Precision is handled exclusively by the `Measure` class, which can represent it in two ways:

1. Fractional digits (default) - e.g., "1.20" has 2 fractional digits
2. Significant digits - e.g., "1200" with 3 significant digits becomes "120e+1"

This design separates concerns:

- `Decimal` handles exact mathematical values
- `Measure` handles units and precision tracking

### Alternative Considered: Three-Class Design

We considered an alternative design with three distinct classes: `Measure` and `Decimal`, as above, together with `Decimal128`, which is a representation of "full" (non-normalized) IEEE 754 Decimal128. By "non-normalizing" we mean data that encapsulates both a mathematical number and (following the terminology of IEEE 754) a quantum (intuitively understood as "precision"):

```javascript
class Decimal128 {
  constructor(value: string | number)

  // Returns precision based on trailing zeros
  getPrecision(): number  // e.g., "1.30" -> -2

  toString(): string     // Preserves trailing zeros
  toLocaleString(locale?: string): string
}
```

Here's how the three types could interact.

```javascript
// Decimal128 preserves trailing zeros
const d128 = new Decimal128("1.30");
console.log(d128.toString()); // "1.30"
console.log(d128.getPrecision()); // -2 (recall: power of 10)

// Decimal normalizes
const d = new Decimal("1.30");
console.log(d.toString()); // "1.3"
console.log(d.toDecimal128().toString()); // "1.3"  // No trailing zero

// Measure can work with either type:
const m1 = new Measure(new Decimal128("1.30"), { unit: "meter" });
console.log(m1.getValue().toString()); // "1.30"
console.log(m1.getNormalizedValue().toString()); // "1.3"

const m2 = new Measure(new Decimal("1.30"), { unit: "meter" });
console.log(m2.getValue().toString()); // "1.3"
```

This three-class approach would provide explicit separation between:

1. Full IEEE 754 Decimal128 values with precision (`Decimal128`)
2. Normalized mathematical values (`Decimal`)
3. Measurements with units (`Measure`)

It is unclear whether `Decimal128` should support arithmetic. We envision it largely as a contain for a number plus a precision. Although IEEE 754 does specify how the quanta of the arguments of mathematical operations determines the quantum of the result, it is difficult to understand these rules. On the one hand, one could provide these operations and simply follow IEEE 754, for the simple reason that IEEE 754 is a well-known standard. On the other hand, we believe that following these rules would be strange to JS programmers.

While this design offers more explicit control over precision and normalization, we opted for the two-class design because it has a simpler mental model (fewer types to learn and understand). Also, in the two-class approach, precision handling naturally belongs with measurement. The two-class approach has a reduced API surface area and fewer conversion paths, a clearer separation between mathematical values and measured quantities, and many use cases don't require the distinction between normalized and non-normalized decimal values outside of measurements.

That said, we don't consider these down arguments. We are open to the three-class approach.

## Emerging Trends and JavaScript's Expanding Role

The need for precise decimal and measurement handling in JavaScript is driven by several key trends in software development:

### 1. Evolution of Web Applications

Traditional web applications often deferred precise calculations to the server, treating JavaScript as a simple display layer. Modern applications are different. For instance, in JS-rich applications, the JS programmer and the enduser can reasonably expect, e.g., real-time price calculations with tax and shipping, dynamic unit conversions as users input values, immediate feedback on financial calculations. In offline settings, progressive beb apps need to handle calculations without server access.

### 2. JavaScript Beyond the Browser

JavaScript's role has expanded significantly. Server-side processing, in JS, means that JS needs to be able to do what, previously, languages that could properly handle decimals used to do. Moreover, whether frontend or backend, a JS-in-the-middle setup means that data exchange is critical. A JS application may have direct interaction with decimal types in (e.g.) PostgreSQL or MongoDB and need to preserve precision when reading/writing data, along with consistent handling of measurements across storage and application layers.

### 3. Modern Development Practices

Contemporary software practices are pushing more responsibility to JavaScript. Edge computing, for instance, means that calculations are moving closer to the user. In microservice architectures, there is an increased need for data fidelity as data moves among many systems.

- Measurement processing in distributed systems

## Implementation Considerations

### Internationalization

Both classes integrate with JavaScript's internationalization APIs:

- `Intl.NumberFormat` for number formatting
- `Intl.PluralRules` for unit pluralization
- Locale-aware unit conversion

### Performance

The fixed 128-bit representation allows for efficient implementation:

- Predictable memory usage (all values are 128 bits)
- Potential hardware acceleration (though this remains rare)
- Well-understood performance characteristics, even in the face of complex calculations

### Limitations

We do not argue that Decimal128, whether normalized or not, is an ideal solution. That title, perhaps, resides with rational numbers, but exponential growth of numerator and denominator, possibly moderated by repeated greated common divisor applications, makes rational numbrers a heavy solution.

- Maximum precision of 34 decimal digits (this is enough for a very large range of use cases, but some use cases for even more digits are conceivable)
- No direct support for arbitrary-precision calculations
- Unit conversion limited to known unit types (we wish to follow those appearing in units.xml, as well as known currencies)

## Open questions

- If we allow Decimal objects to be used to construct measures, what should we do with data like NaN, -0, and infinities (which will be supported by Decimal)?
