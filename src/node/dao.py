# -*- coding:utf-8 -*-
from abc import ABCMeta, abstractmethod
from pymongo import MongoClient as mc
from bson import ObjectId
import pymongo
import datetime
import sys

default_encoding = 'utf-8'
if sys.getdefaultencoding() != default_encoding:
    reload(sys)
    sys.setdefaultencoding(default_encoding)

# operStatus = {"删除": -1, "执行": 1, "暂停": 2, "完成": 3}
# implStatus={"出错": -1, "正常":0,"完成":1}
# zmap={"未完成":0,"完成":1}

class daoNodeManager(object):
    # 构造时连接数据库
    def __init__(self):
        self.client = mc()
        self.db = self.client.nodeDB

    def get_one_task_to_zmap(self):
        coll = self.db.task
        cur = coll.find({'operStatus':1,'zmap':0,'implStatus':0})
        tks = []
        for d in cur:
            d['id'] = d['_id'].__str__()
            d.pop('_id')
            tks.append(d)
        if len(tks)==0:
            return None
        return tks[0]
    def get_one_task_to_execute(self):
        coll = self.db.task
        cur = coll.find({'operStatus':1,'zmap':1,'implStatus':0})
        tks = []
        for d in cur:
            d['id'] = d['_id'].__str__()
            d.pop('_id')
            tks.append(d)
        if len(tks)==0:
            return None
        return tks[0]
    def modi_zmap_by_id(self,task_id,zmapStatus):
        coll = self.db.task
        oid = ObjectId(task_id)
        return coll.update_many({'_id':oid}, {"$set": {'zmap': zmapStatus}})
    def modi_implStatus_by_id(self,task_id,implStatus,errMsg):
        coll = self.db.task
        oid = ObjectId(task_id)
        return coll.update({'_id':oid}, {"$set": {'implStatus': implStatus,'errMsg':errMsg,'syncStatus':0}})
    
    def modi_ipTotal_by_id(self,task_id,ipTotal):
        coll = self.db.task
        oid = ObjectId(task_id)
        return coll.update({'_id':oid}, {"$set": {'ipTotal': ipTotal,'syncStatus':0}})
    def record_progress(self,task_id,progress):
        coll = self.db.task
        oid = ObjectId(task_id)
        return coll.update({'_id':oid}, {"$set": {'progress': progress,'syncStatus':0}})
    
    def get_new_operStatus(self,task_id):
        coll = self.db.task
        oid = ObjectId(task_id)
        return coll.find_one({'_id':oid})['operStatus']
    def get_progress(self,task_id):
        coll = self.db.task
        oid = ObjectId(task_id)
        return coll.find_one({'_id':oid})['progress']
    


    def resetZmap(self):
        coll = self.db.task
        return coll.update_many({}, {"$set": {'zmap': 0}})
    def resetSync(self):
        coll = self.db.task
        return coll.update_many({}, {"$set": {'syncStatus': 0}})
    def resetImplStatus(self):
        coll = self.db.task
        return coll.update_many({}, {"$set": {'implStatus': 0}})
    def resetProgress(self):
        coll = self.db.task
        return coll.update_many({}, {"$set": {'progress': 0}})

class daoResult(object):
    # 构造时连接数据库
    def __init__(self):
        self.client = mc()
        self.db = self.client.result
    def saveOne(self,tableName,document):
        coll=self.db[tableName]
        coll.insert_one(document)
if __name__ == '__main__':
    dbo=daoNodeManager()
    # dbo.resetZmap()
    
    print dbo.resetSync()
    print dbo.resetProgress()
    print dbo.resetImplStatus()
    
    # dbo.resetImplStatus()
    # print dbo.modi_implStatus_by_id('5af50f76f24c937566dac586',0,'')
    # dbo=daoResult()
    # dbo.saveOne('haha',{'11':'11'})
    

