/**
 * @name ztParser
 * @author matthieuEv, Sylicium
 * @date 19/08/2023
 * @version 1.9.1
 * @github https://github.com/matthieuEv/zone-telechargement-api
 */

const axios = require("axios");
const cheerio = require("cheerio");

class ZoneTelechargementParser {
  constructor(
    devMode = false,
    axiosRequestTimeInBetween = 300,
    moviesDbToken = ""
  ) {
    this._ZTBaseURL = '';
    this._allCategories = ["films", "series"];
    // this._allCategories = [ "films", "series", "jeux", "musiques", "mangas", "ebooks", "autres-videos", "logiciels", "mobiles" ]
    this._lastAxiosRequestTimestamp = 0; // Do not edit this value. used as temp
    this._axiosRequestTimeInBetween = axiosRequestTimeInBetween; // Default: 300 - In milliseconds. Minimum time to wait between each requests to the base URL. Low values can cause functions to crash due to HTPP error 520 from axios. (Or rate limit errors)
    this._devMode = devMode;
    this._devMode && console.log("ztParser: Dev mode enabled.");
    this._moviesDbKey = moviesDbToken;
  }

  _getBaseURL() {
    return this._ZTBaseURL;
  }

  _getAllCategories() {
    return this._allCategories;
  }

  _getMatchingGroups = function (s) {
    try {
      var r = /\((.*?)\)/g,
        a = [],
        m;
      while ((m = r.exec(s))) {
        a.push(m[1]);
      }
      return a;
    } catch (e) {
      if (this._devMode) console.log(e);
      return s;
    }
  };

  _setAxiosRequestTimeInBetween(value) {
    if (typeof value != "number")
      throw new Error("Argument must be type of 'number'.");
    this._axiosRequestTimeInBetween = value;
  }

  _setDevMode(value) {
    if (typeof value != "boolean")
      throw new Error("Argument must be type of 'boolean'.");
    this._devMode = !!value;
  }

  _getPayloadURLFromQuery(category, query, page = 1) {
    if (typeof page != "number")
      throw new Error(
        `ztParser._getPayloadURLFromQuery(): 'page' must be type of 'number'`
      );
    category = category.trim().toLowerCase();
    if (!this._allCategories.includes(category))
      throw new Error(
        `ztParser._getPayloadURLFromQuery(): 'category' must be one in the following list: ${this._getAllCategories().join(
          ", "
        )}`
      );
    return (
      this._getBaseURL() +
      `/?p=${category}&search=${encodeURI(query)}&page=${page}`
    );
  }

  async _getDOMElementFromURL(url) {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    if (
      Date.now() - this._lastAxiosRequestTimestamp <
      this._axiosRequestTimeInBetween
    ) {
      await sleep(
        this._axiosRequestTimeInBetween -
          (Date.now() - this._lastAxiosRequestTimestamp)
      );
    }
    this._lastAxiosRequestTimestamp = Date.now();

    const response = await axios.get(url);
    return cheerio.load(response.data);
  }

  async _parseMoviesFromSearchQuery(category, query, page) {
    const payloadURL = this._getPayloadURLFromQuery(category, query, page);
    const $ = await this._getDOMElementFromURL(payloadURL);

    const movieList_elements = $("#dle-content .cover_global");
    const responseMovieList = [];

    if (movieList_elements.length === 0) {
      return responseMovieList;
    }

    movieList_elements.each((index, element) => {
      const elem = $(element);

      const titleAnchor = elem.find(".cover_infos_title a");
      const the_url = this._getBaseURL() + titleAnchor.attr("href");

      const detail_release = elem.find(".cover_infos_global .detail_release");

      const publishDate = new Date(elem.find("time").text());

      const movieDatas = {
        title: titleAnchor.text(),
        url: the_url,
        id: the_url.match(/[?&]id=[0-9]{1,5}\-/gim)[0].match(/\d+/)[0],
        image: this._getBaseURL() + elem.find("img").attr("src"),
        quality: detail_release.find("span:eq(0)").text(),
        language: detail_release.find("span:eq(1)").text(),
        publishedOn: publishDate,
        publishedTimestamp: publishDate.getTime(),
      };
      responseMovieList.push(movieDatas);
    });

    return responseMovieList;
  }

