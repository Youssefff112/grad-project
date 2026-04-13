import React from 'react';
import { View, SafeAreaView } from 'react-native';
import { ErrorState } from './ErrorState';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log to error tracking service
    console.error('🔴 Error Boundary Caught:', error);
    console.error('Error Info:', errorInfo);

    // In production, send to error tracking service like Sentry
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={tw`flex-1 bg-[#0a0a12] dark:bg-[#0a0a12]`}>
          <ErrorState
            title="Oops! Something went wrong"
            message={this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            retryAction={{
              label: 'Try Again',
              onPress: this.handleRetry,
            }}
            showIcon={true}
          />
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
