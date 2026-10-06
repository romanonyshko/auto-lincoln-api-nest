import { API_ROUTES, type EnginesResponse } from "@auto-lincoln/contracts";
import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CatalogueService } from "./catalogue.service.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { toEngine } from "./mappers/to-engine.js";

@Controller(API_ROUTES.models)
export class ModelsController {
    constructor(private readonly catalogueService: CatalogueService) { }

    @Get(':id/engines')
    @UseGuards(AuthGuard)
    async getEngines(
        @Param('id') id: string
    ): Promise<EnginesResponse> {
        const engines = await this.catalogueService.getEnginesByModel(id)
        return engines.map(toEngine)
    }
}