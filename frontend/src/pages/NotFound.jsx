import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-navy-900 flex flex-col justify-center items-center px-4 text-center selection:bg-brand-primary/30">
      <div className="bg-dark-card border border-dark-border p-8 sm:p-12 rounded-3xl shadow-2xl max-w-md w-full flex flex-col items-center">
        <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl text-brand-accent mb-4">
          <AlertCircle className="w-12 h-12" />
        </div>
        <span className="text-5xl font-black text-white tracking-tight font-mono">404</span>
        <h1 className="mt-2 text-lg font-bold text-white">Route Not Found</h1>
        <p className="text-xs text-dark-muted mt-1.5 leading-relaxed">
          The requested portal resource does not exist or has been relocated to another workspace.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-primary/20 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Portal Root
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
