'use strict'

const exec = module.exports.exec = (prog, debug = false) => {
  const cmds = prog.split('')
  const len = cmds.length

  var idx = -1
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
    console.log('cmd: %s\tcurr: %s[%s]\tmem: %s', cmd, pointer, curr(),
      JSON.stringify(memory))

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
    '.': () => process.stdout.write(String.fromCharCode(curr())),

    // XXX take user input
    ',': () => {},

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
    }

    tick()
  }

  const can_debug = (cmd) =>
    !!process.env.DEBUG && '-+<>[]'.indexOf(cmd) !== -1

  const tick = () => {
    if (idx < len) {
      if (can_debug(cmd)) {
        dump(cmd)
      }

      idx++
      setImmediate(run)
    }
  }

  run()
}

module.exports.brainfuck = ([prog]) =>
  exec(prog, !!process.env.DEBUG)

if (!module.parent && process.argv[2]) {
  exec(process.argv[2], !!process.env.DEBUG)
}
