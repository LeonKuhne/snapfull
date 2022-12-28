const font_size = 10
const dbname = 'tonydb'
const pageUrl = window.location.href
const fail = (s) => console.error(`tony: ${s}`)
const info = (s) => console.info(`tony: ${s}`)
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
    fail('no entries exist'); return null
  }
  try { return JSON.parse(storage) }
  catch(e) { console.error('mem not loaded') }
}

function save(entries) {
  window.localStorage.setItem(
    dbname, JSON.stringify(entries))
}

/* DEPRICATED: replaced by recentFrequent
function mostFrequent() {
  let entries = load()
  let bestCount = 0
  let best = null 
  for (entry in entries) {
    let count = entries[entry]
    let keys = entry.split('|')
    let url = keys[0]
    if (url == pageUrl && count > bestCount) {
      bestCount = count
      best = {
        query: keys[1],
        idx: keys[2]
      }
    }
  }
  return best 
}
*/

function recentFrequent() {
  let entries = load()
  if (!entries) return null
  let bestTime = 0
  let best = null 
  console.log('recent frequent; entries', entries)
  for (entry in entries) {
    let keys = parseEntry(entry)
    // find highest timestamp
    let url = keys[0]
    if (url == pageUrl) {
      let timestamps = parseStamps(entries[entry])
      let totalTime = timestamps
        .reduce((s,t) => s+t, 0) 
      // update best time
      if (totalTime > bestTime) {
        bestTime = totalTime
        best = {
          query: keys[1],
          idx: keys[2]
        }
      }
    }
  }
  return best 
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

/* DEPRICATED: replaced by stamp
function increment(pageItem) {
  let entries = load()
  let keys = parseEntry(pageItem)
  url = keys[0]
  // only execute on current page
  if (url == pageUrl) {
    if (entries) {
      if (entries[pageItem]) {
        entries[pageItem] += 1
      } else {
        entries[pageItem] = 1
      }
    } else {
      entries = { [pageItem]: 1 }
    }
    save(entries)
  }
}
*/

/**
 * INTERACT
**/

function aliasDoubletap(key, callback, delay=DOUBLE_TAP_DELAY) {
  document.addEventListener("keyup", (e) => {
    let now = Date.now()
    if (e.which == key) {
      // pressed twice quickly
      if (now < lastPressed + delay) {
        callback()
      } else {
        lastPressed = now
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

function trySelect(key, tries=3) {
  elem = select(key)
  console.log("trying select")
  // retry 
  if (elem === null && tries > 0) {
    setTimeout(() => trySelect(key, tries-1), 1000)
    return
  }
}

function select(key) {
  if (!key) {
    info("nothing to outline")
    return false
  }
  elem = getElem(key)
  selectElem(elem)
  return elem
}

function scores() {
  let entries = load()
  console.info("Tony's Visits:")
  for (entry in entries) {
    parts = parseEntry(entry)
    console.info(`- ${parts[1]}:`, parseInt(parts[2]))
  }
}

/**
 * Run
**/

function main() {
  // show most clicked
  trySelect(recentFrequent())
  // add shortcut, 190 = '.'
  aliasDoubletap(190, () => {
    info('auto-clicking')
    key = getKey(selected)
    stamp(pageKey(key))
    selected.click()
  })
  // listen for clicks
  document.body.addEventListener('click', e => {
    let key = getKey(e.target)
    if (key) {
      stamp(pageKey(key))
      trySelect(recentFrequent())
    }
  })
  // show scores
  scores()
}

// wait for dom to be ready
function checkReady(tries=3, delay=100) {
  state = document.readyState
  if (state === "complete") {
    try {
      main()
    } catch(err) {
      console.log('err', err)
    }
  } else {
    info(`dom not yet ready: ${state}`)
    setTimeout(() => checkReady(tries-1, delay), delay)
  }
}

checkReady()
