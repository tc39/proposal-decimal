# Decimal128 introduction and reference

This page is JS developer-oriented documentation for using `Decimal128`, a TC39 proposal for JavaScript. It's
a work in progress--PRs welcome! For a broader introduction and rationale to the project, see
[README.md](./README.md). This document is one of the alternatives we are considering as a solution to Decimal
Proposal. We are also considering (BigDecimal)[./bigdecimal-reference.md] as a possible solution.

## Introductory example

`Decimal128` is a new numerical type proposed for JavaScript which can be used to represent decimal quantities, like money.

For example, to add up a bill with a number of items, and add sales tax:

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

`Decimal128` represents a base-10 decimal number, internally represented as an IEEE 754 128-bit decimal. Its precision is defined by 34 decimal digits of significand and an exponent range from -6143 to +6144. The value of this type is calculated as follow `s * (<significand> * 10 ** <exponent>)`, where `s` rerpesents the sign of the number and can be either `1` or `-1`.

IEEE 754 128-bit decimal allows represent different precisions of the same value considering trailing zeros (i.e it is possible to represent both `2.10000` and `2.1`), however Decimal128 values do not represent precision apart form its value. It means that two Decimal128 values are equal when they represent the same mathematical value (e.g. `2.10000m` is the same number as `2.1m` with the very same precision).

## Creating Decimal128 values

There are 2 main ways to create new Decimal128 values. We can use **literals** or **constructors**.

**Literals**

Literals can be declared using `m` suffix. It is possible to write a Decimal128 literal using scientific notation. Check example bellow.

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
let h = Decimal128(udefined); // Throws TypeError
let i = Decimal128(0.1); // returns 0.1m or 0.1000000000000000055511151231257827021181583404541015625m (check issue: #41)
```

## Operators on Decimal128

Decimal128 primitives works with JS operators just like Numbers and BigInt. During the section we will describe the semantics of each operator, providing some examples.

### Unary `-` operators

This operation changes the sign of the Decimal128 value. It can be applied to a literal or to a variable:

```js
let a = -5m;
console.log(-a === 5m); // prints true
```

### Binary operators

Decimal128 is supported on JS binary arithmetic and comparison operations and with logical operations as well.

#### `+` operator

This results in a Decimal128 value that represents the addition of `lhs` and `rhs` operands.

```js
let sum = 0.2m + 0.1m;
console.log(sum); // prints 0.3
```

We also can mix a Decimal128 value with a String. The result is the concatenation of the String with a string representing the value of Decimal128.

```js
let concat = 0.44m + "abc";
console.log(concat); // prints 0.44abc
```

#### `-` operator

This results in a Decimal128 value that represents the difference of `rhs` and `lhs` operands.

```js
let diff = 15.5m - 10m;
console.log(diff); // prints 5.5
```

#### `*` operator

This results in a Decimal128 value that represents the product of `rhs` and `lhs` operands.

```js
let prod = 0.5m * 2m;
console.log(prod); // prints 1
```

#### `/` operator

This results in a Decimal128 value that represents the division of `rhs` and `lhs` operands.

```js
let division = 3m / 2m;
console.log(division); // prints 1.5
```

#### `%` operator

This results in a Decimal128 value that represents the modulos of `rhs` and `lhs` operands.

```js
let mod = 9.5m % 2m;
console.log(mod); // prints 1.5

mod = 9m % 2m;
console.log(mod); // prints 1
```

#### Arithmetic operations of Decima128 and other primitive types

With the exception of addition operator `+`, mixing Decimal128 and other primitive types results in a `TypeError` (see [issue #39](https://github.com/tc39/proposal-decimal/issues/39) for reasoning behind this design decision).

```
let sum = 0.5m + 33.4; // throws TypeError
let diff = 334m - 1n; // throws TypeError
let prod = 234.6m * 1.5; // throws TypeError
let div = 30m / 15n; // throws TypeError
let mod = 35m % 5n; // throws TypeError
```

#### Rounding on arithmetic operations

It is important to notice that Decimal128 precision is limited to 34 digits and every arithmetic operations like addition or multiplication can cause rounding torwards that precision. The rouding algorithm used on Decimal128 arithmetics is the `half even` where it rounds towards the "nearest neighbor". If both neighbors are equidistant, it rounds towards the even neighbor. It is listed bellow examples of rounding for each operation:

```
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

