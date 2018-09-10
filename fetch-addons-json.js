import fetch from "node-fetch";
import fs from "fs-extra";
import path from "path";
import async from "async";
import queryString from "query-string";

async function fetchPageJson(url) {
  const res = await fetch(url);
  return res.json();
}

async function fetchPageJsonAndStoreTheResults(url) {
  console.log(`Fetching ${url}`);
  const json = await fetchPageJson(url);
  const parsed = queryString.parse(url);
  const jsonResultsPath = path.resolve(`results/${parsed.page}.json`);
  console.log(`Storing fetched results as ${jsonResultsPath}`);
  await fs.outputFile(jsonResultsPath, JSON.stringify(json.results), "utf-8");
  return json;
}

(async function() {
  // Request the first page to get the total page count
  const firstPage = 1;
  const firstPageUrl = `https://addons.mozilla.org/api/v3/addons/search/?app=firefox&type=extension&page_size=50&page=${firstPage}`;
  const json = await fetchPageJsonAndStoreTheResults(firstPageUrl);
  console.log("json", json);
  const lastPage = json.page_count; // The API seems to return the incorrect number of pages and not allow navigation beyond this page number - reported as https://github.com/mozilla/addons-server/issues/9392
  console.log("lastPage", lastPage);

  // Construct an array of all remaining page urls
  const numPagesToFetch = lastPage - firstPage;
  console.log("numPagesToFetch", numPagesToFetch);
  if (numPagesToFetch <= 0) {
    return;
  }
  const allPageUrls = Array.from(
    new Array(numPagesToFetch),
    (val, index) =>
      `https://addons.mozilla.org/api/v3/addons/search/?app=firefox&type=extension&page_size=50&page=${index +
        firstPage +
        1}`,
  );
  console.log("allPageUrls", allPageUrls);

  // Request all urls, at most 10 at a time, storing the results as json in the results-folder
  async.mapLimit(
    allPageUrls,
    10,
    async.asyncify(fetchPageJsonAndStoreTheResults),
    (err, results) => {
      console.log("Finished");
      if (err) throw err;
      // results is now an array of the return values
      console.log("results", results);
    },
  );

  // Afterwards, join all json files with: jq -s '.[0]=([.[]]|flatten)|.[0]' results/*.json > ../addons.json
})();
