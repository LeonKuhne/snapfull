let font_size = 10
let dbname = 'tonydb'
let DISABLE_PRINT = true

function print(text) {
	if (!DISABLE_PRINT) {
		$('body').prepend('<div style="padding: 20px; font-size: ' + font_size + 'px; background-color: black; color: green;">' + text + '</div>')
	}
}

// db handler, retreive as string, handle as object
function getEntries() {
	let storage = window.localStorage.getItem(dbname)
	if (storage == null || storage == "[]") {
		print('no entries exist')
		return null
	} else {
		try {
			return JSON.parse(storage)
		} catch (e) {
			print('failed to get entries')
		}
	}
}

// get the most frequent entry
function highest() {
	let entries = getEntries()
	let maxCount = 0
	let highestEntry
	for (entry in entries) {
		let count = entries[entry]
		let keys = entry.split('|')
		let url = keys[0]
		let key = keys[1]
		if (url == window.location.href && count > maxCount) {
			maxCount = count
			highestEntry = key
		}
	}
	return highestEntry

}

let lastPressed = Date.now()
let DOUBLE_TAP_DELAY = 200 // ms
function draw() {
	let key = highest()

	if (key) {
		// insert in comma before spaces

		print('drawing with key: ' + key)
		$(key).css({
			"border-color": "green",
			"border-style": "solid",
			"border-width": "4px"
		})

		// TODO add keyboard input listener
		$("html").keypress((event) => {
			let now = Date.now()
			if (event.which == 46 && lastPressed + DOUBLE_TAP_DELAY > now) { // '.' key
				print('clicking on button: ' + JSON.stringify($(key + ":first")))
				$(key + ":first").trigger('click') // only take the first element for now TODO
			}
			lastPressed = now
		})
	}
}

// transaction for incrementing a key value by one
function bump(pageItem) {
	let entries = getEntries()

	let keys = pageItem.split('|')
	url = keys[0]

	// only execute on current page
	if (url == window.location.href) {
		key = keys[1]

		if (entries) {
			entries[pageItem] += 1
			print('incremented entry (' + entries[pageItem] + ')')
		} else {
			entries = {}
			entries[pageItem] = 1
			print('created entry')
		}

		// store as string
		window.localStorage.setItem(dbname, JSON.stringify(entries))
		print('new count ' + count + 1 + ' for key ' + key)
	}
}



draw()

$('*').on("click", (elem) => {
	let clicked = $(elem.target)

	let key = "" // <tag> <classes> <id>
	key += clicked.prop("tagName")
	key += '.' + clicked.attr('class').replace(/\s/g, '.')
	let id = clicked.attr('id')
	key += id ? '#' + id : ''

	if (key) { // store url/key, update value
		print("button clicked with key: " + key)
		bump(window.location.href + '|' + key)
		print(highest())
		//draw()
	}
})


print("page loaded")
