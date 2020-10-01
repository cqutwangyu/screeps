var creepsFactory = {

    run: function () {
        var roles = ['harvester', 'upgrader', 'mediator', 'builder']
        var roleSize = [5, 4, 2, 2];
        var creepBodys = [
            [WORK, CARRY, MOVE],//200
            [WORK, WORK, CARRY, MOVE],//300
            [WORK, WORK, CARRY, CARRY, MOVE],//350
            [WORK, WORK, CARRY, CARRY, MOVE, MOVE],//400
            [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE],//450
            [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE],//550
            [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],//600
            [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]//650
        ];
        var logInfo = '';
        var spawnCreepInfo = '';
        var spawnFlag = true;
        for (let index = 0; index < roles.length; index++) {
            var roleName = roles[index];
            logInfo = logInfo + roleName;
            var roleList = _.filter(Game.creeps, (creep) => creep.memory.role == roleName);
            var roleLength = roleList.length;
            if (roleLength < roleSize[index]) {
                var newName = roleName + Game.time;
                var creepBody;
                if (roleLength <= 1 && (roleName == 'mediator' || roleName == 'upgrader')) {
                    creepBody = creepBodys[0];
                } else if ((roleLength >= 7||Memory.maxEngery<=650) && Memory.engery1 >= 650) {
                    creepBody = creepBodys[7];
                } else if ((roleLength >= 6||Memory.maxEngery<=600) && Memory.engery1 >= 600) {
                    creepBody = creepBodys[6];
                } else if ((roleLength <= 6 ||Memory.maxEngery<=500)&& Memory.engery1 >= 500) {
                    creepBody = creepBodys[5];
                } else if ((roleLength <= 5||Memory.maxEngery<=450) && Memory.engery1 >= 450) {
                    creepBody = creepBodys[4];
                } else if ((roleLength <= 4 ||Memory.maxEngery<=400)&& Memory.engery1 >= 400) {
                    creepBody = creepBodys[3];
                } else if ((roleLength <= 3||Memory.maxEngery<=350) && Memory.engery1 >= 350) {
                    creepBody = creepBodys[2];
                } else if ((roleLength <= 2||Memory.maxEngery<=300) && Memory.engery1 >= 300) {
                    creepBody = creepBodys[1];
                } else if (roleLength < 2) {
                    spawnFlag = false;
                }

                if (spawnFlag) {
                    spawnCreepInfo = spawnCreepInfo + ' ready spawn ' + roleName + ' '
                    var create = Game.spawns['W'].spawnCreep(creepBody, newName,
                        { memory: { role: roleName, directions: BOTTOM_LEFT, upgrading: false, source: -1, notpath: -1 } });
                    if (create == OK) {
                        console.log("spawn " + roleName + "body :" + creepBody)
                        roleLength++;
                    }
                } else if (creepBody != null)
                    console.log(creepBody)
            }
            logInfo = logInfo + ":" + roleLength + " "
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
        console.log(spawnCreepInfo + ' creep of survival => ' + logInfo);
        console.log(logInfo);


        //显示正在生产的creep
        if (Game.spawns['W'].spawning) {
            var spawningCreep = Game.creeps[Game.spawns['W'].spawning.name];
            Game.spawns['W'].room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                Game.spawns['W'].pos.x + 1,
                Game.spawns['W'].pos.y,
                { align: 'left', opacity: 0.8 });
        }
    }
};

module.exports = creepsFactory;