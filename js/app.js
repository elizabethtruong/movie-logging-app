const OMDB_API_KEY = "c0cb6379";
const OMDB_API_URL = "https://www.omdbapi.com/";
const WATCHLIST_STORAGE_KEY = "movieLog.watchlist";
const WATCHED_STORAGE_KEY = "movieLog.watched";
const PLACEHOLDER_POSTER = "https://via.placeholder.com/120x180?text=No+Image";
const PLACEHOLDER_POSTER_LG = "https://via.placeholder.com/300x450?text=No+Image";

let dom = {};

// Toast notifications
function toast(message, type = "success", duration = 3500) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.setAttribute("role", "status");
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "false");
    document.body.appendChild(container);
  }

  const el = document.createElement("div");
  el.className = `toast-msg ${type}`;
  el.textContent = message;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.3s ease";
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// Storage helpers
function getStorageList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error(`Failed to parse storage key "${key}"`, error);
    return [];
  }
}

function getWatchlist() {
  return getStorageList(WATCHLIST_STORAGE_KEY);
}

function saveWatchlist(items) {
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
}

function getWatchedMovies() {
  return getStorageList(WATCHED_STORAGE_KEY);
}

function saveWatchedMovies(items) {
  localStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify(items));
}

// Utilities
function getPoster(movie, large = false) {
  if (movie.Poster && movie.Poster !== "N/A") return movie.Poster;
  return large ? PLACEHOLDER_POSTER_LG : PLACEHOLDER_POSTER;
}

function getPosterAlt(title, hasPoster) {
  return hasPoster ? `${title} poster` : `${title} — no poster available`;
}

function getReview(item) {
  return item.Review || item.review || "";
}

function getTitleLink(item) {
  return item.imdbID
    ? `<a href="moviedetails.html?imdbID=${item.imdbID}" class="text-decoration-none">${item.Title}</a>`
    : item.Title;
}

function isCurrentPage(page) {
  return document.body.dataset.page === page;
}

function refreshAfterChange() {
  renderRecentMovies();
  renderProfileLoggedFilms();
  if (isCurrentPage("dashboard")) renderStats();
}

// UI helpers
function showSearchMessage(container, message, type = "alert-light") {
  container.innerHTML = `<div class="alert ${type} border mb-0">${message}</div>`;
}

function makeMovieCard() {
  const card = document.createElement("div");
  card.className = "card p-3 border rounded-3 d-flex flex-row gap-3 align-items-start";
  return card;
}

function posterAlt(item) {
  const hasPoster = item.Poster && item.Poster !== "N/A";
  return getPosterAlt(item.Title, hasPoster);
}

// Render search results
function formatMovieCard(movie, options = {}) {
  const card = makeMovieCard();
  card.innerHTML = `
    <img src="${getPoster(movie)}" alt="${posterAlt(movie)}" class="rounded" style="width: 100px; height: auto; object-fit: cover;" />
    <div class="flex-grow-1">
      <h3 class="h6 mb-1">${movie.Title}</h3>
      <p class="mb-1 text-secondary">${movie.Year}${movie.Type ? ` · ${movie.Type}` : ""}</p>
      ${movie.Plot ? `<p class="mb-2 small">${movie.Plot}</p>` : ""}
    </div>
  `;

  if (options.addToWatchlist) {
    const button = document.createElement("button");
    button.className = "btn btn-sm btn-success align-self-center";
    button.textContent = "Add to watchlist";
    button.setAttribute("aria-label", `Add ${movie.Title} to watchlist`);
    button.type = "button";
    button.addEventListener("click", () => addMovieToWatchlist(movie));
    card.appendChild(button);
  }

  if (options.useInLogForm) {
    const button = document.createElement("button");
    button.className = "btn btn-sm btn-outline-primary align-self-center";
    button.type = "button";
    button.textContent = "Use in log form";
    button.setAttribute("aria-label", `Use ${movie.Title} in log form`);
    button.addEventListener("click", () => {
      prefillMovieForm(movie);
      button.textContent = "Selected";
      button.setAttribute("aria-label", `${movie.Title} selected`);
      button.disabled = true;
    });
    card.appendChild(button);
  }

  return card;
}

