browserify = node_modules/.bin/browserify
docco = node_modules/.bin/docco
tachyons = node_modules/.bin/tachyons
gifsicle = ./node_modules/.bin/gifsicle
watch = node_modules/.bin/watch

dist_dir = dist
docs_dir = doc
assets_dir = assets

browserify_flags = -o $(dist_dir)/browser.js
docco_flags = --layout parallel --output $(docs_dir)
watch_flags = --ignoreDotFiles

all: css build docs gif

watch-css:
	$(watch) 'date; make css' src/vizualizer $(watch_flags)

css: src/vizualizer/styles.css
	$(tachyons) src/vizualizer/styles.css -m > $(dist_dir)/styles.css

gif:
	$(gifsicle) $(assets_dir)/retro-pixel-computer.gif -o $(dist_dir)/retro-pixel-computer.gif

build: src/interpreter/js/brainfuck.js
	$(browserify) $(browserify_flags) $^

docs: src/interpreter/js/brainfuck.js
	$(docco) $(docco_flags) $^
