import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service.js";

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService){}

    async getDashboard(){
        const [newsCount,
             reviewCount,
              pagesCount,
               latestNews, 
               latestReview,
               requestGroups,
               activity,
               stats
            ] = await Promise.all([
                this.prisma.news.count(),
                this.prisma.review.count(),
                this.prisma.page.count(),
                this.prisma.news.findFirst({orderBy: {publishedAt: 'desc'} }),
                this.prisma.review.findFirst({orderBy: {createdAt: "desc"}, include: {news: true}}),
                this.prisma.request.groupBy({by: 'status', _count: {_all: true}}),
                 this.prisma.monthlyActivity.findMany({orderBy: {month: 'asc'}}),
                 this.prisma.dashboardStat.findMany({orderBy: {order: 'asc'}})
            ])
        
        return {
            newsCount,
            reviewCount,
            pagesCount,
            latestNews,
            latestReview,
            requestGroups,
            activity,
            stats
        }
    }
}