#### `>` operator

It is possible to compare Decimal128 values using `>` oeprator. It returns `true` if the value of `lhs` is greater than the value of `rhs` and `false` otherwise.

```js
let greater = 0.5m  > 0m;
console.log(greater); // prints true

let notGreater = 0.5m > 2.0m;
console.log(notGreater); // prints false
```

#### `<` operator

It is possible to compare Decimal128 values using `<` oeprator. It returns `true` if the value of `lhs` is lesser than the value of `rhs` and `false` otherwise.

```js
let lesser = 0.5m < 2m;
console.log(lesser); // prints true

let notLesser = 0m < 0.5m;
console.log(notLesser); // prints false
```

#### `>=` operator

It is possible to compare Decimal128 values using `>=` oeprator. It returns `true` if the value of `lhs` is greater or equal than the value of `rhs` and `false` otherwise.

```js
let greaterOrEqual = 0.5m >= 0.5m;
console.log(greaterOrEqual); // prints true
```

#### `<=` operator

It is possible to compare Decimal128 values using `<=` oeprator. It returns `true` if the value of `lhs` is lesser or equal than the value of `rhs` and `false` otherwise.

```js
let lesserOrEqual = 0.5m <= 0.4m;
console.log(lesserOrEqual); // prints false
```

#### `==` operator

The equal operator can also compare Decimal128 values. It returns true if `lhs` has the same mathematical value of `rhs`.

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

Since comparison operators uses mathematical value of operands, it is possible to compare Decimal128  other types like Numbers, BigInt or Strings.

```js
567.00000000000001m < 567n; // false
998m == 998; // true
703.04 >= 703.0400001m; // false
9m <= "9"; // true
654m === 645.000m; // true
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

When used into boolean operator like `&&`, `||` or `??`, a Decimal128 value is considered as `false` if it is `0m` or `true` otherwise.

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

If a Decimal128 is an operand of a bitwise operator, it results in a `TypeError`.

## Standard library functions on Decimal128

### `Decimal128.round(value [, options])`

This function rounds the Decimal128 passed as paramter, tanking in consideration `options`.

- `value`: A Decimal128 value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It is an object that can contain `roundingMode` and `maximumFractionDigits` properties.
  - `maximumFractionDigits`: This options indicates the maximum of fractional digits the rounding operation should preserve.
  - `roundingMode`: This option indicates which algorithm is used to round a given Decimal128. Each possible option is described below.
    - `down`: round towards zero.
    - `half down`: round towards "nearest neighbor". If both neighbors are equidistant, it rounds down.
    - `half up`: round towards "nearest neighbor".  If both neighbors are equidistant, it rounds up.
    - `half even`: round towards the "nearest neighbor". If both neighbors are equidistant, it rounds towards the even neighbor.
    - `up`: round away from zero.
    
 ```js
let a = Decimal128.round(0.53m, {roundingMode: 'half up', maximumFractionDigits: 1});
assert(a, 0.6m);

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

This function adds `rhs` and `lhs` and returns the result of such operation, applying the rounding rules based on `options` object, if given. `options` is an options bag that configures a custom rounding for this operation.

