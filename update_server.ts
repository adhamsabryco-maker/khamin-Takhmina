import * as fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const regex1 = /socket\.emit\(\"player_data_update\",\s*(\{([^}]+)\})\)/g;
code = code.replace(regex1, (match, body, inner) => {
  let serialVar = 'serial';
  if (inner.includes('serial:')) {
    const match = inner.match(/serial:\s*([a-zA-Z0-9_\.]+)/);
    if (match) serialVar = match[1];
  } else if (inner.includes('playerSerial')) {
    serialVar = 'playerSerial';
  } else if (!inner.includes('serial')) {
    if (body.includes('reports: serverReportedPlayer.reports')) return `emitPlayerDataUpdate(socket, serverReportedPlayer.serial, ${body})`;
    return match; // fallback
  }
  return `emitPlayerDataUpdate(socket, ${serialVar}, ${body})`;
});

const regex2 = /io\.to\(([^)]+)\)\.emit\([\"']player_data_update[\"'],\s*(\{([^}]+)\})\)/g;
code = code.replace(regex2, (match, to, body, inner) => {
  let serialVar = 'serial';
  if (inner.includes('serial:')) {
    const m = inner.match(/serial:\s*([a-zA-Z0-9_\.]+)/);
    if (m) serialVar = m[1];
  } else if (inner.includes('targetPlayer')) {
    serialVar = 'targetPlayer.serial';
  } else if (inner.includes('serverReportedPlayer')) {
    serialVar = 'serverReportedPlayer.serial';
  }
  return `emitPlayerDataUpdate(io.to(${to}), ${serialVar}, ${body})`;
});

const regex3 = /socket\.emit\(\"player_data_update\",\s*player\)/g;
code = code.replace(regex3, 'emitPlayerDataUpdate(socket, player.serial, player)');

const regex4 = /io\.to\(([^)]+)\)\.emit\([\"']player_data_update[\"'],\s*player\)/g;
code = code.replace(regex4, 'emitPlayerDataUpdate(io.to($1), player.serial, player)');

fs.writeFileSync('server.ts', code);
console.log('done replacement');
