var moment = require( 'moment')
var dbo = require('./serverdbo')
var nodeApi=require('./nodeApi')
var jwt=require('jwt-simple')
var fs = require('fs')

const OPER_STATUS = {
    new: 0,
    complete:1,
    implement: 2,
    paused:-1,
  }
const IMPL_STATUS={
  wrong:-1,
  complete:1,
  normal:0
}

const SYNC_STATUS={
    ok:0,
    not_received:-1,
    not_sync:1
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
              tokenContainedInfo=jwt.decode(token,'secrettt')    
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
    add:(req, res) => {
        var newUser = req.body.newUser
        if (newUser == null)
        return res.sendStatus(415)
        let newUserToAdd={
        ...newUser,
        taskCount:0,
        lastLoginAt: Date.now(),
        lastLoginIp:'21.34.56.78'
        }
        //todo: verify validity of newUser
        dbo.user.add(newUserToAdd, (err,rest) => {
        err ? res.sendStatus(500) : res.json('ok')
        })
    },
    delete: (req, res) => {
        var id = req.body.userId
        if (id == null) 
        return res.sendStatus(415)
        dbo.user.del(id, (err,rest) => {
        err ? res.sendStatus(500) : res.json('ok')
        })
    },
    modpw: (req, res) => {
        var id = req.body.userId
        var pw=req.body.pw
        if (id == null||pw==null) 
        return res.sendStatus(415)
        dbo.user.update(id,{password:pw}, (err,rest) => {
        err ? res.sendStatus(500) : res.sendStatus(200)
        })
    },
    getToken:(req,res)=>{
        var user=req.body.userName
        var pw=req.body.password
        if(user==null||pw==null)
        return res.sendStatus(415)
        dbo.user.get({name:user,password:pw},(err,result)=>{
        if(err)
            res.sendStatus(500)
        else{
            if(result.length<1)
            res.sendStatus(401)
            else{
            let userInfo=result[0]
            let token=jwt.encode({user:userInfo.name,type:userInfo.authority},'secrettt')        
            res.send({
                status: 'ok',
                type:'account',
                currentAuthority: userInfo.authority,
                currentUser:userInfo.name,
                token:token
            })
            }
        }
        })
    },
    get:(req, res) => {
        var condition = req.body.condition
        if (condition == null)
        condition={}
        dbo.user.get(condition,(err,result)=>{
        err ? res.sendStatus(500) : res.json(result)
        })
    },
}
  


