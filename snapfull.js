const waitSelect = (query, done) => {
  elem = document.querySelector(query)
  if (elem) done(elem)
  else setTimeout(() => waitSelect(query, done), 500)
}

window.onload = () => {

  // their vid
  waitSelect("video.qv9Ug", elem => {
    // wait a sec for things to load
    setTimeout(() => {
      console.log("Their video:", elem)
      elem.style.position = "fixed"
      elem.style.top = 0
      elem.style.left = 0
    }, 1000)
  })

  // your vid
  waitSelect(".OJ_8M", elem => {
    // wait a sec for things to load
    setTimeout(() => {
      console.log("Your video:", elem)
      elem.style.paddingTop = "50vh"
    }, 1000)
  })

  waitSelect("div.c9EV9", elem => {
    // wait a sec for things to load
    setTimeout(() => {
      elem.style.position = "fixed";
      elem.style.height = "20%";
      elem.style.width = "20%";
      elem.style.left = "12.5%";
      elem.style.bottom = "1%";
    }, 1000)
  })

  console.log("SnapFull Loaded")
}
