import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import type { Prisma } from '../../db/generated/prisma/client.js';
import type { PartsQuery } from '@auto-lincoln/contracts';

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

export const carmakerSelect = {
    id: true,
    name: true
} satisfies Prisma.CarmakerSelect

export const carModelSelect = {
    id: true,
    carmakerId: true,
    name: true
} satisfies Prisma.CarModelSelect

export const engineSelect = {
    id: true,
    modelId: true,
    name: true
} satisfies Prisma.EngineSelect

export type CategoryRow = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>
export type PartRow = Prisma.PartGetPayload<{ select: typeof partSelect }>
export type CarmakerRow = Prisma.CarmakerGetPayload<{ select: typeof carmakerSelect }>
export type CarModelRow = Prisma.CarModelGetPayload<{ select: typeof carModelSelect }>
export type EngineRow = Prisma.EngineGetPayload<{ select: typeof engineSelect }>

@Injectable()
export class CatalogueService {
    constructor(private readonly prisma: PrismaService) { }

    async getCategories(): Promise<CategoryRow[]> {
        return this.prisma.category.findMany({
            select: categorySelect,
            orderBy: { order: 'asc' },
        })
    }

    async getParts(query: PartsQuery): Promise<PartRow[]> {
        const where: Prisma.PartWhereInput = {
            categoryId: query.category,
        }

        if (query.engine) {
            where.compatibleEngines = { some: { id: query.engine } }
        } else if (query.model) {
            where.compatibleEngines = { some: { modelId: query.model } }
        } else if (query.make) {
            where.compatibleEngines = { some: { model: { carmakerId: query.make } } }
        }

        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { articleNumber: { contains: query.search, mode: 'insensitive' } },
            ]
        }

        return this.prisma.part.findMany({
            select: partSelect,
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: query.limit,
        })
    }

    async getCarmakers(): Promise<CarmakerRow[]> {
        return this.prisma.carmaker.findMany({
            select: carmakerSelect,
            orderBy: { name: 'asc' },
        })
    }

    async getModelsByCarmaker(carmakerId: string): Promise<CarModelRow[]> {
        return this.prisma.carModel.findMany({
            select: carModelSelect,
            where: { carmakerId },
            orderBy: { name: 'asc' },
        })
    }

    async getEnginesByModel(modelId: string): Promise<EngineRow[]> {
        return this.prisma.engine.findMany({
            select: engineSelect,
            where: { modelId },
            orderBy: { name: 'asc' }
        })
    }

}
