# Risky

Risky is a programming language designed as a proof-of-concept. Risky features a (to my knowledge) original form of what could loosely be called tacit programming.

Risky's operators are overloaded, both by type and arity. It uses a 4-bit code page, so only 16 operators are available.

## Basics

In most golfing languages, operators (called atoms or functions in some languages) form a sort of tree of arguments. Take, for example, the program `1+_2` in a language where `_` is negate (prefix), and `+` is add (infix). You could draw this with the following tree:

```
  +
 / \
1   _
    |
    2
```

With Risky, things work a bit different. Parsing works like this:

1. If the program consists of a single operator, it is a nilad
2. If the program consists of an even number of operators, the first operator is a monad
3. Otherwise, the middle operator is a dyad

For case 2, the remaining operators are treated as a program and given as an argument, and for case 3 both remaining halves are given as arguments.

Take the Risky program `*/2*1--`. This is 7 operators long, so `*` is parsed as a dyad. This splits the program into two arguments to multiply: `*/2`, and `1--`. Both are still odd, so `*/2` becomes `/` with `*` and `2` as arguments, and `11-` becomes `1` with `1` and `-` as arguments.

You'll notice that `*` and `1` have been used as both dyads and nilads in this program. This is the main advantage Risky has for golfing; nilads can be overloaded onto the same operators as monads and dyads, reducing the number of operators required by a significant amount. This is how Risky can get away with having just 16 operators.

This system does have some disadvantages, which makes a small number of operators even more important. Due to the way Risky's dyads work, symmetry is often required. If you were to try to port the `1+_2` program from above into Risky, you would run into a problem. To add numbers, you would use `+`. However, this needs to be in the center of the program for it to be parsed correctly. On the right side you would have `-2` (negation monad and nilad `2`), but on the left side you only need `1`. In order to maintain symmetry, an extra `_` monad (identity) is required.

The resulting program, `_1+-2`, is one operator longer. With small programs this isn't very significant, but under certain conditions large programs can become much larger in Risky. Specifically, Risky programs tend to be much shorter when the tree you draw for it is close to symmetrical. Look at these two (pseudocode) programs:

```
       +
     /   \
   +       +
  / \     / \
 x   x   x   x
```

```
      +
     / \
    x   +
       / \
      x   +
         / \
        x   x
```

Both contain the same number of operators. In a typical tacit (including prefix or postfix) language, they would be equally short. However, in Risky, there is a large difference. The first is perfectly symmetrical, and could be represented with `x+x+x+x`. The second, however, would look something like: `0+0+0+x+0+x+x+x`. This looks a bit ridiculous at first, but when you draw it as a tree it makes more sense why this is required:

```
              +
          /       \
      +               +
    /   \           /   \
  +       +       +       +
 / \     / \     / \     / \
0   0   0   x   0   x   x   x
```

## Format

Risky programs can be formatted either as text (string mode), or raw bits (binary). The differences between these methods are important to keep in mind for certain types of programming challenges, like `[tag:radiation-hardening]`, or for scoring (where string mode uses twice as many bits per operator as binary mode).

**String:**

Risky's string mode uses ASCII, UTF-8, or any other encoding an interpreter will accept. All spaces, `\t` (tabs), `\r` (carriage returns), and `\n` (newlines) will be discarded. Any `;` will be the start of a comment, which is terminated by a `\n` (newline). Note that `\r` will not terminate comments.

**Binary:**

Risky has a 4-bit code page, consisting of 16 operators:

