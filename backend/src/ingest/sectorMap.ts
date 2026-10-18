/** Sector for common NSE F&O underlyings. Symbols not listed fall back to 'Other'. Indices → 'Index'. */
export const SECTOR_MAP: Record<string, string> = {
  // Banks
  HDFCBANK: 'Banks', ICICIBANK: 'Banks', SBIN: 'Banks', KOTAKBANK: 'Banks', AXISBANK: 'Banks', INDUSINDBK: 'Banks', BANKBARODA: 'Banks', PNB: 'Banks', CANBK: 'Banks', FEDERALBNK: 'Banks', IDFCFIRSTB: 'Banks', AUBANK: 'Banks', BANDHANBNK: 'Banks', UNIONBANK: 'Banks', INDIANB: 'Banks', YESBANK: 'Banks',
  // Financial Services
  BAJFINANCE: 'Financial Services', BAJAJFINSV: 'Financial Services', HDFCLIFE: 'Financial Services', SBILIFE: 'Financial Services', ICICIPRULI: 'Financial Services', ICICIGI: 'Financial Services', SHRIRAMFIN: 'Financial Services', CHOLAFIN: 'Financial Services', MUTHOOTFIN: 'Financial Services', ABCAPITAL: 'Financial Services', LICHSGFIN: 'Financial Services', PFC: 'Financial Services', RECLTD: 'Financial Services', IRFC: 'Financial Services', HDFCAMC: 'Financial Services', BSE: 'Financial Services', ANGELONE: 'Financial Services', CDSL: 'Financial Services', MCX: 'Financial Services', LICI: 'Financial Services', SBICARD: 'Financial Services', MANAPPURAM: 'Financial Services', PAYTM: 'Financial Services', POLICYBZR: 'Financial Services', JIOFIN: 'Financial Services',
  // IT
  TCS: 'IT', INFY: 'IT', WIPRO: 'IT', HCLTECH: 'IT', TECHM: 'IT', LTIM: 'IT', MPHASIS: 'IT', COFORGE: 'IT', PERSISTENT: 'IT', LTTS: 'IT', OFSS: 'IT', KPITTECH: 'IT', TATAELXSI: 'IT', CYIENT: 'IT',
  // Auto
  MARUTI: 'Auto', TATAMOTORS: 'Auto', 'M&M': 'Auto', BAJAJ_AUTO: 'Auto', 'BAJAJ-AUTO': 'Auto', HEROMOTOCO: 'Auto', EICHERMOT: 'Auto', TVSMOTOR: 'Auto', ASHOKLEY: 'Auto', BHARATFORG: 'Auto', MOTHERSON: 'Auto', BOSCHLTD: 'Auto', EXIDEIND: 'Auto', MRF: 'Auto', APOLLOTYRE: 'Auto', BALKRISIND: 'Auto', TIINDIA: 'Auto', SONACOMS: 'Auto', UNOMINDA: 'Auto',
  // Pharma / Healthcare
  SUNPHARMA: 'Pharma', DRREDDY: 'Pharma', CIPLA: 'Pharma', DIVISLAB: 'Pharma', APOLLOHOSP: 'Pharma', LUPIN: 'Pharma', AUROPHARMA: 'Pharma', TORNTPHARM: 'Pharma', ALKEM: 'Pharma', BIOCON: 'Pharma', GLENMARK: 'Pharma', LAURUSLABS: 'Pharma', MAXHEALTH: 'Pharma', FORTIS: 'Pharma', ZYDUSLIFE: 'Pharma', MANKIND: 'Pharma', GRANULES: 'Pharma', SYNGENE: 'Pharma', PPLPHARMA: 'Pharma',
  // FMCG
  ITC: 'FMCG', HINDUNILVR: 'FMCG', NESTLEIND: 'FMCG', BRITANNIA: 'FMCG', TATACONSUM: 'FMCG', DABUR: 'FMCG', MARICO: 'FMCG', GODREJCP: 'FMCG', COLPAL: 'FMCG', UNITDSPR: 'FMCG', VBL: 'FMCG', PATANJALI: 'FMCG', JUBLFOOD: 'FMCG',
  // Metals
  TATASTEEL: 'Metals', JSWSTEEL: 'Metals', HINDALCO: 'Metals', VEDL: 'Metals', COALINDIA: 'Metals', NMDC: 'Metals', SAIL: 'Metals', JINDALSTEL: 'Metals', NATIONALUM: 'Metals', HINDCOPPER: 'Metals', APLAPOLLO: 'Metals', HINDZINC: 'Metals',
  // Energy / Oil & Gas / Power
  RELIANCE: 'Energy', ONGC: 'Energy', NTPC: 'Energy', POWERGRID: 'Energy', BPCL: 'Energy', IOC: 'Energy', HINDPETRO: 'Energy', GAIL: 'Energy', TATAPOWER: 'Energy', ADANIGREEN: 'Energy', ADANIENSOL: 'Energy', JSWENERGY: 'Energy', NHPC: 'Energy', SJVN: 'Energy', OIL: 'Energy', PETRONET: 'Energy', IGL: 'Energy', MGL: 'Energy', TORNTPOWER: 'Energy', CESC: 'Energy', INOXWIND: 'Energy', SUZLON: 'Energy',
  // Infrastructure / Capital goods / Cement
  LT: 'Infrastructure', ADANIENT: 'Infrastructure', ADANIPORTS: 'Infrastructure', ULTRACEMCO: 'Infrastructure', GRASIM: 'Infrastructure', AMBUJACEM: 'Infrastructure', SHREECEM: 'Infrastructure', ACC: 'Infrastructure', DALBHARAT: 'Infrastructure', SIEMENS: 'Infrastructure', ABB: 'Infrastructure', BHEL: 'Infrastructure', BEL: 'Infrastructure', HAL: 'Infrastructure', CUMMINSIND: 'Infrastructure', POLYCAB: 'Infrastructure', HAVELLS: 'Infrastructure', IRCTC: 'Infrastructure', CONCOR: 'Infrastructure', GMRAIRPORT: 'Infrastructure', INDIGO: 'Infrastructure', RVNL: 'Infrastructure', IRB: 'Infrastructure', NCC: 'Infrastructure', KEI: 'Infrastructure', CGPOWER: 'Infrastructure', MAZDOCK: 'Infrastructure', BDL: 'Infrastructure', SOLARINDS: 'Infrastructure', KALYANKJIL: 'Consumer Durables',
  // Consumer Durables / Retail
  TITAN: 'Consumer Durables', ASIANPAINT: 'Consumer Durables', PIDILITIND: 'Consumer Durables', TRENT: 'Consumer Durables', DMART: 'Consumer Durables', VOLTAS: 'Consumer Durables', DIXON: 'Consumer Durables', PAGEIND: 'Consumer Durables', BERGEPAINT: 'Consumer Durables', CROMPTON: 'Consumer Durables', BLUESTARCO: 'Consumer Durables', NYKAA: 'Consumer Durables', ZOMATO: 'Consumer Durables', ETERNAL: 'Consumer Durables', NAUKRI: 'Consumer Durables', PVRINOX: 'Consumer Durables', DELHIVERY: 'Consumer Durables', SUPREMEIND: 'Consumer Durables', ASTRAL: 'Consumer Durables',
  // Realty
  DLF: 'Realty', GODREJPROP: 'Realty', OBEROIRLTY: 'Realty', LODHA: 'Realty', PRESTIGE: 'Realty', PHOENIXLTD: 'Realty',
  // Telecom
  BHARTIARTL: 'Telecom', IDEA: 'Telecom', INDUSTOWER: 'Telecom', TATACOMM: 'Telecom', HFCL: 'Telecom',
  // Chemicals (grouped under Other for index purposes)
  SRF: 'Other', PIIND: 'Other', UPL: 'Other', TATACHEM: 'Other', DEEPAKNTR: 'Other', AARTIIND: 'Other', NAVINFLUOR: 'Other', ATUL: 'Other', COROMANDEL: 'Other', CHAMBLFERT: 'Other', GNFC: 'Other',
};

export function sectorFor(symbol: string, isIndex: boolean): string {
  if (isIndex) return 'Index';
  return SECTOR_MAP[symbol] ?? 'Other';
}
