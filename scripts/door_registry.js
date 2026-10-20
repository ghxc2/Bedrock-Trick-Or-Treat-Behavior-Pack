
import { world } from "@minecraft/server";

const PROPERTY_NAME = "doorInfoRegistry";

// Generate the same ID used by the visited-door system
export function getDoorId(block, permutation = block.permutation) {
    let doorY = block.location.y;

    if (permutation.getState("upper_block_bit") === true) {
        doorY -= 1;
    }

    return `${block.dimension.id}:` +
        `${block.location.x},${doorY},${block.location.z}`;
}

// Load the saved door information
function loadRegistry() {
    const saved = world.getDynamicProperty(PROPERTY_NAME);

    if (typeof saved !== "string") {
        return {};
    }

    try {
        return JSON.parse(saved);
    } catch (error) {
        console.warn("Failed to load door information registry.");
        return {};
    }
}

// Save the door information
function saveRegistry(registry) {
    world.setDynamicProperty(
        PROPERTY_NAME,
        JSON.stringify(registry)
    );
}

// Assign a name and description to a door
export function assignDoorInfo(doorId, name, description) {
    const registry = loadRegistry();

    registry[doorId] = {
        name: name,
        description: description
    };

    saveRegistry(registry);
}

// Retrieve information about a door
export function getDoorInfo(doorId) {
    const registry = loadRegistry();

    return registry[doorId] ?? null;
}

// Remove a door's assigned information
export function removeDoorInfo(doorId) {
    const registry = loadRegistry();

    if (!(doorId in registry)) {
        return false;
    }

    delete registry[doorId];
    saveRegistry(registry);

    return true;
}

// Get a door's name
export function getDoorName(doorId) {
    const info = getDoorInfo(doorId);
    return info ? info.name : null;
}

// Get a door's description
export function getDoorDescription(doorId) {
    const info = getDoorInfo(doorId);
    return info ? info.description : null;
}

export function getAllDoorInfo() {
    return loadRegistry();
}