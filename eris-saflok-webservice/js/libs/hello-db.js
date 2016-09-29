
var loki = require('lokijs');
var EventEmitter = require('events');
var util = require('util');
var logger = require('./eris-logger');
var chain = require('./hello-chain');

(function() {

    var log = logger.getLogger('eris.hello.db');

    // Set up event emitter
    var events = {NEW_KEY: 'createSaflokKey'};
    function DbEventEmitter() {
        EventEmitter.call(this);
    }
    util.inherits(DbEventEmitter, EventEmitter);
    var dbEventEmitter = new DbEventEmitter();

    // Set up Loki DB
    _db = new loki();
    _collection = _db.addCollection('saflokKeys', {indices: ['id', 'expiryDate', 'expiryTime', 'room']});
    _collection.ensureUniqueIndex('contractAddress');

    // Register for events from chain module
    chain.listen.on(chain.events.NEW_KEY, function (address, id, expiryDate, expiryTime, room) {
        log.info('New saflok key detected ('+id+':'+expiryDate+':'+expiryTime+':'+room+') with address: '+address);
        // Loading deal freshly from chain as there might be more data than conveyed in the event
        chain.getSaflokKeyAtAddress(address, function(err, deal) {
            if(err) { throw err; }
            log.debug('Performing DB insert for new saflok key with address '+deal.contractAddress)
            _collection.insert(deal);
            // emit two events! One carries the ID of the deal, so it can be specifically detected
            dbEventEmitter.emit(events.NEW_KEY, saflok);
            dbEventEmitter.emit(events.NEW_KEY+'_'+saflok.id, saflok);
        });
    })

    /**
     * @param library
     * @param callback
     */
    function loadSaflokKeys(callback) {
        chain.getSaflokKeys( function(error, deals) {
            log.info('Storing '+saflok.length+' saflok keys from chain in DB.');
            _collection.removeDataOnly();
            _collection.insert(saflokKeys);
            callback(null);
        });
    }

    /**
     * Refreshes the DB
     * @param callback
     */
    function refresh(callback) {
        loadSaflokKeys(callback);
    }

    function getSaflokKey(id) {
        log.debug('Retrieving deal from DB for ID: ' + id);
        return _collection.findOne({'id': id});
    }

    function getSaflokKeys(expiryDate, expiryTime) {
        log.debug('Retrieving deals from DB using parameters buyer: '+buyer+', seller: '+seller);
        var queryParams = createQuery(expiryDate, expiryTime);
        // Use AND for multiple query params
        if (queryParams.length > 1) {
            return _collection.find({'$and': queryParams});
        }
        else if (queryParams.length == 1) {
            return _collection.find(queryParams[0]);
        }
        else {
            // for 'undefined' query all documents in the collection are returned
            return _collection.find();
        }
    }

    function createSaflokKey(saflok, callback) {
        // TODO check if deal exists in DB
        chain.createSaflokKey(saflok, callback);
    }

    /*
        Helper method to create a query object for LokiJS' search
     */
    function createQuery(expiryDate, expiryTime) {
        var queryParams = [];
        if (buyer) {
            queryParams.push({'expiryDate': expiryDate});
        }
        if (seller) {
            queryParams.push({'expiryTime': expiryTime});
        }
        return queryParams;
    }

    module.exports = {
        'events': events,
        'listen': dbEventEmitter,
        'refresh': refresh,
        'getSaflokKey': getSaflokKey,
        'getSaflokKeys': getSaflokKeys,
        'createSaflokKey': createSaflokKey
    };

}());