const changeTaskStatus=async (req,res,newOperStatus)=>{
    var {taskId} = req.body
    if (taskId == null)
        return res.sendStatus(415)
    //更新nodetask的status
    await new Promise((resolve, reject) => {
        dbo.nodeTask.update_by_taskId(taskId,{operStatus:newOperStatus},(err,result)=>{
            resolve(err)
        })
    });
    //获得这个任务的所有nodetask
    var nodetasks = await new Promise((resolve, reject) => {
        dbo.nodeTask.get({taskId},(err,result)=>{
            resolve(result)
        })
    });
    //与节点同步任务状态 
    let allOK=true
    for(var nodetask of nodetasks){
        //取出节点信息
        var nodeInfo = await new Promise((resolve, reject) => {
            dbo.node.getOne(nodetask.node._id,(err,result)=>{
                resolve(result)
            })
        });
        //访问节点，同步任务状态
        var syncCode = await new Promise((resolve, reject) => {
            nodeApi.nodeTask.syncStatus(nodeInfo.url,nodeInfo.token,nodetask._id,newOperStatus,(code,body)=>{
                resolve(code)
            })
        });
        let implStatus=syncCode==200?IMPL_STATUS.normal:IMPL_STATUS.wrong
        let syncStatus=syncCode==200?SYNC_STATUS.ok:SYNC_STATUS.not_sync
        console.log(syncCode)
        if(syncCode!=200)
            allOK=false
        dbo.nodeTask.update_by_nodeTaskId(nodetask._id,{syncStatus,implStatus},(err,rest)=>{})

    }
    //最后更新task的status
    let implStatus=allOK?IMPL_STATUS.normal:IMPL_STATUS.wrong
    dbo.task.update_by_taskId(taskId,{operStatus:newOperStatus,implStatus},(err,rest)=>{
      err ? res.sendStatus(500) : res.json('ok')
    })
}

  const task={
    add: (req, res) => {
      var newTask = req.body.newTask
      if (newTask == null)
        return res.sendStatus(415)
      //todo: verify validity of newtask
      //todo: verify if the plugin designated exists in local disk, if not, return the message 'missing plugin' to the server 
      let newTaskToAdd={
        ...newTask,
        createdAt: Date.now(),
        user:req.tokenContainedInfo.user,
        percent:0,
        operStatus:OPER_STATUS.new,
        implStatus:IMPL_STATUS.normal,
      }
      dbo.task.add(newTaskToAdd, (err,rest) => {
        err ? res.sendStatus(500) : res.json('ok')
      })
    },
    delete:(req, res) => {
      var id = req.body.taskId
      if (id == null) 
        return res.sendStatus(415)
      dbo.task.del(id, (err,rest) => {
        err ? res.sendStatus(500) : res.json('ok')
      })

      //待做：删除相应nodetask，通知节点该任务删除
    },
    start:(req, res) => {
      var task = req.body.task
      var nodes = req.body.nodeList
      if (task == null||nodes==null) 
        return res.sendStatus(415)
    
      var {targetList}=task
      //以下代码假定数据库操作不出问题，未作处理
      var asyncActions=async () => {
        let allIpRange=[]
        //合并所有目标的ip
        for(var target of targetList){
          var iprange = await new Promise((resolve, reject) => {
            dbo.target.getOne(target._id,(err,result)=>{
                resolve(result)
            })
          });
          allIpRange.push(...iprange.ipRange)
        }
        //按节点个数划分ip
        let length=nodes.length
        var {ipDispatch}=require('./ipdispatch')
        const {totalsum,dispatchList}=ipDispatch(allIpRange,length)
        //每个节点分配ip，产生一个nodetask
        let allOK=true
        for(let i=0;i<length;i++){
          const {count,range}=dispatchList[i]
          let newNodeTask={
            taskId:task.id,
            node:nodes[i],
            ipRange:range,
            ipCount:count,
            createdAt:Date.now(),
            operStatus:OPER_STATUS.implement,
            implStatus:IMPL_STATUS.normal,
          }
          //获取这个node的url，token
          var nodeInfo = await new Promise((resolve, reject) => {
            dbo.node.getOne(nodes[i]._id,(err,result)=>{
                resolve(result)
            })
          });
          //保存节点任务，获取这个nodetask的id
          var insertedId = await new Promise((resolve, reject) => {
            dbo.nodeTask.add(newNodeTask,(err,rest)=>{
                resolve(rest.insertedId)
            })
          });
          //以newNodeTask为参数访问node服务器下达任务
          newNodeTask.nodeTaskId=insertedId
          delete newNodeTask.node
          delete newNodeTask._id
          var syncCode = await new Promise((resolve, reject) => {
            nodeApi.nodeTask.add(nodeInfo.url,nodeInfo.token,newNodeTask,(code,body)=>{
                resolve(code)
            })
          });
          //节点返回200则说明同步成功，更新到nodetask，否则为同步失败，即这条任务与节点不一致
          let implStatus=syncCode==200?IMPL_STATUS.normal:IMPL_STATUS.wrong
          let syncStatus=syncCode==200?SYNC_STATUS.ok:SYNC_STATUS.not_received
          if(syncCode!=200)
            allOK=false
          dbo.nodeTask.update_by_nodeTaskId(insertedId,{syncStatus,implStatus},(err,rest)=>{})
    
          //待做：访问节点是否有插件，如果没有则异步发送插件
        }
        //更改任务状态
        let implStatus=allOK?IMPL_STATUS.normal:IMPL_STATUS.wrong
        dbo.task.update_by_taskId(task.id,{startAt:Date.now(),operStatus:OPER_STATUS.implement,implStatus},(err,rest)=>{
          err ? res.sendStatus(500) : res.json('ok')
        })
        
      }
      asyncActions()
    },
    pause:(req, res) => {
        changeTaskStatus(req,res,OPER_STATUS.paused)
    },
    resume:(req, res) => {
        changeTaskStatus(req,res,OPER_STATUS.implement)
    },
    get: (req, res) => {
      var condition = req.body
      if (condition == null)
        condition={}
      dbo.task.get(condition,(err,result)=>{
        err ? res.sendStatus(500) : res.json(result)
      })
    },
  }
  const node={
    add:(req, res) => {
      var newNode = req.body.newNode
      let newNodeToAdd={
        ...newNode,
        user:req.tokenContainedInfo.user,
        ipLeft:0,
        createdAt:Date.now(),
      }
      if (newNode == null)
        return res.sendStatus(415)
      //todo: verify validity of newnode
      dbo.node.add(newNodeToAdd, (err,rest) => {
        err ? res.sendStatus(500) : res.json('ok')
      })
    },
    delete:(req, res) => {
      var id = req.body.nodeId
      if (id == null) 
        return res.sendStatus(415)
      dbo.node.del(id, (err,rest) => {
        err ? res.sendStatus(500) : res.json('ok')
      })
    },
    update: (req, res) => {
      var id =req.body.nodeId
      var update=req.body.update
      if(id==null||update==null)
        return res.sendStatus(415)
      dbo.node.update(id,update,(err,rest)=>{
        err ? res.sendStatus(500) : res.sendStatus(200)
      })
    },
    get: (req, res) => {
      var condition = req.body.condition
      if (condition == null) 
        condition={}
      dbo.node.get(condition,(err,result)=>{
        res.json(result)
      })
    },
  }
  const target={
    add:(req, res) => {
      var newTarget = req.body.newTarget
      if (newTarget == null) 
        return res.sendStatus(415)
      //todo: verify validity of newTarget
      let newTargetToAdd={
        ...newTarget,
        usedCount:8,
        ipTotal:6555,
        createdby:req.tokenContainedInfo.user
      }
      dbo.target.add(newTargetToAdd, (err,rest) => {
        err ? res.sendStatus(500) : res.json('ok')
      })
    },
    delete:(req, res) => {
      var id = req.body.targetId
      if (id == null) 
        return res.sendStatus(415)
      dbo.target.del(id, (err,rest) => {
        err ? res.sendStatus(500) : res.json('ok')
      })
    },
    update:(req, res) => {
      var id =req.body.targetId
      var update=req.body.update
      if(id==null||update==null)
        return res.sendStatus(415)
      dbo.target.update(id,update,(err,rest)=>{
        err ? res.sendStatus(500) : res.sendStatus(200)
      })
    },
    get:(req, res) => {
      var condition = req.body.condition
      if (condition == null) 
        condition={}
      dbo.target.get(condition,(err,result)=>{
        res.json(result)
      })
    },
  }
  const uploadDir='./uploadPlugins/'
  const plugin={
    uploadDir,
    add:(req, res) => {
      var file = req.file
      try{
        fs.renameSync(uploadDir + file.filename, uploadDir + file.originalname)
      }
      catch(e){
        return res.sendStatus(500)
      }
      res.sendStatus(200)
    },
    delete: (req, res) => {
      var pluginName = req.body.pluginName
      if (pluginName == null) 
        return res.sendStatus(415)  
      fs.unlink(uploadDir+'/'+pluginName, (err)=>{
        err ? res.sendStatus(500) : res.json('ok')
      })
    },
    get:(req, res) => {
      let plugins
      try{
        plugins=fs.readdirSync(uploadDir)
      }
      catch(e){
        return res.sendStatus(500)
      }
      
      let result=[]
      for(var item of plugins){
        var oneplugin={
          name:item,
          user:'admin',
          des:'',
          usedCount:8,
          uploadAt: Date.now(),   
        }
        result.push(oneplugin)
      }
      res.json(result)
    },
  }
  const connectDB=(callback)=>{
        dbo.connect("mongodb://localhost:27017", 'cent',callback )
}
  module.exports = {
    myMiddleWare,
    user,
    task,
    node,
    target,
    plugin,
    connectDB,

}