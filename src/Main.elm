port module Main exposing (main)

import Debug
import Html exposing (Attribute, Html, a, button, code, div, h1, input, li, option, p, select, span, text, textarea, ul)
import Html.Attributes exposing (class, href, spellcheck, type_)
import Html.Events exposing (on)
import Json.Decode as Json
import List
import Programs exposing (..)
import String


port initializeEditor : Bool -> Cmd msg


type Msg
    = NoOp
    | EditorInput String


type alias Model =
    { program : String
    }


main =
    Html.program
        { init = ( initialModel, initializeEditor True )
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


initialModel : Model
initialModel =
    { program = programHelloWorld
    }


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none


update : Msg -> Model -> ( Model, Cmd Msg )
update message model =
    case ( message, model ) of
        ( NoOp, _ ) ->
            ( model, Cmd.none )

        ( EditorInput str, { program } ) ->
            ( { model | program = str }, Cmd.none )


view : Model -> Html Msg
view model =
    let
        containerClass =
            "cf pa3 pa4-ns container helvetica"

        sectionClass =
            "fl w-100 w-50-ns editor-section"

        editor =
            editorInformation model ++ editorControls model ++ editorProgram model
    in
    div [ class containerClass ]
        [ editorTitle
        , div
            [ class sectionClass ]
            editorIntroduction
        , div
            [ class sectionClass ]
            editor
        ]


mono : String -> Html Msg
mono str =
    code
        [ class "f6 ph1 tc bg-light-gray word-wrap" ]
        [ text str ]


link : String -> String -> Html Msg
link title shref =
    a
        [ href shref
        , class "link blue"
        ]
        [ text title ]


btn : List (Attribute msg) -> String -> Html msg
btn attrs val =
    button
        ([ class "mr2 mb2 pointer" ] ++ attrs)
        [ text val ]


lbl : String -> Html Msg
lbl txt =
    div
        [ class "f6 mb2 gray i" ]
        [ text txt ]


editorControls : Model -> List (Html Msg)
editorControls _ =
    [ lbl "Load a program"
    , select
        [ class "w-50 mb3" ]
        [ option
            []
            [ text "helloworld.bf" ]
        , option
            []
            [ text "squares.bf" ]
        , option
            []
            [ text "fib.bf" ]
        , option
            []
            [ text "random.bf" ]
        ]
    , lbl "Change evaluation speed"
    , input
        [ class "w-50 mb3"
        , type_ "range"
        ]
        []
    , lbl "Program controls"
    , div
        [ class "mb2" ]
        [ btn [] "Run"
        , btn [] "Pause"
        , btn [] "Step"
        , btn [] "Continue"
        ]
    ]


editorProgram : Model -> List (Html Msg)
editorProgram { program } =
    let
        getProgram =
            Json.map
                (\s -> EditorInput s)
                (Json.at [ "target", "innerText" ] Json.string)
    in
    [ textarea
        [ spellcheck False
        , class "editor"
        , on "keyup" getProgram
        ]
        [ text program ]
    ]


editorTitle : Html Msg
editorTitle =
    h1
        [ class "mt0 f3 f2-m f1-l title fw1 baskerville" ]
        [ text "Brainfuck" ]


editorInformation : Model -> List (Html Msg)
editorInformation _ =
    [ p
        [ class "mt0 lh-copy" ]
        [ text "Here's some information about your program: it is "
        , mono "793"
        , text " bytes, "
        , mono "111"
        , text " of which are valid commands. The interpreter is going to interpret the character at index "
        , mono "0"
        , text ", which is "
        , mono "+"
        , text ", and has taken a total of "
        , mono "0"
        , text " steps so far. The program has had no output yet."
        ]
    ]


editorIntroduction : List (Html Msg)
editorIntroduction =
    [ p [ class "mt0 lh-copy" ]
        [ link "Brainfuck" "https://esolangs.org/wiki/Brainfuck"
        , text ", one of the "
        , link "esoteric programming languages" "https://esolangs.org/wiki/Esoteric_programming_language"
        , text " you've probably heard of. Partly because of its minimal instruction set but most likely because it has the word "
        , span [ class "i" ]
            [ text "fuck" ]
        , text " in its name. That said this language doesn't have to leave you thinking "
        , span [ class "i" ]
            [ text "\"wtf?\"" ]
        , text ". My intention for building this Brainfuck debugger is to have a tool for learning this language and do it in a visual way, where you can see what your program is doing step by step."
        ]
    , p [ class "lh-copy" ]
        [ text "Besides this text you'll see buttons you can use to execute your program, which can be done in continuation or one command at a time, and as your program is running you can slide the range input field to alter the speed at which the code runs. Below those controls you'll notice a table filled with 0's (at least before you run a program), this is the internal memory. And finally your code editor, where you can set breakpoints by clicking on commands that will halt your program's execution. Now for a quick introduction to the language: " ]
    , ul
        [ class "pl4 lh-copy" ]
        [ li
            []
            [ mono "<"
            , text " and "
            , mono ">"
            , text " move the pointer to the left and to the right. Keep an on the memory cells to the right -- the cell that has a black background color is the active cell and the one where increment, decrement, and loops will act on or check."
            ]
        , li
            [ class "pt2" ]
            [ mono "+"
            , text " and "
            , mono "-"
            , text " increment and decrement the active cell. Note that incrementing above 255 will \"wrap\" the value back around to 0, and decrementing below 0 will take you to 255."
            ]
        , li
            [ class "pt2" ]
            [ mono "["
            , text " and "
            , mono "]"
            , text " are the language's only control flow operators. The code inside of the loop is ran as long as that value of the active cell is not zero. Think of it as a "
            , mono "while (ptr != 0) {}"
            , text " loop."
            ]
        , li
            [ class "pt2" ]
            [ mono "."
            , text " and "
            , mono ","
            , text " are the io functions. A period will output the character associated with the "
            , link "ASCII" "https://en.wikipedia.org/wiki/ASCII"
            , text " in the active cell (so if the active cell has a value of 97 and you output its value, you should get an \"a\".) "
            ]
        ]
    , p [ class "lh-copy" ]
        [ text "So play around with this tool. Start by running the sample code or creating basic programs on your own and see for yourself how with even the most basic control flow and altering commands you can technically accomplish any task. If you're curious about the code and the interpreter that are running on this page, "
        , link "go here" "https://github.com/minond/brainfuck"
        , text ", and if you'd like to learn more about Brainfuck and other really interesting esoteric programming languages then I recommend heading over to "
        , link "Esolang" "https://esolangs.org/wiki/Main_Page"
        , text "."
        ]
    ]
