port module Main exposing (main)

import Array
import Browser exposing (Document)
import Debug exposing (toString)
import Html exposing (Attribute, Html, a, button, code, div, h1, input, li, option, p, section, select, span, text, textarea, ul)
import Html.Attributes exposing (class, classList, href, id, spellcheck, type_, value)
import Html.Events exposing (on, onClick, onInput)
import Json.Decode as Json
import List
import List.Extra exposing (greedyGroupsOf)
import Programs exposing (..)
import String


port cmd : ( String, Maybe Runtime ) -> Cmd msg


port unload : (String -> msg) -> Sub msg


port tick : (ProgramState -> msg) -> Sub msg


port output : (String -> msg) -> Sub msg


port breakpoint : (Int -> msg) -> Sub msg


type Msg
    = Run
    | Step
    | Continue
    | Pause
    | Tick ProgramState
    | Output String
    | SetDelay String
    | SetProgram String
    | EditorInput String
    | UpdateProgramInput String
    | Breakpoint Int


type alias Model =
    { program : String
    , input : String
    , output_ : Maybe String
    , memory : List Int
    , breakpoints : List Int
    , idx : Int
    , pointer : Int
    , steps : Int
    , delay : Int
    }


type alias ProgramState =
    { memory : List Int
    , idx : Int
    , pointer : Int
    , steps : Int
    }


type alias Runtime =
    { program : String
    , memory : List Int
    , breakpoints : List Int
    , input : String
    , idx : Int
    , pointer : Int
    , steps : Int
    , speed : Int
    }


main =
    let
        model =
            initialModel
        init : () -> (Model, Cmd Msg)
        init _ = ( model, cmd ( "init", Just (toRuntime model) ))
    in
        Browser.document
            { init = init
            , view = view
            , update = update
            , subscriptions = subscriptions
            }


initialModel : Model
initialModel =
    cleanState programHelloWorld


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ tick Tick
        , output Output
        , unload EditorInput
        , breakpoint Breakpoint
        ]


update : Msg -> Model -> ( Model, Cmd Msg )
update message model =
    case message of
        Run ->
            let
                breakpoints =
                    model.breakpoints

                input =
                    model.input

                clean =
                    cleanState model.program

                reset =
                    { clean
                        | delay = model.delay
                        , breakpoints = breakpoints
                        , input = input
                    }
            in
                ( reset, cmd ( "start", Just (toRuntime reset) ) )

        Step ->
            ( model, cmd ( "step", Just (toRuntime model) ) )

        Continue ->
            ( model, cmd ( "continue", Just (toRuntime model) ) )

        Pause ->
            ( model, cmd ( "pause", Just (toRuntime model) ) )

        Output addition ->
            let
                output_ =
                    Maybe.withDefault "" model.output_ ++ addition
            in
                ( { model | output_ = Just output_ }, Cmd.none )

        Tick state ->
            ( mergeState state model, Cmd.none )

        SetDelay raw ->
            let
                delay =
                    case String.toInt raw of
                        Nothing ->
                            50

                        Just val ->
                            val

                update_ =
                    { model | delay = delay }
            in
                ( update_, cmd ( "speed", Just (toRuntime update_) ) )

        SetProgram name ->
            let
                program =
                    programLoad name

                clean =
                    cleanState program

                update_ =
                    { clean | input = model.input }

                runtime =
                    toRuntime <| update_
            in
                ( update_, cmd ( "load", Just runtime ) )

        EditorInput program ->
            let
                clean =
                    cleanState program

                update_ =
                    { clean | input = model.input }
            in
                ( update_, Cmd.none )

        UpdateProgramInput input ->
            ( { model | input = input }, Cmd.none )

        Breakpoint pos ->
            let
                breakpoints =
                    if List.member pos model.breakpoints then
                        List.filter ((/=) pos) model.breakpoints
                    else
                        pos :: model.breakpoints
            in
                ( { model | breakpoints = breakpoints }, Cmd.none )


view : Model -> Document Msg
view model =
    { title = "Brainfuck"
    , body= [div [ class "cf pa3 pa4-ns container helvetica" ]
        [ editorTitle
        , div
            [ class "fl w-100 w-50-ns editor-section" ]
            editorIntroduction
        , div
            [ class "fl w-100 w-50-ns editor-section" ]
            [ section [] <| editorControls model
            , section [] <| editorMemory model
            , section [] <| editorOutput model
            , section [] <| editorProgram model
            , section [] <| editorInformation model
            ]
        ]
    ]
    }

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


cleanState : String -> Model
cleanState program =
    { program = program
    , input = ""
    , output_ = Nothing
    , memory = []
    , breakpoints = []
    , idx = 0
    , pointer = 0
    , steps = 0
    , delay = 10
    }


toRuntime : Model -> Runtime
toRuntime { program, memory, breakpoints, input, idx, pointer, steps, delay } =
    { program = program
    , memory = memory
    , breakpoints = breakpoints
    , input = input
    , idx = idx
    , pointer = pointer
    , steps = steps
    , speed = 1000 * delay // 100
    }


mergeState : ProgramState -> Model -> Model
mergeState { memory, idx, pointer, steps } model =
    { model
        | memory = memory
        , idx = idx
        , pointer = pointer
        , steps = steps
    }


