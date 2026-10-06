import type { Part } from '@auto-lincoln/contracts';
import type { PartRow } from '../catalogue.service.js';

export function toPart(row: PartRow): Part {
    return {
        id: row.id,
        categoryId: row.categoryId,
        title: row.title,
        articleNumber: row.articleNumber,
        brand: row.brand,
        price: row.price.toNumber(),
        currency: row.currency,
        inStock: row.inStock,
        image: row.image,
        createdAt: row.createdAt.toISOString(),
        compatibleEngineIds: row.compatibleEngines.map(e => e.id),
    }
}