| `x` |         | `x` |         |
| --- | ------- | --- | ------- |
| `0` | **`_`** | `8` | **`/`** |
| `1` | **`?`** | `9` | **`\`** |
| `2` | **`-`** | `a` | **`}`** |
| `3` | **`0`** | `b` | **`+`** |
| `4` | **`1`** | `c` | **`*`** |
| `5` | **`2`** | `d` | **`[`** |
| `6` | **`!`** | `e` | **`:`** |
| `7` | **`{`** | `f` | **`]`** |

In order to pad programs to a whole number of bytes, a trailing `_` should be used. Be aware that if the last character in a program with an even number of operators is `_`, it will be trimmed off. This does not happen in string mode.

Note that whitespace and comments cannot be represented in binary mode.

## Nilads

Risky has two data types: Integer, and Array. Arrays can contain integers or more arrays, or some of both.

Input is handled by the interpreter. The reference implementation accepts an array of inputs, which can be integers, arrays, characters (converted to integers), or strings (converted to arrays of characters), and supports string output.

|         | Nilad |
| ------- | - |
| **`_`** | Inputs |
| **`?`** | Next input |
| **`-`** | `-1` |
| **`0`** | `0` |
| **`1`** | `1` |
| **`2`** | `2` |
| **`!`** | `3` |
| **`{`** | `4` |
| **`/`** | `5` |
| **`\`** | `6` |
| **`}`** | `7` |
| **`+`** | `8` |
| **`*`** | `10` |
| **`[`** | `64` |
| **`:`** | `100` |
| **`]`** | `[]` |

## Monads

Monads other than `_` (identity) are overloaded over numbers and arrays.

|         | Number | Array |
| ------- | - | - |
| **`?`** | `[x]` | `x` |
| **`-`** | Negate | Reverse |
| **`0`** | Range | Transpose |
| **`1`** | Sign | Sort |
| **`2`** | Double | Unique |
| **`!`** | Factorial | Count |
| **`{`** | Log 2 | Slices |
| **`/`** | Factors | Combinations |
| **`\`** | Prime factors | Permutations |
| **`}`** | Square root | Orderings |
| **`+`** | `2 ** x` | Sum |
| **`*`** | `10 ** x` | Product |
| **`[`** | Absolute value | Minimum |
| **`:`** | Is not `0` | Flat |
| **`]`** | Fibonacci | Optimize

Optimize is the only one there that might need a bit of explaining. It takes an array of arrays, finds the one with the minimum first item, and returns the rest of it. For example, `[[1, 0], [0, 4, 6], [2]]` would result in `[4, 6]`.

## Dyads

Risky's dyads are divided into 13 normal dyads, and 3 dynamics. The normal dyads are overloaded over two numbers, array and number, number and array, and two arrays.

|         | Numbers | Array and Number | Number and Array | Arrays |
| ------- | - | - | - | - |
| **`+`** | Add | Copy final | Rotate right | Concat |
| **`-`** | Subtract | Remove | Rotate left | Difference |
| **`*`** | Multiply | Repeat | Join | Join |
| **`/`** | Divide | Group | Split | Split |
| **`\`** | Modulo | Partition | Find | Find |
| **`2`** | Power | Append | Prepend | Append |
| **`{`** | Compare | `x`th item | Slice first | Map to `x`th item |
| **`1`** | Distance | From sig. figs (with exponent) | Farthest | Map pairs |
| **`:`** | Equals | All equal | Combinations | Equals |
| **`!`** | Pair | None equal | Permutations | Cartesian product |
| **`}`** | Base convert | Base convert | Base convert | Base convert |
| **`[`** | GCD | Pad start | Slice from | Intersection |
| **`]`** | LCM | Pad end | Slice final | Union |

Risky has three dynamics, which essentially treat their second argument as a code block. They prepend additional inputs.

- **`_` (NUMBER):** Pass `x` as an input, run once
- **`_` (ARRAY):** Map over all items in `x`, passed as inputs
- **`?` (NUMBER):** Count up from `0`, passing the counter as input, and find the `x`th counter value returning a truthy value
- **`?` (ARRAY):** Filter
- **`0` (NUMBER):** While loop, with `x` passed as input, then the return value of the previous iteration for subsequent ones
- **`0` (ARRAY):** Reduce, with accumulator starting as first item in array, and passed as first input (items are second input)

Any nonzero number is truthy, and any array containing a truthy value is truthy.

## Interpreter

The reference implementation of Risky takes two inputs, and a third optional one. The first is the program, either as a string (string mode) or `Uint8Array` (binary mode). The second is the array of inputs (or a string). The third is an optional boolean value, which will force output either as a string or array of numbers (defaults to whatever form the input is).

You are free to create your own implementations of Risky, or front-ends for the reference implementation. It should perform _exactly_ the same for any inputs (once parsed by the interpreter), so particular attention should be paid to the behavior of Risky's operators in certain edge cases.

## Future

Risky is a proof-of-concept. It is not intended to be particularly well optimized for golfing. Risky is intended to show off the possibilities with "oddfix" (determining the arity of an operator based on some numerical property of the program's length).

It is highly advantageous under certain circumstances, described in detail above. This is due to the massive potential for overloading. Additional data types or an extra one or two bits per operator could easily double, quadruple, or even multiply by ten the number of effective operators, for a serious golfing language. Prefix codes could also help for this.

Currently, depending on how you count, Risky manages to overload about 104 operators into a 4-bit code page (at the cost of shortness in many scenarios). It may or may not be an effective and novel direction to take golfing languages. There are, I suspect, much better ways to decide the arity of an operator, which could help to prevent the harsh symmetry requirements Risky imposes. It's our duty as code golfers to find them ;p
