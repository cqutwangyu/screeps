let spawnName = 'W';
let roles = ['harvester', 'upgrader', 'builder', 'mediator'];
let roleSize = [10, 5, 2, 2];
var creepSize = [0, 0, 0, 0];
//work:100,carry:50,move:50
// let creepBodys = [
//     [WORK, CARRY, MOVE],//200
//     [WORK, WORK, CARRY, MOVE],//300
//     [WORK, WORK, CARRY, CARRY, MOVE],//350
//     [WORK, WORK, CARRY, CARRY, MOVE, MOVE],//400
//     [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE],//450
//     [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE],//550
//     [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],//600
//     [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]//650
// ];
function getRoleSize() {
    return roleSize;
}
function spawnCreep() {
    var maxSize = true;
    for (let index = 0; index < roles.length; index++) {
        var roleList = _.filter(Game.creeps, (creep) => creep.memory.role == roles[index]);
        creepSize[index] = roleList.length;
        if (roleList.length < roleSize[index]) {
            maxSize = false;
        }
    }
    var creepBody = null;
    if (maxSize) {
        creepBody = getCreepBody(Memory.maxEngery)
        // console.log('maxBody:' + creepBody)
    } else {
        creepBody = getCreepBody(Memory.engery1)
        // console.log('minBody:' + creepBody)
    }
    return creepBody;
}

function getCreepBody(engery) {
    if (engery == undefined || engery < 800) {
        return null;
    }
    var creepBody = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
    engery = engery - 800;
    while (engery >= 50) {
        if (engery >= 100) {
            creepBody.push(WORK);
            engery = engery - 100;
        } else {
            creepBody.push(CARRY);
            engery = engery - 50;
        }
    }
    return creepBody;
}

var creepsFactory = {
    run: function () {
        var logInfo = '';
        var spawnFlag = true;
        var printFlag = true;
        for (let index = 0; index < roles.length; index++) {
            var roleName = roles[index];
            var creepBody = spawnCreep();
            logInfo = logInfo + roleName;
            // if (creepBody == creepBodys[0] && Memory.engery1 < 200) {
            //     spawnFlag = false;
            // }
            // if () {
            if (creepSize[index] < roleSize[index]) {
                var create = spawnFlag
                var spawnCreepName = roleName + (Game.time % 100000);
                if (spawnFlag) {
                    create = Game.spawns[spawnName].spawnCreep(creepBody, spawnCreepName,
                        {
                            memory: {
                                role: roleName, //角色
                                source: -1, //前往的能量采集点
                                notpath: -1 //无法到达的能量采集点
                            }
                        });
                    if (create == OK) {
                        console.log("spawning " + roleName + "body :" + creepBody)
                    }
                }
                if (creepBody != null && printFlag && create != OK) {
                    console.log(create + " ready spawn " + spawnCreepName + " => " + creepBody)
                    printFlag = false;
                }
            }
            logInfo = logInfo + ":" + creepSize[index] + "/" + roleSize[index] + " "
        }

        //打印日志
        var source0 = _.filter(Game.creeps, (creep) => creep.memory.source0 == 1);
        var source1 = _.filter(Game.creeps, (creep) => creep.memory.source1 == 1);
        Memory.source0 = source0.length
        Memory.source1 = source1.length
        var ticksToLive = _.filter(Game.creeps, (creep) => creep.ticksToLive < 500);
        if (source0.length != 0)
            console.log('source0:' + source0.length + " " + source0)
        if (source1.length != 0)
            console.log("source1:" + source1.length + " " + source1)
        if (ticksToLive.length != 0)
            console.log('dying:' + ticksToLive.length + " " + ticksToLive)
        console.log('creep of survival => ' + logInfo);


        //显示正在生产的creep
        if (Game.spawns[spawnName].spawning) {
            var spawningCreep = Game.creeps[Game.spawns[spawnName].spawning.name];
            Game.spawns[spawnName].room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                Game.spawns[spawnName].pos.x + 1,
                Game.spawns[spawnName].pos.y,
                { align: 'left', opacity: 0.8 });
            console.log("spawning " + spawningCreep.name + "body [WORK:"
                + spawningCreep.getActiveBodyparts(WORK) + ',CARRY:'
                + spawningCreep.getActiveBodyparts(CARRY) + ',MOVE:'
                + spawningCreep.getActiveBodyparts(MOVE) + ']'
            )
        }
    }
};

module.exports = creepsFactory;