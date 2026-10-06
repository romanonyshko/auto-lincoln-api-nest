import { Controller, Get, UseGuards } from '@nestjs/common'
import { DashboardService } from './dashboard.service.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { API_ROUTES, type DashboardResponse } from '@auto-lincoln/contracts';
import { toDashboardResponse } from './mappers/to-dashboard-response.js';


@Controller(API_ROUTES.dashboard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    @UseGuards(AuthGuard)
    async getDashboardData(): Promise<DashboardResponse> {
        const data = await this.dashboardService.getDashboard()
        return toDashboardResponse(data)
    }

}