'use strict'

const { test } = require('tap')
const { readFileSync: read } = require('fs')
const { exec: brainfuck } = require('../../src/interpreter/brainfuck')

const PROG_HELLO_WORLD = read('./src/bf/helloworld.bf').toString()
const PROG_QUINE = read('./src/bf/quine.bf').toString()

const testsOutput = (label, prog, expectedOutput) => {
  test((t) => {
    var buff = []

    brainfuck(prog, {
      write (str) {
        buff.push(str)
      },

      done () {
        t.ok(buff.join('') === expectedOutput, label)
        t.done()
      }
    })
  })
}

testsOutput('hello world', PROG_HELLO_WORLD, 'Hello World!\n')
testsOutput('quine', PROG_QUINE, PROG_QUINE.substring(0, 900).replace(/\n/g, ''))
