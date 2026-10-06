import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import type { Prisma } from '../../db/generated/prisma/client.js';

export const categorySelect = {
    id: true,
    title: true,
    image: true,
    order: true
} satisfies Prisma.CategorySelect

export const partSelect = {
    id: true,
    categoryId: true,
    title: true,
    articleNumber: true,
    brand: true,
    price: true,
    currency: true,
    inStock: true,
    image: true,
    createdAt: true,
    compatibleEngines: { select: { id: true } },
} satisfies Prisma.PartSelect

export type CategoryRow = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>
export type PartRow = Prisma.PartGetPayload<{ select: typeof partSelect }>

@Injectable()
export class CatalogueService {
    constructor(private readonly prisma: PrismaService) { }

    async getCategories(): Promise<CategoryRow[]> {
        return this.prisma.category.findMany({
            select: categorySelect,
            orderBy: { order: 'asc' },
        })
    }

    async getPartsByCategory(categoryId: string): Promise<PartRow[]> {
        return this.prisma.part.findMany({
            select: partSelect,
            where: { categoryId },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
        })
    }
}
