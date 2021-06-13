window["risky"] = {
    run: (program, input = [], stringify = null) => {
        var format_program = (program) => {
            var string;

            if (typeof program == "string") {
                string = [...program.split("\n").map(p => p.split(";")[0]).join("")].filter(c => ![" ", "\t", "\r", "\n"].includes(c));

                if (string.find(c => !["_", "?", "-", "0", "1", "2", "!", "{", "/", "\\", "}", "+", "*", "[", ":", "]"].includes(c)))
                    throw {
                        program: "Unknown operator"
                    };

                return string;
            }

            if (program instanceof Uint8Array) {
                string = [...program].map(n => [n / 16 | 0, n % 16]).flat().map(c => ["_", "?", "-", "0", "1", "2", "!", "{", "/", "\\", "}", "+", "*", "[", ":", "]"][c]);

                if (string[string.length - 1] == "_")
                    return string.slice(0, -1);

                return string;
            }

            throw {
                program: "Invalid program format"
            };
        };

        program = format_program(program);

        var format_input = (input) => {
            if (input === null || input === undefined)
                return [];

            if (typeof input == "number" && !Number.isNaN(input) && Number.isFinite(input))
                return [BigInt(Math.floor(input))];

            if (typeof input == "bigint")
                return [input];

            if (typeof input == "boolean")
                return [input ? 1n : 0n];

            if (typeof input == "string" && input.length <= 1)
                return input ? [BigInt(input.codePointAt())] : [];

            if (typeof input == "string")
                return [[...input].map(i => BigInt(i.codePointAt()))];

            if (Array.isArray(input))
                return [input.reduce((t, i) => t.concat(format_input(i)), [])];

            throw "Invalid input format";
        };

        if (!Array.isArray(input) && typeof input != "string")
            throw "Invalid input format";

        if (stringify == null)
            stringify = typeof input == "string";

        input = format_input(input)[0];

        if (program.length == 0)
            return stringify ? "" : [];

        var parse = (group) => {
            if (group.length == 1)
                return {
                    operator: group[0],
                    data: []
                };

            if (!(group.length % 2))
                return {
                    operator: group[0],
                    data: [parse(group.slice(1))]
                };

            return {
                operator: group[group.length / 2 | 0],
                data: [parse(group.slice(0, group.length / 2 | 0)), parse(group.slice(-(group.length / 2 | 0)))]
            };
        };

        var is_number = (data) => !Array.isArray(data);
        var is_array = (data) => Array.isArray(data);

        var count = (array) => BigInt(array.length);

        var identical = (d_0, d_1) => {
            if (is_number(d_0) && is_number(d_1))
                return d_0 == d_1 ? 1n : 0n;

            if (is_array(d_0) && is_array(d_1))
                return count(d_0) == count(d_1) && d_0.every((d, i) => identical(d, d_1[i])) ? 1n : 0n;

            return 0n;
        };

        var compare = (a, b) => {
            if (is_number(a) && is_number(b))
                return a == b ? 0n : a < b ? -1n : 1n;

            if (is_array(a) && is_number(b))
                return compare(a, [b]);

            if (is_number(a) && is_array(b))
                return compare([a], b);

            if (is_array(a) && is_array(b)) {
                for (var r, i = 0n; i < count(a) && i < count(b); i++)
                    if ((r = compare(a[i], b[i])) != 0n)
                        return r;

                if (count(a) > count(b))
                    return 1n;

                if (count(b) > count(a))
                    return -1n;

                return 0n;
            }
        };

        var positive = (number) => number < 0n ? -number : number;

        var n_min = (...numbers) => numbers.slice(1).reduce((m, n) => m < n ? m : n, numbers[0]);
        var n_max = (...numbers) => numbers.slice(1).reduce((x, n) => x > n ? x : n, numbers[0]);

        var range = (...bounds) => {
            bounds = bounds.map(b => BigInt(b));

            var array = [...Array(Number(bounds[0] < bounds[1] ? bounds[1] - bounds[0] : bounds[0] - bounds[1]))];
            var step = bounds[0] < bounds[1] ? 1n : -1n;

            return array.map((_, i) => bounds[0] + BigInt(i) * step);
        };

        var unique = (array) => {
            var items = [];

            for (var i = 0n; i < count(array); i++)
                if (!items.find(n => identical(array[i], n)))
                    items.push(array[i]);

            return items;
        };

        var factorial = (number) => {
            if (number < 0n)
                return -factorial(-number);

            if (number <= 1n)
                return 1n;

            for (var i = number - 1n; i > 1n; i--)
                number *= i;

            return number;
        };

        var root = (number) => {
            if (number < 0n)
                return -root(-number);

            if (number <= 1n)
                return number;

            var x_0 = number / 2n;
            var x_1 = (x_0 + number / x_0) / 2n;

            while (x_1 < x_0) {
                x_0 = x_1;

                x_1 = (x_0 + number / x_0) / 2n;
            }

            return x_0;
        };

        var log_2 = (number) => {
            if (number <= 0n)
                return 0n;

            var x = 0n;

            while (2n ** x <= number)
                x += 1n;

            return x - 1n;
        };

        var factors = (number) => {
            number = positive(number);

            var factors = [];

            if (number > 1n)
                factors.push(1n);

            for (var i = 2n; i ** 2n <= number; i++)
                if (number % i == 0n)
                    factors.push(i, number / i);

            return unique(factors).sort((a, b) => Number(a - b));
        };

        var prime_factors = (number) => {
            number = positive(number);

            var factors = [];

            var n = 2n;

            while (number > 1n) {
                while (number % n)
                    n++;

                number /= n;
                factors.push(n);
            }

            return factors;
        };

        var remove_first = (array, item) => {
            var index = array.findIndex(n => identical(n, item));

            if (index == -1)
                return array;

            return array.slice(0, index).concat(array.slice(index + 1));
        };

        var remove = (array, item) => array.filter(d => !identical(d, item));

        var union = (...arrays) => {
            var items = [];

            for (var j, k, l, i = 0n; i < count(arrays); i++) {
                for (j = 0n; j < count(arrays[i]); j++) {
                    k = arrays[i][j];
                    l = count(arrays[i]);

                    items.push(k);

                    arrays = arrays.map(a => remove_first(a, k));

                    if (count(arrays[i]) != l)
                        j--;
                }
            }

            return items;
        };

        var intersection = (...arrays) => {
            var items = [];

            for (var j, k, l, i = 0n; i < count(arrays); i++) {
                for (j = 0n; j < count(arrays[i]); j++) {
                    k = arrays[i][j];

                    if (arrays.every(a => a.find(n => identical(k, n)))) {
                        l = count(arrays[i]);

                        items.push(k);

                        arrays = arrays.map(a => remove_first(a, k));

                        if (count(arrays[i]) != l)
                            j--;
                    }
                }
            }

            return items;
        };

        var difference = (...arrays) => {
            var other = arrays[1];
            var items = [];

            for (var j, p, i = 0n; i < count(arrays[0]); i++) {
                p = 1;

                for (j = 0n; j < count(other); j++) {
                    if (identical(arrays[0][i], other[j])) {
                        p = 0;

                        other = [...other.slice(0, Number(j)), ...other.slice(Number(j) + 1)];

                        break;
                    }
                }

                if (p)
                    items.push(arrays[0][i]);
            }

            return items;
        };

        var flat = (array) => array.flat();

        var slices = (array) => {
            var result = [[]];

            for (var j, i = 1n; i <= count(array); i++)
                for (j = 0n; j <= count(array) - i; j++)
                    result.push(array.slice(Number(j), Number(j + i)));

            return result;
        };

        var combinations = (array) => {
            var result = [];

            for (var j, i = 0n; i < 2n ** count(array); i++) {
                result.push([]);

                for (j = 0n; j < count(array); j++)
                    if (i & 2n ** j)
                        result[i].push(array[j]);
            }

            return result.sort((a, b) => Number(count(a) - count(b)));
        };

        var orderings = (array) => {
            var result = [];

            for (var a, n, f, j, i = 0n; i < factorial(count(array)); i++) {
                a = array;
                n = i;

                result.push([]);

                for (j = 0n; j < count(array); j++) {
                    f = factorial(count(array) - j - 1n);

                    result[i].push(a[n / f]);
                    a = a.filter((_, k) => k != n / f);

                    n %= f;
                }
            }

            return result;
        };

        var parity = (number) => {
            if (number < 0n)
                number = -number;

            var numbers = [number, 0n];

            numbers[1] = 2n ** (log_2(numbers[0]) + BigInt(numbers[0] != 0n));

            var parity = 0n;

            for (var i = 1n; i < numbers[1]; i *= 2n)
                parity += numbers[0] & i ? 1n : 0n;

            return parity;
        };

        var combinations_n = (array, number) => {
            var result = [];

            for (var j, k = -1n, i = 0n; i < 2n ** count(array); i++) {
                if (parity(i) != number)
                    continue;

                result.push([]);

                k++;

                for (j = 0n; j < count(array); j++)
                    if (i & 2n ** BigInt(j))
                        result[k].push(array[j]);
            }

            return result.sort((a, b) => Number(count(a) - count(b)));
        };

        var permutations = (array) => flat(combinations(array).map(n => orderings(n)));
        var permutations_n = (array, number) => flat(combinations_n(array, number).map(n => orderings(n)));

        var slice_first = (array, amount) => array.slice(0, Number(amount));
        var slice_from = (array, amount) => array.slice(Number(amount));
        var slice_final = (array, amount) => array.slice(Number(amount == 0n ? count(array) : -amount));

        var rotate_left = (array, amount) => {
            if (count(array) == 0n)
                return array;

            var bound = amount % count(array);

            return slice_from(array, bound).concat(slice_first(array, bound));
        };

        var rotate_right = (array, amount) => {
            if (count(array) == 0n)
                return array;

            var bound = -amount % count(array);

            return slice_from(array, bound).concat(slice_first(array, bound));
        };

        var multiply = (array, amount) => {
            if (amount == 0n)
                return [];

            if (amount < 0n)
                array = [...array].reverse();

            return flat(range(0n, amount).map(_ => array));
        };

        var group = (array, number) => {
            var original = number;

            if (number == 0n)
                return [array];

            if (number < 0n) {
                number *= -1n;
                array = [...array].reverse();
            }

            var groups = [];

            for (var g = -1n, i = 0n; i < count(array); i++) {
                if (g == -1n || count(groups[g]) == number) {
                    groups.push([]);

                    g++;
                }

                groups[g].push(array[i]);
            }

            if (original < 0n) {
                groups.map(r => r.reverse());
                groups.reverse();
            }

            return groups;
        };

        var positive_position = (array, position) => {
            return position < 0n ? (-position <= count(array) ? count(array) + position : 0n) : (position < count(array) ? position : 0n);
        };

        var item = (array, position) => array[positive_position(array, position)];

        var split = (array, items) => {
            if (is_number(items))
                items = [items];

            var groups = [[]];

            for (var g = 0n, i = 0n; i < count(array); i++) {
                if (identical(array.slice(Number(i), Number(i + count(items))), items)) {
                    groups.push([]);

                    g++;

                    i += count(items) - 1n;

                    continue;
                }

                groups[g].push(array[i]);
            }

            return groups;
        };

        var join = (groups, items) => {
            if (count(groups) == 0n)
                return [];

            if (is_number(items))
                items = [items];

            var array = [];

            groups.slice(0, -1).map(g => (array = array.concat(g, items)));

            return array.concat(groups[count(groups) - 1n]);
        };

        var positions = (array, items) => {
            if (is_number(items))
                items = [items];

            var positions = [];

            for (var i = 0n; i < count(array); i++) {
                if (identical(array.slice(Number(i), Number(i + count(items))), items)) {
                    positions.push(i);

                    i += count(items) - 1n;

                    continue;
                }
            }

            return positions;
        };

        var floored_division = (...numbers) => {
            return (numbers[0] / numbers[1]) - (numbers[0] % numbers[1] && numbers[0] * numbers[1] < 0n ? 1n : 0n);
        };

        var ceiling_division = (...numbers) => {
            return (numbers[0] / numbers[1]) + (numbers[0] % numbers[1] && numbers[0] * numbers[1] > 0n ? 1n : 0n);
        };

        var modulo = (...numbers) => {
            return numbers[1] ? numbers[0] - numbers[1] * floored_division(...numbers) : 0n;
        };

        var remainder = (...numbers) => modulo(...numbers.map(positive));

        var partition = (array, position) => [slice_first(array, position), slice_from(array, position)];

        var array_base = (data, base) => {
            var to_array_base = (number, base) => {
                number = positive(number);

                if (count(base) <= 1n)
                    return [];

                if (number == 0n)
                    return [base[0]];

                var r;

                var result = [];

                while (number) {
                    r = remainder(number, count(base));

                    result.push(base[r]);

                    number = number / count(base);
                }

                return result.reverse();
            };

            var from_array_base = (array, base) => {
                return array.reduce((n, f) => n * count(base) + (count(positions(base, f)) != 0n ? positions(base, f)[0] : 0n), 0n);
            };

            if (is_number(data))
                return to_array_base(data, base);

            return from_array_base(data, base);
        };

        var number_base = (data, base) => {
            var to_number_base = (number, base) => {
                var original = number;

                if (base > 0n)
                    number = positive(number);

                if (positive(base) <= 1n)
                    return multiply([base], number);

                if (number == 0n)
                    return [0];

                var r;

                var result = [];

                while (number) {
                    r = remainder(number, base);

                    result.push(r);

                    number = (base < 0n ? ceiling_division : floored_division)(number, base);
                }

                if (base > 0n && original < 0n)
                    result = result.map(r => -r);

                return result.reverse();
            };

            var from_number_base = (array, base) => {
                return array.reduce((n, i) => n * base + (is_number(i) ? i : from_number_base(i, base)), 0n);
            };

            if (is_number(data))
                return to_number_base(data, base);

            return from_number_base(data, base);
        };

        var convert = (data, base) => is_number(base) ? number_base(data, base) : array_base(data, base);

        var gcd = (...numbers) => {
            return intersection(...numbers.map(n => prime_factors(n))).reduce((t, n) => t * n, 1n) * (numbers[0] < 0n || numbers[1] < 0n ? -1n : 1n);
        };

        var lcm = (...numbers) => {
            return union(...numbers.map(n => prime_factors(n))).reduce((t, n) => t * n, 1n) * (numbers[0] < 0n || numbers[1] < 0n ? -1n : 1n);
        };

        var pad_start = (array, width) => {
            width = n_max(width, 0n);

            return width <= count(array) ? slice_final(array, width) : multiply([0n], width - count(array)).concat(array);
        };

        var pad_right = (array, width) => {
            width = n_max(width, 0n);

            return width <= count(array) ? slice_first(array, width) : array.concat(multiply([0n], width - count(array)));
        };

        var distance = (...numbers) => numbers[0] < numbers[1] ? numbers[1] - numbers[0] : numbers[0] - numbers[1];

        var farthest = (numbers, from) => {
            while (numbers.some(n => is_array(n)))
                numbers = flat(numbers);

            if (count(numbers) == 0n)
                return from;

            var max = 0n;

            for (var i = 0n; i < count(numbers); i++)
                max = distance(numbers[i], from) > max ? distance(numbers[i], from) : max;

            return numbers.find(n => distance(n, from) == max);
        };

        var map_pairs = (array, pairs) => {
            pairs = pairs.map(p => is_number(p) ? [p] : p).filter(p => count(p) != 0n).map(p => [p, 0n]).reverse();

            return array.map(d => {
                var pair = pairs.find(p => identical(p[0][0], d));

                if (!pair)
                    return d;

                pair[1]++;

                if (count(pair[0]) == 1n)
                    return null;

                return pair[0][(pair[1] - 1n) % (count(pair[0]) - 1n) + 1n];
            }).filter(d => d !== null);
        };

        var power = (...numbers) => {
            if (numbers[0] == 0n && numbers[1] < 0n)
                return 0n;

            var p_base = positive(numbers[0]) ** positive(numbers[1]) * (numbers[0] < 0n ? -1n : 1n) ** positive(numbers[1]);

            return numbers[1] < 0 ? 1n / p_base : p_base;
        };

        var insert_first = (array, item) => [item, ...array];
        var insert_final = (array, item) => [...array, item];

        var fibonacci = (number) => {
            var initial = [0n, 1n];

            if (number == 0n)
                return initial[0];

            if (number < 0n) {
                for (var i = 1n; i > number; i--)
                    initial = [initial[1] - initial[0], initial[0]];
            } else {
                for (var i = 1n; i < number; i++)
                    initial = [initial[1], initial[0] + initial[1]];
            }

            return initial[1];
        };

        var minimum = (array) => {
            var minimum = null;

            if (count(array) == 0n)
                return 0n;

            for (var i = 0n; i < count(array); i++)
                minimum = minimum === null || minimum > array[i] ? array[i] : minimum;

            return minimum;
        };

        var optimize = (pairs) => {
            pairs = pairs.map(p => is_number(p) ? [p] : p).filter(p => count(p) != 0n);

            var optimal = minimum(pairs.map(p => p[0]));

            return pairs.find(p => p[0] == optimal).slice(1);
        };

        var cartesian_product = (...arrays) => {
            var result = [];

            if (arrays.some(a => count(a) == 0n))
                return [];

            var i, n, j, r;

            for (i = 0n; i < arrays.reduce((t, a) => t * count(a), 1n); i++) {
                n = i;

                for (r = [], j = count(arrays) - 1n; j >= 0n; j--) {
                    r.unshift(arrays[j][n % count(arrays[j])]);

                    n = n / count(arrays[j]);
                }

                result.push(r);
            }

            return result;
        };

        var truthy = (data) => BigInt(is_number(data) ? data != 0n : data.some(d => truthy(d)));

        var interpret;

        var input_pointer = [0n];

        var nilad = (operator, inputs) => {
            if (operator == "?")
                input_pointer[count(input_pointer) - 1n]++;

            return ({
                "_": inputs,
                "?": count(inputs) == 0n ? 0n : inputs[(input_pointer[count(input_pointer) - 1n] - 1n) % count(inputs)],
                "-": -1n,
                "0": 0n,
                "1": 1n,
                "2": 2n,
                "!": 3n,
                "{": 4n,
                "/": 5n,
                "\\": 6n,
                "}": 7n,
                "+": 8n,
                "*": 10n,
                "[": 64n,
                ":": 100n,
                "]": []
            })[operator];
        };

        var monad = (operator, data, inputs) => {
            var overload = (data, number, array) => is_number(data) ? number(data) : array(data);

            switch (operator) {
                case "_":
                    return interpret(data, inputs);
                case "?":
                    return overload(
                        interpret(data, inputs),
                        (number) => [number],
                        (array) => array
                    );
                case "-":
                    return overload(
                        interpret(data, inputs),
                        (number) => -number,
                        (array) => [...array].reverse()
                    );
                case "0":
                    return overload(
                        interpret(data, inputs),
                        (number) => range(0n, number),
                        (array) => {
                            array = array.map(a => is_array(a) ? a : [a]);

                            var max = array.reduce((x, n) => count(n) > x ? count(n) : x, 0);

                            return range(0n, max).map(i => array.map(d => i in d ? d[i] : null).filter(d => d !== null));
                        }
                    );
                case "1":
                    return overload(
                        interpret(data, inputs),
                        (number) => number == 0n ? 0n : number >= 1n ? 1n : -1n,
                        (array) => array.sort((a, b) => Number(compare(a, b)))
                    );
                case "2":
                    return overload(
                        interpret(data, inputs),
                        (number) => number * 2n,
                        unique
                    );
                case "!":
                    return overload(
                        interpret(data, inputs),
                        factorial,
                        count
                    );
                case "{":
                    return overload(
                        interpret(data, inputs),
                        log_2,
                        slices
                    );
                case "/":
                    return overload(
                        interpret(data, inputs),
                        factors,
                        combinations
                    );
                case "\\":
                    return overload(
                        interpret(data, inputs),
                        prime_factors,
                        permutations
                    );
                case "}":
                    return overload(
                        interpret(data, inputs),
                        root,
                        orderings
                    );
                case "+":
                    return overload(
                        interpret(data, inputs),
                        (number) => power(2n, number),
                        (array) => array.reduce((t, n) => t + n, 0n)
                    );
                case "*":
                    return overload(
                        interpret(data, inputs),
                        (number) => power(10n, number),
                        (array) => array.reduce((t, n) => t * n, 1n)
                    );
                case "[":
                    return overload(
                        interpret(data, inputs),
                        positive,
                        minimum
                    );
                case ":":
                    return overload(
                        interpret(data, inputs),
                        (number) => number != 0n ? 1n : 0n,
                        flat
                    );
                case "]":
                    return overload(
                        interpret(data, inputs),
                        fibonacci,
                        optimize
                    );
            }
        };

        var d_interpret = (group, inputs = []) => {
            var data;

            input_pointer.push(0n);

            data = interpret(group, inputs);

            input_pointer.pop();

            return data;
        };

        var d_with = (run, data, inputs) => d_interpret(run, [data, ...inputs]);
        var d_for = (run, data, inputs) => data.map(d => d_interpret(run, [d, ...inputs]));

        var d_of = (run, data, inputs) => {
            var i = 0n;
            var t = 0n;

            var r;

            while (1) {
                r = d_interpret(run, [i, ...inputs]);

                if (truthy(r)) {
                    t++;

                    if (t > data)
                        return i;
                }

                i++;
            }
        };

        var d_filter = (run, data, inputs) => data.filter(d => truthy(d_interpret(run, [d, data, ...inputs])));

        var d_while = (run, data, inputs) => {
            var d = data;
            var r = [d];

            while (truthy(d)) {
                d = d_interpret(run, [d, ...inputs]);

                r.push(d);
            }

            return r;
        };

        var d_reduce = (run, data, inputs) => data.length ? data.slice(1).reduce((a, d) => d_interpret(run, [a, d, ...inputs]), data[0]) : 0n;

        var dyad = (operator, data, inputs) => {
            var overload = (data, n_n, a_n, n_a, a_a) => is_number(data[1]) ? is_number(data[0]) ? n_n(...data) : a_n(...data) : is_number(data[0]) ? n_a(...data) : a_a(...data);

            var opp = (f) => (d_0, d_1) => f(d_1, d_0);

            var dynamic = (data, run, number, array) => is_number(data) ? number(run, data, inputs) : array(run, data, inputs);

            switch (operator) {
                case "_":
                    return dynamic(
                        interpret(data[0], inputs),
                        data[1],
                        d_with,
                        d_for
                    );
                case "?":
                    return dynamic(
                        interpret(data[0], inputs),
                        data[1],
                        d_of,
                        d_filter
                    );
                case "-":
                    return overload(
                        data.map(d => interpret(d, inputs)),
                        (...numbers) => numbers[0] - numbers[1],
                        remove,
                        opp(rotate_left),
                        difference
                    );
                case "0":
                    return dynamic(
                        interpret(data[0], inputs),
                        data[1],
                        d_while,
                        d_reduce
                    );
                case "1":
                    return overload(
                        data.map(d => interpret(d, inputs)),
                        distance,
                        (array, number) => number_base(number < 0 ? slice_first(array, number) : pad_right(array, number + count(array)), 10n),
                        opp(farthest),
                        map_pairs
                    );
                case "2":
                    return overload(
                        data.map(d => interpret(d, inputs)),
                        power,
                        insert_final,
                        opp(insert_first),
                        insert_final
                    );
                case "!":
                    return overload(
                        data.map(d => interpret(d, inputs)),
                        (...numbers) => [numbers[0], numbers[1]],
                        (array, number) => BigInt(!array.some(d => identical(d, number))),
                        opp(permutations_n),
                        cartesian_product
                    );
                case "{":
                    return overload(
                        data.map(d => interpret(d, inputs)),
                        compare,
                        item,
                        opp(slice_first),
                        (array, positions) => positions.map(p => item(array, p))
                    );
                case "/":
                    return overload(
                        data.map(d => interpret(d, inputs)),
                        (...numbers) => numbers[1] == 0n ? 0n : numbers[0] / numbers[1],
                        group,
                        opp(split),
                        split
                    );
                case "\\":
                    return overload(
                        data.map(d => interpret(d, inputs)),
                        modulo,
                        partition,
                        opp(positions),
                        positions
                    );
                case "}":
                    return convert(...data.map(d => interpret(d, inputs)));
                case "+":
                    return overload(
                        data.map(d => interpret(d, inputs)),
                        (...numbers) => numbers[0] + numbers[1],
                        (array, number) => array.concat(slice_final(array, number)),
                        opp(rotate_right),
                        (...arrays) => arrays[0].concat(arrays[1])
                    );
                case "*":
                    return overload(
                        data.map(d => interpret(d, inputs)),
                        (...numbers) => numbers[0] * numbers[1],
                        multiply,
                        opp(join),
                        join
                    );
                case "[":
                    return overload(
                        data.map(d => interpret(d, inputs)),
                        gcd,
                        pad_start,
                        opp(slice_from),
                        intersection
                    );
                case ":":
                    return overload(
                        data.map(d => interpret(d, inputs)),
                        identical,
                        (array, number) => BigInt(array.every(d => identical(d, number))),
                        opp(combinations_n),
                        identical
                    );
                case "]":
                    return overload(
                        data.map(d => interpret(d, inputs)),
                        lcm,
                        pad_right,
                        opp(slice_final),
                        union
                    );
            }
        };

        var interpret = (group, inputs = []) => {
            if (count(group.data) == 0n)
                return nilad(group.operator, inputs);

            if (count(group.data) == 1n)
                return monad(group.operator, group.data[0], inputs);

            if (count(group.data) == 2n)
                return dyad(group.operator, group.data, inputs);
        };

        var format_string = (data) => {
            if (is_number(data))
                data = [data];

            while (data.some(d => is_array(d)))
                data = flat(data);
            
            return data.map(c => {
                try {
                    return String.fromCodePoint(Number(c));
                } catch (e) {
                    return "";
                }
            }).join("");
        };

        return !stringify ? interpret(parse(program), input) : format_string(interpret(parse(program), input));
    },
    compress: (program) => [...program.split("\n").map(p => p.split(";")[0]).join("")].filter(c => ["_", "?", "-", "0", "1", "2", "!", "{", "/", "\\", "}", "+", "*", "[", ":", "]"].includes(c)).join("")
};
