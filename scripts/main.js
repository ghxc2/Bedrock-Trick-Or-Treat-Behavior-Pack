import { world, system } from "@minecraft/server";
import { registerCommands } from "./commands.js";
import {
    getDoorId,
    assignDoorInfo,
    getDoorInfo,
    removeDoorInfo,
    getDoorDescription,
    getDoorName
} from "./door_registry.js";

import {
    runRandomOutcome
} from "./outcomes.js"
const PROPERTY_NAME = "visitedDoors";

function getVisitedDoors() {
    const saved = world.getDynamicProperty(PROPERTY_NAME);

    if (typeof saved === "string") {
        return new Set(JSON.parse(saved));
    }

    return new Set();
}

registerCommands(getDoorsVisited)

function saveVisitedDoors(visitedDoors) {
    world.setDynamicProperty(
        PROPERTY_NAME,
        JSON.stringify([...visitedDoors])
    );
}

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const block = event.block;
    const player = event.player;

    if (!block.typeId.endsWith("_door")) {
        return;
    }

    // Get the bottom half of the door, regardless of which half was clicked
    let doorY = block.location.y;

    if (block.permutation.getState("upper_block_bit") === true) {
        doorY -= 1;
    }

    const doorId = getDoorId(block);

    const visitedDoors = getVisitedDoors();

    if(isDoorOpen(block)){
        event.cancel = true;
        return;
    }
    // Testing: hold a barrier to reset this door
    if (player.getComponent("minecraft:equippable")
        ?.getEquipment("Mainhand")?.typeId === "minecraft:barrier") {
        event.cancel = true
        if (!visitedDoors.has(doorId)) {
            player.sendMessage("§eYou Haven't Used This Door Yet!");
            return;
        }
        visitedDoors.delete(doorId);
        saveVisitedDoors(visitedDoors);
        decrementDoorsVisited(player)

        player.sendMessage("§eDoor reset! You can trick-or-treat here again.");
        return;
    }

    if (visitedDoors.has(doorId)) {
        player.sendMessage("§cYou've already knocked on this door!");
        event.cancel = true;
        return;
    }

    visitedDoors.add(doorId);
    saveVisitedDoors(visitedDoors);
    incrementDoorsVisited(player)
    player.sendMessage("§aTrick Or Treat! You Knocked on " + getDoorName(doorId));
    shutDoor(block)
    runRandomOutcome(player, block)
});

world.afterEvents.playerBreakBlock.subscribe((event) => {
    const permutation = event.brokenBlockPermutation;
    const blockId = permutation.type.id;

    // Only handle doors
    if (!blockId.endsWith("_door")) {
        return;
    }
    const block = event.block;
    let doorY = block.location.y;

    const doorId = getDoorId(block, permutation);

    
    const visitedDoors = getVisitedDoors()

    // Remove the broken door and save the updated list
    if (visitedDoors.has(doorId)){
        decrementDoorsVisited(event.player)
    }
    if (visitedDoors.delete(doorId)) {
        world.setDynamicProperty(
            "visitedDoors",
            JSON.stringify([...visitedDoors])
        );

        event.player.sendMessage("§eDoor removed from visited doors.");
    }
});

function getDoorsVisited(player) {
    const propertyName = `doorsVisited_${player.id}`;
    const count = world.getDynamicProperty(propertyName);

    return typeof count === "number" ? count : 0;
}

function incrementDoorsVisited(player) {
    const propertyName = `doorsVisited_${player.id}`;
    const count = getDoorsVisited(player) + 1;

    world.setDynamicProperty(propertyName, count);

    return count;
}

function decrementDoorsVisited(player) {
    const propertyName = `doorsVisited_${player.id}`;
    const count = getDoorsVisited(player) - 1;

    world.setDynamicProperty(propertyName, count);

    return count;
}

function isDoorOpen(block) {
    let doorY = block.location.y;

    if (block.permutation.getState("upper_block_bit") === true) {
        doorY -= 1;
    }

    const bottomBlock = block.dimension.getBlock({
        x: block.location.x,
        y: doorY,
        z: block.location.z
    });

    return (bottomBlock?.permutation.getState("open_bit") === true);
}

function shutDoor(block) {
    system.runTimeout(() => {
    // Get the bottom half of the door
    let doorY = block.location.y;

    if (block.permutation.getState("upper_block_bit") === true) {
        doorY -= 1;
    }

    const bottomBlock = block.dimension.getBlock({
        x: block.location.x,
        y: doorY,
        z: block.location.z
    });

    if (bottomBlock?.typeId.endsWith("_door")) {
        bottomBlock.setPermutation(
            bottomBlock.permutation.withState("open_bit", false)
        );
    }
}, 20);
}