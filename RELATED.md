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

We plan to investigate the experiences and feedback developers have had with these and other existing JavaScript libraries so that we can learn from them in the design of BigDecimal. The discussion continues in [#22](https://github.com/littledan/proposal-bigdecimal/issues/22).

### Related features in other systems

Due to the overwhelming evidence listed above that decimal is an important data type in programming, many different programming languages, databases and standards include decimal, rationals, or similar features. Below is a partial listing, with a summary of the semantics in each.

- Standards
  - **IEEE 754**-2008 and later: 32-bit, 64-bit and 128-bit decimal; see [explanation](https://en.wikipedia.org/wiki/Decimal_floating_point#IEEE_754-2008_encoding) (recommends against using 32-bit decimal)
  - (plus many of the below are standardized)
- Programming languages
  - Fixed-size decimals:
    - **[C](http://www.open-std.org/JTC1/SC22/WG14/www/docs/n1312.pdf)**: 32, 64 and 128-bit IEE 754 decimal types, with a global settings object. Still a proposal, but has a GCC implementation.
    - **[C++](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2014/n3871.html)**: Early proposal work in progress, to be based on IEEE 64 and 128-bit decimal. Still a proposal, but has a GCC implementation.
    - **[C#](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/decimal)**/**[.NET](<https://msdn.microsoft.com/en-us/library/system.decimal(v=vs.110).aspx>)**: Custom 128-bit decimal semantics with slightly different sizes for the mantissa vs exponent compared to IEEE.
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
  - [POWER6](<https://www.ibm.com/developerworks/community/wikis/home?lang=en#!/wiki/Power+Systems/page/POWER6+Decimal+Floating+Point+(DFP)>)
  - [RISC-V](https://en.wikichip.org/wiki/risc-v/standard_extensions) (planned)

### History of discussion of decimal in TC39

Decimal has been under discussion in TC39 for a very long time, with proposals and feedback from many people including Sam Ruby, Mike Cowlishaw, Brendan Eich, Waldemar Horwat, Maciej Stachowiak, Dave Herman and Mark Miller.

- A new `decimal` type was long planned for ES4, see [Proposed ECMAScript 4th Edition – Language Overview](https://www.ecma-international.org/activities/Languages/Language%20overview.pdf)
- In the following ES3.1/ES5 effort, discussions about a decimal type continued on es-discuss, e.g., [[1]](https://mail.mozilla.org/pipermail/es-discuss/2008-August/007244.html) [[2]](https://mail.mozilla.org/pipermail/es-discuss/2008-September/007466.html)
- Decimal was discussed at length in the development of ES6. It was eventually rolled into the broader typed objects/value types effort, which didn't make it into ES6, but is being incrementally developed now (see the below section about relationship to other TC39 proposals).
