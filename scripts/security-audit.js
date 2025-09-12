// security-audit.js - Security audit script
const fs = require('fs');
const path = require('path');

// Security audit class
class SecurityAudit {
  constructor() {
    this.issues = [];
    this.criticalIssues = [];
    this.warnings = [];
    this.info = [];
  }
  
  // Run security audit
  async run() {
    console.log('🔒 Running security audit...\n');
    
    this.checkAPIKeys();
    this.checkInputSanitization();
    this.checkCORSConfiguration();
    this.checkErrorHandling();
    this.checkDependencies();
    this.checkFilePermissions();
    this.checkEnvironmentVariables();
    
    this.generateReport();
  }
  
  // Check for exposed API keys
  checkAPIKeys() {
    console.log('🔍 Checking for exposed API keys...');
    
    const files = this.getJSFiles();
    const apiKeyPatterns = [
      /api[_-]?key\s*[:=]\s*['"][^'"]{10,}['"]/gi,
      /firebase[_-]?config\s*[:=]\s*\{[^}]*api[_-]?key[^}]*\}/gi,
      /tmdb[_-]?key\s*[:=]\s*['"][^'"]{10,}['"]/gi
    ];
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      apiKeyPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          this.criticalIssues.push({
            type: 'CRITICAL',
            file: file,
            issue: 'Exposed API key detected',
            details: matches[0].substring(0, 50) + '...',
            recommendation: 'Move API keys to environment variables'
          });
        }
      });
    });
  }
  
  // Check input sanitization
  checkInputSanitization() {
    console.log('🔍 Checking input sanitization...');
    
    const files = this.getJSFiles();
    const dangerousPatterns = [
      /innerHTML\s*=/g,
      /document\.write\s*\(/g,
      /eval\s*\(/g,
      /Function\s*\(/g
    ];
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      dangerousPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          this.warnings.push({
            type: 'WARNING',
            file: file,
            issue: 'Potentially unsafe DOM manipulation',
            details: `Found ${pattern.source} usage`,
            recommendation: 'Use SecurityUtils.sanitizeInput() or SecurityUtils.safeHTML()'
          });
        }
      });
    });
  }
  
  // Check CORS configuration
  checkCORSConfiguration() {
    console.log('🔍 Checking CORS configuration...');
    
    const netlifyFunctions = this.getNetlifyFunctions();
    
    netlifyFunctions.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes("'Access-Control-Allow-Origin': '*'")) {
        this.warnings.push({
          type: 'WARNING',
          file: file,
          issue: 'Overly permissive CORS policy',
          details: 'Allows all origins (*)',
          recommendation: 'Restrict to specific domains'
        });
      }
    });
  }
  
  // Check error handling
  checkErrorHandling() {
    console.log('🔍 Checking error handling...');
    
    const files = this.getJSFiles();
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for functions without try-catch
      const functionPattern = /function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g;
      const matches = content.match(functionPattern);
      
      if (matches) {
        matches.forEach(match => {
          if (!match.includes('try') && !match.includes('catch')) {
            this.info.push({
              type: 'INFO',
              file: file,
              issue: 'Function without error handling',
              details: 'Consider adding try-catch blocks',
              recommendation: 'Use ErrorHandler.safeExecute() or add try-catch'
            });
          }
        });
      }
    });
  }
  
  // Check dependencies
  checkDependencies() {
    console.log('🔍 Checking dependencies...');
    
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Check for known vulnerable packages
      const vulnerablePackages = [
        'lodash@4.17.20',
        'jquery@3.5.1',
        'moment@2.29.1'
      ];
      
      Object.entries(dependencies).forEach(([name, version]) => {
        if (vulnerablePackages.some(vuln => vuln.startsWith(name))) {
          this.warnings.push({
            type: 'WARNING',
            file: 'package.json',
            issue: 'Potentially vulnerable dependency',
            details: `${name}@${version}`,
            recommendation: 'Update to latest version'
          });
        }
      });
    }
  }
  
  // Check file permissions
  checkFilePermissions() {
    console.log('🔍 Checking file permissions...');
    
    const sensitiveFiles = [
      '.env',
      'firebase-config.js',
      'tmdb-config.js'
    ];
    
    sensitiveFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const mode = stats.mode & parseInt('777', 8);
        
        if (mode > parseInt('644', 8)) {
          this.warnings.push({
            type: 'WARNING',
            file: file,
            issue: 'File permissions too permissive',
            details: `Mode: ${mode.toString(8)}`,
            recommendation: 'Set permissions to 644 or more restrictive'
          });
        }
      }
    });
  }
  
  // Check environment variables
  checkEnvironmentVariables() {
    console.log('🔍 Checking environment variables...');
    
    const envExamplePath = path.join(__dirname, '..', 'env.example');
    const envPath = path.join(__dirname, '..', '.env');
    
    if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
      this.warnings.push({
        type: 'WARNING',
        file: '.env',
        issue: 'Environment variables not configured',
        details: '.env file not found',
        recommendation: 'Copy env.example to .env and configure values'
      });
    }
  }
  
  // Get JavaScript files
  getJSFiles() {
    const jsFiles = [];
    const wwwDir = path.join(__dirname, '..', 'www');
    
    const scanDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDir(filePath);
        } else if (file.endsWith('.js')) {
          jsFiles.push(filePath);
        }
      });
    };
    
    scanDir(wwwDir);
    return jsFiles;
  }
  
  // Get Netlify functions
  getNetlifyFunctions() {
    const functions = [];
    const netlifyDir = path.join(__dirname, '..', 'netlify', 'functions');
    
    if (fs.existsSync(netlifyDir)) {
      const files = fs.readdirSync(netlifyDir);
      
      files.forEach(file => {
        if (file.endsWith('.js')) {
          functions.push(path.join(netlifyDir, file));
        }
      });
    }
    
    return functions;
  }
  
  // Generate security report
  generateReport() {
    console.log('\n📊 Security Audit Report');
    console.log('========================\n');
    
    // Critical issues
    if (this.criticalIssues.length > 0) {
      console.log('🚨 CRITICAL ISSUES:');
      this.criticalIssues.forEach(issue => {
        console.log(`  • ${issue.file}: ${issue.issue}`);
        console.log(`    ${issue.details}`);
        console.log(`    💡 ${issue.recommendation}\n`);
      });
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.forEach(issue => {
        console.log(`  • ${issue.file}: ${issue.issue}`);
        console.log(`    ${issue.details}`);
        console.log(`    💡 ${issue.recommendation}\n`);
      });
    }
    
    // Info
    if (this.info.length > 0) {
      console.log('ℹ️  INFO:');
      this.info.forEach(issue => {
        console.log(`  • ${issue.file}: ${issue.issue}`);
        console.log(`    ${issue.details}`);
        console.log(`    💡 ${issue.recommendation}\n`);
      });
    }
    
    // Summary
    const totalIssues = this.criticalIssues.length + this.warnings.length + this.info.length;
    
    if (totalIssues === 0) {
      console.log('✅ No security issues found!');
    } else {
      console.log(`📈 Summary: ${this.criticalIssues.length} critical, ${this.warnings.length} warnings, ${this.info.length} info`);
      
      if (this.criticalIssues.length > 0) {
        console.log('🚨 Action required: Fix critical issues immediately');
        process.exit(1);
      }
    }
  }
}

// Run security audit
const audit = new SecurityAudit();
audit.run().catch(console.error);








