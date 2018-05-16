# -*- coding:utf-8 -*-

import os
import json
import datetime
import sys
import threading
from time import sleep

default_encoding = 'utf-8'
if sys.getdefaultencoding() != default_encoding:
    reload(sys)
    sys.setdefaultencoding(default_encoding)


class multiThread(object):
    '''
    ### 多线程来处理循环中的异步函数
    - 参数说明：
     - max_thread_count:最大线程数
     - thread_func：包含线程要执行的代码（不涉及到共享资源的代码）的函数
     - thread_func_access_lock:包含线程要执行的代码（涉及到共享资源的代码）的函数,该函数的第一个参数保留给thread_func的返回的结果
    '''

    def __init__(self, max_thread_count, thread_func, thread_func_access_lock):
        self.maxThread = max_thread_count
        self.threadCount = 0
        self.threadFull = False
        self.runFunc = thread_func
        self.thread_func_access_lock = thread_func_access_lock
        self.lock = threading.Lock()
        # 线程队列，每个队列容量为1,所以用true和false判断队列能否使用
        # 队列的另外一个参数用来记录当前队列执行进度（外部传入函数执行的参数元组）
        self.queue = []
        for i in range(0, self.maxThread):
            q = {}
            q['available'] = True
            q['params'] = ()
            q['index'] = None
            self.queue.append(q)

    #返回线程目前正执行的传递进来的参数
    def getAllThreadParams(self):
        self.lock.acquire()
        result=[]
        for item in self.queue:
            result.append(item["params"])
        self.lock.release()
        return result
    #返回线程目前正执行的传递进来的index
    def getAllThreadIndex(self):
        self.lock.acquire()
        result=[]
        for item in self.queue:
            if item["index"]!=None:
                result.append(item["index"])
        self.lock.release()
        return result
    def dispatch(self, args_runFunc,args_lock,index):
        '''
        - summary 多线程任务分发
        - 参数说明：
         - args_runFunc：thread_func函数的参数元组
         - args_lock：thread_func_access_lock函数的参数元组
        '''

        def threadFunc(queueIndex, args_runFunc,args_lock,index):
            self.queue[queueIndex]['params'] = args_runFunc
            self.queue[queueIndex]['index'] = index
            r = self.runFunc(*args_runFunc)  # 执行函数
            # print str(args_runFunc) + '退出了'
            self.lock.acquire()
            self.thread_func_access_lock(r,*args_lock)
            self.threadCount = self.threadCount - 1  # 退出时，线程数量-1
            self.threadFull = False  # 退出了一个，线程肯定不满了
            # 退出时设置队列可用，执行进度记录一下
            self.queue[queueIndex]['available'] = True

            self.lock.release()

        # 线程个数+1,如果个数与最大个数相等，说明满了。
        self.threadCount = self.threadCount + 1
        if self.threadCount == self.maxThread:
            self.threadFull = True
        while self.threadFull:
            sleep(0.5)
        # 取得空队列
        queueIndex = None
        while queueIndex == None:
            for i in range(0, self.maxThread):
                if self.queue[i]['available']:
                    queueIndex = i
                    break
        # 新建一个线程加入队列,由于队列并不需要了解哪个线程加入队列，只要将队列设置成false表示当前队列不可用即可。
        self.queue[queueIndex]['available'] = False
        # 将队列index传给线程，使得它可以在线程退出时设置当前队列执行到哪里
        t = threading.Thread(
            target=threadFunc, args=(queueIndex, args_runFunc,args_lock,index))
        t.start()


if __name__ == '__main__':
    #例子
    def scan(x, y):
        # print '我是' + str(x) + ',' + str(y)
        # pass
        sleep(3.01 / (y + 1))
        return x + y

    def record(r,f,i,y):
        line=str(i)+','+str(y)+":"+str(r)+'\n'
        f.writelines(line)
        f.flush()

    dp = multiThread(5, scan, record)
    f = open('aaaa.txt', 'a')
    for i in range(0, 10):        
        for y in range(0, 10):
            while dp.threadFull:
                sleep(0.1)
            dp.dispatch((i, y),(f,i,y),(i,y))
        if i==8:
            print dp.getAllThreadIndex()
    sleep(3)
    f.close()
    print "ok"
