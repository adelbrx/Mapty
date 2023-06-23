'use strict';

class Workout {
  id = (Date.now() + '').slice(-10);
  date = new Date();
  clicks = 0;

  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
  setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  _click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(cadence, distance, duration, coords) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this.setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(elevationGain, distance, duration, coords) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const resetPage = document.querySelector('.copyright');

class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 13;

  workouts = [];

  constructor() {
    this._getPosition();

    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

    resetPage.addEventListener('click', this.reset);
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const currentCoordinates = [latitude, longitude];

    this.#map = L.map('map').setView(currentCoordinates, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.workouts.forEach(workout => {
      this._renderWorkoutMarker(workout);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');

    setTimeout(() => (form.style.display = 'grid'));
  }

  _toggleElevationField(event) {
    event.preventDefault();
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(event) {
    event.preventDefault();

    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp) && inp > 0);

    //Get data from form

    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let newWorkout;

    //If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      //Check if data is valid
      if (!validInputs(cadence, duration, distance))
        return alert('Inputs have to be positive numbers!');

      newWorkout = new Running(cadence, distance, duration, [lat, lng]);
    }

    //if wourkout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //Check if data is valid
      if (!validInputs(elevation, duration, distance))
        return alert('Inputs have to be positive numbers!');
      newWorkout = new Cycling(elevation, distance, duration, [lat, lng]);
    }

    //Add new object to workout array
    this.workouts.push(newWorkout);

    //Render wourkout on map as marker
    this._renderWorkoutMarker(newWorkout);

    this._hideForm();

    this._setLocalStorage();
  }

  _renderWorkoutMarker(newWorkout) {
    L.marker(newWorkout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className:
            newWorkout instanceof Running ? 'running-popup' : 'cycling-popup',
        })
      )
      .setPopupContent(
        `${newWorkout instanceof Running ? '🏃‍♂️' : '🚴‍♀️'} ${
          newWorkout.description
        }`
      )
      .openPopup();

    this._renderWorkout(newWorkout);
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;
    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(event) {
    const workoutElement = event.target.closest('.workout');
    if (!workoutElement) return;

    const workout = this.workouts.find(
      work => work.id === workoutElement.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel + 3, {
      animate: true,
      pan: { duration: 1 },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }

  _getLocalStorage() {
    const workouts = JSON.parse(localStorage.getItem('workouts'));

    if (!workouts) return;

    this.workouts = workouts;
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
