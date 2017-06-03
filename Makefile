browserify = node_modules/.bin/browserify
docco = node_modules/.bin/docco
tachyons = node_modules/.bin/tachyons
watch = node_modules/.bin/watch

dist_dir = dist
docs_dir = doc

browserify_flags = -o $(dist_dir)/browser.js
docco_flags = --layout parallel --output $(docs_dir)

all: css build docs

watch:
	$(watch) make src

css: src/vizualizer/styles.css
	$(tachyons) src/vizualizer/styles.css -m > $(dist_dir)/styles.css

build: src/interpreter/js/brainfuck.js
	$(browserify) $(browserify_flags) $^

docs: src/interpreter/js/brainfuck.js
	$(docco) $(docco_flags) $^
