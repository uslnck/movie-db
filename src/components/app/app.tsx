//@ts-nocheck

import "./app.css";
import {
  Row,
  Col,
  Card,
  Pagination,
  Rate,
  Spin,
  Input,
  Tabs,
  message,
} from "antd";
import { useEffect, useState, useRef } from "react";

class SearchService {
  _baseUrlMovies = "https://api.themoviedb.org/3/search/";
  _baseUrlGenres = "https://api.themoviedb.org/3/genre/movie/list";
  _baseUrlSession = "https://api.themoviedb.org/3/authentication/session/new";
  _baseUrlToken = "https://api.themoviedb.org/3/authentication/token/new";
  _apiKey = "?api_key=0181923591c91859e91691704fe87633";
  _noAdult = "&include_adult=false";
  _lang = "&language=en-US";
  _baseUrlGuestSession =
    "https://api.themoviedb.org/3/authentication/guest_session/new";

  async getResource(
    query,
    searchType,
    baseUrl = this._baseUrlMovies,
    page = 1
  ) {
    const q = "&query=" + query;
    const p = "&page=" + page;
    const fetchMoviesString = `${baseUrl}${searchType}${this._apiKey}${this._lang}${q}${p}${this._noAdult}`;
    const fetchGenresString = `${this._baseUrlGenres}${this._apiKey}`;
    const fetchTokenString = `${this._baseUrlToken}${this._apiKey}`;
    const fetchGuestSessionString = `${this._baseUrlGuestSession}${this._apiKey}`;

    let res = {};

    if (baseUrl === this._baseUrlMovies) res = await fetch(fetchMoviesString);
    else if (baseUrl === this._baseUrlGenres)
      res = await fetch(fetchGenresString);
    else if (baseUrl === this._baseUrlToken)
      res = await fetch(fetchTokenString);
    else res = await fetch(fetchGuestSessionString);

    if (!res.ok) throw new Error("Couldn't fetch URL");
    const body = await res.json();
    return body;
  }

  async getMovies(query) {
    const res = await this.getResource(query, "movie", this._baseUrlMovies);
    return res.results;
  }

  async getGenres() {
    const res = await this.getResource("", "", this._baseUrlGenres);
    return res.genres;
  }

  async getGuestSessionId() {
    const res = await this.getResource("", "", this._baseUrlGuestSession);
    return res.guest_session_id;
  }

  async getToken() {
    const res = await this.getResource("", "", this._baseUrlToken);
    return res.request_token;
  }

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

  async getRatedMovies() {
    const sessionId = JSON.parse(localStorage.getItem("storedOldSessionId"));
    const res = await fetch(
      `https://api.themoviedb.org/3/guest_session/${sessionId}/rated/movies${this._apiKey}`
    ); //&page=1
    if (!res.ok) throw new Error("Couldn't get rated movies");
    const body = await res.json();
    return body.results;
  }
}

const ss = new SearchService();

