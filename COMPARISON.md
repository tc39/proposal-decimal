## Relationship of Decimal to other TC39 proposals

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

