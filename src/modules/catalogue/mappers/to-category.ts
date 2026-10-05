import type { Category } from '@auto-lincoln/contracts';
import type { Category as CategoryRow } from '../../../db/generated/prisma/client.js';

export function toCategory(row: CategoryRow): Category {
    return {
        id: row.id,
        title: row.title,
        image: row.image,
        order: row.order
    }
}