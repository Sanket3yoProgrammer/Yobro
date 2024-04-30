const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, profilePicture TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, content TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)');
});

app.post('/check-username', (req, res) => {
  const { username } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send({ isTaken: false });
    } else if (row) {
      res.send({ isTaken: true });
    } else {
      res.send({ isTaken: false });
    }
  });
});

app.post('/save-user', (req, res) => {
  const { username, password, profilePicture } = req.body;

  db.run('INSERT INTO users (username, password, profilePicture) VALUES (?, ?, ?)', [username, password, profilePicture], function(err) {
    if (err) {
      console.error(err.message);
      res.status(500).send({ success: false });
    } else {
      res.send({ success: true });
    }
  });
});

app.get('/get-user', (req, res) => {
  const { username } = req.query;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send({ success: false });
    } else if (row) {
      res.send({ success: true, username: row.username, profilePicture: row.profilePicture });
    } else {
      res.status(404).send({ success: false });
    }
  });
});

app.post('/send-message', (req, res) => {
  const { messageText } = req.body;
  const { username } = req.query;

  db.run('INSERT INTO messages (sender, content) VALUES (?, ?)', [username, messageText], function(err) {
    if (err) {
      console.error(err.message);
      res.status(500).send({ success: false });
    } else {
      db.get('SELECT * FROM messages WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          console.error(err.message);
          res.status(500).send({ success: false });
        } else {
          res.send({ success: true, sender: row.sender, content: row.content, timestamp: row.timestamp });
        }
      });
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
