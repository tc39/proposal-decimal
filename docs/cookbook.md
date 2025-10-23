# Decimal Cookbook

## Overview

This cookbook contains code examples for common use cases and patterns when working with the `Decimal` type. These examples demonstrate best practices for exact decimal arithmetic in JavaScript.

## Getting Started

### Basic Usage

Create Decimal values from strings for exact representation:

```javascript
// Create from string
const price = new Decimal("19.99");
const quantity = new Decimal("3");

// Perform calculations
const total = price.multiply(quantity);
console.log(total.toString()); // => "59.97"
```

## Prior Art: Decimal Arithmetic in Other Languages

The patterns demonstrated in this cookbook are not unique to JavaScript - they reflect well-established practices across programming languages. This section shows how other languages handle the same decimal arithmetic challenges, demonstrating that native decimal support is standard across the industry.

### Python

Python includes the `decimal` module in its standard library (since 2003):

```python
from decimal import Decimal

# Financial calculations
price = Decimal("19.99")
quantity = Decimal("3")
tax_rate = Decimal("0.0825")

subtotal = price * quantity
tax = subtotal * tax_rate
total = subtotal + tax

print(f"${total:.2f}")  # => "$64.92"
```

Python's `Decimal` is widely used in web frameworks like Django and Flask for handling monetary values. The Django ORM includes a `DecimalField` specifically for financial data.

### Java

Java's `BigDecimal` (in the standard library since 1998) is ubiquitous in enterprise applications:

```java
import java.math.BigDecimal;
import java.math.RoundingMode;

BigDecimal price = new BigDecimal("19.99");
BigDecimal quantity = new BigDecimal("3");
BigDecimal taxRate = new BigDecimal("0.0825");

BigDecimal subtotal = price.multiply(quantity);
BigDecimal tax = subtotal.multiply(taxRate);
BigDecimal total = subtotal.add(tax);

// Round to 2 decimal places
total = total.setScale(2, RoundingMode.HALF_UP);
System.out.println(total);  // => "64.62"
```

`BigDecimal` is the standard approach for financial applications in the Java ecosystem, including frameworks like Spring and Hibernate.

### C\#

C# includes `decimal` as a primitive type (since 2000), giving it first-class language support:

```csharp
decimal price = 19.99m;
decimal quantity = 3m;
decimal taxRate = 0.0825m;

decimal subtotal = price * quantity;
decimal tax = subtotal * taxRate;
decimal total = subtotal + tax;

Console.WriteLine($"${total:F2}");  // => "$64.92"
```

### Ruby

Ruby includes `BigDecimal` in its standard library:

```ruby
require 'bigdecimal'

price = BigDecimal("19.99")
quantity = BigDecimal("3")
tax_rate = BigDecimal("0.0825")

subtotal = price * quantity
tax = subtotal * tax_rate
total = subtotal + tax

puts "$%.2f" % total  # => "$64.92"
```

