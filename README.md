# Risky

Risky is a programming language designed as a proof-of-concept by Redwolf Programs. Risky features a (to my knowledge) original form of what could loosely be called tacit programming.

Risky's operators are overloaded both by type, and arity. It uses a 4-bit code page, so only 16 operators are available.

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

Take, for example, the Risky program `*/2*1--`. This is 7 operators long, so `*` is parsed as a dyad. This splits the program into two arguments to multiply: `*/2`, and `1--`. Both are still odd, so `*/2` becomes `/` with `*` and `2` as arguments, and `11-` becomes `1` with `1` and `-` as arguments.

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

## Operators

_To be continued_
