'use strict'

const IN_BROWSER = typeof window !== 'undefined'

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

  rl.question('input: ', (input) => {
    rl.close();
    cb(input);
  });
}

const browser_read = (cb) =>
  cb(prompt('input:'))

const read = (cb) =>
  IN_BROWSER ? browser_read(cb) : node_read(cb)

const write = (str) =>
  IN_BROWSER ? browser_write(str) : node_write(str)

const exec = module.exports.exec = (prog) => {
  const cmds = prog.split('')
  const len = cmds.length

  var steps = 0
  var idx = 0
  var lidx
  var cmd

  var jumps = []
  var memory = [0]
  var pointer = 0

  const curr = () =>
    memory[pointer] || 0

  const save = (val) =>
    memory[pointer] = val

  const dump = (cmd) =>
    console.log('[%s:%s]\t\tcmd: %s\t\tcurr: %s[%s]\t\tmem: %s', ++steps, idx, cmd,
      pointer, curr(), JSON.stringify(memory))

  const find_end = (idx) => {
    var stack = 1

    // assuming we're starting from opening bracket
    idx++

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

  const ops = {
    '+': () => save((curr() === 255 ? 0 : curr() + 1)),
    '-': () => save((curr() || 256) - 1),
    '<': () => --pointer,
    '>': () => ++pointer,

    // XXX send to param stream
    '.': () => write(String.fromCharCode(curr())),

    '[': () => {
      if (curr() === 0) {
        idx = find_end(idx)
      } else {
        jumps.push(idx)
      }
    },

    ']': () => {
      lidx = jumps[jumps.length - 1]

      if (curr() !== 0) {
        idx = lidx
      } else {
        jumps.pop()
      }
    },
  }

  const run = () => {
    cmd = cmds[idx]

    if (cmd in ops) {
      ops[cmd]()
      tick()
    } else if (cmd === ',') {
      read((input) => {
        save(input.charCodeAt(0))
        tick();
      })
    } else {
      tick()
    }
  }

  const can_debug = (cmd) =>
    !!process.env.DEBUG && '-+<>[],.'.indexOf(cmd) !== -1

  const tick = () => {
    if (can_debug(cmd)) {
      dump(cmd)
    }

    if (idx++ < len && typeof cmds[idx] === 'string') {
      setTimeout(run, 0)
    }
  }

  run()
}

module.exports.brainfuck = ([prog]) =>
  exec(prog)

if (!module.parent && process.argv[2]) {
  exec(process.argv[2])
}
