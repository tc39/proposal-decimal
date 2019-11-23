# ECMAScript proposal: Arbitrary-precision decimal numbers in JavaScript

The BigDecimal proposal would add a new primitive type in JavaScript, analogous to BigInt, for arbitrarily-precise, base-10 decimal numbers.

**Champions**: Daniel Ehrenberg (Igalia), Andrew Paprocki (Bloomberg)

**Stage**: Stage 0 of [the TC39 process](https://tc39.github.io/process-document/).

## Motivation

Accurate storage and processing of base-10 decimal numbers is a frequent need in JavaScript. Currently, developers sometimes represent these using libraries for this purpose, or sometimes use Strings. Sadly, JavaScript Numbers are also sometimes used, leading to real, end-user-visible rounding errors.

The goal of the BigDecimal proposal is to add a decimal type to the JavaScript standard library, in a way that provides such good ergonomics, functionality and performance that people feel comfortable using it when it's appropriate. Being built-in to JavaScript means that we will get optimizable, well-maintained implementations that don't require transmitting, storing or parsing additional JavaScript code.

### Interchange or calculations with money or other decimal quantities

Many currencies tend to be expressed with decimal quantities. Although it's possible represent money as integer "cents", this approach runs into a couple issues:
- There's a persistent mismatch between the way humans think about money and the way it's manipulated in the program, causing mental overhead for the programmer.
- Different currencies use different numbers of decimal positions which is easy to get confused. (It's not correct to assume that all currencies have two decimal places, or that the only exception is JPY; making such assumptions will make it hard to internationalize your code to new countries.) For this reason, it's ideal if the number of decimal places is part of the data type.
- In various contexts (e.g., presenting the quantity to the end user), the fractionality needs to be brought back in somehow. For example, `Intl.NumberFormat` only knows how to format Numbers, and can't deal with an integer + exponent pair.
- Sometimes, fractional cents need to be represented, too (e.g., as precise prices).

(TODO: Add example code here. PRs welcome!)

### Calculations requiring high-precision floats

If BigDecimal is aribitrary-precision, it may also be used for applications which need very large floating point numbers, such as astronomical calculations, physics, or even certain games. In some sense, larger or arbitrary-precision binary floats (as supported by [QuickJS](https://bellard.org/quickjs/), or IEEE 754 128-bit/256-bit binary floats) may be more efficient, but BigDecimal should also work.

### Possible JS host environment interaction with BigDecimal

If BigDecimal becomes a part of standard JavaScript, it may be used in some built-in APIs in host environments:
- For the Web platform: ([#4](https://github.com/littledan/proposal-bigdecimal/issues/4))
    - HTML serialization would support BigDecimal, just as it supports BigInt, so BigDecimal could be used in `postMessage`, `IndexedDB`, etc.
    - In [WebPayments](https://web-payments.org/), the transaction amount is generally represented as a string. Although strings will need to be used forever in JSON contexts, some APIs may also introduce a way to be used with BigDecimal.
- For WebAssembly, if WebAssembly adds IEEE 64-bit and/or 128-bit decimal scalar types some day, then the WebAssembly/JS API could introduce conversions along the boundary, analogous to [WebAssembly BigInt/i64 integration](https://github.com/WebAssembly/JS-BigInt-integration)

More host API interactions are discussed in [#5](https://github.com/littledan/proposal-bigdecimal/issues/5).

## Rationale: Why BigDecimal and not some other type?

Overall, Mike Cowlishaw's excellent [Decimal FAQ](http://speleotrove.com/decimal/decifaq.html) explains many of the core design principles for decimal data types, which this proposal attempts to follow.

### Rational fractions

Many languages in the Lisp tradition include fractions of arbitrary-size integers as a basic data type, alongside IEEE-754 64-bit binary floating point numbers. We're not proposing fractions as a built-in type for JavaScript right now for a couple reasons:
- **Logically matching the problem domain**: When working with human-written/read decimals, a data type which represents just that is more logical. Common operations like rounding has intuitive meaning on a decimal data type, but are a bit of a mismatch for rationals (even if they can be well-defined).
- **Efficiency**: Simple operations like addition of fractions requires use of a greatest-common-denominator (GCD) algorithm to normalize the fraction. At the same time, even with that, the denominator can get pretty big with just a few operations if care isn't taken.
- **Still limited expressiveness**: Rationals still cannot express most polynomial or trigonometric values, so the exactness benefits still fall away in most cases. It's not clear how often practical programs actually need preciseness in fractions but not those other issues.

Rational may still make sense as a separate data type, alongside BigDecimal. Further discussion of rationals in [#6](https://github.com/littledan/proposal-bigdecimal/issues/6).

### Fixed-precision decimal

JavaScript is a high-level language, so it would be optimal to give JS programmers a high-level data type that makes sense logically for their needs, as TC39 did for BigInt, rather than focusing on machine needs. At the same time, many high-level programming languages with decimal data types just include a fixed precision. Because many languages added decimal data types before IEEE standardized one, there's a big variety of different choices that different systems have made.

We haven't seen examples of programmers running into practical problems due to rounding from fixed-precision decimals (across various programming languages that use different details for their decimal representation). This makes IEEE 128-bit decimal seem attractive. Decimal128 would solve certain problems, such as giving a well-defined point to round division to (simply limited by the size of the type).

However, we're proposing unlimited-precision decimal instead, for the following reasons:
- Ideally, JavaScript programmers shouldn't have to think too much about arbitrary limits, or worry about whether these limits will implicitly cause rounding/loss of precision.
- Thinking about Decimal for interchange/processing of values that come from elsewhere: the fact that many other systems support bigger decimal quantities means that, if we limited ourselves here, we wouldn't be able to use the JS Decimal type to model them.
- Certain use cases benefit from being able to do calculations on very large decimals/floats. If Decimal did not provide these, they could drive demand for a separate data type, adding more global complexity.
- In JavaScript, it would be inviable to use global flags (as Python does), or to generate many different types (as SQL does), to allow configuration of different precisions, as this contrasts with the way primitive types tend to work.

Further discussion of fixed-precision decimal is in [#8](https://github.com/littledan/proposal-bigdecimal/issues/8).

## Early draft syntax and semantics

With this proposal at Stage 0, details are nowhere near nailed down. However, for concreteness, some initial possible details are provided below. You're encouraged to join the discussion by commenting on the issues linked below or [filing your own](https://github.com/littledan/proposal-bigdecimal/issues/new).

BigDecimal is generally analogous to BigInt, complete with:
- Literal syntax: `123.456d` is a BigDecimal value ([#7](https://github.com/littledan/proposal-bigdecimal/issues/7))
- Operator overloading: `.1d + .2d === .3d`

Data model:
- BigDecimal represents a mathematical, "normalized" ([#26](https://github.com/littledan/proposal-bigdecimal/issues/26)) base 10 decimal, of unlimited size ([#8](https://github.com/littledan/proposal-bigdecimal/issues/8)).
    - For example, `2d` is exactly the same value as `2.00d` ([#11](https://github.com/littledan/proposal-bigdecimal/issues/11))
    - If trailing zeroes or other kinds of magnitude/precision need to be represented separately from the BigDecimal
    - There is no Infinity, -0, NaN, etc; error cases lead to exceptions, just like BigInt, and `-0d` is `0d` ([#9](https://github.com/littledan/proposal-bigdecimal/issues/9))
- A new primitive type, not an object: `typeof 1d === "bigdecimal"`
    - There can still be methods on `BigDecimal.prototype` due to the magic of wrappers, just like Number.

Operator semantics:
- Operators which can be calculated exactly are defined to return their exact answer (`+`, `-`, `*`, `%`, etc.) ([#10](https://github.com/littledan/proposal-bigdecimal/issues/10))
- Operators which would need to round instead have methods to support them, described below ([#13](https://github.com/littledan/proposal-bigdecimal/issues/13))
- Bitwise operators are not supported, as they don't logically make sense on the BigDecimal domain ([#20](https://github.com/littledan/proposal-bigdecimal/issues/20))
- Use explicit casts when you need to do a calculation involving different numerical types. Otherwise, a TypeError is thrown, like for BigInt+Number.
- Comparison with `===` compares two BigDecimals for mathematical equality, and returns false if comparison is with another type; comparison with `==`, `<`, etc can compare BigDecimal with any numerical type

BigDecimal methods for calculation: ([#14](https://github.com/littledan/proposal-bigdecimal/issues/14))
- `BigDecimal.prototype.round()` rounds a BigDecimal, based on an options bag with the following parameters:
    - `roundingMode`: Rounding mode, with exact set of values TBD, maybe including `"up"`, `"down"`, `"half-up"`, `"half-down"`, `"half-even"` (more?). There is no default; this must be explicitly provided
    - Exactly one of the two following options is required to indicate the precision to round to (names matching Intl.NumberFormat):
        - `maximumFractionDigits`: The maximum number of decimal places after the `.`
        - `maximumSignificantDigits`: The maximum number of significant digits
- `BigDecimal.prototype.div`, `BigDecimal.prototype.pow`: Takes two parameters: a BigDecimal (for the second operand) and a rounding mode
    - E.g., `1m.div(3m, { maximumFractionDigits: 2, roundingMode: "down" }) === .33m`
- `BigDecimal.prototype.partition(pieces, roundingOptions)` returns an Array of length `pieces` with the BigDecimal split as evenly as possible, based on the rounding options which indicate precision
- `BigDecimal64Array` and `BigDecimal128Array` (binary format implementation-defined to be one of the two IEEE formats, and then dataview methods take flag; ([#16](https://github.com/littledan/proposal-bigdecimal/issues/16)))
- Possible other methods: divmod? quantum? compareTotal? significantDigits/fractioDigits? sqrt? trig fns? (#xxx)

BigDecimal methods for string formatting:
- `BigDecimal.prototype.toString()` is similar to the behavior on Number, e.g., `123.456d.toString()` is `"123.456"`. ([#12](https://github.com/littledan/proposal-bigdecimal/issues/12))
- `toFixed`, `toExponential`, `toPrecision` methods analogous to Number methods
- Intl.NumberFormat.prototype.format transparently supports BigDecimal ([#15](https://github.com/littledan/proposal-bigdecimal/issues/15))
    - Intl.NumberFormat is extended to take a `roundingMode` option, which works on all numeric types

This whole proposal is basically a big open question, and we'd welcome your participation in discussing the design space in the issues linked above. We'd especially encourage you to help us answer these and other questions by [contributing documentation about use cases you care about](https://github.com/littledan/proposal-bigdecimal/issues/3).

## History and related work

The need for accurately representing decimal quantities is not new or unique to our current circumstances. That's why there are a number of popular JS ecosystem libraries for decimal, why many other programming languages, databases and standards have built-in data types for this purpose, and why TC39 has been considering adding Decimal for at least 12 years.

### Related JS ecosystem libraries

JavaScript programmers are using decimal data types today with various ecosystem libraries. The most popular three on npm are each by [MikeMcl](https://github.com/mikemcl):
- [decimal.js](http://mikemcl.github.io/decimal.js/)
- [big.js](https://mikemcl.github.io/big.js/)
- [bignumber.js](https://mikemcl.github.io/bignumber.js/)

These packages have some [interesting differences](https://github.com/MikeMcl/big.js/wiki), but there are also many similarities:
- APIs are based on JavaScript objects and method calls
- Rounding modes and precision limits are settings in the constructor
- Inherently rounding operations like sqrt, exponentiation, division are supported

The initial proposal in this document suggests some differences, described above.

We plan to investigate the experiences and feedback developers have had with these and other existing JavaScript librariesso that we can learn from them in the design of BigDecimal. The discussion continues in [#22](https://github.com/littledan/proposal-bigdecimal/issues/22).

### Related features in other systems

Due to the overwhelming evidence listed above that decimal is an important data type in programming, many different programming languages, databases and standards include decimal, rationals, or similar features. Below is a partial listing, with a summary of the semantics in each.

- Standards
    - **IEEE 754**-2008 and later: 32-bit, 64-bit and 128-bit decimal; see [explanation](https://en.wikipedia.org/wiki/Decimal_floating_point#IEEE_754-2008_encoding) (recommends against using 32-bit decimal)
    - (plus many of the below are standardized)
- Programming languages
    - Fixed-size decimals:
        - **[C](http://www.open-std.org/JTC1/SC22/WG14/www/docs/n1312.pdf)**: 32, 64 and 128-bit IEE 754 decimal types, with a global settings object. Still a proposal, but has a GCC implementation.
        - **[C++](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2014/n3871.html)**: Early proposal work in progress, to be based on IEEE 64 and 128-bit decimal. Still a proposal, but has a GCC implementation.
        - **[C#](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/decimal)**/**[.NET](https://msdn.microsoft.com/en-us/library/system.decimal(v=vs.110).aspx)**: Custom 128-bit decimal semantics with slightly different sizes for the mantissa vs exponent compared to IEEE.
        - **[Swift](https://developer.apple.com/documentation/foundation/decimal)**/**[Obj-C](https://developer.apple.com/documentation/foundation/nsdecimal?language=objc)**: Yet another custom semantics for fixed-bit-size floating point decimal.
    - Global settings for setting decimal precision
        - **[Python](https://docs.python.org/2/library/decimal.html)**: Decimal with global settings to set precision.
    - Rationals
        - **[Perl6](https://docs.perl6.org/type/Rat)**: Literals like `1.5` are Rat instances!
        - **[Common Lisp](http://www.lispworks.com/documentation/lw50/CLHS/Body/t_ratio.htm#ratio)**: Ratios live alongside floats; no decimal data type
        - **[Scheme](http://www.schemers.org/Documents/Standards/R5RS/HTML/r5rs-Z-H-9.html#%_sec_6.2)**: Analogous to Common Lisp, with different names for types (Racket is similar)
        - **[Ruby](https://ruby-doc.org/core-2.6.5/Rational.html)**: Rational class alongside BigDecimal.
    - Arbitrary-precision decimals (this proposal)
        - **[Ruby](https://ruby-doc.org/stdlib-2.4.0/libdoc/bigdecimal/rdoc/BigDecimal.html)**: Arbitrary-precision Decimal, alongside Rational.
        - **[PHP](http://php.net/manual/en/book.bc.php)**: A set of functions to bind to bc for mathematical calculations. An alternative community-driven [Decimal library](https://php-decimal.io/) is also available.
        - **[Java](https://docs.oracle.com/en/java/javase/13/docs/api/java.base/java/math/BigDecimal.html)**: Arbitrary-precision decimal based on objects and methods. Requires rounding modes and precision parameters for operations like division
- Databases
    - Decimal with precision configurable in the schema
        - [Microsoft SQL Server](https://docs.microsoft.com/en-us/sql/t-sql/data-types/decimal-and-numeric-transact-sql)
        - [PostgreSQL](https://www.postgresql.org/docs/9.1/static/datatype-numeric.html)
        - [MySQL](https://dev.mysql.com/doc/refman/5.7/en/precision-math-decimal-characteristics.html)
    - IEEE 754-2008 decimal
        - Bloomberg's [comdb2](https://bloomberg.github.io/comdb2/decimals.html)
        - [MongoDB](https://docs.mongodb.com/manual/core/shell-types/#shell-type-decimal)
- Libraries
    - Intel C [inteldfp](https://software.intel.com/en-us/articles/intel-decimal-floating-point-math-library): IEEE decimal
    - Bloomberg C++ [bdldfp](https://github.com/bloomberg/bde/blob/master/groups/bdl/bdldfp/bdldfp_decimal.h): IEEE decimal
    - IBM C [decnumber](http://speleotrove.com/decimal/decnumber.html): Configurable context with precision, rounding mode
    - Rust crates [[1]](https://crates.io/crates/decimal) [[2]](https://crates.io/crates/bigdecimal)
- Hardware (all implementing IEEE decimal)
    - [POWER6](https://www.ibm.com/developerworks/community/wikis/home?lang=en#!/wiki/Power+Systems/page/POWER6+Decimal+Floating+Point+(DFP))
    - [RISC-V](https://en.wikichip.org/wiki/risc-v/standard_extensions) (planned)

### History of discussion of decimal in TC39

Decimal has been under discussion in TC39 for a very long time, with proposals and feedback from many people including Sam Ruby, Mike Cowlishaw, Brendan Eich, Waldemar Horwat, Maciej Stachowiak, Dave Herman and Mark Miller.
- A new `decimal` type was long planned for ES4, see [Proposed ECMAScript 4th Edition – Language Overview](https://www.ecma-international.org/activities/Languages/Language%20overview.pdf)
- In the following ES3.1/ES5 effort, discussions about a decimal type continued on es-discuss, e.g., [[1]](https://mail.mozilla.org/pipermail/es-discuss/2008-August/007244.html) [[2]](https://mail.mozilla.org/pipermail/es-discuss/2008-September/007466.html)
- Decimal was discussed at length in the development of ES6. It was eventually rolled into the broader typed objects/value types effort, which didn't make it into ES6, but is being incrementally developed now (see the below section about relationship to other TC39 proposals).

### Relationship to other TC39 proposals

This proposal can be seen as a follow-on to [BigInt](https://github.com/tc39/proposal-bigint/), which brought arbitrary-sized integers to JavaScript, and will be fully standardized in ES2020. Like BigInt, BigDecimal builds off of three language capabilities that are not yet exposed to JavaScript code in general, but where there are active, ongoing efforts to bring them to the language.
- **Primitive types**: The BigDecimal proposal adds a new primitive type, analogous to Number and BigInt. JavaScript code can't yet create its own primitive types, but it's been a topic under discussion for a long time in TC39. One current effort is [Records and Tuples](https://github.com/tc39/proposal-record-tuple), which creates value type semantics for deeply immutable Object-like and Array-like values. Records and Tuples could form the semantic basis for a following "value class" proposal, where the latter would also tie in with the [Typed Objects proposal](https://github.com/tschneidereit/typed-objects-explainer/blob/master/core.md).
- **Operator overloading**: We plan to propose a new [operator overloading proposal](https://github.com/littledan/proposal-operator-overloading/) for Stage 1 before proposing BigDecimal, though they may proceed from there at different speeds. This operator overloading proposal encompasses the behavior of BigDecimal.
- **Numeric literals**: The Stage 1 [Extended Numeric Literals proposal](https://github.com/tc39/proposal-extended-numeric-literals) allows decorators to create new numerical literal syntax analogous to BigInt and BigDecimal literals.

We think that it's reasonable to develop BigDecimal in parallel with these generalization efforts, rather than blocking one on the other, as they are all independently very useful for JavaScript programmers, learnable, and things that we can experiment with ahead of standardization. Many JavaScript programmers we have talked to have the intuition that BigDecimal is a natural, important (even boring!) next step after BigInt, but have expressed uncertainty about whether we should go ahead with the other above proposals. We're taking incremental steps towards bringing the whole package to TC39 for consideration, but being pragmatic about the ordering.

It should be noted that, even with these three further proposals, there would be some mismatches between BigDecimal and similar user-defined types:
- `BigDecimal` is a global, like Number and String, but user-defined types would typically be exported from modules.
- If `BigDecimal` were defined as a value class with private fields, then methods or operators would likely not work across Realms, whereas they do work for BigDecimal.
- The operator overloading proposal requires lexical declarations to enable overloaded operators on a type, to avoid unintentional injection. BigDecimal overloading is always enabled, like Number and String.
- User-defined numeric literals use syntax of the form `32459.0742@m`, rather than `32459.0742m`, due to forward compatibility, timing and lexical scope collision issues.

We think these are each reasonable tradeoffs, and that overall, BigDecimal should follow existing JavaScript conventions, rather than using other, more complex, less ergonomic patterns.

#### TC39 meeting notes

- [November 2017](https://github.com/tc39/tc39-notes/blob/master/meetings/2017-11/nov-29.md#9ivb-decimal-for-stage-0); [slides](https://docs.google.com/presentation/d/1jPsw7EGsS6BW59_BDRu9o0o3UwSXQeUhi38QG55ZoPI/edit?pli=1#slide=id.p)

## Implementations

- none yet
- We are looking for volunteers for the following implementation tasks:
  - Writing a polyfill along the lines of [JSBI](https://github.com/GoogleChromeLabs/jsbi), see [#17](https://github.com/littledan/proposal-bigdecimal/issues/17)
  - Implementing BigDecimal syntax (but no transform) in a Babel PR, see [#18](https://github.com/littledan/proposal-bigdecimal/issues/18)
