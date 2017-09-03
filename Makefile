browserify = node_modules/.bin/browserify
docco = node_modules/.bin/docco
tachyons = node_modules/.bin/tachyons
watch = node_modules/.bin/watch
tap = node_modules/.bin/tap
uglifyjs = node_modules/.bin/uglifyjs
standard = node_modules/.bin/standard

dist_dir = build
docs_dir = docs

NODE_ENV ?= production

docco_flags = --layout parallel --output $(docs_dir)/annotated
watch_flags = --ignoreDotFiles
browserify_flags = -t [ stringify --extensions [ .bf ] ] \
                   -t [ babelify --presets [ es2015 ] ] \
                   -t [ envify --NODE_ENV $(NODE_ENV) ]

rwildcard=$(wildcard $1$2) $(foreach d,$(wildcard $1*),$(call rwildcard,$d/,$2))
js_files := $(call rwildcard,src/,*.js)
js_files += $(call rwildcard,test/,*.js)

PORT ?= 3000

build: clean css deps html js

install:
	yarn
	git submodule update --init

clean:
	-rm -r $(dist_dir)
	-mkdir $(dist_dir)

lint: $(js_files)
	$(standard) $^

watch:
	$(watch) 'make css js; date' src/vizualizer $(watch_flags)

deps:
	$(uglifyjs) vendor/bililiteRange/bililiteRange.js \
    vendor/bililiteRange/bililiteRange.fancytext.js \
    vendor/prism/prism.js \
    vendor/prism/components/prism-brainfuck.js > \
    $(dist_dir)/vendor.js

html:
	cp src/vizualizer/index.html index.html

js: src/vizualizer/editor.js
	$(browserify) $(browserify_flags) $^ | \
    $(uglifyjs) > $(dist_dir)/editor.js
	# fixing use strict bug in safari
	perl -p -i -e 's/use strict//g' $(dist_dir)/editor.js

css: src/vizualizer/styles.css
	$(tachyons) $^ -m > $(dist_dir)/styles.css

.PHONY: docs
docs: src/interpreter/brainfuck.js
	$(docco) $(docco_flags) $^

.PHONY: test
test:
	$(tap) test/*

.PHONY: testcov
testcov:
	$(tap) test/* --cov --coverage-report=lcov

.PHONY: serve
serve:
	@echo "Opening http://localhost:$(PORT)"
	(sleep 1 && open http://localhost:$(PORT)) &
	python -m SimpleHTTPServer $(PORT)

.PHONY: help
help:
	@echo "bf"
	@echo
	@echo "# main"
	@echo "build          (default) builds app"
	@echo "install        downloads all dependencies"
	@echo "clean          clears \`$(dist_dir)\` directory"
	@echo "watch          triggers build on file updates"
	@echo "serve          http server for serving static assets"
	@echo
	@echo "# automated checks"
	@echo "lint           runs all linters"
	@echo "test           runs all tests"
	@echo "testcov        runs all tests and generates test coverate reports"
	@echo
	@echo "# misc"
	@echo "deps           compile global dependencies"
	@echo "html           builds app's html files"
	@echo "js             builds app's js code"
	@echo "css            builds app's css code"
	@echo "docs           generate documentation"
	@echo "help           see this output"
