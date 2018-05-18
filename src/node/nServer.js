var express = require('express')
var bodypaser = require('body-parser')
var multer = require('multer')
const {
  myMiddleWare,
  user,
  task,
  setting,
  plugin,
  connectDB
} = require('./nFunctions')



var app = express()
app.use(bodypaser.urlencoded({
  extended: false
}))
app.use(bodypaser.json())

app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Headers", "token,content-type,productId,X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", ' 3.2.1')
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

var upload = multer({
  dest: plugin.uploadDir
})


app.use(myMiddleWare.verifyToken)


app.post('/user/gettoken', user.getToken)
app.post('/user/add', user.add)
app.post('/user/delete', user.delete)


app.post('/task/add', task.add)
app.post('/task/delete', task.delete)
app.post('/task/get', task.get)
app.post('/task/getResult', task.getResult)
app.post('/task/syncStatus', task.syncStatus)
app.post('/task/syncTask', task.syncTask)


app.post('/plugin/add', upload.single('file'), plugin.add)
app.post('/plugin/delete', plugin.delete)
app.post('/plugin/get', plugin.get)
app.post('/plugin/ifHave', plugin.ifHave)

app.post('/setting/add', setting.add)
app.post('/setting/delete', setting.delete)
app.post('/setting/update', setting.update)
app.post('/setting/get', setting.get)


//start server at localhost on the designated port
var server = app.listen(1911, function () {
  // var host = server.address().address
  // var port = server.address().port
  connectDB((err) => {
    err ? console.log('db connection fail!') : console.log('node server starts!')
  })

})