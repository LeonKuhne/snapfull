const font_size = 10
const dbname = 'tonydb'
const pageUrl = window.location.href
const log = (s,l) => l(`tony: ${s[0]}`, ...s.splice(1))
const err = (...s) => log(s, console.error)
const info = (...s) => log(s, console.info)
const debug = (...s) => log(s, console.debug)
const OUTLINE_CLASS = "tonys-helper"
const MAX_CLICKS = 5
let selected = null

/**
 * IDENTIFY 
**/

function getKeyIdx(query, elem) {
  results = getElems(query)
  if (results) {
    idx = results.indexOf(elem)
    if (idx >= 0) { return idx }
    else { fail("key too generic") }
  } else { fail("key invalid") }
  return null
}

function attrToString(attr) {
  include = true
  // remove outline indicator
  if (attr.name === "class") {
    if (attr.value) {
      attr.value = attr.value
        .split(' ')
        .filter(c => c != OUTLINE_CLASS)
        .join(' ')
    }
    include = attr.value ? true : false
  }
  if (!include) { return null }
  return `[${attr.name}="${attr.value}"]`
}

function getKey(elem) {
  let query = elem.tagName.toLowerCase()
  let attrMap = elem.attributes
  for (let idx=0; idx<attrMap.length; idx++) {
    attr = attrMap.item(idx)
    queryPart = attrToString(attrMap.item(idx))
    if (queryPart) {
      query += queryPart 
    }
  }
  // find index
  idx = getKeyIdx(query, elem)
  return { query, idx }
}

function getElems(query) {
  return Array.from(
    document.querySelectorAll(query));
}
function getElem(key) {
  return getElems(key.query)[key.idx]
}

function pageKey(key) {
  return `${pageUrl}|${key.query}|${key.idx}`
}

/**
 * REMEMBER 
**/

function load() {
  let storage = window.localStorage.getItem(dbname)
  if (storage == null || storage == "[]") {
    return null
  }
  try {
    return JSON.parse(storage)
  } catch(e) {
    fail('mem not loaded')
  }
}

function save(entries) {
  window.localStorage.setItem(
    dbname, JSON.stringify(entries))
}

function recentFrequent(idx=0) {
  let entries = load()
  if (!entries) return null
  let bests = []
  for (entry in entries) {
    let keys = parseEntry(entry)
    // find highest timestamp
    let url = keys[0]
    if (url == pageUrl) {
      let timestamps = parseStamps(entries[entry])
      let totalTime = timestamps.reduce((s,t) => s+t, 0) 
      // update best time
      if (!bests.length || totalTime > bests[0].time) {
        bests.push({
          time: totalTime,
          key: {
            query: keys[1],
            idx: keys[2]
          }
        })
      }
    }
  }
  return bests[idx]?.key
}

function parseEntry(str) {
  return str.split('|')
}
function parseStamps(str) {
  stamps = []
  for (stampStr of str.split(',')) {
    stamps.push(parseInt(stampStr))
  }
  return stamps
}
function joinStamps(timestamps) {
  return timestamps.join(',') 
}

function stamp(pageItem, maxLength=MAX_CLICKS) {
  let entries = load()
  let keys = parseEntry(pageItem)
  let url = keys[0]
  // only execute on current page
  if (url == pageUrl) {
    let timestamp = new Date().getTime()
    if (!entries) entries = {}
    let entry = entries[pageItem]
    // comma delim list of timestamps
    let timestamps = entry ? parseStamps(entry) : []
    timestamps.push(timestamp)
    // keep within max length
    if (maxLength && timestamps.length > maxLength) {
      timestamps.shift()
    }
    // update entry
    entries[pageItem] = joinStamps(timestamps) 
    save(entries)
  }
}

/**
 * INTERACT
**/

let repeatedClicks = 0
function aliasRepeatedTaps(key, callback, delay=DOUBLE_TAP_DELAY) {
  document.addEventListener("keyup", (e) => {
    let now = Date.now()
    if (e.which == key) {
      // pressed twice quickly
      if (now < lastPressed + delay) {
        callback(repeatedClicks)
        repeatedClicks += 1
      } else {
        lastPressed = now
        repeatedClicks = 0
      }
    }
  })
}

/**
 * INDICATE
**/

let lastPressed = Date.now()
let DOUBLE_TAP_DELAY = 200 // ms

function loadCss(css) {
  style = document.createElement('style')
  style.type = 'text/css'
  style.innerHTML = css
  document.getElementsByTagName('head')[0]
    .appendChild(style)
}

function outline(elem) {
  classes = elem.classList
  classes.add(OUTLINE_CLASS)
  loadCss(`.${OUTLINE_CLASS} {
    border-color: purple;
    border-style: solid;
    border-width: 4px;
  }`)
}

function deselectElem(elem) {
  if (!elem) return
  elem.classList.remove(OUTLINE_CLASS)
  selected = null
}

function selectElem(elem) {
  if (!elem) return
  if (selected) deselectElem(selected)
  selected = elem
  outline(elem)
}

DEFAULT_RETRY = {
  msg: "retrying...",
  isDone: x => !!x,
  onDone: () => undefined,
  tries: 5,
  delay: 100
}
function retry(callback, options={}) {
  const o = {...DEFAULT_RETRY, ...options}
  let result = callback() 
  if (o.isDone(result)) {
    o.onDone(result)
  } else if (o.tries) {
    setTimeout(() => {
      debug(o.msg, result)
      retry(callback, {...o,
        tries: o.tries-1})
    }, o.delay)
  }
}

function trySelect(key) {
  retry(() => select(key), {
    msg: "selecting...",
    isDone: elem => elem === null,
    onDone: elem => {
      if (elem === false) info("no history")
    }
  })
}

function select(key) {
  if (!key) return false
  elem = getElem(key)
  selectElem(elem)
  return elem
}

function scores() {
  const entries = load()
  console.info("Tony's Visits:")
  for (entry in entries) {
    // find details
    const keys = parseEntry(entry)
    const query = keys[1]
    const idx = keys[2]
    // beautify dates
    console.log(entries, entry)
    const timestamps = parseStamps(entries[entry])
    const dates = timestamps
      .map(t => new Date(t).toISOString())
    // display
    console.info(`- ${query}[${idx}]`)
    for (date of dates) {
      console.info(`  ${date}`)
    }
  }
}

/**
 * Run
**/

function main() {
  // show most clicked
  trySelect(recentFrequent())
  // add shortcut, 190 = '.'
  aliasRepeatedTaps(190, (idx) => {
    info('auto-clicking', idx)
    key = getKey(selected)
    stamp(pageKey(key))
    selected.click()
    trySelect(recentFrequent(idx+1))
  })
  // listen for clicks
  window.addEventListener('mousedown', e => {
    let key = getKey(e.target)
    if (key) {
      info(`you clicked on ${key}`)
      stamp(pageKey(key))
      trySelect(recentFrequent())
    }
  })
  // show scores
  scores()
}

// wait for dom to be ready
function checkReady() {
  retry(() => document.readyState, {
    msg: "waiting...",
    isDone: state => state === "complete",
    onDone: () => {
      try { main() }
      catch(err) { fail(err) }
    }
  })
}

checkReady()
