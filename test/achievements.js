"use strict"
let request = require('supertest-as-promised');
const api = require('../app');
const host = api;

request = request(host);

var aux_id = "1";

describe('route of achievements', function() {

  this.timeout(4000); // Per les proves

  describe('GET /achievements', function() {
    it('should get the whole list of achievements', function(done) {
      request
        .get('/achievements')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /application\/json/)
      .then((res) => {

        expect(res.body).to.have.property('achievements');
        const achievements = res.body.achievements;

        expect(achievements).to.be.an('array')
          .and.to.have.length.of.at.least(3);

        const achievementResponse = achievements[0];

        expect(achievementResponse).to.have.property('name')
        expect(achievementResponse).to.have.property('description')

        done();
      }, done)
    });
  });

  describe('GET /achievements/user/', function() { // CAL COMPROBAR EL TOKEN!!!
    it('should obtain all achievements from a user', function(done) {
      const params = {
        'uid' : 1,
        'provider' : 'provider',
        'page_size' : 20
      };
      request
        .get('/achievements/user')
        .set('Accept', 'application/json')
        .send(params)
        .expect(200)
        .expect('Content-Type', /application\/json/)
      .then((res) => {

        expect(res.body).to.have.property('total_items');
        expect(res.body).to.have.property('achievements');
        const achievements = res.body.achievements;

        //console.log(JSON.stringify(res.body));

        expect(achievements).to.be.an('array')
          .and.to.have.length.of.at.least(1);
        expect(achievements).to.be.an('array')
          .and.to.have.length.of.at.most(params.page_size);

        const achievementResponse = achievements[0].achievement;
        //console.log("achievementResponse: --> " + JSON.stringify(achievementResponse));
        expect(achievementResponse).to.have.property('name')
        expect(achievementResponse).to.have.property('description')

        done();
      }, done)
    });
  });


});
