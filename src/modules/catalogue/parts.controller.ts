import { API_ROUTES, PartsQuerySchema, type PartsQuery, type PartsResponse } from "@auto-lincoln/contracts";
import { BadRequestException, Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CatalogueService } from "./catalogue.service.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { toPart } from "./mappers/to-part.js";

@Controller(API_ROUTES.parts)
export class PartsController {
    constructor(private readonly catalogueService: CatalogueService) { }

    @Get()
    @UseGuards(AuthGuard)
    async getParts(
        @Query(new ZodValidationPipe(PartsQuerySchema)) query: PartsQuery,
    ): Promise<PartsResponse> {
        if (!query.category) {
            throw new BadRequestException('Query param "category" is required')
        }

        const parts = await this.catalogueService.getPartsByCategory(query.category)
        return { items: parts.map(toPart), nextCursor: null }
    }
}