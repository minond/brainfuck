'use strict'

// Brainfuck is an esoteric programming language created in 1993 by Urban
// Müller, and notable for its extreme minimalism. The language consists of
// only eight simple commands and an instruction pointer. While it is fully
// Turing-complete, it is not intended for practical use...
// - https://en.wikipedia.org/wiki/Brainfuck

// +---------------------------------------------------------------------------+
// | char | description                                                        |
// +---------------------------------------------------------------------------+
// | >    | increment the data pointer (to point to the next cell to the       |
// |      | right).                                                            |
// +---------------------------------------------------------------------------+
// | <    | decrement the data pointer (to point to the next cell to the       |
// |      | left).                                                             |
// +---------------------------------------------------------------------------+
// | +    | increment (increase by one) the byte at the data pointer.          |
// +---------------------------------------------------------------------------+
// | -    | decrement (decrease by one) the byte at the data pointer.          |
// +---------------------------------------------------------------------------+
// | .    | output the byte at the data pointer.                               |
// +---------------------------------------------------------------------------+
// | ,    | accept one byte of input, storing its value in the byte at the     |
// |      | data pointer.                                                      |
// +---------------------------------------------------------------------------+
// | [    | if the byte at the data pointer is zero, then instead of moving    |
// |      | the instruction pointer forward to the next command, jump it       |
// |      | forward to the command after the matching ] command.               |
// +---------------------------------------------------------------------------+
// | ]    | if the byte at the data pointer is nonzero, then instead of moving |
// |      | the instruction pointer forward to the next command, jump it back  |
// |      | to the command after the matching [ command.                       |
// +---------------------------------------------------------------------------+

// need to know if we should use browser or node apis for i/o. the following
// functions are read and write implementations for specific environments
const in_browser = typeof window !== 'undefined'

/**
 * write function for node
 * @param {string} str
 * @return {void}
 */
const node_write = (str) =>
  process.stdout.write(str)

/**
 * write function for browsers
 * @param {string} str
 * @return {void}
 */
const browser_write = (str) =>
  console.log(str)

/**
 * read function for node
 * @param {(string): void} cb
 * @return {void}
 */
const node_read = (cb) => {
  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('input: ', (input) => {
    rl.close();
    cb(input);
  });
}

/**
 * read function for browsers
 * @param {(string): void} cb
 * @return {void}
 */
const browser_read = (cb) =>
  cb(prompt('input:'))

/**
 * generic read function. use this in the interpreter
 * @param {(string): void} cb
 * @return {void}
 */
const read = (cb) =>
  in_browser ? browser_read(cb) : node_read(cb)

/**
 * generic write function. use this in the interpreter
 * @param {string} str
 * @return {void}
 */
const write = (str) =>
  in_browser ? browser_write(str) : node_write(str)

/**
 * interpreter template string
 * @param {string[]} input (input[0] = prog)
 * @return {void}
 */
const brainfuck = ([prog]) =>
  exec(prog)

/**
 * interpreter
 * @param {string} prog
 * @return {void}
 */
const exec = module.exports.exec = (prog) => {
  // split the program into an array of characters so we can take action upon
  // each of them one by one
  const cmds = prog.split('')

  // store the number of "commands" so that we know when to stop and not have
  // to check the `.length` property over and over again
  const len = cmds.length

  // used to track how many times the `dump` function has been called
  var steps = 0

  // tracks the index of where we are in the program
  var idx = 0

  // local variable of the current command we are processing. this is a local
  // variable, so there is no need to pass it around to functions that are in
  // the state of the interpreter
  var cmd

  // a stack of loop starting indexes. see [ and ] operators
  var jumps = []

  // this is where we store the memory cells of our program
  var memory = []

  // this is where we are pointing to in memory. always starts at zero
  var pointer = 0

  // helper function for getting the current value in the memory cell we are
  // pointing to
  const curr = () =>
    memory[pointer] || 0

  // helper function for setting the value of the memory cell we are pointing
  // to
  const save = (val) =>
    memory[pointer] = val

  // dumps the state of the interpreter
  const dump = (cmd) =>
    console.log('[%s:%s]\t\tcmd: %s\t\tcurr: %s[%s]\t\tmem: %s', ++steps, idx, cmd,
      pointer, curr(), JSON.stringify(memory))

  // finds the matching closing bracket of the start of a loop. see [ and ]
  // operators
  const find_end = (idx) => {
    // increment for every [ and decrement for every ]. we'll know we're at our
    // closing bracket when we get to zero
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

  // there are all of Brainfuck's commands with the exception of ','
  const ops = {
    // increment (increase by one) the byte at the data pointer.
    '+': () => save((curr() === 255 ? 0 : curr() + 1)),

    // decrement (decrease by one) the byte at the data pointer.
    '-': () => save((curr() || 256) - 1),

    // decrement the data pointer (to point to the next cell to the left).
    '<': () => --pointer,

    //  increment the data pointer (to point to the next cell to the right).
    '>': () => ++pointer,

    // output the byte at the data pointer.
    '.': () => write(String.fromCharCode(curr())),

    // if the byte at the data pointer is zero, then instead of moving the
    // instruction pointer forward to the next command, jump it forward to the
    // command after the matching ] command.
    '[': () => {
      if (curr() === 0) {
        idx = find_end(idx + 1)
      } else {
        jumps.push(idx)
      }
    },

    // if the byte at the data pointer is nonzero, then instead of moving the
    // instruction pointer forward to the next command, jump it back to the
    // command after the matching [ command.
    ']': () => {
      if (curr() !== 0) {
        idx = jumps[jumps.length - 1]
      } else {
        jumps.pop()
      }
    },
  }

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
      read((input) => {
        save(input.charCodeAt(0))
        tick();
      })
    } else {
      // not a brainfuck - ignore it
      tick()
    }
  }

  // do you want to see the state after every command?
  const can_debug = (cmd) =>
    !!process.env.DEBUG && '-+<>[],.'.indexOf(cmd) !== -1

  // moves on to the next command. checks that we still have commands left to
  // read and also show debugging information. using a `setImmediate` (or one
  // of its siblings) to prevent call stack overflows
  const tick = () => {
    if (can_debug(cmd)) {
      dump(cmd)
    }

    if (idx++ < len && typeof cmds[idx] === 'string') {
      setImmediate(run, 0)
    }
  }

  // run (duh)
  run()
}

module.exports = { exec, brainfuck }

// are we being ran as a stand-alone module and do we have an argument being
// passed in? if so run it
if (!module.parent && process.argv[2]) {
  exec(process.argv[2])
}
