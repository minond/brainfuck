browserify = node_modules/.bin/browserify
docco = node_modules/.bin/docco
tachyons = node_modules/.bin/tachyons
gifsicle = ./node_modules/.bin/gifsicle
watch = node_modules/.bin/watch

dist_dir = dist
docs_dir = doc
assets_dir = assets

docco_flags = --layout parallel --output $(docs_dir)
watch_flags = --ignoreDotFiles

all: css js docs gif

watch:
	$(watch) 'date; make css js' src/vizualizer $(watch_flags)

js: src/vizualizer/editor.js
	$(browserify) $(browserify_flags) $^ -o $(dist_dir)/editor.js

css: src/vizualizer/styles.css
	$(tachyons) src/vizualizer/styles.css -m > $(dist_dir)/styles.css

gif:
	$(gifsicle) $(assets_dir)/retro-pixel-computer.gif -o $(dist_dir)/retro-pixel-computer.gif

docs: src/interpreter/js/brainfuck.js
	$(docco) $(docco_flags) $^
