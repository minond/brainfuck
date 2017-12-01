module Programs exposing (..)


programLoad : String -> String
programLoad name =
    case name of
        "squares.bf" ->
            programSquares

        "fib.bf" ->
            programFib

        "random.bf" ->
            programRandom

        "cat-buffer.bf" ->
            programCatBuffer

        "cat-stream.bf" ->
            programCatStream

        "helloworld.bf" ->
            programHelloWorld

        _ ->
            ""


programCatBuffer : String
programCatBuffer =
    """,[>,]<[<]>[.>]"""


programCatStream : String
programCatStream =
    """,[.,]"""


programHelloWorld : String
programHelloWorld =
    """+++++ +++++             initialize counter (cell #0) to 10
[                       use loop to set 70/100/30/10
    > +++++ ++              add  7 to cell #1
    > +++++ +++++           add 10 to cell #2
    > +++                   add  3 to cell #3
    > +                     add  1 to cell #4
<<<< -                  decrement counter (cell #0)
]
> ++ .                  print 'H'
> + .                   print 'e'
+++++ ++ .              print 'l'
.                       print 'l'
+++ .                   print 'o'
> ++ .                  print ' '
<< +++++ +++++ +++++ .  print 'W'
> .                     print 'o'
+++ .                   print 'r'
----- - .               print 'l'
----- --- .             print 'd'
> + .                   print '!'
> .                     print 'eol'"""


programSquares : String
programSquares =
    """++++[>+++++<-]>[<+++++>-]+<+[
    >[>+>+<<-]++>>[<<+>>-]>>>[-]++>[-]+
    >>>+[[-]++++++>>>]<<<[[<++++++++<++>>-]+<.<[>----<-]<]
    <<[>>>>>[>>>[-]+++++++++<[>-<-]+++++++++>[-[<->-]+[<<<]]<[>+<-]>]<<-]<<-
]
[Outputs square numbers from 0 to 10000.
Daniel B Cristofani (cristofdathevanetdotcom)
http://www.hevanet.com/cristofd/brainfuck/]"""


programFib : String
programFib =
    """>++++++++++>+>+[
    [+++++[>++++++++<-]>.<++++++[>--------<-]+<<<]>.>>[
        [-]<[>+<-]>>[<<+>+>-]<[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-
            [>+<-[>+<-[>+<-[>[-]>+>+<<<-[>+<-]]]]]]]]]]]+>>>
    ]<<<
]
This program doesn't terminate; you will have to kill it.
Daniel B Cristofani (cristofdathevanetdotcom)
http://www.hevanet.com/cristofd/brainfuck/"""


programRandom : String
programRandom =
    """>>>++[
    <++++++++[
        <[<++>-]>>[>>]+>>+[
            -[->>+<<<[<[<<]<+>]>[>[>>]]]
            <[>>[-]]>[>[-<<]>[<+<]]+<<
        ]<[>+<-]>>-
    ]<.[-]>>
]
"Random" byte generator using the Rule 30 automaton.
Doesn't terminate; you will have to kill it.
To get x bytes you need 32x+4 cells.
Turn off any newline translation!
Daniel B Cristofani (cristofdathevanetdotcom)
http://www.hevanet.com/cristofd/brainfuck/"""
