import dayjs from 'dayjs';

function User(id, username, bestScore = 0, createdAt = null) {
  this.id = id;
  this.username = username;
  this.bestScore = bestScore;
  this.createdAt = createdAt ? dayjs(createdAt) : dayjs();
}

function Line(id, name, color) {
  this.id = id;
  this.name = name;
  this.color = color;
}

function Station(id, name) {
  this.id = id;
  this.name = name;
}

function LineStation(lineId, stationId, position) {
  this.lineId = lineId;
  this.stationId = stationId;
  this.position = position;
}

function Segment(id, stationA, stationB, stationAName, stationBName) {
  this.id = id;
  this.stationA = stationA;
  this.stationB = stationB;
  this.stationAName = stationAName;
  this.stationBName = stationBName;
}

function Event(id, description, effect) {
  this.id = id;
  this.description = description;
  this.effect = effect; 
}


function Game(id, userId, score, playedAt = null) {
  this.id = id;
  this.userId = userId;
  this.score = score;
  this.playedAt = playedAt ? dayjs(playedAt) : dayjs();
}


function GameStep(from, to, event, effect, coins) {
  this.from = from;           
  this.to = to;              
  this.event = event;         
  this.effect = effect;       
  this.coins = coins;         
}


function GameState(startStation, endStation, coins = 20) {
  this.startStation = startStation;   
  this.endStation = endStation;      
  this.coins = coins;                  
  this.startTime = Date.now();        
  this.steps = [];                    
  this.finalCoins = null;             
}

export { 
  User, Line, Station, LineStation, Segment, Event, Game, GameStep, GameState 
};