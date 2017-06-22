'use strict'

const EV_DONE = 'done'
const EV_PAUSE = 'pause'
const EV_SOFT_RESET = 'reset'
const EV_START = 'start'
const EV_UPDATE_PROG = 'updateprogram'
const EV_UPDATE_PROG_OUT_APPEND = 'updateprogramoutappend'
const EV_UPDATE_PROG_STATE = 'updateprogramstate'

const FRAME_SIZE = 10
const MEM_NIL_VAL = 0

const CHAR_IGNORE = /[^[\]<>.,+-]+/g

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
    exec()
  }

  const exec = () =>
    brainfuck(getProg(state), { tick, write, done })

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
    state.tick ? state.tick() : exec()

  const done = () =>
    emit(EV_DONE)

  const pause = () =>
    emit(EV_PAUSE)

  const write = (str) =>
    emit(EV_UPDATE_PROG_OUT_APPEND, str)

  let { program = '' } = state

  return html`
    <section class="pa3 pa4-ns cf container">
      <div class="editor-section fl w-100 w-50-ns tc">
        <h1 class="mt0 f3 f2-m f1-l title">Brainfuck</h1>

        <p class="lh-copy sans-serif">
          Here's some information about this program: It is
          ${codeSnippet(program.length)} bytes,
          ${codeSnippet(getProg(state).length)} of which are valid commands.
          The interpreter is going to interpret the character at index
          ${codeSnippet(state.idx)}, which is
          ${codeSnippet(getProg(state).charAt(state.idx))} , and has so has a
          total of ${codeSnippet(state.steps)} so far.
        </p>

        <p class="lh-copy sans-serif">
          ${!state.output
            ? html`<span>The program has had no output yet.</span>`
            : html`<span>
                     <span>This is the output of your program:</span>
                     ${codeSnippet(state.output)}
                   </span>`}
        </p>

        <div class="pt2-ns">
            ${editorButton('Run', { onclick: start })}
            ${state.running ? editorButton('Pause', { onclick: pause }) : ''}
            ${state.running ? '' : editorButton('Step', { onclick: step })}
            ${state.tick && !state.running ? editorButton('Continue', { onclick: cont }) : ''}
        </div>

        <div class="pb3 pb0-ns">
          ${chunk(fill(state.memory, Math.max(FRAME_SIZE, state.pointer + 1), MEM_NIL_VAL), FRAME_SIZE).map((row, rowNum) =>
            html`<div class="cellrow">
              ${fill(row, FRAME_SIZE, MEM_NIL_VAL).map((cell, i) =>
                html`
                  <div class="memcell ${isCellSelected(i, rowNum, state) ? 'selected' : ''}">
                    <span>${cell}</span>
                  </div>`)}
            </div>`)}
        </div>

      </div>

      <div class="editor-section fl w-100 w-50-ns tc">
        ${editor(state, emit)}
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
  state.delay = 10
}

/**
 * controller middleware
 * @param {object} state
 * @param {object} emitter
 * @return {void}
 */
function controls (state, emitter) {
  setBlankState(state)

  const render = () => {
    emitter.emit('render')

    process.nextTick(() =>
      document.querySelectorAll('.editor .token.selected').forEach((elem) =>
        elem.classList.remove('selected')))

    process.nextTick(() =>
      [document.querySelectorAll('.editor .token:not(.comment)')[state.idx]].map((elem) =>
        elem.classList.add('selected')))
  }

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

  const extract = (elem) =>
    elem.innerText

  /* global bililiteRange */
  /* global Prism */
  const highlight = () =>
    bililiteRange.fancyText(elem.querySelector('code'),
      Prism.highlightElement)

  const elem = html`
    <pre><code
      contenteditable="true"
      class="editor language-brainfuck"
      onload=${(e) => highlight(e.target)}
      oninput=${(e) => updateProgram(extract(e.target))}
    >${state.program}</code></pre>`

  elem.isSameNode = (target) =>
    state.program === extract(target)

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
 * a snipped of code
 * @param {string} value
 * @return {html}
 */
function codeSnippet (value) {
  return html`<code class="ph1 tc bg-light-gray">${value}</code>`
}

/**
 * a standard button component
 * @param {string} value
 * @param {string|object} attrs (default: '')
 * @param {string} extraClasses (default: '')
 * @return {html}
 */
function button (value, attrs = '', extraClasses = '') {
  return html`<button ${attrs} class="${extraClasses} f6 link dim ba ph3 pv2 mt3-m mt0 mb3 dib black">
    ${value}
  </button>`
}

/**
 * chunks an array into n arrays of a maximum size
 * @param {array} arr
 * @param {number} size
 * @return {array}
 */
function chunk (arr, size) {
  var tmp = []

  for (var i = 0, len = arr.length; i < len; i += size) {
    tmp.push(arr.slice(i, i + size))
  }

  return tmp
}

/**
 * makes sure arr is at least as large as specified
 * @param {array} arr
 * @param {number} size
 * @param {*} [val]
 * @return {array}
 */
function fill (arr, size, val) {
  var tmp = arr.concat([])

  for (var i = 0, len = tmp.length; i < len; i++) {
    if (tmp[i] === undefined) {
      tmp[i] = val
    }
  }

  while (tmp.length < size) {
    tmp.push(val)
  }

  return tmp
}

/**
 * @param {number} cellNum
 * @param {number} rowNum
 * @param {object} state
 * @return {boolean}
 */
function isCellSelected (cellNum, rowNum, state) {
  return cellNum + rowNum * FRAME_SIZE === state.pointer
}

/**
 * @param {object} state
 * @return {string}
 */
function getProg (state) {
  if (state && state.program) {
    return state.program.replace(CHAR_IGNORE, '')
  } else {
    return ''
  }
}
