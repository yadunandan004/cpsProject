'use strict';
//M3963 with 2 count

module.exports = {
	busStops:function(h,req,data,fn){
let buspath = '/Users/yadu/Documents/CPS project/20140304/';
let busLine = '/Users/yadu/Documents/CPS project/buslines/';
let allLines = h.fs.readdirSync(busLine);
//console.log(allLines);
let bline = data.busline;
let prefCount = data.count || 6;
let prefSpeed = data.speed || 5;
let prefDistance = data.dist || 20;
let arr1 = [];
function readallLines()
{
	for(let f=0;f<allLines.length;f++)
	{
		let res = JSON.stringify(readoneLine(allLines[f]));
		//console.log(res);
		h.fs.appendFileSync(busLine + allLines[f],"\n\n"+res+"\n"); 
	}
}


function readoneLine(line)
{
	let arr1 =[];
	let busArr = h.getBuses(busLine + line);
	let files = h.getFiles(buspath,busArr);
	arr1 = predictStops(files);
	console.log(arr1);
	return arr1;
}


//readallLines();
var key='AIzaSyA0J_QkAGmnl3LEGK3zljIXo924jqz4csQ';

let mpres =[];
function request(lat,lng){
	//make ajax call here
	let coord = ''+lng+','+lat+'';
	//console.log(coord);
	req('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+coord+'&sensor=true&key='+key+'&rankby=distance&types=bus_station',(err,res,body)=>{
		if(!err && res.statusCode == 200){
			let fres = JSON.parse(body).results[0];
			//console.log(body);
			let dis = h.getDistanceFromLatLonInMts(fres.geometry.location.lat,fres.geometry.location.lng,lng,lat);
			it.next({loc:fres.geometry.location,name:fres.name,distance:dis,org:{lat:lng,lng:lat}});
			//console.log(mpres);
		}
	})
}
function *gen(){
	for(let i=0; i<arr1.length ;i++)
	{
		var result = yield request(arr1[i].lat,arr1[i].lng);
		mpres.push(result);
	}
	console.log(mpres);
	fn({res:arr1,mres:mpres});
}

function predictStops(files){
	var arr=[];
	var arr1=[];
	for(let i=0;i<files.length;i++)
	{
		let contents = h.fs.readFileSync(buspath + files[i],'utf8');
		let re = RegExp();
		let values = contents.match(/\d+\.\d+/g);
		let timestmp = contents.match(/\d+\:\d+\:\d+/g);
		let busnames = contents.match(/\w+/)[0].toString();
		//console.log(values);
		let k=0;
		for(let j=0;j<values.length;j+=3)
		{
			if(parseInt(values[j+2]) <= prefSpeed)
			{			
				let obj = {lat:parseFloat(values[j]),lng:parseFloat(values[j+1]),speed:parseFloat(values[j+2]),count:0,time:{busnames:[new Date("March 04,2014 "+timestmp[k])]},mean:{},bus:busnames};			
				let res = h.checkValue(arr,obj,prefDistance);
				if((obj.lat !== 0)&&(obj.lng !== 0))		//res.status -1:add to array -2:replace item in array 'arr'
				{
					if(res.status === -1){
						obj.count+=1;
						arr.push(obj);
						//buses[busnames]["arr"].push(busInfo);
						//console.log(arr);
					}
					else if(res.status === -2)			
					{
						//console.log(res.index);
						obj.count=arr[res.index].count+1;
						//console.log(obj.count);
						if(obj.count >= prefCount)
						{
							let fres=h.checkValue(arr1,obj,prefDistance);			//	res.status -1:add to array -2:replace item in array 'arr1'
							if(fres.status === -1)
							{
								//let prevTime = buses[busnames]["arr"][res.index].time;
								//let prevMean = buses[busnames]["arr"][res.index].mean;
								if(arr[res.index].bus === obj.bus)
								{
									if(obj.time < arr[res.index].time)
									{
										obj.mean = (arr[res.index].mean + (arr[res.index].time - obj.time))/2;

									}else{
										obj.mean = (arr[res.index].mean + (obj.time - arr[res.index].time))/2;
									}
								}
								else
								{
									obj.mean = arr[res.index].mean;
								}
								arr1.push(obj);
							}
							else if(fres.status === -2)
							{
								if(arr[res.index].bus === obj.bus)
								{
									if(obj.time < arr[res.index].time)
									{
										obj.mean = (arr[res.index].mean + (arr[res.index].time - obj.time))/2;
										//console.log(arr[res.index].time - obj.time);
									}else{
										obj.mean = (arr[res.index].mean + (obj.time - arr[res.index].time))/2;
										//console.log(obj.time - arr[res.index].time);
									}
								}
								else
								{
									obj.mean = arr[res.index].mean;
								}
								
								arr1.splice(fres.index,1);
								arr1.splice(fres.index,0,obj);								
							}
						}

						if(arr[res.index].bus === obj.bus)
						{
							if(obj.time < arr[res.index].time)
							{
								obj.mean  = (arr[res.index].mean + (arr[res.index].time - obj.time))/2;

							}else{
								obj.mean = (arr[res.index].mean + (obj.time - arr[res.index].time))/2;
							}
						}
						else
						{
							obj.mean = arr[res.index].mean;
						}

						arr.splice(res.index,1);
						arr.splice(res.index,0,obj);

					}
				}
			}
			k++;		
		}

	}
	//console.log("array 1:"+ arr1);
	return arr1;
}


function convertTime(arr1)
{
	for(let i=0;i<arr1.length;i++)
	{
		arr1[i].mean = arr1[i].mean/3600000;
	}
}

function findAllStops(line){
	let allStps ={};
	let busArr = h.getBuses(busLine + line);
	let files = h.getFiles(buspath,busArr);
	for(let i=0;i<files.length;i++)
	{
		//console.log(files[i]);
		allStps[files[i]]=scheduleStops(files[i]);
	}
	console.log(allStps);
}
function scheduleStops(bus){
	let stops={};
	for(let j=0;j<arr1.length;j++)
	{	
		let lt = arr1[j].lat;
		let ln =arr1[j].lng;
		let temp = findSchedule(bus,{lat:lt,lng:ln});
		if(temp.length != 0)
		{
			stops[lt+","+ln] = temp;
		}
		
	}
	return stops;
}

function findSchedule(bus,stop){
	let bstop =[];
	let contents = h.fs.readFileSync(buspath + bus,'utf8');
	let values = contents.match(/\d+\.\d+/g);
	let timestmp = contents.match(/\d+\:\d+\:\d+/g);
	let k=0;
	for(let i=0; i<values.length;i+=3)
	{
		let dis = h.getDistanceFromLatLonInMts(stop.lat,stop.lng,parseFloat(values[i]),parseFloat(values[i+1]));
		if((dis<=20) && (parseInt(values[i+2]) === 0))
		{
			bstop.push(timestmp[k]);
		}
		k++;
	}
	return bstop;
}
//console.log(arr1);

arr1 = readoneLine(bline);
findAllStops(bline);
var it = gen();
it.next();


//console.log(parseInt(h.getDistanceFromLatLonInMts(114.043999,22.623501,114.036003,22.6308)));

//console.log('No of Loosely aggregated BusStops:\t'+arr.length);
//console.log('No of Strictly aggregated BusStops:\t'+arr1.length);
//console.log('Final proposed Bustops are \n');
//console.log(arr1);



	}
}

/*req({method:'GET',uri:encodeURI('http://api.map.baidu.com/getscript?v=1.3&ak=2c982c5fc73ed90826c793a2dc4d288a&services=&t=20150527115231')},(err,res,body)=>{
	//if(!err && res.statusCode == 200)
	//{
		var options =	{	url:url,
                                features: {
                                            FetchExternalResources  : {script:'', img:'', input:'', link:''},
                                            ProcessExternalResources: {script:'',img:'',link:'',input:''},
                                            removeScript: true //Remove scripts for innerHTML and outerHTML output
                                }
            };

		console.log('Baidu Map API result:'+body);
		 window = dom(body,null,options);
		 document = window.document;
		 
		 }
	//}
})*/





