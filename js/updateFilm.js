let days = Array.from(document.getElementsByClassName("page-nav__day")); 
let date = new Date();
let allDays = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"]

days.forEach(day => { 
  date.setDate(date.getDate());
  day.children[1].textContent = date.getDate();
  let num = Number(date.getDay());
  day.children[0].textContent = allDays[num];
  if (num == 0 || num == 6) {
    day.classList.add("page-nav__day_weekend");
  }
  date.setDate(date.getDate() + 1);
})

let currentDate = new Date();
let selectDay = new Date(); 
let navDay = document.getElementsByClassName("page-nav")[0];
navDay.getElementsByClassName("page-nav__day_chosen")[0].classList.toggle("page-nav__day_chosen");
navDay.children[0].classList.toggle("page-nav__day_chosen")

let pageNavDays = Array.from(document.getElementsByClassName("page-nav__day"));
pageNavDays.forEach((e,index) => {
  e.onclick = function () {
    document.getElementsByClassName("page-nav__day_chosen")[0].classList.toggle("page-nav__day_chosen"); 
    e.classList.toggle("page-nav__day_chosen");
    selectDay.setDate(currentDate.getDate()+index);
    setFilms(JSON.parse(localStorage.getItem("info")),selectDay); // updating the schedule
  }
})

function getAndSetTimetable(){
  if (!localStorage.length) {  // if not save data sending a request to the server
    sendRequest((info) => {
      localStorage.setItem('info', info);
      localStorage.setItem('date',new Date());
      setFilms(JSON.parse(info),selectDay); 
    },"event=update");
 }
 else {
    // if data update, use them, else turn to the server  
   let date = new Date(localStorage.getItem("date"));
   if (currentDate.getDate() === date.getDate()) { 
     let info = JSON.parse(localStorage.getItem("info"));
     setFilms(info,selectDay);
   }else { 
    sendRequest((info) => {
        localStorage.setItem('info', info);
        localStorage.setItem('date',new Date());
        setFilms(JSON.parse(info),selectDay); 
      },"event=update");
   }
 }
}

function sendRequest(callback,data) {
  let url = "https://jscp-diplom.netoserver.ru/"; 
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); 
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        callback(xhr.responseText);
      } 
      else {
        alert("Error: " + xhr.status);
      }
    }
  };

  xhr.onerror = function() {
    alert("Some error caused!");
  };

  xhr.send(data);
}

