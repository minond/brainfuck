'use strict'

const EV_DONE = 'done'
const EV_PAUSE = 'pause'
const EV_SOFT_RESET = 'reset'
const EV_START = 'start'
const EV_UPDATE_PROG = 'updateprogram'
const EV_UPDATE_PROG_OUT_APPEND = 'updateprogramoutappend'
const EV_UPDATE_PROG_STATE = 'updateprogramstate'

const brainfuck = require('../interpreter/js/brainfuck')
const html = require('choo/html')
const choo = require('choo')

const helloworld = require('../bf/helloworld.bf')
const app = choo()

app.use(logger)
app.use(controls)

app.route('*', editorView)
app.mount('#view')

/**
 * main view
 * @param {object} state
 * @param {function} emit
 * @return {html}
 */
function editorView (state, emit) {
  const start = () => {
    emit(EV_SOFT_RESET)
    emit(EV_START)
    brainfuck(state.program, { tick, write, done })
  }

  const cont = () => {
    if (state.running || !state.tick) {
      return
    }

    emit(EV_START)
    state.tick()
  }

  const tick = (tick, update, { memory, pointer, idx, steps }) => {
    let stateUpdate = { tick, memory, pointer, idx, steps }

    if (state.running) {
      stateUpdate.tickTimer = setTimeout(tick, state.delay)
    }

    emit(EV_UPDATE_PROG_STATE, stateUpdate)
  }

  const step = () =>
    state.tick ? state.tick()
      : brainfuck(state.program, { tick, write, done })

  const done = () =>
    emit(EV_DONE)

  const pause = () =>
    emit(EV_PAUSE)

  const write = (str) =>
    emit(EV_UPDATE_PROG_OUT_APPEND, str)

  return html`
    <section class="pa3 pa5-ns cf">
      <h1 class="f3 f-headline-m tipitop">Brainfuck</h1>

      <div class="editor-section fl w-100 w-50-ns bg-near-white tc">
        ${editorButton('Run', { onclick: start })}
        ${state.tick && !state.running ? editorButton('Continue', { onclick: cont }) : ''}
        ${state.running ? editorButton('Pause', { onclick: pause }) : ''}
        ${state.running ? '' : editorButton('Step', { onclick: step })}

        ${editor(state, emit)}
      </div>

      <div class="editor-section fl w-100 w-50-ns bg-near-white tc">
        <!-- these are here just for spacing... -->
        ${editorButton('.', '', 'hidden')}
        ${editorButton('.', '', 'hidden')}
        ${editorButton('.', '', 'hidden')}

        <div>output: ${state.output}</div>
        <div>pointer: ${state.pointer}</div>
        <div>idx: ${state.idx}</div>
        <div>steps: ${state.steps}</div>

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
function setBlankState (state) {
  if (state.tickTimer) {
    clearTimeout(state.tickTimer)
  }

  state.program = helloworld
  state.running = false
  state.tick = null
  state.tickTimer = null
  state.memory = []
  state.output = ''
  state.pointer = 0
  state.idx = 0
  state.steps = 0
  state.delay = 100
}

/**
 * controller middleware
 * @param {object} state
 * @param {object} emitter
 * @return {void}
 */
function controls (state, emitter) {
  setBlankState(state)

  const render = () =>
    emitter.emit('render')

  emitter.on(EV_UPDATE_PROG_STATE, ({ tick, tickTimer, memory, pointer, idx, steps }) => {
    state.tick = tick
    state.tickTimer = tickTimer
    state.memory = memory
    state.pointer = pointer
    state.idx = idx
    state.steps = steps
    render()
  })

  emitter.on(EV_START, () => {
    state.running = true
    render()
  })

  emitter.on(EV_DONE, () => {
    state.tick = null
    state.running = false
    render()
  })

  emitter.on(EV_PAUSE, () => {
    state.running = false
    render()
  })

  emitter.on(EV_SOFT_RESET, () => {
    let currProg = state.program
    setBlankState(state)
    state.program = currProg
    render()
  })

  emitter.on(EV_UPDATE_PROG_OUT_APPEND, (str) => {
    state.output += str
    render()
  })

  emitter.on(EV_UPDATE_PROG, (program) => {
    setBlankState(state)
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
function logger (state, emitter) {
  emitter.on('*', (...args) =>
    console.log('%cchoochoo', 'color: #346fff', ...args))
}

/**
 * an editor component
 * @param {object} state
 * @param {function} emit
 * @return {html}
 */
function editor (state, emit) {
  const updateProgram = (prog) =>
    emit(EV_UPDATE_PROG, prog)

  const elem = html`<div contenteditable="true" class="editor"
    oninput=${(e) => updateProgram(e.target.innerText)}>${state.program}</div>`

  elem.isSameNode = (target) =>
    state.program === target.innerText

  return elem
}

/**
 * an editor button component
 * @param {string} value
 * @param {string|object} attrs (default: '')
 * @param {string} extraClasses (default: '')
 * @return {html}
 */
function editorButton (value, attrs = '', extraClasses = '') {
  return button(value, attrs, `editor-ctrl ${extraClasses}`)
}

/**
 * a standard button component
 * @param {string} value
 * @param {string|object} attrs (default: '')
 * @param {string} extraClasses (default: '')
 * @return {html}
 */
function button (value, attrs = '', extraClasses = '') {
  return html`<button ${attrs} class="${extraClasses} f6 link dim ba ph3 pv2 mb2 dib black">
    ${value}
  </button>`
}
