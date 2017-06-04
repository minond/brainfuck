'use strict';

const brainfuck = require('../interpreter/js/brainfuck')
const html = require('choo/html')
const choo = require('choo')

const helloworld = require('../bf/helloworld.bf')

const app = choo()

app.use(logger)
app.route('*', editor)
app.mount('#view')

function editor() {
  return html`
    <section class="pa3 pa5-ns cf">
      <h1 class="f3 f-headline-m tipitop">Brainfuck</h1>

      <div class="editor-section fl w-100 w-50-ns bg-near-white tc">
        <button id="run" class="editor-ctrl f6 link dim ba ph3 pv2 mb2 dib black">Run</button>
        <button id="pause" class="editor-ctrl f6 link dim ba ph3 pv2 mb2 dib black">Pause</button>
        <button id="step" class="editor-ctrl f6 link dim ba ph3 pv2 mb2 dib black">Step</button>

        <div id="editor" contenteditable="true" class="editor">${helloworld}</div>
      </div>

      <div class="editor-section fl w-100 w-50-ns bg-near-white tc">
        <!-- these are here just for spacing... -->
        <button class="editor-ctrl f6 link dim ba ph3 pv2 mb2 dib black hidden">&nbsp;</button>
        <button class="editor-ctrl f6 link dim ba ph3 pv2 mb2 dib black hidden">&nbsp;</button>
        <button class="editor-ctrl f6 link dim ba ph3 pv2 mb2 dib black hidden">&nbsp;</button>

        <div contenteditable="true" class="editor"></div>
      </div>

      <img class="fuckyeah" src="/dist/retro-pixel-computer.gif" />
    </section>
  `
}

function logger(state, emitter) {
  emitter.on('*', (...args) =>
    console.log('%cchoochoo', 'color: #346fff', ...args))
}
