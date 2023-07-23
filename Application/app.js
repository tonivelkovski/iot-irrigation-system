const express = require('express');
const app = express();
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const pages = require('../Application/Static/pages.js');
const cors = require('cors');
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('static'));
app.use(cors());

app.get('/', (req, res) => res.send(pages.index));
app.get('/databaseList', (req, res) => res.send(pages.databaseList));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'plantdata',
  password: 'admin',
  port: 5432,
});

app.listen(port, () => {
  console.log('Server listening on port ' + port);
});

app.post('/', (req, res) => {
  const { temperature, humidity, moisture, waterLevel } = req.body;
  const query = 'INSERT INTO data (air_temperature, air_humidity, tank_water_level, soil_moisture) VALUES ($1, $2, $3, $4);';
  pool.query(
    query, [temperature, humidity, waterLevel, moisture],
    (error, result) => {
      if (error) {
        res.status(500).send('Error storing data in the database: ' + err);
      } else {
        res.status(200).send('Data stored successfully!');
      }
    }
  );
});

app.get('/fetchLatestData', (req, res) => {
  const query = 'SELECT air_temperature, air_humidity, tank_water_level, soil_moisture, save_time FROM data ' +
    'ORDER BY save_time DESC LIMIT 1;'
  pool.query(
    query, (error, result) => {
      if (error) {
        res.status(500).send('Error retrieving data from the database: ' + error);
      } else {
        if (result.rows.length > 0) {
          const data = result.rows[0];
          res.json(data);
        } else {
          res.json({});
        }
      }
    }
  );
});

app.get('/allData', (req, res) => {
  const page = req.query.page || 1;
  const pageSize = req.query.pageSize || 10;
  const offset = (page - 1) * pageSize;

  pool.query('SELECT COUNT(*) FROM data;', (countError, countResult) => {
    if (countError) {
      res.status(500).send('Error retrieving data from the database: ' + countError);
    } else {
      const totalCount = parseInt(countResult.rows[0].count, 10);
      const totalPages = Math.ceil(totalCount / pageSize);
      const query = 'SELECT air_temperature, air_humidity, tank_water_level, soil_moisture, save_time FROM data ' +
        'OFFSET $1 LIMIT $2;';
      pool.query(
        query, [offset, pageSize],
        (error, result) => {
          if (error) {
            res.status(500).send('Error retrieving data from the database: ' + error);
          } else {
            if (result.rows.length > 0) {
              const data = result.rows;
              res.json({ results: data, totalPages });
            } else {
              res.json({ results: [], totalPages });
            }
          }
        }
      );
    }
  });
});


app.delete('/allData', (req, res) => {
  const query = 'DELETE FROM data;';
  pool.query(
    query, (error, result) => {
      if (error) {
        res.status(500).send('Error deleting data from database: ' + error);
      } else {
        res.status(200).send('Data deleted successfully!');
      }
    }
  );
});


app.delete('/deleteDataByDate', (req, res) => {
  const date = req.query.date;
  const formattedDate = new Date(date).toISOString().split('T')[0];

  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const formattedNextDay = nextDay.toISOString().split('T')[0];

  const query = 'DELETE FROM data WHERE save_time >= $1 AND save_time < $2;';
  pool.query(
    query, [formattedDate, formattedNextDay],
    (error, result) => {
      if (error) {
        res.status(500).send('Error deleting data from database: ' + error);
      } else {
        res.status(200).send('Data deleted successfully!');
      }
    }
  );
});


app.get("/fetchFilteredData", (req, res) => {
  const type = req.query.type;
  const date = req.query.date;
  const data = req.query.data;

  let orderBy = "";
  let limit = 1;

  if (type === "best") {
    orderBy = "DESC";
  } else if (type === "worst") {
    orderBy = "ASC";
  } else {
    res.status(400).json({ error: "Invalid data type!" });
    return;
  }

  const query = `SELECT * FROM data WHERE save_time::date = $1
                ORDER BY ${data} ${orderBy} LIMIT $2;`;

  pool.query(query, [date, limit], (err, result) => {
    if (err) {
      res.status(500).json([]);
    } else {
      res.status(200).json(result.rows);
    }
  });
});
