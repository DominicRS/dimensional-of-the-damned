const fs = require('fs');
const cheerio = require('cheerio');
const request = require('request-promise');

const DOTD_QUALIFIER_HIGHSCORE_ID = 1508152301821;
const DOTD_FINAL_HIGHSCORES_PAGE_URL = "http://services.runescape.com/m=temp-hiscores/ranking?id=1510570900743&filter=-1&page=";

const RUNESCAPE_API_HIGHSCORE_RANKINGS_URL = "http://services.runescape.com/m=temp-hiscores/getRankings.json?player=%CHARACTER%&status=archived";

const fetchData = async function(requestUrl) {
  try {
    return await request.get(requestUrl);
  }
  catch (exception) {
    console.log('Error retrieving data at requestUrl: ' + requestUrl);
    return Promise.reject(exception);
  }
};

const getLastPage = function(cheerioSource) {
  const totalPaginatedListElements = cheerioSource('.paging').find('li');
  const lastPaginationElement = totalPaginatedListElements.slice(totalPaginatedListElements.length - 1);
  return parseInt(lastPaginationElement.children('a').text());
};

const parseAvailableCharacters = function(highscoreTableSource) {
  const availableCharacters = [];
  highscoreTableSource.find('tr').each(function(index, element) {
    const currentCharacterElement = cheerio(this);
    const characterUsername = currentCharacterElement.find('td').slice(1).children('a').html().split('avatar-rs/')[1].split('/chat.png')[0];
    availableCharacters.push({
      characterPosition: parseInt(currentCharacterElement.find('td').slice(0).children('a').text()),
      characterScore: currentCharacterElement.find('td').slice(2).children('a').text(),
      characterUsername: characterUsername,
      characterCleanUsername: unescape(characterUsername),
      characterIsAMember: currentCharacterElement.find('td').slice(1).children('a').find('img').length == 2
    });
  });
  return availableCharacters;
}

const getDimensionOfTheDamnedFinalists = async function() {
  const originalHighscoresPageSource = await fetchData(DOTD_FINAL_HIGHSCORES_PAGE_URL + '1');
  const lastPageIndex = getLastPage(cheerio.load(originalHighscoresPageSource));

  const dotdFinalists = [];
  for (let i = 0; i < lastPageIndex; i++) {
    const currentHighscoresPage = await fetchData(DOTD_FINAL_HIGHSCORES_PAGE_URL + (i + 1));
    dotdFinalists.push(...parseAvailableCharacters(cheerio.load(currentHighscoresPage)('.tiledBlueFrame .tableWrap tbody')));
  }
  return dotdFinalists;
}

const aggregateQualifierData = async function(dimensionOfTheDamnedFinalists) {
  for (const finalistIndex in dimensionOfTheDamnedFinalists) {
    const finalist = dimensionOfTheDamnedFinalists[finalistIndex];
    console.log('Fetching qualifier information for finalist ' + finalist.characterUsername + ' (' + finalistIndex + ')');

    const finalistQualifierData = await getDimensionOfTheDamnedQualifierData(finalist);
    finalist.qualifierRank = finalistQualifierData.qualifierRank;
    finalist.qualifierScore = finalistQualifierData.qualifierScore;
  }
}

const getDimensionOfTheDamnedQualifierData = async function(finalist) {
  const seasonalRankingData = JSON.parse(await fetchData(RUNESCAPE_API_HIGHSCORE_RANKINGS_URL.replace('%CHARACTER%', finalist.characterUsername)))
  for (let i = 0; i < seasonalRankingData.length; i++) {
    const seasonalRankData = seasonalRankingData[i];
    if (seasonalRankData.hiscoreId == DOTD_QUALIFIER_HIGHSCORE_ID) {
      return { qualifierRank: seasonalRankData.rank, qualifierScore: seasonalRankData.score_formatted };
    }
  }
  return { qualifierRank: -1, qualifierScore: null };
}

const findNonQualifiedPlayers = function(dimensionOfTheDamnedFinalists) {
  const nonQualifiedPlayers = [];
  for (const finalistIndex in dimensionOfTheDamnedFinalists) {
    const finalist = dimensionOfTheDamnedFinalists[finalistIndex];
    if (finalist.qualifierRank == -1 || finalist.qualifierRank > 1000) {
      nonQualifiedPlayers.push(finalist);
    }
  }
  return nonQualifiedPlayers;
}

const findPlayersKilledByMiasma = function(dimensionOfTheDamnedFinalists) {
  const playersKilledByMiasma = [];
  for (const finalistIndex in dimensionOfTheDamnedFinalists) {
    const finalist = dimensionOfTheDamnedFinalists[finalistIndex];
    if (finalist.characterScore == 10) {
      playersKilledByMiasma.push(finalist);
    }
  }
  return playersKilledByMiasma;
}

const findPlayersWithMembership = function(dimensionOfTheDamnedFinalists) {
  const playersWithMembership = [];
  for (const finalistIndex in dimensionOfTheDamnedFinalists) {
    const finalist = dimensionOfTheDamnedFinalists[finalistIndex];
    if (finalist.characterIsAMember ) {
      playersWithMembership.push(finalist);
    }
  }
  return playersWithMembership;
}

const percentageOfPlayers = function(impactedPlayers, totalPlayers) {
  return ((impactedPlayers / totalPlayers) * 100).toFixed(2);
}

const writeResultsToDisk = function (fileName, fileContents) {
  fs.writeFile(fileName, fileContents, function (err) {});
}

const startScrape = async function() {
  console.log('Fetching finalists information...');
  const dimensionOfTheDamnedFinalists = await getDimensionOfTheDamnedFinalists();

  console.log('Aggregating Qualifier information for finalists...');
  await aggregateQualifierData(dimensionOfTheDamnedFinalists);

  const nonQualifiedPlayers = findNonQualifiedPlayers(dimensionOfTheDamnedFinalists);
  const playersKilledByMiasma = findPlayersKilledByMiasma(dimensionOfTheDamnedFinalists);
  const playersWithMembership = findPlayersWithMembership(dimensionOfTheDamnedFinalists);

  console.log('Total players in the final: ' + dimensionOfTheDamnedFinalists.length);
  console.log('Total players who did not pass the qualifier: ' + nonQualifiedPlayers.length + ' (' + percentageOfPlayers(nonQualifiedPlayers.length, dimensionOfTheDamnedFinalists.length) + '%)');
  console.log('Total players killed by Miasma: ' + playersKilledByMiasma.length + ' (' + percentageOfPlayers(playersKilledByMiasma.length, dimensionOfTheDamnedFinalists.length) + '%)');
  console.log('Total players with membership: ' + playersWithMembership.length + ' (' + percentageOfPlayers(playersWithMembership.length, dimensionOfTheDamnedFinalists.length) + '%)');

  writeResultsToDisk('non-qualifed-players.json', JSON.stringify(nonQualifiedPlayers));
  writeResultsToDisk('players-killed-by-miasma.json', JSON.stringify(playersKilledByMiasma));
};

startScrape();
