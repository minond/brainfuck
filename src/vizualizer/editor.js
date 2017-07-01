'use strict'

const CLASS_SELECTED = 'selected'
const CLASS_TOKEN = 'token'
const CLASS_COMMENT = 'comment'
const CLASS_BREAKPOINT = 'breakpoint'

const EV_DONE = 'done'
const EV_PAUSE = 'pause'
const EV_SOFT_RESET = 'reset'
const EV_START = 'start'
const EV_UPDATE_DELAY = 'updatedelay'
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
      if (state.breakpoints.indexOf(state.idx + 1) !== -1) {
        emit(EV_PAUSE)
      } else {
        let delay = Math.max(state.delay * 10, 10)
        stateUpdate.tickTimer = setTimeout(tick, delay)
      }
    }

    emit(EV_UPDATE_PROG_STATE, stateUpdate)
  }

  const step = () => {
    if (state.tick) {
      state.tick()
    } else {
      emit(EV_SOFT_RESET)
      exec()
    }
  }

  const done = () =>
    emit(EV_DONE)

  const pause = () =>
    emit(EV_PAUSE)

  const updateDelay = (delay) =>
    emit(EV_UPDATE_DELAY, delay)

  const write = (str) =>
    emit(EV_UPDATE_PROG_OUT_APPEND, str)

  let { program = '' } = state

  return html`
    <section class="pa3 pa4-ns cf container">
      <h1 class="mt0 f3 f2-m f1-l title">Brainfuck</h1>

      <div class="editor-section fl w-100 w-50-ns tc">
        <p class="lh-copy sans-serif">
          Hello, and welcome to my lil' ${link('Brainfuck',
          'https://esolangs.org/wiki/Brainfuck')} interpreter and state/memory
          vizualizer. Why spend time here? Well Brainfuck is a pretty cool
          programming language and building an interpreter for it is a good way
          to learn the basics of parsers, interpreters, and computer memory.
          ${link('Here\'s some code',
          'https://github.com/minond/brainfuck/blob/master/src/interpreter/js/brainfuck.js')}
          you can check out - it's hopefully pretty well documented.
        </p>

        <p class="lh-copy sans-serif">
          Here's some information about this program: It is
          ${codeSnippet(program.length)} bytes,
          ${codeSnippet(getProg(state).length)} of which are valid commands.
          The interpreter is going to interpret the character at index
          ${codeSnippet(state.idx)}, which is
          ${codeSnippet(getProg(state).charAt(state.idx))} , and has taken a
          total of ${codeSnippet(state.steps)} steps so far.
        </p>

        <p class="lh-copy sans-serif">
          ${!state.output
            ? html`<span>The program has had no output yet.</span>`
            : html`<span>
                     <span>This is the output of your program:</span>
                     ${codeSnippet(state.output)}
                   </span>`}
        </p>

        <div class="relative mt2-ns mb3">
            ${editorButton('Run', { onclick: start })}
            ${state.running ? editorButton('Pause', { onclick: pause }) : ''}
            ${state.running ? '' : editorButton('Step', { onclick: step })}
            ${state.tick && !state.running ? editorButton('Continue', { onclick: cont }) : ''}
            ${rangeInput(state.delay, updateDelay)}
        </div>

        <div class="pb3">
          ${chunk(fill(state.memory, Math.max(FRAME_SIZE, state.pointer + 1), MEM_NIL_VAL), FRAME_SIZE).map((row, rowNum) =>
            html`<div class="cellrow">
              ${fill(row, FRAME_SIZE, MEM_NIL_VAL).map((cell, i) =>
                html`
                  <div class="memcell ${isCellSelected(i, rowNum, state) ? 'selected' : ''}">
                    <span>${cell}</span>
                  </div>`)}
            </div>`)}
        </div>

        <p class="lh-copy sans-serif">
          If you'd like to learn more about Brainfuck and other really
          interesting esoteric programming languages, I recommend heading over
          to ${link('Esolang', 'https://esolangs.org/wiki/Main_Page')}.
        </p>
      </div>

      <div class="editor-section fl w-100 w-50-ns tc">
        ${editor(state, emit)}
      </div>

      <img class="fuckyeah" src="retro-pixel-computer.gif" />
    </section>
  `
}
// <p class="lh-copy sans-serif">
//   Brainfuck is a minimalist programming language created by
//   ${link('Urban Müller',
//   'https://esolangs.org/wiki/Urban_M%C3%BCller')}. Minimalist?
//   Minimalist. Here are the 8 commands that make up this turing complete
//   language:
// </p>
//
// <table class="f6 w-100 mw8 center" cellspacing="0">
//   <tbody class="lh-copy">
//     <tr>
//       <td class="pv1 bt bb b--black-20">${codeSnippet('>')}</td>
//       <td class="pv1 bt bb b--black-20 sans-serif">Move the pointer to the right</td>
//     </tr>
//     <tr>
//       <td class="pv1 bb b--black-20">${codeSnippet('<')}</td>
//       <td class="pv1 bb b--black-20 sans-serif">Move the pointer to the left</td>
//     </tr>
//     <tr>
//       <td class="pv1 bb b--black-20">${codeSnippet('+')}</td>
//       <td class="pv1 bb b--black-20 sans-serif">Increment the memory cell under the pointer</td>
//     </tr>
//     <tr>
//       <td class="pv1 bb b--black-20">${codeSnippet('-')}</td>
//       <td class="pv1 bb b--black-20 sans-serif">Decrement the memory cell under the pointer</td>
//     </tr>
//     <tr>
//       <td class="pv1 bb b--black-20">${codeSnippet('.')}</td>
//       <td class="pv1 bb b--black-20 sans-serif">Output the character signified by the cell at the pointer</td>
//     </tr>
//     <tr>
//       <td class="pv1 bb b--black-20">${codeSnippet(',')}</td>
//       <td class="pv1 bb b--black-20 sans-serif">Input a character and store it in the cell at the pointer</td>
//     </tr>
//     <tr>
//       <td class="pv1 bb b--black-20">${codeSnippet('[')}</td>
//       <td class="pv1 bb b--black-20 sans-serif">Jump past the matching ${codeSnippet(']')} if the cell under the pointer is 0</td>
//     </tr>
//     <tr>
//       <td class="pv1 bb b--black-20">${codeSnippet(']')}</td>
//       <td class="pv1 bb b--black-20 sans-serif">Jump back to the matching ${codeSnippet('[')} if the cell under the pointer is nonzero</td>
//     </tr>
//   </tbody>
// </table>

