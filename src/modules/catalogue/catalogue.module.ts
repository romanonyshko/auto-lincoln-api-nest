import { Module } from "@nestjs/common";
import { CatalogueService } from "./catalogue.service.js";
import { CategoriesController } from "./categories.controller.js";

@Module({
    controllers: [CategoriesController],
    providers: [CatalogueService]
})
export class CatalogueModule {}