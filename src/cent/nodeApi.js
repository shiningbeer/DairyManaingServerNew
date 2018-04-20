var request = require('request');
var fs = require('fs');

// var getToken=(user,pw, callback)=>{
//     var param = {
//         username:user,
//         password:pw,
//     }
//     postJson(api.auth,param, callback)
// }

var postJson = (url,token,param, callback) => {
    request.post({
        url: url,
        json: true,
        headers: {
            "content-type": "application/json",
            'token':token
        },
        body: param
    }, (error, response, body) => {
        error?callback(600,error):callback(response.statusCode,body)   
    }) 
}

var nodeTask={
    add: (url_base,token,newNodeTask,callback) => {
        postJson(url_base+'/task/add',token,{newNodeTask}, callback)
    },
    syncStatus:(url_base,token,taskid,status,callback) => {
        postJson(url_base+'/task/syncstatus',token,{taskId:taskid,status:status}, callback)
    },
    // del:(id, callback) => {
    //     var param = {
    //         nodeTaskId: id
    //     }
    //     postJson(url_base+'/nodetask/delete', param, callback)
    // },
    // start:(id, callback)=>{
    //     var param = {
    //         nodeTaskId: id
    //     }
    //     postJson(api.nodeTask.start, param, callback)
    // },
    // pause:(id, callback)=>{
    //     var param = {
    //         nodeTaskId: id
    //     }
    //     postJson(api.nodeTask.pause, param, callback)
    // },
    // get:(condition={}, callback)=>{
    //     var param={
    //         condition:condition
    //     }
    //     postJson(api.nodeTask.get, param, callback)
    // }
    
}


// var plugin={
//     add:(file, callback) => {
//         var formData = {
//             file: fs.createReadStream(file),        
//         };
//         request.post({
//             url: api.plugin.add,
//             formData: formData,
//             headers: {
//                 'token':mytoken
//             },
//         }, (error, response, body) => {
//             if(error)
//                 callback(600,'')
//             else
//                 callback(response.statusCode,body)
//         })
//     },
//     del:(pluginName, callback) => {
//         var param = {
//             pluginName: pluginName
//         }
//         postJson(api.plugin.del, param, callback)
//     },
//     get:(callback)=>{
//         postJson(api.plugin.get, {},callback)
//     }
// }

// var setting={
//     add: (key,value,callback) => {
//         console.log(api.setting.add)
//         var param = {
//             key:key,
//             value:value,
//         }
//         postJson(api.setting.add, param, callback)
//     },
//     del:(key, callback) => {
//         var param = {
//             key: key
//         }
//         postJson(api.setting.del, param, callback)
//     },
//     update:(key,value, callback)=>{
//         var param = {
//             key:key,
//             value:value,
//         }
//         postJson(api.setting.update, param, callback)
//     },
//     get:(callback)=>{
//         postJson(api.setting.get, {}, callback)
//     }
// }


var myCallback=(code,body)=>{
    console.log(code)
    console.log(body)
}

// nodeTask.add(newnodeTask,myCallback)
// nodeTask.get({},myCallback)


// setting.add("timespan",60,myCallback)
// setting.del('timespan',myCallback)
// setting.update('threadnum',20,myCallback)
// setting.get(myCallback)

// getToken('superbayi','laoye',myCallback)


module.exports = {
    nodeTask,
}
