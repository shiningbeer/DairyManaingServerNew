# -*- coding:utf-8 -*-

import os
import json
import datetime
import sys
import threading
from dao import daoNodeManager as dbo
import logging
from IPy import IP
from time import sleep
# 设置默认的level为DEBUG
# 设置log的格式
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(message)s"
)

default_encoding = 'utf-8'
if sys.getdefaultencoding() != default_encoding:
    reload(sys)
    sys.setdefaultencoding(default_encoding)


dbo=dbo()
task_inteval=3
def zmapwork(printed):

    task = dbo.get_one_task_to_zmap()
    r = u'目前无可执行任务。'
    # 如果无任务，打印信息，定时下一次执行
    if task == None:
        if printed != r:
            logging.info(r)
            printed = r
        timer = threading.Timer(
            task_inteval,zmapwork, (printed,))
        timer.start()
        return
    # 如果有任务
    id=task['id']
    nodeTaskId=task['nodeTaskId']
    plugin=task['plugin']
    port=plugin['port']
    if os.path.exists('targets/'+nodeTaskId):
        logging.info(u'执行zmap任务'+id)
        #调用zmap,扫描白名单为path，端口为port
        os.system('zmap -p '+port+' -B 1M -w ./targets/'+nodeTaskId+' -q -o ./zr/'+id)
        #完成后修改zmap为1
        dbo.modi_zmap_by_id(id,1)
        #读出结果数量，存入总数
        count=0
        for line in  open('zr/'+id, 'r'): 
            count=count+1
        dbo.modi_ipTotal_by_id(id,count)
    else:
        logging.info(u'出错')
        #修改Status为出错，errMsg为can't find target
    # 完成一个后，直接执行下一个
    timer = threading.Timer(0, zmapwork,('',))
    timer.start()

def doZmap():
    timer = threading.Timer(0, zmapwork,('',))
    timer.start()


if __name__ == '__main__':
    doZmap()
