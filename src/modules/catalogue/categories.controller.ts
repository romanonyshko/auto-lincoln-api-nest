import { API_ROUTES, type CategoriesResponse } from "@auto-lincoln/contracts";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { CatalogueService } from "./catalogue.service.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { toCategory } from "./mappers/to-category.js";

@Controller(API_ROUTES.categories)
export class CategoriesController {
    constructor(private readonly catalogueService: CatalogueService) { }

    @Get()
    @UseGuards(AuthGuard)
    async getCategories(): Promise<CategoriesResponse> {
        const categories = await this.catalogueService.getCategories()
        return categories.map(toCategory)
    }
}
