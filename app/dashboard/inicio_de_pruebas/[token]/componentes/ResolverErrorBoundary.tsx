"use client";

import React, { Component } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ResolverErrorBoundary extends Component<ErrorBoundaryProps, { hasError: boolean }> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('[exams] Error de renderizado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center text-center p-6 font-body text-slate-700">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Ocurrió un error al mostrar la prueba
          </h2>
          <p className="text-sm max-w-md mb-6">
            No se pudo cargar la interfaz del test. Recarga la página o contacta al administrador si el problema persiste.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-[#416912] text-white font-bold hover:bg-[#34540e] cursor-pointer"
          >
            Intentar de nuevo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}