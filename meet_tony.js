let font_size = 10
let dbname = 'daddy'

function print(text) {
	$('body').prepend('<div style="padding: 20px; font-size: ' + font_size + 'px; background-color: black; color: green;">' + text + '</div>')
}

// db handler, retreive as string, handle as object
function getEntries() {
	let storage = window.localStorage.getItem(dbname)
	if (storage == null) {
		print('no entries exist')
		return []
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
		if (count > maxCount) {
			maxCount = count
			highestEntry = entry
		}
	}
	return highestEntry

}

function draw() {
	let classNames = highest()
	// insert in comma before spaces
	let classQuery = '.' + classNames.replace(/\s/g, '.')
	//print('query: ' + classQuery)
	$(classQuery).css({
		"border-color": "green",
		"border-style": "solid",
		"border-width": "4px"
	})
}

// transaction for incrementing a key value by one
function bump(key) {
	let entries = getEntries()

	if (entries == []) {
		entries = {}
		entries[key] = 1
		print('created entry')

	} else {
		entries[key] += 1
		print('incremented entry (' + entries[key] + ')')
	}

	// store as string
	window.localStorage.setItem(dbname, JSON.stringify(entries))
	print('new count ' + count + 1 + ' for key ' + key)
}



draw()

$('button').click((elem) => {
	let clicked = $(elem.target)
	let classNames = clicked.attr('class')
	if (classNames) { // store key, update value
		print("button clicked with classes: " + classNames)
		bump(classNames)
		print(highest())
		draw()
	}
})


print("page loaded")