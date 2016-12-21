"use strict"
let request = require('supertest-as-promised');
const api = require('../app');
const host = api;

request = request(host);

describe('Users route', function() {

  this.timeout(120000);

  describe('POST /users', function() {
    let token;
    after(function() {
      const params = {
        'appkey': '7384d85615237469c2f6022a154b7e2c',
      };
      request
        .delete('/users/32-providerTest2')
        .set('Accept', 'application/json')
        .send(params)
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .then((res) => {
          expect(res.body).to.be.empty;
        })
    });
    it("should create a new user when it doesn't exist", function(done) {
      const params = {
        'appkey': '7384d85615237469c2f6022a154b7e2c',
        'uid': 32,
        'provider': 'providerTest2',
        'name': 'nameTest2',
        'surname': 'surnameTest2',
        'email': 'email32@test.com'
      };
      request
        .post('/users')
        .set('Accept', 'application/json')
        .send(params)
        .expect(201)
        .expect('Content-Type', /application\/json/)
        .then((res) => {
          expect(res.body).to.have.property('user');
          const userResponse = res.body.user;
          expect(userResponse).to.have.property('uid', params.uid);
          expect(userResponse).to.have.property('provider', params.provider);
          expect(userResponse).to.have.property('name', params.name);
          expect(userResponse).to.have.property('surname', params.surname);
          expect(userResponse).to.have.property('email', params.email);
          expect(userResponse).to.have.property('takes', 0);
          expect(userResponse).to.have.property('experience', 0);
          expect(userResponse).to.have.property('level', 1);
          expect(userResponse).to.have.property('new_user', true); // És un nou usuari
          expect(userResponse).to.have.property('token');
          token = userResponse.token;
          done();
        }, done)
    });
    it('should update the token when the user exists', function(done) {
      const params = {
        'appkey': '7384d85615237469c2f6022a154b7e2c',
        'uid': 32,
        'provider': 'providerTest2',
        'name': 'nameTest2',
        'surname': 'surnameTest2',
        'email': 'email32@test.com'
      };
      request
        .post('/users')
        .set('Accept', 'application/json')
        .send(params)
        .expect(201)
        .expect('Content-Type', /application\/json/)
        .then((res) => {
          expect(res.body).to.have.property('user');
          const userResponse = res.body.user;
          expect(userResponse).to.have.property('uid', params.uid);
          expect(userResponse).to.have.property('provider', params.provider);
          expect(userResponse).to.have.property('name', params.name);
          expect(userResponse).to.have.property('surname', params.surname);
          expect(userResponse).to.have.property('email', params.email);
          expect(userResponse).to.have.property('takes', 0);
          expect(userResponse).to.have.property('experience', 0);
          expect(userResponse).to.have.property('level', 1);
          expect(userResponse).to.have.property('new_user', false); // No és un nou usuari
          expect(userResponse).to.have.property('token').and.not.to.eql(token);
          done();
        }, done)
    });
  });

  describe('GET /users', function() {
    it('should return all users', function(done) {
      request
        .get('/users?appkey=' + '7384d85615237469c2f6022a154b7e2c')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .then((res) => {
          expect(res.body).to.have.property('users');
          const users = res.body.users;
          expect(users).to.be.an('array');
          const user = users[0];
          expect(user).to.have.property('uid');
          expect(user).to.have.property('provider');
          expect(user).to.have.property('name');
          expect(user).to.have.property('surname');
          expect(user).to.have.property('email');
          expect(user).to.have.property('takes');
          expect(user).to.have.property('experience');
          expect(user).to.have.property('level');
          done();
        }, done)
    });
  });

  describe('GET /users/:id', function() {
    before(function() {
      const params = {
        'appkey': '7384d85615237469c2f6022a154b7e2c',
        'uid': 33,
        'provider': 'providerTest2',
        'name': 'nameTest3',
        'surname': 'surnameTest3',
        'email': 'email@test3.com'
      };
      request
        .post('/users')
        .set('Accept', 'application/json')
        .send(params)
        .expect(201)
        .then((res) => {
          expect(res.body).to.have.property('user');
          const userResponse = res.body.user;
          expect(userResponse).to.have.property('uid', params.uid);
          expect(userResponse).to.have.property('provider', params.provider);
          expect(userResponse).to.have.property('new_user');
          //console.log("");
        });
    });
    it('should return a certain user', function(done) {
      request
        .get('/users/33-providerTest2?appkey=' + '7384d85615237469c2f6022a154b7e2c')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .then((res) => {
          expect(res.body).to.have.property('user');
          const user = res.body.user;
          expect(user).to.have.property('uid', 33);
          expect(user).to.have.property('provider', 'providerTest2');
          expect(user).to.have.property('name', 'nameTest3');
          expect(user).to.have.property('surname', 'surnameTest3');
          expect(user).to.have.property('email', 'email@test3.com');
          expect(user).to.have.property('takes', 0);
          expect(user).to.have.property('experience', 0);
          expect(user).to.have.property('level', 1);
          expect(user).to.have.property('experience_of_next_level')
            .and.to.be.at.least(0.60);
          done();
        }, done)
    });
  });

  describe('PUT /users/:id', function() {
    before(function() {
      const params = {
        'appkey': '7384d85615237469c2f6022a154b7e2c',
        'uid': 31,
        'provider': 'providerTest',
        'name': 'nameTest',
        'surname': 'surnameTest',
        'email': 'email31@test.com'
      };
      request
        .post('/users')
        .set('Accept', 'application/json')
        .send(params)
        .expect(201)
    });
    after(function() {
      const params = {
        'appkey': '7384d85615237469c2f6022a154b7e2c',
      };
      request
        .delete('/users/31-providerTest')
        .set('Accept', 'application/json')
        .send(params)
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .then((res) => {
          expect(res.body).to.be.empty;
        })
    });
    it('should update a user information', function(done) {
      var updatedMail = "updated" + 31 + "@test.com";
      const params = {
        'appkey': '7384d85615237469c2f6022a154b7e2c',
        'name': 'updatedName',
        'surname': 'updatedSurname',
        'email': updatedMail
      };
      request
        .put('/users/31-providerTest')
        .set('Accept', 'application/json')
        .send(params)
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .then((res) => {
          expect(res.body).to.have.property('user');
          const user = res.body.user;
          expect(user).to.have.property('uid', 31);
          expect(user).to.have.property('provider', 'providerTest');
          expect(user).to.have.property('name', params.name);
          expect(user).to.have.property('surname', params.surname);
          expect(user).to.have.property('email', params.email);
          done();
        }, done)
    });
  });

  describe('DELETE users/:id', function() {
    before(function() {
      const params = {
        'appkey': '7384d85615237469c2f6022a154b7e2c',
        'uid': 31,
        'provider': 'providerTest',
        'name': 'nameTest',
        'surname': 'surnameTest',
        'email': 'email31@test.com'
      };
      request
        .post('/users')
        .set('Accept', 'application/json')
        .send(params)
        .expect(201)
    });
    it('should delete a user', function(done) {
      const params = {
        'appkey': '7384d85615237469c2f6022a154b7e2c',
      };
      request
        .delete('/users/31-providerTest')
        .set('Accept', 'application/json')
        .send(params)
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .then((res) => {
          expect(res.body).to.be.empty;
          done();
        }, done)
    });
  });

  describe.only('POST /users/:id/preferences', function() {
    const uid = 2, provider = 'provider';
    after(function() {
      const params = {
        'appkey': '7384d85615237469c2f6022a154b7e2c',
      };
      request
        .delete(`/users/${uid}-${provider}/preferences`)
        .set('Accept', 'application/json')
        .send(params)
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .then((res) => {
          expect(res.body).to.be.empty;
        })
    });
    it("should create the identified user's preferences", function(done) {
      const params = {
        'appkey': '7384d85615237469c2f6022a154b7e2c',
        'categories': 'music||comedy||art||sports',
        'locations': 'Barcelona||Madrid||Bilbao'
      };
      request
        .post(`/users/${uid}-${provider}/preferences`)
        .set('Accept', 'application/json')
        .send(params)
        .expect(201)
        .expect('Content-Type', /application\/json/)
        .then((res) => {
          expect(res.body).to.have.property('preference');
          const preferenceResponse = res.body.preference;
          expect(preferenceResponse).to.have.property('uid', uid.toString());
          expect(preferenceResponse).to.have.property('provider', provider.toString());
          expect(preferenceResponse).to.have.property('categories', params.categories);
          expect(preferenceResponse).to.have.property('locations', params.locations);
          done();
        }, done)
    });
  });

  describe.only('DELETE /users/:id/preferences', function() {
    const uid = 2, provider = 'provider';
    before(function() {
      const params = {
        'appkey': '7384d85615237469c2f6022a154b7e2c',
        'categories': 'music||comedy||art||sports',
        'locations': 'Barcelona||Madrid||Bilbao'
      };
      request
        .post(`/users/${uid}-${provider}/preferences`)
        .set('Accept', 'application/json')
        .send(params)
        .expect(201)
        .expect('Content-Type', /application\/json/)
    });
    it("should delete the identified user's preferences", function(done) {
      const params = {
        'appkey': '7384d85615237469c2f6022a154b7e2c',
      };
      request
        .delete(`/users/${uid}-${provider}/preferences`)
        .set('Accept', 'application/json')
        .send(params)
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .then((res) => {
          expect(res.body).to.be.empty;
          done();
        }, done)
    });
  });

  describe.skip('GET /users/:id/preferences', function() {
      before(function() {
          const params = {
            'appkey': '7384d85615237469c2f6022a154b7e2c',
            'uid': 32,
            'provider': 'providerTest2',
            'football': true,
            'basketball': false,
            'sports': true,
            'music': false,
            'art': false,
            'cinema': true,
            'theater': false,
            'location': 'Barcelona',
            'start_hour': '00:00',
            'end_hour': '00:00',
            'week': false,
            'weekend': true
          };
          request
            .post('/users/32-providerTest2/preferences')
            .set('Accept', 'application/json')
            .send(params)
            .expect(201)
      });
    it("should return a certain user's preferences", function(done) {
      request
        .get('/users/32-providerTest2/preferences?appkey=' + '7384d85615237469c2f6022a154b7e2c')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .then((res) => {
          expect(res.body).to.have.property('preferences');
          const preferenceResponse = res.body.preferences;
          expect(preferenceResponse).to.have.property('uid', 32);
          expect(preferenceResponse).to.have.property('provider', 'providerTest2');
          expect(preferenceResponse).to.have.property('football', true);
          expect(preferenceResponse).to.have.property('basketball', false);
          expect(preferenceResponse).to.have.property('sports', true);
          expect(preferenceResponse).to.have.property('music', false);
          expect(preferenceResponse).to.have.property('art', false);
          expect(preferenceResponse).to.have.property('cinema', true);
          expect(preferenceResponse).to.have.property('theater', false);
          expect(preferenceResponse).to.have.property('location', 'Barcelona');
          expect(preferenceResponse).to.have.property('start_hour', '00:00');
          expect(preferenceResponse).to.have.property('end_hour', '00:00');
          expect(preferenceResponse).to.have.property('week', false);
          expect(preferenceResponse).to.have.property('weekend', true);
          done();
        }, done)
    });
  });

  describe.skip('PUT /users/:id/preferences', function() {
      before(function() {
          const params = {
            'appkey': '7384d85615237469c2f6022a154b7e2c',
            'uid': 32,
            'provider': 'providerTest2',
            'football': true,
            'basketball': false,
            'sports': true,
            'music': false,
            'art': false,
            'cinema': true,
            'theater': false,
            'location': 'Barcelona',
            'start_hour': '00:00',
            'end_hour': '00:00',
            'week': false,
            'weekend': true
          };
          request
            .post('/users/32-providerTest2/preferences')
            .set('Accept', 'application/json')
            .send(params)
            .expect(201)
      });
      after(function() {
        const params = {
          'appkey': '7384d85615237469c2f6022a154b7e2c',
        };
        request
          .delete('/users/32-providerTest2/preferences')
          .set('Accept', 'application/json')
          .send(params)
          .expect(200)
          .expect('Content-Type', /application\/json/)
          .then((res) => {
            expect(res.body).to.be.empty;
          })
      });
    it('should update a user preferences', function(done) {
      const params = {
        'appkey': '7384d85615237469c2f6022a154b7e2c',
        'football': false,
        'music': true
      };
      request
        .put('/users/32-providerTest2/preferences')
        .set('Accept', 'application/json')
        .send(params)
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .then((res) => {
          done();
        }, done)
    });
  });

});
