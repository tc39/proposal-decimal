# Why Decimal?

## The Problem with Number

JavaScript's `Number` type has served the language well for
decades, but it has a fundamental limitation: it uses binary
floating-point arithmetic (IEEE 754 binary64), which means
that many decimal values that humans work with every day
cannot be represented exactly.

### The Classic Example

Many JS programmers know this one:

```javascript
0.1 + 0.2; // => 0.30000000000000004
```

This isn't a bug—it's a consequence of how binary
floating-point works. Just as 1/3 cannot be represented
exactly as a finite decimal (it's 0.333…), many decimal
values cannot be represented exactly in binary. In fact,
_none_ of the values in the example
above—<math><mn>0.1</mn></math>, <math><mn>0.2</mn></math>,
or <math><mn>0.3</mn></math>—can be represented exactly in
binary floating-point:

```javascript
// None of these are exact in binary
(0.1)
  .toPrecision(20)(
    // => "0.10000000000000000555"
    0.2,
  )
  .toPrecision(20)(
    // => "0.20000000000000001110"
    0.3,
  )
  .toPrecision(20); // => "0.29999999999999998890"
```

### Real-World Impact

This inherent limitation of base-2 floating-point numbers
affects many common use cases for JS programmers, especially
financial calculations, where the need for precision is very
high. In these settings, rounding errors—which begin when
converting from decimal notation to binary floating-point
and which get compounded as more and more arithmetic gets
done on these values—can be exposed, despite careful
programming.

When systems exchange decimal data (coming from, e.g.,
databases, APIs, spreadsheets), the binary representation
can introduce subtle errors that accumulate over time or
cause validation failures. We have seen that using numeric
equality `===` can fail in very simple cases, so we need to
have some kind of alternative such as string
comparison. Using `toString` on `Number` might be one
approach, but this can switch between decimal and
exponential syntax, so one should perhaps uniformly use
`toFixed` or `toPrecision`. But what should the arguments
be?

## How Decimal Solves These Problems

The `Decimal` type uses base-10 arithmetic, storing numbers
in the same decimal format that humans use. This provides
exact representation for decimal values within its precision
range (34 significant digits). The developer knows that 0.1,
0.2, and 0.3 really _are_ those values, internally. No
rounding needed:

```javascript
const a = new Decimal("0.1");
const b = new Decimal("0.2");
a.add(b).toString(); // => "0.3" (exactly!)
a.add(b).equals(new Decimal("0.3")); // true (finally!)
```

## The Technical Foundation

### IEEE 754-2019 Decimal128

Decimal is based on the IEEE 754-2019 Decimal128 standard, which provides:

- **34 significant digits of precision**: More than enough for financial calculations, scientific measurements, and other common use cases
- **Base-10 arithmetic**: Calculations are performed in decimal, matching human expectations
- **Industry standard**: Already implemented in other languages and databases

### Why Not Arbitrary Precision?

While arbitrary-precision decimal libraries exist, Decimal128 offers important advantages:

1. **Predictable performance**: Fixed 128-bit size means consistent memory usage and performance
2. **Interoperability**: Matches decimal types in databases and other languages
3. **Sufficient precision**: 34 digits handles virtually all real-world use cases
4. **Simpler implementation**: Easier for JavaScript engines to optimize

## Common Workarounds and Their Limitations

### Working with Cents

A common workaround is to use integers representing cents:

```javascript
const priceInCents = 1999; // $19.99
const taxRate = 0.0825;
const taxInCents = Math.round(priceInCents * taxRate);
```

But this approach has limitations: it requires constant conversion between cents and dollars, it doesn't work for all currencies (some use 3 decimal places). Calculations (e.g., currency conversion), especially complex ones, can still introduce floating-point errors.

### Why Not Just Use Helper Functions?

Some suggest that we could solve decimal arithmetic problems with helper functions like `decimalAdd`:

```javascript
// Attempt 1: Using toPrecision
Number.prototype.decimalAdd = function (operand) {
  return Number((this + operand).toPrecision(15));
};
```

And this can work for simple cases:

```javascript
(0.1).decimalAdd(0.2); // => 0.3
```

But it fails for others:

```javascript
(1.551).decimalAdd(-1.55)); // => 0.00099999999999989
// Should be 0.001!
```

The problem? We're trying to round a binary approximation back to decimal, but the damage is already done. Let's try being smarter:

```javascript
// Attempt 2: Dynamic precision based on magnitude
Number.prototype.decimalAdd = function (x) {
  let numFraction =
    15 -
    Math.max(
      Math.ceil(Math.log10(Math.abs(this))),
      Math.ceil(Math.log10(Math.abs(x))),
    );
  return Number((this + x).toFixed(numFraction));
}
```

This approach is clever and can handle many straightforward cases, but it still has edge cases when dealing with values that have more than 15 significant digits, such as those arising in complex financial calculations and scientific measurements. The fundamental issue is that once you've converted to binary floating-point, you've already lost information. No amount of clever rounding can reliably recover the original decimal intent.

### Using toFixed()

Another workaround is aggressive use of `toFixed()`:

```javascript
const result = (0.1 + 0.2).toFixed(2); // => "0.30"
```

But this has problems too. Even with, say, `toFixed(2)`, you can still be off by a penny (when thinking of financial calculations in a currency that has pennies). The fundamental problem: `toFixed()` is a display function, not a solution for exact arithmetic. It masks errors rather than preventing them.

### Epsilon Comparisons

Some developers use "close enough" comparisons:

```javascript
function areEqual(a, b, epsilon = 0.0001) {
  return Math.abs(a - b) < epsilon;
}
```

But this is fragile and can fail even with simple arithmetic. The fundamental flaw: epsilon comparison doesn't fix the errors—it just ignores them until they grow too large to ignore.

## The Fundamental Incompatibility

The core issue isn't just about precision—it's about the fundamental incompatibility between how humans write numbers (base 10) and how binary floating-point stores them (base 2). It's true that, through careful programming and working in a domain with simple calculations whose complexity is limited out-of-band, inherent rounding issues *might* be avoided. But if the complexity of a calculation is not known, rounding issues are always going to be lurking in the shadows, so to speak, waiting to expose a rounding error to the programmer.

### Most Decimal Numbers Cannot Be Exactly Represented

Here's a startling fact: statistically, most human-authored decimal numbers cannot be exactly represented as binary floating-point numbers. This isn't a bug or limitation of JavaScript—it's mathematics.

```javascript
const decimals = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

decimals.forEach((d) => {
  // Convert to binary and back to see if it's exact
  const binary = d.toString(2);
  const isExact = d === Number(d.toPrecision(17));
  console.log(`${d}: ${isExact ? "exact" : "NOT exact"}`);
});

// Output:
// 0.1: NOT exact
// 0.2: NOT exact
// 0.3: NOT exact
// 0.4: NOT exact
// 0.5: exact      (0.5 = 1/2, a power of 2!)
// 0.6: NOT exact
// 0.7: NOT exact
// 0.8: NOT exact
// 0.9: NOT exact
```

Out of the single-digit decimals, only 0.5 can be exactly represented! This is because 0.5 = 1/2, and powers of 2 are the only fractions that binary can represent exactly. Looking at, say, the number 0.00, 0.01, …, 1.00, the results are even more startling.

## What Decimal Doesn't Solve

We have argued that Decimal is an important addition to JS. In some applications, the inherent difficulties of rounding might get exposed. Nonetheless, it's important to understand that Decimal isn't a silver bullet for all numeric issues.

### Rational Numbers and Range Limits

Decimal is based on IEEE 754 Decimal128, which has specific limitations:

**Range limits:** Decimal can only represent values within its range:

```javascript
// Maximum value: approximately ±9.999...×10^6144 (34 digits)
const maxValue = new Decimal("9.999999999999999999999999999999999e6144");

// Minimum non-zero value: ±1×10^-6143
const minValue = new Decimal("1e-6143");

// Values outside this range overflow or underflow
const tooLarge = new Decimal("1e6145"); // => Infinity
const tooSmall = new Decimal("1e-6144"); // => 0
```

**Rational numbers with infinite decimal expansions:** Decimal cannot exactly represent fractions like 1/3 or 1/7:

```javascript
const oneThird = new Decimal("1").divide(new Decimal("3"));
console.log(oneThird.toString());
// => "0.3333333333333333333333333333333333" (34 threes)
```

For applications requiring exact rational arithmetic, a rational number type (representing numerator/denominator) would be more appropriate.

### Performance

Decimal operations are slower than native Number operations. For performance-critical code that doesn't need exact decimal arithmetic, Number remains the better choice.

### Existing Ecosystem

The vast JavaScript ecosystem uses Number. Decimal values need to be converted when interfacing with existing libraries and APIs. We hope that, over time, with advocacy and developer education, many APIs might support Decimals as well as Numbers.

## When to Use Decimal

Use Decimal when you need:

- **Exact decimal arithmetic**: Financial calculations, currency, percentages
- **Data integrity**: Preserving exact values from databases or user input
- **Regulatory compliance**: Meeting precision requirements for financial reporting
- **Cross-system consistency**: Matching decimal behavior of other systems

Continue using Number when you need:

- **Maximum performance**: Games, graphics, real-time systems
- **Scientific calculations**: Trigonometry, logarithms, complex math
- **Existing library compatibility**: Working with the current ecosystem
- **Binary data**: Bit manipulation, binary protocols

## The Path Forward

Decimal represents a pragmatic addition to JavaScript's numeric types. It complements, and doesn't replace, Number. Similarly, Decimal is based on the same IEEE 754 standard that Number is based on. Decimal solves problems without over-engineering. Moreover, we have designed Decimal to be future-friendly, to work with potential operator overloading in future editions of ECMAScript.

## Conclusion

The addition of Decimal to JavaScript addresses a long-standing pain point in the language. By providing exact decimal arithmetic, it enables developers to write financial and business logic with confidence, eliminate subtle rounding bugs, and match the decimal behavior expected by users and external systems.

While Number remains appropriate for many use cases, Decimal fills a critical gap for applications that work with human-readable decimal values. It's not about replacing JavaScript's existing numeric types—it's about having the right tool for the right job.
