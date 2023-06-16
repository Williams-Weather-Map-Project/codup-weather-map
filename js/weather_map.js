"use strict";

$(document).ready(function () {

    /**
     * global variables
     */
    let currentLocWeatherResults = {};
    let homeLocation = "Austin, Tx"
    let mapCenterLoc = [0,0];
    let daysOfWeek = [ "Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];
    let monthsOfYear = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
    let currentUnits = "imperial";
    let windSpeedStr = "";
    let degreeStr = "";
    /**
     * create a marker at the maps center location.
     *  Set it to be draggable on the map and
     *  add it to the map when map is loaded
     */
    let marker = new mapboxgl.Marker({
        draggable: true,
        color: "pink"
    })

    /**
     * create the map with a preset location and orientation.
     */
    mapboxgl.accessToken = MAPBOX_KEY;
    let map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/mapbox/streets-v12', // style URL
        zoom: 10, // starting zoom
        center: mapCenterLoc// [lng, lat]
    });
    geocode(homeLocation, MAPBOX_KEY).then(function (result) {
        mapCenterLoc = result;
        map.setCenter(result);
        getWeatherData();
        marker.setLngLat(mapCenterLoc).addTo(map);  // add the marker to the map.
        map.on("click",updateMarkerOnClick)
    });

    /**
     * take in a location with long and lat.
     * set the map, marker and weather to that
     * location.
     * @param loc
     */
    function setMapAndMarkerLngLatUpdateWeather(loc){
        mapCenterLoc = loc;
        map.flyTo({
            center: mapCenterLoc,
            duration: 5000,
            zoom: 10
        });
        marker.setLngLat(loc);
        getWeatherData();
    }

    /**
     * When the map is clicked, take the long and lat
     * of the mouses location and then update the
     * map, marker and weather to the location clicked.
     * @param event
     */
    function updateMarkerOnClick(event){
        event.preventDefault();
        let loc = event.lngLat;
        setMapAndMarkerLngLatUpdateWeather([loc.lng, loc.lat]);
    }

    /**
     * When the marker is dropped set the maps center
     * to the markers lng and lat. then get weather
     * data for that location.
     */
    function dragEnded() {
        let markerLoc = marker.getLngLat();
        setMapAndMarkerLngLatUpdateWeather([markerLoc.lng, markerLoc.lat]);
    }

    /**
     * add event of drag end to the marker.
     * calls dragEnded function to update info
     */
    marker.on('dragend', dragEnded);

    /**
     * Deletes the current locations quick reference button in the
     * left menu if one exists already. It one does not, alert the
     * user.
     */
    function deleteLocationBtn(){
        let locationName = currentLocWeatherResults.city.name.replaceAll(" ", "-");
        if($(`#${locationName}`).length){
            $(`#${locationName}`).remove();
        } else {
            alert("No Quick Reference Button Exists For This Location.")
        }
    }

    /**
     * creates an HTML string btn card for the new Left Menu locations buttons.
     * @param idAndName
     * @returns {string}
     */
    function createSavedLocBtn(idAndName){
        return `<button id="${idAndName}" class="btn btn-outline-secondary w-100 saved-locations-btn px-0" type="submit">
                    <div class="card w-100 my-2">
                        <div class="card-body">
                            <h4 class="card-title">${idAndName.replaceAll("-", " ")}</h4>
                        </div>
                    </div>
                </button>`;
    }

    /**
     * creates a new btn in the Left Menu if one does not already exist
     * and sets the onclick event for updating the map, marker and weather
     * to that location.
     */
    function saveLocationAsBtn(){
        let locationName = currentLocWeatherResults.city.name.replaceAll(" ","-");
        if($(`#${locationName}`).length){
            alert("This Location Already Has A Quick Reference Button.")
        } else {
            let leftMenuHTML = $("#left-side-menu-locations").html();
            leftMenuHTML += createSavedLocBtn(locationName);
            $("#left-side-menu-locations").html(leftMenuHTML);
        }
        setLocationButtonClickFunction();
    }

    /**
     * add click events to left menu buttons.
     */
    function setLocationButtonClickFunction(){
        /**
         * ensure that no duplicate click event is attached to any location button.
         */
        $(".saved-locations-btn").off("click", "**");
        /**
         * when a left menu button is click. updated map and
         * weather to the location of that cities name
         */
        $(".saved-locations-btn").on("click", function(event){
            event.preventDefault();
            geocode(this.id, MAPBOX_KEY).then(function (result) {
                setMapAndMarkerLngLatUpdateWeather(result);
            });
        })


    }
    setLocationButtonClickFunction();

    /**
     * when clicked, current location will be saved to left menu as a new button.
     */
    $("#add-new-location-btn").on("click",saveLocationAsBtn);

    /**
     * when clicked, if current location has a quick ref btn in left menu delete it.
     */
    $("#remove-location-btn").on("click", deleteLocationBtn);

    /**
     * click event for search button. calls the address
     * search method.
     */
    $("#location-search-btn").on("click",searchAddress);

    /**
     * when called. takes the value that is in the text
     * input and then pass it into the geocode function in
     * the utils file to get back the lat and long of what
     * was searched. moves map and marker to that location.
     * updates current location weather data.
     */
    function searchAddress(event) {
        event.preventDefault();
        geocode($("#location-search-input").val(), MAPBOX_KEY).then(function (result) {
            setMapAndMarkerLngLatUpdateWeather(result);
        });
    }

    /**
     * when a style dropdown selection is clicked. update
     * the map's style
     */
    $(".map-style-selection").on("click", function(){
        let styleStr = `mapbox://styles/mapbox/${this.id}`;
        map.setStyle(styleStr);
    });

    /**
     * when a unit of measure dropdown selection is clicked
     * update the current pages display to those units.
     */
    $(".weather_units_selection").on("click", function(){
        currentUnits = this.id;
        getWeatherData();
    });

    /**
     * when called, get the current weather data for the
     * selected location. then call a function to create
     * a BS Card for displaying that information.
     */
    function getWeatherData(){
        $.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${mapCenterLoc[1]}&lon=${mapCenterLoc[0]}&units=${currentUnits}&appid=${WEATHER_MAP_KEY}`).done(function(data){
            currentLocWeatherResults = data;
            createBSCardForLocationWeather(currentLocWeatherResults);
            createBSFiveDayForecastCards((currentLocWeatherResults));
        });
    }

    /**
     * sets the unit strings for wind speed and temp
     */
    function setUnitStrings(){
        if(currentUnits === "imperial"){
            windSpeedStr = "mph";
            degreeStr = "°F";
        } else if(currentUnits === "metric"){
            windSpeedStr = "m/s";
            degreeStr = "°C";
        } else {
            windSpeedStr = "m/s";
            degreeStr = "°K";
        }
    }

    /**
     * takes in weather data then set the current locations
     * current weather data with a card.
     * @param data
     */
   function createBSCardForLocationWeather(data) {
       let todayDate = new Date(data.list[0].dt * 1000);
       let highLowTemp = getFiveDayHighLowTemps(data);
       setUnitStrings();
       let htmlString = `<div class="card bg-dark-subtle h-100">
                                  <div class="card-body">
                                    <h2 class="card-title">${data.city.name} <img src="https://openweathermap.org/img/wn/${data.list[0].weather[0].icon}@2x.png" class="card-img-top icon-sizing" id="loc-weather-icon" alt="..."></h2>
                                    <p class="card-text fs-4">${daysOfWeek[todayDate.getDay()]}, ${monthsOfYear[todayDate.getMonth()]} ${todayDate.getDate()}</p><hr>
                                    <p class="card-text">Currently  ${Math.round(data.list[0].main.temp)}${degreeStr}</p>
                                    <p class="card-text"> Hi / Lo</p>
                                    <p class="card-text">${Math.round(highLowTemp[0][0])}${degreeStr} / ${Math.round(highLowTemp[1][0])}${degreeStr}</p>
                                    <p class="card-text">${data.list[0].weather[0].main} - ${data.list[0].weather[0].description}</p>
                                    <p class="card-text">${Math.round(data.list[0].wind.speed)} ${windSpeedStr} Winds</p> 
                                    <p class="card-text">${Math.round(data.list[0].wind.gust)} ${windSpeedStr} Gusts</p>
                                    <p class="card-text">${data.list[0].clouds.all}% Cloudy</p>
                                    <p class="card-text">${data.list[0].visibility / 100}% Visibility</p>
                                  </div>
                                  <div class="card-footer">
                                    <div class="row">
                                        <div class="col-10">
                                            <small class="text-start text-body-secondary">Country Code:</small>
                                        </div>
                                        <div class="col-2">
                                            <small class="text-end text-body-secondary">${data.city.country}</small>
                                        </div>
                                    </div>
                                  </div>
                                </div>`;
       $("#current-loc-weather-info").html(htmlString);
   }

    /**
     * takes in data retrieved from weather services and calculates
     * the current days true high and low temps. returns an array of
     * high temp arr and low temp arr.
     * @param data
     * @returns {*[][]}
     */
   function getFiveDayHighLowTemps(data){
       let tempLowArr = [];
       let tempHighArr = [];
       let currentDay = 0;
       let currentDayLow = 0;
       let currentDayHigh = 0;
       for(let i = 0; i < data.list.length; i++) {
           let todayDate = new Date(data.list[i].dt * 1000);
           if (i === 0) {
               currentDay = todayDate.getDate();
               currentDayLow = data.list[i].main.temp_min;
               currentDayHigh = data.list[i].main.temp_max;
           } else {
               if (currentDay === todayDate.getDate() && i !== 39) {
                   if (currentDayHigh < data.list[i].main.temp_max) {
                       currentDayHigh = data.list[i].main.temp_max;
                   }
                   if (currentDayLow > data.list[i].main.temp_min) {
                       currentDayLow = data.list[i].main.temp_min;
                   }
               } else if(i === 39){
                   if (currentDayHigh < data.list[i].main.temp_max) {
                       currentDayHigh = data.list[i].main.temp_max;
                   }
                   if (currentDayLow > data.list[i].main.temp_min) {
                       currentDayLow = data.list[i].main.temp_min;
                   }

                   currentDayLow = data.list[i].main.temp_min;
                   currentDayHigh = data.list[i].main.temp_max;
               } else {
                   tempLowArr.push(currentDayLow);
                   tempHighArr.push(currentDayHigh);
                   currentDay = todayDate.getDate();
                   currentDayLow = data.list[i].main.temp_min;
                   currentDayHigh = data.list[i].main.temp_max;
               }
           }
       }

       return [tempHighArr, tempLowArr];
   }

    /**
     * takes in weather data then sets the 5-day forecast
     * for the current location. populates the right menu.
     * @param data
     */
   function createBSFiveDayForecastCards(data){
       setUnitStrings();
       let topMenuHTMLString = "";
       let rightMenuHTMLString = `<div class="card bg-dark-subtle my-2 ms-1 forecast-title">
                                  <div class="card-body">
                                    <p class="card-title fs-2 ms-3">Masta's</p>
                                    <p class="card-text fs-5 ms-3">5 Day Forecast</p>
                                  </div>
                                </div>`;

       let highLowTempIndex = 0;
       let highLowTempsArr = getFiveDayHighLowTemps(data);

        for(let i = 0; i < data.list.length; i+=8){
           let todayDate = new Date(data.list[i].dt * 1000);
           let stringToAppend = `<div class="card bg-secondary my-2 ms-1 forecast-card">
                              <div class="card-body text-white">
                                <h4 class="card-title">${daysOfWeek[todayDate.getDay()]}, ${monthsOfYear[todayDate.getMonth()]} ${todayDate.getDate()} <img src="https://openweathermap.org/img/wn/${data.list[i].weather[0].icon}@2x.png" class="card-img-top icon-sizing" id="loc-weather-icon" alt="..."></h4>
                                <p class="card-text">Hi/Lo:      ${Math.round(highLowTempsArr[0][highLowTempIndex])}${degreeStr} / ${Math.round(highLowTempsArr[1][highLowTempIndex])}${degreeStr}</p>
                                <p class="card-text">Weather:   ${data.list[i].weather[0].main}</p>
                              </div>
                            </div>`;
           rightMenuHTMLString += stringToAppend;
           topMenuHTMLString += `<div class="d-inline top-card-container">${stringToAppend}</div>`;
           highLowTempIndex++;
       }
        $("#top-forecast-scroll").html(topMenuHTMLString);
        $("#right-side-scroll").html(rightMenuHTMLString);
   }
});