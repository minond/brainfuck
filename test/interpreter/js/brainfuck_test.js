'use strict'

const { test } = require('tap')
const { readFileSync: read } = require('fs')
const { exec: brainfuck } = require('../../../src/interpreter/js/brainfuck')

const prog_hello_world = read('./src/bf/helloworld.bf').toString()
const prog_quine = read('./src/bf/quine.bf').toString()

const tests_output = (label, prog, expected_output) => {
  test((t) => {
    var buff = []

    brainfuck(prog, {
      write(str) {
        buff.push(str)
      },

      done() {
        t.ok(buff.join('') === expected_output, label)
        t.done()
      }
    })
  })
}

tests_output('hello world', prog_hello_world, 'Hello World!\n')
tests_output('quine', prog_quine, prog_quine.substring(0, 900).replace(/\n/g, ''))
