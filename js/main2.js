window.onload = function() {
    var layout = {
        program: document.getElementById("program"),
        invalid_program: document.getElementById("invalid_program"),
        input: document.getElementById("input"),
        invalid_input: document.getElementById("invalid_input"),
        run: document.getElementById("run"),
        stringify: document.getElementById("stringify"),
        result: document.getElementById("result"),
        cgcc_post: document.getElementById("cgcc_post")
    };
    
    var interpreter = window["risky"];
    
    if (!interpreter)
        throw "Interpreter not found";
    
    var save = () => {
        return btoa(JSON.stringify([
            layout.program.value, layout.input.value, layout.stringify.selectedIndex
        ])).replace(/\//g, "_").replace(/\+/g, "-").replace(/=/g, "");
    };
    
    var restore = () => {
        var find_program = () => {
            var result = null;
            var items = location.search.slice(1).split("&");

            for (let p, i = 0; i < items.length; i++) {
                p = items[i].split("=");

                if (p[0] == "p")
                    return p[1];
            }

            return "";
        };
        
        if (!find_program())
            return;
        
        [layout.program.value, layout.input.value, layout.stringify.selectedIndex] = JSON.parse(atob(find_program().replace(/_/g, "/").replace(/-/g, "+")));
    };
    
    layout.run.onclick = () => {
        // Input
        
        layout.invalid_program.style.display = "";
        layout.invalid_input.style.display = "";
        
        var program = layout.program.value;
        
        var input;
        
        try {
            input = eval(layout.input.value || "[]");
        } catch (incorrect) {
            layout.invalid_input.textContent = "Invalid input format";
            layout.invalid_input.style.display = "block";
            
            console.error(incorrect);
            
            return;
        };
        
        // Run
        
        var result;
        
        try {
            result = interpreter.run(layout.program.value, input, [null, true][layout.stringify.selectedIndex]);
        } catch (incorrect) {
            if ("program" in incorrect) {
                layout.invalid_program.textContent = incorrect.program;
                layout.invalid_program.style.display = "block";
            }
            
            if ("input" in incorrect) {
                layout.invalid_input.textContent = incorrect.input;
                layout.invalid_input.style.display = "block";
            }
            
            console.error(incorrect);
            
            return;
        }
        
        // Result
        
        var format = (data) => {
            if (typeof data == "string")
                return JSON.stringify(data);
            
            if (typeof data == "bigint")
                return String(data);
            
            if (Array.isArray(data))
                return "[" + data.map(format).join(", ") + "]";
            
            return "UNKNOWN";
        };
        
        layout.result.value = layout.stringify.selectedIndex == 0 ? format(result) : result;
        
        layout.result.parentNode.dataset.replicated = layout.result.value;
        
        var compiled = interpreter.compress(layout.program.value);
        
        layout.cgcc_post.value = (
            "# [Risky](https://github.com/RedwolfPrograms/risky), " + Math.ceil(compiled.length / 2) + " bytes\n\n" +
            "    " + compiled + "\n\n" +
            "[Try it online!](https://redwolfprograms.github.io/risky?p=" + save() + ")"
        );
        
        layout.cgcc_post.parentNode.dataset.replicated = layout.cgcc_post.value;
    };
    
    restore();
};