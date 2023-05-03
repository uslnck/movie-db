//@ts-nocheck

import "./app.css";
import { Row, Col, Card, Pagination, Rate, Spin, Input, message } from "antd";
import { useEffect, useState } from "react";

class SearchService {
  _baseUrl = "https://api.themoviedb.org/3/search/";
  _apiKey = "?api_key=0181923591c91859e91691704fe87633";
  _noAdult = "&include_adult=false";
  _lang = "&language=en-US";
  _baseUrlGenres = "https://api.themoviedb.org/3/genre/movie/list";

  async getResource(query, searchType, baseUrl = this._baseUrl, page = 1) {
    const q = "&query=" + query;
    const p = "&page=" + page;
    const fetchMoviesString = `${baseUrl}${searchType}${this._apiKey}${this._lang}${q}${p}${this._noAdult}`;
    const fetchGenresString = `${this._baseUrlGenres}${this._apiKey}`;

    let res = {};
    if (baseUrl === this._baseUrl) res = await fetch(fetchMoviesString);
    else res = await fetch(fetchGenresString);
    if (!res.ok) throw new Error("Couldn't fetch URL");
    const body = await res.json();
    return body;
  }

  async searchMovie(query) {
    const res = await this.getResource(query, "movie", this._baseUrl);
    return res.results;
  }

  async searchPeople(query) {
    const res = await this.getResource(query, "people");
    return res.results;
  }

  async getGenres() {
    const res = await this.getResource("", "", this._baseUrlGenres);
    return res.genres;
  }
}

const ss = new SearchService();
const imageBaseURL = "https://www.themoviedb.org/t/p/w600_and_h900_bestv2/";

const MovieList = () => {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const pageSize = 6;

  const fetchGenres = async () => {
    try {
      const genreList = await ss.getGenres();
      setGenres(genreList);
    } catch (e) {
      throw new Error("Couldn't fetch genres", e);
    }
  };

  const handleSearch = async (value = "の") => {
    try {
      setPageLoading(true);
      setImageLoading(true);
      const searchResults = await ss.searchMovie(value);
      const movieData = searchResults.map((movie) => ({
        title: movie.original_title,
        date: movie.release_date,
        description: movie.overview,
        posterUrl: `${imageBaseURL}${movie.poster_path}`,
        genres: getGenreText(movie.genre_ids),
        rating: movie.vote_average,
      }));
      if (movieData.length === 0) message.info("No results found.");
      setMovies(movieData);
      setCurrentPage(1);
      setPageLoading(false);
    } catch (e) {
      throw new Error("Couldn't fetch movies", e);
    }
  };

  const getGenreText = (genreIds) => {
    const genreNames = genreIds.map((id) => {
      const genre = genres.find((g) => g.id === id);
      return genre ? genre.name : "";
    });
    return genreNames.filter((name) => name !== "");
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setImageLoading(true);
    window.scrollTo(0, 0);
  };

  const handleInputChange = (e) => {
    setSearchText(e.target.value);
  };

  const handlePressEnter = () => {
    handleSearch(searchText);
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [genres]);

  useEffect(() => {
    const posterContainers = document.querySelectorAll(".poster-container");
    posterContainers.forEach((posterContainer) => {
      const poster = posterContainer.querySelector(".poster");
      posterContainer.removeChild(poster);
      posterContainer.appendChild(poster);
    });
  }, [currentPage]);

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
  return (
    <>
      <div className="search">
        <Input
          placeholder="Search movies"
          allowClear
          size="large"
          onPressEnter={handlePressEnter}
          onChange={handleInputChange}
          style={{
            marginTop: 35,
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
          .map(({ genres, posterUrl, date, description, title, rating }, i) => (
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
                <div className="rating">{rating.toFixed(1)}</div>
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
                    <p>
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
                    <p className="description">{description}</p>
                    <Rate allowHalf value={rating} count={10} />
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
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
  );
};

export default MovieList;
