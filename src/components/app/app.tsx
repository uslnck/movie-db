//@ts-nocheck

import "./app.css";
import { Spin, Input, Tabs, List, message } from "antd";
import { useEffect, useState, useRef } from "react";
import CustomCard from "../custom-card";
import RatedPagination from "../rated-pagination";
import SearchPagination from "../search-pagination";

class SearchService {
  _baseUrlMovies = "https://api.themoviedb.org/3/search/";
  _baseUrlGenres = "https://api.themoviedb.org/3/genre/movie/list";
  // _baseUrlSession = "https://api.themoviedb.org/3/authentication/session/new";
  // _baseUrlToken = "https://api.themoviedb.org/3/authentication/token/new";
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
    // const fetchTokenString = `${this._baseUrlToken}${this._apiKey}`;
    const fetchGuestSessionString = `${this._baseUrlGuestSession}${this._apiKey}`;
    const fetchTrendingString = `${this._baseUrlTrending}${this._apiKey}`;

    let res = {};

    if (baseUrl === this._baseUrlMovies) res = await fetch(fetchMoviesString);
    else if (baseUrl === this._baseUrlGenres)
      res = await fetch(fetchGenresString);
    // else if (baseUrl === this._baseUrlToken)
    //   res = await fetch(fetchTokenString);
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

  // async getToken() {
  //   const res = await this.getResource("", "", this._baseUrlToken);
  //   return res.request_token;
  // }

  async rateMovie(rating, movieId) {
    const sessionId = JSON.parse(localStorage.getItem("storedOldSessionId"));
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
    const sessionId = JSON.parse(localStorage.getItem("storedOldSessionId"));
    const res = await fetch(
      `https://api.themoviedb.org/3/guest_session/${sessionId}/rated/movies${this._apiKey}&page=${page}`
    );
    if (!res.ok) throw new Error("Couldn't get rated movies");
    const body = await res.json();
    return [body.results, body.total_results];
  }
}

const ss = new SearchService();