function renderSearchResults(container, movies, options = {}) {
  container.innerHTML = "";
  if (!movies || movies.length === 0) {
    showSearchMessage(container, "No movies matched your search. Try another title.", "alert-warning");
    return;
  }
  movies.forEach((movie) => container.appendChild(formatMovieCard(movie, options)));
}

// Render watchlist
function renderWatchlist() {
  if (!dom.watchlistList) return;

  const items = getWatchlist();
  dom.watchlistList.innerHTML = "";

  if (items.length === 0) {
    showSearchMessage(dom.watchlistList, "Your watchlist is empty. Search for a film to add it.");
    return;
  }

  items.forEach((item) => {
    const card = makeMovieCard();
    const review = getReview(item);
    card.innerHTML = `
      <img src="${getPoster(item)}" alt="${posterAlt(item)}" class="rounded" style="width: 100px; height: auto; object-fit: cover;" />
      <div class="flex-grow-1">
        <h3 class="h6 mb-1">${getTitleLink(item)}</h3>
        <p class="mb-1 text-secondary">${item.Year}</p>
        ${item.DateWatched ? `<p class="mb-1 small">Watched: ${item.DateWatched}</p>` : ""}
        ${item.Rating ? `<p class="mb-1 small">Rating: ${item.Rating}/5</p>` : ""}
        ${review ? `<p class="mb-2 small">${review}</p>` : ""}
      </div>
    `;

    const remove = document.createElement("button");
    remove.className = "btn btn-sm btn-outline-danger align-self-center";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${item.Title} from watchlist`);
    remove.addEventListener("click", () => {
      saveWatchlist(getWatchlist().filter((entry) => entry.imdbID !== item.imdbID));
      renderWatchlist();
      renderRecentMovies();
    });
    card.appendChild(remove);
    dom.watchlistList.appendChild(card);
  });
}

// Render recent watched movies
function renderRecentMovies() {
  if (!dom.movieList) return;

  const items = getWatchedMovies();
  dom.movieList.innerHTML = "";

  if (items.length === 0) {
    showSearchMessage(dom.movieList, "No films logged yet. Head to Log Movie to record your first watch.");
    return;
  }

  items.slice(-5).reverse().forEach((item) => {
    const review = getReview(item);
    const card = document.createElement("div");
    card.className = "card p-3 border rounded-3";
    card.innerHTML = `
      <div class="d-flex gap-3 align-items-start">
        <img src="${getPoster(item)}" alt="${posterAlt(item)}" class="rounded" style="width: 100px; height: auto; object-fit: cover;" />
        <div class="flex-grow-1">
          <h3 class="h6 mb-1">${getTitleLink(item)}</h3>
          <p class="mb-1 text-secondary">${item.Year}${item.Type ? ` · ${item.Type}` : ""}</p>
          ${item.DateWatched ? `<p class="mb-1 small">Watched: ${item.DateWatched}</p>` : ""}
          ${item.Rating ? `<p class="mb-1 small">Rating: ${item.Rating}/5</p>` : ""}
          <details class="mt-3">
            <summary class="btn btn-sm btn-outline-secondary" role="button">View log entry for ${item.Title}</summary>
            <div class="mt-3 small text-muted">
              ${review ? `<p class="mb-2"><strong>Review:</strong> ${review}</p>` : `<p class="mb-2 fst-italic">No review saved.</p>`}
            </div>
          </details>
        </div>
      </div>
    `;
    dom.movieList.appendChild(card);
  });
}

// Render stats
function renderStats() {
  if (!dom.statsGrid) return;

  const items = getWatchedMovies();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const watchedInPeriod = (movie, year, month = null) => {
    if (!movie.DateWatched) return false;
    const d = new Date(movie.DateWatched);
    return d.getFullYear() === year && (month == null || d.getMonth() + 1 === month);
  };

  const thisMonthCount = items.filter((m) => watchedInPeriod(m, currentYear, currentMonth)).length;
  const thisYearCount = items.filter((m) => watchedInPeriod(m, currentYear)).length;

  const ratedMovies = items.filter((m) => m.Rating && !isNaN(parseInt(m.Rating)));
  const averageRating =
    ratedMovies.length > 0
      ? (ratedMovies.reduce((sum, m) => sum + parseInt(m.Rating), 0) / ratedMovies.length).toFixed(1)
      : "N/A";

  const stat = (value, label) => `
    <div class="col-md-3">
      <div class="card stat-card text-center p-3">
        <dl class="mb-0">
          <dt class="display-4 fw-bold">${value}</dt>
          <dd class="mb-0">${label}</dd>
        </dl>
      </div>
    </div>`;

  dom.statsGrid.innerHTML = `
    ${stat(`<span class="text-primary">${thisMonthCount}</span>`, "Movies watched this month")}
    ${stat(`<span class="text-success">${thisYearCount}</span>`, "Movies watched this year")}
    ${stat(`<span class="text-info">${items.length}</span>`, "Total movies watched ever")}
    ${stat(`<span class="text-warning">${averageRating}</span>`, "Average rating")}
  `;
}

// Render movie details page
async function renderMovieDetails(imdbID) {
  if (!dom.movieDetails) return;

  dom.movieDetails.innerHTML = '<div class="col-12"><div class="alert alert-info">Loading movie details...</div></div>';

  try {
    const movie = await fetchMovieDetails(imdbID);

    const titleEl = document.getElementById("movieDetailsTitle");
    if (titleEl) titleEl.textContent = movie.Title;

    const hasPoster = movie.Poster && movie.Poster !== "N/A";
    const genres = movie.Genre
      ? movie.Genre.split(", ").map((g) => `<span class="badge bg-secondary me-1">${g}</span>`).join("")
      : "";
    const ratings = movie.Ratings ? movie.Ratings.map((r) => `${r.Source}: ${r.Value}`).join(" · ") : "";
    const detail = (label, value) => `<div class="col-md-6"><strong>${label}:</strong> ${value || "N/A"}</div>`;

    dom.movieDetails.innerHTML = `
      <div class="col-lg-4">
        <img src="${getPoster(movie, true)}" alt="${getPosterAlt(movie.Title, hasPoster)}" class="img-fluid rounded shadow" />
      </div>
      <div class="col-lg-8">
        <h1 class="display-5 fw-bold mb-3">${movie.Title} <span class="text-muted">(${movie.Year})</span></h1>
        <div class="mb-3" aria-label="Genres">${genres}</div>
        <p class="lead mb-4">${movie.Plot}</p>
        <div class="row g-3 mb-4">
          ${detail("Director", movie.Director)}
          ${detail("Writers", movie.Writer)}
          ${detail("Actors", movie.Actors)}
          ${detail("Runtime", movie.Runtime)}
          ${detail("Released", movie.Released)}
          ${detail("Language", movie.Language)}
          ${detail("Country", movie.Country)}
          ${detail("Awards", movie.Awards)}
        </div>
        ${ratings ? `<div class="mb-4"><strong>Ratings:</strong> ${ratings}</div>` : ""}
        <div class="mb-4">
          <strong>IMDb Rating:</strong> ${movie.imdbRating || "N/A"}/10 (${movie.imdbVotes || "0"} votes)
        </div>
      </div>
    `;
  } catch (error) {
    console.error(error);
    const titleEl = document.getElementById("movieDetailsTitle");
    if (titleEl) titleEl.textContent = "Movie not found";
    dom.movieDetails.innerHTML = `<div class="col-12"><div class="alert alert-danger">Failed to load movie details: ${error.message}</div></div>`;
  }
}

// Render logged films on profile
function renderProfileLoggedFilms() {
  if (!dom.profileLoggedFilms) return;

  const items = getWatchedMovies();
  dom.profileLoggedFilms.innerHTML = "";

  if (items.length === 0) {
    showSearchMessage(dom.profileLoggedFilms, "No films logged yet. Head to Log Movie to record your first watch.");
    return;
  }

  items.slice(-10).reverse().forEach((item) => {
    const id = item.imdbID || `manual-${item.Title}-${item.DateWatched}`;
    const review = getReview(item);

    const card = makeMovieCard();
    card.dataset.watchId = id;
    card.innerHTML = `
      <img src="${getPoster(item)}" alt="${posterAlt(item)}" class="rounded" style="width: 100px; height: auto; object-fit: cover;" />
      <div class="flex-grow-1">
        <h3 class="h6 mb-1">${getTitleLink(item)}</h3>
        <p class="mb-1 text-secondary">${item.Year}</p>
        ${item.DateWatched ? `<p class="mb-1 small">Watched: ${item.DateWatched}</p>` : ""}
        ${item.Rating ? `<p class="mb-1 small">Rating: ${item.Rating}/5</p>` : ""}
        ${review ? `<p class="mb-0 small">${review}</p>` : ""}
        <div class="d-flex gap-2 mt-3">
          <button type="button" class="btn btn-sm btn-outline-primary"
            data-watch-edit-id="${id}" aria-label="Edit log entry for ${item.Title}">Edit</button>
          <button type="button" class="btn btn-sm btn-outline-danger"
            data-watch-delete-id="${id}" aria-label="Delete log entry for ${item.Title}">Delete</button>
        </div>
      </div>
    `;

    card.querySelector("[data-watch-delete-id]")?.addEventListener("click", () => removeWatchedMovie(id));
    card.querySelector("[data-watch-edit-id]")?.addEventListener("click", () => startEditLoggedFilm(id));

    dom.profileLoggedFilms.appendChild(card);
  });
}

// Watchlist actions
function addMovieToWatchlist(movie) {
  if (!movie?.imdbID) return;

  const items = getWatchlist();
  if (items.some((entry) => entry.imdbID === movie.imdbID)) {
    toast("This movie is already in your watchlist.", "warning");
    return;
  }

  items.push(movie);
  saveWatchlist(items);
  renderWatchlist();
  toast(`${movie.Title} added to your watchlist.`);
}

// Watched movie actions
function addWatchedMovie(movie) {
  if (!movie?.Title || !movie.DateWatched) return;

  const items = getWatchedMovies();
  if (movie.imdbID && items.some((entry) => entry.imdbID === movie.imdbID)) {
    toast("This movie is already in your watch history.", "warning");
    return;
  }

  // Remove from watchlist if it was there
  if (movie.imdbID) {
    const watchlist = getWatchlist();
    const filtered = watchlist.filter((entry) => entry.imdbID !== movie.imdbID);
    if (filtered.length !== watchlist.length) {
      saveWatchlist(filtered);
      renderWatchlist();
    }
  }

  items.push(movie);
  saveWatchedMovies(items);
  refreshAfterChange();
  toast(`${movie.Title} added to your watched movies.`);
}

function removeWatchedMovie(id) {
  const items = getWatchedMovies();
  const index = items.findIndex((entry) => entry.imdbID === id);
  if (index === -1) return;

  const [removed] = items.splice(index, 1);
  saveWatchedMovies(items);
  refreshAfterChange();
  toast(`${removed.Title} removed from your logged films.`);
}

function startEditLoggedFilm(id) {
  const items = getWatchedMovies();
  const item = items.find((entry) => entry.imdbID === id);
  if (!item) return;

  const card = dom.profileLoggedFilms?.querySelector(`[data-watch-id="${id}"]`);
  if (!card) return;

  const review = getReview(item);
  const ratingOptions = ["1", "2", "3", "4", "5"]
    .map((v) => `<option value="${v}" ${item.Rating === v ? "selected" : ""}>${v}/5</option>`)
    .join("");

  card.innerHTML = `
    <img src="${getPoster(item)}" alt="${posterAlt(item)}" class="rounded" style="width: 100px; height: auto; object-fit: cover;" />
    <div class="flex-grow-1">
      <div class="mb-3">
        <label class="form-label mb-1" for="edit-title-${id}">Movie title</label>
        <input type="text" id="edit-title-${id}" class="form-control form-control-sm" data-watch-edit-title value="${item.Title}" />
      </div>
      <div class="row g-2 mb-3">
        <div class="col-6">
          <label class="form-label mb-1" for="edit-date-${id}">Date watched</label>
          <input type="date" id="edit-date-${id}" class="form-control form-control-sm" data-watch-edit-date value="${item.DateWatched || ""}" />
        </div>
        <div class="col-6">
          <label class="form-label mb-1" for="edit-rating-${id}">Rating</label>
          <select id="edit-rating-${id}" class="form-select form-select-sm" data-watch-edit-rating>
            <option value="">Select</option>
            ${ratingOptions}
          </select>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label mb-1" for="edit-review-${id}">Review</label>
        <textarea id="edit-review-${id}" class="form-control form-control-sm" rows="3" data-watch-edit-review>${review}</textarea>
      </div>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-sm btn-success" data-watch-save-id="${id}"
          aria-label="Save changes to ${item.Title}">Save changes</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-watch-cancel-id="${id}"
          aria-label="Cancel editing ${item.Title}">Cancel</button>
      </div>
    </div>
  `;

  card.querySelector("[data-watch-save-id]")?.addEventListener("click", () => {
    const title = card.querySelector("[data-watch-edit-title]").value.trim();
    const dateWatched = card.querySelector("[data-watch-edit-date]").value;
    const rating = card.querySelector("[data-watch-edit-rating]").value;
    const reviewText = card.querySelector("[data-watch-edit-review]").value.trim();

    if (!title || !dateWatched || !rating) {
      card.querySelector("[data-watch-edit-title]").setAttribute("aria-invalid", title ? "false" : "true");
      card.querySelector("[data-watch-edit-date]").setAttribute("aria-invalid", dateWatched ? "false" : "true");
      card.querySelector("[data-watch-edit-rating]").setAttribute("aria-invalid", rating ? "false" : "true");
      toast("Please complete title, date, and rating.", "error");
      return;
    }

    const allItems = getWatchedMovies();
    const idx = allItems.findIndex((entry) => entry.imdbID === id);
    if (idx === -1) return;

    allItems[idx] = { ...allItems[idx], Title: title, DateWatched: dateWatched, Rating: rating, Review: reviewText };
    saveWatchedMovies(allItems);
    refreshAfterChange();
    toast("Log entry updated.");
  });

  card.querySelector("[data-watch-cancel-id]")?.addEventListener("click", () => renderProfileLoggedFilms());
}

// OMDb API
async function fetchFromOmdb(params) {
  if (!OMDB_API_KEY || OMDB_API_KEY === "YOUR_OMDB_API_KEY") {
    throw new Error("Set OMDB_API_KEY in js/app.js before using OMDb search.");
  }

  const query = new URLSearchParams({ apikey: OMDB_API_KEY, ...params });
  const response = await fetch(`${OMDB_API_URL}?${query}`);
  if (!response.ok) throw new Error(`OMDb request failed (${response.status})`);

  const data = await response.json();
  if (data.Error) throw new Error(data.Error);
  return data;
}

async function fetchOmdbMovies(query) {
  const data = await fetchFromOmdb({ s: query, type: "movie" });
  return data.Search || [];
}

async function fetchMovieDetails(imdbID) {
  return fetchFromOmdb({ i: imdbID, plot: "full" });
}

// Search form binding
async function handleSearch(event, inputEl, resultsEl, options = {}) {
  event.preventDefault();
  const query = inputEl.value.trim();
  if (!query) return;

  showSearchMessage(resultsEl, "Searching OMDb...", "alert-info");

  try {
    const movies = await fetchOmdbMovies(query);
    renderSearchResults(resultsEl, movies, options);
  } catch (error) {
    console.error(error);
    showSearchMessage(resultsEl, error.message, "alert-danger");
  }
}

function bindSearchForms() {
  if (dom.movieSearchForm && dom.movieSearchInput && dom.movieSearchResults) {
    const options = isCurrentPage("log-movie") ? { useInLogForm: true } : { addToWatchlist: true };
    dom.movieSearchForm.addEventListener("submit", (e) =>
      handleSearch(e, dom.movieSearchInput, dom.movieSearchResults, options)
    );
  }

  if (dom.watchSearchForm && dom.watchSearchInput && dom.watchSearchResults) {
    dom.watchSearchForm.addEventListener("submit", (e) =>
      handleSearch(e, dom.watchSearchInput, dom.watchSearchResults, { addToWatchlist: true })
    );
  }
}

// Log movie form
function prefillMovieForm(movie) {
  if (!dom.movieForm) return;
  dom.titleInput.value = movie.Title || "";
  dom.posterUrl.value = movie.Poster || "";
  dom.omdbId.value = movie.imdbID || "";
  dom.movieYear.value = movie.Year || "";
}

function bindMovieForm() {
  if (!dom.movieForm) return;

  dom.movieForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = dom.titleInput.value.trim();
    const dateWatched = dom.dateWatched.value;
    const rating = dom.ratingInput.value;
    const review = dom.reviewInput.value.trim();
    const posterUrl = dom.posterUrl.value;
    const omdbId = dom.omdbId.value;
    const movieYear = dom.movieYear.value;

    if (!title || !dateWatched || !rating) {
      dom.titleInput.setAttribute("aria-invalid", title ? "false" : "true");
      dom.dateWatched.setAttribute("aria-invalid", dateWatched ? "false" : "true");
      dom.ratingInput.setAttribute("aria-invalid", rating ? "false" : "true");
      toast("Please complete the movie title, date, and rating before saving.", "error");
      return;
    }

    dom.titleInput.setAttribute("aria-invalid", "false");
    dom.dateWatched.setAttribute("aria-invalid", "false");
    dom.ratingInput.setAttribute("aria-invalid", "false");

    addWatchedMovie({
      Title: title,
      Year: movieYear || "",
      imdbID: omdbId || `manual-${Date.now()}`,
      Poster: posterUrl || PLACEHOLDER_POSTER,
      Type: omdbId ? "Movie" : "Manual",
      DateWatched: dateWatched,
      Rating: rating,
      Review: review,
    });

    dom.movieForm.reset();
    dom.posterUrl.value = "";
    dom.omdbId.value = "";
    dom.movieYear.value = "";
  });
}

// Initialization
window.addEventListener("DOMContentLoaded", () => {
  dom = {
    movieSearchForm: document.getElementById("movieSearchForm"),
    movieSearchInput: document.getElementById("movieSearchInput"),
    movieSearchResults: document.getElementById("movieSearchResults"),
    watchSearchForm: document.getElementById("watchSearchForm"),
    watchSearchInput: document.getElementById("watchSearchInput"),
    watchSearchResults: document.getElementById("watchSearchResults"),
    watchlistList: document.getElementById("watchlistList"),
    movieList: document.getElementById("movieList"),
    profileLoggedFilms: document.getElementById("profileLoggedFilms"),
    movieForm: document.getElementById("movieForm"),
    titleInput: document.getElementById("title"),
    posterUrl: document.getElementById("posterUrl"),
    omdbId: document.getElementById("omdbId"),
    movieYear: document.getElementById("movieYear"),
    dateWatched: document.getElementById("dateWatched"),
    ratingInput: document.getElementById("rating"),
    reviewInput: document.getElementById("review"),
    statsGrid: document.getElementById("statsGrid"),
    movieDetails: document.getElementById("movieDetails"),
  };

  bindSearchForms();
  bindMovieForm();
  renderWatchlist();
  renderRecentMovies();
  renderProfileLoggedFilms();
  if (isCurrentPage("dashboard")) renderStats();
  if (isCurrentPage("movie-details")) {
    const imdbID = new URLSearchParams(window.location.search).get("imdbID");
    if (imdbID) {
      renderMovieDetails(imdbID);
    } else if (dom.movieDetails) {
      dom.movieDetails.innerHTML = '<div class="col-12"><div class="alert alert-warning">No movie ID provided.</div></div>';
    }
  }
});