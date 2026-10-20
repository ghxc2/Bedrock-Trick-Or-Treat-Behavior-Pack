
import { world, system } from "@minecraft/server";
import {
    getDoorId,
    assignDoorInfo,
    getAllDoorInfo
} from "./door_registry.js";

export function registerCommands(getDoorsVisited) {
    system.beforeEvents.startup.subscribe((event) => {
        event.customCommandRegistry.registerCommand(
            {
                name: "halloween:doorsvisited",
                description: "Displays how many doors you have visited.",
                permissionLevel: 0
            },
            (origin) => {
                const player = origin.sourceEntity;

                if (!player || player.typeId !== "minecraft:player") {
                    return {
                        status: 1,
                        message: "This command can only be used by a player."
                    };
                }

                const count = getDoorsVisited(player);

                player.sendMessage(
                    `§eYou have visited ${count} doors!`
                );

                return { status: 0 };
            }
        );

        
    event.customCommandRegistry.registerCommand(
        {
            name: "halloween:assigndoor",
            description: "Assigns a name and hint to the door you are looking at.",
            permissionLevel: 0,
            mandatoryParameters: [
                {
                    name: "name",
                    type: "String"
                },
                {
                    name: "description",
                    type: "String"
                }
            ]
        },
        (origin, name, description) => {
            const player = origin.sourceEntity;

            if (!player || player.typeId !== "minecraft:player") {
                return {
                    status: 1,
                    message: "This command can only be used by a player."
                };
            }

            // Find the block the player is looking at
            const block = player.getBlockFromViewDirection({
                maxDistance: 8
            })?.block;

            if (!block || !block.typeId.endsWith("_door")) {
                return {
                    status: 1,
                    message: "Look at a door within 8 blocks."
                };
            }

            const doorId = getDoorId(block);

            assignDoorInfo(doorId, name, description);

            player.sendMessage(
                `§aAssigned "${name}" to this door!`
            );

            return { status: 0 };
        }
    );

    event.customCommandRegistry.registerCommand(
        {
            name: "halloween:listdoors",
            description: "Lists all named doors and their descriptions.",
            permissionLevel: 0
        },
        (origin) => {
            const player = origin.sourceEntity;

            if (!player || player.typeId !== "minecraft:player") {
                return {
                    status: 1,
                    message: "This command can only be used by a player."
                };
            }

            const doors = getAllDoorInfo();
            const doorIds = Object.keys(doors);

            if (doorIds.length === 0) {
                player.sendMessage("§cNo named doors have been registered.");
                return { status: 0 };
            }

            player.sendMessage(`§6--- Registered Doors (${doorIds.length}) ---`);

            const saved = world.getDynamicProperty("visitedDoors");
            const visitedDoors = new Set(
                typeof saved === "string" ? JSON.parse(saved) : []
            );

            for (const doorId of doorIds) {
                const door = doors[doorId];
                const hasVisited = visitedDoors.has(doorId);

                player.sendMessage(`§e${door.name}`);
                player.sendMessage(`§7Description: ${door.description}`);
                player.sendMessage(
                    hasVisited
                        ? "§aOpened: Yes"
                        : "§cOpened: No"
                );
                player.sendMessage(`§8ID: ${doorId}`);
            }

            return { status: 0 };
        }
    );
    
    });

}
