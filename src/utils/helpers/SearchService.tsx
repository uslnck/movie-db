//@ts-nocheck

export default class SearchService {
  _baseUrlMovies = "https://api.themoviedb.org/3/search/";
  _baseUrlGenres = "https://api.themoviedb.org/3/genre/movie/list";
  _apiKey = "?api_key=0181923591c91859e91691704fe87633";
  _noAdult = "&include_adult=false";
  _lang = "&language=en-US";
  _baseUrlGuestSession =
    "https://api.themoviedb.org/3/authentication/guest_session/new";
  _baseUrlTrending = "https://api.themoviedb.org/3/trending/movie/day";

  async getResource(query, searchType, baseUrl, page) {
    const q = "&query=" + query;
    const p = "&page=" + page;
    const fetchMoviesString = `${baseUrl}${searchType}${this._apiKey}${this._lang}${q}${p}${this._noAdult}`;
    const fetchGenresString = `${this._baseUrlGenres}${this._apiKey}`;
    const fetchGuestSessionString = `${this._baseUrlGuestSession}${this._apiKey}`;
    const fetchTrendingString = `${this._baseUrlTrending}${this._apiKey}`;

    let res = {};

    if (baseUrl === this._baseUrlMovies) res = await fetch(fetchMoviesString);
    else if (baseUrl === this._baseUrlGenres)
      res = await fetch(fetchGenresString);
    else if (baseUrl === this._baseUrlTrending)
      res = await fetch(fetchTrendingString);
    else res = await fetch(fetchGuestSessionString);

    if (!res.ok) throw new Error("Couldn't fetch URL");
    const body = await res.json();
    return body;
  }

  async getMovies(query, page) {
    const res = await this.getResource(
      query,
      "movie",
      this._baseUrlMovies,
      page
    );
    return [res.results, res.total_results];
  }

  async getGenres() {
    const res = await this.getResource("", "", this._baseUrlGenres);
    return res.genres;
  }

  async getGuestSessionId() {
    const res = await this.getResource("", "", this._baseUrlGuestSession);
    return res.guest_session_id;
  }

  async rateMovie(rating, movieId) {
    const sessionId = JSON.parse(localStorage.getItem("storedSessionId"));
    const ratingUrl = `https://api.themoviedb.org/3/movie/${movieId}/rating${this._apiKey}&guest_session_id=${sessionId}`;
    const res = await fetch(ratingUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({
        value: rating,
      }),
    });
    if (!res.ok) throw new Error("Couldn't rate the movie");
    return await res.json();
  }

  async getRatedMovies(page) {
    const sessionId = JSON.parse(localStorage.getItem("storedSessionId"));
    const res = await fetch(
      `https://api.themoviedb.org/3/guest_session/${sessionId}/rated/movies${this._apiKey}&page=${page}`
    );
    if (!res.ok) throw new Error("Couldn't get rated movies");
    const body = await res.json();
    return [body.results, body.total_results];
  }
}
