'use strict';

const { exec } = require('../interpreter/js/brainfuck');

console.log(exec);

// document.querySelector('#run').add

document.querySelector('#editor').innerText = '' +
  '+++++ +++++             initialize counter (cell #0) to 10\n' +
  '[                       use loop to set 70/100/30/10\n' +
  '    > +++++ ++              add  7 to cell #1\n' +
  '    > +++++ +++++           add 10 to cell #2\n' +
  '    > +++                   add  3 to cell #3\n' +
  '    > +                     add  1 to cell #4\n' +
  '<<<< -                  decrement counter (cell #0)\n' +
  ']\n' +
  '> ++ .                  print \'H\'\n' +
  '> + .                   print \'e\'\n' +
  '+++++ ++ .              print \'l\'\n' +
  '.                       print \'l\'\n' +
  '+++ .                   print \'o\'\n' +
  '> ++ .                  print \' \'\n' +
  '<< +++++ +++++ +++++ .  print \'W\'\n' +
  '> .                     print \'o\'\n' +
  '+++ .                   print \'r\'\n' +
  '----- - .               print \'l\'\n' +
  '----- --- .             print \'d\'\n' +
  '> + .                   print \'!\'\n' +
  '> .                     print \'\\n\''
