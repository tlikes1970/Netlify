/**
 * Security Scanner System
 * Purpose: Scan for security vulnerabilities and best practices
 * Data Source: DOM analysis and runtime checks
 * Update Path: Add new security checks as needed
 * Dependencies: None
 */

export class SecurityScanner {
  constructor() {
    this.vulnerabilities = [];
    this.warnings = [];
    this.checks = [];
    this.isEnabled = true;

    this.init();
  }

  init() {
    if (!this.isEnabled) return;

    // Run security checks
    this.checkCSP();
    this.checkXSSVulnerabilities();
    this.checkInsecureContent();
    this.checkAuthentication();
    this.checkDataValidation();
    this.checkErrorHandling();
    this.checkDependencies();

    console.log("🔒 Security scanner initialized");
  }

  // Check Content Security Policy
  checkCSP() {
    const cspMeta = document.querySelector(
      'meta[http-equiv="Content-Security-Policy"]'
    );

    if (!cspMeta) {
      this.addVulnerability(
        "CSP_MISSING",
        "Content Security Policy not implemented",
        "high"
      );
      return;
    }

    const csp = cspMeta.getAttribute("content");

    // Check for unsafe directives
    if (csp.includes("'unsafe-inline'")) {
      this.addWarning(
        "CSP_UNSAFE_INLINE",
        "CSP allows unsafe-inline",
        "medium"
      );
    }

    if (csp.includes("'unsafe-eval'")) {
      this.addWarning("CSP_UNSAFE_EVAL", "CSP allows unsafe-eval", "high");
    }

    // Check for missing directives
    if (!csp.includes("default-src")) {
      this.addWarning(
        "CSP_NO_DEFAULT_SRC",
        "CSP missing default-src directive",
        "medium"
      );
    }

    if (!csp.includes("script-src")) {
      this.addWarning(
        "CSP_NO_SCRIPT_SRC",
        "CSP missing script-src directive",
        "high"
      );
    }
  }

