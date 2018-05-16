var fs = require('fs')
var dbo = require('./nDbo')
var jwt = require('jwt-simple')
var moment = require('moment')


const connectDB = (callback) => {
  dbo.connect("mongodb://localhost:27017", 'nodeDB', callback)
}

const myMiddleWare = {
  verifyToken: (req, res, next) => {
    //中间件总是执行两次，其中有一次没带上我的数据，所以忽略掉其中一次
    if (req.get('access-control-request-method') == null) {
      console.log(req.originalUrl + ' has been accessed by %s at %s', req.ip, moment(Date.now()).format('YYYY-MM-DD HH:mm'))
      if (req.originalUrl != '/user/gettoken') {
        var token = req.get('token')
        let tokenContainedInfo
        try {
          tokenContainedInfo = jwt.decode(token, 'whatistoken')
        } catch (e) {
          console.log('token wrong!')
          return res.sendStatus(401)
        }
        req.tokenContainedInfo = tokenContainedInfo
      }
    }
    next()
  },
}

const user = {
  getToken: (req, res) => {
    var user = req.body.username
    var pw = req.body.password
    if (user == null || pw == null)
      return res.sendStatus(415)
    if (user == 'bayi' && pw == 'laoye') {
      var token = jwt.encode({
        admin: false
      }, 'whatistoken');
      res.json(token)
    } else if (user == 'superbayi' && pw == 'laoye') {
      var token = jwt.encode({
        admin: true
      }, 'whatistoken');
      res.json(token)
    } else
      return res.sendStatus(401)
  },
  add: () => {},
  delete: () => {},
}

const task = {
  add: (req, res) => {
    var newNodeTask = req.body.newNodeTask
    if (newNodeTask == null)
      return res.sendStatus(415)

    //todo: verify validity of newNodeTask
    var {
      pluginList,
      ipRange,
      nodeTaskId
    } = newNodeTask
    let stringIp = ''
    for (var ip of ipRange) {
      stringIp = stringIp + ip + '\n'
    }
    fs.writeFileSync('./targets/' + nodeTaskId, stringIp)
    delete newNodeTask.ipRange

    delete newNodeTask.pluginList
    for (var plugin of pluginList) {
      var task = {
        ...newNodeTask,
        plugin,
        zmap: 0,
        syncStatus: 0,
      }
      dbo.task.add(task, (err, rest) => {
        if (err)
          res.sendStatus(500)
      })
    }
    res.sendStatus(200)

  },
  delete: (req, res) => {
    var nodeTaskId = req.body.nodeTaskId
    if (nodeTaskId == null)
      return res.sendStatus(415)
    dbo.task.del(nodeTaskId, (err, rest) => {
      err ? res.sendStatus(500) : res.sendStatus(200)
    })
  },
  get: (req, res) => {
    var condition = req.body.condition
    if (condition == null)
      condition = {}
    dbo.task.get(condition, (err, result) => {
      err ? res.sendStatus(500) : res.json(result)
    })
  },
  syncStatus: (req, res) => {
    var {
      taskId,
      status
    } = req.body
    if (taskId == null || status == null)
      return res.sendStatus(415)
    var update = {
      operStatus: status,
      implStatus: 0
    }
    dbo.task.update(taskId, update, (err, rest) => {
      err ? res.sendStatus(500) : res.sendStatus(200)
    })
  },
  syncTask: (req, res) => {
    dbo.task.get_unSync_tasks((err, result) => {
      if (err)
        res.sendStatus(500)
      else {
        res.json(result)
        dbo.task.mark_sync((err, result) => {
          console.log(err)
        })
      }
    })
  },
}

const uploadDir = './uploadPlugins/'
const plugin = {
  add: (req, res) => {
    var file = req.file
    try {
      fs.renameSync(uploadDir + file.filename, uploadDir + file.originalname)
    } catch (e) {
      console.log(e)
      return res.sendStatus(500)
    }
    res.sendStatus(200)
  },
  delete: (req, res) => {
    var pluginName = req.body.pluginName
    if (pluginName == null)
      return res.sendStatus(415)
    fs.unlink(uploadDir + '/' + pluginName, (err, rest) => {
      err ? res.sendStatus(500) : res.sendStatus(200)
    })
  },
  ifHave: () => {},
  get: (req, res) => {
    let plugins
    try {
      plugins = fs.readdirSync(uploadDir)
    } catch (e) {
      return res.sendStatus(500)
    }
    res.json(plugins)
  },
  uploadDir
}

const setting = {
  add: (req, res) => {
    var key = req.body.key
    var value = req.body.value
    if (key == null || value == null)
      return res.sendStatus(415)
    dbo.setting.add(key, value, (err, rest) => {
      err ? res.sendStatus(500) : res.sendStatus(200)
    })
  },
  delete: (req, res) => {
    var key = req.body.key
    if (key == null)
      return res.sendStatus(415)
    dbo.setting.del(key, (err, rest) => {
      err ? res.sendStatus(500) : res.sendStatus(200)
    })
  },
  update: (req, res) => {
    var key = req.body.key
    var value = req.body.value
    if (key == null || value == null)
      return res.sendStatus(415)
    dbo.setting.update(key, value, (err, rest) => {
      err ? res.sendStatus(500) : res.sendStatus(200)
    })
  },
  get: (req, res) => {
    dbo.setting.get((err, result) => {
      err ? res.sendStatus(500) : res.json(result)
    })
  },
}


module.exports = {
  myMiddleWare,
  user,
  task,
  plugin,
  setting,
  connectDB,

}