  async _theMovieDbAutenfication() {
    try {
      const url = `https://api.themoviedb.org/3/authentication/token/new?api_key=${this._moviesDbKey}`;
      const response = await axios.get(url);
      this._devMode && console.log(response.data);
      return true;
    } catch (error) {
      this._devMode && console.log("Erreur:", error);
      return false;
    }
  }

  async _getMovieNameFromId(categories, id) {
    if (categories == "films") categories = "film";
    else if (categories == "series") categories = "serie";
    try {
      console.log("categories:", categories, "id:", id)
      const url = this._ZTBaseURL+`/?p=${categories}&id=${id}`;

      const $ = await this._getDOMElementFromURL(url);
      const mainHtml = $("#dle-content");
      const htmlString = mainHtml.html();

      let language = "";
      let quality = "";
      let size = "";
      let downloadLinks = {};

      let name = mainHtml.find("h1").eq(0).text();
      const originalNameMatch = htmlString.match(
        /<strong><u>Titre original<\/u> :<\/strong>\s*([^<]+)<br>/
      );
      let originalName = originalNameMatch ? originalNameMatch[1].trim() : "";
      if (categories == "film") {
        const qualityMatch = htmlString.match(
          /<strong><u>Qualité<\/u> :<\/strong>\s*([^<]+)<br>/
        );
        const languageMatch = htmlString.match(
          /<strong><u>Langue<\/u> :<\/strong>\s*([^<]+)<br>/
        );
        originalName = originalNameMatch ? originalNameMatch[1].trim() : "";
        quality = qualityMatch ? qualityMatch[1].trim() : "";
        language = languageMatch ? languageMatch[1].trim() : "";
        const sizeMatch = htmlString.match(
          /<strong><u>Taille du fichier<\/u> :<\/strong>\s*([^<]+)<br>/
        );
        size = sizeMatch ? sizeMatch[1].trim() : "";

        const postinfo = $("#news-id-23557 .postinfo");
        postinfo.find("b > div").each((index, element) => {
          const hostName = $(element).text();
          if (hostName) {
            const downloadUrl = $(element)
              .parent()
              .next()
              .find("a")
              .attr("href");
            downloadLinks[hostName] = downloadUrl;
          }
        });
        return {
          name: name,
          originalName: originalName,
          language: language,
          quality: quality,
          size: size,
          links: downloadLinks,
        };
      } else if (categories == "serie") {
        const sizeMatch = htmlString.match(
          /<strong><u>Taille d'un episode<\/u> :<\/strong>\s*([^<]+)<br>/
        );
        size = sizeMatch ? sizeMatch[1].trim() : "";

        const postinfo = $("#news-id-23557 .postinfo");
        postinfo.find("b > div").each((index, element) => {
          const hostName = $(element).text();
          if (hostName) {
            $(element)
              .parent()
              .nextAll("b")
              .each((index, element) => {
                const episode = $(element).find("a").text();
                if (episode) {
                  if (!downloadLinks[episode]) {
                    downloadLinks[episode] = {};
                  }
                  const downloadUrl = $(element).find("a").attr("href");
                  downloadLinks[episode][hostName] = downloadUrl;
                } else {
                  return false;
                }
              });
          }
        });
        return {
          name: name,
          originalName: originalName,
          language: language,
          quality: quality,
          size: size,
          links: downloadLinks,
        };
      }
    } catch (error) {
      this._devMode && console.log("Erreur:", error);
      return false;
    }
  }

  setMoviesDbToken(value) {
    this._moviesDbKey = value;
  }

  useBaseURL(url) {
    this._ZTBaseURL = url;
    return true;
  }

  async search(category, query, page) {
    try {
      let responseMovieList = await this._parseMoviesFromSearchQuery(
        category,
        query,
        page
      );
      return responseMovieList;
    } catch (e) {
      if (this._devMode) console.log(e);
      return {
        status: false,
        error: `${e}`,
        stack: e.stack.split("\n"),
      };
    }
  }

  async searchAll(category, query) {
    try {
      let responseMovieList = [];
      let tempMovieList = false;
      let searchPage = 0;
      while (tempMovieList.length != 0) {
        searchPage++;
        tempMovieList = await this._parseMoviesFromSearchQuery(
          category,
          query,
          searchPage
        );
        responseMovieList = responseMovieList.concat(tempMovieList);
        console.log(
          `Added ${tempMovieList.length} movies from page ${searchPage}`
        );
      }
      return responseMovieList;
    } catch (e) {
      if (this._devMode) console.log(e);
      return {
        status: false,
        error: `${e}`,
        stack: e.stack.split("\n"),
      };
    }
  }