- `lhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `rhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag object described on [Decimal128.round](#decimal128roundvalue--options). If it's not given, the operation will use the same rounding rules of `+` binary operator described on [Rounding on arithmetic operations](#rounding-on-arithmetic-operations) section.

### Decimal128.subtract(lhs, rhs [, options])

This function subtract `rhs` from `lhs` and returns the result of such operation, applying the rounding rules based on `options` object, if given. `options` is an options bag that configures a custom rounding for this operation.

- `lhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `rhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag object described on [Decimal128.round](#decimal128roundvalue--options). If it's not given, the operation will use the same rounding rules of `-` binary operator described on [Rounding on arithmetic operations](#rounding-on-arithmetic-operations) section.

### Decimal128.multiply(lhs, rhs [, options])

This function multiplies `rhs` by `lhs` and returns the result of such operation applying the rounding rules based on `options` object, if given. `options` is an options bag that configures a custom rounding for this operation.

- `lhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `rhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag object described on [Decimal128.round](#decimal128roundvalue--options). If it's not given, the operation will use the same rounding rules of `*` binary operator described on [Rounding on arithmetic operations](#rounding-on-arithmetic-operations) section.

### Decimal128.divide(lhs, rhs [, options])

This function divides `lhs` by `rhs` and returns the result of such operation applying the rounding based on `options` object, if given. `options` is an options bag that configures a custom rounding for this operation.

- `lhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `rhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag object described on [Decimal128.round](#decimal128roundvalue--options). If it's not given, the operation will use the same rounding rules of `/` binary operator described on [Rounding on arithmetic operations](#rounding-on-arithmetic-operations) section.

### Decimal128.reminder(lhs, rhs [, options])

This function returns the reminder of dividing `lhs` by `rhs`, applying the rounding based on `options` object, if given. `options` is an options bag that configures a custom rounding for this operation.

- `lhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `rhs`: A `Decimal128` value. If the value is from another type, it throws `TypeError`.
- `options`: It is an object indicating how the round operation should be performed. It's the same options bag object described on [Decimal128.round](#decimal128roundvalue--options). If it's not given, the operation will use the same rounding rules of `%` binary operator described on [Rounding on arithmetic operations](#rounding-on-arithmetic-operations) section.

## Decimal128 prototype

There is a `Decimal128.prototype` that includes utility methods.

### `Decimal128.prototype.toString()`

This method returns a string that is the representation of Decalmai128 value.

```js
let v = 0.55m;
console.log(v.toString()); // prints "0.55"
```

### `Decimal128.prototype.toLocaleString(locale [, options])`

This method returns a string that is the locale sensitive representation of Decalmai128 value. We get the same output of applying `locale` and `options` to `NumberFormat` on environments that supports Intl API.

```js
let v = 1500.55m;
console.log(v.toLocaleString("en")); // prints "1,500.55"
console.log(v.toLocaleString("pt-BR")); // prints "1.500,55"
```

### `Decimal128.prototype.toFixed([digits])`

This function returns a string that represents fixed-point notation of Decimal128 value. There is an optional parameter digits that defines the number of digits after decimal point. It follows the same semantis of `Number.prototype.toFixed`.

```js
let v = 100.456m;
console.log(v.toFixed(2)); // prints 100.46
v = 0m;
console.log(v.toFixed(2)); // prints 0.00
```

### `Decimal128.prototype.toExponential([fractionDigits])`

This methods returns a string of Decimal128 in exponential representation. It takes an optional parameter `fractionDigits` that defines the number of digits after decimal point. It follows the same semantis of `Number.prototype.toExponential`.

```js
let v = 1010m;
console.log(v.toExponential(2)); // prints 1.01e+3
```

### `Decimal128.prototype.toPrecision([precision])`

This function returns a string that rerpesents the Decimal128 in the specified precision. It follows the same semantis of `Number.prototype.toPrecision`.

```js
let v = 111.22m;
console.log(v.toPrecision()); // prints 111.22
console.log(v.toPrecision(4)); // 111.2
console.log(v.toPrecision(2)); //1.1e+2
```

## Using Decimal128 today

It's not possible to use Decimal128 today, as the polyfill is not yet implemented. We'd welcome collaboration here, see [#45](https://github.com/tc39/proposal-decimal/issues/45) for details and to coordinate work.

