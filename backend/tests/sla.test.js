const {
  calculateSlaDeadline,
  isTicketOverdue,
  getSlaTimeRemaining,
  DEFAULT_SLA_TARGETS
} = require('../src/utils/slaCalculator');

describe('SLA Calculator Unit Tests', () => {
  const baseTime = new Date('2026-01-01T12:00:00Z');

  test('should accurately calculate Critical priority deadline (15 minutes)', async () => {
    const deadline = await calculateSlaDeadline('Critical', baseTime, DEFAULT_SLA_TARGETS);
    const expected = new Date('2026-01-01T12:15:00Z');
    expect(deadline.getTime()).toBe(expected.getTime());
  });

  test('should accurately calculate High priority deadline (60 minutes)', async () => {
    const deadline = await calculateSlaDeadline('High', baseTime, DEFAULT_SLA_TARGETS);
    const expected = new Date('2026-01-01T13:00:00Z');
    expect(deadline.getTime()).toBe(expected.getTime());
  });

  test('should accurately calculate Medium priority deadline (240 minutes)', async () => {
    const deadline = await calculateSlaDeadline('Medium', baseTime, DEFAULT_SLA_TARGETS);
    const expected = new Date('2026-01-01T16:00:00Z');
    expect(deadline.getTime()).toBe(expected.getTime());
  });

  test('should accurately calculate Low priority deadline (480 minutes)', async () => {
    const deadline = await calculateSlaDeadline('Low', baseTime, DEFAULT_SLA_TARGETS);
    const expected = new Date('2026-01-01T20:00:00Z');
    expect(deadline.getTime()).toBe(expected.getTime());
  });

  test('should identify ticket as overdue if deadline has passed and ticket is Open', () => {
    const pastDeadline = new Date(Date.now() - 1000 * 60 * 30); // 30 mins ago
    const ticket = {
      status: 'Open',
      sla_deadline: pastDeadline
    };
    expect(isTicketOverdue(ticket)).toBe(true);
  });

  test('should NOT identify ticket as overdue if status is Resolved even if past deadline', () => {
    const pastDeadline = new Date(Date.now() - 1000 * 60 * 30);
    const ticket = {
      status: 'Resolved',
      sla_deadline: pastDeadline
    };
    expect(isTicketOverdue(ticket)).toBe(false);
  });

  test('should NOT identify ticket as overdue if status is Closed', () => {
    const pastDeadline = new Date(Date.now() - 1000 * 60 * 30);
    const ticket = {
      status: 'Closed',
      sla_deadline: pastDeadline
    };
    expect(isTicketOverdue(ticket)).toBe(false);
  });

  test('should NOT identify ticket as overdue if deadline is in the future', () => {
    const futureDeadline = new Date(Date.now() + 1000 * 60 * 60); // 1 hour in future
    const ticket = {
      status: 'In Progress',
      sla_deadline: futureDeadline
    };
    expect(isTicketOverdue(ticket)).toBe(false);
  });

  test('should format time remaining properly for overdue vs active', () => {
    const futureDeadline = new Date(Date.now() + 1000 * 60 * 125); // ~2h 5m
    const futureResult = getSlaTimeRemaining(futureDeadline);
    expect(futureResult.isOverdue).toBe(false);
    expect(futureResult.minutesRemaining).toBeGreaterThan(0);
    expect(futureResult.formatted).toContain('remaining');

    const pastDeadline = new Date(Date.now() - 1000 * 60 * 45); // ~45m ago
    const pastResult = getSlaTimeRemaining(pastDeadline);
    expect(pastResult.isOverdue).toBe(true);
    expect(pastResult.formatted).toContain('Overdue by');
  });
});
