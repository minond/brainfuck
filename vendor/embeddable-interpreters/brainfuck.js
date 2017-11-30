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
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var inBrowser = typeof window !== 'undefined';
    var inputPrompt = 'input: ';
    var nodeWrite = function (str) {
        return process.stdout.write(str);
    };
    var browserWrite = function (str) {
        return console.log(str);
    };
    var nodeRead = function (cb) {
        var readline = require('readline');
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(inputPrompt, function (input) {
            rl.close();
            cb(input);
        });
    };
    var browserRead = function (cb) {
        return cb(window.prompt(inputPrompt) || String.fromCharCode(0));
    };
    var read = function (cb) {
        return inBrowser ? browserRead(cb) : nodeRead(cb);
    };
    var write = function (str) {
        return inBrowser ? browserWrite(str) : nodeWrite(str);
    };
    var isset = function (val) {
        return val !== null && val !== undefined;
    };
    var call = function (fn) {
        return fn();
    };
    var pass = function (x) {
        return x;
    };
    // ## The interpreter
    exports.exec = function (prog, userHooks) {
        // First, split the program into an array of characters so we can take action
        // upon each of them one by one. That is stores in `cmds`. Then store the
        // number of "commands" so that we know when to stop and not have to check
        // the `.length` property over and over again. That is stores in `len`
        var cmds = prog.split('');
        var len = cmds.length;
        // Now to the state variables. First, two less important ones: `steps` is
        // used to track how many times the `dump` function has been called and `cmd`
        // is the local variable of the current command we are processing. This is a
        // local variable, so there is no need to pass it around to functions that
        // are in the state of the interpreter
        var steps = 0;
        var cmd;
        // The rest of the state variables: `jumps` is a stack of loop starting
        // indexes. See `[` and `]` operators.  `memory` is where we store the memory
        // cells of our program.  `pointer` this is where we are pointing to in
        // memory. Always starts at zero.  Finally, `ids` tracks the index of where
        // we are in the program
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
            return !!process.env.DEBUG && '-+<>[],.'.indexOf(cmd) !== -1;
        };
        var dump = function (cmd) {
            return console.log('[%s:%s]\t\tcmd: %s\t\tcurr: %s[%s]\t\tmem: %s', steps, idx, cmd, pointer, curr(), JSON.stringify(memory));
        };
        // Finds the matching closing bracket of the start of a loop. see `[` and `]`
        // operators. increment for every `[` and decrement for every `]`. we'll know
        // we're at our closing bracket when we get to zero
        var findEnd = function (idx) {
            var stack = 1;
            while (cmds[idx]) {
                switch (cmds[idx]) {
                    case '[':
                        stack++;
                        break;
                    case ']':
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
        // to the next step and update state
        var internalUpdate = function (state) {
            memory = isset(state.memory) ? state.memory : memory;
            pointer = isset(state.pointer) ? state.pointer : pointer;
            idx = isset(state.idx) ? state.idx : idx;
        };
        // Moves on to the next command. Checks that we still have commands left to
        // read and also show debugging information. In a `process.nextTick` (or one
        // of its siblings) to prevent call stack overflows
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
        var hooks = Object.assign({ read: read, write: write, tick: call, done: pass }, userHooks);
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
        var ops = {
            '+': function () { return save((curr() === 255 ? 0 : curr() + 1)); },
            '-': function () { return save((curr() || 256) - 1); },
            '<': function () { return --pointer; },
            '>': function () { return ++pointer; },
            '.': function () { return hooks.write(String.fromCharCode(curr())); },
            '[': function () {
                if (curr() === 0) {
                    idx = findEnd(idx + 1);
                }
                else {
                    jumps.push(idx);
                }
            },
            ']': function () {
                if (curr() !== 0) {
                    idx = jumps[jumps.length - 1];
                }
                else {
                    jumps.pop();
                }
            }
        };
        // This is what executes every command
        var run = function () {
            cmd = cmds[idx];
            if (cmd in ops) {
                // Is the current command a standard operator? if so just run it.
                // Standard operators update the state themselvels
                ops[cmd]();
                tick();
            }
            else if (cmd === ',') {
                // Since read functions may not always be blocking, we handle ',' as a
                // special operator, separately from the flow of the rest of the
                // operators
                hooks.read(function (input) {
                    save(input.charCodeAt(0));
                    tick();
                });
            }
            else {
                // Not a brainfuck command - ignore it
                tick();
            }
        };
        // Run this fucker
        run();
    };
});
