'use strict';
const express = require('express');
const path = require('path');
const app = express();
const server = require('http').Server(app);
const bus = require('./busStop');
const router =  express.Router();
const h = require('./helper');
const req = require('request');

app.set('port',process.env.port||3000);
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname,'public')));
app.use('/',router);
const io = require('socket.io')(server);

io.on('connection',function(socket){
	socket.on('busline',(data)=>{
		bus.busStops(h,req,data,function(data){	
			socket.emit('data',{geo:data.res,fin:data.mres});
		})
	})
});
router.get('/',(req,res,next)=>{
	res.render('index',{host:"http://localhost:3000"});
})
server.listen(app.get('port'),function(){
	console.log('Server running on port'+app.get('port'));
})
