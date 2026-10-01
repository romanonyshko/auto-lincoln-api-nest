import { Controller, Get, UseGuards } from '@nestjs/common'
import { DashboardService } from './dashboard.service.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import type { DashboardResponse } from '@auto-lincoln/contracts';
import { toDashboardResponse } from './mappers/to-dashboard-response.js';


@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    @UseGuards(AuthGuard)
    async getDashboardData(): Promise<DashboardResponse> {
        const data = await this.dashboardService.getDashboard()
        return toDashboardResponse(data)
    }

}