Ruby on Rails uses [`BigDecimal`](https://ruby-doc.org/3.4.1/exts/json/BigDecimal.html) for handling database `decimal` columns by default, making it the standard approach for money in Rails applications.

### Swift

Swift's Foundation framework includes [`Decimal`](https://developer.apple.com/documentation/foundation/decimal) (formerly [`NSDecimalNumber`](https://developer.apple.com/documentation/foundation/nsdecimalnumber)):

```swift
import Foundation

let price = Decimal(string: "19.99")!
let quantity = Decimal(string: "3")!
let taxRate = Decimal(string: "0.0825")!

let subtotal = price * quantity
let tax = subtotal * taxRate
let total = subtotal + tax

let formatter = NumberFormatter()
formatter.numberStyle = .currency
print(formatter.string(from: total as NSDecimalNumber)!)  // => "$64.92"
```

Swift's `Decimal` is the recommended type for financial calculations in iOS and macOS applications.

### SQL

Most SQL databases treat decimal arithmetic as fundamental:

```sql
SELECT
    price,
    quantity,
    price * quantity AS subtotal,
    (price * quantity) * 0.0825 AS tax,
    (price * quantity) * 1.0825 AS total
FROM products
WHERE id = 1;
```

Database `NUMERIC` and `DECIMAL` types provide exact decimal arithmetic. When JavaScript applications query these values, they currently must receive them as strings (or as `Number`s, which may lose precision from the get-go) that are then converted to `Number` (which also loses precision), or use a userland decimal library.

Native JavaScript Decimal would allow seamless interchange with database decimal types.

### Why This Matters for JavaScript

JavaScript forces developers to choose between:

- Binary floats (precision errors, bugs, non-trivial knowledge of binary float problems and some countermeasures that may not always work)
- Userland libraries (bundle size, coordination, performance)
- Integer "cents" (cognitive overhead, internationalization issues)

The patterns in this cookbook reflect industry-standard practices that JavaScript developers should be able to use natively, just as developers in other major languages can.

## Common Patterns

This section demonstrates common patterns and best practices when working with Decimal.

### Working with Monetary Values

Create Decimal values from strings to ensure exact representation:

```javascript
const price = new Decimal("19.99");
const tax = new Decimal("0.0825");

// Calculate with confidence
const taxAmount = price.multiply(tax);
const total = price.add(taxAmount);
console.log(total.toFixed(2)); // => "21.64"
```

### Accumulating Values

When accumulating many values in the course of a calculation with several steps, use Decimal to avoid rounding errors:

```javascript
const transactions = ["10.50", "25.75", "3.99", "100.00", "45.25"];

// Sum all transactions
const total = transactions.reduce((sum, amount) => {
  return sum.add(new Decimal(amount));
}, new Decimal(0));

console.log(total.toString()); // => "185.49"
```

### Splitting Bills

Handle bill splitting with proper rounding:

```javascript
function splitBill(totalAmount, numberOfPeople) {
  const total = new Decimal(totalAmount);
  const people = new Decimal(numberOfPeople);

  // Calculate per-person amount
  const perPerson = total.divide(people);

  // Round down to cents for most people
  const roundedPerPerson = perPerson.round(2, "floor");

  // Last person pays the remainder to ensure exact total
  const lastPersonPays = total.subtract(
    roundedPerPerson.multiply(people.subtract(new Decimal(1))),
  );

  return {
    perPerson: roundedPerPerson.toFixed(2),
    lastPerson: lastPersonPays.toFixed(2),
  };
}

const split = splitBill("100.00", "3");
console.log(split); // => { perPerson: "33.33", lastPerson: "33.34" }
```

### Percentage Calculations

Calculate percentages accurately:

```javascript
function calculateWithPercentage(amount, percentage) {
  const base = new Decimal(amount);
  const percent = new Decimal(percentage).divide(new Decimal(100));
  const percentageAmount = base.multiply(percent);

  return {
    amount: percentageAmount.toFixed(2),
    total: base.add(percentageAmount).toFixed(2),
  };
}

// Calculate 7.25% sales tax
const tax = calculateWithPercentage("19.99", "7.25");
console.log(tax); // => { amount: "1.45", total: "21.44" }

// Calculate 15% tip
const tip = calculateWithPercentage("45.50", "15");
console.log(tip); // => { amount: "6.83", total: "52.33" }
```

### Creating Decimal values

The most reliable way to create Decimal values is from strings:

```javascript
// From string (recommended for exact values)
const price = new Decimal("19.99");
const tax = new Decimal("0.0825");
const small = new Decimal("0.000001");
const large = new Decimal("9999999999999999999999999999999999"); // 34 digits
```

You can also create Decimals from Numbers, but be aware of _binary_ floating-point limitations. When converting a Number to a Decimal, the Number is first converted to a string using `toExponential()`, then that string is parsed as a Decimal:

```javascript
// From Number
const fromNumber = new Decimal(0.1);
// The Number 0.1 is actually 0.1000000000000000055511151231257827...
// It's converted to "1e-1" via toExponential(), then parsed as Decimal "0.1"

const integer = new Decimal(42); // Exact for integers within safe range
```

BigInt values can also be used to create Decimals:

```javascript
// From BigInt
const fromBigInt = new Decimal(123n);
const largeBigInt = new Decimal(999999999999999999999n);
```

### Converting to and from BigInt

Decimal can convert to and from BigInt, with some limitations.

Creating Decimal from BigInt values:

```javascript
const bigIntValue = 123456789012345678901234567890n;
const decimal = new Decimal(bigIntValue);
console.log(decimal.toString()); // => "123456789012345678901234567890"
```

Converting integer Decimals to BigInt:

```javascript
const integerDecimal = new Decimal("12345");
const toBigInt = integerDecimal.toBigInt();
console.log(toBigInt); // => 12345n
```

Non-integer Decimals cannot be converted to BigInt:

```javascript
const fractionalDecimal = new Decimal("123.45");
try {
  fractionalDecimal.toBigInt();
} catch (e) {
  console.log(e.message); // => "Cannot convert 123.45 to a BigInt"
}
```

If one wants to ensure that a Decimal value represents, semantically, an integer, use `round` before convering to BigInt:

```javascript
const fractionalDecimal = new Decimal("123.45"); // same as previous example
fractionalDecimal.round().toBigInt(); // ...but doesn't throw
```

Very large integers beyond `Number`'s safe range work perfectly:

```javascript
const largeDecimal = new Decimal("99999999999999999999999999999999");
const largeBigInt = largeDecimal.toBigInt();
console.log(largeBigInt); // => 99999999999999999999999999999999n
```

However, there are some digit strings that Number can handle just fine, namely those with more than 34 significant digits that have compact representations as sums of powers of two.

## Financial Calculations

### Calculate invoice total with tax

A common pattern for calculating totals with tax:

```javascript
function calculateInvoice(items, taxRate) {
  // Sum all line items using reduce
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = new Decimal(item.price).multiply(
      new Decimal(item.quantity),
    );
    return sum.add(itemTotal);
  }, new Decimal(0));

  // Calculate tax
  const tax = subtotal.multiply(new Decimal(taxRate));
  const total = subtotal.add(tax);

  return {
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
  };
}
```

Example usage:

```javascript
const items = [
  { price: "19.99", quantity: "2" },
  { price: "5.50", quantity: "3" },
  { price: "12.00", quantity: "1" },
];

const result = calculateInvoice(items, "0.0825");
console.log(result);
// => { subtotal: "68.48", tax: "5.65", total: "74.13" }
```

### Currency conversion

Converting between currencies with proper rounding:

```javascript
function convertCurrency(amount, rate, decimals = 2) {
  const amountDec = new Decimal(amount);
  const rateDec = new Decimal(rate);
  const converted = amountDec.multiply(rateDec);
  return converted.round(decimals).toString();
}
```

Example conversions:

```javascript
// Convert 100 USD to EUR at rate 0.92545
const eurAmount = convertCurrency("100.00", "0.92545");
console.log(eurAmount); // => "92.55"

// Convert with more precision for crypto
const btcAmount = convertCurrency("1000.00", "0.000024", 8);
console.log(btcAmount); // => "0.02400000"
```

### Percentage calculations

Working with percentages and discounts:

```javascript
function applyDiscount(price, discountPercent) {
  const priceDec = new Decimal(price);
  const discount = new Decimal(discountPercent).divide(new Decimal(100));
  const discountAmount = priceDec.multiply(discount);
  const finalPrice = priceDec.subtract(discountAmount);

  return {
    originalPrice: priceDec.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    finalPrice: finalPrice.toFixed(2),
    savedPercent: discountPercent + "%",
  };
}

const result = applyDiscount("49.99", "15");
console.log(result);
// => { originalPrice: "49.99", discountAmount: "7.50", finalPrice: "42.49", savedPercent: "15%" }
```

### Compound interest calculation

Calculate compound interest with exact decimal arithmetic. The compound interest formula is:

<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mi>A</mi>
  <mo>=</mo>
  <mi>P</mi>
  <msup>
    <mrow>
      <mo>(</mo>
      <mn>1</mn>
      <mo>+</mo>
      <mfrac>
        <mi>r</mi>
        <mi>n</mi>
      </mfrac>
      <mo>)</mo>
    </mrow>
    <mrow>
      <mi>n</mi>
      <mi>t</mi>
    </mrow>
  </msup>
</math>

Where:

- <math><mi>A</mi></math> = Final amount
- <math><mi>P</mi></math> = Principal (initial investment)
- <math><mi>r</mi></math> = Annual interest rate (as a decimal)
- <math><mi>n</mi></math> = Number of times interest is compounded per year
- <math><mi>t</mi></math> = Number of years

```javascript
function calculateCompoundInterest(
  principal,
  annualRate,
  years,
  compoundingPerYear = 12,
) {
  const p = new Decimal(principal);
  const r = new Decimal(annualRate).divide(new Decimal(100)); // Convert percentage to decimal
  const n = new Decimal(compoundingPerYear);
  const t = new Decimal(years);

  const rDivN = r.divide(n);
  const onePlusRate = new Decimal(1).add(rDivN);
  const exponent = n.multiply(t);

  // For this example, we'll approximate the power operation
  // In a real implementation, you'd want a proper power function for Decimal
  let result = new Decimal(1);
  for (let i = 0; i < exponent.toNumber(); i++) {
    result = result.multiply(onePlusRate);
  }

  const finalAmount = p.multiply(result);
  const interest = finalAmount.subtract(p);

  return {
    principal: p.toFixed(2),
    finalAmount: finalAmount.toFixed(2),
    totalInterest: interest.toFixed(2),
  };
}
```

Let's calculate the growth of a $1,000 investment at 5% annual interest, compounded monthly for 10 years:

```javascript
const investment = calculateCompoundInterest("1000", "5", "10");
console.log(investment);
// => { principal: "1000.00", finalAmount: "1628.89", totalInterest: "628.89" }
```

## Rounding Strategies

### Different rounding modes

Decimal supports multiple rounding modes for different use cases: ceiling, floor, truncate, round-ties-away-from-zero, and round-ties-to-even (AKA banker's rounding).

```javascript
const value = new Decimal("123.456");

// Default rounding (halfEven - banker's rounding)
console.log(value.round(2).toString()); // => "123.46"

// Always round up (ceiling)
console.log(value.round(2, "ceil").toString()); // => "123.46"

// Always round down (floor)
console.log(value.round(2, "floor").toString()); // => "123.45"

// Round towards zero (truncate)
console.log(value.round(2, "trunc").toString()); // => "123.45"

// Round half away from zero
console.log(value.round(2, "halfExpand").toString()); // => "123.46"

// Negative number example
const negative = new Decimal("-123.456");
console.log(negative.round(2, "floor").toString()); // => "-123.46"
console.log(negative.round(2, "ceil").toString()); // => "-123.45"
```

### Financial rounding

Common rounding patterns for financial applications.

#### Round to nearest cent

```javascript
function roundToCents(amount) {
  return new Decimal(amount).round(2);
}

console.log(roundToCents("19.9749").toString()); // => "19.97"
console.log(roundToCents("19.9751").toString()); // => "19.98"
```

#### Round to nearest nickel (0.05)

```javascript
function roundToNickel(amount) {
  const decimal = new Decimal(amount);
  const twentieths = decimal.multiply(new Decimal(20));
  const rounded = twentieths.round();
  return rounded.divide(new Decimal(20));
}

console.log(roundToNickel("19.97").toString()); // => "19.95"
console.log(roundToNickel("19.98").toString()); // => "20"
```

## Comparisons and Sorting

Are two Decimal values equal? Is one less than another?

### Comparing decimal values

Safe comparison of decimal values:

```javascript
const a = new Decimal("0.1").add(new Decimal("0.2"));
const b = new Decimal("0.3");

// Direct comparison
console.log(a.equals(b)); // => true
console.log(a.lessThan(b)); // => false
console.log(a.greaterThanOrEqual(b)); // => true
```

Now let's sort:

```javascript
const values = [
  new Decimal("10.5"),
  new Decimal("2.3"),
  new Decimal("10.05"),
  new Decimal("-5"),
];

// Sort ascending
values.sort((a, b) => a.compare(b));
console.log(values.map((v) => v.toString()));
// => ["-5", "2.3", "10.05", "10.5"]

// Sort descending
values.sort((a, b) => b.compare(a));
console.log(values.map((v) => v.toString()));
// => ["10.5", "10.05", "2.3", "-5"]
```

### Finding min/max values

Working with arrays of decimal values:

```javascript
function findMinMax(values) {
  const decimals = values.map((v) => new Decimal(v));

  const min = decimals.reduce((min, current) =>
    current.lessThan(min) ? current : min,
  );

  const max = decimals.reduce((max, current) =>
    current.greaterThan(max) ? current : max,
  );

  return { min: min.toString(), max: max.toString() };
}

const prices = ["19.99", "5.50", "105.00", "0.99", "50.00"];
console.log(findMinMax(prices));
// => { min: "0.99", max: "105.00" }
```
