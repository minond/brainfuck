module Main exposing (main)

import Html exposing (Html, a, div, h1, p, text, span)
import Html.Attributes exposing (class, href)


type Msg
    = NoOp


type alias Model =
    { program : String
    }


main =
    Html.program
        { init = ( initialModel, Cmd.none )
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


initialModel : Model
initialModel =
    { program = "+++"
    }


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none


update : Msg -> Model -> ( Model, Cmd Msg )
update message model =
    case message of
        NoOp ->
            ( model, Cmd.none )


view : Model -> Html Msg
view model =
    div [ class "cf pa3 pa4-ns container lh-copy helvetica" ]
        [ h1 [ class "mt0 f3 f2-m f1-l title fw1 baskerville" ]
            [ text "Brainfuck" ]
        , div [ class "fl w-100 w-50-ns editor-section" ]
            [ p [ class "mt0" ]
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
            , p []
                [ text "Besides this text you'll see buttons you can use to execute your program, which can be done in continuation or one command at a time, and as your program is running you can slide the range input field to alter the speed at which the code runs. Below those controls you'll notice a table filled with 0's (at least before you run a program), this is the internal memory. And finally your code editor, where you can set breakpoints by clicking on commands that will halt your program's execution. Now for a quick introduction to the language: " ]
            ]
        , div [ class "fl w-100 w-50-ns editor-section" ]
            [ p [ class "mt0" ]
                [ text "hi" ]
            ]
        ]


link : String -> String -> Html Msg
link title shref =
    a
        [ href shref
        , class "link blue"
        ]
        [ text title ]
