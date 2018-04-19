

//IP转成整型
function _ip2int(ip) 
{
  var num = 0;
  ip = ip.split(".");
  num = Number(ip[0]) * 256 * 256 * 256 + Number(ip[1]) * 256 * 256 + Number(ip[2]) * 256 + Number(ip[3]);
  num = num >>> 0;
  return num;
}
//整型解析为IP地址
function _int2iP(num) 
{
  var str;
  var tt = new Array();
  tt[0] = (num >>> 24) >>> 0;
  tt[1] = ((num << 8) >>> 24) >>> 0;
  tt[2] = (num << 16) >>> 24;
  tt[3] = (num << 24) >>> 24;
  str = String(tt[0]) + "." + String(tt[1]) + "." + String(tt[2]) + "." + String(tt[3]);
  return str;
}
const ipDispatch=(list_IpRange, splitNum)=>{
    //总数
    let totalsum = 0
    //每个ipRange切分后的列表
    let splitted_list_of_each_range = []

    //对于列表中每一个ip段
    for(let iprange of list_IpRange){
        //获取头尾ip
        let split = iprange.split('-')
        let ipstart = split[0]
        let ipend = split[1]

        //获取头尾的整数
        let intStart = _ip2int(ipstart)
        let intEnd = _ip2int(ipend)

        //获取该ip段数量，并加入总数
        let sum = intEnd - intStart + 1
        totalsum = totalsum + sum

        // 整除结果和余数
        let eachVolume = parseInt(sum / splitNum)  // 平均每份多少
        let left = sum % splitNum  // 多出来多少

        let dispatch_result_for_this_ipRange = []
        let laststart = intStart

        // 分配思路简单粗暴，平均分，余数给最后一个
        // 除了最后一个，前面的全拿平均数
        for(let i=0;i<splitNum - 1;i++){
            let eachPiece = {
                count: eachVolume,
                range:_int2iP(intStart + i * eachVolume) + '-' + _int2iP(intStart + (i + 1) * eachVolume - 1)
            }

            dispatch_result_for_this_ipRange.push(eachPiece)
            // 更新最后一个开始的数字
            laststart = intStart + (i + 1) * eachVolume - 1 + 1
        }
        // 剩下的全归最后一个
        let lastPiece = {
            count:intEnd - laststart + 1,
            range:_int2iP(laststart) + "-" +_int2iP(intEnd)
        }

        // 这一个ipRange
        dispatch_result_for_this_ipRange.push(lastPiece)
        // 把这一个加入总的
        splitted_list_of_each_range.push(dispatch_result_for_this_ipRange)
    }

    // 循环过后获得一个总表，现在要把每个list的第1项汇成一个list，第2项汇成一个list,...第splitNum项汇成一个list
    let dispatchList = []
    // 对于从0到splitNum的n
    for(let i=0;i<splitNum;i++){
        let onelistResult = []
        let onelistSum=0
        // 把每个表的第n项加入进来
        for(let onelist of splitted_list_of_each_range){
            onelistSum=onelistSum+onelist[i].count
            onelistResult.push(onelist[i].range)
        }

        // 加入总表
        dispatchList.push({count:onelistSum,range:onelistResult})
    }
    return {totalsum, dispatchList}

}

module.exports = {
    ipDispatch
}

// let a = '192.68.1.1-192.68.1.16'
// let b = '192.68.1.1-192.68.2.255'
// let list_test = []
// list_test.push(a)
// list_test.push(b)

// console.log(ipDispatch(list_test, 10))
// console.log(13%10)