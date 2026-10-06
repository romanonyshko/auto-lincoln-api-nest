import { Module } from "@nestjs/common";
import { CatalogueService } from "./catalogue.service.js";
import { CategoriesController } from "./categories.controller.js";
import { PartsController } from "./parts.controller.js";

@Module({
    controllers: [CategoriesController, PartsController],
    providers: [CatalogueService]
})
export class CatalogueModule {}