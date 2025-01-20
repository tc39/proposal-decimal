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

It is unclear whether `Decimal128` should support arithmetic. We envision it largely as a container for a number-and-unit, plus a precision. Although IEEE 754 does specify how the quanta of the arguments of mathematical operations determines the quantum of the result, it is difficult to understand these rules. On the one hand, one could provide these operations and simply follow IEEE 754, for the simple reason that IEEE 754 is a well-known standard. On the other hand, we believe that following these rules would be strange to JS programmers.

While this design offers more explicit control over precision and normalization, we opted for the two-class design because it has a simpler mental model (fewer types to learn and understand). Also, in the two-class approach, precision handling naturally belongs with measurement. The two-class approach has a reduced API surface area and fewer conversion paths, a clearer separation between mathematical values and measured quantities, and many use cases don't require the distinction between normalized and non-normalized decimal values outside of measurements.

That said, we don't consider these knock-down arguments. We are open to the three-class approach.

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

## Syntax and semantics

With Decimal we do not envision a new literal syntax. One could consider one, such as `123.456_789m` is a Decimal value ([#7](https://github.com/tc39/proposal-decimal/issues/7)), but we are choosing not to add new syntax in light of feedback we have received from JS engine implementors as this proposal has been discussed in multiple TC39 plenary meetings.

### Data model

Decimal is based on IEEE 754 Decimal128, which is a standard for base-10 decimal numbers using 128 bits. We will offer a subset of the official Decimal128. There will be, in particular:

+ a single NaN value--distinct from the built-in `NaN` of JS. The difference between quiet and singaling NaNs will be collapsed into a single Decimal NaN.
+ positive and negative infinity will be available, though, as with `NaN`, they are distinct from JS's built-in `Infinity` and `-Infinity`.

Decimal canonicalizes when converting to strings and after performing arithmetic operations. This means that Decimals do not expose information about trailing zeroes. Thus, "1.20" is valid syntax, but there is no way to distinguish 1.20 from 1.2. This is an important omission from the capabilities defined by IEEE 754 Decimal128.

### Operator semantics

+ Absolute value, negation, addition, multiplication, subtraction, division, and remainder are defined.
+ Bitwise operators are not supported, as they don’t logically make sense on the Decimal domain ([#20](https://github.com/tc39/proposal-decimal/issues/20))
+ rounding: All five rounding modes of IEEE 754—floor, ceiling, truncate, round-ties-to-even, and round-ties-away-from-zero—will be supported. (This implies that a couple of the rounding modes in `Intl.NumberFormat` and `Temporal` won't be supported.)
+ We currently do not foresee Decimal values interacting with other Number values.  Expect TypeErrors when trying to add, say, a Number to a Decimal, like for BigInt and Number. ([#10](https://github.com/tc39/proposal-decimal/issues/10)).

The library of numerical functions here is kept deliberately minimal. It is based around targeting the primary use case, in which fairly straightforward calculations are envisioned. The secondary use case (data exchange) will involve probably little or no calculation at all. For the tertiary use case of scientific/numerical computations, developers may experiment in JavaScript, developing such libraries, and we may decide to standardize these functions in a follow-on proposal. We currently do not have good insight into the developer needs for this use case, except generically: square roots, exponentiation & logarithms, and trigonometric functions might be needed, but we are not sure if this is a complete list, and which are more important to have than others. In the meantime, one can use the various functions in JavaScript’s `Math` standard library.

### Conversion to and from other data types

Decimal128 objects can be constructed from Numbers, Strings, and BigInts. Similarly, there will be conversion from Decimal128 objects to Numbers, String, and BigInts.

### String formatting

+ `toString()` is similar to the behavior on Number, e.g., `new Decimal128("123.456").toString()` is `"123.456"`. ([#12](https://github.com/tc39/proposal-decimal/issues/12))
+ `toFixed()` is similar to Number's `toFixed()`
+ `toPrecison()` is similar to Number's `toPrecision()`
+ `toExponential()` is similar to Number's `toExponential()`
+ `Intl.NumberFormat.prototype.format` should transparently support Decimal ([#15](https://github.com/tc39/proposal-decimal/issues/15))

## Past discussions in TC39 plenaries

- [Decimal for stage 0](https://github.com/tc39/notes/blob/main/meetings/2017-11/nov-29.md#9ivb-decimal-for-stage-0) (November, 2017)
- [BigDecimal for Stage 1](https://github.com/tc39/notes/blob/main/meetings/2020-02/february-4.md) (February, 2020)
- [Decimal update](https://github.com/tc39/notes/blob/main/meetings/2020-03/march-31.md) (March, 2020)
- [Decimal stage 1 update](https://github.com/tc39/notes/blob/main/meetings/2021-12/dec-15.md#decimals) (December, 2021)
- [Decimal stage 1 update](https://github.com/tc39/notes/blob/main/meetings/2023-03/mar-22.md#decimal-stage-1-update) (March, 2023)
- [Decimal open-ended discussion](https://github.com/tc39/notes/blob/main/meetings/2023-07/july-12.md#decimal-open-ended-discussion) (July, 2023)
- [Decimal stage 1 update and open discussion](https://github.com/tc39/notes/blob/main/meetings/2023-09/september-27.md#decimal-stage-1-update-and-discussion) (September, 2023)
- [Decimal stage 1 update and request for feedback](https://github.com/tc39/notes/blob/main/meetings/2023-11/november-27.md#decimal-stage-1-update--request-for-feedback) (November, 2023)
- [Decimal for stage 2](https://github.com/tc39/notes/blob/main/meetings/2024-04/april-11.md#decimal-for-stage-2) (April, 2024)
- [Decimal for stage 2](https://github.com/tc39/notes/blob/main/meetings/2024-06/june-13.md#decimal-for-stage-2) (June, 2024)

## Future work

The vision of decimal sketched here represents the champions current thinking and goals. In our view, decimal as sketched so far is a valuable addition to the language. That said, we envision improvements and strive to achieve these, too, in a version 2 of the proposal. What follows is *not* part of the proposal as of today, but we are working to make the first version compatible with these future additions.

### Arithmetic operator and comparison overloading

In earlier discussions about decimal, we advocated for such overloading arithmetic operations (`+`, `*`, etc.) and comparisons (`==,` `<`, etc.), as well as `===`.  But based on strong implementer feedback, we have decided to work with the following proposal:

+ In the first version of this proposal, we intend to make `+`, `*`, and so on throw when either argument is a decimal value. Instead, one will have to use the `add`, `multiply`, etc. methods.  Likewise, comparison operators such as `==`, `<`, `<=`, etc. will also throw when either argument is a decimal. One should use the `equals` and `lessThan` methods instead.
+ The strict equality operator `===` will work (won't throw an exception), but it will have its default object semantics; nothing special about decimal values will be involved.

However, the door is not *permanently* closed to overloading. It is just that the bar for adding it to JS is very high. We may be able to meet that bar if we get enough positive developer feedback and work with implementors to find a path forward.

### Decimal literals

In earlier discussions of this proposal, we had advocated for adding new decimal literals to the language: `1.289m` (notice the little `m` suffix). Indeed, since decimals are numbers—essentially, basic data akin to the existing binary floating-point numbers—it is quite reasonable to aim for giving them their own "space" in the syntax.

However, as with operator overloading, we have received strong implementor feedback that this is very unlikely to happen.

Nonetheless, we are working on making sure that the v1 version of the proposal, sketched here, is compatible with a future in which decimal literals exist. As with operator overloading, discussions with JS engine implementors need to be kept open to find out what can be done to add this feature. (On the assumption that a v1 of decimals exists, one can add support for literals fairly straightforwardly using a Babel transform.)

### Advanced mathematical functions

In our discussions we have consistently emphasized the need for basic arithmetic. And in the v1 of the proposal, we in fact stop there. One can imagine Decimal having all the power of the `Math` standard library object, with mathematical functions such as:

+ trigonometric functions (normal, inverse/arc, and hyperbolic combinations)
+ natural exponentiation and logarithm
+ any others?

These can be more straightforwardly added in a v2 of Decimal. Based on developer feedback we have already received, we sense that there is relatively little need for these functions. But it is not unreasonable to expect that such feedback will arrive once a v1 of Decimal is widely used.

## FAQ

### What about rational numbers?

See the discussion above, about data models, where rationals are discussed.

### Will Decimal have good performance?

This depends on implementations. Like BigInt, implementors
may decide whether or not to optimize it, and what scenarios
to optimize for. We believe that, with either alternative,
it is possible to create a high-performance Decimal
implementation. Historically, faced with a similar decision
of BigInt vs Int64, TC39 decided on BigInt; such a decision
might not map perfectly because of differences in the use
cases. Further discussion:
[#27](https://github.com/tc39/proposal-decimal/issues/27)

### Will Decimal have the same behavior across implementations and environments?

One option that’s raised is allowing for greater precision in more capable environments. However, Decimal is all about avoiding unintended rounding. If rounding behavior depended on the environment, the goal would be compromised in those environments. Instead, this proposal attempts to find a single set of semantics that can be applied globally.

### How does this proposal relate to other TC39 proposals like operator overloading?

See [RELATED.md](./RELATED.md) for details.

### Why not have the maximum precision or default rounding mode set by the environment?

Many decimal implementations support a global option to set the maximum precision (e.g., Python, Ruby). In QuickJS, there is a “dynamically scoped” version of this: the `setPrec` method changes the maximum precision while a particular function is running, re-setting it after it returns. Default rounding modes could be set similarly.

Although the dynamic scoping version is a bit more contained, both versions are anti-modular: Code does not exist with independent behavior, but rather behavior that is dependent on the surrounding code that calls it. A reliable library would have to always set the precision around it.

There is further complexity when it comes to JavaScript’s multiple globals/Realms: a Decimal primitive value does not relate to anything global, so it would be inviable to store the state there. It would have to be across all the Decimals in the system. But then, this forms a cross-realm communication channel.

Therefore, this proposal does not contain any options to set the precision from the environment.

### Where can I learn more about decimals in general?

Mike Cowlishaw’s excellent [Decimal FAQ](http://speleotrove.com/decimal/decifaq.html) explains many of the core design principles for decimal data types, which this proposal attempts to follow.

One notable exception is supporting trailing zeroes: Although Mike presents some interesting use cases, the Decimal champion group does not see these as being worth the complexity both for JS developers and implementors. Instead, Decimal values could be lossly represented as rationals, and are “canonicalized”.

## Relationship of Decimal to other TC39 proposals

This proposal can be seen as a follow-on to [BigInt](https://github.com/tc39/proposal-bigint/), which brought arbitrary-sized integers to JavaScript, and will be fully standardized in ES2020. However, unlike BigInt, Decimal (i) does not propose to intrduce a new primitive data type, (ii) does not propose operator overloading (which BigInt does support), and (iii) does not offer new syntax (numeric literla), which BigInt does add (e.g., `2345n`).

## Implementations

+ Experimental implementation in [QuickJS](https://bellard.org/quickjs/), from release 2020-01-05 (use the `--bignum` flag)
+ [decimal128.js](https://www.npmjs.com/package/decimal128) is an npm package that implements Decimal128 in JavaScript (more precisely, the variant of Decimal128 that we envision for this proposal)
+ We are looking for volunteers for writing a polyfill along the lines of [JSBI](https://github.com/GoogleChromeLabs/jsbi) for both alternatives, see [#17](https://github.com/tc39/proposal-decimal/issues/17)

## Getting involved in this proposal

Your help would be really appreciated in this proposal! There are lots of ways to get involved:

+ Share your thoughts on the [issue tracker](https://github.com/tc39/proposal-decimal/issues)
+ Document your use cases, and write sample code with decimal, sharing it in an issue
+ Research how decimals are used in the JS ecosystem today, and document what works and what doesn’t, in an issue
+ Help us write and improve documentation, tests, and prototype implementations

See a full list of to-do tasks at [#45](https://github.com/tc39/proposal-decimal/issues/45).
