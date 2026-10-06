import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import type { Prisma } from '../../db/generated/prisma/client.js';

export const categorySelect = {
    id: true,
    title: true,
    image: true,
    order: true
} satisfies Prisma.CategorySelect

export type CategoryRow = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>

@Injectable()
export class CatalogueService {
    constructor(private readonly prisma: PrismaService) { }

    async getCategories(): Promise<CategoryRow[]> {
        return this.prisma.category.findMany({
            select: categorySelect,
            orderBy: { order: 'asc' },
        })
    }
}
