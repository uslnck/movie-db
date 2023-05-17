//@ts-nocheck

import "./app.css";
import { Spin, Input, Tabs, List, message } from "antd";
import { useEffect, useState } from "react";
import CustomCard from "../custom-card";
import RatedPagination from "../rated-pagination";
import SearchPagination from "../search-pagination";
import SearchService from "../../utils/helpers/SearchService";

const ss = new SearchService();

const MovieList = () => {
  const storedGenres = localStorage.getItem("storedGenres");
  const genresState = storedGenres ? JSON.parse(storedGenres) : [];

  const storedSessionId = localStorage.getItem("storedSessionId");
  const sessionState = storedSessionId ? JSON.parse(storedSessionId) : "";

  const [movies, setMovies] = useState("");
  const [trending, setTrending] = useState("");
  const [totalMovies, setTotalMovies] = useState("");
  const [genres, setGenres] = useState(genresState);
  const [sessionId, setSessionId] = useState(sessionState);
  const [pageLoading, setPageLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [, setActiveTab] = useState("");
  const [ratedMovies, setRatedMovies] = useState([]);
  const [totalRatedMovies, setTotalRatedMovies] = useState("");
  const [currentRatedPage, setCurrentRatedPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentQuery, setCurrentQuery] = useState("");

  const pageSize = 20;
  const imageBaseURL = "https://www.themoviedb.org/t/p/w600_and_h900_bestv2/";

  const getSessionId = async () => {
    try {
      const id = await ss.getGuestSessionId();
      setSessionId(id);
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

  const handleRatedChange = async (key, page) => {
    setPageLoading(true);
    setActiveTab(key);
    if (key === "2") {
      const rated = await ss.getRatedMovies(page);
      console.log("got rated from server:", rated);
      const ratedWithGenres = rated[0].map((movie) => {
        const genreNames = getGenreText(movie.genre_ids);
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

  const handleClear = () => {
    window.location.reload();
  };

  const handleInputChange = (e) => {
    let currentQuery = e.target.value;
    delayedSearch(currentQuery, 1);
    console.log("commencing new search...");
    if (currentQuery === "") handleClear();
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
                      title={title}
                      vote={vote}
                      id={id}
                      handleImageLoadError={handleImageLoadError}
                      handleImageLoad={handleImageLoad}
                      handleRatingChange={handleRatingChange}
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

  const useLocalStorage = (key, storedValue, extraAction) => {
    useEffect(() => {
      localStorage.setItem(key, JSON.stringify(storedValue));
      if (extraAction === handleMainPageLoad && genres.length !== 0)
        extraAction();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storedValue]);
  };

  useLocalStorage("storedQuery", currentQuery);
  useLocalStorage("storedTotalMovies", totalMovies);
  useLocalStorage("storedSessionId", sessionId);
  useLocalStorage("storedTotalRatedMovies", totalRatedMovies);
  useLocalStorage("storedGenres", genres, handleMainPageLoad);

  useEffect(() => {
    if (localStorage.getItem("storedSessionId") === '""') getSessionId();
    if (localStorage.getItem("storedGenres") === "[]") getGenres();
  }, []);

  return (
    <Tabs
      defaultActiveKey="1"
      items={items}
      onChange={(key) => handleRatedChange(key, currentRatedPage)}
    />
  );
};

export default MovieList;
