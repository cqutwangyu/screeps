var creepsFactory = require('creepsFactory');
var peasant = require('peasant');
var temp = require('temp');
// require('bypass');
module.exports.loop = function () {
    for (var roomName in Game.rooms) {
        //能量查询
        console.log('Room "' + roomName + '" has ' + Game.rooms[roomName].energyAvailable+'/'+ Game.rooms[roomName].energyCapacityAvailable + ' energy');
        Memory.engery1 = Game.rooms[roomName].energyAvailable
        Memory.maxEngery= Game.rooms[roomName].energyCapacityAvailable

        //防御塔
        var hostiles = Game.rooms[roomName].find(FIND_HOSTILE_CREEPS);
        if (hostiles.length > 0) {
            var username = hostiles[0].owner.username;
            Game.notify(`User ${username} spotted in room ${roomName}`);
            var towers = Game.rooms[roomName].find(
                FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });
            towers.forEach(tower => tower.attack(hostiles[0]));
        }
        // var towers = Game.rooms[roomName].find(
        //     FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });


        //维修容器
        var structures = Game.rooms[roomName].find(
            FIND_STRUCTURES, {
            filter: (structure) => {
                STRUCTURE_CONTAINER
                return structure.structureType == STRUCTURE_CONTAINER && structure.hits < 5000 && structure.hits < structure.hitsMax / 2;
            }
        });
        if (structures != null && structures.length != 0) {
            console.log(structures)
            structures = structures[0];
            var shortcreep = structures.pos.findClosestByPath(FIND_MY_CREEPS, {
                filter: (structure) => {
                    LOOK_CREEPS
                    return structure.store.getFreeCapacity() == 0;
                }
            });
            if (shortcreep != null) {
                var repairResult = shortcreep.repair(structures);
                if (repairResult == ERR_NOT_IN_RANGE) {
                    shortcreep.moveTo(structures);
                }
            } else {
                console.log('repairResult：' + repairResult)
            }
        }

    }

    //删除死掉的creep
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }

    //creep生产工厂
    creepsFactory.run();

    //捡起掉落的能量
    var dropped = Game.spawns['W'].pos.findClosestByRange(FIND_DROPPED_RESOURCES);
    if (dropped != null) {
        var shortcreep = dropped.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: (structure) => {
                LOOK_CREEPS
                return structure.store.getFreeCapacity() > 10;
            }
        });
        if (shortcreep != null && shortcreep.pickup(dropped) == ERR_NOT_IN_RANGE) {
            shortcreep.moveTo(dropped);
        }
        // shortcreep.say("🖐️" + dropped.pos.x + "." + dropped.pos.y)
        // console.log(shortcreep.name + "🖐️ " + dropped + " " + dropped.pos)
    }


    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.fatigue == 0) {
            //creep开始工作
            peasant.run(creep);
        }
    }
    // temp.run(Game.creeps['upgrader21873400']);
}