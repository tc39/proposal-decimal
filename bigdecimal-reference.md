# BigDecimal introduction and reference

This page is the JS developer-oriented for using `BigDecimal` proposal from TC39. PRs welcome to fix any found
issue!  This document is one of the alternatives we are considering as a solution to Decimal Proposal. We are
also considering (Decimal128)[./decimal128-reference.md] as a possible solution.

## Introductory example

`BigDecimal` is a new primitive numeric type used to represent decimal quantities, like money, with more
intuitive and defined rounding rules than `Number`. Since `Number` is represented as binary float-point type,
there are decimal numbers that can't be represented by them, causing problems on rounding that happens on
arithmetic operations like `+`. See the example bellow.

```js
let a = 0.1 * 8;
// 0.8000000000000000444089209850062616169452667236328125
let b = 0.1 + 0.1 + 0.1 + 0.1 + 0.1 + 0.1 + 0.1 + 0.1;
// 0.79999999999999993338661852249060757458209991455078125

a === b; // evaluates to false
```

It's possible to see more issues when using binary floating-point to try to represent decimal fractions on
(Decimal FAQ)[http://speleotrove.com/decimal/decifaq1.html#inexact].

Let's take the example of a function to add up a bill with a number of items, and add sales tax:

```
function calculateBill(items, tax) {
  let total = 0m;
  for (let {price, count} of items) {
    total += price * BigDecimal(count);
  }
  return BigDecimal.round(total * (1m + tax),
                          {maximumFractionDigits: 2, round: "up"});
}

let items = [{price: 1.25m, count: 5}, {price: 5m, count: 1}];
let tax = .0735m;
console.log(calculateBill(items, tax));
```
Here, you can see several elements of `BigDecimal` at work:
- Create a `BigDecimal` as a literal, e.g., `1.25m`, or convert one from another type, as `BigDecimal(value)`.
- Add and multiply `BigDecimal` with the `+` and `*` operators.
- Round decimals with `BigDecimal.round`, based on an options bag describing how to round.

We are going to describe in details the full API for BigDecimal on the following sections of this page.

## BigDecimal representation

A `BigDecimal` value is represented by `sign * mantissa * 10 ** exponent`, where `sign` is either `1` or `-1`,
and with `mantissa` and `exponent` being integers. With those 3 component, it's possible to represent almost
any decimal exactly and it allows operations to grow the number of digits necessary to represent their
results.

`BigDecimal` doesn't represent precision apart from its value, meaning that `2.500m` and `2.5m` represents the
same value (i.e. they are normalized). Also, there's is no `+Infinity`, `-Infinity`, and `NaN` representation
on `BigDecimal`, and every operation either produces another `BigDecimal` value or throws an error.

Check (Decimal FAQ)[http://speleotrove.com/decimal/decifaq.html] to learn more details about decimal
arithmetics.

## Creating BigDecimal values

There are 2 main ways to create new `BigDecimal` values. We can use *literals* or `BigDecimal` *function*.

### Literals

Literals can be declared using `m` suffix. It is possible to write a `BigDecimal` literal using scientific
notation. Check example bellow.

```js
let a = 0.123m
let b = 456m;
let d = .456m;
let c = -1e-10m; // scientific notation
```

### Function

The function `BigDecimal` is available to be used as a coercing tool.

```js
let a = BigDecimal(3); // returns 3m
let b = BigDecimal("345"); // returns 345m
let c = BigDecimal("115e-10"); // returns 0.0000000115m
let d = BigDecimal(2545562323242232323n); // results 2545562323242232323m
let e = BigDecimal(true); // returns 1m
let f = BigDecimal(false); // returns 0m
let g = BigDecimal(null); // Throws TypeError
let h = BigDecimal(udefined); // Throws TypeError
let i = BigDecimal(0.1); // returns 0.1m or 0.1000000000000000055511151231257827021181583404541015625m (check issue: #41)
```

It creates a `BigDecimal` from the value passed as argument. It's important to notice that `BigDecimal` is
being used without `new` keyword. Since `BigDecimal` is a primitive, its constructor throws an error if `new
BigDecimal` is called.

## Arithmetic operators on BigDecimal

It is possible to use `BigDecimal` on arithmetic operators. This section documents the semantics of every
arithmetic operator when having `BigDecimal` as operand.

### Unary `-` operator

This operation changes the sign of the `BigDecimal` value. It can be applied to a literal or to a variable:

```js
let a = -5m;
console.log(-a === 5m); // prints true
```

There's no representation of negative zero for `BigDecimal`. In that case, `-0m` will evaluate to `0m`. This
also means that `Object.is(-0m, 0m)` returns `true`.

### Unary `+` operator

This operation throws `TypeError` on `BigDecimal`.

### Binary `+` operator

This results in a `BigDecimal` value that represents the addition of `lhs` and `rhs` operands.

```js
let sum = 0.2m + 0.1m;
console.log(sum); // prints 0.3
```

We also can mix a `BigDecimal` value with a `String`. The result is the concatenation of the `String` with a
string representing the value of `BigDecimal`.

```js
let concat = 0.44m + "abc";
console.log(concat); // prints 0.44abc
```

### `-` Binary operator

This results in a `BigDecimal` value that represents the difference of `rhs` and `lhs` operands.

```js
let diff = 15.5m - 10m;
console.log(diff); // prints 5.5
```

### `*` operator

This results in a `BigDecimal` value that represents the product of `rhs` and `lhs` operands.

```js
let prod = 0.5m * 2m;
console.log(prod); // prints 1
```

### `/` operator

This operator is not supported on `BigDecimal`, because there are results that can't be represented by this
primitive, like the result of `1m / 3m`. To avoid confusion where this operator throws for some inputs, but
works for others, we should always force users to perform divisions using `BigDecimal.divide`.

### `%` operator

This results in a `BigDecimal` value that represents the modulos of `rhs` and `lhs` operands.

```js
let mod = 9.5m % 2m;
console.log(mod); // prints 1.5

mod = 9m % 2m;
console.log(mod); // prints 1
```

### Arithmetic operations of `BigDecimal` and other primitive types

With the exception of binary operator `+`, mixing `BigDecimal` and other primitive types results in a
TypeError (see issue [#39](https://github.com/tc39/proposal-decimal/issues/39) for reasoning behind this
design decision).

```js
let sum = 0.5m + 33.4; // throws TypeError
let diff = 334m - 1n; // throws TypeError
let prod = 234.6m * 1.5; // throws TypeError
let div = 30m / 15n; // throws TypeError
let mod = 35m % 5n; // throws TypeError
```

## Comparison Operators

`BigDecimal` is also allowed to be used with comparison operators. In this case, since we are able to compare
values between a `BigDecimal` and other numeric types without any precision issue, this is also supported.

### `>` operator

It returns `true` if the value of `lhs` is greater than the value of `rhs`. Otherwise it returns `false`.

```js
let greater = 0.5m  > 0m;
console.log(greater); // prints true

let notGreater = 0.5m > 2;
console.log(notGreater); // prints false
```

### `<` operator

It returns `true` if the value of `lhs` is lesser than the value of `rhs`. Otherwise it returns `false`.

```js
let lesser = 0.5m < 2n;
console.log(lesser); // prints true

let notLesser = 0m < -0.5;
console.log(notLesser); // prints false
```

### `>=` operator

It returns `true` if the value of `lhs` is greater or equal than the value of `rhs`. Otherwise, it returns
`false`.

```js
let greaterOrEqual = 0.5m >= 0.5m;
console.log(greaterOrEqual); // prints true
```

### `<=` operator

It returns `true` if the value of `lhs` is lesser or equal than the value of `rhs`. Otherwise, it returns
`false`.

```js
let lesserOrEqual = 0.5m <= 0.4m;
console.log(lesserOrEqual); // prints false
```

### `==` operator

It returns `true` if `lhs` has the same mathematical value of `rhs`. Otherwise, returns `false`.

```js
0.2m + 0.1m == 0.3m; // true
2m == 2; // true
10n == 10m; // true
```

### `===` operator

It returns `true` if `lhs` has the same value and type of `rhs`. Otherwise, returns `false`.

```js
let isEqual = 0.2m + 0.1m === 0.3m;
console.log(isEqual); // prints true

let isNotEqual =  15 === 15m;
console.log(isNotEqual); // prints false
```

#### Comparing BigDecimal with other primitive types

Since comparison operators uses mathematical value of operands, it is possible to compare BigDecimal other
types like Numbers, BigInt or Strings.

```js
567.00000000000001m < 567n; // false
998m == 998; // true
703.04 >= 703.0400001m; // false
9m <= "9"; // true
654m === 645.000m; // true
654m === 654; // false
0m > -1; // true
```

### `typeof` operator

The `typeof` operator returns `"bigdecimal"` when applied to a `BigDecimal` value.

```js
let v = 0.5m
console.log(typeof v); // prints bigdecimal
```

### Falsiness

When used into boolean operator like `&&`, `||` or `??`, a `BigDecimal` value is considered as `false` if it
is `0m` or `true` otherwise.

```js
if (0m)
  console.log("hello"); // this is never executed
  
if (1m || 0)
  console.log("world"); // prints world

let a = 1m && 0;
console.log(a); // false

let b = 0m || false;
console.log(b); // false

let c = 15m ?? 'hello world';
console.log(c); // 15
```

### Bitwise operators

If a `BigDecimal` is an operand of a bitwise operator, it results in a `TypeError`.

## Standard library functions on BigDecimal

### BigDecimal.round(value [, options])

This is the function to be used when there's need to round `BigDecimals` in some specific way. It rounds the
`BigDecimal` passed as paramter, taking in consideration `options`.

- `value`: A `BigDecimal` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It is an object that can
  contain roundingMode and maximumFractionDigits properties.
  - `maximumFractionDigits`: This options indicates the maximum of factional digits the rounding operation
    should preserve. If it is `undefined`, round operations returns `value`.
  - `roundingMode`: This option indicates which algorithm is used to round the given `BigDecimal`. Each
    possible option is described below.
    - down: round towards zero.
    - half down: round towards "nearest neighbor". If both neighbors are equidistant, it rounds down.
    - half up: round towards "nearest neighbor". If both neighbors are equidistant, it rounds up.
    - half even: round towards the "nearest neighbor". If both neighbors are equidistant, it rounds towards
      the even neighbor.
    - up: round away from zero.

```js
let a = BigDecimal.round(0.53m, {roundingMode: 'half up', maximumFractionDigits: 1});
assert(a, 0.6m);

a = BigDecimal.round(0.53m, {roundingMode: 'half down', maximumFractionDigits: 1});
assert(a, 0.5m);

a = BigDecimal.round(0.53m, {roundingMode: 'half even', maximumFractionDigits: 1});
assert(a, 0.5m);

a =  BigDecimal.round(0.31m, {roundingMode: 'down', maximumFractionDigits: 1});
assert(a, 0.3m);

a =  BigDecimal.round(0.31m, {roundingMode: 'up', maximumFractionDigits: 1});
assert(a, 0.4m);
```

### BigDecimal.add(lhs, rhs [, options])

This function can be used as an alternative to `+` binary operator that allows rounding the result after the
calculation. It adds `rhs` and `lhs` and returns the result of such operation, applying the rounding rules
based on `options` object, if given. `options` is an options bag that configures the rounding of this
operation.

- `lhs`: A `BigDecimal` value. If the value is from another type, it throws `TypeError`.
- `rhs`: A `BigDecimal` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag
  object described on [BigDecimal.round](#bigdecimalroundvalue--options). If it's not given, no rounding
operation will be applied, and the exact result will be returned.

### BigDecimal.subtract(lhs, rhs [, options])

This function can be used as an alternative to `-` binary operator that allows rounding the result after the
calculation. It subtracts `rhs` from `lhs` and returns the result of such operation, applying the rounding
based on `options` object, if given. `options` is an options bag that configures the rounding of this
operation.

- `lhs`: A `BigDecimal` value. If the value is from another type, it throws `TypeError`.
- `rhs`: A `BigDecimal` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag
  object described on [BigDecimal.round](#bigdecimalroundvalue--options). If it's not given, no rounding 
  operation will be applied, and the exact result will be returned.

### BigDecimal.multiply(lhs, rhs [, options])

This function can be used as an alternative to `*` binary operator that allows rounding the result after the
calculation. It multiplies `rhs` by `lhs` and returns the result of such operation applying the rounding based
on `options` object, if given. `options` is an options bag that configures the rounding of this operation.

- `lhs`: A `BigDecimal` value. If the value is from another type, it throws `TypeError`.
- `rhs`: A `BigDecimal` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag
  object described on [BigDecimal.round](#bigdecimalroundvalue--options). If it's not given, no rounding
  operation will be applied, and the exact result will be returned.

### BigDecimal.divide(lhs, rhs, options)

This function is the main way to apply division using BigDecimals. It divides `lhs` by `rhs` and returns the
result of such operation applying the rounding based on `options` object. `options` is an options
bag that configures the rounding of this operation.

- `lhs`: A `BigDecimal` value. If the value is from another type, it throws `TypeError`.
- `rhs`: A `BigDecimal` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag
  object described on [BigDecimal.round](#bigdecimalroundvalue--options). If it's not given, no rounding
  operation will be applied, and the exact result will be returned. If the result can't be represented (due to a
  non-terminating decimal expansion), it throws `TypeError`.

Different from other arithmetic operations on `BigDecimal` constructors, we require `options` for division
because this is the only operation where some results can't be represented as a `BigDecimal` value (e.g. when
we divide 1m by 3m) if we don't round. With the requirement to describe how we should round the result, it's
then possible to return a correct result for any given input.

### BigDecimal.reminder(lhs, rhs [, options])

This function can be used as an alternative to `%` binary operator that allows rounding the result after the
calculation. It returns the reminder of dividing `lhs` by `rhs`, applying the rounding based on `options`
object, if given. `options` is an options bag that configures the rounding of this operation.

- `lhs`: A `BigDecimal` value. If the value is from another type, it throws `TypeError`.
- `rhs`: A `BigDecimal` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag
  object described on [BigDecimal.round](#bigdecimalroundvalue--options). If it's not given, no rounding
  operation will be applied, and the exact result will be returned.

## BigDecimal prototype

`BigDecimal.prototype` includes utility methods used to help manipulation of `BigDecimal` values.

### `BigDecimal.prototype.toString()`

This method returns a string that rerpesents the `BigDecimal` value.

```js
let v = 0.55m;
console.log(v.toString()); // prints "0.55"
```

### `BigDecimal.prototype.toLocaleString(locale [, options])`

This method returns a string that is the locale sensitive representation of the `BigDecimal` value. We get the
same output of applying `locale` and `options` to `NumberFormat` on environments that supports Intl API.

```js
let v = 1500.55m;
console.log(v.toLocaleString("en")); // prints "1,500.55"
console.log(v.toLocaleString("pt-BR")); // prints "1.500,55"
```

### `BigDecimal.prototype.toFixed([digits])`

This function returns a string that represents fixed-point notation of the `BigDecimal` value. There is an
optional parameter `digits` that defines the number of digits after decimal point. It follows the same
semantics of `Number.prototype.toFixed`.

```js
let v = 100.456m;
console.log(v.toFixed(2)); // prints 100.46
v = 0m;
console.log(v.toFixed(2)); // prints 0.00
```

### `BigDecimal.prototype.toExponential([fractionDigits])`

This methods returns a string of the `BigDecimal` in exponential representation. It takes an optional
parameter `fractionDigits` that defines the number of digits after decimal point. It follows the same
semantics of `Number.prototype.toExponential`.

```js
let v = 1010m;
console.log(v.toExponential(2)); // prints 1.01e+3
```

### `BigDecimal.prototype.toPrecision([precision])`

This function returns a string that rerpesents the `BigDecimal` in the specified precision. It follows the
same semantics of `Number.prototype.toPrecision`.

```js
let v = 111.22m;
console.log(v.toPrecision()); // prints 111.22
console.log(v.toPrecision(4)); // 111.2
console.log(v.toPrecision(2)); //1.1e+2
```

### BigDecimal and Intl.NumberFormat support

[Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
also supports `BigDecimal` values, just like it already supports Numbers, BigInts, and Strings.

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

## TypedArrays

TODO

## Using BigDecimal today

It's not possible to use BigDecimal today, as the polyfill is not yet implemented. We'd welcome collaboration
here, see [#45](https://github.com/tc39/proposal-decimal/issues/45) for details and to coordinate work.
