import type { Pattern } from "../../schema.js";

export const opentelemetry: Pattern = {
  name: "OpenTelemetry",
  slug: "opentelemetry",
  description:
    "Open standard observability with OpenTelemetry. Works with Jaeger, Zipkin, and commercial backends.",
  category: "monitoring",
  tier: "free",
  complexity: "intermediate",
  tags: ["monitoring", "observability", "tracing", "opentelemetry"],
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "instrumentation.ts",
        content: `import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { Resource } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
} from "@opentelemetry/semantic-conventions";

const resource = new Resource({
  [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "nextjs-app",
  [ATTR_SERVICE_VERSION]: process.env.npm_package_version || "0.0.0",
  [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV || "development",
});

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? \`\${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces\`
    : "http://localhost:4318/v1/traces",
  headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
    ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
    : {},
});

const metricExporter = new OTLPMetricExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? \`\${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics\`
    : "http://localhost:4318/v1/metrics",
  headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
    ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
    : {},
});

const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-dns": { enabled: false },
    }),
  ],
});

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    sdk.start();

    process.on("SIGTERM", () => {
      sdk
        .shutdown()
        .then(() => console.log("OpenTelemetry SDK shut down successfully"))
        .catch((error) => console.error("Error shutting down OpenTelemetry SDK", error))
        .finally(() => process.exit(0));
    });
  }
}
`,
      },
      {
        path: "lib/telemetry/tracing.ts",
        content: `import { trace, SpanStatusCode, context, Span } from "@opentelemetry/api";

const tracer = trace.getTracer("app");

/**
 * Create a new span and execute a function within it
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: {
    attributes?: Record<string, string | number | boolean>;
  }
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (options?.attributes) {
        span.setAttributes(options.attributes);
      }
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      if (error instanceof Error) {
        span.recordException(error);
      }
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Create a synchronous span
 */
export function withSpanSync<T>(
  name: string,
  fn: (span: Span) => T,
  options?: {
    attributes?: Record<string, string | number | boolean>;
  }
): T {
  return tracer.startActiveSpan(name, (span) => {
    try {
      if (options?.attributes) {
        span.setAttributes(options.attributes);
      }
      const result = fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      if (error instanceof Error) {
        span.recordException(error);
      }
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Get the current active span
 */
export function getCurrentSpan(): Span | undefined {
  return trace.getActiveSpan();
}

/**
 * Add attributes to the current span
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
  const span = getCurrentSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

/**
 * Add an event to the current span
 */
export function addSpanEvent(
  name: string,
  attributes?: Record<string, string | number | boolean>
): void {
  const span = getCurrentSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Record an exception on the current span
 */
export function recordException(error: Error): void {
  const span = getCurrentSpan();
  if (span) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }
}

/**
 * Get the current trace context for propagation
 */
export function getTraceContext(): { traceId: string; spanId: string } | null {
  const span = getCurrentSpan();
  if (!span) return null;

  const spanContext = span.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}

/**
 * Create a linked span for async operations
 */
export function createLinkedSpan(
  name: string,
  parentContext: { traceId: string; spanId: string }
): Span {
  return tracer.startSpan(name, {
    links: [
      {
        context: {
          traceId: parentContext.traceId,
          spanId: parentContext.spanId,
          traceFlags: 1,
        },
      },
    ],
  });
}
`,
      },
      {
        path: "lib/telemetry/metrics.ts",
        content: `import { metrics, Counter, Histogram, UpDownCounter } from "@opentelemetry/api";

const meter = metrics.getMeter("app");

// Store created metrics to avoid recreation
const counters = new Map<string, Counter>();
const histograms = new Map<string, Histogram>();
const upDownCounters = new Map<string, UpDownCounter>();

/**
 * Get or create a counter metric
 */
export function getCounter(
  name: string,
  options?: {
    description?: string;
    unit?: string;
  }
): Counter {
  let counter = counters.get(name);
  if (!counter) {
    counter = meter.createCounter(name, {
      description: options?.description,
      unit: options?.unit,
    });
    counters.set(name, counter);
  }
  return counter;
}

/**
 * Get or create a histogram metric
 */
export function getHistogram(
  name: string,
  options?: {
    description?: string;
    unit?: string;
  }
): Histogram {
  let histogram = histograms.get(name);
  if (!histogram) {
    histogram = meter.createHistogram(name, {
      description: options?.description,
      unit: options?.unit,
    });
    histograms.set(name, histogram);
  }
  return histogram;
}

/**
 * Get or create an up-down counter metric
 */
export function getUpDownCounter(
  name: string,
  options?: {
    description?: string;
    unit?: string;
  }
): UpDownCounter {
  let upDownCounter = upDownCounters.get(name);
  if (!upDownCounter) {
    upDownCounter = meter.createUpDownCounter(name, {
      description: options?.description,
      unit: options?.unit,
    });
    upDownCounters.set(name, upDownCounter);
  }
  return upDownCounter;
}

/**
 * Increment a counter
 */
export function incrementCounter(
  name: string,
  value: number = 1,
  attributes?: Record<string, string | number | boolean>
): void {
  const counter = getCounter(name);
  counter.add(value, attributes);
}

/**
 * Record a histogram value
 */
export function recordHistogram(
  name: string,
  value: number,
  attributes?: Record<string, string | number | boolean>
): void {
  const histogram = getHistogram(name);
  histogram.record(value, attributes);
}

/**
 * Measure the duration of an async operation
 */
export async function measureDuration<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const histogram = getHistogram(\`\${name}.duration\`, {
    description: \`Duration of \${name}\`,
    unit: "ms",
  });

  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    histogram.record(duration, attributes);
  }
}

// Pre-defined application metrics
export const appMetrics = {
  httpRequestsTotal: getCounter("http.requests.total", {
    description: "Total number of HTTP requests",
  }),

  httpRequestDuration: getHistogram("http.request.duration", {
    description: "HTTP request duration",
    unit: "ms",
  }),

  httpRequestSize: getHistogram("http.request.size", {
    description: "HTTP request body size",
    unit: "bytes",
  }),

  httpResponseSize: getHistogram("http.response.size", {
    description: "HTTP response body size",
    unit: "bytes",
  }),

  dbQueryDuration: getHistogram("db.query.duration", {
    description: "Database query duration",
    unit: "ms",
  }),

  cacheHits: getCounter("cache.hits", {
    description: "Number of cache hits",
  }),

  cacheMisses: getCounter("cache.misses", {
    description: "Number of cache misses",
  }),

  activeConnections: getUpDownCounter("connections.active", {
    description: "Number of active connections",
  }),

  queueSize: getUpDownCounter("queue.size", {
    description: "Current queue size",
  }),
};
`,
      },
      {
        path: "lib/telemetry/index.ts",
        content: `export {
  withSpan,
  withSpanSync,
  getCurrentSpan,
  addSpanAttributes,
  addSpanEvent,
  recordException,
  getTraceContext,
  createLinkedSpan,
} from "./tracing.js";

export {
  getCounter,
  getHistogram,
  getUpDownCounter,
  incrementCounter,
  recordHistogram,
  measureDuration,
  appMetrics,
} from "./metrics.js";
`,
      },
      {
        path: ".env.example",
        content: `# OpenTelemetry Configuration
# Service name for identification in traces
OTEL_SERVICE_NAME="my-nextjs-app"

# OTLP Exporter endpoint
# For local development with Jaeger: http://localhost:4318
# For Honeycomb: https://api.honeycomb.io
# For Grafana Cloud: https://otlp-gateway-prod-us-central-0.grafana.net/otlp
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"

# Optional: Headers for authentication (JSON format)
# For Honeycomb: {"x-honeycomb-team":"your-api-key"}
# For Grafana: {"Authorization":"Basic base64-encoded-credentials"}
OTEL_EXPORTER_OTLP_HEADERS="{}"

# Enable debug logging (optional)
OTEL_LOG_LEVEL="info"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [
      { name: "@opentelemetry/api" },
      { name: "@opentelemetry/sdk-node" },
      { name: "@opentelemetry/auto-instrumentations-node" },
      { name: "@opentelemetry/exporter-trace-otlp-http" },
      { name: "@opentelemetry/exporter-metrics-otlp-http" },
      { name: "@opentelemetry/sdk-metrics" },
      { name: "@opentelemetry/resources" },
      { name: "@opentelemetry/semantic-conventions" },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
