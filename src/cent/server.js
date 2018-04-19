var express = require('express')
var bodypaser = require('body-parser')
var multer = require('multer')
const {myMiddleWare,user,task, node,target,plugin,connectDB}=require('./serverFunctions')



var app = express()
app.use(bodypaser.urlencoded({
  extended: false
}))
app.use(bodypaser.json())
app.use(myMiddleWare.verifyToken)
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Headers", "token,content-type,productId,X-Requested-With");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By",' 3.2.1')
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

var upload = multer({
  dest: plugin.uploadDir
}) 




//user
app.post('/user/add', user.add)
app.post('/user/delete',user.delete)
app.post('/user/modpw',user.modpw)
app.post('/user/gettoken',user.getToken)
app.post('/user/get', user.get)

//task
app.post('/task/add',task.add)
app.post('/task/delete', task.delete)
app.post('/task/start',task.start )
app.post('/task/pause', task.pause)
app.post('/task/resume', task.resume)
app.post('/task/get',task.get)


//node
app.post('/node/add',node.add )
app.post('/node/delete', node.delete)
app.post('/node/update',node.update)
app.post('/node/get',node.get)

//target
app.post('/target/add', target.add)
app.post('/target/delete',target.delete )
app.post('/target/update', target.update)
app.post('/target/get', target.get)

//plugin
app.post('/plugin/add', upload.single('file'),plugin.add )
app.post('/plugin/delete',plugin.delete)
app.post('/plugin/get', plugin.get)



//start server at localhost on the designated port
var server = app.listen(1978, function () {
  // var host = server.address().address
  // var port = server.address().port
  connectDB((err) => {
    err ? console.log('db connection fail!') : console.log('server starts!')
  })

})

