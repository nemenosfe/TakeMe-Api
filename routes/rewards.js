"use strict"
const express = require('express'),
      router = express.Router(),
      Promise = require("bluebird"),

      utilsErrors = require('../utils/handleErrors'),
      utilsSecurity = require('../utils/security'),
      utilsDatabaseRelated = require('../utils/databaseRelated'),

      pool  = utilsDatabaseRelated.getPool();

router

  .get('/', function(req, res, next) {
    if(!req.query) { utilsErrors.handleNoParams(res); }
    else {
      let page_size = "20";
      let page_number = "1";
      if (req.query && req.query.page_size) { page_size = req.query.page_size; }
      if (req.query && req.query.page_number) { page_number = req.query.page_number; }
      const limit = page_size;
      const offset = page_size*(page_number-1);
      pool.getConnection().then(function(mysqlConnection) {
        utilsSecurity.authorize_appkey(req.query.appkey, mysqlConnection)
        .then((result) => {
          return mysqlConnection.query("SELECT * FROM rewards ORDER BY level ASC, takes ASC, name ASC LIMIT " + limit + " OFFSET " + offset + " ;");
        })
        .then((result) => { res.status(200).json({rewards: result}) })
        .catch((err) => { utilsErrors.handleError(err, res, "GET"); })
        .finally(() => { pool.releaseConnection(mysqlConnection); });
      });
    }
  })

  .get('/user', function(req, res, next) {
    if(!req.query || !req.query.uid || !req.query.provider) { utilsErrors.handleNoParams(res); }
    else {
      let page_size = "20";
      let page_number = "1";
      if (req.query && req.query.page_size) { page_size = req.query.page_size; }
      if (req.query && req.query.page_number) { page_number = req.query.page_number; }
      const limit = page_size;
      const offset = page_size*(page_number-1);
      let rewardsResponse = {
        "total_items" : 0,
        "total_rewards" : 0,
        "rewards" : []
      };

      pool.getConnection().then(function(mysqlConnection) {
        utilsSecurity.authorize_appkey(req.query.appkey, mysqlConnection)
        .then((result) => {
          return utilsSecurity.authorize_token(req.query.token, req.query.uid, req.query.provider, mysqlConnection);
        })
        .then((result) => {
          const sql = "SELECT * FROM rewards r, purchases p WHERE r.name = p.rewards_name AND p.users_uid = '"+req.query.uid+"' AND p.users_provider = '"+req.query.provider+"' ORDER BY name ASC LIMIT " + limit + " OFFSET " + offset + " ;";
          return mysqlConnection.query(sql);
        })
        .then((DBresult) => {
          rewardsResponse.total_items = DBresult.length;
          let total_rewards = 0;
          for (let index = 0; index < DBresult.length; index++) {
            let elementArray = {
              'name' : DBresult[index].name,
              'description' : DBresult[index].description,
              'takes' : DBresult[index].takes,
              'level' : DBresult[index].level,
              'amount' : DBresult[index].amount
            };
            rewardsResponse["rewards"][index] = { 'reward' : elementArray };
            total_rewards += parseInt(DBresult[index].amount);
          }
          rewardsResponse["total_rewards"] = total_rewards;

          res.status(200).json(rewardsResponse)
        })
        .catch((err) => { utilsErrors.handleError(err, res, "GET/user"); })
        .finally(() => { pool.releaseConnection(mysqlConnection); });
      });
    }
  })

  .post('/user', function(req, res, next) {
    if(!req.body || !req.body.uid || !req.body.provider || !req.body.reward_name) { utilsErrors.handleNoParams(); }
    else {
      const purchaseRequest = req.body;
      let infoReward = {};
      let infoUser = {};
      let purchase_exists = -1;
      let amount = 1;
      if (req.body.amount) { amount = req.body.amount; }

      pool.getConnection().then(function(mysqlConnection) {
        utilsSecurity.authorize_appkey(req.body.appkey, mysqlConnection)
        .then(() => {
          return utilsSecurity.authorize_token(req.body.token, req.body.uid, req.body.provider, mysqlConnection);
        })
        .then(() => {
          const sqlGetRewardData = "SELECT takes, level FROM rewards WHERE name ='"+req.body.reward_name+"';";
          return mysqlConnection.query(sqlGetRewardData);
        })
        .then((result) => {
          infoReward.takes = result[0].takes;
          infoReward.level = result[0].level;
          const sqlGetUserData = "SELECT takes, level FROM users WHERE uid = '" + req.body.uid + "' AND provider = '" + req.body.provider + "' ;";
          return mysqlConnection.query(sqlGetUserData);
        })
        .then((result) => {
          infoUser.takes = result[0].takes;
          infoUser.level = result[0].level;
          return new Promise(function(resolve, reject) {
            if ( infoUser.level < infoReward.level ) { reject("This user's level is not enough to get this reward"); }
            else if ( infoUser.takes < (infoReward.takes*amount) ) { reject("This user doesn't have enough takes to get this reward"); }
            else {
              const sql = "SELECT COUNT(1) AS purchase_exists FROM purchases WHERE rewards_name='"+req.body.reward_name+"' AND users_uid = '"+req.body.uid+"' AND users_provider = '"+req.body.provider+"' ;";
              const result = mysqlConnection.query(sql);
              resolve(result);
            }
          });
        })
        .then((result) => {
          purchase_exists = result[0].purchase_exists;
          return mysqlConnection.query('START TRANSACTION');
        })
        .then((result) => {
          const sqlRegisterPurchase = (purchase_exists
                                      ? `UPDATE purchases SET amount = amount + ${amount} WHERE rewards_name='${req.body.reward_name}' AND users_uid = '${req.body.uid}' AND users_provider = '${req.body.provider}' ;`
                                      : `INSERT INTO purchases VALUES ('${req.body.uid}', '${req.body.provider}', '${req.body.reward_name}', 1);`
          );
          return mysqlConnection.query(sqlRegisterPurchase);
        })
        .then((result) => {
          const sqlDecreaseTakes = "UPDATE users SET takes = takes - "+(infoReward.takes*amount)+" WHERE uid = '"+req.body.uid+"' AND provider = '"+req.body.provider+"' ;";
          return mysqlConnection.query(sqlDecreaseTakes);
        })
        .then((result) => {
          mysqlConnection.query('COMMIT');
          const sql = "SELECT u.takes, p.amount FROM purchases p, users u WHERE u.uid = p.users_uid AND u.provider = p.users_provider AND p.rewards_name='"+req.body.reward_name+"' AND p.users_uid = '"+req.body.uid+"' AND p.users_provider = '"+req.body.provider+"' ;";
          return mysqlConnection.query(sql);
        })
        .then((result) => {
          const purchaseResponse = {
            'purchase' : {
              'reward_name' : req.body.reward_name,
              'uid' : req.body.uid,
              'provider' : req.body.provider,
              'amount' : amount,
              'total_amount' : result[0].amount,
              'takes_left' : result[0].takes
            }
          };
          res.status(201).json(purchaseResponse)
        })
        .catch((err) => {
          mysqlConnection.query('ROLLBACK');
          utilsErrors.handleError(err, res, "GET/user");
        })
        .finally(() => { pool.releaseConnection(mysqlConnection); });
      });
    }
  })

module.exports = router
