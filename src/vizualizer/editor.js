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

if (process.env.NODE_ENV === 'development') {
  app.use(logger)
}

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
      <h1 class="mt0 f3 f2-m f1-l title fw1 baskerville">Brainfuck</h1>

      <div class="editor-section fl w-100 w-50-ns tc">
        <div class="lh-copy helvetica">
          <p class="mt0">
            ${link('Brainfuck', 'https://esolangs.org/wiki/Brainfuck')}, one of
            the ${link('esoteric programming languages',
            'https://esolangs.org/wiki/Esoteric_programming_language')} you've
            probably heard of. Partly because of its minimal instruction set
            but most likely because it has the word <span class="i">fuck</span>
            in its name. That said this language doesn't have to leave you
            thinking <span class="i">"wtf?"</span>. This very tool will help
            you learn and understand this language and how with just 8 commands
            you can really have a turing complete language.
          </p>

          <p>
            Besides this text you'll see buttons you can use to execute your
            program. This can be done in continuation or one command at a time
            and as your program is running you can slide the range input field
            to alter the speed at which the code runs.  Below your controls
            you'll notice a table (with ten 0's at the start) which is the
            internal memory.  And finally your code editor, where you can set
            breakpoints by clicking on commands that will halt your program's
            execution. Now for a quick introduction to the language:
          </p>

          <ul class="pl4">
            <li>
              ${codeSnippet('<')} and ${codeSnippet('>')} move the pointer to
              the left and to the right. Keep an on the memory cells to the
              right -- the cell that has a black background color is the active
              cell and the one where increment, decrement, and loops will act
              on or check.
            </li>

            <li class="pt2">
              ${codeSnippet('+')} and ${codeSnippet('-')} increment and
              decrement the active cell. Note that incrementing above 255 will
              "wrap" the value back around to 0, and decrementing below 0 will
              take you to 255.
            </li>

            <li class="pt2">
              ${codeSnippet('[')} and ${codeSnippet(']')} are the language's
              only control flow operators. The code inside of the loop is ran
              as long as that value of the active cell is not zero. This of it
              as a ${codeSnippet('while (ptr != 0) {}')} loop.
            </li>

            <li class="pt2">
              ${codeSnippet('.')} and ${codeSnippet(',')} are the io functions.
              A period will output the character associated with the
              ${link('ASCII', 'https://en.wikipedia.org/wiki/ASCII')} in the
              active cell (so if the active cell has a value of 97 and you
              output its value, you should get an "a".)
            </li>
          </ul>

          <p>
            So play around with this tool. Start by running the sample code or
            creating basic programs on your own and see for yourself how with
            even the most basic control flow and altering commands you can
            technically accomplish any task. If you're curious about the code
            and the interpreter that are running on this page,
            ${link('go here', 'https://github.com/minond/brainfuck')}, and if you'd like
            to learn more about Brainfuck and other really interesting esoteric
            programming languages then I recommend heading over to
            ${link('Esolang', 'https://esolangs.org/wiki/Main_Page')}.
          </p>
        </div>

        <img class="fuckyeah" src="retro-pixel-computer.gif" />
      </div>

      <div class="editor-section fl w-100 w-50-ns tc pb4 pb2-ns">
        <div class="lh-copy helvetica">
          <p class="mt0">
            Here's some information about your program: it is
            ${codeSnippet(program.length)} bytes,
            ${codeSnippet(getProg(state).length)} of which are valid commands.
            The interpreter is going to interpret the character at index
            ${codeSnippet(state.idx)}, which is
            ${codeSnippet(getProg(state).charAt(state.idx))} , and has taken a
            total of ${codeSnippet(state.steps)} steps so far.

            ${!state.output
              ? html`<span>The program has had no output yet.</span>`
              : html`<span>
                       <span>This is the output of your program:</span>
                       ${codeSnippet(state.output)}
                     </span>`}
          </p>
        </div>

        <div class="relative mt2-ns mb3">
          <span>
            ${editorButton('Run', { onclick: start })}
            ${state.running ? editorButton('Pause', { onclick: pause }) : ''}
            ${state.running ? '' : editorButton('Step', { onclick: step })}
            ${state.tick && !state.running ? editorButton('Continue', { onclick: cont }) : ''}
          </span>

          <span>
            ${rangeInput(state, 'delay', updateDelay)}
          </span>
        </div>

        <div title="Memory Cells" class="pb3">
          ${chunk(fill(state.memory, Math.max(FRAME_SIZE, state.pointer + 1), MEM_NIL_VAL), FRAME_SIZE).map((row, rowNum) =>
            html`<div class="cellrow">
              ${fill(row, FRAME_SIZE, MEM_NIL_VAL).map((cell, i) =>
                html`
                  <div class="memcell ${isCellSelected(i, rowNum, state) ? 'selected' : ''}">
                    <span>${cell}</span>
                  </div>`)}
            </div>`)}
        </div>

        ${editor(state, emit)}
      </div>
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

  if (!('delay' in state)) {
    state.delay = 20
  }

  if (!('breakpoints' in state)) {
    state.breakpoints = []
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
        elem && elem.classList.add(CLASS_SELECTED)))

    process.nextTick(() =>
      state.breakpoints.forEach((index) =>
        [tokens[index]].map((elem) =>
          elem && elem.classList.add(CLASS_BREAKPOINT))))
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

    if (!program || !program.trim()) {
      state.breakpoints = []
    }

    process.nextTick(render)
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
 * @param {object} state
 * @param {string} prop
 * @return {html}
 */
function rangeInput (state, prop, onchange) {
  const elem = html`<input value=${state[prop]} class="delay" type="range"
    onclick=${(ev) => onchange(+ev.target.value)}
    onchange=${(ev) => onchange(+ev.target.value)} />`

  elem.isSameNode = (target) =>
    +state[prop] !== +target.value

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
  return html`<code class="f6 ph1 tc bg-light-gray word-wrap">${value}</code>`
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