#     def addNewTask(self, name, user, description, ipfiles, plugin):
#         coll = self.db.scanningTasks
#         newtask = {}
#         newtask[const.taskName] = name
#         newtask[const.user] = user
#         newtask[const.description] = description
#         newtask[const.ipFiles] = ipfiles
#         newtask[const.plugin] = plugin
#         newtask[const.pubTime] = datetime.datetime.today()
#         newtask[const.startTime] = None
#         newtask[const.endTime] = None
#         newtask[const.ipTotal] = None
#         newtask[const.ipFinished] = 0
#         newtask[const.status] = statusOptions['未开始']
#         return coll.insert_one(newtask)

#     def findTask_by_taskID(self, task_id):
#         coll = self.db.scanningTasks
#         oid = ObjectId(task_id)
#         return coll.find_one({const.o_id: oid})

#     def delTask_by_taskID(self, task_id):
#         coll = self.db.scanningTasks
#         oid = ObjectId(task_id)
#         return coll.remove({const.o_id: oid})

#     def modiTask_ipTotal_by_taskID(self, task_id, ipTotal):
#         coll = self.db.scanningTasks
#         oid = ObjectId(task_id)
#         return coll.update({const.o_id: oid}, {"$set": {const.ipTotal: ipTotal}})

#     def modiTask_status_by_taskID(self, task_id, status):
#         coll = self.db.scanningTasks
#         oid = ObjectId(task_id)
#         return coll.update({const.o_id: oid}, {"$set": {const.status: status}})

#     def modiTask_ipFinished_by_taskID(self, task_id, ipFinished):
#         coll = self.db.scanningTasks
#         oid = ObjectId(task_id)
#         return coll.update({const.o_id: oid}, {"$set": {const.ipFinished: ipFinished}})

#     def modiTask_startTime_by_taskID(self, task_id, startTime):
#         coll = self.db.scanningTasks
#         oid = ObjectId(task_id)
#         return coll.update({const.o_id: oid}, {"$set": {const.startTime: startTime}})

#     def modiTask_endTime_by_taskID(self, task_id, endTime):
#         coll = self.db.scanningTasks
#         oid = ObjectId(task_id)
#         return coll.update({const.o_id: oid}, {"$set": {const.endTime: endTime}})


# #--------nodes表操作--------------

#     def getAllNodes(self):
#         coll = self.db.nodes
#         cur = coll.find()
#         nodes = []
#         for d in cur:
#             d.pop(const.o_id)
#             nodes.append(d)
#         return nodes

#     def getOneNode_by_nodeID(self, nodeID):
#         coll = self.db.nodes
#         return coll.find_one({const.id: nodeID})

#     def addNode(self, nodeID):
#         coll = self.db.nodes
#         node = {}
#         node[const.id] = nodeID
#         node[const.pulseTime] = datetime.datetime.now()
#         node[const.ipLeft] = 0
#         return coll.insert_one(node)

#     def delNode_by_nodeID(self, nodeID):
#         coll = self.db.nodes
#         return coll.remove({const.id: nodeID})

#     def modiNode_pulse_by_nodeID(self, nodeID):
#         coll = self.db.nodes
#         pulsetime = datetime.datetime.now()
#         return coll.update({const.id: nodeID}, {"$set": {const.pulseTime: pulsetime}})

#     def modiNode_ipLeft_by_nodeID(self, nodeID, ipLeft):
#         coll = self.db.nodes
#         return coll.update({const.id: nodeID}, {"$set": {const.ipLeft: ipLeft}})

#     def modiNode_status_by_nodeID(self, nodeID, nodeStatus):
#         coll = self.db.nodes
#         return coll.update({const.id: nodeID}, {"$set": {const.status: nodeStatus}})


# #--------nodeTasks表操作--------------
#     def getNodeTasks_all_by_nodeID(self, nodeid):
#         coll = self.db.nodeTasks
#         cur = coll.find({const.nodeId: nodeid})
#         nodeTasks = []
#         for d in cur:
#             d[const.id] = d[const.o_id].__str__()
#             d.pop(const.o_id)
#             nodeTasks.append(d)
#         return nodeTasks

