# Ecma TC39 JavaScript Decimal proposal

The TC39 Decimal proposal is an investigation into adding a
built-in data type in JavaScript to represent base-10
decimal numbers.

This whole proposal is basically a big open question, and
we’d welcome your participation in discussing the design
space in the issues linked above. **We are seeking input for
your needs around JavaScript decimal in [this
survey](https://forms.gle/A2YaTr3Tn1o3D7hdA).**

**Champions**:

+ Philip Chimento (Igalia)
+ Andrew Paprocki (Bloomberg)
+ Jesse Alama (Igalia)

**Stage**: Stage 1 of [the TC39 process](https://tc39.github.io/process-document/).

## Use cases and goals

Accurate storage and processing of base-10 decimal numbers
is a frequent need in JavaScript. Currently, developers
sometimes represent these using libraries for this purpose,
or sometimes use Strings. Sadly, JavaScript Numbers are also
sometimes used, leading to real, end-user-visible rounding
errors. Why? Because Numbers, as currently defined in
JavaScript, are 64-bit binary floating-point numbers, and
the conversion from most decimal values to binary floats
rarely is an exact match. (For instance: 0.5 works, but 0.1
does not. Same for 0.2, 0.3, … Statistically, it is unlikely
that a random decimal number can be exactly represented as a
binary float.)

The goal of the Decimal proposal is to add a decimal type to
the JavaScript standard library, in a way that provides such
good ergonomics, functionality and performance that people
feel comfortable using it when it’s appropriate. Being
built-in to JavaScript means that we will get optimizable,
well-maintained implementations that don’t require
transmitting, storing or parsing additional JavaScript code.

### Primary use case: Representing human-readable decimal values such as money

Many currencies tend to be expressed with decimal
quantities. Although it’s possible represent money as
integer "cents", this approach runs into a couple issues:

+ There’s a persistent mismatch between the way humans think
  about money and the way it’s manipulated in the program,
  causing mental overhead for the programmer. Many
  programmers may not even be aware of this mismatch.
+ Different currencies use different numbers of decimal
  positions which is easy to get confused; the hack of
  working with integers may not work when working with
  multiple currencies. For instance, it’s not correct to
  assume that all currencies have two decimal places, or
  that the only exception is JPY (Japanese yen); making such
  assumptions will make it hard to internationalize your
  code to new countries. For this reason, it’s ideal if the
  number of decimal places is part of the data type.
+ In various contexts (e.g., presenting a quantity to the
  end user), the fractionality needs to be brought back in
  somehow. For example, `Intl.NumberFormat` only knows how
  to format Numbers, and can’t deal with an integer +
  exponent pair.
+ Sometimes, fractional cents need to be represented too
  (e.g., as precise prices that occur, for instance, in
  stock trading or currency conversion).

#### Sample code

For example, to add up a bill with a number of items, and
add sales tax to the end, the `BigDecimal` alternative
(described below) could allow the following:

```js
function calculateBill(items, tax) {
  let total = 0m;
  for (let {price, count} of items) {
    total = total.add(price.times(new Decimal(count)));
  }
  let grandTotal = total.times(tax.add(1m));
  return grandTotal.toDecimalDigits(2);
}

let items = [{price: 1.25m, count: 5}, {price: 5m, count: 1}];
let tax = .0735m;
console.log(calculateBill(items, tax));
```

#### Why use JavaScript for this case?

Historically, JavaScript may not have been considered a
language where exact decimal numbers even representable, to
say nothing of doing (exact) calculations. In some
application architectures, JS only deals with a string
representing a human-readable decimal quantity, and never do
calculations or conversions. However, several trends push
towards JS’s deeper involvement in with decimal quantities:

+ **More complicated frontend architectures**: Rounding,
  localization or other presentational aspects may be
  performed on the frontend for better interactive
  performance
+ **Serverless**: Many Serverless systems use JavaScript as
  a programming language in order to better leverage the
  knowledge of frontend engineers
+ **Server-side programming in JavaScript**: Systems like
  Node.js and Deno have grown in popularity to do more
  traditional server-side programming in JavaScript.

In all of these environments, the lack of decimal number
support means that various workarounds have to be used
(assuming, again, that the programmers are aware of the
mismatch between JS's built-in binary floating-point numbers
and proper decimal numbers):

+ An external library could be used instead (introducing
  issues about choosing the library, coordinating on its
  use). Several options are available:
+ Calculations could be in terms of "cents" (fallible as
  explained above)
+ In some cases, developers end up using Number instead,
  believing it to be mostly safe, but in practice causing
  bugs, even if tries take care of any issues involving
  rounding or non-exact conversions from decimals to binary
  floats

#### Goals implied by the main use cases

This use case implies the following goals:

+ Avoid unintentional rounding that causes user-visible
  errors
+ Basic mathematical functions such as `+`, `-`, `*`, and
  `/`
+ Sufficient precision for typical money and other
  human-readable quantities
+ Conversion to a string in a locale-sensitive manner
+ Sufficient ergonomics to enable correct usage
+ Be implementable with adequate performance/memory usage
  for applications
+ Avoid confusing parts of floating point, e.g., -0, NaN,
  +/- Infinity. Just throw.
+ (Please file an issue to mention more requirements)

### Secondary use case: Data exchange

In both frontend and backend settings, JavaScript is used to
communicate with external systems, such as databases and
foreign function interfaces to other programming
languages. Many external systems already natively support
decimal numbers. In such a setting, JavaScript is then the
lower common denominator. With decimals in JavaScript, one
has the confident that the numeric data one consumes and
produces is handled exactly.

#### Why use JavaScript for this case?

JavaScript is frequently used as a language to glue other
systems together, whether in client, server or embedded
applications. Its ease of programming and embedding, and
ubiquity, lend itself to this sort of use case. Programmers
often don’t have the option to choose another language. When
decimals appear in these contexts, it adds more burden on
the embedder to develop an application-specific way to
handle things; such specificity makes things less
composable.

#### Goals implied by the use case

Interaction with other systems brings the following
requirements:

+ Ability to round-trip decimal quantities from other
  systems
+ Serialization and deserialization in standard decimal
  formats, e.g., IEEE 754’s multiple formats
+ Precision sufficient for the applications on the other
  side

### Tertiary use case: Numerical calculations on more precise floats

If it works out reasonably to provide for it within the same
proposal, it would also be nice to provide support for
higher-precision applications of floating point numbers.

If Decimal is arbitrary-precision or supports greater
precision than Number, it may also be used for applications
which need very large floating point numbers, such as
astronomical calculations, physics, or even certain
games. In some sense, larger or arbitrary-precision binary
floats (as supported by
[QuickJS](https://bellard.org/quickjs/), or IEEE 754
128-bit/256-bit binary floats) may be more efficient, but
Decimal may also be suitable. In particular, if the need is
for human-consumable, and reproducible, calculations,
Decimal may offer some advantages compared to binary floats.

### Language design goals

In addition to the goals which come directly from use cases
mentioned above,

+ Well-defined semantics, with the same result regardless of
  which implementation and context a piece of code is run in
+ Build a consistent story for numerics in JavaScript
  together with Numbers, BigInt, operator overloading, and
  potential future built-in numeric types
+ No global mutable state involved in operator semantics;
  dynamically scoped state also discouraged
+ Ability to be implemented across all JavaScript
  environment (e.g., embedded, server, browser)

### Interactions with other parts of the web platform

If Decimal becomes a part of standard JavaScript, it may be
used in some built-in APIs in host environments:

+ For the Web platform:
  ([#4](https://github.com/littledan/proposal-decimal/issues/4))
  + HTML serialization would support Decimal, just as it
    supports BigInt, so Decimal could be used in
    `postMessage`, `IndexedDB`, etc.
+ For WebAssembly, if WebAssembly adds IEEE 64-bit and/or
  128-bit decimal scalar types some day, then the
  WebAssembly/JS API could introduce conversions along the
  boundary, analogous to [WebAssembly BigInt/i64
  integration](https://github.com/WebAssembly/JS-BigInt-integration)

More host API interactions are discussed in
[#5](https://github.com/littledan/proposal-decimal/issues/5).

## Early draft syntax and semantics

With this proposal at Stage 1, details aren’t nailed
down. However, for concreteness, some initial possible
details are provided below. You’re encouraged to join the
discussion by commenting on the issues linked below or
[filing your
own](https://github.com/littledan/proposal-decimal/issues/new).

We are leaning toward using the **Decimal128** data model
for JavaScript decimals. Decimal128 is not a new standard;
it was added to the IEEE 754 standard in 2008. It represents
the culmination of decades of research, both theoretical and
practical, on decimal floating-point numbers. Values in the
Decimal128 universe take up 128 bits. In this
representation, up to 34 significant digits (that is,
decimal digits) can be stored, with an exponent (power of
ten) of +/- 6143.

### Known alternatives

#### BigDecimal

The data model here consists of unlimited size decimals,
represented exactly as mathematical values.

From the champion group’s perspective, both BigDecimal and
Decimal128 are both coherent, valid proposals that would
meet the needs of the primary use case. Just looking at the
diversity of semantics in other programming languages, and
the lack of practical issues that programmers run into,
shows us that there are many workable answers here.

Operators always calculate their exact answer. In
particular, if two BigDecimals are multiplied, the precision
of the result may be up to the *sum* of the operands. For
this reason, `BigDecimal.pow` takes a mandatory options
object, to ensure that the result does not go out of control
in precision.

One can conceive of an arbitrary-precision versionf of
decimals, and we have explored that route; historical
information is available at
[bigdecimal-reference.md](./bigdecimal-reference.md).

One difficulty with BigDecimal is that `/` is not available
because a rounding parameter is required. A `BigDecimal.div`
function would be needed, where some options would be
mandatory. See
[#13](https://github.com/littledan/proposal-decimal/issues/13)
for further discussion of division in BigDecimal.

Further discussion of the tradeoffs between BigDecimal and
Decimal128 can be found in
[#8](https://github.com/littledan/proposal-decimal/issues/8).

#### Fixed-precision decimals

#### Rationals

## Syntax and semantics

With Decimal we envision a new

+ Literal syntax: `123.456_789m` is a Decimal128 value ([#7](https://github.com/littledan/proposal-decimal/issues/7))

### Data model

Decimal represents a mathematical, "normalized"
([#26](https://github.com/littledan/proposal-decimal/issues/26))
base 10 decimal. IEEE 754 Decimal128 is the underlying set
of values (though not all Decimal128 values are available to
the JS programmer, since we work, again, only with
normalized values, whereas the official IEEE 754 Decimal128
works with unnormalized values). For example, `2m` is
exactly the same value as `2.00m`
([#11](https://github.com/littledan/proposal-decimal/issues/11))
If preserving magnitude/precision through trailing zeroes is
required, it needs to be represented separately from the
Decimal There is no Infinity, -0, NaN, etc; error cases lead
to exceptions, just like BigInt, and `-0m` is `0m`
([#9](https://github.com/littledan/proposal-decimal/issues/9))

### Operator semantics

+ Addition, multiplication, subtraction, division, and
  remainder are defined.
+ Bitwise operators are not supported, as they don’t
  logically make sense on the Decimal domain
  ([#20](https://github.com/littledan/proposal-decimal/issues/20))
+ We currently do not foresee Decimal values interactiving
  with other Number values.  Expect TypeErrors when trying
  to add, say, a Number to a Decimal, like for
  BigInt+Number. ([#10](https://github.com/littledan/proposal-decimal/issues/10)).

Decimal methods for calculation: ([#14](https://github.com/littledan/proposal-decimal/issues/14))

+ `round(number)` rounds a Decimal, specifying a number of
  significant digits after the decimal point
+ `pow(number)` only supports positive integer
  exponents. (The operator form of `**` is not available.)

The library of numerical functions here is deliberately
minimal. It is based around targeting the primary use case,
in which fairly straightforward calculations are
envisioned. The secondary use case (data exchange) will
probably involve no calculation at all. For the tertiary use
case of scientific/numerical computations, developers may
experiment in JavaScript, developing such libraries, and we
may decide to standardize these functions in a follow-on
proposal. We currently do not have good insight into the
developer needs for this use case, except generically:
roots, exponentiation & logarithms, and trignonometric
functions are probably needed, but we are not sure if this
is a complete list, and which are more important to have
than others.

### String formatting

+ `toString()` is similar to the behavior on Number, e.g.,
  `123.456m.toString()` is
  `"123.456"`. ([#12](https://github.com/littledan/proposal-decimal/issues/12))
+ `toFixed`, `toExponential`, `toPrecision` methods
  analogous to Number methods
+ `Intl.NumberFormat.prototype.format` transparently
  supports Decimal
  ([#15](https://github.com/littledan/proposal-decimal/issues/15))

We’re aware that there are delegates in TC39 who prefer one
or the other path. We’d like to collect broader feedback
based on realistic usage of these alternatives. We intend to
do the following to test both alternatives:

+ For each, develop a speculative polyfill implementations,
  along the lines of
  [JSBI](https://github.com/GoogleChromeLabs/jsbi), which
  could also be used with the [operator overloading
  transform](https://github.com/tc39/proposal-operator-overloading)
+ Write strong documentation, sample code, cookbook, etc for
  both alternatives
+ Request feedback from the JavaScript community in using
  the alternatives

Due to these complicated design questions, as well as
interaction with other proposals (especially operator
overloading), the champions do not expect Decimal to move as
quickly through TC39’s process as BigInt did. Stage 2 at the
end of 2023 would be an optimistic estimate if all goes very
well.

## FAQ

### Why are literals `m`? Why not `d`?

As with BigInt, there’s not a huge amount of precedent from
other programming languages about a literal suffix. Newer
languages in the .NET ecosystem tend to use `m`, but outside
of that family, few languages use a suffix to indicate
decimal literals. So there isn’t a lot of precedent to go
on.

Many people have raised the idea that we use `d` as the
suffix for decimal. It is the first letter! However,
thinking about this further, it would not extend to
hexadecimal literals, which may include `d`.

Although this proposal does not include hexadecimal syntax
for decimals, it would be ideal to work with a syntax that
could be extended to them, or even to "explain" the decimal
syntax in terms of a generalized [extended numeric
literals](https://github.com/tc39/proposal-extended-numeric-literals)
proposal (which would necessarily support hexadecimal
literals, to explain BigInt).

### Would fractions/rationals meet these use cases?

Fractions would be an interesting thing to pursue in TC39,
and are in many ways complementary to Decimal. The use cases
for rationals overlap somewhat with the use cases for
decimals. Many languages in the Lisp tradition (e.g.,
[Racket](https://docs.racket-lang.org/guide/numbers.html))
include rationals as a basic data type, alongside IEEE 754
64-bit binary floating point numbers; Ruby and Python also
include fractions in their standard library.

We see rationals as complementary to Decimal because of a
mismatch when it comes to two of the core operations on
Decimals:

+ Rounding to a certain base-10 precision, with a rounding
  mode
+ Conversion to a localized, human-readable string

These *could* be defined on rationals, but are a bit of an
inherent mismatch since rationals are not base 10.

Two further issues:

+ Efficiency: Simple operations like addition of fractions
  requires use of a greatest-common-denominator (GCD)
  algorithm to normalize the fraction. At the same time,
  even with that, the denominator can get pretty big with
  just a few operations if care isn’t taken. (BigDecimal may
  get rather large due to repeated multiplication, but
  fractions face this issue with simple addition and
  subtraction as well.)
+ Still limited expressiveness: Rationals still cannot
  express most polynomial or trigonometric values, so the
  exactness benefits still fall away in most cases. It’s not
  clear how often practical programs actually need
  preciseness in fractions but not those other issues. It
  certainly comes up sometimes, though.

Rational may still make sense as a separate data type,
alongside Decimal. Further discussion of rationals in
[#6](https://github.com/littledan/proposal-decimal/issues/6).

### Will Decimal have good performance?

This depends on implementations. Like BigInt, implementers
may decide whether or not to optimize it, and what scenarios
to optimize for. We believe that, with either alternative,
it is possible to create a high-performance Decimal
implementation. Historically, faced with a similar decision
of BigInt vs Int64, TC39 decided on BigInt; such a decision
might not map perfectly because of differences in the use
cases. Further discussion:
[#27](https://github.com/littledan/proposal-decimal/issues/27)

### Will Decimal have the same behavior across implementations and environments?

One option that’s raised is allowing for greater precision
in more capable environments. However, Decimal is all about
avoiding unintended rounding. If rounding behavior depended
on the environment, the goal would be compromised in those
environments. Instead, this proposal attempts to find a
single set of semantics that can be applied globally.

### What about decimals elsewhere (the JS ecosystem, other programming languages/systems)?

See [COMPARISON.md](./COMPARISON.md) for details.

### How does this proposal relate to other TC39 proposals like operator overloading?

See [RELATED.md](./RELATED.md) for details.

### Why not have the maximum precision or default rounding mode set by the environment?

Many decimal implementations support a global option to set
the maximum precision (e.g., Python, Ruby). In QuickJS,
there is a "dynamically scoped" version of this: the
`setPrec` method changes the maximum precision while a
particular function is running, re-setting it after it
returns. Default rounding modes could be set similarly.

Although the dynamic scoping version is a bit more
contained, both versions are anti-modular: Code does not
exist with independent behavior, but rather behavior that is
dependent on the surrounding code that calls it. A reliable
library would have to always set the precision around it.

There is further complexity when it comes to JavaScript’s
multiple globals/Realms: a Decimal primitive value does not
relate to anything global, so it would be inviable to store
the state there. It would have to be across all the Decimals
in the system. But then, this forms a cross-realm
communication channel.

Therefore, this proposal does not contain any options to set
the precision from the environment.

### Where can I learn more about decimals in general?

Mike Cowlishaw’s excellent [Decimal
FAQ](http://speleotrove.com/decimal/decifaq.html) explains
many of the core design principles for decimal data types,
which this proposal attempts to follow.

One notable exception is supporting trailing zeroes:
Although Mike presents some interesting use cases, the
Decimal champion group does not see these as being worth the
complexity both for JS developers and implementers. Instead,
Decimal values could be lossly represented as rationals, and
are "normalized".

#### TC39 meeting notes

+ [November
  2017](https://github.com/tc39/tc39-notes/blob/master/meetings/2017-11/nov-29.md#9ivb-decimal-for-stage-0);
  [slides](https://docs.google.com/presentation/d/1jPsw7EGsS6BW59_BDRu9o0o3UwSXQeUhi38QG55ZoPI/edit?pli=1#slide=id.p)
+ [March 2023](https://github.com/tc39/notes/blob/main/meetings/2023-03/mar-22.md#decimal-stage-1-update)

## Implementations

+ Experimental implementation in
  [QuickJS](https://bellard.org/quickjs/), from release
  2020-01-05 (use the `--bignum` flag)
+ decimal128.js is an npm package that implements Decimal128
  in JavaScript (or, rather, the variant of Decimal128 that
  we envision for this proposal)
+ We are looking for volunteers for the following
  implementation tasks:
  + Writing a polyfill along the lines of
    [JSBI](https://github.com/GoogleChromeLabs/jsbi) for
    both alternatives, see
    [#17](https://github.com/littledan/proposal-decimal/issues/17)
  + Implementing Decimal syntax (but no transform) in a
    Babel PR, see
    [#18](https://github.com/littledan/proposal-decimal/issues/18)

## Getting involved in this proposal

Your help would be really appreciated in this proposal!
There are lots of ways to get involved:

+ Share your thoughts on the issue tracker
+ Document your use cases, and write sample code with
  decimal, sharing it in an issue
+ Research how decimals are used in the JS ecosystem today,
  and document what works and what doesn’t, in an issue
+ Help us write and improve documentation, tests, and
  prototype implementations

See a full list of to-do tasks at
[#45](https://github.com/littledan/proposal-decimal/issues/45).
