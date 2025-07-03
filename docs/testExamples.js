const fs = require('fs').promises;
const path = require('path');
const { Decimal } = require('proposal-decimal');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

// Extract code blocks from markdown content
function extractCodeBlocks(content, filename) {
  const codeBlocks = [];
  const codeBlockRegex = /```(?:javascript|js)\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const code = match[1].trim();
    // Skip blocks that are obviously not meant to be run
    if (code.includes('// =>') || code.includes('console.log')) {
      codeBlocks.push({
        code,
        filename,
        line: content.substring(0, match.index).split('\n').length
      });
    }
  }
  
  return codeBlocks;
}

// Convert console.log assertions to actual tests
function convertToTest(code) {
  const lines = code.split('\n');
  const testLines = [];
  const assertions = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines and pure comments
    if (line.trim() === '' || line.trim().startsWith('//')) {
      continue;
    }
    
    // Check if this line has an expected output comment
    const outputMatch = line.match(/(.+?)(?:;)?\s*\/\/\s*=>\s*(.+)/);
    if (outputMatch) {
      const statement = outputMatch[1].trim();
      const expected = outputMatch[2].trim();
      
      // Handle console.log statements
      if (statement.startsWith('console.log(')) {
        const expr = statement.substring(12, statement.lastIndexOf(')'));
        testLines.push(`const result_${i} = ${expr};`);
        assertions.push({
          expr: `result_${i}`,
          expected,
          line: i + 1
        });
      } else {
        // Direct expression
        testLines.push(`const result_${i} = ${statement};`);
        assertions.push({
          expr: `result_${i}`,
          expected,
          line: i + 1
        });
      }
    } else {
      // Regular statement
      testLines.push(line);
    }
  }
  
  return { testLines, assertions };
}

// Run a single test
async function runTest(block) {
  const { testLines, assertions } = convertToTest(block.code);
  
  if (assertions.length === 0) {
    return { success: true, message: 'No assertions to test' };
  }
  
  const fullCode = testLines.join('\n');
  
  try {
    // Create a function with Decimal in scope
    const testFn = new Function('Decimal', fullCode + '\nreturn { ' + 
      assertions.map((a, i) => `result_${a.line - 1}: result_${a.line - 1}`).join(', ') + 
      ' };');
    
    const results = testFn(Decimal);
    
    // Check each assertion
    for (const assertion of assertions) {
      const actual = results[`result_${assertion.line - 1}`];
      const expected = assertion.expected;
      
      // Convert actual to string for comparison
      let actualStr;
      if (actual === undefined) {
        actualStr = 'undefined';
      } else if (actual === null) {
        actualStr = 'null';
      } else if (typeof actual === 'string') {
        actualStr = `"${actual}"`;
      } else if (actual instanceof Decimal) {
        // Handle Decimal objects
        if (actual.isNaN()) {
          actualStr = '"NaN"';
        } else if (!actual.isFinite()) {
          actualStr = actual.toString().includes('-') ? '"-Infinity"' : '"Infinity"';
        } else {
          actualStr = `Decimal("${actual.toString()}")`;
        }
      } else {
        actualStr = String(actual);
      }
      
      // Normalize expected value
      let normalizedExpected = expected;
      if (expected.startsWith('Decimal(')) {
        // Already in Decimal format
      } else if (expected === 'true' || expected === 'false') {
        // Boolean
      } else if (expected.match(/^-?\d+n$/)) {
        // BigInt
      } else if (expected.match(/^".*"$/)) {
        // Already quoted string
      } else if (!isNaN(expected)) {
        // Number
      } else {
        // Assume it's a string that needs quotes
        normalizedExpected = `"${expected}"`;
      }
      
      if (actualStr !== normalizedExpected) {
        return {
          success: false,
          message: `Line ${assertion.line}: Expected ${normalizedExpected}, got ${actualStr}`,
          actual: actualStr,
          expected: normalizedExpected
        };
      }
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error.message}`,
      error
    };
  }
}

// Main test runner
async function testAllExamples() {
  console.log(`${colors.blue}Testing Decimal examples...${colors.reset}\n`);
  
  const files = await fs.readdir(__dirname);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  
  let totalBlocks = 0;
  let passedBlocks = 0;
  let failedBlocks = 0;
  let skippedBlocks = 0;
  
  for (const file of mdFiles) {
    const content = await fs.readFile(path.join(__dirname, file), 'utf-8');
    const blocks = extractCodeBlocks(content, file);
    
    if (blocks.length === 0) continue;
    
    console.log(`${colors.yellow}${file}:${colors.reset}`);
    
    for (const block of blocks) {
      totalBlocks++;
      
      // Skip blocks that don't use Decimal
      if (!block.code.includes('Decimal')) {
        skippedBlocks++;
        continue;
      }
      
      const result = await runTest(block);
      
      if (result.success) {
        if (result.message === 'No assertions to test') {
          skippedBlocks++;
          console.log(`  ${colors.gray}Line ${block.line}: Skipped (no assertions)${colors.reset}`);
        } else {
          passedBlocks++;
          console.log(`  ${colors.green}✓ Line ${block.line}: Passed${colors.reset}`);
        }
      } else {
        failedBlocks++;
        console.log(`  ${colors.red}✗ Line ${block.line}: Failed${colors.reset}`);
        console.log(`    ${colors.red}${result.message}${colors.reset}`);
        
        // Show code snippet for context
        const codeLines = block.code.split('\n');
        const relevantLines = codeLines.slice(0, 5).join('\n    ');
        console.log(`    ${colors.gray}Code:\n    ${relevantLines}${colors.reset}`);
      }
    }
    
    console.log('');
  }
  
  // Summary
  console.log(`${colors.blue}Summary:${colors.reset}`);
  console.log(`  Total code blocks: ${totalBlocks}`);
  console.log(`  ${colors.green}Passed: ${passedBlocks}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failedBlocks}${colors.reset}`);
  console.log(`  ${colors.gray}Skipped: ${skippedBlocks}${colors.reset}`);
  
  if (failedBlocks > 0) {
    console.log(`\n${colors.red}Some examples failed! Please fix them before building.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}All Decimal examples passed!${colors.reset}`);
  }
}

// Run tests
testAllExamples().catch(error => {
  console.error(`${colors.red}Test runner error: ${error.message}${colors.reset}`);
  process.exit(1);
});