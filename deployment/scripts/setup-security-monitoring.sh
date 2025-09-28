#!/bin/bash
#
# Security Monitoring Setup Script
# Configures logging and alerting for Session 4A security events
#

set -euo pipefail

ENVIRONMENT=${1:-"staging"}
LOGGING_PLATFORM=${LOGGING_PLATFORM:-"auto"}

echo "🔒 Security Monitoring Setup - Session 4A"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo "Logging Platform: $LOGGING_PLATFORM"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detect logging platform if set to auto
detect_logging_platform() {
    if [[ "$LOGGING_PLATFORM" == "auto" ]]; then
        if command -v kubectl >/dev/null 2>&1 && kubectl get nodes >/dev/null 2>&1; then
            LOGGING_PLATFORM="kubernetes"
        elif command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
            LOGGING_PLATFORM="docker"
        elif [[ -n "${VERCEL_ENV:-}" ]]; then
            LOGGING_PLATFORM="vercel"
        elif [[ -n "${RAILWAY_ENVIRONMENT:-}" ]]; then
            LOGGING_PLATFORM="railway"
        else
            LOGGING_PLATFORM="generic"
        fi
        echo "Auto-detected platform: $LOGGING_PLATFORM"
    fi
}

# Setup log aggregation configuration
setup_log_aggregation() {
    echo -e "${BLUE}Setting up log aggregation${NC}"
    echo "=========================="

    case "$LOGGING_PLATFORM" in
        "kubernetes")
            setup_kubernetes_logging
            ;;
        "docker")
            setup_docker_logging
            ;;
        "vercel")
            setup_vercel_logging
            ;;
        "railway")
            setup_railway_logging
            ;;
        "aws")
            setup_aws_logging
            ;;
        "gcp")
            setup_gcp_logging
            ;;
        *)
            setup_generic_logging
            ;;
    esac
}

# Kubernetes logging setup
setup_kubernetes_logging() {
    echo "Setting up Kubernetes logging..."

    # Create ConfigMap for Fluent Bit security log parsing
    cat > /tmp/fluent-bit-security.conf << 'EOF'
[FILTER]
    Name grep
    Match medusa.*
    Regex log securityEvent.*true

[FILTER]
    Name parser
    Match medusa.*
    Key_Name log
    Parser security_json
    Reserve_Data On

[OUTPUT]
    Name forward
    Match medusa.*
    Host ${LOGGING_HOST}
    Port ${LOGGING_PORT}
    Tag security.medusa.${ENVIRONMENT}

[PARSER]
    Name security_json
    Format json
    Time_Key timestamp
    Time_Format %Y-%m-%dT%H:%M:%S.%LZ
EOF

    # Apply ConfigMap
    kubectl create configmap fluent-bit-security-config \
        --from-file=fluent-bit.conf=/tmp/fluent-bit-security.conf \
        --dry-run=client -o yaml | kubectl apply -f -

    # Clean up
    rm -f /tmp/fluent-bit-security.conf

    echo -e "${GREEN}✅ Kubernetes logging configuration created${NC}"
}

