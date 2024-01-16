# Decimal128 introduction and reference

This page is JS developer-oriented documentation for using `Decimal128`, a TC39 proposal for JavaScript. It's
a work in progress--PRs welcome! For a broader introduction and rationale to the project, see
[README.md](./README.md).

## Introductory example

`Decimal128` is a new numerical type proposed for JavaScript which can be used to represent decimal
quantities, like money. Since `Number` is represented as binary float-point type, there are decimal numbers
that can't be represented by them, causing problems on rounding that happens on arithmetic operations like
`+`.

```js
let a = 0.1 * 8;
// 0.8000000000000000444089209850062616169452667236328125
let b = 0.1 + 0.1 + 0.1 + 0.1 + 0.1 + 0.1 + 0.1 + 0.1;
// 0.79999999999999993338661852249060757458209991455078125

a === b; // evaluates to false
```

The example above illustrate why using binary floating-point numbers is problematic when we use them to
represent and manipulate decimal fractions. The expectation on both arithmetic operations is that the final
result is 0.8, and they also should be equivalent. However, since the result for some of those operations
can't be exactly represented by binary floating-point numbers, the results diverge. For this example, the
reason for such difference on results comes from the fact that multiple additions using binary floating-point
numbers will carry more errors from rounding than a single multiplication. It's possible to see more examples
of issues like that on this [Decimal FAQ section](http://speleotrove.com/decimal/decifaq1.html#inexact).  Such
issue isn't a problem with Decimal128, because we are able to represent all those decimal fractions exactly,
including the intermediate results for arithmetic operations.

```js
let a = 0.1m * 8m;
// This results in 0.8m exactly
let b = 0.1m + 0.1m + 0.1m + 0.1m + 0.1m + 0.1m + 0.1m + 0.1m;
// This also results on 0.8m

a === b; // evaluates to true
```

Now, let's take the example of a function to add up a bill with a number of items, and add sales tax:

```js
function calculateBill(items, tax) {
  let total = 0m;
  for (let {price, count} of items) {
    total += price * Decimal128(count);
  }
  return Decimal128.round(total * (1m + tax),
                          {maximumFractionDigits: 2, round: "up"});
}

let items = [{price: 1.25m, count: 5}, {price: 5m, count: 1}];
let tax = .0735m;
console.log(calculateBill(items, tax));
```

Here, you can see several elements of `Decimal128` at work:
- Create a `Decimal128` as a literal, e.g., `1.25m`, or convert one from another type, as `Decimal128(value)`.
- Add and multiply `Decimal128`s with the `+` and `*` operators.
- Round decimals with `Decimal128.round`, based on an options bag describing how to round.

This article describes how these work in more detail, and the rest of the `Decimal128` API.

## What does Decimal128 represent?

`Decimal128` represents a base-10 decimal number, internally represented as an IEEE 754 128-bit decimal. Its
precision is defined by 34 decimal digits of significand and an exponent range from -6143 to +6144. The value
of this type is calculated as follow `s * (<significand> * 10 ** <exponent>)`, where `s` represents the sign
of the number and can be either `1` or `-1`.

[IEEE 754 128-bit decimal](https://en.wikipedia.org/wiki/Decimal128_floating-point_format) allows represent
different precisions of the same value considering trailing zeros (i.e it is possible to represent both
`2.10000` and `2.1`), however Decimal128 values do not represent precision apart form its value. It means that
two Decimal128 values are equal when they represent the same mathematical value (e.g. `2.10000m` is the same
number as `2.1m` with the very same precision).

Check (Decimal FAQ)[http://speleotrove.com/decimal/decifaq.html] to learn more details about decimal
arithmetics and representation.

## Creating Decimal128 values

There are 2 main ways to create new Decimal128 values. We can use **literals** or **constructors**.

**Literals**

Literals can be declared using `m` suffix. It is possible to write a Decimal128 literal using scientific
notation. Check example bellow.

```js
let a = 0.123m
let b = 456m;
let c = -1e-10m; // scientific notation
```

**Constructor**

The constructor `Decimal128` is available to be used as a coercing tool.

```js
let a = Decimal128(3); // returns 3m
let b = Decimal128("345"); // returns 345m
let c = Decimal128("115e-10"); // returns 0.0000000115m
let d = Decimal128(2545562323242232323n); // results 2545562323242232323m
let e = Decimal128(true); // returns 1m
let f = Decimal128(false); // returns 0m
let g = Decimal128(null); // Throws TypeError
let h = Decimal128(undefined); // Throws TypeError
let i = Decimal128(0.1); // returns 0.1000000000000000055511151231257827021181583404541015625m
```

## Operators on Decimal128

Decimal128 primitives works with JS operators just like Numbers and BigInt. During the section we will
describe the semantics of each operator, providing some examples.

### Unary `-` operators

This operation changes the sign of the Decimal128 value. It can be applied to a literal or to a variable:

```js
let a = -5m;
console.log(-a === 5m); // prints true
```

### Unary `+` operator

This operation throws `TypeError` on `Decimal128`.

### Binary operators

Decimal128 is supported on JS binary arithmetic and comparison operations and with logical operations as well.

#### `+` operator

This results in a Decimal128 value that represents the addition of `lhs` and `rhs` operands.

```js
let sum = 0.2m + 0.1m;
console.log(sum); // prints 0.3m
```

We also can mix a Decimal128 value with a String. The result is the concatenation of the String with a string
representing the value of Decimal128.

```js
let concat = 0.44m + "abc";
console.log(concat); // prints 0.44abc
```

#### `-` operator

This results in a Decimal128 value that represents the difference of `rhs` and `lhs` operands.

```js
let diff = 15.5m - 10m;
console.log(diff); // prints 5.5m
```

#### `*` operator

This results in a Decimal128 value that represents the product of `rhs` and `lhs` operands.

```js
let prod = 0.5m * 2m;
console.log(prod); // prints 1m
```

#### `/` operator

This results in a Decimal128 value that represents the division of `rhs` and `lhs` operands.

```js
let division = 3m / 2m;
console.log(division); // prints 1.5m
```

#### `%` operator

This results in a Decimal128 value that represents the modulos of `rhs` and `lhs` operands.

```js
let mod = 9.5m % 2m;
console.log(mod); // prints 1.5m

mod = 9m % 2m;
console.log(mod); // prints 1m
```

#### `**` operator

This operator is not supported on `Decimal128`.

#### Arithmetic operations of Decimal128 and other primitive types

With the exception of addition operator `+`, mixing Decimal128 and other primitive types results in a
`TypeError` (see [issue #39](https://github.com/tc39/proposal-decimal/issues/39) for reasoning behind this
design decision).

```js
let sum = 0.5m + 33.4; // throws TypeError
let diff = 334m - 1n; // throws TypeError
let prod = 234.6m * 1.5; // throws TypeError
let div = 30m / 15n; // throws TypeError
let mod = 35m % 5n; // throws TypeError
```

#### Rounding on arithmetic operations

It is important to notice that Decimal128 precision is limited to 34 digits and every arithmetic operations
like addition or multiplication can cause rounding towards that precision. The rounding algorithm used on
Decimal128 arithmetics is the `half even` where it rounds towards the "nearest neighbor". If both neighbors
are equidistant, it rounds towards the even neighbor. It is listed bellow examples of rounding for each
operation:

```js
let sumRounded = 1e35m + 1m;
print(sumRounded); // prints 1e35

let subRounded = -1e35m - 1m;
print(subRounded); // prints -1e35

let mulRounded = 1m * 1e-400m;
print(mulRounded); // prints 0

let mulRounded = 1m / 1e400m;
print(mulRounded); // prints 0
```

Operations that can cause roundings are the ones where the precision of result is greater than 34.

### Comparison Operators

`Decimal128` is also allowed to be used with comparison operators. In this case, since we are able to compare
values between a `Decimal128` and other numeric types without any precision issue, this is also supported.

#### `>` operator

It is possible to compare Decimal128 values using `>` operator. It returns `true` if the value of `lhs` is
greater than the value of `rhs` and `false` otherwise.

```js
let greater = 0.5m  > 0m;
console.log(greater); // prints true

let notGreater = 0.5m > 2.0m;
console.log(notGreater); // prints false
```

#### `<` operator

It is possible to compare Decimal128 values using `<` operator. It returns `true` if the value of `lhs` is
lesser than the value of `rhs` and `false` otherwise.

```js
let lesser = 0.5m < 2m;
console.log(lesser); // prints true

let notLesser = 0m < 0.5m;
console.log(notLesser); // prints false
```

#### `>=` operator

It is possible to compare Decimal128 values using `>=` operator. It returns `true` if the value of `lhs` is
greater or equal than the value of `rhs` and `false` otherwise.

```js
let greaterOrEqual = 0.5m >= 0.5m;
console.log(greaterOrEqual); // prints true
```

#### `<=` operator

It is possible to compare Decimal128 values using `<=` operator. It returns `true` if the value of `lhs` is
lesser or equal than the value of `rhs` and `false` otherwise.

```js
let lesserOrEqual = 0.5m <= 0.4m;
console.log(lesserOrEqual); // prints false
```

#### `==` operator

The equal operator can also compare Decimal128 values. It returns true if `lhs` has the same mathematical
value of `rhs`.

```js
let isEqual = 0.2m + 0.1m == 0.3m;
console.log(isEqual); // prints true
```

#### `===` operator

It is also possible to apply strict equals operator on Decimal128 value.

```js
let isEqual = 0.2m + 0.1m === 0.3m;
console.log(isEqual); // prints true

let isNotEqual =  0.2 + 0.1 === 0.3m;
console.log(isNotEqual); // prints false
```

#### Comparing Decimal128 with other primitive types

Since comparison operators uses mathematical value of operands, it is possible to compare Decimal128  other
types like Numbers, BigInt or Strings.

```js
567.00000000000001m < 567n; // false
998m == 998; // true
703.04 >= 703.0400001m; // false
9m <= "9"; // true
654m === 654.000m; // true
654m === 654; // false
0m > -1; // true
```

### typeof

The `typeof` operator returns `"decimal128"` when applied to a Decimal128 value.

```js
let v = 0.5m
console.log(typeof v); // prints decimal128
```

### Falsiness

When used into boolean operator like `&&`, `||` or `??`, a Decimal128 value is considered as `false` if it is
`0m` or `true` otherwise.

```js
if (0m) {
  console.log("hello"); // this is never executed
}

if (1m || 0) {
  console.log("world"); // prints world
}

let a = 1m && 0;
console.log(a); // false

let b = 0m || false;
console.log(b); // false

let c = 15m ?? 'hello world';
console.log(c); // 15m
```

### Bitwise operators

If a Decimal128 is an operand of a bitwise operator, it results in a `TypeError`.

## Standard library functions on Decimal128

### `Decimal128.round(value [, options])`

This is the function to be used when there's need to round Decimal128 in some specific way.  It rounds the
Decimal128 passed as parameter, tanking in consideration `options`.

- `value`: A Decimal128 value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It is an object that can
  contain `roundingMode` and `maximumFractionDigits` properties.
  - `maximumFractionDigits`: This options indicates the maximum of fractional digits the rounding operation
    should preserve.
  - `roundingMode`: This option indicates which algorithm is used to round a given Decimal128. Each possible
    option is described below.
    - `down`: round towards zero.
    - `half down`: round towards "nearest neighbor". If both neighbors are equidistant, it rounds down.
    - `half up`: round towards "nearest neighbor".  If both neighbors are equidistant, it rounds up.
    - `half even`: round towards the "nearest neighbor". If both neighbors are equidistant, it rounds towards
      the even neighbor.
    - `up`: round away from zero.

 ```js
let a = Decimal128.round(0.53m, {roundingMode: 'half up', maximumFractionDigits: 1});
assert(a, 0.5m);

a = Decimal128.round(0.53m, {roundingMode: 'half down', maximumFractionDigits: 1});
assert(a, 0.5m);

a = Decimal128.round(0.53m, {roundingMode: 'half even', maximumFractionDigits: 1});
assert(a, 0.5m);

a =  Decimal128.round(0.31m, {roundingMode: 'down', maximumFractionDigits: 1});
assert(a, 0.3m);

a =  Decimal128.round(0.31m, {roundingMode: 'up', maximumFractionDigits: 1});
assert(a, 0.4m);
 ```

### Decimal128.add(lhs, rhs [, options])

This function can be used as an alternative to `+` binary operator that allows rounding the result after the
calculation. It adds `rhs` and `lhs` and returns the result of such operation, applying the rounding rules
based on `options` object, if given. `options` is an options bag that configures a custom rounding for this
operation.

- `lhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `rhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag
  object described on [Decimal128.round](#decimal128roundvalue--options). If it's not given, the operation
  will use the same rounding rules of `+` binary operator described on [Rounding on arithmetic
  operations](#rounding-on-arithmetic-operations) section.

### Decimal128.subtract(lhs, rhs [, options])

This function can be used as an alternative to `-` binary operator that allows rounding the result after the
calculation. It subtracts `rhs` from `lhs` and returns the result of such operation, applying the rounding
rules based on `options` object, if given. `options` is an options bag that configures a custom rounding for
this operation.

- `lhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `rhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag
  object described on [Decimal128.round](#decimal128roundvalue--options). If it's not given, the operation
  will use the same rounding rules of `-` binary operator described on [Rounding on arithmetic
  operations](#rounding-on-arithmetic-operations) section.

### Decimal128.multiply(lhs, rhs [, options])

This function can be used as an alternative to `*` binary operator that allows rounding the result after the
calculation. It multiplies `rhs` by `lhs` and returns the result of such operation applying the rounding rules
based on `options` object, if given. `options` is an options bag that configures a custom rounding for this
operation.

- `lhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `rhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag
  object described on [Decimal128.round](#decimal128roundvalue--options). If it's not given, the operation
  will use the same rounding rules of `*` binary operator described on [Rounding on arithmetic
  operations](#rounding-on-arithmetic-operations) section.

### Decimal128.divide(lhs, rhs [, options])

This function can be used as an alternative to `/` binary operator that allows rounding the result after the
calculation. It divides `lhs` by `rhs` and returns the result of such operation applying the rounding based on
`options` object, if given. `options` is an options bag that configures a custom rounding for this operation.

- `lhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `rhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag
  object described on [Decimal128.round](#decimal128roundvalue--options). If it's not given, the operation
  will use the same rounding rules of `/` binary operator described on [Rounding on arithmetic
  operations](#rounding-on-arithmetic-operations) section.

### Decimal128.remainder(lhs, rhs [, options])

This function can be used as an alternative to `%` binary operator that allows rounding the result after the
calculation. It returns the reminder of dividing `lhs` by `rhs`, applying the rounding based on `options`
object, if given. `options` is an options bag that configures a custom rounding for this operation.

- `lhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `rhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag
  object described on [Decimal128.round](#decimal128roundvalue--options). If it's not given, the operation
  will use the same rounding rules of `%` binary operator described on [Rounding on arithmetic
  operations](#rounding-on-arithmetic-operations) section.

### Decimal128.pow(number, power [, options])

This function returns the power of `number` by `power`, applying the rounding based on `options` object, if
given. `options` is an options bag that configures the rounding of this operation. `power` needs to be a
positive integer.

- `number`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `power`: A positive integer `Number` value. If the value is from another type or not a positive integer, it
  throws `RangeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag
  object described on [BigDecimal.round](#bigdecimalroundvalue--options). If it's not given, no rounding
  operation will be applied, and the exact result will be returned.

## Decimal128 prototype

There is a `Decimal128.prototype` that includes utility methods.

### `Decimal128.prototype.toString()`

This method returns a string that is the representation of Decimal128 value.

```js
let v = 0.55m;
console.log(v.toString()); // prints "0.55"
```

### `Decimal128.prototype.toLocaleString(locale [, options])`

This method returns a string that is the locale sensitive representation of Decimal128 value. We get the same
output of applying `locale` and `options` to `NumberFormat` on environments that supports Intl API.

```js
let v = 1500.55m;
console.log(v.toLocaleString("en")); // prints "1,500.55"
console.log(v.toLocaleString("pt-BR")); // prints "1.500,55"
```

### `Decimal128.prototype.toFixed([digits])`

This function returns a string that represents fixed-point notation of Decimal128 value. There is an optional
parameter digits that defines the number of digits after decimal point. It follows the same semantics of
`Number.prototype.toFixed`.

```js
let v = 100.456m;
console.log(v.toFixed(2)); // prints 100.46
v = 0m;
console.log(v.toFixed(2)); // prints 0.00
```

### `Decimal128.prototype.toExponential([fractionDigits])`

This methods returns a string of Decimal128 in exponential representation. It takes an optional parameter
`fractionDigits` that defines the number of digits after decimal point. It follows the same semantics of
`Number.prototype.toExponential`.

```js
let v = 1010m;
console.log(v.toExponential(2)); // prints 1.01e+3
```

### `Decimal128.prototype.toPrecision([precision])`

This function returns a string that represents the Decimal128 in the specified precision. It follows the same
semantics of `Number.prototype.toPrecision`.

```js
let v = 111.22m;
console.log(v.toPrecision()); // prints 111.22
console.log(v.toPrecision(4)); // 111.2
console.log(v.toPrecision(2)); //1.1e+2
```

### Decimal128 and Intl.NumberFormat support

[Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
also supports `Decimal128` values, just like it already supports Numbers and BigInts.

```js
const number = 123456.789m;

console.log(new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(number));
// expected output: "123.456,79 €"

// the Japanese yen doesn't use a minor unit
console.log(new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(number));
// expected output: "￥123,457"

// limit to three significant digits
console.log(new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 }).format(number));
// expected output: "1,23,000"
```

## Decimal128 as key for Map/Set

Like other primitives we have, it's also possible to use Decimal128 values as keys for Maps and Sets.

```js
let s = new Set();
let decimal = 3.55m;

s.add(decimal);
s.has(3.55m); // returns true
s.has(3.55); // returns false
s.has("3.55"); // returns false

// Map
let m = new Map();

m.set(decimal, "test");
m.get(3.55m); // returns "test"
m.get(3.55); // returns undefined
m.get("3.55"); // returns undefined
```

### Decimal128 as property keys

Decimal128 values can be used as property keys, like we also have support it for BigInts and Numbers. Its
value is converted to a String to be used as a property key.

```js
let o = {};
o[2.45m] = "decimal";
console.log(o["2.45"]); // prints "decimal"
console.log(o[2.45m]); // prints "decimal"
```

## TypedArrays

TODO

## Using Decimal128 today

It's not possible to use Decimal128 today, as the polyfill is not yet implemented.
