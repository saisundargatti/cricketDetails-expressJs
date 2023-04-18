const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const app = express();
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

/// API 1

const inCamelCase = (eachItem) => {
  return {
    playerId: eachItem.player_id,
    playerName: eachItem.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `select * from player_details`;
  const dbResponse = await db.all(getPlayerQuery);
  response.send(dbResponse.map((eachItem) => inCamelCase(eachItem)));
});

/// API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerQuery = `select * from player_details where player_id = '${playerId}'`;
  const dbResponse = await db.get(getSpecificPlayerQuery);
  const specificPlayer = {
    playerId: dbResponse.player_id,
    playerName: dbResponse.player_name,
  };
  response.send(specificPlayer);
});

/// API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateSpecificPlayerQuery = `update player_details set player_name = '${playerName}' where player_id='${playerId}';`;
  await db.run(updateSpecificPlayerQuery);
  response.send("Player Details Updated");
});

/// API 4

const matchCamelCase = (eachItem) => {
  return {
    matchId: eachItem.match_id,
    match: eachItem.match,
    year: eachItem.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesQuery = `select *  from match_details where match_id = '${matchId}'`;
  const dbResponse = await db.all(getMatchesQuery);
  const matchObject = dbResponse.map((eachItem) => matchCamelCase(eachItem));
  response.send(matchObject[0]);
});

/// API 5

const specificMatchCamelCase = (eachItem) => {
  return {
    matchId: eachItem.match_id,
    match: eachItem.match,
    year: eachItem.year,
  };
};

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerMatches = `
  select
  match_details.match_id,
  match_details.match,
  match_details.year
  from player_match_score
  inner join match_details
  on 
  player_match_score.match_id = match_details.match_id
  where player_id = '${playerId}';`;
  try {
    const dbResponse = await db.all(getSpecificPlayerMatches);
    response.send(
      dbResponse.map((eachItem) => specificMatchCamelCase(eachItem))
    );
  } catch (err) {
    response.status(400).send("error");
  }
});

/// API 6

const specificPlayerCameCase = (eachItem) => {
  return {
    playerId: eachItem.player_id,
    playerName: eachItem.player_name,
  };
};

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getSpecificMatchPlayersQuery = `select player_details.player_id,player_details.player_name from player_match_score inner join player_details on player_match_score.player_id = player_details.player_id where match_id = '${matchId}';`;
  const dbResponse = await db.all(getSpecificMatchPlayersQuery);
  response.send(dbResponse.map((eachItem) => specificPlayerCameCase(eachItem)));
});

/// API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerScore = `select player_details.player_id as playerId,player_details.player_name as playerName ,SUM(score) as totalScore,SUM(fours) as totalFours ,SUM(sixes) as totalSixes from player_match_score inner join player_details on player_match_score.player_id = player_details.player_id where player_details.player_id ='${playerId}';`;
  const dbResponse = await db.all(getSpecificPlayerScore);
  response.send(dbResponse[0]);
});

module.exports = app;
