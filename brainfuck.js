'use strict'

module.exports.exec = (prog, debug = false) => {
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

      if (!stack)
        break
      else
        idx++
    }

    return idx
  }

  const ops = {
    '+': () => save((curr() === 255 ? 0 : curr() + 1)),
    '-': () => save((curr() || 256) - 1),
    '<': () => --pointer,
    '>': () => ++pointer,
    '.': () => process.stdout.write(String.fromCharCode(curr())),
  }

  const run = () => {
    cmd = cmds[idx]

    if (cmd === '[') {
      if (curr() === 0) {
        var tmp = idx
        idx = find_end(idx)
      } else {
        jumps.push(idx)
      }

      tick(cmd)
    } else if (cmd === ']') {
      lidx = jumps[jumps.length - 1]

      if (curr() !== 0)
        idx = lidx
      else
        jumps.pop()

      tick(cmd)
    } else if (cmd === ',') {
    } else if (cmd in ops) {
      ops[cmd]()
      tick(cmd)
    } else
      tick('')
  }

  const tick = () => {
    if (idx < len) {
      debug && "-+<>[]".indexOf(cmd) !== -1 && dump(cmd)
      idx++
      setImmediate(run)
      // setTimeout(run, 1000)
      // setTimeout(() => run(), 1)
    } else if (debug)
      console.log(prog)
  }

  run()
}

module.exports.brainfuck = ([prog]) =>
  module.exports.exec(prog, !!process.env.DEBUG)

if (!module.parent && process.argv[2])
  module.exports.exec(process.argv[2], !!process.env.DEBUG)
