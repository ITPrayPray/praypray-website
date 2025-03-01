'use client';

import React from 'react';

interface ErrorDisplayProps {
  message: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-red-500">錯誤</h1>
      <p>無法加載詳細資料。請返回並重試。</p>
      <p className="text-gray-500">{message}</p>
      <button 
        onClick={() => window.history.back()}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        返回
      </button>
    </div>
  );
};

export default ErrorDisplay;