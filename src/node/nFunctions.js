var fs = require('fs')
var dbo = require('./nDbo')
var jwt=require('jwt-simple')
var moment=require('moment')


const connectDB=(callback)=>{
    dbo.connect("mongodb://localhost:27017", 'nodeDB',callback )
}

const myMiddleWare={
    verifyToken:(req,res,next)=>{
        //中间件总是执行两次，其中有一次没带上我的数据，所以忽略掉其中一次
        if(req.get('access-control-request-method')==null){
          console.log(req.originalUrl + ' has been accessed by %s at %s',req.ip,moment(Date.now()).format('YYYY-MM-DD HH:mm'))
          if(req.originalUrl!='/user/gettoken'){
            var token=req.get('token')
            let tokenContainedInfo
            try{
              tokenContainedInfo=jwt.decode(token,'whatistoken')    
            }
            catch (e){
              console.log('token wrong!')
              return res.sendStatus(401)
            }
            req.tokenContainedInfo=tokenContainedInfo
          }
        }
        next()
      },
 }

const user={
    getToken:(req,res)=>{
        var user=req.body.username
        var pw=req.body.password
        if(user==null||pw==null)
          return res.sendStatus(415)
        if (user=='bayi'&&pw=='laoye'){
          var token = jwt.encode({admin:false}, 'whatistoken');
          res.json(token)
        }
        else if(user=='superbayi'&&pw=='laoye'){
          var token = jwt.encode({admin:true}, 'whatistoken');
          res.json(token)
        }
        else
          return res.sendStatus(401)
      },
    add:()=>{},
    delete:()=>{},
}

const task={
    add:(req, res) => {
        var newNodeTask = req.body.newNodeTask
        if (newNodeTask == null)
          return res.sendStatus(415)
      
        //todo: verify validity of newNodeTask
      
        dbo.task.add(newNodeTask, (err) => {
          err ? res.sendStatus(500) : res.sendStatus(200)
        })
      },
    delete:(req, res) => {
        var taskId = req.body.taskId
        if (taskId == null) 
          return res.sendStatus(415)  
        dbo.task.del(taskId,(err)=>{
          err ? res.sendStatus(500) : res.sendStatus(200)
        })
      },
    get:(req, res) => {
        var condition = req.body.condition
        if (condition == null)
            condition={}
        dbo.task.get(condition,(err,result)=>{
          err ? res.sendStatus(500) : res.json(result)
        })
      },
    syncStatus: (req, res) => {
        var {taskId,status} = req.body
        if (taskId == null||status==null) 
          return res.sendStatus(415)
        var update={operStatus:status}
        dbo.task.update(taskId,update,(err)=>{
          err ? res.sendStatus(500) : res.sendStatus(200)
        })
      },
}

const uploadDir='./uploadPlugins/'
const plugin={
    add:(req, res) => {
        var file = req.file
        try{
          fs.renameSync(uploadDir + file.filename, uploadDir + file.originalname)
        }
        catch(e){
          console.log(e)
          return res.sendStatus(500)
        }
        res.sendStatus(200)
      },
    delete:(req, res) => {
        var pluginName = req.body.pluginName
        if (pluginName == null) 
          return res.sendStatus(415)  
        fs.unlink(uploadDir+'/'+pluginName, (err)=>{
          err ? res.sendStatus(500) : res.sendStatus(200)
        })
      },
    ifHave:()=>{},
    get:(req, res) => {
        let plugins
        try{
          plugins=fs.readdirSync(uploadDir)
        }
        catch(e){
          return res.sendStatus(500)
        }
        res.json(plugins)
      },
    uploadDir
}

const setting={
    add:(req, res) => {
        var key=req.body.key
        var value=req.body.value
        if (key==null||value==null)
          return res.sendStatus(415)
        dbo.setting.add(key,value, (err) => {
          err ? res.sendStatus(500) : res.sendStatus(200)
        })
      },
    delete:(req, res) => {
        var key=req.body.key
        if (key == null) 
          return res.sendStatus(415)  
        dbo.setting.del(key,(err)=>{
          err ? res.sendStatus(500) : res.sendStatus(200)
        })
      },
    update: (req, res) => {
        var key=req.body.key
        var value=req.body.value
        if (key==null||value==null)
          return res.sendStatus(415)
        dbo.setting.update(key,value,(err)=>{
          err ? res.sendStatus(500) : res.sendStatus(200)
        })
      },
    get:(req, res) => {
        dbo.setting.get((err,result)=>{
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