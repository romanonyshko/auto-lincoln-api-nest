import type { Category } from '@auto-lincoln/contracts';
import type { CategoryRow } from '../catalogue.service.js';

export function toCategory(row: CategoryRow): Category {
    return {
        id: row.id,
        title: row.title,
        image: row.image,
        order: row.order
    }
}
