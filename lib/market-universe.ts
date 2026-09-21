export type MarketCompany={
  symbol:string;
  name:string;
  sector:string;
  industry:string;
  yahoo:string;
};

export const marketCompanies:MarketCompany[]=[
  {symbol:"HDFCBANK",name:"HDFC Bank",sector:"Financials",industry:"Private Banks",yahoo:"HDFCBANK.NS"},
  {symbol:"ICICIBANK",name:"ICICI Bank",sector:"Financials",industry:"Private Banks",yahoo:"ICICIBANK.NS"},
  {symbol:"SBIN",name:"State Bank of India",sector:"Financials",industry:"Public Banks",yahoo:"SBIN.NS"},
  {symbol:"BAJFINANCE",name:"Bajaj Finance",sector:"Financials",industry:"NBFC",yahoo:"BAJFINANCE.NS"},
  {symbol:"AXISBANK",name:"Axis Bank",sector:"Financials",industry:"Private Banks",yahoo:"AXISBANK.NS"},

  {symbol:"TCS",name:"TCS",sector:"Technology",industry:"IT Services",yahoo:"TCS.NS"},
  {symbol:"INFY",name:"Infosys",sector:"Technology",industry:"IT Services",yahoo:"INFY.NS"},
  {symbol:"HCLTECH",name:"HCLTech",sector:"Technology",industry:"IT Services",yahoo:"HCLTECH.NS"},
  {symbol:"WIPRO",name:"Wipro",sector:"Technology",industry:"IT Services",yahoo:"WIPRO.NS"},
  {symbol:"TECHM",name:"Tech Mahindra",sector:"Technology",industry:"IT Services",yahoo:"TECHM.NS"},

  {symbol:"RELIANCE",name:"Reliance Industries",sector:"Energy",industry:"Integrated Energy",yahoo:"RELIANCE.NS"},
  {symbol:"ONGC",name:"ONGC",sector:"Energy",industry:"Oil & Gas",yahoo:"ONGC.NS"},
  {symbol:"IOC",name:"Indian Oil",sector:"Energy",industry:"Refining",yahoo:"IOC.NS"},
  {symbol:"BPCL",name:"BPCL",sector:"Energy",industry:"Refining",yahoo:"BPCL.NS"},
  {symbol:"GAIL",name:"GAIL",sector:"Energy",industry:"Gas",yahoo:"GAIL.NS"},

  {symbol:"MARUTI",name:"Maruti Suzuki",sector:"Automobiles",industry:"Passenger Vehicles",yahoo:"MARUTI.NS"},
  {symbol:"M&M",name:"Mahindra & Mahindra",sector:"Automobiles",industry:"Auto & Farm",yahoo:"M&M.NS"},
  {symbol:"TATAMOTORS",name:"Tata Motors",sector:"Automobiles",industry:"Automobiles",yahoo:"TATAMOTORS.NS"},
  {symbol:"BAJAJ-AUTO",name:"Bajaj Auto",sector:"Automobiles",industry:"Two Wheelers",yahoo:"BAJAJ-AUTO.NS"},
  {symbol:"EICHERMOT",name:"Eicher Motors",sector:"Automobiles",industry:"Auto",yahoo:"EICHERMOT.NS"},

  {symbol:"HINDUNILVR",name:"Hindustan Unilever",sector:"Consumer Staples",industry:"FMCG",yahoo:"HINDUNILVR.NS"},
  {symbol:"ITC",name:"ITC",sector:"Consumer Staples",industry:"FMCG",yahoo:"ITC.NS"},
  {symbol:"NESTLEIND",name:"Nestle India",sector:"Consumer Staples",industry:"Foods",yahoo:"NESTLEIND.NS"},
  {symbol:"BRITANNIA",name:"Britannia",sector:"Consumer Staples",industry:"Foods",yahoo:"BRITANNIA.NS"},
  {symbol:"DABUR",name:"Dabur",sector:"Consumer Staples",industry:"FMCG",yahoo:"DABUR.NS"},

  {symbol:"TRENT",name:"Trent",sector:"Consumer Discretionary",industry:"Retail",yahoo:"TRENT.NS"},
  {symbol:"TITAN",name:"Titan",sector:"Consumer Discretionary",industry:"Jewellery & Lifestyle",yahoo:"TITAN.NS"},
  {symbol:"INDHOTEL",name:"Indian Hotels",sector:"Consumer Discretionary",industry:"Hotels",yahoo:"INDHOTEL.NS"},
  {symbol:"DMART",name:"Avenue Supermarts",sector:"Consumer Discretionary",industry:"Retail",yahoo:"DMART.NS"},
  {symbol:"JUBLFOOD",name:"Jubilant FoodWorks",sector:"Consumer Discretionary",industry:"Restaurants",yahoo:"JUBLFOOD.NS"},

  {symbol:"LT",name:"Larsen & Toubro",sector:"Industrials",industry:"Engineering",yahoo:"LT.NS"},
  {symbol:"SIEMENS",name:"Siemens India",sector:"Industrials",industry:"Industrial Equipment",yahoo:"SIEMENS.NS"},
  {symbol:"ABB",name:"ABB India",sector:"Industrials",industry:"Automation",yahoo:"ABB.NS"},
  {symbol:"CUMMINSIND",name:"Cummins India",sector:"Industrials",industry:"Engines",yahoo:"CUMMINSIND.NS"},
  {symbol:"CGPOWER",name:"CG Power",sector:"Industrials",industry:"Electrical Equipment",yahoo:"CGPOWER.NS"},

  {symbol:"TATASTEEL",name:"Tata Steel",sector:"Materials",industry:"Steel",yahoo:"TATASTEEL.NS"},
  {symbol:"HINDALCO",name:"Hindalco",sector:"Materials",industry:"Aluminium",yahoo:"HINDALCO.NS"},
  {symbol:"JSWSTEEL",name:"JSW Steel",sector:"Materials",industry:"Steel",yahoo:"JSWSTEEL.NS"},
  {symbol:"COALINDIA",name:"Coal India",sector:"Materials",industry:"Mining",yahoo:"COALINDIA.NS"},
  {symbol:"VEDL",name:"Vedanta",sector:"Materials",industry:"Diversified Metals",yahoo:"VEDL.NS"},

  {symbol:"SUNPHARMA",name:"Sun Pharma",sector:"Healthcare",industry:"Pharma",yahoo:"SUNPHARMA.NS"},
  {symbol:"DRREDDY",name:"Dr Reddy's",sector:"Healthcare",industry:"Pharma",yahoo:"DRREDDY.NS"},
  {symbol:"CIPLA",name:"Cipla",sector:"Healthcare",industry:"Pharma",yahoo:"CIPLA.NS"},
  {symbol:"APOLLOHOSP",name:"Apollo Hospitals",sector:"Healthcare",industry:"Hospitals",yahoo:"APOLLOHOSP.NS"},
  {symbol:"DIVISLAB",name:"Divi's Labs",sector:"Healthcare",industry:"Pharma",yahoo:"DIVISLAB.NS"},

  {symbol:"BHARTIARTL",name:"Bharti Airtel",sector:"Telecom",industry:"Telecom Services",yahoo:"BHARTIARTL.NS"},
  {symbol:"INDUSTOWER",name:"Indus Towers",sector:"Telecom",industry:"Telecom Infrastructure",yahoo:"INDUSTOWER.NS"},
  {symbol:"TATACOMM",name:"Tata Communications",sector:"Telecom",industry:"Enterprise Networks",yahoo:"TATACOMM.NS"},
  {symbol:"HFCL",name:"HFCL",sector:"Telecom",industry:"Telecom Equipment",yahoo:"HFCL.NS"},
  {symbol:"TEJASNET",name:"Tejas Networks",sector:"Telecom",industry:"Telecom Equipment",yahoo:"TEJASNET.NS"},

  {symbol:"NTPC",name:"NTPC",sector:"Utilities",industry:"Power Generation",yahoo:"NTPC.NS"},
  {symbol:"POWERGRID",name:"Power Grid",sector:"Utilities",industry:"Transmission",yahoo:"POWERGRID.NS"},
  {symbol:"TATAPOWER",name:"Tata Power",sector:"Utilities",industry:"Integrated Power",yahoo:"TATAPOWER.NS"},
  {symbol:"ADANIPOWER",name:"Adani Power",sector:"Utilities",industry:"Power Generation",yahoo:"ADANIPOWER.NS"},
  {symbol:"NHPC",name:"NHPC",sector:"Utilities",industry:"Hydro Power",yahoo:"NHPC.NS"},

  {symbol:"DLF",name:"DLF",sector:"Real Estate",industry:"Real Estate",yahoo:"DLF.NS"},
  {symbol:"GODREJPROP",name:"Godrej Properties",sector:"Real Estate",industry:"Real Estate",yahoo:"GODREJPROP.NS"},
  {symbol:"OBEROIRLTY",name:"Oberoi Realty",sector:"Real Estate",industry:"Real Estate",yahoo:"OBEROIRLTY.NS"},
  {symbol:"PRESTIGE",name:"Prestige Estates",sector:"Real Estate",industry:"Real Estate",yahoo:"PRESTIGE.NS"},
  {symbol:"PHOENIXLTD",name:"Phoenix Mills",sector:"Real Estate",industry:"Retail Real Estate",yahoo:"PHOENIXLTD.NS"},

  {symbol:"HAL",name:"Hindustan Aeronautics",sector:"Defence",industry:"Aerospace",yahoo:"HAL.NS"},
  {symbol:"BEL",name:"Bharat Electronics",sector:"Defence",industry:"Defence Electronics",yahoo:"BEL.NS"},
  {symbol:"BDL",name:"Bharat Dynamics",sector:"Defence",industry:"Missiles",yahoo:"BDL.NS"},
  {symbol:"MAZDOCK",name:"Mazagon Dock",sector:"Defence",industry:"Shipbuilding",yahoo:"MAZDOCK.NS"},
  {symbol:"GRSE",name:"GRSE",sector:"Defence",industry:"Shipbuilding",yahoo:"GRSE.NS"},

  {symbol:"ADANIPORTS",name:"Adani Ports",sector:"Infrastructure",industry:"Ports",yahoo:"ADANIPORTS.NS"},
  {symbol:"IRCTC",name:"IRCTC",sector:"Infrastructure",industry:"Rail Services",yahoo:"IRCTC.NS"},
  {symbol:"CONCOR",name:"Container Corp",sector:"Infrastructure",industry:"Logistics",yahoo:"CONCOR.NS"},
  {symbol:"RVNL",name:"RVNL",sector:"Infrastructure",industry:"Rail Infrastructure",yahoo:"RVNL.NS"},
  {symbol:"IRB",name:"IRB Infrastructure",sector:"Infrastructure",industry:"Roads",yahoo:"IRB.NS"},

  {symbol:"PIDILITIND",name:"Pidilite",sector:"Chemicals",industry:"Specialty Chemicals",yahoo:"PIDILITIND.NS"},
  {symbol:"SRF",name:"SRF",sector:"Chemicals",industry:"Specialty Chemicals",yahoo:"SRF.NS"},
  {symbol:"UPL",name:"UPL",sector:"Chemicals",industry:"Agrochemicals",yahoo:"UPL.NS"},
  {symbol:"DEEPAKNTR",name:"Deepak Nitrite",sector:"Chemicals",industry:"Chemicals",yahoo:"DEEPAKNTR.NS"},
  {symbol:"AARTIIND",name:"Aarti Industries",sector:"Chemicals",industry:"Specialty Chemicals",yahoo:"AARTIIND.NS"},

  {symbol:"PIIND",name:"PI Industries",sector:"Agriculture",industry:"Agri Inputs",yahoo:"PIIND.NS"},
  {symbol:"COROMANDEL",name:"Coromandel International",sector:"Agriculture",industry:"Fertilisers",yahoo:"COROMANDEL.NS"},
  {symbol:"GODREJAGRO",name:"Godrej Agrovet",sector:"Agriculture",industry:"Agribusiness",yahoo:"GODREJAGRO.NS"},
  {symbol:"BALRAMCHIN",name:"Balrampur Chini",sector:"Agriculture",industry:"Sugar",yahoo:"BALRAMCHIN.NS"},
  {symbol:"AVANTIFEED",name:"Avanti Feeds",sector:"Agriculture",industry:"Aquaculture",yahoo:"AVANTIFEED.NS"},

  {symbol:"SUNTV",name:"Sun TV Network",sector:"Media",industry:"Broadcasting",yahoo:"SUNTV.NS"},
  {symbol:"ZEEL",name:"Zee Entertainment",sector:"Media",industry:"Broadcasting",yahoo:"ZEEL.NS"},
  {symbol:"PVRINOX",name:"PVR INOX",sector:"Media",industry:"Exhibition",yahoo:"PVRINOX.NS"},
  {symbol:"NAZARA",name:"Nazara Technologies",sector:"Media",industry:"Gaming",yahoo:"NAZARA.NS"},
  {symbol:"SAREGAMA",name:"Saregama India",sector:"Media",industry:"Music",yahoo:"SAREGAMA.NS"}
];

export const marketSectors=[...new Set(marketCompanies.map(x=>x.sector))];
