screennode=$'node'
screen -S $screennode -X quit
screen -dmS $screennode
sleep 2s
cmd=$"node ./src/node/nServer.js"
screen -S $screennode -X stuff "$cmd"
screen -S $screennode -X stuff $'\n' 

screennode=$'zmap'
screen -S $screennode -X quit
screen -dmS $screennode
sleep 2s
cmd=$"python ./src/node/zmapFilter.py"
screen -S $screennode -X stuff "$cmd"
screen -S $screennode -X stuff $'\n' 

screennode=$'worker'
screen -S $screennode -X quit
screen -dmS $screennode
sleep 2s
cmd=$"python ./src/node/worker.py"
screen -S $screennode -X stuff "$cmd"
screen -S $screennode -X stuff $'\n' 
