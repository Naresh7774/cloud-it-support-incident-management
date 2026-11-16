import React, { useState, useEffect } from 'react';
import { Clock, AlertOctagon, CheckCircle2 } from 'lucide-react';

const SlaTimer = ({ slaDeadline, status, isOverdue: initialOverdue }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isBreached, setIsBreached] = useState(initialOverdue || false);

  useEffect(() => {
    if (status === 'Resolved' || status === 'Closed') {
      setTimeLeft(status === 'Resolved' ? 'Resolved' : 'Closed');
      setIsBreached(false);
      return;
    }

    const calculate = () => {
      if (!slaDeadline) {
        setTimeLeft('N/A');
        return;
      }

      const deadline = new Date(slaDeadline).getTime();
      const now = Date.now();
      const diffMs = deadline - now;
      const diffMinutes = Math.floor(diffMs / 60000);

      if (diffMinutes <= 0) {
        setIsBreached(true);
        const overdueMins = Math.abs(diffMinutes);
        const hrs = Math.floor(overdueMins / 60);
        const mins = overdueMins % 60;
        setTimeLeft(hrs > 0 ? `Breached by ${hrs}h ${mins}m` : `Breached by ${mins}m`);
      } else {
        setIsBreached(false);
        const hrs = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        setTimeLeft(hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`);
      }
    };

    calculate();
    const interval = setInterval(calculate, 30000);
    return () => clearInterval(interval);
  }, [slaDeadline, status]);

  if (status === 'Resolved' || status === 'Closed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/25">
        <CheckCircle2 className="w-3.5 h-3.5" />
        SLA Met
      </span>
    );
  }

  if (isBreached) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/15 px-2.5 py-0.5 rounded-md border border-rose-500/30 animate-pulse">
        <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
        {timeLeft}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/25">
      <Clock className="w-3.5 h-3.5 text-amber-400" />
      {timeLeft}
    </span>
  );
};

export default SlaTimer;
