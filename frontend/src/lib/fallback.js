/* Rich fallback data — 9 herbs, realistic variance, shown while AI loads */

const jitter = (v, pct=0.06) => Math.round(v * (1 + (Math.random()-0.5)*2*pct));

export const FALLBACK = {
  kpis: {
    yield:    { value:1248, unit:"kg",  change:8.4,  trend:"up",   good:"up",   label:"Total Yield"  },
    water:    { value:8380, unit:"L",   change:-5.2, trend:"down", good:"down", label:"Water Usage"  },
    power:    { value:339,  unit:"kWh", change:-3.1, trend:"down", good:"down", label:"Power Usage"  },
    delivery: { value:2.4,  unit:"hrs", change:-12.5,trend:"down", good:"down", label:"Avg Delivery" },
  },

  revenue: [
    {week:"W1",revenue:24600,basil:4200,mint:3100,lettuce:2800,spinach:2300,coriander:1800,rosemary:2200,thyme:1950,parsley:980, chives:1270},
    {week:"W2",revenue:28100,basil:4800,mint:3400,lettuce:2900,spinach:2700,coriander:2100,rosemary:2450,thyme:2200,parsley:1100,chives:1450},
    {week:"W3",revenue:23530,basil:3900,mint:2800,lettuce:2700,spinach:2500,coriander:1700,rosemary:2050,thyme:1800,parsley:900, chives:1180},
    {week:"W4",revenue:31800,basil:5400,mint:3800,lettuce:3200,spinach:2800,coriander:2400,rosemary:2800,thyme:2500,parsley:1250,chives:1650},
    {week:"W5",revenue:30550,basil:5100,mint:3500,lettuce:3100,spinach:2900,coriander:2200,rosemary:2700,thyme:2400,parsley:1200,chives:1550},
    {week:"W6",revenue:35450,basil:5900,mint:4100,lettuce:3500,spinach:3300,coriander:2600,rosemary:3100,thyme:2750,parsley:1380,chives:1820},
    {week:"W7",revenue:38550,basil:6200,mint:4300,lettuce:3600,spinach:3400,coriander:2700,rosemary:3300,thyme:2900,parsley:1450,chives:1950},
    {week:"W8",revenue:42600,basil:6600,mint:4600,lettuce:3800,spinach:3500,coriander:2900,rosemary:3500,thyme:3100,parsley:1550,chives:2100},
  ],

  sensors: {
    temperature:{ value:24.2, unit:"degC", status:"Optimal", range:"21-26" },
    humidity:   { value:67.5, unit:"%",    status:"Optimal", range:"60-75" },
    co2:        { value:419,  unit:"ppm",  status:"Normal",  range:"380-600" },
    light:      { value:845,  unit:"lux",  status:"Optimal", range:"700-1000" },
    ph:         { value:6.2,  unit:"pH",   status:"Optimal", range:"5.8-6.8" },
  },

  health: {
    overall:84, grade:"A", verdict:"Excellent",
    breakdown:{ yield_performance:83, resource_efficiency:90, delivery_excellence:82, chef_satisfaction:88, revenue_health:80 },
    summary:"Farm performs well above industry average across all metrics.",
    top_strength:"Water efficiency 25% above industry", top_risk:"Chef partnerships at 72% of target",
  },

  insights:{ insights:[
    {title:"Basil Demand Surge",    description:"Summer menus driving 38% more basil orders. Increase Zone A now.",          impact:"High",   action:"Plant 20% more basil",     metric:"Rs.28K opportunity"},
    {title:"Rosemary Premium Boom", description:"Rosemary pricing up 12% vs last month — festival menus driving demand.",    impact:"High",   action:"Increase Zone A Rosemary", metric:"Rs.18K opportunity"},
    {title:"Zone B Water Leak",     description:"Water +11.7% above baseline — suspected drip line blockage.",                impact:"High",   action:"Inspect Zone B",           metric:"Rs.850/week waste"},
    {title:"LED Efficiency Win",    description:"LED schedule optimisation cut power 3.1% this month.",                       impact:"Low",    action:"Maintain schedule",        metric:"Rs.210 saved"},
  ]},

  freshness: [
    {herb:"Basil",    freshness_days:4.5,best_by:"4d 12h",stock_kg:48,zone:"A",harvested:"Today 6AM",  wilt_alert:false,quality:"Excellent",color:"emerald",trend_24h:[4.9,4.85,4.8,4.75,4.7,4.65,4.6,4.55,4.5,4.45,4.4,4.35,4.3,4.25,4.2,4.15,4.1,4.05,4.0,3.95,3.9,3.85,3.8,3.75]},
    {herb:"Mint",     freshness_days:5.0,best_by:"5d 0h", stock_kg:32,zone:"B",harvested:"Today 5AM",  wilt_alert:false,quality:"Excellent",color:"emerald",trend_24h:[5.4,5.35,5.3,5.25,5.2,5.15,5.1,5.05,5.0,4.95,4.9,4.85,4.8,4.75,4.7,4.65,4.6,4.55,4.5,4.45,4.4,4.35,4.3,4.25]},
    {herb:"Rosemary", freshness_days:6.8,best_by:"6d 19h",stock_kg:10,zone:"A",harvested:"2 days ago", wilt_alert:false,quality:"Excellent",color:"emerald",trend_24h:[7.2,7.15,7.1,7.05,7.0,6.95,6.9,6.85,6.8,6.75,6.7,6.65,6.6,6.55,6.5,6.45,6.4,6.35,6.3,6.25,6.2,6.15,6.1,6.05]},
    {herb:"Thyme",    freshness_days:7.2,best_by:"7d 4h", stock_kg:9, zone:"A",harvested:"2 days ago", wilt_alert:false,quality:"Excellent",color:"emerald",trend_24h:[7.6,7.55,7.5,7.45,7.4,7.35,7.3,7.25,7.2,7.15,7.1,7.05,7.0,6.95,6.9,6.85,6.8,6.75,6.7,6.65,6.6,6.55,6.5,6.45]},
    {herb:"Parsley",  freshness_days:4.1,best_by:"4d 2h", stock_kg:22,zone:"C",harvested:"Today 6AM",  wilt_alert:false,quality:"Good",    color:"emerald",trend_24h:[4.5,4.45,4.4,4.35,4.3,4.25,4.2,4.15,4.1,4.05,4.0,3.95,3.9,3.85,3.8,3.75,3.7,3.65,3.6,3.55,3.5,3.45,3.4,3.35]},
    {herb:"Chives",   freshness_days:5.3,best_by:"5d 7h", stock_kg:13,zone:"B",harvested:"Yesterday",  wilt_alert:false,quality:"Good",    color:"emerald",trend_24h:[5.7,5.65,5.6,5.55,5.5,5.45,5.4,5.35,5.3,5.25,5.2,5.15,5.1,5.05,5.0,4.95,4.9,4.85,4.8,4.75,4.7,4.65,4.6,4.55]},
    {herb:"Coriander",freshness_days:3.8,best_by:"3d 19h",stock_kg:14,zone:"A",harvested:"Yesterday",  wilt_alert:false,quality:"Good",    color:"emerald",trend_24h:[4.2,4.15,4.1,4.05,4.0,3.95,3.9,3.85,3.8,3.75,3.7,3.65,3.6,3.55,3.5,3.45,3.4,3.35,3.3,3.25,3.2,3.15,3.1,3.05]},
    {herb:"Lettuce",  freshness_days:3.5,best_by:"3d 12h",stock_kg:27,zone:"C",harvested:"Yesterday",  wilt_alert:false,quality:"Good",    color:"emerald",trend_24h:[3.9,3.85,3.8,3.75,3.7,3.65,3.6,3.55,3.5,3.45,3.4,3.35,3.3,3.25,3.2,3.15,3.1,3.05,3.0,2.95,2.9,2.85,2.8,2.75]},
    {herb:"Spinach",  freshness_days:1.8,best_by:"1d 19h",stock_kg:19,zone:"B",harvested:"Today 7AM",  wilt_alert:true, quality:"Urgent",  color:"red",    trend_24h:[2.2,2.15,2.1,2.05,2.0,1.95,1.9,1.85,1.8,1.75,1.7,1.65,1.6,1.55,1.5,1.45,1.4,1.35,1.3,1.25,1.2,1.15,1.1,1.05]},
  ],

  market: {
    market_status:"Open", last_updated:"Live", total_herbs:9,
    gainers:5, losers:3, market_sentiment:"Bullish",
    tickers:[
      {herb:"Basil",    price:294,change:5.0, trend:"bullish",history:[268,271,278,275,282,280,285,275,288,284,290,287,292,289,294,291,296,293,298,295,300,297,302,299,304,301,306,303,308,305,298,295,292,289,286,283,280,283,286,289,292,295,298,301,304,294,291,288,285,289,292,295,298,301,294,292,289,287,291,294],volume_kg:218,market_cap:"Rs.64,092",sector:"Premium Herbs",week_high:312,week_low:262,rsi:62.4,ma_20:287,beta:1.4,ohlc:{open:289,high:301,low:285,close:294}},
      {herb:"Rosemary", price:338,change:6.2, trend:"bullish",history:[295,298,302,305,310,307,312,309,315,312,318,315,320,317,322,319,325,322,328,325,330,327,332,329,335,332,338,335,340,337,332,329,326,323,320,317,314,317,320,323,326,329,332,335,338,341,338,335,332,335,338,341,338,335,330,328,332,335,338,342],volume_kg:142,market_cap:"Rs.48,132",sector:"Premium Herbs",  week_high:355,week_low:290,rsi:68.2,ma_20:322,beta:1.6,ohlc:{open:330,high:344,low:326,close:338}},
      {herb:"Thyme",    price:308,change:4.1, trend:"bullish",history:[278,281,285,282,288,285,291,288,294,291,297,294,300,297,303,300,306,303,308,305,308,305,302,305,308,305,302,305,308,311,306,303,300,297,294,291,288,291,294,297,300,303,306,303,300,303,306,309,312,309,306,303,300,303,306,309,308,305,308,312],volume_kg:128,market_cap:"Rs.43,124",sector:"Premium Herbs",  week_high:324,week_low:276,rsi:58.7,ma_20:298,beta:1.5,ohlc:{open:302,high:315,low:298,close:308}},
      {herb:"Chives",   price:204,change:2.8, trend:"bullish",history:[185,187,190,188,192,190,194,192,196,194,198,196,200,198,202,200,204,202,206,204,202,200,198,200,202,204,202,200,198,200,202,204,206,204,202,200,198,200,202,204,206,208,206,204,202,200,198,200,202,204,206,208,210,208,206,204,202,200,204,208],volume_kg:98, market_cap:"Rs.20,808",sector:"Aromatic Herbs", week_high:215,week_low:183,rsi:54.3,ma_20:199,beta:1.3,ohlc:{open:198,high:210,low:195,close:204}},
      {herb:"Coriander",price:152,change:4.8, trend:"bullish",history:[135,137,140,138,142,140,144,142,146,144,148,146,150,148,152,150,154,152,150,148,146,148,150,152,150,148,146,148,150,152,154,152,150,148,146,144,142,144,146,148,150,152,154,156,154,152,150,148,146,148,150,152,154,156,158,156,154,152,154,158],volume_kg:86, market_cap:"Rs.13,832",sector:"Spice Herbs",    week_high:165,week_low:133,rsi:59.1,ma_20:148,beta:1.2,ohlc:{open:146,high:159,low:143,close:152}},
      {herb:"Mint",     price:171,change:-5.0,trend:"bearish",history:[192,188,185,182,180,178,175,173,171,169,167,169,171,173,175,173,171,169,167,165,167,169,171,173,175,173,171,169,167,165,167,169,171,173,171,169,167,165,163,165,167,169,171,173,171,169,167,169,171,173,171,169,167,165,167,169,171,171,171,171],volume_kg:142,market_cap:"Rs.24,282",sector:"Aromatic Herbs", week_high:198,week_low:161,rsi:38.2,ma_20:178,beta:1.1,ohlc:{open:178,high:182,low:166,close:171}},
      {herb:"Lettuce",  price:122,change:1.7, trend:"stable", history:[115,116,118,117,119,118,120,119,121,120,122,121,123,122,124,123,122,121,120,121,122,123,124,123,122,121,120,119,120,121,122,123,122,121,120,119,118,119,120,121,122,123,122,121,120,119,118,119,120,121,122,121,120,119,120,121,122,121,122,123],volume_kg:95, market_cap:"Rs.11,590",sector:"Salad Greens",   week_high:130,week_low:112,rsi:48.6,ma_20:120,beta:0.8,ohlc:{open:119,high:126,low:117,close:122}},
      {herb:"Parsley",  price:108,change:-2.1,trend:"bearish",history:[118,116,114,112,110,108,110,108,106,108,110,108,106,108,110,108,106,104,106,108,110,108,106,104,106,108,110,108,106,108,110,108,106,104,102,104,106,108,110,112,110,108,106,108,110,108,106,104,106,108,106,104,102,104,106,108,110,108,106,108],volume_kg:74, market_cap:"Rs.8,532",sector:"Salad Greens",   week_high:122,week_low:100,rsi:42.1,ma_20:110,beta:0.7,ohlc:{open:112,high:115,low:104,close:108}},
      {herb:"Spinach",  price:90, change:-5.3,trend:"bearish",history:[102,100,98, 96, 94, 92, 90, 92, 94, 92, 90, 88, 90, 92, 90, 88, 86, 88, 90, 92, 90, 88, 86, 84, 86, 88, 90, 88, 86, 84, 86, 88, 90, 88, 86, 84, 82, 84, 86, 88, 90, 92, 90, 88, 86, 84, 82, 84, 86, 88, 90, 88, 86, 84, 82, 84, 86, 88, 90, 90],volume_kg:78, market_cap:"Rs.7,020",sector:"Leafy Greens",   week_high:108,week_low:80, rsi:28.4,ma_20:92,  beta:0.9,ohlc:{open:96, high:98, low:86, close:90}},
    ],
  },

  waste: {
    total_waste_kg:22, total_revenue_saved:7840, flash_sale_count:4, total_herbs:9,
    eco_summary:"Farm saved ~64.2 kg CO2 vs traditional farming this week.",
    donations_possible:[{herb:"Lettuce",kg:3},{herb:"Parsley",kg:2},{herb:"Spinach",kg:1}],
    alerts:[
      {herb:"Lettuce",  excess_kg:8, zone:"C",shelf_days:4,urgency:"Critical",normal_price:120,flash_price:84, flash_sale:"8kg Lettuce @ Rs.84/kg (30% OFF)",  revenue_saved:672, donation:"Donate 3kg to NGO",  action_by:"Today 6 PM",  expiry_risk:"High"},
      {herb:"Parsley",  excess_kg:8, zone:"C",shelf_days:5,urgency:"High",    normal_price:110,flash_price:77, flash_sale:"8kg Parsley @ Rs.77/kg (30% OFF)",  revenue_saved:616, donation:"Donate 2kg to NGO",  action_by:"Today 6 PM",  expiry_risk:"Medium"},
      {herb:"Basil",    excess_kg:6, zone:"A",shelf_days:5,urgency:"High",    normal_price:280,flash_price:196,flash_sale:"6kg Basil @ Rs.196/kg (30% OFF)",   revenue_saved:1176,donation:"Donate 2kg to shelter",action_by:"Today 8 PM",  expiry_risk:"Medium"},
      {herb:"Rosemary", excess_kg:4, zone:"A",shelf_days:8,urgency:"Medium",  normal_price:320,flash_price:224,flash_sale:"4kg Rosemary @ Rs.224/kg (30% OFF)",revenue_saved:896, donation:"Donate 1kg to NGO",  action_by:"Tomorrow AM", expiry_risk:"Low"},
      {herb:"Mint",     excess_kg:-3,zone:"B",shelf_days:6,urgency:"Restock", normal_price:180,flash_price:0,  flash_sale:"Shortage: need 3kg more",           revenue_saved:0,   donation:"",                   action_by:"Tomorrow AM", expiry_risk:"None"},
    ],
    carbon_scores:[
      {herb:"Basil",    zone:"A",score:0.80,badge:"Green",   total_saved_kg_co2:27.6,shelf_days:5},
      {herb:"Mint",     zone:"B",score:0.60,badge:"Green",   total_saved_kg_co2:13.8,shelf_days:6},
      {herb:"Rosemary", zone:"A",score:0.90,badge:"Green",   total_saved_kg_co2:8.1, shelf_days:8},
      {herb:"Thyme",    zone:"A",score:0.85,badge:"Green",   total_saved_kg_co2:6.9, shelf_days:8},
      {herb:"Coriander",zone:"A",score:0.50,badge:"Green",   total_saved_kg_co2:5.0, shelf_days:5},
      {herb:"Chives",   zone:"B",score:0.75,badge:"Green",   total_saved_kg_co2:7.3, shelf_days:6},
      {herb:"Parsley",  zone:"C",score:0.65,badge:"Green",   total_saved_kg_co2:10.2,shelf_days:5},
      {herb:"Lettuce",  zone:"C",score:1.10,badge:"Moderate",total_saved_kg_co2:21.4,shelf_days:4},
      {herb:"Spinach",  zone:"B",score:0.70,badge:"Green",   total_saved_kg_co2:9.6, shelf_days:4},
    ],
  },

  wow:[
    {metric:"Crop Yield",   this_week:312,last_week:285,unit:"kg",  change:9.5, good:"up"},
    {metric:"Water Usage",  this_week:2085,last_week:2280,unit:"L", change:-8.6,good:"down"},
    {metric:"Power",        this_week:84, last_week:91, unit:"kWh", change:-7.7,good:"down"},
    {metric:"Chef Orders",  this_week:49, last_week:41, unit:"",    change:19.5,good:"up"},
    {metric:"Zero-Waste",   this_week:4,  last_week:2,  unit:" days",change:100,good:"up"},
  ],

  crops:[
    {name:"Basil",    value:28,revenue:29300,yield_kg:518},
    {name:"Rosemary", value:18,revenue:22400,yield_kg:198},
    {name:"Thyme",    value:14,revenue:18700,yield_kg:176},
    {name:"Mint",     value:12,revenue:16200,yield_kg:347},
    {name:"Coriander",value:10,revenue:13100,yield_kg:188},
    {name:"Lettuce",  value: 8,revenue:10800,yield_kg:227},
    {name:"Chives",   value: 5,revenue: 8900,yield_kg:142},
    {name:"Spinach",  value: 3,revenue: 6500,yield_kg:148},
    {name:"Parsley",  value: 2,revenue: 4200,yield_kg:112},
  ],

  benchmarks:[
    {metric:"Yield per sqm",    yours:4.8,industry:3.9, unit:"kg",   better:true},
    {metric:"Water per kg",     yours:2.1,industry:2.8, unit:"L/kg", better:true},
    {metric:"Power per kg",     yours:0.28,industry:0.31,unit:"kWh", better:true},
    {metric:"Avg Delivery",     yours:2.4,industry:3.2, unit:"hrs",  better:true},
    {metric:"Herbs per sq.ft",  yours:3.2,industry:2.6, unit:"",     better:true},
    {metric:"Chef Retention",   yours:91, industry:74,  unit:"%",    better:true},
  ],

  goals:[
    {goal:"Monthly Yield",    current:1248, target:1500, unit:"kg"},
    {goal:"Revenue",          current:63800,target:80000,unit:"Rs."},
    {goal:"Chef Partners",    current:18,   target:25,   unit:""},
    {goal:"Water Efficiency", current:82,   target:90,   unit:"%"},
    {goal:"Zero-Waste Days",  current:12,   target:20,   unit:" days"},
    {goal:"Herb Varieties",   current:9,    target:12,   unit:""},
  ],

  forecast:{
    forecast:[
      {week:"W9", yield:342,lower:325,upper:358,confidence:"High"},
      {week:"W10",yield:358,lower:338,upper:378,confidence:"High"},
      {week:"W11",yield:368,lower:342,upper:394,confidence:"Medium"},
      {week:"W12",yield:382,lower:350,upper:414,confidence:"Medium"},
    ],
    trend:"Upward", growth_rate:"+4.8%",
    reasoning:"Zone C expansion + Rosemary/Thyme premium demand supports strong growth through Q3.",
  },

  recommendations:{recommendations:[
    {title:"Expand Basil + Rosemary",  description:"Festival demand +38% — plant 20kg Basil + 8kg Rosemary in Zone A today.",  priority:"High",   timeline:"Today",      expected_impact:"+Rs.28,500/month"},
    {title:"Fix Zone B Drip Line",     description:"Water +11.7% above baseline — blockage wastes Rs.850/week.",                priority:"High",   timeline:"48 hours",   expected_impact:"Rs.850 saving/week"},
    {title:"Add 4 Chef Partners",      description:"At 18/25 target. One new chef = avg Rs.3,200/month. Target cloud kitchens.", priority:"Medium", timeline:"This month", expected_impact:"+Rs.12,800/month"},
    {title:"Raise Basil to Rs.315/kg", description:"Currently Rs.35 below market despite premium quality + 2.4hr delivery.",    priority:"Medium", timeline:"Next week",  expected_impact:"+Rs.18,130/month"},
  ]},

  overview:{top_category:"Basil",peak_day:"Thursday",avg_order_value:512,return_rate:3.8,satisfaction:4.7,total_orders:148,new_chefs:2},

  demandAlerts:{ alerts:[
    {crop:"Basil",    demand_change:"+38%", period:"Next 2 weeks", urgency:"Critical",current_stock_kg:180,required_kg:248,reason:"Pesto season + food festivals",action:"Increase Zone A planting",deadline:"3 days"},
    {crop:"Rosemary", demand_change:"+22%", period:"This week",    urgency:"High",   current_stock_kg:42, required_kg:51,  reason:"Wedding season garnish demand",action:"Harvest early batch",      deadline:"5 days"},
    {crop:"Mint",     demand_change:"-12%", period:"Next week",    urgency:"Medium", current_stock_kg:120,required_kg:105, reason:"Seasonal dip in beverage orders",action:"Reduce harvest rate",     deadline:"1 week"},
  ], total_revenue_opportunity:"Rs.42,800"},

  priceOptimize:{ recommendations:[
    {crop:"Basil",    current_price:"Rs.280/kg",suggested_price:"Rs.315/kg",market_avg:"Rs.310/kg",price_gap:"-9.7%",justification:"Below market despite premium quality",expected_revenue_change:"+Rs.18,130/month",risk:"Low"},
    {crop:"Rosemary", current_price:"Rs.320/kg",suggested_price:"Rs.360/kg",market_avg:"Rs.355/kg",price_gap:"-9.9%",justification:"Festival demand surge supports premium",expected_revenue_change:"+Rs.11,200/month",risk:"Low"},
  ], total_revenue_uplift:"Rs.38,200/month"},

  seasonal:{ predictions:[
    {herb:"Basil",    demand_index:92,season:"Peak",  menu_fit:"Summer salads, pestos, chilled soups",    demand_forecast:"+42%",revenue_potential:"Rs.29,400",confidence:"High"},
    {herb:"Rosemary", demand_index:88,season:"Peak",  menu_fit:"Festival garnishes, roast menus",          demand_forecast:"+28%",revenue_potential:"Rs.22,400",confidence:"High"},
    {herb:"Mint",     demand_index:78,season:"Steady",menu_fit:"Mocktails, raita, summer beverages",       demand_forecast:"+20%",revenue_potential:"Rs.14,800",confidence:"High"},
    {herb:"Coriander",demand_index:82,season:"High",  menu_fit:"Festival curries, chutneys, biryanis",     demand_forecast:"+18%",revenue_potential:"Rs.9,600", confidence:"Medium"},
    {herb:"Thyme",    demand_index:75,season:"Steady",menu_fit:"Continental menus, slow-cooked dishes",    demand_forecast:"+15%",revenue_potential:"Rs.12,500",confidence:"Medium"},
  ], season_summary:"Summer + festival demand peaks through July. Premium herbs (Basil, Rosemary) lead.",
     top_opportunity:"Basil — highest margin + highest demand surge", plant_this_week:["Basil","Rosemary","Mint"]},

  anomaly:{ anomalies:[
    {sensor:"water",   message:"Zone B water 11.7% above baseline",severity:"High",  action:"Inspect Zone B drip line"},
    {sensor:"humidity",message:"Zone C humidity dipped to 58% at 3AM",severity:"Medium",action:"Check misting schedule"},
  ], all_clear:false},

  wasteAI:{
    strategy:"Lettuce (8kg) and Parsley (8kg) are highest spoilage risks — launch simultaneous flash sales before 6 PM.",
    priority_actions:[
      "Launch Lettuce flash sale Rs.84/kg — clear 8kg by 6 PM before shelf expiry",
      "Bundle Parsley + Chives as 'chef herb mix' at Rs.180/pack — clears 6kg today",
      "Pre-book Basil + Rosemary for festival caterers (demand +38%) at locked-in price",
      "Donate 5kg surplus to NGO today — qualifies for green certification badge"
    ],
    revenue_opportunity:"Rs.4,800",
    sustainability_tip:"Zero-waste run saves 12.4kg CO2 — share on social for chef engagement.",
    festival_prep:"Pre-sell 20kg Basil + 8kg Rosemary to festival partners this week.",
    risk_warning:"Lettuce shelf life critical — 4 days only, act before 6 PM today."
  },
};
