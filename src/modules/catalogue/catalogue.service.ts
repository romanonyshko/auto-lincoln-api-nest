import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';

@Injectable()
export class CatalogueService {
    constructor(private readonly prisma: PrismaService) { }

    async getCategories() {
        return this.prisma.category.findMany({
            select: { id: true, title: true, image: true, order: true },
            orderBy: { order: 'asc' },
        })

    }
}