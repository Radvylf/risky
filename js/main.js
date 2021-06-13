window.onload = function() {
    var page = {
        code: document.getElementById("code"),
        brackets: document.getElementById("brackets"),
        input: document.getElementById("input"),
        invalid: document.getElementById("invalid"),
        run: document.getElementById("run"),
        type: document.getElementById("type"),
        output: document.getElementById("output"),
        cgcc: document.getElementById("cgcc")
    };
    
    var get_p = () => {
        var result = null;
        var items = location.search.slice(1).split("&");
        
        for (let p, i = 0; i < items.length; i++) {
            p = items[i].split("=");
            
            if (p[0] == "p")
                return p[1];
        }
        
        return "";
    };
    
    var program = atob(get_p().replace(/_/g, "/").replace(/-/g, "+"));
    
    if (program)
        [page.code.value, page.input.value, page.type.selectedIndex] = JSON.parse(program);
    
    (page.code.oninput = page.input.oninput = function() {
        var code = page.code.value;
        
        var web_safe = (data) => btoa(data).replace(/\//g, "_").replace(/\+/g, "-").replace(/=/g, "");
        
        page.cgcc.value = "[dotcomma](https://github.com/RedwolfPrograms/dotcomma), " +
            code.length + " bytes\n\n```dotcomma\n" + code + "\n```\n\n[Try it online!]" +
            "(https://redwolfprograms.github.io/dotcomma/?p=" + web_safe(JSON.stringify([code, page.input.value, page.type.selectedIndex])) + ")";
        
        page.brackets.style.display = "";
        page.invalid.style.display = "";
    })();
    
    page.run.onclick = async function() {
        var code = page.code.value;
        
        try {
            var input = eval(page.input.value);
            
            if (input === undefined)
                input = [];
        } catch (e) {
            page.invalid.textContent = "Invalid input: " + e.message;
            page.invalid.style.display = "block";
            
            return;
        }
        
        var string_out = [undefined, false, true, false][page.type.selectedIndex];
        
        // Define useful function(s)

        var to_id = function(char) {
            return [1, 0, 0, -1]["[.,]".indexOf(char)];
        };

        // Validate and format input

        switch (typeof input) {
            case "number":
                input = [BigInt(Math.trunc(input || 0))];
                break;
            case "bigint":
                input = [input];
                break;
            case "string":
                string_out = string_out === undefined ? true : string_out;
                input = input.split("").map(c => BigInt(c.codePointAt(0))).reverse();
                break;
            case "boolean":
                input = [input ? 1n : 0n];
                break;
            default:
                if (!Array.isArray(input)) {
                    page.invalid.textContent = "Invalid input";
                    page.invalid.style.display = "block";

                    return;
                }
                
                try {
                    input = [].concat.apply([], input.map((i, n) => {
                        switch (typeof i) {
                            case "number":
                                return [BigInt(Math.trunc(i || 0))];
                            case "bigint":
                                return [i];
                            case "string":
                                return i.split("").map(c => BigInt(c.codePointAt(0))).reverse();
                            case "boolean":
                                return [i ? 1n : 0n];
                            default:
                                page.invalid.textContent = "Invalid input: input[" + n + "]";
                                page.invalid.style.display = "block";

                                throw "Invalid input";
                        }
                    })).reverse();
                } catch (e) {
                    return;
                }
        }

        // Remove comments and detect unbalanced brackets

        code = code.replace(/[^[.,\]]+/g, "");

        {
            let depth = 0;

            for (let i = 0; i < code.length; i++) {
                depth += to_id(code[i]);

                if (depth < 0) {
                    page.brackets.textContent = "Unbalanced brackets";
                    page.brackets.style.display = "block";

                    return;
                }
            }

            if (depth) {
                page.brackets.textContent = "Unbalanced brackets";
                page.brackets.style.display = "block";

                return;
            }
        }

        // Ensure code is wrapped in brackets

        for (let d = 0, i = 0; i < code.length - 1; i++) {
            d += to_id(code[i]);

            if (!d) {
                code = "[" + code + "]";
                break;
            }
        }

        // Interpret

        var ptr = 0;
        var blocks = [];
        var last = 0n;
        var loop = [];
        var queue = [...input];
        var jtw = 256;

        var parent = function() {
            var result = blocks;
            var next = result[result.length - 1];

            while (Array.isArray(next[next.length - 1])) {
                result = result[result.length - 1];
                next = next[next.length - 1];
            }

            return result;
        };

        var block = function() {
            var result = blocks;

            while (Array.isArray(result[result.length - 1]))
                result = result[result.length - 1];

            return result;
        };

        var alternative = function(data) {
            if (data === undefined || data === null)
                return -1n;
            return data;
        };

        while (ptr < code.length) {
            switch (code[ptr]) {
                case "[":
                    if (code[ptr - 1] == "," && last < 0) {

                        for (let d = 0, i = ptr; i < code.length; i++) {
                            d += to_id(code[i]);
                            if (!d) {
                                ptr = i;
                                break;
                            }
                        }

                        block().push(null);
                        last = 0n;

                        break;
                    }

                    if (code[ptr - 1] == "." && !last) {
                        for (let d = 0, i = ptr; i < code.length; i++) {
                            d += to_id(code[i]);
                            if (!d) {
                                ptr = i;
                                break;
                            }
                        }

                        block().push(null);
                        last = 0n;

                        break;
                    }

                    block().push([]);
                    loop.push(code[ptr - 1] == ".");
                    last = 0n;

                    break;
                case ".":
                    if (code[ptr - 1] == "[")
                        last = 1n;
                    if (code[ptr - 1] == "]")
                        last = block().reduce((a, r) => a + (r || 0n), 0n);
                    block().length = 0;
                    break;
                case ",":
                    if (code[ptr - 1] == "[")
                        last = alternative(queue.pop());
                    else if (code[ptr - 1] == "]")
                        last = alternative(block().pop());
                    block.length = 0;
                    if (code[ptr + 1] == "]" && last >= 0)
                        queue.unshift(last);
                    break;
                case "]":
                    parent().pop();
                    block().push(last);

                    if (loop.pop()) {
                        if (last) {
                            if (!--jtw) {
                                await new Promise(resolve => setTimeout(resolve, 0));
                                
                                jtw = 256;
                            }
                            
                            for (let d = 0, i = ptr; i >= 0; i--) {
                                d += to_id(code[i]);
                                if (!d) {
                                    ptr = i;
                                    break;
                                }
                            }

                            block().push([]);
                            loop.push(true);
                            last = 0n;

                            break;
                        }
                    }

                    last = 0n;

                    break;
            }

            ptr += 1;
        }

        // Return output, by default formats as string if input was string

        queue.reverse();

        var output = "";
        
        try {
            switch (page.type.value) {
                case "Default":
                    output = string_out ? queue.map(c => String.fromCodePoint(Number(BigInt.asIntN(32, c)))).join("") : JSON.stringify(queue.map(n => n.toString() + "n")).replace(/"/g, "");
                    
                    break;
                case "Numbers":
                    output = JSON.stringify(queue.map(n => n.toString() + "n")).replace(/"/g, "");
                    
                    break;
                case "Text":
                    output = queue.map(c => String.fromCodePoint(Number(BigInt.asIntN(32, c)))).join("");
                    
                    break;
                case "Binary (xxd)":
                    output = [];
                    
                    for (let o, i = 0; i < queue.length; i += 16) {
                        o = i.toString(16).padStart(8, "0") + ": ";
                        
                        for (let j = 0; j < Math.min(16, queue.length - i); j++) {
                            o += (queue[i + j] % 256n).toString(16).padStart(2, "0");
                            
                            if (j % 2)
                                o += " ";
                        }
                        
                        o = o.padEnd(51, " ") + queue.slice(i, i + 16).map(c => String.fromCodePoint(Number(BigInt.asIntN(32, c % 256n))).replace(/[^ -~]/g, ".")).join("");
                        
                        output.push(o);
                    }
                    
                    output = output.join("\n");
                    
                    break;
            }
        } catch (e) {
            output = JSON.stringify(queue.map(n => n.toString() + "n")).replace(/"/g, "");
            
            console.log(e);
        }
        
        page.output.value = output;
        
        page.brackets.style.display = "";
        page.invalid.style.display = "";
    };
};