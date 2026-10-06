import type { Engine } from "@auto-lincoln/contracts";
import type { EngineRow } from "../catalogue.service.js";

export function toEngine(row: EngineRow): Engine {
    return {
        id: row.id,
        modelId: row.modelId,
        name: row.name,
    }
}