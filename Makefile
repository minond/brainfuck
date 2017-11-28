build: install
	elm make src/Main.elm --output=build/main.js

install:
	elm package install

run:
	elm live src/Main.elm --output=build/main.js --open --debug
