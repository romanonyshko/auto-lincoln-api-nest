import { Module } from "@nestjs/common";
import { CatalogueService } from "./catalogue.service.js";
import { CategoriesController } from "./categories.controller.js";
import { PartsController } from "./parts.controller.js";
import { CarmakersController } from "./carmakers.controller.js";
import { ModelsController } from "./models.controller.js";

@Module({
    controllers: [CategoriesController, PartsController, CarmakersController, ModelsController],
    providers: [CatalogueService]
})
export class CatalogueModule {}
