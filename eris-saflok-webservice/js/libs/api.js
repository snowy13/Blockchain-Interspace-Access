
require('./message');

var net = require('net');
var HOST = '192.168.8.69';
var PORT = 8264;



var sendSaflokKey = function (callback, expiryDate, expiryTime, room) {
var saflokMessage = message;

saflokMessage.setExpiration(expiryDate,expiryTime);
saflokMessage.setRoom(room);
saflokMessage.calculateLrc();

var messageBuffer = new Buffer(saflokMessage.buildRequestMsg(), 'hex');
console.log(messageBuffer.toString('ascii'));
console.log(messageBuffer.toString('hex'));

var client = new net.Socket();
client.connect(PORT, HOST, function() {

    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    // Write a message to the socket as soon as the client is connected, the server will receive it as message from the client 
    client.write(messageBuffer);

});

client.on('data', function(data) {
    
    console.log('DATA: ' + data);
    // Close the client socket completely
    client.destroy();
    
});

// Add a 'close' event handler for the client socket
client.on('close', function() {
    console.log('Connection closed');
});
//callback(error);

};

module.exports = {
        'sendSaflokKey': sendSaflokKey        
    };



