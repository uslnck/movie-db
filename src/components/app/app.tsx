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
    // const fetchSessionString = `${this._baseUrlSession}${this._apiKey}`;

    let res = {};

    if (baseUrl === this._baseUrlMovies) res = await fetch(fetchMoviesString);
    else if (baseUrl === this._baseUrlGenres)
      res = await fetch(fetchGenresString);
    else if (baseUrl === this._baseUrlToken)
      res = await fetch(fetchTokenString);
    // else
    //   res = await fetch(fetchSessionString, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       request_token: "???",
    //     }),
    //   });

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

  // async getSessionId() {
  //   const res = await this.getResource("", "", this._baseUrlSession);
  //   return res.session_id;
  // }

  async getToken() {
    const res = await this.getResource("", "", this._baseUrlToken);
    return res.request_token;
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

  const [movies, setMovies] = useState(moviesState);
  const [genres, setGenres] = useState(genresState);
  const [token, setToken] = useState(tokenState);
  const [sessionId, setSessionId] = useState(sessionState);
  const [returnedToken, setReturnedToken] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const pageSize = 6;
  const isInitialRender = useRef(true);

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
    // window.open
    return window.location.replace(
      `https://www.themoviedb.org/authenticate/${token}?redirect_to=https://movie-db-murex-phi.vercel.app/`
      /* ?redirect_to=http://localhost:3000  , "_blank"*/
      //change local to vercel at prod
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setImageLoading(true);
    window.scrollTo(0, 0);
    console.log("changed page");
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

  const handleTabChange = (key) => {
    setActiveTab(key);
    console.log("active tab was:", activeTab);
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
              onChange={(page) => handlePageChange(page)}
              style={{ paddingBottom: 20, paddingTop: 10 }}
            />
          </div>
          <Row gutter={[0, 40]} justify="space-evenly">
            {movies
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map(
                (
                  { genres, posterUrl, date, description, title, rating },
                  i
                ) => (
                  <Col span={24} md={11} lg={11} sm={5} key={i}>
                    <Card
                      className="card"
                      bodyStyle={{
                        paddingBottom: 0,
                        paddingTop: 0,
                        paddingLeft: 0,
                        paddingRight: 0,
                      }}
                    >
                      <div className="rating">
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
                          <Rate allowHalf value={rating} count={10} />
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
              onChange={(page) => handlePageChange(page)}
              style={{ paddingBottom: 20, paddingTop: 20 }}
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
            <Pagination style={{ paddingBottom: 20, paddingTop: 20 }} />
          </div>
          <Row gutter={[0, 40]} justify="space-evenly">
            <Col span={24} md={11} lg={11} sm={5}>
              <Card
                className="card"
                bodyStyle={{
                  paddingBottom: 0,
                  paddingTop: 0,
                  paddingLeft: 0,
                  paddingRight: 0,
                }}
              >
                <div className="rating"></div>
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
                      <img className="poster" alt="" />
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
                    <h2 className="title">-</h2>
                    <p className="date"></p>
                    <p className="genres"></p>
                    <p className="description"></p>
                    <Rate allowHalf count={10} />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
          <div className="pagination">
            <Pagination style={{ paddingBottom: 20, paddingTop: 20 }} />
          </div>
        </>
      ),
    },
  ];

  // const filteredMovies =
  //   activeTab === "search" ? movies : movies.filter((movie) => movie.rated);

  if (pageLoading /*&& !localStorage.getItem("storedMovies")*/)
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
