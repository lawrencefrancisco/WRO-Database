const express = require('express');
const dashboard = require('./server/routes/dashboard');

const app = express();
// Mock auth middleware
app.use((req, res, next) => {
  req.user = { userId: 1 };
  next();
});
app.use('/dashboard', dashboard);

const request = require('supertest');
request(app)
  .get('/dashboard/participation')
  .expect('Content-Type', /json/)
  .expect(200)
  .end(function(err, res) {
    if (err) throw err;
    console.log(JSON.stringify(res.body, null, 2));
    process.exit(0);
  });
