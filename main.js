var creepsFactory = require('creepsFactory');
var peasant = require('peasant');
var temp = require('temp');
var roomName = 'W33N41'

let spawnName = 'W';
module.exports.loop = function () {
    // initMap()
    //每100time建造一次道路
    if (Game.time % 100 == 0)
        buildRoad()
    gameRoomsRun()
    creepsRun()
    if (Game.cpu.getUsed() > Game.cpu.tickLimit / 2) {
        console.log("Used half of CPU already!");
    }
}

    function gameRoomsRun() {
        for (var roomName in Game.rooms) {
            //能量查询
            console.log('Room "' + roomName + '" has ' + Game.rooms[roomName].energyAvailable + '/' + Game.rooms[roomName].energyCapacityAvailable + ' energy');
            Memory.engery1 = Game.rooms[roomName].energyAvailable
            Memory.maxEngery = Game.rooms[roomName].energyCapacityAvailable
            towers()
        }
    }

    function creepsRun() {
        //creep生产工厂
        creepsFactory.run();
        searcingResources()
        for (var name in Game.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
            var creep = Game.creeps[name];
            if (creep.fatigue == 0) {
                //creep开始工作
                peasant.run(creep);
            } else {
                creep.say('☻')
            }
        }
    }

    function initMap() {
        console.log("initMap")
        var map = [];
        var row = [];
        for (let i = 0; i < 50; i++) {
            row.push(0);
        }
        for (let i = 0; i < 50; i++) {
            map.push(row);
        }
        Memory.map = map;
    }

    function buildRoad() {
        var map = Memory.map;
        var max = 0;
        for (let i = 0; i < map.length; i++) {
            var row = map[i]
            var rowInfo = ''
            for (let j = 0; j < row.length; j++) {
                var v = Math.floor((map[i][j] / 10));
                if (v > max)
                    max = v;
                if (v > max / 2 && v > 5) {
                    var result = Game.rooms[roomName].createConstructionSite(i, j, STRUCTURE_ROAD);
                    if (result == OK) {
                        console.log("build road " + i + '.' + j)
                    }
                }
                rowInfo = rowInfo + v + " "
            }
            console.log(rowInfo)
        }
    }

    function searcingResources() {
        //捡起掉落的能量
        var dropped = Game.spawns[spawnName].pos.findClosestByRange(FIND_DROPPED_RESOURCES);
        if (dropped != null) {
            var shortcreep = dropped.pos.findClosestByPath(FIND_MY_CREEPS, {
                filter: (structure) => {
                    LOOK_CREEPS
                    return structure.store.getFreeCapacity() > 10;
                }
            });
            if (shortcreep != null && shortcreep.pickup(dropped) == ERR_NOT_IN_RANGE) {
                shortcreep.moveTo(dropped);
                shortcreep.say("🖐️" + dropped.pos.x + "." + dropped.pos.y)
                console.log(shortcreep.name + "🖐️ " + dropped + " " + dropped.pos)
            }
        }
    }


    function towers() {
        //防御塔
        // var hostiles = Game.rooms[roomName].find(FIND_HOSTILE_CREEPS);
        // if (hostiles.length > 0) {
        //     var username = hostiles[0].owner.username;
        //     Game.notify(`User ${username} spotted in room ${roomName}`);
        //     var towers = Game.rooms[roomName].find(
        //         FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });
        //     towers.forEach(tower => tower.attack(hostiles[0]));
        // }
        // var towers = Game.rooms[roomName].find(
        //     FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });

        //维修建筑
        // var structures = Game.rooms[roomName].find(
        //     FIND_STRUCTURES, {
        //     filter: (structure) => {
        //         STRUCTURE_CONTAINER
        //         return structure.structureType == STRUCTURE_CONTAINER && structure.hits < 5000 && structure.hits < structure.hitsMax / 2;
        //     }
        // });
        // if (structures != null && structures.length != 0) {
        //     console.log(structures)
        //     structures = structures[0];
        //     var shortcreep = structures.pos.findClosestByPath(FIND_MY_CREEPS, {
        //         filter: (structure) => {
        //             LOOK_CREEPS
        //             return structure.store.getFreeCapacity() == 0;
        //         }
        //     });
        //     if (shortcreep != null) {
        //         var repairResult = shortcreep.repair(structures);
        //         if (repairResult == ERR_NOT_IN_RANGE) {
        //             shortcreep.moveTo(structures);
        //         }
        //     } else {
        //         console.log('repairResult：' + repairResult)
        //     }
        // }
    }
