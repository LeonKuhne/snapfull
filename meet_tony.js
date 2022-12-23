let font_size = 10
let dbname = 'tonydb'
let pageUrl = window.location.href
let fail = (s) => console.error(`tony: ${s}`)
let OUTLINE_CLASS = "tonys-helper"

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

function getKey(elem) {
  let query = elem.tagName.toLowerCase()
  let attrMap = elem.attributes
  for (let idx=0; idx<attrMap.length; idx++) {
    attr = attrMap.item(idx)
    // remove outline indicator
    if (attr.name == "class") {
      classes = attr.value.split(' ')
      classes.splice(
        classes.indexOf(OUTLINE_CLASS), 1)
      classes.join(' ')
      attr.value = classes
    }
    query += `[${attr.name}="${attr.value}"]`
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
    console.log('no entries exist')
    return null
  }
  try { return JSON.parse(storage) }
  catch(e) { console.error('mem not loaded') }
}

function save(entries) {
  window.localStorage.setItem(dbname, JSON.stringify(entries))
}

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

function increment(pageItem) {
  let entries = load()
  let keys = pageItem.split('|')
  url = keys[0]

  // only execute on current page
  if (url == pageUrl) {
    key = keys[1]

    if (entries) {
      entries[pageItem] += 1
      console.log('incremented entry (' + entries[pageItem] + ')')
    } else {
      entries = { [pageItem]: 1 }
      console.log('created entry')
    }
    save(entries)
  }
}

/**
 * INTERACT
**/

function aliasDoubletap(key, callback, delay=DOUBLE_TAP_DELAY) {
  document.addEventListener("keyup", (e) => {
    if (e.which == key) {
      let now = Date.now()
      // pressed twice quickly
      if (now < lastPressed + delay) {
        callback()
      }
    } else {
      lastPressed = now
    }
  })
}

/**
 * INDICATE
**/

let lastPressed = Date.now()
let DOUBLE_TAP_DELAY = 200 // ms

function outline(elem) {
  if (elem) { 
    classes = elem.classList
    classes.add(OUTLINE_CLASS)
    // TODO add css code that defines tonys helper class
    elem.style.borderColor = "purple"
    elem.style.borderStyle = "solid"
    elem.style.borderWidth = "4px"
  }
}

function main() {
  // show most clicked
  best = mostFrequent()
  if (best) {
    bestElem = getElem(best)
    console.log("best", best, bestElem)
    if (bestElem) {
      outline(bestElem)
      // add shortcut: double tap '.'
      aliasDoubletap(46, () => {
        console.log('activating', bestElem)
        bestElem.click()
      })
    }
  } else {
    console.log("tony: nothing to outline")
  }
  
  // listen for clicks
  document.body.addEventListener('click', (e) => {
    let key = getKey(e.target)
    if (key) { // store url/key, update value
      console.log("clicked on", e.target, key)
      increment(pageKey(key))
    }
  })
}


try {
  if (document.readyState === "complete") {
    main()
  } else {
    console.log("couldn't meet-tony: dom wasn't ready")
  }
} catch(err) {
  console.log('err', err)
}
