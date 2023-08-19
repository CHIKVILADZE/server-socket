const express = require('express');
const app = express();
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.json());

const dbConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'users',
});

dbConnection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the database');
  }
});

const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
  },
});

const gameStates = {};

io.on('connection', (socket) => {
  if (gameStates[socket.id]) {
    socket.emit('chat', gameStates[socket.id]);
  }

  socket.on('chat', (newGameState) => {
    gameStates[socket.id] = newGameState;

    socket.broadcast.emit('chat', newGameState);
  });

  socket.on('disconnect', () => {
    delete gameStates[socket.id];
  });

  socket.on('players', (args) => {
    const sql = 'INSERT INTO players (name) VALUES (?)';
    dbConnection.query(sql, [args.name], (err, result) => {
      if (err) {
        console.error('Error saving name to the database:', err);
      } else {
        console.log('Name saved to the database');

        io.emit('fetchNames');
      }
    });
  });

  socket.on('fetchNames', () => {
    const fetchNamesSQL = 'SELECT name FROM players';
    dbConnection.query(fetchNamesSQL, (err, results) => {
      if (err) {
        console.error('Error fetching names from the database:', err);
      } else {
        console.log('Names fetched from the database:', results);
        socket.emit('fetchedNames', results);
      }
    });
  });
});

httpServer.listen(3001, () => {
  console.log(`Server listen on port 3001`);
});
