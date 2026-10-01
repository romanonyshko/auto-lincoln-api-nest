import type { DashboardResponse, RequestCounts } from "@auto-lincoln/contracts";
import type { DashboardService } from "../dashboard.service.js";

type DashboardData = Awaited<ReturnType<DashboardService['getDashboard']>>

export function toDashboardResponse(data: DashboardData): DashboardResponse {
    const requests: RequestCounts = {
        all: 0,
        pending: 0,
        approved: 0,
        spam: 0,
        trash: 0
    }

    for (const group of data.requestGroups) {
        requests[group.status] = group._count._all
        requests.all += group._count._all
    }

    const glance = {
        posts: data.newsCount,
        reviews: data.reviewCount,
        pages: data.pagesCount
    }
    const latestNews = data.latestNews ? {
        id: data.latestNews.id,
        title: data.latestNews.title,
        publishedAt: data.latestNews.publishedAt.toISOString()

    } : null

    const latestReview = data.latestReview ? {
        id: data.latestReview.id,
        author: data.latestReview.author,
        text: data.latestReview.text,
        postTitle: data.latestReview.news.title,
    } : null

    const stats = data.stats.map((stat) => ({
        id: stat.id,
        label: stat.label,
        value: stat.value,
        deltaPercent: stat.deltaPercent ?? undefined
    }))

    const activity = data.activity.map((act) => ({
        month: act.month.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
        visitors: act.visitors,
    })

    )

    return {
        requests,
        glance,
        latestNews,
        latestReview,
        stats,
        activity
    }
}
