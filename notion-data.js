// netlify/functions/notion-data.js
// Fetches KPI records from Notion for a given snapshot date
// Your NOTION_API_KEY is stored securely in Netlify environment variables — never in the code

const NOTION_DB_KPI     = '39ad6ddc-a3fe-4702-b72f-57d3b33ee614';
const NOTION_DB_TRACKER = 'fc58d188-8d92-46aa-b394-5dfabd10c232';
const NOTION_VERSION    = '2022-06-28';

async function queryDatabase(dbId, filter, apiKey, startCursor) {
  const body = { page_size: 100 };
  if (filter)      body.filter      = filter;
  if (startCursor) body.start_cursor = startCursor;

  const resp = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method:  'POST',
    headers: {
      'Authorization':  `Bearer ${apiKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type':   'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Notion API error ${resp.status}: ${err}`);
  }
  return resp.json();
}

function propVal(props, name, type) {
  const p = props[name];
  if (!p) return null;
  switch (type) {
    case 'number':  return p.number ?? null;
    case 'select':  return p.select?.name ?? null;
    case 'text':    return p.rich_text?.[0]?.plain_text ?? null;
    case 'title':   return p.title?.[0]?.plain_text ?? null;
    case 'date':    return p.date?.start ?? null;
    case 'checkbox':return p.checkbox ?? false;
    default:        return null;
  }
}

function pageToKPI(page) {
  const p = page.properties;
  return {
    unit_alias:      propVal(p, 'Unit Alias',     'text'),
    unit_name:       propVal(p, 'Unit Name',      'text'),
    bedrooms:        propVal(p, 'Bedrooms',        'select'),
    period:          propVal(p, 'Period',          'select'),
    snapshot_date:   propVal(p, 'Snapshot Date',  'date'),
    rev_cy:          propVal(p, 'Rev CY',          'number'),
    rev_sdly:        propVal(p, 'Rev SDLY',        'number'),
    rev_eom:         propVal(p, 'Rev EOM',         'number'),
    rev_diff:        propVal(p, 'Rev Diff',        'number'),
    adr_cy:          propVal(p, 'ADR CY',          'number'),
    adr_sdly:        propVal(p, 'ADR SDLY',        'number'),
    adr_eom:         propVal(p, 'ADR EOM',         'number'),
    occ_cy:          propVal(p, 'OCC CY',          'number'),
    occ_sdly:        propVal(p, 'OCC SDLY',        'number'),
    gn_cy:           propVal(p, 'GN CY',           'number'),
    gn_sdly:         propVal(p, 'GN SDLY',         'number'),
    gn_eom:          propVal(p, 'GN EOM',          'number'),
    gn_pickup_14d:   propVal(p, 'GN Pickup 14d',   'number'),
    open_nights:     propVal(p, 'Open Nights',     'number'),
    open_rev:        propVal(p, 'Open Rev',        'number'),
    wh_avg:          propVal(p, 'WH Avg Rate',     'number'),
    max_run:         propVal(p, 'Max Run',         'number'),
    open_weekdays:   propVal(p, 'Open Weekdays',   'number'),
    weekends_booked: propVal(p, 'Weekends Booked', 'number'),
    bw_eom:          propVal(p, 'BW EOM',          'number'),
    lead_day_group:  propVal(p, 'Lead Day Group',  'select'),
  };
}

function pageToTracker(page) {
  const p = page.properties;
  return {
    unit:         propVal(p, 'Unit Alias',     'text'),
    name:         propVal(p, 'Unit Name',      'text'),
    bedrooms:     parseInt(String(propVal(p, 'Bedrooms','select')||'0').replace(/\D/g,''))||0,
    direction:    propVal(p, 'Direction',      'select')?.toLowerCase() || 'raise',
    arrivalMonth: propVal(p, 'Arrival Month',  'select')?.split(' ')[0] || 'MAY',
    flagNum:      propVal(p, 'Flag Num',       'text'),
    flagId:       propVal(p, 'Flag ID',        'text'),
    addedDate:    propVal(p, 'Entry Date',     'date'),
    baseGN:       propVal(p, 'Base GN',        'number'),
    baseOccCy:    propVal(p, 'Base OCC CY',    'number'),
    baseOccSdly:  propVal(p, 'Base OCC SDLY',  'number'),
    baseRevCy:    propVal(p, 'Base Rev CY',    'number'),
    baseRevSdly:  propVal(p, 'Base Rev SDLY',  'number'),
    sessionLabel: propVal(p, 'Session Label',  'text'),
    sessionDate:  propVal(p, 'Entry Date',     'date'),
    changed:      true,
    weeks:        [],
  };
}

async function fetchAllPages(dbId, filter, apiKey) {
  const results = [];
  let cursor = undefined;
  do {
    const data = await queryDatabase(dbId, filter, apiKey, cursor);
    results.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return results;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'NOTION_API_KEY not set in Netlify environment variables' }) };
  }

  const params   = event.queryStringParameters || {};
  const type     = params.type || 'kpis';
  const snapDate = params.snapshot || '2026-05-04';

  try {
    if (type === 'kpis') {
      // Fetch KPI records for one or two snapshot dates
      const snapDates = snapDate.includes(',') ? snapDate.split(',') : [snapDate];
      const allRecords = [];

      for (const sd of snapDates) {
        const filter = {
          property: 'Snapshot Date',
          date: { equals: sd },
        };
        const pages = await fetchAllPages(NOTION_DB_KPI, filter, apiKey);
        allRecords.push(...pages.map(pageToKPI));
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ records: allRecords, count: allRecords.length }),
      };
    }

    if (type === 'tracker') {
      // Fetch all tracker entries
      const pages = await fetchAllPages(NOTION_DB_TRACKER, null, apiKey);
      // Group into sessions by entry date
      const sessionMap = {};
      pages.forEach(page => {
        const entry = pageToTracker(page);
        const key   = entry.sessionDate || entry.addedDate || '2026-05-04';
        if (!sessionMap[key]) {
          sessionMap[key] = { date: key, label: _fmtLabel(key), units: [] };
        }
        sessionMap[key].units.push(entry);
      });
      const sessions = Object.values(sessionMap).sort((a, b) => a.date.localeCompare(b.date));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ sessions }),
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown type param' }) };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

function _fmtLabel(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  return `${d.getMonth()+1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
}
