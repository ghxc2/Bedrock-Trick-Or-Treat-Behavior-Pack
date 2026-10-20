
import { world } from "@minecraft/server";

const outcomes = new Map();

// Register an outcome
function registerOutcome(name, callback) {
    outcomes.set(name, callback);
}

// Run an outcome by name
function runOutcome(name, player, block) {
    const callback = outcomes.get(name);

    if (!callback) {
        console.warn(`Unknown outcome: ${name}`);
        return;
    }

    callback(player, block);
}

export function runRandomOutcome(player, block) {
    const outcomeNames = [...outcomes.keys()];

    if (outcomeNames.length === 0) {
        return;
    }

    const randomIndex = Math.floor(
        Math.random() * outcomeNames.length
    );

    runOutcome(outcomeNames[randomIndex], player, block);
}

registerOutcome("candy", (player, block) => {
    player.sendMessage("§aYou got some candy!");
});

registerOutcome("jumpscare", (player, block) => {
    player.sendMessage("§cBOO! Something jumps out at you!");
});

registerOutcome("nothing", (player, block) => {
    player.sendMessage("§7Nobody answers the door...");
});

registerOutcome("zombie", (player, block) => {
    const location = player.location;

    player.dimension.spawnEntity("minecraft:zombie", {
        x: location.x + 2,
        y: location.y,
        z: location.z
    });

    player.sendMessage("§cYou should NOT have knocked!");
});