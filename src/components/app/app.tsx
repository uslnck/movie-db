//@ts-nocheck

import "./app.css";
import { Row, Col, Card } from "antd";
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
    const fetchString = `${baseUrl}${searchType}${this._apiKey}${this._lang}${q}${p}${this._noAdult}`;
    const fetchGenresString = `${this._baseUrlGenres}${this._apiKey}`;
    let res = {};
    if (baseUrl === this._baseUrl) res = await fetch(fetchString);
    else res = await fetch(fetchGenresString);
    if (!res.ok) throw new Error("Couldn't fetch URL");
    const body = await res.json();
    return body;
  }

  async searchMovie(query) {
    const res = await this.getResource(query, "movie");
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

  const fetchGenres = async () => {
    try {
      const genreList = await ss.getGenres();
      setGenres(genreList);
    } catch (e) {
      throw new Error("Couldn't fetch genres", e);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchMovies = async () => {
    try {
      const randomMovie = await ss.searchMovie("return");
      const movieData = randomMovie.map((movie) => ({
        title: movie.original_title,
        date: movie.release_date,
        description: movie.overview,
        posterUrl: `${imageBaseURL}${movie.poster_path}`,
        genres: getGenreText(movie.genre_ids),
      }));
      setMovies(movieData);
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

  useEffect(() => {
    fetchMovies();
  }, [genres]);

  return (
    <>
      <h1>Movies</h1>
      <Row gutter={[0, 40]} justify="space-evenly">
        {movies.map(({ genres, posterUrl, date, description, title }, i) => (
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
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={posterUrl}
                      alt={title}
                      style={{ height: "100%", width: "100%" }}
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
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export default MovieList;
