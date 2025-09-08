/**
 * Base Component following Open/Closed Principle
 * Open for extension, closed for modification
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Logger } from '../utils/logger';

// Component state interface
export interface BaseComponentState {
  hasError: boolean;
  error: Error | null;
  isLoading: boolean;
}

// Component props interface
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  testId?: string;
}

// Error boundary component
export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Base component class
export abstract class BaseComponent<
  P extends BaseComponentProps = BaseComponentProps,
  S extends BaseComponentState = BaseComponentState
> extends Component<P, S> {
  protected logger: Logger;

  constructor(props: P) {
    super(props);
    this.logger = new Logger(this.constructor.name);
    
    // Initialize base state
    this.state = {
      hasError: false,
      error: null,
      isLoading: false
    } as S;
  }

  // Lifecycle hooks
  componentDidMount() {
    this.logger.debug('Component mounted');
    this.onMount();
  }

  componentWillUnmount() {
    this.logger.debug('Component unmounting');
    this.onUnmount();
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.logger.error('Component error', { error, errorInfo });
    this.setState({ hasError: true, error });
  }

  // Protected methods for extension
  protected onMount(): void {
    // Override in subclasses
  }

  protected onUnmount(): void {
    // Override in subclasses
  }

  protected setLoading(isLoading: boolean): void {
    this.setState({ isLoading } as Partial<S>);
  }

  protected handleError(error: Error): void {
    this.logger.error('Error occurred', error);
    this.setState({ hasError: true, error } as Partial<S>);
  }

  // Abstract render method
  abstract renderContent(): ReactNode;

  // Final render method
  render() {
    if (this.state.hasError) {
      return this.renderError();
    }

    if (this.state.isLoading) {
      return this.renderLoading();
    }

    return (
      <div 
        className={this.props.className}
        data-testid={this.props.testId}
      >
        {this.renderContent()}
      </div>
    );
  }

  // Default error render
  protected renderError(): ReactNode {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{this.state.error?.message}</p>
      </div>
    );
  }

  // Default loading render
  protected renderLoading(): ReactNode {
    return (
      <div className="loading-container">
        <span>Loading...</span>
      </div>
    );
  }
}

// Higher-order component for adding base functionality
export function withBaseComponent<P extends BaseComponentProps>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<P> {
  return class extends Component<P, BaseComponentState> {
    logger = new Logger(WrappedComponent.name || 'Component');

    constructor(props: P) {
      super(props);
      this.state = {
        hasError: false,
        error: null,
        isLoading: false
      };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      this.logger.error('Component error', { error, errorInfo });
      this.setState({ hasError: true, error });
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="error-container">
            <h3>Error</h3>
            <p>{this.state.error?.message}</p>
          </div>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  };
}

// Composition component for combining components
export interface CompositionProps {
  components: Array<React.ComponentType<any>>;
  props?: Array<Record<string, any>>;
}

export const Composition: React.FC<CompositionProps> = ({ components, props = [] }) => {
  return (
    <>
      {components.map((Component, index) => (
        <Component key={index} {...(props[index] || {})} />
      ))}
    </>
  );
};