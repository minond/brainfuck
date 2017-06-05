'use strict';

const EV_SOFT_RESET = 'reset'
const EV_START = 'start'
const EV_PAUSE = 'pause'
const EV_UPDATE_PROG_STATE = 'updateprogramstate'
const EV_UPDATE_PROG_OUT_APPEND = 'updateprogramoutappend'
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
  const start = () => {
    emit(EV_SOFT_RESET)
    emit(EV_START)
    brainfuck(state.program, { tick, write })
  }

  const cont = () => {
    if (state.running || !state.tick) {
      return
    }

    emit(EV_START)
    state.tick()
  }

  const tick = (tick, update, { memory, pointer, idx }) => {
    let state_update = { tick, memory, pointer, idx }

    if (state.running) {
      state_update.tick_timer = setTimeout(tick, state.delay)
    }

    emit(EV_UPDATE_PROG_STATE, state_update)
  }

  const step = () =>
    state.tick ? state.tick() :
      brainfuck(state.program, { tick, write })

  const pause = () =>
    emit(EV_PAUSE)

  const write = (str) =>
    emit(EV_UPDATE_PROG_OUT_APPEND, str)

  return html`
    <section class="pa3 pa5-ns cf">
      <h1 class="f3 f-headline-m tipitop">Brainfuck</h1>

      <div class="editor-section fl w-100 w-50-ns bg-near-white tc">
        ${editor_button('Run', { onclick: start })}
        ${state.tick && !state.running ? editor_button('Continue', { onclick: cont }) : ''}
        ${state.running ? editor_button('Pause', { onclick: pause }) : ''}
        ${state.running ? '' : editor_button('Step', { onclick: step })}

        ${editor(state, emit)}
      </div>

      <div class="editor-section fl w-100 w-50-ns bg-near-white tc">
        <!-- these are here just for spacing... -->
        ${editor_button('.', '', 'hidden')}
        ${editor_button('.', '', 'hidden')}
        ${editor_button('.', '', 'hidden')}

        <div>output: ${state.output}</div>
        <div>pointer: ${state.pointer}</div>
        <div>idx: ${state.idx}</div>

        ${state.memory.map((cell) =>
          html`<div>${cell}</div>`)}
      </div>

      <img class="fuckyeah" src="/dist/retro-pixel-computer.gif" />
    </section>
  `
}

/**
 * @param {object} & state
 * @return {void}
 */
function set_blank_state(state) {
  if (state.tick_timer) {
    clearTimeout(state.tick_timer)
  }

  state.program = helloworld
  state.running = false
  state.tick = null
  state.tick_timer = null
  state.memory = []
  state.output = ''
  state.pointer = 0
  state.idx = 0
  state.delay = 100
}

/**
 * controller middleware
 * @param {object} state
 * @param {object} emitter
 * @return {void}
 */
function controls(state, emitter) {
  set_blank_state(state)

  const render = () =>
    emitter.emit('render')

  emitter.on(EV_UPDATE_PROG_STATE, ({ tick, tick_timer, memory, pointer, idx }) => {
    state.tick = tick
    state.tick_timer = tick_timer
    state.memory = memory
    state.pointer = pointer
    state.idx = idx
    render()
  })

  emitter.on(EV_START, () => {
    state.running = true
    render()
  })

  emitter.on(EV_PAUSE, () => {
    state.running = false
    render()
  })

  emitter.on(EV_SOFT_RESET, () => {
    let curr_prog = state.program
    set_blank_state(state)
    state.program = curr_prog
    render()
  })

  emitter.on(EV_UPDATE_PROG_OUT_APPEND, (str) => {
    state.output += str
    render()
  })

  emitter.on(EV_UPDATE_PROG, (program) => {
    set_blank_state(state)
    state.program = program
    render()
  })
}

/**
 * loggin middleware
 * @param {object} state
 * @param {object} emitter
 * @return {void}
 */
function logger(state, emitter) {
  emitter.on('*', (...args) =>
    console.log('%cchoochoo', 'color: #346fff', ...args))
}

/**
 * an editor component
 * @param {object} state
 * @param {function} emit
 * @return {html}
 */
function editor(state, emit) {
  const update_program = (prog) =>
    emit(EV_UPDATE_PROG, prog)

  const elem = html`<div contenteditable="true" class="editor"
    oninput=${(e) => update_program(e.target.innerText)}>${state.program}</div>`

  elem.isSameNode = (target) =>
    state.program === target.innerText

  return elem
}

/**
 * an editor button component
 * @param {string} value
 * @param {string|object} attrs (default: '')
 * @param {string} extra_classes (default: '')
 * @return {html}
 */
function editor_button(value, attrs = '', extra_classes = '') {
  return button(value, attrs, `editor-ctrl ${extra_classes}`)
}

/**
 * a standard button component
 * @param {string} value
 * @param {string|object} attrs (default: '')
 * @param {string} extra_classes (default: '')
 * @return {html}
 */
function button(value, attrs = '', extra_classes = '') {
  return html`<button ${attrs} class="${extra_classes} f6 link dim ba ph3 pv2 mb2 dib black">
    ${value}
  </button>`
}