# Docker logging setup
setup_docker_logging() {
    echo "Setting up Docker logging..."

    # Create docker-compose logging override
    cat > docker-compose.logging.yml << 'EOF'
version: '3.8'
services:
  medusa-backend:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"
        labels: "service=medusa,environment=${ENVIRONMENT}"

  # Log aggregator (if using centralized logging)
  fluent-bit:
    image: fluent/fluent-bit:latest
    volumes:
      - ./logging/fluent-bit.conf:/fluent-bit/etc/fluent-bit.conf:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/log:/var/log:ro
    environment:
      - ENVIRONMENT=${ENVIRONMENT}
    depends_on:
      - medusa-backend
EOF

    # Create Fluent Bit configuration
    mkdir -p logging
    cat > logging/fluent-bit.conf << 'EOF'
[SERVICE]
    Flush 1
    Log_Level info
    Parsers_File parsers.conf

[INPUT]
    Name tail
    Path /var/lib/docker/containers/*/*-json.log
    Parser docker
    Tag docker.*
    Refresh_Interval 5

[FILTER]
    Name grep
    Match docker.*
    Regex log "securityEvent.*true"

[FILTER]
    Name parser
    Match docker.*
    Key_Name log
    Parser security_json
    Reserve_Data On

[OUTPUT]
    Name stdout
    Match docker.*
    Format json_lines
EOF

    echo -e "${GREEN}✅ Docker logging configuration created${NC}"
}

# Vercel logging setup
setup_vercel_logging() {
    echo "Setting up Vercel logging..."

    echo "For Vercel deployments:"
    echo "1. Security events are automatically captured in Vercel logs"
    echo "2. Use 'vercel logs' to view real-time logs"
    echo "3. Configure log drains for centralized logging:"
    echo ""
    echo "   vercel env add LOG_DRAIN_URL"
    echo "   # Set to your log aggregation service URL"
    echo ""

    echo -e "${GREEN}✅ Vercel logging guidance provided${NC}"
}

# Railway logging setup
setup_railway_logging() {
    echo "Setting up Railway logging..."

    echo "For Railway deployments:"
    echo "1. Security events are available in Railway dashboard logs"
    echo "2. Configure log shipping via environment variables:"
    echo ""
    echo "   railway variables set LOG_SHIPPING_URL=<your-log-service>"
    echo "   railway variables set LOG_LEVEL=info"
    echo ""

    echo -e "${GREEN}✅ Railway logging guidance provided${NC}"
}

# Generic logging setup
setup_generic_logging() {
    echo "Setting up generic logging..."

    cat > logging-config.md << 'EOF'
# Security Logging Configuration

## Application Logs
Security events are logged with the following format:
```json
{
  "securityEvent": true,
  "type": "admin_login_success",
  "severity": "low",
  "category": "authentication",
  "actorId": "user_123",
  "email": "admin@example.com",
  "ipAddress": "192.168.1.100",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "requestId": "req_123456789"
}
```

## Log Patterns to Monitor
- `securityEvent:true` - All security events
- `severity:high` or `severity:critical` - High priority events
- `type:admin_login_failure` - Failed login attempts
- `type:permission_denied` - Authorization failures
- `category:sync` AND `success:false` - Sync operation failures

## Recommended Alerts
1. Failed login threshold: >5 failures from same IP in 10 minutes
2. Critical security events: Any event with severity="critical"
3. Permission denials: >10 denials from same user in 5 minutes
4. Sync failures: Any materials sync failure
EOF

    echo -e "${GREEN}✅ Generic logging configuration documented${NC}"
}

# Setup security event alerts
setup_security_alerts() {
    echo -e "${BLUE}Setting up security alerts${NC}"
    echo "========================="

    case "$LOGGING_PLATFORM" in
        "kubernetes")
            setup_kubernetes_alerts
            ;;
        "docker")
            setup_docker_alerts
            ;;
        *)
            setup_generic_alerts
            ;;
    esac
}

# Kubernetes alerts (Prometheus/AlertManager)
setup_kubernetes_alerts() {
    echo "Creating Kubernetes security alerts..."

    cat > /tmp/security-alerts.yml << 'EOF'
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: medusa-security-alerts
  namespace: default
spec:
  groups:
  - name: medusa.security
    rules:
    - alert: HighFailedLoginRate
      expr: increase(medusa_security_events_total{type="admin_login_failure"}[10m]) > 5
      for: 0m
      labels:
        severity: warning
        service: medusa
      annotations:
        summary: "High failed login rate detected"
        description: "More than 5 failed login attempts in 10 minutes"

    - alert: CriticalSecurityEvent
      expr: increase(medusa_security_events_total{severity="critical"}[1m]) > 0
      for: 0m
      labels:
        severity: critical
        service: medusa
      annotations:
        summary: "Critical security event detected"
        description: "Critical security event occurred: {{ $labels.type }}"

    - alert: MaterialsSyncFailure
      expr: increase(medusa_security_events_total{category="sync",success="false"}[5m]) > 0
      for: 0m
      labels:
        severity: warning
        service: medusa
      annotations:
        summary: "Materials sync failure"
        description: "Materials sync operation failed"
EOF

    kubectl apply -f /tmp/security-alerts.yml
    rm -f /tmp/security-alerts.yml

    echo -e "${GREEN}✅ Kubernetes security alerts configured${NC}"
}

# Docker alerts (basic monitoring)
setup_docker_alerts() {
    echo "Creating Docker monitoring script..."

    cat > monitor-security-events.sh << 'EOF'
#!/bin/bash
#
# Basic security event monitoring for Docker deployments
#

CONTAINER_NAME=${1:-"medusa-backend"}
CHECK_INTERVAL=${2:-60}

echo "Monitoring security events in container: $CONTAINER_NAME"
echo "Check interval: ${CHECK_INTERVAL}s"

# Counters
failed_logins=0
critical_events=0
last_check=$(date +%s)

while true; do
    current_time=$(date +%s)
    time_window=$((current_time - CHECK_INTERVAL))

    # Check for failed logins in last interval
    recent_failures=$(docker logs --since="${CHECK_INTERVAL}s" "$CONTAINER_NAME" 2>/dev/null | \
                     grep -c "admin_login_failure" || echo "0")

    if [[ "$recent_failures" -gt 5 ]]; then
        echo "ALERT: High failed login rate - $recent_failures failures in ${CHECK_INTERVAL}s"
        # Send notification (customize based on your notification system)
        # curl -X POST "$WEBHOOK_URL" -d "Failed login alert: $recent_failures failures"
    fi

    # Check for critical events
    critical_recent=$(docker logs --since="${CHECK_INTERVAL}s" "$CONTAINER_NAME" 2>/dev/null | \
                     grep -c "severity.*critical" || echo "0")

    if [[ "$critical_recent" -gt 0 ]]; then
        echo "CRITICAL ALERT: $critical_recent critical security events detected"
        # Send critical notification
    fi

    sleep "$CHECK_INTERVAL"
done
EOF

    chmod +x monitor-security-events.sh

    echo -e "${GREEN}✅ Docker monitoring script created${NC}"
    echo "Start monitoring with: ./monitor-security-events.sh"
}

# Generic alerts configuration
setup_generic_alerts() {
    echo "Creating generic alert configuration..."

    cat > security-alerts-config.json << 'EOF'
{
  "security_alerts": {
    "failed_login_threshold": {
      "query": "type:admin_login_failure",
      "threshold": 5,
      "window": "10m",
      "severity": "warning",
      "description": "High failed login rate detected"
    },
    "critical_events": {
      "query": "severity:critical",
      "threshold": 1,
      "window": "1m",
      "severity": "critical",
      "description": "Critical security event occurred"
    },
    "permission_denials": {
      "query": "type:permission_denied",
      "threshold": 10,
      "window": "5m",
      "severity": "warning",
      "description": "High permission denial rate"
    },
    "sync_failures": {
      "query": "category:sync AND success:false",
      "threshold": 1,
      "window": "5m",
      "severity": "warning",
      "description": "Materials sync operation failed"
    }
  }
}
EOF

    echo -e "${GREEN}✅ Generic alert configuration created${NC}"
    echo "Configure these alerts in your monitoring system"
}

# Create log parsing utilities
create_log_utilities() {
    echo -e "${BLUE}Creating log parsing utilities${NC}"
    echo "============================="

    # Security event extractor
    cat > extract-security-events.sh << 'EOF'
#!/bin/bash
#
# Extract and analyze security events from logs
#

LOG_FILE=${1:-"/var/log/medusa/app.log"}
TIME_WINDOW=${2:-"1h"}

echo "Extracting security events from: $LOG_FILE"
echo "Time window: $TIME_WINDOW"
echo ""

# Extract security events
if [[ -f "$LOG_FILE" ]]; then
    # Get events from specified time window
    since_time=$(date -d "$TIME_WINDOW ago" '+%Y-%m-%dT%H:%M:%S')

    echo "Security events since $since_time:"
    echo "=================================="

    grep "securityEvent.*true" "$LOG_FILE" | \
    awk -v since="$since_time" '
    {
        # Extract timestamp (assuming ISO format)
        match($0, /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}/)
        timestamp = substr($0, RSTART, RLENGTH)

        if (timestamp >= since) {
            print $0
        }
    }' | \
    jq -r '. | "\(.timestamp) [\(.severity | ascii_upcase)] \(.type): \(.email // .actorId // "unknown") from \(.ipAddress // "unknown")"' 2>/dev/null || \
    cat

else
    echo "Log file not found: $LOG_FILE"
    echo "For Docker: docker logs <container_name> | grep 'securityEvent.*true'"
    echo "For systemd: journalctl -u medusa -f | grep 'securityEvent.*true'"
fi
EOF

    chmod +x extract-security-events.sh

    # Security metrics generator
    cat > security-metrics.sh << 'EOF'
#!/bin/bash
#
# Generate security metrics summary
#

LOG_FILE=${1:-"/var/log/medusa/app.log"}
TIME_WINDOW=${2:-"24h"}

echo "Security Metrics Summary"
echo "======================="
echo "Log file: $LOG_FILE"
echo "Time window: $TIME_WINDOW"
echo ""

if [[ -f "$LOG_FILE" ]] || [[ "$LOG_FILE" == "-" ]]; then
    # Count events by type
    echo "Event counts by type:"
    grep "securityEvent.*true" "$LOG_FILE" 2>/dev/null | \
    jq -r '.type' 2>/dev/null | \
    sort | uniq -c | sort -nr || echo "No security events found"

    echo ""
    echo "Event counts by severity:"
    grep "securityEvent.*true" "$LOG_FILE" 2>/dev/null | \
    jq -r '.severity' 2>/dev/null | \
    sort | uniq -c | sort -nr || echo "No security events found"

    echo ""
    echo "Top IP addresses:"
    grep "securityEvent.*true" "$LOG_FILE" 2>/dev/null | \
    jq -r '.ipAddress // "unknown"' 2>/dev/null | \
    sort | uniq -c | sort -nr | head -10 || echo "No IP data found"

else
    echo "Log file not found. Usage examples:"
    echo "  $0 /var/log/medusa/app.log 1h"
    echo "  docker logs medusa-backend | $0 - 1h"
fi
EOF

    chmod +x security-metrics.sh

    echo -e "${GREEN}✅ Log parsing utilities created${NC}"
}

# Main execution
main() {
    detect_logging_platform
    setup_log_aggregation
    setup_security_alerts
    create_log_utilities

    echo ""
    echo -e "${BLUE}Security Monitoring Setup Summary${NC}"
    echo "================================="
    echo "✅ Log aggregation configured for $LOGGING_PLATFORM"
    echo "✅ Security alerts configured"
    echo "✅ Log parsing utilities created"
    echo ""

    echo "Next steps:"
    echo "1. Test log aggregation with: ./extract-security-events.sh"
    echo "2. Monitor metrics with: ./security-metrics.sh"
    echo "3. Verify alerts are working in your monitoring system"
    echo "4. Configure notification channels (Slack, email, etc.)"
    echo ""

    echo -e "${GREEN}🎉 Security monitoring setup complete!${NC}"
}

# Handle help
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    echo "Usage: $0 <environment> [logging_platform]"
    echo ""
    echo "Sets up security monitoring for Session 4A implementation"
    echo ""
    echo "Environments: production, staging, local"
    echo "Platforms: kubernetes, docker, vercel, railway, aws, gcp, generic"
    exit 0
fi

# Run main function
main "$@"