  async getQueryDatas(category, id) {
    if (category == "series") return await this._getSeriesData(category, id);
    else return await this._getMovieDatas(category, id);
  }

  async _getMovieDatas(category, id) {
    try {
      if (this._theMovieDbAutenfication()) {
        const ztData = await this._getMovieNameFromId(category, id);

        const response = await axios.get(
          `https://api.themoviedb.org/3/search/movie`,
          {
            params: {
              api_key: this._moviesDbKey,
              query: ztData.name,
            },
          }
        );

        if (response.data.results && response.data.results.length > 0) {
          const movieDetails = response.data.results[0];

          // Get genres list
          const genresListResponse = await axios.get(
            `https://api.themoviedb.org/3/genre/movie/list`,
            {
              params: {
                api_key: this._moviesDbKey,
              },
            }
          );
          const genresList = genresListResponse.data.genres;

          const genreNames = movieDetails.genre_ids.map((id) => {
            const genre = genresList.find((genre) => genre.id === id);
            return genre ? genre.name : "";
          });

          // Get movie credits
          const creditsResponse = await axios.get(
            `https://api.themoviedb.org/3/movie/${movieDetails.id}/credits`,
            {
              params: {
                api_key: this._moviesDbKey,
              },
            }
          );
          const credits = creditsResponse.data;

          // Get list of directors
          const directors = credits.crew
            .filter((member) => member.job === "Director")
            .map((member) => member.name);

          // Get list of actors
          const actors = credits.cast.map((member) => member.name);

          const data = {
            title: movieDetails.original_title,
            language: ztData.language,
            quality: ztData.quality,
            size: ztData.size,
            description: movieDetails.overview,
            poster:
              "https://image.tmdb.org/t/p/w780" + movieDetails.poster_path,
            release_date: movieDetails.release_date,
            genres: genreNames,
            vote_average: movieDetails.vote_average,
            directors: directors,
            actors: actors,
            downloadLink: ztData.links,
          };

          return data;
        } else {
          throw new Error("No movie details found in the API response.");
        }
      } else {
        throw new Error(
          "Error while trying to authenticate to TheMovieDB API."
        );
      }
    } catch (error) {
      console.error("Error in getMovieDatas:", error);
      throw new Error(error);
    }
  }

  async _getSeriesData(category, id) {
    const ztData = await this._getMovieNameFromId(category, id);
    try {
      const searchResponse = await axios.get(
        `https://api.tvmaze.com/search/shows?q=${ztData.originalName}`
      );
      if (searchResponse.data.length === 0) {
        throw new Error("No results found for the given query.");
      }
      const show = searchResponse.data[0].show;

      const showResponse = await axios.get(
        `https://api.tvmaze.com/shows/${show.id}`
      );
      const showDetails = showResponse.data;

      const castResponse = await axios.get(
        `https://api.tvmaze.com/shows/${show.id}/cast`
      );
      const cast = castResponse.data;

      const actors = cast.map((member) => member.person.name);

      const crewResponse = await axios.get(
        `https://api.tvmaze.com/shows/${show.id}/crew`
      );
      const crew = crewResponse.data;

      const directors = crew
        .filter(
          (member) =>
            member.type === "Executive Producer" ||
            member.type === "Co-Executive Producer"
        )
        .map((member) => member.person.name);
      const data = {
        title: showDetails.name,
        language: ztData.language,
        quality: ztData.quality,
        size: ztData.size,
        description: showDetails.summary.replace(/<p>/g, '').replace(/<\/p>/g, ''),
        poster: showDetails.image.original,
        release_date: showDetails.premiered,
        genres: showDetails.genres,
        vote_average: showDetails.rating.average,
        directors: directors,
        actors: actors,
        downloadLink: ztData.links,
      };

      return data;
    } catch (error) {
      console.error("Error in getMovieDataFromTVMaze:", error);
      throw new Error(error);
    }
  }
}

module.exports = new ZoneTelechargementParser();