/**
 * @param {object} & state
 * @return {void}
 */
function setBlankState (state) {
  if (state.tickTimer) {
    clearTimeout(state.tickTimer)
  }

  if (!('delay' in state)) {
    state.delay = 20
  }

  state.program = helloworld
  state.running = false
  state.tick = null
  state.tickTimer = null
  state.breakpoints = []
  state.memory = []
  state.output = ''
  state.pointer = 0
  state.idx = 0
  state.steps = 0
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

    let tokens = document
      .querySelectorAll('.editor .token:not(.comment)')

    process.nextTick(() =>
      document.querySelectorAll('.editor .token.breakpoint').forEach((elem) =>
        elem.classList.remove(CLASS_BREAKPOINT)))

    process.nextTick(() =>
      document.querySelectorAll('.editor .token.selected').forEach((elem) =>
        elem.classList.remove(CLASS_SELECTED)))

    process.nextTick(() =>
      [tokens[state.idx]].map((elem) =>
        elem.classList.add(CLASS_SELECTED)))

    process.nextTick(() =>
      state.breakpoints.forEach((index) =>
        [tokens[index]].map((elem) =>
          elem.classList.add(CLASS_BREAKPOINT))))
  }

  document.body.addEventListener('click', (ev) => {
    let elem = ev.target
    let isElem = elem.classList.contains(CLASS_TOKEN)
    let isComment = elem.classList.contains(CLASS_COMMENT)
    let isBreakpoint = elem.classList.contains(CLASS_BREAKPOINT)

    if (!isElem || isComment) {
      return
    }

    let tokens = document
      .querySelectorAll('.editor .token:not(.comment)')

    let index = [].indexOf.call(tokens, elem)

    if (isBreakpoint) {
      state.breakpoints = state.breakpoints.filter((bp) => bp !== index)
      elem.classList.remove(CLASS_BREAKPOINT)
    } else {
      state.breakpoints.push(index)
      elem.classList.add(CLASS_BREAKPOINT)
    }
  })

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
    let currBreakpoints = state.breakpoints

    setBlankState(state)

    state.program = currProg
    state.breakpoints = currBreakpoints

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

  emitter.on(EV_UPDATE_DELAY, (delay) => {
    state.delay = delay
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
 * an input[range] field
 * @param {number} value
 * @return {html}
 */
function rangeInput (value, onchange) {
  const elem = html`<input value=${value} class="delay" type="range"
    onclick=${(ev) => onchange(+ev.target.value)}
    onchange=${(ev) => onchange(+ev.target.value)} />`

  elem.isSameNode = () =>
    true

  return elem
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
 * a link
 * @param {string} label
 * @param {string} href
 * @return {html}
 */
function link (label, href = '#') {
  return html`<a
    target="_blank"
    class="link underline blue hover-orange"
    href="${href}">${label}</a>`
}

/**
 * a snipped of code
 * @param {string} value
 * @return {html}
 */
function codeSnippet (value) {
  return html`<code class="ph1 tc bg-light-gray word-wrap">${value}</code>`
}

/**
 * a standard button component
 * @param {string} value
 * @param {string|object} attrs (default: '')
 * @param {string} extraClasses (default: '')
 * @return {html}
 */
function button (value, attrs = '', extraClasses = '') {
  return html`<button ${attrs} class="${extraClasses} f6 link dim ba ph3 pv2 dib black">
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
