#### brainfuck

an interpreter written in javascript and a memory visualizer and editor for
your browser.

pass your programs to the interpreter to execute them. you can also declare a
`DEBUG` environment variable to get a dump of the inner state after every
instruction: `DEBUG=1 node src/interpreter/js/brainfuck.js src/bf/squares.bf`.

many thanks to Daniel B Cristofani for a nice
[intro](http://www.hevanet.com/cristofd/brainfuck/epistle.html) and [sample
programs](http://www.hevanet.com/cristofd/brainfuck/) and Fabian for the great
[art](https://copy.sh/brainfuck/) that came prior to mine.
