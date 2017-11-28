module Main exposing (main)

import Html exposing (Html, div, input, label, option, select, span, text)
import Html.Attributes exposing (classList)


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
    div [ classList [("hi", True)] ]
        [ text "hihi"
        ]
