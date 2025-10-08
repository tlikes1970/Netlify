#!/bin/bash

# Home Layout Source Scan Script
# Uses ripgrep to find CSS rule origins and conflicts

echo "=== Home Layout Evidence Collection - Source Scan ==="
echo "Timestamp: $(date)"
echo ""

# Create reports directory if it doesn't exist
mkdir -p reports

# Check if ripgrep is available
if ! command -v rg &> /dev/null; then
    echo "ERROR: ripgrep (rg) not found. Please install ripgrep or use the Node.js fallback."
    echo "Install: https://github.com/BurntSushi/ripgrep#installation"
    exit 1
fi

echo "Using ripgrep version: $(rg --version)"
echo ""

# Initialize output files
echo "=== CSS Rule Sources ===" > reports/home-layout-sources.txt
echo "Generated: $(date)" >> reports/home-layout-sources.txt
echo "" >> reports/home-layout-sources.txt

# Initialize JSON output
echo "[]" > reports/home-layout-sources.json

echo "1. Scanning for .actions display rules..."
echo "=== .actions Display Rules ===" >> reports/home-layout-sources.txt
rg -n --no-heading "(^|[^a-zA-Z0-9-])\.actions[^a-zA-Z0-9-]*\s*{[^}]*display\s*:\s*(flex|grid|block)" www/styles www/js >> reports/home-layout-sources.txt 2>/dev/null || echo "No .actions display rules found"

echo "2. Scanning for display property definitions..."
echo "" >> reports/home-layout-sources.txt
echo "=== Display Property Definitions ===" >> reports/home-layout-sources.txt
rg -n --no-heading "display\s*:\s*(flex|grid|block)" www/styles >> reports/home-layout-sources.txt 2>/dev/null || echo "No display rules found"

echo "3. Scanning for padding definitions..."
echo "" >> reports/home-layout-sources.txt
echo "=== Padding Definitions ===" >> reports/home-layout-sources.txt
rg -n --no-heading "padding-(left|right)\s*:" www/styles >> reports/home-layout-sources.txt 2>/dev/null || echo "No padding rules found"

echo "4. Scanning for media queries..."
echo "" >> reports/home-layout-sources.txt
echo "=== Media Queries ===" >> reports/home-layout-sources.txt
rg -n --no-heading "@media.*(max-width|min-width).*?(768|1024|bp-|breakpoint)" www/styles >> reports/home-layout-sources.txt 2>/dev/null || echo "No media queries found"

echo "5. Scanning for !important declarations..."
echo "" >> reports/home-layout-sources.txt
echo "=== !important Declarations ===" >> reports/home-layout-sources.txt
rg -n --no-heading "!important" www/styles >> reports/home-layout-sources.txt 2>/dev/null || echo "No !important rules found"

echo "6. Scanning for CSS variables..."
echo "" >> reports/home-layout-sources.txt
echo "=== CSS Variables ===" >> reports/home-layout-sources.txt
rg -n --no-heading "(--home-gutter|--rail-col-w|--card-w|--home-card-height-desktop|--home-panel-padding)" www >> reports/home-layout-sources.txt 2>/dev/null || echo "No CSS variables found"

echo "7. Scanning for home section specific rules..."
echo "" >> reports/home-layout-sources.txt
echo "=== Home Section Rules ===" >> reports/home-layout-sources.txt
rg -n --no-heading "(#homeSection|\.home-group|\.home-preview-row)" www/styles >> reports/home-layout-sources.txt 2>/dev/null || echo "No home section rules found"

echo "8. Scanning for grid and flex properties..."
echo "" >> reports/home-layout-sources.txt
echo "=== Grid and Flex Properties ===" >> reports/home-layout-sources.txt
rg -n --no-heading "(grid-template-columns|grid-auto-flow|grid-auto-columns|flex-direction|flex-wrap)" www/styles >> reports/home-layout-sources.txt 2>/dev/null || echo "No grid/flex rules found"

echo "9. Scanning for overflow and containment..."
echo "" >> reports/home-layout-sources.txt
echo "=== Overflow and Containment ===" >> reports/home-layout-sources.txt
rg -n --no-heading "(overflow|contain|transform)" www/styles >> reports/home-layout-sources.txt 2>/dev/null || echo "No overflow/containment rules found"

# Generate JSON output using ripgrep's JSON mode
echo "10. Generating JSON output..."
rg --json "display\s*:\s*(flex|grid|block)|padding-(left|right)\s*:|!important|(--home-gutter|--rail-col-w|--card-w|--home-card-height-desktop)" www/styles www/js 2>/dev/null | jq -s 'map(select(.type == "match")) | map({
  file: .data.path.text,
  line: .data.line_number,
  text: .data.lines.text,
  match: .data.submatches[0].match.text,
  start: .data.submatches[0].start,
  end: .data.submatches[0].end
})' > reports/home-layout-sources.json

echo ""
echo "=== Scan Complete ==="
echo "Results saved to:"
echo "  - reports/home-layout-sources.txt (human readable)"
echo "  - reports/home-layout-sources.json (machine readable)"
echo ""
echo "File sizes:"
ls -lh reports/home-layout-sources.* 2>/dev/null || echo "No files generated"

