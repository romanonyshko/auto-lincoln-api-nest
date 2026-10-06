import type { Carmaker } from "@auto-lincoln/contracts";
import type { CarmakerRow } from "../catalogue.service.js";

export function toCarmaker(row: CarmakerRow): Carmaker {
    return {
        id: row.id,
        name: row.name,
    }
}