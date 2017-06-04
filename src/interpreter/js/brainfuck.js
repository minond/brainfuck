// > Brainfuck is an esoteric programming language created in 1993 by Urban
// Müller, and notable for its extreme minimalism. The language consists of
// only eight simple commands and an instruction pointer. While it is fully
// Turing-complete, it is not intended for practical use...

// - https://en.wikipedia.org/wiki/Brainfuck

// ## setup

// some helper functions. need to know if we should use browser or node apis
// for i/o. the following functions are read and write implementations for
// specific environments. they include: a write function for node; a write
// function for browsers; a read function for node; a read function for
// browsers; a generic read function. use this in the interpreter; and a
// generic write function. use this in the interpreter.

'use strict'

const in_browser = typeof window !== 'undefined'
const input_prompt = 'input: '

const node_write = (str) =>
  process.stdout.write(str)

const browser_write = (str) =>
  console.log(str)

const node_read = (cb) => {
  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(input_prompt, (input) => {
    rl.close();
    cb(input);
  });
}

const browser_read = (cb) =>
  cb(prompt(input_prompt))

const read = (cb) =>
  in_browser ? browser_read(cb) : node_read(cb)

const write = (str) =>
  in_browser ? browser_write(str) : node_write(str)

const isset = (val) =>
  val !== null && val !== undefined

const call = (fn) =>
  fn()

// ## the interpreter
const exec = (prog, user_hooks) => {
  // first, split the program into an array of characters so we can take action
  // upon each of them one by one. that is stores in `cmds`. then store the
  // number of "commands" so that we know when to stop and not have to check
  // the `.length` property over and over again. that is stores in `len`
  const cmds = prog.split('')
  const len = cmds.length


  // now to the state variables. first, two less important ones: `steps` is
  // used to track how many times the `dump` function has been called and `cmd`
  // is the local variable of the current command we are processing. this is a
  // local variable, so there is no need to pass it around to functions that
  // are in the state of the interpreter
  var steps = 0
  var cmd

  // the rest of the state variables: `jumps` is a stack of loop starting
  // indexes. see `[` and `]` operators.  `memory` is where we store the memory
  // cells of our program.  `pointer` this is where we are pointing to in
  // memory. always starts at zero.  finally, `ids` tracks the index of where
  // we are in the program
  var jumps = []
  var memory = []
  var pointer = 0
  var idx = 0

  // some helper small functions. `curr` is used for getting the current value
  // in the memory cell we are pointing to. `save` is for setting the value of
  // the memory cell we are pointing to.  and `can_debug` and `dump` are for
  // debugging purposes.
  const curr = () =>
    memory[pointer] || 0

  const save = (val) =>
    memory[pointer] = val

  // do you want to see the state after every command?
  const can_debug = (cmd) =>
    !!process.env.DEBUG && '-+<>[],.'.indexOf(cmd) !== -1

  const dump = (cmd) =>
    console.log('[%s:%s]\t\tcmd: %s\t\tcurr: %s[%s]\t\tmem: %s', ++steps, idx, cmd,
      pointer, curr(), JSON.stringify(memory))

  // finds the matching closing bracket of the start of a loop. see `[` and `]`
  // operators. increment for every `[` and decrement for every `]`. we'll know
  // we're at our closing bracket when we get to zero
  const find_end = (idx) => {
    var stack = 1

    while (cmds[idx]) {
      switch (cmds[idx]) {
        case '[':
          stack++
          break

        case ']':
          stack--
          break
      }

      if (!stack) {
        break
      } else {
        idx++
      }
    }

    return idx
  }

  // ### hooks

  // hooks allow other programs to interact with the internals of the
  // interpreter. they allow for custom io functions as well as ways to move on
  // to the next step and update state

  const internal_update = (state) => {
    memory = isset(state.memory) ? state.memory : memory
    pointer = isset(state.pointer) ? state.pointer : pointer
    idx = isset(state.idx) ? state.idx : idx
  }

  // moves on to the next command. checks that we still have commands left to
  // read and also show debugging information. in a `process.nextTick` (or one
  // of its siblings) to prevent call stack overflows
  const internal_tick = () => {
    if (can_debug(cmd)) {
      dump(cmd)
    }

    if (idx++ < len && typeof cmds[idx] === 'string') {
      process.nextTick(run, 0)
    }
  }

  const tick = () =>
    hooks.tick(internal_tick, internal_update, { pointer, idx,
      memory: memory.slice(0) })

  const hooks = Object.assign({ read, write, tick: call },
    user_hooks);

  // ### operators
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
  const ops = {
    '+': () => save((curr() === 255 ? 0 : curr() + 1)),
    '-': () => save((curr() || 256) - 1),
    '<': () => --pointer,
    '>': () => ++pointer,
    '.': () => hooks.write(String.fromCharCode(curr())),

    '[': () => {
      if (curr() === 0) {
        idx = find_end(idx + 1)
      } else {
        jumps.push(idx)
      }
    },

    ']': () => {
      if (curr() !== 0) {
        idx = jumps[jumps.length - 1]
      } else {
        jumps.pop()
      }
    },
  }

  // this is what executes every command
  const run = () => {
    cmd = cmds[idx]

    if (cmd in ops) {
      // is the current command a standard operator? if so just run it.
      // standard operators update the state themselvels
      ops[cmd]()
      tick()
    } else if (cmd === ',') {
      // since read functions may not always be blocking, we handle ',' as a
      // special operator, separately from the flow of the rest of the
      // operators
      hooks.read((input) => {
        save(input.charCodeAt(0))
        tick()
      })
    } else {
      // not a brainfuck command - ignore it
      tick()
    }
  }

  // run this fucker
  run()
}

// the next two blocks of code declare a js template literal function and the
// other checks if we are being ran as a stand-alone module and if we have an
// argument being passed in - if this is the case run that brainfuck program
// right away
const brainfuck = ([prog]) =>
  exec(prog)

if (!module.parent && process.argv[2]) {
  exec(process.argv[2])
} else if (in_browser) {
  module.exports = exec
} else {
  module.exports = { exec, brainfuck }
}
// ```javascript
// // in js land
// brainfuck`-[------->+<]
//           >-.-[->+++++<]
//           >++.+++++++..+++.[--->+<]
//           >-----.--[->++++<]
//           >-.--------.+++.------.--------.`
// ```

// ```bash
// # in your terminal
// $ node brainfuck.js '-[------->+<]
//                      >-.-[->+++++<]
//                      >++.+++++++..+++.[--->+<]
//                      >-----.--[->++++<]
//                      >-.--------.+++.------.--------.'
// ```