#     def getNodeTasks_all_by_taskID(self, task_id):
#         coll = self.db.nodeTasks
#         cur = coll.find({const.taskId: task_id})
#         nodeTasks = []
#         for d in cur:
#             d[const.id] = d[const.o_id].__str__()
#             d.pop(const.o_id)
#             nodeTasks.append(d)
#         return nodeTasks

#     def getNodeTasks_unfetched_by_nodeID(self, nodeID):
#         coll = self.db.nodeTasks
#         cur = coll.find(
#             {const.nodeId: nodeID, const.status: statusOptions['未开始'], const.instruction: instructionOptions['执行']})
#         nodeTasks = []
#         for d in cur:
#             d[const.id] = d[const.o_id].__str__()
#             d.pop(const.o_id)
#             nodeTasks.append(d)
#         return nodeTasks

#     def getNodeTasks_instructionChanged_by_nodeID(self, nodeID):
#         coll = self.db.nodeTasks
#         cur = coll.find(
#             {const.nodeId: nodeID, const.instructionChanged: True})
#         nodeTasks = []
#         for d in cur:
#             d[const.id] = d[const.o_id].__str__()
#             d.pop(const.o_id)
#             nodeTasks.append(d)
#         return nodeTasks

#     def addNodeTask(self, taskId, taskName, nodeId, ipRange, plugin, ipTotal):
#         coll = self.db.nodeTasks
#         nodeTask = {}
#         nodeTask[const.taskId] = taskId
#         nodeTask[const.taskName] = taskName
#         nodeTask[const.nodeId] = nodeId
#         nodeTask[const.ipRange] = ipRange
#         nodeTask[const.plugin] = plugin
#         nodeTask[const.ipTotal] = ipTotal
#         nodeTask[const.startTime] = datetime.datetime.now()
#         nodeTask[const.endTime] = None
#         nodeTask[const.ipFinished] = 0
#         nodeTask[const.status] = statusOptions['未开始']
#         nodeTask[const.instruction] = instructionOptions['执行']
#         nodeTask[const.instructionChanged] = False
#         return coll.insert_one(nodeTask)

#     def delNodeTask_status_is_deleted_by_nodeId(self, nodeid):
#         coll = self.db.nodeTasks
#         return coll.remove({const.instruction: instructionOptions['删除'], const.nodeId: nodeid})

#     def modiNodeTask_status_by_nodeTaskID(self, nodeTaskID, status):
#         coll = self.db.nodeTasks
#         oid = ObjectId(nodeTaskID)
#         return coll.update({const.o_id: oid}, {"$set": {const.status: status}})

#     def modiNodeTask_status_by_nodeID(self, nodeID, status):
#         coll = self.db.nodeTasks
#         return coll.update_many({const.nodeId: nodeID}, {"$set": {const.status: status}})

#     def modiNodeTask_ipFinished_by_nodeTaskID(self, nodeTaskID, ipFinished):
#         coll = self.db.nodeTasks
#         oid = ObjectId(nodeTaskID)
#         return coll.update({const.o_id: oid}, {"$set": {const.ipFinished: ipFinished}})

#     def modiNodeTask_endTime_by_nodeTaskID(self, nodeTaskID, endtime):
#         coll = self.db.nodeTasks
#         oid = ObjectId(nodeTaskID)
#         return coll.update({const.o_id: oid}, {"$set": {const.endTime: endtime}})

#     def modiNodeTask_instruction_by_taskID(self, taskID, instruction):
#         coll = self.db.nodeTasks
#         return coll.update_many({const.taskId: taskID}, {"$set": {const.instruction: instruction}})

#     def modiNodeTask_instructionChanged_by_nodeID(self, nodeID, instructionChanged):
#         coll = self.db.nodeTasks
#         return coll.update_many({const.nodeId: nodeID}, {"$set": {const.instructionChanged: instructionChanged}})

#     def modiNodeTask_instructionChanged_by_taskID(self, taskID, instructionChanged):
#         coll = self.db.nodeTasks
#         return coll.update_many({const.taskId: taskID}, {"$set": {const.instructionChanged: instructionChanged}})