const MovieList = () => {
  const storedMovies = localStorage.getItem("storedMovies");
  const moviesState = storedMovies ? JSON.parse(storedMovies) : [];
  const storedGenres = localStorage.getItem("storedGenres");
  const genresState = storedGenres ? JSON.parse(storedGenres) : [];
  const storedToken = localStorage.getItem("storedToken");
  const tokenState = storedToken ? JSON.parse(storedToken) : "";
  const storedSessionId = localStorage.getItem("storedSessionId");
  const sessionState = storedSessionId ? JSON.parse(storedSessionId) : "";
  const storedOldSessionId = localStorage.getItem("storedOldSessionId");
  const oldSessionState = storedOldSessionId
    ? JSON.parse(storedOldSessionId)
    : "";

  const [movies, setMovies] = useState(moviesState);
  const [genres, setGenres] = useState(genresState);
  const [token, setToken] = useState(tokenState);
  const [sessionId, setSessionId] = useState(sessionState);
  const [oldSessionId, setOldSessionId] = useState(oldSessionState);
  const [returnedToken, setReturnedToken] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [ratedMovies, setRatedMovies] = useState([]);
  const [currentRatedPage, setCurrentRatedPage] = useState(1);
  const pageSize = 6;
  const isInitialRender = useRef(true);

  useEffect(() => {
    console.log("active tab set to:", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("storedMovies", JSON.stringify(movies));
  }, [movies]);

  useEffect(() => {
    localStorage.setItem("storedGenres", JSON.stringify(genres));
  }, [genres]);

  useEffect(() => {
    localStorage.setItem("storedToken", JSON.stringify(token));
  }, [token]);

  useEffect(() => {
    localStorage.setItem("storedSessionId", JSON.stringify(sessionId));
  }, [sessionId]);

  useEffect(() => {
    localStorage.setItem("storedOldSessionId", JSON.stringify(oldSessionId));
  }, [oldSessionId]);

  useEffect(() => {
    if (localStorage.getItem("storedOldSessionId") === '""') getOldSessionId();
    if (localStorage.getItem("storedGenres") === "[]") getGenres();
    if (!token) getToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (returnedToken) getSessionId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnedToken]);

  useEffect(() => {
    if (isInitialRender.current) return;
    if (token) forwardUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (isInitialRender.current) return;
    if (localStorage.getItem("storedMovies") === "[]") handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genres]);

  useEffect(() => {
    refreshPosters();
    setPageLoading(false);
  }, [currentPage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnedToken = params.get("request_token");
    if (returnedToken) {
      setReturnedToken(returnedToken);
      console.log("setReturnedToken triggered useEffect for getSessionId");
      window.history.replaceState(null, null, window.location.pathname);
    }
  }, []);

  const forwardUser = () => {
    console.log("forwarding user...");
    return window.location.replace(
      `https://www.themoviedb.org/authenticate/${token}?redirect_to=https://movie-db-murex-phi.vercel.app/`
    );
  };

  const getSessionId = async () => {
    try {
      console.log(
        'sending POST that "returned" token triggered:',
        returnedToken
      );
      const session = await fetch(`${ss._baseUrlSession}${ss._apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_token: `${returnedToken}`,
        }),
      });
      if (!session.ok) throw new Error("Couldn't fetch URL");
      const body = await session.json();
      setSessionId(body.session_id);
    } catch (e) {
      throw new Error(`${e} (Couldn't create session)`);
    }
  };

  const getToken = async () => {
    try {
      const token = await ss.getToken();
      setToken(token);
      console.log(`token created: ${token}`, Date.now());
    } catch (e) {
      throw new Error(`${e} (Couldn't get token)`);
    }
  };

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
      isInitialRender.current = false;
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

  const handleSearch = async (value = "の") => {
    try {
      setPageLoading(true);
      setImageLoading(true);
      const imageBaseURL =
        "https://www.themoviedb.org/t/p/w600_and_h900_bestv2/";
      const searchResults = await ss.getMovies(value);
      const movieData = searchResults.map((movie) => ({
        title: movie?.original_title,
        date: movie?.release_date,
        description: movie?.overview,
        posterUrl: `${imageBaseURL}${movie?.poster_path}`,
        genres: getGenreText(movie?.genre_ids),
        rating: movie?.vote_average,
        id: movie?.id,
      }));
      if (movieData.length === 0) message.info("No results found.");
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

  const handleInputChange = (e) => {
    setSearchText(e.target.value);
  };

  const handlePressEnter = () => {
    handleSearch(searchText);
    console.log("initiated new search");
  };

  const refreshPosters = () => {
    const posterContainers = document.querySelectorAll(".poster-container");
    posterContainers.forEach((posterContainer) => {
      const poster = posterContainer.querySelector(".poster");
      posterContainer.replaceChild(poster, poster);
    });
    console.log("refreshed posters");
  };

  const handleTabChange = async (key) => {
    setActiveTab(key);
    if (key === "2") {
      const rated = await ss.getRatedMovies();
      console.log("got rated from server:", rated);
      const ratedWithGenres = rated.map((movie) => {
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
      setRatedMovies(ratedWithGenres);
    }
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

  const handlePageChange = (page, tab) => {
    switch (tab) {
      case "search":
        setCurrentPage(page);
        console.log("changed search page");
        break;
      case "rated":
        setCurrentRatedPage(page);
        console.log("changed rated page");
        break;
      default:
        break;
    }
    setImageLoading(true);
    window.scrollTo(0, 0);
  };

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
              onPressEnter={handlePressEnter}
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
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={movies.length}
              onChange={(page) => handlePageChange(page, "search")}
              style={{ paddingBottom: 20, paddingTop: 10 }}
            />
          </div>
          <Row gutter={[0, 40]} justify="space-evenly">
            {movies
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map(
                ({
                  genres,
                  posterUrl,
                  date,
                  description,
                  title,
                  rating,
                  id,
                }) => (
                  <Col span={24} md={11} lg={11} sm={5} key={id}>
                    <Card
                      className="card"
                      bodyStyle={{
                        paddingBottom: 0,
                        paddingTop: 0,
                        paddingLeft: 0,
                        paddingRight: 0,
                      }}
                    >
                      <div
                        className="rating"
                        style={{ borderColor: colorPicker(rating) }}
                      >
                        {rating < 1 ? "NR" : rating?.toFixed(1) || "NR"}
                      </div>
                      <Row gutter={[16, 16]}>
                        <Col span={8}>
                          <div
                            className="poster-container"
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            {imageLoading && (
                              <Spin
                                size="large"
                                style={{
                                  position: "absolute",
                                  top: "50%",
                                  left: "50%",
                                  transform: "translate(-50%, -50%)",
                                }}
                              />
                            )}
                            <img
                              src={posterUrl}
                              alt={title}
                              onError={handleImageLoadError}
                              style={{ height: "100%", width: "100%" }}
                              onLoad={handleImageLoad}
                              className="poster"
                            />
                          </div>
                        </Col>
                        <Col
                          span={16}
                          style={{
                            height: 450,
                            paddingBottom: 20,
                            paddingTop: 20,
                            paddingLeft: 20,
                            paddingRight: 40,
                          }}
                        >
                          <h2 className="title">{title}</h2>
                          <p className="date">{date}</p>
                          <p className="genres">
                            {genres?.map((genre, i) => {
                              return (
                                <span
                                  className="genre"
                                  key={i}
                                  style={{
                                    marginRight: 7,
                                    paddingLeft: 3,
                                    paddingRight: 3,
                                  }}
                                >
                                  {genre}
                                </span>
                              );
                            })}
                          </p>
                          <p className="description">{description}</p>
                          <Rate
                            allowHalf
                            defaultValue={0}
                            onChange={(rating) =>
                              handleRatingChange(rating, id)
                            }
                            count={10}
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                )
              )}
          </Row>
          <div className="pagination">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={movies.length}
              onChange={(page) => handlePageChange(page, "search")}
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
            <Pagination
              style={{ paddingBottom: 20 }}
              current={currentRatedPage}
              pageSize={pageSize}
              total={ratedMovies.length}
              onChange={(page) => handlePageChange(page, "rated")}
            />
          </div>
          <Row gutter={[0, 40]} justify="space-evenly">
            {ratedMovies
              .slice(
                (currentRatedPage - 1) * pageSize,
                currentRatedPage * pageSize
              )
              .map(
                ({
                  genres,
                  poster_path,
                  release_date,
                  overview,
                  original_title,
                  rating,
                  vote_average,
                  id,
                }) => (
                  <Col span={24} md={11} lg={11} sm={5} key={id}>
                    <Card
                      className="card"
                      bodyStyle={{
                        paddingBottom: 0,
                        paddingTop: 0,
                        paddingLeft: 0,
                        paddingRight: 0,
                      }}
                    >
                      <div
                        className="rating"
                        style={{ borderColor: colorPicker(vote_average) }}
                      >
                        {vote_average < 1
                          ? "NR"
                          : vote_average?.toFixed(1) || "NR"}
                      </div>
                      <Row gutter={[16, 16]}>
                        <Col span={8}>
                          <div
                            className="poster-container"
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            {imageLoading && (
                              <Spin
                                size="large"
                                style={{
                                  position: "absolute",
                                  top: "50%",
                                  left: "50%",
                                  transform: "translate(-50%, -50%)",
                                }}
                              />
                            )}
                            <img
                              src={`https://www.themoviedb.org/t/p/w600_and_h900_bestv2/${poster_path}`}
                              alt={original_title}
                              onError={handleImageLoadError}
                              style={{ height: "100%", width: "100%" }}
                              onLoad={handleImageLoad}
                              className="poster"
                            />
                          </div>
                        </Col>
                        <Col
                          span={16}
                          style={{
                            height: 450,
                            paddingBottom: 20,
                            paddingTop: 20,
                            paddingLeft: 20,
                            paddingRight: 40,
                          }}
                        >
                          <h2 className="title">{original_title}</h2>
                          <p className="date">{release_date}</p>
                          <p className="genres">
                            {genres.map((genre, i) => {
                              return (
                                <span
                                  className="genre"
                                  key={i}
                                  style={{
                                    marginRight: 7,
                                    paddingLeft: 3,
                                    paddingRight: 3,
                                  }}
                                >
                                  {genre}
                                </span>
                              );
                            })}
                          </p>
                          <p className="description">{overview}</p>
                          <Rate
                            allowHalf
                            defaultValue={rating}
                            onChange={(rating) =>
                              handleRatingChange(rating, id)
                            }
                            count={10}
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                )
              )}
          </Row>
          <div className="pagination">
            <Pagination
              style={{ paddingBottom: 20 }}
              current={currentRatedPage}
              pageSize={pageSize}
              total={ratedMovies.length}
              onChange={(page) => handlePageChange(page, "rated")}
            />
          </div>
        </>
      ),
    },
  ];

  if (pageLoading)
    return (
      <Spin
        size="large"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
    );
  return <Tabs defaultActiveKey="1" items={items} onChange={handleTabChange} />;
};

export default MovieList;
