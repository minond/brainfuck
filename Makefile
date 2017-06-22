browserify = node_modules/.bin/browserify
docco = node_modules/.bin/docco
tachyons = node_modules/.bin/tachyons
gifsicle = ./node_modules/.bin/gifsicle
watch = node_modules/.bin/watch
tap = node_modules/.bin/tap
uglifyjs = node_modules/.bin/uglifyjs

dist_dir = dist
docs_dir = doc
assets_dir = assets

docco_flags = --layout parallel --output $(docs_dir)
watch_flags = --ignoreDotFiles
browserify_flags = -t [ stringify --extensions [ .bf ] ] \
                   -t [ babelify --presets [ es2015 ] ]

rwildcard=$(wildcard $1$2) $(foreach d,$(wildcard $1*),$(call rwildcard,$d/,$2))
js_files := $(call rwildcard,src/,*.js)
js_files += $(call rwildcard,test/,*.js)

all: clean css deps js docs gif

install:
	yarn
	git submodule update --init

clean:
	-rm -r dist
	-mkdir dist

lint: $(js_files)
	standard $^

watch:
	$(watch) 'make css js; date' src/vizualizer $(watch_flags)

deps:
	$(uglifyjs) vendor/bililiteRange/bililiteRange.js \
    vendor/bililiteRange/bililiteRange.fancytext.js \
    vendor/prism/prism.js \
    vendor/prism/components/prism-brainfuck.js > \
    $(dist_dir)/vendor.js

js: src/vizualizer/editor.js
	$(browserify) $(browserify_flags) $^ | \
    $(uglifyjs) > $(dist_dir)/editor.js

css: src/vizualizer/styles.css
	$(tachyons) $^ -m > $(dist_dir)/styles.css

gif:
	$(gifsicle) $(assets_dir)/retro-pixel-computer.gif -o $(dist_dir)/retro-pixel-computer.gif

docs: src/interpreter/js/brainfuck.js
	$(docco) $(docco_flags) $^

.PHONY: test
test:
	$(tap) test/*

.PHONY: testcov
testcov:
	$(tap) test/* --cov --coverage-report=lcov
