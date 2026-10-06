import type { CarModel } from "@auto-lincoln/contracts";
import type { CarModelRow } from "../catalogue.service.js";

export function toCarModel(row: CarModelRow): CarModel {
    return {
        id: row.id,
        carmakerId: row.carmakerId,
        name: row.name,
    }
}