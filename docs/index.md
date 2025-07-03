# Decimal

## Introduction

This is a proposal for `Decimal`, a new numeric type that brings exact base-10 decimal arithmetic to JavaScript. Decimal provides:

- Exact representation of decimal values
- Support for up to 34 significant digits
- IEEE 754-2019 Decimal128 semantics
- Integration with `Intl.NumberFormat` for locale-aware formatting

To understand the motivation behind this proposal and why JavaScript needs a decimal type, see [Why Decimal?](./why-decimal.md)

## Cookbook

A cookbook to help you get started with Decimal is available [here](./cookbook.md).

## API Documentation

### **Decimal**

A `Decimal` represents an exact base-10 decimal number using IEEE 754-2019 Decimal128 format. This allows for up to 34 significant digits with an exponent range of ±6143.

```js
const price = new Decimal("19.99");
const quantity = new Decimal("3");
const total = price.multiply(quantity).toString(); // "59.97"
```

Unlike JavaScript's `Number` type, Decimal provides exact decimal arithmetic:

```js
// With Number (binary floating-point)
0.1 + 0.2; // => 0.30000000000000004

// With Decimal
const a = new Decimal("0.1");
const b = new Decimal("0.2");
const c = a.add(b);
c.toString(); // "0.3"
c.equals(new Decimal("0.3")); // true
```

See [Decimal Documentation](./decimal.md) for detailed documentation.

## Data Model

Decimal uses a subset of the IEEE 754-2019 Decimal128 specification:

- **128-bit representation** allowing up to 34 significant digits
- **Base-10 exponent** range of -6143 to +6144
- **Special values**: NaN, positive and negative infinity for compatibility with IEEE 754 and JS's `Number`
- **Canonicalization**: values are normalized (e.g., "1.20" becomes "1.2")

For a detailed explanation of the data model and design decisions, see [Data Model Documentation](./data-model.md).

## String Representation and Parsing

All Decimal values can be converted to and from strings:

```js
// Parsing
const d1 = new Decimal("123.456");
const d2 = new Decimal("-0.0078");
const d3 = new Decimal("6.022e23");

// Formatting
d1.toString(); // => "123.456"
d1.toFixed(2); // => "123.46"
d1.toExponential(2); // => "1.23e+2"
d1.toPrecision(5); // => "123.46"
```

## Common Use Cases

### Financial Calculations

#### Calculate bill with tax

```js
function calculateTotal(subtotal, taxRate) {
  const subtotalDec = new Decimal(subtotal);
  const taxRateDec = new Decimal(taxRate);
  const tax = subtotalDec.multiply(taxRateDec);
  return subtotalDec.add(tax);
}

const total = calculateTotal("99.99", "0.0825");
console.log(total.toFixed(2)); // => "108.24"
```

#### Currency Conversion

```js
const amountUSD = new Decimal("100.00");
const exchangeRate = new Decimal("0.85"); // USD to EUR
const amountEUR = amountUSD.multiply(exchangeRate);
console.log(amountEUR.toFixed(2)); // => "85.00"
```

## Other Documentation

- [Why Decimal?](./why-decimal.md) — Understanding the motivation and use cases for Decimal
- [API Reference](./decimal.md) — Complete API documentation for Decimal
- [Cookbook](./cookbook.md) — Common recipes and patterns for working with Decimal
- [Data Model](./data-model.md) — Detailed explanation of the IEEE 754-2019 Decimal128 subset
