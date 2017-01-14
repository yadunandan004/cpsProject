'use strict';
const fs=require('fs');
var bStop={};
var blines={};
//readFiles();

let readFiles = (bpath)=>{
  //let bpath='/Users/yadu/Documents/CPS project/20140304';
  let files=fs.readdirSync(bpath);
  //console.log(files);
  let i=1;
  while (i<files.length)
  {
        let busline='';
        let bus='';
        //console.log(files[i]);
        fileParse(files[i],bpath)
        .then((data)=>{
          //console.log(data);
           busline=data.busline;
           bus=data.bus;
          return checkbusLine(busline,bus);         
        })
        .then((index)=>{
          console.log(index);
          if(index === -1)
          {
            return writeBusline(busline,bus);
          }
          else
          {
            //resolve(1);
          }

        })
        .then((status)=>{
          if(status === 1)
          {
            console.log('file written: '+i);
             //resolve(1);
          }
                  
        })
        .catch((err)=>{
          reject(err);
        })
        i++;
  }
  return;
  //console.log(blines);
}

let writeBusline = (bpath,busline,bus)=>{
  //let bpath='/Users/yadu/Documents/CPS project/buslines/';
  return new Promise((resolve,reject)=>{
      let ws= fs.createWriteStream(bpath+busline,{'flags': 'a'});
      //console.log(bus);
        ws.on('finish',  ()=> {
          //console.log('file has been written');
          resolve(1);
        });
        ws.on('error',(err)=>{
          reject(err);
        })
        ws.write(bus+'\n');
        ws.end();
  });
}
let checkbusLine = (bpath,busline,bus)=>{
  //let bpath='/Users/yadu/Documents/CPS project/buslines/';
  let status=fileCheck(busline);
  //console.log(status);
      return new Promise((resolve,reject)=>{
        let index;
        if(status==1)
        {
          //console.log(bus);
          let rs=fs.createReadStream(bpath+busline,{encoding: 'utf8'});
            rs.on('data',(chunk)=>{
                  index=chunk.indexOf(bus);
                  if(index !== -1)
                  {
                    rs.close();
                  }
            })
            .on('close',()=>{
                resolve(index);
            });
        }
        else
        {
          resolve(-1);
        }
    });
}

let getFiles = (bpath,bus)=>{
  let files=fs.readdirSync(bpath);
  let i=0;
  let res = [];
  while(i<files.length)
  {
    for(let j=0;j<bus.length;j++)
    {
      
      //console.log(files[i].includes(bus[j]));
      if(bus[j] !== '')
      {
        if(files[i].includes(bus[j]))
        {
            res.push(files[i]);
        }
      }
    }
    i++;
  }
  return res;
}

let fileCheck = (buspath,busline)=>{
      //let buspath='/Users/yadu/Documents/CPS project/buslines';
      let files=fs.readdirSync(buspath);
      for (let j=0;j<files.length;j++)
      {
        
        if(files[j]===busline)
        {
          return 1;
        }
      }
      return 0;
}

let Parseline1 = (file,bpath)=>{
return new Promise((resolve,reject)=>{
        let readStream=fs.createReadStream(bpath+'/'+file,{encoding: 'utf8'});
      var acc = '';
      var pos = 0;
      var index;
      readStream
        .on('data', function (chunk) {
          index = chunk.indexOf('\n');
          acc += chunk;
          index !== -1 ? readStream.close() : pos += chunk.length;
        })
        .on('close', function () {
          let line=acc.slice(0, pos + index);
          let re= new RegExp(/(\w+)\,(\w+)/);
          let businfo=re.exec(line.toString());
          if(RegExp.$1!=='' && RegExp.$2 !== '')
          {
            
            resolve({
            bus:RegExp.$1,
            busline:RegExp.$2
            });
          }
        })
        .on('error', function (err) {
          reject(err);
        })
})
}

let checkValue = (arr,obj,dist)=>{
  //console.log(arr.length);
  if(arr.length !== 0)
  {
    for(let i=arr.length - 1; i >= 0; i--)
    {
      if((arr[i].lat === obj.lat)&&(arr[i].lng === obj.lng))
      {
        //console.log(obj);
        return {status: -3};
      }
      else{
        let d = parseInt(getDistanceFromLatLonInMts(arr[i].lat,arr[i].lng,obj.lat,obj.lng));
        if(d <= dist)
        {
          if(obj.speed < arr[i].speed)
          {
            return {status: -2,index:i};
          }
          else
          {
            return {status: -3};
          }
        }
        else if(d >= 400000)
        {
          return {status: -3};
        }
      } 
    }
  }
  else
  {
    return {status:-1};
  }
  return {status:-1};
}

/*request('https://www.mapquestapi.com/directions/v2/route?key=ANkHXLtYty28GbtVVaZIwk6UgQWfSCXc&from=Denver%2C+CO&to=Boulder%2C+CO&outFormat=json&ambiguities=ignore&routeType=fastest&doReverseGeocode=false&enhancedNarrative=false&avoidTimedConditions=false', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body); // Print the google web page.
  }
})*/

let parseData = (file,data)=>{
  if(bStop[data]==undefined)
  {
    bStop[data]=[];
  }
  else
  {
    bStop[data].push(file);
  }
  
}
let getBuses = (file) =>{
    let data = fs.readFileSync(file,'utf8');
    return data.split('\n');
}
let getDistanceFromLatLonInMts = (lat1,lon1,lat2,lon2)=>{
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d*1000;
}

let deg2rad = (deg)=>{
  return deg * (Math.PI/180)
}

module.exports = {
  fs,
  getDistanceFromLatLonInMts,
  Parseline1,
  getFiles,
  checkValue,
  getBuses
}