#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const sourcePath = path.join(
  __dirname,
  '..',
  'psadt',
  'PSAppDeployToolkit',
  'PSAppDeployToolkit.psm1'
);
const outputPath = path.join(
  __dirname,
  '..',
  'src',
  'data',
  'command-metadata.json'
);

function normalizeText(block) {
  return block
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripQuotes(value) {
  if (!value) return '';
  const trimmed = value.trim();
  const match = trimmed.match(/^(["'])([\s\S]*)\1$/);
  if (!match) return trimmed;
  return match[2];
}

function parseCommentBlock(raw) {
  if (!raw) {
    return {
      synopsis: '',
      description: '',
      link: '',
      parameters: [],
      examples: [],
    };
  }
  const body = raw.replace(/^\s*<#/, '').replace(/#>\s*$/, '');
  const synopsisMatch = body.match(
    /\.SYNOPSIS\s*\r?\n([\s\S]*?)(?=\r?\n\s*\.[A-Z]|$)/
  );
  const descriptionMatch = body.match(
    /\.DESCRIPTION\s*\r?\n([\s\S]*?)(?=\r?\n\s*\.[A-Z]|$)/
  );
  const linkMatch = body.match(
    /\.LINK\s*\r?\n([\s\S]*?)(?=\r?\n\s*\.[A-Z]|$)/
  );

  const parameters = [];
  const paramRegex = /\.PARAMETER\s+([^\r\n]+)\r?\n([\s\S]*?)(?=\r?\n\s*\.[A-Z]|\r?\n\s*#>|$)/g;
  let paramMatch;
  while ((paramMatch = paramRegex.exec(body)) !== null) {
    const name = paramMatch[1].trim();
    const desc = normalizeText(paramMatch[2]);
    if (name) {
      parameters.push({ name, description: desc });
    }
  }

  const examples = [];
  const exampleRegex = /\.EXAMPLE\s*\r?\n([\s\S]*?)(?=\r?\n\s*\.[A-Z]|\r?\n\s*#>|$)/g;
  let exampleMatch;
  while ((exampleMatch = exampleRegex.exec(body)) !== null) {
    const lines = exampleMatch[1]
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
    if (lines.length) {
      examples.push(lines[0]);
    }
  }

  return {
    synopsis: synopsisMatch ? normalizeText(synopsisMatch[1]) : '',
    description: descriptionMatch ? normalizeText(descriptionMatch[1]) : '',
    link: linkMatch ? normalizeText(linkMatch[1]) : '',
    parameters,
    examples,
  };
}

function extractParamBlock(section) {
  const paramIndex = section.indexOf('param');
  if (paramIndex === -1) {
    return '';
  }
  const openIndex = section.indexOf('(', paramIndex);
  if (openIndex === -1) {
    return '';
  }
  let depth = 0;
  for (let i = openIndex; i < section.length; i += 1) {
    const char = section[i];
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
      if (depth === 0) {
        return section.slice(openIndex + 1, i);
      }
    }
  }
  return '';
}

function isLikelyTypeAttribute(content) {
  if (!content) return false;
  const normalized = content.trim();
  if (/^Parameter/i.test(normalized)) return false;
  if (/^Validate/i.test(normalized)) return false;
  if (/^Alias/i.test(normalized)) return false;
  if (/^OutputType/i.test(normalized)) return false;
  if (/^Allow/i.test(normalized)) return false;
  return /^[A-Za-z0-9_.\[\]]+$/.test(normalized);
}

function parseParamDefinitions(block) {
  if (!block) return [];
  const lines = block.split(/\r?\n/);
  const params = [];
  let pendingType = '';
  let collectedAttributes = [];

  lines.forEach(rawLine => {
    const line = rawLine.trim();
    if (!line) return;
    if (line.startsWith('#')) return;

    const definitionMatch = line.match(
      /^(?:\[[^\]]+\]\s*)*\$([A-Za-z0-9_:-]+)(?=\s|=|,|$)/
    );

    if (definitionMatch) {
      const name = definitionMatch[1];
      const equalsIndex = line.indexOf('=');
      let rawDefault = '';
      if (equalsIndex !== -1) {
        rawDefault = line
          .slice(equalsIndex + 1)
          .replace(/,\s*$/, '')
          .trim();
      }
      const typeMatch = line.match(/\[([^\]]+)\]\s*\$[A-Za-z0-9_:-]+/);
      let type = '';
      if (typeMatch) {
        type = typeMatch[1].trim();
      } else if (pendingType) {
        type = pendingType;
      }
      const attributeText = collectedAttributes.join(' ');
      const required = /Mandatory\s*=\s*\$true/i.test(attributeText);
      const isSwitch =
        /\[switch\]/i.test(line) ||
        /\[switch\]/i.test(type) ||
        /System\.Management\.Automation\.SwitchParameter/i.test(type);
      const defaultValue = stripQuotes(rawDefault);
      const defaultQuoteMatch = rawDefault.match(/^(["']).*\1$/);
      const defaultQuote = defaultQuoteMatch ? defaultQuoteMatch[1] : '';

      params.push({
        name,
        type,
        required,
        isSwitch,
        defaultValue,
        defaultRaw: rawDefault,
        defaultQuote,
      });
      pendingType = '';
      collectedAttributes = [];
    } else {
      const bracketMatch = line.match(/^\[([^\]]+)\]$/);
      if (bracketMatch && isLikelyTypeAttribute(bracketMatch[1])) {
        pendingType = bracketMatch[1].trim();
      } else if (line.startsWith('[')) {
        collectedAttributes.push(line);
      }
    }
  });

  return params;
}

function findPlaceholder(examples, paramName) {
  if (!examples || !examples.length) {
    return { placeholder: '', quote: '' };
  }
  const colonPattern = new RegExp(
    `-${paramName}:("[^"]*"|'[^']*'|\\S+)`,
    'i'
  );
  const spacePattern = new RegExp(
    `-${paramName}\\s+("[^"]*"|'[^']*'|\\S+)`,
    'i'
  );
  for (const example of examples) {
    let match = example.match(colonPattern);
    if (!match) {
      match = example.match(spacePattern);
    }
    if (match) {
      const raw = match[1].trim();
      const quoteMatch = raw.match(/^(["'])([\s\S]*)\1$/);
      if (quoteMatch) {
        return { placeholder: quoteMatch[2], quote: quoteMatch[1] };
      }
      return { placeholder: raw, quote: '' };
    }
  }
  return { placeholder: '', quote: '' };
}

function buildMetadata() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found at ${sourcePath}`);
  }
  const text = fs.readFileSync(sourcePath, 'utf8');
  const metadata = [];
  const fnRegex = /function\s+([A-Za-z0-9-]+)\s*\{/g;
  let match;
  while ((match = fnRegex.exec(text)) !== null) {
    const name = match[1];
    const start = match.index + match[0].length;
    const remainder = text.slice(start);
    const nextFunctionMatch = remainder.match(/\nfunction\s+[A-Za-z0-9-]+\s*\{/);
    const section = nextFunctionMatch
      ? remainder.slice(0, nextFunctionMatch.index)
      : remainder;
    const commentMatch = section.match(/<#[\s\S]*?#>/);
    const comment = commentMatch ? commentMatch[0] : '';
    const info = parseCommentBlock(comment);
    const paramBlock = extractParamBlock(section);
    const definitions = parseParamDefinitions(paramBlock);
    const definitionMap = new Map();
    definitions.forEach(def => {
      definitionMap.set(def.name.toLowerCase(), def);
    });

    const combinedNames = new Set();
    info.parameters.forEach(param => combinedNames.add(param.name));
    definitions.forEach(def => combinedNames.add(def.name));

    const parameters = [];
    combinedNames.forEach(paramName => {
      const def = definitionMap.get(paramName.toLowerCase());
      const doc = info.parameters.find(
        p => p.name.toLowerCase() === paramName.toLowerCase()
      );
      const exampleInfo = findPlaceholder(info.examples, paramName);
      parameters.push({
        name: doc ? doc.name : def ? def.name : paramName,
        description: doc ? doc.description : '',
        required: def ? def.required : false,
        isSwitch: def ? def.isSwitch : false,
        type: def ? def.type : '',
        defaultValue: def ? def.defaultValue : '',
        defaultRaw: def ? def.defaultRaw : '',
        defaultQuote: def ? def.defaultQuote : '',
        placeholder: exampleInfo.placeholder,
        placeholderQuote: exampleInfo.quote,
      });
    });

    parameters.sort((a, b) => a.name.localeCompare(b.name));

    metadata.push({
      name,
      synopsis: info.synopsis,
      description: info.description,
      link: info.link,
      parameters,
    });
  }
  metadata.sort((a, b) => a.name.localeCompare(b.name));
  return metadata;
}

function main() {
  const metadata = buildMetadata();
  fs.writeFileSync(outputPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${metadata.length} commands to ${outputPath}`);
}

main();
