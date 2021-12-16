build:
	elm make src/Main.elm --output=build/main.js

run:
	elm-live src/Main.elm --open --debug -- --output=build/main.js
