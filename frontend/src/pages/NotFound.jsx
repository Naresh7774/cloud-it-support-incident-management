import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4">
      <AlertCircle className="w-16 h-16 text-sky-600 mb-4" />
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <p className="mt-2 text-lg text-slate-600">Page not found</p>
      <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
        The requested resource or dashboard does not exist or may have been moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;
