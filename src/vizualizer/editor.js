'use strict';

const EV_UPDATE_PROG = 'updateprogram'

const brainfuck = require('../interpreter/js/brainfuck')
const html = require('choo/html')
const choo = require('choo')

const helloworld = require('../bf/helloworld.bf')

const app = choo()

app.use(logger)
app.use(controls)

app.route('*', editor_view)
app.mount('#view')

function editor_view(state, emit) {
  const run = () =>
    console.log('runnig')

  return html`
    <section class="pa3 pa5-ns cf">
      <h1 class="f3 f-headline-m tipitop">Brainfuck</h1>

      <div class="editor-section fl w-100 w-50-ns bg-near-white tc">
        ${editor_button('Run', { onclick: run })}
        ${editor_button('Pause')}
        ${editor_button('Step')}

        ${editor(state, emit)}
      </div>

      <div class="editor-section fl w-100 w-50-ns bg-near-white tc">
        <!-- these are here just for spacing... -->
        ${editor_button('.', '', 'hidden')}
        ${editor_button('.', '', 'hidden')}
        ${editor_button('.', '', 'hidden')}

        <div contenteditable="true" class="editor"></div>
      </div>

      <img class="fuckyeah" src="/dist/retro-pixel-computer.gif" />
    </section>
  `
}

function controls(state, emitter) {
  state.program = helloworld

  emitter.on(EV_UPDATE_PROG, (prog) => {
    state.program = prog
    emitter.emit('render')
  })
}

function logger(state, emitter) {
  emitter.on('*', (...args) =>
    console.log('%cchoochoo', 'color: #346fff', ...args))
}

function editor(state, emit) {
  const update_program = (prog) =>
    emit(EV_UPDATE_PROG, prog)

  const elem = html`<div contenteditable="true" class="editor"
    oninput=${(e) => update_program(e.target.innerText)}>${state.program}</div>`

  elem.isSameNode = (target) =>
    state.program === target.innerText

  return elem
}

function editor_button(value, attrs = '', extra_classes = '') {
  return button(value, attrs, `editor-ctrl ${extra_classes}`)
}

function button(value, attrs = '', extra_classes = '') {
  return html`<button ${attrs} class="${extra_classes} f6 link dim ba ph3 pv2 mb2 dib black">
    ${value}
  </button>`
}
