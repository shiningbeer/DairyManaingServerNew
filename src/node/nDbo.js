var mongo = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectId
var dbo

const TABLES = {
    user: 'user',
    task: 'task',
    workingTask: 'workingTask',
    setting: 'setting'
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
        callback(err, rest)
    })
}

var del = (col, wherestr, callback) => {
    dbo.collection(col).deleteMany(wherestr, (err, rest) => {
        callback(err, rest)

    })
}

var mod = (col, wherestr, updatestr, callback) => {
    dbo.collection(col).updateMany(wherestr, updatestr, (err, rest) => {
        callback(err, rest)

    })
}

var find = (col, wherestr = {}, callback) => {
    dbo.collection(col).find(wherestr).toArray((err, result) => {
        callback(err, result)
    });
}



/* exposed database api */
//task
var task = {
    add: (newNodeTask, callback) => {
        insert(TABLES.task, newNodeTask, callback)
    },
    del: (taskId, callback) => {
        var wherestr = {
            nodeTaskId: taskId
        }
        del(TABLES.task, wherestr, callback)
    },
    update: (taskId, update, callback) => {
        var wherestr = {
            nodeTaskId: taskId
        }
        var updatestr = {
            $set: update
        }
        mod(TABLES.task, wherestr, updatestr, callback)
    },
    get: (wherestr, callback) => {
        find(TABLES.task, wherestr, callback)
    },
    get_unSync_tasks: (callback) => {
        var wherestr = {
            syncStatus: 0
        }
        find(TABLES.task, wherestr, callback)
    },
    mark_sync: (callback) => {
        var wherestr = {
            syncStatus: 0
        }
        var updatestr = {
            $set: {
                syncStatus: 1
            }
        }
        mod(TABLES.task, wherestr, updatestr, callback)
    }
}
var workingtask = {
    add: (newWorkingTask, callback) => {
        insert(TABLES.workingTask, newWorkingTask, callback)
    },
    del: (taskId, callback) => {
        var wherestr = {
            nodeTaskId: taskId
        }
        del(TABLES.workingTask, wherestr, callback)
    },
    update: (taskId, update, callback) => {
        var wherestr = {
            nodeTaskId: taskId
        }
        var updatestr = {
            $set: update
        }
        mod(TABLES.workingTask, wherestr, updatestr, callback)
    },
    get: (wherestr, callback) => {
        find(TABLES.workingTask, wherestr, callback)
    }
}

var setting = {
    get: (callback) => {
        find(TABLES.setting, {}, callback)
    },
    update: (key, value, callback) => {
        var wherestr = {
            key: key
        }
        var updatestr = {
            $set: {
                value: value
            }
        }
        mod(TABLES.setting, wherestr, updatestr, callback)
    },
    add: (key, value, callback) => {
        var doAdd = async () => {
            var isKeyCanbeAdd = await new Promise((resolve, reject) => {
                var wherestr = {
                    key: key
                }

                find(TABLES.setting, wherestr, (err, result) => {
                    if (err)
                        resolve(false)
                    else if (result.length != 0)
                        resolve(false)
                    else
                        resolve(true)
                })
            });
            if (isKeyCanbeAdd) {
                var newSetting = {
                    key: key,
                    value: value,
                }
                insert(TABLES.setting, newSetting, callback)
            } else {
                callback(true)
            }
        }
        doAdd()

    },
    del: (key, callback) => {
        var wherestr = {
            key: key
        }
        del(TABLES.setting, wherestr, callback)
    },
}


module.exports = {
    connect,
    task,
    setting,
}