const MovieList = () => {
  // const storedMovies = localStorage.getItem("storedMovies");
  // const moviesState = storedMovies ? JSON.parse(storedMovies) : [];
  // const storedTotalMovies = localStorage.getItem("storedTotalMovies");
  // const totalMoviesState = storedMovies ? JSON.parse(storedTotalMovies) : "";
  const storedGenres = localStorage.getItem("storedGenres");
  const genresState = storedGenres ? JSON.parse(storedGenres) : [];
  // const storedToken = localStorage.getItem("storedToken");
  // const tokenState = storedToken ? JSON.parse(storedToken) : "";
  // const storedSessionId = localStorage.getItem("storedSessionId");
  // const sessionState = storedSessionId ? JSON.parse(storedSessionId) : "";
  const storedOldSessionId = localStorage.getItem("storedOldSessionId");
  const oldSessionState = storedOldSessionId
    ? JSON.parse(storedOldSessionId)
    : "";
  // const storedTotalRatedMovies = localStorage.getItem("storedTotalRatedMovies");
  // const totalRatedMoviesState = storedMovies
  //   ? JSON.parse(storedTotalRatedMovies)
  //   : "";
  // const storedQuery = localStorage.getItem("storedQuery");
  // const queryState = storedMovies ? JSON.parse(storedQuery) : "";

  const [movies, setMovies] = useState("");
  const [trending, setTrending] = useState("");
  const [totalMovies, setTotalMovies] = useState("");
  const [genres, setGenres] = useState(genresState);
  // const [token, setToken] = useState(tokenState);
  // const [sessionId, setSessionId] = useState(sessionState);
  const [oldSessionId, setOldSessionId] = useState(oldSessionState);
  // const [returnedToken, setReturnedToken] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [ratedMovies, setRatedMovies] = useState([]);
  const [totalRatedMovies, setTotalRatedMovies] = useState("");
  const [currentRatedPage, setCurrentRatedPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentQuery, setCurrentQuery] = useState("");

  const pageSize = 20;
  const isInitialRender = useRef(true);
  const imageBaseURL = "https://www.themoviedb.org/t/p/w600_and_h900_bestv2/";

  useEffect(() => {
    if (isInitialRender.current) return;
    console.log("active tab set to:", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("storedQuery", JSON.stringify(currentQuery));
  }, [currentQuery]);

  useEffect(() => {
    localStorage.setItem("storedTotalMovies", JSON.stringify(totalMovies));
  }, [totalMovies]);

  useEffect(() => {
    localStorage.setItem(
      "storedTotalRatedMovies",
      JSON.stringify(totalRatedMovies)
    );
  }, [totalRatedMovies]);

  // useEffect(() => {
  //   localStorage.setItem("storedMovies", JSON.stringify(movies));
  // }, [movies]);

  useEffect(() => {
    localStorage.setItem("storedGenres", JSON.stringify(genres));
    handleMainPageLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genres]);

  // useEffect(() => {
  //   localStorage.setItem("storedToken", JSON.stringify(token));
  // }, [token]);

  // useEffect(() => {
  //   localStorage.setItem("storedSessionId", JSON.stringify(sessionId));
  // }, [sessionId]);

  useEffect(() => {
    localStorage.setItem("storedOldSessionId", JSON.stringify(oldSessionId));
  }, [oldSessionId]);

  useEffect(() => {
    if (localStorage.getItem("storedOldSessionId") === '""') getOldSessionId();
    if (localStorage.getItem("storedGenres") === "[]") getGenres();
    isInitialRender.current = false;
    // if (!token) getToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect(() => {
  // if (returnedToken) getSessionId();
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [returnedToken]);

  // useEffect(() => {
  //   if (isInitialRender.current) return;
  //   if (token) forwardUser();
  //   //eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [token]);

  // useEffect(() => {
  //   if (isInitialRender.current) return;
  //   if (localStorage.getItem("storedMovies") === "[]") handleSearch();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [genres]);

  // useEffect(() => {
  //   if (currentPage === 1) handleSearch(currentQuery, currentPage);
  //   refreshPosters();
  //   setPageLoading(false);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [currentPage]);

  // useEffect(() => {
  //   const params = new URLSearchParams(window.location.search);
  //   const returnedToken = params.get("request_token");
  //   if (returnedToken) {
  //     setReturnedToken(returnedToken);
  //     console.log("setReturnedToken triggered useEffect for getSessionId");
  //     window.history.replaceState(null, null, window.location.pathname);
  //   }
  // }, []);

  // const forwardUser = () => {
  //   console.log("forwarding user...");
  //   return window.location.replace(
  //     `https://www.themoviedb.org/authenticate/${token}?redirect_to=http://localhost:3000`
  /* ?redirect_to=http://localhost:3000  , "_blank" */
  /* ?redirect_to=https://movie-db-murex-phi.vercel.app/ */
  //   );
  // };

  // const getSessionId = async () => {
  //   try {
  //     console.log(
  //       'sending POST that "returned" token triggered:',
  //       returnedToken
  //     );
  //     const session = await fetch(`${ss._baseUrlSession}${ss._apiKey}`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         request_token: `${returnedToken}`,
  //       }),
  //     });
  //     if (!session.ok) throw new Error("Couldn't fetch URL");
  //     const body = await session.json();
  //     setSessionId(body.session_id);
  //   } catch (e) {
  //     throw new Error(`${e} (Couldn't create session)`);
  //   }
  // };

  // const getToken = async () => {
  //   try {
  //     const token = await ss.getToken();
  //     setToken(token);
  //     console.log(`token created: ${token}`, Date.now());
  //   } catch (e) {
  //     throw new Error(`${e} (Couldn't get token)`);
  //   }
  // };

  const getOldSessionId = async () => {
    try {
      const id = await ss.getGuestSessionId();
      setOldSessionId(id);
      console.log(`old guest session created: ${id}`, Date.now());
    } catch (e) {
      throw new Error(`${e} (Couldn't create session)`);
    }
  };

  const getGenres = async () => {
    try {
      const genreList = await ss.getGenres();
      setGenres(genreList);
      console.log("fetched genres", Date.now());
    } catch (e) {
      throw new Error(`${e} (Couldn't fetch genres)`);
    }
  };

  const getGenreText = (genreIds) => {
    return genreIds?.map((id) => {
      const genre = genres?.find((g) => g.id === id);
      console.log("mapped genre text in search");
      return genre ? genre?.name : null;
    });
  };

  const handleSearch = async (query, page) => {
    try {
      if (!query) return;
      setPageLoading(true);
      setImageLoading(true);
      setCurrentQuery(query);
      const searchResults = await ss.getMovies(query, page);
      const movieData = searchResults[0].map((movie) => ({
        title: movie?.original_title,
        date: movie?.release_date,
        description: movie?.overview,
        posterUrl: `${imageBaseURL}${movie?.poster_path}`,
        genres: getGenreText(movie?.genre_ids),
        vote: movie?.vote_average,
        id: movie?.id,
      }));
      const total = searchResults[1];
      if (movieData.length === 0) message.info("No results found.");
      setTotalMovies(total);
      setMovies(movieData);
      setCurrentPage(1);
      setPageLoading(false);
      console.log("handled search", Date.now());
    } catch (e) {
      console.log(e);
      throw new Error(`${e} (Couldn't fetch movies)`);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageLoadError = (e) => {
    e.target.src =
      "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg?20200913095930";
  };

  // const refreshPosters = () => {
  //   const posterContainers = document.querySelectorAll(".poster-container");
  //   posterContainers.forEach((posterContainer) => {
  //     const poster = posterContainer.querySelector(".poster");
  //     posterContainer.replaceChild(poster, poster);
  //   });
  //   console.log("refreshed posters");
  // };

  const handleRatedChange = async (key, page) => {
    setPageLoading(true);
    setActiveTab(key);
    if (key === "2") {
      const rated = await ss.getRatedMovies(page);
      console.log("got rated from server:", rated);
      const ratedWithGenres = rated[0].map((movie) => {
        const genreNames = [];
        for (let id of movie.genre_ids) {
          const genre = genres.find((g) => g.id === id);
          genreNames.push(genre ? genre.name : null);
        }
        return {
          ...movie,
          genres: genreNames,
        };
      });
      const totalRated = rated[1];
      setTotalRatedMovies(totalRated);
      setRatedMovies(ratedWithGenres);
    }
    setPageLoading(false);
  };

  const handleRatingChange = async (rating, movieId) => {
    console.log("sent rating:", rating, movieId);
    await ss.rateMovie(rating, movieId);
    console.log("server posted rating");
  };

  const colorPicker = (rating) => {
    let color = "";
    if (rating >= 0 && rating < 3) {
      color = "#E90000";
    } else if (rating >= 3 && rating < 5) {
      color = "#E97E00";
    } else if (rating >= 5 && rating < 7) {
      color = "#E9D100";
    } else if (rating >= 7) {
      color = "#66E900";
    }
    return color;
  };

  const handlePageChange = async (query, page, tab) => {
    switch (tab) {
      case "search":
        await handleSearch(query, page);
        setCurrentPage(page);
        console.log("changed search page");
        break;
      case "rated":
        setCurrentRatedPage(page);
        await handleRatedChange("2", page);
        console.log("changed rated page");
        break;
      default:
        break;
    }
    setImageLoading(true);
    window.scrollTo(0, 0);
  };

  const debounce = (fn, debounceTime) => {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, debounceTime);
    };
  };

  const delayedSearch = debounce(handleSearch, 600);

  const handleInputChange = (e) => {
    let currentQuery = e.target.value;
    delayedSearch(currentQuery, 1);
    console.log("commencing new search...");
  };

  const handleMainPageLoad = async () => {
    setPageLoading(true);
    setImageLoading(true);
    const res = await ss.getResource("", "", ss._baseUrlTrending);
    const body = await res.results;
    const movieData = body.map((movie) => ({
      title: movie?.original_title,
      date: movie?.release_date,
      description: movie?.overview,
      posterUrl: `${imageBaseURL}${movie?.poster_path}`,
      genres: getGenreText(movie?.genre_ids),
      vote: movie?.vote_average,
      id: movie?.id,
    }));
    setTrending(movieData);
    setPageLoading(false);
    console.log("handled trending search", Date.now());
  };

  const Spinner = (tab) => {
    if (pageLoading && tab === 2)
      return (
        <Spin
          size="large"
          style={{
            position: "absolute",
            top: "38%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            height: "0",
          }}
        />
      );
    if (pageLoading && tab === 1) {
      return (
        <Spin
          size="large"
          style={{
            position: "absolute",
            top: "47%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            height: "0",
          }}
        />
      );
    }
  };

  // .slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const items = [
    {
      key: "1",
      label: "Search",
      children: (
        <>
          <div className="search">
            <Input
              placeholder="Search movies"
              allowClear
              size="large"
              onChange={handleInputChange}
              style={{
                width: "40%",
                position: "relative",
                left: "50%",
                transform: "translate(-50%, 0%)",
              }}
            />
          </div>
          <div className="pagination">
            <SearchPagination
              currentQuery={currentQuery}
              currentPage={currentPage}
              pageSize={pageSize}
              totalMovies={totalMovies || 1}
              handlePageChange={handlePageChange}
              style={{ paddingBottom: 10, paddingTop: 10 }}
            />
          </div>
          {Spinner(1) || (
            <div className="list-container">
              <List
                grid={{
                  gutter: [16, 16],
                  md: 1,
                  lg: 2,
                  xl: 2,
                  xxl: 2,
                }}
                dataSource={movies || trending}
                renderItem={({
                  genres,
                  posterUrl,
                  date,
                  description,
                  title,
                  // rating,
                  vote,
                  id,
                }) => (
                  <List.Item
                    className="list-item"
                    style={{ marginLeft: "50px", marginRight: "50px" }}
                  >
                    <CustomCard
                      imageLoading={imageLoading}
                      genres={genres}
                      posterUrl={posterUrl}
                      date={date}
                      description={description}
                      // rating={rating}
                      title={title}
                      vote={vote}
                      id={id}
                      handleImageLoadError={handleImageLoadError}
                      handleImageLoad={handleImageLoad}
                      handleRatingChange={handleRatingChange}
                      colorPicker={colorPicker}
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
          <div className="pagination">
            <SearchPagination
              currentQuery={currentQuery}
              currentPage={currentPage}
              pageSize={pageSize}
              totalMovies={totalMovies || 1}
              handlePageChange={handlePageChange}
              style={{ paddingBottom: 20, paddingTop: 10 }}
            />
          </div>
        </>
      ),
    },
    {
      key: "2",
      label: "Rated",
      children: (
        <>
          <div className="pagination">
            <RatedPagination
              currentRatedPage={currentRatedPage}
              pageSize={pageSize}
              totalRatedMovies={totalRatedMovies}
              handlePageChange={handlePageChange}
              style={{ paddingBottom: 20 }}
            />
          </div>
          {Spinner(2) || (
            <div className="list-container">
              <List
                grid={{
                  gutter: [16, 16],
                  md: 1,
                  lg: 2,
                  xl: 2,
                  xxl: 2,
                }}
                dataSource={ratedMovies}
                renderItem={({
                  genres,
                  poster_path,
                  release_date,
                  overview,
                  original_title,
                  rating,
                  vote_average,
                  id,
                }) => (
                  <List.Item
                    className="list-item"
                    style={{ marginLeft: "50px", marginRight: "50px" }}
                  >
                    <CustomCard
                      imageLoading={imageLoading}
                      genres={genres}
                      posterUrl={`${imageBaseURL}${poster_path}`}
                      date={release_date}
                      description={overview}
                      title={original_title}
                      rating={rating}
                      vote={vote_average}
                      id={id}
                      handleImageLoadError={handleImageLoadError}
                      handleImageLoad={handleImageLoad}
                      handleRatingChange={handleRatingChange}
                      colorPicker={colorPicker}
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
          <div className="pagination">
            <RatedPagination
              currentRatedPage={currentRatedPage}
              pageSize={pageSize}
              totalRatedMovies={totalRatedMovies}
              handlePageChange={handlePageChange}
              style={{ paddingBottom: 20, paddingTop: 10 }}
            />
          </div>
        </>
      ),
    },
  ];

  return (
    <Tabs
      defaultActiveKey="1"
      items={items}
      onChange={(key) => handleRatedChange(key, currentRatedPage)}
    />
  );
};

export default MovieList;
