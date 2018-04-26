var mongo = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectId
var dbo


const TABLES = {
    user:'user',
    task: 'task',
    node:'node',
    target:'target',
    plugin:'plugin',
    nodeTask:'nodeTask'
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
        callback(err,rest)
    })
}

var del = (col, wherestr, callback) => {
    dbo.collection(col).deleteMany(wherestr, (err, rest) => {
        callback(err,rest)

    })
}

var mod = (col, wherestr, updatestr, callback) => {
    dbo.collection(col).updateMany(wherestr, updatestr, (err, rest) => {
        callback(err,rest)

    })
}

var find = (col, wherestr = {}, callback) => {
    dbo.collection(col).find(wherestr).toArray((err, result) => {
        callback(err, result)
    });

}
var findOne = (col, wherestr = {}, callback) => {
    dbo.collection(col).find(wherestr).toArray((err, result) => {
       result.length>0?callback(err, result[0]):callback(err,null)
        
    });
}

/* exposed database api */


//user
var user={
    add : (newUser, callback) => {
        insert(TABLES.user, newUser, callback)
    },
    del : (userId, callback) => {
        var _id=ObjectId(userId)
        var wherestr = {
            _id: _id
        }
        del(TABLES.user, wherestr, callback)
    },
    update: (userId,update,callback) => {
        var _id=ObjectId(userId)
        var wherestr = {
            _id: _id
        }
        var updatestr = {
            $set: update
        }
        mod(TABLES.user, wherestr, updatestr,callback)
    },
    get :(wherestr,callback)=>{
        find(TABLES.user,wherestr,callback)
    }
}


//task
var task={
    add : (newtask, callback) => {
        insert(TABLES.task, newtask, callback)
    },
    del: (taskId, callback) => {
        var _id=ObjectId(taskId)
        var wherestr = {
            _id: _id
        }
        del(TABLES.task, wherestr, callback)
    },
    update_by_taskId: (taskId,update,callback) => {
        var _id=ObjectId(taskId)
        var wherestr = {
            _id: _id
        }
        var updatestr = {
            $set: update
        }
        mod(TABLES.task, wherestr, updatestr,callback)
    },
   
    get:(condition,callback)=>{
        find(TABLES.task,condition,callback)
    },

    getOne:(id,callback)=>{
        var _id=ObjectId(id)
        var wherestr = {
            _id: _id
        }
        findOne(TABLES.task,wherestr,callback)
    },
    


}

//node
var node={
    add : (newNode, callback) => {
        insert(TABLES.node, newNode, callback)
    },
    del: (nodeId, callback) => {
        var _id=ObjectId(nodeId)
        var wherestr = {
            _id: _id
        }
        del(TABLES.node, wherestr, callback)
    },
    update_anything_by_nodeId : (nodeId,update,callback) => {
        var _id=ObjectId(nodeId)
        var wherestr = {
            _id: _id
        }
        var updatestr = {
            $set: update
        }
        mod(TABLES.node, wherestr, updatestr,callback)
    },
    get :(wherestr,callback)=>{
        find(TABLES.node,wherestr,callback)
    },
    getOne:(id,callback)=>{
        var _id=ObjectId(id)
        var wherestr = {
            _id: _id
        }
        findOne(TABLES.node,wherestr,callback)
    }

}
//plugin
var plugin={
    add : (newplugin, callback) => {
        insert(TABLES.plugin, newplugin, callback)
    },
    del_by_name : (name, callback) => {
        var wherestr = {name}
        del(TABLES.plugin, wherestr, callback)
    },
    update_by_name : (name,update,callback) => {
        var wherestr = {name}
        var updatestr = {
            $set: update
        }
        mod(TABLES.plugin, wherestr, updatestr,callback)
    },
    get :(wherestr,callback)=>{
        find(TABLES.plugin,wherestr,callback)
    },

    getOne_by_name:(name,callback)=>{
        var wherestr = {name:name}
        findOne(TABLES.plugin,wherestr,callback)
    }
}
//target
var target={
    add : (newTarget, callback) => {
        insert(TABLES.target, newTarget, callback)
    },
    del : (targetId, callback) => {
        var _id=ObjectId(targetId)
        var wherestr = {
            _id: _id
        }
        del(TABLES.target, wherestr, callback)
    },
    update : (targetId,update,callback) => {
        var _id=ObjectId(targetId)
        var wherestr = {
            _id: _id
        }
        var updatestr = {
            $set: update
        }
        mod(TABLES.target, wherestr, updatestr,callback)
    },
    get :(wherestr,callback)=>{
        find(TABLES.target,wherestr,callback)
    },
    getOne:(id,callback)=>{
        var _id=ObjectId(id)
        var wherestr = {
            _id: _id
        }
        findOne(TABLES.target,wherestr,callback)
    }
}

//nodeTask
var nodeTask={
    add : (newNodeTask, callback) => {
        insert(TABLES.nodeTask, newNodeTask, callback)
    },
    del_by_nodeTaskId : (nodeTaskId, callback) => {
        var _id=ObjectId(nodeTaskId)
        var wherestr = {
            _id: _id
        }
        del(TABLES.nodeTask, wherestr, callback)
    },
    del_by_taskId:(taskId,callback)=>{
        var wherestr = {
            taskId: taskId
        }
        del(TABLES.nodeTask, wherestr, callback)
    },
    update_by_taskId  : (taskId,update,callback) => {
        var wherestr = {taskId}
        var updatestr = {
            $set: update
        }
        mod(TABLES.nodeTask, wherestr, updatestr,callback)
    },
    update_by_nodeTaskId  : (nodeTaskId,update,callback) => {
        var _id=ObjectId(nodeTaskId)
        var wherestr = {
            _id: _id
        }
        var updatestr = {
            $set: update
        }
        mod(TABLES.nodeTask, wherestr, updatestr,callback)
    },
    get :(wherestr,callback)=>{
        find(TABLES.nodeTask,wherestr,callback)
    }
}




module.exports = {
    connect,
    task,
    node,
    target,
    user,
    nodeTask,
    plugin
}