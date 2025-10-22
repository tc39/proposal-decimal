const fs = require('fs').promises;
const { marked } = require('marked');
const { mkdirp } = require('mkdirp');
const path = require('path');
const Prism = require('prismjs');
const loadLanguages = require('prismjs/components/');

// Load additional languages (javascript is included by default)
loadLanguages(['javascript', 'js', 'bash', 'typescript']);

const encoding = 'utf-8';

// Configure marked options
marked.use({
  mangle: false,
  headerIds: true,
  headerPrefix: '',
});

// Create a custom extension that processes links
const linkExtension = {
  name: 'mdToHtml',
  level: 'inline',
  start(src) { return src.match(/\[/)?.index; },
  tokenizer(src, tokens) {
    const rule = /^\[([^\]]+)\]\(([^)]+\.md)([^)]*)\)/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'mdToHtml',
        raw: match[0],
        text: match[1],
        href: match[2].replace(/\.md$/, '.html'),
        title: match[3]
      };
    }
  },
  renderer(token) {
    const titleAttr = token.title ? ` title="${token.title}"` : '';
    return `<a href="${token.href}"${titleAttr}>${token.text}</a>`;
  }
};

// Custom code renderer for syntax highlighting
const codeRenderer = {
  name: 'codeRenderer',
  renderer: {
    code(token) {
      const code = token.text || '';
      const language = token.lang || '';
      
      if (!language) {
        // No language specified - escape the code
        const escaped = code.replace(/[&<>"']/g, (char) => {
          const escapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
          };
          return escapes[char];
        });
        return `<pre><code>${escaped}</code></pre>\n`;
      }

      // Use Prism for syntax highlighting if language is supported
      const lang = language.toLowerCase();
      // Map common aliases
      const langMap = {
        'js': 'javascript',
        'javascript': 'javascript',
        'ts': 'typescript',
        'typescript': 'typescript',
        'bash': 'bash',
        'sh': 'bash'
      };
      const mappedLang = langMap[lang] || lang;
      
      if (Prism.languages[mappedLang]) {
        const highlighted = Prism.highlight(code, Prism.languages[mappedLang], mappedLang);
        return `<pre class="language-${lang}"><code class="language-${lang}">${highlighted}</code></pre>\n`;
      }

      // Fallback for unsupported languages - escape the code
      const escaped = code.replace(/[&<>"']/g, (char) => {
        const escapes = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return escapes[char];
      });
      return `<pre class="language-${lang}"><code class="language-${lang}">${escaped}</code></pre>\n`;
    }
  }
};

// Register the extensions
marked.use({ extensions: [linkExtension], renderer: codeRenderer.renderer });

// Override the heading renderer using the proper API
const headingRenderer = {
  name: 'headingRenderer',
  renderer: {
    heading(token) {
      // Extract text content from the token
      let text = '';
      if (token.tokens && token.tokens.length > 0) {
        text = token.tokens.map(t => t.text || t.raw || '').join('');
      } else if (token.text) {
        text = token.text;
      }
      
      const level = token.depth || 1;
      
      // Check for explicit ID syntax {#id}
      let id = '';
      let displayText = text;
      const idMatch = text.match(/^(.+?)\s*\{#(.+?)\}$/);
      
      if (idMatch) {
        displayText = idMatch[1].trim();
        id = idMatch[2];
      } else {
        // Generate ID from text
        id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
      }
      
      return `<h${level} id="${id}"><a class="heading-link" href="#${id}"></a>${displayText}</h${level}>\n`;
    }
  }
};

marked.use(headingRenderer);

// Also use a walkTokens function to transform .md links in regular links
marked.use({
  walkTokens(token) {
    if (token.type === 'link' && token.href && token.href.endsWith('.md')) {
      token.href = token.href.replace(/\.md$/, '.html');
    }
  }
});

async function processMarkdownFile(markdownFile, outputDir, head, tail) {
  console.log(`Processing ${markdownFile}...`);
  
  // Read markdown content
  let content = await fs.readFile(markdownFile, { encoding });
  
  // Parse markdown
  let html = marked(content);
  
  // Get output filename
  const baseName = path.basename(markdownFile, '.md');
  const outputFile = path.join(outputDir, `${baseName}.html`);
  
  // Combine with header and footer
  const fullHtml = head + html + tail;
  
  // Write output file
  await fs.writeFile(outputFile, fullHtml, { encoding });
  console.log(`  → ${outputFile}`);
}

async function build() {
  try {
    console.log('Building Decimal documentation...\n');
    
    // Create output directory
    const outputDir = path.join(__dirname, 'out');
    await mkdirp(outputDir);
    
    // Read header and footer templates
    const head = await fs.readFile(path.join(__dirname, 'head.html.part'), { encoding });
    const tail = await fs.readFile(path.join(__dirname, 'tail.html.part'), { encoding });
    
    // Get all markdown files
    const files = await fs.readdir(__dirname);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    // Process each markdown file
    for (const file of mdFiles) {
      await processMarkdownFile(path.join(__dirname, file), outputDir, head, tail);
    }
    
    // Copy prism.css - using okaidia theme for vibrant syntax highlighting
    const prismCss = path.join(__dirname, '..', 'node_modules/prismjs/themes/prism-okaidia.css');
    const prismDest = path.join(outputDir, 'prism.css');
    await fs.copyFile(prismCss, prismDest);
    console.log(`  → ${prismDest}`);
    
    // Build and copy proposal-decimal polyfill as browser bundle
    const { execSync } = require('child_process');
    const polyfillSrc = path.join(__dirname, '..', 'node_modules/proposal-decimal/src/Decimal.mjs');
    const polyfillDest = path.join(outputDir, 'decimal-polyfill.js');
    
    // Build IIFE bundle that exposes DecimalPolyfill globally
    execSync(`npx esbuild "${polyfillSrc}" --bundle --format=iife --global-name=DecimalPolyfill --outfile="${polyfillDest}"`, {
      cwd: __dirname,
      stdio: 'inherit'
    });
    console.log(`  → ${polyfillDest}`);
    
    // Also copy the original ES module
    const polyfillMjsDest = path.join(outputDir, 'decimal-polyfill.mjs');
    await fs.copyFile(polyfillSrc, polyfillMjsDest);
    console.log(`  → ${polyfillMjsDest}`);
    
    console.log('\nBuild complete!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Run the build
build();