editorControls : Model -> List (Html Msg)
editorControls { delay } =
    let
        setProgram =
            Json.map (\s -> SetProgram s) <|
                Json.at [ "target", "value" ] Json.string
    in
        [ lbl "Load a program"
        , select
            [ class "w-50 mb3"
            , on "change" setProgram
            ]
            [ option
                []
                [ text "helloworld.bf" ]
            , option
                []
                [ text "cat-buffer.bf" ]
            , option
                []
                [ text "cat-stream.bf" ]
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
        , lbl ("Change evaluation delay (" ++ toString delay ++ ")")
        , input
            [ class "w-50 mb3"
            , type_ "range"
            , onInput SetDelay
            , value (toString delay)
            ]
            []
        , lbl "Program controls"
        , div
            [ class "mb2" ]
            [ btn [ onClick Run ] "Run"
            , btn [ onClick Pause ] "Pause"
            , btn [ onClick Step ] "Step"
            , btn [ onClick Continue ] "Continue"
            ]
        ]


editorOutput : Model -> List (Html Msg)
editorOutput model =
    let
        output_ =
            Maybe.withDefault "none" model.output_
    in
        [ div
            [ class "mt3" ]
            []
        , lbl "Input"
        , div
            [ class "pb2 mb2" ]
            [ input
                [ class "w-50 f6 monospace"
                , id "readBuffer"
                , onInput UpdateProgramInput
                ]
                []
            ]
        , lbl "Output"
        , div
            [ class "pb2 mb2" ]
            [ mono output_ ]
        ]


editorProgram : Model -> List (Html Msg)
editorProgram { program } =
    let
        getProgram =
            Json.map (\s -> EditorInput s) <|
                Json.at [ "target", "innerText" ] Json.string
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


editorMemory : Model -> List (Html Msg)
editorMemory { memory, pointer } =
    let
        pageSize =
            10

        memSize =
            List.length memory

        padded =
            if memSize < pageSize then
                memory ++ List.repeat (pageSize - memSize) 0
            else
                memory

        isActive =
            \offset index ->
                pageSize * offset + index == pointer

        asCell =
            \offset index val ->
                div
                    [ class "memcell"
                    , classList [ ( "selected", isActive offset index ) ]
                    ]
                    [ span
                        []
                        [ text (toString val) ]
                    ]

        asRow =
            \index vals ->
                div [ class "cellrow" ]
                    (List.indexedMap (asCell index) vals)
    in
        [ lbl "Program memory"
        , div [ class "mb3" ] <|
            List.indexedMap asRow <|
                greedyGroupsOf pageSize padded
        ]


editorInformation : Model -> List (Html Msg)
editorInformation { program, output_, idx, steps } =
    let
        isOptcode =
            \opt_ ->
                String.contains opt_ "+-[]<>,."

        opts =
            Array.filter isOptcode <|
                Array.fromList <|
                    String.split "" program

        opt =
            Maybe.withDefault " " <|
                Array.get idx opts

        programSize =
            String.length program

        codeSize =
            Array.length <| opts

        outputMessage =
            case output_ of
                Nothing ->
                    text "The program has had no output yet."

                Just str ->
                    span
                        []
                        [ text "Output length is "
                        , mono <| toString <| String.length str
                        , text " characters long."
                        ]
    in
        [ p
            [ class "lh-copy" ]
            [ text "Here’s some information about your program: it is "
            , mono <| toString programSize
            , text " bytes, "
            , mono <| toString codeSize
            , text " of which are valid commands. The interpreter is going to interpret the character at index "
            , mono <| toString idx
            , text ", which is "
            , mono opt
            , text ", and has taken a total of "
            , mono <| toString steps
            , text " steps so far. "
            , outputMessage
            ]
        ]


editorIntroduction : List (Html Msg)
editorIntroduction =
    [ p [ class "mt0 lh-copy" ]
        [ link "Brainfuck" "https://esolangs.org/wiki/Brainfuck"
        , text ", one of the "
        , link "esoteric programming languages" "https://esolangs.org/wiki/Esoteric_programming_language"
        , text " you’ve probably heard of. Partly because of its minimal instruction set but most likely because it has the word "
        , span [ class "i" ]
            [ text "fuck" ]
        , text " in its name. That said this language doesn’t have to leave you thinking "
        , span [ class "i" ]
            [ text "wtf?" ]
        , text ". My intention for building this Brainfuck debugger is to have a tool for learning this language and do it in a visual way, where you can see what your program is doing step by step."
        ]
    , p [ class "lh-copy" ]
        [ text "Besides this text you’ll see buttons you can use to execute your program, which can be done in continuation or one command at a time, and as your program is running you can slide the range input field to alter the speed at which the code runs. Below those controls you’ll notice a table filled with 0’s (at least before you run a program), this is the internal memory. And finally your code editor, where you can set breakpoints by clicking on commands that will halt your program’s execution. Now for a quick introduction to the language: " ]
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
            , text " increment and decrement the active cell. Note that incrementing above 255 will ‘wrap’ the value back around to 0, and decrementing below 0 will take you to 255."
            ]
        , li
            [ class "pt2" ]
            [ mono "["
            , text " and "
            , mono "]"
            , text " are the language’s only control flow operators. The code inside of the loop is ran as long as that value of the active cell is not zero. Think of it as a "
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
            , text " in the active cell (so if the active cell has a value of 97 and you output its value, you should get an ‘a’.) You'll notice an input field labeled as `input`. This is where you can predefine the input for your program and if this is empty, the editor will prompt for the input intead."
            ]
        ]
    , p [ class "lh-copy" ]
        [ text "So play around with this tool. Start by running the sample code or creating basic programs on your own and see for yourself how with even the most basic control flow and altering commands you can technically accomplish any task. If you’re curious about the code and the interpreter that are running on this page, "
        , link "go here" "https://github.com/minond/brainfuck"
        , text ", and if you’d like to learn more about Brainfuck and other really interesting esoteric programming languages then I recommend heading over to "
        , link "Esolang" "https://esolangs.org/wiki/Main_Page"
        , text "."
        ]
    ]
