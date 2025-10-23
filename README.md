# Ecma TC39 JavaScript Decimal proposal

The TC39 Decimal proposal aims to add functionality to JavaScript to represent base-10 decimal numbers.

The champions welcome your participation in discussing the design space in the issues linked above. **We are seeking input for your needs around JavaScript decimal in [this survey](https://forms.gle/A2YaTr3Tn1o3D7hdA).**

**Champions**:

- Jesse Alama (Igalia)
- Jirka Maršík (Oracle)
- Andrew Paprocki (Bloomberg)

**Authors**: Jesse Alama, Waldemar Horwat

**Stage**: Stage 1 of [the TC39 process](https://tc39.github.io/process-document/). A [draft specification](http://tc39.es/proposal-decimal/) is available.

## Use cases and goals

Accurate storage and processing of base-10 decimal numbers is a frequent need in JavaScript. Currently, developers sometimes represent these using libraries for this purpose, or sometimes use Strings. Sadly, JavaScript Numbers are also sometimes used, leading to real, end-user-visible rounding
errors.

What’s the issue? Why aren’t JS Numbers good enough? In what sense are they not “exact”? How is it possible that JavaScript's Numbers get something wrong, and have been getting it wrong for so long?

As currently defined in JavaScript, Numbers are 64-bit binary floating-point numbers. The conversion from most decimal values to binary floats rarely is an exact match. For instance: the decimal number 0.5 can be exactly represented in binary, but not 0.1; in fact, the the 64-bit floating point number corresponding to 0.1 is actually 0.1000000000000000055511151231257827021181583404541015625. Same for 0.2, 0.3, … Statistically, most human-authored decimal numbers cannot be exactly represented as a binary floating-point number (AKA float).

The goal of the Decimal proposal is to add support to the JavaScript standard library for decimal numbers in a way that provides good ergonomics and functionality. JS programmers should feel comfortable using decimal numbers, when those are appropriate. Being built-in to JavaScript means that we will get optimizable, well-maintained implementations that don’t require transmitting, storing, or parsing and jit-optimizing every additional JavaScript code.

### Primary use case: Representing human-readable decimal values such as money

Many currencies tend to be expressed with decimal quantities. Although it’s possible to represent money as integer “cents” (multiply all quantities by 100), this approach runs into a couple of issues:

- There’s a persistent mismatch between the way humans think about money and the way it’s manipulated in the program, causing mental overhead for the programmer aware of the issue.
  - Some programmers may not even be aware of this mismatch. This opens the door to rounding errors whose source is unknown. If calculations start to get more involved, the chance of error increases.
- Different currencies use different numbers of decimal positions which is easy to get confused; the hack of working with quantities that are implicitly multiplied by 100 may not work when working with multiple currencies. For instance, it’s not correct to assume that all currencies have two decimal places, or that the only exception is JPY (Japanese yen); making such assumptions will make it hard to internationalize code to new countries. For this reason, it’s ideal if the number of decimal places is part of the data type.
- In various contexts (e.g., presenting a quantity to the end user), the decimal point needs to be brought back in somehow. For example, `Intl.NumberFormat` only knows how to format JS Numbers, and can’t deal with an integer-and-exponent pair.
- Sometimes, fractional cents need to be represented too (e.g., as precise prices that occur, for instance, in stock trading or currency conversion).

#### Sample code

In the examples that follow, we'll use `Decimal` objects.

##### Add up the items of a bill, then add sales tax

```js
function calculateBill(items, tax) {
  let total = new Decimal(0);
  for (let { price, count } of items) {
    total = total.add(new Decimal(price).times(new Decimal(count)));
  }
  return total.multiply(tax.add(new Decimal(1)));
}

let items = [
  { price: "1.25", count: 5 },
  { price: "5.00", count: 1 },
];
let tax = new Decimal("0.0735");
let total = calculateBill(items, tax);
console.log(total.toFixed(2));
```

##### Currency conversion

Let's convert USD to EUR, given the exchange rate EUR --> USD.

```js
let exchangeRateEurToUsd = new Decimal(1.09);
let amountInUsd = new Decimal(450.27);
let exchangeRateUsdToEur = new Decimal(1).divide(exchangeRateEurToUsd);

let amountInEur = exchangeRateUsdToEur.multiply(amountInUsd);
console.log(amountInEur.round(2).toString());
```

Here's the same example, this time using `Decimal.Amount`
and `Intl.NumberFormat` to properly handle currency:

```js
let exchangeRateEurToUsd = new Decimal(1.09);
let amountInUsd = new Decimal(450.27);
let exchangeRateUsdToEur = new Decimal(1).divide(exchangeRateEurToUsd);
let amountInEur = exchangeRateUsdToEur.multiply(amountInUsd);
let opts = { style: "currency", currency: "EUR" };
let formatter = new Intl.NumberFormat("en-US", opts);
let amount = Decimal.Amount(amountInEur).with({ fractionDigits: 2 });
console.log(formatter.format(amount));
```

##### Format decimals with Intl.NumberFormat

We propose a `Decimal.Amount` object to store a Decimal value together with precision information. This is especially useful in formatting Decimal values, especially in internationalization and localization contexts.

```js
let a = Decimal.Amount.from("1.90").with({ fractionDigits: 4 });
const formatter = new Intl.NumberFormat("de-DE");
formatter.format(a); // "1,9000"
```

#### Why use JavaScript for this case?

Historically, JavaScript may not have been considered a language where exact decimal numbers are even exactly representable, with the understanding that doing calculations is bound to propagate any initial rounding errors when numbers were created. In some application architectures, JS only deals with a string representing a human-readable decimal quantity (e.g, `"1.25"`), and never does calculations or conversions. However, several trends push towards JS’s deeper involvement in with decimal quantities:

- **More complicated frontend architectures**: Rounding, localization or other presentational aspects may be performed on the frontend for better interactive performance.
- **Serverless**: Many Serverless systems use JavaScript as a programming language in order to better leverage the knowledge of frontend engineers.
- **Server-side programming in JavaScript**: Systems like Node.js and Deno have grown in popularity to do more traditional server-side programming in JavaScript.

In all of these environments, the lack of decimal number support means that various workarounds have to be used (assuming, again, that programmers are even aware of the inherent mismatch between JS’s built-in binary floating-point numbers and proper decimal numbers):

- An external library could be used instead (introducing issues about choosing the library, coordinating on its use).
- Calculations could be in terms of “cents” (fallible, as explained above)
- In some cases, developers end up using Number anyway, aware of its inherent limitations or believing it to be mostly safe, but in practice causing bugs, even if tries take care of any issues involving rounding or non-exact conversions from decimals to binary floats

In other words, with JS increasingly being used in contexts and scenarios where it traditionally did not appear, the need for being able to natively handle basic data, such as decimal numbers, that other systems already natively handle is increasing.

#### Goals implied by the main use cases

This use case implies the following goals:

- Avoid unintentional rounding that causes user-visible errors
- Basic mathematical functions such as addition, subtraction, multiplication, and division
- Sufficient precision for typical money and other human-readable quantities, including cryptocurrency (where many decimal digits are routinely needed)
- Conversion to a string in a locale-sensitive manner
- Sufficient ergonomics to enable correct usage
- Be implementable with adequate performance/memory usage for applications
- (Please file an issue to mention more requirements)

### Secondary use case: Data exchange

In both frontend and backend settings, JavaScript is used to communicate with external systems, such as databases and foreign function interfaces to other programming languages. Many external systems already natively support decimal numbers. In such a setting, JavaScript is then the lower common denominator. With decimals in JavaScript, one has the confident that the numeric data one consumes and produces is handled exactly.

#### Why use JavaScript for this case?

JavaScript is frequently used as a language to glue other systems together, whether in client, server or embedded applications. Its ease of programming and embedding, and ubiquity, lend itself to this sort of use case. Programmers often don’t have the option to choose another language. When decimals appear in these contexts, it adds more burden on the embedder to develop an application-specific way to handle things; such specificity makes things less composable.

#### Goals implied by the use case

This use case implies the following goals:

- Basic mathematical functions such as `+`, `-`, `*` should be available
- Sufficient precision for these applications (unclear how high--would require more analysis of applications)
- Be implementable with adequate performance/memory usage for applications
- -0 (minus zero), NaN, and (positive and negative) infinity may be useful here and exposed as such, rather than throwing exceptions, to continue work in exceptional conditions
- (Please file an issue to mention more requirements)

Interaction with other systems brings the following requirements:

- Ability to round-trip decimal quantities from other systems
- Serialization and deserialization in standard decimal formats, e.g., IEEE 754’s multiple formats
- Precision sufficient for the applications on the other side

The `Decimal.Amount` class also helps with data exchange, in cases where one needs to preserve all digits—including any trailing zeroes—in a digit string coming over the wire. That is, the `Decimal.Amount` class contains more information that a mathematical value.

#### Sample code

##### Configure a database adapter to use JS-native decimals

The following is fictional, but illustrates the idea. Notice the `sql_decimal` configuration option and how the values returned from the DB are handled in JS as Decimal values, rather than as strings or as JS `Number`s:

```js
const { Client } = require("pg");

const client = new Client({
  user: "username",
  sql_decimal: "decimal", // or 'string', 'number'
  // ...more options
});

const boost = new Decimal("1.05");

client.query("SELECT prices FROM data_with_numbers", (err, res) => {
  if (err) throw err;
  console.log(res.rows.map((row) => row.prices.times(boost)));
  client.end();
});
```

### Tertiary use case: Numerical calculations on more precise floats

If it works out reasonably to provide for it within the same proposal, it would also be nice to provide support for higher-precision applications of floating point numbers.

If Decimal is arbitrary-precision or supports greater precision than Number, it may also be used for applications which need very large floating point numbers, such as astronomical calculations, physics, or even certain games. In some sense, larger or arbitrary-precision binary floats (as supported by [QuickJS](https://bellard.org/quickjs/), or IEEE 754 128-bit/256-bit binary floats) may be more efficient, but Decimal may also be suitable if the need is ultimately for human-consumable, and reproducible, calculations.

### Language design goals

In addition to the goals which come directly from use cases mentioned above:

- Well-defined semantics, with the same result regardless of which implementation and context a piece of code is run in
- Build a consistent story for numerics in JavaScript together with Numbers, BigInt, operator overloading, and
  potential future built-in numeric types
- No global mutable state involved in operator semantics; dynamically scoped state also discouraged
- Ability to be implemented across all JavaScript environment (e.g., embedded, server, browser)

### Interactions with other parts of the web platform

If Decimal becomes a part of standard JavaScript, it may be used in some built-in APIs in host environments:

- For the Web platform:
  ([#4](https://github.com/tc39/proposal-decimal/issues/4))
  - HTML serialization would support Decimal, just as it supports BigInt, so Decimal could be used in `postMessage`, `IndexedDB`, etc.
- For WebAssembly, if WebAssembly adds IEEE 64-bit and/or 128-bit decimal scalar types some day, then the WebAssembly/JS API could introduce conversions along the boundary, analogous to [WebAssembly BigInt/i64 integration](https://github.com/WebAssembly/JS-BigInt-integration)

More host API interactions are discussed in [#5](https://github.com/tc39/proposal-decimal/issues/5).

## Prior Art

Adding decimal arithmetic would not be an instance of JS breaking new ground. Many major programming languages have recognized that decimal arithmetic is fundamental enough to include in the standard library, if not as a primitive type.

### Decimal Support Across Languages

| Language | Type Name | Location | Year Added | Notes |
|----------|-----------|----------|------------|-------|
| Python | `decimal.Decimal` | Standard library | 2003 (Python 2.3) | Based on [General Decimal Arithmetic Specification](http://speleotrove.com/decimal/) |
| Java | `java.math.BigDecimal` | Standard library | 1998 (JDK 1.1) | Arbitrary precision, widely used for financial calculations |
| C# | `decimal` | Primitive type | 2000 (C# 1.0) | 128-bit decimal type, first-class language support |
| Swift | `Decimal` (formerly `NSDecimalNumber`) | Foundation framework | 2016 (Swift 3.0) | Standard library type for financial calculations |
| Ruby | `BigDecimal` | Standard library | 1999 (Ruby 1.6) | Arbitrary precision decimal arithmetic |

SQL also has `NUMERIC`/`DECIMAL` as a built-in type, predating many programming languages.

Many languages added decimal support 10+ years ago. The IEEE 754-2008 standard for Decimal128 is now 17 years old. (The 2019 edition of IEEE 754 also has decimal arithmetic.)
 Indeed, multiple numeric types are not unusual. Languages ship with integers, floats, *and* decimals. Python even includes both decimals and rationals. The existence of JS's `Number` and `BigInt` doesn't preclude `Decimal`. Moreover, the need for decimal types across many languages reflects a genuine, universal need rather than a niche requirement.

### Why JavaScript Lacks Decimal Support

JavaScript's origins as a lightweight browser scripting language meant it initially shipped with minimal numeric support (just IEEE 754 binary floats). However, JavaScript's role has fundamentally changed:

- **Then (1995)**: Simple form validation and DOM manipulation
- **Now (2025)**: Full-stack applications, financial systems, e-commerce platforms, serverless backends, data processing pipelines

The language has evolved to meet modern needs (adding `BigInt`, `async`/`await`, modules, etc.), but decimal arithmetic remains a critical gap.

### The Cost of Not Having Decimal

Because JavaScript lacks native decimal support, developers have created numerous userland solutions:

- [**decimal.js**](https://www.npmjs.com/package/decimal.js): ~2M weekly npm downloads
- [**bignumber.js**](https://www.npmjs.com/package/bignumber.js): ~800K weekly npm downloads
- [**big.js**](https://www.npmjs.com/package/big.js): ~500K weekly npm downloads

There are also money-specific libraries such as [dinero.js](https://www.npmjs.com/package/dinero.js) with about 180K weekly NPM downloads.

Each implementation has slightly different semantics, requires coordination across libraries, adds to total bundle size, presumably performs worse than native implementations could, and creates interoperability challenges.

Compare this to BigInt: before native support, polyfills and userland big integer libraries had minimal adoption because the *need* was niche. Decimal libraries show massive adoption because the need is universal.

Thus, Decimal standardizes existing practice. Developers are already using decimal libraries (millions of downloads/week), converting numbers to "cents" (error-prone, confusing), using `Number` incorrectly (causing bugs). Decimal doesn't ask developers to adopt something new; it offers a better way to do what they're already struggling to do.

## Specification and standards

Based on feedback from JS developers, engine implementors, and the members of the TC39 committee, we have a concrete proposal. Please see the [spec text](https://github.com/tc39/proposal-decimal/blob/main/spec.emu) ([HTML version](https://github.com/tc39/proposal-decimal/blob/main/spec.emu)). are provided below. You’re encouraged to join the discussion by commenting on the issues linked below or [filing your own](https://github.com/tc39/proposal-decimal/issues/new).

We will use the **Decimal128** data model for JavaScript decimals. Decimal128 is not a new standard; it was added to the IEEE 754 floating-point arithmetic standard in 2008 (and is present in the 2019 edition of IEEE 754, which JS normatively depends upon). It represents the culmination of decades of research on decimal floating-point numbers. Values in the Decimal128 universe take up 128 bits. In this representation, up to 34 significant digits (that is, decimal digits) can be stored, with an exponent (power of ten) of +/- 6143.

In addition to proposing a new `Decimal` class, we propose a `Decimal.Amount` class for storing a Decimal number together with a precision. The `Decimal.Amount` class is important mainly for string formatting purposes, where one desires to have a notion of a number that “knows” how precise it is. We do not intend to support arithmetic on `Decimal.Amount` values, the thinking being that `Decimal` already supports arithmetic.

### Known alternatives

#### Unlimited precision decimals (AKA "BigDecimal")

The "BigDecimal" data model is based on unlimited-size decimals (no fixed bith-width), understood exactly as mathematical values.

From the champion group’s perspective, both BigDecimal and Decimal128 are both coherent, valid proposals that would meet the needs of the primary use case. Just looking at the diversity of semantics in other programming languages, and the lack of practical issues that programmers run into, shows us that there are many workable answers here.

Operators always calculate their exact answer. In particular, if two BigDecimals are multiplied, the precision of the result may be up to the _sum_ of the operands. For this reason, `BigDecimal.pow` takes a mandatory options object, to ensure that the result does not go out of control in precision.

One can conceive of an arbitrary-precision version of decimals, and we have explored that route; historical information is available at [bigdecimal-reference.md](./bigdecimal-reference.md).

One difficulty with BigDecimal is that division is not available as a two-argument function because a rounding parameter is, in general, required. A `BigDecimal.div` function would be needed, where some options would be mandatory. See [#13](https://github.com/tc39/proposal-decimal/issues/13) for further discussion of division in BigDecimal.

Further discussion of the tradeoffs between BigDecimal and Decimal128 can be found in [#8](https://github.com/tc39/proposal-decimal/issues/8).

#### Fixed-precision decimals

Imagine that every decimal number has, say, ten digits after the decimal point. Anything requiring, say, eleven digits after the decimal point would be unrepresentable. This is the world of fixed-precision decimals. The number ten is just an example; some research would be required to find out what a good number would be. One could even imagine that the precision of such numbers could be parameterized.

#### Rational numbers

Rational numbers, AKA fractions, offer an adjacent approach to decimals. From a mathematical point of view, rationals are more expressive than decimals: every decimal is a kind of fraction (a signed integer divided by a power of ten), whereas some rationals, such as 1/3, cannot be (finitely) represented as decimals. So why not rationals?

- The size of the numerators and denominators, in general, grows exponentially as one carries out operations. Performing just one multiplication or division will in general cause the size of the parts of the rational to be multiplied. Even addition and subtraction cause rapid growth. This means that a heavy cost is paid for the precision offered by rationals.
- One must be vigilant about normalization of numerators and denominators, which involves repeatedly computing GCDs, dividing numerator and denominator by them, and continuing. The alternative to this is to not canonicalize rationals, canonicalize after, say, every five arithmetical operations, and so on. This can be an expensive operation, certainly much more expensive than, say, normalizing "1.20" to "1.2".
- Various operations, such as exponentiation and logarithm, almost never produce rational numbers given a rational argument, so one would have to specify a certain amount of precision as a second argument to these operations. By contrast, in, say, Decimal128, these operations do not require a second argument.

Fractions would be an interesting thing to pursue in TC39, and are in many ways complementary to Decimal. The use cases for rationals overlap somewhat with the use cases for decimals. Many languages in the Lisp tradition (e.g., [Racket](https://docs.racket-lang.org/guide/numbers.html)) include rationals as a basic data type, alongside IEEE 754 64-bit binary floating point numbers; Ruby and Python also include fractions in their standard library.

We see rationals as complementary to Decimal because of a mismatch when it comes to two of the core operations on Decimals:

- Rounding to a certain base-10 precision, with a rounding mode
- Conversion to a localized, human-readable string

These _could_ be defined on rationals, but are a bit of an inherent mismatch since rationals are not base 10.

Rational may still make sense as a separate data type, alongside Decimal. Further discussion of rationals in [#6](https://github.com/tc39/proposal-decimal/issues/6).

## Syntax and semantics

With Decimal we do not envision a new literal syntax. One could consider one, such as `123.456_789m` is a Decimal value ([#7](https://github.com/tc39/proposal-decimal/issues/7)), but we are choosing not to add new syntax in light of feedback we have received from JS engine implementors as this proposal has been discussed in multiple TC39 plenary meetings.

### Data model

Decimal is based on IEEE 754-2019 Decimal128, which is a standard for base-10 decimal numbers using 128 bits. We will offer a subset of the official Decimal128. There will be, in particular:

- a single NaN value--distinct from the built-in `NaN` of JS. The difference between quiet and singaling NaNs will be collapsed into a single (quiet) Decimal NaN.
- positive and negative infinity will be available, though, as with `NaN`, they are distinct from JS's built-in `Infinity` and `-Infinity`.

Decimal canonicalizes when converting to strings and after performing arithmetic operations. This means that Decimals do not expose information about trailing zeroes. Thus, "1.20" is valid syntax, but there is no way to distinguish 1.20 from 1.2. This is an important omission from the capabilities defined by IEEE 754 Decimal128. The `Decimal.Amount` class can be used to store an exact decimal value together with precision (number of significant digits), which can be used to track all digits of a number, including any trailing zeroes (which Decimal canonicalizes away).

The `Decimal.Amount` class will not support arithmetic or comparisons. Such operations should be delegated to the underlying Decimal value wrapped by a `Decimal.Amount`.

### Operator semantics

- Arithmetic
  - Unary operations
    - Absolute value
  - Negation
  - Binary operations
    - Addition
  - Multiplication
  - Subtraction
  - Division
  - Remainder
- Rounding: All five rounding modes of IEEE 754—floor, ceiling, truncate, round-ties-to-even, and round-ties-away-from-zero—will be supported.
  - (This implies that a couple of the rounding modes in `Intl.NumberFormat` and `Temporal` won't be supported.)
- Comparisons
  - equals and not-equals
  - less-than, less-than-or-equal
  - greater-than, greater-than-or-equal
- Mantissa, exponent, significand

The library of numerical functions here is kept deliberately minimal. It is based around targeting the primary use case, in which fairly straightforward calculations are envisioned. The secondary use case (data exchange) will involve probably little or no calculation at all. For the tertiary use case of scientific/numerical computations, developers may experiment in JavaScript, developing such libraries, and we may decide to standardize these functions in a follow-on proposal; a minimal toolkit of mantissa, exponent, and significand will be available. We currently do not have good insight into the developer needs for this use case, except generically: square roots, exponentiation & logarithms, and trigonometric functions might be needed, but we are not sure if this is a complete list, and which are more important to have than others. In the meantime, one can use the various functions in JavaScript’s `Math` standard library.

### Unsupported operations

- Bitwise operators are not supported, as they don’t logically make sense on the Decimal domain ([#20](https://github.com/tc39/proposal-decimal/issues/20))
- We currently do not foresee Decimal values interacting with other Number values. That is, TypeErrors will be thrown when trying to add, say, a Number to a Decimal, similar to the situation with BigInt and Number. ([#10](https://github.com/tc39/proposal-decimal/issues/10)).

### Conversion to and from other data types

Decimal objects can be constructed from Numbers, Strings, and BigInts. Similarly, there will be conversion from Decimal objects to Numbers, String, and BigInts.

### String formatting

`Decimal` objects can be converted to Strings in a number of ways, similar to Numbers:

- `toString()` is similar to the behavior on Number, e.g., `new Decimal("123.456").toString()` is `"123.456"`. ([#12](https://github.com/tc39/proposal-decimal/issues/12))
- `toFixed()` is similar to Number's `toFixed()`
- `toPrecison()` is similar to Number's `toPrecision()`
- `toExponential()` is similar to Number's `toExponential()`
- `Intl.NumberFormat.prototype.format` should transparently support Decimal ([#15](https://github.com/tc39/proposal-decimal/issues/15)), which will be handled via `Decimal.Amount` objects
- `Intl.PluralRules.prototype.select` should similarly support Decimal, in that it will support `Decimal.Amount` objects

In addition, the `Decimal.Amount` object will provide a `toString` method, which will render its underlying Decimal value according to its underlying precision.

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

The vision of decimal sketched here represents the champions current thinking and goals. In our view, decimal as sketched so far is a valuable addition to the language. That said, we envision improvements and strive to achieve these, too, in a version 2 of the proposal. What follows is _not_ part of the proposal as of today, but we are working to make the first version compatible with these future additions.

### Arithmetic operator and comparison overloading

In earlier discussions about decimal, we advocated for such overloading arithmetic operations (`+`, `*`, etc.) and comparisons (`==,` `<`, etc.), as well as `===`. But based on strong implementer feedback, we have decided to work with the following proposal:

- In the first version of this proposal, we intend to make `+`, `*`, and so on throw when either argument is a decimal value. Instead, one will have to use the `add`, `multiply`, etc. methods. Likewise, comparison operators such as `==`, `<`, `<=`, etc. will also throw when either argument is a decimal. One should use the `equals` and `lessThan` methods instead.
- The strict equality operator `===` will work (won't throw an exception), but it will have its default object semantics; nothing special about decimal values will be involved.

However, the door is not _permanently_ closed to overloading. It is just that the bar for adding it to JS is very high. We may be able to meet that bar if we get enough positive developer feedback and work with implementors to find a path forward.

### Decimal literals

In earlier discussions of this proposal, we had advocated for adding new decimal literals to the language: `1.289m` (notice the little `m` suffix). Indeed, since decimals are numbers—essentially, basic data akin to the existing binary floating-point numbers—it is quite reasonable to aim for giving them their own "space" in the syntax.

However, as with operator overloading, we have received strong implementor feedback that this is very unlikely to happen.

Nonetheless, we are working on making sure that the v1 version of the proposal, sketched here, is compatible with a future in which decimal literals exist. As with operator overloading, discussions with JS engine implementors need to be kept open to find out what can be done to add this feature. (On the assumption that a v1 of decimals exists, one can add support for literals fairly straightforwardly using a Babel transform.)

### Advanced mathematical functions

In our discussions we have consistently emphasized the need for basic arithmetic. And in the v1 of the proposal, we in fact stop there. One can imagine Decimal having all the power of the `Math` standard library object, with mathematical functions such as:

- trigonometric functions (normal, inverse/arc, and hyperbolic combinations)
- natural exponentiation and logarithm
- any others?

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

- Experimental implementation in [QuickJS](https://bellard.org/quickjs/), from release 2020-01-05 (use the `--bignum` flag)
- [decimal128.js](https://www.npmjs.com/package/decimal128) is an npm package that implements Decimal128 in JavaScript (more precisely, the variant of Decimal128 that we envision for this proposal)
- We are looking for volunteers for writing a polyfill along the lines of [JSBI](https://github.com/GoogleChromeLabs/jsbi) for both alternatives, see [#17](https://github.com/tc39/proposal-decimal/issues/17)

## Getting involved in this proposal

Your help would be really appreciated in this proposal! There are lots of ways to get involved:

- Share your thoughts on the [issue tracker](https://github.com/tc39/proposal-decimal/issues)
- Document your use cases, and write sample code with decimal, sharing it in an issue
- Research how decimals are used in the JS ecosystem today, and document what works and what doesn’t, in an issue
- Help us write and improve documentation, tests, and prototype implementations

See a full list of to-do tasks at [#45](https://github.com/tc39/proposal-decimal/issues/45).
