// var creepsFactory = require('creepsFactory');
let spawnName = 'W';
var peasant = {

    run: function (creep) {
        //每隔一定time刷新采矿信息
        // if (Game.time % 50 == 0) {
        //     console.log('resetMiningState')
        //     this.resetMiningState(creep);
        // }
        //creep续命
        // var roleNum = _.filter(Game.creeps, (c) => c.memory.role == creep.memory.role);
        if (creep.hitsMax < 700) {
            // creep.suicide()
            console.log(creep.name + ' suicide')
        }
        if (creep.memory.renew || (creep.ticksToLive < 500 && creep.hitsMax >= 1000)) {
            creep.memory.renew = true;
            if (Game.spawns[spawnName].renewCreep(creep) == ERR_NOT_IN_RANGE) {
                creep.moveTo(Game.spawns[spawnName]);
                creep.say('✞')
            } else {
                if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                    this.storage(creep);
                }
            }
            if (creep.ticksToLive >= 1300) {
                creep.memory.renew = false;
            }
            return;
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
            moveTo = creep.moveTo(sources[creep.memory.source], { visualizePathStyle: { stroke: '#ffaa00' } });
            Memory.map[creep.pos.x][creep.pos.y] = Memory.map[creep.pos.x][creep.pos.y] + 1
            creep.say('mining')
        }
        if (harvest == OK) {
            creep.memory.dontPullMe = true;
        } else {
            creep.memory.dontPullMe = false;
            if (moveTo == ERR_NO_PATH) {
                creep.say("⊗");
                if (creep.memory.notpath == 1) {
                    creep.memory.source = 0
                } else {
                    creep.memory.source = 1
                }
            } else {
                creep.say("➭" + creep.memory.source);
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
        //寻找可存放能量的容器
        var containers = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                STRUCTURE_CONTAINER
                return (structure.structureType == STRUCTURE_EXTENSION ||
                    structure.structureType == STRUCTURE_CONTAINER ||
                    structure.structureType == STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            }
        });
        if (containers != null) {
            // if (containers.length > 1)
            //     containers = containers[0];
            if (creep.transfer(containers, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(containers, { visualizePathStyle: { stroke: '#ffffff' } });
                creep.say('☭')
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
                    && structure.store[RESOURCE_ENERGY] >= 200;
            }
        });
        //获取需要建造的建筑
        var reBuild = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        //获取需要维修的路
        // var needRepair = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        //     filter: (structure) => {
        //         STRUCTURE_ROAD
        //         return structure.hits < 4000;
        //     }
        // });

        //结束建造
        if (creep.memory.building && ((structures == null && creep.store[RESOURCE_ENERGY] == 0) || reBuild == null)) {
            creep.memory.building = false;
            creep.say('↻');
            this.resetMiningState(creep);
        }
        //开始建造
        if (!creep.memory.building && reBuild != null && (creep.store.getFreeCapacity() == 0 || structures != null)) {
            creep.memory.building = true;
            // if (structures != null && structures.length > 1)
            //     structures = structures[0];
            // if (reBuild.length > 1)
            //     reBuild = reBuild[0];
            creep.say('☩');
            this.resetMiningState(creep);
        }
        // console.log('needRepair =>' + needRepair)
        //不在建造状态，且有建筑需要维修，则开始维修
        // if (!creep.memory.building && needRepair != null) {
        //     if (needRepair.length > 1)
        //         needRepair = needRepair[0]
        //     if (creep.store[RESOURCE_ENERGY] == 0) {
        //         //容器中有资源且有需要建造的建筑
        //         if (structures != null) {
        //             if (structures.length > 1)
        //                 structures = structures[0];
        //             if (creep.withdraw(structures, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        //                 creep.moveTo(structures);
        //                 creep.say('withdraw')
        //             }
        //         } else if (structures == null) {
        //             this.mining(creep)
        //         }
        //     } else {
        //         if (creep.repair(needRepair, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        //             creep.moveTo(needRepair);
        //             creep.say('repair')
        //         }
        //     }
        // } else 
        if (creep.memory.building) {//建造状态中
            //携带资源为0
            if (creep.store[RESOURCE_ENERGY] == 0) {
                //容器中有资源且有需要建造的建筑
                if (structures != null) {
                    if (structures.length > 1)
                        structures = structures[0];
                    if (creep.withdraw(structures, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(structures);
                    }
                } else if (structures == null) {
                    this.mining(creep)
                }
            } else {
                //建造
                if (creep.build(reBuild) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(reBuild, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            //不在建造状态 并且携带资源为0
        } else if (creep.store.getFreeCapacity() > 0) {
            this.mining(creep)
        } else if (creep.store.getFreeCapacity() == 0) {
            this.storage(creep);
        }
    },

    upgrading: function (creep) {

        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
            creep.say('☀');
            this.resetMiningState(creep);
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
            creep.memory.upgrading = true;
            creep.say('❀');
            this.resetMiningState(creep);
        }

        if (creep.memory.upgrading) {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
                creep.say('❀');
            }
        } else {
            var structures = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => {
                    STRUCTURE_CONTAINER
                    return (structure.structureType == STRUCTURE_CONTAINER && structure.store.getUsedCapacity(RESOURCE_ENERGY) >= 200);
                }
            });
            if (structures != null) {
                this.getResources(creep);
            } else {
                this.mining(creep);
            }
        }
    },

    transportResources: function (creep) {
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
            this.getResources(creep);
        } else {
            this.storageTower(creep);
            this.storageExtension(creep);
            this.storageSpawn(creep);
        }
    },

    getResources: function (creep) {
        //寻找可存放能量的扩展容器
        // var extensions = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        //     filter: (structure) => {
        //         STRUCTURE_CONTAINER
        //         return structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        //     }
        // });
        //寻找拥有一定能量以上的容器或spawn
        var structures = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                STRUCTURE_CONTAINER
                return (structure.structureType == STRUCTURE_CONTAINER && structure.store.getUsedCapacity(RESOURCE_ENERGY) >= 200);
            }
        });
        if (structures == null)
            structures = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => {
                    STRUCTURE_CONTAINER
                    return (structure.structureType == STRUCTURE_SPAWN && structure.store.getUsedCapacity(RESOURCE_ENERGY) >= 200);
                }
            });
        //如果有能量且有扩展容器
        if (structures != null) {
            if (structures > 1)
                structures = structures[0];
            if (creep.withdraw(structures, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(structures);
            }
        } else {
            // this.mining(creep);
        }
    },

    storageSpawn: function (creep) {
        //寻找可存放能量的扩展容器
        var extensions = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                STRUCTURE_CONTAINER
                return structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            }
        });
        if (extensions != null) {
            // if (extensions.length > 1)
            //     extensions = extensions[0];
            if (creep.transfer(extensions, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(extensions, { visualizePathStyle: { stroke: '#ffffff' } });
                creep.say('☭')
            }
        }

        this.resetMiningState(creep);
    },

    storageExtension: function (creep) {
        //寻找可存放能量的扩展容器
        var extensions = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                STRUCTURE_CONTAINER
                return structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            }
        });
        if (extensions != null) {
            // if (extensions.length > 1)
            //     extensions = extensions[0];
            if (creep.transfer(extensions, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(extensions, { visualizePathStyle: { stroke: '#ffffff' } });
                creep.say('☭')
            }
        }

        this.resetMiningState(creep);
    },

    storageTower: function (creep) {
        //寻找需要补充放能量的塔
        var towers = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                STRUCTURE_CONTAINER
                return structure.structureType == STRUCTURE_TOWER &&
                    structure.store.getUsedCapacity(RESOURCE_ENERGY) < structure.store.getFreeCapacity(RESOURCE_ENERGY);
            }
        });
        if (towers != null) {
            // if (towers.length > 1)
            //     towers = towers[0]
            if (creep.transfer(towers, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(towers, { visualizePathStyle: { stroke: '#ffffff' } });
                creep.say('☭')
            }
        }

        this.resetMiningState(creep);
    },
};

module.exports = peasant;