  // Check for XSS vulnerabilities
  checkXSSVulnerabilities() {
    // Check for innerHTML usage
    const scripts = document.querySelectorAll("script");
    scripts.forEach((script) => {
      if (script.textContent.includes("innerHTML")) {
        this.addWarning(
          "XSS_INNERHTML",
          "Potential XSS vulnerability: innerHTML usage",
          "high"
        );
      }

      if (script.textContent.includes("insertAdjacentHTML")) {
        this.addWarning(
          "XSS_INSERT_ADJACENT",
          "Potential XSS vulnerability: insertAdjacentHTML usage",
          "high"
        );
      }

      if (script.textContent.includes("document.write")) {
        this.addWarning(
          "XSS_DOCUMENT_WRITE",
          "Potential XSS vulnerability: document.write usage",
          "high"
        );
      }

      if (script.textContent.includes("eval(")) {
        this.addVulnerability(
          "XSS_EVAL",
          "Critical XSS vulnerability: eval() usage",
          "critical"
        );
      }

      if (script.textContent.includes("new Function")) {
        this.addVulnerability(
          "XSS_NEW_FUNCTION",
          "Critical XSS vulnerability: new Function() usage",
          "critical"
        );
      }
    });

    // Check for dangerous URL patterns
    const links = document.querySelectorAll("a[href]");
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (
        href &&
        (href.startsWith("javascript:") || href.startsWith("data:"))
      ) {
        this.addWarning(
          "XSS_DANGEROUS_URL",
          "Potentially dangerous URL: " + href,
          "medium"
        );
      }
    });
  }

  // Check for insecure content
  checkInsecureContent() {
    // Check for mixed content
    if (location.protocol === "https:") {
      const images = document.querySelectorAll("img[src]");
      images.forEach((img) => {
        const src = img.getAttribute("src");
        if (src && src.startsWith("http:")) {
          this.addWarning(
            "MIXED_CONTENT_IMAGE",
            "Mixed content: HTTP image on HTTPS page",
            "medium"
          );
        }
      });

      const scripts = document.querySelectorAll("script[src]");
      scripts.forEach((script) => {
        const src = script.getAttribute("src");
        if (src && src.startsWith("http:")) {
          this.addVulnerability(
            "MIXED_CONTENT_SCRIPT",
            "Mixed content: HTTP script on HTTPS page",
            "high"
          );
        }
      });
    }

    // Check for missing security headers
    this.checkSecurityHeaders();
  }

  // Check security headers
  checkSecurityHeaders() {
    const requiredHeaders = [
      "X-Content-Type-Options",
      "X-Frame-Options",
      "X-XSS-Protection",
      "Referrer-Policy",
    ];

    // Note: We can't directly check response headers from client-side
    // This would need to be done server-side or via a security testing tool
    this.addInfo(
      "HEADERS_CHECK",
      "Security headers should be verified server-side",
      "info"
    );
  }

  // Check authentication implementation
  checkAuthentication() {
    // Check for hardcoded credentials
    const scripts = document.querySelectorAll("script");
    scripts.forEach((script) => {
      const content = script.textContent;

      // Check for API keys
      if (content.includes("api_key") || content.includes("apikey")) {
        this.addWarning(
          "AUTH_HARDCODED_KEY",
          "Potential hardcoded API key found",
          "high"
        );
      }

      // Check for passwords
      if (content.includes("password") && content.includes("=")) {
        this.addWarning(
          "AUTH_HARDCODED_PASSWORD",
          "Potential hardcoded password found",
          "high"
        );
      }
    });

    // Check for secure authentication patterns
    const authButtons = document.querySelectorAll(
      "[data-action*='auth'], [data-action*='login'], [data-action*='signin']"
    );
    if (authButtons.length === 0) {
      this.addInfo(
        "AUTH_NO_BUTTONS",
        "No authentication buttons found",
        "info"
      );
    }
  }

  // Check data validation
  checkDataValidation() {
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      const inputs = form.querySelectorAll("input, textarea, select");
      inputs.forEach((input) => {
        // Check for input validation
        if (!input.hasAttribute("required") && input.type !== "hidden") {
          this.addWarning(
            "VALIDATION_MISSING_REQUIRED",
            "Input missing required attribute",
            "low"
          );
        }

        // Check for input sanitization
        if (input.type === "text" || input.type === "textarea") {
          this.addInfo(
            "VALIDATION_SANITIZATION",
            "Consider input sanitization for text inputs",
            "info"
          );
        }
      });
    });
  }

  // Check error handling
  checkErrorHandling() {
    const scripts = document.querySelectorAll("script");
    let hasErrorHandling = false;

    scripts.forEach((script) => {
      if (
        script.textContent.includes("try") &&
        script.textContent.includes("catch")
      ) {
        hasErrorHandling = true;
      }
    });

    if (!hasErrorHandling) {
      this.addWarning(
        "ERROR_HANDLING_MISSING",
        "No try-catch error handling found",
        "medium"
      );
    }

    // Check for console.error usage
    let hasConsoleError = false;
    scripts.forEach((script) => {
      if (script.textContent.includes("console.error")) {
        hasConsoleError = true;
      }
    });

    if (!hasConsoleError) {
      this.addInfo(
        "ERROR_LOGGING_MISSING",
        "Consider adding console.error for error logging",
        "info"
      );
    }
  }

  // Check dependencies
  checkDependencies() {
    // Check for outdated or vulnerable libraries
    const scripts = document.querySelectorAll("script[src]");
    scripts.forEach((script) => {
      const src = script.getAttribute("src");
      if (src) {
        // Check for CDN versions
        if (src.includes("jquery") && src.includes("1.")) {
          this.addWarning(
            "DEP_JQUERY_OLD",
            "Old jQuery version detected",
            "medium"
          );
        }

        if (src.includes("bootstrap") && src.includes("3.")) {
          this.addWarning(
            "DEP_BOOTSTRAP_OLD",
            "Old Bootstrap version detected",
            "medium"
          );
        }
      }
    });

    // Check for external dependencies
    const externalScripts = Array.from(scripts).filter((script) => {
      const src = script.getAttribute("src");
      return src && !src.startsWith("/") && !src.startsWith("./");
    });

    if (externalScripts.length > 0) {
      this.addInfo(
        "DEP_EXTERNAL",
        `${externalScripts.length} external dependencies found`,
        "info"
      );
    }
  }

  // Add vulnerability
  addVulnerability(code, message, severity) {
    this.vulnerabilities.push({
      code,
      message,
      severity,
      timestamp: Date.now(),
    });

    console.error(
      `🚨 Security Vulnerability [${severity.toUpperCase()}]: ${message}`
    );
  }

  // Add warning
  addWarning(code, message, severity) {
    this.warnings.push({
      code,
      message,
      severity,
      timestamp: Date.now(),
    });

    console.warn(`⚠️ Security Warning [${severity.toUpperCase()}]: ${message}`);
  }

  // Add info
  addInfo(code, message, severity) {
    this.checks.push({
      code,
      message,
      severity,
      timestamp: Date.now(),
    });

    console.log(`ℹ️ Security Check [${severity.toUpperCase()}]: ${message}`);
  }

  // Get security report
  getReport() {
    const critical = this.vulnerabilities.filter(
      (v) => v.severity === "critical"
    ).length;
    const high = this.vulnerabilities.filter(
      (v) => v.severity === "high"
    ).length;
    const medium = this.vulnerabilities.filter(
      (v) => v.severity === "medium"
    ).length;
    const low = this.vulnerabilities.filter((v) => v.severity === "low").length;

    const score = Math.max(
      0,
      100 - critical * 25 - high * 15 - medium * 10 - low * 5
    );

    return {
      score,
      vulnerabilities: this.vulnerabilities,
      warnings: this.warnings,
      checks: this.checks,
      summary: {
        critical,
        high,
        medium,
        low,
        total:
          this.vulnerabilities.length +
          this.warnings.length +
          this.checks.length,
      },
      recommendations: this.getRecommendations(),
      timestamp: Date.now(),
    };
  }

  // Get security recommendations
  getRecommendations() {
    const recommendations = [];

    if (this.vulnerabilities.some((v) => v.code.includes("XSS"))) {
      recommendations.push(
        "Implement proper input validation and output encoding to prevent XSS attacks"
      );
    }

    if (this.vulnerabilities.some((v) => v.code.includes("CSP"))) {
      recommendations.push("Implement a strict Content Security Policy");
    }

    if (this.warnings.some((w) => w.code.includes("MIXED_CONTENT"))) {
      recommendations.push("Ensure all resources are served over HTTPS");
    }

    if (this.warnings.some((w) => w.code.includes("AUTH"))) {
      recommendations.push(
        "Implement secure authentication and avoid hardcoded credentials"
      );
    }

    if (this.warnings.some((w) => w.code.includes("VALIDATION"))) {
      recommendations.push("Add proper input validation and sanitization");
    }

    return recommendations;
  }

  // Run security scan
  async runScan() {
    console.log("🔒 Running security scan...");

    // Re-run all checks
    this.vulnerabilities = [];
    this.warnings = [];
    this.checks = [];

    this.init();

    const report = this.getReport();
    console.log("🔒 Security scan completed:", report);

    return report;
  }
}

// Create global instance
window.SecurityScanner = new SecurityScanner();

// Export for module systems
export default window.SecurityScanner;
