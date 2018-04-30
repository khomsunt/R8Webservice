// Server 2
var config = require("config");
var io = require("socket.io").listen(config.get("app.ioPort"));
var fs = require('fs');
var path = require('path');
var upath = require('upath');
var dateFormat = require('dateformat');
var a_file = [];
var server1_source = __dirname+"/server1";
var server1_source_exclude_dir = ['/config'];
var server1_source_exclude_file = ['.DS_Store','default.json'];
var server1_source_exclude_extension = [];

console.log("Server starting at port "+config.get("app.ioPort"));

function crawl(dir){
    var files = fs.readdirSync(dir);
    for (var x in files){
        var next = path.join(dir,files[x]);
		var ext = path.extname(next);
		var filename = path.basename(next);

        if (fs.lstatSync(next).isDirectory()==true){
        	if (server1_source_exclude_dir.indexOf(next)>-1){
        	}else{
            	crawl(next);
        	}
        }else{
        	if (server1_source_exclude_extension.indexOf(ext)>-1){
        	}else{
        		if (server1_source_exclude_file.indexOf(filename)>-1){
        		}else{
            		var stats = fs.statSync(next);
            		a_file.push([next.replace(server1_source,''),stats.mtime]);
            	}
        	}
        }
    }
}

function base64_encode(file) {
    var bitmap = fs.readFileSync(file);
    return new Buffer(bitmap).toString('base64');
}

function addData(data){
    axios.request({
        method:'post',
        url:'http://localhost:3000/api/iotests',
        data: data
    }).then(response => {
       
    }).catch(err => console.log(err));
}


io.sockets.on("connection",function(socket){
    // Display a connected message
    console.log("Server-Client Connected! "+socket.id);
    //socket.emit("clientRegisterBranch",{});
    // Get Question from Client
    socket.on("dataRequestCenter",function(data){
    	console.log("dataRequestCenter");
    	console.log(data);
        socket.emit("dataRequestBranch",data);
    });

    socket.on("queryRequestCenter",function(data){
        console.log("queryRequestCenter");
        console.log(data);
        socket.emit("queryRequestBranch",data);
    });
    socket.on("updateRequestCenter",function(data){
        console.log("updateRequestCenter");
        console.log(data);
        socket.emit("updateRequestBranch",data);
    });

    // Get Ask from Client
    socket.on("dataResponseCenter", function(data){
    	console.log("dataResponseCenter");
    	console.log(data);
        socket.emit(`dataResponseBranch_${data.receiver.hospcode}`, data);
    });

    socket.on("queryResponseCenter", function(data){
        console.log("queryResponseCenter");
        console.log(data);
        addData(data);
        socket.emit(`queryResponseBranch_${data.receiver.hospcode}`,data);
    });

    socket.on("updateResponseCenter", function(data){
        console.log("updateResponseCenter");
        console.log(data);
        socket.emit(`updateResponseBranch_${data.receiver.hospcode}`,data);
    });

    socket.on("serverMessage", function(data){
        console.log("serverMessage");
        console.log(data);
        socket.emit("message", { receiver:data.receiver, request: data.data, sender: { hospcode: 'SERVER', username: data.name}});
    });

 	socket.on("username",function(data){
        console.log(data);
    });

    socket.on("updateRequest",function(data){
        console.log("updateRequest");
        socket.emit("updateRequestBranch",{});
    });

    socket.on("newFileRequestCenter",function(data){
//console.log(data);
        var a_return=[];
        a_file.length=0;
        crawl(server1_source);
        for (var y in a_file){
            var have=false;
            for (var x in data.request){
                var clientFileName=upath.normalizeSafe(data.request[x][0]);
//                console.log(clientFileName);
                if (a_file[y][0]==clientFileName){
                    have=true;
//console.log(dateFormat(a_file[y][1],"isoDateTime")+" : "+dateFormat(data.request[x][1],"isoDateTime"));

                    if (dateFormat(a_file[y][1],"isoDateTime")>dateFormat(data.request[x][1],"isoDateTime")){
                        a_return.push(a_file[y]);
                    }
                    data.request.splice(x,1);
                    break;
                }
            }
            if (have===false){
                a_return.push(a_file[y]);
            }
        }
console.log(a_return);
    	socket.emit(`newFileResponseBranch_${data.sender.hospcode}`, a_return);
    });

    socket.on("downloadRequestCenter",function(data){
    	var requestFile = path.join(server1_source,data.request[0]);
    	var contentFile = base64_encode(requestFile);
    	socket.emit(`downloadResponseBranch_${data.sender.hospcode}`, {response: {file: data.request[0], content: contentFile }});
    	console.log(data.request[0]);
    });
    
});