const { pool } = require('../config/db');

const analyticsController = {
  async getAnalytics(req, res, next) {
    try {
      // 1. Overall MTTR & SLA Compliance
      const [kpiRows] = await pool.query(`
        SELECT 
          COUNT(*) as total_tickets,
          SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as resolved_tickets,
          AVG(CASE WHEN status IN ('Resolved', 'Closed') AND resolved_at IS NOT NULL 
              THEN TIMESTAMPDIFF(MINUTE, created_at, resolved_at) ELSE NULL END) as avg_resolution_minutes,
          SUM(CASE WHEN status IN ('Resolved', 'Closed') AND resolved_at <= sla_deadline THEN 1 ELSE 0 END) as sla_met_count,
          SUM(CASE WHEN (status IN ('Resolved', 'Closed') AND resolved_at > sla_deadline) OR (status NOT IN ('Resolved', 'Closed') AND UTC_TIMESTAMP() > sla_deadline) THEN 1 ELSE 0 END) as sla_breached_count
        FROM tickets
      `);

      const totalResolved = Number(kpiRows[0]?.resolved_tickets || 0);
      const avgMinutes = Math.round(Number(kpiRows[0]?.avg_resolution_minutes || 0));
      const slaMet = Number(kpiRows[0]?.sla_met_count || 0);
      const slaBreached = Number(kpiRows[0]?.sla_breached_count || 0);
      const totalEvaluated = slaMet + slaBreached;
      const slaComplianceRate = totalEvaluated > 0 ? Math.round((slaMet / totalEvaluated) * 100) : 100;

      // 2. Performance by Engineer
      const [engineerRows] = await pool.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(t.id) as total_assigned,
          SUM(CASE WHEN t.status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as total_resolved,
          AVG(CASE WHEN t.status IN ('Resolved', 'Closed') AND t.resolved_at IS NOT NULL 
              THEN TIMESTAMPDIFF(MINUTE, t.created_at, t.resolved_at) ELSE NULL END) as avg_resolution_mins
        FROM users u
        LEFT JOIN tickets t ON u.id = t.assigned_to
        WHERE u.role IN ('engineer', 'admin')
        GROUP BY u.id, u.name, u.email
        ORDER BY total_resolved DESC, total_assigned DESC
      `);

      // 3. Category Breakdown & Average Resolution Time
      const [categoryRows] = await pool.query(`
        SELECT 
          category,
          COUNT(*) as count,
          AVG(CASE WHEN status IN ('Resolved', 'Closed') AND resolved_at IS NOT NULL 
              THEN TIMESTAMPDIFF(MINUTE, created_at, resolved_at) ELSE NULL END) as avg_resolution_mins
        FROM tickets
        GROUP BY category
        ORDER BY count DESC
      `);

      // 4. Ticket Volume Timeline (last 7 days)
      const [trendRows] = await pool.query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m-%d') as date,
          COUNT(*) as created_count,
          SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as resolved_count
        FROM tickets
        WHERE created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY date ASC
      `);

      return res.status(200).json({
        success: true,
        data: {
          overview: {
            totalTickets: Number(kpiRows[0]?.total_tickets || 0),
            totalResolved,
            mttrMinutes: avgMinutes,
            mttrFormatted: avgMinutes > 60 ? `${Math.floor(avgMinutes / 60)}h ${avgMinutes % 60}m` : `${avgMinutes}m`,
            slaComplianceRate,
            slaMetCount: slaMet,
            slaBreachedCount: slaBreached
          },
          engineerLeaderboard: engineerRows.map(e => ({
            ...e,
            avg_resolution_mins: Math.round(Number(e.avg_resolution_mins || 0)),
            avg_formatted: Number(e.avg_resolution_mins) > 60 
              ? `${Math.floor(e.avg_resolution_mins / 60)}h ${Math.round(e.avg_resolution_mins % 60)}m` 
              : `${Math.round(e.avg_resolution_mins || 0)}m`
          })),
          categoryPerformance: categoryRows.map(c => ({
            ...c,
            avg_resolution_mins: Math.round(Number(c.avg_resolution_mins || 0))
          })),
          dailyTrends: trendRows
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = analyticsController;
