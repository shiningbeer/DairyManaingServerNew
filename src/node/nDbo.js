var mongo = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectId
var dbo

const TABLES = {
    user:'user',
    task: 'task',
    setting:'setting'
}


//connect
var connect = (url, dbname, callback) => {
    mongo.connect(url, (err, db) => {
        dbo = db.db(dbname)
        callback(err)
    })
}

/* basic crub operation */
var insert = (col, insobj, callback) => {
    dbo.collection(col).insertOne(insobj, (err, rest) => {
        callback(err)
    })
}

var del = (col, wherestr, callback) => {
    dbo.collection(col).deleteOne(wherestr, (err, rest) => {
        callback(err)

    })
}

var mod = (col, wherestr, updatestr, callback) => {
    dbo.collection(col).updateOne(wherestr, updatestr, (err, rest) => {
        callback(err)

    })
}

var find = (col, wherestr = {}, callback) => {
    dbo.collection(col).find(wherestr).toArray((err, result) => {
        callback(err, result)
    });
}



/* exposed database api */
//task
var task={
    add : (newNodeTask, callback) => {
        insert(TABLES.task, newNodeTask, callback)
    },
    del : (taskId, callback) => {
        var _id=ObjectId(taskId)
        var wherestr = {
            _id: _id
        }
        del(TABLES.task, wherestr, callback)
    },
    update: (taskId, update,callback) => {
        var _id=ObjectId(taskId)
        var wherestr = {
            _id: _id
        }
        var updatestr = {
            $set: update
        }
        mod(TABLES.task, wherestr, updatestr,callback)
    },    
    get :(wherestr,callback)=>{
        find(TABLES.task,wherestr,callback)
    }
}

var setting={
    get:(callback)=>{
        find(TABLES.setting,{},callback)
    },
    update:(key,value,callback)=>{
        var wherestr = {
            key: key
        }
        var updatestr = {
            $set:{value:value}
        }
        mod(TABLES.setting, wherestr, updatestr,callback)
    },
    add:(key,value,callback)=>{
        var doAdd=async () => {           
            var isKeyCanbeAdd = await new Promise((resolve, reject) => {
                var wherestr={key:key}

                find(TABLES.setting,wherestr,(err,result)=>{
                    if(err)
                        resolve(false)
                    else if(result.length!=0)
                        resolve(false)
                    else
                        resolve(true)
                })
            });
            if(isKeyCanbeAdd){
                var newSetting={
                    key:key,
                    value:value,
                }
                insert(TABLES.setting, newSetting, callback)
            }
            else{
                callback(true)
            }
        }
        doAdd()
        
    },
    del:(key,callback)=>{
        var wherestr={
            key:key
        }
        del(TABLES.setting,wherestr,callback)
    },
}


module.exports = {
    connect,
    task,
    setting,
}