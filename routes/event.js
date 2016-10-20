"use strict"
const express = require('express')
const router = express.Router()
const mysql = require('promise-mysql');
const rp = require('request-promise');

const oauthTokenEventbrite = "VOYBQID3OWOAMLM6FFLQ";
const urlEventbriteApi = "https://www.eventbriteapi.com/v3/";

const timeZone = "Europe/Madrid";
const currency = "EUR";

var pool  = mysql.createPool({
  host     : 'localhost',
  user     : 'root',
  password : '12345678',
  database : 'takemelegends'
});

function fillExtraInfo(varFrom, varTo) {
  if (varFrom.price != undefined && varFrom.price != null) { varTo.price = varFrom.price; }
  if (varFrom.address) { varTo.address = varFrom.address; }
  if (varFrom.coords && varFrom.coords.latitude && varFrom.coords.longitude) {
    varTo.latitude = varFrom.coords.latitude;
    varTo.longitude = varFrom.coords.longitude;
  }
}

function handleError(err, res, requestVerb) {
  if (err.error && err.error.status_code && err.error.status_code == 403) {
    res
      .status(err.error.status_code)
      .json({error: true, message: err.error.error_description})
  } else {
    console.log("Error "+requestVerb+" : " + JSON.stringify(err));
    res
      .status(500)
      .json({error: true, message: 'Error: ' +  JSON.stringify(err)})
  }
}

function handleNoParams(res) {
  res
    .status(403)
    .json({error: true, message: 'Params empty'})
}

function doRequest(finalUrl, method, body) {
  let optionsRequest = {
    url: finalUrl,
    method: method,
    'auth': {
      'bearer': oauthTokenEventbrite
    },
    json: true
  };
  if (body) { optionsRequest.body = body }
  return rp(optionsRequest);
}

// Falta Refactor d'optionsRequest

