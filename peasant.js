let spawnName = 'W';
var peasant = {

    run: function (creep) {
        //每隔一定time刷新采矿信息
        // if (Game.time % 50 == 0) {
        //     console.log('resetMiningState')
        //     this.resetMiningState(creep);
        // }
        //creep续命
        if (creep.ticksToLive < 500 && creep.hitsMax >= 400) {
            if (Game.spawns[spawnName].renewCreep(creep) == ERR_NOT_IN_RANGE) {
                creep.moveTo(Game.spawns[spawnName]);
                return;
            }
        }
        //角色任务
        switch (creep.memory.role) {
            case 'harvester':
                if (creep.store.getFreeCapacity() > 0) {
                    this.mining(creep);
                } else {
                    this.storage(creep);
                }
                break;

            case 'upgrader':
                this.upgrading(creep);
                break;

            case 'builder':
                this.building(creep);
                break;

            case 'mediator':
                this.transportResources(creep);
                break;
        }
    },

    mining: function (creep) {
        var sources = creep.room.find(FIND_SOURCES);
        var nearest = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
        for (let index = 0; index < sources.length; index++) {
            const source = sources[index];
            if (nearest == source) {
                nearest = index;
            }
        }

        if (creep.memory.source == undefined || creep.memory.source == -1) {
            creep.memory.source = nearest;
        }

        var harvest = creep.harvest(sources[creep.memory.source]);
        if (harvest == OK) {
            if (creep.memory.source == 0) {
                creep.memory.source0 = 1;
            } else if (creep.memory.source == 1) {
                creep.memory.source1 = 1;
            }
        } else if (creep.memory.notpath == -1) {
            creep.memory.source0 = -1;
            creep.memory.source1 = -1;
            if ((Memory.source0 <= 4 && Memory.source1 <= 3) || Memory.source0 == Memory.source1) {
                creep.memory.notpath = creep.memory.source;
                creep.memory.source = nearest;
            } else {
                creep.memory.notpath = creep.memory.source;
                creep.memory.source = Memory.source0 > Memory.source1 ? 1 : 0;
            }
        }

        var moveTo = -1;
        if (harvest == ERR_NOT_IN_RANGE) {// && creep.store.getFreeCapacity() > creep.store.getUsedCapacity()
            moveTo = creep.moveTo(sources[creep.memory.source], {visualizePathStyle: {stroke: '#ffaa00'}});
            Memory.map[creep.pos.x][creep.pos.y] = Memory.map[creep.pos.x][creep.pos.y] + 1
            // if (moveTo == ERR_NO_PATH && creep.harvest(sources[creep.memory.source]) == ERR_NOT_IN_RANGE && creep.store.getFreeCapacity() > creep.store.getUsedCapacity()) {
            //     creep.memory.source = 0;
            //     moveTo = creep.moveTo(sources[creep.memory.source], { visualizePathStyle: { stroke: '#ffaa00' } });
            // }
        }
        if (harvest == OK) {
            creep.memory.dontPullMe = true;
            // creep.say("⛏️" + (creep.store.getCapacity() - creep.store.getFreeCapacity()) + "/" + (creep.getActiveBodyparts(CARRY) * 50));
        } else {
            creep.memory.dontPullMe = false;
            if (moveTo == ERR_NO_PATH) {
                creep.say("🚷" + moveTo);
                if (creep.memory.notpath == 1) {
                    creep.memory.source = 0
                } else {
                    creep.memory.source = 1
                }
            } else {
                creep.say("🏃" + creep.memory.source);
            }
        }
    },

    resetMiningState: function (creep) {
        creep.memory.notpath = -1
        creep.memory.source = -1;
        creep.memory.source0 = -1;
        creep.memory.source1 = -1;
    },

    storage: function (creep) {
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                STRUCTURE_CONTAINER
                return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        if (targets.length > 0)
            targets = targets[0]
        if (creep.transfer(targets, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets, {visualizePathStyle: {stroke: '#ffffff'}});
        }
        this.resetMiningState(creep);
    },

    storageSpawn: function (creep) {
        var targets = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                STRUCTURE_CONTAINER
                return (structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ||
                    (structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 50);
            }
        });

        if (targets != null) {
            if (targets.length > 1)
                targets = targets[0];
            if (creep.transfer(targets, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }

        this.resetMiningState(creep);
    },

    storageTower: function (creep) {
        var targets = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                STRUCTURE_CONTAINER
                return structure.structureType == STRUCTURE_TOWER &&
                    structure.store.getUsedCapacity(RESOURCE_ENERGY) < structure.store.getFreeCapacity(RESOURCE_ENERGY);
            }
        });
        if (targets != null && targets.length > 0) {
            if (targets.length > 1)
                targets = targets[0]
            if (creep.transfer(targets, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }

        this.resetMiningState(creep);
    },

    building: function (creep) {
        //获取资源大于300的容器
        var structures = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                STRUCTURE_CONTAINER
                return (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_SPAWN)
                    && structure.store[RESOURCE_ENERGY] >= 300;
            }
        });
        //获取需要建造的建筑
        var reBuild = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        //结束建造
        if (creep.memory.building && ((structures == null && creep.store[RESOURCE_ENERGY] == 0) || reBuild == null)) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
            this.resetMiningState(creep);
        }
        //开始建造
        if (!creep.memory.building && reBuild != null && (creep.store.getFreeCapacity() == 0 || structures != null)) {
            creep.memory.building = true;
            if (structures != null && structures.length > 1)
                structures = structures[0];
            if (reBuild.length > 1)
                reBuild = reBuild[0];
            creep.say('🚧 build');
            this.resetMiningState(creep);
        }
        //获取需要维修的路
        var needRepair = creep.pos.findClosestByRange(STRUCTURE_ROAD, {
            filter: (structure) => {
                STRUCTURE_ROAD
                return structure.hitMax < 4500;
            }
        });
        //不在建造状态，且有建筑需要维修，则开始维修
        if (!creep.memory.building && needRepair != null) {
            if (needRepair.length > 1)
                needRepair = needRepair[0]
            if (creep.store[RESOURCE_ENERGY] == 0) {
                //容器中有资源且有需要建造的建筑
                if (structures != null) {
                    if (structures.length > 1)
                        structures = structures[0];
                    if (creep.withdraw(structures, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(structures);
                    }
                } else {
                    this.mining(creep)
                }
            } else {
                if (creep.repair(needRepair, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(needRepair);
                }
            }
        } else if (creep.memory.building) {//建造状态中
            //携带资源为0
            if (creep.store[RESOURCE_ENERGY] == 0) {
                //容器中有资源且有需要建造的建筑
                if (structures != null) {
                    if (structures.length > 1)
                        structures = structures[0];
                    if (creep.withdraw(structures, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(structures);
                    }
                } else {
                    this.mining(creep)
                }
            } else {
                //建造
                if (creep.build(reBuild) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(reBuild, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            //不在建造状态 并且携带资源为0
        } else if (creep.store[RESOURCE_ENERGY] == 0) {
            this.mining(creep)
        } else {
            this.storage(creep);
        }
    },

    upgrading: function (creep) {

        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
            creep.say('🔄 harvest');
            this.resetMiningState(creep);
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
            creep.memory.upgrading = true;
            creep.say('⚡ upgrade');
            this.resetMiningState(creep);
        }

        if (creep.memory.upgrading) {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
                creep.say('⚡ controller');
            }
        } else {
            this.mining(creep);
        }
    },

    transportResources: function (creep) {
        if (creep.store.getFreeCapacity() != 0) {
            this.getResources(creep);
        } else {
            this.storageSpawn(creep);
            this.storageTower(creep);
        }
    },

    getResources: function (creep) {
        var extensions = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                STRUCTURE_CONTAINER
                return structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            }
        });
        var structures = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                STRUCTURE_CONTAINER
                return (structure.structureType == STRUCTURE_CONTAINER && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0) ||
                    ((extensions != null && structure.structureType == STRUCTURE_SPAWN && structure.store.getUsedCapacity(RESOURCE_ENERGY)) >= 300);
            }
        });
        if (structures != null) {
            if (structures > 1)
                structures = structures[0];
            if (creep.withdraw(structures, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(structures);
            }
        } else {
            this.mining(creep);
        }
    }
};

module.exports = peasant;