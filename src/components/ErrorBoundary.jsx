import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#040714',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div className="glass-card liquid-glass-panel" style={{
            maxWidth: 480,
            width: '100%',
            padding: 32,
            textAlign: 'center',
            borderRadius: 24,
            border: '1px solid rgba(244, 63, 94, 0.4)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(244, 63, 94, 0.2)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary, #94a3b8)', marginBottom: 20, lineHeight: 1.5 }}>
              The application encountered an unexpected state. Your local data and progress in offline storage remain safe.
            </p>
            <button
              className="btn btn-primary"
              onClick={this.handleReload}
              style={{ padding: '10px 24px', fontSize: 14 }}
            >
              🔄 Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
