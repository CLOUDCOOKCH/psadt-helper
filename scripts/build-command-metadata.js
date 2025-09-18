#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '..', 'psadt', 'PSAppDeployToolkit', 'PSAppDeployToolkit.psm1');
const outputPath = path.join(__dirname, '..', 'src', 'data', 'command-metadata.json');

function normalizeText(block) {
  return block
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCommentBlock(raw) {
  if (!raw) {
    return {
      synopsis: '',
      description: '',
      link: '',
      parameters: [],
    };
  }
  const body = raw
    .replace(/^\s*<#/, '')
    .replace(/#>\s*$/, '');
  const synopsisMatch = body.match(/\.SYNOPSIS\s*\r?\n([\s\S]*?)(?=\r?\n\s*\.[A-Z]|$)/);
  const descriptionMatch = body.match(/\.DESCRIPTION\s*\r?\n([\s\S]*?)(?=\r?\n\s*\.[A-Z]|$)/);
  const linkMatch = body.match(/\.LINK\s*\r?\n([\s\S]*?)(?=\r?\n\s*\.[A-Z]|$)/);

  const parameters = [];
  const paramRegex = /\.PARAMETER\s+([^\r\n]+)\r?\n([\s\S]*?)(?=\r?\n\s*\.[A-Z]|\r?\n\s*#>|$)/g;
  let match;
  while ((match = paramRegex.exec(body)) !== null) {
    const name = match[1].trim();
    const desc = normalizeText(match[2]);
    if (name) {
      parameters.push({ name, description: desc });
    }
  }

  return {
    synopsis: synopsisMatch ? normalizeText(synopsisMatch[1]) : '',
    description: descriptionMatch ? normalizeText(descriptionMatch[1]) : '',
    link: linkMatch ? normalizeText(linkMatch[1]) : '',
    parameters,
  };
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
    const section = nextFunctionMatch ? remainder.slice(0, nextFunctionMatch.index) : remainder;
    const commentMatch = section.match(/<#[\s\S]*?#>/);
    const comment = commentMatch ? commentMatch[0] : '';
    const info = parseCommentBlock(comment);
    metadata.push({
      name,
      synopsis: info.synopsis,
      description: info.description,
      link: info.link,
      parameters: info.parameters,
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