function setFilms(info,date) { // getting information about movies, make a replacement and display the schedule
    let moviesSection = Array.from(document.getElementsByClassName("movie"));
    let movieSection = moviesSection[0].cloneNode(true);
    let seanceHall = Array.from(movieSection.getElementsByClassName("movie-seances__hall"))[0].cloneNode(true); 
    moviesSection.forEach(element => { element.remove()}); 
    Array.from(movieSection.getElementsByClassName("movie-seances__hall")).forEach(e => {e.remove()}); 
    let main = Array.from(document.getElementsByTagName("main"))[0];

    let filmsHalls ={}; 
    info.seances.result.forEach(e => {
      filmsHalls[e.seance_filmid] ? filmsHalls[e.seance_filmid].push(e) : filmsHalls[e.seance_filmid] = [e]; 
    })

    let openHalls = {}; 
    info.halls.result.forEach(e=> {
      if(e.hall_open === "1"){
        openHalls[e.hall_id] = e;
      } 
    })

    info.films.result.forEach((element) => { 
      let newMovieSection = movieSection.cloneNode(true);
      let curretnFilmHalls = {};
      Array.from(newMovieSection.getElementsByClassName("movie__poster-image"))[0].src = element.film_poster;
      Array.from(newMovieSection.getElementsByClassName("movie__title"))[0].textContent = element.film_name;
      Array.from(newMovieSection.getElementsByClassName("movie__data-duration"))[0].textContent = getHoursAndMinutes(element.film_duration);
      Array.from(newMovieSection.getElementsByClassName("movie__data-origin"))[0].textContent = element.film_origin;
      Array.from(newMovieSection.getElementsByClassName("movie__synopsis"))[0].textContent = element.film_description;

      filmsHalls[element.film_id].forEach(e => { // displaying information for the movie
        if(openHalls[e.seance_hallid]){
          let hall = openHalls[e.seance_hallid];
          if(curretnFilmHalls[hall.hall_name]) {
            curretnFilmHalls[hall.hall_name].push(e.seance_time);
          }
          else {
            curretnFilmHalls[hall.hall_name] = [e.seance_time];
          }
        }
      })  
      
      let sortedHalls = {}; 
      Object.keys(curretnFilmHalls).sort().forEach(key => {
        sortedHalls[key] = curretnFilmHalls[key];
      });

      Object.keys(sortedHalls).forEach(key => { 
        let hall = seanceHall.cloneNode(true);
        let ul = hall.getElementsByTagName("ul")[0];
        let li = ul.getElementsByTagName("li")[0].cloneNode(true);
        ul.innerHTML = "";

        hall.getElementsByTagName('h3')[0].textContent = key.substring(0,3)+" "+key.substring(3);

        sortedHalls[key].forEach( time => {
          let currHall = Object.values(openHalls).find(hall => hall.hall_name === key);
          let currSeance = filmsHalls[element.film_id].find( seance=> {return seance.seance_time === time})
          let newTime = li.cloneNode(true);
          let refHall =  newTime.children[0];

          refHall.classList.remove("acceptin-button-disabled"); // do active button
          refHall.textContent = time; 
          refHall.setAttribute('data-film-id', element.film_id);
          refHall.setAttribute('data-film-name', element.film_name);
          refHall.setAttribute('data-hall-name', key.substring(0,3)+" "+key.substring(3));
          refHall.setAttribute('data-hall-id', currHall.hall_id);
          refHall.setAttribute('data-price-vip', currHall.hall_price_vip);
          refHall.setAttribute('data-price-standart', currHall.hall_price_standart);
          refHall.setAttribute('data-seance-id', currSeance.seance_id);
          refHall.setAttribute('data-seance-time', currSeance.seance_time);
          refHall.setAttribute('data-seance-start', currSeance.seance_start);
          refHall.setAttribute('data-seance-timestamp', toSecond(currSeance.seance_time,date));

          if(selectDay.getDate() === currentDate.getDate()) {  
            let timeSeance = Number(refHall.getAttribute("data-seance-timestamp"));
            let currentTime = Math.floor(currentDate.getTime()/1000);
            if(timeSeance < currentTime){
              refHall.classList.add("acceptin-button-disabled");
            }
          }

          let data = `event=get_hallConfig&timestamp=${refHall.getAttribute("data-seance-timestamp")}&hallId=${refHall.getAttribute("data-hall-id")}&seanceId=${refHall.getAttribute("data-seance-id")}`;
          refHall.onclick = function(){
            sendRequest((hallInfo)=> {
              sessionStorage.setItem("hallInfo",hallInfo);
              sessionStorage.setItem("hall_config",currHall.hall_config);

              for (let i = 0; i < refHall.attributes.length; i++) {
                const attribute = refHall.attributes[i];
                sessionStorage.setItem(attribute.name,attribute.value);
              }
              window.location.href = "hall.html";
            },data);
            return false;
          }
          ul.appendChild(newTime);
        })
        newMovieSection.appendChild(hall);//adding a new hall

      })
      main.appendChild(newMovieSection);//add block with movie
    })
}

function getHoursAndMinutes(time) {
  let hours = parseInt(time / 60);
  let minutes = time & 60;
  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  return hours + ":" + minutes + ',';
}

function toSecond(time,date) {
  let hours = time.split(':')[0];
  let minutes = time.split(':')[1];
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(0);
  return Math.floor(date.getTime() / 1000); // round it down
}


getAndSetTimetable();

setInterval(()=>{ // checking the session, updating the time
  currentDate = new Date();
  let acceptionButton = Array.from(document.getElementsByClassName("movie-seances__time"));
  acceptionButton.forEach(e => {
    if(selectDay.getDate() === currentDate.getDate()) {  // disabling past sessions
      let sTime = Number(e.getAttribute("data-seance-timestamp"));// session time in seconds
      let now = Math.floor(currentDate.getTime()/1000);//  current time in seconds
       if(now < sTime){
        e.classList.remove("acceptin-button-disabled");
       } else {
        e.classList.add("acceptin-button-disabled");//disabling class disabled button
      }
    }
  }) 
},1000)