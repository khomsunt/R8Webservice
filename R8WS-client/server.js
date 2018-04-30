

// Server 1
var axios = require('axios');
var io = require("socket.io").listen(8200); // This is the Server for SERVER 1
var other_server = require("socket.io-client")('http://203.157.177.7:8100'); // This is a client connecting to the SERVER 2
var hospcode= '05555';
var hosptype= 'hospital';




var fs = require('fs');
var path = require('path');
var a_file = [];

updateCheck({receiver:'',name:''});


function crawl(dir){
    var files = fs.readdirSync(dir);
    for (var x in files){
        var next = path.join(dir,files[x]);
        if (fs.lstatSync(next).isDirectory()==true){
            crawl(next);
        }else{
            var stats = fs.statSync(next);
            a_file.push([next.replace(__dirname,''),stats.mtime]);
        }
    }
}

function base64_decode(base64str, file) {
    var bitmap = new Buffer(base64str, 'base64');
    fs.writeFileSync(file, bitmap);
    console.log('******** File created from base64 encoded string ********');
}

function updateCheck(data){
    a_file.length=0;
    crawl(__dirname);
    other_server.emit("newFileRequestCenter", { receiver:data.receiver, request: a_file, sender: { hospcode: hospcode, username: data.name}});
}

function dataGetData(data){
    console.log('dataGetData');
    console.log(data);
    var check = false;
    if (data.receiver.hospcode.lenght == undefined && data.receiver.hosptype.lenght == undefined) {
        check = true;
    } else {
        if (data.receiver.hospcode.indexOf(hospcode) > -1 || data.receiver.hosptype.indexOf(hosptype) > -1 ) {
            check = true;
        }
    }

    if (check == true) {
        axios.get(`http://localhost:3000/api/iotests?filter[where][name]=${data.request}`)
          .then(response => {
            console.log('dataGetData');
            console.log(data);
            other_server.emit('dataResponseCenter', { receiver: data.sender, data: JSON.stringify(response.data), sender: hospcode });
        })
        .catch(err => console.log(err));
    }
}

function queryGetData(data){
    console.log('queryGetData');
    console.log(data);
    var check = false;
    if (data.receiver.hospcode.lenght == undefined && data.receiver.hosptype.lenght == undefined) {
        check = true;
    } else {
        if (data.receiver.hospcode.indexOf(hospcode) > -1 || data.receiver.hosptype.indexOf(hosptype) > -1 ) {
            check = true;
        }
    }

    if (check == true) {
        axios.get(`http://localhost:3000/api/iotests?filter[where][name]=${data.request}`)
          .then(response => {
            console.log('queryGetData');
            console.log(data);
            other_server.emit('queryResponseCenter', { receiver: data.sender, data: JSON.stringify(response.data), sender: hospcode });
        })
        .catch(err => console.log(err));
    }
}

other_server.on("connect",function(){

    other_server.on('dataRequestBranch',function(data){
        console.log('dataRequestBranch - -- - - - - - - -');
        dataGetData(data);
    });

    other_server.on('queryRequestBranch',function(data){
        console.log('queryRequestBranch - -- - - - - - - -');
        queryGetData(data);
    });

    other_server.on("updateRequestBranch",function(data){
        console.log("updateRequestBranch");
        updateCheck({receiver:'',name:''});
    });


    other_server.on(`dataResponseBranch_${hospcode}`, function(data){
        console.log(`dataResponseBranch_${hospcode}`);
        console.log(data);
        console.log(`dataResponse_${data.receiver.username}`);
        io.to('client').emit(`dataResponse_${data.receiver.username}`, data);

    });

    other_server.on(`queryResponseBranch_${hospcode}`, function(data){
        console.log(`queryResponseBranch_${hospcode}`);
        console.log(data);
        console.log(`queryResponse_${data.receiver.username}`);
        io.to('client').emit(`queryResponse_${data.receiver.username}`, data);

    });

    other_server.on(`updateResponseBranch_${hospcode}`, function(data){
        console.log(`updateResponseBranch_${hospcode}`);
        console.log(data);
        console.log(`updateResponse_${data.receiver.username}`);
        io.to('client').emit(`updateResponse_${data.receiver.username}`, data);

    });

    other_server.on(`newFileResponseBranch_${hospcode}`,function(data){
        for(var x in data){
            console.log(data[x][0]);
            other_server.emit("downloadRequestCenter", { receiver:"", request: data[x], sender: { hospcode: hospcode }});
        }
        other_server.emit("updateResponseCenter", { receiver:"", request: {}, sender: { hospcode: hospcode }});
    });

    other_server.on(`downloadResponseBranch_${hospcode}`,function(data){
        console.log(data);
        base64_decode(data.response.content,"."+data.response.file);
    });

});

io.sockets.on("connection",function(socket){
    socket.join('client');
    console.log('User-Client' + socket.id);

    socket.on('setUsername', function(data) {
        if (users.indexOf(data) > -1) {
          socket.emit('userExits',data+ 'มีผู้ใช้ชื่อนี้แล้ว กรุณาใส่ชื่อใหม่')
        }else{
          users.push(data);
          socket.emit('userSet',{username: data})
        }
    })

    socket.on("dataRequest",function(data){
        other_server.emit("dataRequestCenter", { receiver:data.receiver, request: data.data, sender: { hospcode: hospcode, username: data.name}});
        console.log("dataRequestCenter");
        console.log(data);
    });

    socket.on("queryRequest",function(data){
        other_server.emit("queryRequestCenter", { receiver:data.receiver, request: data.data, sender: { hospcode: hospcode, username: data.name}});
        console.log("queryRequestCenter");
        console.log(data);
    });

    socket.on("updateRequest",function(data){
        other_server.emit("updateRequestCenter", { receiver:data.receiver, request: data.data, sender: { hospcode: hospcode, username: data.name}});
        console.log("updateRequestCenter");
        console.log(data);
    });

    socket.on("sendUpdateCheck",function(data){
        updateCheck(data);
    });

});