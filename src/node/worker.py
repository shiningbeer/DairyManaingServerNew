# -*- coding:utf-8 -*-

import os
import json
import datetime
import sys
import threading
from dao import daoNodeManager as dbo
import logging
from time import sleep
from multiThread import multiThread
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
thread_count=5
record_step=2*thread_count
def recordResult(result,tableName):
    if result!=None:
        dbo.saveResult(tableName,result)
def work(printed):
    task = dbo.get_one_task_to_execute()
    r = u'目前无可执行任务。'
    # 如果无任务，打印信息，定时下一次执行
    if task == None:
        if printed != r:
            logging.info(r)
            printed = r
        timer = threading.Timer(task_inteval,work, (printed,))
        timer.start()
        return
    # 如果有任务
    id=task['id']
    nodetaskid=task['nodeTaskId']
    plugin=task['plugin']['name']
    plugin = plugin[0:len(plugin) - 3]
    ipTotal=task['ipTotal']
    r = u'任务'+id+u'未找到插件:'+plugin
    try:
        exec("from plugins import " + plugin + " as scanning_plugin")
    # 如果未找到插件(执行exec出错)，则打印信息，定时下一次执行
    except:
        if printed != r:
            logging.info(r)
            printed = r
        dbo.modi_implStatus_by_id(id,-1,'can\'t find plugin')
        timer = threading.Timer(task_inteval,work, (printed,))
        timer.start()
        return

    if os.path.exists('zr/'+id):
        logging.info(u'执行任务'+id)
        dp=multiThread(thread_count,scanning_plugin.scan,recordResult)
        index=0   
        stepCounter=0
        resumeIndex=dbo.get_progress(id)        
        for line in  open('zr/'+id, 'r'):       
            line=line.strip()
            #寻找到上次的进度        
            index=index+1
            if index<=resumeIndex:
                continue
            #分派任务给线程        
            dp.dispatch((line,),(nodetaskid,),index)
            stepCounter=stepCounter+1
            #每扫描record_step个记录一次进度
            if stepCounter==record_step:
                r=dp.getAllThreadIndex()#获取每个线程执行到哪
                #取得最小
                least=r[0]
                for item in r:                    
                    if item<least:
                        least=item
                dbo.record_progress(id,least)
                print least
                stepCounter=0
            #查看任务指令是否变化
            newImpl=dbo.get_new_operStatus(id)
            if newImpl!=1:
                #记录执行进度
                r=dp.getAllThreadIndex()
                if r!=None:
                    least=r[0]
                    for item in r:                    
                        if item<least:
                            least=item
                    dbo.record_progress(id,least)
                #定时下次执行
                timer = threading.Timer(task_inteval, work,('',))
                timer.start()
                #退出本次执行
                return

         #修改状态为完成
        dbo.modi_implStatus_by_id(id,1,'')
        dbo.record_progress(id,ipTotal)
        # 完成一个后，直接执行下一个
        timer = threading.Timer(0, work,('',))
        timer.start()
    else:
        logging.info(u'出错')
        #修改Status为出错，errMsg为can't find zmap result  
        dbo.modi_implStatus_by_id(id,-1,'can\'t find zmap result!')
        timer = threading.Timer(task_inteval,work, (printed,))
        timer.start()
    

def doWork():
    timer = threading.Timer(0, work,('',))
    timer.start()


if __name__ == '__main__':
    doWork()
