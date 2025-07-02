// Performance monitoring utilities
export interface PerformanceMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  TTI?: number; // Time to Interactive
  customMetrics?: Record<string, number>;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  timestamp: number;
  userAgent: string;
  userId?: string;
  sessionId: string;
  componentStack?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private errors: ErrorReport[] = [];
  private sessionId: string;
  private isInitialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  init() {
    if (this.isInitialized) return;
    
    this.observeCoreWebVitals();
    this.observeErrors();
    this.observeNavigation();
    this.observeResources();
    
    this.isInitialized = true;
  }

  private observeCoreWebVitals() {
    if (typeof window === 'undefined') return;
    
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            this.metrics.FCP = fcpEntry.startTime;
            this.reportMetric('FCP', fcpEntry.startTime);
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.warn('FCP observer failed:', e);
      }

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            this.metrics.LCP = lastEntry.startTime;
            this.reportMetric('LCP', lastEntry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observer failed:', e);
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.FID = entry.processingStart - entry.startTime;
            this.reportMetric('FID', this.metrics.FID);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID observer failed:', e);
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.CLS = clsValue;
          this.reportMetric('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observer failed:', e);
      }
    }
  }

  private observeErrors() {
    if (typeof window === 'undefined') return;
    
    // Global error handler
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
      });
    });
  }

  private observeNavigation() {
    if (typeof window === 'undefined') return;
    
    // Navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.entryType === 'navigation') {
              this.metrics.TTFB = entry.responseStart - entry.requestStart;
              this.metrics.TTI = entry.domInteractive - entry.fetchStart;
              
              this.reportMetric('TTFB', this.metrics.TTFB);
              this.reportMetric('TTI', this.metrics.TTI);
            }
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('Navigation observer failed:', e);
      }
    }
  }

  private observeResources() {
    if (typeof window === 'undefined') return;
    
    // Resource timing
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
              this.reportMetric('API_CALL', entry.duration);
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (e) {
        console.warn('Resource observer failed:', e);
      }
    }
  }

  // Custom metric tracking
  trackMetric(name: string, value: number) {
    this.metrics.customMetrics = this.metrics.customMetrics || {};
    this.metrics.customMetrics[name] = value;
    this.reportMetric(name, value);
  }

  // Component render timing
  trackComponentRender(componentName: string, renderTime: number) {
    this.trackMetric(`COMPONENT_RENDER_${componentName}`, renderTime);
  }

  // API call timing
  trackApiCall(endpoint: string, duration: number, status: number) {
    this.trackMetric(`API_${endpoint}_${status}`, duration);
  }

  // User interaction timing
  trackUserInteraction(action: string, duration: number) {
    this.trackMetric(`USER_INTERACTION_${action}`, duration);
  }

  // Report metric to analytics
  private reportMetric(name: string, value: number) {
    // Send to your analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Google Analytics, Mixpanel, etc.
      console.log(`[Performance] ${name}: ${value}ms`);
      
      // You can send to your backend API
      this.sendToAnalytics({
        type: 'metric',
        name,
        value,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        url: typeof window !== 'undefined' ? window.location.href : '',
      });
    }
  }

  // Report error to analytics
  reportError(error: ErrorReport) {
    this.errors.push(error);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('[Error]', error);
      
      // Send to your error tracking service
      this.sendToAnalytics({
        type: 'error',
        ...error,
      });
    }
  }

  // Send data to analytics service
  private async sendToAnalytics(data: any) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.warn('Failed to send analytics data:', error);
    }
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get error reports
  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  // Get session ID
  getSessionId(): string {
    return this.sessionId;
  }

  // Performance mark and measure utilities
  mark(name: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(name);
    }
  }

  measure(name: string, startMark: string, endMark?: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        const measure = performance.measure(name, startMark, endMark);
        this.trackMetric(name, measure.duration);
        return measure.duration;
      } catch (e) {
        console.warn(`Failed to measure ${name}:`, e);
      }
    }
    return 0;
  }

  // Clear performance marks
  clearMarks(name?: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      if (name) {
        performance.clearMarks(name);
      } else {
        performance.clearMarks();
      }
    }
  }

  // Clear performance measures
  clearMeasures(name?: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      if (name) {
        performance.clearMeasures(name);
      } else {
        performance.clearMeasures();
      }
    }
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = new PerformanceMonitor();
  
  return {
    init: () => monitor.init(),
    trackMetric: (name: string, value: number) => monitor.trackMetric(name, value),
    trackComponentRender: (componentName: string, renderTime: number) => 
      monitor.trackComponentRender(componentName, renderTime),
    trackApiCall: (endpoint: string, duration: number, status: number) => 
      monitor.trackApiCall(endpoint, duration, status),
    trackUserInteraction: (action: string, duration: number) => 
      monitor.trackUserInteraction(action, duration),
    mark: (name: string) => monitor.mark(name),
    measure: (name: string, startMark: string, endMark?: string) => 
      monitor.measure(name, startMark, endMark),
    getMetrics: () => monitor.getMetrics(),
    getSessionId: () => monitor.getSessionId(),
  };
};

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Basic performance monitoring
export const basicPerformanceMonitor = {
  init() {
    if (typeof window !== 'undefined') {
      console.log('Performance monitoring initialized');
    }
  },
  
  trackMetric(name: string, value: number) {
    if (process.env.NODE_ENV === 'production') {
      console.log(`[Performance] ${name}: ${value}ms`);
    }
  },
  
  trackError(error: any) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Error]', error);
    }
  }
}; 