router
  .post('/', function(req, res, next) {
    if(!req.body || !req.body.name || !req.body.startTime || !req.body.endTime) { handleNoParams(res); }
    else {
      const eventRequest = req.body;
      let eventResEventBrite;
      let insertEventDB;
      let eventResponse;

      pool.getConnection().then(function(mysqlConnection) {
        mysqlConnection.query("CREATE TABLE IF NOT EXISTS events(id bigint NOT NULL PRIMARY KEY, price DECIMAL(10, 2), address VARCHAR(500), latitude DECIMAL(10, 8), longitude DECIMAL(11, 8));")
        .then((result) => { // Fa la Resquest a EventBrite API
          let eventReqEventBrite = {
                                event: {
                                  name: { html: eventRequest.name },
                                  start: {
                                    utc: eventRequest.startTime,
                                    timezone: timeZone
                                  },
                                  end: {
                                    utc: eventRequest.endTime,
                                    timezone: timeZone
                                  },
                                  currency: currency
                                }
                              };
          if (eventRequest.description) { eventReqEventBrite.event.description = {html: eventRequest.description} };
          //if (eventRequest.category_id) { eventReqEventBrite.event.category_id = eventRequest.category_id };
          if (eventRequest.capacity) { eventReqEventBrite.event.capacity = eventRequest.capacity };
          return doRequest(urlEventbriteApi+"events/", "POST", eventReqEventBrite);
        })
        .then((result) => { // Inserta a la nostra BD
          eventResEventBrite = result;
          insertEventDB = {id: eventResEventBrite.id};
          fillExtraInfo(eventRequest, insertEventDB);
          return mysqlConnection.query("INSERT INTO events SET ?", insertEventDB);
        })
        .then((result) => { // Fa el Response bo :)
          let eventResponse = {
            id: eventResEventBrite.id,
            name: eventResEventBrite.name.text,
            description: eventResEventBrite.description.text,
            url: eventResEventBrite.url,
            resource_uri: eventResEventBrite.resource_uri,
            start: eventResEventBrite.start.local,
            end: eventResEventBrite.end.local,
            capacity: eventResEventBrite.capacity,
            category_id: eventResEventBrite.category_id,
            logo: eventResEventBrite.logo
          };
          fillExtraInfo(eventRequest, eventResponse);
          res
            .status(201)
            .json({ event: eventResponse });
        })
        .catch((err) => {
          handleError(err, res, "POST");
        });
      });
    }
  })

  .get('/', function(req, res, next) {
    // PER FER
  })

  .get('/:id', function(req, res, next) {
    if(!req.params.id) { handleNoParams(res); }
    else {
      let id = req.params.id;
      let eventResponse;
      pool.getConnection().then(function(mysqlConnection) {
        mysqlConnection.query("SELECT * FROM events WHERE id = ?;", id)
        .then((result) => {
          if (result.length > 0) { eventResponse = result[0]; eventResponse.appEvent = true; }
          else { eventResponse = {}; eventResponse.appEvent = false; }
          return doRequest(urlEventbriteApi + "events/" + id + "/", "GET");
        })
        .then((result) => {
          eventResponse.name = result.name.text;
          eventResponse.description = result.description.text;
          eventResponse.url = result.url;
          eventResponse.resource_uri = result.resource_uri;
          eventResponse.capacity = result.capacity;
          eventResponse.start = result.start.local;
          eventResponse.end = result.end.local;
          eventResponse.category_id = result.category_id;
          eventResponse.logo = result.logo;
          if ( !eventResponse.appEvent ) {
            eventResponse.id = parseInt(result.id);
            eventResponse.price = null;
            eventResponse.address = null;
            eventResponse.latitude = null;
            eventResponse.longitude = null;

            if (result.price) { eventResponse.price = result.price; }
            if (result.location) {
              if (result.address) { eventResponse.address = result.location.address; }
              if (result.latitude) { eventResponse.latitude = result.location.latitude; }
              if (result.longitude) { eventResponse.longitude = result.location.longitude; }
            }
          }
          res
            .status(200)
            .json({event: eventResponse})
        })
        .catch((err) => {
          handleError(err, res, "GET/:id");
        });
      });
    }
  })

  .put('/:id', function(req, res, next) {
    if(!req.params.id || !req.body)  { handleNoParams(res); }
    else {
      let eventResponse;
      const eventRequest = req.body;
      let eventReqEventBrite = { event: {} };
      let eventResEventBrite = {};
      if (eventRequest.name)  { eventReqEventBrite.event.name = {html: eventRequest.name} };
      if (eventRequest.description) { eventReqEventBrite.event.description = {html: eventRequest.description} };
      if (eventRequest.startTime) {
        eventReqEventBrite.event.start = {
          utc: eventRequest.startTime,
          timezone: timeZone
        }
      };
      if (eventRequest.endTime) {
        eventReqEventBrite.event.end = {
          utc: eventRequest.endTime,
          timezone: timeZone
        }
      };
      if (eventRequest.currency) { eventReqEventBrite.event.currency = eventRequest.currency; };
      //if (eventRequest.category_id) { eventReqEventBrite.event.category_id = eventRequest.category_id; };
      if (eventRequest.capacity) { eventReqEventBrite.event.capacity = eventRequest.capacity; };
      doRequest(urlEventbriteApi+"events/"+req.params.id+"/", "POST", eventReqEventBrite)
      .then((result) => {
         eventResEventBrite = result;
        return pool.getConnection();
      })
      .then((mysqlConnection) => {
        let eventEditDB = {};
        fillExtraInfo(eventRequest, eventEditDB);
        return mysqlConnection.query("UPDATE events SET ? WHERE id = ?;", [eventEditDB, req.params.id]);
      })
      .then((result) => {
        let eventResponse = {
          id: parseInt(eventResEventBrite.id),
          name: eventResEventBrite.name.text,
          description: eventResEventBrite.description.text,
          url: eventResEventBrite.url,
          resource_uri: eventResEventBrite.resource_uri,
          start: eventResEventBrite.start.local,
          end: eventResEventBrite.end.local,
          capacity: eventResEventBrite.capacity,
          category_id: eventResEventBrite.category_id,
          logo: eventResEventBrite.logo
        };
        fillExtraInfo(eventRequest, eventResponse);
        res
          .status(200)
          .json({ event: eventResponse });
      })
      .catch((err) => {
        handleError(err, res, "PUT");
      });

    }
  })

  .delete('/:id', function(req, res, next) {
    if(!req.params.id)  { handleNoParams(res); }
    else {
      doRequest(urlEventbriteApi+"events/"+req.params.id+"/", "DELETE")
      .then((result) => {
        return pool.getConnection();
      })
      .then((mysqlConnection) => {
        return mysqlConnection.query("DELETE FROM events WHERE id = ?;", req.params.id)
      })
      .then((result) => {
        res
          .status(200)
          .json({})
      })
      .catch((err) => {
        handleError(err, res, "DELETE");
      });

    }
  })

module.exports = router
