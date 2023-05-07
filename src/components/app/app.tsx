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
  _baseUrlSession =
    "https://api.themoviedb.org/3/authentication/guest_session/new";
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
    const fetchSessionString = `${this._baseUrlSession}${this._apiKey}`;

    let res = {};

    if (baseUrl === this._baseUrlMovies) res = await fetch(fetchMoviesString);
    else if (baseUrl === this._baseUrlGenres)
      res = await fetch(fetchGenresString);
    else res = await fetch(fetchSessionString);

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

  async getSessionId() {
    const res = await this.getResource("", "", this._baseUrlSession);
    return res.guest_session_id;
  }
}

const ss = new SearchService();

const MovieList = () => {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const pageSize = 6;
  const isInitialRender = useRef(true);

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

  const getSessionId = async () => {
    try {
      const sessionId = await ss.getSessionId();
      setSessionId(sessionId);
      console.log(`guest session created, id: ${sessionId}`, Date.now());
    } catch (e) {
      throw new Error(`${e} (Couldn't create session)`);
    }
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

  useEffect(() => {
    getGenres();
    getSessionId();
  }, []);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genres]);

  useEffect(() => {
    refreshPosters();
  }, [currentPage]);

  const handleTabChange = (key) => {
    setActiveTab(key);
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
