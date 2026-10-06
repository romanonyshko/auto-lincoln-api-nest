import { API_ROUTES, type CarmakersResponse, type CarModelsResponse } from "@auto-lincoln/contracts";
import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CatalogueService } from "./catalogue.service.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { toCarmaker  } from "./mappers/to-carmaker.js";
import { toCarModel } from "./mappers/to-car-model.js";

@Controller(API_ROUTES.carmakers)
export class CarmakersController {
    constructor(private readonly catalogueService: CatalogueService) { }

    @Get()
    @UseGuards(AuthGuard)
    async getCarmakers(): Promise<CarmakersResponse> {
        const marks = await this.catalogueService.getCarmakers()
        return marks.map(toCarmaker)
    }

    @Get(':id/models')
    @UseGuards(AuthGuard)
    async getModels(
        @Param('id') id: string
    ): Promise<CarModelsResponse> {
        const carModels = await this.catalogueService.getModelsByCarmaker(id)
        return carModels.map(toCarModel)
    }

}