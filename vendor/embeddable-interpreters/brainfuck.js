// > Brainfuck is an esoteric programming language created in 1993 by Urban
// Müller, and notable for its extreme minimalism. The language consists of
// only eight simple commands and an instruction pointer. While it is fully
// Turing-complete, it is not intended for practical use...
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./common"], factory);
    }
})(function (require, exports) {
    "use strict";
    exports.__esModule = true;
    // - https://en.wikipedia.org/wiki/Brainfuck
    // ## Setup
    // Helper functions. We need to know if we should use browser or node apis for
    // i/o. The following functions are read and write implementations for specific
    // environments. They include: a write function for node; a write function for
    // browsers; a read function for node; a read function for browsers; a generic
    // read function. Use this in the interpreter; and a generic write function.
    // Use this in the interpreter.
    var common_1 = require("./common");
    // ## The interpreter
    var exec = function (prog, userHooks, buff) {
        // First, split the program into an array of characters so we can take action
        // upon each of them one by one. That is stores in `cmds`. Then store the
        // number of "commands" so that we know when to stop and not have to check
        // the `.length` property over and over again. That is stored in `len`.
        var cmds = prog.split('');
        var len = cmds.length;
        // Now to the state variables. First, two less important ones: `steps` is
        // used to track how many times the `dump` function has been called and `cmd`
        // is the local variable of the current command we are processing. This is a
        // local variable, so there is no need to pass it around to functions that
        // are in the state of the interpreter.
        var steps = 0;
        var cmd;
        // The rest of the state variables: `jumps` is a stack of loop starting
        // indexes. See `[` and `]` operators.  `memory` is where we store the memory
        // cells of our program.  `pointer` this is where we are pointing to in
        // memory. Always starts at zero.  Finally, `ids` tracks the index of where
        // we are in the program.
        var jumps = [];
        var memory = [];
        var pointer = 0;
        var idx = 0;
        // Some helper small functions. `curr` is used for getting the current value
        // in the memory cell we are pointing to. `save` is for setting the value of
        // the memory cell we are pointing to.  And `canDebug` and `dump` are for
        // debugging purposes.
        var curr = function () {
            return memory[pointer] || 0;
        };
        var save = function (val) {
            memory[pointer] = val;
        };
        // Do you want to see the state after every command?
        var canDebug = function (cmd) {
            return !!process.env.DEBUG && [
                "-" /* MINUS */,
                "+" /* PLUS */,
                "<" /* LT */,
                ">" /* GT */,
                "[" /* OBRACKET */,
                "]" /* CBRACKET */,
                "," /* COMMA */,
                "." /* PERIOD */
            ].indexOf(cmd) !== -1;
        };
        var dump = function (cmd) {
            return console.log('[%s:%s]\t\tcmd: %s\t\tcurr: %s[%s]\t\tmem: %s', steps, idx, cmd, pointer, curr(), JSON.stringify(memory));
        };
        // Finds the matching closing bracket of the start of a loop. see `[` and `]`
        // operators. increment for every `[` and decrement for every `]`. we'll know
        // we're at our closing bracket when we get to zero.
        var findEnd = function (idx) {
            var stack = 1;
            while (cmds[idx]) {
                switch (cmds[idx]) {
                    case "[" /* OBRACKET */:
                        stack++;
                        break;
                    case "]" /* CBRACKET */:
                        stack--;
                        break;
                }
                if (!stack) {
                    break;
                }
                else {
                    idx++;
                }
            }
            return idx;
        };
        // ### Hooks
        // Hooks allow other programs to interact with the internals of the
        // interpreter. They allow for custom io functions as well as ways to move on
        // to the next step and update state.
        var internalUpdate = function (state) {
            memory = common_1.isset(state.memory) ? state.memory : memory;
            pointer = common_1.isset(state.pointer) ? state.pointer : pointer;
            idx = common_1.isset(state.idx) ? state.idx : idx;
        };
        // Moves on to the next command. Checks that we still have commands left to
        // read and also show debugging information. In a `process.nextTick` (or one
        // of its siblings) to prevent call stack overflows.
        var internalTick = function () {
            if (canDebug(cmd)) {
                dump(cmd);
            }
            steps++;
            idx++;
            if (idx < len && typeof cmds[idx] === 'string') {
                process.nextTick(run, 0);
            }
            else {
                hooks.done();
            }
        };
        var tick = function () {
            return hooks.tick(internalTick, internalUpdate, {
                pointer: pointer,
                idx: idx,
                steps: steps,
                memory: memory.slice(0)
            });
        };
        var readBuff = function (cb) {
            return common_1.read(cb, buff || new common_1.ReadBuffer());
        };
        var hooks = Object.assign({ read: readBuff, write: common_1.write, tick: common_1.call, done: common_1.pass }, userHooks);
        // ### Operators
        // | tok  | description                                                                                                                                                                         |
        // |:----:|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
        // | `>`  | increment the data pointer (to point to the next cell to the right).                                                                                                                |
        // | `<`  | decrement the data pointer (to point to the next cell to the left).                                                                                                                 |
        // | `+`  | increment (increase by one) the byte at the data pointer.                                                                                                                           |
        // | `-`  | decrement (decrease by one) the byte at the data pointer.                                                                                                                           |
        // | `.`  | output the byte at the data pointer.                                                                                                                                                |
        // | `,`  | accept one byte of input, storing its value in the byte at the data pointer.                                                                                                        |
        // | `[`  | if the byte at the data pointer is zero, then instead of moving the instruction pointer forward to the next command, jump it forward to the command after the matching `]` command. |
        // | `]`  | if the byte at the data pointer is nonzero, then instead of moving the instruction pointer forward to the next command, jump it back to the command after the matching `[` command. |
        var ops = (_a = {},
            _a["+" /* PLUS */] = function () { return save((curr() === 255 ? 0 : curr() + 1)); },
            _a["-" /* MINUS */] = function () { return save((curr() || 256) - 1); },
            _a["<" /* LT */] = function () { return --pointer; },
            _a[">" /* GT */] = function () { return ++pointer; },
            _a["." /* PERIOD */] = function () { return hooks.write(String.fromCharCode(curr())); },
            _a["[" /* OBRACKET */] = function () {
                if (curr() === 0) {
                    idx = findEnd(idx + 1);
                }
                else {
                    jumps.push(idx);
                }
            },
            _a["]" /* CBRACKET */] = function () {
                if (curr() !== 0) {
                    idx = jumps[jumps.length - 1];
                }
                else {
                    jumps.pop();
                }
            },
            _a);
        // This is what executes every command.
        var run = function () {
            cmd = cmds[idx];
            if (cmd in ops) {
                // Is the current command a standard operator? if so just run it.
                // Standard operators update the state themselvels.
                ops[cmd]();
                tick();
            }
            else if (cmd === "," /* COMMA */) {
                // Since read functions may not always be blocking, we handle ',' as a
                // special operator, separately from the flow of the rest of the
                // operators.
                hooks.read(function (input) {
                    save(input.charCodeAt(0));
                    tick();
                });
            }
            else {
                // Not a brainfuck command - ignore it.
                tick();
            }
        };
        // Run this fucker.
        run();
        var _a;
    };
    exports.exec = exec;
});
