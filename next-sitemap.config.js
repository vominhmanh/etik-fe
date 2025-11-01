/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://etik.vn',
    generateRobotsTxt: true,
    autoLastmod: false,
  
    additionalPaths: async (config) => {
      // 1. Static pages bạn muốn index
      const staticPages = [
        { loc: '/', priority: 1.0, changefreq: 'daily' },
        { loc: '/marketplace', priority: 0.9, changefreq: 'daily' },
        { loc: '/event-studio/events/create', priority: 0.5, changefreq: 'yearly' },
        { loc: '/auth/login', priority: 0.3, changefreq: 'monthly' },
        { loc: '/auth/sign-up', priority: 0.3, changefreq: 'monthly' },
      ]
  
      // 2. Fetch dynamic events từ API
      const res = await fetch('https://api.etik.vn/marketplace/events')
      const events = await res.json()
  
      const now = new Date()
  
      const dynamicEvents = events
        .map((event) => {
          const endDate = event.endDateTime ? new Date(event.endDateTime) : null
          const isEnded = endDate && endDate < now
  
          // Loại bỏ sự kiện đã kết thúc quá 6 tháng
          if (isEnded) {
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
            if (endDate < sixMonthsAgo) {
              return null
            }
          }
  
          return {
            loc: `/${event.slug}`,
            lastmod: event.startDateTime ?? new Date().toISOString(),
            priority: 0.8,
            changefreq: isEnded ? 'yearly' : 'daily',
          }
        })
        .filter(Boolean) // loại bỏ null
  
      return [...staticPages, ...dynamicEvents]
    },
  }
  