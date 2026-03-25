import * as React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-12 border-2 border-dashed border-rose-500/20 bg-rose-500/5 flex flex-col items-center text-center space-y-6">
          <div className="bg-rose-500/20 p-4 rounded-full text-rose-600">
            <AlertTriangle size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-foreground">{this.props.fallbackTitle || 'Componentfout'}</h3>
            <p className="text-[var(--muted-foreground)] dark:text-slate-400 max-w-md mx-auto">
              Er is een onverwachte fout opgetreden in dit onderdeel van het dashboard.
            </p>
          </div>
          <Button 
            variant="ghost" 
            leftIcon={<RotateCcw size={18} />}
            onClick={() => this.setState({ hasError: false })}
            className="text-rose-600 hover:bg-rose-500/10"
          >
            Probeer opnieuw
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}
